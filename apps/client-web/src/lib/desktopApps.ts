import * as idb from './diskStorage';
import { getExperienceHighlights } from './agentExperienceBlueprints';
import { buildFrontendBundle, FRONTEND_BUNDLE_VERSION } from './frontendAppConverter';
import { injectStorageBridge } from './storageBridge';
import { isCurrentUserAdmin } from './userScopedStorage';
import type {
  DesktopAppDefinition,
  ExperienceProfileId,
  MobilePriority,
  DesktopSourceFile,
  GeneratedDesktopAppInput,
  NativeDesktopAppInput,
} from '@/types/desktopApp';

const DESKTOP_REGISTRY_FILE = 'desktop-apps/registry.json';
const DESKTOP_REGISTRY_LS_KEY = 'desktop-apps-registry';
const manifestStorageKey = (appId: string) => `desktop-apps-manifest:${appId}`;
const logDesktopApps = (...args: unknown[]) => {
  if (typeof window === 'undefined') return;
  // Debug-only logs for tracking missing app metadata and registry state.
  console.info('[desktopApps]', ...args);
};
const warnDesktopApps = (...args: unknown[]) => {
  if (typeof window === 'undefined') return;
  console.warn('[desktopApps]', ...args);
};

const ensureDesktopAppManagePermission = (): void => {
  if (!isCurrentUserAdmin()) {
    throw new Error('Only admin accounts can upload, edit, or remove desktop apps.');
  }
};

const createExperienceMetadata = (
  profileId: ExperienceProfileId,
  activationKeywords: string[],
  mobilePriority: MobilePriority,
) => ({
  experienceProfileId: profileId,
  experienceHighlights: getExperienceHighlights(profileId),
  activationKeywords,
  mobilePriority,
});

export const DESKTOP_APPS_CHANGED_EVENT = 'desktop-apps:changed';
const DESKTOP_STORAGE_SCOPE: idb.StorageScope = 'desktop-global';
const LEGACY_DESKTOP_STORAGE_SCOPE: idb.StorageScope = 'session-apps';

const buildStaticBundleRoute = (bundleName: string) => `/access/desktop-bundles/${bundleName}/index.html`;
const buildStaticAppRoute = (appName: string) => `/apps/${appName}/index.html`;

const normalizeStaticBundleRoute = (route?: string): string | undefined => {
  if (!route) {
    return route;
  }

  if (/^\/access\/desktop-bundles\//i.test(route)) {
    return route;
  }

  if (/^\/desktop-bundles\//i.test(route)) {
    return `/access${route}`;
  }

  return route;
};

const normalizeStaticBundleDefinition = (definition: DesktopAppDefinition): DesktopAppDefinition => {
  const normalizedRoute = normalizeStaticBundleRoute(definition.route);
  if (normalizedRoute === definition.route) {
    return definition;
  }

  return {
    ...definition,
    route: normalizedRoute,
  };
};

const decodeHtmlEntities = (value: string): string =>
  value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .trim();

const extractHtmlTitle = (html: string): string => {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeHtmlEntities(match[1]) : '';
};

const extractHtmlDescription = (html: string): string => {
  const match = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  return match ? decodeHtmlEntities(match[1]) : '';
};

const deriveNameFromPath = (files: DesktopSourceFile[]): string => {
  const firstPath = files.find((file) => file.path.trim().length > 0)?.path ?? '';
  if (!firstPath) return '';
  const parts = firstPath.split('/').filter(Boolean);
  if (parts.length > 1) return parts[0];
  return parts[0]?.replace(/\.[^/.]+$/, '') ?? '';
};

