import React, { useMemo, useState } from 'react';
import { CheckCircle2, Download, FileSpreadsheet } from 'lucide-react';
import type { ContractPayout, WorkReadyVault } from '../types/kora';
import { getPayoutRailLabel } from '../utils/talentEngine';
import {
  buildComplianceReceiptPdfBytes,
  downloadPdfBlob,
  formatPayoutReceiptId,
} from '../utils/pdfReceipt';

interface PayoutTransactionLedgerProps {
  payouts: ContractPayout[];
  practitionerName: string;
  vault: WorkReadyVault;
}

export const PayoutTransactionLedger: React.FC<PayoutTransactionLedgerProps> = ({
  payouts,
  practitionerName,
  vault,
}) => {
  const [downloadedId, setDownloadedId] = useState<string | null>(null);

  const releasedPayouts = useMemo(
    () =>
      payouts
        .filter((p) => p.status === 'released')
        .sort((a, b) => Date.parse(b.updatedAtIso) - Date.parse(a.updatedAtIso)),
    [payouts]
  );

  const totalSettledUsd = useMemo(
    () => releasedPayouts.reduce((sum, p) => sum + p.amountUsd, 0),
    [releasedPayouts]
  );

  const handleDownloadPdfReceipt = (payout: ContractPayout) => {
    const receiptId = formatPayoutReceiptId(payout);
    const pdfBytes = buildComplianceReceiptPdfBytes({
      payout,
      practitionerName,
      hostCountry: vault.onboardingHostCountry || 'Kenya / Regional Hub',
      contractingStructure: vault.onboardingContractStructure || 'scoped-remote',
    });
    downloadPdfBlob(pdfBytes, `${receiptId.toLowerCase()}.pdf`);
    setDownloadedId(payout.id);
    window.setTimeout(() => {
      setDownloadedId((current) => (current === payout.id ? null : current));
    }, 2600);
  };

  return (
    <section
      aria-labelledby="payout-ledger-heading"
      data-testid="payout-transaction-ledger"
      className="rounded-2xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-5 sm:p-7 space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#E8E3DB] dark:border-[#2C3037]">
        <div>
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#146C53] dark:text-[#2EB88B]">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Audit &amp; Finance Record-Keeping</span>
          </p>
          <h2
            id="payout-ledger-heading"
            className="mt-1 font-display text-xl sm:text-2xl font-medium text-[#17191C] dark:text-[#F4F2EE]"
          >
            Payout Transaction Ledger
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#575B62] dark:text-[#A3A7AE]">
            Completed sprint disbursements ready for finance audit and compliant PDF receipt export.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono-tabular tabular-nums shrink-0">
          <div>
            <span className="block text-[#575B62] dark:text-[#A3A7AE]">Settled Records</span>
            <span className="text-base font-semibold text-[#17191C] dark:text-[#F4F2EE]">
              {releasedPayouts.length}
            </span>
          </div>
          <div className="h-7 w-px bg-[#E8E3DB] dark:bg-[#2C3037]" aria-hidden="true" />
          <div>
            <span className="block text-[#575B62] dark:text-[#A3A7AE]">Total Settled</span>
            <span className="text-base font-semibold text-[#146C53] dark:text-[#2EB88B]">
              ${totalSettledUsd.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {releasedPayouts.length === 0 ? (
        <div
          data-testid="payout-ledger-empty"
          className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 text-center text-xs sm:text-sm text-[#575B62] dark:text-[#A3A7AE]"
        >
          No released payouts yet. Advance a contract payout to Released above to generate compliant PDF receipts.
        </div>
      ) : (
        <>
          {/* Desktop Ledger Table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] text-[11px] font-semibold uppercase tracking-wider text-[#575B62] dark:text-[#A3A7AE]">
                  <th className="py-3 px-4">Receipt Ref</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Sprint &amp; Partner</th>
                  <th className="py-3 px-4">Payout Rail</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Compliance Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E3DB] dark:divide-[#2C3037]">
                {releasedPayouts.map((payout) => {
                  const receiptId = formatPayoutReceiptId(payout);
                  const dateLabel = (payout.updatedAtIso || payout.createdAtIso).slice(0, 10);
                  const justSaved = downloadedId === payout.id;

                  return (
                    <tr
                      key={payout.id}
                      data-testid={`ledger-row-${payout.id}`}
                      className="hover:bg-[#FAF8F5]/70 dark:hover:bg-[#121315]/50 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono-tabular tabular-nums font-semibold text-[#17191C] dark:text-[#F4F2EE] whitespace-nowrap">
                        {receiptId}
                      </td>
                      <td className="py-3.5 px-4 font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE] whitespace-nowrap">
                        {dateLabel}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                          {payout.sprintTitle}
                        </p>
                        <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                          {payout.partnerOrg}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-[#575B62] dark:text-[#A3A7AE] whitespace-nowrap">
                        {getPayoutRailLabel(payout.payoutRail)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-tabular tabular-nums font-semibold text-[#146C53] dark:text-[#2EB88B] whitespace-nowrap">
                        ${payout.amountUsd.toLocaleString()} USD
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          data-testid={`download-pdf-receipt-${payout.id}`}
                          onClick={() => handleDownloadPdfReceipt(payout)}
                          className={`min-h-[34px] px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border transition-colors ${
                            justSaved
                              ? 'bg-[#E7F3EE] dark:bg-[#142B24] border-[#146C53]/35 dark:border-[#2EB88B]/40 text-[#146C53] dark:text-[#2EB88B]'
                              : 'bg-[#FAF8F5] dark:bg-[#121315] border-[#E8E3DB] dark:border-[#2C3037] text-[#17191C] dark:text-[#F4F2EE] hover:border-[#146C53] dark:hover:border-[#2EB88B]'
                          }`}
                        >
                          {justSaved ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>PDF Saved</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B]" />
                              <span>Download PDF Receipt</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List (Zero Horizontal Overflow) */}
          <div className="md:hidden space-y-3">
            {releasedPayouts.map((payout) => {
              const receiptId = formatPayoutReceiptId(payout);
              const dateLabel = (payout.updatedAtIso || payout.createdAtIso).slice(0, 10);
              const justSaved = downloadedId === payout.id;

              return (
                <article
                  key={payout.id}
                  data-testid={`ledger-mobile-card-${payout.id}`}
                  className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-mono-tabular tabular-nums font-semibold text-[#146C53] dark:text-[#2EB88B]">
                        {receiptId} · {dateLabel}
                      </p>
                      <h3 className="mt-0.5 text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                        {payout.sprintTitle}
                      </h3>
                      <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                        {payout.partnerOrg} · {getPayoutRailLabel(payout.payoutRail)}
                      </p>
                    </div>
                    <span className="text-sm font-mono-tabular tabular-nums font-semibold text-[#146C53] dark:text-[#2EB88B] shrink-0">
                      ${payout.amountUsd.toLocaleString()}
                    </span>
                  </div>

                  <button
                    type="button"
                    data-testid={`download-pdf-receipt-mobile-${payout.id}`}
                    onClick={() => handleDownloadPdfReceipt(payout)}
                    className="w-full min-h-[38px] px-3.5 py-2 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {justSaved ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B]" />
                        <span className="text-[#146C53] dark:text-[#2EB88B]">Receipt PDF Saved</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B]" />
                        <span>Download PDF Receipt</span>
                      </>
                    )}
                  </button>
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
};
