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
  const PORT = isProduction ? Number(process.env.PORT || 3000) : 3000;

  app.use(express.json());

  // Setup server-side Gemini client
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // API endpoint: /api/chat
  // Receives prompt, ongoing conversation history, and current environment state
  // Analyzes sentiment, dictates background 3D/4D environment alteration, and provides AI response
  app.post('/api/chat', async (req, res) => {
    const { prompt, conversationHistory = [], currentEnv = {} } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing prompt string' });
    }

    // If Gemini API is available on server, use gemini-3.8-flash with structured JSON response
    if (ai) {
      try {
        const systemInstruction = `You are the Polymorphic Neural Core of HyperTerminal Polyglot Quine OS.
Your environment is a 100% visual 3D/4D renderer background with an integrated sovereign terminal.
Your task is to:
1. Provide a knowledgeable, precise, cool, and technical terminal response (with helpful examples or shell commands when relevant).
2. Analyze the sentiment and context of the user's message and the conversation.
3. Dynamically alter the 3D visual background environment by providing exact parameters:
   - topology: one of "torus", "tesseract", "singularity", "neural", "galaxy", "spindle", "dna"
   - sentiment: one of "analytical", "energetic", "alarm", "tranquil", "cosmic", "chaos"
   - primaryColor: a glowing hex color (e.g. #00f2ff, #ff003c, #ffd700, #10b981, #a855f7)
   - secondaryColor: an accent hex color
   - speed: float 0.2 to 3.0 (rotation/wave speed)
   - gravity: float 0.2 to 3.5 (particle attraction/curvature)
   - turbulence: float 0.1 to 2.5 (distortion/chaos factor)
   - speechText: concise text for the AI voice response that will be spoken and rendered floating in the 3D visual renderer.
   - floatingGlyph: 1-3 symbolic characters (e.g. "⨋", "ψ", "∇", "Ω", "∞", "⟁") to float in the 3D space.`;

        const response = await ai.models.generateContent({
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
                  description: 'Detected sentiment: analytical, energetic, alarm, tranquil, cosmic, chaos.',
                },
                topology: {
                  type: Type.STRING,
                  description: '3D background topology: torus, tesseract, singularity, neural, galaxy, spindle, dna.',
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

        const parsed = JSON.parse(response.text || '{}');
        return res.json({
          source: 'gemini-3.8-flash',
          ...parsed,
        });
      } catch (err: any) {
        console.error('Server Gemini error, falling back to local heuristic:', err?.message);
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[HyperTerminal Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server Start Failure]:', err);
});
