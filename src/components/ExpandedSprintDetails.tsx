import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Award,
  Bold,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  Edit3,
  Eye,
  FileDown,
  Heading2,
  Italic,
  Link2,
  List,
  Lock,
  MessageSquare,
  MessageSquarePlus,
  Quote,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type {
  BriefSubmission,
  ContractPayout,
  MentorMessage,
  PodMentorProfile,
  SprintCollaborationNote,
  SprintFeedback,
  SprintMilestoneKey,
  WorkReadyVault,
} from '../types/kora';
import {
  SEED_BRIEFS,
  SOLUTION_SPRINTS,
  SPRINT_MILESTONE_STEPS,
  getAssignedMentorForSprint,
  normalizeSprintMilestones,
} from '../utils/talentEngine';
import {
  exportSprintReportPdf,
  formatPayoutReceiptId,
} from '../utils/pdfReceipt';
import { MarkdownPreview } from '../utils/markdown';
import {
  SprintFeedbackModal,
  type SprintFeedbackDraftInput,
} from './SprintFeedbackModal';

export interface ExpandedSprintSummary {
  contributionId: string;
  briefId: string;
  briefTitle: string;
  domain: string;
  partnerOrg: string;
  durationLabel: string;
  status: 'completed' | 'in-progress';
  hoursLogged: number;
  solutionNotes: string;
  completedMilestones: SprintMilestoneKey[];
  updatedAtIso: string;
  assignedMentor: PodMentorProfile;
  feedbackEntries: SprintFeedback[];
  mentorThreadMessages: MentorMessage[];
  payoutBreakdown: {
    grossStipendUsd: number;
    platformFeeUsd: number;
    netDisbursedUsd: number;
    effectiveHourlyRateUsd: number;
    payoutStatusLabel: string;
    payoutRailLabel: string;
    receiptReference: string | null;
    matchingPayout: ContractPayout | null;
  };
}

export interface BuildExpandedSprintSummaryInput {
  contribution: BriefSubmission;
  payouts: ContractPayout[];
  sprintFeedback: SprintFeedback[];
  mentorMessages?: MentorMessage[];
  sprintMilestonesByBrief?: Record<string, SprintMilestoneKey[]>;
  vault?: WorkReadyVault;
}

const RAIL_LABELS: Record<string, string> = {
  'mobile-money': 'Mobile Money',
  'global-wallet': 'Global Digital Wallet',
  'fiscal-host': 'Fiscal-Host Disbursement',
  'local-bank': 'Local Bank',
};

/**
 * Pure aggregator building a complete sprint summary, mentor feedback log,
 * and itemized final payout breakdown for the ExpandedSprintDetails modal.
 */
export function buildExpandedSprintSummary(
  input: BuildExpandedSprintSummaryInput
): ExpandedSprintSummary {
  const {
    contribution,
    payouts = [],
    sprintFeedback = [],
    mentorMessages = [],
    sprintMilestonesByBrief = {},
    vault,
  } = input;

  const matchedSprint = SOLUTION_SPRINTS.find((s) => s.id === contribution.briefId);
  const matchedBrief = SEED_BRIEFS.find((b) => b.id === contribution.briefId);

  const matchingPayout =
    payouts.find((p) => p.sprintId === contribution.briefId) ?? null;

  const feedbackEntries = sprintFeedback
    .filter(
      (f) =>
        f.contributionId === contribution.id || f.briefId === contribution.briefId
    )
    .sort((a, b) => (Date.parse(b.createdAtIso) || 0) - (Date.parse(a.createdAtIso) || 0));

  const mentorThreadMessages = mentorMessages
    .filter((m) => m.sprintId === contribution.briefId)
    .sort((a, b) => (Date.parse(a.createdAtIso) || 0) - (Date.parse(b.createdAtIso) || 0));

  const assignedMentor = getAssignedMentorForSprint(
    contribution.briefId,
    contribution.domain
  );

  const isCompleted = contribution.status === 'completed';
  const completedMilestones = normalizeSprintMilestones(
    contribution.milestonesDone ?? sprintMilestonesByBrief[contribution.briefId],
    isCompleted
  );

  const grossStipendUsd = Math.max(
    0,
    Number(matchingPayout?.amountUsd ?? contribution.payoutUsd ?? 0)
  );
  const platformFeeUsd = 0; // Zero-deduction builder stipend guarantee
  const netDisbursedUsd = Math.max(0, grossStipendUsd - platformFeeUsd);
  const hoursLogged = Math.max(0, Number(contribution.hoursLogged || 0));
  const effectiveHourlyRateUsd =
    hoursLogged > 0
      ? Math.round((netDisbursedUsd / hoursLogged) * 100) / 100
      : netDisbursedUsd;

  const payoutStatusLabel = matchingPayout
    ? matchingPayout.status === 'released'
      ? 'Released to Practitioner'
      : matchingPayout.status === 'processing'
        ? 'Settlement Processing'
        : 'Escrow-Held'
    : isCompleted
      ? 'Milestone Verified (Pending Release)'
      : 'Escrow Reserved';

  const rawRail =
    matchingPayout?.payoutRail || vault?.payoutRail || vault?.financialRail || '';
  const payoutRailLabel = RAIL_LABELS[rawRail] || rawRail || 'Compliant Rail Ready';

  const partnerOrg =
    matchingPayout?.partnerOrg ||
    feedbackEntries[0]?.partnerOrg ||
    matchedSprint?.partnerOrg ||
    matchedBrief?.organization ||
    'Verified Hiring Partner';

  return {
    contributionId: contribution.id,
    briefId: contribution.briefId,
    briefTitle: contribution.briefTitle || matchedSprint?.title || 'Solution Sprint',
    domain: contribution.domain || matchedSprint?.domain || 'Field Ops',
    partnerOrg,
    durationLabel: matchedSprint?.durationLabel || 'Scoped Sprint',
    status: contribution.status,
    hoursLogged,
    solutionNotes: contribution.solutionNotes || 'No solution notes logged yet.',
    completedMilestones,
    updatedAtIso: contribution.updatedAtIso || contribution.createdAtIso,
    assignedMentor,
    feedbackEntries,
    mentorThreadMessages,
    payoutBreakdown: {
      grossStipendUsd,
      platformFeeUsd,
      netDisbursedUsd,
      effectiveHourlyRateUsd,
      payoutStatusLabel,
      payoutRailLabel,
      receiptReference: matchingPayout
        ? formatPayoutReceiptId(matchingPayout)
        : null,
      matchingPayout,
    },
  };
}

