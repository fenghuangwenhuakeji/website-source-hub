/**
 * Audio Generation API Client
 * Supports TTS and Audio generation APIs (MiniMax, OpenAI, etc.)
 */

export type AudioGenProvider = 'minimax' | 'openai' | 'elevenlabs' | 'custom';

export interface AudioGenConfig {
  provider: AudioGenProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
  customHeaders?: string;
}

export interface AudioGenResult {
  audioUrl: string;
  duration?: number;
}

import { logger } from './logger';
import { loadPersistedConfig, savePersistedConfig } from './configPersistence';
import { loadConfigSync, parseCustomHeaders } from './llmClient';
import { readScopedStorageValue, writeScopedStorageValue } from './userScopedStorage';

const CONFIG_KEY = 'webuiapps-audiogen-config';

const DEFAULT_CONFIGS: Record<AudioGenProvider, Omit<AudioGenConfig, 'apiKey'>> = {
  minimax: {
    provider: 'minimax',
    baseUrl: 'https://api.minimax.io/api/v1',
    model: 'speech-01',
  },
  openai: {
    provider: 'openai',
    baseUrl: 'https://api.openai.com',
    model: 'tts-1',
  },
  elevenlabs: {
    provider: 'elevenlabs',
    baseUrl: 'https://api.elevenlabs.io/v1',
    model: 'eleven_v3',
  },
  custom: {
    provider: 'custom',
    baseUrl: 'https://your-api-endpoint.com/v1',
    model: 'your-audio-model',
  },
};

export function getDefaultAudioGenConfig(
  provider: AudioGenProvider,
): Omit<AudioGenConfig, 'apiKey'> {
  return DEFAULT_CONFIGS[provider];
}

export async function loadAudioGenConfig(): Promise<AudioGenConfig | null> {
  try {
    const persisted = await loadPersistedConfig();
    if (persisted?.audio) {
      writeScopedStorageValue(CONFIG_KEY, JSON.stringify(persisted.audio));
      return persisted.audio;
    }
  } catch {
    // API not available — fall through
  }
  return loadAudioGenConfigSync();
}

export function loadAudioGenConfigSync(): AudioGenConfig | null {
  try {
    const raw = readScopedStorageValue(CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveAudioGenConfig(config: AudioGenConfig): void {
  writeScopedStorageValue(CONFIG_KEY, JSON.stringify(config));
  void persistAudioGenConfig(config);
}

async function persistAudioGenConfig(config: AudioGenConfig): Promise<void> {
  try {
    const persisted = await loadPersistedConfig();
    const llm = persisted?.llm ?? loadConfigSync();
    if (!llm) return;
    const next: import('./configPersistence').PersistedConfig = {
      ...(persisted ?? {}),
      llm,
      audio: config,
    };
    await savePersistedConfig(next);
  } catch {
    // ignore
  }
}

export async function generateAudio(
  text: string,
  config: AudioGenConfig,
): Promise<AudioGenResult> {
  logger.info(
    'AudioGen',
    'generateAudio called, provider:',
    config.provider,
    'model:',
    config.model,
    'text:',
    text.slice(0, 100),
  );

  switch (config.provider) {
    case 'minimax':
      return generateAudioMiniMax(text, config);
    case 'openai':
      return generateAudioOpenAI(text, config);
    case 'elevenlabs':
      return generateAudioElevenLabs(text, config);
    default:
      throw new Error(`Unsupported audio provider: ${config.provider}`);
  }
}

async function generateAudioMiniMax(
  text: string,
  config: AudioGenConfig,
): Promise<AudioGenResult> {
  const targetUrl = `${config.baseUrl}/v1/audio/speech`;

  const body = {
    model: config.model,
    text,
    voice: 'default',
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
    const text_res = await res.text();
    throw new Error(`MiniMax Audio API error ${res.status}: ${text_res}`);
  }

  const data = await res.json();

  return {
    audioUrl: data.data?.audio_url || '',
    duration: data.data?.duration,
  };
}

async function generateAudioOpenAI(
  text: string,
  config: AudioGenConfig,
): Promise<AudioGenResult> {
  const targetUrl = `${config.baseUrl}/v1/audio/speech`;

  const body = {
    model: config.model,
    input: text,
    voice: 'alloy',
    response_format: 'mp3',
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
    const text_res = await res.text();
    throw new Error(`OpenAI Audio API error ${res.status}: ${text_res}`);
  }

  const data = await res.json();

  return {
    audioUrl: data.audio_url || '',
    duration: data.duration,
  };
}

async function generateAudioElevenLabs(
  text: string,
  config: AudioGenConfig,
): Promise<AudioGenResult> {
  const targetUrl = `${config.baseUrl}/text-to-speech`;

  const body = {
    text,
    model_id: config.model,
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
        'xi-api-key': config.apiKey,
        'X-LLM-Target-URL': targetUrl,
        ...parseCustomHeaders(config.customHeaders),
      },
      body: JSON.stringify(body),
    });
  } else {
    // 生产环境：直接调用 API
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'xi-api-key': config.apiKey,
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
    const text_res = await res.text();
    throw new Error(`ElevenLabs Audio API error ${res.status}: ${text_res}`);
  }

  const data = await res.json();

  return {
    audioUrl: data.audio_url || '',
    duration: data.duration,
  };
}
