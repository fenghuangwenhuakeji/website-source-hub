/**
 * Video Generation API Client
 * Supports Video generation APIs (MiniMax, OpenAI, etc.)
 */

export type VideoGenProvider = 'minimax' | 'openai' | 'kling' | 'pika' | 'custom';

export interface VideoGenConfig {
  provider: VideoGenProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
  customHeaders?: string;
}

export interface VideoGenResult {
  videoUrl: string;
  coverImageUrl?: string;
}

import { logger } from './logger';
import { loadPersistedConfig, savePersistedConfig } from './configPersistence';
import { loadConfigSync, parseCustomHeaders } from './llmClient';
import { readScopedStorageValue, writeScopedStorageValue } from './userScopedStorage';

const CONFIG_KEY = 'webuiapps-videogen-config';

const DEFAULT_CONFIGS: Record<VideoGenProvider, Omit<VideoGenConfig, 'apiKey'>> = {
  minimax: {
    provider: 'minimax',
    baseUrl: 'https://api.minimax.io/api/v1',
    model: 'minimax-video-01',
  },
  openai: {
    provider: 'openai',
    baseUrl: 'https://api.openai.com',
    model: 'sora-1',
  },
  kling: {
    provider: 'kling',
    baseUrl: 'https://api.kling.ai/v1',
    model: 'kling-video-v1',
  },
  pika: {
    provider: 'pika',
    baseUrl: 'https://api.pika.art/v1',
    model: 'pika-video-1',
  },
  custom: {
    provider: 'custom',
    baseUrl: 'https://your-api-endpoint.com/v1',
    model: 'your-video-model',
  },
};

export function getDefaultVideoGenConfig(
  provider: VideoGenProvider,
): Omit<VideoGenConfig, 'apiKey'> {
  return DEFAULT_CONFIGS[provider];
}

export async function loadVideoGenConfig(): Promise<VideoGenConfig | null> {
  try {
    const persisted = await loadPersistedConfig();
    if (persisted?.video) {
      writeScopedStorageValue(CONFIG_KEY, JSON.stringify(persisted.video));
      return persisted.video;
    }
  } catch {
    // API not available — fall through
  }
  return loadVideoGenConfigSync();
}

export function loadVideoGenConfigSync(): VideoGenConfig | null {
  try {
    const raw = readScopedStorageValue(CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveVideoGenConfig(config: VideoGenConfig): void {
  writeScopedStorageValue(CONFIG_KEY, JSON.stringify(config));
  void persistVideoGenConfig(config);
}

async function persistVideoGenConfig(config: VideoGenConfig): Promise<void> {
  try {
    const persisted = await loadPersistedConfig();
    const llm = persisted?.llm ?? loadConfigSync();
    if (!llm) return;
    const next: import('./configPersistence').PersistedConfig = {
      ...(persisted ?? {}),
      llm,
      video: config,
    };
    await savePersistedConfig(next);
  } catch {
    // ignore
  }
}

export async function generateVideo(
  prompt: string,
  config: VideoGenConfig,
): Promise<VideoGenResult> {
  logger.info(
    'VideoGen',
    'generateVideo called, provider:',
    config.provider,
    'model:',
    config.model,
    'prompt:',
    prompt.slice(0, 100),
  );

  switch (config.provider) {
    case 'minimax':
      return generateVideoMiniMax(prompt, config);
    case 'openai':
      return generateVideoOpenAI(prompt, config);
    default:
      throw new Error(`Unsupported video provider: ${config.provider}`);
  }
}

async function generateVideoMiniMax(
  prompt: string,
  config: VideoGenConfig,
): Promise<VideoGenResult> {
  const targetUrl = `${config.baseUrl}/v1/video/generation`;

  const body = {
    model: config.model,
    prompt,
    duration: 5,
    resolution: '720p',
  };

  // 检测是否在开发环境（有 Vite 代理）
  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  let res: Response;
  
  if (isDev) {
    // 开发环境：使用代理
    res = await fetch('/api/llm-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
        'X-LLM-Target-URL': targetUrl,
        ...parseCustomHeaders(config.customHeaders),
      },
      body: JSON.stringify(body),
    });
  } else {
    // 生产环境：直接调用 API
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    };
    
    // 添加自定义 headers
    if (config.customHeaders) {
      const customHeaders = parseCustomHeaders(config.customHeaders);
      Object.assign(headers, customHeaders);
    }
    
    res = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MiniMax Video API error ${res.status}: ${text}`);
  }

  const data = await res.json();

  return {
    videoUrl: data.data?.video_url || '',
    coverImageUrl: data.data?.cover_image_url,
  };
}

async function generateVideoOpenAI(
  prompt: string,
  config: VideoGenConfig,
): Promise<VideoGenResult> {
  const targetUrl = `${config.baseUrl}/v1/video/generations`;

  const body = {
    model: config.model,
    prompt,
  };

  // 检测是否在开发环境（有 Vite 代理）
  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  let res: Response;

  if (isDev) {
    // 开发环境：使用代理
    res = await fetch('/api/llm-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
        'X-LLM-Target-URL': targetUrl,
        ...parseCustomHeaders(config.customHeaders),
      },
      body: JSON.stringify(body),
    });
  } else {
    // 生产环境：直接调用 API
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    };

    // 添加自定义 headers
    if (config.customHeaders) {
      const customHeaders = parseCustomHeaders(config.customHeaders);
      Object.assign(headers, customHeaders);
    }

    res = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI Video API error ${res.status}: ${text}`);
  }

  const data = await res.json();

  return {
    videoUrl: data.data?.[0]?.video_url || '',
    coverImageUrl: data.data?.[0]?.cover_image_url,
  };
}
