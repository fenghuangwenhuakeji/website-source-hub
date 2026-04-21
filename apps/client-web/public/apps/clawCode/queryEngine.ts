/**
 * Claw Code Query Engine
 * 查询引擎 - 核心对话处理系统
 */

import {
  QueryEngineConfig,
  TurnResult,
  StreamEvent,
  UsageSummary,
  PermissionDenial,
  DEFAULT_CONFIG,
  generateId,
} from './types';
import { buildCommandBacklog, getCommands, findCommands } from './commands';
import { buildToolBacklog, getTools, findTools, isDangerousTool } from './tools';
import { createSession, loadSession, saveSession, addMessageToSession } from './sessionStore';

export class QueryEngine {
  private config: QueryEngineConfig;
  private sessionId: string;
  private messages: string[];
  private permissionDenials: PermissionDenial[];
  private usage: UsageSummary;
  private transcript: { id: string; content: string; timestamp: number }[];

  constructor(config: Partial<QueryEngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = generateId();
    this.messages = [];
    this.permissionDenials = [];
    this.usage = { inputTokens: 0, outputTokens: 0 };
    this.transcript = [];
  }

  static fromWorkspace(): QueryEngine {
    return new QueryEngine();
  }

  static fromSavedSession(sessionId: string): QueryEngine | null {
    const stored = loadSession(sessionId);
    if (!stored) return null;

    const engine = new QueryEngine();
    engine.sessionId = stored.sessionId;
    engine.messages = [...stored.messages];
    engine.usage = {
      inputTokens: stored.inputTokens,
      outputTokens: stored.outputTokens,
    };

    return engine;
  }

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

  getPermissionDenials(): PermissionDenial[] {
    return [...this.permissionDenials];
  }

  submitMessage(
    prompt: string,
    matchedCommands: string[] = [],
    matchedTools: string[] = [],
    deniedTools: PermissionDenial[] = []
  ): TurnResult {
    if (this.messages.length >= this.config.maxTurns) {
      return {
        prompt,
        output: `Max turns reached before processing prompt: ${prompt}`,
        matchedCommands,
        matchedTools,
        permissionDenials: deniedTools,
        usage: this.usage,
        stopReason: 'max_turns_reached',
      };
    }

    const summaryLines = [
      `Prompt: ${prompt}`,
      `Matched commands: ${matchedCommands.length > 0 ? matchedCommands.join(', ') : 'none'}`,
      `Matched tools: ${matchedTools.length > 0 ? matchedTools.join(', ') : 'none'}`,
      `Permission denials: ${deniedTools.length}`,
    ];

    const output = this.formatOutput(summaryLines);
    const projectedUsage = this.addTurn(prompt, output);

    let stopReason: TurnResult['stopReason'] = 'completed';
    if (projectedUsage.inputTokens + projectedUsage.outputTokens > this.config.maxBudgetTokens) {
      stopReason = 'max_budget_reached';
    }

    this.messages.push(prompt);
    this.transcript.push({
      id: generateId(),
      content: prompt,
      timestamp: Date.now(),
    });
    this.permissionDenials.push(...deniedTools);
    this.usage = projectedUsage;
    this.compactMessagesIfNeeded();

    return {
      prompt,
      output,
      matchedCommands,
      matchedTools,
      permissionDenials: deniedTools,
      usage: this.usage,
      stopReason,
    };
  }

  *streamSubmitMessage(
    prompt: string,
    matchedCommands: string[] = [],
    matchedTools: string[] = [],
    deniedTools: PermissionDenial[] = []
  ): Generator<StreamEvent> {
    yield { type: 'message_start', sessionId: this.sessionId, prompt };

    if (matchedCommands.length > 0) {
      yield { type: 'command_match', commands: matchedCommands };
    }

    if (matchedTools.length > 0) {
      yield { type: 'tool_match', tools: matchedTools };
    }

    if (deniedTools.length > 0) {
      yield { type: 'permission_denial', denials: deniedTools.map(d => d.toolName) };
    }

    const result = this.submitMessage(prompt, matchedCommands, matchedTools, deniedTools);

    yield { type: 'message_delta', text: result.output };

    yield {
      type: 'message_stop',
      usage: result.usage,
      stopReason: result.stopReason,
      transcriptSize: this.transcript.length,
    };
  }

