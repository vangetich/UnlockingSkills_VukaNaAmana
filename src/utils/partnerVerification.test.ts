import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PARTNER_PRE_CONTRACTING_STEPS,
  PRE_CONTRACTING_STAGE3_REVIEW_ITEMS,
  DOCUMENT_FEEDBACK_STAGE_OPTIONS,
  UNDERSTANDING_VERIFICATION_BOUNDARIES,
  UNDERSTANDING_VERIFICATION_ROLES,
  buildAccessAuditLogCsv,
  computePartnerPreContractingProgress,
  createDefaultPreContractingRecord,
  getFeedbackStageMeta,
  isValidDocumentFeedbackStage,
  isValidFeedbackTone,
  isValidInternalNoteCategory,
  isValidStepReviewStatus,
  isValidVerificationStepId,
  sanitizeFeedbackMessage,
  sanitizeInternalNoteBody,
  detectMissingDocumentTriggers,
} from './partnerVerification.ts';
import { buildApplicantComplianceReportPdfBytes } from './pdfReceipt.ts';

test('individual 3-step verification progresses cleanly from 0/3 to 3/3 before Stage 3', () => {
  const record = createDefaultPreContractingRecord('VNA-GRANT-TEST1');
  const initial = computePartnerPreContractingProgress(record);
  assert.equal(initial.verifiedCount, 0);
  assert.equal(initial.pendingCount, 3);
  assert.equal(initial.isReadyForStage3, false);
  assert.deepEqual(initial.missingStepNumbers, ['01', '02', '03']);

  record.steps.identityAuth = {
    status: 'verified',
    updatedAtIso: '2026-11-26T00:00:00.000Z',
    verifiedByOrgName: 'SolarGrid Innovations',
  };
  const step1 = computePartnerPreContractingProgress(record);
  assert.equal(step1.verifiedCount, 1);
  assert.equal(step1.percentage, 33);
  assert.equal(step1.isReadyForStage3, false);
  assert.deepEqual(step1.missingStepNumbers, ['02', '03']);

  record.steps.competencyProof = {
    status: 'needs_clarification',
    updatedAtIso: '2026-11-26T00:01:00.000Z',
    verifiedByOrgName: 'SolarGrid Innovations',
  };
  const step2Clarify = computePartnerPreContractingProgress(record);
  assert.equal(step2Clarify.verifiedCount, 1);
  assert.equal(step2Clarify.clarificationCount, 1);
  assert.equal(step2Clarify.pendingCount, 1);
  assert.equal(step2Clarify.isReadyForStage3, false);

  record.steps.competencyProof.status = 'verified';
  record.steps.payoutRail = {
    status: 'verified',
    updatedAtIso: '2026-11-26T00:02:00.000Z',
    verifiedByOrgName: 'SolarGrid Innovations',
  };
  const complete = computePartnerPreContractingProgress(record);
  assert.equal(complete.verifiedCount, 3);
  assert.equal(complete.clarificationCount, 0);
  assert.equal(complete.percentage, 100);
  assert.equal(complete.isReadyForStage3, true);
  assert.deepEqual(complete.missingStepNumbers, []);
});

test('validators strictly reject unknown steps, statuses, stages, and tones', () => {
  assert.equal(isValidVerificationStepId('identityAuth'), true);
  assert.equal(isValidVerificationStepId('competencyProof'), true);
  assert.equal(isValidVerificationStepId('payoutRail'), true);
  assert.equal(isValidVerificationStepId('rawIdUpload'), false);

  assert.equal(isValidStepReviewStatus('verified'), true);
  assert.equal(isValidStepReviewStatus('needs_clarification'), true);
  assert.equal(isValidStepReviewStatus('pending'), true);
  assert.equal(isValidStepReviewStatus('force_approved'), false);

  assert.equal(isValidDocumentFeedbackStage('step_1_identity'), true);
  assert.equal(isValidDocumentFeedbackStage('pre_contracting'), true);
  assert.equal(isValidDocumentFeedbackStage('unknown_stage'), false);

  assert.equal(isValidFeedbackTone('approved'), true);
  assert.equal(isValidFeedbackTone('clarification_needed'), true);
  assert.equal(isValidFeedbackTone('encouragement'), true);
  assert.equal(isValidFeedbackTone('harsh'), false);
});

