(function () {
  const clearButton = document.getElementById('clearHistoryButton');
  if (!clearButton) return;

  async function postClearHistory() {
    const response = await fetch('/api/history/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({}),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || `请求失败：${response.status}`);
    }

    return payload;
  }

  function resetUiAfterClear(summaryText) {
    const recentRuns = document.getElementById('recentRuns');
    const sessionIdInput = document.getElementById('sessionIdInput');
    const promptInput = document.getElementById('promptInput');
    const chatInput = document.getElementById('chatInput');
    const chatStream = document.getElementById('chatStream');

    if (typeof state !== 'undefined') {
      state.sessions = [];
      state.activeRun = null;
      state.preview = null;
      state.currentSessionId = '';
      state.activeSession = null;
    }

    if (sessionIdInput) sessionIdInput.value = '';
    if (promptInput) promptInput.value = '';
    if (chatInput) chatInput.value = '';
    if (recentRuns) recentRuns.textContent = '还没有会话';
    if (chatStream) chatStream.textContent = '选择一个会话，或者直接输入消息';

    if (typeof clearStoredSessionId === 'function') clearStoredSessionId();
    if (typeof applySession === 'function') applySession(null);
    if (typeof resetSurface === 'function') resetSurface();
    if (typeof syncPromptMeta === 'function') syncPromptMeta();
    if (typeof renderRecentRuns === 'function') renderRecentRuns();
    if (typeof renderSurfaceChrome === 'function') renderSurfaceChrome();
    if (typeof scheduleFusionRefresh === 'function') scheduleFusionRefresh();
    if (typeof renderFinalOutput === 'function') renderFinalOutput(summaryText);
  }

  async function handleClearHistory() {
    if (typeof state !== 'undefined' && state.isRunning) return;

    const confirmed = window.confirm('确认清除全部历史会话和运行记录吗？此操作不可恢复。');
    if (!confirmed) return;

    const originalText = clearButton.textContent;

    try {
      if (typeof setBusy === 'function') setBusy(true);
      clearButton.disabled = true;
      clearButton.textContent = '清除中...';

      const result = await postClearHistory();
      const summaryText = `已清除 ${result.clearedSessions || 0} 个会话，${result.clearedRuns || 0} 条运行记录`;
      resetUiAfterClear(summaryText);
      clearButton.textContent = '已清除';
    } catch (error) {
      if (typeof renderFinalOutput === 'function') {
        renderFinalOutput(error.message || '清除失败');
      }
      clearButton.textContent = '清除失败';
    } finally {
      if (typeof setBusy === 'function') setBusy(false);
      clearButton.disabled = false;
      window.setTimeout(() => {
        clearButton.textContent = originalText;
      }, 1200);
    }
  }

  clearButton.addEventListener('click', handleClearHistory);
})();
