/**
 * Claw Code Advanced Features
 * 高级功能模块
 * 
 * 包含：
 * - 批处理系统 (Batch Processing)
 * - 工作流引擎 (Workflow Engine)
 * - 插件系统 (Plugin System)
 * - 性能分析 (Performance Profiler)
 * - 缓存管理 (Cache Manager)
 * - 事件总线 (Event Bus)
 */

import { PortingModule, ToolExecution, ExecutionHistoryEntry } from './types';
import { getCommands, getCommand } from './commands';
import { getTools, getTool, executeToolAsync } from './tools';

// ==================== 批处理系统 ====================

export interface BatchJob {
  id: string;
  type: 'command' | 'tool';
  name: string;
  input: string;
  priority: number;
  timeout?: number;
}

export interface BatchResult {
  jobId: string;
  success: boolean;
  output?: string;
  error?: string;
  duration: number;
  timestamp: number;
}

export interface BatchConfig {
  concurrency: number;
  retryCount: number;
  retryDelay: number;
  stopOnError: boolean;
  timeout: number;
}

const DEFAULT_BATCH_CONFIG: BatchConfig = {
  concurrency: 3,
  retryCount: 2,
  retryDelay: 1000,
  stopOnError: false,
  timeout: 30000,
};

export class BatchProcessor {
  private config: BatchConfig;
  private running: boolean = false;
  private abortController: AbortController | null = null;

  constructor(config: Partial<BatchConfig> = {}) {
    this.config = { ...DEFAULT_BATCH_CONFIG, ...config };
  }

  async process(jobs: BatchJob[], onProgress?: (completed: number, total: number) => void): Promise<BatchResult[]> {
    this.running = true;
    this.abortController = new AbortController();
    const results: BatchResult[] = [];
    const total = jobs.length;
    let completed = 0;

    // 按优先级排序
    const sortedJobs = [...jobs].sort((a, b) => b.priority - a.priority);

    // 分批处理
    for (let i = 0; i < sortedJobs.length; i += this.config.concurrency) {
      if (this.abortController.signal.aborted) {
        break;
      }

      const batch = sortedJobs.slice(i, i + this.config.concurrency);
      const batchResults = await Promise.all(
        batch.map(job => this.executeJob(job))
      );

      results.push(...batchResults);
      completed += batch.length;
      onProgress?.(completed, total);

      // 如果出错且需要停止
      if (this.config.stopOnError && batchResults.some(r => !r.success)) {
        break;
      }
    }

    this.running = false;
    return results;
  }

