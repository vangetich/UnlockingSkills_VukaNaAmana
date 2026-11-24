import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  signOut as firebaseSignOut,
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
  PeerEndorsement,
  PractitionerProfile,
  SkillCapability,
  WorkReadyVault,
} from '../types/kora';
import { isValidFirebaseId, sanitizeText } from '../utils/talentEngine';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

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
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testConnection();

export async function signInWithGoogle(): Promise<User> {
  const credential = await signInWithPopup(auth, googleProvider);
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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      if (contribution.status === 'completed' && safeNotes.length >= 10 && safeHours > 0) {
        await updateDoc(ref, {
          status: 'completed',
          solutionNotes: safeNotes,
          hoursLogged: safeHours,
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
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(ref, {
          solutionNotes: safeNotes,
          hoursLogged: safeHours,
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

export async function fetchCloudWorkspace(uid: string): Promise<{
  profile: Partial<PractitionerProfile> | null;
  capabilities: SkillCapability[];
  contributions: BriefSubmission[];
  vault: WorkReadyVault | null;
  endorsements: PeerEndorsement[];
  payouts: ContractPayout[];
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

    return { profile, capabilities, contributions, vault, endorsements, payouts };
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
