import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

const VALID_DOMAINS = ['Tech', 'Green Energy', 'Healthcare Ops', 'SME Finance'] as const;
const VALID_STAGES = ['15-17', '18-29', '30-45', '46+', '15-19', '20-29'] as const;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please add your key in Settings > Secrets.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function generateWithRetry<T>(fn: () => Promise<T>, maxAttempts = 2): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isTransient = msg.includes('503') || msg.includes('500') || msg.includes('UNAVAILABLE');
      if (!isTransient || attempt === maxAttempts) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, attempt * 600));
    }
  }
  throw lastErr;
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  app.use(express.json({ limit: '512kb' }));

  app.post('/api/verify/passport', async (req, res) => {
    try {
      const body = req.body as {
        inputMode?: string;
        studioDomain?: string;
        scenarioPrompt?: string;
        responseText?: string;
        ageStage?: string;
        displayName?: string;
        problemStatement?: string;
        evidenceSummary?: string;
        locale?: string;
      };

      const inputMode = body.inputMode === 'scenario' ? 'scenario' : 'summary';
      const studioDomain = VALID_DOMAINS.includes(
        body.studioDomain as (typeof VALID_DOMAINS)[number]
      )
        ? (body.studioDomain as (typeof VALID_DOMAINS)[number])
        : 'Green Energy';
      const ageStage = VALID_STAGES.includes(body.ageStage as (typeof VALID_STAGES)[number])
        ? (body.ageStage as (typeof VALID_STAGES)[number])
        : '30-45';
      const responseText = String(body.responseText ?? '').trim().slice(0, 2400);
      const scenarioPrompt = String(body.scenarioPrompt ?? '').trim().slice(0, 600);
      const displayName = String(body.displayName ?? 'Practitioner').trim().slice(0, 80);
      const evidenceSummary = String(body.evidenceSummary ?? '').trim().slice(0, 600);

      if (responseText.length < 12) {
        res.status(400).json({
          error:
            'Please provide at least a short paragraph describing your work or scenario solution.',
        });
        return;
      }

      const ai = getGeminiClient();

      const systemInstruction = [
        'You are the Kora AI Verification Engine.',
        'Frame every applicant with dignity as a skilled builder, technician, specialist, or master practitioner—never as a beneficiary or charity case.',
        'Evaluate practical reasoning, field rigor, safety awareness, and concrete execution signals.',
        'Return strictly valid JSON matching the requested schema.',
        'Keep copy calm, concise, and editorial: 3 to 5 Verified Core Skills with realistic confidence ratings (High, Strong, or Emerging) and numeric scores (60-98).',
        'Recommend EXACTLY ONE targeted micro-bridging step or re-certification action (never a generic multi-year degree) that unlocks higher-paying verified briefs.',
      ].join(' ');

      const userPrompt = [
        `Practitioner Name: ${displayName}`,
        `Career Age-Stage: ${ageStage}`,
        `Focus Domain: ${studioDomain}`,
        `Submission Mode: ${inputMode === 'scenario' ? 'Practical Real-World Scenario' : 'Past Work Summary'}`,
        scenarioPrompt ? `Scenario Prompt: ${scenarioPrompt}` : '',
        evidenceSummary ? `Supporting Evidence Provided: ${evidenceSummary}` : '',
        `Practitioner Response:\n${responseText}`,
      ]
        .filter(Boolean)
        .join('\n\n');

      const modelsToTry = ['gemini-4-hydrogen', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'] as const;
      let response: Awaited<ReturnType<typeof ai.models.generateContent>> | null = null;
      let lastModelErr: unknown = null;

      for (const modelName of modelsToTry) {
        try {
          response = await generateWithRetry(() =>
            ai.models.generateContent({
              model: modelName,
              contents: userPrompt,
              config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    ageStageTrack: {
                      type: Type.STRING,
                      description:
                        'Concise dignified career track label matching their age stage, e.g., "30–45 Specialist · Field Systems Lead"',
                    },
                    fieldMatch: {
                      type: Type.STRING,
                      description:
                        'Concrete paid problem-solving field match, e.g., "Off-Grid Microgrid Diagnostics & Commercial Solar Commissioning"',
                    },
                    executiveSummary: {
                      type: Type.STRING,
                      description:
                        'Two-sentence high-trust verification summary highlighting real-world competence.',
                    },
                    verifiedSkills: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          confidenceLabel: {
                            type: Type.STRING,
                            description: 'One of: High Confidence, Verified Applied, Emerging Signal',
                          },
                          confidenceScore: {
                            type: Type.INTEGER,
                            description: 'Integer between 60 and 98',
                          },
                          evidenceNote: {
                            type: Type.STRING,
                            description: 'Brief 1-sentence reason grounded in the user input.',
                          },
                        },
                        required: ['name', 'confidenceLabel', 'confidenceScore', 'evidenceNote'],
                      },
                    },
                    microBridge: {
                      type: Type.OBJECT,
                      properties: {
                        title: {
                          type: Type.STRING,
                          description: 'Exactly one targeted micro-credential or bridging step.',
                        },
                        action: {
                          type: Type.STRING,
                          description: 'Concrete 1-2 sentence action item completable in 1-3 weeks.',
                        },
                        estimatedDuration: {
                          type: Type.STRING,
                          description: 'e.g., "6 hours · Self-paced" or "2 weeks · Practical Lab"',
                        },
                        partnerProgram: {
                          type: Type.STRING,
                          description: 'Relevant international recognition or partner body name.',
                        },
                      },
                      required: ['title', 'action', 'estimatedDuration', 'partnerProgram'],
                    },
                  },
                  required: [
                    'ageStageTrack',
                    'fieldMatch',
                    'executiveSummary',
                    'verifiedSkills',
                    'microBridge',
                  ],
                },
              },
            })
          );
          break;
        } catch (err) {
          lastModelErr = err;
          const msg = err instanceof Error ? err.message : String(err);
          const isRecoverableModelErr =
            msg.includes('503') ||
            msg.includes('UNAVAILABLE') ||
            msg.includes('high demand') ||
            msg.includes('404') ||
            msg.includes('NOT_FOUND');
          if (!isRecoverableModelErr) {
            throw err;
          }
        }
      }

      if (!response) {
        throw lastModelErr ?? new Error('Verification engine temporarily unavailable.');
      }

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        res.status(502).json({ error: 'Verification engine returned an empty response. Please retry.' });
        return;
      }

      const parsed = JSON.parse(rawText);
      res.json({
        passport: parsed,
        studioDomain,
        inputMode,
        ageStage,
        generatedAtIso: new Date().toISOString(),
      });
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : 'Verification request failed.';
      let cleanMessage = rawMessage;
      try {
        const parsedErr = JSON.parse(rawMessage) as { error?: { message?: string } };
        if (parsedErr?.error?.message) {
          cleanMessage = parsedErr.error.message;
        }
      } catch {
        // Not JSON wrapped
      }
      const status =
        rawMessage.includes('API_KEY_INVALID') || rawMessage.includes('GEMINI_API_KEY')
          ? 500
          : rawMessage.includes('RESOURCE_EXHAUSTED')
            ? 429
            : 502;
      console.error('AI Verification Error:', cleanMessage);
      res.status(status).json({ error: cleanMessage });
    }
  });

  if (!isProd) {
    // Serve a WebSocket-free @vite/client module in proxied preview environments.
    // Vite 8 still injects /@vite/client into index.html when middlewareMode + hmr:false,
    // which otherwise throws "Error: WebSocket closed without opened." on Cloud Run proxies.
    // Providing Vite's 5 client exports keeps CSS style injection (updateStyle/removeStyle)
    // and dev module loading working cleanly with zero WebSocket connections.
    const NO_WS_VITE_CLIENT = `
const sheetsMap = new Map();
export function updateStyle(id, content) {
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.setAttribute('data-vite-dev-id', id);
    style.textContent = content;
    document.head.appendChild(style);
    sheetsMap.set(id, style);
  } else {
    style.textContent = content;
  }
}
export function removeStyle(id) {
  const style = sheetsMap.get(id);
  if (style) {
    document.head.removeChild(style);
    sheetsMap.delete(id);
  }
}
export function injectQuery(url, queryToInject) {
  if (url[0] !== '.' && url[0] !== '/') return url;
  const pathname = url.replace(/[?#].*$/, '');
  const { search, hash } = new URL(url, 'http://vite.dev');
  return pathname + '?' + queryToInject + (search ? '&' + search.slice(1) : '') + (hash || '');
}
export function createHotContext() {
  return {
    data: {},
    accept() {},
    acceptExports() {},
    dispose() {},
    prune() {},
    invalidate() {},
    on() {},
    off() {},
    send() {},
  };
}
export class ErrorOverlay extends HTMLElement {
  close() {
    this.parentNode?.removeChild(this);
  }
}
`;

    app.get('/@vite/client', (_req, res) => {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.send(NO_WS_VITE_CLIENT);
    });

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Kora server listening on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
