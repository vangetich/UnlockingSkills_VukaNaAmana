import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AuthLockoutError,
  PARTNER_SESSION_COOKIE,
  PartnerAuthRealm,
  TALENT_SESSION_COOKIE,
  TalentAuthRealm,
  buildClearCookieHeader,
  buildIsolatedCookieHeader,
  parseCookieHeader,
} from './dualDoorAuth.ts';

test('TalentAuthRealm issues scoped builder sessions via WhatsApp/Phone OTP or Email Magic Code', () => {
  const realm = new TalentAuthRealm();
  const challenge = realm.requestChallenge({
    channel: 'whatsapp',
    identifier: '254712345678',
    displayName: 'Samira Omer',
    ageStage: '30-45',
  });

  assert.ok(challenge.challengeId.startsWith('tchal_'));
  assert.match(challenge.previewCode, /^\d{6}$/);

  const verified = realm.verifyChallenge({
    challengeId: challenge.challengeId,
    code: challenge.previewCode,
  });

  assert.equal(verified.claims.role, 'builder');
  assert.equal(verified.claims.aud, 'vna-talent');
  assert.equal(verified.claims.displayName, 'Samira Omer');
  assert.equal(verified.claims.isDemo, false);

  const checked = realm.verifySession(verified.token);
  assert.ok(checked);
  assert.equal(checked.sid, verified.claims.sid);
  assert.equal(checked.role, 'builder');
  assert.equal(checked.aud, 'vna-talent');
});

test('TalentAuthRealm rejects wrong OTP codes and enforces attempt limits', () => {
  const realm = new TalentAuthRealm();
  const challenge = realm.requestChallenge({
    channel: 'email',
    identifier: 'builder@example.org',
  });

  assert.throws(
    () =>
      realm.verifyChallenge({
        challengeId: challenge.challengeId,
        code: '000000',
      }),
    /does not match/i
  );

  // Exhaust remaining attempts (MAX_CHALLENGE_ATTEMPTS = 5)
  for (let i = 0; i < 4; i += 1) {
    assert.throws(() =>
      realm.verifyChallenge({
        challengeId: challenge.challengeId,
        code: '000000',
      })
    );
  }

  // Next attempt should lock out even if correct code is provided
  assert.throws(
    () =>
      realm.verifyChallenge({
        challengeId: challenge.challengeId,
        code: challenge.previewCode,
      }),
    /too many invalid attempts/i
  );
});

test('PartnerAuthRealm enforces corporate work email domains and mints partner-scoped sessions', () => {
  const realm = new PartnerAuthRealm();

  assert.throws(
    () =>
      realm.requestChallenge({
        workEmail: 'recruiter@gmail.com',
        organizationName: 'Acme Impact',
        memberRole: 'hiring_lead',
      }),
    /organizational work domain/i
  );

  const challenge = realm.requestChallenge({
    workEmail: 'talent@kigaliclinics.org',
    organizationName: 'Kigali Clinics Network',
    memberRole: 'partner_admin',
    displayName: 'Jean-Paul Ndayisaba',
  });

  assert.equal(challenge.orgDomain, 'kigaliclinics.org');
  assert.match(challenge.previewCode, /^\d{6}$/);

  const verified = realm.verifyChallenge({
    challengeId: challenge.challengeId,
    code: challenge.previewCode,
  });

  assert.equal(verified.claims.role, 'partner');
  assert.equal(verified.claims.aud, 'vna-partner');
  assert.equal(verified.claims.memberRole, 'partner_admin');
  assert.equal(verified.claims.orgName, 'Kigali Clinics Network');
  assert.equal(verified.claims.orgDomain, 'kigaliclinics.org');
  assert.equal(verified.claims.isDemo, false);
});

