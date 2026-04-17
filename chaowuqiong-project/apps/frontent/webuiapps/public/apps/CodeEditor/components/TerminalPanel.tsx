import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Play, Trash2, X } from 'lucide-react';
import styles from './TerminalPanel.module.scss';

interface TerminalMessage {
  id: string;
  type: 'input' | 'output' | 'error' | 'info';
  content: string;
  timestamp: number;
}

interface TerminalPanelProps {
  onClose?: () => void;
  onExecute?: (command: string) => void;
}

const TerminalPanel: React.FC<TerminalPanelProps> = ({
  onClose,
  onExecute,
}) => {
  const [messages, setMessages] = useState<TerminalMessage[]>([
    {
      id: 'welcome',
      type: 'info',
      content: 'OpenRoom Terminal v1.0.0\nType "help" for available commands.',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (type: TerminalMessage['type'], content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}-${Math.random()}`,
        type,
        content,
        timestamp: Date.now(),
      },
    ]);
  };

  const handleExecute = () => {
    if (!input.trim()) return;

    addMessage('input', `> ${input}`);
    onExecute?.(input);

    // 模拟命令执行
    const command = input.trim().toLowerCase();
    setTimeout(() => {
      switch (command) {
        case 'help':
          addMessage('output', `Available commands:
  help     - Show this help message
  clear    - Clear terminal
  echo     - Echo a message
  date     - Show current date
  ls       - List files
  pwd      - Print working directory`);
          break;
        case 'clear':
          setMessages([]);
          break;
        case 'date':
          addMessage('output', new Date().toString());
          break;
        case 'ls':
          addMessage('output', 'src/\n  components/\n  pages/\n  styles/\npackage.json\nREADME.md');
          break;
        case 'pwd':
          addMessage('output', '/workspace/project');
          break;
        default:
          if (command.startsWith('echo ')) {
            addMessage('output', command.slice(5));
          } else {
            addMessage('error', `Command not found: ${command}`);
          }
      }
    }, 100);

    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleExecute();
    }
  };

  const clearTerminal = () => {
    setMessages([]);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>
          <Terminal size={14} />
          <span>终端</span>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.actionBtn}
            onClick={clearTerminal}
            title="清除"
          >
            <Trash2 size={12} />
          </button>
          {onClose && (
            <button
              className={styles.actionBtn}
              onClick={onClose}
              title="关闭"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      <div className={styles.messages}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.message} ${styles[msg.type]}`}
          >
            <pre className={styles.content}>{msg.content}</pre>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputArea}>
        <span className={styles.prompt}>$</span>
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入命令..."
          spellCheck={false}
        />
        <button
          className={styles.executeBtn}
          onClick={handleExecute}
          disabled={!input.trim()}
        >
          <Play size={12} />
        </button>
      </div>
    </div>
  );
};

export default TerminalPanel;
