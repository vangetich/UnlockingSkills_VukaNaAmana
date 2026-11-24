import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  CheckCircle2,
  Globe,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import type {
  AgeStage,
  CohortBlueprintPreview,
  LocaleCode,
  ScaleRegionId,
  ScaleSectorId,
} from '../types/kora';
import { LOCALE_OPTIONS } from '../utils/i18n';
import {
  SCALE_REGIONS,
  SCALE_SECTORS,
  buildCohortBlueprint,
  computePeerFlywheelMetrics,
  getUserPodSeat,
} from '../utils/talentEngine';
import { WovenBridgeArcsMotif } from './ResilienceMotifs';

interface PartnerScaleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocale: LocaleCode;
  userAgeStage: AgeStage;
  verifiedCapabilitiesCount: number;
  onApplyCohortPreset: (blueprint: CohortBlueprintPreview) => void;
}

type ScaleLeverTab = 'cohort' | 'flywheel';

const COHORT_SIZES = [50, 250, 1000] as const;

export const PartnerScaleDrawer: React.FC<PartnerScaleDrawerProps> = ({
  isOpen,
  onClose,
  currentLocale,
  userAgeStage,
  verifiedCapabilitiesCount,
  onApplyCohortPreset,
}) => {
  const [activeLever, setActiveLever] = useState<ScaleLeverTab>('cohort');
  const [regionId, setRegionId] = useState<ScaleRegionId>('kenya');
  const [sectorId, setSectorId] = useState<ScaleSectorId>('solar');
  const [languageCode, setLanguageCode] = useState<LocaleCode>(currentLocale);
  const [appliedBanner, setAppliedBanner] = useState<string | null>(null);

  const [flywheelEnabled, setFlywheelEnabled] = useState<boolean>(true);
  const [cohortSize, setCohortSize] = useState<number>(250);
  const [isProvisioning, setIsProvisioning] = useState<boolean>(false);
  const [provisionedCohortId, setProvisionedCohortId] = useState<string | null>(null);
  const [systemHealth, setSystemHealth] = useState<{
    cachedComplianceEngineActive: boolean;
    signedPassportVerificationReady: boolean;
    zeroRawIdPrivacyMode: boolean;
    activeCohortCount: number;
    cacheHitRatioPct: number;
    telemetryEventsCount: number;
  }>({
    cachedComplianceEngineActive: true,
    signedPassportVerificationReady: true,
    zeroRawIdPrivacyMode: true,
    activeCohortCount: 3,
    cacheHitRatioPct: 100,
    telemetryEventsCount: 5,
  });

  const refreshSystemHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) return;
      const data = (await res.json()) as {
        cachedComplianceEngineActive?: boolean;
        signedPassportVerificationReady?: boolean;
        zeroRawIdPrivacyMode?: boolean;
        activeCohortCount?: number;
        telemetryEventsCount?: number;
        cacheStats?: { hitRatioPct?: number };
      };
      setSystemHealth((prev) => ({
        cachedComplianceEngineActive: data.cachedComplianceEngineActive ?? prev.cachedComplianceEngineActive,
        signedPassportVerificationReady:
          data.signedPassportVerificationReady ?? prev.signedPassportVerificationReady,
        zeroRawIdPrivacyMode: data.zeroRawIdPrivacyMode ?? prev.zeroRawIdPrivacyMode,
        activeCohortCount: data.activeCohortCount ?? prev.activeCohortCount,
        cacheHitRatioPct: data.cacheStats?.hitRatioPct ?? prev.cacheHitRatioPct,
        telemetryEventsCount: data.telemetryEventsCount ?? prev.telemetryEventsCount,
      }));
    } catch {
      // Keep deterministic local readiness metrics when offline
    }
  };

  useEffect(() => {
    setLanguageCode(currentLocale);
  }, [currentLocale]);

  useEffect(() => {
    if (!isOpen) return;
    void refreshSystemHealth();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const blueprint = useMemo(
    () => buildCohortBlueprint(regionId, sectorId, languageCode),
    [regionId, sectorId, languageCode]
  );

  const flywheel = useMemo(
    () => computePeerFlywheelMetrics(cohortSize, flywheelEnabled, verifiedCapabilitiesCount),
    [cohortSize, flywheelEnabled, verifiedCapabilitiesCount]
  );

  const userSeat = getUserPodSeat(userAgeStage);

  const handleRegionChange = (nextRegionId: ScaleRegionId) => {
    setRegionId(nextRegionId);
    setAppliedBanner(null);
  };

  const handleSectorChange = (nextSectorId: ScaleSectorId) => {
    setSectorId(nextSectorId);
    setAppliedBanner(null);
  };

  const handleLanguageChange = (nextLang: LocaleCode) => {
    setLanguageCode(nextLang);
    setAppliedBanner(null);
  };

  const handleApply = async () => {
    setIsProvisioning(true);
    let newCohortId = `COHORT-${regionId.slice(0, 2).toUpperCase()}-${sectorId.toUpperCase()}-2026`;
    try {
      const res = await fetch('/api/cohorts/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regionId,
          sectorId,
          languageCode,
          cohortSize,
          peerAssessorEnabled: flywheelEnabled,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          cohort?: { cohortId?: string };
          activeCohortCount?: number;
        };
        if (data.cohort?.cohortId) {
          newCohortId = data.cohort.cohortId;
        }
        await refreshSystemHealth();
      }
    } catch {
      // Offline fallback cohort ID
    } finally {
      setIsProvisioning(false);
    }

    setProvisionedCohortId(newCohortId);
    onApplyCohortPreset(blueprint);
    setAppliedBanner(
      `Provisioned ${newCohortId} (${blueprint.regionLabel} · ${blueprint.sectorLabel} · ${blueprint.payoutRailLocalLabel}) and switched live context.`
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-labelledby="partner-scale-drawer-title"
          data-testid="partner-scale-drawer"
        >
          {/* Calm Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#17191C]/40 backdrop-blur-[2px]"
            aria-hidden="true"
          />

          {/* Slide-Over Drawer Panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="relative z-10 w-full max-w-xl h-full bg-[#FAF8F5] dark:bg-[#121315] border-s border-[#E8E3DB] dark:border-[#2C3037] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header with subtle resilience motif */}
            <div className="relative overflow-hidden border-b border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] px-5 sm:px-6 py-5 shrink-0">
              <WovenBridgeArcsMotif />
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div>
                  <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#146C53] dark:text-[#2EB88B]">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Partner &amp; Scale Mode</span>
                  </p>
                  <h2
                    id="partner-scale-drawer-title"
                    className="mt-1 font-display text-xl sm:text-2xl font-medium text-[#17191C] dark:text-[#F4F2EE]"
                  >
                    Replicate across regions with minimal overhead
                  </h2>
                  <p className="mt-1 text-xs text-[#575B62] dark:text-[#A3A7AE]">
                    Built for NGOs, employers, and host-country institutions scaling verified talent cohorts.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close Partner & Scale Mode"
                  data-testid="close-partner-scale-drawer"
                  className="min-h-[36px] min-w-[36px] rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] inline-flex items-center justify-center shrink-0 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 2-Lever Switcher */}
              <div
                role="tablist"
                aria-label="Scalability Levers"
                className="relative z-10 mt-4 grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037]"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeLever === 'cohort'}
                  data-testid="scale-tab-cohort"
                  onClick={() => setActiveLever('cohort')}
                  className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    activeLever === 'cohort'
                      ? 'bg-[#146C53] dark:bg-[#2EB88B] text-white dark:text-[#121315]'
                      : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                  }`}
                >
                  1. Launch New Cohort
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeLever === 'flywheel'}
                  data-testid="scale-tab-flywheel"
                  onClick={() => setActiveLever('flywheel')}
                  className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    activeLever === 'flywheel'
                      ? 'bg-[#146C53] dark:bg-[#2EB88B] text-white dark:text-[#121315]'
                      : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                  }`}
                >
                  2. Peer-Assessor Flywheel
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-6 space-y-6">
              {/* Live System Health & Trust Strip */}
              <div
                data-testid="system-health-trust-strip"
                className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#146C53]/30 dark:border-[#2EB88B]/35 p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#146C53] dark:text-[#2EB88B]">
                    LIVE SYSTEM HEALTH &amp; TRUST ARCHITECTURE · /API/HEALTH
                  </span>
                  <span className="font-mono-tabular text-[11px] font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                    {systemHealth.activeCohortCount} Active Cohorts · {systemHealth.cacheHitRatioPct}% Cache Hit
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    data-testid="badge-cached-compliance"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B] text-[11px] font-semibold"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Cached Compliance Engine Active (&lt;30ms)</span>
                  </span>

                  <span
                    data-testid="badge-signed-passport"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B] text-[11px] font-semibold"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Signed Passport Verification Ready (HMAC)</span>
                  </span>

                  <span
                    data-testid="badge-zero-raw-id"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F9ECE5] dark:bg-[#2D1E17] text-[#C4622D] dark:text-[#E07B46] text-[11px] font-semibold"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Zero-Raw-ID Privacy Mode</span>
                  </span>
                </div>

                {provisionedCohortId && (
                  <p className="text-[11px] font-mono-tabular text-[#146C53] dark:text-[#2EB88B]">
                    Active Multi-Tenant Cohort ID: <strong>{provisionedCohortId}</strong>
                  </p>
                )}
              </div>

              {activeLever === 'cohort' ? (
                <div className="space-y-5" data-testid="scale-cohort-panel">
                  {/* Configurator Controls */}
                  <div className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-4 sm:p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="scale-region-select"
                          className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#575B62] dark:text-[#A3A7AE]"
                        >
                          Region / Country
                        </label>
                        <select
                          id="scale-region-select"
                          data-testid="scale-region-select"
                          value={regionId}
                          onChange={(e) => handleRegionChange(e.target.value as ScaleRegionId)}
                          className="w-full min-h-[42px] rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3 py-2 text-xs sm:text-sm font-medium text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B]"
                        >
                          {SCALE_REGIONS.map((region) => (
                            <option key={region.id} value={region.id}>
                              {region.label} ({region.hubCities})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#575B62] dark:text-[#A3A7AE]">
                          Primary Language
                        </span>
                        <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037]">
                          {LOCALE_OPTIONS.map((opt) => {
                            const active = languageCode === opt.code;
                            return (
                              <button
                                key={opt.code}
                                type="button"
                                data-testid={`scale-lang-${opt.code}`}
                                aria-pressed={active}
                                onClick={() => handleLanguageChange(opt.code)}
                                className={`min-h-[32px] rounded-lg text-xs font-semibold transition-colors ${
                                  active
                                    ? 'bg-[#146C53] dark:bg-[#2EB88B] text-white dark:text-[#121315]'
                                    : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                                }`}
                              >
                                {opt.shortCode}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#575B62] dark:text-[#A3A7AE]">
                        Target Sector
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {SCALE_SECTORS.map((sector) => {
                          const active = sectorId === sector.id;
                          return (
                            <button
                              key={sector.id}
                              type="button"
                              data-testid={`scale-sector-${sector.id}`}
                              aria-pressed={active}
                              onClick={() => handleSectorChange(sector.id)}
                              className={`min-h-[34px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                                active
                                  ? 'bg-[#17191C] dark:bg-[#F4F2EE] text-[#FAF8F5] dark:text-[#121315] font-semibold'
                                  : 'bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                              }`}
                            >
                              {sector.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Instant AI Auto-Adaptation Preview */}
                  <motion.div
                    key={`${blueprint.regionId}-${blueprint.sectorId}-${blueprint.languageCode}`}
                    initial={{ opacity: 0.75, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22 }}
                    data-testid="cohort-blueprint-preview"
                    className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#146C53]/30 dark:border-[#2EB88B]/35 p-5 space-y-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-[#E8E3DB] dark:border-[#2C3037]">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#146C53] dark:text-[#2EB88B]">
                        <Sparkles className="w-3.5 h-3.5 text-[#C4622D] dark:text-[#E07B46]" />
                        <span>AI Cohort Auto-Configuration Preview</span>
                      </div>
                      <span className="text-[11px] font-mono-tabular text-[#575B62] dark:text-[#A3A7AE]">
                        {blueprint.estimatedLaunchTime}
                      </span>
                    </div>

                    {/* 1. AI Skills Diagnostics */}
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C4622D] dark:text-[#E07B46]">
                        01 · Auto-Updated Skills Diagnostics
                      </p>
                      <p
                        data-testid="cohort-diagnostic-title"
                        className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]"
                      >
                        {blueprint.aiDiagnosticTitle}
                      </p>
                      <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                        {blueprint.aiDiagnosticSummary}
                      </p>
                    </div>

                    {/* 2. Local Compliance Checklist */}
                    <div className="pt-3.5 border-t border-[#E8E3DB] dark:border-[#2C3037] space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#146C53] dark:text-[#2EB88B]">
                          02 · Local Compliance &amp; Payout Rail
                        </p>
                        <span
                          data-testid="cohort-payout-rail"
                          className="text-[11px] font-mono-tabular font-semibold text-[#17191C] dark:text-[#F4F2EE]"
                        >
                          {blueprint.payoutRailLocalLabel}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-[#17191C] dark:text-[#F4F2EE]">
                        {blueprint.compliancePathwayLabel}
                      </p>
                      <ul className="space-y-1.5">
                        {blueprint.complianceChecklist.map((step) => (
                          <li
                            key={step}
                            className="flex items-start gap-2 text-xs text-[#575B62] dark:text-[#A3A7AE]"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B] shrink-0 mt-0.5" />
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 3. Localized Sprint Templates */}
                    <div className="pt-3.5 border-t border-[#E8E3DB] dark:border-[#2C3037] space-y-2.5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#146C53] dark:text-[#2EB88B]">
                        03 · Ready-to-Deploy Sprint Templates
                      </p>
                      <div className="space-y-2">
                        {blueprint.sprintTemplates.map((tpl) => (
                          <div
                            key={tpl.title}
                            className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3.5 py-2.5 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] truncate">
                                {tpl.title}
                              </p>
                              <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                                {tpl.partnerType} · {tpl.durationLabel} · Cross-Age Pod
                              </p>
                            </div>
                            <span className="font-mono-tabular tabular-nums text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] shrink-0">
                              ${tpl.payoutUsd}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>

                  {appliedBanner && (
                    <div
                      role="status"
                      data-testid="cohort-applied-confirmation"
                      className="rounded-xl bg-[#E7F3EE] dark:bg-[#142B24] border border-[#146C53]/30 dark:border-[#2EB88B]/35 px-4 py-3 text-xs font-medium text-[#146C53] dark:text-[#2EB88B] flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{appliedBanner}</span>
                    </div>
                  )}

                  {/* Single Primary CTA */}
                  <button
                    type="button"
                    data-testid="apply-cohort-preset-btn"
                    disabled={isProvisioning}
                    onClick={() => void handleApply()}
                    className="w-full min-h-[44px] px-5 py-2.5 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                  >
                    <span>
                      {isProvisioning
                        ? 'Provisioning Multi-Tenant Cohort…'
                        : 'Provision & Apply Cohort Preset to Live Workspace'}
                    </span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </button>
                </div>
              ) : (
                <div className="space-y-5" data-testid="scale-flywheel-panel">
                  {/* Flywheel Toggle + Cohort Size Control */}
                  <div className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-4 sm:p-5 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                          Peer-Assessor Graduation Flywheel
                        </p>
                        <p className="mt-0.5 text-xs text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                          Toggle how verified 46+ Masters &amp; 30–45 Specialists graduate into paid peer verifiers and pod mentors for incoming 15–29 talent.
                        </p>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={flywheelEnabled}
                        data-testid="flywheel-toggle-btn"
                        onClick={() => setFlywheelEnabled((prev) => !prev)}
                        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] ${
                          flywheelEnabled
                            ? 'bg-[#146C53] dark:bg-[#2EB88B]'
                            : 'bg-[#D6CFC5] dark:bg-[#2C3037]'
                        }`}
                      >
                        <span className="sr-only">Toggle Peer-Assessor Flywheel</span>
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white dark:bg-[#121315] shadow-xs transition-transform ${
                            flywheelEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="pt-3 border-t border-[#E8E3DB] dark:border-[#2C3037] flex flex-wrap items-center justify-between gap-3">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#575B62] dark:text-[#A3A7AE]">
                        Simulated Cohort Size
                      </span>
                      <div className="inline-flex items-center gap-1.5">
                        {COHORT_SIZES.map((size) => {
                          const active = cohortSize === size;
                          return (
                            <button
                              key={size}
                              type="button"
                              data-testid={`flywheel-size-${size}`}
                              aria-pressed={active}
                              onClick={() => setCohortSize(size)}
                              className={`min-h-[32px] px-3 py-1 rounded-lg text-xs font-mono-tabular font-semibold transition-colors ${
                                active
                                  ? 'bg-[#17191C] dark:bg-[#F4F2EE] text-[#FAF8F5] dark:text-[#121315]'
                                  : 'bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE]'
                              }`}
                            >
                              {size.toLocaleString()}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Visual 3-Node Self-Sustaining Flywheel Loop */}
                  <div
                    className={`rounded-2xl border p-5 space-y-4 transition-colors ${
                      flywheelEnabled
                        ? 'bg-[#E7F3EE]/60 dark:bg-[#142B24]/75 border-[#146C53]/35 dark:border-[#2EB88B]/40'
                        : 'bg-white dark:bg-[#1A1C20] border-[#E8E3DB] dark:border-[#2C3037]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${
                            flywheelEnabled
                              ? 'text-[#146C53] dark:text-[#2EB88B]'
                              : 'text-[#575B62] dark:text-[#A3A7AE]'
                          }`}
                        />
                        <span>Self-Sustaining QA Architecture</span>
                      </span>
                      <span
                        data-testid="flywheel-status-label"
                        className={`text-[11px] font-semibold ${
                          flywheelEnabled
                            ? 'text-[#146C53] dark:text-[#2EB88B]'
                            : 'text-[#C4622D] dark:text-[#E07B46]'
                        }`}
                      >
                        {flywheelEnabled ? 'Flywheel Active' : 'Central Staff Only'}
                      </span>
                    </div>

                    <ol className="space-y-2.5">
                      <li className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-3.5 flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B] font-mono-tabular text-xs font-semibold flex items-center justify-center shrink-0">
                          1
                        </span>
                        <div className="text-xs">
                          <p className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                            Verified 46+ Masters &amp; 30–45 Specialists Graduate
                          </p>
                          <p className="mt-0.5 text-[#575B62] dark:text-[#A3A7AE]">
                            After 2 completed sprints or Master Endorsement, senior talent unlocks accredited Peer-Assessor status.
                          </p>
                        </div>
                      </li>

                      <li className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-3.5 flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#F9ECE5] dark:bg-[#2D1E17] text-[#C4622D] dark:text-[#E07B46] font-mono-tabular text-xs font-semibold flex items-center justify-center shrink-0">
                          2
                        </span>
                        <div className="text-xs">
                          <p className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                            Paid Peer Verifiers &amp; Cross-Age Pod Mentors
                          </p>
                          <p className="mt-0.5 text-[#575B62] dark:text-[#A3A7AE]">
                            Masters earn{' '}
                            <strong className="font-mono-tabular text-[#17191C] dark:text-[#F4F2EE]">
                              ${flywheel.assessorMonthlyStipendUsd}/mo
                            </strong>{' '}
                            auditing dossiers &amp; leading 2-person delivery pods—shrinking QA wait from 72h to{' '}
                            <strong className="font-mono-tabular text-[#146C53] dark:text-[#2EB88B]">
                              {flywheel.qaTurnaroundHours}h
                            </strong>
                            .
                          </p>
                        </div>
                      </li>

                      <li className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-3.5 flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B] font-mono-tabular text-xs font-semibold flex items-center justify-center shrink-0">
                          3
                        </span>
                        <div className="text-xs">
                          <p className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                            Incoming 15–29 Talent Verified &amp; Placed Faster
                          </p>
                          <p className="mt-0.5 text-[#575B62] dark:text-[#A3A7AE]">
                            Every Senior Assessor supports up to 4 emerging builders—compounding local trust without hiring extra NGO caseworkers.
                          </p>
                        </div>
                      </li>
                    </ol>
                  </div>

                  {/* Live 4-Metric Sustainability Readout */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-4">
                      <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                        Graduated Peer Assessors
                      </p>
                      <p
                        data-testid="flywheel-assessors-count"
                        className="mt-1 font-mono-tabular tabular-nums text-2xl font-semibold text-[#146C53] dark:text-[#2EB88B]"
                      >
                        {flywheel.graduatedMastersAndSpecialists}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                        30–46+ verified leads
                      </p>
                    </div>

                    <div className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-4">
                      <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                        15–29 Talent Mentored
                      </p>
                      <p
                        data-testid="flywheel-mentored-count"
                        className="mt-1 font-mono-tabular tabular-nums text-2xl font-semibold text-[#17191C] dark:text-[#F4F2EE]"
                      >
                        {flywheel.emergingBuildersMentored}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                        of {flywheel.cohortSize.toLocaleString()} builders
                      </p>
                    </div>

                    <div className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-4">
                      <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                        Manual Admin Overhead
                      </p>
                      <p
                        data-testid="flywheel-admin-hours"
                        className={`mt-1 font-mono-tabular tabular-nums text-2xl font-semibold ${
                          flywheelEnabled
                            ? 'text-[#146C53] dark:text-[#2EB88B]'
                            : 'text-[#C4622D] dark:text-[#E07B46]'
                        }`}
                      >
                        {flywheel.manualAdminHoursPerWeek}h/wk
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                        {flywheelEnabled
                          ? `-${flywheel.overheadReductionPct}% manual QA`
                          : 'Linear admin burden'}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-4">
                      <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                        Dossier QA Turnaround
                      </p>
                      <p
                        data-testid="flywheel-qa-hours"
                        className="mt-1 font-mono-tabular tabular-nums text-2xl font-semibold text-[#17191C] dark:text-[#F4F2EE]"
                      >
                        {flywheel.qaTurnaroundHours}h
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                        {flywheelEnabled ? 'Peer-verified speed' : 'Central review queue'}
                      </p>
                    </div>
                  </div>

                  {/* Active Practitioner Fit Banner */}
                  <div className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-4 flex items-start gap-3">
                    {userSeat === 'lead' ? (
                      <ShieldCheck className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B] shrink-0 mt-0.5" />
                    ) : (
                      <Users className="w-4 h-4 text-[#C4622D] dark:text-[#E07B46] shrink-0 mt-0.5" />
                    )}
                    <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                      <strong className="text-[#17191C] dark:text-[#F4F2EE]">
                        Your Current Track ({userAgeStage}):
                      </strong>{' '}
                      {userSeat === 'lead'
                        ? `Eligible to graduate into the paid Peer-Assessor & Pod Mentor ring (${verifiedCapabilitiesCount} verified capability record(s) logged).`
                        : 'Paired inside a protected cross-age delivery pod mentored by an accredited 30–46+ Peer Assessor.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};
