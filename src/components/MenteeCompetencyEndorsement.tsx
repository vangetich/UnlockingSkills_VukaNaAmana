import React, { useMemo, useState } from 'react';
import {
  Award,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  UserCheck,
} from 'lucide-react';
import type {
  BriefSubmission,
  MenteeBadgeCompetencyLevel,
  MenteeCompetencyBadge,
  MentorRatingScore,
  StudioDomain,
} from '../types/kora';
import {
  getAssignedMentorForSprint,
  isValidFirebaseId,
  sanitizeText,
} from '../utils/talentEngine';

export interface DomainSkillBadgePreset {
  badgeTitle: string;
  skillCategory: string;
  defaultLevel: MenteeBadgeCompetencyLevel;
  defaultRating: MentorRatingScore;
  defaultCompetencies: string[];
  defaultCitation: string;
}

export const PERFORMANCE_RATING_SCALE_META: Record<
  MentorRatingScore,
  {
    score: MentorRatingScore;
    label: string;
    shortLabel: string;
    description: string;
  }
> = {
  1: {
    score: 1,
    label: '1 / 5 · Developing Foundation',
    shortLabel: 'Developing',
    description: 'Requires structured guidance on core sprint diagnostics and safety checks.',
  },
  2: {
    score: 2,
    label: '2 / 5 · Emerging Execution',
    shortLabel: 'Emerging',
    description: 'Completes scoped tasks with regular mentor review on edge cases.',
  },
  3: {
    score: 3,
    label: '3 / 5 · Competent Delivery',
    shortLabel: 'Competent',
    description: 'Meets all partner rubric thresholds with reliable field documentation.',
  },
  4: {
    score: 4,
    label: '4 / 5 · Proficient Specialist',
    shortLabel: 'Proficient',
    description: 'Proactively isolates faults and delivers high-rigor handover artifacts.',
  },
  5: {
    score: 5,
    label: '5 / 5 · Exemplary Mastery',
    shortLabel: 'Exemplary',
    description: 'Autonomous architectural execution and audit-ready cross-age pod leadership.',
  },
};

export const DOMAIN_COMPETENCY_RUBRIC_ITEMS: Record<StudioDomain, string[]> = {
  'Green Energy': [
    'Thermal Loss & Defrost Hysteresis Accuracy',
    '48V LiFePO4 Cell-Balancing & Fault Isolation',
    'Low-Draw Compressor Retrofit Specification',
    'Safety Interlock & Lockout-Tagout Compliance',
    'Site Technician Handover Rigor',
  ],
  Tech: [
    '2G-Resilient Offline Queue Compaction',
    'Deterministic Idempotency & Conflict Resolution',
    'Accessible Keyboard & Screen-Reader Semantics',
    'API Schema Validation & Edge-Case Testing',
    'Technical Handover & Runbook Clarity',
  ],
  'Healthcare Ops': [
    'WHO Cold-Chain Excursion Quarantine Triage',
    'Bilingual Maternal Intake Escalation Rubrics',
    'Zero-Waste Stock Rotation & Stability Verification',
    'Clinical Shift-Handover Documentation',
    'Frontline Hygiene & Backup Power Readiness',
  ],
  'SME Finance': [
    '13-Week Rolling Cash-Flow & Liquidity Modeling',
    'Multi-Supplier Staging & Receivables Aging',
    'Mobile-Money Settlement & Double-Entry Audit',
    'Cooperative Unit-Margin & BOM Costing',
    'Escrow Milestone Invoice Compliance',
  ],
};

export const COMPETENCY_BADGE_LEVEL_META: Record<
  MenteeBadgeCompetencyLevel,
  {
    label: string;
    shortLabel: string;
    description: string;
  }
> = {
  'field-ready': {
    label: 'Field-Ready Practitioner',
    shortLabel: 'Field-Ready',
    description: 'Verified practical execution across sprint deliverables under real field constraints.',
  },
  'specialist-verified': {
    label: 'Specialist-Verified Mastery',
    shortLabel: 'Specialist-Verified',
    description: 'Co-signed by a Senior Pod Specialist for technical accuracy and QA rigor.',
  },
  'pod-lead-endorsed': {
    label: 'Pod Lead Endorsed Authority',
    shortLabel: 'Pod Lead Endorsed',
    description: 'Highest mentor distinction recognizing autonomous architectural & handover leadership.',
  },
};

