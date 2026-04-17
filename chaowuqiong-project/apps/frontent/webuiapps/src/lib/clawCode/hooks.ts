/**
 * Claw Code React Hooks
 * React hooks used by the integrated workspace panels.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  QueryEngine,
  PortRuntime,
  getRuntime,
  routePrompt,
  inferPermissionDenials,
} from './index';
import {
  TurnResult,
  StreamEvent,
  RoutedMatch,
  PermissionDenial,
  QueryEngineConfig,
  RuntimeSession,
} from './types';
import type { LLMConfig } from './queryEngine';
import { getCommands, findCommands, executeCommand } from './commands';
import { getTools, findTools, executeTool } from './tools';
import {
  listSessions,
  createSession,
  getSessionStats,
  loadSession as loadStoredSession,
  deleteSession as deleteStoredSession,
} from './sessionStore';

export interface UseClawCodeOptions {
  maxTurns?: number;
  maxBudgetTokens?: number;
  structuredOutput?: boolean;
  autoSave?: boolean;
  llmConfig?: Partial<LLMConfig>;
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
    llmConfig,
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
    engineRef.current = new QueryEngine(
      {
        maxTurns,
        maxBudgetTokens,
        structuredOutput,
      },
      llmConfig,
    );
    runtimeRef.current = getRuntime();

    setState((prev) => ({
      ...prev,
      sessionId: engineRef.current!.getSessionId(),
    }));
  }, [maxTurns, maxBudgetTokens, structuredOutput, llmConfig]);

  const submitPrompt = useCallback(
    async (
      prompt: string,
      options?: { useLLM?: boolean; useTools?: boolean; autoExecute?: boolean },
    ) => {
      if (!engineRef.current || !runtimeRef.current) {
        setState((prev) => ({ ...prev, error: 'Engine not initialized' }));
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const matches = runtimeRef.current.routePrompt(prompt, 5);
        const denials = inferPermissionDenials(matches.filter((match) => match.kind === 'tool'));

        const result = await engineRef.current.submitMessage(prompt, {
          useLLM: options?.useLLM ?? true,
          useTools: options?.useTools ?? true,
          autoExecute: options?.autoExecute ?? false,
        });

        setState((prev) => ({
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
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
        return null;
      }
    },
    [autoSave],
  );

  const streamPrompt = useCallback(
    async function* (
      prompt: string,
      options?: { useLLM?: boolean; useTools?: boolean; autoExecute?: boolean },
    ): AsyncGenerator<StreamEvent> {
      if (!engineRef.current || !runtimeRef.current) {
        yield { type: 'message_stop', stopReason: 'error' };
        return;
      }

      const matches = runtimeRef.current.routePrompt(prompt, 5);
      const denials = inferPermissionDenials(matches.filter((match) => match.kind === 'tool'));

      for await (const event of engineRef.current.streamSubmitMessage(prompt, {
        useLLM: options?.useLLM ?? true,
        useTools: options?.useTools ?? true,
        autoExecute: options?.autoExecute ?? false,
      })) {
        yield event;
      }

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, prompt],
        routedMatches: matches,
        permissionDenials: [...prev.permissionDenials, ...denials],
      }));
    },
    [],
  );

  const bootstrapSession = useCallback((prompt: string): RuntimeSession => {
    if (!runtimeRef.current) {
      throw new Error('Runtime not initialized');
    }
    return runtimeRef.current.bootstrapSession(prompt);
  }, []);

  const runTurnLoop = useCallback(async (prompt: string, maxLoopTurns: number = 3) => {
    if (!runtimeRef.current) {
      return [];
    }
    return runtimeRef.current.runTurnLoop(prompt, { maxTurns: maxLoopTurns });
  }, []);

  const resetSession = useCallback(() => {
    engineRef.current = new QueryEngine(
      {
        maxTurns,
        maxBudgetTokens,
        structuredOutput,
      },
      llmConfig,
    );

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
  }, [maxTurns, maxBudgetTokens, structuredOutput, llmConfig]);

  const executeCommandByName = useCallback((name: string, prompt: string) => {
    return executeCommand(name, prompt);
  }, []);

  const executeToolByName = useCallback((name: string, payload: string) => {
    return executeTool(name, payload);
  }, []);

  const exportSession = useCallback(() => {
    if (!engineRef.current) return null;
    return engineRef.current.exportSession();
  }, []);

  const loadSession = useCallback((sessionId: string) => {
    const session = loadStoredSession(sessionId);
    if (session) {
      setState((prev) => ({
        ...prev,
        sessionId: session.sessionId,
        messages: session.messages || [],
        usage: {
          inputTokens: session.inputTokens || 0,
          outputTokens: session.outputTokens || 0,
        },
      }));
      return session;
    }
    return null;
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
    exportSession,
    loadSession,
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

  const deleteSession = useCallback(
    (sessionId: string) => {
      deleteStoredSession(sessionId);
      refresh();
    },
    [refresh],
  );

  return {
    sessions,
    stats,
    refresh,
    create,
    delete: deleteSession,
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
