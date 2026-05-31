/**
 * WriterCenterArchon - Core Logic
 * 实现响应式交互、编辑器功能与 AI 模拟
 */

document.addEventListener('DOMContentLoaded', () => {
    window.app = new WriterApp();
    window.app.init();
});

class WriterApp {
    constructor() {
        this.ui = {
            sidebar: document.getElementById('sidebar'),
            overlay: document.getElementById('sidebar-overlay'),
            mobileMenuBtn: document.getElementById('mobile-menu-btn'),
            editor: document.getElementById('main-editor'),
            wordCount: document.getElementById('word-count'),
            lineCount: document.getElementById('line-count'),
            auxPanel: document.getElementById('aux-panel')
        };
        
        this.state = {
            isSidebarOpen: false,
            activeTab: 'ai'
        };
    }

    init() {
        this.bindEvents();
        this.initEditorStats();
        this.initTabs();
        console.log('WriterCenterArchon Initialized');
    }

    bindEvents() {
        // 移动端侧边栏切换
        this.ui.mobileMenuBtn?.addEventListener('click', () => this.toggleSidebar(true));
        this.ui.overlay?.addEventListener('click', () => this.toggleSidebar(false));

        // 阻止移动端双击缩放
        document.addEventListener('dblclick', (e) => {
            e.preventDefault();
        }, { passive: false });
    }

    toggleSidebar(show) {
        this.state.isSidebarOpen = show;
        if (show) {
            this.ui.sidebar.classList.remove('-translate-x-full');
            this.ui.overlay.classList.remove('hidden');
            // 强制重绘以触发 transition
            this.ui.overlay.offsetHeight;
            this.ui.overlay.classList.add('opacity-100');
        } else {
            this.ui.sidebar.classList.add('-translate-x-full');
            this.ui.overlay.classList.remove('opacity-100');
            setTimeout(() => this.ui.overlay.classList.add('hidden'), 300);
        }
    }

    initEditorStats() {
        if (!this.ui.editor) return;

        const updateStats = () => {
            const text = this.ui.editor.value;
            // 简单字数统计 (包含中文和英文单词)
            const cn = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
            const en = (text.match(/\b\w+\b/g) || []).length;
            this.ui.wordCount.textContent = cn + en;
            
            // 行数统计
            this.ui.lineCount.textContent = text.split('\n').length || 1;
        };

        this.ui.editor.addEventListener('input', updateStats);
    }

    initTabs() {
        // 简单的 Tab 切换逻辑示例
        const tabButtons = document.querySelectorAll('#aux-panel button');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // 移除所有激活状态
                tabButtons.forEach(b => {
                    b.classList.remove('text-accent', 'border-accent', 'bg-white/5');
                    b.classList.add('text-gray-400');
                });
                // 激活当前
                e.target.classList.remove('text-gray-400');
                e.target.classList.add('text-accent', 'border-b-2', 'border-accent', 'bg-white/5');
            });
        });
    }

    // 供外部调用的移动端辅助面板切换
    toggleAuxPanel() {
        alert('移动端辅助面板功能将在后续更新中支持抽屉式弹出');
    }

    // 模拟 AI 续写功能
    async aiContinue() {
        const btn = document.querySelector('#aux-panel button i.fa-bolt')?.parentElement;
        if(btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> 生成中...';
        
        setTimeout(() => {
            if(this.ui.editor) {
                this.ui.editor.value += "\n\n    突然，天空中划过一道惊雷，打破了长久的寂静。那不仅仅是雷声，更像是某种古老生物的怒吼...";
                this.ui.editor.dispatchEvent(new Event('input')); // 触发字数统计更新
            }
            if(btn) btn.innerHTML = '<i class="fa-solid fa-bolt mr-1"></i> 开始续写';
        }, 1500);
    }
}

// 暴露给全局以便 HTML onclick 调用
window.toggleAuxPanel = () => window.app.toggleAuxPanel();