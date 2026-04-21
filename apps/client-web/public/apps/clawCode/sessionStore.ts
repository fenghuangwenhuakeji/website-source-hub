/**
 * Claw Code Session Store
 * 会话存储系统
 */

import { StoredSession, generateId } from './types';

const SESSION_STORE_KEY = 'claw-code-sessions';
const SESSION_PREFIX = 'claw-session-';

let sessionCache: Map<string, StoredSession> | null = null;

function loadSessionCache(): Map<string, StoredSession> {
  if (sessionCache) return sessionCache;
  
  sessionCache = new Map();
  
  try {
    const stored = localStorage.getItem(SESSION_STORE_KEY);
    if (stored) {
      const sessions: StoredSession[] = JSON.parse(stored);
      sessions.forEach(s => sessionCache!.set(s.sessionId, s));
    }
  } catch (e) {
    console.warn('Failed to load sessions from storage:', e);
  }
  
  return sessionCache;
}

function persistSessions(): void {
  if (!sessionCache) return;
  
  try {
    const sessions = Array.from(sessionCache.values());
    localStorage.setItem(SESSION_STORE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.warn('Failed to persist sessions:', e);
  }
}

export function createSession(messages: string[] = []): StoredSession {
  const cache = loadSessionCache();
  const now = Date.now();
  
  const session: StoredSession = {
    sessionId: generateId(),
    messages,
    inputTokens: 0,
    outputTokens: 0,
    createdAt: now,
    updatedAt: now,
  };
  
  cache.set(session.sessionId, session);
  persistSessions();
  
  return session;
}

export function loadSession(sessionId: string): StoredSession | undefined {
  const cache = loadSessionCache();
  return cache.get(sessionId);
}

export function saveSession(session: StoredSession): string {
  const cache = loadSessionCache();
  session.updatedAt = Date.now();
  cache.set(session.sessionId, session);
  persistSessions();
  return `${SESSION_PREFIX}${session.sessionId}`;
}

export function deleteSession(sessionId: string): boolean {
  const cache = loadSessionCache();
  const result = cache.delete(sessionId);
  if (result) {
    persistSessions();
  }
  return result;
}

export function listSessions(): StoredSession[] {
  const cache = loadSessionCache();
  return Array.from(cache.values())
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function updateSession(
  sessionId: string, 
  updates: Partial<Omit<StoredSession, 'sessionId' | 'createdAt'>>
): StoredSession | undefined {
  const cache = loadSessionCache();
  const session = cache.get(sessionId);
  
  if (!session) return undefined;
  
  Object.assign(session, updates, { updatedAt: Date.now() });
  cache.set(sessionId, session);
  persistSessions();
  
  return session;
}

export function addMessageToSession(sessionId: string, message: string): StoredSession | undefined {
  const cache = loadSessionCache();
  const session = cache.get(sessionId);
  
  if (!session) return undefined;
  
  session.messages.push(message);
  session.updatedAt = Date.now();
  cache.set(sessionId, session);
  persistSessions();
  
  return session;
}

export function clearAllSessions(): void {
  sessionCache = new Map();
  localStorage.removeItem(SESSION_STORE_KEY);
}

export function getSessionStats(): { total: number; totalMessages: number; totalTokens: number } {
  const sessions = listSessions();
  
  return {
    total: sessions.length,
    totalMessages: sessions.reduce((sum, s) => sum + s.messages.length, 0),
    totalTokens: sessions.reduce((sum, s) => sum + s.inputTokens + s.outputTokens, 0),
  };
}
