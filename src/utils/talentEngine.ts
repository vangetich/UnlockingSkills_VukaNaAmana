import type {
  AgeStage,
  AnalyticsSummary,
  AuthPathwayOption,
  BriefComplexity,
  BriefSubmission,
  CohortBlueprintPreview,
  CompetencyPassport,
  ContractPayout,
  ContractTemplateOption,
  KnowledgeFlowStage,
  LocaleCode,
  MilestoneBadge,
  OfflineMutation,
  PayoutLifecycleStatus,
  PayoutRailOption,
  PeerEndorsement,
  PeerFlywheelMetrics,
  PracticalScenario,
  PractitionerProfile,
  ProblemBrief,
  RankedSolutionSprint,
  ScaleRegionId,
  ScaleSectorId,
  SdgPulseMetric,
  SharedPassportPayload,
  SkillCapability,
  SolutionSprint,
  SprintComplexityLevel,
  SprintPartnerType,
  SprintPerformanceData,
  SprintPerformancePoint,
  StudioDomain,
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
  const sdg8EarningsTotal = 18400 + liveUnlockedUsd;
  const sdg8SprintsTotal = 42 + completedContribs.length;
  const latestCompleted = completedContribs[0] ?? null;
  const sdg8Story = latestCompleted
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

  // SDG 16: Legal & Payment Bottlenecks Cleared
  const liveSdg16 =
    vaultReadiness.completedCount + clearedPayouts.length + verifiedEndorsements.length;
  const sdg16Total = 88 + liveSdg16;
  const railLabel = getPayoutRailLabel(vault.payoutRail);
  const sdg16Story = vaultReadiness.isFullyReady
    ? `Pre-cleared Work-Ready Vault & ${railLabel} payout rail removed contracting friction completely.`
    : `${vaultReadiness.completedCount}/3 Work-Ready Vault checks & zero-document endorsements clearing path to ${railLabel}.`;

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
      metricCaption: `${sdg8SprintsTotal} paid sprints delivered`,
      liveDeltaLabel: `+$${liveUnlockedUsd.toLocaleString()} live`,
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
      title: 'Legal & Payment Bottlenecks Cleared',
      primaryValue: sdg16Total.toLocaleString(),
      numericValue: sdg16Total,
      metricCaption: `${vaultReadiness.completedCount}/3 vault · ${releasedPayouts.length} released`,
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
  const clearedPayouts = payouts.filter((p) => p.status !== 'escrow-held').length;
  const releasedPayouts = payouts.filter((p) => p.status === 'released').length;
  const completedContribs = contributions.filter((c) => c.status === 'completed').length;
  const liveUnlockedUsd = computeUniqueUnlockedEarningsUsd(contributions, payouts);

  const intakeCount =
    220 + (profile.problemStatement.trim().length > 0 ? 1 : 0) + capabilities.length;
  const passportCount =
    168 + verifiedCaps + masterEndorsedCaps + (passport ? 1 : 0) + verifiedEndorsements;
  const payoutCount = 134 + vaultReadiness.completedCount + clearedPayouts;
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
      status: vaultReadiness.isFullyReady || releasedPayouts > 0 ? 'verified' : 'active',
      microCaption: `${vaultReadiness.completedCount}/3 Vault checks · ${getPayoutRailLabel(vault.payoutRail)}`,
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
  const completedContribs = contributions.filter((c) => c.status === 'completed');
  const completedCount = completedContribs.length;
  const totalPodsCount = contributions.length;
  const releasedPayouts = payouts.filter((p) => p.status === 'released');
  const liveUnlockedUsd = computeUniqueUnlockedEarningsUsd(contributions, payouts);

  const completionRatio = totalPodsCount > 0 ? completedCount / totalPodsCount : 0.75;
  const liveAcceptanceRatePct = Math.min(
    99,
    Math.max(
      70,
      Math.round(78 + completionRatio * 15 + Math.min(4, completedCount) + Math.min(2, releasedPayouts.length))
    )
  );

  const historicalBaselineEarnings = 1980;
  const totalHistoricalEarningsUsd = historicalBaselineEarnings + liveUnlockedUsd;

  const points: SprintPerformancePoint[] = [
    { label: 'S1', acceptanceRatePct: 68, payoutUsd: 320 },
    { label: 'S2', acceptanceRatePct: 73, payoutUsd: 690 },
    { label: 'S3', acceptanceRatePct: 79, payoutUsd: 1120 },
    { label: 'S4', acceptanceRatePct: 84, payoutUsd: 1560 },
    { label: 'S5', acceptanceRatePct: 88, payoutUsd: historicalBaselineEarnings },
    {
      label: 'Live',
      acceptanceRatePct: liveAcceptanceRatePct,
      payoutUsd: totalHistoricalEarningsUsd,
    },
  ];

  const prevAcceptance = points[points.length - 2].acceptanceRatePct;
  const acceptanceDeltaPct = liveAcceptanceRatePct - prevAcceptance;

  const latestPayoutUsd =
    completedContribs[0]?.payoutUsd ??
    releasedPayouts[0]?.amountUsd ??
    liveUnlockedUsd;

  return {
    points,
    currentAcceptanceRatePct: liveAcceptanceRatePct,
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

