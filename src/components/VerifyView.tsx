import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Award,
  Check,
  CheckCircle2,
  Compass,
  Copy,
  Eye,
  FileCheck2,
  FileText,
  GraduationCap,
  Hammer,
  ImagePlus,
  Loader2,
  Mic,
  MicOff,
  Plus,
  QrCode,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  Wrench,
  X,
} from 'lucide-react';
import type {
  AgeStage,
  BriefSubmission,
  CompetencyPassport,
  PeerEndorsement,
  PractitionerProfile,
  SharedPassportPayload,
  SkillCapability,
  StudioDomain,
  VerificationRouteId,
} from '../types/kora';
import {
  ADAPTIVE_VERIFICATION_ROUTES,
  AGE_STAGE_PATHWAYS,
  FOREIGN_CIVIL_TRANSCRIPT_SAMPLE,
  PRACTICAL_SCENARIOS,
  PRACTICE_DOMAINS,
  RPL_INFORMAL_CRAFT_SAMPLE,
  STUDIO_DOMAINS,
  UQP_STRUCTURED_RECONSTRUCTION_SAMPLE,
  buildAdaptiveCompetencyPassportFallback,
  buildSharedPassportLink,
  buildSharedPassportPayload,
  computeMilestoneBadges,
  computePassportTrustTier,
  getRecommendedVerifyRoute,
  makeSafeId,
  sanitizeText,
} from '../utils/talentEngine';
import type { TranslationDictionary } from '../utils/i18n';
import { WovenBridgeArcsMotif } from './ResilienceMotifs';

