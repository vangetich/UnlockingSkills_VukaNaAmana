import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  linkWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getFirestore,
  initializeFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import type {
  BriefSubmission,
  CompetencyPassport,
  ContractPayout,
  MenteeCompetencyBadge,
  MentorMessage,
  MentorMilestoneFeedback,
  MentorPairingRequest,
  MentorPeerReviewRecord,
  MentorRating,
  MentorRatingScore,
  MentorshipJournalEntry,
  MentorshipSession,
  MentorshipSessionAgendaRecord,
  MentorshipTrackProgressRecord,
  PeerEndorsement,
  PractitionerProfile,
  SkillCapability,
  SprintCollaborationNote,
  SprintDiscussionPost,
  SprintFeedback,
  SprintMilestoneKey,
  SprintRatingScore,
  WorkReadyVault,
} from '../types/kora';
import {
  isValidFirebaseId,
  normalizeSprintMilestones,
  sanitizeText,
} from '../utils/talentEngine';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = (() => {
  try {
    // Force HTTP long-polling with a responsive timeout so proxied/iframe networks never stall on WebChannel streams
    return initializeFirestore(
      app,
      {
        experimentalForceLongPolling: true,
        experimentalLongPollingOptions: { timeoutSeconds: 10 },
      },
      firebaseConfig.firestoreDatabaseId
    );
  } catch {
    return getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
})();
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const microsoftProvider = new OAuthProvider('microsoft.com');
microsoftProvider.setCustomParameters({ prompt: 'select_account' });
microsoftProvider.addScope('email');
microsoftProvider.addScope('profile');

const yahooProvider = new OAuthProvider('yahoo.com');
yahooProvider.setCustomParameters({ prompt: 'login' });
yahooProvider.addScope('email');
yahooProvider.addScope('profile');

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function canReachFirestoreBackend(timeoutMs = 4000): Promise<boolean> {
  if (typeof fetch !== 'function') return true;
  const dbPath = `projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}`;
  const url = `https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel?database=${encodeURIComponent(
    dbPath
  )}&VER=8&RID=1&CVER=22&t=1`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `count=1&ofs=0&req0___data__=${encodeURIComponent(JSON.stringify({ database: dbPath }))}`,
      cache: 'no-store',
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function testConnection() {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => void testConnection(), { once: true });
    }
    return;
  }

  const reachable = await canReachFirestoreBackend(4000);
  if (!reachable) {
    // Gracefully remain in offline-first PWA mode when the device/network blocks or drops firestore.googleapis.com
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => void testConnection(), { once: true });
    }
    return;
  }

  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline') &&
      (typeof navigator === 'undefined' || navigator.onLine !== false)
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testConnection();

export type AuthSyncProviderId = 'google' | 'microsoft' | 'yahoo' | 'email';

export function formatFirebaseAuthError(error: unknown, providerLabel = 'Account'): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code ?? '')
      : '';

  switch (code) {
    case 'auth/popup-closed-by-user':
      return `${providerLabel} sign-in popup was closed before completing. Please try again or use Email & Password below.`;
    case 'auth/popup-blocked':
      return `Your browser blocked the ${providerLabel} popup. Allow popups for this site or sign in with Email & Password below.`;
    case 'auth/cancelled-popup-request':
      return 'Another sign-in window is already open. Complete or close it and try again.';
    case 'auth/operation-not-allowed':
      return `${providerLabel} sign-in is not enabled yet in Firebase Console (Authentication → Sign-in method). Enable ${providerLabel} there or use another sign-in option below.`;
    case 'auth/unauthorized-domain':
      return 'This domain needs to be listed under Firebase Console → Authentication → Settings → Authorized domains before popup sign-in can complete.';
    case 'auth/account-exists-with-different-credential':
      return 'An account with this email already exists using another sign-in provider. Sign in with your original method first, then link providers from Account Sync.';
    case 'auth/credential-already-in-use':
      return 'This email provider is already linked to another account.';
    case 'auth/provider-already-linked':
      return `${providerLabel} is already linked to your synced account.`;
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password. Double-check your details or switch to Create Account.';
    case 'auth/email-already-in-use':
      return 'An account with that email already exists. Switch to Sign In or reset your password.';
    case 'auth/weak-password':
      return 'Please choose a password with at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts detected. Wait a moment before trying again.';
    default:
      return error instanceof Error
        ? error.message
        : `Unable to complete ${providerLabel} authorization.`;
  }
}

export async function signInWithGoogle(): Promise<User> {
  const credential = await signInWithPopup(auth, googleProvider);
  return credential.user;
}

export async function signInWithMicrosoft(): Promise<User> {
  const credential = await signInWithPopup(auth, microsoftProvider);
  return credential.user;
}

export async function signInWithYahoo(): Promise<User> {
  const credential = await signInWithPopup(auth, yahooProvider);
  return credential.user;
}

export async function signInWithEmailPassword(email: string, password: string): Promise<User> {
  const cleanEmail = email.trim();
  const credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
  return credential.user;
}

export async function registerWithEmailPassword(
  email: string,
  password: string,
  displayName?: string
): Promise<User> {
  const cleanEmail = email.trim();
  const cleanName = sanitizeText(displayName ?? '', 80);
  const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
  if (cleanName) {
    await updateProfile(credential.user, { displayName: cleanName });
  }
  await sendEmailVerification(credential.user);
  return credential.user;
}

export async function resendVerificationEmail(): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('Sign in first to resend the verification email.');
  }
  await sendEmailVerification(auth.currentUser);
}

export async function refreshAuthUser(): Promise<User | null> {
  if (!auth.currentUser) return null;
  await auth.currentUser.reload();
  return auth.currentUser;
}

export async function sendPasswordReset(email: string): Promise<void> {
  const cleanEmail = email.trim();
  await sendPasswordResetEmail(auth, cleanEmail);
}

export async function linkAccountProvider(
  providerId: 'google' | 'microsoft' | 'yahoo'
): Promise<User> {
  if (!auth.currentUser) {
    throw new Error('Sign in first to link another email provider.');
  }
  const provider =
    providerId === 'google'
      ? googleProvider
      : providerId === 'microsoft'
        ? microsoftProvider
        : yahooProvider;
  const credential = await linkWithPopup(auth.currentUser, provider);
  return credential.user;
}

