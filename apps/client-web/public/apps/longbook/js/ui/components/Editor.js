export default class Editor {
    constructor(app, container) {
        this.app = app;
        this.container = container;
    }

    render() {
        this.container.innerHTML = `
            <!-- 顶部工具栏 -->
            <div class="h-12 flex items-center justify-between px-4 border-b border-border bg-panel/50 backdrop-blur-sm">
                <div class="flex items-center space-x-2">
                    <span class="text-sm font-bold text-main">第一章：霓虹下的神明</span>
                    <span class="text-xs text-dim px-2 py-0.5 bg-white/5 rounded">3,240字</span>
                </div>
                <div class="flex items-center space-x-3 text-dim">
                    <button class="hover:text-accent p-2"><i class="fa-solid fa-save"></i></button>
                    <button class="hover:text-accent p-2"><i class="fa-solid fa-share-nodes"></i></button>
                    <button class="md:hidden hover:text-accent p-2" id="mobile-menu-trigger"><i class="fa-solid fa-bars"></i></button>
                </div>
            </div>

            <!-- 编辑区域 -->
            <div class="flex-1 relative">
                <textarea id="main-editor" 
                    class="w-full h-full bg-transparent text-main p-4 md:p-8 resize-none focus:outline-none font-mono leading-relaxed text-lg"
                    placeholder="开始你的创作..."
                    spellcheck="false"
                ></textarea>
            </div>
        `;

        // 绑定输入事件
        const textarea = this.container.querySelector('#main-editor');
        textarea.addEventListener('input', (e) => {
            this.app.bus.emit('editor:input', e.target.value);
        });

        // 移动端菜单触发
        this.container.querySelector('#mobile-menu-trigger').addEventListener('click', () => {
            this.app.bus.emit('ui:toggle-sidebar');
        });
    }
}