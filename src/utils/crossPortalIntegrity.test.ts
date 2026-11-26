import test from 'node:test';
import assert from 'node:assert/strict';
import {
  convertProblemBriefToSolutionSprint,
  rankSolutionSprints,
  createInitialVault,
  computeVaultReadiness,
  isComplianceClearedForWork,
  SOLUTION_SPRINTS,
} from './talentEngine';
import { TalentAuthRealm, PartnerAuthRealm } from './dualDoorAuth';
import {
  GLOSSARY_ENTRIES,
  MENTORSHIP_VS_GUIDANCE_FAQ,
  HOW_IT_WORKS_STEPS,
  ALL_GLOSSARY_FAQS,
} from '../components/GlossaryModal';
import {
  SPRINT_PHASE_META,
  resolveSprintPhaseForTips,
} from '../components/MentorMessagingDrawer';
import type { PractitionerProfile, ProblemBrief, SkillCapability } from '../types/kora';

test('convertProblemBriefToSolutionSprint and rankSolutionSprints merge live partner sprints cleanly', () => {
  const partnerBrief: ProblemBrief = {
    id: 'brief_partner_live_001',
    title: 'Solar Cold-Chain Telemetry Audit for Camp Clinic',
    organization: 'Nairobi Clean Energy Partners',
    domain: 'Green Energy · 7 days',
    studioDomain: 'Green Energy',
    locationLabel: 'Nairobi / Remote',
    complexity: 'Applied',
    payoutUsd: 420,
    estimatedHours: 16,
    summary: 'Audit off-grid vaccine fridge inverters and publish a 1-page maintenance SOP.',
    deliverableChecklist: ['Inverter diagnostic log', '1-page maintenance SOP'],
    recommendedStages: ['18-29', '30-45', '46+'],
    requiredKeywords: ['solar', 'diagnostics', 'cold-chain'],
    workspaceReadiness: ['remote-flexible', 'written-captioned'],
  };

  const converted = convertProblemBriefToSolutionSprint(partnerBrief);
  assert.equal(converted.id, partnerBrief.id);
  assert.equal(converted.partnerOrg, partnerBrief.organization);
  assert.equal(converted.payoutUsd, 420);
  assert.deepEqual(converted.workspaceReadiness, [
    'remote-flexible',
    'written-captioned',
  ]);

  const profile: PractitionerProfile = {
    uid: 'test-builder',
    displayName: 'Amina',
    email: 'amina@example.org',
    ageStage: '30-45',
    problemStatement: 'Solar cold-chain diagnostics for clinics',
    preferredLocale: 'en',
    themePreference: 'light',
    onboarded: true,
    updatedAtIso: new Date().toISOString(),
  };

  const capabilities: SkillCapability[] = [
    {
      id: 'cap-1',
      ownerUid: 'test-builder',
      title: 'Solar Inverter Diagnostics',
      domain: 'Green Energy',
      proofSummary: 'Maintained 4kW clinic arrays.',
      verificationStatus: 'field-verified',
      confidenceScore: 92,
      createdAtIso: new Date().toISOString(),
      updatedAtIso: new Date().toISOString(),
    },
  ];

  // Include both a new partner sprint and a duplicate of an existing SOLUTION_SPRINTS id
  const duplicateBrief: ProblemBrief = {
    ...partnerBrief,
    id: SOLUTION_SPRINTS[0].id,
    title: 'Duplicate Seed Sprint',
  };

  const ranked = rankSolutionSprints(profile, capabilities, null, [partnerBrief, duplicateBrief]);
  const liveMatches = ranked.filter((item) => item.id === partnerBrief.id);
  const dupMatches = ranked.filter((item) => item.id === SOLUTION_SPRINTS[0].id);

  assert.equal(liveMatches.length, 1, 'Partner-posted sprint should appear once in Tab 3 ranked sprints');
  assert.equal(dupMatches.length, 1, 'Static seed sprint should not be duplicated');
  assert.ok(liveMatches[0].matchScore > 0, 'Live partner sprint should receive a positive match score');
});

test('Dual-Door Auth enforces strict token audience isolation between Talent and Partner realms', () => {
  const talentRealm = new TalentAuthRealm();
  const partnerRealm = new PartnerAuthRealm();

  const talentDemo = talentRealm.mintDemoBuilderSession();
  const partnerDemo = partnerRealm.mintDemoPartnerSession();

  assert.equal(talentDemo.claims.aud, 'vna-talent');
  assert.equal(partnerDemo.claims.aud, 'vna-partner');

  assert.ok(talentRealm.verifySession(talentDemo.token), 'Talent realm verifies its own token');
  assert.ok(partnerRealm.verifySession(partnerDemo.token), 'Partner realm verifies its own token');

  assert.equal(
    talentRealm.verifySession(partnerDemo.token),
    null,
    'Talent realm MUST reject Partner tokens'
  );
  assert.equal(
    partnerRealm.verifySession(talentDemo.token),
    null,
    'Partner realm MUST reject Talent tokens'
  );
});

