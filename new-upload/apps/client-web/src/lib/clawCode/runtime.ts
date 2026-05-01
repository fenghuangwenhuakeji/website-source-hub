/**
 * Claw Code Runtime - Ultra Enhanced
 * 运行时系统 - 超强增强版
 * 
 * 性能优化：
 * - 路由结果缓存
 * - 分词结果缓存
 * - 模块评分缓存
 * - 批量执行优化
 * - 内存管理优化
 */

import {
  RoutedMatch,
  PortContext,
  ToolPermissionContext,
  ExecutionContext,
  ExecutionHistoryEntry,
  RuntimeState,
  RuntimeMetrics,
  AgentOrchestration,
  AgentConfig,
} from './types';
import { PORTED_COMMANDS, getCommand, executeCommand } from './commands';
import { PORTED_TOOLS, getTool, executeToolAsync, isDangerousTool } from './tools';

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

class RuntimeCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private maxSize: number = 500;
  private defaultTTL: number = 5 * 60 * 1000;
  private hits: number = 0;
  private misses: number = 0;

  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return undefined;
    }
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.misses++;
      return undefined;
    }
    
    entry.hits++;
    this.hits++;
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set<T>(key: string, value: T, ttl?: number): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      hits: 0,
    });
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats(): { size: number; hits: number; misses: number; hitRate: number } {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }
}

const globalCache = new RuntimeCache();

interface RuntimeConfig {
  maxHistorySize: number;
  enableLogging: boolean;
  enableMetrics: boolean;
  enableCache: boolean;
  cacheTTL: number;
  defaultPermissions: ToolPermissionContext;
}

const DEFAULT_CONFIG: RuntimeConfig = {
  maxHistorySize: 1000,
  enableLogging: true,
  enableMetrics: true,
  enableCache: true,
  cacheTTL: 5 * 60 * 1000,
  defaultPermissions: {
    deniedTools: new Set(),
    deniedPrefixes: new Set(),
    allowedTools: undefined,
    requireConfirmation: new Set(['BashTool', 'FileWriteTool', 'FileEditTool']),
    autoApprove: false,
  },
};

const tokenizeCache = new Map<string, string[]>();
const scoreCache = new Map<string, number>();

export class PortRuntime {
  private history: ExecutionHistoryEntry[] = [];
  private config: RuntimeConfig;
  private state: RuntimeState;
  private metrics: RuntimeMetrics;
  private context: ExecutionContext;
  private agents: Map<string, AgentConfig> = new Map();
  private orchestration: AgentOrchestration | null = null;
  private commandIndex: Map<string, { name: string; sourceHint: string; responsibility: string }>;
  private toolIndex: Map<string, { name: string; sourceHint: string; responsibility: string }>;

  constructor(config: Partial<RuntimeConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = {
      isRunning: false,
      currentTurn: 0,
      totalTokens: 0,
      budgetRemaining: 200000,
      sessionId: null,
    };
    this.metrics = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageLatency: 0,
      tokenUsage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      toolUsage: {},
      commandUsage: {},
    };
    this.context = {
      sessionId: '',
      workingDirectory: '/',
      environment: {},
      permissions: this.config.defaultPermissions,
      history: [],
    };
    
