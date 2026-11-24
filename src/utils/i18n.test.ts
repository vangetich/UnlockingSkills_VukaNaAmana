import test from 'node:test';
import assert from 'node:assert/strict';
import { LOCALE_OPTIONS, TRANSLATIONS, getLocaleMeta, getStageLabel } from './i18n';

test('all configured locales have complete non-empty translation dictionaries', () => {
  const baseKeys = Object.keys(TRANSLATIONS.en) as Array<keyof typeof TRANSLATIONS.en>;
  for (const opt of LOCALE_OPTIONS) {
    const dict = TRANSLATIONS[opt.code];
    assert.ok(dict, `Missing dictionary for ${opt.code}`);
    for (const key of baseKeys) {
      assert.equal(typeof dict[key], 'string', `Missing key ${String(key)} for ${opt.code}`);
      assert.ok(dict[key].length > 0, `Empty key ${String(key)} for ${opt.code}`);
    }
  }
});

test('non-English locales translate core landing, dashboard, and workflow labels', () => {
  const keysToDiffer: Array<keyof typeof TRANSLATIONS.en> = [
    'heroHeadline',
    'heroQuestion',
    'beginCrossingCta',
    'pillar1Title',
    'verifyHeading',
    'unlockHeading',
    'solveHeading',
    'pulseHeading',
    'kpiVerifiedSkills',
    'kpiPaidEarned',
    'ledgerHeading',
    'syncCardHeading',
  ];
  for (const code of ['sw', 'fr', 'ar'] as const) {
    for (const key of keysToDiffer) {
      assert.notEqual(
        TRANSLATIONS[code][key],
        TRANSLATIONS.en[key],
        `Untranslated key ${key} in ${code}`
      );
    }
  }
});

test('Arabic locale sets RTL direction while EN, SW, FR use LTR', () => {
  assert.equal(getLocaleMeta('ar').dir, 'rtl');
  assert.equal(getLocaleMeta('en').dir, 'ltr');
  assert.equal(getLocaleMeta('sw').dir, 'ltr');
  assert.equal(getLocaleMeta('fr').dir, 'ltr');
});

test('stage labels resolve for all four dignified career stages', () => {
  const stages = ['15-17', '18-29', '30-45', '46+'] as const;
  for (const stage of stages) {
    const label = getStageLabel(stage, TRANSLATIONS.en);
    assert.ok(label.title.length > 0);
    assert.ok(label.desc.length > 0);
  }
});
