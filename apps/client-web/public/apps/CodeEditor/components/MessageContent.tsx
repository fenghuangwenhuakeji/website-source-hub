import React from 'react';
import styles from './MessageContent.module.scss';

interface MessageContentProps {
  content: string;
}

// 简单的 Markdown 渲染
const renderMarkdown = (text: string): React.ReactNode => {
  if (!text) return null;

  // 分割代码块
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  // 处理代码块
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let match;
  let lastIndex = 0;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // 添加代码块前的文本
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index);
      parts.push(renderInlineMarkdown(beforeText, key++));
    }

    // 添加代码块
    const lang = match[1] || '';
    const code = match[2];
    parts.push(
      <div key={key++} className={styles.codeBlock}>
        {lang && <div className={styles.codeLang}>{lang}</div>}
        <pre>
          <code>{code}</code>
        </pre>
      </div>
    );

    lastIndex = match.index + match[0].length;
  }

  // 添加剩余文本
  if (lastIndex < text.length) {
    parts.push(renderInlineMarkdown(text.slice(lastIndex), key++));
  }

  return parts.length > 0 ? parts : renderInlineMarkdown(text, 0);
};

// 处理行内 Markdown
const renderInlineMarkdown = (text: string, baseKey: number): React.ReactNode => {
  if (!text) return null;

  // 按行分割处理
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const key = `${baseKey}-${i}`;

    // 空行
    if (!line.trim()) {
      elements.push(<br key={key} />);
      continue;
    }

    // 标题
    if (line.startsWith('# ')) {
      elements.push(<h1 key={key} className={styles.heading1}>{line.slice(2)}</h1>);
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(<h2 key={key} className={styles.heading2}>{line.slice(3)}</h2>);
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(<h3 key={key} className={styles.heading3}>{line.slice(4)}</h3>);
      continue;
    }

    // 分隔线
    if (line.trim() === '---') {
      elements.push(<hr key={key} className={styles.divider} />);
      continue;
    }

    // 引用块
    if (line.startsWith('> ')) {
      elements.push(<blockquote key={key}>{line.slice(2)}</blockquote>);
      continue;
    }

    // 列表项
    if (line.match(/^\s*[-*+]\s/)) {
      elements.push(<li key={key}>{renderInlineStyles(line.replace(/^\s*[-*+]\s/, ''))}</li>);
      continue;
    }

    // 有序列表
    if (line.match(/^\s*\d+\.\s/)) {
      elements.push(<li key={key}>{renderInlineStyles(line.replace(/^\s*\d+\.\s/, ''))}</li>);
      continue;
    }

    // 普通段落
    elements.push(<p key={key}>{renderInlineStyles(line)}</p>);
  }

  return <>{elements}</>;
};

// 处理行内样式
const renderInlineStyles = (text: string): React.ReactNode => {
  if (!text) return null;

  // 粗体 **text**
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // 斜体 *text*
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // 行内代码 `code`
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // 链接 [text](url)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  return <span dangerouslySetInnerHTML={{ __html: text }} />;
};

const MessageContent: React.FC<MessageContentProps> = ({ content }) => {
  return (
    <div className={styles.messageContent}>
      {renderMarkdown(content)}
    </div>
  );
};

export default MessageContent;
