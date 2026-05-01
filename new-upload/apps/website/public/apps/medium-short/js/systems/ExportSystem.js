export default class ExportSystem {
    constructor(app) {
        this.app = app;
    }

    async init() {
        this.app.eventBus.on('layout:ready', () => this.renderButton());
    }

    renderButton() {
        // 找到工具栏容器
        const containerId = this.app.state.device === 'mobile' ? 'view-tools' : 'editor-toolbar';
        const container = document.getElementById(containerId);
        if (!container) return;

        const btnHTML = this.app.state.device === 'mobile' 
            ? `<div id="btn-export" class="p-3 bg-panel rounded border border-border mt-4 flex items-center justify-center text-accent active:scale-95 transition-transform">
                 <i class="fa-solid fa-download mr-2"></i> 导出当前章节
               </div>`
            : `<button id="btn-export" class="text-dim hover:text-accent transition-colors" title="导出">
                 <i class="fa-solid fa-download"></i>
               </button>`;

        // 移动端追加到末尾，PC端追加到工具栏
        if (this.app.state.device === 'mobile') {
            container.insertAdjacentHTML('beforeend', btnHTML);
        } else {
            container.insertAdjacentHTML('beforeend', btnHTML);
        }

        document.getElementById('btn-export').addEventListener('click', () => this.exportCurrentFile());
    }

    exportCurrentFile() {
        // 获取当前文件信息（需要 FileSystem 支持或从 Store 获取）
        // 这里简化为从 Store 获取当前 ID
        const store = JSON.parse(localStorage.getItem('wca_v1_files') || '[]');
        const currentId = localStorage.getItem('wca_v1_currentFileId');
        const file = store.find(f => f.id === currentId);

        if (!file) {
            alert('未找到文件数据');
            return;
        }

        const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${file.title}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}