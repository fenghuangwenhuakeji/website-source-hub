/**
 * 配置管理工具 - AI 配置保存和测试
 */

import type { LLMConfig, LLMProvider } from '../aiPanelCore';
import { buildLLMRequestHeaders, loadLLMConfigFromStorage, saveLLMConfigToStorage } from '../llmConfigUtils';
import { DEFAULT_CONFIGS, DEFAULT_LLM_CONFIG } from '../../components/CodeEditor/actions/agentConstants';
import { readScopedStorageValue, writeScopedStorageValue } from '../userScopedStorage';

const CONFIG_KEY = 'ai-panel-config-v2';

export interface ConfigTestResult {
  success: boolean;
  message: string;
  latency?: number;
}

/**
 * 保存配置到 localStorage
 */
export function saveConfig(config: LLMConfig): boolean {
  try {
    saveLLMConfigToStorage(config as unknown as Parameters<typeof saveLLMConfigToStorage>[0]);
    writeScopedStorageValue(CONFIG_KEY, JSON.stringify(config));
    return true;
  } catch (error) {
    console.error('Failed to save config:', error);
    return false;
  }
}

/**
 * 从 localStorage 加载配置
 */
export function loadConfig(): LLMConfig | null {
  try {
    const saved = readScopedStorageValue(CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as LLMConfig;
      saveLLMConfigToStorage(parsed as unknown as Parameters<typeof saveLLMConfigToStorage>[0]);
      return loadLLMConfigFromStorage() as LLMConfig;
    }
  } catch (error) {
    console.error('Failed to load config:', error);
  }
  return loadLLMConfigFromStorage() as LLMConfig;
}

/**
 * 测试 API 连接
 */
export async function testConnection(config: LLMConfig): Promise<ConfigTestResult> {
  const startTime = Date.now();
  
  try {
    // 根据 provider 构建测试请求
    const testUrl = getTestUrl(config);
    
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: buildLLMRequestHeaders(config as unknown as Parameters<typeof buildLLMRequestHeaders>[0]),
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5,
      }),
    });

    const latency = Date.now() - startTime;

    if (response.ok) {
      return {
        success: true,
        message: `连接成功！延迟: ${latency}ms`,
        latency,
      };
    } else {
      const error = await response.text();
      return {
        success: false,
        message: `连接失败: ${response.status} - ${error}`,
        latency,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `连接错误: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * 获取测试 URL
 */
function getTestUrl(config: LLMConfig): string {
  const baseUrl = config.baseUrl.replace(/\/$/, '');
  
  switch (config.provider) {
    case 'openai':
      return `${baseUrl}/chat/completions`;
    case 'anthropic':
      return `${baseUrl}/messages`;
    case 'deepseek':
      return `${baseUrl}/chat/completions`;
    case 'minimax':
      return `${baseUrl}/text/chatcompletion_v2`;
    default:
      return `${baseUrl}/chat/completions`;
  }
}

/**
 * 获取默认配置
 */
export function getDefaultConfig(): LLMConfig {
  return { ...DEFAULT_LLM_CONFIG };
}

/**
 * 获取 Provider 默认配置
 */
export function getProviderDefaults(provider: LLMProvider): Partial<LLMConfig> {
  if (provider in DEFAULT_CONFIGS) {
    const defaults = DEFAULT_CONFIGS[provider as keyof typeof DEFAULT_CONFIGS];
    return { baseUrl: defaults.baseUrl, model: defaults.model };
  }
  switch (provider) {
    case 'openai':
      return {
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o',
      };
    case 'anthropic':
      return {
        baseUrl: 'https://api.anthropic.com/v1',
        model: 'claude-3-5-sonnet-20241022',
      };
    case 'deepseek':
      return {
        baseUrl: 'https://api.deepseek.com/v1',
        model: 'deepseek-chat',
      };
    case 'minimax':
      return {
        baseUrl: 'https://api.minimax.chat/v1',
        model: 'MiniMax-Text-01',
      };
    default:
      return {
        baseUrl: '',
        model: '',
      };
  }
}

/**
 * 验证配置
 */
export function validateConfig(config: LLMConfig): string | null {
  if (!config.apiKey.trim()) {
    return 'API Key 不能为空';
  }
  if (!config.baseUrl.trim()) {
    return 'Base URL 不能为空';
  }
  if (!config.model.trim()) {
    return 'Model 不能为空';
  }
  if (config.temperature < 0 || config.temperature > 2) {
    return 'Temperature 必须在 0-2 之间';
  }
  if (config.maxTokens < 1 || config.maxTokens > 100000) {
    return 'Max Tokens 必须在 1-100000 之间';
  }
  return null;
}
