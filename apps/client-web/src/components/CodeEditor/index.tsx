import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useAgentActionListener,
  reportAction,
  createAppFileApi,
  generateId,
  type CharacterAppAction,
} from '@/lib';
import './i18n';
import {
  FileCode,
  File,
  Folder,
  FolderOpen,
  Plus,
  X,
  ChevronRight,
  ChevronDown,
  FolderTree,
  MessageSquare,
  ListTodo,
  Terminal,
  Search,
  Eye,
  GitCompare,
  Send,
  Bot,
  User,
  LayoutTemplate,
  Columns,
  Settings,
  Loader2,
  Check,
  AlertCircle,
  Wrench,
  Zap,
} from 'lucide-react';
import {
  APP_ID,
  APP_NAME,
  STATE_FILE,
  DEFAULT_FILES,
  LANGUAGE_EXTENSIONS,
  FILE_EXPLORER_RESOURCES_PATH,
  type FileItem,
  type FileData,
} from './actions/constants';
import {
  DEFAULT_LLM_CONFIG,
  DEFAULT_CONFIGS,
  type LLMConfig,
  type LLMProvider,
  type AgentMessage,
  type ToolCall,
  type ToolResult,
} from './actions/agentConstants';
import { runAgentLoop, testAgentConnection } from './actions/agentLoop';
import { readScopedStorageValue, writeScopedStorageValue } from '@/lib/userScopedStorage';
import styles from './index.module.scss';

import TaskListPanel, { type Task } from './components/TaskListPanel';
import TerminalPanel from './components/TerminalPanel';
import PreviewPanel from './components/PreviewPanel';
import DiffViewer from './components/DiffViewer';
import MarkdownViewer from './components/MarkdownViewer';
import MessageContent from './components/MessageContent';
import Resizer from './components/Resizer';
import { useResizable } from './hooks/useResizable';

// Agent Skills MD 文档内容
const AGENT_SKILLS_DOCS: Record<string, string> = {
  'app-builder-agent': `# App Builder Agent - 需求规格文档

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档版本 | v1.0.0 |
| 创建日期 | 2026-03-20 |
| 最后更新 | 2026-03-20 |
| 文档状态 | 初始版本 |
| 作者 | AI Assistant |
| 目标平台 | OpenRoom 应用开发平台 |

---

## 1. 项目概述

### 1.1 背景

OpenRoom 是一个应用桌面平台，用户可以在其中打开和使用各种应用（聊天、游戏、效率工具等）。App Builder Agent 旨在帮助开发者快速创建符合 OpenRoom 规范的新应用，无需了解底层框架细节，只需描述应用功能即可。

### 1.2 目标

创建一个 **OpenRoom 专用** 的应用构建 Agent，能够：
- 理解用户的 OpenRoom 应用想法和需求
- 自动生成符合 OpenRoom 规范的应用规格文档
- 生成与 OpenRoom 平台无缝集成的完整代码
- 自动注册应用到 appRegistry
- 支持热更新预览

### 1.3 目标平台特性

**OpenRoom 平台规范：**
- 应用运行在 \`apps/webuiapps/src/pages/\` 目录
- 通过 \`appRegistry.ts\` 注册应用
- 使用 React + TypeScript + SCSS
- 遵循组件化架构
- 支持 i18n 多语言（zh/en）
- 集成 VibeContainer 容器框架
- 支持窗口化操作（拖拽、缩放、最小化、最大化）

### 1.4 核心理念

**"描述你的应用 → 自动生成 OpenRoom 应用"** - 专为 OpenRoom 平台打造的应用生成器。`,
};

// 简单的 textarea 编辑器
const SimpleEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  language?: string;
}> = ({ value, onChange }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current && textareaRef.current.value !== value) {
      textareaRef.current.value = value;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      className={styles.simpleEditor}
      defaultValue={value}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
    />
  );
};

const codeFileApi = createAppFileApi(APP_NAME);

// API 配置存储 key
const CONFIG_STORAGE_KEY = 'webuiapps-codeeditor-config';

