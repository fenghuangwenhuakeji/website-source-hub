/**
 * Claw Code Runtime
 * 运行时系统 - 核心执行引擎
 */

import {
  RoutedMatch,
  RuntimeSession,
  PortContext,
  TurnResult,
  PermissionDenial,
  StreamEvent,
  generateId,
} from './types';
import { PORTED_COMMANDS, executeCommand, getCommand, findCommands } from './commands';
import { PORTED_TOOLS, executeTool, getTool, findTools, isDangerousTool } from './tools';
import { QueryEngine, routePrompt, inferPermissionDenials } from './queryEngine';
import { createSession, saveSession } from './sessionStore';

export interface TurnLoopOptions {
  limit?: number;
  maxTurns?: number;
  structuredOutput?: boolean;
}

export class PortRuntime {
  private history: { timestamp: number; category: string; message: string }[] = [];

  routePrompt(prompt: string, limit: number = 5): RoutedMatch[] {
    const tokens = this.tokenize(prompt);
    
    const commandMatches = this.collectMatches(tokens, PORTED_COMMANDS, 'command');
    const toolMatches = this.collectMatches(tokens, PORTED_TOOLS, 'tool');

    const selected: RoutedMatch[] = [];

    if (commandMatches.length > 0) selected.push(commandMatches.shift()!);
    if (toolMatches.length > 0) selected.push(toolMatches.shift()!);

    const leftovers = [...commandMatches, ...toolMatches]
      .sort((a, b) => b.score - a.score);

    selected.push(...leftovers.slice(0, limit - selected.length));

    this.addHistory('routing', `matches=${selected.length} for prompt="${prompt.substring(0, 50)}..."`);

    return selected.slice(0, limit);
  }

  bootstrapSession(prompt: string, limit: number = 5): RuntimeSession {
    const context = this.buildPortContext();
    const systemInitMessage = this.buildSystemInitMessage();
    const engine = new QueryEngine();

    this.addHistory('context', `files=${context.pythonFileCount}, archive=${context.archiveAvailable}`);
    this.addHistory('registry', `commands=${PORTED_COMMANDS.length}, tools=${PORTED_TOOLS.length}`);

    const matches = this.routePrompt(prompt, limit);
    const commandNames = matches.filter(m => m.kind === 'command').map(m => m.name);
    const toolNames = matches.filter(m => m.kind === 'tool').map(m => m.name);

    const commandExecs = matches
      .filter(m => m.kind === 'command')
      .map(m => executeCommand(m.name, prompt));

    const toolExecs = matches
      .filter(m => m.kind === 'tool')
      .map(m => executeTool(m.name, prompt));

    const denials = this.inferPermissionDenials(matches);

    const streamEvents: StreamEvent[] = [];
    for (const event of engine.streamSubmitMessage(prompt, commandNames, toolNames, denials)) {
      streamEvents.push(event);
    }

    const turnResult = engine.submitMessage(prompt, commandNames, toolNames, denials);
    const persistedSessionPath = engine.persistSession();

    this.addHistory('execution', `command_execs=${commandExecs.length} tool_execs=${toolExecs.length}`);
    this.addHistory('turn', `commands=${commandNames.length} tools=${toolNames.length} denials=${denials.length}`);
    this.addHistory('session_store', persistedSessionPath);

    return {
      prompt,
      context,
      systemInitMessage,
      routedMatches: matches,
      turnResult,
      commandExecutionMessages: commandExecs.map(e => e.message),
      toolExecutionMessages: toolExecs.map(e => e.message),
      streamEvents,
      persistedSessionPath,
    };
  }

  runTurnLoop(
    prompt: string,
    options: TurnLoopOptions = {}
  ): TurnResult[] {
    const { limit = 5, maxTurns = 3, structuredOutput = false } = options;

    const engine = new QueryEngine({ maxTurns, structuredOutput });
    const matches = this.routePrompt(prompt, limit);

    const commandNames = matches.filter(m => m.kind === 'command').map(m => m.name);
    const toolNames = matches.filter(m => m.kind === 'tool').map(m => m.name);

    const results: TurnResult[] = [];

    for (let turn = 0; turn < maxTurns; turn++) {
      const turnPrompt = turn === 0 ? prompt : `${prompt} [turn ${turn + 1}]`;
      const result = engine.submitMessage(turnPrompt, commandNames, toolNames, []);
      results.push(result);

      if (result.stopReason !== 'completed') {
        break;
      }
    }

    return results;
  }

