import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Search,
  X,
} from 'lucide-react';
import type { PortalRealm, WorkspaceTab } from '../types/kora';

export type GlossaryFilterTab = 'all' | 'sdgs' | 'legal' | 'frameworks' | 'partners';
export type PartnerConsoleTab = 'sprints' | 'talent' | 'compliance' | 'impact';

type GlossaryAudience = 'Builder' | 'Hiring Partner' | 'Shared';
type GlossaryCategory = 'sdgs' | 'legal' | 'frameworks';

export interface GlossaryItem {
  id: string;
  category: GlossaryCategory;
  term: string;
  targetTag?: string;
  definition: string;
  audience: GlossaryAudience;
  stageLabel?: string;
  builderTab?: WorkspaceTab;
  builderJumpLabel?: string;
  partnerTab?: PartnerConsoleTab;
  partnerJumpLabel?: string;
  partnerRelevant?: boolean;
  keywords: string;
}

type GlossaryEntry = GlossaryItem;

export const GLOSSARY_ENTRIES: GlossaryItem[] = [
  // Category A — UN Sustainable Development Goals (5 Core App SDGs)
  {
    id: 'sdg-4',
    category: 'sdgs',
    term: 'SDG 4 — Quality Education & Upskilling',
    targetTag: 'Key App Focus · Targets 4.4, 4.5, 4.b',
    definition:
      'Recognizing prior learning without paper diplomas, funding targeted micro-bridging, and opening global higher-education scholarships.',
    audience: 'Shared',
    stageLabel: 'Stage 1 · Verify',
    builderTab: 'verify',
    builderJumpLabel: 'Go to Stage 1',
    keywords: 'sdg 4 education upskilling uqp rpl scholarship 4.4 4.5 4.b verify',
  },
  {
    id: 'sdg-8',
    category: 'sdgs',
    term: 'SDG 8 — Decent Work & Economic Growth',
    targetTag: 'Key App Focus · Targets 8.3, 8.5, 8.8, 8.10',
    definition:
      'Connecting verified talent to fair-pay sprints, upgraded apprenticeships, formal or remote contracts, and inclusive financial access.',
    audience: 'Shared',
    stageLabel: 'Stage 3 · Solve',
    builderTab: 'solve',
    builderJumpLabel: 'Go to Stage 3',
    partnerTab: 'compliance',
    partnerJumpLabel: 'Go to Compliance & Contracting',
    partnerRelevant: true,
    keywords: 'sdg 8 decent work economic growth sprints apprenticeships contracts 8.3 8.5 8.8 8.10',
  },
  {
    id: 'sdg-10',
    category: 'sdgs',
    term: 'SDG 10 — Reduced Inequalities',
    targetTag: 'Key App Focus · Targets 10.2, 10.7',
    definition:
      'Closing age and status barriers (15–17 youth through 46+ masters), pairing refugee and host-community talent, and supporting safe, regulated mobility.',
    audience: 'Shared',
    stageLabel: 'Stage 5 · Cleared',
    builderTab: 'cleared',
    builderJumpLabel: 'Go to Stage 5',
    keywords: 'sdg 10 inequalities inclusion cross-age pods refugee host mobility 10.2 10.7',
  },
  {
    id: 'sdg-16',
    category: 'sdgs',
    term: 'SDG 16 — Peace, Justice & Strong Institutions',
    targetTag: 'Key App Focus · Targets 16.6, 16.9, 16.b',
    definition:
      'Providing transparent legal work-authorization routing, privacy-first identity tiers, and auditable consent without bureaucratic bottlenecks.',
    audience: 'Shared',
    stageLabel: 'Stage 2 · Unlock',
    builderTab: 'unlock',
    builderJumpLabel: 'Go to Stage 2',
    partnerTab: 'compliance',
    partnerJumpLabel: 'Go to Compliance & Contracting',
    partnerRelevant: true,
    keywords: 'sdg 16 peace justice legal identity work-auth consent 16.6 16.9 16.b unlock',
  },
  {
    id: 'sdg-17',
    category: 'sdgs',
    term: 'SDG 17 — Partnerships for the Goals',
    targetTag: 'Key App Focus · Target 17.17',
    definition:
      'Tripartite collaboration uniting Employers and SMEs, TVET/RPL accreditors, and stipend or mobility sponsors.',
    audience: 'Hiring Partner',
    stageLabel: 'Stage 4 · Pulse',
    builderTab: 'pulse',
    builderJumpLabel: 'Go to Stage 4',
    partnerTab: 'talent',
    partnerJumpLabel: 'Go to Consented Talent',
    partnerRelevant: true,
    keywords: 'sdg 17 partnerships tripartite employers sme tvet sponsors 17.17 pulse',
  },

  // Category B — Legal, Work-Authorization & Financial Terms (Stage 2 & Partner Compliance)
  {
    id: 'legal-ilo',
    category: 'legal',
    term: 'ILO Guiding Principles',
    definition:
      "International Labour Organization standards affirming refugees' right to safe, fair, non-discriminatory access to labour markets and decent pay.",
    audience: 'Shared',
    stageLabel: 'Stage 2 · Unlock',
    builderTab: 'unlock',
    builderJumpLabel: 'Go to Stage 2',
    partnerTab: 'compliance',
    partnerJumpLabel: 'Go to Compliance & Contracting',
    partnerRelevant: true,
    keywords: 'ilo international labour organization guiding principles rights fair pay legal',
  },
  {
    id: 'legal-work-auth-tiers',
    category: 'legal',
    term: 'Work-Authorization Tiers (Enabling / Mixed / Restricted)',
    definition:
      "Plain-language classification of a host country's legal hiring rules—routing talent to direct local jobs or compliant remote and EOR corridors.",
    audience: 'Shared',
    stageLabel: 'Stage 2 · Unlock',
    builderTab: 'unlock',
    builderJumpLabel: 'Go to Stage 2',
    partnerTab: 'compliance',
    partnerJumpLabel: 'Go to Compliance & Contracting',
    partnerRelevant: true,
    keywords: 'work authorization tiers enabling mixed restricted host country legal permit',
  },
  {
    id: 'legal-fatf-kyc',
    category: 'legal',
    term: 'FATF Risk-Based Tiered KYC',
    definition:
      'Global financial standard allowing proportional identity checks (Tier 1 digital wallets, Tier 2 e-KYC rails, Tier 3 bank accounts) when standard paperwork is unavailable.',
    audience: 'Shared',
    stageLabel: 'Stage 2 · Unlock',
    builderTab: 'unlock',
    builderJumpLabel: 'Go to Stage 2',
    partnerTab: 'compliance',
    partnerJumpLabel: 'Go to Compliance & Contracting',
    partnerRelevant: true,
    keywords: 'fatf risk-based tiered kyc payout wallet mobile money bank financial inclusion',
  },
  {
    id: 'legal-eor',
    category: 'legal',
    term: 'EOR (Employer of Record) / Fiscal Host',
    definition:
      'A compliant legal intermediary handling local payroll, taxes, and contracts so Hiring Partners can pay remote or displaced talent with zero local-entity risk.',
    audience: 'Hiring Partner',
    stageLabel: 'Stage 2 · Unlock',
    builderTab: 'unlock',
    builderJumpLabel: 'Go to Stage 2',
    partnerTab: 'compliance',
    partnerJumpLabel: 'Go to Compliance & Contracting',
    partnerRelevant: true,
    keywords: 'eor employer of record fiscal host payroll tax contract hiring partner remote',
  },
  {
    id: 'legal-unhcr-id',
    category: 'legal',
    term: 'UNHCR Proof of Registration / Convention Travel Document',
    definition:
      'Internationally recognized displacement identity documents mapped safely to proportional KYC payout rails and legal work pathways.',
    audience: 'Builder',
    stageLabel: 'Stage 2 · Unlock',
    builderTab: 'unlock',
    builderJumpLabel: 'Go to Stage 2',
    partnerTab: 'compliance',
    partnerJumpLabel: 'Go to Compliance & Contracting',
    partnerRelevant: true,
    keywords: 'unhcr proof of registration convention travel document ctd refugee id',
  },
  {
    id: 'legal-zero-raw-id',
    category: 'legal',
    term: 'Zero-Raw-ID Privacy',
    definition:
      "Vuka na Amana's protection rule: never permanently storing photos of Refugee IDs or asylum papers, retaining only verified readiness tier flags.",
    audience: 'Shared',
    stageLabel: 'Stage 2 · Unlock',
    builderTab: 'unlock',
    builderJumpLabel: 'Go to Stage 2',
    partnerTab: 'talent',
    partnerJumpLabel: 'Go to Consented Talent',
    partnerRelevant: true,
    keywords: 'zero raw id privacy data protection pii refugee safety security vault',
  },
  {
    id: 'legal-consent-bridge',
    category: 'legal',
    term: 'Zero-Trust Consent Bridge (VNA-GRANT-XXXX)',
    definition:
      'A signed, revocable permission token minted by the Builder so Hiring Partners view only approved skills and compliance shields—never private records.',
    audience: 'Hiring Partner',
    stageLabel: 'Stage 2 · Unlock',
    builderTab: 'unlock',
    builderJumpLabel: 'Go to Stage 2',
    partnerTab: 'talent',
    partnerJumpLabel: 'Go to Consented Talent',
    partnerRelevant: true,
    keywords: 'zero trust consent bridge vna-grant vna-consent token revocable hiring partner',
  },

  // Category C — The 5-Stage Crossing & Researched Global Frameworks
  {
    id: 'fw-mentoring-mentorship',
    category: 'frameworks',
    term: 'Mentor-Mentee Relationship (Formal Mentorship vs. Sprint-Based Guidance)',
    targetTag: 'Mentoring & Mentorship Support Modes',
    definition:
      'The Mentor-Mentee relationship pairs practitioners with experienced Senior Specialists across two complementary modes. Choose Formal Mentorship Tracks for structured, multi-sprint growth—complete with 1:1 pairing goals, shared session agendas, milestone trackers, D3 growth roadmaps, and Tier 2/3 competency endorsements. Choose Spontaneous Sprint-Based Guidance for fast, targeted support inside an active Pod Sprint—such as ad-hoc QA thread feedback, timezone availability check-ins, or formative peer reviews on team collaboration notes.',
    audience: 'Shared',
    stageLabel: 'Stage 3 · Solve',
    builderTab: 'solve',
    builderJumpLabel: 'Go to Stage 3 · Solve & Mentor Hub',
    keywords:
      'mentor-mentee mentor mentee relationship formal mentorship tracks spontaneous sprint-based guidance mentoring mentorship qa peer review support',
  },
  {
    id: 'fw-vuka-ethos',
    category: 'frameworks',
    term: 'Vuka na Amana ("Cross Over with Trust")',
    definition:
      'Agency-first ethos uniting Refugee Support and Unapologetic Capability: "Encourage the dream. Acknowledge the skill. Attain the work."',
    audience: 'Shared',
    stageLabel: 'All 5 Stages',
    keywords: 'vuka na amana cross over trust ethos agency capability recognition meaning',
  },
  {
    id: 'fw-stage-1-passport',
    category: 'frameworks',
    term: 'Living Competency Passport & 4-Tier Trust Ladder',
    definition:
      'Server-signed skill proof (VNA-2026-XXXX) graded transparently from Tier 1 AI-Evaluated to Tier 2 Peer-Master Verified, Tier 3 Paid Sprint Proven, and Tier 4 Nationally Accredited.',
    audience: 'Builder',
    stageLabel: 'Stage 1 · Verify',
    builderTab: 'verify',
    builderJumpLabel: 'Go to Stage 1',
    partnerTab: 'talent',
    partnerJumpLabel: 'Go to Consented Talent',
    partnerRelevant: true,
    keywords: 'stage 1 verify living competency passport 4-tier trust ladder vna-2026 qr',
  },
  {
    id: 'fw-wes-enic',
    category: 'frameworks',
    term: 'WES Gateway / ENIC-NARIC (Route A)',
    definition:
      'Proven credential reconstruction mapping partial or foreign transcripts and licenses to host-country National Qualifications Framework (NQF) levels.',
    audience: 'Builder',
    stageLabel: 'Stage 1 · Verify',
    builderTab: 'verify',
    builderJumpLabel: 'Go to Stage 1',
    keywords: 'wes gateway enic naric route a credential reconstruction nqf transcripts',
  },
  {
    id: 'fw-uqp',
    category: 'frameworks',
    term: 'UNESCO Qualifications Passport (UQP — Route B)',
    definition:
      'Standardized assessment combining background reconstruction, structured technical defense, and a language check when paper diplomas are lost.',
    audience: 'Builder',
    stageLabel: 'Stage 1 · Verify',
    builderTab: 'verify',
    builderJumpLabel: 'Go to Stage 1',
    keywords: 'unesco qualifications passport uqp route b paperless assessment defense',
  },
  {
    id: 'fw-rpl',
    category: 'frameworks',
    term: 'ILO / KNQA Recognition of Prior Learning (RPL — Route C)',
    definition:
      'Formal certification of hands-on, informal, or workshop-learned craft using a Portfolio of Evidence (photos, walkthroughs, and peer vouches).',
    audience: 'Builder',
    stageLabel: 'Stage 1 · Verify',
    builderTab: 'verify',
    builderJumpLabel: 'Go to Stage 1',
    keywords: 'ilo knqa recognition prior learning rpl route c portfolio evidence craft',
  },
  {
    id: 'fw-micro-bridging',
    category: 'frameworks',
    term: 'Targeted Micro-Bridging & Fee-Waiver Stipends',
    definition:
      'Short, gap-specific modules and partner-funded vouchers covering exam fees, RPL assessments, or tools—replacing generic courses.',
    audience: 'Shared',
    stageLabel: 'Stage 1 · Verify',
    builderTab: 'verify',
    builderJumpLabel: 'Go to Stage 1',
    partnerTab: 'compliance',
    partnerJumpLabel: 'Go to Compliance & Contracting',
    partnerRelevant: true,
    keywords: 'micro bridging fee waiver stipends voucher exam rpl tvet',
  },
  {
    id: 'fw-stage-2-onboarding',
    category: 'frameworks',
    term: 'Crossing Over Access & Onboarding Pack',
    definition:
      'Global legal and KYC work-rights router paired with a 1-click compliant Hiring Partner Sprint Agreement.',
    audience: 'Hiring Partner',
    stageLabel: 'Stage 2 · Unlock',
    builderTab: 'unlock',
    builderJumpLabel: 'Go to Stage 2',
    partnerTab: 'compliance',
    partnerJumpLabel: 'Go to Compliance & Contracting',
    partnerRelevant: true,
    keywords: 'stage 2 unlock crossing over access onboarding pack sprint agreement shield',
  },
  {
    id: 'fw-pod-sprint',
    category: 'frameworks',
    term: 'Pod Sprint',
    definition:
      'A collaborative 1-to-2-week problem-solving unit in the Solve phase pairing a 30–46+ Specialist Lead with a 15–29 Emerging Builder to solve real partner briefs, track 3 delivery milestones, and release verified escrow stipends.',
    audience: 'Shared',
    stageLabel: 'Stage 3 · Solve',
    builderTab: 'solve',
    builderJumpLabel: 'Go to Stage 3',
    partnerTab: 'sprints',
    partnerJumpLabel: 'Go to Sprints & Roles',
    partnerRelevant: true,
    keywords:
      'pod sprint collaborative problem solving unit solve phase cross-age pairing milestones escrow',
  },
  {
    id: 'fw-stage-3-pods',
    category: 'frameworks',
    term: 'Living Proof Portfolio & Cross-Age Solution Pods',
    definition:
      'Phone-camera proof and voice walkthroughs matched to 1-to-2-week paid sprints pairing 30–46+ mentors with 15–29 youth (ILO Upgraded Apprenticeships) to close local-experience gaps.',
    audience: 'Shared',
    stageLabel: 'Stage 3 · Solve',
    builderTab: 'solve',
    builderJumpLabel: 'Go to Stage 3',
    partnerTab: 'talent',
    partnerJumpLabel: 'Go to Consented Talent',
    partnerRelevant: true,
    keywords: 'stage 3 solve living proof portfolio cross-age solution pods apprenticeship sprints',
  },
  {
    id: 'fw-job-to-fit',
    category: 'frameworks',
    term: 'Job-to-Fit Upskilling Bridge',
    definition:
      'Demand-driven micro-upskilling showing the single missing skill blocking a near-match candidate from a real paid role.',
    audience: 'Builder',
    stageLabel: 'Stage 3 · Solve',
    builderTab: 'solve',
    builderJumpLabel: 'Go to Stage 3',
    keywords: 'job to fit upskilling bridge near match gap skill stage 3 solve',
  },
  {
    id: 'fw-stage-4-pulse',
    category: 'frameworks',
    term: 'Impact Pulse, Cohort Provisioner & Peer-Assessor Flywheel',
    definition:
      'Live UN SDG telemetry paired with multi-country cohort scaling where verified 30–46+ Masters graduate into paid peer verifiers.',
    audience: 'Shared',
    stageLabel: 'Stage 4 · Pulse',
    builderTab: 'pulse',
    builderJumpLabel: 'Go to Stage 4',
    partnerTab: 'compliance',
    partnerJumpLabel: 'Go to Compliance & Contracting',
    partnerRelevant: true,
    keywords: 'stage 4 pulse impact telemetry cohort provisioner peer assessor flywheel scale',
  },
  {
    id: 'fw-stage-5-cleared',
    category: 'frameworks',
    term: 'Cleared for Your Future & Cleared Future Dossier',
    definition:
      "Long-term horizon planner converting verified skills into durable local roots (Kenya's Shirika Plan 2025–2035) or UNHCR Complementary Pathways (TBB, RefugePoint, WUSC, UNICORE) as a 3-year roadmap dossier.",
    audience: 'Builder',
    stageLabel: 'Stage 5 · Cleared',
    builderTab: 'cleared',
    builderJumpLabel: 'Go to Stage 5',
    keywords:
      'stage 5 cleared future dossier shirika plan 2025 2035 unhcr complementary pathways roadmap 2030 tbb refugepoint wusc unicore scholarship mobility',
  },
  {
    id: 'fw-policy-honesty-scam-free',
    category: 'frameworks',
    term: 'Live Policy Honesty Tags & Scam-Free Verification Rule',
    definition:
      'Real-time pathway status notices paired with an ironclad rule: legitimate UN, UNHCR, and mobility partner pathways never charge applicants broker fees.',
    audience: 'Builder',
    stageLabel: 'Stage 5 · Cleared',
    builderTab: 'cleared',
    builderJumpLabel: 'Go to Stage 5',
    keywords: 'live policy honesty tags scam free verification rule broker fees safety unhcr',
  },
  {
    id: 'fw-wcag-2-2',
    category: 'frameworks',
    term: 'WCAG 2.2 (Web Content Accessibility Guidelines)',
    definition:
      'Global W3C standard ensuring digital tools stay readable, keyboard-friendly, high-contrast, and easy to navigate for everyone without memory or dragging traps.',
    audience: 'Shared',
    stageLabel: 'Access & Comfort · All Stages',
    builderTab: 'solve',
    builderJumpLabel: 'Go to Stage 3',
    partnerTab: 'compliance',
    partnerJumpLabel: 'Go to Compliance & Contracting',
    partnerRelevant: true,
    keywords: 'wcag 2.2 w3c accessibility coga screen reader keyboard contrast captions access comfort',
  },
  {
    id: 'fw-universal-design',
    category: 'frameworks',
    term: 'Universal Design',
    definition:
      'Designing workspaces, tools, and workflows from day one so every person can use them comfortably without requiring special retrofits or personal disclosures.',
    audience: 'Shared',
    stageLabel: 'Stages 3–5 · Work & Cleared',
    builderTab: 'solve',
    builderJumpLabel: 'Go to Stage 3',
    partnerTab: 'sprints',
    partnerJumpLabel: 'Go to Sprints & Roles',
    partnerRelevant: true,
    keywords: 'universal design inclusive employment un crpd ceud accessible workspace remote ready',
  },
  {
    id: 'fw-ilo-reasonable-accommodation',
    category: 'legal',
    term: 'ILO Reasonable Accommodation',
    definition:
      'Practical, often zero-cost work adjustments—like written briefs, captions, or flexible hours—that let skilled builders deliver their best work without medical disclosure.',
    audience: 'Shared',
    stageLabel: 'Stages 3–5 · Solve, Pulse & Cleared',
    builderTab: 'solve',
    builderJumpLabel: 'Go to Stage 3',
    partnerTab: 'compliance',
    partnerJumpLabel: 'Go to Compliance & Contracting',
    partnerRelevant: true,
    keywords:
      'ilo reasonable accommodation workplace adjustments decent work how i work best inclusive onboarding stipend sdg 4.5 8.5 10.2',
  },
];