export const DOMAIN_SKILL_BADGE_CATALOG: Record<StudioDomain, DomainSkillBadgePreset[]> = {
  'Green Energy': [
    {
      badgeTitle: '48V Cold-Chain Thermal & Compressor Retrofit Specialist',
      skillCategory: 'Cold-Chain & Microgrid Systems',
      defaultLevel: 'specialist-verified',
      defaultRating: 5,
      defaultCompetencies: [
        'Thermal Loss & Defrost Hysteresis Accuracy',
        'Low-Draw Compressor Retrofit Specification',
        'Site Technician Handover Rigor',
      ],
      defaultCitation:
        'Verified thermal loss calculation accuracy, low-draw defrost hysteresis curve, and site technician handover readiness across all 3 pod milestones.',
    },
    {
      badgeTitle: 'LiFePO4 Cell-Balancing & Inverter Fault Isolation',
      skillCategory: 'Solar Microgrid Diagnostics',
      defaultLevel: 'pod-lead-endorsed',
      defaultRating: 5,
      defaultCompetencies: [
        '48V LiFePO4 Cell-Balancing & Fault Isolation',
        'Safety Interlock & Lockout-Tagout Compliance',
        'Site Technician Handover Rigor',
      ],
      defaultCitation:
        'Isolated night-time voltage sag telemetry, calibrated busbar torque schedules, and delivered an audit-ready clinic power remediation plan.',
    },
    {
      badgeTitle: 'Off-Grid Load Shedding & Safety Interlock Verification',
      skillCategory: 'Field Electrical QA',
      defaultLevel: 'field-ready',
      defaultRating: 4,
      defaultCompetencies: [
        'Safety Interlock & Lockout-Tagout Compliance',
        'Site Technician Handover Rigor',
      ],
      defaultCitation:
        'Completed critical-bus load prioritization and fuse sizing checklist verified against field safety standards.',
    },
  ],
  Tech: [
    {
      badgeTitle: '2G-Resilient Offline Sync & Queue Compaction Architect',
      skillCategory: 'Distributed Offline Systems',
      defaultLevel: 'pod-lead-endorsed',
      defaultRating: 5,
      defaultCompetencies: [
        '2G-Resilient Offline Queue Compaction',
        'Deterministic Idempotency & Conflict Resolution',
        'Technical Handover & Runbook Clarity',
      ],
      defaultCitation:
        'Designed deterministic idempotency keys, local queue compaction, and conflict-free cloud reconciliation under intermittent connectivity.',
    },
    {
      badgeTitle: 'Accessible Keyboard & Screen-Reader Workflow Engineer',
      skillCategory: 'Inclusive Frontend Architecture',
      defaultLevel: 'specialist-verified',
      defaultRating: 5,
      defaultCompetencies: [
        'Accessible Keyboard & Screen-Reader Semantics',
        'Technical Handover & Runbook Clarity',
      ],
      defaultCitation:
        'Delivered semantic ARIA instrumentation, zero-trap focus flows, and low-bandwidth asset optimization.',
    },
    {
      badgeTitle: 'API Contract & Automated Regression Verification',
      skillCategory: 'Software Quality Assurance',
      defaultLevel: 'field-ready',
      defaultRating: 4,
      defaultCompetencies: [
        'API Schema Validation & Edge-Case Testing',
        'Deterministic Idempotency & Conflict Resolution',
      ],
      defaultCitation:
        'Verified edge-case payload validation and deterministic test coverage across sprint deliverables.',
    },
  ],
  'Healthcare Ops': [
    {
      badgeTitle: 'WHO Cold-Chain Excursion & Stock Integrity Specialist',
      skillCategory: 'Clinical Supply Chain QA',
      defaultLevel: 'specialist-verified',
      defaultRating: 5,
      defaultCompetencies: [
        'WHO Cold-Chain Excursion Quarantine Triage',
        'Zero-Waste Stock Rotation & Stability Verification',
        'Clinical Shift-Handover Documentation',
      ],
      defaultCitation:
        'Executed quarantine triage, manufacturer stability cross-checks, and zero-waste vaccine stock rotation protocols.',
    },
    {
      badgeTitle: 'Multilingual Maternal Triage & Shift-Handover Lead',
      skillCategory: 'Clinical Operations & Safety',
      defaultLevel: 'pod-lead-endorsed',
      defaultRating: 5,
      defaultCompetencies: [
        'Bilingual Maternal Intake Escalation Rubrics',
        'Clinical Shift-Handover Documentation',
      ],
      defaultCitation:
        'Structured bilingual intake escalation rubrics and shift-handover checklists adopted by regional clinic leads.',
    },
    {
      badgeTitle: 'Community Clinic Hygiene & Equipment Readiness Auditor',
      skillCategory: 'Field Healthcare Compliance',
      defaultLevel: 'field-ready',
      defaultRating: 4,
      defaultCompetencies: [
        'Frontline Hygiene & Backup Power Readiness',
        'Clinical Shift-Handover Documentation',
      ],
      defaultCitation:
        'Verified sterilization logs and emergency power backup readiness for frontline clinical stations.',
    },
  ],
  'SME Finance': [
    {
      badgeTitle: '13-Week Rolling Cash-Flow & Liquidity Buffer Strategist',
      skillCategory: 'Working Capital Management',
      defaultLevel: 'pod-lead-endorsed',
      defaultRating: 5,
      defaultCompetencies: [
        '13-Week Rolling Cash-Flow & Liquidity Modeling',
        'Multi-Supplier Staging & Receivables Aging',
        'Escrow Milestone Invoice Compliance',
      ],
      defaultCitation:
        'Reconciled multi-supplier payment staging and receivables aging to eliminate Friday payroll and raw-material liquidity gaps.',
    },
    {
      badgeTitle: 'Cooperative Unit-Margin & Mobile-Money Ledger Auditor',
      skillCategory: 'SME Financial Controls',
      defaultLevel: 'specialist-verified',
      defaultRating: 5,
      defaultCompetencies: [
        'Mobile-Money Settlement & Double-Entry Audit',
        'Cooperative Unit-Margin & BOM Costing',
      ],
      defaultCitation:
        'Audited mobile-money settlement logs and bill-of-materials costings with full double-entry traceability.',
    },
    {
      badgeTitle: 'Cross-Border Supplier Invoice & Escrow Compliance',
      skillCategory: 'Trade & Settlement Operations',
      defaultLevel: 'field-ready',
      defaultRating: 4,
      defaultCompetencies: [
        'Escrow Milestone Invoice Compliance',
        'Multi-Supplier Staging & Receivables Aging',
      ],
      defaultCitation:
        'Prepared compliant milestone invoice schedules and supplier reconciliation summaries.',
    },
  ],
};

