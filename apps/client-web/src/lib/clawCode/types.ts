/**
 * Claw Code Core Types - Enhanced
 * 核心类型定义 - 增强版
 */

// ==================== 基础类型 ====================

export interface Subsystem {
  name: string;
  path: string;
  fileCount: number;
  notes: string;
}

export interface PortingModule {
  name: string;
  responsibility: string;
  sourceHint: string;
  status: 'planned' | 'mirrored' | 'implemented';
  metadata?: Record<string, any>;
  tags?: string[];
  version?: string;
  author?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface PermissionDenial {
  toolName: string;
  reason: string;
  timestamp?: number;
  userId?: string;
}

export interface UsageSummary {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost?: number;
  model?: string;
  duration?: number;
}

export interface PortingBacklog {
  title: string;
  modules: PortingModule[];
  metadata?: {
    totalCount: number;
    mirroredCount: number;
    implementedCount: number;
    plannedCount: number;
    lastUpdated: number;
  };
}

// ==================== 执行类型 ====================

export interface ToolExecution {
  name: string;
  sourceHint: string;
  payload: string;
  handled: boolean;
  message: string;
  result?: any;
  error?: string;
  duration?: number;
  timestamp?: number;
}

export interface CommandExecution {
  name: string;
  sourceHint: string;
  prompt: string;
  handled: boolean;
  message: string;
  result?: any;
  error?: string;
  duration?: number;
  timestamp?: number;
}

export interface RoutedMatch {
  kind: 'command' | 'tool';
  name: string;
  sourceHint: string;
  score: number;
  confidence?: 'high' | 'medium' | 'low';
  metadata?: Record<string, any>;
}

// ==================== 查询引擎类型 ====================

export interface QueryEngineConfig {
  maxTurns: number;
  maxBudgetTokens: number;
  compactAfterTurns: number;
  structuredOutput: boolean;
  structuredRetryLimit: number;
  enableStreaming?: boolean;
  enableCaching?: boolean;
  temperature?: number;
  topP?: number;
  model?: string;
  systemPrompt?: string;
}

/**
 * 默认配置
 */
export const DEFAULT_CONFIG: QueryEngineConfig = {
  maxTurns: 8,
  maxBudgetTokens: 2000,
  compactAfterTurns: 6,
  structuredOutput: false,
  structuredRetryLimit: 2,
  enableStreaming: true,
  enableCaching: true,
  temperature: 0.7,
  topP: 0.9,
  model: 'gpt-4',
  systemPrompt: 'You are a helpful AI assistant.',
};

export interface TurnResult {
  prompt: string;
  output: string;
  matchedCommands: string[];
  matchedTools: string[];
  permissionDenials: PermissionDenial[];
  usage: UsageSummary;
  stopReason: 'completed' | 'max_turns_reached' | 'max_budget_reached' | 'error' | 'user_cancelled';
  timestamp?: number;
  duration?: number;
}

export interface StreamEvent {
  type: 'message_start' | 'command_match' | 'tool_match' | 'permission_denial' | 'message_delta' | 'message_stop' | 'error' | 'thinking';
  data?: any;
  sessionId?: string;
  prompt?: string;
  commands?: string[];
  tools?: string[];
  denials?: string[];
  text?: string;
  usage?: UsageSummary;
  stopReason?: string;
  transcriptSize?: number;
  timestamp?: number;
}

// ==================== 会话类型 ====================

export interface StoredSession {
  sessionId: string;
  messages: SessionMessage[];
  inputTokens: number;
  outputTokens: number;
  createdAt: number;
  updatedAt: number;
  metadata?: SessionMetadata;
}

export interface SessionMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: number;
  metadata?: {
    commands?: string[];
    tools?: string[];
    denials?: PermissionDenial[];
    usage?: UsageSummary;
    attachments?: Attachment[];
  };
}

export interface SessionMetadata {
  title?: string;
  description?: string;
  tags?: string[];
  project?: string;
  branch?: string;
  isArchived?: boolean;
  isFavorite?: boolean;
  color?: string;
}

export interface Attachment {
  id: string;
  type: 'file' | 'image' | 'code' | 'link';
  name: string;
  content?: string;
  path?: string;
  url?: string;
  size?: number;
  mimeType?: string;
}

// ==================== 上下文类型 ====================

export interface PortContext {
  pythonFileCount: number;
  typescriptFileCount?: number;
  totalLines?: number;
  lastSyncTime?: number;
  syncStatus?: 'synced' | 'syncing' | 'error' | 'never';
}

export interface ToolPermissionContext {
  deniedTools: Set<string>;
  deniedPrefixes: Set<string>;
  allowedTools?: Set<string>;
  requireConfirmation?: Set<string>;
  autoApprove?: boolean;
}

export interface ExecutionContext {
  sessionId: string;
  workingDirectory: string;
  environment: Record<string, string>;
  permissions: ToolPermissionContext;
  history: ExecutionHistoryEntry[];
}

export interface ExecutionHistoryEntry {
  timestamp: number;
  category: string;
  message: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  metadata?: Record<string, any>;
}

// ==================== Agent 类型 ====================

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  tools: string[];
  commands: string[];
  permissions: ToolPermissionContext;
  memory?: AgentMemory;
}

export interface AgentMemory {
  shortTerm: string[];
  longTerm: string[];
  workingContext: Record<string, any>;
  lastUpdated: number;
}

export interface AgentOrchestration {
  agents: AgentConfig[];
  coordinator?: AgentConfig;
  strategy: 'sequential' | 'parallel' | 'hierarchical' | 'adaptive';
  maxRounds: number;
  consensusThreshold?: number;
}

// ==================== 运行时类型 ====================

export interface RuntimeState {
  isRunning: boolean;
  currentTurn: number;
  totalTokens: number;
  budgetRemaining: number;
  sessionId: string | null;
  lastError?: string;
  startTime?: number;
}

export interface RuntimeMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageLatency: number;
  tokenUsage: UsageSummary;
  toolUsage: Record<string, number>;
  commandUsage: Record<string, number>;
}

// ==================== 工作流类型 ====================

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  variables: Record<string, any>;
  triggers?: WorkflowTrigger[];
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'command' | 'tool' | 'agent' | 'condition' | 'loop' | 'parallel';
  config: Record<string, any>;
  dependencies?: string[];
  onError?: 'stop' | 'continue' | 'retry';
  maxRetries?: number;
}

export interface WorkflowTrigger {
  type: 'schedule' | 'event' | 'webhook' | 'manual';
  config: Record<string, any>;
}

// ==================== 导出/导入类型 ====================

export interface ExportData {
  version: string;
  exportedAt: number;
  sessions: StoredSession[];
  settings: Record<string, any>;
  customCommands?: PortingModule[];
  customTools?: PortingModule[];
  workflows?: Workflow[];
}

export interface ImportResult {
  success: boolean;
  importedSessions: number;
  importedSettings: number;
  errors: string[];
  warnings: string[];
}

// ==================== 设置类型 ====================

export interface ClawCodeSettings {
  general: {
    autoSave: boolean;
    autoCompact: boolean;
    showTokenCount: boolean;
    theme: 'light' | 'dark' | 'system';
    language: string;
  };
  ai: {
    defaultModel: string;
    temperature: number;
    maxTokens: number;
    streaming: boolean;
    caching: boolean;
  };
  tools: {
    autoApprove: string[];
    requireConfirmation: string[];
    denied: string[];
    timeout: number;
  };
  shortcuts: Record<string, string>;
}

// ==================== 工具函数 ====================

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
