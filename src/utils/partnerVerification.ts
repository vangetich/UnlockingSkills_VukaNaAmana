export type PartnerVerificationStepId =
  | 'identityAuth'
  | 'competencyProof'
  | 'payoutRail';

export type PartnerStepReviewStatus =
  | 'pending'
  | 'verified'
  | 'needs_clarification';

export type DocumentFeedbackStage =
  | 'step_1_identity'
  | 'step_2_competency'
  | 'step_3_payout'
  | 'pre_contracting';

export type PartnerFeedbackTone =
  | 'approved'
  | 'clarification_needed'
  | 'encouragement';

export interface PartnerStepState {
  status: PartnerStepReviewStatus;
  updatedAtIso: string | null;
  verifiedByOrgName?: string;
  reviewerNote?: string;
}

export interface PartnerPreContractingRecord {
  consentId: string;
  steps: Record<PartnerVerificationStepId, PartnerStepState>;
  updatedAtIso: string;
}

export interface PartnerApplicantFeedbackItem {
  id: string;
  consentId: string;
  talentAlias: string;
  fromOrgName: string;
  stage: DocumentFeedbackStage;
  tone: PartnerFeedbackTone;
  message: string;
  createdAtIso: string;
}

export interface PartnerVerificationStepSpec {
  id: PartnerVerificationStepId;
  milestoneKey: 'identity' | 'financial' | 'contracting';
  milestoneLabel: string;
  stepNumber: string;
  title: string;
  shortPrompt: string;
  feedbackStage: DocumentFeedbackStage;
  defaultVerifiedFeedback: string;
  defaultClarificationFeedback: string;
  explainerTitle: string;
  whatToVerify: string[];
  additionalReviewChecks: string[];
  privacyBoundaryRule: string;
}

export const PARTNER_PRE_CONTRACTING_STEPS: PartnerVerificationStepSpec[] = [
  {
    id: 'identityAuth',
    milestoneKey: 'identity',
    milestoneLabel: 'Identity',
    stepNumber: '01',
    title: 'Identity & Work-Auth Pathway',
    shortPrompt:
      'Confirm the candidate’s consented legal work pathway (local, remote, or EOR bridge) without requesting raw ID scans.',
    feedbackStage: 'step_1_identity',
    defaultVerifiedFeedback:
      'Identity milestone verified: your legal work-authorization pathway and active VNA-GRANT consent shield are confirmed for this corridor.',
    defaultClarificationFeedback:
      'Identity milestone clarification: please confirm in 2. Unlock whether you prefer the Scoped Remote Contractor or EOR / Fiscal Host pathway.',
    explainerTitle: 'What to review before verifying Identity',
    whatToVerify: [
      'Confirm the active VNA-GRANT token and compliance shield status match your target work mode (remote contractor, direct local hire, or EOR bridge).',
      'Check whether host-country jurisdiction rules require an Employer of Record (EOR) or fiscal host rather than direct payroll.',
    ],
    additionalReviewChecks: [
      'Confirm no raw asylum papers, UNHCR slips, or national ID serial numbers are requested over email or chat.',
      'If a different contracting bridge is required, send Identity milestone feedback so the applicant knows the exact next step.',
    ],
    privacyBoundaryRule:
      'Licensed payout rails or EOR providers perform regulated KYC directly and return only a readiness flag—never request raw ID files.',
  },
  {
    id: 'payoutRail',
    milestoneKey: 'financial',
    milestoneLabel: 'Financial',
    stepNumber: '02',
    title: 'Financial & Compliant Payout Rail',
    shortPrompt:
      'Confirm that the FATF tiered-KYC disbursement corridor and milestone escrow schedule are aligned prior to Stage 3.',
    feedbackStage: 'step_3_payout',
    defaultVerifiedFeedback:
      'Financial milestone verified: your tiered-KYC payout corridor and milestone escrow disbursement schedule are confirmed.',
    defaultClarificationFeedback:
      'Financial milestone clarification: please confirm your preferred payout rail in the 3-Step Financial Readiness Checklist in 2. Unlock.',
    explainerTitle: 'What to review before verifying Financial readiness',
    whatToVerify: [
      'Confirm your finance or EOR team can fund escrow and settle to the candidate’s compliant payout rail (mobile money, global wallet, fiscal host, or local bank).',
      'Verify milestone sign-off criteria and settlement timing (e.g., 48-hour release upon deliverable approval) are crystal clear.',
    ],
    additionalReviewChecks: [
      'Confirm zero applicant or broker fees apply and any currency conversion terms are transparent.',
      'Send Financial milestone feedback if an invoice reference format or settlement corridor confirmation is needed before signing.',
    ],
    privacyBoundaryRule:
      'Disbursement account numbers and mobile money PINs remain inside licensed payment rails; partners confirm only corridor compatibility.',
  },
  {
    id: 'competencyProof',
    milestoneKey: 'contracting',
    milestoneLabel: 'Contracting',
    stepNumber: '03',
    title: 'Contracting Terms & Competency Fit',
    shortPrompt:
      'Review the consented Living Competency dossier, work-setup conditions, and milestone scope before entering Stage 3.',
    feedbackStage: 'step_2_competency',
    defaultVerifiedFeedback:
      'Contracting milestone verified: your Competency Passport, proof highlights, and sprint contracting scope are aligned for Stage 3.',
    defaultClarificationFeedback:
      'Contracting milestone clarification: please add a brief note on your preferred deliverable handover schedule before we finalize Stage 3.',
    explainerTitle: 'What to review before verifying Contracting readiness',
    whatToVerify: [
      'Compare the Living Competency Passport summary and craft highlights against the exact deliverables in your posted Solution Sprint.',
      'Confirm any consented practical work-setup preferences (e.g., written briefs or flexible milestone hours) and ILO fair-pay alignment.',
    ],
    additionalReviewChecks: [
      'Check if a brief scoping clarification would help the applicant succeed smoothly in Week 1.',
      'Send Contracting milestone feedback before moving to Stage 3 so the applicant knows the agreement is ready to prepare.',
    ],
    privacyBoundaryRule:
      'Only consented professional capabilities and practical work conditions are shared—zero personal history, medical data, or Stage 5 relocation plans.',
  },
];

