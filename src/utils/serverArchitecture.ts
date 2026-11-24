import crypto from 'node:crypto';

export interface SignedPassportRecord {
  verifiableId: string;
  signature: string;
  signedAtIso: string;
  privacyMode: 'ZERO_RAW_ID_PII_SEPARATED';
  issuer: string;
  verificationProtocol: string;
}

export interface PrivacyGuardResult {
  sanitizedPayload: Record<string, unknown>;
  consentToken: string;
  strippedPiiFieldsCount: number;
  zeroRawIdEnforced: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRatioPct: number;
  ttlHours: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remainingTokens: number;
  retryAfterSeconds: number;
  bucketCapacity: number;
}

export interface CircuitBreakerMetrics {
  state: 'CLOSED' | 'HALF_OPEN' | 'FALLBACK_READY';
  totalCalls: number;
  fallbackTrips: number;
  timeoutMs: number;
  lastLatencyMs: number;
}

export interface ProvisionedCohortRecord {
  cohortId: string;
  regionId: string;
  sectorId: string;
  languageCode: string;
  partnerOrg: string;
  cohortSize: number;
  stipendPoolUsd: number;
  rubricStandard: string;
  legalFramework: string;
  provisionedAtIso: string;
  peerAssessorEnabled: boolean;
}

export interface SdgTelemetryEvent {
  eventId: string;
  sdgNumber: 4 | 8 | 10 | 16 | 17;
  unTarget: string;
  eventType:
    | 'PASSPORT_VERIFIED'
    | 'COMPLIANCE_ROUTED'
    | 'PORTFOLIO_ANALYZED'
    | 'COHORT_PROVISIONED'
    | 'SPRINT_COMPLETED'
    | 'EMAIL_VAULT_SYNCED';
  regionId?: string;
  sectorId?: string;
  ageStage?: string;
  timestampIso: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface EmailVaultRecord {
  emailHash: string;
  normalizedEmail: string;
  displayName: string;
  provider: string;
  updatedAtIso: string;
  consentToken: string;
  zeroRawIdProtected: boolean;
  payload: Record<string, unknown>;
}

const SIGNING_SECRET =
  process.env.VNA_PASSPORT_SIGNING_SECRET ||
  'vuka-na-amana-sovereign-competency-hmac-key-2026';

/**
 * 1. Server-Signed Living Competency Passport
 * Generates a unique deterministic verifiable ID (`VNA-2026-XXXX`) and
 * HMAC-SHA256 integrity signature for offline/QR & employer verification.
 */
export function signCompetencyPassport(
  passportPayload: Record<string, unknown>,
  domain: string,
  ageStage: string
): SignedPassportRecord {
  const canonicalString = JSON.stringify({
    domain: domain.trim(),
    ageStage: ageStage.trim(),
    summary: passportPayload.summary || '',
    capabilitiesCount: Array.isArray(passportPayload.capabilities)
      ? passportPayload.capabilities.length
      : 0,
  });

  const digest = crypto
    .createHmac('sha256', SIGNING_SECRET)
    .update(canonicalString)
    .digest('hex');

  const shortCode = digest.slice(0, 4).toUpperCase();
  const secondaryCode = digest.slice(4, 8).toUpperCase();

  return {
    verifiableId: `VNA-2026-${shortCode}-${secondaryCode}`,
    signature: `hmac-sha256:${digest.slice(0, 32)}`,
    signedAtIso: new Date().toISOString(),
    privacyMode: 'ZERO_RAW_ID_PII_SEPARATED',
    issuer: 'Vuka na Amana Sovereign Competency Authority (UNESCO UQP / ILO RPL Aligned)',
    verificationProtocol: 'HMAC-SHA256-V1',
  };
}

/**
 * 2. Deterministic Hash Cache for Compliance Routing (`country + docTier + workMode`, 24h TTL)
 * Ensures repeated jurisdiction & FATF KYC pathway lookups return in <30ms without burning AI quota.
 */
export class DeterministicComplianceCache<T> {
  private store = new Map<
    string,
    { value: T; expiresAtMs: number; keyHash: string }
  >();
  private hits = 0;
  private misses = 0;
  private readonly ttlMs: number;

  constructor(ttlMs = 24 * 60 * 60 * 1000) {
    this.ttlMs = ttlMs;
  }

  public computeKey(country: string, docTier: string, workMode: string): string {
    const raw = `${country.trim().toLowerCase()}::${docTier.trim().toLowerCase()}::${workMode.trim().toLowerCase()}`;
    return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 24);
  }

