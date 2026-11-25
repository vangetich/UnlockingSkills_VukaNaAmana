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
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import type {
  BriefSubmission,
  CompetencyPassport,
  ContractPayout,
  MentorMessage,
  PeerEndorsement,
  PractitionerProfile,
  SkillCapability,
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
    // Force HTTP long-polling so proxied/iframe networks never hit WebChannel 10s backend timeouts
    return initializeFirestore(
      app,
      { experimentalForceLongPolling: true },
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

async function testConnection() {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
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

export async function fetchCloudWorkspace(uid: string): Promise<{
  profile: Partial<PractitionerProfile> | null;
  capabilities: SkillCapability[];
  contributions: BriefSubmission[];
  vault: WorkReadyVault | null;
  endorsements: PeerEndorsement[];
  payouts: ContractPayout[];
  sprintFeedback: SprintFeedback[];
  mentorMessages: MentorMessage[];
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

    return {
      profile,
      capabilities,
      contributions,
      vault,
      endorsements,
      payouts,
      sprintFeedback,
      mentorMessages,
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
