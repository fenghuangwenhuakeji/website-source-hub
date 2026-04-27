import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlarmClock,
  BarChart3,
  Battery,
  Briefcase,
  Bell,
  Camera,
  BookOpen,
  Bot,
  CalendarDays,
  Code2,
  Check,
  ChevronLeft,
  FileText,
  EllipsisVertical,
  Folder,
  Globe2,
  Gamepad2,
  HeartPulse,
  Image as ImageIcon,
  LayoutGrid,
  ListTodo,
  LogIn,
  Maximize2,
  MessageSquare,
  Minus,
  MoonStar,
  Package,
  Music4,
  NotebookPen,
  Palette,
  Search,
  Settings,
  Sparkles,
  StickyNote,
  SunMedium,
  ShoppingBag,
  Terminal,
  Trash2,
  UserPlus,
  WandSparkles,
  Shield,
  Wifi,
  X,
} from 'lucide-react';
import styles from './index.module.scss';
import ChatPanel from '../ChatPanel';
import AgentSidebar from '../AgentSidebar';
import Diary from '../Diary';
import FrontendAppConverter from '../FrontendAppConverter';
import {
  DESKTOP_APPS_CHANGED_EVENT,
  launchNativeApp,
  loadDesktopApps,
  uninstallGeneratedDesktopApp,
  updateInstalledDesktopApp,
  type DesktopAppDefinition,
} from '@/lib';
import { buildRouterPath } from '@/lib/routerBase';
import { buildAcceptanceAwarePath } from '@/lib/acceptanceMode';
import { applyThemeMode, resolveThemeMode, setPreferredThemeMode, subscribeThemeMode } from '@/lib/themePreference';
import { readScopedStorageValue, writeScopedStorageValue } from '@/lib/userScopedStorage';

const GeneratedDesktopAppFrame = React.lazy(() => import('../GeneratedDesktopAppFrame'));

type WindowState = {
  id: string;
  appId: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
  active: boolean;
  prevSize?: { x: number; y: number; width: number; height: number };
};

type TaskItem = { id: string; title: string; tag: string; done: boolean };
type AlarmItem = { id: string; label: string; time: string; enabled: boolean };
type NoteItem = { id: string; title: string; body: string };
type MobileTabId = 'home' | 'chat' | 'agents' | 'settings';
type EmbeddedToolMetric = { label: string; value: string | number };
type DesktopNotice = { kind: 'success' | 'error'; text: string };
type FinderSectionId = 'all' | 'workspace' | 'system' | 'external' | 'active';
type LauncherItem = {
  app: DesktopAppDefinition;
  id: string;
  title: string;
  description: string;
  typeLabel: string;
  statusLabel: string;
  groupLabel: string;
  groupId: LauncherGroupFilter;
  isReady: boolean;
};
type LauncherGroupFilter = 'all' | 'core' | 'imported' | 'utility' | 'recent';
type DesktopPreferences = {
  notificationsEnabled: boolean;
  touchPriority: boolean;
  compactLayout: boolean;
  reducedMotion: boolean;
  autoHideDock: boolean;
};
type TerminalEntryTone = 'command' | 'output' | 'error' | 'hint';
type TerminalEntry = {
  id: string;
  tone: TerminalEntryTone;
  content: string;
};

type MacOSDesktopProps = {
  onOpenRecharge?: () => void;
};

const CORE_DOCK_APP_IDS = [
  'finder',
  'terminal',
  'settings',
  'kui-chat',
  'ai-agent',
  'frontend-converter',
  'calendar-app',
  'tasks-app',
  'alarms-app',
  'notes-app',
  'diary',
] as const;
const CORE_ENTRY_APP_IDS = [
  'kui-chat',
  'ai-agent',
  'frontend-converter',
  'codeEditor',
  'webChat',
  'short-book-lab',
  'html-vault',
  'fenghuang',
  'settings',
] as const;
const MOBILE_HOME_UTILITY_APP_IDS = [
  'frontend-converter',
  'calendar-app',
  'tasks-app',
  'alarms-app',
  'notes-app',
] as const;
const HIDDEN_DESKTOP_APP_IDS: readonly string[] = [];
const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];
const APP_SUMMARY_MAP: Record<string, string> = {
  'kui-chat': '打开聊天、角色和历史会话。',
  'ai-agent': '管理智能体、任务和工具链。',
  settings: '调整外观、窗口和运行偏好。',
  'frontend-converter': '接入网页、本地程序和展示页。',
  codeEditor: '打开代码编辑器工作台。',
  webChat: '打开 Agent Creator。',
  'short-book-lab': '短篇拆书与内容分析。',
  'medium-short': '中短篇创作和阅读工作区。',
  'html-vault': '浏览 HTML Vault 内置应用。',
  fenghuang: '打开凤煌创作套件。',
  'fenghuang-early': '打开凤煌历史合集。',
  'clawx-gui': '打开 ClawX 图形界面。',
  'opencode-gui': '打开 OpenCode 桌面门户。',
  'opencode-cli': '打开 OpenCode CLI。',
  finder: '查看全部应用和接入项。',
  terminal: '查看运行状态和快捷操作。',
  'calendar-app': '查看日期和日程。',
  'tasks-app': '查看当前事项。',
  'alarms-app': '管理提醒。',
  'notes-app': '记录便签。',
  diary: '打开日记与长文本记录。',
};

const MOBILE_TAB_APP_MAP: Record<Exclude<MobileTabId, 'home'>, string> = {
  chat: 'kui-chat',
  agents: 'ai-agent',
  settings: 'settings',
};

const MOBILE_TABS: Array<{
  id: MobileTabId;
  label: string;
  icon: React.ElementType;
}> = [
  { id: 'home', label: '主页', icon: LayoutGrid },
  { id: 'chat', label: '聊天', icon: MessageSquare },
  { id: 'agents', label: '智能体', icon: Bot },
  { id: 'settings', label: '设置', icon: Settings },
];

const ICON_MAP: Record<string, React.ElementType> = {
  AlarmClock,
  BarChart3,
  Briefcase,
  BookOpen,
  Bot,
  CalendarDays,
  Camera,
  Code2,
  FileText,
  Folder,
  Gamepad2,
  Globe2,
  HeartPulse,
  Image: ImageIcon,
  LayoutGrid,
  ListTodo,
  MessageSquare,
  Package,
  Music4,
  NotebookPen,
  Palette,
  Settings,
  Shield,
  ShoppingBag,
  Sparkles,
  StickyNote,
  Terminal,
  WandSparkles,
};

const DESKTOP_PREFERENCES_STORAGE_KEY = 'fenghuang-desktop:preferences';
const DESKTOP_TASKS_STORAGE_KEY = 'fenghuang-desktop:tasks';
const DESKTOP_ALARMS_STORAGE_KEY = 'fenghuang-desktop:alarms';
const DESKTOP_NOTES_STORAGE_KEY = 'fenghuang-desktop:notes';
const DOCK_HIDE_DELAY_MS = 10000;
const DEFAULT_DESKTOP_PREFERENCES: DesktopPreferences = {
  notificationsEnabled: true,
  touchPriority: true,
  compactLayout: false,
  reducedMotion: false,
  autoHideDock: true,
};
const DEFAULT_TASKS: TaskItem[] = [
  { id: 't1', title: '小说区和漫剧分镜入口拆分完毕', tag: '内容入口', done: true },
  { id: 't2', title: '移动端桌面首屏改成直接打开常用应用', tag: '移动端', done: false },
  { id: 't3', title: '系统设置补齐主题、提醒和触控偏好', tag: '系统设置', done: false },
  { id: 't4', title: '接入器与聊天窗口做窄屏适配复查', tag: '内置应用', done: false },
];
const DEFAULT_ALARMS: AlarmItem[] = [
  { id: 'a1', label: '桌面巡检', time: '09:30', enabled: true },
  { id: 'a2', label: '章节排版复查', time: '14:00', enabled: true },
  { id: 'a3', label: '夜间备份', time: '21:00', enabled: false },
];
const DEFAULT_NOTES: NoteItem[] = [
  { id: 'n1', title: '小说区', body: '保留作品、分卷、章节和连载管理入口。' },
  { id: 'n2', title: '漫剧分镜', body: '突出剧本创作、分镜编写和镜头推进。' },
  { id: 'n3', title: '移动端', body: '常用应用优先露出，避免首屏全是说明文案。' },
];

const readLocalState = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = readScopedStorageValue(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
};

