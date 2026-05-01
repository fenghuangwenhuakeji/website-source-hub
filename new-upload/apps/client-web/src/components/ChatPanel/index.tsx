import React, { useState, useRef, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  Settings,
  Trash2,
  RotateCcw,
  Minus,
  Maximize2,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Image,
  Video,
  Music,
  Plus,
  X,
  Pencil,
  Trash,
  Zap,
  Check,
  Power,
} from 'lucide-react';
import { getWindows } from '@/lib/windowManager';
import {
  chat,
  loadConfig,
  loadConfigSync,
  saveConfig,
  getDefaultConfig,
  type LLMConfig,
  type LLMProvider,
  type ChatMessage,
} from '@/lib/llmClient';
import {
  loadImageGenConfig,
  loadImageGenConfigSync,
  saveImageGenConfig,
  getDefaultImageGenConfig,
  type ImageGenConfig,
  type ImageGenProvider,
} from '@/lib/imageGenClient';
import {
  loadVideoGenConfig,
  loadVideoGenConfigSync,
  saveVideoGenConfig,
  getDefaultVideoGenConfig,
  type VideoGenConfig,
  type VideoGenProvider,
} from '@/lib/videoGenClient';
import {
  loadAudioGenConfig,
  loadAudioGenConfigSync,
  saveAudioGenConfig,
  getDefaultAudioGenConfig,
  type AudioGenConfig,
  type AudioGenProvider,
} from '@/lib/audioGenClient';
import {
  getAppActionToolDefinition,
  resolveAppAction,
  getListAppsToolDefinition,
  executeListApps,
  APP_REGISTRY,
  loadActionsFromMeta,
} from '@/lib/appRegistry';
import { seedMetaFiles } from '@/lib/seedMeta';
import { dispatchAgentAction, onUserAction } from '@/lib/vibeContainerMock';
import { closeAllWindows } from '@/lib/windowManager';
import { getFileToolDefinitions, isFileTool, executeFileTool } from '@/lib/fileTools';
import { setSessionPath } from '@/lib/sessionPath';
import {
  loadApiPool,
  saveApiPool,
  type ApiPoolItem,
  type ApiPoolItemType,
  type AnyApiConfig,
} from '@/lib/configPersistence';
import {
  getMemoryToolDefinitions,
  isMemoryTool,
  executeMemoryTool,
  loadMemories,
  buildMemoryPrompt,
  type MemoryEntry,
} from '@/lib/memoryManager';
import { logger } from '@/lib/logger';
import {
  getImageGenToolDefinitions,
  isImageGenTool,
  executeImageGenTool,
} from '@/lib/imageGenTools';
import {
  loadChatHistory,
  loadChatHistorySync,
  saveChatHistory,
  clearChatHistory,
  buildSessionPath,
  type DisplayMessage,
} from '@/lib/chatHistoryStorage';
import {
  type CharacterConfig,
  type CharacterCollection,
  DEFAULT_COLLECTION as DEFAULT_CHAR_COLLECTION,
  loadCharacterCollection,
  loadCharacterCollectionSync,
  saveCharacterCollection,
  getActiveCharacter,
  getCharacterPromptContext,
  resolveEmotionMedia,
  clearEmotionVideoCache,
} from '@/lib/characterManager';
import {
  ModManager,
  type ModCollection,
  DEFAULT_MOD_COLLECTION,
  loadModCollection,
  loadModCollectionSync,
  saveModCollection,
  getActiveModEntry,
} from '@/lib/modManager';
import CharacterPanel from './CharacterPanel';
import ModPanel from './ModPanel';
import styles from './index.module.scss';

// ---------------------------------------------------------------------------
// Extended DisplayMessage with character-specific fields
// ---------------------------------------------------------------------------

interface CharacterDisplayMessage extends DisplayMessage {
  emotion?: string;
  suggestedReplies?: string[];
  toolCalls?: string[]; // collapsed tool call summaries
}

// ---------------------------------------------------------------------------
// Tool definitions for character system
// ---------------------------------------------------------------------------

function getRespondToUserToolDef() {
  return {
    type: 'function' as const,
    function: {
      name: 'respond_to_user',
      description: '以角色身份向用户发送消息。始终使用此工具回复 — 永远不要输出纯文本。',
      parameters: {
        type: 'object' as const,
        properties: {
          character_expression: {
            type: 'object',
            properties: {
              content: {
                type: 'string',
                description: '消息文本（对话内容，可包含括号中的动作描述）',
              },
              emotion: {
                type: 'string',
                description:
                  '角色情绪: happy（开心）, shy（害羞）, peaceful（平静）, depressing（沮丧）, angry（生气）',
              },
            },
            required: ['content'],
          },
          user_interaction: {
            type: 'object',
            properties: {
              suggested_replies: {
                type: 'array',
                items: { type: 'string' },
                description: '3个建议的用户回复（每个不超过25个字符）',
              },
            },
          },
        },
        required: ['character_expression'],
      },
    },
  };
}

