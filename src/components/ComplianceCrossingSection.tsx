import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  FileCheck2,
  Globe,
  HelpCircle,
  Landmark,
  Loader2,
  Scale,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wallet,
} from 'lucide-react';
import type {
  CompetencyPassport,
  ComplianceCrossingRoute,
  ContractingStructureOption,
  FinancialPayoutRail,
  IdentityDocumentTier,
  PractitionerProfile,
  RegulatoryAccessTier,
  SkillCapability,
  TargetWorkMode,
  UnlockViewMode,
  WorkReadyVault,
} from '../types/kora';
import {
  COMPLIANCE_COUNTRY_PRESETS,
  CONTRACTING_STRUCTURES,
  CUSTOM_COUNTRY_SENTINEL,
  FATF_TIERED_KYC_BRIDGE,
  FINANCIAL_PAYOUT_RAILS,
  FINANCIAL_READINESS_CHECKLIST_ITEMS,
  IDENTITY_DOCUMENT_TIERS,
  TARGET_WORK_MODES,
  computeFinancialCrossingProgress,
  computeVaultReadiness,
  enforceUnderFifteenWords,
  getContractingStructureMeta,
  getFinancialPayoutRailLabel,
  getMatchedFatfKycTier,
  getPreseededComplianceRoute,
} from '../utils/talentEngine';
import { UnbrokenMeridianCompassMotif } from './ResilienceMotifs';
import { OnboardingPackModal } from './OnboardingPackModal';

interface ComplianceCrossingSectionProps {
  viewMode: UnlockViewMode;
  onChangeViewMode: (mode: UnlockViewMode) => void;
  vault: WorkReadyVault;
  onUpdateVault: (next: WorkReadyVault) => void;
  primaryDomain?: string;
  profile?: PractitionerProfile;
  capabilities?: SkillCapability[];
  passport?: CompetencyPassport | null;
  defaultSprintTitle?: string;
  defaultPayoutUsd?: number;
  onStartTour?: () => void;
}

const TIER_STYLES: Record<
  RegulatoryAccessTier,
  { badgeClass: string; dotClass: string; caption: string }
> = {
  Enabling: {
    badgeClass:
      'bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B] border border-[#146C53]/30 dark:border-[#2EB88B]/35',
    dotClass: 'bg-[#146C53] dark:bg-[#2EB88B]',
    caption: 'Direct statutory or open contracting route available.',
  },
  'Mixed — Friction Guided': {
    badgeClass:
      'bg-[#FEF3C7] dark:bg-[#2D220F] text-[#9A5B13] dark:text-[#F5B971] border border-[#C4622D]/30 dark:border-[#E07B46]/35',
    dotClass: 'bg-[#C4622D] dark:bg-[#E07B46]',
    caption: 'Permitted with structured documentation or employer filing.',
  },
  'Restricted — Remote/EOR Route Active': {
    badgeClass:
      'bg-[#F9ECE5] dark:bg-[#2D1E17] text-[#B45309] dark:text-[#F0A47A] border border-[#C4622D]/35 dark:border-[#E07B46]/40',
    dotClass: 'bg-[#C4622D] dark:bg-[#E07B46]',
    caption: 'Local restrictions bypassed lawfully via accredited Remote / EOR bridge.',
  },
};

