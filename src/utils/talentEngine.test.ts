import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ADAPTIVE_VERIFICATION_ROUTES,
  AGE_STAGE_PATHWAYS,
  COMPLIANCE_COUNTRY_PRESETS,
  CONTRACTING_STRUCTURES,
  FATF_TIERED_KYC_BRIDGE,
  FINANCIAL_PAYOUT_RAILS,
  FINANCIAL_READINESS_CHECKLIST_ITEMS,
  FOREIGN_CIVIL_TRANSCRIPT_SAMPLE,
  IDENTITY_DOCUMENT_TIERS,
  MATCHED_WORK_OPPORTUNITIES,
  MENTORSHIP_TRACKS,
  POD_MENTORS,
  PRACTICAL_SCENARIOS,
  SEED_BRIEFS,
  SKILL_TRACK_OPTIONS,
  SOLUTION_SPRINTS,
  SPRINT_MILESTONE_STEPS,
  STUDIO_DOMAINS,
  TARGET_WORK_MODES,
  advancePayoutStatus,
  buildAdaptiveCompetencyPassportFallback,
  buildCohortBlueprint,
  buildEndorsementShareLink,
  buildLedgerCsv,
  buildMentorQuickReply,
  buildOfflineLivingProofAnalysis,
  buildOnboardingPackTemplate,
  buildPreseededUpskillingBridge,
  buildSharedPassportLink,
  buildSharedPassportPayload,
  buildSprintAgreementText,
  compactOfflineQueue,
  computeAgeAndCohesionBreakdown,
  computeAnalyticsSummary,
  computeBriefMatchScore,
  computeFeedbackSummary,
  computeFinancialCrossingProgress,
  computeKnowledgeToWorkFlow,
  computeMilestoneBadges,
  computePassportTrustTier,
  computePeerFlywheelMetrics,
  computeSdgPulseMetrics,
  computeSprintDueAlerts,
  computeSprintPerformanceSeries,
  computeVaultReadiness,
  countWorkplaceSignals,
  createInitialLivingProofPortfolio,
  createInitialProfile,
  createInitialVault,
  enforceUnderFifteenWords,
  filterAndRankBriefs,
  filterMatchedWorkOpportunities,
  filterSolutionSprints,
  getAssignedMentorForSprint,
  getMatchedFatfKycTier,
  getMentorshipTrackForDomain,
  getPreseededComplianceRoute,
  getRecommendedVerifyRoute,
  getSprintComplexityLevel,
  getSprintMilestoneProgress,
  getUserPodSeat,
  isComplianceClearedForWork,
  isValidFirebaseId,
  normalizeAgeStage,
  normalizeLocale,
  normalizeSprintMilestones,
  parseSharedPassportToken,
  promoteVerificationStatus,
  rankMatchedWorkOpportunities,
  rankSolutionSprints,
  resolveContributionOrganization,
  filterSprintHistoryContributions,
  toggleSprintMilestoneList,
} from './talentEngine';
import type {
  BriefSubmission,
  CompetencyPassport,
  ContractPayout,
  MentorMessage,
  MentorPairingRequest,
  MentorshipSession,
  OfflineMutation,
  PeerEndorsement,
  SkillCapability,
  SprintCollaborationNote,
  SprintDiscussionPost,
  SprintFeedback,
} from '../types/kora';
import {
  buildComplianceReceiptPdfBytes,
  buildPlainTextPdfBytes,
  buildSdgImpactSummaryPdfBytes,
  buildSprintReportPdfBytes,
  formatPayoutReceiptId,
  formatSdgImpactReportId,
} from './pdfReceipt';
import {
  parseMarkdownBlocks,
  parseMarkdownInline,
  sanitizeMarkdownLinkUrl,
} from './markdown';
import {
  buildRecentActivityTimeline,
  computeVirtualWindow,
} from '../components/RecentActivityFeed';
import { computeImpactMilestones } from '../components/ImpactMilestones';
import {
  buildImpactPulseHistoryCsv,
  buildImpactPulseSeries,
  buildYearInReviewHeatmap,
} from '../components/ImpactPulseAnalytics';
import {
  buildMentorshipTrackImpactMetrics,
  buildMentorshipVelocityMetrics,
  buildSixMonthMentorshipCorrelation,
} from '../components/MentorshipImpactChart';
import {
  buildMentorAvailabilityHeatmap,
  formatResponseMinutes,
} from '../components/MentorAvailabilityHeatmap';
import {
  MENTORSHIP_SUCCESS_STORIES,
  getMentorshipStoriesForTrack,
} from '../components/MentorshipSuccessStories';
import {
  END_SESSION_REASON_OPTIONS,
  getEndSessionAdvice,
} from '../components/EndSessionPopover';
import { buildMentorOpenSlots } from '../components/MentorshipAvailabilityScheduler';
import { computeMentorshipTrackProgress } from '../components/MentorshipProgressBar';
import {
  MENTOR_RATING_LABELS,
  computeMentorRatingSummary,
  validateAndFormatMentorRating,
} from '../components/MentorRatingSystem';
import {
  getLearningObjectivesForTrack,
  toggleObjectiveCompletion,
} from '../components/MentorshipMilestoneTracker';
import { GLOSSARY_ENTRIES } from '../components/GlossaryModal';
import {
  buildSprintMilestoneTasks,
  filterSprintMilestoneTasks,
  getMentorshipPathSummary,
  getMilestoneStatusExplanation,
  getSprintMilestoneFilterCounts,
} from '../components/SprintMilestoneChecklist';
import { computeSprintReminders } from '../components/SprintReminders';
import {
  buildExpandedSprintSummary,
  buildShareableSprintSnapshot,
  buildSprintDeepLink,
  buildSprintJourneyTimeline,
  buildSprintMentorDraftContext,
} from '../components/ExpandedSprintDetails';
import { validateAndFormatPractitionerFeedback } from '../components/SprintFeedbackModal';
import {
  buildMonthCalendarGrid,
  buildSprintCalendarEvents,
} from '../components/SprintCalendar';
import {
  buildMentorshipSessionSummaryText,
  resolveRealtimeMentorAvailability,
} from '../components/MentorMessagingDrawer';
import {
  computeMenteeRubricEvaluation,
  filterAndSortJournalEntries,
  validateAndFormatJournalEntry,
} from '../components/MentorshipJournal';
import {
  buildDefaultPodDiscussionsForSprint,
  buildSprintDiscussionThreads,
  sanitizeDiscussionResourceUrl,
} from '../components/SprintDiscussionBoard';
import {
  DOMAIN_SKILL_BADGE_CATALOG,
  buildEligibleSprintsForEndorsement,
  computeEarnedBadgeSummary,
  generateBadgeVerificationCode,
  normalizeBadgeStudioDomain,
  validateAndFormatMenteeBadge,
} from '../components/MenteeCompetencyEndorsement';
import {
  PROJECT_MILESTONE_CATALOG,
  computeMilestoneFeedbackLoopSummary,
  formatMilestoneFeedbackForChat,
  validateAndFormatMilestoneFeedback,
} from '../components/MentorDashboardFeedback';
import {
  buildPairingHistoryTimeline,
  computePairingHistorySummary,
  findContributionForPairing,
  matchCollaborationNotesForPairing,
} from '../components/MentorshipPairingHistory';
import {
  computeSessionAgendaProgress,
  formatSessionAgendaForChat,
  toggleAgendaItemCompletion,
  validateAndFormatSessionAgenda,
} from '../components/MentorshipSessionAgenda';
import { TRANSLATIONS } from './i18n';

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

test('Living Proof Portfolio generates local & remote readiness scores and increments SDGs 8, 10 & 17', () => {
  assert.equal(SKILL_TRACK_OPTIONS.length, 5);
  const initialPortfolio = createInitialLivingProofPortfolio();
  assert.equal(initialPortfolio.skillTrackId, 'trades-solar');
  assert.equal(countWorkplaceSignals(initialPortfolio.workplaceSignals), 0);

  const signals = {
    clearTimelines: true,
    qualitySafetyCheck: true,
    clientCommunication: true,
  };
  assert.equal(countWorkplaceSignals(signals), 3);

  const solarAnalysis = buildOfflineLivingProofAnalysis({
    skillTrackId: 'trades-solar',
    imageCount: 2,
    problemSolvedCaption: 'Wired 48V solar inverter and labeled DC breakers at 52.4V.',
    voiceWalkthrough: 'Verified load balance and surge protection for rural clinic.',
    peerVouch: 'Confirmed by clinic supervisor Fatima',
    workplaceSignals: signals,
  });
  assert.equal(solarAnalysis.visualHighlights.length, 3);
  assert.ok(solarAnalysis.localReadinessPct > solarAnalysis.remoteReadinessPct);
  assert.ok(solarAnalysis.localReadinessPct >= 90);

  const digitalAnalysis = buildOfflineLivingProofAnalysis({
    skillTrackId: 'digital-code',
    imageCount: 1,
    problemSolvedCaption: 'Built offline conflict-resolver module for clinic tablets.',
    voiceWalkthrough: 'Added unit tests and retry queue deduplication.',
    peerVouch: '',
    workplaceSignals: signals,
  });
  assert.ok(digitalAnalysis.remoteReadinessPct > digitalAnalysis.localReadinessPct);

  const profile = createInitialProfile({ ageStage: '30-45', onboarded: true });
  const baseVault = createInitialVault('u1');
  const proofVault = {
    ...baseVault,
    proofPortfolioReady: true,
    proofSkillTrack: 'trades-solar' as const,
    proofLocalScore: solarAnalysis.localReadinessPct,
    proofRemoteScore: solarAnalysis.remoteReadinessPct,
    workplaceSignalsCount: 3,
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
    vault: proofVault,
    payouts: [],
    contributions: [],
  });

  for (const sdgNum of [8, 10, 17] as const) {
    const beforeCard = sdgBefore.find((m) => m.sdgNumber === sdgNum)!;
    const afterCard = sdgAfter.find((m) => m.sdgNumber === sdgNum)!;
    assert.ok(
      afterCard.numericValue > beforeCard.numericValue,
      `Expected SDG ${sdgNum} to increment (${beforeCard.numericValue} -> ${afterCard.numericValue})`
    );
  }
});

test('interactive Sprint Milestone progress bar toggles Analysis Complete, Draft Ready, and Final Submission cleanly', () => {
  assert.equal(SPRINT_MILESTONE_STEPS.length, 3);
  assert.deepEqual(
    SPRINT_MILESTONE_STEPS.map((s) => s.label),
    ['Analysis Complete', 'Draft Ready', 'Final Submission']
  );

  let milestones = normalizeSprintMilestones(undefined, false);
  assert.deepEqual(milestones, []);
  assert.equal(getSprintMilestoneProgress(milestones, false).completedCount, 0);
  assert.equal(getSprintMilestoneProgress(milestones, false).percentage, 0);

  milestones = toggleSprintMilestoneList(milestones, 'analysis-complete');
  assert.deepEqual(milestones, ['analysis-complete']);
  assert.equal(getSprintMilestoneProgress(milestones, false).completedCount, 1);
  assert.equal(getSprintMilestoneProgress(milestones, false).percentage, 33);

  milestones = toggleSprintMilestoneList(milestones, 'draft-ready');
  assert.deepEqual(milestones, ['analysis-complete', 'draft-ready']);
  assert.equal(getSprintMilestoneProgress(milestones, false).completedCount, 2);
  assert.equal(getSprintMilestoneProgress(milestones, false).percentage, 67);

  milestones = toggleSprintMilestoneList(milestones, 'final-submission');
  assert.deepEqual(milestones, ['analysis-complete', 'draft-ready', 'final-submission']);
  assert.equal(getSprintMilestoneProgress(milestones, false).completedCount, 3);
  assert.equal(getSprintMilestoneProgress(milestones, false).percentage, 100);

  // Unchecking Draft Ready preserves canonical order of remaining milestones
  milestones = toggleSprintMilestoneList(milestones, 'draft-ready');
  assert.deepEqual(milestones, ['analysis-complete', 'final-submission']);

  // Completed sprint submissions always report 3/3 (100%)
  const completedProgress = getSprintMilestoneProgress([], true);
  assert.equal(completedProgress.completedCount, 3);
  assert.equal(completedProgress.percentage, 100);
});

test('Matched Work & Cross-Age Solution Flows rank uploaded proof fit, filter work modes, and increment SDG 8 & SDG 17', () => {
  assert.equal(MATCHED_WORK_OPPORTUNITIES.length, 5);

  const profile = createInitialProfile({
    ageStage: '30-45',
    problemStatement: '48V solar inverter diagnostics and battery balancing',
    onboarded: true,
  });
  const baseVault = createInitialVault('u1');
  const clearedVault = {
    ...baseVault,
    identityCompleted: true,
    contractCompleted: true,
    payoutCompleted: true,
  };
  assert.equal(isComplianceClearedForWork(baseVault), false);
  assert.equal(isComplianceClearedForWork(clearedVault), true);

  const basePortfolio = createInitialLivingProofPortfolio();
  const portfolio = {
    ...basePortfolio,
    analysis: buildOfflineLivingProofAnalysis({
      skillTrackId: 'trades-solar',
      imageCount: 2,
      problemSolvedCaption: 'Wired 48V solar inverter and labeled DC breakers at 52.4V.',
      voiceWalkthrough: 'Verified load balance and surge protection for rural clinic.',
      peerVouch: 'Confirmed by clinic supervisor Fatima',
      workplaceSignals: {
        clearTimelines: true,
        qualitySafetyCheck: true,
        clientCommunication: true,
      },
    }),
  };
  const ranked = rankMatchedWorkOpportunities({
    profile,
    portfolio,
    vault: clearedVault,
    passport: samplePassport,
  });

  assert.equal(ranked.length, 5);
  assert.equal(ranked[0].id, 'opp-solar-diagnostics-01');
  assert.equal(ranked[0].isStrongFit, true);
  assert.equal(ranked[0].fitReasonLabel, 'Strong Fit — Aligned with Your Uploaded Proof');
  assert.equal(ranked[0].preClearedToContract, true);
  assert.equal(ranked[0].userPodSeat, 'lead');

  assert.equal(filterMatchedWorkOpportunities(ranked, 'all').length, 5);
  assert.equal(filterMatchedWorkOpportunities(ranked, 'local').length, 3);
  assert.equal(filterMatchedWorkOpportunities(ranked, 'remote').length, 2);
  assert.equal(filterMatchedWorkOpportunities(ranked, 'fellowship').length, 3);

  const sdgBefore = computeSdgPulseMetrics({
    profile,
    capabilities: [sampleCap],
    passport: samplePassport,
    endorsements: [],
    vault: clearedVault,
    payouts: [],
    contributions: [],
  });

  const appliedVault = {
    ...clearedVault,
    matchedWorkCount: 1,
    appliedOpportunityIds: ['match-solar-diag-01'],
  };

  const sdgAfter = computeSdgPulseMetrics({
    profile,
    capabilities: [sampleCap],
    passport: samplePassport,
    endorsements: [],
    vault: appliedVault,
    payouts: [],
    contributions: [],
  });

  const sdg8Before = sdgBefore.find((m) => m.sdgNumber === 8)!;
  const sdg8After = sdgAfter.find((m) => m.sdgNumber === 8)!;
  const sdg17Before = sdgBefore.find((m) => m.sdgNumber === 17)!;
  const sdg17After = sdgAfter.find((m) => m.sdgNumber === 17)!;

  assert.ok(sdg8After.numericValue > sdg8Before.numericValue);
  assert.ok(sdg17After.numericValue > sdg17Before.numericValue);
});

test('Job-to-Fit Upskilling Bridge detects 65%-90% fit roles, outputs UNESCO UQP & ILO RPL options, and increments SDG 4 & SDG 10', () => {
  const profile = createInitialProfile({
    ageStage: '30-45',
    problemStatement: '48V solar inverter diagnostics and battery balancing',
    onboarded: true,
  });
  const baseVault = createInitialVault('u1');
  const portfolio = createInitialLivingProofPortfolio();

  const ranked = rankMatchedWorkOpportunities({
    profile,
    portfolio,
    vault: baseVault,
    passport: samplePassport,
  });

  // Opportunities in 65%–90% fit range activate the Demand-First Upskilling Bridge
  const bridgeFits = ranked.filter((o) => o.isUpskillingBridgeFit);
  assert.ok(bridgeFits.length >= 3, 'Expected multiple opportunities to fall in the 65%-90% fit range');
  for (const opp of bridgeFits) {
    assert.ok(opp.matchScore >= 65 && opp.matchScore <= 90);
  }

  for (const opp of MATCHED_WORK_OPPORTUNITIES) {
    const bridge = buildPreseededUpskillingBridge({
      opportunity: opp,
      portfolio,
      profile,
      passport: samplePassport,
    });
    assert.equal(bridge.opportunityId, opp.id);
    assert.equal(bridge.whatYouAlreadyProve.length, 2);
    assert.ok(bridge.singleMissingBridge.skillTitle.length >= 4);
    assert.ok(bridge.singleMissingBridge.frameworkTag.includes('UNESCO UQP'));
    assert.ok(bridge.singleMissingBridge.frameworkTag.includes('ILO RPL'));
    assert.equal(
      bridge.optionAMicroBridge.stipendPillLabel,
      'Partner Fee-Waiver / Stipend Eligible'
    );
    assert.ok(bridge.optionBApprenticeshipPod.mentorPairingLabel.includes('30–46+'));
    assert.ok(bridge.optionBApprenticeshipPod.cohesionNote.includes('RPL credits'));
    assert.equal(bridge.optionBApprenticeshipPod.paidApprenticeStipendUsd, opp.payoutUsd);
  }

  const sdgBefore = computeSdgPulseMetrics({
    profile,
    capabilities: [sampleCap],
    passport: samplePassport,
    endorsements: [],
    vault: baseVault,
    payouts: [],
    contributions: [],
  });

  const bridgeLockedVault = {
    ...baseVault,
    upskillingBridgesCount: 1,
    lockedBridgeOpportunityIds: ['opp-sme-bookkeeping-02'],
  };

  const sdgAfter = computeSdgPulseMetrics({
    profile,
    capabilities: [sampleCap],
    passport: samplePassport,
    endorsements: [],
    vault: bridgeLockedVault,
    payouts: [],
    contributions: [],
  });

  const sdg4Before = sdgBefore.find((m) => m.sdgNumber === 4)!;
  const sdg4After = sdgAfter.find((m) => m.sdgNumber === 4)!;
  const sdg10Before = sdgBefore.find((m) => m.sdgNumber === 10)!;
  const sdg10After = sdgAfter.find((m) => m.sdgNumber === 10)!;

  assert.equal(sdg4After.numericValue - sdg4Before.numericValue, 2);
  assert.ok(sdg4After.microStory.includes('Target 4.4'));
  assert.equal(sdg10After.numericValue - sdg10Before.numericValue, 2);
  assert.ok(sdg10After.microStory.includes('Target 10.2'));
});

test('Tab 4 Pulse UN 2030 Agenda target tags, Knowledge-to-Work Flow stages, and Age & Cohesion Breakdown align with UQP and ILO PROSPECTS', () => {
  const profile = createInitialProfile({
    ageStage: '18-29',
    problemStatement: 'Solar inverter diagnostics and mobile sync',
    onboarded: true,
  });
  const vault = {
    ...createInitialVault('u1'),
    proofLocalScore: 90,
    proofRemoteScore: 84,
    upskillingBridgesCount: 1,
    matchedWorkCount: 1,
  };

  const inputs = {
    profile,
    capabilities: [sampleCap],
    passport: samplePassport,
    endorsements: [],
    vault,
    payouts: [],
    contributions: [],
  };

  const sdgMetrics = computeSdgPulseMetrics(inputs);
  assert.equal(sdgMetrics.length, 5);
  assert.equal(sdgMetrics[0].unTargetTag, 'Targets 4.4 & 4.5 — Quality Upskilling');
  assert.equal(sdgMetrics[1].unTargetTag, 'Targets 8.5, 8.8 & 8.10 — Decent Work');
  assert.equal(sdgMetrics[2].unTargetTag, 'Targets 10.2 & 10.7 — Reduced Inequalities');
  assert.equal(sdgMetrics[3].unTargetTag, 'Targets 16.6 & 16.9 — Strong Institutions');
  assert.equal(sdgMetrics[4].unTargetTag, 'Target 17.17 — Partnerships');

  const flow = computeKnowledgeToWorkFlow(inputs);
  assert.deepEqual(
    flow.map((s) => s.label),
    [
      'Paperless Intake',
      'Verified Passport',
      'Compliance Cleared',
      'Upskilling Bridge / Paid Placement',
    ]
  );

  const breakdown = computeAgeAndCohesionBreakdown(inputs);
  assert.equal(breakdown.youth15To29Pct + breakdown.specialist30To46PlusPct, 100);
  assert.equal(breakdown.localWorkPct + breakdown.remoteWorkPct, 100);
  assert.equal(breakdown.activeAgeStage, '18-29');
  assert.ok(breakdown.activeAgeGroupLabel.includes('Youth Builder'));
  assert.ok(breakdown.cohesionPodsCount >= 20);
});