export interface PrivacyBoundaryComparisonItem {
  id: string;
  domain: 'Identity' | 'Financial' | 'Contracting' | 'Private Journey';
  partnerVerifies: string;
  protectedInVault: string;
}

export const UNDERSTANDING_VERIFICATION_BOUNDARIES: PrivacyBoundaryComparisonItem[] = [
  {
    id: 'boundary-identity',
    domain: 'Identity',
    partnerVerifies:
      'Active revocable consent token (VNA-GRANT), legal work-auth corridor flag (Local, Remote, or EOR), and FATF tier readiness status.',
    protectedInVault:
      'Raw refugee ID cards, UNHCR registration slips, asylum case numbers, passport photos, and government serial numbers.',
  },
  {
    id: 'boundary-financial',
    domain: 'Financial',
    partnerVerifies:
      'Supported payout corridor compatibility (mobile money, global wallet, fiscal host, or local bank) and milestone escrow settlement schedule.',
    protectedInVault:
      'Personal bank account numbers, mobile money PINs, wallet credentials, personal tax identifiers, and private transaction history.',
  },
  {
    id: 'boundary-contracting',
    domain: 'Contracting',
    partnerVerifies:
      'Signed Living Competency Passport summary, uploaded craft highlights, optional work-setup preferences, and milestone agreement scope.',
    protectedInVault:
      'Un-consented skills, revoked consent grants, private mentor coaching chats, and personal or medical background details.',
  },
  {
    id: 'boundary-journey',
    domain: 'Private Journey',
    partnerVerifies:
      'Only sprint deliverables and milestone completion confirmations explicitly shared under an active consent grant.',
    protectedInVault:
      'Stage 5 relocation and complementary mobility plans, family records, and full cross-session workspace vaults.',
  },
];

export interface VerificationRoleDuty {
  role: string;
  verifies: string;
  neverSees: string;
}

export const UNDERSTANDING_VERIFICATION_ROLES: VerificationRoleDuty[] = [
  {
    role: 'Hiring Partner',
    verifies:
      'Reviews consented dossier, verifies Identity, Financial, and Contracting milestones individually, and sends stage feedback.',
    neverSees: 'Raw identity papers, bank/wallet credentials, or Stage 5 mobility plans.',
  },
  {
    role: 'Licensed Payout Rail / EOR',
    verifies:
      'Performs regulated KYC and settlement checks directly and returns only a compliance readiness status.',
    neverSees: 'Private sprint notes or un-consented portfolio records.',
  },
  {
    role: 'Pod Mentor',
    verifies:
      'Provides technical guidance, sprint scoping feedback, and competency endorsements.',
    neverSees: 'Raw IDs, payout accounts, or financial/legal clearance decisions.',
  },
  {
    role: 'Skilled Practitioner',
    verifies:
      'Controls vault ownership, initiates Consent Grants, and can revoke partner visibility in 1 click at any time.',
    neverSees: 'Unverified partner terms without transparent milestone and escrow disclosures.',
  },
];

