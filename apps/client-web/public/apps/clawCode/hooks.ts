/**
 * Claw Code React Hooks
 * React 钩子 - 用于组件集成
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  QueryEngine,
  PortRuntime,
  getRuntime,
  routePrompt,
  inferPermissionDenials,
} from '../index';
import {
  TurnResult,
  StreamEvent,
  RoutedMatch,
  PermissionDenial,
  QueryEngineConfig,
  RuntimeSession,
} from '../types';
import { getCommands, findCommands, executeCommand } from '../commands';
import { getTools, findTools, executeTool } from '../tools';
import { listSessions, createSession, saveSession, getSessionStats } from '../sessionStore';

export interface UseClawCodeOptions {
  maxTurns?: number;
  maxBudgetTokens?: number;
  structuredOutput?: boolean;
  autoSave?: boolean;
}

export interface ClawCodeState {
  isLoading: boolean;
  messages: string[];
  turnResults: TurnResult[];
  routedMatches: RoutedMatch[];
  permissionDenials: PermissionDenial[];
  usage: { inputTokens: number; outputTokens: number };
  sessionId: string | null;
  error: string | null;
}

export function useClawCode(options: UseClawCodeOptions = {}) {
  const {
    maxTurns = 8,
    maxBudgetTokens = 2000,
    structuredOutput = false,
    autoSave = true,
  } = options;

  const engineRef = useRef<QueryEngine | null>(null);
  const runtimeRef = useRef<PortRuntime | null>(null);

  const [state, setState] = useState<ClawCodeState>({
    isLoading: false,
    messages: [],
    turnResults: [],
    routedMatches: [],
    permissionDenials: [],
    usage: { inputTokens: 0, outputTokens: 0 },
    sessionId: null,
    error: null,
  });

  useEffect(() => {
    engineRef.current = new QueryEngine({
      maxTurns,
      maxBudgetTokens,
      structuredOutput,
    });
    runtimeRef.current = getRuntime();

    setState(prev => ({
      ...prev,
      sessionId: engineRef.current!.getSessionId(),
    }));
  }, [maxTurns, maxBudgetTokens, structuredOutput]);

  const submitPrompt = useCallback(async (prompt: string) => {
    if (!engineRef.current || !runtimeRef.current) {
      setState(prev => ({ ...prev, error: 'Engine not initialized' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const matches = runtimeRef.current.routePrompt(prompt, 5);
      const commandNames = matches.filter(m => m.kind === 'command').map(m => m.name);
      const toolNames = matches.filter(m => m.kind === 'tool').map(m => m.name);
      const denials = inferPermissionDenials(matches.filter(m => m.kind === 'tool'));

      const result = engineRef.current.submitMessage(prompt, commandNames, toolNames, denials);

      setState(prev => ({
        ...prev,
        isLoading: false,
        messages: [...prev.messages, prompt],
        turnResults: [...prev.turnResults, result],
        routedMatches: matches,
        permissionDenials: [...prev.permissionDenials, ...denials],
        usage: result.usage,
      }));

      if (autoSave) {
        engineRef.current.persistSession();
      }

      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
      return null;
    }
  }, [autoSave]);

  const streamPrompt = useCallback(async function* (prompt: string): AsyncGenerator<StreamEvent> {
    if (!engineRef.current || !runtimeRef.current) {
      yield { type: 'message_stop', stopReason: 'error' };
      return;
    }

    const matches = runtimeRef.current.routePrompt(prompt, 5);
    const commandNames = matches.filter(m => m.kind === 'command').map(m => m.name);
    const toolNames = matches.filter(m => m.kind === 'tool').map(m => m.name);
    const denials = inferPermissionDenials(matches.filter(m => m.kind === 'tool'));

    for (const event of engineRef.current.streamSubmitMessage(prompt, commandNames, toolNames, denials)) {
      yield event;
    }

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, prompt],
      routedMatches: matches,
      permissionDenials: [...prev.permissionDenials, ...denials],
    }));
  }, []);

  const bootstrapSession = useCallback((prompt: string): RuntimeSession => {
    if (!runtimeRef.current) {
      throw new Error('Runtime not initialized');
    }
    return runtimeRef.current.bootstrapSession(prompt);
  }, []);

  const runTurnLoop = useCallback(async (prompt: string, maxTurns: number = 3) => {
    if (!runtimeRef.current) {
      return [];
    }
    return runtimeRef.current.runTurnLoop(prompt, { maxTurns });
  }, []);

  const resetSession = useCallback(() => {
    engineRef.current = new QueryEngine({
      maxTurns,
      maxBudgetTokens,
      structuredOutput,
    });

    setState({
      isLoading: false,
      messages: [],
      turnResults: [],
      routedMatches: [],
      permissionDenials: [],
      usage: { inputTokens: 0, outputTokens: 0 },
      sessionId: engineRef.current.getSessionId(),
      error: null,
    });
  }, [maxTurns, maxBudgetTokens, structuredOutput]);

  const executeCommandByName = useCallback((name: string, prompt: string) => {
    return executeCommand(name, prompt);
  }, []);

  const executeToolByName = useCallback((name: string, payload: string) => {
    return executeTool(name, payload);
  }, []);

  return {
    ...state,
    submitPrompt,
    streamPrompt,
    bootstrapSession,
    runTurnLoop,
    resetSession,
    executeCommand: executeCommandByName,
    executeTool: executeToolByName,
    engine: engineRef.current,
    runtime: runtimeRef.current,
  };
}

export interface UseCommandSearchOptions {
  limit?: number;
}

export function useCommandSearch(options: UseCommandSearchOptions = {}) {
  const { limit = 20 } = options;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(getCommands());

  useEffect(() => {
    if (query.trim()) {
      setResults(findCommands(query, limit));
    } else {
      setResults(getCommands());
    }
  }, [query, limit]);

  return {
    query,
    setQuery,
    results,
    commands: getCommands(),
  };
}

export interface UseToolSearchOptions {
  limit?: number;
  simpleMode?: boolean;
  includeMcp?: boolean;
}

export function useToolSearch(options: UseToolSearchOptions = {}) {
  const { limit = 20, simpleMode = false, includeMcp = true } = options;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(getTools({ simpleMode, includeMcp }));

  useEffect(() => {
    if (query.trim()) {
      setResults(findTools(query, limit));
    } else {
      setResults(getTools({ simpleMode, includeMcp }));
    }
  }, [query, limit, simpleMode, includeMcp]);

  return {
    query,
    setQuery,
    results,
    tools: getTools({ simpleMode, includeMcp }),
  };
}

export function useSessionManager() {
  const [sessions, setSessions] = useState(listSessions());
  const [stats, setStats] = useState(getSessionStats());

  const refresh = useCallback(() => {
    setSessions(listSessions());
    setStats(getSessionStats());
  }, []);

  const create = useCallback(() => {
    const session = createSession();
    refresh();
    return session;
  }, [refresh]);

  return {
    sessions,
    stats,
    refresh,
    create,
  };
}

export function useRoutedMatches(prompt: string, limit: number = 5) {
  const [matches, setMatches] = useState<RoutedMatch[]>([]);

  useEffect(() => {
    if (prompt.trim()) {
      setMatches(routePrompt(prompt, limit));
    } else {
      setMatches([]);
    }
  }, [prompt, limit]);

  return matches;
}
