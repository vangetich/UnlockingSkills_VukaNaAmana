import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AGE_STAGE_PATHWAYS,
  PRACTICAL_SCENARIOS,
  SEED_BRIEFS,
  SOLUTION_SPRINTS,
  STUDIO_DOMAINS,
  advancePayoutStatus,
  buildCohortBlueprint,
  buildEndorsementShareLink,
  buildLedgerCsv,
  buildSharedPassportLink,
  buildSharedPassportPayload,
  buildSprintAgreementText,
  compactOfflineQueue,
  computeAnalyticsSummary,
  computeBriefMatchScore,
  computeKnowledgeToWorkFlow,
  computeMilestoneBadges,
  computePeerFlywheelMetrics,
  computeSdgPulseMetrics,
  computeSprintPerformanceSeries,
  computeVaultReadiness,
  createInitialProfile,
  createInitialVault,
  filterAndRankBriefs,
  filterSolutionSprints,
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
  OfflineMutation,
  PeerEndorsement,
  SkillCapability,
} from '../types/kora';

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
  assert.equal(beforePerf.points.length, 6);

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

