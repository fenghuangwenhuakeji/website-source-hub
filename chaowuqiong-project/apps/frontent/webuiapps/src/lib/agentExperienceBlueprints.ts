import type { ExperienceProfileId } from '@/types/desktopApp';

export type ExperienceLifecycleStage =
  | 'boot'
  | 'understand'
  | 'interact'
  | 'execute'
  | 'inspect'
  | 'improve'
  | 'update'
  | 'standby';

export interface ExperienceProfile {
  id: ExperienceProfileId;
  label: string;
  summary: string;
  mission: string;
  tone: string;
  activationKeywords: string[];
  memoryLayers: string[];
  lifecycle: ExperienceLifecycleStage[];
  orchestration: string[];
  uiFocus: string[];
  defaultSystemPrompt: string;
  highlights: string[];
}

export const DEFAULT_EXPERIENCE_LIFECYCLE: ExperienceLifecycleStage[] = [
  'boot',
  'understand',
  'interact',
  'execute',
  'inspect',
  'improve',
  'update',
  'standby',
];

export const EXPERIENCE_PROFILES: Record<ExperienceProfileId, ExperienceProfile> = {
  chat: {
    id: 'chat',
    label: 'Chat',
    summary: 'Unified conversational workspace with multi-turn context and relationship memory.',
    mission: 'Handle daily conversation, roleplay, and message flow across tools.',
    tone: 'Warm, steady, and context-aware.',
    activationKeywords: ['chat', 'conversation', 'message', 'roleplay', 'context', 'companion'],
    memoryLayers: ['working-memory', 'session-memory', 'relationship-memory'],
    lifecycle: DEFAULT_EXPERIENCE_LIFECYCLE,
    orchestration: ['single-turn reply', 'context carry-over', 'cross-app message bridge'],
    uiFocus: ['message stream', 'session history', 'persona state', 'reply suggestions'],
    defaultSystemPrompt:
      'You are operating in the chat experience layer. Preserve continuity, persona stability, and smooth multi-turn conversation.',
    highlights: [
      'Keep conversation continuity and relationship memory intact.',
      'Make every reply feel naturally connected to the previous turn.',
      'Treat persona state, tool output, and message history as one shared context.',
    ],
  },
  agent: {
    id: 'agent',
    label: 'Agent',
    summary: 'Mission-driven workspace with identity, memory, lifecycle, and multi-agent orchestration.',
    mission: 'Coordinate agent identity, task routing, execution, review, and handoff.',
    tone: 'Clear, reliable, and execution-oriented.',
    activationKeywords: ['agent', 'task', 'orchestrate', 'handoff', 'workflow', 'delegate'],
    memoryLayers: ['working-memory', 'long-term-memory', 'skill-memory', 'handoff-memory'],
    lifecycle: DEFAULT_EXPERIENCE_LIFECYCLE,
    orchestration: ['single agent execution', 'multi-agent delegation', 'phase review'],
    uiFocus: ['identity panel', 'skill docs', 'task graph', 'status transitions'],
    defaultSystemPrompt:
      'You are operating in the agent experience layer. Make identity, scope, lifecycle, and delegation explicit and traceable.',
    highlights: [
      'Every agent should have a clear role, mission, and operating boundary.',
      'Execution should leave reusable memory and review evidence behind.',
      'Multi-agent collaboration should emphasize explicit ownership and traceable handoff.',
    ],
  },
  'code-edit': {
    id: 'code-edit',
    label: 'Code Edit',
    summary: 'Engineering workspace for reading, editing, debugging, reviewing, and verifying code.',
    mission: 'Connect code context, tools, commands, and review feedback into one execution loop.',
    tone: 'Precise, verifiable, and engineering-first.',
    activationKeywords: ['code', 'editor', 'debug', 'review', 'terminal', 'patch'],
    memoryLayers: ['working-memory', 'repo-memory', 'error-memory'],
    lifecycle: DEFAULT_EXPERIENCE_LIFECYCLE,
    orchestration: ['tool routing', 'command execution', 'review loop', 'result write-back'],
    uiFocus: ['file context', 'terminal panel', 'tool output', 'code reply'],
    defaultSystemPrompt:
      'You are operating in the code-edit experience layer. Prioritize repository context, command safety, and verifiable changes.',
    highlights: [
      'Treat the active file, selected code, and command history as first-class context.',
      'Prefer actionable and testable code changes over abstract discussion.',
      'Keep a clear chain between tools, edits, and the final explanation.',
    ],
  },
  writing: {
    id: 'writing',
    label: 'Writing',
    summary: 'Project-centered writing workspace spanning outline, chapters, roles, settings, and creative feedback.',
    mission: 'Support continuous writing with structured memory, stage-aware guidance, and reusable project context.',
    tone: 'Immersive, coherent, and creator-focused.',
    activationKeywords: ['writing', 'novel', 'chapter', 'outline', 'character', 'scene'],
    memoryLayers: ['project-memory', 'character-memory', 'setting-memory', 'chapter-memory'],
    lifecycle: DEFAULT_EXPERIENCE_LIFECYCLE,
    orchestration: ['outline review', 'chapter drafting', 'reference recall', 'creative feedback'],
    uiFocus: ['project overview', 'chapter canvas', 'reference shelf', 'creative suggestions'],
    defaultSystemPrompt:
      'You are operating in the writing experience layer. Keep outline, settings, characters, chapter progress, and creative guidance aligned.',
    highlights: [
      'Creative guidance should stay aligned with the current project stage and story world.',
      'Chapter editing should preserve continuity and progression state.',
      'Reference material should feed back into later chapters and scene planning.',
    ],
  },
  fenghuang: {
    id: 'fenghuang',
    label: 'Fenghuang',
    summary: 'Unified gateway for the Fenghuang creative suite, early bundles, and cross-app capability mapping.',
    mission: 'Turn scattered Fenghuang entry points into one coherent, upgrade-ready experience layer.',
    tone: 'Platform-oriented, curated, and integrative.',
    activationKeywords: ['fenghuang', 'phoenix', 'suite', 'creative hub', 'entry', 'upgrade'],
    memoryLayers: ['project-memory', 'entry-memory', 'version-memory'],
    lifecycle: DEFAULT_EXPERIENCE_LIFECYCLE,
    orchestration: ['entry aggregation', 'capability mapping', 'version bridge', 'cross-app launch'],
    uiFocus: ['entry navigation', 'capability map', 'version notes', 'suite coherence'],
    defaultSystemPrompt:
      'You are operating in the Fenghuang experience layer. Present multiple capabilities as one cohesive suite with explicit role boundaries.',
    highlights: [
      'Upgrade legacy Fenghuang bundles into clear, modern capability entry points.',
      'Keep descriptions, routing, and suite positioning consistent across versions.',
      'Leave room for future links into agent, writing, chat, and code workflows.',
    ],
  },
};