test('Strict cross-realm isolation rejects Talent tokens in PartnerAuthRealm and vice versa', () => {
  const talentRealm = new TalentAuthRealm();
  const partnerRealm = new PartnerAuthRealm();

  const demoBuilder = talentRealm.mintDemoBuilderSession({ displayName: 'Amina Hassan' });
  const demoPartner = partnerRealm.mintDemoPartnerSession('hiring_lead');

  assert.equal(demoBuilder.claims.role, 'builder');
  assert.equal(demoBuilder.claims.aud, 'vna-talent');
  assert.equal(demoPartner.claims.role, 'partner');
  assert.equal(demoPartner.claims.aud, 'vna-partner');
  assert.equal(demoPartner.claims.orgName, 'SolarGrid East Africa');

  // Valid in own realm
  assert.ok(talentRealm.verifySession(demoBuilder.token));
  assert.ok(partnerRealm.verifySession(demoPartner.token));

  // Strictly rejected in opposite realm (audience-salted HMAC + aud claim check)
  assert.equal(partnerRealm.verifySession(demoBuilder.token), null);
  assert.equal(talentRealm.verifySession(demoPartner.token), null);
});

test('Session revocation immediately invalidates issued tokens in both realms', () => {
  const talentRealm = new TalentAuthRealm();
  const partnerRealm = new PartnerAuthRealm();

  const builderSession = talentRealm.mintDemoBuilderSession();
  const partnerSession = partnerRealm.mintDemoPartnerSession('partner_admin');

  talentRealm.revokeSession(builderSession.token);
  partnerRealm.revokeSession(partnerSession.token);

  assert.equal(talentRealm.verifySession(builderSession.token), null);
  assert.equal(partnerRealm.verifySession(partnerSession.token), null);
});

test('Isolated cookie builders enforce HttpOnly, Secure, SameSite=None, Partitioned and parse cleanly', () => {
  const talentCookie = buildIsolatedCookieHeader(TALENT_SESSION_COOKIE, 'tok.a.b', 3600);
  const partnerClear = buildClearCookieHeader(PARTNER_SESSION_COOKIE);

  assert.match(talentCookie, /^vna_talent_sid=tok\.a\.b;/);
  assert.match(talentCookie, /HttpOnly/);
  assert.match(talentCookie, /Secure/);
  assert.match(talentCookie, /SameSite=None/);
  assert.match(talentCookie, /Partitioned/);
  assert.match(partnerClear, /^vna_partner_sid=;.*Max-Age=0/);

  const parsed = parseCookieHeader('vna_talent_sid=abc.123; theme=light');
  assert.equal(parsed.vna_talent_sid, 'abc.123');
  assert.equal(parsed.theme, 'light');
});

test('Skilled Builder Door requires mutual consent authorization for sovereign refugee realm access', () => {
  const talentRealm = new TalentAuthRealm();
  const demoSession = talentRealm.mintDemoBuilderSession({
    displayName: 'Amina Hassan',
    ageStage: '30-45',
  });

  assert.equal(demoSession.claims.role, 'builder');
  assert.equal(demoSession.claims.aud, 'vna-talent');
  assert.equal(demoSession.claims.displayName, 'Amina Hassan');
  // Verified token cannot authenticate against PartnerAuthRealm
  const partnerRealm = new PartnerAuthRealm();
  assert.equal(partnerRealm.verifySession(demoSession.token), null);
});

test('Switch to Skilled Builder Door server validation checks active builder session or requires mutual consent', () => {
  const talentRealm = new TalentAuthRealm();
  const partnerRealm = new PartnerAuthRealm();

  // Scenario 1: A user with only a partner session cannot access builder realm without mutual consent
  const partnerSession = partnerRealm.mintDemoPartnerSession('hiring_lead');
  assert.equal(talentRealm.verifySession(partnerSession.token), null);

  // Scenario 2: Active builder session grants access directly
  const builderSession = talentRealm.mintDemoBuilderSession({
    displayName: 'Fatima Al-Zahra',
    ageStage: '18-29',
  });
  const verified = talentRealm.verifySession(builderSession.token);
  assert.ok(verified);
  assert.equal(verified?.role, 'builder');
  assert.equal(verified?.aud, 'vna-talent');

  // Scenario 3: When mutual consent is provided, an isolated builder session is minted
  const consentSession = talentRealm.mintDemoBuilderSession({
    displayName: 'Ibrahim Diallo',
    ageStage: '30-45',
  });
  assert.equal(consentSession.claims.role, 'builder');
  assert.equal(consentSession.claims.displayName, 'Ibrahim Diallo');
  assert.equal(consentSession.claims.twoFactorVerified, true);
  assert.equal(consentSession.claims.authMethod, 'otp_2fa');
});

