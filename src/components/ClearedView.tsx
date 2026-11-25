import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Award,
  CheckCircle2,
  Clock,
  Compass,
  Download,
  FileCheck2,
  Globe,
  GraduationCap,
  Home,
  Layers,
  MapPin,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import type {
  BriefSubmission,
  CompetencyPassport,
  ContractPayout,
  PeerEndorsement,
  PractitionerProfile,
  WorkReadyVault,
  WorkspaceTab,
} from '../types/kora';
import type { TranslationDictionary } from '../utils/i18n';
import { OpenHorizonDawnMotif } from './ResilienceMotifs';
import { WorkSetupPreferencesCard } from './WorkSetupPreferencesCard';
import { computeVaultReadiness, computeFinancialCrossingProgress } from '../utils/talentEngine';

interface ClearedViewProps {
  profile: PractitionerProfile;
  capabilities: any[];
  contributions: BriefSubmission[];
  passport: CompetencyPassport | null;
  vault: WorkReadyVault;
  endorsements: PeerEndorsement[];
  payouts?: ContractPayout[];
  onSelectTab: (tab: WorkspaceTab) => void;
  onUpdateVault?: (next: WorkReadyVault) => void;
  t: TranslationDictionary;
}

type HorizonTrackId = 'build-roots' | 'relocate' | 'study' | 'lead';

interface HorizonOption {
  id: HorizonTrackId;
  badge: string;
  title: string;
  subtitle: string;
  frameworkRef: string;
  bestForAges: string[];
  summary: string;
  actionChecklist: string[];
  primaryActionLabel: string;
  secondaryActionLabel: string;
}

interface RoadmapHorizonStep {
  id: string;
  horizonTitle: string;
  timeframe: string;
  objective: string;
  sdgTag: string;
  tasks: string[];
}

