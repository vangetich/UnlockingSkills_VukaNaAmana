import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock3,
  Compass,
  Mic,
  Play,
  RotateCcw,
  Square,
  Volume2,
} from 'lucide-react';
import type { MentorshipTrackSpec, StudioDomain } from '../types/kora';

export type MentorshipObjectiveStatus = 'completed' | 'up-next' | 'upcoming';

export interface MilestoneAudioMemo {
  durationLabel: string;
  durationSeconds: number;
  transcript: string;
}

export interface RecordedMilestoneClip {
  audioUrl: string;
  durationSeconds: number;
  durationLabel: string;
  recordedAtLabel: string;
}

export interface MentorshipLearningObjective {
  id: string;
  order: number;
  title: string;
  description: string;
  competencyTag: string;
  audioMemo: MilestoneAudioMemo;
}

export interface MentorshipObjectiveWithStatus
  extends MentorshipLearningObjective {
  status: MentorshipObjectiveStatus;
  statusLabel: 'Completed' | 'Up Next' | 'Upcoming';
}

const MAX_RECORDING_SECONDS = 60;

const DOMAIN_SPECIALIST_OBJECTIVES: Record<
  StudioDomain,
  {
    title: string;
    description: string;
    competencyTag: string;
    audioMemo: MilestoneAudioMemo;
  }
> = {
  'Green Energy': {
    title: 'Verified 48V Microgrid & Load Isolation QA',
    description:
      'Execute cell-balance diagnostics, busbar resistance checks, and critical load stabilization with mentor sign-off.',
    competencyTag: 'Field Hardware QA',
    audioMemo: {
      durationLabel: '0:22',
      durationSeconds: 22,
      transcript:
        'Before final sign-off on your 48 volt microgrid brief, log cell-by-cell resting voltages under peak clinic load and capture one thermal reading at the main busbar lug.',
    },
  },
  'Healthcare Ops': {
    title: 'Validated Cold-Chain & Patient Triage Protocols',
    description:
      'Document excursion quarantine SOPs and multilingual intake flow readiness to clinical audit standards.',
    competencyTag: 'Clinical Ops Compliance',
    audioMemo: {
      durationLabel: '0:21',
      durationSeconds: 21,
      transcript:
        'Great progress on your cold-chain logs. For final clinical verification, pair each temperature excursion alert with the exact two-step vaccine quarantine handover.',
    },
  },
  Tech: {
    title: 'Deterministic Offline Queue & Sync Verification',
    description:
      'Prove idempotent mutation replay and conflict resolution across intermittent 2G field connections.',
    competencyTag: 'Distributed Resilience',
    audioMemo: {
      durationLabel: '0:20',
      durationSeconds: 20,
      transcript:
        'Your offline mutation queue is solid. Before sprint handover, verify duplicate retry replay under packet loss so no double-write occurs when connectivity returns.',
    },
  },
  'SME Finance': {
    title: 'Reconciled 13-Week Cash-Flow & Working Capital Controls',
    description:
      'Build audit-ready invoice aging schedules, unit-margin breakdowns, and supplier staging ledgers.',
    competencyTag: 'Financial Governance',
    audioMemo: {
      durationLabel: '0:23',
      durationSeconds: 23,
      transcript:
        'Your 13-week rolling ledger is clear and audit-ready. Add one stress-test row showing a 14-day buyer delay so the cooperative treasurer sees exact cash-buffer thresholds.',
    },
  },
};