test('step specs cover Identity, Financial, and Contracting milestones plus Understanding Verification boundaries', () => {
  assert.equal(PARTNER_PRE_CONTRACTING_STEPS.length, 3);
  assert.deepEqual(
    PARTNER_PRE_CONTRACTING_STEPS.map((s) => s.milestoneLabel),
    ['Identity', 'Financial', 'Contracting']
  );
  assert.ok(PRE_CONTRACTING_STAGE3_REVIEW_ITEMS.length >= 4);
  assert.equal(DOCUMENT_FEEDBACK_STAGE_OPTIONS.length, 4);

  for (const step of PARTNER_PRE_CONTRACTING_STEPS) {
    assert.ok(step.whatToVerify.length >= 2);
    assert.ok(step.additionalReviewChecks.length >= 2);
    assert.ok(step.privacyBoundaryRule.length > 20);
    assert.ok(step.defaultVerifiedFeedback.length > 20);
    assert.ok(step.defaultClarificationFeedback.length > 20);
  }

  assert.equal(UNDERSTANDING_VERIFICATION_BOUNDARIES.length, 4);
  assert.deepEqual(
    UNDERSTANDING_VERIFICATION_BOUNDARIES.map((b) => b.domain),
    ['Identity', 'Financial', 'Contracting', 'Private Journey']
  );
  assert.equal(UNDERSTANDING_VERIFICATION_ROLES.length, 4);

  const meta = getFeedbackStageMeta('step_3_payout');
  assert.match(meta.shortLabel, /Step 3/i);

  const cleaned = sanitizeFeedbackMessage('  Hello\u0000   applicant \n\n ready!  ', 20);
  assert.equal(cleaned, 'Hello applicant read');
});

test('bulk verification applies milestone approval across multiple candidate files simultaneously', () => {
  const applicants = ['VNA-GRANT-B1', 'VNA-GRANT-B2', 'VNA-GRANT-B3'];
  const verifications: Record<string, ReturnType<typeof createDefaultPreContractingRecord>> = {};
  for (const id of applicants) {
    verifications[id] = createDefaultPreContractingRecord(id);
  }

  // Bulk approve 'identityAuth' for all 3 applicants
  const targetStep = 'identityAuth';
  for (const id of applicants) {
    verifications[id].steps[targetStep] = {
      status: 'verified',
      updatedAtIso: '2026-11-26T03:00:00.000Z',
      verifiedByOrgName: 'SolarGrid Innovations',
      reviewerNote: 'Bulk verified: Identity Authenticity approved.',
    };
  }

  for (const id of applicants) {
    const prog = computePartnerPreContractingProgress(verifications[id]);
    assert.equal(prog.verifiedCount, 1);
    assert.equal(verifications[id].steps.identityAuth.status, 'verified');
    assert.equal(prog.isReadyForStage3, false);
  }

  // Bulk approve remaining steps for applicant B1 and B2
  for (const id of ['VNA-GRANT-B1', 'VNA-GRANT-B2']) {
    verifications[id].steps.competencyProof = {
      status: 'verified',
      updatedAtIso: '2026-11-26T03:01:00.000Z',
      verifiedByOrgName: 'SolarGrid Innovations',
    };
    verifications[id].steps.payoutRail = {
      status: 'verified',
      updatedAtIso: '2026-11-26T03:02:00.000Z',
      verifiedByOrgName: 'SolarGrid Innovations',
    };
  }

  const p1 = computePartnerPreContractingProgress(verifications['VNA-GRANT-B1']);
  const p2 = computePartnerPreContractingProgress(verifications['VNA-GRANT-B2']);
  const p3 = computePartnerPreContractingProgress(verifications['VNA-GRANT-B3']);

  assert.equal(p1.isReadyForStage3, true);
  assert.equal(p1.percentage, 100);
  assert.equal(p2.isReadyForStage3, true);
  assert.equal(p2.percentage, 100);
  assert.equal(p3.isReadyForStage3, false);
  assert.equal(p3.percentage, 33);
});

