import React, { useMemo, useState } from 'react';
import { Award, Quote, Sparkles } from 'lucide-react';
import type { MentorshipTrackSpec, StudioDomain } from '../types/kora';

export interface MentorshipSuccessStory {
  id: string;
  trackId: string;
  domain: StudioDomain;
  practitionerName: string;
  practitionerRole: string;
  locationLabel: string;
  mentorName: string;
  outcomeStat: string;
  timeSavedLabel: string;
  quote: string;
  guidanceTip: string;
}

export const MENTORSHIP_SUCCESS_STORIES: MentorshipSuccessStory[] = [
  {
    id: 'story-track-green-1',
    trackId: 'track-green-energy',
    domain: 'Green Energy',
    practitionerName: 'Tariq Al-Mansoor',
    practitionerRole: 'Off-Grid Solar Diagnostics Lead · 30–45 Specialist',
    locationLabel: 'Amman → Rift Valley Pod',
    mentorName: 'Eng. Samuel Kariuki',
    outcomeStat: '99.4% cold-room uptime · $1,240 escrow released',
    timeSavedLabel: '~3.5h saved/sprint',
    quote:
      'Two 15-minute QA architecture checks caught a busbar voltage sag edge case before field handover, clearing partner sign-off on the first pass.',
    guidanceTip:
      'Bring raw inverter CSV telemetry and busbar resistance readings to your first QA gate for fastest sign-off.',
  },
  {
    id: 'story-track-health-1',
    trackId: 'track-healthcare-ops',
    domain: 'Healthcare Ops',
    practitionerName: 'Halima Ndiaye',
    practitionerRole: 'Maternal Triage & Cold-Chain Lead · 18–29 Builder',
    locationLabel: 'Kakuma → Nairobi Regional Clinics',
    mentorName: 'Dr. Amina Haddad',
    outcomeStat: '9 clinic posts aligned · 0 cold-chain excursions',
    timeSavedLabel: '~4.0h saved/sprint',
    quote:
      'Weekly clinical desk reviews tightened our bilingual shift-handover phrasing so NGO medical directors approved our SOPs without revision loops.',
    guidanceTip:
      'Pair 2°C–8°C excursion logs with short bilingual shift-handover phrasing before requesting final rubric sign-off.',
  },
  {
    id: 'story-track-tech-1',
    trackId: 'track-tech',
    domain: 'Tech',
    practitionerName: 'Samuel Kiprop',
    practitionerRole: 'Offline-First Systems Engineer · 18–29 Builder',
    locationLabel: 'Eldoret Remote Engineering Pod',
    mentorName: 'Eng. Tomasz Kowalski',
    outcomeStat: '100% 2G sync test pass · Verified PR endorsement',
    timeSavedLabel: '~3.0h saved/sprint',
    quote:
      'Async PR reviews isolated an idempotency queue race condition early and gave my Living Proof portfolio a production architecture endorsement.',
    guidanceTip:
      'Share failing offline queue edge cases early in your pod thread so mentor review targets exact contract boundaries.',
  },
  {
    id: 'story-track-finance-1',
    trackId: 'track-sme-finance',
    domain: 'SME Finance',
    practitionerName: 'Beatrice Wanjiru & Yusuf K.',
    practitionerRole: 'Cooperative Finance Guild · 46+ Master & 15–17 Apprentice',
    locationLabel: 'Nakuru Cooperative Studio',
    mentorName: 'Grace Mukasa',
    outcomeStat: '16 artisans paid on time · 2x faster escrow release',
    timeSavedLabel: '~2.5h saved/sprint',
    quote:
      'Stress-testing our 13-week supplier staging sheet with Grace turned a rough draft into an audit-ready working capital brief.',
    guidanceTip:
      'Lock Friday liquidity buffers and receivables aging assumptions before scheduling your handover rubric check.',
  },
];

export function getMentorshipStoriesForTrack(
  trackId?: string
): MentorshipSuccessStory[] {
  if (!trackId) return MENTORSHIP_SUCCESS_STORIES;
  const matching = MENTORSHIP_SUCCESS_STORIES.filter((s) => s.trackId === trackId);
  return matching.length > 0 ? matching : MENTORSHIP_SUCCESS_STORIES;
}

interface MentorshipSuccessStoriesProps {
  selectedTrack: MentorshipTrackSpec;
  onApplyGuidance?: (story: MentorshipSuccessStory) => void;
}

