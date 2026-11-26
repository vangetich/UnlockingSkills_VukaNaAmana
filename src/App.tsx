import { useCallback, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { Building2, CheckCircle2, RefreshCw, ShieldCheck, WifiOff, X } from 'lucide-react';
import {
  auth,
  deleteCloudCapability,
  deleteCloudCollaborationNote,
  deleteCloudEndorsement,
  deleteCloudMenteeCompetencyBadge,
  deleteCloudMentorMilestoneFeedback,
  deleteCloudMentorPairing,
  deleteCloudMentorPeerReview,
  deleteCloudMentorRating,
  deleteCloudMentorshipJournalEntry,
  deleteCloudMentorshipSession,
  deleteCloudMentorshipSessionAgenda,
  deleteCloudSprintDiscussionPost,
  ensureCloudProfile,
  fetchCloudWorkspace,
  formatFirebaseAuthError,
  linkAccountProvider,
  refreshAuthUser,
  registerWithEmailPassword,
  resendVerificationEmail,
  sendPasswordReset,
  signInWithEmailPassword,
  signInWithGoogle,
  signInWithMicrosoft,
  signInWithYahoo,
  signOutAccount,
  subscribeToCapabilities,
  subscribeToContributions,
  subscribeToSprintDiscussions,
  upsertCloudCapability,
  upsertCloudCollaborationNote,
  upsertCloudContribution,
  upsertCloudEndorsement,
  upsertCloudMenteeCompetencyBadge,
  upsertCloudMentorMessage,
  upsertCloudMentorMilestoneFeedback,
  upsertCloudMentorPairing,
  upsertCloudMentorPeerReview,
  upsertCloudMentorRating,
  upsertCloudMentorshipJournalEntry,
  upsertCloudMentorshipSession,
  upsertCloudMentorshipSessionAgenda,
  upsertCloudMentorshipTrackProgress,
  upsertCloudPassport,
  upsertCloudPayout,
  upsertCloudSprintDiscussionPost,
  upsertCloudSprintFeedback,
  upsertCloudVault,
} from './lib/firebase';
import type {
  ActiveAuthSession,
  AgeStage,
  AppViewMode,
  BriefSubmission,
  CohortBlueprintPreview,
  CompetencyPassport,
  ContractPayout,
  JobToFitUpskillingBridge,
  LivingProofPortfolio,
  LocaleCode,
  LockedUpskillingBridgeRecord,
  MatchedWorkApplication,
  MenteeCompetencyBadge,
  MentorMessage,
  MentorMilestoneFeedback,
  MentorPairingCadence,
  MentorPairingRequest,
  MentorPeerReviewRecord,
  MentorRating,
  MentorRatingScore,
  MentorshipJournalEntry,
  MentorshipSession,
  MentorshipSessionAgendaRecord,
  MentorshipTrackProgressRecord,
  MentorshipTrackSpec,
  OfflineMutation,
  PeerEndorsement,
  PodMentorProfile,
  PortalRealm,
  PractitionerProfile,
  ProblemBrief,
  RankedMatchedWorkOpportunity,
  RankedSolutionSprint,
  SharedPassportPayload,
  SkillCapability,
  SprintCollaborationNote,
  SprintDiscussionPost,
  SprintFeedback,
  SprintMilestoneKey,
  SprintRatingScore,
  UnlockViewMode,
  UpskillingBridgePathOption,
  WorkReadyVault,
  WorkspaceTab,
  ConsentGrant,
  AccessAuditLogEntry,
  TalentSessionClaims,
} from './types/kora';
import { TRANSLATIONS, getLocaleMeta } from './utils/i18n';
import {
  loadLocalMatchedWorkApplications,
  loadLocalProofPortfolio,
  loadLocalSprintMilestones,
  loadLocalUpskillingBridges,
  loadLocalWorkspace,
  saveLastSyncedIso,
  saveLocalCapabilities,
  saveLocalCollaborationNotes,
  saveLocalContributions,
  saveLocalEndorsements,
  saveLocalMatchedWorkApplications,
  saveLocalMenteeCompetencyBadges,
  saveLocalMentorMessages,
  saveLocalMentorMilestoneFeedback,
  saveLocalMentorPairings,
  saveLocalMentorPeerReviews,
  saveLocalMentorRatings,
  saveLocalMentorshipJournal,
  saveLocalMentorshipSessionAgendas,
  saveLocalMentorshipSessions,
  saveLocalMentorshipTrackProgress,
  saveLocalPassport,
  saveLocalPayouts,
  saveLocalProfile,
  saveLocalProofPortfolio,
  saveLocalSprintDiscussions,
  saveLocalSprintFeedback,
  saveLocalSprintMilestones,
  saveLocalUpskillingBridges,
  saveLocalVault,
  saveOfflineQueue,
} from './utils/offlineStore';
import {
  SEED_BRIEFS,
  SOLUTION_SPRINTS,
  advancePayoutStatus,
  buildMentorQuickReply,
  countWorkplaceSignals,
  getWorkSetupPreferenceLabel,
  isComplianceClearedForWork,
  makeSafeId,
  normalizeAgeStage,
  normalizeLocale,
  normalizeSprintMilestones,
  parseSharedPassportToken,
  promoteVerificationStatus,
  toggleSprintMilestoneList,
  getAssignedMentorForSprint,
} from './utils/talentEngine';
import {
  DOMAIN_SKILL_BADGE_CATALOG,
  generateBadgeVerificationCode,
  normalizeBadgeStudioDomain,
} from './components/MenteeCompetencyEndorsement';
import type { CreateSprintDiscussionInput } from './components/SprintDiscussionBoard';
import type { SaveMentorshipJournalInput } from './components/MentorshipJournal';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useAutoSave } from './hooks/useAutoSave';
import {
  MessagingProvider,
  type LogMentorshipSessionInput,
} from './contexts/MessagingContext';
import { LandingFunnel } from './components/LandingFunnel';
import { TopNav } from './components/TopNav';
import { PwaSyncStatusBar } from './components/PwaSyncStatusBar';
import { WorkspaceUtilities } from './components/WorkspaceUtilities';
import { VerifyView } from './components/VerifyView';
import { UnlockView } from './components/UnlockView';
import { SolveView } from './components/SolveView';
import { StageSequenceDisclaimer } from './components/StageSequenceDisclaimer';
import { PulseView } from './components/PulseView';
import { ClearedView } from './components/ClearedView';
import { PartnerScaleDrawer } from './components/PartnerScaleDrawer';
import { SharedPassportView } from './components/SharedPassportView';
import { MentorMessagingDrawer } from './components/MentorMessagingDrawer';
import { CommandPalette } from './components/CommandPalette';
import { GlossaryModal, type PartnerConsoleTab } from './components/GlossaryModal';
import { BibliographyModal } from './components/BibliographyModal';
import { JudgeGuidePdfModal, type PdfDocumentSpec } from './components/JudgeGuidePdfModal';
import { AccountSyncModal, type EmailVaultSyncStatus } from './components/AccountSyncModal';
import { DualDoorAuthModal } from './components/DualDoorAuthModal';
import { PrivacySharedAccessModal } from './components/PrivacySharedAccessModal';
import { SyncLedger } from './components/SyncLedger';
import { PartnerConsoleView } from './components/PartnerConsoleView';
import type { EndSessionDetails } from './components/EndSessionPopover';
import { toggleObjectiveCompletion } from './components/MentorshipMilestoneTracker';
import { AccessComfortDrawer, ReadAloudMiniBar } from './components/AccessComfortDrawer';
import {
  applyAccessComfortToDocument,
  getDefaultAccessComfortPreferences,
  hasCustomAccessComfort,
  loadAccessComfortPreferences,
  saveAccessComfortPreferences,
  useReadAloud,
  type AccessComfortPreferences,
} from './utils/accessComfort';
import {
  createDefaultPreContractingRecord,
  type DocumentFeedbackStage,
  type PartnerApplicantFeedbackItem,
  type PartnerFeedbackTone,
  type PartnerInternalNote,
  type PartnerInternalNoteCategory,
  type PartnerPreContractingRecord,
  type PartnerStepReviewStatus,
  type PartnerVerificationStepId,
} from './utils/partnerVerification';

