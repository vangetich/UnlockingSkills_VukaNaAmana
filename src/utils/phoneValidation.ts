export interface CountryPhoneSystem {
  code: string; // ISO-2 or 'OTHER'
  country: string;
  dialCode: string; // Numerals only (e.g., '254') or 'other'
  minLocalDigits: number;
  maxLocalDigits: number;
  exampleLocal: string;
  stripLeadingZero: boolean;
}

export const DEFAULT_COUNTRY_DIAL_CODE = '254';

export const COUNTRY_PHONE_SYSTEMS: CountryPhoneSystem[] = [
  {
    code: 'KE',
    country: 'Kenya',
    dialCode: '254',
    minLocalDigits: 9,
    maxLocalDigits: 9,
    exampleLocal: '712345678',
    stripLeadingZero: true,
  },
  {
    code: 'UG',
    country: 'Uganda',
    dialCode: '256',
    minLocalDigits: 9,
    maxLocalDigits: 9,
    exampleLocal: '772123456',
    stripLeadingZero: true,
  },
  {
    code: 'TZ',
    country: 'Tanzania',
    dialCode: '255',
    minLocalDigits: 9,
    maxLocalDigits: 9,
    exampleLocal: '712345678',
    stripLeadingZero: true,
  },
  {
    code: 'RW',
    country: 'Rwanda',
    dialCode: '250',
    minLocalDigits: 9,
    maxLocalDigits: 9,
    exampleLocal: '788123456',
    stripLeadingZero: true,
  },
  {
    code: 'ET',
    country: 'Ethiopia',
    dialCode: '251',
    minLocalDigits: 9,
    maxLocalDigits: 9,
    exampleLocal: '911234567',
    stripLeadingZero: true,
  },
  {
    code: 'SS',
    country: 'South Sudan',
    dialCode: '211',
    minLocalDigits: 9,
    maxLocalDigits: 9,
    exampleLocal: '912345678',
    stripLeadingZero: true,
  },
  {
    code: 'SO',
    country: 'Somalia',
    dialCode: '252',
    minLocalDigits: 8,
    maxLocalDigits: 9,
    exampleLocal: '615123456',
    stripLeadingZero: true,
  },
  {
    code: 'CD',
    country: 'DR Congo',
    dialCode: '243',
    minLocalDigits: 9,
    maxLocalDigits: 9,
    exampleLocal: '812345678',
    stripLeadingZero: true,
  },
  {
    code: 'SD',
    country: 'Sudan',
    dialCode: '249',
    minLocalDigits: 9,
    maxLocalDigits: 9,
    exampleLocal: '912345678',
    stripLeadingZero: true,
  },
  {
    code: 'BI',
    country: 'Burundi',
    dialCode: '257',
    minLocalDigits: 8,
    maxLocalDigits: 8,
    exampleLocal: '79123456',
    stripLeadingZero: false,
  },
  {
    code: 'JO',
    country: 'Jordan',
    dialCode: '962',
    minLocalDigits: 9,
    maxLocalDigits: 9,
    exampleLocal: '791234567',
    stripLeadingZero: true,
  },
  {
    code: 'LB',
    country: 'Lebanon',
    dialCode: '961',
    minLocalDigits: 8,
    maxLocalDigits: 8,
    exampleLocal: '71123456',
    stripLeadingZero: true,
  },
  {
    code: 'EG',
    country: 'Egypt',
    dialCode: '20',
    minLocalDigits: 10,
    maxLocalDigits: 10,
    exampleLocal: '1012345678',
    stripLeadingZero: true,
  },
  {
    code: 'NG',
    country: 'Nigeria',
    dialCode: '234',
    minLocalDigits: 10,
    maxLocalDigits: 10,
    exampleLocal: '8031234567',
    stripLeadingZero: true,
  },
  {
    code: 'GH',
    country: 'Ghana',
    dialCode: '233',
    minLocalDigits: 9,
    maxLocalDigits: 9,
    exampleLocal: '241234567',
    stripLeadingZero: true,
  },
  {
    code: 'ZA',
    country: 'South Africa',
    dialCode: '27',
    minLocalDigits: 9,
    maxLocalDigits: 9,
    exampleLocal: '821234567',
    stripLeadingZero: true,
  },
  {
    code: 'GB',
    country: 'United Kingdom',
    dialCode: '44',
    minLocalDigits: 10,
    maxLocalDigits: 10,
    exampleLocal: '7700900123',
    stripLeadingZero: true,
  },
  {
    code: 'US',
    country: 'United States / Canada',
    dialCode: '1',
    minLocalDigits: 10,
    maxLocalDigits: 10,
    exampleLocal: '4155550192',
    stripLeadingZero: false,
  },
  {
    code: 'DE',
    country: 'Germany',
    dialCode: '49',
    minLocalDigits: 10,
    maxLocalDigits: 11,
    exampleLocal: '15123456789',
    stripLeadingZero: true,
  },
  {
    code: 'FR',
    country: 'France',
    dialCode: '33',
    minLocalDigits: 9,
    maxLocalDigits: 9,
    exampleLocal: '612345678',
    stripLeadingZero: true,
  },
  {
    code: 'TR',
    country: 'Turkey',
    dialCode: '90',
    minLocalDigits: 10,
    maxLocalDigits: 10,
    exampleLocal: '5321234567',
    stripLeadingZero: true,
  },
  {
    code: 'PK',
    country: 'Pakistan',
    dialCode: '92',
    minLocalDigits: 10,
    maxLocalDigits: 10,
    exampleLocal: '3001234567',
    stripLeadingZero: true,
  },
  {
    code: 'AF',
    country: 'Afghanistan',
    dialCode: '93',
    minLocalDigits: 9,
    maxLocalDigits: 9,
    exampleLocal: '701234567',
    stripLeadingZero: true,
  },
  {
    code: 'CO',
    country: 'Colombia',
    dialCode: '57',
    minLocalDigits: 10,
    maxLocalDigits: 10,
    exampleLocal: '3101234567',
    stripLeadingZero: false,
  },
  {
    code: 'OTHER',
    country: 'Other Country (Full Code)',
    dialCode: 'other',
    minLocalDigits: 8,
    maxLocalDigits: 15,
    exampleLocal: '254712345678',
    stripLeadingZero: false,
  },
];

