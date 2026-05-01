/**
 * Claw Code Query Engine - Enhanced
 * 查询引擎 - 增强版
 * 
 * 核心对话处理系统，支持：
 * - LLM集成
 * - 流式输出
 * - 智能路由
 * - 上下文管理
 * - 工具编排
 */

import {
  QueryEngineConfig,
  TurnResult,
  StreamEvent,
  UsageSummary,
  PermissionDenial,
  DEFAULT_CONFIG,
  generateId,
  RoutedMatch,
  ExecutionContext,
  AgentConfig,
  Workflow,
} from './types';
import { buildCommandBacklog, getCommands, findCommands, getCommandStats } from './commands';
import { buildToolBacklog, getTools, findTools, isDangerousTool, getToolStats, getToolImplementationStats } from './tools';
import { createSession, loadSession, saveSession, addMessageToSession, listSessions, deleteSession } from './sessionStore';
import { getRuntime, PortRuntime } from './runtime';

// ==================== LLM 集成 ====================

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'local' | 'mock';
  model: string;
  apiKey?: string;
  baseUrl?: string;
  temperature: number;
  maxTokens: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface LLMResponse {
  content: string;
  toolCalls?: ToolCall[];
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  finishReason: string;
}

// ==================== 流式事件类型 ====================

export type EnhancedStreamEvent =
  | StreamEvent
  | { type: 'thinking'; content: string }
  | { type: 'tool_call'; toolName: string; arguments: string }
  | { type: 'tool_result'; toolName: string; result: any }
  | { type: 'llm_start'; model: string }
  | { type: 'llm_delta'; content: string }
  | { type: 'llm_stop'; finishReason: string }
  | { type: 'routing_start'; prompt: string }
  | { type: 'routing_complete'; matches: RoutedMatch[] }
  | { type: 'context_update'; context: ExecutionContext }
  | { type: 'agent_start'; agentId: string; agentName: string }
  | { type: 'agent_complete'; agentId: string; result: any };

// ==================== 智能路由 ====================

export interface RoutingResult {
  matches: RoutedMatch[];
  strategy: 'single' | 'parallel' | 'sequential' | 'agent';
  confidence: number;
  reasoning: string;
}

class SmartRouter {
  private commandWeights: Map<string, number> = new Map();
  private toolWeights: Map<string, number> = new Map();
  private contextHistory: string[] = [];

  constructor() {
    this.initializeWeights();
  }

  private initializeWeights(): void {
    // 初始化命令权重
    getCommands().forEach(cmd => {
      this.commandWeights.set(cmd.name, 1.0);
    });
    // 初始化工具权重
    getTools().forEach(tool => {
      this.toolWeights.set(tool.name, 1.0);
    });
  }