export function normalizeBadgeStudioDomain(rawDomain?: string): StudioDomain {
  const lower = (rawDomain ?? '').trim().toLowerCase();
  if (lower === 'tech' || lower.includes('software') || lower.includes('code') || lower.includes('digital')) {
    return 'Tech';
  }
  if (lower === 'healthcare ops' || lower.includes('health') || lower.includes('clinic') || lower.includes('medical')) {
    return 'Healthcare Ops';
  }
  if (lower === 'sme finance' || lower.includes('finance') || lower.includes('ledger') || lower.includes('business')) {
    return 'SME Finance';
  }
  return 'Green Energy';
}

export interface EligibleEndorsementSprint {
  sprintId: string;
  sprintTitle: string;
  domain: StudioDomain;
  rawDomain: string;
  hoursLogged: number;
  completedAtIso: string;
}

export function buildEligibleSprintsForEndorsement(
  contributions: BriefSubmission[]
): EligibleEndorsementSprint[] {
  const seen = new Set<string>();
  const eligible: EligibleEndorsementSprint[] = [];

  for (const contrib of contributions) {
    if (contrib.status !== 'completed') continue;
    const sprintId = contrib.briefId || contrib.id;
    if (!sprintId || seen.has(sprintId)) continue;
    seen.add(sprintId);
    eligible.push({
      sprintId,
      sprintTitle: contrib.briefTitle || 'Completed Pod Sprint',
      domain: normalizeBadgeStudioDomain(contrib.domain),
      rawDomain: contrib.domain || 'Green Energy',
      hoursLogged: Number(contrib.hoursLogged) || 0,
      completedAtIso: (contrib.updatedAtIso || contrib.createdAtIso || new Date().toISOString()).slice(0, 10),
    });
  }

  return eligible;
}

export function generateBadgeVerificationCode(
  sprintId: string,
  domain: StudioDomain
): string {
  const domainCode =
    domain === 'Tech'
      ? 'TC'
      : domain === 'Healthcare Ops'
        ? 'HC'
        : domain === 'SME Finance'
          ? 'SF'
          : 'GE';
  const cleanSprint = sprintId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(-4) || 'POD1';
  const suffix = Math.floor(1000 + Math.random() * 8999);
  return `KORA-BADGE-${domainCode}-${cleanSprint}-${suffix}`;
}

export interface MenteeBadgeDraftInput {
  sprintId: string;
  sprintTitle: string;
  domain?: string;
  mentorId?: string;
  mentorName?: string;
  mentorRole?: string;
  badgeTitle: string;
  skillCategory: string;
  competencyLevel: MenteeBadgeCompetencyLevel;
  performanceRating?: number;
  evaluatedCompetencies?: string[];
  citationNote: string;
  verificationCode?: string;
  awardedAtIso?: string;
}