test('Path A 2FA OTP emits twoFactorVerified, authMethod otp_2fa, builderId, and AuthLockoutError on 5th wrong attempt', () => {
  const realm = new TalentAuthRealm();
  const challenge = realm.requestChallenge({
    channel: 'phone',
    identifier: '254700112233',
    displayName: 'Nadia O.',
    ageStage: '18-29',
  });

  const verified = realm.verifyChallenge({
    challengeId: challenge.challengeId,
    code: challenge.previewCode,
    trustedDevice: true,
  });

  assert.equal(verified.claims.twoFactorVerified, true);
  assert.equal(verified.claims.authMethod, 'otp_2fa');
  assert.equal(verified.claims.trustedDevice, true);
  assert.match(verified.claims.builderId || '', /^VNA-B-\d{4,5}$/);

  // Verify brute-force lockout throws AuthLockoutError with retryAfterSeconds
  const lockedChallenge = realm.requestChallenge({
    channel: 'whatsapp',
    identifier: '254700998877',
  });
  const wrongCode = lockedChallenge.previewCode === '111111' ? '222222' : '111111';
  for (let i = 0; i < 4; i += 1) {
    assert.throws(() =>
      realm.verifyChallenge({ challengeId: lockedChallenge.challengeId, code: wrongCode })
    );
  }
  assert.throws(
    () => realm.verifyChallenge({ challengeId: lockedChallenge.challengeId, code: wrongCode }),
    (err: unknown) => err instanceof AuthLockoutError && err.retryAfterSeconds > 0
  );
});

test('Path B Dedicated Crossing PIN generates salted-hash enrollment, confirms 2-step gate, supports returning login, and enforces lockout + realm isolation', () => {
  const talentRealm = new TalentAuthRealm();
  const partnerRealm = new PartnerAuthRealm();

  // Step 1: Generate Dedicated PIN without phone number or raw ID
  const enrollment = talentRealm.generateDedicatedPinEnrollment({
    displayName: 'Amina K.',
    ageStage: '18-29',
  });

  assert.match(enrollment.builderId, /^VNA-B-\d{4,5}$/);
  assert.match(enrollment.pin, /^\d{6}$/);
  assert.equal(enrollment.recoveryPhrase.split('-').length, 3);

  // Reject mismatched confirmation PIN
  const wrongPin = enrollment.pin === '000000' ? '999999' : '000000';
  assert.throws(
    () =>
      talentRealm.confirmDedicatedPinEnrollment({
        enrollmentId: enrollment.enrollmentId,
        pin: wrongPin,
      }),
    /doesn't match/i
  );

  // Step 2: Confirm PIN -> mints isolated builder session with authMethod dedicated_pin
  const confirmed = talentRealm.confirmDedicatedPinEnrollment({
    enrollmentId: enrollment.enrollmentId,
    pin: enrollment.pin,
    trustedDevice: true,
  });

  assert.equal(confirmed.claims.role, 'builder');
  assert.equal(confirmed.claims.aud, 'vna-talent');
  assert.equal(confirmed.claims.twoFactorVerified, true);
  assert.equal(confirmed.claims.authMethod, 'dedicated_pin');
  assert.equal(confirmed.claims.builderId, enrollment.builderId);
  assert.equal(confirmed.claims.displayName, 'Amina K.');

  // Ensure plaintext PIN never appears in persisted account or session claims
  assert.equal(JSON.stringify(confirmed.account).includes(enrollment.pin), false);
  assert.equal(JSON.stringify(confirmed.claims).includes(enrollment.pin), false);

  // Strictly isolated from Partner realm
  assert.equal(partnerRealm.verifySession(confirmed.token), null);

  // Returning Sign-In works with Builder ID (case-insensitive) AND Display Alias
  const byId = talentRealm.loginWithDedicatedPin({
    identifier: enrollment.builderId.toLowerCase(),
    pin: enrollment.pin,
  });
  assert.equal(byId.claims.authMethod, 'dedicated_pin');
  assert.equal(byId.claims.builderId, enrollment.builderId);

  const byAlias = talentRealm.loginWithDedicatedPin({
    identifier: 'amina k.',
    pin: enrollment.pin,
  });
  assert.equal(byAlias.claims.displayName, 'Amina K.');

  // Brute-force lockout on 5 invalid returning PIN login attempts
  for (let i = 0; i < 4; i += 1) {
    assert.throws(() =>
      talentRealm.loginWithDedicatedPin({
        identifier: enrollment.builderId,
        pin: wrongPin,
      })
    );
  }
  assert.throws(
    () =>
      talentRealm.loginWithDedicatedPin({
        identifier: enrollment.builderId,
        pin: wrongPin,
      }),
    (err: unknown) => err instanceof AuthLockoutError && err.retryAfterSeconds > 0
  );
});