export default function App() {
  const searchParams =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const autostart = searchParams?.get('autostart') === '1';
  const incomingEndorseToken = searchParams?.get('endorse') ?? null;
  const incomingEndorseSkill = searchParams?.get('skill') ?? null;
  const incomingPassportToken = searchParams?.get('passport') ?? null;
  const incomingTabParam = searchParams?.get('tab') ?? null;
  const incomingSprintId = searchParams?.get('sprint') ?? null;
  const incomingContributionId = searchParams?.get('contribution') ?? null;

  const [pendingDeepLinkSprintId, setPendingDeepLinkSprintId] = useState<string | null>(
    incomingSprintId
  );
  const [pendingDeepLinkContributionId, setPendingDeepLinkContributionId] = useState<string | null>(
    incomingContributionId
  );

  const [sharedPassportView, setSharedPassportView] = useState<SharedPassportPayload | null>(() =>
    parseSharedPassportToken(incomingPassportToken)
  );

  const [initialState] = useState(() => loadLocalWorkspace(autostart || Boolean(incomingEndorseToken)));
  const [profile, setProfile] = useState<PractitionerProfile>(initialState.profile);
  const [capabilities, setCapabilities] = useState<SkillCapability[]>(initialState.capabilities);
  const [contributions, setContributions] = useState<BriefSubmission[]>(initialState.contributions);
  const [passport, setPassport] = useState<CompetencyPassport | null>(initialState.passport);
  const [vault, setVault] = useState<WorkReadyVault>(initialState.vault);
  const [endorsements, setEndorsements] = useState<PeerEndorsement[]>(initialState.endorsements);
  const [payouts, setPayouts] = useState<ContractPayout[]>(initialState.payouts);
  const [sprintFeedback, setSprintFeedback] = useState<SprintFeedback[]>(
    initialState.sprintFeedback
  );
  const [mentorMessages, setMentorMessages] = useState<MentorMessage[]>(
    initialState.mentorMessages
  );
  const [mentorshipSessions, setMentorshipSessions] = useState<MentorshipSession[]>(
    initialState.mentorshipSessions
  );
  const [mentorPairings, setMentorPairings] = useState<MentorPairingRequest[]>(
    initialState.mentorPairings
  );
  const [mentorRatings, setMentorRatings] = useState<MentorRating[]>(
    initialState.mentorRatings
  );
  const [mentorshipTrackProgress, setMentorshipTrackProgress] = useState<
    MentorshipTrackProgressRecord[]
  >(initialState.mentorshipTrackProgress);
  const [collaborationNotes, setCollaborationNotes] = useState<SprintCollaborationNote[]>(
    initialState.collaborationNotes
  );
  const [mentorshipJournal, setMentorshipJournal] = useState<MentorshipJournalEntry[]>(
    initialState.mentorshipJournal
  );
  const [sprintDiscussions, setSprintDiscussions] = useState<SprintDiscussionPost[]>(
    initialState.sprintDiscussions
  );
  const [menteeCompetencyBadges, setMenteeCompetencyBadges] = useState<MenteeCompetencyBadge[]>(
    initialState.menteeCompetencyBadges
  );
  const [mentorMilestoneFeedback, setMentorMilestoneFeedback] = useState<MentorMilestoneFeedback[]>(
    initialState.mentorMilestoneFeedback
  );
  const [mentorshipSessionAgendas, setMentorshipSessionAgendas] = useState<
    MentorshipSessionAgendaRecord[]
  >(initialState.mentorshipSessionAgendas);
  const [mentorPeerReviews, setMentorPeerReviews] = useState<MentorPeerReviewRecord[]>(
    initialState.mentorPeerReviews
  );
  const [offlineQueue, setOfflineQueue] = useState<OfflineMutation[]>(initialState.queue);
  const [lastSyncedIso, setLastSyncedIso] = useState<string | null>(initialState.lastSyncedIso);
  const [proofPortfolio, setProofPortfolio] = useState<LivingProofPortfolio>(() =>
    loadLocalProofPortfolio()
  );
  const [sprintMilestonesByBrief, setSprintMilestonesByBrief] = useState<
    Record<string, SprintMilestoneKey[]>
  >(() => loadLocalSprintMilestones());
  const [matchedApplications, setMatchedApplications] = useState<MatchedWorkApplication[]>(() =>
    loadLocalMatchedWorkApplications()
  );
  const [lockedBridges, setLockedBridges] = useState<LockedUpskillingBridgeRecord[]>(() =>
    loadLocalUpskillingBridges()
  );

  const [activeTab, setActiveTab] = useState<WorkspaceTab>(() => {
    if (
      incomingTabParam === 'verify' ||
      incomingTabParam === 'unlock' ||
      incomingTabParam === 'solve' ||
      incomingTabParam === 'pulse' ||
      incomingTabParam === 'cleared'
    ) {
      return incomingTabParam;
    }
    if (incomingSprintId) {
      return 'pulse';
    }
    if (typeof window === 'undefined') return 'verify';
    const saved = window.sessionStorage.getItem('vuka.activeTab');
    if (
      saved === 'verify' ||
      saved === 'unlock' ||
      saved === 'solve' ||
      saved === 'pulse' ||
      saved === 'cleared'
    ) {
      return saved;
    }
    return 'verify';
  });
  const [unlockViewMode, setUnlockViewMode] = useState<UnlockViewMode>('talent');
  const [selectedBriefId, setSelectedBriefId] = useState<string | null>(
    initialState.contributions[0]?.briefId ?? null
  );
  const [recentCompletedContribution, setRecentCompletedContribution] =
    useState<BriefSubmission | null>(null);
  // Always start on Landing Funnel until an authenticated 2FA/PIN or Partner session is verified
  const [viewMode, setViewMode] = useState<AppViewMode>('landing');
  const [authSessionChecked, setAuthSessionChecked] = useState(false);
  const [activePortal, setActivePortal] = useState<PortalRealm>('talent');
  // Scoped Dual-Door session token kept strictly in React memory (never persisted to localStorage/sessionStorage)
  const [activeAuthSession, setActiveAuthSession] = useState<ActiveAuthSession | null>(null);
  const [pendingRedirectTab, setPendingRedirectTab] = useState<WorkspaceTab | null>(null);
  const pendingPostAuthActionRef = useRef<(() => void) | null>(null);
  const [dualDoorModal, setDualDoorModal] = useState<{
    isOpen: boolean;
    door: PortalRealm;
    pendingPayload?: { problemStatement: string; ageStage: AgeStage };
    pendingTab?: WorkspaceTab;
  }>({ isOpen: false, door: 'talent' });
  const [isScaleDrawerOpen, setIsScaleDrawerOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAccessDrawerOpen, setIsAccessDrawerOpen] = useState(false);
  const [accessPrefs, setAccessPrefs] = useState<AccessComfortPreferences>(() =>
    loadAccessComfortPreferences()
  );
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [isBibliographyOpen, setIsBibliographyOpen] = useState(false);
  const [activePdfPreview, setActivePdfPreview] = useState<PdfDocumentSpec | null>(null);
  const [partnerConsoleTab, setPartnerConsoleTab] = useState<PartnerConsoleTab>('sprints');
  const [isAccountSyncOpen, setIsAccountSyncOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [consentGrants, setConsentGrants] = useState<ConsentGrant[]>([]);
  const [postedSprints, setPostedSprints] = useState<ProblemBrief[]>(() => SEED_BRIEFS);
  const [issuedContractsByGrantId, setIssuedContractsByGrantId] = useState<
    Record<string, { contractRef: string; bridgeType: string; issuedAtIso: string }>
  >({});
  const [partnerVerifications, setPartnerVerifications] = useState<
    Record<string, PartnerPreContractingRecord>
  >({});
  const [partnerApplicantFeedback, setPartnerApplicantFeedback] = useState<
    PartnerApplicantFeedbackItem[]
  >([]);
  const [partnerInternalNotes, setPartnerInternalNotes] = useState<PartnerInternalNote[]>([]);
  const [accessAuditLogs, setAccessAuditLogs] = useState<AccessAuditLogEntry[]>([]);
  const [sharePassportSignal, setSharePassportSignal] = useState(0);
  const [voiceTriggerSignal, setVoiceTriggerSignal] = useState(0);
  const [endorseBannerDismissed, setEndorseBannerDismissed] = useState(false);
  const [srAnnouncement, setSrAnnouncement] = useState('');
  const srAnnounceTimerRef = useRef<number | null>(null);

  const announcePolite = useCallback((message: string) => {
    setSrAnnouncement('');
    if (typeof window === 'undefined') {
      setSrAnnouncement(message);
      return;
    }
    if (srAnnounceTimerRef.current !== null) {
      window.clearTimeout(srAnnounceTimerRef.current);
    }
    srAnnounceTimerRef.current = window.setTimeout(() => {
      setSrAnnouncement(message);
    }, 30);
  }, []);

  useEffect(() => {
    return () => {
      if (srAnnounceTimerRef.current !== null && typeof window !== 'undefined') {
        window.clearTimeout(srAnnounceTimerRef.current);
      }
    };
  }, []);

  const fetchPartnerSprints = useCallback(async () => {
    try {
      const res = await fetch('/api/partner/sprints', { credentials: 'same-origin' });
      if (!res.ok) return;
      const data = (await res.json()) as { sprints?: ProblemBrief[] };
      if (Array.isArray(data.sprints)) {
        const merged = new Map<string, ProblemBrief>();
        for (const s of data.sprints) {
          merged.set(s.id, s);
        }
        for (const seed of SEED_BRIEFS) {
          if (!merged.has(seed.id)) {
            merged.set(seed.id, seed);
          }
        }
        setPostedSprints(Array.from(merged.values()));
      }
    } catch {
      // Offline fallback keeps SEED_BRIEFS
    }
  }, []);

  const fetchGrantsAndLogs = useCallback(
    async (tokenOverride?: string) => {
      const token = tokenOverride ?? activeAuthSession?.token;
      const headers: Record<string, string> = token
        ? { Authorization: `Bearer ${token}` }
        : {};
      try {
        const [gRes, aRes] = await Promise.all([
          fetch('/api/consent/grants', { credentials: 'same-origin', headers }),
          fetch('/api/audit/logs', { credentials: 'same-origin', headers }),
        ]);
        if (gRes.ok) {
          const gData = (await gRes.json()) as { grants?: ConsentGrant[] };
          if (gData.grants) setConsentGrants(gData.grants);
        }
        if (aRes.ok) {
          const aData = (await aRes.json()) as { auditLogs?: AccessAuditLogEntry[] };
          if (aData.auditLogs) setAccessAuditLogs(aData.auditLogs);
        }
      } catch {
        // Offline fallback
      }
    },
    [activeAuthSession?.token]
  );

  const fetchPartnerContracts = useCallback(
    async (tokenOverride?: string) => {
      const token = tokenOverride ?? activeAuthSession?.token;
      const headers: Record<string, string> = token
        ? { Authorization: `Bearer ${token}` }
        : {};
      try {
        const res = await fetch('/api/partner/contracts', {
          credentials: 'same-origin',
          headers,
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          contracts?: Array<{
            grantId: string;
            contractRef: string;
            bridgeType: string;
            issuedAtIso: string;
          }>;
        };
        if (Array.isArray(data.contracts)) {
          const nextMap: Record<
            string,
            { contractRef: string; bridgeType: string; issuedAtIso: string }
          > = {};
          for (const c of data.contracts) {
            nextMap[c.grantId] = {
              contractRef: c.contractRef,
              bridgeType: c.bridgeType,
              issuedAtIso: c.issuedAtIso,
            };
          }
          setIssuedContractsByGrantId(nextMap);
        }
      } catch {
        // Offline fallback
      }
    },
    [activeAuthSession?.token]
  );

  const fetchPartnerVerificationState = useCallback(
    async (tokenOverride?: string) => {
      const token = tokenOverride ?? activeAuthSession?.token;
      const headers: Record<string, string> = token
        ? { Authorization: `Bearer ${token}` }
        : {};
      try {
        const res = await fetch('/api/partner/verification/state', {
          credentials: 'same-origin',
          headers,
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          verifications?: Record<string, PartnerPreContractingRecord>;
          feedback?: PartnerApplicantFeedbackItem[];
          internalNotes?: PartnerInternalNote[];
          scope?: string;
        };
        if (data.verifications) {
          setPartnerVerifications(data.verifications);
        }
        if (Array.isArray(data.feedback)) {
          setPartnerApplicantFeedback(data.feedback);
        }
        if (
          data.scope === 'partner-active-only' &&
          Array.isArray(data.internalNotes) &&
          activeAuthSession?.realm === 'partner'
        ) {
          setPartnerInternalNotes(data.internalNotes);
        } else {
          setPartnerInternalNotes([]);
        }
      } catch {
        // Offline fallback
      }
    },
    [activeAuthSession?.token, activeAuthSession?.realm]
  );

  const handleUpdateVerificationStep = useCallback(
    async (
      consentId: string,
      stepId: PartnerVerificationStepId,
      status: PartnerStepReviewStatus,
      reviewerNote?: string
    ) => {
      const nowIso = new Date().toISOString();
      const orgLabel =
        activeAuthSession?.realm === 'partner'
          ? activeAuthSession.claims.orgName
          : 'Hiring Partner';

      // Optimistic local update for immediate partner feedback
      setPartnerVerifications((prev) => {
        const base = prev[consentId] ?? createDefaultPreContractingRecord(consentId, nowIso);
        return {
          ...prev,
          [consentId]: {
            ...base,
            steps: {
              ...base.steps,
              [stepId]: {
                status,
                updatedAtIso: nowIso,
                verifiedByOrgName: orgLabel,
                ...(reviewerNote ? { reviewerNote } : {}),
              },
            },
            updatedAtIso: nowIso,
          },
        };
      });

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Requested-With': 'VukaNaAmana',
      };
      if (activeAuthSession?.token) {
        headers.Authorization = `Bearer ${activeAuthSession.token}`;
      }

      try {
        const res = await fetch('/api/partner/verification/step', {
          method: 'POST',
          credentials: 'same-origin',
          headers,
          body: JSON.stringify({ consentId, stepId, status, reviewerNote }),
        });
        if (!res.ok) {
          const errBody = (await res.json().catch(() => ({}))) as { error?: string };
          setGlobalToast({
            id: `verify-step-err-${Date.now()}`,
            variant: 'offline',
            title: 'Verification Update Blocked',
            message:
              errBody.error ||
              'Active, non-revoked Consent Grant required to update pre-contracting steps.',
          });
          await fetchPartnerVerificationState();
          await fetchGrantsAndLogs();
          return;
        }
        const data = (await res.json()) as { verification?: PartnerPreContractingRecord };
        if (data.verification) {
          setPartnerVerifications((prev) => ({
            ...prev,
            [consentId]: data.verification!,
          }));
        }
        const label =
          status === 'verified'
            ? 'verified'
            : status === 'needs_clarification'
              ? 'flagged for clarification'
              : 'reset to pending';
        announcePolite(`Pre-contracting step ${label} for ${consentId}.`);
        setGlobalToast({
          id: `verify-step-ok-${Date.now()}`,
          variant: 'synced',
          title:
            status === 'verified'
              ? 'Pre-Contracting Step Verified'
              : status === 'needs_clarification'
                ? 'Clarification Flagged on Step'
                : 'Step Reset to Pending',
          message: `Updated step for ${consentId}. The applicant’s 2. Unlock progress reflects this live.`,
        });
        void fetchGrantsAndLogs();
      } catch {
        announcePolite('Verification step updated locally.');
      }
    },
    [activeAuthSession, announcePolite, fetchGrantsAndLogs, fetchPartnerVerificationState]
  );

  const handleSendApplicantFeedback = useCallback(
    async (input: {
      consentId: string;
      stage: DocumentFeedbackStage;
      tone: PartnerFeedbackTone;
      message: string;
    }) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Requested-With': 'VukaNaAmana',
      };
      if (activeAuthSession?.token) {
        headers.Authorization = `Bearer ${activeAuthSession.token}`;
      }

      try {
        const res = await fetch('/api/partner/verification/feedback', {
          method: 'POST',
          credentials: 'same-origin',
          headers,
          body: JSON.stringify(input),
        });
        if (!res.ok) {
          const errBody = (await res.json().catch(() => ({}))) as { error?: string };
          setGlobalToast({
            id: `partner-fb-err-${Date.now()}`,
            variant: 'offline',
            title: 'Unable to Send Feedback',
            message:
              errBody.error ||
              'Active Consent Grant required to send stage feedback to this applicant.',
          });
          return;
        }
        const data = (await res.json()) as { feedback?: PartnerApplicantFeedbackItem };
        if (data.feedback) {
          setPartnerApplicantFeedback((prev) => [
            data.feedback!,
            ...prev.filter((item) => item.id !== data.feedback!.id),
          ]);
        }
        announcePolite('Stage-specific feedback sent to applicant.');
        setGlobalToast({
          id: `partner-fb-sent-${Date.now()}`,
          variant: 'synced',
          title: 'Stage Feedback Sent to Applicant',
          message: `Your update for ${input.consentId} is now visible in the applicant’s 2. Unlock view.`,
        });
        void fetchGrantsAndLogs();
      } catch {
        const fallbackItem: PartnerApplicantFeedbackItem = {
          id: `pfb_local_${Date.now()}`,
          consentId: input.consentId,
          talentAlias:
            consentGrants.find((g) => g.consentId === input.consentId)?.talentAlias ??
            'Skilled Applicant',
          fromOrgName:
            activeAuthSession?.realm === 'partner'
              ? activeAuthSession.claims.orgName
              : 'Hiring Partner',
          stage: input.stage,
          tone: input.tone,
          message: input.message,
          createdAtIso: new Date().toISOString(),
        };
        setPartnerApplicantFeedback((prev) => [fallbackItem, ...prev]);
        announcePolite('Stage feedback saved locally.');
      }
    },
    [activeAuthSession, announcePolite, consentGrants, fetchGrantsAndLogs]
  );

  const handleAddPartnerInternalNote = useCallback(
    async (input: {
      consentId: string;
      category: PartnerInternalNoteCategory;
      body: string;
    }) => {
      if (activeAuthSession?.realm !== 'partner') return;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Requested-With': 'VukaNaAmana',
      };
      if (activeAuthSession.token) {
        headers.Authorization = `Bearer ${activeAuthSession.token}`;
      }

      try {
        const res = await fetch('/api/partner/verification/internal-note', {
          method: 'POST',
          credentials: 'same-origin',
          headers,
          body: JSON.stringify(input),
        });
        if (!res.ok) {
          const errBody = (await res.json().catch(() => ({}))) as { error?: string };
          setGlobalToast({
            id: `partner-internal-err-${Date.now()}`,
            variant: 'offline',
            title: 'Unable to Save Internal Note',
            message:
              errBody.error ||
              'Active Consent Grant and partner session required for internal notes.',
          });
          return;
        }
        const data = (await res.json()) as { note?: PartnerInternalNote };
        if (data.note) {
          setPartnerInternalNotes((prev) => [
            data.note!,
            ...prev.filter((item) => item.id !== data.note!.id),
          ]);
        }
        announcePolite('Private internal partner team note saved.');
        setGlobalToast({
          id: `partner-internal-ok-${Date.now()}`,
          variant: 'synced',
          title: 'Internal Team Note Saved',
          message: `Private note saved for ${input.consentId}. Never shared with the applicant.`,
        });
      } catch {
        const fallbackNote: PartnerInternalNote = {
          id: `pnote_local_${Date.now()}`,
          consentId: input.consentId,
          talentAlias:
            consentGrants.find((g) => g.consentId === input.consentId)?.talentAlias ??
            'Skilled Applicant',
          authorOrgId: activeAuthSession.claims.orgId,
          authorOrgName: activeAuthSession.claims.orgName,
          authorLabel: activeAuthSession.claims.workEmail || activeAuthSession.claims.orgName,
          category: input.category,
          body: input.body,
          visibility: 'partner_internal_only',
          createdAtIso: new Date().toISOString(),
        };
        setPartnerInternalNotes((prev) => [fallbackNote, ...prev]);
        announcePolite('Internal team note saved locally.');
      }
    },
    [activeAuthSession, announcePolite, consentGrants]
  );

  const handleDeletePartnerInternalNote = useCallback(
    async (noteId: string) => {
      if (activeAuthSession?.realm !== 'partner') return;
      setPartnerInternalNotes((prev) => prev.filter((item) => item.id !== noteId));
      const headers: Record<string, string> = {
        'X-Requested-With': 'VukaNaAmana',
      };
      if (activeAuthSession.token) {
        headers.Authorization = `Bearer ${activeAuthSession.token}`;
      }
      try {
        await fetch(`/api/partner/verification/internal-note/${encodeURIComponent(noteId)}`, {
          method: 'DELETE',
          credentials: 'same-origin',
          headers,
        });
        announcePolite('Internal team note removed.');
      } catch {
        // Local optimistic removal preserved
      }
    },
    [activeAuthSession, announcePolite]
  );

  useEffect(() => {
    if (activeAuthSession?.realm !== 'partner') {
      setPartnerInternalNotes([]);
    }
  }, [activeAuthSession?.realm]);

  useEffect(() => {
    void fetchPartnerSprints();
  }, [fetchPartnerSprints]);

  const handleRevokeGrant = async (consentId: string) => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Requested-With': 'VukaNaAmana',
      };
      if (activeAuthSession?.token) {
        headers.Authorization = `Bearer ${activeAuthSession.token}`;
      }
      const res = await fetch('/api/consent/revoke', {
        method: 'POST',
        credentials: 'same-origin',
        headers,
        body: JSON.stringify({ consentId }),
      });
      if (res.ok) {
        await fetchGrantsAndLogs();
        announcePolite('Consent Grant revoked. Partner visibility removed immediately.');
        setGlobalToast({
          id: `revoke-${Date.now()}`,
          variant: 'synced',
          title: 'Consent Revoked',
          message: `Access grant (${consentId}) successfully revoked. Partner visibility removed immediately.`,
        });
      }
    } catch {
      setConsentGrants((prev) =>
        prev.map((g) =>
          g.consentId === consentId
            ? { ...g, status: 'revoked', revokedAtIso: new Date().toISOString() }
            : g
        )
      );
      announcePolite('Consent Grant revoked locally.');
    }
  };

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{
    percent: number;
    completed: number;
    total: number;
  }>({ percent: 0, completed: 0, total: 0 });
  const [emailVaultStatus, setEmailVaultStatus] = useState<EmailVaultSyncStatus | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem('vuka.emailVaultStatus');
      return raw ? (JSON.parse(raw) as EmailVaultSyncStatus) : null;
    } catch {
      return null;
    }
  });
  const [globalToast, setGlobalToast] = useState<{
    id: string;
    variant: 'offline' | 'syncing' | 'synced';
    title: string;
    message: string;
  } | null>(null);

  const isOnline = useOnlineStatus();
  const prevOnlineRef = useRef<boolean>(isOnline);
  const offlinePeakQueueRef = useRef<number>(offlineQueue.length);

  useEffect(() => {
    if (!isOnline) {
      offlinePeakQueueRef.current = Math.max(offlinePeakQueueRef.current, offlineQueue.length);
    }
  }, [isOnline, offlineQueue.length]);

  useEffect(() => {
    const prevOnline = prevOnlineRef.current;
    prevOnlineRef.current = isOnline;

    if (prevOnline && !isOnline) {
      setGlobalToast({
        id: `offline-${Date.now()}`,
        variant: 'offline',
        title: 'Offline Mode Active · Local Queue On',
        message:
          'Connection lost — your updates are safely queued locally and will sync to Firebase automatically once back online.',
      });
      return;
    }

    if (!prevOnline && isOnline) {
      const pendingCount = Math.max(offlinePeakQueueRef.current, offlineQueue.length);
      offlinePeakQueueRef.current = 0;

      if (authUser) {
        setGlobalToast({
          id: `syncing-${Date.now()}`,
          variant: 'syncing',
          title: 'Back Online · Syncing to Firebase',
          message:
            pendingCount > 0
              ? `Syncing ${pendingCount} queued local update${pendingCount === 1 ? '' : 's'} to your Firebase workspace…`
              : 'Connection restored — verifying latest records with the Firebase backend…',
        });
      } else {
        setGlobalToast({
          id: `synced-${Date.now()}`,
          variant: 'synced',
          title: 'Back Online · Ready for Firebase Sync',
          message:
            pendingCount > 0
              ? `Connection restored with ${pendingCount} queued update${pendingCount === 1 ? '' : 's'} saved locally — sign in anytime to sync with Firebase.`
              : 'Connection restored — your local Proof Ledger is up to date and ready to sync with Firebase.',
        });
      }
    }
  }, [isOnline, authUser, offlineQueue.length]);

  // Auto-dismiss non-syncing global toasts after 6.5s
  useEffect(() => {
    if (!globalToast || globalToast.variant === 'syncing') return;
    const timer = window.setTimeout(() => setGlobalToast(null), 6500);
    return () => window.clearTimeout(timer);
  }, [globalToast]);

  const localeMeta = getLocaleMeta(profile.preferredLocale);
  const t = TRANSLATIONS[profile.preferredLocale] ?? TRANSLATIONS.en;

  const isCustomAccessComfort = hasCustomAccessComfort(accessPrefs);
  const readAloud = useReadAloud(localeMeta.speechLang, accessPrefs.readAloudRate);

  const handleUpdateAccessPrefs = useCallback((next: AccessComfortPreferences) => {
    setAccessPrefs(next);
    saveAccessComfortPreferences(next);
    applyAccessComfortToDocument(next);
  }, []);

  const handleResetAccessPrefs = useCallback(() => {
    readAloud.stop();
    const defaults = getDefaultAccessComfortPreferences();
    setAccessPrefs(defaults);
    saveAccessComfortPreferences(defaults);
    applyAccessComfortToDocument(defaults);
  }, [readAloud]);

  // Apply Access & Comfort preferences to <html> on mount and change
  useEffect(() => {
    applyAccessComfortToDocument(accessPrefs);
  }, [accessPrefs]);

  // Stop screen read-aloud cleanly when navigating between screens or tabs
  useEffect(() => {
    readAloud.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, activePortal, activeTab]);

  // Global Cmd+K / Ctrl+K and '/' App-Wide Search shortcuts (portal-aware: Builder stages stay hidden in Partner Console)
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsCommandPaletteOpen((open) => !open);
        return;
      }
      if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey) {
        const target = event.target as HTMLElement | null;
        const tag = target?.tagName?.toLowerCase();
        const isEditable =
          tag === 'input' ||
          tag === 'textarea' ||
          tag === 'select' ||
          Boolean(target?.isContentEditable);
        if (!isEditable) {
          event.preventDefault();
          setIsCommandPaletteOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Close Command Palette cleanly when switching portals so state starts fresh in the new realm
  useEffect(() => {
    setIsCommandPaletteOpen(false);
  }, [activePortal]);

  // Hydrate isolated Dual-Door HttpOnly cookie session on initial load
  useEffect(() => {
    let cancelled = false;
    const savedStudioView =
      typeof window !== 'undefined' && window.sessionStorage.getItem('vuka.viewMode') === 'studio';

    const hydrateDualDoorSession = async () => {
      try {
        const res = await fetch('/api/auth/session', { credentials: 'same-origin' });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          authenticated?: boolean;
          realm?: PortalRealm | null;
          sessionCookieName?: 'vna_talent_sid' | 'vna_partner_sid';
          token?: string;
          claims?: ActiveAuthSession['claims'];
        };
        if (data.authenticated && data.realm && data.token && data.claims && !cancelled) {
          const isValidTalent =
            data.realm === 'talent' &&
            (data.claims as TalentSessionClaims).twoFactorVerified === true;
          const isValidPartner = data.realm === 'partner';

          if (isValidTalent || isValidPartner) {
            const shouldResumeStudio =
              (isValidPartner && savedStudioView) ||
              (isValidTalent &&
                (savedStudioView ||
                  autostart ||
                  Boolean(incomingEndorseToken) ||
                  Boolean(incomingSprintId)));

            if (shouldResumeStudio) {
              const restored = {
                realm: data.realm,
                sessionCookieName: data.sessionCookieName,
                token: data.token,
                claims: data.claims,
              } as ActiveAuthSession;
              setActiveAuthSession(restored);
              setActivePortal(data.realm);
              if (isValidPartner) {
                setUnlockViewMode('partner');
                void fetchPartnerContracts(data.token);
              }
              void fetchGrantsAndLogs(data.token);
              void fetchPartnerVerificationState(data.token);
              void fetchPartnerSprints();
              setViewMode('studio');
              return;
            }

            // User is on the Landing Funnel (not resuming an active studio reload):
            // enforce mandatory lock-out so re-entering requires fresh authentication.
            try {
              await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Requested-With': 'VukaNaAmana',
                  Authorization: `Bearer ${data.token}`,
                },
              });
            } catch {
              // ignore network errors during landing lock-out
            }
            return;
          }
        }

        // Unauthenticated deep-link/autostart attempts must complete 2FA / Dedicated PIN first
        if (!cancelled && (autostart || Boolean(incomingEndorseToken) || Boolean(incomingSprintId))) {
          const targetTab: WorkspaceTab = incomingSprintId ? 'pulse' : 'verify';
          setPendingRedirectTab(targetTab);
          setDualDoorModal({
            isOpen: true,
            door: 'talent',
            pendingPayload: landingDraftRef.current,
            pendingTab: targetTab,
          });
        }
      } catch {
        // Offline or preview cold boot — remain protected on Landing Funnel
      } finally {
        if (!cancelled) {
          setAuthSessionChecked(true);
        }
      }
    };
    void hydrateDualDoorSession();
    return () => {
      cancelled = true;
    };
  }, [autostart, incomingEndorseToken, incomingSprintId]);

  // Track live Landing Funnel draft (selected Age Stage & problem statement) for seamless Search -> Tab 5 handoff
  const landingDraftRef = useRef<{ problemStatement: string; ageStage: AgeStage }>({
    problemStatement: profile.problemStatement,
    ageStage: profile.ageStage,
  });

  useEffect(() => {
    landingDraftRef.current = {
      problemStatement: profile.problemStatement,
      ageStage: profile.ageStage,
    };
  }, [profile.problemStatement, profile.ageStage]);

  // Persist active view/tab in sessionStorage (only after session hydration completes) and smoothly scroll to top
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('vuka.activeTab', activeTab);
      if (authSessionChecked) {
        if (viewMode === 'studio') {
          window.sessionStorage.setItem('vuka.viewMode', 'studio');
        } else {
          window.sessionStorage.removeItem('vuka.viewMode');
        }
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab, viewMode, authSessionChecked]);

  // Apply theme & RTL/language attributes to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (profile.themePreference === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.lang = localeMeta.code;
    root.dir = localeMeta.dir;

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute(
        'content',
        profile.themePreference === 'dark' ? '#121315' : '#FAF8F5'
      );
    }
  }, [profile.themePreference, localeMeta.code, localeMeta.dir]);

  const enqueueMutation = useCallback((mutation: OfflineMutation) => {
    setOfflineQueue((prev) => saveOfflineQueue([...prev, mutation]));
  }, []);

  const flushQueue = useCallback(
    async (user: User, queueSnapshot: OfflineMutation[], currentProfile: PractitionerProfile) => {
      if (!isOnline || !user.emailVerified) return;
      const totalSteps = Math.max(1, queueSnapshot.length + 1);
      setIsSyncing(true);
      setSyncProgress({ percent: 12, completed: 0, total: totalSteps });
      const maxAttempts = 3;
      let attempt = 0;
      let success = false;

      while (attempt < maxAttempts && !success && isOnline) {
        attempt++;
        try {
          await ensureCloudProfile(user.uid, currentProfile, user.email || currentProfile.email);
          let completedSteps = 1;
          setSyncProgress({
            percent: Math.round((completedSteps / totalSteps) * 100),
            completed: completedSteps,
            total: totalSteps,
          });

          for (const item of queueSnapshot) {
            if (item.kind === 'upsert_profile') {
              await ensureCloudProfile(user.uid, item.payload, user.email || item.payload.email);
            } else if (item.kind === 'upsert_capability') {
              await upsertCloudCapability(user.uid, item.payload);
            } else if (item.kind === 'delete_capability') {
              await deleteCloudCapability(user.uid, item.capabilityId);
            } else if (item.kind === 'upsert_contribution') {
              await upsertCloudContribution(user.uid, item.payload);
            } else if (item.kind === 'upsert_passport') {
              await upsertCloudPassport(user.uid, item.payload);
            } else if (item.kind === 'upsert_vault') {
              await upsertCloudVault(user.uid, item.payload);
            } else if (item.kind === 'upsert_endorsement') {
              await upsertCloudEndorsement(user.uid, item.payload);
            } else if (item.kind === 'delete_endorsement') {
              await deleteCloudEndorsement(user.uid, item.endorsementId);
            } else if (item.kind === 'upsert_payout') {
              await upsertCloudPayout(user.uid, item.payload);
            } else if (item.kind === 'upsert_sprint_feedback') {
              await upsertCloudSprintFeedback(user.uid, item.payload);
            } else if (item.kind === 'upsert_mentor_message') {
              await upsertCloudMentorMessage(user.uid, item.payload);
            } else if (item.kind === 'upsert_mentorship_session') {
              await upsertCloudMentorshipSession(user.uid, item.payload);
            } else if (item.kind === 'delete_mentorship_session') {
              await deleteCloudMentorshipSession(user.uid, item.sessionId);
            } else if (item.kind === 'upsert_mentor_pairing') {
              await upsertCloudMentorPairing(user.uid, item.payload);
            } else if (item.kind === 'delete_mentor_pairing') {
              await deleteCloudMentorPairing(user.uid, item.pairingId);
            } else if (item.kind === 'upsert_mentor_rating') {
              await upsertCloudMentorRating(user.uid, item.payload);
            } else if (item.kind === 'delete_mentor_rating') {
              await deleteCloudMentorRating(user.uid, item.ratingId);
            } else if (item.kind === 'upsert_track_progress') {
              await upsertCloudMentorshipTrackProgress(user.uid, item.payload);
            } else if (item.kind === 'upsert_collaboration_note') {
              await upsertCloudCollaborationNote(user.uid, item.payload);
            } else if (item.kind === 'delete_collaboration_note') {
              await deleteCloudCollaborationNote(user.uid, item.noteId);
            } else if (item.kind === 'upsert_mentorship_journal') {
              await upsertCloudMentorshipJournalEntry(user.uid, item.payload);
            } else if (item.kind === 'delete_mentorship_journal') {
              await deleteCloudMentorshipJournalEntry(user.uid, item.entryId);
            } else if (item.kind === 'upsert_sprint_discussion') {
              await upsertCloudSprintDiscussionPost(user.uid, item.payload);
            } else if (item.kind === 'delete_sprint_discussion') {
              await deleteCloudSprintDiscussionPost(item.sprintId, item.postId);
            } else if (item.kind === 'upsert_mentee_badge') {
              await upsertCloudMenteeCompetencyBadge(user.uid, item.payload);
            } else if (item.kind === 'delete_mentee_badge') {
              await deleteCloudMenteeCompetencyBadge(user.uid, item.badgeId);
            } else if (item.kind === 'upsert_milestone_feedback') {
              await upsertCloudMentorMilestoneFeedback(user.uid, item.payload);
            } else if (item.kind === 'delete_milestone_feedback') {
              await deleteCloudMentorMilestoneFeedback(user.uid, item.feedbackId);
            } else if (item.kind === 'upsert_session_agenda') {
              await upsertCloudMentorshipSessionAgenda(user.uid, item.payload);
            } else if (item.kind === 'delete_session_agenda') {
              await deleteCloudMentorshipSessionAgenda(user.uid, item.agendaId);
            } else if (item.kind === 'upsert_mentor_peer_review') {
              await upsertCloudMentorPeerReview(user.uid, item.payload);
            } else if (item.kind === 'delete_mentor_peer_review') {
              await deleteCloudMentorPeerReview(user.uid, item.reviewId);
            }
            completedSteps += 1;
            setSyncProgress({
              percent: Math.round((completedSteps / totalSteps) * 100),
              completed: completedSteps,
              total: totalSteps,
            });
          }

          success = true;
          const syncedCount = queueSnapshot.length;
          const nowIso = new Date().toISOString();
          setSyncProgress({ percent: 100, completed: totalSteps, total: totalSteps });
          setOfflineQueue(saveOfflineQueue([]));
          setLastSyncedIso(nowIso);
          saveLastSyncedIso(nowIso);

          setGlobalToast((prev) => {
            if (syncedCount > 0 || prev?.variant === 'syncing') {
              return {
                id: `firebase-synced-${Date.now()}`,
                variant: 'synced',
                title: 'Synced to Firebase Cloud',
                message:
                  syncedCount > 0
                    ? `Your offline queue (${syncedCount} update${syncedCount === 1 ? '' : 's'}) has been successfully synced to the Firebase backend (Attempt ${attempt}).`
                    : 'Connection restored — your workspace is synced with the Firebase backend.',
              };
            }
            return prev;
          });
        } catch (err) {
          if (attempt >= maxAttempts) {
            setIsSyncing(false);
            setSyncProgress({ percent: 0, completed: 0, total: 0 });
            setGlobalToast({
              id: `sync-retry-failed-${Date.now()}`,
              variant: 'offline',
              title: 'Sync Retry-Backoff Notice',
              message: `Sync attempt ${attempt} failed. Local changes remain safely queued in PWA offline storage and will retry automatically.`,
            });
            throw err;
          }
          const delayMs = attempt * 1000 * 2;
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
      setIsSyncing(false);
    },
    [isOnline]
  );

  // Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Hydrate and subscribe when authenticated + emailVerified + online
  useEffect(() => {
    if (!authReady || !authUser || !authUser.emailVerified || !isOnline) return;

    let unsubCaps: (() => void) | undefined;
    let unsubContribs: (() => void) | undefined;
    let cancelled = false;

    const syncAndSubscribe = async () => {
      try {
        await flushQueue(authUser, offlineQueue, profile);
        const cloud = await fetchCloudWorkspace(authUser.uid);
        if (cancelled) return;

        if (cloud.profile) {
          setProfile((prev) => {
            const merged: PractitionerProfile = {
              ...prev,
              uid: authUser.uid,
              email: authUser.email || prev.email,
              displayName: cloud.profile?.displayName || prev.displayName,
              problemStatement: cloud.profile?.problemStatement || prev.problemStatement,
              ageStage: cloud.profile?.ageStage
                ? normalizeAgeStage(cloud.profile.ageStage)
                : prev.ageStage,
              preferredLocale: cloud.profile?.preferredLocale
                ? normalizeLocale(cloud.profile.preferredLocale)
                : prev.preferredLocale,
              themePreference:
                cloud.profile?.themePreference === 'dark' || cloud.profile?.themePreference === 'light'
                  ? cloud.profile.themePreference
                  : prev.themePreference,
              onboarded: prev.onboarded || Boolean(cloud.profile?.problemStatement),
            };
            saveLocalProfile(merged);
            return merged;
          });
        }

        if (cloud.vault) {
          setVault(cloud.vault);
          saveLocalVault(cloud.vault);
        }

        if (cloud.endorsements.length > 0) {
          setEndorsements(cloud.endorsements);
          saveLocalEndorsements(cloud.endorsements);
        }

        if (cloud.payouts.length > 0) {
          setPayouts(cloud.payouts);
          saveLocalPayouts(cloud.payouts);
        }

        if (cloud.sprintFeedback.length > 0) {
          setSprintFeedback(cloud.sprintFeedback);
          saveLocalSprintFeedback(cloud.sprintFeedback);
        }

        if (cloud.mentorMessages.length > 0) {
          setMentorMessages(cloud.mentorMessages);
          saveLocalMentorMessages(cloud.mentorMessages);
        }

        if (cloud.mentorshipSessions.length > 0) {
          setMentorshipSessions(cloud.mentorshipSessions);
          saveLocalMentorshipSessions(cloud.mentorshipSessions);
        }

        if (cloud.mentorPairings.length > 0) {
          setMentorPairings(cloud.mentorPairings);
          saveLocalMentorPairings(cloud.mentorPairings);
        }

        if (cloud.mentorRatings.length > 0) {
          setMentorRatings(cloud.mentorRatings);
          saveLocalMentorRatings(cloud.mentorRatings);
        }

        if (cloud.mentorshipTrackProgress.length > 0) {
          setMentorshipTrackProgress(cloud.mentorshipTrackProgress);
          saveLocalMentorshipTrackProgress(cloud.mentorshipTrackProgress);
        }

        if (cloud.collaborationNotes.length > 0) {
          setCollaborationNotes(cloud.collaborationNotes);
          saveLocalCollaborationNotes(cloud.collaborationNotes);
        }

        if (cloud.mentorshipJournal.length > 0) {
          setMentorshipJournal(cloud.mentorshipJournal);
          saveLocalMentorshipJournal(cloud.mentorshipJournal);
        }

        if (cloud.menteeCompetencyBadges.length > 0) {
          setMenteeCompetencyBadges(cloud.menteeCompetencyBadges);
          saveLocalMenteeCompetencyBadges(cloud.menteeCompetencyBadges);
        }

        if (cloud.mentorMilestoneFeedback.length > 0) {
          setMentorMilestoneFeedback(cloud.mentorMilestoneFeedback);
          saveLocalMentorMilestoneFeedback(cloud.mentorMilestoneFeedback);
        }

        if (cloud.mentorshipSessionAgendas.length > 0) {
          setMentorshipSessionAgendas(cloud.mentorshipSessionAgendas);
          saveLocalMentorshipSessionAgendas(cloud.mentorshipSessionAgendas);
        }

        if (cloud.mentorPeerReviews.length > 0) {
          setMentorPeerReviews(cloud.mentorPeerReviews);
          saveLocalMentorPeerReviews(cloud.mentorPeerReviews);
        }

        unsubCaps = subscribeToCapabilities(authUser.uid, (cloudCaps) => {
          if (cloudCaps.length > 0) {
            setCapabilities(cloudCaps);
            saveLocalCapabilities(cloudCaps);
          }
        });

        unsubContribs = subscribeToContributions(authUser.uid, (cloudContribs) => {
          if (cloudContribs.length > 0) {
            setContributions(cloudContribs);
            saveLocalContributions(cloudContribs);
          }
        });
      } catch (err) {
        console.error('Workspace sync deferred:', err);
      }
    };

    void syncAndSubscribe();

    return () => {
      cancelled = true;
      unsubCaps?.();
      unsubContribs?.();
    };
    // Only re-subscribe when auth state or connectivity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, authUser?.uid, authUser?.emailVerified, isOnline]);

  const contributionSprintIdsKey = Array.from(
    new Set(contributions.map((c) => c.briefId).filter(Boolean))
  )
    .sort()
    .join(',');

  // Real-time subscription for shared Pod Discussion Boards across practitioner's sprints
  useEffect(() => {
    if (!authReady || !authUser || !authUser.emailVerified || !isOnline) return;
    if (!contributionSprintIdsKey) return;

    const sprintIds = contributionSprintIdsKey.split(',').filter(Boolean);
    const unsubs = sprintIds.map((sprintId) =>
      subscribeToSprintDiscussions(sprintId, (cloudPosts) => {
        setSprintDiscussions((prev) => {
          const otherSprints = prev.filter((p) => p.sprintId !== sprintId);
          const merged = [...otherSprints, ...cloudPosts];
          saveLocalSprintDiscussions(merged);
          return merged;
        });
      })
    );

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [authReady, authUser, isOnline, contributionSprintIdsKey]);

  const canWriteCloud = Boolean(authUser && authUser.emailVerified && isOnline);

  const finalizeSignedInUser = async (user: User, fallbackDisplayName?: string) => {
    setAuthUser(user);
    const updatedProfile: PractitionerProfile = {
      ...profile,
      uid: user.uid,
      email: user.email || profile.email,
      displayName:
        profile.displayName === 'Practitioner'
          ? user.displayName || fallbackDisplayName || profile.displayName
          : profile.displayName,
      updatedAtIso: new Date().toISOString(),
    };
    setProfile(updatedProfile);
    saveLocalProfile(updatedProfile);
    if (user.emailVerified) {
      await flushQueue(user, offlineQueue, updatedProfile);
    }
  };

  const handleOpenAccountSync = () => {
    setAuthError(null);
    setIsAccountSyncOpen(true);
  };

  const handleProviderSignIn = async (provider: 'google' | 'microsoft' | 'yahoo') => {
    setAuthError(null);
    try {
      const user =
        provider === 'google'
          ? await signInWithGoogle()
          : provider === 'microsoft'
            ? await signInWithMicrosoft()
            : await signInWithYahoo();
      await finalizeSignedInUser(user);
    } catch (err) {
      const message = formatFirebaseAuthError(err);
      setAuthError(message);
      throw new Error(message);
    }
  };

  const handleEmailSignIn = async (email: string, password: string) => {
    setAuthError(null);
    try {
      const user = await signInWithEmailPassword(email, password);
      await finalizeSignedInUser(user);
    } catch (err) {
      const message = formatFirebaseAuthError(err);
      setAuthError(message);
      throw new Error(message);
    }
  };

  const handleEmailRegister = async (email: string, password: string, displayName: string) => {
    setAuthError(null);
    try {
      const user = await registerWithEmailPassword(email, password, displayName);
      await finalizeSignedInUser(user, displayName);
    } catch (err) {
      const message = formatFirebaseAuthError(err);
      setAuthError(message);
      throw new Error(message);
    }
  };

  const handleSendPasswordReset = async (email: string) => {
    setAuthError(null);
    try {
      await sendPasswordReset(email);
    } catch (err) {
      const message = formatFirebaseAuthError(err);
      setAuthError(message);
      throw new Error(message);
    }
  };

  const handleResendVerification = async () => {
    setAuthError(null);
    if (!authUser) return;
    try {
      await resendVerificationEmail();
    } catch (err) {
      const message = formatFirebaseAuthError(err);
      setAuthError(message);
      throw new Error(message);
    }
  };

  const handleRefreshVerificationAndSync = async () => {
    setAuthError(null);
    if (!authUser) return;
    try {
      const refreshed = await refreshAuthUser();
      setAuthUser(refreshed);
      if (refreshed && refreshed.emailVerified) {
        await flushQueue(refreshed, offlineQueue, profile);
      } else {
        throw new Error(
          'Your email is not verified yet. Please click the verification link in your inbox and try again.'
        );
      }
    } catch (err) {
      const message = formatFirebaseAuthError(err);
      setAuthError(message);
      throw new Error(message);
    }
  };

  const handleLinkProvider = async (provider: 'google' | 'microsoft' | 'yahoo') => {
    setAuthError(null);
    if (!authUser) return;
    try {
      const updatedUser = await linkAccountProvider(provider);
      setAuthUser(updatedUser);
      await flushQueue(updatedUser, offlineQueue, profile);
    } catch (err) {
      const message = formatFirebaseAuthError(err);
      setAuthError(message);
      throw new Error(message);
    }
  };

  const handleSignOut = async () => {
    await signOutAccount();
    setAuthUser(null);
    setEmailVaultStatus(null);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('vuka.emailVaultStatus');
    }
  };

  const handleSyncToEmailVault = async (
    targetEmail: string,
    targetDisplayName: string,
    providerLabel = 'email-vault'
  ): Promise<EmailVaultSyncStatus> => {
    const cleanEmail = targetEmail.trim().toLowerCase();
    const cleanName = targetDisplayName.trim() || profile.displayName || cleanEmail.split('@')[0];

    setIsSyncing(true);
    setSyncProgress({ percent: 30, completed: 0, total: Math.max(1, offlineQueue.length) });
    try {
      const updatedProfile: PractitionerProfile = {
        ...profile,
        email: cleanEmail,
        displayName: cleanName,
        updatedAtIso: new Date().toISOString(),
      };
      setProfile(updatedProfile);
      saveLocalProfile(updatedProfile);

      let consentToken = `VNA-CONSENT-${cleanEmail.slice(0, 4).toUpperCase()}2026`;
      let updatedAtIso = new Date().toISOString();

      if (isOnline && activePortal === 'talent') {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-Requested-With': 'VukaNaAmana',
        };
        if (activeAuthSession?.realm === 'talent' && activeAuthSession.token) {
          headers.Authorization = `Bearer ${activeAuthSession.token}`;
        }
        const res = await fetch('/api/sync/email-vault', {
          method: 'POST',
          credentials: 'same-origin',
          headers,
          body: JSON.stringify({
            email: cleanEmail,
            displayName: cleanName,
            provider: providerLabel,
            payload: {
              profile: updatedProfile,
              capabilities,
              contributions,
              passport,
              vault,
              endorsements,
              payouts,
              proofPortfolio,
              sprintFeedback,
              mentorshipSessions,
              mentorPairings,
              mentorRatings,
              mentorshipTrackProgress,
              collaborationNotes,
              mentorshipJournal,
              sprintDiscussions,
              menteeCompetencyBadges,
              mentorMilestoneFeedback,
              mentorshipSessionAgendas,
              mentorPeerReviews,
            },
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as {
            consentToken?: string;
            updatedAtIso?: string;
          };
          if (data.consentToken) consentToken = data.consentToken;
          if (data.updatedAtIso) updatedAtIso = data.updatedAtIso;
        }
      }

      const statusRecord: EmailVaultSyncStatus = {
        email: cleanEmail,
        displayName: cleanName,
        provider: providerLabel,
        consentToken,
        updatedAtIso,
      };

      setEmailVaultStatus(statusRecord);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('vuka.emailVaultStatus', JSON.stringify(statusRecord));
      }

      setSyncProgress({
        percent: 100,
        completed: Math.max(1, offlineQueue.length),
        total: Math.max(1, offlineQueue.length),
      });
      setOfflineQueue(saveOfflineQueue([]));
      setLastSyncedIso(updatedAtIso);
      saveLastSyncedIso(updatedAtIso);

      setGlobalToast({
        id: `email-vault-synced-${Date.now()}`,
        variant: 'synced',
        title: 'Personal Data Stored & Synced to Email',
        message: `Workspace records for ${cleanEmail} are safely stored with Zero-Raw-ID protection (${consentToken}).`,
      });

      return statusRecord;
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestoreFromEmailVault = async (targetEmail: string): Promise<boolean> => {
    const cleanEmail = targetEmail.trim().toLowerCase();
    if (!cleanEmail || !isOnline) return false;

    setIsSyncing(true);
    try {
      const headers: Record<string, string> = {};
      if (activeAuthSession?.realm === 'talent' && activeAuthSession.token) {
        headers.Authorization = `Bearer ${activeAuthSession.token}`;
      }
      const res = await fetch(`/api/sync/email-vault?email=${encodeURIComponent(cleanEmail)}`, {
        credentials: 'same-origin',
        headers,
      });
      if (!res.ok) return false;

      const data = (await res.json()) as {
        found?: boolean;
        record?: {
          normalizedEmail: string;
          displayName: string;
          provider: string;
          consentToken: string;
          updatedAtIso: string;
          payload?: {
            profile?: PractitionerProfile;
            capabilities?: SkillCapability[];
            contributions?: BriefSubmission[];
            passport?: CompetencyPassport | null;
            vault?: WorkReadyVault;
            endorsements?: PeerEndorsement[];
            payouts?: ContractPayout[];
            proofPortfolio?: LivingProofPortfolio;
            sprintFeedback?: SprintFeedback[];
            mentorshipSessions?: MentorshipSession[];
            mentorPairings?: MentorPairingRequest[];
            mentorRatings?: MentorRating[];
            mentorshipTrackProgress?: MentorshipTrackProgressRecord[];
            collaborationNotes?: SprintCollaborationNote[];
            mentorshipJournal?: MentorshipJournalEntry[];
            sprintDiscussions?: SprintDiscussionPost[];
            menteeCompetencyBadges?: MenteeCompetencyBadge[];
            mentorMilestoneFeedback?: MentorMilestoneFeedback[];
            mentorshipSessionAgendas?: MentorshipSessionAgendaRecord[];
            mentorPeerReviews?: MentorPeerReviewRecord[];
          };
        };
      };

      if (!data.found || !data.record) return false;
      const snap = data.record.payload || {};

      if (snap.profile) {
        setProfile(snap.profile);
        saveLocalProfile(snap.profile);
      }
      if (Array.isArray(snap.capabilities) && snap.capabilities.length > 0) {
        setCapabilities(snap.capabilities);
        saveLocalCapabilities(snap.capabilities);
      }
      if (Array.isArray(snap.contributions) && snap.contributions.length > 0) {
        setContributions(snap.contributions);
        saveLocalContributions(snap.contributions);
      }
      if (snap.passport) {
        setPassport(snap.passport);
        saveLocalPassport(snap.passport);
      }
      if (snap.vault) {
        setVault(snap.vault);
        saveLocalVault(snap.vault);
      }
      if (Array.isArray(snap.endorsements) && snap.endorsements.length > 0) {
        setEndorsements(snap.endorsements);
        saveLocalEndorsements(snap.endorsements);
      }
      if (Array.isArray(snap.payouts) && snap.payouts.length > 0) {
        setPayouts(snap.payouts);
        saveLocalPayouts(snap.payouts);
      }
      if (snap.proofPortfolio) {
        setProofPortfolio(snap.proofPortfolio);
        saveLocalProofPortfolio(snap.proofPortfolio);
      }
      if (Array.isArray(snap.sprintFeedback) && snap.sprintFeedback.length > 0) {
        setSprintFeedback(snap.sprintFeedback);
        saveLocalSprintFeedback(snap.sprintFeedback);
      }
      if (Array.isArray(snap.mentorshipSessions) && snap.mentorshipSessions.length > 0) {
        setMentorshipSessions(snap.mentorshipSessions);
        saveLocalMentorshipSessions(snap.mentorshipSessions);
      }
      if (Array.isArray(snap.mentorPairings) && snap.mentorPairings.length > 0) {
        setMentorPairings(snap.mentorPairings);
        saveLocalMentorPairings(snap.mentorPairings);
      }
      if (Array.isArray(snap.mentorRatings) && snap.mentorRatings.length > 0) {
        setMentorRatings(snap.mentorRatings);
        saveLocalMentorRatings(snap.mentorRatings);
      }
      if (Array.isArray(snap.mentorshipTrackProgress) && snap.mentorshipTrackProgress.length > 0) {
        setMentorshipTrackProgress(snap.mentorshipTrackProgress);
        saveLocalMentorshipTrackProgress(snap.mentorshipTrackProgress);
      }
      if (Array.isArray(snap.collaborationNotes) && snap.collaborationNotes.length > 0) {
        setCollaborationNotes(snap.collaborationNotes);
        saveLocalCollaborationNotes(snap.collaborationNotes);
      }
      if (Array.isArray(snap.mentorshipJournal) && snap.mentorshipJournal.length > 0) {
        setMentorshipJournal(snap.mentorshipJournal);
        saveLocalMentorshipJournal(snap.mentorshipJournal);
      }
      if (Array.isArray(snap.sprintDiscussions) && snap.sprintDiscussions.length > 0) {
        setSprintDiscussions(snap.sprintDiscussions);
        saveLocalSprintDiscussions(snap.sprintDiscussions);
      }
      if (Array.isArray(snap.menteeCompetencyBadges) && snap.menteeCompetencyBadges.length > 0) {
        setMenteeCompetencyBadges(snap.menteeCompetencyBadges);
        saveLocalMenteeCompetencyBadges(snap.menteeCompetencyBadges);
      }
      if (Array.isArray(snap.mentorMilestoneFeedback) && snap.mentorMilestoneFeedback.length > 0) {
        setMentorMilestoneFeedback(snap.mentorMilestoneFeedback);
        saveLocalMentorMilestoneFeedback(snap.mentorMilestoneFeedback);
      }
      if (
        Array.isArray(snap.mentorshipSessionAgendas) &&
        snap.mentorshipSessionAgendas.length > 0
      ) {
        setMentorshipSessionAgendas(snap.mentorshipSessionAgendas);
        saveLocalMentorshipSessionAgendas(snap.mentorshipSessionAgendas);
      }
      if (Array.isArray(snap.mentorPeerReviews) && snap.mentorPeerReviews.length > 0) {
        setMentorPeerReviews(snap.mentorPeerReviews);
        saveLocalMentorPeerReviews(snap.mentorPeerReviews);
      }

      const statusRecord: EmailVaultSyncStatus = {
        email: data.record.normalizedEmail,
        displayName: data.record.displayName,
        provider: data.record.provider,
        consentToken: data.record.consentToken,
        updatedAtIso: data.record.updatedAtIso,
      };
      setEmailVaultStatus(statusRecord);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('vuka.emailVaultStatus', JSON.stringify(statusRecord));
      }
      setLastSyncedIso(data.record.updatedAtIso);
      saveLastSyncedIso(data.record.updatedAtIso);

      setGlobalToast({
        id: `email-vault-restored-${Date.now()}`,
        variant: 'synced',
        title: 'Workspace Restored from Email Vault',
        message: `Restored personal competency passport, portfolio, and progress for ${data.record.normalizedEmail}.`,
      });
      return true;
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncNow = async () => {
    const activeEmail = authUser?.email || emailVaultStatus?.email || profile.email;
    if (!isOnline) {
      setGlobalToast({
        id: `offline-pwa-saved-${Date.now()}`,
        variant: 'offline',
        title: 'Saved to Offline PWA Queue',
        message: `All ${offlineQueue.length} local update(s) are cached in your Offline PWA store and will sync automatically when online.`,
      });
      return;
    }

    if (authUser && authUser.emailVerified) {
      await flushQueue(authUser, offlineQueue, profile);
      if (authUser.email) {
        await handleSyncToEmailVault(
          authUser.email,
          authUser.displayName || profile.displayName,
          'firebase-verified'
        );
      }
      return;
    }

    if (activeEmail && activeEmail.includes('@')) {
      await handleSyncToEmailVault(
        activeEmail,
        authUser?.displayName || emailVaultStatus?.displayName || profile.displayName,
        emailVaultStatus?.provider || 'email-vault'
      );
      return;
    }

    // Even before an email is linked, flush local PWA queue timestamp and offer email backup
    const nowIso = new Date().toISOString();
    setOfflineQueue(saveOfflineQueue([]));
    setLastSyncedIso(nowIso);
    saveLastSyncedIso(nowIso);
    setGlobalToast({
      id: `pwa-local-synced-${Date.now()}`,
      variant: 'synced',
      title: 'PWA Local Queue Verified & Synced',
      message:
        'Your workspace is safely persisted in local PWA storage. Connect an email anytime to back up across devices.',
    });
  };

  const updateProfileState = (next: PractitionerProfile) => {
    setProfile(next);
    saveLocalProfile(next);
    const mut: OfflineMutation = {
      id: makeSafeId('mut'),
      kind: 'upsert_profile',
      payload: next,
      queuedAtIso: new Date().toISOString(),
    };
    if (canWriteCloud && authUser) {
      void ensureCloudProfile(authUser.uid, next, authUser.email || next.email).then(() => {
        const nowIso = new Date().toISOString();
        setLastSyncedIso(nowIso);
        saveLastSyncedIso(nowIso);
      });
    } else {
      enqueueMutation(mut);
    }
  };

  const handleLandingHandoff = (
    payload: { problemStatement: string; ageStage: AgeStage },
    targetTab: WorkspaceTab,
    targetUnlockMode: UnlockViewMode = 'talent'
  ) => {
    const trimmedProblem = payload.problemStatement.trim();
    const next: PractitionerProfile = {
      ...profile,
      problemStatement: trimmedProblem || profile.problemStatement,
      ageStage: payload.ageStage,
      onboarded: true,
      updatedAtIso: new Date().toISOString(),
    };
    updateProfileState(next);
    if (targetTab === 'unlock') {
      setUnlockViewMode(targetUnlockMode);
    }
    setActivePortal(targetUnlockMode === 'partner' ? 'partner' : 'talent');
    setActiveTab(targetTab);
    setViewMode('studio');
  };

  const isBuilderTwoFactorVerified = Boolean(
    activeAuthSession?.realm === 'talent' && activeAuthSession.claims.twoFactorVerified === true
  );

  // Mandatory session lock-out & termination whenever returning to the Landing Funnel
  // from ANY exit point (logo, header, Command Palette, sign-out button, or #landing hash).
  const handleLockAndExitToLanding = useCallback(
    async (_source?: string, details?: EndSessionDetails) => {
      const previousRealm = activeAuthSession?.realm ?? activePortal;
      const hadActiveSession = Boolean(activeAuthSession) || viewMode === 'studio';
      const tokenToRevoke = activeAuthSession?.token;

      // Immediately terminate in-memory session state and navigate to Landing Funnel
      setActiveAuthSession(null);
      setPendingRedirectTab(null);
      pendingPostAuthActionRef.current = null;
      setIsCommandPaletteOpen(false);
      setDualDoorModal((prev) => ({ ...prev, isOpen: false }));
      setActivePortal('talent');
      setUnlockViewMode('talent');
      setViewMode('landing');

      if (typeof window !== 'undefined') {
        try {
          window.sessionStorage.removeItem('vuka.viewMode');
        } catch {
          // ignore storage errors
        }
        if (window.location.hash) {
          window.history.replaceState(
            null,
            '',
            `${window.location.pathname}${window.location.search}`
          );
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'VukaNaAmana',
            ...(tokenToRevoke ? { Authorization: `Bearer ${tokenToRevoke}` } : {}),
          },
        });
      } catch {
        // Offline fallback: local session state is already completely wiped above
      }

      if (hadActiveSession) {
        const portalLabel = previousRealm === 'partner' ? 'Partner Console' : 'Builder Studio';
        const reasonSuffix = details?.reasonLabel ? ` Reason: ${details.reasonLabel}.` : '';
        const noteSuffix = details?.note ? ` Saved note: "${details.note}"` : '';
        announcePolite('Session locked and ended. Returned to Landing Funnel.');
        setGlobalToast({
          id: `portal-locked-landing-${Date.now()}`,
          variant: 'synced',
          title: 'Session Locked & Ended',
          message: `Your isolated ${portalLabel} session has been locked upon returning to the Landing Funnel.${reasonSuffix}${noteSuffix} Re-authenticate to re-enter.`,
        });
      }
    },
    [activeAuthSession, activePortal, viewMode, announcePolite]
  );

  // Central security route guard for all 5 Builder stages (Tabs 1-5):
  // Enforces twoFactorVerified before entering or switching between private Builder stages.
  const navigateBuilderTab = useCallback(
    (
      tab: WorkspaceTab,
      options?: {
        fromLandingPayload?: { problemStatement: string; ageStage: AgeStage };
        postAction?: () => void;
      }
    ) => {
      if (!isBuilderTwoFactorVerified) {
        setPendingRedirectTab(tab);
        pendingPostAuthActionRef.current = options?.postAction ?? null;
        setDualDoorModal({
          isOpen: true,
          door: 'talent',
          pendingPayload: options?.fromLandingPayload ?? landingDraftRef.current,
          pendingTab: tab,
        });
        return;
      }

      setPendingRedirectTab(null);
      if (viewMode === 'landing' || options?.fromLandingPayload) {
        handleLandingHandoff(
          options?.fromLandingPayload ?? landingDraftRef.current,
          tab,
          'talent'
        );
      } else {
        setActivePortal('talent');
        setViewMode('studio');
        setActiveTab(tab);
      }
      const tabAnnouncements: Record<WorkspaceTab, string> = {
        verify: 'Stage 1 Verify opened.',
        unlock: 'Stage 2 Unlock opened.',
        solve: 'Stage 3 Solve opened.',
        pulse: 'Stage 4 Pulse opened.',
        cleared: 'Tab 5 Cleared opened.',
      };
      if (tab === 'unlock') {
        void fetchGrantsAndLogs();
        void fetchPartnerVerificationState();
      }
      announcePolite(tabAnnouncements[tab]);
      options?.postAction?.();
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isBuilderTwoFactorVerified, viewMode, profile, announcePolite]
  );

  // Guard direct URL hash attempts (e.g., #verify, #unlock, #solve, #pulse, #cleared, #landing)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const parseHashTab = (): WorkspaceTab | 'landing' | null => {
      const h = window.location.hash.replace(/^#/, '').trim().toLowerCase();
      if (h === 'landing') return 'landing';
      if (h === 'verify' || h === 'unlock' || h === 'solve' || h === 'pulse' || h === 'cleared') {
        return h;
      }
      return null;
    };
    const handleHashGuard = () => {
      const target = parseHashTab();
      if (!target) return;
      if (target === 'landing') {
        if (viewMode === 'studio' || activeAuthSession) {
          void handleLockAndExitToLanding('hash-landing');
        }
        return;
      }
      navigateBuilderTab(target);
    };
    handleHashGuard();
    window.addEventListener('hashchange', handleHashGuard);
    return () => window.removeEventListener('hashchange', handleHashGuard);
  }, [navigateBuilderTab, viewMode, activeAuthSession, handleLockAndExitToLanding]);

  // Hard runtime auth invariant: block any unauthenticated entry into Builder Studio or Partner Console
  useEffect(() => {
    if (!authSessionChecked || viewMode !== 'studio') return;
    if (activePortal === 'talent' && !isBuilderTwoFactorVerified) {
      setViewMode('landing');
      setPendingRedirectTab(activeTab);
      setDualDoorModal({
        isOpen: true,
        door: 'talent',
        pendingPayload: landingDraftRef.current,
        pendingTab: activeTab,
      });
    } else if (activePortal === 'partner' && activeAuthSession?.realm !== 'partner') {
      setViewMode('landing');
      setDualDoorModal({
        isOpen: true,
        door: 'partner',
        pendingTab: 'unlock',
      });
    }
  }, [authSessionChecked, viewMode, activePortal, isBuilderTwoFactorVerified, activeAuthSession?.realm, activeTab]);

  const handleOpenDualDoorFromLanding = (
    door: PortalRealm,
    payload: { problemStatement: string; ageStage: AgeStage },
    targetTab: WorkspaceTab
  ) => {
    if (door === 'talent' && isBuilderTwoFactorVerified) {
      handleLandingHandoff(payload, targetTab, 'talent');
      return;
    }
    if (door === 'partner' && activeAuthSession?.realm === 'partner') {
      setActivePortal('partner');
      setUnlockViewMode('partner');
      setActiveTab('unlock');
      setViewMode('studio');
      return;
    }
    if (door === 'talent') {
      setPendingRedirectTab(targetTab);
    } else {
      setPendingRedirectTab(null);
    }
    setDualDoorModal({
      isOpen: true,
      door,
      pendingPayload: payload,
      pendingTab: targetTab,
    });
  };

  const handleDualDoorAuthenticated = (
    session: ActiveAuthSession,
    selectedAgeStage?: AgeStage
  ) => {
    const pendingPayload = dualDoorModal.pendingPayload;
    const resolvedTargetTab = pendingRedirectTab ?? dualDoorModal.pendingTab ?? 'verify';
    const postAuthAction = pendingPostAuthActionRef.current;
    pendingPostAuthActionRef.current = null;

    setActiveAuthSession(session);
    setActivePortal(session.realm);
    setPendingRedirectTab(null);
    setDualDoorModal({ isOpen: false, door: session.realm });

    if (session.realm === 'talent') {
      const nextProfile: PractitionerProfile = {
        ...profile,
        displayName:
          profile.displayName === 'Practitioner' ||
          session.claims.isDemo ||
          session.claims.authMethod === 'dedicated_pin'
            ? session.claims.displayName
            : profile.displayName,
        problemStatement: pendingPayload?.problemStatement?.trim() || profile.problemStatement,
        ageStage: selectedAgeStage || pendingPayload?.ageStage || profile.ageStage,
        onboarded: true,
        updatedAtIso: new Date().toISOString(),
      };
      updateProfileState(nextProfile);
      setUnlockViewMode('talent');
      setActiveTab(resolvedTargetTab);
      setViewMode('studio');
      void fetchGrantsAndLogs(session.token);
      void fetchPartnerVerificationState(session.token);
      void fetchPartnerSprints();
      if (postAuthAction) {
        window.setTimeout(() => postAuthAction(), 60);
      }
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      const authLabel =
        session.claims.authMethod === 'dedicated_pin' ? 'PIN Secured' : '2FA Verified';
      const idSuffix = session.claims.builderId ? ` · ${session.claims.builderId}` : '';
      setGlobalToast({
        id: `talent-realm-${Date.now()}`,
        variant: 'synced',
        title: `Talent Studio Active · ${authLabel}`,
        message: `Signed in as ${session.claims.displayName}${idSuffix} (vna_talent_sid · aud: vna-talent). Partner credentials strictly isolated.`,
      });
    } else {
      setUnlockViewMode('partner');
      setActiveTab('unlock');
      setViewMode('studio');
      void fetchPartnerSprints();
      void fetchGrantsAndLogs(session.token);
      void fetchPartnerContracts(session.token);
      void fetchPartnerVerificationState(session.token);
      setGlobalToast({
        id: `partner-realm-${Date.now()}`,
        variant: 'synced',
        title: `Partner Console Active · ${session.claims.orgName}`,
        message: `Verified ${session.claims.memberRole === 'partner_admin' ? 'Partner Admin' : 'Hiring Lead'} session (vna_partner_sid · aud: vna-partner). Consent-first access enabled.`,
      });
    }
  };

  const handleWipePortalSession = async (nextDoorToOpen?: PortalRealm) => {
    if (!nextDoorToOpen) {
      await handleLockAndExitToLanding('wipe-portal-signout');
      return;
    }

    const previousRealm = activeAuthSession?.realm ?? activePortal;
    const tokenToRevoke = activeAuthSession?.token;
    setActiveAuthSession(null);
    setPendingRedirectTab(null);
    pendingPostAuthActionRef.current = null;
    setViewMode('landing');

    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.removeItem('vuka.viewMode');
      } catch {
        // ignore
      }
    }

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'VukaNaAmana',
          ...(tokenToRevoke ? { Authorization: `Bearer ${tokenToRevoke}` } : {}),
        },
      });
    } catch {
      // Even if offline, local React-memory session is already wiped
    }

    if (nextDoorToOpen === 'talent') {
      setDualDoorModal({
        isOpen: true,
        door: 'talent',
        pendingTab: 'verify',
      });
      announcePolite('Partner session locked. Skilled Builder authorization required.');
      setGlobalToast({
        id: `portal-auth-talent-${Date.now()}`,
        variant: 'synced',
        title: 'Authorisation Required · Skilled Builder Door',
        message: 'Previous session locked. The Skilled Builder portal requires fresh 2FA or Dedicated PIN verification.',
      });
    } else {
      setDualDoorModal({
        isOpen: true,
        door: nextDoorToOpen,
        pendingTab: nextDoorToOpen === 'partner' ? 'unlock' : 'verify',
      });
      announcePolite('Previous session locked before switching portals.');
      setGlobalToast({
        id: `portal-wiped-${Date.now()}`,
        variant: 'synced',
        title: 'Previous Realm Session Cleared',
        message: `Locked ${previousRealm === 'partner' ? 'vna_partner_sid' : 'vna_talent_sid'} before opening the ${nextDoorToOpen === 'partner' ? 'Hiring Partner' : 'Talent Builder'} door.`,
      });
    }
  };

  const handleSwitchToTalentDoor = async () => {
    // Always lock and terminate the active Partner session before opening the Skilled Builder door.
    await handleWipePortalSession('talent');
  };

  const handleChangeLocale = (preferredLocale: LocaleCode) => {
    updateProfileState({
      ...profile,
      preferredLocale,
      updatedAtIso: new Date().toISOString(),
    });
  };

  const handleToggleTheme = () => {
    updateProfileState({
      ...profile,
      themePreference: profile.themePreference === 'dark' ? 'light' : 'dark',
      updatedAtIso: new Date().toISOString(),
    });
  };

  const handleUpdateProfileFocus = (problemStatement: string, ageStage: AgeStage) => {
    updateProfileState({
      ...profile,
      problemStatement,
      ageStage,
      updatedAtIso: new Date().toISOString(),
    });
  };

  const handleAddCapability = (data: {
    title: string;
    domain: string;
    proofSummary: string;
    portfolioRef?: string;
    certificationRef?: string;
    peerEndorsement?: string;
  }) => {
    const now = new Date().toISOString();
    const newCap: SkillCapability = {
      id: makeSafeId('cap'),
      ownerUid: authUser?.uid ?? profile.uid,
      title: data.title,
      domain: data.domain,
      proofSummary: data.proofSummary,
      portfolioRef: data.portfolioRef,
      certificationRef: data.certificationRef,
      peerEndorsement: data.peerEndorsement,
      verificationStatus: 'pending',
      confidenceScore: 55,
      createdAtIso: now,
      updatedAtIso: now,
    };
    const nextList = [newCap, ...capabilities];
    setCapabilities(nextList);
    saveLocalCapabilities(nextList);

    if (authUser && isOnline) {
      void upsertCloudCapability(authUser.uid, newCap);
    } else {
      enqueueMutation({
        id: makeSafeId('mut'),
        kind: 'upsert_capability',
        payload: newCap,
        queuedAtIso: now,
      });
    }
  };

  const handlePromoteCapability = (capabilityId: string) => {
    const now = new Date().toISOString();
    let updatedCap: SkillCapability | null = null;
    const nextList = capabilities.map((cap) => {
      if (cap.id !== capabilityId) return cap;
      const { nextStatus, nextConfidence } = promoteVerificationStatus(cap.verificationStatus);
      updatedCap = {
        ...cap,
        verificationStatus: nextStatus,
        confidenceScore: nextConfidence,
        updatedAtIso: now,
      };
      return updatedCap;
    });
    setCapabilities(nextList);
    saveLocalCapabilities(nextList);

    if (updatedCap) {
      if (authUser && isOnline) {
        void upsertCloudCapability(authUser.uid, updatedCap);
      } else {
        enqueueMutation({
          id: makeSafeId('mut'),
          kind: 'upsert_capability',
          payload: updatedCap,
          queuedAtIso: now,
        });
      }
    }
  };

  const handleDeleteCapability = (capabilityId: string) => {
    const nextList = capabilities.filter((c) => c.id !== capabilityId);
    setCapabilities(nextList);
    saveLocalCapabilities(nextList);
    if (authUser && isOnline) {
      void deleteCloudCapability(authUser.uid, capabilityId);
    } else {
      enqueueMutation({
        id: makeSafeId('mut'),
        kind: 'delete_capability',
        capabilityId,
        queuedAtIso: new Date().toISOString(),
      });
    }
  };

  const handleSavePassport = (nextPassport: CompetencyPassport) => {
    const ownedPassport: CompetencyPassport = {
      ...nextPassport,
      ownerUid: authUser?.uid ?? profile.uid,
    };
    setPassport(ownedPassport);
    saveLocalPassport(ownedPassport);
    announcePolite('Living Competency Passport generated.');

    if (authUser && isOnline) {
      void upsertCloudPassport(authUser.uid, ownedPassport);
    } else {
      enqueueMutation({
        id: makeSafeId('mut'),
        kind: 'upsert_passport',
        payload: ownedPassport,
        queuedAtIso: new Date().toISOString(),
      });
    }
  };

  const handleTogglePassportStipend = (eligible: boolean) => {
    if (!passport) return;
    handleSavePassport({
      ...passport,
      stipendEligible: eligible,
    });
  };

  const handleUpdateVault = (nextVault: WorkReadyVault) => {
    const ownedVault: WorkReadyVault = {
      ...nextVault,
      ownerUid: authUser?.uid ?? profile.uid,
      updatedAtIso: new Date().toISOString(),
    };
    setVault(ownedVault);
    saveLocalVault(ownedVault);
    announcePolite('SDG Impact Pulse updated.');

    if (authUser && isOnline) {
      void upsertCloudVault(authUser.uid, ownedVault);
    } else {
      enqueueMutation({
        id: makeSafeId('mut'),
        kind: 'upsert_vault',
        payload: ownedVault,
        queuedAtIso: ownedVault.updatedAtIso,
      });
    }
  };

  const handleUpdateProofPortfolio = (nextPortfolio: LivingProofPortfolio) => {
    setProofPortfolio(nextPortfolio);
    saveLocalProofPortfolio(nextPortfolio);

    const nextReady = Boolean(nextPortfolio.analysis);
    const nextTrack = nextPortfolio.skillTrackId;
    const nextLocalScore = nextPortfolio.analysis?.localReadinessPct ?? vault.proofLocalScore ?? 0;
    const nextRemoteScore = nextPortfolio.analysis?.remoteReadinessPct ?? vault.proofRemoteScore ?? 0;
    const nextSignalsCount = countWorkplaceSignals(nextPortfolio.workplaceSignals);

    if (
      Boolean(vault.proofPortfolioReady) !== nextReady ||
      vault.proofSkillTrack !== nextTrack ||
      (vault.proofLocalScore ?? 0) !== nextLocalScore ||
      (vault.proofRemoteScore ?? 0) !== nextRemoteScore ||
      (vault.workplaceSignalsCount ?? 0) !== nextSignalsCount
    ) {
      handleUpdateVault({
        ...vault,
        proofPortfolioReady: nextReady,
        proofSkillTrack: nextTrack,
        proofLocalScore: nextLocalScore,
        proofRemoteScore: nextRemoteScore,
        workplaceSignalsCount: nextSignalsCount,
      });
    }
  };

  const handleRequestEndorsement = (input: {
    collaboratorName: string;
    collaboratorRole: string;
    organization: string;
    capabilityTitle: string;
    endorsementText?: string;
    sourceTab: 'verify' | 'unlock';
  }): PeerEndorsement => {
    const now = new Date().toISOString();
    const trimmedQuote = input.endorsementText?.trim() ?? '';
    // Safeguard: unlock-tab partner reference requests must always start as 'requested'
    // and await external collaborator confirmation rather than talent self-certification.
    const isDirectVerified = input.sourceTab !== 'unlock' && trimmedQuote.length >= 10;
    const created: PeerEndorsement = {
      id: makeSafeId('end'),
      ownerUid: authUser?.uid ?? profile.uid,
      collaboratorName: input.collaboratorName,
      collaboratorRole: input.collaboratorRole,
      organization: input.organization,
      capabilityTitle: input.capabilityTitle,
      endorsementText: isDirectVerified ? trimmedQuote : '',
      status: isDirectVerified ? 'verified' : 'requested',
      shareToken: makeSafeId('vuka-end'),
      sourceTab: input.sourceTab,
      createdAtIso: now,
      updatedAtIso: now,
    };

    const nextList = [created, ...endorsements];
    setEndorsements(nextList);
    saveLocalEndorsements(nextList);

    if (authUser && isOnline) {
      void upsertCloudEndorsement(authUser.uid, created);
    } else {
      enqueueMutation({
        id: makeSafeId('mut'),
        kind: 'upsert_endorsement',
        payload: created,
        queuedAtIso: now,
      });
    }
    return created;
  };

  const handleCompleteEndorsement = (endorsementId: string, endorsementText: string) => {
    const target = endorsements.find((item) => item.id === endorsementId);
    if (!target || target.status === 'verified') return;
    // Safeguard: block self-certifying unlock-tab partner verification requests inside Talent Studio
    if (target.sourceTab === 'unlock' && activePortal !== 'partner') {
      return;
    }
    const now = new Date().toISOString();
    let updated: PeerEndorsement | null = null;
    const nextList = endorsements.map((item) => {
      if (item.id !== endorsementId || item.status === 'verified') return item;
      updated = {
        ...item,
        endorsementText: endorsementText.trim(),
        status: 'verified',
        updatedAtIso: now,
      };
      return updated;
    });
    setEndorsements(nextList);
    saveLocalEndorsements(nextList);

    if (updated) {
      if (authUser && isOnline) {
        void upsertCloudEndorsement(authUser.uid, updated);
      } else {
        enqueueMutation({
          id: makeSafeId('mut'),
          kind: 'upsert_endorsement',
          payload: updated,
          queuedAtIso: now,
        });
      }
    }
  };

  const handleDeleteEndorsement = (endorsementId: string) => {
    const nextList = endorsements.filter((e) => e.id !== endorsementId);
    setEndorsements(nextList);
    saveLocalEndorsements(nextList);

    if (authUser && isOnline) {
      void deleteCloudEndorsement(authUser.uid, endorsementId);
    } else {
      enqueueMutation({
        id: makeSafeId('mut'),
        kind: 'delete_endorsement',
        endorsementId,
        queuedAtIso: new Date().toISOString(),
      });
    }
  };

  const handleAdvancePayout = (payoutId: string) => {
    const now = new Date().toISOString();
    let updated: ContractPayout | null = null;
    const nextList = payouts.map((item) => {
      if (item.id !== payoutId || item.status === 'released') return item;
      const nextStatus = advancePayoutStatus(item.status);
      // Safeguard: talent sessions may only transition escrow-held -> processing upon
      // deliverable submission; final release requires partner/escrow settlement authority.
      if (nextStatus === 'released' && activePortal !== 'partner') {
        return item;
      }
      updated = {
        ...item,
        status: nextStatus,
        payoutRail: vault.payoutRail,
        updatedAtIso: now,
      };
      return updated;
    });
    setPayouts(nextList);
    saveLocalPayouts(nextList);

    if (updated) {
      announcePolite('SDG Impact Pulse updated.');
      if (authUser && isOnline) {
        void upsertCloudPayout(authUser.uid, updated);
      } else {
        enqueueMutation({
          id: makeSafeId('mut'),
          kind: 'upsert_payout',
          payload: updated,
          queuedAtIso: now,
        });
      }
    }
  };

  const ensureEscrowPayout = (
    sprintId: string,
    sprintTitle: string,
    partnerOrg: string,
    amountUsd: number
  ) => {
    if (payouts.some((p) => p.sprintId === sprintId)) return;
    const now = new Date().toISOString();
    const newPayout: ContractPayout = {
      id: makeSafeId('pay'),
      ownerUid: authUser?.uid ?? profile.uid,
      sprintId,
      sprintTitle,
      partnerOrg,
      amountUsd,
      payoutRail: vault.payoutRail,
      status: 'escrow-held',
      createdAtIso: now,
      updatedAtIso: now,
    };
    const nextPayouts = [newPayout, ...payouts];
    setPayouts(nextPayouts);
    saveLocalPayouts(nextPayouts);

    if (authUser && isOnline) {
      void upsertCloudPayout(authUser.uid, newPayout);
    } else {
      enqueueMutation({
        id: makeSafeId('mut'),
        kind: 'upsert_payout',
        payload: newPayout,
        queuedAtIso: now,
      });
    }
  };

  const handleImportPassportSkills = (sourcePassport: CompetencyPassport): number => {
    const now = new Date().toISOString();
    const existingTitles = new Set(capabilities.map((c) => c.title.trim().toLowerCase()));
    const toAdd: SkillCapability[] = [];

    for (const skill of sourcePassport.verifiedSkills) {
      if (existingTitles.has(skill.name.trim().toLowerCase())) continue;
      toAdd.push({
        id: makeSafeId('cap'),
        ownerUid: authUser?.uid ?? profile.uid,
        title: skill.name,
        domain: sourcePassport.studioDomain,
        proofSummary: skill.evidenceNote,
        certificationRef: `Living Competency Passport (${sourcePassport.id})`,
        verificationStatus: 'field-verified',
        confidenceScore: Math.max(60, Math.min(98, skill.confidenceScore)),
        createdAtIso: now,
        updatedAtIso: now,
      });
    }

    if (toAdd.length === 0) return 0;

    const nextList = [...toAdd, ...capabilities];
    setCapabilities(nextList);
    saveLocalCapabilities(nextList);

    for (const cap of toAdd) {
      if (authUser && isOnline) {
        void upsertCloudCapability(authUser.uid, cap);
      } else {
        enqueueMutation({
          id: makeSafeId('mut'),
          kind: 'upsert_capability',
          payload: cap,
          queuedAtIso: now,
        });
      }
    }

    return toAdd.length;
  };

  const handleAcceptBrief = (brief: ProblemBrief) => {
    const existing = contributions.find((c) => c.briefId === brief.id);
    if (existing) {
      setSelectedBriefId(brief.id);
      setActiveTab('solve');
      return;
    }

    const now = new Date().toISOString();
    const newContrib: BriefSubmission = {
      id: makeSafeId('sub'),
      ownerUid: authUser?.uid ?? profile.uid,
      briefId: brief.id,
      briefTitle: brief.title,
      domain: brief.domain,
      status: 'in-progress',
      solutionNotes: '',
      hoursLogged: 1,
      payoutUsd: brief.payoutUsd,
      createdAtIso: now,
      updatedAtIso: now,
    };
    const nextList = [newContrib, ...contributions];
    setContributions(nextList);
    saveLocalContributions(nextList);
    setSelectedBriefId(brief.id);
    setActiveTab('solve');
    ensureEscrowPayout(brief.id, brief.title, brief.organization, brief.payoutUsd);

    if (authUser && isOnline) {
      void upsertCloudContribution(authUser.uid, newContrib);
    } else {
      enqueueMutation({
        id: makeSafeId('mut'),
        kind: 'upsert_contribution',
        payload: newContrib,
        queuedAtIso: now,
      });
    }
  };

  const handleJoinSprintPod = (sprint: RankedSolutionSprint) => {
    const existing = contributions.find((c) => c.briefId === sprint.id);
    if (existing) {
      setSelectedBriefId(sprint.id);
      return;
    }

    const now = new Date().toISOString();
    const newContrib: BriefSubmission = {
      id: makeSafeId('sub'),
      ownerUid: authUser?.uid ?? profile.uid,
      briefId: sprint.id,
      briefTitle: sprint.title,
      domain: sprint.domain,
      status: 'in-progress',
      solutionNotes: '',
      hoursLogged: 1,
      payoutUsd: sprint.payoutUsd,
      createdAtIso: now,
      updatedAtIso: now,
    };
    const nextList = [newContrib, ...contributions];
    setContributions(nextList);
    saveLocalContributions(nextList);
    setSelectedBriefId(sprint.id);
    ensureEscrowPayout(sprint.id, sprint.title, sprint.partnerOrg, sprint.payoutUsd);

    if (canWriteCloud && authUser) {
      void upsertCloudContribution(authUser.uid, newContrib);
    } else {
      enqueueMutation({
        id: makeSafeId('mut'),
        kind: 'upsert_contribution',
        payload: newContrib,
        queuedAtIso: now,
      });
    }
  };

  const handleToggleSprintMilestone = (briefId: string, milestone: SprintMilestoneKey) => {
    const existingContrib = contributions.find((c) => c.briefId === briefId);
    const currentMilestones = normalizeSprintMilestones(
      existingContrib?.milestonesDone ?? sprintMilestonesByBrief[briefId],
      existingContrib?.status === 'completed'
    );
    const nextMilestones = toggleSprintMilestoneList(currentMilestones, milestone);

    const nextMap: Record<string, SprintMilestoneKey[]> = {
      ...sprintMilestonesByBrief,
      [briefId]: nextMilestones,
    };
    setSprintMilestonesByBrief(nextMap);
    saveLocalSprintMilestones(nextMap);

    if (existingContrib && existingContrib.status !== 'completed') {
      const now = new Date().toISOString();
      const updatedContrib: BriefSubmission = {
        ...existingContrib,
        milestonesDone: nextMilestones,
        updatedAtIso: now,
      };
      const nextContribs = contributions.map((c) =>
        c.id === existingContrib.id ? updatedContrib : c
      );
      setContributions(nextContribs);
      saveLocalContributions(nextContribs);

      if (canWriteCloud && authUser) {
        void upsertCloudContribution(authUser.uid, updatedContrib);
      } else {
        enqueueMutation({
          id: makeSafeId('mut'),
          kind: 'upsert_contribution',
          payload: updatedContrib,
          queuedAtIso: now,
        });
      }
    }
  };

  const handleApplyMatchedWork = (opportunity: RankedMatchedWorkOpportunity) => {
    const now = new Date().toISOString();
    const alreadyApplied =
      matchedApplications.some((app) => app.opportunityId === opportunity.id) ||
      (vault.appliedOpportunityIds ?? []).includes(opportunity.id);

    if (!alreadyApplied) {
      const newApplication: MatchedWorkApplication = {
        id: makeSafeId('match-app'),
        opportunityId: opportunity.id,
        opportunityTitle: opportunity.title,
        partnerOrg: opportunity.partnerOrg,
        payoutUsd: opportunity.payoutUsd,
        workMode: opportunity.workMode,
        appliedAtIso: now,
        bundleSummary: {
          passportAttached: true,
          proofAttached: Boolean(proofPortfolio.analysis),
          complianceCleared: isComplianceClearedForWork(vault),
        },
      };
      const nextApps = [newApplication, ...matchedApplications];
      setMatchedApplications(nextApps);
      saveLocalMatchedWorkApplications(nextApps);
    }

    // Ensure an in-progress sprint record & escrow payout exist so progress & payouts track cleanly
    if (!contributions.some((c) => c.briefId === opportunity.id)) {
      const existingMilestones = normalizeSprintMilestones(
        sprintMilestonesByBrief[opportunity.id],
        false
      );
      const newContrib: BriefSubmission = {
        id: makeSafeId('sub'),
        ownerUid: authUser?.uid ?? profile.uid,
        briefId: opportunity.id,
        briefTitle: opportunity.title,
        domain: opportunity.studioDomain,
        status: 'in-progress',
        solutionNotes: `Living Proof Application Bundle submitted to ${opportunity.partnerOrg} (${opportunity.durationLabel}).`,
        hoursLogged: 1,
        payoutUsd: opportunity.payoutUsd,
        milestonesDone: existingMilestones,
        createdAtIso: now,
        updatedAtIso: now,
      };
      const nextContribs = [newContrib, ...contributions];
      setContributions(nextContribs);
      saveLocalContributions(nextContribs);
      setSelectedBriefId(opportunity.id);

      if (canWriteCloud && authUser) {
        void upsertCloudContribution(authUser.uid, newContrib);
      } else {
        enqueueMutation({
          id: makeSafeId('mut'),
          kind: 'upsert_contribution',
          payload: newContrib,
          queuedAtIso: now,
        });
      }
    }

    ensureEscrowPayout(
      opportunity.id,
      opportunity.title,
      opportunity.partnerOrg,
      opportunity.payoutUsd
    );

    const nextAppliedIds = Array.from(
      new Set([...(vault.appliedOpportunityIds ?? []), opportunity.id])
    );
    const nextMatchedCount = Math.max(
      nextAppliedIds.length,
      (vault.matchedWorkCount ?? 0) + (alreadyApplied ? 0 : 1)
    );

    handleUpdateVault({
      ...vault,
      matchedWorkCount: nextMatchedCount,
      appliedOpportunityIds: nextAppliedIds,
    });

    const consentedWorkSetupPreferences =
      vault.shareWorkSetupWithPartners && (vault.workSetupPreferences?.length ?? 0) > 0
        ? vault.workSetupPreferences!.map((id) => getWorkSetupPreferenceLabel(id))
        : undefined;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Requested-With': 'VukaNaAmana',
      };
      if (activeAuthSession?.token) {
        headers.Authorization = `Bearer ${activeAuthSession.token}`;
      }
      void fetch('/api/consent/grant', {
        method: 'POST',
        credentials: 'same-origin',
        headers,
        body: JSON.stringify({
          talentAlias: profile.displayName || 'Skilled Builder',
          verifiedPassportSummary: passport?.fieldMatch || 'Living Competency Passport verified',
          photoProofHighlights: proofPortfolio.analysis?.visualHighlights || ['Verified proof sample'],
          complianceShieldStatus: vault.identityPathway ? vault.identityPathway.toUpperCase() : 'Tier-2 KYC Cleared',
          grantedToOrgId: `org_${makeSafeId(opportunity.partnerOrg)}`,
          grantedToOrgName: opportunity.partnerOrg,
          ...(consentedWorkSetupPreferences
            ? { sharedWorkSetupPreferences: consentedWorkSetupPreferences }
            : {}),
        }),
      })
        .then(async (res) => {
          if (!res.ok) return;
          const data = (await res.json()) as { grant?: ConsentGrant };
          if (data.grant) {
            setConsentGrants((prev) => [
              data.grant!,
              ...prev.filter((g) => g.consentId !== data.grant!.consentId),
            ]);
          }
          await fetchGrantsAndLogs();
        })
        .catch(() => {
          // Offline fallback
        });
    } catch {
      // Offline fallback
    }
  };

  const handleStartUpskillingBridge = (params: {
    opportunity: RankedMatchedWorkOpportunity;
    selectedOption: UpskillingBridgePathOption;
    bridge: JobToFitUpskillingBridge;
  }) => {
    const { opportunity, selectedOption, bridge } = params;
    const now = new Date().toISOString();

    const alreadyLocked =
      lockedBridges.some((rec) => rec.opportunityId === opportunity.id) ||
      (vault.lockedBridgeOpportunityIds ?? []).includes(opportunity.id);

    const record: LockedUpskillingBridgeRecord = {
      id: makeSafeId('bridge-lock'),
      opportunityId: opportunity.id,
      opportunityTitle: opportunity.title,
      partnerOrg: opportunity.partnerOrg,
      selectedOption,
      missingSkillTitle: bridge.singleMissingBridge.skillTitle,
      lockedAtIso: now,
    };

    const nextLockedRecords = [
      record,
      ...lockedBridges.filter((rec) => rec.opportunityId !== opportunity.id),
    ];
    setLockedBridges(nextLockedRecords);
    saveLocalUpskillingBridges(nextLockedRecords);

    // Log the verified RPL/UQP bridge milestone into capabilities if not already logged
    const existingCapTitles = new Set(
      capabilities.map((c) => c.title.trim().toLowerCase())
    );
    const bridgeCapTitle = `${bridge.singleMissingBridge.skillTitle} (${
      selectedOption === 'micro-bridge' ? 'UQP/RPL Micro-Bridge' : 'ILO Apprenticeship Pod'
    })`;
    if (!existingCapTitles.has(bridgeCapTitle.toLowerCase())) {
      const bridgeCap: SkillCapability = {
        id: makeSafeId('cap'),
        ownerUid: authUser?.uid ?? profile.uid,
        title: bridgeCapTitle,
        domain: opportunity.studioDomain,
        proofSummary:
          selectedOption === 'micro-bridge'
            ? `${bridge.optionAMicroBridge.title} (${bridge.optionAMicroBridge.durationLabel}) — ${bridge.optionAMicroBridge.actionSummary}`
            : `${bridge.optionBApprenticeshipPod.title} (${bridge.optionBApprenticeshipPod.mentorPairingLabel}) — ${bridge.optionBApprenticeshipPod.cohesionNote}`,
        certificationRef: 'UNESCO UQP · ILO RPL Standard',
        verificationStatus: 'field-verified',
        confidenceScore: 88,
        createdAtIso: now,
        updatedAtIso: now,
      };
      const nextCaps = [bridgeCap, ...capabilities];
      setCapabilities(nextCaps);
      saveLocalCapabilities(nextCaps);

      if (canWriteCloud && authUser) {
        void upsertCloudCapability(authUser.uid, bridgeCap);
      } else {
        enqueueMutation({
          id: makeSafeId('mut'),
          kind: 'upsert_capability',
          payload: bridgeCap,
          queuedAtIso: now,
        });
      }
    }

    const nextLockedIds = Array.from(
      new Set([...(vault.lockedBridgeOpportunityIds ?? []), opportunity.id])
    );
    const nextBridgesCount = Math.max(
      nextLockedIds.length,
      (vault.upskillingBridgesCount ?? 0) + (alreadyLocked ? 0 : 1)
    );

    handleUpdateVault({
      ...vault,
      upskillingBridgesCount: nextBridgesCount,
      lockedBridgeOpportunityIds: nextLockedIds,
    });
  };

  const handleSaveDraft = (submissionId: string, notes: string, hoursLogged: number) => {
    const now = new Date().toISOString();
    let updated: BriefSubmission | null = null;
    const nextList = contributions.map((c) => {
      if (c.id !== submissionId || c.status === 'completed') return c;
      updated = {
        ...c,
        solutionNotes: notes,
        hoursLogged,
        updatedAtIso: now,
      };
      return updated;
    });
    setContributions(nextList);
    saveLocalContributions(nextList);

    if (updated) {
      if (canWriteCloud && authUser) {
        void upsertCloudContribution(authUser.uid, updated);
      } else {
        enqueueMutation({
          id: makeSafeId('mut'),
          kind: 'upsert_contribution',
          payload: updated,
          queuedAtIso: now,
        });
      }
    }
  };

  const handleSubmitSolution = (submissionId: string, notes: string, hoursLogged: number) => {
    const now = new Date().toISOString();
    const allMilestones: SprintMilestoneKey[] = [
      'analysis-complete',
      'draft-ready',
      'final-submission',
    ];
    let updated: BriefSubmission | null = null;
    const nextList = contributions.map((c) => {
      if (c.id !== submissionId || c.status === 'completed') return c;
      updated = {
        ...c,
        status: 'completed',
        solutionNotes: notes,
        hoursLogged,
        milestonesDone: allMilestones,
        updatedAtIso: now,
      };
      return updated;
    });
    setContributions(nextList);
    saveLocalContributions(nextList);

    if (updated) {
      const completedItem: BriefSubmission = updated;
      setRecentCompletedContribution(completedItem);
      announcePolite('Solution submitted. SDG Impact Pulse updated.');

      const nextMilestonesMap: Record<string, SprintMilestoneKey[]> = {
        ...sprintMilestonesByBrief,
        [completedItem.briefId]: allMilestones,
      };
      setSprintMilestonesByBrief(nextMilestonesMap);
      saveLocalSprintMilestones(nextMilestonesMap);

      // Advance matching escrow payout into processing automatically on milestone delivery
      const matchingPayout = payouts.find(
        (p) => p.sprintId === completedItem.briefId && p.status === 'escrow-held'
      );
      if (matchingPayout) {
        handleAdvancePayout(matchingPayout.id);
      }

      if (canWriteCloud && authUser) {
        void upsertCloudContribution(authUser.uid, completedItem);
      } else {
        enqueueMutation({
          id: makeSafeId('mut'),
          kind: 'upsert_contribution',
          payload: completedItem,
          queuedAtIso: now,
        });
      }

      // Automatically award a mentor-endorsed Digital Skill Badge upon Pod Sprint completion if not yet awarded for this sprint
      if (!menteeCompetencyBadges.some((b) => b.sprintId === completedItem.briefId)) {
        const badgeDomain = normalizeBadgeStudioDomain(completedItem.domain);
        const presets = DOMAIN_SKILL_BADGE_CATALOG[badgeDomain] ?? DOMAIN_SKILL_BADGE_CATALOG['Green Energy'];
        const preset = presets[0];
        const mentor = getAssignedMentorForSprint(completedItem.briefId, badgeDomain);
        const autoBadge: MenteeCompetencyBadge = {
          id: makeSafeId('mbadge'),
          ownerUid: authUser?.uid ?? profile.uid,
          sprintId: completedItem.briefId,
          sprintTitle: completedItem.briefTitle,
          domain: badgeDomain,
          mentorId: mentor.id,
          mentorName: mentor.name,
          mentorRole: mentor.roleTitle,
          badgeTitle: preset.badgeTitle,
          skillCategory: preset.skillCategory,
          competencyLevel: preset.defaultLevel,
          citationNote: preset.defaultCitation,
          verificationCode: generateBadgeVerificationCode(completedItem.briefId, badgeDomain),
          awardedAtIso: now.slice(0, 10),
          createdAtIso: now,
          updatedAtIso: now,
        };
        const nextBadges = [autoBadge, ...menteeCompetencyBadges];
        setMenteeCompetencyBadges(nextBadges);
        saveLocalMenteeCompetencyBadges(nextBadges);

        if (canWriteCloud && authUser) {
          void upsertCloudMenteeCompetencyBadge(authUser.uid, autoBadge);
        } else {
          enqueueMutation({
            id: makeSafeId('mut'),
            kind: 'upsert_mentee_badge',
            payload: autoBadge,
            queuedAtIso: now,
          });
        }
      }
    }
  };

  const handleAddSprintFeedback = (input: {
    contributionId: string;
    briefId: string;
    briefTitle: string;
    partnerOrg: string;
    reviewerName: string;
    reviewerRole: string;
    rating: SprintRatingScore;
    reviewText: string;
  }) => {
    const now = new Date().toISOString();
    const created: SprintFeedback = {
      id: makeSafeId('fb'),
      ownerUid: authUser?.uid ?? profile.uid,
      contributionId: input.contributionId,
      briefId: input.briefId,
      briefTitle: input.briefTitle,
      partnerOrg: input.partnerOrg,
      reviewerName: input.reviewerName,
      reviewerRole: input.reviewerRole,
      rating: input.rating,
      reviewText: input.reviewText,
      createdAtIso: now,
      updatedAtIso: now,
    };

    const nextList = [created, ...sprintFeedback];
    setSprintFeedback(nextList);
    saveLocalSprintFeedback(nextList);

    if (authUser && isOnline) {
      void upsertCloudSprintFeedback(authUser.uid, created);
    } else {
      enqueueMutation({
        id: makeSafeId('mut'),
        kind: 'upsert_sprint_feedback',
        payload: created,
        queuedAtIso: now,
      });
    }
  };

  const handleSaveCollaborationNote = (input: {
    contributionId: string;
    briefId: string;
    briefTitle: string;
    markdownBody: string;
  }) => {
    const now = new Date().toISOString();
    const ownerId = authUser?.uid ?? profile.uid;
    const existing = collaborationNotes.find(
      (n) => n.contributionId === input.contributionId || n.briefId === input.briefId
    );
    const safeNoteId = existing?.id || `collab_${input.contributionId}`.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
    const savedNote: SprintCollaborationNote = {
      id: safeNoteId,
      ownerUid: ownerId,
      contributionId: input.contributionId,
      briefId: input.briefId,
      briefTitle: input.briefTitle,
      markdownBody: input.markdownBody,
      createdAtIso: existing?.createdAtIso ?? now,
      updatedAtIso: now,
    };

    const nextNotes = existing
      ? collaborationNotes.map((n) => (n.id === existing.id ? savedNote : n))
      : [savedNote, ...collaborationNotes];
    setCollaborationNotes(nextNotes);
    saveLocalCollaborationNotes(nextNotes);

    if (canWriteCloud && authUser) {
      void upsertCloudCollaborationNote(authUser.uid, savedNote);
    } else {
      enqueueMutation({
        id: makeSafeId('mut'),
        kind: 'upsert_collaboration_note',
        payload: savedNote,
        queuedAtIso: now,
      });
    }
  };

  const handleDeleteCollaborationNote = (noteId: string) => {
    const now = new Date().toISOString();
    const nextNotes = collaborationNotes.filter((n) => n.id !== noteId);
    setCollaborationNotes(nextNotes);
    saveLocalCollaborationNotes(nextNotes);

    if (canWriteCloud && authUser) {
      void deleteCloudCollaborationNote(authUser.uid, noteId);
    } else {
      enqueueMutation({
        id: makeSafeId('mut'),
        kind: 'delete_collaboration_note',
        noteId,
        queuedAtIso: now,
      });
    }
  };

  const handleSaveMentorshipJournalEntry = (input: SaveMentorshipJournalInput) => {
    const now = new Date().toISOString();
    const ownerId = authUser?.uid ?? profile.uid;
    const existing = input.id
      ? mentorshipJournal.find((j) => j.id === input.id)
      : undefined;
    const entryId = existing?.id || makeSafeId('mjournal');
    const savedEntry: MentorshipJournalEntry = {
      id: entryId,
      ownerUid: ownerId,
      contributionId: input.contributionId,
      briefId: input.briefId,
      briefTitle: input.briefTitle,
      mentorId: input.mentorId,
      mentorName: input.mentorName,
      sessionDateIso: input.sessionDateIso,
      focusTopic: input.focusTopic,
      reflectionTitle: input.reflectionTitle,
      reflectionBody: input.reflectionBody,
      nextActionStep: input.nextActionStep,
      createdAtIso: existing?.createdAtIso ?? now,
      updatedAtIso: now,
    };

    const nextEntries = existing
      ? mentorshipJournal.map((j) => (j.id === existing.id ? savedEntry : j))
      : [savedEntry, ...mentorshipJournal];
    setMentorshipJournal(nextEntries);
    saveLocalMentorshipJournal(nextEntries);

    if (canWriteCloud && authUser) {
      void upsertCloudMentorshipJournalEntry(authUser.uid, savedEntry);
    } else {
      enqueueMutation({
        id: makeSafeId('mut'),
        kind: 'upsert_mentorship_journal',
        payload: savedEntry,
        queuedAtIso: now,
      });
    }
  };

  const handleDeleteMentorshipJournalEntry = (entryId: string) => {
    const now = new Date().toISOString();
    const nextEntries = mentorshipJournal.filter((j) => j.id !== entryId);
    setMentorshipJournal(nextEntries);
    saveLocalMentorshipJournal(nextEntries);

    if (canWriteCloud && authUser) {
      void deleteCloudMentorshipJournalEntry(authUser.uid, entryId);
    } else {
      enqueueMutation({
        id: makeSafeId('mut'),
        kind: 'delete_mentorship_journal',
        entryId,
        queuedAtIso: now,
      });
    }
  };

  const handleCreateSprintDiscussionPost = (input: CreateSprintDiscussionInput) => {
    const now = new Date().toISOString();
    const authorUid = authUser?.uid ?? profile.uid;
    const matchedSprint = SOLUTION_SPRINTS.find((s) => s.id === input.sprintId);
    const authorRole = matchedSprint?.podDeliveryRole || 'Pod Member';

    const created: SprintDiscussionPost = {
      id: makeSafeId('disc'),
      sprintId: input.sprintId,
      parentId: input.parentId ?? null,
      authorUid,
      authorName: profile.displayName || 'Practitioner',
      authorRole,
      deliverableTag: input.deliverableTag,
      body: input.body,
      resourceUrl: input.resourceUrl,
      resourceLabel: input.resourceLabel,
      createdAtIso: now,
      updatedAtIso: now,
    };

    const nextList = [created, ...sprintDiscussions];
    setSprintDiscussions(nextList);
    saveLocalSprintDiscussions(nextList);

    if (canWriteCloud && authUser) {
      void upsertCloudSprintDiscussionPost(authUser.uid, created);
    } else {
      enqueueMutation({
        id: makeSafeId('mut'),
        kind: 'upsert_sprint_discussion',
        payload: created,
        queuedAtIso: now,
      });
    }
  };

  const handleDeleteSprintDiscussionPost = (sprintId: string, postId: string) => {
    const now = new Date().toISOString();
    const nextList = sprintDiscussions.filter(
      (p) => p.id !== postId && p.parentId !== postId
    );
    setSprintDiscussions(nextList);
    saveLocalSprintDiscussions(nextList);

    if (canWriteCloud && authUser) {
      void deleteCloudSprintDiscussionPost(sprintId, postId);
    } else {
      enqueueMutation({
        id: makeSafeId('mut'),
        kind: 'delete_sprint_discussion',
        sprintId,
        postId,
        queuedAtIso: now,
      });
    }
  };

  const handleSendMentorMessage = useCallback(
    (input: {
      sprintId: string;
      sprintTitle: string;
      mentor: PodMentorProfile;
      body: string;
    }) => {
      const now = new Date().toISOString();
      const ownerId = authUser?.uid ?? profile.uid;
      const outbound: MentorMessage = {
        id: makeSafeId('msg'),
        ownerUid: ownerId,
        sprintId: input.sprintId,
        sprintTitle: input.sprintTitle,
        mentorId: input.mentor.id,
        mentorName: input.mentor.name,
        sender: 'practitioner',
        body: input.body,
        createdAtIso: now,
        updatedAtIso: now,
      };

      setMentorMessages((prev) => {
        const next = [...prev, outbound];
        saveLocalMentorMessages(next);
        return next;
      });

      if (authUser && isOnline) {
        void upsertCloudMentorMessage(authUser.uid, outbound);
      } else {
        enqueueMutation({
          id: makeSafeId('mut'),
          kind: 'upsert_mentor_message',
          payload: outbound,
          queuedAtIso: now,
        });
      }

      // Contextual Senior Specialist pod acknowledgment
      window.setTimeout(() => {
        const replyIso = new Date().toISOString();
        const replyMsg: MentorMessage = {
          id: makeSafeId('msg'),
          ownerUid: ownerId,
          sprintId: input.sprintId,
          sprintTitle: input.sprintTitle,
          mentorId: input.mentor.id,
          mentorName: input.mentor.name,
          sender: 'mentor',
          body: buildMentorQuickReply(input.mentor, input.sprintTitle, input.body),
          createdAtIso: replyIso,
          updatedAtIso: replyIso,
        };

        setMentorMessages((prev) => {
          const next = [...prev, replyMsg];
          saveLocalMentorMessages(next);
          return next;
        });

        if (authUser && isOnline) {
          void upsertCloudMentorMessage(authUser.uid, replyMsg);
        } else {
          enqueueMutation({
            id: makeSafeId('mut'),
            kind: 'upsert_mentor_message',
            payload: replyMsg,
            queuedAtIso: replyIso,
          });
        }
      }, 500);
    },
    [authUser, isOnline, profile.uid, enqueueMutation]
  );

  const handleLogMentorshipSession = useCallback(
    (input: LogMentorshipSessionInput) => {
      const now = new Date().toISOString();
      const ownerId = authUser?.uid ?? profile.uid;
      const newSession: MentorshipSession = {
        id: makeSafeId('msess'),
        ownerUid: ownerId,
        sprintId: input.sprintId,
        sprintTitle: input.sprintTitle,
        mentorId: input.mentor.id,
        mentorName: input.mentor.name,
        focusTopic: input.focusTopic,
        durationMinutes: input.durationMinutes,
        status: input.status,
        takeawayNote: input.takeawayNote,
        attendedAtIso: input.scheduledAtIso ?? now,
        createdAtIso: now,
        updatedAtIso: now,
      };

      setMentorshipSessions((prev) => {
        const next = [newSession, ...prev];
        saveLocalMentorshipSessions(next);
        return next;
      });

      if (canWriteCloud && authUser) {
        void upsertCloudMentorshipSession(authUser.uid, newSession);
      } else {
        enqueueMutation({
          id: makeSafeId('mut'),
          kind: 'upsert_mentorship_session',
          payload: newSession,
          queuedAtIso: now,
        });
      }
      announcePolite(
        `${input.status === 'attended' ? 'Attended' : 'Scheduled'} QA session saved for ${input.sprintTitle}.`
      );
    },
    [authUser, canWriteCloud, profile.uid, enqueueMutation, announcePolite]
  );

  const handleMarkSessionAttended = useCallback(
    (sessionId: string) => {
      const now = new Date().toISOString();
      let updatedRecord: MentorshipSession | null = null;
      setMentorshipSessions((prev) => {
        const next = prev.map((s) => {
          if (s.id !== sessionId) return s;
          updatedRecord = {
            ...s,
            status: 'attended',
            attendedAtIso: now,
            updatedAtIso: now,
          };
          return updatedRecord;
        });
        saveLocalMentorshipSessions(next);
        return next;
      });

      if (updatedRecord) {
        if (canWriteCloud && authUser) {
          void upsertCloudMentorshipSession(authUser.uid, updatedRecord);
        } else {
          enqueueMutation({
            id: makeSafeId('mut'),
            kind: 'upsert_mentorship_session',
            payload: updatedRecord,
            queuedAtIso: now,
          });
        }
        announcePolite('Mentorship session marked as attended.');
      }
    },
    [authUser, canWriteCloud, enqueueMutation, announcePolite]
  );

  const handleRequestMentorPairing = useCallback(
    (input: {
      track: MentorshipTrackSpec;
      mentorName: string;
      sprintId?: string;
      sprintTitle?: string;
      preferredCadence: MentorPairingCadence;
      sprintGoals: string;
    }): MentorPairingRequest => {
      const now = new Date().toISOString();
      const newPairing: MentorPairingRequest = {
        id: makeSafeId('pair'),
        ownerUid: profile.uid,
        trackId: input.track.id,
        trackTitle: input.track.title,
        domain: input.track.domain,
        mentorId: input.track.mentorId,
        mentorName: input.mentorName,
        sprintId: input.sprintId || undefined,
        sprintTitle: input.sprintTitle || undefined,
        preferredCadence: input.preferredCadence,
        sprintGoals: input.sprintGoals,
        status: 'requested',
        createdAtIso: now,
        updatedAtIso: now,
      };

      setMentorPairings((prev) => {
        const next = [newPairing, ...prev];
        saveLocalMentorPairings(next);
        return next;
      });

      if (canWriteCloud && authUser) {
        void upsertCloudMentorPairing(authUser.uid, newPairing);
      } else {
        enqueueMutation({
          id: makeSafeId('mut'),
          kind: 'upsert_mentor_pairing',
          payload: newPairing,
          queuedAtIso: now,
        });
      }

      announcePolite(`Formal mentor pairing requested for ${input.track.domain} track.`);
      return newPairing;
    },
    [authUser, canWriteCloud, profile.uid, enqueueMutation, announcePolite]
  );

  const handleDeleteMentorPairing = useCallback(
    (pairingId: string) => {
      const now = new Date().toISOString();
      setMentorPairings((prev) => {
        const next = prev.filter((item) => item.id !== pairingId);
        saveLocalMentorPairings(next);
        return next;
      });

      if (canWriteCloud && authUser) {
        void deleteCloudMentorPairing(authUser.uid, pairingId);
      } else {
        enqueueMutation({
          id: makeSafeId('mut'),
          kind: 'delete_mentor_pairing',
          pairingId,
          queuedAtIso: now,
        });
      }
      announcePolite('Mentor pairing request withdrawn.');
    },
    [authUser, canWriteCloud, enqueueMutation, announcePolite]
  );

  const handleSubmitMentorRating = useCallback(
    (input: {
      track: MentorshipTrackSpec;
      mentorId: string;
      mentorName: string;
      rating: MentorRatingScore;
      comment: string;
    }) => {
      const now = new Date().toISOString();
      const newRating: MentorRating = {
        id: makeSafeId('mrate'),
        ownerUid: authUser?.uid || profile.uid,
        trackId: input.track.id,
        trackTitle: input.track.title,
        domain: input.track.domain,
        mentorId: input.mentorId,
        mentorName: input.mentorName,
        rating: input.rating,
        comment: input.comment.trim().slice(0, 500),
        createdAtIso: now,
        updatedAtIso: now,
      };

      setMentorRatings((prev) => {
        const next = [newRating, ...prev];
        saveLocalMentorRatings(next);
        return next;
      });

      if (canWriteCloud && authUser) {
        void upsertCloudMentorRating(authUser.uid, newRating);
      } else {
        enqueueMutation({
          id: makeSafeId('mut'),
          kind: 'upsert_mentor_rating',
          payload: newRating,
          queuedAtIso: now,
        });
      }

      announcePolite(`Mentor rating (${input.rating}/5) recorded for ${input.mentorName}.`);
      return newRating;
    },
    [authUser, canWriteCloud, profile.uid, enqueueMutation, announcePolite]
  );

  const handleDeleteMentorRating = useCallback(
    (ratingId: string) => {
      const now = new Date().toISOString();
      setMentorRatings((prev) => {
        const next = prev.filter((item) => item.id !== ratingId);
        saveLocalMentorRatings(next);
        return next;
      });

      if (canWriteCloud && authUser) {
        void deleteCloudMentorRating(authUser.uid, ratingId);
      } else {
        enqueueMutation({
          id: makeSafeId('mut'),
          kind: 'delete_mentor_rating',
          ratingId,
          queuedAtIso: now,
        });
      }
      announcePolite('Mentor rating removed.');
    },
    [authUser, canWriteCloud, enqueueMutation, announcePolite]
  );

  const handleToggleTrackObjective = useCallback(
    (trackId: string, objectiveId: string): MentorshipTrackProgressRecord => {
      const now = new Date().toISOString();
      const currentRecord = mentorshipTrackProgress.find((item) => item.trackId === trackId);
      const nextCompletedIds = toggleObjectiveCompletion(
        currentRecord?.completedObjectiveIds || [],
        objectiveId
      );

      const updatedRecord: MentorshipTrackProgressRecord = {
        id: trackId,
        ownerUid: authUser?.uid || profile.uid,
        trackId,
        completedObjectiveIds: nextCompletedIds,
        createdAtIso: currentRecord?.createdAtIso || now,
        updatedAtIso: now,
      };

      setMentorshipTrackProgress((prev) => {
        const filtered = prev.filter((item) => item.trackId !== trackId);
        const next = [updatedRecord, ...filtered];
        saveLocalMentorshipTrackProgress(next);
        return next;
      });

      if (canWriteCloud && authUser) {
        void upsertCloudMentorshipTrackProgress(authUser.uid, updatedRecord);
      } else {
        enqueueMutation({
          id: makeSafeId('mut'),
          kind: 'upsert_track_progress',
          payload: updatedRecord,
          queuedAtIso: now,
        });
      }

      const isMastered = nextCompletedIds.includes(objectiveId);
      announcePolite(
        isMastered
          ? 'Learning objective marked as mastered and synced with Mentorship Progress Bar.'
          : 'Learning objective marked as in progress.'
      );
      return updatedRecord;
    },
    [authUser, canWriteCloud, mentorshipTrackProgress, profile.uid, enqueueMutation, announcePolite]
  );

  const handleAwardMenteeBadge = useCallback(
    (
      draft: Omit<MenteeCompetencyBadge, 'id' | 'ownerUid' | 'createdAtIso' | 'updatedAtIso'>
    ): MenteeCompetencyBadge => {
      const now = new Date().toISOString();
      const created: MenteeCompetencyBadge = {
        id: makeSafeId('mbadge'),
        ownerUid: authUser?.uid || profile.uid,
        ...draft,
        createdAtIso: now,
        updatedAtIso: now,
      };

      setMenteeCompetencyBadges((prev) => {
        const next = [created, ...prev];
        saveLocalMenteeCompetencyBadges(next);
        return next;
      });

      if (canWriteCloud && authUser) {
        void upsertCloudMenteeCompetencyBadge(authUser.uid, created);
      } else {
        enqueueMutation({
          id: makeSafeId('mut'),
          kind: 'upsert_mentee_badge',
          payload: created,
          queuedAtIso: now,
        });
      }

      announcePolite(
        `Digital Skill Badge "${created.badgeTitle}" awarded by ${created.mentorName} and added to your Competency Passport.`
      );
      return created;
    },
    [authUser, canWriteCloud, profile.uid, enqueueMutation, announcePolite]
  );

  const handleDeleteMenteeBadge = useCallback(
    (badgeId: string) => {
      const now = new Date().toISOString();
      setMenteeCompetencyBadges((prev) => {
        const next = prev.filter((item) => item.id !== badgeId);
        saveLocalMenteeCompetencyBadges(next);
        return next;
      });

      if (canWriteCloud && authUser) {
        void deleteCloudMenteeCompetencyBadge(authUser.uid, badgeId);
      } else {
        enqueueMutation({
          id: makeSafeId('mut'),
          kind: 'delete_mentee_badge',
          badgeId,
          queuedAtIso: now,
        });
      }
      announcePolite('Digital skill badge removed from Competency Passport.');
    },
    [authUser, canWriteCloud, enqueueMutation, announcePolite]
  );

  const handleSubmitMilestoneFeedback = useCallback(
    (
      draft: Omit<MentorMilestoneFeedback, 'id' | 'ownerUid' | 'createdAtIso' | 'updatedAtIso'>
    ): MentorMilestoneFeedback => {
      const now = new Date().toISOString();
      const existing = mentorMilestoneFeedback.find(
        (item) => item.sprintId === draft.sprintId && item.milestoneKey === draft.milestoneKey
      );
      const record: MentorMilestoneFeedback = {
        id: existing?.id || makeSafeId('mmfb'),
        ownerUid: authUser?.uid || profile.uid,
        ...draft,
        createdAtIso: existing?.createdAtIso || now,
        updatedAtIso: now,
      };

      setMentorMilestoneFeedback((prev) => {
        const filtered = prev.filter((item) => item.id !== record.id);
        const next = [record, ...filtered];
        saveLocalMentorMilestoneFeedback(next);
        return next;
      });

      if (canWriteCloud && authUser) {
        void upsertCloudMentorMilestoneFeedback(authUser.uid, record);
      } else {
        enqueueMutation({
          id: makeSafeId('mut'),
          kind: 'upsert_milestone_feedback',
          payload: record,
          queuedAtIso: now,
        });
      }

      announcePolite(
        `Milestone review (${record.rating}/5) recorded by ${record.mentorName} for ${record.sprintTitle}.`
      );
      return record;
    },
    [authUser, canWriteCloud, mentorMilestoneFeedback, profile.uid, enqueueMutation, announcePolite]
  );

  const handleDeleteMilestoneFeedback = useCallback(
    (feedbackId: string) => {
      const now = new Date().toISOString();
      setMentorMilestoneFeedback((prev) => {
        const next = prev.filter((item) => item.id !== feedbackId);
        saveLocalMentorMilestoneFeedback(next);
        return next;
      });

      if (canWriteCloud && authUser) {
        void deleteCloudMentorMilestoneFeedback(authUser.uid, feedbackId);
      } else {
        enqueueMutation({
          id: makeSafeId('mut'),
          kind: 'delete_milestone_feedback',
          feedbackId,
          queuedAtIso: now,
        });
      }
      announcePolite('Mentor milestone review removed.');
    },
    [authUser, canWriteCloud, enqueueMutation, announcePolite]
  );

  const handleSaveSessionAgenda = useCallback(
    (agenda: MentorshipSessionAgendaRecord): MentorshipSessionAgendaRecord => {
      const now = new Date().toISOString();
      const ownerUid = authUser?.uid ?? profile.uid;
      const existing = mentorshipSessionAgendas.find((item) => item.id === agenda.id);

      const record: MentorshipSessionAgendaRecord = {
        id: existing ? existing.id : agenda.id || makeSafeId('magenda'),
        ownerUid,
        sprintId: agenda.sprintId.trim().slice(0, 120),
        sprintTitle: agenda.sprintTitle.trim().slice(0, 160),
        mentorId: agenda.mentorId.trim().slice(0, 120),
        mentorName: agenda.mentorName.trim().slice(0, 80),
        sessionId: agenda.sessionId ? agenda.sessionId.trim().slice(0, 120) : undefined,
        sessionDateIso: agenda.sessionDateIso.trim().slice(0, 40),
        focusTopic: agenda.focusTopic,
        agendaTitle: agenda.agendaTitle.trim().slice(0, 140),
        desiredOutcome: agenda.desiredOutcome.trim().slice(0, 400),
        agendaItems: agenda.agendaItems.slice(0, 10),
        completedItemIndices: agenda.completedItemIndices.slice(0, 10),
        sharedWithMentor: Boolean(agenda.sharedWithMentor),
        createdAtIso: existing ? existing.createdAtIso : agenda.createdAtIso || now,
        updatedAtIso: now,
      };

      setMentorshipSessionAgendas((prev) => {
        const filtered = prev.filter((item) => item.id !== record.id);
        const next = [record, ...filtered].sort((a, b) =>
          b.updatedAtIso.localeCompare(a.updatedAtIso)
        );
        saveLocalMentorshipSessionAgendas(next);
        return next;
      });

      if (canWriteCloud && authUser) {
        void upsertCloudMentorshipSessionAgenda(authUser.uid, record);
      } else {
        enqueueMutation({
          id: makeSafeId('mut'),
          kind: 'upsert_session_agenda',
          payload: record,
          queuedAtIso: now,
        });
      }

      announcePolite(
        record.sharedWithMentor
          ? `Session agenda "${record.agendaTitle}" saved and shared with ${record.mentorName}.`
          : `Session agenda "${record.agendaTitle}" saved.`
      );
      return record;
    },
    [authUser, canWriteCloud, mentorshipSessionAgendas, profile.uid, enqueueMutation, announcePolite]
  );

  const handleDeleteSessionAgenda = useCallback(
    (agendaId: string) => {
      const now = new Date().toISOString();
      setMentorshipSessionAgendas((prev) => {
        const next = prev.filter((item) => item.id !== agendaId);
        saveLocalMentorshipSessionAgendas(next);
        return next;
      });

      if (canWriteCloud && authUser) {
        void deleteCloudMentorshipSessionAgenda(authUser.uid, agendaId);
      } else {
        enqueueMutation({
          id: makeSafeId('mut'),
          kind: 'delete_session_agenda',
          agendaId,
          queuedAtIso: now,
        });
      }
      announcePolite('Mentorship session agenda removed.');
    },
    [authUser, canWriteCloud, enqueueMutation, announcePolite]
  );

  const handleSaveMentorPeerReview = useCallback(
    (
      draft: Omit<
        MentorPeerReviewRecord,
        'id' | 'ownerUid' | 'createdAtIso' | 'updatedAtIso'
      >
    ): MentorPeerReviewRecord => {
      const now = new Date().toISOString();
      const ownerUid = authUser?.uid ?? profile.uid;
      const record: MentorPeerReviewRecord = {
        id: makeSafeId('mprev'),
        ownerUid,
        sprintId: draft.sprintId.trim().slice(0, 120),
        sprintTitle: draft.sprintTitle.trim().slice(0, 160),
        mentorId: draft.mentorId.trim().slice(0, 120),
        mentorName: draft.mentorName.trim().slice(0, 80),
        mentorRole: draft.mentorRole.trim().slice(0, 120),
        reviewedDate: draft.reviewedDate.trim().slice(0, 40) || now.slice(0, 10),
        cohesionScore: draft.cohesionScore,
        framingScore: draft.framingScore,
        communicationScore: draft.communicationScore,
        feedbackText: draft.feedbackText.trim().slice(0, 1000),
        recommendedAction: draft.recommendedAction.trim().slice(0, 400),
        createdAtIso: now,
        updatedAtIso: now,
      };

      setMentorPeerReviews((prev) => {
        const next = [record, ...prev];
        saveLocalMentorPeerReviews(next);
        return next;
      });

      if (canWriteCloud && authUser) {
        void upsertCloudMentorPeerReview(authUser.uid, record);
      } else {
        enqueueMutation({
          id: makeSafeId('mut'),
          kind: 'upsert_mentor_peer_review',
          payload: record,
          queuedAtIso: now,
        });
      }

      announcePolite(`Formative mentor review by ${record.mentorName} saved.`);
      return record;
    },
    [authUser, canWriteCloud, profile.uid, enqueueMutation, announcePolite]
  );

  const handleDeleteMentorPeerReview = useCallback(
    (reviewId: string) => {
      const now = new Date().toISOString();
      setMentorPeerReviews((prev) => {
        const next = prev.filter((item) => item.id !== reviewId);
        saveLocalMentorPeerReviews(next);
        return next;
      });

      if (canWriteCloud && authUser) {
        void deleteCloudMentorPeerReview(authUser.uid, reviewId);
      } else {
        enqueueMutation({
          id: makeSafeId('mut'),
          kind: 'delete_mentor_peer_review',
          reviewId,
          queuedAtIso: now,
        });
      }

      announcePolite('Mentor peer review removed.');
    },
    [authUser, canWriteCloud, enqueueMutation, announcePolite]
  );

  const handleApplyCohortPreset = (blueprint: CohortBlueprintPreview) => {
    updateProfileState({
      ...profile,
      preferredLocale: blueprint.languageCode,
      updatedAtIso: new Date().toISOString(),
    });
    handleUpdateVault({
      ...vault,
      payoutRail: blueprint.payoutRail,
      payoutCompleted: true,
    });
  };

  const verifiedCapabilitiesCount = capabilities.filter(
    (c) => c.verificationStatus !== 'pending'
  ).length;

  const scaleDrawerElement = (
    <PartnerScaleDrawer
      isOpen={isScaleDrawerOpen}
      onClose={() => setIsScaleDrawerOpen(false)}
      currentLocale={profile.preferredLocale}
      userAgeStage={profile.ageStage}
      verifiedCapabilitiesCount={verifiedCapabilitiesCount}
      onApplyCohortPreset={handleApplyCohortPreset}
    />
  );

  const hasCompletedCoreTabs =
    (verifiedCapabilitiesCount > 0 || Boolean(passport)) &&
    isComplianceClearedForWork(vault) &&
    (contributions.some((c) => c.status === 'completed') ||
      proofPortfolio.images.length > 0 ||
      Boolean(proofPortfolio.analysis));

  const commandPaletteElement = (
    <CommandPalette
      isOpen={isCommandPaletteOpen}
      activeTab={activeTab}
      theme={profile.themePreference}
      activePortal={activePortal}
      viewMode={viewMode}
      hasCompletedCoreTabs={hasCompletedCoreTabs}
      isBuilderVerified={isBuilderTwoFactorVerified}
      isOnline={isOnline}
      activePartnerTab={partnerConsoleTab}
      sprints={postedSprints}
      onClose={() => setIsCommandPaletteOpen(false)}
      onNavigateTab={(tab) => {
        navigateBuilderTab(tab);
      }}
      onNavigatePartnerTab={(tab) => {
        setPartnerConsoleTab(tab);
        announcePolite(`Partner Console ${tab} tab opened.`);
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }}
      onSelectSprint={(briefId) => {
        navigateBuilderTab('solve', {
          postAction: () => setSelectedBriefId(briefId),
        });
      }}
      onGoHome={() => {
        if (viewMode === 'studio' || activeAuthSession) {
          void handleLockAndExitToLanding('command-palette-home');
        } else {
          setViewMode('landing');
        }
      }}
      onTriggerVoiceToText={() => {
        navigateBuilderTab('verify', {
          postAction: () => setVoiceTriggerSignal((n) => n + 1),
        });
      }}
      onTriggerSharePassport={() => {
        navigateBuilderTab('verify', {
          postAction: () => setSharePassportSignal((n) => n + 1),
        });
      }}
      onOpenComplianceCrossing={() => {
        navigateBuilderTab('unlock', {
          postAction: () => {
            window.setTimeout(() => {
              document
                .getElementById('compliance-crossing-section')
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 80);
          },
        });
      }}
      onOpenScaleDrawer={() => setIsScaleDrawerOpen(true)}
      onOpenGlossary={() => setIsGlossaryOpen(true)}
      onOpenBibliography={() => setIsBibliographyOpen(true)}
      onOpenAccessComfort={() => setIsAccessDrawerOpen(true)}
      onOpenPdfPreview={(doc) => setActivePdfPreview(doc)}
      onToggleTheme={handleToggleTheme}
    />
  );

  const srAnnouncerElement = (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-testid="vuka-sr-announcer"
      className="sr-only"
    >
      {srAnnouncement}
    </div>
  );

  const skipToMainLink = (
    <a
      href="#main-content"
      data-testid="skip-to-main-link"
      className="vuka-skip-link"
    >
      Skip to Main Content
    </a>
  );

  const readAloudMiniBarElement = (
    <ReadAloudMiniBar
      readAloud={readAloud}
      onOpenSettings={() => setIsAccessDrawerOpen(true)}
    />
  );

  const accessComfortDrawerElement = (
    <AccessComfortDrawer
      isOpen={isAccessDrawerOpen}
      preferences={accessPrefs}
      readAloud={readAloud}
      localeLabel={localeMeta.nativeLabel}
      onUpdate={handleUpdateAccessPrefs}
      onReset={handleResetAccessPrefs}
      onClose={() => setIsAccessDrawerOpen(false)}
    />
  );

  const glossaryModalElement = (
    <GlossaryModal
      isOpen={isGlossaryOpen}
      activePortal={activePortal}
      viewMode={viewMode}
      onClose={() => setIsGlossaryOpen(false)}
      onJumpBuilderTab={(tab) => {
        navigateBuilderTab(tab);
      }}
      onJumpPartnerTab={(tab) => {
        setPartnerConsoleTab(tab);
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }}
    />
  );

  const bibliographyModalElement = (
    <BibliographyModal
      isOpen={isBibliographyOpen}
      onClose={() => setIsBibliographyOpen(false)}
      onOpenPdfPreview={(doc) => setActivePdfPreview(doc)}
    />
  );

  const judgeGuidePdfModalElement = (
    <JudgeGuidePdfModal
      isOpen={Boolean(activePdfPreview)}
      document={activePdfPreview}
      onClose={() => setActivePdfPreview(null)}
    />
  );

  const activeSyncedEmail = authUser?.email ?? emailVaultStatus?.email ?? (profile.email || null);
  const activeSyncedName =
    authUser?.displayName ?? emailVaultStatus?.displayName ?? (activeSyncedEmail ? profile.displayName : null);

  useAutoSave({
    key: 'builder_studio_workspace',
    data: {
      profile,
      capabilities,
      contributions,
      passport,
      vault,
      proofPortfolio,
      sprintMilestonesByBrief,
    },
    debounceMs: 5000,
    enabled: viewMode === 'studio' && activePortal === 'talent',
    syncedEmail: activeSyncedEmail,
    authToken: activeAuthSession?.realm === 'talent' ? activeAuthSession.token : null,
  });

  const accountSyncModalElement = (
    <AccountSyncModal
      isOpen={isAccountSyncOpen}
      onClose={() => setIsAccountSyncOpen(false)}
      user={authUser}
      defaultEmail={activeSyncedEmail || ''}
      defaultDisplayName={profile.displayName}
      emailVaultStatus={emailVaultStatus}
      isOnline={isOnline}
      isSyncing={isSyncing}
      queuedCount={offlineQueue.length}
      lastSyncedIso={lastSyncedIso}
      authError={authError}
      onClearError={() => setAuthError(null)}
      onSignInWithProvider={handleProviderSignIn}
      onSignInWithEmail={handleEmailSignIn}
      onRegisterWithEmail={handleEmailRegister}
      onSendPasswordReset={handleSendPasswordReset}
      onResendVerification={handleResendVerification}
      onRefreshVerificationAndSync={handleRefreshVerificationAndSync}
      onLinkProvider={handleLinkProvider}
      onSignOut={handleSignOut}
      onSyncToEmailVault={handleSyncToEmailVault}
      onRestoreFromEmailVault={handleRestoreFromEmailVault}
    />
  );

  const globalToastElement = (
    <AnimatePresence mode="wait">
      {globalToast && (
        <motion.div
          key={globalToast.id}
          role="status"
          aria-live="polite"
          data-testid="global-connection-toast"
          data-toast-variant={globalToast.variant}
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98, transition: { duration: 0.14 } }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          className={`fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 max-w-sm w-[calc(100vw-2rem)] rounded-2xl bg-white dark:bg-[#1A1C20] shadow-xl p-4 border ${
            globalToast.variant === 'offline'
              ? 'border-[#C4622D]/40 dark:border-[#E07B46]/45'
              : 'border-[#146C53]/40 dark:border-[#2EB88B]/45'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                globalToast.variant === 'offline'
                  ? 'bg-[#F9ECE5] dark:bg-[#2D1E17] text-[#C4622D] dark:text-[#E07B46]'
                  : 'bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B]'
              }`}
            >
              {globalToast.variant === 'offline' ? (
                <WifiOff className="w-4 h-4" />
              ) : globalToast.variant === 'syncing' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={`text-xs font-semibold ${
                  globalToast.variant === 'offline'
                    ? 'text-[#C4622D] dark:text-[#E07B46]'
                    : 'text-[#146C53] dark:text-[#2EB88B]'
                }`}
              >
                {globalToast.title}
              </p>
              <p className="mt-0.5 text-xs text-[#43484E] dark:text-[#C4C9D0] leading-relaxed">
                {globalToast.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setGlobalToast(null)}
              aria-label="Dismiss connection notification"
              data-testid="dismiss-global-toast-btn"
              className="min-h-[28px] min-w-[28px] rounded-lg text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] inline-flex items-center justify-center shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (sharedPassportView) {
    return (
      <MotionConfig reducedMotion={accessPrefs.reducedMotion ? 'always' : 'user'}>
        {srAnnouncerElement}
        {skipToMainLink}
        {readAloudMiniBarElement}
        <SharedPassportView
          payload={sharedPassportView}
          onExit={() => {
            setSharedPassportView(null);
            if (typeof window !== 'undefined' && window.location.search.includes('passport=')) {
              window.history.replaceState({}, '', window.location.pathname);
            }
            if (viewMode === 'landing' && activeAuthSession) {
              void handleLockAndExitToLanding('shared-passport-exit');
            }
          }}
        />
        {accessComfortDrawerElement}
        {globalToastElement}
      </MotionConfig>
    );
  }

  const dualDoorModalElement = (
    <DualDoorAuthModal
      isOpen={dualDoorModal.isOpen}
      initialDoor={dualDoorModal.door}
      ageStage={dualDoorModal.pendingPayload?.ageStage ?? profile.ageStage}
      defaultDisplayName={profile.displayName}
      activeSession={activeAuthSession}
      pendingRedirectTab={pendingRedirectTab}
      onClose={() => {
        setPendingRedirectTab(null);
        pendingPostAuthActionRef.current = null;
        setDualDoorModal((prev) => ({ ...prev, isOpen: false }));
      }}
      onAuthenticated={handleDualDoorAuthenticated}
    />
  );

  const topPwaSyncBar = (
    <PwaSyncStatusBar
      isOnline={isOnline}
      isSyncing={isSyncing}
      queuedCount={offlineQueue.length}
      syncProgress={syncProgress.percent}
      syncCompletedCount={syncProgress.completed}
      syncTotalCount={syncProgress.total}
      onSyncNow={handleSyncNow}
    />
  );

  if (viewMode === 'landing') {
    return (
      <MotionConfig reducedMotion={accessPrefs.reducedMotion ? 'always' : 'user'}>
        {srAnnouncerElement}
        {skipToMainLink}
        {topPwaSyncBar}
        {readAloudMiniBarElement}
        <LandingFunnel
          initialProblem={profile.problemStatement}
          initialStage={profile.ageStage}
          locale={profile.preferredLocale}
          speechLang={localeMeta.speechLang}
          theme={profile.themePreference}
          isOnline={isOnline}
          onChangeLocale={handleChangeLocale}
          onToggleTheme={handleToggleTheme}
          onBeginCrossing={(payload) => handleOpenDualDoorFromLanding('talent', payload, 'verify')}
          onOpenHiringPartners={(payload) =>
            handleOpenDualDoorFromLanding('partner', payload, 'unlock')
          }
          onEnterStudio={(payload) => handleOpenDualDoorFromLanding('talent', payload, 'verify')}
          onPreviewCleared={(payload) =>
            navigateBuilderTab('cleared', { fromLandingPayload: payload })
          }
          onDraftChange={(payload) => {
            landingDraftRef.current = payload;
          }}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenAccessComfort={() => setIsAccessDrawerOpen(true)}
          hasCustomAccessComfort={isCustomAccessComfort}
          onOpenScaleDrawer={() => setIsScaleDrawerOpen(true)}
          t={t}
        />
        {dualDoorModalElement}
        {scaleDrawerElement}
        {commandPaletteElement}
        {accessComfortDrawerElement}
        {glossaryModalElement}
        {bibliographyModalElement}
        {judgeGuidePdfModalElement}
        {globalToastElement}
      </MotionConfig>
    );
  }

  if (activePortal === 'partner') {
    return (
      <MotionConfig reducedMotion={accessPrefs.reducedMotion ? 'always' : 'user'}>
        <MessagingProvider
          messages={mentorMessages}
          mentorshipSessions={mentorshipSessions}
          milestoneFeedback={mentorMilestoneFeedback}
          sessionAgendas={mentorshipSessionAgendas}
          onSendMessage={handleSendMentorMessage}
          onLogMentorshipSession={handleLogMentorshipSession}
          onMarkSessionAttended={handleMarkSessionAttended}
          onSubmitMilestoneFeedback={handleSubmitMilestoneFeedback}
          onDeleteMilestoneFeedback={handleDeleteMilestoneFeedback}
          onSaveSessionAgenda={handleSaveSessionAgenda}
          onDeleteSessionAgenda={handleDeleteSessionAgenda}
        >
          {srAnnouncerElement}
          {skipToMainLink}
          {topPwaSyncBar}
          {readAloudMiniBarElement}
          <PartnerConsoleView
            activeSession={activeAuthSession}
            sprints={postedSprints}
            onPostSprint={(newSprint) => {
              const fallbackBrief: ProblemBrief = {
                id: `brief_${Date.now()}`,
                ...newSprint,
              };
              const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'X-Requested-With': 'VukaNaAmana',
              };
              if (activeAuthSession?.token) {
                headers.Authorization = `Bearer ${activeAuthSession.token}`;
              }
              void fetch('/api/partner/sprints', {
                method: 'POST',
                credentials: 'same-origin',
                headers,
                body: JSON.stringify(newSprint),
              })
                .then(async (res) => {
                  if (res.ok) {
                    const data = (await res.json()) as { sprint?: ProblemBrief };
                    const created = data.sprint ?? fallbackBrief;
                    setPostedSprints((prev) => [
                      created,
                      ...prev.filter((item) => item.id !== created.id),
                    ]);
                  } else {
                    setPostedSprints((prev) => [fallbackBrief, ...prev]);
                  }
                })
                .catch(() => {
                  setPostedSprints((prev) => [fallbackBrief, ...prev]);
                });
              announcePolite('New solution sprint published live to Builder Studio Tab 3.');
              setGlobalToast({
                id: `sprint-posted-${Date.now()}`,
                variant: 'synced',
                title: 'Solution Sprint Published Live',
                message: `"${newSprint.title}" is now visible to Skilled Builders in Tab 3 [Solve].`,
              });
            }}
            consentedGrants={consentGrants}
            auditLogs={accessAuditLogs}
            issuedContractsByGrantId={issuedContractsByGrantId}
            verificationsByGrantId={partnerVerifications}
            applicantFeedback={partnerApplicantFeedback}
            internalNotes={partnerInternalNotes}
            onUpdateVerificationStep={(consentId, stepId, status, reviewerNote) => {
              void handleUpdateVerificationStep(consentId, stepId, status, reviewerNote);
            }}
            onSendApplicantFeedback={(input) => {
              void handleSendApplicantFeedback(input);
            }}
            onAddInternalNote={(input) => {
              void handleAddPartnerInternalNote(input);
            }}
            onDeleteInternalNote={(noteId) => {
              void handleDeletePartnerInternalNote(noteId);
            }}
            onIssueContract={(grantId, bridgeType = 'direct-local') => {
              const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'X-Requested-With': 'VukaNaAmana',
              };
              if (activeAuthSession?.token) {
                headers.Authorization = `Bearer ${activeAuthSession.token}`;
              }
              void fetch('/api/partner/contracts/issue', {
                method: 'POST',
                credentials: 'same-origin',
                headers,
                body: JSON.stringify({ grantId, bridgeType }),
              })
                .then(async (res) => {
                  if (!res.ok) {
                    const errBody = (await res.json().catch(() => ({}))) as { error?: string };
                    setGlobalToast({
                      id: `contract-err-${Date.now()}`,
                      variant: 'offline',
                      title: 'Contract Issuance Blocked',
                      message:
                        errBody.error ||
                        'This Consent Grant is no longer active or has been revoked by the builder.',
                    });
                    await fetchGrantsAndLogs();
                    return;
                  }
                  const data = (await res.json()) as {
                    contract?: {
                      grantId: string;
                      contractRef: string;
                      bridgeType: string;
                      issuedAtIso: string;
                    };
                  };
                  if (data.contract) {
                    setIssuedContractsByGrantId((prev) => ({
                      ...prev,
                      [data.contract!.grantId]: {
                        contractRef: data.contract!.contractRef,
                        bridgeType: data.contract!.bridgeType,
                        issuedAtIso: data.contract!.issuedAtIso,
                      },
                    }));
                    announcePolite(
                      `Compliant sprint contract ${data.contract.contractRef} issued. SDG Impact Pulse updated.`
                    );
                    setGlobalToast({
                      id: `contract-issued-${Date.now()}`,
                      variant: 'synced',
                      title: 'Compliant Sprint Contract & Escrow Active',
                      message: `Agreement ${data.contract.contractRef} for ${grantId} is finalized and logged. SDGs 8, 16, and 17 updated.`,
                    });
                  }
                  await fetchGrantsAndLogs();
                })
                .catch(() => {
                  const localRef = `VNA-CTR-${Date.now().toString(36).toUpperCase().slice(-6)}`;
                  setIssuedContractsByGrantId((prev) => ({
                    ...prev,
                    [grantId]: {
                      contractRef: localRef,
                      bridgeType,
                      issuedAtIso: new Date().toISOString(),
                    },
                  }));
                  announcePolite('Compliant sprint contract issued locally.');
                });
            }}
            telemetry={{
              sdg4Count: Math.max(1, capabilities.length + lockedBridges.length),
              sdg8Count: postedSprints.length + contributions.length,
              sdg10Count: Math.max(
                1,
                consentGrants.filter((g) => g.status === 'active').length +
                  Object.keys(issuedContractsByGrantId).length
              ),
              sdg16Count: Math.max(1, accessAuditLogs.length),
              sdg17Count: Object.keys(issuedContractsByGrantId).length,
              totalStipendDisbursedUsd:
                payouts.reduce((sum, p) => sum + (p.amountUsd || 0), 0) +
                postedSprints.reduce((sum, s) => sum + (s.payoutUsd || 0), 0),
              activeSprintsCount: postedSprints.length,
              clearedTalentCount: consentGrants.filter((g) => g.status === 'active').length,
            }}
            activeTab={partnerConsoleTab}
            onSelectTab={(tab) => {
              setPartnerConsoleTab(tab);
              if (tab === 'talent' || tab === 'compliance' || tab === 'impact') {
                void fetchGrantsAndLogs();
                void fetchPartnerContracts();
                void fetchPartnerVerificationState();
              }
              announcePolite(`Partner Console ${tab} tab opened.`);
            }}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onOpenAccessComfort={() => setIsAccessDrawerOpen(true)}
            hasCustomAccessComfort={isCustomAccessComfort}
            onSwitchToTalentDoor={() => void handleSwitchToTalentDoor()}
            onBackToHome={() => void handleLockAndExitToLanding('partner-home')}
            onEndSession={(details) => void handleLockAndExitToLanding('partner-end-session', details)}
            theme={profile.themePreference}
            onToggleTheme={handleToggleTheme}
            t={t}
          />
          {dualDoorModalElement}
          {scaleDrawerElement}
          {commandPaletteElement}
          {accessComfortDrawerElement}
          {glossaryModalElement}
          {bibliographyModalElement}
          {judgeGuidePdfModalElement}
          {globalToastElement}
        </MessagingProvider>
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion={accessPrefs.reducedMotion ? 'always' : 'user'}>
      <MessagingProvider
        messages={mentorMessages}
        mentorshipSessions={mentorshipSessions}
        milestoneFeedback={mentorMilestoneFeedback}
        sessionAgendas={mentorshipSessionAgendas}
        onSendMessage={handleSendMentorMessage}
        onLogMentorshipSession={handleLogMentorshipSession}
        onMarkSessionAttended={handleMarkSessionAttended}
        onSubmitMilestoneFeedback={handleSubmitMilestoneFeedback}
        onDeleteMilestoneFeedback={handleDeleteMilestoneFeedback}
        onSaveSessionAgenda={handleSaveSessionAgenda}
        onDeleteSessionAgenda={handleDeleteSessionAgenda}
      >
        <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#121315] text-[#17191C] dark:text-[#F4F2EE] pb-24 md:pb-12 overflow-x-clip">
          {srAnnouncerElement}
          {skipToMainLink}
          <TopNav
            activeTab={activeTab}
            onSelectTab={(tab) => navigateBuilderTab(tab)}
            activePortal={activePortal}
            activeSession={activeAuthSession}
            userEmail={activeSyncedEmail}
            userDisplayName={activeSyncedName}
            isOnline={isOnline}
            isSyncing={isSyncing}
            queuedCount={offlineQueue.length}
            syncProgress={syncProgress.percent}
            syncCompletedCount={syncProgress.completed}
            syncTotalCount={syncProgress.total}
            lastSyncedIso={lastSyncedIso}
            onSyncNow={handleSyncNow}
            onSignIn={handleOpenAccountSync}
            onSignOut={handleSignOut}
            onSwitchPortal={(target) =>
              target === 'talent'
                ? void handleSwitchToTalentDoor()
                : void handleWipePortalSession(target)
            }
            onSignOutPortal={() => void handleLockAndExitToLanding('topnav-signout')}
            onBackToHome={() => void handleLockAndExitToLanding('topnav-home')}
            onOpenScaleDrawer={() => setIsScaleDrawerOpen(true)}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onOpenAccessComfort={() => setIsAccessDrawerOpen(true)}
            hasCustomAccessComfort={isCustomAccessComfort}
            t={t}
          />

          {readAloudMiniBarElement}

          <WorkspaceUtilities
            locale={profile.preferredLocale}
            onChangeLocale={handleChangeLocale}
            theme={profile.themePreference}
            onToggleTheme={handleToggleTheme}
            isOnline={isOnline}
            queuedCount={offlineQueue.length}
            isSignedIn={Boolean(authUser || activeSyncedEmail)}
            isSyncing={isSyncing}
            lastSyncedIso={lastSyncedIso}
            userEmail={activeSyncedEmail}
            userDisplayName={activeSyncedName}
            activePortal={activePortal}
            activeSession={activeAuthSession}
            onSyncNow={handleSyncNow}
            onOpenAccountSync={handleOpenAccountSync}
            onOpenAccessComfort={() => setIsAccessDrawerOpen(true)}
            onOpenPrivacyModal={() => {
              setIsPrivacyModalOpen(true);
              void fetchGrantsAndLogs();
            }}
            hasCustomAccessComfort={isCustomAccessComfort}
            onEndSession={(details) => void handleLockAndExitToLanding('builder-end-session', details)}
            t={t}
          />

          <main id="main-content" tabIndex={-1} className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10">
          {incomingEndorseToken && !endorseBannerDismissed && (
            <div
              role="status"
              className="mb-6 rounded-2xl border border-[#146C53]/30 dark:border-[#2EB88B]/35 bg-[#E7F3EE]/80 dark:bg-[#142B24]/85 px-4 sm:px-5 py-3.5 text-xs sm:text-sm text-[#17191C] dark:text-[#F4F2EE] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <span>
                <strong className="text-[#146C53] dark:text-[#2EB88B]">
                  Peer Endorsement Link Opened:
                </strong>{' '}
                Confirming <em>{incomingEndorseSkill || 'problem-solving capability'}</em> below in the Peer Endorsements section.
              </span>
              <button
                type="button"
                onClick={() => setEndorseBannerDismissed(true)}
                className="text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] underline self-start sm:self-center shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {authError && (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] px-4 py-3 text-sm text-[#B42318] dark:text-[#F97066] flex items-center justify-between gap-4"
            >
              <span>{authError}</span>
              <button
                type="button"
                onClick={() => setAuthError(null)}
                className="text-xs font-medium underline"
              >
                Dismiss
              </button>
            </div>
          )}

          <StageSequenceDisclaimer
            activeTab={activeTab}
            hasVerifiedSkills={
              Boolean(passport) ||
              capabilities.some((c) => c.verificationStatus !== 'pending')
            }
            isVaultReady={
              vault.identityCompleted &&
              vault.contractCompleted &&
              vault.payoutCompleted
            }
            hasActiveOrCompletedSprint={contributions.length > 0}
            onNavigateTab={(tab) => navigateBuilderTab(tab)}
          />

          {activeTab === 'verify' && (
            <VerifyView
              profile={profile}
              capabilities={capabilities}
              contributions={contributions}
              passport={passport}
              endorsements={endorsements}
              menteeBadges={menteeCompetencyBadges}
              isOnline={isOnline}
              speechLang={localeMeta.speechLang}
              t={t}
              onUpdateProfileFocus={handleUpdateProfileFocus}
              onAddCapability={handleAddCapability}
              onPromoteCapability={handlePromoteCapability}
              onDeleteCapability={handleDeleteCapability}
              onSavePassport={handleSavePassport}
              onTogglePassportStipend={handleTogglePassportStipend}
              onImportPassportSkills={handleImportPassportSkills}
              onRequestEndorsement={handleRequestEndorsement}
              onCompleteEndorsement={handleCompleteEndorsement}
              onDeleteEndorsement={handleDeleteEndorsement}
              onAwardMenteeBadge={handleAwardMenteeBadge}
              onDeleteMenteeBadge={handleDeleteMenteeBadge}
              onPreviewSharedPassport={(payload) => setSharedPassportView(payload)}
              sharePassportSignal={sharePassportSignal}
              voiceTriggerSignal={voiceTriggerSignal}
            />
          )}

          {activeTab === 'unlock' && (
            <UnlockView
              profile={profile}
              capabilities={capabilities}
              contributions={contributions}
              passport={passport}
              vault={vault}
              endorsements={endorsements}
              payouts={payouts}
              vaultViewMode={unlockViewMode}
              speechLang={localeMeta.speechLang}
              t={t}
              onChangeVaultViewMode={setUnlockViewMode}
              onUpdateVault={handleUpdateVault}
              onRequestEndorsement={handleRequestEndorsement}
              onDeleteEndorsement={handleDeleteEndorsement}
              onAcceptBrief={handleAcceptBrief}
              onOpenSolve={(briefId) => {
                setSelectedBriefId(briefId);
                navigateBuilderTab('solve');
              }}
              activeGrants={consentGrants.filter((g) => g.status === 'active')}
              partnerVerifications={partnerVerifications}
              partnerFeedback={partnerApplicantFeedback}
              onNavigateStage={(tab) => navigateBuilderTab(tab)}
            />
          )}

          {activeTab === 'solve' && (
            <SolveView
              profile={profile}
              capabilities={capabilities}
              passport={passport}
              vault={vault}
              proofPortfolio={proofPortfolio}
              contributions={contributions}
              sprintMilestonesByBrief={sprintMilestonesByBrief}
              matchedApplications={matchedApplications}
              lockedBridges={lockedBridges}
              partnerPostedSprints={postedSprints}
              selectedBriefId={selectedBriefId}
              isOnline={isOnline}
              speechLang={localeMeta.speechLang}
              t={t}
              onUpdateProofPortfolio={handleUpdateProofPortfolio}
              onApplyMatchedWork={handleApplyMatchedWork}
              onStartUpskillingBridge={handleStartUpskillingBridge}
              onToggleSprintMilestone={handleToggleSprintMilestone}
              onSelectBrief={(briefId) => setSelectedBriefId(briefId)}
              onJoinSprintPod={handleJoinSprintPod}
              onSaveDraft={handleSaveDraft}
              onSubmitSolution={handleSubmitSolution}
              onGoToUnlock={() => navigateBuilderTab('unlock')}
              onGoToVerify={() => navigateBuilderTab('verify')}
              onGoToPulse={() => navigateBuilderTab('pulse')}
              onUpdateVault={handleUpdateVault}
              mentorPairings={mentorPairings}
              mentorRatings={mentorRatings}
              mentorshipTrackProgress={mentorshipTrackProgress}
              onRequestMentorPairing={handleRequestMentorPairing}
              onDeleteMentorPairing={handleDeleteMentorPairing}
              onSubmitMentorRating={handleSubmitMentorRating}
              onDeleteMentorRating={handleDeleteMentorRating}
              onToggleTrackObjective={handleToggleTrackObjective}
            />
          )}

          {activeTab === 'pulse' && (
            <PulseView
              profile={profile}
              capabilities={capabilities}
              contributions={contributions}
              passport={passport}
              vault={vault}
              endorsements={endorsements}
              payouts={payouts}
              sprintFeedback={sprintFeedback}
              collaborationNotes={collaborationNotes}
              mentorshipJournal={mentorshipJournal}
              sprintDiscussions={sprintDiscussions}
              celebratedContribution={recentCompletedContribution}
              userEmail={activeSyncedEmail}
              currentUserUid={authUser?.uid ?? profile.uid}
              lastSyncedIso={lastSyncedIso}
              queuedCount={offlineQueue.length}
              isOnline={isOnline}
              isSyncing={isSyncing}
              sprintMilestonesByBrief={sprintMilestonesByBrief}
              mentorPairings={mentorPairings}
              mentorPeerReviews={mentorPeerReviews}
              t={t}
              onAddSprintFeedback={handleAddSprintFeedback}
              onSaveCollaborationNote={handleSaveCollaborationNote}
              onDeleteCollaborationNote={handleDeleteCollaborationNote}
              onSaveMentorshipJournalEntry={handleSaveMentorshipJournalEntry}
              onDeleteMentorshipJournalEntry={handleDeleteMentorshipJournalEntry}
              onCreateSprintDiscussionPost={handleCreateSprintDiscussionPost}
              onDeleteSprintDiscussionPost={handleDeleteSprintDiscussionPost}
              onSaveMentorPeerReview={handleSaveMentorPeerReview}
              onDeleteMentorPeerReview={handleDeleteMentorPeerReview}
              onDismissCelebration={() => setRecentCompletedContribution(null)}
              onSignIn={handleOpenAccountSync}
              onSyncNow={handleSyncNow}
              onGoToUnlock={() => navigateBuilderTab('unlock')}
              onGoToVerify={() => navigateBuilderTab('verify')}
              onGoToSolve={() => navigateBuilderTab('solve')}
              onOpenScaleDrawer={() => setIsScaleDrawerOpen(true)}
              initialSelectedSprintId={pendingDeepLinkSprintId}
              initialSelectedContributionId={pendingDeepLinkContributionId}
              onConsumeInitialSprintSelection={() => {
                setPendingDeepLinkSprintId(null);
                setPendingDeepLinkContributionId(null);
              }}
            />
          )}

          {activeTab === 'cleared' && (
            <ClearedView
              profile={profile}
              capabilities={capabilities}
              contributions={contributions}
              passport={passport}
              vault={vault}
              endorsements={endorsements}
              payouts={payouts}
              onSelectTab={(tab) => navigateBuilderTab(tab)}
              onUpdateVault={handleUpdateVault}
              t={t}
            />
          )}
        </main>
        {dualDoorModalElement}
        {scaleDrawerElement}
        {commandPaletteElement}
        {accessComfortDrawerElement}
        {glossaryModalElement}
        {bibliographyModalElement}
        {judgeGuidePdfModalElement}
        {accountSyncModalElement}
        <PrivacySharedAccessModal
          isOpen={isPrivacyModalOpen}
          onClose={() => setIsPrivacyModalOpen(false)}
          grants={consentGrants}
          auditLogs={accessAuditLogs}
          onRevokeGrant={handleRevokeGrant}
        />
        <MentorMessagingDrawer />
        <SyncLedger
          isOnline={isOnline}
          isSyncing={isSyncing}
          queuedCount={offlineQueue.length}
          lastSyncedIso={lastSyncedIso}
          syncedEmail={activeSyncedEmail}
          onForceSync={handleSyncNow}
          t={t}
        />
        {globalToastElement}
      </div>
    </MessagingProvider>
    </MotionConfig>
  );
}