import {
  DeterministicComplianceCache,
  TokenBucketRateLimiter,
  VisionCircuitBreaker,
  enforceRefugeePrivacyGuard,
  partnerScaleStore,
  signCompetencyPassport,
} from './serverArchitecture';

test('serverArchitecture: signCompetencyPassport produces deterministic VNA-2026-XXXX verifiable ID and HMAC-SHA256 signature', () => {
  const signed = signCompetencyPassport(
    {
      summary: 'Verified off-grid solar inverter diagnostic specialist.',
      capabilities: [{ name: 'Solar PV Balancing' }, { name: 'DC Breaker Isolation' }],
    },
    'Green Energy',
    '30-45'
  );

  assert.ok(signed.verifiableId.startsWith('VNA-2026-'));
  assert.ok(signed.signature.startsWith('hmac-sha256:'));
  assert.equal(signed.privacyMode, 'ZERO_RAW_ID_PII_SEPARATED');
});

test('serverArchitecture: DeterministicComplianceCache serves repeated country + docTier + workMode lookups in <30ms', () => {
  const cache = new DeterministicComplianceCache<{ accessTier: string }>(24 * 60 * 60 * 1000);
  const miss = cache.get('Kenya', 'refugee-id', 'cross-border-remote');
  assert.equal(miss.hit, false);

  cache.set('Kenya', 'refugee-id', 'cross-border-remote', { accessTier: 'Enabling' });

  const startMs = Date.now();
  const hit = cache.get('kenya', 'REFUGEE-ID', 'cross-border-remote');
  const elapsedMs = Date.now() - startMs;

  assert.equal(hit.hit, true);
  assert.equal(hit.value?.accessTier, 'Enabling');
  assert.ok(elapsedMs < 30);
  assert.equal(cache.getStats().hits, 1);
});

test('serverArchitecture: enforceRefugeePrivacyGuard strips raw ID numbers and issues VNA-CONSENT-XXXX token', () => {
  const guarded = enforceRefugeePrivacyGuard({
    displayName: 'Amina Hassan',
    nationalId: 'AB12345678',
    responseText: 'My raw serial is KRA98765432 and I wired a 48V solar array.',
  });

  assert.equal(guarded.zeroRawIdEnforced, true);
  assert.ok(guarded.consentToken.startsWith('VNA-CONSENT-'));
  assert.equal(guarded.sanitizedPayload.nationalId, '[REDACTED_ZERO_RAW_ID_POLICY]');
  assert.ok(
    String(guarded.sanitizedPayload.responseText).includes('[TIER_VERIFIED_ID_REDACTED]')
  );
  assert.ok(guarded.strippedPiiFieldsCount >= 2);
});

test('serverArchitecture: VisionCircuitBreaker trips cleanly to grounded fallback on timeout or upstream error', async () => {
  const breaker = new VisionCircuitBreaker(50);

  const tripped = await breaker.execute(
    async () => {
      await new Promise((resolve) => setTimeout(resolve, 120));
      return { source: 'ai' };
    },
    (reason) => ({ source: 'fallback', reason })
  );

  assert.equal(tripped.trippedFallback, true);
  assert.equal((tripped.result as { source: string }).source, 'fallback');
  assert.equal(breaker.getMetrics().fallbackTrips, 1);
});

test('serverArchitecture: TokenBucketRateLimiter and partnerScaleStore cohort provisioner & email vault work reliably', () => {
  const limiter = new TokenBucketRateLimiter(2, 1);
  assert.equal(limiter.consume('ip-1').allowed, true);
  assert.equal(limiter.consume('ip-1').allowed, true);
  const throttled = limiter.consume('ip-1');
  assert.equal(throttled.allowed, false);
  assert.ok(throttled.retryAfterSeconds >= 1);

  const cohort = partnerScaleStore.provisionCohort({
    regionId: 'uganda',
    sectorId: 'climate_agri',
    languageCode: 'sw',
    cohortSize: 150,
  });
  assert.ok(cohort.cohortId.startsWith('COHORT-UG-'));

  const vaultRecord = partnerScaleStore.saveEmailVault({
    email: 'Practitioner@Hotmail.com',
    displayName: 'Omar Farouk',
    provider: 'microsoft',
    payload: { passportId: 'VNA-2026-TEST' },
  });
  assert.equal(vaultRecord.normalizedEmail, 'practitioner@hotmail.com');
  assert.equal(vaultRecord.zeroRawIdProtected, true);
  assert.ok(partnerScaleStore.getEmailVault('practitioner@hotmail.com') !== null);
});

test('Tab 1 [Verify] Adaptive 3-Route Verification Router, 4-Tier Trust Indicator, and SDG 4 Stipend Trigger work end-to-end', () => {
  assert.equal(ADAPTIVE_VERIFICATION_ROUTES.length, 3);
  assert.equal(getRecommendedVerifyRoute('30-45'), 'route-a-foreign');
  assert.equal(getRecommendedVerifyRoute('46+'), 'route-b-uqp');
  assert.equal(getRecommendedVerifyRoute('18-29'), 'route-c-rpl');
  assert.equal(getRecommendedVerifyRoute('15-17'), 'route-c-rpl');

  const routeAPassport = buildAdaptiveCompetencyPassportFallback({
    ownerUid: 'u1',
    displayName: 'Eng. Tariq Al-Mansoor',
    ageStage: '30-45',
    studioDomain: 'Green Energy',
    verificationRoute: 'route-a-foreign',
    responseText: FOREIGN_CIVIL_TRANSCRIPT_SAMPLE.responseText,
    evidenceSummary: FOREIGN_CIVIL_TRANSCRIPT_SAMPLE.evidenceSummary,
    verifiableId: 'VNA-2026-8412',
  });

  assert.equal(routeAPassport.verifiableId, 'VNA-2026-8412');
  assert.ok(routeAPassport.nqfEquivalencyLevel?.includes('NQF Level 6'));
  assert.ok((routeAPassport.workplaceSkills?.length ?? 0) >= 3);
  assert.equal(routeAPassport.microBridge.estimatedCostUsd, 75);
  assert.ok(routeAPassport.microBridge.secondaryModule);

  const tier1 = computePassportTrustTier({
    passport: routeAPassport,
    capabilities: [],
    endorsements: [],
    contributions: [],
  });
  assert.equal(tier1.activeTier, 1);

  const tier3 = computePassportTrustTier({
    passport: routeAPassport,
    capabilities: [sampleCap],
    endorsements: [],
    contributions: [
      {
        id: 'c1',
        ownerUid: 'u1',
        briefId: 'brief-coldchain-03',
        briefTitle: 'Solar-Direct Cold-Chain Compressor Retrofit Plan',
        domain: 'Green Energy',
        status: 'completed',
        solutionNotes: 'Done',
        hoursLogged: 5,
        payoutUsd: 350,
        createdAtIso: '2026-11-24T00:00:00Z',
        updatedAtIso: '2026-11-24T00:00:00Z',
      },
    ],
  });
  assert.equal(tier3.activeTier, 3);

  const profile = createInitialProfile({ ageStage: '30-45', onboarded: true });
  const vault = createInitialVault('u1');
  const sdgBeforeStipend = computeSdgPulseMetrics({
    profile,
    capabilities: [sampleCap],
    passport: routeAPassport,
    endorsements: [],
    vault,
    payouts: [],
    contributions: [],
  }).find((m) => m.sdgNumber === 4)!;

  const sdgAfterStipend = computeSdgPulseMetrics({
    profile,
    capabilities: [sampleCap],
    passport: { ...routeAPassport, stipendEligible: true },
    endorsements: [],
    vault,
    payouts: [],
    contributions: [],
  }).find((m) => m.sdgNumber === 4)!;

  assert.equal(sdgAfterStipend.numericValue - sdgBeforeStipend.numericValue, 1);
  assert.ok(sdgAfterStipend.microStory.includes('Stipend Pre-Approved'));
});

test('SDG Impact Summary PDF exporter emits valid %PDF-1.4 bytes with verified builders and stipends earned', () => {
  const reportId = formatSdgImpactReportId('Amira Hassan', '2026-11-25T10:00:00Z');
  assert.equal(reportId, 'VNA-SDG-20261125-AMIRAH');

  const pdfBytes = buildSdgImpactSummaryPdfBytes({
    practitionerName: 'Amira Hassan',
    ageStage: '30-45',
    verifiablePassportId: 'VNA-2026-8412',
    generatedAtIso: '2026-11-25T10:00:00Z',
    totalVerifiedBuilders: 468,
    stageBreakdown: [
      { stage: '1. Verify', count: 150, sdg: 'SDG 4' },
      { stage: '2. Unlock', count: 113, sdg: 'SDG 16' },
      { stage: '3. Solve', count: 90, sdg: 'SDG 8' },
      { stage: '4. Pulse', count: 74, sdg: 'SDG 17' },
      { stage: '5. Cleared', count: 41, sdg: 'SDG 10' },
    ],
    activeSprintsTotal: 6,
    userActiveSprints: 1,
    userCompletedSprints: 2,
    stipendsEarnedUsd: 820,
    totalDisbursedStipendsUsd: 15320,
    escrowPipelineUsd: 5150,
    verifiedCapabilitiesCount: 4,
    verifiedHoursLogged: 28,
    pulseStory: 'Amira verified four solar engineering competencies and delivered two clinic microgrid sprints.',
    sdgMetrics: [
      {
        sdgLabel: 'SDG 4',
        unTargetTag: 'Targets 4.4 & 4.5 - Quality Upskilling',
        title: 'Verified Skills & Learning',
        primaryValue: '150',
        metricCaption: 'Field-verified skills',
      },
      {
        sdgLabel: 'SDG 8',
        unTargetTag: 'Targets 8.5, 8.8 & 8.10 - Decent Work',
        title: 'Paid Solution Sprints',
        primaryValue: '$820',
        metricCaption: 'Released stipends earned',
      },
    ],
  });

  const pdfText = new TextDecoder().decode(pdfBytes);
  assert.ok(pdfText.startsWith('%PDF-1.4\n'));
  assert.ok(pdfText.includes('%%EOF'));
  assert.ok(pdfText.includes('SDG IMPACT SUMMARY REPORT'));
  assert.ok(pdfText.includes('VNA-SDG-20261125-AMIRAH'));
  assert.ok(pdfText.includes('Total Verified Builders \\(5 Crossing Stages\\): 468'));
  assert.ok(pdfText.includes('Stipends Earned \\(Builder\\): $820 USD'));
  assert.ok(pdfText.includes('Total Disbursed Stipends \\(Platform\\): $15,320 USD'));
  assert.ok(pdfText.includes('SDG 4'));
  assert.ok(pdfText.includes('SDG 8'));
});

test('RecentActivityFeed timeline chronologically orders sprint completions, capability updates, and endorsement receipts', () => {
  const timeline = buildRecentActivityTimeline({
    capabilities: [
      {
        ...sampleCap,
        id: 'cap-recent',
        title: '48V Microgrid Inverter Repair',
        verificationStatus: 'field-verified',
        updatedAtIso: '2026-11-24T12:00:00Z',
      },
    ],
    contributions: [
      {
        id: 'sub-done',
        ownerUid: 'u1',
        briefId: 'brief-solar-01',
        briefTitle: 'Rural Clinic Cold-Chain Audit',
        domain: 'Green Energy',
        status: 'completed',
        solutionNotes: 'Completed clinic cold-chain load calibration and handover brief.',
        hoursLogged: 14,
        payoutUsd: 420,
        createdAtIso: '2026-11-20T09:00:00Z',
        updatedAtIso: '2026-11-25T08:00:00Z',
        milestonesDone: ['analysis-complete', 'final-submission'],
      },
    ],
    passport: null,
    vault: {
      ...createInitialVault('u1'),
      identityCompleted: false,
      contractCompleted: false,
      payoutCompleted: false,
      updatedAtIso: '2026-11-20T08:00:00Z',
    },
    endorsements: [
      {
        id: 'end-1',
        ownerUid: 'u1',
        capabilityTitle: '48V Microgrid Inverter Repair',
        collaboratorName: 'Dr. Samuel Ochieng',
        collaboratorRole: 'Senior Energy Assessor',
        organization: 'Rift Valley Energy Guild',
        endorsementText: 'Calibrated three inverter banks under load.',
        status: 'verified',
        shareToken: 'vna-end-1',
        sourceTab: 'verify',
        createdAtIso: '2026-11-24T18:00:00Z',
        updatedAtIso: '2026-11-24T18:00:00Z',
      },
    ],
    payouts: [],
  });

  const kinds = new Set(timeline.map((item) => item.kind));
  assert.ok(kinds.has('sprint'));
  assert.ok(kinds.has('capability'));
  assert.ok(kinds.has('endorsement'));

  // Most recent event (Nov 25 08:00) must appear first, followed by Nov 24 18:00 endorsement, then Nov 24 12:00 capability
  assert.equal(timeline[0].kind, 'sprint');
  assert.ok(timeline[0].title.includes('Sprint Completed'));
  const endorsementIdx = timeline.findIndex((i) => i.kind === 'endorsement');
  const capabilityIdx = timeline.findIndex((i) => i.kind === 'capability');
  assert.ok(endorsementIdx > 0 && capabilityIdx > endorsementIdx);
});

test('ImpactMilestones tracks empty, in-progress, and completed states for First Verification, First Sprint Completion, and First Payout', () => {
  const emptyVault = {
    ...createInitialVault('u1'),
    identityCompleted: false,
    contractCompleted: false,
    payoutCompleted: false,
    financialIdentityCleared: false,
    financialRailTested: false,
    financialTaxCleared: false,
  };
  const emptySummary = computeImpactMilestones({
    capabilities: [],
    contributions: [],
    passport: null,
    vault: emptyVault,
    endorsements: [],
    payouts: [],
  });
  assert.equal(emptySummary.totalCount, 3);
  assert.equal(emptySummary.completedCount, 0);
  assert.equal(emptySummary.overallProgressPct, 0);
  assert.equal(emptySummary.nextMilestoneId, 'first-verification');
  assert.deepEqual(
    emptySummary.milestones.map((m) => m.title),
    ['First Verification', 'First Sprint Completion', 'First Payout']
  );

  // In-progress state across all three milestones
  const inProgressSummary = computeImpactMilestones({
    capabilities: [
      {
        ...sampleCap,
        id: 'cap-pending',
        verificationStatus: 'pending',
      },
    ],
    contributions: [
      {
        id: 'sub-active',
        ownerUid: 'u1',
        briefId: 'brief-solar-01',
        briefTitle: 'Clinic Solar Sizing',
        domain: 'Green Energy',
        status: 'in-progress',
        solutionNotes: 'Drafting inverter layout',
        hoursLogged: 4,
        payoutUsd: 300,
        createdAtIso: '2026-11-24T09:00:00Z',
        updatedAtIso: '2026-11-24T12:00:00Z',
        milestonesDone: ['analysis-complete'],
      },
    ],
    passport: null,
    vault: {
      ...emptyVault,
      payoutCompleted: true,
      payoutRail: 'mobile-money',
    },
    endorsements: [],
    payouts: [
      {
        id: 'pay-escrow',
        ownerUid: 'u1',
        sprintId: 'brief-solar-01',
        sprintTitle: 'Clinic Solar Sizing',
        partnerOrg: 'HarvestKeep Network',
        amountUsd: 300,
        payoutRail: 'mobile-money',
        status: 'escrow-held',
        createdAtIso: '2026-11-24T09:00:00Z',
        updatedAtIso: '2026-11-24T12:00:00Z',
      },
    ],
  });

  assert.equal(inProgressSummary.completedCount, 0);
  assert.equal(inProgressSummary.milestones[0].status, 'in-progress');
  assert.equal(inProgressSummary.milestones[0].progressPct, 50);
  assert.equal(inProgressSummary.milestones[1].status, 'in-progress');
  assert.ok(inProgressSummary.milestones[1].progressPct > 25 && inProgressSummary.milestones[1].progressPct < 100);
  assert.equal(inProgressSummary.milestones[2].status, 'in-progress');
  assert.equal(inProgressSummary.milestones[2].progressPct, 70);

  // Completed state for all three milestones
  const completedSummary = computeImpactMilestones({
    capabilities: [sampleCap],
    contributions: [
      {
        id: 'sub-complete',
        ownerUid: 'u1',
        briefId: 'brief-solar-01',
        briefTitle: 'Clinic Solar Sizing',
        domain: 'Green Energy',
        status: 'completed',
        solutionNotes: 'Delivered and signed off',
        hoursLogged: 10,
        payoutUsd: 420,
        createdAtIso: '2026-11-20T09:00:00Z',
        updatedAtIso: '2026-11-25T09:00:00Z',
      },
    ],
    passport: samplePassport,
    vault: {
      ...emptyVault,
      identityCompleted: true,
      contractCompleted: true,
      payoutCompleted: true,
    },
    endorsements: [],
    payouts: [
      {
        id: 'pay-released',
        ownerUid: 'u1',
        sprintId: 'brief-solar-01',
        sprintTitle: 'Clinic Solar Sizing',
        partnerOrg: 'HarvestKeep Network',
        amountUsd: 420,
        payoutRail: 'mobile-money',
        status: 'released',
        createdAtIso: '2026-11-20T09:00:00Z',
        updatedAtIso: '2026-11-25T10:00:00Z',
      },
    ],
  });

  assert.equal(completedSummary.completedCount, 3);
  assert.equal(completedSummary.overallProgressPct, 100);
  assert.equal(completedSummary.nextMilestoneId, null);
  for (const m of completedSummary.milestones) {
    assert.equal(m.status, 'completed');
    assert.equal(m.progressPct, 100);
  }
});

test('RecentActivityFeed virtual windowing preserves long histories (>100 events) and bounds rendered DOM rows accurately', () => {
  const manyCaps: SkillCapability[] = Array.from({ length: 120 }, (_, i) => ({
    ...sampleCap,
    id: `cap-bulk-${i}`,
    title: `Capability Record #${i + 1}`,
    updatedAtIso: new Date(Date.parse('2026-11-01T00:00:00Z') + i * 3_600_000).toISOString(),
  }));

  const fullTimeline = buildRecentActivityTimeline({
    capabilities: manyCaps,
    contributions: [],
    passport: null,
    vault: {
      ...createInitialVault('u1'),
      identityCompleted: false,
      contractCompleted: false,
      payoutCompleted: false,
    },
    endorsements: [],
    payouts: [],
  });
  assert.equal(fullTimeline.length, 120);
  assert.equal(fullTimeline[0].id, 'act-cap-cap-bulk-119');

  // Uniform desktop window at scrollTop = 0
  const topWindow = computeVirtualWindow({
    itemCount: fullTimeline.length,
    scrollTop: 0,
    viewportHeight: 420,
    estimatedItemHeight: 108,
    overscan: 5,
  });
  assert.equal(topWindow.startIndex, 0);
  assert.equal(topWindow.firstVisibleIndex, 0);
  assert.equal(topWindow.totalHeight, 120 * 108);
  assert.ok(topWindow.visibleRows.length <= 15, 'Should render only bounded visible + overscan rows');

  // Mid-list window with variable measured row heights (e.g. wrapped mobile items)
  const midWindow = computeVirtualWindow({
    itemCount: fullTimeline.length,
    scrollTop: 4200,
    viewportHeight: 380,
    estimatedItemHeight: 148,
    overscan: 4,
    getItemHeight: (idx) => (idx % 3 === 0 ? 180 : 120),
  });
  assert.ok(midWindow.startIndex > 10);
  assert.ok(midWindow.endIndex < 119);
  assert.equal(
    midWindow.visibleRows.length,
    midWindow.endIndex - midWindow.startIndex + 1
  );
  // Verify offsets are strictly monotonic and match row heights
  for (let i = 1; i < midWindow.visibleRows.length; i++) {
    const prev = midWindow.visibleRows[i - 1];
    const curr = midWindow.visibleRows[i];
    assert.equal(curr.offsetTop, prev.offsetTop + prev.height);
  }
});

