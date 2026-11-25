import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Check,
  ClipboardCheck,
  Copy,
  ExternalLink,
  FileLock2,
  Library,
  Search,
  X,
} from 'lucide-react';
import {
  AUTH_SECURITY_GUIDE_PDF,
  JUDGE_MASTER_GUIDE_V2_PDF,
  type PdfDocumentSpec,
} from './JudgeGuidePdfModal';

export type BibliographyFilterTab = 'all' | 'program' | 'stage1' | 'stage2' | 'stages3to5';

interface BibliographySource {
  id: string;
  number: number;
  category: Exclude<BibliographyFilterTab, 'all'>;
  institution: string;
  stageSdgTag: string;
  title: string;
  publicationScope: string;
  howItShapedApp: string;
  url?: string;
  urlLabel?: string;
  secondaryUrl?: string;
  secondaryUrlLabel?: string;
  pdfDocument?: PdfDocumentSpec;
  apaCitation: string;
  keywords: string;
}

export const BIBLIOGRAPHY_SOURCES: BibliographySource[] = [
  // Category A — Primary Program & Application Documents
  {
    id: 'bib-1-concept-note',
    number: 1,
    category: 'program',
    institution: 'Power Learn Project & ILO',
    stageSdgTag: 'Program Foundation · All 5 Stages',
    title: 'Concept Note: "Unlocking Displaced Talent: Pathways for Skilled Refugees" (2026)',
    publicationScope: 'Power Learn Project & ILO Cohort Program Brief · 2026',
    howItShapedApp:
      'Defines the 3 core inclusion tracks (Credential Recognition, Legal/Financial Access, Local Experience & Networks), the 5 evaluation benchmarks, and the focus on repeatable pathways over advocacy alone.',
    url: 'https://powerlearnprojectafrica.org/',
    urlLabel: 'powerlearnprojectafrica.org',
    apaCitation:
      'Power Learn Project & International Labour Organization (ILO) Cohort. (2026). Unlocking Displaced Talent: Pathways for Skilled Refugees [Concept Note].',
    keywords:
      'power learn project ilo cohort concept note unlocking displaced talent pathways skilled refugees benchmarks 2026 program',
  },
  {
    id: 'bib-2-judge-guide',
    number: 2,
    category: 'program',
    institution: 'Vuka na Amana',
    stageSdgTag: 'QA & Audit · 5 Stages & 2FA/PIN',
    title: 'Judge Testing & Evaluation Guide (v2) (Vuka_na_Amana_Judge_Testing_Guide-v2.pdf)',
    publicationScope: 'In-Repo 3-Page Evaluator Walkthrough, 2FA/PIN Auth & Concept Note Scorecard · 2026',
    howItShapedApp:
      '2-minute (120-second) 5-stage stress test using contrasting personas, 2FA/PIN auth checks, Search Hub audit, and Concept Note benchmark scorecard.',
    pdfDocument: JUDGE_MASTER_GUIDE_V2_PDF,
    apaCitation:
      'Vuka na Amana. (2026). Judge Testing & Evaluation Guide (v2) (Vuka_na_Amana_Judge_Testing_Guide-v2.pdf). Internal Evaluation & QA Protocol (3 pp.).',
    keywords:
      'vuka na amana judge testing evaluation guide v2 pdf 120 second stress test personas qa checklist search hub cleared scorecard',
  },
  {
    id: 'bib-3-auth-security-guide',
    number: 3,
    category: 'program',
    institution: 'Vuka na Amana',
    stageSdgTag: 'Security QA · 2FA OTP, PIN & Isolation',
    title: 'App Authentication & Security Guide (App_Authentication_Judges_Testing_Guide.pdf)',
    publicationScope: 'In-Repo 2-Page Security & Dual-Door Auth Companion Test Suite · 2026',
    howItShapedApp:
      'Defines test suites for 2FA OTP verification, No-Phone Dedicated PIN sanctuary entry, Auth-Gated Search navigation, and strict Builder/Partner portal isolation.',
    pdfDocument: AUTH_SECURITY_GUIDE_PDF,
    apaCitation:
      'Vuka na Amana. (2026). App Authentication & Security Guide (App_Authentication_Judges_Testing_Guide.pdf). Security & Auth Companion Test Suite (2 pp.).',
    keywords:
      'vuka na amana app authentication security guide pdf 2fa otp pin no phone search gates portal isolation consent partner privacy judge',
  },
  {
    id: 'bib-3-un-2030-agenda',
    number: 4,
    category: 'program',
    institution: 'United Nations',
    stageSdgTag: 'Stage 4 · SDGs 4, 8, 10, 16 & 17',
    title: 'Transforming Our World: The 2030 Agenda for Sustainable Development',
    publicationScope: 'UN General Assembly Resolution A/RES/70/1 · Global Framework',
    howItShapedApp:
      'Anchors Tab 4 ([Pulse]) telemetry to exact measurable targets—SDG 4 (4.3, 4.4, 4.5, 4.b), SDG 8 (8.3, 8.5, 8.8, 8.10), SDG 10 (10.2, 10.7), SDG 16 (16.6, 16.9, 16.b), and SDG 17 (17.17).',
    url: 'https://sdgs.un.org/2030agenda',
    urlLabel: 'sdgs.un.org',
    apaCitation:
      'United Nations. (2015). Transforming Our World: The 2030 Agenda for Sustainable Development (A/RES/70/1). https://sdgs.un.org/2030agenda',
    keywords:
      'united nations un 2030 agenda sustainable development goals sdg 4 8 10 16 17 targets pulse telemetry sdgs.un.org',
  },

  // Category B — Stage 1 ([Verify]): Credential Recognition & Skills Validation (SDGs 4 & 8)
  {
    id: 'bib-4-unesco-uqp',
    number: 5,
    category: 'stage1',
    institution: 'UNESCO',
    stageSdgTag: 'Stage 1 · SDGs 4 & 8',
    title: 'UNESCO Qualifications Passport (UQP) for Refugees and Vulnerable Migrants',
    publicationScope: 'UNESCO Global Credential Recognition Standard',
    howItShapedApp:
      'Structures Route B (missing paperwork background reconstruction, technical defense, language tagging) and enforces the honest 4-Tier Trust Ladder transparency rule.',
    url: 'https://www.unesco.org/en/emergencies/qualifications-passport',
    urlLabel: 'unesco.org',
    apaCitation:
      'UNESCO. (2023). UNESCO Qualifications Passport (UQP) for Refugees and Vulnerable Migrants. https://www.unesco.org/en/emergencies/qualifications-passport',
    keywords:
      'unesco qualifications passport uqp refugees vulnerable migrants route b verify credential recognition 4-tier trust ladder',
  },
  {
    id: 'bib-5-wes-enic',
    number: 6,
    category: 'stage1',
    institution: 'WES & ENIC-NARIC',
    stageSdgTag: 'Stage 1 · SDGs 4 & 8',
    title: 'WES Gateway Program & Lisbon Recognition Convention Background Document',
    publicationScope: 'World Education Services & ENIC-NARIC International Network',
    howItShapedApp:
      'Grounds Route A foreign credential equivalency mapping and partial-transcript reconstruction when home institutions are unreachable.',
    url: 'https://www.wes.org/partners/global-talent-bridge/wes-gateway-program/',
    urlLabel: 'wes.org',
    secondaryUrl: 'https://www.enic-naric.net/',
    secondaryUrlLabel: 'enic-naric.net',
    apaCitation:
      'World Education Services (WES) & ENIC-NARIC Network. WES Gateway Program & Lisbon Recognition Convention Background Document. https://www.wes.org/ | https://www.enic-naric.net/',
    keywords:
      'wes world education services gateway enic naric lisbon recognition convention route a foreign credential equivalency transcripts verify',
  },
  {
    id: 'bib-6-ilo-knqa-rpl',
    number: 7,
    category: 'stage1',
    institution: 'ILO & KNQA',
    stageSdgTag: 'Stage 1 · SDGs 4 & 8',
    title: 'Recognition of Prior Learning (RPL) Guidelines & National RPL Policy',
    publicationScope: 'ILO & Kenya National Qualifications Authority (KNQA)',
    howItShapedApp:
      'Powers Route C hands-on Portfolios of Evidence (photos, walkthroughs, peer vouches) and targeted micro-bridging with fee-waiver/stipend support.',
    url: 'https://www.ilo.org/publications/recognition-prior-learning-rpl-learning-package',
    urlLabel: 'ilo.org',
    secondaryUrl: 'https://www.knqa.go.ke/',
    secondaryUrlLabel: 'knqa.go.ke',
    apaCitation:
      'International Labour Organization (ILO) & Kenya National Qualifications Authority (KNQA). Recognition of Prior Learning (RPL) Guidelines & National RPL Policy. https://www.ilo.org/ | https://www.knqa.go.ke/',
    keywords:
      'ilo knqa kenya national qualifications authority rpl recognition prior learning route c portfolio evidence micro bridging stipend verify',
  },

  // Category C — Stage 2 ([Unlock]): Legal, Regulatory & Financial Access (SDGs 8, 10 & 16)
  {
    id: 'bib-7-ilo-guiding-principles',
    number: 8,
    category: 'stage2',
    institution: 'ILO',
    stageSdgTag: 'Stage 2 · SDGs 8, 10 & 16',
    title: 'Guiding Principles on the Access of Refugees and Other Forcibly Displaced Persons to the Labour Market',
    publicationScope: 'International Labour Organization (ILO) Normative Framework',
    howItShapedApp:
      'Drives the global jurisdiction router (Enabling / Mixed / Restricted work-auth tiers), equal-treatment labour standards, and fair-pay contract templates.',
    url: 'https://www.ilo.org/resource/guiding-principles-access-refugees-and-other-forcibly-displaced-persons',
    urlLabel: 'ilo.org',
    apaCitation:
      'International Labour Organization (ILO). (2016). Guiding Principles on the Access of Refugees and Other Forcibly Displaced Persons to the Labour Market. https://www.ilo.org/',
    keywords:
      'ilo guiding principles access refugees forcibly displaced persons labour market jurisdiction router work auth legal unlock',
  },
  {
    id: 'bib-8-unhcr-financial-inclusion',
    number: 9,
    category: 'stage2',
    institution: 'UNHCR',
    stageSdgTag: 'Stage 2 · SDGs 8, 10 & 16',
    title: 'Financial Inclusion & Regulatory Access Mapping for Forcibly Displaced Persons',
    publicationScope: 'UNHCR Livelihoods & Economic Inclusion Global Mapping',
    howItShapedApp:
      'Informs host-country documentation acceptance mapping (Refugee ID, UNHCR Proof of Registration, Convention Travel Document) and branch-level KYC barrier workarounds.',
    url: 'https://www.unhcr.org/what-we-do/build-better-futures/livelihoods-and-economic-inclusion/financial-inclusion',
    urlLabel: 'unhcr.org',
    apaCitation:
      'UNHCR. Financial Inclusion & Regulatory Access Mapping for Forcibly Displaced Persons. https://www.unhcr.org/',
    keywords:
      'unhcr financial inclusion regulatory access mapping refugee id proof registration convention travel document kyc unlock',
  },
  {
    id: 'bib-9-fatf-kyc',
    number: 10,
    category: 'stage2',
    institution: 'FATF',
    stageSdgTag: 'Stage 2 · SDGs 8 & 16',
    title: 'Guidance on Anti-Money Laundering, Financial Inclusion & Risk-Based Tiered KYC',
    publicationScope: 'Financial Action Task Force (FATF) Global Compliance Standard',
    howItShapedApp:
      'Powers the proportional Tier 1 (mobile/digital wallets) → Tier 2 (e-KYC freelance rails) → Tier 3 (full banking) payout bridge and Zero-Raw-ID data minimization.',
    url: 'https://www.fatf-gafi.org/en/publications/Financialinclusion/Guidance-rba-financial-inclusion.html',
    urlLabel: 'fatf-gafi.org',
    apaCitation:
      'Financial Action Task Force (FATF). Guidance on Anti-Money Laundering, Financial Inclusion & Risk-Based Tiered KYC. https://www.fatf-gafi.org/',
    keywords:
      'fatf financial action task force anti-money laundering aml financial inclusion risk-based tiered kyc payout wallet zero raw id unlock',
  },

  // Category D — Stages 3–5 ([Solve], [Pulse], [Cleared]): Market Fit, Cohesion & Durable Futures
  {
    id: 'bib-10-prospects-apprenticeships',
    number: 11,
    category: 'stages3to5',
    institution: 'ILO · UNHCR · UNICEF · IFC · World Bank',
    stageSdgTag: 'Stages 3 & 4 · SDGs 4, 8, 10 & 17',
    title: 'PROSPECTS Partnership & ILO Upgraded Informal Apprenticeships Framework',
    publicationScope: 'Multi-Agency Forced Displacement Livelihoods Partnership',
    howItShapedApp:
      "Shapes Tab 3's demand-driven Job-to-Fit Upskilling Bridge, Cross-Age Solution Pods pairing 30–46+ mentors with 15–29 displaced and host-community youth, and tripartite partnerships.",
    url: 'https://www.ilo.org/projects-and-partnerships/projects/partnership-improving-prospects-forcibly-displaced-persons-and-host',
    urlLabel: 'ilo.org',
    apaCitation:
      'ILO, UNHCR, UNICEF, IFC & World Bank. PROSPECTS Partnership & ILO Upgraded Informal Apprenticeships Framework. https://www.ilo.org/',
    keywords:
      'ilo unhcr unicef ifc world bank prospects partnership upgraded informal apprenticeships cross-age pods solve pulse tripartite',
  },
  {
    id: 'bib-11-gcr-roadmap-2030',
    number: 12,
    category: 'stages3to5',
    institution: 'United Nations & UNHCR',
    stageSdgTag: 'Stage 5 · SDGs 4, 8, 10 & 17',
    title: 'Global Compact on Refugees (GCR) & UNHCR Third Country Solutions: Roadmap 2030',
    publicationScope: 'UN Global Compact & UNHCR Complementary Pathways Strategy',
    howItShapedApp:
      'Grounds Tab 5 ([5. Cleared]) in regulated Complementary Labour & Education Pathways (referencing vetted enablers including Talent Beyond Boundaries, RefugePoint, WUSC, UNICORE, UNIV’R, and SNHU/GEM), live policy-honesty tags, and anti-scam protection.',
    url: 'https://www.unhcr.org/what-we-do/build-better-futures/long-term-solutions/complementary-pathways-admission-third',
    urlLabel: 'unhcr.org',
    apaCitation:
      'United Nations & UNHCR. (2018–2030). Global Compact on Refugees (GCR) & Third Country Solutions: Roadmap 2030. https://www.unhcr.org/',
    keywords:
      'un global compact refugees gcr unhcr third country solutions roadmap 2030 complementary pathways labour education tbb refugepoint wusc unicore univr snhu gem cleared',
  },
  {
    id: 'bib-12-shirika-plan',
    number: 13,
    category: 'stages3to5',
    institution: 'Government of Kenya & UNHCR',
    stageSdgTag: 'Stage 5 · SDGs 8, 10, 16 & 17',
    title: 'The Shirika Plan (2025–2035): Socio-Economic Integration Framework',
    publicationScope: 'Government of Kenya & UNHCR Joint 10-Year Integration Plan',
    howItShapedApp:
      'Anchors the "Build Roots Here" horizon track in Tab 5—modeling the transition from camps/settlements to integrated municipalities with national services, business registration, and RLO/SME growth.',
    url: 'https://www.unhcr.org/ke/shirika-plan',
    urlLabel: 'unhcr.org',
    apaCitation:
      'Government of Kenya & UNHCR. (2025). The Shirika Plan (2025–2035): Socio-Economic Integration Framework. https://www.unhcr.org/ke/shirika-plan',
    keywords:
      'government of kenya unhcr shirika plan 2025 2035 socio-economic integration build roots municipalities rlo sme cleared',
  },
  {
    id: 'bib-13-w3c-wcag-2-2',
    number: 14,
    category: 'stages3to5',
    institution: 'W3C (World Wide Web Consortium)',
    stageSdgTag: 'All Stages · SDGs 4 & 10',
    title: 'Web Content Accessibility Guidelines (WCAG) 2.2 & Cognitive Accessibility (COGA)',
    publicationScope: 'W3C Recommendation · Level AA/AAA Universal Accessibility Standard',
    howItShapedApp:
      'Directly governs the Access & Comfort drawer, accessible paste-ready 2FA authentication (WCAG 3.3.8), non-dragging upload controls (2.5.7), and calm screen-reader status announcements.',
    url: 'https://www.w3.org/TR/WCAG22/',
    urlLabel: 'w3.org/TR/WCAG22',
    apaCitation:
      'World Wide Web Consortium (W3C). (2023). Web Content Accessibility Guidelines (WCAG) 2.2. https://www.w3.org/TR/WCAG22/',
    keywords:
      'w3c wcag 2.2 coga cognitive accessibility screen reader keyboard paste auth access comfort sdg 4 10',
  },
  {
    id: 'bib-14-universal-design-crpd',
    number: 15,
    category: 'stages3to5',
    institution: 'United Nations CRPD & CEUD',
    stageSdgTag: 'Stages 3–5 · SDGs 4, 8 & 10',
    title: 'Convention on the Rights of Persons with Disabilities (Art. 2 & 27) & Principles of Universal Design',
    publicationScope: 'UN Global Human Rights Standard & Universal Design Framework',
    howItShapedApp:
      'Shapes the dignity-first "How I Work Best" practical work-setup preferences in Tabs 3 & 5—removing medical disclosure barriers and embedding Built-In Workspace Readiness on Partner sprints.',
    url: 'https://www.un.org/development/desa/disabilities/convention-on-the-rights-of-persons-with-disabilities.html',
    urlLabel: 'un.org/disabilities',
    apaCitation:
      'United Nations. (2006). Convention on the Rights of Persons with Disabilities (CRPD), Articles 2 & 27 (Universal Design & Inclusive Employment). https://www.un.org/',
    keywords:
      'universal design un crpd ceud inclusive employment work setup dignity privacy zero medical disclosure',
  },
  {
    id: 'bib-15-ilo-reasonable-accommodation',
    number: 16,
    category: 'stages3to5',
    institution: 'International Labour Organization (ILO)',
    stageSdgTag: 'Stages 3–5 · SDGs 4.5, 8.5 & 10.2',
    title: 'Promoting Diversity and Inclusion through Workplace Adjustments: A Practical Guide',
    publicationScope: 'ILO Global Inclusive Employment & Reasonable Accommodation Guide',
    howItShapedApp:
      'Grounds the two-sided Reasonable Accommodation bridge: optional Builder setup chips shared only via VNA-GRANT consent, $0 Inclusive Onboarding Checklist for Hiring Partners, and SDG 4.5/8.5/10.2 Pulse telemetry.',
    url: 'https://www.ilo.org/publications/promoting-diversity-and-inclusion-through-workplace-adjustments-practical',
    urlLabel: 'ilo.org',
    apaCitation:
      'International Labour Organization (ILO). (2016). Promoting Diversity and Inclusion through Workplace Adjustments: A Practical Guide. https://www.ilo.org/',
    keywords:
      'ilo international labour organization reasonable accommodation workplace adjustments inclusive onboarding decent work sdg 4.5 8.5 10.2',
  },
];

