type DesktopDownloadKey = 'windowsInstaller' | 'windowsPortable' | 'macDmg' | 'macZip';

const DEFAULT_DOWNLOAD_FILENAMES: Record<DesktopDownloadKey, string> = {
  windowsInstaller: 'windows-latest.exe',
  windowsPortable: 'windows-portable-latest.exe',
  macDmg: 'mac-latest.dmg',
  macZip: 'mac-latest.zip',
};

const DEFAULT_LOCAL_DOWNLOADS: Record<DesktopDownloadKey, string> = {
  windowsInstaller: `/downloads/fenghuang/${DEFAULT_DOWNLOAD_FILENAMES.windowsInstaller}`,
  windowsPortable: `/downloads/fenghuang/${DEFAULT_DOWNLOAD_FILENAMES.windowsPortable}`,
  macDmg: `/downloads/fenghuang/${DEFAULT_DOWNLOAD_FILENAMES.macDmg}`,
  macZip: `/downloads/fenghuang/${DEFAULT_DOWNLOAD_FILENAMES.macZip}`,
};

function readEnv(name: string) {
  return (import.meta.env[name] as string | undefined)?.trim();
}

function joinUrl(baseUrl: string, filename: string) {
  return `${baseUrl.replace(/\/+$/, '')}/${filename.replace(/^\/+/, '')}`;
}

function resolveDownloadUrl(key: DesktopDownloadKey, explicitUrl?: string) {
  if (explicitUrl) {
    return explicitUrl;
  }

  const baseUrl = readEnv('VITE_DESKTOP_DOWNLOAD_BASE_URL');
  if (baseUrl) {
    return joinUrl(baseUrl, DEFAULT_DOWNLOAD_FILENAMES[key]);
  }

  return DEFAULT_LOCAL_DOWNLOADS[key];
}

export function resolveDesktopDownloadUrls() {
  return {
    windowsInstaller: resolveDownloadUrl('windowsInstaller', readEnv('VITE_DESKTOP_DOWNLOAD_WINDOWS_URL')),
    windowsPortable: resolveDownloadUrl('windowsPortable', readEnv('VITE_DESKTOP_DOWNLOAD_WINDOWS_PORTABLE_URL')),
    macDmg: resolveDownloadUrl('macDmg', readEnv('VITE_DESKTOP_DOWNLOAD_MAC_DMG_URL')),
    macZip: resolveDownloadUrl('macZip', readEnv('VITE_DESKTOP_DOWNLOAD_MAC_ZIP_URL')),
  };
}