function getFinishTargetToolDef() {
  return {
    type: 'function' as const,
    function: {
      name: 'finish_target',
      description: '当通过对话达成目标时，标记故事目标为已完成。不要向用户宣布此操作。',
      parameters: {
        type: 'object' as const,
        properties: {
          target_ids: {
            type: 'array',
            items: { type: 'number' },
            description: '要标记为已完成的目标ID',
          },
        },
        required: ['target_ids'],
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Build system prompt with Character + Mod context
// ---------------------------------------------------------------------------

function buildSystemPrompt(
  character: CharacterConfig,
  modManager: ModManager | null,
  hasImageGen: boolean,
  memories: MemoryEntry[] = [],
): string {
  let prompt = getCharacterPromptContext(character);

  if (modManager) {
    prompt += '\n' + modManager.buildStageReminder();
  }

  prompt += `
你可以使用工具与用户设备上的应用程序进行交互。

## 普通应用操作流程
当用户想要与普通应用交互时：
1. list_apps — 发现可用应用
2. file_read("apps/{appName}/meta.yaml") — 了解目标应用的可用操作
3. file_read("apps/{appName}/guide.md") — 了解其数据结构和JSON模式
4. file_list/file_read — 探索 "apps/{appName}/data/" 中的现有数据
5. file_write/file_delete — 根据步骤3的JSON模式创建/修改/删除数据
6. app_action — 通知应用重新加载（仅使用 meta.yaml 中定义的操作）

## 棋类游戏特殊规则（非常重要！）
当与五子棋(gomoku)或国际象棋(chess)游戏时：
- **不要**使用 file_write 修改棋盘状态
- **不要**读取 guide.md 或探索 data 目录
- **直接**使用 app_action 工具走棋：
  - 五子棋：PLACE_STONE action，参数 row(0-14) 和 col(0-14)
  - 国际象棋：AGENT_MOVE action，参数 from(如"e7") 和 to(如"e5")
- 当前棋盘状态已通过系统消息提供，无需额外读取

## 通用规则
- 始终操作用户指定的应用。不要将操作重定向到其他应用或系统操作。
- 对于普通应用：数据修改必须通过 file_write/file_delete 进行。app_action 仅通知应用重新加载，它不能写入数据。
- 在 file_write 之后，始终使用相应的 REFRESH 操作调用 app_action。
- guide.md 中的 NAS 路径如 "/articles/xxx.json" 映射到 "apps/{appName}/data/articles/xxx.json"。

当你收到 "[User performed action in ... (appName: xxx)]" 时，appName 已经提供。阅读其 meta.yaml 以了解可用操作，然后相应回复。对于游戏，用你自己的走法回复 — 战略性思考。

重要：你必须使用 respond_to_user 工具向用户发送所有消息。不要输出纯文本回复。包含你的情绪和3个建议回复。${hasImageGen ? '\n\n你可以使用 generate_image 从文本提示创建图像。生成的图像将显示在聊天中。' : ''}`;

  prompt += buildMemoryPrompt(memories);

  return prompt;
}

// ---------------------------------------------------------------------------
// Helper: Get chess game states for AI context
// Only called when gomoku/chess mod is active AND game window is open
// ---------------------------------------------------------------------------

async function getGameStatesForContext(mm: ModManager | null): Promise<string> {
  if (!mm) return '';
  
  const activeModId = mm.getActiveModId();
  const isGomokuMod = activeModId === 'gomoku_master';
  const isChessMod = activeModId === 'chess_master';
  
  if (!isGomokuMod && !isChessMod) return '';
  
  const windows = getWindows();
  const gomokuAppId = 9;
  const chessAppId = 12;

  const gomokuOpen = windows.some(w => w.appId === gomokuAppId);
  const chessOpen = windows.some(w => w.appId === chessAppId);

  if ((isGomokuMod && !gomokuOpen) || (isChessMod && !chessOpen)) return '';

  const gomokuFileApi = {
    readFile: async (path: string) => {
      try {
        const res = await fetch(`/api/files/apps/gomoku${path}`);
        if (res.ok) return await res.text();
      } catch { /* ignore */ }
      return null;
    }
  };

  const chessFileApi = {
    readFile: async (path: string) => {
      try {
        const res = await fetch(`/api/files/apps/chess${path}`);
        if (res.ok) return await res.text();
      } catch { /* ignore */ }
      return null;
    }
  };

  let context = '';

  if (isGomokuMod && gomokuOpen) {
    const state = await gomokuFileApi.readFile('/state.json');
    if (state) {
      try {
        const parsed = JSON.parse(state);
        context += '\n\n========== 五子棋游戏状态 ==========\n';
        context += `当前回合: ${parsed.currentTurn === 'black' ? '黑方(AI)' : '白方(你)'}\n`;
        context += `AI执: ${parsed.agentColor === 'black' ? '黑棋' : '白棋'}\n`;
        
        if (parsed.phase === 'playing') {
          const isAgentTurn = parsed.currentTurn === parsed.agentColor;
          context += `是否AI回合: ${isAgentTurn ? '是 - 你必须立即使用 PLACE_STONE 落子！' : '否 - 等待用户走棋'}\n`;
          context += `已下步数: ${parsed.moves?.length || 0}\n`;
          
          // 显示棋盘（简化版）
          if (parsed.board) {
            context += '\n棋盘状态 (B=黑, W=白, .=空):\n';
            for (let r = 0; r < 15; r++) {
              let rowStr = '';
              for (let c = 0; c < 15; c++) {
                const cell = parsed.board[r]?.[c];
                if (cell === 'black') rowStr += 'B ';
                else if (cell === 'white') rowStr += 'W ';
                else rowStr += '. ';
              }
              context += `${String(r).padStart(2, '0')} ${rowStr}\n`;
            }
            context += '   00 01 02 03 04 05 06 07 08 09 10 11 12 13 14\n';
          }
          
          if (isAgentTurn) {
            context += '\n⚠️ 轮到你了！使用 PLACE_STONE action 落子，例如:\n';
            context += 'app_action({"action":"PLACE_STONE","params":{"row":"7","col":"7"}})\n';
          }
        } else if (parsed.phase === 'waiting') {
          context += '状态: 等待开始 - 请使用 NEW_GAME action 开始游戏\n';
        } else {
          context += `状态: ${parsed.phase}\n`;
        }
        context += '===================================\n';
      } catch { /* ignore */ }
    }
  }

  if (isChessMod && chessOpen) {
    const state = await chessFileApi.readFile('/state.json');
    if (state) {
      try {
        const parsed = JSON.parse(state);
        context += '\n\n========== 国际象棋游戏状态 ==========\n';
        context += `当前回合: ${parsed.currentTurn === 'w' ? '白方(你)' : '黑方(AI)'}\n`;
        
        if (parsed.gameStatus === 'playing' || !parsed.gameStatus) {
          const isAgentTurn = parsed.currentTurn === 'b'; // AI 执黑
          context += `AI执: 黑棋\n`;
          context += `是否AI回合: ${isAgentTurn ? '是 - 你必须立即使用 AGENT_MOVE 走棋！' : '否 - 等待用户走棋'}\n`;
          
          // 显示棋盘
          if (parsed.board) {
            context += '\n棋盘状态:\n';
            const files = '  a b c d e f g h';
            context += `   ${files}\n`;
            for (let r = 7; r >= 0; r--) {
              let rowStr = `${r + 1}  `;
              for (let c = 0; c < 8; c++) {
                const piece = parsed.board[r]?.[c];
                if (piece) {
                  const color = piece.color === 'w' ? piece.type.toUpperCase() : piece.type.toLowerCase();
                  rowStr += color + ' ';
                } else {
                  rowStr += '. ';
                }
              }
              rowStr += ` ${r + 1}`;
              context += rowStr + '\n';
            }
            context += `   ${files}\n`;
          }
          
          if (isAgentTurn) {
            context += '\n⚠️ 轮到你了！使用 AGENT_MOVE action 走棋，例如:\n';
            context += 'app_action({"action":"AGENT_MOVE","params":{"from":"e7","to":"e5"}})\n';
          }
        } else {
          context += `状态: ${parsed.gameStatus}\n`;
        }
        context += '=====================================\n';
      } catch { /* ignore */ }
    }
  }

  return context;
}

// ---------------------------------------------------------------------------
// Helper: parse action text in parentheses as emotion markers
// ---------------------------------------------------------------------------

function renderMessageContent(content: string): React.ReactNode {
  // Match (action text) patterns and render them as styled spans
  const parts = content.split(/(\([^)]+\))/g);
  return parts.map((part, i) => {
    if (/^\([^)]+\)$/.test(part)) {
      return (
        <span key={i} className={styles.emotion}>
          {part}
        </span>
      );
    }
    return part;
  });
}

// ---------------------------------------------------------------------------
// Stage Indicator Component
// ---------------------------------------------------------------------------

const StageIndicator: React.FC<{ modManager: ModManager | null }> = ({ modManager }) => {
  if (!modManager) return null;

  const total = modManager.stageCount;
  const current = modManager.currentStageIndex;
  const finished = modManager.isFinished;

  return (
    <div className={styles.stageIndicator}>
      <span className={styles.stageText}>
        阶段 {finished ? total : current + 1}/{total}
      </span>
      <div className={styles.stageDots}>
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`${styles.stageDot} ${
              i < current || finished
                ? styles.stageDotCompleted
                : i === current
                  ? styles.stageDotCurrent
                  : ''
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Actions Taken (collapsible)
// ---------------------------------------------------------------------------

const ActionsTaken: React.FC<{ calls: string[] }> = ({ calls }) => {
  const [open, setOpen] = useState(false);
  if (calls.length === 0) return null;

  return (
    <div className={styles.actionsTaken}>
      <button className={styles.actionsTakenToggle} onClick={() => setOpen(!open)}>
        已执行的操作
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
      {open && (
        <div className={styles.actionsTakenList}>
          {calls.map((c, i) => (
            <div key={i}>{c}</div>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// ChatPanel
// ---------------------------------------------------------------------------

const ChatPanel: React.FC<{ onClose: () => void; visible?: boolean }> = ({
  onClose,
  visible = true,
}) => {
  const { t } = useTranslation();
  // Character + Mod state (collection-based)
  const [charCollection, setCharCollection] = useState<CharacterCollection>(
    () => loadCharacterCollectionSync() ?? DEFAULT_CHAR_COLLECTION,
  );
  const character = getActiveCharacter(charCollection);

  const [modCollection, setModCollection] = useState<ModCollection>(
    () => loadModCollectionSync() ?? DEFAULT_MOD_COLLECTION,
  );
  const [modManager, setModManager] = useState<ModManager | null>(() => {
    const col = loadModCollectionSync() ?? DEFAULT_MOD_COLLECTION;
    const entry = getActiveModEntry(col);
    return new ModManager(entry.config, entry.state);
  });

  // Session key for chat history isolation (character × mod)
  const sessionPath = buildSessionPath(charCollection.activeId, modCollection.activeId);
  setSessionPath(sessionPath);

  // Chat state — initialized from session-scoped cache
  const [messages, setMessages] = useState<CharacterDisplayMessage[]>(() => {
    const cache = loadChatHistorySync(sessionPath);
    return (cache?.messages ?? []) as CharacterDisplayMessage[];
  });
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() => {
    const cache = loadChatHistorySync(sessionPath);
    return cache?.chatHistory ?? [];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState<LLMConfig | null>(loadConfigSync);
  const [imageGenConfig, setImageGenConfig] = useState<ImageGenConfig | null>(
    loadImageGenConfigSync,
  );
  const [videoGenConfig, setVideoGenConfig] = useState<VideoGenConfig | null>(
    loadVideoGenConfigSync,
  );
  const [audioGenConfig, setAudioGenConfig] = useState<AudioGenConfig | null>(
    loadAudioGenConfigSync,
  );
  const [apiPool, setApiPool] = useState<ApiPoolItem[]>(() => loadApiPool());

  // Suggested replies from latest assistant message
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const [showCharacterPanel, setShowCharacterPanel] = useState(false);
  const [showModPanel, setShowModPanel] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<string | undefined>();

  // Memories loaded for SP injection
  const [memories, setMemories] = useState<MemoryEntry[]>([]);

  // Page visibility and window focus state for lazy observation
  const [isPageVisible, setIsPageVisible] = useState(!document.hidden);
  const [isWindowFocused, setIsWindowFocused] = useState(document.hasFocus());

  // Pending tool calls for current response (grouped per assistant turn)
  const pendingToolCallsRef = useRef<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const chatHistoryRef = useRef(chatHistory);
  chatHistoryRef.current = chatHistory;
  const suggestedRepliesRef = useRef(suggestedReplies);
  suggestedRepliesRef.current = suggestedReplies;

  // Debounced save
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sessionPathRef = useRef(sessionPath);
  sessionPathRef.current = sessionPath;

  // Page visibility and window focus listeners for lazy observation mode
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };
    const handleFocusChange = () => {
      setIsWindowFocused(document.hasFocus());
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocusChange);
    window.addEventListener('blur', handleFocusChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocusChange);
      window.removeEventListener('blur', handleFocusChange);
    };
  }, []);

  useEffect(() => {
    if (messages.length === 0 && chatHistory.length === 0) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveChatHistory(
        sessionPathRef.current,
        messagesRef.current,
        chatHistoryRef.current,
        suggestedRepliesRef.current,
      );
    }, 500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [messages, chatHistory, suggestedReplies]);

  /** Seed prologue and opening replies from active mod */
  const seedPrologue = useCallback(() => {
    const entry = getActiveModEntry(modCollection);
    const prologue = entry.config.prologue;
    if (prologue) {
      const prologueMsg: CharacterDisplayMessage = {
        id: 'prologue',
        role: 'assistant',
        content: prologue,
      };
      setMessages([prologueMsg]);
      setChatHistory([{ role: 'assistant', content: prologue }]);
    } else {
      setMessages([]);
      setChatHistory([]);
    }
    const openingReplies = entry.config.opening_rec_replies;
    setSuggestedReplies(openingReplies?.length ? openingReplies.map((r) => r.reply_text) : []);
    setCurrentEmotion(undefined);
  }, [modCollection]);

  // Reload chat history when session (character × mod) changes
  useEffect(() => {
    loadChatHistory(sessionPath).then((data) => {
      const loadedMessages = (data?.messages ?? []) as CharacterDisplayMessage[];
      const loadedHistory = data?.chatHistory ?? [];
      if (loadedMessages.length === 0 && loadedHistory.length === 0) {
        // No history — seed prologue
        seedPrologue();
      } else {
        setMessages(loadedMessages);
        setChatHistory(loadedHistory);
        // Restore suggested replies from saved data, or from mod config if only prologue
        if (data?.suggestedReplies?.length) {
          setSuggestedReplies(data.suggestedReplies);
        } else {
          const onlyPrologue = loadedMessages.length === 1 && loadedMessages[0].id === 'prologue';
          if (onlyPrologue) {
            const entry = getActiveModEntry(modCollection);
            const openingReplies = entry.config.opening_rec_replies;
            setSuggestedReplies(
              openingReplies?.length ? openingReplies.map((r) => r.reply_text) : [],
            );
          } else {
            setSuggestedReplies([]);
          }
        }
        setCurrentEmotion(undefined);
      }
    });
    // Load memories for SP injection
    loadMemories(sessionPath).then(setMemories);
  }, [sessionPath, modCollection, seedPrologue]);

  // Load configs from file (async override).
  // Empty deps [] is intentional: configs (character collection, mod collection,
  // chat config, image-gen config) are loaded inside the effect and written to
  // state — they are not external dependencies that should trigger re-runs.
  useEffect(() => {
    loadConfig().then((fileConfig) => {
      if (fileConfig) setConfig(fileConfig);
    });
    loadImageGenConfig().then((fileConfig) => {
      if (fileConfig) setImageGenConfig(fileConfig);
    });
    loadVideoGenConfig().then((fileConfig) => {
      if (fileConfig) setVideoGenConfig(fileConfig);
    });
    loadAudioGenConfig().then((fileConfig) => {
      if (fileConfig) setAudioGenConfig(fileConfig);
    });
    loadCharacterCollection().then((col) => {
      if (col) setCharCollection(col);
    });
    loadModCollection().then((col) => {
      if (col) {
        setModCollection(col);
        const entry = getActiveModEntry(col);
        setModManager(new ModManager(entry.config, entry.state));
      }
    });
  }, []);

  const handleClearHistory = useCallback(async () => {
    await clearChatHistory(sessionPathRef.current);
    seedPrologue();
  }, [seedPrologue]);

  /** Reset entire session — clears chat, memories, app data, and mod state */
  const handleResetSession = useCallback(async () => {
    const sp = sessionPathRef.current;
    // Clear server-side session directory
    try {
      await fetch(`/api/session-reset?path=${encodeURIComponent(sp)}`, { method: 'DELETE' });
    } catch {
      // ignore
    }
    // Clear local state
    localStorage.removeItem(`openroom_chat_${sp.replace(/\//g, '_')}`);
    setMessages([]);
    setChatHistory([]);
    setSuggestedReplies([]);
    setMemories([]);
    setCurrentEmotion(undefined);

    // Close all open app windows
    closeAllWindows();

    // Reset mod state
    if (modManagerRef.current) {
      modManagerRef.current.reset();
      const mm = modManagerRef.current;
      setModManager(new ModManager(mm.getConfig(), mm.getState()));
      setModCollection((prev) => {
        const entry = getActiveModEntry(prev);
        const updated = {
          ...prev,
          items: {
            ...prev.items,
            [entry.config.id]: { config: entry.config, state: mm.getState() },
          },
        };
        saveModCollection(updated);
        return updated;
      });
    }

    // Re-seed prologue and opening replies
    seedPrologue();

    // Re-seed meta files
    await seedMetaFiles();
  }, [modCollection, seedPrologue]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const addMessage = useCallback((msg: CharacterDisplayMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const configRef = useRef(config);
  configRef.current = config;
  const apiPoolRef = useRef(apiPool);
  apiPoolRef.current = apiPool;
  const imageGenConfigRef = useRef(imageGenConfig);
  imageGenConfigRef.current = imageGenConfig;
  const modManagerRef = useRef(modManager);
  modManagerRef.current = modManager;
  const characterRef = useRef(character);
  characterRef.current = character;
  const memoriesRef = useRef(memories);
  memoriesRef.current = memories;

  // User action queue
  const actionQueueRef = useRef<string[]>([]);
  const processingRef = useRef(false);
  const isPageVisibleRef = useRef(isPageVisible);
  const isWindowFocusedRef = useRef(isWindowFocused);
  const visibleRef = useRef(visible);

  isPageVisibleRef.current = isPageVisible;
  isWindowFocusedRef.current = isWindowFocused;
  visibleRef.current = visible;

  const processActionQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;

    while (actionQueueRef.current.length > 0) {
      const actionMsg = actionQueueRef.current.shift()!;
      const activePoolItem = apiPoolRef.current.find(p => p.isActive && p.type === 'text');
      const cfg = activePoolItem ? activePoolItem.config as LLMConfig : configRef.current;
      if (!cfg?.apiKey) break;

      const newHistory: ChatMessage[] = [
        ...chatHistoryRef.current,
        { role: 'user', content: actionMsg },
      ];
      setChatHistory(newHistory);
      setLoading(true);
      try {
        await runConversation(newHistory, cfg);
      } catch (err) {
        logger.error('ChatPanel', 'User action error:', err);
      } finally {
        setLoading(false);
      }
    }
    processingRef.current = false;
  }, []);

  // Listen for user actions from apps
  useEffect(() => {
    const unsubscribe = onUserAction((event: unknown) => {
      // Lazy observation mode: only process actions when:
      // 1. Chat panel is visible
      // 2. Page is visible (not hidden/background)
      // 3. Window is focused
      if (!visibleRef.current || !isPageVisibleRef.current || !isWindowFocusedRef.current) {
        return;
      }

      const cfg = configRef.current;
      if (!cfg?.apiKey) return;

      const evt = event as {
        app_action?: {
          app_id: number;
          action_type: string;
          params?: Record<string, string>;
          trigger_by?: number;
        };
        action_result?: string;
      };
      logger.info('ChatPanel', 'onUserAction received:', evt);
      if (evt.action_result !== undefined) return;
      const action = evt.app_action;
      if (!action) return;
      if (action.trigger_by === 2) return;

      const app = APP_REGISTRY.find((a) => a.appId === action.app_id);
      if (!app) return;

      const actionMsg = `[用户在 ${app.displayName} 中执行了操作 (appName: ${app.appName})] 操作类型: ${action.action_type}, 参数: ${JSON.stringify(action.params || {})}`;
      actionQueueRef.current.push(actionMsg);
      processActionQueue();
    });
    return unsubscribe;
  }, [processActionQueue]);

  // Send message
  const handleSend = useCallback(
    async (overrideText?: string) => {
      const text = overrideText ?? input.trim();
      if (!text || loading) return;

      const activePoolItem = apiPool.find(p => p.isActive && p.type === 'text');
      const cfg = activePoolItem ? activePoolItem.config as LLMConfig : config;
      if (!cfg?.apiKey) {
        setShowSettings(true);
        return;
      }

      const userDisplay: CharacterDisplayMessage = {
        id: String(Date.now()),
        role: 'user',
        content: text,
      };

      const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: text }];

      flushSync(() => {
        if (!overrideText) {
          setInput('');
        }
        setSuggestedReplies([]);
        addMessage(userDisplay);
        setChatHistory(newHistory);
      });

      if (!overrideText && inputRef.current) {
        inputRef.current.value = '';
      }

      setLoading(true);
      try {
        await runConversation(newHistory, cfg);
      } catch (err) {
        logger.error('ChatPanel', 'Error:', err);
        addMessage({
          id: String(Date.now()),
          role: 'assistant',
          content: `Error: ${err instanceof Error ? err.message : String(err)}`,
        });
      } finally {
        setLoading(false);
      }
    },
    [input, loading, config, apiPool, chatHistory, addMessage],
  );

  // Core conversation loop
  const runConversation = async (history: ChatMessage[], cfg: LLMConfig) => {
    await seedMetaFiles();
    await loadActionsFromMeta();
    const hasImageGen = !!imageGenConfigRef.current?.apiKey;
    const mm = modManagerRef.current;
    const char = characterRef.current;

    const tools = [
      getRespondToUserToolDef(),
      getFinishTargetToolDef(),
      getListAppsToolDefinition(),
      getAppActionToolDefinition(),
      ...getFileToolDefinitions(),
      ...getMemoryToolDefinitions(),
      ...(hasImageGen ? getImageGenToolDefinitions() : []),
    ];

    const currentMemories = memoriesRef.current;
    const gameContext = await getGameStatesForContext(mm);
    const systemPrompt = buildSystemPrompt(char, mm, hasImageGen, currentMemories) + gameContext;

    const fullMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history,
    ];

    let currentMessages = fullMessages;
    let iterations = 0;
    const maxIterations = 10;
    pendingToolCallsRef.current = [];

    while (iterations < maxIterations) {
      iterations++;
      const response = await chat(currentMessages, tools, cfg);

      if (response.toolCalls.length === 0) {
        // No tool calls — fallback plain text (shouldn't happen with respond_to_user requirement)
        if (response.content) {
          addMessage({
            id: String(Date.now()),
            role: 'assistant',
            content: response.content,
            toolCalls:
              pendingToolCallsRef.current.length > 0 ? [...pendingToolCallsRef.current] : undefined,
          });
          setChatHistory((prev) => [...prev, { role: 'assistant', content: response.content }]);
          pendingToolCallsRef.current = [];
        }
        break;
      }

      // Has tool calls
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: response.content,
        tool_calls: response.toolCalls,
      };
      currentMessages = [...currentMessages, assistantMsg];

      // Execute each tool call
      for (const tc of response.toolCalls) {
        let params: Record<string, unknown> = {};
        try {
          params = JSON.parse(tc.function.arguments);
        } catch {
          // ignore
        }

        // ---- respond_to_user ----
        if (tc.function.name === 'respond_to_user') {
          const expr =
            (params.character_expression as { content?: string; emotion?: string }) ?? {};
          const interaction = (params.user_interaction as { suggested_replies?: string[] }) ?? {};

          const content = expr.content ?? '';
          const emotion = expr.emotion;
          const replies = interaction.suggested_replies ?? [];

          addMessage({
            id: String(Date.now()),
            role: 'assistant',
            content,
            emotion,
            suggestedReplies: replies,
            toolCalls:
              pendingToolCallsRef.current.length > 0 ? [...pendingToolCallsRef.current] : undefined,
          });
          setSuggestedReplies(replies);
          if (emotion) {
            clearEmotionVideoCache(character.id);
            setCurrentEmotion(emotion);
          }
          pendingToolCallsRef.current = [];

          setChatHistory((prev) => [...prev, { role: 'assistant', content }]);
          currentMessages = [
            ...currentMessages,
            { role: 'tool', content: 'Message delivered.', tool_call_id: tc.id },
          ];
          continue;
        }

        // ---- finish_target ----
        if (tc.function.name === 'finish_target') {
          const targetIds = (params.target_ids as number[]) ?? [];
          if (mm) {
            const result = mm.finishTarget(targetIds);
            // Persist state via collection
            const updatedEntry = { config: mm.getConfig(), state: mm.getState() };
            setModCollection((prev) => {
              const updated = {
                ...prev,
                items: { ...prev.items, [updatedEntry.config.id]: updatedEntry },
              };
              saveModCollection(updated);
              return updated;
            });
            setModManager(new ModManager(mm.getConfig(), mm.getState()));

            currentMessages = [
              ...currentMessages,
              { role: 'tool', content: JSON.stringify(result), tool_call_id: tc.id },
            ];
          } else {
            currentMessages = [
              ...currentMessages,
              { role: 'tool', content: 'No mod loaded.', tool_call_id: tc.id },
            ];
          }
          continue;
        }

        // ---- list_apps ----
        if (tc.function.name === 'list_apps') {
          const result = executeListApps();
          pendingToolCallsRef.current.push(`list_apps`);
          currentMessages = [
            ...currentMessages,
            { role: 'tool', content: result, tool_call_id: tc.id },
          ];
          continue;
        }

        // ---- File tools ----
        if (isFileTool(tc.function.name)) {
          pendingToolCallsRef.current.push(
            `${tc.function.name}(${JSON.stringify(params).slice(0, 60)})`,
          );
          try {
            const result = await executeFileTool(
              tc.function.name,
              params as Record<string, string>,
            );
            currentMessages = [
              ...currentMessages,
              { role: 'tool', content: result, tool_call_id: tc.id },
            ];
          } catch (err) {
            currentMessages = [
              ...currentMessages,
              {
                role: 'tool',
                content: `error: ${err instanceof Error ? err.message : String(err)}`,
                tool_call_id: tc.id,
              },
            ];
          }
          continue;
        }

        // ---- Image gen ----
        if (isImageGenTool(tc.function.name)) {
          pendingToolCallsRef.current.push('generate_image');
          try {
            const { result, dataUrl } = await executeImageGenTool(
              params as Record<string, string>,
              imageGenConfigRef.current,
            );
            if (dataUrl) {
              addMessage({
                id: String(Date.now()) + '-img',
                role: 'assistant',
                content: '',
                imageUrl: dataUrl,
              });
            }
            currentMessages = [
              ...currentMessages,
              { role: 'tool', content: result, tool_call_id: tc.id },
            ];
          } catch (err) {
            currentMessages = [
              ...currentMessages,
              {
                role: 'tool',
                content: `error: ${err instanceof Error ? err.message : String(err)}`,
                tool_call_id: tc.id,
              },
            ];
          }
          continue;
        }

        // ---- Memory tools ----
        if (isMemoryTool(tc.function.name)) {
          pendingToolCallsRef.current.push(`save_memory`);
          try {
            const result = await executeMemoryTool(
              sessionPathRef.current,
              params as Record<string, string>,
            );
            // Refresh memories for next turn's SP
            loadMemories(sessionPathRef.current).then(setMemories);
            currentMessages = [
              ...currentMessages,
              { role: 'tool', content: result, tool_call_id: tc.id },
            ];
          } catch (err) {
            currentMessages = [
              ...currentMessages,
              {
                role: 'tool',
                content: `error: ${err instanceof Error ? err.message : String(err)}`,
                tool_call_id: tc.id,
              },
            ];
          }
          continue;
        }

        // ---- app_action ----
        if (tc.function.name === 'app_action') {
          const strParams = params as Record<string, string>;
          const resolved = resolveAppAction(strParams.app_name, strParams.action_type);
          if (typeof resolved === 'string') {
            currentMessages = [
              ...currentMessages,
              { role: 'tool', content: resolved, tool_call_id: tc.id },
            ];
            continue;
          }

          pendingToolCallsRef.current.push(`${strParams.app_name}/${strParams.action_type}`);

          let actionParams: Record<string, string> = {};
          if (strParams.params) {
            try {
              actionParams = JSON.parse(strParams.params);
            } catch {
              // empty
            }
          }

          try {
            const result = await dispatchAgentAction({
              app_id: resolved.appId,
              action_type: resolved.actionType,
              params: actionParams,
            });
            currentMessages = [
              ...currentMessages,
              { role: 'tool', content: result, tool_call_id: tc.id },
            ];
          } catch (err) {
            currentMessages = [
              ...currentMessages,
              {
                role: 'tool',
                content: `error: ${err instanceof Error ? err.message : String(err)}`,
                tool_call_id: tc.id,
              },
            ];
          }
          continue;
        }

        // Unknown tool
        currentMessages = [
          ...currentMessages,
          { role: 'tool', content: 'error: unknown tool', tool_call_id: tc.id },
        ];
      }

      // Update chat history
      setChatHistory(currentMessages.slice(1));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!visible) return null;

  return (
    <>
      <div className={styles.panel} data-testid="chat-panel">
        {/* Left: Character Avatar */}
        <div className={styles.avatarSide}>
          {(() => {
            // Resolve media for the active emotion, or fall back to "peaceful" as idle
            const idleEmotion = 'default';
            const activeEmotion = currentEmotion || idleEmotion;
            const isIdle = !currentEmotion;
            const media = resolveEmotionMedia(character, activeEmotion);

            if (!media) {
              return (
                <div className={styles.avatarPlaceholder}>{character.character_name.charAt(0)}</div>
              );
            }

            return media.type === 'video' ? (
              <video
                key={media.url}
                className={styles.avatarImage}
                src={media.url}
                autoPlay
                loop={isIdle}
                muted
                playsInline
                onEnded={isIdle ? undefined : () => setCurrentEmotion(undefined)}
              />
            ) : (
              <img className={styles.avatarImage} src={media.url} alt={character.character_name} />
            );
          })()}
        </div>

        {/* Right: Chat */}
        <div className={styles.chatSide}>
          <div className={styles.header}>
            <div
              className={styles.headerLeft}
              onClick={() => setShowCharacterPanel(true)}
              style={{ cursor: 'pointer' }}
            >
              <span className={styles.characterName}>{character.character_name}</span>
              <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
            </div>
            <div className={styles.headerActions}>
              <div onClick={() => setShowModPanel(true)} style={{ cursor: 'pointer' }}>
                <StageIndicator modManager={modManager} />
              </div>
              <button
                className={styles.iconBtn}
                onClick={handleResetSession}
                title={t('chat.resetSession')}
                data-testid="reset-session"
              >
                <RotateCcw size={16} />
              </button>
              <button
                className={styles.iconBtn}
                onClick={handleClearHistory}
                title={t('chat.clearChat')}
                data-testid="clear-chat"
              >
                <Trash2 size={16} />
              </button>
              <button
                className={styles.iconBtn}
                onClick={() => setShowSettings(true)}
                title={t('chat.settings')}
                data-testid="settings-btn"
              >
                <Settings size={16} />
              </button>
              <button className={styles.iconBtn} onClick={onClose} title={t('chat.minimize')}>
                <Minus size={16} />
              </button>
              <button className={styles.iconBtn} title={t('chat.maximize')}>
                <Maximize2 size={16} />
              </button>
            </div>
          </div>

          <div className={styles.messages} data-testid="chat-messages">
            {messages.length === 0 && (
              <div className={styles.emptyState}>
                {config?.apiKey
                  ? t('chat.isReadyToChat', { name: character.character_name })
                  : t('chat.clickGearToConfig')}
              </div>
            )}
            {messages.map((msg) => (
              <React.Fragment key={msg.id}>
                <div
                  className={`${styles.message} ${
                    msg.role === 'user'
                      ? styles.user
                      : msg.role === 'tool'
                        ? styles.toolInfo
                        : styles.assistant
                  }`}
                >
                  {msg.role === 'assistant' ? renderMessageContent(msg.content) : msg.content}
                  {msg.imageUrl && (
                    <img src={msg.imageUrl} alt="Generated" className={styles.messageImage} />
                  )}
                </div>
                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <ActionsTaken calls={msg.toolCalls} />
                )}
              </React.Fragment>
            ))}
            {loading && <div className={styles.loading}>{t('chat.thinking')}</div>}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Replies */}
          {suggestedReplies.length > 0 && !loading && (
            <div className={styles.suggestedReplies}>
              {suggestedReplies.map((reply, i) => (
                <button key={i} className={styles.suggestedReply} onClick={() => handleSend(reply)}>
                  {reply}
                </button>
              ))}
            </div>
          )}

          <div className={styles.inputArea}>
            <textarea
              ref={inputRef}
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('chat.typeMessage')}
              rows={1}
              disabled={loading}
              data-testid="chat-input"
            />
            <button
              className={styles.sendBtn}
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              data-testid="send-btn"
            >
              {t('chat.send')}
            </button>
          </div>
        </div>
      </div>

      {showSettings && (
        <SettingsModal
          config={config}
          imageGenConfig={imageGenConfig}
          videoGenConfig={videoGenConfig}
          audioGenConfig={audioGenConfig}
          apiPool={apiPool}
          onApiPoolChange={setApiPool}
          onConfigChange={(nextConfig) => {
            setConfig(nextConfig);
            void saveConfig(nextConfig, imageGenConfig);
          }}
          onImageGenConfigChange={(nextConfig) => {
            setImageGenConfig(nextConfig);
            void saveImageGenConfig(nextConfig);
          }}
          onVideoGenConfigChange={(nextConfig) => {
            setVideoGenConfig(nextConfig);
            void saveVideoGenConfig(nextConfig);
          }}
          onAudioGenConfigChange={(nextConfig) => {
            setAudioGenConfig(nextConfig);
            void saveAudioGenConfig(nextConfig);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showCharacterPanel && (
        <CharacterPanel
          collection={charCollection}
          onSave={(col) => {
            setCharCollection(col);
            saveCharacterCollection(col);
            setShowCharacterPanel(false);
          }}
          onClose={() => setShowCharacterPanel(false)}
        />
      )}

      {showModPanel && (
        <ModPanel
          collection={modCollection}
          onSave={(col) => {
            setModCollection(col);
            saveModCollection(col);
            const entry = getActiveModEntry(col);
            setModManager(new ModManager(entry.config, entry.state));
            setShowModPanel(false);
          }}
          onClose={() => setShowModPanel(false)}
        />
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// Settings Modal (extended with Character + Mod + Video + Audio)
// ---------------------------------------------------------------------------

const PoolModal: React.FC<{
  editing: ApiPoolItem | null;
  onSave: (newPool: ApiPoolItem[]) => void;
  onClose: () => void;
  apiPool: ApiPoolItem[];
}> = ({ editing, onSave, onClose, apiPool }) => {
  const { t } = useTranslation();
  const editingLlmConfig = editing?.type === 'text' ? (editing.config as LLMConfig) : null;
  const [pName, setPName] = useState(editing?.configName || '');
  const [pType, setPType] = useState<ApiPoolItemType>(editing?.type || 'text');
  const [pProvider, setPProvider] = useState(editing?.config.provider as string || 'custom');
  const [pApiKey, setPApiKey] = useState(editing?.config.apiKey || '');
  const [pBaseUrl, setPBaseUrl] = useState(editing?.config.baseUrl || getDefaultConfig('custom').baseUrl);
  const [pModel, setPModel] = useState(editing?.config.model || getDefaultConfig('custom').model);
  const [pTemperature, setPTemperature] = useState(
    typeof editingLlmConfig?.temperature === 'number' ? editingLlmConfig.temperature : 0.7,
  );
  const [pMaxTokens, setPMaxTokens] = useState(
    typeof editingLlmConfig?.maxTokens === 'number' ? editingLlmConfig.maxTokens : 4096,
  );
  const [pCustomHeaders, setPCustomHeaders] = useState(editingLlmConfig?.customHeaders || '');

  const handlePSave = () => {
    const baseConfig = {
      provider: pProvider as LLMProvider,
      apiKey: pApiKey,
      baseUrl: pBaseUrl,
      model: pModel,
    };
    const newItem: ApiPoolItem = {
      id: editing?.id || Date.now().toString(),
      configName: pName || t('settings.defaultConfigName'),
      config: pType === 'text'
        ? {
          ...baseConfig,
          temperature: pTemperature,
          maxTokens: pMaxTokens,
          customHeaders: pCustomHeaders,
        }
        : baseConfig,
      isActive: editing?.isActive || false,
      type: pType,
    };
    let newPool: ApiPoolItem[];
    if (editing) {
      newPool = apiPool.map(p => p.id === editing.id ? newItem : p);
    } else {
      newPool = [...apiPool, newItem];
    }
    onSave(newPool);
  };

  return (
    <div className={styles.poolModalOverlay} onClick={onClose}>
      <div className={styles.poolModal} onClick={e => e.stopPropagation()}>
        <div className={styles.poolModalHeader}>
          <span>{editing ? t('settings.editConfig') : t('settings.addConfig')}</span>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className={styles.poolModalBody}>
          <div className={styles.field}>
            <label className={styles.label}>{t('settings.configName')}</label>
            <input className={styles.fieldInput} value={pName} onChange={e => setPName(e.target.value)} placeholder={t('settings.configNamePlaceholder')} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t('settings.configType')}</label>
            <select className={styles.select} value={pType} onChange={e => setPType(e.target.value as ApiPoolItemType)}>
              <option value="text">{t('settings.textType')}</option>
              <option value="image">{t('settings.imageType')}</option>
              <option value="video">{t('settings.videoType')}</option>
              <option value="audio">{t('settings.audioType')}</option>
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t('settings.provider')}</label>
            <select className={styles.select} value={pProvider} onChange={e => { setPProvider(e.target.value); const def = getDefaultConfig(e.target.value as LLMProvider); setPBaseUrl(def.baseUrl); setPModel(def.model); }}>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="deepseek">DeepSeek</option>
              <option value="minimax">MiniMax</option>
              <option value="custom">{t('settings.customOpenAI')}</option>
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t('settings.apiKey')}</label>
            <input className={styles.fieldInput} type="password" value={pApiKey} onChange={e => setPApiKey(e.target.value)} placeholder="sk-..." />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t('settings.baseUrl')}</label>
            <input className={styles.fieldInput} value={pBaseUrl} onChange={e => setPBaseUrl(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>{t('settings.model')}</label>
            <input className={styles.fieldInput} value={pModel} onChange={e => setPModel(e.target.value)} />
          </div>
          {pType === 'text' && (
            <>
              <div className={styles.field}>
                <label className={styles.label}>温度 ({pTemperature})</label>
                <input
                  className={styles.fieldInput}
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={pTemperature}
                  onChange={(e) => setPTemperature(parseFloat(e.target.value))}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>最大令牌数</label>
                <input
                  className={styles.fieldInput}
                  type="number"
                  min="100"
                  max="8000"
                  step="100"
                  value={pMaxTokens}
                  onChange={(e) => setPMaxTokens(parseInt(e.target.value, 10))}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>自定义请求头</label>
                <textarea
                  className={styles.fieldInput}
                  value={pCustomHeaders}
                  onChange={(e) => setPCustomHeaders(e.target.value)}
                  placeholder="X-Foo: bar"
                  rows={2}
                />
              </div>
            </>
          )}
        </div>
        <div className={styles.poolModalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>{t('settings.cancel')}</button>
          <button className={styles.saveBtn} onClick={handlePSave}>{t('settings.save')}</button>
        </div>
      </div>
    </div>
  );
};

const SettingsModal: React.FC<{
  config: LLMConfig | null;
  imageGenConfig: ImageGenConfig | null;
  videoGenConfig: VideoGenConfig | null;
  audioGenConfig: AudioGenConfig | null;
  apiPool: ApiPoolItem[];
  onApiPoolChange: (pool: ApiPoolItem[]) => void;
  onConfigChange: (config: LLMConfig) => void;
  onImageGenConfigChange: (config: ImageGenConfig) => void;
  onVideoGenConfigChange: (config: VideoGenConfig) => void;
  onAudioGenConfigChange: (config: AudioGenConfig) => void;
  onClose: () => void;
}> = ({
  config,
  imageGenConfig,
  videoGenConfig,
  audioGenConfig,
  apiPool,
  onApiPoolChange,
  onConfigChange,
  onImageGenConfigChange,
  onVideoGenConfigChange,
  onAudioGenConfigChange,
  onClose,
}) => {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState<'llm' | 'image' | 'video' | 'audio' | 'pool'>('llm');

  const [poolModalOpen, setPoolModalOpen] = useState(false);
  const [poolEditItem, setPoolEditItem] = useState<ApiPoolItem | null>(null);
  const [poolTestResult, setPoolTestResult] = useState<{ id: string; status: 'idle' | 'testing' | 'success' | 'error'; message: string } | null>(null);
  const [typeSelectorOpen, setTypeSelectorOpen] = useState(false);

  const [provider, setProvider] = useState<LLMProvider>(config?.provider || 'minimax');
  const [apiKey, setApiKey] = useState(config?.apiKey || '');
  const [baseUrl, setBaseUrl] = useState(config?.baseUrl || getDefaultConfig('minimax').baseUrl);
  const [model, setModel] = useState(config?.model || getDefaultConfig('minimax').model);
  const [temperature, setTemperature] = useState(
    typeof config?.temperature === 'number' ? config.temperature : 0.7,
  );
  const [maxTokens, setMaxTokens] = useState(
    typeof config?.maxTokens === 'number' ? config.maxTokens : 4096,
  );
  const [customHeaders, setCustomHeaders] = useState(config?.customHeaders || '');

  const [igProvider, setIgProvider] = useState<ImageGenProvider>(
    imageGenConfig?.provider || 'gemini',
  );
  const [igApiKey, setIgApiKey] = useState(imageGenConfig?.apiKey || '');
  const [igBaseUrl, setIgBaseUrl] = useState(
    imageGenConfig?.baseUrl || getDefaultImageGenConfig('gemini').baseUrl,
  );
  const [igModel, setIgModel] = useState(
    imageGenConfig?.model || getDefaultImageGenConfig('gemini').model,
  );
  const [igCustomHeaders, setIgCustomHeaders] = useState(
    imageGenConfig?.customHeaders || '',
  );

  const [vgProvider, setVgProvider] = useState<VideoGenProvider>(
    videoGenConfig?.provider || 'minimax',
  );
  const [vgApiKey, setVgApiKey] = useState(videoGenConfig?.apiKey || '');
  const [vgBaseUrl, setVgBaseUrl] = useState(
    videoGenConfig?.baseUrl || getDefaultVideoGenConfig('minimax').baseUrl,
  );
  const [vgModel, setVgModel] = useState(
    videoGenConfig?.model || getDefaultVideoGenConfig('minimax').model,
  );
  const [vgCustomHeaders, setVgCustomHeaders] = useState(
    videoGenConfig?.customHeaders || '',
  );

  const [agProvider, setAgProvider] = useState<AudioGenProvider>(
    audioGenConfig?.provider || 'minimax',
  );
  const [agApiKey, setAgApiKey] = useState(audioGenConfig?.apiKey || '');
  const [agBaseUrl, setAgBaseUrl] = useState(
    audioGenConfig?.baseUrl || getDefaultAudioGenConfig('minimax').baseUrl,
  );
  const [agModel, setAgModel] = useState(
    audioGenConfig?.model || getDefaultAudioGenConfig('minimax').model,
  );
  const [agCustomHeaders, setAgCustomHeaders] = useState(
    audioGenConfig?.customHeaders || '',
  );

  const handleProviderChange = (p: LLMProvider) => {
    setProvider(p);
    const defaults = getDefaultConfig(p);
    setBaseUrl(defaults.baseUrl);
    setModel(defaults.model);
  };

  const handleIgProviderChange = (p: ImageGenProvider) => {
    setIgProvider(p);
    const defaults = getDefaultImageGenConfig(p);
    setIgBaseUrl(defaults.baseUrl);
    setIgModel(defaults.model);
  };

  const handleVgProviderChange = (p: VideoGenProvider) => {
    setVgProvider(p);
    const defaults = getDefaultVideoGenConfig(p);
    setVgBaseUrl(defaults.baseUrl);
    setVgModel(defaults.model);
  };

  const handleAgProviderChange = (p: AudioGenProvider) => {
    setAgProvider(p);
    const defaults = getDefaultAudioGenConfig(p);
    setAgBaseUrl(defaults.baseUrl);
    setAgModel(defaults.model);
  };

  const renderLLMSettings = () => (
    <>
      <div className={styles.field}>
        <label className={styles.label}>{t('settings.provider')}</label>
        <select
          className={styles.select}
          value={provider}
          onChange={(e) => handleProviderChange(e.target.value as LLMProvider)}
        >
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
          <option value="deepseek">DeepSeek</option>
          <option value="minimax">MiniMax</option>
          <option value="custom">{t('settings.customOpenAI')}</option>
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>{t('settings.apiKey')}</label>
        <input
          className={styles.fieldInput}
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-..."
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>{t('settings.baseUrl')}</label>
        <input
          className={styles.fieldInput}
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>{t('settings.model')}</label>
        <input
          className={styles.fieldInput}
          value={model}
          onChange={(e) => setModel(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>温度 ({temperature})</label>
        <input
          className={styles.fieldInput}
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={temperature}
          onChange={(e) => setTemperature(parseFloat(e.target.value))}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>最大令牌数</label>
        <input
          className={styles.fieldInput}
          type="number"
          min="100"
          max="8000"
          step="100"
          value={maxTokens}
          onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>自定义请求头</label>
        <textarea
          className={styles.fieldInput}
          value={customHeaders}
          onChange={(e) => setCustomHeaders(e.target.value)}
          placeholder="X-Foo: bar"
          rows={2}
        />
      </div>
    </>
  );

  const renderImageSettings = () => (
    <>
      <div className={styles.formGroup}>
        <label>{t('settings.provider')}</label>
        <select
          className={styles.formControl}
          value={igProvider}
          onChange={(e) => handleIgProviderChange(e.target.value as ImageGenProvider)}
        >
          <option value="openai">OpenAI</option>
          <option value="gemini">Gemini</option>
          <option value="custom">{t('settings.customOpenAI')}</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label>{t('settings.apiKey')}</label>
        <input
          className={styles.formControl}
          type="password"
          value={igApiKey}
          onChange={(e) => setIgApiKey(e.target.value)}
          placeholder="API 密钥..."
        />
      </div>

      <div className={styles.formGroup}>
        <label>{t('settings.baseUrl')}</label>
        <input
          className={styles.formControl}
          value={igBaseUrl}
          onChange={(e) => setIgBaseUrl(e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <label>{t('settings.model')}</label>
        <input
          className={styles.formControl}
          value={igModel}
          onChange={(e) => setIgModel(e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <label>自定义请求头</label>
        <textarea
          className={`${styles.formControl} ${styles.formTextarea}`}
          value={igCustomHeaders}
          onChange={(e) => setIgCustomHeaders(e.target.value)}
          placeholder="X-Foo: bar"
          rows={2}
        />
      </div>
    </>
  );

  const renderPoolSettings = () => {
    const activeItem = apiPool.find(p => p.isActive);
    return (
      <>
        <div className={styles.poolHeader}>
          <div>
            <div className={styles.poolTitle}>{t('settings.apiPoolTitle')}</div>
            <div className={styles.poolDesc}>{t('settings.apiPoolDesc')}</div>
          </div>
          <button className={styles.poolAddBtn} onClick={() => { setTypeSelectorOpen(true); }}>
            <Plus size={16} /> {t('settings.addConfig')}
          </button>
        </div>

        {activeItem && (
          <div className={styles.poolActiveInfo}>
            <span className={styles.poolActiveBadge}>{t('settings.active')}</span>
            <span>{activeItem.configName} - {activeItem.type === 'text' ? t('settings.textType') : activeItem.type === 'image' ? t('settings.imageType') : activeItem.type === 'video' ? t('settings.videoType') : t('settings.audioType')}</span>
          </div>
        )}

        <div className={styles.poolList}>
          {apiPool.length === 0 && (
            <div className={styles.poolEmpty}>{t('settings.poolEmpty')}</div>
          )}
          {apiPool.map((item) => (
            <div key={item.id} className={`${styles.poolItem} ${item.isActive ? styles.poolItemActive : ''}`}>
              <div className={styles.poolItemMain} onClick={() => {
                const newPool = apiPool.map(p => ({ ...p, isActive: p.id === item.id }));
                onApiPoolChange(newPool);
                saveApiPool(newPool);
              }}>
                <div className={styles.poolItemIcon}>
                  {item.config.provider === 'anthropic' ? <MessageSquare size={18} /> : item.config.provider === 'deepseek' ? <Check size={18} /> : <Zap size={18} />}
                </div>
                <div className={styles.poolItemInfo}>
                  <div className={styles.poolItemName}>
                    {item.configName}
                    {item.isActive && <span className={styles.poolItemActiveTag}>{t('settings.activated')}</span>}
                  </div>
                  <div className={styles.poolItemMeta}>
                    {item.type === 'text' ? t('settings.textType') : item.type === 'image' ? t('settings.imageType') : item.type === 'video' ? t('settings.videoType') : t('settings.audioType')} - {item.config.provider} / {item.config.model}
                  </div>
                </div>
              </div>
              <div className={styles.poolItemActions}>
                <button
                  className={`${styles.poolItemBtn} ${item.isActive ? styles.poolItemBtnActive : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    const newPool = apiPool.map(p => ({
                      ...p,
                      isActive: p.id === item.id ? !p.isActive : p.isActive,
                    }));
                    onApiPoolChange(newPool);
                    saveApiPool(newPool);
                  }}
                  title={item.isActive ? t('settings.disable') : t('settings.enable')}
                >
                  {item.isActive ? <Check size={14} /> : <Power size={14} />}
                </button>
                <button className={styles.poolItemBtn} onClick={(e) => { e.stopPropagation(); if (item.type === 'text') { setPoolTestResult({ id: item.id, status: 'testing', message: t('settings.testing') }); testPoolConfig(item.config as LLMConfig); } }} title={t('settings.testConnection')}>
                  <Zap size={14} />
                </button>
                <button className={styles.poolItemBtn} onClick={(e) => { e.stopPropagation(); setPoolEditItem(item); setPoolModalOpen(true); }} title={t('settings.edit')}>
                  <Pencil size={14} />
                </button>
                <button className={`${styles.poolItemBtn} ${styles.poolItemBtnDanger}`} onClick={(e) => { e.stopPropagation(); deletePoolItem(item.id); }} title={t('settings.delete')}>
                  <Trash size={14} />
                </button>
              </div>
              {poolTestResult?.id === item.id && poolTestResult.status !== 'idle' && (
                <div className={`${styles.poolTestResult} ${poolTestResult.status === 'success' ? styles.poolTestSuccess : poolTestResult.status === 'error' ? styles.poolTestError : ''}`}>
                  {poolTestResult.message}
                </div>
              )}
            </div>
          ))}
        </div>

        {typeSelectorOpen && (
          <div className={styles.typeSelectorOverlay} onClick={() => setTypeSelectorOpen(false)}>
            <div className={styles.typeSelector} onClick={e => e.stopPropagation()}>
              <div className={styles.typeSelectorHeader}>
                <span>{t('settings.selectConfigType')}</span>
                <button onClick={() => setTypeSelectorOpen(false)}><X size={18} /></button>
              </div>
              <div className={styles.typeSelectorBody}>
                <div className={styles.typeOption} onClick={() => { setTypeSelectorOpen(false); setActiveSection('llm'); }}>
                  <div className={styles.typeOptionIcon}><MessageSquare size={20} /></div>
                  <div className={styles.typeOptionInfo}>
                    <div className={styles.typeOptionName}>{t('settings.textType')}</div>
                    <div className={styles.typeOptionDesc}>大语言模型 / 对话补全</div>
                  </div>
                </div>
                <div className={styles.typeOption} onClick={() => { setTypeSelectorOpen(false); setActiveSection('image'); }}>
                  <div className={styles.typeOptionIcon}><Image size={20} /></div>
                  <div className={styles.typeOptionInfo}>
                    <div className={styles.typeOptionName}>{t('settings.imageType')}</div>
                    <div className={styles.typeOptionDesc}>图像生成</div>
                  </div>
                </div>
                <div className={styles.typeOption} onClick={() => { setTypeSelectorOpen(false); setActiveSection('video'); }}>
                  <div className={styles.typeOptionIcon}><Video size={20} /></div>
                  <div className={styles.typeOptionInfo}>
                    <div className={styles.typeOptionName}>{t('settings.videoType')}</div>
                    <div className={styles.typeOptionDesc}>视频生成</div>
                  </div>
                </div>
                <div className={styles.typeOption} onClick={() => { setTypeSelectorOpen(false); setActiveSection('audio'); }}>
                  <div className={styles.typeOptionIcon}><Music size={20} /></div>
                  <div className={styles.typeOptionInfo}>
                    <div className={styles.typeOptionName}>{t('settings.audioType')}</div>
                    <div className={styles.typeOptionDesc}>音频 / 语音生成</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {poolModalOpen && (
          <PoolModal
            editing={poolEditItem}
            onSave={handlePoolSave}
            onClose={() => setPoolModalOpen(false)}
            apiPool={apiPool}
          />
        )}
      </>
    );
  };

  const testPoolConfig = async (cfg: LLMConfig) => {
    try {
      await chat([{ role: 'user', content: t('settings.testPrompt') }], [], cfg);
      setPoolTestResult(prev => prev ? { ...prev, status: 'success', message: t('settings.testSuccess') } : null);
    } catch (err) {
      setPoolTestResult(prev => prev ? { ...prev, status: 'error', message: `${t('settings.testFailed')}: ${err instanceof Error ? err.message : String(err)}` } : null);
    }
  };

  const deletePoolItem = (id: string) => {
    const newPool = apiPool.filter(p => p.id !== id);
    onApiPoolChange(newPool);
    saveApiPool(newPool);
  };

  const handlePoolSave = (newPool: ApiPoolItem[]) => {
    onApiPoolChange(newPool);
    saveApiPool(newPool);
    setPoolModalOpen(false);
  };

  const renderVideoSettings = () => (
    <>
      <div className={styles.formGroup}>
        <label>{t('settings.provider')}</label>
        <select
          className={styles.formControl}
          value={vgProvider}
          onChange={(e) => handleVgProviderChange(e.target.value as VideoGenProvider)}
        >
          <option value="minimax">MiniMax</option>
          <option value="openai">OpenAI</option>
          <option value="kling">Kling</option>
          <option value="pika">Pika</option>
          <option value="custom">{t('settings.customOpenAI')}</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label>{t('settings.apiKey')}</label>
        <input
          className={styles.formControl}
          type="password"
          value={vgApiKey}
          onChange={(e) => setVgApiKey(e.target.value)}
          placeholder="API 密钥..."
        />
      </div>

      <div className={styles.formGroup}>
        <label>{t('settings.baseUrl')}</label>
        <input
          className={styles.formControl}
          value={vgBaseUrl}
          onChange={(e) => setVgBaseUrl(e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <label>{t('settings.model')}</label>
        <input
          className={styles.formControl}
          value={vgModel}
          onChange={(e) => setVgModel(e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <label>自定义请求头</label>
        <textarea
          className={`${styles.formControl} ${styles.formTextarea}`}
          value={vgCustomHeaders}
          onChange={(e) => setVgCustomHeaders(e.target.value)}
          placeholder="X-Foo: bar"
          rows={2}
        />
      </div>
    </>
  );

  const renderAudioSettings = () => (
    <>
      <div className={styles.formGroup}>
        <label>{t('settings.provider')}</label>
        <select
          className={styles.formControl}
          value={agProvider}
          onChange={(e) => handleAgProviderChange(e.target.value as AudioGenProvider)}
        >
          <option value="minimax">MiniMax</option>
          <option value="openai">OpenAI</option>
          <option value="elevenlabs">ElevenLabs</option>
          <option value="custom">{t('settings.customOpenAI')}</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label>{t('settings.apiKey')}</label>
        <input
          className={styles.formControl}
          type="password"
          value={agApiKey}
          onChange={(e) => setAgApiKey(e.target.value)}
          placeholder="API 密钥..."
        />
      </div>

      <div className={styles.formGroup}>
        <label>{t('settings.baseUrl')}</label>
        <input
          className={styles.formControl}
          value={agBaseUrl}
          onChange={(e) => setAgBaseUrl(e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <label>{t('settings.model')}</label>
        <input
          className={styles.formControl}
          value={agModel}
          onChange={(e) => setAgModel(e.target.value)}
        />
      </div>

      <div className={styles.formGroup}>
        <label>自定义请求头</label>
        <textarea
          className={`${styles.formControl} ${styles.formTextarea}`}
          value={agCustomHeaders}
          onChange={(e) => setAgCustomHeaders(e.target.value)}
          placeholder="X-Foo: bar"
          rows={2}
        />
      </div>
    </>
  );

  return (
    <div className={styles.overlay} data-testid="settings-overlay">
      <div className={styles.settingsModal} data-testid="settings-modal">
        <div className={styles.settingsHeader}>
          <div className={styles.settingsTabs}>
            <button
              className={`${styles.settingsTab} ${activeSection === 'llm' ? styles.settingsTabActive : ''}`}
              onClick={() => setActiveSection('llm')}
            >
              {t('settings.llmSettings')}
            </button>
            <button
              className={`${styles.settingsTab} ${activeSection === 'image' ? styles.settingsTabActive : ''}`}
              onClick={() => setActiveSection('image')}
            >
              {t('settings.imageGeneration')}
            </button>
            <button
              className={`${styles.settingsTab} ${activeSection === 'video' ? styles.settingsTabActive : ''}`}
              onClick={() => setActiveSection('video')}
            >
              {t('settings.videoGeneration')}
            </button>
            <button
              className={`${styles.settingsTab} ${activeSection === 'audio' ? styles.settingsTabActive : ''}`}
              onClick={() => setActiveSection('audio')}
            >
              {t('settings.audioGeneration')}
            </button>
            <button
              className={`${styles.settingsTab} ${activeSection === 'pool' ? styles.settingsTabActive : ''}`}
              onClick={() => setActiveSection('pool')}
            >
              {t('settings.apiPool')}
            </button>
          </div>
        </div>

        <div className={styles.settingsContent}>
          {activeSection === 'llm' && renderLLMSettings()}
          {activeSection === 'image' && renderImageSettings()}
          {activeSection === 'video' && renderVideoSettings()}
          {activeSection === 'audio' && renderAudioSettings()}
          {activeSection === 'pool' && renderPoolSettings()}
        </div>

        <div className={styles.settingsActions}>
          <button className={styles.cancelBtn} onClick={onClose}>
            {t('settings.cancel')}
          </button>
          <button
            className={styles.saveBtn}
            onClick={() => {
              let newItem: ApiPoolItem | null = null;

              if (activeSection === 'llm' && apiKey.trim()) {
                const nextConfig: LLMConfig = {
                  provider,
                  apiKey,
                  baseUrl,
                  model,
                  temperature,
                  maxTokens,
                  customHeaders,
                };
                onConfigChange(nextConfig);
                newItem = {
                  id: Date.now().toString(),
                  configName: t('settings.textType'),
                  config: nextConfig as AnyApiConfig,
                  type: 'text',
                  isActive: true,
                };
              } else if (activeSection === 'image' && igApiKey.trim()) {
                const nextImageConfig: ImageGenConfig = {
                  provider: igProvider,
                  apiKey: igApiKey,
                  baseUrl: igBaseUrl,
                  model: igModel,
                  customHeaders: igCustomHeaders.trim() || undefined,
                };
                onImageGenConfigChange(nextImageConfig);
                newItem = {
                  id: Date.now().toString(),
                  configName: t('settings.imageType'),
                  config: nextImageConfig as AnyApiConfig,
                  type: 'image',
                  isActive: true,
                };
              } else if (activeSection === 'video' && vgApiKey.trim()) {
                const nextVideoConfig: VideoGenConfig = {
                  provider: vgProvider,
                  apiKey: vgApiKey,
                  baseUrl: vgBaseUrl,
                  model: vgModel,
                  customHeaders: vgCustomHeaders.trim() || undefined,
                };
                onVideoGenConfigChange(nextVideoConfig);
                newItem = {
                  id: Date.now().toString(),
                  configName: t('settings.videoType'),
                  config: nextVideoConfig as AnyApiConfig,
                  type: 'video',
                  isActive: true,
                };
              } else if (activeSection === 'audio' && agApiKey.trim()) {
                const nextAudioConfig: AudioGenConfig = {
                  provider: agProvider,
                  apiKey: agApiKey,
                  baseUrl: agBaseUrl,
                  model: agModel,
                  customHeaders: agCustomHeaders.trim() || undefined,
                };
                onAudioGenConfigChange(nextAudioConfig);
                newItem = {
                  id: Date.now().toString(),
                  configName: t('settings.audioType'),
                  config: nextAudioConfig as AnyApiConfig,
                  type: 'audio',
                  isActive: true,
                };
              }

              if (newItem) {
                const newConfig = newItem.config as { apiKey: string; baseUrl: string };
                const exists = apiPool.some(p => {
                  const poolConfig = p.config as { apiKey: string; baseUrl: string };
                  return poolConfig.apiKey === newConfig.apiKey && poolConfig.baseUrl === newConfig.baseUrl;
                });
                
                if (!exists) {
                  const newPool = [...apiPool.map(p => ({ ...p, isActive: false })), newItem];
                  onApiPoolChange(newPool);
                  saveApiPool(newPool);
                }
                
                onClose();
              }
            }}
          >
            {t('settings.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
