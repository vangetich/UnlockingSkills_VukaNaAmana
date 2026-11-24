import test from 'node:test';
import assert from 'node:assert/strict';
import {
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
    identifier: '+254712345678',
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