// 递归查找文件
const findFileById = (items: FileItem[], id: string): FileItem | null => {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children) {
      const found = findFileById(item.children, id);
      if (found) return found;
    }
  }
  return null;
};

// 递归更新文件树
const updateFileTree = (items: FileItem[], id: string, updater: (item: FileItem) => FileItem): FileItem[] => {
  return items.map(item => {
    if (item.id === id) {
      return updater(item);
    }
    if (item.children) {
      return { ...item, children: updateFileTree(item.children, id, updater) };
    }
    return item;
  });
};

// 扁平化获取所有文件
const flattenFiles = (items: FileItem[]): FileItem[] => {
  const result: FileItem[] = [];
  for (const item of items) {
    if (item.type === 'file') {
      result.push(item);
    }
    if (item.children) {
      result.push(...flattenFiles(item.children));
    }
  }
  return result;
};

// AI 消息类型
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  toolCalls?: ToolCall[];
}

// 编辑器视图模式
type EditorViewMode = 'code' | 'split' | 'preview' | 'diff';

const CodeEditor: React.FC = () => {
  const { t } = useTranslation('codeEditor');
  const [isLoading, setIsLoading] = useState(true);
  const [openFiles, setOpenFiles] = useState<FileItem[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState<FileItem[]>(DEFAULT_FILES);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [editorViewMode, setEditorViewMode] = useState<EditorViewMode>('code');
  const [searchQuery, setSearchQuery] = useState('');
  const [originalCode, setOriginalCode] = useState<string>('');

  // Agent 配置状态
  const [agentConfig, setAgentConfig] = useState<LLMConfig>(DEFAULT_LLM_CONFIG);
  const [showAgentSettings, setShowAgentSettings] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [isAgentThinking, setIsAgentThinking] = useState(false);
  const [activeToolCalls, setActiveToolCalls] = useState<ToolCall[]>([]);

  // AI Chat 状态
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '你好！我是你的 AI 代码助手，支持工具调用。我可以帮你读写文件、搜索代码、执行命令等。请问有什么我可以帮助你的？',
      timestamp: Date.now(),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const agentMessagesRef = useRef<AgentMessage[]>([]);

  // Demo tasks
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: '初始化项目', status: 'completed', description: '项目结构搭建完成' },
    { id: '2', title: '编写组件代码', status: 'in_progress', progress: 65, description: 'Button 组件开发中' },
    { id: '3', title: '添加样式', status: 'pending', description: 'CSS 模块待实现' },
    { id: '4', title: '单元测试', status: 'pending', description: 'Jest 测试用例' },
  ]);

  const currentFile = activeFile ? findFileById(fileTree, activeFile) : null;

  // 检查是否是 Agent Skills MD 文档
  const isAgentSkillsDoc = activeFile?.startsWith('agent-skills/');
  const agentSkillsDocKey = isAgentSkillsDoc ? activeFile.replace('agent-skills/', '') : null;
  const agentSkillsContent = agentSkillsDocKey ? AGENT_SKILLS_DOCS[agentSkillsDocKey] : null;

  // Resizable panel widths
  const taskPanelResize = useResizable({
    initialWidth: 180,
    minWidth: 140,
    maxWidth: 260,
  });

  const chatPanelResize = useResizable({
    initialWidth: 420,
    minWidth: 350,
    maxWidth: 550,
  });

  const terminalPanelResize = useResizable({
    initialWidth: 320,
    minWidth: 260,
    maxWidth: 450,
  });

  const filePanelResize = useResizable({
    initialWidth: 220,
    minWidth: 180,
    maxWidth: 350,
  });

  const loadState = useCallback(async () => {
    try {
      const rootFiles = await codeFileApi.listFiles('/');
      const stateExists = rootFiles.some((f) => f.name === 'code_editor_state.json');
      if (stateExists) {
        const stateResult = await codeFileApi.readFile(STATE_FILE);
        if (stateResult.content) {
          const saved = typeof stateResult.content === 'string'
            ? JSON.parse(stateResult.content)
            : stateResult.content;
          if (saved.fileTree && Array.isArray(saved.fileTree)) {
            setFileTree(saved.fileTree);
          }
          if (saved.openFiles && Array.isArray(saved.openFiles)) {
            const validOpenFiles = saved.openFiles
              .map((id: string) => findFileById(saved.fileTree || DEFAULT_FILES, id))
              .filter(Boolean);
            setOpenFiles(validOpenFiles);
            if (saved.activeFile) {
              setActiveFile(saved.activeFile);
            }
          }
        }
      }
    } catch (e) {
      console.warn('[CodeEditor] Failed to load state:', e);
    }
  }, []);

  // 加载 Agent 配置
  const loadAgentConfig = useCallback(async () => {
    try {
      // 首先尝试从 localStorage 读取
      const localData = readScopedStorageValue(CONFIG_STORAGE_KEY);
      if (localData) {
        const saved = JSON.parse(localData);
        setAgentConfig((prev) => ({ ...prev, ...saved }));
        return;
      }

      // 如果 localStorage 没有，尝试从文件读取
      const rootFiles = await codeFileApi.listFiles('/');
      const configExists = rootFiles.some((f) => f.name === 'code_editor_agent_config.json');
      if (configExists) {
        const configResult = await codeFileApi.readFile(CONFIG_FILE);
        if (configResult.content) {
          const saved = typeof configResult.content === 'string'
            ? JSON.parse(configResult.content)
            : configResult.content;
          setAgentConfig((prev) => ({ ...prev, ...saved }));
          // 同步到 localStorage
          writeScopedStorageValue(CONFIG_STORAGE_KEY, JSON.stringify(saved));
        }
      }
    } catch (e) {
      console.warn('[CodeEditor] Failed to load agent config:', e);
    }
  }, []);

  // 保存 Agent 配置
  const saveAgentConfig = useCallback(async (config: LLMConfig) => {
    try {
      // 同时保存到 localStorage 和文件
      writeScopedStorageValue(CONFIG_STORAGE_KEY, JSON.stringify(config));
      await codeFileApi.writeFile(CONFIG_FILE, config);
    } catch (e) {
      console.warn('[CodeEditor] Failed to save agent config:', e);
    }
  }, []);

  const saveState = useCallback(async () => {
    try {
      const state = {
        openFiles: openFiles.map((f) => f.id),
        activeFile,
        fileTree,
      };
      await codeFileApi.writeFile(STATE_FILE, state);
    } catch (e) {
      console.warn('[CodeEditor] Failed to save state:', e);
    }
  }, [openFiles, activeFile, fileTree]);

  useEffect(() => {
    loadState();
    loadAgentConfig();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      saveState();
    }
  }, [openFiles, activeFile, fileTree, isLoading]);

  // 保存 Agent 配置当配置变化时
  useEffect(() => {
    if (!isLoading && agentConfig.apiKey) {
      saveAgentConfig(agentConfig);
    }
  }, [agentConfig, isLoading]);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  // 滚动到聊天底部
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleFileContentChange = useCallback((content: string) => {
    if (!activeFile) return;
    setFileTree((prev) => updateFileTree(prev, activeFile, (item) => ({ ...item, content, isModified: true })));
    setOpenFiles((prev) =>
      prev.map((f) => (f.id === activeFile ? { ...f, content, isModified: true } : f))
    );
  }, [activeFile]);

  const handleToggleFolder = useCallback((folderId: string) => {
    setFileTree((prev) =>
      updateFileTree(prev, folderId, (item) => ({ ...item, isOpen: !item.isOpen }))
    );
  }, []);

  const handleOpenFile = useCallback((file: FileItem) => {
    if (file.type !== 'file') return;
    if (!openFiles.find((f) => f.id === file.id)) {
      setOpenFiles((prev) => [...prev, file]);
    }
    setActiveFile(file.id);
    setEditorViewMode('code');
  }, [openFiles]);

  const handleCloseFile = useCallback((e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    setOpenFiles((prev) => prev.filter((f) => f.id !== fileId));
    if (activeFile === fileId) {
      const remaining = openFiles.filter((f) => f.id !== fileId);
      setActiveFile(remaining.length > 0 ? remaining[0].id : null);
    }
  }, [activeFile, openFiles]);

  const getLanguageFromFileName = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    return LANGUAGE_EXTENSIONS[ext] || 'plaintext';
  };

  // 发送 AI 消息 - 实时流式输出
  const handleSendMessage = useCallback(() => {
    if (!chatInput.trim() || isChatLoading || !agentConfig.apiKey) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: chatInput,
      timestamp: Date.now(),
    };

    // 添加用户消息
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);
    setIsAgentThinking(true);

    // 创建流式消息
    const streamingMsgId = generateId();
    setChatMessages((prev) => [
      ...prev,
      {
        id: streamingMsgId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isStreaming: true,
      },
    ]);

    let fullContent = '';
    let currentToolCall: ToolCall | null = null;

    runAgentLoop(
      chatInput,
      agentMessagesRef.current,
      agentConfig,
      {
        onThinking: () => {
          setIsAgentThinking(true);
        },
        onStart: () => {
          // 流式输出开始
        },
        onToken: (token, fullContentSoFar) => {
          fullContent = fullContentSoFar;
          // 实时更新消息内容
          setChatMessages((prev) =>
            prev.map((m) =>
              m.id === streamingMsgId
                ? { ...m, content: fullContentSoFar }
                : m
            )
          );
        },
        onToolCall: (toolCall) => {
          currentToolCall = toolCall;
          setActiveToolCalls((prev) => [...prev, toolCall]);
          
          // 添加工具调用消息
          const toolMsgId = generateId();
          setChatMessages((prev) => [
            ...prev,
            {
              id: toolMsgId,
              role: 'tool',
              content: `🔧 调用工具: ${toolCall.name}`,
              timestamp: Date.now(),
              toolCalls: [toolCall],
              isStreaming: false,
            },
          ]);

          // 如果是 write 工具，在编辑器中显示文件内容
          if (toolCall.name === 'write' && toolCall.arguments.path) {
            const filePath = toolCall.arguments.path as string;
            const content = toolCall.arguments.content as string;
            
            // 创建或更新文件
            const fileId = `file-${filePath.replace(/\//g, '-')}`;
            const fileName = filePath.split('/').pop() || 'untitled';
            
            // 检查文件是否已存在
            const existingFile = findFileById(fileTree, fileId);
            
            if (!existingFile) {
              // 创建新文件
              const newFile: FileItem = {
                id: fileId,
                name: fileName,
                path: filePath,
                type: 'file',
                content: content,
                language: getLanguageFromFileName(fileName),
                isModified: true,
              };
              
              setFileTree((prev) => {
                // 添加到 src 文件夹或根目录
                const updated = [...prev];
                const srcFolder = updated.find((f) => f.name === 'src' && f.type === 'folder');
                if (srcFolder && srcFolder.children) {
                  srcFolder.children.push(newFile);
                } else {
                  updated.push(newFile);
                }
                return updated;
              });
              
              // 打开文件
              setOpenFiles((prev) => [...prev, newFile]);
              setActiveFile(fileId);
              
              // 设置原始代码用于 DIFF
              setOriginalCode('');
            } else {
              // 更新现有文件
              setFileTree((prev) => updateFileTree(prev, fileId, (item) => ({ 
                ...item, 
                content: content, 
                isModified: true 
              })));
              
              setOpenFiles((prev) =>
                prev.map((f) => (f.id === fileId ? { ...f, content, isModified: true } : f))
              );
              
              // 保存原始代码用于 DIFF
              setOriginalCode(existingFile.content || '');
            }
            
            // 切换到代码视图
            setEditorViewMode('code');
          }
        },
        onToolResult: (result) => {
          if (currentToolCall) {
            setActiveToolCalls((prev) =>
              prev.map((tc) =>
                tc.id === result.toolCallId
                  ? {
                      ...tc,
                      status: result.success ? 'completed' : 'error',
                      result: result.output,
                      error: result.error,
                    }
                  : tc
              )
            );
            
            // 更新工具消息显示结果
            setChatMessages((prev) => {
              const lastToolMsg = [...prev].reverse().find((m) => m.role === 'tool');
              if (lastToolMsg) {
                return prev.map((m) =>
                  m.id === lastToolMsg.id
                    ? {
                        ...m,
                        content: `${m.content}\n${result.success ? '✅' : '❌'} 结果: ${result.success ? result.output : result.error}`,
                      }
                    : m
                );
              }
              return prev;
            });

            // 如果是 write 工具且成功，提供 DIFF 预览选项
            if (currentToolCall.name === 'write' && result.success) {
              const filePath = currentToolCall.arguments.path as string;
              const fileId = `file-${filePath.replace(/\//g, '-')}`;
              
              // 添加 DIFF 预览消息
              setChatMessages((prev) => [
                ...prev,
                {
                  id: generateId(),
                  role: 'assistant',
                  content: `📄 文件已写入: ${filePath}\n\n可以查看 DIFF 预览更改内容。`,
                  timestamp: Date.now(),
                  isStreaming: false,
                },
              ]);
              
              // 如果有原始代码，切换到 DIFF 视图
              if (originalCode) {
                setEditorViewMode('diff');
              }
            }
          }
        },
        onComplete: (finalContent) => {
          setIsAgentThinking(false);
          setIsChatLoading(false);
          setActiveToolCalls([]);
          
          // 更新最终消息内容
          setChatMessages((prev) =>
            prev.map((m) =>
              m.id === streamingMsgId
                ? { ...m, content: finalContent, isStreaming: false }
                : m
            )
          );
          
          // 添加到历史记录
          agentMessagesRef.current.push({
            id: streamingMsgId,
            role: 'assistant',
            content: finalContent,
            timestamp: Date.now(),
          });
        },
        onError: (error) => {
          setChatMessages((prev) =>
            prev.map((m) =>
              m.id === streamingMsgId
                ? { ...m, content: `❌ 错误: ${error}`, isStreaming: false }
                : m
            )
          );
          setIsAgentThinking(false);
          setIsChatLoading(false);
          setActiveToolCalls([]);
        },
      }
    );
  }, [chatInput, isChatLoading, agentConfig, fileTree, openFiles, activeFile, originalCode]);

  // 测试连接
  const handleTestConnection = useCallback(async () => {
    if (!agentConfig.apiKey) {
      setTestStatus('error');
      setTestMessage('API Key 不能为空');
      return;
    }
    setTestStatus('testing');
    setTestMessage('测试中...');
    const result = await testAgentConnection(agentConfig);
    setTestStatus(result.success ? 'success' : 'error');
    setTestMessage(result.message);
  }, [agentConfig]);

  // 处理 Provider 变化
  const handleProviderChange = useCallback((provider: LLMProvider) => {
    const defaults = DEFAULT_CONFIGS[provider];
    setAgentConfig((prev) => ({
      ...prev,
      provider,
      baseUrl: defaults.baseUrl,
      model: defaults.model,
    }));
  }, []);

  // 递归渲染文件树
  const renderFileTree = (items: FileItem[], level: number = 0) => {
    return items.map((item) => {
      const isActive = activeFile === item.id;
      const paddingLeft = 12 + level * 16;

      if (item.type === 'folder') {
        return (
          <React.Fragment key={item.id}>
            <div
              className={styles.folderItem}
              style={{ paddingLeft }}
              onClick={() => handleToggleFolder(item.id)}
            >
              {item.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              {item.isOpen ? <FolderOpen size={14} className={styles.folderIcon} /> : <Folder size={14} className={styles.folderIcon} />}
              <span className={styles.folderName}>{item.name}</span>
            </div>
            {item.isOpen && item.children && (
              <div className={styles.folderChildren}>
                {renderFileTree(item.children, level + 1)}
              </div>
            )}
          </React.Fragment>
        );
      }

      return (
        <div
          key={item.id}
          className={`${styles.fileItem} ${isActive ? styles.active : ''}`}
          style={{ paddingLeft }}
          onClick={() => handleOpenFile(item)}
        >
          <FileCode size={14} className={styles.fileIcon} />
          <span className={styles.fileName}>{item.name}</span>
          {item.isModified && <span className={styles.modified} />}
        </div>
      );
    });
  };

  // 渲染编辑器内容
  const renderEditorContent = () => {
    // 如果是 Agent Skills MD 文档，使用 MarkdownViewer
    if (isAgentSkillsDoc && agentSkillsContent) {
      return (
        <MarkdownViewer
          content={agentSkillsContent}
          fileName={agentSkillsDocKey}
        />
      );
    }

    if (!currentFile || currentFile.type !== 'file') {
      return (
        <div className={styles.emptyState}>
          <FileCode size={64} className={styles.emptyIcon} />
          <span className={styles.emptyText}>欢迎使用 VibeCoding</span>
          <span className={styles.emptyHint}>从右侧文件树选择或创建新文件</span>
        </div>
      );
    }

    const language = getLanguageFromFileName(currentFile.name);

    switch (editorViewMode) {
      case 'split':
        return (
          <div className={styles.splitView}>
            <div className={styles.splitLeft}>
              <SimpleEditor
                value={currentFile.content || ''}
                onChange={handleFileContentChange}
                language={language}
              />
            </div>
            <div className={styles.splitRight}>
              <PreviewPanel
                code={currentFile.content || ''}
                language={language}
              />
            </div>
          </div>
        );
      case 'preview':
        return (
          <PreviewPanel
            code={currentFile.content || ''}
            language={language}
          />
        );
      case 'diff':
        return (
          <DiffViewer
            original={originalCode}
            modified={currentFile.content || ''}
            language={language}
            onApply={() => setEditorViewMode('code')}
          />
        );
      default:
        return (
          <SimpleEditor
            value={currentFile.content || ''}
            onChange={handleFileContentChange}
            language={language}
          />
        );
    }
  };

  // 过滤文件树
  const filteredFileTree = searchQuery
    ? flattenFiles(fileTree).filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : fileTree;

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* IDE Layout: [TaskList] [AIChat] [Editor] [Terminal] [FileTree] */}
      <div className={styles.ideLayout}>
        {/* Task List Panel - Leftmost */}
        <div className={styles.taskPanel} style={{ width: taskPanelResize.width }}>
          <TaskListPanel
            tasks={tasks}
            onTaskClick={(task) => console.log('Task clicked:', task)}
            onTaskStart={(task) => console.log('Task started:', task)}
          />
        </div>
        <Resizer
          onMouseDown={taskPanelResize.handleMouseDown}
          isResizing={taskPanelResize.isResizing}
        />

        {/* AI Chat Panel */}
        <div className={styles.chatPanel} style={{ width: chatPanelResize.width }}>
          <div className={styles.panelHeader}>
            <div className={styles.panelHeaderLeft}>
              <MessageSquare size={16} />
              <span>AI 助手</span>
              {isAgentThinking && (
                <div className={styles.agentStatus}>
                  <Zap size={12} className={styles.zapIcon} />
                  <span>思考中</span>
                </div>
              )}
            </div>
            <button
              className={styles.settingsBtn}
              onClick={() => setShowAgentSettings(true)}
              title="Agent 设置"
            >
              <Settings size={14} />
            </button>
          </div>
          {activeToolCalls.length > 0 && (
            <div className={styles.toolCallsBar}>
              <Wrench size={12} />
              <span>工具调用: {activeToolCalls.length}</span>
              {activeToolCalls.map((tc) => (
                <span
                  key={tc.id}
                  className={`${styles.toolCallTag} ${styles[tc.status]}`}
                >
                  {tc.name}
                </span>
              ))}
            </div>
          )}
          <div className={styles.chatMessages}>
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.chatMessage} ${styles[msg.role]}`}
              >
                <div className={styles.chatAvatar}>
                  {msg.role === 'user' ? (
                    <User size={16} />
                  ) : msg.role === 'tool' ? (
                    <Wrench size={16} />
                  ) : (
                    <Bot size={16} />
                  )}
                </div>
                <div className={styles.chatBody}>
                  <div className={styles.chatHeader}>
                    <span className={styles.chatRole}>
                      {msg.role === 'user' ? '你' : msg.role === 'tool' ? '工具' : 'AI 助手'}
                    </span>
                    <span className={styles.chatTime}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className={styles.chatContent}>
                    <div className={styles.chatText}>
                      <MessageContent content={msg.content} />
                    </div>
                    {msg.isStreaming && <span className={styles.streamingCursor}>▋</span>}
                  </div>
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className={`${styles.chatMessage} ${styles.assistant}`}>
                <div className={styles.chatAvatar}>
                  <Bot size={16} />
                </div>
                <div className={styles.chatBody}>
                  <div className={styles.chatContent}>
                    <div className={styles.chatTyping}>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className={styles.chatInputArea}>
            {!agentConfig.apiKey && (
              <div className={styles.apiKeyWarning}>
                请先配置 API Key
              </div>
            )}
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={agentConfig.apiKey ? "输入消息... (Enter 发送)" : "请先配置 API Key"}
              disabled={isChatLoading || !agentConfig.apiKey}
            />
            <button
              onClick={handleSendMessage}
              disabled={!chatInput.trim() || isChatLoading || !agentConfig.apiKey}
            >
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* Agent Settings Modal */}
        {showAgentSettings && (
          <div className={styles.modalOverlay} onClick={() => setShowAgentSettings(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h3 className={styles.modalTitle}>Agent 设置</h3>

              <div className={styles.formGroup}>
                <label>Provider</label>
                <select
                  value={agentConfig.provider}
                  onChange={(e) => handleProviderChange(e.target.value as LLMProvider)}
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="deepseek">DeepSeek</option>
                  <option value="minimax">MiniMax</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>API Key</label>
                <input
                  type="password"
                  value={agentConfig.apiKey}
                  onChange={(e) => setAgentConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="sk-..."
                />
              </div>

              <div className={styles.formGroup}>
                <label>Base URL</label>
                <input
                  type="text"
                  value={agentConfig.baseUrl}
                  onChange={(e) => setAgentConfig((prev) => ({ ...prev, baseUrl: e.target.value }))}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Model</label>
                <input
                  type="text"
                  value={agentConfig.model}
                  onChange={(e) => setAgentConfig((prev) => ({ ...prev, model: e.target.value }))}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Temperature ({agentConfig.temperature})</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={agentConfig.temperature}
                  onChange={(e) => setAgentConfig((prev) => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Max Tokens</label>
                <input
                  type="number"
                  min="100"
                  max="8000"
                  step="100"
                  value={agentConfig.maxTokens}
                  onChange={(e) => setAgentConfig((prev) => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Custom Headers (JSON)</label>
                <textarea
                  value={agentConfig.customHeaders || ''}
                  onChange={(e) => setAgentConfig((prev) => ({ ...prev, customHeaders: e.target.value }))}
                  placeholder='{"Header": "Value"}'
                  rows={2}
                />
              </div>

              <div className={styles.formGroup}>
                <button
                  className={styles.testBtn}
                  onClick={handleTestConnection}
                  disabled={testStatus === 'testing'}
                >
                  {testStatus === 'testing' ? (
                    <>
                      <Loader2 size={16} className={styles.spin} />
                      测试中...
                    </>
                  ) : (
                    '测试连接'
                  )}
                </button>
                {testStatus !== 'idle' && testMessage && (
                  <div className={`${styles.testResult} ${styles[testStatus]}`}>
                    {testStatus === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                    {testMessage}
                  </div>
                )}
              </div>

              <div className={styles.modalActions}>
                <button className={styles.cancelBtn} onClick={() => setShowAgentSettings(false)}>
                  取消
                </button>
                <button className={styles.saveBtn} onClick={() => setShowAgentSettings(false)}>
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
        <Resizer
          onMouseDown={chatPanelResize.handleMouseDown}
          isResizing={chatPanelResize.isResizing}
        />

        {/* Center Area - Editor + Terminal (垂直排列) */}
        <div className={styles.centerArea}>
          {/* Editor Section (70%) */}
          <div className={styles.editorSection}>
            {/* Tab Bar with View Mode Toggles */}
            <div className={styles.tabBar}>
              <div className={styles.tabsLeft}>
                {openFiles.map((file) => (
                  <div
                    key={file.id}
                    className={`${styles.tab} ${activeFile === file.id ? styles.active : ''}`}
                    onClick={() => setActiveFile(file.id)}
                  >
                    <FileCode size={14} />
                    <span className={styles.tabName}>{file.name}</span>
                    {file.isModified && <span className={styles.modified} />}
                    <button
                      className={styles.closeTab}
                      onClick={(e) => handleCloseFile(e, file.id)}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
              <div className={styles.tabsRight}>
                <button
                  className={`${styles.viewBtn} ${editorViewMode === 'code' ? styles.active : ''}`}
                  onClick={() => setEditorViewMode('code')}
                  title="代码"
                >
                  <LayoutTemplate size={14} />
                </button>
                <button
                  className={`${styles.viewBtn} ${editorViewMode === 'split' ? styles.active : ''}`}
                  onClick={() => setEditorViewMode('split')}
                  title="分屏"
                >
                  <Columns size={14} />
                </button>
                <button
                  className={`${styles.viewBtn} ${editorViewMode === 'preview' ? styles.active : ''}`}
                  onClick={() => setEditorViewMode('preview')}
                  title="预览"
                >
                  <Eye size={14} />
                </button>
                <button
                  className={`${styles.viewBtn} ${editorViewMode === 'diff' ? styles.active : ''}`}
                  onClick={() => {
                    if (currentFile && editorViewMode !== 'diff') {
                      setOriginalCode(currentFile.content || '');
                    }
                    setEditorViewMode('diff');
                  }}
                  title="对比"
                >
                  <GitCompare size={14} />
                </button>
              </div>
            </div>

            {/* Editor Content */}
            <div className={styles.editorContainer}>
              {renderEditorContent()}
            </div>
          </div>

          {/* Terminal Section (30%) */}
          <div className={styles.terminalSection}>
            <div className={styles.terminalHeader}>
              <Terminal size={14} />
              <span>终端</span>
            </div>
            <div className={styles.terminalContent}>
              <TerminalPanel />
            </div>
          </div>
        </div>

        <Resizer
          onMouseDown={filePanelResize.handleMouseDown}
          isResizing={filePanelResize.isResizing}
        />

        {/* File Tree Panel - Rightmost */}
        <div className={styles.filePanel} style={{ width: filePanelResize.width }}>
          <div className={styles.filePanelHeader}>
            <span className={styles.title}>文件</span>
            <div className={styles.actions}>
              <button
                className={styles.actionBtn}
                onClick={() => {}}
                title="新建文件"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
          <div className={styles.searchBox}>
            <Search size={12} />
            <input
              type="text"
              placeholder="搜索文件..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className={styles.fileTree}>
            {searchQuery ? (
              filteredFileTree.map((file) => (
                <div
                  key={file.id}
                  className={`${styles.fileItem} ${activeFile === file.id ? styles.active : ''}`}
                  onClick={() => handleOpenFile(file)}
                >
                  <FileCode size={14} className={styles.fileIcon} />
                  <span className={styles.fileName}>{file.name}</span>
                </div>
              ))
            ) : (
              renderFileTree(fileTree)
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className={styles.statusBar}>
        <div className={styles.statusLeft}>
          <span className={styles.statusItem}>
            <ListTodo size={12} />
            {tasks.filter(t => t.status === 'completed').length}/{tasks.length} 任务
          </span>
          <span className={styles.statusItem}>
            <FolderTree size={12} />
            {flattenFiles(fileTree).length} 文件
          </span>
        </div>
        <div className={styles.statusRight}>
          <span className={styles.statusItem}>
            {currentFile?.type === 'file' ? getLanguageFromFileName(currentFile.name) : 'plaintext'}
          </span>
          <span className={styles.statusItem}>
            行 {cursorPosition.line}, 列 {cursorPosition.column}
          </span>
          <span className={styles.statusItem}>
            {currentFile?.name || '无文件'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
