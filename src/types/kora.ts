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
  deadlineIso?: string;
}

export interface SprintDueAlert {
  contributionId: string;
  briefId: string;
  briefTitle: string;
  deadlineIso: string;
  hoursRemaining: number;
  formattedRemaining: string;
  isOverdue: boolean;
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

export type FinancialPayoutRail =
  | 'mobile-money'
  | 'global-wallet'
  | 'fiscal-host'
  | 'local-bank';

export type FatfKycTierId = 'tier-1' | 'tier-2' | 'tier-3';

export type ContractingStructureOption =
  | 'direct-local'
  | 'scoped-remote'
  | 'eor-fiscal-host';

export interface OnboardingPackResult {
  agreementTitle: string;
  contractingSummary: string;
  scopeAndDeliverables: string;
  fairPaySchedule: string;
  complianceAttestation: string;
  fullAgreementText: string;
  source: 'ai' | 'template';
  generatedAtIso: string;
}

export interface WorkReadyVault {
  id: string;
  ownerUid: string;
  identityCompleted: boolean;
  identityPathway: AuthPathwayOption;
  contractCompleted: boolean;
  contractTemplate: ContractTemplateOption;
  payoutCompleted: boolean;
  payoutRail: PayoutRailOption;
  financialIdentityCleared?: boolean;
  financialRailTested?: boolean;
  financialTaxCleared?: boolean;
  financialRail?: FinancialPayoutRail;
  onboardingPackGenerated?: boolean;
  onboardingContractStructure?: ContractingStructureOption;
  onboardingPartnerOrg?: string;
  onboardingHostCountry?: string;
  onboardingPackGeneratedAtIso?: string;
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
    }
  | {
      id: string;
      kind: 'upsert_sprint_feedback';
      payload: SprintFeedback;
      queuedAtIso: string;
    }
  | {
      id: string;
      kind: 'upsert_mentor_message';
      payload: MentorMessage;
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

export type SprintRatingScore = 1 | 2 | 3 | 4 | 5;

export interface SprintFeedback {
  id: string;
  ownerUid: string;
  contributionId: string;
  briefId: string;
  briefTitle: string;
  partnerOrg: string;
  reviewerName: string;
  reviewerRole: string;
  rating: SprintRatingScore;
  reviewText: string;
  createdAtIso: string;
  updatedAtIso: string;
}

export interface SprintFeedbackSummary {
  totalReviews: number;
  averageRating: number;
  fiveStarCount: number;
}

export type MentorAvailabilityStatus = 'available' | 'in-review' | 'away';

export interface PodMentorProfile {
  id: string;
  name: string;
  roleTitle: string;
  ageStage: '30-45' | '46+';
  ageStageBadge: string;
  domain: StudioDomain;
  hubLocation: string;
  specialty: string;
  availability: MentorAvailabilityStatus;
  availabilityLabel: string;
  responseWindow: string;
  greetingPrompt: string;
}

export interface MentorMessage {
  id: string;
  ownerUid: string;
  sprintId: string;
  sprintTitle: string;
  mentorId: string;
  mentorName: string;
  sender: 'practitioner' | 'mentor';
  body: string;
  createdAtIso: string;
  updatedAtIso: string;
}

export type IdentityDocumentTier =
  | 'refugee-id'
  | 'unhcr-proof'
  | 'convention-travel'
  | 'pending-paperwork';

export type TargetWorkMode =
  | 'local-formal'
  | 'cross-border-remote'
  | 'paid-fellowship';

export type RegulatoryAccessTier =
  | 'Enabling'
  | 'Mixed — Friction Guided'
  | 'Restricted — Remote/EOR Route Active';

export interface ComplianceCrossingRoute {
  country: string;
  docTier: IdentityDocumentTier;
  workMode: TargetWorkMode;
  accessTier: RegulatoryAccessTier;
  pathwayHeadline: string;
  talentSteps: string[];
  partnerSteps: string[];
  iloRightsGuarantee: string;
  source: 'preset' | 'ai';
  updatedAtIso: string;
}

export interface FinancialPayoutRailOption {
  id: FinancialPayoutRail;
  label: string;
  shortLabel: string;
  plainDescription: string;
  supportedTiers: FatfKycTierId[];
}

export interface FatfKycTierGuidance {
  id: FatfKycTierId;
  tierLabel: string;
  frictionLabel: string;
  summary: string;
  recommendedRailsLabel: string;
  recommendedRailId: FinancialPayoutRail;
  kycMechanismNote: string;
}