export function getLearningObjectivesForTrack(
  track: Pick<MentorshipTrackSpec, 'id' | 'domain'>
): MentorshipLearningObjective[] {
  const domainSpec =
    DOMAIN_SPECIALIST_OBJECTIVES[track.domain] ??
    DOMAIN_SPECIALIST_OBJECTIVES['Green Energy'];

  return [
    {
      id: 'obj-first-mentor-intro',
      order: 1,
      title: 'First Mentor Intro',
      description:
        'Align active sprint deliverables, preferred mentoring cadence, and communication norms with your track lead.',
      competencyTag: 'Mentorship Kickoff',
      audioMemo: {
        durationLabel: '0:16',
        durationSeconds: 16,
        transcript:
          'Welcome to the pod track! Bring your active sprint brief and two key questions to our kickoff so we can lock in a realistic weekly QA cadence right away.',
      },
    },
    {
      id: 'obj-confidence-problem-framing',
      order: 2,
      title: 'Confidence in Problem Framing',
      description:
        'Translate ambiguous field constraints into scoped hypotheses, measurable acceptance criteria, and clear risk boundaries.',
      competencyTag: 'Diagnostic Scoping',
      audioMemo: {
        durationLabel: '0:19',
        durationSeconds: 19,
        transcript:
          'Strong scoping starts with constraints, not tools. Write down the single failure condition your partner cannot afford, then work backward into your acceptance criteria.',
      },
    },
    {
      id: 'obj-advanced-problem-framing',
      order: 3,
      title: 'Advanced Problem Framing',
      description:
        'Stress-test edge cases, regulatory boundaries, and system failure modes with structured mentor diagnostic feedback.',
      competencyTag: 'Systems Architecture',
      audioMemo: {
        durationLabel: '0:21',
        durationSeconds: 21,
        transcript:
          'Now that your core path works, pressure-test the boundary conditions. Document what happens during power drops, missing approvals, or partial team handoffs.',
      },
    },
    {
      id: 'obj-pod-sprint-review',
      order: 4,
      title: 'Pod Sprint Review',
      description:
        'Walk through intermediate sprint artifacts, evidence logs, and technical trade-offs during a live or async pod review.',
      competencyTag: 'Collaborative QA',
      audioMemo: {
        durationLabel: '0:18',
        durationSeconds: 18,
        transcript:
          'During your pod sprint review, lead with a 90-second live demo of your working evidence artifact, then highlight one trade-off where you want peer QA input.',
      },
    },
    {
      id: 'obj-mastered-sprint-workflow',
      order: 5,
      title: 'Mastered Sprint Workflow',
      description:
        'Coordinate milestone dependencies, asynchronous pod handoffs, and mentor QA gates without bottlenecking delivery.',
      competencyTag: 'Execution Velocity',
      audioMemo: {
        durationLabel: '0:19',
        durationSeconds: 19,
        transcript:
          'Your async handoff discipline is standing out. Keep updating your milestone checklist 24 hours before each review gate so teammates stay unblocked across time zones.',
      },
    },
    {
      id: `obj-domain-qa-${track.domain.toLowerCase().replace(/\s+/g, '-')}`,
      order: 6,
      title: domainSpec.title,
      description: domainSpec.description,
      competencyTag: domainSpec.competencyTag,
      audioMemo: domainSpec.audioMemo,
    },
  ];
}

export function buildObjectivesWithStatus(
  track: Pick<MentorshipTrackSpec, 'id' | 'domain'>,
  completedObjectiveIds: string[]
): MentorshipObjectiveWithStatus[] {
  const objectives = getLearningObjectivesForTrack(track);
  const completedSet = new Set(completedObjectiveIds.filter(Boolean));
  let assignedUpNext = false;

  return objectives.map((obj) => {
    if (completedSet.has(obj.id)) {
      return {
        ...obj,
        status: 'completed',
        statusLabel: 'Completed',
      };
    }
    if (!assignedUpNext) {
      assignedUpNext = true;
      return {
        ...obj,
        status: 'up-next',
        statusLabel: 'Up Next',
      };
    }
    return {
      ...obj,
      status: 'upcoming',
      statusLabel: 'Upcoming',
    };
  });
}

export function toggleObjectiveCompletion(
  currentCompletedIds: string[],
  objectiveId: string
): string[] {
  const cleanSet = new Set(currentCompletedIds.filter(Boolean));
  if (cleanSet.has(objectiveId)) {
    cleanSet.delete(objectiveId);
  } else {
    cleanSet.add(objectiveId);
  }
  return Array.from(cleanSet);
}

function formatSeconds(sec: number): string {
  const safe = Math.max(0, Math.floor(sec));
  const mins = Math.floor(safe / 60);
  const rem = safe % 60;
  return `${mins}:${rem < 10 ? `0${rem}` : rem}`;
}

interface MentorshipMilestoneTrackerProps {
  track: MentorshipTrackSpec;
  completedObjectiveIds: string[];
  syncedCompletionPct: number;
  mentorName?: string;
  onToggleObjective: (trackId: string, objectiveId: string) => void;
}

export const MentorshipMilestoneTracker: React.FC<
  MentorshipMilestoneTrackerProps
