interface SettingsTab {
    id: string;
    icon: string;
    text: string;
}

declare const DB: {
    get: <T = any>(store: string, key: string) => Promise<T | null>;
    put: (store: string, data: any) => Promise<any>;
};

const settingsModule = {
    currentTab: 'api',
    currentType: null as string | null,
    currentId: null as string | null,

    tabs: [
        { id: 'api', icon: 'fa-plug', text: 'API 配置' },
        { id: 'appear', icon: 'fa-palette', text: '外观主题' },
        { id: 'writing', icon: 'fa-feather-pointed', text: '写作偏好' },
        { id: 'memory', icon: 'fa-brain', text: '记忆与上下文' },
        { id: 'shortcut', icon: 'fa-keyboard', text: '快捷键' },
        { id: 'data', icon: 'fa-database', text: '数据管理' },
        { id: 'about', icon: 'fa-circle-info', text: '关于' }
    ] as SettingsTab[],

    switchTab(tabId: string): void {
        this.currentTab = tabId;
        this.render();
    },

    _renderContent(): string {
        switch (this.currentTab) {
            case 'api':
                return `<div class="space-y-4">
                    <h3 class="font-bold text-lg">API 配置</h3>
                    <div class="bg-gray-100 rounded-lg p-4">
                        <label class="block text-sm font-bold mb-2">API Key</label>
                        <input type="password" class="w-full bg-white border border-gray-300 rounded p-2" placeholder="输入您的API密钥">
                    </div>
                    <div class="bg-gray-100 rounded-lg p-4">
                        <label class="block text-sm font-bold mb-2">模型选择</label>
                        <select class="w-full bg-white border border-gray-300 rounded p-2">
                            <option>GPT-4</option>
                            <option>GPT-3.5</option>
                            <option>Claude</option>
                        </select>
                    </div>
                </div>`;
            case 'appear':
                return `<div class="space-y-4">
                    <h3 class="font-bold text-lg">外观主题</h3>
                    <div class="grid grid-cols-3 gap-4">
                        <button class="p-4 rounded-lg border-2 border-gray-300 hover:border-blue-500">
                            <i class="fa-solid fa-sun text-2xl text-yellow-400"></i>
                            <p class="mt-2 text-sm">浅色</p>
                        </button>
                        <button class="p-4 rounded-lg border-2 border-gray-300 hover:border-blue-500">
                            <i class="fa-solid fa-moon text-2xl text-gray-600"></i>
                            <p class="mt-2 text-sm">深色</p>
                        </button>
                        <button class="p-4 rounded-lg border-2 border-gray-300 hover:border-blue-500">
                            <i class="fa-solid fa-circle-half-stroke text-2xl text-gray-400"></i>
                            <p class="mt-2 text-sm">自动</p>
                        </button>
                    </div>
                </div>`;
            default:
                return `<div class="text-dim">选择一个设置项</div>`;
        }
    },

    _renderApiModal(): string {
        return `<div id="settings-api-modal" class="hidden fixed inset-0 bg-black/50 z-50 flex center">
            <div class="bg-white rounded-xl w-[400px] p-6">
                <h3 class="font-bold text-lg mb-4">API 配置</h3>
                <div class="space-y-4">
                    <input class="w-full bg-gray-100 border border-gray-300 rounded p-3" placeholder="API Key">
                </div>
                <div class="flex justify-end gap-2 mt-6">
                    <button class="btn hover:bg-gray-200" onclick="document.getElementById('settings-api-modal').classList.add('hidden')">取消</button>
                    <button class="btn btn-primary">保存</button>
                </div>
            </div>
        </div>`;
    },

    render(): string {
        return `<div class="flex h-full bg-[#F8F9FA] overflow-hidden">
            <div class="w-56 shrink-0 flex flex-col bg-[#F1F3F5] border-r border-gray-200">
                <div class="p-4 border-b border-gray-200">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-600 to-gray-800 flex center text-white">
                            <i class="fa-solid fa-gear"></i>
                        </div>
                        <div>
                            <div class="font-bold text-gray-800 text-sm">系统设置</div>
                            <div class="text-[10px] text-gray-600">v2.0 Genesis</div>
                        </div>
                    </div>
                </div>
                <div class="flex-1 overflow-y-auto p-2 space-y-0.5">
                    ${this.tabs.map(tb => `
                        <button class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-bold transition-all ${this.currentTab === tb.id ? 'bg-gray-200 text-gray-800' : 'text-gray-600 hover:bg-gray-100'}" onclick="Modules.settings.switchTab('${tb.id}')">
                            <i class="fa-solid ${tb.icon} w-4 text-center"></i>
                            <span>${tb.text}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
            <div class="flex-1 overflow-y-auto p-6">${this._renderContent()}</div>
        </div>${this._renderApiModal()}`;
    },

    init(): void {
        console.log('Settings module initialized');
    }
};

(window as any).Modules = (window as any).Modules || {};
(window as any).Modules.settings = settingsModule;
