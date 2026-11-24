import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, X, Trash2, Clock, CheckCircle2, Lock } from 'lucide-react';
import type { AccessAuditLogEntry, ConsentGrant } from '../types/kora';

interface PrivacySharedAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  grants: ConsentGrant[];
  auditLogs: AccessAuditLogEntry[];
  onRevokeGrant: (consentId: string) => void;
}

export const PrivacySharedAccessModal: React.FC<PrivacySharedAccessModalProps> = ({
  isOpen,
  onClose,
  grants,
  auditLogs,
  onRevokeGrant,
}) => {
  if (!isOpen) return null;

  const activeGrants = grants.filter((g) => g.status === 'active');
  const revokedGrants = grants.filter((g) => g.status === 'revoked');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-4 sm:p-6 pt-16 sm:pt-20 overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="relative w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 sm:p-8 shadow-2xl space-y-6 my-4 sm:my-auto max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#E8E3DB] dark:border-[#2C3037]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[#146C53] dark:text-[#2EB88B]">
                Zero-Trust Consent Bridge
              </span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B]">
                Agency-First PII Protection
              </span>
            </div>
            <h3
              id="privacy-modal-title"
              className="font-serif text-xl sm:text-2xl font-semibold text-[#17191C] dark:text-[#F4F2EE] mt-1"
            >
              Privacy &amp; Shared Access Drawer
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full border border-[#E8E3DB] dark:border-[#2C3037] flex items-center justify-center text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
          You maintain total ownership of your competency dossier. Raw identity serial numbers, personal contact details, and Tab 5 relocation plans are strictly shielded unless you explicitly grant time-bound access. You can revoke access at any time with 1 click.
        </p>

        {/* Active Grants */}
        <div className="space-y-3">
          <h4 className="text-xs uppercase tracking-wider font-semibold text-[#17191C] dark:text-[#F4F2EE]">
            Active Sharing Grants ({activeGrants.length})
          </h4>
          {activeGrants.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#E8E3DB] dark:border-[#2C3037] p-5 text-center text-xs text-[#575B62] dark:text-[#A3A7AE]">
              No active sharing grants. When you click &ldquo;Apply with Living Proof&rdquo; in Tab 3 or share your dossier in Tab 5, active consents appear here.
            </div>
          ) : (
            <div className="space-y-3">
              {activeGrants.map((grant) => (
                <div
                  key={grant.consentId}
                  className="rounded-xl border border-[#146C53]/35 dark:border-[#2EB88B]/40 bg-[#E7F3EE]/50 dark:bg-[#142B24]/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B] shrink-0" />
                      <p className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE] truncate">
                        {grant.grantedToOrgName}
                      </p>
                      <span className="text-[10px] font-mono-tabular px-2 py-0.5 rounded bg-white dark:bg-[#1A1C20] text-[#146C53] dark:text-[#2EB88B] border border-[#146C53]/20">
                        {grant.consentId}
                      </span>
                    </div>
                    <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                      {grant.verifiedPassportSummary} · Shield Status: {grant.complianceShieldStatus}
                    </p>
                    <p className="text-[11px] font-mono-tabular text-[#575B62]">
                      Granted: {new Date(grant.grantedAtIso).toLocaleString()}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRevokeGrant(grant.consentId)}
                    data-testid={`revoke-grant-${grant.consentId}`}
                    className="min-h-[36px] px-3.5 py-1.5 rounded-lg bg-[#C4622D] hover:bg-[#AD5323] text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer shadow-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Revoke Access</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revoked Grants */}
        {revokedGrants.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-[#E8E3DB] dark:border-[#2C3037]">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-[#575B62] dark:text-[#A3A7AE]">
              Revoked Access ({revokedGrants.length})
            </h4>
            <div className="space-y-2">
              {revokedGrants.map((grant) => (
                <div
                  key={grant.consentId}
                  className="rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] p-3.5 flex items-center justify-between gap-3 opacity-75"
                >
                  <div className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                    <span className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                      {grant.grantedToOrgName}
                    </span>{' '}
                    ({grant.consentId}) — Revoked on {new Date(grant.revokedAtIso ?? grant.grantedAtIso).toLocaleDateString()}
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300">
                    Revoked
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Audit Log Section */}
        <div className="space-y-3 pt-4 border-t border-[#E8E3DB] dark:border-[#2C3037]">
          <div className="flex items-center justify-between">
            <h4 className="text-xs uppercase tracking-wider font-semibold text-[#17191C] dark:text-[#F4F2EE]">
              Live Audit Trail ({auditLogs.length} events)
            </h4>
            <span className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
              Verifiable accountability ledger
            </span>
          </div>

          <div
            data-testid="privacy-audit-log-list"
            className="max-h-48 overflow-y-auto space-y-2 pr-1"
          >
            {auditLogs.length === 0 ? (
              <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] text-center py-4">
                No audit events recorded yet.
              </p>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.entryId}
                  className="rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] p-3 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[#146C53] dark:text-[#2EB88B]">
                      {log.action}
                    </span>
                    <span className="font-mono-tabular text-[10px] text-[#575B62] dark:text-[#A3A7AE]">
                      {new Date(log.timestampIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[#17191C] dark:text-[#F4F2EE] font-mono-tabular text-[11px]">
                    {log.details}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-[#E8E3DB] dark:border-[#2C3037] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-5 py-2 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold cursor-pointer"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
