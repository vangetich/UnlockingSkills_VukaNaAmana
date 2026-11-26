import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PARTNER_PRE_CONTRACTING_STEPS,
  PRE_CONTRACTING_STAGE3_REVIEW_ITEMS,
  DOCUMENT_FEEDBACK_STAGE_OPTIONS,
  UNDERSTANDING_VERIFICATION_BOUNDARIES,
  UNDERSTANDING_VERIFICATION_ROLES,
  computePartnerPreContractingProgress,
  createDefaultPreContractingRecord,
  getFeedbackStageMeta,
  isValidDocumentFeedbackStage,
  isValidFeedbackTone,
  isValidStepReviewStatus,
  isValidVerificationStepId,
  sanitizeFeedbackMessage,
} from './partnerVerification.ts';

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
