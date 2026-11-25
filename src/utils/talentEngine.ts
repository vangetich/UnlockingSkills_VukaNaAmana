import type {
  AgeCohesionBreakdown,
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
  JobToFitUpskillingBridge,
  KnowledgeFlowStage,
  LivingProofAnalysis,
  LivingProofPortfolio,
  LocaleCode,
  LockedUpskillingBridgeRecord,
  MatchedWorkMode,
  MatchedWorkOpportunity,
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
  RankedMatchedWorkOpportunity,
  RankedSolutionSprint,
  RegulatoryAccessTier,
  ScaleRegionId,
  ScaleSectorId,
  SdgPulseMetric,
  SharedPassportPayload,
  SkillCapability,
  SkillTrackId,
  SkillTrackOption,
  SolutionSprint,
  SprintComplexityLevel,
  SprintDueAlert,
  SprintFeedback,
  SprintFeedbackSummary,
  SprintMilestoneKey,
  SprintPartnerType,
  SprintPerformanceData,
  SprintPerformancePoint,
  StudioDomain,
  TargetWorkMode,
  VerificationRouteId,
  VerificationStatus,
  WorkReadyVault,
  WorkSetupPreferenceId,
  WorkplaceReadinessSignals,
  WorkspaceReadinessTag,
  PassportTrustTier,
} from '../types/kora';

export interface WorkSetupPreferenceOption {
  id: WorkSetupPreferenceId;
  label: string;
  shortLabel: string;
  helperText: string;
}

export const WORK_SETUP_PREFERENCE_OPTIONS: WorkSetupPreferenceOption[] = [
  {
    id: 'remote-home',
    label: 'Remote / Home-Based Work Preferred',
    shortLabel: 'Remote / Home-Based',
    helperText: 'Deliver work digitally from home or a quiet local hub.',
  },
  {
    id: 'captioned-text',
    label: 'Captioned / Text-First Communication',
    shortLabel: 'Captioned / Text-First',
    helperText: 'Async chat, written briefs, and live captions over uncaptioned voice calls.',
  },
  {
    id: 'screen-reader-keyboard',
    label: 'Screen-Reader or Keyboard-Friendly Digital Tools',
    shortLabel: 'Screen-Reader / Keyboard Ready',
    helperText: 'Accessible documents, keyboard navigation, and clean semantic tools.',
  },
  {
    id: 'step-free-seated',
    label: 'Seated / Step-Free Local Workspace Access',
    shortLabel: 'Seated / Step-Free Access',
    helperText: 'Step-free physical entry and seated workstation setup for local sites.',
  },
  {
    id: 'flexible-hours',
    label: 'Flexible Milestone Hours',
    shortLabel: 'Flexible Milestone Hours',
    helperText: 'Paced delivery windows focused on outcomes rather than rigid shifts.',
  },
  {
    id: 'assistive-tech-stipend',
    label: 'Assistive-Tech or Connectivity Stipend Needed',
    shortLabel: 'Assistive-Tech / Data Stipend',
    helperText: 'Links to Partner Fee-Waiver & Enablement Stipend pool (screen readers, ergonomic gear, or data).',
  },
];

export interface WorkspaceReadinessOption {
  id: WorkspaceReadinessTag;
  label: string;
  helperText: string;
}

export const WORKSPACE_READINESS_OPTIONS: WorkspaceReadinessOption[] = [
  {
    id: 'remote-flexible',
    label: 'Remote / Flexible Hours',
    helperText: 'Async milestone delivery with paced schedule options.',
  },
  {
    id: 'written-captioned',
    label: 'Written & Captioned Briefs',
    helperText: 'Clear text-first briefs, async updates, and captioned check-ins.',
  },
  {
    id: 'step-free-accessible',
    label: 'Step-Free / Accessible Site',
    helperText: 'Step-free physical workspace or keyboard/screen-reader ready tools.',
  },
];

export function getWorkSetupPreferenceLabel(id: WorkSetupPreferenceId): string {
  return WORK_SETUP_PREFERENCE_OPTIONS.find((opt) => opt.id === id)?.label ?? id;
}