export interface Stage3AdditionalReviewExplainer {
  id: string;
  title: string;
  summary: string;
  actionHint: string;
}

export const PRE_CONTRACTING_STAGE3_REVIEW_ITEMS: Stage3AdditionalReviewExplainer[] = [
  {
    id: 'verify-all-three-individually',
    title: '1. Confirm Individual 3-Step Verification Before Signing',
    summary:
      'Verify Step 1 (Identity & Work-Auth), Step 2 (Living Competency & Proof), and Step 3 (Payout Rail & Escrow) individually in Tab 2 so no document gap delays onboarding.',
    actionHint: 'Any pending or clarification-flagged step is highlighted in the gate table above.',
  },
  {
    id: 'match-bridge-to-jurisdiction',
    title: '2. Align Contracting Bridge with Jurisdiction & Risk Policy',
    summary:
      'Select Direct Local Hire for enabling host-country permits, Scoped Remote Contractor for cross-border deliverables, or EOR / Fiscal Host Bridge for zero local entity risk.',
    actionHint: 'Review the selected bridge card below before downloading or issuing the agreement.',
  },
  {
    id: 'zero-raw-id-audit-discipline',
    title: '3. Uphold Zero-Raw-ID & Revocable Consent Discipline',
    summary:
      'Confirm your legal/HR pack references only the active VNA-GRANT consent token and readiness statuses—never storing raw refugee IDs or asylum documentation.',
    actionHint: 'Builders retain instant revocation rights; active grants are re-verified on contract issuance.',
  },
  {
    id: 'send-timely-applicant-feedback',
    title: '4. Send Clear Stage Feedback to Prospective Skilled Applicants',
    summary:
      'Before finalizing Stage 3, send a brief status update or clarification request from Tab 2 so applicants know where their documents stand and what comes next.',
    actionHint: 'Feedback appears directly in the applicant’s 2. Unlock stage in real time.',
  },
];

export interface FeedbackStageMeta {
  id: DocumentFeedbackStage;
  shortLabel: string;
  fullLabel: string;
  unlockSectionHint: string;
}

export const DOCUMENT_FEEDBACK_STAGE_OPTIONS: FeedbackStageMeta[] = [
  {
    id: 'step_1_identity',
    shortLabel: 'Identity (Step 1) · Work-Auth Pathway',
    fullLabel: 'Identity (Step 1): Work-Auth Pathway Processing',
    unlockSectionHint: 'Work-Ready Vault · Step 01 & Compliance Crossing',
  },
  {
    id: 'step_2_competency',
    shortLabel: 'Contracting (Step 2) · Competency & Scope',
    fullLabel: 'Contracting (Step 2): Living Competency & Scope Review',
    unlockSectionHint: 'Stage 1 Verify Passport & Proof Highlights',
  },
  {
    id: 'step_3_payout',
    shortLabel: 'Financial (Step 3) · Payout & Escrow Rail',
    fullLabel: 'Financial (Step 3): Compliant Payout Rail & Escrow Readiness',
    unlockSectionHint: '3-Step Financial Readiness Checklist',
  },
  {
    id: 'pre_contracting',
    shortLabel: 'Pre-Contracting · Stage 3 Gate',
    fullLabel: 'Pre-Contracting Review & Hiring Onboarding Update',
    unlockSectionHint: 'Stage 3 Contracting & Onboarding Pack',
  },
];

export interface PartnerFeedbackTemplate {
  id: string;
  stage: DocumentFeedbackStage;
  tone: PartnerFeedbackTone;
  label: string;
  text: string;
}

