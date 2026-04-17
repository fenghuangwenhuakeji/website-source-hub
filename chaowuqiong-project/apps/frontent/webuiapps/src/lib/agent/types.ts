/**
 * Agent 对话系统类型定义
 */

// Agent 定义
export interface Agent {
  id: string;
  name: string;
  description: string;
  type: 'skill' | 'debug' | 'plan' | 'spec' | 'custom' | 'autopilot';
  icon?: string;
  color?: string;
  // 核心文档内容
  skillDoc?: string;
  requirementDoc?: string;
  designDoc?: string;
  tasksDoc?: string;
  checklistDoc?: string;
  // 运行时配置
  config: AgentConfig;
  // 状态
  status: 'active' | 'inactive' | 'error';
  createdAt: Date;
  updatedAt: Date;
  // 统计
  stats: AgentStats;
}

// Agent 配置
export interface AgentConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  // 工具权限
  tools: string[];
  // 工作流配置
  workflow?: WorkflowConfig;
  // 记忆配置
  memory?: MemoryConfig;
}

// 工作流配置
export interface WorkflowConfig {
  steps: WorkflowStep[];
  autoExecute: boolean;
  parallel: boolean;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'agent' | 'tool' | 'condition' | 'loop';
  config: any;
  next?: string[];
}

// 记忆配置
export interface MemoryConfig {
  enabled: boolean;
  shortTermCapacity: number;
  longTermEnabled: boolean;
  instinctEnabled: boolean;
}

// Agent 统计
export interface AgentStats {
  totalConversations: number;
  totalMessages: number;
  avgResponseTime: number;
  successRate: number;
  lastUsedAt?: Date;
}

// 对话会话
export interface Conversation {
  id: string;
  agentId: string;
  title: string;
  messages: Message[];
  status: 'active' | 'paused' | 'completed';
  context: ConversationContext;
  createdAt: Date;
  updatedAt: Date;
}

// 对话上下文
export interface ConversationContext {
  variables: Record<string, any>;
  workflowState?: WorkflowState;
  memorySnapshot?: MemorySnapshot;
}

// 工作流状态
export interface WorkflowState {
  currentStep: string;
  completedSteps: string[];
  variables: Record<string, any>;
}

// 记忆快照
export interface MemorySnapshot {
  shortTerm: ShortTermMemory[];
  longTerm: LongTermMemory[];
  instinct: InstinctMemory[];
}

// 工具执行结果
export interface ToolResult {
  callId?: string;
  toolName?: string;
  success: boolean;
  output?: string;
  error?: string;
  data?: any;
  timestamp?: number;
}

// 消息
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  metadata?: MessageMetadata;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  isStreaming?: boolean;
}

export interface MessageMetadata {
  agentId?: string;
  toolCalls?: ToolCall[];
  workflowStep?: string;
  thinking?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: any;
  result?: any;
}

// 短期记忆
export interface ShortTermMemory {
  id: string;
  content: string;
  type: 'fact' | 'preference' | 'context';
  timestamp: Date;
  relevance: number;
}

// 长期记忆
export interface LongTermMemory {
  id: string;
  content: string;
  category: string;
  importance: number;
  createdAt: Date;
  lastAccessed: Date;
  accessCount: number;
}

// 本能记忆
export interface InstinctMemory {
  id: string;
  pattern: string;
  response: string;
  triggerCount: number;
  successRate: number;
}

// Skill 定义
export interface Skill {
  id: string;
  name: string;
  description: string;
  code: string;
  language: string;
  parameters: SkillParameter[];
  agentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SkillParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  default?: any;
  description?: string;
}

// Agent 导入结果
export interface AgentImportResult {
  success: boolean;
  agent?: Agent;
  errors: string[];
  warnings: string[];
}

// Agent 执行结果
export interface AgentExecutionResult {
  success: boolean;
  output: string;
  messages: Message[];
  toolCalls?: ToolCall[];
  workflowState?: WorkflowState;
  errors?: string[];
}
