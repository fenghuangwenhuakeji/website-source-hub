import { startTransition, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  countProjectChapters,
  countProjectVolumes,
  countProjectWords,
  createWritingChapter,
  createWritingMaterialItem,
  createWritingProject,
  createWritingVolume,
  exportProjectAsMarkdown,
  getWritingProjects,
  parseOutlineText,
  saveWritingProjects,
} from '../../utils/localWriting';
import { Link } from 'react-router-dom';
import {
  buildCoverStyle,
  MATERIAL_TYPE_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  WRITING_TYPE_META,
} from '../../utils/writingMetadata';
import { createAssistantSuggestions } from '../../utils/writingWorkspace';
import { createSaveScheduler, type SaveScheduler } from '../../utils/saveScheduler';
import type {
  WritingMaterialType,
  WritingProject,
  WritingProjectStatus,
  WritingProjectType,
} from '../../types/writing';

type Props = {
  initialProjectId?: string;
  initialType?: WritingProjectType;
  initialNovelTier?: 'short' | 'medium' | 'long';
  forceNovelWorkspace?: boolean;
  onProjectChange?: (projectId: string) => void;
  onWorkspaceTypeChange?: (type: WritingProjectType) => void;
};

type MobileTab = 'projects' | 'editor' | 'assistant';

const STATUS_OPTIONS: Array<{ value: WritingProjectStatus; label: string }> = [
  { value: 'planning', label: '筹备中' },
  { value: 'drafting', label: '创作中' },
  { value: 'serializing', label: '连载中' },
  { value: 'completed', label: '已完结' },
];

type ProjectStats = {
  volumes: number;
  chapters: number;
  words: number;
  materials: number;
};

type ChapterDraft = {
  id: string;
  title: string;
  summary: string;
  content: string;
};

type NovelLengthTier = 'short' | 'medium' | 'long';

const NOVEL_TIER_META: Record<NovelLengthTier, { label: string; badge: string; description: string; note: string }> = {
  short: {
    label: '短篇小说',
    badge: '短篇',
    description: '更适合单线推进、强钩子和紧凑转折，聚焦一个冲突核心。',
    note: '建议把篇幅控制在单卷和少章节的节奏里。',
  },
  medium: {
    label: '中篇小说',
    badge: '中篇',
    description: '更适合双线推进、人物关系和局部世界扩展，保留更完整的起承转合。',
    note: '适合做卷章拆分和阶段性连载。',
  },
  long: {
    label: '长篇小说',
    badge: '长篇',
    description: '更适合多卷多章、角色群像和持续连载，强调长期结构和世界观承载。',
    note: '建议从卷章树和人物卡开始搭建底层结构。',
  },
};

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function updateOne(projects: WritingProject[], next: WritingProject) {
  return projects.map((project) => (project.id === next.id ? next : project));
}

function touched(project: WritingProject) {
  return { ...project, updatedAt: new Date().toISOString() };
}

function firstChapterId(project: WritingProject) {
  return project.volumes[0]?.chapters[0]?.id ?? '';
}

function findChapter(project: WritingProject, chapterId: string) {
  for (const volume of project.volumes) {
    const chapter = volume.chapters.find((item) => item.id === chapterId);
    if (chapter) return { volume, chapter };
  }
  return null;
}

function getNovelProgress(project: WritingProject, stats: ProjectStats) {
  const stageOrder: WritingProjectStatus[] = ['planning', 'drafting', 'serializing', 'completed'];
  const stageIndex = Math.max(stageOrder.indexOf(project.status), 0);
  const statusBase = [18, 42, 72, 100][stageIndex] ?? 42;
  const detailBonus = Math.min(24, stats.chapters * 4 + Math.floor(stats.words / 300));
  const progress = Math.min(100, statusBase + detailBonus);
  const stageLabel = STATUS_OPTIONS.find((item) => item.value === project.status)?.label ?? '进行中';
  const nextHint =
    project.status === 'planning'
      ? '先搭卷章树和角色设定'
      : project.status === 'drafting'
        ? '继续扩写正文，积累到连载阈值'
        : project.status === 'serializing'
          ? '保持更新节奏，围绕章节推进连载'
          : '作品已完结，可继续做番外和修订';

  return {
    progress,
    stageIndex,
    stageLabel,
    nextHint,
  };
}

function getNovelTierByStats(stats: ProjectStats): NovelLengthTier {
  if (stats.words >= 80000 || stats.chapters >= 40) return 'long';
  if (stats.words >= 20000 || stats.chapters >= 12) return 'medium';
  return 'short';
}

function formatDate(value: string) {
  try {
    return dateFormatter.format(new Date(value));
  } catch {
    return value;
  }
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-sm font-semibold text-slate-700">{label}</div>
      {children}
    </label>
  );
}