    this.commandIndex = new Map(PORTED_COMMANDS.map(c => [c.name.toLowerCase(), c]));
    this.toolIndex = new Map(PORTED_TOOLS.map(t => [t.name.toLowerCase(), t]));
  }

  routePrompt(prompt: string, limit: number = 5): RoutedMatch[] {
    const cacheKey = `route:${prompt}:${limit}`;
    
    if (this.config.enableCache) {
      const cached = globalCache.get<RoutedMatch[]>(cacheKey);
      if (cached) {
        this.addHistory('routing', `Cache hit for prompt="${prompt.substring(0, 30)}..."`, 'debug');
        return cached;
      }
    }
    
    const tokens = this.tokenize(prompt);
    
    const commandMatches = this.collectMatches(tokens, PORTED_COMMANDS, 'command');
    const toolMatches = this.collectMatches(tokens, PORTED_TOOLS, 'tool');

    const selected: RoutedMatch[] = [];

    if (commandMatches.length > 0) selected.push(commandMatches.shift()!);
    if (toolMatches.length > 0) selected.push(toolMatches.shift()!);

    const leftovers = [...commandMatches, ...toolMatches]
      .sort((a, b) => b.score - a.score);

    selected.push(...leftovers.slice(0, limit - selected.length));

    const result = selected.slice(0, limit);
    
    if (this.config.enableCache) {
      globalCache.set(cacheKey, result, this.config.cacheTTL);
    }
    
    this.addHistory('routing', `matches=${result.length} for prompt="${prompt.substring(0, 50)}..."`, 'info');

    return result;
  }

  private tokenize(prompt: string): string[] {
    if (this.config.enableCache && tokenizeCache.has(prompt)) {
      return tokenizeCache.get(prompt)!;
    }
    
    const tokens = prompt
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1);
    
    if (this.config.enableCache && tokenizeCache.size < 1000) {
      tokenizeCache.set(prompt, tokens);
    }
    
    return tokens;
  }

  private collectMatches(
    tokens: string[],
    modules: { name: string; sourceHint: string; responsibility: string }[],
    kind: 'command' | 'tool'
  ): RoutedMatch[] {
    const matches: RoutedMatch[] = [];

    for (const module of modules) {
      const score = this.scoreModule(tokens, module);
      if (score > 0) {
        const confidence = score > 0.8 ? 'high' : score > 0.5 ? 'medium' : 'low';
        matches.push({
          kind,
          name: module.name,
          sourceHint: module.sourceHint,
          score,
          confidence,
        });
      }
    }

    return matches.sort((a, b) => b.score - a.score);
  }

  private scoreModule(
    tokens: string[],
    module: { name: string; sourceHint: string; responsibility: string }
  ): number {
    const cacheKey = `score:${tokens.join(',')}:${module.name}`;
    
    if (this.config.enableCache && scoreCache.has(cacheKey)) {
      return scoreCache.get(cacheKey)!;
    }
    
    const nameTokens = this.tokenize(module.name);
    const hintTokens = this.tokenize(module.sourceHint);
    const respTokens = this.tokenize(module.responsibility);

    let score = 0;
    let matches = 0;

    for (const token of tokens) {
      if (nameTokens.some(t => t.includes(token) || token.includes(t))) {
        score += 1.0;
        matches++;
      }
      // 路径匹配
      else if (hintTokens.some(t => t.includes(token) || token.includes(t))) {
        score += 0.6;
        matches++;
      }
      // 描述匹配
      else if (respTokens.some(t => t.includes(token) || token.includes(t))) {
        score += 0.4;
        matches++;
      }
    }

    // 完全匹配名称获得额外加分
    const nameLower = module.name.toLowerCase();
    const promptLower = tokens.join(' ');
    if (nameLower === promptLower || promptLower.includes(nameLower)) {
      score += 2.0;
    }

    const finalScore = matches > 0 ? score / tokens.length : 0;
    
    if (this.config.enableCache && scoreCache.size < 5000) {
      scoreCache.set(cacheKey, finalScore);
    }
    
    return finalScore;
  }

  getCacheStats(): { cache: ReturnType<RuntimeCache['getStats']>; tokenize: number; score: number } {
    return {
      cache: globalCache.getStats(),
      tokenize: tokenizeCache.size,
      score: scoreCache.size,
    };
  }

  clearCaches(): void {
    globalCache.clear();
    tokenizeCache.clear();
    scoreCache.clear();
    this.addHistory('cache', 'All caches cleared', 'info');
  }

  // ==================== 执行方法 ====================

  async executeCommand(name: string, prompt: string = ''): Promise<any> {
    const startTime = Date.now();
    this.state.isRunning = true;

    try {
      const result = executeCommand(name, prompt);
      
      const duration = Date.now() - startTime;
      this.updateMetrics('command', name, duration, result.handled);
      
      this.addHistory('command', `Executed ${name}: ${result.handled ? 'success' : 'failed'}`, result.handled ? 'info' : 'error');
      
      return {
        ...result,
        duration,
        timestamp: Date.now(),
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateMetrics('command', name, duration, false);
      this.addHistory('command', `Error executing ${name}: ${error}`, 'error');
      throw error;
    } finally {
      this.state.isRunning = false;
    }
  }

  async executeTool(name: string, payload: string = ''): Promise<any> {
    const startTime = Date.now();
    this.state.isRunning = true;

    // 检查权限
    if (this.isToolDenied(name)) {
      const denial = {
        name,
        sourceHint: getTool(name)?.sourceHint || '',
        payload,
        handled: false,
        message: `Tool '${name}' is denied by permission context`,
        duration: Date.now() - startTime,
        timestamp: Date.now(),
      };
      this.addHistory('permission', `Denied tool ${name}`, 'warn');
      return denial;
    }

    // 检查是否需要确认
    if (this.requiresConfirmation(name)) {
      this.addHistory('permission', `Tool ${name} requires confirmation`, 'warn');
    }

    try {
      // 使用异步执行获取完整结果
      const result = await executeToolAsync(name, payload);
      
      const duration = Date.now() - startTime;
      this.updateMetrics('tool', name, duration, result.handled);
      
      this.addHistory('tool', `Executed ${name}: ${result.handled ? 'success' : 'failed'}`, result.handled ? 'info' : 'error');
      
      return {
        ...result,
        duration,
        timestamp: Date.now(),
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateMetrics('tool', name, duration, false);
      this.addHistory('tool', `Error executing ${name}: ${error}`, 'error');
      throw error;
    } finally {
      this.state.isRunning = false;
    }
  }

  async executeBatch(items: Array<{ type: 'command' | 'tool'; name: string; input: string }>): Promise<any[]> {
    const results: any[] = [];
    
    for (const item of items) {
      try {
        const result = item.type === 'command'
          ? await this.executeCommand(item.name, item.input)
          : await this.executeTool(item.name, item.input);
        results.push(result);
      } catch (error) {
        results.push({
          type: item.type,
          name: item.name,
          error: String(error),
          handled: false,
        });
      }
    }
    
    return results;
  }

  // ==================== Agent 编排 ====================

  registerAgent(agent: AgentConfig): void {
    this.agents.set(agent.id, agent);
    this.addHistory('agent', `Registered agent ${agent.name} (${agent.id})`, 'info');
  }

  unregisterAgent(agentId: string): boolean {
    const removed = this.agents.delete(agentId);
    if (removed) {
      this.addHistory('agent', `Unregistered agent ${agentId}`, 'info');
    }
    return removed;
  }

  getAgent(agentId: string): AgentConfig | undefined {
    return this.agents.get(agentId);
  }

  listAgents(): AgentConfig[] {
    return Array.from(this.agents.values());
  }

  setupOrchestration(config: AgentOrchestration): void {
    this.orchestration = config;
    this.addHistory('orchestration', `Setup ${config.strategy} orchestration with ${config.agents.length} agents`, 'info');
  }

  async runOrchestration(prompt: string): Promise<any> {
    if (!this.orchestration) {
      throw new Error('No orchestration configured');
    }

    const { agents, strategy, maxRounds } = this.orchestration;
    const results: any[] = [];
    let currentPrompt = prompt;

    this.addHistory('orchestration', `Starting ${strategy} orchestration`, 'info');

    for (let round = 0; round < maxRounds; round++) {
      this.state.currentTurn = round;

      if (strategy === 'sequential') {
        for (const agent of agents) {
          const result = await this.runAgent(agent, currentPrompt);
          results.push(result);
          currentPrompt = result.output || currentPrompt;
        }
      } else if (strategy === 'parallel') {
        const roundResults = await Promise.all(
          agents.map(agent => this.runAgent(agent, currentPrompt))
        );
        results.push(...roundResults);
        // 合并结果
        currentPrompt = roundResults.map(r => r.output).join('\n');
      } else if (strategy === 'hierarchical') {
        // 简化的层级策略
        const coordinator = this.orchestration.coordinator || agents[0];
        const workers = agents.filter(a => a.id !== coordinator.id);
        
        // 协调者分配任务
        const distribution = await this.runAgent(coordinator, currentPrompt);
        
        // 工作者并行执行
        const workerResults = await Promise.all(
          workers.map(worker => this.runAgent(worker, distribution.output))
        );
        
        // 协调者汇总结果
        const summary = await this.runAgent(
          coordinator,
          `Summarize: ${workerResults.map(r => r.output).join('\n')}`
        );
        
        results.push(distribution, ...workerResults, summary);
        currentPrompt = summary.output;
      }

      // 检查是否完成
      if (this.isOrchestrationComplete(results)) {
        break;
      }
    }

    this.addHistory('orchestration', `Completed orchestration with ${results.length} results`, 'info');
    return results;
  }

  private async runAgent(agent: AgentConfig, prompt: string): Promise<any> {
    this.addHistory('agent', `Running agent ${agent.name}`, 'info');
    
    // 模拟 Agent 执行
    return {
      agentId: agent.id,
      agentName: agent.name,
      input: prompt,
      output: `[Agent ${agent.name}] Processed: ${prompt.substring(0, 50)}...`,
      toolsUsed: [],
      timestamp: Date.now(),
    };
  }

  private isOrchestrationComplete(results: any[]): boolean {
    // 简化的完成检测
    const lastResult = results[results.length - 1];
    return lastResult?.output?.includes('COMPLETE') || false;
  }

  // ==================== 权限管理 ====================

  setPermissions(permissions: ToolPermissionContext): void {
    this.context.permissions = permissions;
    this.addHistory('permission', 'Updated permission context', 'info');
  }

  denyTool(toolName: string): void {
    this.context.permissions.deniedTools.add(toolName.toLowerCase());
    this.addHistory('permission', `Denied tool ${toolName}`, 'info');
  }

  allowTool(toolName: string): void {
    this.context.permissions.deniedTools.delete(toolName.toLowerCase());
    this.addHistory('permission', `Allowed tool ${toolName}`, 'info');
  }

  requireConfirmation(toolName: string): void {
    this.context.permissions.requireConfirmation?.add(toolName.toLowerCase());
  }

  private isToolDenied(toolName: string): boolean {
    const nameLower = toolName.toLowerCase();
    const perms = this.context.permissions;

    // 检查明确允许列表
    if (perms.allowedTools && !perms.allowedTools.has(nameLower)) {
      return true;
    }

    // 检查拒绝列表
    if (perms.deniedTools.has(nameLower)) {
      return true;
    }

    // 检查前缀
    for (const prefix of perms.deniedPrefixes) {
      if (nameLower.startsWith(prefix)) {
        return true;
      }
    }

    return false;
  }

  private requiresConfirmation(toolName: string): boolean {
    return this.context.permissions.requireConfirmation?.has(toolName.toLowerCase()) || false;
  }

  // ==================== 状态管理 ====================

  getState(): RuntimeState {
    return { ...this.state };
  }

  getMetrics(): RuntimeMetrics {
    return { ...this.metrics };
  }

  getHistory(): ExecutionHistoryEntry[] {
    return [...this.history];
  }

  getContext(): ExecutionContext {
    return { ...this.context };
  }

  private addHistory(category: string, message: string, level: 'info' | 'warn' | 'error' | 'debug' = 'info'): void {
    if (!this.config.enableLogging) return;

    const entry: ExecutionHistoryEntry = {
      timestamp: Date.now(),
      category,
      message,
      level,
    };

    this.history.push(entry);
    this.context.history.push(entry);

    // 限制历史大小
    if (this.history.length > this.config.maxHistorySize) {
      this.history = this.history.slice(-this.config.maxHistorySize);
    }
  }

  private updateMetrics(type: 'command' | 'tool', name: string, duration: number, success: boolean): void {
    if (!this.config.enableMetrics) return;

    this.metrics.totalExecutions++;
    
    if (success) {
      this.metrics.successfulExecutions++;
    } else {
      this.metrics.failedExecutions++;
    }

    // 更新平均延迟
    const totalLatency = this.metrics.averageLatency * (this.metrics.totalExecutions - 1) + duration;
    this.metrics.averageLatency = totalLatency / this.metrics.totalExecutions;

    // 更新使用统计
    if (type === 'tool') {
      this.metrics.toolUsage[name] = (this.metrics.toolUsage[name] || 0) + 1;
    } else {
      this.metrics.commandUsage[name] = (this.metrics.commandUsage[name] || 0) + 1;
    }
  }

  resetMetrics(): void {
    this.metrics = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageLatency: 0,
      tokenUsage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      toolUsage: {},
      commandUsage: {},
    };
    this.addHistory('metrics', 'Metrics reset', 'info');
  }

  clearHistory(): void {
    this.history = [];
    this.context.history = [];
    this.addHistory('history', 'History cleared', 'info');
  }

  // ==================== 统计和报告 ====================

  generateReport(): string {
    const lines = [
      '╔══════════════════════════════════════════════════════════╗',
      '║  Claw Code Runtime Report                                ║',
      '╠══════════════════════════════════════════════════════════╣',
      `║  Total Executions: ${this.metrics.totalExecutions.toString().padEnd(38)}║`,
      `║  Successful: ${this.metrics.successfulExecutions.toString().padEnd(44)}║`,
      `║  Failed: ${this.metrics.failedExecutions.toString().padEnd(48)}║`,
      `║  Average Latency: ${Math.round(this.metrics.averageLatency).toString().padEnd(39)}ms ║`,
      '╠══════════════════════════════════════════════════════════╣',
      '║  Top Tools:                                              ║',
    ];

    const topTools = Object.entries(this.metrics.toolUsage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (topTools.length === 0) {
      lines.push('║    No tool usage recorded                                ║');
    } else {
      topTools.forEach(([name, count]) => {
        lines.push(`║    ${name.padEnd(20)} ${count.toString().padEnd(4)} times                    ║`);
      });
    }

    lines.push('╠══════════════════════════════════════════════════════════╣');
    lines.push('║  Top Commands:                                           ║');

    const topCommands = Object.entries(this.metrics.commandUsage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (topCommands.length === 0) {
      lines.push('║    No command usage recorded                             ║');
    } else {
      topCommands.forEach(([name, count]) => {
        lines.push(`║    ${name.padEnd(20)} ${count.toString().padEnd(4)} times                    ║`);
      });
    }

    lines.push('╚══════════════════════════════════════════════════════════╝');

    return lines.join('\n');
  }
}

// ==================== 单例模式 ====================

let runtimeInstance: PortRuntime | null = null;

export function getRuntime(config?: Partial<RuntimeConfig>): PortRuntime {
  if (!runtimeInstance) {
    runtimeInstance = new PortRuntime(config);
  }
  return runtimeInstance;
}

export function resetRuntime(): void {
  runtimeInstance = null;
}

export function createRuntime(config?: Partial<RuntimeConfig>): PortRuntime {
  return new PortRuntime(config);
}