// Sorted longest dialCode first for unambiguous prefix matching (e.g. 254 before 20 or 1)
const KNOWN_SYSTEMS_BY_PREFIX_LENGTH = COUNTRY_PHONE_SYSTEMS.filter(
  (item) => item.dialCode !== 'other'
).sort((a, b) => b.dialCode.length - a.dialCode.length);

export function getCountryPhoneSystem(dialCode: string): CountryPhoneSystem {
  return (
    COUNTRY_PHONE_SYSTEMS.find((c) => c.dialCode === dialCode) ??
    COUNTRY_PHONE_SYSTEMS[0]
  );
}

export function formatDigitRequirement(system: CountryPhoneSystem): string {
  if (system.minLocalDigits === system.maxLocalDigits) {
    return `${system.minLocalDigits} digits`;
  }
  return `${system.minLocalDigits}–${system.maxLocalDigits} digits`;
}

export function detectCountryFromFullDigits(
  digitsOnly: string
): { system: CountryPhoneSystem; localDigits: string } | null {
  if (!/^\d+$/.test(digitsOnly)) return null;
  for (const sys of KNOWN_SYSTEMS_BY_PREFIX_LENGTH) {
    if (
      digitsOnly.startsWith(sys.dialCode) &&
      digitsOnly.length >= sys.dialCode.length + 1
    ) {
      return {
        system: sys,
        localDigits: digitsOnly.slice(sys.dialCode.length),
      };
    }
  }
  return null;
}

export type PhoneValidationStatus =
  | 'empty'
  | 'invalid_chars'
  | 'leading_zero'
  | 'too_short'
  | 'too_long'
  | 'valid';

export interface PhoneValidationResult {
  valid: boolean;
  status: PhoneValidationStatus;
  system: CountryPhoneSystem;
  localDigits: string;
  fullNumber: string;
  digitCount: number;
  minDigits: number;
  maxDigits: number;
  advisory: string;
}

/**
 * Validates a local mobile subscriber number under a selected country phone system
 * (e.g., Kenya 254 requires exactly 9 digits 0-9 after 254; advises clearly when
 * fewer than minDigits or more than maxDigits are entered).
 */
