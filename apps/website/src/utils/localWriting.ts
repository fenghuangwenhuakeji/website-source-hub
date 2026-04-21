import type {
  WritingChapter,
  WritingMaterialItem,
  WritingMaterialType,
  WritingProject,
  WritingProjectStatus,
  WritingProjectType,
  WritingVolume,
} from '../types/writing';
import { seedWritingProjects } from '../data/writingSeeds';
import {
  getDefaultChapterTitle,
  getDefaultVolumeTitle,
  normalizeProjectType,
  splitTagInput,
} from './writingMetadata';

const STORAGE_KEY = 'fenghuang-unified-writing-projects';

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function safeWriteStorage(value: WritingProject[]) {
  if (!canUseStorage()) {
    return false;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function normalizeText(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function normalizeDate(value: unknown, fallback: string) {
  return typeof value === 'string' && value ? value : fallback;
}

function normalizeStatus(value: unknown): WritingProjectStatus {
  if (value === 'planning' || value === 'drafting' || value === 'serializing' || value === 'completed') {
    return value;
  }
  return 'drafting';
}

function normalizeMaterialType(value: unknown): WritingMaterialType {
  switch (value) {
    case 'character':
    case 'location':
    case 'world':
    case 'prop':
    case 'scene':
    case 'visual':
    case 'dialogue':
    case 'reference':
      return value;
    default:
      return 'reference';
  }
}

function normalizeTags(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => `${item}`.trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return splitTagInput(value);
  }
  return [];
}

export function createWritingChapter(
  order: number,
  type: WritingProjectType,
  title = getDefaultChapterTitle(type, order)
): WritingChapter {
  const createdAt = nowIso();
  return {
    id: createId('chapter'),
    title,
    summary: '',
    content: '',
    order,
    createdAt,
    updatedAt: createdAt,
  };
}

export function createWritingVolume(
  order: number,
  type: WritingProjectType,
  title = getDefaultVolumeTitle(type, order)
): WritingVolume {
  return {
    id: createId('volume'),
    title,
    summary: '',
    order,
    chapters: [createWritingChapter(1, type)],
  };
}

export function createWritingMaterialItem(type: WritingMaterialType, title = '新素材'): WritingMaterialItem {
  const createdAt = nowIso();
  return {
    id: createId('material'),
    title,
    type,
    summary: '',
    content: '',
    tags: [],
    createdAt,
    updatedAt: createdAt,
  };
}

function createStarterMaterials(type: WritingProjectType): WritingMaterialItem[] {
  switch (type) {
    case 'script':
      return [
        { ...createWritingMaterialItem('character', '主角人物小传'), summary: '记录主角目标、软肋和潜台词。' },
        { ...createWritingMaterialItem('dialogue', '高压对白模板'), summary: '留存能直接复用的对白节奏。' },
      ];
    case 'comic':
      return [
        { ...createWritingMaterialItem('visual', '角色外形卡'), summary: '记录服装、配色和表情模板。' },
        { ...createWritingMaterialItem('scene', '翻页爆点'), summary: '专门收集章末翻页钩子。' },
      ];
    case 'storyboard':
      return [
        { ...createWritingMaterialItem('visual', '镜头语言库'), summary: '整理推拉摇移、构图和光线关键词。' },
        { ...createWritingMaterialItem('reference', '配乐备注'), summary: '收纳节拍、情绪和转场提示。' },
      ];
    case 'novel':
    default:
      return [
        { ...createWritingMaterialItem('character', '主角卡'), summary: '写清主角欲望、软肋与成长弧。' },
        { ...createWritingMaterialItem('world', '世界规则卡'), summary: '记录世界边界、代价和秩序。' },
      ];
  }
}

export function createWritingProject(options: {
  title: string;
  type: WritingProjectType;
  genre: string;
  premise: string;
}) {
  const createdAt = nowIso();

  return {
    id: createId('draft'),
    type: options.type,
    title: options.title,
    genre: options.genre,
    premise: options.premise,
    summary: options.premise,
    description: options.premise,
    worldview: '',
    outline: '',
    coverImage: '',
    tags: [],
    status: 'planning' as WritingProjectStatus,
    createdAt,
    updatedAt: createdAt,
    volumes: [createWritingVolume(1, options.type)],
    materials: createStarterMaterials(options.type),
  } satisfies WritingProject;
}

function normalizeChapter(input: unknown, order: number, type: WritingProjectType): WritingChapter {
  const raw = typeof input === 'object' && input ? (input as Record<string, unknown>) : {};
  const createdAt = normalizeDate(raw.createdAt, nowIso());
  return {
    id: normalizeText(raw.id, createId('chapter')),
    title: normalizeText(raw.title, getDefaultChapterTitle(type, order)),
    summary: normalizeText(raw.summary),
    content: normalizeText(raw.content),
    order,
    createdAt,
    updatedAt: normalizeDate(raw.updatedAt, createdAt),
  };
}

function normalizeVolume(input: unknown, order: number, type: WritingProjectType): WritingVolume {
  const raw = typeof input === 'object' && input ? (input as Record<string, unknown>) : {};
  const chapters = Array.isArray(raw.chapters)
    ? raw.chapters.map((chapter, chapterIndex) => normalizeChapter(chapter, chapterIndex + 1, type))
    : [];

  return {
    id: normalizeText(raw.id, createId('volume')),
    title: normalizeText(raw.title, getDefaultVolumeTitle(type, order)),
    summary: normalizeText(raw.summary),
    order,
    chapters: chapters.length > 0 ? chapters : [createWritingChapter(1, type)],
  };
}

function normalizeMaterials(input: unknown) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.map((item, index) => {
    const raw = typeof item === 'object' && item ? (item as Record<string, unknown>) : {};
    const createdAt = normalizeDate(raw.createdAt, nowIso());
    return {
      id: normalizeText(raw.id, createId(`material-${index}`)),
      title: normalizeText(raw.title, `素材 ${index + 1}`),
      type: normalizeMaterialType(raw.type),
      summary: normalizeText(raw.summary),
      content: normalizeText(raw.content),
      tags: normalizeTags(raw.tags),
      createdAt,
      updatedAt: normalizeDate(raw.updatedAt, createdAt),
    } satisfies WritingMaterialItem;
  });
}

function normalizeProject(input: unknown, index: number): WritingProject | null {
  const raw = typeof input === 'object' && input ? (input as Record<string, unknown>) : null;
  if (!raw) {
    return null;
  }

  const type = normalizeProjectType(normalizeText(raw.type));
  const createdAt = normalizeDate(raw.createdAt, nowIso());
  const legacyChapters = Array.isArray(raw.chapters) ? raw.chapters : [];
  const volumes = Array.isArray(raw.volumes)
    ? raw.volumes.map((volume, volumeIndex) => normalizeVolume(volume, volumeIndex + 1, type))
    : legacyChapters.length > 0
      ? [
          {
            id: createId(`volume-legacy-${index}`),
            title: getDefaultVolumeTitle(type, 1),
            summary: '',
            order: 1,
            chapters: legacyChapters.map((chapter, chapterIndex) =>
              normalizeChapter(chapter, chapterIndex + 1, type)
            ),
          },
        ]
      : [createWritingVolume(1, type)];

  return {
    id: normalizeText(raw.id, createId(`draft-${index}`)),
    type,
    title: normalizeText(raw.title, `未命名项目 ${index + 1}`),
    genre: normalizeText(raw.genre, '未分类'),
    premise: normalizeText(raw.premise, normalizeText(raw.summary, '请补充核心概念。')),
    summary: normalizeText(raw.summary, normalizeText(raw.premise)),
    description: normalizeText(raw.description, normalizeText(raw.summary, normalizeText(raw.premise))),
    worldview: normalizeText(raw.worldview),
    outline: normalizeText(raw.outline),
    coverImage: normalizeText(raw.coverImage, normalizeText(raw.cover)),
    tags: normalizeTags(raw.tags),
    status: normalizeStatus(raw.status),
    createdAt,
    updatedAt: normalizeDate(raw.updatedAt, createdAt),
    volumes,
    materials: normalizeMaterials(raw.materials),
  };
}

function splitOutlineLine(line: string) {
  const cleaned = line.replace(/^[\-\*\d\.\)\s]+/, '').trim();
  if (!cleaned) {
    return null;
  }

  const match = cleaned.match(/^(.+?)(?:[:：\-—|]\s*)(.+)$/);
  if (!match) {
    return { title: cleaned, summary: '' };
  }

  return { title: match[1].trim(), summary: match[2].trim() };
}

