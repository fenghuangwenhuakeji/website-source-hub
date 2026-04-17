import type { NativeExecutableInfo } from '@/types/desktopApp';

export interface NativeAppResolutionResult {
  resolvedPath: string;
  workingDirectory: string;
  wasDirectoryInput: boolean;
}

interface NativeAppApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

interface NativeAppPayload {
  executablePath?: string;
  workingDirectory?: string;
  launcherPath?: string;
  launchArgs?: string[];
}

const buildPayload = (native: NativeExecutableInfo): NativeAppPayload => ({
  executablePath: native.executablePath,
  workingDirectory: native.workingDirectory,
  launcherPath: native.launcherPath,
  launchArgs: native.launchArgs ?? [],
});

async function postNativeAppApi<T>(
  endpoint: '/api/native-apps/resolve' | '/api/native-apps/launch',
  payload: NativeAppPayload,
): Promise<T> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  let data: NativeAppApiResponse<T> | null = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok || !data?.success || !data.data) {
    throw new Error(data?.message || '本地程序启动桥调用失败。');
  }

  return data.data;
}

export async function resolveNativeApp(native: NativeExecutableInfo): Promise<NativeAppResolutionResult> {
  return postNativeAppApi<NativeAppResolutionResult>('/api/native-apps/resolve', buildPayload(native));
}

export async function launchNativeApp(native: NativeExecutableInfo): Promise<NativeAppResolutionResult & { pid?: number }> {
  return postNativeAppApi<NativeAppResolutionResult & { pid?: number }>(
    '/api/native-apps/launch',
    buildPayload(native),
  );
}