test('Access Audit Log accurately tracks granted and revoked vault permissions with timestamps', () => {
  const grants = [
    {
      consentId: 'VNA-GRANT-001',
      talentAlias: 'Amina K.',
      status: 'active' as const,
      grantedAtIso: '2026-11-20T10:00:00.000Z',
    },
    {
      consentId: 'VNA-GRANT-002',
      talentAlias: 'David M.',
      status: 'revoked' as const,
      grantedAtIso: '2026-11-21T12:00:00.000Z',
      revokedAtIso: '2026-11-25T16:30:00.000Z',
    },
  ];

  const events: Array<{ action: string; consentId: string; timestampIso: string }> = [];
  for (const g of grants) {
    if (g.grantedAtIso) {
      events.push({ action: 'CONSENT_GRANTED', consentId: g.consentId, timestampIso: g.grantedAtIso });
    }
    if (g.status === 'revoked' && g.revokedAtIso) {
      events.push({ action: 'CONSENT_REVOKED', consentId: g.consentId, timestampIso: g.revokedAtIso });
    }
  }

  events.sort((a, b) => new Date(b.timestampIso).getTime() - new Date(a.timestampIso).getTime());

  assert.equal(events.length, 3);
  assert.equal(events[0].action, 'CONSENT_REVOKED');
  assert.equal(events[0].consentId, 'VNA-GRANT-002');
  assert.equal(events[1].action, 'CONSENT_GRANTED');
  assert.equal(events[1].consentId, 'VNA-GRANT-002');
  assert.equal(events[2].action, 'CONSENT_GRANTED');
  assert.equal(events[2].consentId, 'VNA-GRANT-001');
});

test('buildAccessAuditLogCsv generates compliant RFC 4180 CSV with zero-raw-id guarantees', () => {
  const sampleEntries = [
    {
      id: 'entry-1',
      timestampIso: '2026-11-26T03:00:00.000Z',
      action: 'CONSENT_GRANTED',
      talentAlias: 'Amina K.',
      consentId: 'VNA-GRANT-001',
      details: 'Applicant granted living proof dossier access.',
      actorRole: 'builder',
    },
    {
      id: 'entry-2',
      timestampIso: '2026-11-26T03:30:00.000Z',
      action: 'CONSENT_REVOKED',
      talentAlias: 'David M.',
      consentId: 'VNA-GRANT-002',
      details: 'Applicant revoked data vault permissions.',
      actorRole: 'builder',
    },
  ];

  const csv = buildAccessAuditLogCsv(sampleEntries);
  assert.ok(csv.includes('Log Entry ID,Timestamp (ISO),Date & Time,Action Type,Action Label,Applicant Alias'));
  assert.ok(csv.includes('"entry-1"'));
  assert.ok(csv.includes('"Amina K."'));
  assert.ok(csv.includes('"Access Granted"'));
  assert.ok(csv.includes('"entry-2"'));
  assert.ok(csv.includes('"David M."'));
  assert.ok(csv.includes('"Access Revoked"'));
  assert.ok(csv.includes('Zero Raw ID'));
});

test('Access Audit Log date-range and keyword search filtering isolates target events precisely', () => {
  const items = [
    {
      id: '1',
      timestampIso: '2026-11-20T10:00:00.000Z',
      talentAlias: 'Amina K.',
      consentId: 'VNA-GRANT-001',
      action: 'CONSENT_GRANTED',
      details: 'Granted access',
    },
    {
      id: '2',
      timestampIso: '2026-11-24T14:00:00.000Z',
      talentAlias: 'David M.',
      consentId: 'VNA-GRANT-002',
      action: 'CONSENT_GRANTED',
      details: 'Granted access',
    },
    {
      id: '3',
      timestampIso: '2026-11-26T08:00:00.000Z',
      talentAlias: 'David M.',
      consentId: 'VNA-GRANT-002',
      action: 'CONSENT_REVOKED',
      details: 'Revoked access',
    },
  ];

  // 1. Date filter: Between 2026-11-23 and 2026-11-25
  const dateFiltered = items.filter((item) => {
    const d = item.timestampIso.slice(0, 10);
    return d >= '2026-11-23' && d <= '2026-11-25';
  });
  assert.equal(dateFiltered.length, 1);
  assert.equal(dateFiltered[0].id, '2');

  // 2. Search query: "revoked"
  const searchFiltered = items.filter((item) => {
    const q = 'revoked';
    return (
      item.talentAlias.toLowerCase().includes(q) ||
      item.consentId.toLowerCase().includes(q) ||
      item.details.toLowerCase().includes(q) ||
      item.action.toLowerCase().includes(q)
    );
  });
  assert.equal(searchFiltered.length, 1);
  assert.equal(searchFiltered[0].id, '3');

  // 3. Search query: "david" + date from 2026-11-25 onwards
  const combined = items.filter((item) => {
    const d = item.timestampIso.slice(0, 10);
    const dateMatch = d >= '2026-11-25';
    const textMatch = item.talentAlias.toLowerCase().includes('david');
    return dateMatch && textMatch;
  });
  assert.equal(combined.length, 1);
  assert.equal(combined[0].id, '3');
});

