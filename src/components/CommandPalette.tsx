import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Briefcase,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  Download,
  ExternalLink,
  FileCheck2,
  FileLock2,
  Globe,
  HelpCircle,
  Home,
  Library,
  Loader2,
  Lock,
  Mic,
  Moon,
  Scale,
  Search,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import type { PortalRealm, ProblemBrief, ThemeMode, WorkspaceTab } from '../types/kora';
import type { PartnerTab } from './PartnerConsoleView';
import {
  AUTH_SECURITY_GUIDE_PDF,
  JUDGE_MASTER_GUIDE_V2_PDF,
  type PdfDocumentSpec,
} from './JudgeGuidePdfModal';
import { GLOSSARY_ENTRIES } from './GlossaryModal';
import { BIBLIOGRAPHY_SOURCES } from './BibliographyModal';
import { SEED_BRIEFS } from '../utils/talentEngine';

export type CommandSubSection = 'all' | 'navigation' | 'actions' | 'faqs';

type ActionSectionGroup = 'stages' | 'reference' | 'app-wide' | 'utilities';

export interface CommandPaletteAction {
  id: string;
  group: 'Navigation' | 'Quick Actions' | 'FAQs & How It Works';
  section: ActionSectionGroup;
  label: string;
  subtitle: string;
  keywords: string;
  shortcut?: string;
  badgeVariant?:
    | 'default'
    | 'tab'
    | 'tab-emerald'
    | 'tab-locked'
    | 'tab-verified'
    | 'pdf-emerald'
    | 'pdf-slate'
    | 'reference'
    | 'sources';
  isLockedStage?: boolean;
  isVerifiedStage?: boolean;
  isPublicReference?: boolean;
  downloadHref?: string;
  downloadFilename?: string;
  downloadAriaLabel?: string;
  icon: React.ReactNode;
  onSelect: () => void;
}

interface GoogleSearchSource {
  title: string;
  uri: string;
}

interface GoogleSearchResult {
  query: string;
  summary: string;
  sources: GoogleSearchSource[];
  searchQueries: string[];
  generatedAtIso: string;
}

const HorizonCompassStarIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    <path d="M12 3.5l1.35 3.65L17 8.5l-3.65 1.35L12 13.5l-1.35-3.65L7 8.5l3.65-1.35L12 3.5z" />
    <path d="M4.5 17.5a8.5 8.5 0 0 1 15 0" />
    <path d="M3 19.5h18" />
  </svg>
);

const MonochromeGoogleMark: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <path
      d="M21.35 11.1H12v2.95h5.35c-.45 2.45-2.55 4.2-5.35 4.2a5.75 5.75 0 1 1 3.77-10.09l2.12-2.12A8.75 8.75 0 1 0 12 20.75c4.95 0 8.55-3.48 8.55-8.4 0-.45-.05-.85-.15-1.25h.95z"
      fill="currentColor"
    />
  </svg>
);

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  tag: string;
  relatedTab: WorkspaceTab;
  relatedTabLabel: string;
}

const VUKA_FAQS: FaqItem[] = [
  {
    id: 'faq-paperless-verify',
    question: 'Do I need paper diplomas, transcripts, or a formal CV to start?',
    answer:
      'No. In Tab 1 [Verify], you demonstrate capability through a 2-minute practical scenario or past work evidence via Voice-to-Text or written notes. Gemini structures your problem-solving logic into a QR-verifiable Living Competency Passport aligned with the UNESCO Qualifications Passport (UQP).',
    tag: 'UNESCO UQP · Paperless Proof',
    relatedTab: 'verify',
    relatedTabLabel: 'Go to 1. Verify',
  },
  {
    id: 'faq-compliance-payouts',
    question: 'How do talent and Hiring Partners navigate work permits, KYC, and cross-border payouts?',
    answer:
      'In Tab 2 [Unlock], Vuka na Amana maps host-country work-authorization routes (ILO Guiding Principles), clears FATF Risk-Based Tiered KYC payout rails (Mobile Money, Global Digital Wallet, or NGO/EOR Fiscal Host), and generates a 1-Page Employer Liability Shield agreement.',
    tag: 'ILO & FATF Tiered KYC',
    relatedTab: 'unlock',
    relatedTabLabel: 'Go to 2. Unlock',
  },
  {
    id: 'faq-upskilling-bridge',
    question: 'What happens if my skills are a 65%–90% fit for a matched job or sprint?',
    answer:
      'Instead of rejecting you, Tab 3 [Solve] opens a "Job-to-Fit Upskilling Bridge". It shows what you already prove, isolates the single missing micro-credential, and lets you either complete a 2–5 day self-paced micro-bridge (with fee-waiver stipend) or enter a paid ILO Upgraded Apprenticeship Pod.',
    tag: 'Demand-First Upskilling · RPL',
    relatedTab: 'solve',
    relatedTabLabel: 'Go to 3. Solve',
  },
  {
    id: 'faq-cross-age-mentorship',
    question: 'How do Cross-Age Pods and real-time Pod Mentorship work?',
    answer:
      'Every sprint pairs 15–17 and 18–29 Emerging Builders with 30–45 Specialists and 46+ Masters in dual refugee–host community pods. Active sprints include a live Pod Mentorship indicator and direct Message Mentor drawer for fast technical sign-off.',
    tag: 'Cross-Age Cohesion Pods',
    relatedTab: 'solve',
    relatedTabLabel: 'Go to 3. Solve',
  },
  {
    id: 'faq-offline-pulse-scale',
    question: 'Does the app work offline, and how is UN 2030 SDG impact measured?',
    answer:
      'Yes—every action saves first to an encrypted local offline queue and auto-syncs when connectivity returns. Tab 4 [Pulse] tracks live reactive counters across SDGs 4, 8, 10, 16 & 17, payout sparklines, Hiring Partner star reviews, and Tripartite Cohort Replication.',
    tag: 'Offline-First · UN 2030 SDGs',
    relatedTab: 'pulse',
    relatedTabLabel: 'Go to 4. Pulse',
  },
  {
    id: 'faq-cleared-future-horizon',
    question: 'What is Tab 5 [Cleared] and how does it support long-term mobility or local roots?',
    answer:
      'Tab 5 [Cleared — Cleared for Your Future] maps UNHCR Complementary Pathways (labour mobility via Talent Beyond Boundaries, education scholarships via WUSC/DAFI, family unity, and Shirika local integration) alongside a personalized 3-year roadmap and downloadable Readiness Dossier.',
    tag: 'UNHCR Roadmap 2030 · Durable Pathways',
    relatedTab: 'cleared',
    relatedTabLabel: 'Go to 5. Cleared',
  },
];

