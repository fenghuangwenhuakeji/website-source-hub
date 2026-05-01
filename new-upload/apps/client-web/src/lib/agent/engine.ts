/**
 * Agent 对话引擎
 * 处理 Agent 对话、工具调用、工作流执行
 */

import type {
  Agent, Conversation, Message, AgentExecutionResult,
  ToolCall, WorkflowState, MemorySnapshot
} from './types';
import { getAgentById, getConversationById, addMessage, saveConversation, getMemorySnapshot, saveMemorySnapshot } from './store';
import { executeCommand } from '../tools/terminal';
import { listDirectory, readFile } from '../tools/filesystem';
import { readScopedStorageValue } from '../userScopedStorage';

const API_CONFIG_STORAGE_KEY = 'webuiapps-codeeditor-config';

// 工具定义
interface Tool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
  execute: (args: any) => Promise<any>;
}

// 可用工具
const availableTools: Tool[] = [
  {
    name: 'terminal',
    description: '执行终端命令',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', description: '要执行的命令' },
        cwd: { type: 'string', description: '工作目录' }
      },
      required: ['command']
    },
    execute: async (args) => {
      const result = await executeCommand({
        command: args.command,
        cwd: args.cwd || 'E:\\'
      });
      return result;
    }
  },
  {
    name: 'list_files',
    description: '列出目录内容',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '目录路径' }
      },
      required: ['path']
    },
    execute: async (args) => {
      return await listDirectory(args.path);
    }
  },
  {
    name: 'read_file',
    description: '读取文件内容',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '文件路径' }
      },
      required: ['path']
    },
    execute: async (args) => {
      return await readFile(args.path);
    }
  },
  {
    name: 'web_search',
    description: '搜索网络信息（模拟）',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '搜索关键词' }
      },
      required: ['query']
    },
    execute: async (args) => {
      return { result: `搜索 "${args.query}" 的结果（模拟）` };
    }
  }
];

// 解析工具调用
function parseToolCalls(content: string): ToolCall[] {
  const toolCalls: ToolCall[] = [];
  const regex = /<tool>(\w+)<\/tool>\s*<args>([\s\S]*?)<\/args>/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    try {
      toolCalls.push({
        id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: match[1],
        arguments: JSON.parse(match[2])
      });
    } catch {
      // 忽略解析错误
    }
  }
  
  return toolCalls;
}

// 执行工具调用
async function executeToolCalls(toolCalls: ToolCall[]): Promise<ToolCall[]> {
  const results: ToolCall[] = [];
  
  for (const call of toolCalls) {
    const tool = availableTools.find(t => t.name === call.name);
    if (tool) {
      try {
        call.result = await tool.execute(call.arguments);
      } catch (error) {
        call.result = { error: error instanceof Error ? error.message : '执行失败' };
      }
    } else {
      call.result = { error: `未知工具: ${call.name}` };
    }
    results.push(call);
  }
  
  return results;
}

// 构建系统提示词
function buildSystemPrompt(agent: Agent): string {
  let prompt = agent.config.systemPrompt || '';
  
  // 添加 Agent 文档内容
  if (agent.skillDoc) {
    prompt += '\n\n=== Agent 技能文档 ===\n' + agent.skillDoc.slice(0, 2000);
  }
  
  // 添加可用工具说明
  if (agent.config.tools && agent.config.tools.length > 0) {
    prompt += '\n\n=== 可用工具 ===\n';
    prompt += '你可以使用以下工具:\n';
    agent.config.tools.forEach(toolName => {
      const tool = availableTools.find(t => t.name === toolName);
      if (tool) {
        prompt += `- ${tool.name}: ${tool.description}\n`;
      }
    });
    prompt += '\n使用格式: <tool>工具名</tool><args>{"参数": "值"}</args>';
  }
  
  return prompt;
}

// 调用 LLM API
interface ApiConfig {
  provider?: string;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  customHeaders?: string;
}

function parseCustomHeaders(headersStr?: string): Record<string, string> {
  if (!headersStr) return {};
  const trimmed = headersStr.trim();
  if (!trimmed) return {};
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, string>;
      return Object.entries(parsed).reduce<Record<string, string>>((acc, [key, value]) => {
        if (!key) return acc;
        acc[key] = String(value);
        return acc;
      }, {});
    } catch {
      // fall through to pair parsing
    }
  }
  const headers: Record<string, string> = {};
  const delimiter = trimmed.includes('\n') ? /\r?\n/ : trimmed.includes(';') ? /;/ : /,/;
  const pairs = trimmed.split(delimiter);
  for (const pair of pairs) {
    const separatorIndex = pair.indexOf(':') >= 0 ? pair.indexOf(':') : pair.indexOf('=');
    if (separatorIndex <= 0) continue;
    const key = pair.slice(0, separatorIndex).trim();
    const value = pair.slice(separatorIndex + 1).trim();
    if (key && value) {
      headers[key] = value;
    }
  }
  return headers;
}