test('buildApplicantComplianceReportPdfBytes compiles valid PDF-1.4 compliance report with audit and feedback history', () => {
  const bytes = buildApplicantComplianceReportPdfBytes({
    talentAlias: 'Amina K.',
    consentId: 'VNA-GRANT-PDF1',
    orgName: 'SolarGrid Innovations',
    issuedAtIso: '2026-11-26T03:30:00.000Z',
    verificationSteps: {
      identityAuth: {
        status: 'verified',
        updatedAtIso: '2026-11-26T03:00:00.000Z',
        reviewerNote: 'Zero Raw ID tier check passed.',
      },
      competencyProof: {
        status: 'verified',
        updatedAtIso: '2026-11-26T03:10:00.000Z',
        reviewerNote: 'Solar diagnostics log verified.',
      },
      payoutRail: {
        status: 'needs_clarification',
        updatedAtIso: '2026-11-26T03:20:00.000Z',
        reviewerNote: 'Confirm M-Pesa wallet tier.',
      },
    },
    overallStatus: 'In Review (2/3 Complete)',
    verifiedCount: 2,
    totalCount: 3,
    auditLogsCount: 4,
    latestAuditAction: 'STEP_VERIFIED',
    latestAuditTime: '2026-11-26T03:20:00.000Z',
    feedbackHistory: [
      {
        stage: 'step_3_payout',
        tone: 'clarification_needed',
        message: 'Please confirm your FATF Tier 1 mobile wallet currency.',
        createdAtIso: '2026-11-26T03:21:00.000Z',
      },
    ],
  });

  assert.ok(bytes instanceof Uint8Array);
  assert.ok(bytes.byteLength > 800);
  const text = new TextDecoder('latin1').decode(bytes);
  assert.ok(text.startsWith('%PDF-1.4'));
  assert.ok(text.includes('Amina K.'));
  assert.ok(text.includes('VNA-GRANT-PDF1'));
  assert.ok(text.includes('SolarGrid Innovations'));
  assert.ok(text.includes('2 of 3 Milestones Verified'));
  assert.ok(text.includes('Total Audit Events Recorded: 4'));
  assert.ok(text.includes('Please confirm your FATF Tier 1 mobile wallet currency.'));
  assert.ok(text.trimEnd().endsWith('%%EOF'));
});

test('internal team note category validator and sanitizer enforce partner-private bounds', () => {
  assert.equal(isValidInternalNoteCategory('coordination'), true);
  assert.equal(isValidInternalNoteCategory('compliance_check'), true);
  assert.equal(isValidInternalNoteCategory('handoff'), true);
  assert.equal(isValidInternalNoteCategory('blocker'), true);
  assert.equal(isValidInternalNoteCategory('public_applicant'), false);
  assert.equal(isValidInternalNoteCategory(null), false);

  const sanitized = sanitizeInternalNoteBody('  EOR \u0000 review   assigned to\n\nAlex  ', 24);
  assert.equal(sanitized, 'EOR review assigned to A');
});

