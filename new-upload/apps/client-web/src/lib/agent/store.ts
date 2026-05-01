import {
  buildExperienceSystemPrompt,
  DEFAULT_EXPERIENCE_LIFECYCLE,
} from '../agentExperienceBlueprints';
import type { Agent, Conversation, Skill, Message, MemorySnapshot } from './types';
import { getUserScopedStorageKey } from '../userScopedStorage';

const STORAGE_KEYS = {
  AGENTS: 'openroom_agents',
  CONVERSATIONS: 'openroom_conversations',
  SKILLS: 'openroom_skills',
  MEMORY: 'openroom_memory',
  CURRENT_AGENT: 'openroom_current_agent',
  CURRENT_CONVERSATION: 'openroom_current_conversation',
};

const scopedKey = (key: string) => getUserScopedStorageKey(key);

export function getAllAgents(): Agent[] {
  try {
    const data = localStorage.getItem(scopedKey(STORAGE_KEYS.AGENTS)) ?? localStorage.getItem(STORAGE_KEYS.AGENTS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getAgentById(id: string): Agent | null {
  const agents = getAllAgents();
  return agents.find((agent) => agent.id === id) || null;
}

export function saveAgent(agent: Agent): void {
  const agents = getAllAgents();
  const index = agents.findIndex((item) => item.id === agent.id);

  if (index >= 0) {
    agents[index] = { ...agent, updatedAt: new Date() };
  } else {
    agents.push(agent);
  }

  localStorage.setItem(scopedKey(STORAGE_KEYS.AGENTS), JSON.stringify(agents));
}

export function deleteAgent(id: string): void {
  const agents = getAllAgents().filter((agent) => agent.id !== id);
  localStorage.setItem(scopedKey(STORAGE_KEYS.AGENTS), JSON.stringify(agents));

  const conversations = getAllConversations().filter((conversation) => conversation.agentId !== id);
  localStorage.setItem(scopedKey(STORAGE_KEYS.CONVERSATIONS), JSON.stringify(conversations));
}

export function updateAgentConfig(id: string, config: Partial<Agent['config']>): void {
  const agent = getAgentById(id);
  if (!agent) return;

  agent.config = { ...agent.config, ...config };
  saveAgent(agent);
}

export function getAllConversations(): Conversation[] {
  try {
    const data =
      localStorage.getItem(scopedKey(STORAGE_KEYS.CONVERSATIONS)) ??
      localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getConversationsByAgent(agentId: string): Conversation[] {
  return getAllConversations().filter((conversation) => conversation.agentId === agentId);
}

export function getConversationById(id: string): Conversation | null {
  const conversations = getAllConversations();
  return conversations.find((conversation) => conversation.id === id) || null;
}

export function createConversation(agentId: string, title?: string): Conversation {
  const agent = getAgentById(agentId);
  const conversation: Conversation = {
    id: `conv_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    agentId,
    title: title || `Conversation with ${agent?.name || 'Agent'}`,
    messages: [],
    status: 'active',
    context: {
      variables: {},
      lastLifecycleStage: DEFAULT_EXPERIENCE_LIFECYCLE[0],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  saveConversation(conversation);
  return conversation;
}

export function saveConversation(conversation: Conversation): void {
  const conversations = getAllConversations();
  const index = conversations.findIndex((item) => item.id === conversation.id);

  if (index >= 0) {
    conversations[index] = { ...conversation, updatedAt: new Date() };
  } else {
    conversations.push(conversation);
  }

  localStorage.setItem(scopedKey(STORAGE_KEYS.CONVERSATIONS), JSON.stringify(conversations));
}

export function deleteConversation(id: string): void {
  const conversations = getAllConversations().filter((conversation) => conversation.id !== id);
  localStorage.setItem(scopedKey(STORAGE_KEYS.CONVERSATIONS), JSON.stringify(conversations));
}

export function addMessage(conversationId: string, message: Message): void {
  const conversation = getConversationById(conversationId);
  if (!conversation) return;

  conversation.messages.push(message);
  conversation.updatedAt = new Date();
  saveConversation(conversation);
}

export function getAllSkills(): Skill[] {
  try {
    const data = localStorage.getItem(scopedKey(STORAGE_KEYS.SKILLS)) ?? localStorage.getItem(STORAGE_KEYS.SKILLS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getSkillsByAgent(agentId: string): Skill[] {
  return getAllSkills().filter((skill) => skill.agentId === agentId);
}

export function getSkillById(id: string): Skill | null {
  const skills = getAllSkills();
  return skills.find((skill) => skill.id === id) || null;
}

export function saveSkill(skill: Skill): void {
  const skills = getAllSkills();
  const index = skills.findIndex((item) => item.id === skill.id);

  if (index >= 0) {
    skills[index] = { ...skill, updatedAt: new Date() };
  } else {
    skills.push(skill);
  }

  localStorage.setItem(scopedKey(STORAGE_KEYS.SKILLS), JSON.stringify(skills));
}

export function deleteSkill(id: string): void {
  const skills = getAllSkills().filter((skill) => skill.id !== id);
  localStorage.setItem(scopedKey(STORAGE_KEYS.SKILLS), JSON.stringify(skills));
}

export function getMemorySnapshot(agentId: string): MemorySnapshot {
  try {
    const key = scopedKey(`${STORAGE_KEYS.MEMORY}_${agentId}`);
    const data = localStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }
  } catch {
    // ignore
  }

  return {
    shortTerm: [],
    longTerm: [],
    instinct: [],
  };
}

export function saveMemorySnapshot(agentId: string, snapshot: MemorySnapshot): void {
  const key = scopedKey(`${STORAGE_KEYS.MEMORY}_${agentId}`);
  localStorage.setItem(key, JSON.stringify(snapshot));
}

export function getCurrentAgentId(): string | null {
  return localStorage.getItem(scopedKey(STORAGE_KEYS.CURRENT_AGENT));
}

export function setCurrentAgentId(id: string | null): void {
  if (id) {
    localStorage.setItem(scopedKey(STORAGE_KEYS.CURRENT_AGENT), id);
  } else {
    localStorage.removeItem(scopedKey(STORAGE_KEYS.CURRENT_AGENT));
  }
}

export function getCurrentConversationId(): string | null {
  return localStorage.getItem(scopedKey(STORAGE_KEYS.CURRENT_CONVERSATION));
}

export function setCurrentConversationId(id: string | null): void {
  if (id) {
    localStorage.setItem(scopedKey(STORAGE_KEYS.CURRENT_CONVERSATION), id);
  } else {
    localStorage.removeItem(scopedKey(STORAGE_KEYS.CURRENT_CONVERSATION));
  }
}

export function initializeDefaultAgents(): void {
  const existingAgents = getAllAgents();
  if (existingAgents.length > 0) return;

  const defaultLifecycle = [...DEFAULT_EXPERIENCE_LIFECYCLE];

  const defaultAgents: Agent[] = [
    {
      id: 'agent_default_assistant',
      name: '通用助手',
      description: '全能型 AI 助手，可用于日常沟通、问答和轻量任务推进。',
      type: 'custom',
      icon: 'assistant',
      color: '#607D8B',
      config: {
        model: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 4000,
        systemPrompt: buildExperienceSystemPrompt(
          'chat',
          'Act as the default assistant. Keep replies grounded, helpful, and conversational while preserving multi-turn continuity.',
        ),
        tools: ['terminal', 'file', 'browser'],
        experienceProfileId: 'chat',
        identity: {
          role: 'default assistant',
          mission: 'Handle general conversation and lightweight task assistance.',
          tone: 'calm, helpful, and context-aware',
        },
        activationKeywords: ['chat', 'conversation', 'message', 'help'],
        lifecycle: defaultLifecycle,
        memory: {
          enabled: true,
          shortTermCapacity: 36,
          longTermEnabled: true,
          instinctEnabled: false,
          memoryTags: ['chat', 'continuity', 'default-assistant'],
        },
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      stats: {
        totalConversations: 0,
        totalMessages: 0,
        avgResponseTime: 0,
        successRate: 1,
      },
    },
    {
      id: 'agent_code_helper',
      name: '代码助手',
      description: '工程向编码助手，擅长实现、修复、调试和代码审查。',
      type: 'skill',
      icon: 'code',
      color: '#4CAF50',
      config: {
        model: 'gpt-4o',
        temperature: 0.3,
        maxTokens: 4000,
        systemPrompt: buildExperienceSystemPrompt(
          'code-edit',
          'Act as the coding specialist. Prefer concrete patches, explicit tradeoffs, and verifiable engineering guidance.',
        ),
        tools: ['terminal', 'file'],
        experienceProfileId: 'code-edit',
        identity: {
          role: 'code helper',
          mission: 'Write, fix, and improve code with clear repository-aware reasoning.',
          tone: 'precise, pragmatic, and implementation-focused',
        },
        activationKeywords: ['code', 'editor', 'debug', 'review', 'patch'],
        lifecycle: defaultLifecycle,
        memory: {
          enabled: true,
          shortTermCapacity: 28,
          longTermEnabled: true,
          instinctEnabled: true,
          memoryTags: ['code', 'repo', 'error-patterns'],
        },
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      stats: {
        totalConversations: 0,
        totalMessages: 0,
        avgResponseTime: 0,
        successRate: 1,
      },
    },
    {
      id: 'agent_debug_expert',
      name: '调试专家',
      description: '根因定位与修复规划助手，偏重证据、链路和可验证结果。',
      type: 'debug',
      icon: 'bug',
      color: '#f44336',
      config: {
        model: 'gpt-4o',
        temperature: 0.2,
        maxTokens: 4000,
        systemPrompt: buildExperienceSystemPrompt(
          'agent',
          'Act as the debugging specialist. Focus on root-cause analysis, evidence, and structured remediation steps.',
        ),
        tools: ['terminal', 'file'],
        experienceProfileId: 'agent',
        identity: {
          role: 'debug expert',
          mission: 'Diagnose failures, surface root causes, and produce repair plans with evidence.',
          tone: 'systematic, direct, and evidence-driven',
        },
        activationKeywords: ['debug', 'trace', 'root-cause', 'repair'],
        lifecycle: defaultLifecycle,
        memory: {
          enabled: true,
          shortTermCapacity: 24,
          longTermEnabled: true,
          instinctEnabled: true,
          memoryTags: ['debug', 'root-cause', 'handoff'],
        },
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      stats: {
        totalConversations: 0,
        totalMessages: 0,
        avgResponseTime: 0,
        successRate: 1,
      },
    },
  ];

  defaultAgents.forEach((agent) => saveAgent(agent));
}