const resolveAppMeta = (
  input: GeneratedDesktopAppInput,
): { title: string; description: string } => {
  const trimmedTitle = input.title.trim();
  const trimmedDescription = input.description.trim();
  const htmlFile = input.sourceFiles.find((file) => file.path.toLowerCase().endsWith('.html'));
  const htmlTitle = htmlFile ? extractHtmlTitle(htmlFile.content) : '';
  const htmlDescription = htmlFile ? extractHtmlDescription(htmlFile.content) : '';
  const derivedName = deriveNameFromPath(input.sourceFiles);

  const resolved = {
    title: trimmedTitle || htmlTitle || derivedName || 'Untitled App',
    description: trimmedDescription || htmlDescription || '鏆傛棤鎻忚堪',
  };
  logDesktopApps('resolveAppMeta', {
    inputTitle: trimmedTitle,
    inputDescription: trimmedDescription,
    htmlFile: htmlFile?.path ?? '',
    htmlTitle,
    htmlDescription,
    derivedName,
    resolvedTitle: resolved.title,
    resolvedDescription: resolved.description,
  });
  return resolved;
};

const isBlankValue = (value: string): boolean => !value || value.trim().length === 0;
const isFallbackTitle = (value: string): boolean => isBlankValue(value) || value.trim() === 'Untitled App';
const isFallbackDescription = (value: string): boolean => isBlankValue(value) || value.trim() === '鏆傛棤鎻忚堪';

const deriveNameFromEntry = (entryFile?: string): string => {
  if (!entryFile) return '';
  const cleaned = entryFile.split('/').filter(Boolean).pop() ?? '';
  return cleaned.replace(/\.[^/.]+$/, '');
};

const resolveBundleMeta = (bundle: DesktopAppDefinition['bundle']): { title: string; description: string } => {
  if (!bundle) {
    return { title: 'Untitled App', description: 'No description yet' };
  }

  const htmlTitle = bundle.html ? extractHtmlTitle(bundle.html) : '';
  const htmlDescription = bundle.html ? extractHtmlDescription(bundle.html) : '';
  const derivedName = Array.isArray(bundle.files) && bundle.files.length > 0
    ? deriveNameFromPath(bundle.files)
    : deriveNameFromEntry(bundle.entryFile);

  const resolved = {
    title: htmlTitle || derivedName || 'Untitled App',
    description: htmlDescription || '鏆傛棤鎻忚堪',
  };
  logDesktopApps('resolveBundleMeta', {
    htmlTitle,
    htmlDescription,
    derivedName,
    entryFile: bundle.entryFile,
    files: Array.isArray(bundle.files) ? bundle.files.length : 0,
    resolvedTitle: resolved.title,
    resolvedDescription: resolved.description,
  });
  return resolved;
};

interface DesktopRegistryState {
  appIds: string[];
  updatedAt: number;
}

const readRegistryFromLocalStorage = (): DesktopRegistryState | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(DESKTOP_REGISTRY_LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DesktopRegistryState;
    if (!parsed || !Array.isArray(parsed.appIds)) return null;
    return { appIds: parsed.appIds, updatedAt: parsed.updatedAt ?? 0 };
  } catch {
    return null;
  }
};

const writeRegistryToLocalStorage = (state: DesktopRegistryState): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DESKTOP_REGISTRY_LS_KEY, JSON.stringify(state));
  } catch {
    // ignore localStorage failures
  }
};

const readManifestFromLocalStorage = (appId: string): DesktopAppDefinition | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(manifestStorageKey(appId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DesktopAppDefinition;
    return isDesktopAppDefinition(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const writeManifestToLocalStorage = (definition: DesktopAppDefinition): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(manifestStorageKey(definition.id), JSON.stringify(definition));
  } catch {
    // ignore localStorage failures
  }
};

const deleteManifestFromLocalStorage = (appId: string): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(manifestStorageKey(appId));
  } catch {
    // ignore
  }
};

export const DESKTOP_ICON_OPTIONS = [
  'LayoutGrid',
  'Code2',
  'Globe2',
  'BookOpen',
  'MessageSquare',
  'Sparkles',
  'WandSparkles',
  'Folder',
  'Terminal',
  'Settings',
  'Bot',
  'Package',
  'ShoppingBag',
  'Camera',
  'Music4',
  'Gamepad2',
  'NotebookPen',
  'Briefcase',
  'BarChart3',
  'Image',
  'FileText',
  'Palette',
  'Shield',
  'HeartPulse',
] as const;