function isVolumeHeading(line: string) {
  return /^(第[一二三四五六七八九十百千0-9]+[卷幕册篇部季集]|卷[一二三四五六七八九十百千0-9]+|幕[一二三四五六七八九十百千0-9]+|单元\s*\d+|part\s*\d+|act\s*\d+)/i.test(
    line
  );
}

export function parseOutlineText(text: string, type: WritingProjectType) {
  const lines = text
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [createWritingVolume(1, type)];
  }

  const createdAt = nowIso();
  const volumes: WritingVolume[] = [];
  let currentVolume: WritingVolume | null = null;

  const ensureVolume = () => {
    if (!currentVolume) {
      currentVolume = {
        id: createId('volume'),
        title: getDefaultVolumeTitle(type, volumes.length + 1),
        summary: '',
        order: volumes.length + 1,
        chapters: [],
      };
      volumes.push(currentVolume);
    }
    return currentVolume;
  };

  lines.forEach((line) => {
    const parsed = splitOutlineLine(line);
    if (!parsed) {
      return;
    }

    if (isVolumeHeading(parsed.title)) {
      currentVolume = {
        id: createId('volume'),
        title: parsed.title,
        summary: parsed.summary,
        order: volumes.length + 1,
        chapters: [],
      };
      volumes.push(currentVolume);
      return;
    }

    const volume = ensureVolume();
    const order = volume.chapters.length + 1;
    volume.chapters.push({
      id: createId('chapter'),
      title: parsed.title || getDefaultChapterTitle(type, order),
      summary: parsed.summary,
      content: '',
      order,
      createdAt,
      updatedAt: createdAt,
    });
  });

  return volumes.map((volume, volumeIndex) => ({
    ...volume,
    order: volumeIndex + 1,
    title: volume.title || getDefaultVolumeTitle(type, volumeIndex + 1),
    chapters:
      volume.chapters.length > 0
        ? volume.chapters.map((chapter, chapterIndex) => ({
            ...chapter,
            order: chapterIndex + 1,
            title: chapter.title || getDefaultChapterTitle(type, chapterIndex + 1),
          }))
        : [createWritingChapter(1, type)],
  }));
}