test('2. Unlock readiness and work clearance require all three vault steps', () => {
  const initialVault = createInitialVault('builder-1');
  assert.equal(computeVaultReadiness(initialVault).completedCount, 1);
  assert.equal(isComplianceClearedForWork(initialVault), false);

  const partialVault = {
    ...initialVault,
    identityCompleted: true,
    contractCompleted: true,
    payoutCompleted: false,
  };
  assert.equal(computeVaultReadiness(partialVault).completedCount, 2);
  assert.equal(isComplianceClearedForWork(partialVault), false);

  const clearedVault = {
    ...partialVault,
    payoutCompleted: true,
  };
  assert.equal(computeVaultReadiness(clearedVault).completedCount, 3);
  assert.equal(isComplianceClearedForWork(clearedVault), true);
});

test('GlossaryModal contains Mentor-Mentee relationship definition and Mentorship vs Guidance FAQ', () => {
  const mentorMenteeItem = GLOSSARY_ENTRIES.find((item) => item.id === 'fw-mentoring-mentorship');
  assert.ok(mentorMenteeItem, 'Expected Mentor-Mentee GlossaryItem in GLOSSARY_ENTRIES');
  assert.match(mentorMenteeItem.term, /Mentor-Mentee/i);
  assert.match(mentorMenteeItem.definition, /Formal Mentorship/i);
  assert.match(mentorMenteeItem.definition, /Sprint-Based Guidance/i);

  assert.ok(
    MENTORSHIP_VS_GUIDANCE_FAQ.length >= 3,
    'Expected Mentorship vs. Guidance FAQ entries'
  );
});

test('GlossaryModal How It Works steps and FAQs maintain 100% bidirectional cross-link integrity', () => {
  assert.ok(
    HOW_IT_WORKS_STEPS.length >= 6,
    'Expected 5 Crossing Stages plus Partner Console Review step in HOW_IT_WORKS_STEPS'
  );
  assert.ok(
    ALL_GLOSSARY_FAQS.length >= 8,
    'Expected combined platform workflow FAQs and Mentorship vs Guidance FAQs'
  );

  const faqIds = new Set(ALL_GLOSSARY_FAQS.map((f) => f.id));
  const stepIds = new Set(HOW_IT_WORKS_STEPS.map((s) => s.id));

  for (const step of HOW_IT_WORKS_STEPS) {
    assert.ok(
      faqIds.has(step.relatedFaqId),
      `How It Works step ${step.id} links to missing FAQ id ${step.relatedFaqId}`
    );
  }

  for (const faq of ALL_GLOSSARY_FAQS) {
    assert.ok(
      stepIds.has(faq.relatedHowItWorksStepId),
      `FAQ ${faq.id} links to missing How It Works step id ${faq.relatedHowItWorksStepId}`
    );
  }

  // Verify FAQ + How-It-Works search filtering matches Partner PDF & Mentorship queries
  const pdfMatches = ALL_GLOSSARY_FAQS.filter((f) =>
    `${f.question} ${f.answer} ${f.bestStage}`.toLowerCase().includes('pdf')
  );
  assert.ok(pdfMatches.some((f) => f.id === 'faq-partner-audit-pdf'));

  const stepMatches = HOW_IT_WORKS_STEPS.filter((s) =>
    `${s.title} ${s.summary} ${s.keywords}`.toLowerCase().includes('bulk approve')
  );
  assert.ok(stepMatches.some((s) => s.id === 'step-partner-review'));
});

test('MentorMessagingDrawer dynamically resolves sprint phases with screen-share and blocker tips', () => {
  assert.equal(
    resolveSprintPhaseForTips({
      contextNote: 'Sprint kickoff & scope framing',
      messagesCount: 0,
      attendedSessionsCount: 0,
      milestoneReviewsCount: 0,
    }),
    'kickoff'
  );
  assert.equal(
    resolveSprintPhaseForTips({
      contextNote: 'Active sprint build in progress',
      messagesCount: 3,
      attendedSessionsCount: 1,
      milestoneReviewsCount: 0,
    }),
    'building'
  );
  assert.equal(
    resolveSprintPhaseForTips({
      contextNote: 'QA verification review',
      messagesCount: 4,
      attendedSessionsCount: 1,
      milestoneReviewsCount: 1,
    }),
    'qa-review'
  );
  assert.equal(
    resolveSprintPhaseForTips({
      contextNote: 'Sprint completed and 100% settled',
      messagesCount: 6,
      attendedSessionsCount: 2,
      milestoneReviewsCount: 2,
    }),
    'wrap-up'
  );

  const allTips = Object.values(SPRINT_PHASE_META).flatMap((phase) => phase.tips);
  assert.ok(
    allTips.some((tip) => /screen share|share screen/i.test(tip.actionLabel)),
    'Expected a context-aware screen share suggestion'
  );
  assert.ok(
    allTips.some((tip) => /blocker/i.test(tip.actionLabel)),
    'Expected a context-aware project blockers suggestion'
  );
});