const BUILTIN_DESKTOP_APPS: DesktopAppDefinition[] = [
  {
    id: 'finder',
    title: '应用库',
    description: '浏览桌面应用、接入项和系统工具。',
    icon: 'Folder',
    color: '#5b8cff',
    width: 920,
    height: 620,
    kind: 'system',
    runtime: 'component',
    componentKey: 'finder',
  },
  {
    id: 'terminal',
    title: '运行状态',
    description: '查看运行状态、窗口和快捷操作。',
    icon: 'Terminal',
    color: '#2d3647',
    width: 860,
    height: 520,
    kind: 'system',
    runtime: 'component',
    componentKey: 'terminal',
  },
  {
    id: 'settings',
    title: '系统设置',
    description: 'Manage desktop appearance, behavior, and runtime preferences.',
    icon: 'Settings',
    color: '#8c919c',
    width: 880,
    height: 620,
    kind: 'system',
    runtime: 'component',
    componentKey: 'settings',
  },
  {
    id: 'kui-chat',
    title: '聊天',
    description: 'Role chat, context exchange, and message workflow workspace.',
    icon: 'MessageSquare',
    color: '#5f7cff',
    width: 980,
    height: 680,
    kind: 'special',
    runtime: 'component',
    componentKey: 'chat-panel',
    ...createExperienceMetadata('chat', ['chat', 'message', 'conversation', 'roleplay'], 'primary'),
  },
  {
    id: 'ai-agent',
    title: '智能体',
    description: '管理智能体、任务和工具链。',
    icon: 'Bot',
    color: '#15a6a1',
    width: 960,
    height: 680,
    kind: 'special',
    runtime: 'component',
    componentKey: 'agent-sidebar',
    ...createExperienceMetadata('agent', ['agent', 'task', 'workflow', 'delegate'], 'primary'),
  },
  {
    id: 'frontend-converter',
    title: '应用接入',
    description: '接入网页、本地程序和展示页。',
    icon: 'WandSparkles',
    color: '#ff8e5f',
    width: 1120,
    height: 760,
    kind: 'special',
    runtime: 'component',
    componentKey: 'frontend-converter',
    tags: ['converter', 'builder'],
  },
  {
    id: 'calendar-app',
    title: '日历',
    description: 'View today, this month, and desktop time rhythm in one panel.',
    icon: 'CalendarDays',
    color: '#4f8cff',
    width: 760,
    height: 560,
    kind: 'system',
    runtime: 'component',
    componentKey: 'calendar-panel',
  },
  {
    id: 'tasks-app',
    title: '任务',
    description: '查看当前事项和进度。',
    icon: 'ListTodo',
    color: '#f2a93b',
    width: 820,
    height: 600,
    kind: 'system',
    runtime: 'component',
    componentKey: 'tasks-panel',
  },
  {
    id: 'alarms-app',
    title: '闹钟提醒',
    description: 'Manage reminders, checks, schedules, and pending moments.',
    icon: 'AlarmClock',
    color: '#ff7f66',
    width: 760,
    height: 540,
    kind: 'system',
    runtime: 'component',
    componentKey: 'alarms-panel',
  },
  {
    id: 'notes-app',
    title: '便签',
    description: 'Capture current goals, notes, and desktop reminders.',
    icon: 'StickyNote',
    color: '#6ac8a8',
    width: 760,
    height: 560,
    kind: 'system',
    runtime: 'component',
    componentKey: 'notes-panel',
  },
  {
    id: 'opencode-gui',
    title: 'OpenCode 桌面门户',
    description: 'Graphical OpenCode launcher for navigation, preview, and dispatch.',
    icon: 'LayoutGrid',
    color: '#5f8bff',
    width: 1240,
    height: 860,
    kind: 'legacy',
    runtime: 'static-web',
    route: buildStaticBundleRoute('opencode-gui'),
    tags: ['imported', 'static-web', 'gui', 'launcher'],
  },
  {
    id: 'opencode-cli',
    title: 'OpenCode CLI Workspace',
    description: 'Command-line OpenCode workspace for commands, status, and terminal flows.',
    icon: 'Terminal',
    color: '#2f3947',
    width: 1160,
    height: 800,
    kind: 'legacy',
    runtime: 'static-web',
    route: buildStaticBundleRoute('opencode-cli'),
    tags: ['imported', 'static-web', 'cli', 'terminal'],
  },
  {
    id: 'clawx-gui',
    title: 'ClawX Workspace',
    description: 'ClawX graphical desktop workspace integrated as a standalone app.',
    icon: 'Code2',
    color: '#00b3a6',
    width: 1280,
    height: 860,
    kind: 'legacy',
    runtime: 'static-web',
    route: buildStaticBundleRoute('clawx-gui'),
    tags: ['imported', 'static-web', 'clawx', 'gui'],
  },
  {
    id: 'webChat',
    title: '智能体编辑器',
    description: '编辑智能体、提示词和工作流。',
    icon: 'Bot',
    color: '#7b66ff',
    width: 1220,
    height: 820,
    kind: 'legacy',
    runtime: 'static-web',
    route: buildStaticBundleRoute('agent-creator'),
    tags: ['imported', 'static-web', 'creative'],
    ...createExperienceMetadata('agent', ['agent', 'creator', 'workflow', 'prompt'], 'secondary'),
  },
  {
    id: 'codeEditor',
    title: '代码编辑器',
    description: '编辑、预览、运行和调试代码。',
    icon: 'Code2',
    color: '#007acc',
    width: 1280,
    height: 860,
    kind: 'legacy',
    runtime: 'static-web',
    route: buildStaticBundleRoute('code-editor'),
    tags: ['imported', 'static-web', 'ide', 'edit'],
    ...createExperienceMetadata('code-edit', ['code', 'editor', 'edit', 'debug', 'patch'], 'secondary'),
  },
  {
    id: 'short-book-lab',
    title: '短篇拆书',
    description: '短篇内容拆解和阅读分析。',
    icon: 'BookOpen',
    color: '#f3a43b',
    width: 1180,
    height: 800,
    kind: 'legacy',
    runtime: 'static-web',
    route: buildStaticBundleRoute('short-book-lab'),
    tags: ['imported', 'static-web', 'reading'],
    ...createExperienceMetadata('writing', ['writing', 'reading', 'analysis', 'chapter'], 'primary'),
  },
  {
    id: 'medium-short',
    title: '中短篇创作',
    description: '进入中篇创作、RAG 上下文、阅读中心与三层记忆工作区。',
    icon: 'NotebookPen',
    color: '#3498db',
    width: 1240,
    height: 840,
    kind: 'legacy',
    runtime: 'static-web',
    route: buildStaticAppRoute('medium-short'),
    tags: ['imported', 'static-web', 'writing', 'medium-short', 'novella'],
    ...createExperienceMetadata('writing', ['writing', 'medium', 'novella', 'reader', 'rag'], 'primary'),
  },
  {
    id: 'fenghuang',
    title: '凤煌创作',
    description: '打开完整体、短篇、中长篇、卡牌与融合方案。',
    icon: 'Sparkles',
    color: '#ff6a3d',
    width: 1260,
    height: 840,
    kind: 'special',
    runtime: 'static-web',
    route: buildStaticAppRoute('fenghuang'),
    tags: ['imported', 'static-web', 'fenghuang', 'creative-suite', 'writing-suite'],
    ...createExperienceMetadata('fenghuang', ['fenghuang', 'phoenix', 'suite', 'creative', 'writing'], 'primary'),
  },
  {
    id: 'fenghuang-early',
    title: '凤煌早期合集',
    description: 'Static desktop packaging for the early Phoenix creative suite.',
    icon: 'Sparkles',
    color: '#ff6a3d',
    width: 1260,
    height: 840,
    kind: 'legacy',
    runtime: 'static-web',
    route: buildStaticBundleRoute('phoenix-early'),
    tags: ['imported', 'static-web', 'creative-suite', 'phoenix-early', '鍑ゅ嚢鏃╂湡鍒涗笘鍚堥泦'],
    ...createExperienceMetadata('fenghuang', ['fenghuang', 'phoenix', 'suite', 'creative', 'phoenix-early'], 'primary'),
  },
  {
    id: 'html-vault',
    title: 'HTML Vault',
    description: 'Unified desktop showcase for the D:\\HTML project library.',
    icon: 'Package',
    color: '#5ab8ff',
    width: 1320,
    height: 860,
    kind: 'legacy',
    runtime: 'static-web',
    route: buildStaticBundleRoute('html-vault'),
    tags: ['imported', 'static-web', 'html-vault', 'showcase', 'content-library'],
    ...createExperienceMetadata('writing', ['html', 'vault', 'showcase', 'content', 'library'], 'secondary'),
  },
  {
    id: 'diary',
    title: '日记',
    description: 'Diary and writing space.',
    icon: 'BookOpen',
    color: '#faea5f',
    width: 880,
    height: 480,
    kind: 'legacy',
    runtime: 'component',
    componentKey: 'diary',
  },
];

