import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Lock,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import type { WorkReadyVault, WorkSetupPreferenceId } from '../types/kora';
import { WORK_SETUP_PREFERENCE_OPTIONS } from '../utils/talentEngine';

interface WorkSetupPreferencesCardProps {
  vault?: WorkReadyVault;
  onUpdateVault?: (next: WorkReadyVault) => void;
  onJumpToStipendPool?: () => void;
  contextLabel?: 'solve' | 'cleared';
}

export const WorkSetupPreferencesCard: React.FC<WorkSetupPreferencesCardProps> = ({
  vault,
  onUpdateVault,
  onJumpToStipendPool,
  contextLabel = 'solve',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedPrefs: WorkSetupPreferenceId[] = vault?.workSetupPreferences ?? [];
  const shareWithPartners = Boolean(vault?.shareWorkSetupWithPartners);
  const assistiveStipendChecked = selectedPrefs.includes('assistive-tech-stipend');

  const handleTogglePreference = (prefId: WorkSetupPreferenceId) => {
    if (!vault || !onUpdateVault) return;
    const exists = selectedPrefs.includes(prefId);
    const nextPrefs = exists
      ? selectedPrefs.filter((id) => id !== prefId)
      : [...selectedPrefs, prefId];
    onUpdateVault({
      ...vault,
      workSetupPreferences: nextPrefs,
      updatedAtIso: new Date().toISOString(),
    });
  };

  const handleToggleConsentShare = (checked: boolean) => {
    if (!vault || !onUpdateVault) return;
    onUpdateVault({
      ...vault,
      shareWorkSetupWithPartners: checked,
      updatedAtIso: new Date().toISOString(),
    });
  };

  return (
    <section
      aria-labelledby={`work-setup-heading-${contextLabel}`}
      data-testid={`work-setup-preferences-card-${contextLabel}`}
      className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] overflow-hidden"
    >
      {/* Compact Collapsible Header */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls={`work-setup-panel-${contextLabel}`}
        data-testid={`work-setup-toggle-btn-${contextLabel}`}
        className="w-full min-h-[56px] px-5 sm:px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-[#FAF8F5]/75 dark:hover:bg-[#121315]/60 transition-colors cursor-pointer"
      >
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B] flex items-center justify-center shrink-0">
            <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3
                id={`work-setup-heading-${contextLabel}`}
                className="font-display text-base sm:text-lg font-medium text-[#17191C] dark:text-[#F4F2EE]"
              >
                How I Work Best — Practical Work Setup
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-[0.12em] bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE]">
                Optional · Private by Default
              </span>
            </div>
            <p className="mt-0.5 text-xs text-[#575B62] dark:text-[#A3A7AE]">
              {selectedPrefs.length > 0
                ? `${selectedPrefs.length} practical preference${selectedPrefs.length === 1 ? '' : 's'} saved${
                    shareWithPartners
                      ? ' · Included in future VNA-GRANT dossiers'
                      : ' · Saved locally only (not shared)'
                  }`
                : 'Choose practical work conditions that help you do your best work. Never asks for personal or medical details.'}
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] shrink-0">
          <span className="hidden sm:inline">{isOpen ? 'Hide' : 'Configure'}</span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-4 h-4" aria-hidden="true" />
          )}
        </span>
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div
          id={`work-setup-panel-${contextLabel}`}
          data-testid={`work-setup-panel-${contextLabel}`}
          className="px-5 sm:px-6 pb-6 pt-2 border-t border-[#E8E3DB] dark:border-[#2C3037] space-y-5 bg-[#FAF8F5]/55 dark:bg-[#121315]/45"
        >
          {/* Privacy & Dignity Rule Banner */}
          <div className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#146C53]/25 dark:border-[#2EB88B]/30 px-4 py-3 flex items-start gap-2.5 text-xs text-[#43484E] dark:text-[#C4C9D0]">
            <Lock
              className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B] shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <p className="leading-relaxed">
              <strong className="text-[#17191C] dark:text-[#F4F2EE]">
                Dignity &amp; Privacy First (ILO Inclusive Work Standard):
              </strong>{' '}
              This checklist focuses strictly on practical setup conditions—never personal or health disclosures. Everything is optional and stays private unless you explicitly opt in below.
            </p>
          </div>

          {/* 6 Practical Work-Setup Checkboxes */}
          <fieldset className="space-y-2.5">
            <legend className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#575B62] dark:text-[#A3A7AE]">
              Select Practical Conditions That Help You Deliver Your Best Work
            </legend>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {WORK_SETUP_PREFERENCE_OPTIONS.map((opt) => {
                const checked = selectedPrefs.includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    data-testid={`work-setup-option-${opt.id}`}
                    className={`min-h-[48px] rounded-xl border p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                      checked
                        ? 'bg-[#E7F3EE]/70 dark:bg-[#142B24]/75 border-[#146C53]/45 dark:border-[#2EB88B]/50'
                        : 'bg-white dark:bg-[#1A1C20] border-[#E8E3DB] dark:border-[#2C3037] hover:border-[#146C53]/30'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!vault || !onUpdateVault}
                      onChange={() => handleTogglePreference(opt.id)}
                      className="mt-0.5 w-4 h-4 rounded border-[#146C53] text-[#146C53] focus:ring-[#146C53] shrink-0 cursor-pointer"
                    />
                    <div className="min-w-0">
                      <span className="block text-xs sm:text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE] leading-snug">
                        {opt.label}
                      </span>
                      <span className="block mt-0.5 text-[11px] text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                        {opt.helperText}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* Seamless Link to Partner Fee-Waiver / Enablement Stipend Pool */}
          {assistiveStipendChecked && (
            <div
              role="status"
              data-testid="assistive-stipend-pool-banner"
              className="rounded-xl bg-[#FFF3EC] dark:bg-[#2A1D15] border border-[#C4622D]/30 dark:border-[#E07B46]/35 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-2.5 text-xs text-[#17191C] dark:text-[#F4F2EE]">
                <Sparkles
                  className="w-4 h-4 text-[#C4622D] dark:text-[#E07B46] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div className="space-y-0.5">
                  <p className="font-semibold text-[#C4622D] dark:text-[#E07B46]">
                    Linked to Partner Fee-Waiver &amp; Enablement Stipend Pool
                  </p>
                  <p className="text-[#575B62] dark:text-[#C4C9D0] leading-relaxed">
                    Your sprint applications can include zero-cost enablement support for screen-reader licenses, ergonomic workspace gear, or mobile data bundles—funded through Partner &amp; UN SDG 8/10 stipend pools.
                  </p>
                </div>
              </div>
              {onJumpToStipendPool && (
                <button
                  type="button"
                  onClick={onJumpToStipendPool}
                  className="min-h-[38px] px-3.5 py-2 rounded-xl bg-[#C4622D] hover:bg-[#A65124] dark:bg-[#E07B46] dark:hover:bg-[#CE6A36] text-white dark:text-[#121315] text-xs font-semibold shrink-0 transition-colors cursor-pointer"
                >
                  View Stipend Pool
                </button>
              )}
            </div>
          )}

          {/* Explicit Consent Bridge Opt-In Toggle */}
          <div className="pt-3 border-t border-[#E8E3DB] dark:border-[#2C3037] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label
              data-testid={`work-setup-consent-toggle-label-${contextLabel}`}
              className="flex items-start gap-2.5 cursor-pointer text-xs text-[#17191C] dark:text-[#F4F2EE]"
            >
              <input
                type="checkbox"
                checked={shareWithPartners}
                disabled={!vault || !onUpdateVault || selectedPrefs.length === 0}
                onChange={(e) => handleToggleConsentShare(e.target.checked)}
                data-testid={`work-setup-consent-toggle-${contextLabel}`}
                className="mt-0.5 w-4 h-4 rounded border-[#146C53] text-[#146C53] focus:ring-[#146C53] shrink-0 cursor-pointer disabled:opacity-50"
              />
              <span className="leading-relaxed">
                <strong className="font-semibold">
                  Share selected work-setup chips inside my VNA-GRANT-XXXX Hiring Partner dossiers
                </strong>
                <span className="block text-[11px] text-[#575B62] dark:text-[#A3A7AE] mt-0.5">
                  Off by default. Hiring Partners only see these practical chips when you explicitly check this box and submit a consented application.
                </span>
              </span>
            </label>

            {selectedPrefs.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#146C53] dark:text-[#2EB88B] shrink-0">
                {shareWithPartners ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Consent Active</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Saved Privately</span>
                  </>
                )}
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
