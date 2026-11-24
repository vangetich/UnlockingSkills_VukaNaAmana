import React, { useEffect, useState } from 'react';
import {
  Award,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  FileCheck2,
  Loader2,
  Lock,
  Pencil,
  RotateCcw,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import type {
  AgeStage,
  CompetencyPassport,
  PeerEndorsement,
  PractitionerProfile,
  SharedPassportPayload,
  SkillCapability,
  StudioDomain,
} from '../types/kora';
import { getStageLabel, type TranslationDictionary } from '../utils/i18n';
import {
  PRACTICAL_SCENARIOS,
  PRACTICE_DOMAINS,
  STUDIO_DOMAINS,
  buildSharedPassportLink,
  buildSharedPassportPayload,
  makeSafeId,
} from '../utils/talentEngine';
import { VoiceInput, VoiceTextarea } from './VoiceField';
import { PassportPreviewModal } from './PassportPreviewModal';
import { PeerEndorsementPanel } from './PeerEndorsementPanel';

interface VerifyViewProps {
  profile: PractitionerProfile;
  capabilities: SkillCapability[];
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
  onImportPassportSkills: (passport: CompetencyPassport) => number;
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

const STAGES: AgeStage[] = ['15-17', '18-29', '30-45', '46+'];

export const VerifyView: React.FC<VerifyViewProps> = ({
  profile,
  capabilities,
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
  // Practitioner focus editor
  const [editingFocus, setEditingFocus] = useState(false);
  const [draftProblem, setDraftProblem] = useState(profile.problemStatement);
  const [draftStage, setDraftStage] = useState<AgeStage>(profile.ageStage);

  // Talent Studio 3-step state
  const [studioStep, setStudioStep] = useState<1 | 2 | 3>(passport ? 3 : 1);
  const [inputMode, setInputMode] = useState<'summary' | 'scenario'>('summary');
  const [studioDomain, setStudioDomain] = useState<StudioDomain>(
    passport?.studioDomain ?? 'Green Energy'
  );
  const [studioResponse, setStudioResponse] = useState(profile.problemStatement);
  const [showStudioEvidence, setShowStudioEvidence] = useState(false);
  const [studioPortfolio, setStudioPortfolio] = useState('');
  const [studioCert, setStudioCert] = useState('');
  const [studioEndorsement, setStudioEndorsement] = useState('');

  useEffect(() => {
    setDraftProblem(profile.problemStatement);
    setDraftStage(profile.ageStage);
    if (profile.problemStatement.trim()) {
      setStudioResponse((prev) => (prev.trim() ? prev : profile.problemStatement));
    }
  }, [profile.problemStatement, profile.ageStage]);

  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [importBanner, setImportBanner] = useState<string | null>(null);
  const [sharedLinkState, setSharedLinkState] = useState<{
    url: string;
    payload: SharedPassportPayload;
    copied: boolean;
  } | null>(null);

  const handleGenerateSharePassportLink = async () => {
    const payload = buildSharedPassportPayload({
      profile,
      passport,
      capabilities,
      endorsements,
    });
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'https://vukanaamana.app';
    const url = buildSharedPassportLink(origin, payload);
    let copied = false;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        copied = true;
      }
    } catch {
      copied = false;
    }
    setSharedLinkState({ url, payload, copied });
  };

  useEffect(() => {
    if (sharePassportSignal > 0) {
      void handleGenerateSharePassportLink();
    }
    // Trigger Share Passport when Cmd+K invokes Share Passport
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharePassportSignal]);

  useEffect(() => {
    if (voiceTriggerSignal > 0) {
      setStudioStep(1);
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent('vuka:trigger-voice-input'));
      }, 60);
    }
  }, [voiceTriggerSignal]);

  const handleCopySharedLink = async () => {
    if (!sharedLinkState) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(sharedLinkState.url);
      }
      setSharedLinkState((prev) => (prev ? { ...prev, copied: true } : null));
    } catch {
      setSharedLinkState((prev) => (prev ? { ...prev, copied: true } : null));
    }
  };

  // Manual capability ledger form
  const [capTitle, setCapTitle] = useState('');
  const [capDomain, setCapDomain] = useState<string>(PRACTICE_DOMAINS[0]);
  const [capProof, setCapProof] = useState('');
  const [capPortfolio, setCapPortfolio] = useState('');
  const [capCert, setCapCert] = useState('');
  const [capEndorsement, setCapEndorsement] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const stageMeta = getStageLabel(profile.ageStage, t);
  const activeScenario = PRACTICAL_SCENARIOS[studioDomain];

  const handleSaveFocus = (e: React.FormEvent) => {
    e.preventDefault();
    if (draftProblem.trim().length < 3) return;
    onUpdateProfileFocus(draftProblem.trim(), draftStage);
    setEditingFocus(false);
  };

  const handleRunVerification = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const cleaned = studioResponse.trim();
    if (cleaned.length < 12) {
      setVerifyError(
        'Please share at least a short paragraph describing your past work or practical scenario solution.'
      );
      return;
    }

    if (!isOnline) {
      setVerifyError(
        'You are currently offline. AI Passport verification requires an internet connection, while manual capability recording below works offline.'
      );
      return;
    }

    setVerifyError(null);
    setImportBanner(null);
    setStudioStep(2);
    setIsVerifying(true);

    const evidenceParts = [
      studioPortfolio.trim() ? `Portfolio: ${studioPortfolio.trim()}` : '',
      studioCert.trim() ? `Certification: ${studioCert.trim()}` : '',
      studioEndorsement.trim() ? `Peer Endorsement: ${studioEndorsement.trim()}` : '',
    ].filter(Boolean);

    try {
      const res = await fetch('/api/verify/passport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputMode,
          studioDomain,
          scenarioPrompt:
            inputMode === 'scenario'
              ? `${activeScenario.title}: ${activeScenario.context} ${activeScenario.question}`
              : undefined,
          responseText: cleaned,
          ageStage: profile.ageStage,
          displayName: profile.displayName,
          problemStatement: profile.problemStatement,
          evidenceSummary: evidenceParts.join(' | '),
          locale: profile.preferredLocale,
        }),
      });

      const data = (await res.json()) as {
        error?: string;
        passport?: {
          ageStageTrack: string;
          fieldMatch: string;
          executiveSummary: string;
          verifiedSkills: CompetencyPassport['verifiedSkills'];
          microBridge: CompetencyPassport['microBridge'];
        };
        studioDomain?: StudioDomain;
        inputMode?: 'summary' | 'scenario';
        generatedAtIso?: string;
      };

      if (!res.ok || !data.passport) {
        throw new Error(
          data.error || 'Unable to generate your Living Competency Passport right now.'
        );
      }

      const generatedPassport: CompetencyPassport = {
        id: makeSafeId('pass'),
        ownerUid: profile.uid,
        studioDomain: data.studioDomain ?? studioDomain,
        inputMode: data.inputMode ?? inputMode,
        ageStageTrack: data.passport.ageStageTrack,
        fieldMatch: data.passport.fieldMatch,
        executiveSummary: data.passport.executiveSummary,
        verifiedSkills: data.passport.verifiedSkills ?? [],
        microBridge: data.passport.microBridge,
        stipendEligible: false,
        generatedAtIso: data.generatedAtIso ?? new Date().toISOString(),
      };

      onSavePassport(generatedPassport);
      setStudioStep(3);
    } catch (err) {
      setVerifyError(
        err instanceof Error
          ? err.message
          : 'Verification engine encountered an error. Please retry.'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCommitPassportSkills = () => {
    if (!passport) return;
    const added = onImportPassportSkills(passport);
    setImportBanner(
      added > 0
        ? `Added ${added} verified ${added === 1 ? 'skill' : 'skills'} to your capability ledger.`
        : 'All skills from this passport are already recorded in your capability ledger.'
    );
  };

  const handleCreateCapability = (e: React.FormEvent) => {
    e.preventDefault();
    if (capTitle.trim().length < 2 || capProof.trim().length < 4) {
      setFormError(t.validationCapabilityRequired);
      return;
    }
    setFormError(null);
    onAddCapability({
      title: capTitle.trim(),
      domain: capDomain,
      proofSummary: capProof.trim(),
      portfolioRef: capPortfolio.trim() || undefined,
      certificationRef: capCert.trim() || undefined,
      peerEndorsement: capEndorsement.trim() || undefined,
    });
    setCapTitle('');
    setCapProof('');
    setCapPortfolio('');
    setCapCert('');
    setCapEndorsement('');
  };

  const renderStatusText = (status: SkillCapability['verificationStatus']) => {
    if (status === 'master-endorsed') return t.statusMasterEndorsed;
    if (status === 'field-verified') return t.statusFieldVerified;
    return t.statusPending;
  };

  return (
    <section aria-labelledby="verify-heading" className="space-y-10">
      {/* Header + Practitioner Focus */}
      <div className="border-b border-[#E8E3DB] dark:border-[#2C3037] pb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#575B62] dark:text-[#A3A7AE]">
              {profile.displayName}
              <span aria-hidden="true"> · </span>
              {stageMeta.title}
            </p>
            <h1
              id="verify-heading"
              className="font-display text-2xl sm:text-3xl font-medium tracking-tight mt-1 text-[#17191C] dark:text-[#F4F2EE]"
            >
              {t.verifyHeading}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-[#575B62] dark:text-[#A3A7AE] max-w-2xl">
              Show your real-world judgment through past work or a short practical scenario—no CV or paper degree required.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setDraftProblem(profile.problemStatement);
              setDraftStage(profile.ageStage);
              setEditingFocus((v) => !v);
            }}
            className="min-h-[42px] px-4 py-2 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:bg-[#F2EEE8] dark:hover:bg-[#22252A] text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 self-start sm:self-auto transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>{t.editFocusButton}</span>
          </button>
        </div>

        {!editingFocus ? (
          profile.problemStatement.trim() ? (
            <p className="mt-5 text-base sm:text-lg font-medium text-[#17191C] dark:text-[#F4F2EE] leading-relaxed max-w-3xl">
              “{profile.problemStatement}”
            </p>
          ) : (
            <p className="mt-5 text-sm text-[#575B62] dark:text-[#A3A7AE] max-w-2xl">
              {t.verifyLead}
            </p>
          )
        ) : (
          <form onSubmit={handleSaveFocus} className="mt-6 space-y-4 max-w-2xl">
            <VoiceTextarea
              id="edit-focus-problem"
              label={t.problemInputLabel}
              value={draftProblem}
              onChange={setDraftProblem}
              speechLang={speechLang}
              t={t}
              maxLength={500}
              rows={2}
            />
            <div className="flex flex-wrap gap-2">
              {STAGES.map((st) => {
                const label = getStageLabel(st, t);
                const active = draftStage === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setDraftStage(st)}
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-[#E7F3EE] dark:bg-[#142B24] border-[#146C53] dark:border-[#2EB88B] text-[#146C53] dark:text-[#2EB88B]'
                        : 'bg-white dark:bg-[#1A1C20] border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE]'
                    }`}
                  >
                    {label.title}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="min-h-[42px] px-5 py-2 rounded-lg bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold transition-colors whitespace-nowrap"
              >
                {t.saveFocusButton}
              </button>
              <button
                type="button"
                onClick={() => setEditingFocus(false)}
                className="min-h-[42px] px-4 py-2 rounded-lg text-xs font-medium text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] whitespace-nowrap"
              >
                {t.cancelLabel}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* TALENT STUDIO: 3-Step Progressive "Show, Don't Tell" Verification */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-[#146C53] dark:text-[#2EB88B]">
              Talent Studio · Show, Don&apos;t Tell
            </p>
            <h2 className="font-display text-xl sm:text-2xl font-medium text-[#17191C] dark:text-[#F4F2EE] mt-0.5">
              Living Competency Passport
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Crisp 3-Step Progress Navigation */}
            <ol
              aria-label="Verification steps"
              className="flex items-center gap-2 sm:gap-3 text-xs font-medium"
            >
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (!isVerifying) {
                      setVerifyError(null);
                      setStudioStep(1);
                    }
                  }}
                  className={`px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                    studioStep === 1
                      ? 'bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B] font-semibold'
                      : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                  }`}
                >
                  1. Input
                </button>
              </li>
              <li aria-hidden="true" className="text-[#8A847A]">
                ·
              </li>
              <li>
                <span
                  className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap ${
                    studioStep === 2
                      ? 'bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B] font-semibold'
                      : 'text-[#575B62] dark:text-[#A3A7AE]'
                  }`}
                >
                  2. AI Engine
                </span>
              </li>
              <li aria-hidden="true" className="text-[#8A847A]">
                ·
              </li>
              <li>
                <button
                  type="button"
                  disabled={!passport || isVerifying}
                  onClick={() => passport && setStudioStep(3)}
                  className={`px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap disabled:opacity-45 ${
                    studioStep === 3
                      ? 'bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B] font-semibold'
                      : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                  }`}
                >
                  3. Passport
                </button>
              </li>
            </ol>

            <button
              type="button"
              data-testid="share-passport-btn"
              onClick={() => void handleGenerateSharePassportLink()}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-[#146C53]/35 dark:border-[#2EB88B]/40 bg-[#E7F3EE]/80 dark:bg-[#142B24]/90 hover:bg-[#D5E7DD] dark:hover:bg-[#1E392D] text-[#146C53] dark:text-[#2EB88B] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Passport</span>
            </button>
          </div>
        </div>

        {/* Secure Read-Only Share Passport Link Panel */}
        {sharedLinkState && (
          <div
            role="status"
            data-testid="share-passport-panel"
            className="rounded-2xl bg-[#E7F3EE]/75 dark:bg-[#142B24]/85 border border-[#146C53]/35 dark:border-[#2EB88B]/40 p-4 sm:p-5 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#146C53] dark:text-[#2EB88B]">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Read-Only Living Competency Passport Link Ready ·{' '}
                  <span className="font-mono-tabular">{sharedLinkState.payload.readOnlySignature}</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSharedLinkState(null)}
                className="text-xs font-medium text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-[#43484E] dark:text-[#C4C9D0]">
              Share externally with hiring partners or institutions—displays verified skills and peer endorsements in read-only mode without exposing private account details.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <input
                type="text"
                readOnly
                aria-label="Read-only passport share URL"
                data-testid="share-passport-url-input"
                value={sharedLinkState.url}
                className="flex-1 min-h-[40px] rounded-xl bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3 py-2 text-xs font-mono-tabular text-[#17191C] dark:text-[#F4F2EE] focus:outline-none"
              />
              <button
                type="button"
                data-testid="copy-shared-passport-link-btn"
                onClick={() => void handleCopySharedLink()}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
              >
                {sharedLinkState.copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Link Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
              <button
                type="button"
                data-testid="preview-shared-passport-btn"
                onClick={() => onPreviewSharedPassport(sharedLinkState.payload)}
                className="min-h-[40px] px-4 py-2 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:bg-[#F2EEE8] dark:hover:bg-[#22252A] text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Preview Read-Only</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: Crisp Progressive Input Card */}
        {studioStep === 1 && (
          <form
            onSubmit={(e) => void handleRunVerification(e)}
            className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 sm:p-8 space-y-6"
          >
            {/* Mode Switcher: Past Work Summary vs Practical Scenario */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E3DB] dark:border-[#2C3037] pb-5">
              <div
                role="tablist"
                aria-label="Choose verification input method"
                className="inline-flex p-1 rounded-xl bg-[#F2EEE8] dark:bg-[#22252A] self-start"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={inputMode === 'summary'}
                  onClick={() => {
                    setInputMode('summary');
                    setVerifyError(null);
                  }}
                  className={`min-h-[38px] px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    inputMode === 'summary'
                      ? 'bg-white dark:bg-[#1A1C20] text-[#17191C] dark:text-[#F4F2EE] shadow-xs'
                      : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                  }`}
                >
                  Share Past Work
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={inputMode === 'scenario'}
                  onClick={() => {
                    setInputMode('scenario');
                    setVerifyError(null);
                  }}
                  className={`min-h-[38px] px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    inputMode === 'scenario'
                      ? 'bg-white dark:bg-[#1A1C20] text-[#17191C] dark:text-[#F4F2EE] shadow-xs'
                      : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                  }`}
                >
                  Solve Practical Scenario
                </button>
              </div>

              {/* 4 Studio Domains */}
              <div className="flex flex-wrap gap-2" aria-label="Select studio domain">
                {STUDIO_DOMAINS.map((domain) => {
                  const active = studioDomain === domain;
                  return (
                    <button
                      key={domain}
                      type="button"
                      onClick={() => {
                        setStudioDomain(domain);
                        setVerifyError(null);
                      }}
                      className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                        active
                          ? 'bg-[#146C53] dark:bg-[#2EB88B] border-[#146C53] dark:border-[#2EB88B] text-white dark:text-[#121315]'
                          : 'bg-[#FAF8F5] dark:bg-[#121315] border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                      }`}
                    >
                      {domain}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scenario Prompt Card when in scenario mode */}
            {inputMode === 'scenario' && (
              <div className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-5 space-y-2.5">
                <p className="text-xs font-semibold text-[#146C53] dark:text-[#2EB88B]">
                  Practical Field Scenario · {activeScenario.domain}
                </p>
                <h3 className="font-display text-lg font-medium text-[#17191C] dark:text-[#F4F2EE]">
                  {activeScenario.title}
                </h3>
                <p className="text-sm leading-relaxed text-[#575B62] dark:text-[#A3A7AE]">
                  {activeScenario.context}
                </p>
                <p className="text-sm font-medium text-[#17191C] dark:text-[#F4F2EE] pt-1">
                  {activeScenario.question}
                </p>
              </div>
            )}

            {/* Main Voice/Text Response Field */}
            <VoiceTextarea
              id="studio-verification-input"
              label={
                inputMode === 'scenario'
                  ? 'Your Practical Solution (Voice or Text)'
                  : `Summarize Real-World Work You Have Completed in ${studioDomain}`
              }
              value={studioResponse}
              onChange={(val) => {
                setStudioResponse(val);
                if (verifyError) setVerifyError(null);
              }}
              placeholder={
                inputMode === 'scenario'
                  ? activeScenario.placeholder
                  : 'Describe systems you built, diagnosed, managed, or repaired—include concrete metrics, tools, or outcomes...'
              }
              speechLang={speechLang}
              t={t}
              maxLength={2400}
              rows={4}
              listenToCommandTrigger
            />

            {/* Optional Supporting Evidence Disclosure */}
            <div className="border-t border-[#E8E3DB] dark:border-[#2C3037] pt-4">
              <button
                type="button"
                onClick={() => setShowStudioEvidence((v) => !v)}
                aria-expanded={showStudioEvidence}
                className="text-xs font-medium text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] inline-flex items-center gap-1.5"
              >
                {showStudioEvidence ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
                <span>Attach optional portfolio link, certification, or peer endorsement</span>
              </button>

              {showStudioEvidence && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <VoiceInput
                    id="studio-portfolio-input"
                    label="Portfolio / Work Sample"
                    value={studioPortfolio}
                    onChange={setStudioPortfolio}
                    placeholder="URL or project reference"
                    speechLang={speechLang}
                    t={t}
                    maxLength={200}
                  />
                  <VoiceInput
                    id="studio-cert-input"
                    label="Certification / License"
                    value={studioCert}
                    onChange={setStudioCert}
                    placeholder="e.g., IEC Solar Safety Log"
                    speechLang={speechLang}
                    t={t}
                    maxLength={160}
                  />
                  <VoiceInput
                    id="studio-endorsement-input"
                    label="Peer Endorsement"
                    value={studioEndorsement}
                    onChange={setStudioEndorsement}
                    placeholder="Colleague or supervisor name & role"
                    speechLang={speechLang}
                    t={t}
                    maxLength={200}
                  />
                </div>
              )}
            </div>

            {verifyError && (
              <p role="alert" className="text-xs font-medium text-[#B42318] dark:text-[#F97066]">
                {verifyError}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <button
                type="submit"
                disabled={isVerifying}
                className="min-h-[46px] px-6 py-2.5 rounded-xl bg-[#C4622D] hover:bg-[#AA5223] dark:bg-[#E07B46] dark:hover:bg-[#CE6A36] text-white dark:text-[#121315] text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Living Competency Passport</span>
              </button>

              {passport && (
                <button
                  type="button"
                  onClick={() => setStudioStep(3)}
                  className="min-h-[42px] px-4 py-2 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] text-xs font-medium text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] whitespace-nowrap"
                >
                  View Current Passport
                </button>
              )}
            </div>
          </form>
        )}

        {/* STEP 2: AI Verification Engine Processing / Error State */}
        {studioStep === 2 && (
          <div className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-8 sm:p-10 text-center space-y-5">
            {isVerifying ? (
              <>
                <div className="w-12 h-12 rounded-xl bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B] mx-auto flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="font-display text-xl font-medium text-[#17191C] dark:text-[#F4F2EE]">
                    Evaluating Practical Competence
                  </h3>
                  <p className="text-sm text-[#575B62] dark:text-[#A3A7AE]">
                    Mapping field rigor, safety practices, and {studioDomain} signals into your Living Competency Passport…
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2 max-w-lg mx-auto">
                  <h3 className="font-display text-xl font-medium text-[#17191C] dark:text-[#F4F2EE]">
                    Verification Could Not Be Completed
                  </h3>
                  <p role="alert" className="text-sm text-[#B42318] dark:text-[#F97066]">
                    {verifyError || 'Unexpected error contacting the verification engine.'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => void handleRunVerification()}
                    className="min-h-[42px] px-5 py-2 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold whitespace-nowrap"
                  >
                    Try Again
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVerifyError(null);
                      setStudioStep(1);
                    }}
                    className="min-h-[42px] px-4 py-2 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] text-xs font-medium text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] whitespace-nowrap"
                  >
                    Edit Response
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP 3: Living Competency Passport Card */}
        {studioStep === 3 && passport && (
          <div className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#146C53]/35 dark:border-[#2EB88B]/40 p-6 sm:p-8 space-y-6">
            {/* Top Credential Banner */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#E8E3DB] dark:border-[#2C3037] pb-5">
              <div>
                <p className="text-xs font-semibold text-[#146C53] dark:text-[#2EB88B]">
                  Verified Living Competency Passport · {passport.studioDomain}
                </p>
                <h3 className="font-display text-2xl font-medium text-[#17191C] dark:text-[#F4F2EE] mt-1">
                  {passport.fieldMatch}
                </h3>
                <p className="text-sm text-[#575B62] dark:text-[#A3A7AE] mt-1">
                  {passport.ageStageTrack}
                  {endorsements.filter((e) => e.status === 'verified').length > 0 && (
                    <>
                      <span aria-hidden="true"> · </span>
                      <span className="font-medium text-[#146C53] dark:text-[#2EB88B]">
                        {endorsements.filter((e) => e.status === 'verified').length} peer endorsement
                        {endorsements.filter((e) => e.status === 'verified').length === 1 ? '' : 's'} attached
                      </span>
                    </>
                  )}
                </p>
              </div>

              <div className="text-xs font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE] sm:text-end shrink-0">
                <div>{passport.inputMode === 'scenario' ? 'Practical Scenario' : 'Work Summary'}</div>
                <div className="mt-0.5">
                  {new Date(passport.generatedAtIso).toLocaleDateString()}
                </div>
              </div>
            </div>

            <p className="text-sm sm:text-base leading-relaxed text-[#17191C] dark:text-[#F4F2EE]">
              {passport.executiveSummary}
            </p>

            {/* Verified Core Skills */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#575B62] dark:text-[#A3A7AE]">
                Verified Core Skills
              </p>
              <div className="divide-y divide-[#E8E3DB] dark:divide-[#2C3037] border-t border-b border-[#E8E3DB] dark:border-[#2C3037]">
                {passport.verifiedSkills.map((skill) => (
                  <div
                    key={skill.name}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                        {skill.name}
                      </p>
                      <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] mt-0.5 leading-relaxed">
                        {skill.evidenceNote}
                      </p>
                    </div>
                    <span className="text-xs font-mono-tabular tabular-nums font-semibold text-[#146C53] dark:text-[#2EB88B] whitespace-nowrap shrink-0">
                      {skill.confidenceLabel} · {skill.confidenceScore}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* EXACTLY ONE Targeted Micro-Bridging Step + Partner Fee-Waiver/Stipend Toggle */}
            <div className="rounded-xl bg-[#E7F3EE]/75 dark:bg-[#142B24]/85 border border-[#146C53]/25 dark:border-[#2EB88B]/30 p-5 space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[#146C53] dark:text-[#2EB88B]">
                  Targeted Micro-Bridging Action · {passport.microBridge.estimatedDuration}
                </p>
                <h4 className="text-base font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                  {passport.microBridge.title}
                </h4>
                <p className="text-sm text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                  {passport.microBridge.action}
                </p>
                <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] pt-0.5">
                  Recognition Partner: <span className="font-medium text-[#17191C] dark:text-[#F4F2EE]">{passport.microBridge.partnerProgram}</span>
                </p>
              </div>

              <div className="pt-3 border-t border-[#146C53]/20 dark:border-[#2EB88B]/25 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                    Partner Fee-Waiver &amp; Bridging Stipend Eligibility
                  </p>
                  <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] mt-0.5">
                    {passport.stipendEligible
                      ? 'Flagged for partner fee-waiver and completion stipend review upon export.'
                      : 'Toggle on to include partner fee-waiver / stipend eligibility in your exported passport.'}
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={passport.stipendEligible}
                  aria-label="Toggle partner fee-waiver and stipend eligibility"
                  onClick={() => onTogglePassportStipend(!passport.stipendEligible)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B] ${
                    passport.stipendEligible
                      ? 'bg-[#146C53] dark:bg-[#2EB88B]'
                      : 'bg-[#C8C2B8] dark:bg-[#3D3933]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-[#121315] transition-transform ${
                      passport.stipendEligible ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {importBanner && (
              <p role="status" className="text-xs font-medium text-[#146C53] dark:text-[#2EB88B]">
                {importBanner}
              </p>
            )}

            {/* Maximum 3 Crisp Primary Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowExportModal(true)}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Export Verified Passport</span>
              </button>

              <button
                type="button"
                data-testid="passport-card-share-btn"
                onClick={() => void handleGenerateSharePassportLink()}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#E7F3EE] dark:bg-[#142B24] hover:bg-[#D5E7DD] dark:hover:bg-[#1E392D] text-[#146C53] dark:text-[#2EB88B] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Passport</span>
              </button>

              <button
                type="button"
                onClick={handleCommitPassportSkills}
                className="min-h-[44px] px-4 py-2.5 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:bg-[#F2EEE8] dark:hover:bg-[#22252A] text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Check className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B]" />
                <span>Save Skills to Ledger</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setVerifyError(null);
                  setImportBanner(null);
                  setStudioStep(1);
                }}
                className="ms-auto text-xs font-medium text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>New Verification</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PEER ENDORSEMENT WORKFLOW — Collaborator attestations strengthening the Living Competency Passport */}
      <PeerEndorsementPanel
        variant="verify"
        endorsements={endorsements}
        capabilities={capabilities}
        passport={passport}
        speechLang={speechLang}
        t={t}
        onRequestEndorsement={onRequestEndorsement}
        onCompleteEndorsement={onCompleteEndorsement}
        onDeleteEndorsement={onDeleteEndorsement}
      />

      {/* CAPABILITY & EVIDENCE LEDGER (Works 100% Offline) */}
      <div className="pt-4 border-t border-[#E8E3DB] dark:border-[#2C3037] space-y-6">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-medium text-[#17191C] dark:text-[#F4F2EE]">
            Verified Capabilities &amp; Supporting Evidence
          </h2>
          <p className="mt-1 text-sm text-[#575B62] dark:text-[#A3A7AE]">
            Showcase individual capabilities alongside portfolio references, certifications, or peer endorsements. Saved offline automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-4">
            {capabilities.map((cap) => (
              <article
                key={cap.id}
                className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#575B62] dark:text-[#A3A7AE]">
                      <span>{cap.domain}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          cap.verificationStatus === 'pending'
                            ? 'text-[#9A5B13] dark:text-[#E5A95E] font-medium'
                            : 'text-[#146C53] dark:text-[#2EB88B] font-medium'
                        }
                      >
                        {renderStatusText(cap.verificationStatus)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums font-mono-tabular">
                        {cap.confidenceScore}%
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                      {cap.title}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteCapability(cap.id)}
                    aria-label={`Remove capability ${cap.title}`}
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-[#575B62] dark:text-[#A3A7AE] hover:bg-[#F2EEE8] dark:hover:bg-[#22252A] transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-[#575B62] dark:text-[#A3A7AE]">
                  {cap.proofSummary}
                </p>

                {(cap.portfolioRef || cap.certificationRef || cap.peerEndorsement) && (
                  <dl className="mt-4 pt-3.5 border-t border-[#E8E3DB] dark:border-[#2C3037] space-y-2 text-xs">
                    {cap.portfolioRef && (
                      <div className="flex items-start gap-2 text-[#575B62] dark:text-[#A3A7AE]">
                        <ExternalLink className="w-3.5 h-3.5 mt-0.5 text-[#146C53] dark:text-[#2EB88B] shrink-0" />
                        <span>
                          <strong className="font-medium text-[#17191C] dark:text-[#F4F2EE]">
                            Portfolio:
                          </strong>{' '}
                          {cap.portfolioRef}
                        </span>
                      </div>
                    )}
                    {cap.certificationRef && (
                      <div className="flex items-start gap-2 text-[#575B62] dark:text-[#A3A7AE]">
                        <Award className="w-3.5 h-3.5 mt-0.5 text-[#146C53] dark:text-[#2EB88B] shrink-0" />
                        <span>
                          <strong className="font-medium text-[#17191C] dark:text-[#F4F2EE]">
                            Certification:
                          </strong>{' '}
                          {cap.certificationRef}
                        </span>
                      </div>
                    )}
                    {cap.peerEndorsement && (
                      <div className="flex items-start gap-2 text-[#575B62] dark:text-[#A3A7AE]">
                        <Users className="w-3.5 h-3.5 mt-0.5 text-[#146C53] dark:text-[#2EB88B] shrink-0" />
                        <span>
                          <strong className="font-medium text-[#17191C] dark:text-[#F4F2EE]">
                            Endorsement:
                          </strong>{' '}
                          {cap.peerEndorsement}
                        </span>
                      </div>
                    )}
                  </dl>
                )}

                {cap.verificationStatus !== 'master-endorsed' && (
                  <div className="mt-5 pt-4 border-t border-[#E8E3DB] dark:border-[#2C3037] flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => onPromoteCapability(cap.id)}
                      className="min-h-[40px] px-4 py-2 rounded-lg bg-[#E7F3EE] dark:bg-[#142B24] hover:bg-[#D5E7DD] dark:hover:bg-[#1E392D] text-[#146C53] dark:text-[#2EB88B] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      {cap.verificationStatus === 'pending' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>{t.verifyStepCta}</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{t.endorseStepCta}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>

          {/* Add New Capability Form with Portfolio, Certification & Peer Endorsement */}
          <div className="lg:col-span-5">
            <form
              onSubmit={handleCreateCapability}
              className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 space-y-5"
            >
              <h3 className="font-display text-xl font-medium text-[#17191C] dark:text-[#F4F2EE]">
                {t.addCapabilityHeading}
              </h3>

              <VoiceInput
                id="cap-title-input"
                label={t.capabilityTitleLabel}
                value={capTitle}
                onChange={(v) => {
                  setCapTitle(v);
                  if (formError) setFormError(null);
                }}
                placeholder={t.capabilityTitlePlaceholder}
                speechLang={speechLang}
                t={t}
                maxLength={120}
              />

              <div className="space-y-1.5">
                <label
                  htmlFor="cap-domain-select"
                  className="block text-sm font-medium text-[#17191C] dark:text-[#F4F2EE]"
                >
                  {t.capabilityDomainLabel}
                </label>
                <select
                  id="cap-domain-select"
                  value={capDomain}
                  onChange={(e) => setCapDomain(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] px-4 py-2.5 text-sm text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B]"
                >
                  {PRACTICE_DOMAINS.map((domain) => (
                    <option key={domain} value={domain}>
                      {domain}
                    </option>
                  ))}
                </select>
              </div>

              <VoiceTextarea
                id="cap-proof-input"
                label={t.capabilityProofLabel}
                value={capProof}
                onChange={(v) => {
                  setCapProof(v);
                  if (formError) setFormError(null);
                }}
                placeholder={t.capabilityProofPlaceholder}
                speechLang={speechLang}
                t={t}
                maxLength={600}
                rows={3}
              />

              <div className="pt-3 border-t border-[#E8E3DB] dark:border-[#2C3037] space-y-4">
                <p className="text-xs font-medium text-[#575B62] dark:text-[#A3A7AE]">
                  Optional Trust Signals
                </p>
                <VoiceInput
                  id="cap-portfolio-input"
                  label="Portfolio Link or Work Reference"
                  value={capPortfolio}
                  onChange={setCapPortfolio}
                  placeholder="Schematic, GitHub, photo log, or project site"
                  speechLang={speechLang}
                  t={t}
                  maxLength={300}
                />
                <VoiceInput
                  id="cap-cert-input"
                  label="Certification or Trade License"
                  value={capCert}
                  onChange={setCapCert}
                  placeholder="e.g., Electrical Guild Certificate"
                  speechLang={speechLang}
                  t={t}
                  maxLength={200}
                />
                <VoiceInput
                  id="cap-endorsement-input"
                  label="Peer Endorsement"
                  value={capEndorsement}
                  onChange={setCapEndorsement}
                  placeholder="Name, role & brief voucher note"
                  speechLang={speechLang}
                  t={t}
                  maxLength={400}
                />
              </div>

              {formError && (
                <p role="alert" className="text-xs font-medium text-[#B42318] dark:text-[#F97066]">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                className="w-full min-h-[46px] px-5 py-2.5 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-sm font-semibold transition-colors"
              >
                {t.addCapabilityCta}
              </button>
            </form>
          </div>
        </div>
      </div>

      {showExportModal && passport && (
        <PassportPreviewModal
          passport={passport}
          profile={profile}
          capabilities={capabilities}
          endorsements={endorsements}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </section>
  );
};
