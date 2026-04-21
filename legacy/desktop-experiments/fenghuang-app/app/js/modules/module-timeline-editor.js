// 文件路径: js/modules/module-timeline-editor.js
// 描述: 世界观时间线编辑器模块。
function initTimelineEditorPanel() {
    document.getElementById('add-timeline-event-btn')?.addEventListener('click', addTimelineEvent);
    document.getElementById('timeline-list')?.addEventListener('click', function(e) {
        const deleteBtn = e.target.closest('.delete-event-btn');
        if (deleteBtn) {
            deleteTimelineEvent(deleteBtn.dataset.index);
        }
    });
    renderTimeline();
}

function addTimelineEvent() {
    const dateInput = document.getElementById('timeline-date-input');
    const eventInput = document.getElementById('timeline-event-input');
    const date = dateInput.value.trim();
    const event = eventInput.value.trim();

    if (!date || !event) {
        showNotification("请输入完整的时间和事件描述。", "warning");
        return;
    }
    let state = getState();
    if (!state.pipeline.timeline) state.pipeline.timeline = [];
    state.pipeline.timeline.push({ date, event });
    updateState({ pipeline: state.pipeline });

    dateInput.value = '';
    eventInput.value = '';
    renderTimeline();
}

function deleteTimelineEvent(index) {
    let state = getState();
    if (state.pipeline.timeline && state.pipeline.timeline[index]) {
        if(confirm("确定要删除这个历史事件吗？")) {
            state.pipeline.timeline.splice(index, 1);
            updateState({ pipeline: state.pipeline });
            renderTimeline();
        }
    }
}

function renderTimeline() {
    const list = document.getElementById('timeline-list');
    if (!list) return;
    const events = getState().pipeline.timeline || [];

    if (events.length === 0) {
        list.innerHTML = `<li class="placeholder-text">暂无历史事件。</li>`;
        return;
    }

    list.innerHTML = events.map((item, index) => `
        <li class="timeline-item">
            <span class="timeline-date">${Utils.escapeHTML(item.date)}:</span>
            <span class="timeline-event">${Utils.escapeHTML(item.event)}</span>
            <button class="settings-btn delete-event-btn" data-index="${index}" title="删除">&times;</button>
        </li>
    `).join('');
}