interface VerifyViewProps {
  profile: PractitionerProfile;
  capabilities: SkillCapability[];
  contributions?: BriefSubmission[];
  passport: CompetencyPassport | null;
  endorsements: PeerEndorsement[];
  isOnline: boolean;
  speechLang: string;
  t: TranslationDictionary;
  onUpdateProfileFocus: (problemStatement: string, ageStage: AgeStage) => void;
  onAddCapability: (data: {
    title: string;
    domain: string;
    proofSummary: string;
    portfolioRef?: string;
    certificationRef?: string;
    peerEndorsement?: string;
  }) => void;
  onPromoteCapability: (capabilityId: string) => void;
  onDeleteCapability: (capabilityId: string) => void;
  onSavePassport: (passport: CompetencyPassport) => void;
  onTogglePassportStipend: (eligible: boolean) => void;
  onImportPassportSkills: (sourcePassport: CompetencyPassport) => number;
  onRequestEndorsement: (input: {
    collaboratorName: string;
    collaboratorRole: string;
    organization: string;
    capabilityTitle: string;
    endorsementText?: string;
    sourceTab: 'verify' | 'unlock';
  }) => PeerEndorsement;
  onCompleteEndorsement: (endorsementId: string, endorsementText: string) => void;
  onDeleteEndorsement: (endorsementId: string) => void;
  onPreviewSharedPassport: (payload: SharedPassportPayload) => void;
  sharePassportSignal?: number;
  voiceTriggerSignal?: number;
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativeLike;
  isFinal?: boolean;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

export const VerifyView: React.FC<VerifyViewProps> = ({
  profile,
  capabilities,
  contributions = [],
  passport,
  endorsements,
  isOnline,
  speechLang,
  t,
  onUpdateProfileFocus,
  onAddCapability,
  onPromoteCapability,
  onDeleteCapability,
  onSavePassport,
  onTogglePassportStipend,
  onImportPassportSkills,
  onRequestEndorsement,
  onCompleteEndorsement,
  onDeleteEndorsement,
  onPreviewSharedPassport,
  sharePassportSignal = 0,
  voiceTriggerSignal = 0,
}) => {
  // Adaptive Verification Route pre-selected by Age Stage from Landing Funnel
  const recommendedRoute = useMemo(
    () => getRecommendedVerifyRoute(profile.ageStage),
    [profile.ageStage]
  );

  const [verificationRoute, setVerificationRoute] = useState<VerificationRouteId>(
    passport?.verificationRoute ?? recommendedRoute
  );
  const [studioDomain, setStudioDomain] = useState<StudioDomain>(
    passport?.studioDomain ?? 'Green Energy'
  );

  // Sync recommended route when user switches Age Stage from the Landing Funnel (unless a passport route is locked)
  useEffect(() => {
    if (!passport?.verificationRoute) {
      setVerificationRoute(recommendedRoute);
    }
  }, [recommendedRoute, passport?.verificationRoute]);

  // Route A State: Foreign Qualification or Partial Copy (WES Gateway / ENIC-NARIC Track)
  const [routeAInstitution, setRouteAInstitution] = useState(
    FOREIGN_CIVIL_TRANSCRIPT_SAMPLE.institutionName
  );
  const [routeACredential, setRouteACredential] = useState(
    FOREIGN_CIVIL_TRANSCRIPT_SAMPLE.credentialTitle
  );
  const [routeAHostCountry, setRouteAHostCountry] = useState(
    FOREIGN_CIVIL_TRANSCRIPT_SAMPLE.hostCountryTarget
  );
  const [routeAResponseText, setRouteAResponseText] = useState(
    profile.problemStatement || FOREIGN_CIVIL_TRANSCRIPT_SAMPLE.responseText
  );
  const [routeADocumentLabel, setRouteADocumentLabel] = useState<string>(
    'Partial Transcript (Semesters 1–7) · Civil & Structural Engineering'
  );
  const routeAFileInputRef = useRef<HTMLInputElement | null>(null);

  // Route B State: Missing or Lost Paperwork (UNESCO UQP Structured Track — 3-part guided flow)
  const [uqpStep, setUqpStep] = useState<1 | 2 | 3>(1);
  const [uqpField, setUqpField] = useState(
    UQP_STRUCTURED_RECONSTRUCTION_SAMPLE.backgroundField
  );
  const [uqpYears, setUqpYears] = useState(
    UQP_STRUCTURED_RECONSTRUCTION_SAMPLE.yearsPracticed
  );
  const [uqpLanguage, setUqpLanguage] = useState(
    UQP_STRUCTURED_RECONSTRUCTION_SAMPLE.languageFluency
  );
  const [uqpDefense1, setUqpDefense1] = useState(
    UQP_STRUCTURED_RECONSTRUCTION_SAMPLE.oralDefense1
  );
  const [uqpDefense2, setUqpDefense2] = useState(
    UQP_STRUCTURED_RECONSTRUCTION_SAMPLE.oralDefense2
  );
  const [uqpContextNotes, setUqpContextNotes] = useState(
    UQP_STRUCTURED_RECONSTRUCTION_SAMPLE.alternativeContextNotes
  );

  // Route C State: Hands-On / Informal Craft (ILO & KNQA RPL Portfolio Track)
  const [rplCraftTitle, setRplCraftTitle] = useState(
    RPL_INFORMAL_CRAFT_SAMPLE.craftTitle
  );
  const [rplWalkthrough, setRplWalkthrough] = useState(
    RPL_INFORMAL_CRAFT_SAMPLE.howIBuiltThis
  );
  const [rplVouch, setRplVouch] = useState(
    RPL_INFORMAL_CRAFT_SAMPLE.clientOrMentorVouch
  );
  const [rplPhotoDataUrl, setRplPhotoDataUrl] = useState<string>(
    RPL_INFORMAL_CRAFT_SAMPLE.samplePhotoDataUrl
  );
  const [rplPhotoLabel, setRplPhotoLabel] = useState<string>(
    '48V Hybrid Inverter & DC Breaker Board Assembly'
  );
  const rplFileInputRef = useRef<HTMLInputElement | null>(null);

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [skillsImported, setSkillsImported] = useState(false);

  // Voice-Note Microphone State
  const [isListening, setIsListening] = useState(false);
  const [voiceTargetField, setVoiceTargetField] = useState<
    'route-a' | 'uqp-1' | 'uqp-2' | 'rpl'
  >('route-a');
  const [voiceStatusNote, setVoiceStatusNote] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Secondary Quick-Add Manual Skill Drawer
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState<string>(PRACTICE_DOMAINS[0]);
  const [proofSummary, setProofSummary] = useState('');
  const [portfolioRef, setPortfolioRef] = useState('');

  // Peer Endorsement Form State
  const [showEndorseForm, setShowEndorseForm] = useState(false);
  const [endorseName, setEndorseName] = useState('');
  const [endorseRole, setEndorseRole] = useState('');
  const [endorseOrg, setEndorseOrg] = useState('');
  const [endorseSkill, setEndorseSkill] = useState(
    capabilities[0]?.title ?? '48V Solar Inverter & Lithium Bank Diagnostics'
  );
  const [endorseDirectQuote, setEndorseDirectQuote] = useState('');
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [copiedEndorseId, setCopiedEndorseId] = useState<string | null>(null);

  // Export / Share Verified Passport Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [copiedPassportLink, setCopiedPassportLink] = useState(false);

  const currentScenario = PRACTICAL_SCENARIOS[studioDomain];

  const milestoneBadges = useMemo(
    () => computeMilestoneBadges(capabilities, contributions, passport),
    [capabilities, contributions, passport]
  );

  const trustLadder = useMemo(
    () =>
      computePassportTrustTier({
        passport,
        capabilities,
        endorsements,
        contributions,
      }),
    [passport, capabilities, endorsements, contributions]
  );

  const sharedPassportPayload = useMemo(
    () =>
      buildSharedPassportPayload({
        profile,
        passport,
        capabilities,
        endorsements,
      }),
    [profile, passport, capabilities, endorsements]
  );

  const sharedPassportUrl = useMemo(() => {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'https://vukanaamana.app';
    return buildSharedPassportLink(origin, sharedPassportPayload);
  }, [sharedPassportPayload]);

  const handleCopySharedPassportLink = async () => {
    try {
      await navigator.clipboard.writeText(sharedPassportUrl);
      setCopiedPassportLink(true);
      window.setTimeout(() => setCopiedPassportLink(false), 2600);
    } catch {
      setCopiedPassportLink(false);
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore cleanup error
        }
      }
    };
  }, []);

  useEffect(() => {
    if (sharePassportSignal > 0) {
      setShowExportModal(true);
    }
  }, [sharePassportSignal]);

  useEffect(() => {
    if (voiceTriggerSignal > 0 && !isListening) {
      handleToggleVoiceNote(
        verificationRoute === 'route-a-foreign'
          ? 'route-a'
          : verificationRoute === 'route-b-uqp'
            ? 'uqp-1'
            : 'rpl'
      );
    }
  }, [voiceTriggerSignal]);

  const appendTranscriptToActiveField = (
    target: 'route-a' | 'uqp-1' | 'uqp-2' | 'rpl',
    transcript: string
  ) => {
    const cleaned = transcript.trim();
    if (!cleaned) return;
    if (target === 'route-a') {
      setRouteAResponseText((prev) => `${prev.trim()} ${cleaned}`.trim());
    } else if (target === 'uqp-1') {
      setUqpDefense1((prev) => `${prev.trim()} ${cleaned}`.trim());
    } else if (target === 'uqp-2') {
      setUqpDefense2((prev) => `${prev.trim()} ${cleaned}`.trim());
    } else {
      setRplWalkthrough((prev) => `${prev.trim()} ${cleaned}`.trim());
    }
  };

  const handleToggleVoiceNote = (
    target: 'route-a' | 'uqp-1' | 'uqp-2' | 'rpl' = 'route-a'
  ) => {
    setVoiceTargetField(target);
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const win = window as unknown as {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRec) {
      const sampleVoicePrompt =
        studioDomain === 'Green Energy'
          ? 'Voice Note Transcribed: I isolated the 48V critical vaccine refrigerator bus, load-tested each LiFePO4 block under 25A draw, identified a 0.45V sag on Block #3 caused by a corroded M8 lug, re-torqued the busbar to 14Nm, and stabilized overnight autonomy.'
          : studioDomain === 'Tech'
            ? 'Voice Note Transcribed: I added a deterministic client mutation ID stored in IndexedDB with exponential backoff and a server-side idempotency ledger so 2G retries never duplicate inventory deductions.'
            : studioDomain === 'Healthcare Ops'
              ? 'Voice Note Transcribed: I quarantined the 9.4°C excursion lot in a sealed bin, cross-checked the WHO VVM2 stability table, rotated backup cold-boxes, and briefed multilingual triage nurses.'
              : 'Voice Note Transcribed: I built a 13-week rolling cash-flow ledger, staged raw-material supplier payouts into two milestones, and accelerated 50% buyer deposits to close the Friday liquidity gap.';

      appendTranscriptToActiveField(target, sampleVoicePrompt);
      setVoiceStatusNote(
        'Voice-to-text simulated (browser Speech API unavailable in this frame).'
      );
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.lang = speechLang || 'en-US';
      rec.interimResults = false;
      rec.continuous = false;

      rec.onresult = (event: SpeechRecognitionEventLike) => {
        const transcript = Array.from(event.results)
          .map((res) => res[0]?.transcript ?? '')
          .join(' ')
          .trim();
        if (transcript) {
          appendTranscriptToActiveField(target, transcript);
          setVoiceStatusNote('Voice note captured and appended.');
        }
      };

      rec.onerror = () => {
        setIsListening(false);
        setVoiceStatusNote(
          'Microphone permission unavailable — you can type or tap a 1-click sample preset.'
        );
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      setIsListening(true);
      setVoiceStatusNote(`Listening (${speechLang})... speak naturally about how you solve problems.`);
      rec.start();
    } catch {
      setIsListening(false);
      setVoiceStatusNote('Could not start microphone in this browser environment.');
    }
  };

  // Sample Preset Triggers
  const handleApplyRouteASample = () => {
    setStudioDomain(FOREIGN_CIVIL_TRANSCRIPT_SAMPLE.domain);
    setRouteAInstitution(FOREIGN_CIVIL_TRANSCRIPT_SAMPLE.institutionName);
    setRouteACredential(FOREIGN_CIVIL_TRANSCRIPT_SAMPLE.credentialTitle);
    setRouteAHostCountry(FOREIGN_CIVIL_TRANSCRIPT_SAMPLE.hostCountryTarget);
    setRouteAResponseText(FOREIGN_CIVIL_TRANSCRIPT_SAMPLE.responseText);
    setRouteADocumentLabel(FOREIGN_CIVIL_TRANSCRIPT_SAMPLE.evidenceSummary);
    setAiError(null);
  };

  const handleApplyRouteBSample = () => {
    setStudioDomain('Green Energy');
    setUqpField(UQP_STRUCTURED_RECONSTRUCTION_SAMPLE.backgroundField);
    setUqpYears(UQP_STRUCTURED_RECONSTRUCTION_SAMPLE.yearsPracticed);
    setUqpLanguage(UQP_STRUCTURED_RECONSTRUCTION_SAMPLE.languageFluency);
    setUqpDefense1(UQP_STRUCTURED_RECONSTRUCTION_SAMPLE.oralDefense1);
    setUqpDefense2(UQP_STRUCTURED_RECONSTRUCTION_SAMPLE.oralDefense2);
    setUqpContextNotes(UQP_STRUCTURED_RECONSTRUCTION_SAMPLE.alternativeContextNotes);
    setAiError(null);
  };

  const handleApplyRouteCSample = () => {
    setStudioDomain('Green Energy');
    setRplCraftTitle(RPL_INFORMAL_CRAFT_SAMPLE.craftTitle);
    setRplWalkthrough(RPL_INFORMAL_CRAFT_SAMPLE.howIBuiltThis);
    setRplVouch(RPL_INFORMAL_CRAFT_SAMPLE.clientOrMentorVouch);
    setRplPhotoDataUrl(RPL_INFORMAL_CRAFT_SAMPLE.samplePhotoDataUrl);
    setRplPhotoLabel('48V Hybrid Inverter & DC Breaker Board Assembly (Sample Photo)');
    setAiError(null);
  };

  const handleRouteAFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRouteADocumentLabel(`${file.name} (${Math.max(1, Math.round(file.size / 1024))} KB · Uploaded)`);
  };

  const handleRplPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRplPhotoLabel(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setRplPhotoDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleVerifyWithAi = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiError(null);

    let combinedResponseText = '';
    let combinedEvidenceSummary = '';
    let languageFluency = '';
    let institutionName = '';
    let hostCountryTarget = '';
    let clientVouch = '';

    if (verificationRoute === 'route-a-foreign') {
      combinedResponseText = [
        `Foreign Qualification / Partial Copy: ${routeACredential}`,
        `Original Institution: ${routeAInstitution}`,
        `Target Host-Country Recognition: ${routeAHostCountry}`,
        `Practical Experience & Coursework Reconstruction: ${routeAResponseText}`,
      ].join('\n');
      combinedEvidenceSummary = `${routeACredential} · ${routeADocumentLabel}`;
      institutionName = routeAInstitution;
      hostCountryTarget = routeAHostCountry;
    } else if (verificationRoute === 'route-b-uqp') {
      combinedResponseText = [
        `Part 1 (Background Reconstruction): Field: ${uqpField} | Years Practiced: ${uqpYears} | Languages: ${uqpLanguage}`,
        `Part 2A (Technical Diagnostic Defense): ${uqpDefense1}`,
        `Part 2B (Field Safety & Lockout-Tagout Defense): ${uqpDefense2}`,
        `Part 3 (Alternative Context & Leadership Notes): ${uqpContextNotes}`,
      ].join('\n\n');
      combinedEvidenceSummary = `UNESCO UQP 3-Part Structured Reconstruction (${uqpYears} in ${uqpField})`;
      languageFluency = uqpLanguage;
    } else {
      combinedResponseText = [
        `Hands-On Craft / System Built: ${rplCraftTitle}`,
        `30-Second "How I Built / Fixed This" Walkthrough: ${rplWalkthrough}`,
        rplVouch ? `Past-Client / Master Mentor Vouch: ${rplVouch}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');
      combinedEvidenceSummary = `ILO/KNQA RPL Visual Evidence (${rplPhotoLabel}) + Practical Walkthrough`;
      clientVouch = rplVouch;
    }

    if (combinedResponseText.trim().length < 15) {
      setAiError(
        'Please share a short explanation or tap the 1-click sample preset so the verification engine can map your competency.'
      );
      return;
    }

    setIsEvaluating(true);
    setSkillsImported(false);

    // Offline or instant fallback path
    if (!isOnline) {
      const offlinePassport = buildAdaptiveCompetencyPassportFallback({
        ownerUid: profile.uid,
        displayName: profile.displayName,
        ageStage: profile.ageStage,
        studioDomain,
        verificationRoute,
        responseText: combinedResponseText,
        evidenceSummary: combinedEvidenceSummary,
        languageFluency,
      });
      onSavePassport(offlinePassport);
      onUpdateProfileFocus(combinedResponseText.slice(0, 360), profile.ageStage);
      setIsEvaluating(false);
      return;
    }

    try {
      const res = await fetch('/api/verify/passport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationRoute,
          inputMode: verificationRoute === 'route-b-uqp' ? 'scenario' : 'summary',
          studioDomain,
          scenarioPrompt:
            verificationRoute === 'route-b-uqp'
              ? `${currentScenario.title}: ${currentScenario.question}`
              : '',
          responseText: combinedResponseText.trim(),
          ageStage: profile.ageStage,
          displayName: profile.displayName,
          evidenceSummary: combinedEvidenceSummary,
          languageFluency,
          institutionName,
          hostCountryTarget,
          clientVouch,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.passport) {
        throw new Error(data.error || 'Could not complete verification.');
      }

      const fallbackBase = buildAdaptiveCompetencyPassportFallback({
        ownerUid: profile.uid,
        displayName: profile.displayName,
        ageStage: profile.ageStage,
        studioDomain,
        verificationRoute,
        responseText: combinedResponseText,
        evidenceSummary: combinedEvidenceSummary,
        languageFluency,
        verifiableId: data.verifiableId || data.passport.verifiableId || 'VNA-2026-8412',
      });

      const createdPassport: CompetencyPassport = {
        ...fallbackBase,
        ...data.passport,
        id: makeSafeId('passport'),
        ownerUid: profile.uid,
        studioDomain,
        verificationRoute,
        inputMode: verificationRoute === 'route-b-uqp' ? 'scenario' : 'summary',
        verifiableId:
          data.verifiableId || data.passport.verifiableId || fallbackBase.verifiableId,
        nqfEquivalencyLevel:
          data.passport.nqfEquivalencyLevel || fallbackBase.nqfEquivalencyLevel,
        reconstructedCredential:
          data.passport.reconstructedCredential || fallbackBase.reconstructedCredential,
        languageProficiency:
          data.passport.languageProficiency || fallbackBase.languageProficiency,
        workplaceSkills:
          Array.isArray(data.passport.workplaceSkills) &&
          data.passport.workplaceSkills.length > 0
            ? data.passport.workplaceSkills
            : fallbackBase.workplaceSkills,
        microBridge: {
          ...fallbackBase.microBridge,
          ...(data.passport.microBridge ?? {}),
        },
        stipendEligible: passport?.stipendEligible ?? false,
        generatedAtIso: data.generatedAtIso || new Date().toISOString(),
      };

      onSavePassport(createdPassport);
      onUpdateProfileFocus(combinedResponseText.trim().slice(0, 360), profile.ageStage);
    } catch {
      // Seamless deterministic fallback so verification never blocks the practitioner
      const fallbackPassport = buildAdaptiveCompetencyPassportFallback({
        ownerUid: profile.uid,
        displayName: profile.displayName,
        ageStage: profile.ageStage,
        studioDomain,
        verificationRoute,
        responseText: combinedResponseText,
        evidenceSummary: combinedEvidenceSummary,
        languageFluency,
      });
      onSavePassport(fallbackPassport);
      onUpdateProfileFocus(combinedResponseText.trim().slice(0, 360), profile.ageStage);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = sanitizeText(title, 120);
    const cleanProof = sanitizeText(proofSummary, 360);
    if (!cleanTitle || !cleanProof) return;

    onAddCapability({
      title: cleanTitle,
      domain,
      proofSummary: cleanProof,
      portfolioRef: sanitizeText(portfolioRef, 160) || undefined,
    });

    setTitle('');
    setProofSummary('');
    setPortfolioRef('');
    setShowManualAdd(false);
  };

  const handleCreateEndorsement = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = sanitizeText(endorseName, 80);
    const cleanRole = sanitizeText(endorseRole, 80);
    const cleanOrg = sanitizeText(endorseOrg, 80);
    const cleanSkill = sanitizeText(endorseSkill, 120);
    const cleanQuote = sanitizeText(endorseDirectQuote, 260);
    if (!cleanName || !cleanSkill) return;

    onRequestEndorsement({
      collaboratorName: cleanName,
      collaboratorRole: cleanRole || 'Field Collaborator',
      organization: cleanOrg || 'Regional Partner Hub',
      capabilityTitle: cleanSkill,
      endorsementText: cleanQuote || undefined,
      sourceTab: 'verify',
    });

    setEndorseName('');
    setEndorseRole('');
    setEndorseOrg('');
    setEndorseDirectQuote('');
    setShowEndorseForm(false);
  };

  const handleCopyShareLink = async (item: PeerEndorsement) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?endorse=${encodeURIComponent(
      item.shareToken
    )}&skill=${encodeURIComponent(item.capabilityTitle)}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedEndorseId(item.id);
      window.setTimeout(() => setCopiedEndorseId(null), 2400);
    } catch {
      setCopiedEndorseId(item.id);
      window.setTimeout(() => setCopiedEndorseId(null), 2400);
    }
  };

  const verifiedEndorsementsCount = endorsements.filter(
    (e) => e.status === 'verified'
  ).length;

  return (
    <div className="space-y-8">
      {/* Editorial Section Header */}
      <section className="relative overflow-hidden bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] rounded-2xl p-6 sm:p-8 shadow-sm">
        <WovenBridgeArcsMotif />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-widest font-semibold text-[#146C53] dark:text-[#2EB88B]">
                TAB 1 · CREDENTIAL & SKILLS VERIFICATION ENGINE
              </span>
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#5EEAD4]">
                UNESCO UQP · WES Gateway / ENIC-NARIC · ILO / KNQA RPL
              </span>
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#F9E9DF] dark:bg-[#2E1D15] text-[#C4622D] dark:text-[#F59E6C]">
                {AGE_STAGE_PATHWAYS[profile.ageStage].shortLabel}
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#17191C] dark:text-[#F4F2EE] mt-1">
              {t.verifyHeading}
            </h1>
            <p className="text-sm text-[#5A6068] dark:text-[#A3A9B3] mt-1 max-w-2xl">
              {t.verifyLead}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start">
            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              data-testid="export-verified-passport-btn"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#146C53] hover:bg-[#0F5440] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share / Export Passport
            </button>
            <button
              type="button"
              onClick={() => setShowManualAdd((prev) => !prev)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] text-xs font-medium text-[#17191C] dark:text-[#F4F2EE] hover:border-[#146C53] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B]" />
              {showManualAdd ? 'Hide Manual Skill Form' : 'Quick-Add Individual Skill'}
            </button>
          </div>
        </div>

        {/* Step 1 — Adaptive Verification Router ("What proof do you have with you today?") */}
        <div className="relative z-10 mt-6 pt-6 border-t border-[#E8E3DB] dark:border-[#2C3037]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#146C53] dark:text-[#2EB88B]">
                Step 1 · Adaptive Verification Router
              </span>
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                What proof do you have with you today?
              </h2>
            </div>
            <span className="text-xs text-[#5A6068] dark:text-[#A3A9B3]">
              Pre-highlighted for your <strong>{profile.ageStage}</strong> career stage · Switch anytime
            </span>
          </div>

          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-3.5"
            data-testid="adaptive-verification-router"
          >
            {ADAPTIVE_VERIFICATION_ROUTES.map((route) => {
              const isSelected = verificationRoute === route.id;
              const isRecommended = recommendedRoute === route.id;
              const RouteIcon =
                route.id === 'route-a-foreign'
                  ? GraduationCap
                  : route.id === 'route-b-uqp'
                    ? Compass
                    : Hammer;

              return (
                <button
                  key={route.id}
                  type="button"
                  onClick={() => {
                    setVerificationRoute(route.id);
                    setAiError(null);
                  }}
                  data-testid={`verify-${route.id}`}
                  aria-pressed={isSelected}
                  className={`text-left rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#146C53] dark:border-[#2EB88B] bg-[#E7F3EE]/65 dark:bg-[#142B24]/80 shadow-xs ring-1 ring-[#146C53]/30'
                      : 'border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5]/90 dark:bg-[#121315]/90 hover:border-[#146C53]/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#146C53] dark:text-[#2EB88B]">
                        <RouteIcon className="w-3.5 h-3.5" />
                        {route.shortTag} · {route.frameworkBadge}
                      </span>
                      {isRecommended && (
                        <span
                          data-testid={`recommended-badge-${route.id}`}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F9E9DF] dark:bg-[#2E1D15] text-[#C4622D] dark:text-[#F59E6C] shrink-0"
                        >
                          Recommended ({profile.ageStage})
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif text-base font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                      {route.title}
                    </h3>
                    <p className="text-xs text-[#5A6068] dark:text-[#A3A9B3] mt-1.5 leading-relaxed">
                      {route.subtitle}
                    </p>
                  </div>

                  <div className="mt-3.5 pt-2.5 border-t border-[#E8E3DB]/80 dark:border-[#2C3037]/80 flex items-center justify-between text-[11px] font-semibold">
                    <span
                      className={
                        isSelected
                          ? 'text-[#146C53] dark:text-[#5EEAD4]'
                          : 'text-[#5A6068] dark:text-[#A3A9B3]'
                      }
                    >
                      {isSelected ? 'Active Verification Track' : 'Select This Route →'}
                    </span>
                    <span className="text-[10px] text-[#5A6068] dark:text-[#A3A9B3]">
                      Ages {route.bestForAges.join(' / ')}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Progressive Workspace Grid: Active Route Form (Left) + Step 2 & Step 3 Living Competency Passport & Bridging Card (Right) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Progressive Form for Selected Route Only ("Less is More") */}
        <form
          onSubmit={handleVerifyWithAi}
          className="lg:col-span-6 relative overflow-hidden bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] rounded-2xl p-6 space-y-5 shadow-sm"
        >
          <WovenBridgeArcsMotif />

          <div className="relative z-10 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C4622D]" />
              <h2 className="font-serif text-lg font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                {verificationRoute === 'route-a-foreign'
                  ? 'Route A · Foreign Qualification or Partial Copy'
                  : verificationRoute === 'route-b-uqp'
                    ? 'Route B · UNESCO UQP Structured Reconstruction'
                    : 'Route C · ILO & KNQA RPL Portfolio of Evidence'}
              </h2>
            </div>
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#5EEAD4]">
              {verificationRoute === 'route-a-foreign'
                ? 'WES Gateway / ENIC-NARIC'
                : verificationRoute === 'route-b-uqp'
                  ? 'UNESCO UQP Standard'
                  : 'ILO / KNQA RPL Standard'}
            </span>
          </div>

          {/* Domain Pill Selector */}
          <div className="relative z-10">
            <label className="block text-xs font-medium text-[#5A6068] dark:text-[#A3A9B3] mb-2">
              {t.capabilityDomainLabel}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STUDIO_DOMAINS.map((dom) => {
                const active = studioDomain === dom;
                return (
                  <button
                    key={dom}
                    type="button"
                    onClick={() => setStudioDomain(dom)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                      active
                        ? 'border-[#146C53] bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#5EEAD4]'
                        : 'border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] text-[#5A6068] dark:text-[#A3A9B3] hover:text-[#17191C]'
                    }`}
                  >
                    {dom}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ROUTE A FORM: Foreign Qualification or Partial Copy */}
          {verificationRoute === 'route-a-foreign' && (
            <div className="relative z-10 space-y-4" data-testid="route-a-form">
              <div className="rounded-xl border border-[#146C53]/25 bg-[#E7F3EE]/40 dark:bg-[#142B24]/40 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="text-xs text-[#17191C] dark:text-[#F4F2EE]">
                  <strong className="text-[#146C53] dark:text-[#5EEAD4]">
                    WES Gateway & ENIC-NARIC Track:
                  </strong>{' '}
                  Reconstructs original program level, maps host-country NQF equivalency, and flags exact local licensing steps.
                </div>
                <button
                  type="button"
                  onClick={handleApplyRouteASample}
                  data-testid="try-sample-route-a-btn"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#146C53] hover:bg-[#0F5440] text-white text-[11px] font-semibold shrink-0 cursor-pointer transition-colors"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  Try Sample: Foreign Civil Engineering Transcript
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#5A6068] dark:text-[#A3A9B3] mb-1">
                    Original Institution / Issuing Body
                  </label>
                  <input
                    type="text"
                    value={routeAInstitution}
                    onChange={(e) => setRouteAInstitution(e.target.value)}
                    placeholder="e.g., University of Khartoum — Faculty of Engineering"
                    className="w-full rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] px-3 py-2 text-xs text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus:border-[#146C53]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#5A6068] dark:text-[#A3A9B3] mb-1">
                    Target Host-Country Recognition
                  </label>
                  <input
                    type="text"
                    value={routeAHostCountry}
                    onChange={(e) => setRouteAHostCountry(e.target.value)}
                    placeholder="e.g., Kenya (KNQA / EBK) or Jordan"
                    className="w-full rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] px-3 py-2 text-xs text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus:border-[#146C53]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5A6068] dark:text-[#A3A9B3] mb-1">
                  Qualification, Partial Transcript, or License Held
                </label>
                <input
                  type="text"
                  value={routeACredential}
                  onChange={(e) => setRouteACredential(e.target.value)}
                  placeholder="e.g., B.Sc. Civil Engineering (Semesters 1–7 Copy) or Wireman License"
                  className="w-full rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] px-3 py-2 text-xs text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus:border-[#146C53]"
                />
              </div>

              {/* Photo / Scan Upload of Foreign Degree or Partial Transcript */}
              <div className="rounded-xl border border-dashed border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B] shrink-0" />
                  <div className="truncate">
                    <p className="text-xs font-medium text-[#17191C] dark:text-[#F4F2EE] truncate">
                      {routeADocumentLabel}
                    </p>
                    <p className="text-[11px] text-[#5A6068] dark:text-[#A3A9B3]">
                      Partial transcript photo, student ID, or professional license copy (zero raw PII stored)
                    </p>
                  </div>
                </div>
                <input
                  ref={routeAFileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleRouteAFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => routeAFileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] text-xs font-medium text-[#17191C] dark:text-[#F4F2EE] hover:border-[#146C53] shrink-0 cursor-pointer"
                >
                  Upload Photo / Copy
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label className="block text-xs font-medium text-[#5A6068] dark:text-[#A3A9B3]">
                    Coursework & Practical Engineering / Technical Summary
                  </label>
                  <button
                    type="button"
                    onClick={() => handleToggleVoiceNote('route-a')}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      isListening && voiceTargetField === 'route-a'
                        ? 'border-[#C4622D] bg-[#F9E9DF] text-[#C4622D] animate-pulse'
                        : 'border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] text-[#17191C] dark:text-[#F4F2EE] hover:border-[#146C53]'
                    }`}
                  >
                    {isListening && voiceTargetField === 'route-a' ? (
                      <>
                        <MicOff className="w-3.5 h-3.5" />
                        {t.voiceStopLabel}
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B]" />
                        {t.voiceStartLabel}
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={routeAResponseText}
                  onChange={(e) => setRouteAResponseText(e.target.value)}
                  placeholder="Describe your completed modules, technical thesis, and real-world projects supervised..."
                  className="w-full rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] px-3.5 py-2.5 text-sm text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus:border-[#146C53]"
                />
              </div>
            </div>
          )}

          {/* ROUTE B FORM: Missing or Lost Paperwork (UNESCO UQP 3-Part Guided Flow) */}
          {verificationRoute === 'route-b-uqp' && (
            <div className="relative z-10 space-y-4" data-testid="route-b-form">
              <div className="rounded-xl border border-[#146C53]/25 bg-[#E7F3EE]/40 dark:bg-[#142B24]/40 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="text-xs text-[#17191C] dark:text-[#F4F2EE]">
                  <strong className="text-[#146C53] dark:text-[#5EEAD4]">
                    UNESCO UQP Structured Track:
                  </strong>{' '}
                  Concise 3-part guided reconstruction for practitioners whose formal paperwork was lost or left behind.
                </div>
                <button
                  type="button"
                  onClick={handleApplyRouteBSample}
                  data-testid="try-sample-route-b-btn"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#146C53] hover:bg-[#0F5440] text-white text-[11px] font-semibold shrink-0 cursor-pointer transition-colors"
                >
                  <Compass className="w-3.5 h-3.5" />
                  Load UQP Sample Dossier
                </button>
              </div>

              {/* 3-Part Guided Step Selector */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { step: 1 as const, label: '1. Background' },
                  { step: 2 as const, label: '2. Oral Defense' },
                  { step: 3 as const, label: '3. Context Notes' },
                ].map((item) => (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => setUqpStep(item.step)}
                    data-testid={`uqp-step-${item.step}-btn`}
                    className={`px-2.5 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                      uqpStep === item.step
                        ? 'border-[#146C53] bg-[#146C53] text-white'
                        : 'border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] text-[#5A6068] dark:text-[#A3A9B3]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {uqpStep === 1 && (
                <div className="space-y-3" data-testid="uqp-part-1">
                  <div>
                    <label className="block text-xs font-medium text-[#5A6068] dark:text-[#A3A9B3] mb-1">
                      Primary Technical or Professional Field
                    </label>
                    <input
                      type="text"
                      value={uqpField}
                      onChange={(e) => setUqpField(e.target.value)}
                      className="w-full rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] px-3 py-2 text-xs text-[#17191C] dark:text-[#F4F2EE]"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#5A6068] dark:text-[#A3A9B3] mb-1">
                        Years Practiced & Role Level
                      </label>
                      <input
                        type="text"
                        value={uqpYears}
                        onChange={(e) => setUqpYears(e.target.value)}
                        className="w-full rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] px-3 py-2 text-xs text-[#17191C] dark:text-[#F4F2EE]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#5A6068] dark:text-[#A3A9B3] mb-1">
                        Language Fluency
                      </label>
                      <input
                        type="text"
                        value={uqpLanguage}
                        onChange={(e) => setUqpLanguage(e.target.value)}
                        className="w-full rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] px-3 py-2 text-xs text-[#17191C] dark:text-[#F4F2EE]"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setUqpStep(2)}
                      className="text-xs font-semibold text-[#146C53] dark:text-[#5EEAD4] hover:underline cursor-pointer"
                    >
                      Continue to Part 2: Technical / Oral Defense →
                    </button>
                  </div>
                </div>
              )}

              {uqpStep === 2 && (
                <div className="space-y-3" data-testid="uqp-part-2">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <label className="block text-xs font-medium text-[#5A6068] dark:text-[#A3A9B3]">
                        Defense Prompt 1 · {currentScenario.title}
                      </label>
                      <button
                        type="button"
                        onClick={() => handleToggleVoiceNote('uqp-1')}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] text-[#17191C] dark:text-[#F4F2EE] cursor-pointer"
                      >
                        <Mic className="w-3 h-3 text-[#146C53]" />
                        Voice Defense 1
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={uqpDefense1}
                      onChange={(e) => setUqpDefense1(e.target.value)}
                      className="w-full rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] px-3 py-2 text-xs text-[#17191C] dark:text-[#F4F2EE]"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <label className="block text-xs font-medium text-[#5A6068] dark:text-[#A3A9B3]">
                        Defense Prompt 2 · Field Safety, Lockout-Tagout & QA Verification
                      </label>
                      <button
                        type="button"
                        onClick={() => handleToggleVoiceNote('uqp-2')}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] text-[#17191C] dark:text-[#F4F2EE] cursor-pointer"
                      >
                        <Mic className="w-3 h-3 text-[#146C53]" />
                        Voice Defense 2
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={uqpDefense2}
                      onChange={(e) => setUqpDefense2(e.target.value)}
                      className="w-full rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] px-3 py-2 text-xs text-[#17191C] dark:text-[#F4F2EE]"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setUqpStep(1)}
                      className="text-xs text-[#5A6068] hover:underline cursor-pointer"
                    >
                      ← Back to Part 1
                    </button>
                    <button
                      type="button"
                      onClick={() => setUqpStep(3)}
                      className="text-xs font-semibold text-[#146C53] dark:text-[#5EEAD4] hover:underline cursor-pointer"
                    >
                      Continue to Part 3: Alternative Context →
                    </button>
                  </div>
                </div>
              )}

              {uqpStep === 3 && (
                <div className="space-y-3" data-testid="uqp-part-3">
                  <div>
                    <label className="block text-xs font-medium text-[#5A6068] dark:text-[#A3A9B3] mb-1">
                      Alternative Context Notes (Projects Led, Apprentices Mentored, Community Impact)
                    </label>
                    <textarea
                      rows={3}
                      value={uqpContextNotes}
                      onChange={(e) => setUqpContextNotes(e.target.value)}
                      className="w-full rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] px-3 py-2 text-xs text-[#17191C] dark:text-[#F4F2EE]"
                    />
                  </div>
                  <div className="flex justify-start">
                    <button
                      type="button"
                      onClick={() => setUqpStep(2)}
                      className="text-xs text-[#5A6068] hover:underline cursor-pointer"
                    >
                      ← Back to Part 2: Oral Defense
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ROUTE C FORM: Hands-On / Informal Craft (ILO & KNQA RPL Portfolio Track) */}
          {verificationRoute === 'route-c-rpl' && (
            <div className="relative z-10 space-y-4" data-testid="route-c-form">
              <div className="rounded-xl border border-[#146C53]/25 bg-[#E7F3EE]/40 dark:bg-[#142B24]/40 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="text-xs text-[#17191C] dark:text-[#F4F2EE]">
                  <strong className="text-[#146C53] dark:text-[#5EEAD4]">
                    ILO & KNQA RPL Portfolio Track:
                  </strong>{' '}
                  Built for self-taught builders, tradespeople, and 15–17+ emerging talent. Share 1 work photo + a 30-second explanation.
                </div>
                <button
                  type="button"
                  onClick={handleApplyRouteCSample}
                  data-testid="try-sample-route-c-btn"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#146C53] hover:bg-[#0F5440] text-white text-[11px] font-semibold shrink-0 cursor-pointer transition-colors"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  Try Sample: 48V Solar Inverter Board
                </button>
              </div>

              {/* 1 Work Photo Preview + Upload */}
              <div className="rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] p-3 flex flex-col sm:flex-row items-center gap-3.5">
                <img
                  src={rplPhotoDataUrl}
                  alt={rplPhotoLabel}
                  className="w-28 h-20 object-cover rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] truncate">
                    {rplPhotoLabel}
                  </p>
                  <p className="text-[11px] text-[#5A6068] dark:text-[#A3A9B3] mt-0.5">
                    RPL Visual Proof of Craft · Evaluates tool discipline, safety, and assembly rigor
                  </p>
                  <input
                    ref={rplFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleRplPhotoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => rplFileInputRef.current?.click()}
                    className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] text-[11px] font-medium text-[#17191C] dark:text-[#F4F2EE] hover:border-[#146C53] cursor-pointer"
                  >
                    <ImagePlus className="w-3.5 h-3.5 text-[#146C53]" />
                    Upload Your Work Photo
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5A6068] dark:text-[#A3A9B3] mb-1">
                  What You Built, Repaired, or Delivered
                </label>
                <input
                  type="text"
                  value={rplCraftTitle}
                  onChange={(e) => setRplCraftTitle(e.target.value)}
                  className="w-full rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] px-3 py-2 text-xs text-[#17191C] dark:text-[#F4F2EE]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label className="block text-xs font-medium text-[#5A6068] dark:text-[#A3A9B3]">
                    30-Second "How I Built / Fixed This" Walkthrough
                  </label>
                  <button
                    type="button"
                    onClick={() => handleToggleVoiceNote('rpl')}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] text-[#17191C] dark:text-[#F4F2EE] hover:border-[#146C53] cursor-pointer"
                  >
                    <Mic className="w-3.5 h-3.5 text-[#146C53]" />
                    {t.voiceStartLabel}
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={rplWalkthrough}
                  onChange={(e) => setRplWalkthrough(e.target.value)}
                  className="w-full rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] px-3 py-2 text-xs text-[#17191C] dark:text-[#F4F2EE]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5A6068] dark:text-[#A3A9B3] mb-1">
                  Optional Past-Client or Master Mentor Vouch
                </label>
                <input
                  type="text"
                  value={rplVouch}
                  onChange={(e) => setRplVouch(e.target.value)}
                  placeholder="e.g., Workshop Lead or Client confirmation of quality..."
                  className="w-full rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] px-3 py-2 text-xs text-[#17191C] dark:text-[#F4F2EE]"
                />
              </div>
            </div>
          )}

          {voiceStatusNote && (
            <p className="relative z-10 text-xs text-[#146C53] dark:text-[#5EEAD4]">
              {voiceStatusNote}
            </p>
          )}

          {aiError && (
            <div
              role="alert"
              className="relative z-10 rounded-xl border border-[#B42318]/30 bg-[#FEF3F2] dark:bg-[#2C1517] px-3.5 py-2.5 text-xs text-[#B42318] dark:text-[#F97066]"
            >
              {aiError}
            </div>
          )}

          <button
            type="submit"
            disabled={isEvaluating}
            data-testid="verify-generate-passport-btn"
            className="relative z-10 w-full py-3 px-4 rounded-xl bg-[#146C53] hover:bg-[#0F5440] disabled:opacity-50 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            {isEvaluating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Evaluating Competency & Mapping NQF Equivalency...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Living Competency Passport
              </>
            )}
          </button>
        </form>

        {/* Right Column: Step 2 (Upgraded Living Competency Passport) + Step 3 (Bridging & Stipend Enablement Card) */}
        <div className="lg:col-span-6 space-y-5">
          {passport ? (
            <>
              {/* STEP 2: Upgraded Living Competency Passport Output */}
              <div
                data-testid="living-competency-passport-card"
                className="relative overflow-hidden bg-white dark:bg-[#1A1C20] border-2 border-[#146C53]/35 dark:border-[#2EB88B]/40 rounded-2xl p-6 shadow-sm space-y-5"
              >
                <WovenBridgeArcsMotif />

                {/* Top Passport Header & Verifiable ID */}
                <div className="relative z-10 flex flex-wrap items-start justify-between gap-3 border-b border-[#E8E3DB] dark:border-[#2C3037] pb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest font-semibold text-[#146C53] dark:text-[#2EB88B]">
                        <ShieldCheck className="w-4 h-4" />
                        Step 2 · Living Competency Passport
                      </span>
                      <span
                        data-testid="passport-verifiable-id"
                        className="font-mono text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] text-[#17191C] dark:text-[#F4F2EE]"
                      >
                        ID: {passport.verifiableId ?? 'VNA-2026-8412'}
                      </span>
                    </div>
                    <h3 className="font-serif text-xl font-semibold text-[#17191C] dark:text-[#F4F2EE] mt-1">
                      {profile.displayName}
                    </h3>
                    <p className="text-xs font-medium text-[#C4622D] dark:text-[#F59E6C] mt-0.5">
                      {passport.ageStageTrack} · {passport.studioDomain}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowExportModal(true)}
                    data-testid="passport-card-share-btn"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#5EEAD4] hover:bg-[#146C53] hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share / Export Passport
                  </button>
                </div>

                {/* NQF / RPL Equivalency Level & Reconstructed Credential Map */}
                <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl bg-[#E7F3EE]/60 dark:bg-[#142B24]/60 border border-[#146C53]/25 p-3.5">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-[#146C53] dark:text-[#5EEAD4]">
                      NQF / RPL Equivalency Level
                    </span>
                    <p
                      data-testid="passport-nqf-equivalency"
                      className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] mt-1"
                    >
                      {passport.nqfEquivalencyLevel ??
                        'NQF Level 6 / KNQA Bachelor Equivalency (UNESCO UQP / RPL Aligned)'}
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-3.5">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-[#5A6068] dark:text-[#A3A9B3]">
                      Verified Field Match & Origin Summary
                    </span>
                    <p className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] mt-1">
                      {passport.fieldMatch}
                    </p>
                    {passport.reconstructedCredential && (
                      <p className="text-[11px] text-[#5A6068] dark:text-[#A3A9B3] mt-0.5 line-clamp-2">
                        {passport.reconstructedCredential}
                      </p>
                    )}
                  </div>
                </div>

                <p className="relative z-10 text-xs text-[#5A6068] dark:text-[#A3A9B3] leading-relaxed">
                  {passport.executiveSummary}
                </p>

                {/* Transparent 4-Tier Trust Indicator */}
                <div
                  data-testid="passport-trust-ladder"
                  className="relative z-10 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] p-3.5 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                      Transparent 4-Tier Verification Trust Ladder
                    </span>
                    <span className="text-[11px] font-semibold text-[#146C53] dark:text-[#5EEAD4]">
                      Current Stage: Tier {trustLadder.activeTier} of 4
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    {trustLadder.tiers.map((item) => (
                      <div
                        key={item.tier}
                        data-testid={`trust-tier-${item.tier}`}
                        className={`rounded-lg p-2.5 border text-left transition-all ${
                          item.isCurrent
                            ? 'border-[#146C53] dark:border-[#2EB88B] bg-[#E7F3EE] dark:bg-[#142B24] ring-1 ring-[#146C53]/30'
                            : item.reached
                              ? 'border-[#146C53]/35 bg-[#E7F3EE]/40 dark:bg-[#142B24]/40'
                              : 'border-[#E8E3DB] dark:border-[#2C3037] bg-white/70 dark:bg-[#1A1C20]/70 opacity-75'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`text-[11px] font-semibold ${
                              item.reached
                                ? 'text-[#146C53] dark:text-[#5EEAD4]'
                                : 'text-[#5A6068] dark:text-[#A3A9B3]'
                            }`}
                          >
                            {item.label}
                          </span>
                          {item.reached && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#146C53] dark:text-[#5EEAD4] shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-[#5A6068] dark:text-[#A3A9B3] mt-1 leading-snug">
                          {item.shortDesc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Verified Core Technical Skills + Workplace & Language Map */}
                <div className="relative z-10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#5A6068] dark:text-[#A3A9B3]">
                      Verified Competency Map ({passport.verifiedSkills.length})
                    </span>
                    <button
                      type="button"
                      disabled={skillsImported}
                      onClick={() => {
                        onImportPassportSkills(passport);
                        setSkillsImported(true);
                      }}
                      className="text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] hover:underline disabled:opacity-50 cursor-pointer"
                    >
                      {skillsImported ? '✓ Synced to Evidence Ledger' : '+ Sync Skills to Ledger'}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {passport.verifiedSkills.map((skill, idx) => (
                      <div
                        key={`${skill.name}-${idx}`}
                        className="rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                            {skill.name}
                          </span>
                          <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#5EEAD4]">
                            {skill.confidenceLabel} · {skill.confidenceScore}%
                          </span>
                        </div>
                        <p className="text-xs text-[#5A6068] dark:text-[#A3A9B3] mt-1">
                          {skill.evidenceNote}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Workplace Skills & Language Fluency Chips */}
                  <div className="pt-2 flex flex-wrap items-center gap-1.5">
                    {(
                      passport.workplaceSkills ?? [
                        'Safety & Lockout-Tagout Compliance',
                        'Cross-Age Pod Documentation',
                        'Scoped Milestone Delivery',
                      ]
                    ).map((ws) => (
                      <span
                        key={ws}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] text-[#17191C] dark:text-[#F4F2EE]"
                      >
                        ✓ {ws}
                      </span>
                    ))}
                    <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[#E7F3EE]/70 dark:bg-[#142B24] text-[#146C53] dark:text-[#5EEAD4]">
                      Languages:{' '}
                      {passport.languageProficiency ??
                        'Professional Working Fluency (English / Regional)'}
                    </span>
                  </div>
                </div>

                {/* Subtle, Honest UNESCO-Aligned Transparency Note */}
                <div
                  data-testid="unesco-transparency-note"
                  className="relative z-10 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5]/90 dark:bg-[#121315]/90 px-3.5 py-2.5 text-[11px] text-[#5A6068] dark:text-[#A3A9B3] leading-relaxed"
                >
                  <strong className="text-[#17191C] dark:text-[#F4F2EE]">
                    UNESCO UQP & ILO RPL Transparency Note:
                  </strong>{' '}
                  This Living Competency Passport is a verified skills bridge toward direct sprint employment and formal national accreditation. It accelerates employer trust and RPL portfolio assessment while respecting statutory national licensing boards where required.
                </div>
              </div>

              {/* STEP 3: Recognized Bridging, Re-Certification & Stipend Enablement Card */}
              <div
                data-testid="bridging-stipend-card"
                className="rounded-2xl border-2 border-[#C4622D]/35 bg-[#F9E9DF]/40 dark:bg-[#2E1D15]/40 p-5 sm:p-6 space-y-4 shadow-xs"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#C4622D] dark:text-[#F59E6C]">
                      <Compass className="w-3.5 h-3.5" />
                      Step 3 · Recognized Bridging, Re-Certification & Stipend Enablement
                    </span>
                    <h3 className="font-serif text-base sm:text-lg font-semibold text-[#17191C] dark:text-[#F4F2EE] mt-1">
                      Exact Gap Identified to Reach Full Formal Certification
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-white dark:bg-[#1A1C20] border border-[#C4622D]/30 text-[#C4622D] dark:text-[#F59E6C]">
                    Est. Assessment Cost: ${passport.microBridge.estimatedCostUsd ?? 65} USD
                  </span>
                </div>

                {/* 1-2 Recognized Bridging Modules / RPL Assessments */}
                <div className="space-y-2">
                  <div className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                        1. {passport.microBridge.title}
                      </span>
                      <span className="text-[11px] font-medium text-[#146C53] dark:text-[#5EEAD4] shrink-0">
                        {passport.microBridge.estimatedDuration}
                      </span>
                    </div>
                    <p className="text-xs text-[#5A6068] dark:text-[#A3A9B3] mt-1">
                      {passport.microBridge.action}
                    </p>
                  </div>

                  {passport.microBridge.secondaryModule && (
                    <div className="rounded-xl bg-white/80 dark:bg-[#1A1C20]/80 border border-[#E8E3DB] dark:border-[#2C3037] px-3.5 py-2.5 flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-[#17191C] dark:text-[#F4F2EE]">
                        2. {passport.microBridge.secondaryModule}
                      </span>
                      <span className="text-[11px] text-[#5A6068] dark:text-[#A3A9B3] shrink-0">
                        {passport.microBridge.partnerProgram}
                      </span>
                    </div>
                  )}
                </div>

                {/* Practical Enablement: Interactive Partner Fee-Waiver / Exam Stipend Trigger */}
                <div className="pt-2 border-t border-[#C4622D]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-[#5A6068] dark:text-[#A3A9B3]">
                    <strong className="text-[#17191C] dark:text-[#F4F2EE]">
                      Partner Coverage:
                    </strong>{' '}
                    {passport.microBridge.feeCoverageNote ??
                      'Covers RPL assessment fees, bridging exam registration, and mobile data/tools bundle.'}
                  </div>

                  {passport.stipendEligible ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        data-testid="stipend-preapproved-badge"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#146C53] text-white text-xs font-semibold shadow-xs"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Stipend Pre-Approved via Partner Pool
                      </span>
                      <button
                        type="button"
                        onClick={() => onTogglePassportStipend(false)}
                        className="text-[11px] text-[#5A6068] dark:text-[#A3A9B3] underline cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onTogglePassportStipend(true)}
                      data-testid="request-stipend-toggle-btn"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#C4622D] hover:bg-[#A85122] text-white text-xs font-semibold transition-colors cursor-pointer shrink-0 shadow-xs"
                    >
                      Request Partner Fee-Waiver / Exam Stipend →
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-[#1A1C20] border border-dashed border-[#E8E3DB] dark:border-[#2C3037] rounded-2xl p-8 text-center space-y-3 flex flex-col items-center justify-center min-h-[360px]">
              <div className="w-12 h-12 rounded-2xl bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#5EEAD4] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                Your Living Competency Passport Awaits
              </h3>
              <p className="text-xs text-[#5A6068] dark:text-[#A3A9B3] max-w-md leading-relaxed">
                Select Route A (Foreign Qualification), Route B (Missing Paperwork UQP), or Route C (Hands-On Craft RPL) on the left and tap{' '}
                <strong>Generate Living Competency Passport</strong> to generate your server-signed passport, NQF equivalency level, and partner fee-waiver bridge.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Optional Quick-Add Individual Skill Drawer */}
      {showManualAdd && (
        <form
          onSubmit={handleManualSubmit}
          className="bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-base font-semibold text-[#17191C] dark:text-[#F4F2EE]">
              {t.addCapabilityHeading}
            </h3>
            <button
              type="button"
              onClick={() => setShowManualAdd(false)}
              className="text-xs text-[#5A6068] hover:underline"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#5A6068] dark:text-[#A3A9B3] mb-1">
                {t.capabilityTitleLabel} *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t.capabilityTitlePlaceholder}
                className="w-full rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] px-3.5 py-2 text-sm text-[#17191C] dark:text-[#F4F2EE]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5A6068] dark:text-[#A3A9B3] mb-1">
                {t.capabilityDomainLabel}
              </label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] px-3.5 py-2 text-sm text-[#17191C] dark:text-[#F4F2EE]"
              >
                {PRACTICE_DOMAINS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#5A6068] dark:text-[#A3A9B3] mb-1">
                {t.capabilityProofLabel} *
              </label>
              <input
                type="text"
                required
                value={proofSummary}
                onChange={(e) => setProofSummary(e.target.value)}
                placeholder={t.capabilityProofPlaceholder}
                className="w-full rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] px-3.5 py-2 text-sm text-[#17191C] dark:text-[#F4F2EE]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5A6068] dark:text-[#A3A9B3] mb-1">
                Supporting Reference (Optional)
              </label>
              <input
                type="text"
                value={portfolioRef}
                onChange={(e) => setPortfolioRef(e.target.value)}
                placeholder="Optional project log or reference..."
                className="w-full rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] px-3.5 py-2 text-sm text-[#17191C] dark:text-[#F4F2EE]"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#146C53] hover:bg-[#0F5440] text-white text-xs font-semibold cursor-pointer"
          >
            {t.addCapabilityCta}
          </button>
        </form>
      )}

      {/* Confirmed Evidence Ledger + Peer Endorsements */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Evidence Ledger (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-semibold text-[#17191C] dark:text-[#F4F2EE]">
              Confirmed Evidence Ledger ({capabilities.length})
            </h2>
            <span className="text-xs text-[#5A6068] dark:text-[#A3A9B3]">
              Feeds Tab 2 [Unlock] & Tab 3 [Solve] matching
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {capabilities.map((cap) => {
              const isMaster = cap.verificationStatus === 'master-endorsed';
              const isVerified = cap.verificationStatus === 'field-verified';

              return (
                <div
                  key={cap.id}
                  className="bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] rounded-2xl p-4 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] text-[#5A6068] dark:text-[#A3A9B3]">
                        {cap.domain}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                          isMaster
                            ? 'bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#5EEAD4]'
                            : isVerified
                              ? 'bg-[#F9E9DF] dark:bg-[#2E1D15] text-[#C4622D] dark:text-[#F59E6C]'
                              : 'bg-[#FAF8F5] dark:bg-[#121315] text-[#5A6068] dark:text-[#A3A9B3]'
                        }`}
                      >
                        {isMaster ? (
                          <Award className="w-3 h-3" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        {isMaster
                          ? t.statusMasterEndorsed
                          : isVerified
                            ? t.statusFieldVerified
                            : t.statusPending}
                      </span>
                    </div>

                    <h3 className="font-serif text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                      {cap.title}
                    </h3>
                    <p className="text-xs text-[#5A6068] dark:text-[#A3A9B3] mt-1 line-clamp-2">
                      {cap.proofSummary}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-[#E8E3DB] dark:border-[#2C3037] flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] text-[#5A6068] dark:text-[#A3A9B3]">
                      {cap.confidenceScore}% Confidence
                    </span>
                    <div className="flex items-center gap-1.5">
                      {!isMaster && (
                        <button
                          type="button"
                          onClick={() => onPromoteCapability(cap.id)}
                          className="px-2.5 py-1 rounded-lg bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#5EEAD4] text-[11px] font-semibold hover:opacity-90 cursor-pointer"
                        >
                          {cap.verificationStatus === 'pending'
                            ? t.verifyStepCta
                            : t.endorseStepCta}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDeleteCapability(cap.id)}
                        aria-label={`Delete ${cap.title}`}
                        className="p-1 rounded-lg text-[#5A6068] hover:text-[#B42318] transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Peer Endorsements Card (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] rounded-2xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#146C53] dark:text-[#2EB88B]">
                Social Proof · {verifiedEndorsementsCount} Confirmed
              </span>
              <h2 className="font-serif text-lg font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                Peer & Master Endorsements
              </h2>
              <p className="text-xs text-[#5A6068] dark:text-[#A3A9B3] mt-0.5">
                Co-sign practical skills with past collaborators, clients, or 46+ Master Practitioners.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowEndorseForm((prev) => !prev)}
              className="px-3 py-1.5 rounded-xl bg-[#146C53] hover:bg-[#0F5440] text-white text-xs font-semibold shrink-0 cursor-pointer"
            >
              {showEndorseForm ? 'Close' : '+ Request'}
            </button>
          </div>

          {showEndorseForm && (
            <form
              onSubmit={handleCreateEndorsement}
              className="rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] p-3.5 space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  required
                  value={endorseName}
                  onChange={(e) => setEndorseName(e.target.value)}
                  placeholder="Collaborator Name *"
                  className="w-full rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] px-3 py-1.5 text-xs text-[#17191C] dark:text-[#F4F2EE]"
                />
                <input
                  type="text"
                  value={endorseRole}
                  onChange={(e) => setEndorseRole(e.target.value)}
                  placeholder="Role (e.g., Lead Engineer)"
                  className="w-full rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] px-3 py-1.5 text-xs text-[#17191C] dark:text-[#F4F2EE]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={endorseOrg}
                  onChange={(e) => setEndorseOrg(e.target.value)}
                  placeholder="Organization / Workshop"
                  className="w-full rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] px-3 py-1.5 text-xs text-[#17191C] dark:text-[#F4F2EE]"
                />
                <input
                  type="text"
                  required
                  value={endorseSkill}
                  onChange={(e) => setEndorseSkill(e.target.value)}
                  placeholder="Skill to Endorse *"
                  className="w-full rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] px-3 py-1.5 text-xs text-[#17191C] dark:text-[#F4F2EE]"
                />
              </div>
              <textarea
                rows={2}
                value={endorseDirectQuote}
                onChange={(e) => setEndorseDirectQuote(e.target.value)}
                placeholder="Optional: Paste their endorsement quote directly (or leave blank to generate a shareable link)"
                className="w-full rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] px-3 py-1.5 text-xs text-[#17191C] dark:text-[#F4F2EE]"
              />
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-[#146C53] text-white text-xs font-semibold cursor-pointer"
              >
                {endorseDirectQuote.trim().length >= 10
                  ? 'Save Verified Endorsement'
                  : 'Create Shareable Endorsement Request'}
              </button>
            </form>
          )}

          <div className="space-y-2.5">
            {endorsements.map((item) => {
              const isVerified = item.status === 'verified';
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] p-3.5 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B]" />
                        <span className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                          {item.collaboratorName}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5A6068] dark:text-[#A3A9B3]">
                        {item.collaboratorRole} · {item.organization}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isVerified
                            ? 'bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#5EEAD4]'
                            : 'bg-[#F9E9DF] dark:bg-[#2E1D15] text-[#C4622D] dark:text-[#F59E6C]'
                        }`}
                      >
                        {isVerified ? 'Verified' : 'Awaiting Sign-Off'}
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteEndorsement(item.id)}
                        aria-label="Delete endorsement"
                        className="p-1 text-[#5A6068] hover:text-[#B42318] cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] font-medium text-[#146C53] dark:text-[#5EEAD4]">
                    Skill: {item.capabilityTitle}
                  </p>

                  {isVerified ? (
                    <p className="text-xs italic text-[#17191C] dark:text-[#F4F2EE] bg-white dark:bg-[#1A1C20] rounded-lg p-2.5 border border-[#E8E3DB] dark:border-[#2C3037]">
                      “{item.endorsementText}”
                    </p>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyShareLink(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] text-[11px] font-medium text-[#17191C] dark:text-[#F4F2EE] cursor-pointer"
                        >
                          {copiedEndorseId === item.id ? (
                            <>
                              <Check className="w-3 h-3 text-[#146C53]" />
                              Link Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copy Endorsement Link
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveReplyId(activeReplyId === item.id ? null : item.id);
                            setReplyText(
                              `Confirmed: ${profile.displayName} demonstrated reliable field execution and rigorous safety standards on ${item.capabilityTitle}.`
                            );
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#5EEAD4] text-[11px] font-semibold cursor-pointer"
                        >
                          Complete Inline
                        </button>
                      </div>

                      {activeReplyId === item.id && (
                        <div className="space-y-2 pt-1">
                          <textarea
                            rows={2}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="w-full rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] px-2.5 py-1.5 text-xs text-[#17191C] dark:text-[#F4F2EE]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (replyText.trim().length >= 6) {
                                onCompleteEndorsement(item.id, replyText);
                                setActiveReplyId(null);
                              }
                            }}
                            className="px-3 py-1 rounded-lg bg-[#146C53] text-white text-xs font-semibold cursor-pointer"
                          >
                            Confirm & Sign Endorsement
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Compact Verified Milestone Strip */}
      <section className="bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] rounded-2xl p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#5A6068] dark:text-[#A3A9B3]">
            Verified Achievement Milestones
          </span>
          <span className="text-xs font-mono text-[#146C53] dark:text-[#5EEAD4]">
            {milestoneBadges.filter((b) => b.unlocked).length}/{milestoneBadges.length} Unlocked
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {milestoneBadges.map((badge) => (
            <div
              key={badge.id}
              className={`rounded-xl px-3 py-2.5 border text-xs flex items-center gap-2 ${
                badge.unlocked
                  ? 'border-[#146C53]/30 bg-[#E7F3EE]/50 dark:bg-[#142B24]/50 text-[#17191C] dark:text-[#F4F2EE]'
                  : 'border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] text-[#5A6068] dark:text-[#A3A9B3] opacity-75'
              }`}
            >
              <CheckCircle2
                className={`w-3.5 h-3.5 shrink-0 ${
                  badge.unlocked
                    ? 'text-[#146C53] dark:text-[#5EEAD4]'
                    : 'text-[#5A6068]'
                }`}
              />
              <span className="font-medium truncate">{badge.title}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Export / Share Verified Passport Modal */}
      {showExportModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Share or Export Verified Living Competency Passport"
          data-testid="share-passport-modal"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-start sm:items-center justify-center p-4 sm:p-6 pt-16 sm:pt-20 overflow-y-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] rounded-2xl max-w-lg sm:max-w-xl md:max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden my-4 sm:my-auto"
          >
            <div className="px-6 py-4 border-b border-[#E8E3DB] dark:border-[#2C3037] flex items-start justify-between gap-3 shrink-0">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-[#146C53] dark:text-[#2EB88B]">
                  <QrCode className="w-3.5 h-3.5" />
                  Portable Read-Only Credential
                </span>
                <h3 className="font-serif text-xl font-semibold text-[#17191C] dark:text-[#F4F2EE] mt-0.5">
                  Share / Export Verified Passport
                </h3>
                <p className="text-xs text-[#5A6068] dark:text-[#A3A9B3] mt-1">
                  Anyone with this link can view a tamper-evident, read-only snapshot of your verified skills and peer endorsements—no sign-in required.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="p-1.5 rounded-lg text-[#5A6068] hover:text-[#17191C] dark:hover:text-white cursor-pointer shrink-0"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1 no-scrollbar">
              {/* Credential Summary Preview Box */}
              <div className="rounded-xl border border-[#146C53]/30 bg-[#E7F3EE]/50 dark:bg-[#142B24]/50 p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-serif text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                    {sharedPassportPayload.practitionerName}
                  </span>
                  <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-[#1A1C20] text-[#146C53] dark:text-[#5EEAD4] border border-[#146C53]/25">
                    {passport?.verifiableId ?? sharedPassportPayload.readOnlySignature}
                  </span>
                </div>
                <p className="text-xs font-medium text-[#C4622D] dark:text-[#F59E6C]">
                  {sharedPassportPayload.ageStageTrack} · {sharedPassportPayload.fieldMatch}
                </p>
                <p className="text-xs text-[#5A6068] dark:text-[#A3A9B3] line-clamp-2">
                  {sharedPassportPayload.executiveSummary}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-[#146C53] dark:text-[#5EEAD4] font-medium">
                  <span>✓ {sharedPassportPayload.verifiedSkills.length} Core Skills</span>
                  <span>·</span>
                  <span>✓ {sharedPassportPayload.verifiedEndorsements.length} Peer Quotes</span>
                  <span>·</span>
                  <span>✓ {sharedPassportPayload.studioDomain}</span>
                </div>
              </div>

              {/* Shareable URL Input + Copy Button */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-[#5A6068] dark:text-[#A3A9B3]">
                  Public Read-Only Verification Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={sharedPassportUrl}
                    data-testid="shared-passport-url-input"
                    className="w-full rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] px-3 py-2 text-xs font-mono text-[#17191C] dark:text-[#F4F2EE]"
                  />
                  <button
                    type="button"
                    onClick={handleCopySharedPassportLink}
                    data-testid="copy-shared-passport-link-btn"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#146C53] hover:bg-[#0F5440] text-white text-xs font-semibold shrink-0 cursor-pointer"
                  >
                    {copiedPassportLink ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Link
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-[#E8E3DB] dark:border-[#2C3037] flex flex-wrap items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowExportModal(false);
                  onPreviewSharedPassport(sharedPassportPayload);
                }}
                data-testid="open-readonly-passport-preview-btn"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#146C53] text-[#146C53] dark:text-[#5EEAD4] text-xs font-semibold hover:bg-[#E7F3EE]/50 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                Preview Read-Only Employer Card
              </button>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] cursor-pointer"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