export const ComplianceCrossingSection: React.FC<ComplianceCrossingSectionProps> = ({
  viewMode,
  onChangeViewMode,
  vault,
  onUpdateVault,
  primaryDomain = 'Green Energy',
  profile,
  capabilities = [],
  passport = null,
  defaultSprintTitle = '48V Cold-Storage & Solar Microgrid Diagnostics Sprint',
  defaultPayoutUsd = 480,
  onStartTour,
}) => {
  const [selectedCountry, setSelectedCountry] = useState<string>(
    vault.onboardingHostCountry || 'Kenya'
  );
  const [isCustomCountryMode, setIsCustomCountryMode] = useState(false);
  const [customCountryInput, setCustomCountryInput] = useState('');
  const [countryQuery, setCountryQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [docTier, setDocTier] = useState<IdentityDocumentTier>('refugee-id');
  const [workMode, setWorkMode] = useState<TargetWorkMode>('cross-border-remote');

  const [aiRoutesByKey, setAiRoutesByKey] = useState<Record<string, ComplianceCrossingRoute>>({});
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [rightsExpanded, setRightsExpanded] = useState(false);
  const [onboardingModalOpen, setOnboardingModalOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const activeCountryName = isCustomCountryMode
    ? customCountryInput.trim() || 'Kenya'
    : selectedCountry;

  const cacheKey = `${activeCountryName.toLowerCase()}|${docTier}|${workMode}`;

  const activeRoute: ComplianceCrossingRoute = useMemo(() => {
    if (aiRoutesByKey[cacheKey]) {
      return aiRoutesByKey[cacheKey];
    }
    return getPreseededComplianceRoute(activeCountryName, docTier, workMode);
  }, [aiRoutesByKey, cacheKey, activeCountryName, docTier, workMode]);

  const filteredPresets = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return COMPLIANCE_COUNTRY_PRESETS;
    return COMPLIANCE_COUNTRY_PRESETS.filter(
      (c) => c.label.toLowerCase().includes(q) || c.region.toLowerCase().includes(q)
    );
  }, [countryQuery]);

  const runLiveAiLookup = async (
    targetCountry: string,
    targetDocTier: IdentityDocumentTier = docTier,
    targetWorkMode: TargetWorkMode = workMode
  ) => {
    const clean = targetCountry.trim();
    if (clean.length < 2) {
      setAiError('Enter at least 2 characters for the host country name.');
      return;
    }

    setAiError(null);
    setIsLoadingAi(true);
    const requestKey = `${clean.toLowerCase()}|${targetDocTier}|${targetWorkMode}`;

    try {
      const res = await fetch('/api/compliance/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: clean,
          docTier: targetDocTier,
          workMode: targetWorkMode,
          primaryDomain,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        route?: ComplianceCrossingRoute;
      };
      if (!res.ok || !data.route) {
        throw new Error(data.error || 'Unable to route compliance guidance right now.');
      }
      const sanitizedRoute: ComplianceCrossingRoute = {
        ...data.route,
        talentSteps: data.route.talentSteps.map(enforceUnderFifteenWords),
        partnerSteps: data.route.partnerSteps.map(enforceUnderFifteenWords),
      };
      setAiRoutesByKey((prev) => ({
        ...prev,
        [requestKey]: sanitizedRoute,
      }));
    } catch (err) {
      const rawMessage =
        err instanceof Error ? err.message : 'Unable to fetch live ILO-grounded compliance route.';
      const cleanMessage =
        rawMessage.includes('quota') || rawMessage.includes('429')
          ? 'Live AI lookup rate limit reached temporarily — displaying instant ILO-grounded guidance below.'
          : rawMessage;
      setAiError(cleanMessage);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleSelectPresetCountry = (countryName: string) => {
    setIsCustomCountryMode(false);
    setSelectedCountry(countryName);
    setCountryQuery('');
    setDropdownOpen(false);
    setAiError(null);
  };

  const handleSelectCustomCountryMode = () => {
    setIsCustomCountryMode(true);
    setDropdownOpen(false);
    setCountryQuery('');
    setAiError(null);
  };

  const handleSubmitCustomLookup = (e: React.FormEvent) => {
    e.preventDefault();
    void runLiveAiLookup(customCountryInput, docTier, workMode);
  };

  const stepsForCurrentView =
    viewMode === 'partner' ? activeRoute.partnerSteps : activeRoute.talentSteps;
  const tierStyle = TIER_STYLES[activeRoute.accessTier];

  const matchedFatfTier = useMemo(
    () => getMatchedFatfKycTier(docTier, workMode, activeCountryName),
    [docTier, workMode, activeCountryName]
  );

  const financialProgress = useMemo(
    () => computeFinancialCrossingProgress(vault),
    [vault]
  );

  const vaultReadiness = useMemo(() => computeVaultReadiness(vault), [vault]);

  const selectedContractingStructure: ContractingStructureOption =
    vault.onboardingContractStructure ??
    (activeRoute.accessTier === 'Enabling' && workMode === 'local-formal'
      ? 'direct-local'
      : activeRoute.accessTier === 'Restricted — Remote/EOR Route Active'
        ? 'eor-fiscal-host'
        : 'scoped-remote');

  const contractingMeta = getContractingStructureMeta(selectedContractingStructure);

  const verifiedSkillNames = useMemo(() => {
    const fromPassport = passport?.verifiedSkills.map((s) => s.name) ?? [];
    const fromCaps = capabilities
      .filter((c) => c.verificationStatus !== 'pending')
      .map((c) => c.title);
    const merged = Array.from(new Set([...fromPassport, ...fromCaps]));
    return merged.slice(0, 5);
  }, [passport, capabilities]);

  const handleSelectContractingStructure = (structure: ContractingStructureOption) => {
    onUpdateVault({
      ...vault,
      onboardingContractStructure: structure,
      onboardingHostCountry: activeCountryName,
      updatedAtIso: new Date().toISOString(),
    });
  };

  const handlePackReady = (details: {
    partnerOrg: string;
    contractingStructure: ContractingStructureOption;
    hostCountry: string;
  }) => {
    onUpdateVault({
      ...vault,
      onboardingPackGenerated: true,
      onboardingContractStructure: details.contractingStructure,
      onboardingPartnerOrg: details.partnerOrg,
      onboardingHostCountry: details.hostCountry,
      updatedAtIso: new Date().toISOString(),
    });
  };

  const handleToggleFinancialGate = (gate: 'identity-auth' | 'payout-rail' | 'tax-terms') => {
    const now = new Date().toISOString();
    if (gate === 'identity-auth') {
      onUpdateVault({
        ...vault,
        financialIdentityCleared: !vault.financialIdentityCleared,
        updatedAtIso: now,
      });
      return;
    }
    if (gate === 'payout-rail') {
      onUpdateVault({
        ...vault,
        financialRailTested: !vault.financialRailTested,
        financialRail: financialProgress.selectedRail,
        updatedAtIso: now,
      });
      return;
    }
    onUpdateVault({
      ...vault,
      financialTaxCleared: !vault.financialTaxCleared,
      updatedAtIso: now,
    });
  };

  const handleSelectFinancialRail = (rail: FinancialPayoutRail) => {
    const syncedLegacyRail =
      rail === 'fiscal-host' ? 'global-wallet' : rail;
    onUpdateVault({
      ...vault,
      financialRail: rail,
      payoutRail: syncedLegacyRail,
      updatedAtIso: new Date().toISOString(),
    });
  };

  const getRailIcon = (rail: FinancialPayoutRail) => {
    if (rail === 'mobile-money') return <Smartphone className="w-3.5 h-3.5" />;
    if (rail === 'global-wallet') return <Wallet className="w-3.5 h-3.5" />;
    if (rail === 'fiscal-host') return <Building2 className="w-3.5 h-3.5" />;
    return <Landmark className="w-3.5 h-3.5" />;
  };

  return (
    <section
      id="compliance-crossing-section"
      aria-labelledby="compliance-crossing-heading"
      data-testid="compliance-crossing-section"
      className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 sm:p-8 space-y-6"
    >
      {/* Subtle 5% opacity Unbroken Meridian & Compass Arc SVG motif */}
      <UnbrokenMeridianCompassMotif />

      {/* Section Header + Clean Dual-Mode Toggle at top right */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#146C53] dark:text-[#2EB88B]">
            CROSSING OVER ACCESS · SDGs 8, 10 &amp; 16
          </p>
          <h2
            id="compliance-crossing-heading"
            className="mt-1.5 font-display text-2xl sm:text-3xl font-medium tracking-tight text-[#17191C] dark:text-[#F4F2EE]"
          >
            Compliance Readiness: Crossing Over Access
          </h2>
          <p className="mt-2 text-sm text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
            Clear legal, work-authorization, and contracting steps grounded in ILO Guiding Principles so skilled talent anywhere can enter formal or remote work cleanly.
          </p>
        </div>

        {/* Dual-Mode Toggle + Guided Tour Trigger */}
        <div className="flex flex-wrap items-center gap-2.5 self-start shrink-0">
          {onStartTour && (
            <button
              type="button"
              data-testid="start-compliance-tour-btn"
              onClick={onStartTour}
              className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-[#146C53]/35 dark:border-[#2EB88B]/40 bg-[#E7F3EE]/70 dark:bg-[#142B24]/80 hover:bg-[#D8EDE4] dark:hover:bg-[#1A3930] text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <HelpCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Compliance Guided Tour</span>
            </button>
          )}

          <div
            role="tablist"
            aria-label="Compliance view mode"
            className="inline-flex p-1 rounded-xl bg-[#F2EEE8] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037]"
          >
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'talent'}
              data-testid="compliance-toggle-talent"
              onClick={() => onChangeViewMode('talent')}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                viewMode === 'talent'
                  ? 'bg-white dark:bg-[#1A1C20] text-[#146C53] dark:text-[#2EB88B] shadow-xs'
                  : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
              }`}
            >
              Talent Readiness View
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'partner'}
              data-testid="compliance-toggle-partner"
              onClick={() => onChangeViewMode('partner')}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                viewMode === 'partner'
                  ? 'bg-white dark:bg-[#1A1C20] text-[#146C53] dark:text-[#2EB88B] shadow-xs'
                  : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
              }`}
            >
              Hiring Partner Compliance View
            </button>
          </div>
        </div>
      </div>

      {/* Compact 3-Field Horizontal Global Jurisdiction & Document Selector */}
      <div
        data-testid="compliance-jurisdiction-bar"
        className="relative z-20 rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-4 space-y-3"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Field 1: Searchable Current Host Country Dropdown */}
          <div ref={dropdownRef} className="relative space-y-1.5">
            <label
              htmlFor="compliance-country-trigger"
              className="block text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]"
            >
              1. Current Host Country
            </label>
            <button
              id="compliance-country-trigger"
              type="button"
              data-testid="compliance-country-dropdown-btn"
              aria-haspopup="listbox"
              aria-expanded={dropdownOpen}
              onClick={() => setDropdownOpen((o) => !o)}
              className="w-full min-h-[42px] px-3.5 py-2 rounded-lg bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] text-xs font-medium text-[#17191C] dark:text-[#F4F2EE] flex items-center justify-between gap-2 hover:border-[#146C53] dark:hover:border-[#2EB88B] transition-colors"
            >
              <span className="inline-flex items-center gap-2 truncate">
                <Globe className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B] shrink-0" />
                <span className="truncate">
                  {isCustomCountryMode
                    ? customCountryInput.trim()
                      ? `${customCountryInput.trim()} (Live AI)`
                      : CUSTOM_COUNTRY_SENTINEL
                    : selectedCountry}
                </span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#575B62] shrink-0" />
            </button>

            {dropdownOpen && (
              <div
                role="listbox"
                aria-label="Select host country"
                data-testid="compliance-country-listbox"
                className="absolute left-0 right-0 mt-1.5 z-30 rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] shadow-xl p-2 space-y-1.5"
              >
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#8A847A] absolute start-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={countryQuery}
                    onChange={(e) => setCountryQuery(e.target.value)}
                    placeholder="Search host country..."
                    aria-label="Filter host countries"
                    data-testid="compliance-country-search-input"
                    className="w-full min-h-[36px] ps-8 pe-2.5 py-1.5 rounded-lg bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] text-xs text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53]"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {filteredPresets.map((preset) => {
                    const active = !isCustomCountryMode && selectedCountry === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        role="option"
                        aria-selected={active}
                        data-testid={`country-option-${preset.id.toLowerCase()}`}
                        onClick={() => handleSelectPresetCountry(preset.id)}
                        className={`w-full px-3 py-2 rounded-lg text-xs text-start flex items-center justify-between transition-colors ${
                          active
                            ? 'bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B] font-semibold'
                            : 'text-[#17191C] dark:text-[#F4F2EE] hover:bg-[#FAF8F5] dark:hover:bg-[#22252A]'
                        }`}
                      >
                        <span>{preset.label}</span>
                        <span className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                          {preset.region}
                        </span>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    role="option"
                    aria-selected={isCustomCountryMode}
                    data-testid="country-option-custom"
                    onClick={handleSelectCustomCountryMode}
                    className={`w-full px-3 py-2 rounded-lg text-xs text-start flex items-center gap-2 border-t border-[#E8E3DB] dark:border-[#2C3037] mt-1 pt-2 transition-colors ${
                      isCustomCountryMode
                        ? 'bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B] font-semibold'
                        : 'text-[#C4622D] dark:text-[#E07B46] font-medium hover:bg-[#FAF8F5] dark:hover:bg-[#22252A]'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>{CUSTOM_COUNTRY_SENTINEL}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Field 2: Available Identity Document Tier */}
          <div className="space-y-1.5">
            <label
              htmlFor="compliance-doc-tier-select"
              className="block text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]"
            >
              2. Available Identity Document Tier
            </label>
            <select
              id="compliance-doc-tier-select"
              data-testid="compliance-doc-tier-select"
              value={docTier}
              onChange={(e) => setDocTier(e.target.value as IdentityDocumentTier)}
              className="w-full min-h-[42px] px-3 py-2 rounded-lg bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] text-xs font-medium text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B]"
            >
              {IDENTITY_DOCUMENT_TIERS.map((tier) => (
                <option key={tier.id} value={tier.id}>
                  {tier.label}
                </option>
              ))}
            </select>
          </div>

          {/* Field 3: Target Work Mode */}
          <div className="space-y-1.5">
            <label
              htmlFor="compliance-work-mode-select"
              className="block text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]"
            >
              3. Target Work Mode
            </label>
            <select
              id="compliance-work-mode-select"
              data-testid="compliance-work-mode-select"
              value={workMode}
              onChange={(e) => setWorkMode(e.target.value as TargetWorkMode)}
              className="w-full min-h-[42px] px-3 py-2 rounded-lg bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] text-xs font-medium text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B]"
            >
              {TARGET_WORK_MODES.map((mode) => (
                <option key={mode.id} value={mode.id}>
                  {mode.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Country Live Gemini Lookup Bar (shown when "Any Other Country — Live AI Lookup" is active) */}
        {isCustomCountryMode && (
          <form
            onSubmit={handleSubmitCustomLookup}
            className="pt-2 border-t border-[#E8E3DB] dark:border-[#2C3037] flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
          >
            <input
              type="text"
              value={customCountryInput}
              onChange={(e) => setCustomCountryInput(e.target.value)}
              placeholder="Enter any host country (e.g., Brazil, Sweden, Lebanon, Thailand)..."
              aria-label="Enter any host country for Live AI lookup"
              data-testid="custom-country-input"
              className="flex-1 min-h-[40px] px-3.5 py-2 rounded-lg bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] text-xs text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53]"
            />
            <button
              type="submit"
              disabled={isLoadingAi || customCountryInput.trim().length < 2}
              data-testid="custom-country-lookup-btn"
              className="min-h-[40px] px-4 py-2 rounded-lg bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap disabled:opacity-50"
            >
              {isLoadingAi ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Routing via Gemini…</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Live AI Lookup</span>
                </>
              )}
            </button>
          </form>
        )}

        {aiError && (
          <p role="alert" className="text-xs font-medium text-[#B42318] dark:text-[#F97066]">
            {aiError}
          </p>
        )}
      </div>

      {/* Dignified Work-Authorization Crossing Card */}
      <div
        data-testid="work-auth-crossing-card"
        className="relative z-10 rounded-2xl bg-[#FAF8F5]/85 dark:bg-[#121315]/90 border border-[#E8E3DB] dark:border-[#2C3037] p-5 sm:p-6 space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[#E8E3DB] dark:border-[#2C3037] pb-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                data-testid="regulatory-access-tier-pill"
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${tierStyle.badgeClass}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${tierStyle.dotClass}`} />
                <span>{activeRoute.accessTier}</span>
              </span>

              <span className="text-[11px] font-medium text-[#575B62] dark:text-[#A3A7AE]">
                {activeRoute.source === 'ai'
                  ? 'Live Gemini AI Route · ILO Grounded'
                  : 'Instant ILO-Grounded Route'}
              </span>
            </div>

            <h3 className="font-display text-lg sm:text-xl font-medium text-[#17191C] dark:text-[#F4F2EE]">
              {activeRoute.pathwayHeadline}
            </h3>
            <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">{tierStyle.caption}</p>
          </div>

          <button
            type="button"
            disabled={isLoadingAi}
            data-testid="refresh-compliance-ai-btn"
            onClick={() => void runLiveAiLookup(activeCountryName, docTier, workMode)}
            className="min-h-[36px] px-3 py-1.5 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-xs font-medium text-[#17191C] dark:text-[#F4F2EE] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            {isLoadingAi ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#146C53] dark:text-[#2EB88B]" />
            ) : (
              <Compass className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B]" />
            )}
            <span>{isLoadingAi ? 'Routing…' : 'Verify Live with AI'}</span>
          </button>
        </div>

        {/* Exact Legal Pathway (Plain-language steps strictly under 15 words each) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#146C53] dark:text-[#2EB88B]">
              {viewMode === 'partner'
                ? 'Exact Partner Compliance Pathway'
                : 'Exact Talent Readiness Pathway'}
            </p>
            <span className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
              Plain-language steps
            </span>
          </div>

          <ol
            data-testid="compliance-pathway-steps"
            className="grid grid-cols-1 md:grid-cols-3 gap-3"
          >
            {stepsForCurrentView.map((stepText, idx) => (
              <li
                key={`${viewMode}-${idx}-${stepText}`}
                className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-4 flex items-start gap-3"
              >
                <span className="w-6 h-6 rounded-full bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B] text-xs font-mono-tabular font-semibold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <span className="text-sm leading-snug text-[#17191C] dark:text-[#F4F2EE]">
                  {stepText}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* Clean Collapsible Disclosure: Rights at Work Guarantee citing ILO Guiding Principles */}
        <div className="pt-2 border-t border-[#E8E3DB] dark:border-[#2C3037]">
          <button
            type="button"
            aria-expanded={rightsExpanded}
            data-testid="ilo-rights-disclosure-btn"
            onClick={() => setRightsExpanded((prev) => !prev)}
            className="w-full py-1.5 flex items-center justify-between gap-3 text-start text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] hover:text-[#146C53] dark:hover:text-[#2EB88B] transition-colors"
          >
            <span className="inline-flex items-center gap-2">
              <Scale className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B] shrink-0" />
              <span>Rights at Work Guarantee · ILO Guiding Principles</span>
            </span>
            {rightsExpanded ? (
              <ChevronUp className="w-4 h-4 text-[#575B62] shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#575B62] shrink-0" />
            )}
          </button>

          {rightsExpanded && (
            <div
              data-testid="ilo-rights-disclosure-panel"
              className="mt-3 rounded-xl bg-[#E7F3EE]/70 dark:bg-[#142B24]/80 border border-[#146C53]/25 dark:border-[#2EB88B]/30 p-4 space-y-2 text-xs text-[#17191C] dark:text-[#F4F2EE] leading-relaxed"
            >
              <p className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B] shrink-0 mt-0.5" />
                <span>{activeRoute.iloRightsGuarantee}</span>
              </p>
              <p className="text-[#575B62] dark:text-[#A3A7AE] ps-6">
                Core standard: Equal pay for equal deliverables, written milestone agreements before kickoff, safe working conditions, and transparent dispute recourse under ILO Guiding Principles on Access to the Labour Market.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODULE 2: Financial & Payout Rail Readiness (UNHCR Financial Inclusion + FATF Risk-Based Tiered KYC) */}
      <div
        id="financial-payout-readiness-module"
        data-testid="financial-payout-readiness-module"
        className="relative z-10 rounded-2xl bg-[#FAF8F5]/85 dark:bg-[#121315]/90 border border-[#E8E3DB] dark:border-[#2C3037] p-5 sm:p-6 space-y-6"
      >
        {/* Header + Live Readiness Progress Meter */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#E8E3DB] dark:border-[#2C3037] pb-5">
          <div className="space-y-1 max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#146C53] dark:text-[#2EB88B]">
              Module 2 · UNHCR Financial Inclusion &amp; FATF Tiered KYC
            </p>
            <h3 className="font-display text-lg sm:text-xl font-medium text-[#17191C] dark:text-[#F4F2EE]">
              Financial &amp; Payout Rail Readiness
            </h3>
            <p className="text-xs sm:text-sm text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
              Adaptive Tiered Payout Bridge matching your document tier to proportional, compliant disbursement rails.
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            <div className="flex items-center gap-3">
              <span
                data-testid="financial-readiness-counter"
                className="text-xs font-mono-tabular tabular-nums font-semibold text-[#146C53] dark:text-[#2EB88B]"
              >
                {financialProgress.completedCount}/{financialProgress.totalCount} Gates Verified
              </span>
              <div
                className="w-32 sm:w-40 h-2 rounded-full bg-[#E8E3DB] dark:bg-[#22252A] overflow-hidden"
                role="progressbar"
                aria-label="Financial and payout rail readiness"
                aria-valuenow={financialProgress.percentage}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-[#146C53] dark:bg-[#2EB88B] transition-[width] duration-300"
                  style={{ width: `${financialProgress.percentage}%` }}
                />
              </div>
            </div>
            <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
              Active Rail:{' '}
              <strong className="text-[#17191C] dark:text-[#F4F2EE]">
                {getFinancialPayoutRailLabel(financialProgress.selectedRail)}
              </strong>
            </p>
          </div>
        </div>

        {/* Unlocked Status Banner when all 3 gates clear */}
        {financialProgress.isCrossingCleared && (
          <div
            role="status"
            data-testid="financial-crossing-cleared-banner"
            className="rounded-xl bg-[#E7F3EE] dark:bg-[#142B24] border border-[#146C53]/35 dark:border-[#2EB88B]/40 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#146C53] dark:text-[#2EB88B] shrink-0" />
              <p className="text-sm font-semibold text-[#146C53] dark:text-[#2EB88B]">
                Crossing Cleared — Ready to Contract &amp; Get Paid
              </p>
            </div>
            <span className="text-xs font-medium text-[#17191C] dark:text-[#F4F2EE] ps-7 sm:ps-0">
              Synced to Pulse SDG 16 Barriers Cleared
            </span>
          </div>
        )}

        {/* 1. Auto-Matched FATF Tiered KYC Bridge */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#17191C] dark:text-[#F4F2EE]">
              Auto-Matched Tiered Payout Bridge (FATF Risk-Based KYC)
            </p>
            <span
              data-testid="matched-kyc-tier-label"
              className="text-xs font-semibold text-[#146C53] dark:text-[#2EB88B]"
            >
              Active Match: {matchedFatfTier.tierLabel}
            </span>
          </div>

          <div
            data-testid="fatf-tiered-kyc-grid"
            className="grid grid-cols-1 md:grid-cols-3 gap-3"
          >
            {FATF_TIERED_KYC_BRIDGE.map((tier) => {
              const isMatched = tier.id === matchedFatfTier.id;
              return (
                <div
                  key={tier.id}
                  data-testid={`fatf-tier-card-${tier.id}`}
                  data-matched={isMatched ? 'true' : 'false'}
                  className={`rounded-xl border p-4 flex flex-col justify-between gap-3 transition-colors ${
                    isMatched
                      ? 'bg-[#E7F3EE]/60 dark:bg-[#142B24]/80 border-[#146C53] dark:border-[#2EB88B]'
                      : 'bg-white dark:bg-[#1A1C20] border-[#E8E3DB] dark:border-[#2C3037] opacity-85'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`text-xs font-semibold ${
                          isMatched
                            ? 'text-[#146C53] dark:text-[#2EB88B]'
                            : 'text-[#17191C] dark:text-[#F4F2EE]'
                        }`}
                      >
                        {tier.tierLabel}
                      </span>
                      {isMatched && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#146C53] dark:bg-[#2EB88B] text-white dark:text-[#121315] text-[10px] font-semibold whitespace-nowrap shrink-0">
                          Matched Tier
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-medium text-[#C4622D] dark:text-[#E07B46]">
                      {tier.frictionLabel}
                    </p>
                    <p className="text-xs text-[#43484E] dark:text-[#C4C9D0] leading-relaxed">
                      {tier.summary}
                    </p>
                  </div>

                  <p className="pt-2.5 border-t border-[#E8E3DB] dark:border-[#2C3037] text-[11px] font-medium text-[#575B62] dark:text-[#A3A7AE]">
                    Rails: <span className="text-[#17191C] dark:text-[#F4F2EE]">{tier.recommendedRailsLabel}</span>
                  </p>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] leading-relaxed bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] rounded-xl px-4 py-3">
            <strong className="text-[#17191C] dark:text-[#F4F2EE]">Field Guidance: </strong>
            {matchedFatfTier.kycMechanismNote}
          </p>
        </div>

        {/* 2. Interactive 3-Step Readiness Checklist (Talent View) or Partner Payout Summary */}
        {viewMode === 'talent' ? (
          <div className="space-y-3" data-testid="financial-talent-checklist">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#146C53] dark:text-[#2EB88B]">
              3-Step Financial Readiness Checklist
            </p>

            <div className="space-y-3">
              {FINANCIAL_READINESS_CHECKLIST_ITEMS.map((item) => {
                const isChecked =
                  item.id === 'identity-auth'
                    ? Boolean(vault.financialIdentityCleared)
                    : item.id === 'payout-rail'
                      ? Boolean(vault.financialRailTested)
                      : Boolean(vault.financialTaxCleared);

                return (
                  <div
                    key={item.id}
                    data-testid={`financial-step-${item.id}`}
                    data-verified={isChecked ? 'true' : 'false'}
                    className={`rounded-xl border p-4 transition-colors space-y-3 ${
                      isChecked
                        ? 'bg-white dark:bg-[#1A1C20] border-[#146C53]/40 dark:border-[#2EB88B]/40'
                        : 'bg-white dark:bg-[#1A1C20] border-[#E8E3DB] dark:border-[#2C3037]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <span
                          className={`w-7 h-7 rounded-full text-xs font-mono-tabular font-semibold flex items-center justify-center shrink-0 ${
                            isChecked
                              ? 'bg-[#146C53] dark:bg-[#2EB88B] text-white dark:text-[#121315]'
                              : 'bg-[#F2EEE8] dark:bg-[#22252A] text-[#17191C] dark:text-[#F4F2EE]'
                          }`}
                        >
                          {item.stepNumber}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                            {item.title}
                          </h4>
                          <p
                            data-testid={`financial-copy-${item.id}`}
                            className="mt-0.5 text-xs text-[#575B62] dark:text-[#A3A7AE]"
                          >
                            {item.reassuringCopy}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {isChecked ? (
                          <button
                            type="button"
                            onClick={() => handleToggleFinancialGate(item.id)}
                            data-testid={`financial-verified-pill-${item.id}`}
                            aria-pressed="true"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold transition-colors whitespace-nowrap"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Verified Ready</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleFinancialGate(item.id)}
                            data-testid={`financial-verify-btn-${item.id}`}
                            aria-pressed="false"
                            className="min-h-[36px] px-3.5 py-1.5 rounded-lg border border-[#146C53] dark:border-[#2EB88B] text-[#146C53] dark:text-[#2EB88B] hover:bg-[#E7F3EE] dark:hover:bg-[#142B24] text-xs font-semibold transition-colors whitespace-nowrap"
                          >
                            Verify Step
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Interactive Payout Rail Picker inside Step [2] */}
                    {item.id === 'payout-rail' && (
                      <div className="pt-3 border-t border-[#E8E3DB] dark:border-[#2C3037] space-y-2">
                        <p className="text-[11px] font-medium text-[#575B62] dark:text-[#A3A7AE]">
                          Select &amp; test payout rail:
                        </p>
                        <div
                          role="radiogroup"
                          aria-label="Compliant payout rail picker"
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2"
                        >
                          {FINANCIAL_PAYOUT_RAILS.map((rail) => {
                            const selected = financialProgress.selectedRail === rail.id;
                            const isRecommended = rail.supportedTiers.includes(matchedFatfTier.id);
                            return (
                              <button
                                key={rail.id}
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                data-testid={`financial-rail-option-${rail.id}`}
                                onClick={() => handleSelectFinancialRail(rail.id)}
                                className={`text-start rounded-lg border p-2.5 transition-colors ${
                                  selected
                                    ? 'bg-[#E7F3EE]/70 dark:bg-[#142B24] border-[#146C53] dark:border-[#2EB88B]'
                                    : 'bg-[#FAF8F5] dark:bg-[#121315] border-[#E8E3DB] dark:border-[#2C3037] hover:border-[#C9C1B5]'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1.5">
                                  <span
                                    className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                                      selected
                                        ? 'text-[#146C53] dark:text-[#2EB88B]'
                                        : 'text-[#17191C] dark:text-[#F4F2EE]'
                                    }`}
                                  >
                                    {getRailIcon(rail.id)}
                                    <span>{rail.label}</span>
                                  </span>
                                </div>
                                <p className="mt-1 text-[11px] text-[#575B62] dark:text-[#A3A7AE] leading-snug">
                                  {rail.plainDescription}
                                </p>
                                {isRecommended && (
                                  <p className="mt-1 text-[10px] font-medium text-[#146C53] dark:text-[#2EB88B]">
                                    Fits {matchedFatfTier.id.toUpperCase()}
                                  </p>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div
            data-testid="financial-partner-assurance"
            className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <p className="text-xs font-semibold text-[#146C53] dark:text-[#2EB88B]">
                Hiring Partner Payout Assurance · {matchedFatfTier.tierLabel}
              </p>
              <p className="text-sm font-medium text-[#17191C] dark:text-[#F4F2EE]">
                Disburse via {getFinancialPayoutRailLabel(financialProgress.selectedRail)} with zero commercial-bank onboarding delays.
              </p>
              <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                {financialProgress.completedCount}/3 financial readiness gates confirmed by practitioner.
              </p>
            </div>
            {!financialProgress.isCrossingCleared && (
              <button
                type="button"
                onClick={() => onChangeViewMode('talent')}
                className="min-h-[38px] px-4 py-2 rounded-lg border border-[#146C53] dark:border-[#2EB88B] text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] hover:bg-[#E7F3EE] dark:hover:bg-[#142B24] transition-colors whitespace-nowrap shrink-0 self-start sm:self-center"
              >
                Open Talent Checklist
              </button>
            )}
          </div>
        )}
      </div>

      {/* MODULE 3: HIRING PARTNER COMPLIANCE VIEW — Zero-Friction Onboarding Dossier & Employer Liability Shield */}
      {viewMode === 'partner' && (
        <div
          id="zero-friction-onboarding-dossier"
          data-testid="zero-friction-onboarding-dossier"
          className="relative z-10 rounded-2xl bg-[#FAF8F5]/95 dark:bg-[#121315] border border-[#146C53]/35 dark:border-[#2EB88B]/35 p-5 sm:p-7 space-y-6"
        >
          {/* Dossier Header + Candidate Verified Skills Snapshot */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 border-b border-[#E8E3DB] dark:border-[#2C3037] pb-5">
            <div className="space-y-1.5 max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#146C53] dark:text-[#2EB88B]">
                Employer Liability Shield · Executive Onboarding Dossier
              </p>
              <h3 className="font-display text-xl sm:text-2xl font-medium text-[#17191C] dark:text-[#F4F2EE]">
                Zero-Friction Onboarding Dossier · {profile?.displayName || 'Skilled Practitioner'}
              </h3>
              <p className="text-xs sm:text-sm text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                Pre-cleared legal, financial, and competency record pulling verified proof from Tab 1 and cleared gates from Modules 1–2 so your organization can contract without HR overhead.
              </p>

              {verifiedSkillNames.length > 0 && (
                <div className="pt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-[#575B62] dark:text-[#A3A7AE] me-1">
                    Verified Skills:
                  </span>
                  {verifiedSkillNames.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] text-[11px] font-medium text-[#17191C] dark:text-[#F4F2EE]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="shrink-0 flex flex-col items-start lg:items-end gap-1.5">
              <span
                data-testid="dossier-pack-status-pill"
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${
                  vault.onboardingPackGenerated
                    ? 'bg-[#E7F3EE] dark:bg-[#142B24] border-[#146C53]/35 dark:border-[#2EB88B]/40 text-[#146C53] dark:text-[#2EB88B]'
                    : 'bg-white dark:bg-[#1A1C20] border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  {vault.onboardingPackGenerated
                    ? 'Pre-Cleared for Hiring Partners'
                    : 'Ready to Generate Pack'}
                </span>
              </span>
              {passport && (
                <span className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                  Passport: {passport.fieldMatch}
                </span>
              )}
            </div>
          </div>

          {/* 1. Compliance Assurance Summary Card (Three Amana Emerald Verified Shields) */}
          <div className="space-y-3" data-testid="compliance-assurance-shields">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#146C53] dark:text-[#2EB88B]">
              1. Compliance Assurance Summary · Three Verified Shields
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="rounded-xl bg-[#E7F3EE]/65 dark:bg-[#142B24]/80 border border-[#146C53]/30 dark:border-[#2EB88B]/35 p-4 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#146C53] dark:text-[#2EB88B]">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>(a) Work-Auth / Remote Status</span>
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B] shrink-0" />
                </div>
                <p className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                  {activeRoute.country} · {activeRoute.accessTier}
                </p>
                <p className="text-[11px] text-[#43484E] dark:text-[#C4C9D0] leading-snug">
                  {vaultReadiness.isFullyReady
                    ? 'Work-Ready Vault & statutory route pre-screened for zero-delay onboarding.'
                    : `Active route: ${activeRoute.pathwayHeadline}.`}
                </p>
              </div>

              <div className="rounded-xl bg-[#E7F3EE]/65 dark:bg-[#142B24]/80 border border-[#146C53]/30 dark:border-[#2EB88B]/35 p-4 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#146C53] dark:text-[#2EB88B]">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>(b) KYC-Cleared Payout Rail Ready</span>
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B] shrink-0" />
                </div>
                <p className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                  {getFinancialPayoutRailLabel(financialProgress.selectedRail)} · {matchedFatfTier.id.toUpperCase()}
                </p>
                <p className="text-[11px] text-[#43484E] dark:text-[#C4C9D0] leading-snug">
                  {financialProgress.isCrossingCleared
                    ? '3/3 FATF Tiered KYC & test payout gates cleared.'
                    : `${financialProgress.completedCount}/3 FATF KYC gates verified via ${matchedFatfTier.frictionLabel}.`}
                </p>
              </div>

              <div className="rounded-xl bg-[#E7F3EE]/65 dark:bg-[#142B24]/80 border border-[#146C53]/30 dark:border-[#2EB88B]/35 p-4 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#146C53] dark:text-[#2EB88B]">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>(c) ILO Decent-Work Aligned</span>
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B] shrink-0" />
                </div>
                <p className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                  Non-Discrimination &amp; Fair Pay
                </p>
                <p className="text-[11px] text-[#43484E] dark:text-[#C4C9D0] leading-snug">
                  Equal pay for equal deliverables, escrow protection, and written milestone IP clarity.
                </p>
              </div>
            </div>
          </div>

          {/* 2. Contracting Structure Selector (3 Clean Options) */}
          <div className="space-y-3" data-testid="contracting-structure-selector">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#17191C] dark:text-[#F4F2EE]">
                2. Select Contracting Structure
              </p>
              <span className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                Active: {contractingMeta.shortLabel}
              </span>
            </div>

            <div
              role="radiogroup"
              aria-label="Hiring Partner Contracting Structure"
              className="grid grid-cols-1 md:grid-cols-3 gap-3.5"
            >
              {CONTRACTING_STRUCTURES.map((option) => {
                const selected = selectedContractingStructure === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    data-testid={`contracting-option-${option.id}`}
                    onClick={() => handleSelectContractingStructure(option.id)}
                    className={`text-start rounded-xl border p-4 flex flex-col justify-between gap-3 transition-colors ${
                      selected
                        ? 'bg-white dark:bg-[#1A1C20] border-[#146C53] dark:border-[#2EB88B] ring-1 ring-[#146C53]/25 dark:ring-[#2EB88B]/30'
                        : 'bg-white/75 dark:bg-[#1A1C20]/70 border-[#E8E3DB] dark:border-[#2C3037] hover:border-[#C9C1B5]'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`text-xs sm:text-sm font-semibold leading-snug ${
                            selected
                              ? 'text-[#146C53] dark:text-[#2EB88B]'
                              : 'text-[#17191C] dark:text-[#F4F2EE]'
                          }`}
                        >
                          {option.label}
                        </span>
                      </div>
                      <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-[#C4622D] dark:text-[#E07B46]">
                        {option.badge}
                      </span>
                      <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                        {option.summary}
                      </p>
                    </div>

                    <p className="pt-2.5 border-t border-[#E8E3DB] dark:border-[#2C3037] text-[11px] font-medium text-[#17191C] dark:text-[#F4F2EE]">
                      {option.legalNote}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. One-Click "Generate Compliant Onboarding Pack" CTA */}
          <div className="pt-4 border-t border-[#E8E3DB] dark:border-[#2C3037] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                3. One-Click Compliant Onboarding Pack
              </p>
              <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] max-w-xl leading-relaxed">
                Generates a tailored 1-Page Sprint &amp; Compliance Agreement, marks the practitioner <strong className="text-[#146C53] dark:text-[#2EB88B]">Pre-Cleared for Hiring Partners</strong> in Solve, and updates Pulse SDGs 8 &amp; 16.
              </p>
            </div>

            <button
              type="button"
              data-testid="generate-onboarding-pack-btn"
              onClick={() => setOnboardingModalOpen(true)}
              className="min-h-[46px] px-5 py-2.5 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Generate Compliant Onboarding Pack</span>
            </button>
          </div>
        </div>
      )}

      {/* 1-Click AI/Template Onboarding Pack Modal */}
      <OnboardingPackModal
        isOpen={onboardingModalOpen}
        onClose={() => setOnboardingModalOpen(false)}
        practitionerName={profile?.displayName || 'Skilled Practitioner'}
        ageStage={profile?.ageStage || '30-45'}
        hostCountry={activeCountryName}
        docTier={docTier}
        workMode={workMode}
        contractingStructure={selectedContractingStructure}
        selectedPayoutRail={financialProgress.selectedRail}
        verifiedSkills={verifiedSkillNames}
        passportFieldMatch={passport?.fieldMatch}
        passportId={passport?.id ?? null}
        defaultPartnerOrg={vault.onboardingPartnerOrg || 'Rift Valley Cold-Chain Co-op'}
        defaultSprintTitle={defaultSprintTitle}
        defaultPayoutUsd={defaultPayoutUsd}
        onPackReady={handlePackReady}
      />
    </section>
  );
};