test('ImpactPulseAnalytics computes chronological payout trends, hours logged, and milestone velocity from sprint history', () => {
  const emptySeries = buildImpactPulseSeries({
    contributions: [],
    payouts: [],
  });
  assert.equal(emptySeries.points.length, 0);
  assert.equal(emptySeries.totalPayoutUsd, 0);
  assert.equal(emptySeries.totalHoursLogged, 0);

  const series = buildImpactPulseSeries({
    contributions: [
      {
        id: 'c-s1',
        ownerUid: 'u1',
        briefId: 'sprint-solar-01',
        briefTitle: 'Solar Cold-Chain Diagnostics',
        domain: 'Green Energy',
        status: 'completed',
        solutionNotes: 'Verified 48V inverter bank.',
        hoursLogged: 12,
        payoutUsd: 400,
        createdAtIso: '2026-11-10T09:00:00Z',
        updatedAtIso: '2026-11-15T12:00:00Z',
        milestonesDone: ['analysis-complete', 'draft-ready', 'final-submission'],
      },
      {
        id: 'c-s2',
        ownerUid: 'u1',
        briefId: 'sprint-triage-02',
        briefTitle: 'Clinic Triage Sync',
        domain: 'Healthcare Ops',
        status: 'in-progress',
        solutionNotes: 'Drafting bilingual intake checks.',
        hoursLogged: 6.5,
        payoutUsd: 300,
        createdAtIso: '2026-11-20T09:00:00Z',
        updatedAtIso: '2026-11-22T15:00:00Z',
        milestonesDone: ['analysis-complete'],
      },
    ],
    payouts: [
      {
        id: 'p-s1',
        ownerUid: 'u1',
        sprintId: 'sprint-solar-01',
        sprintTitle: 'Solar Cold-Chain Diagnostics',
        partnerOrg: 'HarvestKeep',
        amountUsd: 400,
        payoutRail: 'mobile-money',
        status: 'released',
        createdAtIso: '2026-11-10T09:00:00Z',
        updatedAtIso: '2026-11-15T12:00:00Z',
      },
    ],
  });

  assert.equal(series.points.length, 2);
  assert.equal(series.points[0].label, 'S1');
  assert.equal(series.points[0].payoutUsd, 400);
  assert.equal(series.points[0].cumulativePayoutUsd, 400);
  assert.equal(series.points[0].hoursLogged, 12);
  assert.equal(series.points[0].milestoneVelocityPct, 100);

  assert.equal(series.points[1].label, 'S2');
  assert.equal(series.points[1].payoutUsd, 300);
  assert.equal(series.points[1].cumulativePayoutUsd, 700);
  assert.equal(series.points[1].hoursLogged, 6.5);
  assert.equal(series.points[1].milestoneVelocityPct, 33);

  assert.equal(series.totalPayoutUsd, 700);
  assert.equal(series.totalHoursLogged, 18.5);
  assert.equal(series.totalMilestonesCompleted, 4);
  assert.equal(series.averageVelocityPct, 67);
});

test('GlossaryModal includes Pod Sprint definition explaining its collaborative role in the Solve phase', () => {
  const podSprint = GLOSSARY_ENTRIES.find((item) => item.id === 'fw-pod-sprint');
  assert.ok(podSprint, 'Expected fw-pod-sprint GlossaryItem in GLOSSARY_ENTRIES');
  assert.equal(podSprint.term, 'Pod Sprint');
  assert.equal(podSprint.builderTab, 'solve');
  assert.ok(podSprint.definition.toLowerCase().includes('solve'));
  assert.ok(podSprint.definition.toLowerCase().includes('collaborative'));
});

test('SprintMilestoneChecklist dynamically builds task-based completion milestones for active pod sprints', () => {
  const ranked = rankSolutionSprints(
    createInitialProfile({ ageStage: '30-45', problemStatement: 'solar inverter' }),
    [sampleCap],
    samplePassport
  );
  const solarSprint = ranked.find((s) => s.id === 'sprint-solar-coldchain-01')!;

  const tasks = buildSprintMilestoneTasks({
    briefId: solarSprint.id,
    sprint: solarSprint,
    milestonesDone: ['analysis-complete'],
    isCompleted: false,
    checkedMap: {},
  });

  assert.equal(tasks.length, solarSprint.deliverableChecklist.length);
  assert.equal(tasks[0].phaseKey, 'analysis-complete');
  assert.equal(tasks[0].completed, true);
  assert.equal(tasks[1].phaseKey, 'draft-ready');
  assert.equal(tasks[1].completed, false);
  assert.equal(tasks[2].phaseKey, 'final-submission');
  assert.ok(tasks[0].ownerRoleLabel.includes('Lead'));
  assert.ok(tasks[0].guidance.includes(solarSprint.partnerOrg));
});

test('SprintReminders alerts on active sprints nearing deadline using sprintMilestonesByBrief phase status', () => {
  const nowMs = Date.parse('2026-11-25T12:00:00.000Z');
  const contributions: BriefSubmission[] = [
    {
      id: 'sub-urgent',
      ownerUid: 'user-1',
      briefId: 'sprint-solar-coldchain-01',
      briefTitle: 'Solar Cold-Chain Telemetry',
      domain: 'Green Energy',
      status: 'in-progress',
      solutionNotes: '',
      hoursLogged: 4,
      payoutUsd: 400,
      createdAtIso: '2026-11-20T12:00:00.000Z',
      updatedAtIso: '2026-11-24T12:00:00.000Z',
      deadlineIso: '2026-11-26T00:00:00.000Z', // 12h remaining -> urgent
    },
    {
      id: 'sub-approaching',
      ownerUid: 'user-1',
      briefId: 'sprint-clinic-triage-02',
      briefTitle: 'Clinic Triage Queue Sync',
      domain: 'Healthcare Ops',
      status: 'in-progress',
      solutionNotes: '',
      hoursLogged: 2,
      payoutUsd: 350,
      createdAtIso: '2026-11-21T12:00:00.000Z',
      updatedAtIso: '2026-11-24T12:00:00.000Z',
      deadlineIso: '2026-11-27T12:00:00.000Z', // 48h remaining -> approaching
    },
    {
      id: 'sub-distant',
      ownerUid: 'user-1',
      briefId: 'sprint-distant',
      briefTitle: 'Far Future Sprint',
      domain: 'Tech',
      status: 'in-progress',
      solutionNotes: '',
      hoursLogged: 1,
      payoutUsd: 200,
      createdAtIso: '2026-11-25T12:00:00.000Z',
      updatedAtIso: '2026-11-25T12:00:00.000Z',
      deadlineIso: '2026-12-05T12:00:00.000Z', // 240h remaining -> excluded (>72h)
    },
    {
      id: 'sub-done',
      ownerUid: 'user-1',
      briefId: 'sprint-done',
      briefTitle: 'Completed Sprint',
      domain: 'Tech',
      status: 'completed',
      solutionNotes: 'Done',
      hoursLogged: 10,
      payoutUsd: 500,
      createdAtIso: '2026-11-10T12:00:00.000Z',
      updatedAtIso: '2026-11-18T12:00:00.000Z',
      deadlineIso: '2026-11-25T15:00:00.000Z', // completed -> excluded
    },
  ];

  const reminders = computeSprintReminders({
    contributions,
    sprintMilestonesByBrief: {
      'sprint-solar-coldchain-01': ['analysis-complete', 'draft-ready'],
      'sprint-clinic-triage-02': [],
    },
    nowMs,
  });

  assert.equal(reminders.length, 2);
  assert.equal(reminders[0].briefId, 'sprint-solar-coldchain-01');
  assert.equal(reminders[0].urgency, 'urgent');
  assert.equal(reminders[0].hoursRemaining, 12);
  assert.equal(reminders[0].completedPhaseCount, 2);
  assert.ok(reminders[0].phaseStatusLabel.includes('Phase 2/3'));
  assert.ok(reminders[0].nextPhaseAction.includes('Final Submission'));

  assert.equal(reminders[1].briefId, 'sprint-clinic-triage-02');
  assert.equal(reminders[1].urgency, 'approaching');
  assert.equal(reminders[1].completedPhaseCount, 0);
  assert.equal(reminders[1].phaseStatusLabel, 'Phase 0/3 · Not Started');
});

test('ExpandedSprintDetails aggregates sprint feedback, mentor thread notes, and itemized payout breakdown', () => {
  const contribution: BriefSubmission = {
    id: 'contrib-exp-1',
    ownerUid: 'user-1',
    briefId: 'sprint-solar-coldchain-01',
    briefTitle: 'Solar Cold-Chain Telemetry',
    domain: 'Green Energy',
    status: 'completed',
    solutionNotes: 'Deployed telemetry nodes and verified battery voltage alerts.',
    hoursLogged: 10,
    payoutUsd: 400,
    createdAtIso: '2026-11-18T10:00:00.000Z',
    updatedAtIso: '2026-11-22T15:00:00.000Z',
    milestonesDone: ['analysis-complete', 'draft-ready', 'final-submission'],
  };

  const payouts: ContractPayout[] = [
    {
      id: 'payout-exp-1',
      ownerUid: 'user-1',
      sprintId: 'sprint-solar-coldchain-01',
      sprintTitle: 'Solar Cold-Chain Telemetry',
      partnerOrg: 'KaziGrid Clinics',
      amountUsd: 400,
      payoutRail: 'mobile-money',
      status: 'released',
      createdAtIso: '2026-11-22T16:00:00.000Z',
      updatedAtIso: '2026-11-22T16:05:00.000Z',
    },
  ];

  const feedback: SprintFeedback[] = [
    {
      id: 'fb-exp-1',
      ownerUid: 'user-1',
      contributionId: 'contrib-exp-1',
      briefId: 'sprint-solar-coldchain-01',
      briefTitle: 'Solar Cold-Chain Telemetry',
      partnerOrg: 'KaziGrid Clinics',
      reviewerName: 'Dr. Amina Noor',
      reviewerRole: 'Field Director',
      rating: 5,
      reviewText: 'Reliable inverter telemetry thresholds under clinic peak load.',
      createdAtIso: '2026-11-23T09:00:00.000Z',
      updatedAtIso: '2026-11-23T09:00:00.000Z',
    },
  ];

  const summary = buildExpandedSprintSummary({
    contribution,
    payouts,
    sprintFeedback: feedback,
    mentorMessages: [
      {
        id: 'msg-1',
        ownerUid: 'user-1',
        sprintId: 'sprint-solar-coldchain-01',
        sprintTitle: 'Solar Cold-Chain Telemetry',
        mentorId: 'mentor-green-energy',
        mentorName: 'Eng. Samuel Ochieng',
        sender: 'mentor',
        body: 'Voltage hysteresis checks look solid for sign-off.',
        createdAtIso: '2026-11-21T14:00:00.000Z',
        updatedAtIso: '2026-11-21T14:00:00.000Z',
      },
    ],
  });

  assert.equal(summary.partnerOrg, 'KaziGrid Clinics');
  assert.equal(summary.completedMilestones.length, 3);
  assert.equal(summary.feedbackEntries.length, 1);
  assert.equal(summary.feedbackEntries[0].rating, 5);
  assert.equal(summary.mentorThreadMessages.length, 1);
  assert.equal(summary.payoutBreakdown.grossStipendUsd, 400);
  assert.equal(summary.payoutBreakdown.platformFeeUsd, 0);
  assert.equal(summary.payoutBreakdown.netDisbursedUsd, 400);
  assert.equal(summary.payoutBreakdown.effectiveHourlyRateUsd, 40);
  assert.equal(summary.payoutBreakdown.payoutStatusLabel, 'Released to Practitioner');
  assert.equal(summary.payoutBreakdown.payoutRailLabel, 'Mobile Money');
  assert.ok(summary.payoutBreakdown.receiptReference?.startsWith('VNA-RCP-'));
});

test('ExpandedSprintDetails Share helpers generate valid deep-links, snapshots, and pre-populated mentor context', () => {
  const contribution: BriefSubmission = {
    id: 'contrib-share-1',
    ownerUid: 'user-1',
    briefId: 'sprint-solar-coldchain-01',
    briefTitle: 'Solar Cold-Chain & Telemetry <Audit>',
    domain: 'Green Energy',
    status: 'completed',
    solutionNotes: 'Installed inverter monitoring & logged battery health.',
    hoursLogged: 8,
    payoutUsd: 400,
    createdAtIso: '2026-11-18T10:00:00.000Z',
    updatedAtIso: '2026-11-22T15:00:00.000Z',
    milestonesDone: ['analysis-complete', 'draft-ready', 'final-submission'],
  };

  const summary = buildExpandedSprintSummary({
    contribution,
    payouts: [
      {
        id: 'pay-share-1',
        ownerUid: 'user-1',
        sprintId: 'sprint-solar-coldchain-01',
        sprintTitle: 'Solar Cold-Chain & Telemetry <Audit>',
        partnerOrg: 'KaziGrid Clinics',
        amountUsd: 400,
        payoutRail: 'mobile-money',
        status: 'released',
        createdAtIso: '2026-11-22T16:00:00.000Z',
        updatedAtIso: '2026-11-22T16:05:00.000Z',
      },
    ],
    sprintFeedback: [],
  });

  const deepLink = buildSprintDeepLink(
    'https://vuka-na-amana.app/',
    summary.briefId,
    summary.contributionId
  );
  assert.equal(
    deepLink,
    'https://vuka-na-amana.app/?tab=pulse&sprint=sprint-solar-coldchain-01&contribution=contrib-share-1'
  );

  const snapshot = buildShareableSprintSnapshot(
    summary,
    deepLink,
    '2026-11-25T19:20:00.000Z'
  );
  assert.ok(snapshot.textSummary.includes('Solar Cold-Chain & Telemetry <Audit>'));
  assert.ok(snapshot.textSummary.includes('KaziGrid Clinics'));
  assert.ok(snapshot.textSummary.includes('$400 USD net'));
  assert.ok(snapshot.textSummary.includes(deepLink));
  assert.ok(snapshot.svgMarkup.startsWith('<svg '));
  assert.ok(snapshot.svgMarkup.includes('&lt;Audit&gt;'));
  assert.ok(snapshot.filenameBase.startsWith('vuka-sprint-'));

  const mentorCtx = buildSprintMentorDraftContext(summary);
  assert.ok(mentorCtx.contextNote.includes('Completed'));
  assert.ok(mentorCtx.contextNote.includes('3/3 milestones'));
  assert.ok(mentorCtx.contextNote.includes('$400 USD'));
  assert.ok(mentorCtx.initialDraft.includes(summary.assignedMentor.name));
  assert.ok(mentorCtx.initialDraft.includes(summary.briefTitle));
});

test('ExpandedSprintDetails journey timeline maps Sprint Assigned to Escrow Released and generates printable PDF report bytes', () => {
  const inProgressContrib: BriefSubmission = {
    id: 'contrib-tl-1',
    ownerUid: 'user-1',
    briefId: 'sprint-solar-coldchain-01',
    briefTitle: 'Solar Cold-Chain Telemetry',
    domain: 'Green Energy',
    status: 'in-progress',
    solutionNotes: 'Baseline diagnostics logged.',
    hoursLogged: 4,
    payoutUsd: 400,
    createdAtIso: '2026-11-20T10:00:00.000Z',
    updatedAtIso: '2026-11-21T10:00:00.000Z',
    milestonesDone: ['analysis-complete'],
  };

  const inProgressSummary = buildExpandedSprintSummary({
    contribution: inProgressContrib,
    payouts: [],
    sprintFeedback: [],
  });
  const activeTimeline = buildSprintJourneyTimeline(inProgressContrib, inProgressSummary);
  assert.equal(activeTimeline.length, 5);
  assert.equal(activeTimeline[0].label, 'Sprint Assigned');
  assert.equal(activeTimeline[0].status, 'completed');
  assert.equal(activeTimeline[1].label, 'Analysis Complete');
  assert.equal(activeTimeline[1].status, 'completed');
  assert.equal(activeTimeline[2].label, 'Draft Ready');
  assert.equal(activeTimeline[2].status, 'current');
  assert.equal(activeTimeline[3].label, 'Final Submission');
  assert.equal(activeTimeline[3].status, 'upcoming');
  assert.equal(activeTimeline[4].label, 'Escrow Released');
  assert.equal(activeTimeline[4].status, 'upcoming');

  const releasedContrib: BriefSubmission = {
    ...inProgressContrib,
    status: 'completed',
    hoursLogged: 10,
    milestonesDone: ['analysis-complete', 'draft-ready', 'final-submission'],
  };
  const releasedSummary = buildExpandedSprintSummary({
    contribution: releasedContrib,
    payouts: [
      {
        id: 'pay-tl-1',
        ownerUid: 'user-1',
        sprintId: 'sprint-solar-coldchain-01',
        sprintTitle: 'Solar Cold-Chain Telemetry',
        partnerOrg: 'KaziGrid Clinics',
        amountUsd: 400,
        payoutRail: 'mobile-money',
        status: 'released',
        createdAtIso: '2026-11-22T15:00:00.000Z',
        updatedAtIso: '2026-11-22T16:00:00.000Z',
      },
    ],
    sprintFeedback: [
      {
        id: 'fb-tl-1',
        ownerUid: 'user-1',
        contributionId: 'contrib-tl-1',
        briefId: 'sprint-solar-coldchain-01',
        briefTitle: 'Solar Cold-Chain Telemetry',
        partnerOrg: 'KaziGrid Clinics',
        reviewerName: 'Dr. Amina Noor',
        reviewerRole: 'Field Director',
        rating: 5,
        reviewText: 'Clean field sign-off and accurate battery logs.',
        createdAtIso: '2026-11-23T09:00:00.000Z',
        updatedAtIso: '2026-11-23T09:00:00.000Z',
      },
    ],
  });
  const releasedTimeline = buildSprintJourneyTimeline(releasedContrib, releasedSummary);
  assert.equal(releasedTimeline.every((s) => s.status === 'completed'), true);
  assert.equal(releasedTimeline[4].label, 'Escrow Released');

  const pdfBytes = buildSprintReportPdfBytes({
    practitionerName: 'Amina Hassan',
    briefId: releasedSummary.briefId,
    briefTitle: releasedSummary.briefTitle,
    partnerOrg: releasedSummary.partnerOrg,
    domain: releasedSummary.domain,
    status: releasedSummary.status,
    hoursLogged: releasedSummary.hoursLogged,
    completedMilestones: ['Analysis Complete', 'Draft Ready', 'Final Submission'],
    totalMilestones: 3,
    journeyStageLabel: 'Escrow Released',
    solutionNotes: releasedSummary.solutionNotes,
    assignedMentorName: releasedSummary.assignedMentor.name,
    assignedMentorRole: releasedSummary.assignedMentor.roleTitle,
    feedbackEntries: releasedSummary.feedbackEntries,
    grossStipendUsd: releasedSummary.payoutBreakdown.grossStipendUsd,
    platformFeeUsd: releasedSummary.payoutBreakdown.platformFeeUsd,
    netDisbursedUsd: releasedSummary.payoutBreakdown.netDisbursedUsd,
    effectiveHourlyRateUsd: releasedSummary.payoutBreakdown.effectiveHourlyRateUsd,
    payoutStatusLabel: releasedSummary.payoutBreakdown.payoutStatusLabel,
    payoutRailLabel: releasedSummary.payoutBreakdown.payoutRailLabel,
    receiptReference: releasedSummary.payoutBreakdown.receiptReference,
    updatedAtIso: releasedSummary.updatedAtIso,
  });

  const pdfText = new TextDecoder().decode(pdfBytes);
  assert.ok(pdfText.startsWith('%PDF-1.4'));
  assert.ok(pdfText.includes('SPRINT OUTCOME, MENTOR FEEDBACK & PAYOUT REPORT'));
  assert.ok(pdfText.includes('KaziGrid Clinics'));
  assert.ok(pdfText.includes('$400 USD'));
  assert.ok(pdfText.includes('Dr. Amina Noor'));
  assert.ok(pdfText.includes('%%EOF'));
});

test('SprintMilestoneChecklist assigns Completed, In Progress, Delayed, and Up Next status tags accurately', () => {
  const ranked = rankSolutionSprints(
    createInitialProfile({ ageStage: '30-45', problemStatement: 'solar inverter' }),
    [sampleCap],
    samplePassport
  );
  const solarSprint = ranked.find((s) => s.id === 'sprint-solar-coldchain-01')!;
  const nowMs = Date.parse('2026-11-25T12:00:00.000Z');

  // On-track sprint (72h remaining): 1st milestone completed -> 2nd In Progress -> 3rd Up Next
  const onTrackTasks = buildSprintMilestoneTasks({
    briefId: solarSprint.id,
    sprint: solarSprint,
    milestonesDone: ['analysis-complete'],
    isCompleted: false,
    checkedMap: {},
    deadlineIso: '2026-11-28T12:00:00.000Z',
    nowMs,
  });
  assert.equal(onTrackTasks[0].statusLabel, 'Completed');
  assert.equal(onTrackTasks[1].statusLabel, 'In Progress');
  assert.equal(onTrackTasks[2].statusLabel, 'Up Next');

  // Past-deadline sprint: incomplete milestones are flagged Delayed while completed ones stay Completed
  const delayedTasks = buildSprintMilestoneTasks({
    briefId: solarSprint.id,
    sprint: solarSprint,
    milestonesDone: ['analysis-complete'],
    isCompleted: false,
    checkedMap: {},
    deadlineIso: '2026-11-25T06:00:00.000Z',
    nowMs,
  });
  assert.equal(delayedTasks[0].statusLabel, 'Completed');
  assert.equal(delayedTasks[1].statusLabel, 'Delayed');
  assert.equal(delayedTasks[2].statusLabel, 'Delayed');
});