const FILTER_OPTIONS: Array<{ id: GlossaryFilterTab; label: string }> = [
  { id: 'all', label: 'All Terms' },
  { id: 'sdgs', label: 'Key SDGs (4, 8, 10, 16, 17)' },
  { id: 'legal', label: 'Legal & Financial' },
  { id: 'frameworks', label: '5-Stage Frameworks' },
  { id: 'partners', label: 'For Hiring Partners' },
];

export interface MentorshipFaqItem {
  id: string;
  question: string;
  answer: string;
  bestStage: string;
}

export const MENTORSHIP_VS_GUIDANCE_FAQ: MentorshipFaqItem[] = [
  {
    id: 'faq-choose-support',
    question: 'When should I choose a Formal Mentorship Track vs. Sprint-Based Guidance?',
    answer:
      'Choose a Formal Mentorship Track when you want structured, multi-sprint capability growth—such as mastering a domain track, following a milestone roadmap, setting recurring session agendas, and earning Tier 2/3 competency endorsements. Choose Sprint-Based Guidance when you need fast, targeted help on an active deliverable—like isolating a technical blocker, requesting a quick screen-share QA review, or tightening pod handoff notes.',
    bestStage: 'Stage 3 · Solve & Stage 4 · Pulse',
  },
  {
    id: 'faq-combine-both',
    question: 'Can I use both formal mentorship and sprint-based guidance at the same time?',
    answer:
      'Yes—the two modes are designed to complement each other. Many practitioners stay enrolled in one Formal Mentorship Track for long-term career and systems growth while using Sprint-Based Guidance inside the Mentor Messaging Drawer whenever a live partner brief requires immediate troubleshooting or pre-submission verification.',
    bestStage: 'Stage 3 · Solve',
  },
  {
    id: 'faq-prepare-sessions',
    question: 'How should I prepare differently for a mentorship session vs. a quick sprint check-in?',
    answer:
      'For Formal Mentorship sessions, draft a 2-to-3 bullet agenda in the Agenda tab beforehand and review your Growth Roadmap milestones. For Sprint-Based Guidance, share the exact blocker, two options you already considered, or ask for a brief screen share so your mentor can unblock you in minutes.',
    bestStage: 'Mentor Messaging Drawer',
  },
];

