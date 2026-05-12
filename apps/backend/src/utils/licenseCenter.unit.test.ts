import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DEFAULT_LICENSE_PRODUCT_ID,
  buildLicenseCode,
  normalizeLicenseCode,
} from './licenseCenter.js';

describe('licenseCenter pure helpers', () => {
  it('uses fenghuang as the default product id', () => {
    assert.equal(DEFAULT_LICENSE_PRODUCT_ID, 'fenghuang');
  });

  it('normalizes card codes to uppercase alphanumeric text', () => {
    assert.equal(normalizeLicenseCode(' fh-12 ab-34 '), 'FH12AB34');
  });

  it('rejects empty card codes', () => {
    assert.throws(() => normalizeLicenseCode(' --  '), /请输入卡密或兑换码/);
  });

  it('generates grouped codes with an optional sanitized prefix', () => {
    const code = buildLicenseCode(' fh 卡 ');
    assert.match(code, /^FH-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  });

  it('generates codes without ambiguous characters', () => {
    const code = buildLicenseCode();
    assert.doesNotMatch(code, /[01IO]/);
  });
});