test('ImpactPulseAnalytics provides exact date labels for PayoutTrendsTooltip and SprintFeedbackModal validates qualitative feedback', () => {
  const series = buildImpactPulseSeries({
    contributions: [
      {
        id: 'contrib-tip-1',
        ownerUid: 'user-1',
        briefId: 'sprint-solar-coldchain-01',
        briefTitle: 'Solar Cold-Chain Telemetry',
        domain: 'Green Energy',
        status: 'completed',
        solutionNotes: 'Verified inverter alarms.',
        hoursLogged: 8,
        payoutUsd: 450,
        createdAtIso: '2026-11-10T10:00:00.000Z',
        updatedAtIso: '2026-11-15T14:30:00.000Z',
      },
    ],
    payouts: [],
  });

  assert.equal(series.points.length, 1);
  assert.equal(series.points[0].payoutUsd, 450);
  assert.ok(series.points[0].exactDateLabel.includes('2026'));
  assert.equal(series.points[0].timestampIso, '2026-11-15T14:30:00.000Z');

  const invalidFeedback = validateAndFormatPractitionerFeedback({
    reviewerName: 'Amina',
    reviewText: 'Too short',
    selectedAspects: ['Mentor responsiveness'],
  });
  assert.equal(invalidFeedback.valid, false);
  assert.ok(invalidFeedback.error);

  const validFeedback = validateAndFormatPractitionerFeedback({
    reviewerName: 'Amina Hassan',
    reviewText: 'Mentor QA checks caught a critical voltage threshold edge case before handover.',
    selectedAspects: ['Mentor responsiveness', 'Technical & QA guidance'],
  });
  assert.equal(validFeedback.valid, true);
  assert.equal(validFeedback.error, null);
  assert.ok(validFeedback.formattedReviewText.includes('[Mentor responsiveness · Technical & QA guidance]'));
  assert.ok(validFeedback.formattedReviewText.includes('voltage threshold'));
});

test('SprintMilestoneChecklist filters Active vs Completed milestones and provides verification workflow status tooltips', () => {
  const ranked = rankSolutionSprints(
    createInitialProfile({ ageStage: '30-45', problemStatement: 'solar inverter' }),
    [sampleCap],
    samplePassport
  );
  const solarSprint = ranked.find((s) => s.id === 'sprint-solar-coldchain-01')!;
  const nowMs = Date.parse('2026-11-25T12:00:00.000Z');

  // 1 completed task + 2 pending tasks (In Progress / Delayed)
  const mixedTasks = buildSprintMilestoneTasks({
    briefId: solarSprint.id,
    sprint: solarSprint,
    milestonesDone: ['analysis-complete'],
    isCompleted: false,
    checkedMap: {},
    deadlineIso: '2026-11-28T12:00:00.000Z',
    nowMs,
  });

  const counts = getSprintMilestoneFilterCounts(mixedTasks);
  assert.equal(counts.all, 3);
  assert.equal(counts.completed, 1);
  assert.equal(counts.active, 2);

  const activeOnly = filterSprintMilestoneTasks(mixedTasks, 'active');
  assert.equal(activeOnly.length, 2);
  assert.ok(activeOnly.every((task) => !task.completed && task.status !== 'completed'));

  const completedOnly = filterSprintMilestoneTasks(mixedTasks, 'completed');
  assert.equal(completedOnly.length, 1);
  assert.equal(completedOnly[0].status, 'completed');

  const allTasks = filterSprintMilestoneTasks(mixedTasks, 'all');
  assert.equal(allTasks.length, 3);

  // Delayed sprint tasks remain included under Active filter
  const delayedTasks = buildSprintMilestoneTasks({
    briefId: solarSprint.id,
    sprint: solarSprint,
    milestonesDone: ['analysis-complete'],
    isCompleted: false,
    checkedMap: {},
    deadlineIso: '2026-11-25T06:00:00.000Z',
    nowMs,
  });
  const delayedActive = filterSprintMilestoneTasks(delayedTasks, 'active');
  assert.equal(delayedActive.length, 2);
  assert.ok(delayedActive.every((task) => task.status === 'delayed'));

  // Tooltip workflow explanations cover In Progress, Completed, and Delayed
  const inProgressInfo = getMilestoneStatusExplanation('in-progress');
  const completedInfo = getMilestoneStatusExplanation('completed');
  const delayedInfo = getMilestoneStatusExplanation('delayed');
  assert.ok(inProgressInfo.title.includes('In Progress'));
  assert.ok(inProgressInfo.description.toLowerCase().includes('mentor'));
  assert.ok(completedInfo.title.includes('Completed'));
  assert.ok(completedInfo.description.toLowerCase().includes('escrow'));
  assert.ok(delayedInfo.title.includes('Delayed'));
  assert.ok(delayedInfo.description.toLowerCase().includes('deadline'));
});

test('ImpactPulseAnalytics exports full sprint history CSV with payouts and ISO timestamps and PulseView search filters by title, organization, and domain', () => {
  const contribs: BriefSubmission[] = [
    {
      id: 'sub-csv-1',
      ownerUid: 'user-1',
      briefId: 'sprint-solar-coldchain-01',
      briefTitle: 'Solar Cold-Chain Telemetry Calibration',
      domain: 'Green Energy',
      status: 'completed',
      solutionNotes: 'Stabilized inverter bus voltage.',
      hoursLogged: 8,
      payoutUsd: 450,
      createdAtIso: '2026-11-10T09:00:00.000Z',
      updatedAtIso: '2026-11-12T16:45:00.000Z',
    },
    {
      id: 'sub-csv-2',
      ownerUid: 'user-1',
      briefId: 'sprint-ngo-maternal-02',
      briefTitle: 'Rural Clinic Triage Queue Intake',
      domain: 'Healthcare',
      status: 'in-progress',
      solutionNotes: 'Drafted low-bandwidth intake flow.',
      hoursLogged: 4,
      payoutUsd: 380,
      createdAtIso: '2026-11-18T11:00:00.000Z',
      updatedAtIso: '2026-11-20T13:15:00.000Z',
    },
  ];

  const payouts: ContractPayout[] = [
    {
      id: 'pay-csv-1',
      ownerUid: 'user-1',
      sprintId: 'sprint-solar-coldchain-01',
      sprintTitle: 'Solar Cold-Chain Telemetry Calibration',
      partnerOrg: 'Rift Valley Cold-Chain Co-op',
      amountUsd: 450,
      status: 'released',
      payoutRail: 'mobile-money',
      createdAtIso: '2026-11-12T16:45:00.000Z',
      updatedAtIso: '2026-11-12T16:45:00.000Z',
    },
  ];

  const series = buildImpactPulseSeries({ contributions: contribs, payouts });
  const csv = buildImpactPulseHistoryCsv(series.points);
  const lines = csv.split('\n');
  assert.equal(lines.length, 3);
  assert.ok(lines[0].includes('"Payout (USD)"'));
  assert.ok(lines[0].includes('"Timestamp (ISO)"'));
  assert.ok(lines[1].includes('"Solar Cold-Chain Telemetry Calibration"'));
  assert.ok(lines[1].includes('"450"'));
  assert.ok(lines[1].includes('"2026-11-12T16:45:00.000Z"'));
  assert.ok(lines[2].includes('"380"'));
  assert.ok(lines[2].includes('"2026-11-20T13:15:00.000Z"'));

  // Organization resolution + filtering by title, organization, and domain
  assert.equal(
    resolveContributionOrganization(contribs[0], payouts),
    'Rift Valley Cold-Chain Co-op'
  );
  assert.equal(
    resolveContributionOrganization(contribs[1], payouts),
    'Clinics Without Borders East Africa'
  );

  const byTitle = filterSprintHistoryContributions(contribs, {
    statusFilter: 'all',
    searchQuery: 'Telemetry',
    payouts,
  });
  assert.equal(byTitle.length, 1);
  assert.equal(byTitle[0].contribution.id, 'sub-csv-1');

  const byOrg = filterSprintHistoryContributions(contribs, {
    statusFilter: 'all',
    searchQuery: 'Clinics Without Borders',
    payouts,
  });
  assert.equal(byOrg.length, 1);
  assert.equal(byOrg[0].contribution.id, 'sub-csv-2');

  const byDomain = filterSprintHistoryContributions(contribs, {
    statusFilter: 'all',
    searchQuery: 'green energy',
    payouts,
  });
  assert.equal(byDomain.length, 1);
  assert.equal(byDomain[0].contribution.id, 'sub-csv-1');

  const byStatusAndQuery = filterSprintHistoryContributions(contribs, {
    statusFilter: 'completed',
    searchQuery: 'Clinic',
    payouts,
  });
  assert.equal(byStatusAndQuery.length, 0);
});

test('SprintCalendar maps active, upcoming, and past sprint durations into a month-view grid', () => {
  const nowMs = Date.parse('2026-11-15T10:00:00.000Z');
  const contribs: BriefSubmission[] = [
    {
      id: 'cal-past-1',
      ownerUid: 'user-1',
      briefId: 'sprint-solar-coldchain-01',
      briefTitle: 'Solar Cold-Chain Telemetry',
      domain: 'Green Energy',
      status: 'completed',
      solutionNotes: 'Done',
      hoursLogged: 8,
      payoutUsd: 450,
      createdAtIso: '2026-11-02T09:00:00.000Z',
      updatedAtIso: '2026-11-06T15:00:00.000Z',
    },
    {
      id: 'cal-active-1',
      ownerUid: 'user-1',
      briefId: 'sprint-ngo-maternal-02',
      briefTitle: 'Maternal Triage SOP Sprint',
      domain: 'Healthcare Ops',
      status: 'in-progress',
      solutionNotes: 'In progress',
      hoursLogged: 4,
      payoutUsd: 380,
      createdAtIso: '2026-11-12T08:00:00.000Z',
      updatedAtIso: '2026-11-14T10:00:00.000Z',
      deadlineIso: '2026-11-19T18:00:00.000Z',
    },
  ];

  const events = buildSprintCalendarEvents({
    contributions: contribs,
    nowMs,
  });

  const pastEvt = events.find((e) => e.category === 'past');
  const activeEvt = events.find((e) => e.category === 'active');
  const upcomingEvts = events.filter((e) => e.category === 'upcoming');

  assert.ok(pastEvt);
  assert.equal(pastEvt.startDateKey, '2026-11-02');
  assert.equal(pastEvt.endDateKey, '2026-11-06');
  assert.equal(pastEvt.durationDays, 5);

  assert.ok(activeEvt);
  assert.equal(activeEvt.startDateKey, '2026-11-12');
  assert.equal(activeEvt.endDateKey, '2026-11-19');
  assert.equal(activeEvt.durationDays, 8);

  assert.ok(upcomingEvts.length >= 2);
  assert.ok(upcomingEvts.every((u) => u.startDateKey > '2026-11-15'));

  const grid = buildMonthCalendarGrid(2026, 10, events, '2026-11-15');
  assert.equal(grid.length % 7, 0);
  const nov15 = grid.find((c) => c.dateKey === '2026-11-15')!;
  assert.equal(nov15.isToday, true);
  assert.ok(nov15.events.some((e) => e.id === activeEvt.id));

  const nov04 = grid.find((c) => c.dateKey === '2026-11-04')!;
  assert.ok(nov04.events.some((e) => e.id === pastEvt.id));
});

test('MentorMessagingDrawer resolves real-time Active, Away, and Offline mentor availability indicators', () => {
  const greenMentor = getAssignedMentorForSprint('sprint-solar-coldchain-01');
  const techMentor = getAssignedMentorForSprint('sprint-remote-sync-03');

  // Midday EAT (10:00 UTC = 13:00 EAT): green mentor is Active
  const activeStatus = resolveRealtimeMentorAvailability({
    mentor: greenMentor,
    isOnline: true,
    nowMs: Date.parse('2026-11-25T10:00:00.000Z'),
  });
  assert.equal(activeStatus.state, 'active');
  assert.equal(activeStatus.label, 'Active');
  assert.ok(activeStatus.expectedResponseTime.includes('Replies'));

  // Midday CET (10:00 UTC = 11:00 CET): tech mentor in review is Away
  const awayStatus = resolveRealtimeMentorAvailability({
    mentor: techMentor,
    isOnline: true,
    nowMs: Date.parse('2026-11-25T10:00:00.000Z'),
  });
  assert.equal(awayStatus.state, 'away');
  assert.equal(awayStatus.label, 'Away');
  assert.ok(awayStatus.expectedResponseTime.includes('Replies'));

  // Browser offline forces Offline state with queued guidance
  const offlineConnectivity = resolveRealtimeMentorAvailability({
    mentor: greenMentor,
    isOnline: false,
    nowMs: Date.parse('2026-11-25T10:00:00.000Z'),
  });
  assert.equal(offlineConnectivity.state, 'offline');
  assert.equal(offlineConnectivity.label, 'Offline');
  assert.ok(offlineConnectivity.expectedResponseTime.toLowerCase().includes('queued'));

  // Overnight hub hours (23:00 UTC = 02:00 EAT) shows Offline until next shift
  const overnightOffline = resolveRealtimeMentorAvailability({
    mentor: greenMentor,
    isOnline: true,
    nowMs: Date.parse('2026-11-25T23:00:00.000Z'),
  });
  assert.equal(overnightOffline.state, 'offline');
  assert.equal(overnightOffline.label, 'Offline');

  // Recent thread activity elevates live engagement to Active
  const liveThreadActive = resolveRealtimeMentorAvailability({
    mentor: techMentor,
    isOnline: true,
    nowMs: Date.parse('2026-11-25T10:00:00.000Z'),
    hasRecentThreadActivity: true,
  });
  assert.equal(liveThreadActive.state, 'active');
  assert.equal(liveThreadActive.label, 'Active');
});

test('ImpactPulseAnalytics buildYearInReviewHeatmap maps sprint intensity and milestone completion density across the year', () => {
  const contribs: BriefSubmission[] = [
    {
      id: 'hm-1',
      ownerUid: 'user-1',
      briefId: 'sprint-solar-coldchain-01',
      briefTitle: 'Solar Cold-Chain Telemetry',
      domain: 'Green Energy',
      status: 'completed',
      solutionNotes: 'Completed all 3 checkpoints',
      hoursLogged: 15,
      payoutUsd: 450,
      milestonesDone: ['analysis-complete', 'draft-ready', 'final-submission'],
      createdAtIso: '2026-03-02T09:00:00.000Z',
      updatedAtIso: '2026-03-06T16:00:00.000Z',
    },
    {
      id: 'hm-2',
      ownerUid: 'user-1',
      briefId: 'sprint-ngo-maternal-02',
      briefTitle: 'Maternal Triage SOP Sprint',
      domain: 'Healthcare Ops',
      status: 'in-progress',
      solutionNotes: 'Draft ready',
      hoursLogged: 8,
      payoutUsd: 380,
      milestonesDone: ['analysis-complete', 'draft-ready'],
      createdAtIso: '2026-03-05T09:00:00.000Z',
      updatedAtIso: '2026-03-07T12:00:00.000Z',
      deadlineIso: '2026-03-08T18:00:00.000Z',
    },
    {
      id: 'hm-prev-year',
      ownerUid: 'user-1',
      briefId: 'sprint-remote-sync-03',
      briefTitle: 'Offline-First Sync Architecture',
      domain: 'Tech',
      status: 'completed',
      solutionNotes: '2025 sprint',
      hoursLogged: 6,
      payoutUsd: 300,
      createdAtIso: '2025-11-10T09:00:00.000Z',
      updatedAtIso: '2025-11-12T15:00:00.000Z',
    },
  ];

  const heatmap2026 = buildYearInReviewHeatmap({
    contributions: contribs,
    payouts: [],
    year: 2026,
    referenceYear: 2026,
  });

  assert.equal(heatmap2026.year, 2026);
  assert.deepEqual(heatmap2026.availableYears, [2026, 2025]);
  const inYearCells = heatmap2026.weeks.flat().filter((c) => c.inTargetYear);
  assert.equal(inYearCells.length, 365);
  assert.equal(heatmap2026.monthLabels.length, 12);
  assert.equal(heatmap2026.totalSprintTouches, 2);
  assert.equal(heatmap2026.totalMilestonesCompleted, 5);
  assert.equal(heatmap2026.totalActiveDays, 7); // Mar 2..Mar 8
  assert.equal(heatmap2026.longestStreakDays, 7);

  // Overlapping sprint day Mar 6 has both sprints + milestone completion
  const mar6 = inYearCells.find((c) => c.dateKey === '2026-03-06')!;
  assert.equal(mar6.sprintCount, 2);
  assert.ok(mar6.milestoneCompletions >= 1);
  assert.ok(mar6.level >= 3);
  assert.ok(heatmap2026.peakDay && heatmap2026.peakDay.level >= 3);

  // Leap year check (2024 -> 366 days)
  const heatmap2024 = buildYearInReviewHeatmap({
    contributions: contribs,
    payouts: [],
    year: 2024,
    referenceYear: 2026,
  });
  const leapCells = heatmap2024.weeks.flat().filter((c) => c.inTargetYear);
  assert.equal(leapCells.length, 366);
});

test('Markdown parser safely structures collaboration notes and rejects unsafe link schemes, while offline queue compacts notes', () => {
  const sampleMarkdown = [
    '## Pod Handoff Retrospective',
    'Coordinated **battery load balancing** and *thermal safety* using `v4.2` telemetry.',
    '- Clear handoff from Halima at shift change',
    '- Verified [Partner Spec](https://vuka-na-amana.app/spec) and rejected [Bad](javascript:alert(1))',
    '> Keep daily 15m check-ins during final QA.',
    '1. Audit inverter logs',
    '2. Sign off release notes',
  ].join('\n');

  const blocks = parseMarkdownBlocks(sampleMarkdown);
  assert.equal(blocks[0].kind, 'heading');
  assert.equal(blocks[1].kind, 'paragraph');
  assert.equal(blocks[2].kind, 'unordered-list');
  assert.equal(blocks[3].kind, 'blockquote');
  assert.equal(blocks[4].kind, 'ordered-list');

  assert.equal(sanitizeMarkdownLinkUrl('https://vuka-na-amana.app/spec'), 'https://vuka-na-amana.app/spec');
  assert.equal(sanitizeMarkdownLinkUrl('javascript:alert(1)'), null);
  assert.equal(sanitizeMarkdownLinkUrl('data:text/html,<script>'), null);

  const inlineTokens = parseMarkdownInline(
    'Verified **bold** and *italic* with `code` plus [Safe](https://example.org) and [XSS](javascript:alert(1))'
  );
  assert.ok(inlineTokens.some((t) => t.kind === 'bold' && t.text === 'bold'));
  assert.ok(inlineTokens.some((t) => t.kind === 'italic' && t.text === 'italic'));
  assert.ok(inlineTokens.some((t) => t.kind === 'code' && t.text === 'code'));
  assert.ok(inlineTokens.some((t) => t.kind === 'link' && t.href === 'https://example.org/'));
  assert.ok(!inlineTokens.some((t) => t.kind === 'link' && t.label === 'XSS'));

  const noteV1: SprintCollaborationNote = {
    id: 'collab_sub-1',
    ownerUid: 'user-1',
    contributionId: 'sub-1',
    briefId: 'sprint-solar-coldchain-01',
    briefTitle: 'Solar Cold-Chain Telemetry',
    markdownBody: 'Initial note',
    createdAtIso: '2026-11-20T10:00:00.000Z',
    updatedAtIso: '2026-11-20T10:00:00.000Z',
  };
  const noteV2: SprintCollaborationNote = {
    ...noteV1,
    markdownBody: '## Updated team dynamics reflection',
    updatedAtIso: '2026-11-20T11:00:00.000Z',
  };

  const compactedUpsert = compactOfflineQueue([
    { id: 'm1', kind: 'upsert_collaboration_note', payload: noteV1, queuedAtIso: noteV1.createdAtIso },
    { id: 'm2', kind: 'upsert_collaboration_note', payload: noteV2, queuedAtIso: noteV2.updatedAtIso },
  ]);
  assert.equal(compactedUpsert.length, 1);
  assert.equal(compactedUpsert[0].id, 'm2');

  const compactedDelete = compactOfflineQueue([
    { id: 'm2', kind: 'upsert_collaboration_note', payload: noteV2, queuedAtIso: noteV2.updatedAtIso },
    { id: 'm3', kind: 'delete_collaboration_note', noteId: noteV2.id, queuedAtIso: '2026-11-20T12:00:00.000Z' },
  ]);
  assert.equal(compactedDelete.length, 1);
  assert.equal(compactedDelete[0].kind, 'delete_collaboration_note');
});

