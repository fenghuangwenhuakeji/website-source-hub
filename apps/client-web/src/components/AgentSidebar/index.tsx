import React, { useEffect, useMemo, useState } from 'react';
import {
  Brain,
  Bot,
  ChevronLeft,
  ChevronRight,
  Settings,
  Sparkles,
  Terminal,
} from 'lucide-react';
import AgentApiSettingsPanel from './AgentApiSettingsPanel';
import AgentChatPanel from './AgentChatPanel';
import ClawCodePanel from './ClawCodePanel';
import styles from './index.module.scss';
import {
  getAllAgents,
  getAllConversations,
  getCurrentAgentId,
  getCurrentConversationId,
  getMemorySnapshot,
} from '@/lib/agent';
import { listSessions, getSessionStats } from '@/lib/clawCode/sessionStore';
import { loadLLMConfigFromStorage } from '@/lib/llmConfigUtils';

type TabId = 'chat' | 'clawcode' | 'memory' | 'api';

interface AgentSidebarProps {
  currentAgentId?: string;
  currentPhase?: string;
  completedPhases?: string[];
  onAgentSelect?: (agentId: string) => void;
  onPhaseSelect?: (phaseId: string) => void;
}

type WorkspaceMemoryState = {
  currentAgentName: string;
  currentPhaseName: string;
  completedPhaseCount: number;
  totalChatConversations: number;
  totalChatMessages: number;
  currentConversationTitle: string;
  latestConversationLabel: string;
  latestConversationExcerpt: string;
  shortTermCount: number;
  longTermCount: number;
  instinctCount: number;
  clawSessionCount: number;
  clawMessageCount: number;
  clawTokenCount: number;
  latestClawSessionId: string;
  latestClawUpdatedLabel: string;
  apiProviderLabel: string;
  apiModelLabel: string;
  apiReady: boolean;
};

