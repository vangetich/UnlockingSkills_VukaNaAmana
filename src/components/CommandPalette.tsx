import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Compass,
  Globe,
  Home,
  Mic,
  Moon,
  Scale,
  Search,
  Share2,
  Sun,
  Wrench,
  X,
} from 'lucide-react';
import type { ThemeMode, WorkspaceTab } from '../types/kora';

export interface CommandPaletteAction {
  id: string;
  group: 'Navigation' | 'Quick Actions';
  label: string;
  subtitle: string;
  keywords: string;
  shortcut?: string;
  icon: React.ReactNode;
  onSelect: () => void;
}

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
        label: 'Solve — Solution-Flow Marketplace',
        subtitle:
          activeTab === 'solve'
            ? 'Currently active · Paid 1–2 week sprints & mentor pods'
            : 'Jump to Tab 3 · Join cross-age sprint pods & submit deliverables',
        keywords: 'solve sprints marketplace mentor pod tab 3 briefs',
        shortcut: '3',
        icon: <Wrench className="w-4 h-4 text-[#C4622D] dark:text-[#E07B46]" />,
        onSelect: () => onNavigateTab('solve'),
      },
      {
        id: 'nav-pulse',
        group: 'Navigation',
        label: 'Pulse — SDG Impact & Earnings Ledger',
        subtitle:
          activeTab === 'pulse'
            ? 'Currently active · Live SDG cards, Pulse Story & Sprint Performance'
            : 'Jump to Tab 4 · View live SDG momentum & Pulse Story',
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
        subtitle: 'Generate a secure, read-only Living Competency Passport link',
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
        label: 'Partner & Scale Mode',
        subtitle: 'Launch new country cohort or inspect Peer-Assessor Flywheel',
        keywords: 'partner scale cohort flywheel region ngo',
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
    if (!q) return actions;
    return actions.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.keywords.toLowerCase().includes(q)
    );
  }, [actions, query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
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
    onClose();
    action.onSelect();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
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
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-start justify-center pt-[12vh] px-4 pb-6 overflow-y-auto"
    >
      <div className="w-full max-w-xl rounded-2xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] shadow-2xl overflow-hidden">
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
            placeholder="Jump to tab or run action (Verify, Unlock, Solve, Pulse, Voice-to-Text, Share Passport)..."
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

        {/* Results List */}
        <div className="max-h-[56vh] overflow-y-auto p-2 space-y-1">
          {filteredActions.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#575B62] dark:text-[#A3A7AE]">
              No matching tabs or quick actions found for “{query}”.
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

        {/* Keyboard Hint Footer */}
        <div className="px-4 py-2 bg-white dark:bg-[#1A1C20] border-t border-[#E8E3DB] dark:border-[#2C3037] flex items-center justify-between text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
          <span>↑↓ Navigate · Enter to execute · Esc to close</span>
          <span className="font-mono-tabular">Cmd/Ctrl + K</span>
        </div>
      </div>
    </div>
  );
};
