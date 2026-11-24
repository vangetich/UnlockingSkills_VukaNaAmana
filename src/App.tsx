import { useCallback, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  auth,
  deleteCloudCapability,
  deleteCloudEndorsement,
  ensureCloudProfile,
  fetchCloudWorkspace,
  signInWithGoogle,
  signOutAccount,
  subscribeToCapabilities,
  subscribeToContributions,
  upsertCloudCapability,
  upsertCloudContribution,
  upsertCloudEndorsement,
  upsertCloudPassport,
  upsertCloudPayout,
  upsertCloudVault,
} from './lib/firebase';
import type {
  AgeStage,
  AppViewMode,
  BriefSubmission,
  CohortBlueprintPreview,
  CompetencyPassport,
  ContractPayout,
  LocaleCode,
  OfflineMutation,
  PeerEndorsement,
  PractitionerProfile,
  ProblemBrief,
  RankedSolutionSprint,
  SharedPassportPayload,
  SkillCapability,
  UnlockViewMode,
  WorkReadyVault,
  WorkspaceTab,
} from './types/kora';
import { TRANSLATIONS, getLocaleMeta } from './utils/i18n';
import {
  loadLocalWorkspace,
  saveLastSyncedIso,
  saveLocalCapabilities,
  saveLocalContributions,
  saveLocalEndorsements,
  saveLocalPassport,
  saveLocalPayouts,
  saveLocalProfile,
  saveLocalVault,
  saveOfflineQueue,
} from './utils/offlineStore';
import {
  advancePayoutStatus,
  makeSafeId,
  normalizeAgeStage,
  normalizeLocale,
  parseSharedPassportToken,
  promoteVerificationStatus,
} from './utils/talentEngine';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { LandingFunnel } from './components/LandingFunnel';
import { TopNav } from './components/TopNav';
import { WorkspaceUtilities } from './components/WorkspaceUtilities';
import { VerifyView } from './components/VerifyView';
import { UnlockView } from './components/UnlockView';
import { SolveView } from './components/SolveView';
import { PulseView } from './components/PulseView';
import { PartnerScaleDrawer } from './components/PartnerScaleDrawer';
import { SharedPassportView } from './components/SharedPassportView';

