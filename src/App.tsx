import { useCallback, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { AnimatePresence, motion } from 'motion/react';
import { Building2, CheckCircle2, RefreshCw, ShieldCheck, WifiOff, X } from 'lucide-react';
import {
  auth,
  deleteCloudCapability,
  deleteCloudEndorsement,
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
  upsertCloudCapability,
  upsertCloudContribution,
  upsertCloudEndorsement,
  upsertCloudMentorMessage,
  upsertCloudPassport,
  upsertCloudPayout,
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
  MentorMessage,
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
  SprintFeedback,
  SprintMilestoneKey,
  SprintRatingScore,
  UnlockViewMode,
  UpskillingBridgePathOption,
  WorkReadyVault,
  WorkspaceTab,
  ConsentGrant,
  AccessAuditLogEntry,
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
  saveLocalContributions,
  saveLocalEndorsements,
  saveLocalMatchedWorkApplications,
  saveLocalMentorMessages,
  saveLocalPassport,
  saveLocalPayouts,
  saveLocalProfile,
  saveLocalProofPortfolio,
  saveLocalSprintFeedback,
  saveLocalSprintMilestones,
  saveLocalUpskillingBridges,
  saveLocalVault,
  saveOfflineQueue,
} from './utils/offlineStore';
import {
  SEED_BRIEFS,
  advancePayoutStatus,
  buildMentorQuickReply,
  countWorkplaceSignals,
  isComplianceClearedForWork,
  makeSafeId,
  normalizeAgeStage,
  normalizeLocale,
  normalizeSprintMilestones,
  parseSharedPassportToken,
  promoteVerificationStatus,
  toggleSprintMilestoneList,
} from './utils/talentEngine';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { MessagingProvider } from './contexts/MessagingContext';
import { LandingFunnel } from './components/LandingFunnel';
import { TopNav } from './components/TopNav';
import { WorkspaceUtilities } from './components/WorkspaceUtilities';
import { VerifyView } from './components/VerifyView';
import { UnlockView } from './components/UnlockView';
import { SolveView } from './components/SolveView';
import { PulseView } from './components/PulseView';
import { ClearedView } from './components/ClearedView';
import { PartnerScaleDrawer } from './components/PartnerScaleDrawer';
import { SharedPassportView } from './components/SharedPassportView';
import { MentorMessagingDrawer } from './components/MentorMessagingDrawer';
import { CommandPalette } from './components/CommandPalette';
import { AccountSyncModal, type EmailVaultSyncStatus } from './components/AccountSyncModal';
import { DualDoorAuthModal } from './components/DualDoorAuthModal';
import { PrivacySharedAccessModal } from './components/PrivacySharedAccessModal';
import { SyncLedger } from './components/SyncLedger';
import { PartnerConsoleView } from './components/PartnerConsoleView';

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
  const [sprintFeedback, setSprintFeedback] = useState<SprintFeedback[]>(
    initialState.sprintFeedback
  );
  const [mentorMessages, setMentorMessages] = useState<MentorMessage[]>(
    initialState.mentorMessages
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
  const [viewMode, setViewMode] = useState<AppViewMode>(() => {
    if (autostart || Boolean(incomingEndorseToken)) return 'studio';
    if (typeof window !== 'undefined' && window.sessionStorage.getItem('vuka.viewMode') === 'studio') {
      return 'studio';
    }
    return 'landing';
  });
  const [activePortal, setActivePortal] = useState<PortalRealm>('talent');
  // Scoped Dual-Door session token kept strictly in React memory (never persisted to localStorage/sessionStorage)
  const [activeAuthSession, setActiveAuthSession] = useState<ActiveAuthSession | null>(null);
  const [dualDoorModal, setDualDoorModal] = useState<{
    isOpen: boolean;
    door: PortalRealm;
    pendingPayload?: { problemStatement: string; ageStage: AgeStage };
    pendingTab?: WorkspaceTab;
  }>({ isOpen: false, door: 'talent' });
  const [isScaleDrawerOpen, setIsScaleDrawerOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAccountSyncOpen, setIsAccountSyncOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [consentGrants, setConsentGrants] = useState<ConsentGrant[]>([]);
  const [postedSprints, setPostedSprints] = useState<ProblemBrief[]>(() => SEED_BRIEFS);
  const [accessAuditLogs, setAccessAuditLogs] = useState<AccessAuditLogEntry[]>([]);
  const [sharePassportSignal, setSharePassportSignal] = useState(0);
  const [voiceTriggerSignal, setVoiceTriggerSignal] = useState(0);
  const [endorseBannerDismissed, setEndorseBannerDismissed] = useState(false);

  const fetchGrantsAndLogs = async () => {
    try {
      const [gRes, aRes] = await Promise.all([
        fetch('/api/consent/grants'),
        fetch('/api/audit/logs'),
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
  };

  const handleRevokeGrant = async (consentId: string) => {
    try {
      const res = await fetch('/api/consent/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'VukaNaAmana',
        },
        body: JSON.stringify({ consentId }),
      });
      if (res.ok) {
        await fetchGrantsAndLogs();
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
    }
  };

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
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

  // Global Cmd+K / Ctrl+K Command Palette shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsCommandPaletteOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Hydrate isolated Dual-Door HttpOnly cookie session on initial load
  useEffect(() => {
    let cancelled = false;
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
          const restored = {
            realm: data.realm,
            sessionCookieName: data.sessionCookieName,
            token: data.token,
            claims: data.claims,
          } as ActiveAuthSession;
          setActiveAuthSession(restored);
          setActivePortal(data.realm);
          if (data.realm === 'partner') {
            setUnlockViewMode('partner');
          }
        }
      } catch {
        // Offline or preview cold boot — safe to remain guest local mode
      }
    };
    void hydrateDualDoorSession();
    return () => {
      cancelled = true;
    };
  }, []);

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
      if (!isOnline || !user.emailVerified) return;
      setIsSyncing(true);
      const maxAttempts = 3;
      let attempt = 0;
      let success = false;

      while (attempt < maxAttempts && !success && isOnline) {
        attempt++;
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
            } else if (item.kind === 'upsert_sprint_feedback') {
              await upsertCloudSprintFeedback(user.uid, item.payload);
            } else if (item.kind === 'upsert_mentor_message') {
              await upsertCloudMentorMessage(user.uid, item.payload);
            }
          }

          success = true;
          const syncedCount = queueSnapshot.length;
          const nowIso = new Date().toISOString();
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

      if (isOnline) {
        const res = await fetch('/api/sync/email-vault', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch(`/api/sync/email-vault?email=${encodeURIComponent(cleanEmail)}`);
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

  const handleOpenDualDoorFromLanding = (
    door: PortalRealm,
    payload: { problemStatement: string; ageStage: AgeStage },
    targetTab: WorkspaceTab
  ) => {
    if (door === 'talent' && activeAuthSession?.realm === 'talent') {
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
    setDualDoorModal({
      isOpen: true,
      door,
      pendingPayload: payload,
      pendingTab: targetTab,
    });
  };

  const handleDualDoorAuthenticated = (session: ActiveAuthSession) => {
    const pendingPayload = dualDoorModal.pendingPayload;
    const pendingTab = dualDoorModal.pendingTab;

    setActiveAuthSession(session);
    setActivePortal(session.realm);
    setDualDoorModal({ isOpen: false, door: session.realm });

    if (session.realm === 'talent') {
      const nextProfile: PractitionerProfile = {
        ...profile,
        displayName:
          profile.displayName === 'Practitioner' || session.claims.isDemo
            ? session.claims.displayName
            : profile.displayName,
        problemStatement: pendingPayload?.problemStatement?.trim() || profile.problemStatement,
        ageStage: pendingPayload?.ageStage || profile.ageStage,
        onboarded: true,
        updatedAtIso: new Date().toISOString(),
      };
      updateProfileState(nextProfile);
      setUnlockViewMode('talent');
      setActiveTab(pendingTab ?? 'verify');
      setViewMode('studio');
      setGlobalToast({
        id: `talent-realm-${Date.now()}`,
        variant: 'synced',
        title: 'Talent Studio Active · Isolated Builder Session',
        message: `Signed in as ${session.claims.displayName} (vna_talent_sid · aud: vna-talent). Partner credentials strictly isolated.`,
      });
    } else {
      setUnlockViewMode('partner');
      setActiveTab('unlock');
      setViewMode('studio');
      setGlobalToast({
        id: `partner-realm-${Date.now()}`,
        variant: 'synced',
        title: `Partner Console Active · ${session.claims.orgName}`,
        message: `Verified ${session.claims.memberRole === 'partner_admin' ? 'Partner Admin' : 'Hiring Lead'} session (vna_partner_sid · aud: vna-partner). Consent-first access enabled.`,
      });
    }
  };

  const handleWipePortalSession = async (nextDoorToOpen?: PortalRealm) => {
    const previousRealm = activeAuthSession?.realm ?? activePortal;
    const tokenToRevoke = activeAuthSession?.token;
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
      // Even if offline, wipe local React-memory session cleanly
    }

    setActiveAuthSession(null);

    if (nextDoorToOpen === 'talent') {
      setActivePortal('talent');
      setUnlockViewMode('talent');
      setViewMode('studio');
      setGlobalToast({
        id: `portal-switched-talent-${Date.now()}`,
        variant: 'synced',
        title: 'Switched to Skilled Builder Studio',
        message: 'Successfully crossed over to the Skilled Builder portal.',
      });
    } else if (nextDoorToOpen) {
      setDualDoorModal({
        isOpen: true,
        door: nextDoorToOpen,
        pendingTab: nextDoorToOpen === 'partner' ? 'unlock' : 'verify',
      });
      setGlobalToast({
        id: `portal-wiped-${Date.now()}`,
        variant: 'synced',
        title: 'Previous Realm Session Cleared',
        message: `Cleared ${previousRealm === 'partner' ? 'vna_partner_sid' : 'vna_talent_sid'} before opening the ${nextDoorToOpen === 'partner' ? 'Hiring Partner' : 'Talent Builder'} door.`,
      });
    } else {
      setActivePortal('talent');
      setUnlockViewMode('talent');
      setViewMode('landing');
      setGlobalToast({
        id: `portal-signout-${Date.now()}`,
        variant: 'synced',
        title: 'Signed Out & Session Wiped',
        message: `Your isolated ${previousRealm === 'partner' ? 'Partner Console' : 'Talent Studio'} session has been cleanly revoked.`,
      });
    }
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

    try {
      void fetch('/api/consent/grant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'VukaNaAmana',
        },
        body: JSON.stringify({
          talentAlias: profile.displayName || 'Skilled Builder',
          verifiedPassportSummary: passport?.fieldMatch || 'Living Competency Passport verified',
          photoProofHighlights: proofPortfolio.analysis?.visualHighlights || ['Verified proof sample'],
          complianceShieldStatus: vault.identityPathway ? vault.identityPathway.toUpperCase() : 'Tier-2 KYC Cleared',
          grantedToOrgId: `org_${makeSafeId(opportunity.partnerOrg)}`,
          grantedToOrgName: opportunity.partnerOrg,
        }),
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

  const commandPaletteElement = (
    <CommandPalette
      isOpen={isCommandPaletteOpen}
      activeTab={activeTab}
      theme={profile.themePreference}
      onClose={() => setIsCommandPaletteOpen(false)}
      onNavigateTab={(tab) => {
        setViewMode('studio');
        setActiveTab(tab);
      }}
      onGoHome={() => setViewMode('landing')}
      onTriggerVoiceToText={() => {
        setViewMode('studio');
        setActiveTab('verify');
        setVoiceTriggerSignal((n) => n + 1);
      }}
      onTriggerSharePassport={() => {
        setViewMode('studio');
        setActiveTab('verify');
        setSharePassportSignal((n) => n + 1);
      }}
      onOpenComplianceCrossing={() => {
        setViewMode('studio');
        setActiveTab('unlock');
        window.setTimeout(() => {
          document
            .getElementById('compliance-crossing-section')
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
      }}
      onOpenScaleDrawer={() => setIsScaleDrawerOpen(true)}
      onToggleTheme={handleToggleTheme}
    />
  );

  const activeSyncedEmail = authUser?.email ?? emailVaultStatus?.email ?? (profile.email || null);
  const activeSyncedName =
    authUser?.displayName ?? emailVaultStatus?.displayName ?? (activeSyncedEmail ? profile.displayName : null);

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
      <>
        <SharedPassportView
          payload={sharedPassportView}
          onExit={() => {
            setSharedPassportView(null);
            if (typeof window !== 'undefined' && window.location.search.includes('passport=')) {
              window.history.replaceState({}, '', window.location.pathname);
            }
          }}
        />
        {globalToastElement}
      </>
    );
  }

  const dualDoorModalElement = (
    <DualDoorAuthModal
      isOpen={dualDoorModal.isOpen}
      initialDoor={dualDoorModal.door}
      ageStage={dualDoorModal.pendingPayload?.ageStage ?? profile.ageStage}
      defaultDisplayName={profile.displayName}
      activeSession={activeAuthSession}
      onClose={() => setDualDoorModal((prev) => ({ ...prev, isOpen: false }))}
      onAuthenticated={handleDualDoorAuthenticated}
    />
  );

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
          onBeginCrossing={(payload) => handleOpenDualDoorFromLanding('talent', payload, 'verify')}
          onOpenHiringPartners={(payload) =>
            handleOpenDualDoorFromLanding('partner', payload, 'unlock')
          }
          onEnterStudio={(payload) => handleLandingHandoff(payload, 'verify', 'talent')}
          onPreviewCleared={(payload) => handleLandingHandoff(payload, 'cleared', 'talent')}
          onOpenScaleDrawer={() => setIsScaleDrawerOpen(true)}
          t={t}
        />
        {dualDoorModalElement}
        {scaleDrawerElement}
        {commandPaletteElement}
        {globalToastElement}
      </>
    );
  }

  if (activePortal === 'partner') {
    return (
      <MessagingProvider
        messages={mentorMessages}
        onSendMessage={handleSendMentorMessage}
      >
        <PartnerConsoleView
          activeSession={activeAuthSession}
          sprints={postedSprints}
          onPostSprint={(newSprint) => {
            const brief: ProblemBrief = {
              id: `brief_${Date.now()}`,
              ...newSprint,
            };
            setPostedSprints((prev) => [brief, ...prev]);
          }}
          consentedGrants={consentGrants}
          onIssueContract={(grantId) => {
            setGlobalToast({
              id: `contract-issued-${Date.now()}`,
              variant: 'synced',
              title: 'Compliant Sprint Contract & Escrow Issued',
              message: `Sprint agreement for consent grant ${grantId} has been successfully finalized and locked into escrow. SDGs 8, 16, and 17 incremented.`,
            });
          }}
          telemetry={{
            sdg4Count: 12,
            sdg8Count: postedSprints.length + 5,
            sdg10Count: 24,
            sdg16Count: 18,
            sdg17Count: 15,
            totalStipendDisbursedUsd: 14500,
            activeSprintsCount: postedSprints.length,
            clearedTalentCount: Math.max(1, consentGrants.length),
          }}
          onSwitchToTalentDoor={() => void handleWipePortalSession('talent')}
          t={t}
        />
        {globalToastElement}
      </MessagingProvider>
    );
  }

  return (
    <MessagingProvider
      messages={mentorMessages}
      onSendMessage={handleSendMentorMessage}
    >
      <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#121315] text-[#17191C] dark:text-[#F4F2EE] pb-24 md:pb-12 overflow-x-clip">
        <TopNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          activePortal={activePortal}
          activeSession={activeAuthSession}
          userEmail={activeSyncedEmail}
          userDisplayName={activeSyncedName}
          isOnline={isOnline}
          isSyncing={isSyncing}
          queuedCount={offlineQueue.length}
          lastSyncedIso={lastSyncedIso}
          onSyncNow={handleSyncNow}
          onSignIn={handleOpenAccountSync}
          onSignOut={handleSignOut}
          onSwitchPortal={(target) => void handleWipePortalSession(target)}
          onSignOutPortal={() => void handleWipePortalSession()}
          onBackToHome={() => setViewMode('landing')}
          onOpenScaleDrawer={() => setIsScaleDrawerOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          t={t}
        />

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
              contributions={contributions}
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
              vault={vault}
              proofPortfolio={proofPortfolio}
              contributions={contributions}
              sprintMilestonesByBrief={sprintMilestonesByBrief}
              matchedApplications={matchedApplications}
              lockedBridges={lockedBridges}
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
              sprintFeedback={sprintFeedback}
              celebratedContribution={recentCompletedContribution}
              userEmail={activeSyncedEmail}
              lastSyncedIso={lastSyncedIso}
              queuedCount={offlineQueue.length}
              isOnline={isOnline}
              isSyncing={isSyncing}
              sprintMilestonesByBrief={sprintMilestonesByBrief}
              t={t}
              onAddSprintFeedback={handleAddSprintFeedback}
              onDismissCelebration={() => setRecentCompletedContribution(null)}
              onSignIn={handleOpenAccountSync}
              onSyncNow={handleSyncNow}
              onGoToUnlock={() => setActiveTab('unlock')}
              onGoToVerify={() => setActiveTab('verify')}
              onGoToSolve={() => setActiveTab('solve')}
              onOpenScaleDrawer={() => setIsScaleDrawerOpen(true)}
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
              onSelectTab={setActiveTab}
              t={t}
            />
          )}
        </main>
        {dualDoorModalElement}
        {scaleDrawerElement}
        {commandPaletteElement}
        {accountSyncModalElement}
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
  );
}
