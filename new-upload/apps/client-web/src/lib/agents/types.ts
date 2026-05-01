/**
 * OpenRoom Agent System - Core Types
 * Inspired by Agency Agents + Everything Claude + OpenCode
 */

import type { ExperienceProfileId } from '@/types/desktopApp';
import { generateId } from '../generateId';

export { generateId };

export type AgentId = string;
export type SessionId = string;

export interface AgentDefinition {
  id: AgentId;
  name: string;
  description: string;
  color: AgentColor;
  emoji: string;
  tools: string[];
  model?: AgentModel;
  mode: AgentMode;
  prompt: string;
  skills?: string[];
  experienceProfileId?: ExperienceProfileId;
  experienceSummary?: string;
  activationKeywords?: string[];
  memoryProfile?: string[];
  lifecyclePhases?: string[];
}

export type AgentColor = 'blue' | 'green' | 'yellow' | 'red' | 'cyan' | 'magenta' | 'white';
export type AgentModel = 'opus' | 'sonnet' | 'haiku' | 'gpt' | 'deepseek';
export type AgentMode = 'solo' | 'orchestrator' | 'specialized';

export interface AgentSession {
  id: SessionId;
  agentId: AgentId;
  parentSessionId?: SessionId;
  status: SessionStatus;
  messages: AgentMessage[];
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, unknown>;
}

export type SessionStatus = 'pending' | 'running' | 'waiting' | 'completed' | 'failed' | 'aborted';

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  timestamp: number;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  success: boolean;
  result?: string;
  error?: string;
}

export interface AgentTool {
  name: string;
  description: string;
  parameters: ToolParameters;
  execute: (args: Record<string, unknown>, context: AgentContext) => Promise<ToolResult>;
}

export interface ToolParameters {
  type: 'object';
  properties: Record<string, ToolParameterSchema>;
  required?: string[];
}

export interface ToolParameterSchema {
  type: string;
  description?: string;
  default?: unknown;
}

export interface AgentContext {
  sessionId: SessionId;
  agentId: AgentId;
  messages: AgentMessage[];
  config: AgentConfig;
  tools: Map<string, AgentTool>;
}

export interface AgentConfig {
  model: string;
  provider: LLMProvider;
  temperature?: number;
  maxTokens?: number;
  thinking?: 'high' | 'medium' | 'none';
}

export type LLMProvider = 'openai' | 'anthropic' | 'deepseek' | 'minimax' | 'opencode';

export interface AgentExecutionResult {
  success: boolean;
  message?: AgentMessage;
  error?: string;
  metrics?: ExecutionMetrics;
}

export interface ExecutionMetrics {
  duration: number;
  tokensUsed?: {
    input: number;
    output: number;
  };
  toolCalls: number;
  iterations: number;
}

export interface NexusPhase {
  id: string;
  name: string;
  description: string;
  agents: AgentId[];
  gate?: PhaseGate;
  nextPhase?: string;
}

export interface PhaseGate {
  type: 'quality' | 'approval' | 'automatic';
  criteria: string[];
  checker?: AgentId;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  phases: NexusPhase[];
  initialPhase: string;
}

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  emoji: string;
  triggers: string[];
  prompt: string;
  tools?: string[];
  enabled?: boolean;
}

export interface Instinct {
  id: string;
  pattern: string;
  action: string;
  confidence: number;
  domain: string;
  source?: string;
  createdAt: number;
}

export interface MemoryEntry {
  id: string;
  type: 'long-term' | 'daily' | 'session';
  content: string;
  timestamp: number;
  tags?: string[];
}

export interface HookDefinition {
  id: string;
  name: string;
  event: HookEvent;
  conditions: HookCondition[];
  action: HookAction;
  enabled: boolean;
}

export type HookEvent =
  | 'pre-tool'
  | 'post-tool'
  | 'session-start'
  | 'session-end'
  | 'stop'
  | 'user-prompt';

export interface HookCondition {
  field: string;
  operator: 'regex_match' | 'contains' | 'equals' | 'starts_with';
  value: string;
}

export type HookAction = 'warn' | 'block' | 'modify' | 'allow';

export interface PermissionRule {
  permission: string;
  pattern?: string;
  action: 'allow' | 'deny' | 'ask';
}

export interface ToolPolicy {
  name: string;
  rules: PermissionRule[];
}
