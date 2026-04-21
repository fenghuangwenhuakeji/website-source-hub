/**
 * Agent System - Core Engine
 * Inspired by Auto-Claude + Agency Agents + OpenCode
 */

import {
  type AgentDefinition,
  type AgentSession,
  type AgentMessage,
  type AgentContext,
  type AgentConfig,
  type AgentExecutionResult,
  type ExecutionMetrics,
  type SessionStatus,
  generateId,
} from './types';
import { chat, type ChatMessage, type LLMConfig } from '../llmClient';
import { logger } from '../logger';

export class AgentEngine {
  private sessions: Map<string, AgentSession> = new Map();
  private agents: Map<string, AgentDefinition> = new Map();
  private config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  registerAgent(agent: AgentDefinition): void {
    this.agents.set(agent.id, agent);
    logger.info('AgentEngine', `Registered agent: ${agent.name} (${agent.id})`);
  }

  async createSession(agentId: string, parentSessionId?: string): Promise<AgentSession> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    const session: AgentSession = {
      id: generateId(),
      agentId,
      parentSessionId,
      status: 'pending',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.sessions.set(session.id, session);
    logger.info('AgentEngine', `Created session: ${session.id} for agent: ${agent.name}`);

    return session;
  }

  async executeSession(
    sessionId: string,
    input: string,
    tools: import('./types').AgentTool[],
    llmConfig: LLMConfig,
  ): Promise<AgentExecutionResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, error: `Session not found: ${sessionId}` };
    }

    const agent = this.agents.get(session.agentId);
    if (!agent) {
      return { success: false, error: `Agent not found: ${session.agentId}` };
    }

    const startTime = Date.now();
    session.status = 'running';
    session.updatedAt = startTime;

    const userMessage: AgentMessage = {
      id: generateId(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };
    session.messages.push(userMessage);

    try {
      await this.runAgentLoop(session, agent, tools, llmConfig);

      const metrics: ExecutionMetrics = {
        duration: Date.now() - startTime,
        toolCalls: session.messages.filter((m) => m.role === 'assistant' && m.toolCalls?.length)
          .length,
        iterations: Math.ceil(session.messages.length / 2),
      };

      session.status = 'completed';
      session.updatedAt = Date.now();

      return {
        success: true,
        message: session.messages[session.messages.length - 1],
        metrics,
      };
    } catch (error) {
      session.status = 'failed';
      session.updatedAt = Date.now();

      logger.error('AgentEngine', `Session ${sessionId} failed:`, error);

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async runAgentLoop(
    session: AgentSession,
    agent: AgentDefinition,
    tools: import('./types').AgentTool[],
    llmConfig: LLMConfig,
  ): Promise<void> {
    const maxIterations = 20;
    let iteration = 0;

    while (iteration < maxIterations) {
      iteration++;

      const messages: ChatMessage[] = [
        { role: 'system', content: this.buildSystemPrompt(agent) },
        ...session.messages.map((m) => ({
          role: m.role as 'user' | 'assistant' | 'system' | 'tool',
          content: m.content,
          tool_call_id: m.toolCalls?.[0]?.id,
          tool_calls: m.toolCalls?.map((tc) => ({
            id: tc.id,
            type: 'function' as const,
            function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
          })),
        })),
      ];

      const toolDefs = tools.map((t) => ({
        type: 'function' as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: {
            ...t.parameters,
            required: t.parameters.required || [],
          },
        },
      }));

      const response = await chat(messages, toolDefs, llmConfig);

      const assistantMessage: AgentMessage = {
        id: generateId(),
        role: 'assistant',
        content: response.content,
        toolCalls: response.toolCalls.map((tc) => ({
          id: tc.id,
          name: tc.function.name,
          arguments: JSON.parse(tc.function.arguments),
        })),
        timestamp: Date.now(),
      };

      session.messages.push(assistantMessage);
      session.updatedAt = Date.now();

      if (response.toolCalls.length === 0) {
        break;
      }

      for (const tc of response.toolCalls) {
        const tool = tools.find((t) => t.name === tc.function.name);
        if (tool) {
          const context: AgentContext = {
            sessionId: session.id,
            agentId: session.agentId,
            messages: session.messages,
            config: this.config,
            tools: new Map(tools.map((t) => [t.name, t])),
          };

          const result = await tool.execute(
            JSON.parse(tc.function.arguments) as Record<string, unknown>,
            context,
          );

          const toolResultMessage: AgentMessage = {
            id: generateId(),
            role: 'tool',
            content: result.success ? result.result || '' : result.error || 'Tool execution failed',
            timestamp: Date.now(),
          };
          session.messages.push(toolResultMessage);
        }
      }
    }
  }

  private buildSystemPrompt(agent: AgentDefinition): string {
    const experienceSections: string[] = [];

    if (agent.experienceProfileId) {
      experienceSections.push(`Experience profile: ${agent.experienceProfileId}`);
    }
    if (agent.experienceSummary) {
      experienceSections.push(`Experience summary: ${agent.experienceSummary}`);
    }
    if (agent.activationKeywords?.length) {
      experienceSections.push(`Activation keywords: ${agent.activationKeywords.join(', ')}`);
    }
    if (agent.memoryProfile?.length) {
      experienceSections.push(`Memory profile: ${agent.memoryProfile.join(', ')}`);
    }
    if (agent.lifecyclePhases?.length) {
      experienceSections.push(`Lifecycle phases: ${agent.lifecyclePhases.join(' -> ')}`);
    }

    const experiencePrompt =
      experienceSections.length > 0
        ? `## Experience Context\n${experienceSections.join('\n')}\n`
        : '';

    return `${agent.prompt}

${experiencePrompt}

## Tools
You have access to tools. When you call a tool, you must use the required parameters.

## Guidelines
- Be concise and actionable
- Think step by step
- Prioritize safety and user consent
- Provide evidence for claims
`;
  }

  getSession(sessionId: string): AgentSession | undefined {
    return this.sessions.get(sessionId);
  }

  getSessionsByAgent(agentId: string): AgentSession[] {
    return Array.from(this.sessions.values()).filter((s) => s.agentId === agentId);
  }

  updateSessionStatus(sessionId: string, status: SessionStatus): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = status;
      session.updatedAt = Date.now();
    }
  }

  abortSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'aborted';
      session.updatedAt = Date.now();
      logger.info('AgentEngine', `Aborted session: ${sessionId}`);
    }
  }
}

export const agentEngine = new AgentEngine({
  model: 'claude-sonnet-4-20250514',
  provider: 'anthropic',
  thinking: 'medium',
});