  route(prompt: string, context?: string[]): RoutingResult {
    this.contextHistory.push(prompt);
    
    const tokens = this.tokenize(prompt);
    const commandMatches = this.scoreCommands(tokens, prompt);
    const toolMatches = this.scoreTools(tokens, prompt);
    
    // 合并并排序匹配结果
    const allMatches: RoutedMatch[] = [
      ...commandMatches.map(m => ({ ...m, kind: 'command' as const })),
      ...toolMatches.map(m => ({ ...m, kind: 'tool' as const })),
    ].sort((a, b) => b.score - a.score);

    // 确定执行策略
    const strategy = this.determineStrategy(allMatches, prompt);
    const confidence = this.calculateConfidence(allMatches);
    const reasoning = this.generateReasoning(allMatches, strategy);

    return {
      matches: allMatches.slice(0, 5),
      strategy,
      confidence,
      reasoning,
    };
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1)
      .filter(t => !this.isStopWord(t));
  }

  private isStopWord(word: string): boolean {
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      '我', '你', '他', '她', '它', '的', '了', '在', '是', '有', '和', '与']);
    return stopWords.has(word.toLowerCase());
  }

  private scoreCommands(tokens: string[], prompt: string): Array<{ name: string; sourceHint: string; score: number; confidence: 'high' | 'medium' | 'low' }> {
    const commands = getCommands();
    const matches: Array<{ name: string; sourceHint: string; score: number; confidence: 'high' | 'medium' | 'low' }> = [];

    for (const cmd of commands) {
      let score = 0;
      const nameTokens = this.tokenize(cmd.name);
      const respTokens = this.tokenize(cmd.responsibility || '');
      const hintTokens = this.tokenize(cmd.sourceHint);

      // 名称匹配（权重最高）
      for (const token of tokens) {
        if (nameTokens.some(t => t.includes(token) || token.includes(t))) {
          score += 2.0;
        }
      }

      // 描述匹配
      for (const token of tokens) {
        if (respTokens.some(t => t.includes(token))) {
          score += 1.0;
        }
      }

      // 路径匹配
      for (const token of tokens) {
        if (hintTokens.some(t => t.includes(token))) {
          score += 0.5;
        }
      }

      // 完全匹配检查
      if (cmd.name.toLowerCase() === prompt.toLowerCase() || 
          prompt.toLowerCase().includes(cmd.name.toLowerCase())) {
        score += 3.0;
      }

      // 应用权重
      const weight = this.commandWeights.get(cmd.name) || 1.0;
      score *= weight;

      if (score > 0) {
        const confidence = score > 3 ? 'high' : score > 1.5 ? 'medium' : 'low';
        matches.push({
          name: cmd.name,
          sourceHint: cmd.sourceHint,
          score: Math.min(score / tokens.length, 1.0),
          confidence,
        });
      }
    }

    return matches.sort((a, b) => b.score - a.score);
  }

  private scoreTools(tokens: string[], prompt: string): Array<{ name: string; sourceHint: string; score: number; confidence: 'high' | 'medium' | 'low' }> {
    const tools = getTools();
    const matches: Array<{ name: string; sourceHint: string; score: number; confidence: 'high' | 'medium' | 'low' }> = [];

    for (const tool of tools) {
      let score = 0;
      const nameTokens = this.tokenize(tool.name);
      const respTokens = this.tokenize(tool.responsibility || '');

      // 名称匹配
      for (const token of tokens) {
        if (nameTokens.some(t => t.includes(token) || token.includes(t))) {
          score += 2.0;
        }
      }

      // 描述匹配
      for (const token of tokens) {
        if (respTokens.some(t => t.includes(token))) {
          score += 1.0;
        }
      }

      // 完全匹配检查
      if (tool.name.toLowerCase() === prompt.toLowerCase() ||
          prompt.toLowerCase().includes(tool.name.toLowerCase())) {
        score += 3.0;
      }

      // 应用权重
      const weight = this.toolWeights.get(tool.name) || 1.0;
      score *= weight;

      if (score > 0) {
        const confidence = score > 3 ? 'high' : score > 1.5 ? 'medium' : 'low';
        matches.push({
          name: tool.name,
          sourceHint: tool.sourceHint,
          score: Math.min(score / tokens.length, 1.0),
          confidence,
        });
      }
    }

    return matches.sort((a, b) => b.score - a.score);
  }

  private determineStrategy(matches: RoutedMatch[], prompt: string): RoutingResult['strategy'] {
    // 根据匹配结果和提示词确定执行策略
    if (matches.length === 0) return 'single';
    
    const topScore = matches[0]?.score || 0;
    
    // 高置信度单工具/命令
    if (topScore > 0.8 && matches.length === 1) {
      return 'single';
    }
    
    // 多个高置信度匹配 - 并行执行
    if (matches.filter(m => m.score > 0.6).length > 1) {
      return 'parallel';
    }
    
    // 复杂任务 - 顺序执行
    if (prompt.length > 100 || matches.length > 3) {
      return 'sequential';
    }
    
    // 需要Agent协调
    if (prompt.includes('分析') || prompt.includes('优化') || prompt.includes('重构')) {
      return 'agent';
    }
    
    return 'single';
  }

  private calculateConfidence(matches: RoutedMatch[]): number {
    if (matches.length === 0) return 0;
    const topScore = matches[0].score;
    return Math.min(topScore * 1.2, 1.0); // 略微提升置信度
  }

  private generateReasoning(matches: RoutedMatch[], strategy: string): string {
    if (matches.length === 0) {
      return '没有找到匹配的命令或工具';
    }
    
    const topMatch = matches[0];
    return `基于关键词匹配，${topMatch.name} (${topMatch.kind}) 最符合需求，置信度 ${(topMatch.score * 100).toFixed(1)}%。采用${strategy}策略执行。`;
  }

  // 学习用户反馈，调整权重
  updateWeights(successfulTool: string, successfulCommand?: string): void {
    if (successfulTool) {
      const currentWeight = this.toolWeights.get(successfulTool) || 1.0;
      this.toolWeights.set(successfulTool, Math.min(currentWeight * 1.1, 2.0));
    }
    if (successfulCommand) {
      const currentWeight = this.commandWeights.get(successfulCommand) || 1.0;
      this.commandWeights.set(successfulCommand, Math.min(currentWeight * 1.1, 2.0));
    }
  }
}

