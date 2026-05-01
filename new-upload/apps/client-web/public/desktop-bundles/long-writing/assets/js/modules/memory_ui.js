/**
 * 三层记忆中心
 * 目标：临时记 -> 长期存 -> 生成上下文包 -> 同步到 RAG。
 */
Modules.memory_system = {
    activeTab: 'dashboard',
    _pmFilter: 'all',
    _pmSearch: '',
    _lastContext: '',

    _esc(s) {
        const d = document.createElement('div');
        d.textContent = s == null ? '' : String(s);
        return d.innerHTML;
    },

    _js(s) {
        return String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
    },

    render() {
        const tabs = [
            { id: 'dashboard', icon: 'fa-house', text: '开始', sub: '一键操作', color: 'text-purple-400' },
            { id: 'context', icon: 'fa-layer-group', text: '记忆包', sub: '给AI使用', color: 'text-cyan-400' },
            { id: 'working', icon: 'fa-bolt', text: '工作记忆', sub: '临时、当前任务', color: 'text-yellow-400' },
            { id: 'session', icon: 'fa-comments', text: '会话记忆', sub: '对话过程', color: 'text-blue-400' },
            { id: 'web_chat', icon: 'fa-comments', text: '对话记忆', sub: '网页对话共享', color: 'text-fuchsia-400' },
            { id: 'persistent', icon: 'fa-database', text: '长期记忆', sub: '规则、设定、角色', color: 'text-green-400' }
        ];
        return `
        <div class="mem-shell flex h-full bg-[#08080a] overflow-hidden">
            <div class="mem-sidebar w-72 shrink-0 flex flex-col bg-[#0e0e10] border-r border-white/5">
                <div class="mem-sidebar-header p-4 border-b border-white/5 bg-gradient-to-r from-purple-900/20 to-transparent">
                    <div class="flex items-center gap-2">
                        <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex center text-white text-sm shadow-lg shadow-purple-500/20"><i class="fa-solid fa-brain"></i></div>
                        <div>
                            <div class="font-bold text-white text-sm">三层记忆</div>
                            <div class="text-[10px] text-dim">临时记 · 长期存 · 组上下文</div>
                        </div>
                    </div>
                </div>
                <div class="mem-tabs p-2 space-y-1">
                    ${tabs.map(t => `
                        <button class="mem-tab-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${this.activeTab === t.id ? 'bg-white/10 text-white border border-white/10' : 'text-dim hover:bg-white/5 border border-transparent'}" onclick="Modules.memory_system.switchTab('${t.id}')">
                            <i class="fa-solid ${t.icon} ${t.color} w-5 text-center"></i>
                            <span class="flex-1">
                                <span class="block text-xs font-bold">${t.text}</span>
                                <span class="block text-[9px] opacity-60 mt-0.5">${t.sub}</span>
                            </span>
                        </button>
                    `).join('')}
                </div>
                <div class="mem-actions mt-auto p-3 border-t border-white/5 space-y-1">
                    <button class="btn btn-xs w-full bg-purple-600/20 text-purple-300 border border-purple-600/30" onclick="Modules.memory_system.smartCompress()"><i class="fa-solid fa-broom mr-1"></i>智能整理</button>
                    <button class="btn btn-xs w-full bg-cyan-600/20 text-cyan-300 border border-cyan-600/30" onclick="Modules.memory_system.syncWorkingToRAG()"><i class="fa-solid fa-magnifying-glass-chart mr-1"></i>工作记忆入RAG</button>
                    <div class="flex gap-1">
                        <button class="btn btn-xs flex-1 bg-white/5 text-dim" onclick="Modules.memory_system.exportAll()"><i class="fa-solid fa-download mr-1"></i>导出</button>
                        <button class="btn btn-xs flex-1 bg-white/5 text-dim" onclick="Modules.memory_system.importData()"><i class="fa-solid fa-upload mr-1"></i>导入</button>
                    </div>
                </div>
            </div>

            <div class="mem-workspace flex-1 overflow-y-auto p-5" id="mem-workspace">
                ${this._renderTab()}
            </div>
        </div>`;
    },

    _renderTab() {
        if (this.activeTab === 'dashboard') return this._renderDashboard();
        if (this.activeTab === 'context') return this._renderContextBuilder();
        if (this.activeTab === 'working') return this._renderWorking();
        if (this.activeTab === 'session') return this._renderSession();
        if (this.activeTab === 'web_chat') return this._renderWebChatMemory();
        if (this.activeTab === 'persistent') return this._renderPersistent();
        return '';
    },

    _renderDashboard() {
        const actions = [
            ['working', '临时记一下', '当前任务马上要用的信息', 'fa-bolt', 'yellow'],
            ['persistent', '存成长期规则', '角色设定、世界规则、写作偏好', 'fa-database', 'green'],
            ['context', '生成记忆包', '把记忆、RAG、实体组给AI', 'fa-layer-group', 'cyan'],
            ['sync_rag', '同步到RAG', '让工作记忆可被检索', 'fa-magnifying-glass-chart', 'blue'],
            ['compress', '智能整理', '压缩旧工作记忆，保留重点', 'fa-broom', 'purple'],
            ['world', '同步世界实体', '把世界引擎实体接入记忆', 'fa-globe', 'emerald']
        ];
        return `
        <div class="space-y-4">
            <div>
                <div class="text-[10px] text-purple-300/80 font-bold tracking-wider">从这里开始</div>
                <div class="text-lg font-black text-white mt-1">你想让系统记住什么？</div>
                <div class="text-xs text-dim mt-1">临时内容放工作记忆；不会变的设定放长期记忆；写作前用记忆包交给AI。</div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                ${actions.map(([id, label, desc, icon, color]) => `
                    <button class="rounded-lg border border-${color}-500/20 bg-${color}-500/10 p-4 text-left hover:bg-${color}-500/20 hover:border-${color}-500/40 transition min-h-[96px]" onclick="Modules.memory_system.quickAction('${id}')">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid ${icon} text-${color}-300"></i>
                            <span class="text-sm font-black text-${color}-100">${label}</span>
                        </div>
                        <div class="text-[11px] text-dim mt-2 leading-relaxed">${desc}</div>
                    </button>
                `).join('')}
            </div>
            <div class="grid grid-cols-2 xl:grid-cols-4 gap-3">
                <div class="bg-[#111113] border border-white/5 rounded-lg p-4">
                    <div class="flex items-center gap-2 mb-2"><i class="fa-solid fa-bolt text-yellow-400"></i><span class="text-xs font-bold text-white">工作记忆</span></div>
                    <div class="text-2xl font-bold text-yellow-400" id="mem-stat-working">-</div>
                    <div class="h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden"><div class="h-full bg-yellow-500 rounded-full" id="mem-bar-working" style="width:0%"></div></div>
                    <div class="text-[10px] text-dim mt-1" id="mem-stat-working-detail">- / -</div>
                </div>
                <div class="bg-[#111113] border border-white/5 rounded-lg p-4">
                    <div class="flex items-center gap-2 mb-2"><i class="fa-solid fa-comments text-blue-400"></i><span class="text-xs font-bold text-white">会话记忆</span></div>
                    <div class="text-2xl font-bold text-blue-400" id="mem-stat-session">-</div>
                    <div class="text-[10px] text-dim mt-1" id="mem-stat-session-detail">- 个会话</div>
                </div>
                <div class="bg-[#111113] border border-white/5 rounded-lg p-4">
                    <div class="flex items-center gap-2 mb-2"><i class="fa-solid fa-database text-green-400"></i><span class="text-xs font-bold text-white">长期记忆</span></div>
                    <div class="text-2xl font-bold text-green-400" id="mem-stat-persistent">-</div>
                    <div class="text-[10px] text-dim mt-1" id="mem-stat-persistent-detail">平均重要度: -</div>
                </div>
                <div class="bg-[#111113] border border-white/5 rounded-lg p-4">
                    <div class="flex items-center gap-2 mb-2"><i class="fa-solid fa-lock text-violet-400"></i><span class="text-xs font-bold text-white">永久记忆</span></div>
                    <div class="text-2xl font-bold text-violet-400" id="mem-stat-permanent">-</div>
                    <div class="text-[10px] text-dim mt-1">用户主动标记，不衰减</div>
                </div>
            </div>
            <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div class="bg-[#111113] border border-white/5 rounded-lg p-4">
                    <div class="text-xs font-bold text-white mb-3"><i class="fa-solid fa-chart-pie text-purple-400 mr-2"></i>长期记忆分类</div>
                    <div id="mem-cat-dist" class="flex flex-wrap gap-2"></div>
                </div>
                <div class="bg-[#111113] border border-white/5 rounded-lg p-4">
                    <div class="text-xs font-bold text-white mb-3"><i class="fa-solid fa-clock text-yellow-400 mr-2"></i>最近工作记忆</div>
                    <div id="mem-recent-working" class="space-y-1 max-h-40 overflow-y-auto"></div>
                </div>
            </div>
        </div>`;
    },

    _renderContextBuilder() {
        return `
        <div class="grid grid-cols-1 xl:grid-cols-[380px_minmax(0,1fr)] gap-4 min-h-full">
            <div class="space-y-4">
                <div class="bg-[#111113] border border-white/5 rounded-lg p-4 space-y-3">
                    <div>
                        <div class="text-sm font-black text-white">生成记忆包</div>
                        <div class="text-[11px] text-dim mt-1">给关键词和章节号，系统会合并工作记忆、长期记忆、RAG、实体、世界观。</div>
                    </div>
                    <input id="mem-ctx-query" class="input w-full bg-black/30 border-white/10 h-9 text-xs text-white" placeholder="例：女主身份暴露、宗门试炼、反派伏笔">
                    <div class="grid grid-cols-2 gap-2">
                        <input id="mem-ctx-chapter" type="number" class="input bg-black/30 border-white/10 h-9 text-xs text-white" placeholder="章节号，可空" min="1">
                        <select id="mem-ctx-budget" class="input bg-black/30 border-white/10 h-9 text-xs text-white">
                            <option value="3000">短包 3000</option>
                            <option value="5000" selected>标准 5000</option>
                            <option value="8000">长包 8000</option>
                        </select>
                    </div>
                    <div class="grid grid-cols-2 gap-1.5 text-[10px]">
                        ${[
                            ['include-working','工作记忆',true],
                            ['include-persistent','长期记忆',true],
                            ['include-rag','RAG检索',true],
                            ['include-world','实体/世界观',true]
                        ].map(([id, label, checked]) => `
                            <label class="flex items-center gap-2 rounded-lg bg-white/5 px-2 py-2 text-dim">
                                <input id="mem-${id}" type="checkbox" class="accent-cyan-500" ${checked ? 'checked' : ''}>
                                <span>${label}</span>
                            </label>
                        `).join('')}
                    </div>
                    <button class="btn w-full bg-cyan-600 hover:bg-cyan-500 text-white h-9 rounded-lg font-bold" onclick="Modules.memory_system.buildContextPack()"><i class="fa-solid fa-layer-group mr-1"></i>生成给AI的记忆包</button>
                    <div class="grid grid-cols-3 gap-1.5">
                        <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.memory_system.fillContextQuery('当前章节续写')">续写</button>
                        <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.memory_system.fillContextQuery('角色关系和状态变化')">角色</button>
                        <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.memory_system.fillContextQuery('世界规则和禁写点')">设定</button>
                    </div>
                </div>
                <div class="bg-[#111113] border border-white/5 rounded-lg p-4 space-y-2">
                    <div class="text-xs font-bold text-white"><i class="fa-solid fa-route text-cyan-400 mr-2"></i>记忆流向</div>
                    ${[
                        ['工作记忆', '当前任务短期使用，刷新可能丢失'],
                        ['会话记忆', '按对话沉淀，适合回看过程'],
                        ['长期记忆', '角色、设定、风格规则，长期保留'],
                        ['RAG索引', '可被关键词检索，用于组上下文']
                    ].map(([title, desc], i) => `
                        <div class="flex gap-2 text-[10px] text-dim">
                            <span class="w-5 h-5 rounded bg-cyan-500/10 text-cyan-300 flex center font-bold">${i + 1}</span>
                            <span><b class="text-white">${title}</b>：${desc}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="bg-[#111113] border border-white/5 rounded-lg flex flex-col min-h-[520px]">
                <div class="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                    <i class="fa-solid fa-file-code text-cyan-400 text-xs"></i>
                    <div class="text-xs font-bold text-white flex-1">记忆包结果</div>
                    <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.memory_system.copyContext()"><i class="fa-solid fa-copy"></i></button>
                    <button class="btn btn-xs bg-green-600/20 text-green-300" onclick="Modules.memory_system.saveContextAsLongTerm()"><i class="fa-solid fa-database mr-1"></i>存长期</button>
                </div>
                <div id="mem-ctx-output" class="flex-1 overflow-y-auto p-4 text-xs text-gray-300 leading-relaxed whitespace-pre-wrap font-mono">${this._esc(this._lastContext || '暂无记忆包。')}</div>
            </div>
        </div>`;
    },

    _renderWorking() {
        return `
        <div class="space-y-4">
            <div class="bg-[#111113] border border-white/5 rounded-lg p-4 space-y-3">
                <div>
                    <div class="text-sm font-black text-white">临时记一下</div>
                    <div class="text-[11px] text-dim mt-1">适合当前章节、当前任务马上要用的信息。重要内容可以一键升为长期记忆。</div>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <select id="mem-wk-type" class="input bg-black/30 border-white/10 h-9 text-xs text-white">
                        <option value="note">笔记</option>
                        <option value="conversation">对话</option>
                        <option value="generation">生成</option>
                        <option value="search">检索</option>
                        <option value="rule">规则</option>
                    </select>
                    <select id="mem-wk-priority" class="input bg-black/30 border-white/10 h-9 text-xs text-white">
                        <option value="2">普通</option>
                        <option value="3" selected>重要</option>
                        <option value="5">必须记住</option>
                    </select>
                    <input id="mem-wk-module" class="input bg-black/30 border-white/10 h-9 text-xs text-white" placeholder="模块，如 writer">
                    <input id="mem-wk-tags" class="input bg-black/30 border-white/10 h-9 text-xs text-white" placeholder="标签，逗号分隔">
                </div>
                <textarea id="mem-wk-content" class="textarea w-full bg-black/30 border-white/10 h-24 text-xs text-gray-300" placeholder="输入要临时记住的内容..."></textarea>
                <div class="flex gap-2">
                    <button class="btn btn-sm bg-yellow-600/20 text-yellow-300 border border-yellow-600/30 hover:bg-yellow-600 hover:text-white rounded-lg" onclick="Modules.memory_system.addWorking()"><i class="fa-solid fa-plus mr-1"></i>加入工作记忆</button>
                    <button class="btn btn-sm bg-cyan-600/20 text-cyan-300 border border-cyan-600/30 rounded-lg" onclick="Modules.memory_system.syncWorkingToRAG()"><i class="fa-solid fa-magnifying-glass-chart mr-1"></i>同步到RAG</button>
                    <button class="btn btn-sm bg-white/5 text-dim rounded-lg" onclick="MemorySystem.clearWorking();Modules.memory_system.loadWorking();UI.toast('工作记忆已清空')"><i class="fa-solid fa-trash mr-1"></i>清空临时</button>
                </div>
            </div>
            <div class="space-y-2" id="mem-working-list"></div>
        </div>`;
    },

    _renderSession() {
        return `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <div>
                    <div class="text-sm font-black text-white">会话记忆</div>
                    <div class="text-[11px] text-dim mt-1">按对话会话保存，可以把有价值的条目提升到长期记忆。</div>
                </div>
                <button class="btn btn-xs bg-red-600/20 text-red-300 border border-red-600/30 rounded-lg" onclick="Modules.memory_system.clearAllSessions()"><i class="fa-solid fa-trash mr-1"></i>清空全部</button>
            </div>
            <div id="mem-session-list" class="space-y-2"></div>
        </div>`;
    },

    _renderWebChatMemory() {
        return `
        <div class="space-y-4">
            <div class="bg-[#111113] border border-fuchsia-500/20 rounded-lg p-4">
                <div class="flex flex-col md:flex-row md:items-center gap-3">
                    <div class="flex-1">
                        <div class="text-sm font-black text-white"><i class="fa-solid fa-comments text-fuchsia-400 mr-2"></i>网页对话记忆</div>
                        <div class="text-[11px] text-dim mt-1">单聊和会议室会自动沉淀到这里，并作为共享上下文交给后续模型。</div>
                    </div>
                    <div class="flex gap-2">
                        <button class="btn btn-xs bg-fuchsia-600/20 text-fuchsia-300 border border-fuchsia-600/30 rounded-lg" onclick="Modules.memory_system.syncWebChatMemory()"><i class="fa-solid fa-rotate mr-1"></i>同步网页对话</button>
                        <button class="btn btn-xs bg-white/5 text-dim rounded-lg" onclick="App.nav('web_chat')"><i class="fa-solid fa-comments mr-1"></i>打开对话</button>
                    </div>
                </div>
            </div>
            <div id="mem-webchat-list" class="space-y-2"></div>
        </div>`;
    },

    _renderPersistent() {
        const cats = [
            ['fact', '事实'],
            ['character', '角色'],
            ['setting', '设定'],
            ['plot', '情节'],
            ['style', '文风'],
            ['rule', '规则'],
            ['conversation', '对话'],
            ['promoted', '提升']
        ];
        return `
        <div class="space-y-4">
            <div class="bg-[#111113] border border-white/5 rounded-lg p-4 space-y-3">
                <div>
                    <div class="text-sm font-black text-white">存成长期记忆</div>
                    <div class="text-[11px] text-dim mt-1">适合不会轻易变的东西：人物底层欲望、世界规则、禁写点、固定文风。</div>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <select id="mem-pm-category" class="input bg-black/30 border-white/10 h-9 text-xs text-white">
                        ${cats.map(([id, label]) => `<option value="${id}">${label}</option>`).join('')}
                    </select>
                    <select id="mem-pm-importance" class="input bg-black/30 border-white/10 h-9 text-xs text-white">
                        <option value="0.5">普通</option>
                        <option value="0.7" selected>重要</option>
                        <option value="0.95">铁律</option>
                    </select>
                    <input id="mem-pm-module" class="input bg-black/30 border-white/10 h-9 text-xs text-white" placeholder="模块，如 world">
                    <input id="mem-pm-tags" class="input bg-black/30 border-white/10 h-9 text-xs text-white" placeholder="标签，逗号分隔">
                </div>
                <textarea id="mem-pm-content" class="textarea w-full bg-black/30 border-white/10 h-24 text-xs text-gray-300" placeholder="输入长期记忆内容..."></textarea>
                <button class="btn btn-sm bg-green-600/20 text-green-300 border border-green-600/30 hover:bg-green-600 hover:text-white rounded-lg" onclick="Modules.memory_system.addPersistent()"><i class="fa-solid fa-plus mr-1"></i>加入长期记忆</button>
            </div>
            <div class="flex flex-col lg:flex-row gap-2 lg:items-center">
                <div class="flex flex-wrap gap-1 text-[10px]">
                    ${[['all','全部'], ...cats].map(([id, label]) => `
                        <button class="px-2 py-1 rounded ${this._pmFilter === id ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-white/5 text-dim hover:text-white'}" onclick="Modules.memory_system._pmFilter='${id}';Modules.memory_system.loadPersistent()">${label}</button>
                    `).join('')}
                </div>
                <input id="mem-pm-search" class="input bg-black/30 border-white/10 h-8 text-xs text-white flex-1" placeholder="搜索长期记忆..." value="${this._esc(this._pmSearch)}" oninput="Modules.memory_system._pmSearch=this.value;Modules.memory_system.loadPersistent()">
            </div>
            <div id="mem-persistent-list" class="space-y-2"></div>
        </div>`;
    },

    switchTab(tab) {
        this.activeTab = tab;
        const ws = document.getElementById('mem-workspace');
        if (ws) ws.innerHTML = this._renderTab();
        this.init();
    },

    async init() {
        if (this.activeTab === 'dashboard') await this.loadDashboard();
        else if (this.activeTab === 'context') this.loadContextOutput();
        else if (this.activeTab === 'working') this.loadWorking();
        else if (this.activeTab === 'session') await this.loadSessions();
        else if (this.activeTab === 'web_chat') await this.loadWebChatMemory();
        else if (this.activeTab === 'persistent') await this.loadPersistent();
    },

    async loadDashboard() {
        try {
            const stats = await MemorySystem.getStats();
            const el = id => document.getElementById(id);
            if (el('mem-stat-working')) el('mem-stat-working').textContent = stats.workingCount;
            if (el('mem-stat-working-detail')) el('mem-stat-working-detail').textContent = `${stats.workingCount} / ${stats.workingMax}`;
            if (el('mem-bar-working')) el('mem-bar-working').style.width = Math.min(100, Math.round(stats.workingCount / stats.workingMax * 100)) + '%';
            if (el('mem-stat-session')) el('mem-stat-session').textContent = stats.sessionTotalItems;
            if (el('mem-stat-session-detail')) el('mem-stat-session-detail').textContent = `${stats.sessionCount} 个会话`;
            if (el('mem-stat-persistent')) el('mem-stat-persistent').textContent = stats.persistentCount;
            if (el('mem-stat-persistent-detail')) el('mem-stat-persistent-detail').textContent = `平均重要度: ${stats.avgImportance}`;
            if (el('mem-stat-permanent')) el('mem-stat-permanent').textContent = stats.permanentCount || 0;

            const distEl = el('mem-cat-dist');
            if (distEl) {
                const colors = { fact: 'blue', character: 'pink', setting: 'amber', plot: 'green', style: 'purple', rule: 'red', conversation: 'fuchsia', promoted: 'cyan', compress: 'violet', auto_extract: 'orange' };
                distEl.innerHTML = Object.entries(stats.categories || {}).map(([cat, count]) => {
                    const c = colors[cat] || 'gray';
                    return `<span class="px-2 py-1 rounded text-[10px] bg-${c}-500/15 text-${c}-400 border border-${c}-500/20">${this._esc(cat)}: ${count}</span>`;
                }).join('') || '<span class="text-[10px] text-dim">暂无数据</span>';
            }

            const recentEl = el('mem-recent-working');
            if (recentEl) {
                const recent = MemorySystem.working.slice(-8).reverse();
                recentEl.innerHTML = recent.length === 0
                    ? '<div class="text-[10px] text-dim">暂无工作记忆</div>'
                    : recent.map(m => `
                        <div class="flex items-center gap-2 text-[10px] py-1 px-2 rounded hover:bg-white/5">
                            <span class="px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-400 text-[9px]">${this._esc(m.type)}</span>
                            <span class="text-dim flex-1 truncate">${this._esc((m.content || '').slice(0, 80))}</span>
                            <span class="text-dim/50">P${m.priority}</span>
                        </div>
                    `).join('');
            }
        } catch (e) {
            console.warn('加载记忆总览失败:', e);
        }
    },

    quickAction(id) {
        if (id === 'sync_rag') return this.syncWorkingToRAG();
        if (id === 'compress') return this.smartCompress();
        if (id === 'world') return this.syncWorld();
        this.switchTab(id);
        setTimeout(() => {
            const focusMap = {
                working: 'mem-wk-content',
                persistent: 'mem-pm-content',
                context: 'mem-ctx-query'
            };
            document.getElementById(focusMap[id])?.focus();
        }, 80);
    },

    loadContextOutput() {
        const el = document.getElementById('mem-ctx-output');
        if (el) el.textContent = this._lastContext || '暂无记忆包。';
    },

    fillContextQuery(text) {
        const el = document.getElementById('mem-ctx-query');
        if (el) {
            el.value = text;
            el.focus();
        }
    },

    async buildContextPack() {
        const query = document.getElementById('mem-ctx-query')?.value?.trim();
        if (!query) return UI.toast('先输入要组包的关键词');
        const chapterNumRaw = document.getElementById('mem-ctx-chapter')?.value;
        const chapterNum = chapterNumRaw ? parseInt(chapterNumRaw) : null;
        const maxTokens = parseInt(document.getElementById('mem-ctx-budget')?.value || '5000');
        const output = document.getElementById('mem-ctx-output');
        if (output) output.textContent = '正在生成记忆包...';

        const ctx = await MemorySystem.buildBrainContext(query, {
            moduleName: 'writer',
            chapterNum,
            chapterId: chapterNum ? `ch_${chapterNum}` : null,
            maxTokens,
            includeWorking: document.getElementById('mem-include-working')?.checked !== false,
            includeSession: true,
            includePersistent: document.getElementById('mem-include-persistent')?.checked !== false,
            includeRAG: document.getElementById('mem-include-rag')?.checked !== false,
            includeEntities: document.getElementById('mem-include-world')?.checked !== false,
            includeWorldView: document.getElementById('mem-include-world')?.checked !== false,
            includeFusion: true,
            includeNexus: true,
            includeCycle: true
        });
        this._lastContext = `【记忆包查询】${query}${chapterNum ? `\n【章节】第${chapterNum}章` : ''}\n${ctx || '没有找到可用记忆。'}`;
        if (output) output.textContent = this._lastContext;
        UI.toast('记忆包已生成');
    },

    copyContext() {
        if (!this._lastContext) return UI.toast('暂无记忆包');
        Utils.copy(this._lastContext);
    },

    async saveContextAsLongTerm() {
        if (!this._lastContext) return UI.toast('暂无记忆包');
        await MemorySystem.addPersistent(this._lastContext.slice(0, 3000), 'context_pack', 0.75, ['context_pack', 'memory'], { source: 'memory_center', module: 'memory' });
        UI.toast('记忆包已存入长期记忆');
    },

    addWorking() {
        const content = document.getElementById('mem-wk-content')?.value?.trim();
        if (!content) return UI.toast('请输入内容');
        const type = document.getElementById('mem-wk-type')?.value || 'note';
        const priority = parseInt(document.getElementById('mem-wk-priority')?.value || '3');
        const module = document.getElementById('mem-wk-module')?.value?.trim() || '';
        const tags = (document.getElementById('mem-wk-tags')?.value || '').split(/[,，]/).map(t => t.trim()).filter(Boolean);
        MemorySystem.addWorking(content, type, priority, { module, tags, source: 'manual' });
        document.getElementById('mem-wk-content').value = '';
        document.getElementById('mem-wk-tags').value = '';
        this.loadWorking();
        UI.toast('已加入工作记忆');
    },

    loadWorking() {
        const listEl = document.getElementById('mem-working-list');
        if (!listEl) return;
        const items = MemorySystem.working.slice().reverse();
        if (!items.length) {
            listEl.innerHTML = '<div class="text-center text-dim text-xs py-8">工作记忆为空</div>';
            return;
        }
        listEl.innerHTML = items.map(m => `
            <div class="bg-[#111113] border border-white/5 rounded-lg p-3 hover:border-yellow-500/20">
                <div class="flex items-center gap-2 mb-1.5">
                    <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-yellow-500/15 text-yellow-400">${this._esc(m.type)}</span>
                    ${m.module ? `<span class="px-1.5 py-0.5 rounded text-[9px] bg-cyan-500/10 text-cyan-300">${this._esc(m.module)}</span>` : ''}
                    <span class="text-[9px] text-dim">P${m.priority}</span>
                    <span class="text-[9px] text-dim">访问${m.accessCount || 0}次</span>
                    <span class="text-[9px] text-dim ml-auto">${new Date(m.ts).toLocaleTimeString()}</span>
                </div>
                <div class="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">${this._esc((m.content || '').length > 500 ? (m.content || '').slice(0, 500) + '...' : m.content || '')}</div>
                ${(m.tags || []).length ? `<div class="flex flex-wrap gap-1 mt-1.5">${m.tags.map(t => `<span class="px-1.5 py-0.5 rounded text-[9px] bg-white/5 text-dim">${this._esc(t)}</span>`).join('')}</div>` : ''}
                <div class="flex gap-1 mt-2">
                    <button class="btn btn-xs bg-green-500/10 text-green-400" onclick="Modules.memory_system.promoteWorking('${m.id}')"><i class="fa-solid fa-arrow-up mr-1"></i>升长期</button>
                    <button class="btn btn-xs bg-cyan-500/10 text-cyan-300" onclick="Modules.memory_system.indexMemory('${m.id}')"><i class="fa-solid fa-magnifying-glass mr-1"></i>入RAG</button>
                    <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.memory_system.copyWorking('${m.id}')"><i class="fa-solid fa-copy mr-1"></i>复制</button>
                    <button class="btn btn-xs bg-red-500/10 text-red-400" onclick="MemorySystem.removeWorking('${m.id}');Modules.memory_system.loadWorking()"><i class="fa-solid fa-trash mr-1"></i>删除</button>
                </div>
            </div>
        `).join('');
    },

    async promoteWorking(id) {
        await MemorySystem.promoteToLongTerm(id);
        this.loadWorking();
        UI.toast('已提升为长期记忆');
    },

    copyWorking(id) {
        const m = MemorySystem.working.find(x => x.id === id);
        if (m) Utils.copy(m.content || '');
    },

    async indexMemory(id) {
        const r = await MemorySystem.indexMemoryToRAG(id);
        if (r?.success) UI.toast('已同步到RAG');
        else UI.toast(r?.error || '同步失败', 'error');
    },

    async syncWorkingToRAG() {
        if (!MemorySystem.working.length) return UI.toast('没有工作记忆可同步');
        const count = await MemorySystem.syncToRAG(3);
        UI.toast(`已同步 ${count} 条工作记忆到RAG`);
    },

    async loadSessions() {
        const listEl = document.getElementById('mem-session-list');
        if (!listEl) return;
        const sessions = await MemorySystem.getAllSessionIds();
        if (!sessions.length) {
            listEl.innerHTML = '<div class="text-center text-dim text-xs py-8">暂无会话记忆</div>';
            return;
        }
        listEl.innerHTML = sessions.map(s => `
            <div class="bg-[#111113] border border-white/5 rounded-lg p-3 hover:border-blue-500/20">
                <div class="flex items-center gap-2 mb-1">
                    <i class="fa-solid fa-comment text-blue-400 text-[10px]"></i>
                    <span class="text-xs font-bold text-white flex-1">${this._esc(s.id)}</span>
                    <span class="text-[10px] text-dim">${s.count} 条</span>
                    <span class="text-[10px] text-dim">${s.updatedAt ? new Date(s.updatedAt).toLocaleDateString() : ''}</span>
                </div>
                <div class="flex gap-1 mt-2">
                    <button class="btn btn-xs bg-blue-500/10 text-blue-400" onclick="Modules.memory_system.viewSession('${this._js(s.id)}')"><i class="fa-solid fa-eye mr-1"></i>查看</button>
                    <button class="btn btn-xs bg-red-500/10 text-red-400" onclick="Modules.memory_system.deleteSession('${this._js(s.id)}')"><i class="fa-solid fa-trash mr-1"></i>删除</button>
                </div>
                <div id="mem-session-items-${this._esc(s.id)}" class="hidden mt-2 space-y-1 max-h-60 overflow-y-auto"></div>
            </div>
        `).join('');
    },

    async viewSession(sessionId) {
        const container = document.getElementById('mem-session-items-' + sessionId);
        if (!container) return;
        if (!container.classList.contains('hidden')) {
            container.classList.add('hidden');
            return;
        }
        const items = await MemorySystem.getSessionItems(sessionId, 50);
        container.innerHTML = items.length === 0
            ? '<div class="text-[10px] text-dim">空会话</div>'
            : items.map(item => `
                <div class="flex items-start gap-2 text-[10px] py-1.5 px-2 rounded hover:bg-white/5 border-l-2 border-blue-500/20">
                    <div class="flex-1">
                        <div class="text-gray-300 whitespace-pre-wrap">${this._esc((item.content || '').length > 240 ? (item.content || '').slice(0, 240) + '...' : item.content || '')}</div>
                        <div class="flex gap-1 mt-1">
                            ${(item.tags || []).map(t => `<span class="px-1 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[8px]">${this._esc(t)}</span>`).join('')}
                            <span class="text-dim/50 ml-auto">${new Date(item.ts).toLocaleTimeString()}</span>
                        </div>
                    </div>
                    <button class="btn btn-xs bg-green-500/10 text-green-400 shrink-0" onclick="MemorySystem.sessionToLongTerm('${this._js(sessionId)}','${item.id}');UI.toast('已提升')"><i class="fa-solid fa-arrow-up"></i></button>
                </div>
            `).join('');
        container.classList.remove('hidden');
    },

    async deleteSession(sessionId) {
        if (!confirm('确定删除此会话记忆？')) return;
        await MemorySystem.deleteSession(sessionId);
        await this.loadSessions();
        UI.toast('已删除');
    },

    async loadWebChatMemory() {
        const listEl = document.getElementById('mem-webchat-list');
        if (!listEl) return;
        const saved = await DB.get('settings', 'web_chat_memory_index_v1').catch(() => null);
        const records = (saved?.records || []).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        if (!records.length) {
            listEl.innerHTML = `
                <div class="text-center text-dim text-xs py-10 rounded-lg border border-dashed border-white/10">
                    暂无网页对话记忆。去网页对话里聊几轮，或点“同步网页对话”。
                </div>`;
            return;
        }
        listEl.innerHTML = records.map(r => `
            <div class="bg-[#111113] border border-white/5 rounded-lg p-3 hover:border-fuchsia-500/25">
                <div class="flex items-center gap-2 mb-1.5">
                    <span class="px-1.5 py-0.5 rounded text-[9px] font-bold ${r.kind === 'room' ? 'bg-purple-500/15 text-purple-300' : 'bg-blue-500/15 text-blue-300'}">${r.kind === 'room' ? '会议室' : '单聊'}</span>
                    <span class="text-xs font-bold text-white flex-1 truncate">${this._esc(r.title || '网页对话')}</span>
                    <span class="text-[9px] text-dim">${r.count || 0} 条</span>
                    <span class="text-[9px] text-dim">${r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : ''}</span>
                </div>
                <div class="text-[11px] text-dim leading-relaxed whitespace-pre-wrap">${this._esc((r.summary || r.preview || '').slice(0, 520))}${(r.summary || '').length > 520 ? '...' : ''}</div>
                <div class="flex items-center gap-1 mt-2">
                    <button class="btn btn-xs bg-fuchsia-500/10 text-fuchsia-300" onclick="Modules.memory_system.openWebChatRecord('${this._js(r.kind)}','${this._js(r.sourceId || r.id)}')"><i class="fa-solid fa-arrow-up-right-from-square mr-1"></i>接着聊</button>
                    <button class="btn btn-xs bg-green-500/10 text-green-300" onclick="Modules.memory_system.promoteWebChatMemory('${this._js(r.id)}')"><i class="fa-solid fa-database mr-1"></i>固化</button>
                    <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.memory_system.copyWebChatMemory('${this._js(r.id)}')"><i class="fa-solid fa-copy mr-1"></i>复制</button>
                </div>
            </div>
        `).join('');
    },

    async syncWebChatMemory() {
        if (Modules.web_chat?.syncAllToMemory) {
            await Modules.web_chat.syncAllToMemory();
        }
        await this.loadWebChatMemory();
    },

    async openWebChatRecord(kind, id) {
        App.nav('web_chat');
        setTimeout(() => {
            if (kind === 'room') Modules.web_chat?.selectRoomRecord?.(id);
            else Modules.web_chat?.openChatRecord?.(id);
        }, 120);
    },

    async copyWebChatMemory(id) {
        const saved = await DB.get('settings', 'web_chat_memory_index_v1').catch(() => null);
        const r = (saved?.records || []).find(x => x.id === id);
        if (r) Utils.copy(r.summary || r.preview || '');
    },

    async promoteWebChatMemory(id) {
        const saved = await DB.get('settings', 'web_chat_memory_index_v1').catch(() => null);
        const r = (saved?.records || []).find(x => x.id === id);
        if (!r) return UI.toast('找不到这条对话记忆');
        await MemorySystem.addPersistent((r.summary || r.preview || '').slice(0, 5000), 'conversation', 0.9, ['网页对话', r.kind === 'room' ? '会议室' : '单聊', '手动固化'], { source: 'web_chat_memory', module: 'web_chat' });
        UI.toast('已固化为长期记忆');
    },

    async loadPersistent() {
        const listEl = document.getElementById('mem-persistent-list');
        if (!listEl) return;
        let items = await MemorySystem.getAllPersistent();
        if (this._pmFilter !== 'all') items = items.filter(m => m.category === this._pmFilter);
        if (this._pmSearch) {
            const q = this._pmSearch.toLowerCase();
            items = items.filter(m => ((m.content || '') + ' ' + (m.tags || []).join(' ') + ' ' + (m.module || '')).toLowerCase().includes(q));
        }
        if (!items.length) {
            listEl.innerHTML = '<div class="text-center text-dim text-xs py-8">暂无长期记忆</div>';
            return;
        }
        const colors = { fact: 'blue', character: 'pink', setting: 'amber', plot: 'green', style: 'purple', rule: 'red', conversation: 'fuchsia', promoted: 'cyan', context_pack: 'teal', compress: 'violet' };
        listEl.innerHTML = items.sort((a, b) => (b.importance || 0) - (a.importance || 0)).map(m => {
            const c = colors[m.category] || 'gray';
            const imp = Math.round((m.importance || 0) * 100);
            return `
            <div class="bg-[#111113] border border-white/5 rounded-lg p-3 hover:border-green-500/20">
                <div class="flex items-center gap-2 mb-1.5">
                    <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-${c}-500/15 text-${c}-400">${this._esc(m.category)}</span>
                    ${m.module ? `<span class="px-1.5 py-0.5 rounded text-[9px] bg-cyan-500/10 text-cyan-300">${this._esc(m.module)}</span>` : ''}
                    <div class="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden"><div class="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full" style="width:${imp}%"></div></div>
                    <span class="text-[9px] text-dim font-mono">${(m.importance || 0).toFixed(2)}</span>
                </div>
                <div class="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">${this._esc((m.content || '').length > 700 ? (m.content || '').slice(0, 700) + '...' : m.content || '')}</div>
                ${(m.tags || []).length ? `<div class="flex flex-wrap gap-1 mt-1.5">${m.tags.map(t => `<span class="px-1.5 py-0.5 rounded text-[9px] bg-white/5 text-dim">${this._esc(t)}</span>`).join('')}</div>` : ''}
                <div class="flex items-center gap-1 mt-2">
                    <span class="text-[9px] text-dim mr-auto">${this._esc(m.source || 'manual')} · ${new Date(m.ts).toLocaleDateString()}</span>
                    <button class="btn btn-xs bg-cyan-500/10 text-cyan-300" onclick="Modules.memory_system.indexMemory('${m.id}')"><i class="fa-solid fa-magnifying-glass"></i></button>
                    <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.memory_system.copyPersistent('${m.id}')"><i class="fa-solid fa-copy"></i></button>
                    <button class="btn btn-xs bg-red-500/10 text-red-400" onclick="Modules.memory_system.deletePersistent('${m.id}')"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>`;
        }).join('');
    },

    async addPersistent() {
        const content = document.getElementById('mem-pm-content')?.value?.trim();
        if (!content) return UI.toast('请输入内容');
        const category = document.getElementById('mem-pm-category')?.value || 'fact';
        const importance = parseFloat(document.getElementById('mem-pm-importance')?.value || '0.7');
        const module = document.getElementById('mem-pm-module')?.value?.trim() || '';
        const tags = (document.getElementById('mem-pm-tags')?.value || '').split(/[,，]/).map(t => t.trim()).filter(Boolean);
        await MemorySystem.addPersistent(content, category, importance, tags, { source: 'manual', module });
        document.getElementById('mem-pm-content').value = '';
        document.getElementById('mem-pm-tags').value = '';
        await this.loadPersistent();
        UI.toast('已加入长期记忆');
    },

    async deletePersistent(id) {
        if (!confirm('确定删除此长期记忆？')) return;
        await MemorySystem.deletePersistent(id);
        await this.loadPersistent();
        UI.toast('已删除');
    },

    async copyPersistent(id) {
        const items = await MemorySystem.getAllPersistent();
        const m = items.find(x => x.id === id);
        if (m) Utils.copy(m.content || '');
    },

    async smartCompress() {
        UI.toast('正在整理记忆...');
        const result = await MemorySystem.smartCompress();
        if (result.compressed) {
            UI.toast(`已整理：工作记忆 ${result.workingBefore} -> ${result.workingAfter}`);
        } else {
            UI.toast(result.reason || '暂无需要整理的记忆');
        }
        await this.init();
    },

    async syncWorld() {
        UI.toast('正在同步世界实体...');
        const r = await MemorySystem.syncWithWorldEngine();
        UI.toast(`已同步 ${r.synced || 0} 条实体记忆`);
        await this.init();
    },

    async decayImportance() {
        await MemorySystem.decayImportance();
        UI.toast('重要度衰减已执行');
        await this.init();
    },

    async clearAllSessions() {
        if (!confirm('确定清空所有会话记忆？此操作不可恢复。')) return;
        await MemorySystem.clearAllSessions();
        await this.loadSessions();
        UI.toast('已清空所有会话记忆');
    },

    async exportAll() {
        try {
            const data = await MemorySystem.exportAll();
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = '三层记忆_' + new Date().toISOString().slice(0, 10) + '.json';
            a.click();
            URL.revokeObjectURL(url);
            UI.toast('导出成功');
        } catch (e) {
            UI.toast('导出失败: ' + e.message, 'error');
        }
    },

    importData() {
        let input = document.getElementById('mem-import-input');
        if (!input) {
            input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.id = 'mem-import-input';
            input.style.display = 'none';
            document.body.appendChild(input);
        }
        input.value = '';
        input.onchange = async e => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const data = JSON.parse(await file.text());
                let count = 0;
                if (data.persistent && Array.isArray(data.persistent)) count += await MemorySystem.importPersistent(data.persistent);
                if (data.working && Array.isArray(data.working)) {
                    for (const item of data.working) {
                        if (!item.content) continue;
                        MemorySystem.addWorking(item.content, item.type || 'note', item.priority || 3, {
                            tags: item.tags || [],
                            module: item.module || '',
                            source: 'import'
                        });
                        count++;
                    }
                }
                UI.toast(`导入成功，共 ${count} 条记忆`);
                await this.init();
            } catch (err) {
                UI.toast('导入失败: ' + err.message, 'error');
            }
        };
        input.click();
    }
};