export function getWorkspaceReadinessLabel(tag: WorkspaceReadinessTag): string {
  return WORKSPACE_READINESS_OPTIONS.find((opt) => opt.id === tag)?.label ?? tag;
}

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
    proofPortfolioReady: false,
    proofSkillTrack: 'trades-solar',
    proofLocalScore: 0,
    proofRemoteScore: 0,
    workplaceSignalsCount: 0,
    matchedWorkCount: 0,
    appliedOpportunityIds: [],
    upskillingBridgesCount: 0,
    lockedBridgeOpportunityIds: [],
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
    workspaceReadiness: ['written-captioned', 'remote-flexible'],
    inclusiveReady: true,
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
    workspaceReadiness: ['remote-flexible', 'written-captioned'],
    inclusiveReady: true,
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
    workspaceReadiness: ['remote-flexible', 'written-captioned', 'step-free-accessible'],
    inclusiveReady: true,
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
    workspaceReadiness: ['remote-flexible', 'written-captioned'],
    inclusiveReady: true,
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

  // SDG 4: Credentials Verified & Bridging Modules Completed (Target 4.4)
  const upskillingBridgesCount = Math.max(
    0,
    Math.round(vault.upskillingBridgesCount ?? vault.lockedBridgeOpportunityIds?.length ?? 0)
  );
  const liveSdg4 =
    verifiedCaps.length +
    masterEndorsedCaps.length +
    (passport ? 1 : 0) +
    (passport?.stipendEligible ? 1 : 0) +
    verifiedEndorsements.length +
    upskillingBridgesCount * 2;
  const sdg4Total = 140 + liveSdg4;
  const sdg4Story =
    passport?.stipendEligible
      ? `Partner Fee-Waiver & Exam Stipend Pre-Approved (${passport.verifiableId ?? 'VNA-2026-8412'}) + ${verifiedCaps.length} verified proof(s) advancing Target 4.4 & 4.5.`
      : upskillingBridgesCount > 0
        ? `${upskillingBridgesCount} UQP/RPL Job-to-Fit bridge(s) locked + ${verifiedCaps.length} verified proof(s) advancing Target 4.4 skill recognition.`
        : passport
          ? `${passport.studioDomain} Passport & ${verifiedCaps.length} verified proof(s) bypassed slow paper re-credentialing.`
          : `${verifiedCaps.length} field-verified capability record(s) & ${verifiedEndorsements.length} peer quote(s) converted craft into portable proof.`;

  // SDG 8: Paid Sprints Delivered & Earnings Unlocked
  const onboardingPackCleared = Boolean(vault.onboardingPackGenerated);
  const proofPortfolioCleared = Boolean(vault.proofPortfolioReady);
  const matchedWorkCount = Math.max(
    0,
    Math.round(vault.matchedWorkCount ?? vault.appliedOpportunityIds?.length ?? 0)
  );
  const workplaceSignalsCount = Math.max(0, Math.min(3, Math.round(vault.workplaceSignalsCount ?? 0)));
  const onboardingSdg8BonusUsd = onboardingPackCleared ? 250 : 0;
  const proofSdg8BonusUsd = proofPortfolioCleared ? 150 : 0;
  const matchedWorkBonusUsd = matchedWorkCount * 120;
  const sdg8EarningsTotal =
    18400 + liveUnlockedUsd + onboardingSdg8BonusUsd + proofSdg8BonusUsd + matchedWorkBonusUsd;
  const sdg8SprintsTotal =
    42 +
    completedContribs.length +
    (onboardingPackCleared ? 1 : 0) +
    (proofPortfolioCleared ? 1 : 0) +
    matchedWorkCount;
  const latestCompleted = completedContribs[0] ?? null;
  const contractingLabel = getContractingStructureLabel(
    vault.onboardingContractStructure ?? 'scoped-remote'
  );
  const sdg8Story =
    matchedWorkCount > 0
      ? `${matchedWorkCount} Living Proof application(s) submitted + ${completedContribs.length} sprint(s) turning verified craft into active local & remote work.`
      : proofPortfolioCleared
        ? `Living Proof Portfolio verified (${vault.proofLocalScore ?? 0}% Local · ${vault.proofRemoteScore ?? 0}% Remote) + ${completedContribs.length} sprint(s) unlocking real work.`
        : onboardingPackCleared
          ? `1-Click Onboarding Pack cleared (${contractingLabel}) + ${completedContribs.length} sprint(s) ready for rapid partner contracting.`
          : latestCompleted
            ? `"${latestCompleted.briefTitle}" delivered $${latestCompleted.payoutUsd} in scoped milestone earnings.`
            : 'Scoped 1–2 week employer pain-point sprints turn idle skill directly into verified household income.';

  // SDG 10: Underemployment Gaps Closed Across Age Brackets (Target 10.2 — Cross-Age Equity)
  const uniqueDomains = new Set<string>([
    ...capabilities.map((c) => c.domain),
    ...contributions.map((c) => c.domain),
    ...(passport ? [passport.studioDomain] : []),
  ]);
  const liveSdg10 =
    (profile.onboarded ? 1 : 0) +
    completedContribs.length +
    activeContribs.length +
    uniqueDomains.size +
    (proofPortfolioCleared ? 1 : 0) +
    workplaceSignalsCount +
    upskillingBridgesCount * 2;
  const sdg10Total = 64 + liveSdg10;
  const userPodSeat = getUserPodSeat(profile.ageStage);
  const sdg10Story =
    upskillingBridgesCount > 0
      ? `${upskillingBridgesCount} ILO Upgraded Apprenticeship / UQP bridge(s) locked across 15–46+ pods (${profile.ageStage}) advancing Target 10.2 equity.`
      : proofPortfolioCleared
        ? `Visual proof & ${workplaceSignalsCount}/3 workplace readiness signals bridge ${profile.ageStage} practitioners into local and remote roles.`
        : userPodSeat === 'lead'
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
    const matchedOpp = MATCHED_WORK_OPPORTUNITIES.find((o) => o.id === contrib.briefId);
    if (matchedOpp) partnerOrgs.add(matchedOpp.partnerOrg);
  }
  const liveSdg17 =
    partnerOrgs.size +
    contributions.length +
    endorsements.length +
    (proofPortfolioCleared ? 1 : 0) +
    (workplaceSignalsCount === 3 ? 1 : 0) +
    matchedWorkCount;
  const sdg17Total = 36 + liveSdg17;
  const featuredPartner = Array.from(partnerOrgs)[0] ?? 'regional SME & NGO partners';
  const sdg17Story =
    matchedWorkCount > 0
      ? `${matchedWorkCount} direct Living Proof partner match(es) + ${partnerOrgs.size} partner org(s) including ${featuredPartner}.`
      : proofPortfolioCleared
        ? `Employer-Ready Proof + ${partnerOrgs.size} partner org(s) including ${featuredPartner} connected across ${contributions.length} pod(s).`
        : `${partnerOrgs.size} partner org(s) including ${featuredPartner} linked with ${contributions.length} active/completed pod(s).`;

  // Inclusive & Accommodated Pathways Active count (SDG 4.5, SDG 8.5, SDG 10.2)
  const preVerifiedInclusiveSprints =
    SOLUTION_SPRINTS.filter((s) => s.inclusiveReady).length +
    MATCHED_WORK_OPPORTUNITIES.filter((o) => o.inclusiveReady).length;
  const builderWorkSetupSelectedCount = vault.workSetupPreferences?.length ?? 0;
  const assistiveStipendActive =
    Boolean(vault.workSetupPreferences?.includes('assistive-tech-stipend')) ||
    Boolean(passport?.stipendEligible);
  const inclusivePathwaysActiveCount =
    preVerifiedInclusiveSprints +
    (builderWorkSetupSelectedCount > 0 ? 1 : 0) +
    (vault.shareWorkSetupWithPartners && builderWorkSetupSelectedCount > 0 ? 1 : 0) +
    (assistiveStipendActive ? 1 : 0);
  const inclusivePathwaysPill = `Inclusive & Accommodated Pathways Active · ${inclusivePathwaysActiveCount}`;

  return [
    {
      sdgNumber: 4,
      sdgLabel: 'SDG 4',
      unTargetTag: 'Targets 4.4 & 4.5 — Quality Upskilling',
      title: 'Verified Competency Passports & Job-Fit Micro-Bridges Completed (UQP / RPL aligned)',
      primaryValue: sdg4Total.toLocaleString(),
      numericValue: sdg4Total,
      metricCaption: 'credentials & micro-bridges',
      liveDeltaLabel: `+${liveSdg4} live`,
      microStory: sdg4Story,
      accent: 'emerald',
      inclusivePathwaysPill,
      inclusivePathwaysCount: inclusivePathwaysActiveCount,
    },
    {
      sdgNumber: 8,
      sdgLabel: 'SDG 8',
      unTargetTag: 'Targets 8.5, 8.8 & 8.10 — Decent Work',
      title: 'Paid Sprints Unlocked, Upgraded Apprenticeships Active & Fair-Pay Contracts Issued',
      primaryValue: `$${sdg8EarningsTotal.toLocaleString()}`,
      numericValue: sdg8EarningsTotal,
      metricCaption:
        matchedWorkCount > 0
          ? `${sdg8SprintsTotal} paid sprints & ${matchedWorkCount} matched app(s)`
          : proofPortfolioCleared || onboardingPackCleared
            ? `${sdg8SprintsTotal} paid sprints & verified portfolios`
            : `${sdg8SprintsTotal} paid sprints delivered`,
      liveDeltaLabel: `+$${(liveUnlockedUsd + onboardingSdg8BonusUsd + proofSdg8BonusUsd + matchedWorkBonusUsd).toLocaleString()} live`,
      microStory: sdg8Story,
      accent: 'terracotta',
      inclusivePathwaysPill,
      inclusivePathwaysCount: inclusivePathwaysActiveCount,
    },
    {
      sdgNumber: 10,
      sdgLabel: 'SDG 10',
      unTargetTag: 'Targets 10.2 & 10.7 — Reduced Inequalities',
      title: 'Cross-Age Builders Placed (15–17, 18–29, 30–45, 46+) & Refugee–Host Community Cohesion Pods',
      primaryValue: sdg10Total.toLocaleString(),
      numericValue: sdg10Total,
      metricCaption: `across 15–46+ brackets (${profile.ageStage})`,
      liveDeltaLabel: `+${liveSdg10} live`,
      microStory: sdg10Story,
      accent: 'emerald',
      inclusivePathwaysPill,
      inclusivePathwaysCount: inclusivePathwaysActiveCount,
    },
    {
      sdgNumber: 16,
      sdgLabel: 'SDG 16',
      unTargetTag: 'Targets 16.6 & 16.9 — Strong Institutions',
      title: 'Work-Auth Pathways Mapped & FATF Tiered KYC Payout Rails Cleared',
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
      unTargetTag: 'Target 17.17 — Partnerships',
      title: 'Active Tripartite Partners (Employers/SMEs + TVET/RPL Accreditors + Stipend/Fee-Waiver Sponsors)',
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
  const upskillingBridgesCount = vault.upskillingBridgesCount ?? 0;
  const matchedWorkCount = vault.matchedWorkCount ?? 0;

  const intakeCount =
    220 + (profile.problemStatement.trim().length > 0 ? 1 : 0) + capabilities.length;
  const passportCount =
    168 +
    verifiedCaps +
    masterEndorsedCaps +
    (passport ? 1 : 0) +
    verifiedEndorsements +
    upskillingBridgesCount;
  const payoutCount =
    134 +
    vaultReadiness.completedCount +
    financialCrossing.completedCount +
    (financialCrossing.isCrossingCleared ? 1 : 0) +
    (vault.onboardingPackGenerated ? 1 : 0) +
    clearedPayouts;
  const placementCount =
    98 +
    completedContribs +
    releasedPayouts +
    upskillingBridgesCount +
    matchedWorkCount +
    (completedContribs >= 2 ? 1 : 0);

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
      label: 'Compliance Cleared',
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
      label: 'Upskilling Bridge / Paid Placement',
      count: placementCount,
      conversionPct: placementConv,
      status:
        completedContribs >= 2 || upskillingBridgesCount > 0 || matchedWorkCount > 0
          ? 'verified'
          : completedContribs >= 1
            ? 'active'
            : 'ready',
      microCaption:
        upskillingBridgesCount > 0
          ? `${upskillingBridgesCount} bridge(s) locked · ${completedContribs} sprint(s) · $${liveUnlockedUsd.toLocaleString()} unlocked`
          : `${completedContribs} sprint(s) delivered · $${liveUnlockedUsd.toLocaleString()} unlocked`,
    },
  ];
}

