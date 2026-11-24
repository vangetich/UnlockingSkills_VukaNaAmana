export type AgeStage = '15-17' | '18-29' | '30-45' | '46+';

export type LocaleCode = 'en' | 'sw' | 'fr' | 'ar';

export type ThemeMode = 'light' | 'dark';

export type WorkspaceTab = 'verify' | 'unlock' | 'solve' | 'pulse';

export type AppViewMode = 'landing' | 'studio';

export type VerificationStatus = 'pending' | 'field-verified' | 'master-endorsed';

export type ContributionStatus = 'in-progress' | 'completed';

export type StudioDomain = 'Tech' | 'Green Energy' | 'Healthcare Ops' | 'SME Finance';

export type BriefComplexity = 'Foundational' | 'Applied' | 'Advanced';

export interface PractitionerProfile {
  uid: string;
  displayName: string;
  email: string;
  problemStatement: string;
  ageStage: AgeStage;
  preferredLocale: LocaleCode;
  themePreference: ThemeMode;
  onboarded: boolean;
  updatedAtIso: string;
}

export interface SkillCapability {
  id: string;
  ownerUid: string;
  title: string;
  domain: string;
  proofSummary: string;
  portfolioRef?: string;
  certificationRef?: string;
  peerEndorsement?: string;
  verificationStatus: VerificationStatus;
  confidenceScore: number;
  createdAtIso: string;
  updatedAtIso: string;
}

export interface PassportVerifiedSkill {
  name: string;
  confidenceLabel: string;
  confidenceScore: number;
  evidenceNote: string;
}

export interface PassportMicroBridge {
  title: string;
  action: string;
  estimatedDuration: string;
  partnerProgram: string;
}

export interface CompetencyPassport {
  id: string;
  ownerUid: string;
  studioDomain: StudioDomain;
  inputMode: 'summary' | 'scenario';
  ageStageTrack: string;
  fieldMatch: string;
  executiveSummary: string;
  verifiedSkills: PassportVerifiedSkill[];
  microBridge: PassportMicroBridge;
  stipendEligible: boolean;
  generatedAtIso: string;
}

export interface PracticalScenario {
  id: string;
  domain: StudioDomain;
  title: string;
  context: string;
  question: string;
  placeholder: string;
}

export interface ProblemBrief {
  id: string;
  title: string;
  domain: string;
  studioDomain: StudioDomain;
  complexity: BriefComplexity;
  organization: string;
  locationLabel: string;
  summary: string;
  deliverableChecklist: string[];
  estimatedHours: number;
  payoutUsd: number;
  recommendedStages: AgeStage[];
  requiredKeywords: string[];
}

export interface BriefSubmission {
  id: string;
  ownerUid: string;
  briefId: string;
  briefTitle: string;
  domain: string;
  status: ContributionStatus;
  solutionNotes: string;
  hoursLogged: number;
  payoutUsd: number;
  createdAtIso: string;
  updatedAtIso: string;
}

export type UnlockViewMode = 'talent' | 'partner';

export type AuthPathwayOption =
  | 'remote-contractor'
  | 'host-country-permit'
  | 'eor-bridge';

export type ContractTemplateOption =
  | 'milestone-sprint'
  | 'local-services'
  | 'cross-border-advisory';

export type PayoutRailOption =
  | 'mobile-money'
  | 'local-bank'
  | 'global-wallet';

export interface WorkReadyVault {
  id: string;
  ownerUid: string;
  identityCompleted: boolean;
  identityPathway: AuthPathwayOption;
  contractCompleted: boolean;
  contractTemplate: ContractTemplateOption;
  payoutCompleted: boolean;
  payoutRail: PayoutRailOption;
  updatedAtIso: string;
}

export type EndorsementStatus = 'requested' | 'verified';

export interface PeerEndorsement {
  id: string;
  ownerUid: string;
  collaboratorName: string;
  collaboratorRole: string;
  organization: string;
  capabilityTitle: string;
  endorsementText: string;
  status: EndorsementStatus;
  shareToken: string;
  sourceTab: 'verify' | 'unlock';
  createdAtIso: string;
  updatedAtIso: string;
}

export type PayoutLifecycleStatus = 'escrow-held' | 'processing' | 'released';

export interface ContractPayout {
  id: string;
  ownerUid: string;
  sprintId: string;
  sprintTitle: string;
  partnerOrg: string;
  amountUsd: number;
  payoutRail: PayoutRailOption;
  status: PayoutLifecycleStatus;
  createdAtIso: string;
  updatedAtIso: string;
}

export type SprintPartnerType = 'Local SME' | 'NGO' | 'Remote Tech Team';

export interface SolutionSprint {
  id: string;
  title: string;
  partnerOrg: string;
  partnerType: SprintPartnerType;
  durationLabel: string;
  estimatedHours: number;
  payoutUsd: number;
  domain: string;
  studioDomain: StudioDomain;
  complexity: BriefComplexity;
  locationLabel: string;
  painPoint: string;
  deliverableChecklist: string[];
  podLeadRole: string;
  podDeliveryRole: string;
  requiredKeywords: string[];
}