  private addTurn(prompt: string, output: string): UsageSummary {
    return {
      inputTokens: this.usage.inputTokens + this.estimateTokens(prompt),
      outputTokens: this.usage.outputTokens + this.estimateTokens(output),
    };
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private compactMessagesIfNeeded(): void {
    if (this.messages.length > this.config.compactAfterTurns) {
      this.messages = this.messages.slice(-this.config.compactAfterTurns);
    }
    if (this.transcript.length > this.config.compactAfterTurns) {
      this.transcript = this.transcript.slice(-this.config.compactAfterTurns);
    }
  }

  private formatOutput(summaryLines: string[]): string {
    if (this.config.structuredOutput) {
      return JSON.stringify({
        summary: summaryLines,
        sessionId: this.sessionId,
        timestamp: Date.now(),
      }, null, 2);
    }
    return summaryLines.join('\n');
  }

  persistSession(): string {
    const session = createSession(this.messages);
    session.inputTokens = this.usage.inputTokens;
    session.outputTokens = this.usage.outputTokens;
    return saveSession(session);
  }

  flushTranscript(): void {
    this.transcript = [];
  }

  replayUserMessages(): string[] {
    return this.transcript.map(t => t.content);
  }

  renderSummary(): string {
    const commandBacklog = buildCommandBacklog();
    const toolBacklog = buildToolBacklog();

    const sections = [
      '# Claw Code Query Engine Summary',
      '',
      `Session ID: ${this.sessionId}`,
      `Conversation turns: ${this.messages.length}`,
      `Permission denials: ${this.permissionDenials.length}`,
      `Usage: in=${this.usage.inputTokens} out=${this.usage.outputTokens}`,
      '',
      `Commands available: ${commandBacklog.modules.length}`,
      `Tools available: ${toolBacklog.modules.length}`,
      '',
      '## Recent Messages',
      ...this.messages.slice(-5).map((m, i) => `${i + 1}. ${m.substring(0, 100)}...`),
    ];

    return sections.join('\n');
  }
}

export function routePrompt(
  prompt: string,
  limit: number = 5
): { kind: 'command' | 'tool'; name: string; sourceHint: string; score: number }[] {
  const tokens = new Set(
    prompt
      .replace(/[\/\-_]/g, ' ')
      .toLowerCase()
      .split(/\s+/)
      .filter(t => t.length > 2)
  );

  const commandMatches = findMatches(tokens, getCommands(), 'command');
  const toolMatches = findMatches(tokens, getTools(), 'tool');

  const selected: { kind: 'command' | 'tool'; name: string; sourceHint: string; score: number }[] = [];

  if (commandMatches.length > 0) selected.push(commandMatches.shift()!);
  if (toolMatches.length > 0) selected.push(toolMatches.shift()!);

  const leftovers = [...commandMatches, ...toolMatches]
    .sort((a, b) => b.score - a.score);

  selected.push(...leftovers.slice(0, limit - selected.length));

  return selected.slice(0, limit);
}

function findMatches(
  tokens: Set<string>,
  modules: { name: string; sourceHint: string; responsibility?: string }[],
  kind: 'command' | 'tool'
): { kind: 'command' | 'tool'; name: string; sourceHint: string; score: number }[] {
  const matches: { kind: 'command' | 'tool'; name: string; sourceHint: string; score: number }[] = [];

  for (const module of modules) {
    const score = calculateScore(tokens, module);
    if (score > 0) {
      matches.push({
        kind,
        name: module.name,
        sourceHint: module.sourceHint,
        score,
      });
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}

function calculateScore(
  tokens: Set<string>,
  module: { name: string; sourceHint: string; responsibility?: string }
): number {
  const haystacks = [
    module.name.toLowerCase(),
    module.sourceHint.toLowerCase(),
    (module.responsibility || '').toLowerCase(),
  ];

  let score = 0;
  for (const token of tokens) {
    if (haystacks.some(h => h.includes(token))) {
      score += 1;
    }
  }
  return score;
}

export function inferPermissionDenials(
  matchedTools: { name: string }[]
): PermissionDenial[] {
  const denials: PermissionDenial[] = [];

  for (const tool of matchedTools) {
    if (isDangerousTool(tool.name)) {
      denials.push({
        toolName: tool.name,
        reason: `Tool '${tool.name}' requires explicit permission for potentially destructive operations`,
      });
    }
  }

  return denials;
}
