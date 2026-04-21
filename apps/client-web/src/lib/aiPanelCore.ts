/**
 * AI Panel Core - 集成版 AI 面板核心系统
 * 
 * 整合功能：
 * - Moltbot: 多通道消息网关
 * - Claude-Code: Hook系统 + 工具调用
 * - Memory System: 记忆管理
 * - Agency-Agents: 144+ Agent模板
 */

import { logger } from './logger';
import { readScopedStorageValue, writeScopedStorageValue } from './userScopedStorage';

// ============================================================================
// 类型定义
// ============================================================================

export type LLMProvider = 'openai' | 'anthropic' | 'deepseek' | 'minimax' | 'custom';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

// 通道类型
export interface Channel {
  id: string;
  name: string;
  type: string;
  icon: React.ReactNode;
  color: string;
  status: 'connected' | 'disconnected' | 'connecting';
  config?: ChannelConfig;
}

export interface ChannelConfig {
  apiKey?: string;
  webhookUrl?: string;
  botToken?: string;
  appId?: string;
  appSecret?: string;
  enabled: boolean;
  autoReply: boolean;
  notifications: boolean;
}

// Agent类型
export interface Agent {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: string;
  skills: string[];
  capabilities: string[];
  status: 'active' | 'idle' | 'offline';
  provider: LLMProvider;
  systemPrompt?: string;
  tools?: string[];
  temperature?: number;
  maxTokens?: number;
  config?: AgentConfig;
  welcomeMessage?: string;
}

export interface AgentConfig {
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  capabilities: string[];
  autoStart: boolean;
  webhookUrl?: string;
}

// 工具类型
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    description: string;
    required?: boolean;
  }[];
  category: 'file' | 'code' | 'system' | 'web' | 'mcp' | 'custom';
  dangerous?: boolean;
}

export interface ToolCall {
  id: string;
  toolName: string;
  parameters: Record<string, any>;
  timestamp: number;
}

export interface ToolResult {
  callId: string;
  toolName: string;
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
}

// 记忆类型
export type MemoryType = 'long_term' | 'short_term' | 'instinct';
export type MemoryImportance = 'low' | 'medium' | 'high' | 'critical';

export interface Memory {
  id: string;
  type: MemoryType;
  content: string;
  summary?: string;
  importance: MemoryImportance;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  accessCount: number;
  lastAccessedAt: number;
  source?: string;
}

// 消息类型
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
}

// 会话类型
export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  agentId: string;
  createdAt: number;
  updatedAt: number;
}

// Hook类型
export type HookEventType = 'SessionStart' | 'UserPromptSubmit' | 'PreToolUse' | 'PostToolUse' | 'Stop' | 'Notification';

export interface HookContext {
  sessionId: string;
  timestamp: number;
  agentId?: string;
}

export interface HookResult {
  decision: 'approve' | 'block';
  reason?: string;
  systemMessage?: string;
  modifiedInput?: any;
}

export type HookHandler = (input: any, context: HookContext) => HookResult | Promise<HookResult>;

// ============================================================================
// AI Panel Core 类
// ============================================================================

export class AIPanelCore {
  // 数据存储
  private channels: Map<string, Channel> = new Map();
  private agents: Map<string, Agent> = new Map();
  private tools: Map<string, ToolDefinition> = new Map();
  private memories: Map<string, Memory> = new Map();
  private sessions: Map<string, ChatSession> = new Map();
  private hooks: Map<HookEventType, HookHandler[]> = new Map();
  private abortControllers: Map<string, AbortController> = new Map();

  // 当前状态
  public currentSessionId: string | null = null;
  public currentAgentId: string | null = null;

  constructor() {
    this.initializeDefaultChannels();
    this.initializeDefaultAgents();
    this.initializeDefaultTools();
    this.initializeDefaultHooks();
    this.loadMemoriesFromStorage();
  }

  // ============================================================================
  // 初始化默认数据
  // ============================================================================
  