export interface RankedSolutionSprint extends SolutionSprint {
  matchScore: number;
  whyYouFit: string;
  userPodSeat: 'lead' | 'delivery';
}

export type OfflineMutation =
  | {
      id: string;
      kind: 'upsert_profile';
      payload: PractitionerProfile;
      queuedAtIso: string;
    }
  | {
      id: string;
      kind: 'upsert_capability';
      payload: SkillCapability;
      queuedAtIso: string;
    }
  | {
      id: string;
      kind: 'delete_capability';
      capabilityId: string;
      queuedAtIso: string;
    }
  | {
      id: string;
      kind: 'upsert_contribution';
      payload: BriefSubmission;
      queuedAtIso: string;
    }
  | {
      id: string;
      kind: 'upsert_passport';
      payload: CompetencyPassport;
      queuedAtIso: string;
    }
  | {
      id: string;
      kind: 'upsert_vault';
      payload: WorkReadyVault;
      queuedAtIso: string;
    }
  | {
      id: string;
      kind: 'upsert_endorsement';
      payload: PeerEndorsement;
      queuedAtIso: string;
    }
  | {
      id: string;
      kind: 'delete_endorsement';
      endorsementId: string;
      queuedAtIso: string;
    }
  | {
      id: string;
      kind: 'upsert_payout';
      payload: ContractPayout;
      queuedAtIso: string;
    };

export interface MilestoneBadge {
  id: string;
  title: string;
  subtitle: string;
  tier: 'Foundation' | 'Field' | 'Specialist' | 'Master';
  unlocked: boolean;
  currentValue: number;
  targetValue: number;
  unit: string;
  iconKey: 'shield' | 'award' | 'zap' | 'compass' | 'layers' | 'check';
}

export type SprintComplexityLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface SdgPulseMetric {
  sdgNumber: 4 | 8 | 10 | 16 | 17;
  sdgLabel: string;
  title: string;
  primaryValue: string;
  numericValue: number;
  metricCaption: string;
  liveDeltaLabel: string;
  microStory: string;
  accent: 'emerald' | 'terracotta';
}

export interface KnowledgeFlowStage {
  id: 'intake' | 'passport' | 'payout' | 'placement';
  stepNumber: string;
  label: string;
  count: number;
  conversionPct: number;
  status: 'verified' | 'active' | 'ready';
  microCaption: string;
}

export interface SprintPerformancePoint {
  label: string;
  acceptanceRatePct: number;
  payoutUsd: number;
}

export interface SprintPerformanceData {
  points: SprintPerformancePoint[];
  currentAcceptanceRatePct: number;
  acceptanceDeltaPct: number;
  totalHistoricalEarningsUsd: number;
  latestPayoutUsd: number;
  completedCount: number;
  totalPodsCount: number;
}

export type ScaleRegionId = 'kenya' | 'jordan' | 'uganda' | 'colombia' | 'poland';

export type ScaleSectorId =
  | 'solar'
  | 'agritech'
  | 'digital-services'
  | 'healthcare-ops'
  | 'sme-finance';

export interface CohortBlueprintPreview {
  regionId: ScaleRegionId;
  regionLabel: string;
  hubCities: string;
  sectorId: ScaleSectorId;
  sectorLabel: string;
  studioDomain: StudioDomain;
  languageCode: LocaleCode;
  languageLabel: string;
  aiDiagnosticTitle: string;
  aiDiagnosticSummary: string;
  compliancePathwayLabel: string;
  complianceChecklist: string[];
  payoutRail: PayoutRailOption;
  payoutRailLocalLabel: string;
  sprintTemplates: Array<{
    title: string;
    partnerType: SprintPartnerType;
    durationLabel: string;
    payoutUsd: number;
  }>;
  estimatedLaunchTime: string;
}

export interface PeerFlywheelMetrics {
  cohortSize: number;
  flywheelEnabled: boolean;
  graduatedMastersAndSpecialists: number;
  emergingBuildersMentored: number;
  manualAdminHoursPerWeek: number;
  overheadReductionPct: number;
  assessorMonthlyStipendUsd: number;
  qaTurnaroundHours: number;
  sustainabilityLabel: string;
}

export interface SharedPassportPayload {
  passportId: string;
  practitionerName: string;
  ageStage: AgeStage;
  studioDomain: StudioDomain;
  fieldMatch: string;
  ageStageTrack: string;
  executiveSummary: string;
  verifiedSkills: PassportVerifiedSkill[];
  microBridge: PassportMicroBridge;
  stipendEligible: boolean;
  verifiedCapabilitiesCount: number;
  verifiedEndorsements: Array<{
    collaboratorName: string;
    collaboratorRole: string;
    organization: string;
    endorsementText: string;
  }>;
  generatedAtIso: string;
  readOnlySignature: string;
}

export interface AnalyticsSummary {
  verifiedCapabilitiesCount: number;
  totalCapabilitiesCount: number;
  completedContributionsCount: number;
  activeBriefsCount: number;
  totalEarnedUsd: number;
  totalHoursApplied: number;
  domainGrowth: {
    domain: string;
    baselineScore: number;
    currentScore: number;
    verifiedCount: number;
    completedCount: number;
  }[];
}
