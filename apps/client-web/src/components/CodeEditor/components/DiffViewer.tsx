import React, { useState, useMemo } from 'react';
import { X, Copy, Check } from 'lucide-react';
import styles from './DiffViewer.module.scss';

interface DiffLine {
  type: 'unchanged' | 'added' | 'removed';
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
}

interface DiffViewerProps {
  original: string;
  modified: string;
  language?: string;
  onClose?: () => void;
  onApply?: () => void;
}

const DiffViewer: React.FC<DiffViewerProps> = ({
  original,
  modified,
  language = 'text',
  onClose,
  onApply,
}) => {
  const [copied, setCopied] = useState(false);

  // 简单的行级 DIFF 算法
  const diffLines = useMemo(() => {
    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');
    const result: DiffLine[] = [];
    
    let oldIndex = 0;
    let newIndex = 0;
    
    // 使用简单的 LCS (最长公共子序列) 近似算法
    while (oldIndex < originalLines.length || newIndex < modifiedLines.length) {
      const oldLine = originalLines[oldIndex];
      const newLine = modifiedLines[newIndex];
      
      if (oldIndex >= originalLines.length) {
        // 新增行
        result.push({
          type: 'added',
          newLineNumber: newIndex + 1,
          content: newLine,
        });
        newIndex++;
      } else if (newIndex >= modifiedLines.length) {
        // 删除行
        result.push({
          type: 'removed',
          oldLineNumber: oldIndex + 1,
          content: oldLine,
        });
        oldIndex++;
      } else if (oldLine === newLine) {
        // 未改变
        result.push({
          type: 'unchanged',
          oldLineNumber: oldIndex + 1,
          newLineNumber: newIndex + 1,
          content: oldLine,
        });
        oldIndex++;
        newIndex++;
      } else {
        // 检查是否是修改（简单启发式：如果下一行匹配，则当前行是修改）
        const nextOldMatch = originalLines[oldIndex + 1] === newLine;
        const nextNewMatch = modifiedLines[newIndex + 1] === oldLine;
        
        if (nextOldMatch && !nextNewMatch) {
          // 删除当前行
          result.push({
            type: 'removed',
            oldLineNumber: oldIndex + 1,
            content: oldLine,
          });
          oldIndex++;
        } else if (!nextOldMatch && nextNewMatch) {
          // 新增当前行
          result.push({
            type: 'added',
            newLineNumber: newIndex + 1,
            content: newLine,
          });
          newIndex++;
        } else {
          // 视为修改（删除旧行，添加新行）
          result.push({
            type: 'removed',
            oldLineNumber: oldIndex + 1,
            content: oldLine,
          });
          result.push({
            type: 'added',
            newLineNumber: newIndex + 1,
            content: newLine,
          });
          oldIndex++;
          newIndex++;
        }
      }
    }
    
    return result;
  }, [original, modified]);

  const stats = useMemo(() => {
    const added = diffLines.filter(l => l.type === 'added').length;
    const removed = diffLines.filter(l => l.type === 'removed').length;
    const unchanged = diffLines.filter(l => l.type === 'unchanged').length;
    return { added, removed, unchanged };
  }, [diffLines]);

  const handleCopy = () => {
    navigator.clipboard.writeText(modified);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>
          <span>代码对比</span>
          <div className={styles.stats}>
            <span className={styles.added}>+{stats.added}</span>
            <span className={styles.removed}>-{stats.removed}</span>
            <span className={styles.unchanged}>{stats.unchanged} 行未变</span>
          </div>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.actionBtn}
            onClick={handleCopy}
            title={copied ? '已复制' : '复制修改后代码'}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
          {onApply && (
            <button className={styles.applyBtn} onClick={onApply}>
              应用更改
            </button>
          )}
          {onClose && (
            <button className={styles.actionBtn} onClick={onClose}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className={styles.diffContent}>
        <div className={styles.lineNumbers}>
          {diffLines.map((line, index) => (
            <div
              key={index}
              className={`${styles.lineNumber} ${styles[line.type]}`}
            >
              <span className={styles.oldNum}>{line.oldLineNumber || ''}</span>
              <span className={styles.newNum}>{line.newLineNumber || ''}</span>
            </div>
          ))}
        </div>
        <div className={styles.codeLines}>
          {diffLines.map((line, index) => (
            <div
              key={index}
              className={`${styles.codeLine} ${styles[line.type]}`}
            >
              <span className={styles.marker}>
                {line.type === 'added' && '+'}
                {line.type === 'removed' && '-'}
                {line.type === 'unchanged' && ' '}
              </span>
              <span className={styles.content}>{line.content}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DiffViewer;
