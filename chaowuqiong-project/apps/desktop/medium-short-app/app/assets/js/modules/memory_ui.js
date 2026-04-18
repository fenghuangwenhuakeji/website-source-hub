/**
 * 三层记忆 UI 模块
 * Modules.memory_system
 */
// ================================================================
// ========== 模块3: 三层记忆 (旗舰版 UI) ==========
//       批量操作 · 标签过滤 · 导入导出 · 重要度可视化
// ================================================================
Modules.memory_system = {
    activeTab: 'dashboard',
    _pmFilter: 'all',
    _pmSearch: '',

    render() {
        const MS = this;
        const tabs = [
            { id: 'dashboard', icon: 'fa-chart-pie', text: '总览', color: 'text-purple-400' },
            { id: 'working', icon: 'fa-bolt', text: '工作记忆', color: 'text-yellow-400' },
            { id: 'session', icon: 'fa-comments', text: '会话记忆', color: 'text-blue-400' },
            { id: 'persistent', icon: 'fa-database', text: '长期记忆', color: 'text-green-400' }
        ];
        return `
        <div class="flex h-full bg-[#F8F9FA] overflow-hidden">
            <!-- 左侧导航 -->
            <div class="w-64 shrink-0 flex flex-col bg-[#F1F3F5] border-r border-gray-200">
                <!-- 标题 -->
                <div class="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-900/20 to-transparent">
                    <div class="flex items-center gap-2">
                        <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex center text-gray-800 text-sm shadow-lg shadow-purple-500/20"><i class="fa-solid fa-brain"></i></div>
                        <div>
                            <div class="font-bold text-white text-base">三层记忆</div>
                            <div class="text-xs text-gray-200 font-bold">工作 · 会话 · 长期</div>
                        </div>
                    </div>
                </div>
                <!-- Tab -->
                <div class="p-2 space-y-1">
                    ${tabs.map(t => `
                        <button class="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left text-sm font-bold transition-all ${MS.activeTab === t.id ? 'bg-gradient-to-r from-gray-200 to-gray-100 text-gray-800 border-2 border-gray-300 shadow-sm' : 'text-gray-600 hover:bg-gray-100 border-2 border-transparent'}" onclick="Modules.memory_system.switchTab('${t.id}')">
                            <i class="fa-solid ${t.icon} ${t.color} w-5 text-center text-base"></i>
                            <span class="text-sm">${t.text}</span>
                        </button>
                    `).join('')}
                </div>
                <!-- 操作 -->
                <div class="mt-auto p-3 border-t border-gray-200 space-y-1">
                    <button class="btn py-2.5 w-full bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-400 hover:to-violet-400 text-white border-none shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all hover:scale-105 rounded-lg" onclick="Modules.memory_system.aiCompress()">
                        <i class="fa-solid fa-compress mr-2"></i>
                        <span class="text-sm font-bold">AI 压缩工作记忆</span>
                    </button>
                    <button class="btn py-2.5 w-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-400 hover:to-gray-500 text-white border-none shadow-lg shadow-gray-500/30 hover:shadow-gray-500/50 transition-all hover:scale-105 rounded-lg" onclick="Modules.memory_system.decayImportance()">
                        <i class="fa-solid fa-arrow-trend-down mr-2"></i>
                        <span class="text-sm font-bold">执行重要度衰减</span>
                    </button>
                    <div class="flex gap-1">
                        <button class="btn py-2.5 flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white border-none shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all hover:scale-105 rounded-lg" onclick="Modules.memory_system.exportAll()">
                        <i class="fa-solid fa-download mr-1.5"></i>
                        <span class="text-xs font-bold">导出</span>
                    </button>
                        <button class="btn py-2.5 flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white border-none shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all hover:scale-105 rounded-lg" onclick="Modules.memory_system.importData()">
                        <i class="fa-solid fa-upload mr-1.5"></i>
                        <span class="text-xs font-bold">导入</span>
                    </button>
                    </div>
                </div>
            </div>
            <!-- 右侧工作区 -->
            <div class="flex-1 overflow-y-auto p-5" id="mem-workspace">
                ${MS._renderTab()}
            </div>
        </div>`;
    },

    _renderTab() {
        const tab = this.activeTab;
        if (tab === 'dashboard') return this._renderDashboard();
        if (tab === 'working') return this._renderWorking();
        if (tab === 'session') return this._renderSession();
        if (tab === 'persistent') return this._renderPersistent();
        return '';
    },

    _renderDashboard() {
        return `
        <div class="space-y-4">
            <div class="grid grid-cols-3 gap-4">
                <div class="bg-white border border-gray-200 rounded-xl p-4">
                    <div class="flex items-center gap-2 mb-2">
                            <i class="fa-solid fa-bolt text-xl text-yellow-400"></i>
                            <span class="text-sm font-bold text-gray-800">工作记忆</span>
                        </div>
                    <div class="text-2xl font-bold text-yellow-400" id="mem-stat-working">-</div>
                    <div class="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden"><div class="h-full bg-yellow-500 rounded-full" id="mem-bar-working" style="width:0%"></div></div>
                    <div class="text-xs font-bold text-gray-600 mt-2" id="mem-stat-working-detail">- / -</div>
                </div>
                <div class="bg-white border border-gray-200 rounded-xl p-4">
                    <div class="flex items-center gap-2 mb-2">
                            <i class="fa-solid fa-comments text-xl text-blue-400"></i>
                            <span class="text-sm font-bold text-gray-800">会话记忆</span>
                        </div>
                    <div class="text-2xl font-bold text-blue-400" id="mem-stat-session">-</div>
                    <div class="text-xs font-bold text-gray-600 mt-2" id="mem-stat-session-detail">- 个会话</div>
                </div>
                <div class="bg-white border border-gray-200 rounded-xl p-4">
                    <div class="flex items-center gap-2 mb-2">
                            <i class="fa-solid fa-database text-xl text-green-400"></i>
                            <span class="text-sm font-bold text-gray-800">长期记忆</span>
                        </div>
                    <div class="text-2xl font-bold text-green-400" id="mem-stat-persistent">-</div>
                    <div class="text-xs font-bold text-gray-600 mt-2" id="mem-stat-persistent-detail">平均重要度：-</div> -</div>
                </div>
            </div>
            <!-- 分类分布 -->
            <div class="bg-white border border-gray-200 rounded-xl p-4">
                <div class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <i class="fa-solid fa-chart-pie text-2xl text-purple-400"></i>
                            长期记忆分类分布
                        </div>
                <div id="mem-cat-dist" class="flex flex-wrap gap-2"></div>
            </div>
            <!-- 最近工作记忆 -->
            <div class="bg-white border border-gray-200 rounded-xl p-4">
                <div class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <i class="fa-solid fa-clock text-2xl text-yellow-400"></i>
                            最近工作记忆
                        </div>
                <div id="mem-recent-working" class="space-y-1 max-h-40 overflow-y-auto"></div>
            </div>
        </div>`;
    },

    _renderWorking() {
        return `
        <div class="space-y-4">
            <!-- 添加表单 -->
            <div class="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
                <div class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <i class="fa-solid fa-plus text-xl text-yellow-400"></i>
                            添加工作记忆
                        </div>
                <div class="flex gap-2">
                    <select id="mem-wk-type" class="bg-white border-2 border-gray-300 rounded-lg text-xs text-gray-800 font-bold p-2.5 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-200">
                        <option value="conversation">对话</option>
                        <option value="generation">生成</option>
                        <option value="note">笔记</option>
                        <option value="search">检索</option>
                    </select>
                    <select id="mem-wk-priority" class="bg-white border-2 border-gray-300 rounded-lg text-xs text-gray-800 font-bold p-2.5 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-200">
                        <option value="1">P1 低</option>
                        <option value="3" selected>P3 中</option>
                        <option value="5">P5 高</option>
                    </select>
                </div>
                <textarea id="mem-wk-content" class="textarea w-full bg-gray-100 border-gray-300 h-20 text-xs" placeholder="输入记忆内容..."></textarea>
                <button class="btn px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white border-none shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 transition-all hover:scale-105 rounded-lg" onclick="Modules.memory_system.addWorking()">
                            <i class="fa-solid fa-plus mr-2"></i>
                            <span class="text-sm font-bold">添加</span>
                        </button>
            </div>
            <!-- 列表 -->
            <div class="space-y-2" id="mem-working-list"></div>
        </div>`;
    },

    _renderSession() {
        return `
        <div class="space-y-4">
            <div class="flex items-center justify-between mb-3">
                            <div class="text-sm font-bold text-gray-800 flex items-center gap-2">
                                <i class="fa-solid fa-comments text-2xl text-blue-400"></i>
                                会话列表
                            </div>
                            <button class="btn px-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 text-white border-none shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all hover:scale-105 rounded-lg" onclick="Modules.memory_system.clearAllSessions()">
                                <i class="fa-solid fa-trash mr-2"></i>
                                <span class="text-sm font-bold">清空全部</span>
                            </button>
                        </div>
            <div id="mem-session-list" class="space-y-2"></div>
        </div>`;
    },

    _renderPersistent() {
        return `
        <div class="space-y-4">
            <!-- 添加表单 -->
            <div class="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
                <div class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <i class="fa-solid fa-plus text-xl text-green-400"></i>
                            添加长期记忆
                        </div>
                <div class="flex gap-2">
                    <select id="mem-pm-category" class="bg-white border-2 border-gray-300 rounded-lg text-xs text-gray-800 font-bold p-2.5 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-200">
                        <option value="fact">事实</option>
                        <option value="character">角色</option>
                        <option value="setting">设定</option>
                        <option value="plot">情节</option>
                        <option value="style">风格</option>
                        <option value="rule">规则</option>
                    </select>
                    <input id="mem-pm-importance" type="number" class="bg-white border-2 border-gray-300 rounded-lg text-xs text-gray-800 font-bold p-2.5 w-24 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-200" value="0.7" min="0" max="1" step="0.1" placeholder="重要度">
                    <input id="mem-pm-tags" class="bg-white border-2 border-gray-300 rounded-lg text-xs text-gray-800 font-bold p-2.5 flex-1 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-200" placeholder="标签 (逗号分隔)">
                </div>
                <textarea id="mem-pm-content" class="textarea w-full bg-gray-100 border-gray-300 h-20 text-xs" placeholder="输入长期记忆内容..."></textarea>
                <button class="btn btn-sm bg-green-600/20 text-green-400 border-green-600/30 hover:bg-green-600 hover:text-gray-800" onclick="Modules.memory_system.addPersistent()"><i class="fa-solid fa-plus mr-1"></i>添加</button>
            </div>
            <!-- 过滤 -->
            <div class="flex gap-2 items-center mb-3">
                <div class="flex gap-1 text-xs font-bold">
                    ${['all','fact','character','setting','plot','style','rule','promoted'].map(c => `
                        <span class="px-3 py-1.5 rounded-lg cursor-pointer ${this._pmFilter === c ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-2 border-green-400 shadow-lg shadow-green-500/30' : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-green-300 hover:bg-green-50'}" onclick="Modules.memory_system._pmFilter='${c}';Modules.memory_system.loadPersistent()">${c === 'all' ? '全部' : c}</span>
                    `).join('')}
                </div>
                <input id="mem-pm-search" class="bg-white border-2 border-gray-300 rounded-lg text-xs text-gray-800 font-bold p-2.5 flex-1 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-200" placeholder="搜索..." oninput="Modules.memory_system._pmSearch=this.value;Modules.memory_system.loadPersistent()">
            </div>
            <!-- 列表 -->
            <div id="mem-persistent-list" class="space-y-2"></div>
        </div>`;
    },

    // ---- 交互方法 ----
    switchTab(tab) {
        this.activeTab = tab;
        const ws = document.getElementById('mem-workspace');
        if (ws) ws.innerHTML = this._renderTab();
        this.init();
    },

    async init() {
        for (let i = 0; i < 10; i++) {
            if (App.isDbReady && App.isDbReady()) break;
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        if (!App.isDbReady || !App.isDbReady()) {
            console.error('DB 初始化超时');
            return;
        }
        if (this.activeTab === 'dashboard') await this.loadDashboard();
        else if (this.activeTab === 'working') this.loadWorking();
        else if (this.activeTab === 'session') await this.loadSessions();
        else if (this.activeTab === 'persistent') await this.loadPersistent();
    },

    async loadDashboard() {
        try {
            const stats = await MemorySystem.getStats();
            const el = (id) => document.getElementById(id);
            if (el('mem-stat-working')) el('mem-stat-working').textContent = stats.workingCount;
            if (el('mem-stat-working-detail')) el('mem-stat-working-detail').textContent = `${stats.workingCount} / ${stats.workingMax}`;
            if (el('mem-bar-working')) el('mem-bar-working').style.width = Math.round(stats.workingCount / stats.workingMax * 100) + '%';
            if (el('mem-stat-session')) el('mem-stat-session').textContent = stats.sessionTotalItems;
            if (el('mem-stat-session-detail')) el('mem-stat-session-detail').textContent = `${stats.sessionCount} 个会话`;
            if (el('mem-stat-persistent')) el('mem-stat-persistent').textContent = stats.persistentCount;
            if (el('mem-stat-persistent-detail')) el('mem-stat-persistent-detail').textContent = `平均重要度: ${stats.avgImportance}`;

            // 分类分布
            const distEl = el('mem-cat-dist');
            if (distEl) {
                const colors = { fact: 'blue', character: 'pink', setting: 'amber', plot: 'green', style: 'purple', rule: 'red', promoted: 'cyan' };
                distEl.innerHTML = Object.entries(stats.categories || {}).map(([cat, count]) => {
                    const c = colors[cat] || 'gray';
                    return `<span class="px-3 py-1.5 rounded-lg text-xs font-bold bg-${c}-50 text-${c}-600 border-2 border-${c}-200">${cat}: ${count}</span>`;
                }).join('') || '<span class="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">暂无数据</span>';
            }

            // 最近工作记忆
            const recentEl = el('mem-recent-working');
            if (recentEl) {
                const recent = MemorySystem.working.slice(-8).reverse();
                recentEl.innerHTML = recent.length === 0
                    ? '<div class="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-2 rounded-lg border border-gray-200 text-center">暂无工作记忆</div>'
                    : recent.map(m => `
                        <div class="flex items-center gap-2 text-xs py-2 px-3 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-200">
                            <span class="px-2 py-1 rounded-lg text-xs font-bold bg-yellow-50 text-yellow-600 border-2 border-yellow-200">${m.type}</span>
                            <span class="text-dim flex-1 truncate">${m.content.slice(0, 80)}</span>
                            <span class="text-dim/50">P${m.priority}</span>
                        </div>
                    `).join('');
            }
        } catch (e) { console.warn('加载仪表盘失败:', e); }
    },

    addWorking() {
        const content = document.getElementById('mem-wk-content')?.value?.trim();
        if (!content) return UI.toast('请输入内容');
        const type = document.getElementById('mem-wk-type')?.value || 'note';
        const priority = parseInt(document.getElementById('mem-wk-priority')?.value || '3');
        MemorySystem.addWorking(content, type, priority);
        document.getElementById('mem-wk-content').value = '';
        this.loadWorking();
        UI.toast('已添加到工作记忆');
    },

    loadWorking() {
        const listEl = document.getElementById('mem-working-list');
        if (!listEl) return;
        const items = MemorySystem.working.slice().reverse();
        if (items.length === 0) {
            listEl.innerHTML = '<div class="text-center text-dim text-xs py-8">工作记忆为空</div>';
            return;
        }
        listEl.innerHTML = items.map(m => `
            <div class="bg-white border border-gray-200 rounded-lg p-3 group hover:border-yellow-500/20">
                <div class="flex items-center gap-2 mb-1.5">
                    <span class="px-2 py-1 rounded-lg text-xs font-bold bg-yellow-50 text-yellow-600 border-2 border-yellow-200">${m.type}</span>
                    <span class="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-lg border border-gray-200">P${m.priority}</span>
                    <span class="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-lg border border-gray-200">访问${m.accessCount}次</span>
                    <span class="text-xs font-bold text-gray-500 ml-auto">${new Date(m.ts).toLocaleTimeString()}</span>
                </div>
                <div class="text-sm text-gray-700 leading-relaxed">${m.content.length > 300 ? m.content.slice(0, 300) + '...' : m.content}</div>
                ${m.tags && m.tags.length > 0 ? `<div class="flex gap-1 mt-1.5">${m.tags.map(t => `<span class="px-2 py-1 rounded-lg text-xs font-bold bg-gray-50 text-gray-600 border-2 border-gray-200">${t}</span>`).join('')}</div>` : ''}
                <div class="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="btn btn-xs bg-green-500/10 text-green-400" onclick="MemorySystem.promoteToLongTerm('${m.id}');Modules.memory_system.loadWorking()"><i class="fa-solid fa-arrow-up mr-1"></i>提升为长期</button>
                    <button class="btn btn-xs bg-gray-100 text-dim" onclick="Utils.copy(\`${m.content.replace(/`/g, '\\`').replace(/\\/g, '\\\\')}\`)"><i class="fa-solid fa-copy mr-1"></i>复制</button>
                    <button class="btn btn-xs bg-red-500/10 text-red-400" onclick="MemorySystem.removeWorking('${m.id}');Modules.memory_system.loadWorking()"><i class="fa-solid fa-trash mr-1"></i>删除</button>
                </div>
            </div>
        `).join('');
    },

    async loadSessions() {
        const listEl = document.getElementById('mem-session-list');
        if (!listEl) return;
        const sessions = await MemorySystem.getAllSessionIds();
        if (sessions.length === 0) {
            listEl.innerHTML = '<div class="text-center text-dim text-xs py-8">暂无会话记忆</div>';
            return;
        }
        listEl.innerHTML = sessions.map(s => `
            <div class="bg-white border border-gray-200 rounded-lg p-3 group hover:border-blue-500/20">
                <div class="flex items-center gap-2 mb-1">
                    <i class="fa-solid fa-comment text-blue-400 text-base"></i>
                    <span class="text-sm font-bold text-gray-800 flex-1">${s.id}</span>
                    <span class="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-lg border border-gray-200">${s.count} 条</span>
                    <span class="text-xs font-bold text-gray-500">${s.updatedAt ? new Date(s.updatedAt).toLocaleDateString() : ''}</span>
                </div>
                <div class="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="btn btn-xs bg-blue-500/10 text-blue-400" onclick="Modules.memory_system.viewSession('${s.id}')"><i class="fa-solid fa-eye mr-1"></i>查看</button>
                    <button class="btn btn-xs bg-red-500/10 text-red-400" onclick="Modules.memory_system.deleteSession('${s.id}')"><i class="fa-solid fa-trash mr-1"></i>删除</button>
                </div>
                <div id="mem-session-items-${s.id}" class="hidden mt-2 space-y-1 max-h-60 overflow-y-auto"></div>
            </div>
        `).join('');
    },

    async viewSession(sessionId) {
        const container = document.getElementById('mem-session-items-' + sessionId);
        if (!container) return;
        if (!container.classList.contains('hidden')) { container.classList.add('hidden'); return; }
        const items = await MemorySystem.getSessionItems(sessionId, 50);
        container.innerHTML = items.length === 0
            ? '<div class="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-2 rounded-lg border border-gray-200 text-center">空会话</div>'
            : items.map(item => `
                <div class="flex items-start gap-2 text-xs py-2 px-3 rounded-lg hover:bg-blue-50 border-l-2 border-blue-400">
                    <div class="flex-1">
                        <div class="text-sm text-gray-700">${item.content.length > 200 ? item.content.slice(0, 200) + '...' : item.content}</div>
                        <div class="flex gap-1 mt-1">
                            ${(item.tags || []).map(t => `<span class="px-2 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-600 border-2 border-blue-200">${t}</span>`).join('')}
                            <span class="text-xs font-bold text-gray-500 ml-auto">${new Date(item.ts).toLocaleTimeString()}</span>
                        </div>
                    </div>
                    <button class="btn btn-xs bg-green-500/10 text-green-400 shrink-0" onclick="MemorySystem.sessionToLongTerm('${sessionId}','${item.id}');UI.toast('已提升')"><i class="fa-solid fa-arrow-up"></i></button>
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

    async loadPersistent() {
        const listEl = document.getElementById('mem-persistent-list');
        if (!listEl) return;
        let items = await MemorySystem.getAllPersistent();

        // 分类过滤
        if (this._pmFilter !== 'all') {
            items = items.filter(m => m.category === this._pmFilter);
        }
        // 搜索过滤
        if (this._pmSearch) {
            const q = this._pmSearch.toLowerCase();
            items = items.filter(m => (m.content + ' ' + (m.tags || []).join(' ')).toLowerCase().includes(q));
        }

        if (items.length === 0) {
            listEl.innerHTML = '<div class="text-center text-dim text-xs py-8">暂无长期记忆</div>';
            return;
        }

        const catColors = { fact: 'blue', character: 'pink', setting: 'amber', plot: 'green', style: 'purple', rule: 'red', promoted: 'cyan' };
        listEl.innerHTML = items.sort((a, b) => b.importance - a.importance).map(m => {
            const c = catColors[m.category] || 'gray';
            const impPercent = Math.round(m.importance * 100);
            return `
            <div class="bg-white border border-gray-200 rounded-lg p-3 group hover:border-green-500/20">
                <div class="flex items-center gap-2 mb-1.5">
                    <span class="px-2 py-1 rounded-lg text-xs font-bold bg-${c}-50 text-${c}-600 border-2 border-${c}-200">${m.category}</span>
                    <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full" style="width:${impPercent}%"></div>
                    </div>
                    <span class="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-lg border border-gray-200">${m.importance.toFixed(2)}</span>
                    <span class="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-lg border border-gray-200">访问${m.accessCount || 0}次</span>
                </div>
                <div class="text-sm text-gray-700 leading-relaxed">${m.content.length > 400 ? m.content.slice(0, 400) + '...' : m.content}</div>
                ${m.tags && m.tags.length > 0 ? `<div class="flex flex-wrap gap-1 mt-1.5">${m.tags.map(t => `<span class="px-2 py-1 rounded-lg text-xs font-bold bg-gray-50 text-gray-600 border-2 border-gray-200">${t}</span>`).join('')}</div>` : ''}
                <div class="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span class="text-xs font-bold text-gray-500 mr-auto">${m.source || 'manual'} · ${new Date(m.ts).toLocaleDateString()}</span>
                    <button class="btn btn-xs bg-gray-100 text-dim" onclick="Utils.copy(\`${m.content.replace(/`/g, '\\`').replace(/\\/g, '\\\\').slice(0, 500)}\`)"><i class="fa-solid fa-copy"></i></button>
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
        const tagsStr = document.getElementById('mem-pm-tags')?.value || '';
        const tags = tagsStr.split(/[,，]/).map(t => t.trim()).filter(t => t);
        await MemorySystem.addPersistent(content, category, importance, tags);
        document.getElementById('mem-pm-content').value = '';
        document.getElementById('mem-pm-tags').value = '';
        await this.loadPersistent();
        UI.toast('已添加到长期记忆');
    },

    async deletePersistent(id) {
        if (!confirm('确定删除此长期记忆？')) return;
        await MemorySystem.deletePersistent(id);
        await this.loadPersistent();
        UI.toast('已删除');
    },

    async aiCompress() {
        if (MemorySystem.working.length < 5) return UI.toast('工作记忆不足5条，无需压缩');
        UI.toast('AI 正在压缩工作记忆...');
        const result = await MemorySystem.aiCompressWorking();
        if (result) {
            UI.toast(`已压缩 ${result.compressed} 条工作记忆`);
            if (this.activeTab === 'working') this.loadWorking();
            if (this.activeTab === 'dashboard') await this.loadDashboard();
        } else {
            UI.toast('压缩失败或记忆不足', 'error');
        }
    },

    async decayImportance() {
        await MemorySystem.decayImportance();
        UI.toast('重要度衰减已执行');
        if (this.activeTab === 'persistent') await this.loadPersistent();
        if (this.activeTab === 'dashboard') await this.loadDashboard();
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
            a.href = url; a.download = '三层记忆_' + new Date().toLocaleDateString() + '.json';
            a.click(); URL.revokeObjectURL(url);
            UI.toast('导出成功');
        } catch (e) { UI.toast('导出失败: ' + e.message, 'error'); }
    },

    importData() {
        let input = document.getElementById('mem-import-input');
        if (!input) {
            input = document.createElement('input');
            input.type = 'file'; input.accept = '.json';
            input.id = 'mem-import-input';
            input.style.display = 'none';
            document.body.appendChild(input);
        }
        input.value = '';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                let count = 0;
                if (data.persistent && Array.isArray(data.persistent)) {
                    count = await MemorySystem.importPersistent(data.persistent);
                }
                if (data.working && Array.isArray(data.working)) {
                    for (const item of data.working) {
                        MemorySystem.addWorking(item.content || '', item.type || 'note', item.priority || 3, { tags: item.tags || [] });
                        count++;
                    }
                }
                UI.toast(`导入成功，共 ${count} 条记忆`);
                // 刷新当前视图
                const ws = document.getElementById('mem-workspace');
                if (ws) ws.innerHTML = this._renderTab();
                await this.init();
            } catch (err) { UI.toast('导入失败: ' + err.message, 'error'); }
        };
        input.click();
    }
};