export interface ShareableSprintSnapshot {
  headline: string;
  generatedAtIso: string;
  deepLink: string;
  textSummary: string;
  svgMarkup: string;
  filenameBase: string;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function truncateText(value: string, maxLen: number): string {
  const cleaned = value.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLen) return cleaned;
  return `${cleaned.slice(0, Math.max(0, maxLen - 1)).trimEnd()}…`;
}

/**
 * Constructs a shareable deep-link that routes directly to this sprint in Pulse.
 */
export function buildSprintDeepLink(
  origin: string,
  briefId: string,
  contributionId?: string
): string {
  const safeOrigin = (origin || 'https://vuka-na-amana.app').replace(/\/+$/, '');
  const params = new URLSearchParams({
    tab: 'pulse',
    sprint: briefId,
  });
  if (contributionId && contributionId.trim().length > 0) {
    params.set('contribution', contributionId.trim());
  }
  return `${safeOrigin}/?${params.toString()}`;
}

/**
 * Builds both a copyable text summary and a clean editorial SVG visual snapshot
 * of the current sprint summary.
 */
export function buildShareableSprintSnapshot(
  summary: ExpandedSprintSummary,
  deepLink: string,
  generatedAtIso = new Date().toISOString()
): ShareableSprintSnapshot {
  const isCompleted = summary.status === 'completed';
  const statusLabel = isCompleted ? 'Completed Sprint' : 'Active Sprint';
  const totalMilestones = SPRINT_MILESTONE_STEPS.length;
  const milestoneLabels = SPRINT_MILESTONE_STEPS.filter((step) =>
    summary.completedMilestones.includes(step.key)
  )
    .map((step) => step.label)
    .join(' · ');

  const topReview = summary.feedbackEntries[0] ?? null;
  const lines = [
    `VUKA NA AMANA · SPRINT SUMMARY SNAPSHOT`,
    `${summary.briefTitle} (${statusLabel})`,
    `Partner: ${summary.partnerOrg} · Domain: ${summary.domain}`,
    `Milestones: ${summary.completedMilestones.length}/${totalMilestones}${milestoneLabels ? ` (${milestoneLabels})` : ''}`,
    `Effort & Payout: ${summary.hoursLogged}h logged · $${summary.payoutBreakdown.netDisbursedUsd.toLocaleString()} USD net ($${summary.payoutBreakdown.effectiveHourlyRateUsd.toLocaleString()}/h · $0 platform fee)`,
    `Settlement: ${summary.payoutBreakdown.payoutStatusLabel} via ${summary.payoutBreakdown.payoutRailLabel}${summary.payoutBreakdown.receiptReference ? ` · Receipt ${summary.payoutBreakdown.receiptReference}` : ''}`,
    `Pod Mentor: ${summary.assignedMentor.name} (${summary.assignedMentor.roleTitle})`,
    topReview
      ? `Partner/Mentor Review (${topReview.rating}/5 by ${topReview.reviewerName}): "${truncateText(topReview.reviewText, 140)}"`
      : null,
    `Notes: ${truncateText(summary.solutionNotes, 160)}`,
    `Sprint Deep-Link: ${deepLink}`,
  ].filter((line): line is string => Boolean(line));

  const safeSlug =
    summary.briefTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'sprint-summary';

  const statusColor = isCompleted ? '#146C53' : '#C4622D';
  const statusBg = isCompleted ? '#E7F3EE' : '#F9ECE5';

  const svgMarkup = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="880" height="480" viewBox="0 0 880 480" role="img" aria-label="${escapeXml(summary.briefTitle)} Sprint Snapshot">`,
    `<rect width="880" height="480" rx="24" fill="#FAF8F5"/>`,
    `<rect x="24" y="24" width="832" height="432" rx="18" fill="#FFFFFF" stroke="#E8E3DB" stroke-width="1.5"/>`,
    `<text x="52" y="66" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" letter-spacing="2" fill="#146C53">VUKA NA AMANA · VERIFIED SPRINT SNAPSHOT</text>`,
    `<rect x="656" y="46" width="172" height="28" rx="14" fill="${statusBg}"/>`,
    `<text x="742" y="64" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" fill="${statusColor}">${escapeXml(statusLabel)}</text>`,
    `<text x="52" y="108" font-family="Georgia, serif" font-size="26" font-weight="600" fill="#17191C">${escapeXml(truncateText(summary.briefTitle, 52))}</text>`,
    `<text x="52" y="136" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#575B62">${escapeXml(summary.partnerOrg)} · ${escapeXml(summary.domain)} · Mentor: ${escapeXml(summary.assignedMentor.name)}</text>`,
    `<rect x="52" y="162" width="244" height="84" rx="12" fill="#FAF8F5" stroke="#E8E3DB"/>`,
    `<text x="70" y="190" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#575B62">Net Stipend (Zero Fee)</text>`,
    `<text x="70" y="226" font-family="monospace" font-size="24" font-weight="700" fill="#146C53">$${summary.payoutBreakdown.netDisbursedUsd.toLocaleString()} USD</text>`,
    `<rect x="318" y="162" width="244" height="84" rx="12" fill="#FAF8F5" stroke="#E8E3DB"/>`,
    `<text x="336" y="190" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#575B62">Hours &amp; Milestones</text>`,
    `<text x="336" y="226" font-family="monospace" font-size="24" font-weight="700" fill="#17191C">${summary.hoursLogged}h · ${summary.completedMilestones.length}/${totalMilestones}</text>`,
    `<rect x="584" y="162" width="244" height="84" rx="12" fill="#FAF8F5" stroke="#E8E3DB"/>`,
    `<text x="602" y="190" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#575B62">Effective Rate</text>`,
    `<text x="602" y="226" font-family="monospace" font-size="24" font-weight="700" fill="#C4622D">$${summary.payoutBreakdown.effectiveHourlyRateUsd.toLocaleString()}/h</text>`,
    `<text x="52" y="286" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" fill="#575B62">SOLUTION &amp; DELIVERY NOTES</text>`,
    `<text x="52" y="312" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#17191C">${escapeXml(truncateText(summary.solutionNotes, 96))}</text>`,
    topReview
      ? `<text x="52" y="356" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="#43484E">Review (${topReview.rating}/5 · ${escapeXml(topReview.reviewerName)}): "${escapeXml(truncateText(topReview.reviewText, 82))}"</text>`
      : `<text x="52" y="356" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="#43484E">Settlement: ${escapeXml(summary.payoutBreakdown.payoutStatusLabel)} via ${escapeXml(summary.payoutBreakdown.payoutRailLabel)}</text>`,
    `<line x1="52" y1="392" x2="828" y2="392" stroke="#E8E3DB"/>`,
    `<text x="52" y="424" font-family="monospace" font-size="12" fill="#575B62">${escapeXml(summary.payoutBreakdown.receiptReference ? `Receipt ${summary.payoutBreakdown.receiptReference}` : `Sprint ID ${summary.briefId}`)}</text>`,
    `<text x="828" y="424" text-anchor="end" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#8A847A">${escapeXml(generatedAtIso.slice(0, 10))}</text>`,
    `</svg>`,
  ].join('');

  return {
    headline: `${summary.briefTitle} · $${summary.payoutBreakdown.netDisbursedUsd.toLocaleString()} USD`,
    generatedAtIso,
    deepLink,
    textSummary: lines.join('\n'),
    svgMarkup,
    filenameBase: `vuka-sprint-${safeSlug}`,
  };
}

