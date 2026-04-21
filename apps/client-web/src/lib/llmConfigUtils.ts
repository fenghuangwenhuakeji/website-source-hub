import { DEFAULT_LLM_CONFIG, type LLMConfig } from '@/components/CodeEditor/actions/agentConstants';
import { normalizeCustomHeadersValue, parseCustomHeaders } from './llmClient';
import { readScopedStorageValue, writeScopedStorageValue } from './userScopedStorage';

export const CONFIG_STORAGE_KEY = 'webuiapps-codeeditor-config';
export const GLOBAL_CONFIG_STORAGE_KEY = 'webuiapps-llm-config';

function normalizeLLMConfig(input?: Partial<LLMConfig> | null): LLMConfig {
  const merged: LLMConfig = { ...DEFAULT_LLM_CONFIG, ...(input ?? {}) };
  return {
    ...merged,
    baseUrl: (merged.baseUrl || '').trim() || DEFAULT_LLM_CONFIG.baseUrl,
    model: (merged.model || '').trim() || DEFAULT_LLM_CONFIG.model,
    temperature: Number.isFinite(merged.temperature) ? merged.temperature : DEFAULT_LLM_CONFIG.temperature,
    maxTokens: Number.isFinite(merged.maxTokens) ? merged.maxTokens : DEFAULT_LLM_CONFIG.maxTokens,
    systemPrompt: merged.systemPrompt ?? DEFAULT_LLM_CONFIG.systemPrompt,
    customHeaders: normalizeCustomHeadersValue(merged.customHeaders),
  };
}

export function loadLLMConfigFromStorage(): LLMConfig {
  if (typeof localStorage === 'undefined') {
    return DEFAULT_LLM_CONFIG;
  }
  const raw = readScopedStorageValue(CONFIG_STORAGE_KEY);
  const fallbackRaw = raw ? null : readScopedStorageValue(GLOBAL_CONFIG_STORAGE_KEY);
  if (!raw && !fallbackRaw) {
    return DEFAULT_LLM_CONFIG;
  }
  try {
    const parsed = raw ? JSON.parse(raw) : JSON.parse(fallbackRaw ?? '');
    const normalized = normalizeLLMConfig(parsed?.llm ?? parsed);
    if (!raw && fallbackRaw) {
      writeScopedStorageValue(CONFIG_STORAGE_KEY, JSON.stringify(normalized));
    }
    return normalized;
  } catch {
    return DEFAULT_LLM_CONFIG;
  }
}

export function saveLLMConfigToStorage(config: LLMConfig): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  const normalized = normalizeLLMConfig(config);
  writeScopedStorageValue(CONFIG_STORAGE_KEY, JSON.stringify(normalized));
  writeScopedStorageValue(GLOBAL_CONFIG_STORAGE_KEY, JSON.stringify(normalized));
}

export function buildLLMRequestHeaders(config: LLMConfig): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (config.apiKey) {
    headers.Authorization = `Bearer ${config.apiKey}`;
  }
  if (config.customHeaders) {
    Object.assign(headers, parseCustomHeaders(config.customHeaders));
  }
  return headers;
}

export function resolveLLMChatEndpoint(rawUrl: string): string {
  let url = (rawUrl || DEFAULT_LLM_CONFIG.baseUrl).trim();
  if (!url) {
    return DEFAULT_LLM_CONFIG.baseUrl;
  }
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  const hasVersion = /\/(v\d+|chat)\/?$/.test(url);
  if (!hasVersion) {
    return `${url}/v1/chat/completions`;
  }
  if (!url.includes('/chat/completions')) {
    return `${url}/chat/completions`;
  }
  return url;
}
