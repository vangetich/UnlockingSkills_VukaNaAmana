import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ClipboardPaste,
  Clock,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import type {
  ActiveAuthSession,
  AgeStage,
  PartnerMemberRole,
  PortalRealm,
  TalentAuthChannel,
  WorkspaceTab,
} from '../types/kora';

interface DualDoorAuthModalProps {
  isOpen: boolean;
  initialDoor: PortalRealm;
  ageStage: AgeStage;
  defaultDisplayName?: string;
  activeSession: ActiveAuthSession | null;
  pendingRedirectTab?: WorkspaceTab | null;
  onClose: () => void;
  onAuthenticated: (session: ActiveAuthSession, selectedAgeStage?: AgeStage) => void;
}

const STAGE_REDIRECT_LABELS: Record<WorkspaceTab, string> = {
  verify: 'Stage 1: Verify',
  unlock: 'Stage 2: Unlock',
  solve: 'Stage 3: Solve',
  pulse: 'Stage 4: Pulse',
  cleared: 'Stage 5: Cleared',
};

type BuilderAuthMode = 'standard_2fa' | 'pin_signup' | 'pin_login';

interface PinEnrollmentCard {
  enrollmentId: string;
  builderId: string;
  pin: string;
  recoveryPhrase: string;
  displayName: string;
  ageStage: AgeStage;
}

const AGE_STAGE_OPTIONS: Array<{ value: AgeStage; label: string }> = [
  { value: '15-17', label: '15–17' },
  { value: '18-29', label: '18–29' },
  { value: '30-45', label: '30–45' },
  { value: '46+', label: '46+' },
];

interface SixDigitInputProps {
  idPrefix: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  masked?: boolean;
  ariaLabelPrefix: string;
  pasteButtonLabel?: string;
}

const SixDigitInput: React.FC<SixDigitInputProps> = ({
  idPrefix,
  value,
  onChange,
  disabled = false,
  masked = false,
  ariaLabelPrefix,
  pasteButtonLabel = 'Paste Code',
}) => {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [pasteNotice, setPasteNotice] = useState<string | null>(null);
  const digits = Array.from({ length: 6 }, (_, idx) => value[idx] || '');

  const handleDigitChange = (index: number, raw: string) => {
    const clean = raw.replace(/\D/g, '');
    if (!clean) {
      const next = digits.slice();
      next[index] = '';
      onChange(next.join(''));
      return;
    }

    if (clean.length > 1) {
      const pasted = clean.slice(0, 6);
      onChange(pasted);
      const nextFocus = Math.min(pasted.length, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    const next = digits.slice();
    next[index] = clean[0];
    onChange(next.join(''));
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.ctrlKey || e.metaKey || e.altKey) {
      return;
    }
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = digits.slice();
        next[index] = '';
        onChange(next.join(''));
      } else if (index > 0) {
        const next = digits.slice();
        next[index - 1] = '';
        onChange(next.join(''));
        inputRefs.current[index - 1]?.focus();
      }
      e.preventDefault();
      return;
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
      return;
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
      return;
    }
    if (
      e.key === 'Tab' ||
      e.key === 'Enter' ||
      e.key === 'Delete' ||
      e.key === 'Home' ||
      e.key === 'End' ||
      /^[0-9]$/.test(e.key)
    ) {
      return;
    }
    // Strictly block letters, +, -, spaces, and special symbols
    if (e.key.length === 1) {
      e.preventDefault();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted);
    setPasteNotice(`Filled ${pasted.length} digit${pasted.length === 1 ? '' : 's'} from clipboard.`);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handlePasteButtonClick = async () => {
    setPasteNotice(null);
    if (typeof navigator === 'undefined' || !navigator.clipboard?.readText) {
      inputRefs.current[0]?.focus();
      setPasteNotice('Tap box 1 and press Ctrl+V or Cmd+V to paste your 6-digit code.');
      return;
    }
    try {
      const clipText = await navigator.clipboard.readText();
      const extracted = clipText.replace(/\D/g, '').slice(0, 6);
      if (!extracted) {
        inputRefs.current[0]?.focus();
        setPasteNotice('No 6-digit number found in clipboard. Copy your code first or type it below.');
        return;
      }
      onChange(extracted);
      setPasteNotice(`Pasted ${extracted.length} digit${extracted.length === 1 ? '' : 's'} cleanly.`);
      inputRefs.current[Math.min(extracted.length, 5)]?.focus();
    } catch {
      inputRefs.current[0]?.focus();
      setPasteNotice('Browser blocked clipboard read — press Ctrl+V or Cmd+V directly in box 1.');
    }
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-6 gap-2 sm:gap-2.5" role="group" aria-label={ariaLabelPrefix}>
        {digits.map((digit, idx) => (
          <input
            key={`${idPrefix}-${idx}`}
            ref={(el) => {
              inputRefs.current[idx] = el;
            }}
            id={idx === 0 ? `${idPrefix}-0` : undefined}
            name={idx === 0 ? `${idPrefix}-code` : undefined}
            data-testid={`${idPrefix}-digit-${idx}`}
            type={masked ? 'password' : 'text'}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={idx === 0 ? 'one-time-code' : 'off'}
            maxLength={6}
            disabled={disabled}
            value={digit}
            aria-label={`${ariaLabelPrefix} digit ${idx + 1} of 6`}
            onChange={(e) => handleDigitChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.currentTarget.select()}
            className="h-12 sm:h-[52px] w-full rounded-xl bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] text-center font-mono-tabular text-lg sm:text-xl font-semibold text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus:border-[#146C53] dark:focus:border-[#2EB88B] focus-visible:ring-2 focus-visible:ring-[#146C53]/40 transition-colors disabled:opacity-50"
          />
        ))}
      </div>

      {/* WCAG 3.3.8 Zero Memory / Transcription Trap helper */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
          Numerals only (0–9) · Supports full 6-digit paste &amp; password managers.
        </span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => void handlePasteButtonClick()}
          data-testid={`${idPrefix}-paste-btn`}
          className="min-h-[36px] px-3 py-1 rounded-lg border border-[#146C53]/35 dark:border-[#2EB88B]/40 bg-[#E7F3EE]/70 dark:bg-[#142B24]/70 hover:bg-[#D5EBE2] dark:hover:bg-[#1C3B31] text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
        >
          <ClipboardPaste className="w-3.5 h-3.5 shrink-0" />
          <span>{pasteButtonLabel}</span>
        </button>
      </div>

      {pasteNotice && (
        <p
          role="status"
          aria-live="polite"
          className="text-[11px] font-medium text-[#146C53] dark:text-[#5EEAD4]"
        >
          {pasteNotice}
        </p>
      )}
    </div>
  );
};