/**
 * Generates pre-populated context metadata and starter draft for opening
 * MentorMessagingDrawer directly from ExpandedSprintDetails.
 */
export function buildSprintMentorDraftContext(summary: ExpandedSprintSummary): {
  contextNote: string;
  initialDraft: string;
} {
  const statusLabel = summary.status === 'completed' ? 'Completed' : 'In Progress';
  const totalMilestones = SPRINT_MILESTONE_STEPS.length;
  const contextNote = `${statusLabel} · ${summary.completedMilestones.length}/${totalMilestones} milestones · ${summary.hoursLogged}h · $${summary.payoutBreakdown.netDisbursedUsd.toLocaleString()} USD`;
  const initialDraft =
    summary.status === 'completed'
      ? `Hi ${summary.assignedMentor.name}, following up on "${summary.briefTitle}" (${summary.completedMilestones.length}/${totalMilestones} milestones, ${summary.hoursLogged}h logged): `
      : `Hi ${summary.assignedMentor.name}, checking in on "${summary.briefTitle}" (${summary.completedMilestones.length}/${totalMilestones} milestones completed so far): `;
  return { contextNote, initialDraft };
}

export interface SprintJourneyStep {
  id:
    | 'sprint-assigned'
    | 'analysis-complete'
    | 'draft-ready'
    | 'final-submission'
    | 'escrow-released';
  label: string;
  detail: string;
  status: 'completed' | 'current' | 'upcoming';
  timestampLabel?: string;
}

function formatShortTimelineDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Builds the 5-stage visual progress timeline from 'Sprint Assigned' to 'Escrow Released',
 * highlighting each milestone's status within this specific sprint history.
 */
export function buildSprintJourneyTimeline(
  contribution: BriefSubmission,
  summary: ExpandedSprintSummary
): SprintJourneyStep[] {
  const isSprintCompleted = summary.status === 'completed';
  const payout = summary.payoutBreakdown.matchingPayout;
  const isEscrowReleased = payout?.status === 'released';

  const hasAnalysis =
    isSprintCompleted || summary.completedMilestones.includes('analysis-complete');
  const hasDraft =
    isSprintCompleted || summary.completedMilestones.includes('draft-ready');
  const hasSubmission =
    isSprintCompleted || summary.completedMilestones.includes('final-submission');

  const rawSteps: Array<Omit<SprintJourneyStep, 'status'> & { done: boolean }> = [
    {
      id: 'sprint-assigned',
      label: 'Sprint Assigned',
      detail: `Matched with ${summary.partnerOrg}`,
      done: true,
      timestampLabel: formatShortTimelineDate(contribution.createdAtIso),
    },
    {
      id: 'analysis-complete',
      label: 'Analysis Complete',
      detail: 'Baseline scope & constraints verified',
      done: hasAnalysis,
    },
    {
      id: 'draft-ready',
      label: 'Draft Ready',
      detail: 'Working solution ready for pod QA',
      done: hasDraft,
    },
    {
      id: 'final-submission',
      label: 'Final Submission',
      detail: isSprintCompleted
        ? `${summary.hoursLogged}h deliverable submitted`
        : 'Final notes & checklist sign-off',
      done: hasSubmission,
      timestampLabel: isSprintCompleted
        ? formatShortTimelineDate(contribution.updatedAtIso)
        : undefined,
    },
    {
      id: 'escrow-released',
      label: 'Escrow Released',
      detail: isEscrowReleased
        ? `$${summary.payoutBreakdown.netDisbursedUsd.toLocaleString()} USD settled`
        : summary.payoutBreakdown.payoutStatusLabel,
      done: isEscrowReleased,
      timestampLabel: isEscrowReleased
        ? formatShortTimelineDate(payout?.updatedAtIso || payout?.createdAtIso)
        : undefined,
    },
  ];

  let foundFirstPending = false;
  return rawSteps.map(({ done, ...rest }) => {
    if (done) {
      return { ...rest, status: 'completed' };
    }
    if (!foundFirstPending) {
      foundFirstPending = true;
      return { ...rest, status: 'current' };
    }
    return { ...rest, status: 'upcoming' };
  });
}

export interface CollaborationNoteSaveInput {
  contributionId: string;
  briefId: string;
  briefTitle: string;
  markdownBody: string;
}

interface ExpandedSprintDetailsProps {
  contribution: BriefSubmission | null;
  payouts: ContractPayout[];
  sprintFeedback: SprintFeedback[];
  mentorMessages?: MentorMessage[];
  collaborationNotes?: SprintCollaborationNote[];
  sprintMilestonesByBrief?: Record<string, SprintMilestoneKey[]>;
  vault?: WorkReadyVault;
  practitionerName?: string;
  onClose: () => void;
  onOpenInSolve?: (briefId: string) => void;
  onMessageMentor?: (
    briefId: string,
    briefTitle: string,
    domain: string,
    options?: { contextNote?: string; initialDraft?: string }
  ) => void;
  onAddSprintFeedback?: (input: SprintFeedbackDraftInput) => void;
  onSaveCollaborationNote?: (input: CollaborationNoteSaveInput) => void;
  onDeleteCollaborationNote?: (noteId: string) => void;
}

