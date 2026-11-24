import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AGE_STAGE_PATHWAYS,
  COMPLIANCE_COUNTRY_PRESETS,
  CONTRACTING_STRUCTURES,
  FATF_TIERED_KYC_BRIDGE,
  FINANCIAL_PAYOUT_RAILS,
  FINANCIAL_READINESS_CHECKLIST_ITEMS,
  IDENTITY_DOCUMENT_TIERS,
  PRACTICAL_SCENARIOS,
  SEED_BRIEFS,
  SOLUTION_SPRINTS,
  STUDIO_DOMAINS,
  TARGET_WORK_MODES,
  advancePayoutStatus,
  buildCohortBlueprint,
  buildEndorsementShareLink,
  buildLedgerCsv,
  buildMentorQuickReply,
  buildOnboardingPackTemplate,
  buildSharedPassportLink,
  buildSharedPassportPayload,
  buildSprintAgreementText,
  compactOfflineQueue,
  computeAnalyticsSummary,
  computeBriefMatchScore,
  computeFeedbackSummary,
  computeFinancialCrossingProgress,
  computeKnowledgeToWorkFlow,
  computeMilestoneBadges,
  computePeerFlywheelMetrics,
  computeSdgPulseMetrics,
  computeSprintDueAlerts,
  computeSprintPerformanceSeries,
  computeVaultReadiness,
  createInitialProfile,
  createInitialVault,
  enforceUnderFifteenWords,
  filterAndRankBriefs,
  filterSolutionSprints,
  getAssignedMentorForSprint,
  getMatchedFatfKycTier,
  getPreseededComplianceRoute,
  getSprintComplexityLevel,
  getUserPodSeat,
  isValidFirebaseId,
  normalizeAgeStage,
  normalizeLocale,
  parseSharedPassportToken,
  promoteVerificationStatus,
  rankSolutionSprints,
} from './talentEngine';
import type {
  BriefSubmission,
  CompetencyPassport,
  ContractPayout,
  MentorMessage,
  OfflineMutation,
  PeerEndorsement,
  SkillCapability,
  SprintFeedback,
} from '../types/kora';
import {
  buildComplianceReceiptPdfBytes,
  buildPlainTextPdfBytes,
  formatPayoutReceiptId,
} from './pdfReceipt';

const sampleCap: SkillCapability = {
  id: 'cap-1',
  ownerUid: 'user-1',
  title: '48V Solar Inverter Diagnostics',
  domain: 'Green Energy',
  proofSummary: 'Balanced three 48V LiFePO4 battery banks for rural clinics.',
  verificationStatus: 'field-verified',
  confidenceScore: 84,
  createdAtIso: '2026-11-24T10:00:00.000Z',
  updatedAtIso: '2026-11-24T10:00:00.000Z',
};

const samplePassport: CompetencyPassport = {
  id: 'pass-1',
  ownerUid: 'user-1',
  studioDomain: 'Green Energy',
  inputMode: 'scenario',
  ageStageTrack: '30–45 Specialist · Field Systems Lead',
  fieldMatch: 'Off-Grid Microgrid Commissioning & Fault Isolation',
  executiveSummary: 'Demonstrated disciplined electrical diagnostics under rural clinic load constraints.',
  verifiedSkills: [
    {
      name: '48V LiFePO4 Fault Isolation',
      confidenceLabel: 'High Confidence',
      confidenceScore: 92,
      evidenceNote: 'Identified cell voltage sag and busbar torque verification.',
    },
  ],
  microBridge: {
    title: 'IEC 62109 Inverter Safety Sign-Off Module',
    action: 'Complete the 4-hour remote compliance walkthrough for commercial clinic tenders.',
    estimatedDuration: '4 hours · Self-paced',
    partnerProgram: 'Global Clean Energy Guild',
  },
  stipendEligible: true,
  generatedAtIso: '2026-11-24T11:00:00.000Z',
};

test('all four Talent Studio domains have complete practical scenarios', () => {
  for (const domain of STUDIO_DOMAINS) {
    const scenario = PRACTICAL_SCENARIOS[domain];
    assert.ok(scenario, `Missing scenario for ${domain}`);
    assert.equal(scenario.domain, domain);
    assert.ok(scenario.context.length > 20);
    assert.ok(scenario.question.length > 15);
  }
});

test('brief match scoring prioritizes relevant verified domain and passport', () => {
  const solarBrief = SEED_BRIEFS.find((b) => b.id === 'brief-solar-clinic-01')!;
  const smeBrief = SEED_BRIEFS.find((b) => b.id === 'brief-sme-cashflow-07')!;
  const solarScore = computeBriefMatchScore(
    solarBrief,
    'Solar inverter battery diagnostics',
    '30-45',
    [sampleCap],
    samplePassport
  );
  const smeScore = computeBriefMatchScore(
    smeBrief,
    'Solar inverter battery diagnostics',
    '30-45',
    [sampleCap],
    samplePassport
  );
  assert.ok(solarScore > smeScore);
  assert.ok(solarScore >= 85);
});

test('filterAndRankBriefs filters by domain, complexity, and search query', () => {
  const appliedOnly = filterAndRankBriefs(
    SEED_BRIEFS,
    '',
    'ALL',
    'Solar',
    '30-45',
    [sampleCap],
    'Applied',
    samplePassport
  );
  assert.ok(appliedOnly.length >= 3);
  assert.ok(appliedOnly.every((b) => b.complexity === 'Applied'));

  const filtered = filterAndRankBriefs(
    SEED_BRIEFS,
    'inverter',
    'Green Energy',
    'Solar',
    '30-45',
    [sampleCap],
    'Applied',
    samplePassport
  );
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, 'brief-solar-clinic-01');
  assert.equal(filtered[0].qualified, true);
});

