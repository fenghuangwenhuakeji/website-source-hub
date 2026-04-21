/**
 * Claw Code Core Types
 * 核心类型定义 - 基于 Claw Code 架构重写
 */

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
}

export interface PermissionDenial {
  toolName: string;
  reason: string;
}

export interface UsageSummary {
  inputTokens: number;
  outputTokens: number;
}

export interface PortingBacklog {
  title: string;
  modules: PortingModule[];
}

export interface ToolExecution {
  name: string;
  sourceHint: string;
  payload: string;
  handled: boolean;
  message: string;
}

export interface CommandExecution {
  name: string;
  sourceHint: string;
  prompt: string;
  handled: boolean;
  message: string;
}

export interface RoutedMatch {
  kind: 'command' | 'tool';
  name: string;
  sourceHint: string;
  score: number;
}

export interface QueryEngineConfig {
  maxTurns: number;
  maxBudgetTokens: number;
  compactAfterTurns: number;
  structuredOutput: boolean;
  structuredRetryLimit: number;
}

export interface TurnResult {
  prompt: string;
  output: string;
  matchedCommands: string[];
  matchedTools: string[];
  permissionDenials: PermissionDenial[];
  usage: UsageSummary;
  stopReason: 'completed' | 'max_turns_reached' | 'max_budget_reached' | 'error';
}

export interface StreamEvent {
  type: 'message_start' | 'command_match' | 'tool_match' | 'permission_denial' | 'message_delta' | 'message_stop';
  data?: any;
  sessionId?: string;
  prompt?: string;
  commands?: string[];
  tools?: string[];
  denials?: string[];
  text?: string;
  usage?: { inputTokens: number; outputTokens: number };
  stopReason?: string;
  transcriptSize?: number;
}

export interface StoredSession {
  sessionId: string;
  messages: string[];
  inputTokens: number;
  outputTokens: number;
  createdAt: number;
  updatedAt: number;
}

export interface PortContext {
  pythonFileCount: number;
  archiveAvailable: boolean;
  workspacePath: string;
  timestamp: number;
}

export interface RuntimeSession {
  prompt: string;
  context: PortContext;
  systemInitMessage: string;
  routedMatches: RoutedMatch[];
  turnResult: TurnResult;
  commandExecutionMessages: string[];
  toolExecutionMessages: string[];
  streamEvents: StreamEvent[];
  persistedSessionPath: string;
}

export interface ToolPermissionContext {
  deniedTools: Set<string>;
  deniedPrefixes: Set<string>;
}

export interface HistoryEntry {
  timestamp: number;
  category: string;
  message: string;
}

export interface TranscriptEntry {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export const DEFAULT_CONFIG: QueryEngineConfig = {
  maxTurns: 8,
  maxBudgetTokens: 2000,
  compactAfterTurns: 12,
  structuredOutput: false,
  structuredRetryLimit: 2,
};

export const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