const parseJson = <T>(value: unknown, fallback: T): T => {
  if (!value) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
};

const isDesktopAppDefinition = (value: unknown): value is DesktopAppDefinition => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<DesktopAppDefinition>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.description === 'string' &&
    typeof candidate.icon === 'string' &&
    typeof candidate.color === 'string' &&
    typeof candidate.width === 'number' &&
    typeof candidate.height === 'number' &&
    typeof candidate.kind === 'string' &&
    typeof candidate.runtime === 'string'
  );
};

const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

const getExecutableDirectory = (value: string): string => {
  const normalized = value.replace(/[\\/]+/g, '\\');
  const idx = normalized.lastIndexOf('\\');
  return idx < 0 ? '' : normalized.slice(0, idx);
};

const manifestPath = (appId: string) => `desktop-apps/apps/${appId}/manifest.json`;

async function readRegistryForScope(scope: idb.StorageScope): Promise<DesktopRegistryState> {
  const data = await idb.getScopedFile(DESKTOP_REGISTRY_FILE, scope);
  const parsed = parseJson<DesktopRegistryState>(data, { appIds: [], updatedAt: 0 });
  logDesktopApps('readRegistryForScope', { scope, parsed });
  return {
    appIds: Array.isArray(parsed.appIds) ? parsed.appIds : [],
    updatedAt: parsed.updatedAt ?? 0,
  };
}

