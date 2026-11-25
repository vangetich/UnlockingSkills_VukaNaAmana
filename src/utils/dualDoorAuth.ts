import crypto from 'node:crypto';
import type {
  AgeStage,
  PartnerMember,
  PartnerMemberRole,
  PartnerOrganization,
  PartnerSessionClaims,
  TalentAccount,
  TalentAuthChannel,
  TalentAuthMethod,
  TalentSessionClaims,
} from '../types/kora.ts';
import { validateFullInternationalMobile } from './phoneValidation.ts';

export const TALENT_SESSION_COOKIE = 'vna_talent_sid' as const;
export const PARTNER_SESSION_COOKIE = 'vna_partner_sid' as const;
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours
const CHALLENGE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const PIN_ENROLLMENT_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_CHALLENGE_ATTEMPTS = 5;
const BRUTE_FORCE_COOLDOWN_MS = 30 * 1000; // 30-second calm lockout cooldown in demo mode

const RECOVERY_WORDS = [
  'bridge',
  'cedar',
  'dawn',
  'harbor',
  'olive',
  'lantern',
  'river',
  'summit',
  'amber',
  'compass',
  'meadow',
  'horizon',
  'acacia',
  'beacon',
  'oasis',
  'pebble',
  'starlight',
  'willow',
  'harvest',
  'breeze',
  'shelter',
  'journey',
  'craft',
  'promise',
  'canyon',
  'solstice',
  'timber',
  'veranda',
  'compassion',
  'sunrise',
] as const;

export class AuthLockoutError extends Error {
  public readonly retryAfterSeconds: number;

  constructor(message: string, retryAfterSeconds: number) {
    super(message);
    this.name = 'AuthLockoutError';
    this.retryAfterSeconds = Math.max(1, Math.ceil(retryAfterSeconds));
  }
}

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'icloud.com',
  'aol.com',
  'protonmail.com',
  'proton.me',
  'mail.com',
]);

// Ephemeral cryptographically strong fallback when VNA_AUTH_SIGNING_SECRET is not set in env
const EPHEMERAL_FALLBACK_SECRET = crypto.randomBytes(32).toString('hex');

function getAuthSigningSecret(): string {
  const configured = process.env.VNA_AUTH_SIGNING_SECRET?.trim();
  return configured && configured.length >= 16 ? configured : EPHEMERAL_FALLBACK_SECRET;
}

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (normalized.length % 4)) % 4;
  return Buffer.from(normalized + '='.repeat(padLen), 'base64').toString('utf8');
}

function signTokenPayload<T extends { aud: 'vna-talent' | 'vna-partner' }>(payload: T): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const data = `${header}.${body}`;
  const sig = crypto
    .createHmac('sha256', `${getAuthSigningSecret()}::${payload.aud}`)
    .update(data)
    .digest();
  return `${data}.${base64UrlEncode(sig)}`;
}