export async function signOutAccount(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function ensureCloudProfile(
  uid: string,
  profile: PractitionerProfile,
  email: string
): Promise<void> {
  if (!isValidFirebaseId(uid)) {
    throw new Error('Invalid user identifier');
  }
  const path = `users/${uid}`;
  const ref = doc(db, 'users', uid);

  const safeDisplayName = sanitizeText(profile.displayName || 'Practitioner', 80) || 'Practitioner';
  const safeEmail = sanitizeText(email || profile.email || 'practitioner@kora.app', 160);
  const safeProblem = sanitizeText(
    profile.problemStatement || 'Applied field diagnostics and community infrastructure repair',
    500
  );
  const safeProblemValidated =
    safeProblem.length >= 3 ? safeProblem : 'Applied field diagnostics and repair';

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid,
        displayName: safeDisplayName,
        email: safeEmail,
        problemStatement: safeProblemValidated,
        ageStage: profile.ageStage,
        preferredLocale: profile.preferredLocale,
        themePreference: profile.themePreference,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        displayName: safeDisplayName,
        problemStatement: safeProblemValidated,
        ageStage: profile.ageStage,
        preferredLocale: profile.preferredLocale,
        themePreference: profile.themePreference,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function upsertCloudCapability(
  uid: string,
  capability: SkillCapability
): Promise<void> {
  if (!isValidFirebaseId(uid) || !isValidFirebaseId(capability.id)) {
    throw new Error('Invalid identifier for capability sync');
  }
  const path = `users/${uid}/capabilities/${capability.id}`;
  const ref = doc(db, 'users', uid, 'capabilities', capability.id);
  const safeTitle = sanitizeText(capability.title, 120);
  const safeDomain = sanitizeText(capability.domain, 60);
  const safeProof = sanitizeText(capability.proofSummary, 600);
  const safeScore = Math.max(0, Math.min(100, Number(capability.confidenceScore) || 0));

  const optionalEvidence: Record<string, string> = {};
  if (capability.portfolioRef?.trim()) {
    optionalEvidence.portfolioRef = sanitizeText(capability.portfolioRef, 300);
  }
  if (capability.certificationRef?.trim()) {
    optionalEvidence.certificationRef = sanitizeText(capability.certificationRef, 200);
  }
  if (capability.peerEndorsement?.trim()) {
    optionalEvidence.peerEndorsement = sanitizeText(capability.peerEndorsement, 400);
  }

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ownerUid: uid,
        title: safeTitle.length >= 2 ? safeTitle : 'Skill Capability',
        domain: safeDomain.length >= 2 ? safeDomain : 'Green Energy',
        proofSummary: safeProof.length >= 4 ? safeProof : 'Field verified practitioner experience.',
        ...optionalEvidence,
        verificationStatus: capability.verificationStatus,
        confidenceScore: safeScore,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const existingData = snap.data();
      if (
        existingData?.verificationStatus !== capability.verificationStatus &&
        existingData?.verificationStatus !== 'master-endorsed'
      ) {
        await updateDoc(ref, {
          verificationStatus: capability.verificationStatus,
          confidenceScore: safeScore,
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(ref, {
          title: safeTitle.length >= 2 ? safeTitle : existingData.title,
          domain: safeDomain.length >= 2 ? safeDomain : existingData.domain,
          proofSummary: safeProof.length >= 4 ? safeProof : existingData.proofSummary,
          ...optionalEvidence,
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCloudCapability(uid: string, capabilityId: string): Promise<void> {
  if (!isValidFirebaseId(uid) || !isValidFirebaseId(capabilityId)) {
    return;
  }
  const path = `users/${uid}/capabilities/${capabilityId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'capabilities', capabilityId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function upsertCloudPassport(
  uid: string,
  passport: CompetencyPassport
): Promise<void> {
  if (!isValidFirebaseId(uid) || !isValidFirebaseId(passport.id)) {
    throw new Error('Invalid identifier for passport sync');
  }
  const path = `users/${uid}/passports/${passport.id}`;
  const ref = doc(db, 'users', uid, 'passports', passport.id);

  const skillLabels = passport.verifiedSkills
    .slice(0, 6)
    .map((s) => sanitizeText(s.name, 120))
    .filter((s) => s.length > 0);
  if (skillLabels.length === 0) {
    skillLabels.push('Applied Field Problem Solving');
  }

  const payload = {
    ownerUid: uid,
    studioDomain: passport.studioDomain,
    inputMode: passport.inputMode,
    ageStageTrack: sanitizeText(passport.ageStageTrack, 120) || 'Practitioner Track',
    fieldMatch: sanitizeText(passport.fieldMatch, 160) || passport.studioDomain,
    executiveSummary: sanitizeText(passport.executiveSummary, 600) || 'Verified practical competence.',
    microBridgeTitle: sanitizeText(passport.microBridge.title, 160) || 'Micro-Bridging Credential',
    microBridgeAction: sanitizeText(passport.microBridge.action, 500) || 'Complete targeted lab module.',
    stipendEligible: Boolean(passport.stipendEligible),
    verifiedSkillLabels: skillLabels,
  };

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        studioDomain: payload.studioDomain,
        inputMode: payload.inputMode,
        ageStageTrack: payload.ageStageTrack,
        fieldMatch: payload.fieldMatch,
        executiveSummary: payload.executiveSummary,
        microBridgeTitle: payload.microBridgeTitle,
        microBridgeAction: payload.microBridgeAction,
        stipendEligible: payload.stipendEligible,
        verifiedSkillLabels: payload.verifiedSkillLabels,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function upsertCloudContribution(
  uid: string,
  contribution: BriefSubmission
): Promise<void> {
  if (
    !isValidFirebaseId(uid) ||
    !isValidFirebaseId(contribution.id) ||
    !isValidFirebaseId(contribution.briefId)
  ) {
    throw new Error('Invalid identifier for contribution sync');
  }
  const path = `users/${uid}/contributions/${contribution.id}`;
  const ref = doc(db, 'users', uid, 'contributions', contribution.id);
  const safeTitle = sanitizeText(contribution.briefTitle, 140);
  const safeDomain = sanitizeText(contribution.domain, 60);
  const safeNotes = sanitizeText(contribution.solutionNotes, 2000);
  const safeHours = Math.max(0, Math.min(500, Number(contribution.hoursLogged) || 0));
  const safePayout = Math.max(0, Math.min(50000, Number(contribution.payoutUsd) || 0));
  const safeMilestones = normalizeSprintMilestones(
    contribution.milestonesDone,
    contribution.status === 'completed'
  );

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ownerUid: uid,
        briefId: contribution.briefId,
        briefTitle: safeTitle.length >= 2 ? safeTitle : 'Problem Brief',
        domain: safeDomain.length >= 2 ? safeDomain : 'Green Energy',
        status: 'in-progress',
        solutionNotes: safeNotes,
        hoursLogged: safeHours,
        payoutUsd: safePayout,
        milestonesDone: safeMilestones,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      if (contribution.status === 'completed' && safeNotes.length >= 10 && safeHours > 0) {
        await updateDoc(ref, {
          status: 'completed',
          solutionNotes: safeNotes,
          hoursLogged: safeHours,
          milestonesDone: safeMilestones,
          updatedAt: serverTimestamp(),
        });
      }
    } else {
      const existingData = snap.data();
      if (existingData?.status === 'completed') {
        return;
      }
      if (contribution.status === 'completed' && safeNotes.length >= 10 && safeHours > 0) {
        await updateDoc(ref, {
          status: 'completed',
          solutionNotes: safeNotes,
          hoursLogged: safeHours,
          milestonesDone: safeMilestones,
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(ref, {
          solutionNotes: safeNotes,
          hoursLogged: safeHours,
          milestonesDone: safeMilestones,
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function upsertCloudVault(uid: string, vault: WorkReadyVault): Promise<void> {
  if (!isValidFirebaseId(uid) || !isValidFirebaseId(vault.id)) {
    throw new Error('Invalid identifier for vault sync');
  }
  const path = `users/${uid}/vaults/${vault.id}`;
  const ref = doc(db, 'users', uid, 'vaults', vault.id);

  const payload = {
    ownerUid: uid,
    identityCompleted: Boolean(vault.identityCompleted),
    identityPathway: vault.identityPathway,
    contractCompleted: Boolean(vault.contractCompleted),
    contractTemplate: vault.contractTemplate,
    payoutCompleted: Boolean(vault.payoutCompleted),
    payoutRail: vault.payoutRail,
    financialIdentityCleared: Boolean(vault.financialIdentityCleared),
    financialRailTested: Boolean(vault.financialRailTested),
    financialTaxCleared: Boolean(vault.financialTaxCleared),
    financialRail: vault.financialRail ?? vault.payoutRail,
    onboardingPackGenerated: Boolean(vault.onboardingPackGenerated),
    onboardingContractStructure: vault.onboardingContractStructure ?? 'scoped-remote',
    onboardingPartnerOrg: sanitizeText(vault.onboardingPartnerOrg ?? '', 120),
    onboardingHostCountry: sanitizeText(vault.onboardingHostCountry ?? 'Kenya', 80) || 'Kenya',
    proofPortfolioReady: Boolean(vault.proofPortfolioReady),
    proofSkillTrack: vault.proofSkillTrack ?? 'trades-solar',
    proofLocalScore: Math.max(0, Math.min(100, Math.round(Number(vault.proofLocalScore) || 0))),
    proofRemoteScore: Math.max(0, Math.min(100, Math.round(Number(vault.proofRemoteScore) || 0))),
    workplaceSignalsCount: Math.max(0, Math.min(3, Math.round(Number(vault.workplaceSignalsCount) || 0))),
    matchedWorkCount: Math.max(0, Math.min(50, Math.round(Number(vault.matchedWorkCount) || 0))),
    appliedOpportunityIds: Array.isArray(vault.appliedOpportunityIds)
      ? vault.appliedOpportunityIds
          .slice(0, 20)
          .map((id) => sanitizeText(String(id), 64))
          .filter((id) => id.length > 0)
      : [],
    upskillingBridgesCount: Math.max(0, Math.min(50, Math.round(Number(vault.upskillingBridgesCount) || 0))),
    lockedBridgeOpportunityIds: Array.isArray(vault.lockedBridgeOpportunityIds)
      ? vault.lockedBridgeOpportunityIds
          .slice(0, 20)
          .map((id) => sanitizeText(String(id), 64))
          .filter((id) => id.length > 0)
      : [],
  };

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        identityCompleted: payload.identityCompleted,
        identityPathway: payload.identityPathway,
        contractCompleted: payload.contractCompleted,
        contractTemplate: payload.contractTemplate,
        payoutCompleted: payload.payoutCompleted,
        payoutRail: payload.payoutRail,
        financialIdentityCleared: payload.financialIdentityCleared,
        financialRailTested: payload.financialRailTested,
        financialTaxCleared: payload.financialTaxCleared,
        financialRail: payload.financialRail,
        onboardingPackGenerated: payload.onboardingPackGenerated,
        onboardingContractStructure: payload.onboardingContractStructure,
        onboardingPartnerOrg: payload.onboardingPartnerOrg,
        onboardingHostCountry: payload.onboardingHostCountry,
        proofPortfolioReady: payload.proofPortfolioReady,
        proofSkillTrack: payload.proofSkillTrack,
        proofLocalScore: payload.proofLocalScore,
        proofRemoteScore: payload.proofRemoteScore,
        workplaceSignalsCount: payload.workplaceSignalsCount,
        matchedWorkCount: payload.matchedWorkCount,
        appliedOpportunityIds: payload.appliedOpportunityIds,
        upskillingBridgesCount: payload.upskillingBridgesCount,
        lockedBridgeOpportunityIds: payload.lockedBridgeOpportunityIds,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function upsertCloudEndorsement(
  uid: string,
  endorsement: PeerEndorsement
): Promise<void> {
  if (
    !isValidFirebaseId(uid) ||
    !isValidFirebaseId(endorsement.id) ||
    !isValidFirebaseId(endorsement.shareToken)
  ) {
    throw new Error('Invalid identifier for endorsement sync');
  }
  const path = `users/${uid}/endorsements/${endorsement.id}`;
  const ref = doc(db, 'users', uid, 'endorsements', endorsement.id);

  const safeName = sanitizeText(endorsement.collaboratorName, 80) || 'Collaborator';
  const safeRole = sanitizeText(endorsement.collaboratorRole, 80) || 'Peer Reviewer';
  const safeOrg = sanitizeText(endorsement.organization, 120) || 'Field Partner';
  const safeCapability = sanitizeText(endorsement.capabilityTitle, 140) || 'Applied Problem Solving';
  const safeText = sanitizeText(endorsement.endorsementText, 400);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ownerUid: uid,
        collaboratorName: safeName,
        collaboratorRole: safeRole,
        organization: safeOrg,
        capabilityTitle: safeCapability,
        endorsementText: endorsement.status === 'verified' ? safeText : '',
        status: endorsement.status === 'verified' && safeText.length >= 10 ? 'verified' : 'requested',
        shareToken: endorsement.shareToken,
        sourceTab: endorsement.sourceTab,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const existingData = snap.data();
      if (existingData?.status === 'verified') {
        return;
      }
      if (endorsement.status === 'verified' && safeText.length >= 10) {
        await updateDoc(ref, {
          endorsementText: safeText,
          status: 'verified',
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(ref, {
          collaboratorName: safeName,
          collaboratorRole: safeRole,
          organization: safeOrg,
          capabilityTitle: safeCapability,
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCloudEndorsement(uid: string, endorsementId: string): Promise<void> {
  if (!isValidFirebaseId(uid) || !isValidFirebaseId(endorsementId)) {
    return;
  }
  const path = `users/${uid}/endorsements/${endorsementId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'endorsements', endorsementId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function upsertCloudPayout(uid: string, payout: ContractPayout): Promise<void> {
  if (
    !isValidFirebaseId(uid) ||
    !isValidFirebaseId(payout.id) ||
    !isValidFirebaseId(payout.sprintId)
  ) {
    throw new Error('Invalid identifier for payout sync');
  }
  const path = `users/${uid}/payouts/${payout.id}`;
  const ref = doc(db, 'users', uid, 'payouts', payout.id);

  const safeTitle = sanitizeText(payout.sprintTitle, 160) || 'Solution Sprint';
  const safeOrg = sanitizeText(payout.partnerOrg, 120) || 'Hiring Partner';
  const safeAmount = Math.max(0, Math.min(50000, Number(payout.amountUsd) || 0));

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ownerUid: uid,
        sprintId: payout.sprintId,
        sprintTitle: safeTitle,
        partnerOrg: safeOrg,
        amountUsd: safeAmount,
        payoutRail: payout.payoutRail,
        status: 'escrow-held',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      if (payout.status === 'processing' || payout.status === 'released') {
        await updateDoc(ref, {
          status: 'processing',
          payoutRail: payout.payoutRail,
          updatedAt: serverTimestamp(),
        });
      }
      if (payout.status === 'released') {
        await updateDoc(ref, {
          status: 'released',
          payoutRail: payout.payoutRail,
          updatedAt: serverTimestamp(),
        });
      }
    } else {
      const existingData = snap.data();
      if (existingData?.status === 'released') {
        return;
      }
      if (existingData?.status === 'escrow-held' && payout.status === 'processing') {
        await updateDoc(ref, {
          status: 'processing',
          payoutRail: payout.payoutRail,
          updatedAt: serverTimestamp(),
        });
      } else if (existingData?.status === 'escrow-held' && payout.status === 'released') {
        await updateDoc(ref, {
          status: 'processing',
          payoutRail: payout.payoutRail,
          updatedAt: serverTimestamp(),
        });
        await updateDoc(ref, {
          status: 'released',
          payoutRail: payout.payoutRail,
          updatedAt: serverTimestamp(),
        });
      } else if (existingData?.status === 'processing' && payout.status === 'released') {
        await updateDoc(ref, {
          status: 'released',
          payoutRail: payout.payoutRail,
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function upsertCloudSprintFeedback(
  uid: string,
  feedback: SprintFeedback
): Promise<void> {
  if (
    !isValidFirebaseId(uid) ||
    !isValidFirebaseId(feedback.id) ||
    !isValidFirebaseId(feedback.contributionId) ||
    !isValidFirebaseId(feedback.briefId)
  ) {
    throw new Error('Invalid identifier for sprint feedback sync');
  }
  const path = `users/${uid}/sprintFeedback/${feedback.id}`;
  const ref = doc(db, 'users', uid, 'sprintFeedback', feedback.id);

  const safeTitle = sanitizeText(feedback.briefTitle, 160) || 'Completed Sprint';
  const safeOrg = sanitizeText(feedback.partnerOrg, 120) || 'Hiring Partner';
  const safeName = sanitizeText(feedback.reviewerName, 80) || 'Hiring Partner Reviewer';
  const safeRole = sanitizeText(feedback.reviewerRole, 100) || 'Hiring Partner';
  const safeReview = sanitizeText(feedback.reviewText, 500);
  const safeRating = Math.max(1, Math.min(5, Math.round(Number(feedback.rating) || 5)));

  if (safeReview.length < 10) {
    throw new Error('Review text must be at least 10 characters');
  }

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ownerUid: uid,
        contributionId: feedback.contributionId,
        briefId: feedback.briefId,
        briefTitle: safeTitle,
        partnerOrg: safeOrg,
        reviewerName: safeName,
        reviewerRole: safeRole,
        rating: safeRating,
        reviewText: safeReview,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function upsertCloudMentorMessage(
  uid: string,
  message: MentorMessage
): Promise<void> {
  if (
    !isValidFirebaseId(uid) ||
    !isValidFirebaseId(message.id) ||
    !isValidFirebaseId(message.sprintId) ||
    !isValidFirebaseId(message.mentorId)
  ) {
    throw new Error('Invalid identifier for mentor message sync');
  }
  const path = `users/${uid}/mentorMessages/${message.id}`;
  const ref = doc(db, 'users', uid, 'mentorMessages', message.id);

  const safeTitle = sanitizeText(message.sprintTitle, 160) || 'Active Sprint Pod';
  const safeMentorName = sanitizeText(message.mentorName, 80) || 'Senior Specialist';
  const safeBody = sanitizeText(message.body, 1000);
  const safeSender = message.sender === 'mentor' ? 'mentor' : 'practitioner';

  if (safeBody.length < 1) {
    throw new Error('Mentor message body cannot be empty');
  }

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ownerUid: uid,
        sprintId: message.sprintId,
        sprintTitle: safeTitle,
        mentorId: message.mentorId,
        mentorName: safeMentorName,
        sender: safeSender,
        body: safeBody,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function upsertCloudMentorshipSession(
  uid: string,
  session: MentorshipSession
): Promise<void> {
  if (
    !isValidFirebaseId(uid) ||
    !isValidFirebaseId(session.id) ||
    !isValidFirebaseId(session.sprintId) ||
    !isValidFirebaseId(session.mentorId)
  ) {
    throw new Error('Invalid identifier for mentorship session sync');
  }
  const path = `users/${uid}/mentorshipSessions/${session.id}`;
  const ref = doc(db, 'users', uid, 'mentorshipSessions', session.id);

  const safeTitle = sanitizeText(session.sprintTitle, 160) || 'Active Sprint Pod';
  const safeMentorName = sanitizeText(session.mentorName, 80) || 'Senior Specialist';
  const safeFocus =
    session.focusTopic === 'technical-unblocker' ||
    session.focusTopic === 'handover-rubric' ||
    session.focusTopic === 'career-rpl'
      ? session.focusTopic
      : 'qa-architecture';
  const allowedDurations = [15, 30, 45, 60] as const;
  const safeDuration = allowedDurations.includes(session.durationMinutes)
    ? session.durationMinutes
    : 30;
  const safeStatus = session.status === 'scheduled' ? 'scheduled' : 'attended';
  const safeNote =
    sanitizeText(session.takeawayNote, 600) || 'Reviewed deliverable quality with pod mentor.';
  const rawAttendedIso = sanitizeText(session.attendedAtIso || new Date().toISOString(), 40);
  const safeAttendedIso =
    rawAttendedIso.length >= 10 ? rawAttendedIso : new Date().toISOString().slice(0, 24);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ownerUid: uid,
        sprintId: session.sprintId,
        sprintTitle: safeTitle,
        mentorId: session.mentorId,
        mentorName: safeMentorName,
        focusTopic: safeFocus,
        durationMinutes: safeDuration,
        status: safeStatus,
        takeawayNote: safeNote,
        attendedAtIso: safeAttendedIso,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        focusTopic: safeFocus,
        durationMinutes: safeDuration,
        status: safeStatus,
        takeawayNote: safeNote,
        attendedAtIso: safeAttendedIso,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCloudMentorshipSession(
  uid: string,
  sessionId: string
): Promise<void> {
  if (!isValidFirebaseId(uid) || !isValidFirebaseId(sessionId)) {
    throw new Error('Invalid identifier for mentorship session deletion');
  }
  const path = `users/${uid}/mentorshipSessions/${sessionId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'mentorshipSessions', sessionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function upsertCloudMentorPairing(
  uid: string,
  pairing: MentorPairingRequest
): Promise<void> {
  if (
    !isValidFirebaseId(uid) ||
    !isValidFirebaseId(pairing.id) ||
    !isValidFirebaseId(pairing.trackId) ||
    !isValidFirebaseId(pairing.mentorId) ||
    (pairing.sprintId && !isValidFirebaseId(pairing.sprintId))
  ) {
    throw new Error('Invalid identifier for mentor pairing sync');
  }
  const path = `users/${uid}/mentorPairings/${pairing.id}`;
  const ref = doc(db, 'users', uid, 'mentorPairings', pairing.id);

  const safeTrackId = pairing.trackId.slice(0, 64);
  const rawTrackTitle = sanitizeText(pairing.trackTitle, 120);
  const safeTrackTitle = rawTrackTitle.length >= 2 ? rawTrackTitle : 'Mentorship Track';
  const safeDomain =
    pairing.domain === 'Tech' ||
    pairing.domain === 'Healthcare Ops' ||
    pairing.domain === 'SME Finance'
      ? pairing.domain
      : 'Green Energy';
  const rawMentorName = sanitizeText(pairing.mentorName, 80);
  const safeMentorName = rawMentorName.length >= 2 ? rawMentorName : 'Senior Specialist';
  const safeCadence =
    pairing.preferredCadence === 'weekly-check-in' || pairing.preferredCadence === 'async-review'
      ? pairing.preferredCadence
      : 'milestone-gates';
  const safeGoals = sanitizeText(pairing.sprintGoals, 800);
  if (safeGoals.length < 10) {
    throw new Error('Sprint goals must be at least 10 characters');
  }

  const optionalSprintFields: Record<string, string> = {};
  if (pairing.sprintId && isValidFirebaseId(pairing.sprintId)) {
    optionalSprintFields.sprintId = pairing.sprintId;
    const rawSprintTitle = sanitizeText(pairing.sprintTitle ?? '', 160);
    if (rawSprintTitle.length >= 2) {
      optionalSprintFields.sprintTitle = rawSprintTitle;
    }
  }

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ownerUid: uid,
        trackId: safeTrackId,
        trackTitle: safeTrackTitle,
        domain: safeDomain,
        mentorId: pairing.mentorId,
        mentorName: safeMentorName,
        ...optionalSprintFields,
        preferredCadence: safeCadence,
        sprintGoals: safeGoals,
        status: 'requested',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const existingData = snap.data();
      if (existingData?.status === 'active') {
        return;
      }
      await updateDoc(ref, {
        preferredCadence: safeCadence,
        sprintGoals: safeGoals,
        ...optionalSprintFields,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCloudMentorPairing(
  uid: string,
  pairingId: string
): Promise<void> {
  if (!isValidFirebaseId(uid) || !isValidFirebaseId(pairingId)) {
    throw new Error('Invalid identifier for mentor pairing deletion');
  }
  const path = `users/${uid}/mentorPairings/${pairingId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'mentorPairings', pairingId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function upsertCloudMentorRating(
  uid: string,
  ratingItem: MentorRating
): Promise<void> {
  if (
    !isValidFirebaseId(uid) ||
    !isValidFirebaseId(ratingItem.id) ||
    !isValidFirebaseId(ratingItem.trackId) ||
    !isValidFirebaseId(ratingItem.mentorId)
  ) {
    throw new Error('Invalid identifier for mentor rating sync');
  }
  const path = `users/${uid}/mentorRatings/${ratingItem.id}`;
  const ref = doc(db, 'users', uid, 'mentorRatings', ratingItem.id);

  const safeTrackId = ratingItem.trackId.slice(0, 64);
  const rawTrackTitle = sanitizeText(ratingItem.trackTitle, 120);
  const safeTrackTitle = rawTrackTitle.length >= 2 ? rawTrackTitle : 'Mentorship Track';
  const safeDomain =
    ratingItem.domain === 'Tech' ||
    ratingItem.domain === 'Healthcare Ops' ||
    ratingItem.domain === 'SME Finance'
      ? ratingItem.domain
      : 'Green Energy';
  const rawMentorName = sanitizeText(ratingItem.mentorName, 80);
  const safeMentorName = rawMentorName.length >= 2 ? rawMentorName : 'Senior Specialist';
  const safeRating = Math.max(1, Math.min(5, Math.round(Number(ratingItem.rating) || 5))) as MentorRatingScore;
  const safeComment = sanitizeText(ratingItem.comment, 500);
  if (safeComment.length < 5) {
    throw new Error('Mentor rating comment must be at least 5 characters');
  }

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ownerUid: uid,
        trackId: safeTrackId,
        trackTitle: safeTrackTitle,
        domain: safeDomain,
        mentorId: ratingItem.mentorId,
        mentorName: safeMentorName,
        rating: safeRating,
        comment: safeComment,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        rating: safeRating,
        comment: safeComment,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCloudMentorRating(
  uid: string,
  ratingId: string
): Promise<void> {
  if (!isValidFirebaseId(uid) || !isValidFirebaseId(ratingId)) {
    throw new Error('Invalid identifier for mentor rating deletion');
  }
  const path = `users/${uid}/mentorRatings/${ratingId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'mentorRatings', ratingId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function upsertCloudMentorshipTrackProgress(
  uid: string,
  record: MentorshipTrackProgressRecord
): Promise<void> {
  if (
    !isValidFirebaseId(uid) ||
    !isValidFirebaseId(record.id) ||
    !isValidFirebaseId(record.trackId)
  ) {
    throw new Error('Invalid identifier for mentorship track progress sync');
  }
  const path = `users/${uid}/mentorshipTrackProgress/${record.id}`;
  const ref = doc(db, 'users', uid, 'mentorshipTrackProgress', record.id);

  const safeTrackId = record.trackId.slice(0, 64);
  const safeObjectiveIds = Array.isArray(record.completedObjectiveIds)
    ? record.completedObjectiveIds
        .filter((id): id is string => typeof id === 'string' && isValidFirebaseId(id))
        .slice(0, 20)
    : [];

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ownerUid: uid,
        trackId: safeTrackId,
        completedObjectiveIds: safeObjectiveIds,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        completedObjectiveIds: safeObjectiveIds,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function upsertCloudMentorshipJournalEntry(
  uid: string,
  entry: MentorshipJournalEntry
): Promise<void> {
  if (
    !isValidFirebaseId(uid) ||
    !isValidFirebaseId(entry.id) ||
    !isValidFirebaseId(entry.contributionId) ||
    !isValidFirebaseId(entry.briefId) ||
    !isValidFirebaseId(entry.mentorId)
  ) {
    throw new Error('Invalid identifier for mentorship journal sync');
  }
  const path = `users/${uid}/mentorshipJournal/${entry.id}`;
  const ref = doc(db, 'users', uid, 'mentorshipJournal', entry.id);

  const safeBriefTitle = sanitizeText(entry.briefTitle, 160) || 'Solution Sprint';
  const safeMentorName = sanitizeText(entry.mentorName, 80) || 'Senior Specialist';
  const rawDateIso = sanitizeText(entry.sessionDateIso || new Date().toISOString().slice(0, 10), 40);
  const safeDateIso = rawDateIso.length >= 10 ? rawDateIso : new Date().toISOString().slice(0, 10);
  const safeFocus =
    entry.focusTopic === 'technical-unblocker' ||
    entry.focusTopic === 'handover-rubric' ||
    entry.focusTopic === 'career-rpl'
      ? entry.focusTopic
      : 'qa-architecture';
  const rawTitle = sanitizeText(entry.reflectionTitle, 140);
  const safeReflectionTitle = rawTitle.length >= 2 ? rawTitle : 'Session Reflection';
  const safeReflectionBody = sanitizeText(entry.reflectionBody, 3000);
  if (safeReflectionBody.length < 5) {
    throw new Error('Mentorship journal reflection must be at least 5 characters');
  }
  const safeNextAction = sanitizeText(entry.nextActionStep, 500);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ownerUid: uid,
        contributionId: entry.contributionId,
        briefId: entry.briefId,
        briefTitle: safeBriefTitle,
        mentorId: entry.mentorId,
        mentorName: safeMentorName,
        sessionDateIso: safeDateIso,
        focusTopic: safeFocus,
        reflectionTitle: safeReflectionTitle,
        reflectionBody: safeReflectionBody,
        nextActionStep: safeNextAction,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        sessionDateIso: safeDateIso,
        focusTopic: safeFocus,
        reflectionTitle: safeReflectionTitle,
        reflectionBody: safeReflectionBody,
        nextActionStep: safeNextAction,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCloudMentorshipJournalEntry(
  uid: string,
  entryId: string
): Promise<void> {
  if (!isValidFirebaseId(uid) || !isValidFirebaseId(entryId)) {
    throw new Error('Invalid identifier for mentorship journal deletion');
  }
  const path = `users/${uid}/mentorshipJournal/${entryId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'mentorshipJournal', entryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function upsertCloudMenteeCompetencyBadge(
  uid: string,
  badge: MenteeCompetencyBadge
): Promise<void> {
  if (
    !isValidFirebaseId(uid) ||
    !isValidFirebaseId(badge.id) ||
    !isValidFirebaseId(badge.sprintId) ||
    !isValidFirebaseId(badge.mentorId) ||
    !isValidFirebaseId(badge.verificationCode)
  ) {
    throw new Error('Invalid identifier for mentee competency badge sync');
  }
  const path = `users/${uid}/menteeCompetencyBadges/${badge.id}`;
  const ref = doc(db, 'users', uid, 'menteeCompetencyBadges', badge.id);

  const safeSprintTitle = sanitizeText(badge.sprintTitle, 160) || 'Completed Pod Sprint';
  const safeDomain =
    badge.domain === 'Tech' ||
    badge.domain === 'Healthcare Ops' ||
    badge.domain === 'SME Finance'
      ? badge.domain
      : 'Green Energy';
  const safeMentorName = sanitizeText(badge.mentorName, 80) || 'Senior Specialist';
  const safeMentorRole = sanitizeText(badge.mentorRole, 120) || 'Senior Pod Mentor';
  const safeBadgeTitle = sanitizeText(badge.badgeTitle, 120) || 'Verified Pod Sprint Competency';
  const safeSkillCategory = sanitizeText(badge.skillCategory, 80) || 'Applied Field Competency';
  const safeLevel =
    badge.competencyLevel === 'field-ready' ||
    badge.competencyLevel === 'pod-lead-endorsed'
      ? badge.competencyLevel
      : 'specialist-verified';
  const safeCitation = sanitizeText(badge.citationNote, 600);
  if (safeCitation.length < 5) {
    throw new Error('Mentee competency badge citation must be at least 5 characters');
  }
  const safeVerificationCode = badge.verificationCode.slice(0, 64);
  const rawAwardedIso = sanitizeText(badge.awardedAtIso || new Date().toISOString().slice(0, 10), 40);
  const safeAwardedIso = rawAwardedIso.length >= 10 ? rawAwardedIso : new Date().toISOString().slice(0, 10);
  const safePerformanceRating = Math.max(
    1,
    Math.min(5, Math.round(Number(badge.performanceRating) || 5))
  );
  const safeEvaluatedCompetencies = Array.isArray(badge.evaluatedCompetencies)
    ? badge.evaluatedCompetencies
        .map((c) => sanitizeText(String(c), 80))
        .filter((c) => c.length >= 2)
        .slice(0, 8)
    : [];

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ownerUid: uid,
        sprintId: badge.sprintId,
        sprintTitle: safeSprintTitle,
        domain: safeDomain,
        mentorId: badge.mentorId,
        mentorName: safeMentorName,
        mentorRole: safeMentorRole,
        badgeTitle: safeBadgeTitle,
        skillCategory: safeSkillCategory,
        competencyLevel: safeLevel,
        performanceRating: safePerformanceRating,
        evaluatedCompetencies: safeEvaluatedCompetencies,
        citationNote: safeCitation,
        verificationCode: safeVerificationCode,
        awardedAtIso: safeAwardedIso,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        badgeTitle: safeBadgeTitle,
        skillCategory: safeSkillCategory,
        competencyLevel: safeLevel,
        performanceRating: safePerformanceRating,
        evaluatedCompetencies: safeEvaluatedCompetencies,
        citationNote: safeCitation,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCloudMenteeCompetencyBadge(
  uid: string,
  badgeId: string
): Promise<void> {
  if (!isValidFirebaseId(uid) || !isValidFirebaseId(badgeId)) {
    throw new Error('Invalid identifier for mentee competency badge deletion');
  }
  const path = `users/${uid}/menteeCompetencyBadges/${badgeId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'menteeCompetencyBadges', badgeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function upsertCloudMentorMilestoneFeedback(
  uid: string,
  feedback: MentorMilestoneFeedback
): Promise<void> {
  if (
    !isValidFirebaseId(uid) ||
    !isValidFirebaseId(feedback.id) ||
    !isValidFirebaseId(feedback.sprintId) ||
    !isValidFirebaseId(feedback.mentorId)
  ) {
    throw new Error('Invalid identifier for mentor milestone feedback sync');
  }
  const path = `users/${uid}/mentorMilestoneFeedback/${feedback.id}`;
  const ref = doc(db, 'users', uid, 'mentorMilestoneFeedback', feedback.id);

  const safeSprintTitle = sanitizeText(feedback.sprintTitle, 160) || 'Solution Sprint';
  const safeMilestoneKey: SprintMilestoneKey =
    feedback.milestoneKey === 'draft-ready' || feedback.milestoneKey === 'final-submission'
      ? feedback.milestoneKey
      : 'analysis-complete';
  const safeMentorName = sanitizeText(feedback.mentorName, 80) || 'Senior Specialist';
  const safeRating = Math.max(1, Math.min(5, Math.round(Number(feedback.rating) || 5))) as MentorRatingScore;
  const safeReadiness =
    feedback.readinessStatus === 'needs-revision' || feedback.readinessStatus === 'exemplary'
      ? feedback.readinessStatus
      : 'approved';
  const safeStrengths = sanitizeText(feedback.strengthsNote, 500);
  if (safeStrengths.length < 3) {
    throw new Error('Milestone feedback strengths note must be at least 3 characters');
  }
  const safeConstructive = sanitizeText(feedback.constructiveFeedback, 1000);
  if (safeConstructive.length < 5) {
    throw new Error('Milestone constructive feedback must be at least 5 characters');
  }
  const safeNextAction = sanitizeText(feedback.nextMilestoneAction, 500);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ownerUid: uid,
        sprintId: feedback.sprintId,
        sprintTitle: safeSprintTitle,
        milestoneKey: safeMilestoneKey,
        mentorId: feedback.mentorId,
        mentorName: safeMentorName,
        rating: safeRating,
        readinessStatus: safeReadiness,
        strengthsNote: safeStrengths,
        constructiveFeedback: safeConstructive,
        nextMilestoneAction: safeNextAction,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        rating: safeRating,
        readinessStatus: safeReadiness,
        strengthsNote: safeStrengths,
        constructiveFeedback: safeConstructive,
        nextMilestoneAction: safeNextAction,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCloudMentorMilestoneFeedback(
  uid: string,
  feedbackId: string
): Promise<void> {
  if (!isValidFirebaseId(uid) || !isValidFirebaseId(feedbackId)) {
    throw new Error('Invalid identifier for mentor milestone feedback deletion');
  }
  const path = `users/${uid}/mentorMilestoneFeedback/${feedbackId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'mentorMilestoneFeedback', feedbackId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function upsertCloudMentorshipSessionAgenda(
  uid: string,
  agenda: MentorshipSessionAgendaRecord
): Promise<void> {
  if (
    !isValidFirebaseId(uid) ||
    !isValidFirebaseId(agenda.id) ||
    !isValidFirebaseId(agenda.sprintId) ||
    !isValidFirebaseId(agenda.mentorId) ||
    (agenda.sessionId && !isValidFirebaseId(agenda.sessionId))
  ) {
    throw new Error('Invalid identifier for mentorship session agenda sync');
  }
  const path = `users/${uid}/mentorshipSessionAgendas/${agenda.id}`;
  const ref = doc(db, 'users', uid, 'mentorshipSessionAgendas', agenda.id);

  const safeSprintTitle = sanitizeText(agenda.sprintTitle, 160) || 'Solution Sprint';
  const safeMentorName = sanitizeText(agenda.mentorName, 80) || 'Senior Specialist';
  const rawDateIso = sanitizeText(agenda.sessionDateIso || new Date().toISOString().slice(0, 10), 40);
  const safeDateIso = rawDateIso.length >= 10 ? rawDateIso : new Date().toISOString().slice(0, 10);
  const safeFocus =
    agenda.focusTopic === 'technical-unblocker' ||
    agenda.focusTopic === 'handover-rubric' ||
    agenda.focusTopic === 'career-rpl'
      ? agenda.focusTopic
      : 'qa-architecture';
  const safeTitle = sanitizeText(agenda.agendaTitle, 140);
  if (safeTitle.length < 3) {
    throw new Error('Session agenda title must be at least 3 characters');
  }
  const safeOutcome = sanitizeText(agenda.desiredOutcome, 400);
  if (safeOutcome.length < 5) {
    throw new Error('Session desired outcome must be at least 5 characters');
  }
  const safeItems = Array.isArray(agenda.agendaItems)
    ? agenda.agendaItems
        .map((item) => sanitizeText(String(item), 240))
        .filter((item) => item.length >= 2)
        .slice(0, 10)
    : [];
  if (safeItems.length === 0) {
    throw new Error('Session agenda must include at least 1 bullet item');
  }
  const safeCompletedIndices = Array.isArray(agenda.completedItemIndices)
    ? agenda.completedItemIndices
        .filter((idx) => Number.isInteger(idx) && idx >= 0 && idx < safeItems.length)
        .slice(0, 10)
    : [];
  const safeShared = Boolean(agenda.sharedWithMentor);

  const optionalFields: Record<string, string> = {};
  if (agenda.sessionId && isValidFirebaseId(agenda.sessionId)) {
    optionalFields.sessionId = agenda.sessionId;
  }

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ownerUid: uid,
        sprintId: agenda.sprintId,
        sprintTitle: safeSprintTitle,
        mentorId: agenda.mentorId,
        mentorName: safeMentorName,
        ...optionalFields,
        sessionDateIso: safeDateIso,
        focusTopic: safeFocus,
        agendaTitle: safeTitle,
        desiredOutcome: safeOutcome,
        agendaItems: safeItems,
        completedItemIndices: safeCompletedIndices,
        sharedWithMentor: safeShared,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        ...optionalFields,
        sessionDateIso: safeDateIso,
        focusTopic: safeFocus,
        agendaTitle: safeTitle,
        desiredOutcome: safeOutcome,
        agendaItems: safeItems,
        completedItemIndices: safeCompletedIndices,
        sharedWithMentor: safeShared,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCloudMentorshipSessionAgenda(
  uid: string,
  agendaId: string
): Promise<void> {
  if (!isValidFirebaseId(uid) || !isValidFirebaseId(agendaId)) {
    throw new Error('Invalid identifier for mentorship session agenda deletion');
  }
  const path = `users/${uid}/mentorshipSessionAgendas/${agendaId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'mentorshipSessionAgendas', agendaId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function upsertCloudMentorPeerReview(
  uid: string,
  review: MentorPeerReviewRecord
): Promise<void> {
  if (
    !isValidFirebaseId(uid) ||
    !isValidFirebaseId(review.id) ||
    !isValidFirebaseId(review.sprintId) ||
    !isValidFirebaseId(review.mentorId)
  ) {
    throw new Error('Invalid identifier for mentor peer review sync');
  }
  const path = `users/${uid}/mentorPeerReviews/${review.id}`;
  const ref = doc(db, 'users', uid, 'mentorPeerReviews', review.id);

  const clampScore = (val: number): 1 | 2 | 3 | 4 | 5 => {
    const rounded = Math.round(Number(val));
    if (rounded <= 1) return 1;
    if (rounded >= 5) return 5;
    return rounded as 1 | 2 | 3 | 4 | 5;
  };

  const safeSprintTitle = sanitizeText(review.sprintTitle, 160) || 'Solution Sprint';
  const safeMentorName = sanitizeText(review.mentorName, 80) || 'Lead Pod Mentor';
  const safeMentorRole = sanitizeText(review.mentorRole, 120) || 'Senior Pod Mentor';
  const rawDate = sanitizeText(review.reviewedDate || new Date().toISOString().slice(0, 10), 40);
  const safeReviewedDate = rawDate.length >= 10 ? rawDate : new Date().toISOString().slice(0, 10);
  const safeFeedback = sanitizeText(review.feedbackText, 1000);
  if (safeFeedback.length < 5) {
    throw new Error('Mentor peer review feedback must be at least 5 characters');
  }
  const safeAction = sanitizeText(review.recommendedAction, 400);

  const cohesionScore = clampScore(review.cohesionScore);
  const framingScore = clampScore(review.framingScore);
  const communicationScore = clampScore(review.communicationScore);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ownerUid: uid,
        sprintId: review.sprintId,
        sprintTitle: safeSprintTitle,
        mentorId: review.mentorId,
        mentorName: safeMentorName,
        mentorRole: safeMentorRole,
        reviewedDate: safeReviewedDate,
        cohesionScore,
        framingScore,
        communicationScore,
        feedbackText: safeFeedback,
        recommendedAction: safeAction,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        mentorName: safeMentorName,
        mentorRole: safeMentorRole,
        reviewedDate: safeReviewedDate,
        cohesionScore,
        framingScore,
        communicationScore,
        feedbackText: safeFeedback,
        recommendedAction: safeAction,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCloudMentorPeerReview(
  uid: string,
  reviewId: string
): Promise<void> {
  if (!isValidFirebaseId(uid) || !isValidFirebaseId(reviewId)) {
    throw new Error('Invalid identifier for mentor peer review deletion');
  }
  const path = `users/${uid}/mentorPeerReviews/${reviewId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'mentorPeerReviews', reviewId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function upsertCloudCollaborationNote(
  uid: string,
  note: SprintCollaborationNote
): Promise<void> {
  if (
    !isValidFirebaseId(uid) ||
    !isValidFirebaseId(note.id) ||
    !isValidFirebaseId(note.contributionId) ||
    !isValidFirebaseId(note.briefId)
  ) {
    throw new Error('Invalid identifier for collaboration note sync');
  }
  const path = `users/${uid}/collaborationNotes/${note.id}`;
  const ref = doc(db, 'users', uid, 'collaborationNotes', note.id);

  const safeTitle = sanitizeText(note.briefTitle, 160) || 'Sprint Collaboration';
  const safeBody = sanitizeText(note.markdownBody, 4000);
  if (safeBody.length < 1) {
    throw new Error('Collaboration note cannot be empty');
  }

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ownerUid: uid,
        contributionId: note.contributionId,
        briefId: note.briefId,
        briefTitle: safeTitle,
        markdownBody: safeBody,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        briefTitle: safeTitle,
        markdownBody: safeBody,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCloudCollaborationNote(
  uid: string,
  noteId: string
): Promise<void> {
  if (!isValidFirebaseId(uid) || !isValidFirebaseId(noteId)) {
    throw new Error('Invalid identifier for collaboration note deletion');
  }
  const path = `users/${uid}/collaborationNotes/${noteId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'collaborationNotes', noteId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

function sanitizeSafeResourceUrl(raw?: string): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim().slice(0, 500);
  if (!/^https?:\/\/[^\s]+$/i.test(trimmed)) return undefined;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return undefined;
    return trimmed;
  } catch {
    return undefined;
  }
}

export async function upsertCloudSprintDiscussionPost(
  uid: string,
  post: SprintDiscussionPost
): Promise<void> {
  if (
    !isValidFirebaseId(uid) ||
    !isValidFirebaseId(post.id) ||
    !isValidFirebaseId(post.sprintId) ||
    (post.parentId && !isValidFirebaseId(post.parentId))
  ) {
    throw new Error('Invalid identifier for sprint discussion post sync');
  }
  const path = `pods/${post.sprintId}/discussions/${post.id}`;
  const ref = doc(db, 'pods', post.sprintId, 'discussions', post.id);

  const rawName = sanitizeText(post.authorName, 80);
  const safeAuthorName = rawName.length >= 2 ? rawName : 'Pod Member';
  const rawRole = sanitizeText(post.authorRole, 80);
  const safeAuthorRole = rawRole.length >= 2 ? rawRole : 'Pod Contributor';
  const rawTag = sanitizeText(post.deliverableTag, 140);
  const safeDeliverableTag = rawTag.length >= 2 ? rawTag : 'Shared Deliverable';
  const safeBody = sanitizeText(post.body, 1200);

  if (safeBody.length < 1) {
    throw new Error('Discussion post body cannot be empty');
  }

  const safeResourceUrl = sanitizeSafeResourceUrl(post.resourceUrl);
  const rawResourceLabel = safeResourceUrl
    ? sanitizeText(post.resourceLabel ?? '', 120)
    : '';

  const optionalFields: Record<string, string> = {};
  if (post.parentId) {
    optionalFields.parentId = post.parentId;
  }
  if (safeResourceUrl) {
    optionalFields.resourceUrl = safeResourceUrl;
    if (rawResourceLabel.length >= 1) {
      optionalFields.resourceLabel = rawResourceLabel;
    }
  }

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        sprintId: post.sprintId,
        authorUid: uid,
        authorName: safeAuthorName,
        authorRole: safeAuthorRole,
        deliverableTag: safeDeliverableTag,
        body: safeBody,
        ...optionalFields,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const updatePayload: Record<string, unknown> = {
        deliverableTag: safeDeliverableTag,
        body: safeBody,
        updatedAt: serverTimestamp(),
      };
      if (safeResourceUrl) {
        updatePayload.resourceUrl = safeResourceUrl;
        if (rawResourceLabel.length >= 1) {
          updatePayload.resourceLabel = rawResourceLabel;
        }
      }
      await updateDoc(ref, updatePayload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCloudSprintDiscussionPost(
  sprintId: string,
  postId: string
): Promise<void> {
  if (!isValidFirebaseId(sprintId) || !isValidFirebaseId(postId)) {
    throw new Error('Invalid identifier for sprint discussion post deletion');
  }
  const path = `pods/${sprintId}/discussions/${postId}`;
  try {
    await deleteDoc(doc(db, 'pods', sprintId, 'discussions', postId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fetchCloudWorkspace(uid: string): Promise<{
  profile: Partial<PractitionerProfile> | null;
  capabilities: SkillCapability[];
  contributions: BriefSubmission[];
  vault: WorkReadyVault | null;
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
}> {
  const userPath = `users/${uid}`;
  try {
    const profileSnap = await getDoc(doc(db, 'users', uid));
    const profile = profileSnap.exists()
      ? (profileSnap.data() as Partial<PractitionerProfile>)
      : null;

    if (!profile) {
      return {
        profile: null,
        capabilities: [],
        contributions: [],
        vault: null,
        endorsements: [],
        payouts: [],
        sprintFeedback: [],
        mentorMessages: [],
        mentorshipSessions: [],
        mentorPairings: [],
        mentorRatings: [],
        mentorshipTrackProgress: [],
        mentorshipJournal: [],
        menteeCompetencyBadges: [],
        mentorMilestoneFeedback: [],
        mentorshipSessionAgendas: [],
        mentorPeerReviews: [],
        collaborationNotes: [],
      };
    }

    const capsSnap = await getDocs(collection(db, 'users', uid, 'capabilities'));
    const capabilities: SkillCapability[] = capsSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ownerUid: String(data.ownerUid ?? uid),
        title: String(data.title ?? ''),
        domain: String(data.domain ?? 'Green Energy'),
        proofSummary: String(data.proofSummary ?? ''),
        portfolioRef: data.portfolioRef ? String(data.portfolioRef) : undefined,
        certificationRef: data.certificationRef ? String(data.certificationRef) : undefined,
        peerEndorsement: data.peerEndorsement ? String(data.peerEndorsement) : undefined,
        verificationStatus: data.verificationStatus ?? 'pending',
        confidenceScore: Number(data.confidenceScore ?? 50),
        createdAtIso: new Date().toISOString(),
        updatedAtIso: new Date().toISOString(),
      };
    });

    const contribSnap = await getDocs(collection(db, 'users', uid, 'contributions'));
    const contributions: BriefSubmission[] = contribSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ownerUid: String(data.ownerUid ?? uid),
        briefId: String(data.briefId ?? d.id),
        briefTitle: String(data.briefTitle ?? ''),
        domain: String(data.domain ?? 'Green Energy'),
        status: data.status ?? 'in-progress',
        solutionNotes: String(data.solutionNotes ?? ''),
        hoursLogged: Number(data.hoursLogged ?? 0),
        payoutUsd: Number(data.payoutUsd ?? 0),
        milestonesDone: Array.isArray(data.milestonesDone)
          ? normalizeSprintMilestones(data.milestonesDone as SprintMilestoneKey[], data.status === 'completed')
          : undefined,
        createdAtIso: new Date().toISOString(),
        updatedAtIso: new Date().toISOString(),
      };
    });

    let vault: WorkReadyVault | null = null;
    try {
      const vaultSnap = await getDoc(doc(db, 'users', uid, 'vaults', 'primary-vault'));
      if (vaultSnap.exists()) {
        const data = vaultSnap.data();
        vault = {
          id: vaultSnap.id,
          ownerUid: String(data.ownerUid ?? uid),
          identityCompleted: Boolean(data.identityCompleted),
          identityPathway: data.identityPathway ?? 'remote-contractor',
          contractCompleted: Boolean(data.contractCompleted),
          contractTemplate: data.contractTemplate ?? 'milestone-sprint',
          payoutCompleted: Boolean(data.payoutCompleted),
          payoutRail: data.payoutRail ?? 'mobile-money',
          financialIdentityCleared: Boolean(data.financialIdentityCleared),
          financialRailTested: Boolean(data.financialRailTested),
          financialTaxCleared: Boolean(data.financialTaxCleared),
          financialRail: data.financialRail ?? data.payoutRail ?? 'mobile-money',
          onboardingPackGenerated: Boolean(data.onboardingPackGenerated),
          onboardingContractStructure: data.onboardingContractStructure ?? 'scoped-remote',
          onboardingPartnerOrg: data.onboardingPartnerOrg ? String(data.onboardingPartnerOrg) : '',
          onboardingHostCountry: data.onboardingHostCountry
            ? String(data.onboardingHostCountry)
            : 'Kenya',
          proofPortfolioReady: Boolean(data.proofPortfolioReady),
          proofSkillTrack: data.proofSkillTrack ?? 'trades-solar',
          proofLocalScore: Number(data.proofLocalScore ?? 0),
          proofRemoteScore: Number(data.proofRemoteScore ?? 0),
          workplaceSignalsCount: Number(data.workplaceSignalsCount ?? 0),
          matchedWorkCount: Number(data.matchedWorkCount ?? 0),
          appliedOpportunityIds: Array.isArray(data.appliedOpportunityIds)
            ? data.appliedOpportunityIds.map((id) => String(id))
            : [],
          upskillingBridgesCount: Number(data.upskillingBridgesCount ?? 0),
          lockedBridgeOpportunityIds: Array.isArray(data.lockedBridgeOpportunityIds)
            ? data.lockedBridgeOpportunityIds.map((id) => String(id))
            : [],
          updatedAtIso: new Date().toISOString(),
        };
      }
    } catch {
      vault = null;
    }

    let endorsements: PeerEndorsement[] = [];
    try {
      const endSnap = await getDocs(collection(db, 'users', uid, 'endorsements'));
      endorsements = endSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ownerUid: String(data.ownerUid ?? uid),
          collaboratorName: String(data.collaboratorName ?? ''),
          collaboratorRole: String(data.collaboratorRole ?? ''),
          organization: String(data.organization ?? ''),
          capabilityTitle: String(data.capabilityTitle ?? ''),
          endorsementText: String(data.endorsementText ?? ''),
          status: data.status === 'verified' ? 'verified' : 'requested',
          shareToken: String(data.shareToken ?? d.id),
          sourceTab: data.sourceTab === 'unlock' ? 'unlock' : 'verify',
          createdAtIso: new Date().toISOString(),
          updatedAtIso: new Date().toISOString(),
        };
      });
    } catch {
      endorsements = [];
    }

    let payouts: ContractPayout[] = [];
    try {
      const paySnap = await getDocs(collection(db, 'users', uid, 'payouts'));
      payouts = paySnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ownerUid: String(data.ownerUid ?? uid),
          sprintId: String(data.sprintId ?? d.id),
          sprintTitle: String(data.sprintTitle ?? ''),
          partnerOrg: String(data.partnerOrg ?? ''),
          amountUsd: Number(data.amountUsd ?? 0),
          payoutRail: data.payoutRail ?? 'mobile-money',
          status:
            data.status === 'released' || data.status === 'processing'
              ? data.status
              : 'escrow-held',
          createdAtIso: new Date().toISOString(),
          updatedAtIso: new Date().toISOString(),
        };
      });
    } catch {
      payouts = [];
    }

    let sprintFeedback: SprintFeedback[] = [];
    try {
      const fbSnap = await getDocs(collection(db, 'users', uid, 'sprintFeedback'));
      sprintFeedback = fbSnap.docs.map((d) => {
        const data = d.data();
        const rawRating = Math.max(1, Math.min(5, Math.round(Number(data.rating) || 5))) as SprintRatingScore;
        return {
          id: d.id,
          ownerUid: String(data.ownerUid ?? uid),
          contributionId: String(data.contributionId ?? d.id),
          briefId: String(data.briefId ?? d.id),
          briefTitle: String(data.briefTitle ?? ''),
          partnerOrg: String(data.partnerOrg ?? ''),
          reviewerName: String(data.reviewerName ?? ''),
          reviewerRole: String(data.reviewerRole ?? ''),
          rating: rawRating,
          reviewText: String(data.reviewText ?? ''),
          createdAtIso: new Date().toISOString(),
          updatedAtIso: new Date().toISOString(),
        };
      });
    } catch {
      sprintFeedback = [];
    }

    let mentorMessages: MentorMessage[] = [];
    try {
      const msgSnap = await getDocs(collection(db, 'users', uid, 'mentorMessages'));
      mentorMessages = msgSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ownerUid: String(data.ownerUid ?? uid),
          sprintId: String(data.sprintId ?? d.id),
          sprintTitle: String(data.sprintTitle ?? ''),
          mentorId: String(data.mentorId ?? ''),
          mentorName: String(data.mentorName ?? ''),
          sender: data.sender === 'mentor' ? 'mentor' : 'practitioner',
          body: String(data.body ?? ''),
          createdAtIso: new Date().toISOString(),
          updatedAtIso: new Date().toISOString(),
        };
      });
    } catch {
      mentorMessages = [];
    }

    let collaborationNotes: SprintCollaborationNote[] = [];
    try {
      const notesSnap = await getDocs(collection(db, 'users', uid, 'collaborationNotes'));
      collaborationNotes = notesSnap.docs.map((d) => {
        const data = d.data();
        const createdIso =
          typeof data.createdAt?.toDate === 'function'
            ? data.createdAt.toDate().toISOString()
            : new Date().toISOString();
        const updatedIso =
          typeof data.updatedAt?.toDate === 'function'
            ? data.updatedAt.toDate().toISOString()
            : createdIso;
        return {
          id: d.id,
          ownerUid: String(data.ownerUid ?? uid),
          contributionId: String(data.contributionId ?? d.id),
          briefId: String(data.briefId ?? d.id),
          briefTitle: String(data.briefTitle ?? ''),
          markdownBody: String(data.markdownBody ?? ''),
          createdAtIso: createdIso,
          updatedAtIso: updatedIso,
        };
      });
    } catch {
      collaborationNotes = [];
    }

    let mentorshipSessions: MentorshipSession[] = [];
    try {
      const sessSnap = await getDocs(collection(db, 'users', uid, 'mentorshipSessions'));
      mentorshipSessions = sessSnap.docs.map((d) => {
        const data = d.data();
        const createdIso =
          typeof data.createdAt?.toDate === 'function'
            ? data.createdAt.toDate().toISOString()
            : new Date().toISOString();
        const updatedIso =
          typeof data.updatedAt?.toDate === 'function'
            ? data.updatedAt.toDate().toISOString()
            : createdIso;
        const focusTopic =
          data.focusTopic === 'technical-unblocker' ||
          data.focusTopic === 'handover-rubric' ||
          data.focusTopic === 'career-rpl'
            ? data.focusTopic
            : 'qa-architecture';
        const durNum = Number(data.durationMinutes ?? 30);
        const durationMinutes: 15 | 30 | 45 | 60 =
          durNum === 15 || durNum === 45 || durNum === 60 ? durNum : 30;
        return {
          id: d.id,
          ownerUid: String(data.ownerUid ?? uid),
          sprintId: String(data.sprintId ?? d.id),
          sprintTitle: String(data.sprintTitle ?? ''),
          mentorId: String(data.mentorId ?? 'mentor-green-01'),
          mentorName: String(data.mentorName ?? 'Senior Specialist'),
          focusTopic,
          durationMinutes,
          status: data.status === 'scheduled' ? 'scheduled' : 'attended',
          takeawayNote: String(data.takeawayNote ?? ''),
          attendedAtIso: String(data.attendedAtIso ?? createdIso),
          createdAtIso: createdIso,
          updatedAtIso: updatedIso,
        };
      });
    } catch {
      mentorshipSessions = [];
    }

    let mentorPairings: MentorPairingRequest[] = [];
    try {
      const pairingSnap = await getDocs(collection(db, 'users', uid, 'mentorPairings'));
      mentorPairings = pairingSnap.docs.map((d) => {
        const data = d.data();
        const createdIso =
          typeof data.createdAt?.toDate === 'function'
            ? data.createdAt.toDate().toISOString()
            : new Date().toISOString();
        const updatedIso =
          typeof data.updatedAt?.toDate === 'function'
            ? data.updatedAt.toDate().toISOString()
            : createdIso;
        const domain =
          data.domain === 'Tech' ||
          data.domain === 'Healthcare Ops' ||
          data.domain === 'SME Finance'
            ? data.domain
            : 'Green Energy';
        const preferredCadence =
          data.preferredCadence === 'weekly-check-in' || data.preferredCadence === 'async-review'
            ? data.preferredCadence
            : 'milestone-gates';
        const status =
          data.status === 'matched' || data.status === 'active' ? data.status : 'requested';
        return {
          id: d.id,
          ownerUid: String(data.ownerUid ?? uid),
          trackId: String(data.trackId ?? 'track-green-energy'),
          trackTitle: String(data.trackTitle ?? 'Mentorship Track'),
          domain,
          mentorId: String(data.mentorId ?? 'mentor-green-01'),
          mentorName: String(data.mentorName ?? 'Senior Specialist'),
          sprintId: data.sprintId ? String(data.sprintId) : undefined,
          sprintTitle: data.sprintTitle ? String(data.sprintTitle) : undefined,
          preferredCadence,
          sprintGoals: String(data.sprintGoals ?? ''),
          status,
          createdAtIso: createdIso,
          updatedAtIso: updatedIso,
        };
      });
    } catch {
      mentorPairings = [];
    }

    let mentorRatings: MentorRating[] = [];
    try {
      const ratingSnap = await getDocs(collection(db, 'users', uid, 'mentorRatings'));
      mentorRatings = ratingSnap.docs.map((d) => {
        const data = d.data();
        const createdIso =
          typeof data.createdAt?.toDate === 'function'
            ? data.createdAt.toDate().toISOString()
            : new Date().toISOString();
        const updatedIso =
          typeof data.updatedAt?.toDate === 'function'
            ? data.updatedAt.toDate().toISOString()
            : createdIso;
        const domain =
          data.domain === 'Tech' ||
          data.domain === 'Healthcare Ops' ||
          data.domain === 'SME Finance'
            ? data.domain
            : 'Green Energy';
        const rawScore = Math.max(1, Math.min(5, Math.round(Number(data.rating) || 5))) as MentorRatingScore;
        return {
          id: d.id,
          ownerUid: String(data.ownerUid ?? uid),
          trackId: String(data.trackId ?? 'track-green-energy'),
          trackTitle: String(data.trackTitle ?? 'Mentorship Track'),
          domain,
          mentorId: String(data.mentorId ?? 'mentor-green-01'),
          mentorName: String(data.mentorName ?? 'Senior Specialist'),
          rating: rawScore,
          comment: String(data.comment ?? ''),
          createdAtIso: createdIso,
          updatedAtIso: updatedIso,
        };
      });
    } catch {
      mentorRatings = [];
    }

    let mentorshipTrackProgress: MentorshipTrackProgressRecord[] = [];
    try {
      const progSnap = await getDocs(collection(db, 'users', uid, 'mentorshipTrackProgress'));
      mentorshipTrackProgress = progSnap.docs.map((d) => {
        const data = d.data();
        const createdIso =
          typeof data.createdAt?.toDate === 'function'
            ? data.createdAt.toDate().toISOString()
            : new Date().toISOString();
        const updatedIso =
          typeof data.updatedAt?.toDate === 'function'
            ? data.updatedAt.toDate().toISOString()
            : createdIso;
        const completedObjectiveIds = Array.isArray(data.completedObjectiveIds)
          ? data.completedObjectiveIds.map((id: unknown) => String(id))
          : [];
        return {
          id: d.id,
          ownerUid: String(data.ownerUid ?? uid),
          trackId: String(data.trackId ?? d.id),
          completedObjectiveIds,
          createdAtIso: createdIso,
          updatedAtIso: updatedIso,
        };
      });
    } catch {
      mentorshipTrackProgress = [];
    }

    let mentorshipJournal: MentorshipJournalEntry[] = [];
    try {
      const journalSnap = await getDocs(collection(db, 'users', uid, 'mentorshipJournal'));
      mentorshipJournal = journalSnap.docs.map((d) => {
        const data = d.data();
        const createdIso =
          typeof data.createdAt?.toDate === 'function'
            ? data.createdAt.toDate().toISOString()
            : new Date().toISOString();
        const updatedIso =
          typeof data.updatedAt?.toDate === 'function'
            ? data.updatedAt.toDate().toISOString()
            : createdIso;
        const focusTopic =
          data.focusTopic === 'technical-unblocker' ||
          data.focusTopic === 'handover-rubric' ||
          data.focusTopic === 'career-rpl'
            ? data.focusTopic
            : 'qa-architecture';
        return {
          id: d.id,
          ownerUid: String(data.ownerUid ?? uid),
          contributionId: String(data.contributionId ?? d.id),
          briefId: String(data.briefId ?? d.id),
          briefTitle: String(data.briefTitle ?? 'Solution Sprint'),
          mentorId: String(data.mentorId ?? 'mentor-green-01'),
          mentorName: String(data.mentorName ?? 'Senior Specialist'),
          sessionDateIso: String(data.sessionDateIso ?? createdIso.slice(0, 10)),
          focusTopic,
          reflectionTitle: String(data.reflectionTitle ?? 'Session Reflection'),
          reflectionBody: String(data.reflectionBody ?? ''),
          nextActionStep: String(data.nextActionStep ?? ''),
          createdAtIso: createdIso,
          updatedAtIso: updatedIso,
        };
      });
    } catch {
      mentorshipJournal = [];
    }

    let menteeCompetencyBadges: MenteeCompetencyBadge[] = [];
    try {
      const badgesSnap = await getDocs(collection(db, 'users', uid, 'menteeCompetencyBadges'));
      menteeCompetencyBadges = badgesSnap.docs.map((d) => {
        const data = d.data();
        const createdIso =
          typeof data.createdAt?.toDate === 'function'
            ? data.createdAt.toDate().toISOString()
            : new Date().toISOString();
        const updatedIso =
          typeof data.updatedAt?.toDate === 'function'
            ? data.updatedAt.toDate().toISOString()
            : createdIso;
        const domain =
          data.domain === 'Tech' ||
          data.domain === 'Healthcare Ops' ||
          data.domain === 'SME Finance'
            ? data.domain
            : 'Green Energy';
        const competencyLevel =
          data.competencyLevel === 'field-ready' ||
          data.competencyLevel === 'pod-lead-endorsed'
            ? data.competencyLevel
            : 'specialist-verified';
        const performanceRating = Math.max(
          1,
          Math.min(5, Math.round(Number(data.performanceRating) || 5))
        ) as MentorRatingScore;
        const evaluatedCompetencies = Array.isArray(data.evaluatedCompetencies)
          ? data.evaluatedCompetencies
              .map((c: unknown) => sanitizeText(String(c ?? ''), 80))
              .filter((c: string) => c.length >= 2)
              .slice(0, 8)
          : [];
        return {
          id: d.id,
          ownerUid: String(data.ownerUid ?? uid),
          sprintId: String(data.sprintId ?? d.id),
          sprintTitle: String(data.sprintTitle ?? 'Completed Pod Sprint'),
          domain,
          mentorId: String(data.mentorId ?? 'mentor-green-01'),
          mentorName: String(data.mentorName ?? 'Senior Specialist'),
          mentorRole: String(data.mentorRole ?? 'Senior Pod Mentor'),
          badgeTitle: String(data.badgeTitle ?? 'Verified Pod Sprint Competency'),
          skillCategory: String(data.skillCategory ?? 'Applied Field Competency'),
          competencyLevel,
          performanceRating,
          evaluatedCompetencies,
          citationNote: String(data.citationNote ?? ''),
          verificationCode: String(data.verificationCode ?? `KORA-BADGE-${d.id.slice(0, 8)}`),
          awardedAtIso: String(data.awardedAtIso ?? createdIso.slice(0, 10)),
          createdAtIso: createdIso,
          updatedAtIso: updatedIso,
        };
      });
    } catch {
      menteeCompetencyBadges = [];
    }

    let mentorMilestoneFeedback: MentorMilestoneFeedback[] = [];
    try {
      const milestoneFbSnap = await getDocs(collection(db, 'users', uid, 'mentorMilestoneFeedback'));
      mentorMilestoneFeedback = milestoneFbSnap.docs.map((d) => {
        const data = d.data();
        const createdIso =
          typeof data.createdAt?.toDate === 'function'
            ? data.createdAt.toDate().toISOString()
            : new Date().toISOString();
        const updatedIso =
          typeof data.updatedAt?.toDate === 'function'
            ? data.updatedAt.toDate().toISOString()
            : createdIso;
        const milestoneKey: SprintMilestoneKey =
          data.milestoneKey === 'draft-ready' || data.milestoneKey === 'final-submission'
            ? data.milestoneKey
            : 'analysis-complete';
        const rating = Math.max(1, Math.min(5, Math.round(Number(data.rating) || 5))) as MentorRatingScore;
        const readinessStatus =
          data.readinessStatus === 'needs-revision' || data.readinessStatus === 'exemplary'
            ? data.readinessStatus
            : 'approved';
        return {
          id: d.id,
          ownerUid: String(data.ownerUid ?? uid),
          sprintId: String(data.sprintId ?? d.id),
          sprintTitle: String(data.sprintTitle ?? 'Solution Sprint'),
          milestoneKey,
          mentorId: String(data.mentorId ?? 'mentor-green-01'),
          mentorName: String(data.mentorName ?? 'Senior Specialist'),
          rating,
          readinessStatus,
          strengthsNote: String(data.strengthsNote ?? ''),
          constructiveFeedback: String(data.constructiveFeedback ?? ''),
          nextMilestoneAction: String(data.nextMilestoneAction ?? ''),
          createdAtIso: createdIso,
          updatedAtIso: updatedIso,
        };
      });
    } catch {
      mentorMilestoneFeedback = [];
    }

    let mentorshipSessionAgendas: MentorshipSessionAgendaRecord[] = [];
    try {
      const agendaSnap = await getDocs(collection(db, 'users', uid, 'mentorshipSessionAgendas'));
      mentorshipSessionAgendas = agendaSnap.docs.map((d) => {
        const data = d.data();
        const createdIso =
          typeof data.createdAt?.toDate === 'function'
            ? data.createdAt.toDate().toISOString()
            : new Date().toISOString();
        const updatedIso =
          typeof data.updatedAt?.toDate === 'function'
            ? data.updatedAt.toDate().toISOString()
            : createdIso;
        const focusTopic =
          data.focusTopic === 'technical-unblocker' ||
          data.focusTopic === 'handover-rubric' ||
          data.focusTopic === 'career-rpl'
            ? data.focusTopic
            : 'qa-architecture';
        const agendaItems = Array.isArray(data.agendaItems)
          ? data.agendaItems.map((item: unknown) => String(item)).filter((item: string) => item.length > 0)
          : [];
        const completedItemIndices = Array.isArray(data.completedItemIndices)
          ? data.completedItemIndices
              .map((idx: unknown) => Number(idx))
              .filter((idx: number) => Number.isInteger(idx) && idx >= 0)
          : [];
        return {
          id: d.id,
          ownerUid: String(data.ownerUid ?? uid),
          sprintId: String(data.sprintId ?? d.id),
          sprintTitle: String(data.sprintTitle ?? 'Solution Sprint'),
          mentorId: String(data.mentorId ?? 'mentor-green-01'),
          mentorName: String(data.mentorName ?? 'Senior Specialist'),
          sessionId: data.sessionId ? String(data.sessionId) : undefined,
          sessionDateIso: String(data.sessionDateIso ?? createdIso.slice(0, 10)),
          focusTopic,
          agendaTitle: String(data.agendaTitle ?? 'Session Agenda'),
          desiredOutcome: String(data.desiredOutcome ?? ''),
          agendaItems,
          completedItemIndices,
          sharedWithMentor: Boolean(data.sharedWithMentor),
          createdAtIso: createdIso,
          updatedAtIso: updatedIso,
        };
      });
    } catch {
      mentorshipSessionAgendas = [];
    }

    let mentorPeerReviews: MentorPeerReviewRecord[] = [];
    try {
      const peerSnap = await getDocs(collection(db, 'users', uid, 'mentorPeerReviews'));
      const toScore = (val: unknown): SprintRatingScore => {
        const n = Math.round(Number(val));
        if (n <= 1) return 1;
        if (n >= 5) return 5;
        return n as SprintRatingScore;
      };
      mentorPeerReviews = peerSnap.docs.map((d) => {
        const data = d.data();
        const createdIso =
          typeof data.createdAt?.toDate === 'function'
            ? data.createdAt.toDate().toISOString()
            : new Date().toISOString();
        const updatedIso =
          typeof data.updatedAt?.toDate === 'function'
            ? data.updatedAt.toDate().toISOString()
            : createdIso;
        return {
          id: d.id,
          ownerUid: String(data.ownerUid ?? uid),
          sprintId: String(data.sprintId ?? d.id),
          sprintTitle: String(data.sprintTitle ?? 'Solution Sprint'),
          mentorId: String(data.mentorId ?? 'mentor-green-01'),
          mentorName: String(data.mentorName ?? 'Lead Pod Mentor'),
          mentorRole: String(data.mentorRole ?? 'Senior Pod Mentor'),
          reviewedDate: String(data.reviewedDate ?? createdIso.slice(0, 10)),
          cohesionScore: toScore(data.cohesionScore ?? 5),
          framingScore: toScore(data.framingScore ?? 5),
          communicationScore: toScore(data.communicationScore ?? 5),
          feedbackText: String(data.feedbackText ?? ''),
          recommendedAction: String(data.recommendedAction ?? ''),
          createdAtIso: createdIso,
          updatedAtIso: updatedIso,
        };
      });
    } catch {
      mentorPeerReviews = [];
    }

    return {
      profile,
      capabilities,
      contributions,
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
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userPath);
  }
}

export function subscribeToCapabilities(
  uid: string,
  onData: (items: SkillCapability[]) => void
): Unsubscribe {
  const path = `users/${uid}/capabilities`;
  return onSnapshot(
    collection(db, 'users', uid, 'capabilities'),
    (snapshot) => {
      const items: SkillCapability[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ownerUid: String(data.ownerUid ?? uid),
          title: String(data.title ?? ''),
          domain: String(data.domain ?? 'Green Energy'),
          proofSummary: String(data.proofSummary ?? ''),
          portfolioRef: data.portfolioRef ? String(data.portfolioRef) : undefined,
          certificationRef: data.certificationRef ? String(data.certificationRef) : undefined,
          peerEndorsement: data.peerEndorsement ? String(data.peerEndorsement) : undefined,
          verificationStatus: data.verificationStatus ?? 'pending',
          confidenceScore: Number(data.confidenceScore ?? 50),
          createdAtIso: new Date().toISOString(),
          updatedAtIso: new Date().toISOString(),
        };
      });
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeToContributions(
  uid: string,
  onData: (items: BriefSubmission[]) => void
): Unsubscribe {
  const path = `users/${uid}/contributions`;
  return onSnapshot(
    collection(db, 'users', uid, 'contributions'),
    (snapshot) => {
      const items: BriefSubmission[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ownerUid: String(data.ownerUid ?? uid),
          briefId: String(data.briefId ?? d.id),
          briefTitle: String(data.briefTitle ?? ''),
          domain: String(data.domain ?? 'Green Energy'),
          status: data.status ?? 'in-progress',
          solutionNotes: String(data.solutionNotes ?? ''),
          hoursLogged: Number(data.hoursLogged ?? 0),
          payoutUsd: Number(data.payoutUsd ?? 0),
          milestonesDone: Array.isArray(data.milestonesDone)
            ? normalizeSprintMilestones(data.milestonesDone as SprintMilestoneKey[], data.status === 'completed')
            : undefined,
          createdAtIso: new Date().toISOString(),
          updatedAtIso: new Date().toISOString(),
        };
      });
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeToSprintDiscussions(
  sprintId: string,
  onData: (items: SprintDiscussionPost[]) => void
): Unsubscribe {
  if (!isValidFirebaseId(sprintId)) {
    onData([]);
    return () => {};
  }
  const path = `pods/${sprintId}/discussions`;
  const q = query(
    collection(db, 'pods', sprintId, 'discussions'),
    where('sprintId', '==', sprintId)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items: SprintDiscussionPost[] = snapshot.docs.map((d) => {
        const data = d.data();
        const createdIso =
          typeof data.createdAt?.toDate === 'function'
            ? data.createdAt.toDate().toISOString()
            : new Date().toISOString();
        const updatedIso =
          typeof data.updatedAt?.toDate === 'function'
            ? data.updatedAt.toDate().toISOString()
            : createdIso;
        return {
          id: d.id,
          sprintId: String(data.sprintId ?? sprintId),
          parentId: data.parentId ? String(data.parentId) : null,
          authorUid: String(data.authorUid ?? ''),
          authorName: String(data.authorName ?? 'Pod Member'),
          authorRole: String(data.authorRole ?? 'Pod Contributor'),
          deliverableTag: String(data.deliverableTag ?? 'Shared Deliverable'),
          body: String(data.body ?? ''),
          resourceUrl: data.resourceUrl ? String(data.resourceUrl) : undefined,
          resourceLabel: data.resourceLabel ? String(data.resourceLabel) : undefined,
          createdAtIso: createdIso,
          updatedAtIso: updatedIso,
        };
      });
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}