const FILTER_TABS: Array<{ id: BibliographyFilterTab; label: string }> = [
  { id: 'all', label: 'All Sources' },
  { id: 'program', label: 'Program & App Docs' },
  { id: 'stage1', label: 'Stage 1 · Verify' },
  { id: 'stage2', label: 'Stage 2 · Unlock' },
  { id: 'stages3to5', label: 'Stages 3–5 · Work, SDGs & Cleared' },
];

const CATEGORY_HEADINGS: Record<
  Exclude<BibliographyFilterTab, 'all'>,
  { title: string; subtitle: string }
> = {
  program: {
    title: 'Primary Program & Application Documents',
    subtitle: 'Core concept note, evaluator guide & UN 2030 Agenda',
  },
  stage1: {
    title: 'Stage 1 ([Verify]): Credential Recognition & Skills Validation',
    subtitle: 'SDGs 4 & 8 · Routes A, B & C',
  },
  stage2: {
    title: 'Stage 2 ([Unlock]): Legal, Regulatory & Financial Access',
    subtitle: 'SDGs 8, 10 & 16 · Labour rights & tiered KYC',
  },
  stages3to5: {
    title: 'Stages 3–5 ([Solve], [Pulse], [Cleared]): Market Fit, Cohesion & Durable Futures',
    subtitle: 'SDGs 4, 8, 10, 16 & 17 · Pods, mobility & local integration',
  },
};