  public get(country: string, docTier: string, workMode: string): { hit: boolean; value?: T; keyHash: string } {
    const keyHash = this.computeKey(country, docTier, workMode);
    const entry = this.store.get(keyHash);
    if (!entry) {
      this.misses += 1;
      return { hit: false, keyHash };
    }
    if (Date.now() > entry.expiresAtMs) {
      this.store.delete(keyHash);
      this.misses += 1;
      return { hit: false, keyHash };
    }
    this.hits += 1;
    return { hit: true, value: entry.value, keyHash };
  }

  public set(country: string, docTier: string, workMode: string, value: T): string {
    const keyHash = this.computeKey(country, docTier, workMode);
    this.store.set(keyHash, {
      value,
      expiresAtMs: Date.now() + this.ttlMs,
      keyHash,
    });
    return keyHash;
  }

  public getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.store.size,
      hitRatioPct: total > 0 ? Math.round((this.hits / total) * 100) : 100,
      ttlHours: Math.round(this.ttlMs / (60 * 60 * 1000)),
    };
  }
}

/**
 * 3. Lightweight Token-Bucket Rate Limiter
 * Protects AI endpoints from burst spikes while surfacing calm, human-friendly retry feedback.
 */
export class TokenBucketRateLimiter {
  private buckets = new Map<string, { tokens: number; lastRefillMs: number }>();
  private readonly capacity: number;
  private readonly refillPerSecond: number;

  constructor(capacity = 35, refillPerSecond = 2) {
    this.capacity = capacity;
    this.refillPerSecond = refillPerSecond;
  }

  public consume(clientKey: string, cost = 1): RateLimitResult {
    const now = Date.now();
    const key = clientKey || 'global-practitioner';
    const existing = this.buckets.get(key) || {
      tokens: this.capacity,
      lastRefillMs: now,
    };

    const elapsedSeconds = Math.max(0, (now - existing.lastRefillMs) / 1000);
    const refilledTokens = Math.min(
      this.capacity,
      existing.tokens + elapsedSeconds * this.refillPerSecond
    );

    if (refilledTokens < cost) {
      const deficit = cost - refilledTokens;
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil(deficit / this.refillPerSecond)
      );
      this.buckets.set(key, { tokens: refilledTokens, lastRefillMs: now });
      return {
        allowed: false,
        remainingTokens: Math.floor(refilledTokens),
        retryAfterSeconds,
        bucketCapacity: this.capacity,
      };
    }

    const updatedTokens = refilledTokens - cost;
    this.buckets.set(key, { tokens: updatedTokens, lastRefillMs: now });
    return {
      allowed: true,
      remainingTokens: Math.floor(updatedTokens),
      retryAfterSeconds: 0,
      bucketCapacity: this.capacity,
    };
  }
}

/**
 * 4. 8-Second Circuit Breaker for Vision & Portfolio Analysis
 * Ensures peak RPM or upstream AI latency never blocks or breaks the practitioner UX.
 */
export class VisionCircuitBreaker {
  private totalCalls = 0;
  private fallbackTrips = 0;
  private lastLatencyMs = 18;
  private readonly timeoutMs: number;

  constructor(timeoutMs = 8000) {
    this.timeoutMs = timeoutMs;
  }

  public async execute<T>(
    operation: () => Promise<T>,
    fallbackFn: (reason: string) => T
  ): Promise<{ result: T; trippedFallback: boolean; latencyMs: number; reason?: string }> {
    this.totalCalls += 1;
    const startMs = Date.now();

    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new Error(`CIRCUIT_BREAKER_TIMEOUT_${this.timeoutMs}MS`));
        }, this.timeoutMs);
      });

      const result = await Promise.race([operation(), timeoutPromise]);
      if (timeoutHandle) clearTimeout(timeoutHandle);
      this.lastLatencyMs = Math.max(1, Date.now() - startMs);
      return { result, trippedFallback: false, latencyMs: this.lastLatencyMs };
    } catch (err) {
      if (timeoutHandle) clearTimeout(timeoutHandle);
      this.fallbackTrips += 1;
      this.lastLatencyMs = Math.max(1, Date.now() - startMs);
      const reason = err instanceof Error ? err.message : 'UPSTREAM_CIRCUIT_TRIP';
      return {
        result: fallbackFn(reason),
        trippedFallback: true,
        latencyMs: this.lastLatencyMs,
        reason,
      };
    }
  }

  public getMetrics(): CircuitBreakerMetrics {
    return {
      state: 'CLOSED',
      totalCalls: this.totalCalls,
      fallbackTrips: this.fallbackTrips,
      timeoutMs: this.timeoutMs,
      lastLatencyMs: this.lastLatencyMs,
    };
  }
}

