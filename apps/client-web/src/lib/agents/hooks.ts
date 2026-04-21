/**
 * Hook System - Event-driven Hooks
 * Inspired by claude-code Hookify + Everything Claude hooks
 */

import {
  type HookEvent,
  type HookDefinition,
  type HookCondition,
  type HookAction,
  generateId,
} from './types';
import { logger } from '../logger';

export interface HookResult {
  action: HookAction;
  allowed: boolean;
  message?: string;
  modified?: unknown;
}

export interface HookContext {
  event: HookEvent;
  data: Record<string, unknown>;
  timestamp: number;
}

export class HookEngine {
  private hooks: Map<string, HookDefinition> = new Map();
  private builtInHooks: HookDefinition[] = [];

  constructor() {
    this.initBuiltInHooks();
  }

  private initBuiltInHooks(): void {
    this.builtInHooks = [
      {
        id: 'block-dangerous-rm',
        name: 'Block Dangerous rm',
        event: 'pre-tool',
        conditions: [
          { field: 'toolName', operator: 'equals', value: 'Bash' },
          { field: 'command', operator: 'regex_match', value: 'rm\\s+-[rfRfv]+\\s+(/|\\*)' },
        ],
        action: 'block',
        enabled: true,
      },
      {
        id: 'warn-external-network',
        name: 'Warn External Network',
        event: 'pre-tool',
        conditions: [
          { field: 'toolName', operator: 'equals', value: 'WebFetch' },
          {
            field: 'url',
            operator: 'regex_match',
            value: '^(?!http://localhost|https://localhost|http://127\\.0\\.0\\.1).*',
          },
        ],
        action: 'warn',
        enabled: true,
      },
      {
        id: 'warn-sensitive-data',
        name: 'Warn Sensitive Data Access',
        event: 'pre-tool',
        conditions: [
          { field: 'toolName', operator: 'equals', value: 'Read' },
          {
            field: 'path',
            operator: 'regex_match',
            value: '(\\.env|password|secret|key|token|credential)',
          },
        ],
        action: 'warn',
        enabled: true,
      },
      {
        id: 'check-session-start',
        name: 'Session Start Handler',
        event: 'session-start',
        conditions: [],
        action: 'allow',
        enabled: true,
      },
      {
        id: 'check-session-end',
        name: 'Session End Handler',
        event: 'session-end',
        conditions: [],
        action: 'allow',
        enabled: true,
      },
    ];

    for (const hook of this.builtInHooks) {
      this.hooks.set(hook.id, hook);
    }
  }

  registerHook(hook: HookDefinition): void {
    this.hooks.set(hook.id, hook);
    logger.info('HookEngine', `Registered hook: ${hook.name} (${hook.id})`);
  }

  unregisterHook(hookId: string): boolean {
    return this.hooks.delete(hookId);
  }

  getHook(hookId: string): HookDefinition | undefined {
    return this.hooks.get(hookId);
  }

  getHooksByEvent(event: HookEvent): HookDefinition[] {
    return Array.from(this.hooks.values()).filter((h) => h.event === event && h.enabled);
  }

  async trigger(event: HookEvent, data: Record<string, unknown>): Promise<HookResult[]> {
    const hooks = this.getHooksByEvent(event);
    const results: HookResult[] = [];

    for (const hook of hooks) {
      const result = await this.evaluate(hook, data);
      results.push(result);
    }

    return results;
  }

  async evaluate(hook: HookDefinition, data: Record<string, unknown>): Promise<HookResult> {
    const matches = this.matchesConditions(hook.conditions, data);

    if (!matches) {
      return { action: 'allow', allowed: true };
    }

    let result: HookResult;

    switch (hook.action) {
      case 'block':
        result = {
          action: 'block',
          allowed: false,
          message: hook.name,
        };
        break;
      case 'warn':
        result = {
          action: 'warn',
          allowed: true,
          message: hook.name,
        };
        break;
      case 'modify':
        result = {
          action: 'modify',
          allowed: true,
          modified: data,
        };
        break;
      default:
        result = { action: 'allow', allowed: true };
    }

    logger.info(
      'HookEngine',
      `Hook ${hook.name} evaluated: ${result.action} (allowed: ${result.allowed})`,
    );

    return result;
  }

  private matchesConditions(conditions: HookCondition[], data: Record<string, unknown>): boolean {
    if (conditions.length === 0) return true;

    return conditions.every((condition) => {
      const value = this.getFieldValue(data, condition.field);
      if (value === undefined) return false;

      const strValue = String(value);
      const pattern = condition.value;

      switch (condition.operator) {
        case 'regex_match':
          try {
            return new RegExp(pattern, 'i').test(strValue);
          } catch {
            logger.warn('HookEngine', `Invalid regex pattern: ${pattern}`);
            return false;
          }
        case 'contains':
          return strValue.toLowerCase().includes(pattern.toLowerCase());
        case 'equals':
          return strValue === pattern;
        case 'starts_with':
          return strValue.startsWith(pattern);
        default:
          return false;
      }
    });
  }

  private getFieldValue(data: Record<string, unknown>, field: string): unknown {
    const parts = field.split('.');
    let value: unknown = data;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  enableHook(hookId: string): void {
    const hook = this.hooks.get(hookId);
    if (hook) {
      hook.enabled = true;
    }
  }

  disableHook(hookId: string): void {
    const hook = this.hooks.get(hookId);
    if (hook) {
      hook.enabled = false;
    }
  }

  listHooks(): HookDefinition[] {
    return Array.from(this.hooks.values());
  }

  listHooksByEvent(event: HookEvent): HookDefinition[] {
    return this.getHooksByEvent(event);
  }

  createHook(params: {
    name: string;
    event: HookEvent;
    conditions: HookCondition[];
    action: HookAction;
    message?: string;
  }): HookDefinition {
    return {
      id: generateId(),
      ...params,
      enabled: true,
    };
  }
}

export const hookEngine = new HookEngine();
