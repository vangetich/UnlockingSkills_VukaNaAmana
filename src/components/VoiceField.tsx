import React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useSpeechInput } from '../hooks/useSpeechInput';
import type { TranslationDictionary } from '../utils/i18n';

interface VoiceFieldBaseProps {
  id: string;
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  placeholder?: string;
  speechLang: string;
  t: TranslationDictionary;
  maxLength?: number;
  required?: boolean;
}

export const VoiceInput: React.FC<VoiceFieldBaseProps & { type?: 'text' | 'search' }> = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  speechLang,
  t,
  maxLength = 160,
  required = false,
  type = 'text',
}) => {
  const { isListening, unsupportedMessage, toggleListening } = useSpeechInput(
    speechLang,
    (transcript) => {
      const merged = value.trim() ? `${value.trim()} ${transcript}` : transcript;
      onChange(merged.slice(0, maxLength));
    }
  );

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-[#17191C] dark:text-[#F4F2EE]"
      >
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          id={id}
          type={type}
          value={value}
          maxLength={maxLength}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-[44px] rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] px-4 pe-12 py-2.5 text-sm text-[#17191C] dark:text-[#F4F2EE] placeholder:text-[#8A847A] dark:placeholder:text-[#787268] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B] transition-colors"
        />
        <button
          type="button"
          onClick={() => toggleListening(t.voiceUnsupportedNote)}
          aria-label={isListening ? `${t.voiceStopLabel}: ${label}` : `${t.voiceStartLabel}: ${label}`}
          aria-pressed={isListening}
          title={isListening ? t.voiceStopLabel : t.voiceStartLabel}
          className={`absolute end-1 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B] ${
            isListening
              ? 'bg-[#146C53] text-white dark:bg-[#2EB88B] dark:text-[#121315]'
              : 'text-[#575B62] dark:text-[#A3A7AE] hover:bg-[#F2EEE8] dark:hover:bg-[#22252A]'
          }`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
      </div>
      {isListening && (
        <p className="text-xs font-medium text-[#146C53] dark:text-[#2EB88B]">
          {t.voiceListeningLabel}
        </p>
      )}
      {unsupportedMessage && (
        <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">{unsupportedMessage}</p>
      )}
    </div>
  );
};

export const VoiceTextarea: React.FC<
  VoiceFieldBaseProps & { rows?: number }
> = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  speechLang,
  t,
  maxLength = 1000,
  required = false,
  rows = 4,
}) => {
  const { isListening, unsupportedMessage, toggleListening } = useSpeechInput(
    speechLang,
    (transcript) => {
      const merged = value.trim() ? `${value.trim()} ${transcript}` : transcript;
      onChange(merged.slice(0, maxLength));
    }
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <label
          htmlFor={id}
          className="block text-sm font-medium text-[#17191C] dark:text-[#F4F2EE]"
        >
          {label}
        </label>
        <button
          type="button"
          onClick={() => toggleListening(t.voiceUnsupportedNote)}
          aria-label={isListening ? `${t.voiceStopLabel}: ${label}` : `${t.voiceStartLabel}: ${label}`}
          aria-pressed={isListening}
          className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B] ${
            isListening
              ? 'bg-[#146C53] text-white dark:bg-[#2EB88B] dark:text-[#121315]'
              : 'bg-[#F2EEE8] dark:bg-[#22252A] text-[#17191C] dark:text-[#F4F2EE] hover:bg-[#E8E3DB] dark:hover:bg-[#2C3037]'
          }`}
        >
          {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          <span>{isListening ? t.voiceListeningLabel : t.voiceStartLabel}</span>
        </button>
      </div>
      <textarea
        id={id}
        rows={rows}
        value={value}
        maxLength={maxLength}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-4 text-sm sm:text-base leading-relaxed text-[#17191C] dark:text-[#F4F2EE] placeholder:text-[#8A847A] dark:placeholder:text-[#787268] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B] transition-colors resize-y"
      />
      {unsupportedMessage && (
        <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">{unsupportedMessage}</p>
      )}
    </div>
  );
};