async function readRegistry(): Promise<DesktopRegistryState> {
  const [globalRegistry, legacyRegistry] = await Promise.all([
    readRegistryForScope(DESKTOP_STORAGE_SCOPE),
    readRegistryForScope(LEGACY_DESKTOP_STORAGE_SCOPE),
  ]);

  const merged = {
    appIds: Array.from(new Set([...globalRegistry.appIds, ...legacyRegistry.appIds])),
    updatedAt: Math.max(globalRegistry.updatedAt, legacyRegistry.updatedAt),
  };
  const localFallback = readRegistryFromLocalStorage();
  if (merged.appIds.length === 0 && merged.updatedAt === 0 && localFallback) {
    logDesktopApps('readRegistry fallback to localStorage', localFallback);
    return localFallback;
  }
  if (localFallback && localFallback.updatedAt > merged.updatedAt) {
    const combined = {
      appIds: Array.from(new Set([...merged.appIds, ...localFallback.appIds])),
      updatedAt: localFallback.updatedAt,
    };
    logDesktopApps('readRegistry merged with localStorage', combined);
    return combined;
  }
  logDesktopApps('readRegistry merged', merged);
  return merged;
}

async function writeRegistry(state: DesktopRegistryState): Promise<void> {
  try {
    await idb.putScopedTextFilesByJSON({
      files: [
        {
          path: 'desktop-apps',
          name: 'registry.json',
          content: JSON.stringify(state, null, 2),
        },
      ],
    }, DESKTOP_STORAGE_SCOPE);
  } catch (error) {
    warnDesktopApps('writeRegistry failed for desktop-global, falling back to session-apps/localStorage', { error });
  }
  try {
    await idb.putScopedTextFilesByJSON({
      files: [
        {
          path: 'desktop-apps',
          name: 'registry.json',
          content: JSON.stringify(state, null, 2),
        },
      ],
    }, LEGACY_DESKTOP_STORAGE_SCOPE);
  } catch (error) {
    warnDesktopApps('writeRegistry failed for session-apps, falling back to localStorage', { error });
  }
  writeRegistryToLocalStorage(state);
}

function notifyDesktopAppsChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DESKTOP_APPS_CHANGED_EVENT));
  }
}

async function readInstalledManifest(appId: string): Promise<DesktopAppDefinition | null> {
  const globalManifest = await idb.getScopedFile(manifestPath(appId), DESKTOP_STORAGE_SCOPE);
  const parsedGlobal = parseJson<DesktopAppDefinition | null>(globalManifest, null);
  if (isDesktopAppDefinition(parsedGlobal)) {
    logDesktopApps('readInstalledManifest', { appId, scope: DESKTOP_STORAGE_SCOPE, found: true });
    return parsedGlobal;
  }

  const legacyManifest = await idb.getScopedFile(manifestPath(appId), LEGACY_DESKTOP_STORAGE_SCOPE);
  const parsedLegacy = parseJson<DesktopAppDefinition | null>(legacyManifest, null);
  if (isDesktopAppDefinition(parsedLegacy)) {
    logDesktopApps('readInstalledManifest', { appId, scope: LEGACY_DESKTOP_STORAGE_SCOPE, found: true });
    return parsedLegacy;
  }
  const localManifest = readManifestFromLocalStorage(appId);
  if (localManifest) {
    logDesktopApps('readInstalledManifest', { appId, scope: 'localStorage', found: true });
    return localManifest;
  }
  warnDesktopApps('readInstalledManifest not found', { appId });
  return null;
}

async function maybeUpgradeGeneratedBundle(definition: DesktopAppDefinition): Promise<DesktopAppDefinition> {
  if (definition.runtime !== 'generated-web' || !definition.bundle) {
    return definition;
  }

  let nextDefinition: DesktopAppDefinition = definition;
  let nextBundle = definition.bundle;
  let changed = false;

  const bridgedNotes = [...(nextBundle.notes ?? [])];
  const bridgedHtml = injectStorageBridge(nextBundle.html, bridgedNotes);
  if (bridgedHtml !== nextBundle.html) {
    nextBundle = { ...nextBundle, html: bridgedHtml, notes: bridgedNotes };
    changed = true;
  }

  const hasSourceFiles = Array.isArray(nextBundle.files) && nextBundle.files.length > 0;

  if (hasSourceFiles && nextBundle.compilerVersion !== FRONTEND_BUNDLE_VERSION) {
    try {
      nextBundle = await buildFrontendBundle(nextBundle.files, definition.title);
      changed = true;
    } catch (error) {
      console.warn('[desktopApps] failed to upgrade bundle:', error);
    }
  }

  const resolvedMeta = resolveBundleMeta(nextBundle);
  if (isFallbackTitle(nextDefinition.title) && resolvedMeta.title) {
    nextDefinition = { ...nextDefinition, title: resolvedMeta.title };
    changed = true;
  }
  if (isFallbackDescription(nextDefinition.description) && resolvedMeta.description) {
    nextDefinition = { ...nextDefinition, description: resolvedMeta.description };
    changed = true;
  }
  if (isFallbackTitle(nextDefinition.title) || isFallbackDescription(nextDefinition.description)) {
    warnDesktopApps('bundle meta fallback persists', {
      appId: definition.id,
      title: nextDefinition.title,
      description: nextDefinition.description,
      entryFile: nextBundle.entryFile,
      compilerVersion: nextBundle.compilerVersion,
      files: Array.isArray(nextBundle.files) ? nextBundle.files.length : 0,
    });
  }

  if (changed) {
    const upgraded: DesktopAppDefinition = { ...nextDefinition, bundle: nextBundle };
    await writeInstalledManifest(upgraded);
    return upgraded;
  }

  return nextDefinition;
}

