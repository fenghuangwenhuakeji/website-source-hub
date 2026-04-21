import Store from '../core/Store.js';

export default class FileSystem {
    constructor(app) {
        this.app = app;
        this.store = new Store();
        this.files = this.store.get('files', [
            { id: '1', title: '第一章：序幕', content: '这是第一章的内容...' },
            { id: '2', title: '第二章：风起云涌', content: '这是第二章的内容...' }
        ]);
        this.currentFileId = this.store.get('currentFileId', '1');
    }

    async init() {
        this.app.eventBus.on('layout:ready', () => this.render());
        
        // 监听编辑器保存，同步更新文件内容
        this.app.eventBus.on('editor:save', (content) => {
            const file = this.files.find(f => f.id === this.currentFileId);
            if (file) {
                file.content = content;
                this.saveToStore();
            }
        });
    }

    render() {
        const containerId = this.app.state.device === 'mobile' ? 'view-files' : 'resource-tree';
        const container = document.getElementById(containerId);
        if (!container) return;

        // 移动端需要保留 padding
        const listClass = this.app.state.device === 'mobile' ? 'p-4 space-y-2' : 'space-y-1';

        let html = `<div class="${listClass}">`;
        this.files.forEach(file => {
            const activeClass = file.id === this.currentFileId ? 'bg-accent text-bg font-bold' : 'text-dim hover:bg-white/5';
            html += `
                <div class="file-item p-3 rounded cursor-pointer transition-colors ${activeClass}" data-id="${file.id}">
                    <i class="fa-regular fa-file-lines mr-2"></i>
                    ${file.title}
                </div>
            `;
        });
        
        // 添加“新建”按钮
        html += `
            <div id="btn-new-file" class="p-3 rounded border border-dashed border-dim text-dim text-center cursor-pointer hover:border-accent hover:text-accent mt-4">
                <i class="fa-solid fa-plus"></i> 新建章节
            </div>
        </div>`;

        container.innerHTML = html;
        this.bindEvents(container);
    }

    bindEvents(container) {
        container.querySelectorAll('.file-item').forEach(item => {
            item.addEventListener('click', () => {
                this.switchFile(item.dataset.id);
            });
        });

        const btnNew = container.querySelector('#btn-new-file');
        if (btnNew) {
            btnNew.addEventListener('click', () => this.createFile());
        }
    }

    switchFile(id) {
        this.currentFileId = id;
        this.store.set('currentFileId', id);
        const file = this.files.find(f => f.id === id);
        
        // 通知编辑器加载新内容
        this.app.eventBus.emit('file:opened', file);
        
        // 重新渲染高亮状态
        this.render();

        // 移动端自动切回编辑器视图
        if (this.app.state.device === 'mobile') {
            document.querySelector('[data-target="view-editor"]').click();
        }
    }

    createFile() {
        const newId = Date.now().toString();
        const newFile = {
            id: newId,
            title: `新章节 ${this.files.length + 1}`,
            content: ''
        };
        this.files.push(newFile);
        this.saveToStore();
        this.switchFile(newId);
    }

    saveToStore() {
        this.store.set('files', this.files);
    }
}