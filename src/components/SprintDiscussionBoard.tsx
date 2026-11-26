import React, { useMemo, useState } from 'react';
import {
  CornerDownRight,
  ExternalLink,
  Link2,
  MessageCircle,
  MessageSquarePlus,
  Send,
  Trash2,
  Users,
} from 'lucide-react';
import type { SprintDiscussionPost } from '../types/kora';
import { sanitizeText } from '../utils/talentEngine';

export interface SprintDiscussionThread {
  root: SprintDiscussionPost;
  replies: SprintDiscussionPost[];
}

export interface CreateSprintDiscussionInput {
  sprintId: string;
  parentId?: string | null;
  deliverableTag: string;
  body: string;
  resourceUrl?: string;
  resourceLabel?: string;
}

/**
 * Validates external resource links to strictly allow http:// or https:// URLs
 * matching Firestore security rule constraints (8..500 chars, no whitespace).
 */
export function sanitizeDiscussionResourceUrl(raw?: string): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (trimmed.length < 8 || trimmed.length > 500) return undefined;
  if (!/^https?:\/\/[^\s]+$/i.test(trimmed)) return undefined;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return undefined;
    }
    return trimmed;
  } catch {
    return undefined;
  }
}

/**
 * Deterministically builds starter pod collaboration threads anchored to the
 * sprint's shared deliverables so practitioners see active pod context.
 */
export function buildDefaultPodDiscussionsForSprint(input: {
  sprintId: string;
  briefTitle: string;
  deliverables: string[];
  mentorName: string;
  mentorRole: string;
  podLeadRole?: string;
  podDeliveryRole?: string;
  anchorIso?: string;
}): SprintDiscussionPost[] {
  const {
    sprintId,
    deliverables,
    mentorName,
    mentorRole,
    podLeadRole = 'Pod Lead',
    podDeliveryRole = 'Pod Delivery Member',
    anchorIso = '2026-01-15T09:30:00.000Z',
  } = input;

  const primaryDeliverable = deliverables[0] || 'Shared Deliverable 01';
  const secondaryDeliverable = deliverables[1] || primaryDeliverable;
  const baseMs = Number.isNaN(Date.parse(anchorIso))
    ? Date.parse('2026-01-15T09:30:00.000Z')
    : Date.parse(anchorIso);

  const rootId = `seed_disc_${sprintId}_root_1`;
  const replyId = `seed_disc_${sprintId}_reply_1`;
  const rootTwoId = `seed_disc_${sprintId}_root_2`;

  return [
    {
      id: rootId,
      sprintId,
      parentId: null,
      authorUid: 'pod-peer-lead',
      authorName: 'Amina Ochieng',
      authorRole: podLeadRole,
      deliverableTag: primaryDeliverable,
      body: `Before finalizing "${primaryDeliverable}", can everyone align on the baseline tolerances and attach any field checklists or reference sheets here?`,
      resourceUrl: 'https://standards.vukanaamana.org/pod-qa-checklist',
      resourceLabel: 'Pod QA Baseline Checklist',
      isSeeded: true,
      createdAtIso: new Date(baseMs - 72_000_000).toISOString(),
      updatedAtIso: new Date(baseMs - 72_000_000).toISOString(),
    },
    {
      id: replyId,
      sprintId,
      parentId: rootId,
      authorUid: 'pod-mentor-seed',
      authorName: mentorName,
      authorRole: mentorRole,
      deliverableTag: primaryDeliverable,
      body: `Great call. Keep measurements documented inline with your solution notes—I will verify readiness right after the first draft milestone.`,
      isSeeded: true,
      createdAtIso: new Date(baseMs - 54_000_000).toISOString(),
      updatedAtIso: new Date(baseMs - 54_000_000).toISOString(),
    },
    {
      id: rootTwoId,
      sprintId,
      parentId: null,
      authorUid: 'pod-peer-delivery',
      authorName: 'Samuel Kiprop',
      authorRole: podDeliveryRole,
      deliverableTag: secondaryDeliverable,
      body: `Sharing the field template layout for "${secondaryDeliverable}" so our handoff formatting matches partner expectations.`,
      resourceUrl: 'https://docs.vukanaamana.org/templates/deliverable-handoff',
      resourceLabel: 'Deliverable Handoff Spec',
      isSeeded: true,
      createdAtIso: new Date(baseMs - 36_000_000).toISOString(),
      updatedAtIso: new Date(baseMs - 36_000_000).toISOString(),
    },
  ];
}

