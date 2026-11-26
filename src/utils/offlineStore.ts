import type {
  BriefSubmission,
  CompetencyPassport,
  ContractPayout,
  LivingProofPortfolio,
  LockedUpskillingBridgeRecord,
  MatchedWorkApplication,
  MenteeCompetencyBadge,
  MentorMessage,
  MentorMilestoneFeedback,
  MentorPairingRequest,
  MentorPeerReviewRecord,
  MentorRating,
  MentorshipJournalEntry,
  MentorshipSession,
  MentorshipSessionAgendaRecord,
  MentorshipTrackProgressRecord,
  OfflineMutation,
  PeerEndorsement,
  PractitionerProfile,
  SkillCapability,
  SprintCollaborationNote,
  SprintDiscussionPost,
  SprintFeedback,
  SprintMilestoneKey,
  WorkReadyVault,
} from '../types/kora';
import {
  DEFAULT_SEED_CAPABILITIES,
  DEFAULT_SEED_COLLABORATION_NOTES,
  DEFAULT_SEED_CONTRIBUTIONS,
  DEFAULT_SEED_ENDORSEMENTS,
  DEFAULT_SEED_MENTEE_BADGES,
  DEFAULT_SEED_MENTOR_MESSAGES,
  DEFAULT_SEED_MENTOR_PAIRINGS,
  DEFAULT_SEED_MENTORSHIP_SESSIONS,
  DEFAULT_SEED_MILESTONE_FEEDBACK,
  DEFAULT_SEED_PAYOUTS,
  DEFAULT_SEED_SESSION_AGENDAS,
  DEFAULT_SEED_SPRINT_FEEDBACK,
  compactOfflineQueue,
  createInitialLivingProofPortfolio,
  createInitialProfile,
  createInitialVault,
  normalizeAgeStage,
  normalizeLocale,
} from './talentEngine';

const STORAGE_KEYS = {
  profile: 'kora.v1.profile',
  capabilities: 'kora.v1.capabilities',
  contributions: 'kora.v1.contributions',
  passport: 'kora.v1.passport',
  vault: 'kora.v1.vault',
  endorsements: 'kora.v1.endorsements',
  payouts: 'kora.v1.payouts',
  sprintFeedback: 'kora.v1.sprint_feedback',
  mentorMessages: 'kora.v1.mentor_messages',
  mentorshipSessions: 'kora.v1.mentorship_sessions',
  mentorPairings: 'kora.v1.mentor_pairings',
  mentorRatings: 'kora.v1.mentor_ratings',
  mentorshipTrackProgress: 'kora.v1.mentorship_track_progress',
  mentorshipJournal: 'kora.v1.mentorship_journal',
  menteeCompetencyBadges: 'kora.v1.mentee_competency_badges',
  mentorMilestoneFeedback: 'kora.v1.mentor_milestone_feedback',
  mentorshipSessionAgendas: 'kora.v1.mentorship_session_agendas',
  mentorPeerReviews: 'kora.v1.mentor_peer_reviews',
  collaborationNotes: 'kora.v1.collaboration_notes',
  sprintDiscussions: 'kora.v1.sprint_discussions',
  queue: 'kora.v1.offline_queue',
  lastSync: 'kora.v1.last_sync',
  proofPortfolio: 'kora.v1.proof_portfolio',
  sprintMilestones: 'kora.v1.sprint_milestones',
  matchedWorkApps: 'kora.v1.matched_work_applications',
  upskillingBridges: 'kora.v1.upskilling_bridges',
} as const;

