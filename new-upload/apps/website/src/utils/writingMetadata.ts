import type { CSSProperties } from 'react';
import type { WritingMaterialType, WritingProjectType } from '../types/writing';

type WritingTypeMeta = {
  label: string;
  shortLabel: string;
  description: string;
  volumeLabel: string;
  chapterLabel: string;
  summaryLabel: string;
  worldviewLabel: string;
  outlineHint: string;
  assistantTitle: string;
  genreSuggestions: string[];
};

export const WRITING_TYPE_META: Record<WritingProjectType, WritingTypeMeta> = {
  novel: {
    label: '小说创作',
    shortLabel: '小说',
    description: '只面向短篇、中篇和长篇小说创作，突出卷章结构、人物关系与规则世界观。',
    volumeLabel: '卷',
    chapterLabel: '章',
    summaryLabel: '小说梗概',
    worldviewLabel: '世界观与规则',
    outlineHint:
      '示例：\n第一卷 雾港来信：主角收到失踪姐姐的日志\n- 第1章 夜班记录员\n- 第2章 无主档案箱\n第二卷 潮汐议会：调查走向公开对抗\n- 第3章 会改写的海图\n- 第4章 失踪名单',
    assistantTitle: '小说助手',
    genreSuggestions: ['高概念科幻', '都市悬疑', '都市情感', '现实职场', '历史权谋', '幻想冒险'],
  },
  script: {
    label: '剧本写作',
    shortLabel: '剧本',
    description: '面向电影、短剧、短视频、广播剧与广告脚本，专管幕结构、场景目标、对白节奏和排演提示。',
    volumeLabel: '幕',
    chapterLabel: '场景',
    summaryLabel: '剧本梗概',
    worldviewLabel: '设定说明',
    outlineHint:
      '示例：\n第一幕 雨夜开场：主角被卷入案件\n- 场景1 法庭外雨棚：证人迟迟不到\n- 场景2 地铁口追逐：主角第一次失手\n第二幕 证词崩塌：关键证人改口\n- 场景3 讯问室对峙\n- 场景4 楼顶排演',
    assistantTitle: '剧本助手',
    genreSuggestions: ['都市悬疑短剧', '爱情短片', '现实主义电影', '古风传奇', '喜剧', '赛博动作'],
  },
  comic: {
    label: '条漫/漫画连载',
    shortLabel: '条漫',
    description: '面向条漫连载与视觉叙事，强调角色群像、翻页爆点与动作节奏。',
    volumeLabel: '卷',
    chapterLabel: '话',
    summaryLabel: '故事钩子',
    worldviewLabel: '美术基调',
    outlineHint:
      '示例：\n第一卷 事务所开门：主角组建侦探社\n- 第1话 会说话的旧雨伞\n- 第2话 猫眼巷委托\n第二卷 被删除的游乐园：主线开始浮出',
    assistantTitle: '条漫助手',
    genreSuggestions: ['都市奇想', '校园轻喜', '热血冒险', '悬疑奇想', '国风志怪', '治愈日常'],
  },
  storyboard: {
    label: '分镜规划',
    shortLabel: '分镜',
    description: '专管镜头顺序、景别机位、转场节拍和视觉素材，不混入小说卷章创作。',
    volumeLabel: '单元',
    chapterLabel: '镜头',
    summaryLabel: '分镜概述',
    worldviewLabel: '视觉基调与镜头规则',
    outlineHint:
      '示例：\n单元一 追光开场：建立空间与节奏\n- 镜头1 俯拍城市夜景，霓虹反光落在车窗\n- 镜头2 主角推门入场，中近景停顿\n单元二 高潮切入：动作节拍连发\n- 镜头3 长廊奔跑转手持\n- 镜头4 特写钥匙落地',
    assistantTitle: '分镜助手',
    genreSuggestions: ['短剧先导片', '动画分镜', '悬疑预告', '情绪混剪', '广告镜头板'],
  },
};

export const PROJECT_TYPE_OPTIONS = (Object.entries(WRITING_TYPE_META) as Array<
  [WritingProjectType, WritingTypeMeta]
>)
  .filter(([value]) => value !== 'comic')
  .map(([value, meta]) => ({
    value,
    ...meta,
  }));

export const MATERIAL_TYPE_OPTIONS: Array<{ value: WritingMaterialType; label: string }> = [
  { value: 'character', label: '角色卡' },
  { value: 'location', label: '地点场景' },
  { value: 'world', label: '世界规则' },
  { value: 'prop', label: '关键道具' },
  { value: 'scene', label: '情节桥段' },
  { value: 'visual', label: '视觉参考' },
  { value: 'dialogue', label: '对白灵感' },
  { value: 'reference', label: '资料备忘' },
];

export const MATERIAL_TYPE_LABELS = MATERIAL_TYPE_OPTIONS.reduce<Record<WritingMaterialType, string>>(
  (result, option) => {
    result[option.value] = option.label;
    return result;
  },
  {
    character: '角色卡',
    location: '地点场景',
    world: '世界规则',
    prop: '关键道具',
    scene: '情节桥段',
    visual: '视觉参考',
    dialogue: '对白灵感',
    reference: '资料备忘',
  }
);

export function normalizeProjectType(value: string | null | undefined): WritingProjectType {
  if (value && value in WRITING_TYPE_META) {
    return value as WritingProjectType;
  }
  return 'novel';
}

export function getDefaultVolumeTitle(type: WritingProjectType, order: number) {
  switch (type) {
    case 'script':
      return `第${order}幕`;
    case 'comic':
      return `第${order}卷`;
    case 'storyboard':
      return `单元 ${order}`;
    case 'novel':
    default:
      return `第${order}卷`;
  }
}

export function getDefaultChapterTitle(type: WritingProjectType, order: number) {
  switch (type) {
    case 'script':
      return `场景 ${order}`;
    case 'comic':
      return `第${order}话`;
    case 'storyboard':
      return `镜头 ${order}`;
    case 'novel':
    default:
      return `第${order}章`;
  }
}

export function splitTagInput(value: string) {
  return value
    .split(/[,\n，、]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function hashString(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function buildCoverStyle(seed: string, type: WritingProjectType): CSSProperties {
  const palettes: Record<WritingProjectType, [string, string, string]> = {
    novel: ['#38bdf8', '#6366f1', '#081120'],
    script: ['#22d3ee', '#0ea5e9', '#020617'],
    comic: ['#60a5fa', '#8b5cf6', '#1e1b4b'],
    storyboard: ['#38bdf8', '#6366f1', '#0f172a'],
  };

  const [start, middle, end] = palettes[type];
  const offset = hashString(seed) % 20;

  return {
    background: `linear-gradient(140deg, ${start} 0%, ${middle} ${48 + offset}%, ${end} 100%)`,
  };
}
