export default class EditorSystem {
    constructor(app) {
        this.app = app;
        this.editorEl = null;
        this.currentContent = '';
    }

    async init() {
        this.app.eventBus.on('layout:ready', () => this.bindEditor());
        
        // 监听文件打开事件
        this.app.eventBus.on('file:opened', (file) => {
            this.currentContent = file.content;
            if (this.editorEl) {
                this.editorEl.value = file.content;
                this.updateStats();
            }
        });
    }

    bindEditor() {
        this.editorEl = document.getElementById('main-editor');
        if (!this.editorEl) return;

        // 初始状态
        this.editorEl.value = this.currentContent;
        this.updateStats();

        this.editorEl.addEventListener('input', (e) => {
            this.currentContent = e.target.value;
            this.updateStats();
            // 触发保存事件给 FileSystem
            this.app.eventBus.emit('editor:save', this.currentContent);
        });
    }

    updateStats() {
        const count = this.currentContent.length;
        const els = document.querySelectorAll('#word-count, #mobile-word-count');
        els.forEach(el => el.textContent = `${count} 字`);
        
        // 触发统计更新事件给 StatsSystem
        this.app.eventBus.emit('stats:updated', { wordCount: count });
    }
}