export default function App() {
  const searchParams =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const autostart = searchParams?.get('autostart') === '1';
  const incomingEndorseToken = searchParams?.get('endorse') ?? null;
  const incomingEndorseSkill = searchParams?.get('skill') ?? null;
  const incomingPassportToken = searchParams?.get('passport') ?? null;

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
  const [offlineQueue, setOfflineQueue] = useState<OfflineMutation[]>(initialState.queue);
  const [lastSyncedIso, setLastSyncedIso] = useState<string | null>(initialState.lastSyncedIso);

  const [activeTab, setActiveTab] = useState<WorkspaceTab>(() => {
    if (typeof window === 'undefined') return 'verify';
    const saved = window.sessionStorage.getItem('vuka.activeTab');
    if (saved === 'verify' || saved === 'unlock' || saved === 'solve' || saved === 'pulse') {
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
  const [viewMode, setViewMode] = useState<AppViewMode>(() => {
    if (autostart || Boolean(incomingEndorseToken)) return 'studio';
    if (typeof window !== 'undefined' && window.sessionStorage.getItem('vuka.viewMode') === 'studio') {
      return 'studio';
    }
    return 'landing';
  });
  const [isScaleDrawerOpen, setIsScaleDrawerOpen] = useState(false);
  const [endorseBannerDismissed, setEndorseBannerDismissed] = useState(false);

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [recentOnlineSync, setRecentOnlineSync] = useState<{
    syncedCount: number;
    timestampIso: string;
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
    const wasOffline = prevOnlineRef.current === false;
    prevOnlineRef.current = isOnline;
    if (wasOffline && isOnline) {
      const syncedCount = offlinePeakQueueRef.current;
      offlinePeakQueueRef.current = 0;
      setRecentOnlineSync({
        syncedCount,
        timestampIso: new Date().toISOString(),
      });
    }
  }, [isOnline]);

  const localeMeta = getLocaleMeta(profile.preferredLocale);
  const t = TRANSLATIONS[profile.preferredLocale] ?? TRANSLATIONS.en;

  // Persist active view/tab in sessionStorage and reset scroll on navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('vuka.activeTab', activeTab);
      window.sessionStorage.setItem('vuka.viewMode', viewMode);
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [activeTab, viewMode]);

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
      if (!isOnline) return;
      setIsSyncing(true);
      try {
        await ensureCloudProfile(user.uid, currentProfile, user.email || currentProfile.email);

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
          }
        }

        const nowIso = new Date().toISOString();
        setOfflineQueue(saveOfflineQueue([]));
        setLastSyncedIso(nowIso);
        saveLastSyncedIso(nowIso);
      } finally {
        setIsSyncing(false);
      }
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

  // Hydrate and subscribe when authenticated + online
  useEffect(() => {
    if (!authReady || !authUser || !isOnline) return;

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
  }, [authReady, authUser?.uid, isOnline]);

  const handleSignIn = async () => {
    setAuthError(null);
    try {
      const user = await signInWithGoogle();
      const updatedProfile: PractitionerProfile = {
        ...profile,
        uid: user.uid,
        email: user.email || profile.email,
        displayName:
          profile.displayName === 'Practitioner' && user.displayName
            ? user.displayName
            : profile.displayName,
        updatedAtIso: new Date().toISOString(),
      };
      setProfile(updatedProfile);
      saveLocalProfile(updatedProfile);
      await flushQueue(user, offlineQueue, updatedProfile);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to complete Google sign-in.';
      setAuthError(message);
    }
  };

  const handleSignOut = async () => {
    await signOutAccount();
    setAuthUser(null);
  };

  const handleSyncNow = async () => {
    if (!authUser || !isOnline) return;
    await flushQueue(authUser, offlineQueue, profile);
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
    if (authUser && isOnline) {
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
    setActiveTab(targetTab);
    setViewMode('studio');
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
    const isDirectVerified = trimmedQuote.length >= 10;
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
      updated = {
        ...item,
        status: advancePayoutStatus(item.status),
        payoutRail: vault.payoutRail,
        updatedAtIso: now,
      };
      return updated;
    });
    setPayouts(nextList);
    saveLocalPayouts(nextList);

    if (updated) {
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
      if (authUser && isOnline) {
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
    let updated: BriefSubmission | null = null;
    const nextList = contributions.map((c) => {
      if (c.id !== submissionId || c.status === 'completed') return c;
      updated = {
        ...c,
        status: 'completed',
        solutionNotes: notes,
        hoursLogged,
        updatedAtIso: now,
      };
      return updated;
    });
    setContributions(nextList);
    saveLocalContributions(nextList);

    if (updated) {
      const completedItem: BriefSubmission = updated;
      setRecentCompletedContribution(completedItem);

      // Advance matching escrow payout into processing automatically on milestone delivery
      const matchingPayout = payouts.find(
        (p) => p.sprintId === completedItem.briefId && p.status === 'escrow-held'
      );
      if (matchingPayout) {
        handleAdvancePayout(matchingPayout.id);
      }

      if (authUser && isOnline) {
        void upsertCloudContribution(authUser.uid, completedItem);
      } else {
        enqueueMutation({
          id: makeSafeId('mut'),
          kind: 'upsert_contribution',
          payload: completedItem,
          queuedAtIso: now,
        });
      }
    }
  };

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

  if (sharedPassportView) {
    return (
      <SharedPassportView
        payload={sharedPassportView}
        onExit={() => {
          setSharedPassportView(null);
          if (typeof window !== 'undefined' && window.location.search.includes('passport=')) {
            window.history.replaceState({}, '', window.location.pathname);
          }
        }}
      />
    );
  }

  if (viewMode === 'landing') {
    return (
      <>
        <LandingFunnel
          initialProblem={profile.problemStatement}
          initialStage={profile.ageStage}
          locale={profile.preferredLocale}
          speechLang={localeMeta.speechLang}
          theme={profile.themePreference}
          isOnline={isOnline}
          onChangeLocale={handleChangeLocale}
          onToggleTheme={handleToggleTheme}
          onBeginCrossing={(payload) => handleLandingHandoff(payload, 'verify')}
          onOpenHiringPartners={(payload) => handleLandingHandoff(payload, 'unlock', 'partner')}
          onEnterStudio={(payload) => handleLandingHandoff(payload, 'verify')}
          onOpenScaleDrawer={() => setIsScaleDrawerOpen(true)}
          t={t}
        />
        {scaleDrawerElement}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#121315] text-[#17191C] dark:text-[#F4F2EE] pb-24 md:pb-12 overflow-x-clip">
      <TopNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        userEmail={authUser?.email ?? null}
        userDisplayName={authUser?.displayName ?? null}
        isOnline={isOnline}
        queuedCount={offlineQueue.length}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onBackToHome={() => setViewMode('landing')}
        onOpenScaleDrawer={() => setIsScaleDrawerOpen(true)}
        t={t}
      />

      <WorkspaceUtilities
        locale={profile.preferredLocale}
        onChangeLocale={handleChangeLocale}
        theme={profile.themePreference}
        onToggleTheme={handleToggleTheme}
        isOnline={isOnline}
        queuedCount={offlineQueue.length}
        isSignedIn={Boolean(authUser)}
        isSyncing={isSyncing}
        onSyncNow={handleSyncNow}
        t={t}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10">
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

        {activeTab === 'verify' && (
          <VerifyView
            profile={profile}
            capabilities={capabilities}
            passport={passport}
            endorsements={endorsements}
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
            onPreviewSharedPassport={(payload) => setSharedPassportView(payload)}
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
            onAdvancePayout={handleAdvancePayout}
            onRequestEndorsement={handleRequestEndorsement}
            onCompleteEndorsement={handleCompleteEndorsement}
            onDeleteEndorsement={handleDeleteEndorsement}
            onAcceptBrief={handleAcceptBrief}
            onOpenSolve={(briefId) => {
              setSelectedBriefId(briefId);
              setActiveTab('solve');
            }}
          />
        )}

        {activeTab === 'solve' && (
          <SolveView
            profile={profile}
            capabilities={capabilities}
            passport={passport}
            contributions={contributions}
            selectedBriefId={selectedBriefId}
            speechLang={localeMeta.speechLang}
            t={t}
            onSelectBrief={(briefId) => setSelectedBriefId(briefId)}
            onJoinSprintPod={handleJoinSprintPod}
            onSaveDraft={handleSaveDraft}
            onSubmitSolution={handleSubmitSolution}
            onGoToUnlock={() => setActiveTab('unlock')}
            onGoToVerify={() => setActiveTab('verify')}
            onGoToPulse={() => setActiveTab('pulse')}
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
            celebratedContribution={recentCompletedContribution}
            recentOnlineSync={recentOnlineSync}
            userEmail={authUser?.email ?? null}
            lastSyncedIso={lastSyncedIso}
            queuedCount={offlineQueue.length}
            isOnline={isOnline}
            isSyncing={isSyncing}
            t={t}
            onDismissCelebration={() => setRecentCompletedContribution(null)}
            onDismissOnlineSyncToast={() => setRecentOnlineSync(null)}
            onSignIn={handleSignIn}
            onSyncNow={handleSyncNow}
            onGoToUnlock={() => setActiveTab('unlock')}
            onGoToVerify={() => setActiveTab('verify')}
            onGoToSolve={() => setActiveTab('solve')}
          />
        )}
      </main>
      {scaleDrawerElement}
    </div>
  );
}
