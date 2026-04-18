// 文件路径: js/modules/module-theme-tracker.js
// 描述: 主题与象征物追踪器模块。
function initThemeTrackerPanel() {
    document.getElementById('add-theme-btn')?.addEventListener('click', () => addTrackerItem('theme'));
    document.getElementById('add-symbol-btn')?.addEventListener('click', () => addTrackerItem('symbol'));
    document.getElementById('theme-list')?.addEventListener('click', (e) => handleTrackerDelete(e, 'theme'));
    document.getElementById('symbol-list')?.addEventListener('click', (e) => handleTrackerDelete(e, 'symbol'));
    renderThemeTracker();
}

function addTrackerItem(type) {
    const input = document.getElementById(`${type}-input`);
    const value = input.value.trim();
    if (!value) {
        showNotification(`请输入${type === 'theme' ? '主题' : '象征物'}内容。`, 'warning');
        return;
    }
    let state = getState();
    if (!state.pipeline.themeTracker) state.pipeline.themeTracker = { themes: [], symbols: [] };
    const list = type === 'theme' ? state.pipeline.themeTracker.themes : state.pipeline.themeTracker.symbols;
    list.push(value);
    updateState({ pipeline: state.pipeline });
    input.value = '';
    renderThemeTracker();
}

function handleTrackerDelete(event, type) {
    const deleteButton = event.target.closest('.delete-tracker-item');
    if (deleteButton) {
        const index = parseInt(deleteButton.dataset.index, 10);
        let state = getState();
        const list = type === 'theme' ? state.pipeline.themeTracker.themes : state.pipeline.themeTracker.symbols;
        list.splice(index, 1);
        updateState({ pipeline: state.pipeline });
        renderThemeTracker();
    }
}

function renderThemeTracker() {
    const themeList = document.getElementById('theme-list');
    const symbolList = document.getElementById('symbol-list');
    if (!themeList || !symbolList) return;

    const tracker = getState().pipeline.themeTracker || { themes: [], symbols: [] };
    const renderList = (el, items) => {
        if (items.length > 0) {
            el.innerHTML = items.map((item, i) => `
                <li class="tracker-item">${Utils.escapeHTML(item)}<button class="settings-btn delete-tracker-item" data-index="${i}" title="删除">&times;</button></li>
            `).join('');
        } else {
            el.innerHTML = `<li class="placeholder-text">暂无条目</li>`;
        }
    };
    renderList(themeList, tracker.themes);
    renderList(symbolList, tracker.symbols);
}