export const DualDoorAuthModal: React.FC<DualDoorAuthModalProps> = ({
  isOpen,
  initialDoor,
  ageStage,
  defaultDisplayName = '',
  activeSession,
  pendingRedirectTab = null,
  onClose,
  onAuthenticated,
}) => {
  const [door, setDoor] = useState<PortalRealm>(initialDoor);
  const [builderMode, setBuilderMode] = useState<BuilderAuthMode>('standard_2fa');
  const [selectedAgeStage, setSelectedAgeStage] = useState<AgeStage>(ageStage);

  // Path A: Standard 2FA (Phone / WhatsApp / Email)
  const [talentChannel, setTalentChannel] = useState<TalentAuthChannel>('whatsapp');
  const [talentIdentifier, setTalentIdentifier] = useState('');
  const [talentName, setTalentName] = useState(
    defaultDisplayName && defaultDisplayName !== 'Practitioner' ? defaultDisplayName : ''
  );

  // Path B: No-Phone Dedicated Crossing PIN
  const [pinAlias, setPinAlias] = useState(
    defaultDisplayName && defaultDisplayName !== 'Practitioner' ? defaultDisplayName : ''
  );
  const [pinEnrollment, setPinEnrollment] = useState<PinEnrollmentCard | null>(null);
  const [showGeneratedPin, setShowGeneratedPin] = useState(true);
  const [pinCopied, setPinCopied] = useState(false);
  const [pinConfirmDigits, setPinConfirmDigits] = useState('');
  const [returningPinId, setReturningPinId] = useState('');
  const [returningPinDigits, setReturningPinDigits] = useState('');

  // Partner Door state
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerOrgName, setPartnerOrgName] = useState('');
  const [partnerRole, setPartnerRole] = useState<PartnerMemberRole>('hiring_lead');

  // Shared 2FA OTP / Security state
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [maskedTarget, setMaskedTarget] = useState<string>('');
  const [sandboxPreviewCode, setSandboxPreviewCode] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [trustedDevice, setTrustedDevice] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mutualConsentAccepted, setMutualConsentAccepted] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setDoor(initialDoor);
      setBuilderMode('standard_2fa');
      setSelectedAgeStage(ageStage);
      setChallengeId(null);
      setMaskedTarget('');
      setSandboxPreviewCode(null);
      setVerificationCode('');
      setResendCooldown(0);
      setLockoutSeconds(0);
      setPinEnrollment(null);
      setPinConfirmDigits('');
      setReturningPinDigits('');
      setPinCopied(false);
      setShowGeneratedPin(true);
      setErrorMessage(null);
      setMutualConsentAccepted(true);
    }
  }, [isOpen, initialDoor, ageStage]);

  // Escape-to-close keyboard support
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  // 60-second resend countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  // Brute-force lockout cooldown timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setLockoutSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [lockoutSeconds]);

  const resetTransientState = () => {
    setChallengeId(null);
    setMaskedTarget('');
    setSandboxPreviewCode(null);
    setVerificationCode('');
    setResendCooldown(0);
    setLockoutSeconds(0);
    setPinEnrollment(null);
    setPinConfirmDigits('');
    setReturningPinDigits('');
    setPinCopied(false);
    setErrorMessage(null);
  };

  const handleSwitchDoor = (nextDoor: PortalRealm) => {
    setDoor(nextDoor);
    setBuilderMode('standard_2fa');
    resetTransientState();
    setMutualConsentAccepted(true);
  };

  const handleSwitchBuilderMode = (nextMode: BuilderAuthMode) => {
    setBuilderMode(nextMode);
    resetTransientState();
  };

  const authHeaders = (extra?: Record<string, string>) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'VukaNaAmana',
      ...(extra || {}),
    };
    if (activeSession?.token) {
      headers.Authorization = `Bearer ${activeSession.token}`;
    }
    return headers;
  };

  const dispatchOtpRequest = async () => {
    setErrorMessage(null);

    if (door === 'talent' && !mutualConsentAccepted) {
      setErrorMessage(
        'Please confirm the privacy & mutual consent accord before continuing into the Builder Sanctuary.'
      );
      return;
    }

    if (door === 'talent' && (talentChannel === 'whatsapp' || talentChannel === 'phone')) {
      const trimmedPhone = talentIdentifier.trim();
      if (!/^\d{8,15}$/.test(trimmedPhone)) {
        setErrorMessage(
          'Please enter numerals only (8–15 digits including country code, e.g., 254712345678) — no +, spaces, letters, or symbols.'
        );
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const endpoint =
        door === 'talent' ? '/api/auth/talent/request-code' : '/api/auth/partner/request-code';
      const payload =
        door === 'talent'
          ? {
              channel: talentChannel,
              identifier:
                talentChannel === 'email'
                  ? talentIdentifier.trim()
                  : talentIdentifier.replace(/\D/g, '').slice(0, 15),
              displayName: talentName,
              ageStage: selectedAgeStage,
            }
          : {
              workEmail: partnerEmail,
              organizationName: partnerOrgName,
              memberRole: partnerRole,
            };

      const res = await fetch(endpoint, {
        method: 'POST',
        credentials: 'same-origin',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        error?: string;
        challengeId?: string;
        maskedTarget?: string;
        maskedEmail?: string;
        previewCode?: string;
        retryAfterSeconds?: number;
      };

      if (res.status === 429 && data.retryAfterSeconds) {
        setLockoutSeconds(data.retryAfterSeconds);
      }

      if (!res.ok || !data.challengeId) {
        throw new Error(
          data.error || 'Could not generate a verification code. Please check your details.'
        );
      }

      setChallengeId(data.challengeId);
      setMaskedTarget(data.maskedTarget || data.maskedEmail || '');
      setSandboxPreviewCode(data.previewCode || null);
      setVerificationCode('');
      setResendCooldown(60);
      setLockoutSeconds(0);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to send verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    await dispatchOtpRequest();
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeId || lockoutSeconds > 0) return;
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const endpoint = door === 'talent' ? '/api/auth/talent/verify' : '/api/auth/partner/verify';
      const res = await fetch(endpoint, {
        method: 'POST',
        credentials: 'same-origin',
        headers: authHeaders(),
        body: JSON.stringify({
          challengeId,
          code: verificationCode.trim(),
          trustedDevice,
        }),
      });
      const data = (await res.json()) as ActiveAuthSession & {
        error?: string;
        authenticated?: boolean;
        lockedOut?: boolean;
        retryAfterSeconds?: number;
      };

      if (res.status === 429 && data.retryAfterSeconds) {
        setLockoutSeconds(data.retryAfterSeconds);
      }

      if (!res.ok || !data.authenticated || !data.token) {
        throw new Error(data.error || 'Verification failed. Please double-check your 6-digit code.');
      }

      onAuthenticated(
        {
          realm: data.realm,
          sessionCookieName: data.sessionCookieName,
          token: data.token,
          claims: data.claims,
        } as ActiveAuthSession,
        door === 'talent' ? selectedAgeStage : undefined
      );
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to verify code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestDedicatedPin = async () => {
    setErrorMessage(null);
    if (!mutualConsentAccepted) {
      setErrorMessage(
        'Please confirm the privacy & mutual consent accord before generating your Dedicated PIN.'
      );
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/talent/pin/generate', {
        method: 'POST',
        credentials: 'same-origin',
        headers: authHeaders(),
        body: JSON.stringify({
          displayName: pinAlias.trim(),
          ageStage: selectedAgeStage,
        }),
      });
      const data = (await res.json()) as Partial<PinEnrollmentCard> & {
        error?: string;
        retryAfterSeconds?: number;
      };

      if (res.status === 429 && data.retryAfterSeconds) {
        setLockoutSeconds(data.retryAfterSeconds);
      }

      if (!res.ok || !data.enrollmentId || !data.builderId || !data.pin || !data.recoveryPhrase) {
        throw new Error(data.error || 'Could not generate your Dedicated Crossing PIN.');
      }

      setPinEnrollment({
        enrollmentId: data.enrollmentId,
        builderId: data.builderId,
        pin: data.pin,
        recoveryPhrase: data.recoveryPhrase,
        displayName: data.displayName || pinAlias.trim(),
        ageStage: (data.ageStage as AgeStage) || selectedAgeStage,
      });
      setPinConfirmDigits('');
      setPinCopied(false);
      setShowGeneratedPin(true);
      setLockoutSeconds(0);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to generate Dedicated PIN.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateDedicatedPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await requestDedicatedPin();
  };

  const handleCopyPinCard = async () => {
    if (!pinEnrollment) return;
    const cardText = [
      'Vuka na Amana — Personal Crossing PIN Card',
      `Builder Name / Alias: ${pinEnrollment.displayName}`,
      `Builder ID: ${pinEnrollment.builderId}`,
      `6-Digit Crossing PIN: ${pinEnrollment.pin}`,
      `3-Word Recovery Phrase: ${pinEnrollment.recoveryPhrase}`,
      'Keep this card private. Vuka na Amana never stores your PIN in plaintext.',
    ].join('\n');
    try {
      await navigator.clipboard.writeText(cardText);
      setPinCopied(true);
      window.setTimeout(() => setPinCopied(false), 3000);
    } catch {
      setPinCopied(true);
      window.setTimeout(() => setPinCopied(false), 3000);
    }
  };

  const handleConfirmDedicatedPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinEnrollment || lockoutSeconds > 0) return;
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/talent/pin/confirm', {
        method: 'POST',
        credentials: 'same-origin',
        headers: authHeaders(),
        body: JSON.stringify({
          enrollmentId: pinEnrollment.enrollmentId,
          pin: pinConfirmDigits.trim(),
          trustedDevice,
        }),
      });
      const data = (await res.json()) as ActiveAuthSession & {
        error?: string;
        authenticated?: boolean;
        retryAfterSeconds?: number;
      };

      if (res.status === 429 && data.retryAfterSeconds) {
        setLockoutSeconds(data.retryAfterSeconds);
      }

      if (!res.ok || !data.authenticated || !data.token) {
        throw new Error(data.error || 'Could not confirm your Dedicated PIN.');
      }

      onAuthenticated(
        {
          realm: data.realm,
          sessionCookieName: data.sessionCookieName,
          token: data.token,
          claims: data.claims,
        } as ActiveAuthSession,
        selectedAgeStage
      );
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to confirm Dedicated PIN.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturningPinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;
    setErrorMessage(null);
    if (!mutualConsentAccepted) {
      setErrorMessage(
        'Please confirm the privacy & mutual consent accord before entering the Builder Sanctuary.'
      );
      return;
    }
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/talent/pin/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: authHeaders(),
        body: JSON.stringify({
          identifier: returningPinId.trim(),
          pin: returningPinDigits.trim(),
          trustedDevice,
        }),
      });
      const data = (await res.json()) as ActiveAuthSession & {
        error?: string;
        authenticated?: boolean;
        retryAfterSeconds?: number;
      };

      if (res.status === 429 && data.retryAfterSeconds) {
        setLockoutSeconds(data.retryAfterSeconds);
      }

      if (!res.ok || !data.authenticated || !data.token) {
        throw new Error(
          data.error || 'Builder ID/Alias or 6-Digit PIN did not match. Please try again.'
        );
      }

      onAuthenticated(
        {
          realm: data.realm,
          sessionCookieName: data.sessionCookieName,
          token: data.token,
          claims: data.claims,
        } as ActiveAuthSession,
        selectedAgeStage
      );
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Dedicated PIN sign-in failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoAccess = async () => {
    setErrorMessage(null);
    if (door === 'talent' && !mutualConsentAccepted) {
      setErrorMessage(
        'Mutual consent authorization is required to access the sovereign Builder Sanctuary.'
      );
      return;
    }
    setIsSubmitting(true);

    try {
      const endpoint =
        door === 'talent' ? '/api/auth/talent/validate-switch' : '/api/auth/partner/demo';
      const payload =
        door === 'talent'
          ? {
              displayName: talentName || pinAlias || 'Amina Hassan',
              ageStage: selectedAgeStage,
              mutualConsent: true,
            }
          : { memberRole: partnerRole };

      const res = await fetch(endpoint, {
        method: 'POST',
        credentials: 'same-origin',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as ActiveAuthSession & {
        error?: string;
        authenticated?: boolean;
        allowed?: boolean;
      };

      if (!res.ok || (!data.authenticated && !data.allowed) || !data.token) {
        throw new Error(data.error || 'Demo session could not be initialized.');
      }

      onAuthenticated(
        {
          realm: data.realm,
          sessionCookieName: data.sessionCookieName,
          token: data.token,
          claims: data.claims,
        } as ActiveAuthSession,
        door === 'talent' ? selectedAgeStage : undefined
      );
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Demo access failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPartner = door === 'partner';

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dual-door-auth-title"
          data-testid={`dual-door-modal-${door}`}
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 sm:p-6 pt-12 sm:pt-16 bg-[#17191C]/60 backdrop-blur-xs overflow-y-auto no-scrollbar"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            className="relative w-full max-w-lg sm:max-w-xl max-h-[88vh] flex flex-col rounded-2xl bg-[#FAF8F5] dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] shadow-2xl overflow-hidden my-2 sm:my-auto"
          >
            {/* Top accent hairline */}
            <div
              className={`h-1 w-full shrink-0 ${
                isPartner
                  ? 'bg-gradient-to-r from-[#146C53] via-[#1C8567] to-[#C4622D]'
                  : 'bg-gradient-to-r from-[#146C53] via-[#2EB88B] to-[#C4622D]'
              }`}
            />

            <div className="p-5 sm:p-7 space-y-5 overflow-y-auto flex-1 no-scrollbar">
              {/* Brand lockup + close */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src="/bridge.jpeg"
                    alt="Vuka na Amana Bridge Logo"
                    className="h-7 w-auto object-contain rounded-md shrink-0 border border-[#E8E3DB] dark:border-[#2C3037]"
                  />
                  <div className="leading-tight">
                    <p className="font-display text-base font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                      Vuka na Amana
                    </p>
                    <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#575B62] dark:text-[#A3A7AE]">
                      {isPartner ? 'Partner Auth Realm · vna-partner' : 'Crossing Over · vna-talent'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close portal access dialog"
                  data-testid="dual-door-close-btn"
                  className="min-h-[44px] min-w-[44px] rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#121315] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] inline-flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Shield Badge + Heading */}
              <div className="space-y-2">
                <div
                  data-testid="dual-door-security-badge"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E7F3EE] dark:bg-[#142B24] border border-[#146C53]/30 dark:border-[#2EB88B]/35 text-[11px] font-semibold text-[#146C53] dark:text-[#2EB88B]"
                >
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {isPartner
                      ? 'Isolated Organization Workspace · Consent-First Access'
                      : '2FA-Protected Builder Sanctuary'}
                  </span>
                </div>

                <h2
                  id="dual-door-auth-title"
                  className="font-display text-2xl font-medium tracking-tight text-[#17191C] dark:text-[#F4F2EE]"
                >
                  {isPartner ? 'Hiring Partner Console Access' : 'Enter Talent Studio'}
                </h2>
                {!isPartner && pendingRedirectTab && (
                  <div
                    role="status"
                    data-testid="auth-redirect-context-banner"
                    className="rounded-xl bg-[#E7F3EE]/85 dark:bg-[#142B24]/85 border border-[#146C53]/30 dark:border-[#2EB88B]/35 px-3.5 py-2.5 text-xs font-semibold text-[#146C53] dark:text-[#5EEAD4] flex items-center gap-2"
                  >
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Authenticate via 2FA or Dedicated PIN to jump straight to{' '}
                      {STAGE_REDIRECT_LABELS[pendingRedirectTab]}
                    </span>
                  </div>
                )}
                <p className="text-xs sm:text-sm text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                  {isPartner
                    ? 'Verify your organization email to review pre-cleared compliance dossiers and fund solution sprints without accessing raw identity documents.'
                    : builderMode === 'standard_2fa'
                      ? 'Verify with a 6-digit one-time code via phone, WhatsApp, or email — or continue without a phone using a Dedicated Crossing PIN.'
                      : builderMode === 'pin_signup'
                        ? 'No phone number needed. Generate a private Builder ID and 6-digit Personal Crossing PIN — no government IDs ever requested.'
                        : 'Welcome back. Enter your Builder ID or Alias along with your 6-digit Personal Crossing PIN.'}
                </p>
              </div>

              {/* ============================================================
                  BUILDER DOOR (Path A: Standard 2FA | Path B: Dedicated PIN)
                 ============================================================ */}
              {!isPartner ? (
                <div className="space-y-4">
                  {/* PATH A: STANDARD 2FA */}
                  {builderMode === 'standard_2fa' && !challengeId && (
                    <form onSubmit={handleRequestCode} className="space-y-4" data-testid="builder-2fa-step1-form">
                      {/* Channel Toggle */}
                      <div
                        role="group"
                        aria-label="Builder 2FA verification channel"
                        className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037]"
                      >
                        {(
                          [
                            { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
                            { id: 'phone', label: 'Phone SMS', icon: Phone },
                            { id: 'email', label: 'Email', icon: Mail },
                          ] as const
                        ).map((opt) => {
                          const Icon = opt.icon;
                          const active = talentChannel === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                setTalentChannel(opt.id);
                                if (opt.id === 'whatsapp' || opt.id === 'phone') {
                                  setTalentIdentifier((prev) => prev.replace(/\D/g, '').slice(0, 15));
                                }
                                setErrorMessage(null);
                              }}
                              aria-pressed={active}
                              className={`min-h-[38px] px-2 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                                active
                                  ? 'bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B]'
                                  : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5 shrink-0" />
                              <span>{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label
                            htmlFor="talent-auth-identifier"
                            className="block text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] mb-1.5"
                          >
                            {talentChannel === 'email'
                              ? 'Email Address'
                              : talentChannel === 'whatsapp'
                                ? 'WhatsApp Number (numerals only, with country code)'
                                : 'Phone Number (numerals only, with country code)'}
                          </label>
                          <input
                            id="talent-auth-identifier"
                            type={talentChannel === 'email' ? 'email' : 'tel'}
                            inputMode={talentChannel === 'email' ? 'email' : 'numeric'}
                            pattern={talentChannel === 'email' ? undefined : '[0-9]*'}
                            maxLength={talentChannel === 'email' ? 120 : 15}
                            autoComplete={talentChannel === 'email' ? 'email' : 'tel-national'}
                            required
                            value={talentIdentifier}
                            onChange={(e) => {
                              if (talentChannel === 'email') {
                                setTalentIdentifier(e.target.value);
                              } else {
                                setTalentIdentifier(e.target.value.replace(/\D/g, '').slice(0, 15));
                              }
                            }}
                            onKeyDown={(e) => {
                              if (talentChannel === 'email') return;
                              if (e.ctrlKey || e.metaKey || e.altKey) return;
                              if (
                                e.key === 'Backspace' ||
                                e.key === 'Delete' ||
                                e.key === 'Tab' ||
                                e.key === 'Enter' ||
                                e.key === 'ArrowLeft' ||
                                e.key === 'ArrowRight' ||
                                e.key === 'Home' ||
                                e.key === 'End' ||
                                /^[0-9]$/.test(e.key)
                              ) {
                                return;
                              }
                              if (e.key.length === 1) {
                                e.preventDefault();
                              }
                            }}
                            onPaste={(e) => {
                              if (talentChannel === 'email') return;
                              e.preventDefault();
                              const digitsOnly = e.clipboardData
                                .getData('text')
                                .replace(/\D/g, '')
                                .slice(0, 15);
                              setTalentIdentifier(digitsOnly);
                            }}
                            placeholder={
                              talentChannel === 'email'
                                ? 'amina.hassan@example.org'
                                : '254712345678'
                            }
                            className="w-full min-h-[44px] rounded-xl bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3.5 py-2.5 text-sm font-mono-tabular text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53]"
                          />
                          {talentChannel !== 'email' && (
                            <p className="mt-1 text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                              Digits 0–9 only — include country code without +, spaces, letters, or symbols (e.g., 254712345678).
                            </p>
                          )}

                          {/* Prominent, reassuring No-Phone Dedicated PIN toggle directly beneath phone field */}
                          <div className="mt-2.5 rounded-xl border border-[#146C53]/25 dark:border-[#2EB88B]/30 bg-[#E7F3EE]/55 dark:bg-[#142B24]/55 px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => handleSwitchBuilderMode('pin_signup')}
                              data-testid="switch-to-dedicated-pin-btn"
                              className="text-left text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] hover:underline inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <KeyRound className="w-3.5 h-3.5 shrink-0" />
                              <span>No phone number? Generate a Dedicated PIN →</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSwitchBuilderMode('pin_login')}
                              data-testid="switch-to-pin-login-inline-btn"
                              className="text-left text-[11px] font-medium text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] underline cursor-pointer shrink-0"
                            >
                              Have a PIN? Sign in
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label
                              htmlFor="talent-auth-name"
                              className="block text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] mb-1.5"
                            >
                              Preferred Name or Alias
                            </label>
                            <input
                              id="talent-auth-name"
                              type="text"
                              maxLength={80}
                              value={talentName}
                              onChange={(e) => setTalentName(e.target.value)}
                              placeholder="e.g., Amina K."
                              className="w-full min-h-[42px] rounded-xl bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3.5 py-2 text-sm text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53]"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="talent-age-stage"
                              className="block text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] mb-1.5"
                            >
                              Age Stage
                            </label>
                            <select
                              id="talent-age-stage"
                              data-testid="builder-auth-age-stage"
                              value={selectedAgeStage}
                              onChange={(e) => setSelectedAgeStage(e.target.value as AgeStage)}
                              className="w-full min-h-[42px] rounded-xl bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3 py-2 text-sm text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53]"
                            >
                              {AGE_STAGE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  Age {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Compact Mutual Consent Accord */}
                      <label className="flex items-start gap-2.5 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-white/80 dark:bg-[#121315]/80 px-3.5 py-2.5 text-[11px] text-[#575B62] dark:text-[#A3A7AE] cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={mutualConsentAccepted}
                          onChange={(e) => {
                            setMutualConsentAccepted(e.target.checked);
                            if (e.target.checked && errorMessage) setErrorMessage(null);
                          }}
                          data-testid="builder-door-mutual-consent-checkbox"
                          className="mt-0.5 rounded border-[#146C53] text-[#146C53] focus:ring-[#146C53] shrink-0 cursor-pointer"
                        />
                        <span className="leading-relaxed">
                          I confirm mutual consent to enter the sovereign Builder Sanctuary. No raw government IDs are collected, and records stay strictly isolated from Hiring Partners.
                        </span>
                      </label>

                      {errorMessage && (
                        <div
                          role="alert"
                          aria-live="assertive"
                          aria-atomic="true"
                          className="rounded-xl bg-[#FDF2F2] dark:bg-[#2E1616] border border-[#B42318]/40 dark:border-[#F97066]/45 px-3.5 py-2.5 text-xs text-[#912018] dark:text-[#FDA29B] flex items-start gap-2"
                        >
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{errorMessage}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmitting || lockoutSeconds > 0}
                        data-testid="dual-door-request-code-btn"
                        className="w-full min-h-[46px] px-5 py-2.5 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ShieldCheck className="w-4 h-4" />
                        )}
                        <span>Send 6-Digit 2FA Code</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>
                  )}

                  {/* PATH A — STEP 2: 6-DIGIT 2FA VERIFICATION */}
                  {builderMode === 'standard_2fa' && challengeId && (
                    <form onSubmit={handleVerifyCode} className="space-y-4" data-testid="builder-2fa-step2-form">
                      <div className="rounded-xl bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-4 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                            Step 2 of 2 · Enter 6-Digit 2FA Code
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setChallengeId(null);
                              setSandboxPreviewCode(null);
                              setVerificationCode('');
                              setErrorMessage(null);
                            }}
                            className="text-[11px] font-semibold text-[#146C53] dark:text-[#2EB88B] hover:underline cursor-pointer"
                          >
                            Change contact
                          </button>
                        </div>
                        <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                          Sent to{' '}
                          <strong className="text-[#17191C] dark:text-[#F4F2EE]">{maskedTarget}</strong>.
                        </p>

                        {sandboxPreviewCode && (
                          <div
                            data-testid="sandbox-otp-preview"
                            className="rounded-lg bg-[#E7F3EE]/85 dark:bg-[#142B24] border border-[#146C53]/30 px-3 py-2 flex items-center justify-between gap-2 text-xs"
                          >
                            <span className="text-[#146C53] dark:text-[#5EEAD4]">
                              Live Demo 2FA Code:{' '}
                              <strong className="font-mono-tabular tracking-widest">
                                {sandboxPreviewCode}
                              </strong>
                            </span>
                            <button
                              type="button"
                              onClick={() => setVerificationCode(sandboxPreviewCode)}
                              data-testid="autofill-otp-btn"
                              className="text-[11px] font-semibold underline text-[#146C53] dark:text-[#5EEAD4] cursor-pointer"
                            >
                              Auto-fill
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label
                            htmlFor="builder-otp-0"
                            className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]"
                          >
                            6-Digit One-Time Passcode
                          </label>
                          {resendCooldown > 0 ? (
                            <span
                              data-testid="otp-resend-countdown"
                              className="text-[11px] font-mono-tabular text-[#575B62] dark:text-[#A3A7AE]"
                            >
                              Resend in {resendCooldown}s
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => void dispatchOtpRequest()}
                              data-testid="otp-resend-btn"
                              className="text-[11px] font-semibold text-[#146C53] dark:text-[#2EB88B] hover:underline cursor-pointer disabled:opacity-50"
                            >
                              Resend 6-digit code
                            </button>
                          )}
                        </div>

                        <SixDigitInput
                          idPrefix="builder-otp"
                          value={verificationCode}
                          onChange={setVerificationCode}
                          disabled={isSubmitting || lockoutSeconds > 0}
                          ariaLabelPrefix="6-Digit 2FA Passcode"
                        />
                      </div>

                      <label className="flex items-center gap-2 text-xs text-[#575B62] dark:text-[#A3A7AE] cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={trustedDevice}
                          onChange={(e) => setTrustedDevice(e.target.checked)}
                          className="rounded border-[#146C53] text-[#146C53] focus:ring-[#146C53] cursor-pointer"
                        />
                        <span>Trust this device for this Crossing session</span>
                      </label>

                      {lockoutSeconds > 0 && (
                        <div
                          role="alert"
                          aria-live="assertive"
                          aria-atomic="true"
                          data-testid="auth-lockout-banner"
                          className="rounded-xl bg-[#F9ECE5] dark:bg-[#2D1E17] border border-[#C4622D]/45 px-3.5 py-3 text-xs text-[#8D4119] dark:text-[#F59E6C] flex items-start gap-2.5"
                        >
                          <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p className="font-semibold">
                              Calm Protection Cooldown · {lockoutSeconds}s remaining
                            </p>
                            <p>
                              Verification is paused briefly after 5 attempts. No data was lost — retry calmly when the timer finishes, or request a fresh code.
                            </p>
                          </div>
                        </div>
                      )}

                      {errorMessage && lockoutSeconds === 0 && (
                        <div
                          role="alert"
                          aria-live="assertive"
                          aria-atomic="true"
                          className="rounded-xl bg-[#FDF2F2] dark:bg-[#2E1616] border border-[#B42318]/40 dark:border-[#F97066]/45 px-3.5 py-2.5 text-xs text-[#912018] dark:text-[#FDA29B] flex items-start gap-2"
                        >
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{errorMessage} You can paste your 6-digit code directly or request a new one above.</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmitting || verificationCode.length < 6 || lockoutSeconds > 0}
                        data-testid="dual-door-verify-code-btn"
                        className="w-full min-h-[46px] px-5 py-2.5 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        <span>Verify 2FA &amp; Enter Talent Studio</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>
                  )}

                  {/* PATH B: NO PHONE NUMBER — DEDICATED CROSSING PIN (SIGN-UP & SIGN-IN) */}
                  {(builderMode === 'pin_signup' || builderMode === 'pin_login') && (
                    <div className="space-y-4" data-testid="builder-dedicated-pin-section">
                      {/* Calm Mode Switcher + Back to Phone/Email */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div
                          role="group"
                          aria-label="Dedicated PIN mode"
                          className="inline-flex p-1 rounded-xl bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037]"
                        >
                          <button
                            type="button"
                            onClick={() => handleSwitchBuilderMode('pin_signup')}
                            data-testid="pin-mode-signup-tab"
                            aria-pressed={builderMode === 'pin_signup'}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              builderMode === 'pin_signup'
                                ? 'bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B]'
                                : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                            }`}
                          >
                            Generate New PIN
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSwitchBuilderMode('pin_login')}
                            data-testid="pin-mode-login-tab"
                            aria-pressed={builderMode === 'pin_login'}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              builderMode === 'pin_login'
                                ? 'bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B]'
                                : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                            }`}
                          >
                            Already have a PIN?
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSwitchBuilderMode('standard_2fa')}
                          className="text-[11px] font-semibold text-[#575B62] dark:text-[#A3A7AE] hover:text-[#146C53] dark:hover:text-[#2EB88B] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <ArrowLeft className="w-3 h-3" />
                          <span>Use Phone / Email 2FA</span>
                        </button>
                      </div>

                      {/* PATH B — NEW SIGN-UP STEP 1: ALIAS + AGE STAGE */}
                      {builderMode === 'pin_signup' && !pinEnrollment && (
                        <form onSubmit={handleGenerateDedicatedPinSubmit} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label
                                htmlFor="pin-builder-alias"
                                className="block text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] mb-1.5"
                              >
                                Display Name or Alias
                              </label>
                              <input
                                id="pin-builder-alias"
                                data-testid="pin-alias-input"
                                type="text"
                                required
                                minLength={2}
                                maxLength={80}
                                value={pinAlias}
                                onChange={(e) => setPinAlias(e.target.value)}
                                placeholder="e.g., Amina K."
                                className="w-full min-h-[44px] rounded-xl bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3.5 py-2.5 text-sm text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53]"
                              />
                            </div>

                            <div>
                              <label
                                htmlFor="pin-age-stage"
                                className="block text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] mb-1.5"
                              >
                                Age Stage
                              </label>
                              <select
                                id="pin-age-stage"
                                value={selectedAgeStage}
                                onChange={(e) => setSelectedAgeStage(e.target.value as AgeStage)}
                                className="w-full min-h-[44px] rounded-xl bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3 py-2.5 text-sm text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53]"
                              >
                                {AGE_STAGE_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    Age {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                            Your Dedicated PIN is hashed on our server and never stored in plaintext. We never ask for national IDs, passports, or refugee numbers.
                          </p>

                          {errorMessage && (
                            <div
                              role="alert"
                              aria-live="assertive"
                              aria-atomic="true"
                              className="rounded-xl bg-[#FDF2F2] dark:bg-[#2E1616] border border-[#B42318]/40 dark:border-[#F97066]/45 px-3.5 py-2.5 text-xs text-[#912018] dark:text-[#FDA29B] flex items-start gap-2"
                            >
                              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                              <span>{errorMessage}</span>
                            </div>
                          )}

                          <button
                            type="submit"
                            disabled={isSubmitting || pinAlias.trim().length < 2}
                            data-testid="generate-dedicated-pin-btn"
                            className="w-full min-h-[46px] px-5 py-2.5 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
                          >
                            {isSubmitting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <KeyRound className="w-4 h-4" />
                            )}
                            <span>Generate My Dedicated PIN</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </form>
                      )}

                      {/* PATH B — NEW SIGN-UP STEP 2: PIN CARD + 2-STEP CONFIRMATION GATE */}
                      {builderMode === 'pin_signup' && pinEnrollment && (
                        <form onSubmit={handleConfirmDedicatedPin} className="space-y-4">
                          {/* Dignified Personal Crossing PIN Card */}
                          <div
                            data-testid="generated-pin-card"
                            className="rounded-2xl bg-white dark:bg-[#121315] border border-[#146C53]/35 dark:border-[#2EB88B]/35 p-4 space-y-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#146C53] dark:text-[#2EB88B]">
                                Your Personal Crossing PIN Card
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setShowGeneratedPin((prev) => !prev)}
                                  aria-label={showGeneratedPin ? 'Hide PIN' : 'Show PIN'}
                                  data-testid="toggle-pin-visibility-btn"
                                  className="px-2 py-1 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] text-[11px] font-medium text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] inline-flex items-center gap-1 cursor-pointer"
                                >
                                  {showGeneratedPin ? (
                                    <>
                                      <EyeOff className="w-3 h-3" />
                                      <span>Hide</span>
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="w-3 h-3" />
                                      <span>Show</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  disabled={isSubmitting}
                                  onClick={() => void requestDedicatedPin()}
                                  data-testid="regenerate-pin-btn"
                                  className="px-2 py-1 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] text-[11px] font-medium text-[#575B62] dark:text-[#A3A7AE] hover:text-[#146C53] dark:hover:text-[#2EB88B] inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  <span>Regenerate</span>
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="rounded-xl bg-[#FAF8F5] dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-3">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#575B62] dark:text-[#A3A7AE]">
                                  Builder ID
                                </p>
                                <p
                                  data-testid="generated-builder-id"
                                  className="mt-1 font-mono-tabular text-base font-bold text-[#17191C] dark:text-[#F4F2EE]"
                                >
                                  {pinEnrollment.builderId}
                                </p>
                              </div>

                              <div className="rounded-xl bg-[#E7F3EE]/60 dark:bg-[#142B24]/70 border border-[#146C53]/30 dark:border-[#2EB88B]/30 p-3">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#146C53] dark:text-[#2EB88B]">
                                  6-Digit Crossing PIN
                                </p>
                                <p
                                  data-testid="generated-pin-value"
                                  className="mt-1 font-mono-tabular text-lg font-bold tracking-[0.22em] text-[#146C53] dark:text-[#5EEAD4]"
                                >
                                  {showGeneratedPin ? pinEnrollment.pin : '••••••'}
                                </p>
                              </div>
                            </div>

                            <div className="rounded-xl bg-[#FAF8F5] dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] px-3 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#575B62] dark:text-[#A3A7AE]">
                                  3-Word Recovery Phrase
                                </p>
                                <p
                                  data-testid="generated-recovery-phrase"
                                  className="mt-0.5 font-mono-tabular text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]"
                                >
                                  {pinEnrollment.recoveryPhrase}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => void handleCopyPinCard()}
                                data-testid="copy-pin-card-btn"
                                className="min-h-[34px] px-3 py-1.5 rounded-lg bg-[#17191C] hover:bg-[#2A2D33] dark:bg-[#F4F2EE] dark:hover:bg-[#E2DDD4] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                              >
                                {pinCopied ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Saved / Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copy / Save PIN Card</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* 2-Step Confirmation Gate (2FA Equivalent) */}
                          <div className="space-y-2">
                            <label
                              htmlFor="pin-confirm-0"
                              className="block text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]"
                            >
                              Confirm your 6-Digit PIN once to verify you saved it
                            </label>
                            <SixDigitInput
                              idPrefix="pin-confirm"
                              value={pinConfirmDigits}
                              onChange={setPinConfirmDigits}
                              disabled={isSubmitting || lockoutSeconds > 0}
                              ariaLabelPrefix="Confirm 6-Digit Dedicated PIN"
                              pasteButtonLabel="Paste PIN"
                            />
                          </div>

                          <label className="flex items-center gap-2 text-xs text-[#575B62] dark:text-[#A3A7AE] cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={trustedDevice}
                              onChange={(e) => setTrustedDevice(e.target.checked)}
                              className="rounded border-[#146C53] text-[#146C53] focus:ring-[#146C53] cursor-pointer"
                            />
                            <span>Remember this device as trusted for my Crossing session</span>
                          </label>

                          {lockoutSeconds > 0 && (
                            <div
                              role="alert"
                              aria-live="assertive"
                              aria-atomic="true"
                              data-testid="auth-lockout-banner"
                              className="rounded-xl bg-[#F9ECE5] dark:bg-[#2D1E17] border border-[#C4622D]/45 px-3.5 py-3 text-xs text-[#8D4119] dark:text-[#F59E6C] flex items-start gap-2.5"
                            >
                              <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <p className="font-semibold">
                                  Calm Protection Cooldown · {lockoutSeconds}s remaining
                                </p>
                                <p>
                                  PIN confirmation is paused briefly after 5 attempts. Review your PIN card above and paste or re-enter when the timer completes.
                                </p>
                              </div>
                            </div>
                          )}

                          {errorMessage && lockoutSeconds === 0 && (
                            <div
                              role="alert"
                              aria-live="assertive"
                              aria-atomic="true"
                              className="rounded-xl bg-[#FDF2F2] dark:bg-[#2E1616] border border-[#B42318]/40 dark:border-[#F97066]/45 px-3.5 py-2.5 text-xs text-[#912018] dark:text-[#FDA29B] flex items-start gap-2"
                            >
                              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                              <span>{errorMessage} Compare with your PIN card above or use Paste PIN.</span>
                            </div>
                          )}

                          <button
                            type="submit"
                            disabled={isSubmitting || pinConfirmDigits.length < 6 || lockoutSeconds > 0}
                            data-testid="confirm-dedicated-pin-btn"
                            className="w-full min-h-[46px] px-5 py-2.5 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isSubmitting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                            <span>Confirm PIN &amp; Enter Talent Studio</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </form>
                      )}

                      {/* PATH B — RETURNING NO-PHONE SIGN-IN */}
                      {builderMode === 'pin_login' && (
                        <form onSubmit={handleReturningPinLogin} className="space-y-4">
                          <div>
                            <label
                              htmlFor="returning-pin-identifier"
                              className="block text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] mb-1.5"
                            >
                              Builder ID or Display Alias
                            </label>
                            <input
                              id="returning-pin-identifier"
                              data-testid="returning-pin-id-input"
                              type="text"
                              autoComplete="username"
                              required
                              value={returningPinId}
                              onChange={(e) => setReturningPinId(e.target.value)}
                              placeholder="e.g., VNA-B-4821 or Amina K."
                              className="w-full min-h-[44px] rounded-xl bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3.5 py-2.5 text-sm text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53]"
                            />
                          </div>

                          <div className="space-y-2">
                            <label
                              htmlFor="pin-login-0"
                              className="block text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]"
                            >
                              6-Digit Personal Crossing PIN
                            </label>
                            <SixDigitInput
                              idPrefix="pin-login"
                              value={returningPinDigits}
                              onChange={setReturningPinDigits}
                              disabled={isSubmitting || lockoutSeconds > 0}
                              masked
                              ariaLabelPrefix="6-Digit Dedicated PIN"
                              pasteButtonLabel="Paste PIN"
                            />
                          </div>

                          <label className="flex items-center gap-2 text-xs text-[#575B62] dark:text-[#A3A7AE] cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={trustedDevice}
                              onChange={(e) => setTrustedDevice(e.target.checked)}
                              className="rounded border-[#146C53] text-[#146C53] focus:ring-[#146C53] cursor-pointer"
                            />
                            <span>Trust this device for my Crossing session</span>
                          </label>

                          {lockoutSeconds > 0 && (
                            <div
                              role="alert"
                              aria-live="assertive"
                              aria-atomic="true"
                              data-testid="auth-lockout-banner"
                              className="rounded-xl bg-[#F9ECE5] dark:bg-[#2D1E17] border border-[#C4622D]/45 px-3.5 py-3 text-xs text-[#8D4119] dark:text-[#F59E6C] flex items-start gap-2.5"
                            >
                              <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <p className="font-semibold">
                                  Calm Protection Cooldown · {lockoutSeconds}s remaining
                                </p>
                                <p>
                                  Sign-in is paused briefly after 5 attempts. You can paste your saved PIN calmly once the timer completes, or generate a new PIN card.
                                </p>
                              </div>
                            </div>
                          )}

                          {errorMessage && lockoutSeconds === 0 && (
                            <div
                              role="alert"
                              aria-live="assertive"
                              aria-atomic="true"
                              className="rounded-xl bg-[#FDF2F2] dark:bg-[#2E1616] border border-[#B42318]/40 dark:border-[#F97066]/45 px-3.5 py-2.5 text-xs text-[#912018] dark:text-[#FDA29B] flex items-start gap-2"
                            >
                              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                              <span>{errorMessage} Check your Builder ID or use Paste PIN.</span>
                            </div>
                          )}

                          <button
                            type="submit"
                            disabled={
                              isSubmitting ||
                              returningPinId.trim().length < 2 ||
                              returningPinDigits.length < 6 ||
                              lockoutSeconds > 0
                            }
                            data-testid="returning-pin-login-btn"
                            className="w-full min-h-[46px] px-5 py-2.5 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isSubmitting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <KeyRound className="w-4 h-4" />
                            )}
                            <span>Unlock &amp; Enter Talent Studio</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </form>
                      )}
                    </div>
                  )}

                  {/* Discreet Hackathon Judge 1-Click Auto-2FA Shortcut */}
                  <div className="pt-2 border-t border-[#E8E3DB]/80 dark:border-[#2C3037] flex items-center justify-center">
                    <button
                      type="button"
                      disabled={isSubmitting || !mutualConsentAccepted}
                      onClick={() => void handleDemoAccess()}
                      data-testid="demo-builder-access-btn"
                      className="text-xs font-semibold text-[#C4622D] dark:text-[#E07B46] hover:underline inline-flex items-center gap-1.5 py-1 cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>Hackathon Judge? 1-Click Auto-2FA Demo Builder →</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* ============================================================
                   PARTNER DOOR (Unchanged isolated organization verification)
                   ============================================================ */
                <div className="space-y-4">
                  <div className="rounded-xl bg-white dark:bg-[#121315] border border-[#146C53]/30 dark:border-[#2EB88B]/35 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#C4622D] dark:text-[#E07B46]">
                        <Sparkles className="w-3 h-3" />
                        <span>1-Click Demo Access · Live Scoped Session</span>
                      </div>
                      <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                        Mints a verified vna_partner_sid token for SolarGrid East Africa.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => void handleDemoAccess()}
                      data-testid="demo-partner-access-btn"
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Building2 className="w-3.5 h-3.5" />
                      )}
                      <span>Continue as Verified Partner</span>
                    </button>
                  </div>

                  <div className="relative flex items-center justify-center">
                    <div className="w-full border-t border-[#E8E3DB] dark:border-[#2C3037]" />
                    <span className="absolute px-3 bg-[#FAF8F5] dark:bg-[#1A1C20] text-[11px] font-medium text-[#575B62] dark:text-[#A3A7AE]">
                      or verify your organization email
                    </span>
                  </div>

                  {!challengeId ? (
                    <form onSubmit={handleRequestCode} className="space-y-4">
                      <div className="space-y-3">
                        <div>
                          <label
                            htmlFor="partner-auth-email"
                            className="block text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] mb-1.5"
                          >
                            Corporate or NGO Work Email
                          </label>
                          <input
                            id="partner-auth-email"
                            type="email"
                            required
                            value={partnerEmail}
                            onChange={(e) => setPartnerEmail(e.target.value)}
                            placeholder="hiring@solargridea.org"
                            className="w-full min-h-[44px] rounded-xl bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3.5 py-2.5 text-sm text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53]"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label
                              htmlFor="partner-auth-org"
                              className="block text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] mb-1.5"
                            >
                              Organization Name
                            </label>
                            <input
                              id="partner-auth-org"
                              type="text"
                              required
                              maxLength={100}
                              value={partnerOrgName}
                              onChange={(e) => setPartnerOrgName(e.target.value)}
                              placeholder="SolarGrid East Africa"
                              className="w-full min-h-[44px] rounded-xl bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3.5 py-2.5 text-sm text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53]"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="partner-auth-role"
                              className="block text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] mb-1.5"
                            >
                              Workspace Role
                            </label>
                            <select
                              id="partner-auth-role"
                              value={partnerRole}
                              onChange={(e) => setPartnerRole(e.target.value as PartnerMemberRole)}
                              className="w-full min-h-[44px] rounded-xl bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3 py-2.5 text-sm text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53]"
                            >
                              <option value="hiring_lead">Hiring Lead</option>
                              <option value="partner_admin">Partner Admin</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {errorMessage && (
                        <div
                          role="alert"
                          aria-live="assertive"
                          aria-atomic="true"
                          className="rounded-xl bg-[#FDF2F2] dark:bg-[#2E1616] border border-[#B42318]/40 dark:border-[#F97066]/45 px-3.5 py-2.5 text-xs text-[#912018] dark:text-[#FDA29B] flex items-start gap-2"
                        >
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{errorMessage}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        data-testid="dual-door-request-code-btn"
                        className="w-full min-h-[46px] px-5 py-2.5 rounded-xl bg-[#17191C] hover:bg-[#2A2D33] dark:bg-[#F4F2EE] dark:hover:bg-[#E2DDD4] text-white dark:text-[#121315] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <KeyRound className="w-4 h-4" />
                        )}
                        <span>Send Organization Domain Verification Code</span>
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyCode} className="space-y-4">
                      <div className="rounded-xl bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                            6-Digit Verification Code Sent
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setChallengeId(null);
                              setSandboxPreviewCode(null);
                              setErrorMessage(null);
                            }}
                            className="text-[11px] font-semibold text-[#146C53] dark:text-[#2EB88B] hover:underline cursor-pointer"
                          >
                            Change details
                          </button>
                        </div>
                        <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                          Enter the 6-digit code dispatched to{' '}
                          <strong className="text-[#17191C] dark:text-[#F4F2EE]">
                            {maskedTarget}
                          </strong>
                          .
                        </p>
                        {sandboxPreviewCode && (
                          <div
                            data-testid="sandbox-otp-preview"
                            className="mt-2 rounded-lg bg-[#E7F3EE]/80 dark:bg-[#142B24] border border-[#146C53]/30 px-3 py-2 flex items-center justify-between gap-2 text-xs"
                          >
                            <span className="text-[#146C53] dark:text-[#5EEAD4]">
                              Sandbox Preview Code:{' '}
                              <strong className="font-mono-tabular tracking-widest">
                                {sandboxPreviewCode}
                              </strong>
                            </span>
                            <button
                              type="button"
                              onClick={() => setVerificationCode(sandboxPreviewCode)}
                              className="text-[11px] font-semibold underline text-[#146C53] dark:text-[#5EEAD4] cursor-pointer"
                            >
                              Auto-fill
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="partner-otp-0"
                          className="block text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]"
                        >
                          6-Digit Organization Code
                        </label>
                        <SixDigitInput
                          idPrefix="partner-otp"
                          value={verificationCode}
                          onChange={setVerificationCode}
                          disabled={isSubmitting || lockoutSeconds > 0}
                          ariaLabelPrefix="6-Digit Partner Verification Code"
                          pasteButtonLabel="Paste Code"
                        />
                      </div>

                      {lockoutSeconds > 0 && (
                        <div
                          role="alert"
                          aria-live="assertive"
                          aria-atomic="true"
                          data-testid="auth-lockout-banner"
                          className="rounded-xl bg-[#F9ECE5] dark:bg-[#2D1E17] border border-[#C4622D]/45 px-3.5 py-3 text-xs text-[#8D4119] dark:text-[#F59E6C] flex items-start gap-2.5"
                        >
                          <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p className="font-semibold">
                              Calm Protection Cooldown · {lockoutSeconds}s remaining
                            </p>
                            <p>
                              Verification is paused briefly. Paste or re-enter your organization code calmly once the timer finishes.
                            </p>
                          </div>
                        </div>
                      )}

                      {errorMessage && lockoutSeconds === 0 && (
                        <div
                          role="alert"
                          aria-live="assertive"
                          aria-atomic="true"
                          className="rounded-xl bg-[#FDF2F2] dark:bg-[#2E1616] border border-[#B42318]/40 dark:border-[#F97066]/45 px-3.5 py-2.5 text-xs text-[#912018] dark:text-[#FDA29B] flex items-start gap-2"
                        >
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{errorMessage} You can paste your 6-digit code directly or request a new code above.</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmitting || verificationCode.length < 6}
                        data-testid="dual-door-verify-code-btn"
                        className="w-full min-h-[46px] px-5 py-2.5 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        <span>Verify &amp; Enter Partner Console</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Footer Mutual Exclusion Notice & Door Switch */}
              <div className="pt-3.5 border-t border-[#E8E3DB] dark:border-[#2C3037] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-[#146C53] dark:text-[#2EB88B] shrink-0" />
                  <span>Strict mutual exclusion · Sessions never cross realms</span>
                </span>

                <button
                  type="button"
                  onClick={() => handleSwitchDoor(isPartner ? 'talent' : 'partner')}
                  data-testid="dual-door-switch-realm-btn"
                  className="font-semibold text-[#146C53] dark:text-[#2EB88B] hover:underline self-start sm:self-auto cursor-pointer whitespace-nowrap"
                >
                  {isPartner ? 'Switch to Talent Builder Door →' : 'Switch to Hiring Partner Door →'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
