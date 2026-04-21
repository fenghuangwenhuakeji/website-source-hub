import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Code2,
  Copy,
  Download,
  ExternalLink,
  FolderUp,
  HardDrive,
  LayoutGrid,
  Globe2,
  BookOpen,
  MessageSquare,
  Sparkles as SparklesIcon,
  WandSparkles,
  Folder,
  Terminal,
  Settings as SettingsIcon,
  Bot,
  Package,
  Trash2,
  ShoppingBag,
  Camera,
  Music4,
  Gamepad2,
  NotebookPen,
  Briefcase,
  BarChart3,
  Image as ImageIcon,
  FileText,
  Palette,
  Shield,
  HeartPulse,
} from 'lucide-react';
import styles from './index.module.scss';
import {
  DESKTOP_ICON_OPTIONS,
  fileListToDesktopSources,
  getInstalledDesktopApps,
  installGeneratedDesktopApp,
  installNativeExecutableApp,
  launchNativeApp,
  resolveNativeApp,
  uninstallGeneratedDesktopApp,
  updateInstalledDesktopApp,
  type DesktopAppDefinition,
} from '@/lib';
import { copyTextToClipboard } from '@/lib/clipboard';
import { getCurrentUserRole, isCurrentUserAdmin } from '@/lib/userScopedStorage';

interface FrontendAppConverterProps {
  onInstalled?: (app: DesktopAppDefinition) => void;
}

type Mode = 'frontend' | 'native' | 'manage';
type ImportedFile = { path: string; content: string };

const normalizeImportedPath = (value: string): string =>
  value.replace(/\\/g, '/').replace(/^\.?\//, '').trim();

const readBrowserFiles = async (fileList: FileList): Promise<ImportedFile[]> => {
  const files = await Promise.all(
    Array.from(fileList).map(async (file) => ({
      path: normalizeImportedPath(file.webkitRelativePath || file.name),
      content: await file.text(),
    })),
  );

  return files.sort((a, b) => a.path.localeCompare(b.path));
};

const mergeImportedFiles = (current: ImportedFile[], incoming: ImportedFile[]): ImportedFile[] => {
  const byPath = new Map<string, ImportedFile>();

  for (const file of current) {
    const normalizedPath = normalizeImportedPath(file.path);
    byPath.set(normalizedPath, { path: normalizedPath, content: file.content });
  }

  for (const file of incoming) {
    const normalizedPath = normalizeImportedPath(file.path);
    byPath.set(normalizedPath, { path: normalizedPath, content: file.content });
  }

  return Array.from(byPath.values()).sort((a, b) => a.path.localeCompare(b.path));
};

const splitLaunchArgs = (value: string): string[] =>
  value
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

const getPathDirname = (value: string): string => {
  const normalized = value.replace(/[\\/]+/g, '\\');
  const idx = normalized.lastIndexOf('\\');
  return idx < 0 ? '' : normalized.slice(0, idx);
};

const formatRuntimeLabel = (runtime: DesktopAppDefinition['runtime']): string => {
  switch (runtime) {
    case 'generated-web':
      return '导入源码应用';
    case 'native-exe':
      return '本地 EXE 程序';
    case 'static-web':
      return '静态展示应用';
    case 'component':
      return '内置组件';
    default:
      return runtime;
  }
};

const ICON_LABEL_MAP: Record<string, string> = {
  LayoutGrid: '布局网格',
  Code2: '代码',
  Globe2: '网页',
  BookOpen: '书籍',
  MessageSquare: '对话',
  Sparkles: '星光',
  WandSparkles: '魔法棒',
  Folder: '文件夹',
  Terminal: '终端',
  Settings: '设置',
  Bot: '智能体',
  Package: '包裹',
  ShoppingBag: '购物袋',
  Camera: '相机',
  Music4: '音乐',
  Gamepad2: '游戏',
  NotebookPen: '笔记',
  Briefcase: '公文包',
  BarChart3: '统计图',
  Image: '图片',
  FileText: '文档',
  Palette: '调色板',
  Shield: '盾牌',
  HeartPulse: '心跳',
};

const getIconLabel = (value: string): string => ICON_LABEL_MAP[value] ?? value;

const ICON_GLYPH_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  LayoutGrid,
  Code2,
  Globe2,
  BookOpen,
  MessageSquare,
  Sparkles: SparklesIcon,
  WandSparkles,
  Folder,
  Terminal,
  Settings: SettingsIcon,
  Bot,
  Package,
  ShoppingBag,
  Camera,
  Music4,
  Gamepad2,
  NotebookPen,
  Briefcase,
  BarChart3,
  Image: ImageIcon,
  FileText,
  Palette,
  Shield,
  HeartPulse,
};

const COLOR_PRESETS = [
  '#ff8e5f',
  '#ff724d',
  '#ff9d66',
  '#5b8cff',
  '#22d3ee',
  '#34d399',
  '#a78bfa',
  '#fb7185',
];

const ICON_ACCENT_MAP: Record<string, string> = {
  LayoutGrid: '#ff8e5f',
  Code2: '#5b8cff',
  Globe2: '#22d3ee',
  BookOpen: '#a78bfa',
  MessageSquare: '#fb7185',
  Sparkles: '#ffd166',
  WandSparkles: '#ff9d66',
  Folder: '#f59e0b',
  Terminal: '#34d399',
  Settings: '#94a3b8',
  Bot: '#38bdf8',
  Package: '#f97316',
  ShoppingBag: '#f472b6',
  Camera: '#e879f9',
  Music4: '#60a5fa',
  Gamepad2: '#4ade80',
  NotebookPen: '#facc15',
  Briefcase: '#c084fc',
  BarChart3: '#2dd4bf',
  Image: '#fb923c',
  FileText: '#fdba74',
  Palette: '#f59e0b',
  Shield: '#22c55e',
  HeartPulse: '#f43f5e',
};

