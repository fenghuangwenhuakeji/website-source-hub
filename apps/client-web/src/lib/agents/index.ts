/**
 * Agent System - Unified Exports
 * Integrates: Agency Agents, Auto-Claude, Everything Claude, OpenCode, Moltbot, claude-code
 */

export * from './types';
export { AgentEngine, agentEngine } from './engine';
export { NexusEngine, nexusEngine, NEXUS_WORKFLOW, NEXUS_PHASES } from './nexus';
export { HookEngine, hookEngine } from './hooks';
export { PermissionManager, permissionManager } from './permissions';
export { SkillManager, skillManager } from './skills';
export { MemoryManager, memoryManager } from './memory';
export { BUILT_IN_AGENTS, getAgentById, getAgentsByMode } from './builtins';

import { agentEngine } from './engine';
import { BUILT_IN_AGENTS } from './builtins';

agentEngine.registerAgent(BUILT_IN_AGENTS[0]);
agentEngine.registerAgent(BUILT_IN_AGENTS[1]);
agentEngine.registerAgent(BUILT_IN_AGENTS[2]);
agentEngine.registerAgent(BUILT_IN_AGENTS[3]);
agentEngine.registerAgent(BUILT_IN_AGENTS[4]);
agentEngine.registerAgent(BUILT_IN_AGENTS[5]);
agentEngine.registerAgent(BUILT_IN_AGENTS[6]);
agentEngine.registerAgent(BUILT_IN_AGENTS[7]);

export const AGENT_SYSTEM_READY = true;
