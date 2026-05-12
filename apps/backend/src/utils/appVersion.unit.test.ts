import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request } from 'express';
import { compareVersions, getDesktopVersionStatus, isDesktopRequest } from './appVersion.js';

function mockRequest(headers: Record<string, string>): Request {
  return {
    header(name: string) {
      const key = Object.keys(headers).find((item) => item.toLowerCase() === name.toLowerCase());
      return key ? headers[key] : undefined;
    },
  } as Request;
}

describe('appVersion helpers', () => {
  it('compares semantic versions with missing patch numbers', () => {
    assert.equal(compareVersions('1.0.3', '1.0.2'), 1);
    assert.equal(compareVersions('1.0', '1.0.0'), 0);
    assert.equal(compareVersions('1.0.2', '1.0.3'), -1);
    assert.equal(compareVersions('bad', '1.0.3'), null);
  });

  it('does not treat browser requests as desktop clients', () => {
    const req = mockRequest({
      'X-Client-Type': 'web',
      Origin: 'https://fhwhkj.top',
      'Sec-Fetch-Site': 'same-origin',
    });

    assert.equal(isDesktopRequest(req), false);
    assert.equal(getDesktopVersionStatus(req).updateRequired, false);
  });

  it('requires update for explicit desktop clients below minimum version', () => {
    const req = mockRequest({
      'X-Client-Type': 'desktop',
      'X-App-Version': '1.0.2',
    });
    const status = getDesktopVersionStatus(req);

    assert.equal(status.isDesktop, true);
    assert.equal(status.updateRequired, true);
    assert.equal(status.forceUpdate, true);
  });

  it('allows explicit desktop clients at the current minimum version', () => {
    const req = mockRequest({
      'X-Client-Type': 'desktop',
      'X-App-Version': '1.0.3',
    });

    assert.equal(getDesktopVersionStatus(req).updateRequired, false);
  });

  it('treats headless auth-style requests without browser context as legacy desktop', () => {
    const req = mockRequest({
      'User-Agent': 'node',
    });

    assert.equal(isDesktopRequest(req), true);
    assert.equal(getDesktopVersionStatus(req).updateRequired, true);
  });
});