export default function WritingWorkbench({
  initialProjectId = '',
  initialType,
  initialNovelTier,
  forceNovelWorkspace = false,
  onProjectChange,
  onWorkspaceTypeChange,
}: Props) {
  const [projects, setProjects] = useState<WritingProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [activeChapterId, setActiveChapterId] = useState('');
  const [outlineText, setOutlineText] = useState('');
  const [mobileTab, setMobileTab] = useState<MobileTab>('editor');
  const [lastManualSaveAt, setLastManualSaveAt] = useState('');
  const [activeWorkspaceType, setActiveWorkspaceType] = useState<WritingProjectType>(
    forceNovelWorkspace ? 'novel' : initialType && initialType !== 'novel' ? initialType : initialType === 'novel' ? 'novel' : 'script',
  );
  const [newProject, setNewProject] = useState({
    title: '',
    type: (forceNovelWorkspace
      ? 'novel'
      : initialType && initialType !== 'novel'
        ? initialType
        : initialType === 'novel'
          ? 'novel'
          : 'script') as WritingProjectType,
    genre: '',
    premise: '',
  });
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    type: 'character' as WritingMaterialType,
  });
  const [chapterDraft, setChapterDraft] = useState<ChapterDraft>({
    id: '',
    title: '',
    summary: '',
    content: '',
  });
  const draftCommitRef = useRef<number | null>(null);
  const projectsRef = useRef<WritingProject[]>([]);
  const hasInitializedSelectionRef = useRef(false);
  const chapterDraftRef = useRef<ChapterDraft>({
    id: '',
    title: '',
    summary: '',
    content: '',
  });
  const statsCacheRef = useRef<WeakMap<WritingProject, ProjectStats>>(new WeakMap());
  const saveSchedulerRef = useRef<SaveScheduler | null>(null);
  if (!saveSchedulerRef.current) {
    saveSchedulerRef.current = createSaveScheduler(saveWritingProjects);
  }
  const isNovelMode = forceNovelWorkspace || activeWorkspaceType === 'novel';
  const initialNovelTierValue: NovelLengthTier = initialNovelTier ?? 'short';
  const allowedProjectTypes = useMemo<WritingProjectType[]>(
    () => (isNovelMode ? ['novel'] : [activeWorkspaceType]),
    [activeWorkspaceType, isNovelMode],
  );
  const visibleTypeOptions = useMemo(
    () => PROJECT_TYPE_OPTIONS.filter((item) => allowedProjectTypes.includes(item.value)),
    [allowedProjectTypes],
  );
  const currentCreationMeta = WRITING_TYPE_META[newProject.type];
  const workspaceTitle = isNovelMode ? '小说工坊' : '剧本工坊';
  const workspaceDescription = isNovelMode
    ? '在这里把灵感锻成作品。卷、章、正文、人物和世界观会在同一套小说工作台里一起生长。'
    : '这里负责把文字推向镜头。剧本、分镜、调度、转场和画面节拍，会在同一条创作生产线里持续推进。';
  const workspaceBadge = isNovelMode ? '小说工坊' : '剧本工坊';
  const workspaceModeLabel = isNovelMode ? '当前主创模式' : '当前舞台模式';
  const titleFieldLabel = isNovelMode ? '项目标题' : '项目名称';
  const typeFieldLabel = isNovelMode ? '小说类型' : '工坊模式';
  const genreFieldLabel = isNovelMode ? '题材方向' : '风格 / 片种';
  const premiseFieldLabel = isNovelMode ? '核心设定' : '核心冲突 / 排演目标';
  const titlePlaceholder = isNovelMode ? '例如：春日幻旅' : '例如：雨夜证词 / 旧城追光';
  const genrePlaceholder = isNovelMode ? '例如：都市悬疑 / 校园轻喜 / 仙侠成长' : '例如：都市悬疑短剧 / 动画先导片 / 广告脚本';
  const premisePlaceholder = isNovelMode ? '写下故事的冲突、目标与钩子。' : '写下核心冲突、排演重点、镜头基调和画面钩子。';
  const createTitle = isNovelMode ? '新建小说' : '创建剧本工坊项目';
  const createButtonLabel = isNovelMode ? '创建并进入小说工坊' : '创建并进入剧本工坊';
  const libraryTitle = isNovelMode ? '小说项目库' : '工坊项目池';
  const libraryDescription = isNovelMode ? '按草稿、进度和题材管理当前小说' : '按剧本、分镜与推进阶段管理当前工坊项目';
  const quickCreateTitle = isNovelMode ? '新建小说' : '快速立项';
  const quickCreateDescription = isNovelMode
    ? '先写下标题、题材和第一道钩子，然后直接冲进正文。'
    : '先确定是剧本还是分镜，再把这一条创作线完整点亮。';
  const quickCreateButtonLabel = isNovelMode ? '创建并打开小说工坊' : '立刻进入工坊';

  const getStatsSnapshot = (project: WritingProject): ProjectStats => {
    const cache = statsCacheRef.current;
    const cached = cache.get(project);
    if (cached) {
      return cached;
    }
    const next: ProjectStats = {
      volumes: countProjectVolumes(project),
      chapters: countProjectChapters(project),
      words: countProjectWords(project),
      materials: project.materials.length,
    };
    cache.set(project, next);
    return next;
  };

  useEffect(() => {
    const initial = getWritingProjects();
    setProjects(initial);
    projectsRef.current = initial;
  }, []);

  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  useEffect(() => {
    chapterDraftRef.current = chapterDraft;
  }, [chapterDraft]);

  useEffect(() => {
    if (!projects.length) return;
    const visibleProjects = projects.filter((item) => allowedProjectTypes.includes(item.type));
    const selectedProject = selectedProjectId ? visibleProjects.find((item) => item.id === selectedProjectId) ?? null : null;
    const preferredTypeProjectId = activeWorkspaceType
      ? visibleProjects.find((item) => item.type === activeWorkspaceType)?.id ?? ''
      : '';
    const selectedIsVisible = Boolean(selectedProject);

    if (!hasInitializedSelectionRef.current) {
      const nextId =
        (initialProjectId && visibleProjects.some((item) => item.id === initialProjectId) && initialProjectId) ||
        preferredTypeProjectId ||
        visibleProjects[0]?.id ||
        '';
      hasInitializedSelectionRef.current = true;
      if (nextId && nextId !== selectedProjectId) {
        setSelectedProjectId(nextId);
      }
      return;
    }

    if (selectedIsVisible) {
      return;
    }

    const nextId = preferredTypeProjectId || visibleProjects[0]?.id || '';
    if (nextId && nextId !== selectedProjectId) {
      setSelectedProjectId(nextId);
    }
  }, [activeWorkspaceType, allowedProjectTypes, initialProjectId, projects, selectedProjectId]);

  useEffect(() => {
    setNewProject((current) => (current.type === activeWorkspaceType ? current : { ...current, type: activeWorkspaceType }));
  }, [activeWorkspaceType]);

  useEffect(() => {
    if (!initialType) {
      return;
    }

    if (forceNovelWorkspace) {
      setActiveWorkspaceType('novel');
      return;
    }

    const nextWorkspaceType = initialType === 'novel' ? 'novel' : initialType;
    setActiveWorkspaceType((current) => (current === nextWorkspaceType ? current : nextWorkspaceType));
  }, [forceNovelWorkspace, initialType]);

  useEffect(() => {
    if (!forceNovelWorkspace) {
      onWorkspaceTypeChange?.(activeWorkspaceType);
    }
  }, [activeWorkspaceType, forceNovelWorkspace, onWorkspaceTypeChange]);

  const visibleProjects = useMemo(
    () => projects.filter((item) => allowedProjectTypes.includes(item.type)),
    [allowedProjectTypes, projects],
  );
  const project = useMemo(() => visibleProjects.find((item) => item.id === selectedProjectId) ?? null, [visibleProjects, selectedProjectId]);
  const activeRef = useMemo(() => (project && activeChapterId ? findChapter(project, activeChapterId) : null), [project, activeChapterId]);
  const activeChapter = activeRef?.chapter ?? (project ? findChapter(project, firstChapterId(project))?.chapter ?? null : null);
  const activeVolume = activeRef?.volume ?? null;
  const currentType = project?.type ?? activeWorkspaceType;
  const meta = WRITING_TYPE_META[currentType];
  const isStoryboardProject = currentType === 'storyboard';
  const workshopBadges = isNovelMode
    ? []
    : isStoryboardProject
      ? ['分镜', '镜头', '转场', '视觉节拍']
      : ['剧本', '场景', '对白', '排演'];
  const structureDescription = isNovelMode
    ? `管理${meta.volumeLabel}与${meta.chapterLabel}，适配平台节奏`
    : isStoryboardProject
      ? `按${meta.volumeLabel}与${meta.chapterLabel}推进镜头顺序、转场和视觉节拍`
      : `按${meta.volumeLabel}与${meta.chapterLabel}推进冲突、对白和排演节奏`;
  const outlineTitle = isNovelMode ? '小说大纲解析' : isStoryboardProject ? '分镜流程拆解' : '剧本流程拆解';
  const outlineDescription = isNovelMode
    ? `粘贴小说结构文本，自动生成${meta.volumeLabel}/${meta.chapterLabel}`
    : isStoryboardProject
      ? `粘贴分镜文本，自动生成${meta.volumeLabel}/${meta.chapterLabel}`
      : `粘贴剧本流程文本，自动生成${meta.volumeLabel}/${meta.chapterLabel}`;
  const editorTitle = isNovelMode ? '正文编辑区' : isStoryboardProject ? '镜头台本区' : '场景排演台';
  const materialsTitle = isNovelMode ? '人物与设定' : isStoryboardProject ? '视觉参考与分镜资产' : '角色、场景与排演素材';
  const materialsDescription = isNovelMode
    ? '角色、地点、世界规则统一沉淀'
    : isStoryboardProject
      ? '镜头参考、场景风格与视觉线索统一沉淀'
      : '角色、场景、桥段与排演提示统一沉淀';
  const assistantPanelTitle = isNovelMode ? '创作导航' : isStoryboardProject ? '分镜推进清单' : '剧本推进清单';
  const suggestionsTitle = isNovelMode ? '灵感建议' : isStoryboardProject ? '镜头推进建议' : '场景推进建议';
  const suggestionsDescription = isNovelMode
    ? `围绕当前${meta.chapterLabel}生成`
    : isStoryboardProject
      ? `围绕当前${meta.chapterLabel}补充节拍、转场与画面钩子`
      : `围绕当前${meta.chapterLabel}补充动作、对白与排演节点`;
  const statusPanelTitle = isNovelMode ? '作品引擎状态' : '当前推进状态';
  const coverFieldLabel = isNovelMode ? '封面地址' : '封面 / 概念图地址';
  const tagFieldLabel = isNovelMode ? '标签（逗号或换行分隔）' : '关键词（逗号或换行分隔）';
  const countTextLabel = isNovelMode ? '字数' : isStoryboardProject ? '备注字数' : '台词/描述';
  const materialCountLabel = isNovelMode ? '素材' : isStoryboardProject ? '视觉素材' : '排演素材';
  const chapterContentLabel = isNovelMode
    ? (project ? `${meta.chapterLabel}正文` : '正文')
    : isStoryboardProject
      ? '镜头说明 / 调度备注'
      : '场景正文 / 对白 / 调度';
  const chapterContentPlaceholder = isNovelMode
    ? '在这里写章节正文、人物动作、场景变化和情绪推进。'
    : isStoryboardProject
      ? '在这里写镜头说明、景别、机位、动作、转场和画面节拍。'
      : '在这里写场景动作、对白、调度、排演提示和情绪推进。';
  const workflowCards = isNovelMode
    ? []
    : isStoryboardProject
      ? [
          { label: '镜头顺序', description: '按场景推进画面，不混章节结构。' },
          { label: '景别机位', description: '先定机位，再定运动和节拍。' },
          { label: '转场节奏', description: '让镜头与情绪同步切换。' },
          { label: '视觉素材', description: '参考图与画面关键词统一沉淀。' },
        ]
      : [
          { label: '幕结构', description: '先拆冲突，再排场景位置。' },
          { label: '场景目标', description: '每一场先明确任务与变化。' },
          { label: '对白节奏', description: '台词和停顿一起看。' },
          { label: '排演提示', description: '把走位、动作和情绪写清楚。' },
        ];
  const branchCards = isNovelMode
    ? []
    : [
        {
          type: 'script' as const,
          title: '剧本写作',
          description: '围绕幕、场景、对白和排演推进，适合电影、短剧、广播剧和短视频脚本。',
          chips: ['幕结构', '场景目标', '对白', '排演'],
          cta: '切到剧本写作',
        },
        {
          type: 'storyboard' as const,
          title: '分镜规划',
          description: '围绕镜头、景别、机位和转场推进，适合漫剧、动画、预告片和视觉板。',
          chips: ['镜头顺序', '景别机位', '转场', '视觉节拍'],
          cta: '切到分镜规划',
        },
      ];
  const mobileTabItems: Array<[MobileTab, string]> = isNovelMode
    ? [
        ['projects', '项目库'],
        ['editor', '工作台'],
        ['assistant', '助手'],
      ]
    : [
        ['projects', '项目池'],
        ['editor', '工坊台'],
        ['assistant', '清单'],
      ];
  const checklist = useMemo(() => {
    if (!project) return [];
    const statsSnapshot = getStatsSnapshot(project);
    const chapterCount = statsSnapshot.chapters;
    const wordCount = statsSnapshot.words;
    if (project.type === 'novel') {
      return [
        {
          label: '封面、简介与标签是否只服务于这部小说',
          done: Boolean(project.coverImage || project.description || project.tags.length > 0),
        },
        {
          label: '世界观与规则是否已经单独建立',
          done: Boolean(project.worldview.trim()),
        },
        {
          label: '大纲是否拆成清晰的卷章结构',
          done: Boolean(project.outline.trim()) && chapterCount > 1,
        },
        {
          label: '角色、地点与道具素材是否成体系',
          done: project.materials.length >= 3,
        },
        {
          label: '正文是否已经推进到可持续连载的长度',
          done: wordCount >= 200,
        },
      ];
    }
    if (project.type === 'storyboard') {
      return [
        {
          label: '视觉基调、镜头语言和关键词已经明确',
          done: Boolean(project.coverImage || project.description || project.tags.length > 0),
        },
        {
          label: '单元结构与镜头顺序已经拆开',
          done: Boolean(project.outline.trim()) && chapterCount > 1,
        },
        {
          label: '转场规则、节拍与镜头说明已沉淀',
          done: Boolean(project.worldview.trim()),
        },
        {
          label: '角色、场景与视觉参考素材已经补齐',
          done: project.materials.length >= 3,
        },
        {
          label: '当前分镜已能进入试排或生成素材',
          done: chapterCount >= 3 || wordCount >= 120,
        },
      ];
    }
    return [
      {
        label: '项目定位、受众和时长边界已经明确',
        done: Boolean(project.coverImage || project.description || project.tags.length > 0),
      },
      {
        label: '幕结构与场景目标已经拆开',
        done: Boolean(project.outline.trim()) && chapterCount > 1,
      },
      {
        label: '角色关系、设定与冲突规则已沉淀',
        done: Boolean(project.worldview.trim()),
      },
      {
        label: '对白、动作和排演素材已经补齐',
        done: project.materials.length >= 3,
      },
      {
        label: '当前稿已能进入试读或排演',
        done: wordCount >= 200,
      },
    ];
  }, [project]);
  const suggestions = useMemo(() => (project && activeChapter ? createAssistantSuggestions(project, activeChapter) : []), [project, activeChapter]);
  const statusLabel = project ? STATUS_OPTIONS.find((item) => item.value === project.status)?.label ?? '进行中' : '';
  const statsSnapshot = project ? getStatsSnapshot(project) : null;
  const currentNovelTier: NovelLengthTier = isNovelMode
    ? project && statsSnapshot
      ? getNovelTierByStats(statsSnapshot)
      : initialNovelTierValue
    : 'short';
  const novelTierMeta = NOVEL_TIER_META[currentNovelTier];
  const stats = project
    ? [
        { label: meta.volumeLabel, value: statsSnapshot?.volumes ?? 0 },
        { label: meta.chapterLabel, value: statsSnapshot?.chapters ?? 0 },
        { label: countTextLabel, value: statsSnapshot?.words ?? 0 },
        { label: materialCountLabel, value: statsSnapshot?.materials ?? 0 },
      ]
    : [];
  const novelProgress = useMemo(
    () => (project && project.type === 'novel' && statsSnapshot ? getNovelProgress(project, statsSnapshot) : null),
    [project, statsSnapshot],
  );
  const novelCharacterMaterials = useMemo(
    () => (project && project.type === 'novel' ? project.materials.filter((item) => item.type === 'character') : []),
    [project],
  );
  const novelWorldMaterials = useMemo(
    () => (project && project.type === 'novel' ? project.materials.filter((item) => item.type === 'world') : []),
    [project],
  );
  const materialTypeLabel = (value: WritingMaterialType) => MATERIAL_TYPE_OPTIONS.find((item) => item.value === value)?.label ?? value;
  const projectDetailHref = isNovelMode && project ? `/novels/${project.id}` : '';
  const novelWorkspaceHref = '/writing?type=novel&workspace=novel';
  const saveDescription = isNovelMode
    ? lastManualSaveAt
      ? `最近手动保存：${formatDate(lastManualSaveAt)}`
      : '本地自动保存已开启，刷新后也能继续写作。'
    : lastManualSaveAt
      ? `最近手动保存：${formatDate(lastManualSaveAt)}`
      : '自动保存已开启。';

  useEffect(() => {
    if (!project) return;
    const nextChapterId = activeChapterId && findChapter(project, activeChapterId) ? activeChapterId : firstChapterId(project);
    if (nextChapterId !== activeChapterId) setActiveChapterId(nextChapterId);
    setOutlineText(project.outline);
  }, [project, activeChapterId]);

  useEffect(() => {
    cancelDraftCommit();
    if (!activeChapter) {
      setChapterDraft({ id: '', title: '', summary: '', content: '' });
      return;
    }

    setChapterDraft((current) => {
      if (current.id === activeChapter.id) {
        return current;
      }
      return {
        id: activeChapter.id,
        title: activeChapter.title,
        summary: activeChapter.summary,
        content: activeChapter.content,
      };
    });
  }, [project?.id, activeChapter?.id]);

  useEffect(() => {
    return () => {
      cancelDraftCommit();
      saveSchedulerRef.current?.destroy();
    };
  }, []);

  function cancelDraftCommit() {
    if (draftCommitRef.current !== null) {
      window.clearTimeout(draftCommitRef.current);
      draftCommitRef.current = null;
    }
  }

  function scheduleDraftCommit() {
    cancelDraftCommit();
    draftCommitRef.current = window.setTimeout(() => {
      flushChapterDraft();
      draftCommitRef.current = null;
    }, 600);
  }

  function flushChapterDraft() {
    if (!project || !activeChapter) return;
    const draft = chapterDraftRef.current;
    if (!draft.id || draft.id !== activeChapter.id) return;
    if (
      draft.title === activeChapter.title &&
      draft.summary === activeChapter.summary &&
      draft.content === activeChapter.content
    ) {
      return;
    }

    updateProject((current) => ({
      ...current,
      volumes: current.volumes.map((volume) => ({
        ...volume,
        chapters: volume.chapters.map((chapter) =>
          chapter.id === draft.id
            ? {
                ...chapter,
                title: draft.title,
                summary: draft.summary,
                content: draft.content,
                updatedAt: new Date().toISOString(),
              }
            : chapter
        ),
      })),
    }));
  }

  function updateChapterDraft(field: 'title' | 'summary' | 'content', value: string) {
    setChapterDraft((current) => {
      if (!current.id) return current;
      if (current[field] === value) return current;
      return { ...current, [field]: value };
    });
    scheduleDraftCommit();
  }

  function handleSelectChapter(nextChapterId: string) {
    if (nextChapterId === activeChapterId) return;
    flushChapterDraft();
    setActiveChapterId(nextChapterId);
  }

  function handleSelectProject(nextProjectId: string) {
    if (!visibleProjects.some((item) => item.id === nextProjectId)) {
      return;
    }
    flushChapterDraft();
    setSelectedProjectId(nextProjectId);
    onProjectChange?.(nextProjectId);
    setMobileTab('editor');
  }

  function commit(nextProjects: WritingProject[], urgent = false) {
    projectsRef.current = nextProjects;
    saveSchedulerRef.current?.schedule(nextProjects);
    if (urgent) {
      setProjects(nextProjects);
      return;
    }
    startTransition(() => {
      setProjects(nextProjects);
    });
  }

  function updateProject(updater: (current: WritingProject) => WritingProject, options?: { urgent?: boolean }) {
    if (!project) return;
    const sourceProjects = projectsRef.current.length ? projectsRef.current : projects;
    commit(updateOne(sourceProjects, touched(updater(project))), options?.urgent);
  }

  function createProjectNow() {
    flushChapterDraft();
    const next = createWritingProject({
      title: newProject.title.trim() || (isNovelMode ? `未命名${novelTierMeta.label}项目` : `未命名${WRITING_TYPE_META[newProject.type].shortLabel}项目`),
      type: newProject.type,
      genre: newProject.genre.trim() || WRITING_TYPE_META[newProject.type].genreSuggestions[0] || '',
      premise: newProject.premise.trim() || '从这里写下故事的核心冲突、目标和钩子。',
    });
    commit([next, ...projectsRef.current], true);
    setSelectedProjectId(next.id);
    onProjectChange?.(next.id);
    setActiveChapterId(firstChapterId(next));
    setMobileTab('editor');
    setNewProject((current) => ({ title: '', type: current.type, genre: '', premise: '' }));
  }

  function saveProjectNow() {
    flushChapterDraft();
    const snapshot = projectsRef.current.length ? projectsRef.current : projects;
    saveWritingProjects(snapshot);
    setLastManualSaveAt(new Date().toISOString());
  }

  async function exportMarkdown() {
    if (!project) return;
    const text = exportProjectAsMarkdown(project);
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title || 'writing-project'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!project) {
    return (
      <div className="writing-shell min-h-screen pt-24">
        <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="glass-card rounded-[32px] p-8">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
              <div>
                <div className="section-kicker">{workspaceBadge}</div>
                <h1 className="mt-4 text-3xl font-black text-slate-900">{workspaceTitle}</h1>
                <p className="mt-3 text-sm leading-7 text-slate-600">{workspaceDescription}</p>
                {isNovelMode ? (
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    {(['short', 'medium', 'long'] as NovelLengthTier[]).map((tier) => {
                      const tierMeta = NOVEL_TIER_META[tier];
                      const active = tier === currentNovelTier;
                      return (
                        <Link
                          key={tier}
                          to={`${novelWorkspaceHref}&tier=${tier}`}
                          className={`rounded-[24px] border p-4 text-left transition ${active ? 'border-sky-300 bg-sky-50/80' : 'border-slate-200 bg-white/80 hover:bg-white'}`}
                        >
                          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{tierMeta.badge}</div>
                          <div className="mt-2 text-base font-bold text-slate-900">{tierMeta.label}</div>
                          <p className="mt-2 text-xs leading-6 text-slate-500">{tierMeta.note}</p>
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
                {!isNovelMode ? (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {workshopBadges.map((badge) => (
                      <span key={badge} className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                        {badge}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="mt-6 rounded-[24px] border border-white/70 bg-white/90 p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{workspaceModeLabel}</div>
              <div className="mt-2 text-lg font-bold text-slate-900">{currentCreationMeta.label}</div>
              <p className="mt-2 text-sm leading-7 text-slate-600">{currentCreationMeta.description}</p>
              {isNovelMode ? (
                <div className="mt-4 rounded-2xl bg-sky-50/80 px-4 py-4 text-sm leading-7 text-sky-900">
                  当前层级：{novelTierMeta.label}。{novelTierMeta.note}
                </div>
              ) : null}
              {!isNovelMode ? (
                <p className="mt-3 text-xs leading-6 text-slate-500">
                  这里不做零碎跳转，只服务剧本写作和分镜推进，让整条创作线保持统一、直接、利落。
                </p>
              ) : null}
                </div>
              </div>
              <div className="space-y-4">
                <div className="text-sm font-semibold text-slate-900">{createTitle}</div>
                <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600">
                  {isNovelMode
                    ? '创建后会直接点亮你的小说工作台，卷章树、正文和人物设定会一起开始沉淀。'
                    : '创建后会直接进入剧本工坊，把剧本写作或分镜推进真正跑起来。'}
                </div>
                <Field label={titleFieldLabel}>
                  <input value={newProject.title} onChange={(e) => setNewProject((s) => ({ ...s, title: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-red-300 focus:bg-white" placeholder={titlePlaceholder} />
                </Field>
                <Field label={typeFieldLabel}>
                  <select value={newProject.type} onChange={(e) => setNewProject((s) => ({ ...s, type: e.target.value as WritingProjectType }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-red-300 focus:bg-white">
                    {visibleTypeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </Field>
                <Field label={genreFieldLabel}>
                  <input value={newProject.genre} onChange={(e) => setNewProject((s) => ({ ...s, genre: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-red-300 focus:bg-white" placeholder={genrePlaceholder} />
                </Field>
                <Field label={premiseFieldLabel}>
                  <textarea rows={4} value={newProject.premise} onChange={(e) => setNewProject((s) => ({ ...s, premise: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-red-300 focus:bg-white" placeholder={premisePlaceholder} />
                </Field>
                <button type="button" onClick={createProjectNow} className="w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white">{createButtonLabel}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const projectPanel = (
    <div className="space-y-6">
      {isNovelMode ? (
        <section className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
              <div className="text-sm font-semibold text-slate-900">{novelTierMeta.label}推进刻度</div>
              <div className="mt-1 text-xs text-slate-500">根据章节、字数和当前阶段实时刷新，让你知道作品正在往哪里生长。</div>
              </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">{(novelProgress?.stageLabel ?? statusLabel) || '进行中'}</span>
          </div>
          <div className="mt-4 rounded-[24px] bg-slate-50 px-4 py-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{novelProgress?.nextHint ?? '继续推进正文与章节树。'}</span>
              <span>{novelProgress?.progress ?? 0}%</span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500" style={{ width: `${novelProgress?.progress ?? 0}%` }} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((item, index) => (
                <span
                  key={item.value}
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold ${index <= (novelProgress?.stageIndex ?? 0) ? 'bg-slate-900 text-white' : 'bg-white text-slate-500'}`}
                >
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {isNovelMode ? (
        <section className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">章节树</div>
              <div className="mt-1 text-xs text-slate-500">{structureDescription}</div>
            </div>
            <button
              type="button"
              onClick={() =>
                updateProject((p) => ({
                  ...p,
                  volumes: [...p.volumes, createWritingVolume(p.volumes.length + 1, p.type)],
                }))
              }
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm"
            >
              新增{meta.volumeLabel}
            </button>
          </div>
          <div className="writing-scroll mt-4 max-h-[360px] space-y-3 overflow-y-auto pr-1">
            {project.volumes.map((volume) => (
              <div key={volume.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <input
                    value={volume.title}
                    onChange={(e) =>
                      updateProject((p) => ({
                        ...p,
                        volumes: p.volumes.map((item) => (item.id === volume.id ? { ...item, title: e.target.value } : item)),
                      }))
                    }
                    className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold outline-none"
                  />
                  <span className="shrink-0 rounded-full bg-white px-3 py-1 text-[11px] text-slate-500">
                    {volume.chapters.length} 章
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={volume.summary}
                  onChange={(e) =>
                    updateProject((p) => ({
                      ...p,
                      volumes: p.volumes.map((item) => (item.id === volume.id ? { ...item, summary: e.target.value } : item)),
                    }))
                  }
                  className="mt-3 w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none"
                  placeholder={`${meta.volumeLabel}目标`}
                />
                <button
                  type="button"
                  onClick={() =>
                    updateProject((p) => ({
                      ...p,
                      volumes: p.volumes.map((item) =>
                        item.id === volume.id
                          ? { ...item, chapters: [...item.chapters, createWritingChapter(item.chapters.length + 1, p.type)] }
                          : item,
                      ),
                    }))
                  }
                  className="mt-3 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs"
                >
                  新增{meta.chapterLabel}
                </button>
                <div className="mt-3 space-y-2">
                  {volume.chapters.map((chapter, index) => (
                    <button
                      key={chapter.id}
                      type="button"
                      onClick={() => handleSelectChapter(chapter.id)}
                      className={`w-full rounded-2xl px-4 py-3 text-left ${chapter.id === activeChapter?.id ? 'bg-white ring-1 ring-sky-200' : 'bg-white/80'}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs text-slate-400">
                          {meta.chapterLabel} {index + 1}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {chapter.content ? `${chapter.content.length} 字符` : '待写'}
                        </div>
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">{chapter.title}</div>
                      <div className="mt-1 line-clamp-2 text-xs leading-6 text-slate-500">{chapter.summary || '还没有章节摘要，适合先写钩子和冲突走向。'}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {isNovelMode ? (
        <section className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">大纲导入</div>
              <div className="mt-1 text-xs text-slate-500">{outlineDescription}</div>
            </div>
            <button
              type="button"
              onClick={() => {
                flushChapterDraft();
                const volumes = parseOutlineText(outlineText, project.type);
                updateProject((p) => ({ ...p, outline: outlineText, volumes }));
                setActiveChapterId(volumes[0]?.chapters[0]?.id ?? '');
              }}
              className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white"
            >
              解析导入
            </button>
          </div>
          <textarea
            rows={8}
            value={outlineText}
            onChange={(e) => setOutlineText(e.target.value)}
            className="mt-4 w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 outline-none focus:border-red-300 focus:bg-white"
            placeholder={meta.outlineHint}
          />
        </section>
      ) : null}

      <section className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">{libraryTitle}</div>
            <div className="mt-1 text-xs text-slate-500">{libraryDescription}</div>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">{visibleProjects.length} 个</span>
        </div>
        <div className="writing-scroll mt-4 max-h-[300px] space-y-3 overflow-y-auto pr-1">
          {visibleProjects.map((item) => {
            const itemStats = getStatsSnapshot(item);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectProject(item.id)}
                className={`w-full rounded-[24px] border px-4 py-4 text-left ${item.id === project.id ? 'border-sky-200 bg-sky-50/80' : 'border-slate-200 bg-white'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] text-slate-500">
                    {STATUS_OPTIONS.find((status) => status.value === item.status)?.label ?? '进行中'}
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {WRITING_TYPE_META[item.type].shortLabel} · {item.genre || '未分类'}
                </div>
                <div className="mt-2 text-[11px] text-slate-400">更新 {formatDate(item.updatedAt)}</div>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-400">
                  <span>
                    {itemStats?.volumes ?? countProjectVolumes(item)} {WRITING_TYPE_META[item.type].volumeLabel}
                  </span>
                  <span>
                    {itemStats?.chapters ?? countProjectChapters(item)} {WRITING_TYPE_META[item.type].chapterLabel}
                  </span>
                  <span>
                    {itemStats?.words ?? countProjectWords(item)} {item.type === 'storyboard' ? '备注字数' : item.type === 'script' ? '台词/描述' : '字'}
                  </span>
                  <span>
                    {itemStats?.materials ?? item.materials.length} {item.type === 'storyboard' ? '视觉素材' : item.type === 'script' ? '排演素材' : '素材'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-sm">
        <div className="text-sm font-semibold text-slate-900">{quickCreateTitle}</div>
        <div className="mt-1 text-xs text-slate-500">{quickCreateDescription}</div>
        <div className="mt-4 space-y-3">
          <input
            value={newProject.title}
            onChange={(e) => setNewProject((s) => ({ ...s, title: e.target.value }))}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-red-300 focus:bg-white"
            placeholder={titlePlaceholder}
          />
          <select
            value={newProject.type}
            onChange={(e) => setNewProject((s) => ({ ...s, type: e.target.value as WritingProjectType }))}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-red-300 focus:bg-white"
          >
            {visibleTypeOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <button type="button" onClick={createProjectNow} className="w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
            {quickCreateButtonLabel}
          </button>
        </div>
      </section>
    </div>
  );

  const editorPanel = (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="section-kicker">{meta.label}</div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{statusLabel}</span>
              {isNovelMode ? (
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                  {novelTierMeta.badge}
                </span>
              ) : null}
              <span className="text-xs text-slate-400">更新 {formatDate(project.updatedAt)}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900">{project.title}</h1>
            <p className="text-sm leading-7 text-slate-500">{project.premise}</p>
            <p className="text-xs leading-6 text-slate-400">{meta.description}</p>
            {!isNovelMode ? (
              <div className="flex flex-wrap gap-2">
                {workshopBadges.map((badge) => (
                  <span key={badge} className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
                    {badge}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="grid w-full max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((item) => (
              <div key={item.label} className="rounded-2xl bg-slate-50 px-4 py-3 text-center">
                <div className="text-xs text-slate-500">{item.label}</div>
                <div className="mt-1 text-lg font-black text-slate-900">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
        {!isNovelMode ? (
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {workflowCards.map((card) => (
              <div key={card.label} className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-sm font-semibold text-slate-900">{card.label}</div>
                <div className="mt-2 text-xs leading-6 text-slate-500">{card.description}</div>
              </div>
            ))}
          </div>
        ) : null}
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={titleFieldLabel}>
              <input value={project.title} onChange={(e) => updateProject((p) => ({ ...p, title: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-red-300 focus:bg-white" placeholder={titlePlaceholder} />
            </Field>
            <Field label="状态">
                  <select value={project.status} onChange={(e) => updateProject((p) => ({ ...p, status: e.target.value as WritingProjectStatus }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-red-300 focus:bg-white">
                {STATUS_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </Field>
            <Field label={genreFieldLabel}>
              <textarea rows={2} value={project.genre} onChange={(e) => updateProject((p) => ({ ...p, genre: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-red-300 focus:bg-white" placeholder="题材 / 风格" />
            </Field>
            <Field label={tagFieldLabel}>
              <textarea rows={2} value={project.tags.join('，')} onChange={(e) => updateProject((p) => ({ ...p, tags: e.target.value.split(/[,\n，、]/).map((s) => s.trim()).filter(Boolean) }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-red-300 focus:bg-white" placeholder="标签" />
            </Field>
            <div className="md:col-span-2">
              <Field label={coverFieldLabel}>
                <textarea rows={2} value={project.coverImage} onChange={(e) => updateProject((p) => ({ ...p, coverImage: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-red-300 focus:bg-white" placeholder="封面图片 URL" />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label={meta.summaryLabel}>
                <textarea rows={3} value={project.description} onChange={(e) => updateProject((p) => ({ ...p, description: e.target.value, summary: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-red-300 focus:bg-white" placeholder={meta.summaryLabel} />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label={meta.worldviewLabel}>
                <textarea rows={4} value={project.worldview} onChange={(e) => updateProject((p) => ({ ...p, worldview: e.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-red-300 focus:bg-white" placeholder={meta.worldviewLabel} />
              </Field>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-[28px] p-6 text-white" style={project.coverImage ? { backgroundImage: `linear-gradient(180deg, rgba(15,23,42,.2), rgba(15,23,42,.75)), url(${project.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : buildCoverStyle(project.title || project.id, project.type)}>
              <div className="text-xs uppercase tracking-[0.18em] text-white/70">Cover</div>
              <div className="mt-8 text-3xl font-black leading-tight">{project.title}</div>
              <div className="mt-3 text-xs text-white/70">{WRITING_TYPE_META[project.type].shortLabel} · {project.genre || '未分类'}</div>
            </div>
            <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-sm">
              <div className="text-sm font-semibold text-slate-900">{isNovelMode ? '草稿保存状态' : '保存状态'}</div>
              <div className="mt-2 text-sm leading-7 text-slate-600">{saveDescription}</div>
              {isNovelMode ? (
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link to="/novels" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900">
                    返回小说工坊首页
                  </Link>
                  {projectDetailHref ? (
                    <Link to={projectDetailHref} className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
                      查看作品页
                    </Link>
                  ) : null}
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link to="/writing?type=script" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900">
                    剧本写作线
                  </Link>
                  <Link to="/writing?type=storyboard" className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
                    分镜线
                  </Link>
                </div>
              )}
            </div>
            <div className="grid gap-3">
              <button type="button" onClick={saveProjectNow} className="w-full rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900">
                立即保存
              </button>
              <button type="button" onClick={exportMarkdown} className="w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
                导出 Markdown
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 2xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-6">
          <section className="rounded-[30px] border border-white/70 bg-white/90 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-bold text-slate-900">{meta.volumeLabel}结构</div>
                <div className="mt-1 text-xs text-slate-500">{structureDescription}</div>
              </div>
              <button type="button" onClick={() => updateProject((p) => ({ ...p, volumes: [...p.volumes, createWritingVolume(p.volumes.length + 1, p.type)] }))} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm">新增{meta.volumeLabel}</button>
            </div>
            <div className="writing-scroll mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {project.volumes.map((volume) => (
                <div key={volume.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <input value={volume.title} onChange={(e) => updateProject((p) => ({ ...p, volumes: p.volumes.map((item) => item.id === volume.id ? { ...item, title: e.target.value } : item) }))} className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold outline-none" />
                  <textarea rows={2} value={volume.summary} onChange={(e) => updateProject((p) => ({ ...p, volumes: p.volumes.map((item) => item.id === volume.id ? { ...item, summary: e.target.value } : item) }))} className="mt-3 w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none" placeholder={`${meta.volumeLabel}目标`} />
                  <button type="button" onClick={() => updateProject((p) => ({ ...p, volumes: p.volumes.map((item) => item.id === volume.id ? { ...item, chapters: [...item.chapters, createWritingChapter(item.chapters.length + 1, p.type)] } : item) }))} className="mt-3 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs">新增{meta.chapterLabel}</button>
                  <div className="mt-3 space-y-2">
                    {volume.chapters.map((chapter, index) => (
                      <button key={chapter.id} type="button" onClick={() => handleSelectChapter(chapter.id)} className={`w-full rounded-2xl px-4 py-3 text-left ${chapter.id === activeChapter?.id ? 'bg-white ring-1 ring-sky-200' : 'bg-white/80'}`}>
                        <div className="text-xs text-slate-400">{meta.chapterLabel} {index + 1}</div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">{chapter.title}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[30px] border border-white/70 bg-white/90 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-bold text-slate-900">{outlineTitle}</div>
                <div className="mt-1 text-xs text-slate-500">{outlineDescription}</div>
              </div>
              <button type="button" onClick={() => { flushChapterDraft(); const volumes = parseOutlineText(outlineText, project.type); updateProject((p) => ({ ...p, outline: outlineText, volumes })); setActiveChapterId(volumes[0]?.chapters[0]?.id ?? ''); }} className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white">解析导入</button>
            </div>
            <textarea rows={8} value={outlineText} onChange={(e) => setOutlineText(e.target.value)} className="mt-4 w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 outline-none focus:border-red-300 focus:bg-white" placeholder={meta.outlineHint} />
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[30px] border border-white/70 bg-white/90 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-bold text-slate-900">{editorTitle}</div>
                <div className="mt-1 text-xs text-slate-500">{activeVolume?.title ? `${meta.volumeLabel}：${activeVolume.title}` : `未选择${meta.volumeLabel}`}</div>
              </div>
              <div className="text-xs text-slate-400">{activeChapter ? `${meta.chapterLabel}：${chapterDraft.title || activeChapter.title}` : `未选择${meta.chapterLabel}`}</div>
            </div>
            {activeChapter ? (
              <div className="mt-4 space-y-4">
                <Field label={`${meta.chapterLabel}标题`}>
                  <input value={chapterDraft.title} onChange={(e) => updateChapterDraft('title', e.target.value)} onBlur={flushChapterDraft} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-red-300 focus:bg-white" />
                </Field>
                <Field label={`${meta.chapterLabel}摘要`}>
                  <textarea rows={3} value={chapterDraft.summary} onChange={(e) => updateChapterDraft('summary', e.target.value)} onBlur={flushChapterDraft} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-red-300 focus:bg-white" placeholder={`${meta.chapterLabel}摘要`} />
                </Field>
                <Field label={chapterContentLabel}>
                  <textarea rows={18} value={chapterDraft.content} onChange={(e) => updateChapterDraft('content', e.target.value)} onBlur={flushChapterDraft} className="writing-scroll w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-8 outline-none focus:border-red-300 focus:bg-white" placeholder={chapterContentPlaceholder} />
                </Field>
              </div>
            ) : null}
          </section>

          <section className="rounded-[30px] border border-white/70 bg-white/90 p-5 shadow-sm">
            <div className="flex flex-wrap items-start gap-2">
              <div className="mr-auto">
                <div className="text-lg font-bold text-slate-900">{materialsTitle}</div>
                <div className="mt-1 text-xs text-slate-500">{materialsDescription}</div>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">{project.materials.length} 条</span>
            </div>
            {isNovelMode ? (
              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <div className="rounded-[26px] border border-sky-100 bg-sky-50/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">角色卡</div>
                      <div className="mt-1 text-xs text-slate-500">人物目标、性格、关系和成长线都在这里沉淀。</div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateProject((p) => ({
                          ...p,
                          materials: [...p.materials, createWritingMaterialItem('character', newMaterial.title || '新角色卡')],
                        }))
                      }
                      className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm"
                    >
                      新增角色卡
                    </button>
                  </div>
                  <input
                    value={newMaterial.title}
                    onChange={(e) => setNewMaterial((s) => ({ ...s, title: e.target.value }))}
                    className="mt-3 w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm outline-none"
                    placeholder="输入角色名或代号"
                  />
                  <div className="writing-scroll mt-4 max-h-[280px] space-y-3 overflow-y-auto pr-1">
                    {novelCharacterMaterials.map((material) => (
                      <div key={material.id} className="rounded-[24px] border border-white/80 bg-white p-4 shadow-sm">
                        <div className="text-xs text-slate-400">角色卡</div>
                        <input
                          value={material.title}
                          onChange={(e) =>
                            updateProject((p) => ({
                              ...p,
                              materials: p.materials.map((item) => (item.id === material.id ? { ...item, title: e.target.value } : item)),
                            }))
                          }
                          className="mt-2 w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold outline-none"
                        />
                        <textarea
                          rows={2}
                          value={material.summary}
                          onChange={(e) =>
                            updateProject((p) => ({
                              ...p,
                              materials: p.materials.map((item) => (item.id === material.id ? { ...item, summary: e.target.value } : item)),
                            }))
                          }
                          className="mt-3 w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm outline-none"
                          placeholder="性格、目标、关系"
                        />
                        <textarea
                          rows={3}
                          value={material.content}
                          onChange={(e) =>
                            updateProject((p) => ({
                              ...p,
                              materials: p.materials.map((item) => (item.id === material.id ? { ...item, content: e.target.value } : item)),
                            }))
                          }
                          className="mt-3 w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm outline-none"
                          placeholder="成长线、口头禅、冲突"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[26px] border border-sky-100 bg-sky-50/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">世界观卡</div>
                      <div className="mt-1 text-xs text-slate-500">制度、边界、历史、地点与规则统一归档。</div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateProject((p) => ({
                          ...p,
                          materials: [...p.materials, createWritingMaterialItem('world', newMaterial.title || '新世界观卡')],
                        }))
                      }
                      className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm"
                    >
                      新增世界观卡
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={project.worldview}
                    onChange={(e) => updateProject((p) => ({ ...p, worldview: e.target.value }))}
                    className="mt-3 w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm outline-none"
                    placeholder="先写世界观总纲，再拆分为规则、制度、地点和历史。"
                  />
                  <div className="writing-scroll mt-4 max-h-[280px] space-y-3 overflow-y-auto pr-1">
                    {novelWorldMaterials.map((material) => (
                      <div key={material.id} className="rounded-[24px] border border-white/80 bg-white p-4 shadow-sm">
                        <div className="text-xs text-slate-400">世界观卡</div>
                        <input
                          value={material.title}
                          onChange={(e) =>
                            updateProject((p) => ({
                              ...p,
                              materials: p.materials.map((item) => (item.id === material.id ? { ...item, title: e.target.value } : item)),
                            }))
                          }
                          className="mt-2 w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold outline-none"
                        />
                        <textarea
                          rows={2}
                          value={material.summary}
                          onChange={(e) =>
                            updateProject((p) => ({
                              ...p,
                              materials: p.materials.map((item) => (item.id === material.id ? { ...item, summary: e.target.value } : item)),
                            }))
                          }
                          className="mt-3 w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm outline-none"
                          placeholder="规则、历史、边界"
                        />
                        <textarea
                          rows={3}
                          value={material.content}
                          onChange={(e) =>
                            updateProject((p) => ({
                              ...p,
                              materials: p.materials.map((item) => (item.id === material.id ? { ...item, content: e.target.value } : item)),
                            }))
                          }
                          className="mt-3 w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm outline-none"
                          placeholder="详细设定、地理、制度、历史"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-4 flex flex-wrap items-start gap-2">
                  <input
                    value={newMaterial.title}
                    onChange={(e) => setNewMaterial((s) => ({ ...s, title: e.target.value }))}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm outline-none"
                    placeholder="素材标题"
                  />
                  <select
                    value={newMaterial.type}
                    onChange={(e) => setNewMaterial((s) => ({ ...s, type: e.target.value as WritingMaterialType }))}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm outline-none"
                  >
                    {MATERIAL_TYPE_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      updateProject((p) => ({
                        ...p,
                        materials: [...p.materials, createWritingMaterialItem(newMaterial.type, newMaterial.title || `新${materialTypeLabel(newMaterial.type)}`)],
                      }))
                    }
                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                  >
                    新增
                  </button>
                </div>
                <div className="writing-scroll mt-4 max-h-[340px] space-y-3 overflow-y-auto pr-1">
                  {project.materials.map((material) => (
                    <div key={material.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                      <div className="text-xs text-slate-400">{materialTypeLabel(material.type)}</div>
                      <input
                        value={material.title}
                        onChange={(e) =>
                          updateProject((p) => ({
                            ...p,
                            materials: p.materials.map((item) => (item.id === material.id ? { ...item, title: e.target.value } : item)),
                          }))
                        }
                        className="mt-2 w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold outline-none"
                      />
                      <textarea
                        rows={2}
                        value={material.summary}
                        onChange={(e) =>
                          updateProject((p) => ({
                            ...p,
                            materials: p.materials.map((item) => (item.id === material.id ? { ...item, summary: e.target.value } : item)),
                          }))
                        }
                        className="mt-3 w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none"
                        placeholder="内容摘要"
                      />
                      <textarea
                        rows={4}
                        value={material.content}
                        onChange={(e) =>
                          updateProject((p) => ({
                            ...p,
                            materials: p.materials.map((item) => (item.id === material.id ? { ...item, content: e.target.value } : item)),
                          }))
                        }
                        className="mt-3 w-full rounded-2xl bg-white px-4 py-3 text-sm outline-none"
                        placeholder="详细设定"
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </section>
    </div>
  );

  const assistantPanel = (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="section-kicker">{meta.assistantTitle}</div>
            <div className="mt-2 text-lg font-bold text-slate-900">{assistantPanelTitle}</div>
          </div>
          <div className="text-xs text-slate-400">更新 {formatDate(project.updatedAt)}</div>
        </div>
        <div className="mt-4 space-y-3">
          {checklist.map((item) => (
            <div key={item.label} className="flex items-start gap-3 rounded-[22px] bg-slate-50 px-4 py-4">
              <div className={`mt-1 h-4 w-4 rounded-full ${item.done ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <div className="text-sm leading-6 text-slate-600">{item.label}</div>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-bold text-slate-900">{suggestionsTitle}</div>
            <div className="mt-1 text-xs text-slate-500">{suggestionsDescription}</div>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">{suggestions.length} 条</span>
        </div>
        <div className="writing-scroll mt-4 max-h-[360px] space-y-3 overflow-y-auto pr-1">
          {suggestions.map((item) => (
            <div key={item.title} className="rounded-[22px] border border-slate-200 bg-slate-50/80 p-4">
              <div className="text-sm font-semibold text-slate-900">{item.title}</div>
              <p className="mt-2 text-sm leading-7 text-slate-600">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-sm">
        <div className="text-sm text-slate-500">{statusPanelTitle}</div>
        <div className="mt-2 text-lg font-bold text-slate-900">{statusLabel}</div>
        <div className="mt-1 text-xs text-slate-400">最后更新 {formatDate(project.updatedAt)}</div>
        {isNovelMode && novelProgress ? (
          <div className="mt-4 rounded-[24px] bg-slate-50 px-4 py-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{novelProgress.nextHint}</span>
              <span>{novelProgress.progress}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500" style={{ width: `${novelProgress.progress}%` }} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
              <span className="rounded-full bg-white px-3 py-1 text-slate-700">{project.volumes.length} 卷</span>
              <span className="rounded-full bg-white px-3 py-1 text-slate-700">{statsSnapshot?.chapters ?? 0} 章</span>
              <span className="rounded-full bg-white px-3 py-1 text-slate-700">{statsSnapshot?.words ?? 0} 字</span>
            </div>
          </div>
        ) : null}
        {isNovelMode ? (
          <p className="mt-3 text-sm leading-6 text-slate-600">
            当前小说会沿着卷章结构、正文推进和人物设定持续沉淀，随时可以接回这条创作线。
          </p>
        ) : (
          <p className="mt-3 text-sm leading-6 text-slate-600">
            当前工坊状态会随着剧本写作或分镜流程持续保存，让你每次回来都能立刻接上节奏。
          </p>
        )}
      </section>
    </div>
  );

  return (
    <div className="writing-shell min-h-screen pt-24">
      <div className="mx-auto max-w-[1700px] px-3 pb-16 sm:px-5 lg:px-8">
        {!isNovelMode ? (
          <section className="mb-5 grid gap-4 lg:grid-cols-2">
            {branchCards.map((card) => {
              const active = activeWorkspaceType === card.type;
              return (
                <button
                  key={card.type}
                  type="button"
                  onClick={() => setActiveWorkspaceType(card.type)}
                  className={`rounded-[28px] border p-5 text-left shadow-sm transition ${
                    active
                      ? card.type === 'storyboard'
                        ? 'border-sky-200 bg-sky-50/80'
                        : 'border-sky-200 bg-sky-50/80'
                      : 'border-white/70 bg-white/90 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-500">工坊分支</div>
                      <div className="mt-2 text-xl font-black text-slate-900">{card.title}</div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                        active
                          ? card.type === 'storyboard'
                            ? 'bg-sky-500 text-white'
                            : 'bg-sky-500 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {active ? '当前' : '切换'}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{card.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {card.chips.map((chip) => (
                      <span key={chip} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                        {chip}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 text-sm font-semibold text-slate-900">{card.cta}</div>
                </button>
              );
            })}
          </section>
        ) : null}

        <div className="mb-4 flex gap-2 xl:hidden">
          {mobileTabItems.map(([value, label]) => (
            <button key={value} type="button" onClick={() => setMobileTab(value as MobileTab)} className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold ${mobileTab === value ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="xl:hidden">
          {mobileTab === 'projects' ? projectPanel : null}
          {mobileTab === 'editor' ? editorPanel : null}
          {mobileTab === 'assistant' ? assistantPanel : null}
        </div>

        <div className="hidden gap-6 xl:grid xl:grid-cols-[320px_minmax(0,1fr)_320px]">
          <aside>{projectPanel}</aside>
          <main>{editorPanel}</main>
          <aside>{assistantPanel}</aside>
        </div>
      </div>
    </div>
  );
}
