import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Check, Copy, Download, FileCheck2, Printer, X } from 'lucide-react';
import type {
  CompetencyPassport,
  PractitionerProfile,
  SkillCapability,
  WorkReadyVault,
} from '../types/kora';
import {
  buildSprintAgreementText,
  computeVaultReadiness,
  getAuthPathwayLabel,
  getContractTemplateLabel,
  getPayoutRailLabel,
} from '../utils/talentEngine';

interface SprintAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PractitionerProfile;
  capabilities: SkillCapability[];
  passport: CompetencyPassport | null;
  vault: WorkReadyVault;
  defaultSprintTitle: string;
  defaultPayoutUsd: number;
}

export const SprintAgreementModal: React.FC<SprintAgreementModalProps> = ({
  isOpen,
  onClose,
  profile,
  capabilities,
  passport,
  vault,
  defaultSprintTitle,
  defaultPayoutUsd,
}) => {
  const [partnerOrg, setPartnerOrg] = useState('MedGrid Field Partners');
  const [sprintTitle, setSprintTitle] = useState(defaultSprintTitle);
  const [payoutUsd, setPayoutUsd] = useState(String(defaultPayoutUsd));
  const [durationDays, setDurationDays] = useState('5');
  const [deliverableSummary, setDeliverableSummary] = useState(
    'Diagnostic assessment, verified remediation plan, and concise handover documentation.'
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const verifiedSkillsCount = useMemo(
    () => capabilities.filter((c) => c.verificationStatus !== 'pending').length,
    [capabilities]
  );

  const readiness = useMemo(() => computeVaultReadiness(vault), [vault]);

  const agreementText = useMemo(
    () =>
      buildSprintAgreementText({
        practitionerName: profile.displayName || 'Skilled Practitioner',
        partnerOrg,
        sprintTitle,
        deliverableSummary,
        payoutUsd: Math.max(50, Number(payoutUsd) || defaultPayoutUsd),
        durationDays: Math.max(1, Number(durationDays) || 5),
        vault,
        ageStage: profile.ageStage,
        verifiedSkillsCount,
        passportId: passport?.id ?? null,
      }),
    [
      profile.displayName,
      profile.ageStage,
      partnerOrg,
      sprintTitle,
      deliverableSummary,
      payoutUsd,
      defaultPayoutUsd,
      durationDays,
      vault,
      verifiedSkillsCount,
      passport?.id,
    ]
  );

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(agreementText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([agreementText], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'vuka-na-amana-compliant-sprint-agreement.txt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 sm:p-6 pt-16 sm:pt-20 bg-[#17191C]/55 dark:bg-black/75 backdrop-blur-xs overflow-y-auto"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sprint-agreement-modal-title"
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="w-full max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[85vh] flex flex-col rounded-2xl bg-[#FAF8F5] dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] shadow-2xl overflow-hidden my-4 sm:my-auto"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-white dark:bg-[#1A1C20] border-b border-[#E8E3DB] dark:border-[#2C3037] flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#146C53] dark:text-[#2EB88B]">
              <FileCheck2 className="w-4 h-4 shrink-0" />
              <span>
                {readiness.isFullyReady
                  ? 'Pre-Cleared · 3/3 Compliance Checks Verified'
                  : `${readiness.completedCount}/3 Readiness Checks Complete`}
              </span>
            </div>
            <h2
              id="sprint-agreement-modal-title"
              className="mt-1 font-display text-xl font-medium text-[#17191C] dark:text-[#F4F2EE]"
            >
              Compliant Sprint Agreement
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close agreement modal"
            className="min-h-[38px] min-w-[38px] rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] inline-flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 no-scrollbar space-y-5">
          {/* Selected Vault Terms Summary */}
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-4 text-xs">
            <div>
              <dt className="text-[#575B62] dark:text-[#A3A7AE]">Work Pathway</dt>
              <dd className="mt-0.5 font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                {getAuthPathwayLabel(vault.identityPathway)}
              </dd>
            </div>
            <div>
              <dt className="text-[#575B62] dark:text-[#A3A7AE]">Contract Template</dt>
              <dd className="mt-0.5 font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                {getContractTemplateLabel(vault.contractTemplate)}
              </dd>
            </div>
            <div>
              <dt className="text-[#575B62] dark:text-[#A3A7AE]">Payout Rail</dt>
              <dd className="mt-0.5 font-semibold text-[#146C53] dark:text-[#2EB88B]">
                {getPayoutRailLabel(vault.payoutRail)}
              </dd>
            </div>
          </dl>

          {/* Compact Customizable Sprint Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="agreement-partner-org"
                className="block text-xs font-medium text-[#575B62] dark:text-[#A3A7AE]"
              >
                Hiring Partner Organization
              </label>
              <input
                id="agreement-partner-org"
                type="text"
                value={partnerOrg}
                onChange={(e) => setPartnerOrg(e.target.value)}
                maxLength={100}
                className="w-full min-h-[42px] rounded-xl bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3.5 py-2 text-sm text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B]"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="agreement-sprint-title"
                className="block text-xs font-medium text-[#575B62] dark:text-[#A3A7AE]"
              >
                Sprint Title
              </label>
              <input
                id="agreement-sprint-title"
                type="text"
                value={sprintTitle}
                onChange={(e) => setSprintTitle(e.target.value)}
                maxLength={120}
                className="w-full min-h-[42px] rounded-xl bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3.5 py-2 text-sm text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B]"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="agreement-payout-usd"
                className="block text-xs font-medium text-[#575B62] dark:text-[#A3A7AE]"
              >
                Milestone Fee (USD)
              </label>
              <input
                id="agreement-payout-usd"
                type="number"
                min={50}
                max={25000}
                step={10}
                value={payoutUsd}
                onChange={(e) => setPayoutUsd(e.target.value)}
                className="w-full min-h-[42px] rounded-xl bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3.5 py-2 text-sm font-mono-tabular tabular-nums text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B]"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="agreement-days"
                className="block text-xs font-medium text-[#575B62] dark:text-[#A3A7AE]"
              >
                Target Window (Business Days)
              </label>
              <input
                id="agreement-days"
                type="number"
                min={1}
                max={60}
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                className="w-full min-h-[42px] rounded-xl bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3.5 py-2 text-sm font-mono-tabular tabular-nums text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="agreement-deliverables"
              className="block text-xs font-medium text-[#575B62] dark:text-[#A3A7AE]"
            >
              Plain-Language Deliverable Scope
            </label>
            <textarea
              id="agreement-deliverables"
              rows={2}
              value={deliverableSummary}
              onChange={(e) => setDeliverableSummary(e.target.value)}
              maxLength={320}
              className="w-full rounded-xl bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3.5 py-2.5 text-sm text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B]"
            />
          </div>

          {/* Live Plain-Language Document Preview */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-[#575B62] dark:text-[#A3A7AE]">
              Ready-to-Sign Agreement Preview
            </p>
            <pre className="rounded-xl bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-4 text-xs font-mono-tabular leading-relaxed text-[#17191C] dark:text-[#F4F2EE] whitespace-pre-wrap overflow-x-auto max-h-60">
              {agreementText}
            </pre>
          </div>
        </div>

        {/* Footer — strictly 3 calm actions */}
        <div className="px-6 py-4 bg-white dark:bg-[#1A1C20] border-t border-[#E8E3DB] dark:border-[#2C3037] flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="min-h-[42px] px-4 py-2 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] hover:bg-[#F2EEE8] dark:hover:bg-[#22252A] text-xs font-medium text-[#17191C] dark:text-[#F4F2EE] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="min-h-[42px] px-4 py-2 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] hover:bg-[#F2EEE8] dark:hover:bg-[#22252A] text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B]" />
                <span className="text-[#146C53] dark:text-[#2EB88B]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Text</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="min-h-[42px] px-5 py-2 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Agreement</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