async function writeInstalledManifest(definition: DesktopAppDefinition): Promise<void> {
  try {
    await idb.putScopedTextFilesByJSON({
      files: [
        {
          path: `desktop-apps/apps/${definition.id}`,
          name: 'manifest.json',
          content: JSON.stringify(definition, null, 2),
        },
      ],
    }, DESKTOP_STORAGE_SCOPE);
  } catch (error) {
    warnDesktopApps('writeInstalledManifest failed for desktop-global, falling back to session-apps/localStorage', { appId: definition.id, error });
  }
  try {
    await idb.putScopedTextFilesByJSON({
      files: [
        {
          path: `desktop-apps/apps/${definition.id}`,
          name: 'manifest.json',
          content: JSON.stringify(definition, null, 2),
        },
      ],
    }, LEGACY_DESKTOP_STORAGE_SCOPE);
  } catch (error) {
    warnDesktopApps('writeInstalledManifest failed for session-apps, falling back to localStorage', { appId: definition.id, error });
  }
  writeManifestToLocalStorage(definition);
}

export function getBuiltinDesktopApps(): DesktopAppDefinition[] {
  return BUILTIN_DESKTOP_APPS;
}

export async function getInstalledDesktopApps(): Promise<DesktopAppDefinition[]> {
  const registry = await readRegistry();
  const apps: DesktopAppDefinition[] = [];

  for (const appId of registry.appIds) {
    const manifest = await readInstalledManifest(appId);
    if (manifest) {
      const upgraded = await maybeUpgradeGeneratedBundle(manifest);
      apps.push(normalizeStaticBundleDefinition(upgraded));
    }
  }

  logDesktopApps('getInstalledDesktopApps result', { count: apps.length, ids: apps.map((app) => app.id) });
  return apps;
}

export async function loadDesktopApps(): Promise<DesktopAppDefinition[]> {
  const installed = await getInstalledDesktopApps();
  const combined = [...BUILTIN_DESKTOP_APPS, ...installed].map(normalizeStaticBundleDefinition);
  logDesktopApps('loadDesktopApps', { builtin: BUILTIN_DESKTOP_APPS.length, installed: installed.length, total: combined.length });
  return combined;
}

export async function installGeneratedDesktopApp(
  input: GeneratedDesktopAppInput,
): Promise<DesktopAppDefinition> {
  ensureDesktopAppManagePermission();
  const resolvedMeta = resolveAppMeta(input);
  logDesktopApps('installGeneratedDesktopApp input', {
    title: resolvedMeta.title,
    description: resolvedMeta.description,
    files: input.sourceFiles.length,
  });
  const bundle = await buildFrontendBundle(input.sourceFiles, resolvedMeta.title);
  const appId = `generated-${slugify(resolvedMeta.title) || 'app'}-${Date.now().toString(36)}`;

  const definition: DesktopAppDefinition = {
    id: appId,
    title: resolvedMeta.title,
    description: resolvedMeta.description,
    icon: input.icon,
    color: input.color,
    width: input.width,
    height: input.height,
    kind: 'generated',
    runtime: 'generated-web',
    installedAt: Date.now(),
    bundle,
    tags: ['generated', 'frontend'],
  };

  const registry = await readRegistry();
  const nextRegistry: DesktopRegistryState = {
    appIds: [appId, ...registry.appIds.filter((id) => id !== appId)],
    updatedAt: Date.now(),
  };

  await writeInstalledManifest(definition);
  await writeRegistry(nextRegistry);
  notifyDesktopAppsChanged();
  logDesktopApps('installGeneratedDesktopApp done', { appId, title: definition.title });
  return definition;
}

