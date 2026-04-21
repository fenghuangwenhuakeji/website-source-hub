/**
 * Permission System - Fine-grained Access Control
 * Inspired by OpenCode PermissionNext
 */

import { type PermissionRule, generateId } from './types';
import { logger } from '../logger';

export type Permission =
  | 'read'
  | 'write'
  | 'edit'
  | 'execute'
  | 'network'
  | 'external_dir'
  | 'browser'
  | 'filesystem';

export interface PermissionRequest {
  permission: Permission;
  resource?: string;
  reason?: string;
  sessionId?: string;
}

export interface PermissionResult {
  granted: boolean;
  reason?: string;
  rule?: PermissionRule;
}

export interface PermissionEvent {
  permission: Permission;
  resource?: string;
  granted: boolean;
  timestamp: number;
  sessionId?: string;
}

export class PermissionManager {
  private rules: PermissionRule[] = [];
  private policyCache: Map<string, PermissionRule[]> = new Map();
  private eventListeners: ((event: PermissionEvent) => void)[] = [];
  private pendingRequests: Map<string, PermissionRequest> = new Map();

  constructor() {
    this.initDefaultRules();
  }

  private initDefaultRules(): void {
    this.rules = [
      { permission: 'read', action: 'allow' },
      { permission: 'write', action: 'allow' },
      { permission: 'edit', action: 'allow' },
      {
        permission: 'execute',
        pattern: '^(ls|cd|cat|echo|grep|find|git|pnpm|npm|node|cargo|go|python)',
        action: 'allow',
      },
      { permission: 'execute', pattern: '^(rm|mv|cp|chmod|chown|sudo|kill)', action: 'deny' },
      { permission: 'network', action: 'ask' },
      { permission: 'external_dir', action: 'deny' },
      { permission: 'browser', action: 'allow' },
      { permission: 'filesystem', action: 'allow' },
    ];
  }

  check(permission: Permission, resource?: string): PermissionResult {
    const matchingRule = this.findMatchingRule(permission, resource);

    if (matchingRule) {
      const granted = matchingRule.action === 'allow';
      logger.info('PermissionManager', `Permission check: ${permission} -> ${matchingRule.action}`);

      return {
        granted,
        reason: `Matched rule: ${matchingRule.action}`,
        rule: matchingRule,
      };
    }

    logger.info('PermissionManager', `Permission check: ${permission} -> ask (no rule)`);
    return { granted: false, reason: 'No matching rule, asking user' };
  }

  private findMatchingRule(permission: Permission, resource?: string): PermissionRule | null {
    for (const rule of this.rules) {
      if (rule.permission !== permission) continue;

      if (rule.pattern && resource) {
        try {
          const regex = new RegExp(rule.pattern, 'i');
          if (!regex.test(resource)) continue;
        } catch {
          if (!resource.includes(rule.pattern)) continue;
        }
      }

      return rule;
    }

    return null;
  }

  async request(
    permission: Permission,
    resource?: string,
    reason?: string,
  ): Promise<PermissionResult> {
    const cachedResult = this.check(permission, resource);
    if (cachedResult.rule?.action !== 'ask') {
      return cachedResult;
    }

    return new Promise((resolve) => {
      const requestId = generateId();
      const request: PermissionRequest = { permission, resource, reason };
      this.pendingRequests.set(requestId, request);

      logger.info('PermissionManager', `Permission request pending: ${permission} (${requestId})`);

      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        resolve({ granted: false, reason: 'Timeout' });
      }, 30000);

      const resolveRequest = (granted: boolean) => {
        clearTimeout(timeout);
        this.pendingRequests.delete(requestId);
        const result: PermissionResult = {
          granted,
          reason: granted ? 'User granted' : 'User denied',
        };
        resolve(result);
      };

      (
        window as unknown as { __permissionResolver?: (granted: boolean) => void }
      ).__permissionResolver = resolveRequest;
    });
  }

  resolvePendingRequest(requestId: string, granted: boolean): void {
    const resolver = (window as unknown as { __permissionResolver?: (granted: boolean) => void })
      .__permissionResolver;
    if (resolver) {
      resolver(granted);
      delete (window as unknown as { __permissionResolver?: unknown }).__permissionResolver;
    }
  }

  addRule(rule: PermissionRule): void {
    this.rules.unshift(rule);
    this.policyCache.clear();
    logger.info('PermissionManager', `Added rule: ${rule.permission} -> ${rule.action}`);
  }

  removeRule(rule: PermissionRule): void {
    const index = this.rules.indexOf(rule);
    if (index > -1) {
      this.rules.splice(index, 1);
      this.policyCache.clear();
    }
  }

  getRules(): PermissionRule[] {
    return [...this.rules];
  }

  grant(permission: Permission, resource?: string): void {
    this.addRule({ permission, pattern: resource, action: 'allow' });
    this.emit({ permission, resource, granted: true, timestamp: Date.now() });
  }

  deny(permission: Permission, resource?: string): void {
    this.addRule({ permission, pattern: resource, action: 'deny' });
    this.emit({ permission, resource, granted: false, timestamp: Date.now() });
  }

  onEvent(listener: (event: PermissionEvent) => void): () => void {
    this.eventListeners.push(listener);
    return () => {
      const index = this.eventListeners.indexOf(listener);
      if (index > -1) this.eventListeners.splice(index, 1);
    };
  }

  private emit(event: PermissionEvent): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (error) {
        logger.error('PermissionManager', 'Event listener error:', error);
      }
    }
  }

  checkBashCommand(command: string): PermissionResult {
    const mainPattern = command.split(' ')[0];

    const dangerousPatterns = [
      /^rm\s+-[rfRfv]+/,
      /^sudo\s+/,
      /^chmod\s+777/,
      /^chown\s+/,
      /^kill\s+-9/,
      /^dd\s+if=/,
      /^mkfs\s+/,
      /^mount\s+--bind/,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(command)) {
        logger.warn('PermissionManager', `Blocked dangerous command: ${mainPattern}`);
        return { granted: false, reason: 'Dangerous command pattern blocked' };
      }
    }

    const allowedCommands = [
      'ls',
      'cd',
      'cat',
      'echo',
      'grep',
      'find',
      'git',
      'pnpm',
      'npm',
      'node',
      'cargo',
      'go',
      'python',
      'python3',
      'vim',
      'nano',
      'code',
      'curl',
      'wget',
    ];
    if (allowedCommands.includes(mainPattern)) {
      return { granted: true, reason: 'Allowed command' };
    }

    return this.check('execute', command);
  }

  checkFilePath(path: string): PermissionResult {
    const externalPatterns = [
      /^\.\.\//,
      /^~/,
      /^\/home\//,
      /^\/Users\//,
      /^[A-Za-z]:\\Windows\\ /i,
    ];

    for (const pattern of externalPatterns) {
      if (pattern.test(path)) {
        return { granted: false, reason: 'External directory access denied' };
      }
    }

    return { granted: true };
  }

  clearRules(): void {
    this.rules = [];
    this.policyCache.clear();
  }

  resetToDefault(): void {
    this.clearRules();
    this.initDefaultRules();
  }
}

export const permissionManager = new PermissionManager();
