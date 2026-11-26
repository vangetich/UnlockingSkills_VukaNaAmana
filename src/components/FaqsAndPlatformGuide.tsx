import React, { useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Compass,
  HelpCircle,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export interface FaqsAndPlatformGuideProps {
  variant: 'unlock' | 'solve';
}

interface FaqItem {
  id: string;
  tag: string;
  question: string;
  answer: string;
  frameworkRef: string;
}

const UNLOCK_FAQS: FaqItem[] = [
  {
    id: 'how-crossing-over-works',
    tag: '5-STAGE PIPELINE',
    question: 'How does the Vuka na Amana 5-stage Crossing Over journey work?',
    answer:
      'Step 1 (Verify) converts spoken or written practical problem-solving into a server-signed Living Competency Passport (VNA-2026-XXXX) without paper diplomas. Step 2 (Unlock) clears work-authorization and FATF tiered-KYC payout rails. Step 3 (Solve) pairs your Living Proof Portfolio with paid Cross-Age Pod Sprints or 65%–90% Upskilling Bridges. Step 4 (Pulse) tracks live UN SDG impact and escrow payouts. Step 5 (Cleared) prepares a 3-year Durable Solutions & Mobility Dossier.',
    frameworkRef: 'UNESCO Qualifications Passport (UQP) · ILO RPL · UNHCR 2030',
  },
  {
    id: 'zero-raw-id-privacy',
    tag: 'WHO VERIFIES WHAT · PRIVACY BOUNDARY',
    question: 'Do I have to upload my raw national ID or refugee certificate serial number?',
    answer:
      'Never. Vuka na Amana enforces Zero-Raw-ID Privacy Mode and the Who Verifies What Privacy Boundary. You select your document tier only; raw serial numbers never appear to employers. Partners review Identity, Financial, and Contracting milestones individually before Stage 3 using consent tokens (VNA-GRANT-XXXX), Bulk Approve, live Access Audit Logs, and PDF/CSV compliance reports.',
    frameworkRef: 'UNHCR Data Protection Policy · SDG Target 16.9',
  },
  {
    id: 'fatf-tiered-kyc-payouts',
    tag: 'FINANCIAL INCLUSION',
    question: 'How can displaced talent receive milestone payouts without a traditional bank account?',
    answer:
      'Under FATF Risk-Based Tiered KYC guidelines and UNHCR Financial Inclusion standards, low-risk milestone disbursements ($50–$1,000 USD) settle compliantly through verified Mobile Money (M-Pesa, MTN, Airtel), Humanitarian Aid Cards, or Partner EOR Fiscal Hosts with full PDF receipt ledgers.',
    frameworkRef: 'FATF Tiered KYC Guidance · SDG Target 10.2',
  },
  {
    id: 'employer-liability-shield',
    tag: 'HIRING PARTNER SHIELD',
    question: 'How does the 1-Page Employer Liability Shield protect SMEs and NGOs?',
    answer:
      'Toggling to the Hiring Partner Compliance View generates a 1-Page Sprint & Compliance Agreement tailored to Direct Local Hire, Cross-Border Remote Contractor, or Partner EOR / Fiscal Host structures—paired with individual pre-Stage 3 verification, instant applicant feedback, and downloadable PDF compliance reports.',
    frameworkRef: 'ILO Guiding Principles on Labour Market Access',
  },
];

const SOLVE_FAQS: FaqItem[] = [
  {
    id: 'living-proof-portfolio',
    tag: 'LIVING PROOF',
    question: 'What makes a strong Living Proof Portfolio for local and remote employers?',
    answer:
      'Upload 1 to 3 clear photos of real work you have built, repaired, or organized (automatically compressed client-side for low-bandwidth field connections), add a 1-line caption of the problem you solved, and record a 30-second voice walkthrough. The engine evaluates both Local Hands-On and Remote Digital readiness.',
    frameworkRef: 'ILO Recognition of Prior Learning (RPL) · SDG 8',
  },
  {
    id: 'upskilling-bridge-65-90',
    tag: 'DEMAND-FIRST UPSKILLING',
    question: 'What happens when my portfolio is a 65%–90% match for a paid opportunity?',
    answer:
      'Instead of rejecting you, Vuka na Amana opens a "Close the Final Gap" Upskilling Bridge. It highlights 2 strengths you already prove, identifies the single missing practical skill, and lets you choose either (A) a 3–7 day fee-waived TVET/RPL micro-bridge or (B) a paid ILO Upgraded Apprenticeship Pod.',
    frameworkRef: 'UNESCO UQP · ILO Upgraded Apprenticeships',
  },
  {
    id: 'cross-age-pod-mentorship',
    tag: 'MENTORSHIP VS. SPRINT GUIDANCE',
    question: 'How do Cross-Age Delivery Pods, Formal Mentorship Tracks, and Sprint-Based Guidance work?',
    answer:
      'Every sprint pod pairs 15–29 Emerging Builders with 30–46+ Specialist Leads across refugee and host communities. Choose Formal Mentorship Tracks for structured multi-sprint growth with agendas, Growth Roadmaps, and Tier 2/3 endorsements—or use spontaneous Sprint-Based Guidance inside the Mentor Messaging Drawer for fast blocker and QA help.',
    frameworkRef: 'UN Global Compact on Refugees · Social Cohesion',
  },
  {
    id: 'offline-pwa-email-sync',
    tag: 'OFFLINE PWA & STAGE 5 CLEARED',
    question: 'Does my progress save offline, and how does it feed Stage 5 (Cleared)?',
    answer:
      'Yes. Vuka na Amana is an Offline-Enabled PWA: capabilities, portfolio uploads, and sprint drafts save to your local queue and sync when connectivity returns. Verified sprints update Stage 4 (Pulse) SDG metrics and unlock Stage 5 (Cleared) for fee-free UNHCR Complementary Pathways and local Shirika Plan dossiers.',
    frameworkRef: 'Offline-First Resilience · UNHCR Pathways 2030',
  },
];

export const FaqsAndPlatformGuide: React.FC<FaqsAndPlatformGuideProps> = ({ variant }) => {
  const [sectionExpanded, setSectionExpanded] = useState(true);
  const [openItemId, setOpenItemId] = useState<string | null>(
    variant === 'unlock' ? UNLOCK_FAQS[0].id : SOLVE_FAQS[0].id
  );

  const items = variant === 'unlock' ? UNLOCK_FAQS : SOLVE_FAQS;

  return (
    <section
      data-testid={`faqs-platform-guide-${variant}`}
      aria-labelledby={`faqs-guide-heading-${variant}`}
      className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 sm:p-8 transition-colors"
    >
      {/* Header Bar with Section Collapse Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#146C53] dark:text-[#2EB88B]">
            <BookOpen className="w-3.5 h-3.5" />
            <span>
              {variant === 'unlock'
                ? 'PLATFORM GUIDE & COMPLIANCE FAQs · TAB 2 [UNLOCK]'
                : 'PLATFORM GUIDE & PROOF-OF-WORK FAQs · TAB 3 [SOLVE]'}
            </span>
          </div>
          <h2
            id={`faqs-guide-heading-${variant}`}
            className="font-display text-xl sm:text-2xl font-medium tracking-tight text-[#17191C] dark:text-[#F4F2EE]"
          >
            FAQs &amp; How the Vuka na Amana Platform Works
          </h2>
          <p className="text-xs sm:text-sm text-[#575B62] dark:text-[#A3A7AE]">
            Plain-language guide to the bidirectional crossing-over process, zero-raw-ID privacy, and verified work delivery.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSectionExpanded((prev) => !prev)}
          data-testid={`faqs-section-toggle-${variant}`}
          aria-expanded={sectionExpanded}
          className="self-start sm:self-center min-h-[40px] px-3.5 py-2 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] inline-flex items-center gap-2 transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B]" />
          <span>{sectionExpanded ? 'Hide Guide' : 'Show FAQs & Guide'}</span>
          {sectionExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-[#575B62]" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-[#575B62]" />
          )}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {sectionExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            {/* 5-Stage Quick Architecture Strip */}
            <div className="mt-6 pt-5 border-t border-[#E8E3DB] dark:border-[#2C3037] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-3.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#146C53] dark:text-[#2EB88B]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>01 · Verify</span>
                </div>
                <p className="mt-1 text-xs text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                  Voice or scenario proof becomes a signed Living Competency Passport (VNA-2026-XXXX).
                </p>
              </div>

              <div className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-3.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#146C53] dark:text-[#2EB88B]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>02 · Unlock</span>
                </div>
                <p className="mt-1 text-xs text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                  Zero-Raw-ID vault, ILO work-auth routing, FATF KYC payouts &amp; Partner pre-Stage 3 review.
                </p>
              </div>

              <div className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-3.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#C4622D] dark:text-[#E07B46]">
                  <Users className="w-3.5 h-3.5" />
                  <span>03 · Solve</span>
                </div>
                <p className="mt-1 text-xs text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                  Living Proof Portfolios match to paid Pod Sprints, Mentorship &amp; 65%–90% Bridges.
                </p>
              </div>

              <div className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-3.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#146C53] dark:text-[#2EB88B]">
                  <Wallet className="w-3.5 h-3.5" />
                  <span>04 · Pulse</span>
                </div>
                <p className="mt-1 text-xs text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                  Live UN 2030 SDG impact telemetry, escrow release tracking &amp; compliance exports.
                </p>
              </div>

              <div className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-3.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#146C53] dark:text-[#2EB88B]">
                  <Compass className="w-3.5 h-3.5" />
                  <span>05 · Cleared</span>
                </div>
                <p className="mt-1 text-xs text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                  3-year Future Dossier for local Shirika integration &amp; fee-free UNHCR pathways.
                </p>
              </div>
            </div>

            {/* Collapsible Accordion Items */}
            <div className="mt-5 divide-y divide-[#E8E3DB] dark:divide-[#2C3037] rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] overflow-hidden">
              {items.map((item) => {
                const isOpen = openItemId === item.id;
                return (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-[#1A1C20] transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenItemId(isOpen ? null : item.id)}
                      data-testid={`faq-accordion-btn-${item.id}`}
                      aria-expanded={isOpen}
                      className="w-full px-4 sm:px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-[#FAF8F5] dark:hover:bg-[#121315] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#146C53]"
                    >
                      <div className="space-y-1">
                        <span className="inline-block text-[10px] font-semibold uppercase tracking-[0.15em] text-[#146C53] dark:text-[#2EB88B]">
                          {item.tag}
                        </span>
                        <p className="text-sm sm:text-base font-medium text-[#17191C] dark:text-[#F4F2EE]">
                          {item.question}
                        </p>
                      </div>
                      <span className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] text-[#575B62] dark:text-[#A3A7AE]">
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B]" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </span>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.18, ease: 'easeOut' }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 sm:px-5 pb-4 pt-1 space-y-2.5 bg-[#FAF8F5]/60 dark:bg-[#121315]/60 border-t border-[#E8E3DB]/60 dark:border-[#2C3037]/60">
                            <p className="text-xs sm:text-sm leading-relaxed text-[#575B62] dark:text-[#A3A7AE]">
                              {item.answer}
                            </p>
                            <p className="text-[11px] font-mono-tabular text-[#146C53] dark:text-[#2EB88B]">
                              Framework Alignment: {item.frameworkRef}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