// ==================== LLM 服务 ====================

class LLMService {
  private config: LLMConfig;
  private messageHistory: LLMMessage[] = [];

  constructor(config: Partial<LLMConfig> = {}) {
    this.config = {
      provider: 'mock',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2000,
      ...config,
    };
  }

  setConfig(config: Partial<LLMConfig>): void {
    this.config = { ...this.config, ...config };
  }

  addSystemMessage(content: string): void {
    this.messageHistory.push({ role: 'system', content });
  }

  addUserMessage(content: string): void {
    this.messageHistory.push({ role: 'user', content });
  }

  addAssistantMessage(content: string, toolCalls?: ToolCall[]): void {
    this.messageHistory.push({ role: 'assistant', content, toolCalls });
  }

  addToolResult(toolCallId: string, content: string): void {
    this.messageHistory.push({ role: 'tool', content, toolCallId });
  }

  clearHistory(): void {
    this.messageHistory = this.messageHistory.filter(m => m.role === 'system');
  }

  async complete(prompt: string, tools?: any[]): Promise<LLMResponse> {
    this.addUserMessage(prompt);
    
    // 根据提供商调用不同的API
    switch (this.config.provider) {
      case 'openai':
        return this.callOpenAI(tools);
      case 'anthropic':
        return this.callAnthropic(tools);
      case 'local':
        return this.callLocal(tools);
      case 'mock':
      default:
        return this.mockComplete(tools);
    }
  }

  async *streamComplete(prompt: string, tools?: any[]): AsyncGenerator<EnhancedStreamEvent> {
    this.addUserMessage(prompt);
    
    yield { type: 'llm_start', model: this.config.model };
    
    if (this.config.provider === 'mock' || !this.config.apiKey) {
      // 模拟流式输出
      const response = await this.mockComplete(tools);
      const chunks = response.content.split(' ');
      
      for (const chunk of chunks) {
        yield { type: 'llm_delta', content: chunk + ' ' };
        await this.delay(50);
      }
      
      yield { type: 'llm_stop', finishReason: response.finishReason };
      return;
    }
    
    // 真实流式API调用
    try {
      if (this.config.provider === 'openai') {
        yield* this.streamOpenAI(tools);
      } else if (this.config.provider === 'anthropic') {
        yield* this.streamAnthropic(tools);
      } else {
        // 其他提供商使用非流式
        const response = await this.complete(prompt, tools);
        yield { type: 'llm_delta', content: response.content };
        yield { type: 'llm_stop', finishReason: response.finishReason };
      }
    } catch (error) {
      yield { type: 'llm_stop', finishReason: 'error' };
      throw error;
    }
  }
  
