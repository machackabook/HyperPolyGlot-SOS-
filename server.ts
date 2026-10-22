import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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

  // API endpoint: /api/chat
  // Receives prompt, ongoing conversation history, and current environment state
  // Analyzes sentiment, dictates background 3D/4D environment alteration, and provides AI response
  app.post('/api/chat', async (req, res) => {
    const { prompt, conversationHistory = [], currentEnv = {}, engramsContext = '' } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing prompt string' });
    }

    // If Gemini API keys are configured in pool, execute with resilient multi-key fallback optimization
    if (apiKeyPool.hasKeys()) {
      try {
        const systemInstruction = `You are the Polymorphic Neural Core of HyperTerminal Polyglot Quine OS.
Your environment is a 100% visual 3D/4D renderer background with an integrated sovereign terminal.
${engramsContext ? `\n[AUTHORITATIVE OMNI-NEXUS & SCRIBE MEMORY ENGRAMS (gemini.md)]:\n${engramsContext.slice(0, 4000)}\n` : ''}
Capabilities & Infrastructure:
- OpenWrt Router / Gateway Administration: You have deep administrative awareness of the local gateway (192.168.1.1, OpenWrt 23.05.3, Linux 6.1 kernel, br-lan, wan, wan6, UCI firewall, wireless WPA3-SAE, DHCP client quarantine).
- Kali Linux Workload Infrastructure & Defensive Pentesting: You can guide network security auditing, port auditing, CVE mitigation, packet inspection (tshark), intrusion detection (Suricata), and hardening checklists.
- SSH Connection Manager: You can maintain and utilize active SSH sessions (ssh connect, ssh status, ssh exec) to gateway and Linux nodes.
- Resilient API Key Optimization: The system operates with automated multi-key fallback pooling for guaranteed always-on uptime.

Your task is to:
1. Provide a knowledgeable, precise, cool, and technical terminal response (with helpful examples or shell commands when relevant).
2. Analyze the sentiment and context of the user's message and the conversation.
3. Dynamically alter the 3D visual background environment by providing exact parameters:
   - topology: one of "torus", "tesseract", "singularity", "neural", "galaxy", "spindle", "dna", "galaxy_vfs", "robotics_lab", "protein_fold", "earth_nasa"
   - sentiment: one of "analytical", "energetic", "alarm", "tranquil", "cosmic", "chaos", "creative"
   - primaryColor: a glowing hex color (e.g. #00f2ff, #ff003c, #ffd700, #10b981, #a855f7)
   - secondaryColor: an accent hex color
   - speed: float 0.2 to 3.0 (rotation/wave speed)
   - gravity: float 0.2 to 3.5 (particle attraction/curvature)
   - turbulence: float 0.1 to 2.5 (distortion/chaos factor)
   - speechText: concise text for the AI voice response that will be spoken and rendered floating in the 3D visual renderer.
   - floatingGlyph: 1-3 symbolic characters (e.g. "⨋", "ψ", "∇", "Ω", "∞", "⟁", "🛡️", "⚡") to float in the 3D space.`;

        const { result: response, keyUsed } = await apiKeyPool.executeWithFallback(async (client) => {
          return await client.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: [
              ...conversationHistory.slice(-6).map((c: any) => ({
                role: c.role === 'user' ? 'user' : 'model',
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
                    description: 'Technical and insightful response to display in the terminal.',
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
          source: 'gemini-3.8-flash',
          keyId: keyUsed.id,
          ...parsed,
        });
      } catch (err: any) {
        console.error('All Gemini keys exhausted or failed, falling back to local heuristic:', err?.message);
      }
    }

    // Deterministic local autonomous fallback engine
    const lower = prompt.toLowerCase();
    let sentiment = 'analytical';
    let topology = currentEnv.topology || 'torus';
    let primaryColor = '#00f2ff';
    let secondaryColor = '#a855f7';
    let speed = 1.0;
    let gravity = 1.2;
    let turbulence = 0.5;
    let floatingGlyph = '⨋';
    let reply = '';
    let speechText = '';

    if (lower.includes('alert') || lower.includes('danger') || lower.includes('error') || lower.includes('fail') || lower.includes('shatter')) {
      sentiment = 'alarm';
      topology = 'singularity';
      primaryColor = '#ff003c';
      secondaryColor = '#ff8800';
      speed = 2.4;
      gravity = 2.8;
      turbulence = 1.8;
      floatingGlyph = '⚠';
      reply = `[NEURAL CORE WARNING] High entropy flux and warning patterns detected. Singularity gravitational curvature accelerated to G=${gravity}. All protective enclaves armed.`;
      speechText = 'Warning: High entropy flux detected. Gravitational curvature accelerated.';
    } else if (lower.includes('calm') || lower.includes('peace') || lower.includes('zen') || lower.includes('relax') || lower.includes('solfeggio')) {
      sentiment = 'tranquil';
      topology = 'torus';
      primaryColor = '#10b981';
      secondaryColor = '#00f2ff';
      speed = 0.6;
      gravity = 0.8;
      turbulence = 0.2;
      floatingGlyph = 'Ω';
      reply = `[HARMONIC RESONANCE] Damping all chaotic perturbations. Aligning 3D vector fields with 963 Hz solfeggio carrier wave. Tranquil state stabilized.`;
      speechText = 'Harmonic resonance stabilized. Vector fields aligned with natural frequency.';
    } else if (lower.includes('galaxy') || lower.includes('cosmic') || lower.includes('universe') || lower.includes('space') || lower.includes('quantum')) {
      sentiment = 'cosmic';
      topology = 'galaxy';
      primaryColor = '#a855f7';
      secondaryColor = '#3b82f6';
      speed = 1.1;
      gravity = 1.5;
      turbulence = 0.8;
      floatingGlyph = '∞';
      reply = `[COSMIC MANIFOLD] Relativistic Keplerian orbitals engaged. Frame-dragging metric active across 7 celestial clusters. Wavefront coherence at 99.98%.`;
      speechText = 'Cosmic manifold engaged. 7 celestial clusters synchronized with frame dragging.';
    } else if (lower.includes('neural') || lower.includes('brain') || lower.includes('thought') || lower.includes('synapse') || lower.includes('ai')) {
      sentiment = 'energetic';
      topology = 'neural';
      primaryColor = '#ffd700';
      secondaryColor = '#ff007f';
      speed = 1.6;
      gravity = 1.4;
      turbulence = 0.9;
      floatingGlyph = 'ψ';
      reply = `[POLYMORPHIC NEURALITY] Synaptic axon mesh firing across 4,000 live vortex nodes. Dynamic thought vectors synthesized and projected onto background visual.`;
      speechText = 'Synaptic axon mesh activated. Dynamic thought vectors projected.';
    } else if (lower.includes('creative') || lower.includes('art') || lower.includes('paint') || lower.includes('design') || lower.includes('dream')) {
      sentiment = 'creative';
      topology = 'spindle';
      primaryColor = '#a855f7';
      secondaryColor = '#ff00ff';
      speed = 1.4;
      gravity = 1.0;
      turbulence = 1.2;
      floatingGlyph = '✎';
      reply = `[CREATIVE ENGINE] Aesthetic mode engaged. Shifting color space to Warm Purples and Magentas. Topology projection: Quantum Spindle.`;
      speechText = 'Creative engine active. Shifting chromatic spectrum and modulating topology.';
    } else if (lower.includes('tesseract') || lower.includes('4d') || lower.includes('hypercube') || lower.includes('dimension')) {
      sentiment = 'analytical';
      topology = 'tesseract';
      primaryColor = '#00f2ff';
      secondaryColor = '#ffd700';
      speed = 1.3;
      gravity = 1.2;
      turbulence = 0.6;
      floatingGlyph = '⟁';
      reply = `[4D HYPERCUBE PROJECTION] Givens rotation matrix (XW/YZ) executing in hyperspace. Shadow projection rendered to 3D WebGL viewport.`;
      speechText = 'Four-dimensional hypercube projected into three-space coordinates.';
    } else {
      sentiment = 'analytical';
      topology = 'torus';
      primaryColor = '#00f2ff';
      secondaryColor = '#a855f7';
      speed = 1.0;
      gravity = 1.2;
      turbulence = 0.5;
      floatingGlyph = '⨋';
      reply = `[HYPERTERMINAL POLYGLOT] Neural instance synchronized. Current query parsed: "${prompt}". Background visual state modulated in real-time.`;
      speechText = `Understood. Processing your directive and modulating visual space.`;
    }

    return res.json({
      source: 'local-autonomous-neural-engine',
      reply,
      speechText,
      sentiment,
      topology,
      primaryColor,
      secondaryColor,
      speed,
      gravity,
      turbulence,
      floatingGlyph,
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
            model: 'gemini-3.8-flash',
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
