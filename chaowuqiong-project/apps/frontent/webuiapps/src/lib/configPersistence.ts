/**
 * Unified config persistence for ~/.openroom/config.json
 *
 * The persisted format is: { llm: LLMConfig, imageGen?: ImageGenConfig, video?: VideoGenConfig, audio?: AudioGenConfig, apiPool?: LLMConfig[] }
 * Legacy files that contain a flat LLMConfig (with top-level "provider") are
 * automatically migrated on read.
 */

import type { LLMConfig } from './llmClient';
import type { ImageGenConfig } from './imageGenClient';
import type { VideoGenConfig } from './videoGenClient';
import type { AudioGenConfig } from './audioGenClient';
import {
  buildScopedAuthHeaders,
  readScopedStorageValue,
  writeScopedStorageValue,
} from './userScopedStorage';

export interface PersistedConfig {
  llm: LLMConfig;
  imageGen?: ImageGenConfig;
  video?: VideoGenConfig;
  audio?: AudioGenConfig;
  apiPool?: LLMConfig[];
}

export type ApiPoolItemType = 'text' | 'image' | 'video' | 'audio';

export type AnyApiConfig = LLMConfig | ImageGenConfig | VideoGenConfig | AudioGenConfig;

export interface ApiPoolItem {
  id: string;
  config: AnyApiConfig;
  isActive: boolean;
  configName: string;
  type: ApiPoolItemType;
}

const CONFIG_API = '/api/llm-config';
const POOL_STORAGE_KEY = 'webuiapps-api-pool';

/** Detect legacy flat LLMConfig (has "provider" at top level, no "llm" key). */
function isLegacyConfig(obj: unknown): obj is LLMConfig {
  return typeof obj === 'object' && obj !== null && 'provider' in obj && !('llm' in obj);
}

/**
 * Load API pool from localStorage
 */
export function loadApiPool(): ApiPoolItem[] {
  try {
    const raw = readScopedStorageValue(POOL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save API pool to localStorage
 */
export function saveApiPool(pool: ApiPoolItem[]): void {
  writeScopedStorageValue(POOL_STORAGE_KEY, JSON.stringify(pool));
}

/**
 * Load the full persisted config from ~/.openroom/config.json via the dev-server API.
 * Handles legacy flat LLMConfig format for backward compatibility.
 * Returns null if the API is unavailable or the file doesn't exist.
 */
export async function loadPersistedConfig(): Promise<PersistedConfig | null> {
  try {
    const res = await fetch(CONFIG_API, {
      headers: buildScopedAuthHeaders(),
    });
    if (res.ok) {
      const data: unknown = await res.json();
      const normalized =
        typeof data === 'object' && data !== null && 'data' in data
          ? (data as { data?: unknown }).data
          : data;
      if (isLegacyConfig(normalized)) {
        return { llm: normalized };
      }
      if (typeof normalized === 'object' && normalized !== null && 'llm' in normalized) {
        return normalized as PersistedConfig;
      }
    }
  } catch {
    // API not available (production / network error)
  }
  return null;
}

/**
 * Save the full config to ~/.openroom/config.json via the dev-server API.
 * Always writes the new { llm, imageGen? } format.
 */
export async function savePersistedConfig(config: PersistedConfig): Promise<void> {
  try {
    await fetch(CONFIG_API, {
      method: 'POST',
      headers: buildScopedAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(config),
    });
  } catch {
    // Silently ignore if API is not available
  }
}