export const PARTNER_FEEDBACK_TEMPLATES: PartnerFeedbackTemplate[] = [
  {
    id: 'tpl-s1-ok',
    stage: 'step_1_identity',
    tone: 'approved',
    label: 'Step 1 Verified (Work-Auth Clear)',
    text: 'Your legal work-authorization pathway and active consent shield have been verified for our contracting corridor. No raw ID uploads are needed—proceeding to review your competency dossier next.',
  },
  {
    id: 'tpl-s1-clarify',
    stage: 'step_1_identity',
    tone: 'clarification_needed',
    label: 'Confirm EOR vs. Remote Pathway',
    text: 'Before we finalize Step 1, please confirm in 2. Unlock whether you prefer the Scoped Remote Contractor or EOR / Fiscal Host pathway for this host jurisdiction.',
  },
  {
    id: 'tpl-s2-ok',
    stage: 'step_2_competency',
    tone: 'approved',
    label: 'Step 2 Verified (Strong Proof Fit)',
    text: 'We reviewed your Living Competency Passport and craft highlights—your practical experience aligns closely with our sprint deliverables. Moving to Step 3 payout readiness check.',
  },
  {
    id: 'tpl-s2-clarify',
    stage: 'step_2_competency',
    tone: 'clarification_needed',
    label: 'Request Brief Portfolio Context',
    text: 'Your competency dossier looks promising. Could you add one short note or peer endorsement in Stage 1/2 confirming your preferred deliverable handover format before we lock the sprint scope?',
  },
  {
    id: 'tpl-s3-ok',
    stage: 'step_3_payout',
    tone: 'approved',
    label: 'Step 3 Verified (Payout Ready)',
    text: 'Your selected compliant payout rail and milestone escrow corridor are confirmed. All 3 pre-contracting checks are clear for Stage 3 agreement issuance.',
  },
  {
    id: 'tpl-s3-clarify',
    stage: 'step_3_payout',
    tone: 'clarification_needed',
    label: 'Confirm Preferred Payout Rail',
    text: 'Please double-check Step 2 of your 3-Step Financial Readiness Checklist in 2. Unlock so we align our escrow disbursement rail (mobile money, global wallet, or fiscal host) before contracting.',
  },
  {
    id: 'tpl-pre-encourage',
    stage: 'pre_contracting',
    tone: 'encouragement',
    label: 'Moving to Stage 3 Contracting',
    text: 'Thank you for assembling a complete and well-ordered document package. We are completing our final Stage 3 pre-contracting review and will issue your compliant sprint agreement shortly.',
  },
];

export const VALID_VERIFICATION_STEP_IDS: readonly PartnerVerificationStepId[] = [
  'identityAuth',
  'competencyProof',
  'payoutRail',
];

export const VALID_STEP_REVIEW_STATUSES: readonly PartnerStepReviewStatus[] = [
  'pending',
  'verified',
  'needs_clarification',
];

export const VALID_FEEDBACK_STAGES: readonly DocumentFeedbackStage[] = [
  'step_1_identity',
  'step_2_competency',
  'step_3_payout',
  'pre_contracting',
];

export const VALID_FEEDBACK_TONES: readonly PartnerFeedbackTone[] = [
  'approved',
  'clarification_needed',
  'encouragement',
];

export function isValidVerificationStepId(
  value: unknown
): value is PartnerVerificationStepId {
  return (
    typeof value === 'string' &&
    (VALID_VERIFICATION_STEP_IDS as readonly string[]).includes(value)
  );
}

export function isValidStepReviewStatus(
  value: unknown
): value is PartnerStepReviewStatus {
  return (
    typeof value === 'string' &&
    (VALID_STEP_REVIEW_STATUSES as readonly string[]).includes(value)
  );
}

export function isValidDocumentFeedbackStage(
  value: unknown
): value is DocumentFeedbackStage {
  return (
    typeof value === 'string' &&
    (VALID_FEEDBACK_STAGES as readonly string[]).includes(value)
  );
}

export function isValidFeedbackTone(value: unknown): value is PartnerFeedbackTone {
  return (
    typeof value === 'string' &&
    (VALID_FEEDBACK_TONES as readonly string[]).includes(value)
  );
}

export function createDefaultPreContractingRecord(
  consentId: string,
  nowIso: string = new Date().toISOString()
): PartnerPreContractingRecord {
  return {
    consentId,
    steps: {
      identityAuth: { status: 'pending', updatedAtIso: null },
      competencyProof: { status: 'pending', updatedAtIso: null },
      payoutRail: { status: 'pending', updatedAtIso: null },
    },
    updatedAtIso: nowIso,
  };
}

export interface PartnerPreContractingProgress {
  verifiedCount: number;
  clarificationCount: number;
  pendingCount: number;
  totalCount: number;
  percentage: number;
  isReadyForStage3: boolean;
  missingStepNumbers: string[];
}

