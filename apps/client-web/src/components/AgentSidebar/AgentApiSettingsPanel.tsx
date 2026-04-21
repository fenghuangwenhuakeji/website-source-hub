import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Check, Loader2, Save, Settings } from 'lucide-react';
import {
  DEFAULT_CONFIGS,
  DEFAULT_LLM_CONFIG,
  type LLMConfig,
  type LLMProvider,
} from '@/components/CodeEditor/actions/agentConstants';
import { loadLLMConfigFromStorage, saveLLMConfigToStorage } from '@/lib/llmConfigUtils';
import styles from './AgentApiSettingsPanel.module.scss';

interface AgentApiSettingsPanelProps {
  onSaved?: () => void;
}

function parseErrorMessage(payload: unknown): string {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (typeof record.message === 'string' && record.message.trim()) {
      return record.message;
    }
    if (record.error && typeof record.error === 'object') {
      const nested = record.error as Record<string, unknown>;
      if (typeof nested.message === 'string' && nested.message.trim()) {
        return nested.message;
      }
    }
  }
  return '连接失败';
}

const AgentApiSettingsPanel: React.FC<AgentApiSettingsPanelProps> = ({ onSaved }) => {
  const [draft, setDraft] = useState<LLMConfig>(DEFAULT_LLM_CONFIG);
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    try {
      setDraft(loadLLMConfigFromStorage());
    } catch (error) {
      console.warn('[AgentApiSettingsPanel] Failed to load config:', error);
      setDraft(DEFAULT_LLM_CONFIG);
    } finally {
      setLoaded(true);
    }
  }, []);

  const handleProviderChange = useCallback((provider: LLMProvider) => {
    const defaults = DEFAULT_CONFIGS[provider];
    setDraft((current) => ({
      ...current,
      provider,
      baseUrl: defaults.baseUrl,
      model: defaults.model,
    }));
  }, []);

  const handleSave = useCallback(() => {
    try {
      saveLLMConfigToStorage(draft);
      setNotice('共享 API 设置已保存，对话和 Claw Code 会共用这套配置。');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('agent-api-config-updated'));
      }
      onSaved?.();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '保存失败');
    }
  }, [draft, onSaved]);

  const handleTestConnection = useCallback(async () => {
    if (!draft.apiKey.trim()) {
      setTestStatus('error');
      setTestMessage('请先填写 API 密钥');
      return;
    }

    setTestStatus('testing');
    setTestMessage('');

    try {
      const response = await fetch('/api/llm-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: draft.provider,
          apiKey: draft.apiKey,
          baseUrl: draft.baseUrl,
          model: draft.model,
          temperature: draft.temperature,
          max_tokens: draft.maxTokens,
          customHeaders: draft.customHeaders,
          messages: [{ role: 'user', content: 'ping' }],
        }),
      });

      if (response.ok) {
        setTestStatus('success');
        setTestMessage('连接成功');
        return;
      }

      const payload = await response.json().catch(() => null);
      setTestStatus('error');
      setTestMessage(parseErrorMessage(payload));
    } catch (error) {
      setTestStatus('error');
      setTestMessage(error instanceof Error ? error.message : '连接失败');
    }
  }, [draft]);

  if (!loaded) {
    return (
      <section className={styles.panel}>
        <div className={styles.loadingState}>
          <Loader2 size={18} className={styles.spin} />
          <span>正在加载 API 设置...</span>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.panel}>
      <div className={styles.hero}>
        <div>
          <p className={styles.kicker}>共享 API 设置</p>
          <h3>模型连接与代理配置</h3>
          <p className={styles.heroText}>
            这里和对话、Claw Code 共用同一套模型配置。保存后，移动端和桌面端都会直接使用这套 API。
          </p>
        </div>
        <span className={styles.heroBadge}>
          <Settings size={14} />
          中文配置
        </span>
      </div>

      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span>服务提供商</span>
          <select value={draft.provider} onChange={(event) => handleProviderChange(event.target.value as LLMProvider)}>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="deepseek">DeepSeek</option>
            <option value="minimax">MiniMax</option>
            <option value="custom">自定义</option>
          </select>
        </label>

        <label className={styles.field}>
          <span>API 密钥</span>
          <input
            type="password"
            value={draft.apiKey}
            onChange={(event) => setDraft((current) => ({ ...current, apiKey: event.target.value }))}
            placeholder="sk-..."
          />
        </label>

        <label className={`${styles.field} ${styles.fieldWide}`}>
          <span>基础地址</span>
          <input
            type="text"
            value={draft.baseUrl}
            onChange={(event) => setDraft((current) => ({ ...current, baseUrl: event.target.value }))}
            placeholder="https://api.openai.com"
          />
        </label>

        <label className={styles.field}>
          <span>模型名称</span>
          <input
            type="text"
            value={draft.model}
            onChange={(event) => setDraft((current) => ({ ...current, model: event.target.value }))}
            placeholder="gpt-4o"
          />
        </label>

        <label className={styles.field}>
          <span>温度 ({draft.temperature})</span>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={draft.temperature}
            onChange={(event) =>
              setDraft((current) => ({ ...current, temperature: parseFloat(event.target.value) }))
            }
          />
        </label>

        <label className={styles.field}>
          <span>最大 Tokens</span>
          <input
            type="number"
            min="100"
            max="16000"
            step="100"
            value={draft.maxTokens}
            onChange={(event) =>
              setDraft((current) => ({ ...current, maxTokens: parseInt(event.target.value, 10) || 4096 }))
            }
          />
        </label>

        <label className={`${styles.field} ${styles.fieldWide}`}>
          <span>自定义请求头（JSON）</span>
          <textarea
            rows={4}
            value={draft.customHeaders || ''}
            onChange={(event) => setDraft((current) => ({ ...current, customHeaders: event.target.value }))}
            placeholder='{"Header": "Value"}'
          />
        </label>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.secondaryButton} onClick={() => void handleTestConnection()}>
          {testStatus === 'testing' ? <Loader2 size={16} className={styles.spin} /> : <Settings size={16} />}
          {testStatus === 'testing' ? '测试中...' : '测试连接'}
        </button>
        <button type="button" className={styles.primaryButton} onClick={handleSave}>
          <Save size={16} />
          保存设置
        </button>
      </div>

      {notice ? <div className={styles.notice}>{notice}</div> : null}
      {testStatus !== 'idle' && testMessage ? (
        <div className={`${styles.testResult} ${testStatus === 'success' ? styles.success : styles.error}`}>
          {testStatus === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          <span>{testMessage}</span>
        </div>
      ) : null}
    </section>
  );
};

export default AgentApiSettingsPanel;
