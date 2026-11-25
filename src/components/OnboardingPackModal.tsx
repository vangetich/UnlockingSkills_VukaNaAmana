import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Check,
  CheckCircle2,
  Copy,
  Download,
  FileCheck2,
  Loader2,
  Sparkles,
  X,
} from 'lucide-react';
import type {
  AgeStage,
  ContractingStructureOption,
  FinancialPayoutRail,
  IdentityDocumentTier,
  OnboardingPackResult,
  TargetWorkMode,
} from '../types/kora';
import {
  buildOnboardingPackTemplate,
  getContractingStructureLabel,
  getFinancialPayoutRailLabel,
} from '../utils/talentEngine';
import { buildPlainTextPdfBytes, downloadPdfBlob } from '../utils/pdfReceipt';

interface OnboardingPackModalProps {
  isOpen: boolean;
  onClose: () => void;
  practitionerName: string;
  ageStage: AgeStage;
  hostCountry: string;
  docTier: IdentityDocumentTier;
  workMode: TargetWorkMode;
  contractingStructure: ContractingStructureOption;
  selectedPayoutRail: FinancialPayoutRail;
  verifiedSkills: string[];
  passportFieldMatch?: string;
  passportId?: string | null;
  defaultPartnerOrg?: string;
  defaultSprintTitle?: string;
  defaultPayoutUsd?: number;
  onPackReady?: (details: {
    partnerOrg: string;
    contractingStructure: ContractingStructureOption;
    hostCountry: string;
  }) => void;
}

