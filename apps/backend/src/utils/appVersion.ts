import type { NextFunction, Request, Response } from 'express';

export const DESKTOP_LATEST_VERSION = process.env.DESKTOP_LATEST_VERSION || '1.0.3';
export const DESKTOP_MIN_SUPPORTED_VERSION =
  process.env.DESKTOP_MIN_SUPPORTED_VERSION || DESKTOP_LATEST_VERSION;
export const DESKTOP_DOWNLOAD_URL =
  process.env.DESKTOP_DOWNLOAD_URL || 'https://fhwhkj.top/download';
const REQUIRE_APP_VERSION_FOR_HEADLESS_AUTH =
  process.env.REQUIRE_APP_VERSION_FOR_HEADLESS_AUTH !== '0';

export interface DesktopVersionStatus {
  isDesktop: boolean;
  currentVersion: string | null;
  latestVersion: string;
  minSupportedVersion: string;
  supported: boolean;
  updateRequired: boolean;
  forceUpdate: boolean;
  downloadUrl: string;
  message: string;
}

function normalizeVersion(version?: string | null): number[] | null {
  if (!version || typeof version !== 'string') {
    return null;
  }

  const core = version.trim().replace(/^v/i, '').split(/[+-]/)[0];
  const parts = core.split('.').map((part) => Number.parseInt(part, 10));

  if (!parts.length || parts.some((part) => Number.isNaN(part) || part < 0)) {
    return null;
  }

  while (parts.length < 3) {
    parts.push(0);
  }

  return parts.slice(0, 3);
}

export function compareVersions(left?: string | null, right?: string | null): number | null {
  const leftParts = normalizeVersion(left);
  const rightParts = normalizeVersion(right);

  if (!leftParts || !rightParts) {
    return null;
  }

  for (let index = 0; index < 3; index += 1) {
    if (leftParts[index] > rightParts[index]) {
      return 1;
    }
    if (leftParts[index] < rightParts[index]) {
      return -1;
    }
  }

  return 0;
}

function getRequestHeader(req: Request, name: string): string {
  return String(req.header(name) || '').trim();
}

export function isDesktopRequest(req: Request): boolean {
  const clientType = getRequestHeader(req, 'x-client-type').toLowerCase();
  const userAgent = getRequestHeader(req, 'user-agent');
  const hasBrowserContextHeaders = Boolean(
    getRequestHeader(req, 'origin') ||
      getRequestHeader(req, 'referer') ||
      getRequestHeader(req, 'sec-fetch-site'),
  );

  if (clientType === 'web' || clientType === 'browser') {
    return false;
  }

  // Older packaged clients used the Electron main-process fetch bridge and did
  // not send browser Origin/Sec-Fetch headers. Treat those auth calls as legacy
  // desktop clients so they cannot bypass the version gate.
  return (
    clientType === 'desktop' ||
    clientType === 'electron' ||
    /\bElectron\//i.test(userAgent) ||
    /\bFenghuangDesktop\//i.test(userAgent) ||
    (REQUIRE_APP_VERSION_FOR_HEADLESS_AUTH && !hasBrowserContextHeaders)
  );
}

export function getDesktopVersionStatus(req: Request): DesktopVersionStatus {
  const isDesktop = isDesktopRequest(req);
  const currentVersion = getRequestHeader(req, 'x-app-version') || null;
  const comparison = compareVersions(currentVersion, DESKTOP_MIN_SUPPORTED_VERSION);
  const supported = !isDesktop || (comparison !== null && comparison >= 0);
  const updateRequired = isDesktop && !supported;

  return {
    isDesktop,
    currentVersion,
    latestVersion: DESKTOP_LATEST_VERSION,
    minSupportedVersion: DESKTOP_MIN_SUPPORTED_VERSION,
    supported,
    updateRequired,
    forceUpdate: updateRequired,
    downloadUrl: DESKTOP_DOWNLOAD_URL,
    message: updateRequired
      ? '当前客户端版本过低，请下载最新版后继续使用。'
      : '当前客户端版本可用。',
  };
}

export function requireSupportedDesktopVersion(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const status = getDesktopVersionStatus(req);

  if (!status.updateRequired) {
    next();
    return;
  }

  res.status(426).json({
    success: false,
    code: 'APP_UPDATE_REQUIRED',
    message: status.message,
    data: status,
  });
}
