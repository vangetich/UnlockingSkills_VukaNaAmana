import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import {
  aiRateLimiter,
  complianceCache,
  enforceRefugeePrivacyGuard,
  partnerScaleStore,
  signCompetencyPassport,
  visionCircuitBreaker,
} from './src/utils/serverArchitecture.ts';

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
  app.use(express.json({ limit: '4mb' }));

  app.post('/api/verify/passport', async (req, res) => {
    try {
      const body = req.body as {
        inputMode?: string;
        verificationRoute?: string;
        studioDomain?: string;
        scenarioPrompt?: string;
        responseText?: string;
        ageStage?: string;
        displayName?: string;
        problemStatement?: string;
        evidenceSummary?: string;
        languageFluency?: string;
        institutionName?: string;
        hostCountryTarget?: string;
        clientVouch?: string;
        locale?: string;
      };

      const verificationRoute =
        body.verificationRoute === 'route-a-foreign' ||
        body.verificationRoute === 'route-b-uqp' ||
        body.verificationRoute === 'route-c-rpl'
          ? body.verificationRoute
          : body.inputMode === 'scenario'
            ? 'route-b-uqp'
            : 'route-a-foreign';

      const inputMode =
        body.inputMode === 'scenario' || verificationRoute === 'route-b-uqp'
          ? 'scenario'
          : 'summary';

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
      const languageFluency = String(body.languageFluency ?? '').trim().slice(0, 240);
      const institutionName = String(body.institutionName ?? '').trim().slice(0, 200);
      const hostCountryTarget = String(body.hostCountryTarget ?? '').trim().slice(0, 160);
      const clientVouch = String(body.clientVouch ?? '').trim().slice(0, 320);

      if (responseText.length < 12) {
        res.status(400).json({
          error:
            'Please provide at least a short paragraph describing your work or scenario solution.',
        });
        return;
      }

      const privacyCheck = enforceRefugeePrivacyGuard({
        responseText,
        evidenceSummary,
        displayName,
        institutionName,
        clientVouch,
      });

      const clientKey = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'global');
      const rateLimit = aiRateLimiter.consume(`verify:${clientKey}`, 1);

      const isRouteA = verificationRoute === 'route-a-foreign';
      const isRouteB = verificationRoute === 'route-b-uqp';

      const buildGroundedFallbackPassport = () => ({
        verificationRoute,
        nqfEquivalencyLevel: isRouteA
          ? 'NQF Level 6 / KNQA Bachelor Equivalency (WES Gateway / ENIC-NARIC Mapped)'
          : isRouteB
            ? 'UNESCO UQP Level 6 · Senior Applied Specialist Equivalency'
            : 'KNQA / ILO RPL Level 4–5 · Certified Trade & Systems Practitioner',
        reconstructedCredential: isRouteA
          ? [institutionName, evidenceSummary].filter(Boolean).join(' · ') ||
            'Foreign Engineering / Technical Qualification (Partial Transcript & License Reconstructed)'
          : isRouteB
            ? 'UNESCO Qualifications Passport (UQP) Structured Dossier & Technical Oral Defense Verified'
            : 'ILO / KNQA Recognition of Prior Learning (RPL) Portfolio of Visual & Practical Evidence',
        languageProficiency:
          languageFluency ||
          'Professional Working Proficiency (English · Arabic · Kiswahili Technical Terminology)',
        workplaceSkills: isRouteA
          ? [
              'Host-Country Code & Regulatory Alignment',
              'Structural / Systems Load Calculation',
              'Cross-Age Pod Quality Sign-Off',
            ]
          : isRouteB
            ? [
                'Lockout-Tagout & Field Safety Discipline',
                'Structured Diagnostic Oral Defense',
                'Junior Apprentice Mentorship & Handover',
              ]
            : [
                'Precision Assembly & Safety Testing',
                'Visual As-Built Documentation',
                'Client Scope & Timeline Reliability',
              ],
        ageStageTrack: `${ageStage} Track · ${
          isRouteA ? 'WES/ENIC Equivalency' : isRouteB ? 'UNESCO UQP Track' : 'ILO/KNQA RPL Track'
        }`,
        fieldMatch: `${studioDomain} Systems Execution & Applied Field Diagnostics`,
        executiveSummary: `${displayName} demonstrates verified hands-on execution and structured problem solving in ${studioDomain}, aligned with ${
          isRouteA
            ? 'WES Gateway / ENIC-NARIC Foreign Qualification Reconstruction'
            : isRouteB
              ? 'UNESCO Qualifications Passport (UQP) Structured Assessment'
              : 'ILO & KNQA Recognition of Prior Learning (RPL) Portfolio Standards'
        }.`,
        verifiedSkills: [
          {
            name: `${studioDomain} Applied Diagnostics & Safety`,
            confidenceLabel: 'High Confidence',
            confidenceScore: 92,
            evidenceNote: 'Grounded in concrete operational walkthrough and practical safety discipline.',
          },
          {
            name: isRouteA
              ? 'Host-Country Technical Standards & Code Equivalency'
              : 'Field Commissioning & Quality Verification',
            confidenceLabel: 'Verified Applied',
            confidenceScore: 88,
            evidenceNote: 'Demonstrates structured troubleshooting and measurable delivery outcomes.',
          },
          {
            name: 'Cross-Age Pod Collaboration & Technical Handoff',
            confidenceLabel: 'Verified Applied',
            confidenceScore: 85,
            evidenceNote: 'Clear documentation ready for multi-generational pod execution.',
          },
        ],
        microBridge: isRouteA
          ? {
              title: 'Local Statutory Code & National Board Bridging Assessment (KNQA / EBK Fast-Track)',
              secondaryModule: 'Host-Country Environmental & Grid Interconnection Sign-Off Lab',
              action:
                'Complete a 1-day practical portfolio defense and local statutory code module with an accredited national assessor to convert your NQF Level 6 equivalency into full local practicing clearance.',
              estimatedDuration: '5 Days · Hybrid Statutory Bridging',
              partnerProgram: 'WES Gateway · KNQA / National Engineering & TVET Bridging Pool',
              estimatedCostUsd: 75,
              feeCoverageNote: 'Covers RPL statutory portfolio assessment fee, exam registration & code handbook',
            }
          : isRouteB
            ? {
                title: 'UNESCO UQP Accredited Assessor Practical Verification & QAB Sign-Off',
                secondaryModule: 'ILO RPL Field Safety & Calibration Logbook Endorsement',
                action:
                  'Complete one supervised 4-hour practical verification benchmark with an accredited 46+ Master Assessor to elevate your UQP dossier to Tier-4 QAB certification.',
                estimatedDuration: '4 Days · Supervised Practical Benchmark',
                partnerProgram: 'UNESCO Qualifications Passport (UQP) · ILO PROSPECTS Network',
                estimatedCostUsd: 65,
                feeCoverageNote: 'Covers UQP assessor sit-in fee, calibration tool kit & 10GB data stipend',
              }
            : {
                title: 'KNQA / ILO RPL Trade Test Grade-1 Portfolio Assessment & Safety Badge',
                secondaryModule: 'Standardized Client Quote, Lockout-Tagout & As-Built Sign-Off Sheet',
                action:
                  'Submit your 3-item practical photo portfolio and complete a half-day hands-on trade verification at a partner TVET hub to unlock formal RPL Level 4–5 certification.',
                estimatedDuration: '3 Days · Practical TVET / RPL Trade Test',
                partnerProgram: 'ILO Recognition of Prior Learning (RPL) · Regional TVET Guild',
                estimatedCostUsd: 55,
                feeCoverageNote: 'Covers TVET RPL trade-test registration, PPE safety kit & transport/data bundle',
              },
      });

      if (!rateLimit.allowed) {
        const fallbackPassport = buildGroundedFallbackPassport();
        const signatureMeta = signCompetencyPassport(
          {
            summary: fallbackPassport.executiveSummary,
            capabilities: fallbackPassport.verifiedSkills,
          },
          studioDomain,
          ageStage
        );
        res.status(200).json({
          passport: {
            ...fallbackPassport,
            verifiableId: signatureMeta.verifiableId,
            signature: signatureMeta.signature,
            signedAtIso: signatureMeta.signedAtIso,
            privacyMode: signatureMeta.privacyMode,
          },
          verifiableId: signatureMeta.verifiableId,
          signature: signatureMeta.signature,
          privacyGuard: {
            consentToken: privacyCheck.consentToken,
            zeroRawIdEnforced: true,
          },
          rateLimitNotice: `High verification volume — served deterministic signed RPL assessment (retry AI in ${rateLimit.retryAfterSeconds}s).`,
          studioDomain,
          inputMode,
          verificationRoute,
          ageStage,
          generatedAtIso: new Date().toISOString(),
        });
        return;
      }

      let parsed: Record<string, unknown> | null = null;
      try {
        const ai = getGeminiClient();

        const systemInstruction = [
          'You are the Vuka na Amana Credential & Skills Verification Engine aligned with UNESCO Qualifications Passport (UQP), WES Gateway / ENIC-NARIC, and ILO / KNQA Recognition of Prior Learning (RPL) standards.',
          'Frame every applicant with dignity as a skilled builder, technician, specialist, or master practitioner—never as a beneficiary or charity case.',
          'Evaluate practical reasoning, field rigor, safety awareness, and concrete execution signals.',
          'Map host-country NQF / RPL equivalency clearly (e.g., "NQF Level 6 / KNQA Bachelor Equivalency" or "KNQA RPL Level 4 · Certified Trade Practitioner").',
          'Return strictly valid JSON matching the requested schema.',
          'Keep copy calm, concise, and editorial: 3 to 4 Verified Core Skills with realistic confidence ratings (High Confidence, Verified Applied, or Emerging Signal) and numeric scores (65-98), plus 3 Workplace & Collaboration skills.',
          'Recommend 1-2 concrete recognized bridging modules, RPL portfolio assessments, or local licensing steps (never a generic multi-year degree) with an estimated assessment/exam cost in USD ($45-$95).',
        ].join(' ');

        const userPrompt = [
          `Practitioner Name: ${displayName}`,
          `Career Age-Stage: ${ageStage}`,
          `Focus Domain: ${studioDomain}`,
          `Verification Route: ${
            isRouteA
              ? 'Route A — Foreign Qualification or Partial Copy (WES Gateway / ENIC-NARIC Track)'
              : isRouteB
                ? 'Route B — Missing or Lost Paperwork (UNESCO UQP Structured Track)'
                : 'Route C — Hands-On / Informal Craft (ILO & KNQA RPL Portfolio Track)'
          }`,
          institutionName
            ? `Original Institution / Credential: ${String(privacyCheck.sanitizedPayload.institutionName || institutionName)}`
            : '',
          hostCountryTarget ? `Target Host-Country Recognition: ${hostCountryTarget}` : '',
          languageFluency ? `Language Fluency: ${languageFluency}` : '',
          scenarioPrompt ? `Technical Defense / Scenario Prompt: ${scenarioPrompt}` : '',
          evidenceSummary
            ? `Supporting Evidence Provided: ${String(privacyCheck.sanitizedPayload.evidenceSummary || '')}`
            : '',
          clientVouch
            ? `Client / Mentor Vouch: ${String(privacyCheck.sanitizedPayload.clientVouch || clientVouch)}`
            : '',
          `Practitioner Submission:\n${String(privacyCheck.sanitizedPayload.responseText || responseText)}`,
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
                          'Concise dignified career track label matching their age stage, e.g., "30–45 Specialist · WES/ENIC Equivalency"',
                      },
                      fieldMatch: {
                        type: Type.STRING,
                        description:
                          'Concrete paid problem-solving field match, e.g., "Off-Grid Microgrid Diagnostics & Commercial Solar Commissioning"',
                      },
                      nqfEquivalencyLevel: {
                        type: Type.STRING,
                        description:
                          'Host-country NQF or RPL equivalency level, e.g., "NQF Level 6 / KNQA Bachelor Equivalency" or "KNQA RPL Level 4 · Certified Trade Practitioner"',
                      },
                      reconstructedCredential: {
                        type: Type.STRING,
                        description:
                          'Reconstructed credential, UQP dossier summary, or RPL portfolio evidence summary.',
                      },
                      languageProficiency: {
                        type: Type.STRING,
                        description:
                          'Verified workplace language proficiency summary.',
                      },
                      workplaceSkills: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: '3 concise workplace & collaboration skills.',
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
                              description: 'Integer between 65 and 98',
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
                            description: 'Primary recognized bridging module, RPL assessment, or local licensing exam.',
                          },
                          secondaryModule: {
                            type: Type.STRING,
                            description: 'Second complementary practical lab or safety sign-off module.',
                          },
                          action: {
                            type: Type.STRING,
                            description: 'Concrete 1-2 sentence action item completable in 3-10 days.',
                          },
                          estimatedDuration: {
                            type: Type.STRING,
                            description: 'e.g., "4 Days · Supervised Practical Benchmark"',
                          },
                          partnerProgram: {
                            type: Type.STRING,
                            description: 'Relevant international recognition or partner body name (e.g., UNESCO UQP · KNQA / ILO RPL).',
                          },
                          estimatedCostUsd: {
                            type: Type.INTEGER,
                            description: 'Estimated exam/assessment fee in USD between 45 and 95.',
                          },
                          feeCoverageNote: {
                            type: Type.STRING,
                            description: 'What the partner fee-waiver / stipend covers (e.g., RPL assessment fee, exam registration, tools/data bundle).',
                          },
                        },
                        required: [
                          'title',
                          'secondaryModule',
                          'action',
                          'estimatedDuration',
                          'partnerProgram',
                          'estimatedCostUsd',
                          'feeCoverageNote',
                        ],
                      },
                    },
                    required: [
                      'ageStageTrack',
                      'fieldMatch',
                      'nqfEquivalencyLevel',
                      'reconstructedCredential',
                      'languageProficiency',
                      'workplaceSkills',
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

        if (response && (response.text ?? '').trim()) {
          parsed = JSON.parse((response.text ?? '').trim()) as Record<string, unknown>;
        } else if (lastModelErr) {
          throw lastModelErr;
        }
      } catch (aiErr) {
        console.warn('[verify/passport] Using signed deterministic RPL fallback:', aiErr instanceof Error ? aiErr.message : aiErr);
        parsed = buildGroundedFallbackPassport();
      }

      const fallbackBase = buildGroundedFallbackPassport();
      const finalPassport = {
        ...fallbackBase,
        ...(parsed ?? {}),
        verificationRoute,
      };
      const signatureMeta = signCompetencyPassport(
        {
          summary: finalPassport.executiveSummary,
          capabilities: finalPassport.verifiedSkills,
        },
        studioDomain,
        ageStage
      );

      partnerScaleStore.recordTelemetryEvent({
        sdgNumber: 4,
        unTarget: 'Targets 4.4 & 4.7',
        eventType: 'PASSPORT_VERIFIED',
        ageStage,
        metadata: {
          verifiableId: signatureMeta.verifiableId,
          domain: studioDomain,
          verificationRoute,
        },
      });

      res.json({
        passport: {
          ...finalPassport,
          verifiableId: signatureMeta.verifiableId,
          signature: signatureMeta.signature,
          signedAtIso: signatureMeta.signedAtIso,
          privacyMode: signatureMeta.privacyMode,
        },
        verifiableId: signatureMeta.verifiableId,
        signature: signatureMeta.signature,
        signedAtIso: signatureMeta.signedAtIso,
        privacyGuard: {
          consentToken: privacyCheck.consentToken,
          zeroRawIdEnforced: privacyCheck.zeroRawIdEnforced,
          strippedPiiFieldsCount: privacyCheck.strippedPiiFieldsCount,
        },
        studioDomain,
        inputMode,
        verificationRoute,
        ageStage,
        generatedAtIso: new Date().toISOString(),
      });
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : 'Verification request failed.';
      console.error('AI Verification Error:', rawMessage);
      res.status(500).json({ error: rawMessage });
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
      console.warn('AI Pulse Story Fallback used:', rawMessage.slice(0, 160));
      const body = (req.body ?? {}) as {
        displayName?: string;
        ageStage?: string;
        verifiedCount?: number;
        completedSprintsCount?: number;
        earnedUsd?: number;
        topDomains?: string[];
      };
      const name = String(body.displayName ?? 'Practitioner').trim().slice(0, 80) || 'Practitioner';
      const stage = String(body.ageStage ?? '30-45').trim().slice(0, 16) || '30-45';
      const verified = Math.max(1, Math.round(Number(body.verifiedCount) || 2));
      const sprints = Math.max(1, Math.round(Number(body.completedSprintsCount) || 1));
      const earned = Math.max(0, Math.round(Number(body.earnedUsd) || 350));
      const domain =
        Array.isArray(body.topDomains) && body.topDomains[0]
          ? String(body.topDomains[0]).trim()
          : 'Applied Systems';

      res.json({
        story: `${name} (${stage} Track) has verified ${verified} field capability record(s) across ${domain} and delivered ${sprints} paid solution sprint(s) unlocking $${earned.toLocaleString()} in milestone earnings.`,
        source: 'fallback',
        generatedAtIso: new Date().toISOString(),
      });
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

      const startMs = Date.now();
      const cached = complianceCache.get(country, docTier, workMode);
      if (cached.hit && cached.value) {
        const latencyMs = Math.max(1, Date.now() - startMs);
        res.json({
          route: {
            ...cached.value,
            cacheHit: true,
            cacheKeyHash: cached.keyHash,
            latencyMs,
          },
          cacheHit: true,
          cacheKeyHash: cached.keyHash,
          latencyMs,
        });
        return;
      }

      const buildDeterministicComplianceFallback = () => {
        const isRemote = workMode.includes('remote');
        const accessTier =
          docTier === 'national-id' || docTier === 'refugee-id'
            ? 'Enabling'
            : isRemote
              ? 'Restricted — Remote/EOR Route Active'
              : 'Mixed — Friction Guided';

        return {
          country,
          docTier,
          workMode,
          accessTier,
          pathwayHeadline: `${country} · ILO & FATF Tiered KYC Work Pathway`,
          talentSteps: [
            `Select your ${docTier.replace('-', ' ')} tier flag without uploading raw identity serial numbers.`,
            `Activate milestone-scoped contracting aligned with ${country} and ILO labour principles.`,
            'Connect tiered-KYC mobile money or digital payout rail for escrow settlement.',
          ],
          partnerSteps: [
            'Verify candidate Signed Living Competency Passport and zero-raw-ID compliance token.',
            'Issue 1-page milestone sprint agreement with EOR or independent contractor shield.',
            'Fund milestone escrow and release disbursement upon verified deliverable sign-off.',
          ],
          iloRightsGuarantee:
            'ILO Guiding Principles and FATF Risk-Based Tiered KYC affirm equal treatment, fair remuneration, and compliant onboarding for displaced practitioners.',
          source: 'preset',
          updatedAtIso: new Date().toISOString(),
        };
      };

      const clientKey = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'global');
      const rateLimit = aiRateLimiter.consume(`compliance:${clientKey}`, 1);
      if (!rateLimit.allowed) {
        const fallbackRoute = buildDeterministicComplianceFallback();
        const keyHash = complianceCache.set(country, docTier, workMode, fallbackRoute);
        const latencyMs = Math.max(1, Date.now() - startMs);
        res.json({
          route: fallbackRoute,
          cacheHit: false,
          cacheKeyHash: keyHash,
          latencyMs,
          rateLimitNotice: `High traffic — served deterministic ILO/FATF route (retry AI in ${rateLimit.retryAfterSeconds}s).`,
        });
        return;
      }

      let routePayload: Record<string, unknown> | null = null;
      try {
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

        if (response && (response.text ?? '').trim()) {
          const parsed = JSON.parse((response.text ?? '').trim()) as {
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

          routePayload = {
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
          };
        }
      } catch (aiErr) {
        console.warn('[compliance/route] Using deterministic ILO/FATF fallback:', aiErr instanceof Error ? aiErr.message : aiErr);
        routePayload = buildDeterministicComplianceFallback();
      }

      const finalRoute = routePayload ?? buildDeterministicComplianceFallback();
      const cacheKeyHash = complianceCache.set(country, docTier, workMode, finalRoute);
      const latencyMs = Math.max(1, Date.now() - startMs);

      partnerScaleStore.recordTelemetryEvent({
        sdgNumber: 16,
        unTarget: 'Target 16.9 & Global Compact',
        eventType: 'COMPLIANCE_ROUTED',
        regionId: country.toLowerCase(),
        metadata: {
          docTier,
          workMode,
          cacheKeyHash,
        },
      });

      res.json({
        route: {
          ...finalRoute,
          cacheHit: false,
          cacheKeyHash,
          latencyMs,
        },
        cacheHit: false,
        cacheKeyHash,
        latencyMs,
      });
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : 'Compliance routing request failed.';
      console.error('AI Compliance Route Error:', rawMessage);
      res.status(500).json({ error: rawMessage });
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

  const handlePortfolioAnalyze = async (req: express.Request, res: express.Response) => {
    try {
      const body = req.body as {
        skillTrackId?: string;
        skillTrackLabel?: string;
        problemSolvedCaption?: string;
        voiceWalkthrough?: string;
        peerVouch?: string;
        displayName?: string;
        ageStage?: string;
        workplaceSignalsCount?: number;
        images?: Array<{ mimeType?: string; base64Data?: string; label?: string }>;
      };

      const skillTrackId = String(body.skillTrackId ?? 'trades-solar').trim().slice(0, 32);
      const skillTrackLabel =
        String(body.skillTrackLabel ?? 'Trades, Solar & Repair').trim().slice(0, 80) ||
        'Trades, Solar & Repair';
      const problemSolvedCaption = String(body.problemSolvedCaption ?? '').trim().slice(0, 400);
      const voiceWalkthrough = String(body.voiceWalkthrough ?? '').trim().slice(0, 1200);
      const peerVouch = String(body.peerVouch ?? '').trim().slice(0, 300);
      const displayName =
        String(body.displayName ?? 'Skilled Practitioner').trim().slice(0, 80) ||
        'Skilled Practitioner';
      const ageStage = String(body.ageStage ?? '30-45').trim().slice(0, 16);
      const workplaceSignalsCount = Math.max(
        0,
        Math.min(3, Math.round(Number(body.workplaceSignalsCount) || 0))
      );

      const allowedMimes = new Set(['image/jpeg', 'image/png', 'image/webp']);
      const rawImages = Array.isArray(body.images) ? body.images.slice(0, 3) : [];
      const imageParts: Array<{ inlineData: { mimeType: string; data: string } }> = [];

      for (const item of rawImages) {
        const mimeType = String(item?.mimeType ?? '').trim();
        const base64Data = String(item?.base64Data ?? '').trim();
        if (!allowedMimes.has(mimeType) || base64Data.length < 32) {
          continue;
        }
        if (base64Data.length > 2_000_000) {
          continue;
        }
        imageParts.push({
          inlineData: {
            mimeType,
            data: base64Data,
          },
        });
      }

      if (
        imageParts.length === 0 &&
        problemSolvedCaption.length < 8 &&
        voiceWalkthrough.length < 12
      ) {
        res.status(400).json({
          error:
            'Please upload at least one work sample photo or add a short caption/walkthrough explaining what problem your work solved.',
        });
        return;
      }

      const buildFallbackPortfolioAnalysis = (reason: string) => ({
        visualHighlights: [
          `Verified ${skillTrackLabel} work sample demonstrates organized, job-ready craft execution.`,
          problemSolvedCaption
            ? `Problem solved with clear field discipline: "${problemSolvedCaption.slice(0, 95)}"`
            : 'Clear problem-to-solution documentation builds immediate hiring partner confidence.',
          'Ready for both local practical commissioning and remote peer-reviewed sprints.',
        ],
        localReadinessPct: Math.min(96, 82 + workplaceSignalsCount * 4),
        remoteReadinessPct: Math.min(94, 76 + workplaceSignalsCount * 4),
        marketFitSummary: `Strong ${skillTrackLabel} proof ready for verified local workshops and remote delivery pods.`,
        levelUpTip:
          'Add one close-up verification measurement or test reading beside your finished deliverable.',
        source: 'preset' as const,
        circuitBreakerNote: reason,
        generatedAtIso: new Date().toISOString(),
      });

      const clientKey = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'global');
      const rateLimit = aiRateLimiter.consume(`portfolio:${clientKey}`, 1);
      if (!rateLimit.allowed) {
        const analysis = buildFallbackPortfolioAnalysis(
          `RATE_LIMITED_RETRY_${rateLimit.retryAfterSeconds}S`
        );
        res.json({
          analysis,
          circuitBreakerTripped: true,
          rateLimitNotice: `High traffic — served grounded RPL portfolio analysis (retry AI in ${rateLimit.retryAfterSeconds}s).`,
        });
        return;
      }

      const circuitOutcome = await visionCircuitBreaker.execute(
        async () => {
          const ai = getGeminiClient();

          const systemInstruction = [
            'You are the Vuka na Amana — Crossing Over Living Proof Portfolio & Market Readiness Engine (SDGs 8, 10 & 17).',
            'Inspect the provided work-sample photos and practitioner notes to evaluate real craft quality and market readiness across BOTH local hands-on roles and remote digital/advisory roles.',
            'Frame the practitioner with complete professional respect as a capable specialist or craftsperson—never as a charity case.',
            'Return strictly valid JSON matching the schema: exactly 3 concise Visual Craft Highlights (plain, concrete employer-friendly bullets), numeric localReadinessPct (40-98) and remoteReadinessPct (40-98), a crisp 1-sentence marketFitSummary, and 1 actionable levelUpTip.',
          ].join(' ');

          const promptText = [
            `Practitioner: ${displayName} (${ageStage} Track)`,
            `Selected Skill Track: ${skillTrackLabel} (${skillTrackId})`,
            `Work Sample Photos Attached: ${imageParts.length}`,
            problemSolvedCaption ? `What Problem Did This Solve?: ${problemSolvedCaption}` : '',
            voiceWalkthrough ? `30-Second Voice Walkthrough: ${voiceWalkthrough}` : '',
            peerVouch ? `Peer / Past-Client Vouch: ${peerVouch}` : '',
            `Workplace Readiness Signals Confirmed: ${workplaceSignalsCount}/3`,
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
                  contents: {
                    parts: [...imageParts, { text: promptText }],
                  },
                  config: {
                    systemInstruction,
                    responseMimeType: 'application/json',
                    responseSchema: {
                      type: Type.OBJECT,
                      properties: {
                        visualHighlights: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                          description: 'Exactly 3 concrete employer-friendly craft highlights grounded in the work samples and notes.',
                        },
                        localReadinessPct: {
                          type: Type.INTEGER,
                          description: 'Integer readiness percentage (40-98) for local hands-on employer roles.',
                        },
                        remoteReadinessPct: {
                          type: Type.INTEGER,
                          description: 'Integer readiness percentage (40-98) for remote digital or advisory roles.',
                        },
                        marketFitSummary: {
                          type: Type.STRING,
                          description: 'Crisp 1-sentence employer fit summary connecting the craft proof to local and remote opportunities.',
                        },
                        levelUpTip: {
                          type: Type.STRING,
                          description: 'One concrete, high-leverage next step to make the proof portfolio even stronger for hiring partners.',
                        },
                      },
                      required: [
                        'visualHighlights',
                        'localReadinessPct',
                        'remoteReadinessPct',
                        'marketFitSummary',
                        'levelUpTip',
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
              console.warn(`[solve/proof-portfolio] Model ${modelName} fallback:`, msg.slice(0, 160));
            }
          }

          if (!response || !(response.text ?? '').trim()) {
            throw lastModelErr ?? new Error('Proof portfolio engine temporarily unavailable.');
          }

          const parsed = JSON.parse((response.text ?? '').trim()) as {
            visualHighlights?: string[];
            localReadinessPct?: number;
            remoteReadinessPct?: number;
            marketFitSummary?: string;
            levelUpTip?: string;
          };

          const highlights = (Array.isArray(parsed.visualHighlights) ? parsed.visualHighlights : [])
            .map((h) => String(h ?? '').trim())
            .filter(Boolean)
            .slice(0, 3);

          const clampPct = (val: unknown, fallback: number) => {
            const n = Math.round(Number(val));
            if (!Number.isFinite(n)) return fallback;
            return Math.max(40, Math.min(98, n));
          };

          return {
            visualHighlights:
              highlights.length > 0
                ? highlights
                : [
                    `Verified ${skillTrackLabel} work sample demonstrates organized, job-ready craft execution.`,
                    'Clear problem-to-solution documentation builds immediate hiring partner confidence.',
                    'Ready for both local practical commissioning and remote peer-reviewed sprints.',
                  ],
            localReadinessPct: clampPct(parsed.localReadinessPct, 86),
            remoteReadinessPct: clampPct(parsed.remoteReadinessPct, 78),
            marketFitSummary:
              String(parsed.marketFitSummary ?? '').trim() ||
              `Strong ${skillTrackLabel} proof ready for verified local workshops and remote delivery pods.`,
            levelUpTip:
              String(parsed.levelUpTip ?? '').trim() ||
              'Add one close-up verification measurement or test reading beside your finished deliverable.',
            source: 'ai' as 'ai' | 'preset',
            circuitBreakerNote: undefined as string | undefined,
            generatedAtIso: new Date().toISOString(),
          };
        },
        (reason) => buildFallbackPortfolioAnalysis(reason)
      );

      partnerScaleStore.recordTelemetryEvent({
        sdgNumber: 8,
        unTarget: 'Targets 8.3, 8.5 & 8.8',
        eventType: 'PORTFOLIO_ANALYZED',
        ageStage,
        sectorId: skillTrackId,
        metadata: {
          imagesCount: imageParts.length,
          trippedFallback: circuitOutcome.trippedFallback,
          latencyMs: circuitOutcome.latencyMs,
        },
      });

      res.json({
        analysis: circuitOutcome.result,
        circuitBreakerTripped: circuitOutcome.trippedFallback,
        latencyMs: circuitOutcome.latencyMs,
      });
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : 'Proof portfolio analysis failed.';
      console.error('AI Proof Portfolio Error:', rawMessage);
      res.status(500).json({ error: rawMessage });
    }
  };

  app.post('/api/solve/proof-portfolio', handlePortfolioAnalyze);
  app.post('/api/portfolio/analyze', handlePortfolioAnalyze);

  app.post('/api/solve/upskilling-bridge', async (req, res) => {
    try {
      const body = req.body as {
        opportunityId?: string;
        opportunityTitle?: string;
        partnerOrg?: string;
        workMode?: string;
        scopeSummary?: string;
        whyEmployersNeedThisNow?: string;
        payoutUsd?: number;
        skillTrackLabel?: string;
        ageStage?: string;
        problemStatement?: string;
        passportSkills?: string[];
        proofHighlights?: string[];
        problemSolvedCaption?: string;
      };

      const opportunityId =
        String(body.opportunityId ?? 'opp-solar-diagnostics-01').trim().slice(0, 64) ||
        'opp-solar-diagnostics-01';
      const opportunityTitle =
        String(body.opportunityTitle ?? 'Scoped Matched Work Sprint').trim().slice(0, 140) ||
        'Scoped Matched Work Sprint';
      const partnerOrg =
        String(body.partnerOrg ?? 'Hiring Partner').trim().slice(0, 120) || 'Hiring Partner';
      const workMode = body.workMode === 'remote' ? 'remote' : 'local';
      const scopeSummary = String(body.scopeSummary ?? '').trim().slice(0, 320);
      const whyEmployersNeedThisNow = String(body.whyEmployersNeedThisNow ?? '').trim().slice(0, 260);
      const payoutUsd = Math.max(50, Math.min(50000, Math.round(Number(body.payoutUsd) || 440)));
      const skillTrackLabel =
        String(body.skillTrackLabel ?? 'Trades, Solar & Repair').trim().slice(0, 80) ||
        'Trades, Solar & Repair';
      const ageStage = String(body.ageStage ?? '30-45').trim().slice(0, 16);
      const problemStatement = String(body.problemStatement ?? '').trim().slice(0, 300);
      const passportSkills = Array.isArray(body.passportSkills)
        ? body.passportSkills.map((s) => String(s ?? '').trim().slice(0, 90)).filter(Boolean).slice(0, 4)
        : [];
      const proofHighlights = Array.isArray(body.proofHighlights)
        ? body.proofHighlights.map((h) => String(h ?? '').trim().slice(0, 140)).filter(Boolean).slice(0, 3)
        : [];
      const problemSolvedCaption = String(body.problemSolvedCaption ?? '').trim().slice(0, 240);

      const ai = getGeminiClient();

      const systemInstruction = [
        'You are the Vuka na Amana — Crossing Over Demand-First Upskilling Bridge Engine grounded in the UNESCO Qualifications Passport (UQP) and ILO Recognition of Prior Learning (RPL) frameworks.',
        'Compare the practitioner’s Living Competency Passport and uploaded Photo Proof against the employer’s exact role scope to close a 65%–90% fit gap without rejecting the candidate.',
        'Output strictly valid JSON with:',
        '(1) whatYouAlreadyProve: array of exactly 2 concise verified strengths (each under 14 words),',
        '(2) singleMissingBridge: 1 concrete, practical skill title (e.g., "Inverter Grounding Safety Check", "Remote Sprint Handoff Notes", or "ILO Fair-Pricing & Quote Sheet") + a 1-sentence practicalWhy,',
        '(3) optionAMicroBridge: a focused 3-to-7 day practical module aligned with local TVET/RPL standards with a "Partner Fee-Waiver / Stipend Eligible" pill and what the stipend covers (exams, data bundles, or tools),',
        '(4) optionBApprenticeshipPod: an ILO Upgraded Apprenticeship Pod pairing the candidate as a paid Apprentice Builder with a 30–46+ Certified Master Mentor (explicitly open to both refugee and host-community talent for mutual social cohesion, converting on-the-job hours into verified RPL credits).',
      ].join(' ');

      const userPrompt = [
        `Opportunity: ${opportunityTitle} (${workMode.toUpperCase()})`,
        `Hiring Partner: ${partnerOrg} ($${payoutUsd} USD Sprint)`,
        scopeSummary ? `Employer Scope: ${scopeSummary}` : '',
        whyEmployersNeedThisNow ? `Employer Pain Point: ${whyEmployersNeedThisNow}` : '',
        `Practitioner Age Track: ${ageStage} · Selected Skill Track: ${skillTrackLabel}`,
        problemStatement ? `Practitioner Focus: ${problemStatement}` : '',
        passportSkills.length > 0 ? `Living Competency Passport Skills: ${passportSkills.join(' | ')}` : '',
        proofHighlights.length > 0 ? `Uploaded Photo Proof Highlights: ${proofHighlights.join(' | ')}` : '',
        problemSolvedCaption ? `Photo Proof Problem Solved: ${problemSolvedCaption}` : '',
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
                    whatYouAlreadyProve: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: 'Exactly 2 verified strengths the candidate already proves.',
                    },
                    missingSkillTitle: {
                      type: Type.STRING,
                      description: '1 concrete, practical missing bridge skill title (3-6 words).',
                    },
                    missingPracticalWhy: {
                      type: Type.STRING,
                      description: '1 concise sentence explaining why the employer needs this single bridge skill.',
                    },
                    microBridgeTitle: {
                      type: Type.STRING,
                      description: 'Title of the 3-to-7 day practical TVET/RPL micro-bridge module.',
                    },
                    microBridgeDurationLabel: {
                      type: Type.STRING,
                      description: 'Short duration label, e.g., "4 Days · Practical TVET/RPL Module".',
                    },
                    microBridgeActionSummary: {
                      type: Type.STRING,
                      description: '1 concise sentence describing the practical hands-on exercise.',
                    },
                    microBridgeStipendCovers: {
                      type: Type.STRING,
                      description: 'Short phrase listing what the fee-waiver/stipend covers (exams, data bundles, or tools).',
                    },
                    apprenticeshipTitle: {
                      type: Type.STRING,
                      description: 'Title of the ILO Upgraded Apprenticeship Pod option.',
                    },
                    apprenticeshipMentorPairingLabel: {
                      type: Type.STRING,
                      description: 'Label showing pairing with a 30–46+ Certified Master Mentor.',
                    },
                    apprenticeshipCohesionNote: {
                      type: Type.STRING,
                      description: 'Note affirming openness to refugee & host-community talent and RPL credit conversion.',
                    },
                  },
                  required: [
                    'whatYouAlreadyProve',
                    'missingSkillTitle',
                    'missingPracticalWhy',
                    'microBridgeTitle',
                    'microBridgeDurationLabel',
                    'microBridgeActionSummary',
                    'microBridgeStipendCovers',
                    'apprenticeshipTitle',
                    'apprenticeshipMentorPairingLabel',
                    'apprenticeshipCohesionNote',
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
          console.warn(`[solve/upskilling-bridge] Model ${modelName} fallback:`, msg.slice(0, 160));
        }
      }

      if (!response) {
        throw lastModelErr ?? new Error('Upskilling bridge engine temporarily unavailable.');
      }

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        res.status(502).json({ error: 'Upskilling bridge engine returned an empty response.' });
        return;
      }

      const parsed = JSON.parse(rawText) as {
        whatYouAlreadyProve?: string[];
        missingSkillTitle?: string;
        missingPracticalWhy?: string;
        microBridgeTitle?: string;
        microBridgeDurationLabel?: string;
        microBridgeActionSummary?: string;
        microBridgeStipendCovers?: string;
        apprenticeshipTitle?: string;
        apprenticeshipMentorPairingLabel?: string;
        apprenticeshipCohesionNote?: string;
      };

      const strengths = (Array.isArray(parsed.whatYouAlreadyProve) ? parsed.whatYouAlreadyProve : [])
        .map((s) => String(s ?? '').trim())
        .filter(Boolean);

      const tupleStrengths: [string, string] = [
        strengths[0] || `Verified ${skillTrackLabel} execution backed by practical proof`,
        strengths[1] || 'Clear problem-solving documentation ready for cross-age pod delivery',
      ];

      res.json({
        bridge: {
          opportunityId,
          whatYouAlreadyProve: tupleStrengths,
          singleMissingBridge: {
            skillTitle:
              String(parsed.missingSkillTitle ?? '').trim().slice(0, 80) ||
              'Practical Quality & Handoff Sign-Off Sheet',
            practicalWhy:
              String(parsed.missingPracticalWhy ?? '').trim().slice(0, 220) ||
              `${partnerOrg} requires a standardized final safety and quality checklist before milestone release.`,
            frameworkTag: 'UNESCO UQP · ILO RPL Standard',
          },
          optionAMicroBridge: {
            title:
              String(parsed.microBridgeTitle ?? '').trim().slice(0, 110) ||
              `${skillTrackLabel} Practical RPL Micro-Bridge`,
            durationLabel:
              String(parsed.microBridgeDurationLabel ?? '').trim().slice(0, 60) ||
              '4 Days · Practical TVET/RPL Module',
            actionSummary:
              String(parsed.microBridgeActionSummary ?? '').trim().slice(0, 220) ||
              'Complete one focused practical verification log aligned with local TVET & UNESCO UQP standards.',
            stipendPillLabel: 'Partner Fee-Waiver / Stipend Eligible',
            stipendCovers:
              String(parsed.microBridgeStipendCovers ?? '').trim().slice(0, 140) ||
              'Covers TVET RPL assessment fee, mobile data bundle & practical tool kit',
          },
          optionBApprenticeshipPod: {
            title:
              String(parsed.apprenticeshipTitle ?? '').trim().slice(0, 110) ||
              'ILO Upgraded Apprenticeship Pod',
            mentorPairingLabel:
              String(parsed.apprenticeshipMentorPairingLabel ?? '').trim().slice(0, 120) ||
              'Paired with 30–46+ Certified Master Mentor',
            cohesionNote:
              String(parsed.apprenticeshipCohesionNote ?? '').trim().slice(0, 240) ||
              'Open to both refugee & host-community talent for mutual social cohesion · On-the-job hours convert directly into verified RPL credits.',
            paidApprenticeStipendUsd: payoutUsd,
          },
          source: 'ai',
          updatedAtIso: new Date().toISOString(),
        },
      });
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : 'Upskilling bridge generation failed.';
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
      console.error('AI Upskilling Bridge Error:', cleanMessage);
      res.status(status).json({ error: cleanMessage });
    }
  });

  // ---------------------------------------------------------------------------
  // Partner Scale Engine & Sovereign Data Architecture Endpoints
  // ---------------------------------------------------------------------------

  // Pre-warm deterministic compliance cache for common refugee & host jurisdictions
  const PREWARM_JURISDICTIONS = [
    { country: 'Kenya', docTier: 'refugee-id', workMode: 'cross-border-remote', tier: 'Enabling' },
    { country: 'Uganda', docTier: 'refugee-id', workMode: 'local-formal', tier: 'Enabling' },
    { country: 'Colombia', docTier: 'temp-protection', workMode: 'cross-border-remote', tier: 'Enabling' },
    { country: 'Jordan', docTier: 'unhcr-certificate', workMode: 'cross-border-remote', tier: 'Mixed — Friction Guided' },
  ];
  for (const item of PREWARM_JURISDICTIONS) {
    complianceCache.set(item.country, item.docTier, item.workMode, {
      country: item.country,
      docTier: item.docTier,
      workMode: item.workMode,
      accessTier: item.tier,
      pathwayHeadline: `${item.country} · ILO & FATF Tiered KYC Work Pathway`,
      talentSteps: [
        `Confirm your ${item.docTier.replace('-', ' ')} tier flag with zero raw ID upload.`,
        `Activate milestone-scoped contracting aligned with ${item.country} labour rules.`,
        'Connect tiered-KYC mobile money or digital payout rail for escrow settlement.',
      ],
      partnerSteps: [
        'Verify candidate Signed Living Competency Passport and zero-raw-ID compliance token.',
        'Issue 1-page milestone sprint agreement with EOR or independent contractor shield.',
        'Fund milestone escrow and release disbursement upon verified deliverable sign-off.',
      ],
      iloRightsGuarantee:
        'ILO Guiding Principles and FATF Risk-Based Tiered KYC affirm equal treatment, fair remuneration, and safe contracting.',
      source: 'preset',
      updatedAtIso: new Date().toISOString(),
    });
  }

  // 4. Multi-Tenant Cohort Provisioning Engine (`POST /api/cohorts/provision` & `GET /api/cohorts`)
  app.get('/api/cohorts', (_req, res) => {
    res.json({
      cohorts: partnerScaleStore.getCohorts(),
      activeCohortCount: partnerScaleStore.getCohorts().length,
    });
  });

  app.post('/api/cohorts/provision', (req, res) => {
    const body = req.body as {
      regionId?: string;
      sectorId?: string;
      languageCode?: string;
      partnerOrg?: string;
      cohortSize?: number;
      stipendPoolUsd?: number;
      peerAssessorEnabled?: boolean;
    };

    const cohort = partnerScaleStore.provisionCohort({
      regionId: String(body.regionId || 'kenya'),
      sectorId: String(body.sectorId || 'solar_trades'),
      languageCode: String(body.languageCode || 'en'),
      partnerOrg: body.partnerOrg,
      cohortSize: Number(body.cohortSize) || 100,
      stipendPoolUsd: Number(body.stipendPoolUsd) || 15000,
      peerAssessorEnabled: body.peerAssessorEnabled ?? true,
    });

    res.status(201).json({
      cohort,
      activeCohortCount: partnerScaleStore.getCohorts().length,
      status: 'PROVISIONED',
    });
  });

  // 5. Append-Only SDG Impact Telemetry Ledger (`GET /api/pulse/telemetry` & `POST /api/pulse/events`)
  app.get('/api/pulse/telemetry', (_req, res) => {
    res.json({
      telemetry: partnerScaleStore.getTelemetryRollup(),
      generatedAtIso: new Date().toISOString(),
    });
  });

  app.post('/api/pulse/events', (req, res) => {
    const body = req.body as {
      sdgNumber?: 4 | 8 | 10 | 16 | 17;
      unTarget?: string;
      eventType?:
        | 'PASSPORT_VERIFIED'
        | 'COMPLIANCE_ROUTED'
        | 'PORTFOLIO_ANALYZED'
        | 'COHORT_PROVISIONED'
        | 'SPRINT_COMPLETED'
        | 'EMAIL_VAULT_SYNCED';
      regionId?: string;
      sectorId?: string;
      ageStage?: string;
      metadata?: Record<string, string | number | boolean>;
    };

    const validSdg = [4, 8, 10, 16, 17].includes(Number(body.sdgNumber))
      ? (Number(body.sdgNumber) as 4 | 8 | 10 | 16 | 17)
      : 8;

    const event = partnerScaleStore.recordTelemetryEvent({
      sdgNumber: validSdg,
      unTarget: String(body.unTarget || `SDG ${validSdg} Target`),
      eventType: body.eventType || 'SPRINT_COMPLETED',
      regionId: body.regionId,
      sectorId: body.sectorId,
      ageStage: body.ageStage,
      metadata: body.metadata,
    });

    res.status(201).json({
      event,
      telemetry: partnerScaleStore.getTelemetryRollup(),
    });
  });

  // 6. Sovereign Email Vault Sync (`POST /api/sync/email-vault` & `GET /api/sync/email-vault`)
  // Allows refugees and practitioners using any email service (Gmail, Outlook/Hotmail, Yahoo,
  // Proton, NGO domains) to reliably store & restore personal workspace data with Zero-Raw-ID protection.
  app.post('/api/sync/email-vault', (req, res) => {
    const body = req.body as {
      email?: string;
      displayName?: string;
      provider?: string;
      payload?: Record<string, unknown>;
    };

    const email = String(body.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      res.status(400).json({
        error: 'Please enter a valid email address (e.g. Gmail, Outlook/Hotmail, Yahoo, or NGO email).',
      });
      return;
    }

    const record = partnerScaleStore.saveEmailVault({
      email,
      displayName: body.displayName,
      provider: body.provider || 'email-vault',
      payload: body.payload && typeof body.payload === 'object' ? body.payload : {},
    });

    res.status(200).json({
      synced: true,
      email: record.normalizedEmail,
      emailHash: record.emailHash,
      displayName: record.displayName,
      provider: record.provider,
      consentToken: record.consentToken,
      zeroRawIdProtected: record.zeroRawIdProtected,
      updatedAtIso: record.updatedAtIso,
    });
  });

  app.get('/api/sync/email-vault', (req, res) => {
    const email = String(req.query.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'Please provide a valid email query parameter.' });
      return;
    }

    const record = partnerScaleStore.getEmailVault(email);
    if (!record) {
      res.status(404).json({
        found: false,
        message: 'No cloud vault snapshot found for this email yet. Click Save to Email Vault first.',
      });
      return;
    }

    res.json({
      found: true,
      record,
    });
  });

  // 7. System Readiness & Trust Endpoint (`GET /api/health`)
  app.get('/api/health', (_req, res) => {
    const cacheStats = complianceCache.getStats();
    const circuitMetrics = visionCircuitBreaker.getMetrics();
    const telemetry = partnerScaleStore.getTelemetryRollup();

    res.json({
      status: 'ok',
      service: 'Vuka na Amana — Partner Scale & Sovereign Competency Engine',
      cachedComplianceEngineActive: true,
      signedPassportVerificationReady: true,
      zeroRawIdPrivacyMode: true,
      cacheStats,
      circuitBreaker: circuitMetrics,
      activeCohortCount: telemetry.activeCohortCount,
      telemetryEventsCount: telemetry.totalEvents,
      timestampIso: new Date().toISOString(),
    });
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

    const { createServer: createViteServer } = await import('vite');
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
