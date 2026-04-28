import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MessageSquare } from 'lucide-react';
import { DEFAULT_LLM_CONFIG, type LLMConfig } from '@/components/CodeEditor/actions/agentConstants';
import {
  buildLLMRequestHeaders,
  loadLLMConfigFromStorage,
  resolveLLMChatEndpoint,
} from '@/lib/llmConfigUtils';
import styles from './AIChatPanel.module.scss';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface AIChatPanelProps {
  apiConfig?: Partial<LLMConfig>;
  onCodeInsert?: (code: string) => void;
  context?: {
    currentFile?: string;
    selectedCode?: string;
    language?: string;
  };
}

const AIChatPanel: React.FC<AIChatPanelProps> = ({
  apiConfig,
  onCodeInsert,
  context,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resolvedConfig = React.useMemo(
    () => ({ ...DEFAULT_LLM_CONFIG, ...loadLLMConfigFromStorage(), ...(apiConfig ?? {}) }),
    [apiConfig],
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const contextPrompt = context?.selectedCode
        ? `当前选中的代码:\n\`\`\`${context.language || 'javascript'}\n${context.selectedCode}\n\`\`\`\n\n用户问题: ${input}`
        : input;

      const response = await fetch(resolveLLMChatEndpoint(resolvedConfig.baseUrl), {
        method: 'POST',
        headers: buildLLMRequestHeaders(resolvedConfig),
        body: JSON.stringify({
          model: resolvedConfig.model,
          messages: [
            {
              role: 'system',
              content: '你是一个专业的代码助手。当用户询问代码时，直接给出代码解决方案，并在代码块中提供完整的、可运行的代码。',
            },
            ...messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            {
              role: 'user',
              content: contextPrompt,
            },
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      let assistantContent = '';
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content || '';
              if (delta) {
                assistantContent += delta;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessage.id
                      ? { ...m, content: assistantContent }
                      : m
                  )
                );
              }
            } catch {}
          }
        }
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `抱歉，发生了错误：${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const insertCode = (code: string) => {
    onCodeInsert?.(code);
  };

  return (
    <div className={styles.aiChatPanel}>
      <div className={styles.chatHeader}>
        <div className={styles.title}>
          <MessageSquare size={14} />
          <span>AI 助手</span>
        </div>
      </div>
      <div className={styles.chatMessages}>
        {messages.length === 0 && (
          <div className={styles.chatWelcome}>
            <div className={styles.welcomeIcon}>🤖</div>
            <div className={styles.welcomeTitle}>AI 代码助手</div>
            <div className={styles.welcomeText}>
              问我任何关于代码的问题，我会尽力帮你解答！
            </div>
          </div>
        )}
        {messages.map((message) => (
          <div key={message.id} className={`${styles.chatMessage} ${styles[message.role]}`}>
            <div className={styles.messageAvatar}>
              {message.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className={styles.messageContent}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const code = String(children).replace(/\n$/, '');

                    return match ? (
                      <div className={styles.codeBlock}>
                        <div className={styles.codeBlockHeader}>
                          <span className={styles.codeLang}>{match[1]}</span>
                          <button
                            className={styles.insertBtn}
                            onClick={() => insertCode(code)}
                          >
                            插入到编辑器
                          </button>
                        </div>
                        <pre>
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      </div>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className={`${styles.chatMessage} ${styles.assistant}`}>
            <div className={styles.messageAvatar}>🤖</div>
            <div className={styles.messageContent}>
              <div className={styles.typingIndicator}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className={styles.chatInputArea}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入你的问题...（回车发送，Shift + 回车换行）"
          rows={2}
        />
        <button onClick={sendMessage} disabled={!input.trim() || isLoading}>
          发送
        </button>
      </div>
    </div>
  );
};

export default AIChatPanel;