test('verification status promotes cleanly from pending -> field-verified -> master-endorsed', () => {
  const step1 = promoteVerificationStatus('pending');
  assert.equal(step1.nextStatus, 'field-verified');
  assert.equal(step1.nextConfidence, 82);

  const step2 = promoteVerificationStatus(step1.nextStatus);
  assert.equal(step2.nextStatus, 'master-endorsed');
  assert.equal(step2.nextConfidence, 96);
});

test('computeMilestoneBadges unlocks achievements based on verified capabilities, completed briefs, and passport', () => {
  const completedContrib: BriefSubmission = {
    id: 'sub-1',
    ownerUid: 'user-1',
    briefId: 'brief-solar-clinic-01',
    briefTitle: 'Off-Grid Rural Clinic Inverter & Battery Balancing',
    domain: 'Green Energy',
    status: 'completed',
    solutionNotes: 'Completed cell balancing and busbar schedule.',
    hoursLogged: 6,
    payoutUsd: 420,
    createdAtIso: '2026-11-24T10:00:00.000Z',
    updatedAtIso: '2026-11-24T12:00:00.000Z',
  };

  const badges = computeMilestoneBadges([sampleCap], [completedContrib], samplePassport);
  assert.equal(badges.length, 6);
  const unlockedIds = badges.filter((b) => b.unlocked).map((b) => b.id);
  assert.ok(unlockedIds.includes('badge-field-proven'));
  assert.ok(unlockedIds.includes('badge-first-milestone'));
  assert.ok(unlockedIds.includes('badge-living-passport'));
  assert.ok(!unlockedIds.includes('badge-master-craft'));
});

test('computeAnalyticsSummary aggregates verified skills, earnings, hours, and domain growth', () => {
  const contribs: BriefSubmission[] = [
    {
      id: 'sub-1',
      ownerUid: 'user-1',
      briefId: 'brief-solar-clinic-01',
      briefTitle: 'Off-Grid Rural Clinic Inverter & Battery Balancing',
      domain: 'Green Energy',
      status: 'completed',
      solutionNotes: 'Completed cell balancing and busbar schedule.',
      hoursLogged: 6,
      payoutUsd: 420,
      createdAtIso: '2026-11-24T10:00:00.000Z',
      updatedAtIso: '2026-11-24T12:00:00.000Z',
    },
    {
      id: 'sub-2',
      ownerUid: 'user-1',
      briefId: 'brief-water-mapping-02',
      briefTitle: 'Gravity-Fed Biosand Filtration Flow Calibration',
      domain: 'Water & Sanitation',
      status: 'in-progress',
      solutionNotes: 'Drafting calibration sheet.',
      hoursLogged: 2,
      payoutUsd: 540,
      createdAtIso: '2026-11-24T11:00:00.000Z',
      updatedAtIso: '2026-11-24T11:30:00.000Z',
    },
  ];

  const summary = computeAnalyticsSummary([sampleCap], contribs);
  assert.equal(summary.verifiedCapabilitiesCount, 1);
  assert.equal(summary.completedContributionsCount, 1);
  assert.equal(summary.activeBriefsCount, 1);
  assert.equal(summary.totalEarnedUsd, 420);
  assert.equal(summary.totalHoursApplied, 8);
  assert.equal(summary.domainGrowth[0].domain, 'Green Energy');
  assert.equal(summary.domainGrowth[0].completedCount, 1);
});

test('compactOfflineQueue keeps only the latest mutation per entity including passports', () => {
  const queue: OfflineMutation[] = [
    {
      id: 'm1',
      kind: 'upsert_passport',
      payload: { ...samplePassport, stipendEligible: false },
      queuedAtIso: '2026-11-24T10:00:00.000Z',
    },
    {
      id: 'm2',
      kind: 'upsert_passport',
      payload: { ...samplePassport, stipendEligible: true },
      queuedAtIso: '2026-11-24T10:01:00.000Z',
    },
  ];
  const compacted = compactOfflineQueue(queue);
  assert.equal(compacted.length, 1);
  assert.equal(compacted[0].kind === 'upsert_passport' && compacted[0].payload.stipendEligible, true);
});

test('buildLedgerCsv produces escaped CSV rows and isValidFirebaseId validates safe IDs', () => {
  const csv = buildLedgerCsv([
    {
      id: 'c1',
      ownerUid: 'u1',
      briefId: 'b1',
      briefTitle: 'Solar "Clinic" Fix',
      domain: 'Green Energy',
      status: 'completed',
      solutionNotes: 'Fixed',
      hoursLogged: 4,
      payoutUsd: 300,
      createdAtIso: '2026-11-24T10:00:00.000Z',
      updatedAtIso: '2026-11-24T12:00:00.000Z',
    },
  ]);
  assert.ok(csv.includes('"Solar ""Clinic"" Fix"'));
  assert.equal(isValidFirebaseId('cap-seed_1'), true);
  assert.equal(isValidFirebaseId('bad/id$'), false);
});