export const ExpandedSprintDetails: React.FC<ExpandedSprintDetailsProps> = ({
  contribution,
  payouts,
  sprintFeedback,
  mentorMessages = [],
  collaborationNotes = [],
  sprintMilestonesByBrief,
  vault,
  practitionerName,
  onClose,
  onOpenInSolve,
  onMessageMentor,
  onAddSprintFeedback,
  onSaveCollaborationNote,
  onDeleteCollaborationNote,
}) => {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copiedDeepLink, setCopiedDeepLink] = useState(false);
  const [copiedSnapshot, setCopiedSnapshot] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [generatedSnapshot, setGeneratedSnapshot] =
    useState<ShareableSprintSnapshot | null>(null);

  const existingNote = useMemo(() => {
    if (!contribution) return null;
    return (
      collaborationNotes.find(
        (n) => n.contributionId === contribution.id || n.briefId === contribution.briefId
      ) ?? null
    );
  }, [collaborationNotes, contribution]);

  const [noteDraft, setNoteDraft] = useState<string>(existingNote?.markdownBody ?? '');
  const [noteEditorMode, setNoteEditorMode] = useState<'write' | 'preview'>(
    existingNote ? 'preview' : 'write'
  );
  const [isEditingNote, setIsEditingNote] = useState<boolean>(!existingNote);
  const [noteSavedNotice, setNoteSavedNotice] = useState<boolean>(false);
  const noteTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setIsShareOpen(false);
    setCopiedDeepLink(false);
    setCopiedSnapshot(false);
    setPdfDownloaded(false);
    setIsFeedbackModalOpen(false);
    setGeneratedSnapshot(null);
    setNoteDraft(existingNote?.markdownBody ?? '');
    setIsEditingNote(!existingNote);
    setNoteEditorMode(existingNote ? 'preview' : 'write');
    setNoteSavedNotice(false);
  }, [contribution?.id, existingNote?.id, existingNote?.markdownBody]);

  useEffect(() => {
    if (!contribution || isFeedbackModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [contribution, isFeedbackModalOpen, onClose]);

  const summary = useMemo(() => {
    if (!contribution) return null;
    return buildExpandedSprintSummary({
      contribution,
      payouts,
      sprintFeedback,
      mentorMessages,
      sprintMilestonesByBrief,
      vault,
    });
  }, [
    contribution,
    payouts,
    sprintFeedback,
    mentorMessages,
    sprintMilestonesByBrief,
    vault,
  ]);

  const deepLinkUrl = useMemo(() => {
    if (!summary) return '';
    const origin =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'https://vuka-na-amana.app';
    return buildSprintDeepLink(origin, summary.briefId, summary.contributionId);
  }, [summary]);

  if (!contribution || !summary) return null;

  const writeClipboard = async (text: string): Promise<boolean> => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Fallback below
    }
    try {
      if (typeof document !== 'undefined') {
        const area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', 'true');
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(area);
        return ok;
      }
    } catch {
      return false;
    }
    return false;
  };

  const handleCopyDeepLink = async () => {
    await writeClipboard(deepLinkUrl);
    setCopiedDeepLink(true);
    window.setTimeout(() => setCopiedDeepLink(false), 2400);
  };

  const handleGenerateSnapshot = () => {
    const snapshot = buildShareableSprintSnapshot(summary, deepLinkUrl);
    setGeneratedSnapshot(snapshot);
  };

  const handleCopySnapshot = async () => {
    const snap = generatedSnapshot ?? buildShareableSprintSnapshot(summary, deepLinkUrl);
    if (!generatedSnapshot) setGeneratedSnapshot(snap);
    await writeClipboard(snap.textSummary);
    setCopiedSnapshot(true);
    window.setTimeout(() => setCopiedSnapshot(false), 2400);
  };

  const handleDownloadSnapshotCard = () => {
    const snap = generatedSnapshot ?? buildShareableSprintSnapshot(summary, deepLinkUrl);
    if (!generatedSnapshot) setGeneratedSnapshot(snap);
    const blob = new Blob([snap.svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${snap.filenameBase}.svg`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const journeyTimeline = useMemo(() => {
    if (!contribution || !summary) return [];
    return buildSprintJourneyTimeline(contribution, summary);
  }, [contribution, summary]);

  const handleOpenMentorFromDetails = () => {
    if (!onMessageMentor) return;
    const mentorContext = buildSprintMentorDraftContext(summary);
    onClose();
    onMessageMentor(
      summary.briefId,
      summary.briefTitle,
      summary.domain,
      mentorContext
    );
  };

  const handleDownloadPdfReport = () => {
    const activeStage =
      journeyTimeline.find((step) => step.status === 'current')?.label ??
      journeyTimeline[journeyTimeline.length - 1]?.label ??
      'Sprint Assigned';
    const completedStepLabels = SPRINT_MILESTONE_STEPS.filter((step) =>
      summary.completedMilestones.includes(step.key)
    ).map((step) => step.label);

    exportSprintReportPdf({
      practitionerName,
      briefId: summary.briefId,
      briefTitle: summary.briefTitle,
      partnerOrg: summary.partnerOrg,
      domain: summary.domain,
      status: summary.status,
      hoursLogged: summary.hoursLogged,
      completedMilestones: completedStepLabels,
      totalMilestones: SPRINT_MILESTONE_STEPS.length,
      journeyStageLabel: activeStage,
      solutionNotes: summary.solutionNotes,
      assignedMentorName: summary.assignedMentor.name,
      assignedMentorRole: summary.assignedMentor.roleTitle,
      feedbackEntries: summary.feedbackEntries.map((fb) => ({
        reviewerName: fb.reviewerName,
        reviewerRole: fb.reviewerRole,
        rating: fb.rating,
        reviewText: fb.reviewText,
      })),
      mentorThreadNotes: summary.mentorThreadMessages.map((msg) => ({
        author: msg.sender === 'mentor' ? msg.mentorName : 'You',
        body: msg.body,
      })),
      grossStipendUsd: summary.payoutBreakdown.grossStipendUsd,
      platformFeeUsd: summary.payoutBreakdown.platformFeeUsd,
      netDisbursedUsd: summary.payoutBreakdown.netDisbursedUsd,
      effectiveHourlyRateUsd: summary.payoutBreakdown.effectiveHourlyRateUsd,
      payoutStatusLabel: summary.payoutBreakdown.payoutStatusLabel,
      payoutRailLabel: summary.payoutBreakdown.payoutRailLabel,
      receiptReference: summary.payoutBreakdown.receiptReference,
      updatedAtIso: summary.updatedAtIso,
    });
    setPdfDownloaded(true);
    window.setTimeout(() => setPdfDownloaded(false), 2600);
  };

  const isCompleted = summary.status === 'completed';

  const formatDate = (iso: string) => {
    const parsed = new Date(iso);
    if (Number.isNaN(parsed.getTime())) return 'Recent';
    return parsed.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="expanded-sprint-details-title"
      data-testid="expanded-sprint-details-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto no-scrollbar"
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.985 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full max-w-3xl max-h-[88vh] flex flex-col rounded-2xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-white dark:bg-[#1A1C20] border-b border-[#E8E3DB] dark:border-[#2C3037] flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
              <span
                className={`font-semibold inline-flex items-center gap-1 ${
                  isCompleted
                    ? 'text-[#146C53] dark:text-[#2EB88B]'
                    : 'text-[#C4622D] dark:text-[#E07B46]'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                ) : (
                  <Clock3 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                )}
                <span>{isCompleted ? 'Completed Sprint' : 'Active Sprint'}</span>
              </span>
              <span aria-hidden="true" className="text-[#8A847A]">·</span>
              <span className="text-[#575B62] dark:text-[#A3A7AE]">{summary.domain}</span>
              <span aria-hidden="true" className="text-[#8A847A]">·</span>
              <span className="text-[#575B62] dark:text-[#A3A7AE]">{summary.partnerOrg}</span>
              <span aria-hidden="true" className="text-[#8A847A]">·</span>
              <span className="font-mono-tabular text-[#575B62] dark:text-[#A3A7AE]">
                {formatDate(summary.updatedAtIso)}
              </span>
            </div>
            <h2
              id="expanded-sprint-details-title"
              className="font-display text-xl sm:text-2xl font-medium text-[#17191C] dark:text-[#F4F2EE] leading-snug"
            >
              {summary.briefTitle}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Sprint Details"
            data-testid="close-expanded-sprint-details-btn"
            className="min-h-[38px] min-w-[38px] rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] inline-flex items-center justify-center shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-5 sm:p-6 space-y-6">
          {/* Expandable Share & Snapshot Panel */}
          <AnimatePresence>
            {isShareOpen && (
              <motion.section
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16 }}
                data-testid="expanded-sprint-share-panel"
                aria-label="Share Sprint Summary"
                className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#146C53]/30 dark:border-[#2EB88B]/35 p-4 sm:p-5 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Share2
                      className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B]"
                      aria-hidden="true"
                    />
                    <h3 className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                      Share Sprint Summary
                    </h3>
                  </div>
                  <span className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                    Deep-link or self-contained summary snapshot
                  </span>
                </div>

                {/* Copy Deep-Link Row */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="sprint-deeplink-input"
                    className="text-xs font-medium text-[#575B62] dark:text-[#A3A7AE] flex items-center gap-1.5"
                  >
                    <Link2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Sprint Deep-Link</span>
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      id="sprint-deeplink-input"
                      data-testid="sprint-deeplink-input"
                      type="text"
                      readOnly
                      value={deepLinkUrl}
                      onFocus={(e) => e.currentTarget.select()}
                      className="flex-1 min-w-0 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] px-3 py-2 text-xs font-mono-tabular text-[#17191C] dark:text-[#F4F2EE]"
                    />
                    <button
                      type="button"
                      data-testid="copy-sprint-deeplink-btn"
                      onClick={() => void handleCopyDeepLink()}
                      className="min-h-[38px] px-3.5 py-2 rounded-lg bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                    >
                      {copiedDeepLink ? (
                        <>
                          <Check className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Deep-Link Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Copy Deep-Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Generate Shareable Snapshot */}
                <div className="pt-3 border-t border-[#E8E3DB] dark:border-[#2C3037] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                      Package milestones, mentor review, and net payout into a shareable card.
                    </p>
                    <button
                      type="button"
                      data-testid="generate-sprint-snapshot-btn"
                      onClick={handleGenerateSnapshot}
                      className="min-h-[36px] px-3.5 py-1.5 rounded-lg border border-[#C4622D]/40 dark:border-[#E07B46]/45 bg-[#F9ECE5]/70 dark:bg-[#2D1E17]/70 hover:bg-[#F9ECE5] dark:hover:bg-[#2D1E17] text-[#C4622D] dark:text-[#E07B46] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>
                        {generatedSnapshot ? 'Refresh Snapshot' : 'Generate Snapshot'}
                      </span>
                    </button>
                  </div>

                  {generatedSnapshot && (
                    <div
                      data-testid="sprint-snapshot-preview"
                      className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-3.5 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#146C53] dark:text-[#2EB88B]">
                          Shareable Sprint Snapshot Ready
                        </span>
                        <span className="text-[11px] font-mono-tabular text-[#575B62] dark:text-[#A3A7AE]">
                          {generatedSnapshot.headline}
                        </span>
                      </div>

                      <pre className="text-[11px] leading-relaxed font-mono-tabular text-[#43484E] dark:text-[#C4C9D0] whitespace-pre-wrap break-words max-h-40 overflow-y-auto bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] rounded-lg p-3">
                        {generatedSnapshot.textSummary}
                      </pre>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          data-testid="copy-sprint-snapshot-btn"
                          onClick={() => void handleCopySnapshot()}
                          className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[#17191C] dark:bg-[#F4F2EE] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          {copiedSnapshot ? (
                            <>
                              <Check className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Snapshot Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Copy Snapshot Text</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          data-testid="download-sprint-snapshot-btn"
                          onClick={handleDownloadSnapshotCard}
                          className="min-h-[36px] px-3 py-1.5 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-[#17191C] dark:text-[#F4F2EE] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Download Card (.svg)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Top Metric Summary */}
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-4">
              <dt className="text-xs text-[#575B62] dark:text-[#A3A7AE]">Net Stipend</dt>
              <dd
                data-testid="expanded-sprint-net-payout"
                className="mt-1 font-mono-tabular tabular-nums text-2xl font-semibold text-[#146C53] dark:text-[#2EB88B]"
              >
                ${summary.payoutBreakdown.netDisbursedUsd.toLocaleString()} USD
              </dd>
            </div>
            <div className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-4">
              <dt className="text-xs text-[#575B62] dark:text-[#A3A7AE]">Hours Applied</dt>
              <dd className="mt-1 font-mono-tabular tabular-nums text-2xl font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                {summary.hoursLogged}h
              </dd>
            </div>
            <div className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-4">
              <dt className="text-xs text-[#575B62] dark:text-[#A3A7AE]">Effective Rate</dt>
              <dd className="mt-1 font-mono-tabular tabular-nums text-2xl font-semibold text-[#C4622D] dark:text-[#E07B46]">
                ${summary.payoutBreakdown.effectiveHourlyRateUsd.toLocaleString()}/h
              </dd>
            </div>
          </dl>

          {/* Visual Progress Timeline: Sprint Assigned -> Escrow Released */}
          <section
            data-testid="expanded-sprint-progress-timeline"
            aria-label="Sprint Journey Progress Timeline"
            className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-4 sm:p-5 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                Sprint Journey Timeline
              </h3>
              <span className="text-xs font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE]">
                {journeyTimeline.filter((s) => s.status === 'completed').length}/
                {journeyTimeline.length} stages cleared
              </span>
            </div>

            <ol className="grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-2">
              {journeyTimeline.map((step, idx) => {
                const isDone = step.status === 'completed';
                const isCurrent = step.status === 'current';
                const isLast = idx === journeyTimeline.length - 1;
                return (
                  <li
                    key={step.id}
                    data-testid={`sprint-timeline-step-${step.id}`}
                    data-step-status={step.status}
                    className="relative flex md:flex-col items-start md:items-stretch gap-3 md:gap-2"
                  >
                    {/* Step indicator + horizontal/vertical track */}
                    <div className="flex md:items-center gap-2 shrink-0">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono-tabular font-semibold border transition-colors ${
                          isDone
                            ? 'bg-[#146C53] dark:bg-[#2EB88B] border-[#146C53] dark:border-[#2EB88B] text-white dark:text-[#121315]'
                            : isCurrent
                              ? 'bg-[#F9ECE5] dark:bg-[#2D1E17] border-2 border-[#C4622D] dark:border-[#E07B46] text-[#C4622D] dark:text-[#E07B46]'
                              : 'bg-[#FAF8F5] dark:bg-[#121315] border-[#E8E3DB] dark:border-[#2C3037] text-[#8A847A]'
                        }`}
                      >
                        {isDone ? (
                          <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        ) : (
                          <span>{idx + 1}</span>
                        )}
                      </span>
                      {!isLast && (
                        <div
                          aria-hidden="true"
                          className={`hidden md:block flex-1 h-0.5 rounded-full ${
                            isDone
                              ? 'bg-[#146C53]/55 dark:bg-[#2EB88B]/55'
                              : 'bg-[#E8E3DB] dark:bg-[#2C3037]'
                          }`}
                        />
                      )}
                    </div>

                    {/* Step text */}
                    <div
                      className={`min-w-0 flex-1 rounded-lg px-2.5 py-2 border ${
                        isCurrent
                          ? 'bg-[#F9ECE5]/60 dark:bg-[#2D1E17]/60 border-[#C4622D]/35 dark:border-[#E07B46]/40'
                          : isDone
                            ? 'bg-[#FAF8F5] dark:bg-[#121315] border-[#146C53]/20 dark:border-[#2EB88B]/25'
                            : 'bg-[#FAF8F5]/60 dark:bg-[#121315]/60 border-[#E8E3DB] dark:border-[#2C3037]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <p
                          className={`text-xs font-semibold leading-snug ${
                            isCurrent
                              ? 'text-[#C4622D] dark:text-[#E07B46]'
                              : isDone
                                ? 'text-[#146C53] dark:text-[#2EB88B]'
                                : 'text-[#575B62] dark:text-[#A3A7AE]'
                          }`}
                        >
                          {step.label}
                        </p>
                      </div>
                      <p className="mt-0.5 text-[11px] text-[#575B62] dark:text-[#A3A7AE] leading-snug">
                        {step.detail}
                      </p>
                      <p className="mt-1 text-[10px] font-mono-tabular uppercase tracking-wider text-[#8A847A]">
                        {isCurrent
                          ? 'Current Stage'
                          : step.timestampLabel ?? (isDone ? 'Cleared' : 'Pending')}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          {/* Delivery Milestones & Solution Notes */}
          <section className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE] flex items-center gap-2">
                <Award className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B]" aria-hidden="true" />
                <span>Delivered Phases &amp; Solution Summary</span>
              </h3>
              <span className="text-xs font-mono-tabular tabular-nums font-semibold text-[#146C53] dark:text-[#2EB88B]">
                {summary.completedMilestones.length}/{SPRINT_MILESTONE_STEPS.length} milestones
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {SPRINT_MILESTONE_STEPS.map((step) => {
                const done = summary.completedMilestones.includes(step.key);
                return (
                  <div
                    key={step.key}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium flex items-center gap-2 ${
                      done
                        ? 'bg-[#E7F3EE]/70 dark:bg-[#142B24]/80 border-[#146C53]/30 dark:border-[#2EB88B]/35 text-[#146C53] dark:text-[#2EB88B]'
                        : 'bg-[#FAF8F5] dark:bg-[#121315] border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE]'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{step.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-[#E8E3DB] dark:border-[#2C3037]">
              <p className="text-xs font-medium text-[#575B62] dark:text-[#A3A7AE] mb-1">
                Submitted Solution Notes
              </p>
              <p className="text-xs sm:text-sm text-[#17191C] dark:text-[#F4F2EE] leading-relaxed whitespace-pre-wrap">
                {summary.solutionNotes}
              </p>
            </div>
          </section>

          {/* Mentor Feedback & Pod Thread */}
          <section
            data-testid="expanded-sprint-mentor-feedback"
            className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-4 sm:p-5 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE] flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#C4622D] dark:text-[#E07B46]" aria-hidden="true" />
                  <span>Mentor &amp; Partner Feedback</span>
                </h3>
                <p className="mt-0.5 text-xs text-[#575B62] dark:text-[#A3A7AE]">
                  {summary.assignedMentor.name} · {summary.assignedMentor.roleTitle}
                </p>
              </div>

              {onAddSprintFeedback && (
                <button
                  type="button"
                  data-testid="expanded-sprint-leave-feedback-btn"
                  onClick={() => setIsFeedbackModalOpen(true)}
                  className="min-h-[34px] px-3 py-1.5 rounded-lg border border-[#146C53]/35 dark:border-[#2EB88B]/40 bg-[#E7F3EE]/70 dark:bg-[#142B24] hover:bg-[#D7ECE4] dark:hover:bg-[#1B3A30] text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Leave Feedback</span>
                </button>
              )}
            </div>

            {summary.feedbackEntries.length > 0 ? (
              <div className="space-y-3">
                {summary.feedbackEntries.map((fb) => (
                  <div
                    key={fb.id}
                    className="rounded-lg bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-3.5 space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                        {fb.reviewerName} · {fb.reviewerRole}
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono-tabular tabular-nums font-semibold text-[#C4622D] dark:text-[#E07B46]">
                        <Star className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                        <span>{fb.rating}/5</span>
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#43484E] dark:text-[#C4C9D0] leading-relaxed">
                      &ldquo;{fb.reviewText}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-3.5 text-xs text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                <p className="font-medium text-[#17191C] dark:text-[#F4F2EE]">
                  Pod Mentor Guidance ({summary.assignedMentor.name})
                </p>
                <p className="mt-1">
                  {summary.assignedMentor.specialty} · {summary.assignedMentor.hubLocation}.{' '}
                  {isCompleted
                    ? 'Partner review rating can be logged directly from the Sprint Feedback panel in Pulse.'
                    : 'Your assigned mentor is available in Solve for live QA sign-off before final submission.'}
                </p>
              </div>
            )}

            {summary.mentorThreadMessages.length > 0 && (
              <div className="pt-3 border-t border-[#E8E3DB] dark:border-[#2C3037] space-y-2">
                <p className="text-xs font-medium text-[#575B62] dark:text-[#A3A7AE]">
                  Recent Mentor Thread Notes ({summary.mentorThreadMessages.length})
                </p>
                <ul className="space-y-2">
                  {summary.mentorThreadMessages.slice(-3).map((msg) => (
                    <li
                      key={msg.id}
                      className="rounded-lg bg-[#FAF8F5] dark:bg-[#121315] px-3 py-2 text-xs text-[#43484E] dark:text-[#C4C9D0]"
                    >
                      <span className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                        {msg.sender === 'mentor' ? msg.mentorName : 'You'}:
                      </span>{' '}
                      {msg.body}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Private Collaboration Notes (Markdown-Formatted Team Dynamics Reflections) */}
          <section
            data-testid="expanded-sprint-collaboration-notes"
            aria-label="Private Collaboration Notes"
            className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-4 sm:p-5 space-y-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE] flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B]" aria-hidden="true" />
                    <span>Collaboration Notes</span>
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#E7F3EE]/80 dark:bg-[#142B24] border border-[#146C53]/25 dark:border-[#2EB88B]/30 text-[10px] font-semibold text-[#146C53] dark:text-[#2EB88B]">
                    Private · Visible only to you
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-[#575B62] dark:text-[#A3A7AE]">
                  Markdown reflections on team dynamics, pod handoffs, and mentor coordination (excluded from shared cards).
                </p>
              </div>

              {existingNote && !isEditingNote && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    data-testid="edit-collaboration-note-btn"
                    onClick={() => {
                      setNoteDraft(existingNote.markdownBody);
                      setIsEditingNote(true);
                      setNoteEditorMode('write');
                    }}
                    className="min-h-[32px] px-2.5 py-1 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Edit Note</span>
                  </button>
                  {onDeleteCollaborationNote && (
                    <button
                      type="button"
                      data-testid="delete-collaboration-note-btn"
                      onClick={() => {
                        onDeleteCollaborationNote(existingNote.id);
                        setNoteDraft('');
                        setIsEditingNote(true);
                        setNoteEditorMode('write');
                      }}
                      aria-label="Delete private collaboration note"
                      className="min-h-[32px] px-2.5 py-1 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] hover:border-[#C4622D] dark:hover:border-[#E07B46] text-xs font-semibold text-[#575B62] dark:text-[#A3A7AE] hover:text-[#C4622D] dark:hover:text-[#E07B46] inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {!isEditingNote && existingNote ? (
              <div
                data-testid="collaboration-note-saved-preview"
                className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-4 space-y-3"
              >
                <MarkdownPreview content={existingNote.markdownBody} />
                <div className="pt-2 border-t border-[#E8E3DB] dark:border-[#2C3037] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-tabular text-[#575B62] dark:text-[#A3A7AE]">
                  <span>
                    Updated{' '}
                    {new Date(existingNote.updatedAtIso).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  {noteSavedNotice && (
                    <span className="inline-flex items-center gap-1 font-semibold text-[#146C53] dark:text-[#2EB88B]">
                      <Check className="w-3 h-3" aria-hidden="true" />
                      Saved privately
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Editor Toolbar + Write/Preview Tabs */}
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-2.5 py-1.5">
                  <div className="flex flex-wrap items-center gap-1">
                    {[
                      {
                        label: 'Heading',
                        icon: Heading2,
                        insert: '## ',
                        mode: 'line' as const,
                      },
                      {
                        label: 'Bold',
                        icon: Bold,
                        insert: '**bold**',
                        mode: 'wrap' as const,
                      },
                      {
                        label: 'Italic',
                        icon: Italic,
                        insert: '*italic*',
                        mode: 'wrap' as const,
                      },
                      {
                        label: 'Bullet List',
                        icon: List,
                        insert: '- ',
                        mode: 'line' as const,
                      },
                      {
                        label: 'Quote',
                        icon: Quote,
                        insert: '> ',
                        mode: 'line' as const,
                      },
                    ].map((tool) => {
                      const IconComp = tool.icon;
                      return (
                        <button
                          key={tool.label}
                          type="button"
                          disabled={noteEditorMode === 'preview'}
                          onClick={() => {
                            const textarea = noteTextareaRef.current;
                            const start = textarea?.selectionStart ?? noteDraft.length;
                            const end = textarea?.selectionEnd ?? noteDraft.length;
                            const selected = noteDraft.slice(start, end);
                            let snippet = tool.insert;
                            if (tool.mode === 'wrap' && selected) {
                              snippet =
                                tool.label === 'Bold' ? `**${selected}**` : `*${selected}*`;
                            } else if (tool.mode === 'line' && start > 0 && noteDraft[start - 1] !== '\n') {
                              snippet = `\n${tool.insert}`;
                            }
                            const nextVal =
                              noteDraft.slice(0, start) + snippet + noteDraft.slice(end);
                            setNoteDraft(nextVal.slice(0, 4000));
                            setNoteEditorMode('write');
                          }}
                          aria-label={`Insert ${tool.label}`}
                          title={tool.label}
                          className="p-1.5 rounded-md text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] hover:bg-white dark:hover:bg-[#1A1C20] disabled:opacity-40 transition-colors cursor-pointer"
                        >
                          <IconComp className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      );
                    })}
                  </div>

                  <div
                    role="tablist"
                    aria-label="Collaboration Note Editor Mode"
                    className="inline-flex rounded-md border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] p-0.5 gap-0.5"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={noteEditorMode === 'write'}
                      data-testid="collaboration-note-write-tab"
                      onClick={() => setNoteEditorMode('write')}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer ${
                        noteEditorMode === 'write'
                          ? 'bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B]'
                          : 'text-[#575B62] dark:text-[#A3A7AE]'
                      }`}
                    >
                      <Edit3 className="w-3 h-3" aria-hidden="true" />
                      <span>Write</span>
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={noteEditorMode === 'preview'}
                      data-testid="collaboration-note-preview-tab"
                      onClick={() => setNoteEditorMode('preview')}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer ${
                        noteEditorMode === 'preview'
                          ? 'bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B]'
                          : 'text-[#575B62] dark:text-[#A3A7AE]'
                      }`}
                    >
                      <Eye className="w-3 h-3" aria-hidden="true" />
                      <span>Preview</span>
                    </button>
                  </div>
                </div>

                {noteEditorMode === 'write' ? (
                  <textarea
                    ref={noteTextareaRef}
                    data-testid="collaboration-note-textarea"
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value.slice(0, 4000))}
                    rows={4}
                    maxLength={4000}
                    aria-label="Private markdown collaboration note"
                    placeholder="Capture private reflections on team dynamics, handoff clarity, or mentor sync cadence (supports ## Headings, **bold**, *italic*, - lists, and > quotes)..."
                    className="w-full rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] focus:border-[#146C53] dark:focus:border-[#2EB88B] focus:outline-none px-3.5 py-2.5 text-xs sm:text-sm text-[#17191C] dark:text-[#F4F2EE] placeholder:text-[#787C83] dark:placeholder:text-[#8E95A0] leading-relaxed"
                  />
                ) : (
                  <div
                    data-testid="collaboration-note-live-preview"
                    className="min-h-[108px] rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-3.5"
                  >
                    <MarkdownPreview content={noteDraft} />
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE]">
                    {noteDraft.trim().length}/4000 chars · Markdown supported
                  </span>

                  <div className="flex items-center gap-2">
                    {existingNote && (
                      <button
                        type="button"
                        onClick={() => {
                          setNoteDraft(existingNote.markdownBody);
                          setIsEditingNote(false);
                          setNoteEditorMode('preview');
                        }}
                        className="min-h-[34px] px-3 py-1 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] text-xs font-semibold text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}

                    <button
                      type="button"
                      data-testid="save-collaboration-note-btn"
                      disabled={noteDraft.trim().length === 0}
                      onClick={() => {
                        const trimmed = noteDraft.trim();
                        if (!trimmed) return;
                        onSaveCollaborationNote?.({
                          contributionId: summary.contributionId,
                          briefId: summary.briefId,
                          briefTitle: summary.briefTitle,
                          markdownBody: trimmed,
                        });
                        setIsEditingNote(false);
                        setNoteEditorMode('preview');
                        setNoteSavedNotice(true);
                        window.setTimeout(() => setNoteSavedNotice(false), 3000);
                      }}
                      className="min-h-[34px] px-3.5 py-1.5 rounded-lg bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{existingNote ? 'Update Private Note' : 'Save Private Note'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Final Payout Breakdown */}
          <section
            data-testid="expanded-sprint-payout-breakdown"
            className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-4 sm:p-5 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE] flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B]" aria-hidden="true" />
                <span>Final Payout Breakdown</span>
              </h3>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#146C53] dark:text-[#2EB88B]">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{summary.payoutBreakdown.payoutStatusLabel}</span>
              </span>
            </div>

            <dl className="divide-y divide-[#E8E3DB] dark:divide-[#2C3037] text-xs sm:text-sm">
              <div className="py-2.5 flex items-center justify-between gap-4">
                <dt className="text-[#575B62] dark:text-[#A3A7AE]">Gross Milestone Stipend</dt>
                <dd className="font-mono-tabular tabular-nums font-medium text-[#17191C] dark:text-[#F4F2EE]">
                  ${summary.payoutBreakdown.grossStipendUsd.toLocaleString()} USD
                </dd>
              </div>
              <div className="py-2.5 flex items-center justify-between gap-4">
                <dt className="text-[#575B62] dark:text-[#A3A7AE]">
                  Platform / Broker Fee (Zero-Deduction Guarantee)
                </dt>
                <dd className="font-mono-tabular tabular-nums font-medium text-[#146C53] dark:text-[#2EB88B]">
                  $0 USD (0%)
                </dd>
              </div>
              <div className="py-2.5 flex items-center justify-between gap-4">
                <dt className="text-[#575B62] dark:text-[#A3A7AE]">Settlement Rail</dt>
                <dd className="font-medium text-[#17191C] dark:text-[#F4F2EE]">
                  {summary.payoutBreakdown.payoutRailLabel}
                </dd>
              </div>
              {summary.payoutBreakdown.receiptReference && (
                <div className="py-2.5 flex items-center justify-between gap-4">
                  <dt className="text-[#575B62] dark:text-[#A3A7AE]">Compliance Receipt ID</dt>
                  <dd className="font-mono-tabular text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                    {summary.payoutBreakdown.receiptReference}
                  </dd>
                </div>
              )}
              <div className="pt-3 flex items-center justify-between gap-4">
                <dt className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                  Final Net Payout
                </dt>
                <dd className="font-mono-tabular tabular-nums text-base sm:text-lg font-semibold text-[#146C53] dark:text-[#2EB88B]">
                  ${summary.payoutBreakdown.netDisbursedUsd.toLocaleString()} USD
                </dd>
              </div>
            </dl>
          </section>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 bg-white dark:bg-[#1A1C20] border-t border-[#E8E3DB] dark:border-[#2C3037] flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            {onMessageMentor && (
              <button
                type="button"
                data-testid="expanded-sprint-message-mentor-btn"
                onClick={handleOpenMentorFromDetails}
                className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Message Mentor</span>
              </button>
            )}

            <button
              type="button"
              data-testid="expanded-sprint-download-pdf-btn"
              onClick={handleDownloadPdfReport}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-[#C4622D]/40 dark:border-[#E07B46]/45 bg-[#F9ECE5]/70 dark:bg-[#2D1E17]/70 hover:bg-[#F9ECE5] dark:hover:bg-[#2D1E17] text-[#C4622D] dark:text-[#E07B46] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {pdfDownloaded ? (
                <>
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>PDF Downloaded</span>
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Download PDF Report</span>
                </>
              )}
            </button>

            <button
              type="button"
              data-testid="expanded-sprint-share-btn"
              aria-expanded={isShareOpen}
              onClick={() => setIsShareOpen((prev) => !prev)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                isShareOpen
                  ? 'border-[#146C53] dark:border-[#2EB88B] bg-[#E7F3EE]/70 dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B]'
                  : 'border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-[#17191C] dark:text-[#F4F2EE]'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isShareOpen ? 'Hide Share' : 'Share'}</span>
            </button>

            {onOpenInSolve && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenInSolve(summary.briefId);
                }}
                className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-[#146C53]/30 dark:border-[#2EB88B]/35 text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] hover:bg-[#E7F3EE]/60 dark:hover:bg-[#142B24] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>View in Solve Workbench</span>
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[38px] px-4 py-1.5 rounded-xl bg-[#17191C] dark:bg-[#F4F2EE] text-white dark:text-[#121315] text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {isFeedbackModalOpen && onAddSprintFeedback && (
          <SprintFeedbackModal
            isOpen={isFeedbackModalOpen}
            contributionId={summary.contributionId}
            briefId={summary.briefId}
            briefTitle={summary.briefTitle}
            partnerOrg={summary.partnerOrg}
            assignedMentor={summary.assignedMentor}
            practitionerName={practitionerName}
            onClose={() => setIsFeedbackModalOpen(false)}
            onSaveFeedback={(input) => onAddSprintFeedback(input)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
