import React, { useState } from 'react';
import { Check, Copy, Download, MessageSquareQuote, Printer, ShieldCheck, X } from 'lucide-react';
import type {
  CompetencyPassport,
  PeerEndorsement,
  PractitionerProfile,
} from '../types/kora';

interface PassportPreviewModalProps {
  passport: CompetencyPassport;
  profile: PractitionerProfile;
  endorsements?: PeerEndorsement[];
  onClose: () => void;
}

export const PassportPreviewModal: React.FC<PassportPreviewModalProps> = ({
  passport,
  profile,
  endorsements = [],
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const verifiedEndorsements = endorsements.filter((e) => e.status === 'verified');

  const shareableText = [
    `VUKA NA AMANA — LIVING COMPETENCY PASSPORT`,
    `Practitioner: ${profile.displayName}`,
    `Track: ${passport.ageStageTrack}`,
    `Field Match: ${passport.fieldMatch}`,
    `Domain: ${passport.studioDomain}`,
    `Issued: ${new Date(passport.generatedAtIso).toLocaleDateString()}`,
    ``,
    `Summary: ${passport.executiveSummary}`,
    ``,
    `Verified Core Skills:`,
    ...passport.verifiedSkills.map(
      (s) => `- ${s.name} (${s.confidenceLabel} · ${s.confidenceScore}%) — ${s.evidenceNote}`
    ),
    ...(verifiedEndorsements.length > 0
      ? [
          ``,
          `Verified Peer Endorsements:`,
          ...verifiedEndorsements.map(
            (e) =>
              `- "${e.endorsementText}" — ${e.collaboratorName} (${e.collaboratorRole}, ${e.organization})`
          ),
        ]
      : []),
    ``,
    `Targeted Micro-Bridging Step: ${passport.microBridge.title} (${passport.microBridge.estimatedDuration})`,
    `Action: ${passport.microBridge.action}`,
    `Partner Fee-Waiver / Stipend Requested: ${passport.stipendEligible ? 'Yes' : 'No'}`,
  ].join('\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareableText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleDownloadJson = () => {
    const payload = {
      schema: 'vuka-na-amana.living-competency-passport.v1',
      practitioner: {
        displayName: profile.displayName,
        ageStage: profile.ageStage,
      },
      passport,
      verifiedPeerEndorsements: verifiedEndorsements.map((e) => ({
        collaboratorName: e.collaboratorName,
        collaboratorRole: e.collaboratorRole,
        organization: e.organization,
        capabilityTitle: e.capabilityTitle,
        endorsementText: e.endorsementText,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `vuka-passport-${passport.id}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="passport-export-title"
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="w-full max-w-2xl rounded-2xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] overflow-hidden my-auto">
        <div className="px-6 py-4 bg-white dark:bg-[#1A1C20] border-b border-[#E8E3DB] dark:border-[#2C3037] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[#146C53] dark:text-[#2EB88B]">
            <ShieldCheck className="w-4 h-4" />
            <h2
              id="passport-export-title"
              className="text-sm font-semibold tracking-tight text-[#17191C] dark:text-[#F4F2EE]"
            >
              Export Verified Living Competency Passport
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close passport preview"
            className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-[#575B62] dark:text-[#A3A7AE] hover:bg-[#F2EEE8] dark:hover:bg-[#22252A]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Credential Card Preview */}
        <div className="p-5 sm:p-6 space-y-6">
          <div className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-5 sm:p-7 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E8E3DB] dark:border-[#2C3037] pb-5">
              <div>
                <p className="text-xs font-semibold text-[#146C53] dark:text-[#2EB88B]">
                  Vuka na Amana Living Competency Passport · {passport.studioDomain}
                </p>
                <h3 className="font-display text-2xl font-medium mt-1 text-[#17191C] dark:text-[#F4F2EE]">
                  {profile.displayName}
                </h3>
                <p className="text-sm text-[#575B62] dark:text-[#A3A7AE] mt-1">
                  {passport.ageStageTrack} · {passport.fieldMatch}
                </p>
              </div>
              <div className="text-end text-xs font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE]">
                <div>ID: {passport.id}</div>
                <div className="mt-0.5">
                  {new Date(passport.generatedAtIso).toLocaleDateString()}
                </div>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-[#17191C] dark:text-[#F4F2EE]">
              {passport.executiveSummary}
            </p>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#575B62] dark:text-[#A3A7AE]">
                Verified Core Skills
              </p>
              <div className="divide-y divide-[#E8E3DB] dark:divide-[#2C3037] border-t border-b border-[#E8E3DB] dark:border-[#2C3037]">
                {passport.verifiedSkills.map((skill) => (
                  <div
                    key={skill.name}
                    className="py-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5"
                  >
                    <div>
                      <span className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                        {skill.name}
                      </span>
                      <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] mt-0.5">
                        {skill.evidenceNote}
                      </p>
                    </div>
                    <span className="text-xs font-mono-tabular tabular-nums font-medium text-[#146C53] dark:text-[#2EB88B] whitespace-nowrap shrink-0">
                      {skill.confidenceLabel} · {skill.confidenceScore}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {verifiedEndorsements.length > 0 && (
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-[#575B62] dark:text-[#A3A7AE]">
                  Verified Collaborator Endorsements ({verifiedEndorsements.length})
                </p>
                <div className="space-y-2">
                  {verifiedEndorsements.slice(0, 3).map((e) => (
                    <div
                      key={e.id}
                      className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-3.5 text-xs space-y-1"
                    >
                      <p className="text-[#17191C] dark:text-[#F4F2EE] flex items-start gap-1.5 leading-relaxed">
                        <MessageSquareQuote className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B] shrink-0 mt-0.5" />
                        <span>“{e.endorsementText}”</span>
                      </p>
                      <p className="text-[#575B62] dark:text-[#A3A7AE] ps-5">
                        — <strong className="text-[#17191C] dark:text-[#F4F2EE]">{e.collaboratorName}</strong>, {e.collaboratorRole} ({e.organization})
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl bg-[#E7F3EE]/70 dark:bg-[#142B24]/80 border border-[#146C53]/25 dark:border-[#2EB88B]/30 p-4 space-y-1.5">
              <p className="text-xs font-semibold text-[#146C53] dark:text-[#2EB88B]">
                Targeted Micro-Bridging Step · {passport.microBridge.estimatedDuration}
              </p>
              <p className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                {passport.microBridge.title}
              </p>
              <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                {passport.microBridge.action}
              </p>
              <p className="text-xs text-[#17191C] dark:text-[#F4F2EE] pt-1">
                Partner Fee-Waiver / Stipend Eligibility:{' '}
                <strong>
                  {passport.stipendEligible
                    ? `Enabled (${passport.microBridge.partnerProgram})`
                    : 'Not requested'}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="min-h-[42px] px-4 py-2 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:bg-[#F2EEE8] dark:hover:bg-[#22252A] text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Summary' : 'Copy Shareable Text'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadJson}
              className="min-h-[42px] px-4 py-2 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:bg-[#F2EEE8] dark:hover:bg-[#22252A] text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Credential JSON</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-[42px] px-5 py-2 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