test('normalizeAgeStage, normalizeLocale, and AGE_STAGE_PATHWAYS handle legacy and new brackets', () => {
  assert.equal(normalizeAgeStage('15-19'), '15-17');
  assert.equal(normalizeAgeStage('20-29'), '18-29');
  assert.equal(normalizeAgeStage('15-17'), '15-17');
  assert.equal(normalizeAgeStage('18-29'), '18-29');
  assert.equal(normalizeAgeStage('30-45'), '30-45');
  assert.equal(normalizeAgeStage('46+'), '46+');
  assert.equal(normalizeAgeStage(undefined), '30-45');

  assert.equal(normalizeLocale('sw'), 'sw');
  assert.equal(normalizeLocale('fr'), 'fr');
  assert.equal(normalizeLocale('ar'), 'ar');
  assert.equal(normalizeLocale('uk'), 'en');

  for (const stage of ['15-17', '18-29', '30-45', '46+'] as const) {
    const pathway = AGE_STAGE_PATHWAYS[stage];
    assert.equal(pathway.stage, stage);
    assert.ok(pathway.headline.length > 10);
    assert.ok(pathway.verificationMode.length > 5);
    assert.ok(pathway.typicalFirstBrief.length > 5);
  }
});

test('Work-Ready Vault readiness, sprint agreement generation, and vault queue compaction', () => {
  const vault = createInitialVault('user-1');
  const initialReadiness = computeVaultReadiness(vault);
  assert.equal(initialReadiness.completedCount, 1);
  assert.equal(initialReadiness.isFullyReady, false);

  const readyVault = {
    ...vault,
    identityCompleted: true,
    contractCompleted: true,
    payoutCompleted: true,
    payoutRail: 'mobile-money' as const,
  };
  const readyMetrics = computeVaultReadiness(readyVault);
  assert.equal(readyMetrics.completedCount, 3);
  assert.equal(readyMetrics.isFullyReady, true);
  assert.equal(readyMetrics.percentage, 100);

  const agreement = buildSprintAgreementText({
    practitionerName: 'Amina Hassan',
    partnerOrg: 'MedGrid Field Partners',
    sprintTitle: '48V Rural Clinic Microgrid Audit',
    deliverableSummary: 'Cell-balance log and handover schematic',
    payoutUsd: 420,
    durationDays: 5,
    vault: readyVault,
    ageStage: '30-45',
    verifiedSkillsCount: 2,
    passportId: 'pass-1',
  });
  assert.ok(agreement.includes('PRE-CLEARED (3/3 Work-Ready Vault Checks Verified)'));
  assert.ok(agreement.includes('Mobile Money'));
  assert.ok(agreement.includes('$420 USD'));

  const compacted = compactOfflineQueue([
    { id: 'mv1', kind: 'upsert_vault', payload: vault, queuedAtIso: '2026-11-24T10:00:00.000Z' },
    { id: 'mv2', kind: 'upsert_vault', payload: readyVault, queuedAtIso: '2026-11-24T10:05:00.000Z' },
  ]);
  assert.equal(compacted.length, 1);
  assert.equal(compacted[0].kind === 'upsert_vault' && compacted[0].payload.payoutCompleted, true);
});

test('rankSolutionSprints ranks 4 realistic sprints using Living Competency Passport and assigns cross-age pod seats', () => {
  assert.equal(SOLUTION_SPRINTS.length, 4);
  const seniorProfile = createInitialProfile({
    ageStage: '30-45',
    problemStatement: '48V solar microgrid fault diagnostics and cold-storage balancing',
  });
  const rankedSenior = rankSolutionSprints(seniorProfile, [sampleCap], samplePassport);
  assert.equal(rankedSenior.length, 4);
  assert.equal(rankedSenior[0].id, 'sprint-solar-coldchain-01');
  assert.equal(rankedSenior[0].userPodSeat, 'lead');
  assert.ok(rankedSenior[0].whyYouFit.includes('Living Competency Passport'));

  const emergingProfile = createInitialProfile({
    ageStage: '18-29',
    problemStatement: 'Building TypeScript offline sync queues for 2G networks',
  });
  const rankedEmerging = rankSolutionSprints(emergingProfile, [], null);
  assert.equal(getUserPodSeat('18-29'), 'delivery');
  assert.equal(rankedEmerging[0].id, 'sprint-remote-sync-03');
  assert.equal(rankedEmerging[0].userPodSeat, 'delivery');
  assert.ok(rankedEmerging[0].whyYouFit.length > 20);
});

test('peer endorsement share links, payout lifecycle transitions, and queue compaction work cleanly', () => {
  const link = buildEndorsementShareLink('https://vukanaamana.app/', {
    shareToken: 'vuka-tok-123',
    capabilityTitle: '48V Solar Inverter Diagnostics',
  });
  assert.ok(link.startsWith('https://vukanaamana.app/?'));
  assert.ok(link.includes('endorse=vuka-tok-123'));

  assert.equal(advancePayoutStatus('escrow-held'), 'processing');
  assert.equal(advancePayoutStatus('processing'), 'released');
  assert.equal(advancePayoutStatus('released'), 'released');

  const end1: PeerEndorsement = {
    id: 'end-1',
    ownerUid: 'u1',
    collaboratorName: 'Grace Wanjiku',
    collaboratorRole: 'Operations Manager',
    organization: 'Rift Valley Co-op',
    capabilityTitle: '48V Solar Diagnostics',
    endorsementText: '',
    status: 'requested',
    shareToken: 'tok-1',
    sourceTab: 'unlock',
    createdAtIso: '2026-11-24T10:00:00.000Z',
    updatedAtIso: '2026-11-24T10:00:00.000Z',
  };
  const pay1: ContractPayout = {
    id: 'pay-1',
    ownerUid: 'u1',
    sprintId: 'sprint-solar-coldchain-01',
    sprintTitle: '48V Cold-Storage Sprint',
    partnerOrg: 'Rift Valley Co-op',
    amountUsd: 480,
    payoutRail: 'mobile-money',
    status: 'escrow-held',
    createdAtIso: '2026-11-24T10:00:00.000Z',
    updatedAtIso: '2026-11-24T10:00:00.000Z',
  };

  const compacted = compactOfflineQueue([
    { id: 'm1', kind: 'upsert_endorsement', payload: end1, queuedAtIso: '2026-11-24T10:00:00.000Z' },
    {
      id: 'm2',
      kind: 'upsert_endorsement',
      payload: { ...end1, status: 'verified', endorsementText: 'Delivered reliable solar cold-room fix.' },
      queuedAtIso: '2026-11-24T10:05:00.000Z',
    },
    { id: 'm3', kind: 'upsert_payout', payload: pay1, queuedAtIso: '2026-11-24T10:00:00.000Z' },
    {
      id: 'm4',
      kind: 'upsert_payout',
      payload: { ...pay1, status: 'processing' },
      queuedAtIso: '2026-11-24T10:06:00.000Z',
    },
  ]);
  assert.equal(compacted.length, 2);
});