export const OnboardingPackModal: React.FC<OnboardingPackModalProps> = ({
  isOpen,
  onClose,
  practitionerName,
  ageStage,
  hostCountry,
  docTier,
  workMode,
  contractingStructure,
  selectedPayoutRail,
  verifiedSkills,
  passportFieldMatch,
  passportId,
  defaultPartnerOrg = 'Rift Valley Cold-Chain Co-op',
  defaultSprintTitle = '48V Cold-Storage & Solar Microgrid Diagnostics Sprint',
  defaultPayoutUsd = 480,
  onPackReady,
}) => {
  const [partnerOrg, setPartnerOrg] = useState(defaultPartnerOrg);
  const [sprintTitle, setSprintTitle] = useState(defaultSprintTitle);
  const [payoutUsd, setPayoutUsd] = useState(String(defaultPayoutUsd));
  const [pack, setPack] = useState<OnboardingPackResult | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateWithGeminiOrTemplate = async (
    orgInput: string,
    titleInput: string,
    feeInput: number
  ) => {
    const templatePack = buildOnboardingPackTemplate({
      practitionerName,
      ageStage,
      hostCountry,
      docTier,
      workMode,
      contractingStructure,
      partnerOrg: orgInput,
      sprintTitle: titleInput,
      payoutUsd: feeInput,
      selectedPayoutRail,
      verifiedSkills,
      passportFieldMatch,
      passportId,
    });
    setPack(templatePack);
    setAiNotice(null);
    setIsGeneratingAi(true);

    try {
      const response = await fetch('/api/compliance/onboarding-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostCountry,
          docTier,
          workMode,
          contractingStructure,
          practitionerName,
          ageStage,
          partnerOrg: orgInput,
          sprintTitle: titleInput,
          payoutUsd: feeInput,
          selectedPayoutRail,
          verifiedSkills,
          passportFieldMatch,
          passportId,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        pack?: OnboardingPackResult;
      };
      if (!response.ok || !data.pack) {
        throw new Error(data.error || 'Unable to reach Gemini onboarding pack endpoint.');
      }
      setPack(data.pack);
      setAiNotice(null);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Offline or AI quota reached.';
      setAiNotice(
        `Using instant ILO-grounded compliance agreement template (${msg.slice(0, 110)}).`
      );
    } finally {
      setIsGeneratingAi(false);
      onPackReady?.({
        partnerOrg: orgInput,
        contractingStructure,
        hostCountry,
      });
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const fee = Math.max(50, Number(payoutUsd) || defaultPayoutUsd);
    void generateWithGeminiOrTemplate(partnerOrg, sprintTitle, fee);
    // Intentionally trigger when modal opens or contracting inputs change while open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, contractingStructure, hostCountry, docTier, workMode, selectedPayoutRail]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activePack =
    pack ??
    buildOnboardingPackTemplate({
      practitionerName,
      ageStage,
      hostCountry,
      docTier,
      workMode,
      contractingStructure,
      partnerOrg,
      sprintTitle,
      payoutUsd: Math.max(50, Number(payoutUsd) || defaultPayoutUsd),
      selectedPayoutRail,
      verifiedSkills,
      passportFieldMatch,
      passportId,
    });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activePack.fullAgreementText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([activePack.fullAgreementText], {
      type: 'text/plain;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'vuka-na-amana-1page-onboarding-pack.txt');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDownloadPdf = () => {
    const bytes = buildPlainTextPdfBytes({
      title: activePack.agreementTitle,
      subtitle: `${partnerOrg} · ${hostCountry} · ${getFinancialPayoutRailLabel(selectedPayoutRail)}`,
      bodyText: activePack.fullAgreementText,
    });
    downloadPdfBlob(bytes, 'vuka-na-amana-1page-onboarding-pack.pdf');
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
        aria-labelledby="onboarding-pack-modal-title"
        data-testid="onboarding-pack-modal"
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="w-full max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[85vh] flex flex-col rounded-2xl bg-[#FAF8F5] dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] shadow-2xl overflow-hidden my-4 sm:my-auto"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-white dark:bg-[#1A1C20] border-b border-[#E8E3DB] dark:border-[#2C3037] flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#146C53] dark:text-[#2EB88B]">
              <FileCheck2 className="w-4 h-4 shrink-0" />
              <span>
                {activePack.source === 'ai'
                  ? 'Gemini AI Tailored · 1-Page Onboarding Pack'
                  : 'ILO-Grounded · 1-Page Onboarding Pack'}
              </span>
            </div>
            <h2
              id="onboarding-pack-modal-title"
              className="mt-1 font-display text-xl font-medium text-[#17191C] dark:text-[#F4F2EE]"
            >
              {activePack.agreementTitle}
            </h2>
          </div>

          <button
            type="button"
            data-testid="onboarding-pack-close-btn"
            onClick={onClose}
            aria-label="Close onboarding pack modal"
            className="min-h-[38px] min-w-[38px] rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] inline-flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 no-scrollbar space-y-5">
          {/* Status Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#E7F3EE]/80 dark:bg-[#142B24] border border-[#146C53]/30 dark:border-[#2EB88B]/35 px-4 py-2.5 text-xs">
            <span className="inline-flex items-center gap-1.5 font-semibold text-[#146C53] dark:text-[#2EB88B]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                Synced to Solve ("Pre-Cleared for Hiring Partners") &amp; Pulse (SDGs 8 &amp; 16)
              </span>
            </span>
            {isGeneratingAi && (
              <span className="inline-flex items-center gap-1.5 text-[#146C53] dark:text-[#2EB88B]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Refining via Gemini AI…</span>
              </span>
            )}
          </div>

          {aiNotice && (
            <p className="text-xs text-[#9A5B13] dark:text-[#F5B971] bg-[#FEF3C7]/60 dark:bg-[#2D220F] border border-[#C4622D]/25 rounded-lg px-3.5 py-2">
              {aiNotice}
            </p>
          )}

          {/* Executive Summary Grid */}
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-4 text-xs">
            <div>
              <dt className="text-[#575B62] dark:text-[#A3A7AE]">Contracting Mode</dt>
              <dd className="mt-0.5 font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                {getContractingStructureLabel(contractingStructure)}
              </dd>
            </div>
            <div>
              <dt className="text-[#575B62] dark:text-[#A3A7AE]">Host Jurisdiction</dt>
              <dd className="mt-0.5 font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                {hostCountry}
              </dd>
            </div>
            <div>
              <dt className="text-[#575B62] dark:text-[#A3A7AE]">Payout Rail</dt>
              <dd className="mt-0.5 font-semibold text-[#146C53] dark:text-[#2EB88B]">
                {getFinancialPayoutRailLabel(selectedPayoutRail)}
              </dd>
            </div>
          </dl>

          {/* Editable Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label
                htmlFor="pack-partner-org"
                className="block text-xs font-medium text-[#575B62] dark:text-[#A3A7AE]"
              >
                Hiring Partner Org
              </label>
              <input
                id="pack-partner-org"
                type="text"
                value={partnerOrg}
                onChange={(e) => setPartnerOrg(e.target.value)}
                maxLength={120}
                className="w-full min-h-[38px] rounded-lg bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3 py-1.5 text-xs text-[#17191C] dark:text-[#F4F2EE]"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="pack-sprint-title"
                className="block text-xs font-medium text-[#575B62] dark:text-[#A3A7AE]"
              >
                Sprint Scope
              </label>
              <input
                id="pack-sprint-title"
                type="text"
                value={sprintTitle}
                onChange={(e) => setSprintTitle(e.target.value)}
                maxLength={140}
                className="w-full min-h-[38px] rounded-lg bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3 py-1.5 text-xs text-[#17191C] dark:text-[#F4F2EE]"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="pack-payout-usd"
                className="block text-xs font-medium text-[#575B62] dark:text-[#A3A7AE]"
              >
                Milestone Fee (USD)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="pack-payout-usd"
                  type="number"
                  min={50}
                  max={50000}
                  value={payoutUsd}
                  onChange={(e) => setPayoutUsd(e.target.value)}
                  className="w-full min-h-[38px] rounded-lg bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3 py-1.5 text-xs font-mono-tabular tabular-nums text-[#17191C] dark:text-[#F4F2EE]"
                />
                <button
                  type="button"
                  disabled={isGeneratingAi}
                  data-testid="onboarding-pack-refresh-btn"
                  onClick={() =>
                    void generateWithGeminiOrTemplate(
                      partnerOrg,
                      sprintTitle,
                      Math.max(50, Number(payoutUsd) || defaultPayoutUsd)
                    )
                  }
                  className="min-h-[38px] px-3 py-1.5 rounded-lg border border-[#146C53]/35 dark:border-[#2EB88B]/40 text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] hover:bg-[#E7F3EE] dark:hover:bg-[#142B24] inline-flex items-center gap-1 shrink-0 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Update</span>
                </button>
              </div>
            </div>
          </div>

          {/* Structured Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-3.5 space-y-1">
              <p className="font-semibold text-[#146C53] dark:text-[#2EB88B]">
                Scope &amp; Skill Alignment
              </p>
              <p className="text-[#43484E] dark:text-[#C4C9D0] leading-relaxed">
                {activePack.scopeAndDeliverables}
              </p>
            </div>
            <div className="rounded-xl bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-3.5 space-y-1">
              <p className="font-semibold text-[#C4622D] dark:text-[#E07B46]">
                Fair-Pay Milestone Schedule
              </p>
              <p className="text-[#43484E] dark:text-[#C4C9D0] leading-relaxed">
                {activePack.fairPaySchedule}
              </p>
            </div>
          </div>

          {/* 1-Page Agreement Preview */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-[#575B62] dark:text-[#A3A7AE]">
              1-Page Sprint &amp; Compliance Agreement Preview
            </p>
            <pre
              data-testid="onboarding-pack-preview-text"
              className="rounded-xl bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-4 text-xs font-mono-tabular leading-relaxed text-[#17191C] dark:text-[#F4F2EE] whitespace-pre-wrap overflow-x-auto max-h-56"
            >
              {activePack.fullAgreementText}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white dark:bg-[#1A1C20] border-t border-[#E8E3DB] dark:border-[#2C3037] flex flex-wrap items-center justify-end gap-2.5">
          <button
            type="button"
            data-testid="onboarding-pack-copy-btn"
            onClick={handleCopy}
            className="min-h-[40px] px-4 py-2 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] hover:bg-[#F2EEE8] dark:hover:bg-[#22252A] text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B]" />
                <span className="text-[#146C53] dark:text-[#2EB88B]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Agreement</span>
              </>
            )}
          </button>

          <button
            type="button"
            data-testid="onboarding-pack-download-txt-btn"
            onClick={handleDownloadTxt}
            className="min-h-[40px] px-4 py-2 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] hover:bg-[#F2EEE8] dark:hover:bg-[#22252A] text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .txt</span>
          </button>

          <button
            type="button"
            data-testid="onboarding-pack-download-pdf-btn"
            onClick={handleDownloadPdf}
            className="min-h-[40px] px-5 py-2 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
