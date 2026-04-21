/**
 * Agent 对话系统 - 统一导出
 */

// 类型
export type {
  Agent,
  AgentConfig,
  AgentStats,
  AgentType,
  AgentImportResult,
  AgentBulkImportResult,
  AgentExecutionResult,
  Conversation,
  ConversationContext,
  Message,
  MessageMetadata,
  ToolCall,
  Skill,
  SkillParameter,
  WorkflowConfig,
  WorkflowStep,
  WorkflowState,
  MemoryConfig,
  MemorySnapshot,
  ShortTermMemory,
  LongTermMemory,
  InstinctMemory,
} from './types';

// 解析器
export {
  parseSkillDoc,
  parseRequirementDoc,
  parseDesignDoc,
  parseTasksDoc,
  parseChecklistDoc,
  importAgentFromFolder,
  importAgentsFromRoot,
  importAgentFromText,
} from './parser';

// 存储
export {
  getAllAgents,
  getAgentById,
  saveAgent,
  deleteAgent,
  updateAgentConfig,
  getAllConversations,
  getConversationsByAgent,
  getConversationById,
  createConversation,
  saveConversation,
  deleteConversation,
  addMessage,
  getAllSkills,
  getSkillsByAgent,
  getSkillById,
  saveSkill,
  deleteSkill,
  getMemorySnapshot,
  saveMemorySnapshot,
  getCurrentAgentId,
  setCurrentAgentId,
  getCurrentConversationId,
  setCurrentConversationId,
  initializeDefaultAgents,
} from './store';

// 引擎
export {
  executeAgentConversation,
  executeWorkflow,
  getMemoryContext,
  availableTools,
} from './engine';
