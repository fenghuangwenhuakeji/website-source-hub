/**
 * Memory System - Persistent Context & Learning
 * Inspired by Everything Claude Instinct System + Auto-Claude Memory
 */

import { type MemoryEntry, type Instinct, generateId } from './types';
import { logger } from '../logger';
import { getUserScopedStorageKey } from '../userScopedStorage';

export interface MemoryQuery {
  type?: 'long-term' | 'daily' | 'session';
  tags?: string[];
  search?: string;
  limit?: number;
}

export class MemoryManager {
  private longTermMemory: MemoryEntry[] = [];
  private dailyMemory: Map<string, MemoryEntry[]> = new Map();
  private sessionMemory: Map<string, MemoryEntry[]> = new Map();
  private instincts: Instinct[] = [];
  private currentSessionId: string | null = null;

  private get storageKey(): string {
    return getUserScopedStorageKey('openroom-memory');
  }

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const memoryData = localStorage.getItem(this.storageKey);
      if (memoryData) {
        const parsed = JSON.parse(memoryData);
        this.longTermMemory = parsed.longTerm || [];
        this.instincts = parsed.instincts || [];

        const today = new Date().toISOString().split('T')[0];
        this.dailyMemory.set(today, parsed.daily?.[today] || []);
      }
    } catch (error) {
      logger.error('MemoryManager', 'Failed to load from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = {
        longTerm: this.longTermMemory,
        instincts: this.instincts,
        daily: { [today]: this.dailyMemory.get(today) || [] },
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      logger.error('MemoryManager', 'Failed to save to storage:', error);
    }
  }

  setCurrentSession(sessionId: string): void {
    this.currentSessionId = sessionId;
    if (!this.sessionMemory.has(sessionId)) {
      this.sessionMemory.set(sessionId, []);
    }
    logger.info('MemoryManager', `Session set: ${sessionId}`);
  }

  remember(content: string, type: MemoryEntry['type'] = 'session', tags?: string[]): MemoryEntry {
    const entry: MemoryEntry = {
      id: generateId(),
      type,
      content,
      timestamp: Date.now(),
      tags,
    };

    switch (type) {
      case 'long-term':
        this.longTermMemory.push(entry);
        break;
      case 'daily': {
        const today = new Date().toISOString().split('T')[0];
        const dailyEntries = this.dailyMemory.get(today) || [];
        dailyEntries.push(entry);
        this.dailyMemory.set(today, dailyEntries);
        break;
      }
      case 'session': {
        if (this.currentSessionId) {
          const sessionEntries = this.sessionMemory.get(this.currentSessionId) || [];
          sessionEntries.push(entry);
          this.sessionMemory.set(this.currentSessionId, sessionEntries);
        }
        break;
      }
    }

    this.saveToStorage();
    logger.info('MemoryManager', `Remembered (${type}): ${content.slice(0, 50)}...`);

    return entry;
  }

  recall(query: MemoryQuery = {}): MemoryEntry[] {
    let results: MemoryEntry[] = [];
    const today = new Date().toISOString().split('T')[0];

    if (query.type) {
      switch (query.type) {
        case 'long-term':
          results = [...this.longTermMemory];
          break;
        case 'daily':
          results = this.dailyMemory.get(today) || [];
          break;
        case 'session':
          if (this.currentSessionId) {
            results = this.sessionMemory.get(this.currentSessionId) || [];
          }
          break;
      }
    } else {
      results = [
        ...(this.sessionMemory.get(this.currentSessionId || '') || []),
        ...(this.dailyMemory.get(today) || []),
        ...this.longTermMemory,
      ];
    }

    if (query.tags && query.tags.length > 0) {
      results = results.filter((entry) => query.tags!.some((tag) => entry.tags?.includes(tag)));
    }

    if (query.search) {
      const searchLower = query.search.toLowerCase();
      results = results.filter((entry) => entry.content.toLowerCase().includes(searchLower));
    }

    if (query.limit) {
      results = results.slice(-query.limit);
    }

    return results.sort((a, b) => b.timestamp - a.timestamp);
  }

  getContextForSession(maxEntries: number = 10): string {
    const memories = this.recall({ limit: maxEntries });

    if (memories.length === 0) {
      return 'No relevant memories found.';
    }

    const formatted = memories.map((m) => {
      const date = new Date(m.timestamp).toLocaleString();
      return `[${date}] ${m.content}`;
    });

    return formatted.join('\n');
  }

  compact(maxEntries: number = 100): void {
    if (this.longTermMemory.length > maxEntries) {
      const oldEntries = this.longTermMemory
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(0, this.longTermMemory.length - maxEntries);

      this.longTermMemory = this.longTermMemory.slice(-maxEntries);

      logger.info('MemoryManager', `Compacted ${oldEntries.length} old memories`);
    }

    const today = new Date().toISOString().split('T')[0];
    const todayMemories = this.dailyMemory.get(today) || [];
    if (todayMemories.length > 50) {
      this.dailyMemory.set(today, todayMemories.slice(-50));
    }

    this.saveToStorage();
  }

  createInstinct(params: {
    pattern: string;
    action: string;
    confidence: number;
    domain: string;
    source?: string;
  }): Instinct {
    const instinct: Instinct = {
      id: generateId(),
      ...params,
      createdAt: Date.now(),
    };

    this.instincts.push(instinct);
    this.saveToStorage();

    logger.info('MemoryManager', `Created instinct: ${params.pattern} -> ${params.action}`);

    return instinct;
  }

  updateInstinct(
    instinctId: string,
    updates: Partial<Pick<Instinct, 'pattern' | 'action' | 'confidence'>>,
  ): Instinct | null {
    const instinct = this.instincts.find((i) => i.id === instinctId);
    if (!instinct) return null;

    Object.assign(instinct, updates);
    this.saveToStorage();

    return instinct;
  }

  getInstincts(domain?: string): Instinct[] {
    if (domain) {
      return this.instincts.filter((i) => i.domain === domain);
    }
    return [...this.instincts];
  }

  matchInstinct(input: string): Instinct[] {
    const lowerInput = input.toLowerCase();
    const matched: Instinct[] = [];

    for (const instinct of this.instincts) {
      try {
        const regex = new RegExp(instinct.pattern, 'i');
        if (regex.test(lowerInput)) {
          matched.push(instinct);
        }
      } catch {
        if (lowerInput.includes(instinct.pattern.toLowerCase())) {
          matched.push(instinct);
        }
      }
    }

    return matched.sort((a, b) => b.confidence - a.confidence);
  }

  extractPattern(content: string, domain: string, successRate: number = 0.7): Instinct | null {
    const patterns = this.extractRepeatedPatterns(content);

    if (patterns.length === 0) return null;

    const bestPattern = patterns[0];

    return this.createInstinct({
      pattern: bestPattern.pattern,
      action: bestPattern.action || 'Consider using this pattern',
      confidence: Math.min(0.9, Math.max(0.3, successRate)),
      domain,
      source: 'auto-extracted',
    });
  }

  private extractRepeatedPatterns(content: string): { pattern: string; action?: string }[] {
    const patterns: { pattern: string; action?: string }[] = [];

    const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
    for (const block of codeBlocks) {
      const lines = block.split('\n').filter((l) => l.trim());
      if (lines.length > 2) {
        patterns.push({
          pattern: lines.slice(1, -1).join(' ').slice(0, 100),
          action: 'code pattern',
        });
      }
    }

    return patterns;
  }

  deleteMemory(memoryId: string): boolean {
    let deleted = false;

    const ltIndex = this.longTermMemory.findIndex((m) => m.id === memoryId);
    if (ltIndex > -1) {
      this.longTermMemory.splice(ltIndex, 1);
      deleted = true;
    }

    for (const [, entries] of this.dailyMemory.entries()) {
      const index = entries.findIndex((m) => m.id === memoryId);
      if (index > -1) {
        entries.splice(index, 1);
        deleted = true;
      }
    }

    for (const [, entries] of this.sessionMemory.entries()) {
      const index = entries.findIndex((m) => m.id === memoryId);
      if (index > -1) {
        entries.splice(index, 1);
        deleted = true;
      }
    }

    if (deleted) {
      this.saveToStorage();
    }

    return deleted;
  }

  clearSession(sessionId: string): void {
    this.sessionMemory.delete(sessionId);
    this.saveToStorage();
    logger.info('MemoryManager', `Cleared session memory: ${sessionId}`);
  }

  clearAll(): void {
    this.longTermMemory = [];
    this.dailyMemory.clear();
    this.sessionMemory.clear();
    this.instincts = [];
    this.saveToStorage();
    logger.info('MemoryManager', 'Cleared all memories');
  }

  getStats(): {
    longTerm: number;
    daily: number;
    session: number;
    instincts: number;
  } {
    const today = new Date().toISOString().split('T')[0];
    return {
      longTerm: this.longTermMemory.length,
      daily: this.dailyMemory.get(today)?.length || 0,
      session: this.sessionMemory.get(this.currentSessionId || '')?.length || 0,
      instincts: this.instincts.length,
    };
  }
}

export const memoryManager = new MemoryManager();
