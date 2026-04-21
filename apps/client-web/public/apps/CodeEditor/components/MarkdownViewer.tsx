import React, { useState } from 'react';
import { Eye, Code, FileText } from 'lucide-react';
import styles from './MarkdownViewer.module.scss';

interface MarkdownViewerProps {
  content: string;
  fileName?: string;
}

type ViewMode = 'rendered' | 'raw';

// 解析 Markdown 为结构化数据
const parseMarkdown = (text: string) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  const getKey = () => `md-${key++}`;

  while (i < lines.length) {
    const line = lines[i];

    // 代码块
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <div key={getKey()} className={styles.codeBlock}>
          {lang && <div className={styles.codeLang}>{lang}</div>}
          <pre><code>{codeLines.join('\n')}</code></pre>
        </div>
      );
      i++;
      continue;
    }

    // 表格
    if (line.includes('|') && i + 1 < lines.length && lines[i + 1].includes('|-')) {
      const headerLine = line;
      const headers = headerLine.split('|').map(h => h.trim()).filter(h => h);
      i += 2; // 跳过表头行和分隔行
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes('|')) {
        const cells = lines[i].split('|').map(c => c.trim()).filter(c => c);
        if (cells.length > 0) rows.push(cells);
        i++;
      }
      elements.push(
        <div key={getKey()} className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                {headers.map((h, idx) => <th key={idx}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ridx) => (
                <tr key={ridx}>
                  {row.map((cell, cidx) => <td key={cidx}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // 信息卡片（以 | 开头的行）
    if (line.startsWith('| ') && line.endsWith(' |') && line.includes('|')) {
      const cards: { label: string; value: string }[] = [];
      while (i < lines.length && lines[i].startsWith('| ')) {
        const parts = lines[i].slice(1, -1).split('|').map(p => p.trim());
        if (parts.length >= 2) {
          cards.push({ label: parts[0], value: parts[1] });
        }
        i++;
      }
      if (cards.length > 0) {
        elements.push(
          <div key={getKey()} className={styles.infoCards}>
            {cards.map((card, idx) => (
              <div key={idx} className={styles.infoCard}>
                <div className={styles.infoLabel}>{card.label}</div>
                <div className={styles.infoValue}>{card.value}</div>
              </div>
            ))}
          </div>
        );
      }
      continue;
    }

    // 分隔线
    if (line.trim() === '---') {
      elements.push(<hr key={getKey()} className={styles.divider} />);
      i++;
      continue;
    }

    // 标题
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const content = headerMatch[2];
      const Tag = `h${level}` as keyof JSX.IntrinsicElements;
      elements.push(<Tag key={getKey()} className={styles[`heading${level}`]}>{content}</Tag>);
      i++;
      continue;
    }

    // 列表项
    if (line.match(/^\s*[-*+]\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\s*[-*+]\s/)) {
        items.push(lines[i].replace(/^\s*[-*+]\s/, ''));
        i++;
      }
      elements.push(
        <ul key={getKey()} className={styles.list}>
          {items.map((item, idx) => (
            <li key={idx} className={styles.listItem}>{renderInline(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // 有序列表
    if (line.match(/^\s*\d+\.\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\s*\d+\.\s/)) {
        items.push(lines[i].replace(/^\s*\d+\.\s/, ''));
        i++;
      }
      elements.push(
        <ol key={getKey()} className={styles.orderedList}>
          {items.map((item, idx) => (
            <li key={idx} className={styles.listItem}>{renderInline(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // 引用块
    if (line.startsWith('> ')) {
      const quotes: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quotes.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <blockquote key={getKey()} className={styles.blockquote}>
          {quotes.join('\n')}
        </blockquote>
      );
      continue;
    }

    // 普通段落
    if (line.trim()) {
      const paragraphs: string[] = [line];
      i++;
      while (i < lines.length && lines[i].trim() && !lines[i].startsWith('#') && !lines[i].startsWith('```') && !lines[i].startsWith('> ') && !lines[i].startsWith('|') && !lines[i].startsWith('---')) {
        paragraphs.push(lines[i]);
        i++;
      }
      elements.push(
        <p key={getKey()} className={styles.paragraph}>
          {renderInline(paragraphs.join(' '))}
        </p>
      );
      continue;
    }

    // 空行
    i++;
  }

  return elements;
};

// 行内渲染
const renderInline = (text: string): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  // 代码
  remaining = remaining.replace(/`([^`]+)`/g, (match, code) => {
    parts.push(<code key={`code-${key++}`} className={styles.inlineCode}>{code}</code>);
    return `{{CODE${key - 1}}}`;
  });

  // 粗体
  remaining = remaining.replace(/\*\*(.+?)\*\*/g, (match, content) => {
    parts.push(<strong key={`bold-${key++}`} className={styles.bold}>{content}</strong>);
    return `{{BOLD${key - 1}}}`;
  });

  // 斜体
  remaining = remaining.replace(/\*(.+?)\*/g, (match, content) => {
    parts.push(<em key={`italic-${key++}`} className={styles.italic}>{content}</em>);
    return `{{ITALIC${key - 1}}}`;
  });

  // 链接
  remaining = remaining.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
    parts.push(<a key={`link-${key++}`} href={url} target="_blank" rel="noopener noreferrer" className={styles.link}>{text}</a>);
    return `{{LINK${key - 1}}}`;
  });

  // 分割并重组
  const segments = remaining.split(/\{\{(CODE|BOLD|ITALIC|LINK)(\d+)\}\}/);
  const result: React.ReactNode[] = [];
  let i = 0;

  while (i < segments.length) {
    if (segments[i]) {
      if (segments[i] === 'CODE' || segments[i] === 'BOLD' || segments[i] === 'ITALIC' || segments[i] === 'LINK') {
        const index = parseInt(segments[i + 1]);
        result.push(parts.find(p => p && p.key === `${segments[i].toLowerCase()}-${index}`));
        i += 2;
      } else {
        result.push(segments[i]);
        i++;
      }
    } else {
      i++;
    }
  }

  return result.length > 0 ? result : text;
};

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  content,
  fileName = 'document.md',
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('rendered');

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.fileInfo}>
          <FileText size={16} />
          <span>{fileName}</span>
        </div>
        <div className={styles.viewToggle}>
          <button
            className={`${styles.toggleBtn} ${viewMode === 'rendered' ? styles.active : ''}`}
            onClick={() => setViewMode('rendered')}
            title="预览模式"
          >
            <Eye size={14} />
            <span>预览</span>
          </button>
          <button
            className={`${styles.toggleBtn} ${viewMode === 'raw' ? styles.active : ''}`}
            onClick={() => setViewMode('raw')}
            title="原始模式"
          >
            <Code size={14} />
            <span>Markdown</span>
          </button>
        </div>
      </div>
      
      <div className={styles.content}>
        {viewMode === 'rendered' ? (
          <div className={styles.rendered}>
            {parseMarkdown(content)}
          </div>
        ) : (
          <pre className={styles.raw}>
            <code>{content}</code>
          </pre>
        )}
      </div>
    </div>
  );
};

export default MarkdownViewer;