test('filterSolutionSprints filters by Beginner, Intermediate, Advanced and Domain cleanly', () => {
  const profile = createInitialProfile({ ageStage: '30-45' });
  const ranked = rankSolutionSprints(profile, [sampleCap], samplePassport);

  assert.equal(getSprintComplexityLevel('Foundational'), 'Beginner');
  assert.equal(getSprintComplexityLevel('Applied'), 'Intermediate');
  assert.equal(getSprintComplexityLevel('Advanced'), 'Advanced');

  const beginnerOnly = filterSolutionSprints(ranked, 'Beginner', 'ALL');
  assert.equal(beginnerOnly.length, 1);
  assert.equal(beginnerOnly[0].studioDomain, 'Healthcare Ops');

  const intermediateOnly = filterSolutionSprints(ranked, 'Intermediate', 'ALL');
  assert.equal(intermediateOnly.length, 2);

  const advancedTech = filterSolutionSprints(ranked, 'Advanced', 'Tech');
  assert.equal(advancedTech.length, 1);
  assert.equal(advancedTech[0].id, 'sprint-remote-sync-03');

  const emptyCombo = filterSolutionSprints(ranked, 'Beginner', 'Tech');
  assert.equal(emptyCombo.length, 0);
});

test('Pulse SDG cards, Knowledge-to-Work Flow, and Sprint Performance react dynamically to Tabs 1-3 actions', () => {
  const baseProfile = createInitialProfile({
    ageStage: '30-45',
    problemStatement: 'Solar microgrid diagnostics',
    onboarded: true,
  });
  const baseVault = createInitialVault('u1');
  const baseContrib: BriefSubmission = {
    id: 'c1',
    ownerUid: 'u1',
    briefId: 'brief-coldchain-03',
    briefTitle: 'Solar-Direct Cold-Chain Compressor Retrofit Plan',
    domain: 'Cold-Chain Logistics',
    status: 'completed',
    solutionNotes: 'Completed audit.',
    hoursLogged: 5,
    payoutUsd: 350,
    createdAtIso: '2026-11-24T10:00:00.000Z',
    updatedAtIso: '2026-11-24T10:00:00.000Z',
  };
  const basePayout: ContractPayout = {
    id: 'p1',
    ownerUid: 'u1',
    sprintId: 'brief-coldchain-03',
    sprintTitle: 'Solar-Direct Cold-Chain Compressor Retrofit Plan',
    partnerOrg: 'HarvestKeep Network',
    amountUsd: 350,
    payoutRail: 'mobile-money',
    status: 'released',
    createdAtIso: '2026-11-24T10:00:00.000Z',
    updatedAtIso: '2026-11-24T10:00:00.000Z',
  };

  const beforeSdg = computeSdgPulseMetrics({
    profile: baseProfile,
    capabilities: [sampleCap],
    passport: null,
    endorsements: [],
    vault: baseVault,
    payouts: [basePayout],
    contributions: [baseContrib],
  });
  const beforeFlow = computeKnowledgeToWorkFlow({
    profile: baseProfile,
    capabilities: [sampleCap],
    passport: null,
    endorsements: [],
    vault: baseVault,
    payouts: [basePayout],
    contributions: [baseContrib],
  });
  const beforePerf = computeSprintPerformanceSeries([baseContrib], [basePayout]);

  assert.equal(beforeSdg.length, 5);
  assert.equal(beforeFlow.length, 4);
  assert.equal(beforePerf.points.length, 2);
  assert.equal(beforePerf.totalHistoricalEarningsUsd, 350);
  assert.equal(beforePerf.currentAcceptanceRatePct, 100);

  // Now simulate actions across Tabs 1, 2, and 3:
  const newEndorsement: PeerEndorsement = {
    id: 'end-2',
    ownerUid: 'u1',
    collaboratorName: 'Dr. Amina',
    collaboratorRole: 'Director',
    organization: 'Clinics Without Borders',
    capabilityTitle: '48V Solar Inverter Diagnostics',
    endorsementText: 'Reliable microgrid stabilization under field constraints.',
    status: 'verified',
    shareToken: 'tok-2',
    sourceTab: 'verify',
    createdAtIso: '2026-11-24T11:00:00.000Z',
    updatedAtIso: '2026-11-24T11:00:00.000Z',
  };
  const upgradedVault = {
    ...baseVault,
    contractCompleted: true,
    payoutCompleted: true,
  };
  const newCompletedSprint: BriefSubmission = {
    id: 'c2',
    ownerUid: 'u1',
    briefId: 'sprint-solar-coldchain-01',
    briefTitle: '48V Cold-Storage & Solar Microgrid Diagnostics Sprint',
    domain: 'Green Energy',
    status: 'completed',
    solutionNotes: 'Delivered diagnostic matrix and busbar remediation.',
    hoursLogged: 8,
    payoutUsd: 480,
    createdAtIso: '2026-11-24T12:00:00.000Z',
    updatedAtIso: '2026-11-24T12:00:00.000Z',
  };
  const newPayout: ContractPayout = {
    id: 'p2',
    ownerUid: 'u1',
    sprintId: 'sprint-solar-coldchain-01',
    sprintTitle: '48V Cold-Storage & Solar Microgrid Diagnostics Sprint',
    partnerOrg: 'Rift Valley Cold-Chain Co-op',
    amountUsd: 480,
    payoutRail: 'mobile-money',
    status: 'released',
    createdAtIso: '2026-11-24T12:00:00.000Z',
    updatedAtIso: '2026-11-24T12:00:00.000Z',
  };

  const afterSdg = computeSdgPulseMetrics({
    profile: baseProfile,
    capabilities: [sampleCap],
    passport: samplePassport,
    endorsements: [newEndorsement],
    vault: upgradedVault,
    payouts: [newPayout, basePayout],
    contributions: [newCompletedSprint, baseContrib],
  });
  const afterFlow = computeKnowledgeToWorkFlow({
    profile: baseProfile,
    capabilities: [sampleCap],
    passport: samplePassport,
    endorsements: [newEndorsement],
    vault: upgradedVault,
    payouts: [newPayout, basePayout],
    contributions: [newCompletedSprint, baseContrib],
  });
  const afterPerf = computeSprintPerformanceSeries(
    [newCompletedSprint, baseContrib],
    [newPayout, basePayout]
  );

  // Every single one of the 5 SDG cards must dynamically increment
  for (let i = 0; i < 5; i++) {
    assert.ok(
      afterSdg[i].numericValue > beforeSdg[i].numericValue,
      `Expected SDG ${afterSdg[i].sdgNumber} to increment (${beforeSdg[i].numericValue} -> ${afterSdg[i].numericValue})`
    );
  }

  // Knowledge-to-Work Flow stages 2, 3, and 4 must dynamically increment
  assert.ok(afterFlow[1].count > beforeFlow[1].count);
  assert.ok(afterFlow[2].count > beforeFlow[2].count);
  assert.ok(afterFlow[3].count > beforeFlow[3].count);

  // Sprint performance historical payout & acceptance must increase
  assert.equal(afterPerf.totalHistoricalEarningsUsd - beforePerf.totalHistoricalEarningsUsd, 480);
  assert.ok(afterPerf.currentAcceptanceRatePct >= beforePerf.currentAcceptanceRatePct);
});