async function callLLM(
  messages: { role: string; content: string }[],
  config: Agent['config']
): Promise<string> {
  const apiConfig = JSON.parse(readScopedStorageValue(API_CONFIG_STORAGE_KEY) || '{}') as ApiConfig;

  if (!apiConfig.apiKey) {
    throw new Error('未配置 API 密钥，请先在设置中配置');
  }

  const response = await fetch('/api/llm-proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      provider: apiConfig.provider || 'openai',
      apiKey: apiConfig.apiKey,
      baseUrl: apiConfig.baseUrl,
      model: apiConfig.model || config.model || 'gpt-4o',
      messages,
      temperature: typeof apiConfig.temperature === 'number'
        ? apiConfig.temperature
        : (config.temperature ?? 0.7),
      max_tokens: apiConfig.maxTokens || config.maxTokens || 4000,
      customHeaders: apiConfig.customHeaders,
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API 调用失败: ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || data.data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error('LLM 响应格式无效');
  }
  return content;
}

// 执行 Agent 对话
export async function executeAgentConversation(
  agentId: string,
  conversationId: string,
  userInput: string
): Promise<AgentExecutionResult> {
  const startTime = Date.now();
  
  try {
    const agent = getAgentById(agentId);
    const conversation = getConversationById(conversationId);
    
    if (!agent) {
      return { success: false, output: 'Agent 不存在', messages: [], errors: ['Agent not found'] };
    }
    if (!conversation) {
      return { success: false, output: '对话不存在', messages: [], errors: ['Conversation not found'] };
    }
    
    // 添加用户消息
    const userMessage: Message = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: userInput,
      timestamp: new Date()
    };
    addMessage(conversationId, userMessage);
    
    // 构建消息历史
    const messages = conversation.messages.map(m => ({
      role: m.role,
      content: m.content
    }));
    
    // 添加系统提示词
    const systemPrompt = buildSystemPrompt(agent);
    messages.unshift({ role: 'system', content: systemPrompt });
    
    // 调用 LLM
    const response = await callLLM(messages, agent.config);
    
    // 解析工具调用
    const toolCalls = parseToolCalls(response);
    
    // 执行工具调用
    if (toolCalls.length > 0) {
      await executeToolCalls(toolCalls);
    }
    
    // 添加助手消息
    const assistantMessage: Message = {
      id: `msg_${Date.now()}_assistant`,
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      metadata: {
        agentId,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined
      }
    };
    addMessage(conversationId, assistantMessage);
    
    // 更新记忆
    await updateMemory(agentId, userInput, response);
    
    // 更新 Agent 统计
    agent.stats.totalMessages += 2;
    agent.stats.lastUsedAt = new Date();
    agent.stats.avgResponseTime = 
      (agent.stats.avgResponseTime * (agent.stats.totalConversations) + (Date.now() - startTime)) 
      / (agent.stats.totalConversations + 1);
    
    return {
      success: true,
      output: response,
      messages: [userMessage, assistantMessage],
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined
    };
    
  } catch (error) {
    return {
      success: false,
      output: '',
      messages: [],
      errors: [error instanceof Error ? error.message : '未知错误']
    };
  }
}

// 更新记忆
async function updateMemory(agentId: string, userInput: string, response: string): Promise<void> {
  const snapshot = getMemorySnapshot(agentId);
  
  // 添加短期记忆
  snapshot.shortTerm.push({
    id: `stm_${Date.now()}`,
    content: `用户: ${userInput.slice(0, 100)}`,
    type: 'context',
    timestamp: new Date(),
    relevance: 1.0
  });
  
  // 保持短期记忆容量
  const maxShortTerm = 20;
  if (snapshot.shortTerm.length > maxShortTerm) {
    snapshot.shortTerm = snapshot.shortTerm.slice(-maxShortTerm);
  }
  
  // 提取关键信息到长期记忆
  if (userInput.length > 50) {
    snapshot.longTerm.push({
      id: `ltm_${Date.now()}`,
      content: userInput.slice(0, 200),
      category: 'user_input',
      importance: 0.5,
      createdAt: new Date(),
      lastAccessed: new Date(),
      accessCount: 1
    });
  }
  
  saveMemorySnapshot(agentId, snapshot);
}

// 执行工作流
export async function executeWorkflow(
  agentId: string,
  workflowId: string,
  initialVariables: Record<string, any> = {}
): Promise<AgentExecutionResult> {
  // 工作流执行逻辑
  return {
    success: true,
    output: '工作流执行完成',
    messages: [],
    workflowState: {
      currentStep: 'completed',
      completedSteps: ['step1', 'step2'],
      variables: initialVariables
    }
  };
}

// 获取记忆上下文
export function getMemoryContext(agentId: string): string {
  const snapshot = getMemorySnapshot(agentId);
  
  let context = '=== 记忆上下文 ===\n';
  
  if (snapshot.shortTerm.length > 0) {
    context += '\n短期记忆:\n';
    snapshot.shortTerm.slice(-5).forEach(m => {
      context += `- ${m.content}\n`;
    });
  }
  
  if (snapshot.longTerm.length > 0) {
    context += '\n长期记忆:\n';
    snapshot.longTerm.slice(-3).forEach(m => {
      context += `- ${m.content}\n`;
    });
  }
  
  return context;
}

// 导出工具供外部使用
export { availableTools };