function verifyTokenPayload<T extends { sid: string; exp: number; aud: 'vna-talent' | 'vna-partner' }>(
  token: string,
  expectedAudience: 'vna-talent' | 'vna-partner',
  revokedSids: Set<string>
): T | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerPart, bodyPart, sigPart] = parts;
  const data = `${headerPart}.${bodyPart}`;

  const expectedSigBuf = crypto
    .createHmac('sha256', `${getAuthSigningSecret()}::${expectedAudience}`)
    .update(data)
    .digest();
  const actualSigBuf = Buffer.from(
    sigPart.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (sigPart.length % 4)) % 4),
    'base64'
  );

  if (expectedSigBuf.length !== actualSigBuf.length) return null;
  if (!crypto.timingSafeEqual(expectedSigBuf, actualSigBuf)) return null;

  try {
    const parsed = JSON.parse(base64UrlDecode(bodyPart)) as T;
    if (!parsed || parsed.aud !== expectedAudience) return null;
    if (typeof parsed.exp !== 'number' || parsed.exp <= Math.floor(Date.now() / 1000)) return null;
    if (!parsed.sid || revokedSids.has(parsed.sid)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function hashChallengeCode(challengeId: string, code: string): Buffer {
  return crypto
    .createHmac('sha256', getAuthSigningSecret())
    .update(`${challengeId}::${code.trim()}`)
    .digest();
}

function createSaltedPinHash(pin: string): { salt: string; hashHex: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(pin.trim(), salt, 32);
  return { salt, hashHex: derived.toString('hex') };
}

function verifySaltedPinHash(pin: string, salt: string, expectedHashHex: string): boolean {
  const derived = crypto.scryptSync(pin.trim(), salt, 32);
  const expected = Buffer.from(expectedHashHex, 'hex');
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

function generateRecoveryPhrase(): string {
  const chosen: string[] = [];
  const used = new Set<number>();
  while (chosen.length < 3) {
    const idx = crypto.randomInt(0, RECOVERY_WORDS.length);
    if (!used.has(idx)) {
      used.add(idx);
      chosen.push(RECOVERY_WORDS[idx]);
    }
  }
  return chosen.join('-');
}

interface PendingChallenge {
  challengeId: string;
  realm: 'talent' | 'partner';
  codeHash: Buffer;
  expiresAtMs: number;
  attempts: number;
  lockedUntilMs?: number;
  meta: Record<string, string>;
}

interface PendingPinEnrollment {
  enrollmentId: string;
  builderId: string;
  displayName: string;
  ageStage: AgeStage;
  pinSalt: string;
  pinHashHex: string;
  recoverySalt: string;
  recoveryHashHex: string;
  expiresAtMs: number;
  attempts: number;
  lockedUntilMs?: number;
}

interface StoredPinCredential {
  accountKey: string;
  builderId: string;
  displayNameLower: string;
  pinSalt: string;
  pinHashHex: string;
  recoverySalt: string;
  recoveryHashHex: string;
}

interface AttemptGuardRecord {
  attempts: number;
  lockedUntilMs: number;
}

/**
 * Isolated Talent Auth Realm (`talent_accounts`)
 * Supports:
 * - Path A: Standard 2FA via Phone / WhatsApp OTP or Email Magic Code (`authMethod: "otp_2fa"`)
 * - Path B: No-Phone Dedicated Crossing PIN (`authMethod: "dedicated_pin"`, salted scrypt hash only)
 * Issues strictly scoped `vna_talent_sid` sessions (`role: "builder"`, `aud: "vna-talent"`, `twoFactorVerified: true`).
 */
export class TalentAuthRealm {
  private talentAccounts = new Map<string, TalentAccount>();
  private challenges = new Map<string, PendingChallenge>();
  private pendingPinEnrollments = new Map<string, PendingPinEnrollment>();
  private pinCredentialsByBuilderId = new Map<string, StoredPinCredential>();
  private pinLoginGuards = new Map<string, AttemptGuardRecord>();
  private activeSessionIds = new Set<string>();
  private revokedSessionIds = new Set<string>();

  constructor() {
    // Seed a dignified demo builder account
    const nowIso = new Date().toISOString();
    this.talentAccounts.set('demo-builder@vuka.local', {
      id: 'tal_demo_builder_01',
      builderId: 'VNA-B-1024',
      displayName: 'Amina Hassan',
      contactChannel: 'whatsapp',
      contactIdentifier: '+254 712 ••• 890',
      ageStage: '30-45',
      authMethod: 'otp_2fa',
      twoFactorVerified: true,
      isDemo: true,
      createdAtIso: nowIso,
      lastLoginAtIso: nowIso,
    });
  }

  private generateUniqueBuilderId(): string {
    for (let i = 0; i < 20; i += 1) {
      const code = crypto.randomInt(1000, 9999);
      const candidate = `VNA-B-${code}`;
      if (!this.pinCredentialsByBuilderId.has(candidate)) {
        return candidate;
      }
    }
    return `VNA-B-${crypto.randomInt(10000, 99999)}`;
  }

  public requestChallenge(input: {
    channel: TalentAuthChannel;
    identifier: string;
    countryDialCode?: string;
    displayName?: string;
    ageStage?: AgeStage;
  }): { challengeId: string; maskedTarget: string; previewCode: string; expiresInSeconds: number } {
    const channel: TalentAuthChannel =
      input.channel === 'whatsapp' || input.channel === 'phone' ? input.channel : 'email';
    let normalizedIdentifier = String(input.identifier || '').trim();

    if (channel === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedIdentifier) || normalizedIdentifier.length > 120) {
        throw new Error('Please enter a valid email address for your 6-digit verification code.');
      }
    } else {
      const phoneCheck = validateFullInternationalMobile(
        normalizedIdentifier,
        input.countryDialCode
      );
      if (!phoneCheck.valid) {
        throw new Error(phoneCheck.advisory);
      }
      normalizedIdentifier = phoneCheck.fullNumber;
    }

    const challengeId = `tchal_${crypto.randomBytes(12).toString('hex')}`;
    const code = String(crypto.randomInt(100000, 999999));

    this.challenges.set(challengeId, {
      challengeId,
      realm: 'talent',
      codeHash: hashChallengeCode(challengeId, code),
      expiresAtMs: Date.now() + CHALLENGE_TTL_MS,
      attempts: 0,
      meta: {
        channel,
        identifier: normalizedIdentifier.toLowerCase(),
        displayName: String(input.displayName || '').trim().slice(0, 80),
        ageStage: input.ageStage || '30-45',
      },
    });

    const maskedTarget =
      channel === 'email'
        ? normalizedIdentifier.replace(/^(.{2}).+(@.+)$/, '$1•••$2')
        : normalizedIdentifier.replace(/^(.{4}).+(.{3})$/, '$1 ••• $2');

    return {
      challengeId,
      maskedTarget,
      previewCode: code,
      expiresInSeconds: Math.round(CHALLENGE_TTL_MS / 1000),
    };
  }

  public verifyChallenge(input: {
    challengeId: string;
    code: string;
    trustedDevice?: boolean;
  }): { token: string; claims: TalentSessionClaims; account: TalentAccount } {
    const challenge = this.challenges.get(input.challengeId);
    if (!challenge || challenge.realm !== 'talent') {
      throw new Error('Verification code expired or not found. Please request a fresh code.');
    }
    const now = Date.now();
    if (now > challenge.expiresAtMs) {
      this.challenges.delete(input.challengeId);
      throw new Error('Verification code expired. Please request a new code.');
    }
    if (challenge.lockedUntilMs && now < challenge.lockedUntilMs) {
      const remaining = Math.ceil((challenge.lockedUntilMs - now) / 1000);
      throw new AuthLockoutError(
        `Too many invalid attempts. For your protection, please wait ${remaining}s and try again.`,
        remaining
      );
    }
    if (challenge.attempts >= MAX_CHALLENGE_ATTEMPTS) {
      challenge.lockedUntilMs = now + BRUTE_FORCE_COOLDOWN_MS;
      const remaining = Math.ceil(BRUTE_FORCE_COOLDOWN_MS / 1000);
      throw new AuthLockoutError(
        `Too many invalid attempts. For your protection, please wait ${remaining}s or request a fresh code.`,
        remaining
      );
    }

    const rawCode = String(input.code || '').trim();
    if (!/^\d{6}$/.test(rawCode)) {
      throw new Error(
        'Verification code must contain numerals only (6 digits, 0–9) — no letters, spaces, or special symbols.'
      );
    }
    challenge.attempts += 1;
    const candidateHash = hashChallengeCode(challenge.challengeId, rawCode);
    if (
      candidateHash.length !== challenge.codeHash.length ||
      !crypto.timingSafeEqual(candidateHash, challenge.codeHash)
    ) {
      if (challenge.attempts >= MAX_CHALLENGE_ATTEMPTS) {
        challenge.lockedUntilMs = now + BRUTE_FORCE_COOLDOWN_MS;
        const remaining = Math.ceil(BRUTE_FORCE_COOLDOWN_MS / 1000);
        throw new AuthLockoutError(
          `Too many invalid attempts. Take a brief ${remaining}s pause before trying again, or request a fresh code.`,
          remaining
        );
      }
      const attemptsLeft = MAX_CHALLENGE_ATTEMPTS - challenge.attempts;
      throw new Error(
        `Code does not match. Please double-check the 6-digit code (${attemptsLeft} ${attemptsLeft === 1 ? 'try' : 'tries'} left before a brief cooldown).`
      );
    }

    this.challenges.delete(challenge.challengeId);

    const key = `${challenge.meta.channel}:${challenge.meta.identifier}`;
    const nowIso = new Date().toISOString();
    const existing = this.talentAccounts.get(key);
    const displayName =
      challenge.meta.displayName ||
      existing?.displayName ||
      (challenge.meta.channel === 'email'
        ? challenge.meta.identifier.split('@')[0]
        : 'Skilled Builder');

    const account: TalentAccount = existing
      ? {
          ...existing,
          displayName,
          ageStage: (challenge.meta.ageStage as AgeStage) || existing.ageStage,
          authMethod: 'otp_2fa',
          twoFactorVerified: true,
          lastLoginAtIso: nowIso,
        }
      : {
          id: `tal_${crypto.randomBytes(8).toString('hex')}`,
          builderId: this.generateUniqueBuilderId(),
          displayName,
          contactChannel: challenge.meta.channel as TalentAuthChannel,
          contactIdentifier: challenge.meta.identifier,
          ageStage: (challenge.meta.ageStage as AgeStage) || '30-45',
          authMethod: 'otp_2fa',
          twoFactorVerified: true,
          isDemo: false,
          createdAtIso: nowIso,
          lastLoginAtIso: nowIso,
        };

    this.talentAccounts.set(key, account);
    return this.mintSessionForAccount(account, 'otp_2fa', Boolean(input.trustedDevice));
  }

  /**
   * Path B (Step 1): Generate a Dedicated Crossing PIN for builders without a phone number.
   * Cryptographically generates Builder ID (VNA-B-XXXX), 6-digit PIN, and 3-word recovery phrase.
   * Stores ONLY salted scrypt hashes in pending enrollment — never plaintext PIN.
   */
  public generateDedicatedPinEnrollment(input: {
    displayName: string;
    ageStage?: AgeStage;
  }): {
    enrollmentId: string;
    builderId: string;
    pin: string;
    recoveryPhrase: string;
    displayName: string;
    ageStage: AgeStage;
    expiresInSeconds: number;
  } {
    const cleanName = String(input.displayName || '').trim().slice(0, 80);
    if (cleanName.length < 2) {
      throw new Error('Please enter a dignified display name or alias (at least 2 characters).');
    }

    const ageStage: AgeStage =
      input.ageStage === '15-17' ||
      input.ageStage === '18-29' ||
      input.ageStage === '30-45' ||
      input.ageStage === '46+'
        ? input.ageStage
        : '30-45';

    const enrollmentId = `pinenr_${crypto.randomBytes(12).toString('hex')}`;
    const builderId = this.generateUniqueBuilderId();
    const pin = String(crypto.randomInt(100000, 999999));
    const recoveryPhrase = generateRecoveryPhrase();

    const { salt: pinSalt, hashHex: pinHashHex } = createSaltedPinHash(pin);
    const { salt: recoverySalt, hashHex: recoveryHashHex } = createSaltedPinHash(recoveryPhrase);

    this.pendingPinEnrollments.set(enrollmentId, {
      enrollmentId,
      builderId,
      displayName: cleanName,
      ageStage,
      pinSalt,
      pinHashHex,
      recoverySalt,
      recoveryHashHex,
      expiresAtMs: Date.now() + PIN_ENROLLMENT_TTL_MS,
      attempts: 0,
    });

    return {
      enrollmentId,
      builderId,
      pin,
      recoveryPhrase,
      displayName: cleanName,
      ageStage,
      expiresInSeconds: Math.round(PIN_ENROLLMENT_TTL_MS / 1000),
    };
  }

  /**
   * Path B (Step 2 — 2FA Confirmation Gate):
   * Builder re-enters their generated 6-digit PIN once to prove they saved it safely.
   * Stores ONLY the salted hash on the persisted builder credential and mints `vna_talent_sid`.
   */
  public confirmDedicatedPinEnrollment(input: {
    enrollmentId: string;
    pin: string;
    trustedDevice?: boolean;
  }): { token: string; claims: TalentSessionClaims; account: TalentAccount } {
    const enrollment = this.pendingPinEnrollments.get(input.enrollmentId);
    if (!enrollment) {
      throw new Error('PIN setup session expired. Please generate a fresh Dedicated PIN.');
    }

    const now = Date.now();
    if (now > enrollment.expiresAtMs) {
      this.pendingPinEnrollments.delete(input.enrollmentId);
      throw new Error('PIN setup session expired. Please generate a fresh Dedicated PIN.');
    }

    if (enrollment.lockedUntilMs && now < enrollment.lockedUntilMs) {
      const remaining = Math.ceil((enrollment.lockedUntilMs - now) / 1000);
      throw new AuthLockoutError(
        `Too many invalid attempts. Take a calm ${remaining}s pause before re-entering your PIN.`,
        remaining
      );
    }

    const rawPin = String(input.pin || '').trim();
    if (!/^\d{6}$/.test(rawPin)) {
      throw new Error(
        'Dedicated PIN must contain numerals only (6 digits, 0–9) — no letters, spaces, or special symbols.'
      );
    }
    if (!verifySaltedPinHash(rawPin, enrollment.pinSalt, enrollment.pinHashHex)) {
      enrollment.attempts += 1;
      if (enrollment.attempts >= MAX_CHALLENGE_ATTEMPTS) {
        enrollment.lockedUntilMs = now + BRUTE_FORCE_COOLDOWN_MS;
        enrollment.attempts = 0;
        const remaining = Math.ceil(BRUTE_FORCE_COOLDOWN_MS / 1000);
        throw new AuthLockoutError(
          `Too many invalid attempts. Take a calm ${remaining}s pause before re-entering your 6-digit PIN.`,
          remaining
        );
      }
      const left = MAX_CHALLENGE_ATTEMPTS - enrollment.attempts;
      throw new Error(
        `That PIN doesn't match the one shown above. Please check your card and try again (${left} ${left === 1 ? 'try' : 'tries'} left).`
      );
    }

    this.pendingPinEnrollments.delete(input.enrollmentId);

    const nowIso = new Date().toISOString();
    const accountKey = `pin:${enrollment.builderId.toUpperCase()}`;
    const account: TalentAccount = {
      id: `tal_${crypto.randomBytes(8).toString('hex')}`,
      builderId: enrollment.builderId,
      displayName: enrollment.displayName,
      contactChannel: 'dedicated_pin',
      contactIdentifier: enrollment.builderId,
      ageStage: enrollment.ageStage,
      authMethod: 'dedicated_pin',
      twoFactorVerified: true,
      isDemo: false,
      createdAtIso: nowIso,
      lastLoginAtIso: nowIso,
    };

    this.talentAccounts.set(accountKey, account);
    this.pinCredentialsByBuilderId.set(enrollment.builderId.toUpperCase(), {
      accountKey,
      builderId: enrollment.builderId,
      displayNameLower: enrollment.displayName.toLowerCase(),
      pinSalt: enrollment.pinSalt,
      pinHashHex: enrollment.pinHashHex,
      recoverySalt: enrollment.recoverySalt,
      recoveryHashHex: enrollment.recoveryHashHex,
    });

    return this.mintSessionForAccount(account, 'dedicated_pin', Boolean(input.trustedDevice));
  }

  /**
   * Path B (Returning Sign-In):
   * Authenticates by Builder ID (e.g. VNA-B-4821) or Display Alias + 6-Digit Dedicated PIN.
   * Enforces 5-attempt 30s brute-force lockout cooldown.
   */
  public loginWithDedicatedPin(input: {
    identifier: string;
    pin: string;
    trustedDevice?: boolean;
  }): { token: string; claims: TalentSessionClaims; account: TalentAccount } {
    const rawId = String(input.identifier || '').trim();
    const rawPin = String(input.pin || '').trim();
    if (rawId.length < 2) {
      throw new Error('Please enter your Builder ID (e.g., VNA-B-4821) or Display Alias.');
    }
    if (!/^\d{6}$/.test(rawPin)) {
      throw new Error(
        'Dedicated PIN must contain numerals only (6 digits, 0–9) — no letters, spaces, or special symbols.'
      );
    }

    const guardKey = rawId.toLowerCase();
    const now = Date.now();
    const guard = this.pinLoginGuards.get(guardKey) || { attempts: 0, lockedUntilMs: 0 };

    if (guard.lockedUntilMs > now) {
      const remaining = Math.ceil((guard.lockedUntilMs - now) / 1000);
      throw new AuthLockoutError(
        `Too many invalid attempts. For your protection, please wait ${remaining}s before trying again.`,
        remaining
      );
    }

    const upperLookup = rawId.toUpperCase();
    let credential = this.pinCredentialsByBuilderId.get(upperLookup);
    if (!credential) {
      for (const item of this.pinCredentialsByBuilderId.values()) {
        if (item.displayNameLower === guardKey) {
          credential = item;
          break;
        }
      }
    }

    const valid =
      Boolean(credential) &&
      verifySaltedPinHash(rawPin, credential!.pinSalt, credential!.pinHashHex);

    if (!valid || !credential) {
      guard.attempts += 1;
      if (guard.attempts >= MAX_CHALLENGE_ATTEMPTS) {
        guard.lockedUntilMs = now + BRUTE_FORCE_COOLDOWN_MS;
        guard.attempts = 0;
        this.pinLoginGuards.set(guardKey, guard);
        const remaining = Math.ceil(BRUTE_FORCE_COOLDOWN_MS / 1000);
        throw new AuthLockoutError(
          `Too many invalid attempts. For your protection, please wait ${remaining}s and try again.`,
          remaining
        );
      }
      this.pinLoginGuards.set(guardKey, guard);
      const left = MAX_CHALLENGE_ATTEMPTS - guard.attempts;
      throw new Error(
        `Builder ID/Alias or 6-Digit PIN did not match. Please double-check your PIN card (${left} ${left === 1 ? 'try' : 'tries'} left).`
      );
    }

    this.pinLoginGuards.delete(guardKey);

    const existing = this.talentAccounts.get(credential.accountKey);
    if (!existing) {
      throw new Error('Builder profile could not be found. Please generate a new Dedicated PIN.');
    }

    const updatedAccount: TalentAccount = {
      ...existing,
      authMethod: 'dedicated_pin',
      twoFactorVerified: true,
      lastLoginAtIso: new Date().toISOString(),
    };
    this.talentAccounts.set(credential.accountKey, updatedAccount);
    return this.mintSessionForAccount(updatedAccount, 'dedicated_pin', Boolean(input.trustedDevice));
  }

  public mintDemoBuilderSession(input?: {
    displayName?: string;
    ageStage?: AgeStage;
  }): { token: string; claims: TalentSessionClaims; account: TalentAccount } {
    const nowIso = new Date().toISOString();
    const demoBase = this.talentAccounts.get('demo-builder@vuka.local')!;
    const account: TalentAccount = {
      ...demoBase,
      builderId: demoBase.builderId || 'VNA-B-1024',
      displayName: input?.displayName?.trim().slice(0, 80) || demoBase.displayName,
      ageStage: input?.ageStage || demoBase.ageStage,
      authMethod: 'otp_2fa',
      twoFactorVerified: true,
      isDemo: true,
      lastLoginAtIso: nowIso,
    };
    this.talentAccounts.set('demo-builder@vuka.local', account);
    return this.mintSessionForAccount(account, 'otp_2fa', true);
  }

  private mintSessionForAccount(
    account: TalentAccount,
    authMethod: TalentAuthMethod,
    trustedDevice = false
  ): {
    token: string;
    claims: TalentSessionClaims;
    account: TalentAccount;
  } {
    const iat = Math.floor(Date.now() / 1000);
    const sid = `vna_tal_${crypto.randomBytes(16).toString('hex')}`;
    const claims: TalentSessionClaims = {
      sid,
      sub: account.id,
      role: 'builder',
      aud: 'vna-talent',
      displayName: account.displayName,
      builderId: account.builderId,
      contactChannel: account.contactChannel,
      contactIdentifier: account.contactIdentifier,
      twoFactorVerified: true,
      authMethod,
      trustedDevice,
      isDemo: account.isDemo,
      iat,
      exp: iat + SESSION_TTL_SECONDS,
    };
    this.activeSessionIds.add(sid);
    const token = signTokenPayload(claims);
    return { token, claims, account };
  }

  public verifySession(token: string): TalentSessionClaims | null {
    const claims = verifyTokenPayload<TalentSessionClaims>(
      token,
      'vna-talent',
      this.revokedSessionIds
    );
    if (!claims || claims.role !== 'builder') return null;
    return claims;
  }

  public revokeSession(tokenOrSid?: string | null): void {
    if (!tokenOrSid) return;
    if (tokenOrSid.includes('.')) {
      const claims = verifyTokenPayload<TalentSessionClaims>(
        tokenOrSid,
        'vna-talent',
        this.revokedSessionIds
      );
      if (claims?.sid) {
        this.revokedSessionIds.add(claims.sid);
        this.activeSessionIds.delete(claims.sid);
      }
      return;
    }
    this.revokedSessionIds.add(tokenOrSid);
    this.activeSessionIds.delete(tokenOrSid);
  }

  public getStats() {
    return {
      accountsCount: this.talentAccounts.size,
      pinAccountsCount: this.pinCredentialsByBuilderId.size,
      activeSessionsCount: this.activeSessionIds.size,
    };
  }
}

/**
 * Isolated Partner Auth Realm (`partner_orgs` + `partner_members`)
 * Corporate Work Email + Organization Name / Domain verification (`partner_admin` | `hiring_lead`).
 * Issues strictly separate `vna_partner_sid` sessions (`role: "partner"`, `aud: "vna-partner"`).
 */
export class PartnerAuthRealm {
  private partnerOrgs = new Map<string, PartnerOrganization>();
  private partnerMembers = new Map<string, PartnerMember>();
  private challenges = new Map<string, PendingChallenge>();
  private activeSessionIds = new Set<string>();
  private revokedSessionIds = new Set<string>();

  constructor() {
    const nowIso = new Date().toISOString();
    const demoOrg: PartnerOrganization = {
      id: 'org_solargrid_ea',
      name: 'SolarGrid East Africa',
      verifiedDomain: 'solargridea.org',
      sector: 'Green Energy & Microgrids',
      country: 'Kenya / East Africa',
      complianceVerified: true,
      createdAtIso: nowIso,
    };
    this.partnerOrgs.set(demoOrg.verifiedDomain, demoOrg);

    const demoMember: PartnerMember = {
      id: 'pmem_demo_solargrid_01',
      orgId: demoOrg.id,
      orgName: demoOrg.name,
      orgDomain: demoOrg.verifiedDomain,
      workEmail: 'hiring@solargridea.org',
      displayName: 'Grace Wambui',
      memberRole: 'hiring_lead',
      isDemo: true,
      createdAtIso: nowIso,
      lastLoginAtIso: nowIso,
    };
    this.partnerMembers.set(demoMember.workEmail, demoMember);
  }

  public requestChallenge(input: {
    workEmail: string;
    organizationName: string;
    memberRole: PartnerMemberRole;
    displayName?: string;
  }): {
    challengeId: string;
    orgDomain: string;
    maskedEmail: string;
    previewCode: string;
    expiresInSeconds: number;
  } {
    const workEmail = String(input.workEmail || '').trim().toLowerCase();
    const organizationName = String(input.organizationName || '').trim().slice(0, 100);
    const memberRole: PartnerMemberRole =
      input.memberRole === 'partner_admin' ? 'partner_admin' : 'hiring_lead';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(workEmail) || workEmail.length > 120) {
      throw new Error('Please enter a valid corporate or NGO work email address.');
    }

    const domain = workEmail.split('@')[1] || '';
    if (!domain || FREE_EMAIL_DOMAINS.has(domain)) {
      throw new Error(
        'Partner Console requires an organizational work domain (e.g., name@organization.org) — or use 1-Click Demo Access below.'
      );
    }

    if (organizationName.length < 2) {
      throw new Error('Please enter your organization or company name.');
    }

    const challengeId = `pchal_${crypto.randomBytes(12).toString('hex')}`;
    const code = String(crypto.randomInt(100000, 999999));

    this.challenges.set(challengeId, {
      challengeId,
      realm: 'partner',
      codeHash: hashChallengeCode(challengeId, code),
      expiresAtMs: Date.now() + CHALLENGE_TTL_MS,
      attempts: 0,
      meta: {
        workEmail,
        orgDomain: domain,
        organizationName,
        memberRole,
        displayName: String(input.displayName || '').trim().slice(0, 80),
      },
    });

    const maskedEmail = workEmail.replace(/^(.{2}).+(@.+)$/, '$1•••$2');

    return {
      challengeId,
      orgDomain: domain,
      maskedEmail,
      previewCode: code,
      expiresInSeconds: Math.round(CHALLENGE_TTL_MS / 1000),
    };
  }

  public verifyChallenge(input: {
    challengeId: string;
    code: string;
  }): { token: string; claims: PartnerSessionClaims; member: PartnerMember; org: PartnerOrganization } {
    const challenge = this.challenges.get(input.challengeId);
    if (!challenge || challenge.realm !== 'partner') {
      throw new Error('Partner verification code expired or not found. Please request a new code.');
    }
    if (Date.now() > challenge.expiresAtMs) {
      this.challenges.delete(input.challengeId);
      throw new Error('Partner verification code expired. Please request a fresh code.');
    }
    if (challenge.attempts >= MAX_CHALLENGE_ATTEMPTS) {
      this.challenges.delete(input.challengeId);
      throw new Error('Too many invalid attempts. Please request a fresh verification code.');
    }

    const rawCode = String(input.code || '').trim();
    if (!/^\d{6}$/.test(rawCode)) {
      throw new Error(
        'Partner verification code must contain numerals only (6 digits, 0–9) — no letters, spaces, or special symbols.'
      );
    }

    challenge.attempts += 1;
    const candidateHash = hashChallengeCode(challenge.challengeId, rawCode);
    if (
      candidateHash.length !== challenge.codeHash.length ||
      !crypto.timingSafeEqual(candidateHash, challenge.codeHash)
    ) {
      throw new Error('Verification code does not match. Please check your 6-digit code.');
    }

    this.challenges.delete(challenge.challengeId);

    const nowIso = new Date().toISOString();
    const domain = challenge.meta.orgDomain;
    let org = this.partnerOrgs.get(domain);
    if (!org) {
      org = {
        id: `org_${crypto.randomBytes(6).toString('hex')}`,
        name: challenge.meta.organizationName,
        verifiedDomain: domain,
        sector: 'Verified Hiring Partner',
        country: 'Global / Regional',
        complianceVerified: true,
        createdAtIso: nowIso,
      };
      this.partnerOrgs.set(domain, org);
    }

    const workEmail = challenge.meta.workEmail;
    const existingMember = this.partnerMembers.get(workEmail);
    const displayName =
      challenge.meta.displayName ||
      existingMember?.displayName ||
      workEmail
        .split('@')[0]
        .replace(/[._-]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

    const member: PartnerMember = existingMember
      ? {
          ...existingMember,
          displayName,
          orgName: org.name,
          memberRole: challenge.meta.memberRole as PartnerMemberRole,
          lastLoginAtIso: nowIso,
        }
      : {
          id: `pmem_${crypto.randomBytes(8).toString('hex')}`,
          orgId: org.id,
          orgName: org.name,
          orgDomain: org.verifiedDomain,
          workEmail,
          displayName,
          memberRole: challenge.meta.memberRole as PartnerMemberRole,
          isDemo: false,
          createdAtIso: nowIso,
          lastLoginAtIso: nowIso,
        };

    this.partnerMembers.set(workEmail, member);
    return this.mintSessionForMember(member, org);
  }

  public mintDemoPartnerSession(memberRole: PartnerMemberRole = 'hiring_lead'): {
    token: string;
    claims: PartnerSessionClaims;
    member: PartnerMember;
    org: PartnerOrganization;
  } {
    const nowIso = new Date().toISOString();
    const org = this.partnerOrgs.get('solargridea.org')!;
    const demoBase = this.partnerMembers.get('hiring@solargridea.org')!;
    const member: PartnerMember = {
      ...demoBase,
      memberRole,
      isDemo: true,
      lastLoginAtIso: nowIso,
    };
    this.partnerMembers.set(member.workEmail, member);
    return this.mintSessionForMember(member, org);
  }

  private mintSessionForMember(
    member: PartnerMember,
    org: PartnerOrganization
  ): {
    token: string;
    claims: PartnerSessionClaims;
    member: PartnerMember;
    org: PartnerOrganization;
  } {
    const iat = Math.floor(Date.now() / 1000);
    const sid = `vna_prt_${crypto.randomBytes(16).toString('hex')}`;
    const claims: PartnerSessionClaims = {
      sid,
      sub: member.id,
      role: 'partner',
      aud: 'vna-partner',
      orgId: org.id,
      orgName: org.name,
      orgDomain: org.verifiedDomain,
      workEmail: member.workEmail,
      displayName: member.displayName,
      memberRole: member.memberRole,
      isDemo: member.isDemo,
      iat,
      exp: iat + SESSION_TTL_SECONDS,
    };
    this.activeSessionIds.add(sid);
    const token = signTokenPayload(claims);
    return { token, claims, member, org };
  }

  public verifySession(token: string): PartnerSessionClaims | null {
    const claims = verifyTokenPayload<PartnerSessionClaims>(
      token,
      'vna-partner',
      this.revokedSessionIds
    );
    if (!claims || claims.role !== 'partner') return null;
    return claims;
  }

  public revokeSession(tokenOrSid?: string | null): void {
    if (!tokenOrSid) return;
    if (tokenOrSid.includes('.')) {
      const claims = verifyTokenPayload<PartnerSessionClaims>(
        tokenOrSid,
        'vna-partner',
        this.revokedSessionIds
      );
      if (claims?.sid) {
        this.revokedSessionIds.add(claims.sid);
        this.activeSessionIds.delete(claims.sid);
      }
      return;
    }
    this.revokedSessionIds.add(tokenOrSid);
    this.activeSessionIds.delete(tokenOrSid);
  }

  public getStats() {
    return {
      orgsCount: this.partnerOrgs.size,
      membersCount: this.partnerMembers.size,
      activeSessionsCount: this.activeSessionIds.size,
    };
  }
}

export function parseCookieHeader(cookieHeader?: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const name = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (name) {
      result[name] = decodeURIComponent(val);
    }
  }
  return result;
}

export function buildIsolatedCookieHeader(name: string, value: string, maxAgeSeconds: number): string {
  const encoded = encodeURIComponent(value);
  return `${name}=${encoded}; Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; Secure; SameSite=None; Partitioned`;
}

export function buildClearCookieHeader(name: string): string {
  return `${name}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None; Partitioned`;
}

export const talentAuthRealm = new TalentAuthRealm();
export const partnerAuthRealm = new PartnerAuthRealm();
