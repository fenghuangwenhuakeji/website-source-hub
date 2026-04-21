// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { initVibeApp, AppLifecycle } from '@gui/vibe-container';
import {
  reportLifecycle,
  createAppFileApi,
  generateId,
} from '@/lib';
import './i18n';
import {
  Plus,
  Trash2,
  Settings,
  Send,
  MessageSquare,
  Check,
  AlertCircle,
  Loader2,
  Copy,
  CheckCheck,
} from 'lucide-react';
import {
  APP_ID,
  APP_NAME,
  STATE_FILE,
  CONFIG_FILE,
  DEFAULT_SESSION,
  SUGGESTED_QUESTIONS,
  DEFAULT_LLM_CONFIG,
  DEFAULT_CONFIGS,
  type Message,
  type ChatSession,
  type LLMProvider,
} from './actions/constants';
import styles from './index.module.scss';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const chatFileApi = createAppFileApi(APP_NAME);

const CONFIG_KEY = 'webuiapps-webchat-config';

const WebChat: React.FC = () => {
  const { t } = useTranslation('webChat');
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState<ChatSession[]>([DEFAULT_SESSION]);
  const [currentSessionId, setCurrentSessionId] = useState<string>(DEFAULT_SESSION.id);
  const [inputMessage, setInputMessage] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // API配置状态
  const [config, setConfig] = useState<LLMConfig>(DEFAULT_LLM_CONFIG);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [continueReasoning, setContinueReasoning] = useState<string | null>(null);

  const currentSession = sessions.find((s) => s.id === currentSessionId) || sessions[0];

  const loadSessions = useCallback(async () => {
    try {
      const result = await chatFileApi.readFile(STATE_FILE);
      if (result.content) {
        const data = typeof result.content === 'string'
          ? JSON.parse(result.content)
          : result.content;
        if (data.sessions && Array.isArray(data.sessions)) {
          setSessions(data.sessions);
          if (data.currentSessionId) {
            setCurrentSessionId(data.currentSessionId);
          }
        }
      }
    } catch {
      // Use default session
    }
  }, []);

  const loadConfig = useCallback(async () => {
    try {
      // 首先尝试从 localStorage 读取
      const localData = localStorage.getItem(CONFIG_KEY);
      if (localData) {
        setConfig({ ...DEFAULT_LLM_CONFIG, ...JSON.parse(localData) });
        return;
      }

      // 如果 localStorage 没有，尝试从文件读取
      const result = await chatFileApi.readFile(CONFIG_FILE);
      if (result.content) {
        const data = typeof result.content === 'string'
          ? JSON.parse(result.content)
          : result.content;
        setConfig({ ...DEFAULT_LLM_CONFIG, ...data });
        // 同步到 localStorage
        localStorage.setItem(CONFIG_KEY, JSON.stringify(data));
      }
    } catch {
      // Use default config
    }
  }, []);

  const saveConfig = useCallback(async (newConfig: LLMConfig) => {
    try {
      // 同时保存到 localStorage 和文件
      localStorage.setItem(CONFIG_KEY, JSON.stringify(newConfig));
      await chatFileApi.writeFile(CONFIG_FILE, newConfig);
      setConfig(newConfig);
    } catch (error) {
      console.error('[WebChat] Failed to save config:', error);
    }
  }, []);

  const saveSessions = useCallback(async (newSessions: ChatSession[], newCurrentId?: string) => {
    try {
      await chatFileApi.writeFile(STATE_FILE, {
        sessions: newSessions,
        currentSessionId: newCurrentId || currentSessionId,
      });
    } catch (error) {
      console.error('[WebChat] Failed to save sessions:', error);
    }
  }, [currentSessionId]);

  useEffect(() => {
    const init = async () => {
      try {
        reportLifecycle(AppLifecycle.LOADING);
        // @ts-expect-error - AppConfig type mismatch with actual usage
        const manager = initVibeApp({
          id: APP_ID,
          url: window.location.href,
          type: 'page',
          name: 'WebChat',
          windowStyle: { width: 1000, height: 700 },
        });
        // @ts-expect-error - handshake returns void but TypeScript expects FC
        manager.handshake({
          id: APP_ID,
          url: window.location.href,
          type: 'page',
          name: 'WebChat',
          windowStyle: { width: 1000, height: 700 },
        });
        reportLifecycle(AppLifecycle.DOM_READY);
        await Promise.all([loadSessions(), loadConfig()]);
        reportLifecycle(AppLifecycle.LOADED);
        manager.ready();
        setIsLoading(false);
      } catch (error) {
        console.error('[WebChat] Init error:', error);
        setIsLoading(false);
      }
    };
    init();
    return () => {
      reportLifecycle(AppLifecycle.UNLOADING);
      reportLifecycle(AppLifecycle.DESTROYED);
    };
  }, [loadSessions, loadConfig]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession.messages, isThinking]);

  const handleProviderChange = (provider: LLMProvider) => {
    const defaults = DEFAULT_CONFIGS[provider];
    setConfig(prev => ({
      ...prev,
      provider,
      baseUrl: defaults.baseUrl,
      model: defaults.model,
    }));
  };

  const testConnection = async () => {
    if (!config.apiKey) {
      setTestStatus('error');
      setTestMessage(t('apiKeyRequired'));
      return;
    }

    setTestStatus('testing');
    setTestMessage(t('testing'));

    try {
      // 构建目标URL
      let targetUrl = config.baseUrl;
      if (targetUrl.endsWith('/')) {
        targetUrl = targetUrl.slice(0, -1);
      }
      const hasVersion = /\/(v\d+|chat)\/?$/.test(targetUrl);
      if (!hasVersion) {
        targetUrl = `${targetUrl}/v1/chat/completions`;
      } else if (!targetUrl.includes('/chat/completions')) {
        targetUrl = `${targetUrl}/chat/completions`;
      }

      // 发送测试请求
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 5,
        }),
      });

      if (response.ok) {
        setTestStatus('success');
        setTestMessage(t('testSuccess'));
      } else {
        const errorData = await response.json().catch(() => null);
        setTestStatus('error');
        setTestMessage(errorData?.error?.message || t('testFailed'));
      }
    } catch (error) {
      setTestStatus('error');
      setTestMessage(error instanceof Error ? error.message : t('testFailed'));
    }
  };

  const handleSaveConfig = () => {
    saveConfig(config);
    setShowSettings(false);
    setTestStatus('idle');
  };

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isThinking) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: Date.now(),
    };

    const assistantMessageId = generateId();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    const newSessions = sessions.map((s) =>
      s.id === currentSessionId
        ? { ...s, messages: [...s.messages, userMessage, assistantMessage], updatedAt: Date.now() }
        : s
    );

    setSessions(newSessions);
    saveSessions(newSessions);
    setInputMessage('');
    setIsThinking(true);

    try {
      // 构建消息历史
      const chatHistory: ChatMessage[] = currentSession.messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

      // 添加系统提示词
      const messagesWithSystem: ChatMessage[] = config.systemPrompt
        ? [{ role: 'system' as const, content: config.systemPrompt }, ...chatHistory, { role: 'user' as const, content: userMessage.content }]
        : [...chatHistory, { role: 'user' as const, content: userMessage.content }];

      // 构建目标URL
      let targetUrl = config.baseUrl;
      if (targetUrl.endsWith('/')) {
        targetUrl = targetUrl.slice(0, -1);
      }
      const hasVersion = /\/(v\d+|chat)\/?$/.test(targetUrl);
      if (!hasVersion) {
        targetUrl = `${targetUrl}/v1/chat/completions`;
      } else if (!targetUrl.includes('/chat/completions')) {
        targetUrl = `${targetUrl}/chat/completions`;
      }

      // 流式API调用
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          messages: messagesWithSystem,
          stream: true,
          max_tokens: config.maxTokens,
          temperature: config.temperature,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error?.message || `API错误: ${response.status}`);
      }

      // 处理流式响应 (SSE格式)
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let lastFinishReason: string | undefined;

      if (!reader) {
        throw new Error('无法读取响应流');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              lastFinishReason = parsed.choices?.[0]?.finish_reason;
              const content = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.text || '';
              if (content) {
                fullContent += content;
                // 实时更新消息内容
                setSessions((prev) => {
                  const updated = prev.map((s) => {
                    if (s.id !== currentSessionId) return s;
                    const msgs = [...s.messages];
                    const lastMsg = msgs[msgs.length - 1];
                    if (lastMsg?.id === assistantMessageId) {
                      msgs[msgs.length - 1] = { ...lastMsg, content: fullContent };
                    }
                    return { ...s, messages: msgs, updatedAt: Date.now() };
                  });
                  return updated;
                });
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }

      // 流式结束，检测是否被截断（仅根据 finish_reason 判断）
      const wasTruncated = lastFinishReason === 'length';

      // 标记消息完成
      setSessions((prev) => {
        const updated = prev.map((s) => {
          if (s.id !== currentSessionId) return s;
          const msgs = [...s.messages];
          const lastMsg = msgs[msgs.length - 1];
          if (lastMsg?.id === assistantMessageId) {
            msgs[msgs.length - 1] = { ...lastMsg, content: fullContent, isStreaming: false, wasTruncated };
          }
          return { ...s, messages: msgs, updatedAt: Date.now() };
        });
        saveSessions(updated);
        return updated;
      });

      // 如果被截断，循环续写直到完成
      let currentContent = fullContent;
      let continueCount = 0;
      const maxContinues = 5;

      while (wasTruncated && continueCount < maxContinues) {
        continueCount++;
        setContinueReasoning(`正在继续生成... (${continueCount}/${maxContinues})`);

        try {
          const continueResponse = await fetch(targetUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${config.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: config.model,
              messages: [
                ...(config.systemPrompt ? [{ role: 'system' as const, content: config.systemPrompt }] : []),
                ...currentSession.messages
                  .filter((m) => m.role !== 'system' && m.id !== assistantMessageId)
                  .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
                { role: 'assistant' as const, content: currentContent },
                { role: 'user' as const, content: '请直接继续输出，不要任何解释，直接从上次中断的地方继续生成内容。' },
              ],
              stream: true,
              max_tokens: config.maxTokens,
              temperature: config.temperature,
            }),
          });

          if (!continueResponse.ok) break;

          const continueReader = continueResponse.body?.getReader();
          const continueDecoder = new TextDecoder();
          let continueFullContent = '';

          if (!continueReader) break;

          while (true) {
            const { done, value } = await continueReader.read();
            if (done) break;

            const continueChunk = continueDecoder.decode(value, { stream: true });
            const continueLines = continueChunk.split('\n');

            for (const line of continueLines) {
              if (line.startsWith('data: ')) {
                const continueData = line.slice(6);
                if (continueData === '[DONE]') continue;

                try {
                  const continueParsed = JSON.parse(continueData);
                  const continueContent = continueParsed.choices?.[0]?.delta?.content || continueParsed.choices?.[0]?.text || '';

                  // 过滤废话：移除解释性词语、过渡语（即使在内容中间）
                  let filteredContent = continueContent;
                  // 匹配开头的废话词
                  const fillerPatterns = [
                    /^(继续|好的|让我|下面|以上|因此|所以|接着|然后|综上所述|首先|其次|最后|现在|于是|可以看到|不难发现|值得注意的是|好的，我来|好的，我们|以下是|代码如下|具体是|也就是说|换句话说|简而言之|总的来说|总的来说|总而言之|言归正传|继续上次的|接着上文的)[：:，。,\s]*/gi,
                    /^[.。．]\s*$/g,
                    /^[\s,，、]*$/g,
                  ];
                  for (const pattern of fillerPatterns) {
                    filteredContent = filteredContent.replace(pattern, '');
                  }

                  // 如果内容全部是废话，跳过
                  if (!filteredContent || filteredContent.trim().length === 0) {
                    continue;
                  }

                  // 如果过滤后以代码标记开头，检查是否与之前内容重复（避免重新开始代码块）
                  if (/^```/.test(filteredContent.trim())) {
                    // 检查最后是否有未闭合的代码块
                    const lastCodeBlockMatch = currentContent.match(/```\w*\n[\s\S]*$/);
                    if (lastCodeBlockMatch) {
                      // 已有未闭合的代码块，如果新内容也是代码块开头，可能AI在重新开始
                      // 检查是否内容重复
                      const codeAfterFence = filteredContent.split('```')[1] || '';
                      const existingCode = lastCodeBlockMatch[0];
                      // 如果新代码块与已有内容有重复，则跳过
                      if (existingCode.includes(codeAfterFence.slice(0, 50))) {
                        continue;
                      }
                    }
                  }

                  if (filteredContent) {
                    continueFullContent += filteredContent;
                    setSessions((prev) => {
                      const updated = prev.map((s) => {
                        if (s.id !== currentSessionId) return s;
                        const msgs = [...s.messages];
                        const lastMsg = msgs[msgs.length - 1];
                        if (lastMsg?.id === assistantMessageId) {
                          msgs[msgs.length - 1] = { ...lastMsg, content: currentContent + continueFullContent };
                        }
                        return { ...s, messages: msgs, updatedAt: Date.now() };
                      });
                      return updated;
                    });
                  }
                } catch {
                  // 忽略解析错误
                }
              }
            }
          }

          // 检查续写是否有效
          if (continueFullContent.trim().length === 0) {
            break;
          }

          currentContent += continueFullContent;
          fullContent = currentContent;
        } catch {
          break;
        }
      }

      // 更新最终消息
      setSessions((prev) => {
        const updated = prev.map((s) => {
          if (s.id !== currentSessionId) return s;
          const msgs = [...s.messages];
          const lastMsg = msgs[msgs.length - 1];
          if (lastMsg?.id === assistantMessageId) {
            msgs[msgs.length - 1] = { ...lastMsg, content: fullContent, isStreaming: false };
          }
          return { ...s, messages: msgs, updatedAt: Date.now() };
        });
        saveSessions(updated);
        return updated;
      });

      setContinueReasoning(null);
      setIsThinking(false);
    } catch (error) {
      // 替换流式消息为错误消息
      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: `抱歉，发生了错误：${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: Date.now(),
      };

      setSessions((prev) => {
        const updated = prev.map((s) => {
          if (s.id !== currentSessionId) return s;
          const msgs = [...s.messages];
          // 移除流式消息，添加错误消息
          const lastMsg = msgs[msgs.length - 1];
          if (lastMsg?.id === assistantMessageId) {
            msgs.pop();
          }
          msgs.push(errorMessage);
          return { ...s, messages: msgs, updatedAt: Date.now() };
        });
        saveSessions(updated);
        return updated;
      });
    } finally {
      setIsThinking(false);
    }
  }, [inputMessage, isThinking, sessions, currentSessionId, currentSession.messages, config, saveSessions]);

  const handleNewChat = useCallback(() => {
    const newSession: ChatSession = {
      id: generateId(),
      title: '新对话',
      messages: [
        {
          id: generateId(),
          role: 'assistant',
          content: t('welcomeMessage'),
          timestamp: Date.now(),
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const newSessions = [...sessions, newSession];
    setSessions(newSessions);
    setCurrentSessionId(newSession.id);
    saveSessions(newSessions, newSession.id);
  }, [sessions, saveSessions, t]);

  const handleDeleteSession = useCallback((sessionId: string) => {
    if (sessions.length <= 1) return;
    const newSessions = sessions.filter((s) => s.id !== sessionId);
    setSessions(newSessions);
    if (currentSessionId === sessionId) {
      setCurrentSessionId(newSessions[0].id);
    }
    saveSessions(newSessions, newSessions[0].id);
  }, [sessions, currentSessionId, saveSessions]);

  const handleClearChat = useCallback(() => {
    const newSessions = sessions.map((s) =>
      s.id === currentSessionId
        ? { ...s, messages: [], updatedAt: Date.now() }
        : s
    );
    setSessions(newSessions);
    saveSessions(newSessions);
  }, [sessions, currentSessionId, saveSessions]);

  const handleSuggestedQuestion = useCallback((question: string) => {
    setInputMessage(question);
  }, []);

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <div className={styles.loadingText}>{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className={styles.webChat}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2>{t('title')}</h2>
        </div>
        <button className={styles.newChatBtn} onClick={handleNewChat}>
          <Plus size={18} />
          {t('newChat')}
        </button>
        <div className={styles.historyList}>
          {sessions.length === 0 ? (
            <div className={styles.emptyHistory}>{t('noHistory')}</div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`${styles.historyItem} ${
                  session.id === currentSessionId ? styles.active : ''
                }`}
                onClick={() => setCurrentSessionId(session.id)}
              >
                <MessageSquare size={16} />
                <span className={styles.historyTitle}>{session.title}</span>
                <div className={styles.historyActions}>
                  <button
                    className={styles.actionBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(session.id);
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={styles.chatArea}>
        <div className={styles.chatHeader}>
          <span className={styles.chatTitle}>{currentSession.title}</span>
          <div className={styles.headerActions}>
            <button onClick={handleClearChat}>{t('clearChat')}</button>
            <button onClick={() => setShowSettings(true)}>{t('settings')}</button>
          </div>
        </div>

        <div className={styles.messagesContainer}>
          {currentSession.messages.length === 0 ? (
            <div className={styles.welcomeScreen}>
              <div className={styles.welcomeIcon}>
                <MessageSquare size={64} />
              </div>
              <div className={styles.welcomeTitle}>{t('title')}</div>
              <div className={styles.welcomeText}>{t('welcomeMessage')}</div>
            </div>
          ) : (
            currentSession.messages.map((message) => (
              <div
                key={message.id}
                className={`${styles.message} ${styles[message.role]}`}
              >
                <div className={styles.messageAvatar}>
                  {message.role === 'user' ? 'U' : 'AI'}
                </div>
                <div className={styles.messageBody}>
                  <div className={styles.messageContent}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          const isInline = !match && !className;
                          const codeContent = typeof children === 'string' ? children : String(children);
                          return isInline ? (
                            <code className={styles.inlineCode} {...props}>{codeContent}</code>
                          ) : (
                            <div className={styles.codeBlock}>
                              {match && <div className={styles.codeHeader}>{match[1]}</div>}
                              <pre className={styles.preCode}>
                                <code className={className} {...props}>{codeContent}</code>
                              </pre>
                            </div>
                          );
                        },
                        p({ children, ...props }) {
                          const content = typeof children === 'string' ? children : String(children);
                          return <p {...props}>{content}</p>;
                        },
                        a({ href, children, ...props }) {
                          const linkContent = typeof children === 'string' ? children : String(children);
                          return (
                            <a href={href} target="_blank" rel="noopener noreferrer" className={styles.link} {...props}>
                              {linkContent}
                            </a>
                          );
                        },
                        table({ children, ...props }) {
                          return <div className={styles.tableWrapper}><table className={styles.table} {...props}>{children}</table></div>;
                        },
                        ul({ children, ...props }) {
                          return <ul className={styles.list} {...props}>{children}</ul>;
                        },
                        ol({ children, ...props }) {
                          return <ol className={styles.list} {...props}>{children}</ol>;
                        },
                        li({ children, ...props }) {
                          const content = typeof children === 'string' ? children : String(children);
                          return <li {...props}>{content}</li>;
                        },
                        blockquote({ children, ...props }) {
                          return <blockquote className={styles.blockquote} {...props}>{children}</blockquote>;
                        },
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                    {message.isStreaming && <span className={styles.streamingCursor}>▋</span>}
                  </div>
                  {message.role === 'assistant' && !message.isStreaming && (
                    <div className={styles.messageActions}>
                      <button
                        className={styles.actionBtn}
                        onClick={() => {
                          navigator.clipboard.writeText(message.content);
                          setCopiedMessageId(message.id);
                          setTimeout(() => setCopiedMessageId(null), 2000);
                        }}
                        title="复制文本"
                      >
                        {copiedMessageId === message.id ? <CheckCheck size={14} /> : <Copy size={14} />}
                      </button>
                      {message.content.includes('```') && (
                        <button
                          className={styles.actionBtn}
                          onClick={() => {
                            const codeMatch = message.content.match(/```[\w]*\n([\s\S]*?)```/);
                            if (codeMatch) {
                              navigator.clipboard.writeText(codeMatch[1].trim());
                              setCopiedMessageId(message.id + '-code');
                              setTimeout(() => setCopiedMessageId(null), 2000);
                            }
                          }}
                          title="复制代码"
                        >
                          {copiedMessageId === message.id + '-code' ? <CheckCheck size={14} /> : <Copy size={14} />}
                        </button>
                      )}
                    </div>
                  )}
                  <div className={styles.messageTime}>
                    {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
          {isThinking && (
            <div className={`${styles.message} ${styles.assistant}`}>
              <div className={styles.messageAvatar}>AI</div>
              <div className={styles.thinking}>
                <span>{t('thinking')}</span>
                <div className={styles.dots}>
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {currentSession.messages.length <= 1 && (
          <div className={styles.suggestedQuestions}>
            <span className={styles.suggestedLabel}>{t('suggestedQuestions')}</span>
            {SUGGESTED_QUESTIONS.map((question, index) => (
              <button
                key={index}
                className={styles.questionBtn}
                onClick={() => handleSuggestedQuestion(question)}
              >
                {question}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className={styles.inputArea}>
          <div className={styles.inputContainer}>
            <textarea
              className={styles.textarea}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={t('inputPlaceholder')}
              rows={2}
            />
            <button
              className={styles.sendBtn}
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isThinking}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className={styles.modalOverlay} onClick={() => setShowSettings(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>{t('apiSettings')}</h3>
            
            {/* Provider Selection */}
            <div className={styles.formGroup}>
              <label>{t('provider')}</label>
              <select
                value={config.provider}
                onChange={(e) => handleProviderChange(e.target.value as LLMProvider)}
              >
                <option value="openai">{t('openai')}</option>
                <option value="anthropic">{t('anthropic')}</option>
                <option value="deepseek">{t('deepseek')}</option>
                <option value="minimax">{t('minimax')}</option>
                <option value="custom">{t('custom')}</option>
              </select>
            </div>

            {/* API Key */}
            <div className={styles.formGroup}>
              <label>{t('apiKey')}</label>
              <input
                type="password"
                value={config.apiKey}
                onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="sk-..."
              />
            </div>

            {/* Base URL */}
            <div className={styles.formGroup}>
              <label>{t('baseUrl')}</label>
              <input
                type="text"
                value={config.baseUrl}
                onChange={(e) => setConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
              />
            </div>

            {/* Model */}
            <div className={styles.formGroup}>
              <label>{t('model')}</label>
              <input
                type="text"
                value={config.model}
                onChange={(e) => setConfig(prev => ({ ...prev, model: e.target.value }))}
              />
            </div>

            {/* Temperature */}
            <div className={styles.formGroup}>
              <label>{t('temperature')} ({config.temperature})</label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={config.temperature}
                onChange={(e) => setConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
              />
            </div>

            {/* Max Tokens */}
            <div className={styles.formGroup}>
              <label>{t('maxTokens')}</label>
              <input
                type="number"
                min="100"
                max="8000"
                step="100"
                value={config.maxTokens}
                onChange={(e) => setConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
              />
            </div>

            {/* System Prompt */}
            <div className={styles.formGroup}>
              <label>{t('systemPrompt')}</label>
              <textarea
                value={config.systemPrompt}
                onChange={(e) => setConfig(prev => ({ ...prev, systemPrompt: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Custom Headers */}
            <div className={styles.formGroup}>
              <label>{t('customHeaders')}</label>
              <textarea
                value={config.customHeaders}
                onChange={(e) => setConfig(prev => ({ ...prev, customHeaders: e.target.value }))}
                placeholder={t('customHeadersPlaceholder')}
                rows={2}
              />
            </div>

            {/* Test Connection */}
            <div className={styles.formGroup}>
              <button
                className={styles.testBtn}
                onClick={testConnection}
                disabled={testStatus === 'testing'}
              >
                {testStatus === 'testing' ? (
                  <>
                    <Loader2 size={16} className={styles.spin} />
                    {t('testing')}
                  </>
                ) : (
                  t('testConnection')
                )}
              </button>
              {testStatus !== 'idle' && testStatus !== 'testing' && (
                <div className={`${styles.testResult} ${styles[testStatus]}`}>
                  {testStatus === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                  {testMessage}
                </div>
              )}
            </div>

            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowSettings(false)}>
                {t('cancel')}
              </button>
              <button className={styles.saveBtn} onClick={handleSaveConfig}>
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebChat;
