(function () {
  const panelState = {
    testing: false,
    lastTestOk: null,
    lastTestText: '',
  };

  function text(value) {
    return String(value || '').trim();
  }

  function apiStyleLabel(value) {
    return value === 'chat-completions' ? '聊天补全接口' : '响应接口';
  }

  function compact(value, maxLength) {
    const content = text(value).replace(/\s+/gu, ' ');
    if (!content) return '';
    if (content.length <= maxLength) return content;
    return `${content.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
  }

  function escapeHtml(value) {
    return text(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }

  function safeCollectRuntimeConfig() {
    try {
      if (typeof collectRuntimeConfig === 'function') return collectRuntimeConfig();
    } catch {}

    return {
      baseUrl: text(document.getElementById('baseUrlInput')?.value),
      model: text(document.getElementById('modelInput')?.value),
      apiStyle: document.getElementById('apiStyleInput')?.value || 'responses',
      temperature: Number(document.getElementById('temperatureInput')?.value || 0.4),
      apiKey: text(document.getElementById('apiKeyInput')?.value),
    };
  }

  function getWorkflowAgents() {
    try {
      if (typeof activeWorkflowDescriptors === 'function') return activeWorkflowDescriptors() || [];
    } catch {}
    return [];
  }

  function localizeAgentName(value) {
    try {
      if (typeof localizeDisplayName === 'function') return localizeDisplayName(value);
    } catch {}
    return text(value);
  }

  function requestLocalAwareApi(path, init = {}) {
    if (window.location.protocol === 'file:' && typeof window.__AGENT_STUDIO_LOCAL_API__ === 'function') {
      return window.__AGENT_STUDIO_LOCAL_API__(new URL(path, 'https://offline.agent.studio'), init);
    }
    return fetch(path, init);
  }

  function flashButton(button, successText, fallbackText, task) {
    if (!button) return Promise.resolve();
    const original = button.textContent;

    return Promise.resolve()
      .then(task)
      .then(() => {
        button.textContent = successText;
      })
      .catch((error) => {
        button.textContent = fallbackText;
        throw error;
      })
      .finally(() => {
        window.setTimeout(() => {
          button.textContent = original;
        }, 1200);
      });
  }

  function ensureQuickActions() {
    const toolsBody = document.querySelector('.session-tools-body');
    const apiGrid = toolsBody?.querySelector('.api-grid');
    if (!toolsBody || !apiGrid || document.getElementById('saveConfigButton')) return;

    const quickActions = document.createElement('div');
    quickActions.className = 'runtime-quick-actions';
    quickActions.innerHTML = `
      <button id="saveConfigButton" class="button button-ghost" type="button">保存设置</button>
      <button id="testConfigButton" class="button button-secondary" type="button">测试接口</button>
    `;

    apiGrid.insertAdjacentElement('afterend', quickActions);

    const saveButton = document.getElementById('saveConfigButton');
    const testButton = document.getElementById('testConfigButton');

    saveButton?.addEventListener('click', () => {
      flashButton(saveButton, '已保存', '保存失败', async () => {
        if (typeof saveStoredConfig === 'function') saveStoredConfig();
        if (typeof renderRuntimeStatus === 'function') renderRuntimeStatus();
        panelState.lastTestText = '本地配置已保存';
      }).catch(() => {});
    });

    testButton?.addEventListener('click', async () => {
      if (panelState.testing) return;

      panelState.testing = true;
      panelState.lastTestText = '正在测试当前接口配置...';
      updateObserver();

      try {
        await flashButton(testButton, '测试成功', '测试失败', async () => {
          const response = await requestLocalAwareApi('/api/llm/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify({ runtimeConfig: safeCollectRuntimeConfig() }),
          });

          const payload = await response.json().catch(() => ({}));
          if (!response.ok || payload.ok === false) {
            throw new Error(payload.error || `测试失败：${response.status}`);
          }

          panelState.lastTestOk = true;
          panelState.lastTestText = compact(payload.preview || '接口测试成功', 72);
        });
      } catch (error) {
        panelState.lastTestOk = false;
        panelState.lastTestText = compact(error.message || '接口测试失败', 72);
        if (typeof renderFinalOutput === 'function') {
          renderFinalOutput(error.message || '接口测试失败');
        }
      } finally {
        panelState.testing = false;
        if (typeof renderRuntimeStatus === 'function') renderRuntimeStatus();
        updateObserver();
      }
    });
  }

  function ensureObserver() {
    const taskProcessPanel = document.getElementById('taskProcessPanel');
    const chatStream = document.getElementById('chatStream');
    const observerAnchor = taskProcessPanel || chatStream;
    if (!observerAnchor || document.getElementById('runtimeObserver')) return;

    const observer = document.createElement('section');
    observer.id = 'runtimeObserver';
    observer.className = 'runtime-observer';
    observer.innerHTML = `
      <div class="runtime-observer-head">
        <strong class="runtime-observer-title">运行状态</strong>
        <span id="runtimeObserverNote" class="runtime-observer-note">等待任务</span>
      </div>
      <div class="runtime-observer-grid">
        <article class="runtime-card">
          <span class="runtime-card-label">思考中</span>
          <strong id="runtimeThinkingValue" class="runtime-card-value">待命</strong>
          <span id="runtimeThinkingCopy" class="runtime-card-copy">还没有开始执行</span>
        </article>
        <article class="runtime-card">
          <span class="runtime-card-label">任务进度</span>
          <strong id="runtimeProgressValue" class="runtime-card-value">0 步</strong>
          <div class="runtime-progress-track">
            <div id="runtimeProgressFill" class="runtime-progress-fill" style="width: 0%"></div>
          </div>
          <span id="runtimeProgressCopy" class="runtime-card-copy">等待你发送任务</span>
        </article>
        <article class="runtime-card">
          <span class="runtime-card-label">调用工具</span>
          <strong id="runtimeToolValue" class="runtime-card-value">本地模拟</strong>
          <div id="runtimeToolChips" class="runtime-chip-row"></div>
          <span id="runtimeToolCopy" class="runtime-card-copy">当前还没有发起接口调用</span>
        </article>
        <article class="runtime-card">
          <span class="runtime-card-label">调用智能体</span>
          <strong id="runtimeAgentValue" class="runtime-card-value">0 个</strong>
          <div id="runtimeAgentChips" class="runtime-chip-row"></div>
          <span id="runtimeAgentCopy" class="runtime-card-copy">等待生成工作流</span>
        </article>
      </div>
    `;

    observerAnchor.insertAdjacentElement('afterend', observer);
  }

  function renderChips(container, values, mutedLabel) {
    if (!container) return;
    const list = (values || []).filter(Boolean);
    if (!list.length) {
      container.innerHTML = `<span class="runtime-chip is-muted">${escapeHtml(mutedLabel)}</span>`;
      return;
    }

    container.innerHTML = list.map((item) => `<span class="runtime-chip">${escapeHtml(item)}</span>`).join('');
  }

  function updateObserver() {
    ensureQuickActions();
    ensureObserver();

    const observer = document.getElementById('runtimeObserver');
    if (!observer) return;

    const runtimeConfig = safeCollectRuntimeConfig();
    const workflow = getWorkflowAgents();
    const activeRun = typeof state !== 'undefined' ? state.activeRun : null;
    const preview = typeof state !== 'undefined' ? state.preview : null;
    const activeSession = typeof state !== 'undefined' ? state.activeSession : null;
    const routing = activeRun?.routing || preview?.routing || null;
    const agentRuntime = activeRun?.agentRuntime || preview?.agentRuntime || activeSession?.agentRuntime || null;
    const isRunning = typeof state !== 'undefined' ? Boolean(state.isRunning) : false;

    const thinkingValue = document.getElementById('runtimeThinkingValue');
    const thinkingCopy = document.getElementById('runtimeThinkingCopy');
    const progressValue = document.getElementById('runtimeProgressValue');
    const progressCopy = document.getElementById('runtimeProgressCopy');
    const progressFill = document.getElementById('runtimeProgressFill');
    const toolValue = document.getElementById('runtimeToolValue');
    const toolCopy = document.getElementById('runtimeToolCopy');
    const toolChips = document.getElementById('runtimeToolChips');
    const agentValue = document.getElementById('runtimeAgentValue');
    const agentCopy = document.getElementById('runtimeAgentCopy');
    const agentChips = document.getElementById('runtimeAgentChips');
    const observerNote = document.getElementById('runtimeObserverNote');

    let status = '待命';
    let statusCopy = '还没有开始执行';
    let progressText = workflow.length ? `预计 ${workflow.length} 步` : '0 步';
    let progressDetail = '等待你发送任务';
    let progressPercent = 0;

    if (panelState.testing) {
      status = '测试中';
      statusCopy = '正在验证当前接口是否可用';
      progressText = '接口检测';
      progressDetail = '正在发起一轮最小请求';
      progressPercent = 35;
    } else if (isRunning) {
      status = '思考中';
      statusCopy = workflow.length ? `编排正在推进，预计 ${workflow.length} 个步骤` : '编排正在准备执行';
      progressText = workflow.length ? `执行中 · ${workflow.length} 步` : '执行中';
      progressDetail = routing?.matchedKeywords?.length
        ? `已命中关键词：${compact(routing.matchedKeywords.join('、'), 36)}`
        : '请求已经发出，正在等待结果返回';
      progressPercent = workflow.length ? 48 : 30;
    } else if (activeRun) {
      const completed = activeRun.workflow?.length || workflow.length || 0;
      status = activeRun.warnings?.length ? '已完成 · 有警告' : '已完成';
      statusCopy = activeRun.warnings?.length
        ? compact(activeRun.warnings.join(' / '), 72)
        : '本轮执行已经返回结果';
      progressText = `${completed}/${completed || 0} 步`;
      progressDetail = routing?.consideredAgentCount
        ? `已从 ${routing.consideredAgentCount} 个候选智能体中完成路由`
        : completed
          ? `工作流 ${completed} 个步骤已完成`
          : '本轮任务已完成';
      progressPercent = completed ? 100 : 90;
    } else if (preview) {
      const planned = preview.workflow?.length || workflow.length || 0;
      status = '已规划';
      statusCopy = '规格说明已生成，可以继续正式运行';
      progressText = planned ? `已规划 ${planned} 步` : '已生成规格说明';
      progressDetail = routing?.matchedKeywords?.length
        ? `关键词触发：${compact(routing.matchedKeywords.join('、'), 36)}`
        : '当前是预览阶段，还没有执行最终输出';
      progressPercent = planned ? 62 : 55;
    } else if (panelState.lastTestText) {
      status = panelState.lastTestOk ? '接口可用' : '接口异常';
      statusCopy = panelState.lastTestText;
    }

    const usingLiveLlm = Boolean(activeRun?.llm?.usedLlm || (runtimeConfig.apiKey && runtimeConfig.model));
    const poolCounts = agentRuntime?.pools?.counts || {};
    const styleLabel = apiStyleLabel(activeRun?.llm?.apiStyle || runtimeConfig.apiStyle);
    const toolMain = usingLiveLlm ? styleLabel : '本地模拟';
    const toolDetail = panelState.lastTestText
      ? panelState.lastTestText
      : usingLiveLlm
        ? `当前使用 ${styleLabel} 调用 ${runtimeConfig.model || activeRun?.llm?.model || '模型'}`
        : '未配置直连时会走本地模拟结果';

    const toolChipValues = usingLiveLlm
      ? ['网络请求', styleLabel, runtimeConfig.model || activeRun?.llm?.model || '模型']
      : ['模拟', '无外部接口'];

    if (agentRuntime && Array.isArray(toolChipValues)) {
      toolChipValues.push(...(agentRuntime.capabilities?.previewModes || []).slice(0, 3));
      if (agentRuntime.capabilities?.terminal) toolChipValues.push('终端');
      if (agentRuntime.capabilities?.sandbox) toolChipValues.push('沙盒');
    }

    const agentNames = workflow.map((agent) => localizeAgentName(agent.displayName || agent.id));
    const routedAgentNames = (routing?.triggeredAgents || [])
      .map((item) => {
        const match = workflow.find((agent) => agent.id === item.id);
        return localizeAgentName(match?.displayName || item.id);
      })
      .filter(Boolean);
    const visibleAgents = (routedAgentNames.length ? routedAgentNames : agentNames).slice(0, 5);
    const totalAgents = routedAgentNames.length || agentNames.length;
    if (totalAgents > 5) visibleAgents.push(`+${totalAgents - 5}`);

    if (thinkingValue) thinkingValue.textContent = status;
    if (thinkingCopy) thinkingCopy.textContent = statusCopy;
    if (progressValue) progressValue.textContent = progressText;
    if (progressCopy) progressCopy.textContent = progressDetail;
    if (progressFill) progressFill.style.width = `${Math.max(0, Math.min(100, progressPercent))}%`;
    if (toolValue) toolValue.textContent = toolMain;
    if (toolCopy) {
      toolCopy.textContent = agentRuntime
        ? `${toolDetail} / 运行池 ${poolCounts.active || 0}-${poolCounts.activationPool || 0}-${poolCounts.frozen || 0} / 伴随实例 ${agentRuntime.pets?.length || 0}`
        : toolDetail;
    }
    if (agentValue) agentValue.textContent = `${totalAgents} 个`;
    if (agentRuntime && agentValue) {
      agentValue.textContent = `${agentRuntime.activeAgents?.length || 0} / ${totalAgents}`;
    }
    if (agentCopy) {
      agentCopy.textContent = routing?.consideredAgentCount
        ? `已评估 ${routing.consideredAgentCount} 个候选智能体，并按关键词触发相关链路`
        : totalAgents
          ? '当前工作流中的智能体链路'
          : '等待生成工作流';
    }
    if (agentRuntime && agentCopy) {
      agentCopy.textContent = `运行池 活跃=${poolCounts.active || 0} 预热=${poolCounts.activationPool || 0} 冷却=${poolCounts.cooling || 0} 冻结=${poolCounts.frozen || 0}`;
    }
    if (observerNote) {
      observerNote.textContent = panelState.testing
        ? '接口测试中'
        : routing?.matchedKeywords?.length
          ? `命中 ${routing.matchedKeywords.length} 个关键词`
          : status;
    }

    renderChips(toolChips, toolChipValues, '暂无工具');
    renderChips(agentChips, visibleAgents, '暂无智能体');
  }

  ensureQuickActions();
  ensureObserver();
  updateObserver();
  window.setInterval(updateObserver, 400);
})();