test('Partner & Scale Mode generates localized cohort blueprints and self-sustaining Peer-Assessor Flywheel metrics', () => {
  const kenyaSolarSw = buildCohortBlueprint('kenya', 'solar', 'sw');
  assert.equal(kenyaSolarSw.regionLabel, 'Kenya');
  assert.equal(kenyaSolarSw.languageCode, 'sw');
  assert.equal(kenyaSolarSw.payoutRail, 'mobile-money');
  assert.ok(kenyaSolarSw.payoutRailLocalLabel.includes('M-Pesa'));
  assert.equal(kenyaSolarSw.complianceChecklist.length, 3);
  assert.equal(kenyaSolarSw.sprintTemplates.length, 2);

  const jordanTechAr = buildCohortBlueprint('jordan', 'digital-services', 'ar');
  assert.equal(jordanTechAr.regionLabel, 'Jordan');
  assert.equal(jordanTechAr.studioDomain, 'Tech');
  assert.ok(jordanTechAr.aiDiagnosticSummary.includes('العربية'));

  const centralOff = computePeerFlywheelMetrics(250, false, 2);
  const flywheelOn = computePeerFlywheelMetrics(250, true, 2);
  assert.equal(centralOff.graduatedMastersAndSpecialists, 0);
  assert.ok(flywheelOn.graduatedMastersAndSpecialists >= 50);
  assert.ok(flywheelOn.emergingBuildersMentored >= 150);
  assert.ok(flywheelOn.manualAdminHoursPerWeek < centralOff.manualAdminHoursPerWeek);
  assert.ok(flywheelOn.overheadReductionPct >= 80);
  assert.ok(flywheelOn.qaTurnaroundHours < centralOff.qaTurnaroundHours);
});

test('Share Passport generates a valid read-only link and safely parses or rejects tokens', () => {
  const profile = createInitialProfile({
    displayName: 'Tariq Al-Mansoor',
    email: 'private@example.com',
    ageStage: '30-45',
    problemStatement: 'Solar microgrid diagnostics',
  });
  const payload = buildSharedPassportPayload({
    profile,
    passport: samplePassport,
    capabilities: [sampleCap],
    endorsements: [],
  });

  const url = buildSharedPassportLink('https://vukanaamana.app/', payload);
  assert.ok(url.startsWith('https://vukanaamana.app/?passport='));
  assert.ok(!url.includes('private@example.com'));

  const parsedUrl = new URL(url);
  const token = parsedUrl.searchParams.get('passport');
  const decoded = parseSharedPassportToken(token);
  assert.ok(decoded);
  assert.equal(decoded.practitionerName, 'Tariq Al-Mansoor');
  assert.equal(decoded.studioDomain, 'Green Energy');
  assert.equal(decoded.verifiedSkills.length, 1);
  assert.ok(decoded.readOnlySignature.startsWith('VNA-'));

  assert.equal(parseSharedPassportToken('invalid!!!token'), null);
  assert.equal(parseSharedPassportToken(''), null);
});

