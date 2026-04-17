interface MemoryTab {
    id: string;
    icon: string;
    text: string;
    color: string;
}

declare const MemorySystem: {
    working: any[];
    addWorking: (content: string, type: string, priority: number, meta?: any) => any;
    getWorkingContext: (maxItems?: number) => string;
    clearWorking: () => void;
};

declare const DB: {
    get: <T = any>(store: string, key: string) => Promise<T | null>;
    put: (store: string, data: any) => Promise<any>;
    getAll: <T = any>(store: string) => Promise<T[]>;
};

const memorySystemUIModule = {
    activeTab: 'dashboard',
    _pmFilter: 'all',
    _pmSearch: '',

    tabs: [
        { id: 'dashboard', icon: 'fa-chart-pie', text: '总览', color: 'text-purple-400' },
        { id: 'working', icon: 'fa-bolt', text: '工作记忆', color: 'text-yellow-400' },
        { id: 'session', icon: 'fa-comments', text: '会话记忆', color: 'text-blue-400' },
        { id: 'persistent', icon: 'fa-database', text: '长期记忆', color: 'text-green-400' }
    ] as MemoryTab[],

    switchTab(tabId: string): void {
        this.activeTab = tabId;
        this.render();
    },

    aiCompress(): void {
        console.log('AI compressing working memory...');
    },

    _renderSidebar(): string {
        return `<div class="w-64 shrink-0 flex flex-col bg-[#F1F3F5] border-r border-gray-200">
            <div class="p-4 border-b border-gray-200">
                <div class="flex items-center gap-2">
                    <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex center text-white">
                        <i class="fa-solid fa-brain"></i>
                    </div>
                    <div>
                        <div class="font-bold text-gray-800">三层记忆</div>
                        <div class="text-xs text-gray-600">工作 · 会话 · 长期</div>
                    </div>
                </div>
            </div>
            <div class="p-2 space-y-1">
                ${this.tabs.map(t => `
                    <button class="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left text-sm font-bold transition-all ${this.activeTab === t.id ? 'bg-gray-200 text-gray-800' : 'text-gray-600 hover:bg-gray-100'}" onclick="Modules.memory_system.switchTab('${t.id}')">
                        <i class="fa-solid ${t.icon} ${t.color} w-5 text-center"></i>
                        <span>${t.text}</span>
                    </button>
                `).join('')}
            </div>
            <div class="mt-auto p-3 border-t border-gray-200">
                <button class="btn w-full bg-gradient-to-r from-purple-500 to-violet-500 text-white" onclick="Modules.memory_system.aiCompress()">
                    <i class="fa-solid fa-compress mr-2"></i>AI 压缩工作记忆
                </button>
            </div>
        </div>`;
    },

    _renderDashboard(): string {
        const workingCount = MemorySystem.working?.length || 0;
        return `<div class="p-6">
            <h3 class="font-bold text-lg mb-6">记忆总览</h3>
            <div class="grid grid-cols-3 gap-4">
                <div class="bg-white border border-gray-200 rounded-lg p-4 text-center">
                    <i class="fa-solid fa-bolt text-3xl text-yellow-400 mb-2"></i>
                    <div class="text-2xl font-bold">${workingCount}</div>
                    <div class="text-sm text-gray-600">工作记忆</div>
                </div>
                <div class="bg-white border border-gray-200 rounded-lg p-4 text-center">
                    <i class="fa-solid fa-comments text-3xl text-blue-400 mb-2"></i>
                    <div class="text-2xl font-bold">0</div>
                    <div class="text-sm text-gray-600">会话记忆</div>
                </div>
                <div class="bg-white border border-gray-200 rounded-lg p-4 text-center">
                    <i class="fa-solid fa-database text-3xl text-green-400 mb-2"></i>
                    <div class="text-2xl font-bold">0</div>
                    <div class="text-sm text-gray-600">长期记忆</div>
                </div>
            </div>
        </div>`;
    },

    _renderWorkingMemory(): string {
        const items = MemorySystem.working || [];
        return `<div class="p-6">
            <h3 class="font-bold text-lg mb-4">工作记忆 (${items.length})</h3>
            <div class="space-y-2">
                ${items.slice(0, 20).map((item: any) => `
                    <div class="bg-white border border-gray-200 rounded-lg p-3">
                        <div class="text-sm">${item.content?.slice(0, 100) || ''}</div>
                        <div class="text-xs text-gray-500 mt-1">${item.type} | 优先级: ${item.priority}</div>
                    </div>
                `).join('')}
            </div>
        </div>`;
    },

    _renderContent(): string {
        switch (this.activeTab) {
            case 'dashboard': return this._renderDashboard();
            case 'working': return this._renderWorkingMemory();
            default: return `<div class="p-6 text-center text-gray-500">功能开发中...</div>`;
        }
    },

    render(): string {
        return `<div class="flex h-full bg-[#F8F9FA] overflow-hidden">
            ${this._renderSidebar()}
            <div class="flex-1 overflow-y-auto">${this._renderContent()}</div>
        </div>`;
    },

    init(): void {
        console.log('Memory system UI initialized');
    }
};

(window as any).Modules = (window as any).Modules || {};
(window as any).Modules.memory_system = memorySystemUIModule;