export interface LocalWorkspaceState {
  profile: PractitionerProfile;
  capabilities: SkillCapability[];
  contributions: BriefSubmission[];
  passport: CompetencyPassport | null;
  vault: WorkReadyVault;
  endorsements: PeerEndorsement[];
  payouts: ContractPayout[];
  sprintFeedback: SprintFeedback[];
  mentorMessages: MentorMessage[];
  mentorshipSessions: MentorshipSession[];
  mentorPairings: MentorPairingRequest[];
  mentorRatings: MentorRating[];
  mentorshipTrackProgress: MentorshipTrackProgressRecord[];
  mentorshipJournal: MentorshipJournalEntry[];
  menteeCompetencyBadges: MenteeCompetencyBadge[];
  mentorMilestoneFeedback: MentorMilestoneFeedback[];
  mentorshipSessionAgendas: MentorshipSessionAgendaRecord[];
  mentorPeerReviews: MentorPeerReviewRecord[];
  collaborationNotes: SprintCollaborationNote[];
  sprintDiscussions: SprintDiscussionPost[];
  queue: OfflineMutation[];
  lastSyncedIso: string | null;
}

function safeParseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadLocalWorkspace(autostartDemo = false): LocalWorkspaceState {
  const now = new Date().toISOString();
  const storedProfile = safeParseJson<PractitionerProfile | null>(
    typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEYS.profile) : null,
    null
  );

  const profile: PractitionerProfile = storedProfile
    ? {
        ...storedProfile,
        ageStage: normalizeAgeStage(storedProfile.ageStage),
        preferredLocale: normalizeLocale(storedProfile.preferredLocale),
      }
    : createInitialProfile(
        autostartDemo
          ? {
              displayName: 'Tariq Al-Mansoor',
              problemStatement:
                '48V solar microgrid fault isolation, lithium battery balancing, and cold-chain thermal diagnostics',
              ageStage: '30-45',
              onboarded: true,
            }
          : undefined
      );

  const storedCapabilities = safeParseJson<SkillCapability[] | null>(
    typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEYS.capabilities) : null,
    null
  );
  const capabilities: SkillCapability[] =
    storedCapabilities ??
    DEFAULT_SEED_CAPABILITIES.map((c) => ({
      ...c,
      ownerUid: profile.uid,
      createdAtIso: now,
      updatedAtIso: now,
    }));

  const storedContributions = safeParseJson<BriefSubmission[] | null>(
    typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEYS.contributions) : null,
    null
  );
  const contributions: BriefSubmission[] =
    storedContributions ??
    DEFAULT_SEED_CONTRIBUTIONS.map((c, idx) => {
      // First seeded in-progress 7-day sprint started 5.5 days ago (~36h remaining) to surface Sprint Due Alert within 48h
      const elapsedMs = idx === 0 ? Math.round(5.5 * 86_400_000) : 12 * 86_400_000;
      const ts = new Date(Date.now() - elapsedMs).toISOString();
      return {
        ...c,
        ownerUid: profile.uid,
        createdAtIso: ts,
        updatedAtIso: ts,
      };
    });

  const passport = safeParseJson<CompetencyPassport | null>(
    typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEYS.passport) : null,
    null
  );

  const storedVault = safeParseJson<WorkReadyVault | null>(
    typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEYS.vault) : null,
    null
  );
  const baseVault = createInitialVault(profile.uid);
  const vault: WorkReadyVault = storedVault
    ? {
        ...baseVault,
        ...storedVault,
        financialIdentityCleared: Boolean(storedVault.financialIdentityCleared),
        financialRailTested: Boolean(storedVault.financialRailTested),
        financialTaxCleared: Boolean(storedVault.financialTaxCleared),
        financialRail: storedVault.financialRail ?? storedVault.payoutRail ?? 'mobile-money',
        onboardingPackGenerated: Boolean(storedVault.onboardingPackGenerated),
        onboardingContractStructure: storedVault.onboardingContractStructure ?? 'scoped-remote',
        onboardingPartnerOrg: storedVault.onboardingPartnerOrg ?? '',
        onboardingHostCountry: storedVault.onboardingHostCountry ?? 'Kenya',
        proofPortfolioReady: Boolean(storedVault.proofPortfolioReady),
        proofSkillTrack: storedVault.proofSkillTrack ?? 'trades-solar',
        proofLocalScore:
          typeof storedVault.proofLocalScore === 'number' ? storedVault.proofLocalScore : 0,
        proofRemoteScore:
          typeof storedVault.proofRemoteScore === 'number' ? storedVault.proofRemoteScore : 0,
        workplaceSignalsCount:
          typeof storedVault.workplaceSignalsCount === 'number'
            ? storedVault.workplaceSignalsCount
            : 0,
        matchedWorkCount:
          typeof storedVault.matchedWorkCount === 'number'
            ? storedVault.matchedWorkCount
            : 0,
        appliedOpportunityIds: Array.isArray(storedVault.appliedOpportunityIds)
          ? storedVault.appliedOpportunityIds
          : [],
        upskillingBridgesCount:
          typeof storedVault.upskillingBridgesCount === 'number'
            ? storedVault.upskillingBridgesCount
            : 0,
        lockedBridgeOpportunityIds: Array.isArray(storedVault.lockedBridgeOpportunityIds)
          ? storedVault.lockedBridgeOpportunityIds
          : [],
      }
    : baseVault;

  const storedEndorsements = safeParseJson<PeerEndorsement[] | null>(
    typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEYS.endorsements) : null,
    null
  );
  const endorsements: PeerEndorsement[] =
    storedEndorsements ??
    DEFAULT_SEED_ENDORSEMENTS.map((e) => ({
      ...e,
      ownerUid: profile.uid,
      createdAtIso: now,
      updatedAtIso: now,
    }));

  const storedPayouts = safeParseJson<ContractPayout[] | null>(
    typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEYS.payouts) : null,
    null
  );
  const payouts: ContractPayout[] =
    storedPayouts ??
    DEFAULT_SEED_PAYOUTS.map((p) => ({
      ...p,
      ownerUid: profile.uid,
      createdAtIso: now,
      updatedAtIso: now,
    }));

  const storedFeedback = safeParseJson<SprintFeedback[] | null>(
    typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEYS.sprintFeedback) : null,
    null
  );
  const sprintFeedback: SprintFeedback[] =
    storedFeedback ??
    DEFAULT_SEED_SPRINT_FEEDBACK.map((f) => ({
      ...f,
      ownerUid: profile.uid,
      createdAtIso: now,
      updatedAtIso: now,
    }));

  const storedMentorMessages = safeParseJson<MentorMessage[] | null>(
    typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEYS.mentorMessages) : null,
    null
  );
  const mentorMessages: MentorMessage[] =
    storedMentorMessages ??
    DEFAULT_SEED_MENTOR_MESSAGES.map((m) => ({
      ...m,
      ownerUid: profile.uid,
      createdAtIso: now,
      updatedAtIso: now,
    }));

  const storedMentorshipSessions = safeParseJson<MentorshipSession[] | null>(
    typeof window !== 'undefined'
      ? window.localStorage.getItem(STORAGE_KEYS.mentorshipSessions)
      : null,
    null
  );
  const mentorshipSessions: MentorshipSession[] =
    storedMentorshipSessions ??
    DEFAULT_SEED_MENTORSHIP_SESSIONS.map((s, idx) => {
      const daysAgo = idx === 0 ? 12 : idx === 1 ? 11 : 2;
      const ts = new Date(Date.now() - daysAgo * 86_400_000).toISOString();
      return {
        ...s,
        ownerUid: profile.uid,
        attendedAtIso: ts,
        createdAtIso: ts,
        updatedAtIso: ts,
      };
    });

  const storedCollabNotes = safeParseJson<SprintCollaborationNote[] | null>(
    typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEYS.collaborationNotes) : null,
    null
  );
  const collaborationNotes: SprintCollaborationNote[] = Array.isArray(storedCollabNotes)
    ? storedCollabNotes
    : DEFAULT_SEED_COLLABORATION_NOTES.map((n, idx) => {
        const ts = new Date(Date.now() - (idx === 0 ? 3 : 12) * 86_400_000).toISOString();
        return {
          ...n,
          ownerUid: profile.uid,
          createdAtIso: ts,
          updatedAtIso: ts,
        };
      });

  const storedDiscussions = safeParseJson<SprintDiscussionPost[] | null>(
    typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEYS.sprintDiscussions) : null,
    null
  );
  const sprintDiscussions: SprintDiscussionPost[] = Array.isArray(storedDiscussions)
    ? storedDiscussions
    : [];

  const storedPairings = safeParseJson<MentorPairingRequest[] | null>(
    typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEYS.mentorPairings) : null,
    null
  );
  const mentorPairings: MentorPairingRequest[] = Array.isArray(storedPairings)
    ? storedPairings
    : DEFAULT_SEED_MENTOR_PAIRINGS.map((p, idx) => {
        const daysAgo = idx === 0 ? 4 : idx === 1 ? 14 : 26;
        const ts = new Date(Date.now() - daysAgo * 86_400_000).toISOString();
        return {
          ...p,
          ownerUid: profile.uid,
          createdAtIso: ts,
          updatedAtIso: ts,
        };
      });

  const storedMentorRatings = safeParseJson<MentorRating[] | null>(
    typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEYS.mentorRatings) : null,
    null
  );
  const mentorRatings: MentorRating[] = Array.isArray(storedMentorRatings)
    ? storedMentorRatings
    : [];

  const storedTrackProgress = safeParseJson<MentorshipTrackProgressRecord[] | null>(
    typeof window !== 'undefined'
      ? window.localStorage.getItem(STORAGE_KEYS.mentorshipTrackProgress)
      : null,
    null
  );
  const mentorshipTrackProgress: MentorshipTrackProgressRecord[] = Array.isArray(storedTrackProgress)
    ? storedTrackProgress
    : [];

  const storedJournal = safeParseJson<MentorshipJournalEntry[] | null>(
    typeof window !== 'undefined'
      ? window.localStorage.getItem(STORAGE_KEYS.mentorshipJournal)
      : null,
    null
  );
  const mentorshipJournal: MentorshipJournalEntry[] = Array.isArray(storedJournal)
    ? storedJournal
    : [];

  const storedMenteeBadges = safeParseJson<MenteeCompetencyBadge[] | null>(
    typeof window !== 'undefined'
      ? window.localStorage.getItem(STORAGE_KEYS.menteeCompetencyBadges)
      : null,
    null
  );
  const menteeCompetencyBadges: MenteeCompetencyBadge[] = Array.isArray(storedMenteeBadges)
    ? storedMenteeBadges
    : DEFAULT_SEED_MENTEE_BADGES.map((b) => {
        const ts = new Date(Date.now() - 10 * 86_400_000).toISOString();
        return {
          ...b,
          ownerUid: profile.uid,
          awardedAtIso: ts.slice(0, 10),
          createdAtIso: ts,
          updatedAtIso: ts,
        };
      });

  const storedMilestoneFeedback = safeParseJson<MentorMilestoneFeedback[] | null>(
    typeof window !== 'undefined'
      ? window.localStorage.getItem(STORAGE_KEYS.mentorMilestoneFeedback)
      : null,
    null
  );
  const mentorMilestoneFeedback: MentorMilestoneFeedback[] = Array.isArray(storedMilestoneFeedback)
    ? storedMilestoneFeedback
    : DEFAULT_SEED_MILESTONE_FEEDBACK.map((f, idx) => {
        const ts = new Date(Date.now() - (idx + 2) * 86_400_000).toISOString();
        return {
          ...f,
          ownerUid: profile.uid,
          createdAtIso: ts,
          updatedAtIso: ts,
        };
      });

  const storedSessionAgendas = safeParseJson<MentorshipSessionAgendaRecord[] | null>(
    typeof window !== 'undefined'
      ? window.localStorage.getItem(STORAGE_KEYS.mentorshipSessionAgendas)
      : null,
    null
  );
  const mentorshipSessionAgendas: MentorshipSessionAgendaRecord[] = Array.isArray(
    storedSessionAgendas
  )
    ? storedSessionAgendas
    : DEFAULT_SEED_SESSION_AGENDAS.map((a) => {
        const ts = new Date(Date.now() - 86_400_000).toISOString();
        return {
          ...a,
          ownerUid: profile.uid,
          createdAtIso: ts,
          updatedAtIso: ts,
        };
      });

  const storedPeerReviews = safeParseJson<MentorPeerReviewRecord[] | null>(
    typeof window !== 'undefined'
      ? window.localStorage.getItem(STORAGE_KEYS.mentorPeerReviews)
      : null,
    null
  );
  const mentorPeerReviews: MentorPeerReviewRecord[] = Array.isArray(storedPeerReviews)
    ? storedPeerReviews
    : [];

  const queue = safeParseJson<OfflineMutation[]>(
    typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEYS.queue) : null,
    []
  );

  const lastSyncedIso =
    typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEYS.lastSync) : null;

  return {
    profile,
    capabilities,
    contributions,
    passport,
    vault,
    endorsements,
    payouts,
    sprintFeedback,
    mentorMessages,
    mentorshipSessions,
    mentorPairings,
    mentorRatings,
    mentorshipTrackProgress,
    mentorshipJournal,
    menteeCompetencyBadges,
    mentorMilestoneFeedback,
    mentorshipSessionAgendas,
    mentorPeerReviews,
    collaborationNotes,
    sprintDiscussions,
    queue,
    lastSyncedIso,
  };
}