export async function installNativeExecutableApp(
  input: NativeDesktopAppInput,
): Promise<DesktopAppDefinition> {
  ensureDesktopAppManagePermission();
  logDesktopApps('installNativeExecutableApp input', { title: input.title, executablePath: input.executablePath });
  const appId = `native-${slugify(input.title) || 'app'}-${Date.now().toString(36)}`;
  const trimmedExecutablePath = input.executablePath.trim();
  const resolvedWorkingDirectory = input.workingDirectory?.trim() || getExecutableDirectory(trimmedExecutablePath) || undefined;

  const notes = [
    'Packaged from a local EXE program.',
    'The desktop saves the launch entry, working directory, and description.',
  ];

  if (input.launcherPath?.trim()) {
    notes.push('Using a launcher path first is recommended for later migration and management.');
  }

  const definition: DesktopAppDefinition = {
    id: appId,
    title: input.title,
    description: input.description,
    icon: input.icon,
    color: input.color,
    width: input.width,
    height: input.height,
    kind: 'generated',
    runtime: 'native-exe',
    installedAt: Date.now(),
    tags: ['generated', 'native-exe', 'external-app'],
    native: {
      executablePath: trimmedExecutablePath,
      workingDirectory: resolvedWorkingDirectory,
      launcherPath: input.launcherPath?.trim() || undefined,
      sourceRoot: input.sourceRoot?.trim() || undefined,
      launchArgs: input.launchArgs?.filter(Boolean) ?? [],
      notes,
    },
  };

  const registry = await readRegistry();
  const nextRegistry: DesktopRegistryState = {
    appIds: [appId, ...registry.appIds.filter((id) => id !== appId)],
    updatedAt: Date.now(),
  };

  await writeInstalledManifest(definition);
  await writeRegistry(nextRegistry);
  notifyDesktopAppsChanged();
  logDesktopApps('installNativeExecutableApp done', { appId, title: definition.title });
  return definition;
}

export async function updateInstalledDesktopApp(
  appId: string,
  updates: Partial<DesktopAppDefinition>,
): Promise<DesktopAppDefinition> {
  ensureDesktopAppManagePermission();
  logDesktopApps('updateInstalledDesktopApp', { appId, updates: Object.keys(updates) });
  const current = await readInstalledManifest(appId);

  if (!isDesktopAppDefinition(current)) {
    throw new Error(`鏈壘鍒板簲鐢細${appId}`);
  }

  const nextDefinition: DesktopAppDefinition = {
    ...current,
    ...updates,
    id: current.id,
    installedAt: current.installedAt ?? Date.now(),
    bundle: updates.bundle ?? current.bundle,
    native: updates.native ?? current.native,
    tags: updates.tags ?? current.tags,
  };

  const registry = await readRegistry();
  const nextRegistry: DesktopRegistryState = {
    appIds: registry.appIds.includes(appId) ? registry.appIds : [appId, ...registry.appIds],
    updatedAt: Date.now(),
  };

  await writeInstalledManifest(nextDefinition);
  await writeRegistry(nextRegistry);
  notifyDesktopAppsChanged();
  logDesktopApps('updateInstalledDesktopApp done', { appId });
  return nextDefinition;
}

export async function uninstallGeneratedDesktopApp(appId: string): Promise<void> {
  ensureDesktopAppManagePermission();
  logDesktopApps('uninstallGeneratedDesktopApp', { appId });
  const registry = await readRegistry();
  const nextRegistry: DesktopRegistryState = {
    appIds: registry.appIds.filter((id) => id !== appId),
    updatedAt: Date.now(),
  };

  await Promise.all([
    idb.deleteScopedFilesByPaths({
      file_paths: [manifestPath(appId)],
    }, DESKTOP_STORAGE_SCOPE).catch(() => undefined),
    idb.deleteScopedFilesByPaths({
      file_paths: [manifestPath(appId)],
    }, LEGACY_DESKTOP_STORAGE_SCOPE).catch(() => undefined),
  ]);
  deleteManifestFromLocalStorage(appId);
  await writeRegistry(nextRegistry);
  notifyDesktopAppsChanged();
  logDesktopApps('uninstallGeneratedDesktopApp done', { appId });
}

export function createGeneratedSourceFiles(
  files: Array<{ path: string; content: string }>,
): DesktopSourceFile[] {
  return files.map((file) => ({
    path: file.path.replace(/\\/g, '/').replace(/^\.?\//, ''),
    content: file.content,
    language: file.path.endsWith('.html')
      ? 'html'
      : file.path.endsWith('.css')
        ? 'css'
        : file.path.endsWith('.ts') || file.path.endsWith('.tsx')
          ? 'typescript'
          : file.path.endsWith('.json')
            ? 'json'
            : file.path.endsWith('.js') || file.path.endsWith('.jsx')
              ? 'javascript'
              : 'text',
  }));
}