const readLocalList = <T,>(key: string, fallback: T[]): T[] => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = readScopedStorageValue(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const createTerminalEntry = (tone: TerminalEntryTone, content: string): TerminalEntry => ({
  id: `${tone}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  tone,
  content,
});

const renderAppIcon = (app: DesktopAppDefinition, size = 20) => {
  const Icon = ICON_MAP[app.icon] ?? LayoutGrid;
  return <Icon size={size} />;
};

const getImportedAppStatus = (app: DesktopAppDefinition) => {
  if (app.runtime === 'static-web') {
    return app.route ? '静态页面 · 已挂载' : '静态页面 · 缺少路由';
  }
  if (app.runtime === 'generated-web') {
    return app.bundle?.html ? '生成包 · 可预览' : '生成包 · 缺少 HTML';
  }
  if (app.runtime === 'native-exe') {
    return app.native?.executablePath ? '本地程序 · 可启动' : '本地程序 · 缺少路径';
  }
  return '内置组件';
};

const getLauncherTypeLabel = (app: DesktopAppDefinition) => {
  if (app.runtime === 'component') return app.kind === 'system' ? '系统工具' : '内置工具';
  if (app.runtime === 'static-web') return '静态应用';
  if (app.runtime === 'generated-web') return '生成应用';
  if (app.runtime === 'native-exe') return '本地程序';
  return '工具';
};

const getLauncherStatusLabel = (app: DesktopAppDefinition) => {
  if (app.runtime === 'component') return '可直接打开';
  return getImportedAppStatus(app);
};

const isLauncherAppReady = (app: DesktopAppDefinition) => {
  if (app.runtime === 'component') return true;
  if (app.runtime === 'static-web') return Boolean(app.route);
  if (app.runtime === 'generated-web') return Boolean(app.bundle?.html);
  if (app.runtime === 'native-exe') return Boolean(app.native?.executablePath);
  return true;
};

const buildLauncherItem = (
  app: DesktopAppDefinition,
  groupLabel: string,
  groupId: LauncherGroupFilter,
): LauncherItem => ({
  app,
  id: app.id,
  title: app.title,
  description: APP_SUMMARY_MAP[app.id] ?? app.description,
  typeLabel: getLauncherTypeLabel(app),
  statusLabel: getLauncherStatusLabel(app),
  groupLabel,
  groupId,
  isReady: isLauncherAppReady(app),
});

const DeferredContentFallback: React.FC<{
  title: string;
  description: string;
}> = ({ title, description }) => (
  <div
    style={{
      minHeight: '100%',
      display: 'grid',
      placeItems: 'center',
      padding: '32px 20px',
    }}
  >
    <div
      style={{
        display: 'grid',
        gap: 10,
        justifyItems: 'center',
        maxWidth: 280,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 999,
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.22), rgba(34, 211, 238, 0.22))',
          border: '1px solid rgba(148, 163, 184, 0.22)',
        }}
      />
      <strong style={{ fontSize: 15, color: '#f8fafc' }}>{title}</strong>
      <span style={{ fontSize: 13, lineHeight: 1.6, color: '#cbd5e1' }}>{description}</span>
    </div>
  </div>
);

const matchesAppQuery = (app: DesktopAppDefinition, query: string) => {
  if (!query) return true;

  const normalized = query.trim().toLowerCase();
  const haystack = [app.title, app.description, app.id, ...(app.tags ?? [])].join(' ').toLowerCase();
  return haystack.includes(normalized);
};

const MacOSDesktop: React.FC<MacOSDesktopProps> = ({ onOpenRecharge }) => {
  const [catalog, setCatalog] = useState<DesktopAppDefinition[]>([]);
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [darkMode, setDarkMode] = useState(() => resolveThemeMode() === 'dark');
  const [isMobile, setIsMobile] = useState(false);
  const [mobileAppId, setMobileAppId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTabId>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileViewportHeight, setMobileViewportHeight] = useState<number | null>(null);
  const [appSearch, setAppSearch] = useState('');
  const [desktopNotice, setDesktopNotice] = useState<DesktopNotice | null>(null);
  const [selectedLauncherAppId, setSelectedLauncherAppId] = useState<string | null>(null);
  const [recentLauncherAppIds, setRecentLauncherAppIds] = useState<string[]>([]);
  const [launcherGroupFilter, setLauncherGroupFilter] = useState<LauncherGroupFilter>('all');
  const [nextZIndex, setNextZIndex] = useState(20);
  const [preferences, setPreferences] = useState<DesktopPreferences>(() =>
    readLocalState(DESKTOP_PREFERENCES_STORAGE_KEY, DEFAULT_DESKTOP_PREFERENCES),
  );
  const [tasks, setTasks] = useState<TaskItem[]>(() =>
    readLocalList(DESKTOP_TASKS_STORAGE_KEY, DEFAULT_TASKS),
  );
  const [alarms, setAlarms] = useState<AlarmItem[]>(() =>
    readLocalList(DESKTOP_ALARMS_STORAGE_KEY, DEFAULT_ALARMS),
  );
  const [notes, setNotes] = useState<NoteItem[]>(() =>
    readLocalList(DESKTOP_NOTES_STORAGE_KEY, DEFAULT_NOTES),
  );
  const [taskDraft, setTaskDraft] = useState('');
  const [alarmDraft, setAlarmDraft] = useState({ label: '', time: '09:00' });
  const [noteDraft, setNoteDraft] = useState({ title: '', body: '' });
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => new Date().getDate());
  const [dockVisible, setDockVisible] = useState(false);

  const openRechargeCenter = useCallback(() => {
    if (onOpenRecharge) {
      onOpenRecharge();
      return;
    }

    if (typeof window !== 'undefined') {
      window.location.assign(buildRouterPath('/recharge'));
    }
  }, [onOpenRecharge]);

  const openLoginGate = useCallback((mode: 'password' | 'register' = 'password') => {
    if (typeof window === 'undefined') return;
    const authPath = mode === 'register' ? '/login?forceLogin=1&mode=register' : '/login?forceLogin=1';
    window.location.assign(buildRouterPath(buildAcceptanceAwarePath(authPath)));
  }, []);

  const openOfficialWebsite = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.open('https://fhwhkj.top/', '_blank', 'noopener,noreferrer');
    }
  }, []);

  const dragRef = useRef<{ id: string; startX: number; startY: number; x: number; y: number } | null>(null);
  const dockHideTimerRef = useRef<number | null>(null);
  const appSearchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    void loadDesktopApps().then(setCatalog);
  }, []);

  useEffect(() => {
    const refreshCatalog = () => {
      void loadDesktopApps().then(setCatalog);
    };

    window.addEventListener(DESKTOP_APPS_CHANGED_EVENT, refreshCatalog);
    return () => window.removeEventListener(DESKTOP_APPS_CHANGED_EVENT, refreshCatalog);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!desktopNotice) {
      return undefined;
    }

    const timer = window.setTimeout(() => setDesktopNotice(null), 3200);
    return () => window.clearTimeout(timer);
  }, [desktopNotice]);

  useEffect(() => {
    applyThemeMode(darkMode ? 'dark' : 'light');
    setPreferredThemeMode(darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => subscribeThemeMode((mode) => setDarkMode(mode === 'dark')), []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    writeScopedStorageValue(DESKTOP_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    writeScopedStorageValue(DESKTOP_TASKS_STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    writeScopedStorageValue(DESKTOP_ALARMS_STORAGE_KEY, JSON.stringify(alarms));
  }, [alarms]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    writeScopedStorageValue(DESKTOP_NOTES_STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    const syncViewport = () => {
      setIsMobile(window.innerWidth <= 900 || /iPhone|Android|iPad/i.test(navigator.userAgent));
    };
    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setMobileAppId(null);
      setMobileTab('home');
      setMobileMenuOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (!isMobile) {
      setMobileViewportHeight(null);
      return undefined;
    }

    const updateViewportHeight = () => {
      const viewport = window.visualViewport;
      setMobileViewportHeight(viewport?.height ?? window.innerHeight);
    };

    const visualViewport = window.visualViewport;
    updateViewportHeight();

    window.addEventListener('resize', updateViewportHeight);
    visualViewport?.addEventListener('resize', updateViewportHeight);
    visualViewport?.addEventListener('scroll', updateViewportHeight);

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      visualViewport?.removeEventListener('resize', updateViewportHeight);
      visualViewport?.removeEventListener('scroll', updateViewportHeight);
    };
  }, [isMobile]);

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      if (!dragRef.current) return;
      const { id, startX, startY, x, y } = dragRef.current;
      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;
      setWindows((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, x: Math.max(12, x + deltaX), y: Math.max(54, y + deltaY) } : item,
        ),
      );
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  useEffect(() => {
    if (dockHideTimerRef.current) {
      window.clearTimeout(dockHideTimerRef.current);
      dockHideTimerRef.current = null;
    }

    if (isMobile || !preferences.autoHideDock) {
      setDockVisible(true);
      return undefined;
    }

    setDockVisible(false);
    return undefined;
  }, [isMobile, preferences.autoHideDock]);

  const visibleCatalog = useMemo(
    () =>
      catalog
        .filter((app) => !HIDDEN_DESKTOP_APP_IDS.includes(app.id as (typeof HIDDEN_DESKTOP_APP_IDS)[number]))
        .map((app) =>
          app.id === 'frontend-converter'
            ? {
                ...app,
                title: '应用接入',
                description: '接入网页、本地程序和展示页。',
                height: Math.max(app.height, 780),
                tags: Array.from(new Set([...(app.tags ?? []), 'core'])),
              }
            : app,
        ),
    [catalog],
  );
  const appsById = useMemo(() => new Map(visibleCatalog.map((app) => [app.id, app])), [visibleCatalog]);
  const desktopApps = useMemo(() => visibleCatalog.filter((app) => !['finder', 'terminal', 'settings'].includes(app.id)), [visibleCatalog]);
  const dockApps = useMemo(
    () => visibleCatalog.filter((app) => CORE_DOCK_APP_IDS.includes(app.id as (typeof CORE_DOCK_APP_IDS)[number])),
    [visibleCatalog],
  );
  const installedApps = useMemo(
    () => visibleCatalog.filter((app) => app.runtime === 'generated-web' || app.runtime === 'static-web' || app.runtime === 'native-exe'),
    [visibleCatalog],
  );
  const importedDesktopApps = useMemo(() => desktopApps.filter((app) => app.runtime !== 'component'), [desktopApps]);
  const importedAppHealth = useMemo(() => {
    const summary = {
      total: importedDesktopApps.length,
      staticWeb: 0,
      generatedWeb: 0,
      nativeExe: 0,
      ready: 0,
      missing: 0,
    };

    importedDesktopApps.forEach((app) => {
      if (app.runtime === 'static-web') {
        summary.staticWeb += 1;
        if (app.route) summary.ready += 1;
        else summary.missing += 1;
        return;
      }
      if (app.runtime === 'generated-web') {
        summary.generatedWeb += 1;
        if (app.bundle?.html) summary.ready += 1;
        else summary.missing += 1;
        return;
      }
      if (app.runtime === 'native-exe') {
        summary.nativeExe += 1;
        if (app.native?.executablePath) summary.ready += 1;
        else summary.missing += 1;
      }
    });

    return summary;
  }, [importedDesktopApps]);
  const coreApps = useMemo(
    () =>
      CORE_ENTRY_APP_IDS.map((appId) => appsById.get(appId)).filter(Boolean) as DesktopAppDefinition[],
    [appsById],
  );
  const utilityApps = useMemo(
    () =>
      visibleCatalog.filter(
        (app) =>
          app.runtime === 'component' && !CORE_ENTRY_APP_IDS.includes(app.id as (typeof CORE_ENTRY_APP_IDS)[number]),
      ),
    [visibleCatalog],
  );
  const filteredCoreApps = useMemo(
    () => coreApps.filter((app) => matchesAppQuery(app, appSearch)),
    [appSearch, coreApps],
  );
  const filteredUtilityApps = useMemo(
    () => utilityApps.filter((app) => matchesAppQuery(app, appSearch)),
    [appSearch, utilityApps],
  );
  const filteredImportedApps = useMemo(
    () => importedDesktopApps.filter((app) => matchesAppQuery(app, appSearch)),
    [appSearch, importedDesktopApps],
  );
  const filteredAllApps = useMemo(
    () => visibleCatalog.filter((app) => matchesAppQuery(app, appSearch)),
    [appSearch, visibleCatalog],
  );
  const commandShelfItems = useMemo(() => {
    const seen = new Set<string>();
    return [
      ...filteredCoreApps.map((app) => buildLauncherItem(app, '常用', 'core')),
      ...filteredImportedApps.map((app) => buildLauncherItem(app, '接入', 'imported')),
      ...filteredUtilityApps.map((app) => buildLauncherItem(app, '系统', 'utility')),
    ].filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [filteredCoreApps, filteredImportedApps, filteredUtilityApps]);
  const recentLauncherItems = useMemo(
    () =>
      recentLauncherAppIds
        .map((appId) => commandShelfItems.find((item) => item.id === appId))
        .filter(Boolean) as LauncherItem[],
    [commandShelfItems, recentLauncherAppIds],
  );
  const visibleCommandShelfItems = useMemo(
    () =>
      launcherGroupFilter === 'recent'
        ? recentLauncherItems
        : launcherGroupFilter === 'all'
        ? commandShelfItems
        : commandShelfItems.filter((item) => item.groupId === launcherGroupFilter),
    [commandShelfItems, launcherGroupFilter, recentLauncherItems],
  );
  const pinnedLauncherItems = useMemo(() => {
    const preferredIds = ['kui-chat', 'ai-agent', 'frontend-converter', 'codeEditor', 'webChat', 'short-book-lab'];
    const preferred = preferredIds
      .map((appId) => commandShelfItems.find((item) => item.id === appId))
      .filter(Boolean) as LauncherItem[];
    const fallback = commandShelfItems.filter((item) => item.groupId === 'core');
    const seen = new Set<string>();

    return [...preferred, ...fallback].filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    }).slice(0, 6);
  }, [commandShelfItems]);
  const deckMode = appSearch.trim() ? 'search' : 'home';
  const selectedLauncherItem = useMemo(
    () =>
      visibleCommandShelfItems.find((item) => item.id === selectedLauncherAppId) ??
      visibleCommandShelfItems[0] ??
      null,
    [selectedLauncherAppId, visibleCommandShelfItems],
  );
  const launcherGroupTabs = useMemo(
    () => [
      { id: 'all' as const, label: '全部', count: commandShelfItems.length },
      { id: 'core' as const, label: '常用', count: commandShelfItems.filter((item) => item.groupId === 'core').length },
      { id: 'imported' as const, label: '接入', count: commandShelfItems.filter((item) => item.groupId === 'imported').length },
      { id: 'utility' as const, label: '系统', count: commandShelfItems.filter((item) => item.groupId === 'utility').length },
      { id: 'recent' as const, label: '最近', count: recentLauncherItems.length },
    ],
    [commandShelfItems, recentLauncherItems.length],
  );
  const deckRecentDockApps = useMemo(() => {
    const orderedIds = [
      ...windows.filter((item) => !item.minimized).map((item) => item.appId),
      ...recentLauncherAppIds,
      ...CORE_DOCK_APP_IDS,
    ];
    const seen = new Set<string>();

    return orderedIds
      .map((appId) => appsById.get(appId))
      .filter((app): app is DesktopAppDefinition => Boolean(app))
      .filter((app) => {
        if (seen.has(app.id)) return false;
        seen.add(app.id);
        return true;
      })
      .slice(0, 9);
  }, [appsById, recentLauncherAppIds, windows]);
  const mobileHomeApps = useMemo(() => {
    const seen = new Set<string>();
    return [...coreApps, ...utilityApps, ...importedDesktopApps]
      .filter((app) => matchesAppQuery(app, appSearch))
      .filter((app) => {
        if (seen.has(app.id)) return false;
        seen.add(app.id);
        return true;
      });
  }, [appSearch, coreApps, importedDesktopApps, utilityApps]);
  const mobilePrimaryApps = useMemo(() => {
    const diaryApp = visibleCatalog.find((app) => app.id === 'diary');
    const ordered = [...importedDesktopApps, ...(diaryApp ? [diaryApp] : [])];
    const seen = new Set<string>();

    return ordered.filter((app) => {
      if (!matchesAppQuery(app, appSearch) || seen.has(app.id)) return false;
      seen.add(app.id);
      return true;
    });
  }, [appSearch, importedDesktopApps, visibleCatalog]);
  const mobileUtilityApps = useMemo(
    () =>
      MOBILE_HOME_UTILITY_APP_IDS.map((appId) => appsById.get(appId))
        .filter(Boolean)
        .filter((app) => matchesAppQuery(app, appSearch)) as DesktopAppDefinition[],
    [appSearch, appsById],
  );
  const mobileDrawerApps = useMemo(() => {
    const seen = new Set<string>();
    return [...mobilePrimaryApps, ...mobileUtilityApps, ...coreApps]
      .filter((app) => {
        if (seen.has(app.id)) return false;
        seen.add(app.id);
        return true;
      })
      .slice(0, 8);
  }, [coreApps, mobilePrimaryApps, mobileUtilityApps]);
  const activeWindow = windows.find((item) => item.active);
  const visibleWindowCount = windows.filter((item) => !item.minimized).length;
  const nextAlarm = alarms.find((item) => item.enabled) ?? null;
  const completedTaskCount = tasks.filter((item) => item.done).length;
  const enabledAlarmCount = alarms.filter((item) => item.enabled).length;
  const timeLabel = currentTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  const fullDateLabel = currentTime.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  const currentMonthLabel = currentTime.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
  const mobileCurrentAppId = mobileTab === 'home' ? mobileAppId : MOBILE_TAB_APP_MAP[mobileTab];
  const mobileCurrentApp = mobileCurrentAppId ? appsById.get(mobileCurrentAppId) ?? null : null;
  const mobileHeaderTitle =
    mobileTab === 'home'
      ? mobileCurrentApp?.title ?? '凤煌主程序'
      : mobileCurrentApp?.title ?? '凤煌主程序';
  const mobileHeaderSubtitle =
    mobileTab === 'home' && !mobileCurrentApp
      ? '主页放应用图标，点开就像手机桌面一样直接进入。'
      : mobileCurrentApp
        ? APP_SUMMARY_MAP[mobileCurrentApp.id] ?? mobileCurrentApp.description
        : '保持纵向滚动，底部导航始终可切换。';
  const mobileAppMode = Boolean(mobileCurrentAppId);

  useEffect(() => {
    if (isMobile || visibleCommandShelfItems.length === 0) return;
    if (!selectedLauncherAppId || !visibleCommandShelfItems.some((item) => item.id === selectedLauncherAppId)) {
      setSelectedLauncherAppId(visibleCommandShelfItems[0].id);
    }
  }, [isMobile, selectedLauncherAppId, visibleCommandShelfItems]);

  useEffect(() => {
    if (isMobile) return undefined;
    const timer = window.setTimeout(() => appSearchInputRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [isMobile]);

  const calendarCells = useMemo(() => {
    const start = new Date(currentTime.getFullYear(), currentTime.getMonth(), 1);
    const totalDays = new Date(currentTime.getFullYear(), currentTime.getMonth() + 1, 0).getDate();
    const offset = (start.getDay() + 6) % 7;
    return [...Array.from({ length: offset }, () => null), ...Array.from({ length: totalDays }, (_, i) => i + 1)];
  }, [currentTime]);

  const mobileViewportStyle = mobileViewportHeight
    ? ({ '--mobile-viewport-height': `${mobileViewportHeight}px` } as React.CSSProperties)
    : undefined;

  const updatePreference = useCallback(
    <K extends keyof DesktopPreferences,>(key: K, value: DesktopPreferences[K]) => {
      setPreferences((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const revealDock = useCallback(() => {
    if (dockHideTimerRef.current) {
      window.clearTimeout(dockHideTimerRef.current);
      dockHideTimerRef.current = null;
    }
    setDockVisible(true);
  }, []);

  const scheduleDockHide = useCallback(
    (delay: number = DOCK_HIDE_DELAY_MS) => {
      if (isMobile || !preferences.autoHideDock) {
        setDockVisible(true);
        return;
      }
      if (dockHideTimerRef.current) {
        window.clearTimeout(dockHideTimerRef.current);
      }
      dockHideTimerRef.current = window.setTimeout(() => setDockVisible(false), delay);
    },
    [isMobile, preferences.autoHideDock],
  );

  const addTask = useCallback(() => {
    const title = taskDraft.trim();
    if (!title) return;
    setTasks((prev) => [
      {
        id: `task-${Date.now()}`,
        title,
        tag: '桌面事项',
        done: false,
      },
      ...prev,
    ]);
    setTaskDraft('');
  }, [taskDraft]);

  const removeTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addAlarm = useCallback(() => {
    const label = alarmDraft.label.trim();
    if (!label) return;
    setAlarms((prev) => [
      {
        id: `alarm-${Date.now()}`,
        label,
        time: alarmDraft.time || '09:00',
        enabled: true,
      },
      ...prev,
    ]);
    setAlarmDraft({ label: '', time: alarmDraft.time || '09:00' });
  }, [alarmDraft]);

  const removeAlarm = useCallback((id: string) => {
    setAlarms((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addNote = useCallback(() => {
    const title = noteDraft.title.trim();
    const body = noteDraft.body.trim();
    if (!title && !body) return;
    setNotes((prev) => [
      {
        id: `note-${Date.now()}`,
        title: title || '未命名便签',
        body: body || '待补充内容',
      },
      ...prev,
    ]);
    setNoteDraft({ title: '', body: '' });
  }, [noteDraft]);

  const removeNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const launchDesktopNativeApp = useCallback(async (app: DesktopAppDefinition) => {
    if (app.runtime !== 'native-exe' || !app.native) {
      return;
    }

    try {
      const launched = await launchNativeApp(app.native);

      if (
        launched.resolvedPath !== app.native.executablePath ||
        launched.workingDirectory !== (app.native.workingDirectory ?? '')
      ) {
        const updated = await updateInstalledDesktopApp(app.id, {
          native: {
            ...app.native,
            executablePath: launched.resolvedPath,
            workingDirectory: launched.workingDirectory,
          },
        });
        setCatalog((prev) => prev.map((item) => (item.id === app.id ? updated : item)));
      }

      setDesktopNotice({
        kind: 'success',
        text: `已从凤煌桌面启动 ${app.title}`,
      });
    } catch (error) {
      setDesktopNotice({
        kind: 'error',
        text: error instanceof Error ? `${app.title} 启动失败：${error.message}` : `${app.title} 启动失败`,
      });
    }
  }, []);

  const openApp = useCallback((app: DesktopAppDefinition) => {
    if (isMobile) {
      setMobileMenuOpen(false);
      if (app.id === MOBILE_TAB_APP_MAP.chat) {
        setMobileTab('chat');
        setMobileAppId(null);
        return;
      }
      if (app.id === MOBILE_TAB_APP_MAP.agents) {
        setMobileTab('agents');
        setMobileAppId(null);
        return;
      }
      if (app.id === MOBILE_TAB_APP_MAP.settings) {
        setMobileTab('settings');
        setMobileAppId(null);
        return;
      }
      setMobileTab('home');
      setMobileAppId(app.id);
      return;
    }
    if (app.runtime === 'native-exe' && app.native) {
      void launchDesktopNativeApp(app);
      return;
    }
    setWindows((prev) => {
      const existing = prev.find((item) => item.appId === app.id);
      if (existing) {
        const shouldRestoreReadableSize = app.id === 'finder';
        const targetWidth = shouldRestoreReadableSize
          ? Math.min(Math.max(app.width, 980), Math.max(640, window.innerWidth - 48))
          : existing.width;
        const targetHeight = shouldRestoreReadableSize
          ? Math.min(Math.max(app.height, 680), Math.max(520, window.innerHeight - 96))
          : existing.height;

        return prev.map((item) =>
          item.id === existing.id
            ? {
                ...item,
                active: true,
                minimized: false,
                zIndex: nextZIndex,
                width: targetWidth,
                height: targetHeight,
                x: Math.min(item.x, Math.max(24, window.innerWidth - targetWidth - 24)),
                y: Math.min(item.y, Math.max(56, window.innerHeight - targetHeight - 48)),
              }
            : { ...item, active: false, minimized: true },
        );
      }
      const offset = 0;
      return [
        ...prev.map((item) => ({ ...item, active: false, minimized: true })),
        {
          id: `${app.id}-${Date.now()}`,
          appId: app.id,
          title: app.title,
          x: Math.min(120 + offset, Math.max(40, window.innerWidth - app.width - 90)),
          y: Math.min(90 + offset, Math.max(70, window.innerHeight - app.height - 150)),
          width: app.width,
          height: app.height,
          zIndex: nextZIndex,
          minimized: false,
          maximized: false,
          active: true,
        },
      ];
    });
    setNextZIndex((value) => value + 1);
  }, [isMobile, launchDesktopNativeApp, nextZIndex]);

  const openWindow = useCallback((appId: string) => {
    const app = appsById.get(appId);
    if (!app) {
      console.warn('[MacOSDesktop] openWindow failed: app not found', {
        appId,
        available: Array.from(appsById.keys()),
      });
    }
    if (app) openApp(app);
  }, [appsById, openApp]);

  const markLauncherRecent = useCallback((appId: string) => {
    setRecentLauncherAppIds((prev) => [appId, ...prev.filter((id) => id !== appId)].slice(0, 5));
  }, []);

  const openLauncherItem = useCallback((appId: string) => {
    setSelectedLauncherAppId(appId);
    markLauncherRecent(appId);
    openWindow(appId);
  }, [markLauncherRecent, openWindow]);

  const handleDeckKeyDown = useCallback((event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      if (appSearch) {
        event.preventDefault();
        setAppSearch('');
      }
      return;
    }

    if (!appSearch && /^[1-6]$/.test(event.key) && pinnedLauncherItems.length > 0) {
      const target = event.target as HTMLElement | null;
      if (target?.tagName !== 'INPUT') {
        const item = pinnedLauncherItems[Number(event.key) - 1];
        if (item) {
          event.preventDefault();
          openLauncherItem(item.id);
        }
      }
      return;
    }

    if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) return;
    if (visibleCommandShelfItems.length === 0) return;

    const selectedId = selectedLauncherItem?.id ?? selectedLauncherAppId ?? visibleCommandShelfItems[0].id;
    const selectedIndex = Math.max(0, visibleCommandShelfItems.findIndex((item) => item.id === selectedId));

    if (event.key === 'Enter') {
      event.preventDefault();
      openLauncherItem(selectedId);
      return;
    }

    event.preventDefault();
    const direction = event.key === 'ArrowDown' ? 1 : -1;
    const nextIndex = (selectedIndex + direction + visibleCommandShelfItems.length) % visibleCommandShelfItems.length;
    setSelectedLauncherAppId(visibleCommandShelfItems[nextIndex].id);
  }, [appSearch, openLauncherItem, pinnedLauncherItems, selectedLauncherAppId, selectedLauncherItem, visibleCommandShelfItems]);

  const handleLauncherKeyDown = useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
    handleDeckKeyDown(event);
  }, [handleDeckKeyDown]);

  useEffect(() => {
    if (isMobile) return undefined;

    const onShortcut = (event: KeyboardEvent) => {
      if (appSearch || !/^[1-6]$/.test(event.key)) return;
      const target = event.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return;
      const item = pinnedLauncherItems[Number(event.key) - 1];
      if (!item) return;
      event.preventDefault();
      openLauncherItem(item.id);
    };

    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, [appSearch, isMobile, openLauncherItem, pinnedLauncherItems]);

  const handleMobileTabChange = useCallback((tab: MobileTabId) => {
    setMobileMenuOpen(false);
    setMobileTab(tab);
    if (tab === 'home') {
      setMobileAppId(null);
      return;
    }
    setMobileAppId(null);
  }, []);

  const handleCloseMobileApp = useCallback(() => {
    setMobileMenuOpen(false);
    setMobileAppId(null);
    if (mobileTab !== 'home') {
      setMobileTab('home');
    }
  }, [mobileTab]);

  const focusWindow = useCallback((id: string) => {
    setWindows((prev) => prev.map((item) => item.id === id ? { ...item, active: true, minimized: false, zIndex: nextZIndex } : { ...item, active: false }));
    setNextZIndex((value) => value + 1);
  }, [nextZIndex]);

  const closeWindow = useCallback((id: string) => setWindows((prev) => prev.filter((item) => item.id !== id)), []);
  const minimizeWindow = useCallback((id: string) => setWindows((prev) => prev.map((item) => item.id === id ? { ...item, minimized: true, active: false } : item)), []);
  const toggleTask = useCallback((id: string) => setTasks((prev) => prev.map((item) => item.id === id ? { ...item, done: !item.done } : item)), []);
  const toggleAlarm = useCallback((id: string) => setAlarms((prev) => prev.map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item)), []);

  const handleAppInstalled = useCallback((app: DesktopAppDefinition) => {
    setCatalog((prev) => [app, ...prev.filter((item) => item.id !== app.id)]);
    if (app.runtime === 'native-exe') {
      setDesktopNotice({
        kind: 'success',
        text: `${app.title} 已接入凤煌桌面，点击桌面图标会直接启动。`,
      });
      return;
    }
    openApp(app);
  }, [openApp]);

  useEffect(() => {
    if (mobileAppMode) {
      setMobileMenuOpen(false);
    }
  }, [mobileAppMode]);

  const handleUninstall = useCallback(async (appId: string) => {
    const target = appsById.get(appId);
    if (!target || target.kind !== 'generated') return;
    if (!window.confirm(`确定要卸载 ${target.title} 吗？`)) return;
    await uninstallGeneratedDesktopApp(appId);
    setCatalog((prev) => prev.filter((item) => item.id !== appId));
    setWindows((prev) => prev.filter((item) => item.appId !== appId));
  }, [appsById]);

  const renderEmbeddedTool = (
    app: DesktopAppDefinition,
    options: {
      eyebrow: string;
      description: string;
      stats: EmbeddedToolMetric[];
      children: React.ReactNode;
      stretch?: boolean;
    },
  ) => (
    <div className={styles.mobileEmbeddedApp} data-app-id={app.id}>
      <EmbeddedToolShell
        app={app}
        eyebrow={options.eyebrow}
        description={options.description}
        stats={options.stats}
        stretch={options.stretch}
      >
        {options.children}
      </EmbeddedToolShell>
    </div>
  );

  const renderDeferredContent = (title: string, description: string, children: React.ReactNode) => (
    <React.Suspense fallback={<DeferredContentFallback title={title} description={description} />}>
      {children}
    </React.Suspense>
  );

  const renderDeferredEmbeddedTool = (
    app: DesktopAppDefinition,
    options: {
      eyebrow: string;
      description: string;
      stats: EmbeddedToolMetric[];
      children: React.ReactNode;
      stretch?: boolean;
    },
  ) =>
    renderEmbeddedTool(app, {
      ...options,
      children: renderDeferredContent(app.title, `正在载入${options.eyebrow}工作区...`, options.children),
    });

  const renderContent = (appId: string) => {
    const app = appsById.get(appId);
    if (!app) {
      console.warn('[MacOSDesktop] app not found, rendering LegacyPanel', {
        appId,
        available: Array.from(appsById.keys()),
      });
    }
    if (!app) return <LegacyPanel />;
    if (app.runtime === 'generated-web' || app.runtime === 'static-web' || app.runtime === 'native-exe') {
      return renderDeferredContent(app.title, '正在打开外部应用与接入内容...', <GeneratedDesktopAppFrame app={app} />);
    }
    switch (app.componentKey) {
      case 'finder':
        return renderEmbeddedTool(app, {
          eyebrow: '文件管理器',
          description: '把可直接打开的桌面应用、展示页和系统工具集中在一处查看，不再只露出一小排入口。',
          stats: [
            { label: '可打开应用', value: desktopApps.length },
            { label: '系统工具', value: utilityApps.length },
            { label: '已接入展示', value: importedDesktopApps.length },
          ],
          children: (
            <FinderPanel
              apps={desktopApps}
              utilityApps={utilityApps}
              importedApps={importedDesktopApps}
              activeAppIds={new Set(windows.filter((item) => !item.minimized).map((item) => item.appId))}
              onOpen={openWindow}
            />
          ),
        });
      case 'terminal':
        return renderEmbeddedTool(app, {
          eyebrow: '终端',
          description: '统一查看桌面运行状态、主题同步和下一步操作，现在支持命令输入和快捷操作。',
          stats: [
            { label: '运行时', value: '在线' },
            { label: '活动窗口', value: visibleWindowCount },
            { label: '主题', value: darkMode ? '深色同步' : '浅色同步' },
          ],
          children: (
            <TerminalPanel
              apps={desktopApps}
              windows={windows}
              tasks={tasks}
              alarms={alarms}
              darkMode={darkMode}
              preferences={preferences}
              onOpenApp={openWindow}
              onSetDarkMode={setDarkMode}
              onUpdatePreference={updatePreference}
              onRevealDock={revealDock}
            />
          ),
        });
      case 'settings':
        return (
          <div className={styles.mobileEmbeddedApp} data-app-id={appId}>
            <SettingsPanel
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              preferences={preferences}
              onUpdatePreference={updatePreference}
              visibleWindowCount={visibleWindowCount}
              installedAppCount={installedApps.length}
              enabledAlarmCount={enabledAlarmCount}
              dockAppCount={dockApps.length}
              nextAlarmLabel={nextAlarm ? `${nextAlarm.time} ${nextAlarm.label}` : '今日无提醒'}
              activeWindowTitles={windows
                .filter((item) => !item.minimized)
                .map((item) => item.title)
                .slice(0, 4)}
              onOpenApp={openWindow}
              isMobile={isMobile}
            />
          </div>
        );
      case 'chat-panel':
        return renderDeferredEmbeddedTool(app, {
          eyebrow: '聊天',
          description: '统一承接角色对话、历史消息和多模态生成入口，外层改成和系统设置同一套信息流壳层。',
          stats: [
            { label: '会话体系', value: '统一' },
            { label: '历史消息', value: '自动缓存' },
            { label: '图像能力', value: '可接入' },
          ],
          children: <ChatPanel visible onClose={() => undefined} />,
        });
      case 'agent-sidebar':
        return renderDeferredEmbeddedTool(app, {
          eyebrow: '智能体',
          description: '把对话、Claw Code 和记忆面板收进同一块工作区，滚动和切换逻辑都跟设置页一致。',
          stats: [
            { label: '工作页签', value: 4 },
            { label: '当前智能体', value: 'planner' },
            { label: '状态面板', value: '记忆已接入' },
          ],
          children: <AgentSidebar currentAgentId="planner" />,
        });
      case 'diary':
        return (
          <div className={styles.mobileEmbeddedApp} data-app-id={appId}>
            <Diary />
          </div>
        );
      case 'frontend-converter':
        return renderDeferredEmbeddedTool(app, {
          eyebrow: '统一应用转换接口',
          description: '源码、本地程序和展示页都在这一层整理，保留原来的接入逻辑，同时换成系统设置同风格外壳。',
          stats: [
            { label: '接入模式', value: 3 },
            { label: '已接入应用', value: installedApps.length },
            { label: '回流目标', value: '凤煌桌面' },
          ],
          children: <FrontendAppConverter onInstalled={handleAppInstalled} />,
        });
      case 'calendar-panel':
        return (
          <CalendarPanel
            currentMonthLabel={currentMonthLabel}
            currentDate={currentTime.getDate()}
            selectedDate={selectedCalendarDate}
            calendarCells={calendarCells}
            alarms={alarms}
            tasks={tasks}
            onSelectDate={setSelectedCalendarDate}
          />
        );
      case 'tasks-panel':
        return (
          <TasksPanel
            tasks={tasks}
            taskDraft={taskDraft}
            onTaskDraftChange={setTaskDraft}
            onAddTask={addTask}
            onToggleTask={toggleTask}
            onRemoveTask={removeTask}
          />
        );
      case 'alarms-panel':
        return (
          <AlarmsPanel
            alarms={alarms}
            alarmDraft={alarmDraft}
            onAlarmDraftChange={setAlarmDraft}
            onAddAlarm={addAlarm}
            onToggleAlarm={toggleAlarm}
            onRemoveAlarm={removeAlarm}
          />
        );
      case 'notes-panel':
        return (
          <NotesPanel
            notes={notes}
            noteDraft={noteDraft}
            onNoteDraftChange={setNoteDraft}
            onAddNote={addNote}
            onRemoveNote={removeNote}
          />
        );
      default:
        return <LegacyPanel app={app} />;
    }
  };

  if (isMobile) {
    return (
      <div
        className={`${styles.mobileDesktop} ${mobileAppMode ? styles.mobileDesktopAppMode : ''} ${darkMode ? styles.dark : ''}`}
        style={mobileViewportStyle}
      >
        {!mobileAppMode && mobileMenuOpen ? (
          <button
            type="button"
            className={styles.mobileMenuBackdrop}
            aria-label="关闭移动端菜单"
            onClick={() => setMobileMenuOpen(false)}
          />
        ) : null}
        {!mobileAppMode ? (
          <>
            <aside
              id="mobileDrawer"
              className={`${styles.mobileDrawer} ${mobileMenuOpen ? styles.mobileDrawerActive : ''}`}
            >
              <div className={styles.mobileDrawerHeader}>
                <div className={styles.mobileDrawerHeaderCopy}>
                  <strong>凤煌主程序</strong>
                  <span>{fullDateLabel}</span>
                </div>
                <button
                  type="button"
                  className={styles.mobileBackButton}
                  onClick={() => setDarkMode((value) => !value)}
                  aria-label="切换主题"
                >
                  {darkMode ? <SunMedium size={16} /> : <MoonStar size={16} />}
                </button>
              </div>
              <section className={styles.mobileDrawerSection}>
                <div className={styles.mobileDrawerLabel}>主导航</div>
                <div className={styles.mobileDrawerList}>
                  {MOBILE_TABS.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        className={`${styles.mobileDrawerLink} ${mobileTab === tab.id ? styles.mobileDrawerLinkActive : ''}`}
                        onClick={() => handleMobileTabChange(tab.id)}
                      >
                        <Icon size={16} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
              <section className={styles.mobileDrawerSection}>
                <div className={styles.mobileDrawerLabel}>快捷打开</div>
                <div className={styles.mobileDrawerGrid}>
                  {mobileDrawerApps.map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      className={styles.mobileDrawerApp}
                      onClick={() => openWindow(app.id)}
                    >
                      <div className={styles.mobileDrawerAppBadge} style={{ background: app.color }}>
                        {renderAppIcon(app, 16)}
                      </div>
                      <span>{app.title}</span>
                    </button>
                  ))}
                </div>
              </section>
            </aside>
            <div className={styles.mobileStatusBar}>
              <div className={styles.mobileTopbarLead}>
                <button
                  type="button"
                  className={styles.mobileMenuButton}
                  onClick={() => setMobileMenuOpen((value) => !value)}
                  aria-label="切换移动端菜单"
                  aria-expanded={mobileMenuOpen}
                  aria-controls="mobileDrawer"
                >
                  {mobileMenuOpen ? <X size={18} /> : <EllipsisVertical size={18} />}
                </button>
                <div className={styles.mobileTopbarCopy}>
                  <strong>{mobileHeaderTitle}</strong>
                  <span>
                    {mobileTab === 'home' && !mobileCurrentApp
                      ? currentTime.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })
                      : mobileHeaderSubtitle}
                  </span>
                </div>
              </div>
              <div className={styles.mobileStatusIcons}>
                <span className={styles.mobileClock}>{timeLabel}</span>
                <Wifi size={14} />
                <Battery size={14} />
              </div>
            </div>
          </>
        ) : null}
        <div className={`${styles.mobileContent} ${mobileAppMode ? styles.mobileContentAppMode : ''}`}>
          {mobileCurrentAppId ? (
            <div className={styles.mobileAppShell}>
              <div className={styles.mobileAppOverlay}>
                <button
                  type="button"
                  className={`${styles.mobileBackButton} ${styles.mobileAppOverlayButton}`}
                  onClick={handleCloseMobileApp}
                  aria-label="退出当前应用"
                >
                  <ChevronLeft size={18} />
                  <span>返回主页</span>
                </button>
              </div>
              <div className={styles.mobileAppBody}>
                <div className={styles.mobileAppBodyInner}>{renderContent(mobileCurrentAppId)}</div>
              </div>
            </div>
          ) : (
            <>
              <section className={styles.mobilePhoneHero}>
                <div className={styles.mobilePhoneHeroCopy}>
                  <p>{currentTime.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}</p>
                  <h1>凤煌桌面</h1>
                  <span>主页只保留真正需要打开的应用，聊天、智能体和设置固定放到底部导航。</span>
                </div>
                <label className={styles.mobileSearchBar}>
                  <Search size={15} />
                  <input
                    value={appSearch}
                    onChange={(event) => setAppSearch(event.target.value)}
                    placeholder="搜索应用"
                  />
                </label>
                <div className={styles.mobileTopPills}>
                  <span className={styles.mobileTopPill}>应用 {mobilePrimaryApps.length}</span>
                  <span className={styles.mobileTopPill}>提醒 {enabledAlarmCount}</span>
                  <span className={styles.mobileTopPill}>窗口 {visibleWindowCount}</span>
                </div>
                <div className={styles.mobileHomeActions}>
                  <button type="button" className={styles.mobileHomeActionButton} onClick={() => openLoginGate('password')}>
                    <LogIn size={16} />
                    <span>登录</span>
                  </button>
                  <button type="button" className={styles.mobileHomeActionButton} onClick={() => openLoginGate('register')}>
                    <UserPlus size={16} />
                    <span>注册</span>
                  </button>
                  <button type="button" className={styles.mobileHomeActionButton} onClick={openRechargeCenter}>
                    <ShoppingBag size={16} />
                    <span>充值中心</span>
                  </button>
                  <button type="button" className={styles.mobileHomeActionButton} onClick={openOfficialWebsite}>
                    <Globe2 size={16} />
                    <span>官网入口</span>
                  </button>
                </div>
              </section>
              <section className={styles.mobileSection}>
                <div className={styles.mobileSectionHeader}>
                  <span>应用桌面</span>
                  <span>{mobilePrimaryApps.length}</span>
                </div>
                {mobilePrimaryApps.length === 0 ? (
                  <div className={styles.mobileInstalledEmpty}>没有找到匹配的应用。</div>
                ) : (
                  <div className={styles.mobilePhoneGrid}>
                    {mobilePrimaryApps.map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      className={styles.mobilePhoneApp}
                      onClick={() => openWindow(app.id)}
                    >
                      <div className={styles.mobilePhoneAppBadge} style={{ background: app.color }}>
                        {renderAppIcon(app, 18)}
                      </div>
                      <span>{app.title}</span>
                    </button>
                    ))}
                  </div>
                )}
              </section>
              {mobileUtilityApps.length > 0 ? (
                <section className={styles.mobileSection}>
                  <div className={styles.mobileSectionHeader}>
                    <span>系统工具</span>
                    <span>{mobileUtilityApps.length}</span>
                  </div>
                  <div className={styles.mobileUtilityHint}>统一接口、提醒、日历和便签放在第二屏，不再挤占主桌面首排。</div>
                  <div className={styles.mobileToolGrid}>
                    {mobileUtilityApps.map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      className={styles.mobileToolCard}
                      onClick={() => openWindow(app.id)}
                    >
                      <div className={styles.mobileToolCardBadge} style={{ background: app.color }}>
                        {renderAppIcon(app, 16)}
                      </div>
                        <div className={styles.mobileToolCardCopy}>
                          <strong>{app.title}</strong>
                          <span>{APP_SUMMARY_MAP[app.id] ?? app.description}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}
              <section className={styles.mobileSection}>
                <div className={styles.mobileSectionHeader}>
                  <span>当前状态</span>
                  <span>{visibleWindowCount}</span>
                </div>
                <div className={styles.mobileStatsGrid}>
                  <div className={styles.mobileStatCard}>
                    <strong>{mobilePrimaryApps.length}</strong>
                    <span>桌面图标</span>
                  </div>
                  <div className={styles.mobileStatCard}>
                    <strong>{completedTaskCount}</strong>
                    <span>已完成</span>
                  </div>
                  <div className={styles.mobileStatCard}>
                    <strong>{enabledAlarmCount}</strong>
                    <span>提醒</span>
                  </div>
                  <div className={styles.mobileStatCard}>
                    <strong>{installedApps.length}</strong>
                    <span>接入项</span>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
        {mobileAppMode ? null : (
          <nav className={styles.mobileDock}>
            {MOBILE_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = mobileTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`${styles.mobileDockItem} ${active ? styles.mobileDockItemActive : ''}`}
                  onClick={() => handleMobileTabChange(tab.id)}
                  aria-current={active ? 'page' : undefined}
                >
                  <div className={`${styles.mobileDockBadge} ${active ? styles.mobileDockBadgeActive : ''}`}>
                    <Icon size={18} />
                  </div>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        )}
      </div>
    );
  }

  return (
    <div
      className={[
        styles.desktopShell,
        darkMode ? styles.dark : '',
        preferences.compactLayout ? styles.compactDesktop : '',
        preferences.reducedMotion ? styles.reducedMotion : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.wallpaper} />
      <div className={styles.wallpaperGlowA} />
      <div className={styles.wallpaperGlowB} />
      <header className={styles.menuBar}>
        <div className={styles.menuLeft}>
          <button className={styles.appleButton} aria-label="凤煌科技">
            <img src="/favicon.png" alt="凤煌科技" className={styles.brandLogo} />
          </button>
          <button className={styles.menuButton}>应用</button>
          <button className={styles.menuButton}>视图</button>
          <div className={styles.brandPill}><LayoutGrid size={14} /><span>{activeWindow?.title ?? '工具启动器'}</span></div>
        </div>
        <div className={styles.menuRight}>
          <div className={styles.statusPill}><Activity size={14} /><span>{visibleWindowCount} 个窗口</span></div>
          <div className={styles.statusPill}><Bell size={14} /><span>{nextAlarm ? `${nextAlarm.time} ${nextAlarm.label}` : '今天暂无提醒'}</span></div>
          <button className={styles.menuIconButton} onClick={() => setDarkMode((value) => !value)}>{darkMode ? <SunMedium size={14} /> : <MoonStar size={14} />}</button>
          <span className={styles.menuClock}>{currentTime.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })} · {timeLabel}</span>
        </div>
      </header>
      {desktopNotice ? (
        <div
          className={`${styles.desktopLaunchNotice} ${
            desktopNotice.kind === 'error' ? styles.desktopLaunchNoticeError : styles.desktopLaunchNoticeSuccess
          }`}
        >
          {desktopNotice.text}
        </div>
      ) : null}
      <div className={styles.desktopStage}>
        <main className={styles.commandCenter}>
          <section className={styles.launchpadFrame}>
            <div className={styles.deckTopbar}>
              <div className={styles.deckBrand}>
                <img src="/favicon.png" alt="" />
                <div>
                  <span>桌面启动器</span>
                  <strong>凤煌</strong>
                </div>
              </div>

              <label className={styles.deckSearch}>
                <Search size={18} />
                <input
                  ref={appSearchInputRef}
                  value={appSearch}
                  onChange={(event) => setAppSearch(event.target.value)}
                  onKeyDown={handleDeckKeyDown}
                  placeholder="搜索应用、工具或接入项"
                />
                <kbd>Enter</kbd>
              </label>

              <div className={styles.deckAccount} aria-label="账号和系统入口">
                <button type="button" onClick={() => openLoginGate('password')}>
                  <LogIn size={15} />
                  <span>登录</span>
                </button>
                <button type="button" onClick={() => openLoginGate('register')}>
                  <UserPlus size={15} />
                  <span>注册</span>
                </button>
                <button type="button" onClick={openRechargeCenter}>
                  <ShoppingBag size={15} />
                  <span>充值</span>
                </button>
                <button type="button" onClick={openOfficialWebsite} aria-label="官网入口">
                  <Globe2 size={15} />
                </button>
              </div>
            </div>

            <div className={styles.deckStatusline}>
              <span>{activeWindow?.title ? `当前 ${activeWindow.title}` : '工作台待命'}</span>
              <span>{visibleWindowCount} 窗口</span>
              <span>{importedAppHealth.ready} 可用</span>
              <span>{nextAlarm ? `${nextAlarm.time} ${nextAlarm.label}` : `${enabledAlarmCount} 提醒`}</span>
            </div>

            <div className={styles.deckLayout}>
              <nav className={styles.deckNav} aria-label="启动器分类">
                {launcherGroupTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={launcherGroupFilter === tab.id ? styles.deckNavActive : ''}
                    onClick={() => setLauncherGroupFilter(tab.id)}
                  >
                    <span>{tab.label}</span>
                    <strong>{tab.count}</strong>
                  </button>
                ))}
              </nav>

              <main className={styles.deckMain}>
                <section className={styles.deckPulse} aria-label="工作脉冲">
                  <div className={styles.deckPulseTitle}>
                    <span>{deckMode === 'search' ? '搜索结果' : '常用入口'}</span>
                    <strong>{deckMode === 'search' ? '找到这些入口' : '快速打开'}</strong>
                  </div>
                  <div className={styles.deckPulseStats}>
                    <span><strong>{visibleWindowCount}</strong> 运行</span>
                    <span><strong>{recentLauncherItems.length}</strong> 最近</span>
                    <span><strong>{importedAppHealth.ready}</strong> 可用</span>
                  </div>
                  <div className={styles.deckQuickRail} aria-label="快速入口">
                    {(deckRecentDockApps.length > 0 ? deckRecentDockApps : pinnedLauncherItems.map((item) => item.app)).slice(0, 4).map((app) => {
                      const active = windows.some((windowItem) => windowItem.appId === app.id && !windowItem.minimized);
                      const selected = selectedLauncherItem?.id === app.id;

                      return (
                        <button
                          key={app.id}
                          type="button"
                          className={`${styles.deckQuickItem} ${selected ? styles.deckQuickItemSelected : ''}`}
                          onClick={() => setSelectedLauncherAppId(app.id)}
                          onDoubleClick={() => openLauncherItem(app.id)}
                        >
                          <span>{renderAppIcon(app, 16)}</span>
                          <strong>{app.title}</strong>
                          {active ? <i /> : null}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {deckMode === 'home' && pinnedLauncherItems.length > 0 ? (
                  <section className={styles.deckPinnedGrid} aria-label="核心入口">
                    {pinnedLauncherItems.map((item, index) => {
                      const selected = selectedLauncherItem?.id === item.id;
                      const active = windows.some((windowItem) => windowItem.appId === item.id && !windowItem.minimized);

                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={`${styles.deckTile} ${selected ? styles.deckTileSelected : ''}`}
                          aria-current={selected ? 'true' : undefined}
                          onClick={() => setSelectedLauncherAppId(item.id)}
                          onDoubleClick={() => openLauncherItem(item.id)}
                          onFocus={() => setSelectedLauncherAppId(item.id)}
                          onKeyDown={handleLauncherKeyDown}
                        >
                          <span className={styles.deckTileIndex}>{String(index + 1).padStart(2, '0')}</span>
                          <span className={styles.deckTileIcon}>{renderAppIcon(item.app, 24)}</span>
                          <span className={styles.deckTileCopy}>
                            <strong>{item.title}</strong>
                            <small>{item.description}</small>
                          </span>
                          <span className={styles.deckTileMeta}>{active ? '运行中' : item.typeLabel}</span>
                        </button>
                      );
                    })}
                  </section>
                ) : null}

                <section className={styles.deckCommandList} aria-label={deckMode === 'search' ? '搜索结果' : '全部入口'}>
                  <div className={styles.deckSectionHeader}>
                    <span>{deckMode === 'search' ? '搜索结果' : launcherGroupFilter === 'all' ? '全部入口' : `${launcherGroupTabs.find((tab) => tab.id === launcherGroupFilter)?.label ?? '应用'}入口`}</span>
                    <strong>{visibleCommandShelfItems.length}</strong>
                  </div>

                  {visibleCommandShelfItems.length === 0 ? (
                    <div className={styles.deckEmpty}>
                      <strong>{appSearch.trim() ? '没有匹配入口' : '暂无最近打开'}</strong>
                      <span>{appSearch.trim() ? '换一个关键词，或清空搜索回到工作台。' : '打开一个工具后，这里会留下最近入口。'}</span>
                      {appSearch.trim() ? (
                        <button type="button" onClick={() => setAppSearch('')}>清空搜索</button>
                      ) : null}
                    </div>
                  ) : visibleCommandShelfItems.map((item) => {
                    const selected = selectedLauncherItem?.id === item.id;
                    const recent = recentLauncherAppIds.includes(item.id);
                    const active = windows.some((windowItem) => windowItem.appId === item.id && !windowItem.minimized);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`${styles.deckCommand} ${selected ? styles.deckCommandSelected : ''}`}
                        aria-current={selected ? 'true' : undefined}
                        onClick={() => setSelectedLauncherAppId(item.id)}
                        onDoubleClick={() => openLauncherItem(item.id)}
                        onFocus={() => setSelectedLauncherAppId(item.id)}
                        onKeyDown={handleLauncherKeyDown}
                      >
                        <span className={styles.deckCommandIcon}>{renderAppIcon(item.app, 18)}</span>
                        <span className={styles.deckCommandCopy}>
                          <strong>{item.title}</strong>
                          <small>{item.description}</small>
                        </span>
                        <span className={styles.deckCommandMeta}>
                          {active ? <i>运行中</i> : null}
                          {recent ? <i>最近</i> : null}
                          <em>{item.groupLabel}</em>
                        </span>
                      </button>
                    );
                  })}
                </section>
              </main>

              <aside className={styles.deckInspector} aria-label="选中工具详情">
                <div className={styles.deckInspectorMark}>
                  {selectedLauncherItem ? renderAppIcon(selectedLauncherItem.app, 32) : <LayoutGrid size={32} />}
                </div>
                <div className={styles.deckInspectorCopy}>
                  <span>{selectedLauncherItem?.groupLabel ?? '启动器'}</span>
                  <strong>{selectedLauncherItem?.title ?? '未选择工具'}</strong>
                  <p>{selectedLauncherItem?.description ?? '选择一个入口，右侧会出现打开动作和运行状态。'}</p>
                </div>
                <div className={styles.deckInspectorMeta}>
                  <span>
                    <small>类型</small>
                    <strong>{selectedLauncherItem?.typeLabel ?? '-'}</strong>
                  </span>
                  <span>
                    <small>状态</small>
                    <strong>{selectedLauncherItem?.statusLabel ?? '-'}</strong>
                  </span>
                  <span>
                    <small>窗口</small>
                    <strong>
                      {selectedLauncherItem
                        ? windows.some((item) => item.appId === selectedLauncherItem.id && !item.minimized) ? '运行中' : '未打开'
                        : '-'}
                    </strong>
                  </span>
                </div>
                <div className={styles.deckInspectorActions}>
                  <button
                    type="button"
                    className={styles.deckPrimaryAction}
                    disabled={!selectedLauncherItem}
                    onClick={() => selectedLauncherItem && openLauncherItem(selectedLauncherItem.id)}
                  >
                    打开
                  </button>
                  <button
                    type="button"
                    onClick={() => selectedLauncherItem && setDesktopNotice({ kind: 'success', text: `${selectedLauncherItem.title} 已加入固定候选。` })}
                    disabled={!selectedLauncherItem}
                  >
                    固定
                  </button>
                  <button
                    type="button"
                    onClick={() => selectedLauncherItem && setDesktopNotice({ kind: 'success', text: `${selectedLauncherItem.title} · ${selectedLauncherItem.statusLabel}` })}
                    disabled={!selectedLauncherItem}
                  >
                    详情
                  </button>
                </div>
                <div className={styles.deckHint}>
                  <span>↑↓ 选择</span>
                  <span>Enter 打开</span>
                  <span>Esc 清空</span>
                </div>
              </aside>
            </div>
          </section>
        </main>
      </div>
      {windows.filter((item) => !item.minimized).sort((a, b) => a.zIndex - b.zIndex).map((item) => (
        <div key={item.id} className={`${styles.windowShell} ${item.active ? styles.windowActive : ''}`} style={{ left: item.x, top: item.y, width: item.width, height: item.height, zIndex: item.zIndex }} onMouseDown={() => focusWindow(item.id)}>
          <div className={styles.windowHeader} onMouseDown={(event) => { dragRef.current = { id: item.id, startX: event.clientX, startY: event.clientY, x: item.x, y: item.y }; }}>
            <div className={styles.windowControls}>
              <button className={styles.controlClose} onClick={() => closeWindow(item.id)}><X size={10} /></button>
              <button className={styles.controlMinimize} onClick={() => minimizeWindow(item.id)}><Minus size={10} /></button>
              <button className={styles.controlMaximize}><Maximize2 size={10} /></button>
            </div>
            <span className={styles.windowTitle}>{item.title}</span>
          </div>
          <div className={styles.windowBody}>{renderContent(item.appId)}</div>
        </div>
      ))}
      {preferences.autoHideDock ? (
        <>
          <button
            type="button"
            className={`${styles.dockPeekHandle} ${dockVisible ? styles.dockPeekHandleHidden : ''}`}
            onMouseEnter={revealDock}
            onMouseLeave={() => scheduleDockHide()}
            onClick={revealDock}
            aria-label="显示底部 Dock"
          />
          <button
            type="button"
            className={styles.dockRevealZone}
            onMouseEnter={revealDock}
            onMouseLeave={() => scheduleDockHide()}
            onClick={revealDock}
            aria-label="显示底部 Dock"
          />
        </>
      ) : null}
      <div
        className={`${styles.dock} ${dockVisible ? styles.dockVisible : styles.dockHidden}`}
        onMouseEnter={revealDock}
        onMouseLeave={() => scheduleDockHide()}
      >
        {deckRecentDockApps.map((app) => {
          const active = windows.some((item) => item.appId === app.id && !item.minimized);
          return (
            <button key={app.id} className={styles.dockItem} onClick={() => openWindow(app.id)}>
              <div className={styles.dockBadge}>{renderAppIcon(app, 20)}</div>
              <span>{app.title}</span>
              {active ? <i className={styles.dockIndicator} /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const FinderPanel: React.FC<{
  apps: DesktopAppDefinition[];
  utilityApps: DesktopAppDefinition[];
  importedApps: DesktopAppDefinition[];
  activeAppIds: Set<string>;
  onOpen: (appId: string) => void;
}> = ({ apps, utilityApps, importedApps, activeAppIds, onOpen }) => {
  const [activeSection, setActiveSection] = useState<FinderSectionId>('all');
  const [finderQuery, setFinderQuery] = useState('');

  const sections = [
    { id: 'all' as FinderSectionId, label: '全部', count: apps.length },
    {
      id: 'workspace' as FinderSectionId,
      label: '工作区',
      count: apps.filter((app) =>
        ['kui-chat', 'ai-agent', 'frontend-converter', 'diary', 'notes-app'].includes(app.id),
      ).length,
    },
    { id: 'system' as FinderSectionId, label: '系统工具', count: utilityApps.length },
    { id: 'external' as FinderSectionId, label: '外部应用', count: importedApps.length },
    { id: 'active' as FinderSectionId, label: '活动窗口', count: activeAppIds.size },
  ];

  const visibleApps = useMemo(() => {
    const query = finderQuery.trim().toLowerCase();
    const source = (() => {
      switch (activeSection) {
        case 'workspace':
          return apps.filter((app) =>
            ['kui-chat', 'ai-agent', 'frontend-converter', 'diary', 'notes-app'].includes(app.id),
          );
        case 'system':
          return utilityApps;
        case 'external':
          return importedApps;
        case 'active':
          return apps.filter((app) => activeAppIds.has(app.id));
        case 'all':
        default:
          return apps;
      }
    })();

    if (!query) return source;
    return source.filter((app) =>
      [app.title, app.description, app.id, ...(app.tags ?? [])]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [activeAppIds, activeSection, apps, finderQuery, importedApps, utilityApps]);

  const quickOpenApps = apps.filter((app) =>
    ['kui-chat', 'ai-agent', 'frontend-converter', 'codeEditor', 'webChat', 'short-book-lab', 'html-vault', 'fenghuang', 'settings'].includes(app.id),
  );

  return (
    <div className={styles.finderShell}>
      <div className={styles.finderTopbar}>
        <div>
          <strong>桌面资源总览</strong>
          <span>从这里直接打开系统工具、已接入应用和当前工作区。</span>
        </div>
        <span className={styles.finderSectionCount}>{apps.length} 个入口</span>
      </div>

      <div className={styles.finderSummaryRow}>
        <div className={styles.finderSummaryCard}>
          <span>活动窗口</span>
          <strong>{activeAppIds.size}</strong>
        </div>
        <div className={styles.finderSummaryCard}>
          <span>系统工具</span>
          <strong>{utilityApps.length}</strong>
        </div>
        <div className={styles.finderSummaryCard}>
          <span>外部应用</span>
          <strong>{importedApps.length}</strong>
        </div>
      </div>

      <div className={styles.finderToolbar}>
        <label className={styles.finderSearch}>
          <Search size={15} />
          <input
            value={finderQuery}
            onChange={(event) => setFinderQuery(event.target.value)}
            placeholder="搜索应用、描述或 ID"
          />
        </label>
        <div className={styles.finderChips}>
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`${styles.finderChip} ${
                activeSection === section.id ? styles.finderChipActive : ''
              }`}
              onClick={() => setActiveSection(section.id)}
            >
              {section.label}
              <strong>{section.count}</strong>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.finderQuickRow}>
        {quickOpenApps.map((app) => (
          <button
            key={app.id}
            type="button"
            className={styles.finderQuickAction}
            onClick={() => onOpen(app.id)}
          >
            <div className={styles.desktopIconBadge} style={{ background: app.color }}>
              {renderAppIcon(app, 16)}
            </div>
            <span>{app.title}</span>
          </button>
        ))}
      </div>

      <div className={styles.finderContent}>
        {visibleApps.length === 0 ? (
          <div className={styles.finderEmpty}>当前筛选下没有匹配入口。</div>
        ) : (
          <div className={styles.finderContentGrid}>
            {visibleApps.map((app) => (
              <button key={app.id} className={styles.finderCard} onClick={() => onOpen(app.id)}>
                <div className={styles.finderCardHeader}>
                  <div className={styles.desktopIconBadge} style={{ background: app.color }}>
                    {renderAppIcon(app, 18)}
                  </div>
                  <span className={styles.finderCardStatus}>
                    {activeAppIds.has(app.id) ? '运行中' : '待打开'}
                  </span>
                </div>
                <div className={styles.finderCardBody}>
                  <strong>{app.title}</strong>
                  <span>{app.description}</span>
                </div>
                <div className={styles.finderCardFooter}>
                  <small>{app.runtime === 'component' ? '内置工具' : getImportedAppStatus(app)}</small>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const TerminalPanel: React.FC<{
  apps: DesktopAppDefinition[];
  windows: WindowState[];
  tasks: TaskItem[];
  alarms: AlarmItem[];
  darkMode: boolean;
  preferences: DesktopPreferences;
  onOpenApp: (appId: string) => void;
  onSetDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  onUpdatePreference: <K extends keyof DesktopPreferences>(
    key: K,
    value: DesktopPreferences[K],
  ) => void;
  onRevealDock: () => void;
}> = ({
  apps,
  windows,
  tasks,
  alarms,
  darkMode,
  preferences,
  onOpenApp,
  onSetDarkMode,
  onUpdatePreference,
  onRevealDock,
}) => {
  const [terminalInput, setTerminalInput] = useState('');
  const [entries, setEntries] = useState<TerminalEntry[]>(() => [
    createTerminalEntry('hint', '凤煌终端已连接。输入 help 查看可用命令。'),
    createTerminalEntry(
      'output',
      `当前主题：${darkMode ? '深色' : '浅色'}，Dock：${preferences.autoHideDock ? '自动隐藏' : '常驻显示'}`,
    ),
  ]);
  const outputRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!outputRef.current) return;
    outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [entries]);

  const appendEntries = useCallback((newEntries: TerminalEntry[]) => {
    setEntries((prev) => [...prev, ...newEntries]);
  }, []);

  const executeCommand = useCallback(
    (rawInput: string) => {
      const input = rawInput.trim();
      if (!input) return;

      const [command, ...rest] = input.split(/\s+/);
      const arg = rest.join(' ').trim();

      if (command === 'clear') {
        setEntries([]);
        return;
      }

      const nextEntries: TerminalEntry[] = [createTerminalEntry('command', input)];

      switch (command) {
        case 'help':
          nextEntries.push(
            createTerminalEntry('output', 'status · 查看桌面状态'),
            createTerminalEntry('output', 'apps · 查看可打开应用'),
            createTerminalEntry('output', 'open <应用名或 appId> · 直接打开应用'),
            createTerminalEntry('output', 'theme dark|light · 切换主题'),
            createTerminalEntry('output', 'dock auto|show · 切换 Dock 策略'),
            createTerminalEntry('output', 'tasks · 查看任务概览'),
            createTerminalEntry('output', 'alarms · 查看提醒概览'),
            createTerminalEntry('output', 'windows · 查看活动窗口'),
            createTerminalEntry('output', 'clear · 清空当前输出'),
          );
          break;
        case 'status':
          nextEntries.push(
            createTerminalEntry('output', `活动窗口：${windows.filter((item) => !item.minimized).length}`),
            createTerminalEntry('output', `已完成事项：${tasks.filter((item) => item.done).length}/${tasks.length}`),
            createTerminalEntry('output', `启用提醒：${alarms.filter((item) => item.enabled).length}`),
            createTerminalEntry('output', `主题同步：${darkMode ? '深色模式' : '浅色模式'}`),
            createTerminalEntry(
              'output',
              `底部 Dock：${preferences.autoHideDock ? '自动隐藏，靠近底边唤起' : '常驻显示'}`,
            ),
          );
          break;
        case 'apps':
          apps.forEach((app) => {
            nextEntries.push(
              createTerminalEntry('output', `${app.id} · ${app.title} · ${APP_SUMMARY_MAP[app.id] ?? app.description}`),
            );
          });
          break;
        case 'open': {
          if (!arg) {
            nextEntries.push(createTerminalEntry('error', '请输入应用名或 appId，例如 open ai-agent'));
            break;
          }
          const normalizedArg = arg.toLowerCase();
          const target =
            apps.find((app) => app.id.toLowerCase() === normalizedArg) ??
            apps.find((app) => app.title.toLowerCase().includes(normalizedArg));

          if (!target) {
            nextEntries.push(createTerminalEntry('error', `没有找到 ${arg} 对应的应用`));
            break;
          }
          onOpenApp(target.id);
          nextEntries.push(createTerminalEntry('output', `已打开 ${target.title}`));
          break;
        }
        case 'theme':
          if (!arg || !['dark', 'light'].includes(arg)) {
            nextEntries.push(createTerminalEntry('error', '请输入 theme dark 或 theme light'));
            break;
          }
          onSetDarkMode(arg === 'dark');
          nextEntries.push(createTerminalEntry('output', `主题已切换为${arg === 'dark' ? '深色' : '浅色'}模式`));
          break;
        case 'dock':
          if (arg === 'auto') {
            onUpdatePreference('autoHideDock', true);
            nextEntries.push(createTerminalEntry('output', '底部 Dock 已改为自动隐藏'));
            break;
          }
          if (arg === 'show') {
            onUpdatePreference('autoHideDock', false);
            onRevealDock();
            nextEntries.push(createTerminalEntry('output', '底部 Dock 已改为常驻显示'));
            break;
          }
          nextEntries.push(createTerminalEntry('error', '请输入 dock auto 或 dock show'));
          break;
        case 'tasks':
          tasks.forEach((task) => {
            nextEntries.push(
              createTerminalEntry('output', `[${task.done ? '已完成' : '待处理'}] ${task.title} · ${task.tag}`),
            );
          });
          break;
        case 'alarms':
          alarms.forEach((alarm) => {
            nextEntries.push(
              createTerminalEntry(
                'output',
                `[${alarm.enabled ? '启用' : '关闭'}] ${alarm.time} · ${alarm.label}`,
              ),
            );
          });
          break;
        case 'windows': {
          const visibleWindows = windows.filter((item) => !item.minimized);
          if (visibleWindows.length === 0) {
            nextEntries.push(createTerminalEntry('output', '当前没有打开中的窗口'));
            break;
          }
          visibleWindows.forEach((item) => {
            nextEntries.push(createTerminalEntry('output', `${item.title} · z${item.zIndex}`));
          });
          break;
        }
        default:
          nextEntries.push(createTerminalEntry('error', `未知命令：${command}`));
      }

      appendEntries(nextEntries);
    },
    [
      alarms,
      apps,
      appendEntries,
      darkMode,
      onOpenApp,
      onRevealDock,
      onSetDarkMode,
      onUpdatePreference,
      preferences.autoHideDock,
      tasks,
      windows,
    ],
  );

  return (
    <div className={styles.terminalShell}>
      <div className={styles.terminalToolbar}>
        <div>
          <strong>桌面终端</strong>
          <span>支持状态查询、打开应用、主题切换和 Dock 控制。</span>
        </div>
        <div className={styles.terminalQuickActions}>
          {['help', 'status', 'apps', 'tasks'].map((command) => (
            <button
              key={command}
              type="button"
              className={styles.terminalAction}
              onClick={() => executeCommand(command)}
            >
              {command}
            </button>
          ))}
        </div>
      </div>

      <div ref={outputRef} className={styles.terminalOutput}>
        {entries.map((entry) => (
          <div
            key={entry.id}
            className={`${styles.terminalEntry} ${
              entry.tone === 'command'
                ? styles.terminalEntryCommand
                : entry.tone === 'error'
                  ? styles.terminalEntryError
                  : entry.tone === 'hint'
                    ? styles.terminalEntryHint
                    : styles.terminalEntryOutput
            }`}
          >
            {entry.content}
          </div>
        ))}
      </div>

      <form
        className={styles.terminalInputRow}
        onSubmit={(event) => {
          event.preventDefault();
          executeCommand(terminalInput);
          setTerminalInput('');
        }}
      >
        <span className={styles.terminalPrompt}>$</span>
        <input
          value={terminalInput}
          onChange={(event) => setTerminalInput(event.target.value)}
          className={styles.terminalInput}
          placeholder="输入命令，例如 open ai-agent"
        />
      </form>
    </div>
  );
};

const SettingsPanel: React.FC<{
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  preferences: DesktopPreferences;
  onUpdatePreference: <K extends keyof DesktopPreferences>(
    key: K,
    value: DesktopPreferences[K],
  ) => void;
  visibleWindowCount: number;
  installedAppCount: number;
  enabledAlarmCount: number;
  dockAppCount: number;
  nextAlarmLabel: string;
  activeWindowTitles: string[];
  onOpenApp: (appId: string) => void;
  isMobile: boolean;
}> = ({
  darkMode,
  setDarkMode,
  preferences,
  onUpdatePreference,
  visibleWindowCount,
  installedAppCount,
  enabledAlarmCount,
  dockAppCount,
  nextAlarmLabel,
  activeWindowTitles,
  onOpenApp,
  isMobile,
}) => {
  const mobileStats = [
    { label: '活动窗口', value: visibleWindowCount },
    { label: '已接入应用', value: installedAppCount },
    { label: '提醒', value: enabledAlarmCount },
    { label: 'Dock', value: dockAppCount },
  ];

  return (
    <div className={`${styles.settingsShell} ${isMobile ? styles.settingsShellMobile : ''}`}>
      {isMobile ? (
        <section className={styles.settingsMobileHero}>
          <div className={styles.settingsMobileHeroCopy}>
            <p className={styles.settingsMobileKicker}>系统设置</p>
            <h3>上下滑动查看，不再像假面板。</h3>
            <span>主题、交互、Dock、提醒和当前工作区状态都统一到一页里，手机上也能直接调整。</span>
          </div>
          <div className={styles.settingsMobileStats}>
            {mobileStats.map((item) => (
              <div key={item.label} className={styles.settingsMobileStat}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className={styles.settingsHero}>
        <div className={styles.settingsHeroCopy}>
          <p className={styles.settingsMobileKicker}>桌面控制台</p>
          <h3>把主题、提醒、Dock 和触控偏好收进同一页。</h3>
          <span>这里的设置会直接影响桌面壳和系统工具，不再只是展示性按钮。</span>
        </div>
        <div className={styles.settingsActionList}>
          <button type="button" className={styles.settingsLaunchButton} onClick={() => onOpenApp('kui-chat')}>
            打开聊天
          </button>
          <button type="button" className={styles.settingsLaunchButton} onClick={() => onOpenApp('ai-agent')}>
            打开智能体
          </button>
          <button
            type="button"
            className={styles.settingsLaunchButton}
            onClick={() => onOpenApp('frontend-converter')}
          >
            打开接入器
          </button>
          <button type="button" className={styles.settingsLaunchButton} onClick={() => onOpenApp('codeEditor')}>
            打开编辑器
          </button>
          <button type="button" className={styles.settingsLaunchButton} onClick={() => onOpenApp('fenghuang')}>
            打开凤煌创作入口
          </button>
        </div>
      </section>

      <section className={styles.settingsSummaryGrid}>
        <div className={styles.settingsSummaryCard}>
          <span>活动窗口</span>
          <strong>{visibleWindowCount}</strong>
        </div>
        <div className={styles.settingsSummaryCard}>
          <span>已接入应用</span>
          <strong>{installedAppCount}</strong>
        </div>
        <div className={styles.settingsSummaryCard}>
          <span>已启用提醒</span>
          <strong>{enabledAlarmCount}</strong>
        </div>
        <div className={styles.settingsSummaryCard}>
          <span>Dock 状态</span>
          <strong>{preferences.autoHideDock ? '自动隐藏' : '常驻显示'}</strong>
        </div>
      </section>

      <div className={styles.settingsColumns}>
      <section className={styles.settingsGroup}>
        <div className={styles.settingsGroupHeader}>
          <strong>外观</strong>
          <span>主题、密度和动画控制。</span>
        </div>
        <div className={styles.settingsOption}>
          <div className={styles.settingsOptionCopy}>
            <strong>主题模式</strong>
            <span>和登录页、充值页保持同一套浅色 / 深色状态。</span>
          </div>
          <button className={styles.settingsToggle} onClick={() => setDarkMode((value) => !value)}>
            {darkMode ? '深色' : '浅色'}
          </button>
        </div>
        <div className={styles.settingsOption}>
          <div className={styles.settingsOptionCopy}>
            <strong>紧凑布局</strong>
            <span>减少桌面和侧栏留白，让应用入口更靠近工作内容。</span>
          </div>
          <button
            className={styles.settingsGhostToggle}
            onClick={() => onUpdatePreference('compactLayout', !preferences.compactLayout)}
          >
            {preferences.compactLayout ? '已启用' : '未启用'}
          </button>
        </div>
        <div className={styles.settingsOption}>
          <div className={styles.settingsOptionCopy}>
            <strong>减少动态效果</strong>
            <span>关闭夸张动画，切页和 Dock 动作会更利落。</span>
          </div>
          <button
            className={styles.settingsGhostToggle}
            onClick={() => onUpdatePreference('reducedMotion', !preferences.reducedMotion)}
          >
            {preferences.reducedMotion ? '已启用' : '未启用'}
          </button>
        </div>
        <div className={styles.settingsOption}>
          <div className={styles.settingsOptionCopy}>
            <strong>Dock 自动隐藏</strong>
            <span>默认给内容腾出空间，靠近底边再唤起底部应用栏。</span>
          </div>
          <button
            className={styles.settingsGhostToggle}
            onClick={() => onUpdatePreference('autoHideDock', !preferences.autoHideDock)}
          >
            {preferences.autoHideDock ? '已启用' : '已关闭'}
          </button>
        </div>
      </section>

      <section className={styles.settingsGroup}>
        <div className={styles.settingsGroupHeader}>
          <strong>交互</strong>
          <span>通知、触控和当前设备模式。</span>
        </div>
        <div className={styles.settingsOption}>
          <div className={styles.settingsOptionCopy}>
            <strong>桌面提醒</strong>
            <span>保留任务、提醒和窗口状态通知。</span>
          </div>
          <button
            className={styles.settingsGhostToggle}
            onClick={() =>
              onUpdatePreference('notificationsEnabled', !preferences.notificationsEnabled)
            }
          >
            {preferences.notificationsEnabled ? '已开启' : '已关闭'}
          </button>
        </div>
        <div className={styles.settingsOption}>
          <div className={styles.settingsOptionCopy}>
            <strong>触控优先</strong>
            <span>在手机和窄屏里优先展示大按钮与滑动入口。</span>
          </div>
          <button
            className={styles.settingsGhostToggle}
            onClick={() => onUpdatePreference('touchPriority', !preferences.touchPriority)}
          >
            {preferences.touchPriority ? '已启用' : '未启用'}
          </button>
        </div>
        <div className={styles.settingsOption}>
          <div className={styles.settingsOptionCopy}>
            <strong>当前设备</strong>
            <span>{isMobile ? '当前是移动端布局。' : '当前是桌面布局。'}</span>
          </div>
          <span className={styles.settingsBadge}>{isMobile ? '移动端' : '桌面端'}</span>
        </div>
        <div className={styles.settingsOption}>
          <div className={styles.settingsOptionCopy}>
            <strong>下一提醒</strong>
            <span>当前桌面会优先显示这一条提醒。</span>
          </div>
          <span className={styles.settingsBadge}>{nextAlarmLabel}</span>
        </div>
      </section>

      </div>

      <section className={styles.settingsStatusList}>
        <div className={styles.settingsStatusRow}>
          <span>当前打开窗口</span>
          <strong>{activeWindowTitles.length ? activeWindowTitles.join('、') : '暂无打开窗口'}</strong>
        </div>
        <div className={styles.settingsStatusRow}>
          <span>底部 Dock 入口</span>
          <strong>{dockAppCount} 个</strong>
        </div>
      </section>
    </div>
  );
};

const EmbeddedToolShell: React.FC<{
  app: DesktopAppDefinition;
  eyebrow: string;
  description: string;
  stats: EmbeddedToolMetric[];
  children: React.ReactNode;
  stretch?: boolean;
}> = ({ app, eyebrow, description, stats, children, stretch = true }) => (
  <div className={styles.embeddedToolShell}>
    <section className={styles.embeddedToolIntro}>
      <div className={styles.embeddedToolLead}>
        <div className={styles.embeddedToolIcon} style={{ background: app.color }}>
          {renderAppIcon(app, 18)}
        </div>
        <div className={styles.embeddedToolCopy}>
          <p>{eyebrow}</p>
          <strong>{app.title}</strong>
          <span>{description}</span>
        </div>
      </div>
    </section>

    <section className={styles.embeddedToolMetrics}>
      {stats.map((item) => (
        <div key={`${item.label}-${item.value}`} className={styles.embeddedToolMetric}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </section>

    <section className={styles.embeddedToolSurface}>
      <div className={stretch ? styles.embeddedToolStretch : styles.embeddedToolContent}>{children}</div>
    </section>
  </div>
);

const CalendarPanel: React.FC<{
  currentMonthLabel: string;
  currentDate: number;
  selectedDate: number;
  calendarCells: Array<number | null>;
  alarms: AlarmItem[];
  tasks: TaskItem[];
  onSelectDate: (day: number) => void;
}> = ({ currentMonthLabel, currentDate, selectedDate, calendarCells, alarms, tasks, onSelectDate }) => (
  <div className={styles.utilityPanel}>
    <div className={styles.utilityHero}>
      <div className={styles.utilityPanelHeader}>
        <CalendarDays size={18} />
        <div><strong>日历</strong><span>{currentMonthLabel}</span></div>
      </div>
      <div className={styles.utilitySummaryRow}>
        <div className={styles.utilitySummaryCard}>
          <span>今日</span>
          <strong>{currentDate} 日</strong>
        </div>
        <div className={styles.utilitySummaryCard}>
          <span>已启用提醒</span>
          <strong>{alarms.filter((alarm) => alarm.enabled).length}</strong>
        </div>
        <div className={styles.utilitySummaryCard}>
          <span>待办任务</span>
          <strong>{tasks.filter((task) => !task.done).length}</strong>
        </div>
      </div>
    </div>
    <div className={styles.calendarHeader}><strong>{currentMonthLabel}</strong><span>{selectedDate === currentDate ? '今天' : `已选 ${selectedDate} 日`}</span></div>
    <div className={styles.calendarWeekdays}>{WEEKDAY_LABELS.map((day) => <span key={day}>{day}</span>)}</div>
    <div className={styles.calendarGrid}>
      {calendarCells.map((day, index) => (
        <button
          type="button"
          disabled={!day}
          onClick={() => day && onSelectDate(day)}
          key={`${day ?? 'empty'}-${index}`}
          className={`${styles.calendarCell} ${!day ? styles.calendarCellMuted : ''} ${day === currentDate ? styles.calendarCellToday : ''} ${day === selectedDate ? styles.calendarCellSelected : ''}`}
        >
          {day ?? ''}
        </button>
      ))}
    </div>
    <div className={styles.calendarAgenda}>
      <div className={styles.calendarAgendaCard}>
        <strong>提醒焦点</strong>
        <span>{alarms.find((alarm) => alarm.enabled)?.label ?? '今日没有启用提醒'}</span>
      </div>
      <div className={styles.calendarAgendaCard}>
        <strong>任务进度</strong>
        <span>已完成 {tasks.filter((task) => task.done).length} / {tasks.length}</span>
      </div>
    </div>
  </div>
);

const TasksPanel: React.FC<{
  tasks: TaskItem[];
  taskDraft: string;
  onTaskDraftChange: React.Dispatch<React.SetStateAction<string>>;
  onAddTask: () => void;
  onToggleTask: (id: string) => void;
  onRemoveTask: (id: string) => void;
}> = ({ tasks, taskDraft, onTaskDraftChange, onAddTask, onToggleTask, onRemoveTask }) => (
  <div className={styles.utilityPanel}>
    <div className={styles.utilityHero}>
      <div className={styles.utilityPanelHeader}>
        <ListTodo size={18} />
        <div><strong>任务板</strong><span>现在可以直接新增、切换和删除任务。</span></div>
      </div>
      <div className={styles.utilitySummaryRow}>
        <div className={styles.utilitySummaryCard}>
          <span>待处理</span>
          <strong>{tasks.filter((task) => !task.done).length}</strong>
        </div>
        <div className={styles.utilitySummaryCard}>
          <span>已完成</span>
          <strong>{tasks.filter((task) => task.done).length}</strong>
        </div>
      </div>
    </div>
    <div className={styles.taskComposer}>
      <input
        value={taskDraft}
        onChange={(event) => onTaskDraftChange(event.target.value)}
        className={styles.taskComposerInput}
        placeholder="新增一个桌面任务"
      />
      <button type="button" className={styles.taskComposerButton} onClick={onAddTask}>
        新增任务
      </button>
    </div>
    <div className={styles.taskList}>
      {tasks.map((task) => (
        <div key={task.id} className={`${styles.taskItem} ${task.done ? styles.taskItemDone : ''}`}>
          <button type="button" className={styles.taskToggleButton} onClick={() => onToggleTask(task.id)}>
            <span className={styles.taskCheck}>{task.done ? <Check size={13} /> : null}</span>
            <span className={styles.taskContent}><strong>{task.title}</strong><small>{task.tag}</small></span>
          </button>
          <button type="button" className={styles.taskRemoveButton} onClick={() => onRemoveTask(task.id)} aria-label={`删除 ${task.title}`}>
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  </div>
);

const AlarmsPanel: React.FC<{
  alarms: AlarmItem[];
  alarmDraft: { label: string; time: string };
  onAlarmDraftChange: React.Dispatch<
    React.SetStateAction<{
      label: string;
      time: string;
    }>
  >;
  onAddAlarm: () => void;
  onToggleAlarm: (id: string) => void;
  onRemoveAlarm: (id: string) => void;
}> = ({ alarms, alarmDraft, onAlarmDraftChange, onAddAlarm, onToggleAlarm, onRemoveAlarm }) => (
  <div className={styles.utilityPanel}>
    <div className={styles.utilityHero}>
      <div className={styles.utilityPanelHeader}>
        <AlarmClock size={18} />
        <div><strong>闹钟提醒</strong><span>统一管理桌面提醒，现在支持新增、启停和移除。</span></div>
      </div>
      <div className={styles.utilitySummaryRow}>
        <div className={styles.utilitySummaryCard}>
          <span>已启用</span>
          <strong>{alarms.filter((alarm) => alarm.enabled).length}</strong>
        </div>
        <div className={styles.utilitySummaryCard}>
          <span>总提醒</span>
          <strong>{alarms.length}</strong>
        </div>
      </div>
    </div>
    <div className={styles.alarmComposer}>
      <input
        value={alarmDraft.label}
        onChange={(event) =>
          onAlarmDraftChange((prev) => ({
            ...prev,
            label: event.target.value,
          }))
        }
        className={styles.taskComposerInput}
        placeholder="提醒标题"
      />
      <input
        type="time"
        value={alarmDraft.time}
        onChange={(event) =>
          onAlarmDraftChange((prev) => ({
            ...prev,
            time: event.target.value,
          }))
        }
        className={styles.alarmTimeInput}
      />
      <button type="button" className={styles.taskComposerButton} onClick={onAddAlarm}>
        新增提醒
      </button>
    </div>
    <div className={styles.alarmListRich}>
      {alarms.map((alarm) => (
        <div key={alarm.id} className={styles.alarmCard}>
          <button type="button" className={styles.alarmMain} onClick={() => onToggleAlarm(alarm.id)}>
            <span className={styles.alarmMeta}><strong>{alarm.label}</strong><small>{alarm.time}</small></span>
            <span className={styles.alarmSwitch}>{alarm.enabled ? '已启用' : '已关闭'}</span>
          </button>
          <button type="button" className={styles.taskRemoveButton} onClick={() => onRemoveAlarm(alarm.id)} aria-label={`删除 ${alarm.label}`}>
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  </div>
);

const NotesPanel: React.FC<{
  notes: NoteItem[];
  noteDraft: { title: string; body: string };
  onNoteDraftChange: React.Dispatch<
    React.SetStateAction<{
      title: string;
      body: string;
    }>
  >;
  onAddNote: () => void;
  onRemoveNote: (id: string) => void;
}> = ({ notes, noteDraft, onNoteDraftChange, onAddNote, onRemoveNote }) => (
  <div className={styles.utilityPanel}>
    <div className={styles.utilityHero}>
      <div className={styles.utilityPanelHeader}>
        <StickyNote size={18} />
        <div><strong>便签</strong><span>桌面内置记录区，现在支持即时新增和单条清理。</span></div>
      </div>
      <div className={styles.utilitySummaryRow}>
        <div className={styles.utilitySummaryCard}>
          <span>便签总数</span>
          <strong>{notes.length}</strong>
        </div>
      </div>
    </div>
    <div className={styles.notesComposer}>
      <div className={styles.notesComposerInputs}>
        <input
          value={noteDraft.title}
          onChange={(event) =>
            onNoteDraftChange((prev) => ({
              ...prev,
              title: event.target.value,
            }))
          }
          className={styles.taskComposerInput}
          placeholder="便签标题"
        />
        <textarea
          value={noteDraft.body}
          onChange={(event) =>
            onNoteDraftChange((prev) => ({
              ...prev,
              body: event.target.value,
            }))
          }
          className={styles.noteTextarea}
          placeholder="记录当前灵感、提醒或说明"
        />
      </div>
      <button type="button" className={styles.taskComposerButton} onClick={onAddNote}>
        保存便签
      </button>
    </div>
    <div className={styles.noteCardGrid}>
      {notes.map((note) => (
        <div key={note.id} className={styles.noteCard}>
          <div className={styles.noteCardHeader}>
            <strong>{note.title}</strong>
            <button type="button" className={styles.taskRemoveButton} onClick={() => onRemoveNote(note.id)} aria-label={`删除 ${note.title}`}>
              <Trash2 size={14} />
            </button>
          </div>
          <span>{note.body}</span>
        </div>
      ))}
    </div>
  </div>
);

const LegacyPanel: React.FC<{ app?: DesktopAppDefinition }> = ({ app }) => {
  const previewSrc = app?.route;

  return (
    <div className={styles.legacyShell}>
      <div className={styles.legacyHeader}>
        <div className={styles.legacyIcon} style={{ background: app?.color ?? '#4b5563' }}>
          {app ? renderAppIcon(app, 28) : <Globe2 size={28} />}
        </div>
        <div className={styles.legacyMeta}>
          <h3>{app?.title ?? '未命名应用'}</h3>
          <p>{app?.description ?? '暂无描述'}</p>
        </div>
      </div>
      {previewSrc ? (
        <div className={styles.legacyPreview}>
          <iframe
            className={styles.legacyPreviewFrame}
            src={previewSrc}
            title={`${app?.title ?? 'app'}-preview`}
          />
        </div>
      ) : null}
    </div>
  );
};

export default MacOSDesktop;