export function computeAgeAndCohesionBreakdown(inputs: ReactivePulseInputs): AgeCohesionBreakdown {
  const { profile, vault, contributions } = inputs;
  const isYouth = profile.ageStage === '15-17' || profile.ageStage === '18-29';
  const youthBase = 53 + (isYouth ? 3 : 0);
  const youth15To29Pct = Math.min(62, Math.max(45, youthBase));
  const specialist30To46PlusPct = 100 - youth15To29Pct;

  const localScore = vault.proofLocalScore ?? 88;
  const remoteScore = vault.proofRemoteScore ?? 82;
  const totalScore = Math.max(1, localScore + remoteScore);
  const localWorkPct = Math.round((localScore / totalScore) * 100);
  const remoteWorkPct = 100 - localWorkPct;

  const upskillingBridgesCount = vault.upskillingBridgesCount ?? 0;
  const cohesionPodsCount =
    18 + contributions.length + upskillingBridgesCount + (vault.matchedWorkCount ?? 0);

  return {
    youth15To29Pct,
    specialist30To46PlusPct,
    activeAgeStage: profile.ageStage,
    activeAgeGroupLabel: isYouth
      ? `Youth Builder (${profile.ageStage})`
      : `Specialist / Master (${profile.ageStage})`,
    localWorkPct,
    remoteWorkPct,
    cohesionPodsCount,
    upskillingBridgesCount,
  };
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

export const SKILL_TRACK_OPTIONS: SkillTrackOption[] = [
  {
    id: 'trades-solar',
    title: 'Trades, Solar & Repair',
    examples: 'Electrical, Solar Setup, Phone/PC Repair, Plumbing',
    studioDomain: 'Green Energy',
  },
  {
    id: 'craft-tailoring',
    title: 'Craft, Tailoring & Creative',
    examples: 'Tailoring, Woodwork, Graphic Design, Media',
    studioDomain: 'SME Finance',
  },
  {
    id: 'business-finance',
    title: 'Business, Finance & Ops',
    examples: 'SME Bookkeeping, Inventory, Logistics, Customer Support',
    studioDomain: 'SME Finance',
  },
  {
    id: 'digital-code',
    title: 'Digital, Code & Language',
    examples: 'Translation, Data/QA, Web/App Building, Virtual Ops',
    studioDomain: 'Tech',
  },
  {
    id: 'agri-care',
    title: 'Agri, Education & Care',
    examples: 'Agribusiness, Tutoring, Community Health Ops',
    studioDomain: 'Healthcare Ops',
  },
];

export function getSkillTrackOption(trackId: SkillTrackId): SkillTrackOption {
  return SKILL_TRACK_OPTIONS.find((item) => item.id === trackId) ?? SKILL_TRACK_OPTIONS[0];
}

export function countWorkplaceSignals(signals: WorkplaceReadinessSignals): number {
  return (
    (signals.clearTimelines ? 1 : 0) +
    (signals.qualitySafetyCheck ? 1 : 0) +
    (signals.clientCommunication ? 1 : 0)
  );
}

export function createInitialLivingProofPortfolio(): LivingProofPortfolio {
  return {
    skillTrackId: 'trades-solar',
    problemSolvedCaption: '',
    voiceWalkthrough: '',
    peerVouch: '',
    images: [],
    workplaceSignals: {
      clearTimelines: false,
      qualitySafetyCheck: false,
      clientCommunication: false,
    },
    analysis: null,
    updatedAtIso: new Date().toISOString(),
  };
}

export function buildOfflineLivingProofAnalysis(params: {
  skillTrackId: SkillTrackId;
  imageCount: number;
  problemSolvedCaption: string;
  voiceWalkthrough: string;
  peerVouch: string;
  workplaceSignals: WorkplaceReadinessSignals;
}): LivingProofAnalysis {
  const track = getSkillTrackOption(params.skillTrackId);
  const caption = params.problemSolvedCaption.trim();
  const walkthrough = params.voiceWalkthrough.trim();
  const vouch = params.peerVouch.trim();
  const signalCount = countWorkplaceSignals(params.workplaceSignals);

  const isDigitalHeavy =
    params.skillTrackId === 'digital-code' || params.skillTrackId === 'business-finance';

  const baseLocal = isDigitalHeavy ? 72 : 84;
  const baseRemote = isDigitalHeavy ? 86 : 68;
  const evidenceBoost =
    Math.min(8, params.imageCount * 4) +
    (caption.length >= 12 ? 3 : 0) +
    (walkthrough.length >= 20 ? 3 : 0) +
    (vouch.length >= 5 ? 3 : 0) +
    signalCount * 2;

  const localReadinessPct = Math.min(98, baseLocal + evidenceBoost);
  const remoteReadinessPct = Math.min(98, baseRemote + evidenceBoost);

  const trackHighlights: Record<SkillTrackId, string[]> = {
    'trades-solar': [
      'Visible hands-on wiring/circuit discipline and clean physical tool organization ready for field inspection.',
      caption
        ? `Clearly resolves a concrete operational problem: ${caption.slice(0, 110)}`
        : 'Demonstrates practical fault isolation and safe component labeling without wasted material.',
      vouch
        ? `Backed by peer/client verification (${vouch.slice(0, 75)}) confirming real-world reliability.`
        : 'Prepared for local technical tenders as well as remote photo-based diagnostics coaching.',
    ],
    'craft-tailoring': [
      'Clean finish precision, material economy, and repeatable production quality visible in work samples.',
      caption
        ? `Direct customer value delivered: ${caption.slice(0, 110)}`
        : 'Shows workshop-ready craftsmanship adaptable to bespoke orders or cooperative batches.',
      vouch
        ? `Includes collaborator vouch (${vouch.slice(0, 75)}) strengthening buyer confidence.`
        : 'Portfolio pairs tactile craft photos with clear delivery specs for regional and digital storefronts.',
    ],
    'business-finance': [
      'Structured inventory, cash-flow, or ledger clarity built for immediate SME owner decision-making.',
      caption
        ? `Operational bottleneck resolved: ${caption.slice(0, 110)}`
        : 'Reconciles day-to-day stock and supplier cash timing with clean audit visibility.',
      vouch
        ? `Verified by past client/peer vouch (${vouch.slice(0, 75)}) for dependable follow-through.`
        : 'Strongly suited for both local SME ops oversight and remote bookkeeping / virtual ops roles.',
    ],
    'digital-code': [
      'Clear workflow logic, structured documentation, and attention to low-bandwidth / QA edge cases.',
      caption
        ? `User or system issue solved: ${caption.slice(0, 110)}`
        : 'Shows practical technical execution transferable immediately to distributed product teams.',
      vouch
        ? `Peer/client vouch attached (${vouch.slice(0, 75)}) validating async team trust.`
        : 'Ready for asynchronous remote sprints, multilingual QA, and digital operations delivery.',
    ],
    'agri-care': [
      'Practical community-facing organization, hygiene/safety awareness, and clear record-keeping.',
      caption
        ? `Community outcome achieved: ${caption.slice(0, 110)}`
        : 'Balances reliable on-the-ground service care with clear tracking for partner supervisors.',
      vouch
        ? `Supported by community/supervisor vouch (${vouch.slice(0, 75)}).`
        : 'Fits local field coordination as well as remote intake, monitoring, and bilingual support.',
    ],
  };

  const trackTips: Record<SkillTrackId, string> = {
    'trades-solar':
      'Add one close-up photo showing your final safety test reading (voltage, seal, or pressure check) beside the completed job.',
    'craft-tailoring':
      'Include one photo with a ruler or measurement spec next to the finished piece so remote buyers can verify sizing.',
    'business-finance':
      'Add one before-and-after note showing hours saved or stock discrepancies caught each week for hiring managers.',
    'digital-code':
      'Attach one short 3-bullet README note explaining what broke, what you changed, and how you tested the fix.',
    'agri-care':
      'Include one simple daily checklist photo or count metric showing how many households, students, or patients benefited.',
  };

  return {
    visualHighlights: trackHighlights[params.skillTrackId],
    localReadinessPct,
    remoteReadinessPct,
    marketFitSummary: `Strong ${track.title} fit: your proof scores ${localReadinessPct}% for local hands-on roles and ${remoteReadinessPct}% for remote delivery pods.`,
    levelUpTip: trackTips[params.skillTrackId],
    source: 'offline',
    generatedAtIso: new Date().toISOString(),
  };
}

export const SPRINT_MILESTONE_STEPS: Array<{
  key: SprintMilestoneKey;
  label: string;
  shortLabel: string;
}> = [
  { key: 'analysis-complete', label: 'Analysis Complete', shortLabel: 'Analysis' },
  { key: 'draft-ready', label: 'Draft Ready', shortLabel: 'Draft' },
  { key: 'final-submission', label: 'Final Submission', shortLabel: 'Submitted' },
];

export function normalizeSprintMilestones(
  raw: SprintMilestoneKey[] | undefined,
  isCompleted: boolean
): SprintMilestoneKey[] {
  if (isCompleted) {
    return SPRINT_MILESTONE_STEPS.map((s) => s.key);
  }
  if (!Array.isArray(raw)) return [];
  const valid = new Set<SprintMilestoneKey>(SPRINT_MILESTONE_STEPS.map((s) => s.key));
  return Array.from(new Set(raw.filter((item): item is SprintMilestoneKey => valid.has(item))));
}

export function getSprintMilestoneProgress(
  milestonesDone: SprintMilestoneKey[] | undefined,
  isCompleted: boolean
): {
  completedKeys: SprintMilestoneKey[];
  completedCount: number;
  totalCount: number;
  percentage: number;
} {
  const completedKeys = normalizeSprintMilestones(milestonesDone, isCompleted);
  const totalCount = SPRINT_MILESTONE_STEPS.length;
  const completedCount = completedKeys.length;
  const percentage = Math.round((completedCount / totalCount) * 100);
  return { completedKeys, completedCount, totalCount, percentage };
}

export function toggleSprintMilestoneList(
  current: SprintMilestoneKey[] | undefined,
  target: SprintMilestoneKey
): SprintMilestoneKey[] {
  const normalized = normalizeSprintMilestones(current, false);
  if (normalized.includes(target)) {
    return normalized.filter((k) => k !== target);
  }
  const order = SPRINT_MILESTONE_STEPS.map((s) => s.key);
  return [...normalized, target].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

export const MATCHED_WORK_OPPORTUNITIES: MatchedWorkOpportunity[] = [
  {
    id: 'opp-solar-diagnostics-01',
    title: 'Off-Grid Solar Diagnostics & Maintenance Sprint (5 Days · Paid)',
    skillTrackId: 'trades-solar',
    studioDomain: 'Green Energy',
    workMode: 'local',
    fellowshipEligible: true,
    durationLabel: '5 Days · Paid Local Sprint',
    estimatedHours: 10,
    payoutUsd: 480,
    partnerOrg: 'Mombasa CleanGrid Co-op',
    partnerLocation: 'Regional Field Clinics & Microgrids',
    whyEmployersNeedThisNow:
      'Rural clinics lose vaccine cooling every week waiting on scarce inverter diagnostics.',
    scopeSummary:
      'Inspect 48V inverter banks, tighten DC breaker busbars, and log cell-balancing checks.',
    podLeadRole: '30–46+ Experienced Specialist/Mentor (QA Lead)',
    podDeliveryRole: '15–29 Emerging/Early-Career Builder (Paid Delivery)',
    keywords: ['solar', '48v', 'inverter', 'battery', 'wiring', 'electrical', 'breaker', 'repair', 'clinic'],
    workspaceReadiness: ['written-captioned'],
    inclusiveReady: false,
  },
  {
    id: 'opp-sme-bookkeeping-02',
    title: 'SME Stock & Bookkeeping Cleanup for Local Distributor (1 Week · Paid)',
    skillTrackId: 'business-finance',
    studioDomain: 'SME Finance',
    workMode: 'local',
    fellowshipEligible: false,
    durationLabel: '1 Week · Paid Local Sprint',
    estimatedHours: 8,
    payoutUsd: 390,
    partnerOrg: 'Karatina Fresh Distributors',
    partnerLocation: 'Local Wholesale Depot',
    whyEmployersNeedThisNow:
      'Growing food wholesalers lose 12% monthly margin from uncounted stock and late invoices.',
    scopeSummary:
      'Reconcile physical SKU bin counts, clean weekly supplier ledgers, and set reorder thresholds.',
    podLeadRole: '30–46+ Experienced Specialist/Mentor (QA Lead)',
    podDeliveryRole: '15–29 Emerging/Early-Career Builder (Paid Delivery)',
    keywords: ['inventory', 'bookkeeping', 'cash', 'ledger', 'stock', 'sme', 'invoice', 'finance', 'sku'],
    workspaceReadiness: ['step-free-accessible', 'written-captioned'],
    inclusiveReady: true,
  },
  {
    id: 'opp-tailoring-batch-03',
    title: 'Custom Uniform Tailoring Batch QA & Pattern Lead (2 Weeks · Paid)',
    skillTrackId: 'craft-tailoring',
    studioDomain: 'SME Finance',
    workMode: 'local',
    fellowshipEligible: true,
    durationLabel: '2 Weeks · Paid Returnship Pod',
    estimatedHours: 14,
    payoutUsd: 440,
    partnerOrg: 'Nairobi Cooperative Garments',
    partnerLocation: 'Community Workshop Hub',
    whyEmployersNeedThisNow:
      'School uniform tenders require consistent seam grading and zero-waste cutting layouts on deadline.',
    scopeSummary:
      'Lead sizing pattern checks, stitch quality sign-off, and workshop batch packing schedules.',
    podLeadRole: '30–46+ Experienced Specialist/Mentor (QA Lead)',
    podDeliveryRole: '15–29 Emerging/Early-Career Builder (Paid Delivery)',
    keywords: ['tailoring', 'pattern', 'seam', 'garment', 'craft', 'woodwork', 'design', 'uniform', 'qa'],
    workspaceReadiness: ['step-free-accessible', 'remote-flexible'],
    inclusiveReady: true,
  },
  {
    id: 'opp-multilingual-support-04',
    title: 'Multilingual Product Support & Translation Sprint (Remote · Paid)',
    skillTrackId: 'digital-code',
    studioDomain: 'Tech',
    workMode: 'remote',
    fellowshipEligible: false,
    durationLabel: '10 Days · Remote Paid Sprint',
    estimatedHours: 8,
    payoutUsd: 410,
    partnerOrg: 'LumenAid Civic Helpdesk',
    partnerLocation: 'Async Distributed Team',
    whyEmployersNeedThisNow:
      'Cross-border service apps lose first-time users when onboarding guides skip local idioms.',
    scopeSummary:
      'Translate 40 core help workflows, resolve ticket edge cases, and QA Arabic/Swahili/French copy.',
    podLeadRole: '30–46+ Experienced Specialist/Mentor (QA Lead)',
    podDeliveryRole: '15–29 Emerging/Early-Career Builder (Paid Delivery)',
    keywords: ['translation', 'language', 'support', 'bilingual', 'arabic', 'swahili', 'french', 'ops', 'remote'],
    workspaceReadiness: ['remote-flexible', 'written-captioned'],
    inclusiveReady: true,
  },
  {
    id: 'opp-accessibility-audit-05',
    title: 'Web/Mobile Storefront Accessibility Audit & Fix (Remote · Paid)',
    skillTrackId: 'digital-code',
    studioDomain: 'Tech',
    workMode: 'remote',
    fellowshipEligible: true,
    durationLabel: '2 Weeks · Paid Fellowship Track',
    estimatedHours: 12,
    payoutUsd: 520,
    partnerOrg: 'SokoBridge Digital Fellowship',
    partnerLocation: 'Remote Product Pod',
    whyEmployersNeedThisNow:
      'Mobile-first merchants lose low-bandwidth buyers when checkout screens fail screen-reader or 3G checks.',
    scopeSummary:
      'Audit mobile storefront contrast, keyboard navigation, offline states, and ship clean UI patches.',
    podLeadRole: '30–46+ Experienced Specialist/Mentor (QA Lead)',
    podDeliveryRole: '15–29 Emerging/Early-Career Builder (Paid Delivery)',
    keywords: ['web', 'mobile', 'app', 'accessibility', 'qa', 'code', 'audit', 'typescript', 'offline', 'fix'],
    workspaceReadiness: ['remote-flexible', 'written-captioned', 'step-free-accessible'],
    inclusiveReady: true,
  },
];

export function isComplianceClearedForWork(vault?: WorkReadyVault | null): boolean {
  if (!vault) return false;
  const vaultReady = Boolean(
    vault.identityCompleted && vault.contractCompleted && vault.payoutCompleted
  );
  const kycCleared = Boolean(
    vault.financialIdentityCleared && vault.financialRailTested && vault.financialTaxCleared
  );
  const identityAndPayoutReady = Boolean(vault.identityCompleted && vault.payoutCompleted);
  return Boolean(
    vault.onboardingPackGenerated || vaultReady || kycCleared || identityAndPayoutReady
  );
}

export function rankMatchedWorkOpportunities(params: {
  portfolio: LivingProofPortfolio;
  profile: PractitionerProfile;
  passport: CompetencyPassport | null;
  vault?: WorkReadyVault | null;
}): RankedMatchedWorkOpportunity[] {
  const { portfolio, profile, passport, vault } = params;
  const hasUploadedProof = Boolean(portfolio.analysis);
  const preClearedToContract = isComplianceClearedForWork(vault);
  const userPodSeat = getUserPodSeat(profile.ageStage);
  const trackMeta = getSkillTrackOption(portfolio.skillTrackId);

  const haystack = [
    profile.problemStatement,
    portfolio.problemSolvedCaption,
    portfolio.voiceWalkthrough,
    portfolio.peerVouch,
    passport?.studioDomain ?? '',
    passport?.fieldMatch ?? '',
  ]
    .join(' ')
    .toLowerCase();

  return MATCHED_WORK_OPPORTUNITIES.map((opp, idx) => {
    const exactTrackMatch = opp.skillTrackId === portfolio.skillTrackId;
    const domainMatch =
      passport?.studioDomain === opp.studioDomain ||
      trackMeta.studioDomain === opp.studioDomain;
    const keywordHits = opp.keywords.filter((kw) => haystack.includes(kw)).length;

    let score = 68 + (idx % 3) * 3;
    if (exactTrackMatch) score += 20;
    else if (domainMatch) score += 10;
    if (hasUploadedProof && exactTrackMatch) score += 7;
    else if (hasUploadedProof) score += 4;
    score += Math.min(8, keywordHits * 2);

    const finalScore = Math.max(66, Math.min(99, score));
    const isStrongFit =
      (exactTrackMatch && hasUploadedProof) ||
      (exactTrackMatch && keywordHits > 0) ||
      finalScore >= 86;

    const isUpskillingBridgeFit = finalScore >= 65 && finalScore <= 90;

    const fitReasonLabel = isStrongFit
      ? hasUploadedProof
        ? 'Strong Fit — Aligned with Your Uploaded Proof'
        : `Strong Fit — Aligned with ${trackMeta.title}`
      : domainMatch
        ? `Aligned with your ${opp.studioDomain} skill focus`
        : 'Cross-age pod match ready for proof attachment';

    return {
      ...opp,
      matchScore: finalScore,
      isStrongFit,
      isUpskillingBridgeFit,
      fitReasonLabel,
      userPodSeat,
      preClearedToContract,
    };
  }).sort((a, b) => Number(b.isStrongFit) - Number(a.isStrongFit) || b.matchScore - a.matchScore);
}

export function filterMatchedWorkOpportunities(
  opportunities: RankedMatchedWorkOpportunity[],
  mode: MatchedWorkMode
): RankedMatchedWorkOpportunity[] {
  if (mode === 'all') return opportunities;
  if (mode === 'local') return opportunities.filter((o) => o.workMode === 'local');
  if (mode === 'remote') return opportunities.filter((o) => o.workMode === 'remote');
  if (mode === 'inclusive') {
    return opportunities.filter(
      (o) =>
        Boolean(o.inclusiveReady) ||
        o.workMode === 'remote' ||
        Boolean(o.workspaceReadiness && o.workspaceReadiness.length > 0)
    );
  }
  return opportunities.filter((o) => o.fellowshipEligible);
}

const PRESEEDED_UPSKILLING_BRIDGES: Record<
  string,
  Omit<JobToFitUpskillingBridge, 'opportunityId' | 'source' | 'updatedAtIso'>
> = {
  'opp-solar-diagnostics-01': {
    whatYouAlreadyProve: [
      '48V LiFePO4 battery cell-balancing & DC load-sag troubleshooting',
      'Clean physical breaker wiring & clinic microgrid fault isolation',
    ],
    singleMissingBridge: {
      skillTitle: 'Inverter Grounding Safety Check',
      practicalWhy:
        'Mombasa CleanGrid requires a logged earth-leakage & chassis continuity reading before energizing rural clinic vaccine banks.',
      frameworkTag: 'UNESCO UQP · ILO RPL Standard',
    },
    optionAMicroBridge: {
      title: '48V Earthing & Surge Continuity Field Check',
      durationLabel: '4 Days · Practical TVET/RPL Module',
      actionSummary:
        'Complete a hands-on clamp-meter earth-resistance check and upload 1 signed continuity photo sheet.',
      stipendPillLabel: 'Partner Fee-Waiver / Stipend Eligible',
      stipendCovers: 'Covers TVET RPL assessment fee, mobile data bundle & clamp-meter kit loan',
    },
    optionBApprenticeshipPod: {
      title: 'ILO Upgraded Solar Apprenticeship Pod',
      mentorPairingLabel: 'Paired with 30–46+ Certified Master Mentor (Eng. Samuel Kariuki)',
      cohesionNote:
        'Open to both refugee & host-community talent for mutual social cohesion · On-the-job hours convert directly into verified RPL credits.',
      paidApprenticeStipendUsd: 480,
    },
  },
  'opp-sme-bookkeeping-02': {
    whatYouAlreadyProve: [
      'Physical SKU bin-count reconciliation & weekly supplier ledger cleanup',
      'Reliable delivery timelines & clear workshop stock variance logging',
    ],
    singleMissingBridge: {
      skillTitle: 'ILO Fair-Pricing & Quote Sheet',
      practicalWhy:
        'Karatina Fresh Distributors requires a standardized landed-cost margin & tax-exempt voucher sheet for wholesale buyers.',
      frameworkTag: 'UNESCO UQP · ILO RPL Standard',
    },
    optionAMicroBridge: {
      title: 'Wholesale Margin & Tax-Exempt Voucher Micro-Bridge',
      durationLabel: '3 Days · Practical TVET/RPL Module',
      actionSummary:
        'Practice building a 1-page wholesale quote & reorder threshold sheet from 20 real depot invoices.',
      stipendPillLabel: 'Partner Fee-Waiver / Stipend Eligible',
      stipendCovers: 'Covers bookkeeping exam waiver & 5GB mobile data bundle',
    },
    optionBApprenticeshipPod: {
      title: 'ILO Upgraded SME Finance Apprenticeship Pod',
      mentorPairingLabel: 'Paired with 30–46+ Certified Master Mentor (Grace Mukasa)',
      cohesionNote:
        'Open to both refugee & host-community talent for mutual social cohesion · On-the-job hours convert directly into verified RPL credits.',
      paidApprenticeStipendUsd: 390,
    },
  },
  'opp-tailoring-batch-03': {
    whatYouAlreadyProve: [
      'Consistent garment seam construction & zero-waste fabric layout discipline',
      'Workshop-ready craft quality backed by visual proof samples',
    ],
    singleMissingBridge: {
      skillTitle: 'Industrial Seam Tolerance & Batch Spec Sheet',
      practicalWhy:
        'Nairobi Cooperative Garments requires a standardized ±2mm sizing tolerance sign-off card for 200-unit school uniform tenders.',
      frameworkTag: 'UNESCO UQP · ILO RPL Standard',
    },
    optionAMicroBridge: {
      title: 'Batch Pattern Grading & Seam QA Micro-Bridge',
      durationLabel: '5 Days · Practical TVET/RPL Module',
      actionSummary:
        'Grade a 3-size uniform run and log a photo measurement checklist against cooperative tender tolerances.',
      stipendPillLabel: 'Partner Fee-Waiver / Stipend Eligible',
      stipendCovers: 'Covers fabric sample kit, caliper tool stipend & TVET trade test waiver',
    },
    optionBApprenticeshipPod: {
      title: 'ILO Upgraded Garment QA Apprenticeship Pod',
      mentorPairingLabel: 'Paired with 30–46+ Certified Master Mentor (Master Tailor Amina)',
      cohesionNote:
        'Open to both refugee & host-community talent for mutual social cohesion · On-the-job hours convert directly into verified RPL credits.',
      paidApprenticeStipendUsd: 440,
    },
  },
  'opp-multilingual-support-04': {
    whatYouAlreadyProve: [
      'Culturally accurate multilingual communication across Arabic, Swahili, French & English',
      'Empathetic user ticket triage & clear step-by-step problem resolution',
    ],
    singleMissingBridge: {
      skillTitle: 'Remote Sprint Handoff Notes',
      practicalWhy:
        'LumenAid Civic Helpdesk runs async across 3 time zones and needs structured 3-bullet glossary & escalation handoff logs.',
      frameworkTag: 'UNESCO UQP · ILO RPL Standard',
    },
    optionAMicroBridge: {
      title: 'Async Ticket Escalation & Glossary QA Micro-Bridge',
      durationLabel: '3 Days · Practical TVET/RPL Module',
      actionSummary:
        'Complete 5 sample helpdesk shift handoffs using structured markdown tags and back-translation checks.',
      stipendPillLabel: 'Partner Fee-Waiver / Stipend Eligible',
      stipendCovers: 'Covers 10GB remote work data bundle & UQP digital badge fee waiver',
    },
    optionBApprenticeshipPod: {
      title: 'ILO Upgraded Localization Apprenticeship Pod',
      mentorPairingLabel: 'Paired with 30–46+ Certified Master Mentor (Dr. Amina Haddad)',
      cohesionNote:
        'Open to both refugee & host-community talent for mutual social cohesion · On-the-job hours convert directly into verified RPL credits.',
      paidApprenticeStipendUsd: 410,
    },
  },
  'opp-accessibility-audit-05': {
    whatYouAlreadyProve: [
      'Low-bandwidth mobile UI testing & practical front-end troubleshooting',
      'Structured bug reproduction & clear technical documentation',
    ],
    singleMissingBridge: {
      skillTitle: 'WCAG Keyboard-Trap & Contrast Sign-Off Sheet',
      practicalWhy:
        'SokoBridge Digital Fellowship requires a 1-page screen-reader focus order & 4.5:1 contrast verification log before merging checkout fixes.',
      frameworkTag: 'UNESCO UQP · ILO RPL Standard',
    },
    optionAMicroBridge: {
      title: 'Mobile Accessibility & Screen-Reader QA Micro-Bridge',
      durationLabel: '4 Days · Practical TVET/RPL Module',
      actionSummary:
        'Audit a 3-step mobile checkout flow for keyboard focus traps and attach annotated before/after contrast tokens.',
      stipendPillLabel: 'Partner Fee-Waiver / Stipend Eligible',
      stipendCovers: 'Covers accessibility certification fee waiver & prepaid data stipend',
    },
    optionBApprenticeshipPod: {
      title: 'ILO Upgraded Digital Engineering Apprenticeship Pod',
      mentorPairingLabel: 'Paired with 30–46+ Certified Master Mentor (Eng. Tomasz Kowalski)',
      cohesionNote:
        'Open to both refugee & host-community talent for mutual social cohesion · On-the-job hours convert directly into verified RPL credits.',
      paidApprenticeStipendUsd: 520,
    },
  },
};

export function buildPreseededUpskillingBridge(params: {
  opportunity: MatchedWorkOpportunity;
  portfolio: LivingProofPortfolio;
  profile: PractitionerProfile;
  passport: CompetencyPassport | null;
}): JobToFitUpskillingBridge {
  const { opportunity, portfolio, passport } = params;
  const preset =
    PRESEEDED_UPSKILLING_BRIDGES[opportunity.id] ??
    PRESEEDED_UPSKILLING_BRIDGES['opp-solar-diagnostics-01'];

  const passportSkills =
    passport?.verifiedSkills
      .map((s) => s.name.trim())
      .filter((s) => s.length >= 4)
      .slice(0, 2) ?? [];

  const proofHighlights =
    portfolio.analysis?.visualHighlights
      .map((h) => h.trim())
      .filter((h) => h.length >= 8)
      .slice(0, 2) ?? [];

  const exactTrackMatch = portfolio.skillTrackId === opportunity.skillTrackId;

  let strengthOne = preset.whatYouAlreadyProve[0];
  let strengthTwo = preset.whatYouAlreadyProve[1];

  if (exactTrackMatch && proofHighlights.length >= 1) {
    strengthOne = proofHighlights[0].slice(0, 115);
  } else if (passportSkills.length >= 1) {
    strengthOne = `Verified Passport Competence: ${passportSkills[0]}`;
  }

  if (exactTrackMatch && proofHighlights.length >= 2) {
    strengthTwo = proofHighlights[1].slice(0, 115);
  } else if (passportSkills.length >= 2) {
    strengthTwo = `Verified Field Evidence: ${passportSkills[1]}`;
  } else if (portfolio.problemSolvedCaption.trim().length >= 10) {
    strengthTwo = `Demonstrated Craft Proof: ${portfolio.problemSolvedCaption.trim().slice(0, 100)}`;
  }

  return {
    opportunityId: opportunity.id,
    whatYouAlreadyProve: [strengthOne, strengthTwo],
    singleMissingBridge: { ...preset.singleMissingBridge },
    optionAMicroBridge: { ...preset.optionAMicroBridge },
    optionBApprenticeshipPod: {
      ...preset.optionBApprenticeshipPod,
      paidApprenticeStipendUsd: opportunity.payoutUsd,
    },
    source: 'preset',
    updatedAtIso: new Date().toISOString(),
  };
}

export interface AdaptiveVerificationRouteOption {
  id: VerificationRouteId;
  shortTag: string;
  frameworkBadge: string;
  title: string;
  subtitle: string;
  bestForAges: AgeStage[];
}

export const ADAPTIVE_VERIFICATION_ROUTES: AdaptiveVerificationRouteOption[] = [
  {
    id: 'route-a-foreign',
    shortTag: 'Route A',
    frameworkBadge: 'WES Gateway / ENIC-NARIC Track',
    title: 'Foreign Qualification or Partial Copy',
    subtitle:
      'Enter or upload a photo of a foreign degree, partial transcript, or professional license to map host-country NQF equivalency.',
    bestForAges: ['30-45', '18-29'],
  },
  {
    id: 'route-b-uqp',
    shortTag: 'Route B',
    frameworkBadge: 'UNESCO UQP Structured Track',
    title: 'Missing or Lost Paperwork',
    subtitle:
      'For formal education or deep experience with zero documents. Complete a concise 3-part background reconstruction & oral technical defense.',
    bestForAges: ['46+', '30-45'],
  },
  {
    id: 'route-c-rpl',
    shortTag: 'Route C',
    frameworkBadge: 'ILO & KNQA RPL Portfolio Track',
    title: 'Hands-On / Informal Craft',
    subtitle:
      'For self-taught builders, tradespeople, and 15–17+ emerging talent. Share 1 work photo, a 30-second "How I built/fixed this" walkthrough & optional vouch.',
    bestForAges: ['15-17', '18-29'],
  },
];

export function getRecommendedVerifyRoute(ageStage: AgeStage): VerificationRouteId {
  if (ageStage === '30-45') return 'route-a-foreign';
  if (ageStage === '46+') return 'route-b-uqp';
  return 'route-c-rpl';
}

export function computePassportTrustTier(params: {
  passport: CompetencyPassport | null;
  capabilities: SkillCapability[];
  endorsements: PeerEndorsement[];
  contributions?: BriefSubmission[];
}): {
  activeTier: PassportTrustTier;
  tiers: Array<{
    tier: PassportTrustTier;
    label: string;
    shortDesc: string;
    reached: boolean;
    isCurrent: boolean;
  }>;
} {
  const { passport, capabilities, endorsements, contributions = [] } = params;
  const hasMasterEndorsedCap = capabilities.some((c) => c.verificationStatus === 'master-endorsed');
  const hasFieldVerifiedCap = capabilities.some((c) => c.verificationStatus !== 'pending');
  const hasVerifiedEndorsement = endorsements.some((e) => e.status === 'verified');
  const hasCompletedSprint = contributions.some((c) => c.status === 'completed');

  let activeTier: PassportTrustTier = 1;
  if (passport?.stipendEligible && (hasMasterEndorsedCap || (hasCompletedSprint && hasVerifiedEndorsement))) {
    activeTier = 4;
  } else if (hasCompletedSprint && (Boolean(passport) || hasFieldVerifiedCap)) {
    activeTier = 3;
  } else if (hasVerifiedEndorsement || hasMasterEndorsedCap || (Boolean(passport) && hasFieldVerifiedCap)) {
    activeTier = 2;
  } else {
    activeTier = 1;
  }

  if (passport?.trustTier && passport.trustTier > activeTier) {
    activeTier = passport.trustTier;
  }

  const definitions: Array<{ tier: PassportTrustTier; label: string; shortDesc: string }> = [
    {
      tier: 1,
      label: '1. AI-Evaluated',
      shortDesc: 'Practical competency & NQF equivalency mapped',
    },
    {
      tier: 2,
      label: '2. Peer-Master Verified',
      shortDesc: 'Co-signed by 30–46+ specialist or field peer',
    },
    {
      tier: 3,
      label: '3. Paid Sprint Proven',
      shortDesc: 'Deliverable accepted in live employer sprint',
    },
    {
      tier: 4,
      label: '4. Accredited RPL / QAB Certified',
      shortDesc: 'National TVET / RPL assessment & licensing bridged',
    },
  ];

  return {
    activeTier,
    tiers: definitions.map((d) => ({
      ...d,
      reached: d.tier <= activeTier,
      isCurrent: d.tier === activeTier,
    })),
  };
}

export const FOREIGN_CIVIL_TRANSCRIPT_SAMPLE = {
  institutionName: 'University of Khartoum — Faculty of Engineering (Partial Copy)',
  credentialTitle: 'B.Sc. Civil & Structural Engineering (Years 1–4 Completed · License Copy Attached)',
  hostCountryTarget: 'Kenya (KNQA / EBK) & East Africa Regional Recognition',
  domain: 'Green Energy' as StudioDomain,
  responseText:
    'Completed 4 years of B.Sc. Civil & Structural Engineering coursework and 5 years supervising reinforced concrete foundation pads, gravity-fed water tanks, and 48V solar mini-grid powerhouse structures. Original degree parchment remained in Khartoum during displacement; holding partial semester transcripts (Semesters 1–7) and stamped site commissioning logbooks.',
  evidenceSummary:
    'Partial Transcript (Semesters 1–7, Structural Analysis, Hydraulics & Foundation Design) + Municipal Site Engineer Stamp #KH-4418',
};

export const UQP_STRUCTURED_RECONSTRUCTION_SAMPLE = {
  backgroundField: 'Off-Grid Solar Microgrids & Clinical Cold-Chain Electrical Systems',
  yearsPracticed: '7 Years (Lead Technician & Commissioning Supervisor)',
  languageFluency: 'Arabic (Native), English (Professional Technical), Kiswahili (Working Field)',
  oralDefense1:
    'When a 48V LiFePO4 clinic battery bank trips at 03:00 despite showing 54% SOC at dusk, I first isolate the critical vaccine fridge bus, measure individual block voltages under a 25A discharge load to detect a high-resistance cell or loose busbar torque, and recalibrate the BMS low-voltage cutoff and absorption timer.',
  oralDefense2:
    'For safety and lockout-tagout on live solar hybrid boards, I open the PV array DC isolator first, disconnect the inverter AC output breaker, discharge inverter capacitors for 5 minutes, verify zero potential with a CAT-III multimeter, and tag the breaker before torque-checking terminals.',
  alternativeContextNotes:
    'Maintained 11 rural maternity and vaccine cold-chain microgrids across displacement corridors; mentored 6 junior apprentices without formal paper certificates.',
};

export const RPL_INFORMAL_CRAFT_SAMPLE = {
  craftTitle: '48V Solar Inverter, Charge Controller & Breaker Board Assembly',
  howIBuiltThis:
    'I wired and balanced this 48V 5kVA hybrid solar distribution board for a community cold-room. I sized the 125A DC main fuse, crimped 35mm² copper lugs with heat-shrink polarity sleeves, separated the essential vaccine chiller load from daytime workshop sockets, and logged a 24-hour thermal load test with zero voltage sag.',
  clientOrMentorVouch:
    'Eng. Rami Al-Khatib (46+ Master Microgrid Assessor): "Verified busbar torque, clean earth-bonding, and stable 52.8V float charge under full compressor startup."',
  samplePhotoDataUrl:
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" fill="none">
        <rect width="360" height="220" rx="16" fill="#142B24"/>
        <rect x="20" y="20" width="145" height="180" rx="10" fill="#1E3F35" stroke="#2EB88B" stroke-width="2"/>
        <rect x="36" y="38" width="113" height="48" rx="6" fill="#0F211C" stroke="#5EEAD4" stroke-width="1.5"/>
        <text x="48" y="67" fill="#5EEAD4" font-family="monospace" font-size="15" font-weight="bold">52.8V · 98% SOC</text>
        <rect x="185" y="20" width="155" height="180" rx="10" fill="#1E242B" stroke="#C4622D" stroke-width="2"/>
        <rect x="205" y="44" width="32" height="55" rx="4" fill="#146C53"/>
        <rect x="247" y="44" width="32" height="55" rx="4" fill="#146C53"/>
        <rect x="289" y="44" width="32" height="55" rx="4" fill="#C4622D"/>
        <path d="M165 110 H185" stroke="#5EEAD4" stroke-width="4"/>
        <text x="36" y="176" fill="#E7F3EE" font-family="sans-serif" font-size="11">48V Hybrid Inverter Bus</text>
        <text x="205" y="176" fill="#F9E9DF" font-family="sans-serif" font-size="11">DC Breaker &amp; Surge Array</text>
      </svg>`
    ),
};

export function buildAdaptiveCompetencyPassportFallback(params: {
  ownerUid: string;
  displayName: string;
  ageStage: AgeStage;
  studioDomain: StudioDomain;
  verificationRoute: VerificationRouteId;
  responseText: string;
  evidenceSummary?: string;
  languageFluency?: string;
  verifiableId?: string;
}): CompetencyPassport {
  const {
    ownerUid,
    displayName,
    ageStage,
    studioDomain,
    verificationRoute,
    evidenceSummary,
    languageFluency,
    verifiableId = 'VNA-2026-8412',
  } = params;

  const isRouteA = verificationRoute === 'route-a-foreign';
  const isRouteB = verificationRoute === 'route-b-uqp';

  const nqfEquivalencyLevel = isRouteA
    ? 'NQF Level 6 / KNQA Bachelor Equivalency (WES Gateway / ENIC-NARIC Mapped)'
    : isRouteB
      ? 'UNESCO UQP Level 6 · Senior Applied Specialist Equivalency'
      : 'KNQA / ILO RPL Level 4–5 · Certified Trade & Systems Practitioner';

  const reconstructedCredential = isRouteA
    ? evidenceSummary?.trim() ||
      'Foreign Engineering / Technical Qualification (Partial Transcript & Professional License Reconstructed)'
    : isRouteB
      ? 'UNESCO Qualifications Passport (UQP) Structured Dossier & Technical Oral Defense Verified'
      : 'ILO / KNQA Recognition of Prior Learning (RPL) Portfolio of Visual & Practical Evidence';

  const languageProficiency =
    languageFluency?.trim() ||
    'Professional Working Proficiency (English · Arabic · Kiswahili Technical Terminology)';

  const workplaceSkills = isRouteA
    ? [
        'Host-Country Code & Regulatory Alignment',
        'Structural / Systems Load Calculation',
        'Cross-Age Pod Quality Sign-Off',
      ]
    : isRouteB
      ? [
          'Lockout-Tagout & Field Safety Discipline',
          'Structured Diagnostic Oral Defense',
          'Junior Apprentice Mentorship & Handover',
        ]
      : [
          'Precision Assembly & Safety Testing',
          'Visual As-Built Documentation',
          'Client Scope & Timeline Reliability',
        ];

  const verifiedSkills = isRouteA
    ? [
        {
          name: `${studioDomain} Engineering & Structural Systems Design`,
          confidenceLabel: 'High Confidence',
          confidenceScore: 93,
          evidenceNote:
            'Reconstructed from foreign transcript coursework and verified practical site supervision logs.',
        },
        {
          name: 'Host-Country Technical Standards & Safety Compliance',
          confidenceLabel: 'Verified Applied',
          confidenceScore: 89,
          evidenceNote:
            'Mapped directly to national NQF Level 6 criteria under WES Gateway / ENIC-NARIC equivalency.',
        },
        {
          name: 'Cross-Age Solution Pod Technical Review',
          confidenceLabel: 'Verified Applied',
          confidenceScore: 86,
          evidenceNote:
            'Demonstrates clear schematic documentation and multi-generational team leadership.',
        },
      ]
    : isRouteB
      ? [
          {
            name: `${studioDomain} Root-Cause Diagnostics & Fault Isolation`,
            confidenceLabel: 'High Confidence',
            confidenceScore: 92,
            evidenceNote:
              'Confirmed through UNESCO UQP structured background reconstruction and 2-part technical oral defense.',
          },
          {
            name: 'Critical Load Protection & Preventive Stabilization',
            confidenceLabel: 'High Confidence',
            confidenceScore: 88,
            evidenceNote:
              'Articulates step-by-step lockout-tagout and load isolation without relying on paper certificates.',
          },
          {
            name: 'Multilingual Field Handoff & SOP Authoring',
            confidenceLabel: 'Verified Applied',
            confidenceScore: 85,
            evidenceNote:
              'Proven ability to translate complex technical fixes into clear operator checklists.',
          },
        ]
      : [
          {
            name: `${studioDomain} Hands-On Installation & Fault Repair`,
            confidenceLabel: 'High Confidence',
            confidenceScore: 90,
            evidenceNote:
              'Verified via ILO/KNQA RPL work photo evidence and practical "How I built/fixed this" walkthrough.',
          },
          {
            name: 'Electrical / Mechanical Safety & Load Commissioning',
            confidenceLabel: 'Verified Applied',
            confidenceScore: 86,
            evidenceNote:
              'Demonstrates clean terminal sizing, protective fusing, and verifiable commissioning tests.',
          },
          {
            name: 'Collaborative Sprint Delivery & Peer Reliability',
            confidenceLabel: 'Verified Applied',
            confidenceScore: 84,
            evidenceNote:
              'Backed by practical craft portfolio and mentor/client quality attestation.',
          },
        ];

  const microBridge = isRouteA
    ? {
        title: 'Local Statutory Code & National Board Bridging Assessment (KNQA / EBK Fast-Track)',
        secondaryModule: 'Host-Country Environmental & Grid Interconnection Sign-Off Lab',
        action:
          'Complete a 1-day practical portfolio defense and local statutory code module with an accredited national assessor to convert your NQF Level 6 equivalency into full local practicing clearance.',
        estimatedDuration: '5 Days · Hybrid Statutory Bridging',
        partnerProgram: 'WES Gateway · KNQA / National Engineering & TVET Bridging Pool',
        estimatedCostUsd: 75,
        feeCoverageNote: 'Covers RPL statutory portfolio assessment fee, exam registration & code handbook',
      }
    : isRouteB
      ? {
          title: 'UNESCO UQP Accredited Assessor Practical Verification & QAB Sign-Off',
          secondaryModule: 'ILO RPL Field Safety & Calibration Logbook Endorsement',
          action:
            'Complete one supervised 4-hour practical verification benchmark with an accredited 46+ Master Assessor to elevate your UQP dossier to Tier-4 QAB certification.',
          estimatedDuration: '4 Days · Supervised Practical Benchmark',
          partnerProgram: 'UNESCO Qualifications Passport (UQP) · ILO PROSPECTS Network',
          estimatedCostUsd: 65,
          feeCoverageNote: 'Covers UQP assessor sit-in fee, calibration tool kit & 10GB data stipend',
        }
      : {
          title: 'KNQA / ILO RPL Trade Test Grade-1 Portfolio Assessment & Safety Badge',
          secondaryModule: 'Standardized Client Quote, Lockout-Tagout & As-Built Sign-Off Sheet',
          action:
            'Submit your 3-item practical photo portfolio and complete a half-day hands-on trade verification at a partner TVET hub to unlock formal RPL Level 4–5 certification.',
          estimatedDuration: '3 Days · Practical TVET / RPL Trade Test',
          partnerProgram: 'ILO Recognition of Prior Learning (RPL) · Regional TVET Guild',
          estimatedCostUsd: 55,
          feeCoverageNote: 'Covers TVET RPL trade-test registration, PPE safety kit & transport/data bundle',
        };

  return {
    id: makeSafeId('passport'),
    ownerUid,
    studioDomain,
    inputMode: isRouteB ? 'scenario' : 'summary',
    verificationRoute,
    verifiableId,
    nqfEquivalencyLevel,
    reconstructedCredential,
    languageProficiency,
    workplaceSkills,
    ageStageTrack: `${AGE_STAGE_PATHWAYS[ageStage].shortLabel} · ${
      isRouteA ? 'WES/ENIC Equivalency' : isRouteB ? 'UNESCO UQP Track' : 'ILO/KNQA RPL Track'
    }`,
    fieldMatch: `${studioDomain} Systems Execution & Applied Field Diagnostics`,
    executiveSummary: `${displayName} holds verified applied competency in ${studioDomain} (${nqfEquivalencyLevel}), evaluated via the ${
      isRouteA
        ? 'WES Gateway / ENIC-NARIC Foreign Qualification Reconstruction Track'
        : isRouteB
          ? 'UNESCO Qualifications Passport (UQP) Structured Oral Defense Track'
          : 'ILO & KNQA Recognition of Prior Learning (RPL) Portfolio Track'
    }. Ready for immediate scoped sprint contracting and cross-age pod collaboration.`,
    verifiedSkills,
    microBridge,
    stipendEligible: false,
    generatedAtIso: new Date().toISOString(),
  };
}