const ADMIN_UPLOAD_MESSAGE = '只有管理员类型的账号才能上传、修改或删除应用。';

const FrontendAppConverter: React.FC<FrontendAppConverterProps> = ({ onInstalled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>('frontend');
  const [title, setTitle] = useState('统一应用转换接口');
  const [description, setDescription] = useState('导入前端源码、本地程序或已接入应用，整理后直接回到桌面打开。');
  const [icon, setIcon] = useState<string>('LayoutGrid');
  const [color, setColor] = useState('#ff8e5f');
  const [width, setWidth] = useState(1120);
  const [height, setHeight] = useState(780);
  const [htmlSnippet, setHtmlSnippet] = useState('');
  const [cssSnippet, setCssSnippet] = useState('');
  const [scriptSnippet, setScriptSnippet] = useState('');
  const [scriptFileName] = useState('main.ts');
  const [importedFiles, setImportedFiles] = useState<ImportedFile[]>([]);
  const [executablePath, setExecutablePath] = useState('');
  const [workingDirectory, setWorkingDirectory] = useState('');
  const [launchArgsText, setLaunchArgsText] = useState('');
  const [managedApps, setManagedApps] = useState<DesktopAppDefinition[]>([]);
  const [selectedAppId, setSelectedAppId] = useState('');
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [iconPanelOpen, setIconPanelOpen] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canManageApps = isCurrentUserAdmin();
  const currentUserRole = getCurrentUserRole();
  const SelectedIconGlyph = ICON_GLYPH_MAP[icon] ?? LayoutGrid;
  const selectedIconLabel = getIconLabel(icon);
  const selectedIconAccent = color;

  const refreshManagedApps = useCallback(async () => {
    const apps = await getInstalledDesktopApps();
    setManagedApps(apps);
    setSelectedAppIds((current) => current.filter((id) => apps.some((app) => app.id === id)));
    setSelectedAppId((current) => (current && apps.some((app) => app.id === current) ? current : apps[0]?.id ?? ''));
  }, []);

  useEffect(() => {
    void refreshManagedApps();
  }, [refreshManagedApps]);

  useEffect(() => {
    if (folderInputRef.current) {
      folderInputRef.current.setAttribute('webkitdirectory', '');
      folderInputRef.current.setAttribute('directory', '');
    }
  }, []);

  const selectedManagedApp = useMemo(
    () => managedApps.find((app) => app.id === selectedAppId) ?? null,
    [managedApps, selectedAppId],
  );

  const mergedFiles = useMemo(() => {
    const next = [...importedFiles];
    const existing = new Set(importedFiles.map((file) => file.path));

    if (htmlSnippet.trim() && !existing.has('index.html')) {
      next.push({ path: 'index.html', content: htmlSnippet });
    }
    if (cssSnippet.trim() && !existing.has('style.css')) {
      next.push({ path: 'style.css', content: cssSnippet });
    }
    if (scriptSnippet.trim() && !existing.has(scriptFileName)) {
      next.push({ path: scriptFileName, content: scriptSnippet });
    }

    return next;
  }, [cssSnippet, htmlSnippet, importedFiles, scriptFileName, scriptSnippet]);

  const importedPreview = useMemo(() => mergedFiles.slice(0, 8), [mergedFiles]);
  const selectedLaunchTarget = selectedManagedApp?.native
    ? selectedManagedApp.native.launcherPath || selectedManagedApp.native.executablePath
    : '';
  const selectedManagedApps = useMemo(
    () =>
      selectedAppIds
        .map((appId) => managedApps.find((app) => app.id === appId))
        .filter((app): app is DesktopAppDefinition => Boolean(app)),
    [managedApps, selectedAppIds],
  );

  const heroBadges = useMemo(
    () => [
      `${mergedFiles.length} 个待处理文件`,
      `${managedApps.length} 个已接入应用`,
      mode === 'frontend' ? '源码接入模式' : mode === 'native' ? '本地程序模式' : '统一管理模式',
    ],
    [managedApps.length, mergedFiles.length, mode],
  );

  const manageStatus = useMemo(() => {
    if (mode !== 'manage') {
      return {
        title: '当前不在管理模式',
        detail: '切换到统一应用管理后，可以查看、选择、删除和保存已接入应用。',
      };
    }

    if (bulkDeleteMode) {
      return {
        title:
          selectedAppIds.length > 0 ? `批量删除待确认 · 已选 ${selectedAppIds.length} 个` : '批量删除模式已开启',
        detail:
          selectedAppIds.length > 0
            ? '再次点击“批量删除”会弹出确认框，确认后将清除已勾选应用。'
            : '请先勾选要删除的应用，再点击“批量删除”完成确认。',
      };
    }

    if (selectedManagedApp) {
      return {
        title: `当前编辑：${selectedManagedApp.title}`,
        detail: '可保存当前修改，或者切换到其他应用继续编辑。',
      };
    }

    return {
      title: '已接入应用可管理',
      detail: '点击任意应用开始编辑，或先进入批量删除模式进行多选处理。',
    };
  }, [bulkDeleteMode, mode, selectedAppIds.length, selectedManagedApp]);

  const resetImportInputs = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
    }
  };

  const renameImportedFile = useCallback((currentPath: string, nextPath: string) => {
    const normalizedPath = normalizeImportedPath(nextPath);
    if (!normalizedPath) {
      return;
    }

    setImportedFiles((current) => {
      const renamed = current.map((file) =>
        file.path === currentPath ? { ...file, path: normalizedPath } : file,
      );
      return mergeImportedFiles([], renamed);
    });
  }, []);

  const copyText = async (value: string | undefined, successMessage: string) => {
    if (!value) {
      return;
    }

    try {
      const copied = await copyTextToClipboard(value);
      if (!copied) {
        throw new Error('copy_failed');
      }
      setError(null);
      setMessage(successMessage);
    } catch {
      setMessage(null);
      setError('复制失败，请手动复制。');
    }
  };

  const handleLaunchManagedApp = async (app: DesktopAppDefinition | null) => {
    if (!app?.native) {
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const launched = await launchNativeApp(app.native);

      if (
        launched.resolvedPath !== app.native.executablePath ||
        launched.workingDirectory !== (app.native.workingDirectory ?? '')
      ) {
        await updateInstalledDesktopApp(app.id, {
          native: {
            ...app.native,
            executablePath: launched.resolvedPath,
            workingDirectory: launched.workingDirectory,
          },
        });
        await refreshManagedApps();
      }

      setMessage(`已启动本地程序：${app.title}`);
    } catch (launchError) {
      setError(launchError instanceof Error ? launchError.message : '启动失败。');
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async (files: FileList | null) => {
    if (!files?.length) {
      return;
    }

    const incoming = await readBrowserFiles(files);
    const merged = mergeImportedFiles(importedFiles, incoming);

    setImportedFiles(merged);
    setError(null);
    setMessage(`已加入 ${incoming.length} 个文件，当前待处理 ${merged.length} 个。`);
    resetImportInputs();
  };

  const handleInstall = async () => {
    if (!canManageApps) {
      setMessage(null);
      setError(ADMIN_UPLOAD_MESSAGE);
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      let app: DesktopAppDefinition;

      if (mode === 'frontend') {
        if (mergedFiles.length === 0) {
          throw new Error('请先导入前端文件，或直接粘贴 HTML、CSS、JS / TS 内容。');
        }

        app = await installGeneratedDesktopApp({
          title,
          description,
          icon,
          color,
          width,
          height,
          sourceFiles: fileListToDesktopSources(mergedFiles),
        });
      } else {
        if (!executablePath.trim()) {
          throw new Error('请先填写本地 EXE 路径。');
        }

        const nativeDraft = {
          executablePath,
          workingDirectory: workingDirectory.trim() || getPathDirname(executablePath),
          launchArgs: splitLaunchArgs(launchArgsText),
        };
        const resolvedNative = await resolveNativeApp(nativeDraft);

        app = await installNativeExecutableApp({
          title,
          description,
          icon,
          color,
          width,
          height,
          executablePath: resolvedNative.resolvedPath,
          workingDirectory: resolvedNative.workingDirectory,
          launchArgs: nativeDraft.launchArgs,
        });

        setExecutablePath(resolvedNative.resolvedPath);
        setWorkingDirectory(resolvedNative.workingDirectory);
      }

      setMessage(`已接入凤煌桌面：${app.title}`);
      onInstalled?.(app);
      await refreshManagedApps();
    } catch (installError) {
      setError(installError instanceof Error ? installError.message : '接入失败。');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveManagedApp = async () => {
    if (!canManageApps) {
      setMessage(null);
      setError(ADMIN_UPLOAD_MESSAGE);
      return;
    }

    if (!selectedManagedApp) {
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const nextNative =
        selectedManagedApp.runtime === 'native-exe'
          ? {
              executablePath,
              workingDirectory: workingDirectory.trim() || undefined,
              launchArgs: splitLaunchArgs(launchArgsText),
              notes: selectedManagedApp.native?.notes,
              launcherPath: selectedManagedApp.native?.launcherPath,
              sourceRoot: selectedManagedApp.native?.sourceRoot,
            }
          : selectedManagedApp.native;
      const resolvedManagedNative =
        selectedManagedApp.runtime === 'native-exe' && nextNative
          ? await resolveNativeApp(nextNative)
          : null;

      const updated = await updateInstalledDesktopApp(selectedManagedApp.id, {
        title,
        description,
        icon,
        color,
        width,
        height,
        native:
          resolvedManagedNative && nextNative
            ? {
                ...nextNative,
                executablePath: resolvedManagedNative.resolvedPath,
                workingDirectory: resolvedManagedNative.workingDirectory,
              }
            : nextNative,
      });

      if (resolvedManagedNative) {
        setExecutablePath(resolvedManagedNative.resolvedPath);
        setWorkingDirectory(resolvedManagedNative.workingDirectory);
      }

      setMessage(`已保存：${updated.title}`);
      onInstalled?.(updated);
      await refreshManagedApps();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '保存失败。');
    } finally {
      setBusy(false);
    }
  };

  const toggleManagedSelection = (appId: string, checked?: boolean) => {
    setSelectedAppIds((current) => {
      const hasCurrent = current.includes(appId);
      const shouldSelect = typeof checked === 'boolean' ? checked : !hasCurrent;

      if (shouldSelect && !hasCurrent) {
        return [...current, appId];
      }

      if (!shouldSelect && hasCurrent) {
        return current.filter((id) => id !== appId);
      }

      return current;
    });
  };

  const handleDeleteManagedApps = async (appIds: string[]) => {
    if (!canManageApps) {
      setMessage(null);
      setError(ADMIN_UPLOAD_MESSAGE);
      return;
    }

    if (appIds.length === 0) {
      setMessage(null);
      setError('请先勾选要删除的应用，或先选中当前编辑应用。');
      return;
    }

    const titles = appIds
      .map((appId) => managedApps.find((app) => app.id === appId)?.title ?? appId)
      .filter(Boolean);

    const confirmed = window.confirm(
      appIds.length === 1
        ? `确定删除「${titles[0]}」吗？`
        : `确定批量删除这 ${appIds.length} 个应用吗？\n\n${titles.join('\n')}`,
    );

    if (!confirmed) {
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      for (const appId of appIds) {
        await uninstallGeneratedDesktopApp(appId);
      }

      setSelectedAppIds((current) => current.filter((id) => !appIds.includes(id)));
      setBulkDeleteMode(false);
      setMessage(
        appIds.length === 1
          ? `已删除应用：${titles[0]}`
          : `已批量删除 ${appIds.length} 个应用：${titles.join('、')}`,
      );
      await refreshManagedApps();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : '删除失败。');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteManagedApp = async () => {
    if (!selectedManagedApp) {
      return;
    }

    await handleDeleteManagedApps([selectedManagedApp.id]);
  };

  const handleDeleteSelectedApps = async () => {
    if (!bulkDeleteMode) {
      setBulkDeleteMode(true);
      setSelectedAppIds([]);
      setError(null);
      setMessage('已进入批量删除模式，请勾选要删除的应用后再次点击“批量删除”。');
      return;
    }

    if (selectedAppIds.length === 0) {
      setError(null);
      setMessage('当前没有勾选任何应用，请先选择要删除的项目。');
      return;
    }

    await handleDeleteManagedApps(selectedAppIds);
  };

  const handleDeleteAllApps = async () => {
    await handleDeleteManagedApps(managedApps.map((app) => app.id));
  };

  useEffect(() => {
    if (!selectedManagedApp || mode !== 'manage') {
      return;
    }

    setTitle(selectedManagedApp.title);
    setDescription(selectedManagedApp.description);
    setIcon(selectedManagedApp.icon);
    setColor(selectedManagedApp.color);
    setWidth(selectedManagedApp.width);
    setHeight(selectedManagedApp.height);
    setExecutablePath(selectedManagedApp.native?.executablePath ?? '');
    setWorkingDirectory(selectedManagedApp.native?.workingDirectory ?? '');
    setLaunchArgsText(selectedManagedApp.native?.launchArgs?.join(' ') ?? '');
  }, [mode, selectedManagedApp]);

  useEffect(() => {
    if (mode === 'manage') {
      return;
    }

    setBulkDeleteMode(false);
    setSelectedAppIds([]);
  }, [mode]);

  return (
    <div className={styles.converterShell}>
      <div className={styles.workspace}>
        <section className={styles.heroCard}>
          <p className={styles.eyebrow}>应用接入</p>
          <h1 className={styles.title}>统一应用转换接口</h1>
          <p className={styles.lead}>
            导入前端源码、本地程序或已接入应用，整理完成后直接回到桌面打开。
          </p>
          <div className={styles.heroBadges}>
            {heroBadges.map((item) => (
              <span key={item} className={styles.heroBadge}>
                {item}
              </span>
            ))}
          </div>
          {selectedManagedApps.length > 0 ? (
            <div className={styles.selectionBlock}>
              <div className={styles.selectionHeader}>
                <span className={styles.summaryTitle}>已勾选待删</span>
                <span className={styles.fileMeta}>{selectedManagedApps.length} 个应用</span>
              </div>
              <div className={styles.selectionList}>
                {selectedManagedApps.map((app) => (
                  <div key={app.id} className={styles.selectionItem}>
                    <span className={styles.fileName}>{app.title}</span>
                    <span className={styles.fileMeta}>{app.id}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {managedApps.length > 0 ? (
            <div className={styles.selectionBlock}>
              <div className={styles.selectionHeader}>
                <span className={styles.summaryTitle}>已接入应用列表</span>
                <span className={styles.fileMeta}>支持单个、批量和一键删除</span>
              </div>
              <div className={`${styles.selectionList} ${styles.manageAppGrid}`}>
                {managedApps.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    className={`${styles.selectionItemButton} ${selectedAppId === app.id ? styles.selectionItemButtonActive : ''}`}
                    onClick={() => setSelectedAppId(app.id)}
                  >
                    <span className={styles.fileName}>{app.title}</span>
                    <span className={styles.fileMeta}>{app.runtime}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className={`${styles.section} ${styles.modeSection}`}>
          <p className={styles.eyebrow}>工作模式</p>
          <div className={styles.modeSwitch}>
            <button
              type="button"
              className={`${styles.modeButton} ${mode === 'frontend' ? styles.modeButtonActive : ''}`}
              onClick={() => setMode('frontend')}
              style={{ '--mode-accent': '#22d3ee' } as React.CSSProperties}
            >
              <span className={styles.modeButtonIcon}><Code2 size={18} /></span>
              <span>
                <strong>前端源码接入</strong>
                <small>HTML / CSS / JS / TS</small>
              </span>
            </button>
            <button
              type="button"
              className={`${styles.modeButton} ${mode === 'native' ? styles.modeButtonActive : ''}`}
              onClick={() => setMode('native')}
              style={{ '--mode-accent': '#34d399' } as React.CSSProperties}
            >
              <span className={styles.modeButtonIcon}><HardDrive size={18} /></span>
              <span>
                <strong>本地程序接入</strong>
                <small>现成 EXE / 启动器</small>
              </span>
            </button>
            <button
              type="button"
              className={`${styles.modeButton} ${mode === 'manage' ? styles.modeButtonActive : ''}`}
              onClick={() => setMode('manage')}
              style={{ '--mode-accent': '#fb7185' } as React.CSSProperties}
            >
              <span className={styles.modeButtonIcon}><SettingsIcon size={18} /></span>
              <span>
                <strong>统一应用管理</strong>
                <small>已接入应用的修改和清理</small>
              </span>
            </button>
          </div>
        </section>

        <section className={`${styles.section} ${styles.specSection}`}>
          <p className={styles.eyebrow}>{mode === 'manage' ? '应用编辑' : '应用规格'}</p>
          <div className={styles.grid}>
            <div className={styles.fieldWide}>
              <label className={styles.label}>应用名称</label>
              <input
                className={styles.input}
                value={title}
                spellCheck={false}
                autoComplete="off"
                onChange={(event) => setTitle(event.target.value)}
                placeholder="桌面里展示的软件名称"
              />
            </div>
            <div className={styles.fieldWide}>
              <label className={styles.label}>应用描述</label>
              <textarea
                className={`${styles.textarea} ${styles.textareaCompact}`}
                value={description}
                spellCheck={false}
                autoComplete="off"
                rows={3}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="说明这个应用是做什么的，方便后续统一管理"
              />
            </div>
            <div className={styles.fieldWide}>
              <label className={styles.label}>图标选择</label>
              <div className={styles.iconPickerWrap}>
                <button
                  type="button"
                  className={styles.iconTrigger}
                  onClick={() => setIconPanelOpen((current) => !current)}
                  aria-expanded={iconPanelOpen}
                >
                  <span className={styles.iconTriggerMain}>
                    <span
                      className={styles.iconPreviewBadge}
                      style={{ '--swatch-color': selectedIconAccent, background: selectedIconAccent } as React.CSSProperties}
                    >
                      <SelectedIconGlyph size={18} />
                    </span>
                    <span>
                      <strong>{selectedIconLabel}</strong>
                      <small>当前应用图标预览</small>
                    </span>
                  </span>
                  <span className={styles.iconTriggerHint}>{iconPanelOpen ? '点击收起图标面板' : '点击展开图标面板'}</span>
                </button>
                {iconPanelOpen ? (
                <div className={styles.iconPanel}>
                  <div className={styles.iconPanelScroll}>
                    <div className={styles.iconGrid}>
                      {DESKTOP_ICON_OPTIONS.map((option) => {
                        const Glyph = ICON_GLYPH_MAP[option] ?? LayoutGrid;
                        const active = icon === option;
                        const accent = ICON_ACCENT_MAP[option] ?? color;
                        return (
                          <button
                            key={option}
                            type="button"
                            className={`${styles.iconOption} ${active ? styles.iconOptionActive : ''}`}
                            onClick={() => {
                              setIcon(option);
                              setIconPanelOpen(true);
                            }}
                          >
                            <span className={styles.iconOptionGlyph} style={{ '--swatch-color': accent } as React.CSSProperties}>
                              <Glyph size={18} />
                            </span>
                            <span className={styles.iconOptionText}>
                              <strong>{getIconLabel(option)}</strong>
                              <small>{option}</small>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                ) : null}
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>颜色选择</label>
              <div className={styles.colorPalette}>
                {COLOR_PRESETS.map((preset) => {
                  const active = color.toLowerCase() === preset.toLowerCase();
                  return (
                    <button
                      key={preset}
                      type="button"
                      className={`${styles.colorSwatch} ${active ? styles.colorSwatchActive : ''}`}
                      style={{ '--swatch-color': preset } as React.CSSProperties}
                      onClick={() => setColor(preset)}
                      aria-label={`选择颜色 ${preset}`}
                    >
                      <span className={styles.colorSwatchInner} />
                    </button>
                  );
                })}
              </div>
              <label className={styles.label}>自定义颜色</label>
              <input
                className={styles.colorInput}
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>窗口宽度</label>
              <input className={styles.input} type="number" value={width} onChange={(event) => setWidth(Number(event.target.value) || 1120)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>窗口高度</label>
              <input className={styles.input} type="number" value={height} onChange={(event) => setHeight(Number(event.target.value) || 780)} />
            </div>
          </div>
        </section>

        {mode === 'frontend' ? (
          <>
            <section className={`${styles.section} ${styles.importSection}`}>
              <p className={styles.eyebrow}>导入源码</p>
              <div className={styles.fileActions}>
                <button className={styles.button} type="button" onClick={() => fileInputRef.current?.click()}>
                  <Download size={15} />
                  导入文件
                </button>
                <button className={styles.button} type="button" onClick={() => folderInputRef.current?.click()}>
                  <FolderUp size={15} />
                  导入文件夹
                </button>
              </div>
              <input
                ref={fileInputRef}
                className={styles.hiddenInput}
                type="file"
                multiple
                onChange={(event) => void handleImport(event.target.files)}
              />
              <input
                ref={folderInputRef}
                className={styles.hiddenInput}
                type="file"
                multiple
                onChange={(event) => void handleImport(event.target.files)}
              />
              <div className={styles.fileList}>
                {importedPreview.map((file) => (
                  <div key={file.path} className={styles.fileRow}>
                    <div className={styles.fileMetaBlock}>
                      <input
                        className={styles.filePathInput}
                        value={file.path}
                        spellCheck={false}
                        autoComplete="off"
                        onChange={(event) => renameImportedFile(file.path, event.target.value)}
                        placeholder="导入后的文件路径 / 文件名"
                      />
                      <span className={styles.fileMeta}>{file.content.length} chars</span>
                    </div>
                    <Package size={14} />
                  </div>
                ))}
                {mergedFiles.length > importedPreview.length ? (
                  <div className={styles.noteRow}>还有 {mergedFiles.length - importedPreview.length} 个文件已进入队列。</div>
                ) : null}
                {mergedFiles.length === 0 ? (
                  <div className={styles.noteRow}>导入文件后会显示在这里，确认无误再接入桌面。</div>
                ) : null}
              </div>
            </section>

            <section className={`${styles.section} ${styles.snippetSection}`}>
              <p className={styles.eyebrow}>快速粘贴</p>
              <div className={styles.grid}>
                <div className={styles.fieldWide}>
                  <label className={styles.label}>HTML</label>
                  <textarea
                    className={styles.textarea}
                    value={htmlSnippet}
                    spellCheck={false}
                    autoComplete="off"
                    onChange={(event) => setHtmlSnippet(event.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>CSS</label>
                  <textarea
                    className={styles.textarea}
                    value={cssSnippet}
                    spellCheck={false}
                    autoComplete="off"
                    onChange={(event) => setCssSnippet(event.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>JS / TS</label>
                  <textarea
                    className={styles.textarea}
                    value={scriptSnippet}
                    spellCheck={false}
                    autoComplete="off"
                    onChange={(event) => setScriptSnippet(event.target.value)}
                  />
                </div>
              </div>
            </section>
          </>
        ) : null}

        {mode === 'native' ? (
          <section className={`${styles.section} ${styles.nativeSection}`}>
            <p className={styles.eyebrow}>本地程序路径</p>
            <p className={styles.hint}>只填 EXE 路径也可以，工作目录留空时会自动推断为 EXE 所在目录。</p>
            <div className={styles.grid}>
              <div className={styles.fieldWide}>
                <label className={styles.label}>EXE 路径</label>
                  <input
                    className={styles.input}
                    value={executablePath}
                    spellCheck={false}
                    autoComplete="off"
                    onChange={(event) => {
                      const nextPath = event.target.value;
                      setExecutablePath(nextPath);
                      if (!workingDirectory.trim()) {
                        setWorkingDirectory(getPathDirname(nextPath));
                      }
                  }}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>工作目录</label>
                <input
                  className={styles.input}
                  value={workingDirectory}
                  spellCheck={false}
                  autoComplete="off"
                  onChange={(event) => setWorkingDirectory(event.target.value)}
                />
              </div>
              <div className={styles.fieldWide}>
                <label className={styles.label}>启动参数</label>
                <input
                  className={styles.input}
                  value={launchArgsText}
                  spellCheck={false}
                  autoComplete="off"
                  onChange={(event) => setLaunchArgsText(event.target.value)}
                />
              </div>
            </div>
          </section>
        ) : null}

        {mode === 'manage' ? (
          <section className={`${styles.section} ${styles.snippetSection}`}>
            <p className={styles.eyebrow}>统一应用管理</p>
            <div className={styles.manageToolbar}>
              <div className={styles.manageToolbarCopy}>
                <strong>已接入应用列表</strong>
                <span>
                  {bulkDeleteMode
                    ? '批量删除模式已开启，请勾选应用后再次点击“批量删除”。'
                    : selectedManagedApp
                      ? `当前编辑：${selectedManagedApp.title}`
                      : '点击任意应用卡片开始编辑'}
                </span>
              </div>
            {bulkDeleteMode ? (
                <div className={styles.manageToolbarActions}>
                  <button
                    className={styles.button}
                    type="button"
                    onClick={() => setSelectedAppIds(managedApps.map((app) => app.id))}
                    disabled={!managedApps.length}
                  >
                    全选
                  </button>
                  <button
                    className={styles.button}
                    type="button"
                    onClick={() => {
                      setBulkDeleteMode(false);
                      setSelectedAppIds([]);
                      setError(null);
                      setMessage('已退出批量删除模式。');
                    }}
                  >
                    取消勾选
                  </button>
                </div>
              ) : null}
            </div>
            <div className={styles.manageStateRow}>
              <span className={styles.manageStatePill}>{manageStatus.title}</span>
              <span className={styles.manageStateMeta}>{manageStatus.detail}</span>
              {!canManageApps ? <span className={styles.manageStateMeta}>{`当前账号角色：${currentUserRole}。${ADMIN_UPLOAD_MESSAGE}`}</span> : null}
            </div>
            <div className={styles.manageList}>
                {managedApps.map((app) => {
                  const ManagedIcon = ICON_GLYPH_MAP[app.icon] ?? LayoutGrid;
                  return (
                  <div key={app.id} className={`${styles.manageRow} ${selectedAppId === app.id ? styles.manageRowActive : ''}`}>
                    {bulkDeleteMode ? (
                      <label className={styles.manageCheckbox}>
                        <input
                          type="checkbox"
                          checked={selectedAppIds.includes(app.id)}
                          onChange={(event) => toggleManagedSelection(app.id, event.target.checked)}
                        />
                        <span className={styles.manageCheckboxBox} aria-hidden="true" />
                        <span className={styles.manageCheckboxText}>勾选</span>
                      </label>
                    ) : null}
                    <button className={styles.manageCard} type="button" onClick={() => setSelectedAppId(app.id)}>
                      <div className={styles.manageCardHeader}>
                        <div className={styles.manageCardIdentity}>
                          <span
                            className={styles.manageCardIcon}
                            style={{ '--swatch-color': app.color, background: app.color } as React.CSSProperties}
                          >
                            <ManagedIcon size={18} />
                          </span>
                          <div className={styles.fileMetaBlock}>
                            <span className={styles.fileName}>{app.title}</span>
                            <span className={styles.fileMeta}>{app.description}</span>
                          </div>
                        </div>
                        <span className={styles.runtimeBadge}>{formatRuntimeLabel(app.runtime)}</span>
                      </div>
                      <div className={styles.manageCardFooter}>
                        <span className={styles.fileMeta}>{app.id}</span>
                        <span className={styles.fileMeta}>
                          {app.runtime === 'native-exe'
                            ? app.native?.executablePath || '本地应用'
                            : app.route || `${app.width} × ${app.height}`}
                        </span>
                      </div>
                    </button>
                  </div>
                  );
                })}
              {managedApps.length === 0 ? (
                <div className={styles.noteRow}>还没有已接入应用。可以先导入一个应用，再回来统一管理。</div>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>

      <aside className={styles.sidebar}>
        <section className={`${styles.section} ${styles.manageActionSection}`}>
          <p className={styles.eyebrow}>{mode === 'manage' ? '管理操作' : '执行操作'}</p>
          {mode === 'manage' ? (
            <div className={styles.manageStateRow}>
              <span className={styles.manageStatePill}>{manageStatus.title}</span>
              <span className={styles.manageStateMeta}>{manageStatus.detail}</span>
            </div>
          ) : null}
          <div className={styles.actionRow}>
            {mode === 'manage' ? (
              <>
                <button className={styles.primaryButton} type="button" onClick={() => void handleSaveManagedApp()} disabled={busy || !selectedManagedApp || !canManageApps}>
                  <SettingsIcon size={15} />
                  保存修改
                </button>
                <button className={styles.ghostButton} type="button" onClick={() => void handleDeleteManagedApp()} disabled={busy || !selectedManagedApp || !canManageApps}>
                  <Trash2 size={15} />
                  删除当前应用
                </button>
                <button
                  className={bulkDeleteMode ? styles.primaryButton : styles.ghostButton}
                  type="button"
                  onClick={() => void handleDeleteSelectedApps()}
                  disabled={busy || (!managedApps.length && !bulkDeleteMode) || !canManageApps}
                >
                  <Trash2 size={15} />
                  {bulkDeleteMode ? `批量删除${selectedAppIds.length ? `（${selectedAppIds.length}）` : ''}` : '批量删除'}
                </button>
                <button className={styles.ghostButton} type="button" onClick={() => void handleDeleteAllApps()} disabled={busy || !managedApps.length || !canManageApps}>
                  <Trash2 size={15} />
                  一键删除全部
                </button>
              </>
            ) : (
              <button className={styles.primaryButton} type="button" onClick={() => void handleInstall()} disabled={busy || !canManageApps}>
                <WandSparkles size={15} />
                {busy ? '处理中...' : '接入凤煌桌面'}
              </button>
            )}
          </div>
        </section>

        <section className={styles.section}>
          <p className={styles.eyebrow}>状态</p>
          {message ? <div className={styles.noteRow}>{message}</div> : null}
          {error ? <div className={styles.noteRow}>{error}</div> : null}
          {!message && !error ? (
            <div className={styles.noteRow}>{manageStatus.detail}</div>
          ) : null}
        </section>

        <section className={styles.section}>
          <p className={styles.eyebrow}>当前管理</p>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <div className={styles.metaRow}>
                <SparklesIcon size={16} />
                <span className={styles.summaryTitle}>已接入应用</span>
              </div>
              <strong>{managedApps.length}</strong>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.metaRow}>
                <Trash2 size={16} />
                <span className={styles.summaryTitle}>勾选删除</span>
              </div>
              <strong>{selectedAppIds.length}</strong>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.metaRow}>
                <Package size={16} />
                <span className={styles.summaryTitle}>当前编辑</span>
              </div>
              <strong>{selectedManagedApp?.title ?? '未选择'}</strong>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.selectionBlock}>
            <div className={styles.selectionHeader}>
              <span className={styles.summaryTitle}>已接入应用列表</span>
              <span className={styles.fileMeta}>支持单个删除、批量勾选删除和一键清空</span>
            </div>
            {managedApps.length > 0 ? (
              <div className={styles.selectionList}>
                {managedApps.map((app) => {
                  const SelectionIcon = ICON_GLYPH_MAP[app.icon] ?? LayoutGrid;
                  return (
                    <button
                      key={app.id}
                      type="button"
                      className={`${styles.selectionItemButton} ${selectedAppId === app.id ? styles.selectionItemButtonActive : ''}`}
                      onClick={() => setSelectedAppId(app.id)}
                    >
                      <span className={styles.selectionItemIdentity}>
                        <span
                          className={styles.selectionItemIcon}
                          style={{ '--swatch-color': app.color, background: app.color } as React.CSSProperties}
                        >
                          <SelectionIcon size={14} />
                        </span>
                        <span className={styles.selectionItemCopy}>
                          <span className={styles.fileName}>{app.title}</span>
                          <span className={styles.fileMeta}>
                            {formatRuntimeLabel(app.runtime)} · {app.id}
                          </span>
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className={styles.noteRow}>当前还没有已接入应用，可以先从源码或本地程序模式新增。</div>
            )}
          </div>
          {selectedManagedApps.length > 0 ? (
            <div className={`${styles.selectionBlock} ${styles.managePreviewBlock}`}>
              <div className={styles.selectionHeader}>
                <span className={styles.summaryTitle}>本次勾选删除</span>
                <span className={styles.fileMeta}>{selectedManagedApps.length} 个应用待处理</span>
              </div>
              <div className={styles.selectionList}>
                {selectedManagedApps.map((app) => {
                  const SelectionIcon = ICON_GLYPH_MAP[app.icon] ?? LayoutGrid;
                  return (
                    <div key={app.id} className={styles.selectionItem}>
                      <span className={styles.selectionItemIdentity}>
                        <span
                          className={styles.selectionItemIcon}
                          style={{ '--swatch-color': app.color, background: app.color } as React.CSSProperties}
                        >
                          <SelectionIcon size={14} />
                        </span>
                        <span className={styles.selectionItemCopy}>
                          <span className={styles.fileName}>{app.title}</span>
                          <span className={styles.fileMeta}>{app.id}</span>
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </section>

        {false ? (
          <section className={styles.section}>
            <p className={styles.eyebrow}>管理明细</p>
            <div className={styles.selectionBlock}>
              <div className={styles.selectionHeader}>
                <span className={styles.summaryTitle}>已接入应用列表</span>
                <span className={styles.fileMeta}>支持单个、批量和一键删除</span>
              </div>
              <div className={styles.selectionList}>
                {managedApps.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    className={`${styles.selectionItemButton} ${selectedAppId === app.id ? styles.selectionItemButtonActive : ''}`}
                    onClick={() => setSelectedAppId(app.id)}
                  >
                    <span className={styles.fileName}>{app.title}</span>
                    <span className={styles.fileMeta}>{app.runtime}</span>
                  </button>
                ))}
              </div>
            </div>
            {selectedManagedApps.length > 0 ? (
              <div className={styles.selectionBlock}>
                <div className={styles.selectionHeader}>
                  <span className={styles.summaryTitle}>已勾选待删除</span>
                  <span className={styles.fileMeta}>{selectedManagedApps.length} 个应用</span>
                </div>
                <div className={styles.selectionList}>
                  {selectedManagedApps.map((app) => (
                    <div key={app.id} className={styles.selectionItem}>
                      <span className={styles.fileName}>{app.title}</span>
                      <span className={styles.fileMeta}>{app.id}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {mode === 'manage' && selectedManagedApp ? (
          <section className={styles.section}>
            <p className={styles.eyebrow}>当前应用</p>
            <div className={styles.detailCard}>
              <div className={styles.detailCardHeader}>
                <div className={styles.detailIdentity}>
                  <span
                    className={styles.detailIconBadge}
                    style={{ '--swatch-color': selectedManagedApp.color, background: selectedManagedApp.color } as React.CSSProperties}
                  >
                    {React.createElement(ICON_GLYPH_MAP[selectedManagedApp.icon] ?? LayoutGrid, { size: 18 })}
                  </span>
                  <div className={styles.fileMetaBlock}>
                    <span className={styles.fileName}>{selectedManagedApp.title}</span>
                    <span className={styles.fileMeta}>{selectedManagedApp.description}</span>
                  </div>
                </div>
                <span className={styles.runtimeBadge}>{formatRuntimeLabel(selectedManagedApp.runtime)}</span>
              </div>
              <div className={styles.detailMetaChips}>
                <span className={styles.detailMetaChip}>图标 · {selectedManagedApp.icon}</span>
                <span className={styles.detailMetaChip}>颜色 · {selectedManagedApp.color}</span>
                <span className={styles.detailMetaChip}>ID · {selectedManagedApp.id}</span>
              </div>

              {selectedManagedApp.runtime === 'native-exe' && selectedManagedApp.native ? (
                <div className={styles.detailStack}>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>主程序路径</span>
                    <code className={styles.codeBlock}>{selectedManagedApp.native.executablePath}</code>
                  </div>
                  {selectedManagedApp.native.workingDirectory ? (
                    <div className={styles.detailItem}>
                      <span className={styles.label}>工作目录</span>
                      <code className={styles.codeBlock}>{selectedManagedApp.native.workingDirectory}</code>
                    </div>
                  ) : null}
                  <div className={styles.detailItem}>
                    <span className={styles.label}>启动参数</span>
                    <code className={styles.codeBlock}>{selectedManagedApp.native.launchArgs?.join(' ') || '无'}</code>
                  </div>
                  <div className={styles.detailActions}>
                    <button className={styles.button} type="button" onClick={() => void copyText(selectedLaunchTarget, '已复制启动路径')}>
                      <Copy size={15} />
                      复制启动路径
                    </button>
                    {selectedLaunchTarget ? (
                      <button className={styles.button} type="button" onClick={() => void handleLaunchManagedApp(selectedManagedApp)} disabled={busy}>
                        <ExternalLink size={15} />
                        尝试打开
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {selectedManagedApp.runtime === 'static-web' && selectedManagedApp.route ? (
                <div className={styles.detailStack}>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>静态入口</span>
                    <code className={styles.codeBlock}>{selectedManagedApp.route}</code>
                  </div>
                  <div className={styles.detailActions}>
                    <button className={styles.button} type="button" onClick={() => void copyText(selectedManagedApp.route, '已复制静态入口')}>
                      <Copy size={15} />
                      复制入口地址
                    </button>
                  </div>
                </div>
              ) : null}

              {selectedManagedApp.runtime === 'generated-web' && selectedManagedApp.bundle ? (
                <div className={styles.detailStack}>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>入口文件</span>
                    <code className={styles.codeBlock}>{selectedManagedApp.bundle.entryFile}</code>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>文件数量</span>
                    <code className={styles.codeBlock}>{selectedManagedApp.bundle.files.length} 个</code>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
      </aside>
    </div>
  );
};

export default FrontendAppConverter;


