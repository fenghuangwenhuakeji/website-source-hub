import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, Smartphone, Monitor, Tablet, X, Maximize2 } from 'lucide-react';
import styles from './PreviewPanel.module.scss';

type DeviceType = 'desktop' | 'tablet' | 'mobile';

interface PreviewPanelProps {
  code: string;
  language: string;
  onClose?: () => void;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  code,
  language,
  onClose,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [scale, setScale] = useState(1);
  const [key, setKey] = useState(0);

  const deviceSizes = {
    desktop: { width: '100%', height: '100%' },
    tablet: { width: '768px', height: '100%' },
    mobile: { width: '375px', height: '100%' },
  };

  const updatePreview = () => {
    if (!iframeRef.current) return;

    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    
    if (language === 'html') {
      // 直接渲染 HTML
      doc.write(code);
    } else if (language === 'markdown' || language === 'md') {
      // Markdown 需要转换，这里简单渲染为纯文本
      doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            pre {
              background: #f5f5f5;
              padding: 16px;
              border-radius: 6px;
              overflow-x: auto;
            }
            code {
              background: #f5f5f5;
              padding: 2px 6px;
              border-radius: 3px;
              font-family: 'Consolas', monospace;
            }
          </style>
        </head>
        <body>
          <pre>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
        </body>
        </html>
      `);
    } else {
      // 其他语言显示代码
      doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Consolas', 'Monaco', monospace;
              background: #1e1e1e;
              color: #d4d4d4;
              padding: 20px;
              margin: 0;
              white-space: pre-wrap;
              word-wrap: break-word;
              line-height: 1.5;
            }
          </style>
        </head>
        <body>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body>
        </html>
      `);
    }
    
    doc.close();
  };

  useEffect(() => {
    updatePreview();
  }, [code, language, key]);

  const handleRefresh = () => {
    setKey(prev => prev + 1);
  };

  const isHtml = language === 'html' || language === 'htm';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>
          <span>预览</span>
          <span className={styles.badge}>{language.toUpperCase()}</span>
        </div>
        <div className={styles.actions}>
          {isHtml && (
            <>
              <button
                className={`${styles.deviceBtn} ${device === 'mobile' ? styles.active : ''}`}
                onClick={() => setDevice('mobile')}
                title="手机视图"
              >
                <Smartphone size={14} />
              </button>
              <button
                className={`${styles.deviceBtn} ${device === 'tablet' ? styles.active : ''}`}
                onClick={() => setDevice('tablet')}
                title="平板视图"
              >
                <Tablet size={14} />
              </button>
              <button
                className={`${styles.deviceBtn} ${device === 'desktop' ? styles.active : ''}`}
                onClick={() => setDevice('desktop')}
                title="桌面视图"
              >
                <Monitor size={14} />
              </button>
              <div className={styles.divider} />
            </>
          )}
          <button
            className={styles.actionBtn}
            onClick={handleRefresh}
            title="刷新"
          >
            <RefreshCw size={14} />
          </button>
          {onClose && (
            <button
              className={styles.actionBtn}
              onClick={onClose}
              title="关闭"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
      
      <div className={styles.previewArea}>
        <div 
          className={styles.previewWrapper}
          style={{
            width: deviceSizes[device].width,
            height: deviceSizes[device].height,
          }}
        >
          <iframe
            ref={iframeRef}
            key={key}
            className={styles.iframe}
            sandbox="allow-scripts allow-same-origin"
            title="预览"
          />
        </div>
      </div>
    </div>
  );
};

export default PreviewPanel;
