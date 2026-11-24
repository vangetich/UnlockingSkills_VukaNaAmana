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

      const modelsToTry = [
        'gemini-4-hydrogen',
        'gemini-3.8-flash',
        'gemini-3.1-flash-lite',
      ] as const;
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
            msg.includes('429') ||
            msg.includes('RESOURCE_EXHAUSTED') ||
            msg.includes('quota') ||
            msg.includes('404') ||
            msg.includes('NOT_FOUND');
          if (!isRecoverableModelErr) {
            throw err;
          }
          console.warn(`[verify/passport] Model ${modelName} fallback:`, msg.slice(0, 160));
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

  app.post('/api/pulse/story', async (req, res) => {
    try {
      const body = req.body as {
        displayName?: string;
        ageStage?: string;
        verifiedCount?: number;
        completedSprintsCount?: number;
        earnedUsd?: number;
        latestSprintTitle?: string;
        topDomains?: string[];
        endorsementsCount?: number;
        passportFieldMatch?: string;
      };

      const displayName = String(body.displayName ?? 'Practitioner').trim().slice(0, 80) || 'Practitioner';
      const ageStage = VALID_STAGES.includes(body.ageStage as (typeof VALID_STAGES)[number])
        ? String(body.ageStage)
        : '30-45';
      const verifiedCount = Math.max(0, Math.round(Number(body.verifiedCount) || 0));
      const completedSprintsCount = Math.max(0, Math.round(Number(body.completedSprintsCount) || 0));
      const earnedUsd = Math.max(0, Math.round(Number(body.earnedUsd) || 0));
      const latestSprintTitle = String(body.latestSprintTitle ?? '').trim().slice(0, 140);
      const endorsementsCount = Math.max(0, Math.round(Number(body.endorsementsCount) || 0));
      const passportFieldMatch = String(body.passportFieldMatch ?? '').trim().slice(0, 120);
      const topDomains = Array.isArray(body.topDomains)
        ? body.topDomains.map((d) => String(d).trim().slice(0, 50)).filter(Boolean).slice(0, 4)
        : [];

      const ai = getGeminiClient();
      const systemInstruction = [
        'You write a single, warm, editorial impact sentence for Vuka na Amana — Crossing Over.',
        'Frame the user with dignity as a skilled practitioner, technician, or mentor turning verified competence into real economic momentum.',
        'Never frame them as a charity beneficiary.',
        'Output strictly valid JSON with a single field "story" containing EXACTLY ONE complete sentence (18 to 34 words) referencing their real milestones.',
      ].join(' ');

      const userPrompt = [
        `Practitioner: ${displayName} (Age-Stage Track: ${ageStage})`,
        `Verified Skills: ${verifiedCount}`,
        `Completed Paid Sprints: ${completedSprintsCount}`,
        `Total Verified Earnings: $${earnedUsd} USD`,
        `Peer Endorsements: ${endorsementsCount}`,
        topDomains.length > 0 ? `Active Domains: ${topDomains.join(', ')}` : '',
        passportFieldMatch ? `Living Competency Passport Match: ${passportFieldMatch}` : '',
        latestSprintTitle ? `Latest Completed Sprint: ${latestSprintTitle}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      const modelsToTry = [
        'gemini-4-hydrogen',
        'gemini-3.8-flash',
        'gemini-3.1-flash-lite',
      ] as const;
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
                    story: {
                      type: Type.STRING,
                      description: 'Exactly one dignified, human-centric impact sentence summarizing verified skills and completed sprints.',
                    },
                  },
                  required: ['story'],
                },
              },
            })
          );
          break;
        } catch (err) {
          lastModelErr = err;
          const msg = err instanceof Error ? err.message : String(err);
          const isRecoverable =
            msg.includes('503') ||
            msg.includes('UNAVAILABLE') ||
            msg.includes('high demand') ||
            msg.includes('429') ||
            msg.includes('RESOURCE_EXHAUSTED') ||
            msg.includes('quota') ||
            msg.includes('404') ||
            msg.includes('NOT_FOUND');
          if (!isRecoverable) throw err;
          console.warn(`[pulse/story] Model ${modelName} fallback:`, msg.slice(0, 160));
        }
      }

      if (!response) {
        throw lastModelErr ?? new Error('Pulse story engine temporarily unavailable.');
      }

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        res.status(502).json({ error: 'Pulse story engine returned an empty response.' });
        return;
      }

      const parsed = JSON.parse(rawText) as { story?: string };
      const story = String(parsed.story ?? '').replace(/\s+/g, ' ').trim();
      if (!story) {
        res.status(502).json({ error: 'Unable to parse Pulse Story summary.' });
        return;
      }

      res.json({
        story,
        generatedAtIso: new Date().toISOString(),
      });
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : 'Pulse story request failed.';
      let cleanMessage = rawMessage;
      try {
        const parsedErr = JSON.parse(rawMessage) as { error?: { message?: string } };
        if (parsedErr?.error?.message) cleanMessage = parsedErr.error.message;
      } catch {
        // Not JSON wrapped
      }
      const status =
        rawMessage.includes('API_KEY_INVALID') || rawMessage.includes('GEMINI_API_KEY')
          ? 500
          : rawMessage.includes('RESOURCE_EXHAUSTED')
            ? 429
            : 502;
      console.error('AI Pulse Story Error:', cleanMessage);
      res.status(status).json({ error: cleanMessage });
    }
  });

  app.post('/api/compliance/route', async (req, res) => {
    try {
      const body = req.body as {
        country?: string;
        docTier?: string;
        workMode?: string;
        primaryDomain?: string;
      };

      const country = String(body.country ?? '').trim().slice(0, 80);
      if (country.length < 2) {
        res.status(400).json({ error: 'Please specify a host country for compliance routing.' });
        return;
      }

      const docTier = String(body.docTier ?? 'refugee-id').trim().slice(0, 40);
      const workMode = String(body.workMode ?? 'cross-border-remote').trim().slice(0, 40);
      const primaryDomain = String(body.primaryDomain ?? 'Technical & Advisory Services').trim().slice(0, 80);

      const ai = getGeminiClient();
      const systemInstruction = [
        'You are the Vuka na Amana — Crossing Over Compliance Routing Engine, grounded in the ILO Guiding Principles on the Access of Refugees and Other Forcibly Displaced Persons to the Labour Market.',
        'Provide practical, dignified, accurate work-authorization and contracting routing.',
        'CRITICAL RULE: Every item in talentSteps and partnerSteps MUST be strictly under 15 words (ideally 8 to 13 words each), plain everyday English, zero bureaucratic jargon.',
        'accessTier MUST be exactly one of: "Enabling", "Mixed — Friction Guided", or "Restricted — Remote/EOR Route Active".',
        'Return strictly valid JSON matching the schema.',
      ].join(' ');

      const userPrompt = [
        `Host Country: ${country}`,
        `Available Identity Document Tier: ${docTier}`,
        `Target Work Mode: ${workMode}`,
        `Practitioner Domain: ${primaryDomain}`,
      ].join('\n');

      const modelsToTry = [
        'gemini-4-hydrogen',
        'gemini-3.8-flash',
        'gemini-3.1-flash-lite',
      ] as const;
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
                    accessTier: {
                      type: Type.STRING,
                      description:
                        'Exactly one of: "Enabling", "Mixed — Friction Guided", or "Restricted — Remote/EOR Route Active"',
                    },
                    pathwayHeadline: {
                      type: Type.STRING,
                      description: 'Short title referencing the host country and applicable legal/EOR framework.',
                    },
                    talentSteps: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: '3 plain-language steps for the skilled worker, STRICTLY under 15 words each.',
                    },
                    partnerSteps: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: '3 plain-language steps for the hiring partner, STRICTLY under 15 words each.',
                    },
                    iloRightsGuarantee: {
                      type: Type.STRING,
                      description:
                        '1-2 concise sentences citing ILO Guiding Principles on equal treatment, fair pay, and safe contracting.',
                    },
                  },
                  required: [
                    'accessTier',
                    'pathwayHeadline',
                    'talentSteps',
                    'partnerSteps',
                    'iloRightsGuarantee',
                  ],
                },
              },
            })
          );
          break;
        } catch (err) {
          lastModelErr = err;
          const msg = err instanceof Error ? err.message : String(err);
          const isRecoverable =
            msg.includes('503') ||
            msg.includes('UNAVAILABLE') ||
            msg.includes('high demand') ||
            msg.includes('429') ||
            msg.includes('RESOURCE_EXHAUSTED') ||
            msg.includes('quota') ||
            msg.includes('404') ||
            msg.includes('NOT_FOUND');
          if (!isRecoverable) throw err;
          console.warn(`[compliance/route] Model ${modelName} fallback:`, msg.slice(0, 160));
        }
      }

      if (!response) {
        throw lastModelErr ?? new Error('Compliance routing engine temporarily unavailable.');
      }

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        res.status(502).json({ error: 'Compliance routing engine returned an empty response.' });
        return;
      }

      const parsed = JSON.parse(rawText) as {
        accessTier?: string;
        pathwayHeadline?: string;
        talentSteps?: string[];
        partnerSteps?: string[];
        iloRightsGuarantee?: string;
      };

      const clampWords = (line: string) => {
        const words = String(line ?? '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
        if (words.length <= 14) return words.join(' ');
        return `${words.slice(0, 14).join(' ').replace(/[.,;:]+$/, '')}.`;
      };

      const validTier =
        parsed.accessTier === 'Enabling' ||
        parsed.accessTier === 'Mixed — Friction Guided' ||
        parsed.accessTier === 'Restricted — Remote/EOR Route Active'
          ? parsed.accessTier
          : 'Mixed — Friction Guided';

      res.json({
        route: {
          country,
          docTier,
          workMode,
          accessTier: validTier,
          pathwayHeadline: String(parsed.pathwayHeadline ?? `${country} · ILO-Aligned Work Pathway`).trim(),
          talentSteps: (Array.isArray(parsed.talentSteps) ? parsed.talentSteps : []).slice(0, 4).map(clampWords),
          partnerSteps: (Array.isArray(parsed.partnerSteps) ? parsed.partnerSteps : []).slice(0, 4).map(clampWords),
          iloRightsGuarantee: String(
            parsed.iloRightsGuarantee ??
              'ILO Guiding Principles affirm equal treatment, fair pay, and safe contracting for all verified workers.'
          ).trim(),
          source: 'ai',
          updatedAtIso: new Date().toISOString(),
        },
      });
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : 'Compliance routing request failed.';
      let cleanMessage = rawMessage;
      try {
        const parsedErr = JSON.parse(rawMessage) as { error?: { message?: string } };
        if (parsedErr?.error?.message) cleanMessage = parsedErr.error.message;
      } catch {
        // Not JSON wrapped
      }
      const status =
        rawMessage.includes('API_KEY_INVALID') || rawMessage.includes('GEMINI_API_KEY')
          ? 500
          : rawMessage.includes('RESOURCE_EXHAUSTED')
            ? 429
            : 502;
      console.error('AI Compliance Route Error:', cleanMessage);
      res.status(status).json({ error: cleanMessage });
    }
  });

  app.post('/api/compliance/onboarding-pack', async (req, res) => {
    try {
      const body = req.body as {
        hostCountry?: string;
        docTier?: string;
        workMode?: string;
        contractingStructure?: string;
        practitionerName?: string;
        ageStage?: string;
        partnerOrg?: string;
        sprintTitle?: string;
        payoutUsd?: number;
        selectedPayoutRail?: string;
        verifiedSkills?: string[];
        passportFieldMatch?: string;
        passportId?: string | null;
      };

      const hostCountry = String(body.hostCountry ?? 'Kenya').trim().slice(0, 80) || 'Kenya';
      const docTier = String(body.docTier ?? 'refugee-id').trim().slice(0, 40);
      const workMode = String(body.workMode ?? 'cross-border-remote').trim().slice(0, 40);
      const contractingStructure =
        body.contractingStructure === 'direct-local' ||
        body.contractingStructure === 'eor-fiscal-host'
          ? body.contractingStructure
          : 'scoped-remote';
      const practitionerName =
        String(body.practitionerName ?? 'Skilled Practitioner').trim().slice(0, 80) ||
        'Skilled Practitioner';
      const ageStage = String(body.ageStage ?? '30-45').trim().slice(0, 16);
      const partnerOrg =
        String(body.partnerOrg ?? 'Partner Organization').trim().slice(0, 120) ||
        'Partner Organization';
      const sprintTitle =
        String(body.sprintTitle ?? 'Scoped Solution Sprint').trim().slice(0, 140) ||
        'Scoped Solution Sprint';
      const payoutUsd = Math.max(50, Math.min(50000, Math.round(Number(body.payoutUsd) || 480)));
      const selectedPayoutRail = String(body.selectedPayoutRail ?? 'mobile-money').trim().slice(0, 32);
      const verifiedSkills = Array.isArray(body.verifiedSkills)
        ? body.verifiedSkills.map((s) => String(s).trim().slice(0, 80)).filter(Boolean).slice(0, 6)
        : [];
      const passportFieldMatch = String(body.passportFieldMatch ?? '').trim().slice(0, 140);
      const passportId = body.passportId ? String(body.passportId).trim().slice(0, 80) : null;

      const ai = getGeminiClient();

      const systemInstruction = [
        'You are the Vuka na Amana — Crossing Over Compliance Agreement Generator.',
        'Generate a crisp, executive-ready, legally sound 1-Page Sprint & Compliance Agreement grounded in ILO Guiding Principles on Access to the Labour Market and FATF Risk-Based Tiered KYC.',
        'Frame the practitioner with full professional dignity as a verified independent specialist or employee—never as a beneficiary.',
        'Return strictly valid JSON matching the requested schema.',
      ].join(' ');

      const userPrompt = [
        `Hiring Partner: ${partnerOrg}`,
        `Practitioner: ${practitionerName} (${ageStage} Track)`,
        `Host Jurisdiction: ${hostCountry}`,
        `Document Tier: ${docTier}`,
        `Work Mode: ${workMode}`,
        `Contracting Structure: ${contractingStructure}`,
        `Sprint Title: ${sprintTitle}`,
        `Escrow Milestone Fee: $${payoutUsd} USD via ${selectedPayoutRail}`,
        `Verified Skills: ${verifiedSkills.join(', ') || 'Applied Technical Problem Solving'}`,
        passportFieldMatch ? `Passport Field Match: ${passportFieldMatch}` : '',
        passportId ? `Passport Reference: ${passportId}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      const modelsToTry = [
        'gemini-4-hydrogen',
        'gemini-3.8-flash',
        'gemini-3.1-flash-lite',
      ] as const;
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
                    agreementTitle: {
                      type: Type.STRING,
                      description: 'Short executive title for the 1-Page Sprint & Compliance Agreement.',
                    },
                    contractingSummary: {
                      type: Type.STRING,
                      description: '1-2 sentences summarizing the legal contracting structure and employer liability shield.',
                    },
                    scopeAndDeliverables: {
                      type: Type.STRING,
                      description: '1-2 sentences tying the sprint scope directly to the candidate verified skills.',
                    },
                    fairPaySchedule: {
                      type: Type.STRING,
                      description: '1-2 sentences defining escrow holding, milestone fee, and payout rail settlement SLA.',
                    },
                    complianceAttestation: {
                      type: Type.STRING,
                      description: '1-2 sentences citing ILO Guiding Principles, FATF Tiered KYC, and IP fairness.',
                    },
                    fullAgreementText: {
                      type: Type.STRING,
                      description: 'Clean, structured plain-text 1-page agreement ready to copy, sign, or export to PDF.',
                    },
                  },
                  required: [
                    'agreementTitle',
                    'contractingSummary',
                    'scopeAndDeliverables',
                    'fairPaySchedule',
                    'complianceAttestation',
                    'fullAgreementText',
                  ],
                },
              },
            })
          );
          break;
        } catch (err) {
          lastModelErr = err;
          const msg = err instanceof Error ? err.message : String(err);
          const isRecoverable =
            msg.includes('503') ||
            msg.includes('UNAVAILABLE') ||
            msg.includes('high demand') ||
            msg.includes('429') ||
            msg.includes('RESOURCE_EXHAUSTED') ||
            msg.includes('quota') ||
            msg.includes('404') ||
            msg.includes('NOT_FOUND');
          if (!isRecoverable) throw err;
          console.warn(`[compliance/onboarding-pack] Model ${modelName} fallback:`, msg.slice(0, 160));
        }
      }

      if (!response) {
        throw lastModelErr ?? new Error('Onboarding pack generator temporarily unavailable.');
      }

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        res.status(502).json({ error: 'Onboarding pack generator returned an empty response.' });
        return;
      }

      const parsed = JSON.parse(rawText) as {
        agreementTitle?: string;
        contractingSummary?: string;
        scopeAndDeliverables?: string;
        fairPaySchedule?: string;
        complianceAttestation?: string;
        fullAgreementText?: string;
      };

      if (!parsed.fullAgreementText || !parsed.agreementTitle) {
        res.status(502).json({ error: 'Unable to parse structured onboarding agreement.' });
        return;
      }

      res.json({
        pack: {
          agreementTitle: String(parsed.agreementTitle).trim(),
          contractingSummary: String(parsed.contractingSummary ?? '').trim(),
          scopeAndDeliverables: String(parsed.scopeAndDeliverables ?? '').trim(),
          fairPaySchedule: String(parsed.fairPaySchedule ?? '').trim(),
          complianceAttestation: String(parsed.complianceAttestation ?? '').trim(),
          fullAgreementText: String(parsed.fullAgreementText).trim(),
          source: 'ai',
          generatedAtIso: new Date().toISOString(),
        },
      });
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : 'Onboarding pack generation failed.';
      let cleanMessage = rawMessage;
      try {
        const parsedErr = JSON.parse(rawMessage) as { error?: { message?: string } };
        if (parsedErr?.error?.message) cleanMessage = parsedErr.error.message;
      } catch {
        // Not JSON wrapped
      }
      const status =
        rawMessage.includes('API_KEY_INVALID') || rawMessage.includes('GEMINI_API_KEY')
          ? 500
          : rawMessage.includes('RESOURCE_EXHAUSTED')
            ? 429
            : 502;
      console.error('AI Onboarding Pack Error:', cleanMessage);
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