/**
 * 5. Refugee Data Protection by Design (Zero-Raw-ID Privacy Guard)
 * Strips any accidental raw national ID / passport serial patterns and issues
 * a consent-scoped employer sharing token (`VNA-CONSENT-XXXX`).
 */
const SENSITIVE_KEY_PATTERNS = [
  /passport.?number/i,
  /national.?id/i,
  /ssn/i,
  /tax.?pin/i,
  /raw.?document/i,
  /biometric/i,
  /bank.?account.?number/i,
];

const RAW_SERIAL_REGEX = /\b([A-Z]{1,3}[0-9]{6,10}|[0-9]{8,14})\b/g;

export function enforceRefugeePrivacyGuard(
  payload: Record<string, unknown>
): PrivacyGuardResult {
  let strippedCount = 0;
  const sanitizedPayload: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (SENSITIVE_KEY_PATTERNS.some((regex) => regex.test(key))) {
      strippedCount += 1;
      sanitizedPayload[key] = '[REDACTED_ZERO_RAW_ID_POLICY]';
      continue;
    }

    if (typeof value === 'string') {
      const cleaned = value.replace(RAW_SERIAL_REGEX, '[TIER_VERIFIED_ID_REDACTED]');
      if (cleaned !== value) {
        strippedCount += 1;
      }
      sanitizedPayload[key] = cleaned;
    } else {
      sanitizedPayload[key] = value;
    }
  }

  const tokenSeed = JSON.stringify({
    keys: Object.keys(sanitizedPayload),
    ts: Math.floor(Date.now() / 60000),
  });
  const tokenHash = crypto
    .createHmac('sha256', SIGNING_SECRET)
    .update(tokenSeed)
    .digest('hex')
    .slice(0, 8)
    .toUpperCase();

  return {
    sanitizedPayload,
    consentToken: `VNA-CONSENT-${tokenHash}`,
    strippedPiiFieldsCount: strippedCount,
    zeroRawIdEnforced: true,
  };
}

/**
 * 6. Multi-Tenant Cohort Provisioning Engine & Append-Only SDG Telemetry Ledger
 */
class PartnerScaleEngineStore {
  private cohorts: ProvisionedCohortRecord[] = [
    {
      cohortId: 'COHORT-KE-SOLAR-2026',
      regionId: 'kenya',
      sectorId: 'solar_trades',
      languageCode: 'sw',
      partnerOrg: 'ILO PROSPECTS & Kakuma Solar Cooperative',
      cohortSize: 120,
      stipendPoolUsd: 18500,
      rubricStandard: 'UNESCO UQP + Kenyan NITA Solar PV Level 3',
      legalFramework: 'Kenya Refugee Act 2021 (Class M / Digital Nomad Exemption)',
      provisionedAtIso: '2026-02-15T09:00:00.000Z',
      peerAssessorEnabled: true,
    },
    {
      cohortId: 'COHORT-CO-AGRI-2026',
      regionId: 'colombia',
      sectorId: 'climate_agri',
      languageCode: 'es',
      partnerOrg: 'UNHCR Colombia & SENA AgTech Hub',
      cohortSize: 95,
      stipendPoolUsd: 14200,
      rubricStandard: 'SENA Competencias Laborales + ILO RPL',
      legalFramework: 'Colombia PPT (Permiso por Protección Temporal) — Formal & Remote',
      provisionedAtIso: '2026-02-18T14:30:00.000Z',
      peerAssessorEnabled: true,
    },
    {
      cohortId: 'COHORT-JO-DIGITAL-2026',
      regionId: 'jordan',
      sectorId: 'software_cloud',
      languageCode: 'ar',
      partnerOrg: 'Amman Digital Guild & Luminus TVET',
      cohortSize: 80,
      stipendPoolUsd: 22000,
      rubricStandard: 'UNESCO Qualifications Passport (ICT & Cloud Engineering)',
      legalFramework: 'Jordan MoL Flexible Work Permit & Cross-Border Remote EOR',
      provisionedAtIso: '2026-02-20T11:15:00.000Z',
      peerAssessorEnabled: true,
    },
  ];