export function saveLocalProfile(profile: PractitionerProfile): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
}

export function saveLocalCapabilities(capabilities: SkillCapability[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEYS.capabilities, JSON.stringify(capabilities));
}

export function saveLocalContributions(contributions: BriefSubmission[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEYS.contributions, JSON.stringify(contributions));
}

export function saveLocalPassport(passport: CompetencyPassport | null): void {
  if (typeof window === 'undefined') return;
  if (!passport) {
    window.localStorage.removeItem(STORAGE_KEYS.passport);
    return;
  }
  window.localStorage.setItem(STORAGE_KEYS.passport, JSON.stringify(passport));
}

export function saveLocalVault(vault: WorkReadyVault): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEYS.vault, JSON.stringify(vault));
}

export function saveLocalEndorsements(endorsements: PeerEndorsement[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEYS.endorsements, JSON.stringify(endorsements));
}

export function saveLocalPayouts(payouts: ContractPayout[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEYS.payouts, JSON.stringify(payouts));
}

export function saveLocalSprintFeedback(feedbackList: SprintFeedback[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEYS.sprintFeedback, JSON.stringify(feedbackList));
}

export function saveLocalMentorMessages(messages: MentorMessage[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEYS.mentorMessages, JSON.stringify(messages));
}

export function saveLocalMentorshipSessions(sessions: MentorshipSession[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEYS.mentorshipSessions, JSON.stringify(sessions));
}