test('SprintMilestoneChecklist marks sequential task dependencies and locks downstream milestones until prerequisite is Completed', () => {
  const ranked = rankSolutionSprints(
    createInitialProfile({ ageStage: '30-45', problemStatement: 'solar inverter' }),
    [sampleCap],
    samplePassport
  );
  const solarSprint = ranked.find((s) => s.id === 'sprint-solar-coldchain-01')!;
  const nowMs = Date.parse('2026-11-25T12:00:00.000Z');

  // Step 0: nothing completed -> Task 1 root (unlocked), Tasks 2 & 3 locked
  const initialTasks = buildSprintMilestoneTasks({
    briefId: solarSprint.id,
    sprint: solarSprint,
    milestonesDone: [],
    isCompleted: false,
    checkedMap: {},
    deadlineIso: '2026-11-28T12:00:00.000Z',
    nowMs,
  });

  assert.equal(initialTasks[0].dependencyState, 'root');
  assert.equal(initialTasks[0].dependsOnOrder, null);
  assert.equal(initialTasks[0].isLocked, false);

  assert.equal(initialTasks[1].dependencyState, 'locked');
  assert.equal(initialTasks[1].dependsOnOrder, 1);
  assert.equal(initialTasks[1].isLocked, true);
  assert.equal(initialTasks[1].dependencyLabel, 'Locked until Task 01 is Completed');

  assert.equal(initialTasks[2].dependencyState, 'locked');
  assert.equal(initialTasks[2].dependsOnOrder, 2);
  assert.equal(initialTasks[2].isLocked, true);
  assert.equal(initialTasks[2].dependencyLabel, 'Locked until Task 02 is Completed');

  // Step 1: Task 1 checked off -> Task 2 unlocked, Task 3 still locked on Task 2
  const firstDoneTasks = buildSprintMilestoneTasks({
    briefId: solarSprint.id,
    sprint: solarSprint,
    milestonesDone: ['analysis-complete'],
    isCompleted: false,
    checkedMap: {},
    deadlineIso: '2026-11-28T12:00:00.000Z',
    nowMs,
  });

  assert.equal(firstDoneTasks[0].statusLabel, 'Completed');
  assert.equal(firstDoneTasks[1].dependencyState, 'unlocked');
  assert.equal(firstDoneTasks[1].isLocked, false);
  assert.equal(firstDoneTasks[1].dependencyLabel, 'Unlocked · Task 01 Completed');
  assert.equal(firstDoneTasks[2].dependencyState, 'locked');
  assert.equal(firstDoneTasks[2].isLocked, true);

  // Step 2: Task 2 checked off via checkedMap -> Task 3 unlocked
  const secondKey = `${solarSprint.id}::${solarSprint.deliverableChecklist[1]}`;
  const secondDoneTasks = buildSprintMilestoneTasks({
    briefId: solarSprint.id,
    sprint: solarSprint,
    milestonesDone: ['analysis-complete'],
    isCompleted: false,
    checkedMap: { [secondKey]: true },
    deadlineIso: '2026-11-28T12:00:00.000Z',
    nowMs,
  });

  assert.equal(secondDoneTasks[2].dependencyState, 'unlocked');
  assert.equal(secondDoneTasks[2].isLocked, false);
  assert.equal(secondDoneTasks[2].dependencyLabel, 'Unlocked · Task 02 Completed');
});

test('SprintDiscussionBoard sanitizes resource URLs, builds deliverable threads, and compacts discussion offline mutations', () => {
  assert.equal(
    sanitizeDiscussionResourceUrl('https://docs.vukanaamana.org/specs/solar-qa'),
    'https://docs.vukanaamana.org/specs/solar-qa'
  );
  assert.equal(sanitizeDiscussionResourceUrl('http://localhost:3000/guide'), 'http://localhost:3000/guide');
  assert.equal(sanitizeDiscussionResourceUrl('javascript:alert(1)'), undefined);
  assert.equal(sanitizeDiscussionResourceUrl('data:text/html,<script>'), undefined);
  assert.equal(sanitizeDiscussionResourceUrl('ftp://files.example.com/a'), undefined);
  assert.equal(sanitizeDiscussionResourceUrl('https://bad url with spaces.com'), undefined);
  assert.equal(sanitizeDiscussionResourceUrl('/relative/path'), undefined);

  const seeded = buildDefaultPodDiscussionsForSprint({
    sprintId: 'sprint-solar-coldchain-01',
    briefTitle: 'Solar Cold-Chain Telemetry',
    deliverables: ['48V inverter wiring diagram', 'Telemetry alert threshold spec'],
    mentorName: 'Dr. Grace Mwangi',
    mentorRole: 'Senior Energy Specialist',
  });
  assert.equal(seeded.length, 3);

  const customRoot: SprintDiscussionPost = {
    id: 'disc-custom-1',
    sprintId: 'sprint-solar-coldchain-01',
    parentId: null,
    authorUid: 'user-1',
    authorName: 'Amina Hassan',
    authorRole: 'Pod Delivery',
    deliverableTag: '48V inverter wiring diagram',
    body: 'Uploaded updated busbar fuse rating table.',
    resourceUrl: 'https://docs.vukanaamana.org/fuse-chart',
    resourceLabel: 'Fuse Rating Chart',
    createdAtIso: '2026-11-25T10:00:00.000Z',
    updatedAtIso: '2026-11-25T10:00:00.000Z',
  };
  const customReply: SprintDiscussionPost = {
    id: 'disc-custom-2',
    sprintId: 'sprint-solar-coldchain-01',
    parentId: 'disc-custom-1',
    authorUid: 'user-2',
    authorName: 'Samuel Kiprop',
    authorRole: 'Pod Lead',
    deliverableTag: '48V inverter wiring diagram',
    body: 'Confirmed 60A breaker match for the clinic sub-panel.',
    createdAtIso: '2026-11-25T11:00:00.000Z',
    updatedAtIso: '2026-11-25T11:00:00.000Z',
  };

  const allThreads = buildSprintDiscussionThreads([...seeded, customRoot, customReply], 'all');
  assert.equal(allThreads.length, 3);
  assert.equal(allThreads[0].root.id, 'disc-custom-1');
  assert.equal(allThreads[0].replies.length, 1);
  assert.equal(allThreads[0].replies[0].id, 'disc-custom-2');

  const filteredThreads = buildSprintDiscussionThreads(
    [...seeded, customRoot, customReply],
    'Telemetry alert threshold spec'
  );
  assert.equal(filteredThreads.length, 1);
  assert.equal(filteredThreads[0].root.deliverableTag, 'Telemetry alert threshold spec');

  const compactedDisc = compactOfflineQueue([
    { id: 'd1', kind: 'upsert_sprint_discussion', payload: customRoot, queuedAtIso: customRoot.createdAtIso },
    {
      id: 'd2',
      kind: 'upsert_sprint_discussion',
      payload: { ...customRoot, body: 'Edited fuse rating note.' },
      queuedAtIso: '2026-11-25T10:05:00.000Z',
    },
    {
      id: 'd3',
      kind: 'delete_sprint_discussion',
      sprintId: customReply.sprintId,
      postId: customReply.id,
      queuedAtIso: '2026-11-25T11:30:00.000Z',
    },
  ]);
  assert.equal(compactedDisc.length, 2);
  assert.equal(compactedDisc[0].id, 'd2');
  assert.equal(compactedDisc[1].kind, 'delete_sprint_discussion');
});

test('buildMentorshipVelocityMetrics correlates attended sessions, mentor thread fallback, velocity lift, and ratio', () => {
  const emptyMetrics = buildMentorshipVelocityMetrics({
    contributions: [],
    mentorMessages: [],
    mentorshipSessions: [],
    payouts: [],
  });
  assert.equal(emptyMetrics.points.length, 0);
  assert.equal(emptyMetrics.sessionsAttendedCount, 0);
  assert.equal(emptyMetrics.completedSprintsCount, 0);
  assert.equal(emptyMetrics.sessionToSprintRatioLabel, '0 : 0');

  const contributions: BriefSubmission[] = [
    {
      id: 'c-mentored-1',
      ownerUid: 'u1',
      briefId: 'sprint-solar-coldchain-01',
      briefTitle: 'Solar Microgrid Diagnostics',
      domain: 'Green Energy',
      status: 'completed',
      solutionNotes: 'Completed thermal diagnostics and 48V cell rebalance.',
      hoursLogged: 6,
      payoutUsd: 480,
      milestonesDone: ['analysis-complete', 'draft-ready', 'final-submission'],
      createdAtIso: '2026-11-01T10:00:00.000Z',
      updatedAtIso: '2026-11-05T10:00:00.000Z',
    },
    {
      id: 'c-thread-2',
      ownerUid: 'u1',
      briefId: 'sprint-health-02',
      briefTitle: 'Clinic Triage Protocol',
      domain: 'Healthcare Ops',
      status: 'completed',
      solutionNotes: 'Completed bilingual triage checklist.',
      hoursLogged: 4,
      payoutUsd: 390,
      milestonesDone: ['analysis-complete', 'draft-ready', 'final-submission'],
      createdAtIso: '2026-11-10T10:00:00.000Z',
      updatedAtIso: '2026-11-12T10:00:00.000Z',
    },
    {
      id: 'c-unmentored-3',
      ownerUid: 'u1',
      briefId: 'sprint-finance-03',
      briefTitle: 'Artisan Working-Capital Ledger',
      domain: 'SME Finance',
      status: 'in-progress',
      solutionNotes: 'Initial sheet draft.',
      hoursLogged: 3,
      payoutUsd: 460,
      milestonesDone: ['analysis-complete'],
      createdAtIso: '2026-11-18T10:00:00.000Z',
      updatedAtIso: '2026-11-20T10:00:00.000Z',
    },
  ];

  const mentorshipSessions: MentorshipSession[] = [
    {
      id: 'ms-1',
      ownerUid: 'u1',
      sprintId: 'sprint-solar-coldchain-01',
      sprintTitle: 'Solar Microgrid Diagnostics',
      mentorId: 'mentor-green-01',
      mentorName: 'Eng. Samuel Kariuki',
      focusTopic: 'qa-architecture',
      durationMinutes: 30,
      status: 'attended',
      takeawayNote: 'Checked 48V busbar torque.',
      attendedAtIso: '2026-11-02T10:00:00.000Z',
      createdAtIso: '2026-11-02T10:00:00.000Z',
      updatedAtIso: '2026-11-02T10:00:00.000Z',
    },
    {
      id: 'ms-2',
      ownerUid: 'u1',
      sprintId: 'sprint-solar-coldchain-01',
      sprintTitle: 'Solar Microgrid Diagnostics',
      mentorId: 'mentor-green-01',
      mentorName: 'Eng. Samuel Kariuki',
      focusTopic: 'handover-rubric',
      durationMinutes: 15,
      status: 'attended',
      takeawayNote: 'Approved handover checklist.',
      attendedAtIso: '2026-11-04T10:00:00.000Z',
      createdAtIso: '2026-11-04T10:00:00.000Z',
      updatedAtIso: '2026-11-04T10:00:00.000Z',
    },
    {
      id: 'ms-3',
      ownerUid: 'u1',
      sprintId: 'sprint-finance-03',
      sprintTitle: 'Artisan Working-Capital Ledger',
      mentorId: 'mentor-finance-04',
      mentorName: 'Grace Mukasa',
      focusTopic: 'career-rpl',
      durationMinutes: 30,
      status: 'scheduled',
      takeawayNote: 'Upcoming Friday ledger review.',
      attendedAtIso: '2026-11-26T10:00:00.000Z',
      createdAtIso: '2026-11-24T10:00:00.000Z',
      updatedAtIso: '2026-11-24T10:00:00.000Z',
    },
  ];

  const mentorMessages: MentorMessage[] = [
    // Already has explicit logged sessions on sprint-solar-coldchain-01, so should NOT double-count
    {
      id: 'mm-1',
      ownerUid: 'u1',
      sprintId: 'sprint-solar-coldchain-01',
      sprintTitle: 'Solar Microgrid Diagnostics',
      mentorId: 'mentor-green-01',
      mentorName: 'Eng. Samuel Kariuki',
      sender: 'practitioner',
      body: 'Ready for review',
      createdAtIso: '2026-11-02T09:00:00.000Z',
      updatedAtIso: '2026-11-02T09:00:00.000Z',
    },
    // No explicit logged session on sprint-health-02, so counts as 1 async pod check-in
    {
      id: 'mm-2',
      ownerUid: 'u1',
      sprintId: 'sprint-health-02',
      sprintTitle: 'Clinic Triage Protocol',
      mentorId: 'mentor-health-02',
      mentorName: 'Dr. Amina Haddad',
      sender: 'practitioner',
      body: 'Can you verify maternal red-flag phrasing?',
      createdAtIso: '2026-11-11T09:00:00.000Z',
      updatedAtIso: '2026-11-11T09:00:00.000Z',
    },
  ];

  const metrics = buildMentorshipVelocityMetrics({
    contributions,
    mentorMessages,
    mentorshipSessions,
    payouts: [],
  });

  // 2 explicit attended on sprint-1 + 1 async check-in on sprint-2 = 3 attended; 2 completed sprints => 1.5 : 1
  assert.equal(metrics.sessionsAttendedCount, 3);
  assert.equal(metrics.completedSprintsCount, 2);
  assert.equal(metrics.scheduledSessionsCount, 1);
  assert.equal(metrics.sessionToSprintRatio, 1.5);
  assert.equal(metrics.sessionToSprintRatioLabel, '1.5 : 1');
  assert.equal(metrics.mentoredSprintsCount, 2);
  assert.equal(metrics.unmentoredSprintsCount, 1);
  assert.equal(metrics.mentoredSprintCoveragePct, 67);
  assert.equal(metrics.mentoredAvgVelocityPct, 100);
  assert.equal(metrics.unmentoredAvgVelocityPct, 33);
  assert.equal(metrics.velocityLiftPct, 67);
  assert.equal(metrics.totalMentorshipMinutes, 60); // 30m + 15m + 15m async fallback
  assert.equal(metrics.points.length, 3);
  assert.equal(metrics.points[0].sessionsAttended, 2);
  assert.equal(metrics.points[1].sessionsAttended, 1);
  assert.equal(metrics.points[2].sessionsAttended, 0);

  // Offline queue compaction for upsert_mentorship_session / delete_mentorship_session
  const compactedSessions = compactOfflineQueue([
    {
      id: 'qm-1',
      kind: 'upsert_mentorship_session',
      payload: mentorshipSessions[2],
      queuedAtIso: '2026-11-24T10:00:00.000Z',
    },
    {
      id: 'qm-2',
      kind: 'upsert_mentorship_session',
      payload: { ...mentorshipSessions[2], status: 'attended' },
      queuedAtIso: '2026-11-25T10:00:00.000Z',
    },
    {
      id: 'qm-3',
      kind: 'delete_mentorship_session',
      sessionId: 'ms-1',
      queuedAtIso: '2026-11-25T11:00:00.000Z',
    },
  ]);
  assert.equal(compactedSessions.length, 2);
  assert.equal(compactedSessions[0].id, 'qm-2');
  assert.equal(compactedSessions[1].kind, 'delete_mentorship_session');
});

test('buildSixMonthMentorshipCorrelation buckets 6 rolling months and compares mentored vs unmentored sprint success', () => {
  const anchorMs = Date.parse('2026-11-25T12:00:00.000Z');
  const contributions: BriefSubmission[] = [
    {
      id: 'c-jun',
      ownerUid: 'u1',
      briefId: 'sprint-jun-01',
      briefTitle: 'June Solar Check',
      domain: 'Green Energy',
      status: 'completed',
      solutionNotes: 'Done',
      hoursLogged: 5,
      payoutUsd: 350,
      milestonesDone: ['analysis-complete', 'draft-ready', 'final-submission'],
      createdAtIso: '2026-06-05T10:00:00.000Z',
      updatedAtIso: '2026-06-12T10:00:00.000Z',
    },
    {
      id: 'c-aug',
      ownerUid: 'u1',
      briefId: 'sprint-aug-02',
      briefTitle: 'August Finance Audit',
      domain: 'SME Finance',
      status: 'in-progress',
      solutionNotes: 'Drafted initial ledger.',
      hoursLogged: 2,
      payoutUsd: 400,
      milestonesDone: ['analysis-complete'],
      createdAtIso: '2026-08-03T10:00:00.000Z',
      updatedAtIso: '2026-08-14T10:00:00.000Z',
    },
    {
      id: 'c-nov',
      ownerUid: 'u1',
      briefId: 'sprint-nov-03',
      briefTitle: 'November Sync Architecture',
      domain: 'Tech',
      status: 'completed',
      solutionNotes: 'Shipped conflict queue tests.',
      hoursLogged: 7,
      payoutUsd: 520,
      milestonesDone: ['analysis-complete', 'draft-ready', 'final-submission'],
      createdAtIso: '2026-11-02T10:00:00.000Z',
      updatedAtIso: '2026-11-19T10:00:00.000Z',
    },
  ];

  const mentorshipSessions: MentorshipSession[] = [
    {
      id: 'ms-jun',
      ownerUid: 'u1',
      sprintId: 'sprint-jun-01',
      sprintTitle: 'June Solar Check',
      mentorId: 'mentor-green-01',
      mentorName: 'Eng. Samuel Kariuki',
      focusTopic: 'qa-architecture',
      durationMinutes: 30,
      status: 'attended',
      takeawayNote: 'Verified thermal hysteresis curve.',
      attendedAtIso: '2026-06-08T10:00:00.000Z',
      createdAtIso: '2026-06-08T10:00:00.000Z',
      updatedAtIso: '2026-06-08T10:00:00.000Z',
    },
    {
      id: 'ms-nov-1',
      ownerUid: 'u1',
      sprintId: 'sprint-nov-03',
      sprintTitle: 'November Sync Architecture',
      mentorId: 'mentor-tech-03',
      mentorName: 'Eng. Tomasz Kowalski',
      focusTopic: 'technical-unblocker',
      durationMinutes: 45,
      status: 'attended',
      takeawayNote: 'Reviewed offline idempotency boundary.',
      attendedAtIso: '2026-11-10T10:00:00.000Z',
      createdAtIso: '2026-11-10T10:00:00.000Z',
      updatedAtIso: '2026-11-10T10:00:00.000Z',
    },
    {
      id: 'ms-nov-2',
      ownerUid: 'u1',
      sprintId: 'sprint-nov-03',
      sprintTitle: 'November Sync Architecture',
      mentorId: 'mentor-tech-03',
      mentorName: 'Eng. Tomasz Kowalski',
      focusTopic: 'handover-rubric',
      durationMinutes: 15,
      status: 'attended',
      takeawayNote: 'Final PR sign-off.',
      attendedAtIso: '2026-11-18T10:00:00.000Z',
      createdAtIso: '2026-11-18T10:00:00.000Z',
      updatedAtIso: '2026-11-18T10:00:00.000Z',
    },
  ];

  const sixM = buildSixMonthMentorshipCorrelation({
    contributions,
    mentorshipSessions,
    nowMs: anchorMs,
  });

  assert.equal(sixM.months.length, 6);
  assert.deepEqual(
    sixM.months.map((m) => m.monthKey),
    ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11']
  );
  assert.equal(sixM.months[0].sessionsAttended, 1);
  assert.equal(sixM.months[0].completionSuccessRatePct, 100);
  assert.equal(sixM.months[0].milestoneVelocityPct, 100);

  assert.equal(sixM.months[2].sessionsAttended, 0);
  assert.equal(sixM.months[2].completionSuccessRatePct, 0);
  assert.equal(sixM.months[2].milestoneVelocityPct, 33);

  assert.equal(sixM.months[5].sessionsAttended, 2);
  assert.equal(sixM.months[5].completionSuccessRatePct, 100);
  assert.equal(sixM.months[5].milestoneVelocityPct, 100);

  assert.equal(sixM.totalSessions6M, 3);
  assert.equal(sixM.totalCompletedSprints6M, 2);
  assert.equal(sixM.totalSprints6M, 3);
  assert.equal(sixM.overallSuccessRatePct, 67);
  assert.ok(sixM.correlationSummary.includes('100%'));
});

test('MENTORSHIP_TRACKS covers all 4 studio domains and compactOfflineQueue deduplicates mentor pairings', () => {
  assert.equal(MENTORSHIP_TRACKS.length, 4);
  assert.equal(getMentorshipTrackForDomain('Healthcare Ops').mentorId, 'mentor-health-02');
  assert.equal(getMentorshipTrackForDomain('Tech').mentorId, 'mentor-tech-03');
  assert.equal(getMentorshipTrackForDomain('SME Finance').mentorId, 'mentor-finance-04');
  assert.equal(getMentorshipTrackForDomain('Green Energy').mentorId, 'mentor-green-01');

  const pairingA: MentorPairingRequest = {
    id: 'pair-1',
    ownerUid: 'u1',
    trackId: 'track-tech',
    trackTitle: 'Offline-First Systems & Sync Architecture Track',
    domain: 'Tech',
    mentorId: 'mentor-tech-03',
    mentorName: 'Eng. Tomasz Kowalski',
    sprintId: 'sprint-remote-sync-04',
    sprintTitle: 'Offline Queue Conflict Suite',
    preferredCadence: 'async-review',
    sprintGoals: 'Complete deterministic queue compaction unit tests.',
    status: 'requested',
    createdAtIso: '2026-11-25T10:00:00.000Z',
    updatedAtIso: '2026-11-25T10:00:00.000Z',
  };

  const compacted = compactOfflineQueue([
    {
      id: 'mp-1',
      kind: 'upsert_mentor_pairing',
      payload: pairingA,
      queuedAtIso: '2026-11-25T10:00:00.000Z',
    },
    {
      id: 'mp-2',
      kind: 'upsert_mentor_pairing',
      payload: { ...pairingA, preferredCadence: 'milestone-gates' },
      queuedAtIso: '2026-11-25T10:05:00.000Z',
    },
    {
      id: 'mp-3',
      kind: 'delete_mentor_pairing',
      pairingId: 'pair-old',
      queuedAtIso: '2026-11-25T10:10:00.000Z',
    },
  ]);

  assert.equal(compacted.length, 2);
  assert.equal(compacted[0].id, 'mp-2');
  assert.equal(compacted[1].kind, 'delete_mentor_pairing');
});

