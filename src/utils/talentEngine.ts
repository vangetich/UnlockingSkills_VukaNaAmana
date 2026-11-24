import type {
  AgeStage,
  AnalyticsSummary,
  AuthPathwayOption,
  BriefComplexity,
  BriefSubmission,
  CohortBlueprintPreview,
  CompetencyPassport,
  ComplianceCrossingRoute,
  ContractPayout,
  ContractTemplateOption,
  ContractingStructureOption,
  FatfKycTierGuidance,
  FatfKycTierId,
  FinancialPayoutRail,
  FinancialPayoutRailOption,
  IdentityDocumentTier,
  KnowledgeFlowStage,
  LocaleCode,
  MentorMessage,
  MilestoneBadge,
  OfflineMutation,
  OnboardingPackResult,
  PayoutLifecycleStatus,
  PayoutRailOption,
  PeerEndorsement,
  PeerFlywheelMetrics,
  PodMentorProfile,
  PracticalScenario,
  PractitionerProfile,
  ProblemBrief,
  RankedSolutionSprint,
  RegulatoryAccessTier,
  ScaleRegionId,
  ScaleSectorId,
  SdgPulseMetric,
  SharedPassportPayload,
  SkillCapability,
  SolutionSprint,
  SprintComplexityLevel,
  SprintDueAlert,
  SprintFeedback,
  SprintFeedbackSummary,
  SprintPartnerType,
  SprintPerformanceData,
  SprintPerformancePoint,
  StudioDomain,
  TargetWorkMode,
  VerificationStatus,
  WorkReadyVault,
} from '../types/kora';

export const STUDIO_DOMAINS: StudioDomain[] = [
  'Tech',
  'Green Energy',
  'Healthcare Ops',
  'SME Finance',
];

export const BRIEF_COMPLEXITIES: BriefComplexity[] = [
  'Foundational',
  'Applied',
  'Advanced',
];

export const PRACTICE_DOMAINS = [
  'Green Energy',
  'Tech',
  'Healthcare Ops',
  'SME Finance',
  'Water & Sanitation',
  'Cold-Chain Logistics',
  'Structural & Civil Repair',
] as const;

export const PRACTICAL_SCENARIOS: Record<StudioDomain, PracticalScenario> = {
  Tech: {
    id: 'scenario-tech',
    domain: 'Tech',
    title: '2G-Resilient Field Sync & Duplicate Prevention',
    context:
      'A mobile inventory tool used by 40 regional technicians submits supply logs over intermittent 2G data. Users tap "Submit" multiple times during timeouts, causing duplicate stock deductions.',
    question:
      'How would you architect the client queue and API endpoint so retries are safe, offline-resilient, and easy to audit?',
    placeholder:
      'Explain your idempotency key strategy, local queue persistence, retry backoff, and server reconciliation...',
  },
  'Green Energy': {
    id: 'scenario-green-energy',
    domain: 'Green Energy',
    title: '48V Rural Clinic Microgrid Voltage Sag Diagnostics',
    context:
      'A clinic solar microgrid trips on low-voltage disconnect at 03:00 every night even though the inverter reports 54% state-of-charge at dusk. A vaccine fridge is on the critical load bus.',
    question:
      'Walk through your step-by-step electrical isolation, cell-balance testing, and immediate stabilization plan.',
    placeholder:
      'Detail how you check individual cell/block voltages under load, inspect busbar resistance/torques, verify BMS cutoffs, and isolate parasitic draws...',
  },
  'Healthcare Ops': {
    id: 'scenario-healthcare-ops',
    domain: 'Healthcare Ops',
    title: 'Cold-Chain Excursion & Multilingual Intake Triage',
    context:
      'A community health post receives a vaccine shipment whose temperature logger flashed 9.4°C for 90 minutes during transit, while 25 multilingual patients wait for morning maternal triage.',
    question:
      'How do you quarantine and verify cold-chain stock integrity while maintaining safe, dignified patient intake flow?',
    placeholder:
      'Outline your quarantine labeling, manufacturer stability verification, stock rotation, and structured symptom triage handoff...',
  },
  'SME Finance': {
    id: 'scenario-sme-finance',
    domain: 'SME Finance',
    title: 'Small Workshop Cash-Flow Gap & Supplier Reconciliation',
    context:
      'A 14-person fabrication cooperative has strong monthly invoices ($18,000) on 45-day buyer terms, but faces a $4,200 cash shortfall next Friday before raw-material supplier payments are due.',
    question:
      'What immediate cash-flow triage, ledger reconciliation, and working-capital controls would you put in place?',
    placeholder:
      'Describe your 13-week cash forecast, receivable aging follow-up, supplier term staging, and unit-margin review...',
  },
};

export const SEED_BRIEFS: ProblemBrief[] = [
  {
    id: 'brief-solar-clinic-01',
    title: 'Off-Grid Rural Clinic Inverter & Battery Balancing',
    domain: 'Green Energy',
    studioDomain: 'Green Energy',
    complexity: 'Applied',
    organization: 'MedGrid Field Partners',
    locationLabel: 'Remote Diagnostics · Jordan / East Africa',
    summary:
      'Diagnose recurring voltage sags across three 48V LiFePO4 battery banks feeding vaccine refrigeration units and produce a wiring remediation schematic.',
    deliverableChecklist: [
      'Cell-balance diagnostic table from inverter logs',
      'Updated busbar torque and fuse sizing schedule',
      '1-page technician handover guide',
    ],
    estimatedHours: 6,
    payoutUsd: 420,
    recommendedStages: ['18-29', '30-45', '46+'],
    requiredKeywords: ['solar', 'inverter', 'battery', 'microgrid', 'electrical', 'power', 'energy', 'green'],
  },
  {
    id: 'brief-api-06',
    title: 'Low-Bandwidth Offline Sync Queue & Conflict Resolver',
    domain: 'Tech',
    studioDomain: 'Tech',
    complexity: 'Advanced',
    organization: 'OpenField Ledger',
    locationLabel: 'Remote Software Engineering',
    summary:
      'Design an idempotent retry queue for 2G-constrained field inventory tablets so partial form submissions never duplicate records.',
    deliverableChecklist: [
      'Deterministic conflict-resolution state table',
      'TypeScript unit test suite for offline replay',
      'Payload compression benchmark report',
    ],
    estimatedHours: 10,
    payoutUsd: 780,
    recommendedStages: ['18-29', '30-45', '46+'],
    requiredKeywords: ['software', 'api', 'backend', 'offline', 'sync', 'typescript', 'code', 'tech', 'network'],
  },
  {
    id: 'brief-triage-05',
    title: 'Multilingual Maternal Triage Intake Protocol',
    domain: 'Healthcare Ops',
    studioDomain: 'Healthcare Ops',
    complexity: 'Foundational',
    organization: 'Clinics Without Borders',
    locationLabel: 'Remote Clinical Localization',
    summary:
      'Validate Swahili, Arabic, and French obstetric warning-sign phrasing for community health workers operating offline mobile tablets.',
    deliverableChecklist: [
      'Culturally accurate red-flag symptom glossary',
      'Audio pronunciation notes for intake staff',
      'Back-translation verification log',
    ],
    estimatedHours: 4,
    payoutUsd: 290,
    recommendedStages: ['15-17', '18-29', '30-45', '46+'],
    requiredKeywords: ['medical', 'triage', 'translation', 'swahili', 'arabic', 'french', 'clinic', 'health', 'healthcare'],
  },
  {
    id: 'brief-sme-cashflow-07',
    title: '13-Week Working-Capital Ledger for Artisan Cooperative',
    domain: 'SME Finance',
    studioDomain: 'SME Finance',
    complexity: 'Applied',
    organization: 'Levant Craft Guild',
    locationLabel: 'Remote Financial Advisory',
    summary:
      'Build a lightweight multi-currency cash-flow tracker and supplier payment staging schedule for a 16-member regional textile workshop.',
    deliverableChecklist: [
      '13-week rolling cash-flow sheet with receivable aging',
      'Supplier milestone payment calendar',
      'Monthly margin checkup SOP for workshop lead',
    ],
    estimatedHours: 6,
    payoutUsd: 460,
    recommendedStages: ['18-29', '30-45', '46+'],
    requiredKeywords: ['finance', 'accounting', 'cash', 'ledger', 'sme', 'budget', 'invoice', 'reconciliation'],
  },
  {
    id: 'brief-coldchain-03',
    title: 'Solar-Direct Cold-Chain Compressor Retrofit Plan',
    domain: 'Cold-Chain Logistics',
    studioDomain: 'Green Energy',
    complexity: 'Foundational',
    organization: 'HarvestKeep Network',
    locationLabel: 'Remote Engineering · East Africa / Levant',
    summary:
      'Evaluate evaporator frost buildup in 8 mobile agricultural chillers and specify low-draw thermostat retrofit kits.',
    deliverableChecklist: [
      'Thermal loss assessment across door gaskets',
      'Retrofit bill of materials under $180/unit',
      'Commissioning test procedure',
    ],
    estimatedHours: 5,
    payoutUsd: 350,
    recommendedStages: ['15-17', '18-29', '30-45'],
    requiredKeywords: ['cold', 'refrigeration', 'logistics', 'compressor', 'hvac', 'cooling', 'solar'],
  },
  {
    id: 'brief-water-mapping-02',
    title: 'Gravity-Fed Biosand Filtration Flow Calibration',
    domain: 'Water & Sanitation',
    studioDomain: 'Green Energy',
    complexity: 'Advanced',
    organization: 'AquaCommons Cooperative',
    locationLabel: 'Field Advisory · Hybrid',
    summary:
      'Audit turbidity drop rates and hydraulic head loss across 12 community filtration tanks and standardize backwash intervals for local operators.',
    deliverableChecklist: [
      'Hydraulic flow-rate calibration sheet',
      'Turbidity threshold escalation protocol',
      'Operator maintenance checklist',
    ],
    estimatedHours: 8,
    payoutUsd: 540,
    recommendedStages: ['30-45', '46+'],
    requiredKeywords: ['water', 'filtration', 'pipe', 'hydraulic', 'sanitation', 'plumbing', 'pump'],
  },
  {
    id: 'brief-clinic-inventory-08',
    title: 'Cold-Chain Vaccine Excursion & Quarantine Audit SOP',
    domain: 'Healthcare Ops',
    studioDomain: 'Healthcare Ops',
    complexity: 'Applied',
    organization: 'PrimaryCare Relief Grid',
    locationLabel: 'Remote Operations · Regional Hubs',
    summary:
      'Standardize temperature excursion triage steps and lot-quarantine checklists for 9 mobile pharmacy trailers running solar refrigeration.',
    deliverableChecklist: [
      'Excursion threshold decision tree (2°C–8°C)',
      'Bilingual quarantine bin labeling template',
      'Cold-chain supervisor sign-off form',
    ],
    estimatedHours: 5,
    payoutUsd: 390,
    recommendedStages: ['18-29', '30-45', '46+'],
    requiredKeywords: ['healthcare', 'vaccine', 'cold', 'clinic', 'pharmacy', 'triage', 'operations', 'sop'],
  },
  {
    id: 'brief-timber-04',
    title: 'Rapid-Assembly Timber Shelter Truss Reinforcement',
    domain: 'Structural & Civil Repair',
    studioDomain: 'Green Energy',
    complexity: 'Applied',
    organization: 'CivicBuild Collective',
    locationLabel: 'Remote CAD & Field Review',
    summary:
      'Review gusset plate fastener spacing for high-wind modular timber frames and deliver clear carpentry cut-lists using locally milled lumber.',
    deliverableChecklist: [
      'Wind-uplift fastener spacing diagram',
      'Zero-waste lumber cut-list',
      'On-site inspection sign-off sheet',
    ],
    estimatedHours: 7,
    payoutUsd: 480,
    recommendedStages: ['18-29', '30-45', '46+'],
    requiredKeywords: ['timber', 'carpentry', 'structural', 'wood', 'construction', 'roof', 'shelter', 'civil'],
  },
];

export const DEFAULT_SEED_CAPABILITIES: Omit<
  SkillCapability,
  'ownerUid' | 'createdAtIso' | 'updatedAtIso'
>[] = [
  {
    id: 'cap-seed-1',
    title: '48V Solar Inverter & Lithium Bank Diagnostics',
    domain: 'Green Energy',
    proofSummary:
      'Stabilized 3 off-grid health post microgrids by rebalancing cell voltages and replacing corroded DC breakers.',
    portfolioRef: 'Microgrid Load Audit Schematic — Amman Field Hub (2025)',
    certificationRef: 'NABCEP PV Associate Equivalent Field Log',
    peerEndorsement: 'Endorsed by Eng. Rami Al-Khatib, Lead Microgrid Technician',
    verificationStatus: 'field-verified',
    confidenceScore: 84,
  },
  {
    id: 'cap-seed-2',
    title: 'Cold-Chain Thermal Gasket & Compressor Maintenance',
    domain: 'Cold-Chain Logistics',
    proofSummary:
      'Reduced spoilage across 6 regional produce chillers by 34% via airflow baffling and thermostat recalibration.',
    verificationStatus: 'pending',
    confidenceScore: 56,
  },
];

export const DEFAULT_SEED_CONTRIBUTIONS: Omit<
  BriefSubmission,
  'ownerUid' | 'createdAtIso' | 'updatedAtIso'
>[] = [
  {
    id: 'contrib-seed-2',
    briefId: 'sprint-solar-coldchain-01',
    briefTitle: '48V Cold-Storage & Solar Microgrid Diagnostics Sprint',
    domain: 'Green Energy',
    status: 'in-progress',
    solutionNotes:
      'Reviewed night-time inverter CSV logs from Cold-Room #2; isolating cell-pack voltage sag around 02:30.',
    hoursLogged: 2,
    payoutUsd: 480,
  },
  {
    id: 'contrib-seed-1',
    briefId: 'brief-coldchain-03',
    briefTitle: 'Solar-Direct Cold-Chain Compressor Retrofit Plan',
    domain: 'Cold-Chain Logistics',
    status: 'completed',
    solutionNotes:
      'Delivered thermal loss audit, gasket replacement spec, and low-draw thermostat wiring schematic.',
    hoursLogged: 5,
    payoutUsd: 350,
  },
];

export function sanitizeText(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

export function isValidFirebaseId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{1,128}$/.test(id);
}

export function makeSafeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  const ts = Date.now().toString(36);
  return `${prefix}-${ts}-${rand}`.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
}

export function computeBriefMatchScore(
  brief: ProblemBrief,
  problemStatement: string,
  stage: AgeStage,
  capabilities: SkillCapability[],
  passport?: CompetencyPassport | null
): number {
  const passportText = passport
    ? `${passport.studioDomain} ${passport.fieldMatch} ${passport.verifiedSkills.map((s) => s.name).join(' ')}`
    : '';
  const haystack = `${problemStatement} ${passportText} ${capabilities
    .map((c) => `${c.title} ${c.domain} ${c.proofSummary}`)
    .join(' ')}`.toLowerCase();

  let score = brief.recommendedStages.includes(stage) ? 35 : 15;

  let keywordHits = 0;
  for (const kw of brief.requiredKeywords) {
    if (haystack.includes(kw.toLowerCase())) {
      keywordHits += 1;
    }
  }
  score += Math.min(45, keywordHits * 15);

  const domainVerified =
    capabilities.some(
      (c) =>
        (c.domain === brief.domain || c.domain === brief.studioDomain) &&
        c.verificationStatus !== 'pending'
    ) || passport?.studioDomain === brief.studioDomain;

  if (domainVerified) {
    score += 20;
  }

  return Math.min(100, score);
}