/**
 * Groups flat SprintDiscussionPost records into threaded root questions with
 * chronologically ordered nested replies, optionally filtered by deliverable.
 */
export function buildSprintDiscussionThreads(
  posts: SprintDiscussionPost[],
  deliverableFilter = 'all'
): SprintDiscussionThread[] {
  const byId = new Map<string, SprintDiscussionPost>();
  for (const post of posts) {
    byId.set(post.id, post);
  }

  const deduped = Array.from(byId.values());
  const roots = deduped.filter((p) => !p.parentId);
  const repliesByParent = new Map<string, SprintDiscussionPost[]>();

  for (const post of deduped) {
    if (!post.parentId) continue;
    const list = repliesByParent.get(post.parentId) ?? [];
    list.push(post);
    repliesByParent.set(post.parentId, list);
  }

  const filteredRoots =
    deliverableFilter && deliverableFilter !== 'all'
      ? roots.filter((r) => r.deliverableTag === deliverableFilter)
      : roots;

  return filteredRoots
    .map((root) => {
      const replies = (repliesByParent.get(root.id) ?? []).sort(
        (a, b) => (Date.parse(a.createdAtIso) || 0) - (Date.parse(b.createdAtIso) || 0)
      );
      return { root, replies };
    })
    .sort((a, b) => {
      const aLatest =
        a.replies.length > 0
          ? Date.parse(a.replies[a.replies.length - 1].createdAtIso) || Date.parse(a.root.createdAtIso)
          : Date.parse(a.root.createdAtIso);
      const bLatest =
        b.replies.length > 0
          ? Date.parse(b.replies[b.replies.length - 1].createdAtIso) || Date.parse(b.root.createdAtIso)
          : Date.parse(b.root.createdAtIso);
      return (bLatest || 0) - (aLatest || 0);
    });
}

interface SprintDiscussionBoardProps {
  sprintId: string;
  briefTitle: string;
  deliverables: string[];
  posts: SprintDiscussionPost[];
  mentorName: string;
  mentorRole: string;
  podLeadRole?: string;
  podDeliveryRole?: string;
  currentUserUid: string;
  currentUserName: string;
  currentUserRole: string;
  anchorIso?: string;
  onCreatePost?: (input: CreateSprintDiscussionInput) => void;
  onDeletePost?: (sprintId: string, postId: string) => void;
}

