import React, { useRef, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Lightbulb,
  Loader2,
  Mic,
  Sparkles,
  Square,
  Trash2,
  Upload,
} from 'lucide-react';
import type {
  LivingProofAnalysis,
  LivingProofPortfolio,
  PractitionerProfile,
  ProofSampleImage,
  SkillTrackId,
  WorkplaceReadinessSignals,
} from '../types/kora';
import {
  SKILL_TRACK_OPTIONS,
  buildOfflineLivingProofAnalysis,
  countWorkplaceSignals,
  getSkillTrackOption,
  makeSafeId,
} from '../utils/talentEngine';
import { useSpeechInput } from '../hooks/useSpeechInput';
import { RippleConstellationMotif } from './ResilienceMotifs';
import sampleSolarWiringImg from '../assets/images/sample_solar_wiring_1795541459833.jpg';
import sampleSmeInventoryImg from '../assets/images/sample_sme_inventory_1795541458723.jpg';

interface LivingProofPortfolioSectionProps {
  profile: PractitionerProfile;
  portfolio: LivingProofPortfolio;
  isOnline: boolean;
  speechLang: string;
  onUpdatePortfolio: (next: LivingProofPortfolio) => void;
}

interface SamplePreset {
  id: string;
  buttonLabel: string;
  trackId: SkillTrackId;
  imageLabel: string;
  imageSrc: string;
  caption: string;
  walkthrough: string;
}

const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'sample-solar',
    buttonLabel: 'Solar Panel Wiring Job',
    trackId: 'trades-solar',
    imageLabel: '48V Solar Inverter & Breaker Board',
    imageSrc: sampleSolarWiringImg,
    caption:
      'Wired and load-tested a 48V solar inverter, labeled DC breakers, and balanced busbar at 52.4V for a rural clinic.',
    walkthrough:
      'Installed surge-protected DC isolation breakers, crimped copper busbar lugs cleanly, and verified 52.4V steady output under full load.',
  },
  {
    id: 'sample-inventory',
    buttonLabel: 'SME Inventory Dashboard',
    trackId: 'business-finance',
    imageLabel: 'Weekly SME Inventory & Cash-Flow Tracker',
    imageSrc: sampleSmeInventoryImg,
    caption:
      'Built a weekly inventory and cash-flow tracker eliminating stockouts across 45 fast-moving shop SKUs.',
    walkthrough:
      'Reconciled physical bin counts against daily supplier receipts and automated reorder alerts before weekend market peaks.',
  },
];

async function resizeImageSourceToJpegDataUrl(srcOrFile: File | string): Promise<string> {
  const objectUrl = typeof srcOrFile === 'string' ? srcOrFile : URL.createObjectURL(srcOrFile);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.crossOrigin = 'anonymous';
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Unable to load image for compression'));
      el.src = objectUrl;
    });

    const maxDim = 900;
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth || 900, img.naturalHeight || 900));
    const width = Math.max(1, Math.round((img.naturalWidth || 900) * scale));
    const height = Math.max(1, Math.round((img.naturalHeight || 900) * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas unavailable');
    }
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', 0.82);
  } finally {
    if (typeof srcOrFile !== 'string') {
      URL.revokeObjectURL(objectUrl);
    }
  }
}

function extractBase64FromDataUrl(dataUrl: string): { mimeType: string; base64Data: string } | null {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], base64Data: match[2] };
}