test('computeFeedbackSummary aggregates star ratings and handles empty lists', () => {
  assert.deepEqual(computeFeedbackSummary([]), {
    totalReviews: 0,
    averageRating: 0,
    fiveStarCount: 0,
  });

  const sampleReviews: SprintFeedback[] = [
    {
      id: 'fb-1',
      ownerUid: 'u1',
      contributionId: 'c1',
      briefId: 'b1',
      briefTitle: 'Solar Sprint',
      partnerOrg: 'HarvestKeep Network',
      reviewerName: 'Nadia Odhiambo',
      reviewerRole: 'Operations Director',
      rating: 5,
      reviewText: 'Clear handover SOP and zero thermal drift after deployment.',
      createdAtIso: '2026-11-24T10:00:00.000Z',
      updatedAtIso: '2026-11-24T10:00:00.000Z',
    },
    {
      id: 'fb-2',
      ownerUid: 'u1',
      contributionId: 'c2',
      briefId: 'b2',
      briefTitle: 'Sync Sprint',
      partnerOrg: 'OpenField Ledger',
      reviewerName: 'Marek Nowak',
      reviewerRole: 'Engineering Lead',
      rating: 4,
      reviewText: 'Solid conflict-resolution tests under simulated 2G packet loss.',
      createdAtIso: '2026-11-24T11:00:00.000Z',
      updatedAtIso: '2026-11-24T11:00:00.000Z',
    },
  ];

  const summary = computeFeedbackSummary(sampleReviews);
  assert.equal(summary.totalReviews, 2);
  assert.equal(summary.averageRating, 4.5);
  assert.equal(summary.fiveStarCount, 1);
});

test('getAssignedMentorForSprint maps active sprints to domain Senior Specialists and compacts feedback/message queue', () => {
  const solarMentor = getAssignedMentorForSprint('sprint-solar-coldchain-01', 'Green Energy');
  assert.equal(solarMentor.domain, 'Green Energy');
  assert.equal(solarMentor.availability, 'available');

  const techMentor = getAssignedMentorForSprint('sprint-remote-sync-03', 'Tech');
  assert.equal(techMentor.domain, 'Tech');
  assert.equal(techMentor.availability, 'in-review');

  const reply = buildMentorQuickReply(solarMentor, '48V Diagnostics', 'Hit a blocker on cell #4');
  assert.ok(reply.includes('unblock'));

  const fb: SprintFeedback = {
    id: 'fb-same',
    ownerUid: 'u1',
    contributionId: 'c1',
    briefId: 'b1',
    briefTitle: 'Solar Sprint',
    partnerOrg: 'HarvestKeep',
    reviewerName: 'Nadia',
    reviewerRole: 'Director',
    rating: 5,
    reviewText: 'Great field diagnostics and clear handover documentation.',
    createdAtIso: '2026-11-24T10:00:00.000Z',
    updatedAtIso: '2026-11-24T10:00:00.000Z',
  };
  const msg: MentorMessage = {
    id: 'msg-same',
    ownerUid: 'u1',
    sprintId: 'sprint-solar-coldchain-01',
    sprintTitle: '48V Diagnostics',
    mentorId: solarMentor.id,
    mentorName: solarMentor.name,
    sender: 'practitioner',
    body: 'Checking inverter busbar torque specs',
    createdAtIso: '2026-11-24T10:00:00.000Z',
    updatedAtIso: '2026-11-24T10:00:00.000Z',
  };

  const queue: OfflineMutation[] = [
    { id: 'm1', kind: 'upsert_sprint_feedback', payload: fb, queuedAtIso: '2026-11-24T10:00:00.000Z' },
    { id: 'm2', kind: 'upsert_sprint_feedback', payload: { ...fb, rating: 4 }, queuedAtIso: '2026-11-24T10:01:00.000Z' },
    { id: 'm3', kind: 'upsert_mentor_message', payload: msg, queuedAtIso: '2026-11-24T10:00:00.000Z' },
    { id: 'm4', kind: 'upsert_mentor_message', payload: { ...msg, body: 'Updated question' }, queuedAtIso: '2026-11-24T10:01:00.000Z' },
  ];
  const compacted = compactOfflineQueue(queue);
  assert.equal(compacted.length, 2);
  assert.equal(compacted[0].kind === 'upsert_sprint_feedback' && compacted[0].payload.rating, 4);
  assert.equal(compacted[1].kind === 'upsert_mentor_message' && compacted[1].payload.body, 'Updated question');
});