function formatPostTimestamp(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return 'Just now';
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export const SprintDiscussionBoard: React.FC<SprintDiscussionBoardProps> = ({
  sprintId,
  briefTitle,
  deliverables,
  posts,
  mentorName,
  mentorRole,
  podLeadRole,
  podDeliveryRole,
  currentUserUid,
  currentUserName,
  currentUserRole,
  anchorIso,
  onCreatePost,
  onDeletePost,
}) => {
  const normalizedDeliverables = useMemo(() => {
    const clean = deliverables.map((d) => d.trim()).filter((d) => d.length > 0);
    return clean.length > 0 ? clean : ['Shared Sprint Deliverable'];
  }, [deliverables]);

  const [deliverableFilter, setDeliverableFilter] = useState<string>('all');
  const [selectedDeliverable, setSelectedDeliverable] = useState<string>(
    normalizedDeliverables[0]
  );
  const [questionDraft, setQuestionDraft] = useState('');
  const [resourceUrlDraft, setResourceUrlDraft] = useState('');
  const [resourceLabelDraft, setResourceLabelDraft] = useState('');
  const [showResourceInputs, setShowResourceInputs] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [replyBodyDraft, setReplyBodyDraft] = useState('');
  const [replyResourceUrlDraft, setReplyResourceUrlDraft] = useState('');
  const [replyError, setReplyError] = useState<string | null>(null);

  const seededPosts = useMemo(
    () =>
      buildDefaultPodDiscussionsForSprint({
        sprintId,
        briefTitle,
        deliverables: normalizedDeliverables,
        mentorName,
        mentorRole,
        podLeadRole,
        podDeliveryRole,
        anchorIso,
      }),
    [
      sprintId,
      briefTitle,
      normalizedDeliverables,
      mentorName,
      mentorRole,
      podLeadRole,
      podDeliveryRole,
      anchorIso,
    ]
  );

  const mergedPosts = useMemo(() => {
    const map = new Map<string, SprintDiscussionPost>();
    for (const seed of seededPosts) {
      map.set(seed.id, seed);
    }
    for (const post of posts) {
      if (post.sprintId === sprintId) {
        map.set(post.id, post);
      }
    }
    return Array.from(map.values());
  }, [seededPosts, posts, sprintId]);

  const threads = useMemo(
    () => buildSprintDiscussionThreads(mergedPosts, deliverableFilter),
    [mergedPosts, deliverableFilter]
  );

  const handleSubmitNewThread = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanBody = sanitizeText(questionDraft, 1200);
    if (!cleanBody) {
      setFormError('Write a question or update for your pod before posting.');
      return;
    }

    const rawUrl = resourceUrlDraft.trim();
    let validatedUrl: string | undefined;
    if (rawUrl.length > 0) {
      validatedUrl = sanitizeDiscussionResourceUrl(rawUrl);
      if (!validatedUrl) {
        setFormError('Resource link must start with https:// or http:// and contain no spaces.');
        return;
      }
    }

    const cleanLabel = validatedUrl
      ? sanitizeText(resourceLabelDraft, 120) || 'Shared Resource Link'
      : undefined;

    onCreatePost?.({
      sprintId,
      parentId: null,
      deliverableTag: selectedDeliverable || normalizedDeliverables[0],
      body: cleanBody,
      resourceUrl: validatedUrl,
      resourceLabel: cleanLabel,
    });

    setQuestionDraft('');
    setResourceUrlDraft('');
    setResourceLabelDraft('');
    setShowResourceInputs(false);
  };

  const handleSubmitReply = (rootPost: SprintDiscussionPost) => {
    setReplyError(null);
    const cleanBody = sanitizeText(replyBodyDraft, 1200);
    if (!cleanBody) {
      setReplyError('Write a reply before sending.');
      return;
    }

    const rawUrl = replyResourceUrlDraft.trim();
    let validatedUrl: string | undefined;
    if (rawUrl.length > 0) {
      validatedUrl = sanitizeDiscussionResourceUrl(rawUrl);
      if (!validatedUrl) {
        setReplyError('Reply link must start with https:// or http:// and contain no spaces.');
        return;
      }
    }

    onCreatePost?.({
      sprintId,
      parentId: rootPost.id,
      deliverableTag: rootPost.deliverableTag,
      body: cleanBody,
      resourceUrl: validatedUrl,
      resourceLabel: validatedUrl ? 'Linked Resource' : undefined,
    });

    setReplyTargetId(null);
    setReplyBodyDraft('');
    setReplyResourceUrlDraft('');
  };

  const totalPostsCount = mergedPosts.length;

  return (
    <section
      data-testid="sprint-discussion-board"
      aria-label="Pod Sprint Discussion Board"
      className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-4 sm:p-5 space-y-4"
    >
      {/* Section Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE] flex items-center gap-2">
              <MessageCircle
                className="w-4 h-4 text-[#146C53] dark:text-[#2EB88B]"
                aria-hidden="true"
              />
              <span>Pod Discussion Board</span>
            </h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] text-[10px] font-semibold text-[#575B62] dark:text-[#A3A7AE]">
              <Users className="w-3 h-3 text-[#146C53] dark:text-[#2EB88B]" aria-hidden="true" />
              <span>Shared across pod · {totalPostsCount} posts</span>
            </span>
          </div>
          <p className="mt-0.5 text-xs text-[#575B62] dark:text-[#A3A7AE]">
            Post threaded questions and reference links tied directly to your shared pod deliverables.
          </p>
        </div>

        {/* Deliverable Filter */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="discussion-deliverable-filter"
            className="text-[11px] font-medium text-[#575B62] dark:text-[#A3A7AE]"
          >
            Filter:
          </label>
          <select
            id="discussion-deliverable-filter"
            data-testid="discussion-deliverable-filter"
            value={deliverableFilter}
            onChange={(e) => setDeliverableFilter(e.target.value)}
            className="max-w-[220px] rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] px-2.5 py-1.5 text-xs text-[#17191C] dark:text-[#F4F2EE] focus:border-[#146C53] dark:focus:border-[#2EB88B] focus:outline-none"
          >
            <option value="all">All Deliverables ({mergedPosts.filter((p) => !p.parentId).length})</option>
            {normalizedDeliverables.map((item) => (
              <option key={item} value={item}>
                {item.length > 42 ? `${item.slice(0, 41)}…` : item}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* New Question / Resource Composer */}
      {onCreatePost && (
        <form
          onSubmit={handleSubmitNewThread}
          data-testid="sprint-discussion-composer"
          className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-3.5 space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label
              htmlFor="discussion-deliverable-select"
              className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#575B62] dark:text-[#A3A7AE]"
            >
              Ask the Pod ({currentUserName} · {currentUserRole})
            </label>
            <select
              id="discussion-deliverable-select"
              data-testid="discussion-deliverable-select"
              value={selectedDeliverable}
              onChange={(e) => setSelectedDeliverable(e.target.value)}
              aria-label="Tag shared deliverable"
              className="max-w-full sm:max-w-[260px] rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] px-2.5 py-1 text-xs text-[#17191C] dark:text-[#F4F2EE] focus:border-[#146C53] dark:focus:border-[#2EB88B] focus:outline-none"
            >
              {normalizedDeliverables.map((item) => (
                <option key={item} value={item}>
                  Deliverable: {item.length > 44 ? `${item.slice(0, 43)}…` : item}
                </option>
              ))}
            </select>
          </div>

          <textarea
            data-testid="discussion-body-input"
            value={questionDraft}
            onChange={(e) => setQuestionDraft(e.target.value.slice(0, 1200))}
            rows={2}
            maxLength={1200}
            aria-label="Write a pod question or deliverable note"
            placeholder="Ask a technical question, coordinate handoffs, or share a verification doc with your pod..."
            className="w-full rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] focus:border-[#146C53] dark:focus:border-[#2EB88B] focus:outline-none px-3 py-2 text-xs sm:text-sm text-[#17191C] dark:text-[#F4F2EE] placeholder:text-[#787C83] dark:placeholder:text-[#8E95A0]"
          />

          {showResourceInputs && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="url"
                data-testid="discussion-resource-url-input"
                value={resourceUrlDraft}
                onChange={(e) => setResourceUrlDraft(e.target.value.slice(0, 500))}
                placeholder="https://docs.example.org/spec"
                aria-label="Resource URL"
                className="rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] focus:border-[#146C53] dark:focus:border-[#2EB88B] focus:outline-none px-3 py-1.5 text-xs text-[#17191C] dark:text-[#F4F2EE]"
              />
              <input
                type="text"
                data-testid="discussion-resource-label-input"
                value={resourceLabelDraft}
                onChange={(e) => setResourceLabelDraft(e.target.value.slice(0, 120))}
                placeholder="Link title (e.g., Field Sizing Sheet)"
                aria-label="Resource link label"
                className="rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] focus:border-[#146C53] dark:focus:border-[#2EB88B] focus:outline-none px-3 py-1.5 text-xs text-[#17191C] dark:text-[#F4F2EE]"
              />
            </div>
          )}

          {formError && (
            <p
              role="alert"
              data-testid="discussion-form-error"
              className="text-xs font-medium text-[#B42318] dark:text-[#F97066]"
            >
              {formError}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              data-testid="discussion-toggle-link-btn"
              onClick={() => setShowResourceInputs((prev) => !prev)}
              className={`min-h-[32px] px-2.5 py-1 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                showResourceInputs
                  ? 'border-[#146C53]/40 dark:border-[#2EB88B]/45 bg-[#E7F3EE]/70 dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B]'
                  : 'border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{showResourceInputs ? 'Hide Resource Link' : 'Attach Resource Link'}</span>
            </button>

            <button
              type="submit"
              data-testid="discussion-post-submit-btn"
              disabled={questionDraft.trim().length === 0}
              className="min-h-[34px] px-3.5 py-1.5 rounded-lg bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Post to Pod</span>
            </button>
          </div>
        </form>
      )}

      {/* Threaded Posts */}
      {threads.length === 0 ? (
        <div
          data-testid="sprint-discussion-empty"
          className="rounded-xl border border-dashed border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5]/70 dark:bg-[#121315]/70 p-4 text-center text-xs text-[#575B62] dark:text-[#A3A7AE]"
        >
          No pod questions tagged for this deliverable yet. Start the thread above to align your pod.
        </div>
      ) : (
        <ol className="space-y-3" data-testid="sprint-discussion-thread-list">
          {threads.map(({ root, replies }) => {
            const safeRootUrl = sanitizeDiscussionResourceUrl(root.resourceUrl);
            const canDeleteRoot =
              !root.isSeeded &&
              Boolean(onDeletePost) &&
              (root.authorUid === currentUserUid || root.authorName === currentUserName);
            const isReplyingHere = replyTargetId === root.id;

            return (
              <li
                key={root.id}
                data-testid={`discussion-thread-${root.id}`}
                className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-3.5 sm:p-4 space-y-3"
              >
                {/* Root Post Header */}
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                      <span className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                        {root.authorName}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] text-[10px] font-medium text-[#575B62] dark:text-[#A3A7AE]">
                        {root.authorRole}
                      </span>
                      <span className="font-mono-tabular text-[11px] text-[#787C83] dark:text-[#8E95A0]">
                        {formatPostTimestamp(root.createdAtIso)}
                      </span>
                    </div>
                    <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#146C53] dark:text-[#2EB88B]">
                      <span>Deliverable:</span>
                      <span className="truncate max-w-[380px]">{root.deliverableTag}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {onCreatePost && (
                      <button
                        type="button"
                        data-testid={`discussion-reply-trigger-${root.id}`}
                        onClick={() => {
                          setReplyError(null);
                          setReplyBodyDraft('');
                          setReplyResourceUrlDraft('');
                          setReplyTargetId((prev) => (prev === root.id ? null : root.id));
                        }}
                        className="min-h-[28px] px-2.5 py-1 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-[11px] font-semibold text-[#17191C] dark:text-[#F4F2EE] inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <CornerDownRight className="w-3 h-3" aria-hidden="true" />
                        <span>{isReplyingHere ? 'Cancel' : `Reply (${replies.length})`}</span>
                      </button>
                    )}

                    {canDeleteRoot && (
                      <button
                        type="button"
                        data-testid={`discussion-delete-${root.id}`}
                        onClick={() => onDeletePost?.(sprintId, root.id)}
                        aria-label={`Delete post by ${root.authorName}`}
                        className="min-h-[28px] px-2 py-1 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:border-[#C4622D] dark:hover:border-[#E07B46] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#C4622D] dark:hover:text-[#E07B46] inline-flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Root Body */}
                <p className="text-xs sm:text-sm text-[#17191C] dark:text-[#F4F2EE] leading-relaxed whitespace-pre-wrap">
                  {root.body}
                </p>

                {/* Resource Link Card */}
                {safeRootUrl && (
                  <a
                    href={safeRootUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid={`discussion-resource-link-${root.id}`}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#1A1C20] border border-[#146C53]/30 dark:border-[#2EB88B]/35 hover:border-[#146C53] dark:hover:border-[#2EB88B] text-xs font-medium text-[#146C53] dark:text-[#2EB88B] transition-colors max-w-full"
                  >
                    <Link2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">
                      {root.resourceLabel || safeRootUrl}
                    </span>
                    <ExternalLink className="w-3 h-3 shrink-0 opacity-80" aria-hidden="true" />
                  </a>
                )}

                {/* Nested Replies with Vertical Thread Connector */}
                {replies.length > 0 && (
                  <ol
                    data-testid={`discussion-replies-${root.id}`}
                    className="mt-2 pl-4 ml-2 border-l-2 border-[#E8E3DB] dark:border-[#2C3037] space-y-2.5"
                  >
                    {replies.map((reply) => {
                      const safeReplyUrl = sanitizeDiscussionResourceUrl(reply.resourceUrl);
                      const canDeleteReply =
                        !reply.isSeeded &&
                        Boolean(onDeletePost) &&
                        (reply.authorUid === currentUserUid ||
                          reply.authorName === currentUserName);

                      return (
                        <li
                          key={reply.id}
                          data-testid={`discussion-reply-${reply.id}`}
                          className="rounded-lg bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-3 space-y-1.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                                {reply.authorName}
                              </span>
                              <span className="text-[#575B62] dark:text-[#A3A7AE]">
                                · {reply.authorRole}
                              </span>
                              <span className="font-mono-tabular text-[#787C83] dark:text-[#8E95A0]">
                                · {formatPostTimestamp(reply.createdAtIso)}
                              </span>
                            </div>

                            {canDeleteReply && (
                              <button
                                type="button"
                                data-testid={`discussion-delete-${reply.id}`}
                                onClick={() => onDeletePost?.(sprintId, reply.id)}
                                aria-label={`Delete reply by ${reply.authorName}`}
                                className="p-1 rounded text-[#575B62] dark:text-[#A3A7AE] hover:text-[#C4622D] dark:hover:text-[#E07B46] cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" aria-hidden="true" />
                              </button>
                            )}
                          </div>

                          <p className="text-xs text-[#43484E] dark:text-[#C4C9D0] leading-relaxed whitespace-pre-wrap">
                            {reply.body}
                          </p>

                          {safeReplyUrl && (
                            <a
                              href={safeReplyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#146C53] dark:text-[#2EB88B] hover:underline"
                            >
                              <Link2 className="w-3 h-3 shrink-0" aria-hidden="true" />
                              <span className="truncate max-w-[280px]">
                                {reply.resourceLabel || safeReplyUrl}
                              </span>
                              <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
                            </a>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                )}

                {/* Inline Reply Composer */}
                {isReplyingHere && onCreatePost && (
                  <div
                    data-testid={`discussion-reply-composer-${root.id}`}
                    className="pl-4 ml-2 border-l-2 border-[#146C53]/45 dark:border-[#2EB88B]/45 space-y-2 pt-1"
                  >
                    <textarea
                      data-testid={`discussion-reply-input-${root.id}`}
                      value={replyBodyDraft}
                      onChange={(e) => setReplyBodyDraft(e.target.value.slice(0, 1200))}
                      rows={2}
                      maxLength={1200}
                      aria-label={`Reply to ${root.authorName}`}
                      placeholder={`Reply to ${root.authorName}...`}
                      className="w-full rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] focus:border-[#146C53] dark:focus:border-[#2EB88B] focus:outline-none px-3 py-2 text-xs text-[#17191C] dark:text-[#F4F2EE]"
                    />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <input
                        type="url"
                        data-testid={`discussion-reply-url-${root.id}`}
                        value={replyResourceUrlDraft}
                        onChange={(e) => setReplyResourceUrlDraft(e.target.value.slice(0, 500))}
                        placeholder="Optional resource link (https://...)"
                        aria-label="Optional reply resource link"
                        className="flex-1 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] focus:border-[#146C53] dark:focus:border-[#2EB88B] focus:outline-none px-2.5 py-1.5 text-xs text-[#17191C] dark:text-[#F4F2EE]"
                      />
                      <button
                        type="button"
                        data-testid={`discussion-reply-submit-${root.id}`}
                        disabled={replyBodyDraft.trim().length === 0}
                        onClick={() => handleSubmitReply(root)}
                        className="min-h-[32px] px-3 py-1 rounded-lg bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer shrink-0"
                      >
                        <Send className="w-3 h-3" aria-hidden="true" />
                        <span>Send Reply</span>
                      </button>
                    </div>
                    {replyError && (
                      <p role="alert" className="text-xs font-medium text-[#B42318] dark:text-[#F97066]">
                        {replyError}
                      </p>
                    )}
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