function formatDateLabel(value?: string | number | Date | null) {
  if (!value) return '暂无';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '暂无';
  return date.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getProviderLabel(provider?: string) {
  switch (provider) {
    case 'openai':
      return 'OpenAI';
    case 'anthropic':
      return 'Anthropic';
    case 'deepseek':
      return 'DeepSeek';
    case 'minimax':
      return 'MiniMax';
    case 'custom':
      return '自定义';
    default:
      return '未配置';
  }
}

function truncateText(value?: string, maxLength: number = 80) {
  if (!value) return '暂无最近内容。';
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function buildWorkspaceMemoryState(
  currentAgentId?: string,
  currentPhase?: string,
  completedPhases: string[] = [],
): WorkspaceMemoryState {
  const agents = getAllAgents();
  const allConversations = getAllConversations();
  const storedAgentId = currentAgentId || getCurrentAgentId() || '';
  const currentAgent =
    agents.find((agent) => agent.id === storedAgentId) ?? agents[0] ?? null;

  const scopedConversations = currentAgent
    ? allConversations.filter((conversation) => conversation.agentId === currentAgent.id)
    : allConversations;
  const currentConversationId = getCurrentConversationId();
  const currentConversation =
    scopedConversations.find((conversation) => conversation.id === currentConversationId) ??
    scopedConversations[0] ??
    null;
  const latestConversation = [...scopedConversations].sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  )[0] ?? null;
  const latestMessage = latestConversation?.messages?.at(-1);
  const memorySnapshot = currentAgent
    ? getMemorySnapshot(currentAgent.id)
    : { shortTerm: [], longTerm: [], instinct: [] };

  const clawSessions = listSessions();
  const clawStats = getSessionStats();
  const latestClawSession = clawSessions[0] ?? null;

  let apiProviderLabel = '未配置';
  let apiModelLabel = '未配置';
  let apiReady = false;

  try {
    const config = loadLLMConfigFromStorage();
    apiProviderLabel = getProviderLabel(config.provider);
    apiModelLabel = config.model?.trim() || '未配置';
    apiReady = Boolean(config.apiKey?.trim());
  } catch {
    apiProviderLabel = '未配置';
    apiModelLabel = '未配置';
    apiReady = false;
  }

  return {
    currentAgentName: currentAgent?.name ?? '未选择',
    currentPhaseName: currentPhase || '未设置',
    completedPhaseCount: completedPhases.length,
    totalChatConversations: scopedConversations.length,
    totalChatMessages: scopedConversations.reduce(
      (sum, conversation) => sum + (conversation.messages?.length ?? 0),
      0,
    ),
    currentConversationTitle: currentConversation?.title || '暂无当前会话',
    latestConversationLabel: formatDateLabel(latestConversation?.updatedAt),
    latestConversationExcerpt: truncateText(latestMessage?.content),
    shortTermCount: memorySnapshot.shortTerm.length,
    longTermCount: memorySnapshot.longTerm.length,
    instinctCount: memorySnapshot.instinct.length,
    clawSessionCount: clawStats.total,
    clawMessageCount: clawStats.totalMessages,
    clawTokenCount: clawStats.totalTokens,
    latestClawSessionId: latestClawSession?.sessionId?.slice(0, 12) ?? '暂无',
    latestClawUpdatedLabel: formatDateLabel(latestClawSession?.updatedAt),
    apiProviderLabel,
    apiModelLabel,
    apiReady,
  };
}

const AgentSidebar: React.FC<AgentSidebarProps> = ({
  currentAgentId,
  currentPhase,
  completedPhases = [],
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('chat');
  const [collapsed, setCollapsed] = useState(false);
  const [returnTab, setReturnTab] = useState<TabId>('chat');
  const [memoryState, setMemoryState] = useState<WorkspaceMemoryState>(() =>
    buildWorkspaceMemoryState(currentAgentId, currentPhase, completedPhases),
  );

  const refreshMemoryState = () => {
    setMemoryState(buildWorkspaceMemoryState(currentAgentId, currentPhase, completedPhases));
  };

  useEffect(() => {
    refreshMemoryState();

    const intervalId = window.setInterval(refreshMemoryState, 1200);
    window.addEventListener('focus', refreshMemoryState);
    window.addEventListener('storage', refreshMemoryState);
    window.addEventListener('agent-api-config-updated', refreshMemoryState);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshMemoryState);
      window.removeEventListener('storage', refreshMemoryState);
      window.removeEventListener('agent-api-config-updated', refreshMemoryState);
    };
  }, [currentAgentId, currentPhase, completedPhases]);

  const openApiSettings = (sourceTab: TabId = activeTab) => {
    if (sourceTab !== 'api') {
      setReturnTab(sourceTab);
    }
    setActiveTab('api');
  };

  const tabs = useMemo(
    () => [
      {
        id: 'chat' as TabId,
        icon: <Bot size={16} />,
        label: '对话',
        summary: '智能体对话、新会话、历史会话与 Skills 入口',
      },
      {
        id: 'clawcode' as TabId,
        icon: <Terminal size={16} />,
        label: 'Claw Code',
        summary: '命令执行、工具编排与运行时监控',
      },
      {
        id: 'memory' as TabId,
        icon: <Brain size={16} />,
        label: '记忆',
        summary: '统一汇总对话、Claw Code 与阶段状态',
      },
      {
        id: 'api' as TabId,
        icon: <Settings size={16} />,
        label: 'API 设置',
        summary: '对话与 Claw Code 共用的真实模型入口',
      },
    ],
    [],
  );

  const activeTabMeta = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  const renderMemoryView = () => (
    <div className={styles.memoryView}>
      <div className={styles.memoryHero}>
        <div>
          <p className={styles.memoryKicker}>记忆面板</p>
          <h3>当前智能体状态总览</h3>
        </div>
        <span className={styles.memoryBadge}>Memory</span>
      </div>

      <div className={styles.memoryStats}>
        <div className={styles.memoryStat}>
          <span className={styles.statLabel}>当前智能体</span>
          <span className={styles.statValue}>{memoryState.currentAgentName}</span>
        </div>
        <div className={styles.memoryStat}>
          <span className={styles.statLabel}>当前阶段</span>
          <span className={styles.statValue}>{memoryState.currentPhaseName}</span>
        </div>
        <div className={styles.memoryStat}>
          <span className={styles.statLabel}>已完成阶段</span>
          <span className={styles.statValue}>{memoryState.completedPhaseCount}</span>
        </div>
        <div className={styles.memoryStat}>
          <span className={styles.statLabel}>对话会话</span>
          <span className={styles.statValue}>{memoryState.totalChatConversations}</span>
        </div>
        <div className={styles.memoryStat}>
          <span className={styles.statLabel}>Claw 会话</span>
          <span className={styles.statValue}>{memoryState.clawSessionCount}</span>
        </div>
        <div className={styles.memoryStat}>
          <span className={styles.statLabel}>共享 API</span>
          <span className={styles.statValue}>
            {memoryState.apiReady ? '已接通' : '未配置'}
          </span>
        </div>
      </div>

      <div className={styles.memoryTimeline}>
        <div className={styles.memoryBlock}>
          <strong>对话记忆</strong>
          <span>
            当前会话：{memoryState.currentConversationTitle}
            {'\n'}
            最近更新：{memoryState.latestConversationLabel}
            {'\n'}
            会话总数：{memoryState.totalChatConversations}，消息总数：
            {memoryState.totalChatMessages}
            {'\n'}
            最近内容：{memoryState.latestConversationExcerpt}
          </span>
        </div>

        <div className={styles.memoryBlock}>
          <strong>Claw Code 记忆</strong>
          <span>
            最新会话：{memoryState.latestClawSessionId}
            {'\n'}
            最近更新：{memoryState.latestClawUpdatedLabel}
            {'\n'}
            累计消息：{memoryState.clawMessageCount}
            {'\n'}
            累计 Token：{memoryState.clawTokenCount}
          </span>
        </div>

        <div className={styles.memoryBlock}>
          <strong>分层记忆</strong>
          <span>
            短期记忆：{memoryState.shortTermCount}
            {'\n'}
            长期记忆：{memoryState.longTermCount}
            {'\n'}
            本能记忆：{memoryState.instinctCount}
            {'\n'}
            对话和执行状态都会从这里统一回看。
          </span>
        </div>

        <div className={styles.memoryBlock}>
          <strong>共享 API</strong>
          <span>
            服务商：{memoryState.apiProviderLabel}
            {'\n'}
            模型：{memoryState.apiModelLabel}
            {'\n'}
            状态：{memoryState.apiReady ? '已可用' : '待补充密钥'}
            {'\n'}
            对话与 Claw Code 已经共用这一套配置。
          </span>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return <AgentChatPanel onOpenApiSettings={() => openApiSettings('chat')} />;
      case 'clawcode':
        return <ClawCodePanel onOpenApiSettings={() => openApiSettings('clawcode')} />;
      case 'memory':
        return renderMemoryView();
      case 'api':
        return <AgentApiSettingsPanel onSaved={() => setActiveTab(returnTab)} />;
      default:
        return null;
    }
  };

  if (collapsed) {
    return (
      <div className={styles.collapsed}>
        <div className={styles.collapsedTabs}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.collapsedTab} ${
                activeTab === tab.id ? styles.collapsedTabActive : ''
              }`}
              onClick={() => {
                setActiveTab(tab.id);
                setCollapsed(false);
              }}
              title={tab.label}
              type="button"
            >
              {tab.icon}
            </button>
          ))}
        </div>
        <button
          className={styles.expandBtn}
          onClick={() => setCollapsed(false)}
          title="展开"
          type="button"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className={styles.sidebar}>
      <div className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.heroKicker}>智能体中枢</p>
          <h2>{activeTabMeta.label}</h2>
          <span>{activeTabMeta.summary}</span>
        </div>
        <div className={styles.heroActions}>
          <span className={styles.heroStatus}>
            <Sparkles size={14} />
            通用助手运行中
          </span>
          <button
            className={styles.collapseBtn}
            onClick={() => setCollapsed(true)}
            title="收起"
            type="button"
          >
            <ChevronLeft size={14} />
          </button>
        </div>
      </div>

      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => {
              if (tab.id === 'api') {
                openApiSettings(activeTab);
                return;
              }
              setActiveTab(tab.id);
            }}
            type="button"
          >
            {tab.icon}
            <span className={styles.tabMain}>
              <strong>{tab.label}</strong>
              <small>{tab.summary}</small>
            </span>
          </button>
        ))}
      </div>

      <div className={styles.content}>
        <div className={styles.contentCard}>{renderContent()}</div>
      </div>
    </div>
  );
};

export default AgentSidebar;