export function saveLocalMentorPairings(pairings: MentorPairingRequest[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEYS.mentorPairings, JSON.stringify(pairings));
}

export function saveLocalMentorRatings(ratings: MentorRating[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEYS.mentorRatings, JSON.stringify(ratings));
}

export function saveLocalMentorshipTrackProgress(
  records: MentorshipTrackProgressRecord[]
): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    STORAGE_KEYS.mentorshipTrackProgress,
    JSON.stringify(records)
  );
}

export function saveLocalMentorshipJournal(
  entries: MentorshipJournalEntry[]
): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    STORAGE_KEYS.mentorshipJournal,
    JSON.stringify(entries)
  );
}

export function saveLocalMenteeCompetencyBadges(
  badges: MenteeCompetencyBadge[]
): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    STORAGE_KEYS.menteeCompetencyBadges,
    JSON.stringify(badges)
  );
}

export function saveLocalMentorMilestoneFeedback(
  items: MentorMilestoneFeedback[]
): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    STORAGE_KEYS.mentorMilestoneFeedback,
    JSON.stringify(items)
  );
}

export function saveLocalMentorshipSessionAgendas(
  agendas: MentorshipSessionAgendaRecord[]
): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    STORAGE_KEYS.mentorshipSessionAgendas,
    JSON.stringify(agendas)
  );
}