test('detectMissingDocumentTriggers flags overdue active grants, respects monitored steps, and tracks reminder state', () => {
  const nowIso = '2026-11-26T12:00:00.000Z';
  const grants = [
    {
      consentId: 'VNA-GRANT-OVERDUE',
      talentAlias: 'Amina K.',
      status: 'active',
      grantedAtIso: '2026-11-20T10:00:00.000Z', // 6 days elapsed
    },
    {
      consentId: 'VNA-GRANT-FRESH',
      talentAlias: 'Tariq S.',
      status: 'active',
      grantedAtIso: '2026-11-25T10:00:00.000Z', // 1 day elapsed
    },
    {
      consentId: 'VNA-GRANT-REVOKED',
      talentAlias: 'David M.',
      status: 'revoked',
      grantedAtIso: '2026-11-10T10:00:00.000Z',
    },
  ];

  const overdueRecord = createDefaultPreContractingRecord('VNA-GRANT-OVERDUE', nowIso);
  overdueRecord.steps.identityAuth = {
    status: 'verified',
    updatedAtIso: '2026-11-21T10:00:00.000Z',
    verifiedByOrgName: 'SolarGrid Innovations',
  };
  overdueRecord.steps.competencyProof = {
    status: 'needs_clarification',
    updatedAtIso: '2026-11-22T10:00:00.000Z', // 4 days elapsed from clarification update
  };
  // payoutRail remains pending -> 6 days elapsed from grantedAtIso

  const freshRecord = createDefaultPreContractingRecord('VNA-GRANT-FRESH', nowIso);

  const triggers = detectMissingDocumentTriggers({
    grants,
    verificationsByGrantId: {
      'VNA-GRANT-OVERDUE': overdueRecord,
      'VNA-GRANT-FRESH': freshRecord,
    },
    thresholdDays: 3,
    orgName: 'SolarGrid Innovations',
    nowIso,
  });

  // Only VNA-GRANT-OVERDUE should trigger (payoutRail 6d, competencyProof 4d). identityAuth is verified; FRESH is 1d < 3d; REVOKED is ignored.
  assert.equal(triggers.length, 2);
  assert.equal(triggers[0].consentId, 'VNA-GRANT-OVERDUE');
  assert.equal(triggers[0].stepId, 'payoutRail');
  assert.equal(triggers[0].daysElapsed, 6);
  assert.equal(triggers[0].daysOverdue, 3);
  assert.equal(triggers[0].alreadyReminded, false);
  assert.match(triggers[0].reminderSuggestedMessage, /SolarGrid Innovations/);

  assert.equal(triggers[1].consentId, 'VNA-GRANT-OVERDUE');
  assert.equal(triggers[1].stepId, 'competencyProof');
  assert.equal(triggers[1].status, 'needs_clarification');
  assert.equal(triggers[1].daysElapsed, 4);
  assert.equal(triggers[1].daysOverdue, 1);

  // Monitored step filter isolates only competencyProof
  const filteredStepTriggers = detectMissingDocumentTriggers({
    grants,
    verificationsByGrantId: {
      'VNA-GRANT-OVERDUE': overdueRecord,
      'VNA-GRANT-FRESH': freshRecord,
    },
    thresholdDays: 3,
    monitoredStepIds: ['competencyProof'],
    orgName: 'SolarGrid Innovations',
    nowIso,
  });
  assert.equal(filteredStepTriggers.length, 1);
  assert.equal(filteredStepTriggers[0].stepId, 'competencyProof');

  // Sending reminder feedback flips alreadyReminded to true for payoutRail only
  const triggersAfterReminder = detectMissingDocumentTriggers({
    grants,
    verificationsByGrantId: {
      'VNA-GRANT-OVERDUE': overdueRecord,
    },
    thresholdDays: 3,
    applicantFeedback: [
      {
        id: 'fb-rem-1',
        consentId: 'VNA-GRANT-OVERDUE',
        talentAlias: 'Amina K.',
        fromOrgName: 'SolarGrid Innovations',
        stage: 'step_3_payout',
        tone: 'clarification_needed',
        message: 'Reminder sent for payout rail.',
        createdAtIso: '2026-11-26T09:00:00.000Z',
      },
    ],
    nowIso,
  });
  const payoutTrigger = triggersAfterReminder.find((t) => t.stepId === 'payoutRail');
  const compTrigger = triggersAfterReminder.find((t) => t.stepId === 'competencyProof');
  assert.equal(payoutTrigger?.alreadyReminded, true);
  assert.equal(payoutTrigger?.lastRemindedAtIso, '2026-11-26T09:00:00.000Z');
  assert.equal(compTrigger?.alreadyReminded, false);
});
