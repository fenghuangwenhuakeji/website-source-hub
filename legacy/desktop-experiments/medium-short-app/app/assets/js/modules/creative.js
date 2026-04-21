/*  */// ═══════════════════════════════════════════════════════════════
// 创意工坊 (Creative Studio) — 大幅强化版
// 短篇创作 · 灵感引擎 · 热点分析 · 脑洞生成 · 快写模式
// 辅助长篇写作的灵感中枢 + 独立短篇创作工作台
// ═══════════════════════════════════════════════════════════════
Modules.creative_studio = {
    currentTab: 'inspiration',
    shortDraft: { title: '', genre: '', outline: '', content: '', wordTarget: 3000 },
    hotCache: [],
    brainStorm: [],
    ideaPool: [],
    _selectedQuickType: null,
    _selectedQuickPrompt: '',
    _customQuickPrompt: '',
    _tabCache: {},
    _genHistory: [],
    _batchCount: 3,
    _deepMode: false,

    render: () => {
        const CS = Modules.creative_studio;
        const t = CS.currentTab;
        const tabs = [
            {id:'inspiration', icon:'fa-lightbulb', text:'灵感引擎', color:'text-yellow-400'},
            {id:'short_write', icon:'fa-feather-pointed', text:'短篇快写', color:'text-green-400'},
            {id:'hotspot', icon:'fa-fire-flame-curved', text:'热点分析', color:'text-red-400'},
            {id:'brainstorm', icon:'fa-brain', text:'脑洞风暴', color:'text-purple-400'},
            {id:'idea_pool', icon:'fa-bucket', text:'灵感池', color:'text-cyan-400'}
        ];
        return `
        <div class="flex h-full bg-[#F8F9FA] overflow-hidden">
            <div class="w-64 shrink-0 flex flex-col bg-[#F1F3F5] border-r border-gray-200">
                <div class="p-4 border-b border-gray-200 bg-gradient-to-r from-yellow-900/20 to-transparent">
                    <div class="flex items-center gap-2">
                        <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 flex center text-gray-800 text-sm shadow-lg shadow-yellow-500/20"><i class="fa-solid fa-wand-magic-sparkles"></i></div>
                        <div>
                            <div class="font-bold text-white text-base">创意工坊</div>
                            <div class="text-xs text-gray-200 font-bold">灵感 · 短篇 · 热点 · 脑洞</div>
                        </div>
                    </div>
                </div>
                <div class="p-2 space-y-1">
                    ${tabs.map(tb => `
                        <button class="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left text-sm font-bold transition-all ${t===tb.id ? 'bg-gradient-to-r from-gray-200 to-gray-100 text-gray-800 border-2 border-gray-300 shadow-sm' : 'text-gray-600 hover:bg-gray-100 border-2 border-transparent'}" onclick="Modules.creative_studio.switchTab('${tb.id}')">
                            <i class="fa-solid ${tb.icon} ${tb.color} w-5 text-center"></i>
                            <span>${tb.text}</span>
                        </button>
                    `).join('')}
                </div>
                <div class="flex-1"></div>
                <div class="p-3 border-t border-gray-200 bg-white space-y-2">
                    <button class="btn py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white border-none shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 transition-all hover:scale-105 rounded-lg w-full" onclick="Modules.creative_studio._exportAll()">
                        <i class="fa-solid fa-download mr-2"></i>
                        <span class="text-sm font-bold">导出全部灵感</span>
                    </button>
                    <button class="btn py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white border-none shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all hover:scale-105 rounded-lg w-full" onclick="Modules.creative_studio._toPhoenix()">
                        <i class="fa-solid fa-fire mr-2"></i>
                        <span class="text-sm font-bold">灵感→凤凰流</span>
                    </button>
                </div>
            </div>
            <div class="flex-1 flex flex-col min-w-0">
                <div class="flex-1 flex flex-col min-w-0 overflow-hidden" id="cs-workspace">${CS._renderWorkspace()}</div>
                <div id="cs-io-panel" class="shrink-0 border-t border-gray-200 bg-white" style="display:none">
                    <div class="flex items-center justify-between px-3 py-1 bg-gray-100 border-b border-gray-200 cursor-pointer" onclick="Modules.creative_studio._toggleIOBody()">
                        <span class="text-xs font-bold text-amber-600 flex items-center gap-2">
                        <i class="fa-solid fa-terminal text-amber-500"></i>
                        IO 调试
                    </span>
                        <span id="cs-io-chars" class="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-lg border border-gray-200"></span>
                    </div>
                    <div id="cs-io-body" class="flex gap-2 p-2 h-36">
                        <div class="flex-1 flex flex-col">
                            <span class="text-xs font-bold text-blue-600 mb-1 flex items-center gap-1.5">
                            <i class="fa-solid fa-paper-plane text-blue-400"></i>
                            发送 (Prompt)
                        </span>
                            <textarea id="cs-io-in" class="flex-1 bg-white border-2 border-gray-300 rounded-lg p-2 text-xs text-gray-700 font-mono resize-none focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200" readonly></textarea>
                        </div>
                        <div class="flex-1 flex flex-col">
                            <span class="text-xs font-bold text-green-600 mb-1 flex items-center gap-1.5">
                            <i class="fa-solid fa-inbox text-green-400"></i>
                            接收 (Response)
                        </span>
                            <textarea id="cs-io-out" class="flex-1 bg-white border-2 border-gray-300 rounded-lg p-2 text-xs text-green-700 font-mono resize-none focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-200" readonly></textarea>
                        </div>
                    </div>
                </div>
                <button class="shrink-0 w-full text-center text-xs font-bold text-gray-600 py-2 bg-white border-t-2 border-gray-200 hover:text-amber-500 hover:bg-amber-50 transition-all" onclick="Modules.creative_studio._toggleIO()">
                    <i class="fa-solid fa-terminal mr-1.5"></i>
                    IO 调试
                </button>
            </div>
        </div>`;
    },

    switchTab(tab) {
        // 保存当前tab的DOM内容到缓存
        this._saveTabCache();
        this.currentTab = tab;
        // 只重渲染工作区，不重建整个模块（保留IO面板）
        const ws = document.getElementById('cs-workspace');
        if (ws) {
            ws.innerHTML = this._renderWorkspace();
        } else {
            const v = document.getElementById('module-view-creative_studio');
            if(v) v.innerHTML = this.render();
        }
        // 更新左侧导航高亮
        this._updateSidebarHighlight();
        this._restoreTabCache();
        // 恢复IO面板内容
        this._restoreIO();
        if(tab==='idea_pool') this._loadIdeaPool();
    },
    init() {
        this._restoreTabCache();
        this._restoreIO();
        if(this.currentTab==='idea_pool') this._loadIdeaPool();
    },
    // 保存当前tab关键DOM值
    _saveTabCache() {
        const t = this.currentTab;
        const c = {};
        if (t === 'inspiration') {
            c.freeInput = (document.getElementById('cs-free-input') || {}).value || '';
            c.freeType = (document.getElementById('cs-free-type') || {}).value || '';
            c.freeGenre = (document.getElementById('cs-free-genre') || {}).value || '';
            c.result = (document.getElementById('cs-result') || {}).innerHTML || '';
            c.customPrompt = (document.getElementById('cs-custom-prompt') || {}).value || this._customQuickPrompt;
        } else if (t === 'short_write') {
            this.shortDraft.title = (document.getElementById('cs-sw-title') || {}).value || this.shortDraft.title;
            this.shortDraft.genre = (document.getElementById('cs-sw-genre') || {}).value || this.shortDraft.genre;
            this.shortDraft.outline = (document.getElementById('cs-sw-outline') || {}).value || this.shortDraft.outline;
            this.shortDraft.content = (document.getElementById('cs-sw-content') || {}).value || this.shortDraft.content;
        } else if (t === 'hotspot') {
            c.hotInput = (document.getElementById('cs-hot-input') || {}).value || '';
            c.hotResult = (document.getElementById('cs-hot-result') || {}).innerHTML || '';
        } else if (t === 'brainstorm') {
            c.bsTopic = (document.getElementById('cs-bs-topic') || {}).value || '';
            c.bsCount = (document.getElementById('cs-bs-count') || {}).value || '10';
            c.bsResults = (document.getElementById('cs-bs-results') || {}).innerHTML || '';
        }
        this._tabCache[t] = c;
    },
    // 恢复tab的DOM值
    _restoreTabCache() {
        const t = this.currentTab;
        const c = this._tabCache[t];
        if (!c) return;
        setTimeout(() => {
            if (t === 'inspiration') {
                const fi = document.getElementById('cs-free-input'); if (fi && c.freeInput) fi.value = c.freeInput;
                const ft = document.getElementById('cs-free-type'); if (ft && c.freeType) ft.value = c.freeType;
                const fg = document.getElementById('cs-free-genre'); if (fg && c.freeGenre) fg.value = c.freeGenre;
                const r = document.getElementById('cs-result'); if (r && c.result) r.innerHTML = c.result;
                const cp = document.getElementById('cs-custom-prompt'); if (cp && c.customPrompt) cp.value = c.customPrompt;
                if (c.customPrompt) this._customQuickPrompt = c.customPrompt;
            } else if (t === 'short_write') {
                const ti = document.getElementById('cs-sw-title'); if (ti) ti.value = this.shortDraft.title;
                const ge = document.getElementById('cs-sw-genre'); if (ge) ge.value = this.shortDraft.genre;
                const ol = document.getElementById('cs-sw-outline'); if (ol) ol.value = this.shortDraft.outline;
                const co = document.getElementById('cs-sw-content'); if (co) co.value = this.shortDraft.content;
            } else if (t === 'hotspot') {
                const hi = document.getElementById('cs-hot-input'); if (hi && c.hotInput) hi.value = c.hotInput;
                const hr = document.getElementById('cs-hot-result'); if (hr && c.hotResult) hr.innerHTML = c.hotResult;
            } else if (t === 'brainstorm') {
                const bt = document.getElementById('cs-bs-topic'); if (bt && c.bsTopic) bt.value = c.bsTopic;
                const bc = document.getElementById('cs-bs-count'); if (bc && c.bsCount) bc.value = c.bsCount;
                const br = document.getElementById('cs-bs-results'); if (br && c.bsResults) br.innerHTML = c.bsResults;
            }
        }, 0);
    },

    // ═══ IO 调试面板 ═══
    _ioVisible: false,
    _toggleIO() {
        this._ioVisible = !this._ioVisible;
        const p = document.getElementById('cs-io-panel');
        if (p) p.style.display = this._ioVisible ? '' : 'none';
    },
    _toggleIOBody() {
        const b = document.getElementById('cs-io-body');
        if (b) b.style.display = b.style.display === 'none' ? '' : 'none';
    },
    updateIO(input, output) {
        // 缓存IO内容
        this._ioCache = { input: input || '', output: output || '' };
        // 自动展开IO面板
        if (!this._ioVisible) {
            this._ioVisible = true;
            const p = document.getElementById('cs-io-panel');
            if (p) p.style.display = '';
        }
        const inEl = document.getElementById('cs-io-in');
        const outEl = document.getElementById('cs-io-out');
        if (inEl) inEl.value = input || '';
        if (outEl) outEl.value = output || '';
        // 字符计数
        const ch = document.getElementById('cs-io-chars');
        if (ch) ch.textContent = `In: ${(input||'').length} | Out: ${(output||'').length}`;
        // 自动滚到底部
        if (outEl) outEl.scrollTop = outEl.scrollHeight;
    },
    _ioCache: { input: '', output: '' },
    _restoreIO() {
        const c = this._ioCache;
        if (!c.input && !c.output) return;
        const inEl = document.getElementById('cs-io-in');
        const outEl = document.getElementById('cs-io-out');
        if (inEl) inEl.value = c.input;
        if (outEl) outEl.value = c.output;
        const ch = document.getElementById('cs-io-chars');
        if (ch) ch.textContent = `In: ${c.input.length} | Out: ${c.output.length}`;
        // 恢复IO面板可见状态
        const p = document.getElementById('cs-io-panel');
        if (p) p.style.display = this._ioVisible ? '' : 'none';
    },
    _updateSidebarHighlight() {
        const t = this.currentTab;
        const tabs = ['inspiration','short_write','hotspot','brainstorm','idea_pool'];
        tabs.forEach(id => {
            // 找到对应按钮（通过onclick内容匹配）
            const btns = document.querySelectorAll(`[onclick="Modules.creative_studio.switchTab('${id}')"]`);
            btns.forEach(btn => {
                if (id === t) {
                    btn.className = btn.className.replace(/text-dim hover:bg-white\/5 border border-transparent/g, 'bg-gray-200 text-gray-800 border border-gray-300');
                    if (!btn.className.includes('bg-gray-200')) btn.className += ' bg-gray-200 text-gray-800 border border-gray-300';
                } else {
                    btn.className = btn.className.replace(/bg-white\/10 text-gray-800 border border-white\/10/g, 'text-dim hover:bg-gray-100 border border-transparent');
                }
            });
        });
    },

    _renderWorkspace() {
        const t = this.currentTab;

        // ═══ 灵感引擎 ═══
        if(t === 'inspiration') {
            const sel = this._selectedQuickType;
            const cards = [
                ['idea','反直觉脑洞','fa-explosion','amber','生成一个打破常规认知的小说脑洞创意，要求新颖、有冲击力、有故事潜力'],
                ['title','爆款书名','fa-heading','blue','生成5个极具吸引力的网文书名，涵盖不同类型，每个附带一句话卖点'],
                ['twist','神反转','fa-rotate','purple','生成一个让读者意想不到的情节反转，要求逻辑自洽且情感冲击力强'],
                ['char','矛盾角色','fa-user-secret','green','生成一个性格极其矛盾但真实可信的角色设定，包含外在表现和内在动机'],
                ['scene','名场面','fa-film','pink','生成一个极具画面感和情感张力的经典场面描写，可直接用于小说'],
                ['opening','黄金开头','fa-play','red','生成一个让读者无法放下的小说开头(300字)，要求3秒抓住注意力'],
                ['hook','悬念钩子','fa-anchor','cyan','生成一个让读者欲罢不能的悬念钩子设计，包含伏笔和揭秘时机'],
                ['climax','高潮设计','fa-bolt','orange','生成一个燃爆的高潮场景设计，包含铺垫、爆发、释放三阶段'],
                ['conflict','核心冲突','fa-bolt-lightning','rose','生成一个多层次的冲突设计，包含表面冲突和深层矛盾'],
                ['world','世界观核','fa-globe','indigo','生成一个独特的世界观核心设定，包含规则体系和矛盾点'],
                ['magic','金手指设计','fa-wand-sparkles','violet','生成一个创新的主角金手指/系统设定，有成长性和限制性'],
                ['custom','自定义灵感','fa-pen-to-square','slate','']
            ];
            return `
            <div class="h-11 flex items-center px-5 bg-[#F1F3F5] border-b border-gray-200 shrink-0">
                <span class="text-sm font-bold text-yellow-600 flex items-center gap-2">
                    <i class="fa-solid fa-lightbulb text-xl text-yellow-500"></i>
                    灵感引擎 — 选择类型 → 点击生成
                </span>
                <div class="flex-1"></div>
                <div class="flex items-center gap-2">
                    <label class="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer hover:text-gray-900 p-2 rounded-lg hover:bg-indigo-50 transition-all">
                        <input type="checkbox" class="w-4 h-4 rounded accent-indigo-500" ${this._deepMode ? 'checked' : ''} onchange="Modules.creative_studio._toggleDeepMode()">
                        <span>深度模式</span>
                    </label>
                    <select class="bg-white border-2 border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-700 font-bold focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200" onchange="Modules.creative_studio._batchCount=+this.value">
                        <option value="1" ${this._batchCount===1?'selected':''}>单次生成</option>
                        <option value="3" ${this._batchCount===3?'selected':''}>批量×3</option>
                        <option value="5" ${this._batchCount===5?'selected':''}>批量×5</option>
                        <option value="10" ${this._batchCount===10?'selected':''}>批量×10</option>
                    </select>
                    <button class="btn px-3 py-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-400 hover:to-gray-500 text-white border-none shadow-lg shadow-gray-500/30 hover:shadow-gray-500/50 transition-all hover:scale-105 rounded-lg" onclick="Modules.creative_studio._showHistory()">
                        <i class="fa-solid fa-clock-rotate-left mr-1.5"></i>
                        <span class="text-xs font-bold">历史</span>
                    </button>
                </div>
            </div>
            <div class="flex-1 overflow-y-auto p-6 space-y-4">
                <div class="grid grid-cols-4 gap-2">
                    ${cards.map(([k,name,icon,color]) => `
                        <button class="p-3 rounded-xl border-2 transition-all text-left group ${sel===k ? 'bg-'+color+'-900/30 border-'+color+'-400 shadow-lg shadow-'+color+'-500/20 ring-1 ring-'+color+'-400/50' : 'bg-'+color+'-900/10 border-'+color+'-500/15 hover:border-'+color+'-500/40'}" onclick="Modules.creative_studio._selectQuickType('${k}')">
                            <div class="flex items-center gap-2">
                                <i class="fa-solid ${icon} text-${color}-400 ${sel===k ? 'animate-pulse' : ''}"></i>
                                <span class="text-sm font-bold text-${color}-300">${name}</span>
                                ${sel===k ? '<i class="fa-solid fa-check-circle text-'+color+'-400 ml-auto text-xs"></i>' : ''}
                            </div>
                        </button>
                    `).join('')}
                </div>
                ${sel === 'custom' ? `
                <div class="bg-white rounded-xl border border-cyan-500/20 p-4 space-y-2">
                    <span class="text-sm font-bold text-cyan-600 flex items-center gap-2">
                    <i class="fa-solid fa-pen-to-square text-cyan-400"></i>
                    自定义灵感提示词
                </span>
                    <textarea id="cs-custom-prompt" class="textarea bg-gray-100 border-gray-300 text-gray-800 w-full h-24 text-xs leading-relaxed resize-none" placeholder="输入你想让AI生成的任何灵感类型，例如：&#10;生成一个赛博朋克风格的悬疑开头...&#10;设计一个双重人格的反派角色..." oninput="Modules.creative_studio._customQuickPrompt=this.value">${this._customQuickPrompt}</textarea>
                </div>` : ''}
                <div class="flex justify-center">
                    <button class="btn h-12 px-12 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-bold text-base shadow-xl shadow-yellow-500/40 hover:shadow-yellow-500/60 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105" onclick="Modules.creative_studio._doQuickGen()" ${!sel ? 'disabled' : ''}>
                        <i class="fa-solid fa-wand-magic-sparkles mr-2"></i>
                        <span>${sel ? '生成「' + (cards.find(c=>c[0]===sel)||[])[1] + '」' : '请先选择灵感类型'}</span>
                    </button>
                </div>
                <div class="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                    <div class="flex items-center justify-between">
                        <span class="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <i class="fa-solid fa-lightbulb text-yellow-400"></i>
                        自由灵感生成
                    </span>
                        <button class="btn px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white border-none shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 transition-all hover:scale-105 rounded-lg" onclick="Modules.creative_studio._freeGen()">
                        <i class="fa-solid fa-wand-magic-sparkles mr-1.5"></i>
                        <span class="text-sm font-bold">生成</span>
                    </button>
                    </div>
                    <input id="cs-free-input" class="input bg-white border-2 border-gray-300 rounded-lg text-gray-800 w-full px-4 py-3 text-sm focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-200" placeholder="输入关键词、主题或任何灵感碎片...">
                    <div class="flex gap-2">
                        <select id="cs-free-type" class="input bg-white border-2 border-gray-300 rounded-lg text-gray-800 text-sm font-bold flex-1 px-3 py-2.5 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200">
                            <option value="idea">脑洞创意</option><option value="outline">速写大纲</option><option value="scene">场景描写</option>
                            <option value="dialogue">精彩对话</option><option value="emotion">情感渲染</option><option value="world">世界观补全</option>
                            <option value="ending">意外结局</option><option value="conflict">核心冲突</option>
                        </select>
                        <select id="cs-free-genre" class="input bg-white border-2 border-gray-300 rounded-lg text-gray-800 text-sm font-bold flex-1 px-3 py-2.5 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200">
                            <option value="">不限类型</option><option value="玄幻">玄幻</option><option value="都市">都市</option>
                            <option value="科幻">科幻</option><option value="悬疑">悬疑</option><option value="言情">言情</option>
                            <option value="历史">历史</option><option value="恐怖">恐怖</option><option value="奇幻">奇幻</option>
                        </select>
                    </div>
                </div>
                <div class="bg-white rounded-xl border border-gray-200 flex flex-col min-h-[250px]">
                    <div class="flex items-center justify-between px-4 py-2 border-b border-gray-200">
                        <span class="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <i class="fa-solid fa-file-lines text-yellow-400"></i>
                        生成结果
                    </span>
                        <div class="flex gap-1">
                            <button class="btn px-3 py-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-400 hover:to-gray-500 text-white border-none shadow-lg shadow-gray-500/30 hover:shadow-gray-500/50 transition-all hover:scale-105 rounded-lg" onclick="Utils.copy(document.getElementById('cs-result').innerText)">
                            <i class="fa-solid fa-copy"></i>
                            <span class="text-xs font-bold ml-1">复制</span>
                        </button>
                            <button class="btn px-3 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white border-none shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all hover:scale-105 rounded-lg" onclick="Modules.creative_studio._saveToPool()">
                            <i class="fa-solid fa-bucket mr-1.5"></i>
                            <span class="text-xs font-bold">存灵感池</span>
                        </button>
                            <button class="btn px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white border-none shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all hover:scale-105 rounded-lg" onclick="Modules.creative_studio._resultToLibrary()">
                            <i class="fa-solid fa-book mr-1.5"></i>
                            <span class="text-xs font-bold">存阅读</span>
                        </button>
                        </div>
                    </div>
                    <div id="cs-result" class="flex-1 p-4 text-sm text-gray-600 leading-relaxed overflow-y-auto markdown-body"></div>
                </div>
            </div>`;
        }

        // ═══ 短篇快写 ═══
        if(t === 'short_write') return this._renderShortWrite();

        // ═══ 热点分析 ═══
        if(t === 'hotspot') return this._renderHotspot();

        // ═══ 脑洞风暴 ═══
        if(t === 'brainstorm') return `
            <div class="h-11 flex items-center justify-between px-5 bg-[#F1F3F5] border-b border-gray-200 shrink-0">
                <span class="text-xs font-bold text-purple-400"><i class="fa-solid fa-brain mr-1"></i>脑洞风暴 — 批量创意碰撞</span>
                <div class="flex gap-2">
                    <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30" onclick="Modules.creative_studio._randomCollision()"><i class="fa-solid fa-shuffle mr-1"></i>随机碰撞</button>
                    <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30" onclick="Modules.creative_studio._ideaEvolution()"><i class="fa-solid fa-dna mr-1"></i>创意进化</button>
                    <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30" onclick="Modules.creative_studio._runBrainStorm()"><i class="fa-solid fa-bolt mr-1"></i>开始风暴</button>
                </div>
            </div>
            <div class="flex-1 overflow-y-auto p-6 space-y-4">
                <div class="grid grid-cols-3 gap-4">
                    <div class="space-y-2">
                        <span class="text-xs font-bold text-gray-700 flex items-center gap-2">
                            <i class="fa-solid fa-tag text-purple-400"></i>
                            主题/关键词
                        </span>
                        <input id="cs-bs-topic" class="input bg-gray-100 border-gray-300 text-gray-800 w-full" placeholder="例如：末日、AI觉醒、时间循环...">
                    </div>
                    <div class="space-y-2">
                        <span class="text-xs font-bold text-gray-700 flex items-center gap-2">
                            <i class="fa-solid fa-hashtag text-indigo-400"></i>
                            生成数量
                        </span>
                        <select id="cs-bs-count" class="input bg-gray-100 border-gray-300 text-gray-800 w-full">
                            <option value="5">5个创意</option><option value="10" selected>10个创意</option><option value="20">20个创意</option>
                            <option value="30">30个创意</option>
                        </select>
                    </div>
                    <div class="space-y-2">
                        <span class="text-xs font-bold text-gray-700 flex items-center gap-2">
                            <i class="fa-solid fa-sliders text-cyan-400"></i>
                            创意模式
                        </span>
                        <select id="cs-bs-mode" class="input bg-gray-100 border-gray-300 text-gray-800 w-full">
                            <option value="normal">普通模式</option>
                            <option value="extreme">极端脑洞</option>
                            <option value="crossover">跨界融合</option>
                            <option value="subvert">颠覆套路</option>
                        </select>
                    </div>
                </div>
                <div class="flex flex-wrap gap-2">
                    ${['反套路','跨类型混搭','极端设定','情感核弹','社会隐喻','黑色幽默','硬核科幻','东方玄幻','赛博朋克','克苏鲁'].map(tag => `
                        <button class="px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-50 to-pink-50 text-purple-600 border-2 border-purple-200 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/20 transition-all hover:scale-105" onclick="document.getElementById('cs-bs-topic').value+=' ${tag}'">${tag}</button>
                    `).join('')}
                </div>
                <!-- 创意组合器 -->
                <div class="bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-xl border border-purple-500/20 p-4">
                    <div class="text-xs font-bold text-purple-600 mb-3 flex items-center gap-2">
                            <i class="fa-solid fa-layer-group text-purple-400"></i>
                            创意组合器
                        </div>
                    <div class="grid grid-cols-3 gap-2">
                        <div>
                            <div class="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                                <i class="fa-solid fa-circle text-[6px] text-purple-400"></i>
                                元素 A
                            </div>
                            <input id="cs-bs-elem-a" class="input bg-white border-2 border-gray-300 rounded-lg w-full text-sm px-3 py-2 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200" placeholder="如：重生">
                        </div>
                        <div>
                            <div class="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                                <i class="fa-solid fa-circle text-[6px] text-pink-400"></i>
                                元素 B
                            </div>
                            <input id="cs-bs-elem-b" class="input bg-white border-2 border-gray-300 rounded-lg w-full text-sm px-3 py-2 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-200" placeholder="如：模拟器">
                        </div>
                        <div>
                            <div class="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                                <i class="fa-solid fa-circle text-[6px] text-cyan-400"></i>
                                元素 C
                            </div>
                            <input id="cs-bs-elem-c" class="input bg-white border-2 border-gray-300 rounded-lg w-full text-sm px-3 py-2 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-200" placeholder="如：签到系统">
                        </div>
                    </div>
                    <button class="btn py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white border-none shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transition-all hover:scale-105 rounded-lg w-full" onclick="Modules.creative_studio._combineElements()">
                        <i class="fa-solid fa-blender mr-2"></i>
                        <span class="text-sm font-bold">组合生成创意</span>
                    </button>
                </div>
                <div id="cs-bs-results" class="grid grid-cols-2 gap-3"></div>
            </div>`;

        // ═══ 灵感池 ═══
        if(t === 'idea_pool') return `
            <div class="h-11 flex items-center justify-between px-5 bg-[#F1F3F5] border-b border-gray-200 shrink-0">
                <span class="text-xs font-bold text-cyan-400"><i class="fa-solid fa-bucket mr-1"></i>灵感池 — 收集 · 管理 · 复用</span>
                <div class="flex gap-2">
                    <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30" onclick="Modules.creative_studio._addIdeaManual()"><i class="fa-solid fa-plus mr-1"></i>手动添加</button>
                    <button class="btn btn-xs bg-red-600/20 text-red-400 border-red-600/30" onclick="Modules.creative_studio._clearPool()"><i class="fa-solid fa-trash mr-1"></i>清空</button>
                </div>
            </div>
            <div class="flex-1 overflow-y-auto p-6">
                <div id="cs-pool-list" class="grid grid-cols-3 gap-3"></div>
            </div>`;

        return '';
    },

    // ═══ 短篇快写工作台 ═══
    _renderShortWrite() {
        const d = this.shortDraft;
        const templates = [
            { name: '悬疑反转', outline: '开篇设置悬念→层层铺垫→误导读者→惊人真相→反转结局' },
            { name: '治愈系', outline: '主角遭遇困境→遇见温暖的人/事→逐渐治愈→成长蜕变' },
            { name: '爽文短篇', outline: '主角被欺压→获得金手指→打脸反转→收获满满' },
            { name: '科幻脑洞', outline: '日常场景→发现异常→探索真相→震撼结局' },
            { name: '言情甜宠', outline: '意外相遇→欢喜冤家→感情升温→甜蜜结局' },
            { name: '恐怖惊悚', outline: '诡异氛围→恐怖事件→绝望挣扎→开放式结局' }
        ];
        return `
            <div class="h-11 flex items-center justify-between px-5 bg-[#F1F3F5] border-b border-gray-200 shrink-0">
                <span class="text-xs font-bold text-green-400"><i class="fa-solid fa-feather-pointed mr-1"></i>短篇快写工作台</span>
                <div class="flex gap-2">
                    <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30" onclick="Modules.creative_studio._oneClickWrite()"><i class="fa-solid fa-bolt mr-1"></i>一键成文</button>
                    <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30" onclick="Modules.creative_studio._aiShortOutline()"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>AI生成大纲</button>
                    <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30" onclick="Modules.creative_studio._aiShortWrite()"><i class="fa-solid fa-pen-nib mr-1"></i>AI写正文</button>
                    <button class="btn btn-xs bg-blue-600/20 text-blue-400 border-blue-600/30" onclick="Modules.creative_studio._saveShort()"><i class="fa-solid fa-save mr-1"></i>保存</button>
                </div>
            </div>
            <div class="flex h-full min-h-0">
                <div class="w-72 shrink-0 border-r border-gray-200 flex flex-col bg-[#F1F3F5]">
                    <div class="p-3 space-y-3 overflow-y-auto flex-1">
                        <div class="space-y-1">
                            <span class="text-[10px] text-dim font-bold">标题</span>
                            <input id="cs-sw-title" class="input bg-gray-100 border-gray-300 text-gray-800 w-full font-bold" placeholder="短篇标题" value="${d.title}" oninput="Modules.creative_studio.shortDraft.title=this.value">
                        </div>
                        <div class="space-y-1">
                            <span class="text-[10px] text-dim font-bold">类型</span>
                            <select id="cs-sw-genre" class="input bg-gray-100 border-gray-300 text-gray-800 w-full text-xs" onchange="Modules.creative_studio.shortDraft.genre=this.value">
                                <option value="">选择类型</option><option>玄幻短篇</option><option>都市短篇</option><option>科幻短篇</option>
                                <option>悬疑短篇</option><option>言情短篇</option><option>恐怖短篇</option><option>童话寓言</option><option>微小说</option>
                            </select>
                        </div>
                        <div class="space-y-1">
                            <span class="text-[10px] text-dim font-bold">目标字数</span>
                            <select id="cs-sw-target" class="input bg-gray-100 border-gray-300 text-gray-800 w-full text-xs" onchange="Modules.creative_studio.shortDraft.wordTarget=+this.value">
                                <option value="1000">1000字 (微小说)</option><option value="3000" selected>3000字 (短篇)</option>
                                <option value="5000">5000字 (中短篇)</option><option value="10000">10000字 (中篇)</option>
                            </select>
                        </div>
                        <div class="space-y-1 flex-1">
                            <div class="flex justify-between items-center">
                                <span class="text-[10px] text-dim font-bold">大纲/构思</span>
                            </div>
                            <textarea id="cs-sw-outline" class="textarea bg-gray-100 border-gray-300 text-gray-600 w-full min-h-[150px] text-xs leading-relaxed resize-none" placeholder="故事梗概、人物设定、情节走向..." oninput="Modules.creative_studio.shortDraft.outline=this.value">${d.outline}</textarea>
                        </div>
                        <div class="flex gap-2">
                            <button class="btn btn-xs bg-yellow-600/20 text-yellow-400 flex-1" onclick="Modules.creative_studio._aiShortContinue()"><i class="fa-solid fa-play mr-1"></i>AI续写</button>
                            <button class="btn btn-xs bg-pink-600/20 text-pink-400 flex-1" onclick="Modules.creative_studio._aiShortPolish()"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>润色</button>
                        </div>
                        <div class="text-[10px] text-dim bg-gray-100 rounded p-2 border border-gray-200">
                            <div>当前字数: <span class="text-green-400 font-bold" id="cs-sw-wc">0</span> / ${d.wordTarget}</div>
                        </div>
                    </div>
                </div>
                <div class="w-56 shrink-0 border-r border-gray-200 bg-white p-3 space-y-2 overflow-y-auto">
                    <div class="text-[10px] text-dim font-bold uppercase tracking-wider"><i class="fa-solid fa-bookmark mr-1 text-green-400"></i>模板库</div>
                    ${templates.map(t => `
                        <button class="w-full text-left px-3 py-2 rounded-lg text-[10px] bg-gray-100 hover:bg-green-500/10 hover:text-green-400 border border-transparent hover:border-green-500/20 transition-all" onclick="Modules.creative_studio._applyTemplate('${t.name}','${t.outline}')">
                            <div class="font-bold">${t.name}</div>
                            <div class="text-[9px] text-dim mt-0.5 line-clamp-1">${t.outline}</div>
                        </button>
                    `).join('')}
                    <div class="border-t border-gray-200 pt-2 mt-2">
                        <div class="text-[10px] text-dim font-bold uppercase tracking-wider mb-1"><i class="fa-solid fa-sliders mr-1 text-amber-400"></i>写作风格</div>
                        <select id="cs-sw-style" class="input bg-gray-100 border-gray-300 text-gray-800 w-full text-[10px]">
                            <option value="default">默认风格</option>
                            <option value="literary">文艺细腻</option>
                            <option value="humorous">幽默诙谐</option>
                            <option value="suspense">悬疑紧张</option>
                            <option value="passionate">热血激昂</option>
                            <option value="warm">温馨治愈</option>
                        </select>
                    </div>
                    <div class="border-t border-gray-200 pt-2 mt-2">
                        <div class="text-[10px] text-dim font-bold uppercase tracking-wider mb-1"><i class="fa-solid fa-user mr-1 text-cyan-400"></i>视角</div>
                        <select id="cs-sw-pov" class="input bg-gray-100 border-gray-300 text-gray-800 w-full text-[10px]">
                            <option value="first">第一人称</option>
                            <option value="third">第三人称</option>
                            <option value="multi">多视角</option>
                        </select>
                    </div>
                </div>
                <div class="flex-1 flex flex-col min-w-0">
                    <textarea id="cs-sw-content" class="flex-1 bg-transparent border-none p-6 text-base text-gray-700 leading-loose resize-none focus:outline-none font-serif" placeholder="在此创作短篇正文..." oninput="Modules.creative_studio.shortDraft.content=this.value;Modules.creative_studio._updateWC()">${d.content}</textarea>
                </div>
            </div>`;
    },
    
    _applyTemplate(name, outline) {
        const titleEl = document.getElementById('cs-sw-title');
        const outlineEl = document.getElementById('cs-sw-outline');
        if (titleEl) titleEl.value = name + '短篇';
        if (outlineEl) outlineEl.value = outline;
        this.shortDraft.title = name + '短篇';
        this.shortDraft.outline = outline;
        UI.toast('已应用模板: ' + name);
    },
    
    async _oneClickWrite() {
        const title = (document.getElementById('cs-sw-title') || {}).value || '未命名短篇';
        const genre = (document.getElementById('cs-sw-genre') || {}).value || '短篇';
        const style = (document.getElementById('cs-sw-style') || {}).value || 'default';
        const pov = (document.getElementById('cs-sw-pov') || {}).value || 'third';
        const target = this.shortDraft.wordTarget || 3000;
        
        const styleMap = {
            default: '标准叙事风格',
            literary: '文艺细腻，注重心理描写和意象运用',
            humorous: '幽默诙谐，轻松有趣的笔调',
            suspense: '悬疑紧张，节奏紧凑，伏笔密集',
            passionate: '热血激昂，情感充沛',
            warm: '温馨治愈，温暖人心的笔调'
        };
        
        const povMap = {
            first: '第一人称"我"的视角',
            third: '第三人称全知视角',
            multi: '多视角切换叙事'
        };
        
        // 先生成大纲
        const outlinePrompt = `请为短篇小说生成详细大纲：
标题：${title}
类型：${genre}
风格：${styleMap[style]}
视角：${povMap[pov]}
目标字数：${target}字

要求：
1. 包含开端、发展、高潮、结局四个阶段
2. 每个阶段标注预计字数分配
3. 明确主要角色和核心冲突
4. 标注情绪曲线走向
5. 设计悬念钩子和反转点`;

        const outlineEl = document.getElementById('cs-sw-outline');
        const contentEl = document.getElementById('cs-sw-content');
        
        if (outlineEl) outlineEl.value = '正在生成大纲...';
        this.updateIO(outlinePrompt, '生成大纲中...');
        
        try {
            let outline = '';
            await AI.generate(outlinePrompt, {}, c => { outline += c; if (outlineEl) outlineEl.value = outline; });
            this.shortDraft.outline = outline;
            
            // 然后生成正文
            const contentPrompt = `请根据以下大纲创作完整的短篇小说正文：

标题：${title}
类型：${genre}
风格：${styleMap[style]}
视角：${povMap[pov]}
目标字数：${target}字

[大纲]
${outline}

要求：
1. 严格按照大纲的情节走向
2. 文笔优美，节奏紧凑
3. 对话自然，人物鲜活
4. 场景描写有画面感
5. 字数接近${target}字`;

            if (contentEl) contentEl.value = '正在创作正文...';
            this.updateIO(contentPrompt, '创作正文中...');
            
            let content = '';
            await AI.generate(contentPrompt, {}, c => { content += c; if (contentEl) contentEl.value = content; });
            this.shortDraft.content = content;
            this._updateWC();
            UI.toast('一键成文完成！');
        } catch(e) {
            UI.toast('生成失败: ' + (e.message || e));
        }
    },

    _updateWC() {
        const el = document.getElementById('cs-sw-wc');
        if(el) el.textContent = (this.shortDraft.content || '').length;
    },

    // ═══ 热点分析 ═══
    _renderHotspot() {
        const hotTrends = [
            { name: '重生复仇', heat: 95, trend: '↑' },
            { name: '签到系统', heat: 88, trend: '↑' },
            { name: '苟道流', heat: 82, trend: '→' },
            { name: '模拟器', heat: 78, trend: '↑' },
            { name: '规则怪谈', heat: 75, trend: '↓' },
            { name: '国运生存', heat: 70, trend: '→' }
        ];
        return `
            <div class="h-11 flex items-center justify-between px-5 bg-[#F1F3F5] border-b border-gray-200 shrink-0">
                <span class="text-xs font-bold text-red-400"><i class="fa-solid fa-fire-flame-curved mr-1"></i>热点分析 — 热梗拆解 · 爆款密码</span>
                <div class="flex gap-2">
                    <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30" onclick="Modules.creative_studio._fullAnalysis()"><i class="fa-solid fa-magnifying-glass-chart mr-1"></i>全维度分析</button>
                    <button class="btn btn-xs bg-red-600/20 text-red-400 border-red-600/30" onclick="Modules.creative_studio._analyzeHot()"><i class="fa-solid fa-bolt mr-1"></i>分析</button>
                </div>
            </div>
            <div class="flex-1 overflow-y-auto p-6 space-y-4">
                <!-- 实时热榜 -->
                <div class="bg-gradient-to-r from-red-900/20 to-orange-900/20 rounded-xl border border-red-500/20 p-4">
                    <div class="flex items-center justify-between mb-3">
                        <span class="text-xs font-bold text-red-400"><i class="fa-solid fa-fire mr-1"></i>实时热榜</span>
                        <button class="text-[10px] text-dim hover:text-gray-800" onclick="Modules.creative_studio._refreshHotTrends()"><i class="fa-solid fa-sync mr-1"></i>刷新</button>
                    </div>
                    <div class="grid grid-cols-6 gap-2">
                        ${hotTrends.map((t, i) => `
                            <div class="bg-gray-100 rounded-lg p-2 text-center cursor-pointer hover:bg-red-500/10 transition-all" onclick="document.getElementById('cs-hot-input').value='${t.name}'">
                                <div class="text-[9px] text-dim mb-1">${i < 3 ? '🔥' : ''}TOP${i + 1}</div>
                                <div class="text-[11px] font-bold text-gray-800">${t.name}</div>
                                <div class="flex items-center justify-center gap-1 mt-1">
                                    <span class="text-[9px] text-amber-400">${t.heat}</span>
                                    <span class="text-[9px] ${t.trend === '↑' ? 'text-green-400' : t.trend === '↓' ? 'text-red-400' : 'text-dim'}">${t.trend}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <!-- 输入区域 -->
                <div class="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                    <input id="cs-hot-input" class="input bg-gray-100 border-gray-300 text-gray-800 w-full text-lg font-bold" placeholder="输入热梗、热门话题、爆款书名...">
                    <div class="flex flex-wrap gap-2">
                        ${['赘婿流','系统流','无限流','末日废土','AI觉醒','穿越种田','修仙','都市异能','星际','宫斗','重生复仇','签到系统','苟道流','模拟器','规则怪谈','国运生存'].map(tag => `
                            <button class="px-3 py-1.5 rounded-full text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20" onclick="document.getElementById('cs-hot-input').value='${tag}'">${tag}</button>
                        `).join('')}
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                        <select id="cs-hot-mode" class="input bg-gray-100 border-gray-300 text-gray-800 text-xs">
                            <option value="trope">热梗深度拆解</option>
                            <option value="market">市场趋势分析</option>
                            <option value="reader">读者心理分析</option>
                            <option value="innovate">创新融合建议</option>
                            <option value="compete">竞品分析</option>
                            <option value="predict">趋势预测</option>
                        </select>
                        <select id="cs-hot-platform" class="input bg-gray-100 border-gray-300 text-gray-800 text-xs">
                            <option value="general">通用</option><option value="qidian">起点中文网</option>
                            <option value="jinjiang">晋江文学城</option><option value="tomato">番茄小说</option>
                            <option value="fanqie">番茄免费</option><option value="zhihu">知乎盐选</option>
                        </select>
                        <select id="cs-hot-depth" class="input bg-gray-100 border-gray-300 text-gray-800 text-xs">
                            <option value="normal">标准分析</option>
                            <option value="deep">深度分析</option>
                            <option value="full">全维度分析</option>
                        </select>
                    </div>
                </div>
                <!-- 分析结果 -->
                <div class="bg-white rounded-xl border border-gray-200 flex flex-col min-h-[300px]">
                    <div class="flex items-center justify-between px-4 py-2 border-b border-gray-200">
                        <span class="text-[10px] text-red-400 font-bold">分析结果</span>
                        <div class="flex gap-1">
                            <button class="btn btn-xs bg-gray-100 text-dim" onclick="Modules.creative_studio._exportHotReport()"><i class="fa-solid fa-download mr-1"></i>导出报告</button>
                            <button class="btn btn-xs bg-gray-100 text-dim" onclick="Utils.copy(document.getElementById('cs-hot-result').innerText)"><i class="fa-solid fa-copy"></i></button>
                            <button class="btn btn-xs bg-green-600/20 text-green-400" onclick="Modules.creative_studio._hotToLibrary()"><i class="fa-solid fa-book mr-1"></i>存阅读</button>
                            <button class="btn btn-xs bg-cyan-600/20 text-cyan-400" onclick="Modules.creative_studio._hotToPool()"><i class="fa-solid fa-bucket mr-1"></i>存灵感池</button>
                        </div>
                    </div>
                    <div id="cs-hot-result" class="flex-1 p-4 text-sm text-gray-600 leading-relaxed overflow-y-auto markdown-body"></div>
                </div>
            </div>`;
    },
    
    async _fullAnalysis() {
        const input = (document.getElementById('cs-hot-input') || {}).value;
        if(!input) return UI.toast('请输入热梗或话题');
        
        const el = document.getElementById('cs-hot-result');
        if(!el) return;
        
        el.innerHTML = '<div class="text-red-400 animate-pulse"><i class="fa-solid fa-circle-notch fa-spin mr-1"></i>全维度分析中...</div>';
        
        const prompt = `【全维度热点分析报告】

分析对象：${input}

请从以下维度进行全面分析：

## 一、热梗核心拆解
1. 核心爽点结构（为什么读者爱看）
2. 情绪价值分析（满足了什么心理需求）
3. 经典套路拆解（常见的情节模板）

## 二、市场趋势分析
1. 当前热度和发展阶段
2. 头部作品分析（代表作及其成功原因）
3. 读者需求变化趋势

## 三、读者画像分析
1. 核心读者群体特征
2. 阅读偏好和行为习惯
3. 付费意愿和消费能力

## 四、创新融合建议
1. 可融合的其他元素
2. 差异化创新方向
3. 新人入场建议

## 五、爆款预测
1. 未来3个月趋势预测
2. 潜力细分方向
3. 风险提示

## 六、实操建议
1. 开篇设计建议
2. 节奏把控要点
3. 爽点密度建议`;

        try {
            let res = '';
            await AI.generate(prompt, {}, c => { res += c; el.innerHTML = typeof marked !== 'undefined' ? marked.parse(res) : res; });
            UI.toast('全维度分析完成');
        } catch(e) {
            el.innerHTML = '<div class="text-red-400">分析失败: ' + (e.message || e) + '</div>';
        }
    },
    
    _refreshHotTrends() {
        UI.toast('热榜数据已刷新');
    },
    
    _exportHotReport() {
        const result = (document.getElementById('cs-hot-result') || {}).innerText || '';
        if(!result) return UI.toast('暂无分析结果');
        Utils.download('热点分析报告_' + new Date().toLocaleDateString() + '.txt', result);
        UI.toast('报告已导出');
    },
    // ═══ 灵感引擎方法 ═══
    _selectQuickType(type) {
        this._selectedQuickType = type;
        const prompts = {
            idea: '生成一个打破常规认知的小说脑洞创意，要求新颖、有冲击力、有故事潜力',
            title: '生成5个极具吸引力的网文书名，涵盖不同类型，每个附带一句话卖点',
            twist: '生成一个让读者意想不到的情节反转，要求逻辑自洽且情感冲击力强',
            char: '生成一个性格极其矛盾但真实可信的角色设定，包含外在表现和内在动机',
            scene: '生成一个极具画面感和情感张力的经典场面描写，可直接用于小说',
            opening: '生成一个让读者无法放下的小说开头(300字)，要求3秒抓住注意力',
            custom: ''
        };
        this._selectedQuickPrompt = prompts[type] || '';
        // 重新渲染工作区以更新选中状态和按钮
        const ws = document.getElementById('cs-workspace');
        if(ws) ws.innerHTML = this._renderWorkspace();
    },

    _doQuickGen() {
        const type = this._selectedQuickType;
        if(!type) return UI.toast('请先选择灵感类型');
        let prompt = this._selectedQuickPrompt;
        if(type === 'custom') {
            prompt = this._customQuickPrompt;
            if(!prompt) return UI.toast('请输入自定义灵感提示词');
        }
        this._quickGen(type, prompt);
    },

    async _quickGen(type, promptText) {
        const el = document.getElementById('cs-result');
        if(!el) return;
        
        const batchCount = this._batchCount || 1;
        const deepMode = this._deepMode;
        
        let fullPrompt = promptText;
        if (deepMode) {
            fullPrompt = `[深度创意模式]\n\n${promptText}\n\n请提供更详细、更有深度的创意内容，包括：\n1. 核心创意点\n2. 具体实现方式\n3. 可能的变化方向\n4. 与现有套路的差异化\n5. 目标读者群体`;
        }
        
        if (batchCount > 1) {
            fullPrompt += `\n\n请生成${batchCount}个不同的创意版本，每个版本用"---"分隔。`;
        }
        
        el.innerHTML = '<div class="text-yellow-400 animate-pulse"><i class="fa-solid fa-circle-notch fa-spin mr-1"></i>灵感生成中...</div>';
        this.updateIO(fullPrompt, '生成中...');
        
        try {
            let res = '';
            await AI.generate(fullPrompt, {}, c => { 
                res += c; 
                el.innerHTML = typeof marked !== 'undefined' ? marked.parse(res) : res; 
                this.updateIO(fullPrompt, res); 
            });
            
            if (!res.trim()) {
                el.innerHTML = '<div class="text-dim">（无结果，请检查API配置）</div>';
            } else {
                UI.toast('灵感生成完成');
                this._genHistory.unshift({
                    type: type,
                    prompt: promptText,
                    result: res,
                    time: new Date().toLocaleString(),
                    batch: batchCount,
                    deep: deepMode
                });
                if (this._genHistory.length > 50) this._genHistory.pop();
            }
        } catch(e) {
            el.innerHTML = '<div class="text-red-400"><i class="fa-solid fa-triangle-exclamation mr-1"></i>生成失败: ' + (e.message || e) + '</div>';
            this.updateIO(fullPrompt, '❌ 失败: ' + (e.message || e));
        }
    },
    
    _toggleDeepMode() {
        this._deepMode = !this._deepMode;
        UI.toast(this._deepMode ? '已开启深度模式' : '已关闭深度模式');
    },
    
    _showHistory() {
        if (this._genHistory.length === 0) {
            UI.toast('暂无历史记录');
            return;
        }
        
        const modal = document.createElement('div');
        modal.id = 'cs-history-modal';
        modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-gray-300 backdrop-blur-sm';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl border border-gray-300 w-[700px] max-h-[80vh] flex flex-col shadow-2xl">
                <div class="flex items-center justify-between px-5 py-3 border-b border-gray-200">
                    <span class="font-bold text-white"><i class="fa-solid fa-clock-rotate-left mr-2 text-yellow-400"></i>灵感生成历史</span>
                    <button class="text-dim hover:text-gray-800" onclick="this.closest('#cs-history-modal').remove()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="flex-1 overflow-y-auto p-4 space-y-2">
                    ${this._genHistory.map((h, i) => `
                        <div class="bg-gray-100 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-100 transition-all" onclick="Modules.creative_studio._loadHistory(${i})">
                            <div class="flex items-center justify-between mb-1">
                                <span class="text-xs font-bold text-yellow-400">${h.type}</span>
                                <span class="text-[10px] text-dim">${h.time}</span>
                            </div>
                            <div class="text-[10px] text-dim line-clamp-2">${h.prompt.slice(0, 100)}...</div>
                            ${h.batch > 1 ? `<span class="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 rounded">批量×${h.batch}</span>` : ''}
                            ${h.deep ? `<span class="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 rounded ml-1">深度</span>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },
    
    _loadHistory(index) {
        const h = this._genHistory[index];
        if (!h) return;
        
        const el = document.getElementById('cs-result');
        if (el) {
            el.innerHTML = typeof marked !== 'undefined' ? marked.parse(h.result) : h.result;
        }
        document.getElementById('cs-history-modal')?.remove();
        UI.toast('已加载历史记录');
    },

    async _freeGen() {
        const input = (document.getElementById('cs-free-input') || {}).value;
        if(!input) return UI.toast('请输入关键词');
        const type = (document.getElementById('cs-free-type') || {}).value || 'idea';
        const genre = (document.getElementById('cs-free-genre') || {}).value;
        const typeMap = {
            idea:'生成一个新颖的小说脑洞创意', outline:'生成一份包含开端发展高潮结局的速写大纲',
            scene:'生成一段极具画面感的场景描写', dialogue:'生成一段精彩的角色对话',
            emotion:'生成一段情感渲染极强的文字', world:'补全世界观设定',
            ending:'生成一个出人意料的结局', conflict:'设计一个核心冲突'
        };
        const prompt = `${typeMap[type] || '生成创意'}。\n关键词/主题：${input}${genre ? '\n类型：' + genre : ''}\n\n要求：具体、生动、有细节、可直接用于创作。`;
        await this._quickGen(type, prompt);
    },

    // ═══ 短篇快写方法 ═══
    async _aiShortOutline() {
        const d = this.shortDraft;
        const title = (document.getElementById('cs-sw-title') || {}).value || '未命名';
        const genre = (document.getElementById('cs-sw-genre') || {}).value || '短篇';
        const target = d.wordTarget || 3000;
        const prompt = `请为以下短篇小说生成详细大纲：\n标题：${title}\n类型：${genre}\n目标字数：${target}字\n\n要求：\n1. 包含开端、发展、高潮、结局四个阶段\n2. 每个阶段标注预计字数分配\n3. 明确主要角色和核心冲突\n4. 标注情绪曲线走向\n5. 结局要有余韵`;
        const el = document.getElementById('cs-sw-outline');
        if(!el) return;
        el.value = '生成中...';
        this.updateIO(prompt, '生成中...');
        try {
            let res = '';
            await AI.generate(prompt, {}, c => { res += c; el.value = res; this.updateIO(prompt, res); });
            this.shortDraft.outline = res;
            UI.toast('大纲生成完成');
        } catch(e) { el.value = '生成失败: ' + (e.message || e); this.updateIO(prompt, '❌ 失败: ' + (e.message || e)); }
    },

    async _aiShortWrite() {
        const d = this.shortDraft;
        const outline = (document.getElementById('cs-sw-outline') || {}).value;
        if(!outline) return UI.toast('请先生成或填写大纲');
        const title = (document.getElementById('cs-sw-title') || {}).value || '';
        const genre = (document.getElementById('cs-sw-genre') || {}).value || '';
        const target = d.wordTarget || 3000;
        let fusionCtx = '';
        const FB = Modules.fusion_book;
        if(FB) {
            const allPr = FB._allPipelineResults || {};
            const pr = FB._pipelineResults || {};
            const fusion = (allPr.fusion && allPr.fusion.trim()) ? allPr.fusion : (pr.fusion || '');
            if(fusion) fusionCtx = '\n\n[融合技法参考(请运用这些技法)]\n' + fusion.slice(0, 1500);
        }
        const prompt = `请根据以下大纲创作一篇完整的短篇小说正文。\n\n标题：${title}\n类型：${genre}\n目标字数：${target}字\n\n[大纲]\n${outline}${fusionCtx}\n\n要求：\n1. 文笔优美，节奏紧凑\n2. 对话自然，人物鲜活\n3. 场景描写有画面感\n4. 严格按照大纲的情节走向\n5. 字数接近${target}字`;
        const el = document.getElementById('cs-sw-content');
        if(!el) return;
        el.value = '正在创作...';
        this.updateIO(prompt, '创作中...');
        try {
            let res = '';
            await AI.generate(prompt, {}, c => { res += c; el.value = res; this.updateIO(prompt, res); });
            this.shortDraft.content = res;
            this._updateWC();
            UI.toast('短篇创作完成');
        } catch(e) { el.value = '创作失败: ' + (e.message || e); this.updateIO(prompt, '❌ 失败: ' + (e.message || e)); }
    },

    async _aiShortContinue() {
        const el = document.getElementById('cs-sw-content');
        const current = el ? el.value : '';
        if(!current || current.length < 20) return UI.toast('请先写一些内容');
        const outline = (document.getElementById('cs-sw-outline') || {}).value || '';
        const prompt = `[续写任务]\n\n${outline ? '[大纲参考]\n' + outline.slice(0, 800) + '\n\n' : ''}[已有正文(最后部分)]\n...${current.slice(-1500)}\n\n请从断点处无缝续写，保持文风一致，情节紧凑，约500-800字。`;
        try {
            let res = '';
            this.updateIO(prompt, '续写中...');
            await AI.generate(prompt, {}, c => { res += c; el.value = current + res; this.updateIO(prompt, res); });
            this.shortDraft.content = el.value;
            this._updateWC();
            UI.toast('续写完成');
        } catch(e) { UI.toast('续写失败: ' + (e.message || e)); this.updateIO(prompt, '❌ 失败: ' + (e.message || e)); }
    },

    async _aiShortPolish() {
        const el = document.getElementById('cs-sw-content');
        const content = el ? el.value : '';
        if(!content) return UI.toast('正文为空');
        const prompt = `请对以下短篇小说正文进行深度润色：\n\n${content.slice(0, 5000)}\n\n要求：\n1. 提升文笔质量和表现力\n2. 优化对话的自然度\n3. 增强场景描写的画面感\n4. 保持原有情节和人物不变\n5. 修正语病和逻辑问题`;
        el.value = '润色中...';
        this.updateIO(prompt, '润色中...');
        try {
            let res = '';
            await AI.generate(prompt, {}, c => { res += c; el.value = res; this.updateIO(prompt, res); });
            this.shortDraft.content = res;
            this._updateWC();
            UI.toast('润色完成');
        } catch(e) { el.value = content; UI.toast('润色失败: ' + (e.message || e)); this.updateIO(prompt, '❌ 失败: ' + (e.message || e)); }
    },

    async _saveShort() {
        const d = this.shortDraft;
        const title = (document.getElementById('cs-sw-title') || {}).value || '未命名短篇';
        const content = (document.getElementById('cs-sw-content') || {}).value || '';
        if(!content) return UI.toast('正文为空');
        const id = 'short_' + Utils.uuid();
        await DB.put('library_books', { id, name: '短篇_' + title, content, size: content.length, date: new Date().toLocaleDateString() });
        UI.toast('短篇已保存到阅读中心');
    },

    // ═══ 热点分析方法 ═══
    async _analyzeHot() {
        const input = (document.getElementById('cs-hot-input') || {}).value;
        if(!input) return UI.toast('请输入热梗或话题');
        const mode = (document.getElementById('cs-hot-mode') || {}).value || 'trope';
        const platform = (document.getElementById('cs-hot-platform') || {}).value || 'general';
        const modePrompts = {
            trope: `深度拆解热梗【${input}】：\n1. 核心爽点结构（为什么读者爱看）\n2. 情绪价值分析（满足了什么心理需求）\n3. 经典套路拆解（常见的情节模板）\n4. 创新变体建议（如何在此基础上创新）\n5. 适合融合的其他元素\n6. 目标读者画像`,
            market: `分析【${input}】的市场趋势：\n1. 当前热度和发展阶段（上升期/成熟期/衰退期）\n2. 头部作品分析（代表作及其成功原因）\n3. 读者需求变化趋势\n4. 竞争格局和差异化机会\n5. 未来发展预测\n6. 新人入场建议`,
            reader: `分析【${input}】的读者心理：\n1. 核心受众画像（年龄、性别、阅读习惯）\n2. 深层心理需求（代入感、补偿心理、情感投射）\n3. 爽点触发机制\n4. 弃书雷点分析\n5. 付费意愿驱动因素\n6. 社交传播动机`,
            innovate: `基于【${input}】的创新融合建议：\n1. 可融合的其他热门元素（至少5个方向）\n2. 每个融合方向的具体创意\n3. 差异化卖点设计\n4. 风险评估和规避建议\n5. 推荐的故事框架\n6. 开篇钩子设计`
        };
        const platformNote = platform !== 'general' ? `\n\n请结合${platform === 'qidian' ? '起点中文网' : platform === 'jinjiang' ? '晋江文学城' : '番茄小说'}的平台特点和读者偏好进行分析。` : '';
        const prompt = modePrompts[mode] + platformNote;
        const el = document.getElementById('cs-hot-result');
        if(!el) return;
        el.innerHTML = '<div class="text-red-400 animate-pulse"><i class="fa-solid fa-circle-notch fa-spin mr-1"></i>分析中...</div>';
        this.updateIO(prompt, '分析中...');
        try {
            let res = '';
            await AI.generate(prompt, {}, c => { res += c; el.innerHTML = typeof marked !== 'undefined' ? marked.parse(res) : res; this.updateIO(prompt, res); });
            if (!res.trim()) el.innerHTML = '<div class="text-dim">（无结果，请检查API配置）</div>';
            else UI.toast('热点分析完成');
        } catch(e) {
            el.innerHTML = '<div class="text-red-400"><i class="fa-solid fa-triangle-exclamation mr-1"></i>分析失败: ' + (e.message || e) + '</div>';
            this.updateIO(prompt, '❌ 失败: ' + (e.message || e));
        }
    },

    _hotToLibrary() {
        const content = (document.getElementById('cs-hot-result') || {}).innerText;
        if(!content) return UI.toast('无内容');
        const input = (document.getElementById('cs-hot-input') || {}).value || '热点';
        if(typeof ContextHelper !== 'undefined') ContextHelper.exportToLibrary('热点分析_' + input, content);
        else DB.put('library_books', { id: Utils.uuid(), name: '热点分析_' + input, content, size: content.length, date: new Date().toLocaleDateString() });
        UI.toast('已存入阅读中心');
    },

    _hotToPool() {
        const content = (document.getElementById('cs-hot-result') || {}).innerText;
        if(!content) return UI.toast('无内容');
        const input = (document.getElementById('cs-hot-input') || {}).value || '热点';
        this.ideaPool.push({ id: Utils.uuid(), title: '热点_' + input, content: content.slice(0, 500), type: 'hotspot', ts: Date.now() });
        DB.put('settings', { id: 'idea_pool', items: this.ideaPool });
        UI.toast('已存入灵感池');
    },

    // ═══ 脑洞风暴方法 ═══
    async _runBrainStorm() {
        const topic = (document.getElementById('cs-bs-topic') || {}).value;
        if(!topic) return UI.toast('请输入主题');
        const count = (document.getElementById('cs-bs-count') || {}).value || 10;
        const mode = (document.getElementById('cs-bs-mode') || {}).value || 'normal';
        
        const modePrompts = {
            normal: '',
            extreme: '每个创意都要极端、疯狂、打破常规认知，越离谱越好！',
            crossover: '每个创意都要融合至少两个完全不同类型的元素，产生奇妙的化学反应！',
            subvert: '每个创意都要颠覆传统套路，反其道而行之，让读者大呼意外！'
        };
        
        const prompt = `你是一个创意风暴引擎。请围绕主题【${topic}】生成${count}个独特的小说创意脑洞。

${modePrompts[mode]}

要求：
1. 每个创意都要新颖、有冲击力
2. 涵盖不同的类型和角度
3. 每个创意包含：标题(10字内)、一句话概念、核心冲突、独特卖点
4. 越反直觉越好

输出格式为JSON数组：
[{"title":"标题","concept":"一句话概念","conflict":"核心冲突","hook":"独特卖点"}]`;
        const el = document.getElementById('cs-bs-results');
        if(!el) return;
        el.innerHTML = '<div class="col-span-2 text-purple-400 animate-pulse text-center p-8"><i class="fa-solid fa-circle-notch fa-spin mr-1"></i>脑洞风暴中...</div>';
        let res = '';
        this.updateIO(prompt, '风暴中...');
        try {
            await AI.generate(prompt, {}, c => { res += c; this.updateIO(prompt, res); });
        } catch(e) {
            el.innerHTML = '<div class="col-span-2 text-red-400 text-center p-8"><i class="fa-solid fa-triangle-exclamation mr-1"></i>风暴失败: ' + (e.message || e) + '</div>';
            this.updateIO(prompt, '❌ 失败: ' + (e.message || e));
            return;
        }
        let ideas = null;
        try { ideas = JSON.parse(res); } catch(e1) {
            try { ideas = JSON.parse(res.replace(/```json?\s*/g,'').replace(/```/g,'').trim()); } catch(e2) {
                const m = res.match(/\[[\s\S]*\]/);
                if(m) try { ideas = JSON.parse(m[0]); } catch(e3) {}
            }
        }
        if(!ideas || !Array.isArray(ideas)) {
            el.innerHTML = '<div class="col-span-2 p-4 text-sm text-gray-600 leading-relaxed markdown-body">' + (typeof marked !== 'undefined' ? marked.parse(res) : res) + '</div>';
            return;
        }
        this.brainStorm = ideas;
        const colors = ['amber','blue','green','purple','pink','red','cyan','orange','indigo','teal'];
        el.innerHTML = ideas.map((idea, i) => `
            <div class="p-4 rounded-xl bg-${colors[i % colors.length]}-900/10 border border-${colors[i % colors.length]}-500/15 hover:border-${colors[i % colors.length]}-500/40 transition-all group">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-bold text-${colors[i % colors.length]}-300">${idea.title || '创意' + (i+1)}</span>
                    <button class="btn btn-xs bg-gray-100 text-dim opacity-0 group-hover:opacity-100" onclick="Modules.creative_studio._saveIdeaFromStorm(${i})"><i class="fa-solid fa-bucket"></i></button>
                </div>
                <div class="text-xs text-gray-800 mb-1">${idea.concept || ''}</div>
                <div class="text-[10px] text-dim mb-1"><i class="fa-solid fa-bolt text-yellow-400 mr-1"></i>${idea.conflict || ''}</div>
                <div class="text-[10px] text-green-400"><i class="fa-solid fa-star mr-1"></i>${idea.hook || ''}</div>
            </div>
        `).join('');
        UI.toast('脑洞风暴完成: ' + ideas.length + '个创意');
    },

    _saveIdeaFromStorm(idx) {
        const idea = this.brainStorm[idx];
        if(!idea) return;
        this.ideaPool.push({ id: Utils.uuid(), title: idea.title, content: `${idea.concept}\n冲突: ${idea.conflict}\n卖点: ${idea.hook}`, type: 'brainstorm', ts: Date.now() });
        DB.put('settings', { id: 'idea_pool', items: this.ideaPool });
        UI.toast('已存入灵感池: ' + idea.title);
    },
    
    async _randomCollision() {
        const elements = ['重生', '系统', '穿越', '末日', '修仙', '都市', '星际', '宫斗', '悬疑', '言情', '科幻', '玄幻', '模拟器', '签到', '无限流', '克苏鲁', '赛博朋克', '蒸汽朋克', '魔法少女', '机甲'];
        const elemA = elements[Math.floor(Math.random() * elements.length)];
        const elemB = elements[Math.floor(Math.random() * elements.length)];
        const elemC = elements[Math.floor(Math.random() * elements.length)];
        
        const prompt = `你是一个创意碰撞引擎。请将以下三个随机元素进行创意碰撞，生成5个独特的小说创意：

元素A：${elemA}
元素B：${elemB}  
元素C：${elemC}

要求：
1. 每个创意都要有机融合这三个元素
2. 产生意想不到的化学反应
3. 每个创意包含：标题、一句话概念、核心冲突、独特卖点

输出JSON数组格式：[{"title":"标题","concept":"概念","conflict":"冲突","hook":"卖点"}]`;

        const el = document.getElementById('cs-bs-results');
        if(!el) return;
        el.innerHTML = `<div class="col-span-2 text-cyan-400 animate-pulse text-center p-8"><i class="fa-solid fa-shuffle fa-spin mr-1"></i>随机碰撞: ${elemA} + ${elemB} + ${elemC}...</div>`;
        
        let res = '';
        try {
            await AI.generate(prompt, {}, c => { res += c; });
            let ideas = JSON.parse(res.replace(/```json?\s*/g,'').replace(/```/g,'').trim());
            this.brainStorm = ideas;
            const colors = ['cyan','teal','emerald','sky','blue'];
            el.innerHTML = ideas.map((idea, i) => `
                <div class="p-4 rounded-xl bg-${colors[i % colors.length]}-900/10 border border-${colors[i % colors.length]}-500/15 hover:border-${colors[i % colors.length]}-500/40 transition-all group">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-bold text-${colors[i % colors.length]}-300">${idea.title}</span>
                        <button class="btn btn-xs bg-gray-100 text-dim opacity-0 group-hover:opacity-100" onclick="Modules.creative_studio._saveIdeaFromStorm(${i})"><i class="fa-solid fa-bucket"></i></button>
                    </div>
                    <div class="text-xs text-gray-800 mb-1">${idea.concept}</div>
                    <div class="text-[10px] text-dim mb-1"><i class="fa-solid fa-bolt text-yellow-400 mr-1"></i>${idea.conflict}</div>
                    <div class="text-[10px] text-green-400"><i class="fa-solid fa-star mr-1"></i>${idea.hook}</div>
                </div>
            `).join('');
            UI.toast('随机碰撞完成！');
        } catch(e) {
            el.innerHTML = '<div class="col-span-2 text-red-400 text-center p-8">碰撞失败: ' + (e.message || e) + '</div>';
        }
    },
    
    async _ideaEvolution() {
        if(this.brainStorm.length === 0) return UI.toast('请先进行脑洞风暴生成创意');
        
        const bestIdea = this.brainStorm[0];
        const prompt = `你是一个创意进化引擎。请基于以下创意进行进化升级，生成5个更完善的版本：

原创意：${bestIdea.title}
概念：${bestIdea.concept}
冲突：${bestIdea.conflict}
卖点：${bestIdea.hook}

进化方向：
1. 强化冲突 - 让冲突更激烈、更不可调和
2. 深化主题 - 增加哲学思考和社会隐喻
3. 扩展世界观 - 让设定更宏大、更完整
4. 优化人设 - 让角色更立体、更有魅力
5. 创新结构 - 尝试非线性、多视角等叙事结构

输出JSON数组格式：[{"title":"标题","concept":"概念","conflict":"冲突","hook":"卖点","evolution":"进化点"}]`;

        const el = document.getElementById('cs-bs-results');
        if(!el) return;
        el.innerHTML = '<div class="col-span-2 text-green-400 animate-pulse text-center p-8"><i class="fa-solid fa-dna fa-spin mr-1"></i>创意进化中...</div>';
        
        let res = '';
        try {
            await AI.generate(prompt, {}, c => { res += c; });
            let ideas = JSON.parse(res.replace(/```json?\s*/g,'').replace(/```/g,'').trim());
            this.brainStorm = ideas;
            const colors = ['green','emerald','lime','teal','cyan'];
            el.innerHTML = ideas.map((idea, i) => `
                <div class="p-4 rounded-xl bg-${colors[i % colors.length]}-900/10 border border-${colors[i % colors.length]}-500/15 hover:border-${colors[i % colors.length]}-500/40 transition-all group">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-bold text-${colors[i % colors.length]}-300">${idea.title}</span>
                        <button class="btn btn-xs bg-gray-100 text-dim opacity-0 group-hover:opacity-100" onclick="Modules.creative_studio._saveIdeaFromStorm(${i})"><i class="fa-solid fa-bucket"></i></button>
                    </div>
                    <div class="text-xs text-gray-800 mb-1">${idea.concept}</div>
                    <div class="text-[10px] text-dim mb-1"><i class="fa-solid fa-bolt text-yellow-400 mr-1"></i>${idea.conflict}</div>
                    <div class="text-[10px] text-green-400 mb-1"><i class="fa-solid fa-star mr-1"></i>${idea.hook}</div>
                    <div class="text-[10px] text-amber-400"><i class="fa-solid fa-arrow-up mr-1"></i>${idea.evolution || ''}</div>
                </div>
            `).join('');
            UI.toast('创意进化完成！');
        } catch(e) {
            el.innerHTML = '<div class="col-span-2 text-red-400 text-center p-8">进化失败: ' + (e.message || e) + '</div>';
        }
    },
    
    async _combineElements() {
        const elemA = (document.getElementById('cs-bs-elem-a') || {}).value;
        const elemB = (document.getElementById('cs-bs-elem-b') || {}).value;
        const elemC = (document.getElementById('cs-bs-elem-c') || {}).value;
        
        if(!elemA && !elemB && !elemC) return UI.toast('请至少输入一个元素');
        
        const elements = [elemA, elemB, elemC].filter(e => e).join(' + ');
        
        const prompt = `你是一个创意组合引擎。请将以下元素进行创意组合，生成5个独特的小说创意：

元素：${elements}

要求：
1. 有机融合所有元素，产生化学反应
2. 每个创意都要有独特的切入点
3. 每个创意包含：标题、一句话概念、核心冲突、独特卖点

输出JSON数组格式：[{"title":"标题","concept":"概念","conflict":"冲突","hook":"卖点"}]`;

        const el = document.getElementById('cs-bs-results');
        if(!el) return;
        el.innerHTML = `<div class="col-span-2 text-pink-400 animate-pulse text-center p-8"><i class="fa-solid fa-blender fa-spin mr-1"></i>组合生成: ${elements}...</div>`;
        
        let res = '';
        try {
            await AI.generate(prompt, {}, c => { res += c; });
            let ideas = JSON.parse(res.replace(/```json?\s*/g,'').replace(/```/g,'').trim());
            this.brainStorm = ideas;
            const colors = ['pink','rose','fuchsia','purple','violet'];
            el.innerHTML = ideas.map((idea, i) => `
                <div class="p-4 rounded-xl bg-${colors[i % colors.length]}-900/10 border border-${colors[i % colors.length]}-500/15 hover:border-${colors[i % colors.length]}-500/40 transition-all group">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-bold text-${colors[i % colors.length]}-300">${idea.title}</span>
                        <button class="btn btn-xs bg-gray-100 text-dim opacity-0 group-hover:opacity-100" onclick="Modules.creative_studio._saveIdeaFromStorm(${i})"><i class="fa-solid fa-bucket"></i></button>
                    </div>
                    <div class="text-xs text-gray-800 mb-1">${idea.concept}</div>
                    <div class="text-[10px] text-dim mb-1"><i class="fa-solid fa-bolt text-yellow-400 mr-1"></i>${idea.conflict}</div>
                    <div class="text-[10px] text-green-400"><i class="fa-solid fa-star mr-1"></i>${idea.hook}</div>
                </div>
            `).join('');
            UI.toast('组合生成完成！');
        } catch(e) {
            el.innerHTML = '<div class="col-span-2 text-red-400 text-center p-8">组合失败: ' + (e.message || e) + '</div>';
        }
    },

    // ═══ 灵感池方法 ═══
    async _loadIdeaPool() {
        const store = await DB.get('settings', 'idea_pool');
        this.ideaPool = (store && store.items) ? store.items : [];
        this._renderPool();
    },

    _renderPool() {
        const el = document.getElementById('cs-pool-list');
        if(!el) return;
        if(!this.ideaPool.length) {
            el.innerHTML = '<div class="col-span-3 flex flex-col items-center justify-center text-dim h-48"><i class="fa-solid fa-bucket text-3xl mb-3 opacity-20"></i><p class="text-sm">灵感池为空</p><p class="text-[10px] mt-1">在灵感引擎、热点分析、脑洞风暴中生成内容后可存入此处</p></div>';
            return;
        }
        const typeColors = { inspiration: 'yellow', hotspot: 'red', brainstorm: 'purple', manual: 'cyan' };
        const typeLabels = { inspiration: '灵感', hotspot: '热点', brainstorm: '脑洞', manual: '手动' };
        el.innerHTML = this.ideaPool.map((idea, i) => {
            const c = typeColors[idea.type] || 'gray';
            return `
            <div class="p-3 rounded-xl bg-${c}-900/10 border border-${c}-500/15 hover:border-${c}-500/40 transition-all group relative">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-bold text-${c}-300 truncate flex-1">${idea.title}</span>
                    <span class="text-[8px] text-${c}-400 bg-${c}-500/10 px-1.5 py-0.5 rounded ml-1">${typeLabels[idea.type] || '其他'}</span>
                </div>
                <div class="text-[10px] text-dim leading-relaxed line-clamp-4">${(idea.content || '').slice(0, 200)}</div>
                <div class="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="btn btn-xs bg-gray-100 text-dim flex-1" onclick="Utils.copy('${idea.content.replace(/'/g, "\\'")}');UI.toast('已复制')"><i class="fa-solid fa-copy"></i></button>
                    <button class="btn btn-xs bg-green-600/20 text-green-400 flex-1" onclick="Modules.creative_studio._poolToPhoenix(${i})"><i class="fa-solid fa-fire"></i></button>
                    <button class="btn btn-xs bg-red-600/20 text-red-400 flex-1" onclick="Modules.creative_studio._removeFromPool(${i})"><i class="fa-solid fa-trash"></i></button>
                </div>
                <div class="text-[8px] text-dim mt-1">${new Date(idea.ts).toLocaleString()}</div>
            </div>`;
        }).join('');
    },

    _addIdeaManual() {
        const title = prompt('灵感标题：');
        if(!title) return;
        const content = prompt('灵感内容：');
        if(!content) return;
        this.ideaPool.push({ id: Utils.uuid(), title, content, type: 'manual', ts: Date.now() });
        DB.put('settings', { id: 'idea_pool', items: this.ideaPool });
        this._renderPool();
        UI.toast('已添加到灵感池');
    },

    async _removeFromPool(idx) {
        this.ideaPool.splice(idx, 1);
        await DB.put('settings', { id: 'idea_pool', items: this.ideaPool });
        this._renderPool();
    },

    async _clearPool() {
        if(!confirm('确定清空灵感池？')) return;
        this.ideaPool = [];
        await DB.put('settings', { id: 'idea_pool', items: [] });
        this._renderPool();
        UI.toast('灵感池已清空');
    },

    _poolToPhoenix(idx) {
        const idea = this.ideaPool[idx];
        if(!idea) return;
        if(Modules.phoenix) {
            Modules.phoenix.data.worldContext = (Modules.phoenix.data.worldContext || '') + '\n[灵感注入] ' + idea.title + ': ' + idea.content;
            UI.toast('已注入凤凰流: ' + idea.title);
        } else { UI.toast('凤凰创作流未加载'); }
    },

    // ═══ 通用工具方法 ═══
    _saveToPool() {
        const content = (document.getElementById('cs-result') || {}).innerText;
        if(!content) return UI.toast('无内容');
        this.ideaPool.push({ id: Utils.uuid(), title: '灵感_' + new Date().toLocaleTimeString(), content: content.slice(0, 500), type: 'inspiration', ts: Date.now() });
        DB.put('settings', { id: 'idea_pool', items: this.ideaPool });
        UI.toast('已存入灵感池');
    },

    _resultToLibrary() {
        const content = (document.getElementById('cs-result') || {}).innerText;
        if(!content) return UI.toast('无内容');
        if(typeof ContextHelper !== 'undefined') ContextHelper.exportToLibrary('灵感_' + new Date().toLocaleTimeString(), content);
        else DB.put('library_books', { id: Utils.uuid(), name: '灵感_' + new Date().toLocaleTimeString(), content, size: content.length, date: new Date().toLocaleDateString() });
        UI.toast('已存入阅读中心');
    },

    async _exportAll() {
        let md = '# 创意工坊 — 全部灵感导出\n\n';
        md += `导出时间: ${new Date().toLocaleString()}\n\n`;
        if(this.ideaPool.length) {
            md += '## 灵感池\n\n';
            this.ideaPool.forEach(idea => { md += `### ${idea.title}\n${idea.content}\n\n`; });
        }
        if(this.shortDraft.content) {
            md += '## 短篇草稿\n\n';
            md += `标题: ${this.shortDraft.title}\n\n${this.shortDraft.content}\n\n`;
        }
        if(typeof ContextHelper !== 'undefined') ContextHelper.exportToLibrary('创意工坊导出_' + new Date().toLocaleTimeString(), md);
        UI.toast('全部灵感已导出');
    },

    _toPhoenix() {
        const pool = this.ideaPool;
        if(!pool.length) return UI.toast('灵感池为空');
        if(!Modules.phoenix) return UI.toast('凤凰创作流未加载');
        const text = pool.map(i => `[${i.title}] ${i.content}`).join('\n\n');
        Modules.phoenix.data.worldContext = (Modules.phoenix.data.worldContext || '') + '\n[创意工坊灵感注入]\n' + text.slice(0, 3000);
        UI.toast('灵感池已注入凤凰流 (' + pool.length + '条)');
    }
};
