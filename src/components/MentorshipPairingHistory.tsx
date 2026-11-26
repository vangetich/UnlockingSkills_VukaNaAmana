import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  GitCommit,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import type {
  BriefSubmission,
  MentorPairingCadence,
  MentorPairingRequest,
  MentorPairingStatus,
  PodMentorProfile,
  SprintCollaborationNote,
  StudioDomain,
} from '../types/kora';
import {
  POD_MENTORS,
  STUDIO_DOMAINS,
  getAssignedMentorForSprint,
} from '../utils/talentEngine';

export interface PairingHistoryTimelineItem {
  pairing: MentorPairingRequest;
  mentor: PodMentorProfile;
  linkedNotes: SprintCollaborationNote[];
  matchedContribution: BriefSubmission | null;
  statusLabel: string;
  cadenceLabel: string;
  formattedDate: string;
}

export interface PairingHistorySummary {
  totalPairings: number;
  activeCount: number;
  matchedCount: number;
  requestedCount: number;
  domainsCovered: StudioDomain[];
  totalLinkedNotesCount: number;
}

const STATUS_LABELS: Record<MentorPairingStatus, string> = {
  active: 'Active Pairing',
  matched: 'Matched Pairing',
  requested: 'Requested Pairing',
};

const CADENCE_LABELS: Record<MentorPairingCadence, string> = {
  'milestone-gates': 'Milestone Gates',
  'weekly-check-in': 'Weekly Check-In',
  'async-review': 'Async Review',
};

/**
 * Matches collaboration notes belonging to a mentorship pairing's sprint,
 * brief title, or domain period.
 */
export function matchCollaborationNotesForPairing(
  pairing: MentorPairingRequest,
  collaborationNotes: SprintCollaborationNote[] = [],
  contributions: BriefSubmission[] = []
): SprintCollaborationNote[] {
  if (!Array.isArray(collaborationNotes) || collaborationNotes.length === 0) {
    return [];
  }

  const normalizedSprintId = pairing.sprintId?.trim().toLowerCase();
  const normalizedSprintTitle = pairing.sprintTitle?.trim().toLowerCase();

  // Direct match by sprintId or sprintTitle
  const directMatches = collaborationNotes.filter((note) => {
    const noteBriefId = (note.briefId ?? '').trim().toLowerCase();
    const noteTitle = (note.briefTitle ?? '').trim().toLowerCase();
    if (normalizedSprintId && noteBriefId === normalizedSprintId) {
      return true;
    }
    if (normalizedSprintTitle && noteTitle === normalizedSprintTitle) {
      return true;
    }
    return false;
  });

  if (directMatches.length > 0) {
    return [...directMatches].sort((a, b) =>
      b.updatedAtIso.localeCompare(a.updatedAtIso)
    );
  }

  // Fallback: match via contributions in the same domain during the pairing period
  const domainContribIds = new Set(
    contributions
      .filter(
        (c) =>
          c.domain.trim().toLowerCase() === pairing.domain.trim().toLowerCase()
      )
      .map((c) => c.id)
  );
  const domainBriefIds = new Set(
    contributions
      .filter(
        (c) =>
          c.domain.trim().toLowerCase() === pairing.domain.trim().toLowerCase()
      )
      .map((c) => c.briefId)
  );

  const fallbackMatches = collaborationNotes.filter(
    (note) =>
      domainContribIds.has(note.contributionId) || domainBriefIds.has(note.briefId)
  );

  return [...fallbackMatches].sort((a, b) =>
    b.updatedAtIso.localeCompare(a.updatedAtIso)
  );
}

/**
 * Resolves the best-matching BriefSubmission record so clicking the collaboration note
 * quick link can open the ExpandedSprintDetails modal directly on that sprint.
 */
export function findContributionForPairing(
  pairing: MentorPairingRequest,
  linkedNotes: SprintCollaborationNote[],
  contributions: BriefSubmission[] = []
): BriefSubmission | null {
  if (pairing.sprintId) {
    const byBriefId = contributions.find((c) => c.briefId === pairing.sprintId);
    if (byBriefId) return byBriefId;
  }
  if (pairing.sprintTitle) {
    const normalized = pairing.sprintTitle.trim().toLowerCase();
    const byTitle = contributions.find(
      (c) => c.briefTitle.trim().toLowerCase() === normalized
    );
    if (byTitle) return byTitle;
  }
  if (linkedNotes.length > 0) {
    const primaryNote = linkedNotes[0];
    const byNoteContrib = contributions.find(
      (c) =>
        c.id === primaryNote.contributionId || c.briefId === primaryNote.briefId
    );
    if (byNoteContrib) return byNoteContrib;
  }
  const byDomain = contributions.find(
    (c) => c.domain.trim().toLowerCase() === pairing.domain.trim().toLowerCase()
  );
  return byDomain ?? null;
}