interface CommandPaletteProps {
  isOpen: boolean;
  activeTab: WorkspaceTab;
  theme: ThemeMode;
  activePortal?: PortalRealm;
  viewMode?: 'landing' | 'studio';
  hasCompletedCoreTabs?: boolean;
  isBuilderVerified?: boolean;
  isOnline?: boolean;
  activePartnerTab?: PartnerTab;
  sprints?: ProblemBrief[];
  onClose: () => void;
  onNavigateTab: (tab: WorkspaceTab) => void;
  onNavigatePartnerTab?: (tab: PartnerTab) => void;
  onSelectSprint?: (briefId: string) => void;
  onGoHome: () => void;
  onTriggerVoiceToText: () => void;
  onTriggerSharePassport: () => void;
  onOpenComplianceCrossing: () => void;
  onOpenScaleDrawer: () => void;
  onOpenGlossary: () => void;
  onOpenBibliography: () => void;
  onOpenAccessComfort?: () => void;
  onOpenPdfPreview?: (doc: PdfDocumentSpec) => void;
  onToggleTheme: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  activeTab,
  theme,
  activePortal = 'talent',
  viewMode = 'studio',
  hasCompletedCoreTabs = false,
  isBuilderVerified = false,
  isOnline = true,
  activePartnerTab = 'sprints',
  sprints = SEED_BRIEFS,
  onClose,
  onNavigateTab,
  onNavigatePartnerTab,
  onSelectSprint,
  onGoHome,
  onTriggerVoiceToText,
  onTriggerSharePassport,
  onOpenComplianceCrossing,
  onOpenScaleDrawer,
  onOpenGlossary,
  onOpenBibliography,
  onOpenAccessComfort,
  onOpenPdfPreview,
  onToggleTheme,
}) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeSubSection, setActiveSubSection] = useState<CommandSubSection>('all');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleResult, setGoogleResult] = useState<GoogleSearchResult | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Strict Builder / Hiring Partner portal isolation:
  // Builder stages (1–5) show on Landing Funnel and inside Builder Talent Studio.
  // Inside Hiring Partner Console, show ONLY Partner Console tabs (1–4) + shared Open Reference.
  const isPartnerConsoleActive = viewMode === 'studio' && activePortal === 'partner';
  const canShowBuilderRoutes = !isPartnerConsoleActive;

  const statusNote = isPartnerConsoleActive
    ? 'Partner Console'
    : isBuilderVerified
      ? 'Builder Verified'
      : '2FA / PIN Protected';

  const triggerPdfDownload = (doc: PdfDocumentSpec) => {
    if (typeof document === 'undefined') return;
    const link = document.createElement('a');
    link.href = doc.src;
    link.download = doc.filename;
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const runGoogleSearch = async (searchText?: string) => {
    const trimmed = (searchText ?? query).trim();
    if (trimmed.length < 2) {
      setGoogleError('Type at least 2 characters to search Google.');
      return;
    }
    if (!isOnline) {
      setGoogleError('Google Search grounding requires an active internet connection. Local app-wide results remain available above.');
      return;
    }
    setGoogleLoading(true);
    setGoogleError(null);
    try {
      const res = await fetch('/api/search/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: trimmed,
          contextPortal: isPartnerConsoleActive ? 'partner' : 'talent',
        }),
      });
      const data = (await res.json()) as Partial<GoogleSearchResult> & { error?: string };
      if (!res.ok || (!data.summary && (!data.sources || data.sources.length === 0))) {
        throw new Error(data.error || 'Unable to retrieve Google Search details right now.');
      }
      setGoogleResult({
        query: data.query ?? trimmed,
        summary: data.summary ?? '',
        sources: Array.isArray(data.sources) ? data.sources : [],
        searchQueries: Array.isArray(data.searchQueries) ? data.searchQueries : [],
        generatedAtIso: data.generatedAtIso ?? new Date().toISOString(),
      });
    } catch (err) {
      setGoogleResult(null);
      setGoogleError(
        err instanceof Error ? err.message : 'Unable to complete Google Search right now.'
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  // Clear stale Google result when query is emptied
  useEffect(() => {
    if (!query.trim()) {
      setGoogleResult(null);
      setGoogleError(null);
    }
  }, [query]);

  const baseActions: CommandPaletteAction[] = useMemo(() => {
    const builderBadge = (tabNum: number, isClearedCompleted = false) =>
      isBuilderVerified
        ? {
            shortcut: `Tab ${tabNum}`,
            badgeVariant: (isClearedCompleted ? 'tab-emerald' : 'tab-verified') as
              | 'tab-emerald'
              | 'tab-verified',
            isLockedStage: false,
            isVerifiedStage: true,
          }
        : {
            shortcut: `Tab ${tabNum} · 2FA/PIN`,
            badgeVariant: 'tab-locked' as const,
            isLockedStage: true,
            isVerifiedStage: false,
          };

    const builderTabActions: CommandPaletteAction[] = canShowBuilderRoutes
      ? [
          {
            id: 'nav-verify',
            group: 'Navigation',
            section: 'stages',
            label: 'Verify — Proof Studio & Competency Passport',
            subtitle:
              isBuilderVerified && activeTab === 'verify' && viewMode === 'studio'
                ? 'Active stage · Voice/text verification & Living Competency Passport'
                : 'Turn work history into a QR-verifiable Living Competency Passport',
            keywords: '1. verify verify passport skills 1 tab 1 proof studio endorsement uqp rpl',
            ...builderBadge(1),
            icon: <CheckCircle2 className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B]" />,
            onSelect: () => onNavigateTab('verify'),
          },
          {
            id: 'nav-unlock',
            group: 'Navigation',
            section: 'stages',
            label: 'Unlock — Readiness, Compliance & Access',
            subtitle:
              isBuilderVerified && activeTab === 'unlock' && viewMode === 'studio'
                ? 'Active stage · Work-Ready Vault, ILO rights & FATF payout rails'
                : 'Host-country work-authorization pathways, KYC tiers & payout escrow',
            keywords: '2. unlock unlock compliance legal vault payout 2 tab 2 agreement kyc fatf ilo',
            ...builderBadge(2),
            icon: <Compass className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B]" />,
            onSelect: () => onNavigateTab('unlock'),
          },
          {
            id: 'nav-solve',
            group: 'Navigation',
            section: 'stages',
            label: 'Solve — Living Proof, Upskilling Bridges & Sprints',
            subtitle:
              isBuilderVerified && activeTab === 'solve' && viewMode === 'studio'
                ? 'Active stage · Matched work, UQP micro-bridges & mentor pods'
                : 'Close skill gaps with UQP/RPL bridges & join cross-age sprint pods',
            keywords: '3. solve solve sprints marketplace mentor pod 3 tab 3 briefs bridge upskilling',
            ...builderBadge(3),
            icon: <Wrench className="w-4 h-4 text-[#C4622D] dark:text-[#E07B46]" />,
            onSelect: () => onNavigateTab('solve'),
          },
          {
            id: 'nav-pulse',
            group: 'Navigation',
            section: 'stages',
            label: 'Pulse — Global Impact Telemetry & SDG Ledger',
            subtitle:
              isBuilderVerified && activeTab === 'pulse' && viewMode === 'studio'
                ? 'Active stage · D3 Global Impact Telemetry & UN 2030 SDG ledger'
                : 'Live UN 2030 SDG counters, D3 telemetry, stipends & Pulse Story',
            keywords: '4. pulse pulse impact sdg story sparkline ledger 4 tab 4 earnings telemetry d3',
            ...builderBadge(4),
            icon: <BarChart3 className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B]" />,
            onSelect: () => onNavigateTab('pulse'),
          },
          {
            id: 'nav-cleared',
            group: 'Navigation',
            section: 'stages',
            label: 'Cleared — Cleared for Your Future',
            subtitle:
              isBuilderVerified && activeTab === 'cleared' && viewMode === 'studio'
                ? 'Active stage · Durable pathways, safe mobility, scholarships & roadmap'
                : 'Durable pathways, safe mobility, scholarships & 3-year roadmap',
            keywords:
              '5. cleared cleared future horizon 5 tab 5 relocate mobility abroad scholarship study roots shirika roadmap dossier durable unhcr',
            ...builderBadge(5, hasCompletedCoreTabs),
            icon: <HorizonCompassStarIcon className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B]" />,
            onSelect: () => onNavigateTab('cleared'),
          },
        ]
      : [];

    const partnerTabActions: CommandPaletteAction[] = isPartnerConsoleActive
      ? [
          {
            id: 'partner-nav-sprints',
            group: 'Navigation',
            section: 'stages',
            label: '1. Sprints & Roles — Post & Manage Briefs',
            subtitle:
              activePartnerTab === 'sprints'
                ? 'Active tab · Manage active sprint briefs and cross-age pods'
                : 'Post paid solution sprints and track cross-age pod delivery',
            keywords: '1 sprints roles briefs post partner cohort tab 1',
            shortcut: 'Tab 1',
            badgeVariant: activePartnerTab === 'sprints' ? 'tab-emerald' : 'tab',
            isVerifiedStage: true,
            icon: <Briefcase className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B]" />,
            onSelect: () => onNavigatePartnerTab?.('sprints'),
          },
          {
            id: 'partner-nav-talent',
            group: 'Navigation',
            section: 'stages',
            label: '2. Consented Talent — Pre-Cleared Builders',
            subtitle:
              activePartnerTab === 'talent'
                ? 'Active tab · Review builders who granted explicit consent'
                : 'Inspect Living Passports shared under active consent grants',
            keywords: '2 consented talent builders passport grants partner tab 2',
            shortcut: 'Tab 2',
            badgeVariant: activePartnerTab === 'talent' ? 'tab-emerald' : 'tab',
            isVerifiedStage: true,
            icon: <Users className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B]" />,
            onSelect: () => onNavigatePartnerTab?.('talent'),
          },
          {
            id: 'partner-nav-compliance',
            group: 'Navigation',
            section: 'stages',
            label: '3. Compliance & Contracting — EOR & Escrow',
            subtitle:
              activePartnerTab === 'compliance'
                ? 'Active tab · 1-Page Employer Liability Shield & KYC rail readiness'
                : 'Issue compliant sprint contracts & lock milestone escrow',
            keywords: '3 compliance contracting eor kyc legal agreement shield tab 3',
            shortcut: 'Tab 3',
            badgeVariant: activePartnerTab === 'compliance' ? 'tab-emerald' : 'tab',
            isVerifiedStage: true,
            icon: <FileCheck2 className="w-4 h-4 text-[#C4622D] dark:text-[#E07B46]" />,
            onSelect: () => onNavigatePartnerTab?.('compliance'),
          },
          {
            id: 'partner-nav-impact',
            group: 'Navigation',
            section: 'stages',
            label: '4. Partner Impact — SDG & Stipend Telemetry',
            subtitle:
              activePartnerTab === 'impact'
                ? 'Active tab · Track SDGs 4, 8, 10, 16, 17 & disbursed stipends'
                : 'Audit partner SDG contributions, cohorts & stipend disbursements',
            keywords: '4 partner impact sdg telemetry stipends esg report tab 4',
            shortcut: 'Tab 4',
            badgeVariant: activePartnerTab === 'impact' ? 'tab-emerald' : 'tab',
            isVerifiedStage: true,
            icon: <ShieldCheck className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B]" />,
            onSelect: () => onNavigatePartnerTab?.('impact'),
          },
        ]
      : [];

    // Group 2 — Judge Guides & Reference (Always Open across ALL views)
    const openReferenceActions: CommandPaletteAction[] = [
      {
        id: 'action-judge-testing-guide-v2',
        group: 'Quick Actions',
        section: 'reference',
        label: 'Judge Testing & Evaluation Guide (v2)',
        subtitle: '2-min 5-stage walkthrough, QA checklist & scorecard',
        keywords:
          'judge judges test testing evaluation guide v2 pdf rubric scorecard walkthrough checklist cleared demo script download',
        shortcut: 'PDF · 3p',
        badgeVariant: 'pdf-emerald',
        isPublicReference: true,
        downloadHref: JUDGE_MASTER_GUIDE_V2_PDF.src,
        downloadFilename: JUDGE_MASTER_GUIDE_V2_PDF.filename,
        downloadAriaLabel: 'Download Judge Testing & Evaluation Guide (v2) PDF',
        icon: <ClipboardCheck className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B]" />,
        onSelect: () => {
          if (onOpenPdfPreview) {
            onOpenPdfPreview(JUDGE_MASTER_GUIDE_V2_PDF);
          } else {
            triggerPdfDownload(JUDGE_MASTER_GUIDE_V2_PDF);
          }
        },
      },
      {
        id: 'action-auth-security-guide',
        group: 'Quick Actions',
        section: 'reference',
        label: 'App Authentication & Security Guide',
        subtitle: '2FA OTP, No-Phone PIN, Search gates & portal isolation',
        keywords:
          'auth authentication security 2fa otp pin no phone isolation consent partner privacy pdf judge test suite download',
        shortcut: 'PDF · 2p',
        badgeVariant: 'pdf-slate',
        isPublicReference: true,
        downloadHref: AUTH_SECURITY_GUIDE_PDF.src,
        downloadFilename: AUTH_SECURITY_GUIDE_PDF.filename,
        downloadAriaLabel: 'Download App Authentication & Security Guide PDF',
        icon: <FileLock2 className="w-4 h-4 text-[#17191C] dark:text-[#CBD5E1]" />,
        onSelect: () => {
          if (onOpenPdfPreview) {
            onOpenPdfPreview(AUTH_SECURITY_GUIDE_PDF);
          } else {
            triggerPdfDownload(AUTH_SECURITY_GUIDE_PDF);
          }
        },
      },
      {
        id: 'action-glossary-reference',
        group: 'Quick Actions',
        section: 'reference',
        label: 'Glossary — SDGs, Legal & 5-Stage Terms',
        subtitle: 'Plain-language guide for Builders, Hiring Partners & Judges',
        keywords:
          'glossary terms dictionary sdg sdgs legal kyc eor rpl uqp ilo unhcr shirika help meaning define partner stages reference wcag universal design reasonable accommodation inclusive work setup',
        shortcut: 'Reference',
        badgeVariant: 'reference',
        isPublicReference: true,
        icon: <BookOpen className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B]" />,
        onSelect: onOpenGlossary,
      },
      {
        id: 'action-bibliography-sources',
        group: 'Quick Actions',
        section: 'reference',
        label: 'Bibliography — Source Docs & Frameworks',
        subtitle: 'Concept note, UN/ILO policies, KYC standards & research citations',
        keywords:
          'bibliography sources references citations docs documents research evidence concept note ilo unhcr unesco fatf knqa wes enic shirika roadmap sdg papers wcag w3c universal design crpd reasonable accommodation inclusive',
        shortcut: 'Sources',
        badgeVariant: 'sources',
        isPublicReference: true,
        icon: <Library className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B]" />,
        onSelect: onOpenBibliography,
      },
      ...(onOpenAccessComfort
        ? [
            {
              id: 'action-access-comfort',
              group: 'Quick Actions' as const,
              section: 'reference' as const,
              label: 'Access & Comfort — Text Size, Contrast & Read-Aloud',
              subtitle: 'WCAG 2.2 AA/AAA text scale, high contrast, Easy-Read & screen voice',
              keywords:
                'access accessibility comfort wcag coga text size font large extra large contrast high contrast aaa easy read calm focus reduced motion read aloud tts listen screen speech voice',
              shortcut: 'Access',
              badgeVariant: 'reference' as const,
              isPublicReference: true,
              icon: <SlidersHorizontal className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B]" />,
              onSelect: onOpenAccessComfort,
            },
          ]
        : []),
    ];

    const builderUtilityActions: CommandPaletteAction[] = canShowBuilderRoutes
      ? [
          {
            id: 'action-voice-to-text',
            group: 'Quick Actions',
            section: 'utilities',
            label: 'Voice-to-Text Capture',
            subtitle: 'Start hands-free skill dictation in Verify Studio',
            keywords: 'voice to text mic microphone dictate speech record audio verify',
            shortcut: 'V',
            icon: <Mic className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B]" />,
            onSelect: onTriggerVoiceToText,
          },
          {
            id: 'action-share-passport',
            group: 'Quick Actions',
            section: 'utilities',
            label: 'Share Living Competency Passport',
            subtitle: 'Generate a read-only verifiable passport link & QR code',
            keywords: 'share passport link qr export verify readonly credential',
            shortcut: 'S',
            icon: <Share2 className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B]" />,
            onSelect: onTriggerSharePassport,
          },
          {
            id: 'action-compliance-crossing',
            group: 'Quick Actions',
            section: 'utilities',
            label: 'Compliance Readiness: Crossing Over Access',
            subtitle: 'Open country-by-country legal & ILO rights pathway in Unlock',
            keywords: 'compliance ilo work permit refugee access crossing over unlock',
            icon: <Scale className="w-4 h-4 text-[#C4622D] dark:text-[#E07B46]" />,
            onSelect: onOpenComplianceCrossing,
          },
        ]
      : [];

    const sharedUtilityActions: CommandPaletteAction[] = [
      {
        id: 'action-scale-drawer',
        group: 'Quick Actions',
        section: 'utilities',
        label: 'Tripartite Partner & Scale Mode',
        subtitle: 'Preview AI Cohort Replication & Peer-Assessor Flywheel',
        keywords: 'partner scale cohort flywheel region ngo tripartite',
        icon: <Globe className="w-4 h-4 text-[#525866] dark:text-[#A3A7AE]" />,
        onSelect: onOpenScaleDrawer,
      },
      {
        id: 'action-toggle-theme',
        group: 'Quick Actions',
        section: 'utilities',
        label: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
        subtitle: 'Toggle Warm Alabaster light mode or Obsidian dark mode',
        keywords: 'theme dark light mode appearance',
        icon:
          theme === 'dark' ? (
            <Sun className="w-4 h-4 text-[#C4622D] dark:text-[#E07B46]" />
          ) : (
            <Moon className="w-4 h-4 text-[#525866] dark:text-[#A3A7AE]" />
          ),
        onSelect: onToggleTheme,
      },
      {
        id: 'nav-landing',
        group: 'Navigation',
        section: 'utilities',
        label:
          viewMode === 'studio'
            ? 'Home — Lock Session & Return to Landing Funnel'
            : 'Home — Crossing Over Landing Funnel',
        subtitle:
          viewMode === 'studio'
            ? 'Immediately locks & ends your active session and returns to the Landing Funnel'
            : 'Return to the Vuka na Amana overview & entry screen',
        keywords: 'home landing funnel welcome overview sign out logout lock exit',
        icon: <Home className="w-4 h-4 text-[#525866] dark:text-[#A3A7AE]" />,
        onSelect: onGoHome,
      },
      {
        id: 'faqs-how-it-works',
        group: 'FAQs & How It Works',
        section: 'utilities',
        label: 'FAQs & How Vuka na Amana Works',
        subtitle: 'Read the 5-stage Crossing Over guide & frequently asked questions',
        keywords:
          'faq faqs how works vuka amana help guide architecture explain questions crossing over',
        shortcut: '?',
        icon: <HelpCircle className="w-4 h-4 text-[#C4622D] dark:text-[#E07B46]" />,
        onSelect: () => {
          setActiveSubSection('faqs');
        },
      },
    ];

    return [
      ...builderTabActions,
      ...partnerTabActions,
      ...openReferenceActions,
      ...builderUtilityActions,
      ...sharedUtilityActions,
    ];
  }, [
    canShowBuilderRoutes,
    isPartnerConsoleActive,
    isBuilderVerified,
    activePartnerTab,
    hasCompletedCoreTabs,
    activeTab,
    viewMode,
    theme,
    onNavigateTab,
    onNavigatePartnerTab,
    onGoHome,
    onTriggerVoiceToText,
    onTriggerSharePassport,
    onOpenComplianceCrossing,
    onOpenScaleDrawer,
    onOpenGlossary,
    onOpenBibliography,
    onOpenAccessComfort,
    onOpenPdfPreview,
    onToggleTheme,
  ]);

  // Dynamic App-Wide Search Matches (Sprints, Glossary terms, Bibliography citations) — active when typing 2+ chars
  const appWideQueryMatches: CommandPaletteAction[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2 || activeSubSection === 'faqs') return [];

    const results: CommandPaletteAction[] = [];

    // 1. Solution Sprints & Briefs across the platform
    const matchedSprints = sprints
      .filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.domain.toLowerCase().includes(q) ||
          b.organization.toLowerCase().includes(q) ||
          b.summary.toLowerCase().includes(q) ||
          b.requiredKeywords.some((kw) => kw.toLowerCase().includes(q))
      )
      .slice(0, 3);

    for (const brief of matchedSprints) {
      results.push({
        id: `app-sprint-${brief.id}`,
        group: 'Navigation',
        section: 'app-wide',
        label: brief.title,
        subtitle: `${brief.organization} · ${brief.domain} · $${brief.payoutUsd} USD stipend`,
        keywords: `${brief.title} ${brief.domain} ${brief.organization} ${brief.requiredKeywords.join(' ')}`,
        shortcut: isPartnerConsoleActive ? 'Partner Sprint' : isBuilderVerified ? 'Sprint · Tab 3' : 'Tab 3 · 2FA/PIN',
        badgeVariant: isPartnerConsoleActive
          ? 'tab'
          : isBuilderVerified
            ? 'tab-verified'
            : 'tab-locked',
        isLockedStage: !isPartnerConsoleActive && !isBuilderVerified,
        icon: <Wrench className="w-4 h-4 text-[#C4622D] dark:text-[#E07B46]" />,
        onSelect: () => {
          if (isPartnerConsoleActive) {
            onNavigatePartnerTab?.('sprints');
          } else if (onSelectSprint) {
            onSelectSprint(brief.id);
          } else {
            onNavigateTab('solve');
          }
        },
      });
    }

    // 2. Glossary Definitions (open reference)
    const matchedGlossary = GLOSSARY_ENTRIES.filter(
      (g) =>
        g.term.toLowerCase().includes(q) ||
        g.definition.toLowerCase().includes(q) ||
        g.keywords.toLowerCase().includes(q)
    ).slice(0, 3);

    for (const entry of matchedGlossary) {
      results.push({
        id: `app-glossary-${entry.id}`,
        group: 'Quick Actions',
        section: 'app-wide',
        label: entry.term,
        subtitle: entry.definition,
        keywords: entry.keywords,
        shortcut: 'Glossary',
        badgeVariant: 'reference',
        isPublicReference: true,
        icon: <BookOpen className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B]" />,
        onSelect: onOpenGlossary,
      });
    }

    // 3. Bibliography Citations (open reference)
    const matchedBib = BIBLIOGRAPHY_SOURCES.filter(
      (src) =>
        !src.pdfDocument &&
        (src.title.toLowerCase().includes(q) ||
          src.institution.toLowerCase().includes(q) ||
          src.howItShapedApp.toLowerCase().includes(q) ||
          src.keywords.toLowerCase().includes(q))
    ).slice(0, 2);

    for (const src of matchedBib) {
      results.push({
        id: `app-bib-${src.id}`,
        group: 'Quick Actions',
        section: 'app-wide',
        label: src.title,
        subtitle: `${src.institution} · ${src.stageSdgTag}`,
        keywords: src.keywords,
        shortcut: 'Source',
        badgeVariant: 'sources',
        isPublicReference: true,
        icon: <Library className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B]" />,
        onSelect: onOpenBibliography,
      });
    }

    return results;
  }, [
    query,
    activeSubSection,
    sprints,
    isPartnerConsoleActive,
    isBuilderVerified,
    onNavigatePartnerTab,
    onSelectSprint,
    onNavigateTab,
    onOpenGlossary,
    onOpenBibliography,
  ]);

  const filteredActions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matchedBase = baseActions.filter((item) => {
      if (activeSubSection === 'navigation' && item.group !== 'Navigation') return false;
      if (activeSubSection === 'actions' && item.group !== 'Quick Actions') return false;
      if (activeSubSection === 'faqs' && item.group !== 'FAQs & How It Works') return false;
      // On empty query in 'all', keep primary 9 items (5 stages + 4 open reference) crisp & scannable,
      // followed cleanly by compact utilities below a hairline divider
      if (!q) return true;
      return (
        item.label.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.keywords.toLowerCase().includes(q) ||
        (item.shortcut?.toLowerCase().includes(q) ?? false)
      );
    });

    const matchedAppWide =
      activeSubSection === 'all' || activeSubSection === 'navigation' || activeSubSection === 'actions'
        ? appWideQueryMatches.filter((item) => {
            if (activeSubSection === 'navigation') return item.group === 'Navigation';
            if (activeSubSection === 'actions') return item.group === 'Quick Actions';
            return true;
          })
        : [];

    return [...matchedBase, ...matchedAppWide];
  }, [baseActions, appWideQueryMatches, query, activeSubSection]);

  const filteredFaqs = useMemo(() => {
    const q = query.trim().toLowerCase();
    const visibleFaqs = canShowBuilderRoutes
      ? VUKA_FAQS
      : VUKA_FAQS.filter((f) => f.relatedTab !== 'cleared' && f.relatedTab !== 'verify');
    if (!q) return visibleFaqs;
    return visibleFaqs.filter(
      (f) =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q) ||
        f.tag.toLowerCase().includes(q)
    );
  }, [query, canShowBuilderRoutes]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setActiveSubSection('all');
      setGoogleResult(null);
      setGoogleError(null);
      window.setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeIndex >= filteredActions.length) {
      setActiveIndex(0);
    }
  }, [filteredActions.length, activeIndex]);

  if (!isOpen) return null;

  const executeItem = (action: CommandPaletteAction | undefined) => {
    if (!action) return;
    if (action.id === 'faqs-how-it-works') {
      action.onSelect();
      return;
    }
    setQuery('');
    setActiveIndex(0);
    onClose();
    action.onSelect();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setQuery('');
      onClose();
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && query.trim().length >= 2) {
      e.preventDefault();
      void runGoogleSearch();
      return;
    }
    if (activeSubSection === 'faqs') return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredActions.length > 0) {
        setActiveIndex((prev) => (prev + 1) % filteredActions.length);
      }
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredActions.length > 0) {
        setActiveIndex((prev) => (prev - 1 + filteredActions.length) % filteredActions.length);
      }
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredActions.length > 0) {
        executeItem(filteredActions[activeIndex]);
      } else if (query.trim().length >= 2) {
        void runGoogleSearch();
      }
    }
  };

  const getBadgeClasses = (item: CommandPaletteAction) => {
    if (item.badgeVariant === 'tab-emerald' || item.badgeVariant === 'tab-verified') {
      return 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EAF4F0] dark:bg-[#163128] text-[11px] font-mono-tabular font-semibold text-[#146C53] dark:text-[#2EB88B]';
    }
    if (item.badgeVariant === 'tab-locked') {
      return 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F5F2EC] dark:bg-[#23262C] border border-[#E2DCD2] dark:border-[#323740] text-[11px] font-mono-tabular font-medium text-[#525866] dark:text-[#A3A7AE]';
    }
    if (item.badgeVariant === 'tab') {
      return 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F5F2EC] dark:bg-[#23262C] border border-[#E2DCD2] dark:border-[#323740] text-[11px] font-mono-tabular font-medium text-[#525866] dark:text-[#A3A7AE]';
    }
    if (item.badgeVariant === 'pdf-emerald') {
      return 'px-2.5 py-0.5 rounded-full bg-[#EAF4F0] dark:bg-[#163128] text-[11px] font-mono-tabular font-semibold text-[#146C53] dark:text-[#2EB88B]';
    }
    if (item.badgeVariant === 'pdf-slate') {
      return 'px-2.5 py-0.5 rounded-full bg-[#F5F2EC] dark:bg-[#23262C] border border-[#E2DCD2] dark:border-[#323740] text-[11px] font-mono-tabular font-semibold text-[#17191C] dark:text-[#CBD5E1]';
    }
    if (item.badgeVariant === 'reference' || item.badgeVariant === 'sources') {
      return 'px-2.5 py-0.5 rounded-full bg-[#EAF4F0] dark:bg-[#163128] text-[11px] font-mono-tabular font-semibold text-[#146C53] dark:text-[#2EB88B]';
    }
    return 'px-2 py-0.5 rounded border border-[#E2DCD2] dark:border-[#323740] bg-[#FAF8F5] dark:bg-[#121315] text-[10px] font-mono-tabular text-[#525866] dark:text-[#A3A7AE]';
  };

  const renderSectionDivider = (section: ActionSectionGroup, prevSection: ActionSectionGroup | null) => {
    if (section === prevSection) return null;

    if (section === 'stages') {
      return (
        <div
          key="hdr-stages"
          className="px-3 pt-1 pb-1.5 flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#525866] dark:text-[#A3A7AE]"
        >
          <span>{isPartnerConsoleActive ? 'Partner Console Tabs' : 'Crossing Stages'}</span>
          {!isPartnerConsoleActive && !isBuilderVerified && (
            <span className="normal-case tracking-normal font-normal text-[11px] text-[#525866] dark:text-[#A3A7AE]">
              Sign in with 2FA or Dedicated PIN to unlock
            </span>
          )}
        </div>
      );
    }

    if (section === 'reference') {
      return (
        <div
          key="hdr-reference"
          role="separator"
          data-testid="command-palette-reference-divider"
          className={`${prevSection ? 'mt-2.5 pt-2.5 border-t border-[#ECE7DF] dark:border-[#2C3037]' : 'pt-1'} px-3 pb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.08em] text-[#525866] dark:text-[#A3A7AE]`}
        >
          <span>GUIDES &amp; REFERENCE · OPEN ACCESS</span>
        </div>
      );
    }

    if (section === 'app-wide') {
      return (
        <div
          key="hdr-app-wide"
          role="separator"
          className={`${prevSection ? 'mt-2.5 pt-2.5 border-t border-[#ECE7DF] dark:border-[#2C3037]' : 'pt-1'} px-3 pb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.08em] text-[#525866] dark:text-[#A3A7AE]`}
        >
          <span>APP-WIDE MATCHES · SPRINTS, GLOSSARY &amp; SOURCES</span>
        </div>
      );
    }

    return (
      <div
        key="hdr-utilities"
        role="separator"
        className={`${prevSection ? 'mt-2.5 pt-2.5 border-t border-[#ECE7DF] dark:border-[#2C3037]' : 'pt-1'} px-3 pb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.08em] text-[#525866] dark:text-[#A3A7AE]`}
      >
        <span>WORKSPACE ACTIONS</span>
      </div>
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="App-wide search and command palette"
      data-testid="command-palette-modal"
      onKeyDown={handleKeyDown}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setQuery('');
          onClose();
        }
      }}
      className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-[6vh] sm:pt-[8vh] px-3 sm:px-4 pb-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.14, ease: 'easeOut' }}
        className="w-full max-w-2xl max-h-[72vh] flex flex-col rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E2DCD2] dark:border-[#2C3037] shadow-md overflow-hidden"
      >
        {/* Sticky Search Input Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-[#1A1C20] border-b border-[#ECE7DF] dark:border-[#2C3037]">
          <div className="px-4 py-3 flex items-center gap-3">
            <Search className="w-4 h-4 text-[#17191C] dark:text-[#F4F2EE] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              placeholder={
                canShowBuilderRoutes
                  ? 'Search stages, guides, glossary, sprints, or Google…'
                  : 'Search console tabs, guides, glossary, or Google…'
              }
              aria-label="App-wide search"
              data-testid="command-palette-input"
              className="flex-1 bg-transparent text-sm text-[#17191C] dark:text-[#F4F2EE] placeholder:text-[#525866] dark:placeholder:text-[#8E95A0] focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setActiveIndex(0);
                  inputRef.current?.focus();
                }}
                aria-label="Clear search query"
                className="px-2 py-1 rounded text-[11px] font-medium text-[#525866] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] cursor-pointer"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setQuery('');
                onClose();
              }}
              aria-label="Close search"
              className="min-h-[44px] min-w-[44px] rounded-lg border border-[#E2DCD2] dark:border-[#2C3037] text-[#525866] dark:text-[#A3A7AE] hover:border-[#146C53] dark:hover:border-[#2EB88B] hover:text-[#17191C] dark:hover:text-[#F4F2EE] inline-flex items-center justify-center cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Calm Sub-Section Filter Row */}
          <div
            className="px-4 py-2 bg-[#FAF8F5] dark:bg-[#141619] border-t border-[#ECE7DF] dark:border-[#2C3037] flex flex-wrap items-center gap-1.5"
            data-testid="command-palette-subsections"
          >
            <button
              type="button"
              onClick={() => {
                setActiveSubSection('all');
                setActiveIndex(0);
              }}
              data-testid="cmd-subsection-all"
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                activeSubSection === 'all'
                  ? 'bg-[#146C53] text-white'
                  : 'text-[#525866] dark:text-[#A3A7AE] hover:bg-white dark:hover:bg-[#1A1C20] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
              }`}
            >
              Jump to tab or run action
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveSubSection('navigation');
                setActiveIndex(0);
              }}
              data-testid="cmd-subsection-navigation"
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                activeSubSection === 'navigation'
                  ? 'bg-[#146C53] text-white'
                  : 'text-[#525866] dark:text-[#A3A7AE] hover:bg-white dark:hover:bg-[#1A1C20] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
              }`}
            >
              Jump to Tab
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveSubSection('actions');
                setActiveIndex(0);
              }}
              data-testid="cmd-subsection-actions"
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                activeSubSection === 'actions'
                  ? 'bg-[#146C53] text-white'
                  : 'text-[#525866] dark:text-[#A3A7AE] hover:bg-white dark:hover:bg-[#1A1C20] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
              }`}
            >
              Run Action
            </button>
            <button
              type="button"
              onClick={() => setActiveSubSection('faqs')}
              data-testid="cmd-subsection-faqs"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                activeSubSection === 'faqs'
                  ? 'bg-[#17191C] dark:bg-[#F4F2EE] text-white dark:text-[#121315]'
                  : 'text-[#525866] dark:text-[#A3A7AE] hover:bg-white dark:hover:bg-[#1A1C20] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              FAQs &amp; How It Works
            </button>
          </div>
        </div>

        {/* Bounded Scrollable Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3">
          {activeSubSection === 'faqs' ? (
            <div className="space-y-4 p-1" data-testid="command-palette-faqs-panel">
              <div className="rounded-xl border border-[#ECE7DF] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#141619] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#146C53] dark:text-[#2EB88B]">
                    How Vuka na Amana Works · 5-Stage Crossing
                  </span>
                  <span className="text-[11px] font-mono-tabular text-[#525866] dark:text-[#A3A7AE]">
                    SDGs 4, 8, 10, 16 &amp; 17
                  </span>
                </div>
                <p className="text-xs text-[#525866] dark:text-[#A3A7AE] leading-relaxed">
                  <strong className="text-[#17191C] dark:text-[#F4F2EE]">
                    Vuka na Amana (&ldquo;Crossing Over with Trust&rdquo;)
                  </strong>{' '}
                  moves displaced and host-community talent through 5 calm, verifiable stages—from paperless skill verification to legal readiness, paid solution sprints, live SDG impact telemetry, and durable future pathways.
                </p>
              </div>

              <div className="space-y-2.5">
                {filteredFaqs.map((faq) => (
                  <div
                    key={faq.id}
                    data-testid={`faq-card-${faq.id}`}
                    className="rounded-xl border border-[#ECE7DF] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] p-3.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                        {faq.question}
                      </span>
                      <span className="text-[10px] font-mono-tabular px-2 py-0.5 rounded-full bg-[#F5F2EC] dark:bg-[#23262C] text-[#525866] dark:text-[#A3A7AE]">
                        {faq.tag}
                      </span>
                    </div>
                    <p className="text-xs text-[#525866] dark:text-[#A3A7AE] leading-relaxed mb-2">
                      {faq.answer}
                    </p>
                    {canShowBuilderRoutes && (
                      <button
                        type="button"
                        onClick={() => {
                          setQuery('');
                          onClose();
                          onNavigateTab(faq.relatedTab);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#146C53] dark:text-[#2EB88B] hover:underline cursor-pointer"
                      >
                        {faq.relatedTabLabel} <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div role="listbox" aria-label="App-wide search results" className="space-y-0.5">
              {/* Clear, Scannable Uppercase Section Header with Quiet Right-Side Status Note */}
              <div
                data-testid="command-palette-section-header"
                className="px-3 pb-2 mb-1.5 border-b border-[#ECE7DF] dark:border-[#2C3037] flex items-center justify-between gap-2"
              >
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#525866] dark:text-[#A3A7AE]">
                  JUMP TO TAB OR RUN ACTION
                </span>
                <span
                  data-testid="command-palette-status-note"
                  className="text-[11px] font-medium text-[#525866] dark:text-[#A3A7AE] inline-flex items-center gap-1.5"
                >
                  {isBuilderVerified || isPartnerConsoleActive ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B]" />
                  ) : (
                    <Lock className="w-3 h-3 text-[#525866] dark:text-[#A3A7AE]" />
                  )}
                  <span>{statusNote}</span>
                </span>
              </div>

              {filteredActions.length === 0 ? (
                <div className="py-5 px-3 text-center text-xs text-[#525866] dark:text-[#A3A7AE] space-y-2">
                  <p>No local app tabs or references match &ldquo;{query}&rdquo;.</p>
                  <p className="text-[11px]">
                    Use live Google Search below to fetch verified web details for this topic.
                  </p>
                </div>
              ) : (
                filteredActions.map((item, idx) => {
                  const selected = idx === activeIndex;
                  const prevSection = idx > 0 ? filteredActions[idx - 1].section : null;

                  return (
                    <React.Fragment key={item.id}>
                      {renderSectionDivider(item.section, prevSection)}
                      <div
                        role="option"
                        aria-selected={selected}
                        tabIndex={0}
                        data-testid={`command-item-${item.id}`}
                        data-auth-locked={item.isLockedStage ? 'true' : 'false'}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => executeItem(item)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            executeItem(item);
                          }
                        }}
                        className={`w-full py-2.5 px-3 rounded-lg text-start flex items-center justify-between gap-3 transition-colors cursor-pointer border-l-2 focus:outline-none ${
                          selected
                            ? 'bg-[#F5F2EC] dark:bg-[#23262B] border-l-[#146C53] dark:border-l-[#2EB88B]'
                            : 'bg-transparent border-l-transparent hover:bg-[#F5F2EC] dark:hover:bg-[#23262B] hover:border-l-[#146C53] dark:hover:border-l-[#2EB88B]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg border border-[#ECE7DF] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#141619] flex items-center justify-center shrink-0">
                            {item.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[13px] font-semibold text-[#17191C] dark:text-[#F4F2EE] truncate">
                                {item.label}
                              </span>
                              {item.isLockedStage && (
                                <Lock
                                  aria-label="Requires 2FA or Dedicated PIN"
                                  className="w-3 h-3 text-[#525866] dark:text-[#8E95A0] shrink-0"
                                />
                              )}
                            </div>
                            <p className="text-xs text-[#525866] dark:text-[#A3A7AE] truncate">
                              {item.subtitle}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.shortcut && (
                            <kbd className={getBadgeClasses(item)}>
                              {item.isLockedStage && (
                                <Lock className="w-2.5 h-2.5 text-[#525866] dark:text-[#A3A7AE] shrink-0" />
                              )}
                              {item.isVerifiedStage && canShowBuilderRoutes && (
                                <Check className="w-2.5 h-2.5 text-[#146C53] dark:text-[#2EB88B] shrink-0" />
                              )}
                              <span>{item.shortcut}</span>
                            </kbd>
                          )}
                          {item.downloadHref && item.downloadFilename && (
                            <a
                              href={item.downloadHref}
                              download={item.downloadFilename}
                              onClick={(e) => e.stopPropagation()}
                              aria-label={item.downloadAriaLabel ?? `Download ${item.label}`}
                              title="Download PDF"
                              data-testid={`quick-download-${item.id}`}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#E2DCD2] dark:border-[#323740] bg-white dark:bg-[#1A1C20] text-[#525866] dark:text-[#A3A7AE] hover:border-[#146C53] dark:hover:border-[#2EB88B] hover:text-[#146C53] dark:hover:text-[#2EB88B] transition-colors shrink-0"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}

              {/* Live Google Search Grounding Panel (Cleanly appears when typing 2+ characters) */}
              {query.trim().length >= 2 && (
                <div
                  data-testid="google-search-grounding-section"
                  className="mt-3 pt-3 border-t border-[#ECE7DF] dark:border-[#2C3037] space-y-2.5"
                >
                  <div className="px-3 flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#525866] dark:text-[#A3A7AE]">
                    <span className="inline-flex items-center gap-1.5">
                      <MonochromeGoogleMark className="w-3.5 h-3.5 text-[#17191C] dark:text-[#F4F2EE]" />
                      <span>GOOGLE SEARCH · LIVE WEB DETAILS</span>
                    </span>
                    <span className="font-mono-tabular normal-case tracking-normal font-normal">
                      ⌘↵ to search
                    </span>
                  </div>

                  <div className="mx-1 rounded-xl border border-[#E2DCD2] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#141619] p-3 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] truncate">
                          Search Google for &ldquo;{query.trim()}&rdquo;
                        </p>
                        <p className="text-[11px] text-[#525866] dark:text-[#A3A7AE]">
                          Retrieves verified functional details and live web citations via Google Search.
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={googleLoading}
                        onClick={() => void runGoogleSearch()}
                        data-testid="run-google-search-btn"
                        className="min-h-[34px] px-3 py-1.5 rounded-lg border border-[#146C53] dark:border-[#2EB88B] bg-[#146C53] dark:bg-[#2EB88B] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60 shrink-0"
                      >
                        {googleLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Searching…</span>
                          </>
                        ) : (
                          <>
                            <Search className="w-3.5 h-3.5" />
                            <span>Search Google</span>
                          </>
                        )}
                      </button>
                    </div>

                    {googleError && (
                      <p
                        role="alert"
                        data-testid="google-search-error"
                        className="text-xs text-[#9A3412] dark:text-[#F59E6C] border-t border-[#ECE7DF] dark:border-[#2C3037] pt-2.5"
                      >
                        {googleError}
                      </p>
                    )}

                    {googleResult && (
                      <div
                        data-testid="google-search-result-card"
                        className="rounded-lg bg-white dark:bg-[#1A1C20] border border-[#E2DCD2] dark:border-[#2C3037] p-3 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2 text-[11px] text-[#525866] dark:text-[#A3A7AE]">
                          <span className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                            Google Grounded Summary · &ldquo;{googleResult.query}&rdquo;
                          </span>
                          <span className="font-mono-tabular">
                            {googleResult.sources.length} source{googleResult.sources.length === 1 ? '' : 's'}
                          </span>
                        </div>

                        {googleResult.summary && (
                          <p className="text-xs leading-relaxed text-[#17191C] dark:text-[#E5E7EB] whitespace-pre-line">
                            {googleResult.summary}
                          </p>
                        )}

                        {googleResult.sources.length > 0 && (
                          <div className="pt-2 border-t border-[#ECE7DF] dark:border-[#2C3037] space-y-1.5">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#525866] dark:text-[#A3A7AE]">
                              Verified Web Citations
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {googleResult.sources.map((src) => (
                                <a
                                  key={src.uri}
                                  href={src.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#E2DCD2] dark:border-[#323740] bg-[#FAF8F5] dark:bg-[#141619] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-[11px] font-medium text-[#146C53] dark:text-[#2EB88B] transition-colors max-w-full"
                                >
                                  <span className="truncate max-w-[210px]">{src.title}</span>
                                  <ExternalLink className="w-3 h-3 shrink-0" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {googleResult.searchQueries.length > 0 && (
                          <div className="pt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-[#525866] dark:text-[#A3A7AE]">
                            <span className="font-medium">Related queries:</span>
                            {googleResult.searchQueries.map((sq) => (
                              <button
                                key={sq}
                                type="button"
                                onClick={() => {
                                  setQuery(sq);
                                  void runGoogleSearch(sq);
                                }}
                                className="px-2 py-0.5 rounded border border-[#ECE7DF] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#141619] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-[#525866] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] cursor-pointer"
                              >
                                {sq}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quiet 1-Line Footer Hint */}
        <div className="px-4 py-2 bg-[#FAF8F5] dark:bg-[#141619] border-t border-[#ECE7DF] dark:border-[#2C3037] flex items-center justify-between text-[11px] text-[#525866] dark:text-[#A3A7AE]">
          <span>↑↓ Navigate · Enter Open · Esc Close</span>
          <span className="font-mono-tabular">/ or ⌘K</span>
        </div>
      </motion.div>
    </div>
  );
};