test('buildMentorshipTrackImpactMetrics compares mentoring tracks by mentor-led sprint success rate and velocity', () => {
  const contributions: BriefSubmission[] = [
    {
      id: 'sub-track-1',
      ownerUid: 'u1',
      briefId: 'sprint-solar-coldchain-01',
      briefTitle: 'Solar Microgrid Diagnostics',
      domain: 'Green Energy',
      status: 'completed',
      solutionNotes: 'Completed inverter diagnostic check.',
      hoursLogged: 6,
      payoutUsd: 480,
      milestonesDone: ['analysis-complete', 'draft-ready', 'final-submission'],
      createdAtIso: '2026-11-01T10:00:00.000Z',
      updatedAtIso: '2026-11-05T10:00:00.000Z',
    },
    {
      id: 'sub-track-2',
      ownerUid: 'u1',
      briefId: 'sprint-health-02',
      briefTitle: 'Maternal Clinic Intake Flow',
      domain: 'Healthcare Ops',
      status: 'in-progress',
      solutionNotes: 'Drafting triage checklist.',
      hoursLogged: 4,
      payoutUsd: 400,
      milestonesDone: ['analysis-complete'],
      createdAtIso: '2026-11-10T10:00:00.000Z',
      updatedAtIso: '2026-11-14T10:00:00.000Z',
    },
    {
      id: 'sub-track-3',
      ownerUid: 'u1',
      briefId: 'sprint-tech-03',
      briefTitle: 'Offline Queue Sync Audit',
      domain: 'Tech',
      status: 'completed',
      solutionNotes: 'Verified queue compaction.',
      hoursLogged: 5,
      payoutUsd: 520,
      milestonesDone: ['analysis-complete', 'draft-ready', 'final-submission'],
      createdAtIso: '2026-11-12T10:00:00.000Z',
      updatedAtIso: '2026-11-16T10:00:00.000Z',
    },
  ];

  const mentorshipSessions: MentorshipSession[] = [
    {
      id: 'ms-track-1',
      ownerUid: 'u1',
      sprintId: 'sprint-solar-coldchain-01',
      sprintTitle: 'Solar Microgrid Diagnostics',
      mentorId: 'mentor-green-01',
      mentorName: 'Eng. Samuel Kariuki',
      focusTopic: 'qa-architecture',
      durationMinutes: 30,
      status: 'attended',
      takeawayNote: 'Verified 48V busbar resistance.',
      attendedAtIso: '2026-11-03T10:00:00.000Z',
      createdAtIso: '2026-11-03T10:00:00.000Z',
      updatedAtIso: '2026-11-03T10:00:00.000Z',
    },
    {
      id: 'ms-track-2',
      ownerUid: 'u1',
      sprintId: 'sprint-solar-coldchain-01',
      sprintTitle: 'Solar Microgrid Diagnostics',
      mentorId: 'mentor-green-01',
      mentorName: 'Eng. Samuel Kariuki',
      focusTopic: 'handover-rubric',
      durationMinutes: 15,
      status: 'attended',
      takeawayNote: 'Signed final handover checklist.',
      attendedAtIso: '2026-11-04T10:00:00.000Z',
      createdAtIso: '2026-11-04T10:00:00.000Z',
      updatedAtIso: '2026-11-04T10:00:00.000Z',
    },
    {
      id: 'ms-track-3',
      ownerUid: 'u1',
      sprintId: 'sprint-health-02',
      sprintTitle: 'Maternal Clinic Intake Flow',
      mentorId: 'mentor-health-02',
      mentorName: 'Dr. Grace Mwangi',
      focusTopic: 'technical-unblocker',
      durationMinutes: 30,
      status: 'attended',
      takeawayNote: 'Reviewed WHO cold-chain thresholds.',
      attendedAtIso: '2026-11-12T10:00:00.000Z',
      createdAtIso: '2026-11-12T10:00:00.000Z',
      updatedAtIso: '2026-11-12T10:00:00.000Z',
    },
  ];

  const mentorPairings: MentorPairingRequest[] = [
    {
      id: 'pair-track-1',
      ownerUid: 'u1',
      trackId: 'track-green-energy',
      trackTitle: 'Solar Microgrid & Cold-Chain QA Track',
      domain: 'Green Energy',
      mentorId: 'mentor-green-01',
      mentorName: 'Eng. Samuel Kariuki',
      sprintId: 'sprint-solar-coldchain-01',
      sprintTitle: 'Solar Microgrid Diagnostics',
      preferredCadence: 'milestone-gates',
      sprintGoals: 'Validate 48V cold-room inverter diagnostics.',
      status: 'active',
      createdAtIso: '2026-11-01T08:00:00.000Z',
      updatedAtIso: '2026-11-01T08:00:00.000Z',
    },
  ];

  const trackMetrics = buildMentorshipTrackImpactMetrics({
    contributions,
    mentorshipSessions,
    mentorPairings,
  });

  assert.equal(trackMetrics.tracks.length, 4);
  assert.equal(trackMetrics.hasAnyTrackActivity, true);
  assert.equal(trackMetrics.totalMentoredSprints, 2);
  assert.equal(trackMetrics.totalCompletedMentoredSprints, 1);
  assert.equal(trackMetrics.overallMentorLedSuccessRatePct, 50);

  const greenTrack = trackMetrics.tracks.find((t) => t.domain === 'Green Energy')!;
  const healthTrack = trackMetrics.tracks.find((t) => t.domain === 'Healthcare Ops')!;
  const techTrack = trackMetrics.tracks.find((t) => t.domain === 'Tech')!;

  assert.equal(greenTrack.mentoredSprints, 1);
  assert.equal(greenTrack.completedMentoredSprints, 1);
  assert.equal(greenTrack.mentorLedSuccessRatePct, 100);
  assert.equal(greenTrack.sessionsAttended, 2);
  assert.equal(greenTrack.mentorshipMinutes, 45);
  assert.equal(greenTrack.pairingRequestsCount, 1);

  assert.equal(healthTrack.mentoredSprints, 1);
  assert.equal(healthTrack.completedMentoredSprints, 0);
  assert.equal(healthTrack.mentorLedSuccessRatePct, 0);
  assert.equal(healthTrack.sessionsAttended, 1);

  // Tech sprint had no attended session or async thread, so mentoredSprints = 0
  assert.equal(techTrack.totalSprints, 1);
  assert.equal(techTrack.mentoredSprints, 0);
  assert.equal(techTrack.mentorLedSuccessRatePct, 0);

  assert.equal(trackMetrics.topImpactTrack?.domain, 'Green Energy');
  assert.ok(trackMetrics.summaryText.includes('Green Energy'));
  assert.ok(trackMetrics.summaryText.includes('100%'));
});

test('SprintMilestoneChecklist marks Mentorship Required status tags and unlocks once an attended mentor session is logged', () => {
  const ranked = rankSolutionSprints(
    createInitialProfile({ ageStage: '30-45', problemStatement: 'solar inverter' }),
    [sampleCap],
    samplePassport
  );
  const solarSprint = ranked.find((s) => s.id === 'sprint-solar-coldchain-01')!;
  const nowMs = Date.parse('2026-11-25T12:00:00.000Z');
  const secondKey = `${solarSprint.id}::${solarSprint.deliverableChecklist[1]}`;

  // 0 attended sessions: Task 3 (final-submission) shows 'Mentorship Required' and stays locked even when Task 1 & 2 are completed
  const gatedTasks = buildSprintMilestoneTasks({
    briefId: solarSprint.id,
    sprint: solarSprint,
    milestonesDone: ['analysis-complete'],
    isCompleted: false,
    checkedMap: { [secondKey]: true },
    deadlineIso: '2026-11-28T12:00:00.000Z',
    nowMs,
    mentorshipSessions: [],
  });

  assert.equal(gatedTasks[0].requiresMentorship, false);
  assert.equal(gatedTasks[2].requiresMentorship, true);
  assert.equal(gatedTasks[2].status, 'mentorship-required');
  assert.equal(gatedTasks[2].statusLabel, 'Mentorship Required');
  assert.equal(gatedTasks[2].isMentorshipLocked, true);
  assert.equal(gatedTasks[2].isLocked, true);
  assert.ok(gatedTasks[2].mentorshipPrerequisiteLabel?.includes('attended mentor QA session'));

  // Scheduled-only session is NOT sufficient to unlock
  const scheduledOnlyTasks = buildSprintMilestoneTasks({
    briefId: solarSprint.id,
    sprint: solarSprint,
    milestonesDone: ['analysis-complete'],
    isCompleted: false,
    checkedMap: { [secondKey]: true },
    deadlineIso: '2026-11-28T12:00:00.000Z',
    nowMs,
    mentorshipSessions: [
      {
        id: 'ms-sched-1',
        ownerUid: 'u1',
        sprintId: solarSprint.id,
        sprintTitle: solarSprint.title,
        mentorId: 'mentor-green-01',
        mentorName: 'Eng. Samuel Kariuki',
        focusTopic: 'handover-rubric',
        durationMinutes: 15,
        status: 'scheduled',
        takeawayNote: 'Booked handover QA.',
        attendedAtIso: '2026-11-26T10:00:00.000Z',
        createdAtIso: '2026-11-25T10:00:00.000Z',
        updatedAtIso: '2026-11-25T10:00:00.000Z',
      },
    ],
  });
  assert.equal(scheduledOnlyTasks[2].status, 'mentorship-required');
  assert.equal(scheduledOnlyTasks[2].isLocked, true);

  // Attended session unlocks Task 3 and switches its status to In Progress
  const unlockedTasks = buildSprintMilestoneTasks({
    briefId: solarSprint.id,
    sprint: solarSprint,
    milestonesDone: ['analysis-complete'],
    isCompleted: false,
    checkedMap: { [secondKey]: true },
    deadlineIso: '2026-11-28T12:00:00.000Z',
    nowMs,
    mentorshipSessions: [
      {
        id: 'ms-att-1',
        ownerUid: 'u1',
        sprintId: solarSprint.id,
        sprintTitle: solarSprint.title,
        mentorId: 'mentor-green-01',
        mentorName: 'Eng. Samuel Kariuki',
        focusTopic: 'handover-rubric',
        durationMinutes: 15,
        status: 'attended',
        takeawayNote: 'Signed off handover QA.',
        attendedAtIso: '2026-11-25T11:00:00.000Z',
        createdAtIso: '2026-11-25T11:00:00.000Z',
        updatedAtIso: '2026-11-25T11:00:00.000Z',
      },
    ],
  });
  assert.equal(unlockedTasks[2].isMentorshipLocked, false);
  assert.equal(unlockedTasks[2].mentorshipMet, true);
  assert.equal(unlockedTasks[2].isLocked, false);
  assert.equal(unlockedTasks[2].statusLabel, 'In Progress');
  assert.ok(unlockedTasks[2].mentorshipPrerequisiteLabel?.includes('Prerequisite Met'));

  const mentorshipInfo = getMilestoneStatusExplanation('mentorship-required');
  assert.ok(mentorshipInfo.title.includes('Mentorship Required'));
  assert.ok(mentorshipInfo.description.toLowerCase().includes('attended mentor qa session'));
});

test('MentorAvailabilityHeatmap calculates mentor response latencies across selectable time zones and finds peak pod overlap', () => {
  assert.equal(formatResponseMinutes(12), '12m');
  assert.equal(formatResponseMinutes(150), '2.5h');

  const utcHeatmap = buildMentorAvailabilityHeatmap({ timezoneId: 'utc' });
  assert.equal(utcHeatmap.timezone.id, 'utc');
  assert.equal(utcHeatmap.slots.length, 8);
  assert.equal(utcHeatmap.rows.length, 4);
  assert.equal(utcHeatmap.bestOverlapMentorsCount, 4);
  assert.ok(utcHeatmap.bestOverlapSlotLabel.includes('09:00–12:00 UTC+0'));

  // Nairobi Green Energy mentor (UTC+3): 09:00-12:00 UTC corresponds to 12:00-15:00 local (Peak Live)
  const greenUtcRow = utcHeatmap.rows.find((r) => r.mentor.id === 'mentor-green-01')!;
  const utcSlot09 = greenUtcRow.cells[3]; // 09:00-12:00 UTC
  assert.equal(utcSlot09.tier, 'peak');
  assert.equal(utcSlot09.mentorLocalRangeLabel, '12:00–15:00');
  assert.ok(utcSlot09.estimatedResponseMinutes <= 12);

  // Switch viewer timezone to PST (UTC-8): Nairobi 12:00-15:00 local shifts to 01:00-04:00 -> slot 0 (00:00-03:00 PST) or slot 1 (03:00-06:00 PST)
  const pstHeatmap = buildMentorAvailabilityHeatmap({ timezoneId: 'pst' });
  assert.equal(pstHeatmap.timezone.id, 'pst');
  const greenPstRow = pstHeatmap.rows.find((r) => r.mentor.id === 'mentor-green-01')!;
  // At 00:00-03:00 PST (08:00-11:00 UTC = 11:00-14:00 Nairobi EAT), mentor is in peak local window
  assert.equal(greenPstRow.cells[0].tier, 'peak');
  assert.equal(greenPstRow.cells[0].mentorLocalRangeLabel, '11:00–14:00');
  // Meanwhile 15:00-18:00 PST (23:00-02:00 UTC = 02:00-05:00 Nairobi EAT) is off-hours
  assert.equal(greenPstRow.cells[5].tier, 'off-hours');
  assert.ok(greenPstRow.cells[5].estimatedResponseMinutes >= 60);
});

test('SprintMilestoneChecklist Mentorship Path identifies accelerated milestones and computes estimated time savings', () => {
  const ranked = rankSolutionSprints(
    createInitialProfile({ ageStage: '30-45', problemStatement: 'solar inverter' }),
    [sampleCap],
    samplePassport
  );
  const solarSprint = ranked.find((s) => s.id === 'sprint-solar-coldchain-01')!;
  const nowMs = Date.parse('2026-11-25T12:00:00.000Z');

  // Task 1 (analysis-complete) is not mentorship-accelerated; Tasks 2 & 3 (draft-ready & final-submission) are
  const tasksInitial = buildSprintMilestoneTasks({
    briefId: solarSprint.id,
    sprint: solarSprint,
    milestonesDone: ['analysis-complete'],
    isCompleted: false,
    checkedMap: {},
    deadlineIso: '2026-11-28T12:00:00.000Z',
    nowMs,
  });

  assert.equal(tasksInitial[0].isMentorshipAccelerated, false);
  assert.equal(tasksInitial[0].estimatedTimeSavingsHours, 0);

  assert.equal(tasksInitial[1].isMentorshipAccelerated, true);
  assert.equal(tasksInitial[1].estimatedTimeSavingsHours, 2.5);
  assert.equal(tasksInitial[1].estimatedTimeSavingsLabel, 'Est. ~2.5h saved');
  assert.equal(tasksInitial[1].recommendedMentorFocus, 'QA Architecture Review');

  assert.equal(tasksInitial[2].isMentorshipAccelerated, true);
  assert.equal(tasksInitial[2].estimatedTimeSavingsHours, 1.5);
  assert.equal(tasksInitial[2].estimatedTimeSavingsLabel, 'Est. ~1.5h saved');
  assert.equal(tasksInitial[2].recommendedMentorFocus, 'Handover & Rubric Check');

  const summaryInitial = getMentorshipPathSummary(tasksInitial);
  assert.equal(summaryInitial.acceleratedCount, 2);
  assert.equal(summaryInitial.remainingAcceleratedCount, 2);
  assert.equal(summaryInitial.totalEstimatedHoursSaved, 4);
  assert.equal(summaryInitial.remainingEstimatedHoursSaved, 4);

  // Completing Task 2 reduces remaining accelerated count and hours saved
  const secondKey = `${solarSprint.id}::${solarSprint.deliverableChecklist[1]}`;
  const tasksAfterDraft = buildSprintMilestoneTasks({
    briefId: solarSprint.id,
    sprint: solarSprint,
    milestonesDone: ['analysis-complete'],
    isCompleted: false,
    checkedMap: { [secondKey]: true },
    deadlineIso: '2026-11-28T12:00:00.000Z',
    nowMs,
  });

  const summaryAfterDraft = getMentorshipPathSummary(tasksAfterDraft);
  assert.equal(summaryAfterDraft.acceleratedCount, 2);
  assert.equal(summaryAfterDraft.remainingAcceleratedCount, 1);
  assert.equal(summaryAfterDraft.totalEstimatedHoursSaved, 4);
  assert.equal(summaryAfterDraft.remainingEstimatedHoursSaved, 1.5);
});

test('MentorshipImpactChart sessionFilter isolates Mentor-Led Sessions Only from async thread fallbacks', () => {
  const contribs: BriefSubmission[] = [
    {
      id: 'sub-filter-solar',
      ownerUid: 'u-test',
      briefId: 'sprint-solar-coldchain-01',
      briefTitle: 'Off-Grid Solar Cold-Chain Diagnostics',
      domain: 'Green Energy',
      status: 'completed',
      solutionNotes: 'Completed solar inverter commissioning telemetry',
      hoursLogged: 16,
      payoutUsd: 420,
      milestonesDone: ['analysis-complete', 'draft-ready', 'final-submission'],
      createdAtIso: '2026-11-05T10:00:00.000Z',
      updatedAtIso: '2026-11-12T10:00:00.000Z',
    },
    {
      id: 'sub-filter-tech',
      ownerUid: 'u-test',
      briefId: 'sprint-mesh-telemetry-03',
      briefTitle: 'Offline-First Mesh Sync Queue',
      domain: 'Tech',
      status: 'in-progress',
      solutionNotes: 'Drafted offline queue sync worker',
      hoursLogged: 10,
      payoutUsd: 350,
      milestonesDone: ['analysis-complete', 'draft-ready'],
      createdAtIso: '2026-11-10T10:00:00.000Z',
      updatedAtIso: '2026-11-15T10:00:00.000Z',
    },
  ];

  // Formal attended mentor session ONLY on solar sprint; mesh sprint only has async thread messages
  const formalSessions: MentorshipSession[] = [
    {
      id: 'ms-filter-1',
      ownerUid: 'u-test',
      sprintId: 'sprint-solar-coldchain-01',
      sprintTitle: 'Off-Grid Solar Cold-Chain Diagnostics',
      mentorId: 'mentor-green-01',
      mentorName: 'Eng. Samuel Kariuki',
      focusTopic: 'qa-architecture',
      durationMinutes: 30,
      status: 'attended',
      takeawayNote: 'Signed off voltage sag test',
      attendedAtIso: '2026-11-08T14:00:00.000Z',
      createdAtIso: '2026-11-08T14:00:00.000Z',
      updatedAtIso: '2026-11-08T14:00:00.000Z',
    },
  ];

  const asyncOnlyMessages: MentorMessage[] = [
    {
      id: 'msg-filter-mesh',
      ownerUid: 'u-test',
      sprintId: 'sprint-mesh-telemetry-03',
      sprintTitle: 'Offline-First Mesh Sync Queue',
      mentorId: 'mentor-tech-01',
      mentorName: 'Eng. Tomasz Kowalski',
      sender: 'practitioner',
      body: 'Quick question on retry backoff interval',
      createdAtIso: '2026-11-11T09:00:00.000Z',
      updatedAtIso: '2026-11-11T09:00:00.000Z',
    },
  ];

  const allMetrics = buildMentorshipVelocityMetrics({
    contributions: contribs,
    mentorshipSessions: formalSessions,
    mentorMessages: asyncOnlyMessages,
    sessionFilter: 'all',
  });
  // In 'all' mode, both solar (formal) and mesh (async fallback) count as mentored
  assert.equal(allMetrics.sessionsAttendedCount, 2);
  assert.equal(allMetrics.mentoredSprintsCount, 2);
  assert.equal(allMetrics.unmentoredSprintsCount, 0);

  const mentorLedMetrics = buildMentorshipVelocityMetrics({
    contributions: contribs,
    mentorshipSessions: formalSessions,
    mentorMessages: asyncOnlyMessages,
    sessionFilter: 'mentor-led',
  });
  // In 'mentor-led' mode, async-only mesh sprint is excluded so only formal solar session counts
  assert.equal(mentorLedMetrics.sessionsAttendedCount, 1);
  assert.equal(mentorLedMetrics.mentoredSprintsCount, 1);
  assert.equal(mentorLedMetrics.unmentoredSprintsCount, 1);
  assert.equal(mentorLedMetrics.points.find((p) => p.sprintId === 'sprint-mesh-telemetry-03')?.sessionsAttended, 0);
  assert.equal(mentorLedMetrics.points.find((p) => p.sprintId === 'sprint-solar-coldchain-01')?.sessionsAttended, 1);

  const corrAll = buildSixMonthMentorshipCorrelation({
    contributions: contribs,
    mentorshipSessions: formalSessions,
    mentorMessages: asyncOnlyMessages,
    sessionFilter: 'all',
  });
  const corrMentorLed = buildSixMonthMentorshipCorrelation({
    contributions: contribs,
    mentorshipSessions: formalSessions,
    mentorMessages: asyncOnlyMessages,
    sessionFilter: 'mentor-led',
  });
  assert.equal(corrAll.totalSessions6M, 2);
  assert.equal(corrMentorLed.totalSessions6M, 1);

  const trackMentorLed = buildMentorshipTrackImpactMetrics({
    contributions: contribs,
    mentorshipSessions: formalSessions,
    mentorMessages: asyncOnlyMessages,
    sessionFilter: 'mentor-led',
  });
  const techTrack = trackMentorLed.tracks.find((t) => t.domain === 'Tech')!;
  const greenTrack = trackMentorLed.tracks.find((t) => t.domain === 'Green Energy')!;
  assert.equal(techTrack.mentoredSprints, 0);
  assert.equal(techTrack.sessionsAttended, 0);
  assert.equal(greenTrack.mentoredSprints, 1);
  assert.equal(greenTrack.sessionsAttended, 1);
  assert.equal(greenTrack.mentorLedSuccessRatePct, 100);
});

