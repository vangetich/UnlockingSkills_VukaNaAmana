import React, { useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  Link2,
  MessageSquareQuote,
  Plus,
  Send,
  Trash2,
  UserCheck,
} from 'lucide-react';
import type {
  CompetencyPassport,
  PeerEndorsement,
  SkillCapability,
} from '../types/kora';
import type { TranslationDictionary } from '../utils/i18n';
import { buildEndorsementShareLink } from '../utils/talentEngine';
import { VoiceInput, VoiceTextarea } from './VoiceField';

interface PeerEndorsementPanelProps {
  variant: 'verify' | 'partner';
  endorsements: PeerEndorsement[];
  capabilities: SkillCapability[];
  passport: CompetencyPassport | null;
  speechLang: string;
  t: TranslationDictionary;
  onRequestEndorsement: (input: {
    collaboratorName: string;
    collaboratorRole: string;
    organization: string;
    capabilityTitle: string;
    endorsementText?: string;
    sourceTab: 'verify' | 'unlock';
  }) => PeerEndorsement;
  onCompleteEndorsement: (endorsementId: string, endorsementText: string) => void;
  onDeleteEndorsement?: (endorsementId: string) => void;
}

export const PeerEndorsementPanel: React.FC<PeerEndorsementPanelProps> = ({
  variant,
  endorsements,
  capabilities,
  passport,
  speechLang,
  t,
  onRequestEndorsement,
  onCompleteEndorsement,
  onDeleteEndorsement,
}) => {
  const capabilityOptions = useMemo(() => {
    const list: string[] = [];
    if (passport) {
      for (const s of passport.verifiedSkills) {
        if (!list.includes(s.name)) list.push(s.name);
      }
    }
    for (const c of capabilities) {
      if (!list.includes(c.title)) list.push(c.title);
    }
    if (list.length === 0) {
      list.push('Applied Field Diagnostics & Problem Solving');
    }
    return list;
  }, [capabilities, passport]);

  const [formOpen, setFormOpen] = useState(variant === 'partner');
  const [collaboratorName, setCollaboratorName] = useState('');
  const [collaboratorRole, setCollaboratorRole] = useState('');
  const [organization, setOrganization] = useState('');
  const [capabilityTitle, setCapabilityTitle] = useState(capabilityOptions[0] ?? '');
  const [directQuote, setDirectQuote] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [latestCreatedId, setLatestCreatedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Inline collaborator response composer for pending requests
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyError, setReplyError] = useState<string | null>(null);

  const verifiedEndorsements = endorsements.filter((e) => e.status === 'verified');
  const pendingEndorsements = endorsements.filter((e) => e.status === 'requested');

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://vukanaamana.app';

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const safeCap = (capabilityTitle || capabilityOptions[0] || '').trim();
    if (
      collaboratorName.trim().length < 2 ||
      collaboratorRole.trim().length < 2 ||
      organization.trim().length < 2 ||
      safeCap.length < 2
    ) {
      setFormError('Enter your collaborator’s name, role, organization, and capability.');
      return;
    }
    if (directQuote.trim().length > 0 && directQuote.trim().length < 10) {
      setFormError('Endorsement quote should be at least 10 characters, or leave blank to send a link.');
      return;
    }

    setFormError(null);
    const created = onRequestEndorsement({
      collaboratorName: collaboratorName.trim(),
      collaboratorRole: collaboratorRole.trim(),
      organization: organization.trim(),
      capabilityTitle: safeCap,
      endorsementText: directQuote.trim() || undefined,
      sourceTab: variant === 'partner' ? 'unlock' : 'verify',
    });

    setLatestCreatedId(created.id);
    setCollaboratorName('');
    setCollaboratorRole('');
    setOrganization('');
    setDirectQuote('');
    if (variant === 'verify') {
      setFormOpen(false);
    }
  };

  const handleCopyLink = async (item: PeerEndorsement) => {
    const url = buildEndorsementShareLink(origin, item);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard may be blocked in restricted iframes; still display visual confirmation
    }
    setCopiedId(item.id);
    window.setTimeout(() => setCopiedId((curr) => (curr === item.id ? null : curr)), 2200);
  };

  const handleSubmitReply = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (replyText.trim().length < 10) {
      setReplyError('Please add a brief 1–2 sentence endorsement (at least 10 characters).');
      return;
    }
    setReplyError(null);
    onCompleteEndorsement(id, replyText.trim());
    setRespondingId(null);
    setReplyText('');
  };

  const latestCreated = latestCreatedId
    ? endorsements.find((e) => e.id === latestCreatedId) ?? null
    : null;

  return (
    <div
      data-testid={variant === 'partner' ? 'partner-endorsement-card' : 'verify-endorsement-panel'}
      className={`rounded-2xl border border-[#E8E3DB] dark:border-[#2C3037] p-5 sm:p-7 space-y-6 ${
        variant === 'partner'
          ? 'bg-[#FAF8F5] dark:bg-[#121315]'
          : 'bg-white dark:bg-[#1A1C20]'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-[#E8E3DB] dark:border-[#2C3037]">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#146C53] dark:text-[#2EB88B]">
            {variant === 'partner'
              ? 'Zero-Document Reference Check · Peer Endorsement'
              : 'Living Competency Passport · Peer Endorsements'}
          </p>
          <h2 className="mt-1 font-display text-xl sm:text-2xl font-medium text-[#17191C] dark:text-[#F4F2EE]">
            {variant === 'partner'
              ? 'Verify problem-solving via a past colleague'
              : 'Collaborator endorsements that strengthen your Passport'}
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-[#575B62] dark:text-[#A3A7AE] leading-relaxed">
            {variant === 'partner'
              ? 'Send a secure link to a past colleague or supervisor to confirm specific hands-on capabilities—no diplomas or formal paperwork required.'
              : 'Request a short text note from someone who has seen your work firsthand, or record an endorsement directly onto your Living Competency Passport.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E7F3EE] dark:bg-[#142B24] border border-[#146C53]/25 dark:border-[#2EB88B]/30 text-xs font-semibold font-mono-tabular tabular-nums text-[#146C53] dark:text-[#2EB88B] whitespace-nowrap">
            <UserCheck className="w-3.5 h-3.5" />
            <span>{verifiedEndorsements.length} Verified</span>
          </span>

          {variant === 'verify' && (
            <button
              type="button"
              onClick={() => setFormOpen((v) => !v)}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{formOpen ? 'Close Form' : 'Request Endorsement'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Generated Secure Link Banner */}
      {latestCreated && latestCreated.status === 'requested' && (
        <div
          role="status"
          data-testid="generated-endorsement-link-banner"
          className="rounded-xl bg-[#E7F3EE]/80 dark:bg-[#142B24]/85 border border-[#146C53]/30 dark:border-[#2EB88B]/35 p-4 space-y-2.5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 shrink-0" />
              <span>
                Secure verification link ready for {latestCreated.collaboratorName}
              </span>
            </p>
            <button
              type="button"
              onClick={() => void handleCopyLink(latestCreated)}
              className="min-h-[34px] px-3 py-1 rounded-lg bg-white dark:bg-[#1A1C20] border border-[#146C53]/30 dark:border-[#2EB88B]/35 text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] inline-flex items-center gap-1.5 self-start sm:self-auto whitespace-nowrap"
            >
              {copiedId === latestCreated.id ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Link Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Secure Link</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] font-mono-tabular text-[#575B62] dark:text-[#A3A7AE] break-all bg-white/80 dark:bg-[#121315]/70 rounded-lg px-3 py-2 border border-[#E8E3DB] dark:border-[#2C3037]">
            {buildEndorsementShareLink(origin, latestCreated)}
          </p>
        </div>
      )}

      {/* Request / Record Form */}
      {formOpen && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-[#E8E3DB] dark:border-[#2C3037] p-4 sm:p-5 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <VoiceInput
              id={`endorse-name-${variant}`}
              label="Collaborator Name"
              value={collaboratorName}
              onChange={(v) => {
                setCollaboratorName(v);
                if (formError) setFormError(null);
              }}
              placeholder="e.g., Dr. Grace Wanjiku"
              speechLang={speechLang}
              t={t}
              maxLength={80}
            />

            <VoiceInput
              id={`endorse-role-${variant}`}
              label="Collaborator Role"
              value={collaboratorRole}
              onChange={(v) => {
                setCollaboratorRole(v);
                if (formError) setFormError(null);
              }}
              placeholder="e.g., Operations Lead"
              speechLang={speechLang}
              t={t}
              maxLength={80}
            />

            <VoiceInput
              id={`endorse-org-${variant}`}
              label="Organization or Project"
              value={organization}
              onChange={(v) => {
                setOrganization(v);
                if (formError) setFormError(null);
              }}
              placeholder="e.g., Rift Valley Co-op"
              speechLang={speechLang}
              t={t}
              maxLength={120}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <div className="space-y-1.5">
              <label
                htmlFor={`endorse-cap-${variant}`}
                className="block text-sm font-medium text-[#17191C] dark:text-[#F4F2EE]"
              >
                Capability to Verify
              </label>
              <select
                id={`endorse-cap-${variant}`}
                value={capabilityTitle || capabilityOptions[0]}
                onChange={(e) => setCapabilityTitle(e.target.value)}
                className="w-full min-h-[44px] rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] px-4 py-2.5 text-sm text-[#17191C] dark:text-[#F4F2EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#146C53] dark:focus-visible:ring-[#2EB88B]"
              >
                {capabilityOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {variant === 'verify' && (
              <VoiceTextarea
                id={`endorse-quote-${variant}`}
                label="Collaborator Endorsement Note (optional — leave blank to send link)"
                value={directQuote}
                onChange={(v) => {
                  setDirectQuote(v);
                  if (formError) setFormError(null);
                }}
                placeholder="Optional: paste or dictate a short 1–2 sentence confirmation..."
                speechLang={speechLang}
                t={t}
                maxLength={400}
                rows={2}
              />
            )}
          </div>

          {formError && (
            <p role="alert" className="text-xs font-medium text-[#B42318] dark:text-[#F97066]">
              {formError}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <p className="text-xs text-[#575B62] dark:text-[#A3A7AE]">
              {variant === 'partner'
                ? 'Generates a 1-click secure verification link requiring zero formal credentials.'
                : 'Send a secure link for async verification or save a collaborator quote immediately.'}
            </p>
            <button
              type="submit"
              className="min-h-[42px] px-5 py-2 rounded-xl bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {directQuote.trim().length >= 10
                  ? 'Add Verified Endorsement'
                  : 'Generate Secure Verification Link'}
              </span>
            </button>
          </div>
        </form>
      )}

      {/* Pending Verification Links */}
      {pendingEndorsements.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-[#575B62] dark:text-[#A3A7AE]">
            Pending Collaborator Links ({pendingEndorsements.length})
          </p>
          <div className="space-y-2.5">
            {pendingEndorsements.map((item) => {
              const isReplying = respondingId === item.id;
              return (
                <div
                  key={item.id}
                  data-testid={`pending-endorsement-${item.id}`}
                  className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-4 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                          {item.collaboratorName}
                        </span>
                        <span className="text-[#575B62] dark:text-[#A3A7AE]">
                          · {item.collaboratorRole}, {item.organization}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#C4622D] dark:text-[#E07B46] font-medium">
                        Verifying: {item.capabilityTitle}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => void handleCopyLink(item)}
                        className="min-h-[36px] px-3 py-1.5 rounded-lg border border-[#E8E3DB] dark:border-[#2C3037] bg-[#FAF8F5] dark:bg-[#121315] hover:border-[#146C53] dark:hover:border-[#2EB88B] text-xs font-medium text-[#17191C] dark:text-[#F4F2EE] inline-flex items-center gap-1.5 whitespace-nowrap"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#146C53] dark:text-[#2EB88B]" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setRespondingId(isReplying ? null : item.id);
                          setReplyText('');
                          setReplyError(null);
                        }}
                        className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[#E7F3EE] dark:bg-[#142B24] hover:bg-[#D5EBE2] dark:hover:bg-[#1C3B31] text-xs font-semibold text-[#146C53] dark:text-[#2EB88B] whitespace-nowrap"
                      >
                        {isReplying ? 'Cancel' : 'Record Reply'}
                      </button>

                      {onDeleteEndorsement && (
                        <button
                          type="button"
                          onClick={() => onDeleteEndorsement(item.id)}
                          aria-label={`Remove endorsement request for ${item.collaboratorName}`}
                          className="min-h-[36px] min-w-[36px] rounded-lg text-[#575B62] dark:text-[#A3A7AE] hover:bg-[#F2EEE8] dark:hover:bg-[#22252A] inline-flex items-center justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {isReplying && (
                    <form
                      onSubmit={(e) => handleSubmitReply(e, item.id)}
                      className="pt-3 border-t border-[#E8E3DB] dark:border-[#2C3037] space-y-3"
                    >
                      <VoiceTextarea
                        id={`reply-endorse-${item.id}`}
                        label={`Short endorsement from ${item.collaboratorName}`}
                        value={replyText}
                        onChange={(v) => {
                          setReplyText(v);
                          if (replyError) setReplyError(null);
                        }}
                        placeholder="Describe a real problem this practitioner solved and the outcome..."
                        speechLang={speechLang}
                        t={t}
                        maxLength={400}
                        rows={2}
                      />
                      {replyError && (
                        <p role="alert" className="text-xs font-medium text-[#B42318] dark:text-[#F97066]">
                          {replyError}
                        </p>
                      )}
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="min-h-[38px] px-4 py-1.5 rounded-lg bg-[#146C53] hover:bg-[#0F5642] dark:bg-[#2EB88B] dark:hover:bg-[#259B75] text-white dark:text-[#121315] text-xs font-semibold whitespace-nowrap"
                        >
                          Confirm &amp; Attach to Passport
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Verified Peer Endorsements Grid */}
      {verifiedEndorsements.length === 0 ? (
        <div className="rounded-xl bg-[#FAF8F5] dark:bg-[#121315] border border-dashed border-[#D8D1C5] dark:border-[#2C3037] p-6 text-center">
          <p className="text-sm text-[#575B62] dark:text-[#A3A7AE]">
            No collaborator endorsements attached yet. Send a quick link to a former colleague to strengthen your Living Competency Passport.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {verifiedEndorsements.map((item) => (
            <article
              key={item.id}
              data-testid={`verified-endorsement-${item.id}`}
              className="rounded-xl bg-white dark:bg-[#1A1C20] border border-[#E8E3DB] dark:border-[#2C3037] p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#146C53] dark:text-[#2EB88B]">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Verified Peer Endorsement</span>
                  </span>
                  {onDeleteEndorsement && variant === 'verify' && (
                    <button
                      type="button"
                      onClick={() => onDeleteEndorsement(item.id)}
                      aria-label={`Remove endorsement from ${item.collaboratorName}`}
                      className="min-h-[30px] min-w-[30px] rounded-md text-[#575B62] dark:text-[#A3A7AE] hover:bg-[#F2EEE8] dark:hover:bg-[#22252A] inline-flex items-center justify-center shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-xs font-medium text-[#C4622D] dark:text-[#E07B46]">
                  Capability: {item.capabilityTitle}
                </p>

                <blockquote className="text-sm leading-relaxed text-[#17191C] dark:text-[#F4F2EE] flex items-start gap-2">
                  <MessageSquareQuote className="w-4 h-4 text-[#146C53]/60 dark:text-[#2EB88B]/60 shrink-0 mt-0.5" />
                  <span>“{item.endorsementText}”</span>
                </blockquote>
              </div>

              <footer className="pt-3 border-t border-[#E8E3DB] dark:border-[#2C3037] flex items-center justify-between gap-2 text-xs text-[#575B62] dark:text-[#A3A7AE]">
                <span className="font-semibold text-[#17191C] dark:text-[#F4F2EE]">
                  {item.collaboratorName}
                </span>
                <span className="truncate">
                  {item.collaboratorRole} · {item.organization}
                </span>
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