export function saveLocalMentorPeerReviews(
  reviews: MentorPeerReviewRecord[]
): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    STORAGE_KEYS.mentorPeerReviews,
    JSON.stringify(reviews)
  );
}

export function saveLocalCollaborationNotes(notes: SprintCollaborationNote[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEYS.collaborationNotes, JSON.stringify(notes));
}

export function saveLocalSprintDiscussions(posts: SprintDiscussionPost[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEYS.sprintDiscussions, JSON.stringify(posts));
}

export function saveOfflineQueue(queue: OfflineMutation[]): OfflineMutation[] {
  const compacted = compactOfflineQueue(queue);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEYS.queue, JSON.stringify(compacted));
  }
  return compacted;
}

export function saveLastSyncedIso(iso: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEYS.lastSync, iso);
}

export function loadLocalProofPortfolio(): LivingProofPortfolio {
  const fallback = createInitialLivingProofPortfolio();
  if (typeof window === 'undefined') return fallback;
  const parsed = safeParseJson<Partial<LivingProofPortfolio> | null>(
    window.localStorage.getItem(STORAGE_KEYS.proofPortfolio),
    null
  );
  if (!parsed) return fallback;
  return {
    ...fallback,
    ...parsed,
    images: Array.isArray(parsed.images) ? parsed.images.slice(0, 3) : [],
    workplaceSignals: {
      clearTimelines: Boolean(parsed.workplaceSignals?.clearTimelines),
      qualitySafetyCheck: Boolean(parsed.workplaceSignals?.qualitySafetyCheck),
      clientCommunication: Boolean(parsed.workplaceSignals?.clientCommunication),
    },
    analysis: parsed.analysis ?? null,
  };
}