  private initializeDefaultChannels() {
    const defaultChannels: Channel[] = [
      { id: 'telegram', name: 'Telegram', type: 'telegram', icon: '✈️', color: '#0088cc', status: 'disconnected' },
      { id: 'whatsapp', name: 'WhatsApp', type: 'whatsapp', icon: '💬', color: '#25d366', status: 'disconnected' },
      { id: 'discord', name: 'Discord', type: 'discord', icon: '🎮', color: '#5865f2', status: 'disconnected' },
      { id: 'slack', name: 'Slack', type: 'slack', icon: '💼', color: '#4a154b', status: 'disconnected' },
      { id: 'feishu', name: '飞书', type: 'feishu', icon: '📋', color: '#3370ff', status: 'disconnected' },
      { id: 'dingtalk', name: '钉钉', type: 'dingtalk', icon: '🔵', color: '#0089ff', status: 'disconnected' },
      { id: 'wecom', name: '企业微信', type: 'wecom', icon: '💚', color: '#07c160', status: 'disconnected' },
      { id: 'qq', name: 'QQ', type: 'qq', icon: '🐧', color: '#12b7f5', status: 'disconnected' },
      { id: 'webchat', name: 'WebChat', type: 'webchat', icon: '💻', color: '#faea5f', status: 'connected' },
    ];
    defaultChannels.forEach(ch => this.channels.set(ch.id, ch));
  }