test('MentorshipSuccessStories provides track-scoped practitioner testimonials and guidance tips for all tracks', () => {
  assert.ok(MENTORSHIP_SUCCESS_STORIES.length >= MENTORSHIP_TRACKS.length);
  for (const track of MENTORSHIP_TRACKS) {
    const stories = getMentorshipStoriesForTrack(track.id);
    assert.ok(stories.length >= 1, `Expected at least one story for ${track.id}`);
    assert.equal(stories[0].trackId, track.id);
    assert.ok(stories[0].quote.trim().length > 20);
    assert.ok(stories[0].outcomeStat.trim().length > 5);
    assert.ok(stories[0].guidanceTip.trim().length > 10);
  }
  const allStories = getMentorshipStoriesForTrack(undefined);
  assert.equal(allStories.length, MENTORSHIP_SUCCESS_STORIES.length);
});

test('EndSessionPopover provides distinct portal closing advice and structured exit reasons', () => {
  assert.ok(END_SESSION_REASON_OPTIONS.length >= 4);
  assert.ok(END_SESSION_REASON_OPTIONS.some((r) => r.id === 'work-complete'));
  assert.ok(END_SESSION_REASON_OPTIONS.some((r) => r.id === 'switching-device'));

  const partnerAdvice = getEndSessionAdvice('partner');
  const talentAdvice = getEndSessionAdvice('talent');

  assert.equal(partnerAdvice.title, 'End Partner Session');
  assert.ok(partnerAdvice.closingAdvice.includes('Partner Console'));
  assert.equal(talentAdvice.title, 'End Practitioner Session');
  assert.ok(talentAdvice.closingAdvice.includes('Competency Passport'));
});

test('MentorshipAvailabilityScheduler generates open slots from mentor schedules and flags booked slots', () => {
  const greenMentor = POD_MENTORS.find((m) => m.id === 'mentor-green-01')!;
  const refNowMs = Date.parse('2026-11-26T06:00:00.000Z');

  // Eng. Samuel Kariuki is EAT (UTC+3), peak 09:00-17:00 EAT (06:00-14:00 UTC)
  const initialSlots = buildMentorOpenSlots({
    mentor: greenMentor,
    timezoneId: 'utc',
    mentorshipSessions: [],
    referenceNowMs: refNowMs,
    daysAhead: 2,
  });

  assert.ok(initialSlots.days.length >= 2);
  assert.ok(initialSlots.openSlotsCount >= 6);
  assert.equal(initialSlots.bookedSlotsCount, 0);

  // 07:00 UTC is 10:00 EAT -> Peak Live!
  const firstSlot = initialSlots.days[0].slots[0];
  assert.equal(firstSlot.viewerStartLabel, '07:00');
  assert.equal(firstSlot.tier, 'peak');
  assert.equal(firstSlot.isBooked, false);

  // Book the first slot and confirm it switches to isBooked=true and decrements openSlotsCount
  const bookedSession: MentorshipSession = {
    id: 'ms-booked-1',
    ownerUid: 'u-test',
    sprintId: 'sprint-solar-coldchain-01',
    sprintTitle: 'Off-Grid Solar Cold-Chain Diagnostics',
    mentorId: greenMentor.id,
    mentorName: greenMentor.name,
    focusTopic: 'qa-architecture',
    durationMinutes: 30,
    status: 'scheduled',
    takeawayNote: 'Booked slot',
    attendedAtIso: firstSlot.slotIso,
    createdAtIso: '2026-11-26T06:00:00.000Z',
    updatedAtIso: '2026-11-26T06:00:00.000Z',
  };

  const afterBooking = buildMentorOpenSlots({
    mentor: greenMentor,
    timezoneId: 'utc',
    mentorshipSessions: [bookedSession],
    referenceNowMs: refNowMs,
    daysAhead: 2,
  });

  assert.equal(afterBooking.bookedSlotsCount, 1);
  assert.equal(afterBooking.openSlotsCount, initialSlots.openSlotsCount - 1);
  assert.equal(afterBooking.days[0].slots[0].isBooked, true);
  assert.equal(afterBooking.days[0].slots[0].bookedSessionId, 'ms-booked-1');
});

test('MentorshipProgressBar tracks track completion percentage, milestones, and unlocked rewards across session sequences', () => {
  const greenTrack = MENTORSHIP_TRACKS.find((t) => t.id === 'track-green-energy')!;

  const p0 = computeMentorshipTrackProgress({
    track: greenTrack,
    mentorshipSessions: [],
    mentorPairings: [],
    contributions: [],
  });
  assert.equal(p0.completionPct, 0);
  assert.equal(p0.unlockedRewards.length, 0);
  assert.equal(p0.nextMilestone?.id, 'step-pairing-kickoff');

  const pairing: MentorPairingRequest = {
    id: 'pair-1',
    ownerUid: 'u-test',
    trackId: greenTrack.id,
    trackTitle: greenTrack.title,
    domain: greenTrack.domain,
    mentorId: greenTrack.mentorId,
    mentorName: 'Eng. Samuel Kariuki',
    preferredCadence: 'milestone-gates',
    sprintGoals: 'Validate inverter QA',
    status: 'requested',
    createdAtIso: '2026-11-25T10:00:00.000Z',
    updatedAtIso: '2026-11-25T10:00:00.000Z',
  };

  const p25 = computeMentorshipTrackProgress({
    track: greenTrack,
    mentorshipSessions: [],
    mentorPairings: [pairing],
    contributions: [],
  });
  assert.equal(p25.completionPct, 25);
  assert.deepEqual(p25.unlockedRewards, ['Priority Pod Match']);
  assert.equal(p25.nextMilestone?.id, 'step-qa-gate');

  const makeAttendedSession = (idx: number): MentorshipSession => ({
    id: `ms-prog-${idx}`,
    ownerUid: 'u-test',
    sprintId: 'sprint-solar-coldchain-01',
    sprintTitle: 'Off-Grid Solar Cold-Chain Diagnostics',
    mentorId: greenTrack.mentorId,
    mentorName: 'Eng. Samuel Kariuki',
    focusTopic: 'qa-architecture',
    durationMinutes: 30,
    status: 'attended',
    takeawayNote: `Session ${idx}`,
    attendedAtIso: `2026-11-2${idx}T12:00:00.000Z`,
    createdAtIso: `2026-11-2${idx}T12:00:00.000Z`,
    updatedAtIso: `2026-11-2${idx}T12:00:00.000Z`,
  });

  const p50 = computeMentorshipTrackProgress({
    track: greenTrack,
    mentorshipSessions: [makeAttendedSession(1)],
    mentorPairings: [pairing],
    contributions: [],
  });
  assert.equal(p50.completionPct, 50);
  assert.deepEqual(p50.unlockedRewards, ['Priority Pod Match', 'QA Blueprint Review']);

  const p75 = computeMentorshipTrackProgress({
    track: greenTrack,
    mentorshipSessions: [makeAttendedSession(1), makeAttendedSession(2)],
    mentorPairings: [pairing],
    contributions: [],
  });
  assert.equal(p75.completionPct, 75);
  assert.deepEqual(p75.unlockedRewards, [
    'Priority Pod Match',
    'QA Blueprint Review',
    'Handover Endorsement',
  ]);

  const p100 = computeMentorshipTrackProgress({
    track: greenTrack,
    mentorshipSessions: [
      makeAttendedSession(1),
      makeAttendedSession(2),
      makeAttendedSession(3),
    ],
    mentorPairings: [pairing],
    contributions: [],
  });
  assert.equal(p100.completionPct, 100);
  assert.equal(p100.unlockedRewards.length, 4);
  assert.equal(p100.nextMilestone, null);
});

test('MentorRatingSystem validates 5-point scale ratings, enforces comment bounds, and computes track accountability summaries', () => {
  assert.equal(Object.keys(MENTOR_RATING_LABELS).length, 5);
  assert.equal(MENTOR_RATING_LABELS[5], 'Exceptional Mentorship');

  const valid = validateAndFormatMentorRating({
    rating: 5,
    comment: '  Clear architecture walkthrough and rapid inverter QA feedback.  ',
  });
  assert.equal(valid.valid, true);
  assert.equal(valid.rating, 5);
  assert.equal(valid.comment, 'Clear architecture walkthrough and rapid inverter QA feedback.');

  const invalidShort = validateAndFormatMentorRating({ rating: 4, comment: 'ok' });
  assert.equal(invalidShort.valid, false);
  assert.ok(invalidShort.error?.includes('at least 5 characters'));

  const summaryEmpty = computeMentorRatingSummary([], { trackId: 'track-green-transitions' });
  assert.equal(summaryEmpty.totalRatings, 0);
  assert.equal(summaryEmpty.averageRating, 0);

  const summaryPopulated = computeMentorRatingSummary(
    [
      {
        id: 'mr-1',
        ownerUid: 'u1',
        trackId: 'track-green-transitions',
        trackTitle: 'Green Energy Systems & Microgrid Track',
        domain: 'Green Energy',
        mentorId: 'mentor-green-01',
        mentorName: 'Eng. Samuel Kariuki',
        rating: 5,
        comment: 'Helped me structure the 48V solar cold-chain QA checklist.',
        createdAtIso: '2026-11-25T10:00:00.000Z',
        updatedAtIso: '2026-11-25T10:00:00.000Z',
      },
      {
        id: 'mr-2',
        ownerUid: 'u1',
        trackId: 'track-green-transitions',
        trackTitle: 'Green Energy Systems & Microgrid Track',
        domain: 'Green Energy',
        mentorId: 'mentor-green-01',
        mentorName: 'Eng. Samuel Kariuki',
        rating: 4,
        comment: 'Great technical guidance during milestone 2 review.',
        createdAtIso: '2026-11-25T12:00:00.000Z',
        updatedAtIso: '2026-11-25T12:00:00.000Z',
      },
    ],
    { trackId: 'track-green-transitions' }
  );
  assert.equal(summaryPopulated.totalRatings, 2);
  assert.equal(summaryPopulated.averageRating, 4.5);
  assert.equal(summaryPopulated.fiveStarCount, 1);
});

test('MentorshipMilestoneTracker generates Mentorship Milestones including First Mentor Intro, Pod Sprint Review, Advanced Problem Framing, Confidence in Problem Framing, and Mastered Sprint Workflow and syncs with MentorshipProgressBar', () => {
  const greenTrack = MENTORSHIP_TRACKS[0];
  const objectives = getLearningObjectivesForTrack(greenTrack);
  assert.equal(objectives.length, 6);
  assert.ok(objectives.some((obj) => obj.title === 'First Mentor Intro'));
  assert.ok(objectives.some((obj) => obj.title === 'Confidence in Problem Framing'));
  assert.ok(objectives.some((obj) => obj.title === 'Advanced Problem Framing'));
  assert.ok(objectives.some((obj) => obj.title === 'Pod Sprint Review'));
  assert.ok(objectives.some((obj) => obj.title === 'Mastered Sprint Workflow'));

  const firstObjId = objectives[0].id;
  const secondObjId = objectives[1].id;

  const afterAddFirst = toggleObjectiveCompletion([], firstObjId);
  assert.deepEqual(afterAddFirst, [firstObjId]);

  const afterAddSecond = toggleObjectiveCompletion(afterAddFirst, secondObjId);
  assert.deepEqual(afterAddSecond, [firstObjId, secondObjId]);

  const afterRemoveFirst = toggleObjectiveCompletion(afterAddSecond, firstObjId);
  assert.deepEqual(afterRemoveFirst, [secondObjId]);

  // Verify bidirectional sync with MentorshipProgressBar when completedObjectiveIds is provided
  const syncedZero = computeMentorshipTrackProgress({
    track: greenTrack,
    mentorshipSessions: [],
    mentorPairings: [],
    contributions: [],
    completedObjectiveIds: [],
  });
  assert.equal(syncedZero.completionPct, 0);
  assert.equal(syncedZero.masteredObjectivesCount, 0);
  assert.equal(syncedZero.totalObjectivesCount, 6);

  const syncedTwoObjectives = computeMentorshipTrackProgress({
    track: greenTrack,
    mentorshipSessions: [],
    mentorPairings: [],
    contributions: [],
    completedObjectiveIds: [firstObjId, secondObjId],
  });
  // 0/4 session milestones + 2/6 learning objectives = 2/10 = 20%
  assert.equal(syncedTwoObjectives.completionPct, 20);
  assert.equal(syncedTwoObjectives.masteredObjectivesCount, 2);

  // Deduplication in compactOfflineQueue for mentor ratings & track progress
  const queue: OfflineMutation[] = [
    {
      id: 'm1',
      kind: 'upsert_mentor_rating',
      payload: {
        id: 'mr-100',
        ownerUid: 'u1',
        trackId: greenTrack.id,
        trackTitle: greenTrack.title,
        domain: greenTrack.domain,
        mentorId: greenTrack.mentorId,
        mentorName: 'Eng. Samuel Kariuki',
        rating: 4,
        comment: 'Initial rating comment',
        createdAtIso: '2026-11-25T10:00:00.000Z',
        updatedAtIso: '2026-11-25T10:00:00.000Z',
      },
      queuedAtIso: '2026-11-25T10:00:00.000Z',
    },
    {
      id: 'm2',
      kind: 'delete_mentor_rating',
      ratingId: 'mr-100',
      queuedAtIso: '2026-11-25T10:05:00.000Z',
    },
    {
      id: 'm3',
      kind: 'upsert_track_progress',
      payload: {
        id: greenTrack.id,
        ownerUid: 'u1',
        trackId: greenTrack.id,
        completedObjectiveIds: [firstObjId],
        createdAtIso: '2026-11-25T10:01:00.000Z',
        updatedAtIso: '2026-11-25T10:01:00.000Z',
      },
      queuedAtIso: '2026-11-25T10:01:00.000Z',
    },
    {
      id: 'm4',
      kind: 'upsert_track_progress',
      payload: {
        id: greenTrack.id,
        ownerUid: 'u1',
        trackId: greenTrack.id,
        completedObjectiveIds: [firstObjId, secondObjId],
        createdAtIso: '2026-11-25T10:01:00.000Z',
        updatedAtIso: '2026-11-25T10:06:00.000Z',
      },
      queuedAtIso: '2026-11-25T10:06:00.000Z',
    },
  ];

  const compacted = compactOfflineQueue(queue);
  assert.equal(compacted.length, 2);
  assert.equal(compacted[0].kind, 'delete_mentor_rating');
  assert.equal(compacted[1].kind, 'upsert_track_progress');
  if (compacted[1].kind === 'upsert_track_progress') {
    assert.deepEqual(compacted[1].payload.completedObjectiveIds, [firstObjId, secondObjId]);
  }
});

test('MentorshipJournal validates reflections, computes Mentor-to-Mentee rubric evaluation, and SessionSummaryExport formats structured chat transcript', () => {
  // 1. Validate journal entry input
  const invalidTitle = validateAndFormatJournalEntry({
    sessionDateIso: '2026-11-25',
    focusTopic: 'qa-architecture',
    reflectionTitle: 'A',
    reflectionBody: 'Reflected on 48V inverter defrost safety margin with mentor.',
    nextActionStep: 'Add 15-minute lockout check.',
  });
  assert.equal(invalidTitle.valid, false);
  assert.ok(invalidTitle.error?.includes('reflection title'));

  const validEntry = validateAndFormatJournalEntry({
    sessionDateIso: '2026-11-25',
    focusTopic: 'qa-architecture',
    reflectionTitle: '  Validated 48V Defrost Safety Threshold  ',
    reflectionBody: '  Confirmed battery voltage sag recovery before compressor restart in clinic cold-chain pod. ',
    nextActionStep: '  Update handover checklist section 3. ',
  });
  assert.equal(validEntry.valid, true);
  assert.equal(validEntry.reflectionTitle, 'Validated 48V Defrost Safety Threshold');
  assert.equal(validEntry.nextActionStep, 'Update handover checklist section 3.');

  // 2. Filter and sort journal entries for a sprint chronologically (newest session date first)
  const filteredEntries = filterAndSortJournalEntries(
    [
      {
        id: 'mj-1',
        ownerUid: 'u1',
        contributionId: 'sub-1',
        briefId: 'sprint-solar-coldchain-01',
        briefTitle: 'Solar Cold-Chain Telemetry',
        mentorId: 'mentor-green-01',
        mentorName: 'Eng. Samuel Kariuki',
        sessionDateIso: '2026-11-20',
        focusTopic: 'technical-unblocker',
        reflectionTitle: 'Initial voltage calibration review',
        reflectionBody: 'Walked through sensor drift compensation.',
        nextActionStep: 'Re-run 24h log.',
        createdAtIso: '2026-11-20T10:00:00.000Z',
        updatedAtIso: '2026-11-20T10:00:00.000Z',
      },
      {
        id: 'mj-2',
        ownerUid: 'u1',
        contributionId: 'sub-1',
        briefId: 'sprint-solar-coldchain-01',
        briefTitle: 'Solar Cold-Chain Telemetry',
        mentorId: 'mentor-green-01',
        mentorName: 'Eng. Samuel Kariuki',
        sessionDateIso: '2026-11-25',
        focusTopic: 'handover-rubric',
        reflectionTitle: 'Final handover sign-off reflection',
        reflectionBody: 'Signed off bilingual maintenance checklist for clinic technicians.',
        nextActionStep: 'Submit final sprint deliverable.',
        createdAtIso: '2026-11-25T12:00:00.000Z',
        updatedAtIso: '2026-11-25T12:00:00.000Z',
      },
      {
        id: 'mj-other',
        ownerUid: 'u1',
        contributionId: 'sub-99',
        briefId: 'sprint-other',
        briefTitle: 'Other Sprint',
        mentorId: 'mentor-tech-03',
        mentorName: 'Amina',
        sessionDateIso: '2026-11-26',
        focusTopic: 'career-rpl',
        reflectionTitle: 'Other sprint reflection',
        reflectionBody: 'Should not appear in solar sprint journal.',
        nextActionStep: '',
        createdAtIso: '2026-11-26T10:00:00.000Z',
        updatedAtIso: '2026-11-26T10:00:00.000Z',
      },
    ],
    {
      contributionId: 'sub-1',
      briefId: 'sprint-solar-coldchain-01',
    }
  );
  assert.equal(filteredEntries.length, 2);
  assert.equal(filteredEntries[0].id, 'mj-2');
  assert.equal(filteredEntries[1].id, 'mj-1');

  // 3. Mentor-to-Mentee 4-dimension rubric evaluation & readiness recommendation
  const podLeadEval = computeMenteeRubricEvaluation({
    sprintId: 'sprint-solar-coldchain-01',
    sprintTitle: 'Solar Cold-Chain Telemetry',
    mentorId: 'mentor-green-01',
    mentorName: 'Eng. Samuel Kariuki',
    menteeName: 'Tariq Al-Mansoor',
    problemFramingScore: 5,
    technicalExecutionScore: 5,
    podCollaborationScore: 4,
    handoverRigorScore: 5,
    endorsementNote: 'Strong diagnostic framing and safety checklist discipline.',
  });
  assert.equal(podLeadEval.compositeScore, 4.75);
  assert.equal(podLeadEval.recommendation, 'lead-ready');

  const independentEval = computeMenteeRubricEvaluation({
    sprintId: 'sprint-solar-coldchain-01',
    sprintTitle: 'Solar Cold-Chain Telemetry',
    mentorId: 'mentor-green-01',
    mentorName: 'Eng. Samuel Kariuki',
    menteeName: 'Tariq Al-Mansoor',
    problemFramingScore: 4,
    technicalExecutionScore: 4,
    podCollaborationScore: 4,
    handoverRigorScore: 4,
    endorsementNote: 'Ready for independent sprint execution.',
  });
  assert.equal(independentEval.compositeScore, 4);
  assert.equal(independentEval.recommendation, 'independent-cleared');

  // 4. SessionSummaryExport structured text builder
  const mentor = POD_MENTORS[0];
  const summaryText = buildMentorshipSessionSummaryText({
    sprintId: 'sprint-solar-coldchain-01',
    sprintTitle: 'Solar Cold-Chain Telemetry',
    mentor,
    contextNote: 'Milestone 2/3 · Draft Ready',
    generatedAtIso: '2026-11-25T18:30:00.000Z',
    messages: [
      {
        id: 'msg-1',
        ownerUid: 'u1',
        sprintId: 'sprint-solar-coldchain-01',
        sprintTitle: 'Solar Cold-Chain Telemetry',
        mentorId: mentor.id,
        mentorName: mentor.name,
        sender: 'practitioner',
        body: 'Requesting QA review on the 48V battery cutoff curve.',
        createdAtIso: '2026-11-25T14:00:00.000Z',
        updatedAtIso: '2026-11-25T14:00:00.000Z',
      },
      {
        id: 'msg-2',
        ownerUid: 'u1',
        sprintId: 'sprint-solar-coldchain-01',
        sprintTitle: 'Solar Cold-Chain Telemetry',
        mentorId: mentor.id,
        mentorName: mentor.name,
        sender: 'mentor',
        body: 'Cutoff curve looks solid — add a 15-minute compressor delay note.',
        createdAtIso: '2026-11-25T14:10:00.000Z',
        updatedAtIso: '2026-11-25T14:10:00.000Z',
      },
    ],
    sessions: [
      {
        id: 'sess-1',
        ownerUid: 'u1',
        sprintId: 'sprint-solar-coldchain-01',
        sprintTitle: 'Solar Cold-Chain Telemetry',
        mentorId: mentor.id,
        mentorName: mentor.name,
        focusTopic: 'qa-architecture',
        durationMinutes: 30,
        status: 'attended',
        takeawayNote: 'Verified 48V cutoff curve and compressor delay threshold.',
        attendedAtIso: '2026-11-25T14:30:00.000Z',
        createdAtIso: '2026-11-25T14:30:00.000Z',
        updatedAtIso: '2026-11-25T14:30:00.000Z',
      },
    ],
  });

  assert.ok(summaryText.includes('KORA POD MENTORSHIP — STRUCTURED SESSION SUMMARY RECORD'));
  assert.ok(summaryText.includes('Solar Cold-Chain Telemetry (sprint-solar-coldchain-01)'));
  assert.ok(summaryText.includes(mentor.name));
  assert.ok(summaryText.includes('Direct Thread Messages: 2 (1 practitioner · 1 mentor)'));
  assert.ok(summaryText.includes('Verified 48V cutoff curve and compressor delay threshold.'));
  assert.ok(summaryText.includes('Requesting QA review on the 48V battery cutoff curve.'));

  // 5. Offline queue deduplication for mentorship journal mutations
  const journalQueue: OfflineMutation[] = [
    {
      id: 'jq-1',
      kind: 'upsert_mentorship_journal',
      payload: filteredEntries[0],
      queuedAtIso: '2026-11-25T12:00:00.000Z',
    },
    {
      id: 'jq-2',
      kind: 'delete_mentorship_journal',
      entryId: filteredEntries[0].id,
      queuedAtIso: '2026-11-25T12:05:00.000Z',
    },
  ];
  const compactedJournalQueue = compactOfflineQueue(journalQueue);
  assert.equal(compactedJournalQueue.length, 1);
  assert.equal(compactedJournalQueue[0].kind, 'delete_mentorship_journal');
});