  private tokenize(prompt: string): Set<string> {
    return new Set(
      prompt
        .replace(/[\/\-_]/g, ' ')
        .toLowerCase()
        .split(/\s+/)
        .filter(t => t.length > 2)
    );
  }

  private collectMatches(
    tokens: Set<string>,
    modules: { name: string; sourceHint: string; responsibility: string }[],
    kind: 'command' | 'tool'
  ): RoutedMatch[] {
    const matches: RoutedMatch[] = [];

    for (const module of modules) {
      const score = this.score(tokens, module);
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

  private score(
    tokens: Set<string>,
    module: { name: string; sourceHint: string; responsibility: string }
  ): number {
    const haystacks = [
      module.name.toLowerCase(),
      module.sourceHint.toLowerCase(),
      module.responsibility.toLowerCase(),
    ];

    let score = 0;
    for (const token of tokens) {
      if (haystacks.some(h => h.includes(token))) {
        score += 1;
      }
    }
    return score;
  }

  private inferPermissionDenials(matches: RoutedMatch[]): PermissionDenial[] {
    const denials: PermissionDenial[] = [];

    for (const match of matches) {
      if (match.kind === 'tool' && isDangerousTool(match.name)) {
        denials.push({
          toolName: match.name,
          reason: `Tool '${match.name}' requires explicit permission for potentially destructive operations`,
        });
      }
    }

    return denials;
  }

  private buildPortContext(): PortContext {
    return {
      pythonFileCount: 0,
      archiveAvailable: false,
      workspacePath: typeof window !== 'undefined' ? window.location.origin : '',
      timestamp: Date.now(),
    };
  }

  private buildSystemInitMessage(): string {
    return `Claw Code Runtime initialized with ${PORTED_COMMANDS.length} commands and ${PORTED_TOOLS.length} tools.`;
  }

  private addHistory(category: string, message: string): void {
    this.history.push({
      timestamp: Date.now(),
      category,
      message,
    });
  }

  getHistory(): { timestamp: number; category: string; message: string }[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
  }

  renderSessionMarkdown(session: RuntimeSession): string {
    const lines = [
      '# Runtime Session',
      '',
      `Prompt: ${session.prompt}`,
      '',
      '## Context',
      `- Workspace: ${session.context.workspacePath}`,
      `- Timestamp: ${new Date(session.context.timestamp).toISOString()}`,
      '',
      '## System Init',
      session.systemInitMessage,
      '',
      '## Routed Matches',
    ];

    if (session.routedMatches.length > 0) {
      session.routedMatches.forEach(match => {
        lines.push(`- [${match.kind}] ${match.name} (${match.score}) — ${match.sourceHint}`);
      });
    } else {
      lines.push('- none');
    }

    lines.push('', '## Command Execution');
    if (session.commandExecutionMessages.length > 0) {
      session.commandExecutionMessages.forEach(msg => lines.push(`- ${msg}`));
    } else {
      lines.push('- none');
    }

    lines.push('', '## Tool Execution');
    if (session.toolExecutionMessages.length > 0) {
      session.toolExecutionMessages.forEach(msg => lines.push(`- ${msg}`));
    } else {
      lines.push('- none');
    }

    lines.push('', '## Turn Result');
    lines.push(session.turnResult.output);
    lines.push('', `Stop reason: ${session.turnResult.stopReason}`);
    lines.push('', `Session path: ${session.persistedSessionPath}`);

    return lines.join('\n');
  }
}

let runtimeInstance: PortRuntime | null = null;

export function getRuntime(): PortRuntime {
  if (!runtimeInstance) {
    runtimeInstance = new PortRuntime();
  }
  return runtimeInstance;
}

export function resetRuntime(): void {
  runtimeInstance = null;
}