export function getExperienceProfile(
  profileId?: ExperienceProfileId | null,
): ExperienceProfile | null {
  if (!profileId) return null;
  return EXPERIENCE_PROFILES[profileId] ?? null;
}

export function getExperienceSummary(profileId?: ExperienceProfileId | null): string {
  return getExperienceProfile(profileId)?.summary ?? '';
}

export function getExperienceHighlights(profileId?: ExperienceProfileId | null): string[] {
  return getExperienceProfile(profileId)?.highlights ?? [];
}

export function buildExperienceSystemPrompt(
  profileId: ExperienceProfileId,
  extraInstruction?: string,
): string {
  const profile = EXPERIENCE_PROFILES[profileId];
  const sections = [
    `Current experience layer: ${profile.label}`,
    `Mission: ${profile.mission}`,
    `Tone: ${profile.tone}`,
    `Activation keywords: ${profile.activationKeywords.join(', ')}`,
    `Memory layers: ${profile.memoryLayers.join(', ')}`,
    `Lifecycle: ${profile.lifecycle.join(' -> ')}`,
    `Orchestration focus: ${profile.orchestration.join(', ')}`,
    `UI focus: ${profile.uiFocus.join(', ')}`,
    profile.defaultSystemPrompt,
    extraInstruction?.trim() || '',
  ].filter(Boolean);

  return sections.join('\n');
}