> = ({
  track,
  completedObjectiveIds,
  syncedCompletionPct,
  mentorName = 'Track Lead Mentor',
  onToggleObjective,
}) => {
  const [playingObjectiveId, setPlayingObjectiveId] = useState<string | null>(
    null
  );
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Real microphone voice memo recording state (keyed by `${track.id}:${objective.id}`)
  const [recordingObjectiveId, setRecordingObjectiveId] = useState<
    string | null
  >(null);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [recordingNotice, setRecordingNotice] = useState<{
    objectiveId: string;
    message: string;
  } | null>(null);
  const [recordedClips, setRecordedClips] = useState<
    Record<string, RecordedMilestoneClip>
  >({});

  const timerRef = useRef<number | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingStartMsRef = useRef<number>(0);
  const recordedClipsRef = useRef<Record<string, RecordedMilestoneClip>>({});

  recordedClipsRef.current = recordedClips;

  const objectivesWithStatus = buildObjectivesWithStatus(
    track,
    completedObjectiveIds
  );
  const masteredCount = objectivesWithStatus.filter(
    (obj) => obj.status === 'completed'
  ).length;
  const upcomingObjectives = objectivesWithStatus.filter(
    (obj) => obj.status !== 'completed'
  );

  const stopAudioPlayback = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (audioElRef.current) {
      try {
        audioElRef.current.pause();
        audioElRef.current.currentTime = 0;
      } catch {
        // Ignore HTMLAudioElement pause errors
      }
      audioElRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore speech synthesis cancellation errors in restricted browsers
      }
    }
    setPlayingObjectiveId(null);
    setElapsedSeconds(0);
  };

  const stopMicrophoneRecording = () => {
    if (recordingTimerRef.current !== null) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignore stop race
      }
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setRecordingObjectiveId(null);
    setRecordingSeconds(0);
  };

  useEffect(() => {
    stopAudioPlayback();
    stopMicrophoneRecording();
    return () => {
      stopAudioPlayback();
      stopMicrophoneRecording();
    };
  }, [track.id]);

  // Revoke object URLs only on component unmount
  useEffect(() => {
    return () => {
      Object.values(recordedClipsRef.current).forEach((clip) => {
        try {
          URL.revokeObjectURL(clip.audioUrl);
        } catch {
          // Ignore revoke failures
        }
      });
    };
  }, []);

  const handleToggleRecordMemo = async (objectiveId: string) => {
    if (recordingObjectiveId === objectiveId) {
      stopMicrophoneRecording();
      return;
    }

    stopAudioPlayback();
    stopMicrophoneRecording();
    setRecordingNotice(null);

    if (
      typeof window === 'undefined' ||
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      setRecordingNotice({
        objectiveId,
        message:
          'Microphone capture is unavailable in this browser — using built-in mentor memo playback.',
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      recordingChunksRef.current = [];
      recordingStartMsRef.current = Date.now();

      const preferredMime =
        typeof MediaRecorder.isTypeSupported === 'function' &&
        MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : typeof MediaRecorder.isTypeSupported === 'function' &&
              MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : '';

      const recorder = preferredMime
        ? new MediaRecorder(stream, { mimeType: preferredMime })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (ev: BlobEvent) => {
        if (ev.data && ev.data.size > 0) {
          recordingChunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = () => {
        const elapsedSec = Math.max(
          1,
          Math.round((Date.now() - recordingStartMsRef.current) / 1000)
        );
        const blob = new Blob(recordingChunksRef.current, {
          type: preferredMime || 'audio/webm',
        });

        if (blob.size > 0) {
          const url = URL.createObjectURL(blob);
          const clipKey = `${track.id}:${objectiveId}`;
          setRecordedClips((prev) => {
            const existing = prev[clipKey];
            if (existing) {
              try {
                URL.revokeObjectURL(existing.audioUrl);
              } catch {
                // Ignore revoke error
              }
            }
            return {
              ...prev,
              [clipKey]: {
                audioUrl: url,
                durationSeconds: elapsedSec,
                durationLabel: formatSeconds(elapsedSec),
                recordedAtLabel: new Date().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              },
            };
          });
        }

        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        }
        mediaRecorderRef.current = null;
      };

      recorder.start(250);
      setRecordingObjectiveId(objectiveId);
      setRecordingSeconds(0);

      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev + 1 >= MAX_RECORDING_SECONDS) {
            stopMicrophoneRecording();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      setRecordingNotice({
        objectiveId,
        message:
          'Microphone permission was not granted — built-in mentor memo playback remains ready.',
      });
    }
  };

  const handleResetRecordedClip = (objectiveId: string) => {
    if (playingObjectiveId === objectiveId) {
      stopAudioPlayback();
    }
    const clipKey = `${track.id}:${objectiveId}`;
    setRecordedClips((prev) => {
      const existing = prev[clipKey];
      if (!existing) return prev;
      try {
        URL.revokeObjectURL(existing.audioUrl);
      } catch {
        // Ignore
      }
      const next = { ...prev };
      delete next[clipKey];
      return next;
    });
  };

  const handleToggleAudioMemo = (objective: MentorshipObjectiveWithStatus) => {
    if (playingObjectiveId === objective.id) {
      stopAudioPlayback();
      return;
    }

    stopAudioPlayback();
    if (recordingObjectiveId) {
      stopMicrophoneRecording();
    }

    const clipKey = `${track.id}:${objective.id}`;
    const recordedClip = recordedClips[clipKey];

    setPlayingObjectiveId(objective.id);
    setElapsedSeconds(0);

    // 1. If a real mentor microphone recording exists, play it via HTMLAudioElement
    if (recordedClip) {
      try {
        const audio = new Audio(recordedClip.audioUrl);
        audioElRef.current = audio;
        audio.ontimeupdate = () => {
          setElapsedSeconds(Math.floor(audio.currentTime));
        };
        audio.onended = () => {
          stopAudioPlayback();
        };
        audio.onerror = () => {
          stopAudioPlayback();
        };
        void audio.play().catch(() => {
          stopAudioPlayback();
        });
        return;
      } catch {
        // Fall through to synthesized playback if Audio() fails
      }
    }

    // 2. Built-in mentor voice memo playback via subtle Web Audio chime + SpeechSynthesis + live transcript
    const maxSec = objective.audioMemo.durationSeconds;
    if (typeof window !== 'undefined') {
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523.25, ctx.currentTime);
          gain.gain.setValueAtTime(0.03, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(
            0.0001,
            ctx.currentTime + 0.16
          );
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.16);
          window.setTimeout(() => {
            ctx.close().catch(() => {});
          }, 250);
        }
      } catch {
        // Ignore audio context restrictions
      }

      if ('speechSynthesis' in window) {
        try {
          const utterance = new SpeechSynthesisUtterance(
            objective.audioMemo.transcript
          );
          utterance.rate = 0.98;
          utterance.pitch = 1.0;
          utterance.onend = () => {
            stopAudioPlayback();
          };
          utterance.onerror = () => {
            // Keep timer fallback running so user can read along smoothly
          };
          window.speechSynthesis.speak(utterance);
        } catch {
          // Fallback to timer + transcript readout
        }
      }
    }

    timerRef.current = window.setInterval(() => {
      setElapsedSeconds((prev) => {
        if (prev + 1 >= maxSec) {
          stopAudioPlayback();
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
  };

  return (
    <section
      aria-labelledby="mentorship-milestone-tracker-heading"
      data-testid="mentorship-milestone-tracker"
      className="rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] p-4 space-y-3.5"
    >
      {/* Header & Live Sync Indicator with Progress Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#146C53] dark:text-[#2EB88B]">
              Mentorship Milestones
            </span>
            <span className="text-[#8A847A]" aria-hidden="true">
              ·
            </span>
            <span className="text-[#575B62] dark:text-[#A3A7AE]">
              Synced with Mentorship Progress Bar · Play or Record Mentor Audio Memos
            </span>
          </div>
          <h3
            id="mentorship-milestone-tracker-heading"
            className="text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]"
          >
            Upcoming Objectives &amp; Competency Mastery Checkpoints
          </h3>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono-tabular tabular-nums shrink-0">
          <span
            data-testid="milestone-tracker-mastered-count"
            className="font-semibold text-[#17191C] dark:text-[#F4F2EE]"
          >
            {masteredCount}/{objectivesWithStatus.length} objectives completed
          </span>
          <span className="text-[#8A847A]" aria-hidden="true">
            ·
          </span>
          <span
            data-testid="milestone-tracker-synced-pct"
            className="font-semibold text-[#146C53] dark:text-[#2EB88B]"
          >
            {syncedCompletionPct}% track progress
          </span>
        </div>
      </div>

      {/* Upcoming Objectives Summary Strip */}
      <div
        data-testid="upcoming-mentorship-milestones-strip"
        className="rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs"
      >
        <div className="flex items-center gap-2 text-[#17191C] dark:text-[#F4F2EE]">
          <Compass
            className="w-3.5 h-3.5 shrink-0 text-[#146C53] dark:text-[#2EB88B]"
            aria-hidden="true"
          />
          <span className="font-semibold">Upcoming Objectives:</span>
          {upcomingObjectives.length > 0 ? (
            <span className="text-[#575B62] dark:text-[#A3A7AE]">
              {upcomingObjectives
                .slice(0, 3)
                .map((obj) => obj.title)
                .join(' → ')}
              {upcomingObjectives.length > 3
                ? ` (+${upcomingObjectives.length - 3} more)`
                : ''}
            </span>
          ) : (
            <span className="text-[#146C53] dark:text-[#2EB88B] font-medium">
              All track mentorship milestones completed
            </span>
          )}
        </div>
        <span className="text-[11px] font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE]">
          {upcomingObjectives.length} remaining
        </span>
      </div>

      {/* Interactive Learning Objectives Grid with Status Indicators & Audio Feedback */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {objectivesWithStatus.map((objective) => {
          const isMastered = objective.status === 'completed';
          const isUpNext = objective.status === 'up-next';
          const isPlaying = playingObjectiveId === objective.id;
          const isRecording = recordingObjectiveId === objective.id;
          const clipKey = `${track.id}:${objective.id}`;
          const recordedClip = recordedClips[clipKey];
          const activeDurationSec = recordedClip
            ? recordedClip.durationSeconds
            : objective.audioMemo.durationSeconds;
          const activeDurationLabel = recordedClip
            ? recordedClip.durationLabel
            : objective.audioMemo.durationLabel;
          const progressPct = isPlaying
            ? Math.min(
                100,
                Math.round(
                  (elapsedSeconds / Math.max(1, activeDurationSec)) * 100
                )
              )
            : 0;

          return (
            <div
              key={objective.id}
              data-testid={`learning-objective-${objective.id}`}
              data-status={objective.status}
              className={`rounded-lg border p-3 flex flex-col justify-between gap-2.5 transition-colors ${
                isMastered
                  ? 'bg-[#E7F3EE]/65 dark:bg-[#142B24]/70 border-[#146C53] dark:border-[#2EB88B]'
                  : isUpNext
                    ? 'bg-white dark:bg-[#1A1C20] border-[#C4622D]/60 dark:border-[#E07B46]/60'
                    : 'bg-white dark:bg-[#1A1C20] border-[#E8E3DB] dark:border-[#2C3037]'
              }`}
            >
              {/* Primary Milestone Completion Toggle */}
              <button
                type="button"
                role="checkbox"
                aria-checked={isMastered}
                data-testid={`learning-objective-toggle-${objective.id}`}
                onClick={() => onToggleObjective(track.id, objective.id)}
                className="text-left space-y-1.5 w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B] rounded cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE]">
                    0{objective.order} · {objective.competencyTag}
                  </span>
                  <span
                    data-testid={`objective-status-${objective.id}`}
                    className={`inline-flex items-center gap-1 font-semibold shrink-0 ${
                      isMastered
                        ? 'text-[#146C53] dark:text-[#2EB88B]'
                        : isUpNext
                          ? 'text-[#C4622D] dark:text-[#E07B46]'
                          : 'text-[#575B62] dark:text-[#A3A7AE]'
                    }`}
                  >
                    {isMastered ? (
                      <>
                        <CheckCircle2
                          className="w-3.5 h-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        <span>Completed</span>
                      </>
                    ) : isUpNext ? (
                      <>
                        <Clock3
                          className="w-3.5 h-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        <span>Up Next</span>
                      </>
                    ) : (
                      <>
                        <Circle
                          className="w-3.5 h-3.5 shrink-0"
                          aria-hidden="true"
                        />
                        <span>Upcoming</span>
                      </>
                    )}
                  </span>
                </div>

                <p className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                  {objective.title}
                </p>

                <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                  {objective.description}
                </p>
              </button>

              {/* Mentor Audio Feedback Control, Live Mic Recording & Transcript */}
              <div className="pt-2 border-t border-[#E8E3DB]/80 dark:border-[#2C3037]/80 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      data-testid={`audio-feedback-btn-${objective.id}`}
                      aria-pressed={isPlaying}
                      aria-label={
                        isPlaying
                          ? `Stop mentor audio feedback for ${objective.title}`
                          : `Play mentor audio feedback for ${objective.title}`
                      }
                      onClick={() => handleToggleAudioMemo(objective)}
                      className={`min-h-[30px] px-2.5 py-1 rounded-md border text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                        isPlaying
                          ? 'bg-[#146C53] dark:bg-[#2EB88B] border-[#146C53] dark:border-[#2EB88B] text-white dark:text-[#121315]'
                          : 'bg-[#FAF8F5] dark:bg-[#121315] border-[#E8E3DB] dark:border-[#2C3037] text-[#17191C] dark:text-[#F4F2EE] hover:border-[#146C53] dark:hover:border-[#2EB88B]'
                      }`}
                    >
                      {isPlaying ? (
                        <>
                          <Square
                            className="w-3 h-3 fill-current shrink-0"
                            aria-hidden="true"
                          />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Play
                            className="w-3 h-3 fill-current shrink-0 text-[#146C53] dark:text-[#2EB88B]"
                            aria-hidden="true"
                          />
                          <span>
                            {recordedClip ? 'Play Clip' : 'Audio Feedback'}
                          </span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      data-testid={`record-audio-memo-btn-${objective.id}`}
                      aria-pressed={isRecording}
                      aria-label={
                        isRecording
                          ? `Stop recording mentor voice memo for ${objective.title}`
                          : `Record mentor voice memo for ${objective.title}`
                      }
                      onClick={() => void handleToggleRecordMemo(objective.id)}
                      className={`min-h-[30px] px-2 py-1 rounded-md border text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                        isRecording
                          ? 'bg-[#C4622D] dark:bg-[#E07B46] border-[#C4622D] dark:border-[#E07B46] text-white dark:text-[#121315]'
                          : 'bg-[#FAF8F5] dark:bg-[#121315] border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] hover:border-[#C4622D] dark:hover:border-[#E07B46]'
                      }`}
                    >
                      {isRecording ? (
                        <>
                          <Square
                            className="w-3 h-3 fill-current shrink-0"
                            aria-hidden="true"
                          />
                          <span className="font-mono-tabular tabular-nums">
                            {formatSeconds(recordingSeconds)}
                          </span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-3 h-3 shrink-0" aria-hidden="true" />
                          <span>Record</span>
                        </>
                      )}
                    </button>

                    {recordedClip && !isRecording && (
                      <button
                        type="button"
                        onClick={() => handleResetRecordedClip(objective.id)}
                        aria-label={`Revert to built-in mentor memo for ${objective.title}`}
                        title="Revert to built-in mentor memo"
                        className="min-h-[30px] px-1.5 py-1 rounded-md border border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] inline-flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" aria-hidden="true" />
                      </button>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1 text-[10px] font-mono-tabular tabular-nums text-[#575B62] dark:text-[#A3A7AE]">
                    <Volume2 className="w-3 h-3 shrink-0" aria-hidden="true" />
                    <span>
                      {isPlaying
                        ? `${formatSeconds(elapsedSeconds)} / ${activeDurationLabel}`
                        : recordedClip
                          ? `Mic · ${activeDurationLabel}`
                          : activeDurationLabel}
                    </span>
                  </span>
                </div>

                {recordingNotice?.objectiveId === objective.id && (
                  <p
                    role="status"
                    data-testid={`record-audio-notice-${objective.id}`}
                    className="text-[11px] text-[#C4622D] dark:text-[#E07B46] leading-snug"
                  >
                    {recordingNotice.message}
                  </p>
                )}

                {isPlaying && (
                  <div
                    data-testid={`audio-feedback-transcript-${objective.id}`}
                    aria-live="polite"
                    className="space-y-1.5 rounded-md bg-[#FAF8F5] dark:bg-[#121315] border border-[#146C53]/25 dark:border-[#2EB88B]/30 p-2"
                  >
                    <div className="h-1 w-full rounded-full bg-[#E8E3DB] dark:bg-[#2C3037] overflow-hidden">
                      <div
                        className="h-full bg-[#146C53] dark:bg-[#2EB88B] transition-all duration-300"
                        style={{ width: `${Math.max(8, progressPct)}%` }}
                      />
                    </div>
                    {recordedClip ? (
                      <p className="text-[11px] leading-relaxed text-[#17191C] dark:text-[#F4F2EE]">
                        Playing recorded mentor voice memo ({recordedClip.durationLabel}, captured at {recordedClip.recordedAtLabel}).
                      </p>
                    ) : (
                      <p className="text-[11px] leading-relaxed text-[#17191C] dark:text-[#F4F2EE]">
                        “{objective.audioMemo.transcript}”
                      </p>
                    )}
                    <p className="text-[10px] text-[#575B62] dark:text-[#A3A7AE]">
                      {recordedClip
                        ? `Recorded microphone memo · ${mentorName}`
                        : `Voice memo · ${mentorName}`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
