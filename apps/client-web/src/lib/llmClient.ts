/**
 * Minimal LLM API Client
 * Supports OpenAI / DeepSeek / Anthropic formats
 */

export type LLMProvider = 'openai' | 'anthropic' | 'deepseek' | 'minimax' | 'custom';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  /** Custom headers, format "Key: Value" (newline/comma) or JSON object */
  customHeaders?: string;
}

function parseHeaderPairs(input: string): Record<string, string> {
  const headers: Record<string, string> = {};
  const delimiter = input.includes('\n') ? /\r?\n/ : input.includes(';') ? /;/ : /,/;
  const lines = input.split(delimiter);
  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;
    const separatorIndex = trimmed.indexOf(':') >= 0 ? trimmed.indexOf(':') : trimmed.indexOf('=');
    if (separatorIndex <= 0) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    const val = trimmed.slice(separatorIndex + 1).trim();
    if (!key) continue;
    headers[key] = val;
  }
  return headers;
}

export function parseCustomHeaders(raw?: string): Record<string, string> {
  if (!raw) return {};
  const trimmed = raw.trim();
  if (!trimmed) return {};
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, string>;
      if (parsed && typeof parsed === 'object') {
        return Object.entries(parsed).reduce<Record<string, string>>((acc, [key, value]) => {
          if (!key) return acc;
          acc[key] = String(value);
          return acc;
        }, {});
      }
    } catch {
      // fall through to line parsing
    }
  }
  return parseHeaderPairs(trimmed);
}

export function buildProxyCustomHeaders(raw?: string): Record<string, string> {
  const headers = parseCustomHeaders(raw);
  return Object.entries(headers).reduce<Record<string, string>>((acc, [key, value]) => {
    const normalized = key.trim().toLowerCase();
    if (!normalized) return acc;
    const proxyKey = normalized.startsWith('x-custom-') ? normalized : `x-custom-${normalized}`;
    acc[proxyKey] = value;
    return acc;
  }, {});
}

export function normalizeCustomHeadersValue(raw?: string): string | undefined {
  if (raw === undefined) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const parsed = parseCustomHeaders(raw);
  const entries = Object.entries(parsed);
  if (entries.length === 0) return trimmed;
  return entries.map(([key, value]) => `${key}: ${value}`).join(', ');
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolDef {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, unknown>;
      required: string[];
    };
  };
}

interface LLMResponse {
  content: string;
  toolCalls: ToolCall[];
}

import { logger } from './logger';
import { loadPersistedConfig, savePersistedConfig } from './configPersistence';
import { loadImageGenConfigSync } from './imageGenClient';
import { loadVideoGenConfigSync } from './videoGenClient';
import { loadAudioGenConfigSync } from './audioGenClient';
import { readScopedStorageValue, writeScopedStorageValue } from './userScopedStorage';

const CONFIG_KEY = 'webuiapps-llm-config';
const CODEEDITOR_CONFIG_KEY = 'webuiapps-codeeditor-config';

/** Detect if running in Electron packaged app */
function isElectronPackaged(): boolean {
  // Check for Electron environment
  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    return true;
  }
  // Check for node integration in renderer (packaged app)
  if (typeof navigator !== 'undefined' && navigator.userAgent.includes('Electron')) {
    return true;
  }
  return false;
}

/** Get the proxy URL based on environment */
async function getProxyUrl(): Promise<string> {
  // In development, use Vite dev server proxy
  if (!isElectronPackaged()) {
    return '/api/llm-proxy';
  }
  
  // In packaged app, use Electron's internal proxy server
  // Try to get port from Electron main process
  try {
    if ((window as any).electronAPI?.getProxyPort) {
      const port = await (window as any).electronAPI.getProxyPort();
      if (port) {
        return `http://127.0.0.1:${port}/api/llm-proxy`;
      }
    }
  } catch {
    // Fallback to default port
  }
  
  // Default packaged app proxy port
  return 'http://127.0.0.1:3001/api/llm-proxy';
}