export function validateCountryMobileNumber(
  dialCode: string,
  rawLocalInput: string
): PhoneValidationResult {
  const system = getCountryPhoneSystem(dialCode);
  const trimmed = String(rawLocalInput || '').trim();
  const isOther = system.dialCode === 'other';
  const reqLabel = formatDigitRequirement(system);

  if (!trimmed) {
    return {
      valid: false,
      status: 'empty',
      system,
      localDigits: '',
      fullNumber: '',
      digitCount: 0,
      minDigits: system.minLocalDigits,
      maxDigits: system.maxLocalDigits,
      advisory: isOther
        ? 'Enter numerals 0–9 only including your country code (8–15 digits total, e.g., 254712345678).'
        : `Enter ${reqLabel} (0–9 only) for ${system.country} (${system.dialCode}), e.g., ${system.exampleLocal}.`,
    };
  }

  if (!/^\d+$/.test(trimmed)) {
    const clean = trimmed.replace(/\D/g, '');
    return {
      valid: false,
      status: 'invalid_chars',
      system,
      localDigits: clean,
      fullNumber: isOther ? clean : `${system.dialCode}${clean}`,
      digitCount: clean.length,
      minDigits: system.minLocalDigits,
      maxDigits: system.maxLocalDigits,
      advisory:
        'Please enter numerals only (digits 0–9) — no +, spaces, dashes, letters, or symbols.',
    };
  }

  if (!isOther && system.stripLeadingZero && trimmed.startsWith('0')) {
    return {
      valid: false,
      status: 'leading_zero',
      system,
      localDigits: trimmed,
      fullNumber: `${system.dialCode}${trimmed}`,
      digitCount: trimmed.length,
      minDigits: system.minLocalDigits,
      maxDigits: system.maxLocalDigits,
      advisory: `Drop the leading 0 after country code ${system.dialCode} — ${system.country} (${system.dialCode}) uses ${reqLabel} (e.g., ${system.exampleLocal}).`,
    };
  }

  const len = trimmed.length;
  const fullNumber = isOther ? trimmed : `${system.dialCode}${trimmed}`;

  if (len < system.minLocalDigits) {
    const missing = system.minLocalDigits - len;
    return {
      valid: false,
      status: 'too_short',
      system,
      localDigits: trimmed,
      fullNumber,
      digitCount: len,
      minDigits: system.minLocalDigits,
      maxDigits: system.maxLocalDigits,
      advisory: isOther
        ? `Too short: entered ${len} of at least ${system.minLocalDigits} digits (${missing} more needed including country code).`
        : `Too short for ${system.country} (${system.dialCode}): mobile numbers require ${reqLabel} after ${system.dialCode} (${len}/${system.maxLocalDigits} entered — ${missing} more needed).`,
    };
  }

  if (len > system.maxLocalDigits) {
    const extra = len - system.maxLocalDigits;
    return {
      valid: false,
      status: 'too_long',
      system,
      localDigits: trimmed,
      fullNumber,
      digitCount: len,
      minDigits: system.minLocalDigits,
      maxDigits: system.maxLocalDigits,
      advisory: isOther
        ? `Too many digits: maximum ${system.maxLocalDigits} digits allowed (${len} entered — remove ${extra}).`
        : `Too many digits for ${system.country} (${system.dialCode}): maximum ${system.maxLocalDigits} mobile digits allowed after ${system.dialCode} (${len}/${system.maxLocalDigits} entered — remove ${extra}).`,
    };
  }

  return {
    valid: true,
    status: 'valid',
    system,
    localDigits: trimmed,
    fullNumber,
    digitCount: len,
    minDigits: system.minLocalDigits,
    maxDigits: system.maxLocalDigits,
    advisory: isOther
      ? `Valid international mobile format · ${len} digits · ${fullNumber}`
      : `Valid ${system.country} (${system.dialCode}) mobile number · ${len}/${system.maxLocalDigits} digits · Full: ${fullNumber}`,
  };
}

/**
 * Server- and client-side full international mobile validator (numerals 0-9 only).
 * Automatically matches known country dial codes (such as Kenya 254 -> 9 local digits,
 * Uganda 256 -> 9, Nigeria 234 -> 10, Burundi 257 -> 8, UK 44 -> 10, US 1 -> 10)
 * and enforces exact country digit length bounds with clear advisories.
 */
export function validateFullInternationalMobile(
  rawIdentifier: string,
  explicitDialCode?: string
): PhoneValidationResult {
  const trimmed = String(rawIdentifier || '').trim();

  if (!trimmed) {
    const fallbackSys = getCountryPhoneSystem(
      explicitDialCode || DEFAULT_COUNTRY_DIAL_CODE
    );
    return validateCountryMobileNumber(fallbackSys.dialCode, '');
  }

  // Strict numerals-only enforcement (0-9 only — rejects +, -, spaces, letters, symbols)
  if (!/^\d+$/.test(trimmed)) {
    const fallbackSys = getCountryPhoneSystem(
      explicitDialCode || DEFAULT_COUNTRY_DIAL_CODE
    );
    return {
      valid: false,
      status: 'invalid_chars',
      system: fallbackSys,
      localDigits: trimmed.replace(/\D/g, ''),
      fullNumber: trimmed.replace(/\D/g, ''),
      digitCount: trimmed.replace(/\D/g, '').length,
      minDigits: fallbackSys.minLocalDigits,
      maxDigits: fallbackSys.maxLocalDigits,
      advisory:
        'Please enter numerals only (digits 0–9 with country code, e.g., 254712345678) — no +, spaces, letters, or symbols.',
    };
  }

  // If caller explicitly passed a known dialCode, validate against that country system
  if (explicitDialCode && explicitDialCode !== 'other') {
    const matched = COUNTRY_PHONE_SYSTEMS.find((c) => c.dialCode === explicitDialCode);
    if (matched) {
      const localDigits = trimmed.startsWith(matched.dialCode)
        ? trimmed.slice(matched.dialCode.length)
        : trimmed;
      return validateCountryMobileNumber(matched.dialCode, localDigits);
    }
  }

  // Auto-detect country system by prefix (e.g., 254 -> Kenya 9 digits)
  const detected = detectCountryFromFullDigits(trimmed);
  if (detected) {
    return validateCountryMobileNumber(detected.system.dialCode, detected.localDigits);
  }

  // Fallback for unrecognized international country codes (ITU E.164: 8-15 total digits)
  return validateCountryMobileNumber('other', trimmed);
}
