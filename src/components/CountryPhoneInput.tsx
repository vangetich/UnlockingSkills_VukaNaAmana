import React, { useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  COUNTRY_PHONE_SYSTEMS,
  detectCountryFromFullDigits,
  formatDigitRequirement,
  getCountryPhoneSystem,
  validateCountryMobileNumber,
} from '../utils/phoneValidation';

interface CountryPhoneInputProps {
  id?: string;
  label: string;
  dialCode: string;
  localDigits: string;
  onChangeDialCode: (nextDialCode: string) => void;
  onChangeLocalDigits: (nextLocalDigits: string) => void;
  required?: boolean;
}

/**
 * Reusable app-wide country-aware mobile phone input for all login popups,
 * 2FA gates, and verification/authorization session forms.
 *
 * Enforces:
 * - Strictly 0-9 numerals only (blocks letters, +, -, spaces, symbols).
 * - Country-specific max digits (e.g., max 9 local digits for Kenya 254).
 * - Immediate, calm live advisories when fewer than minDigits, more than maxDigits,
 *   or when a leading 0 is entered after the country code.
 */
export const CountryPhoneInput: React.FC<CountryPhoneInputProps> = ({
  id = 'talent-auth-identifier',
  label,
  dialCode,
  localDigits,
  onChangeDialCode,
  onChangeLocalDigits,
  required = true,
}) => {
  const [overflowNotice, setOverflowNotice] = useState<string | null>(null);
  const system = getCountryPhoneSystem(dialCode);
  const isOther = system.dialCode === 'other';
  const validation = validateCountryMobileNumber(dialCode, localDigits);
  const reqLabel = formatDigitRequirement(system);

  const applySanitizedInput = (rawText: string) => {
    const digitsOnly = rawText.replace(/\D/g, '');
    const hadNonDigits = rawText.length > 0 && /[^0-9]/.test(rawText);

    // If user pasted or typed a full international number (e.g., 254712345678 or +254 712 345 678),
    // auto-detect the country prefix and extract local subscriber digits seamlessly.
    if (
      !isOther &&
      digitsOnly.length > system.maxLocalDigits &&
      digitsOnly.startsWith(system.dialCode)
    ) {
      const strippedLocal = digitsOnly.slice(system.dialCode.length);
      if (strippedLocal.length > system.maxLocalDigits) {
        onChangeLocalDigits(strippedLocal.slice(0, system.maxLocalDigits));
        setOverflowNotice(
          `Too many digits for ${system.country} (${system.dialCode}): maximum ${system.maxLocalDigits} mobile digits after ${system.dialCode} — extra digits were trimmed.`
        );
      } else {
        onChangeLocalDigits(strippedLocal);
        setOverflowNotice(null);
      }
      return;
    }

    if (digitsOnly.length > system.maxLocalDigits) {
      const detected = detectCountryFromFullDigits(digitsOnly);
      if (
        detected &&
        detected.localDigits.length >= detected.system.minLocalDigits &&
        detected.localDigits.length <= detected.system.maxLocalDigits
      ) {
        onChangeDialCode(detected.system.dialCode);
        onChangeLocalDigits(detected.localDigits);
        setOverflowNotice(null);
        return;
      }

      if (
        !isOther &&
        system.stripLeadingZero &&
        digitsOnly.startsWith('0') &&
        digitsOnly.length === system.maxLocalDigits + 1
      ) {
        onChangeLocalDigits(digitsOnly.slice(0, system.maxLocalDigits));
        setOverflowNotice(
          `Drop the leading 0 after country code ${system.dialCode} — ${system.country} (${system.dialCode}) uses ${reqLabel} (e.g., ${system.exampleLocal}).`
        );
        return;
      }

      const trimmedToMax = digitsOnly.slice(0, system.maxLocalDigits);
      onChangeLocalDigits(trimmedToMax);
      setOverflowNotice(
        isOther
          ? `Too many digits: maximum ${system.maxLocalDigits} digits allowed — extra digits were not added.`
          : `Too many digits for ${system.country} (${system.dialCode}): maximum ${system.maxLocalDigits} digits allowed after ${system.dialCode} (e.g., ${system.exampleLocal}) — extra digits were not added.`
      );
      return;
    }

    onChangeLocalDigits(digitsOnly);
    if (hadNonDigits) {
      setOverflowNotice(
        'Only digits 0–9 are allowed — +, spaces, dashes, and letters were removed.'
      );
    } else {
      setOverflowNotice(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (
      e.key === 'Backspace' ||
      e.key === 'Delete' ||
      e.key === 'Tab' ||
      e.key === 'Enter' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'Home' ||
      e.key === 'End'
    ) {
      return;
    }

    // Block non-digit characters immediately with clear guidance
    if (e.key.length === 1 && !/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      setOverflowNotice(
        'Only numerals 0–9 are accepted — no +, spaces, letters, or symbols.'
      );
      return;
    }

    // If user tries to type beyond country's max local digits (and no selection is being replaced),
    // prevent overflow and advise immediately per their country phone system!
    if (/^[0-9]$/.test(e.key)) {
      const inputEl = e.currentTarget;
      const hasTextSelection =
        inputEl.selectionStart !== null &&
        inputEl.selectionEnd !== null &&
        inputEl.selectionEnd > inputEl.selectionStart;

      if (!hasTextSelection && localDigits.length >= system.maxLocalDigits) {
        e.preventDefault();
        setOverflowNotice(
          isOther
            ? `Too many digits: maximum ${system.maxLocalDigits} digits allowed.`
            : `Too many digits for ${system.country} (${system.dialCode}): maximum ${system.maxLocalDigits} mobile digits allowed after ${system.dialCode} (currently ${localDigits.length}/${system.maxLocalDigits}).`
        );
      } else {
        setOverflowNotice(null);
      }
    }
  };

  const handleCountryChange = (nextDialCode: string) => {
    const nextSys = getCountryPhoneSystem(nextDialCode);
    onChangeDialCode(nextDialCode);
    if (localDigits.length > nextSys.maxLocalDigits) {
      onChangeLocalDigits(localDigits.slice(0, nextSys.maxLocalDigits));
      setOverflowNotice(
        `Adjusted to ${nextSys.country} (${nextSys.dialCode}) maximum of ${nextSys.maxLocalDigits} digits.`
      );
    } else {
      setOverflowNotice(null);
    }
  };

  const showWarning =
    Boolean(overflowNotice) ||
    validation.status === 'too_short' ||
    validation.status === 'too_long' ||
    validation.status === 'leading_zero' ||
    validation.status === 'invalid_chars';

  const advisoryText = overflowNotice || validation.advisory;

  return (
    <div className="space-y-1.5" data-testid="country-phone-input-group">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]"
        >
          {label}
        </label>
        <span
          data-testid="auth-phone-digit-counter"
          className={`font-mono-tabular tabular-nums text-[11px] font-semibold ${
            validation.valid
              ? 'text-[#146C53] dark:text-[#2EB88B]'
              : showWarning
                ? 'text-[#C4622D] dark:text-[#E07B46]'
                : 'text-[#575B62] dark:text-[#A3A7AE]'
          }`}
        >
          {localDigits.length}/{system.maxLocalDigits} digits
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        {/* Country Phone Number System Selector */}
        <select
          aria-label="Country phone code system"
          data-testid="auth-phone-country-select"
          value={dialCode}
          onChange={(e) => handleCountryChange(e.target.value)}
          className="sm:w-[192px] shrink-0 min-h-[44px] rounded-xl bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3 py-2 text-xs font-medium text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B]"
        >
          {COUNTRY_PHONE_SYSTEMS.map((c) => (
            <option key={c.code} value={c.dialCode}>
              {c.dialCode === 'other'
                ? c.country
                : `${c.country} (${c.dialCode} · ${formatDigitRequirement(c)})`}
            </option>
          ))}
        </select>

        {/* Strict 0-9 Mobile Number Input */}
        <div className="relative flex-1 min-w-0 flex items-center">
          {!isOther && (
            <span
              aria-hidden="true"
              className="absolute start-3 text-xs font-mono-tabular font-semibold text-[#575B62] dark:text-[#A3A7AE] select-none pointer-events-none"
            >
              {system.dialCode}
            </span>
          )}
          <input
            id={id}
            data-testid="auth-phone-local-input"
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={system.maxLocalDigits}
            autoComplete="tel-national"
            required={required}
            aria-invalid={showWarning && localDigits.length > 0 ? true : undefined}
            aria-describedby={`${id}-advisory`}
            value={localDigits}
            onChange={(e) => applySanitizedInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={(e) => {
              e.preventDefault();
              applySanitizedInput(e.clipboardData.getData('text'));
            }}
            placeholder={system.exampleLocal}
            className={`w-full min-h-[44px] rounded-xl bg-white dark:bg-[#121315] border py-2.5 pe-3.5 text-sm font-mono-tabular text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 transition-colors ${
              !isOther ? 'ps-12' : 'ps-3.5'
            } ${
              validation.valid && !overflowNotice
                ? 'border-[#146C53]/60 dark:border-[#2EB88B]/60 focus-visible:ring-[#146C53]'
                : showWarning
                  ? 'border-[#C4622D]/60 dark:border-[#E07B46]/65 focus-visible:ring-[#C4622D]'
                  : 'border-[#E8E3DB] dark:border-[#2C3037] focus-visible:ring-[#146C53]'
            }`}
          />
        </div>
      </div>

      {/* Live Country-Aware Advisory */}
      <div
        id={`${id}-advisory`}
        role={showWarning ? 'alert' : 'status'}
        aria-live="polite"
        data-testid="auth-phone-advisory"
        data-phone-status={overflowNotice ? 'too_long' : validation.status}
        className={`flex items-start gap-1.5 text-[11px] leading-relaxed ${
          validation.valid && !overflowNotice
            ? 'text-[#146C53] dark:text-[#2EB88B] font-medium'
            : showWarning
              ? 'text-[#B44E1E] dark:text-[#F59E6C] font-medium'
              : 'text-[#575B62] dark:text-[#A3A7AE]'
        }`}
      >
        {validation.valid && !overflowNotice ? (
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
        ) : showWarning ? (
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
        ) : null}
        <span>
          {advisoryText}
          {!showWarning && !validation.valid && !isOther
            ? ` Digits 0–9 only (no +, spaces, or leading 0 · ${reqLabel}).`
            : ''}
        </span>
      </div>
    </div>
  );
};