export function countProjectVolumes(project: WritingProject) {
  return project.volumes.length;
}

export function countProjectChapters(project: WritingProject) {
  return project.volumes.reduce((total, volume) => total + volume.chapters.length, 0);
}

export function countProjectWords(project: WritingProject) {
  return project.volumes.reduce(
    (total, volume) =>
      total +
      volume.chapters.reduce((chapterTotal, chapter) => chapterTotal + chapter.content.replace(/\s/g, '').length, 0),
    0
  );
}

export function getWritingProjects() {
  if (!canUseStorage()) {
    return seedWritingProjects;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      safeWriteStorage(seedWritingProjects);
      return seedWritingProjects;
    }

    const parsed = JSON.parse(raw);
    const normalized = Array.isArray(parsed)
      ? parsed
          .map((item, index) => normalizeProject(item, index))
          .filter((item): item is WritingProject => Boolean(item))
      : [];

    if (normalized.length === 0) {
      safeWriteStorage(seedWritingProjects);
      return seedWritingProjects;
    }

    safeWriteStorage(normalized);
    return normalized;
  } catch {
    safeWriteStorage(seedWritingProjects);
    return seedWritingProjects;
  }
}

export function saveWritingProjects(projects: WritingProject[]) {
  safeWriteStorage(projects);
}

export function getWritingProjectById(id: string) {
  return getWritingProjects().find((project) => project.id === id) ?? null;
}

export function exportProjectAsMarkdown(project: WritingProject) {
  const lines = [
    `# ${project.title}`,
    '',
    `- 类型：${project.type}`,
    `- 题材：${project.genre}`,
    `- 状态：${project.status}`,
    `- 标签：${project.tags.length > 0 ? project.tags.join(' / ') : '未设置'}`,
    '',
    '## 核心概念',
    '',
    project.premise || '待补充',
    '',
    '## 简介',
    '',
    project.description || project.summary || '待补充',
    '',
  ];

  if (project.worldview) {
    lines.push('## 世界观简介', '', project.worldview, '');
  }

  if (project.outline) {
    lines.push('## 大纲', '', project.outline, '');
  }

  if (project.materials.length > 0) {
    lines.push('## 素材库', '');
    project.materials.forEach((material) => {
      lines.push(`### ${material.title}`, '');
      lines.push(`- 类型：${material.type}`);
      lines.push(`- 标签：${material.tags.length > 0 ? material.tags.join(' / ') : '未设置'}`, '');
      if (material.summary) {
        lines.push(material.summary, '');
      }
      if (material.content) {
        lines.push(material.content, '');
      }
    });
  }

  project.volumes.forEach((volume) => {
    lines.push(`## ${volume.title}`, '');
    if (volume.summary) {
      lines.push(volume.summary, '');
    }

    volume.chapters.forEach((chapter) => {
      lines.push(`### ${chapter.title}`, '');
      if (chapter.summary) {
        lines.push(`> ${chapter.summary}`, '');
      }
      lines.push(chapter.content || '（本节正文待补充）', '');
    });
  });

  return lines.join('\n');
}