  private async *streamOpenAI(tools?: any[]): AsyncGenerator<EnhancedStreamEvent> {
    const response = await fetch(`${this.config.baseUrl || 'https://api.openai.com/v1'}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: this.messageHistory,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        stream: true,
        tools: tools,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            yield { type: 'llm_stop', finishReason: 'stop' };
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices[0]?.delta?.content || '';
            if (delta) {
              fullContent += delta;
              yield { type: 'llm_delta', content: delta };
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
    
    this.addAssistantMessage(fullContent);
    yield { type: 'llm_stop', finishReason: 'stop' };
  }
  
  private async *streamAnthropic(tools?: any[]): AsyncGenerator<EnhancedStreamEvent> {
    const response = await fetch(`${this.config.baseUrl || 'https://api.anthropic.com'}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: this.messageHistory.filter(m => m.role !== 'system').map(m => ({
          role: m.role,
          content: m.content,
        })),
        system: this.messageHistory.find(m => m.role === 'system')?.content,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        stream: true,
        tools: tools,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta') {
              const delta = parsed.delta?.text || '';
              fullContent += delta;
              yield { type: 'llm_delta', content: delta };
            } else if (parsed.type === 'message_stop') {
              this.addAssistantMessage(fullContent);
              yield { type: 'llm_stop', finishReason: 'stop' };
              return;
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
    
    this.addAssistantMessage(fullContent);
    yield { type: 'llm_stop', finishReason: 'stop' };
  }

  private async callOpenAI(tools?: any[]): Promise<LLMResponse> {
    const response = await fetch(`${this.config.baseUrl || 'https://api.openai.com/v1'}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: this.messageHistory,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        top_p: this.config.topP,
        frequency_penalty: this.config.frequencyPenalty,
        presence_penalty: this.config.presencePenalty,
        tools: tools,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const choice = data.choices[0];
    
    this.addAssistantMessage(choice.message.content, choice.message.tool_calls);
    
    return {
      content: choice.message.content || '',
      toolCalls: choice.message.tool_calls,
      usage: {
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
      finishReason: choice.finish_reason,
    };
  }

  private async callAnthropic(tools?: any[]): Promise<LLMResponse> {
    const response = await fetch(`${this.config.baseUrl || 'https://api.anthropic.com'}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: this.messageHistory.filter(m => m.role !== 'system').map(m => ({
          role: m.role,
          content: m.content,
        })),
        system: this.messageHistory.find(m => m.role === 'system')?.content,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        tools: tools,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    this.addAssistantMessage(data.content[0]?.text || '', data.content);
    
    return {
      content: data.content[0]?.text || '',
      usage: {
        inputTokens: data.usage?.input_tokens || 0,
        outputTokens: data.usage?.output_tokens || 0,
        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      },
      finishReason: data.stop_reason,
    };
  }

  private async callLocal(tools?: any[]): Promise<LLMResponse> {
    const response = await fetch(`${this.config.baseUrl || 'http://localhost:11434'}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: this.messageHistory,
        stream: false,
        options: {
          temperature: this.config.temperature,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Local LLM error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    this.addAssistantMessage(data.message?.content || '');
    
    return {
      content: data.message?.content || '',
      usage: {
        inputTokens: data.prompt_eval_count || 0,
        outputTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      },
      finishReason: data.done ? 'stop' : 'length',
    };
  }

  private async mockComplete(tools?: any[]): Promise<LLMResponse> {
    // 模拟LLM响应
    const lastMessage = this.messageHistory[this.messageHistory.length - 1];
    const mockResponse = `这是对 "${lastMessage?.content?.substring(0, 30)}..." 的模拟回复。在实际部署中，这里会调用真实的LLM API。`;
    
    this.addAssistantMessage(mockResponse);
    
    return {
      content: mockResponse,
      usage: {
        inputTokens: this.estimateTokens(lastMessage?.content || ''),
        outputTokens: this.estimateTokens(mockResponse),
        totalTokens: this.estimateTokens(lastMessage?.content || '') + this.estimateTokens(mockResponse),
      },
      finishReason: 'stop',
    };
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ==================== 增强查询引擎 ====================

class EnhancedQueryEngine {
  private config: QueryEngineConfig;
  private sessionId: string;
  private messages: string[];
  private permissionDenials: PermissionDenial[];
  private usage: UsageSummary;
  private transcript: { id: string; content: string; timestamp: number; role: 'user' | 'assistant' | 'system' }[];
  private router: SmartRouter;
  private llmService: LLMService;
  private runtime: PortRuntime;
  private context: ExecutionContext;

  constructor(config: Partial<QueryEngineConfig> = {}, llmConfig?: Partial<LLMConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = generateId();
    this.messages = [];
    this.permissionDenials = [];
    this.usage = { inputTokens: 0, outputTokens: 0 };
    this.transcript = [];
    this.router = new SmartRouter();
    this.llmService = new LLMService(llmConfig);
    this.runtime = getRuntime();
    this.context = {
      sessionId: this.sessionId,
      workingDirectory: '/',
      environment: {},
      permissions: {
        deniedTools: new Set(),
        deniedPrefixes: new Set(),
        requireConfirmation: new Set(['BashTool', 'FileWriteTool', 'FileEditTool']),
      },
      history: [],
    };

    // 初始化系统提示
    this.initializeSystemPrompt();
  }

  private initializeSystemPrompt(): void {
    const systemPrompt = `你是一个智能编程助手，集成了Claw Code系统。
可用命令: ${getCommands().length}个
可用工具: ${getTools().length}个
你可以帮助用户编写代码、分析项目、执行命令等。`;
    
    this.llmService.addSystemMessage(systemPrompt);
    this.transcript.push({
      id: generateId(),
      content: systemPrompt,
      timestamp: Date.now(),
      role: 'system',
    });
  }

  static fromWorkspace(): EnhancedQueryEngine {
    return new EnhancedQueryEngine();
  }

  static fromSavedSession(sessionId: string): EnhancedQueryEngine | null {
    const stored = loadSession(sessionId);
    if (!stored) return null;

    const engine = new EnhancedQueryEngine();
    engine.sessionId = stored.sessionId;
    engine.messages = [...stored.messages];
    engine.usage = {
      inputTokens: stored.inputTokens,
      outputTokens: stored.outputTokens,
    };

    return engine;
  }

  // ==================== 核心方法 ====================

  getSessionId(): string {
    return this.sessionId;
  }

  getConfig(): QueryEngineConfig {
    return { ...this.config };
  }

  setConfig(config: Partial<QueryEngineConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getUsage(): UsageSummary {
    return { ...this.usage };
  }

  getMessages(): string[] {
    return [...this.messages];
  }

  getTranscript(): typeof this.transcript {
    return [...this.transcript];
  }

  getPermissionDenials(): PermissionDenial[] {
    return [...this.permissionDenials];
  }

  // ==================== 智能提交 ====================

  async submitMessage(
    prompt: string,
    options: {
      useLLM?: boolean;
      useTools?: boolean;
      autoExecute?: boolean;
    } = {}
  ): Promise<TurnResult & { routing?: RoutingResult; llmResponse?: LLMResponse }> {
    const { useLLM = true, useTools = true, autoExecute = false } = options;

    if (this.messages.length >= this.config.maxTurns) {
      return {
        prompt,
        output: `已达到最大对话轮数 (${this.config.maxTurns})`,
        matchedCommands: [],
        matchedTools: [],
        permissionDenials: [],
        usage: this.usage,
        stopReason: 'max_turns_reached',
      };
    }

    // 1. 智能路由
    const routing = this.router.route(prompt, this.messages);

    // 2. 检查权限
    const denials = this.checkPermissions(routing.matches);

    // 3. 执行匹配的工具/命令
    let toolResults: any[] = [];
    if (useTools && autoExecute && denials.length === 0) {
      toolResults = await this.executeMatches(routing.matches);
    }

    // 4. 调用LLM
    let llmResponse: LLMResponse | undefined;
    let output: string;

    if (useLLM) {
      const context = this.buildContext(prompt, routing, toolResults);
      llmResponse = await this.llmService.complete(context);
      output = llmResponse.content;
    } else {
      output = this.formatLocalResponse(prompt, routing, toolResults);
    }

    // 5. 更新状态
    this.updateState(prompt, output, routing, llmResponse);

    // 6. 检查停止条件
    const stopReason = this.checkStopReason();

    return {
      prompt,
      output,
      matchedCommands: routing.matches.filter(m => m.kind === 'command').map(m => m.name),
      matchedTools: routing.matches.filter(m => m.kind === 'tool').map(m => m.name),
      permissionDenials: denials,
      usage: this.usage,
      stopReason,
      routing,
      llmResponse,
    };
  }

  // ==================== 流式提交 ====================

  async *streamSubmitMessage(
    prompt: string,
    options: {
      useLLM?: boolean;
      useTools?: boolean;
      autoExecute?: boolean;
    } = {}
  ): AsyncGenerator<EnhancedStreamEvent> {
    const { useLLM = true, useTools = true, autoExecute = false } = options;

    yield { type: 'message_start', sessionId: this.sessionId, prompt };

    // 1. 智能路由
    yield { type: 'routing_start', prompt };
    const routing = this.router.route(prompt, this.messages);
    yield { type: 'routing_complete', matches: routing.matches };

    if (routing.matches.length > 0) {
      yield { type: 'command_match', commands: routing.matches.filter(m => m.kind === 'command').map(m => m.name) };
      yield { type: 'tool_match', tools: routing.matches.filter(m => m.kind === 'tool').map(m => m.name) };
    }

    // 2. 检查权限
    const denials = this.checkPermissions(routing.matches);
    if (denials.length > 0) {
      yield { type: 'permission_denial', denials: denials.map(d => d.toolName) };
    }

    // 3. 执行工具
    if (useTools && autoExecute && denials.length === 0) {
      for (const match of routing.matches.slice(0, 3)) {
        if (match.kind === 'tool') {
          yield { type: 'tool_call', toolName: match.name, arguments: '{}' };
          const result = await this.runtime.executeTool(match.name, prompt);
          yield { type: 'tool_result', toolName: match.name, result };
        }
      }
    }

    // 4. LLM流式响应
    let output = '';
    if (useLLM) {
      const context = this.buildContext(prompt, routing, []);
      for await (const event of this.llmService.streamComplete(context)) {
        yield event;
        if (event.type === 'llm_delta') {
          output += event.content;
        }
      }
    } else {
      output = this.formatLocalResponse(prompt, routing, []);
      yield { type: 'message_delta', text: output };
    }

    // 5. 更新状态
    this.updateState(prompt, output, routing);

    yield {
      type: 'message_stop',
      usage: this.usage,
      stopReason: this.checkStopReason(),
      transcriptSize: this.transcript.length,
    };
  }

  // ==================== 辅助方法 ====================

  private checkPermissions(matches: RoutedMatch[]): PermissionDenial[] {
    const denials: PermissionDenial[] = [];
    
    for (const match of matches) {
      if (match.kind === 'tool' && isDangerousTool(match.name)) {
        denials.push({
          toolName: match.name,
          reason: `工具 '${match.name}' 需要显式权限才能执行潜在危险操作`,
        });
      }
    }
    
    return denials;
  }

  private async executeMatches(matches: RoutedMatch[]): Promise<any[]> {
    const results: any[] = [];
    
    for (const match of matches.slice(0, 3)) { // 最多执行3个
      try {
        if (match.kind === 'tool') {
          const result = await this.runtime.executeTool(match.name);
          results.push({ type: 'tool', name: match.name, result });
        } else {
          const result = await this.runtime.executeCommand(match.name);
          results.push({ type: 'command', name: match.name, result });
        }
      } catch (error) {
        results.push({ type: match.kind, name: match.name, error });
      }
    }
    
    return results;
  }

  private buildContext(prompt: string, routing: RoutingResult, toolResults: any[]): string {
    const parts = [
      `用户输入: ${prompt}`,
      `\n路由策略: ${routing.strategy}`,
      `置信度: ${(routing.confidence * 100).toFixed(1)}%`,
      `\n匹配结果:`,
      ...routing.matches.slice(0, 3).map(m => `- ${m.name} (${m.kind}): ${(m.score * 100).toFixed(1)}%`),
    ];

    if (toolResults.length > 0) {
      parts.push('\n工具执行结果:');
      toolResults.forEach(r => {
        parts.push(`- ${r.name}: ${r.error ? '失败' : '成功'}`);
      });
    }

    return parts.join('\n');
  }

  private formatLocalResponse(prompt: string, routing: RoutingResult, toolResults: any[]): string {
    const lines = [
      `处理输入: ${prompt}`,
      ``,
      `路由分析:`,
      `- 策略: ${routing.strategy}`,
      `- 置信度: ${(routing.confidence * 100).toFixed(1)}%`,
      `- 推理: ${routing.reasoning}`,
      ``,
      `匹配结果:`,
    ];

    routing.matches.slice(0, 5).forEach((m, i) => {
      lines.push(`${i + 1}. ${m.name} (${m.kind}) - 置信度: ${(m.score * 100).toFixed(1)}%`);
    });

    if (toolResults.length > 0) {
      lines.push('', '执行结果:');
      toolResults.forEach(r => {
        lines.push(`- ${r.name}: ${r.error ? `✗ ${r.error}` : '✓ 成功'}`);
      });
    }

    return lines.join('\n');
  }

  private updateState(prompt: string, output: string, routing: RoutingResult, llmResponse?: LLMResponse): void {
    this.messages.push(prompt);
    this.transcript.push(
      { id: generateId(), content: prompt, timestamp: Date.now(), role: 'user' },
      { id: generateId(), content: output, timestamp: Date.now(), role: 'assistant' }
    );

    // 更新使用量
    if (llmResponse) {
      this.usage.inputTokens += llmResponse.usage.inputTokens;
      this.usage.outputTokens += llmResponse.usage.outputTokens;
    } else {
      this.usage.inputTokens += Math.ceil(prompt.length / 4);
      this.usage.outputTokens += Math.ceil(output.length / 4);
    }

    // 压缩历史
    this.compactMessagesIfNeeded();
  }

  private checkStopReason(): TurnResult['stopReason'] {
    const totalTokens = this.usage.inputTokens + this.usage.outputTokens;
    
    if (totalTokens > this.config.maxBudgetTokens) {
      return 'max_budget_reached';
    }
    
    if (this.messages.length >= this.config.maxTurns) {
      return 'max_turns_reached';
    }
    
    return 'completed';
  }

  private compactMessagesIfNeeded(): void {
    if (this.messages.length > this.config.compactAfterTurns) {
      this.messages = this.messages.slice(-this.config.compactAfterTurns);
    }
    if (this.transcript.length > this.config.compactAfterTurns * 2) {
      this.transcript = this.transcript.slice(-this.config.compactAfterTurns * 2);
    }
  }

  // ==================== 会话管理 ====================

  persistSession(): string {
    const session = createSession(this.messages);
    session.inputTokens = this.usage.inputTokens;
    session.outputTokens = this.usage.outputTokens;
    return saveSession(session);
  }

  exportSession(): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      messages: this.messages,
      transcript: this.transcript,
      usage: this.usage,
      timestamp: Date.now(),
    }, null, 2);
  }

  importSession(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      this.sessionId = parsed.sessionId || generateId();
      this.messages = parsed.messages || [];
      this.transcript = parsed.transcript || [];
      this.usage = parsed.usage || { inputTokens: 0, outputTokens: 0 };
      return true;
    } catch {
      return false;
    }
  }

  flushTranscript(): void {
    this.transcript = [];
  }

  clearHistory(): void {
    this.messages = [];
    this.transcript = [];
    this.llmService.clearHistory();
  }

  // ==================== 报告生成 ====================

  renderSummary(): string {
    const cmdStats = getCommandStats();
    const toolStats = getToolStats();
    const implStats = getToolImplementationStats();

    const sections = [
      '╔══════════════════════════════════════════════════════════╗',
      '║  Claw Code Query Engine Summary                          ║',
      '╠══════════════════════════════════════════════════════════╣',
      `║  Session ID: ${this.sessionId.padEnd(46)}║`,
      `║  Conversation turns: ${this.messages.length.toString().padEnd(37)}║`,
      `║  Permission denials: ${this.permissionDenials.length.toString().padEnd(37)}║`,
      `║  Usage: in=${this.usage.inputTokens.toString().padEnd(6)} out=${this.usage.outputTokens.toString().padEnd(33)}║`,
      '╠══════════════════════════════════════════════════════════╣',
      '║  Available Commands:                                     ║',
      `║    Total: ${cmdStats.total.toString().padEnd(47)}║`,
      `║    Mirrored: ${cmdStats.mirrored.toString().padEnd(44)}║`,
      `║    Implemented: ${cmdStats.implemented.toString().padEnd(41)}║`,
      '╠══════════════════════════════════════════════════════════╣',
      '║  Available Tools:                                        ║',
      `║    Total: ${toolStats.total.toString().padEnd(47)}║`,
      `║    Implemented: ${implStats.implemented}/${implStats.total} (${implStats.percentage}%)${''.padEnd(25)}║`,
      `║    Dangerous: ${toolStats.dangerous.toString().padEnd(43)}║`,
      '╠══════════════════════════════════════════════════════════╣',
      '║  Recent Messages                                         ║',
    ];

    this.transcript.slice(-5).forEach((t, i) => {
      const preview = t.content.substring(0, 40).replace(/\n/g, ' ');
      sections.push(`║  ${i + 1}. [${t.role}] ${preview.padEnd(40)}║`);
    });

    sections.push('╚══════════════════════════════════════════════════════════╝');

    return sections.join('\n');
  }

  renderDetailedReport(): string {
    const lines = [
      '# Claw Code Query Engine 详细报告',
      '',
      '## 会话信息',
      `- Session ID: ${this.sessionId}`,
      `- 创建时间: ${new Date().toLocaleString()}`,
      `- 对话轮数: ${this.messages.length}`,
      `- Token使用量: 输入=${this.usage.inputTokens}, 输出=${this.usage.outputTokens}`,
      '',
      '## 配置',
      `- 最大轮数: ${this.config.maxTurns}`,
      `- Token预算: ${this.config.maxBudgetTokens}`,
      `- 压缩阈值: ${this.config.compactAfterTurns}`,
      '',
      '## 完整对话记录',
      ...this.transcript.map(t => `\n### ${t.role} (${new Date(t.timestamp).toLocaleTimeString()})\n${t.content}`),
    ];

    return lines.join('\n');
  }
}

// ==================== 向后兼容 ====================

export class QueryEngine extends EnhancedQueryEngine {}

// ==================== 工具函数 ====================

export function routePrompt(
  prompt: string,
  limit: number = 5
): { kind: 'command' | 'tool'; name: string; sourceHint: string; score: number }[] {
  const router = new SmartRouter();
  const result = router.route(prompt);
  return result.matches.slice(0, limit).map(m => ({
    kind: m.kind,
    name: m.name,
    sourceHint: m.sourceHint,
    score: m.score,
  }));
}

export function inferPermissionDenials(
  matchedTools: { name: string }[]
): PermissionDenial[] {
  const denials: PermissionDenial[] = [];

  for (const tool of matchedTools) {
    if (isDangerousTool(tool.name)) {
      denials.push({
        toolName: tool.name,
        reason: `工具 '${tool.name}' 需要显式权限才能执行潜在危险操作`,
      });
    }
  }

  return denials;
}

// ==================== 导出 ====================

export {
  SmartRouter,
  LLMService,
  getCommands,
  getTools,
  findCommands,
  findTools,
  isDangerousTool,
  getCommandStats,
  getToolStats,
  getToolImplementationStats,
  createSession,
  loadSession,
  saveSession,
  listSessions,
  deleteSession,
  getRuntime,
};

export default EnhancedQueryEngine;