test('Compliance Readiness presets cover global countries, all 3 Regulatory Access Tiers, and strictly under 15 words per step', () => {
  assert.equal(COMPLIANCE_COUNTRY_PRESETS.length, 7);
  assert.equal(IDENTITY_DOCUMENT_TIERS.length, 4);
  assert.equal(TARGET_WORK_MODES.length, 3);

  const clamped = enforceUnderFifteenWords(
    'One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen'
  );
  assert.ok(clamped.split(/\s+/).length < 15);

  const enabling = getPreseededComplianceRoute('Kenya', 'refugee-id', 'local-formal');
  assert.equal(enabling.accessTier, 'Enabling');

  const mixed = getPreseededComplianceRoute('Jordan', 'refugee-id', 'local-formal');
  assert.equal(mixed.accessTier, 'Mixed — Friction Guided');

  const restricted = getPreseededComplianceRoute('Jordan', 'unhcr-proof', 'cross-border-remote');
  assert.equal(restricted.accessTier, 'Restricted — Remote/EOR Route Active');

  for (const preset of COMPLIANCE_COUNTRY_PRESETS) {
    for (const tier of IDENTITY_DOCUMENT_TIERS) {
      for (const mode of TARGET_WORK_MODES) {
        const route = getPreseededComplianceRoute(preset.id, tier.id, mode.id);
        assert.ok(route.pathwayHeadline.includes(preset.id));
        assert.ok(route.iloRightsGuarantee.includes('ILO'));
        assert.equal(route.talentSteps.length, 3);
        assert.equal(route.partnerSteps.length, 3);
        for (const step of [...route.talentSteps, ...route.partnerSteps]) {
          const wordCount = step.trim().split(/\s+/).length;
          assert.ok(wordCount < 15, `Step exceeded 14 words (${wordCount}): ${step}`);
        }
      }
    }
  }
});

test('computeSprintDueAlerts triggers within 48 hours of an active sprint deadline and ignores completed or distant sprints', () => {
  const fixedNowMs = Date.parse('2026-11-24T12:00:00.000Z');
  const dueIn36HoursCreatedAt = new Date(fixedNowMs - 5.5 * 86_400_000).toISOString();
  const distantCreatedAt = new Date(fixedNowMs - 1 * 86_400_000).toISOString();

  const contribs: BriefSubmission[] = [
    {
      id: 'c-due-soon',
      ownerUid: 'u1',
      briefId: 'sprint-solar-coldchain-01', // 7-day sprint
      briefTitle: '48V Cold-Storage Sprint',
      domain: 'Green Energy',
      status: 'in-progress',
      solutionNotes: 'Working',
      hoursLogged: 2,
      payoutUsd: 480,
      createdAtIso: dueIn36HoursCreatedAt,
      updatedAtIso: dueIn36HoursCreatedAt,
    },
    {
      id: 'c-distant',
      ownerUid: 'u1',
      briefId: 'sprint-ngo-maternal-02', // 7-day sprint, 6 days remaining (>48h)
      briefTitle: 'Multilingual Triage Sprint',
      domain: 'Healthcare Ops',
      status: 'in-progress',
      solutionNotes: 'Starting',
      hoursLogged: 1,
      payoutUsd: 390,
      createdAtIso: distantCreatedAt,
      updatedAtIso: distantCreatedAt,
    },
    {
      id: 'c-done',
      ownerUid: 'u1',
      briefId: 'brief-coldchain-03',
      briefTitle: 'Completed Sprint',
      domain: 'Cold-Chain Logistics',
      status: 'completed',
      solutionNotes: 'Done',
      hoursLogged: 5,
      payoutUsd: 350,
      createdAtIso: dueIn36HoursCreatedAt,
      updatedAtIso: dueIn36HoursCreatedAt,
    },
  ];

  const alerts = computeSprintDueAlerts(contribs, fixedNowMs);
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].contributionId, 'c-due-soon');
  assert.equal(alerts[0].hoursRemaining, 36);
  assert.equal(alerts[0].formattedRemaining, '36h left');
  assert.equal(alerts[0].isOverdue, false);
});

test('Financial & Payout Rail Readiness auto-matches FATF KYC Tiers, keeps checklist copy under 15 words, and increments SDG 16', () => {
  assert.equal(FATF_TIERED_KYC_BRIDGE.length, 3);
  assert.equal(FINANCIAL_PAYOUT_RAILS.length, 4);
  assert.equal(FINANCIAL_READINESS_CHECKLIST_ITEMS.length, 3);

  for (const item of FINANCIAL_READINESS_CHECKLIST_ITEMS) {
    const wc = item.reassuringCopy.trim().split(/\s+/).length;
    assert.ok(wc < 15, `Checklist copy too long (${wc} words): ${item.reassuringCopy}`);
  }

  assert.equal(getMatchedFatfKycTier('unhcr-proof', 'cross-border-remote', 'Jordan').id, 'tier-1');
  assert.equal(getMatchedFatfKycTier('pending-paperwork', 'paid-fellowship', 'Kenya').id, 'tier-1');
  assert.equal(getMatchedFatfKycTier('refugee-id', 'cross-border-remote', 'Kenya').id, 'tier-2');
  assert.equal(getMatchedFatfKycTier('convention-travel', 'local-formal', 'Germany').id, 'tier-3');

  const profile = createInitialProfile({ ageStage: '30-45', onboarded: true });
  const initialVault = createInitialVault('u1');
  const clearedVault = {
    ...initialVault,
    financialIdentityCleared: true,
    financialRailTested: true,
    financialTaxCleared: true,
    financialRail: 'fiscal-host' as const,
  };

  const progressBefore = computeFinancialCrossingProgress(initialVault);
  const progressAfter = computeFinancialCrossingProgress(clearedVault);
  assert.equal(progressBefore.completedCount, 0);
  assert.equal(progressBefore.isCrossingCleared, false);
  assert.equal(progressAfter.completedCount, 3);
  assert.equal(progressAfter.isCrossingCleared, true);

  const sdgBefore = computeSdgPulseMetrics({
    profile,
    capabilities: [sampleCap],
    passport: null,
    endorsements: [],
    vault: initialVault,
    payouts: [],
    contributions: [],
  });
  const sdgAfter = computeSdgPulseMetrics({
    profile,
    capabilities: [sampleCap],
    passport: null,
    endorsements: [],
    vault: clearedVault,
    payouts: [],
    contributions: [],
  });

  const sdg16Before = sdgBefore.find((m) => m.sdgNumber === 16)!;
  const sdg16After = sdgAfter.find((m) => m.sdgNumber === 16)!;
  assert.equal(sdg16After.numericValue - sdg16Before.numericValue, 4);
  assert.ok(sdg16After.microStory.includes('Crossing Cleared'));
});