/**
 * Builds a chronological (newest-first) timeline of mentorship pairings enriched with
 * mentor profiles, matched sprint contributions, and shared collaboration notes.
 */
export function buildPairingHistoryTimeline(params: {
  pairings: MentorPairingRequest[];
  collaborationNotes?: SprintCollaborationNote[];
  contributions?: BriefSubmission[];
  statusFilter?: 'all' | MentorPairingStatus;
  domainFilter?: 'all' | StudioDomain;
}): PairingHistoryTimelineItem[] {
  const {
    pairings = [],
    collaborationNotes = [],
    contributions = [],
    statusFilter = 'all',
    domainFilter = 'all',
  } = params;

  const filtered = pairings.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (domainFilter !== 'all' && p.domain !== domainFilter) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const aTime = Date.parse(a.createdAtIso || a.updatedAtIso) || 0;
    const bTime = Date.parse(b.createdAtIso || b.updatedAtIso) || 0;
    if (bTime !== aTime) return bTime - aTime;
    return b.id.localeCompare(a.id);
  });

  return sorted.map((pairing) => {
    const mentor =
      POD_MENTORS.find((m) => m.id === pairing.mentorId) ??
      getAssignedMentorForSprint(pairing.sprintId || pairing.trackId, pairing.domain);
    const linkedNotes = matchCollaborationNotesForPairing(
      pairing,
      collaborationNotes,
      contributions
    );
    const matchedContribution = findContributionForPairing(
      pairing,
      linkedNotes,
      contributions
    );
    const rawDate = (pairing.createdAtIso || pairing.updatedAtIso || '').slice(0, 10);
    const formattedDate = rawDate.length === 10 ? rawDate : 'Recent';

    return {
      pairing,
      mentor,
      linkedNotes,
      matchedContribution,
      statusLabel: STATUS_LABELS[pairing.status] ?? 'Requested Pairing',
      cadenceLabel:
        CADENCE_LABELS[pairing.preferredCadence] ?? 'Milestone Gates',
      formattedDate,
    };
  });
}

/**
 * Computes aggregate metrics across all mentorship pairings for the header summary strip.
 */
export function computePairingHistorySummary(
  pairings: MentorPairingRequest[] = [],
  collaborationNotes: SprintCollaborationNote[] = [],
  contributions: BriefSubmission[] = []
): PairingHistorySummary {
  let activeCount = 0;
  let matchedCount = 0;
  let requestedCount = 0;
  const domainSet = new Set<StudioDomain>();
  const linkedNoteIds = new Set<string>();

  pairings.forEach((p) => {
    if (p.status === 'active') activeCount += 1;
    else if (p.status === 'matched') matchedCount += 1;
    else requestedCount += 1;

    if (STUDIO_DOMAINS.includes(p.domain)) {
      domainSet.add(p.domain);
    }

    const notes = matchCollaborationNotesForPairing(
      p,
      collaborationNotes,
      contributions
    );
    notes.forEach((n) => linkedNoteIds.add(n.id));
  });

  return {
    totalPairings: pairings.length,
    activeCount,
    matchedCount,
    requestedCount,
    domainsCovered: STUDIO_DOMAINS.filter((d) => domainSet.has(d)),
    totalLinkedNotesCount: linkedNoteIds.size,
  };
}

interface MentorshipPairingHistoryProps {
  pairings: MentorPairingRequest[];
  collaborationNotes?: SprintCollaborationNote[];
  contributions?: BriefSubmission[];
  onOpenCollaborationNote?: (
    contribution: BriefSubmission,
    note?: SprintCollaborationNote
  ) => void;
  onOpenMentorThread?: (
    sprintId: string,
    sprintTitle: string,
    domain: string
  ) => void;
  onGoToSolve?: () => void;
}

