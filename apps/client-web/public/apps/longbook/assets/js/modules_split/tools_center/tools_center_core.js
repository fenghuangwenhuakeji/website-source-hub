// ============================================
// 工具中心 (tools_center) - 旗舰版 v4
// 工作流画布 + 智能体部署
// 左侧可折叠 · 10条预设工作流 · 导入导出JSON
// 工作流/智能体可在网页对话中通过命令调用
// ============================================
Modules.tools_center = {
    currentTab: 'workflow',
    sidebarCollapsed: false,
    nodes: [],
    connections: [],
    draggedNode: null,
    dragOffset: { x: 0, y: 0 },
    connectingNode: null,
    savedWorkflows: [],
    // 画布平移
    panX: 0, panY: 0,
    isPanning: false,
    panStart: { x: 0, y: 0 },
    // 智能体
    agentChatId: null,
    agentChatLog: [],
    _agentChatCache: {},  // 每个智能体独立的对话缓存
    _agentGenerating: false,

    // 持久化对话缓存到DB
    async _saveAgentChats() {
        await DB.put('settings', { id: 'agent_chat_cache', data: JSON.parse(JSON.stringify(this._agentChatCache)) });
    },
    // 从DB恢复对话缓存
    async _loadAgentChats() {
        const saved = await DB.get('settings', 'agent_chat_cache');
        if (saved && saved.data) this._agentChatCache = saved.data;
    },

    render() {
        const TC = this;
        const collapsed = TC.sidebarCollapsed;
        return `
        <div class="flex h-full bg-[#09090b] text-gray-200 overflow-hidden">
            <!-- 左侧导航 (可折叠) -->
            <div class="${collapsed ? 'w-10' : 'w-64'} shrink-0 bg-[#111113] border-r border-white/5 flex flex-col z-20 transition-all duration-300" id="tc-sidebar">
                ${collapsed ? TC._renderCollapsedSidebar() : TC._renderExpandedSidebar()}
            </div>
            <!-- 右侧工作区 -->
            <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
                <div id="tc-command-center" class="shrink-0">${TC._renderCommandCenter()}</div>
                <div class="flex-1 relative overflow-hidden" id="tc-workspace">
                    ${TC._renderWorkspace()}
                </div>
            </div>
        </div>`;
    },

    _renderCommandCenter() {
        const quickPresets = [
            ['basic_gen', '普通生成', '输入主题，直接生成一段结果', 'fa-bolt', 'indigo'],
            ['outline_to_chapter', '大纲变章节', '把提纲扩成正文片段', 'fa-book-open', 'amber'],
            ['character_builder', '角色卡', '生成角色设定和关系信息', 'fa-user-pen', 'emerald'],
            ['full_pipeline', '完整流水线', '输入需求，自动拆成多步处理', 'fa-diagram-project', 'violet']
        ];
        const modeText = this.currentTab === 'workflow' ? '工作流画布' : '智能体部署';
        const runText = this.nodes.length ? `已加载 ${this.nodes.length} 个步骤，可直接运行` : '先选一个模板，系统会自动放好步骤';
        return `
        <div class="bg-[#0d0d0f] border-b border-white/5 px-4 py-3">
            <div class="flex flex-col 2xl:flex-row 2xl:items-center gap-3">
                <div class="min-w-[260px]">
                    <div class="text-[10px] text-indigo-300/70 font-bold tracking-wider">不用拖节点也能开始</div>
                    <div class="text-sm font-black text-white">先选一个流程模板</div>
                    <div class="text-[10px] text-dim mt-1">${runText}</div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2 flex-1">
                    ${quickPresets.map(([preset, label, desc, icon, color]) => `
                        <button class="rounded-lg border border-${color}-500/20 bg-${color}-500/10 px-3 py-2 text-left hover:bg-${color}-500/20 hover:border-${color}-500/40 transition min-h-[64px]" onclick="Modules.tools_center.quickPreset('${preset}')">
                            <div class="flex items-center gap-2">
                                <i class="fa-solid ${icon} text-${color}-300 text-xs"></i>
                                <span class="text-xs font-black text-${color}-100">${label}</span>
                            </div>
                            <div class="text-[10px] text-dim mt-1 leading-relaxed">${desc}</div>
                        </button>
                    `).join('')}
                </div>
                <div class="grid grid-cols-2 gap-2 2xl:w-[300px]">
                    <div class="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-2">
                        <div class="text-[9px] text-indigo-200/70">当前</div>
                        <div class="text-xs font-bold text-indigo-200 truncate">${modeText}</div>
                    </div>
                    <div class="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
                        <div class="text-[9px] text-dim">步骤</div>
                        <div class="text-xs font-bold text-white">${this.nodes.length}个 · ${this.connections.length}线</div>
                    </div>
                    <button class="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-left hover:bg-white/10 transition" onclick="Modules.tools_center.toggleBatchMode()">
                        <div class="text-[9px] text-dim">多条输入</div>
                        <div class="text-xs font-bold text-emerald-300">批量跑</div>
                    </button>
                    <button class="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-left hover:bg-white/10 transition" onclick="Modules.tools_center.switchTab('agents')">
                        <div class="text-[9px] text-dim">智能体</div>
                        <div class="text-xs font-bold text-blue-300">创建助手</div>
                    </button>
                </div>
                <button class="btn bg-green-600/20 text-green-300 border border-green-500/30 hover:bg-green-600/30 rounded-lg px-4 h-10 2xl:w-[96px]" onclick="Modules.tools_center.runWorkflow()">
                    <i class="fa-solid fa-play mr-1"></i>运行
                </button>
            </div>
        </div>`;
    },

    _refreshCommandCenter() {
        const el = document.getElementById('tc-command-center');
        if (el) el.innerHTML = this._renderCommandCenter();
    },

    quickPreset(preset) {
        if (this.currentTab !== 'workflow') {
            this.currentTab = 'workflow';
            const view = document.getElementById('module-view-tools_center');
            if (view) view.innerHTML = this.render();
            this.init();
        }
        setTimeout(() => {
            this.addPresetWorkflow(preset);
            this._refreshCommandCenter();
        }, 0);
    },

    _renderCollapsedSidebar() {
        return `
            <button class="w-10 h-10 flex center text-dim hover:text-white hover:bg-white/10 border-b border-white/5" onclick="Modules.tools_center.toggleSidebar()" title="展开面板"><i class="fa-solid fa-angles-right text-xs"></i></button>
            <button class="w-10 h-10 flex center ${this.currentTab==='workflow' ? 'text-indigo-400 bg-indigo-500/10' : 'text-dim hover:text-white hover:bg-white/10'}" onclick="Modules.tools_center.switchTab('workflow')" title="工作流"><i class="fa-solid fa-diagram-project text-xs"></i></button>
            <button class="w-10 h-10 flex center ${this.currentTab==='agents' ? 'text-blue-400 bg-blue-500/10' : 'text-dim hover:text-white hover:bg-white/10'}" onclick="Modules.tools_center.switchTab('agents')" title="智能体"><i class="fa-solid fa-robot text-xs"></i></button>
            <div class="flex-1"></div>
            <button class="w-10 h-10 flex center text-dim hover:text-green-400 hover:bg-green-500/10" onclick="Modules.tools_center.runWorkflow()" title="运行工作流"><i class="fa-solid fa-play text-xs"></i></button>
            <button class="w-10 h-10 flex center text-dim hover:text-white hover:bg-white/10" onclick="Modules.tools_center.saveWorkflow()" title="保存"><i class="fa-solid fa-floppy-disk text-xs"></i></button>
            <button class="w-10 h-10 flex center text-dim hover:text-white hover:bg-white/10" onclick="Modules.tools_center.importWorkflowJSON()" title="导入"><i class="fa-solid fa-upload text-xs"></i></button>`;
    },

    _renderExpandedSidebar() {
        const TC = this;
        return `
            <div class="p-3 border-b border-white/5 flex items-center gap-2 bg-gradient-to-r from-indigo-900/20 to-transparent">
                <div class="w-7 h-7 rounded-lg bg-indigo-600/20 flex center text-indigo-400 border border-indigo-600/40"><i class="fa-solid fa-toolbox text-xs"></i></div>
                <div class="flex-1 min-w-0">
                    <span class="font-bold text-xs text-white">工具中心</span>
                    <div class="text-[8px] text-dim">工作流 · 智能体</div>
                </div>
                <button class="w-6 h-6 flex center text-dim hover:text-white hover:bg-white/10 rounded" onclick="Modules.tools_center.toggleSidebar()"><i class="fa-solid fa-angles-left text-[9px]"></i></button>
            </div>
            <div class="flex border-b border-white/5">
                ${[['workflow','工作流','fa-diagram-project'],['agents','智能体','fa-robot']].map(([k,v,i]) => `
                    <button class="flex-1 py-2.5 text-[10px] font-bold transition-all ${TC.currentTab===k ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-dim hover:text-white'}" onclick="Modules.tools_center.switchTab('${k}')">
                        <i class="fa-solid ${i} mr-0.5"></i>${v}
                    </button>
                `).join('')}
            </div>
            <div class="flex-1 overflow-y-auto flex flex-col" id="tc-tab-content">
                ${TC._renderTabContent()}
            </div>
            <div class="p-2 border-t border-white/5 space-y-1">
                ${TC._renderBottomActions()}
            </div>`;
    },

    toggleSidebar() {
        this.sidebarCollapsed = !this.sidebarCollapsed;
        const view = document.getElementById('module-view-tools_center');
        if (view) view.innerHTML = this.render();
        this.init();
    },

    _renderBottomActions() {
        if (this.currentTab === 'workflow') return `
            <button class="btn w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9 rounded-lg font-bold" onclick="Modules.tools_center.runWorkflow()"><i class="fa-solid fa-play mr-1"></i>运行工作流</button>
            <div class="flex gap-1">
                <button class="btn flex-1 bg-white/5 hover:bg-white/10 text-dim text-[10px] h-7 rounded" onclick="Modules.tools_center.saveWorkflow()"><i class="fa-solid fa-floppy-disk mr-1"></i>保存</button>
                <button class="btn flex-1 bg-white/5 hover:bg-white/10 text-dim text-[10px] h-7 rounded" onclick="Modules.tools_center.importWorkflowJSON()"><i class="fa-solid fa-upload mr-1"></i>导入</button>
                <button class="btn flex-1 bg-white/5 hover:bg-white/10 text-dim text-[10px] h-7 rounded" onclick="Modules.tools_center.exportWorkflowJSON()"><i class="fa-solid fa-download mr-1"></i>导出</button>
            </div>
            <div class="flex gap-1">
                <button class="btn flex-1 bg-white/5 hover:bg-white/10 text-dim text-[10px] h-7 rounded" onclick="Modules.tools_center.toggleBatchMode()"><i class="fa-solid fa-layer-group mr-1"></i>批量</button>
                <button class="btn flex-1 bg-white/5 hover:bg-white/10 text-dim text-[10px] h-7 rounded" onclick="document.getElementById('tc-global-io')?.classList.toggle('hidden')"><i class="fa-solid fa-terminal mr-1"></i>IO</button>
            </div>`;
        if (this.currentTab === 'agents') return `
            <button class="btn w-full bg-blue-600 hover:bg-blue-500 text-white text-xs h-9 rounded-lg font-bold" onclick="Modules.tools_center.createAgent()"><i class="fa-solid fa-plus mr-1"></i>部署智能体</button>
            <div class="text-[8px] text-dim text-center leading-relaxed mt-1">在网页对话中输入 <code class="text-green-400">/agent 名称</code> 调用</div>`;
        return '';
    },

    _renderTabContent() {
        const TC = this;
        if (TC.currentTab === 'workflow') {
            return `
                <div class="p-3 space-y-3">
                    <!-- ★ Phase 5: 创作模式快捷入口 -->
                    <div class="text-[9px] font-bold text-amber-400 uppercase tracking-wider px-1">创作模式</div>
                    <div class="grid grid-cols-3 gap-1.5">
                        <button class="p-1.5 bg-amber-500/10 rounded border border-amber-500/20 hover:bg-amber-500/20 flex flex-col items-center gap-0.5 text-[9px] transition-all" onclick="Modules.tools_center._runModeWorkflow('phoenix')" title="从零创建新世界">
                            <i class="fa-solid fa-fire text-amber-400"></i><span class="text-amber-200">凤凰流</span>
                        </button>
                        <button class="p-1.5 bg-cyan-500/10 rounded border border-cyan-500/20 hover:bg-cyan-500/20 flex flex-col items-center gap-0.5 text-[9px] transition-all" onclick="Modules.tools_center._runModeWorkflow('import')" title="导入已有作品">
                            <i class="fa-solid fa-file-import text-cyan-400"></i><span class="text-cyan-200">导入</span>
                        </button>
                        <button class="p-1.5 bg-purple-500/10 rounded border border-purple-500/20 hover:bg-purple-500/20 flex flex-col items-center gap-0.5 text-[9px] transition-all" onclick="Modules.tools_center._runModeWorkflow('fusion')" title="拆书融合技法">
                            <i class="fa-solid fa-code-compare text-purple-400"></i><span class="text-purple-200">拆书</span>
                        </button>
                    </div>
                    <div class="text-[9px] font-bold text-dim uppercase tracking-wider px-1">IO 节点</div>
                    <div class="grid grid-cols-2 gap-1.5">
                        ${[['input','输入源','fa-keyboard','green'],['output','输出口','fa-print','red']].map(([t,n,i,c]) => `
                            <div class="p-1.5 bg-white/5 rounded border border-white/5 cursor-grab hover:bg-${c}-500/10 hover:border-${c}-500/20 flex items-center gap-1.5 text-[10px] transition-all" draggable="true" ondragstart="Modules.tools_center.dragStart(event,'${t}')">
                                <i class="fa-solid ${i} text-${c}-400"></i> ${n}
                            </div>
                        `).join('')}
                    </div>
                    <div class="text-[9px] font-bold text-dim uppercase tracking-wider px-1">AI 处理</div>
                    <div class="grid grid-cols-2 gap-1.5">
                        ${[['llm','LLM生成','fa-brain','indigo'],['polish','润色','fa-wand-magic-sparkles','pink'],['translate','翻译','fa-language','blue'],['summary','摘要','fa-compress','yellow'],['expand','扩写','fa-expand','green'],['rewrite','改写','fa-arrows-rotate','purple'],['extract','提取','fa-filter','cyan']].map(([t,n,i,c]) => `
                            <div class="p-1.5 bg-white/5 rounded border border-white/5 cursor-grab hover:bg-${c}-500/10 hover:border-${c}-500/20 flex items-center gap-1.5 text-[10px] transition-all" draggable="true" ondragstart="Modules.tools_center.dragStart(event,'${t}')">
                                <i class="fa-solid ${i} text-${c}-400"></i> ${n}
                            </div>
                        `).join('')}
                    </div>
                    <div class="text-[9px] font-bold text-dim uppercase tracking-wider px-1">流程控制</div>
                    <div class="grid grid-cols-2 gap-1.5">
                        ${[['condition','条件分支','fa-code-branch','rose'],['loop','循环','fa-rotate','lime'],['foreach','遍历','fa-list','emerald'],['parallel','并行','fa-layer-group','cyan'],['switch','多路分支','fa-turn-up','orange'],['agent_node','智能体','fa-robot','sky'],['chat_node','对话','fa-comment-dots','violet'],['subworkflow','子工作流','fa-diagram-next','fuchsia'],['rag_node','RAG检索','fa-magnifying-glass','emerald']].map(([t,n,i,c]) => `
                            <div class="p-1.5 bg-white/5 rounded border border-white/5 cursor-grab hover:bg-${c}-500/10 hover:border-${c}-500/20 flex items-center gap-1.5 text-[10px] transition-all" draggable="true" ondragstart="Modules.tools_center.dragStart(event,'${t}')">
                                <i class="fa-solid ${i} text-${c}-400"></i> ${n}
                            </div>
                        `).join('')}
                    </div>
                    <div class="text-[9px] font-bold text-dim uppercase tracking-wider px-1">高级功能</div>
                    <div class="grid grid-cols-2 gap-1.5">
                        ${[['template','模板','fa-file-lines','purple']].map(([t,n,i,c]) => `
                            <div class="p-1.5 bg-white/5 rounded border border-white/5 cursor-grab hover:bg-${c}-500/10 hover:border-${c}-500/20 flex items-center gap-1.5 text-[10px] transition-all" draggable="true" ondragstart="Modules.tools_center.dragStart(event,'${t}')">
                                <i class="fa-solid ${i} text-${c}-400"></i> ${n}
                            </div>
                        `).join('')}
                    </div>
                    <div class="text-[9px] font-bold text-dim uppercase tracking-wider px-1">已保存工作流</div>
                    <div id="tc-saved-workflows" class="space-y-1 max-h-32 overflow-y-auto"></div>
                </div>`;
        }
        if (TC.currentTab === 'agents') {
            return `
                <div class="p-3 flex flex-col gap-2 flex-1">
                    <div class="text-[9px] font-bold text-dim uppercase tracking-wider">创建智能体</div>
                    <input id="tc-agent-name" class="epic-input h-8 px-3 rounded text-xs text-white" placeholder="名称 (如: 文本润色专家)">
                    <input id="tc-agent-desc" class="epic-input h-8 px-3 rounded text-xs text-white" placeholder="描述 (可选)">
                    <textarea id="tc-agent-prompt" class="epic-input rounded p-2 text-xs font-mono text-gray-300 resize-none h-20" placeholder="系统提示词..."></textarea>
                    <input id="tc-agent-model" class="epic-input h-8 px-3 rounded text-xs text-white" placeholder="模型 (可选，如 gpt-4)">
                    <div class="p-2 bg-white/5 rounded border border-white/5 text-[9px] text-dim leading-relaxed">
                        <strong class="text-blue-400 block mb-1">💡 网页对话调用</strong>
                        在网页对话中输入 <code class="text-green-400">/agent 名称 消息</code> 即可调用
                    </div>
                    <div class="text-[9px] font-bold text-dim uppercase tracking-wider mt-1">已部署</div>
                    <div id="tc-agent-list" class="flex-1 overflow-y-auto space-y-1"></div>
                </div>`;
        }
        return '';
    },

    // ═══════════════════════════════════════════
    // 工作区渲染
    // ═══════════════════════════════════════════
    _renderWorkspace() {
        if (this.currentTab === 'workflow') return this._renderWorkflowCanvas();
        if (this.currentTab === 'agents') return this._renderAgentWorkspace();
        return '';
    },

    _renderWorkflowCanvas() {
        return `
        <div class="flex flex-col h-full">
            <!-- 顶部工具栏 -->
            <div class="h-11 bg-[#111113] border-b border-white/5 flex items-center px-4 gap-3 shrink-0">
                <span class="text-sm font-bold text-indigo-400 flex items-center gap-2"><i class="fa-solid fa-diagram-project"></i>工作流画布</span>
                <div class="h-5 w-px bg-white/10"></div>
                <span class="text-[10px] text-dim" id="tc-node-count">${this.nodes.length} 节点 · ${this.connections.length} 连线</span>
                <div class="flex-1"></div>
                <div class="flex items-center gap-1.5">
                    <button class="btn h-7 px-3 bg-white/5 hover:bg-white/10 text-dim text-[10px] rounded-lg border border-white/5 hover:border-white/10 transition-all" onclick="Modules.tools_center.resetPan()"><i class="fa-solid fa-crosshairs mr-1 text-blue-400/60"></i>重置视图</button>
                    <button class="btn h-7 px-3 bg-white/5 hover:bg-white/10 text-dim text-[10px] rounded-lg border border-white/5 hover:border-white/10 transition-all" onclick="Modules.tools_center.autoLayout()"><i class="fa-solid fa-wand-magic mr-1 text-amber-400"></i>自动排列</button>
                    <button class="btn h-7 px-3 bg-white/5 hover:bg-white/10 text-dim text-[10px] rounded-lg border border-white/5 hover:border-white/10 transition-all" onclick="Modules.tools_center.clearCanvas()"><i class="fa-solid fa-trash mr-1 text-red-400/60"></i>清空</button>
                    <div class="h-5 w-px bg-white/10"></div>
                    <button class="btn h-7 px-3 bg-green-600/20 hover:bg-green-600/30 text-green-400 text-[10px] rounded-lg border border-green-500/20 font-bold transition-all" onclick="Modules.tools_center.runWorkflow()"><i class="fa-solid fa-play mr-1"></i>运行</button>
                    <div class="h-5 w-px bg-white/10"></div>
                    <select class="bg-[#1a1a1e] border border-white/10 rounded-lg px-3 py-1 text-[10px] text-white hover:border-indigo-500/30 transition-all cursor-pointer" onchange="Modules.tools_center.addPresetWorkflow(this.value);this.value=''">
                        <option value="">加载预设工作流...</option>
                        <option value="basic_gen">基础生成</option>
                        <option value="polish_chain">润色评审链</option>
                        <option value="rag_gen">RAG增强生成</option>
                        <option value="loop_refine">循环精炼</option>
                        <option value="translate_compare">双语翻译对比</option>
                        <option value="agent_chat_flow">智能体对话流</option>
                        <option value="split_merge">分流融合</option>
                        <option value="outline_to_chapter">大纲转章节</option>
                        <option value="character_builder">角色构建器</option>
                        <option value="full_pipeline">完整创作流水线</option>
                    </select>
                </div>
            </div>

            <!-- 画布主体 -->
            <div class="flex-1 relative overflow-hidden" id="tc-canvas"
                 ondrop="Modules.tools_center.drop(event)" ondragover="event.preventDefault()"
                 style="background:#08080a;background-image:radial-gradient(circle,rgba(255,255,255,0.03) 1px,transparent 1px);background-size:24px 24px;cursor:grab">
                <div id="tc-canvas-inner" style="position:absolute;top:0;left:0;width:8000px;height:8000px;transform:translate(${this.panX}px,${this.panY}px)">
                    <svg class="absolute inset-0 pointer-events-none z-0" id="tc-svg" style="width:8000px;height:8000px;overflow:visible"></svg>
                    <div id="tc-nodes" class="absolute inset-0 z-10" style="width:8000px;height:8000px;pointer-events:none"></div>
                </div>
                <!-- 空画布提示 -->
                ${this.nodes.length === 0 ? `
                <div class="absolute inset-0 flex flex-col items-center justify-center z-5 pointer-events-none">
                    <i class="fa-solid fa-diagram-project text-5xl text-white/5 mb-4"></i>
                    <div class="text-sm text-white/10 font-bold mb-1">拖拽节点到画布开始构建工作流</div>
                    <div class="text-[10px] text-white/5">或从右上角加载预设工作流</div>
                </div>` : ''}
                <!-- 节点设置面板 -->
                <div id="tc-node-settings" class="hidden absolute top-3 right-3 w-80 bg-[#18181b]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-30 max-h-[85%] overflow-y-auto"></div>
            </div>
            <!-- IO面板 -->
            <div id="tc-global-io" class="hidden border-t border-white/5 bg-[#0e0e10] flex flex-col shrink-0" style="height:45vh;min-height:280px">
                <div class="flex items-center px-3 py-1.5 border-b border-white/5 bg-black/20">
                    <span class="text-[10px] font-bold text-dim"><i class="fa-solid fa-terminal mr-1 text-green-400/50"></i>IO 调试</span>
                    <div class="flex-1"></div>
                    <button class="btn btn-xs text-dim hover:text-white" onclick="document.getElementById('tc-global-io').classList.add('hidden')"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="flex-1 grid grid-cols-2 gap-2 p-2 min-h-0">
                    <textarea id="tc-io-in" class="bg-black/40 border border-white/5 rounded-lg p-2 text-[9px] text-gray-400 font-mono resize-none" readonly placeholder="输入"></textarea>
                    <textarea id="tc-io-out" class="bg-black/40 border border-white/5 rounded-lg p-2 text-[9px] text-green-400 font-mono resize-none" readonly placeholder="输出"></textarea>
                </div>
            </div>
        </div>`;
    },

    _renderAgentWorkspace() {
        return `
        <div class="flex flex-col h-full">
            <div class="flex-1 flex">
                <div class="flex-1 flex flex-col border-r border-white/5">
                    <div class="h-10 bg-[#111113] border-b border-white/5 flex items-center px-3 gap-2 shrink-0">
                        <span class="text-xs font-bold text-blue-400 flex-1" id="tc-agent-chat-title"><i class="fa-solid fa-robot mr-1"></i>选择智能体开始对话</span>
                        <button class="btn btn-xs bg-red-600/15 text-red-400 border-red-600/20 hover:bg-red-600/30" onclick="Modules.tools_center.clearAgentChat()" title="清除对话"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                    <div id="tc-agent-chat-log" class="flex-1 overflow-y-auto p-4 space-y-3" style="scrollbar-width:thin;scrollbar-color:#444 transparent;"></div>
                    <div class="p-3 border-t border-white/5 flex gap-2 shrink-0">
                        <input id="tc-agent-chat-input" class="epic-input flex-1 h-9 px-3 rounded-lg text-sm text-white" placeholder="输入消息..." onkeydown="if(event.key==='Enter')Modules.tools_center.sendAgentChat()">
                        <button class="btn bg-blue-600 hover:bg-blue-500 text-white px-4 rounded-lg text-xs font-bold" onclick="Modules.tools_center.sendAgentChat()"><i class="fa-solid fa-paper-plane"></i></button>
                    </div>
                </div>
                <div class="w-72 shrink-0 bg-[#111113] p-3 overflow-y-auto" id="tc-agent-detail">
                    <div class="text-center text-dim text-xs py-8">点击左侧智能体开始对话</div>
                </div>
            </div>
        </div>`;
    },

    _renderChatMsg(m) {
        const isUser = m.role === 'user';
        const isSystem = m.role === 'system';
        if (isSystem) return `<div class="text-center text-[10px] text-dim py-1"><i class="fa-solid fa-circle-info mr-1"></i>${m.content}</div>`;
        return `
        <div class="flex ${isUser ? 'justify-end' : 'justify-start'}">
            <div class="max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed ${isUser ? 'bg-violet-600/20 text-violet-100 border border-violet-500/20' : 'bg-white/5 text-gray-200 border border-white/5'}">
                ${!isUser && m.agent ? `<div class="text-[9px] text-blue-400 font-bold mb-0.5"><i class="fa-solid fa-robot mr-1"></i>${m.agent}</div>` : ''}
                <div class="markdown-body">${typeof marked !== 'undefined' ? marked.parse(m.content || '') : (m.content || '')}</div>
            </div>
        </div>`;
    },

    // ═══════════════════════════════════════════
    // 初始化 & Tab切换
    // ═══════════════════════════════════════════
    switchTab(tab) {
        this.currentTab = tab;
        const view = document.getElementById('module-view-tools_center');
        if (view) view.innerHTML = this.render();
        this.init();
    },

    init() {
        const TC = this;
        if (TC.currentTab === 'workflow') {
            TC.loadSavedWorkflows();
            TC._renderAllNodes();
            TC.drawConnections();
            // 绑定画布事件
            const canvas = document.getElementById('tc-canvas');
            if (canvas) {
                canvas.addEventListener('mousedown', (e) => TC.canvasMouseDown(e));
                document.addEventListener('mousemove', TC._boundMouseMove = (e) => TC.mouseMove(e));
                document.addEventListener('mouseup', TC._boundMouseUp = (e) => TC.mouseUp(e));
            }
        }
        if (TC.currentTab === 'agents') {
            TC.loadAgentList();
            TC._loadAgentChats(); // 恢复对话缓存
        }
    },

    // ═══════════════════════════════════════════
    // 节点类型定义 & 节点管理
    // ═══════════════════════════════════════════
    _nodeTypes: {
        input:       { name:'输入源', icon:'fa-keyboard', color:'green', ports:{ out:1 } },
        output:      { name:'输出口', icon:'fa-print', color:'red', ports:{ in:1 } },
        llm:         { name:'LLM生成', icon:'fa-brain', color:'indigo', ports:{ in:1, out:1 } },
        polish:      { name:'润色', icon:'fa-wand-magic-sparkles', color:'pink', ports:{ in:1, out:1 } },
        translate:   { name:'翻译', icon:'fa-language', color:'blue', ports:{ in:1, out:1 } },
        summary:     { name:'摘要', icon:'fa-compress', color:'yellow', ports:{ in:1, out:1 } },
        expand:      { name:'扩写', icon:'fa-expand', color:'green', ports:{ in:1, out:1 } },
        rewrite:     { name:'改写', icon:'fa-arrows-rotate', color:'purple', ports:{ in:1, out:1 } },
        extract:     { name:'提取', icon:'fa-filter', color:'cyan', ports:{ in:1, out:1 } },
        condition:   { name:'条件分支', icon:'fa-code-branch', color:'rose', ports:{ in:1, out:2 }, outLabels:['是','否'] },
        loop:        { name:'循环', icon:'fa-rotate', color:'lime', ports:{ in:1, out:1 }, params:{ count:3 } },
        foreach:     { name:'遍历', icon:'fa-list', color:'emerald', ports:{ in:1, out:1 }, params:{ delimiter:'\n' } },
        parallel:    { name:'并行', icon:'fa-layer-group', color:'cyan', ports:{ in:2, out:1 } },
        switch:      { name:'多路分支', icon:'fa-turn-up', color:'orange', ports:{ in:1, out:3 }, outLabels:['A','B','C'] },
        agent_node:  { name:'智能体', icon:'fa-robot', color:'sky', ports:{ in:1, out:1 }, params:{ agentId:'' } },
        chat_node:   { name:'对话', icon:'fa-comment-dots', color:'violet', ports:{ in:1, out:1 } },
        subworkflow: { name:'子工作流', icon:'fa-diagram-next', color:'fuchsia', ports:{ in:1, out:1 }, params:{ workflowId:'' } },
        rag_node:    { name:'RAG检索', icon:'fa-magnifying-glass', color:'emerald', ports:{ in:1, out:1 }, params:{ query:'' } },
        template:    { name:'模板', icon:'fa-file-lines', color:'purple', ports:{ in:1, out:1 }, params:{ template:'' } }
    },

    _selectedNodeId: null,

    addNode(type, x, y) {
        const def = this._nodeTypes[type];
        if (!def) return;
        const node = {
            id: 'n_' + Date.now() + '_' + Math.random().toString(36).slice(2,5),
            type, x: x || 100, y: y || 100,
            data: { prompt: '', label: def.name, model: '', temperature: '', ...(def.params || {}) },
            _result: ''
        };
        this.nodes.push(node);
        this._renderAllNodes();
        this.drawConnections();
        this._refreshCommandCenter();
        this._openNodeSettings(node.id);
        return node;
    },

    renderNode(node) {
        const def = this._nodeTypes[node.type] || {};
        const c = def.color || 'gray';
        const inPorts = def.ports?.in || 0;
        const outPorts = def.ports?.out || 0;
        const outLabels = def.outLabels || [];
        const selected = this._selectedNodeId === node.id;
        let portsHtml = '';
        for (let i = 0; i < inPorts; i++) {
            portsHtml += `<div class="absolute -left-2.5 w-5 h-5 rounded-full bg-[#0d0d0f] border-2 border-${c}-400/60 cursor-crosshair z-20 hover:scale-125 hover:border-${c}-300 transition-all flex center" style="top:${28 + i*24}px" data-port="in_${i}" data-node="${node.id}" onmousedown="Modules.tools_center.portMouseDown(event,'${node.id}','in_${i}')"><div class="w-2 h-2 rounded-full bg-${c}-400/80"></div></div>`;
        }
        for (let i = 0; i < outPorts; i++) {
            portsHtml += `<div class="absolute -right-2.5 w-5 h-5 rounded-full bg-[#0d0d0f] border-2 border-${c}-400/60 cursor-crosshair z-20 hover:scale-125 hover:border-${c}-300 transition-all flex center" style="top:${28 + i*24}px" data-port="out_${i}" data-node="${node.id}" onmousedown="Modules.tools_center.portMouseDown(event,'${node.id}','out_${i}')"><div class="w-2 h-2 rounded-full bg-${c}-400/80"></div>
                ${outLabels[i] ? `<span class="absolute left-6 top-0.5 text-[8px] text-${c}-300/70 whitespace-nowrap font-bold">${outLabels[i]}</span>` : ''}
            </div>`;
        }
        // 节点内容区
        let bodyHtml = '';
        if (node.data.prompt) {
            bodyHtml += `<div class="text-[9px] text-gray-400 leading-relaxed line-clamp-2">${node.data.prompt.slice(0,60)}${node.data.prompt.length>60?'...':''}</div>`;
        }
        if (node.type === 'loop') bodyHtml += `<div class="flex items-center gap-1 mt-0.5"><span class="text-[9px] text-lime-400/70 font-mono bg-lime-500/10 px-1.5 py-0.5 rounded">×${node.data.count||3} 次迭代</span></div>`;
        if (node.type === 'agent_node') bodyHtml += `<div class="flex items-center gap-1 mt-0.5"><span class="text-[9px] ${node.data.agentId ? 'text-sky-400/70 bg-sky-500/10' : 'text-dim bg-white/5'} px-1.5 py-0.5 rounded">${node.data.agentId ? '🤖 已绑定智能体' : '⚠ 未选择智能体'}</span></div>`;
        if (node.type === 'subworkflow') bodyHtml += `<div class="flex items-center gap-1 mt-0.5"><span class="text-[9px] ${node.data.workflowId ? 'text-fuchsia-400/70 bg-fuchsia-500/10' : 'text-dim bg-white/5'} px-1.5 py-0.5 rounded">${node.data.workflowId ? '📋 已绑定工作流' : '⚠ 未选择工作流'}</span></div>`;
        if (node.type === 'rag_node') bodyHtml += `<div class="flex items-center gap-1 mt-0.5"><span class="text-[9px] text-emerald-400/70 bg-emerald-500/10 px-1.5 py-0.5 rounded truncate max-w-[160px]">🔍 ${node.data.query || '自动提取关键词'}</span></div>`;
        if (node.type === 'condition') bodyHtml += `<div class="text-[9px] text-rose-400/60 mt-0.5">${node.data.prompt ? node.data.prompt.slice(0,40) : '双击设置判断条件'}</div>`;
        if (node.type === 'input' && node.data.prompt) bodyHtml += `<div class="text-[9px] text-green-400/60 line-clamp-1">${node.data.prompt.slice(0,40)}...</div>`;
        if (['llm','polish','translate','summary','expand','rewrite','extract'].includes(node.type) && node.data.model) {
            bodyHtml += `<div class="text-[8px] text-dim mt-0.5 bg-white/5 px-1.5 py-0.5 rounded inline-block">模型: ${node.data.model}</div>`;
        }
        if (!bodyHtml && !['input','output'].includes(node.type)) {
            bodyHtml = `<div class="text-[9px] text-dim/40 italic">双击配置节点</div>`;
        }

        return `
        <div class="tc-node absolute select-none cursor-move group" style="left:${node.x}px;top:${node.y}px;min-width:200px;max-width:260px;pointer-events:auto" id="node-${node.id}" onmousedown="Modules.tools_center.nodeMouseDown(event,'${node.id}')" ondblclick="Modules.tools_center._openNodeSettings('${node.id}')">
            <div class="bg-[#16161a] border-2 ${selected ? 'border-white/50 shadow-xl shadow-white/5' : 'border-'+c+'-500/25 hover:border-'+c+'-400/50'} rounded-xl shadow-lg shadow-${c}-500/5 transition-all">
                <!-- 节点头部 -->
                <div class="flex items-center gap-2 px-3 py-2 border-b border-white/5 bg-gradient-to-r from-${c}-500/10 to-transparent rounded-t-xl">
                    <div class="w-6 h-6 rounded-lg bg-${c}-500/20 flex center border border-${c}-500/30"><i class="fa-solid ${def.icon} text-${c}-400 text-[10px]"></i></div>
                    <span class="text-[11px] font-bold text-white flex-1 truncate">${node.data.label || def.name}</span>
                    <button class="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex center text-dim hover:text-white hover:bg-white/10 text-[9px] transition-all" onclick="event.stopPropagation();Modules.tools_center._openNodeSettings('${node.id}')" title="设置"><i class="fa-solid fa-gear"></i></button>
                    <button class="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex center text-dim hover:text-red-400 hover:bg-red-500/10 text-[9px] transition-all" onclick="event.stopPropagation();Modules.tools_center.removeNode('${node.id}')"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <!-- 节点内容 -->
                ${bodyHtml ? `<div class="px-3 py-2">${bodyHtml}</div>` : ''}
            </div>
            ${portsHtml}
        </div>`;
    },

    // 节点详细设置面板
    _openNodeSettings(id) {
        const node = this.nodes.find(n => n.id === id);
        if (!node) return;
        this._selectedNodeId = id;
        const def = this._nodeTypes[node.type] || {};
        const c = def.color || 'gray';
        const panel = document.getElementById('tc-node-settings');
        if (!panel) return;
        panel.classList.remove('hidden');

        let fieldsHtml = '';
        // 通用: 标签
        fieldsHtml += `
            <div class="space-y-1">
                <label class="text-[9px] text-dim font-bold">节点标签</label>
                <input class="epic-input w-full h-7 px-2 rounded text-xs text-white" value="${node.data.label||''}" onchange="Modules.tools_center.updateNodeData('${id}','label',this.value)">
            </div>`;
        // AI处理节点: prompt + model
        if (['llm','polish','translate','summary','expand','rewrite','extract'].includes(node.type)) {
            fieldsHtml += `
            <div class="space-y-1">
                <label class="text-[9px] text-dim font-bold">自定义提示词</label>
                <textarea class="epic-input w-full rounded p-2 text-[10px] text-white resize-none h-24 font-mono" onchange="Modules.tools_center.updateNodeData('${id}','prompt',this.value)">${node.data.prompt||''}</textarea>
            </div>
            <div class="space-y-1">
                <label class="text-[9px] text-dim font-bold">模型(可选)</label>
                <input class="epic-input w-full h-7 px-2 rounded text-[10px] text-white" value="${node.data.model||''}" placeholder="默认" onchange="Modules.tools_center.updateNodeData('${id}','model',this.value)">
            </div>`;
        }
        // 条件分支
        if (node.type === 'condition') {
            fieldsHtml += `
            <div class="space-y-1">
                <label class="text-[9px] text-dim font-bold">判断条件描述</label>
                <input class="epic-input w-full h-7 px-2 rounded text-[10px] text-white" placeholder="例: 文本质量是否达到发表标准" onchange="Modules.tools_center.updateNodeData('${id}','prompt',this.value)" value="${node.data.prompt||''}">
                <div class="text-[8px] text-dim">AI将判断输入是否满足条件，输出到"是"或"否"端口</div>
            </div>`;
        }
        // 循环
        if (node.type === 'loop') {
            fieldsHtml += `
            <div class="space-y-1">
                <label class="text-[9px] text-dim font-bold">迭代提示词(可选)</label>
                <input class="epic-input w-full h-7 px-2 rounded text-[10px] text-white" placeholder="每次迭代的优化指令" onchange="Modules.tools_center.updateNodeData('${id}','prompt',this.value)" value="${node.data.prompt||''}">
            </div>`;
        }
        // 智能体节点
        if (node.type === 'agent_node') {
            fieldsHtml += `
            <div class="space-y-1">
                <label class="text-[9px] text-dim font-bold">选择智能体</label>
                <select class="epic-input w-full h-7 px-2 rounded text-[10px] text-white tc-settings-agent-sel" onchange="Modules.tools_center.updateNodeData('${id}','agentId',this.value)"><option value="">选择...</option></select>
            </div>`;
        }
        // 子工作流
        if (node.type === 'subworkflow') {
            fieldsHtml += `
            <div class="space-y-1">
                <label class="text-[9px] text-dim font-bold">选择工作流</label>
                <select class="epic-input w-full h-7 px-2 rounded text-[10px] text-white tc-settings-wf-sel" onchange="Modules.tools_center.updateNodeData('${id}','workflowId',this.value)"><option value="">选择...</option></select>
            </div>`;
        }
        // RAG节点
        if (node.type === 'rag_node') {
            fieldsHtml += `
            <div class="space-y-1">
                <label class="text-[9px] text-dim font-bold">检索关键词</label>
                <input class="epic-input w-full h-7 px-2 rounded text-[10px] text-white" value="${node.data.query||''}" placeholder="留空=自动从输入提取" onchange="Modules.tools_center.updateNodeData('${id}','query',this.value)">
            </div>
            <div class="space-y-1">
                <label class="text-[9px] text-dim font-bold">检索数量</label>
                <input type="number" min="1" max="30" class="epic-input w-full h-7 px-2 rounded text-[10px] text-white" value="${node.data.limit||8}" onchange="Modules.tools_center.updateNodeData('${id}','limit',this.value)">
            </div>`;
        }
        // 输入源
        if (node.type === 'input') {
            fieldsHtml += `
            <div class="space-y-1">
                <label class="text-[9px] text-dim font-bold">预设输入内容</label>
                <textarea class="epic-input w-full rounded p-2 text-[10px] text-white resize-none h-24 font-mono" placeholder="留空=运行时弹窗输入" onchange="Modules.tools_center.updateNodeData('${id}','prompt',this.value)">${node.data.prompt||''}</textarea>
            </div>`;
        }

        panel.innerHTML = `
            <div class="p-3 border-b border-white/5 flex items-center gap-2 bg-${c}-500/5">
                <i class="fa-solid ${def.icon} text-${c}-400"></i>
                <span class="text-xs font-bold text-white flex-1">${def.name} 设置</span>
                <button class="text-dim hover:text-white" onclick="Modules.tools_center._closeNodeSettings()"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="p-3 space-y-3">${fieldsHtml}</div>`;
        // 填充下拉
        this._fillSettingsSelects(node);
        this._renderAllNodes();
        this.drawConnections();
    },

    async _fillSettingsSelects(node) {
        const agents = await this._getAgents();
        const wfs = await this._getSavedWorkflows();
        document.querySelectorAll('.tc-settings-agent-sel').forEach(sel => {
            agents.forEach(a => { const o = document.createElement('option'); o.value = a.id; o.textContent = a.name; if (node.data.agentId === a.id) o.selected = true; sel.appendChild(o); });
        });
        document.querySelectorAll('.tc-settings-wf-sel').forEach(sel => {
            wfs.forEach(w => { const o = document.createElement('option'); o.value = w.id; o.textContent = w.name; if (node.data.workflowId === w.id) o.selected = true; sel.appendChild(o); });
        });
    },

    _closeNodeSettings() {
        this._selectedNodeId = null;
        const panel = document.getElementById('tc-node-settings');
        if (panel) panel.classList.add('hidden');
        this._renderAllNodes();
        this.drawConnections();
    },

    _renderAllNodes() {
        const container = document.getElementById('tc-nodes');
        if (!container) return;
        container.innerHTML = this.nodes.map(n => this.renderNode(n)).join('');
    },

    removeNode(id) {
        this.nodes = this.nodes.filter(n => n.id !== id);
        this.connections = this.connections.filter(c => c.from !== id && c.to !== id);
        if (this._selectedNodeId === id) this._closeNodeSettings();
        this._renderAllNodes();
        this.drawConnections();
        this._refreshCommandCenter();
    },

    updateNodeData(id, key, val) {
        const node = this.nodes.find(n => n.id === id);
        if (node) node.data[key] = val;
    },

    // ═══════════════════════════════════════════
    // 拖拽 & 连接
    // ═══════════════════════════════════════════
    dragStart(e, type) { e.dataTransfer.setData('nodeType', type); },

    drop(e) {
        e.preventDefault();
        const type = e.dataTransfer.getData('nodeType');
        if (!type) return;
        const canvas = document.getElementById('tc-canvas');
        const rect = canvas.getBoundingClientRect();
        this.addNode(type, e.clientX - rect.left - this.panX - 80, e.clientY - rect.top - this.panY - 20);
    },

    nodeMouseDown(e, id) {
        if (e.target.closest('input,textarea,select,button')) return;
        e.preventDefault(); e.stopPropagation();
        const node = this.nodes.find(n => n.id === id);
        if (!node) return;
        this.draggedNode = node;
        const canvas = document.getElementById('tc-canvas');
        const rect = canvas.getBoundingClientRect();
        this.dragOffset = { x: e.clientX - rect.left - this.panX - node.x, y: e.clientY - rect.top - this.panY - node.y };
    },

    canvasMouseDown(e) {
        // 只在画布空白处（非节点、非端口、非按钮）触发平移
        if (e.target.closest('[data-port]') || e.target.closest('.tc-node') || e.target.closest('button,input,select,textarea')) return;
        if (e.button !== 0) return;
        this.isPanning = true;
        this.panStart = { x: e.clientX - this.panX, y: e.clientY - this.panY };
        const canvas = document.getElementById('tc-canvas');
        if (canvas) canvas.style.cursor = 'grabbing';
    },

    mouseMove(e) {
        // 画布平移
        if (this.isPanning) {
            this.panX = e.clientX - this.panStart.x;
            this.panY = e.clientY - this.panStart.y;
            const inner = document.getElementById('tc-canvas-inner');
            if (inner) inner.style.transform = `translate(${this.panX}px,${this.panY}px)`;
            return;
        }
        if (this.draggedNode) {
            const canvas = document.getElementById('tc-canvas');
            const rect = canvas.getBoundingClientRect();
            this.draggedNode.x = e.clientX - rect.left - this.panX - this.dragOffset.x;
            this.draggedNode.y = e.clientY - rect.top - this.panY - this.dragOffset.y;
            const el = document.getElementById('node-' + this.draggedNode.id);
            if (el) { el.style.left = this.draggedNode.x + 'px'; el.style.top = this.draggedNode.y + 'px'; }
            this.drawConnections();
        }
        if (this.connectingNode) {
            const svg = document.getElementById('tc-svg');
            if (!svg) return;
            let tmp = svg.querySelector('#tc-tmp-line');
            if (!tmp) { tmp = document.createElementNS('http://www.w3.org/2000/svg','line'); tmp.id = 'tc-tmp-line'; tmp.setAttribute('stroke','#818cf8'); tmp.setAttribute('stroke-width','2'); tmp.setAttribute('stroke-dasharray','6,3'); svg.appendChild(tmp); }
            const rect = document.getElementById('tc-canvas').getBoundingClientRect();
            const start = this._getPortCenter(this.connectingNode.nodeId, this.connectingNode.port);
            if (start) { tmp.setAttribute('x1', start.x); tmp.setAttribute('y1', start.y); tmp.setAttribute('x2', e.clientX - rect.left - this.panX); tmp.setAttribute('y2', e.clientY - rect.top - this.panY); }
        }
    },

    mouseUp(e) {
        // 结束画布平移
        if (this.isPanning) {
            this.isPanning = false;
            const canvas = document.getElementById('tc-canvas');
            if (canvas) canvas.style.cursor = 'grab';
            return;
        }
        this.draggedNode = null;
        if (this.connectingNode) {
            const target = document.elementFromPoint(e.clientX, e.clientY);
            if (target && target.dataset.port && target.dataset.node) {
                const fromPort = this.connectingNode.port;
                const toPort = target.dataset.port;
                const fromNode = this.connectingNode.nodeId;
                const toNode = target.dataset.node;
                if (fromPort.startsWith('out') && toPort.startsWith('in') && fromNode !== toNode) {
                    if (!this.connections.find(c => c.from === fromNode && c.fromPort === fromPort && c.to === toNode && c.toPort === toPort))
                        this.connections.push({ from: fromNode, fromPort, to: toNode, toPort });
                }
                if (fromPort.startsWith('in') && toPort.startsWith('out') && fromNode !== toNode) {
                    if (!this.connections.find(c => c.from === toNode && c.fromPort === toPort && c.to === fromNode && c.toPort === fromPort))
                        this.connections.push({ from: toNode, fromPort: toPort, to: fromNode, toPort: fromPort });
                }
            }
            this.connectingNode = null;
            const tmp = document.querySelector('#tc-tmp-line');
            if (tmp) tmp.remove();
            this.drawConnections();
        }
    },

    portMouseDown(e, nodeId, port) { e.preventDefault(); e.stopPropagation(); this.connectingNode = { nodeId, port }; },

    _getPortCenter(nodeId, port) {
        const el = document.getElementById('node-' + nodeId);
        if (!el) return null;
        const portEl = el.querySelector(`[data-port="${port}"]`);
        if (!portEl) return null;
        const canvas = document.getElementById('tc-canvas');
        if (!canvas) return null;
        const cr = canvas.getBoundingClientRect();
        const pr = portEl.getBoundingClientRect();
        return { x: pr.left + pr.width/2 - cr.left - this.panX, y: pr.top + pr.height/2 - cr.top - this.panY };
    },

    drawConnections() {
        const svg = document.getElementById('tc-svg');
        if (!svg) return;
        const tmp = svg.querySelector('#tc-tmp-line');
        svg.innerHTML = '';
        if (tmp) svg.appendChild(tmp);
        for (const conn of this.connections) {
            const start = this._getPortCenter(conn.from, conn.fromPort);
            const end = this._getPortCenter(conn.to, conn.toPort);
            if (!start || !end) continue;
            const dx = Math.max(Math.abs(end.x - start.x) * 0.4, 60);
            const d = `M${start.x},${start.y} C${start.x+dx},${start.y} ${end.x-dx},${end.y} ${end.x},${end.y}`;
            // 发光效果
            const glow = document.createElementNS('http://www.w3.org/2000/svg','path');
            glow.setAttribute('d', d); glow.setAttribute('stroke','#818cf8'); glow.setAttribute('stroke-width','6'); glow.setAttribute('fill','none'); glow.setAttribute('opacity','0.08');
            glow.style.pointerEvents = 'none';
            svg.appendChild(glow);
            // 粗线(可点击删除)
            const hit = document.createElementNS('http://www.w3.org/2000/svg','path');
            hit.setAttribute('d', d); hit.setAttribute('stroke','transparent'); hit.setAttribute('stroke-width','16'); hit.setAttribute('fill','none');
            hit.style.cursor = 'pointer'; hit.style.pointerEvents = 'stroke';
            const connRef = conn;
            hit.addEventListener('click', () => { this.connections = this.connections.filter(c => c !== connRef); this.drawConnections(); });
            svg.appendChild(hit);
            // 可见线
            const path = document.createElementNS('http://www.w3.org/2000/svg','path');
            path.setAttribute('d', d); path.setAttribute('stroke','#818cf8'); path.setAttribute('stroke-width','2.5'); path.setAttribute('fill','none'); path.setAttribute('opacity','0.5');
            path.style.pointerEvents = 'none';
            svg.appendChild(path);
            // 箭头
            const arrowX = (start.x + end.x) / 2 + 10;
            const arrowY = (start.y + end.y) / 2;
            const arrow = document.createElementNS('http://www.w3.org/2000/svg','circle');
            arrow.setAttribute('cx', arrowX); arrow.setAttribute('cy', arrowY); arrow.setAttribute('r', '3');
            arrow.setAttribute('fill', '#818cf8'); arrow.setAttribute('opacity', '0.4');
            arrow.style.pointerEvents = 'none';
            svg.appendChild(arrow);
        }
        // 更新计数
        const countEl = document.getElementById('tc-node-count');
        if (countEl) countEl.textContent = `${this.nodes.length} 节点 · ${this.connections.length} 连线`;
    },

    // ═══════════════════════════════════════════
    // 工作流执行引擎
    // ═══════════════════════════════════════════

    // ★ Phase 5: 创作模式一键工作流
    async _runModeWorkflow(mode) {
        const proj = await GenesisCore.getActiveProject();
        if (!proj) {
            // 无活跃项目，先引导创建
            const name = prompt('请输入项目名称：');
            if (!name) return UI.toast('已取消');
            const newProj = await GenesisCore.createProject({ name, mode });
            await Modules.project_manager._activateProject(newProj.id);
        }

        switch(mode) {
            case 'phoenix':
                UI.toast('启动凤凰创作流...');
                setTimeout(() => Navigation.show('phoenix'), 300);
                break;
            case 'import':
                UI.toast('启动导入模式...');
                setTimeout(() => {
                    Navigation.show('world_engine');
                    setTimeout(() => Modules.world_engine._openNovelImportModal?.(), 500);
                }, 300);
                break;
            case 'fusion':
                UI.toast('启动拆书融合...');
                setTimeout(() => Navigation.show('fusion_book'), 300);
                break;
        }
    }
};