export function computePartnerPreContractingProgress(
  record?: PartnerPreContractingRecord | null
): PartnerPreContractingProgress {
  const safe = record ?? createDefaultPreContractingRecord('default');
  let verifiedCount = 0;
  let clarificationCount = 0;
  let pendingCount = 0;
  const missingStepNumbers: string[] = [];

  for (const spec of PARTNER_PRE_CONTRACTING_STEPS) {
    const status = safe.steps[spec.id]?.status ?? 'pending';
    if (status === 'verified') {
      verifiedCount += 1;
    } else if (status === 'needs_clarification') {
      clarificationCount += 1;
      missingStepNumbers.push(spec.stepNumber);
    } else {
      pendingCount += 1;
      missingStepNumbers.push(spec.stepNumber);
    }
  }

  const totalCount = PARTNER_PRE_CONTRACTING_STEPS.length;
  const percentage = Math.round((verifiedCount / totalCount) * 100);

  return {
    verifiedCount,
    clarificationCount,
    pendingCount,
    totalCount,
    percentage,
    isReadyForStage3: verifiedCount === totalCount,
    missingStepNumbers,
  };
}

export function getFeedbackStageMeta(
  stage: DocumentFeedbackStage
): FeedbackStageMeta {
  return (
    DOCUMENT_FEEDBACK_STAGE_OPTIONS.find((item) => item.id === stage) ??
    DOCUMENT_FEEDBACK_STAGE_OPTIONS[0]
  );
}