export const LivingProofPortfolioSection: React.FC<LivingProofPortfolioSectionProps> = ({
  profile,
  portfolio,
  isOnline,
  speechLang,
  onUpdatePortfolio,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { isListening, unsupportedMessage, toggleListening } = useSpeechInput(
    speechLang,
    (spoken) => {
      const current = portfolio.voiceWalkthrough.trim();
      onUpdatePortfolio({
        ...portfolio,
        voiceWalkthrough: current ? `${current} ${spoken}` : spoken,
        updatedAtIso: new Date().toISOString(),
      });
    }
  );

  const selectedTrack = getSkillTrackOption(portfolio.skillTrackId);
  const activeSignalsCount = countWorkplaceSignals(portfolio.workplaceSignals);

  const handleSelectTrack = (trackId: SkillTrackId) => {
    setErrorMsg(null);
    onUpdatePortfolio({
      ...portfolio,
      skillTrackId: trackId,
      updatedAtIso: new Date().toISOString(),
    });
  };

  const handleFilesAdded = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileArray.length === 0) {
      setErrorMsg('Please select PNG, JPEG, or WebP work-sample photos.');
      return;
    }

    const availableSlots = Math.max(0, 3 - portfolio.images.length);
    if (availableSlots === 0) {
      setErrorMsg('Maximum 3 work-sample photos reached. Remove one to add another.');
      return;
    }

    setErrorMsg(null);
    setIsProcessingImages(true);
    try {
      const added: ProofSampleImage[] = [];
      for (const file of fileArray.slice(0, availableSlots)) {
        const dataUrl = await resizeImageSourceToJpegDataUrl(file);
        added.push({
          id: makeSafeId('proofimg'),
          label: file.name.replace(/\.[^/.]+$/, '').slice(0, 48) || 'Work Sample',
          mimeType: 'image/jpeg',
          dataUrl,
        });
      }
      onUpdatePortfolio({
        ...portfolio,
        images: [...portfolio.images, ...added].slice(0, 3),
        updatedAtIso: new Date().toISOString(),
      });
      setStatusNote(
        `${added.length} work sample${added.length === 1 ? '' : 's'} compressed and ready for review.`
      );
    } catch {
      setErrorMsg('Could not process the selected image. Please try a JPEG or PNG photo.');
    } finally {
      setIsProcessingImages(false);
    }
  };

  const handleTrySamplePreset = async (preset: SamplePreset) => {
    setErrorMsg(null);
    setIsProcessingImages(true);
    try {
      const dataUrl = await resizeImageSourceToJpegDataUrl(preset.imageSrc);
      const sampleImage: ProofSampleImage = {
        id: makeSafeId('sample'),
        label: preset.imageLabel,
        mimeType: 'image/jpeg',
        dataUrl,
      };
      const existingWithoutDuplicate = portfolio.images.filter(
        (img) => img.label !== preset.imageLabel
      );
      const nextImages = [sampleImage, ...existingWithoutDuplicate].slice(0, 3);

      onUpdatePortfolio({
        ...portfolio,
        skillTrackId: preset.trackId,
        problemSolvedCaption: preset.caption,
        voiceWalkthrough: portfolio.voiceWalkthrough.trim()
          ? portfolio.voiceWalkthrough
          : preset.walkthrough,
        images: nextImages,
        updatedAtIso: new Date().toISOString(),
      });
      setStatusNote(`Loaded sample "${preset.buttonLabel}" — click Build Employer-Ready Proof.`);
    } catch {
      setErrorMsg('Unable to load sample photo right now.');
    } finally {
      setIsProcessingImages(false);
    }
  };

  const handleRemoveImage = (imageId: string) => {
    onUpdatePortfolio({
      ...portfolio,
      images: portfolio.images.filter((img) => img.id !== imageId),
      updatedAtIso: new Date().toISOString(),
    });
  };

  const handleToggleWorkplaceSignal = (key: keyof WorkplaceReadinessSignals) => {
    const nextSignals: WorkplaceReadinessSignals = {
      ...portfolio.workplaceSignals,
      [key]: !portfolio.workplaceSignals[key],
    };
    onUpdatePortfolio({
      ...portfolio,
      workplaceSignals: nextSignals,
      updatedAtIso: new Date().toISOString(),
    });
  };

  const handleAnalyzePortfolio = async () => {
    setErrorMsg(null);
    setStatusNote(null);

    if (
      portfolio.images.length === 0 &&
      portfolio.problemSolvedCaption.trim().length < 8 &&
      portfolio.voiceWalkthrough.trim().length < 12
    ) {
      setErrorMsg(
        'Upload 1–3 work-sample photos, tap a Sample Photo, or describe what problem your work solved.'
      );
      return;
    }

    if (!isOnline) {
      const offlineAnalysis = buildOfflineLivingProofAnalysis({
        skillTrackId: portfolio.skillTrackId,
        imageCount: portfolio.images.length,
        problemSolvedCaption: portfolio.problemSolvedCaption,
        voiceWalkthrough: portfolio.voiceWalkthrough,
        peerVouch: portfolio.peerVouch,
        workplaceSignals: portfolio.workplaceSignals,
      });
      onUpdatePortfolio({
        ...portfolio,
        analysis: offlineAnalysis,
        updatedAtIso: new Date().toISOString(),
      });
      setStatusNote('Offline readiness score saved locally. Re-run online for Gemini Vision review.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const encodedImages = portfolio.images
        .map((img) => {
          const extracted = extractBase64FromDataUrl(img.dataUrl);
          if (!extracted) return null;
          return {
            label: img.label,
            mimeType: extracted.mimeType,
            base64Data: extracted.base64Data,
          };
        })
        .filter((x): x is { label: string; mimeType: string; base64Data: string } => x !== null);

      const res = await fetch('/api/solve/proof-portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillTrackId: portfolio.skillTrackId,
          skillTrackLabel: selectedTrack.title,
          problemSolvedCaption: portfolio.problemSolvedCaption.trim(),
          voiceWalkthrough: portfolio.voiceWalkthrough.trim(),
          peerVouch: portfolio.peerVouch.trim(),
          displayName: profile.displayName,
          ageStage: profile.ageStage,
          workplaceSignalsCount: activeSignalsCount,
          images: encodedImages,
        }),
      });

      const data = (await res.json()) as {
        analysis?: LivingProofAnalysis;
        error?: string;
      };

      if (!res.ok || !data.analysis) {
        throw new Error(data.error || 'Could not evaluate proof portfolio');
      }

      onUpdatePortfolio({
        ...portfolio,
        analysis: data.analysis,
        updatedAtIso: new Date().toISOString(),
      });
      setStatusNote('Employer-Ready Proof updated and reflected in your Pulse SDG readiness.');
    } catch {
      const fallback = buildOfflineLivingProofAnalysis({
        skillTrackId: portfolio.skillTrackId,
        imageCount: portfolio.images.length,
        problemSolvedCaption: portfolio.problemSolvedCaption,
        voiceWalkthrough: portfolio.voiceWalkthrough,
        peerVouch: portfolio.peerVouch,
        workplaceSignals: portfolio.workplaceSignals,
      });
      onUpdatePortfolio({
        ...portfolio,
        analysis: fallback,
        updatedAtIso: new Date().toISOString(),
      });
      setStatusNote(
        'Generated structured local readiness assessment (AI service unavailable right now).'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analysis = portfolio.analysis;

  return (
    <section
      id="living-proof-portfolio"
      data-testid="living-proof-portfolio-section"
      aria-labelledby="living-proof-heading"
      className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-6 sm:p-8 space-y-6"
    >
      {/* Subtle 5% Ripple Constellation Motif */}
      <RippleConstellationMotif className="opacity-[0.05] dark:opacity-[0.05]" />

      {/* Header */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-[#E8E3DB] dark:border-[#2C3037]">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#146C53] dark:text-[#2EB88B]">
            Module 1 · Living Proof Portfolio · SDGs 8, 10 &amp; 17
          </p>
          <h2
            id="living-proof-heading"
            className="mt-1.5 font-display text-2xl sm:text-3xl font-medium tracking-tight text-[#17191C] dark:text-[#F4F2EE]"
          >
            Living Proof Portfolio &amp; Market Readiness
          </h2>
          <p className="mt-2 text-sm text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
            Show real work samples and a 30-second job explanation so local workshops and remote hiring partners can score your readiness without formal CVs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {analysis ? (
            <span
              data-testid="proof-ready-pill"
              className="min-h-[36px] px-3 py-1.5 rounded-xl bg-[#E7F3EE] dark:bg-[#142B24] border border-[#146C53]/30 dark:border-[#2EB88B]/35 text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1.5 font-mono-tabular"
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>
                Local {analysis.localReadinessPct}% · Remote {analysis.remoteReadinessPct}%
              </span>
            </span>
          ) : (
            <span className="min-h-[36px] px-3 py-1.5 rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] text-xs font-medium text-[#575B62] dark:text-[#A3A7AE] inline-flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-[#C4622D] dark:text-[#E07B46]" />
              <span>1–3 Photos + 30s Walkthrough</span>
            </span>
          )}
        </div>
      </div>

      {/* 1. Relatable Skill Track Selector */}
      <div className="relative z-10 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#575B62] dark:text-[#A3A7AE]">
            1. Choose Your Everyday Skill Track
          </p>
          <span className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
            Active: <strong className="text-[#17191C] dark:text-[#F4F2EE]">{selectedTrack.title}</strong>
          </span>
        </div>

        <div
          role="radiogroup"
          aria-label="Relatable Skill Track"
          className="flex flex-wrap gap-2"
        >
          {SKILL_TRACK_OPTIONS.map((track) => {
            const active = portfolio.skillTrackId === track.id;
            return (
              <button
                key={track.id}
                type="button"
                role="radio"
                aria-checked={active}
                data-testid={`skill-track-chip-${track.id}`}
                onClick={() => handleSelectTrack(track.id)}
                className={`min-h-[42px] px-3.5 py-2 rounded-xl border text-start transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] ${
                  active
                    ? 'bg-[#E7F3EE] dark:bg-[#142B24] border-[#146C53] dark:border-[#2EB88B] text-[#146C53] dark:text-[#2EB88B]'
                    : 'bg-[#FAF8F5] dark:bg-[#121315] border-[#E8E3DB] dark:border-[#2C3037] text-[#17191C] dark:text-[#F4F2EE] hover:border-[#C9C1B5] dark:hover:border-[#424752]'
                }`}
              >
                <span className="block text-xs font-semibold">{track.title}</span>
                <span className="block text-[11px] text-[#575B62] dark:text-[#A3A7AE] mt-0.5">
                  {track.examples}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Multimodal Proof-of-Work Uploader + 3. Employer-Ready Proof Card */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Multimodal Uploader & Inputs */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#575B62] dark:text-[#A3A7AE]">
              2. Work-Sample Proof &amp; Explanation
            </p>
            <span className="text-[11px] font-mono-tabular text-[#575B62] dark:text-[#A3A7AE]">
              {portfolio.images.length}/3 photos
            </span>
          </div>

          {/* Drag-and-drop / Tap Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files?.length) {
                void handleFilesAdded(e.dataTransfer.files);
              }
            }}
            className={`rounded-xl border border-dashed p-4 transition-colors ${
              isDragging
                ? 'border-[#146C53] dark:border-[#2EB88B] bg-[#E7F3EE]/60 dark:bg-[#142B24]/60'
                : 'border-[#CFC7BA] dark:border-[#393E47] bg-[#FAF8F5] dark:bg-[#121315]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              aria-label="Upload 1 to 3 work-sample photos"
              data-testid="proof-image-file-input"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) {
                  void handleFilesAdded(e.target.files);
                  e.target.value = '';
                }
              }}
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] flex items-center justify-center shrink-0 text-[#146C53] dark:text-[#2EB88B]">
                  {isProcessingImages ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                    Drag &amp; drop or tap to add 1–3 work photos
                  </p>
                  <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE] mt-0.5">
                    Auto-compressed locally for low-bandwidth review (finished job, circuit, ledger, or craft).
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingImages || portfolio.images.length >= 3}
                className="min-h-[38px] px-3.5 py-1.5 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:border-[#146C53] dark:hover:border-[#2EB88B] disabled:opacity-50 text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] whitespace-nowrap shrink-0 transition-colors"
              >
                Tap to Upload
              </button>
            </div>

            {/* Try Sample Photo Presets */}
            <div className="mt-3 pt-3 border-t border-[#E8E3DB] dark:border-[#2C3037] flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-medium text-[#575B62] dark:text-[#A3A7AE]">
                Try Sample Photo:
              </span>
              {SAMPLE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  disabled={isProcessingImages}
                  data-testid={`try-sample-${preset.id}`}
                  onClick={() => void handleTrySamplePreset(preset)}
                  className="min-h-[32px] px-2.5 py-1 rounded-lg border border-[#C4622D]/35 dark:border-[#E07B46]/40 bg-white dark:bg-[#1A1C20] hover:bg-[#F9ECE5] dark:hover:bg-[#261B15] text-[11px] font-semibold text-[#C4622D] dark:text-[#E07B46] transition-colors whitespace-nowrap"
                >
                  {preset.buttonLabel}
                </button>
              ))}
            </div>
          </div>

          {/* Thumbnail Previews */}
          {portfolio.images.length > 0 && (
            <div className="grid grid-cols-3 gap-2.5" data-testid="proof-image-thumbnails">
              {portfolio.images.map((img) => (
                <div
                  key={img.id}
                  className="group relative rounded-xl overflow-hidden border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315]"
                >
                  {img.dataUrl ? (
                    <img
                      src={img.dataUrl}
                      alt={img.label}
                      className="w-full h-24 object-cover"
                    />
                  ) : (
                    <div className="w-full h-24 flex items-center justify-center text-[11px] text-[#575B62] dark:text-[#A3A7AE] px-2 text-center">
                      {img.label}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(img.id)}
                    aria-label={`Remove ${img.label}`}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#17191C]/80 text-white hover:bg-[#B42318] flex items-center justify-center transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <p className="px-2 py-1 text-[10px] font-medium text-[#17191C] dark:text-[#F4F2EE] truncate bg-white/95 dark:bg-[#1A1C20]/95 border-t border-[#E8E3DB] dark:border-[#2C3037]">
                    {img.label}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* 1-Line Caption */}
          <div>
            <label
              htmlFor="proof-problem-caption"
              className="block text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] mb-1.5"
            >
              What problem did this solve?
            </label>
            <input
              id="proof-problem-caption"
              type="text"
              value={portfolio.problemSolvedCaption}
              maxLength={280}
              onChange={(e) =>
                onUpdatePortfolio({
                  ...portfolio,
                  problemSolvedCaption: e.target.value,
                  updatedAtIso: new Date().toISOString(),
                })
              }
              placeholder="e.g., Restored stable 48V solar backup for a 24-hour maternity clinic"
              className="w-full min-h-[42px] rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3.5 py-2 text-xs sm:text-sm text-[#17191C] dark:text-[#F4F2EE] placeholder:text-[#787C84] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53]"
            />
          </div>

          {/* 30-Second Voice Walkthrough + Editable Textarea */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <label
                htmlFor="proof-voice-walkthrough"
                className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]"
              >
                Explain this job in 30 seconds
              </label>
              <button
                type="button"
                onClick={() =>
                  toggleListening(
                    'Speech-to-text is unavailable in this browser — type your 30-second summary directly.'
                  )
                }
                aria-pressed={isListening}
                className={`min-h-[30px] px-2.5 py-1 rounded-lg border text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors ${
                  isListening
                    ? 'bg-[#C4622D] border-[#C4622D] text-white'
                    : 'bg-white dark:bg-[#1A1C20] border-[#E8E3DB] dark:border-[#2C3037] text-[#146C53] dark:text-[#2EB88B] hover:border-[#146C53]'
                }`}
              >
                {isListening ? (
                  <>
                    <Square className="w-3 h-3 fill-current" />
                    <span>Stop Voice</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3 h-3" />
                    <span>Voice Walkthrough</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              id="proof-voice-walkthrough"
              rows={2}
              maxLength={600}
              value={portfolio.voiceWalkthrough}
              onChange={(e) =>
                onUpdatePortfolio({
                  ...portfolio,
                  voiceWalkthrough: e.target.value,
                  updatedAtIso: new Date().toISOString(),
                })
              }
              placeholder="Briefly walk a hiring partner through the tools, safety check, or outcome delivered..."
              className="w-full rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3.5 py-2.5 text-xs sm:text-sm text-[#17191C] dark:text-[#F4F2EE] placeholder:text-[#787C84] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] resize-y"
            />
            {unsupportedMessage && (
              <p className="mt-1 text-[11px] text-[#9A5B13] dark:text-[#E5A95E]">
                {unsupportedMessage}
              </p>
            )}
          </div>

          {/* Optional 1-line Past-Client / Peer Vouch */}
          <div>
            <label
              htmlFor="proof-peer-vouch"
              className="block text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] mb-1.5"
            >
              Past-Client or Peer Vouch <span className="font-normal text-[#575B62] dark:text-[#A3A7AE]">(optional)</span>
            </label>
            <input
              id="proof-peer-vouch"
              type="text"
              maxLength={220}
              value={portfolio.peerVouch}
              onChange={(e) =>
                onUpdatePortfolio({
                  ...portfolio,
                  peerVouch: e.target.value,
                  updatedAtIso: new Date().toISOString(),
                })
              }
              placeholder="e.g., Clinic supervisor Omar confirmed zero power drops over 6 months"
              className="w-full min-h-[40px] rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3.5 py-2 text-xs sm:text-sm text-[#17191C] dark:text-[#F4F2EE] placeholder:text-[#787C84] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53]"
            />
          </div>

          {errorMsg && (
            <p role="alert" className="text-xs font-medium text-[#B42318] dark:text-[#F97066]">
              {errorMsg}
            </p>
          )}
          {statusNote && (
            <p role="status" className="text-xs font-medium text-[#146C53] dark:text-[#2EB88B]">
              {statusNote}
            </p>
          )}

          <button
            type="button"
            disabled={isAnalyzing || isProcessingImages}
            data-testid="build-employer-proof-btn"
            onClick={() => void handleAnalyzePortfolio()}
            className="w-full min-h-[46px] px-5 py-2.5 rounded-xl bg-[#C4622D] hover:bg-[#AA5223] dark:bg-[#E07B46] dark:hover:bg-[#CE6A36] disabled:opacity-60 text-white dark:text-[#121315] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing Work Samples &amp; Market Fit…</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Build Employer-Ready Proof</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Employer-Ready Proof Card */}
        <div className="lg:col-span-6">
          <div
            data-testid="employer-proof-card"
            className="rounded-2xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-5 sm:p-6 space-y-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-[#E8E3DB] dark:border-[#2C3037]">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#146C53] dark:text-[#2EB88B]">
                  Employer-Ready Proof Card
                </p>
                <h3 className="mt-0.5 font-display text-lg font-medium text-[#17191C] dark:text-[#F4F2EE]">
                  {selectedTrack.title}
                </h3>
              </div>
              {analysis && (
                <span className="text-[11px] font-mono-tabular px-2.5 py-1 rounded-lg bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE]">
                  {analysis.source === 'ai' ? 'Gemini Vision Reviewed' : 'Local Assessment'}
                </span>
              )}
            </div>

            {analysis ? (
              <>
                {/* Dual Market-Fit Meters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                        Local Role Readiness
                      </span>
                      <span
                        data-testid="local-readiness-pct"
                        className="text-sm font-bold font-mono-tabular text-[#146C53] dark:text-[#2EB88B]"
                      >
                        {analysis.localReadinessPct}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[#E8E3DB] dark:bg-[#2C3037] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#146C53] dark:bg-[#2EB88B] transition-all duration-500"
                        style={{ width: `${analysis.localReadinessPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                        Remote Role Readiness
                      </span>
                      <span
                        data-testid="remote-readiness-pct"
                        className="text-sm font-bold font-mono-tabular text-[#C4622D] dark:text-[#E07B46]"
                      >
                        {analysis.remoteReadinessPct}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[#E8E3DB] dark:bg-[#2C3037] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#C4622D] dark:bg-[#E07B46] transition-all duration-500"
                        style={{ width: `${analysis.remoteReadinessPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-[#43484E] dark:text-[#C4C9D0] leading-relaxed">
                  {analysis.marketFitSummary}
                </p>

                {/* Visual Craft Highlights */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                    Visual Craft Highlights
                  </p>
                  <ul className="space-y-2">
                    {analysis.visualHighlights.slice(0, 3).map((highlight, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-xs text-[#43484E] dark:text-[#C4C9D0] leading-relaxed"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B] shrink-0 mt-0.5" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* One Concrete Level-Up Tip */}
                <div className="rounded-xl bg-[#F9ECE5]/75 dark:bg-[#261B15]/80 border border-[#C4622D]/25 dark:border-[#E07B46]/30 p-3.5 flex items-start gap-2.5">
                  <Lightbulb className="w-4 h-4 text-[#C4622D] dark:text-[#E07B46] shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <span className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                      Level-Up Tip:{' '}
                    </span>
                    <span className="text-[#43484E] dark:text-[#D5C3B8]">{analysis.levelUpTip}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-[#D7CFC3] dark:border-[#343942] bg-white/70 dark:bg-[#1A1C20]/60 p-5 text-center space-y-2">
                <p className="text-sm font-medium text-[#17191C] dark:text-[#F4F2EE]">
                  Ready to turn your hands-on work into an Employer-Ready Proof Card
                </p>
                <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                  Add a photo (or tap <strong>Try Sample Photo</strong>) and click{' '}
                  <strong>Build Employer-Ready Proof</strong> to generate craft highlights and local + remote readiness scores.
                </p>
              </div>
            )}

            {/* Workplace Readiness Check (3 Interactive Employer Signals) */}
            <div className="pt-4 border-t border-[#E8E3DB] dark:border-[#2C3037] space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                  Workplace Readiness Check
                </p>
                <span className="text-[11px] font-mono-tabular font-semibold text-[#146C53] dark:text-[#2EB88B]">
                  {activeSignalsCount}/3 signals confirmed
                </span>
              </div>

              <div className="space-y-2">
                {(
                  [
                    {
                      key: 'clearTimelines',
                      label: 'Clear Timelines & Reliable Delivery',
                    },
                    {
                      key: 'qualitySafetyCheck',
                      label: 'Quality / Safety Self-Check',
                    },
                    {
                      key: 'clientCommunication',
                      label: 'Client & Team Communication Ready',
                    },
                  ] as const
                ).map((signal) => {
                  const checked = portfolio.workplaceSignals[signal.key];
                  return (
                    <label
                      key={signal.key}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                        checked
                          ? 'bg-[#E7F3EE]/80 dark:bg-[#142B24]/80 border-[#146C53]/40 dark:border-[#2EB88B]/45 text-[#17191C] dark:text-[#F4F2EE] font-medium'
                          : 'bg-white dark:bg-[#1A1C20] border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        data-testid={`workplace-signal-${signal.key}`}
                        onChange={() => handleToggleWorkplaceSignal(signal.key)}
                        className="w-4 h-4 rounded accent-[#146C53] shrink-0"
                      />
                      <span>{signal.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