export const MentorshipPairingHistory: React.FC<MentorshipPairingHistoryProps> = ({
  pairings = [],
  collaborationNotes = [],
  contributions = [],
  onOpenCollaborationNote,
  onOpenMentorThread,
  onGoToSolve,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | MentorPairingStatus>('all');
  const [domainFilter, setDomainFilter] = useState<'all' | StudioDomain>('all');
  const [expandedNotePairingId, setExpandedNotePairingId] = useState<string | null>(
    null
  );

  const summary = useMemo(
    () =>
      computePairingHistorySummary(pairings, collaborationNotes, contributions),
    [pairings, collaborationNotes, contributions]
  );

  const timelineItems = useMemo(
    () =>
      buildPairingHistoryTimeline({
        pairings,
        collaborationNotes,
        contributions,
        statusFilter,
        domainFilter,
      }),
    [pairings, collaborationNotes, contributions, statusFilter, domainFilter]
  );

  const handleQuickAccessNote = (item: PairingHistoryTimelineItem) => {
    if (item.matchedContribution && onOpenCollaborationNote) {
      onOpenCollaborationNote(item.matchedContribution, item.linkedNotes[0]);
      return;
    }
    setExpandedNotePairingId((prev) =>
      prev === item.pairing.id ? null : item.pairing.id
    );
  };

  return (
    <section
      aria-labelledby="mentorship-pairing-history-heading"
      data-testid="mentorship-pairing-history"
      className="rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 sm:p-8 space-y-6"
    >
      {/* Header & Summary Strip */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-[#E8E3DB] dark:border-[#2C3037]">
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#146C53] dark:text-[#2EB88B]">
            Cross-Age Pod Lineage · Chronological Pairing Ledger
          </p>
          <h2
            id="mentorship-pairing-history-heading"
            className="font-display text-xl sm:text-2xl font-medium text-[#17191C] dark:text-[#F4F2EE]"
          >
            Mentorship Pairing History &amp; Shared Collaboration Notes
          </h2>
          <p className="text-xs sm:text-sm text-[#575B62] dark:text-[#A3A7AE] max-w-2xl">
            Track every previous and active mentor pairing in chronological order, inspect domain coverage, and jump directly to shared pod collaboration notes from that sprint period.
          </p>
        </div>

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          <div className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3.5 py-2.5">
            <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
              Total Pairings
            </p>
            <p
              data-testid="pairing-history-total-count"
              className="mt-0.5 font-mono-tabular tabular-nums text-lg font-semibold text-[#17191C] dark:text-[#F4F2EE]"
            >
              {summary.totalPairings}
            </p>
          </div>

          <div className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3.5 py-2.5">
            <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
              Active / Matched
            </p>
            <p
              data-testid="pairing-history-active-count"
              className="mt-0.5 font-mono-tabular tabular-nums text-lg font-semibold text-[#146C53] dark:text-[#2EB88B]"
            >
              {summary.activeCount} · {summary.matchedCount}
            </p>
          </div>

          <div className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3.5 py-2.5">
            <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
              Domains Covered
            </p>
            <p
              data-testid="pairing-history-domains-count"
              className="mt-0.5 font-mono-tabular tabular-nums text-lg font-semibold text-[#17191C] dark:text-[#F4F2EE]"
            >
              {summary.domainsCovered.length}
            </p>
          </div>

          <div className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3.5 py-2.5">
            <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
              Shared Notes
            </p>
            <p
              data-testid="pairing-history-notes-count"
              className="mt-0.5 font-mono-tabular tabular-nums text-lg font-semibold text-[#C4622D] dark:text-[#E07B46]"
            >
              {summary.totalLinkedNotesCount}
            </p>
          </div>
        </div>
      </div>

      {/* Domains Covered Readout & Interactive Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
          <span>Domains covered: </span>
          <strong
            data-testid="pairing-history-domains-list"
            className="font-semibold text-[#17191C] dark:text-[#F4F2EE]"
          >
            {summary.domainsCovered.length > 0
              ? summary.domainsCovered.join(' · ')
              : 'No domains paired yet'}
          </strong>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter Buttons */}
          <div
            role="group"
            aria-label="Filter pairings by status"
            className="inline-flex items-center p-1 rounded-xl bg-[#F2EEE8] dark:bg-[#121315]"
          >
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'active', label: 'Active' },
                { id: 'matched', label: 'Matched' },
                { id: 'requested', label: 'Requested' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                data-testid={`pairing-filter-status-${tab.id}`}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-white dark:bg-[#1A1C20] text-[#17191C] dark:text-[#F4F2EE] shadow-xs'
                    : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Domain Select Control */}
          <label htmlFor="pairing-domain-filter" className="sr-only">
            Filter pairings by domain
          </label>
          <select
            id="pairing-domain-filter"
            data-testid="pairing-domain-filter"
            value={domainFilter}
            onChange={(e) =>
              setDomainFilter(e.target.value as 'all' | StudioDomain)
            }
            className="min-h-[34px] rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] px-3 text-xs text-[#17191C] dark:text-[#F4F2EE]"
          >
            <option value="all">All Domains</option>
            {STUDIO_DOMAINS.map((domain) => (
              <option key={domain} value={domain}>
                {domain}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chronological Timeline List */}
      {timelineItems.length === 0 ? (
        <div
          data-testid="pairing-history-empty"
          className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-6 text-center space-y-2.5"
        >
          <p className="text-sm font-medium text-[#17191C] dark:text-[#F4F2EE]">
            No mentorship pairings match the current filter
          </p>
          <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
            Request a formal mentor pairing in Solve → Mentorship Paths or reset your filters to view your full pairing timeline.
          </p>
          <div className="flex items-center justify-center gap-3 pt-1">
            {(statusFilter !== 'all' || domainFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setDomainFilter('all');
                }}
                className="text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] hover:underline cursor-pointer"
              >
                Reset Filters
              </button>
            )}
            {onGoToSolve && (
              <button
                type="button"
                onClick={onGoToSolve}
                className="text-xs font-semibold text-[#C4622D] dark:text-[#E07B46] hover:underline cursor-pointer"
              >
                Explore Mentorship Paths in Solve
              </button>
            )}
          </div>
        </div>
      ) : (
        <ol
          data-testid="pairing-history-timeline-list"
          className="relative space-y-4"
        >
          {timelineItems.map((item, index) => {
            const {
              pairing,
              mentor,
              linkedNotes,
              matchedContribution,
              statusLabel,
              cadenceLabel,
              formattedDate,
            } = item;
            const isNoteExpanded = expandedNotePairingId === pairing.id;
            const statusColorClass =
              pairing.status === 'active'
                ? 'text-[#146C53] dark:text-[#2EB88B]'
                : pairing.status === 'matched'
                  ? 'text-[#17191C] dark:text-[#F4F2EE]'
                  : 'text-[#C4622D] dark:text-[#E07B46]';

            return (
              <li
                key={pairing.id}
                data-testid={`pairing-history-item-${pairing.id}`}
                className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-5 space-y-4 transition-colors"
              >
                {/* Top Timeline Metadata Row (Zero static pills — clean dot-separated typography) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1.5 font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE]">
                      <GitCommit className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B]" />
                      <span>#{timelineItems.length - index}</span>
                    </span>
                    <span aria-hidden="true" className="text-[#8A847A]">
                      ·
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE]">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span>{formattedDate}</span>
                    </span>
                    <span aria-hidden="true" className="text-[#8A847A]">
                      ·
                    </span>
                    <span
                      data-testid={`pairing-status-${pairing.id}`}
                      className={`font-semibold ${statusColorClass}`}
                    >
                      {statusLabel}
                    </span>
                    <span aria-hidden="true" className="text-[#8A847A]">
                      ·
                    </span>
                    <span className="font-semibold text-[#146C53] dark:text-[#2EB88B]">
                      {pairing.domain}
                    </span>
                    <span aria-hidden="true" className="text-[#8A847A]">
                      ·
                    </span>
                    <span className="inline-flex items-center gap-1 text-[#575B62] dark:text-[#A3A7AE]">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>{cadenceLabel}</span>
                    </span>
                  </div>

                  <span className="text-xs font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE]">
                    {mentor.hubLocation}
                  </span>
                </div>

                {/* Main Pairing Content: Track, Mentor & Sprint Goals */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                  <div className="lg:col-span-8 space-y-2">
                    <div>
                      <h3 className="font-display text-base sm:text-lg font-medium text-[#17191C] dark:text-[#F4F2EE]">
                        {pairing.trackTitle}
                      </h3>
                      <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                        Mentor:{' '}
                        <strong className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                          {pairing.mentorName}
                        </strong>{' '}
                        · {mentor.roleTitle} · {mentor.ageStageBadge}
                      </p>
                    </div>

                    {pairing.sprintTitle && (
                      <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                        Paired Sprint:{' '}
                        <strong className="font-medium text-[#17191C] dark:text-[#F4F2EE]">
                          {pairing.sprintTitle}
                        </strong>
                      </p>
                    )}

                    <p className="text-xs sm:text-sm text-[#43484E] dark:text-[#C4C9D0] leading-relaxed">
                      {pairing.sprintGoals}
                    </p>
                  </div>

                  {/* Quick Links Column: Shared Collaboration Notes & Direct Thread */}
                  <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-stretch gap-2">
                    {linkedNotes.length > 0 ? (
                      <>
                        <button
                          type="button"
                          data-testid={`pairing-open-collab-note-btn-${pairing.id}`}
                          onClick={() => handleQuickAccessNote(item)}
                          className="min-h-[38px] px-3.5 py-2 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {matchedContribution && onOpenCollaborationNote
                              ? `Open Shared Collaboration Note (${linkedNotes.length})`
                              : `View Shared Collaboration Note (${linkedNotes.length})`}
                          </span>
                          <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                        </button>

                        <button
                          type="button"
                          data-testid={`pairing-preview-collab-note-btn-${pairing.id}`}
                          onClick={() =>
                            setExpandedNotePairingId((prev) =>
                              prev === pairing.id ? null : pairing.id
                            )
                          }
                          className="min-h-[34px] px-3 py-1.5 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span>
                            {isNoteExpanded
                              ? 'Hide Inline Note Preview'
                              : 'Inline Note Excerpt'}
                          </span>
                          {isNoteExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </>
                    ) : matchedContribution && onOpenCollaborationNote ? (
                      <button
                        type="button"
                        data-testid={`pairing-open-collab-note-btn-${pairing.id}`}
                        onClick={() =>
                          onOpenCollaborationNote(matchedContribution)
                        }
                        className="min-h-[38px] px-3.5 py-2 rounded-xl border border-[#146C53]/35 dark:border-[#2EB88B]/40 bg-[#E7F3EE]/70 dark:bg-[#142B24] hover:bg-[#E7F3EE] text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span>Open Sprint Collaboration Workspace</span>
                        <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                      </button>
                    ) : (
                      <div className="rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] px-3 py-2 text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                        No shared collaboration notes recorded for this period yet.
                      </div>
                    )}

                    {onOpenMentorThread && (
                      <button
                        type="button"
                        data-testid={`pairing-message-mentor-btn-${pairing.id}`}
                        onClick={() =>
                          onOpenMentorThread(
                            pairing.sprintId || pairing.trackId,
                            pairing.sprintTitle || pairing.trackTitle,
                            pairing.domain
                          )
                        }
                        className="min-h-[34px] px-3 py-1.5 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-xs font-medium text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B]" />
                        <span>Open Mentor Thread</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Expandable Collaboration Notes Preview */}
                {isNoteExpanded && linkedNotes.length > 0 && (
                  <div
                    data-testid={`pairing-inline-notes-${pairing.id}`}
                    className="pt-3 border-t border-[#E8E3DB] dark:border-[#2C3037] space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          Shared Collaboration Notes from Period ({linkedNotes.length})
                        </span>
                      </span>
                      {matchedContribution && onOpenCollaborationNote && (
                        <button
                          type="button"
                          onClick={() =>
                            onOpenCollaborationNote(
                              matchedContribution,
                              linkedNotes[0]
                            )
                          }
                          className="font-semibold text-[#146C53] dark:text-[#2EB88B] hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Edit in Sprint Details Modal</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {linkedNotes.map((note) => (
                      <div
                        key={note.id}
                        className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-3.5 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2 text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                          <span className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                            {note.briefTitle}
                          </span>
                          <span className="font-mono-tabular tabular-nums">
                            Updated {note.updatedAtIso.slice(0, 10)}
                          </span>
                        </div>
                        <p className="text-xs text-[#43484E] dark:text-[#C4C9D0] whitespace-pre-wrap leading-relaxed">
                          {note.markdownBody}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
};
