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
    label: '对话',
    summary: '统一的对话工作区，支持多轮上下文与关系记忆。',
    mission: '承接日常对话、角色扮演，以及跨工具的消息流转。',
    tone: '温暖、稳定、理解上下文。',
    activationKeywords: ['chat', 'conversation', 'message', 'roleplay', 'context', 'companion'],
    memoryLayers: ['working-memory', 'session-memory', 'relationship-memory'],
    lifecycle: DEFAULT_EXPERIENCE_LIFECYCLE,
    orchestration: ['单轮回复', '上下文延续', '跨应用消息桥接'],
    uiFocus: ['消息流', '会话历史', '角色状态', '回复建议'],
    defaultSystemPrompt:
      '你正在对话体验层中运行。请保持上下文连续、角色稳定，并让多轮对话自然顺滑。',
    highlights: [
      '保持对话连续性与关系记忆。',
      '让每次回复都自然承接上一轮。',
      '把角色状态、工具输出和消息历史视为同一个共享上下文。',
    ],
  },
  agent: {
    id: 'agent',
    label: '智能体',
    summary: '任务驱动的工作区，包含身份、记忆、生命周期和多智能体协作。',
    mission: '协调智能体身份、任务路由、执行、复核和交接。',
    tone: '清晰、可靠、重执行。',
    activationKeywords: ['agent', 'task', 'orchestrate', 'handoff', 'workflow', 'delegate'],
    memoryLayers: ['working-memory', 'long-term-memory', 'skill-memory', 'handoff-memory'],
    lifecycle: DEFAULT_EXPERIENCE_LIFECYCLE,
    orchestration: ['单智能体执行', '多智能体分工', '阶段复核'],
    uiFocus: ['身份面板', '技能文档', '任务图谱', '状态流转'],
    defaultSystemPrompt:
      '你正在智能体体验层中运行。请让身份、范围、生命周期和分工都清晰且可追踪。',
    highlights: [
      '每个智能体都应该有清晰角色、任务和工作边界。',
      '执行过程应该留下可复用记忆和可复核证据。',
      '多智能体协作应强调明确负责人和可追踪交接。',
    ],
  },
  'code-edit': {
    id: 'code-edit',
    label: '代码编辑',
    summary: '面向代码阅读、编辑、调试、审查和验证的工程工作区。',
    mission: '把代码上下文、工具、命令和审查反馈连接成一个执行闭环。',
    tone: '精确、可验证、工程优先。',
    activationKeywords: ['code', 'editor', 'debug', 'review', 'terminal', 'patch'],
    memoryLayers: ['working-memory', 'repo-memory', 'error-memory'],
    lifecycle: DEFAULT_EXPERIENCE_LIFECYCLE,
    orchestration: ['工具路由', '命令执行', '审查闭环', '结果回写'],
    uiFocus: ['文件上下文', '终端面板', '工具输出', '代码回复'],
    defaultSystemPrompt:
      '你正在代码编辑体验层中运行。请优先考虑仓库上下文、命令安全和可验证修改。',
    highlights: [
      '把当前文件、选中代码和命令历史作为一级上下文。',
      '优先给出可执行、可测试的代码改动，而不是抽象讨论。',
      '保持工具、编辑和最终解释之间的清晰链路。',
    ],
  },
  writing: {
    id: 'writing',
    label: '写作',
    summary: '以项目为中心的写作工作区，覆盖大纲、章节、角色、设定和创作反馈。',
    mission: '通过结构化记忆、阶段感知指导和可复用项目上下文，支持连续写作。',
    tone: '沉浸、连贯、服务创作者。',
    activationKeywords: ['writing', 'novel', 'chapter', 'outline', 'character', 'scene'],
    memoryLayers: ['project-memory', 'character-memory', 'setting-memory', 'chapter-memory'],
    lifecycle: DEFAULT_EXPERIENCE_LIFECYCLE,
    orchestration: ['大纲复核', '章节起草', '资料回忆', '创作反馈'],
    uiFocus: ['项目概览', '章节画布', '资料架', '创作建议'],
    defaultSystemPrompt:
      '你正在写作体验层中运行。请让大纲、设定、角色、章节进度和创作指导保持一致。',
    highlights: [
      '创作指导应匹配当前项目阶段和故事世界。',
      '章节编辑应保留连续性和推进状态。',
      '参考资料应能反馈到后续章节和场景规划中。',
    ],
  },
  fenghuang: {
    id: 'fenghuang',
    label: '凤煌',
    summary: '凤煌创作套件、早期包和跨应用能力映射的统一入口。',
    mission: '把分散的凤煌入口整理成连贯、可升级的体验层。',
    tone: '平台化、精选化、整合型。',
    activationKeywords: ['fenghuang', 'phoenix', 'suite', 'creative hub', 'entry', 'upgrade'],
    memoryLayers: ['project-memory', 'entry-memory', 'version-memory'],
    lifecycle: DEFAULT_EXPERIENCE_LIFECYCLE,
    orchestration: ['入口聚合', '能力映射', '版本桥接', '跨应用启动'],
    uiFocus: ['入口导航', '能力地图', '版本说明', '套件一致性'],
    defaultSystemPrompt:
      '你正在凤煌体验层中运行。请把多种能力呈现为一套连贯套件，并明确各自角色边界。',
    highlights: [
      '把旧版凤煌包升级为清晰、现代的能力入口。',
      '让描述、路由和套件定位在不同版本间保持一致。',
      '为后续接入智能体、写作、对话和代码工作流保留空间。',
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