test('Payout PDF receipt generator emits valid %PDF-1.4 bytes and deterministic receipt references', () => {
  const samplePayout: ContractPayout = {
    id: 'pay-seed-2',
    ownerUid: 'u1',
    sprintId: 'brief-coldchain-03',
    sprintTitle: 'Solar-Direct Cold-Chain Compressor Retrofit Plan',
    partnerOrg: 'HarvestKeep Network',
    amountUsd: 350,
    payoutRail: 'mobile-money',
    status: 'released',
    createdAtIso: '2026-11-24T08:00:00.000Z',
    updatedAtIso: '2026-11-24T10:00:00.000Z',
  };

  const receiptId = formatPayoutReceiptId(samplePayout);
  assert.ok(receiptId.startsWith('VNA-RCP-'));

  const pdfBytes = buildComplianceReceiptPdfBytes({
    payout: samplePayout,
    practitionerName: 'Tariq Al-Mansoor',
    hostCountry: 'Kenya',
    contractingStructure: 'scoped-remote',
  });
  const pdfText = new TextDecoder().decode(pdfBytes);

  assert.ok(pdfText.startsWith('%PDF-1.4\n'));
  assert.ok(pdfText.includes('xref'));
  assert.ok(pdfText.includes('%%EOF'));
  assert.ok(pdfText.includes('HarvestKeep Network'));
  assert.ok(pdfText.includes('$350 USD'));
  assert.ok(pdfText.includes(receiptId));
});

test('Hiring Partner Onboarding Dossier structures, 1-page agreement generator, and SDG 8 + SDG 16 sync', () => {
  assert.equal(CONTRACTING_STRUCTURES.length, 3);

  const pack = buildOnboardingPackTemplate({
    practitionerName: 'Tariq Al-Mansoor',
    ageStage: '30-45',
    hostCountry: 'Kenya',
    docTier: 'refugee-id',
    workMode: 'cross-border-remote',
    contractingStructure: 'eor-fiscal-host',
    partnerOrg: 'Rift Valley Cold-Chain Co-op',
    sprintTitle: '48V Cold-Storage & Solar Microgrid Diagnostics Sprint',
    payoutUsd: 480,
    selectedPayoutRail: 'fiscal-host',
    verifiedSkills: ['48V Solar Inverter Diagnostics', 'Thermal Telemetry'],
    passportFieldMatch: 'Off-Grid Microgrid Diagnostics',
    passportId: 'pass-1',
  });

  assert.ok(pack.agreementTitle.includes('EOR / Fiscal Host Bridge'));
  assert.ok(pack.fullAgreementText.includes('Rift Valley Cold-Chain Co-op'));
  assert.ok(pack.fullAgreementText.includes('$480 USD'));
  assert.ok(pack.fullAgreementText.includes('ILO'));

  const packPdf = new TextDecoder().decode(
    buildPlainTextPdfBytes({
      title: pack.agreementTitle,
      subtitle: 'Rift Valley Cold-Chain Co-op · Kenya',
      bodyText: pack.fullAgreementText,
    })
  );
  assert.ok(packPdf.startsWith('%PDF-1.4\n'));
  assert.ok(packPdf.includes('%%EOF'));

  const profile = createInitialProfile({ ageStage: '30-45', onboarded: true });
  const baseVault = createInitialVault('u1');
  const clearedPackVault = {
    ...baseVault,
    onboardingPackGenerated: true,
    onboardingContractStructure: 'eor-fiscal-host' as const,
    onboardingPartnerOrg: 'Rift Valley Cold-Chain Co-op',
    onboardingHostCountry: 'Kenya',
  };

  const sdgBefore = computeSdgPulseMetrics({
    profile,
    capabilities: [sampleCap],
    passport: samplePassport,
    endorsements: [],
    vault: baseVault,
    payouts: [],
    contributions: [],
  });
  const sdgAfter = computeSdgPulseMetrics({
    profile,
    capabilities: [sampleCap],
    passport: samplePassport,
    endorsements: [],
    vault: clearedPackVault,
    payouts: [],
    contributions: [],
  });

  const sdg8Before = sdgBefore.find((m) => m.sdgNumber === 8)!;
  const sdg8After = sdgAfter.find((m) => m.sdgNumber === 8)!;
  const sdg16Before = sdgBefore.find((m) => m.sdgNumber === 16)!;
  const sdg16After = sdgAfter.find((m) => m.sdgNumber === 16)!;

  assert.ok(sdg8After.numericValue > sdg8Before.numericValue);
  assert.ok(sdg8After.microStory.includes('1-Click Onboarding Pack'));
  assert.ok(sdg16After.numericValue > sdg16Before.numericValue);
  assert.ok(sdg16After.microStory.includes('1-Click Onboarding Pack'));
});