test('MenteeCompetencyEndorsement awards digital skill badges for completed Pod Sprints and MentorDashboardFeedback closes milestone feedback loops', () => {
  // 1. Eligible completed Pod Sprints extraction & domain normalization
  assert.equal(normalizeBadgeStudioDomain('Cold-Chain Logistics'), 'Green Energy');
  assert.equal(normalizeBadgeStudioDomain('Software & Offline Systems'), 'Tech');
  assert.equal(normalizeBadgeStudioDomain('Maternal Clinic Operations'), 'Healthcare Ops');
  assert.equal(normalizeBadgeStudioDomain('Cooperative Ledger & Working Capital'), 'SME Finance');

  const eligibleSprints = buildEligibleSprintsForEndorsement([
    {
      id: 'sub-done-1',
      ownerUid: 'u1',
      briefId: 'brief-coldchain-03',
      briefTitle: 'Solar-Direct Cold-Chain Compressor Retrofit Plan',
      domain: 'Cold-Chain Logistics',
      status: 'completed',
      solutionNotes: 'Completed compressor retrofit and handover SOP.',
      hoursLogged: 5,
      payoutUsd: 350,
      createdAtIso: '2026-11-20T10:00:00.000Z',
      updatedAtIso: '2026-11-24T10:00:00.000Z',
    },
    {
      id: 'sub-active-2',
      ownerUid: 'u1',
      briefId: 'sprint-remote-sync-03',
      briefTitle: '2G-Resilient Clinic Inventory Sync Engine',
      domain: 'Tech',
      status: 'in-progress',
      solutionNotes: 'Drafting conflict resolution.',
      hoursLogged: 3,
      payoutUsd: 520,
      createdAtIso: '2026-11-24T10:00:00.000Z',
      updatedAtIso: '2026-11-24T10:00:00.000Z',
    },
  ]);
  assert.equal(eligibleSprints.length, 1);
  assert.equal(eligibleSprints[0].sprintId, 'brief-coldchain-03');
  assert.equal(eligibleSprints[0].domain, 'Green Energy');

  // 2. Validate & format digital skill badge and compute earned summary
  const code = generateBadgeVerificationCode('brief-coldchain-03', 'Green Energy');
  assert.ok(code.startsWith('KORA-BADGE-GE-'));

  const preset = DOMAIN_SKILL_BADGE_CATALOG['Green Energy'][0];
  const validBadgeResult = validateAndFormatMenteeBadge({
    sprintId: 'brief-coldchain-03',
    sprintTitle: 'Solar-Direct Cold-Chain Compressor Retrofit Plan',
    domain: 'Green Energy',
    mentorId: 'mentor-green-01',
    mentorName: 'Eng. Samuel Kariuki',
    mentorRole: 'Senior Microgrid & Cold-Chain Architect',
    badgeTitle: preset.badgeTitle,
    skillCategory: preset.skillCategory,
    competencyLevel: 'pod-lead-endorsed',
    citationNote: preset.defaultCitation,
    verificationCode: code,
    awardedAtIso: '2026-11-25',
  });
  assert.equal(validBadgeResult.valid, true);
  assert.ok(validBadgeResult.formatted);
  assert.equal(validBadgeResult.formatted?.competencyLevel, 'pod-lead-endorsed');

  const badgeRecord = {
    id: 'mbadge-1',
    ownerUid: 'u1',
    ...validBadgeResult.formatted!,
    createdAtIso: '2026-11-25T12:00:00.000Z',
    updatedAtIso: '2026-11-25T12:00:00.000Z',
  };
  const badgeSummary = computeEarnedBadgeSummary([badgeRecord]);
  assert.equal(badgeSummary.totalEarned, 1);
  assert.equal(badgeSummary.podLeadEndorsedCount, 1);
  assert.equal(badgeSummary.uniqueDomainsCount, 1);
  assert.equal(badgeSummary.latestAwardedBadge?.id, 'mbadge-1');

  // 3. Validate MentorDashboardFeedback milestone review and compute feedback loop summary
  assert.ok(PROJECT_MILESTONE_CATALOG['analysis-complete']);
  assert.ok(PROJECT_MILESTONE_CATALOG['draft-ready']);
  assert.ok(PROJECT_MILESTONE_CATALOG['final-submission']);

  const fbResult1 = validateAndFormatMilestoneFeedback({
    sprintId: 'sprint-solar-coldchain-01',
    sprintTitle: '48V Cold-Storage & Solar Microgrid Diagnostics Sprint',
    milestoneKey: 'analysis-complete',
    mentorId: 'mentor-green-01',
    mentorName: 'Eng. Samuel Kariuki',
    rating: 5,
    readinessStatus: 'exemplary',
    strengthsNote: 'Isolated night-time battery voltage sag across all 16 LiFePO4 cells.',
    constructiveFeedback: 'Add ambient clinic room temperature delta column to baseline table.',
    nextMilestoneAction: 'Proceed to Gate 2 working schematic.',
  });
  assert.equal(fbResult1.valid, true);
  assert.ok(fbResult1.formatted);

  const fbRecord1 = {
    id: 'mmfb-1',
    ownerUid: 'u1',
    ...fbResult1.formatted!,
    createdAtIso: '2026-11-25T14:00:00.000Z',
    updatedAtIso: '2026-11-25T14:00:00.000Z',
  };

  const chatSummary = formatMilestoneFeedbackForChat(fbRecord1);
  assert.ok(chatSummary.includes('[Milestone Feedback · Gate 1 · Diagnostic Baseline · 5/5 ★ · Exemplary]'));
  assert.ok(chatSummary.includes('Constructive Guidance: Add ambient clinic room temperature delta column to baseline table.'));

  const loopSummary = computeMilestoneFeedbackLoopSummary(
    [fbRecord1],
    'sprint-solar-coldchain-01'
  );
  assert.equal(loopSummary.totalReviews, 1);
  assert.equal(loopSummary.coveredMilestonesCount, 1);
  assert.equal(loopSummary.averageRating, 5);
  assert.equal(loopSummary.approvedOrExemplaryCount, 1);
  assert.equal(loopSummary.loopClosedPct, 33);

  // 4. Offline queue compaction for badge & milestone feedback mutations
  const compacted = compactOfflineQueue([
    {
      id: 'm-b1',
      kind: 'upsert_mentee_badge',
      payload: badgeRecord,
      queuedAtIso: '2026-11-25T12:00:00.000Z',
    },
    {
      id: 'm-b2',
      kind: 'upsert_mentee_badge',
      payload: { ...badgeRecord, competencyLevel: 'specialist-verified' },
      queuedAtIso: '2026-11-25T12:05:00.000Z',
    },
    {
      id: 'm-f1',
      kind: 'upsert_milestone_feedback',
      payload: fbRecord1,
      queuedAtIso: '2026-11-25T14:00:00.000Z',
    },
    {
      id: 'm-f2',
      kind: 'delete_milestone_feedback',
      feedbackId: fbRecord1.id,
      queuedAtIso: '2026-11-25T14:05:00.000Z',
    },
  ]);
  assert.equal(compacted.length, 2);
  assert.equal(
    compacted[0].kind === 'upsert_mentee_badge' && compacted[0].payload.competencyLevel,
    'specialist-verified'
  );
  assert.equal(compacted[1].kind, 'delete_milestone_feedback');
});

test('MentorshipPairingHistory chronological timeline links pairings with shared collaboration notes and MentorshipSessionAgenda validates, tracks, and formats bulleted session agendas', () => {
  // 1. Verify updated age stage labels and entry point copy
  assert.equal(TRANSLATIONS.en.stageSelectorLabel, 'Select age group entry point');
  assert.equal(TRANSLATIONS.en.stage15Title, '15–17yrs Emerging Builder');
  assert.equal(TRANSLATIONS.en.stage18Title, '18–29yrs Early-Career');
  assert.equal(TRANSLATIONS.en.stage30Title, '30–45yrs Specialist');
  assert.equal(TRANSLATIONS.en.stage46Title, '46+ Master Practitioner');

  const stageLabels = Object.values(AGE_STAGE_PATHWAYS).map((p) => p.shortLabel);
  assert.deepEqual(stageLabels, [
    '15–17yrs Emerging Builder',
    '18–29yrs Early-Career',
    '30–45yrs Specialist',
    '46+ Master Practitioner',
  ]);

  // 2. Test MentorshipPairingHistory timeline & collaboration note matching
  const pairings = [
    {
      id: 'pairing-old',
      ownerUid: 'u1',
      trackId: 'track-healthcare-triage',
      trackTitle: 'Rural Clinic Triage & Cold-Chain Systems Track',
      domain: 'Healthcare Ops' as const,
      mentorId: 'mentor-health-01',
      mentorName: 'Dr. Amina Osei',
      sprintId: 'brief-clinic-02',
      sprintTitle: 'Rural Clinic Triage Queue & Cold-Storage Audit',
      sprintGoals: 'Structure bilingual maternal triage intake cards.',
      preferredCadence: 'milestone-gates' as const,
      status: 'matched' as const,
      createdAtIso: '2026-10-12T09:15:00.000Z',
      updatedAtIso: '2026-10-19T14:20:00.000Z',
    },
    {
      id: 'pairing-new',
      ownerUid: 'u1',
      trackId: 'track-green-microgrid',
      trackTitle: '48V Microgrid & Cold-Chain Diagnostics Track',
      domain: 'Green Energy' as const,
      mentorId: 'mentor-green-01',
      mentorName: 'Eng. Samuel Kariuki',
      sprintId: 'brief-solar-clinic-01',
      sprintTitle: '48V Cold-Storage & Solar Microgrid Diagnostics Sprint',
      sprintGoals: 'Master cell-balancing diagnostics and busbar thermal verification.',
      preferredCadence: 'weekly-check-in' as const,
      status: 'active' as const,
      createdAtIso: '2026-11-04T08:30:00.000Z',
      updatedAtIso: '2026-11-18T11:45:00.000Z',
    },
  ];

  const collabNotes = [
    {
      id: 'cnote-1',
      ownerUid: 'u1',
      contributionId: 'contrib-solar-1',
      briefId: 'brief-solar-clinic-01',
      briefTitle: '48V Cold-Storage & Solar Microgrid Diagnostics Sprint',
      markdownBody: 'Verified 48V LiFePO4 voltage sag table across 16 cells.',
      createdAtIso: '2026-11-08T10:15:00.000Z',
      updatedAtIso: '2026-11-08T10:15:00.000Z',
    },
    {
      id: 'cnote-2',
      ownerUid: 'u1',
      contributionId: 'contrib-clinic-1',
      briefId: 'brief-clinic-02',
      briefTitle: 'Rural Clinic Triage Queue & Cold-Storage Audit',
      markdownBody: 'Approved low-literacy icon set for antenatal danger-sign intake.',
      createdAtIso: '2026-10-16T15:10:00.000Z',
      updatedAtIso: '2026-10-16T15:10:00.000Z',
    },
  ];

  const contributions: BriefSubmission[] = [
    {
      id: 'contrib-solar-1',
      ownerUid: 'u1',
      briefId: 'brief-solar-clinic-01',
      briefTitle: '48V Cold-Storage & Solar Microgrid Diagnostics Sprint',
      domain: 'Green Energy',
      status: 'in-progress',
      solutionNotes: 'Working on inverter load balance.',
      hoursLogged: 6,
      payoutUsd: 260,
      createdAtIso: '2026-11-04T08:00:00.000Z',
      updatedAtIso: '2026-11-18T11:45:00.000Z',
    },
  ];

  const matchedNotesForNew = matchCollaborationNotesForPairing(
    pairings[1],
    collabNotes,
    contributions
  );
  assert.equal(matchedNotesForNew.length, 1);
  assert.equal(matchedNotesForNew[0].id, 'cnote-1');

  const linkedContrib = findContributionForPairing(
    pairings[1],
    matchedNotesForNew,
    contributions
  );
  assert.equal(linkedContrib?.id, 'contrib-solar-1');

  const timelineDesc = buildPairingHistoryTimeline({
    pairings,
    collaborationNotes: collabNotes,
    contributions,
  });
  assert.equal(timelineDesc.length, 2);
  assert.equal(timelineDesc[0].pairing.id, 'pairing-new');
  assert.equal(timelineDesc[1].pairing.id, 'pairing-old');

  const filteredGreen = buildPairingHistoryTimeline({
    pairings,
    collaborationNotes: collabNotes,
    contributions,
    domainFilter: 'Green Energy',
  });
  assert.equal(filteredGreen.length, 1);
  assert.equal(filteredGreen[0].pairing.id, 'pairing-new');

  const summary = computePairingHistorySummary(pairings, collabNotes, contributions);
  assert.equal(summary.totalPairings, 2);
  assert.equal(summary.activeCount, 1);
  assert.equal(summary.matchedCount, 1);
  assert.equal(summary.requestedCount, 0);
  assert.deepEqual(summary.domainsCovered, ['Green Energy', 'Healthcare Ops']);
  assert.equal(summary.totalLinkedNotesCount, 2);

  // 3. Test MentorshipSessionAgenda validation, bullet tracking, and chat sharing format
  const invalidAgenda = validateAndFormatSessionAgenda({
    ownerUid: 'u1',
    sprintId: 'brief-solar-clinic-01',
    sprintTitle: '48V Cold-Storage & Solar Microgrid Diagnostics Sprint',
    mentorId: 'mentor-green-01',
    mentorName: 'Eng. Samuel Kariuki',
    sessionDateIso: '2026-11-28',
    focusTopic: 'qa-architecture',
    agendaTitle: 'Hi',
    desiredOutcome: 'Short',
    agendaItems: [],
  });
  assert.equal(invalidAgenda.ok, false);

  const validAgenda = validateAndFormatSessionAgenda({
    ownerUid: 'u1',
    sprintId: 'brief-solar-clinic-01',
    sprintTitle: '48V Cold-Storage & Solar Microgrid Diagnostics Sprint',
    mentorId: 'mentor-green-01',
    mentorName: 'Eng. Samuel Kariuki',
    sessionDateIso: '2026-11-28',
    focusTopic: 'qa-architecture',
    agendaTitle: 'Gate 2 Working Schematic & LVD Cutoff Sync',
    desiredOutcome: 'Lock 44.8V low-voltage disconnect cutoff and copper busbar torque checklist.',
    agendaItems: [
      'Review 48V LiFePO4 cell-delta baseline log across night clinic load',
      'Verify 44.8V low-voltage disconnect threshold before vaccine chiller trip',
      'Confirm final copper busbar torque checklist for Gate 3 handover',
    ],
    sharedWithMentor: true,
    nowIso: '2026-11-25T15:00:00.000Z',
  });
  assert.equal(validAgenda.ok, true);
  if (!validAgenda.ok) {
    throw new Error('Expected validAgenda.ok to be true');
  }
  assert.equal(validAgenda.record.agendaItems.length, 3);

  const toggledRecord = toggleAgendaItemCompletion(
    validAgenda.record,
    0,
    '2026-11-25T15:02:00.000Z'
  );
  const progress = computeSessionAgendaProgress(toggledRecord);
  assert.equal(progress.totalItems, 3);
  assert.equal(progress.completedItems, 1);
  assert.equal(progress.completionPct, 33);
  assert.equal(progress.allCompleted, false);

  const formattedChat = formatSessionAgendaForChat(toggledRecord);
  assert.ok(
    formattedChat.includes(
      '📋 Session Agenda Shared: Gate 2 Working Schematic & LVD Cutoff Sync'
    )
  );
  assert.ok(
    formattedChat.includes(
      '• [x] Review 48V LiFePO4 cell-delta baseline log across night clinic load'
    )
  );
  assert.ok(
    formattedChat.includes(
      '• [ ] Verify 44.8V low-voltage disconnect threshold before vaccine chiller trip'
    )
  );

  // 4. Test offline queue compaction for session agenda mutations
  const compactedAgendas = compactOfflineQueue([
    {
      id: 'mut-ag-1',
      kind: 'upsert_session_agenda',
      payload: toggledRecord,
      queuedAtIso: '2026-11-25T15:00:00.000Z',
    },
    {
      id: 'mut-ag-2',
      kind: 'upsert_session_agenda',
      payload: { ...toggledRecord, agendaTitle: 'Updated Gate 2 Schematic Sync' },
      queuedAtIso: '2026-11-25T15:05:00.000Z',
    },
  ]);
  assert.equal(compactedAgendas.length, 1);
  assert.equal(
    compactedAgendas[0].kind === 'upsert_session_agenda' &&
      compactedAgendas[0].payload.agendaTitle,
    'Updated Gate 2 Schematic Sync'
  );
});

import { parseCalendarSlotToIso } from './talentEngine';
import type { MentorPeerReviewRecord } from '../types/kora';

test('parseCalendarSlotToIso and mentor peer review offline compaction behave deterministically', () => {
  assert.equal(
    parseCalendarSlotToIso('2026-12-04', '14:30 UTC'),
    '2026-12-04T14:30:00.000Z'
  );
  assert.equal(
    parseCalendarSlotToIso('2026-12-04', '09:05'),
    '2026-12-04T09:05:00.000Z'
  );
  // Clamps out-of-range hour safely
  assert.equal(
    parseCalendarSlotToIso('2026-12-04', '29:75'),
    '2026-12-04T23:59:00.000Z'
  );

  const sampleReview: MentorPeerReviewRecord = {
    id: 'mprev-test-1',
    ownerUid: 'u1',
    sprintId: 'sprint-solar-01',
    sprintTitle: '48V Microgrid Diagnostics',
    mentorId: 'mentor-green-01',
    mentorName: 'Eng. Samuel Mutua',
    mentorRole: 'Lead Pod Mentor',
    reviewedDate: '2026-11-26',
    cohesionScore: 5,
    framingScore: 4,
    communicationScore: 5,
    feedbackText: 'Clear handoff logs and rapid blocker escalation across the pod.',
    recommendedAction: 'Archive thermal baseline readings in final handover doc.',
    createdAtIso: '2026-11-26T10:00:00.000Z',
    updatedAtIso: '2026-11-26T10:00:00.000Z',
  };

  const compactedReviews = compactOfflineQueue([
    {
      id: 'mut-pr-1',
      kind: 'upsert_mentor_peer_review',
      payload: sampleReview,
      queuedAtIso: '2026-11-26T10:00:00.000Z',
    },
    {
      id: 'mut-pr-2',
      kind: 'upsert_mentor_peer_review',
      payload: { ...sampleReview, framingScore: 5 },
      queuedAtIso: '2026-11-26T10:02:00.000Z',
    },
    {
      id: 'mut-pr-3',
      kind: 'delete_mentor_peer_review',
      reviewId: sampleReview.id,
      queuedAtIso: '2026-11-26T10:05:00.000Z',
    },
  ]);

  assert.equal(compactedReviews.length, 1);
  assert.equal(compactedReviews[0].kind, 'delete_mentor_peer_review');
});




