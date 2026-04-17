import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Bot,
  Clock3,
  Command,
  Cpu,
  LayoutGrid,
  Play,
  RefreshCcw,
  Search,
  Settings,
  Sparkles,
  Terminal,
  Trash2,
  Wrench,
  Zap,
} from 'lucide-react';
import { getCommandStats, getToolStats, VERSION, CODENAME } from '@/lib/clawCode';
import {
  useClawCode,
  useCommandSearch,
  useRoutedMatches,
  useSessionManager,
  useToolSearch,
} from '@/lib/clawCode/hooks';
import type { ExecutionHistoryEntry, PortingModule } from '@/lib/clawCode/types';
import {
  DEFAULT_LLM_CONFIG,
  type LLMConfig,
} from '@/components/CodeEditor/actions/agentConstants';
import { loadLLMConfigFromStorage } from '@/lib/llmConfigUtils';
import styles from './ClawCodePanel.module.scss';

interface ClawCodePanelProps {
  onCommandExecute?: (name: string, prompt: string) => void;
  onToolExecute?: (name: string, payload: string) => void;
  onSessionChange?: (sessionId: string | null) => void;
  onOpenApiSettings?: () => void;
  llmConfig?: Partial<LLMConfig>;
}

type ClawView = 'runtime' | 'commands' | 'tools' | 'sessions' | 'analytics';

type ConsoleItem = {
  id: string;
  tone: 'user' | 'info' | 'success' | 'warning' | 'error' | 'assistant';
  title: string;
  content: string;
  timestamp: number;
};