  private async executeJob(job: BatchJob, attempt: number = 0): Promise<BatchResult> {
    const startTime = Date.now();

    try {
      let result: ToolExecution;

      if (job.type === 'command') {
        const cmd = getCommand(job.name);
        if (!cmd) {
          throw new Error(`Command not found: ${job.name}`);
        }
        result = {
          name: cmd.name,
          sourceHint: cmd.sourceHint,
          payload: job.input,
          handled: true,
          message: `Command executed: ${cmd.name}`,
        };
      } else {
        result = await executeToolAsync(job.name, job.input);
      }

      return {
        jobId: job.id,
        success: result.handled,
        output: result.message,
        duration: Date.now() - startTime,
        timestamp: Date.now(),
      };
    } catch (error) {
      // 重试逻辑
      if (attempt < this.config.retryCount) {
        await this.delay(this.config.retryDelay * (attempt + 1));
        return this.executeJob(job, attempt + 1);
      }

      return {
        jobId: job.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        timestamp: Date.now(),
      };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop(): void {
    this.abortController?.abort();
    this.running = false;
  }

  isRunning(): boolean {
    return this.running;
  }
}

// ==================== 工作流引擎 ====================

export interface WorkflowStep {
  id: string;
  type: 'command' | 'tool' | 'condition' | 'parallel' | 'loop';
  name?: string;
  input?: string | ((context: WorkflowContext) => string);
  condition?: (context: WorkflowContext) => boolean;
  steps?: WorkflowStep[];
  onError?: 'continue' | 'stop' | 'retry';
  retryCount?: number;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  variables?: Record<string, any>;
}

export interface WorkflowContext {
  workflowId: string;
  variables: Record<string, any>;
  results: Map<string, any>;
  currentStep: string | null;
  startTime: number;
  logs: string[];
}

export interface WorkflowResult {
  workflowId: string;
  success: boolean;
  results: Map<string, any>;
  duration: number;
  logs: string[];
  error?: string;
}

export class WorkflowEngine {
  private workflows: Map<string, Workflow> = new Map();
  private contexts: Map<string, WorkflowContext> = new Map();

  register(workflow: Workflow): void {
    this.workflows.set(workflow.id, workflow);
  }

  unregister(workflowId: string): boolean {
    return this.workflows.delete(workflowId);
  }

  async execute(workflowId: string, initialVariables: Record<string, any> = {}): Promise<WorkflowResult> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const context: WorkflowContext = {
      workflowId,
      variables: { ...workflow.variables, ...initialVariables },
      results: new Map(),
      currentStep: null,
      startTime: Date.now(),
      logs: [],
    };

    this.contexts.set(workflowId, context);

    try {
      for (const step of workflow.steps) {
        await this.executeStep(step, context);
      }

      return {
        workflowId,
        success: true,
        results: context.results,
        duration: Date.now() - context.startTime,
        logs: context.logs,
      };
    } catch (error) {
      return {
        workflowId,
        success: false,
        results: context.results,
        duration: Date.now() - context.startTime,
        logs: context.logs,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      this.contexts.delete(workflowId);
    }
  }

  private async executeStep(step: WorkflowStep, context: WorkflowContext): Promise<void> {
    context.currentStep = step.id;
    context.logs.push(`[${new Date().toISOString()}] Executing step: ${step.id}`);

    switch (step.type) {
      case 'command':
        await this.executeCommandStep(step, context);
        break;
      case 'tool':
        await this.executeToolStep(step, context);
        break;
      case 'condition':
        await this.executeConditionStep(step, context);
        break;
      case 'parallel':
        await this.executeParallelStep(step, context);
        break;
      case 'loop':
        await this.executeLoopStep(step, context);
        break;
    }
  }

  private async executeCommandStep(step: WorkflowStep, context: WorkflowContext): Promise<void> {
    if (!step.name) return;
    const input = typeof step.input === 'function' ? step.input(context) : step.input || '';
    context.results.set(step.id, { type: 'command', name: step.name, input });
  }

  private async executeToolStep(step: WorkflowStep, context: WorkflowContext): Promise<void> {
    if (!step.name) return;
    const input = typeof step.input === 'function' ? step.input(context) : step.input || '';
    const result = await executeToolAsync(step.name, input);
    context.results.set(step.id, result);
  }

  private async executeConditionStep(step: WorkflowStep, context: WorkflowContext): Promise<void> {
    if (step.condition?.(context)) {
      if (step.steps) {
        for (const subStep of step.steps) {
          await this.executeStep(subStep, context);
        }
      }
    }
  }

  private async executeParallelStep(step: WorkflowStep, context: WorkflowContext): Promise<void> {
    if (step.steps) {
      await Promise.all(step.steps.map(s => this.executeStep(s, context)));
    }
  }

  private async executeLoopStep(step: WorkflowStep, context: WorkflowContext): Promise<void> {
    // 简化实现，实际应该基于条件循环
    if (step.steps) {
      for (let i = 0; i < 10; i++) { // 最大10次
        context.variables.loopIndex = i;
        for (const subStep of step.steps) {
          await this.executeStep(subStep, context);
        }
      }
    }
  }

  getWorkflow(id: string): Workflow | undefined {
    return this.workflows.get(id);
  }

  listWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  getContext(workflowId: string): WorkflowContext | undefined {
    return this.contexts.get(workflowId);
  }
}

// ==================== 插件系统 ====================

export interface ClawCodePlugin {
  name: string;
  version: string;
  description?: string;
  author?: string;
  initialize: () => void | Promise<void>;
  destroy?: () => void | Promise<void>;
  onCommand?: (command: string, input: string) => void | Promise<void>;
  onTool?: (tool: string, payload: string) => void | Promise<void>;
  hooks?: {
    beforeExecute?: (type: 'command' | 'tool', name: string, input: string) => string | Promise<string>;
    afterExecute?: (type: 'command' | 'tool', name: string, result: any) => void | Promise<void>;
  };
}

export class PluginManager {
  private plugins: Map<string, ClawCodePlugin> = new Map();
  private hooks: Map<string, Function[]> = new Map();

  async register(plugin: ClawCodePlugin): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin already registered: ${plugin.name}`);
    }

    await plugin.initialize();
    this.plugins.set(plugin.name, plugin);

    // 注册钩子
    if (plugin.hooks) {
      Object.entries(plugin.hooks).forEach(([hookName, handler]) => {
        this.addHook(hookName, handler);
      });
    }
  }

  async unregister(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) return;

    await plugin.destroy?.();
    this.plugins.delete(pluginName);
  }

  private addHook(name: string, handler: Function): void {
    if (!this.hooks.has(name)) {
      this.hooks.set(name, []);
    }
    this.hooks.get(name)!.push(handler);
  }

  async executeHooks(name: string, ...args: any[]): Promise<any> {
    const handlers = this.hooks.get(name) || [];
    let result = args[0];

    for (const handler of handlers) {
      result = await handler(...args);
    }

    return result;
  }

  listPlugins(): ClawCodePlugin[] {
    return Array.from(this.plugins.values());
  }

  getPlugin(name: string): ClawCodePlugin | undefined {
    return this.plugins.get(name);
  }
}

// ==================== 性能分析器 ====================

export interface PerformanceMetrics {
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
  memoryBefore?: number;
  memoryAfter?: number;
  metadata?: Record<string, any>;
}

export class PerformanceProfiler {
  private metrics: PerformanceMetrics[] = [];
  private activeOperations: Map<string, number> = new Map();
  private enabled: boolean = true;

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  start(operation: string, metadata?: Record<string, any>): string {
    if (!this.enabled) return '';

    const id = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.activeOperations.set(id, Date.now());

    // 记录内存使用
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      metadata = { ...metadata, memoryStart: (performance as any).memory?.usedJSHeapSize };
    }

    return id;
  }

  end(id: string, metadata?: Record<string, any>): PerformanceMetrics | null {
    if (!this.enabled || !this.activeOperations.has(id)) return null;

    const startTime = this.activeOperations.get(id)!;
    const endTime = Date.now();
    const operation = id.split('_')[0];

    let memoryBefore: number | undefined;
    let memoryAfter: number | undefined;

    if (typeof performance !== 'undefined' && 'memory' in performance) {
      memoryAfter = (performance as any).memory?.usedJSHeapSize;
      memoryBefore = metadata?.memoryStart;
    }

    const metrics: PerformanceMetrics = {
      operation,
      startTime,
      endTime,
      duration: endTime - startTime,
      memoryBefore,
      memoryAfter,
      metadata,
    };

    this.metrics.push(metrics);
    this.activeOperations.delete(id);

    return metrics;
  }

  profile<T>(operation: string, fn: () => T | Promise<T>, metadata?: Record<string, any>): Promise<T> {
    const id = this.start(operation, metadata);
    
    const execute = async () => {
      try {
        const result = await fn();
        this.end(id, { ...metadata, success: true });
        return result;
      } catch (error) {
        this.end(id, { ...metadata, success: false, error: String(error) });
        throw error;
      }
    };

    return execute();
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getAverageDuration(operation: string): number {
    const operationMetrics = this.metrics.filter(m => m.operation === operation);
    if (operationMetrics.length === 0) return 0;
    return operationMetrics.reduce((sum, m) => sum + m.duration, 0) / operationMetrics.length;
  }

  getSlowestOperations(limit: number = 10): PerformanceMetrics[] {
    return [...this.metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  clear(): void {
    this.metrics = [];
    this.activeOperations.clear();
  }

  generateReport(): string {
    const operations = new Set(this.metrics.map(m => m.operation));
    const lines = [
      '╔══════════════════════════════════════════════════════════╗',
      '║  Performance Report                                      ║',
      '╠══════════════════════════════════════════════════════════╣',
      `║  Total Operations: ${this.metrics.length.toString().padEnd(39)}║`,
      `║  Unique Operations: ${operations.size.toString().padEnd(38)}║`,
      '╚══════════════════════════════════════════════════════════╝',
      '',
      'Operation Statistics:',
      '─'.repeat(50),
    ];

    operations.forEach(op => {
      const opMetrics = this.metrics.filter(m => m.operation === op);
      const avg = opMetrics.reduce((sum, m) => sum + m.duration, 0) / opMetrics.length;
      const max = Math.max(...opMetrics.map(m => m.duration));
      const min = Math.min(...opMetrics.map(m => m.duration));

      lines.push(`\n${op}:`);
      lines.push(`  Count: ${opMetrics.length}`);
      lines.push(`  Avg: ${avg.toFixed(2)}ms`);
      lines.push(`  Min: ${min}ms`);
      lines.push(`  Max: ${max}ms`);
    });

    return lines.join('\n');
  }
}

// ==================== 缓存管理器 ====================

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  tags: string[];
}

export class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5分钟

  constructor(defaultTTL?: number) {
    if (defaultTTL) this.defaultTTL = defaultTTL;
  }

  set<T>(key: string, value: T, ttl?: number, tags: string[] = []): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expiresAt, tags });
  }

  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  clearByTag(tag: string): void {
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
      }
    }
  }

  clearExpired(): number {
    let count = 0;
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  getStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0, // 需要实现命中率统计
    };
  }
}

// ==================== 事件总线 ====================

type EventHandler = (data: any) => void | Promise<void>;

export class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();

  on(event: string, handler: EventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    // 返回取消订阅函数
    return () => {
      this.handlers.get(event)?.delete(handler);
    };
  }

  off(event: string, handler: EventHandler): void {
    this.handlers.get(event)?.delete(handler);
  }

  async emit(event: string, data: any): Promise<void> {
    const handlers = this.handlers.get(event);
    if (!handlers) return;

    await Promise.all(
      Array.from(handlers).map(handler => handler(data))
    );
  }

  once(event: string, handler: EventHandler): void {
    const onceHandler = (data: any) => {
      this.off(event, onceHandler);
      handler(data);
    };
    this.on(event, onceHandler);
  }
}

// ==================== 单例实例 ====================

let batchProcessor: BatchProcessor | null = null;
let workflowEngine: WorkflowEngine | null = null;
let pluginManager: PluginManager | null = null;
let performanceProfiler: PerformanceProfiler | null = null;
let cacheManager: CacheManager | null = null;
let eventBus: EventBus | null = null;

export function getBatchProcessor(): BatchProcessor {
  if (!batchProcessor) {
    batchProcessor = new BatchProcessor();
  }
  return batchProcessor;
}

export function getWorkflowEngine(): WorkflowEngine {
  if (!workflowEngine) {
    workflowEngine = new WorkflowEngine();
  }
  return workflowEngine;
}

export function getPluginManager(): PluginManager {
  if (!pluginManager) {
    pluginManager = new PluginManager();
  }
  return pluginManager;
}

export function getPerformanceProfiler(): PerformanceProfiler {
  if (!performanceProfiler) {
    performanceProfiler = new PerformanceProfiler();
  }
  return performanceProfiler;
}

export function getCacheManager(): CacheManager {
  if (!cacheManager) {
    cacheManager = new CacheManager();
  }
  return cacheManager;
}

export function getEventBus(): EventBus {
  if (!eventBus) {
    eventBus = new EventBus();
  }
  return eventBus;
}

// ==================== 便捷函数 ====================

export async function batchExecute(
  jobs: BatchJob[],
  config?: Partial<BatchConfig>,
  onProgress?: (completed: number, total: number) => void
): Promise<BatchResult[]> {
  const processor = new BatchProcessor(config);
  return processor.process(jobs, onProgress);
}

export function createWorkflow(steps: WorkflowStep[], name?: string): Workflow {
  return {
    id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: name || 'Unnamed Workflow',
    steps,
  };
}

export async function profile<T>(
  operation: string,
  fn: () => T | Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  return getPerformanceProfiler().profile(operation, fn, metadata);
}

export function cache<T>(key: string, value: T, ttl?: number, tags?: string[]): void {
  getCacheManager().set(key, value, ttl, tags);
}

export function getCached<T>(key: string): T | undefined {
  return getCacheManager().get<T>(key);
}
