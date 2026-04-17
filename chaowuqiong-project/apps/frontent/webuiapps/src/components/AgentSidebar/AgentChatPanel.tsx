import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Bot, FileText, FolderOpen, MessageSquare, Pencil, Plus, Save, Send, Settings, Sparkles, Trash2, Upload, Wand2, Wrench, X } from 'lucide-react';
import styles from './AgentChatPanel.module.scss';
import type { Agent, Conversation, Message, Skill } from '@/lib/agent';
import { loadLLMConfigFromStorage } from '@/lib/llmConfigUtils';
import {
  createConversation,
  deleteAgent,
  deleteConversation,
  deleteSkill,
  executeAgentConversation,
  getAllAgents,
  getAllSkills,
  getConversationsByAgent,
  getCurrentAgentId,
  getCurrentConversationId,
  importAgentFromFolder,
  importAgentsFromRoot,
  importAgentFromText,
  initializeDefaultAgents,
  saveAgent,
  saveSkill,
  setCurrentAgentId,
  setCurrentConversationId,
} from '@/lib/agent';

interface AgentChatPanelProps {
  className?: string;
  onOpenApiSettings?: () => void;
}

type AgentView = 'chat' | 'agents' | 'skills' | 'import';

const TRAE_MAIN_ROOT = 'D:/网站部署/.trae/skills';
const TRAE_AGENT_PLUS_ROOT = 'D:/网站部署/Agent+Agent制造机/Agent阵法/.trae/skills';