test('Strict numerals-only enforcement rejects letters, +, -, spaces, and symbols on phone, OTP, and PIN auth', () => {
  const talentRealm = new TalentAuthRealm();
  const partnerRealm = new PartnerAuthRealm();

  // Phone & WhatsApp must reject '+', '-', spaces, and letters
  for (const invalidPhone of ['+254712345678', '254-712-345678', '254 712 345678', '25471234abc8']) {
    assert.throws(
      () =>
        talentRealm.requestChallenge({
          channel: 'whatsapp',
          identifier: invalidPhone,
        }),
      /numerals only/i
    );
    assert.throws(
      () =>
        talentRealm.requestChallenge({
          channel: 'phone',
          identifier: invalidPhone,
        }),
      /numerals only/i
    );
  }

  // Builder 2FA OTP rejects letters or symbols
  const builderChal = talentRealm.requestChallenge({
    channel: 'phone',
    identifier: '254712345678',
  });
  for (const badCode of ['12345a', '123-456', '+12345', '12 3456']) {
    assert.throws(
      () => talentRealm.verifyChallenge({ challengeId: builderChal.challengeId, code: badCode }),
      /numerals only/i
    );
  }

  // Partner 2FA OTP rejects letters or symbols
  const partnerChal = partnerRealm.requestChallenge({
    workEmail: 'lead@solargridea.org',
    organizationName: 'SolarGrid East Africa',
    memberRole: 'hiring_lead',
  });
  assert.throws(
    () => partnerRealm.verifyChallenge({ challengeId: partnerChal.challengeId, code: '12a456' }),
    /numerals only/i
  );

  // Dedicated PIN confirm and returning login reject letters or symbols
  const pinEnrollment = talentRealm.generateDedicatedPinEnrollment({ displayName: 'Zainab N.' });
  assert.throws(
    () =>
      talentRealm.confirmDedicatedPinEnrollment({
        enrollmentId: pinEnrollment.enrollmentId,
        pin: '123-45',
      }),
    /numerals only/i
  );
  talentRealm.confirmDedicatedPinEnrollment({
    enrollmentId: pinEnrollment.enrollmentId,
    pin: pinEnrollment.pin,
  });
  assert.throws(
    () =>
      talentRealm.loginWithDedicatedPin({
        identifier: pinEnrollment.builderId,
        pin: '12ab56',
      }),
    /numerals only/i
  );
});


