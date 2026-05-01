// ═══════════════════════════════════════════════════════════════
// 系统设置 (Settings) — 简化上手版
// 目标：新用户先完成可用配置，高级项折叠到后面。
// ═══════════════════════════════════════════════════════════════
Modules.settings = {
    currentTab: 'quickstart',
    currentType: null,
    currentId: null,

    _navItems: [
        { id: 'quickstart', icon: 'fa-bolt', text: '快速开始', desc: '先跑起来' },
        { id: 'api_pool', icon: 'fa-plug-circle-bolt', text: '模型/API', desc: '接入生成能力' },
        { id: 'experience', icon: 'fa-sliders', text: '界面与写作', desc: '少调但够用' },
        { id: 'memory', icon: 'fa-brain', text: '记忆上下文', desc: '控制引用范围' },
        { id: 'data', icon: 'fa-shield-halved', text: '数据安全', desc: '备份与恢复' },
        { id: 'advanced', icon: 'fa-screwdriver-wrench', text: '高级设置', desc: '细调入口' },
        { id: 'about', icon: 'fa-circle-info', text: '关于', desc: '版本信息' }
    ],

    render: () => {
        const S = Modules.settings;
        if (['api', 'appear', 'theme', 'typography', 'creative', 'writing', 'shortcut'].includes(S.currentTab)) {
            S.currentTab = S._normalizeLegacyTab(S.currentTab);
        }
        const t = S.currentTab;
        return `
        <div class="flex h-full bg-[#08080a] overflow-hidden">
            <div class="w-60 shrink-0 flex flex-col bg-[#0e0e10] border-r border-white/5">
                <div class="p-4 border-b border-white/5">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg bg-white/10 border border-white/10 flex center text-white text-sm">
                            <i class="fa-solid fa-gear"></i>
                        </div>
                        <div class="min-w-0">
                            <div class="font-bold text-white text-sm">系统设置</div>
                            <div class="text-[10px] text-dim truncate">快速配置 · 高级折叠</div>
                        </div>
                    </div>
                </div>
                <div class="p-2 space-y-1 overflow-y-auto flex-1">
                    ${S._navItems.map(item => `
                        <button class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${t === item.id ? 'bg-white/10 text-white border border-white/10' : 'text-dim hover:bg-white/5 border border-transparent'}" onclick="Modules.settings.switchTab('${item.id}')">
                            <i class="fa-solid ${item.icon} w-5 text-center text-[11px]"></i>
                            <span class="min-w-0">
                                <span class="block text-xs font-bold truncate">${item.text}</span>
                                <span class="block text-[9px] opacity-60 truncate">${item.desc}</span>
                            </span>
                        </button>
                    `).join('')}
                </div>
                <div class="p-3 border-t border-white/5 text-[10px] text-dim leading-relaxed">
                    先配主控；拆书和解析可单独接。
                </div>
            </div>
            <div class="flex-1 overflow-y-auto" id="settings-content">
                ${S._renderContent()}
            </div>
        </div>
        ${S._renderApiModal()}
        `;
    },

    _normalizeLegacyTab(tab) {
        const map = {
            api: 'api_pool',
            appear: 'experience',
            theme: 'advanced',
            typography: 'experience',
            creative: 'experience',
            writing: 'experience',
            shortcut: 'advanced'
        };
        return map[tab] || tab || 'quickstart';
    },

    switchTab: (tab) => {
        const S = Modules.settings;
        S.currentTab = S._normalizeLegacyTab(tab);
        const el = document.getElementById('module-view-settings');
        if (el) el.innerHTML = S.render();
        S.init();
    },

    init: () => {
        const S = Modules.settings;
        if (S.currentTab === 'api_pool') setTimeout(() => S._renderApiPoolGrid?.(), 50);
        if (S.currentTab === 'quickstart') setTimeout(() => S._refreshSetupStatus?.(), 50);
        if (S.currentTab === 'data') {
            setTimeout(() => LocalSync?._updateStatusBar?.(), 50);
            setTimeout(() => S._refreshStorageStats?.(), 80);
        }
    },

    refresh: () => {
        const el = document.getElementById('module-view-settings');
        if (el) {
            el.innerHTML = Modules.settings.render();
            Modules.settings.init();
        }
    },

    _renderContent: () => {
        const S = Modules.settings;
        const t = S._normalizeLegacyTab(S.currentTab);
        if (t === 'quickstart') return S._renderQuickStartTab();
        if (t === 'api_pool') return S._renderModelTab();
        if (t === 'experience') return S._renderExperienceTab();
        if (t === 'memory') return S._renderMemoryTab();
        if (t === 'data') return S._renderDataTab();
        if (t === 'advanced') return S._renderAdvancedTab();
        if (t === 'about') return S._renderAboutTab();
        return S._renderQuickStartTab();
    },

    _renderPageShell(title, desc, body, actions = '') {
        return `
        <div class="min-h-full p-6">
            <div class="max-w-5xl mx-auto space-y-5">
                <div class="flex items-start justify-between gap-4">
                    <div>
                        <div class="text-[10px] text-accent font-bold tracking-wider uppercase">Settings</div>
                        <h2 class="text-xl font-black text-white mt-1">${title}</h2>
                        <p class="text-xs text-dim mt-1 max-w-2xl">${desc}</p>
                    </div>
                    ${actions}
                </div>
                ${body}
            </div>
        </div>`;
    },

    _renderQuickStartTab() {
        const steps = [
            { id: 'text-api', icon: 'fa-plug-circle-bolt', title: '接入主控模型', desc: '主控写正文；拆书、解析可以单独接更快或更便宜的模型。', action: '去配置', tab: 'api_pool' },
            { id: 'writing', icon: 'fa-feather-pointed', title: '选择写作习惯', desc: '文风、人称、自动保存先定好。', action: '去设置', tab: 'experience' },
            { id: 'backup', icon: 'fa-shield-halved', title: '备份数据', desc: '长篇项目先保命，再折腾。', action: '去备份', tab: 'data' }
        ];
        const routes = [
            ['project_manager', 'fa-layer-group', '新建项目', '先给作品建一个独立项目'],
            ['phoenix', 'fa-fire', '从零创世', '世界观、大纲、主线一起搭'],
            ['writer', 'fa-feather-pointed', '直接写正文', '进入章节执笔台拿结果'],
            ['creative_studio', 'fa-wand-magic-sparkles', '找灵感', '标题、开头、反转、消痕']
        ];
        return this._renderPageShell('快速开始', '只保留用户第一次使用最需要的三件事：接模型、定写法、能备份。', `
            <div class="grid lg:grid-cols-3 gap-3">
                ${steps.map((s, i) => `
                    <div class="bg-[#111113] border border-white/5 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-3">
                            <div class="w-9 h-9 rounded-lg bg-white/5 flex center text-accent"><i class="fa-solid ${s.icon}"></i></div>
                            <span class="text-[10px] text-dim">第 ${i + 1} 步</span>
                        </div>
                        <div class="text-sm font-bold text-white">${s.title}</div>
                        <div class="text-[11px] text-dim mt-1 leading-relaxed">${s.desc}</div>
                        <div class="mt-4 flex items-center justify-between">
                            <span id="setup-${s.id}" class="text-[10px] text-dim">检测中</span>
                            <button class="btn btn-xs bg-white/10 text-white hover:bg-white/15 rounded-lg" onclick="Modules.settings.switchTab('${s.tab}')">${s.action}</button>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="bg-[#111113] border border-white/5 rounded-lg p-4">
                <div class="flex items-center justify-between mb-3">
                    <div>
                        <div class="text-sm font-bold text-white">配置好以后，从这里拿结果</div>
                        <div class="text-[11px] text-dim mt-1">不懂模块也没关系，按目标点入口。</div>
                    </div>
                    <button class="btn btn-xs bg-accent/15 text-accent border border-accent/20 rounded-lg" onclick="Modules.settings._applyBeginnerDefaults()">一键新手默认</button>
                </div>
                <div class="grid md:grid-cols-4 gap-2">
                    ${routes.map(([id, icon, title, desc]) => `
                        <button class="p-3 rounded-lg bg-black/25 border border-white/5 hover:border-accent/30 hover:bg-accent/5 text-left transition" onclick="Navigation.show('${id}')">
                            <i class="fa-solid ${icon} text-accent text-sm"></i>
                            <div class="text-xs font-bold text-white mt-2">${title}</div>
                            <div class="text-[10px] text-dim mt-1 leading-relaxed">${desc}</div>
                        </button>
                    `).join('')}
                </div>
            </div>
        `);
    },

    _renderModelTab() {
        return this._renderPageShell('模型/API', '主控、拆书、解析三路分开。普通用户先加主控模型；导入续写和拆书量大时，再单独加解析模型、拆书模型。', `
            <div class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-blue-500/15 flex center text-blue-300"><i class="fa-solid fa-circle-info"></i></div>
                <div class="flex-1">
                    <div class="text-sm font-bold text-blue-100">最短路径</div>
                    <div class="text-[11px] text-blue-100/70 mt-1">添加“主控模型”即可开始写作；需要提速或省钱，再分别添加“拆书模型”和“解析模型”。</div>
                </div>
                <div class="flex flex-wrap gap-2">
                    <button class="btn btn-sm bg-blue-600 text-white rounded-lg" onclick="Modules.settings._openApiPoolModalFor ? Modules.settings._openApiPoolModalFor('text') : (Modules.settings._apiPoolType='text',Modules.settings.refresh(),setTimeout(()=>Modules.settings._openApiPoolModal(),80))">添加主控</button>
                    <button class="btn btn-sm bg-amber-500/15 text-amber-200 border border-amber-500/20 rounded-lg" onclick="Modules.settings._openApiPoolModalFor ? Modules.settings._openApiPoolModalFor('fusion') : (Modules.settings._apiPoolType='fusion',Modules.settings.refresh(),setTimeout(()=>Modules.settings._openApiPoolModal(),80))">添加拆书</button>
                    <button class="btn btn-sm bg-cyan-500/15 text-cyan-200 border border-cyan-500/20 rounded-lg" onclick="Modules.settings._openApiPoolModalFor ? Modules.settings._openApiPoolModalFor('parse') : (Modules.settings._apiPoolType='parse',Modules.settings.refresh(),setTimeout(()=>Modules.settings._openApiPoolModal(),80))">添加解析</button>
                </div>
            </div>
            ${this._renderApiPoolTab ? this._renderApiPoolTab() : '<div class="p-8 text-center text-dim">API 设置加载中...</div>'}
        `);
    },

    _renderExperienceTab() {
        const current = ThemeEngine.getCurrentSettings();
        const deaiIntensity = localStorage.getItem('genesis_deai_intensity') || 'medium';
        return this._renderPageShell('界面与写作', '这里不追求可调项多，先把阅读舒服、写作稳定、输出风格三件事定下来。', `
            <div class="grid lg:grid-cols-3 gap-3">
                ${[
                    ['focus', '专注写作', '暗金主题、少动画、正文更耐看'],
                    ['bright', '白天办公', '浅色主题、系统字体、信息更清楚'],
                    ['dense', '高效操作', '紧凑字体、窄侧栏、减少过渡']
                ].map(([id, title, desc]) => `
                    <button class="bg-[#111113] border border-white/5 rounded-lg p-4 text-left hover:border-accent/30 hover:bg-accent/5 transition" onclick="Modules.settings._applyExperiencePreset('${id}')">
                        <div class="text-sm font-bold text-white">${title}</div>
                        <div class="text-[11px] text-dim mt-1 leading-relaxed">${desc}</div>
                        <div class="text-[10px] text-accent mt-3">应用这套</div>
                    </button>
                `).join('')}
            </div>

            <div class="grid lg:grid-cols-2 gap-4">
                <div class="bg-[#111113] border border-white/5 rounded-lg p-4 space-y-4">
                    <div>
                        <div class="text-sm font-bold text-white">写作默认值</div>
                        <div class="text-[11px] text-dim mt-1">给续写和生成模块一个统一底线。</div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <label class="space-y-1">
                            <span class="text-[10px] text-dim">默认文风</span>
                            <select id="s-style" class="input bg-black/30 border-white/10 h-9 text-xs text-white">
                                ${['网络小说','严肃文学','轻小说','剧本','口播文案'].map(v => `<option ${localStorage.getItem('writing_style') === v ? 'selected' : ''}>${v}</option>`).join('')}
                            </select>
                        </label>
                        <label class="space-y-1">
                            <span class="text-[10px] text-dim">默认人称</span>
                            <select id="s-pov" class="input bg-black/30 border-white/10 h-9 text-xs text-white">
                                ${['第三人称限制','第一人称','第三人称全知'].map(v => `<option ${localStorage.getItem('writing_pov') === v ? 'selected' : ''}>${v}</option>`).join('')}
                            </select>
                        </label>
                        <label class="space-y-1">
                            <span class="text-[10px] text-dim">单次目标字数</span>
                            <input id="s-wordcount" type="number" min="500" max="10000" step="500" class="input bg-black/30 border-white/10 h-9 text-xs text-white" value="${localStorage.getItem('writing_wordcount') || '2000'}">
                        </label>
                        <label class="space-y-1">
                            <span class="text-[10px] text-dim">续写参考长度</span>
                            <input id="s-context-len" type="number" min="500" max="5000" step="500" class="input bg-black/30 border-white/10 h-9 text-xs text-white" value="${localStorage.getItem('writing_context_len') || '1500'}">
                        </label>
                    </div>
                    <textarea id="s-global-rules" class="textarea w-full bg-black/30 border-white/10 h-28 text-xs text-gray-300 leading-relaxed" placeholder="给所有创作模块的固定要求，例如：对话要有潜台词；不要用抽象情绪词；每章保留一个悬念。">${localStorage.getItem('global_rules') || ''}</textarea>
                    <button class="btn btn-sm bg-white text-black hover:bg-gray-200 rounded-lg font-bold" onclick="Modules.settings._saveWritingBasics()">保存写作设置</button>
                </div>

                <div class="bg-[#111113] border border-white/5 rounded-lg p-4 space-y-4">
                    <div>
                        <div class="text-sm font-bold text-white">输出偏好</div>
                        <div class="text-[11px] text-dim mt-1">让结果更像能直接用的稿子。</div>
                    </div>
                    <div class="space-y-3">
                        <label class="flex items-center justify-between text-xs text-gray-300">
                            <span>生成后自动保存到工作记忆</span>
                            <input type="checkbox" class="accent-accent" ${localStorage.getItem('auto_memory') !== 'false' ? 'checked' : ''} onchange="localStorage.setItem('auto_memory',this.checked)">
                        </label>
                        <label class="flex items-center justify-between text-xs text-gray-300">
                            <span>续写时自动注入 RAG 上下文</span>
                            <input type="checkbox" class="accent-accent" ${localStorage.getItem('auto_rag') !== 'false' ? 'checked' : ''} onchange="localStorage.setItem('auto_rag',this.checked)">
                        </label>
                        <label class="flex items-center justify-between text-xs text-gray-300">
                            <span>编辑器自动保存</span>
                            <input type="checkbox" class="accent-accent" ${localStorage.getItem('auto_save') !== 'false' ? 'checked' : ''} onchange="localStorage.setItem('auto_save',this.checked)">
                        </label>
                    </div>
                    <div class="pt-3 border-t border-white/5">
                        <div class="text-[10px] text-dim mb-2">AI 消痕强度</div>
                        <div class="grid grid-cols-3 gap-2">
                            ${[
                                ['light','轻度','保留原味'],
                                ['medium','中度','默认推荐'],
                                ['strong','强力','更像人工']
                            ].map(([id, label, desc]) => `
                                <button class="p-2 rounded-lg border text-left ${deaiIntensity === id ? 'border-accent bg-accent/10 text-white' : 'border-white/5 bg-white/5 text-dim hover:bg-white/10'}" onclick="localStorage.setItem('genesis_deai_intensity','${id}');Modules.settings.refresh()">
                                    <div class="text-xs font-bold">${label}</div>
                                    <div class="text-[9px] opacity-70 mt-0.5">${desc}</div>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    <div class="pt-3 border-t border-white/5">
                        <div class="text-[10px] text-dim mb-2">当前界面</div>
                        <div class="text-xs text-white">主题：${current.theme} · 字体：${current.font} · 编辑字号：${current.editorSize}px</div>
                    </div>
                </div>
            </div>
        `);
    },

    _renderMemoryTab() {
        return this._renderPageShell('记忆上下文', '普通用户只需要知道：引用多一点更懂项目，引用少一点更干净。', `
            <div class="grid lg:grid-cols-3 gap-3">
                ${[
                    ['light','轻量引用','速度快，适合短文本',3,800],
                    ['balanced','平衡引用','默认推荐，适合长篇续写',5,1500],
                    ['deep','深度引用','适合世界观复杂的项目',10,3000]
                ].map(([id,title,desc,topk,window]) => `
                    <button class="bg-[#111113] border border-white/5 rounded-lg p-4 text-left hover:border-accent/30 hover:bg-accent/5 transition" onclick="Modules.settings._applyMemoryPreset('${id}',${topk},${window})">
                        <div class="text-sm font-bold text-white">${title}</div>
                        <div class="text-[11px] text-dim mt-1">${desc}</div>
                        <div class="text-[10px] text-accent mt-3">Top ${topk} · ${window} tokens</div>
                    </button>
                `).join('')}
            </div>

            <div class="bg-[#111113] border border-white/5 rounded-lg p-4 space-y-4">
                <div class="text-sm font-bold text-white">手动调整</div>
                <div class="grid md:grid-cols-2 gap-4">
                    <label class="space-y-1">
                        <span class="text-[10px] text-dim">检索结果数量</span>
                        <input id="rag-topk-input" type="number" class="input bg-black/30 border-white/10 h-9 text-sm text-white" value="${localStorage.getItem('rag_topk') || '5'}" min="1" max="20">
                    </label>
                    <label class="space-y-1">
                        <span class="text-[10px] text-dim">上下文窗口</span>
                        <input id="rag-window-input" type="number" class="input bg-black/30 border-white/10 h-9 text-sm text-white" value="${localStorage.getItem('rag_window') || '1500'}" min="200" max="5000" step="100">
                    </label>
                </div>
                <button class="btn btn-sm bg-white/10 text-white rounded-lg" onclick="Modules.settings._saveMemoryBasics()">保存上下文设置</button>
            </div>
        `);
    },

    _renderDataTab() {
        return this._renderPageShell('数据安全', '这里保留必要的数据操作：备份、恢复、查看存储。清理和重置放在高级设置里。', `
            <div class="bg-[#111113] border border-amber-500/20 rounded-lg p-4 space-y-3">
                <div class="flex items-center justify-between gap-3">
                    <div class="flex items-center gap-2">
                        <i class="fa-solid fa-hard-drive text-amber-400"></i>
                        <span class="text-sm font-bold text-white">本地文件夹地址</span>
                    </div>
                    <span class="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/20">${LocalSync.supportsLocalFolder() ? '可直接绑定' : '浏览器直写不可用'}</span>
                </div>
                <div class="text-[11px] text-dim leading-relaxed">选择一个真实的本地文件夹作为数据落点。系统会把业务数据写成 JSON 文件；不再使用“虚拟工作空间”作为新入口。</div>
                <div id="local-sync-status"></div>
            </div>

            <div class="grid md:grid-cols-2 gap-3">
                <button class="p-4 bg-[#111113] rounded-lg border border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 transition text-left" onclick="Modules.settings.exportData()">
                    <i class="fa-solid fa-download text-blue-400 text-lg"></i>
                    <div class="text-sm font-bold text-white mt-2">导出完整备份</div>
                    <div class="text-[11px] text-dim mt-1">下载 JSON 备份文件，适合换电脑或大改前保存。</div>
                </button>
                <button class="p-4 bg-[#111113] rounded-lg border border-white/5 hover:border-green-500/30 hover:bg-green-500/5 transition text-left" onclick="document.getElementById('import-file').click()">
                    <i class="fa-solid fa-upload text-green-400 text-lg"></i>
                    <div class="text-sm font-bold text-white mt-2">恢复备份</div>
                    <div class="text-[11px] text-dim mt-1">从之前导出的 JSON 文件恢复数据。</div>
                    <input type="file" id="import-file" class="hidden" accept=".json" onchange="Modules.settings.importData(this)">
                </button>
            </div>

            <div class="bg-[#111113] border border-white/5 rounded-lg p-4 space-y-3">
                <div class="flex items-center justify-between">
                    <div class="text-sm font-bold text-white">存储统计</div>
                    <button class="btn btn-xs bg-white/5 text-dim rounded-lg" onclick="Modules.settings._refreshStorageStats()"><i class="fa-solid fa-rotate mr-1"></i>刷新</button>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2" id="storage-stats">
                    ${[
                        ['entities','实体'],['vectors','向量'],['prompts','提示词'],['books','图书'],
                        ['volumes','卷'],['chapters','章节'],['sessions','对话'],['outlines','大纲']
                    ].map(([id,label]) => `
                        <div class="p-3 bg-black/25 rounded-lg border border-white/5 text-center">
                            <div class="text-lg font-bold text-white" id="ss-${id}">-</div>
                            <div class="text-[9px] text-dim">${label}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `);
    },

    _renderAdvancedTab() {
        return this._renderPageShell('高级设置', '这里放细调和高风险操作。普通用户不用进来。', `
            <details class="bg-[#111113] border border-white/5 rounded-lg p-4" open>
                <summary class="cursor-pointer text-sm font-bold text-white">外观细调</summary>
                <div class="mt-4 space-y-5">
                    ${this._renderThemeTab ? this._renderThemeTab() : ''}
                    ${this._renderTypographyTab ? this._renderTypographyTab() : ''}
                </div>
            </details>

            <details class="bg-[#111113] border border-white/5 rounded-lg p-4">
                <summary class="cursor-pointer text-sm font-bold text-white">创作工具细调</summary>
                <div class="mt-4">${this._renderCreativeSettingsTab ? this._renderCreativeSettingsTab() : '<div class="text-xs text-dim">创作工具设置加载中</div>'}</div>
            </details>

            <details class="bg-[#111113] border border-white/5 rounded-lg p-4">
                <summary class="cursor-pointer text-sm font-bold text-white">快捷键</summary>
                <div class="mt-4">${this._renderShortcutTab()}</div>
            </details>

            <details class="bg-red-900/10 border border-red-900/30 rounded-lg p-4">
                <summary class="cursor-pointer text-sm font-bold text-red-300">清理与重置</summary>
                <div class="mt-4 space-y-4">
                    <div class="grid md:grid-cols-3 gap-2">
                        ${[
                            { store:'chat_sessions', label:'对话记录', color:'blue' },
                            { store:'vectors', label:'向量数据', color:'cyan' },
                            { store:'prompts', label:'提示词', color:'orange' }
                        ].map(s => `
                            <button class="p-3 bg-black/30 rounded-lg border border-white/5 hover:border-${s.color}-500/30 text-xs text-dim hover:text-white transition text-left" onclick="if(confirm('确定清空 ${s.label}？')){Modules.settings._clearStore('${s.store}');UI.toast('${s.label} 已清空')}">
                                <i class="fa-solid fa-trash-can text-${s.color}-400/50 mr-1"></i>${s.label}
                            </button>
                        `).join('')}
                    </div>
                    <button class="btn btn-sm bg-red-600/20 text-red-300 border border-red-600/30 hover:bg-red-600 hover:text-white rounded-lg" onclick="if(confirm('确定恢复出厂设置？所有数据将永久丢失。')){indexedDB.deleteDatabase(DB.name);localStorage.clear();location.reload()}">
                        <i class="fa-solid fa-triangle-exclamation mr-1"></i>恢复出厂设置
                    </button>
                </div>
            </details>
        `);
    },

    _renderShortcutTab: () => `
        <div class="space-y-2">
            ${[
                { action:'AI 续写', key:'Ctrl + Enter' },
                { action:'唤起搜索', key:'Ctrl + K' },
                { action:'保存', key:'Ctrl + S' },
                { action:'切换侧边栏', key:'Ctrl + B' },
                { action:'撤销', key:'Ctrl + Z' }
            ].map(s => `
                <div class="flex justify-between items-center text-xs text-gray-300 bg-black/20 p-3 rounded-lg border border-white/5">
                    <span>${s.action}</span>
                    <kbd class="bg-black/50 px-3 py-1 rounded border border-white/10 font-mono text-white text-[11px]">${s.key}</kbd>
                </div>
            `).join('')}
        </div>`,

    _renderAboutTab() {
        return this._renderPageShell('关于', '系统信息和模块清单。', `
            <div class="bg-[#111113] border border-white/5 rounded-lg p-5 space-y-4">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-lg bg-accent/15 border border-accent/20 flex center text-accent text-xl"><i class="fa-solid fa-pen-nib"></i></div>
                    <div>
                        <div class="text-xl font-black text-white">Genesis Writer Center</div>
                        <div class="text-xs text-dim">简化设置版 · v3.3</div>
                    </div>
                </div>
                <p class="text-xs text-gray-400 leading-relaxed">数据默认保存在浏览器本地 IndexedDB。API 密钥也保存在本机浏览器里，不经过额外服务器。</p>
            </div>
            <div class="grid md:grid-cols-3 gap-2">
                ${['创世中心','项目管理','凤凰创作流','长篇执笔','世界引擎','融合拆书','创意工坊','万能工坊','工具中心','RAG上下文','三层记忆','阅读中心'].map(m => `
                    <div class="p-3 bg-[#111113] rounded-lg border border-white/5 text-xs text-gray-300"><i class="fa-solid fa-check text-green-400/60 mr-1"></i>${m}</div>
                `).join('')}
            </div>
        `);
    },

    _applyBeginnerDefaults() {
        localStorage.setItem('writing_style', '网络小说');
        localStorage.setItem('writing_pov', '第三人称限制');
        localStorage.setItem('writing_wordcount', '2000');
        localStorage.setItem('writing_context_len', '1500');
        localStorage.setItem('global_rules', '对话要有潜台词；少用抽象情绪词；每个场景保留具体动作和物件；章节末保留一个悬念。');
        localStorage.setItem('auto_memory', 'true');
        localStorage.setItem('auto_rag', 'true');
        localStorage.setItem('auto_save', 'true');
        localStorage.setItem('genesis_deai_intensity', 'medium');
        this._applyMemoryPreset('balanced', 5, 1500, false);
        UI.toast('已应用新手默认设置');
        this.refresh();
    },

    _applyExperiencePreset(type) {
        if (type === 'focus') {
            ThemeEngine.applyTheme('dark_gold');
            ThemeEngine.applyFont('system');
            ThemeEngine.applyEditorFont('serif');
            ThemeEngine.setEditorSize(17);
            ThemeEngine.setEditorLineHeight(1.8);
            ThemeEngine.setAnimSpeed('fast');
        }
        if (type === 'bright') {
            ThemeEngine.applyTheme('light');
            ThemeEngine.applyFont('system');
            ThemeEngine.applyEditorFont('sans');
            ThemeEngine.setEditorSize(16);
            ThemeEngine.setEditorLineHeight(1.7);
            ThemeEngine.setAnimSpeed('normal');
        }
        if (type === 'dense') {
            ThemeEngine.applyTheme('dark_blue');
            ThemeEngine.applyFont('sans');
            ThemeEngine.applyEditorFont('mono');
            ThemeEngine.setEditorSize(14);
            ThemeEngine.setEditorLineHeight(1.5);
            ThemeEngine.setSidebarWidth(210);
            ThemeEngine.setAnimSpeed('fast');
        }
        UI.toast('界面方案已应用');
        this.refresh();
    },

    _saveWritingBasics() {
        localStorage.setItem('writing_style', document.getElementById('s-style')?.value || '网络小说');
        localStorage.setItem('writing_pov', document.getElementById('s-pov')?.value || '第三人称限制');
        localStorage.setItem('writing_wordcount', document.getElementById('s-wordcount')?.value || '2000');
        localStorage.setItem('writing_context_len', document.getElementById('s-context-len')?.value || '1500');
        localStorage.setItem('global_rules', document.getElementById('s-global-rules')?.value || '');
        UI.toast('写作设置已保存');
    },

    _applyMemoryPreset(id, topk, windowSize, refresh = true) {
        localStorage.setItem('rag_mode', id);
        localStorage.setItem('rag_topk', String(topk));
        localStorage.setItem('rag_window', String(windowSize));
        UI.toast('上下文方案已应用');
        if (refresh) this.refresh();
    },

    _saveMemoryBasics() {
        localStorage.setItem('rag_topk', document.getElementById('rag-topk-input')?.value || '5');
        localStorage.setItem('rag_window', document.getElementById('rag-window-input')?.value || '1500');
        UI.toast('上下文设置已保存');
    },

    async _refreshSetupStatus() {
        const set = (id, ok, text) => {
            const el = document.getElementById('setup-' + id);
            if (el) {
                el.className = `text-[10px] ${ok ? 'text-green-300' : 'text-amber-300'}`;
                el.innerHTML = `<i class="fa-solid ${ok ? 'fa-check' : 'fa-circle-exclamation'} mr-1"></i>${text}`;
            }
        };
        const textApis = await DB.getAll('text_api_pool').catch(() => []);
        const masterText = textApis.some(a => a.is_master === 1 || a.is_active === 1);
        set('text-api', masterText, masterText ? '主控已配置' : '还没配置');
        set('writing', !!localStorage.getItem('global_rules'), localStorage.getItem('global_rules') ? '已设置' : '可用默认值');
        set('backup', true, '可随时导出');
    },

    _renderApiModal: () => `
        <div id="api-modal" class="fixed inset-0 bg-black/90 hidden z-[100] flex center backdrop-blur-md overflow-y-auto py-8">
            <div class="bg-[#121212] border border-white/10 rounded-2xl p-6 w-[480px] flex flex-col gap-5 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center">
                    <h3 class="text-base font-bold text-white" id="api-modal-title">旧版 API 配置</h3>
                    <button class="w-7 h-7 rounded-full hover:bg-white/10 text-dim flex center" onclick="document.getElementById('api-modal').classList.add('hidden')"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="space-y-3">
                    <input id="api-name" class="input bg-black/30 border-white/10 h-9 text-sm text-white" placeholder="配置名称">
                    <select id="api-provider" class="input bg-black/30 border-white/10 h-9 text-sm text-white">
                        <option value="custom">OpenAI 兼容</option>
                        <option value="gemini">Google Gemini</option>
                        <option value="claude">Anthropic Claude</option>
                        <option value="minimax">MiniMax</option>
                    </select>
                    <input id="api-url" class="input bg-black/30 border-white/10 h-9 text-sm text-white font-mono" placeholder="https://api.openai.com/v1">
                    <input id="api-key" class="input bg-black/30 border-white/10 h-9 text-sm text-white font-mono" type="password" placeholder="sk-...">
                    <input id="api-model" class="input bg-black/30 border-white/10 h-9 text-sm text-white font-mono" placeholder="模型名">
                    <input id="api-temp" type="hidden" value="">
                    <input id="api-tokens" type="hidden" value="">
                </div>
                <div class="flex gap-2 justify-end">
                    <button class="btn btn-sm bg-white/5 text-dim hover:text-white" onclick="document.getElementById('api-modal').classList.add('hidden')">取消</button>
                    <button class="btn btn-sm bg-white text-black hover:bg-gray-200 font-bold px-6" onclick="Modules.settings.savePool()">保存</button>
                </div>
            </div>
        </div>`
};
