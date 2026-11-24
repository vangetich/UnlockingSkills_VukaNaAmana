import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Compass,
  Globe,
  HelpCircle,
  Home,
  Mic,
  Moon,
  Scale,
  Search,
  Share2,
  Sparkles,
  Sun,
  Wrench,
  X,
} from 'lucide-react';
import type { ThemeMode, WorkspaceTab } from '../types/kora';

export type CommandSubSection = 'all' | 'navigation' | 'actions' | 'faqs';

export interface CommandPaletteAction {
  id: string;
  group: 'Navigation' | 'Quick Actions' | 'FAQs & How It Works';
  label: string;
  subtitle: string;
  keywords: string;
  shortcut?: string;
  icon: React.ReactNode;
  onSelect: () => void;
}

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
];

interface CommandPaletteProps {
  isOpen: boolean;
  activeTab: WorkspaceTab;
  theme: ThemeMode;
  onClose: () => void;
  onNavigateTab: (tab: WorkspaceTab) => void;
  onGoHome: () => void;
  onTriggerVoiceToText: () => void;
  onTriggerSharePassport: () => void;
  onOpenComplianceCrossing: () => void;
  onOpenScaleDrawer: () => void;
  onToggleTheme: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  activeTab,
  theme,
  onClose,
  onNavigateTab,
  onGoHome,
  onTriggerVoiceToText,
  onTriggerSharePassport,
  onOpenComplianceCrossing,
  onOpenScaleDrawer,
  onToggleTheme,
}) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeSubSection, setActiveSubSection] = useState<CommandSubSection>('all');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const actions: CommandPaletteAction[] = useMemo(
    () => [
      {
        id: 'nav-verify',
        group: 'Navigation',
        label: 'Verify — Proof Studio & Competency Passport',
        subtitle:
          activeTab === 'verify'
            ? 'Currently active · Voice/text verification & peer endorsements'
            : 'Jump to Tab 1 · Turn work history into a Living Competency Passport',
        keywords: 'verify passport skills tab 1 proof studio endorsement',
        shortcut: '1',
        icon: <CheckCircle2 className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B]" />,
        onSelect: () => onNavigateTab('verify'),
      },
      {
        id: 'nav-unlock',
        group: 'Navigation',
        label: 'Unlock — Readiness, Compliance & Access',
        subtitle:
          activeTab === 'unlock'
            ? 'Currently active · Work-Ready Vault, Compliance & Payout rails'
            : 'Jump to Tab 2 · Work-authorization pathways & payout escrow',
        keywords: 'unlock compliance legal vault payout tab 2 agreement',
        shortcut: '2',
        icon: <Compass className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B]" />,
        onSelect: () => onNavigateTab('unlock'),
      },
      {
        id: 'nav-solve',
        group: 'Navigation',
        label: 'Solve — Living Proof, Upskilling Bridges & Sprints',
        subtitle:
          activeTab === 'solve'
            ? 'Currently active · Matched work, UQP micro-bridges & mentor pods'
            : 'Jump to Tab 3 · Close skill gaps & join cross-age sprint pods',
        keywords: 'solve sprints marketplace mentor pod tab 3 briefs bridge upskilling',
        shortcut: '3',
        icon: <Wrench className="w-4 h-4 text-[#C4622D] dark:text-[#E07B46]" />,
        onSelect: () => onNavigateTab('solve'),
      },
      {
        id: 'nav-pulse',
        group: 'Navigation',
        label: 'Pulse — SDG & Community Impact Pulse',
        subtitle:
          activeTab === 'pulse'
            ? 'Currently active · UN 2030 Agenda SDGs 4, 8, 10, 16 & 17 live ledger'
            : 'Jump to Tab 4 · View live UN 2030 SDG momentum & Pulse Story',
        keywords: 'pulse impact sdg story sparkline ledger tab 4 earnings',
        shortcut: '4',
        icon: <BarChart3 className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B]" />,
        onSelect: () => onNavigateTab('pulse'),
      },
      {
        id: 'action-voice-to-text',
        group: 'Quick Actions',
        label: 'Voice-to-Text',
        subtitle: 'Start or focus hands-free Voice-to-Text capture in Verify Studio',
        keywords: 'voice to text mic microphone dictate speech record audio',
        shortcut: 'V',
        icon: <Mic className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B]" />,
        onSelect: onTriggerVoiceToText,
      },
      {
        id: 'action-share-passport',
        group: 'Quick Actions',
        label: 'Share Passport',
        subtitle: 'Generate a secure, read-only Living Competency Passport link & QR code',
        keywords: 'share passport link qr export verify readonly credential',
        shortcut: 'S',
        icon: <Share2 className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B]" />,
        onSelect: onTriggerSharePassport,
      },
      {
        id: 'action-compliance-crossing',
        group: 'Quick Actions',
        label: 'Compliance Readiness: Crossing Over Access',
        subtitle: 'Open country-by-country legal & ILO rights pathway in Unlock',
        keywords: 'compliance ilo work permit refugee access crossing over unlock',
        icon: <Scale className="w-4 h-4 text-[#C4622D] dark:text-[#E07B46]" />,
        onSelect: onOpenComplianceCrossing,
      },
      {
        id: 'action-scale-drawer',
        group: 'Quick Actions',
        label: 'Tripartite Partner & Scale Mode',
        subtitle: 'Preview AI Cohort Replication or inspect Peer-Assessor Flywheel',
        keywords: 'partner scale cohort flywheel region ngo tripartite',
        icon: <Globe className="w-4 h-4 text-[#575B62] dark:text-[#A3A7AE]" />,
        onSelect: onOpenScaleDrawer,
      },
      {
        id: 'action-toggle-theme',
        group: 'Quick Actions',
        label: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
        subtitle: 'Toggle warm sand paper light mode or obsidian dark workspace',
        keywords: 'theme dark light mode appearance',
        icon:
          theme === 'dark' ? (
            <Sun className="w-4 h-4 text-[#C4622D] dark:text-[#E07B46]" />
          ) : (
            <Moon className="w-4 h-4 text-[#575B62] dark:text-[#A3A7AE]" />
          ),
        onSelect: onToggleTheme,
      },
      {
        id: 'nav-landing',
        group: 'Navigation',
        label: 'Home — Crossing Over Landing Funnel',
        subtitle: 'Return to the Vuka na Amana editorial overview & entry screen',
        keywords: 'home landing funnel welcome overview',
        icon: <Home className="w-4 h-4 text-[#575B62] dark:text-[#A3A7AE]" />,
        onSelect: onGoHome,
      },
      {
        id: 'faqs-how-it-works',
        group: 'FAQs & How It Works',
        label: 'FAQs & How the Vuka na Amana App Works',
        subtitle:
          'Explore the 4-Tab Crossing Over architecture (Verify → Unlock → Solve → Pulse) & key answers',
        keywords:
          'faq faqs how works vuka amana help guide architecture explain questions crossing over',
        shortcut: '?',
        icon: <HelpCircle className="w-4 h-4 text-[#C4622D] dark:text-[#E07B46]" />,
        onSelect: () => {
          setActiveSubSection('faqs');
        },
      },
    ],
    [
      activeTab,
      theme,
      onNavigateTab,
      onGoHome,
      onTriggerVoiceToText,
      onTriggerSharePassport,
      onOpenComplianceCrossing,
      onOpenScaleDrawer,
      onToggleTheme,
    ]
  );

  const filteredActions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return actions.filter((item) => {
      if (activeSubSection === 'navigation' && item.group !== 'Navigation') return false;
      if (activeSubSection === 'actions' && item.group !== 'Quick Actions') return false;
      if (activeSubSection === 'faqs' && item.group !== 'FAQs & How It Works') return false;
      if (!q) return true;
      return (
        item.label.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.keywords.toLowerCase().includes(q)
      );
    });
  }, [actions, query, activeSubSection]);

  const filteredFaqs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return VUKA_FAQS;
    return VUKA_FAQS.filter(
      (f) =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q) ||
        f.tag.toLowerCase().includes(q)
    );
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setActiveSubSection('all');
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
    onClose();
    action.onSelect();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
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
      executeItem(filteredActions[activeIndex]);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Quick-search command palette"
      data-testid="command-palette-modal"
      onKeyDown={handleKeyDown}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-start justify-center pt-[10vh] px-4 pb-6 overflow-y-auto"
    >
      <div className="w-full max-w-2xl rounded-2xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] shadow-2xl overflow-hidden">
        {/* Search Input Header */}
        <div className="px-4 py-3.5 bg-white dark:bg-[#1A1C20] border-b border-[#E8E3DB] dark:border-[#2C3037] flex items-center gap-3">
          <Search className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="Jump to tab or run action (Verify, Unlock, Solve, Pulse, Voice-to-Text, Share Passport, FAQs)..."
            aria-label="Search commands"
            data-testid="command-palette-input"
            className="flex-1 bg-transparent text-sm text-[#17191C] dark:text-[#F4F2EE] placeholder:text-[#8A847A] dark:placeholder:text-[#787268] focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close command palette"
            className="min-h-[30px] min-w-[30px] rounded-lg text-[#575B62] dark:text-[#A3A7AE] hover:bg-[#F2EEE8] dark:hover:bg-[#22252A] inline-flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-Sections Bar: All | Jump to Tab | Run Action | FAQs & How the Vuka na Amana App Works */}
        <div
          className="px-4 py-2.5 bg-[#F3EFEA]/85 dark:bg-[#16181C] border-b border-[#E8E3DB] dark:border-[#2C3037] flex flex-wrap items-center gap-1.5"
          data-testid="command-palette-subsections"
        >
          <button
            type="button"
            onClick={() => setActiveSubSection('all')}
            data-testid="cmd-subsection-all"
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              activeSubSection === 'all'
                ? 'bg-[#146C53] text-white'
                : 'text-[#575B62] dark:text-[#A3A7AE] hover:bg-white dark:hover:bg-[#1A1C20]'
            }`}
          >
            All Commands
          </button>
          <button
            type="button"
            onClick={() => setActiveSubSection('navigation')}
            data-testid="cmd-subsection-navigation"
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              activeSubSection === 'navigation'
                ? 'bg-[#146C53] text-white'
                : 'text-[#575B62] dark:text-[#A3A7AE] hover:bg-white dark:hover:bg-[#1A1C20]'
            }`}
          >
            Jump to Tab
          </button>
          <button
            type="button"
            onClick={() => setActiveSubSection('actions')}
            data-testid="cmd-subsection-actions"
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              activeSubSection === 'actions'
                ? 'bg-[#146C53] text-white'
                : 'text-[#575B62] dark:text-[#A3A7AE] hover:bg-white dark:hover:bg-[#1A1C20]'
            }`}
          >
            Run Action
          </button>
          <button
            type="button"
            onClick={() => setActiveSubSection('faqs')}
            data-testid="cmd-subsection-faqs"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              activeSubSection === 'faqs'
                ? 'bg-[#C4622D] text-white shadow-xs'
                : 'bg-[#FFF3EC] dark:bg-[#2E1E16] text-[#C4622D] dark:text-[#E88D5D] border border-[#C4622D]/25 hover:bg-[#C4622D]/15'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            FAQs & How Vuka na Amana Works
          </button>
        </div>

        {/* Either FAQs & How Vuka na Amana Works View or Standard Command List */}
        {activeSubSection === 'faqs' ? (
          <div
            className="max-h-[62vh] overflow-y-auto p-4 sm:p-5 space-y-5"
            data-testid="command-palette-faqs-panel"
          >
            {/* How the Vuka na Amana App Works — 4-Step Crossing Over Flow */}
            <div className="rounded-xl border border-[#146C53]/25 dark:border-[#2EB88B]/25 bg-white dark:bg-[#1A1C20] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#146C53] dark:text-[#2EB88B]">
                  <BookOpen className="w-3.5 h-3.5" />
                  How the Vuka na Amana App Works · 4-Tab Crossing Over Flow
                </span>
                <span className="text-[10px] font-mono-tabular text-[#575B62] dark:text-[#A3A7AE]">
                  SDGs 4, 8, 10, 16 & 17
                </span>
              </div>
              <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] leading-relaxed mb-3.5">
                <strong className="text-[#17191C] dark:text-[#F4F2EE]">
                  Vuka na Amana (&ldquo;Crossing Over with Trust&rdquo;)
                </strong>{' '}
                replaces lost paper diplomas and legal bottlenecks with a 4-stage pipeline that moves displaced and host-community talent from practical skill verification to compliant paid work:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-[#146C53] dark:text-[#2EB88B]">
                        1. Verify (Proof Studio)
                      </span>
                      <span className="text-[10px] font-mono-tabular px-1.5 py-0.5 rounded bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B]">
                        SDG 4 · UQP
                      </span>
                    </div>
                    <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                      Demonstrate real craft via Voice-to-Text or a 2-minute practical scenario to generate a QR-verifiable Living Competency Passport.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateTab('verify');
                    }}
                    className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#146C53] dark:text-[#2EB88B] hover:underline"
                  >
                    Jump to 1. Verify <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-[#C4622D] dark:text-[#E07B46]">
                        2. Unlock (Compliance & KYC)
                      </span>
                      <span className="text-[10px] font-mono-tabular px-1.5 py-0.5 rounded bg-[#FFF3EC] dark:bg-[#2E1E16] text-[#C4622D] dark:text-[#E07B46]">
                        SDG 16 · FATF
                      </span>
                    </div>
                    <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                      Map host-country work rights, clear FATF Tiered KYC payout rails, and generate a 1-Page Employer Liability Shield pack.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateTab('unlock');
                    }}
                    className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#C4622D] dark:text-[#E07B46] hover:underline"
                  >
                    Jump to 2. Unlock <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-[#146C53] dark:text-[#2EB88B]">
                        3. Solve (Proof & Sprints)
                      </span>
                      <span className="text-[10px] font-mono-tabular px-1.5 py-0.5 rounded bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B]">
                        SDGs 8 & 10
                      </span>
                    </div>
                    <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                      Upload visual proof of craft, close 65%–90% job gaps with UQP/RPL micro-bridges, and co-deliver paid sprints with Senior Specialist mentors.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateTab('solve');
                    }}
                    className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#146C53] dark:text-[#2EB88B] hover:underline"
                  >
                    Jump to 3. Solve <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] p-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-[#C4622D] dark:text-[#E07B46]">
                        4. Pulse (SDG Impact Ledger)
                      </span>
                      <span className="text-[10px] font-mono-tabular px-1.5 py-0.5 rounded bg-[#FFF3EC] dark:bg-[#2E1E16] text-[#C4622D] dark:text-[#E07B46]">
                        SDG 17 · UN 2030
                      </span>
                    </div>
                    <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                      Audit live reactive counters across SDGs 4, 8, 10, 16 & 17, payout sparklines, Hiring Partner star feedback, and Tripartite Cohort Scale.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateTab('pulse');
                    }}
                    className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#C4622D] dark:text-[#E07B46] hover:underline"
                  >
                    Jump to 4. Pulse <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Frequently Asked Questions */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#575B62] dark:text-[#A3A7AE] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C4622D]" />
                Frequently Asked Questions ({filteredFaqs.length})
              </h4>

              {filteredFaqs.map((faq) => (
                <div
                  key={faq.id}
                  data-testid={`faq-card-${faq.id}`}
                  className="rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] p-3.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-[#17191C] dark:text-[#F4F2EE] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B] shrink-0" />
                      {faq.question}
                    </span>
                    <span className="text-[10px] font-mono-tabular px-2 py-0.5 rounded-full bg-[#F3EFEA] dark:bg-[#23262B] text-[#575B62] dark:text-[#A3A7AE]">
                      {faq.tag}
                    </span>
                  </div>
                  <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] leading-relaxed mb-2.5">
                    {faq.answer}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateTab(faq.relatedTab);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#146C53] dark:text-[#2EB88B] hover:underline"
                  >
                    {faq.relatedTabLabel} <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Results List */
          <div className="max-h-[56vh] overflow-y-auto p-2 space-y-1">
            {filteredActions.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#575B62] dark:text-[#A3A7AE] space-y-2">
                <p>No matching tabs or quick actions found for &ldquo;{query}&rdquo;.</p>
                <button
                  type="button"
                  onClick={() => setActiveSubSection('faqs')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFF3EC] dark:bg-[#2E1E16] text-[#C4622D] dark:text-[#E88D5D] text-xs font-semibold"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Browse FAQs & How Vuka na Amana Works
                </button>
              </div>
            ) : (
              filteredActions.map((item, idx) => {
                const selected = idx === activeIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-testid={`command-item-${item.id}`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => executeItem(item)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-start flex items-center justify-between gap-3 transition-colors ${
                      selected
                        ? 'bg-[#E7F3EE] dark:bg-[#142B24] text-[#17191C] dark:text-[#F4F2EE]'
                        : 'hover:bg-white dark:hover:bg-[#1A1C20] text-[#17191C] dark:text-[#F4F2EE]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] flex items-center justify-center shrink-0">
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold truncate">{item.label}</span>
                          <span className="text-[10px] font-medium uppercase tracking-wider text-[#575B62] dark:text-[#A3A7AE] shrink-0">
                            {item.group}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE] truncate">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.shortcut && (
                        <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] text-[10px] font-mono-tabular text-[#575B62] dark:text-[#A3A7AE]">
                          {item.shortcut}
                        </kbd>
                      )}
                      <ArrowRight className="w-3.5 h-3.5 text-[#575B62] dark:text-[#A3A7AE]" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Keyboard Hint Footer */}
        <div className="px-4 py-2 bg-white dark:bg-[#1A1C20] border-t border-[#E8E3DB] dark:border-[#2C3037] flex items-center justify-between text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
          <span>↑↓ Navigate · Enter to execute · Esc to close</span>
          <span className="font-mono-tabular">Cmd/Ctrl + K</span>
        </div>
      </div>
    </div>
  );
};