export function saveLocalProofPortfolio(portfolio: LivingProofPortfolio): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.proofPortfolio, JSON.stringify(portfolio));
  } catch {
    // Fallback without raw data URLs if storage quota is tight
    const trimmed: LivingProofPortfolio = {
      ...portfolio,
      images: portfolio.images.map((img) => ({ ...img, dataUrl: '' })),
    };
    window.localStorage.setItem(STORAGE_KEYS.proofPortfolio, JSON.stringify(trimmed));
  }
}

export function loadLocalSprintMilestones(): Record<string, SprintMilestoneKey[]> {
  if (typeof window === 'undefined') return {};
  return safeParseJson<Record<string, SprintMilestoneKey[]>>(
    window.localStorage.getItem(STORAGE_KEYS.sprintMilestones),
    {}
  );
}

export function saveLocalSprintMilestones(
  milestonesByBrief: Record<string, SprintMilestoneKey[]>
): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEYS.sprintMilestones, JSON.stringify(milestonesByBrief));
}

export function loadLocalMatchedWorkApplications(): MatchedWorkApplication[] {
  if (typeof window === 'undefined') return [];
  const parsed = safeParseJson<MatchedWorkApplication[]>(
    window.localStorage.getItem(STORAGE_KEYS.matchedWorkApps),
    []
  );
  return Array.isArray(parsed) ? parsed : [];
}

export function saveLocalMatchedWorkApplications(apps: MatchedWorkApplication[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEYS.matchedWorkApps, JSON.stringify(apps));
}

export function loadLocalUpskillingBridges(): LockedUpskillingBridgeRecord[] {
  if (typeof window === 'undefined') return [];
  const parsed = safeParseJson<LockedUpskillingBridgeRecord[]>(
    window.localStorage.getItem(STORAGE_KEYS.upskillingBridges),
    []
  );
  return Array.isArray(parsed) ? parsed : [];
}

export function saveLocalUpskillingBridges(records: LockedUpskillingBridgeRecord[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEYS.upskillingBridges, JSON.stringify(records));
}