export function sanitizeFeedbackMessage(raw: unknown, maxLength = 800): string {
  return String(raw ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export interface AccessAuditLogCsvItem {
  id: string;
  timestampIso: string;
  action: string;
  talentAlias: string;
  consentId: string;
  details: string;
  actorRole: string;
}

export function buildAccessAuditLogCsv(entries: AccessAuditLogCsvItem[]): string {
  const headers = [
    'Log Entry ID',
    'Timestamp (ISO)',
    'Date & Time',
    'Action Type',
    'Action Label',
    'Applicant Alias',
    'Consent Token ID',
    'Compliance Details',
    'Actor Role',
    'Zero Raw ID Guarantee',
  ];

  const escape = (val: string | number) => {
    const raw = String(val ?? '');
    const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
    return `"${safe.replace(/"/g, '""')}"`;
  };

  const rows = entries.map((entry) => [
    escape(entry.id),
    escape(entry.timestampIso),
    escape(new Date(entry.timestampIso).toLocaleString()),
    escape(entry.action),
    escape(
      entry.action === 'CONSENT_GRANTED'
        ? 'Access Granted'
        : entry.action === 'CONSENT_REVOKED'
        ? 'Access Revoked'
        : entry.action
    ),
    escape(entry.talentAlias),
    escape(entry.consentId),
    escape(entry.details),
    escape(entry.actorRole),
    escape('Strict Zero Raw ID Enforced (Agency-First Consent)'),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

export type PartnerInternalNoteCategory =
  | 'coordination'
  | 'compliance_check'
  | 'handoff'
  | 'blocker';

export interface PartnerInternalNote {
  id: string;
  consentId: string;
  talentAlias: string;
  authorOrgId: string;
  authorOrgName: string;
  authorLabel: string;
  category: PartnerInternalNoteCategory;
  body: string;
  visibility: 'partner_internal_only';
  createdAtIso: string;
}

export const PARTNER_INTERNAL_NOTE_CATEGORIES: Array<{
  id: PartnerInternalNoteCategory;
  label: string;
}> = [
  { id: 'coordination', label: 'Team Coordination' },
  { id: 'compliance_check', label: 'Compliance Check' },
  { id: 'handoff', label: 'Handoff Note' },
  { id: 'blocker', label: 'Internal Blocker' },
];

export function isValidInternalNoteCategory(
  value: unknown
): value is PartnerInternalNoteCategory {
  return (
    typeof value === 'string' &&
    ['coordination', 'compliance_check', 'handoff', 'blocker'].includes(value)
  );
}

export function sanitizeInternalNoteBody(raw: unknown, maxLength = 1000): string {
  return sanitizeFeedbackMessage(raw, maxLength);
}

export interface MissingDocumentTriggerItem {
  id: string;
  consentId: string;
  talentAlias: string;
  stepId: PartnerVerificationStepId;
  milestoneKey: 'identity' | 'financial' | 'contracting';
  milestoneLabel: string;
  stepTitle: string;
  feedbackStage: DocumentFeedbackStage;
  status: 'pending' | 'needs_clarification';
  referenceTimestampIso: string;
  daysElapsed: number;
  thresholdDays: number;
  daysOverdue: number;
  reminderSuggestedMessage: string;
  alreadyReminded: boolean;
  lastRemindedAtIso?: string;
}

export interface DetectMissingDocumentTriggersInput {
  grants: Array<{
    consentId: string;
    talentAlias: string;
    status: string;
    grantedAtIso: string;
  }>;
  verificationsByGrantId: Record<string, PartnerPreContractingRecord | undefined>;
  thresholdDays: number;
  monitoredStepIds?: PartnerVerificationStepId[];
  applicantFeedback?: PartnerApplicantFeedbackItem[];
  orgName?: string;
  nowIso?: string;
}

export function detectMissingDocumentTriggers(
  input: DetectMissingDocumentTriggersInput
): MissingDocumentTriggerItem[] {
  const {
    grants,
    verificationsByGrantId,
    thresholdDays,
    monitoredStepIds = VALID_VERIFICATION_STEP_IDS as PartnerVerificationStepId[],
    applicantFeedback = [],
    orgName = 'Hiring Partner',
    nowIso = new Date().toISOString(),
  } = input;

  const safeThreshold = Math.max(0, Math.min(90, Math.floor(Number(thresholdDays) || 0)));
  const nowMs = new Date(nowIso).getTime();
  if (!Number.isFinite(nowMs)) return [];

  const triggers: MissingDocumentTriggerItem[] = [];

  for (const grant of grants) {
    if (grant.status !== 'active') continue;
    const record = verificationsByGrantId[grant.consentId];

    for (const step of PARTNER_PRE_CONTRACTING_STEPS) {
      if (!monitoredStepIds.includes(step.id)) continue;

      const stepState = record?.steps?.[step.id];
      const status = stepState?.status ?? 'pending';
      if (status === 'verified') continue;

      const refIso =
        status === 'needs_clarification' && stepState?.updatedAtIso
          ? stepState.updatedAtIso
          : grant.grantedAtIso;
      const refMs = new Date(refIso).getTime();
      if (!Number.isFinite(refMs)) continue;

      const elapsedRaw = Math.max(0, (nowMs - refMs) / 86_400_000);
      const daysElapsed = Math.floor(elapsedRaw);
      if (daysElapsed < safeThreshold) continue;

      const daysOverdue = Math.max(0, daysElapsed - safeThreshold);

      const matchingFeedback = applicantFeedback.filter(
        (fb) =>
          fb.consentId === grant.consentId &&
          fb.stage === step.feedbackStage &&
          new Date(fb.createdAtIso).getTime() >= refMs
      );
      const latestReminder = matchingFeedback.sort(
        (a, b) =>
          new Date(b.createdAtIso).getTime() - new Date(a.createdAtIso).getTime()
      )[0];

      const elapsedLabel =
        daysElapsed === 0
          ? 'pending review'
          : `${daysElapsed} day${daysElapsed === 1 ? '' : 's'} elapsed`;

      triggers.push({
        id: `missing:${grant.consentId}:${step.id}`,
        consentId: grant.consentId,
        talentAlias: grant.talentAlias,
        stepId: step.id,
        milestoneKey: step.milestoneKey,
        milestoneLabel: step.milestoneLabel,
        stepTitle: step.title,
        feedbackStage: step.feedbackStage,
        status: status === 'needs_clarification' ? 'needs_clarification' : 'pending',
        referenceTimestampIso: refIso,
        daysElapsed,
        thresholdDays: safeThreshold,
        daysOverdue,
        reminderSuggestedMessage: `Friendly reminder from ${orgName}: your ${step.milestoneLabel} verification step (${step.title}) has been open for submission/confirmation (${elapsedLabel}). Please complete or confirm details in 2. Unlock so we can proceed to Stage 3 contracting.`,
        alreadyReminded: Boolean(latestReminder),
        lastRemindedAtIso: latestReminder?.createdAtIso,
      });
    }
  }

  return triggers.sort((a, b) => {
    if (b.daysElapsed !== a.daysElapsed) return b.daysElapsed - a.daysElapsed;
    return a.consentId.localeCompare(b.consentId);
  });
}

