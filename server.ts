import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildGaiaSystemInstruction } from './src/services/gaiaPersona.mjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const isProduction = process.env.NODE_ENV === 'production';
  let port = 3000;
  const portArgIdx = process.argv.indexOf('--port');
  if (portArgIdx !== -1 && process.argv[portArgIdx + 1]) {
    const parsed = parseInt(process.argv[portArgIdx + 1], 10);
    if (!isNaN(parsed)) port = parsed;
  }
  if (process.env.PORT) {
    const parsed = parseInt(process.env.PORT, 10);
    if (!isNaN(parsed)) port = parsed;
  }
  const PORT = port;

  app.use(express.json());

  // =========================================================================
  // RESILIENT MULTI-KEY FALLBACK OPTIMIZATION ENGINE
  // Ensures always-on, always-available status across quota & rate-limit events
  // =========================================================================
  interface ManagedApiKey {
    index: number;
    id: string; // Masked: e.g. "AIza...4f9b"
    key: string;
    source: string;
    consecutiveFailures: number;
    totalCalls: number;
    lastUsed: number;
    cooldownUntil: number;
    lastError: string | null;
  }

  class ResilientApiKeyPool {
    private keys: ManagedApiKey[] = [];
    private activeIndex = 0;
    private totalRotations = 0;
    private clients: Map<string, GoogleGenAI> = new Map();

    constructor() {
      this.reloadKeys();
    }

    public reloadKeys() {
      const rawKeys: { key: string; source: string }[] = [];

      if (process.env.GEMINI_API_KEY?.trim()) {
        rawKeys.push({ key: process.env.GEMINI_API_KEY.trim(), source: 'GEMINI_API_KEY' });
      }

      const candidateEnvVars = [
        'GEMINI_API_KEY_FALLBACK',
        'GEMINI_API_KEY_BACKUP',
        'GEMINI_BACKUP_KEY',
        'GEMINI_API_KEY_SECONDARY',
        'GEMINI_API_KEY_2',
        'GEMINI_API_KEY_3',
        'API_KEY_FALLBACK',
      ];
      for (const envVar of candidateEnvVars) {
        const val = process.env[envVar]?.trim();
        if (val && !rawKeys.some((k) => k.key === val)) {
          rawKeys.push({ key: val, source: envVar });
        }
      }

      if (process.env.GEMINI_API_KEYS?.trim()) {
        const splits = process.env.GEMINI_API_KEYS.split(',')
          .map((k) => k.trim())
          .filter(Boolean);
        splits.forEach((k, idx) => {
          if (!rawKeys.some((item) => item.key === k)) {
            rawKeys.push({ key: k, source: `GEMINI_API_KEYS[${idx}]` });
          }
        });
      }

      this.keys = rawKeys.map((item, idx) => ({
        index: idx,
        id: item.key.length > 8 ? `${item.key.slice(0, 4)}...${item.key.slice(-4)}` : `Key-${idx + 1}`,
        key: item.key,
        source: item.source,
        consecutiveFailures: 0,
        totalCalls: 0,
        lastUsed: 0,
        cooldownUntil: 0,
        lastError: null,
      }));
    }

    public hasKeys(): boolean {
      return this.keys.length > 0;
    }

    public getPoolStatus() {
      const now = Date.now();
      return {
        poolSize: this.keys.length,
        activeIndex: this.activeIndex,
        activeKeyId: this.keys[this.activeIndex]?.id || 'None',
        totalRotations: this.totalRotations,
        isOptimizedFallbackEnabled: this.keys.length > 1,
        keys: this.keys.map((k) => ({
          index: k.index,
          id: k.id,
          source: k.source,
          totalCalls: k.totalCalls,
          consecutiveFailures: k.consecutiveFailures,
          isAvailable: now >= k.cooldownUntil,
          cooldownRemainingSec: Math.max(0, Math.ceil((k.cooldownUntil - now) / 1000)),
          lastError: k.lastError,
        })),
      };
    }

    private getClientForKey(key: string): GoogleGenAI {
      if (!this.clients.has(key)) {
        this.clients.set(
          key,
          new GoogleGenAI({
            apiKey: key,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build-resilient-fallback',
              },
            },
          })
        );
      }
      return this.clients.get(key)!;
    }

    public async executeWithFallback<T>(
      operation: (ai: GoogleGenAI, keyInfo: ManagedApiKey) => Promise<T>
    ): Promise<{ result: T; keyUsed: ManagedApiKey }> {
      if (this.keys.length === 0) {
        throw new Error('No API keys configured in pool');
      }

      const now = Date.now();
      const attempts = this.keys.length;
      let lastError: any = null;

      for (let i = 0; i < attempts; i++) {
        const candidateIndex = (this.activeIndex + i) % this.keys.length;
        const keyInfo = this.keys[candidateIndex];

        if (now < keyInfo.cooldownUntil && attempts > 1) {
          continue;
        }

        try {
          const client = this.getClientForKey(keyInfo.key);
          keyInfo.totalCalls++;
          keyInfo.lastUsed = Date.now();

          const result = await operation(client, keyInfo);

          keyInfo.consecutiveFailures = 0;
          keyInfo.lastError = null;
          if (this.activeIndex !== candidateIndex) {
            console.log(`[ApiKeyPool] Successfully rotated to fallback key: ${keyInfo.id} (${keyInfo.source})`);
            this.activeIndex = candidateIndex;
            this.totalRotations++;
          }
          return { result, keyUsed: keyInfo };
        } catch (err: any) {
          lastError = err;
          keyInfo.consecutiveFailures++;
          keyInfo.lastError = err?.message || String(err);

          const isRateLimit = err?.status === 429 || /rate|quota|exhaust|limit/i.test(err?.message || '');
          const cooldownSec = isRateLimit ? 45 : 15;
          keyInfo.cooldownUntil = Date.now() + cooldownSec * 1000;

          console.warn(
            `[ApiKeyPool] Key ${keyInfo.id} (${keyInfo.source}) failed: ${err?.message}. Rotating to next fallback candidate in pool...`
          );
        }
      }

      throw lastError || new Error('All API keys in fallback pool exhausted');
    }
  }

  const apiKeyPool = new ResilientApiKeyPool();

  // API Key Pool Telemetry Endpoint (Safe: exposes zero secret strings)
  app.get('/api/key-status', (_req, res) => {
    return res.json(apiKeyPool.getPoolStatus());
  });

  // Actual runtime discovery. Static hosting cannot serve POST /api/chat.
  // Provider status is factual; no simulated model capability is advertised.
  app.get('/api/runtime-status', (_req, res) => {
    return res.json({
      service: 'hyperterminal-node',
      chat: { handler: 'POST /api/chat', provider: apiKeyPool.hasKeys() ? 'gemini' : 'none',
        model: process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash', mode: 'natural-conversation',
        ready: apiKeyPool.hasKeys() },
      mountBridge: 'separate-authenticated-localhost-service',
    });
  });
  // API endpoint: /api/chat
  // Receives prompt, ongoing conversation history, and current environment state
  // Analyzes sentiment, dictates background 3D/4D environment alteration, and provides AI response
  app.post('/api/chat', async (req, res) => {
    const { prompt, conversationHistory = [], currentEnv = {}, engramsContext = '' } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing prompt string' });
    }

    const safeHistory = Array.isArray(conversationHistory)
      ? conversationHistory.slice(-12)
          .filter((turn: any) => turn && ['user', 'assistant', 'model'].includes(turn.role)
            && typeof turn.text === 'string' && turn.text.length > 0)
          .map((turn: any) => ({ role: turn.role === 'user' ? 'user' : 'model', text: turn.text.slice(0, 6000) }))
      : [];

    // If Gemini API keys are configured in pool, execute with resilient multi-key fallback optimization
    if (apiKeyPool.hasKeys()) {
      try {
        const systemInstruction = buildGaiaSystemInstruction(engramsContext);


        const { result: response, keyUsed } = await apiKeyPool.executeWithFallback(async (client) => {
          return await client.models.generateContent({
            model: process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash',
            contents: [
              ...safeHistory.map((c: any) => ({
                role: c.role,
                parts: [{ text: c.text }],
              })),
              {
                role: 'user',
                parts: [{ text: prompt }],
              },
            ],
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  reply: {
                    type: Type.STRING,
                    description: 'A complete, natural, context-aware conversational answer. Do not force a terminal format unless the user asks for commands.',
                  },
                  speechText: {
                    type: Type.STRING,
                    description: 'Concise spoken response for audio synthesis inside background visual.',
                  },
                  sentiment: {
                    type: Type.STRING,
                    description: 'Detected sentiment: analytical, energetic, alarm, tranquil, cosmic, chaos, creative.',
                  },
                  topology: {
                    type: Type.STRING,
                    description: '3D background topology: torus, tesseract, singularity, neural, galaxy, spindle, dna, galaxy_vfs, robotics_lab, protein_fold, earth_nasa.',
                  },
                  primaryColor: {
                    type: Type.STRING,
                    description: 'Primary glowing hex color code.',
                  },
                  secondaryColor: {
                    type: Type.STRING,
                    description: 'Secondary accent hex color code.',
                  },
                  speed: {
                    type: Type.NUMBER,
                    description: 'Velocity multiplier from 0.2 to 3.0.',
                  },
                  gravity: {
                    type: Type.NUMBER,
                    description: 'Gravitational tensor from 0.2 to 3.5.',
                  },
                  turbulence: {
                    type: Type.NUMBER,
                    description: 'Turbulence factor from 0.1 to 2.5.',
                  },
                  floatingGlyph: {
                    type: Type.STRING,
                    description: 'Symbolic glyph for 3D holographic projection.',
                  },
                },
                required: ['reply', 'speechText', 'sentiment', 'topology', 'primaryColor', 'secondaryColor'],
              },
            },
          });
        });

        const parsed = JSON.parse(response.text || '{}');
        return res.json({
          source: process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash',
          keyId: keyUsed.id,
          ...parsed,
        });
      } catch (err: any) {
        console.error('Gemini conversation request failed:', err?.message || String(err));
        return res.status(502).json({
          error: 'AI_PROVIDER_ERROR',
          message: 'The configured AI provider did not return a usable response. Check provider configuration and runtime logs.',
        });
      }
    }

    return res.status(503).json({
      error: 'AI_NOT_CONFIGURED',
      message: 'Conversational AI is not configured on this server. Set GEMINI_API_KEY and GEMINI_MODEL in the server environment.',
    });
  });


  // API endpoint: /api/navigator
  // Provides contextual AI voice descriptions for VFS nodes as the user traverses the data orbital mesh
  app.post('/api/navigator', async (req, res) => {
    const { nodeName, nodePath, nodeType, contentSnippet = '' } = req.body;

    if (!nodeName || !nodePath) {
      return res.status(400).json({ error: 'Missing node telemetry' });
    }

    if (apiKeyPool.hasKeys()) {
      try {
        const systemInstruction = `You are the Data Orbital Navigator for HyperTerminal OS.
Your role is to provide short, cool, and technical voice-over feedback for specific nodes in the filesystem galaxy.
Keep descriptions under 15 words. Sound like a futuristic AI navigator.`;

        const prompt = `Node Name: ${nodeName}
Path: ${nodePath}
Type: ${nodeType}
Snippet: ${contentSnippet.slice(0, 500)}

Provide a navigation data-burst description.`;

        const { result: response } = await apiKeyPool.executeWithFallback(async (aiClient) => {
          return await aiClient.models.generateContent({
            model: process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING, description: 'Futuristic technical description of the node.' },
                  urgency: { type: Type.STRING, enum: ['low', 'medium', 'high'] }
                },
                required: ['description']
              }
            }
          });
        });

        const parsed = JSON.parse(response.text || '{}');
        return res.json({
          source: 'gemini-navigator',
          ...parsed
        });
      } catch (err: any) {
        console.error('Navigator Gemini error:', err?.message);
      }
    }

    // Fallback
    return res.json({
      source: 'local-navigator-fallback',
      description: `Intercepting ${nodeType} node at ${nodeName}. Data resonance stable.`,
      urgency: 'low'
    });
  });

  // API endpoint: /api/weather
  // Proxies to Google Maps Weather API to avoid CORS and protect key
  app.get('/api/weather', async (req, res) => {
    const { lat, lng } = req.query;
    const gmpKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!gmpKey) return res.status(500).json({ error: 'Maps API Key not configured' });

    try {
      const url = `https://weather.googleapis.com/v1/currentConditions:lookup?key=${gmpKey}&location.latitude=${lat}&location.longitude=${lng}&solution_id=gmp_mcp_codeassist_v1_aistudio`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Weather API returned ${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      console.error('[Weather API Proxy Error]:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // API endpoint: /api/geocode
  // Proxies to Google Maps Geocoding API
  app.get('/api/geocode', async (req, res) => {
    const { lat, lng } = req.query;
    const gmpKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!gmpKey) return res.status(500).json({ error: 'Maps API Key not configured' });

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${gmpKey}&solution_id=gmp_mcp_codeassist_v1_aistudio`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Geocoding API returned ${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      console.error('[Geocoding API Proxy Error]:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // Serve static assets or mount Vite in development
  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[HyperTerminal Server] running on http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[Server Error] Port ${PORT} already in use. Retrying or shutting down cleanly.`);
    } else {
      console.error('[Server Error]:', err);
    }
  });

  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };

  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}

startServer().catch((err) => {
  console.error('[Server Start Failure]:', err);
});