function buildFullBibliographyMarkdown(): string {
  const sections: Array<Exclude<BibliographyFilterTab, 'all'>> = [
    'program',
    'stage1',
    'stage2',
    'stages3to5',
  ];
  const lines: string[] = [
    '# Vuka na Amana — Bibliography & Research Foundation',
    '',
    '> "Encourage the dream. Acknowledge the skill. Attain the work." — Turning sidelined talent into active impact.',
    '',
  ];

  for (const sec of sections) {
    const meta = CATEGORY_HEADINGS[sec];
    lines.push(`## ${meta.title}`);
    lines.push('');
    const items = BIBLIOGRAPHY_SOURCES.filter((s) => s.category === sec);
    for (const item of items) {
      lines.push(`${item.number}. ${item.apaCitation}`);
      lines.push(`   - **How It Shaped This App:** ${item.howItShapedApp}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export interface BibliographyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPdfPreview: (doc: PdfDocumentSpec) => void;
}

export const BibliographyModal: React.FC<BibliographyModalProps> = ({
  isOpen,
  onClose,
  onOpenPdfPreview,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<BibliographyFilterTab>('all');
  const [copied, setCopied] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setActiveFilter('all');
      setCopied(false);
      window.setTimeout(() => searchInputRef.current?.focus(), 30);
    }
  }, [isOpen]);

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

  const filteredSources = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return BIBLIOGRAPHY_SOURCES.filter((src) => {
      if (activeFilter !== 'all' && src.category !== activeFilter) return false;
      if (!q) return true;
      return (
        src.title.toLowerCase().includes(q) ||
        src.institution.toLowerCase().includes(q) ||
        src.stageSdgTag.toLowerCase().includes(q) ||
        src.publicationScope.toLowerCase().includes(q) ||
        src.howItShapedApp.toLowerCase().includes(q) ||
        src.keywords.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, activeFilter]);

  const groupedSections = useMemo(() => {
    const order: Array<Exclude<BibliographyFilterTab, 'all'>> = [
      'program',
      'stage1',
      'stage2',
      'stages3to5',
    ];
    return order
      .map((cat) => ({
        category: cat,
        meta: CATEGORY_HEADINGS[cat],
        items: filteredSources.filter((s) => s.category === cat),
      }))
      .filter((group) => group.items.length > 0);
  }, [filteredSources]);

  const handleCopyFullBibliography = async () => {
    const markdown = buildFullBibliographyMarkdown();
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(markdown);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = markdown;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bibliography-modal-title"
      data-testid="bibliography-reference-modal"
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
        {/* Warm Alabaster Sticky Header (Max 2 controls + Close) */}
        <div className="px-5 sm:px-6 py-4 bg-[#FAF8F5] dark:bg-[#16181C] border-b border-[#E8E3DB] dark:border-[#2C3037] flex flex-wrap items-start justify-between gap-3 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#146C53] dark:text-[#2EB88B]">
              <Library className="w-4 h-4 shrink-0" />
              <span>Vuka na Amana · Evidence &amp; Policy Citations</span>
            </div>
            <h2
              id="bibliography-modal-title"
              className="mt-1 font-display text-xl sm:text-2xl font-medium tracking-tight text-[#17191C] dark:text-[#F4F2EE]"
            >
              Bibliography &amp; Research Foundation
            </h2>
            <p className="mt-0.5 text-xs sm:text-sm text-[#575B62] dark:text-[#A3A7AE]">
              Concept note, UN/ILO policies, FATF KYC standards &amp; global displacement frameworks.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => void handleCopyFullBibliography()}
              data-testid="copy-full-bibliography-btn"
              className={`min-h-[36px] px-3 py-1.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                copied
                  ? 'bg-[#E7F3EE] dark:bg-[#142B24] border-[#146C53]/40 dark:border-[#2EB88B]/40 text-[#146C53] dark:text-[#2EB88B]'
                  : 'bg-white dark:bg-[#1A1C20] border-[#E8E3DB] dark:border-[#2C3037] text-[#17191C] dark:text-[#F4F2EE] hover:border-[#146C53] dark:hover:border-[#2EB88B]'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B]" />
                  <span>Copy Full Bibliography</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Bibliography and Research Foundation"
              data-testid="close-bibliography-modal-btn"
              className="min-h-[36px] min-w-[36px] rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] inline-flex items-center justify-center shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sticky Search + 5 Filter Chips */}
        <div className="px-5 sm:px-6 py-3.5 bg-white dark:bg-[#1A1C20] border-b border-[#E8E3DB] dark:border-[#2C3037] space-y-3 shrink-0">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B] absolute left-3.5 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by document, UN body, or stage..."
              aria-label="Filter bibliography by document, UN body, or stage"
              data-testid="bibliography-search-input"
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] text-xs sm:text-sm text-[#17191C] dark:text-[#F4F2EE] placeholder:text-[#787C84] dark:placeholder:text-[#757A82] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear bibliography search"
                className="absolute right-2.5 p-1 rounded-md text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div
            role="tablist"
            aria-label="Bibliography source categories"
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5"
          >
            {FILTER_TABS.map((tab) => {
              const active = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  data-testid={`bibliography-filter-${tab.id}`}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`min-h-[34px] px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#146C53] dark:bg-[#2EB88B] text-white dark:text-[#121315]'
                      : 'bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE] hover:border-[#146C53]/45 dark:hover:border-[#2EB88B]/45 hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Curated Citations Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-5 sm:px-6 py-5 space-y-7">
          {groupedSections.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-sm font-medium text-[#17191C] dark:text-[#F4F2EE]">
                No citations match &ldquo;{searchQuery}&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveFilter('all');
                }}
                className="px-4 py-2 rounded-xl bg-[#E7F3EE] dark:bg-[#142B24] text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] cursor-pointer"
              >
                Reset filters &amp; show all {BIBLIOGRAPHY_SOURCES.length} sources
              </button>
            </div>
          ) : (
            groupedSections.map((group) => (
              <section
                key={group.category}
                aria-labelledby={`bib-cat-${group.category}`}
                className="space-y-3.5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3
                    id={`bib-cat-${group.category}`}
                    className="font-display text-base sm:text-lg font-medium text-[#17191C] dark:text-[#F4F2EE]"
                  >
                    {group.meta.title}
                  </h3>
                  <span className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                    {group.meta.subtitle}
                  </span>
                </div>

                <div className="space-y-3">
                  {group.items.map((src) => (
                    <article
                      key={src.id}
                      data-testid={`bibliography-card-${src.id}`}
                      className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-4 sm:p-5 space-y-2.5"
                    >
                      {/* Top row: Issuing Institution pill + Stage & SDG tags */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#E7F3EE] dark:bg-[#142B24] border border-[#146C53]/25 dark:border-[#2EB88B]/30 text-[11px] font-semibold text-[#146C53] dark:text-[#2EB88B]">
                            {src.institution}
                          </span>
                          <span className="text-[11px] font-mono-tabular text-[#575B62] dark:text-[#A3A7AE]">
                            {src.stageSdgTag}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono-tabular text-[#8A847A] dark:text-[#787268]">
                          Ref {String(src.number).padStart(2, '0')}
                        </span>
                      </div>

                      {/* Title, Scope & Action Link */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <h4 className="font-display text-sm sm:text-[15px] font-semibold text-[#17191C] dark:text-[#F4F2EE] leading-snug">
                            {src.title}
                          </h4>
                          <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                            {src.publicationScope}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0 sm:pt-0.5">
                          {src.pdfDocument ? (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onOpenPdfPreview(src.pdfDocument!);
                              }}
                              data-testid={`bibliography-open-pdf-${src.pdfDocument.id}`}
                              className={`min-h-[34px] px-3 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                                src.pdfDocument.variant === 'emerald'
                                  ? 'bg-[#E7F3EE] dark:bg-[#142B24] border-[#146C53]/30 dark:border-[#2EB88B]/35 hover:bg-[#D5EBE1] dark:hover:bg-[#1B3A30] text-[#146C53] dark:text-[#2EB88B]'
                                  : 'bg-[#F3EFEA] dark:bg-[#1E2126] border-[#D8D1C5] dark:border-[#343A44] hover:bg-[#E9E3DA] dark:hover:bg-[#272B33] text-[#17191C] dark:text-[#E2E8F0]'
                              }`}
                            >
                              {src.pdfDocument.variant === 'emerald' ? (
                                <ClipboardCheck className="w-3.5 h-3.5" />
                              ) : (
                                <FileLock2 className="w-3.5 h-3.5" />
                              )}
                              <span>Preview {src.pdfDocument.pageCountLabel}</span>
                            </button>
                          ) : (
                            <>
                              {src.url && (
                                <a
                                  href={src.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="min-h-[34px] px-3 py-1.5 rounded-lg bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                                >
                                  <span>{src.urlLabel ?? 'Official Source'}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                              {src.secondaryUrl && (
                                <a
                                  href={src.secondaryUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="min-h-[34px] px-3 py-1.5 rounded-lg bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-xs font-semibold text-[#575B62] dark:text-[#A3A7AE] hover:text-[#146C53] dark:hover:text-[#2EB88B] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                                >
                                  <span>{src.secondaryUrlLabel}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* 1-line "How It Shaped This App" */}
                      <p className="pt-2 border-t border-[#E8E3DB]/75 dark:border-[#2C3037]/80 text-xs sm:text-[13px] text-[#43484E] dark:text-[#C4C9D0] leading-relaxed">
                        <strong className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                          How It Shaped This App:
                        </strong>{' '}
                        {src.howItShapedApp}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>

        {/* Calm Footer */}
        <div className="px-5 sm:px-6 py-3 bg-white dark:bg-[#1A1C20] border-t border-[#E8E3DB] dark:border-[#2C3037] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#575B62] dark:text-[#A3A7AE] shrink-0">
          <span>
            Showing {filteredSources.length} of {BIBLIOGRAPHY_SOURCES.length} verified sources
          </span>
          <span className="font-mono-tabular">Esc to close</span>
        </div>
      </motion.div>
    </div>
  );
};
