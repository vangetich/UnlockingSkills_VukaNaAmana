import React, { useState } from 'react';
import { ArrowRight, Globe, Moon, Sun } from 'lucide-react';
import type { AgeStage, LocaleCode, ThemeMode } from '../types/kora';
import {
  LOCALE_OPTIONS,
  getStageLabel,
  type TranslationDictionary,
} from '../utils/i18n';
import { VoiceInput, VoiceTextarea } from './VoiceField';

interface OnboardingHeroProps {
  initialProblem: string;
  initialName: string;
  initialStage: AgeStage;
  locale: LocaleCode;
  speechLang: string;
  onChangeLocale: (locale: LocaleCode) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onCompleteOnboarding: (data: {
    problemStatement: string;
    displayName: string;
    ageStage: AgeStage;
  }) => void;
  onGoogleSync: () => void;
  userEmail: string | null;
  t: TranslationDictionary;
}

const STAGES: AgeStage[] = ['15-17', '18-29', '30-45', '46+'];

const EXAMPLE_PROMPTS = [
  '48V solar inverter diagnostics & battery balancing',
  'Gravity-fed water filtration calibration',
  'Cold-chain refrigeration retrofit & maintenance',
  'Multilingual clinical triage localization',
];

export const OnboardingHero: React.FC<OnboardingHeroProps> = ({
  initialProblem,
  initialName,
  initialStage,
  locale,
  speechLang,
  onChangeLocale,
  theme,
  onToggleTheme,
  onCompleteOnboarding,
  onGoogleSync,
  userEmail,
  t,
}) => {
  const [problemStatement, setProblemStatement] = useState(initialProblem);
  const [displayName, setDisplayName] = useState(initialName);
  const [ageStage, setAgeStage] = useState<AgeStage>(initialStage);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = problemStatement.trim();
    if (cleaned.length < 3) {
      setValidationError(t.validationProblemRequired);
      return;
    }
    setValidationError(null);
    onCompleteOnboarding({
      problemStatement: cleaned,
      displayName: displayName.trim() || 'Practitioner',
      ageStage,
    });
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] dark:bg-[#121210] text-[#1C1B18] dark:text-[#F2EFE9] flex flex-col">
      {/* Minimalist Top Bar */}
      <header className="border-b border-[#E4DFD6] dark:border-[#2E2B26]">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-6">
          <span className="font-display text-xl font-semibold tracking-tight whitespace-nowrap shrink-0">
            {t.brandName}
          </span>

          <div className="flex items-center gap-3">
            <div className="relative inline-flex items-center">
              <Globe className="w-3.5 h-3.5 text-[#5C5852] dark:text-[#A8A298] pointer-events-none absolute start-2.5" />
              <select
                aria-label="Select language"
                value={locale}
                onChange={(e) => onChangeLocale(e.target.value as LocaleCode)}
                className="min-h-[38px] ps-8 pe-3 py-1 rounded-lg bg-white dark:bg-[#1B1A17] border border-[#E4DFD6] dark:border-[#2E2B26] text-xs font-medium text-[#1C1B18] dark:text-[#F2EFE9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E43] dark:focus-visible:ring-[#34A874]"
              >
                {LOCALE_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.nativeLabel}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? t.themeLight : t.themeDark}
              className="min-h-[38px] px-3 py-1 rounded-lg bg-white dark:bg-[#1B1A17] border border-[#E4DFD6] dark:border-[#2E2B26] text-xs font-medium inline-flex items-center gap-1.5 hover:bg-[#EFECE6] dark:hover:bg-[#24221E] transition-colors whitespace-nowrap shrink-0"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">
                {theme === 'dark' ? t.themeLight : t.themeDark}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Dignified Editorial Hero */}
      <main className="flex-1 flex items-center py-6 sm:py-10 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto w-full">
          <p className="text-xs font-semibold tracking-wider text-[#1B5E43] dark:text-[#34A874]">
            {t.heroEyebrow}
          </p>

          <h1
            className="font-display text-3xl sm:text-5xl font-medium tracking-tight leading-[1.12] mt-2 text-[#1C1B18] dark:text-[#F2EFE9]"
            style={{ textWrap: 'balance' }}
          >
            {t.heroQuestion}
          </h1>

          <p className="mt-3 text-base sm:text-lg leading-relaxed text-[#5C5852] dark:text-[#A8A298] max-w-2xl">
            {t.heroSubcopy}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 sm:mt-7 space-y-5">
            <div className="space-y-2.5">
              <VoiceTextarea
                id="onboarding-problem-input"
                label={t.problemInputLabel}
                value={problemStatement}
                onChange={(val) => {
                  setProblemStatement(val);
                  if (validationError) setValidationError(null);
                }}
                placeholder={t.problemInputPlaceholder}
                speechLang={speechLang}
                t={t}
                maxLength={500}
                rows={2}
              />

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#5C5852] dark:text-[#A8A298]">
                {EXAMPLE_PROMPTS.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => {
                      setProblemStatement(example);
                      if (validationError) setValidationError(null);
                    }}
                    className="underline decoration-[#D4CEC3] dark:decoration-[#3A3630] underline-offset-4 hover:text-[#1B5E43] dark:hover:text-[#34A874] transition-colors text-start"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <VoiceInput
                id="onboarding-name-input"
                label={t.nameInputLabel}
                value={displayName}
                onChange={setDisplayName}
                placeholder={t.nameInputPlaceholder}
                speechLang={speechLang}
                t={t}
                maxLength={80}
              />
            </div>

            {/* Age-Stage Selector */}
            <div className="space-y-2.5">
              <span className="block text-sm font-medium text-[#1C1B18] dark:text-[#F2EFE9]">
                {t.stageSelectorLabel}
              </span>
              <div
                role="radiogroup"
                aria-label={t.stageSelectorLabel}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
              >
                {STAGES.map((stage) => {
                  const selected = ageStage === stage;
                  const meta = getStageLabel(stage, t);
                  return (
                    <button
                      key={stage}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setAgeStage(stage)}
                      className={`min-h-[68px] text-start rounded-xl p-3.5 border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B5E43] dark:focus-visible:ring-[#34A874] ${
                        selected
                          ? 'bg-[#E8F1EC] dark:bg-[#172B22] border-[#1B5E43] dark:border-[#34A874] text-[#1C1B18] dark:text-[#F2EFE9]'
                          : 'bg-white dark:bg-[#1B1A17] border-[#E4DFD6] dark:border-[#2E2B26] text-[#1C1B18] dark:text-[#F2EFE9] hover:bg-[#EFECE6] dark:hover:bg-[#24221E]'
                      }`}
                    >
                      <div className="text-sm font-semibold whitespace-nowrap">{meta.title}</div>
                      <div className="text-xs text-[#5C5852] dark:text-[#A8A298] mt-1 leading-snug">
                        {meta.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {validationError && (
              <p
                role="alert"
                className="text-sm font-medium text-[#B42318] dark:text-[#F97066]"
              >
                {validationError}
              </p>
            )}

            {/* Maximum 2 action buttons here (3rd is stage selector above) */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-4">
              <button
                type="submit"
                className="min-h-[48px] px-7 py-3 rounded-xl bg-[#1B5E43] hover:bg-[#144833] dark:bg-[#34A874] dark:hover:bg-[#2B8D61] text-white dark:text-[#121210] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
              >
                <span>{t.enterWorkspaceCta}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {!userEmail && (
                <button
                  type="button"
                  onClick={onGoogleSync}
                  className="min-h-[48px] px-5 py-3 rounded-xl border border-[#E4DFD6] dark:border-[#2E2B26] bg-white dark:bg-[#1B1A17] hover:bg-[#EFECE6] dark:hover:bg-[#24221E] text-sm font-medium text-[#1C1B18] dark:text-[#F2EFE9] transition-colors whitespace-nowrap shrink-0"
                >
                  {t.continueWithGoogleCta}
                </button>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