function formatTime(value: number) {
  return new Date(value).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatPayload(value: unknown) {
  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function createConsoleItem(
  tone: ConsoleItem['tone'],
  title: string,
  content: string,
): ConsoleItem {
  return {
    id: `${title}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    tone,
    title,
    content,
    timestamp: Date.now(),
  };
}

export default function ClawCodePanel({
  onCommandExecute,
  onToolExecute,
  onSessionChange,
  onOpenApiSettings,
  llmConfig,
}: ClawCodePanelProps) {
  const [activeView, setActiveView] = useState<ClawView>('runtime');
  const [inputPrompt, setInputPrompt] = useState('');
  const [consoleItems, setConsoleItems] = useState<ConsoleItem[]>([]);
  const [executionHistory, setExecutionHistory] = useState<ExecutionHistoryEntry[]>([]);
  const [useLLM, setUseLLM] = useState(true);
  const [useTools, setUseTools] = useState(true);
  const [autoExecute, setAutoExecute] = useState(false);
  const [storedConfig, setStoredConfig] = useState<LLMConfig>(DEFAULT_LLM_CONFIG);

  useEffect(() => {
    const syncConfig = () => {
      try {
        setStoredConfig(loadLLMConfigFromStorage());
      } catch (error) {
        console.warn('[ClawCodePanel] Failed to load API config:', error);
        setStoredConfig(DEFAULT_LLM_CONFIG);
      }
    };

    syncConfig();
    window.addEventListener('agent-api-config-updated', syncConfig);

    return () => {
      window.removeEventListener('agent-api-config-updated', syncConfig);
    };
  }, []);

  const resolvedConfig = useMemo(
    () => ({ ...storedConfig, ...(llmConfig ?? {}) }),
    [storedConfig, llmConfig],
  );

  const clawCode = useClawCode({
    maxTurns: 8,
    autoSave: true,
    llmConfig: resolvedConfig,
  });
  const commandSearch = useCommandSearch();
  const toolSearch = useToolSearch({ includeMcp: true });
  const sessionManager = useSessionManager();
  const routedMatches = useRoutedMatches(inputPrompt, 8);

  const commandStats = useMemo(() => getCommandStats(), []);
  const toolStats = useMemo(() => getToolStats(), []);
  const totalTokens = clawCode.usage.inputTokens + clawCode.usage.outputTokens;
  const latestTurn = clawCode.turnResults.at(-1) ?? null;

  useEffect(() => {
    onSessionChange?.(clawCode.sessionId);
  }, [clawCode.sessionId, onSessionChange]);

  const appendConsole = (
    tone: ConsoleItem['tone'],
    title: string,
    content: string,
  ) => {
    setConsoleItems((prev) => [...prev, createConsoleItem(tone, title, content)]);
  };

  const appendHistory = (entry: ExecutionHistoryEntry) => {
    setExecutionHistory((prev) => [entry, ...prev].slice(0, 60));
  };

  const handleSubmit = async () => {
    if (!inputPrompt.trim() || clawCode.isLoading) {
      return;
    }

    if (useLLM && !resolvedConfig.apiKey?.trim()) {
      appendConsole('warning', 'API 设置未完成', '请先完成共享 API 设置，再继续执行。');
      appendHistory({
        timestamp: Date.now(),
        category: 'warning',
        message: '共享 API 设置为空，已阻止执行。',
        level: 'warn',
      });
      onOpenApiSettings?.();
      return;
    }

    const prompt = inputPrompt.trim();
    appendConsole('user', '输入提示词', prompt);
    appendHistory({
      timestamp: Date.now(),
      category: 'runtime',
      message: '提交了一次新的执行请求。',
      level: 'info',
      metadata: { prompt },
    });

    try {
      const result = await clawCode.submitPrompt(prompt, {
        useLLM,
        useTools,
        autoExecute,
      });

      if (!result) {
        throw new Error(clawCode.error || '本次运行没有返回结果。');
      }

      if (result.matchedCommands.length > 0) {
        appendConsole('info', '匹配命令', result.matchedCommands.join('、'));
      }

      if (result.matchedTools.length > 0) {
        appendConsole('info', '匹配工具', result.matchedTools.join('、'));
      }

      if (result.permissionDenials.length > 0) {
        appendConsole(
          'warning',
          '权限提示',
          result.permissionDenials
            .map((item) => `${item.toolName}: ${item.reason}`)
            .join('\n'),
        );
      }

      appendConsole(
        'assistant',
        '执行输出',
        result.output || '本次运行没有输出内容。',
      );
      appendHistory({
        timestamp: Date.now(),
        category: 'result',
        message: `运行完成，停止原因：${result.stopReason}`,
        level: result.stopReason === 'completed' ? 'info' : 'warn',
        metadata: { result },
      });

      sessionManager.refresh();
      setInputPrompt('');
    } catch (error) {
      const message = error instanceof Error ? error.message : '执行失败，请稍后再试。';
      appendConsole('error', '执行失败', message);
      appendHistory({
        timestamp: Date.now(),
        category: 'error',
        message,
        level: 'error',
      });
    }
  };

  const handleReset = () => {
    clawCode.resetSession();
    setConsoleItems([]);
    setExecutionHistory([]);
    sessionManager.refresh();
    appendConsole('info', '运行时已重置', '新的会话已经准备好，可以继续输入。');
  };

  const handleCommandExecute = (name: string) => {
    const result = clawCode.executeCommand(name, inputPrompt);
    onCommandExecute?.(name, inputPrompt);
    appendConsole(
      result.handled ? 'success' : 'warning',
      `命令 ${name}`,
      result.message,
    );
    appendHistory({
      timestamp: Date.now(),
      category: 'command',
      message: `${name}: ${result.message}`,
      level: result.handled ? 'info' : 'warn',
    });
    setActiveView('runtime');
  };

  const handleToolExecute = (name: string) => {
    const result = clawCode.executeTool(name, inputPrompt);
    onToolExecute?.(name, inputPrompt);
    appendConsole(
      result.handled ? 'success' : 'warning',
      `工具 ${name}`,
      result.message,
    );
    appendHistory({
      timestamp: Date.now(),
      category: 'tool',
      message: `${name}: ${result.message}`,
      level: result.handled ? 'info' : 'warn',
    });
    setActiveView('runtime');
  };

  const renderRuntime = () => (
    <div className={styles.runtimeView}>
      <section className={styles.hero}>
        <div>
          <p className={styles.kicker}>Claw Code Runtime</p>
          <h2>命令、工具、会话与分析一体化面板</h2>
          <p className={styles.heroCopy}>
            这里把执行链路、命令匹配、工具路由和输出统一收口，方便和对话共用一套
            API 设置。
          </p>
        </div>
        <div className={styles.heroStats}>
          <div className={styles.statCard}>
            <Cpu size={16} />
            <div>
              <strong>{VERSION}</strong>
              <span>{CODENAME}</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <Terminal size={16} />
            <div>
              <strong>{clawCode.isLoading ? '运行中' : '就绪'}</strong>
              <span>当前状态</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <Zap size={16} />
            <div>
              <strong>{totalTokens}</strong>
              <span>累计 Token</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.controlCard}>
        <div className={styles.controlHeader}>
          <div>
            <h3>输入提示词</h3>
            <p>按真实工作流来跑，先匹配，再执行，再看输出。</p>
          </div>
          <div className={styles.controlActions}>
            {onOpenApiSettings ? (
              <button type="button" onClick={onOpenApiSettings}>
                <Settings size={14} />
                API 设置
              </button>
            ) : null}
            <button type="button" onClick={handleReset}>
              <RefreshCcw size={14} />
              重置
            </button>
            <button type="button" onClick={() => setConsoleItems([])}>
              <Trash2 size={14} />
              清空输出
            </button>
          </div>
        </div>

        <textarea
          value={inputPrompt}
          onChange={(event) => setInputPrompt(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              void handleSubmit();
            }
          }}
          rows={5}
          placeholder="输入提示词，Cmd/Ctrl + Enter 立即执行。"
        />

        <div className={styles.toggleRow}>
          <button
            type="button"
            className={`${styles.toggleChip} ${useLLM ? styles.toggleChipActive : ''}`}
            onClick={() => setUseLLM((prev) => !prev)}
          >
            <Bot size={14} />
            使用 LLM
          </button>
          <button
            type="button"
            className={`${styles.toggleChip} ${useTools ? styles.toggleChipActive : ''}`}
            onClick={() => setUseTools((prev) => !prev)}
          >
            <Wrench size={14} />
            使用工具
          </button>
          <button
            type="button"
            className={`${styles.toggleChip} ${autoExecute ? styles.toggleChipActive : ''}`}
            onClick={() => setAutoExecute((prev) => !prev)}
          >
            <Sparkles size={14} />
            自动执行
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            disabled={!inputPrompt.trim() || clawCode.isLoading}
            onClick={() => void handleSubmit()}
          >
            <Play size={15} />
            {clawCode.isLoading ? '执行中...' : '执行'}
          </button>
        </div>
      </section>

      {routedMatches.length > 0 ? (
        <section className={styles.matchCard}>
          <div className={styles.sectionHeader}>
            <span>即时匹配</span>
            <small>{routedMatches.length} 项</small>
          </div>
          <div className={styles.matchGrid}>
            {routedMatches.map((match) => (
              <button
                key={`${match.kind}-${match.name}`}
                type="button"
                className={styles.matchItem}
                onClick={() =>
                  match.kind === 'command'
                    ? handleCommandExecute(match.name)
                    : handleToolExecute(match.name)
                }
              >
                <div>
                  <strong>{match.name}</strong>
                  <span>{match.sourceHint}</span>
                </div>
                <small>{match.confidence ?? 'medium'}</small>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <div className={styles.runtimeColumns}>
        <section className={styles.consoleCard}>
          <div className={styles.sectionHeader}>
            <span>输出流</span>
            <small>{consoleItems.length} 条</small>
          </div>
          <div className={styles.consoleList}>
            {consoleItems.length === 0 ? (
              <div className={styles.emptyState}>
                <Terminal size={22} />
                <p>等待输入。命令和工具的执行记录会从这里开始堆叠。</p>
              </div>
            ) : null}

            {consoleItems.map((item) => (
              <article
                key={item.id}
                className={`${styles.consoleItem} ${styles[`tone_${item.tone}`]}`}
              >
                <div className={styles.consoleMeta}>
                  <strong>{item.title}</strong>
                  <span>{formatTime(item.timestamp)}</span>
                </div>
                <pre>{item.content}</pre>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.sideStack}>
          <div className={styles.sideCard}>
            <div className={styles.sectionHeader}>
              <span>会话概览</span>
            </div>
            <div className={styles.metricGrid}>
              <div className={styles.metricTile}>
                <strong>{clawCode.sessionId?.slice(0, 8) ?? '未创建'}</strong>
                <span>会话 ID</span>
              </div>
              <div className={styles.metricTile}>
                <strong>{clawCode.messages.length}</strong>
                <span>轮次</span>
              </div>
              <div className={styles.metricTile}>
                <strong>{clawCode.permissionDenials.length}</strong>
                <span>权限拦截</span>
              </div>
              <div className={styles.metricTile}>
                <strong>{sessionManager.stats.total}</strong>
                <span>本地会话</span>
              </div>
            </div>
          </div>

          <div className={styles.sideCard}>
            <div className={styles.sectionHeader}>
              <span>最新结果</span>
            </div>
            {latestTurn ? (
              <div className={styles.latestResult}>
                <div className={styles.latestRow}>
                  <span>停止原因</span>
                  <strong>{latestTurn.stopReason}</strong>
                </div>
                <div className={styles.latestRow}>
                  <span>匹配命令</span>
                  <strong>{latestTurn.matchedCommands.length}</strong>
                </div>
                <div className={styles.latestRow}>
                  <span>匹配工具</span>
                  <strong>{latestTurn.matchedTools.length}</strong>
                </div>
                <div className={styles.latestRow}>
                  <span>输出 Token</span>
                  <strong>{latestTurn.usage.outputTokens}</strong>
                </div>
              </div>
            ) : (
              <div className={styles.emptyStateCompact}>还没有执行记录。</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );

  const renderCatalogCard = (
    item: PortingModule,
    type: 'command' | 'tool',
  ) => (
    <article key={item.name} className={styles.catalogCard}>
      <div className={styles.catalogHeader}>
        <strong>{item.name}</strong>
        <span>{item.status}</span>
      </div>
      <p>{item.responsibility}</p>
      <div className={styles.catalogFooter}>
        <small>{item.sourceHint}</small>
        <button
          type="button"
          onClick={() =>
            type === 'command'
              ? handleCommandExecute(item.name)
              : handleToolExecute(item.name)
          }
        >
          运行
        </button>
      </div>
    </article>
  );

  const renderCatalog = (
    title: string,
    query: string,
    setQuery: (value: string) => void,
    items: JSX.Element[],
    total: number,
  ) => (
    <div className={styles.catalogView}>
      <div className={styles.catalogToolbar}>
        <div>
          <h3>{title}</h3>
          <p>总计 {total} 项，搜索范围已经收口到当前面板。</p>
        </div>
        <label className={styles.searchField}>
          <Search size={15} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`搜索${title}`}
          />
        </label>
      </div>
      <div className={styles.catalogGrid}>{items}</div>
    </div>
  );

  const renderSessions = () => (
    <div className={styles.sessionsView}>
      <div className={styles.catalogToolbar}>
        <div>
          <h3>会话列表</h3>
          <p>这里直接管理 Claw Code 本地会话，方便和记忆面板同步查看。</p>
        </div>
        <button type="button" className={styles.primaryButton} onClick={sessionManager.refresh}>
          <RefreshCcw size={15} />
          刷新
        </button>
      </div>

      <div className={styles.sessionList}>
        {sessionManager.sessions.length === 0 ? (
          <div className={styles.emptyState}>
            <Clock3 size={22} />
            <p>还没有会话记录。</p>
          </div>
        ) : null}

        {sessionManager.sessions.map((session) => (
          <article key={session.sessionId} className={styles.sessionCard}>
            <div className={styles.catalogHeader}>
              <strong>{session.sessionId.slice(0, 12)}...</strong>
              <span>{formatTime(session.updatedAt)}</span>
            </div>
            <p>
              {session.messages.length} 条消息，累计{' '}
              {session.inputTokens + session.outputTokens} Token
            </p>
            <div className={styles.catalogFooter}>
              <small>创建于 {formatTime(session.createdAt)}</small>
              <button
                type="button"
                onClick={() => {
                  sessionManager.delete(session.sessionId);
                  appendConsole('info', '会话已删除', session.sessionId);
                }}
              >
                删除
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className={styles.analyticsView}>
      <div className={styles.analyticsGrid}>
        <article className={styles.analyticsCard}>
          <div className={styles.catalogHeader}>
            <strong>命令统计</strong>
            <Command size={16} />
          </div>
          <div className={styles.breakdownList}>
            <div><span>总数</span><strong>{commandStats.total}</strong></div>
            <div><span>Git</span><strong>{commandStats.git}</strong></div>
            <div><span>项目</span><strong>{commandStats.project}</strong></div>
            <div><span>分析</span><strong>{commandStats.analysis}</strong></div>
            <div><span>AI</span><strong>{commandStats.ai}</strong></div>
          </div>
        </article>

        <article className={styles.analyticsCard}>
          <div className={styles.catalogHeader}>
            <strong>工具统计</strong>
            <LayoutGrid size={16} />
          </div>
          <div className={styles.breakdownList}>
            <div><span>总数</span><strong>{toolStats.total}</strong></div>
            <div><span>文件</span><strong>{toolStats.file}</strong></div>
            <div><span>代码</span><strong>{toolStats.code}</strong></div>
            <div><span>网络</span><strong>{toolStats.network}</strong></div>
            <div><span>危险工具</span><strong>{toolStats.dangerous}</strong></div>
          </div>
        </article>

        <article className={styles.analyticsCard}>
          <div className={styles.catalogHeader}>
            <strong>运行概览</strong>
            <BarChart3 size={16} />
          </div>
          <div className={styles.breakdownList}>
            <div><span>当前会话</span><strong>{clawCode.sessionId?.slice(0, 8) ?? '--'}</strong></div>
            <div><span>消息轮次</span><strong>{clawCode.messages.length}</strong></div>
            <div><span>输入 Token</span><strong>{clawCode.usage.inputTokens}</strong></div>
            <div><span>输出 Token</span><strong>{clawCode.usage.outputTokens}</strong></div>
            <div><span>历史记录</span><strong>{executionHistory.length}</strong></div>
          </div>
        </article>

        <article className={styles.analyticsCard}>
          <div className={styles.catalogHeader}>
            <strong>事件历史</strong>
            <Terminal size={16} />
          </div>
          <div className={styles.historyList}>
            {executionHistory.length === 0 ? (
              <div className={styles.emptyStateCompact}>还没有记录。</div>
            ) : null}
            {executionHistory.map((item) => (
              <div key={`${item.timestamp}-${item.message}`} className={styles.historyItem}>
                <span>{formatTime(item.timestamp)}</span>
                <strong>{item.category}</strong>
                <p>{item.message}</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </div>
  );

  return (
    <div className={styles.panelRoot}>
      <header className={styles.panelHeader}>
        <div>
          <p className={styles.kicker}>Claw Code</p>
          <h2>运行时、命令、工具、会话、分析</h2>
        </div>
        <div className={styles.panelHeaderAside}>
          <div className={styles.headerStats}>
            <div className={styles.headerStat}>
              <Bot size={16} />
              <div>
                <strong>{commandStats.total}</strong>
                <span>命令</span>
              </div>
            </div>
            <div className={styles.headerStat}>
              <Wrench size={16} />
              <div>
                <strong>{toolStats.total}</strong>
                <span>工具</span>
              </div>
            </div>
            <div className={styles.headerStat}>
              <Terminal size={16} />
              <div>
                <strong>{sessionManager.stats.total}</strong>
                <span>会话</span>
              </div>
            </div>
          </div>
          {onOpenApiSettings ? (
            <button type="button" className={styles.headerAction} onClick={onOpenApiSettings}>
              <Settings size={15} />
              API 设置
            </button>
          ) : null}
        </div>
      </header>

      <nav className={styles.tabBar}>
        {[
          ['runtime', '运行时', <Cpu size={15} />],
          ['commands', '命令', <Command size={15} />],
          ['tools', '工具', <Wrench size={15} />],
          ['sessions', '会话', <Clock3 size={15} />],
          ['analytics', '分析', <BarChart3 size={15} />],
        ].map(([id, label, icon]) => (
          <button
            key={id}
            type="button"
            className={`${styles.tabButton} ${activeView === id ? styles.tabButtonActive : ''}`}
            onClick={() => setActiveView(id as ClawView)}
          >
            {icon}
            {label}
          </button>
        ))}
      </nav>

      <section className={styles.contentArea}>
        {activeView === 'runtime' && renderRuntime()}
        {activeView === 'commands' &&
          renderCatalog(
            '命令目录',
            commandSearch.query,
            commandSearch.setQuery,
            commandSearch.results.map((item) => renderCatalogCard(item, 'command')),
            commandSearch.commands.length,
          )}
        {activeView === 'tools' &&
          renderCatalog(
            '工具目录',
            toolSearch.query,
            toolSearch.setQuery,
            toolSearch.results.map((item) => renderCatalogCard(item, 'tool')),
            toolSearch.tools.length,
          )}
        {activeView === 'sessions' && renderSessions()}
        {activeView === 'analytics' && renderAnalytics()}
      </section>
    </div>
  );
}
