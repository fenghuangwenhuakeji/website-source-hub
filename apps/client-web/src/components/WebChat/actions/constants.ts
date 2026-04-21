/**
 * WebChat Constants
 * 网页对话应用 - AI大模型聊天界面
 */

export const APP_ID = 35;
export const APP_NAME = 'webChat';
export const STATE_FILE = '/webchat_state.json';
export const CONFIG_FILE = '/webchat_config.json';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  wasTruncated?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export const DEFAULT_SESSION: ChatSession = {
  id: 'default',
  title: '新对话',
  messages: [
    {
      id: 'welcome',
      role: 'assistant',
      content: '你好！我是AI助手，有什么可以帮助你的吗？',
      timestamp: Date.now(),
    },
  ],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export const SUGGESTED_QUESTIONS = [
  '帮我写一段代码',
  '解释一下这个概念',
  '给我一些建议',
  '翻译这段话',
];

// API配置类型
export type LLMProvider = 'openai' | 'anthropic' | 'deepseek' | 'minimax' | 'custom';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  customHeaders?: string;
}

export const DEFAULT_CONFIGS: Record<LLMProvider, Omit<LLMConfig, 'apiKey' | 'temperature' | 'maxTokens' | 'systemPrompt' | 'customHeaders'>> = {
  openai: {
    provider: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o',
  },
  anthropic: {
    provider: 'anthropic',
    baseUrl: 'https://api.anthropic.com',
    model: 'claude-3-sonnet-20240229',
  },
  deepseek: {
    provider: 'deepseek',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
  },
  minimax: {
    provider: 'minimax',
    baseUrl: 'https://api.minimax.chat/v1',
    model: 'abab6.5-chat',
  },
  custom: {
    provider: 'custom',
    baseUrl: 'https://your-api-endpoint.com/v1',
    model: 'your-model',
  },
};

export const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: 'openai',
  apiKey: '',
  baseUrl: DEFAULT_CONFIGS.openai.baseUrl,
  model: DEFAULT_CONFIGS.openai.model,
  temperature: 0.7,
  maxTokens: 2000,
  systemPrompt: '你是一个有帮助的AI助手。',
  customHeaders: '',
};
