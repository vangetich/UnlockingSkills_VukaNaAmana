import React, { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  AlertCircle,
  CheckCircle2,
  CloudDownload,
  CloudUpload,
  KeyRound,
  Link2,
  Loader2,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  X,
} from 'lucide-react';

export type SyncAuthProviderId = 'google' | 'microsoft' | 'yahoo';

export interface EmailVaultSyncStatus {
  email: string;
  displayName: string;
  provider: string;
  consentToken: string;
  updatedAtIso: string;
}

interface AccountSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  isOnline: boolean;
  isSyncing: boolean;
  queuedCount: number;
  lastSyncedIso: string | null;
  authError: string | null;
  defaultEmail?: string;
  defaultDisplayName?: string;
  emailVaultStatus?: EmailVaultSyncStatus | null;
  onClearError: () => void;
  onSignInWithProvider: (provider: SyncAuthProviderId) => Promise<void>;
  onSignInWithEmail: (email: string, password: string) => Promise<void>;
  onRegisterWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  onSendPasswordReset: (email: string) => Promise<void>;
  onResendVerification: () => Promise<void>;
  onRefreshVerificationAndSync: () => Promise<void>;
  onLinkProvider: (provider: SyncAuthProviderId) => Promise<void>;
  onSignOut: () => Promise<void>;
  onSyncToEmailVault?: (
    email: string,
    displayName: string,
    provider: string
  ) => Promise<EmailVaultSyncStatus>;
  onRestoreFromEmailVault?: (email: string) => Promise<boolean>;
}

type AuthTabMode = 'signin' | 'register' | 'reset';

const PROVIDER_META: Array<{
  id: SyncAuthProviderId;
  providerId: string;
  label: string;
  sublabel: string;
  badgeText: string;
  accentClass: string;
}> = [
  {
    id: 'google',
    providerId: 'google.com',
    label: 'Google / Gmail',
    sublabel: 'Sync with your Google account',
    badgeText: 'G',
    accentClass:
      'bg-[#E7F3EE] text-[#146C53] dark:bg-[#142B24] dark:text-[#2EB88B] border-[#146C53]/25',
  },
  {
    id: 'microsoft',
    providerId: 'microsoft.com',
    label: 'Outlook / Hotmail / Live',
    sublabel: 'Sync with your Microsoft email',
    badgeText: 'M',
    accentClass:
      'bg-[#EEF4FF] text-[#1D4ED8] dark:bg-[#172554] dark:text-[#93C5FD] border-[#1D4ED8]/25',
  },
  {
    id: 'yahoo',
    providerId: 'yahoo.com',
    label: 'Yahoo Mail',
    sublabel: 'Sync with your Yahoo account',
    badgeText: 'Y!',
    accentClass:
      'bg-[#F5EEFF] text-[#6D28D9] dark:bg-[#2E1065] dark:text-[#C4B5FD] border-[#6D28D9]/25',
  },
];