export function validateAndFormatMenteeBadge(input: MenteeBadgeDraftInput): {
  valid: boolean;
  error?: string;
  formatted?: Omit<MenteeCompetencyBadge, 'id' | 'ownerUid' | 'createdAtIso' | 'updatedAtIso'>;
} {
  const safeSprintId = sanitizeText(input.sprintId, 128);
  if (!safeSprintId || !isValidFirebaseId(safeSprintId)) {
    return { valid: false, error: 'Select a valid completed Pod Sprint before issuing an endorsement.' };
  }

  const safeSprintTitle = sanitizeText(input.sprintTitle, 160);
  if (safeSprintTitle.length < 2) {
    return { valid: false, error: 'Sprint title is required.' };
  }

  const domain = normalizeBadgeStudioDomain(input.domain);
  const defaultMentor = getAssignedMentorForSprint(safeSprintId, domain);

  const safeMentorId =
    input.mentorId && isValidFirebaseId(input.mentorId) ? input.mentorId : defaultMentor.id;
  const safeMentorName = sanitizeText(input.mentorName || defaultMentor.name, 80) || defaultMentor.name;
  const safeMentorRole =
    sanitizeText(input.mentorRole || defaultMentor.roleTitle, 120) || defaultMentor.roleTitle;

  const safeBadgeTitle = sanitizeText(input.badgeTitle, 120);
  if (safeBadgeTitle.length < 3) {
    return {
      valid: false,
      error: 'Endorsement or badge title must be at least 3 characters.',
    };
  }

  const safeSkillCategory = sanitizeText(input.skillCategory, 80);
  if (safeSkillCategory.length < 2) {
    return {
      valid: false,
      error: 'Competency cluster must be at least 2 characters.',
    };
  }

  const allowedLevels: MenteeBadgeCompetencyLevel[] = [
    'field-ready',
    'specialist-verified',
    'pod-lead-endorsed',
  ];
  const safeLevel: MenteeBadgeCompetencyLevel = allowedLevels.includes(input.competencyLevel)
    ? input.competencyLevel
    : 'specialist-verified';

  const rawRating = input.performanceRating ?? 5;
  const numericRating = Math.round(Number(rawRating));
  if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
    return {
      valid: false,
      error: 'Mentor performance rating must be between 1 and 5 on the 5-point scale.',
    };
  }
  const safeRating = numericRating as MentorRatingScore;

  const defaultDomainCompetencies = DOMAIN_COMPETENCY_RUBRIC_ITEMS[domain] ?? [];
  const rawCompetencies = Array.isArray(input.evaluatedCompetencies)
    ? input.evaluatedCompetencies
    : defaultDomainCompetencies.slice(0, 2);
  const safeEvaluatedCompetencies = Array.from(
    new Set(
      rawCompetencies
        .map((c) => sanitizeText(String(c), 80))
        .filter((c) => c.length >= 2)
    )
  ).slice(0, 8);

  const safeCitation = sanitizeText(input.citationNote, 600);
  if (safeCitation.length < 10) {
    return {
      valid: false,
      error: 'Qualitative competency feedback must be at least 10 characters to verify performance proof.',
    };
  }

  const rawCode = input.verificationCode
    ? sanitizeText(input.verificationCode, 64)
    : generateBadgeVerificationCode(safeSprintId, domain);
  const safeVerificationCode = isValidFirebaseId(rawCode)
    ? rawCode
    : generateBadgeVerificationCode(safeSprintId, domain);

  const rawDate = sanitizeText(input.awardedAtIso || new Date().toISOString().slice(0, 10), 40);
  const safeAwardedAtIso = rawDate.length >= 10 ? rawDate : new Date().toISOString().slice(0, 10);

  return {
    valid: true,
    formatted: {
      sprintId: safeSprintId,
      sprintTitle: safeSprintTitle,
      domain,
      mentorId: safeMentorId,
      mentorName: safeMentorName,
      mentorRole: safeMentorRole,
      badgeTitle: safeBadgeTitle,
      skillCategory: safeSkillCategory,
      competencyLevel: safeLevel,
      performanceRating: safeRating,
      evaluatedCompetencies:
        safeEvaluatedCompetencies.length > 0
          ? safeEvaluatedCompetencies
          : [safeSkillCategory],
      citationNote: safeCitation,
      verificationCode: safeVerificationCode,
      awardedAtIso: safeAwardedAtIso,
    },
  };
}

export interface EarnedBadgeSummary {
  totalEarned: number;
  podLeadEndorsedCount: number;
  specialistVerifiedCount: number;
  fieldReadyCount: number;
  uniqueDomainsCount: number;
  averagePerformanceRating: number;
  fiveStarCount: number;
  latestAwardedBadge: MenteeCompetencyBadge | null;
}

export function computeEarnedBadgeSummary(
  badges: MenteeCompetencyBadge[]
): EarnedBadgeSummary {
  if (!Array.isArray(badges) || badges.length === 0) {
    return {
      totalEarned: 0,
      podLeadEndorsedCount: 0,
      specialistVerifiedCount: 0,
      fieldReadyCount: 0,
      uniqueDomainsCount: 0,
      averagePerformanceRating: 0,
      fiveStarCount: 0,
      latestAwardedBadge: null,
    };
  }

  const sorted = [...badges].sort((a, b) =>
    (b.awardedAtIso || b.createdAtIso).localeCompare(a.awardedAtIso || a.createdAtIso)
  );

  const podLeadEndorsedCount = badges.filter(
    (b) => b.competencyLevel === 'pod-lead-endorsed'
  ).length;
  const specialistVerifiedCount = badges.filter(
    (b) => b.competencyLevel === 'specialist-verified'
  ).length;
  const fieldReadyCount = badges.filter((b) => b.competencyLevel === 'field-ready').length;
  const uniqueDomainsCount = new Set(badges.map((b) => b.domain)).size;

  const ratingSum = badges.reduce((acc, b) => {
    const r = Math.max(1, Math.min(5, Math.round(Number(b.performanceRating) || 5)));
    return acc + r;
  }, 0);
  const averagePerformanceRating = Number((ratingSum / badges.length).toFixed(1));
  const fiveStarCount = badges.filter(
    (b) => Math.round(Number(b.performanceRating) || 5) === 5
  ).length;

  return {
    totalEarned: badges.length,
    podLeadEndorsedCount,
    specialistVerifiedCount,
    fieldReadyCount,
    uniqueDomainsCount,
    averagePerformanceRating,
    fiveStarCount,
    latestAwardedBadge: sorted[0] ?? null,
  };
}

export interface MenteeCompetencyEndorsementProps {
  badges: MenteeCompetencyBadge[];
  contributions: BriefSubmission[];
  activeDomain?: StudioDomain;
  menteeName?: string;
  onAwardBadge?: (
    draft: Omit<MenteeCompetencyBadge, 'id' | 'ownerUid' | 'createdAtIso' | 'updatedAtIso'>
  ) => void;
  onDeleteBadge?: (badgeId: string) => void;
}

