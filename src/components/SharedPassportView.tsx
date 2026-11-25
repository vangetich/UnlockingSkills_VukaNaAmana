import React from 'react';
import { ArrowLeft, CheckCircle2, Lock, Quote, ShieldCheck } from 'lucide-react';
import type { SharedPassportPayload } from '../types/kora';
import { TopographicAscentMotif } from './ResilienceMotifs';

interface SharedPassportViewProps {
  payload: SharedPassportPayload;
  onExit: () => void;
}

export const SharedPassportView: React.FC<SharedPassportViewProps> = ({ payload, onExit }) => {
  return (
    <div
      data-testid="shared-passport-readonly-view"
      className="min-h-screen bg-[#FAF8F5] dark:bg-[#121315] text-[#17191C] dark:text-[#F4F2EE] flex flex-col"
    >
      {/* Official Brand Header with bridge.jpeg */}
      <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 dark:bg-[#121315]/95 backdrop-blur-sm border-b border-[#E8E3DB] dark:border-[#2C3037]">
        <div className="max-w-4xl mx-auto h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onExit}
            aria-label="Return to Vuka na Amana"
            className="flex items-center gap-2.5 sm:gap-3 shrink-0 min-w-0 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B] rounded-md"
          >
            <img
              src="/bridge.jpeg"
              alt="Vuka na Amana Bridge Logo"
              className="h-6 max-w-[68px] sm:h-7 sm:max-w-[84px] w-auto object-contain rounded-md shrink-0"
            />
            <div className="leading-tight min-w-0">
              <span className="block font-display text-[15px] sm:text-lg font-semibold tracking-tight text-[#17191C] dark:text-[#F4F2EE] whitespace-nowrap">
                Vuka na Amana
              </span>
              <span className="hidden sm:block text-[10px] font-medium uppercase tracking-[0.14em] text-[#575B62] dark:text-[#A3A7AE] whitespace-nowrap">
                Crossing Over
              </span>
            </div>
          </button>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E7F3EE] dark:bg-[#142B24] border border-[#146C53]/30 dark:border-[#2EB88B]/35 text-[11px] font-semibold text-[#146C53] dark:text-[#2EB88B] whitespace-nowrap shrink-0">
            <Lock className="w-3 h-3" />
            <span>Read-Only Verified Passport</span>
          </span>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        <article className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#146C53]/35 dark:border-[#2EB88B]/40 p-6 sm:p-10 space-y-8">
          <TopographicAscentMotif />

          {/* Header Summary */}
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-[#E8E3DB] dark:border-[#2C3037]">
            <div>
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-[#146C53] dark:text-[#2EB88B]">
                <ShieldCheck className="w-4 h-4" />
                <span>Living Competency Passport · {payload.studioDomain}</span>
              </p>
              <h1 className="mt-2 font-display text-2xl sm:text-3xl font-medium tracking-tight text-[#17191C] dark:text-[#F4F2EE]">
                {payload.practitionerName}
              </h1>
              <p className="mt-1 text-sm sm:text-base font-medium text-[#C4622D] dark:text-[#E07B46]">
                {payload.fieldMatch}
              </p>
              <p className="mt-1 text-xs text-[#575B62] dark:text-[#A3A7AE]">
                {payload.ageStageTrack} · {payload.verifiedCapabilitiesCount} confirmed capability proof(s)
              </p>
            </div>

            <div className="text-xs font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE] sm:text-end shrink-0 space-y-1">
              <div className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                {payload.readOnlySignature}
              </div>
              <div>Issued {new Date(payload.generatedAtIso).toLocaleDateString()}</div>
              <div className="text-[11px] text-[#146C53] dark:text-[#2EB88B]">
                External Read-Only Record
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <p className="relative z-10 text-sm sm:text-base leading-relaxed text-[#17191C] dark:text-[#F4F2EE]">
            {payload.executiveSummary}
          </p>

          {/* Verified Core Skills */}
          <div className="relative z-10 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#575B62] dark:text-[#A3A7AE]">
              Verified Problem-Solving Capabilities
            </h2>
            <div className="divide-y divide-[#E8E3DB] dark:divide-[#2C3037] border-t border-b border-[#E8E3DB] dark:border-[#2C3037]">
              {payload.verifiedSkills.map((skill) => (
                <div
                  key={skill.name}
                  className="py-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE] inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B] shrink-0" />
                      <span>{skill.name}</span>
                    </p>
                    <p className="mt-1 text-xs text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                      {skill.evidenceNote}
                    </p>
                  </div>
                  <span className="font-mono-tabular tabular-nums text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] whitespace-nowrap shrink-0">
                    {skill.confidenceLabel} · {skill.confidenceScore}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Peer Endorsements */}
          {payload.verifiedEndorsements.length > 0 && (
            <div className="relative z-10 space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#575B62] dark:text-[#A3A7AE]">
                Verified Collaborator Endorsements
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {payload.verifiedEndorsements.map((end, idx) => (
                  <blockquote
                    key={`${end.collaboratorName}-${idx}`}
                    className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-4 space-y-2"
                  >
                    <Quote className="w-4 h-4 text-[#C4622D] dark:text-[#E07B46]" />
                    <p className="text-xs sm:text-sm text-[#17191C] dark:text-[#F4F2EE] leading-relaxed">
                      &ldquo;{end.endorsementText}&rdquo;
                    </p>
                    <footer className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                      <strong className="text-[#17191C] dark:text-[#F4F2EE]">
                        {end.collaboratorName}
                      </strong>{' '}
                      · {end.collaboratorRole}, {end.organization}
                    </footer>
                  </blockquote>
                ))}
              </div>
            </div>
          )}

          {/* Micro-Bridging Track */}
          {payload.microBridge.title && (
            <div className="relative z-10 rounded-xl bg-[#E7F3EE]/70 dark:bg-[#142B24]/80 border border-[#146C53]/25 dark:border-[#2EB88B]/30 p-5 space-y-1.5">
              <p className="text-xs font-semibold text-[#146C53] dark:text-[#2EB88B]">
                Targeted Micro-Bridging Pathway · {payload.microBridge.estimatedDuration}
              </p>
              <p className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                {payload.microBridge.title}
              </p>
              <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                {payload.microBridge.action}
              </p>
            </div>
          )}
        </article>

        <div className="flex justify-start">
          <button
            type="button"
            data-testid="exit-shared-passport-btn"
            onClick={onExit}
            className="min-h-[42px] px-4 py-2 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:bg-[#F2EEE8] dark:hover:bg-[#22252A] text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] inline-flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>Return to Vuka na Amana</span>
          </button>
        </div>
      </main>
    </div>
  );
};
