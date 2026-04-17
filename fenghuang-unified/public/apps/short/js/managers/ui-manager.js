const uiManager = {
    switchView(viewId) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const viewEl = document.getElementById('view-' + viewId);
        if (viewEl) viewEl.classList.add('active');
        const navItem = Array.from(document.querySelectorAll('.nav-item')).find(el => el.getAttribute('onclick')?.includes(viewId));
        if (navItem) navItem.classList.add('active');
        const titles = { market: '智能融合', fusion: '短篇拆书', pipeline: '生产流水线', shortStory: '短篇写作', library: '图书馆', memory: '记忆系统', api: 'API设置' };
        document.getElementById('current-view').textContent = titles[viewId] || viewId;
        // 触发视图特定的初始化
        if (viewId === 'market') marketView.init();
        if (viewId === 'fusion') fusionView.init();
        if (viewId === 'pipeline') pipelineView.render();
        if (viewId === 'shortStory') writingView.init();
        if (viewId === 'memory') memoryView.refresh();
        // 融合视图需要全屏布局
        const ws = document.querySelector('.workspace');
        if (ws) {
            if (viewId === 'fusion' || viewId === 'market') ws.classList.add('workspace-fullscreen');
            else ws.classList.remove('workspace-fullscreen');
        }
    },

    switchTab(tabId) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        const tabEl = Array.from(document.querySelectorAll('.tab')).find(el => el.getAttribute('onclick')?.includes(tabId));
        if (tabEl) tabEl.classList.add('active');
        const contentEl = document.getElementById('tab-' + tabId);
        if (contentEl) contentEl.classList.add('active');
    },

    showModal(modalId) {
        document.getElementById(modalId)?.classList.add('active');
    },

    closeModal(modalId) {
        document.getElementById(modalId)?.classList.remove('active');
    }
};