export const MenteeCompetencyEndorsement: React.FC<MenteeCompetencyEndorsementProps> = ({
  badges,
  contributions,
  activeDomain = 'Green Energy',
  menteeName = 'Practitioner',
  onAwardBadge,
  onDeleteBadge,
}) => {
  const eligibleSprints = useMemo(
    () => buildEligibleSprintsForEndorsement(contributions),
    [contributions]
  );

  const inProgressSprintsCount = useMemo(
    () => contributions.filter((c) => c.status === 'in-progress').length,
    [contributions]
  );

  const summary = useMemo(() => computeEarnedBadgeSummary(badges), [badges]);

  const initialSprint = eligibleSprints[0] ?? {
    sprintId: 'brief-coldchain-03',
    sprintTitle: 'Solar-Direct Cold-Chain Compressor Retrofit Plan',
    domain: activeDomain,
    rawDomain: activeDomain,
    hoursLogged: 5,
    completedAtIso: new Date().toISOString().slice(0, 10),
  };

  const [isAwardFormOpen, setIsAwardFormOpen] = useState(false);
  const [selectedSprintId, setSelectedSprintId] = useState<string>(initialSprint.sprintId);

  const selectedSprint = useMemo(() => {
    return (
      eligibleSprints.find((s) => s.sprintId === selectedSprintId) ??
      eligibleSprints[0] ??
      initialSprint
    );
  }, [eligibleSprints, selectedSprintId, initialSprint]);

  const domainPresets = useMemo(
    () => DOMAIN_SKILL_BADGE_CATALOG[selectedSprint.domain] ?? DOMAIN_SKILL_BADGE_CATALOG['Green Energy'],
    [selectedSprint.domain]
  );

  const domainCompetencyOptions = useMemo(
    () => DOMAIN_COMPETENCY_RUBRIC_ITEMS[selectedSprint.domain] ?? DOMAIN_COMPETENCY_RUBRIC_ITEMS['Green Energy'],
    [selectedSprint.domain]
  );

  const assignedMentor = useMemo(
    () => getAssignedMentorForSprint(selectedSprint.sprintId, selectedSprint.domain),
    [selectedSprint.sprintId, selectedSprint.domain]
  );

  const [selectedPresetIdx, setSelectedPresetIdx] = useState<number>(0);
  const [badgeTitle, setBadgeTitle] = useState<string>(
    domainPresets[0]?.badgeTitle ?? 'Verified Pod Sprint Competency'
  );
  const [skillCategory, setSkillCategory] = useState<string>(
    domainPresets[0]?.skillCategory ?? 'Applied Field Competency'
  );
  const [competencyLevel, setCompetencyLevel] = useState<MenteeBadgeCompetencyLevel>(
    domainPresets[0]?.defaultLevel ?? 'specialist-verified'
  );
  const [performanceRating, setPerformanceRating] = useState<MentorRatingScore>(
    domainPresets[0]?.defaultRating ?? 5
  );
  const [selectedCompetencies, setSelectedCompetencies] = useState<string[]>(
    domainPresets[0]?.defaultCompetencies ?? domainCompetencyOptions.slice(0, 3)
  );
  const [customCompetencyInput, setCustomCompetencyInput] = useState<string>('');
  const [citationNote, setCitationNote] = useState<string>(
    domainPresets[0]?.defaultCitation ?? ''
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [justAwardedTitle, setJustAwardedTitle] = useState<string | null>(null);

  const handleSelectSprint = (nextSprintId: string) => {
    setSelectedSprintId(nextSprintId);
    const nextSprint =
      eligibleSprints.find((s) => s.sprintId === nextSprintId) ?? initialSprint;
    const nextPresets =
      DOMAIN_SKILL_BADGE_CATALOG[nextSprint.domain] ?? DOMAIN_SKILL_BADGE_CATALOG['Green Energy'];
    const nextCompetencyCatalog =
      DOMAIN_COMPETENCY_RUBRIC_ITEMS[nextSprint.domain] ?? DOMAIN_COMPETENCY_RUBRIC_ITEMS['Green Energy'];
    setSelectedPresetIdx(0);
    if (nextPresets[0]) {
      setBadgeTitle(nextPresets[0].badgeTitle);
      setSkillCategory(nextPresets[0].skillCategory);
      setCompetencyLevel(nextPresets[0].defaultLevel);
      setPerformanceRating(nextPresets[0].defaultRating);
      setSelectedCompetencies(
        nextPresets[0].defaultCompetencies ?? nextCompetencyCatalog.slice(0, 3)
      );
      setCitationNote(nextPresets[0].defaultCitation);
    }
    setValidationError(null);
  };

  const handleSelectPreset = (idx: number) => {
    setSelectedPresetIdx(idx);
    const preset = domainPresets[idx];
    if (preset) {
      setBadgeTitle(preset.badgeTitle);
      setSkillCategory(preset.skillCategory);
      setCompetencyLevel(preset.defaultLevel);
      setPerformanceRating(preset.defaultRating);
      setSelectedCompetencies(preset.defaultCompetencies);
      setCitationNote(preset.defaultCitation);
      setValidationError(null);
    }
  };

  const handleToggleCompetency = (comp: string) => {
    setSelectedCompetencies((prev) => {
      if (prev.includes(comp)) {
        return prev.filter((item) => item !== comp);
      }
      if (prev.length >= 8) return prev;
      return [...prev, comp];
    });
    setValidationError(null);
  };

  const handleAddCustomCompetency = () => {
    const clean = sanitizeText(customCompetencyInput, 80);
    if (clean.length < 2) return;
    if (!selectedCompetencies.includes(clean) && selectedCompetencies.length < 8) {
      setSelectedCompetencies((prev) => [...prev, clean]);
    }
    setCustomCompetencyInput('');
  };

  const handleSubmitBadge = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateAndFormatMenteeBadge({
      sprintId: selectedSprint.sprintId,
      sprintTitle: selectedSprint.sprintTitle,
      domain: selectedSprint.domain,
      mentorId: assignedMentor.id,
      mentorName: assignedMentor.name,
      mentorRole: assignedMentor.roleTitle,
      badgeTitle,
      skillCategory,
      competencyLevel,
      performanceRating,
      evaluatedCompetencies: selectedCompetencies,
      citationNote,
      awardedAtIso: new Date().toISOString().slice(0, 10),
    });

    if (!result.valid || !result.formatted) {
      setValidationError(result.error ?? 'Please complete all required performance endorsement fields.');
      return;
    }

    onAwardBadge?.(result.formatted);
    setValidationError(null);
    setJustAwardedTitle(result.formatted.badgeTitle);
    setIsAwardFormOpen(false);
    setTimeout(() => {
      setJustAwardedTitle(null);
    }, 4500);
  };

  return (
    <div
      data-testid="mentee-competency-endorsement"
      className="mt-4 rounded-xl border border-emerald-700/25 dark:border-emerald-500/25 bg-emerald-950/[0.03] dark:bg-emerald-950/20 p-4"
    >
      {/* Header & Summary Strip */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              Mentee Performance Endorsements &amp; Earned Skill Badges
            </h5>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
            5-point mentor performance ratings, evaluated competency rubrics, and digital skill badges upon Pod Sprint completion for{' '}
            <span className="font-semibold text-stone-900 dark:text-stone-100">{menteeName}</span>.
          </p>
          <p
            data-testid="competency-badge-summary-meta"
            className="text-[11px] font-mono tabular-nums text-stone-500 dark:text-stone-400 mt-1.5"
          >
            {summary.totalEarned} earned {summary.totalEarned === 1 ? 'endorsement' : 'endorsements'} ·{' '}
            {summary.averagePerformanceRating > 0
              ? `${summary.averagePerformanceRating.toFixed(1)} / 5.0 ★ avg performance · `
              : ''}
            {summary.specialistVerifiedCount + summary.podLeadEndorsedCount} senior-endorsed ·{' '}
            {eligibleSprints.length} completed pod {eligibleSprints.length === 1 ? 'sprint' : 'sprints'}
            {inProgressSprintsCount > 0 ? ` · ${inProgressSprintsCount} in-progress` : ''}
          </p>
        </div>

        {onAwardBadge && (
          <button
            type="button"
            data-testid="toggle-award-competency-badge-btn"
            onClick={() => {
              setIsAwardFormOpen((prev) => !prev);
              setValidationError(null);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>
              {isAwardFormOpen
                ? 'Close Endorsement Studio'
                : 'Rate Mentee & Issue Endorsement'}
            </span>
            {isAwardFormOpen ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>

      {/* Confirmation Banner */}
      {justAwardedTitle && (
        <div
          data-testid="badge-awarded-toast"
          className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-600/30 bg-emerald-700/10 px-3 py-2 text-xs text-emerald-900 dark:text-emerald-200"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
          <span>
            Mentee Performance Endorsement <strong>{justAwardedTitle}</strong> ({performanceRating}/5 ★) recorded and embedded into Living Competency Passport.
          </span>
        </div>
      )}

      {/* Interactive Mentee Performance Endorsement & Skill Badge Form */}
      {isAwardFormOpen && onAwardBadge && (
        <form
          data-testid="award-competency-badge-form"
          onSubmit={handleSubmitBadge}
          className="mt-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/80 dark:border-stone-800 pb-2.5">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold">
                Pod Mentor Performance Endorsement Desk
              </span>
              <h6 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Rate Mentee Performance (5-Point Scale) &amp; Endorse Specific Competencies
              </h6>
            </div>
            <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
              Endorsing Mentor: {assignedMentor.name} · {assignedMentor.roleTitle}
            </span>
          </div>

          {/* Step 1: Select Completed Pod Sprint */}
          <div>
            <label
              htmlFor="mentee-badge-sprint-select"
              className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1"
            >
              1. Completed Pod Sprint
            </label>
            <select
              id="mentee-badge-sprint-select"
              data-testid="mentee-badge-sprint-select"
              value={selectedSprint.sprintId}
              onChange={(e) => handleSelectSprint(e.target.value)}
              className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-emerald-600"
            >
              {eligibleSprints.length > 0 ? (
                eligibleSprints.map((s) => (
                  <option key={s.sprintId} value={s.sprintId}>
                    {s.sprintTitle} ({s.domain} · {s.hoursLogged}h verified · Completed {s.completedAtIso})
                  </option>
                ))
              ) : (
                <option value={initialSprint.sprintId}>
                  {initialSprint.sprintTitle} ({initialSprint.domain} · Completed Pod Sprint)
                </option>
              )}
            </select>
          </div>

          {/* Step 2: 5-Point Mentee Performance Rating Scale */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                2. Mentee Performance Rating (5-Point Scale)
              </span>
              <span
                data-testid="selected-performance-rating-label"
                className="text-xs font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400"
              >
                {PERFORMANCE_RATING_SCALE_META[performanceRating].label}
              </span>
            </div>
            <div
              role="radiogroup"
              aria-label="Mentee performance rating on a 5-point scale"
              className="grid grid-cols-5 gap-2"
            >
              {([1, 2, 3, 4, 5] as MentorRatingScore[]).map((score) => {
                const meta = PERFORMANCE_RATING_SCALE_META[score];
                const isSelected = performanceRating === score;
                return (
                  <button
                    key={score}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    data-testid={`mentee-performance-rating-btn-${score}`}
                    onClick={() => setPerformanceRating(score)}
                    className={`rounded-lg border p-2 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-700/10 text-stone-900 dark:text-stone-100'
                        : 'border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/50 hover:border-stone-300 dark:hover:border-stone-700 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-mono tabular-nums font-bold">
                        {score} / 5
                      </span>
                      <Star
                        className={`w-3.5 h-3.5 ${
                          score <= performanceRating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-stone-300 dark:text-stone-700'
                        }`}
                      />
                    </div>
                    <div className="text-[11px] font-medium mt-0.5 truncate">
                      {meta.shortLabel}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
              {PERFORMANCE_RATING_SCALE_META[performanceRating].description}
            </p>
          </div>

          {/* Step 3: Specific Competencies Evaluated */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                3. Specific Competencies Evaluated ({selectedCompetencies.length} selected)
              </span>
              <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
                Click competencies demonstrated during the sprint
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Array.from(new Set([...domainCompetencyOptions, ...selectedCompetencies])).map(
                (comp, idx) => {
                  const active = selectedCompetencies.includes(comp);
                  return (
                    <button
                      key={comp}
                      type="button"
                      data-testid={`mentee-competency-toggle-${idx}`}
                      aria-pressed={active}
                      onClick={() => handleToggleCompetency(comp)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                        active
                          ? 'border-emerald-600 bg-emerald-700/10 text-emerald-900 dark:text-emerald-200 font-semibold'
                          : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-stone-600 dark:text-stone-400 hover:border-stone-300'
                      }`}
                    >
                      {active && <Check className="w-3 h-3 text-emerald-700 dark:text-emerald-400 shrink-0" />}
                      <span>{comp}</span>
                    </button>
                  );
                }
              )}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                maxLength={80}
                value={customCompetencyInput}
                onChange={(e) => setCustomCompetencyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomCompetency();
                  }
                }}
                placeholder="Add another specific competency evaluated (optional)..."
                data-testid="custom-evaluated-competency-input"
                className="flex-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-1.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-emerald-600"
              />
              <button
                type="button"
                onClick={handleAddCustomCompetency}
                data-testid="add-custom-competency-btn"
                className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 text-xs font-semibold text-stone-800 dark:text-stone-200 hover:border-emerald-600 cursor-pointer"
              >
                + Add Competency
              </button>
            </div>
          </div>

          {/* Step 4: Domain Digital Skill Badge Presets */}
          <div>
            <span className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1.5">
              4. Select Domain Skill Badge &amp; Endorsement Template ({selectedSprint.domain})
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {domainPresets.map((preset, idx) => {
                const isSelected = selectedPresetIdx === idx && badgeTitle === preset.badgeTitle;
                return (
                  <button
                    key={preset.badgeTitle}
                    type="button"
                    data-testid={`badge-preset-option-${idx}`}
                    onClick={() => handleSelectPreset(idx)}
                    className={`text-left rounded-lg border p-2.5 transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-700/10 text-stone-900 dark:text-stone-100'
                        : 'border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/50 hover:border-stone-300 dark:hover:border-stone-700 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <div className="text-xs font-semibold leading-snug line-clamp-2">
                      {preset.badgeTitle}
                    </div>
                    <div className="text-[11px] font-mono tabular-nums text-stone-500 dark:text-stone-400 mt-1">
                      {preset.defaultRating}/5 ★ · {preset.skillCategory} ·{' '}
                      {COMPETENCY_BADGE_LEVEL_META[preset.defaultLevel].shortLabel}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 5: Badge Title, Skill Category & Competency Level */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="mentee-badge-title-input"
                className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1"
              >
                Endorsement / Digital Badge Title
              </label>
              <input
                id="mentee-badge-title-input"
                data-testid="mentee-badge-title-input"
                type="text"
                maxLength={120}
                value={badgeTitle}
                onChange={(e) => setBadgeTitle(e.target.value)}
                placeholder="e.g., 48V Cold-Chain Compressor Retrofit Specialist"
                className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-1.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label
                htmlFor="mentee-badge-category-input"
                className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1"
              >
                Competency Cluster
              </label>
              <input
                id="mentee-badge-category-input"
                data-testid="mentee-badge-category-input"
                type="text"
                maxLength={80}
                value={skillCategory}
                onChange={(e) => setSkillCategory(e.target.value)}
                placeholder="e.g., Cold-Chain & Microgrid Systems"
                className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-1.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label
                htmlFor="mentee-badge-level-select"
                className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1"
              >
                Endorsement Tier
              </label>
              <select
                id="mentee-badge-level-select"
                data-testid="mentee-badge-level-select"
                value={competencyLevel}
                onChange={(e) =>
                  setCompetencyLevel(e.target.value as MenteeBadgeCompetencyLevel)
                }
                className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-1.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-emerald-600"
              >
                {(Object.keys(COMPETENCY_BADGE_LEVEL_META) as MenteeBadgeCompetencyLevel[]).map(
                  (lvl) => (
                    <option key={lvl} value={lvl}>
                      {COMPETENCY_BADGE_LEVEL_META[lvl].label}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          {/* Step 6: Qualitative Feedback on Specific Competencies */}
          <div>
            <label
              htmlFor="mentee-badge-citation-input"
              className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1"
            >
              5. Qualitative Feedback on Specific Competencies (Displayed on Competency Passport)
            </label>
            <textarea
              id="mentee-badge-citation-input"
              data-testid="mentee-badge-citation-input"
              rows={2}
              maxLength={600}
              value={citationNote}
              onChange={(e) => setCitationNote(e.target.value)}
              placeholder="Provide qualitative feedback on the specific competencies and technical rigor demonstrated during the Pod Sprint..."
              className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-emerald-600"
            />
          </div>

          {validationError && (
            <p
              data-testid="mentee-badge-error"
              className="text-xs font-medium text-red-600 dark:text-red-400"
            >
              {validationError}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAwardFormOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="submit-mentee-badge-btn"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Record {performanceRating}/5 Performance Endorsement to Passport</span>
            </button>
          </div>
        </form>
      )}

      {/* Earned Performance Endorsements & Digital Skill Badges Grid */}
      <div
        data-testid="earned-competency-badges-grid"
        className="mt-3.5 grid grid-cols-1 md:grid-cols-2 gap-3"
      >
        {badges.map((badge) => {
          const levelMeta =
            COMPETENCY_BADGE_LEVEL_META[badge.competencyLevel] ??
            COMPETENCY_BADGE_LEVEL_META['specialist-verified'];
          const isPodLeadTier = badge.competencyLevel === 'pod-lead-endorsed';
          const ratingValue = Math.max(
            1,
            Math.min(5, Math.round(Number(badge.performanceRating) || 5))
          ) as MentorRatingScore;
          const ratingMeta = PERFORMANCE_RATING_SCALE_META[ratingValue];
          const evaluatedList =
            Array.isArray(badge.evaluatedCompetencies) &&
            badge.evaluatedCompetencies.length > 0
              ? badge.evaluatedCompetencies
              : [badge.skillCategory];

          return (
            <div
              key={badge.id}
              data-testid={`earned-competency-badge-${badge.id}`}
              className={`relative rounded-xl border p-3.5 transition-all ${
                isPodLeadTier
                  ? 'border-amber-600/35 dark:border-amber-500/35 bg-white dark:bg-stone-900/90'
                  : 'border-emerald-700/25 dark:border-emerald-500/25 bg-white dark:bg-stone-900/90'
              }`}
            >
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                      isPodLeadTier
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                        : 'bg-emerald-700/10 border-emerald-700/25 text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-mono tabular-nums text-stone-500 dark:text-stone-400">
                      {badge.domain} · {badge.skillCategory} ·{' '}
                      <span
                        className={
                          isPodLeadTier
                            ? 'font-semibold text-amber-700 dark:text-amber-300'
                            : 'font-semibold text-emerald-700 dark:text-emerald-400'
                        }
                      >
                        {levelMeta.shortLabel}
                      </span>
                    </div>
                    <h6 className="text-xs font-bold text-stone-900 dark:text-stone-100 mt-0.5 leading-snug">
                      {badge.badgeTitle}
                    </h6>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    data-testid={`badge-performance-rating-${badge.id}`}
                    className="inline-flex items-center gap-1 text-xs font-mono tabular-nums font-bold text-amber-700 dark:text-amber-400"
                    title={ratingMeta.label}
                  >
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                    <span>{ratingValue}.0 / 5</span>
                  </span>

                  {onDeleteBadge && !badge.id.startsWith('mbadge-seed-') && (
                    <button
                      type="button"
                      data-testid={`delete-competency-badge-${badge.id}`}
                      onClick={() => onDeleteBadge(badge.id)}
                      title="Remove performance endorsement"
                      className="text-stone-400 hover:text-red-600 dark:hover:text-red-400 p-1 rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Specific Evaluated Competencies Readout (Zero-Pill Inline Metadata) */}
              <div
                data-testid={`badge-evaluated-competencies-${badge.id}`}
                className="mt-2 text-[11px] font-mono text-emerald-800 dark:text-emerald-300 leading-relaxed"
              >
                <span className="font-semibold text-stone-600 dark:text-stone-400">
                  Evaluated Competencies:{' '}
                </span>
                {evaluatedList.join(' · ')}
              </div>

              {/* Qualitative Feedback Quote */}
              <p className="mt-1.5 text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                “{badge.citationNote}”
              </p>

              <div className="mt-2.5 pt-2 border-t border-stone-200/70 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500 dark:text-stone-400">
                <span className="inline-flex items-center gap-1 font-medium text-stone-700 dark:text-stone-300">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  {badge.mentorName} · {badge.mentorRole}
                </span>
                <span className="font-mono tabular-nums">
                  {ratingMeta.shortLabel} ({ratingValue}/5 ★) · {badge.verificationCode} · {badge.awardedAtIso}
                </span>
              </div>

              <div className="mt-1 text-[11px] font-mono text-stone-500 dark:text-stone-400 truncate">
                Pod Sprint: {badge.sprintTitle}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const MenteePerformanceEndorsement = MenteeCompetencyEndorsement;

export default MenteeCompetencyEndorsement;
