/**
 * Claw Code Execution Registry
 * 执行注册表 - 管理命令和工具的执行
 */

import { CommandExecution, ToolExecution, PortingModule } from './types';
import { executeCommand, getCommand, registerCommand, PORTED_COMMANDS } from './commands';
import { executeTool, getTool, registerTool, PORTED_TOOLS } from './tools';

export interface Executor<T> {
  module: PortingModule | null;
  execute: (...args: any[]) => T;
  register: (module: PortingModule) => void;
}

export interface CommandExecutor extends Executor<CommandExecution> {
  execute(prompt: string): CommandExecution;
}

export interface ToolExecutor extends Executor<ToolExecution> {
  execute(payload: string): ToolExecution;
}

function createCommandExecutor(name: string): CommandExecutor {
  return {
    module: getCommand(name) || null,
    execute: (prompt: string) => executeCommand(name, prompt),
    register: (module: PortingModule) => registerCommand(module),
  };
}

function createToolExecutor(name: string): ToolExecutor {
  return {
    module: getTool(name) || null,
    execute: (payload: string) => executeTool(name, payload),
    register: (module: PortingModule) => registerTool(module),
  };
}

export class ExecutionRegistry {
  private commands: Map<string, CommandExecutor> = new Map();
  private tools: Map<string, ToolExecutor> = new Map();

  constructor() {
    this.initializeDefaults();
  }

  private initializeDefaults(): void {
    for (const cmd of PORTED_COMMANDS) {
      this.commands.set(cmd.name.toLowerCase(), createCommandExecutor(cmd.name));
    }

    for (const tool of PORTED_TOOLS) {
      this.tools.set(tool.name.toLowerCase(), createToolExecutor(tool.name));
    }
  }

  command(name: string): CommandExecutor | undefined {
    return this.commands.get(name.toLowerCase());
  }

  tool(name: string): ToolExecutor | undefined {
    return this.tools.get(name.toLowerCase());
  }

  registerCommand(name: string, module: PortingModule): void {
    const executor = createCommandExecutor(name);
    executor.register(module);
    this.commands.set(name.toLowerCase(), executor);
  }

  registerTool(name: string, module: PortingModule): void {
    const executor = createToolExecutor(name);
    executor.register(module);
    this.tools.set(name.toLowerCase(), executor);
  }

  unregisterCommand(name: string): boolean {
    return this.commands.delete(name.toLowerCase());
  }

  unregisterTool(name: string): boolean {
    return this.tools.delete(name.toLowerCase());
  }

  listCommands(): string[] {
    return Array.from(this.commands.keys());
  }

  listTools(): string[] {
    return Array.from(this.tools.keys());
  }

  hasCommand(name: string): boolean {
    return this.commands.has(name.toLowerCase());
  }

  hasTool(name: string): boolean {
    return this.tools.has(name.toLowerCase());
  }

  executeCommand(name: string, prompt: string): CommandExecution {
    const executor = this.command(name);
    if (!executor) {
      return {
        name,
        sourceHint: '',
        prompt,
        handled: false,
        message: `Unknown command: ${name}`,
      };
    }
    return executor.execute(prompt);
  }

  executeTool(name: string, payload: string): ToolExecution {
    const executor = this.tool(name);
    if (!executor) {
      return {
        name,
        sourceHint: '',
        payload,
        handled: false,
        message: `Unknown tool: ${name}`,
      };
    }
    return executor.execute(payload);
  }
}

let registryInstance: ExecutionRegistry | null = null;

export function buildExecutionRegistry(): ExecutionRegistry {
  if (!registryInstance) {
    registryInstance = new ExecutionRegistry();
  }
  return registryInstance;
}

export function resetRegistry(): void {
  registryInstance = null;
}