export const MentorshipSuccessStories: React.FC<MentorshipSuccessStoriesProps> = ({
  selectedTrack,
  onApplyGuidance,
}) => {
  const [scope, setScope] = useState<'selected' | 'all'>('selected');

  const stories = useMemo(() => {
    if (scope === 'all') {
      // Put selected track story first for immediate relevance
      return [...MENTORSHIP_SUCCESS_STORIES].sort((a, b) =>
        a.trackId === selectedTrack.id ? -1 : b.trackId === selectedTrack.id ? 1 : 0
      );
    }
    return getMentorshipStoriesForTrack(selectedTrack.id);
  }, [scope, selectedTrack.id]);

  return (
    <section
      aria-labelledby="mentorship-success-stories-heading"
      data-testid="mentorship-success-stories"
      className="pt-4 border-t border-[#E8E3DB] dark:border-[#2C3037] space-y-3"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-0.5">
          <h3
            id="mentorship-success-stories-heading"
            className="text-xs font-semibold uppercase tracking-[0.12em] text-[#575B62] dark:text-[#A3A7AE]"
          >
            3. Community Track Outcomes &amp; Guidance
          </h3>
          <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
            Verified outcomes from practitioners who paired on the {selectedTrack.domain} and peer tracks.
          </p>
        </div>

        <div
          role="group"
          aria-label="Filter mentorship stories by track"
          className="inline-flex items-center p-0.5 rounded-lg bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] self-start sm:self-center"
        >
          <button
            type="button"
            aria-pressed={scope === 'selected'}
            data-testid="stories-filter-selected"
            onClick={() => setScope('selected')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
              scope === 'selected'
                ? 'bg-[#146C53] dark:bg-[#2EB88B] text-white dark:text-[#121315] font-semibold'
                : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
            }`}
          >
            {selectedTrack.domain} Track
          </button>
          <button
            type="button"
            aria-pressed={scope === 'all'}
            data-testid="stories-filter-all"
            onClick={() => setScope('all')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
              scope === 'all'
                ? 'bg-[#146C53] dark:bg-[#2EB88B] text-white dark:text-[#121315] font-semibold'
                : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
            }`}
          >
            All Tracks ({MENTORSHIP_SUCCESS_STORIES.length})
          </button>
        </div>
      </div>

      <div
        className={`grid grid-cols-1 ${
          stories.length > 1 ? 'md:grid-cols-2' : ''
        } gap-3`}
      >
        {stories.map((story) => {
          const isCurrentTrack = story.trackId === selectedTrack.id;
          return (
            <article
              key={story.id}
              data-testid={`mentorship-story-card-${story.id}`}
              className={`rounded-xl border p-4 space-y-2.5 ${
                isCurrentTrack
                  ? 'bg-[#E7F3EE]/45 dark:bg-[#142B24]/50 border-[#146C53]/35 dark:border-[#2EB88B]/35'
                  : 'bg-[#FAF8F5] dark:bg-[#121315] border-[#E8E3DB] dark:border-[#2C3037]'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="font-semibold text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{story.domain}</span>
                </span>
                <span className="font-mono-tabular tabular-nums font-medium text-[#575B62] dark:text-[#A3A7AE]">
                  {story.outcomeStat} · {story.timeSavedLabel}
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                  {story.practitionerName}
                </p>
                <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                  {story.practitionerRole} · {story.locationLabel} · Paired with {story.mentorName}
                </p>
              </div>

              <blockquote className="flex items-start gap-2 text-xs text-[#17191C] dark:text-[#F4F2EE] leading-relaxed">
                <Quote
                  className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#146C53] dark:text-[#2EB88B]"
                  aria-hidden="true"
                />
                <span>&ldquo;{story.quote}&rdquo;</span>
              </blockquote>

              <div className="pt-2 border-t border-[#E8E3DB] dark:border-[#2C3037] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                <p className="text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                  <strong className="text-[#17191C] dark:text-[#F4F2EE]">Track tip:</strong>{' '}
                  {story.guidanceTip}
                </p>
                {onApplyGuidance && (
                  <button
                    type="button"
                    data-testid={`apply-story-guidance-${story.id}`}
                    onClick={() => onApplyGuidance(story)}
                    className="font-semibold text-[#146C53] dark:text-[#2EB88B] hover:underline whitespace-nowrap self-start sm:self-center inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 shrink-0" aria-hidden="true" />
                    <span>Use in goal</span>
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