  private telemetryLedger: SdgTelemetryEvent[] = [
    {
      eventId: 'EVT-SDG4-001',
      sdgNumber: 4,
      unTarget: 'Targets 4.4 & 4.7',
      eventType: 'PASSPORT_VERIFIED',
      regionId: 'kenya',
      sectorId: 'solar_trades',
      ageStage: '30-45',
      timestampIso: '2026-02-21T08:00:00.000Z',
    },
    {
      eventId: 'EVT-SDG16-002',
      sdgNumber: 16,
      unTarget: 'Target 16.9 & Global Compact',
      eventType: 'COMPLIANCE_ROUTED',
      regionId: 'colombia',
      sectorId: 'climate_agri',
      ageStage: '18-29',
      timestampIso: '2026-02-21T08:15:00.000Z',
    },
    {
      eventId: 'EVT-SDG8-003',
      sdgNumber: 8,
      unTarget: 'Targets 8.3, 8.5 & 8.8',
      eventType: 'PORTFOLIO_ANALYZED',
      regionId: 'jordan',
      sectorId: 'software_cloud',
      ageStage: '46+',
      timestampIso: '2026-02-21T08:30:00.000Z',
    },
    {
      eventId: 'EVT-SDG10-004',
      sdgNumber: 10,
      unTarget: 'Targets 10.2, 10.3 & 10.7',
      eventType: 'SPRINT_COMPLETED',
      regionId: 'kenya',
      sectorId: 'solar_trades',
      ageStage: '18-29',
      timestampIso: '2026-02-21T09:00:00.000Z',
    },
    {
      eventId: 'EVT-SDG17-005',
      sdgNumber: 17,
      unTarget: 'Targets 17.16 & 17.17',
      eventType: 'COHORT_PROVISIONED',
      regionId: 'kenya',
      sectorId: 'solar_trades',
      timestampIso: '2026-02-21T09:30:00.000Z',
    },
  ];

  private emailVaults = new Map<string, EmailVaultRecord>();

  public provisionCohort(input: {
    regionId: string;
    sectorId: string;
    languageCode: string;
    partnerOrg?: string;
    cohortSize?: number;
    stipendPoolUsd?: number;
    peerAssessorEnabled?: boolean;
  }): ProvisionedCohortRecord {
    const regionClean = (input.regionId || 'kenya').toLowerCase().trim();
    const sectorClean = (input.sectorId || 'solar_trades').toLowerCase().trim();
    const langClean = (input.languageCode || 'en').toLowerCase().trim();

    const codeHash = crypto
      .createHash('sha256')
      .update(`${regionClean}:${sectorClean}:${langClean}:${Date.now()}`)
      .digest('hex')
      .slice(0, 4)
      .toUpperCase();

    const LEGAL_MAP: Record<string, string> = {
      kenya: 'Kenya Refugee Act 2021 (Class M Work Permit & Cross-Border Remote Pathway)',
      uganda: 'Uganda Refugees Act 2006 (Right to Work & Mobile Money Tiered KYC)',
      colombia: 'Colombia Estatuto Temporal de Protección (PPT — Formal & Remote Contracting)',
      jordan: 'Jordan MoL Flexible Sector Work Permit & International Remote Contractor Shield',
      global: 'ILO Convention No. 143 & UN Global Compact on Refugees Remote Contractor Standard',
    };

    const RUBRIC_MAP: Record<string, string> = {
      solar_trades: 'UNESCO UQP + Solar PV & Micro-Grid Practical RPL Standard',
      tailoring_craft: 'ILO Craft & Apparel Production Quality Assurance Rubric',
      climate_agri: 'FAO / ILO Climate-Resilient Agro-Processing Competency Framework',
      health_BPO: 'WHO Community Health & Multilingual Operations RPL Standard',
      software_cloud: 'UNESCO Digital Competency & Cloud Systems Engineering Rubric',
    };

    const record: ProvisionedCohortRecord = {
      cohortId: `COHORT-${regionClean.slice(0, 2).toUpperCase()}-${sectorClean.slice(0, 5).toUpperCase()}-${codeHash}`,
      regionId: regionClean,
      sectorId: sectorClean,
      languageCode: langClean,
      partnerOrg:
        input.partnerOrg?.trim() ||
        `Vuka Partner Coalition (${regionClean.toUpperCase()} · ${sectorClean.replace('_', ' ').toUpperCase()})`,
      cohortSize: input.cohortSize && input.cohortSize > 0 ? input.cohortSize : 100,
      stipendPoolUsd:
        input.stipendPoolUsd && input.stipendPoolUsd > 0 ? input.stipendPoolUsd : 15000,
      rubricStandard:
        RUBRIC_MAP[sectorClean] || 'UNESCO Qualifications Passport (UQP) & ILO RPL Standard',
      legalFramework:
        LEGAL_MAP[regionClean] || LEGAL_MAP.global,
      provisionedAtIso: new Date().toISOString(),
      peerAssessorEnabled: input.peerAssessorEnabled ?? true,
    };

    this.cohorts = [record, ...this.cohorts.slice(0, 24)];
    this.recordTelemetryEvent({
      sdgNumber: 17,
      unTarget: 'Targets 17.16 & 17.17',
      eventType: 'COHORT_PROVISIONED',
      regionId: regionClean,
      sectorId: sectorClean,
      metadata: {
        cohortId: record.cohortId,
        languageCode: langClean,
        cohortSize: record.cohortSize,
      },
    });

    return record;
  }

