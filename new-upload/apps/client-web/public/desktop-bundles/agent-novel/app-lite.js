(() => {
  const nativeFetch = window.fetch.bind(window);
  const fileMode = window.location.protocol === 'file:';

  const STORAGE_KEYS = {
    runtime: 'agent-studio-runtime-config',
    sessions: 'agent-studio-lite-sessions-v1',
    currentSessionId: 'agent-studio-lite-current-session-id',
  };

  const DOMAIN_META = {
    writing: {
      label: '写作',
      hint: '适合小说、续写、章节重写、角色对白与润色。',
      examples: [
        '继续扩写这一章，让冲突更明确，结尾留下钩子。',
        '把这段梗概拆成三幕八场的章节结构。',
        '重写主角和反派的对话，让语气更有区分度。',
      ],
      workflows: {
        single: ['narrative-engine-agent'],
        compose: ['outline-agent', 'narrative-engine-agent', 'polish-agent'],
        harness: ['agent-orchestrator', 'spec-agent', 'outline-agent', 'narrative-engine-agent', 'polish-agent'],
      },
    },
    comics: {
      label: '漫剧',
      hint: '适合故事压缩、分镜、角色视觉统一和图像提示词。',
      examples: [
        '把这个故事压成 8 格分镜，每格写清画面重点。',
        '为主角和反派做统一的视觉提示词方案。',
        '把这段剧情改成短漫画脚本和镜头表。',
      ],
      workflows: {
        single: ['comic-creator-agent'],
        compose: ['script-creator-agent', 'storyboard-agent', 'character-design-agent'],
        harness: ['agent-orchestrator', 'spec-agent', 'script-creator-agent', 'storyboard-agent', 'character-design-agent'],
      },
    },
  };

  const AGENT_LABELS = {
    'agent-orchestrator': '智能体总控',
    'spec-agent': '规格智能体',
    'outline-agent': '大纲智能体',
    'narrative-engine-agent': '叙事引擎智能体',
    'polish-agent': '润色智能体',
    'comic-creator-agent': '漫剧创作智能体',
    'script-creator-agent': '脚本创作智能体',
    'storyboard-agent': '分镜智能体',
    'character-design-agent': '角色设计智能体',
  };

  const MODE_LABELS = { single: '单体', compose: '组合', harness: '编排' };

  const state = {
    isRunning: false,
    activeRun: null,
    preview: null,
    activeSession: null,
    currentSessionId: '',
    sessions: [],
  };
  window.state = state;

  const elements = {
    baseUrlInput: document.getElementById('baseUrlInput'),
    modelInput: document.getElementById('modelInput'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    apiStyleInput: document.getElementById('apiStyleInput'),
    temperatureInput: document.getElementById('temperatureInput'),
    saveRuntimeButton: document.getElementById('saveRuntimeButton'),
    testLlmButton: document.getElementById('testLlmButton'),
    testLlmResult: document.getElementById('testLlmResult'),
    runtimeStatus: document.getElementById('runtimeStatus'),
    domainSelect: document.getElementById('domainSelect'),
    modePills: document.getElementById('modePills'),
    modeSelect: document.getElementById('modeSelect'),
    domainAutoHint: document.getElementById('domainAutoHint'),
    visibleAgentDeck: document.getElementById('visibleAgentDeck'),
    selectionSummary: document.getElementById('selectionSummary'),
    workflowPreview: document.getElementById('workflowPreview'),
    workflowTimeline: document.getElementById('workflowTimeline'),
    insightPanel: document.getElementById('insightPanel'),
    terminalSurface: document.getElementById('terminalSurface'),
    promptInput: document.getElementById('promptInput'),
    chatInput: document.getElementById('chatInput'),
    runButton: document.getElementById('runButton'),
    specButton: document.getElementById('specButton'),
    chatRunButton: document.getElementById('chatRunButton'),
    chatSendButton: document.getElementById('chatSendButton'),
    finalOutput: document.getElementById('finalOutput'),
    specRounds: document.getElementById('specRounds'),
    chatStream: document.getElementById('chatStream'),
    promptMeta: document.getElementById('promptMeta'),
    runMeta: document.getElementById('runMeta'),
    sessionStatus: document.getElementById('sessionStatus'),
    recentRuns: document.getElementById('recentRuns'),
    sessionIdInput: document.getElementById('sessionIdInput'),
    newSessionButton: document.getElementById('newSessionButton'),
    loadSessionButton: document.getElementById('loadSessionButton'),
    copySessionButton: document.getElementById('copySessionButton'),
    clearHistoryButton: document.getElementById('clearHistoryButton'),
    chatSessionCard: document.getElementById('chatSessionCard'),
  };

  function text(value) {
    return String(value ?? '').trim();
  }

  function escapeHtml(value) {
    return text(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }

  function compact(value, maxLength = 120) {
    const content = text(value).replace(/\s+/gu, ' ');
    if (!content) return '';
    if (content.length <= maxLength) return content;
    return `${content.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function makeId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function saveJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function normalizeRuntimeConfig(runtimeConfig = {}) {
    const temperature = Number(runtimeConfig.temperature);
    const safeTemperature = Number.isFinite(temperature) ? temperature : 0.7;
    const baseUrl = text(runtimeConfig.baseUrl || 'https://api.openai.com/v1')
      .replace(/\/+$/u, '')
      .replace(/\/(responses|chat\/completions)$/u, '');

    return {
      baseUrl: baseUrl || 'https://api.openai.com/v1',
      model: text(runtimeConfig.model),
      apiStyle: runtimeConfig.apiStyle === 'chat-completions' ? 'chat-completions' : 'responses',
      temperature: safeTemperature,
      apiKey: text(runtimeConfig.apiKey),
    };
  }

  function canUseDirectLlm(runtimeConfig = {}) {
    const config = normalizeRuntimeConfig(runtimeConfig);
    return Boolean(config.apiKey && config.model && /^https?:\/\//iu.test(config.baseUrl));
  }

  function extractLlmText(payload) {
    const directText = text(payload?.output_text);
    if (directText) return directText;

    const outputItems = Array.isArray(payload?.output) ? payload.output : [];
    for (const item of outputItems) {
      const contentItems = Array.isArray(item?.content) ? item.content : [];
      const joined = contentItems
        .map((entry) => text(entry?.text || entry?.value || entry?.content))
        .filter(Boolean)
        .join('\n\n');
      if (joined) return joined;
    }

    const messageContent = payload?.choices?.[0]?.message?.content;
    if (Array.isArray(messageContent)) {
      const joined = messageContent
        .map((entry) => text(entry?.text || entry?.value || entry?.content))
        .filter(Boolean)
        .join('\n\n');
      if (joined) return joined;
    }

    return text(typeof messageContent === 'string' ? messageContent : '') || text(payload?.choices?.[0]?.text);
  }

  function readTextFragments(value) {
    if (typeof value === 'string') return value;
    if (!value) return '';
    if (Array.isArray(value)) {
      return value
        .map((entry) => readTextFragments(entry?.text || entry?.value || entry?.content || entry))
        .filter(Boolean)
        .join('');
    }
    return text(value?.text || value?.value || value?.content);
  }

  function normalizeHistoryEntry(entry = {}) {
    const role = entry.role === 'assistant' ? 'assistant' : 'user';
    const content = text(entry.content);
    if (!content) return null;
    return {
      id: text(entry.id) || makeId('msg'),
      role,
      content,
      purpose: entry.purpose === 'spec' ? 'spec' : 'run',
      createdAt: text(entry.createdAt) || nowIso(),
    };
  }

  function normalizeConversationHistory(history = [], fallbackSession = null) {
    const normalized = (Array.isArray(history) ? history : []).map(normalizeHistoryEntry).filter(Boolean);
    if (normalized.length) return normalized;

    const fallback = [];
    const prompt = text(fallbackSession?.prompt);
    const latestSpec = text(fallbackSession?.latestSpec);
    const latestOutput = text(fallbackSession?.latestOutput);
    const timestamp = text(fallbackSession?.updatedAt) || nowIso();

    if (prompt) {
      fallback.push({
        id: makeId('msg'),
        role: 'user',
        content: prompt,
        purpose: latestSpec && !latestOutput ? 'spec' : 'run',
        createdAt: timestamp,
      });
    }
    if (latestSpec) {
      fallback.push({
        id: makeId('msg'),
        role: 'assistant',
        content: latestSpec,
        purpose: 'spec',
        createdAt: timestamp,
      });
    }
    if (latestOutput) {
      fallback.push({
        id: makeId('msg'),
        role: 'assistant',
        content: latestOutput,
        purpose: 'run',
        createdAt: timestamp,
      });
    }

    return fallback.map(normalizeHistoryEntry).filter(Boolean);
  }

  function limitConversationHistory(history = [], maxItems = 12, maxChars = 16000) {
    const source = normalizeConversationHistory(history);
    const selected = [];
    let usedChars = 0;

    for (let index = source.length - 1; index >= 0; index -= 1) {
      const item = source[index];
      const nextLength = item.content.length;
      if (selected.length >= maxItems) break;
      if (selected.length && usedChars + nextLength > maxChars) break;
      selected.unshift(item);
      usedChars += nextLength;
    }

    return selected;
  }

  function buildApiMessages(systemPrompt, history, userPrompt) {
    const messages = [];
    if (text(systemPrompt)) {
      messages.push({ role: 'system', content: text(systemPrompt) });
    }
    limitConversationHistory(history).forEach((entry) => {
      messages.push({ role: entry.role, content: entry.content });
    });
    if (text(userPrompt)) {
      messages.push({ role: 'user', content: text(userPrompt) });
    }
    return messages;
  }

  function extractErrorMessage(payload, fallbackText = '') {
    return (
      text(payload?.error?.message) ||
      text(payload?.error) ||
      text(payload?.message) ||
      text(payload?.detail) ||
      fallbackText
    );
  }

  function extractStreamingDelta(payload) {
    const directDelta = text(payload?.delta);
    if (directDelta) return directDelta;

    const choiceDelta = readTextFragments(payload?.choices?.[0]?.delta?.content);
    if (choiceDelta) return choiceDelta;

    const eventDelta = readTextFragments(payload?.output_text?.delta || payload?.output?.delta);
    if (eventDelta) return eventDelta;

    return '';
  }

  async function readEventStream(response, onDelta) {
    const reader = response.body?.getReader?.();
    if (!reader) return { text: '', raw: null, streamed: false };

    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    let finalPayload = null;

    const flushBlock = (block) => {
      const dataLines = [];
      block.split(/\r?\n/gu).forEach((line) => {
        if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
      });
      if (!dataLines.length) return;

      const rawData = dataLines.join('\n').trim();
      if (!rawData || rawData === '[DONE]') return;

      let payload;
      try {
        payload = JSON.parse(rawData);
      } catch {
        return;
      }

      const delta = extractStreamingDelta(payload);
      if (delta) {
        fullText += delta;
        if (typeof onDelta === 'function') onDelta(delta, fullText, payload);
      }

      if (payload?.response) {
        finalPayload = payload.response;
      } else if (payload?.choices || payload?.output || payload?.output_text) {
        finalPayload = payload;
      }
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const blocks = buffer.split(/\r?\n\r?\n/gu);
      buffer = blocks.pop() || '';
      blocks.forEach(flushBlock);
    }

    buffer += decoder.decode();
    if (buffer.trim()) flushBlock(buffer);

    if (!fullText && finalPayload) {
      fullText = extractLlmText(finalPayload);
    }

    return {
      text: fullText,
      raw: finalPayload,
      streamed: true,
    };
  }

  async function invokeDirectLlm({
    runtimeConfig = {},
    systemPrompt = '',
    history = [],
    userPrompt = '',
    onDelta = null,
    stream = false,
  } = {}) {
    const config = normalizeRuntimeConfig(runtimeConfig);
    if (!canUseDirectLlm(config)) {
      throw new Error('请先填写接口地址、模型和接口密钥。');
    }

    const endpoint =
      config.apiStyle === 'chat-completions'
        ? `${config.baseUrl}/chat/completions`
        : `${config.baseUrl}/responses`;

    const messages = buildApiMessages(systemPrompt, history, userPrompt);
    const body =
      config.apiStyle === 'chat-completions'
        ? {
            model: config.model,
            temperature: config.temperature,
            stream: Boolean(stream),
            messages,
          }
        : {
            model: config.model,
            temperature: config.temperature,
            stream: Boolean(stream),
            input: messages.map((message) => ({
              role: message.role,
              content: [{ type: 'input_text', text: message.content }],
            })),
          };

    let response;
    try {
      response = await nativeFetch(endpoint, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify(body),
      });
    } catch (error) {
      throw new Error(
        `浏览器直连请求失败： ${error.message || '请求被阻止'}. 如果服务商拦截 file:// 或空来源的跨域请求，纯静态直连将无法使用。`,
      );
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      let payload = {};
      try {
        payload = errorText ? JSON.parse(errorText) : {};
      } catch {
        payload = { message: errorText };
      }
      const errorMessage = extractErrorMessage(payload, `模型请求失败： ${response.status}`);
      if (stream && /stream/iu.test(errorMessage) && /(unsupported|not support|invalid|unknown|allow)/iu.test(errorMessage)) {
        return invokeDirectLlm({
          runtimeConfig: config,
          systemPrompt,
          history,
          userPrompt,
          onDelta,
          stream: false,
        });
      }
      throw new Error(errorMessage);
    }

    const contentType = String(response.headers.get('content-type') || '').toLowerCase();
    if (stream && contentType.includes('text/event-stream')) {
      const streamed = await readEventStream(response, onDelta);
      if (streamed.text) {
        return {
          text: streamed.text,
          raw: streamed.raw,
          runtimeConfig: config,
          streamed: true,
        };
      }
    }

    const rawText = await response.text().catch(() => '');
    let payload = {};
    try {
      payload = rawText ? JSON.parse(rawText) : {};
    } catch {
      payload = { rawText };
    }

    const output = extractLlmText(payload) || text(payload?.rawText);
    if (!output) {
      throw new Error('模型已经返回响应，但没有提取到可展示文本。');
    }

    if (typeof onDelta === 'function') onDelta(output, output, payload);

    return {
      text: output,
      raw: payload,
      runtimeConfig: config,
      streamed: false,
    };
  }

  function currentDomain() {
    return text(elements.domainSelect?.value) || 'writing';
  }

  function currentMode() {
    const activePill = elements.modePills?.querySelector('[data-mode].is-active');
    return text(activePill?.dataset.mode || elements.modeSelect?.value) || 'harness';
  }

  function localizeDisplayName(value) {
    return AGENT_LABELS[value] || text(value);
  }
  window.localizeDisplayName = localizeDisplayName;

  function buildWorkflow(domainId = currentDomain(), mode = currentMode()) {
    const bundle = DOMAIN_META[domainId] || DOMAIN_META.writing;
    const agentIds = bundle.workflows[mode] || bundle.workflows.harness;
    return agentIds.map((agentId) => ({
      id: agentId,
      displayName: localizeDisplayName(agentId),
    }));
  }

  function activeWorkflowDescriptors() {
    return buildWorkflow();
  }
  window.activeWorkflowDescriptors = activeWorkflowDescriptors;

  function collectRuntimeConfig() {
    return normalizeRuntimeConfig({
      baseUrl: elements.baseUrlInput?.value,
      model: elements.modelInput?.value,
      apiStyle: elements.apiStyleInput?.value,
      temperature: elements.temperatureInput?.value,
      apiKey: elements.apiKeyInput?.value,
    });
  }
  window.collectRuntimeConfig = collectRuntimeConfig;

  function saveStoredConfig() {
    saveJson(STORAGE_KEYS.runtime, collectRuntimeConfig());
    renderRuntimeStatus();
  }
  window.saveStoredConfig = saveStoredConfig;

  function clearStoredSessionId() {
    localStorage.removeItem(STORAGE_KEYS.currentSessionId);
  }
  window.clearStoredSessionId = clearStoredSessionId;

  function setBusy(nextBusy) {
    state.isRunning = Boolean(nextBusy);
    [
      elements.runButton,
      elements.specButton,
      elements.chatRunButton,
      elements.chatSendButton,
      elements.saveRuntimeButton,
      elements.testLlmButton,
    ].forEach((button) => {
      if (button) button.disabled = state.isRunning && button !== elements.saveRuntimeButton && button !== elements.testLlmButton;
    });
    renderRuntimeStatus();
  }
  window.setBusy = setBusy;

  function activePrompt() {
    return text(elements.chatInput?.value) || text(elements.promptInput?.value);
  }

  function serializeSession(session) {
    return {
      id: session.id,
      title: session.title,
      updatedAt: session.updatedAt,
      turnCount: session.turnCount || 0,
      runCount: session.runCount || 0,
      prompt: session.prompt || '',
      latestOutput: session.latestOutput || '',
      latestSpec: session.latestSpec || '',
      history: normalizeConversationHistory(session.history, session),
      domain: session.domain || currentDomain(),
      mode: session.mode || currentMode(),
    };
  }

  function persistSessions() {
    saveJson(STORAGE_KEYS.sessions, state.sessions.map(serializeSession));
    if (state.currentSessionId) {
      localStorage.setItem(STORAGE_KEYS.currentSessionId, state.currentSessionId);
    }
  }

  function applySession(session) {
    state.activeSession = session || null;
    state.currentSessionId = session?.id || '';
    if (elements.sessionIdInput) elements.sessionIdInput.value = state.currentSessionId;
    if (elements.promptInput && session?.prompt) elements.promptInput.value = session.prompt;
    if (elements.chatInput) elements.chatInput.value = '';
    renderRecentRuns();
    renderSessionCard();
    renderRuntimeStatus();
  }
  window.applySession = applySession;

  function resetSurface() {
    state.activeRun = null;
    state.preview = null;
    renderFinalOutput('');
    renderSpecResult(null);
  }
  window.resetSurface = resetSurface;

  function syncPromptMeta() {
    const prompt = activePrompt();
    if (elements.promptMeta) {
      elements.promptMeta.textContent = prompt ? `${prompt.length} 字` : '暂无任务';
    }
  }
  window.syncPromptMeta = syncPromptMeta;

  function renderFinalOutput(value) {
    const content = text(value);
    if (elements.finalOutput) elements.finalOutput.textContent = content || '结果会显示在这里。';
    if (elements.chatStream) elements.chatStream.textContent = content || '选择会话或输入任务后开始。';
    if (elements.runMeta) {
      elements.runMeta.textContent = state.isRunning
        ? content
          ? `流式输出中... ${compact(content, 96)}`
          : '流式输出中...'
        : content
          ? `${compact(content, 96)}`
          : '等待运行输出';
    }
  }
  window.renderFinalOutput = renderFinalOutput;

  function renderSpecResult(preview) {
    if (!elements.specRounds) return;
    if (!preview?.specPack?.masterSpec) {
      elements.specRounds.innerHTML = '<div class="micro-note">规格预览会显示在这里。</div>';
      return;
    }
    const rounds = Array.isArray(preview.specPack.rounds) ? preview.specPack.rounds : [];
    elements.specRounds.innerHTML = `
      <article class="spec-round">
        <strong>主规格说明</strong>
        <pre>${escapeHtml(preview.specPack.masterSpec)}</pre>
      </article>
      ${rounds
        .map(
          (round) => `
            <article class="spec-round">
              <strong>${escapeHtml(round.title || '轮次')}</strong>
              <p>${escapeHtml(round.summary || '')}</p>
            </article>
          `,
        )
        .join('')}
    `;
  }

  function renderRuntimeStatus() {
    const runtime = collectRuntimeConfig();
    const label = canUseDirectLlm(runtime)
      ? `${runtime.apiStyle === 'chat-completions' ? '聊天补全' : '响应接口'} · ${runtime.model}`
      : '填写接口地址、模型和密钥后可直连模型';
    if (elements.runtimeStatus) elements.runtimeStatus.textContent = label;
    if (elements.testLlmResult) {
      elements.testLlmResult.textContent = state.isRunning
        ? '运行中...'
        : canUseDirectLlm(runtime)
          ? '浏览器直连已就绪'
          : '尚未配置直连';
    }
    if (elements.sessionStatus) {
      elements.sessionStatus.textContent = state.currentSessionId || '暂无活跃会话';
    }
  }
  window.renderRuntimeStatus = renderRuntimeStatus;

  function renderRecentRuns() {
    if (!elements.recentRuns) return;
    if (!state.sessions.length) {
      elements.recentRuns.textContent = '暂无会话';
      return;
    }
    elements.recentRuns.innerHTML = state.sessions
      .slice()
      .sort((left, right) => String(right.updatedAt || '').localeCompare(String(left.updatedAt || '')))
      .slice(0, 12)
      .map(
        (session) => `
          <button class="session-chip${session.id === state.currentSessionId ? ' is-active' : ''}" type="button" data-session-id="${escapeHtml(
            session.id,
          )}">
            ${escapeHtml(compact(session.title || session.prompt || session.id, 44))}
          </button>
        `,
      )
      .join('');

    elements.recentRuns.querySelectorAll('[data-session-id]').forEach((button) => {
      button.addEventListener('click', () => {
        const session = state.sessions.find((item) => item.id === button.dataset.sessionId) || null;
        applySession(session);
        if (session?.latestOutput || session?.latestSpec) renderFinalOutput(session.latestOutput || session.latestSpec);
        if (session?.latestSpec) {
          renderSpecResult({
            specPack: {
              masterSpec: session.latestSpec,
              rounds: [{ title: '已保存规格', summary: compact(session.latestSpec, 160) }],
            },
          });
        }
      });
    });
  }
  window.renderRecentRuns = renderRecentRuns;

  function renderSessionCard() {
    if (!elements.chatSessionCard) return;
    if (!state.activeSession) {
      elements.chatSessionCard.innerHTML = '<strong>暂无活跃会话</strong><p>新建一个会话，或直接输入任务开始。</p>';
      return;
    }
    elements.chatSessionCard.innerHTML = `
      <strong>${escapeHtml(state.activeSession.title || state.activeSession.id)}</strong>
      <p>${escapeHtml(`${state.activeSession.turnCount || 0} 轮对话 / ${state.activeSession.runCount || 0} 次运行`)}</p>
    `;
  }

  function renderWorkflow() {
    const domainId = currentDomain();
    const mode = currentMode();
    const bundle = DOMAIN_META[domainId] || DOMAIN_META.writing;
    const workflow = buildWorkflow(domainId, mode);

    if (elements.domainAutoHint) elements.domainAutoHint.textContent = bundle.hint;
    if (elements.visibleAgentDeck) {
      elements.visibleAgentDeck.innerHTML = workflow
        .map(
          (agent) => `
            <article class="selector-card">
              <strong>${escapeHtml(agent.displayName)}</strong>
              <span class="micro-note">${escapeHtml(agent.id)}</span>
            </article>
          `,
        )
        .join('');
    }
    if (elements.selectionSummary) {
      elements.selectionSummary.textContent = `${bundle.label} · ${MODE_LABELS[mode] || mode} · ${workflow.length} 个智能体`;
    }
    if (elements.workflowPreview) {
      elements.workflowPreview.innerHTML = workflow
        .map((agent, index) => `<span>${index + 1}. ${escapeHtml(agent.displayName)}</span>`)
        .join('<br />');
    }
    if (elements.workflowTimeline) {
      elements.workflowTimeline.innerHTML = workflow
        .map((agent, index) => `<div class="timeline-item">${index + 1}. ${escapeHtml(agent.displayName)}</div>`)
        .join('');
    }
    if (elements.insightPanel) {
      elements.insightPanel.innerHTML = bundle.examples
        .map((example) => `<button class="button button-ghost" type="button" data-example="${escapeHtml(example)}">${escapeHtml(example)}</button>`)
        .join('');
      elements.insightPanel.querySelectorAll('[data-example]').forEach((button) => {
        button.addEventListener('click', () => {
          if (elements.promptInput) elements.promptInput.value = button.dataset.example || '';
          syncPromptMeta();
        });
      });
    }
    if (elements.terminalSurface) {
      elements.terminalSurface.textContent = `领域：${bundle.label}\n模式：${MODE_LABELS[mode] || mode}\n工作流：${workflow
        .map((item) => item.displayName)
        .join(' -> ')}`;
    }
  }

  function upsertSession(nextSession) {
    const index = state.sessions.findIndex((item) => item.id === nextSession.id);
    if (index >= 0) {
      state.sessions[index] = nextSession;
    } else {
      state.sessions.push(nextSession);
    }
    persistSessions();
    applySession(nextSession);
  }

  function requestPortableLocalApi(path, init = {}) {
    if (typeof window.__AGENT_STUDIO_LOCAL_API__ === 'function') {
      return window.__AGENT_STUDIO_LOCAL_API__(new URL(path, 'https://offline.agent.studio'), init);
    }
    return fetch(path, init);
  }

  function buildNextConversationHistory(prompt, reply, purpose) {
    return [
      ...normalizeConversationHistory(state.activeSession?.history, state.activeSession),
      normalizeHistoryEntry({
        role: 'user',
        content: prompt,
        purpose,
        createdAt: nowIso(),
      }),
      normalizeHistoryEntry({
        role: 'assistant',
        content: reply,
        purpose,
        createdAt: nowIso(),
      }),
    ].filter(Boolean);
  }

  function buildRunMessages(prompt, purpose) {
    const domainId = currentDomain();
    const mode = currentMode();
    const bundle = DOMAIN_META[domainId] || DOMAIN_META.writing;
    const workflow = buildWorkflow(domainId, mode);
    const history = normalizeConversationHistory(state.activeSession?.history, state.activeSession);

    const systemPrompt =
      purpose === 'spec'
        ? `你是${bundle.label}领域的规划助手。当前模式：${MODE_LABELS[mode] || mode}。当前工作流：${workflow
            .map((item) => item.displayName)
            .join(' -> ')}。如果相关，请延续此前对话上下文。请输出一份精炼、可执行的中文规格说明。`
        : `你是${bundle.label}领域的生产助手。当前模式：${MODE_LABELS[mode] || mode}。当前工作流：${workflow
            .map((item) => item.displayName)
            .join(' -> ')}。如果相关，请延续此前对话上下文。请用中文回复一份润色后、可直接使用的结果。`;

    const userPrompt = purpose === 'spec' ? `[规格请求]\n${prompt}` : prompt;

    return { systemPrompt, history, userPrompt, workflow };
  }

  async function buildSpecResult(payload, options = {}) {
    const prompt = text(payload.prompt);
    const runtimeConfig = normalizeRuntimeConfig(payload.runtimeConfig || collectRuntimeConfig());
    if (!canUseDirectLlm(runtimeConfig)) {
      throw new Error('请先填写你自己的接口地址、模型和接口密钥，再生成规格说明。');
    }

    const { systemPrompt, history, userPrompt, workflow } = buildRunMessages(prompt, 'spec');
    const llmResult = await invokeDirectLlm({
      runtimeConfig,
      systemPrompt,
      history,
      userPrompt,
      onDelta: options.onDelta,
      stream: Boolean(options.stream),
    });
    const masterSpec = llmResult.text;
    const nextHistory = buildNextConversationHistory(prompt, masterSpec, 'spec');
    const preview = {
      prompt,
      workflow,
      specPack: {
        rounds: [{ title: '直连规格', summary: compact(masterSpec, 160) }],
        masterSpec,
      },
      llm: {
        usedLlm: true,
        model: llmResult.runtimeConfig.model,
        baseUrl: llmResult.runtimeConfig.baseUrl,
        apiStyle: llmResult.runtimeConfig.apiStyle,
      },
    };

    const session = {
      id: state.currentSessionId || makeId('session'),
      title: compact(prompt || '规格会话', 60),
      updatedAt: nowIso(),
      turnCount: Number(state.activeSession?.turnCount || 0) + 1,
      runCount: Number(state.activeSession?.runCount || 0),
      prompt,
      latestOutput: state.activeSession?.latestOutput || '',
      latestSpec: masterSpec,
      history: nextHistory,
      domain: currentDomain(),
      mode: currentMode(),
    };

    state.preview = preview;
    upsertSession(session);
    return preview;
  }

  async function buildRunResult(payload, options = {}) {
    const prompt = text(payload.prompt);
    const runtimeConfig = normalizeRuntimeConfig(payload.runtimeConfig || collectRuntimeConfig());
    if (!canUseDirectLlm(runtimeConfig)) {
      throw new Error('请先填写你自己的接口地址、模型和接口密钥，再开始运行。');
    }

    const { systemPrompt, history, userPrompt, workflow } = buildRunMessages(prompt, 'run');
    const llmResult = await invokeDirectLlm({
      runtimeConfig,
      systemPrompt,
      history,
      userPrompt,
      onDelta: options.onDelta,
      stream: Boolean(options.stream),
    });
    const output = llmResult.text;
    const nextHistory = buildNextConversationHistory(prompt, output, 'run');
    const run = {
      id: makeId('run'),
      createdAt: nowIso(),
      prompt,
      workflow,
      finalOutput: output,
      warnings: ['浏览器直连模式：接口密钥只保存在当前设备的本地存储中。'],
      llm: {
        usedLlm: true,
        model: llmResult.runtimeConfig.model,
        baseUrl: llmResult.runtimeConfig.baseUrl,
        apiStyle: llmResult.runtimeConfig.apiStyle,
      },
    };

    const session = {
      id: state.currentSessionId || makeId('session'),
      title: compact(prompt || '运行会话', 60),
      updatedAt: nowIso(),
      turnCount: Number(state.activeSession?.turnCount || 0) + 1,
      runCount: Number(state.activeSession?.runCount || 0) + 1,
      prompt,
      latestOutput: output,
      latestSpec: state.activeSession?.latestSpec || '',
      history: nextHistory,
      domain: currentDomain(),
      mode: currentMode(),
    };

    state.activeRun = run;
    state.preview = null;
    upsertSession(session);
    return {
      ...run,
      session,
      sessionId: session.id,
    };
  }

  function jsonResponse(payload, status = 200) {
    return new Response(JSON.stringify(payload), {
      status,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  function parseBody(init) {
    try {
      return JSON.parse(String(init?.body || '{}'));
    } catch {
      return {};
    }
  }

  async function handleLocalApi(url, init = {}) {
    const method = String(init.method || 'GET').toUpperCase();

    if (method === 'POST' && url.pathname === '/api/llm/test') {
      const payload = parseBody(init);
      const runtimeConfig = normalizeRuntimeConfig(payload.runtimeConfig || collectRuntimeConfig());
      if (!canUseDirectLlm(runtimeConfig)) {
        return jsonResponse({ ok: false, error: '请先填写接口地址、模型和接口密钥。' }, 400);
      }
      try {
        const llmResult = await invokeDirectLlm({
          runtimeConfig,
          systemPrompt: '你是连通性测试助手。请用中文自然、简短地回应用户问候。',
          userPrompt: '你好',
        });
        return jsonResponse({
          ok: true,
          preview: compact(llmResult.text, 160),
          response: llmResult.text,
          usedLlm: true,
          model: llmResult.runtimeConfig.model,
          baseUrl: llmResult.runtimeConfig.baseUrl,
          apiStyle: llmResult.runtimeConfig.apiStyle,
        });
      } catch (error) {
        return jsonResponse({ ok: false, error: error.message || '模型测试失败' }, 400);
      }
    }

    if (method === 'POST' && url.pathname === '/api/spec') {
      try {
        return jsonResponse(await buildSpecResult(parseBody(init)));
      } catch (error) {
        return jsonResponse({ error: error.message || '规格生成失败' }, 400);
      }
    }

    if (method === 'POST' && url.pathname === '/api/run') {
      try {
        return jsonResponse(await buildRunResult(parseBody(init)));
      } catch (error) {
        return jsonResponse({ error: error.message || 'Run failed' }, 400);
      }
    }

    if (method === 'POST' && url.pathname === '/api/history/clear') {
      const clearedSessions = state.sessions.length;
      state.sessions = [];
      state.currentSessionId = '';
      state.activeRun = null;
      state.preview = null;
      state.activeSession = null;
      localStorage.removeItem(STORAGE_KEYS.sessions);
      localStorage.removeItem(STORAGE_KEYS.currentSessionId);
      renderRecentRuns();
      renderSessionCard();
      renderFinalOutput('');
      renderSpecResult(null);
      renderRuntimeStatus();
      return jsonResponse({ ok: true, clearedSessions, clearedRuns: clearedSessions });
    }

    return jsonResponse({ error: `不支持的本地接口： ${method} ${url.pathname}` }, 404);
  }

  window.__AGENT_STUDIO_LOCAL_API__ = handleLocalApi;

  if (fileMode) {
    window.fetch = function localFetch(input, init = {}) {
      const rawUrl = typeof input === 'string' ? input : input?.url || '';
      if (typeof rawUrl === 'string' && rawUrl.startsWith('/api/')) {
        const url = new URL(rawUrl, 'https://offline.agent.studio');
        return Promise.resolve(handleLocalApi(url, init));
      }
      return nativeFetch(input, init);
    };
  }

  async function requestAndRender(purpose) {
    const prompt = activePrompt();
    if (!prompt) {
      renderFinalOutput('请先输入任务。');
      return;
    }

    setBusy(true);
    const runtimeConfig = collectRuntimeConfig();
    const workflow = buildWorkflow();
    const basePayload = {
      prompt,
      domain: currentDomain(),
      mode: currentMode(),
      sessionId: state.currentSessionId,
      runtimeConfig,
    };

    if (purpose === 'spec') {
      state.preview = {
        prompt,
        workflow,
        specPack: {
          rounds: [{ title: '流式规格', summary: '生成中...' }],
          masterSpec: '',
        },
      };
      state.activeRun = null;
    } else {
      state.activeRun = {
        id: makeId('run-live'),
        createdAt: nowIso(),
        prompt,
        workflow,
        finalOutput: '',
        warnings: ['浏览器直连模式正在流式输出。'],
        agentRuntime: { phase: 'streaming' },
      };
      state.preview = null;
    }
    renderFinalOutput('');
    renderRuntimeStatus();
    renderWorkflow();

    try {
      const onDelta = (_delta, fullText) => {
        renderFinalOutput(fullText);
        if (purpose === 'spec') {
          state.preview = {
            ...(state.preview || {}),
            prompt,
            workflow,
            specPack: {
              rounds: [{ title: '流式规格', summary: compact(fullText, 160) || '生成中...' }],
              masterSpec: fullText,
            },
          };
        } else if (state.activeRun) {
          state.activeRun.finalOutput = fullText;
        }
      };

      const payload =
        purpose === 'spec'
          ? await buildSpecResult(basePayload, { onDelta, stream: true })
          : await buildRunResult(basePayload, { onDelta, stream: true });

      if (purpose === 'spec') {
        state.preview = payload;
        renderSpecResult(payload);
        renderFinalOutput(payload.specPack?.masterSpec || '');
      } else {
        state.activeRun = payload;
        renderFinalOutput(payload.finalOutput || '');
      }
      renderRuntimeStatus();
      renderWorkflow();
    } catch (error) {
      const partial = text(elements.chatStream?.textContent || elements.finalOutput?.textContent);
      renderFinalOutput(partial ? `${partial}\n\n[错误]\n${error.message || '请求失败'}` : error.message || '请求失败');
    } finally {
      setBusy(false);
    }
  }

  function restoreRuntimeConfig() {
    const stored = normalizeRuntimeConfig(loadJson(STORAGE_KEYS.runtime, {}));
    if (elements.baseUrlInput) elements.baseUrlInput.value = stored.baseUrl;
    if (elements.modelInput) elements.modelInput.value = stored.model;
    if (elements.apiKeyInput) elements.apiKeyInput.value = stored.apiKey;
    if (elements.apiStyleInput) elements.apiStyleInput.value = stored.apiStyle;
    if (elements.temperatureInput) elements.temperatureInput.value = String(stored.temperature);
  }

  function restoreSessions() {
    state.sessions = loadJson(STORAGE_KEYS.sessions, []).map((session) => ({
      ...session,
      history: normalizeConversationHistory(session.history, session),
    }));
    state.currentSessionId = text(localStorage.getItem(STORAGE_KEYS.currentSessionId));
    state.activeSession = state.sessions.find((item) => item.id === state.currentSessionId) || null;
    if (elements.sessionIdInput) elements.sessionIdInput.value = state.currentSessionId;
  }

  function renderModePills() {
    if (!elements.modePills) return;
    const modes = ['single', 'compose', 'harness'];
    
    elements.modePills.innerHTML = modes
      .map(
        (mode) => `
          <button class="mode-pill${mode === currentMode() ? ' is-active' : ''}" data-mode="${mode}" type="button">${escapeHtml(MODE_LABELS[mode] || mode)}</button>
        `,
      )
      .join('');

    elements.modePills.querySelectorAll('[data-mode]').forEach((button) => {
      button.addEventListener('click', () => {
        elements.modeSelect.value = button.dataset.mode || 'harness';
        renderModePills();
        renderWorkflow();
        renderRuntimeStatus();
      });
    });
  }

  function populateDomains() {
    if (!elements.domainSelect) return;
    elements.domainSelect.innerHTML = Object.entries(DOMAIN_META)
      .map(([id, meta]) => `<option value="${id}">${escapeHtml(meta.label)}</option>`)
      .join('');
    elements.domainSelect.value = state.activeSession?.domain || 'writing';
  }

  function bindUi() {
    elements.saveRuntimeButton?.addEventListener('click', () => saveStoredConfig());
    elements.testLlmButton?.addEventListener('click', async () => {
      try {
        const response = await requestPortableLocalApi('/api/llm/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({ runtimeConfig: collectRuntimeConfig() }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || payload.ok === false) {
          throw new Error(payload.error || '模型测试失败');
        }
        if (elements.testLlmResult) elements.testLlmResult.textContent = compact(payload.preview || payload.response, 140);
      } catch (error) {
        if (elements.testLlmResult) elements.testLlmResult.textContent = compact(error.message || '模型测试失败', 140);
      }
      renderRuntimeStatus();
    });

    elements.domainSelect?.addEventListener('change', () => {
      renderWorkflow();
      renderRuntimeStatus();
    });
    elements.modeSelect?.addEventListener('change', () => {
      renderModePills();
      renderWorkflow();
      renderRuntimeStatus();
    });
    elements.promptInput?.addEventListener('input', syncPromptMeta);
    elements.chatInput?.addEventListener('input', syncPromptMeta);
    elements.runButton?.addEventListener('click', () => requestAndRender('run'));
    elements.chatRunButton?.addEventListener('click', () => requestAndRender('run'));
    elements.specButton?.addEventListener('click', () => requestAndRender('spec'));
    elements.chatSendButton?.addEventListener('click', () => {
      if (elements.chatInput && elements.promptInput && text(elements.chatInput.value)) {
        elements.promptInput.value = text(elements.chatInput.value);
        syncPromptMeta();
        requestAndRender('run');
      }
    });
    elements.newSessionButton?.addEventListener('click', () => {
      state.currentSessionId = '';
      state.activeSession = null;
      if (elements.sessionIdInput) elements.sessionIdInput.value = '';
      if (elements.promptInput) elements.promptInput.value = '';
      if (elements.chatInput) elements.chatInput.value = '';
      resetSurface();
      renderRecentRuns();
      renderSessionCard();
      renderRuntimeStatus();
    });
    elements.loadSessionButton?.addEventListener('click', () => {
      const sessionId = text(elements.sessionIdInput?.value);
      const session = state.sessions.find((item) => item.id === sessionId) || null;
      applySession(session);
      if (session?.latestOutput || session?.latestSpec) renderFinalOutput(session.latestOutput || session.latestSpec);
      if (session?.latestSpec) {
        renderSpecResult({
          specPack: {
            masterSpec: session.latestSpec,
            rounds: [{ title: '已保存规格', summary: compact(session.latestSpec, 160) }],
          },
        });
      }
    });
    elements.copySessionButton?.addEventListener('click', async () => {
      const sessionId = text(elements.sessionIdInput?.value || state.currentSessionId);
      if (!sessionId) return;
      try {
        await navigator.clipboard.writeText(sessionId);
      } catch {}
    });
    elements.clearHistoryButton?.addEventListener('click', async () => {
      await requestPortableLocalApi('/api/history/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({}),
      });
    });
  }

  function init() {
    restoreRuntimeConfig();
    restoreSessions();
    populateDomains();
    if (elements.modeSelect) elements.modeSelect.value = state.activeSession?.mode || 'harness';
    renderModePills();
    renderWorkflow();
    renderRecentRuns();
    renderSessionCard();
    renderRuntimeStatus();
    renderSpecResult(null);
    renderFinalOutput(state.activeSession?.latestOutput || state.activeSession?.latestSpec || '');
    syncPromptMeta();
    bindUi();
  }

  document.addEventListener('DOMContentLoaded', init, { once: true });
})();