const DEFAULT_CONFIGS: Record<LLMProvider, Omit<LLMConfig, 'apiKey'>> = {
  openai: { provider: 'openai', baseUrl: 'https://api.openai.com', model: 'gpt-4o', temperature: 0.7, maxTokens: 4096 },
  deepseek: { provider: 'deepseek', baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat', temperature: 0.7, maxTokens: 4096 },
  anthropic: {
    provider: 'anthropic',
    baseUrl: 'https://api.anthropic.com',
    model: 'claude-sonnet-4',
    temperature: 0.7,
    maxTokens: 4096,
  },
  minimax: {
    provider: 'minimax',
    baseUrl: 'https://api.minimaxi.com/v1',
    model: 'MiniMax-M2.7',
    temperature: 0.7,
    maxTokens: 4096,
  },
  custom: {
    provider: 'custom',
    baseUrl: 'https://your-api-endpoint.com/v1',
    model: 'your-model',
    temperature: 0.7,
    maxTokens: 4096,
  },
};

export function getDefaultConfig(provider: LLMProvider): Omit<LLMConfig, 'apiKey'> {
  return DEFAULT_CONFIGS[provider];
}

/**
 * Load config — priority: local file (~/.openroom/config.json) > localStorage.
 * Falls back gracefully if the dev server API is unavailable (e.g. production build).
 * Handles both legacy flat format and new { llm, imageGen? } format.
 */
export async function loadConfig(): Promise<LLMConfig | null> {
  // 1. Try local file via dev-server API (handles legacy + new format)
  try {
    const persisted = await loadPersistedConfig();
    if (persisted?.llm) {
      writeScopedStorageValue(CONFIG_KEY, JSON.stringify(persisted.llm));
      return persisted.llm;
    }
  } catch {
    // API not available (production / network error) — fall through
  }

  // 2. Fall back to localStorage
  try {
    const raw = readScopedStorageValue(CONFIG_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
    const codeEditorRaw = readScopedStorageValue(CODEEDITOR_CONFIG_KEY);
    if (codeEditorRaw) {
      const parsed = JSON.parse(codeEditorRaw) as LLMConfig;
      writeScopedStorageValue(CONFIG_KEY, JSON.stringify(parsed));
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Save config — writes to both localStorage and local file (~/.openroom/config.json).
 * Optionally accepts imageGenConfig and will also persist any cached image/video/audio
 * configs from localStorage for consistency.
 */
export async function saveConfig(
  config: LLMConfig,
  imageGenConfig?: import('./imageGenClient').ImageGenConfig | null,
): Promise<void> {
  // Always write localStorage (sync, instant)
  writeScopedStorageValue(CONFIG_KEY, JSON.stringify(config));
  writeScopedStorageValue(CODEEDITOR_CONFIG_KEY, JSON.stringify(config));

  // Build persisted config — include cached media configs for consistency
  const persisted: import('./configPersistence').PersistedConfig = { llm: config };
  const imageConfig = imageGenConfig ?? loadImageGenConfigSync();
  if (imageConfig) {
    persisted.imageGen = imageConfig;
  }
  const videoConfig = loadVideoGenConfigSync();
  if (videoConfig) {
    persisted.video = videoConfig;
  }
  const audioConfig = loadAudioGenConfigSync();
  if (audioConfig) {
    persisted.audio = audioConfig;
  }

  // Best-effort write to local file
  await savePersistedConfig(persisted);
}

/** Synchronous read from localStorage cache (use after loadConfig() has been awaited once). */
export function loadConfigSync(): LLMConfig | null {
  try {
    const raw = readScopedStorageValue(CONFIG_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
    const codeEditorRaw = readScopedStorageValue(CODEEDITOR_CONFIG_KEY);
    return codeEditorRaw ? JSON.parse(codeEditorRaw) : null;
  } catch {
    return null;
  }
}

/**
 * Call LLM API (non-streaming, simple version)
 * Uses backend proxy in non-Electron environments to avoid CORS issues on mobile
 */
export async function chat(
  messages: ChatMessage[],
  tools: ToolDef[],
  config: LLMConfig,
): Promise<LLMResponse> {
  logger.info(
    'LLM',
    'chat() called, provider:',
    config.provider,
    'model:',
    config.model,
    'messages:',
    messages.length,
  );

  const useProxy = !isElectronPackaged();

  if (useProxy) {
    return chatViaProxy(messages, tools, config);
  }

  if (config.provider === 'anthropic' || config.provider === 'minimax') {
    return chatAnthropic(messages, tools, config);
  }
  return chatOpenAI(messages, tools, config);
}

/**
 * Send LLM request through backend proxy (avoids CORS on mobile browsers)
 */
async function chatViaProxy(
  messages: ChatMessage[],
  tools: ToolDef[],
  config: LLMConfig,
): Promise<LLMResponse> {
  const proxyUrl = '/api/llm-proxy';

  const body: Record<string, unknown> = {
    model: config.model,
    messages,
    provider: config.provider,
    baseUrl: config.baseUrl,
    apiKey: config.apiKey,
    customHeaders: config.customHeaders,
  };
  if (typeof config.temperature === 'number') {
    body.temperature = config.temperature;
  }
  if (typeof config.maxTokens === 'number') {
    body.max_tokens = config.maxTokens;
  }

  if (tools.length > 0) {
    body.tools = tools;
  }

  logger.info('LLM', 'Via proxy request:', {
    proxyUrl,
    model: config.model,
    messageCount: messages.length,
    toolCount: tools.length,
  });

  const res = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  logger.info('LLM', 'Proxy response status:', res.status);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM Proxy error ${res.status}: ${text}`);
  }

  const data = await res.json();
  logger.info('LLM', 'Proxy response data:', JSON.stringify(data).slice(0, 500));

  if (data.error) {
    throw new Error(`LLM Proxy error: ${data.error}`);
  }

  const choice = data.choices?.[0]?.message || data.data?.choices?.[0]?.message || {};
  const content = choice.content || '';
  const toolCalls = choice.tool_calls || [];

  return { content, toolCalls };
}

async function chatOpenAI(
  messages: ChatMessage[],
  tools: ToolDef[],
  config: LLMConfig,
): Promise<LLMResponse> {
  const body: Record<string, unknown> = {
    model: config.model,
    messages,
  };
  if (typeof config.temperature === 'number') {
    body.temperature = config.temperature;
  }
  if (typeof config.maxTokens === 'number') {
    body.max_tokens = config.maxTokens;
  }
  if (tools.length > 0) {
    body.tools = tools;
  }

  let targetUrl = config.baseUrl;
  if (targetUrl.endsWith('/')) {
    targetUrl = targetUrl.slice(0, -1);
  }
  
  // MiniMax API uses different endpoint
  if (config.provider === 'minimax' || targetUrl.includes('minimaxi')) {
    targetUrl = `${targetUrl}/text/chatcompletion_v2`;
  } else {
    const hasVersion = /\/(v\d+|chat)\/?$/.test(targetUrl);
    if (!hasVersion) {
      targetUrl = `${targetUrl}/v1/chat/completions`;
    } else if (!targetUrl.includes('/chat/completions')) {
      targetUrl = `${targetUrl}/chat/completions`;
    }
  }

  const toolNames = Array.isArray(tools)
    ? tools.map((t: { function?: { name?: string } }) => t.function?.name).filter(Boolean)
    : [];
  logger.info('ToolLog', 'LLM Request: toolCount=', tools.length, 'toolNames=', toolNames);
  logger.info('LLM', 'Request:', {
    targetUrl,
    model: config.model,
    messageCount: messages.length,
    toolCount: tools.length,
  });
  
  // Direct API call (no proxy)
  const res = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
      ...parseCustomHeaders(config.customHeaders),
    },
    body: JSON.stringify(body),
  });

  logger.info('LLM', 'Response status:', res.status);
  const text = await res.text();
  logger.info('LLM', 'Response body:', text.slice(0, 500));

  if (!res.ok) {
    throw new Error(`LLM API error ${res.status}: ${text}`);
  }

  const data = JSON.parse(text);
  const choice = data.choices?.[0]?.message;
  const toolCalls = choice?.tool_calls || [];
  const calledNames = toolCalls
    .map((tc: { function?: { name?: string } }) => tc.function?.name)
    .filter(Boolean);
  logger.info(
    'ToolLog',
    'LLM Response: toolCalls count=',
    toolCalls.length,
    'calledNames=',
    calledNames,
  );
  return {
    content: choice?.content || '',
    toolCalls,
  };
}

async function chatAnthropic(
  messages: ChatMessage[],
  tools: ToolDef[],
  config: LLMConfig,
): Promise<LLMResponse> {
  // Extract system message
  const systemMsg = messages.find((m) => m.role === 'system')?.content || '';
  const nonSystemMessages = messages.filter((m) => m.role !== 'system');

  // Convert message format
  const anthropicMessages = nonSystemMessages.map((m) => {
    if (m.role === 'tool') {
      return {
        role: 'user' as const,
        content: [
          {
            type: 'tool_result' as const,
            tool_use_id: m.tool_call_id,
            content: m.content,
          },
        ],
      };
    }
    if (m.role === 'assistant' && m.tool_calls?.length) {
      return {
        role: 'assistant' as const,
        content: [
          ...(m.content ? [{ type: 'text' as const, text: m.content }] : []),
          ...m.tool_calls.map((tc) => ({
            type: 'tool_use' as const,
            id: tc.id,
            name: tc.function.name,
            input: JSON.parse(tc.function.arguments),
          })),
        ],
      };
    }
    return { role: m.role as 'user' | 'assistant', content: m.content };
  });

  // Convert tools
  const anthropicTools = tools.map((t) => ({
    name: t.function.name,
    description: t.function.description,
    input_schema: t.function.parameters,
  }));

  const body: Record<string, unknown> = {
    model: config.model,
    max_tokens: 4096,
    messages: anthropicMessages,
  };
  if (typeof config.maxTokens === 'number') {
    body.max_tokens = config.maxTokens;
  }
  if (typeof config.temperature === 'number') {
    body.temperature = config.temperature;
  }
  if (systemMsg) body.system = systemMsg;
  if (anthropicTools.length > 0) body.tools = anthropicTools;

  const anthropicToolNames = anthropicTools.map((t: { name?: string }) => t.name).filter(Boolean);
  logger.info(
    'ToolLog',
    'Anthropic Request: toolCount=',
    anthropicTools.length,
    'toolNames=',
    anthropicToolNames,
  );
  const targetUrl = `${config.baseUrl}/v1/messages`;
  logger.info('LLM', 'Anthropic Request:', {
    targetUrl,
    model: config.model,
    messageCount: anthropicMessages.length,
    toolCount: anthropicTools.length,
  });
  
  // Direct API call (no proxy)
  const res = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      ...parseCustomHeaders(config.customHeaders),
    },
    body: JSON.stringify(body),
  });

  logger.info('LLM', 'Anthropic Response status:', res.status);
  if (!res.ok) {
    const text = await res.text();
    logger.error('LLM', 'Anthropic Error body:', text.slice(0, 500));
    throw new Error(`Anthropic API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  logger.info('LLM', 'Anthropic Response data:', JSON.stringify(data).slice(0, 500));
  let content = '';
  const toolCalls: ToolCall[] = [];

  for (const block of data.content || []) {
    if (block.type === 'text') {
      content += block.text;
    } else if (block.type === 'tool_use') {
      toolCalls.push({
        id: block.id,
        type: 'function',
        function: {
          name: block.name,
          arguments: JSON.stringify(block.input),
        },
      });
    }
  }

  const calledNames = toolCalls.map((tc) => tc.function.name).filter(Boolean);
  logger.info(
    'ToolLog',
    'Anthropic Response: toolCalls count=',
    toolCalls.length,
    'calledNames=',
    calledNames,
  );
  return { content, toolCalls };
}