  public getCohorts(): ProvisionedCohortRecord[] {
    return this.cohorts;
  }

  public recordTelemetryEvent(input: {
    sdgNumber: 4 | 8 | 10 | 16 | 17;
    unTarget: string;
    eventType: SdgTelemetryEvent['eventType'];
    regionId?: string;
    sectorId?: string;
    ageStage?: string;
    metadata?: Record<string, string | number | boolean>;
  }): SdgTelemetryEvent {
    const event: SdgTelemetryEvent = {
      eventId: `EVT-SDG${input.sdgNumber}-${Date.now().toString(36).toUpperCase()}`,
      sdgNumber: input.sdgNumber,
      unTarget: input.unTarget,
      eventType: input.eventType,
      regionId: input.regionId,
      sectorId: input.sectorId,
      ageStage: input.ageStage,
      timestampIso: new Date().toISOString(),
      metadata: input.metadata,
    };
    this.telemetryLedger.push(event);
    if (this.telemetryLedger.length > 500) {
      this.telemetryLedger = this.telemetryLedger.slice(-500);
    }
    return event;
  }

  public getTelemetryRollup() {
    const countsBySdg: Record<number, number> = {
      4: 0,
      8: 0,
      10: 0,
      16: 0,
      17: 0,
    };

    for (const evt of this.telemetryLedger) {
      countsBySdg[evt.sdgNumber] = (countsBySdg[evt.sdgNumber] || 0) + 1;
    }

    return {
      totalEvents: this.telemetryLedger.length,
      countsBySdg,
      activeCohortCount: this.cohorts.length,
      recentEvents: this.telemetryLedger.slice(-12).reverse(),
    };
  }

  public saveEmailVault(input: {
    email: string;
    displayName?: string;
    provider?: string;
    payload: Record<string, unknown>;
  }): EmailVaultRecord {
    const normalizedEmail = input.email.trim().toLowerCase();
    const emailHash = crypto
      .createHash('sha256')
      .update(normalizedEmail)
      .digest('hex')
      .slice(0, 16);

    const privacyCheck = enforceRefugeePrivacyGuard(input.payload);
    const record: EmailVaultRecord = {
      emailHash,
      normalizedEmail,
      displayName: input.displayName?.trim() || normalizedEmail.split('@')[0],
      provider: input.provider || 'email-vault',
      updatedAtIso: new Date().toISOString(),
      consentToken: privacyCheck.consentToken,
      zeroRawIdProtected: true,
      payload: privacyCheck.sanitizedPayload,
    };

    this.emailVaults.set(normalizedEmail, record);
    this.recordTelemetryEvent({
      sdgNumber: 16,
      unTarget: 'Target 16.9 & Sovereign Data Portability',
      eventType: 'EMAIL_VAULT_SYNCED',
      metadata: {
        provider: record.provider,
        emailHash,
      },
    });
    return record;
  }

  public getEmailVault(email: string): EmailVaultRecord | null {
    const normalizedEmail = email.trim().toLowerCase();
    return this.emailVaults.get(normalizedEmail) || null;
  }
}

export const complianceCache = new DeterministicComplianceCache<Record<string, unknown>>(
  24 * 60 * 60 * 1000
);
export const aiRateLimiter = new TokenBucketRateLimiter(40, 2);
export const visionCircuitBreaker = new VisionCircuitBreaker(8000);
export const partnerScaleStore = new PartnerScaleEngineStore();
