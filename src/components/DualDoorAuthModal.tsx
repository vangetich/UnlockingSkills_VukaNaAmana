import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  Phone,
  ShieldCheck,
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react';
import type {
  ActiveAuthSession,
  AgeStage,
  PartnerMemberRole,
  PortalRealm,
  TalentAuthChannel,
} from '../types/kora';

interface DualDoorAuthModalProps {
  isOpen: boolean;
  initialDoor: PortalRealm;
  ageStage: AgeStage;
  defaultDisplayName?: string;
  activeSession: ActiveAuthSession | null;
  onClose: () => void;
  onAuthenticated: (session: ActiveAuthSession) => void;
}

export const DualDoorAuthModal: React.FC<DualDoorAuthModalProps> = ({
  isOpen,
  initialDoor,
  ageStage,
  defaultDisplayName = '',
  activeSession,
  onClose,
  onAuthenticated,
}) => {
  const [door, setDoor] = useState<PortalRealm>(initialDoor);

  // Talent Door state
  const [talentChannel, setTalentChannel] = useState<TalentAuthChannel>('whatsapp');
  const [talentIdentifier, setTalentIdentifier] = useState('');
  const [talentName, setTalentName] = useState(
    defaultDisplayName && defaultDisplayName !== 'Practitioner' ? defaultDisplayName : ''
  );

  // Partner Door state
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerOrgName, setPartnerOrgName] = useState('');
  const [partnerRole, setPartnerRole] = useState<PartnerMemberRole>('hiring_lead');

  // Shared OTP challenge state
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [maskedTarget, setMaskedTarget] = useState<string>('');
  const [sandboxPreviewCode, setSandboxPreviewCode] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDoor(initialDoor);
      setChallengeId(null);
      setMaskedTarget('');
      setSandboxPreviewCode(null);
      setVerificationCode('');
      setErrorMessage(null);
    }
  }, [isOpen, initialDoor]);

  const handleSwitchDoor = (nextDoor: PortalRealm) => {
    setDoor(nextDoor);
    setChallengeId(null);
    setMaskedTarget('');
    setSandboxPreviewCode(null);
    setVerificationCode('');
    setErrorMessage(null);
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

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const endpoint =
        door === 'talent' ? '/api/auth/talent/request-code' : '/api/auth/partner/request-code';
      const payload =
        door === 'talent'
          ? {
              channel: talentChannel,
              identifier: talentIdentifier,
              displayName: talentName,
              ageStage,
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
      };

      if (!res.ok || !data.challengeId) {
        throw new Error(data.error || 'Could not generate a verification code. Please check your details.');
      }

      setChallengeId(data.challengeId);
      setMaskedTarget(data.maskedTarget || data.maskedEmail || '');
      setSandboxPreviewCode(data.previewCode || null);
      setVerificationCode('');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to send verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeId) return;
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
        }),
      });
      const data = (await res.json()) as ActiveAuthSession & { error?: string; authenticated?: boolean };

      if (!res.ok || !data.authenticated || !data.token) {
        throw new Error(data.error || 'Verification failed. Please double-check your 6-digit code.');
      }

      onAuthenticated({
        realm: data.realm,
        sessionCookieName: data.sessionCookieName,
        token: data.token,
        claims: data.claims,
      } as ActiveAuthSession);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to verify code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoAccess = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const endpoint = door === 'talent' ? '/api/auth/talent/demo' : '/api/auth/partner/demo';
      const payload =
        door === 'talent'
          ? { displayName: talentName || 'Amina Hassan', ageStage }
          : { memberRole: partnerRole };

      const res = await fetch(endpoint, {
        method: 'POST',
        credentials: 'same-origin',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as ActiveAuthSession & { error?: string; authenticated?: boolean };

      if (!res.ok || !data.authenticated || !data.token) {
        throw new Error(data.error || 'Demo session could not be initialized.');
      }

      onAuthenticated({
        realm: data.realm,
        sessionCookieName: data.sessionCookieName,
        token: data.token,
        claims: data.claims,
      } as ActiveAuthSession);
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
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 sm:p-6 pt-16 sm:pt-20 bg-[#17191C]/60 backdrop-blur-xs overflow-y-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[85vh] flex flex-col rounded-2xl bg-[#FAF8F5] dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] shadow-2xl overflow-hidden my-4 sm:my-auto"
          >
            {/* Top accent line */}
            <div
              className={`h-1 w-full ${
                isPartner
                  ? 'bg-gradient-to-r from-[#146C53] via-[#1C8567] to-[#C4622D]'
                  : 'bg-gradient-to-r from-[#C4622D] via-[#146C53] to-[#2EB88B]'
              }`}
            />

            <div className="p-6 sm:p-8 space-y-6">
              {/* Brand lockup + close */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src="/bridge.jpeg"
                    alt="Vuka na Amana Bridge Logo"
                    className="h-9 w-auto object-contain rounded-md shrink-0"
                  />
                  <div className="leading-tight">
                    <p className="font-display text-base font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                      Vuka na Amana
                    </p>
                    <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#575B62] dark:text-[#A3A7AE]">
                      {isPartner ? 'Partner Auth Realm · vna-partner' : 'Talent Auth Realm · vna-talent'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close portal access dialog"
                  data-testid="dual-door-close-btn"
                  className="min-h-[34px] min-w-[34px] rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#121315] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] inline-flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Isolated Security Badge + Heading */}
              <div className="space-y-2.5">
                <div
                  data-testid="dual-door-security-badge"
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E7F3EE] dark:bg-[#142B24] border border-[#146C53]/30 dark:border-[#2EB88B]/35 text-[11px] font-semibold text-[#146C53] dark:text-[#2EB88B]"
                >
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {isPartner
                      ? 'Isolated Organization Workspace · Consent-First Talent Access'
                      : 'Isolated Builder Realm · Zero Corporate Email Required'}
                  </span>
                </div>

                <h2
                  id="dual-door-auth-title"
                  className="font-display text-2xl font-medium tracking-tight text-[#17191C] dark:text-[#F4F2EE]"
                >
                  {isPartner ? 'Hiring Partner Console Access' : 'Enter Your Talent Studio'}
                </h2>
                <p className="text-xs sm:text-sm text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
                  {isPartner
                    ? 'Verify your organization email to review pre-cleared compliance dossiers, fund solution sprints, and scale cohorts without ever accessing raw identity documents.'
                    : 'Sign in cleanly with your WhatsApp, phone number, or personal email. Your skills passport and proof ledger stay sovereign and strictly isolated from partner accounts.'}
                </p>
              </div>

              {/* Hackathon Judge 1-Click Demo Access Pill */}
              <div className="rounded-xl bg-white dark:bg-[#121315] border border-[#146C53]/30 dark:border-[#2EB88B]/35 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#C4622D] dark:text-[#E07B46]">
                    <Sparkles className="w-3 h-3" />
                    <span>1-Click Demo Access · Live Scoped Session</span>
                  </div>
                  <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                    {isPartner
                      ? 'Mints a verified vna_partner_sid token for SolarGrid East Africa.'
                      : 'Mints a verified vna_talent_sid token for immediate studio entry.'}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void handleDemoAccess()}
                  data-testid={isPartner ? 'demo-partner-access-btn' : 'demo-builder-access-btn'}
                  className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60 ${
                    isPartner
                      ? 'bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315]'
                      : 'bg-[#C4622D] hover:bg-[#AA5223] dark:bg-[#E07B46] dark:hover:bg-[#CE6A36] text-white dark:text-[#121315]'
                  }`}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isPartner ? (
                    <Building2 className="w-3.5 h-3.5" />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isPartner
                      ? 'Continue as Verified Partner — SolarGrid East Africa'
                      : 'Continue as Demo Builder'}
                  </span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-[#E8E3DB] dark:border-[#2C3037]" />
                <span className="absolute px-3 bg-[#FAF8F5] dark:bg-[#1A1C20] text-[11px] font-medium text-[#575B62] dark:text-[#A3A7AE]">
                  or verify your own credentials
                </span>
              </div>

              {/* Step 1: Request Code vs Step 2: Verify Code */}
              {!challengeId ? (
                <form onSubmit={handleRequestCode} className="space-y-4">
                  {!isPartner ? (
                    <>
                      {/* Talent Channel Toggle */}
                      <div
                        role="group"
                        aria-label="Builder verification channel"
                        className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037]"
                      >
                        {(
                          [
                            { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
                            { id: 'phone', label: 'Phone SMS', icon: Phone },
                            { id: 'email', label: 'Email Code', icon: Mail },
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
                                setErrorMessage(null);
                              }}
                              aria-pressed={active}
                              className={`min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
                                active
                                  ? 'bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B]'
                                  : 'text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE]'
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5" />
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
                              ? 'Personal Email Address'
                              : talentChannel === 'whatsapp'
                                ? 'WhatsApp Number (with country code)'
                                : 'Mobile Phone Number (with country code)'}
                          </label>
                          <input
                            id="talent-auth-identifier"
                            type={talentChannel === 'email' ? 'email' : 'tel'}
                            required
                            value={talentIdentifier}
                            onChange={(e) => setTalentIdentifier(e.target.value)}
                            placeholder={
                              talentChannel === 'email'
                                ? 'amina.hassan@gmail.com'
                                : '+254 712 345 678'
                            }
                            className="w-full min-h-[44px] rounded-xl bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3.5 py-2.5 text-sm text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53]"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="talent-auth-name"
                            className="block text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] mb-1.5"
                          >
                            Preferred Name (optional)
                          </label>
                          <input
                            id="talent-auth-name"
                            type="text"
                            maxLength={80}
                            value={talentName}
                            onChange={(e) => setTalentName(e.target.value)}
                            placeholder="e.g., Amina Hassan"
                            className="w-full min-h-[42px] rounded-xl bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3.5 py-2 text-sm text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53]"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
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
                  )}

                  {errorMessage && (
                    <p
                      role="alert"
                      className="rounded-xl bg-[#FDF2F2] dark:bg-[#2E1616] border border-[#F3C5C5] dark:border-[#5C2323] px-3.5 py-2.5 text-xs text-[#B42318] dark:text-[#F97066]"
                    >
                      {errorMessage}
                    </p>
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
                    <span>
                      {isPartner
                        ? 'Send Organization Domain Verification Code'
                        : talentChannel === 'email'
                          ? 'Send Email Magic Code'
                          : 'Send One-Time Verification Code'}
                    </span>
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
                        className="text-[11px] font-semibold text-[#146C53] dark:text-[#2EB88B] hover:underline"
                      >
                        Change details
                      </button>
                    </div>
                    <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                      Enter the 6-digit code dispatched to{' '}
                      <strong className="text-[#17191C] dark:text-[#F4F2EE]">{maskedTarget}</strong>.
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

                  <div>
                    <label
                      htmlFor="dual-door-otp-input"
                      className="block text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] mb-1.5"
                    >
                      6-Digit Verification Code
                    </label>
                    <input
                      id="dual-door-otp-input"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      required
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      className="w-full min-h-[46px] rounded-xl bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-4 py-2.5 text-center font-mono-tabular text-lg tracking-[0.35em] text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53]"
                    />
                  </div>

                  {errorMessage && (
                    <p
                      role="alert"
                      className="rounded-xl bg-[#FDF2F2] dark:bg-[#2E1616] border border-[#F3C5C5] dark:border-[#5C2323] px-3.5 py-2.5 text-xs text-[#B42318] dark:text-[#F97066]"
                    >
                      {errorMessage}
                    </p>
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
                    <span>
                      {isPartner ? 'Verify & Enter Partner Console' : 'Verify & Enter Talent Studio'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* Footer Mutual Exclusion Notice & Door Switch */}
              <div className="pt-4 border-t border-[#E8E3DB] dark:border-[#2C3037] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-[#146C53] dark:text-[#2EB88B] shrink-0" />
                  <span>Strict mutual exclusion · Sessions never bleed across realms</span>
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