export interface GlossaryModalProps {
  isOpen: boolean;
  activePortal: PortalRealm;
  viewMode: 'landing' | 'studio';
  onClose: () => void;
  onJumpBuilderTab: (tab: WorkspaceTab) => void;
  onJumpPartnerTab: (tab: PartnerConsoleTab) => void;
}

export const GlossaryModal: React.FC<GlossaryModalProps> = ({
  isOpen,
  activePortal,
  viewMode,
  onClose,
  onJumpBuilderTab,
  onJumpPartnerTab,
}) => {
  const isPartnerConsole = viewMode === 'studio' && activePortal === 'partner';
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<GlossaryFilterTab>(
    isPartnerConsole ? 'partners' : 'all'
  );
  const [agendaFootnoteOpen, setAgendaFootnoteOpen] = useState(false);
  const [openFaqId, setOpenFaqId] = useState<string | null>(MENTORSHIP_VS_GUIDANCE_FAQ[0].id);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setActiveFilter(isPartnerConsole ? 'partners' : 'all');
      setOpenFaqId(MENTORSHIP_VS_GUIDANCE_FAQ[0].id);
      window.setTimeout(() => searchInputRef.current?.focus(), 30);
    }
  }, [isOpen, isPartnerConsole]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return GLOSSARY_ENTRIES.filter((entry) => {
      if (activeFilter === 'sdgs' && entry.category !== 'sdgs') return false;
      if (activeFilter === 'legal' && entry.category !== 'legal') return false;
      if (activeFilter === 'frameworks' && entry.category !== 'frameworks') return false;
      if (
        activeFilter === 'partners' &&
        entry.audience !== 'Hiring Partner' &&
        !entry.partnerRelevant
      ) {
        return false;
      }
      if (!q) return true;
      return (
        entry.term.toLowerCase().includes(q) ||
        entry.definition.toLowerCase().includes(q) ||
        (entry.targetTag?.toLowerCase().includes(q) ?? false) ||
        (entry.stageLabel?.toLowerCase().includes(q) ?? false) ||
        entry.audience.toLowerCase().includes(q) ||
        entry.keywords.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, activeFilter]);

  const sdgEntries = useMemo(
    () => filteredEntries.filter((e) => e.category === 'sdgs'),
    [filteredEntries]
  );
  const legalEntries = useMemo(
    () => filteredEntries.filter((e) => e.category === 'legal'),
    [filteredEntries]
  );
  const frameworkEntries = useMemo(
    () => filteredEntries.filter((e) => e.category === 'frameworks'),
    [filteredEntries]
  );

  const showMentorshipFaq = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return activeFilter === 'all' || activeFilter === 'frameworks';
    }
    return (
      'mentorship vs guidance formal long-term short-term sprint feedback mentor mentee faq'.includes(q) ||
      MENTORSHIP_VS_GUIDANCE_FAQ.some(
        (item) =>
          item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q)
      )
    );
  }, [searchQuery, activeFilter]);

  if (!isOpen) return null;

  const renderQuickJump = (entry: GlossaryEntry) => {
    if (isPartnerConsole) {
      if (!entry.partnerTab || !entry.partnerJumpLabel) return null;
      return (
        <button
          type="button"
          onClick={() => {
            onClose();
            onJumpPartnerTab(entry.partnerTab!);
          }}
          data-testid={`glossary-jump-${entry.id}`}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#146C53] dark:text-[#2EB88B] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span>{entry.partnerJumpLabel}</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      );
    }

    if (!entry.builderTab || !entry.builderJumpLabel) return null;
    return (
      <button
        type="button"
        onClick={() => {
          onClose();
          onJumpBuilderTab(entry.builderTab!);
        }}
        data-testid={`glossary-jump-${entry.id}`}
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#146C53] dark:text-[#2EB88B] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
      >
        <span>{entry.builderJumpLabel}</span>
        <ArrowRight className="w-3 h-3" />
      </button>
    );
  };

  const renderStandardCard = (entry: GlossaryEntry) => (
    <article
      key={entry.id}
      data-testid={`glossary-card-${entry.id}`}
      className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-4 flex flex-col justify-between gap-3"
    >
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h4 className="font-display text-sm sm:text-[15px] font-semibold text-[#17191C] dark:text-[#F4F2EE] leading-snug">
            {entry.term}
          </h4>
        </div>
        <p className="text-xs sm:text-[13px] text-[#43484E] dark:text-[#C4C9D0] leading-relaxed">
          {entry.definition}
        </p>
      </div>

      <div className="pt-2.5 border-t border-[#E8E3DB]/75 dark:border-[#2C3037]/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
          <span
            className={`font-semibold ${
              entry.audience === 'Hiring Partner'
                ? 'text-[#C4622D] dark:text-[#E07B46]'
                : entry.audience === 'Builder'
                  ? 'text-[#146C53] dark:text-[#2EB88B]'
                  : 'text-[#575B62] dark:text-[#A3A7AE]'
            }`}
          >
            {entry.audience}
          </span>
          {entry.stageLabel && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular text-[10px] px-2 py-0.5 rounded-full bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE]">
                {entry.stageLabel}
              </span>
            </>
          )}
        </div>
        {renderQuickJump(entry)}
      </div>
    </article>
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="glossary-modal-title"
      data-testid="glossary-reference-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto no-scrollbar"
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 14, scale: 0.985 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full max-w-4xl max-h-[88vh] flex flex-col rounded-2xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] shadow-2xl overflow-hidden"
      >
        {/* Warm Alabaster Sticky Header */}
        <div className="px-5 sm:px-6 py-4 bg-[#FAF8F5] dark:bg-[#16181C] border-b border-[#E8E3DB] dark:border-[#2C3037] flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#146C53] dark:text-[#2EB88B]">
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>Vuka na Amana · Plain-Language Reference</span>
            </div>
            <h2
              id="glossary-modal-title"
              className="mt-1 font-display text-xl sm:text-2xl font-medium tracking-tight text-[#17191C] dark:text-[#F4F2EE]"
            >
              Glossary — SDGs, Legal &amp; 5-Stage Terms
            </h2>
            <p className="mt-0.5 text-xs sm:text-sm text-[#575B62] dark:text-[#A3A7AE]">
              Clear, jargon-free definitions for Builders, Hiring Partners &amp; Judges.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Glossary and Reference Guide"
            data-testid="close-glossary-modal-btn"
            className="min-h-[36px] min-w-[36px] rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] inline-flex items-center justify-center shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sticky Search + 5 Filter Pills */}
        <div className="px-5 sm:px-6 py-3.5 bg-white dark:bg-[#1A1C20] border-b border-[#E8E3DB] dark:border-[#2C3037] space-y-3 shrink-0">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B] absolute left-3.5 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter terms, SDGs, or legal acronyms..."
              aria-label="Filter glossary terms, SDGs, or legal acronyms"
              data-testid="glossary-search-input"
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] text-xs sm:text-sm text-[#17191C] dark:text-[#F4F2EE] placeholder:text-[#787C84] dark:placeholder:text-[#757A82] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear glossary filter"
                className="absolute right-2.5 p-1 rounded-md text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div
            role="tablist"
            aria-label="Glossary categories"
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5"
          >
            {FILTER_OPTIONS.map((opt) => {
              const active = activeFilter === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  data-testid={`glossary-filter-${opt.id}`}
                  onClick={() => setActiveFilter(opt.id)}
                  className={`min-h-[34px] px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#146C53] dark:bg-[#2EB88B] text-white dark:text-[#121315]'
                      : 'bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE] hover:border-[#146C53]/45 dark:hover:border-[#2EB88B]/45 hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Curated Content Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-5 sm:px-6 py-5 space-y-7">
          {filteredEntries.length === 0 && !showMentorshipFaq ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-sm font-medium text-[#17191C] dark:text-[#F4F2EE]">
                No glossary terms match &ldquo;{searchQuery}&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveFilter('all');
                }}
                className="px-4 py-2 rounded-xl bg-[#E7F3EE] dark:bg-[#142B24] text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] cursor-pointer"
              >
                Reset filters &amp; show all terms
              </button>
            </div>
          ) : (
            <>
              {/* Category A: UN Sustainable Development Goals */}
              {sdgEntries.length > 0 && (
                <section aria-labelledby="glossary-cat-sdgs" className="space-y-3.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3
                      id="glossary-cat-sdgs"
                      className="font-display text-base sm:text-lg font-medium text-[#17191C] dark:text-[#F4F2EE]"
                    >
                      UN Sustainable Development Goals
                    </h3>
                    <span className="text-xs text-[#146C53] dark:text-[#2EB88B] font-medium">
                      5 Focal App Goals · UN 2030 Agenda
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {sdgEntries.map((entry) => (
                      <article
                        key={entry.id}
                        data-testid={`glossary-card-${entry.id}`}
                        className="rounded-xl bg-[#E7F3EE]/55 dark:bg-[#142B24]/65 border border-[#146C53]/30 dark:border-[#2EB88B]/35 p-4 flex flex-col justify-between gap-3"
                      >
                        <div className="space-y-1.5">
                          <h4 className="font-display text-sm sm:text-[15px] font-semibold text-[#17191C] dark:text-[#F4F2EE] leading-snug">
                            {entry.term}
                          </h4>
                          {entry.targetTag && (
                            <p className="font-mono-tabular text-[11px] font-semibold text-[#146C53] dark:text-[#2EB88B]">
                              {entry.targetTag}
                            </p>
                          )}
                          <p className="text-xs sm:text-[13px] text-[#353A40] dark:text-[#D5DAE0] leading-relaxed">
                            {entry.definition}
                          </p>
                        </div>

                        <div className="pt-2.5 border-t border-[#146C53]/15 dark:border-[#2EB88B]/20 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                            <span className="font-semibold text-[#146C53] dark:text-[#2EB88B]">
                              {entry.audience}
                            </span>
                            {entry.stageLabel && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono-tabular text-[10px] px-2 py-0.5 rounded-full bg-white/90 dark:bg-[#1A1C20] border border-[#146C53]/25 dark:border-[#2EB88B]/30 text-[#146C53] dark:text-[#2EB88B]">
                                  {entry.stageLabel}
                                </span>
                              </>
                            )}
                          </div>
                          {renderQuickJump(entry)}
                        </div>
                      </article>
                    ))}
                  </div>

                  {/* Compact collapsible UN 2030 Agenda footnote */}
                  <div className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() => setAgendaFootnoteOpen((open) => !open)}
                      aria-expanded={agendaFootnoteOpen}
                      data-testid="glossary-un-agenda-footnote-toggle"
                      className="w-full flex items-center justify-between gap-2 text-left text-xs font-medium text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] cursor-pointer"
                    >
                      <span>How these 5 focal goals sit within the broader UN 2030 Agenda</span>
                      {agendaFootnoteOpen ? (
                        <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                      )}
                    </button>
                    {agendaFootnoteOpen && (
                      <p className="mt-2 pt-2 border-t border-[#E8E3DB]/70 dark:border-[#2C3037]/70 text-xs text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                        The UN 2030 Agenda spans 17 Sustainable Development Goals adopted by all UN
                        Member States. Vuka na Amana directly measures SDGs 4, 8, 10, 16, and 17
                        while indirectly advancing SDG 1 (No Poverty) and SDG 5 (Gender Equality)
                        through fair-pay cross-age livelihoods and safe displacement mobility.
                      </p>
                    )}
                  </div>
                </section>
              )}

              {/* Category B: Legal, Work-Authorization & Financial Terms */}
              {legalEntries.length > 0 && (
                <section aria-labelledby="glossary-cat-legal" className="space-y-3.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3
                      id="glossary-cat-legal"
                      className="font-display text-base sm:text-lg font-medium text-[#17191C] dark:text-[#F4F2EE]"
                    >
                      Legal, Work-Authorization &amp; Financial Terms
                    </h3>
                    <span className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                      Stage 2 &amp; Partner Compliance
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {legalEntries.map(renderStandardCard)}
                  </div>
                </section>
              )}

              {/* Category C: The 5-Stage Crossing & Researched Global Frameworks */}
              {frameworkEntries.length > 0 && (
                <section aria-labelledby="glossary-cat-frameworks" className="space-y-3.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3
                      id="glossary-cat-frameworks"
                      className="font-display text-base sm:text-lg font-medium text-[#17191C] dark:text-[#F4F2EE]"
                    >
                      The 5-Stage Crossing &amp; Researched Global Frameworks
                    </h3>
                    <span className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                      Verify · Unlock · Solve · Pulse · Cleared
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {frameworkEntries.map(renderStandardCard)}
                  </div>
                </section>
              )}

              {/* Dedicated 'Mentorship vs. Guidance' FAQ Section */}
              {showMentorshipFaq && (
                <section
                  aria-labelledby="glossary-mentorship-faq-heading"
                  data-testid="glossary-mentorship-vs-guidance-faq"
                  className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#146C53]/30 dark:border-[#2EB88B]/35 p-4 sm:p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-[#E8E3DB] dark:border-[#2C3037]">
                    <div className="space-y-1">
                      <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#146C53] dark:text-[#2EB88B]">
                        <HelpCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>Mentorship vs. Guidance · FAQ</span>
                      </p>
                      <h3
                        id="glossary-mentorship-faq-heading"
                        className="font-display text-base sm:text-lg font-medium text-[#17191C] dark:text-[#F4F2EE]"
                      >
                        Choosing Between Formal Mentorship Tracks &amp; Sprint-Based Guidance
                      </h3>
                      <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                        Understand how long-term mentorship tracks and short-term sprint feedback work together across your projects.
                      </p>
                    </div>
                  </div>

                  {/* Quick 2-Column Side-by-Side Distinction */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl bg-[#E7F3EE]/55 dark:bg-[#142B24]/65 border border-[#146C53]/25 dark:border-[#2EB88B]/30 p-3.5 space-y-1.5">
                      <p className="text-xs font-semibold text-[#146C53] dark:text-[#2EB88B]">
                        Formal Mentorship Tracks (Long-Term)
                      </p>
                      <p className="text-xs text-[#353A40] dark:text-[#D5DAE0] leading-relaxed">
                        Multi-sprint 1:1 pairing with a Senior Specialist—includes recurring agendas, Growth Roadmap milestones, audio feedback memos, and Tier 2/3 competency endorsements.
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-3.5 space-y-1.5">
                      <p className="text-xs font-semibold text-[#C4622D] dark:text-[#E07B46]">
                        Sprint-Based Guidance (Short-Term)
                      </p>
                      <p className="text-xs text-[#43484E] dark:text-[#C4C9D0] leading-relaxed">
                        Fast, targeted support inside an active Pod Sprint—ideal for unblocking a specific bug, requesting a live screen-share QA check, or refining delivery handoff notes.
                      </p>
                    </div>
                  </div>

                  {/* Collapsible FAQ Items */}
                  <div className="space-y-2">
                    {MENTORSHIP_VS_GUIDANCE_FAQ.map((faq) => {
                      const isExpanded = openFaqId === faq.id;
                      return (
                        <div
                          key={faq.id}
                          data-testid={`glossary-faq-item-${faq.id}`}
                          className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3.5 py-2.5"
                        >
                          <button
                            type="button"
                            onClick={() => setOpenFaqId(isExpanded ? null : faq.id)}
                            aria-expanded={isExpanded}
                            className="w-full flex items-center justify-between gap-2 text-left text-xs sm:text-[13px] font-semibold text-[#17191C] dark:text-[#F4F2EE] cursor-pointer"
                          >
                            <span>{faq.question}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-[#575B62] dark:text-[#A3A7AE] shrink-0" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-[#575B62] dark:text-[#A3A7AE] shrink-0" />
                            )}
                          </button>
                          {isExpanded && (
                            <div className="mt-2 pt-2 border-t border-[#E8E3DB]/75 dark:border-[#2C3037]/75 space-y-1.5">
                              <p className="text-xs text-[#43484E] dark:text-[#C4C9D0] leading-relaxed">
                                {faq.answer}
                              </p>
                              <p className="text-[11px] font-mono-tabular text-[#146C53] dark:text-[#2EB88B]">
                                Best used in: {faq.bestStage}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        {/* Calm Footer */}
        <div className="px-5 sm:px-6 py-3 bg-white dark:bg-[#1A1C20] border-t border-[#E8E3DB] dark:border-[#2C3037] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#575B62] dark:text-[#A3A7AE] shrink-0">
          <span>
            {filteredEntries.length} {filteredEntries.length === 1 ? 'term' : 'terms'} shown
            {isPartnerConsole ? ' · Hiring Partner Console view' : ''}
          </span>
          <span className="font-mono-tabular">Esc to close</span>
        </div>
      </motion.div>
    </div>
  );
};
