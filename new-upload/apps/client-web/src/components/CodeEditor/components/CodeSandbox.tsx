import React, { useState, useRef, useCallback, useEffect } from 'react';

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
}

export interface CodeSandboxProps {
  code: string;
  language?: 'javascript' | 'html' | 'python';
  onResult?: (result: ExecutionResult) => void;
  autoRun?: boolean;
}

const CodeSandbox: React.FC<CodeSandboxProps> = ({
  code,
  language = 'javascript',
  onResult,
  autoRun = false,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timeoutRef = useRef<number | null>(null);

  const executeJavaScript = useCallback(() => {
    return new Promise<ExecutionResult>((resolve) => {
      const startTime = performance.now();
      let output = '';
      let error = '';

      const logs: string[] = [];
      const fakeConsole = {
        log: (...args: unknown[]) => logs.push(args.map(String).join(' ')),
        info: (...args: unknown[]) => logs.push('[INFO] ' + args.map(String).join(' ')),
        warn: (...args: unknown[]) => logs.push('[WARN] ' + args.map(String).join(' ')),
        error: (...args: unknown[]) => logs.push('[ERROR] ' + args.map(String).join(' ')),
        clear: () => logs.length = 0,
      };

      try {
        const func = new Function('console', code);
        func(fakeConsole);

        const endTime = performance.now();
        output = logs.join('\n');

        resolve({
          success: true,
          output,
          executionTime: Math.round(endTime - startTime),
        });
      } catch (err) {
        const endTime = performance.now();
        error = err instanceof Error ? err.message : String(err);
        output = logs.join('\n');

        resolve({
          success: false,
          output,
          error,
          executionTime: Math.round(endTime - startTime),
        });
      }
    });
  }, [code]);

  const executeHTML = useCallback(() => {
    return new Promise<ExecutionResult>((resolve) => {
      const startTime = performance.now();

      if (iframeRef.current) {
        const iframe = iframeRef.current;
        iframe.srcdoc = code;

        const timeout = setTimeout(() => {
          resolve({
            success: true,
            output: 'HTML rendered in preview iframe',
            executionTime: Math.round(performance.now() - startTime),
          });
        }, 100);

        timeoutRef.current = timeout as unknown as number;
      }
    });
  }, [code]);

  const run = useCallback(async () => {
    setIsRunning(true);
    setResult(null);

    let execResult: ExecutionResult;

    if (language === 'javascript') {
      execResult = await executeJavaScript();
    } else if (language === 'html') {
      execResult = await executeHTML();
    } else {
      execResult = {
        success: false,
        output: '',
        error: `Language "${language}" execution not supported in browser`,
        executionTime: 0,
      };
    }

    setResult(execResult);
    setIsRunning(false);
    onResult?.(execResult);
  }, [language, executeJavaScript, executeHTML, onResult]);

  useEffect(() => {
    if (autoRun && code) {
      run();
    }
  }, [autoRun, code, run]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="code-sandbox">
      {language === 'html' && (
        <iframe
          ref={iframeRef}
          className="preview-iframe"
          title="HTML 预览"
          sandbox="allow-scripts"
        />
      )}
      <div className="sandbox-controls">
        <button
          onClick={run}
          disabled={isRunning || !code}
          className="run-button"
        >
          {isRunning ? '▶ 运行中...' : '▶ 运行代码'}
        </button>
        {result && (
          <span className={`status ${result.success ? 'success' : 'error'}`}>
            {result.success ? '✓ 成功' : '✗ 失败'} ({result.executionTime}ms)
          </span>
        )}
      </div>
      {result && (
        <div className={`output-panel ${result.success ? '' : 'has-error'}`}>
          {result.output && (
            <div className="output-content">
              <pre>{result.output}</pre>
            </div>
          )}
          {result.error && (
            <div className="error-content">
              <pre>{result.error}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CodeSandbox;