  private initializeDefaultAgents() {
    const defaultAgents: Agent[] = [
      {
        id: 'general',
        name: '通用助手',
        icon: '🤖',
        description: '全能型AI助手',
        category: 'General',
        skills: ['chat', 'search', 'code'],
        capabilities: ['conversation', 'search', 'code_help'],
        status: 'active',
        provider: 'openai',
        systemPrompt: '你是一个有帮助的AI助手。请用中文回答用户的问题。',
        tools: ['Read', 'Write', 'Glob', 'Grep', 'WebSearch'],
        temperature: 0.7,
        maxTokens: 2000,
        welcomeMessage: '👋 你好！我是通用助手，你的全能型AI伙伴。\n\n我可以帮你：\n• 解答各类问题\n• 编写和调试代码\n• 搜索网络信息\n• 分析文件内容\n\n有什么我可以帮你的吗？',
      },
      {
        id: 'frontend',
        name: '前端开发',
        icon: '💻',
        description: 'React/Vue/Angular专家',
        category: 'Engineering',
        skills: ['react', 'vue', 'typescript', 'css'],
        capabilities: ['react', 'vue', 'angular', 'css', 'typescript'],
        status: 'active',
        provider: 'openai',
        systemPrompt: '你是一个前端开发专家，精通React、Vue、Angular等框架。',
        tools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'WebFetch'],
        temperature: 0.5,
        maxTokens: 2000,
        welcomeMessage: '👋 嗨！我是前端开发专家。\n\n我擅长：\n• React/Vue/Angular 开发\n• TypeScript 类型设计\n• CSS 样式优化\n• 前端性能调优\n• 组件库搭建\n\n有什么前端问题需要解决吗？',
      },
      {
        id: 'backend',
        name: '后端开发',
        icon: '🔧',
        description: 'Node.js/Python/Go专家',
        category: 'Engineering',
        skills: ['nodejs', 'python', 'database', 'api'],
        capabilities: ['nodejs', 'python', 'go', 'database', 'api_design'],
        status: 'active',
        provider: 'openai',
        systemPrompt: '你是一个后端开发专家，精通Node.js、Python、Go等语言和框架。',
        tools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash'],
        temperature: 0.5,
        maxTokens: 2000,
        welcomeMessage: '👋 你好！我是后端开发专家。\n\n我的专长：\n• Node.js/Python/Go 开发\n• 数据库设计与优化\n• RESTful API 设计\n• 微服务架构\n• 性能优化\n\n需要后端技术支持吗？',
      },
      {
        id: 'devops',
        name: 'DevOps',
        icon: '🚀',
        description: 'CI/CD和云架构',
        category: 'Engineering',
        skills: ['docker', 'kubernetes', 'aws', 'ci-cd'],
        capabilities: ['docker', 'kubernetes', 'aws', 'ci_cd', 'terraform'],
        status: 'active',
        provider: 'openai',
        systemPrompt: '你是一个DevOps专家，精通Docker、Kubernetes、CI/CD等工具。',
        tools: ['Read', 'Write', 'Bash', 'WebSearch'],
        temperature: 0.3,
        maxTokens: 2000,
        welcomeMessage: '🚀 欢迎！我是DevOps工程师。\n\n我可以帮你：\n• Docker 容器化\n• Kubernetes 编排\n• CI/CD 流水线搭建\n• 云平台配置(AWS/阿里云)\n• 自动化脚本编写\n\n有什么基础设施问题？',
      },
      {
        id: 'data',
        name: '数据分析师',
        icon: '📊',
        description: '数据处理和可视化',
        category: 'Data',
        skills: ['sql', 'pandas', 'visualization', 'ml'],
        capabilities: ['sql', 'pandas', 'visualization', 'machine_learning'],
        status: 'active',
        provider: 'openai',
        systemPrompt: '你是一个数据分析专家，精通SQL、Python数据分析和可视化。',
        tools: ['Read', 'Glob', 'Grep', 'WebSearch'],
        temperature: 0.3,
        maxTokens: 2000,
        welcomeMessage: '📊 你好！我是数据分析师。\n\n我擅长：\n• SQL 查询优化\n• Python 数据分析(Pandas)\n• 数据可视化(图表/报表)\n• 机器学习模型\n• 数据清洗与处理\n\n有什么数据需要分析？',
      },
      {
        id: 'writer',
        name: '写作助手',
        icon: '✍️',
        description: '文案、报告、邮件',
        category: 'Content',
        skills: ['writing', 'editing', 'translation'],
        capabilities: ['writing', 'editing', 'translation'],
        status: 'idle',
        provider: 'openai',
        systemPrompt: '你是一个写作助手，擅长撰写文案、报告和邮件。',
        tools: ['Read', 'Write', 'WebSearch'],
        temperature: 0.8,
        maxTokens: 2000,
        welcomeMessage: '✍️ 你好！我是写作助手。\n\n我可以帮你：\n• 撰写营销文案\n• 编写工作报告\n• 起草商务邮件\n• 润色和校对\n• 翻译和本地化\n\n需要写什么内容？',
      },
      {
        id: 'architect',
        name: '架构师',
        icon: '🏗️',
        description: '系统架构设计',
        category: 'Engineering',
        skills: ['architecture', 'patterns', 'scalability'],
        capabilities: ['system_design', 'architecture', 'scalability'],
        status: 'idle',
        provider: 'openai',
        systemPrompt: '你是一个系统架构师，擅长设计可扩展的系统架构。',
        tools: ['Read', 'Glob', 'Grep', 'WebSearch'],
        temperature: 0.3,
        maxTokens: 4000,
        welcomeMessage: '🏗️ 欢迎！我是系统架构师。\n\n我的领域：\n• 系统架构设计\n• 技术选型评估\n• 可扩展性规划\n• 性能优化策略\n• 架构模式应用\n\n有什么架构问题需要探讨？',
      },
    ];
    defaultAgents.forEach(agent => this.agents.set(agent.id, agent));
    if (defaultAgents.length > 0) {
      this.currentAgentId = defaultAgents[0].id;
    }
  }

  private initializeDefaultTools() {
    const defaultTools: ToolDefinition[] = [
      { name: 'Read', description: '读取文件内容', parameters: [{ name: 'file_path', type: 'string', description: '文件路径', required: true }], category: 'file' },
      { name: 'Write', description: '写入文件内容', parameters: [{ name: 'file_path', type: 'string', description: '文件路径', required: true }, { name: 'content', type: 'string', description: '文件内容', required: true }], category: 'file', dangerous: true },
      { name: 'Edit', description: '编辑文件内容', parameters: [{ name: 'file_path', type: 'string', description: '文件路径', required: true }, { name: 'old_string', type: 'string', description: '旧字符串', required: true }, { name: 'new_string', type: 'string', description: '新字符串', required: true }], category: 'file', dangerous: true },
      { name: 'Glob', description: '查找匹配的文件', parameters: [{ name: 'pattern', type: 'string', description: '匹配模式', required: true }], category: 'code' },
      { name: 'Grep', description: '在文件中搜索文本', parameters: [{ name: 'pattern', type: 'string', description: '搜索模式', required: true }], category: 'code' },
      { name: 'Bash', description: '执行系统命令', parameters: [{ name: 'command', type: 'string', description: '命令', required: true }], category: 'system', dangerous: true },
      { name: 'WebFetch', description: '获取网页内容', parameters: [{ name: 'url', type: 'string', description: 'URL地址', required: true }], category: 'web' },
      { name: 'WebSearch', description: '搜索网络内容', parameters: [{ name: 'query', type: 'string', description: '搜索查询', required: true }], category: 'web' },
    ];
    defaultTools.forEach(tool => this.tools.set(tool.name, tool));
  }

  private initializeDefaultHooks() {
    this.registerHook('PreToolUse', (input, context) => {
      const { toolName } = input;
      const tool = this.tools.get(toolName);
      if (tool?.dangerous) {
        return { decision: 'approve', systemMessage: `⚠️ 执行危险操作: ${toolName}` };
      }
      return { decision: 'approve' };
    });

    this.registerHook('UserPromptSubmit', (input, context) => {
      logger.info('AIPanelCore', `User prompt: ${input.content?.substring(0, 100)}...`);
      return { decision: 'approve' };
    });
  }

  // ============================================================================
  // Channel API
  // ============================================================================
  
  getChannels(): Channel[] { return Array.from(this.channels.values()); }
  getChannel(id: string): Channel | undefined { return this.channels.get(id); }
  
  updateChannel(id: string, updates: Partial<Channel>): Channel | undefined {
    const channel = this.channels.get(id);
    if (!channel) return undefined;
    Object.assign(channel, updates);
    this.channels.set(id, channel);
    return channel;
  }

  connectChannel(channelId: string): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) return false;
    channel.status = 'connected';
    this.channels.set(channelId, channel);
    logger.info('AIPanelCore', `Channel connected: ${channelId}`);
    return true;
  }

  disconnectChannel(channelId: string): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) return false;
    channel.status = 'disconnected';
    this.channels.set(channelId, channel);
    return true;
  }

  // ============================================================================
  // Agent API
  // ============================================================================
  
  getAgents(): Agent[] { return Array.from(this.agents.values()); }
  getAgent(id: string): Agent | undefined { return this.agents.get(id); }
  setCurrentAgent(agentId: string): void { this.currentAgentId = agentId; }
  getCurrentAgent(): Agent | undefined { return this.currentAgentId ? this.agents.get(this.currentAgentId) : undefined; }
  
  createAgent(): Agent {
    const newAgent: Agent = {
      id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: '新智能体',
      description: '这是一个新创建的智能体',
      icon: '🤖',
      color: '#4ade80',
      status: 'idle',
      provider: 'openai',
      temperature: 0.7,
      maxTokens: 2000,
      systemPrompt: '你是一个有用的AI助手。',
      capabilities: ['对话', '分析'],
      skills: [],
      welcomeMessage: '👋 你好！我是你的新智能体。\n\n我还可以：\n• 回答你的问题\n• 协助完成任务\n• 提供建议和创意\n\n请告诉我你需要什么帮助！',
    };
    this.agents.set(newAgent.id, newAgent);
    return newAgent;
  }

  // ============================================================================
  // Tool API
  // ============================================================================
  
  getTools(): ToolDefinition[] { return Array.from(this.tools.values()); }
  getTool(name: string): ToolDefinition | undefined { return this.tools.get(name); }

  buildOpenAITools(agentId: string): any[] | undefined {
    const agent = this.agents.get(agentId);
    if (!agent || !agent.tools || agent.tools.length === 0) return undefined;
    
    const tools: any[] = [];
    for (const toolName of agent.tools) {
      const tool = this.tools.get(toolName);
      if (tool) {
        tools.push({
          type: 'function',
          function: {
            name: tool.name,
            description: tool.description,
            parameters: {
              type: 'object',
              properties: Object.fromEntries(tool.parameters.map(p => [p.name, { type: p.type, description: p.description }])),
              required: tool.parameters.filter(p => p.required).map(p => p.name),
            },
          },
        });
      }
    }
    return tools.length > 0 ? tools : undefined;
  }

  // ============================================================================
  // Memory API
  // ============================================================================
  
  getMemories(): Memory[] { return Array.from(this.memories.values()).sort((a, b) => b.updatedAt - a.updatedAt); }
  
  getMemoriesByType(type: MemoryType): Memory[] { return this.getMemories().filter(m => m.type === type); }
  
  getMemoryStats() {
    const all = this.getMemories();
    return {
      longTerm: all.filter(m => m.type === 'long_term').length,
      shortTerm: all.filter(m => m.type === 'short_term').length,
      instinct: all.filter(m => m.type === 'instinct').length,
      total: all.length,
    };
  }

  createMemory(content: string, type: MemoryType = 'short_term', options: { importance?: MemoryImportance; tags?: string[]; source?: string } = {}): Memory {
    const now = Date.now();
    const memory: Memory = {
      id: `mem_${now}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      summary: content.length <= 50 ? content : content.substring(0, 50) + '...',
      importance: options.importance || 'medium',
      tags: options.tags || [],
      createdAt: now,
      updatedAt: now,
      accessCount: 0,
      lastAccessedAt: now,
      source: options.source || 'manual',
    };
    this.memories.set(memory.id, memory);
    this.saveMemoriesToStorage();
    return memory;
  }

  searchMemories(query: string): Memory[] {
    const lowerQuery = query.toLowerCase();
    return this.getMemories().filter(m => 
      m.content.toLowerCase().includes(lowerQuery) ||
      m.summary?.toLowerCase().includes(lowerQuery) ||
      m.tags.some(t => t.toLowerCase().includes(lowerQuery))
    );
  }

  private loadMemoriesFromStorage() {
    try {
      const data = readScopedStorageValue('ai_panel_memories');
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          parsed.forEach((mem: Memory) => this.memories.set(mem.id, mem));
        }
      }
    } catch (error) {
      logger.error('AIPanelCore', 'Failed to load memories:', error);
    }
  }

  private saveMemoriesToStorage() {
    try {
      writeScopedStorageValue('ai_panel_memories', JSON.stringify(this.getMemories()));
    } catch (error) {
      logger.error('AIPanelCore', 'Failed to save memories:', error);
    }
  }

  // ============================================================================
  // Session API
  // ============================================================================
  
  createSession(title: string = '新对话', agentId?: string): ChatSession {
    const session: ChatSession = {
      id: `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      messages: [],
      agentId: agentId || this.currentAgentId || 'general',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.sessions.set(session.id, session);
    this.currentSessionId = session.id;
    return session;
  }

  getSession(id: string): ChatSession | undefined { return this.sessions.get(id); }
  getSessions(): ChatSession[] { return Array.from(this.sessions.values()).sort((a, b) => b.updatedAt - a.updatedAt); }
  getCurrentSession(): ChatSession | undefined { return this.currentSessionId ? this.sessions.get(this.currentSessionId) : undefined; }
  setCurrentSession(sessionId: string): void { this.currentSessionId = sessionId; }
  deleteSession(sessionId: string): boolean { return this.sessions.delete(sessionId); }

  addMessage(sessionId: string, message: Message): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.messages.push(message);
      session.updatedAt = Date.now();
    }
  }

  // ============================================================================
  // Hook API
  // ============================================================================
  
  registerHook(event: HookEventType, handler: HookHandler): void {
    if (!this.hooks.has(event)) this.hooks.set(event, []);
    this.hooks.get(event)!.push(handler);
  }

  async executeHooks(event: HookEventType, input: any, context: HookContext): Promise<HookResult> {
    const handlers = this.hooks.get(event) || [];
    let finalResult: HookResult = { decision: 'approve' };
    for (const handler of handlers) {
      try {
        const result = await handler(input, context);
        if (result.decision === 'block') { finalResult = result; break; }
        if (result.systemMessage) finalResult.systemMessage = finalResult.systemMessage ? `${finalResult.systemMessage}\n${result.systemMessage}` : result.systemMessage;
        if (result.modifiedInput) finalResult.modifiedInput = { ...finalResult.modifiedInput, ...result.modifiedInput };
      } catch (error) {
        logger.error('AIPanelCore', `Hook execution error for ${event}:`, error);
      }
    }
    return finalResult;
  }

  // ============================================================================
  // 流式对话 API
  // ============================================================================
  
  async *streamMessage(
    sessionId: string,
    content: string,
    config: LLMConfig
  ): AsyncGenerator<{ type: 'content' | 'tool_call' | 'tool_result' | 'error' | 'done'; data: any }, void, unknown> {
    const session = this.sessions.get(sessionId);
    if (!session) { yield { type: 'error', data: { message: '会话不存在' } }; return; }

    const agent = this.agents.get(session.agentId);
    const context: HookContext = { sessionId, timestamp: Date.now(), agentId: agent?.id };

    // SessionStart Hook
    await this.executeHooks('SessionStart', { sessionId }, context);

    // UserPromptSubmit Hook
    const promptResult = await this.executeHooks('UserPromptSubmit', { content }, context);
    if (promptResult.decision === 'block') { yield { type: 'error', data: { message: promptResult.systemMessage || '请求被阻止' } }; return; }

    const finalContent = promptResult.modifiedInput?.content || content;

    // 准备AI请求 - 注意：用户消息已经在handleSendMessage中添加
    const messages = this.buildMessages(session);
    // 添加当前用户消息到消息列表用于API调用
    messages.push({ role: 'user', content: finalContent });
    const abortController = new AbortController();
    this.abortControllers.set(sessionId, abortController);

    try {
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: config.model, messages, stream: true, max_tokens: config.maxTokens, temperature: config.temperature, tools: this.buildOpenAITools(session.agentId) }),
        signal: abortController.signal,
      });

      if (!response.ok) throw new Error(`API错误: ${response.status}`);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let toolCalls: ToolCall[] = [];

      if (!reader) throw new Error('无法读取响应流');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta;
              if (delta?.content) { fullContent += delta.content; yield { type: 'content', data: { content: delta.content, fullContent } }; }
              if (delta?.tool_calls) {
                for (const tc of delta.tool_calls) {
                  if (tc.function) {
                    const toolCall: ToolCall = { id: tc.id || `tc_${Date.now()}`, toolName: tc.function.name, parameters: JSON.parse(tc.function.arguments || '{}'), timestamp: Date.now() };
                    toolCalls.push(toolCall);
                    yield { type: 'tool_call', data: toolCall };
                  }
                }
              }
            } catch {}
          }
        }
      }

      // 处理工具调用
      if (toolCalls.length > 0) {
        const toolResults: ToolResult[] = [];
        for (const toolCall of toolCalls) {
          const preResult = await this.executeHooks('PreToolUse', { toolName: toolCall.toolName, parameters: toolCall.parameters }, context);
          if (preResult.decision === 'block') {
            toolResults.push({ callId: toolCall.id, toolName: toolCall.toolName, success: false, output: '', error: preResult.systemMessage || '工具调用被阻止', executionTime: 0 });
            continue;
          }
          const startTime = Date.now();
          const result: ToolResult = { callId: toolCall.id, toolName: toolCall.toolName, success: true, output: `[${toolCall.toolName}] 执行成功`, executionTime: Date.now() - startTime };
          toolResults.push(result);
          yield { type: 'tool_result', data: result };
          await this.executeHooks('PostToolUse', { toolName: toolCall.toolName, result }, context);
        }
        // 注意：助手消息已经在handleSendMessage中添加，这里只更新消息内容
        const session = this.sessions.get(sessionId);
        if (session && session.messages.length > 0) {
          const lastMsg = session.messages[session.messages.length - 1];
          if (lastMsg.role === 'assistant') {
            lastMsg.content = fullContent;
            lastMsg.toolCalls = toolCalls;
            lastMsg.toolResults = toolResults;
            lastMsg.isStreaming = false;
          }
        }
      } else {
        // 注意：助手消息已经在handleSendMessage中添加，这里只更新消息内容
        const session = this.sessions.get(sessionId);
        if (session && session.messages.length > 0) {
          const lastMsg = session.messages[session.messages.length - 1];
          if (lastMsg.role === 'assistant') {
            lastMsg.content = fullContent;
            lastMsg.isStreaming = false;
          }
        }
      }

      // 从对话中提取记忆
      this.extractMemoriesFromConversation(sessionId, content);

      yield { type: 'done', data: { success: true } };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') yield { type: 'error', data: { message: '已取消' } };
      else yield { type: 'error', data: { message: error instanceof Error ? error.message : '未知错误' } };
    } finally {
      this.abortControllers.delete(sessionId);
    }
  }

  private buildMessages(session: ChatSession): any[] {
    const messages: any[] = [];
    const agent = this.agents.get(session.agentId);
    if (agent?.systemPrompt) messages.push({ role: 'system', content: agent.systemPrompt });
    for (const msg of session.messages) {
      if (msg.toolCalls && msg.toolResults) {
        messages.push({ role: 'assistant', content: msg.content, tool_calls: msg.toolCalls.map(tc => ({ id: tc.id, type: 'function', function: { name: tc.toolName, arguments: JSON.stringify(tc.parameters) } })) });
        for (const result of msg.toolResults) messages.push({ role: 'tool', tool_call_id: result.callId, content: result.success ? result.output : `Error: ${result.error}` });
      } else {
        messages.push({ role: msg.role, content: msg.content });
      }
    }
    return messages;
  }

  private extractMemoriesFromConversation(sessionId: string, content: string) {
    const patterns = [
      { pattern: /我叫(.+?)[，。]/, type: 'long_term' as MemoryType, tag: '姓名' },
      { pattern: /我是(.+?)[，。]/, type: 'long_term' as MemoryType, tag: '身份' },
      { pattern: /我喜欢(.+?)[，。]/, type: 'long_term' as MemoryType, tag: '喜好' },
      { pattern: /我的目标是(.+?)[，。]/, type: 'long_term' as MemoryType, tag: '目标' },
      { pattern: /记住(.+?)[，。]/, type: 'long_term' as MemoryType, tag: '重要' },
    ];
    for (const { pattern, type, tag } of patterns) {
      const match = content.match(pattern);
      if (match) this.createMemory(match[0], type, { importance: 'high', tags: [tag, 'auto_extracted'], source: `conversation_${sessionId}` });
    }
  }

  abortStream(sessionId: string): void {
    const controller = this.abortControllers.get(sessionId);
    if (controller) controller.abort();
  }
}

// 单例导出
let aiPanelCore: AIPanelCore | null = null;

export function getAIPanelCore(): AIPanelCore {
  if (!aiPanelCore) aiPanelCore = new AIPanelCore();
  return aiPanelCore;
}

export function resetAIPanelCore(): void {
  aiPanelCore = null;
}