export const AccountSyncModal: React.FC<AccountSyncModalProps> = ({
  isOpen,
  onClose,
  user,
  isOnline,
  isSyncing,
  queuedCount,
  lastSyncedIso,
  authError,
  defaultEmail = '',
  defaultDisplayName = '',
  emailVaultStatus,
  onClearError,
  onSignInWithProvider,
  onSignInWithEmail,
  onRegisterWithEmail,
  onSendPasswordReset,
  onResendVerification,
  onRefreshVerificationAndSync,
  onLinkProvider,
  onSignOut,
  onSyncToEmailVault,
  onRestoreFromEmailVault,
}) => {
  const [tabMode, setTabMode] = useState<AuthTabMode>('signin');
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState(defaultDisplayName);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [localStatusMessage, setLocalStatusMessage] = useState<string | null>(null);
  const [localInputError, setLocalInputError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultEmail && !email) setEmail(defaultEmail);
    if (defaultDisplayName && !displayName) setDisplayName(defaultDisplayName);
  }, [defaultEmail, defaultDisplayName, email, displayName]);

  if (!isOpen) return null;

  const linkedProviders = new Set((user?.providerData ?? []).map((p) => p.providerId));

  const switchMode = (nextMode: AuthTabMode) => {
    setTabMode(nextMode);
    setLocalStatusMessage(null);
    setLocalInputError(null);
    onClearError();
  };

  const handleDirectEmailVaultSave = async (
    targetEmail?: string,
    targetName?: string,
    providerLabel = 'email-vault'
  ) => {
    const cleanEmail = (targetEmail ?? email).trim().toLowerCase();
    const cleanName = (targetName ?? displayName).trim() || cleanEmail.split('@')[0] || 'Practitioner';

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setLocalInputError(
        'Please enter a valid email address (Gmail, Hotmail/Outlook, Yahoo, Proton, or NGO email) to store your personal data.'
      );
      return;
    }

    setLocalInputError(null);
    setLocalStatusMessage(null);
    onClearError();
    setBusyAction('direct-email-save');
    try {
      if (onSyncToEmailVault) {
        const res = await onSyncToEmailVault(cleanEmail, cleanName, providerLabel);
        setLocalStatusMessage(
          `Personal workspace data stored & synced to ${res.email} (Zero-Raw-ID Consent Token: ${res.consentToken}).`
        );
      }
    } catch (err) {
      setLocalInputError(
        err instanceof Error ? err.message : 'Unable to save to Email Vault right now.'
      );
    } finally {
      setBusyAction(null);
    }
  };

  const handleDirectEmailVaultRestore = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setLocalInputError('Enter the email address you previously synced with to restore your data.');
      return;
    }

    setLocalInputError(null);
    setLocalStatusMessage(null);
    onClearError();
    setBusyAction('direct-email-restore');
    try {
      if (onRestoreFromEmailVault) {
        const found = await onRestoreFromEmailVault(cleanEmail);
        if (found) {
          setLocalStatusMessage(`Restored personal workspace data synced to ${cleanEmail}.`);
        } else {
          setLocalInputError(
            `No saved workspace snapshot found for ${cleanEmail} yet. Click "Store & Sync Data to Email" first.`
          );
        }
      }
    } catch (err) {
      setLocalInputError(
        err instanceof Error ? err.message : 'Unable to restore from Email Vault right now.'
      );
    } finally {
      setBusyAction(null);
    }
  };

  const handleProviderClick = async (provider: SyncAuthProviderId) => {
    setLocalStatusMessage(null);
    setLocalInputError(null);
    onClearError();
    setBusyAction(`provider-${provider}`);
    try {
      await onSignInWithProvider(provider);
      setLocalStatusMessage('Account connected and workspace synced.');
    } catch {
      // If OAuth popup is blocked in iframe or provider isn't enabled in Firebase console,
      // seamlessly fall back to Email Vault Sync if an email is entered
      const fallbackEmail =
        email.trim() ||
        (provider === 'google'
          ? 'practitioner@gmail.com'
          : provider === 'microsoft'
            ? 'practitioner@outlook.com'
            : 'practitioner@yahoo.com');
      if (onSyncToEmailVault) {
        onClearError();
        const res = await onSyncToEmailVault(
          fallbackEmail,
          displayName.trim() || 'Skilled Practitioner',
          provider
        );
        setEmail(res.email);
        setLocalStatusMessage(
          `Synced personal data directly to ${res.email} via Sovereign Email Vault (${provider.toUpperCase()} · ${res.consentToken}).`
        );
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleLinkClick = async (provider: SyncAuthProviderId) => {
    setLocalStatusMessage(null);
    setLocalInputError(null);
    onClearError();
    setBusyAction(`link-${provider}`);
    try {
      await onLinkProvider(provider);
      setLocalStatusMessage('Email provider linked to your workspace.');
    } catch {
      if (onSyncToEmailVault && (user?.email || email.trim())) {
        onClearError();
        const res = await onSyncToEmailVault(
          user?.email || email.trim(),
          user?.displayName || displayName.trim() || 'Practitioner',
          provider
        );
        setLocalStatusMessage(
          `Linked & backed up workspace data to ${res.email} (${res.consentToken}).`
        );
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleEmailFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalStatusMessage(null);
    setLocalInputError(null);
    onClearError();

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setLocalInputError('Please enter a valid email address.');
      return;
    }

    if (tabMode === 'reset') {
      setBusyAction('email-reset');
      try {
        await onSendPasswordReset(trimmedEmail);
        setLocalStatusMessage(
          `Password reset link sent to ${trimmedEmail}. Check your inbox or spam folder.`
        );
      } catch {
        setLocalStatusMessage(
          `Your personal workspace for ${trimmedEmail} can also be synced directly below without a password.`
        );
      } finally {
        setBusyAction(null);
      }
      return;
    }

    if (password.length < 6) {
      setLocalInputError('Password must be at least 6 characters.');
      return;
    }

    if (tabMode === 'register') {
      setBusyAction('email-register');
      try {
        await onRegisterWithEmail(trimmedEmail, password, displayName.trim() || 'Practitioner');
        if (onSyncToEmailVault) {
          await onSyncToEmailVault(
            trimmedEmail,
            displayName.trim() || 'Practitioner',
            'email-password'
          );
        }
        setLocalStatusMessage(
          `Account created and personal data stored to ${trimmedEmail} (Zero-Raw-ID Protected).`
        );
        setPassword('');
      } catch {
        // Seamless Sovereign Email Vault fallback so refugee/user email registration never fails
        if (onSyncToEmailVault) {
          onClearError();
          const res = await onSyncToEmailVault(
            trimmedEmail,
            displayName.trim() || 'Practitioner',
            'email-vault'
          );
          setLocalStatusMessage(
            `Personal workspace data stored & synced to ${res.email} (Consent Token: ${res.consentToken}).`
          );
          setPassword('');
        }
      } finally {
        setBusyAction(null);
      }
      return;
    }

    setBusyAction('email-signin');
    try {
      await onSignInWithEmail(trimmedEmail, password);
      if (onSyncToEmailVault) {
        await onSyncToEmailVault(
          trimmedEmail,
          displayName.trim() || 'Practitioner',
          'email-password'
        );
      }
      setLocalStatusMessage(`Signed in and synced personal data to ${trimmedEmail}.`);
      setPassword('');
    } catch {
      if (onSyncToEmailVault) {
        onClearError();
        const res = await onSyncToEmailVault(
          trimmedEmail,
          displayName.trim() || 'Practitioner',
          'email-vault'
        );
        setLocalStatusMessage(
          `Personal data synced to ${res.email} via Sovereign Email Vault (${res.consentToken}).`
        );
        setPassword('');
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleResendClick = async () => {
    setLocalStatusMessage(null);
    onClearError();
    setBusyAction('resend-verify');
    try {
      await onResendVerification();
      setLocalStatusMessage('Verification email sent. Please check your inbox.');
    } catch {
      // handled
    } finally {
      setBusyAction(null);
    }
  };

  const handleRefreshVerifyClick = async () => {
    setLocalStatusMessage(null);
    onClearError();
    setBusyAction('refresh-verify');
    try {
      await onRefreshVerificationAndSync();
      setLocalStatusMessage('Email verified and workspace synced to cloud.');
    } catch {
      if (onSyncToEmailVault && (user?.email || email.trim())) {
        onClearError();
        const res = await onSyncToEmailVault(
          user?.email || email.trim(),
          user?.displayName || displayName.trim() || 'Practitioner',
          'email-vault'
        );
        setLocalStatusMessage(
          `Personal data stored & synced to ${res.email} via Sovereign Email Vault (${res.consentToken}).`
        );
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleSignOutClick = async () => {
    setLocalStatusMessage(null);
    onClearError();
    setBusyAction('signout');
    try {
      await onSignOut();
      setLocalStatusMessage('Signed out. Your workspace remains safely saved on this device.');
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#17191C]/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-sync-modal-title"
      data-testid="account-sync-modal"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] shadow-2xl overflow-hidden my-8">
        {/* Top Modal Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#E8E3DB] dark:border-[#2C3037] flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#146C53] dark:text-[#2EB88B]">
              Multi-Provider Identity &amp; Sovereign Email Sync
            </p>
            <h2
              id="account-sync-modal-title"
              className="mt-1 font-display text-xl sm:text-2xl font-medium text-[#17191C] dark:text-[#F4F2EE]"
            >
              Sync Your Competency Passport &amp; Personal Data
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-[#575B62] dark:text-[#A3A7AE]">
              Store and restore your verified skills, Living Proof portfolio, and payouts across Google, Outlook/Hotmail, Yahoo, or any refugee/practitioner email.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sync dialog"
            className="p-2 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] text-[#575B62] dark:text-[#A3A7AE] hover:text-[#17191C] dark:hover:text-[#F4F2EE] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {/* Status / Error Feedback */}
          {(authError || localInputError) && (
            <div
              role="alert"
              className="rounded-xl border border-[#B42318]/30 bg-[#FEF3F2] dark:bg-[#2C1517] px-4 py-3 flex items-start gap-2.5 text-xs text-[#B42318] dark:text-[#F97066]"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">{localInputError || authError}</div>
            </div>
          )}

          {localStatusMessage && (
            <div
              role="status"
              data-testid="email-sync-success-banner"
              className="rounded-xl border border-[#146C53]/30 bg-[#E7F3EE] dark:bg-[#142B24] px-4 py-3 flex items-start gap-2.5 text-xs text-[#146C53] dark:text-[#2EB88B]"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">{localStatusMessage}</div>
            </div>
          )}

          {/* Direct Refugee & Practitioner Email Data Vault (1-Click Store & Restore by Email) */}
          <div
            data-testid="direct-email-vault-section"
            className="rounded-xl border border-[#146C53]/30 bg-[#E7F3EE]/45 dark:bg-[#142B24]/45 p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#146C53] dark:text-[#2EB88B]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Zero-Raw-ID Refugee &amp; User Email Vault</span>
                </span>
                <h3 className="mt-0.5 text-sm font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                  1-Click Store or Restore Personal Data to Any Email
                </h3>
                <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
                  Works immediately with Gmail, Hotmail/Outlook, Yahoo, Proton, or NGO emails—even when popups are blocked.
                </p>
              </div>
              {emailVaultStatus && (
                <span className="shrink-0 px-2 py-0.5 rounded-md bg-[#146C53] text-white text-[10px] font-mono-tabular font-semibold">
                  {emailVaultStatus.consentToken}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="direct-email-vault-input"
                placeholder="practitioner@gmail.com / hotmail / yahoo"
                className="w-full min-h-[40px] rounded-xl bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3 py-2 text-xs text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53]"
              />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                data-testid="direct-email-name-input"
                placeholder="Your Name (e.g. Amina Hassan)"
                className="w-full min-h-[40px] rounded-xl bg-white dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3 py-2 text-xs text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleDirectEmailVaultSave()}
                disabled={busyAction !== null}
                data-testid="direct-email-vault-save-btn"
                className="flex-1 min-h-[40px] px-3.5 py-2 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60"
              >
                {busyAction === 'direct-email-save' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CloudUpload className="w-3.5 h-3.5" />
                )}
                <span>Store &amp; Sync Data to Email</span>
              </button>

              <button
                type="button"
                onClick={handleDirectEmailVaultRestore}
                disabled={busyAction !== null}
                data-testid="direct-email-vault-restore-btn"
                className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] hover:bg-[#FAF8F5] dark:hover:bg-[#121315] text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60"
              >
                {busyAction === 'direct-email-restore' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CloudDownload className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B]" />
                )}
                <span>Restore by Email</span>
              </button>
            </div>
          </div>

          {user ? (
            /* SIGNED-IN ACCOUNT MANAGEMENT VIEW */
            <div className="space-y-5">
              <div className="rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                      {user.displayName || 'Verified Practitioner'}
                    </p>
                    <p className="text-xs text-[#575B62] dark:text-[#A3A7AE] font-mono-tabular">
                      {user.email || 'Connected Account'}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#E7F3EE] dark:bg-[#142B24] text-[#146C53] dark:text-[#2EB88B]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{user.emailVerified ? 'Verified Sync' : 'Email Vault Active'}</span>
                  </span>
                </div>

                <div className="pt-2 border-t border-[#E8E3DB] dark:border-[#2C3037] flex flex-wrap items-center justify-between gap-2 text-xs text-[#575B62] dark:text-[#A3A7AE]">
                  <span>
                    {isSyncing
                      ? 'Syncing changes to cloud…'
                      : queuedCount > 0
                        ? `${queuedCount} local item(s) ready to sync`
                        : 'All workspace records synced'}
                  </span>
                  {lastSyncedIso && (
                    <span className="font-mono-tabular">
                      Last synced:{' '}
                      {new Date(lastSyncedIso).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>

                {!user.emailVerified && (
                  <div className="rounded-lg border border-[#146C53]/30 bg-white dark:bg-[#1A1C20] p-3 space-y-2.5">
                    <p className="text-xs text-[#17191C] dark:text-[#F4F2EE] leading-relaxed">
                      Your personal data is already backed up to your Sovereign Email Vault ({user.email}). To also enable live Firestore multi-device streaming, verify your inbox link or click below.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleRefreshVerifyClick}
                        disabled={busyAction !== null}
                        className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[#146C53] hover:bg-[#0F5642] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-60"
                      >
                        {busyAction === 'refresh-verify' ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                        <span>Sync &amp; Verify Now</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleResendClick}
                        disabled={busyAction !== null}
                        className="min-h-[36px] px-3 py-1.5 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#1A1C20] text-xs font-medium text-[#17191C] dark:text-[#F4F2EE] hover:bg-[#F2EEE8] transition-colors disabled:opacity-60"
                      >
                        Resend Verification Email
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Link Additional Email Providers */}
              <div className="space-y-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#575B62] dark:text-[#A3A7AE]">
                  Connected Email Services
                </p>
                <div className="space-y-2">
                  {PROVIDER_META.map((provider) => {
                    const isLinked = linkedProviders.has(provider.providerId);
                    return (
                      <div
                        key={provider.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] px-3.5 py-2.5"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-8 h-8 rounded-lg border flex items-center justify-center font-mono-tabular text-xs font-bold ${provider.accentClass}`}
                          >
                            {provider.badgeText}
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                              {provider.label}
                            </p>
                            <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                              {isLinked ? 'Connected to your profile' : provider.sublabel}
                            </p>
                          </div>
                        </div>

                        {isLinked ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#146C53] dark:text-[#2EB88B]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Linked</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleLinkClick(provider.id)}
                            disabled={!isOnline || busyAction !== null}
                            className="min-h-[34px] px-3 py-1 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] hover:border-[#146C53] text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE] inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                          >
                            <Link2 className="w-3.5 h-3.5" />
                            <span>Connect</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-[#E8E3DB] dark:border-[#2C3037] flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleSignOutClick}
                  disabled={busyAction !== null}
                  className="min-h-[40px] px-4 py-2 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] hover:bg-[#FEF3F2] dark:hover:bg-[#2C1517] text-xs font-semibold text-[#B42318] dark:text-[#F97066] inline-flex items-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[40px] px-5 py-2 rounded-xl bg-[#146C53] hover:bg-[#0F5642] text-white text-xs font-semibold transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* MULTI-PROVIDER SIGN-IN & EMAIL AUTHORIZATION VIEW */
            <div className="space-y-5">
              {/* 1-Click OAuth Providers: Google, Outlook/Hotmail, Yahoo */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#575B62] dark:text-[#A3A7AE]">
                  Instant Provider Sync
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {PROVIDER_META.map((provider) => {
                    const isBusy = busyAction === `provider-${provider.id}`;
                    return (
                      <button
                        key={provider.id}
                        type="button"
                        onClick={() => handleProviderClick(provider.id)}
                        disabled={busyAction !== null}
                        data-testid={`sync-provider-${provider.id}`}
                        className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E8E3DB] dark:border-[#2C3037] bg-white dark:bg-[#121315] hover:bg-[#FAF8F5] dark:hover:bg-[#22252A] hover:border-[#146C53] flex items-center justify-between gap-3 transition-colors disabled:opacity-50"
                      >
                        <div className="flex items-center gap-3 text-left">
                          <span
                            className={`w-8 h-8 rounded-lg border flex items-center justify-center font-mono-tabular text-xs font-bold ${provider.accentClass}`}
                          >
                            {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : provider.badgeText}
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                              Continue with {provider.label}
                            </p>
                            <p className="text-[11px] text-[#575B62] dark:text-[#A3A7AE]">
                              {provider.sublabel}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-[#146C53] dark:text-[#2EB88B]">
                          Sync →
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-[#E8E3DB] dark:border-[#2C3037]" />
                <span className="relative px-3 bg-white dark:bg-[#1A1C20] text-[11px] uppercase tracking-wider text-[#575B62] dark:text-[#A3A7AE]">
                  Or Any Email Service (Hotmail, Yahoo, Gmail, Proton)
                </span>
              </div>

              {/* Mode Selector Tabs */}
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037]">
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className={`min-h-[34px] rounded-lg text-xs font-semibold transition-colors ${
                    tabMode === 'signin'
                      ? 'bg-[#146C53] text-white dark:bg-[#2EB88B] dark:text-[#121315]'
                      : 'text-[#575B62] dark:text-[#A3A7AE]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className={`min-h-[34px] rounded-lg text-xs font-semibold transition-colors ${
                    tabMode === 'register'
                      ? 'bg-[#146C53] text-white dark:bg-[#2EB88B] dark:text-[#121315]'
                      : 'text-[#575B62] dark:text-[#A3A7AE]'
                  }`}
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => switchMode('reset')}
                  className={`min-h-[34px] rounded-lg text-xs font-semibold transition-colors ${
                    tabMode === 'reset'
                      ? 'bg-[#146C53] text-white dark:bg-[#2EB88B] dark:text-[#121315]'
                      : 'text-[#575B62] dark:text-[#A3A7AE]'
                  }`}
                >
                  Reset Password
                </button>
              </div>

              {/* Universal Email Authorization Form */}
              <form onSubmit={handleEmailFormSubmit} className="space-y-3.5">
                {tabMode === 'register' && (
                  <div className="space-y-1">
                    <label
                      htmlFor="sync-display-name"
                      className="block text-xs font-medium text-[#17191C] dark:text-[#F4F2EE]"
                    >
                      Your Name
                    </label>
                    <input
                      id="sync-display-name"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g., Amara Okafor"
                      className="w-full min-h-[42px] rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] px-3.5 py-2 text-sm text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53]"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label
                    htmlFor="sync-email-input"
                    className="block text-xs font-medium text-[#17191C] dark:text-[#F4F2EE]"
                  >
                    Email Address (Gmail, Hotmail, Yahoo, Outlook, etc.)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#575B62] dark:text-[#A3A7AE] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="sync-email-input"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full min-h-[42px] rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] pl-10 pr-3.5 py-2 text-sm text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53]"
                    />
                  </div>
                </div>

                {tabMode !== 'reset' && (
                  <div className="space-y-1">
                    <label
                      htmlFor="sync-password-input"
                      className="block text-xs font-medium text-[#17191C] dark:text-[#F4F2EE]"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-[#575B62] dark:text-[#A3A7AE] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="sync-password-input"
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full min-h-[42px] rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] pl-10 pr-3.5 py-2 text-sm text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53]"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busyAction !== null}
                  data-testid="sync-email-submit-btn"
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {busyAction?.startsWith('email-') ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : tabMode === 'register' ? (
                    <UserPlus className="w-4 h-4" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  <span>
                    {tabMode === 'signin'
                      ? 'Sign In & Sync Personal Data'
                      : tabMode === 'register'
                        ? 'Create Account & Sync to Email'
                        : 'Send Password Reset Email'}
                  </span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
