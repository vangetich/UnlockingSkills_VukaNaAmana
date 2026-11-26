import React, { useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { TranslationDictionary } from '../utils/i18n';

export interface PlatformFAQsProps {
  variant: 'unlock' | 'solve' | 'general';
  t?: TranslationDictionary;
}

interface FaqItem {
  id: string;
  tag: string;
  question: string;
  answer: string;
  frameworkRef: string;
}

const FIVE_STAGE_SUMMARY = [
  { num: '01', label: 'Verify', desc: 'Living Competency Passport' },
  { num: '02', label: 'Unlock', desc: 'Zero-Raw-ID Vault & KYC' },
  { num: '03', label: 'Solve', desc: 'Pod Sprints & Mentorship' },
  { num: '04', label: 'Pulse', desc: 'SDG Impact & Escrow' },
  { num: '05', label: 'Cleared', desc: 'Future Dossier & Pathways' },
];

const PLATFORM_FAQS: FaqItem[] = [
  {
    id: 'five-stage-crossing-flow',
    tag: 'HOW IT WORKS · 5-STAGE CROSSING',
    question: 'How does the sequential 5-Stage Crossing (Verify to Cleared) work?',
    answer:
      'Vuka na Amana guides talent through 5 connected stages: Stage 1 (Verify) converts voice or text problem-solving into a signed Living Competency Passport; Stage 2 (Unlock) sets up work-auth and FATF payout compliance inside your Zero-Raw-ID vault; Stage 3 (Solve) pairs your Living Proof Portfolio with paid Cross-Age Pod Sprints and upskilling bridges; Stage 4 (Pulse) logs UN SDG impact and escrow payouts; and Stage 5 (Cleared) prepares a 3-year Durable Solutions & Mobility Dossier.',
    frameworkRef: 'UNESCO UQP · ILO RPL · UN 2030 SDGs 4, 8, 10, 16 & 17',
  },
  {
    id: 'living-competency-passport',
    tag: 'LIVING COMPETENCY PASSPORT',
    question: 'What is the Living Competency Passport and how is it verified?',
    answer:
      'The Living Competency Passport is a server-signed cryptographic digital credential (VNA-2026-XXXX) that translates verified practical problem-solving into recognized framework tiers (UNESCO NQF, ILO RPL, and 4-Tier Trust Ratings) without requiring paper diplomas.',
    frameworkRef: 'UNESCO UQP · ILO RPL · Server HMAC-SHA256 Signed',
  },
  {
    id: 'compliance-readiness-vault',
    tag: 'WHO VERIFIES WHAT · PRIVACY BOUNDARY',
    question: 'How does the Work-Ready Vault ensure zero-raw-ID privacy and Partner pre-Stage 3 review?',
    answer:
      'Vuka na Amana enforces Refugee Data Protection by Design (Zero-Raw-ID Privacy Mode). Raw ID numbers are never exposed to employers. Instead, the Compliance Vault issues a revocable consent token (VNA-GRANT-XXXX). Hiring Partners verify Identity, Financial rail readiness, and Contracting individually before Stage 3, use Bulk Approve for non-sensitive milestones, monitor live Access Audit Logs, and export CSV/PDF compliance reports.',
    frameworkRef: 'UNHCR Data Protection Policy · FATF Tiered KYC · SDG 16',
  },
  {
    id: 'solution-sprints-pods',
    tag: 'SOLUTION SPRINTS & MENTORSHIP',
    question: 'How do Cross-Age Delivery Pods, Formal Mentorship, and Sprint-Based Guidance operate?',
    answer:
      'Verified builders team up in Cross-Age Delivery Pods (pairing 15–29 Emerging Builders with 30–46+ Specialist Leads) to solve 1-to-2-week local or remote briefs. Practitioners can enroll in Formal Mentorship Tracks for structured multi-sprint growth or request spontaneous Sprint-Based Guidance inside the Mentor Messaging Drawer for fast blocker and QA checks.',
    frameworkRef: 'UN Global Compact on Refugees · ILO Apprenticeships · SDG 8',
  },
  {
    id: 'cleared-scam-free-pathways',
    tag: 'STAGE 5 · CLEARED & SCAM-FREE RULE',
    question: 'What happens in Stage 5 (Cleared), and are partner pathways always fee-free?',
    answer:
      'Stage 5 maps your verified sprint history into a 3-year Cleared Future Dossier spanning host-country integration (such as Kenya’s Shirika Plan) and UNHCR Complementary Pathways (TBB, RefugePoint, WUSC, UNICORE). Legitimate UN, NGO, and partner pathways never charge applicants broker or placement fees.',
    frameworkRef: 'UNHCR Complementary Pathways 2030 · SDG 10.7',
  },
];

export const PlatformFAQs: React.FC<PlatformFAQsProps> = ({ variant }) => {
  const [sectionExpanded, setSectionExpanded] = useState(true);
  const [openItemId, setOpenItemId] = useState<string | null>(PLATFORM_FAQS[0].id);

  return (
    <section
      aria-labelledby="platform-faqs-heading"
      data-testid="platform-faqs-component"
      className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 sm:p-8 space-y-6 shadow-sm transition-colors"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E8E3DB] dark:border-[#2C3037]">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest font-semibold text-[#146C53] dark:text-[#2EB88B]">
            <BookOpen className="w-3.5 h-3.5" />
            <span>How Vuka Works · 5-Stage Guide &amp; FAQs</span>
          </div>
          <h3
            id="platform-faqs-heading"
            className="font-serif text-xl sm:text-2xl font-semibold text-[#17191C] dark:text-[#F4F2EE]"
          >
            {variant === 'unlock'
              ? 'Unlock, Privacy Boundaries & Compliance Essentials'
              : 'Solution Sprint, Mentorship & 5-Stage Guide'}
          </h3>
          <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] max-w-2xl leading-relaxed">
            Plain-language guide to the 5-stage Crossing Over flow, Who Verifies What privacy boundaries, Solution Sprints, and Mentor-Mentee support under UN 2030 standards.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSectionExpanded((prev) => !prev)}
          data-testid="toggle-platform-faqs-btn"
          aria-expanded={sectionExpanded}
          className="min-h-[36px] px-3.5 py-1.5 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] text-xs font-semibold text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] inline-flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <span>{sectionExpanded ? 'Collapse Guide' : 'Expand Guide'}</span>
          {sectionExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {sectionExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 overflow-hidden"
          >
            {/* Compact 5-Stage How It Works Strip */}
            <div
              data-testid="platform-faqs-5stage-strip"
              className="grid grid-cols-2 sm:grid-cols-5 gap-2"
            >
              {FIVE_STAGE_SUMMARY.map((stage) => (
                <div
                  key={stage.num}
                  className="rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] px-3 py-2.5"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono-tabular text-[10px] font-bold text-[#146C53] dark:text-[#2EB88B]">
                      {stage.num}
                    </span>
                    <span className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                      {stage.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE] mt-0.5 leading-snug">
                    {stage.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {PLATFORM_FAQS.map((item) => {
                const isOpen = openItemId === item.id;
                return (
                  <div
                    key={item.id}
                    data-testid={`platform-faq-item-${item.id}`}
                    className={`rounded-xl border transition-colors ${
                      isOpen
                        ? 'border-[#146C53]/45 dark:border-[#2EB88B]/45 bg-[#E7F3EE]/40 dark:bg-[#142B24]/40'
                        : 'border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] hover:border-[#146C53]/30'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenItemId(isOpen ? null : item.id)}
                      aria-expanded={isOpen}
                      className="w-full text-start p-4 flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B] flex items-center justify-center shrink-0">
                          <HelpCircle className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#C4622D] dark:text-[#E07B46] block">
                            {item.tag}
                          </span>
                          <h4 className="text-xs sm:text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE] truncate">
                            {item.question}
                          </h4>
                        </div>
                      </div>
                      <span className="shrink-0 text-[#575B62] dark:text-[#A3A7AE]">
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </span>
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="px-4 pb-4 pt-1 border-t border-[#E8E3DB]/60 dark:border-[#2C3037]/60 space-y-3"
                        >
                          <p className="text-xs sm:text-sm leading-relaxed text-[#5A6068] dark:text-[#A3A9B3]">
                            {item.answer}
                          </p>
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] text-[10px] font-mono font-medium text-[#146C53] dark:text-[#2EB88B]">
                            <ShieldCheck className="w-3 h-3 shrink-0" />
                            <span>Standard: {item.frameworkRef}</span>
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
