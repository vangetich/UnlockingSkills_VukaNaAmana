import type {
  BriefSubmission,
  CompetencyPassport,
  ContractPayout,
  MentorMessage,
  OfflineMutation,
  PeerEndorsement,
  PractitionerProfile,
  SkillCapability,
  SprintFeedback,
  WorkReadyVault,
} from '../types/kora';
import {
  DEFAULT_SEED_CAPABILITIES,
  DEFAULT_SEED_CONTRIBUTIONS,
  DEFAULT_SEED_ENDORSEMENTS,
  DEFAULT_SEED_MENTOR_MESSAGES,
  DEFAULT_SEED_PAYOUTS,
  DEFAULT_SEED_SPRINT_FEEDBACK,
  compactOfflineQueue,
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
  queue: 'kora.v1.offline_queue',
  lastSync: 'kora.v1.last_sync',
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