const formatTime = (value?: string | number | Date) => {
  if (!value) return '--:--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

const formatDateTime = (value?: string | number | Date) => {
  if (!value) return '刚刚';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '刚刚';
  return date.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const createAgentDraft = (agent?: Agent): Agent => ({
  id: agent?.id ?? `agent_${Date.now()}`,
  name: agent?.name ?? '新智能体',
  description: agent?.description ?? '描述这个智能体擅长处理的任务。',
  type: agent?.type ?? 'custom',
  icon: agent?.icon ?? 'AI',
  color: agent?.color ?? '#5b8cff',
  config: {
    model: agent?.config?.model ?? 'gpt-4o',
    temperature: agent?.config?.temperature ?? 0.6,
    maxTokens: agent?.config?.maxTokens ?? 4000,
    systemPrompt: agent?.config?.systemPrompt ?? '',
    tools: agent?.config?.tools ?? [],
    workflow: agent?.config?.workflow,
    memory: agent?.config?.memory,
  },
  status: agent?.status ?? 'active',
  createdAt: agent?.createdAt ?? new Date(),
  updatedAt: agent?.updatedAt ?? new Date(),
  stats: agent?.stats ?? { totalConversations: 0, totalMessages: 0, avgResponseTime: 0, successRate: 1 },
  skillDoc: agent?.skillDoc,
  requirementDoc: agent?.requirementDoc,
  designDoc: agent?.designDoc,
  tasksDoc: agent?.tasksDoc,
  checklistDoc: agent?.checklistDoc,
});

const createSkillDraft = (skill?: Skill): Skill => ({
  id: skill?.id ?? `skill_${Date.now()}`,
  name: skill?.name ?? '新 Skill',
  description: skill?.description ?? '说明这个 Skill 的用途。',
  code: skill?.code ?? '',
  language: skill?.language ?? 'typescript',
  parameters: skill?.parameters ?? [],
  agentId: skill?.agentId,
  createdAt: skill?.createdAt ?? new Date(),
  updatedAt: skill?.updatedAt ?? new Date(),
});

export default function AgentChatPanel({ className, onOpenApiSettings }: AgentChatPanelProps) {
  const [activeView, setActiveView] = useState<AgentView>('chat');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [statusText, setStatusText] = useState('选择一个智能体开始对话。');
  const [isSending, setIsSending] = useState(false);
  const [draftAgent, setDraftAgent] = useState<Agent | null>(null);
  const [draftSkill, setDraftSkill] = useState<Skill | null>(null);
  const [importText, setImportText] = useState('');
  const [importPath, setImportPath] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const hydrateState = useCallback((preferredAgentId?: string | null, preferredConversationId?: string | null) => {
    const nextAgents = getAllAgents();
    const nextSkills = getAllSkills();
    const agentId = preferredAgentId ?? getCurrentAgentId();
    const nextAgent = nextAgents.find((item) => item.id === agentId) ?? nextAgents[0] ?? null;
    setAgents(nextAgents);
    setSkills(nextSkills);
    setCurrentAgent(nextAgent);
    if (!nextAgent) {
      setConversations([]);
      setCurrentConversation(null);
      setMessages([]);
      setCurrentAgentId(null);
      setCurrentConversationId(null);
      return;
    }
    setCurrentAgentId(nextAgent.id);
    const nextConversations = getConversationsByAgent(nextAgent.id).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    const conversationId = preferredConversationId ?? getCurrentConversationId();
    const nextConversation = nextConversations.find((item) => item.id === conversationId) ?? nextConversations[0] ?? null;
    setConversations(nextConversations);
    setCurrentConversation(nextConversation);
    setMessages(nextConversation?.messages ?? []);
    setCurrentConversationId(nextConversation?.id ?? null);
  }, []);

  useEffect(() => {
    initializeDefaultAgents();
    hydrateState();
  }, [hydrateState]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isSending]);

  const currentAgentSkills = useMemo(() => {
    if (!currentAgent) return [];
    return skills.filter((skill) => !skill.agentId || skill.agentId === currentAgent.id);
  }, [currentAgent, skills]);

  const openSharedApiSettings = useCallback((message?: string) => {
    if (message) setStatusText(message);
    onOpenApiSettings?.();
  }, [onOpenApiSettings]);

  const handleCreateConversation = () => {
    if (!currentAgent) {
      setActiveView('agents');
      setStatusText('请先创建或选择一个智能体。');
      return;
    }
    const nextConversation = createConversation(currentAgent.id, `与 ${currentAgent.name} 的新对话`);
    hydrateState(currentAgent.id, nextConversation.id);
    setStatusText('已创建新对话。');
  };

  const handleClearCurrentConversation = () => {
    if (!currentConversation) {
      setStatusText('当前没有可清除的会话。');
      return;
    }
    if (!window.confirm('确定清除当前会话吗？')) return;
    deleteConversation(currentConversation.id);
    hydrateState(currentAgent?.id ?? null, null);
    setStatusText('当前会话已清除。');
  };

  const handleSendMessage = async () => {
    const trimmedMessage = inputMessage.trim();
    if (!currentAgent || !trimmedMessage || isSending) return;
    try {
      const config = loadLLMConfigFromStorage();
      if (!config.apiKey?.trim()) {
        openSharedApiSettings('请先在共享 API 设置里完成模型配置。');
        return;
      }
    } catch {
      openSharedApiSettings('共享 API 配置读取失败，请先检查 API 设置。');
      return;
    }
    let targetConversation = currentConversation;
    if (!targetConversation) {
      targetConversation = createConversation(currentAgent.id, `与 ${currentAgent.name} 的新对话`);
      hydrateState(currentAgent.id, targetConversation.id);
    }
    setIsSending(true);
    setStatusText('正在生成回复...');
    try {
      const result = await executeAgentConversation(currentAgent.id, targetConversation.id, inputMessage.trim());
      if (!result.success) throw new Error(result.errors?.join('；') || '对话执行失败');
      setInputMessage('');
      hydrateState(currentAgent.id, targetConversation.id);
      setStatusText('回复已更新。');
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : '发送失败。');
    } finally {
      setIsSending(false);
    }
  };

  const saveDraftAgent = () => {
    if (!draftAgent) return;
    saveAgent({ ...draftAgent, updatedAt: new Date(), createdAt: draftAgent.createdAt ?? new Date() });
    hydrateState(draftAgent.id, currentConversation?.id ?? null);
    setDraftAgent(null);
    setStatusText('智能体已保存。');
  };

  const saveDraftSkill = () => {
    if (!draftSkill) return;
    saveSkill({ ...draftSkill, updatedAt: new Date(), createdAt: draftSkill.createdAt ?? new Date() });
    hydrateState(currentAgent?.id ?? null, currentConversation?.id ?? null);
    setDraftSkill(null);
    setStatusText('Skill 已保存。');
  };

  const importFromText = async () => {
    const result = importAgentFromText(importText);
    if (!result.success || !result.agent) {
      setStatusText(result.errors.join('；') || '文本导入失败。');
      return;
    }
    saveAgent(result.agent);
    hydrateState(result.agent.id, null);
    setImportText('');
    setActiveView('agents');
    setStatusText('文本导入成功。');
  };

  const importFromFolder = async () => {
    const result = await importAgentFromFolder(importPath.trim());
    if (!result.success || !result.agent) {
      setStatusText(result.errors.join('；') || '文件夹导入失败。');
      return;
    }
    saveAgent(result.agent);
    hydrateState(result.agent.id, null);
    setImportPath('');
    setActiveView('agents');
    setStatusText('文件夹导入成功。');
  };

  const importFromRoot = async (rootPath: string, label: string) => {
    const result = await importAgentsFromRoot(rootPath);
    result.agents.forEach((agent) => saveAgent(agent));
    hydrateState(currentAgent?.id ?? null, currentConversation?.id ?? null);
    setStatusText(`已从 ${label} 导入 ${result.agents.length} 个 Agent。`);
  };

  return (
    <div className={`${styles.panelRoot} ${className ?? ''}`}>
      <header className={styles.panelHeader}>
        <div>
          <p className={styles.kicker}>对话智能体</p>
          <h2>对话、会话、智能体、Skills</h2>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.summaryRow}>
            <div className={styles.summaryCard}><MessageSquare size={16} /><div><strong>{conversations.length}</strong><span>历史会话</span></div></div>
            <div className={styles.summaryCard}><Bot size={16} /><div><strong>{agents.length}</strong><span>智能体</span></div></div>
            <div className={styles.summaryCard}><Sparkles size={16} /><div><strong>{currentAgentSkills.length}</strong><span>当前 Skills</span></div></div>
          </div>
          <button type="button" className={styles.settingsButton} onClick={() => openSharedApiSettings('已打开共享 API 设置。')}><Settings size={14} />API 设置</button>
        </div>
      </header>

      <nav className={styles.tabBar}>
        {[
          ['chat', '对话', <MessageSquare size={15} />],
          ['agents', '智能体', <Bot size={15} />],
          ['skills', 'Skills', <Wrench size={15} />],
          ['import', '导入', <Upload size={15} />],
        ].map(([id, label, icon]) => (
          <button key={id} type="button" className={`${styles.tabButton} ${activeView === id ? styles.tabButtonActive : ''}`} onClick={() => setActiveView(id as AgentView)}>
            {icon}{label}
          </button>
        ))}
      </nav>

      <section className={styles.contentArea}>
        {activeView === 'chat' ? (
          <div className={styles.chatView}>
            <aside className={styles.chatSidebar}>
              <div className={styles.sideSection}>
                <div className={styles.sectionHeader}><span>当前智能体</span><button type="button" onClick={() => setActiveView('agents')}>管理</button></div>
                {currentAgent ? <div className={styles.agentHero} style={{ '--agent-color': currentAgent.color ?? '#5b8cff' } as React.CSSProperties}><div className={styles.agentHeroIcon}>{currentAgent.icon || 'AI'}</div><div><h3>{currentAgent.name}</h3><p>{currentAgent.description}</p></div></div> : <div className={styles.emptyCard}>还没有可用智能体。</div>}
              </div>
              <div className={styles.sideSection}>
                <div className={styles.sectionHeader}><span>会话操作</span><button type="button" onClick={handleCreateConversation}><Plus size={14} />新增对话</button></div>
                <div className={styles.cardActions}><button type="button" className={styles.primaryButton} onClick={handleClearCurrentConversation}>清除当前会话</button></div>
              </div>
              <div className={styles.sideSection}>
                <div className={styles.sectionHeader}><span>历史会话</span></div>
                <div className={styles.conversationList}>
                  {conversations.length === 0 ? <div className={styles.emptyCard}>还没有历史会话。</div> : null}
                  {conversations.map((conversation) => (
                    <button key={conversation.id} type="button" className={`${styles.conversationCard} ${currentConversation?.id === conversation.id ? styles.conversationCardActive : ''}`} onClick={() => hydrateState(currentAgent?.id ?? null, conversation.id)}>
                      <div className={styles.conversationTitleRow}><strong>{conversation.title || '未命名会话'}</strong><span>{formatDateTime(conversation.updatedAt)}</span></div>
                      <p>{conversation.messages.at(-1)?.content || '暂无消息'}</p>
                      <div className={styles.conversationFooter}><span>{conversation.messages.length} 条消息</span><span className={styles.inlineDanger} onClick={(event) => { event.stopPropagation(); deleteConversation(conversation.id); hydrateState(currentAgent?.id ?? null, null); }}>删除</span></div>
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            <section className={styles.chatStage}>
              <div className={styles.stageHeader}><div><p className={styles.kicker}>对话面板</p><h3>{currentConversation?.title || '开始新对话'}</h3></div></div>
              <div className={styles.messageList}>
                {messages.length === 0 ? <div className={styles.emptyStage}><Bot size={24} /><p>输入消息开始对话。对话历史和当前会话都会统一沉淀到记忆面板里汇总展示。</p></div> : null}
                {messages.map((message) => <article key={message.id} className={`${styles.messageCard} ${styles[message.role] ?? styles.system}`}><div className={styles.messageMeta}><span>{message.role === 'user' ? '你' : message.role === 'assistant' ? currentAgent?.name ?? '智能体' : '系统'}</span><span>{formatTime(message.timestamp)}</span></div><div className={styles.messageBody}>{message.content}</div></article>)}
                <div ref={messagesEndRef} />
              </div>
              <div className={styles.composer}>
                <textarea value={inputMessage} onChange={(event) => setInputMessage(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void handleSendMessage(); } }} rows={4} placeholder="输入消息，回车发送，Shift + 回车换行。" />
                <div className={styles.composerActions}><span>{statusText}</span><button type="button" className={styles.primaryButton} disabled={isSending || !inputMessage.trim()} onClick={() => void handleSendMessage()}><Send size={14} />发送</button></div>
              </div>
            </section>
          </div>
        ) : null}

        {activeView === 'agents' ? (
          <div className={styles.managementView}><div className={styles.managementGrid}><section className={styles.managementColumn}><div className={styles.sectionHeader}><span>智能体列表</span><button type="button" onClick={() => setDraftAgent(createAgentDraft())}><Plus size={14} />新建</button></div><div className={styles.cardGrid}>{agents.map((agent) => <article key={agent.id} className={`${styles.managementCard} ${currentAgent?.id === agent.id ? styles.managementCardActive : ''}`}><div className={styles.managementCardHeader}><strong>{agent.name}</strong><div className={styles.cardActions}><button type="button" onClick={() => hydrateState(agent.id, null)}>打开</button><button type="button" onClick={() => setDraftAgent(createAgentDraft(agent))}><Pencil size={14} /></button><button type="button" className={styles.dangerButton} onClick={() => { deleteAgent(agent.id); hydrateState(null, null); }}> <Trash2 size={14} /></button></div></div><p>{agent.description}</p></article>)}</div></section><section className={styles.editorColumn}><div className={styles.editorCard}><div className={styles.sectionHeader}><span>{draftAgent ? '编辑智能体' : '智能体说明'}</span>{draftAgent ? <button type="button" onClick={() => setDraftAgent(null)}><X size={14} />关闭</button> : null}</div>{draftAgent ? <div className={styles.formStack}><label>名称<input value={draftAgent.name} onChange={(event) => setDraftAgent({ ...draftAgent, name: event.target.value })} /></label><label>描述<textarea value={draftAgent.description} onChange={(event) => setDraftAgent({ ...draftAgent, description: event.target.value })} rows={3} /></label><label>模型<input value={draftAgent.config.model} onChange={(event) => setDraftAgent({ ...draftAgent, config: { ...draftAgent.config, model: event.target.value } })} /></label><label>System Prompt<textarea value={draftAgent.config.systemPrompt} onChange={(event) => setDraftAgent({ ...draftAgent, config: { ...draftAgent.config, systemPrompt: event.target.value } })} rows={8} /></label><div className={styles.formActions}><button type="button" className={styles.primaryButton} onClick={saveDraftAgent}><Save size={14} />保存智能体</button></div></div> : <div className={styles.infoBlock}><p>智能体负责角色、模型和提示词。共享 API 设置不在这里重复维护。</p></div>}</div></section></div></div>
        ) : null}

        {activeView === 'skills' ? (
          <div className={styles.managementView}><div className={styles.managementGrid}><section className={styles.managementColumn}><div className={styles.sectionHeader}><span>Skills 列表</span><button type="button" onClick={() => setDraftSkill(createSkillDraft())}><Plus size={14} />新建</button></div><div className={styles.cardGrid}>{skills.map((skill) => <article key={skill.id} className={styles.managementCard}><div className={styles.managementCardHeader}><div className={styles.skillTitle}><Wand2 size={16} /><div><strong>{skill.name}</strong><small>{skill.language}</small></div></div><div className={styles.cardActions}><button type="button" onClick={() => setDraftSkill(createSkillDraft(skill))}><Pencil size={14} /></button><button type="button" className={styles.dangerButton} onClick={() => { deleteSkill(skill.id); hydrateState(currentAgent?.id ?? null, currentConversation?.id ?? null); }}><Trash2 size={14} /></button></div></div><p>{skill.description}</p></article>)}</div></section><section className={styles.editorColumn}><div className={styles.editorCard}><div className={styles.sectionHeader}><span>{draftSkill ? '编辑 Skill' : 'Skill 说明'}</span>{draftSkill ? <button type="button" onClick={() => setDraftSkill(null)}><X size={14} />关闭</button> : null}</div>{draftSkill ? <div className={styles.formStack}><label>名称<input value={draftSkill.name} onChange={(event) => setDraftSkill({ ...draftSkill, name: event.target.value })} /></label><label>描述<textarea value={draftSkill.description} onChange={(event) => setDraftSkill({ ...draftSkill, description: event.target.value })} rows={3} /></label><label>代码<textarea value={draftSkill.code} onChange={(event) => setDraftSkill({ ...draftSkill, code: event.target.value })} rows={12} className={styles.codeField} /></label><div className={styles.formActions}><button type="button" className={styles.primaryButton} onClick={saveDraftSkill}><Save size={14} />保存 Skill</button></div></div> : <div className={styles.infoBlock}><p>Skill 适合放可复用的 Prompt、流程片段和工具说明。</p></div>}</div></section></div></div>
        ) : null}

        {activeView === 'import' ? (
          <div className={styles.importView}>
            <section className={styles.importCard}><div className={styles.sectionHeader}><span><FileText size={16} />文本导入</span></div><p>支持直接粘贴 Agent 文本或 Skill 文档。</p><textarea value={importText} onChange={(event) => setImportText(event.target.value)} rows={12} placeholder="把 Agent 文本粘贴到这里。" /><button type="button" className={styles.primaryButton} onClick={() => void importFromText()}><Upload size={14} />导入文本</button><div className={styles.cardActions}><button type="button" className={styles.secondaryButton} onClick={() => void importFromRoot(TRAE_MAIN_ROOT, 'Trae 主库')}>导入 Trae 主库</button><button type="button" className={styles.secondaryButton} onClick={() => void importFromRoot(TRAE_AGENT_PLUS_ROOT, 'Agent+Agent')}>导入 Agent+Agent</button></div></section>
            <section className={styles.importCard}><div className={styles.sectionHeader}><span><FolderOpen size={16} />文件夹导入</span></div><p>适合本地 Agent 目录。</p><input value={importPath} onChange={(event) => setImportPath(event.target.value)} placeholder="例如：D:\\AgentLibrary\\writer-agent" /><button type="button" className={styles.primaryButton} onClick={() => void importFromFolder()}><Upload size={14} />导入文件夹</button></section>
          </div>
        ) : null}
      </section>
    </div>
  );
}