export function isPractitionerQualified(
  brief: ProblemBrief,
  matchScore: number,
  capabilities: SkillCapability[],
  passport?: CompetencyPassport | null
): boolean {
  if (brief.complexity === 'Foundational') return true;
  if (matchScore >= 55) return true;
  const hasVerified = capabilities.some((c) => c.verificationStatus !== 'pending');
  if (brief.complexity === 'Applied' && (hasVerified || Boolean(passport))) return true;
  return Boolean(passport && passport.studioDomain === brief.studioDomain);
}

export function promoteVerificationStatus(current: VerificationStatus): {
  nextStatus: VerificationStatus;
  nextConfidence: number;
} {
  if (current === 'pending') {
    return { nextStatus: 'field-verified', nextConfidence: 82 };
  }
  if (current === 'field-verified') {
    return { nextStatus: 'master-endorsed', nextConfidence: 96 };
  }
  return { nextStatus: 'master-endorsed', nextConfidence: 96 };
}

export function filterAndRankBriefs(
  briefs: ProblemBrief[],
  query: string,
  domainFilter: string,
  problemStatement: string,
  stage: AgeStage,
  capabilities: SkillCapability[],
  complexityFilter: 'ALL' | BriefComplexity = 'ALL',
  passport?: CompetencyPassport | null
): Array<ProblemBrief & { matchScore: number; qualified: boolean }> {
  const q = query.trim().toLowerCase();
  return briefs
    .filter((b) => {
      if (domainFilter && domainFilter !== 'ALL' && b.domain !== domainFilter && b.studioDomain !== domainFilter) {
        return false;
      }
      if (complexityFilter !== 'ALL' && b.complexity !== complexityFilter) {
        return false;
      }
      if (!q) return true;
      return (
        b.title.toLowerCase().includes(q) ||
        b.domain.toLowerCase().includes(q) ||
        b.studioDomain.toLowerCase().includes(q) ||
        b.summary.toLowerCase().includes(q) ||
        b.organization.toLowerCase().includes(q)
      );
    })
    .map((b) => {
      const matchScore = computeBriefMatchScore(
        b,
        problemStatement,
        stage,
        capabilities,
        passport
      );
      return {
        ...b,
        matchScore,
        qualified: isPractitionerQualified(b, matchScore, capabilities, passport),
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

export function computeAnalyticsSummary(
  capabilities: SkillCapability[],
  contributions: BriefSubmission[]
): AnalyticsSummary {
  const verifiedCapabilitiesCount = capabilities.filter(
    (c) => c.verificationStatus !== 'pending'
  ).length;
  const completedContributions = contributions.filter((c) => c.status === 'completed');
  const activeBriefsCount = contributions.filter((c) => c.status === 'in-progress').length;
  const totalEarnedUsd = completedContributions.reduce((sum, item) => sum + item.payoutUsd, 0);
  const totalHoursApplied = contributions.reduce((sum, item) => sum + item.hoursLogged, 0);

  const domainMap = new Map<
    string,
    { baselineScore: number; currentScore: number; verifiedCount: number; completedCount: number }
  >();

  for (const cap of capabilities) {
    const existing = domainMap.get(cap.domain) ?? {
      baselineScore: 35,
      currentScore: 35,
      verifiedCount: 0,
      completedCount: 0,
    };
    const isVerified = cap.verificationStatus !== 'pending';
    const nextVerifiedCount = existing.verifiedCount + (isVerified ? 1 : 0);
    const boosted = Math.max(existing.currentScore, cap.confidenceScore);
    domainMap.set(cap.domain, {
      ...existing,
      currentScore: Math.min(100, boosted),
      verifiedCount: nextVerifiedCount,
    });
  }

  for (const contrib of completedContributions) {
    const existing = domainMap.get(contrib.domain) ?? {
      baselineScore: 30,
      currentScore: 45,
      verifiedCount: 0,
      completedCount: 0,
    };
    domainMap.set(contrib.domain, {
      ...existing,
      currentScore: Math.min(100, Math.max(existing.currentScore, 65) + 12),
      completedCount: existing.completedCount + 1,
    });
  }

  const domainGrowth = Array.from(domainMap.entries())
    .map(([domain, metrics]) => ({
      domain,
      ...metrics,
    }))
    .sort((a, b) => b.currentScore - a.currentScore);

  return {
    verifiedCapabilitiesCount,
    totalCapabilitiesCount: capabilities.length,
    completedContributionsCount: completedContributions.length,
    activeBriefsCount,
    totalEarnedUsd,
    totalHoursApplied,
    domainGrowth,
  };
}

export function computeMilestoneBadges(
  capabilities: SkillCapability[],
  contributions: BriefSubmission[],
  passport?: CompetencyPassport | null
): MilestoneBadge[] {
  const confirmedCount = capabilities.filter(
    (c) => c.verificationStatus === 'field-verified' || c.verificationStatus === 'master-endorsed'
  ).length;
  const masterCount = capabilities.filter(
    (c) => c.verificationStatus === 'master-endorsed'
  ).length;
  const completedCount = contributions.filter((c) => c.status === 'completed').length;
  const totalEarnedUsd = contributions
    .filter((c) => c.status === 'completed')
    .reduce((sum, item) => sum + item.payoutUsd, 0);
  const uniqueVerifiedDomains = new Set(
    capabilities.filter((c) => c.verificationStatus !== 'pending').map((c) => c.domain)
  ).size;

  return [
    {
      id: 'badge-field-proven',
      title: 'Field Proven',
      subtitle: 'Confirm at least 1 real-world capability with field evidence',
      tier: 'Foundation',
      unlocked: confirmedCount >= 1,
      currentValue: Math.min(confirmedCount, 1),
      targetValue: 1,
      unit: 'verified skill',
      iconKey: 'shield',
    },
    {
      id: 'badge-first-milestone',
      title: 'Paid Problem Solver',
      subtitle: 'Deliver and close your first paid problem-solving brief',
      tier: 'Foundation',
      unlocked: completedCount >= 1,
      currentValue: Math.min(completedCount, 1),
      targetValue: 1,
      unit: 'brief completed',
      iconKey: 'check',
    },
    {
      id: 'badge-living-passport',
      title: 'Passport Holder',
      subtitle: 'Generate an AI-verified Living Competency Passport',
      tier: 'Field',
      unlocked: Boolean(passport),
      currentValue: passport ? 1 : 0,
      targetValue: 1,
      unit: 'passport',
      iconKey: 'compass',
    },
    {
      id: 'badge-trusted-specialist',
      title: 'Trusted Specialist',
      subtitle: 'Confirm 3 capabilities or complete 2 paid milestones',
      tier: 'Specialist',
      unlocked: confirmedCount >= 3 || completedCount >= 2,
      currentValue:
        confirmedCount >= 3 || completedCount >= 2
          ? 3
          : Math.min(Math.max(confirmedCount, completedCount), 3),
      targetValue: 3,
      unit: 'proof milestones',
      iconKey: 'zap',
    },
    {
      id: 'badge-cross-domain',
      title: 'Multi-Disciplinary Builder',
      subtitle: 'Hold confirmed capabilities across 2+ distinct domains',
      tier: 'Specialist',
      unlocked: uniqueVerifiedDomains >= 2,
      currentValue: Math.min(uniqueVerifiedDomains, 2),
      targetValue: 2,
      unit: 'domains',
      iconKey: 'layers',
    },
    {
      id: 'badge-master-craft',
      title: 'Master Practitioner',
      subtitle: 'Earn Master Endorsement or $1,000+ in verified payouts',
      tier: 'Master',
      unlocked: masterCount >= 1 || totalEarnedUsd >= 1000,
      currentValue: masterCount >= 1 ? 1000 : Math.min(totalEarnedUsd, 1000),
      targetValue: 1000,
      unit: 'USD earned',
      iconKey: 'award',
    },
  ];
}

export function buildLedgerCsv(contributions: BriefSubmission[]): string {
  const header = ['Brief ID', 'Title', 'Domain', 'Status', 'Hours Applied', 'Payout (USD)', 'Updated'];
  const escape = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;
  const rows = contributions.map((c) => [
    escape(c.briefId),
    escape(c.briefTitle),
    escape(c.domain),
    escape(c.status),
    escape(c.hoursLogged),
    escape(c.payoutUsd),
    escape(c.updatedAtIso),
  ]);
  return [header.map(escape).join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function compactOfflineQueue(queue: OfflineMutation[]): OfflineMutation[] {
  const latestProfileIdx = new Map<string, number>();
  const latestCapIdx = new Map<string, number>();
  const latestContribIdx = new Map<string, number>();
  const latestPassportIdx = new Map<string, number>();
  const latestVaultIdx = new Map<string, number>();
  const latestEndorsementIdx = new Map<string, number>();
  const latestPayoutIdx = new Map<string, number>();
  const latestFeedbackIdx = new Map<string, number>();
  const latestMentorMessageIdx = new Map<string, number>();

  queue.forEach((item, index) => {
    if (item.kind === 'upsert_profile') {
      latestProfileIdx.set('profile', index);
    } else if (item.kind === 'upsert_capability') {
      latestCapIdx.set(item.payload.id, index);
    } else if (item.kind === 'delete_capability') {
      latestCapIdx.set(item.capabilityId, index);
    } else if (item.kind === 'upsert_contribution') {
      latestContribIdx.set(item.payload.id, index);
    } else if (item.kind === 'upsert_passport') {
      latestPassportIdx.set(item.payload.id, index);
    } else if (item.kind === 'upsert_vault') {
      latestVaultIdx.set(item.payload.id, index);
    } else if (item.kind === 'upsert_endorsement') {
      latestEndorsementIdx.set(item.payload.id, index);
    } else if (item.kind === 'delete_endorsement') {
      latestEndorsementIdx.set(item.endorsementId, index);
    } else if (item.kind === 'upsert_payout') {
      latestPayoutIdx.set(item.payload.id, index);
    } else if (item.kind === 'upsert_sprint_feedback') {
      latestFeedbackIdx.set(item.payload.id, index);
    } else if (item.kind === 'upsert_mentor_message') {
      latestMentorMessageIdx.set(item.payload.id, index);
    }
  });

  return queue.filter((item, index) => {
    if (item.kind === 'upsert_profile') return latestProfileIdx.get('profile') === index;
    if (item.kind === 'upsert_capability') return latestCapIdx.get(item.payload.id) === index;
    if (item.kind === 'delete_capability') return latestCapIdx.get(item.capabilityId) === index;
    if (item.kind === 'upsert_contribution') return latestContribIdx.get(item.payload.id) === index;
    if (item.kind === 'upsert_passport') return latestPassportIdx.get(item.payload.id) === index;
    if (item.kind === 'upsert_vault') return latestVaultIdx.get(item.payload.id) === index;
    if (item.kind === 'upsert_endorsement') return latestEndorsementIdx.get(item.payload.id) === index;
    if (item.kind === 'delete_endorsement') return latestEndorsementIdx.get(item.endorsementId) === index;
    if (item.kind === 'upsert_payout') return latestPayoutIdx.get(item.payload.id) === index;
    if (item.kind === 'upsert_sprint_feedback') return latestFeedbackIdx.get(item.payload.id) === index;
    if (item.kind === 'upsert_mentor_message') return latestMentorMessageIdx.get(item.payload.id) === index;
    return true;
  });
}

export function normalizeAgeStage(raw?: string | null): AgeStage {
  if (raw === '15-17' || raw === '15-19') return '15-17';
  if (raw === '18-29' || raw === '20-29') return '18-29';
  if (raw === '46+') return '46+';
  return '30-45';
}

export function normalizeLocale(raw?: string | null): 'en' | 'sw' | 'fr' | 'ar' {
  if (raw === 'sw' || raw === 'fr' || raw === 'ar') return raw;
  return 'en';
}

export interface AgeStagePathway {
  stage: AgeStage;
  shortLabel: string;
  headline: string;
  summary: string;
  verificationMode: string;
  workFormat: string;
  mentorshipRole: string;
  typicalFirstBrief: string;
}

export const AGE_STAGE_PATHWAYS: Record<AgeStage, AgeStagePathway> = {
  '15-17': {
    stage: '15-17',
    shortLabel: '15–17 Emerging Builder',
    headline: 'Micro-Badges, Guided Sprints & Protected Mentorship',
    summary:
      'Turn hands-on curiosity into portable proof without waiting years for formal transcripts. Pair with accredited 46+ Master Practitioners on structured, safe community challenges.',
    verificationMode: 'Scenario micro-badges & co-signed practical logs',
    workFormat: 'Mentored 3–5 hour sprints & localized research tasks',
    mentorshipRole: 'Apprentice inside Cross-Age Solution Pods',
    typicalFirstBrief: 'Multilingual Triage Glossary · $290 · 4h est.',
  },
  '18-29': {
    stage: '18-29',
    shortLabel: '18–29 Early-Career',
    headline: 'Independent Paid Briefs & Rapid Micro-Bridging',
    summary:
      'Convert practical skill into Living Competency Passports accepted by regional and remote hiring partners, backed by targeted fee-waiver bridging modules.',
    verificationMode: 'AI Living Competency Passport + portfolio proof',
    workFormat: 'Autonomous milestone-paid technical & ops briefs',
    mentorshipRole: 'Peer collaborator & fast-track field technician',
    typicalFirstBrief: '13-Week Cooperative Cash-Flow Ledger · $460 · 6h est.',
  },
  '30-45': {
    stage: '30-45',
    shortLabel: '30–45 Specialist',
    headline: 'Scoped Systems Delivery & Multi-Brief Leadership',
    summary:
      'Step directly into high-trust diagnostic, engineering, clinical operations, and SME finance contracts where real-world execution outranks displaced paperwork.',
    verificationMode: 'Field-verified diagnostics & compliance-cleared dossier',
    workFormat: 'High-value applied & advanced systems contracts',
    mentorshipRole: 'Pod lead coordinating quality & handover rigor',
    typicalFirstBrief: '48V Rural Clinic Microgrid Balancing · $420–$780',
  },
  '46+': {
    stage: '46+',
    shortLabel: '46+ Master Practitioner',
    headline: 'Accredited Assessor, QA Reviewer & Advisory Pods',
    summary:
      'Your decades of institutional memory and craft mastery anchor the Amana trust layer—auditing deliverables, endorsing emerging talent, and advising partner organizations.',
    verificationMode: 'Master Endorsed authority & peer-assessor credentials',
    workFormat: 'Paid technical QA audits, advisory retainers & sign-off',
    mentorshipRole: 'Accredited mentor leading Cross-Age Solution Pods',
    typicalFirstBrief: 'Biosand Hydraulic Audit & Junior QA Sign-Off · $540+',
  },
};

export function createInitialProfile(partial?: Partial<PractitionerProfile>): PractitionerProfile {
  const now = new Date().toISOString();
  return {
    uid: partial?.uid ?? 'local-practitioner',
    displayName: partial?.displayName ?? 'Practitioner',
    email: partial?.email ?? 'local@vukanaamana.offline',
    problemStatement: partial?.problemStatement ?? '',
    ageStage: normalizeAgeStage(partial?.ageStage ?? '30-45'),
    preferredLocale: normalizeLocale(partial?.preferredLocale ?? 'en'),
    themePreference: partial?.themePreference ?? 'light',
    onboarded: partial?.onboarded ?? false,
    updatedAtIso: partial?.updatedAtIso ?? now,
  };
}

export const AUTH_PATHWAY_OPTIONS: Array<{
  id: AuthPathwayOption;
  label: string;
  plainStep: string;
}> = [
  {
    id: 'remote-contractor',
    label: 'Remote Independent Contractor',
    plainStep: 'Work remotely for global partners using your verified ID and digital invoice.',
  },
  {
    id: 'host-country-permit',
    label: 'Host-Country Work Permit',
    plainStep: 'Contract directly with local organizations under your active regional work authorization.',
  },
  {
    id: 'eor-bridge',
    label: 'Employer-of-Record Bridge',
    plainStep: 'Partner contracts through an accredited regional host while you focus on delivery.',
  },
];

export const CONTRACT_TEMPLATE_OPTIONS: Array<{
  id: ContractTemplateOption;
  label: string;
  plainStep: string;
}> = [
  {
    id: 'milestone-sprint',
    label: 'Fixed-Milestone Sprint Contract',
    plainStep: 'Clear deliverables, plain scope, and automatic release upon milestone sign-off.',
  },
  {
    id: 'local-services',
    label: 'Local Services Agreement',
    plainStep: 'Simple host-country independent services terms written in clear everyday language.',
  },
  {
    id: 'cross-border-advisory',
    label: 'Cross-Border Remote Advisory',
    plainStep: 'Standard international contractor terms protecting your IP rights and payment timeline.',
  },
];

export const PAYOUT_RAIL_OPTIONS: Array<{
  id: PayoutRailOption;
  label: string;
  plainStep: string;
}> = [
  {
    id: 'mobile-money',
    label: 'Mobile Money (M-Pesa / MTN MoMo)',
    plainStep: 'Receive verified milestone payouts straight to your registered mobile money wallet.',
  },
  {
    id: 'local-bank',
    label: 'Local Bank Transfer',
    plainStep: 'Direct settlement into your local currency bank account with transparent receipts.',
  },
  {
    id: 'global-wallet',
    label: 'Global Digital Wallet (USD / EUR)',
    plainStep: 'Fast cross-border payout to Wise, Payoneer, or compliant USD digital wallets.',
  },
];

export function createInitialVault(ownerUid = 'local-practitioner'): WorkReadyVault {
  return {
    id: 'primary-vault',
    ownerUid,
    identityCompleted: true,
    identityPathway: 'remote-contractor',
    contractCompleted: false,
    contractTemplate: 'milestone-sprint',
    payoutCompleted: false,
    payoutRail: 'mobile-money',
    financialIdentityCleared: false,
    financialRailTested: false,
    financialTaxCleared: false,
    financialRail: 'mobile-money',
    onboardingPackGenerated: false,
    onboardingContractStructure: 'scoped-remote',
    onboardingPartnerOrg: '',
    onboardingHostCountry: 'Kenya',
    updatedAtIso: new Date().toISOString(),
  };
}

export function computeVaultReadiness(vault: WorkReadyVault): {
  completedCount: number;
  totalCount: number;
  isFullyReady: boolean;
  percentage: number;
} {
  const completedCount =
    (vault.identityCompleted ? 1 : 0) +
    (vault.contractCompleted ? 1 : 0) +
    (vault.payoutCompleted ? 1 : 0);
  const totalCount = 3;
  return {
    completedCount,
    totalCount,
    isFullyReady: completedCount === totalCount,
    percentage: Math.round((completedCount / totalCount) * 100),
  };
}

export function computeFinancialCrossingProgress(vault: WorkReadyVault): {
  completedCount: number;
  totalCount: number;
  percentage: number;
  isCrossingCleared: boolean;
  selectedRail: FinancialPayoutRail;
} {
  const completedCount =
    (vault.financialIdentityCleared ? 1 : 0) +
    (vault.financialRailTested ? 1 : 0) +
    (vault.financialTaxCleared ? 1 : 0);
  const totalCount = 3;
  return {
    completedCount,
    totalCount,
    percentage: Math.round((completedCount / totalCount) * 100),
    isCrossingCleared: completedCount === totalCount,
    selectedRail: vault.financialRail ?? vault.payoutRail ?? 'mobile-money',
  };
}

export function getAuthPathwayLabel(id: AuthPathwayOption): string {
  return AUTH_PATHWAY_OPTIONS.find((o) => o.id === id)?.label ?? 'Remote Independent Contractor';
}

export function getContractTemplateLabel(id: ContractTemplateOption): string {
  return (
    CONTRACT_TEMPLATE_OPTIONS.find((o) => o.id === id)?.label ??
    'Fixed-Milestone Sprint Contract'
  );
}

export function getPayoutRailLabel(id: PayoutRailOption): string {
  return PAYOUT_RAIL_OPTIONS.find((o) => o.id === id)?.label ?? 'Mobile Money';
}

export function buildSprintAgreementText(params: {
  practitionerName: string;
  partnerOrg: string;
  sprintTitle: string;
  deliverableSummary: string;
  payoutUsd: number;
  durationDays: number;
  vault: WorkReadyVault;
  ageStage: AgeStage;
  verifiedSkillsCount: number;
  passportId?: string | null;
}): string {
  const issuedDate = new Date().toISOString().slice(0, 10);
  const readiness = computeVaultReadiness(params.vault);
  const clearanceLine = readiness.isFullyReady
    ? 'PRE-CLEARED (3/3 Work-Ready Vault Checks Verified)'
    : `IN PROGRESS (${readiness.completedCount}/3 Work-Ready Vault Checks Complete)`;

  return [
    'VUKA NA AMANA — COMPLIANT SPRINT AGREEMENT',
    '============================================================',
    `Agreement Date:       ${issuedDate}`,
    `Compliance Status:    ${clearanceLine}`,
    `Hiring Partner:       ${params.partnerOrg.trim() || 'Partner Organization'}`,
    `Skilled Practitioner: ${params.practitionerName.trim() || 'Practitioner'} (Track: ${params.ageStage})`,
    `Verified Proof:       ${params.verifiedSkillsCount} confirmed capability record(s)${
      params.passportId ? ` · Living Competency Passport ${params.passportId}` : ''
    }`,
    '',
    '1. SPRINT SCOPE & DELIVERABLES',
    `   Brief Title: ${params.sprintTitle.trim() || 'Scoped Problem-Solving Sprint'}`,
    `   Deliverables: ${params.deliverableSummary.trim() || 'Practical diagnostic deliverable and clear handover documentation.'}`,
    `   Target Window: ${Math.max(1, Math.round(params.durationDays))} business days from kickoff.`,
    '',
    '2. WORK-AUTHORIZATION & CONTRACT PATHWAY',
    `   Authorization Mode: ${getAuthPathwayLabel(params.vault.identityPathway)}`,
    `   Agreement Template: ${getContractTemplateLabel(params.vault.contractTemplate)}`,
    '   Plain-Language Rule: The practitioner acts as an independent problem solver delivering',
    '   scoped outputs. No bureaucratic paperwork delays start once both parties sign off.',
    '',
    '3. MILESTONE COMPENSATION & PAYOUT RAIL',
    `   Fixed Milestone Fee: $${Math.max(50, Math.round(params.payoutUsd))} USD`,
    `   Compliant Payout Rail: ${getPayoutRailLabel(params.vault.payoutRail)}`,
    '   Settlement Timing: Released within 3 business days of deliverable acceptance.',
    '',
    '4. DIGNITY, QUALITY & IP TERMS',
    '   Upon full milestone payout, deliverables transfer to the Hiring Partner while the',
    '   Practitioner retains permanent, verifiable credit in their Vuka na Amana Proof Ledger.',
    '',
    '------------------------------------------------------------',
    'Partner Sign-Off: ______________________   Date: __________',
    'Practitioner:     ______________________   Date: __________',
  ].join('\n');
}

export const SOLUTION_SPRINTS: SolutionSprint[] = [
  {
    id: 'sprint-solar-coldchain-01',
    title: '48V Cold-Storage & Solar Microgrid Diagnostics Sprint',
    partnerOrg: 'Rift Valley Cold-Chain Co-op',
    partnerType: 'Local SME',
    durationLabel: '1 Week Sprint',
    estimatedHours: 8,
    payoutUsd: 480,
    domain: 'Green Energy',
    studioDomain: 'Green Energy',
    complexity: 'Applied',
    locationLabel: 'Hybrid · East Africa / Remote Diagnostics',
    painPoint:
      'Three horticultural cold-rooms drop off-grid at 02:30 each night due to cell drift and inverter voltage sags—risking 1.4 tons of produce weekly.',
    deliverableChecklist: [
      'Cell-by-cell load-sag diagnostic matrix from inverter CSV logs',
      'Busbar torque, fuse-sizing, and BMS cutoff remediation guide',
      '1-page technician handover SOP for local operators',
    ],
    podLeadRole: 'Systems Diagnostics Lead & Safety Reviewer',
    podDeliveryRole: 'Field Data Logger & Wiring Schematic Partner',
    requiredKeywords: ['solar', 'inverter', 'battery', 'microgrid', 'cold', 'electrical', 'energy', 'green', 'power'],
  },
  {
    id: 'sprint-ngo-maternal-02',
    title: 'Multilingual Maternal Triage & Cold-Chain SOP Sprint',
    partnerOrg: 'Clinics Without Borders East Africa',
    partnerType: 'NGO',
    durationLabel: '1 Week Sprint',
    estimatedHours: 6,
    payoutUsd: 390,
    domain: 'Healthcare Ops',
    studioDomain: 'Healthcare Ops',
    complexity: 'Foundational',
    locationLabel: 'Remote Clinical Operations',
    painPoint:
      'Nine mobile health posts face 90-minute vaccine transit excursions and inconsistent Swahili/Arabic/French obstetric warning-sign handoffs.',
    deliverableChecklist: [
      '2°C–8°C excursion quarantine decision tree & bin labels',
      'Culturally validated maternal red-flag intake checklist',
      '15-minute shift-handover voice & print protocol',
    ],
    podLeadRole: 'Clinical Ops Lead & Protocol QA Assessor',
    podDeliveryRole: 'Multilingual Localization & Intake Testing Partner',
    requiredKeywords: ['health', 'healthcare', 'clinic', 'triage', 'vaccine', 'medical', 'cold', 'swahili', 'arabic', 'french', 'sop'],
  },
  {
    id: 'sprint-remote-sync-03',
    title: '2G-Resilient Offline Sync Queue & Conflict Resolver Sprint',
    partnerOrg: 'OpenField Ledger',
    partnerType: 'Remote Tech Team',
    durationLabel: '2 Week Sprint',
    estimatedHours: 12,
    payoutUsd: 780,
    domain: 'Tech',
    studioDomain: 'Tech',
    complexity: 'Advanced',
    locationLabel: 'Remote Engineering · Async Pod',
    painPoint:
      'Forty field technicians on intermittent 2G networks accidentally trigger duplicate inventory deductions whenever mobile timeouts cause retries.',
    deliverableChecklist: [
      'Idempotent mutation queue & exponential retry state spec',
      'TypeScript conflict-resolution unit test suite',
      'Low-bandwidth payload benchmark (< 8KB per sync batch)',
    ],
    podLeadRole: 'Architecture Lead & Code Review Mentor',
    podDeliveryRole: 'TypeScript Implementation & Edge-Case QA Partner',
    requiredKeywords: ['tech', 'software', 'api', 'sync', 'offline', 'typescript', 'backend', 'code', 'network', 'mobile'],
  },
  {
    id: 'sprint-sme-cashflow-04',
    title: '13-Week Cash-Flow Ledger & Supplier Staging Sprint',
    partnerOrg: 'Levant Craft & Fabrication Guild',
    partnerType: 'Local SME',
    durationLabel: '10 Day Sprint',
    estimatedHours: 8,
    payoutUsd: 460,
    domain: 'SME Finance',
    studioDomain: 'SME Finance',
    complexity: 'Applied',
    locationLabel: 'Remote Financial Advisory',
    painPoint:
      'A 16-member artisan workshop carries $18k in healthy buyer invoices on 45-day terms but faces recurring Friday supplier liquidity crunches.',
    deliverableChecklist: [
      '13-week rolling multi-currency cash-flow & aging sheet',
      'Supplier milestone staging & early-settlement calendar',
      'Monthly unit-margin checkup playbook for workshop lead',
    ],
    podLeadRole: 'Working-Capital Lead & Financial Reviewer',
    podDeliveryRole: 'Spreadsheet Modeling & Invoice Audit Partner',
    requiredKeywords: ['finance', 'sme', 'cash', 'ledger', 'accounting', 'invoice', 'budget', 'supplier', 'margin'],
  },
];

export function getUserPodSeat(ageStage: AgeStage): 'lead' | 'delivery' {
  return ageStage === '30-45' || ageStage === '46+' ? 'lead' : 'delivery';
}

export function rankSolutionSprints(
  profile: PractitionerProfile,
  capabilities: SkillCapability[],
  passport: CompetencyPassport | null
): RankedSolutionSprint[] {
  const userPodSeat = getUserPodSeat(profile.ageStage);
  const passportSkills = passport?.verifiedSkills.map((s) => s.name) ?? [];
  const verifiedCaps = capabilities.filter((c) => c.verificationStatus !== 'pending');
  const haystack = [
    profile.problemStatement,
    passport?.studioDomain ?? '',
    passport?.fieldMatch ?? '',
    passport?.executiveSummary ?? '',
    ...passportSkills,
    ...capabilities.map((c) => `${c.title} ${c.domain} ${c.proofSummary}`),
  ]
    .join(' ')
    .toLowerCase();

  return SOLUTION_SPRINTS.map((sprint) => {
    let score = 46;
    const matchedKeywords: string[] = [];

    for (const kw of sprint.requiredKeywords) {
      if (haystack.includes(kw.toLowerCase())) {
        matchedKeywords.push(kw);
      }
    }

    score += Math.min(28, matchedKeywords.length * 7);

    const exactPassportDomain = passport?.studioDomain === sprint.studioDomain;
    if (exactPassportDomain) {
      score += 22;
    }

    const matchedCap =
      verifiedCaps.find(
        (c) =>
          c.domain.toLowerCase() === sprint.domain.toLowerCase() ||
          c.domain.toLowerCase() === sprint.studioDomain.toLowerCase()
      ) ??
      capabilities.find(
        (c) =>
          c.domain.toLowerCase() === sprint.domain.toLowerCase() ||
          c.domain.toLowerCase() === sprint.studioDomain.toLowerCase()
      );

    if (matchedCap) {
      score += matchedCap.verificationStatus !== 'pending' ? 14 : 6;
    }

    const finalScore = Math.min(99, Math.max(54, score));

    let whyYouFit: string;
    if (exactPassportDomain && passportSkills.length > 0) {
      whyYouFit = `Matches your ${passport.studioDomain} Living Competency Passport (${passportSkills[0]}) and positions you as ${
        userPodSeat === 'lead' ? 'Pod Lead & Mentor' : 'Delivery Partner'
      }.`;
    } else if (matchedCap) {
      whyYouFit = `Directly builds on your ${
        matchedCap.verificationStatus !== 'pending' ? 'verified' : 'recorded'
      } "${matchedCap.title}" proof and ${sprint.partnerType} scope.`;
    } else if (matchedKeywords.length > 0) {
      whyYouFit = `Aligned with your practical focus on ${matchedKeywords
        .slice(0, 2)
        .join(' & ')} — ready for ${
        userPodSeat === 'lead' ? 'Senior Pod Leadership' : 'Mentored Delivery'
      }.`;
    } else {
      whyYouFit = `Cross-disciplinary ${sprint.partnerType} sprint paired inside a 2-person pod so you can deliver scoped impact quickly.`;
    }

    return {
      ...sprint,
      matchScore: finalScore,
      whyYouFit,
      userPodSeat,
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
}

export const DEFAULT_SEED_ENDORSEMENTS: Omit<
  PeerEndorsement,
  'ownerUid' | 'createdAtIso' | 'updatedAtIso'
>[] = [
  {
    id: 'end-seed-1',
    collaboratorName: 'Eng. Rami Al-Khatib',
    collaboratorRole: 'Lead Microgrid Technician',
    organization: 'Amman Field Hub',
    capabilityTitle: '48V Solar Inverter & Lithium Bank Diagnostics',
    endorsementText:
      'Diagnosed recurring 03:00 clinic inverter trips within two hours and documented a safe cell-balancing schedule our whole crew still uses.',
    status: 'verified',
    shareToken: 'vuka-end-seed01',
    sourceTab: 'verify',
  },
];

export const DEFAULT_SEED_PAYOUTS: Omit<
  ContractPayout,
  'ownerUid' | 'createdAtIso' | 'updatedAtIso'
>[] = [
  {
    id: 'pay-seed-1',
    sprintId: 'sprint-solar-coldchain-01',
    sprintTitle: '48V Cold-Storage & Solar Microgrid Diagnostics Sprint',
    partnerOrg: 'Rift Valley Cold-Chain Co-op',
    amountUsd: 480,
    payoutRail: 'mobile-money',
    status: 'escrow-held',
  },
  {
    id: 'pay-seed-2',
    sprintId: 'brief-coldchain-03',
    sprintTitle: 'Solar-Direct Cold-Chain Compressor Retrofit Plan',
    partnerOrg: 'HarvestKeep Network',
    amountUsd: 350,
    payoutRail: 'mobile-money',
    status: 'released',
  },
];

export function buildEndorsementShareLink(
  origin: string,
  endorsement: Pick<PeerEndorsement, 'shareToken' | 'capabilityTitle'>
): string {
  const safeOrigin = origin.replace(/\/+$/, '');
  const params = new URLSearchParams({
    endorse: endorsement.shareToken,
    skill: endorsement.capabilityTitle,
  });
  return `${safeOrigin}/?${params.toString()}`;
}

export function advancePayoutStatus(current: PayoutLifecycleStatus): PayoutLifecycleStatus {
  if (current === 'escrow-held') return 'processing';
  if (current === 'processing') return 'released';
  return 'released';
}

export const SPRINT_COMPLEXITY_LEVELS: SprintComplexityLevel[] = [
  'Beginner',
  'Intermediate',
  'Advanced',
];

export function getSprintComplexityLevel(complexity: BriefComplexity): SprintComplexityLevel {
  if (complexity === 'Foundational') return 'Beginner';
  if (complexity === 'Applied') return 'Intermediate';
  return 'Advanced';
}

export function filterSolutionSprints(
  sprints: RankedSolutionSprint[],
  levelFilter: 'ALL' | SprintComplexityLevel,
  domainFilter: 'ALL' | StudioDomain
): RankedSolutionSprint[] {
  return sprints.filter((sprint) => {
    if (levelFilter !== 'ALL' && getSprintComplexityLevel(sprint.complexity) !== levelFilter) {
      return false;
    }
    if (domainFilter !== 'ALL' && sprint.studioDomain !== domainFilter) {
      return false;
    }
    return true;
  });
}

function computeUniqueUnlockedEarningsUsd(
  contributions: BriefSubmission[],
  payouts: ContractPayout[]
): number {
  const byKey = new Map<string, number>();
  for (const contrib of contributions) {
    if (contrib.status === 'completed') {
      byKey.set(contrib.briefId, Math.max(byKey.get(contrib.briefId) ?? 0, contrib.payoutUsd));
    }
  }
  for (const payout of payouts) {
    if (payout.status === 'released') {
      byKey.set(payout.sprintId, Math.max(byKey.get(payout.sprintId) ?? 0, payout.amountUsd));
    }
  }
  let total = 0;
  for (const amount of byKey.values()) {
    total += amount;
  }
  return total;
}

export interface ReactivePulseInputs {
  profile: PractitionerProfile;
  capabilities: SkillCapability[];
  passport: CompetencyPassport | null;
  endorsements: PeerEndorsement[];
  vault: WorkReadyVault;
  payouts: ContractPayout[];
  contributions: BriefSubmission[];
}

export function computeSdgPulseMetrics(inputs: ReactivePulseInputs): SdgPulseMetric[] {
  const { profile, capabilities, passport, endorsements, vault, payouts, contributions } = inputs;

  const verifiedCaps = capabilities.filter((c) => c.verificationStatus !== 'pending');
  const masterEndorsedCaps = capabilities.filter((c) => c.verificationStatus === 'master-endorsed');
  const verifiedEndorsements = endorsements.filter((e) => e.status === 'verified');
  const completedContribs = contributions.filter((c) => c.status === 'completed');
  const activeContribs = contributions.filter((c) => c.status === 'in-progress');
  const vaultReadiness = computeVaultReadiness(vault);
  const releasedPayouts = payouts.filter((p) => p.status === 'released');
  const clearedPayouts = payouts.filter((p) => p.status !== 'escrow-held');
  const liveUnlockedUsd = computeUniqueUnlockedEarningsUsd(contributions, payouts);

  // SDG 4: Credentials Verified & Bridging Modules Completed
  const liveSdg4 =
    verifiedCaps.length +
    masterEndorsedCaps.length +
    (passport ? 1 : 0) +
    (passport?.stipendEligible ? 1 : 0) +
    verifiedEndorsements.length;
  const sdg4Total = 140 + liveSdg4;
  const sdg4Story = passport
    ? `${passport.studioDomain} Passport & ${verifiedCaps.length} verified proof(s) bypassed slow paper re-credentialing.`
    : `${verifiedCaps.length} field-verified capability record(s) & ${verifiedEndorsements.length} peer quote(s) converted craft into portable proof.`;

  // SDG 8: Paid Sprints Delivered & Earnings Unlocked
  const onboardingPackCleared = Boolean(vault.onboardingPackGenerated);
  const onboardingSdg8BonusUsd = onboardingPackCleared ? 250 : 0;
  const sdg8EarningsTotal = 18400 + liveUnlockedUsd + onboardingSdg8BonusUsd;
  const sdg8SprintsTotal = 42 + completedContribs.length + (onboardingPackCleared ? 1 : 0);
  const latestCompleted = completedContribs[0] ?? null;
  const contractingLabel = getContractingStructureLabel(
    vault.onboardingContractStructure ?? 'scoped-remote'
  );
  const sdg8Story = onboardingPackCleared
    ? `1-Click Onboarding Pack cleared (${contractingLabel}) + ${completedContribs.length} sprint(s) ready for rapid partner contracting.`
    : latestCompleted
      ? `"${latestCompleted.briefTitle}" delivered $${latestCompleted.payoutUsd} in scoped milestone earnings.`
      : 'Scoped 1–2 week employer pain-point sprints turn idle skill directly into verified household income.';

  // SDG 10: Underemployment Gaps Closed Across Age Brackets
  const uniqueDomains = new Set<string>([
    ...capabilities.map((c) => c.domain),
    ...contributions.map((c) => c.domain),
    ...(passport ? [passport.studioDomain] : []),
  ]);
  const liveSdg10 =
    (profile.onboarded ? 1 : 0) +
    completedContribs.length +
    activeContribs.length +
    uniqueDomains.size;
  const sdg10Total = 64 + liveSdg10;
  const userPodSeat = getUserPodSeat(profile.ageStage);
  const sdg10Story =
    userPodSeat === 'lead'
      ? `${profile.ageStage} Specialist track mentoring 15–29 Delivery Partners inside active cross-age pods.`
      : `${profile.ageStage} Builder co-delivering paid sprints alongside 30–46+ Senior Specialist mentors.`;

  // SDG 16: Legal & Payment Bottlenecks Cleared ("Barriers Cleared")
  const financialCrossing = computeFinancialCrossingProgress(vault);
  const financialBarrierDelta =
    financialCrossing.completedCount + (financialCrossing.isCrossingCleared ? 1 : 0);
  const onboardingBarrierDelta = onboardingPackCleared ? 2 : 0;
  const liveSdg16 =
    vaultReadiness.completedCount +
    financialBarrierDelta +
    onboardingBarrierDelta +
    clearedPayouts.length +
    verifiedEndorsements.length;
  const sdg16Total = 88 + liveSdg16;
  const railLabel = getFinancialPayoutRailLabel(financialCrossing.selectedRail);
  const sdg16Story = onboardingPackCleared
    ? `1-Click Onboarding Pack (${contractingLabel}) + ${railLabel} cleared legal & payout barriers for Hiring Partners.`
    : financialCrossing.isCrossingCleared
      ? `Crossing Cleared across all 3 KYC & payout gates (${railLabel}) — ready to contract and get paid.`
      : vaultReadiness.isFullyReady
        ? `Pre-cleared Work-Ready Vault & ${railLabel} payout rail removed contracting friction completely.`
        : `${vaultReadiness.completedCount}/3 vault · ${financialCrossing.completedCount}/3 payout gates clearing path to ${railLabel}.`;

  // SDG 17: Active Hiring Partners, Mentors & Cross-Age Pods
  const partnerOrgs = new Set<string>();
  for (const payout of payouts) {
    if (payout.partnerOrg.trim()) partnerOrgs.add(payout.partnerOrg.trim());
  }
  for (const endorsement of endorsements) {
    if (endorsement.organization.trim()) partnerOrgs.add(endorsement.organization.trim());
  }
  for (const contrib of contributions) {
    const matchedSprint = SOLUTION_SPRINTS.find((s) => s.id === contrib.briefId);
    if (matchedSprint) partnerOrgs.add(matchedSprint.partnerOrg);
  }
  const liveSdg17 = partnerOrgs.size + contributions.length + endorsements.length;
  const sdg17Total = 36 + liveSdg17;
  const featuredPartner = Array.from(partnerOrgs)[0] ?? 'regional SME & NGO partners';
  const sdg17Story = `${partnerOrgs.size} partner org(s) including ${featuredPartner} linked with ${contributions.length} active/completed pod(s).`;

  return [
    {
      sdgNumber: 4,
      sdgLabel: 'SDG 4',
      title: 'Credentials Verified & Bridging Modules',
      primaryValue: sdg4Total.toLocaleString(),
      numericValue: sdg4Total,
      metricCaption: 'credentials & micro-bridges',
      liveDeltaLabel: `+${liveSdg4} live`,
      microStory: sdg4Story,
      accent: 'emerald',
    },
    {
      sdgNumber: 8,
      sdgLabel: 'SDG 8',
      title: 'Paid Sprints & Earnings Unlocked',
      primaryValue: `$${sdg8EarningsTotal.toLocaleString()}`,
      numericValue: sdg8EarningsTotal,
      metricCaption: onboardingPackCleared
        ? `${sdg8SprintsTotal} paid sprints & onboarding packs`
        : `${sdg8SprintsTotal} paid sprints delivered`,
      liveDeltaLabel: `+$${(liveUnlockedUsd + onboardingSdg8BonusUsd).toLocaleString()} live`,
      microStory: sdg8Story,
      accent: 'terracotta',
    },
    {
      sdgNumber: 10,
      sdgLabel: 'SDG 10',
      title: 'Underemployment Gaps Closed',
      primaryValue: sdg10Total.toLocaleString(),
      numericValue: sdg10Total,
      metricCaption: `across 15–46+ brackets (${profile.ageStage})`,
      liveDeltaLabel: `+${liveSdg10} live`,
      microStory: sdg10Story,
      accent: 'emerald',
    },
    {
      sdgNumber: 16,
      sdgLabel: 'SDG 16',
      title: 'Barriers Cleared · Legal & Payout',
      primaryValue: sdg16Total.toLocaleString(),
      numericValue: sdg16Total,
      metricCaption: financialCrossing.isCrossingCleared
        ? `Crossing Cleared · ${releasedPayouts.length} released`
        : `${financialCrossing.completedCount}/3 payout gates · ${vaultReadiness.completedCount}/3 vault`,
      liveDeltaLabel: `+${liveSdg16} live`,
      microStory: sdg16Story,
      accent: 'terracotta',
    },
    {
      sdgNumber: 17,
      sdgLabel: 'SDG 17',
      title: 'Partners, Mentors & Cross-Age Pods',
      primaryValue: sdg17Total.toLocaleString(),
      numericValue: sdg17Total,
      metricCaption: `${partnerOrgs.size} partners · ${contributions.length} pods`,
      liveDeltaLabel: `+${liveSdg17} live`,
      microStory: sdg17Story,
      accent: 'emerald',
    },
  ];
}

export function computeKnowledgeToWorkFlow(inputs: ReactivePulseInputs): KnowledgeFlowStage[] {
  const { profile, capabilities, passport, endorsements, vault, payouts, contributions } = inputs;

  const verifiedCaps = capabilities.filter((c) => c.verificationStatus !== 'pending').length;
  const masterEndorsedCaps = capabilities.filter(
    (c) => c.verificationStatus === 'master-endorsed'
  ).length;
  const verifiedEndorsements = endorsements.filter((e) => e.status === 'verified').length;
  const vaultReadiness = computeVaultReadiness(vault);
  const financialCrossing = computeFinancialCrossingProgress(vault);
  const clearedPayouts = payouts.filter((p) => p.status !== 'escrow-held').length;
  const releasedPayouts = payouts.filter((p) => p.status === 'released').length;
  const completedContribs = contributions.filter((c) => c.status === 'completed').length;
  const liveUnlockedUsd = computeUniqueUnlockedEarningsUsd(contributions, payouts);

  const intakeCount =
    220 + (profile.problemStatement.trim().length > 0 ? 1 : 0) + capabilities.length;
  const passportCount =
    168 + verifiedCaps + masterEndorsedCaps + (passport ? 1 : 0) + verifiedEndorsements;
  const payoutCount =
    134 +
    vaultReadiness.completedCount +
    financialCrossing.completedCount +
    (financialCrossing.isCrossingCleared ? 1 : 0) +
    (vault.onboardingPackGenerated ? 1 : 0) +
    clearedPayouts;
  const placementCount =
    98 + completedContribs + releasedPayouts + (completedContribs >= 2 ? 1 : 0);

  const passportConv = Math.min(100, Math.round((passportCount / Math.max(1, intakeCount)) * 100));
  const payoutConv = Math.min(100, Math.round((payoutCount / Math.max(1, passportCount)) * 100));
  const placementConv = Math.min(
    100,
    Math.round((placementCount / Math.max(1, payoutCount)) * 100)
  );

  return [
    {
      id: 'intake',
      stepNumber: '01',
      label: 'Paperless Intake',
      count: intakeCount,
      conversionPct: 100,
      status: 'verified',
      microCaption: `${capabilities.length} practical proof record(s) logged via voice or text`,
    },
    {
      id: 'passport',
      stepNumber: '02',
      label: 'Verified Passport',
      count: passportCount,
      conversionPct: passportConv,
      status: passport || verifiedCaps > 0 ? 'verified' : 'active',
      microCaption: passport
        ? `${passport.studioDomain} Passport active · ${verifiedEndorsements} peer quote(s)`
        : `${verifiedCaps} verified skill(s) ready for Living Passport`,
    },
    {
      id: 'payout',
      stepNumber: '03',
      label: 'Compliant Payout',
      count: payoutCount,
      conversionPct: payoutConv,
      status:
        vaultReadiness.isFullyReady || financialCrossing.isCrossingCleared || releasedPayouts > 0
          ? 'verified'
          : 'active',
      microCaption: financialCrossing.isCrossingCleared
        ? `Crossing Cleared · ${getFinancialPayoutRailLabel(financialCrossing.selectedRail)}`
        : `${vaultReadiness.completedCount}/3 Vault · ${financialCrossing.completedCount}/3 KYC gates`,
    },
    {
      id: 'placement',
      stepNumber: '04',
      label: 'Paid Placement',
      count: placementCount,
      conversionPct: placementConv,
      status:
        completedContribs >= 2 ? 'verified' : completedContribs >= 1 ? 'active' : 'ready',
      microCaption: `${completedContribs} sprint(s) delivered · $${liveUnlockedUsd.toLocaleString()} unlocked`,
    },
  ];
}

export function computeSprintPerformanceSeries(
  contributions: BriefSubmission[],
  payouts: ContractPayout[]
): SprintPerformanceData {
  // Merge contributions and payouts by sprint/brief ID so each real sprint appears once chronologically
  const timelineMap = new Map<
    string,
    {
      sprintId: string;
      timestampMs: number;
      accepted: boolean;
      earnedUsd: number;
      labelHint: string;
    }
  >();

  const toTimeMs = (iso?: string): number => {
    if (!iso) return 0;
    const parsed = Date.parse(iso);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  for (const contrib of contributions) {
    const existing = timelineMap.get(contrib.briefId);
    const ts = toTimeMs(contrib.updatedAtIso || contrib.createdAtIso);
    const isCompleted = contrib.status === 'completed';
    const earned = isCompleted ? contrib.payoutUsd : 0;

    if (!existing) {
      timelineMap.set(contrib.briefId, {
        sprintId: contrib.briefId,
        timestampMs: ts,
        accepted: isCompleted,
        earnedUsd: earned,
        labelHint: contrib.briefTitle,
      });
    } else {
      existing.timestampMs = Math.max(existing.timestampMs, ts);
      existing.accepted = existing.accepted || isCompleted;
      existing.earnedUsd = Math.max(existing.earnedUsd, earned);
    }
  }

  for (const payout of payouts) {
    const existing = timelineMap.get(payout.sprintId);
    const ts = toTimeMs(payout.updatedAtIso || payout.createdAtIso);
    const isReleased = payout.status === 'released';
    const earned = isReleased ? payout.amountUsd : 0;

    if (!existing) {
      timelineMap.set(payout.sprintId, {
        sprintId: payout.sprintId,
        timestampMs: ts,
        accepted: isReleased,
        earnedUsd: earned,
        labelHint: payout.sprintTitle,
      });
    } else {
      existing.timestampMs = Math.max(existing.timestampMs, ts);
      existing.accepted = existing.accepted || isReleased;
      existing.earnedUsd = Math.max(existing.earnedUsd, earned);
    }
  }

  const orderedRecords = Array.from(timelineMap.values()).sort(
    (a, b) => a.timestampMs - b.timestampMs || a.sprintId.localeCompare(b.sprintId)
  );

  const completedContribs = contributions.filter((c) => c.status === 'completed');
  const releasedPayouts = payouts.filter((p) => p.status === 'released');
  const completedCount = orderedRecords.filter((r) => r.accepted).length;
  const totalPodsCount = orderedRecords.length;

  const points: SprintPerformancePoint[] = [];

  if (orderedRecords.length === 0) {
    points.push(
      { label: 'Start', acceptanceRatePct: 0, payoutUsd: 0 },
      { label: 'Live', acceptanceRatePct: 0, payoutUsd: 0 }
    );
  } else {
    // Include an origin anchor when fewer than 3 records exist so the sparkline plots a clear progression curve
    if (orderedRecords.length < 3) {
      points.push({ label: 'Start', acceptanceRatePct: 0, payoutUsd: 0 });
    }

    let acceptedSoFar = 0;
    let cumulativeUsd = 0;

    orderedRecords.forEach((rec, idx) => {
      if (rec.accepted) acceptedSoFar += 1;
      cumulativeUsd += rec.earnedUsd;
      const ratePct = Math.round((acceptedSoFar / (idx + 1)) * 100);
      const isLast = idx === orderedRecords.length - 1;
      points.push({
        label: isLast && orderedRecords.length > 1 ? 'Live' : `S${idx + 1}`,
        acceptanceRatePct: ratePct,
        payoutUsd: cumulativeUsd,
      });
    });
  }

  const currentAcceptanceRatePct =
    orderedRecords.length > 0
      ? Math.round((completedCount / orderedRecords.length) * 100)
      : 0;

  // Compare latest real sprint acceptance rate against the previous real sprint point (or 0 if first sprint)
  const realPoints = orderedRecords.length < 3 ? points.slice(1) : points;
  const acceptanceDeltaPct =
    realPoints.length >= 2
      ? realPoints[realPoints.length - 1].acceptanceRatePct -
        realPoints[realPoints.length - 2].acceptanceRatePct
      : currentAcceptanceRatePct;

  const totalHistoricalEarningsUsd = computeUniqueUnlockedEarningsUsd(contributions, payouts);

  const latestEarnedRecord = [...orderedRecords].reverse().find((r) => r.earnedUsd > 0);
  const latestPayoutUsd =
    latestEarnedRecord?.earnedUsd ??
    completedContribs[0]?.payoutUsd ??
    releasedPayouts[0]?.amountUsd ??
    0;

  return {
    points,
    currentAcceptanceRatePct,
    acceptanceDeltaPct,
    totalHistoricalEarningsUsd,
    latestPayoutUsd,
    completedCount,
    totalPodsCount,
  };
}

export const SCALE_REGIONS: Array<{
  id: ScaleRegionId;
  label: string;
  hubCities: string;
  defaultLocale: LocaleCode;
  compliancePathwayLabel: string;
  payoutRail: PayoutRailOption;
  payoutRailLocalLabel: string;
  complianceChecklist: string[];
}> = [
  {
    id: 'kenya',
    label: 'Kenya',
    hubCities: 'Kakuma · Kalobeyei · Nairobi',
    defaultLocale: 'sw',
    compliancePathwayLabel: 'Kenya Refugees Act Work-Permit & Digital Contractor Bridge',
    payoutRail: 'mobile-money',
    payoutRailLocalLabel: 'M-Pesa Business Till / Equity Mobile',
    complianceChecklist: [
      'Refugee ID / Alien Card verified for local & remote contracting',
      'Plain-language Kenyan fixed-milestone independent sprint agreement',
      'Instant M-Pesa / local bank settlement with automated tax receipt',
    ],
  },
  {
    id: 'jordan',
    label: 'Jordan',
    hubCities: 'Amman · Irbid · Za’atari',
    defaultLocale: 'ar',
    compliancePathwayLabel: 'Jordan Compact Flexible Permit & Remote EOR Bridge',
    payoutRail: 'mobile-money',
    payoutRailLocalLabel: 'JoMoPay / Zain Cash / Local IBAN',
    complianceChecklist: [
      'UNHCR / Ministry of Interior ID mapped to flexible sector permit',
      'Bilingual Arabic–English scoped sprint agreement (no long-form HR delay)',
      'Compliant JoMoPay digital wallet or local IBAN escrow payout',
    ],
  },
  {
    id: 'uganda',
    label: 'Uganda',
    hubCities: 'Kampala · Nakivale · Bidi Bidi',
    defaultLocale: 'en',
    compliancePathwayLabel: 'Uganda Self-Reliance Open Work Authorization',
    payoutRail: 'mobile-money',
    payoutRailLocalLabel: 'MTN MoMo / Airtel Money Uganda',
    complianceChecklist: [
      'OPM Refugee ID cleared for direct SME & NGO service contracts',
      'Zero-jargon milestone scope protecting practitioner IP attribution',
      'Direct MTN MoMo / Airtel Money milestone release in under 24h',
    ],
  },
  {
    id: 'colombia',
    label: 'Colombia',
    hubCities: 'Bogotá · Medellín · Cúcuta',
    defaultLocale: 'en',
    compliancePathwayLabel: 'PPT (Permiso por Protección Temporal) Contractor Track',
    payoutRail: 'local-bank',
    payoutRailLocalLabel: 'Nequi / Bancolombia / USD Global Wallet',
    complianceChecklist: [
      'PPT temporary protection credential verified in 1 paperless step',
      'Standard prestación de servicios sprint template auto-filled',
      'Nequi / Bancolombia or USD wallet settlement on sprint sign-off',
    ],
  },
  {
    id: 'poland',
    label: 'Poland',
    hubCities: 'Warsaw · Kraków · Gdańsk',
    defaultLocale: 'en',
    compliancePathwayLabel: 'EU Temporary Protection & Cross-Border Remote Track',
    payoutRail: 'global-wallet',
    payoutRailLocalLabel: 'SEPA Instant / BLIK / Wise EUR',
    complianceChecklist: [
      'PESEL UKR / EU Temporary Protection cleared for immediate remote work',
      'EU-compliant independent contractor milestone sprint agreement',
      'SEPA Instant EUR or Wise digital wallet escrow release',
    ],
  },
];

export const SCALE_SECTORS: Array<{
  id: ScaleSectorId;
  label: string;
  studioDomain: StudioDomain;
  diagnosticTitle: string;
  diagnosticFocus: string;
  sprintTemplates: Array<{
    title: string;
    partnerType: SprintPartnerType;
    durationLabel: string;
    payoutUsd: number;
  }>;
}> = [
  {
    id: 'solar',
    label: 'Solar & Clean Energy',
    studioDomain: 'Green Energy',
    diagnosticTitle: '48V Microgrid Load-Sag & Inverter Fault Isolation',
    diagnosticFocus:
      'Auto-evaluates practical cell balancing, DC breaker safety, and field handover documentation without requiring original university transcripts.',
    sprintTemplates: [
      {
        title: 'Clinic Solar Inverter & Battery Bank Commissioning Audit',
        partnerType: 'Local SME',
        durationLabel: '1 Week Sprint',
        payoutUsd: 480,
      },
      {
        title: 'Community Mini-Grid Tariff & Metering Diagnostics',
        partnerType: 'NGO',
        durationLabel: '10 Day Sprint',
        payoutUsd: 560,
      },
    ],
  },
  {
    id: 'agritech',
    label: 'Agritech & Cold-Chain',
    studioDomain: 'Green Energy',
    diagnosticTitle: 'Solar Cold-Room Spoilage & Moisture Telemetry Triage',
    diagnosticFocus:
      'Assesses thermal loss diagnostics, low-power sensor calibration, and smallholder post-harvest storage workflows via voice or text.',
    sprintTemplates: [
      {
        title: 'Horticultural Cold-Storage Thermal Gasket Retrofit Spec',
        partnerType: 'Local SME',
        durationLabel: '1 Week Sprint',
        payoutUsd: 440,
      },
      {
        title: 'Cooperative Harvest Grading & SMS Price Alert Playbook',
        partnerType: 'NGO',
        durationLabel: '10 Day Sprint',
        payoutUsd: 490,
      },
    ],
  },
  {
    id: 'digital-services',
    label: 'Digital Services & Tech',
    studioDomain: 'Tech',
    diagnosticTitle: '2G-Resilient Offline Sync Queue & QA Architecture',
    diagnosticFocus:
      'Tests practical idempotent API design, low-bandwidth mobile resilience, and clean bug-reproduction triage in 2 minutes.',
    sprintTemplates: [
      {
        title: 'Low-Bandwidth Field Inventory Sync & Retry Hardening',
        partnerType: 'Remote Tech Team',
        durationLabel: '2 Week Sprint',
        payoutUsd: 780,
      },
      {
        title: 'Multilingual WhatsApp/SMS Support Bot QA & Localization',
        partnerType: 'Local SME',
        durationLabel: '1 Week Sprint',
        payoutUsd: 420,
      },
    ],
  },
  {
    id: 'healthcare-ops',
    label: 'Healthcare Operations',
    studioDomain: 'Healthcare Ops',
    diagnosticTitle: 'Vaccine Cold-Chain Excursion & Multilingual Triage Protocol',
    diagnosticFocus:
      'Verifies safe cold-chain quarantine decisions, patient dignity standards, and multilingual shift handoff clarity.',
    sprintTemplates: [
      {
        title: 'Mobile Clinic Maternal Warning-Sign Intake Localization',
        partnerType: 'NGO',
        durationLabel: '1 Week Sprint',
        payoutUsd: 390,
      },
      {
        title: 'Regional Pharmacy Stock-Out & Expiry Rotation Audit',
        partnerType: 'Local SME',
        durationLabel: '10 Day Sprint',
        payoutUsd: 460,
      },
    ],
  },
  {
    id: 'sme-finance',
    label: 'SME Finance & Craft',
    studioDomain: 'SME Finance',
    diagnosticTitle: '13-Week Workshop Cash-Flow & Supplier Reconciliation',
    diagnosticFocus:
      'Scores working-capital forecasting, receivable aging follow-up, and unit-margin discipline for cooperative workshops.',
    sprintTemplates: [
      {
        title: 'Artisan Guild Working-Capital & Supplier Staging Ledger',
        partnerType: 'Local SME',
        durationLabel: '10 Day Sprint',
        payoutUsd: 460,
      },
      {
        title: 'Micro-Enterprise Invoice Tracking & Mobile Money Reconciliation',
        partnerType: 'NGO',
        durationLabel: '1 Week Sprint',
        payoutUsd: 380,
      },
    ],
  },
];

const LANGUAGE_LABELS: Record<LocaleCode, string> = {
  en: 'English (Voice + Text)',
  sw: 'Kiswahili (Voice + Text)',
  fr: 'Français (Voice + Text)',
  ar: 'العربية RTL (Voice + Text)',
};

export function buildCohortBlueprint(
  regionId: ScaleRegionId,
  sectorId: ScaleSectorId,
  languageCode: LocaleCode
): CohortBlueprintPreview {
  const region = SCALE_REGIONS.find((r) => r.id === regionId) ?? SCALE_REGIONS[0];
  const sector = SCALE_SECTORS.find((s) => s.id === sectorId) ?? SCALE_SECTORS[0];
  const languageLabel = LANGUAGE_LABELS[languageCode] ?? LANGUAGE_LABELS.en;

  return {
    regionId: region.id,
    regionLabel: region.label,
    hubCities: region.hubCities,
    sectorId: sector.id,
    sectorLabel: sector.label,
    studioDomain: sector.studioDomain,
    languageCode,
    languageLabel,
    aiDiagnosticTitle: `${sector.diagnosticTitle} (${region.label})`,
    aiDiagnosticSummary: `${sector.diagnosticFocus} Prompted natively in ${languageLabel}.`,
    compliancePathwayLabel: region.compliancePathwayLabel,
    complianceChecklist: region.complianceChecklist,
    payoutRail: region.payoutRail,
    payoutRailLocalLabel: region.payoutRailLocalLabel,
    sprintTemplates: sector.sprintTemplates.map((tpl) => ({
      ...tpl,
      title: `${region.label}: ${tpl.title}`,
    })),
    estimatedLaunchTime: 'Under 4 minutes · Zero custom engineering',
  };
}

export function computePeerFlywheelMetrics(
  cohortSize: number,
  flywheelEnabled: boolean,
  userVerifiedCount = 1
): PeerFlywheelMetrics {
  const safeSize = Math.max(20, Math.round(cohortSize));
  const baselineAdminHours = Math.max(8, Math.round(safeSize * 0.36));

  if (!flywheelEnabled) {
    return {
      cohortSize: safeSize,
      flywheelEnabled: false,
      graduatedMastersAndSpecialists: 0,
      emergingBuildersMentored: 0,
      manualAdminHoursPerWeek: baselineAdminHours,
      overheadReductionPct: 0,
      assessorMonthlyStipendUsd: 0,
      qaTurnaroundHours: 72,
      sustainabilityLabel: 'Centralized Bottleneck · Linear staff cost per cohort',
    };
  }

  const graduatedMastersAndSpecialists = Math.max(
    6,
    Math.round(safeSize * 0.22) + Math.min(3, Math.max(0, userVerifiedCount))
  );
  const emergingBuildersMentored = Math.min(
    Math.round(safeSize * 0.78),
    graduatedMastersAndSpecialists * 4
  );
  const manualAdminHoursPerWeek = Math.max(2.5, Math.round((baselineAdminHours * 0.14) * 10) / 10);
  const overheadReductionPct = Math.min(
    92,
    Math.round(((baselineAdminHours - manualAdminHoursPerWeek) / baselineAdminHours) * 100)
  );
  const assessorMonthlyStipendUsd = safeSize >= 500 ? 420 : safeSize >= 200 ? 340 : 260;

  return {
    cohortSize: safeSize,
    flywheelEnabled: true,
    graduatedMastersAndSpecialists,
    emergingBuildersMentored,
    manualAdminHoursPerWeek,
    overheadReductionPct,
    assessorMonthlyStipendUsd,
    qaTurnaroundHours: 6,
    sustainabilityLabel: 'Self-Sustaining Peer QA · 30–46+ Masters mentor 15–29 talent',
  };
}

function computePassportSignature(seed: string): string {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const hex = (hash >>> 0).toString(16).toUpperCase().padStart(8, '0');
  return `VNA-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
}

function encodeUtf8Base64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeUtf8Base64Url(token: string): string | null {
  if (!/^[A-Za-z0-9_-]{8,16000}$/.test(token)) return null;
  const padded = token.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((token.length + 3) % 4);
  try {
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

export function buildSharedPassportPayload(params: {
  profile: PractitionerProfile;
  passport: CompetencyPassport | null;
  capabilities: SkillCapability[];
  endorsements: PeerEndorsement[];
}): SharedPassportPayload {
  const { profile, passport, capabilities, endorsements } = params;
  const verifiedCaps = capabilities.filter((c) => c.verificationStatus !== 'pending');
  const verifiedEndorsements = endorsements
    .filter((e) => e.status === 'verified' && e.endorsementText.trim().length > 0)
    .slice(0, 3)
    .map((e) => ({
      collaboratorName: sanitizeText(e.collaboratorName, 80),
      collaboratorRole: sanitizeText(e.collaboratorRole, 80),
      organization: sanitizeText(e.organization, 80),
      endorsementText: sanitizeText(e.endorsementText, 240),
    }));

  const primaryDomain: StudioDomain =
    passport?.studioDomain ??
    (verifiedCaps[0]?.domain === 'Tech' ||
    verifiedCaps[0]?.domain === 'Green Energy' ||
    verifiedCaps[0]?.domain === 'Healthcare Ops' ||
    verifiedCaps[0]?.domain === 'SME Finance'
      ? verifiedCaps[0].domain
      : 'Green Energy');

  const skills =
    passport?.verifiedSkills.slice(0, 4).map((s) => ({
      name: sanitizeText(s.name, 90),
      confidenceLabel: sanitizeText(s.confidenceLabel, 40),
      confidenceScore: Math.max(0, Math.min(100, Math.round(s.confidenceScore))),
      evidenceNote: sanitizeText(s.evidenceNote, 180),
    })) ??
    (verifiedCaps.length > 0 ? verifiedCaps : capabilities).slice(0, 4).map((cap) => ({
      name: sanitizeText(cap.title, 90),
      confidenceLabel:
        cap.verificationStatus === 'master-endorsed'
          ? 'Master Endorsed'
          : cap.verificationStatus === 'field-verified'
            ? 'Field Verified'
            : 'In Review',
      confidenceScore: Math.max(0, Math.min(100, Math.round(cap.confidenceScore))),
      evidenceNote: sanitizeText(cap.proofSummary, 180),
    }));

  const passportId = passport?.id ?? `vna-${profile.ageStage}-ledger`;
  const generatedAtIso = passport?.generatedAtIso ?? new Date().toISOString();
  const fieldMatch = sanitizeText(
    passport?.fieldMatch ??
      (verifiedCaps[0]?.title || `${primaryDomain} Practical Field Specialist`),
    110
  );
  const executiveSummary = sanitizeText(
    passport?.executiveSummary ??
      (profile.problemStatement ||
        'Verified hands-on practitioner delivering scoped, evidence-backed problem solving across local and remote engagements.'),
    320
  );

  const signatureSeed = `${passportId}|${profile.displayName}|${primaryDomain}|${skills
    .map((s) => `${s.name}:${s.confidenceScore}`)
    .join(',')}|${verifiedEndorsements.length}`;

  return {
    passportId,
    practitionerName: sanitizeText(profile.displayName || 'Skilled Practitioner', 80),
    ageStage: profile.ageStage,
    studioDomain: primaryDomain,
    fieldMatch,
    ageStageTrack: sanitizeText(
      passport?.ageStageTrack ?? AGE_STAGE_PATHWAYS[profile.ageStage].shortLabel,
      90
    ),
    executiveSummary,
    verifiedSkills: skills,
    microBridge: passport?.microBridge ?? {
      title: `${primaryDomain} Regional Recognition Micro-Bridge`,
      action: 'Complete a 4-hour partner alignment module for accelerated enterprise contracting.',
      estimatedDuration: '4 hours · Self-paced',
      partnerProgram: 'Vuka na Amana Guild Partners',
    },
    stipendEligible: Boolean(passport?.stipendEligible),
    verifiedCapabilitiesCount: verifiedCaps.length,
    verifiedEndorsements,
    generatedAtIso,
    readOnlySignature: computePassportSignature(signatureSeed),
  };
}

export function buildSharedPassportLink(origin: string, payload: SharedPassportPayload): string {
  const safeOrigin = origin.replace(/\/+$/, '');
  const token = encodeUtf8Base64Url(JSON.stringify(payload));
  const params = new URLSearchParams({ passport: token });
  return `${safeOrigin}/?${params.toString()}`;
}

export function parseSharedPassportToken(token: string | null | undefined): SharedPassportPayload | null {
  if (!token || typeof token !== 'string') return null;
  const decoded = decodeUtf8Base64Url(token.trim());
  if (!decoded) return null;
  try {
    const raw = JSON.parse(decoded) as Partial<SharedPassportPayload>;
    if (
      !raw ||
      typeof raw.passportId !== 'string' ||
      typeof raw.practitionerName !== 'string' ||
      typeof raw.fieldMatch !== 'string' ||
      typeof raw.readOnlySignature !== 'string' ||
      !Array.isArray(raw.verifiedSkills)
    ) {
      return null;
    }

    const studioDomain: StudioDomain =
      raw.studioDomain === 'Tech' ||
      raw.studioDomain === 'Green Energy' ||
      raw.studioDomain === 'Healthcare Ops' ||
      raw.studioDomain === 'SME Finance'
        ? raw.studioDomain
        : 'Green Energy';

    return {
      passportId: sanitizeText(raw.passportId, 80),
      practitionerName: sanitizeText(raw.practitionerName, 80),
      ageStage: normalizeAgeStage(raw.ageStage),
      studioDomain,
      fieldMatch: sanitizeText(raw.fieldMatch, 110),
      ageStageTrack: sanitizeText(raw.ageStageTrack ?? '', 90),
      executiveSummary: sanitizeText(raw.executiveSummary ?? '', 340),
      verifiedSkills: raw.verifiedSkills.slice(0, 6).map((s) => ({
        name: sanitizeText(String(s?.name ?? ''), 90),
        confidenceLabel: sanitizeText(String(s?.confidenceLabel ?? 'Verified'), 40),
        confidenceScore: Math.max(0, Math.min(100, Math.round(Number(s?.confidenceScore) || 0))),
        evidenceNote: sanitizeText(String(s?.evidenceNote ?? ''), 200),
      })),
      microBridge: {
        title: sanitizeText(String(raw.microBridge?.title ?? ''), 120),
        action: sanitizeText(String(raw.microBridge?.action ?? ''), 240),
        estimatedDuration: sanitizeText(String(raw.microBridge?.estimatedDuration ?? ''), 60),
        partnerProgram: sanitizeText(String(raw.microBridge?.partnerProgram ?? ''), 100),
      },
      stipendEligible: Boolean(raw.stipendEligible),
      verifiedCapabilitiesCount: Math.max(0, Math.round(Number(raw.verifiedCapabilitiesCount) || 0)),
      verifiedEndorsements: Array.isArray(raw.verifiedEndorsements)
        ? raw.verifiedEndorsements.slice(0, 4).map((e) => ({
            collaboratorName: sanitizeText(String(e?.collaboratorName ?? ''), 80),
            collaboratorRole: sanitizeText(String(e?.collaboratorRole ?? ''), 80),
            organization: sanitizeText(String(e?.organization ?? ''), 80),
            endorsementText: sanitizeText(String(e?.endorsementText ?? ''), 240),
          }))
        : [],
      generatedAtIso:
        typeof raw.generatedAtIso === 'string' && raw.generatedAtIso.length >= 10
          ? raw.generatedAtIso
          : new Date().toISOString(),
      readOnlySignature: sanitizeText(raw.readOnlySignature, 32),
    };
  } catch {
    return null;
  }
}

export const DEFAULT_SEED_SPRINT_FEEDBACK: Omit<
  SprintFeedback,
  'ownerUid' | 'createdAtIso' | 'updatedAtIso'
>[] = [
  {
    id: 'fb-seed-1',
    contributionId: 'contrib-seed-1',
    briefId: 'brief-coldchain-03',
    briefTitle: 'Solar-Direct Cold-Chain Compressor Retrofit Plan',
    partnerOrg: 'HarvestKeep Network',
    reviewerName: 'Nadia Odhiambo',
    reviewerRole: 'Operations Director · Hiring Partner',
    rating: 5,
    reviewText:
      'Delivered an immediately actionable 48V defrost staging schedule with zero ambiguity. Our Nakuru site technicians cut overnight thermal drift within 48 hours of handover.',
  },
];

export function computeFeedbackSummary(feedbackList: SprintFeedback[]): SprintFeedbackSummary {
  const totalReviews = feedbackList.length;
  if (totalReviews === 0) {
    return { totalReviews: 0, averageRating: 0, fiveStarCount: 0 };
  }
  const sum = feedbackList.reduce((acc, item) => acc + item.rating, 0);
  const averageRating = Math.round((sum / totalReviews) * 10) / 10;
  const fiveStarCount = feedbackList.filter((item) => item.rating === 5).length;
  return { totalReviews, averageRating, fiveStarCount };
}

export const POD_MENTORS: PodMentorProfile[] = [
  {
    id: 'mentor-green-01',
    name: 'Eng. Samuel Kariuki',
    roleTitle: 'Senior Microgrid & BMS Specialist',
    ageStage: '46+',
    ageStageBadge: '46+ Master Practitioner',
    domain: 'Green Energy',
    hubLocation: 'Nairobi · Hybrid Field Hub',
    specialty: '48V inverter diagnostics, battery balancing & cold-room thermal QA',
    availability: 'available',
    availabilityLabel: 'Available now',
    responseWindow: 'Replies under 10m',
    greetingPrompt:
      'Share your inverter CSV readings or wiring schematic whenever ready — I am online for live pod QA.',
  },
  {
    id: 'mentor-health-02',
    name: 'Dr. Amina Haddad',
    roleTitle: 'Clinical Ops & Cold-Chain Lead',
    ageStage: '30-45',
    ageStageBadge: '30–45 Senior Specialist',
    domain: 'Healthcare Ops',
    hubLocation: 'Amman · Regional Clinic Desk',
    specialty: '2°C–8°C vaccine excursions, maternal triage protocols & multilingual SOPs',
    availability: 'available',
    availabilityLabel: 'Available now',
    responseWindow: 'Replies under 15m',
    greetingPrompt:
      'Ready to review your triage checklists and shift-handover phrasing before partner sign-off.',
  },
  {
    id: 'mentor-tech-03',
    name: 'Eng. Tomasz Kowalski',
    roleTitle: 'Principal Offline-First Architect',
    ageStage: '46+',
    ageStageBadge: '46+ Master Practitioner',
    domain: 'Tech',
    hubLocation: 'Kraków · Async Engineering Pod',
    specialty: 'Idempotent sync queues, 2G conflict resolution & TypeScript test suites',
    availability: 'in-review',
    availabilityLabel: 'In pod review',
    responseWindow: 'Replies ~20m',
    greetingPrompt:
      'Currently reviewing a pod PR — drop your sync conflict edge cases here and I will walk through them next.',
  },
  {
    id: 'mentor-finance-04',
    name: 'Grace Mukasa',
    roleTitle: 'SME Working-Capital Director',
    ageStage: '30-45',
    ageStageBadge: '30–45 Senior Specialist',
    domain: 'SME Finance',
    hubLocation: 'Kampala · Guild Advisory Desk',
    specialty: '13-week rolling cash-flow ledgers, supplier staging & unit-margin audits',
    availability: 'available',
    availabilityLabel: 'Available now',
    responseWindow: 'Replies under 12m',
    greetingPrompt:
      'Send over your supplier payment cadence or aging sheet — happy to stress-test the Friday liquidity buffer.',
  },
];

export function getAssignedMentorForSprint(
  sprintId: string,
  domain?: string
): PodMentorProfile {
  const lowerId = sprintId.toLowerCase();
  if (lowerId.includes('solar') || lowerId.includes('coldchain')) {
    return POD_MENTORS[0];
  }
  if (lowerId.includes('maternal') || lowerId.includes('ngo') || lowerId.includes('health')) {
    return POD_MENTORS[1];
  }
  if (lowerId.includes('sync') || lowerId.includes('remote') || lowerId.includes('tech')) {
    return POD_MENTORS[2];
  }
  if (lowerId.includes('cashflow') || lowerId.includes('sme') || lowerId.includes('finance')) {
    return POD_MENTORS[3];
  }
  const byDomain = POD_MENTORS.find(
    (m) => m.domain.toLowerCase() === (domain ?? '').trim().toLowerCase()
  );
  return byDomain ?? POD_MENTORS[0];
}

export function buildMentorQuickReply(
  mentor: PodMentorProfile,
  sprintTitle: string,
  practitionerMessage: string
): string {
  const lower = practitionerMessage.toLowerCase();
  if (lower.includes('blocker') || lower.includes('stuck') || lower.includes('issue')) {
    return `Got it — let's unblock "${sprintTitle}" together. Isolate the exact failure input first and log a 2-line test case in your deliverables; I'll review it right after.`;
  }
  if (lower.includes('qa') || lower.includes('check') || lower.includes('safety') || lower.includes('review')) {
    return `Happy to run a pod QA pass on "${sprintTitle}". Double-check that your acceptance criteria and handover notes are crisp, then save your draft so I can co-sign.`;
  }
  if (lower.includes('handover') || lower.includes('ready') || lower.includes('submit')) {
    return `Strong momentum. Once your final checklist items are ticked, submit the milestone — that automatically advances your escrow payout and opens the Partner Feedback loop.`;
  }
  return `Thanks for the update on "${sprintTitle}". I've noted this in our pod thread (${mentor.responseWindow}) — keep logging verified deliverables in the workbench and ping me anytime.`;
}

export const DEFAULT_SEED_MENTOR_MESSAGES: Omit<
  MentorMessage,
  'ownerUid' | 'createdAtIso' | 'updatedAtIso'
>[] = [];

export const COMPLIANCE_COUNTRY_PRESETS = [
  { id: 'Kenya', label: 'Kenya', region: 'East Africa' },
  { id: 'Uganda', label: 'Uganda', region: 'East Africa' },
  { id: 'Jordan', label: 'Jordan', region: 'Middle East' },
  { id: 'Germany', label: 'Germany', region: 'Western Europe' },
  { id: 'Colombia', label: 'Colombia', region: 'Latin America' },
  { id: 'Canada', label: 'Canada', region: 'North America' },
  { id: 'Poland', label: 'Poland', region: 'Central Europe' },
] as const;

export const CUSTOM_COUNTRY_SENTINEL = 'Any Other Country — Live AI Lookup';

export const IDENTITY_DOCUMENT_TIERS: Array<{
  id: IdentityDocumentTier;
  label: string;
  shortHint: string;
}> = [
  {
    id: 'refugee-id',
    label: 'Refugee ID / National Alien Card',
    shortHint: 'Host-issued identity or temporary protection credential',
  },
  {
    id: 'unhcr-proof',
    label: 'UNHCR Proof of Registration / Asylum Certificate',
    shortHint: 'Asylum-seeker attestation or registration slip',
  },
  {
    id: 'convention-travel',
    label: 'Convention Travel Document',
    shortHint: '1951 Convention travel & status verification booklet',
  },
  {
    id: 'pending-paperwork',
    label: 'Pending / Missing Paperwork',
    shortHint: 'Awaiting registration renewal or displaced credentials',
  },
];

export const TARGET_WORK_MODES: Array<{
  id: TargetWorkMode;
  label: string;
}> = [
  { id: 'local-formal', label: 'Local Formal Employment' },
  { id: 'cross-border-remote', label: 'Cross-Border Remote Contracting' },
  { id: 'paid-fellowship', label: 'Paid Fellowship / Sprint' },
];

export function enforceUnderFifteenWords(raw: string): string {
  const words = raw
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
  if (words.length <= 14) return words.join(' ');
  return `${words.slice(0, 14).join(' ').replace(/[.,;:]+$/, '')}.`;
}

interface CountryComplianceRule {
  localTier: RegulatoryAccessTier;
  remoteTier: RegulatoryAccessTier;
  fellowshipTier: RegulatoryAccessTier;
  frameworkName: string;
  localTalent: string[];
  localPartner: string[];
  remoteTalent: string[];
  remotePartner: string[];
  fellowshipTalent: string[];
  fellowshipPartner: string[];
  iloNote: string;
}

const COUNTRY_COMPLIANCE_RULES: Record<string, CountryComplianceRule> = {
  Kenya: {
    localTier: 'Enabling',
    remoteTier: 'Enabling',
    fellowshipTier: 'Enabling',
    frameworkName: 'Kenya Refugees Act 2021 & Class M Permit',
    localTalent: [
      'Present Refugee ID or Alien Card to verify identity cleanly.',
      'Apply for fee-waived Class M work permit with employer letter.',
      'Register KRA PIN and NSSF to receive formal local salary.',
    ],
    localPartner: [
      'Issue formal offer letter supporting fee-exempt Class M work permit.',
      'Accept Alien Card or Refugee ID under Refugees Act 2021.',
      'Run standard Kenya PAYE, NSSF, and SHA payroll onboarding.',
    ],
    remoteTalent: [
      'Verify Refugee ID or UNHCR slip for independent remote contracting.',
      'Sign fixed-milestone sprint contract with clear IP and fee terms.',
      'Receive verified payouts via M-Pesa, Equity Bank, or Wise.',
    ],
    remotePartner: [
      'Use compliant cross-border independent contractor template with milestone escrow.',
      'Verify Living Competency Passport alongside host-issued Refugee ID.',
      'Settle invoices directly via M-Pesa Business or SWIFT/Wise rails.',
    ],
    fellowshipTalent: [
      'Join paid project sprint using Living Competency Passport and ID.',
      'Complete 1-page fellowship milestone charter before kickoff day.',
      'Receive stipend via mobile money upon mentor QA sign-off.',
    ],
    fellowshipPartner: [
      'Onboard talent under structured capacity-building sprint fellowship terms.',
      'Pair Emerging Builders with Senior Specialists for compliant mentorship.',
      'Release milestone stipends directly through audited mobile money rails.',
    ],
    iloNote:
      'Under ILO Guiding Principles, Kenya’s Refugees Act 2021 affirms equal wages, safe conditions, and non-discrimination for credentialed refugee workers.',
  },
  Uganda: {
    localTier: 'Enabling',
    remoteTier: 'Enabling',
    fellowshipTier: 'Enabling',
    frameworkName: 'Uganda Refugees Act 2006 Open Work Right',
    localTalent: [
      'Use OPM Refugee ID to exercise statutory right to work.',
      'Register TIN with Uganda Revenue Authority without permit fees.',
      'Sign host-country employment contract with equal statutory protections.',
    ],
    localPartner: [
      'Verify OPM Refugee ID; no special work permit fee required.',
      'Enroll employee into NSSF and PAYE on equal local terms.',
      'Provide written contract specifying hours, wages, and safety standards.',
    ],
    remoteTalent: [
      'Pair OPM Refugee ID with Vuka Living Competency Passport.',
      'Execute plain-language independent remote services sprint agreement.',
      'Settle USD or UGX earnings via MTN MoMo or bank.',
    ],
    remotePartner: [
      'Contract directly with Ugandan-hosted talent under B2B services terms.',
      'Verify digital identity using OPM Refugee ID and peer quotes.',
      'Pay milestones via MTN MoMo, Airtel Money, or local IBAN.',
    ],
    fellowshipTalent: [
      'Enter paid sprint pod immediately using OPM registration credential.',
      'Sign clear 1–2 week deliverable charter with mentor pairing.',
      'Collect verified stipend upon partner acceptance on mobile money.',
    ],
    fellowshipPartner: [
      'Activate zero-fee fellowship onboarding for OPM-registered practitioners.',
      'Define measurable deliverables and weekly pod check-in milestones.',
      'Disburse stipends transparently without multi-month HR delays.',
    ],
    iloNote:
      'ILO Guiding Principles highlight Uganda’s self-reliance model granting equal right to work, freedom of movement, and social security access.',
  },
  Jordan: {
    localTier: 'Mixed — Friction Guided',
    remoteTier: 'Restricted — Remote/EOR Route Active',
    fellowshipTier: 'Enabling',
    frameworkName: 'Jordan Compact Flexible Permit & Digital EOR Bridge',
    localTalent: [
      'Confirm valid Ministry of Interior card and UNHCR certificate.',
      'Obtain sector-specific or flexible Jordan Compact work permit.',
      'Verify employer registration under Social Security Corporation coverage.',
    ],
    localPartner: [
      'Check sector eligibility under current Ministry of Labour permit list.',
      'Sponsor flexible permit renewal or partner with accredited EOR.',
      'Register worker in Social Security Corporation from day one.',
    ],
    remoteTalent: [
      'Route remote contracts through Vuka-accredited EOR or cooperative bridge.',
      'Pair UNHCR proof with verified peer endorsements for trust.',
      'Receive compliant disbursements via JoMoPay, Zain Cash, or IBAN.',
    ],
    remotePartner: [
      'Engage remote talent legally via accredited Employer-of-Record compliance bridge.',
      'Scope deliverables as fixed-milestone technical or advisory sprints.',
      'Settle milestone escrow cleanly via JoMoPay or regional IBAN.',
    ],
    fellowshipTalent: [
      'Complete paid training-to-solution sprint under NGO/partner fellowship umbrella.',
      'Use UNHCR registration and competency passport for rapid clearance.',
      'Receive learning and delivery stipend on JoMoPay wallet.',
    ],
    fellowshipPartner: [
      'Structure short sprints as accredited skills-fellowship stipends with partners.',
      'Maintain transparent attendance, deliverable QA, and safety logs.',
      'Disburse compliant stipends through regulated local payment wallets.',
    ],
    iloNote:
      'ILO Guiding Principles in Jordan emphasize decent work permits, written wage transparency, and safe cross-border pathways where sector quotas apply.',
  },
  Germany: {
    localTier: 'Mixed — Friction Guided',
    remoteTier: 'Enabling',
    fellowshipTier: 'Enabling',
    frameworkName: 'AufenthG Residence & §24 Temporary Protection Track',
    localTalent: [
      'Check work-authorization stamp (Erwerbstätigkeit erlaubt) on residence permit.',
      'Submit Employer Declaration (Erklärung zum Beschäftigungsverhältnis) if required.',
      'Use Living Competency Passport to accelerate IHK/HWK skills recognition.',
    ],
    localPartner: [
      'Inspect residence card wording for immediate employment permission.',
      'File concise Federal Employment Agency form when sponsorship applies.',
      'Accept competency-based practical verification alongside formal Anerkennung.',
    ],
    remoteTalent: [
      'Confirm freelance/self-employment eligibility (Freiberufler or Gewerbe) locally.',
      'Register Steuernummer before invoicing European or global remote clients.',
      'Settle SEPA EUR invoices with automated tax-ready receipts.',
    ],
    remotePartner: [
      'Verify contractor tax ID or route via German EOR partner.',
      'Use GDPR-aligned remote services contract with clear IP handover.',
      'Pay milestone fees via SEPA Instant with clear remittance.',
    ],
    fellowshipTalent: [
      'Join paid project fellowship compatible with residence training provisions.',
      'Document mentor QA hours inside Vuka Proof Ledger.',
      'Receive SEPA stipend linked to milestone deliverable sign-off.',
    ],
    fellowshipPartner: [
      'Offer structured Einarbeitung or paid project fellowship with mentor QA.',
      'Issue clear milestone certificate supporting formal German credential recognition.',
      'Pay compliant SEPA stipend aligned with statutory minimum protections.',
    ],
    iloNote:
      'ILO Guiding Principles align with German labor law ensuring equal pay, statutory social insurance, and transparent skills recognition.',
  },
  Colombia: {
    localTier: 'Enabling',
    remoteTier: 'Enabling',
    fellowshipTier: 'Enabling',
    frameworkName: 'PPT (Permiso por Protección Temporal) Work Track',
    localTalent: [
      'Present active PPT credential valid for formal Colombian employment.',
      'Obtain RUT tax number and enroll in EPS healthcare.',
      'Sign standard Colombian labor or prestación de servicios contract.',
    ],
    localPartner: [
      'Accept PPT ID on par with Cédula for payroll onboarding.',
      'Register employee in PILA social security, ARL, and pension.',
      'Use Ministerio del Trabajo compliant bilingual onboarding templates.',
    ],
    remoteTalent: [
      'Use PPT + RUT to contract legally with global clients.',
      'Execute fixed-milestone digital services contract protecting payment rights.',
      'Withdraw USD or COP cleanly via Nequi or Bancolombia.',
    ],
    remotePartner: [
      'Onboard contractor using verified PPT number and Living Passport.',
      'Specify clear sprint scope and milestone acceptance criteria upfront.',
      'Pay directly via USD digital wallet or local ACH.',
    ],
    fellowshipTalent: [
      'Enter paid sprint fellowship immediately with active PPT document.',
      'Collaborate inside cross-age pod with Senior Specialist mentor.',
      'Receive milestone stipend cleanly through Nequi or local bank.',
    ],
    fellowshipPartner: [
      'Accept PPT credential for rapid zero-paperwork fellowship cohort intake.',
      'Provide written fellowship scope, accident coverage, and mentor guidance.',
      'Settle milestone stipends promptly in COP or USD.',
    ],
    iloNote:
      'ILO Guiding Principles recognize Colombia’s PPT status for full labor-market equality, social protection enrollment, and formal contracting rights.',
  },
  Canada: {
    localTier: 'Enabling',
    remoteTier: 'Enabling',
    fellowshipTier: 'Enabling',
    frameworkName: 'IRCC Open Work Permit & EMPP Skilled Track',
    localTalent: [
      'Present IRCC Open Work Permit and Social Insurance Number.',
      'Pair Living Competency Passport with Canadian skills reference checks.',
      'Begin formal employment or paid apprenticeship under provincial standards.',
    ],
    localPartner: [
      'Verify open work permit expiry and Social Insurance Number.',
      'Evaluate verified practical deliverables alongside Canadian credential equivalents.',
      'Onboard via standard provincial payroll with full benefits.',
    ],
    remoteTalent: [
      'Invoice remote clients legally under active Canadian SIN registration.',
      'Sign clear independent contractor agreement defining deliverables and IP.',
      'Receive CAD or USD settlement via EFT or Wise.',
    ],
    remotePartner: [
      'Engage practitioner as independent contractor or via Canadian payroll.',
      'Verify open work eligibility and Living Competency Passport signature.',
      'Release fixed-milestone funds on EFT or digital wallet rails.',
    ],
    fellowshipTalent: [
      'Join paid cross-age sprint fellowship using Open Work Permit.',
      'Build Canadian workplace references alongside Senior Specialist mentors.',
      'Receive milestone stipend via direct EFT deposit.',
    ],
    fellowshipPartner: [
      'Offer paid 2-week work-integrated sprint to bridge Canadian experience.',
      'Provide structured mentor feedback convertible into verifiable employer references.',
      'Compensate fellows fairly at or above provincial standards.',
    ],
    iloNote:
      'ILO Guiding Principles align with Canadian provincial labor codes guaranteeing equal pay, workplace safety, and non-discrimination.',
  },
  Poland: {
    localTier: 'Enabling',
    remoteTier: 'Enabling',
    fellowshipTier: 'Enabling',
    frameworkName: 'EU Temporary Protection & PESEL UKR Access',
    localTalent: [
      'Present PESEL UKR or Temporary Protection card for immediate work.',
      'Sign Polish employment (Umowa o pracę) or civil contract.',
      'Ensure employer submits ZUS and 14-day Powiatowy Urząd Pracy notice.',
    ],
    localPartner: [
      'Verify PESEL UKR status; no separate work permit needed.',
      'Submit simple electronic notification to labor office within 14 days.',
      'Enroll worker in ZUS health and social insurance immediately.',
    ],
    remoteTalent: [
      'Contract cross-border via JDG registration or Polish EOR partner.',
      'Attach Living Competency Passport QR code to contractor dossier.',
      'Receive EUR or PLN payouts via SEPA Instant or BLIK.',
    ],
    remotePartner: [
      'Verify EU Temporary Protection ID and Competency Passport signature.',
      'Contract cleanly via Umowa zlecenie, B2B, or EOR rail.',
      'Settle milestone invoices promptly via SEPA Instant EUR.',
    ],
    fellowshipTalent: [
      'Start paid skill-bridging sprint immediately using PESEL UKR status.',
      'Work asynchronously inside cross-age pod with principal mentor.',
      'Collect verified PLN or EUR stipend via BLIK/SEPA.',
    ],
    fellowshipPartner: [
      'Onboard PESEL UKR holders rapidly without waiting for permits.',
      'Pair fellows with 30–46+ mentors for deliverable QA sign-off.',
      'Disburse stipends via compliant EU SEPA or BLIK rails.',
    ],
    iloNote:
      'ILO Guiding Principles and EU Temporary Protection guarantee equal remuneration, ZUS social security, and freedom from exploitation.',
  },
};

export function getPreseededComplianceRoute(
  country: string,
  docTier: IdentityDocumentTier,
  workMode: TargetWorkMode
): ComplianceCrossingRoute {
  const cleanCountry = country.trim() || 'Kenya';
  const rule = COUNTRY_COMPLIANCE_RULES[cleanCountry];
  const now = new Date().toISOString();

  if (!rule) {
    // Generic ILO-grounded fallback for arbitrary non-preset countries prior to/alongside Live AI Lookup
    const accessTier: RegulatoryAccessTier =
      docTier === 'pending-paperwork'
        ? 'Restricted — Remote/EOR Route Active'
        : workMode === 'cross-border-remote'
          ? 'Mixed — Friction Guided'
          : 'Mixed — Friction Guided';

    return {
      country: cleanCountry,
      docTier,
      workMode,
      accessTier,
      pathwayHeadline: `${cleanCountry} · Guided ILO-Aligned ${
        workMode === 'cross-border-remote'
          ? 'Remote Contracting'
          : workMode === 'paid-fellowship'
            ? 'Paid Fellowship'
            : 'Formal Work'
      } Bridge`,
      talentSteps: [
        'Keep digital copies of any registration ID and Competency Passport ready.',
        workMode === 'local-formal'
          ? 'Confirm host labor office permit rules or use EOR bridge.'
          : 'Route paid sprints through compliant cross-border escrow or EOR host.',
        'Settle verified milestone earnings via local bank or digital wallet.',
      ].map(enforceUnderFifteenWords),
      partnerSteps: [
        'Accept Living Competency Passport and peer quotes as primary skill proof.',
        docTier === 'pending-paperwork'
          ? 'Use accredited EOR or fellowship escrow until host ID clears.'
          : 'Verify host registration document against standard non-discrimination checklist.',
        'Lock fixed milestone scope and pay fairly on time.',
      ].map(enforceUnderFifteenWords),
      iloRightsGuarantee:
        'ILO Guiding Principles affirm equal treatment, written wage clarity, safe working conditions, and fair dispute recourse regardless of migration history.',
      source: 'preset',
      updatedAtIso: now,
    };
  }

  let accessTier: RegulatoryAccessTier =
    workMode === 'local-formal'
      ? rule.localTier
      : workMode === 'cross-border-remote'
        ? rule.remoteTier
        : rule.fellowshipTier;

  // Adjust tier honestly when paperwork is pending or asylum slip restricts direct local payroll
  if (docTier === 'pending-paperwork') {
    accessTier = 'Restricted — Remote/EOR Route Active';
  } else if (docTier === 'unhcr-proof' && workMode === 'local-formal' && accessTier === 'Enabling') {
    accessTier = 'Mixed — Friction Guided';
  }

  const baseTalent =
    workMode === 'local-formal'
      ? rule.localTalent
      : workMode === 'cross-border-remote'
        ? rule.remoteTalent
        : rule.fellowshipTalent;

  const basePartner =
    workMode === 'local-formal'
      ? rule.localPartner
      : workMode === 'cross-border-remote'
        ? rule.remotePartner
        : rule.fellowshipPartner;

  const talentSteps = [...baseTalent];
  const partnerSteps = [...basePartner];

  if (docTier === 'pending-paperwork') {
    talentSteps[0] = 'Use EOR compliance bridge while awaiting host ID renewal.';
    partnerSteps[0] = 'Route contract through accredited EOR until physical ID arrives.';
  } else if (docTier === 'unhcr-proof' && workMode === 'local-formal') {
    talentSteps[0] = 'Pair UNHCR asylum certificate with Competency Passport for employer review.';
  } else if (docTier === 'convention-travel') {
    talentSteps[0] = 'Present 1951 Convention Travel Document to verify legal residency.';
  }

  return {
    country: cleanCountry,
    docTier,
    workMode,
    accessTier,
    pathwayHeadline: `${cleanCountry} · ${rule.frameworkName}`,
    talentSteps: talentSteps.map(enforceUnderFifteenWords),
    partnerSteps: partnerSteps.map(enforceUnderFifteenWords),
    iloRightsGuarantee: rule.iloNote,
    source: 'preset',
    updatedAtIso: now,
  };
}

export function getSprintDurationDays(briefId: string): number {
  const matchedSprint = SOLUTION_SPRINTS.find((s) => s.id === briefId);
  if (matchedSprint) {
    if (matchedSprint.durationLabel.includes('2 Week')) return 14;
    if (matchedSprint.durationLabel.includes('10 Day')) return 10;
    return 7;
  }
  const matchedBrief = SEED_BRIEFS.find((b) => b.id === briefId);
  if (matchedBrief && matchedBrief.estimatedHours >= 10) return 14;
  return 7;
}

export function computeSprintDueAlerts(
  contributions: BriefSubmission[],
  nowMs: number = Date.now()
): SprintDueAlert[] {
  const alerts: SprintDueAlert[] = [];

  for (const item of contributions) {
    if (item.status !== 'in-progress') continue;

    let deadlineMs: number;
    if (item.deadlineIso && !Number.isNaN(Date.parse(item.deadlineIso))) {
      deadlineMs = Date.parse(item.deadlineIso);
    } else {
      const startMs = Date.parse(item.createdAtIso);
      if (Number.isNaN(startMs)) continue;
      deadlineMs = startMs + getSprintDurationDays(item.briefId) * 86_400_000;
    }

    const diffMs = deadlineMs - nowMs;
    const hoursRemaining = Math.ceil(diffMs / 3_600_000);
    if (hoursRemaining > 48) continue;

    const isOverdue = hoursRemaining <= 0;
    const formattedRemaining = isOverdue
      ? 'Due today'
      : hoursRemaining === 1
        ? '1h left'
        : `${hoursRemaining}h left`;

    alerts.push({
      contributionId: item.id,
      briefId: item.briefId,
      briefTitle: item.briefTitle,
      deadlineIso: new Date(deadlineMs).toISOString(),
      hoursRemaining,
      formattedRemaining,
      isOverdue,
    });
  }

  return alerts.sort((a, b) => a.hoursRemaining - b.hoursRemaining);
}

export const FINANCIAL_PAYOUT_RAILS: FinancialPayoutRailOption[] = [
  {
    id: 'mobile-money',
    label: 'Mobile Money',
    shortLabel: 'Mobile Money',
    plainDescription: 'Instant mobile wallet disbursement via UNHCR-linked or local telco KYC.',
    supportedTiers: ['tier-1', 'tier-2', 'tier-3'],
  },
  {
    id: 'global-wallet',
    label: 'Global Digital Wallet',
    shortLabel: 'Global Digital Wallet',
    plainDescription: 'USD/EUR freelance settlement across regional e-KYC wallets and Wise.',
    supportedTiers: ['tier-1', 'tier-2', 'tier-3'],
  },
  {
    id: 'fiscal-host',
    label: 'Fiscal-Host Disbursement',
    shortLabel: 'Fiscal-Host Disbursement',
    plainDescription: 'Escrow-backed NGO or EOR payout bridge when local banking is blocked.',
    supportedTiers: ['tier-1', 'tier-2'],
  },
  {
    id: 'local-bank',
    label: 'Local Bank',
    shortLabel: 'Local Bank',
    plainDescription: 'Direct commercial IBAN or EFT settlement with statutory bank onboarding.',
    supportedTiers: ['tier-2', 'tier-3'],
  },
];

export function getFinancialPayoutRailLabel(rail: FinancialPayoutRail): string {
  return FINANCIAL_PAYOUT_RAILS.find((r) => r.id === rail)?.label ?? 'Mobile Money';
}

export const FATF_TIERED_KYC_BRIDGE: FatfKycTierGuidance[] = [
  {
    id: 'tier-1',
    tierLabel: 'Tier 1 · Proportional / Low-Friction',
    frictionLabel: 'FATF Simplified Due Diligence',
    summary:
      'Mobile Money & Humanitarian-Verified Digital Wallets with capped monthly thresholds and instant UNHCR attestation or Refugee ID activation.',
    recommendedRailsLabel: 'Mobile Money · Humanitarian Wallet · Fiscal-Host',
    recommendedRailId: 'mobile-money',
    kycMechanismNote:
      'Grounded in UNHCR Financial Inclusion & FATF Risk-Based Tiered KYC: capped sprint payouts clear immediately using UNHCR registration slips without branch-level proof-of-address hurdles.',
  },
  {
    id: 'tier-2',
    tierLabel: 'Tier 2 · Standard e-KYC',
    frictionLabel: 'Cross-Border Remote Settlement',
    summary:
      'Regional Digital Banks & Cross-Border Freelance Payout Rails sized for recurring remote sprint and contract milestone earnings.',
    recommendedRailsLabel: 'Global Digital Wallet · Regional e-Bank',
    recommendedRailId: 'global-wallet',
    kycMechanismNote:
      'Government Refugee ID pairs cleanly with biometric e-KYC wallets, enabling compliant USD/EUR freelance invoicing without physical commercial bank queues.',
  },
  {
    id: 'tier-3',
    tierLabel: 'Tier 3 · Full Formal Banking',
    frictionLabel: 'Commercial Account & Tax Onboarding',
    summary:
      'Local Commercial Bank Account + Tax ID onboarding checklist—explicitly flagging statutory acceptance vs. branch-level KYC workarounds.',
    recommendedRailsLabel: 'Local Bank Account · Direct EFT / IBAN',
    recommendedRailId: 'local-bank',
    kycMechanismNote:
      'Even where national central banks authorize Convention Travel or statutory IDs, individual branches may ask for extra utility proofs—keep our EOR/Fiscal-Host fallback toggle ready.',
  },
];

export function getMatchedFatfKycTier(
  docTier: IdentityDocumentTier,
  workMode: TargetWorkMode,
  country: string
): FatfKycTierGuidance {
  if (docTier === 'unhcr-proof' || docTier === 'pending-paperwork') {
    return FATF_TIERED_KYC_BRIDGE[0];
  }
  if (docTier === 'convention-travel') {
    return FATF_TIERED_KYC_BRIDGE[2];
  }
  // Refugee ID defaults to Tier 2 Standard e-KYC; in Enabling formal-work jurisdictions, still surfaces Tier 2 unless upgrading
  if (
    workMode === 'local-formal' &&
    (country === 'Uganda' || country === 'Colombia' || country === 'Canada' || country === 'Poland')
  ) {
    return FATF_TIERED_KYC_BRIDGE[2];
  }
  return FATF_TIERED_KYC_BRIDGE[1];
}

export const FINANCIAL_READINESS_CHECKLIST_ITEMS: Array<{
  id: 'identity-auth' | 'payout-rail' | 'tax-terms';
  stepNumber: string;
  title: string;
  reassuringCopy: string; // Strictly < 15 words
}> = [
  {
    id: 'identity-auth',
    stepNumber: '1',
    title: 'Identity & Work-Auth Pathway Cleared',
    reassuringCopy: 'Confirm your host ID, UNHCR proof, or EOR bridge is ready.',
  },
  {
    id: 'payout-rail',
    stepNumber: '2',
    title: 'Compliant Payout Rail Selected & Tested',
    reassuringCopy: 'Choose your trusted payout rail and verify test disbursement routing.',
  },
  {
    id: 'tax-terms',
    stepNumber: '3',
    title: 'Tax & Contracting Terms Acknowledged',
    reassuringCopy: 'Accept clear milestone payment receipts and fair contractor terms.',
  },
];

export interface ContractingStructureMeta {
  id: ContractingStructureOption;
  label: string;
  shortLabel: string;
  badge: string;
  summary: string;
  legalNote: string;
}

export const CONTRACTING_STRUCTURES: ContractingStructureMeta[] = [
  {
    id: 'direct-local',
    label: 'Direct Local Hire',
    shortLabel: 'Direct Local Hire',
    badge: 'Enabling Jurisdictions',
    summary:
      'Standard compliant local employment checklist for countries with statutory work-permit recognition.',
    legalNote: 'Direct local payroll with equal-pay & social-protection parity.',
  },
  {
    id: 'scoped-remote',
    label: 'Scoped Remote Contractor / Sprint Agreement',
    shortLabel: 'Scoped Remote Contractor',
    badge: 'Cross-Border Agile',
    summary:
      'Cross-border deliverable-based sprint contract with clear milestone sign-off and IP transfer.',
    legalNote: 'Zero local entity overhead; settles directly to verified payout rail.',
  },
  {
    id: 'eor-fiscal-host',
    label: 'Employer of Record (EOR) / Fiscal Host Bridge',
    shortLabel: 'EOR / Fiscal Host Bridge',
    badge: 'Zero Local-Entity Risk',
    summary:
      'Zero local-entity risk—partner pays one consolidated invoice and local disbursement clears seamlessly.',
    legalNote: 'Accredited EOR/fiscal host absorbs statutory compliance & tax receipts.',
  },
];

export function getContractingStructureMeta(
  id: ContractingStructureOption = 'scoped-remote'
): ContractingStructureMeta {
  return CONTRACTING_STRUCTURES.find((item) => item.id === id) ?? CONTRACTING_STRUCTURES[1];
}

export function getContractingStructureLabel(
  id: ContractingStructureOption = 'scoped-remote'
): string {
  return getContractingStructureMeta(id).label;
}

export function buildOnboardingPackTemplate(params: {
  practitionerName: string;
  ageStage: AgeStage;
  hostCountry: string;
  docTier: IdentityDocumentTier;
  workMode: TargetWorkMode;
  contractingStructure: ContractingStructureOption;
  partnerOrg: string;
  sprintTitle: string;
  payoutUsd: number;
  selectedPayoutRail: FinancialPayoutRail;
  verifiedSkills: string[];
  passportFieldMatch?: string;
  passportId?: string | null;
}): OnboardingPackResult {
  const issuedDate = new Date().toISOString().slice(0, 10);
  const structure = getContractingStructureMeta(params.contractingStructure);
  const railLabel = getFinancialPayoutRailLabel(params.selectedPayoutRail);
  const kycTier = getMatchedFatfKycTier(params.docTier, params.workMode, params.hostCountry);
  const partnerName = params.partnerOrg.trim() || 'Partner Organization';
  const practitioner = params.practitionerName.trim() || 'Skilled Practitioner';
  const sprint = params.sprintTitle.trim() || 'Scoped Solution Sprint';
  const fee = Math.max(50, Math.round(params.payoutUsd || 480));
  const skillsLine =
    params.verifiedSkills.length > 0
      ? params.verifiedSkills.slice(0, 4).join(', ')
      : 'Applied Technical & Operational Problem Solving';

  const agreementTitle = `${structure.shortLabel} · 1-Page Sprint & Compliance Agreement`;
  const contractingSummary = `${partnerName} engages ${practitioner} (${params.ageStage} Track) via ${structure.label} in ${params.hostCountry}, backed by ${kycTier.tierLabel} (${railLabel}).`;
  const scopeAndDeliverables = `Deliver "${sprint}" grounded in verified skills (${skillsLine})${params.passportFieldMatch ? ` matched to ${params.passportFieldMatch}` : ''}.`;
  const fairPaySchedule = `Fixed milestone fee of $${fee.toLocaleString()} USD held upfront in escrow and settled via ${railLabel} within 3 business days of milestone acceptance.`;
  const complianceAttestation = `Aligned with ILO Guiding Principles on Access to the Labour Market, FATF Risk-Based Tiered KYC, and Vuka na Amana non-discrimination & IP retention standards.`;

  const fullAgreementText = [
    'VUKA NA AMANA — 1-PAGE SPRINT & COMPLIANCE AGREEMENT',
    '====================================================================',
    `Date Issued:          ${issuedDate}`,
    `Hiring Partner:       ${partnerName}`,
    `Skilled Practitioner: ${practitioner} (${params.ageStage} Career Track)`,
    `Host Jurisdiction:    ${params.hostCountry} (${kycTier.tierLabel})`,
    `Passport Reference:   ${params.passportId ? params.passportId : 'Verified Competency Record'}`,
    '',
    '1. CONTRACTING STRUCTURE & EMPLOYER LIABILITY SHIELD',
    `   Selected Mode:  ${structure.label}`,
    `   Legal Basis:    ${structure.legalNote}`,
    `   Skill Proof:    ${skillsLine}`,
    '',
    '2. SCOPED SPRINT DELIVERABLES',
    `   Sprint Title:   ${sprint}`,
    `   Deliverables:   ${scopeAndDeliverables}`,
    '   Quality Gate:   Joint sign-off by Hiring Partner lead & Cross-Age Pod Mentor.',
    '',
    '3. FAIR-PAY MILESTONE DISBURSEMENT SCHEDULE',
    `   Escrow Fee:     $${fee.toLocaleString()} USD (100% ring-fenced prior to kickoff)`,
    `   Payout Rail:    ${railLabel}`,
    `   Schedule:       ${fairPaySchedule}`,
    '',
    '4. ILO DECENT-WORK & NON-DISCRIMINATION ATTESTATION',
    `   ${complianceAttestation}`,
    '   Deliverable IP transfers upon cleared payout while the Practitioner retains',
    '   permanent, portable credit in their Living Competency Passport.',
    '',
    '--------------------------------------------------------------------',
    `Partner Authorized Sign-Off (${partnerName}): ___________________  Date: ________`,
    `Practitioner Sign-Off (${practitioner}): ______________________  Date: ________`,
  ].join('\n');

  return {
    agreementTitle,
    contractingSummary,
    scopeAndDeliverables,
    fairPaySchedule,
    complianceAttestation,
    fullAgreementText,
    source: 'template',
    generatedAtIso: new Date().toISOString(),
  };
}