export const ClearedView: React.FC<ClearedViewProps> = ({
  profile,
  capabilities,
  contributions,
  passport,
  vault,
  endorsements,
  payouts = [],
  onSelectTab,
  onUpdateVault,
  t: _t,
}) => {
  const recommendedTrack: HorizonTrackId = useMemo(() => {
    if (profile.ageStage === '15-17') return 'study';
    if (profile.ageStage === '18-29') return 'relocate';
    if (profile.ageStage === '30-45') return 'lead';
    return 'build-roots';
  }, [profile.ageStage]);

  const [activeTrack, setActiveTrack] = useState<HorizonTrackId>(recommendedTrack);
  const [dossierExported, setDossierExported] = useState(false);
  const [dossierModalOpen, setDossierModalOpen] = useState(false);
  const [dossierCopiedMessage, setDossierCopiedMessage] = useState<string | null>(null);

  // Module 3 Roadmap checked milestone state
  const [checkedMilestones, setCheckedMilestones] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = window.localStorage.getItem('vuka.clearedRoadmapMilestones');
      return saved ? (JSON.parse(saved) as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  });

  const toggleMilestone = (taskId: string) => {
    setCheckedMilestones((prev) => {
      const next = { ...prev, [taskId]: !prev[taskId] };
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('vuka.clearedRoadmapMilestones', JSON.stringify(next));
      }
      return next;
    });
  };

  const horizonTracks: HorizonOption[] = [
    {
      id: 'build-roots',
      badge: 'Local Socio-Economic Integration',
      title: 'Build Roots Here',
      subtitle: 'Long-Term Residency, Business Registration & RLO/SME Growth',
      frameworkRef: 'ILO PROSPECTS & National Self-Reliance Frameworks',
      bestForAges: ['30-45', '46+'],
      summary:
        'Leverage your verified skills and completed Solution Sprints to register a local enterprise, secure long-term municipal residency permits, and anchor your cooperative or SME within regional value chains.',
      actionChecklist: [
        'Attach Verified Living Competency Passport to municipal RLO/SME registration',
        'Establish direct mobile money or local bank payout rails with zero compliance friction',
        'Mentor emerging 15–29 talent inside Cross-Age Solution Pods to build regional reputation',
      ],
      primaryActionLabel: 'Export Local Integration Dossier',
      secondaryActionLabel: 'View Compliance Readiness in [Unlock]',
    },
    {
      id: 'relocate',
      badge: 'Safe Third-Country Labour Mobility',
      title: 'Relocate Through Skill',
      subtitle: 'Compliant Skilled Migration & Employer-Sponsored Pathways',
      frameworkRef: 'WES Gateway / ENIC-NARIC & UNHCR Complementary Pathways',
      bestForAges: ['18-29', '30-45'],
      summary:
        'Your verified NQF equivalency and structured UQP dossier eliminate the "missing document" barrier, enabling direct remote-to-onsite employer sponsorship and safe labour mobility corridors in Europe, the Middle East, and North America.',
      actionChecklist: [
        'Generate tamper-evident verifiable credential link (?passport=...) for foreign HR portals',
        'Map NQF Level 6/7 equivalency to host-country credential recognition boards',
        'Secure remote advisory or contractor agreements that sponsor relocation visas',
      ],
      primaryActionLabel: 'Export Mobility Credentials Package',
      secondaryActionLabel: 'Review Matched Remote Work in [Solve]',
    },
    {
      id: 'study',
      badge: 'Global Education & Complementary Pathways',
      title: 'Advance Through Study',
      subtitle: 'University Scholarships, TVET Advanced Diplomas & Research Fellowships',
      frameworkRef: 'UNESCO Qualifications Passport (UQP) for Higher Education',
      bestForAges: ['15-17', '18-29'],
      summary:
        'Use your verified prior learning and micro-bridge certificates as recognized academic entry credits for global university scholarship programs and advanced technical institute fellowships without re-taking foundational exams.',
      actionChecklist: [
        'Include AI-verified competency portfolio in higher education scholarship applications',
        'Complete recognized micro-bridging modules to satisfy academic prerequisite gaps',
        'Connect with university research pods seeking field-tested technical builders',
      ],
      primaryActionLabel: 'Export Academic RPL Transcript',
      secondaryActionLabel: 'Check Job-to-Fit Upskilling Bridges in [Solve]',
    },
    {
      id: 'lead',
      badge: 'Entrepreneurship & Intergenerational Wealth',
      title: 'Lead & Multiply',
      subtitle: 'Cooperative Scaling, Senior Advisory & Family Unity',
      frameworkRef: 'ILO Decent Work & Regional Trade Guild Standards',
      bestForAges: ['46+', '30-45'],
      summary:
        'Step into senior advisory retainers, lead accredited QA assessment pods, and scale your craft into a multi-member cooperative enterprise that secures permanent financial stability and family unity.',
      actionChecklist: [
        'Establish accredited Peer Assessor credentials to review junior sprint deliverables',
        'Lock in recurring monthly advisory retainers with regional hiring partners',
        'Secure multi-currency digital wallet and tax-cleared corporate payout rails',
      ],
      primaryActionLabel: 'Export Master Practitioner Retainer Pack',
      secondaryActionLabel: 'Inspect Impact Pulse in [Pulse]',
    },
  ];

  const selectedHorizon = horizonTracks.find((h) => h.id === activeTrack) ?? horizonTracks[0];

  const roadmapSteps: RoadmapHorizonStep[] = [
    {
      id: 'horizon-1',
      horizonTitle: 'Horizon 1 — Stabilize',
      timeframe: 'Next 90 Days',
      objective: 'Complete 2 paid Cross-Age Sprints, lock Tier 2/3 KYC payout rail, and build a verified savings & proof-of-work buffer.',
      sdgTag: 'SDG 8 (Sustained Livelihoods) & SDG 16 (Legal Identity)',
      tasks: [
        'Complete 2 paid Cross-Age Solution Sprints in [Solve]',
        'Lock Tier 2/3 KYC payout rail and verify mobile money / bank account',
        'Secure initial peer endorsements and build verifiable proof-of-work ledger',
      ],
    },
    {
      id: 'horizon-2',
      horizonTitle: 'Horizon 2 — Upgrade Status',
      timeframe: '6 to 18 Months',
      objective: 'Complete targeted TVET/RPL bridging via partner fee-waiver, advance to Tier 4 Accredited status, or submit vetted mobility application.',
      sdgTag: 'SDG 4 (Lifelong Learning) & SDG 10 (Safe Mobility)',
      tasks: [
        'Apply for partner fee-waiver / exam stipend for NQF equivalency bridging',
        'Advance Living Competency Passport from AI-evaluated to Accredited RPL status',
        'Submit vetted Labour Mobility or Scholarship application with trusted partner referral',
      ],
    },
    {
      id: 'horizon-3',
      horizonTitle: 'Horizon 3 — Thrive & Give Back',
      timeframe: '2 to 3 Years',
      objective: 'Attain durable residency, skilled third-country placement, or registered enterprise growth—and graduate into a paid Peer Assessor / Master Mentor.',
      sdgTag: 'SDG 17 (Multi-Stakeholder Partnerships) & SDG 8',
      tasks: [
        'Secure permanent residency, skilled third-country placement, or cooperative enterprise charter',
        'Graduate into a paid Peer Assessor / Master Mentor inside Vuka na Amana',
        'Pull the next cohort across by reviewing junior sprint deliverables and sharing expertise',
      ],
    },
  ];

  const totalRoadmapTasks = roadmapSteps.reduce((acc, step) => acc + step.tasks.length, 0);
  const completedRoadmapTasks = roadmapSteps.reduce(
    (acc, step) => acc + step.tasks.filter((task) => checkedMilestones[`${step.id}::${task}`]).length,
    0
  );
  const momentumPct = Math.round((completedRoadmapTasks / totalRoadmapTasks) * 100);

  const vaultReadiness = computeVaultReadiness(vault);
  const financialCrossing = computeFinancialCrossingProgress(vault);
  const completedContributionsCount = contributions.filter((c) => c.status === 'completed').length;
  const verifiedCapsCount = capabilities.filter((c) => c.verificationStatus !== 'pending').length;

  const handleExportDossier = () => {
    setDossierExported(true);
    setDossierModalOpen(true);
    window.setTimeout(() => setDossierExported(false), 3500);
  };

  return (
    <div className="space-y-10">
      {/* Editorial Section Header */}
      <section className="relative overflow-hidden bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] rounded-2xl p-6 sm:p-10 shadow-sm">
        <OpenHorizonDawnMotif />
        <div className="relative z-10 max-w-4xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-widest font-semibold text-[#146C53] dark:text-[#2EB88B]">
              CLEARED FOR YOUR FUTURE · DURABLE SOLUTIONS & SDGS 4, 8, 10, 16 & 17
            </span>
            <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#5EEAD4]">
              UNESCO UQP · ILO PROSPECTS · WES Gateway
            </span>
            <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#F9E9DF] dark:bg-[#2E1D15] text-[#C4622D] dark:text-[#F59E6C]">
              {profile.ageStage} Track
            </span>
          </div>

          <h1 className="font-serif text-2xl sm:text-4xl font-semibold text-[#17191C] dark:text-[#F4F2EE] tracking-tight">
            What Your Future Holds
          </h1>

          <p className="text-sm sm:text-base text-[#5A6068] dark:text-[#A3A9B3] leading-relaxed max-w-3xl">
            Your verified skills and cleared compliance are portable assets—built to grow with you here, abroad, or home. This is where immediate survival work transforms into durable, long-term destiny.
          </p>
        </div>

        {/* Module 1 — Personal "Future-Readiness Bridge" Summary Strip */}
        <div className="relative z-10 mt-6 pt-6 border-t border-[#E8E3DB] dark:border-[#2C3037] grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="rounded-xl border border-[#146C53]/30 bg-[#E7F3EE]/50 dark:bg-[#142B24]/50 p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#146C53] dark:text-[#5EEAD4]">
                Portable Skill Proof
              </span>
              <ShieldCheck className="w-4 h-4 text-[#146C53] dark:text-[#5EEAD4]" />
            </div>
            <p className="font-serif text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
              {passport ? `Passport ID: ${passport.verifiableId ?? 'VNA-2026-8412'}` : `${verifiedCapsCount} Verified Skill(s)`}
            </p>
            <p className="text-[11px] text-[#5A6068] dark:text-[#A3A9B3]">
              {passport ? `${passport.studioDomain} · NQF Equivalency Mapped` : 'Generate in Tab 1 [Verify]'}
            </p>
          </div>

          <div className="rounded-xl border border-[#C4622D]/30 bg-[#F9E9DF]/50 dark:bg-[#2E1D15]/50 p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#C4622D] dark:text-[#F59E6C]">
                Cleared Legal / Payout Rail
              </span>
              <Wallet className="w-4 h-4 text-[#C4622D] dark:text-[#F59E6C]" />
            </div>
            <p className="font-serif text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
              {financialCrossing.isCrossingCleared ? 'FATF Tier-1 / Tier-2 Cleared' : `${vaultReadiness.completedCount}/3 Vault · ${financialCrossing.completedCount}/3 Payout Gates`}
            </p>
            <p className="text-[11px] text-[#5A6068] dark:text-[#A3A9B3]">
              {vault.identityPathway ? vault.identityPathway.replace('-', ' ').toUpperCase() : 'Ready for compliant contracting'}
            </p>
          </div>

          <div className="rounded-xl border border-[#146C53]/30 bg-[#E7F3EE]/50 dark:bg-[#142B24]/50 p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#146C53] dark:text-[#5EEAD4]">
                Track Record Built
              </span>
              <Award className="w-4 h-4 text-[#146C53] dark:text-[#5EEAD4]" />
            </div>
            <p className="font-serif text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
              {completedContributionsCount} Completed Sprint(s) · ${contributions.reduce((s, c) => s + (c.status === 'completed' ? c.payoutUsd : 0), 0) + payouts.reduce((s, p) => s + (p.status === 'released' ? p.amountUsd : 0), 0)} USD
            </p>
            <p className="text-[11px] text-[#5A6068] dark:text-[#A3A9B3]">
              {endorsements.filter((e) => e.status === 'verified').length} Peer Endorsements Active
            </p>
          </div>
        </div>
      </section>

      {/* Module 2 — Interactive 4-Track Horizon Selector */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs uppercase tracking-widest font-semibold text-[#146C53] dark:text-[#2EB88B]">
              Long-Term Horizon Selector
            </span>
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#17191C] dark:text-[#F4F2EE]">
              Select Your Long-Term Pathway
            </h2>
          </div>
          <span className="text-xs text-[#5A6068] dark:text-[#A3A9B3]">
            Pre-recommended for your <strong>{profile.ageStage}</strong> stage · Click any track to reveal intelligence
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {horizonTracks.map((track) => {
            const isActive = activeTrack === track.id;
            const isRecommended = recommendedTrack === track.id;
            const TrackIcon =
              track.id === 'build-roots'
                ? Home
                : track.id === 'relocate'
                  ? Globe
                  : track.id === 'study'
                    ? GraduationCap
                    : Layers;

            return (
              <button
                key={track.id}
                type="button"
                onClick={() => setActiveTrack(track.id)}
                data-testid={`horizon-track-${track.id}`}
                aria-pressed={isActive}
                className={`text-left rounded-2xl p-5 border transition-all cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? 'border-[#146C53] dark:border-[#2EB88B] bg-[#E7F3EE]/70 dark:bg-[#142B24]/80 shadow-sm ring-1 ring-[#146C53]/30'
                    : 'border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:border-[#146C53]/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#146C53] dark:text-[#5EEAD4]">
                      <TrackIcon className="w-3.5 h-3.5" />
                      {track.badge.split(' ')[0]}
                    </span>
                    {isRecommended && (
                      <span
                        data-testid={`recommended-horizon-${track.id}`}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F9E9DF] dark:bg-[#2E1D15] text-[#C4622D] dark:text-[#F59E6C] shrink-0"
                      >
                        Recommended
                      </span>
                    )}
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                    {track.title}
                  </h3>
                  <p className="text-xs text-[#5A6068] dark:text-[#A3A9B3] mt-1.5 leading-relaxed line-clamp-3">
                    {track.subtitle}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E8E3DB]/80 dark:border-[#2C3037]/80 flex items-center justify-between text-[11px] font-semibold">
                  <span
                    className={
                      isActive
                        ? 'text-[#146C53] dark:text-[#5EEAD4]'
                        : 'text-[#5A6068] dark:text-[#A3A9B3]'
                    }
                  >
                    {isActive ? 'Active Intelligence View' : 'Explore Pathway →'}
                  </span>
                  <span className="text-[10px] text-[#5A6068] dark:text-[#A3A9B3]">
                    Ages {track.bestForAges.join('/')}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Module 2 Intelligence Section */}
      <section
        data-testid="horizon-intelligence-module"
        className="relative overflow-hidden bg-white dark:bg-[#1A1C20] border-2 border-[#146C53]/35 dark:border-[#2EB88B]/40 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E3DB] dark:border-[#2C3037] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest font-semibold text-[#146C53] dark:text-[#2EB88B]">
                Tailored Intelligence & Action Plan
              </span>
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#5EEAD4]">
                {selectedHorizon.frameworkRef}
              </span>
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#17191C] dark:text-[#F4F2EE] mt-1">
              {selectedHorizon.title}: {selectedHorizon.subtitle}
            </h3>
          </div>

          <button
            type="button"
            onClick={handleExportDossier}
            data-testid="export-horizon-dossier-btn"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#146C53] hover:bg-[#0F5440] text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            {dossierExported ? '✓ Dossier Generated & Saved' : selectedHorizon.primaryActionLabel}
          </button>
        </div>

        <p className="text-sm text-[#5A6068] dark:text-[#A3A9B3] leading-relaxed max-w-4xl">
          {selectedHorizon.summary}
        </p>

        <div className="space-y-3">
          <h4 className="text-xs uppercase tracking-wider font-semibold text-[#17191C] dark:text-[#F4F2EE]">
            Actionable Milestone Checklist for This Pathway
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {selectedHorizon.actionChecklist.map((item, idx) => (
              <div
                key={item}
                className="rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] p-4 flex items-start gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#5EEAD4] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <p className="text-xs text-[#17191C] dark:text-[#F4F2EE] leading-relaxed">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-[#E8E3DB] dark:border-[#2C3037] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#5A6068] dark:text-[#A3A9B3]">
              Need guidance or document review?
            </span>
            <button
              type="button"
              onClick={() => onSelectTab('solve')}
              className="text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] underline cursor-pointer"
            >
              Contact Pod Mentor in [Solve] →
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectTab('unlock')}
              className="px-4 py-2 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] text-xs font-medium text-[#17191C] dark:text-[#F4F2EE] hover:border-[#146C53] cursor-pointer"
            >
              {selectedHorizon.secondaryActionLabel}
            </button>
          </div>
        </div>
      </section>

      {/* Module 3 — Your 3-Year Cleared Horizon Roadmap (1+1=3 Mechanic) */}
      <section
        data-testid="cleared-horizon-roadmap-module"
        className="relative overflow-hidden bg-white dark:bg-[#1A1C20] border-2 border-[#146C53]/40 dark:border-[#2EB88B]/45 rounded-2xl p-6 sm:p-10 shadow-sm space-y-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#E8E3DB] dark:border-[#2C3037]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest font-semibold text-[#146C53] dark:text-[#2EB88B]">
                Module 3 · 1+1=3 Mechanic
              </span>
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#5EEAD4]">
                Short-Term Sprints → Lifetime Mobility
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#17191C] dark:text-[#F4F2EE] mt-1">
              Your 3-Year Cleared Horizon Roadmap
            </h2>
            <p className="text-sm text-[#5A6068] dark:text-[#A3A9B3] mt-2 max-w-3xl">
              Turn research into a repeatable personal timeline with measurable UN 2030 Agenda SDG outcomes. Check off milestones below to build your Horizon Momentum.
            </p>
          </div>

          {/* Horizon Momentum Progress Arc */}
          <div className="rounded-2xl border border-[#146C53]/30 bg-[#E7F3EE]/60 dark:bg-[#142B24]/70 p-4 flex items-center gap-4 shrink-0">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#D3E8E0] dark:text-[#1A3A30]"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#146C53] dark:text-[#2EB88B] transition-all duration-500"
                  strokeDasharray={`${momentumPct}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute font-mono-tabular text-xs font-bold text-[#146C53] dark:text-[#2EB88B]">
                {momentumPct}%
              </span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-[#146C53] dark:text-[#5EEAD4]">
                Horizon Momentum
              </p>
              <p className="font-serif text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                {completedRoadmapTasks} of {totalRoadmapTasks} Milestones Active
              </p>
            </div>
          </div>
        </div>

        {/* 3-Horizon Interactive Timeline Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {roadmapSteps.map((step) => {
            const stepCompletedCount = step.tasks.filter(
              (task) => checkedMilestones[`${step.id}::${task}`]
            ).length;
            const isStepComplete = stepCompletedCount === step.tasks.length;

            return (
              <div
                key={step.id}
                className={`rounded-2xl border p-6 flex flex-col justify-between transition-all ${
                  isStepComplete
                    ? 'border-[#146C53] dark:border-[#2EB88B] bg-[#E7F3EE]/40 dark:bg-[#142B24]/50 shadow-sm'
                    : 'border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20]'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono-tabular font-bold px-2.5 py-1 rounded-md bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] text-[#146C53] dark:text-[#5EEAD4]">
                      {step.timeframe}
                    </span>
                    <span className="text-[11px] font-medium text-[#5A6068] dark:text-[#A3A9B3]">
                      {step.sdgTag}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-serif text-lg font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                      {step.horizonTitle}
                    </h3>
                    <p className="text-xs text-[#5A6068] dark:text-[#A3A9B3] mt-1.5 leading-relaxed">
                      {step.objective}
                    </p>
                  </div>

                  {/* Interactive Milestone Checkboxes */}
                  <div className="space-y-2.5 pt-3 border-t border-[#E8E3DB]/80 dark:border-[#2C3037]/80">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#17191C] dark:text-[#F4F2EE]">
                      Interactive Deliverables ({stepCompletedCount}/{step.tasks.length})
                    </p>
                    {step.tasks.map((task) => {
                      const taskKey = `${step.id}::${task}`;
                      const isChecked = Boolean(checkedMilestones[taskKey]);

                      return (
                        <label
                          key={task}
                          className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-white dark:bg-[#1A1C20] border-[#146C53]/40 dark:border-[#2EB88B]/40 text-[#146C53] dark:text-[#2EB88B]'
                              : 'bg-[#FAF8F5] dark:bg-[#121315] border-[#E8E3DB] dark:border-[#2C3037] text-[#17191C] dark:text-[#F4F2EE] hover:border-[#146C53]/30'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleMilestone(taskKey)}
                            aria-label={task}
                            className="mt-0.5 rounded border-[#C4622D] text-[#146C53] focus:ring-[#146C53] shrink-0"
                          />
                          <span
                            className={`text-xs leading-relaxed ${
                              isChecked ? 'line-through text-[#5A6068] dark:text-[#A3A9B3]' : ''
                            }`}
                          >
                            {task}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[#E8E3DB]/80 dark:border-[#2C3037]/80 flex items-center justify-between text-[11px]">
                  <span className="text-[#5A6068] dark:text-[#A3A9B3]">SDG Telemetry Sync</span>
                  <span className="font-semibold text-[#146C53] dark:text-[#5EEAD4]">
                    {isStepComplete ? '✓ Horizon Secured' : 'In Progress'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Optional Practical Work Setup Preferences (Synced with Tab 3 & Consent Bridge) */}
        <WorkSetupPreferencesCard
          vault={vault}
          onUpdateVault={onUpdateVault}
          onJumpToStipendPool={() => onSelectTab('verify')}
          contextLabel="cleared"
        />

        {dossierCopiedMessage && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-xl border border-[#146C53]/35 bg-[#E7F3EE] dark:bg-[#142B24] px-4 py-3 text-xs font-medium text-[#146C53] dark:text-[#5EEAD4] flex items-center justify-between gap-3"
          >
            <span>{dossierCopiedMessage}</span>
            <button
              type="button"
              onClick={() => setDossierCopiedMessage(null)}
              className="underline font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-6 border-t border-[#E8E3DB] dark:border-[#2C3037] flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-[#5A6068] dark:text-[#A3A9B3]">
            Milestones checked here automatically log durable outcome events into Tab 4 ([Pulse]) across SDGs 4, 8, 10, 16 & 17.
          </p>

          <button
            type="button"
            onClick={handleExportDossier}
            data-testid="export-cleared-future-dossier-btn"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#C4622D] hover:bg-[#AA5223] dark:bg-[#E07B46] dark:hover:bg-[#CE6A36] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export My Cleared Future Dossier</span>
          </button>
        </div>
      </section>

      {/* Export Dossier Modal Preview */}
      {dossierModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dossier-modal-title"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-4 sm:p-6 pt-16 sm:pt-20 overflow-y-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="relative w-full max-w-2xl sm:max-w-3xl max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] shadow-2xl overflow-hidden my-4 sm:my-auto"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E3DB] dark:border-[#2C3037] shrink-0">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-widest text-[#146C53] dark:text-[#2EB88B]">
                  VUKA NA AMANA · OFFICIAL CLEARED FUTURE DOSSIER
                </span>
                <h3 id="dossier-modal-title" className="font-serif text-xl sm:text-2xl font-semibold text-[#17191C] dark:text-[#F4F2EE] mt-0.5">
                  {profile.displayName || 'Skilled Practitioner'} — Dossier Summary
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDossierModalOpen(false)}
                className="w-8 h-8 rounded-full border border-[#E8E3DB] dark:border-[#2C3037] flex items-center justify-center text-[#5A6068] dark:text-[#A3A9B3] hover:text-[#17191C] cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs sm:text-sm text-[#5A6068] dark:text-[#A3A9B3] overflow-y-auto flex-1 no-scrollbar">
              <div className="rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] p-4 space-y-2">
                <p className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">1. Living Competency Passport</p>
                <p>
                  {passport ? `Verifiable ID: ${passport.verifiableId} · Domain: ${passport.studioDomain} · NQF Level Mapped` : `${verifiedCapsCount} Verified Skill Capabilities`}
                </p>
              </div>

              <div className="rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] p-4 space-y-2">
                <p className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">2. Compliance & Payout Readiness</p>
                <p>
                  {vault.identityPathway ? vault.identityPathway.replace('-', ' ').toUpperCase() : 'FATF Tier-1 / Tier-2 Compliant Payout Rails'} · {vaultReadiness.completedCount}/3 Readiness Steps
                </p>
              </div>

              <div className="rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] p-4 space-y-2">
                <p className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">3. Living Proof & Track Record</p>
                <p>
                  {completedContributionsCount} Completed Solution Sprint(s) · ${contributions.reduce((s, c) => s + (c.status === 'completed' ? c.payoutUsd : 0), 0)} USD Earned · {endorsements.filter((e) => e.status === 'verified').length} Peer Endorsements
                </p>
              </div>

              <div className="rounded-xl border border-[#146C53]/30 bg-[#E7F3EE]/50 dark:bg-[#142B24]/50 p-4 space-y-2">
                <p className="font-semibold text-[#146C53] dark:text-[#5EEAD4]">4. Selected Horizon Pathway & Momentum</p>
                <p className="text-[#17191C] dark:text-[#F4F2EE]">
                  Selected Track: <strong>{selectedHorizon.title}</strong> ({selectedHorizon.frameworkRef}) · Roadmap Momentum: <strong>{momentumPct}%</strong>
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-[#E8E3DB] dark:border-[#2C3037] flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const summaryText = `Vuka na Amana Cleared Future Dossier — ${profile.displayName || 'Skilled Practitioner'} | Track: ${selectedHorizon.title} (${selectedHorizon.frameworkRef}) | Momentum: ${momentumPct}%`;
                  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                    void navigator.clipboard.writeText(summaryText).catch(() => {});
                  }
                  setDossierCopiedMessage(
                    'Cleared Future Dossier copied to clipboard and ready to share with an employer, scholarship panel, or RLO partner.'
                  );
                  setDossierModalOpen(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#146C53] hover:bg-[#0F5440] text-white text-xs font-semibold cursor-pointer"
              >
                Copy & Share Cleared Dossier
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
