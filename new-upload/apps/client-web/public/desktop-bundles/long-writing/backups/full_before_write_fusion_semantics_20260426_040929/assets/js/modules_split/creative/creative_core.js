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

    // ═══ 自定义提示词系统 ═══
    _customPrompts: {},
    _defaultPrompts: {
        inspiration: `你是一位顶级网文创作者和创意顾问。请根据用户选择的灵感类型，生成高质量、有冲击力、具有商业潜力的创意内容。要求：具体、反直觉、有画面感、避免陈词滥调。`,
        brainstorm: `你是一个创意风暴引擎。请围绕用户提供的主题生成独特的小说创意脑洞。要求：新颖、有冲击力、涵盖不同类型和角度。`,
        deai: `你是一位资深编辑，专门负责去除AI生成文本的"机械感"。请识别并消除以下AI痕迹：过度使用逻辑连接词、抽象概括代替具体描写、句式过于工整、缺乏感官细节、情绪标签代替情绪呈现、过渡使用"的"字结构、段落开头模式化、缺乏人物小动作和微表情。`,
        deconstruct: `你是一位顶级网文编辑和写作教练，专门拆解爆款小说的写作技巧。请对提供的章节进行深度拆解，分析：结构框架、节奏把控、爽点设计、人物塑造、对话技巧、环境描写、情绪曲线、悬念设置、信息密度、可复用技法。`,
        storyboard: `你是一位专业分镜师。请将以下场景拆解为分镜，每个分镜包含：镜号、景别、机位/角度、运镜方式、画面内容、时长、对白/音效、情绪标记、画面提示词（英文，用于AI图像生成）。`,
        comic: `你是一位专业漫画编剧和分镜师。请将以下情节改编为漫画脚本，包含：页码、格号、景别、画面描述、角色、对白、音效、画面提示词（英文）。`,
        drama: `你是一位漫剧制作人。请将以下小说内容漫剧化，包含：场景切分、角色定调、分镜设计、画面提示词、配音脚本、BGM建议、后期规划。`,
        visual: `你是一位世界级视觉知识架构师、科学百科插画师、博物馆展览设计师、电影艺术总监。请根据用户输入的主题，生成高度专业、极致细节、结构清晰、具有强视觉冲击力的知识型图像提示词。图像需要兼具学术信息密度、艺术表现力、空间秩序与视觉隐喻。`,
        video: `你是一位AI视频生成提示词工程师。请根据用户提供的图片或描述，生成适合AI视频生成模型（如Kling、Runway Gen-2、Pika、可灵）使用的视频提示词。提示词需要包含：镜头运动、时间流逝、物理动态、光影变化、氛围演变。`,
        lookbook: `你是一位角色设计师。请为以下角色生成详细的外观设定，包含：发型/发色、眼睛/眼神、面部特征、服装风格、配饰、整体气质、表情设定、图像生成提示词（英文）。`,
        platform: `你是一位网文平台编辑。请将以下章节内容适配到目标平台，包含：格式调整、敏感词检测、平台风格优化、排版规范、发布建议。`,
        trends: `你是一位网文市场分析师。请分析以下热榜内容，提取：爆款公式、读者偏好、创新方向、入场建议、风险提示。`
    },

    async _loadAllCustomPrompts() {
        try {
            const stored = await DB.get('settings', 'custom_prompts_creative');
            if (stored && stored.prompts) this._customPrompts = stored.prompts;
        } catch(e) {}
    },

    _getPrompt(tabId, fallback) {
        const custom = this._customPrompts[tabId];
        if (custom && custom.trim()) return custom;
        const def = this._defaultPrompts[tabId];
        if (def && def.trim()) return def;
        return fallback || '';
    },
    // 公开别名，供外部模块调用
    getPrompt(tabId, fallback) { return this._getPrompt(tabId, fallback); },

    async _saveCustomPrompt(tabId, prompt) {
        this._customPrompts[tabId] = prompt;
        try {
            await DB.put('settings', { id: 'custom_prompts_creative', prompts: this._customPrompts, updated: Date.now() });
        } catch(e) {}
    },

    _openPromptEditor(tabId, title) {
        const defaultPrompt = this._defaultPrompts[tabId] || '';
        const currentPrompt = this._customPrompts[tabId] || '';
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/70';
        modal.innerHTML = `
            <div class="bg-[#111113] border border-white/10 rounded-2xl w-[600px] max-h-[80vh] flex flex-col shadow-2xl">
                <div class="shrink-0 p-4 border-b border-white/5 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <i class="fa-solid fa-pen-to-square text-accent"></i>
                        <span class="font-bold text-white">编辑提示词 — ${title}</span>
                    </div>
                    <button class="text-dim hover:text-white" onclick="this.closest('.fixed').remove()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="flex-1 p-4 overflow-y-auto space-y-3">
                    <div class="text-[10px] text-dim">默认提示词（供参考）：</div>
                    <div class="p-3 bg-white/5 rounded-lg text-[10px] text-dim leading-relaxed max-h-[120px] overflow-y-auto">${defaultPrompt.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                    <div class="text-[10px] text-white font-bold">自定义提示词（留空则使用默认）：</div>
                    <textarea id="cs-prompt-editor" class="w-full h-[200px] bg-black/30 border border-white/10 rounded-lg p-3 text-xs text-main resize-none focus:border-accent/50 focus:outline-none" placeholder="输入你的自定义提示词...">${currentPrompt.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
                    <div class="text-[9px] text-dim">可用变量：{{input}} — 用户输入内容</div>
                </div>
                <div class="shrink-0 p-4 border-t border-white/5 flex gap-2">
                    <button class="btn btn-sm bg-white/5 text-dim flex-1" onclick="this.closest('.fixed').remove()">取消</button>
                    <button class="btn btn-sm bg-accent/20 text-accent border-accent/30 flex-1" onclick="Modules.creative_studio._confirmPromptSave('${tabId}')"><i class="fa-solid fa-check mr-1"></i>保存</button>
                    <button class="btn btn-sm bg-red-500/10 text-red-400 border-red-500/20 flex-1" onclick="document.getElementById('cs-prompt-editor').value='';Modules.creative_studio._confirmPromptSave('${tabId}')"><i class="fa-solid fa-rotate-left mr-1"></i>恢复默认</button>
                </div>
            </div>`;
        document.body.appendChild(modal);
    },
    // 公开别名，兼容旧代码中的 openPromptModal 调用
    openPromptModal(tabId, title) { return this._openPromptEditor(tabId, title); },

    async _confirmPromptSave(tabId) {
        const el = document.getElementById('cs-prompt-editor');
        if (!el) return;
        await this._saveCustomPrompt(tabId, el.value);
        UI.toast('提示词已保存');
        el.closest('.fixed').remove();
    },

    _renderPromptEditButton(tabId, title) {
        const hasCustom = !!(this._customPrompts[tabId] && this._customPrompts[tabId].trim());
        return `<button class="text-[10px] ${hasCustom ? 'text-accent' : 'text-dim'} hover:text-white transition flex items-center gap-1" onclick="Modules.creative_studio._openPromptEditor('${tabId}','${title}')" title="${hasCustom ? '已自定义提示词' : '使用默认提示词，点击编辑'}"><i class="fa-solid fa-sliders"></i>${hasCustom ? '已自定义' : '编辑提示词'}</button>`;
    },

    _getTabLabel(tabId) {
        const labels = {
            inspiration: '灵感中枢',
            quickwrite: '快写模式',
            pool: '灵感池',
            generators: '生成器广场',
            deai: 'AI消痕',
            deconstruct: '拆书工坊',
            storyboard: '分镜设计',
            comic: '漫画脚本',
            visual: '视觉提示词',
            video: '视频生成',
            drama: '漫剧流水线',
            lookbook: '角色外观库',
            platform: '平台适配',
            trends: '热点扫榜'
        };
        return labels[tabId] || tabId || '未选择';
    },

    _renderCommandStrip() {
        const projectActive = typeof GenesisCore !== 'undefined' && GenesisCore._activeProjectId;
        const activeProject = projectActive ? '已接入当前项目' : '未绑定项目';
        const projectTone = projectActive ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-300 bg-amber-500/10 border-amber-500/20';
        const quickRoutes = [
            ['idea', '我要新脑洞', '书名、反转、设定、开头', 'fa-lightbulb', 'amber'],
            ['quickwrite', '我要短篇/片段', '填标题或梗概，直接生成', 'fa-feather-pointed', 'green'],
            ['deai', '我要消AI味', '粘贴原文，改得更像人写', 'fa-eraser', 'emerald'],
            ['storyboard', '我要分镜/画面', '把场景拆成镜头和提示词', 'fa-film', 'rose'],
            ['platform', '我要发布文案', '标题、简介、摘句、平台适配', 'fa-share-from-square', 'cyan']
        ];
        return `
        <div class="bg-[#0d0d0f] border-b border-white/5 px-4 py-3">
            <div class="flex flex-col 2xl:flex-row 2xl:items-center gap-3">
                <div class="min-w-[245px]">
                    <div class="text-[10px] text-yellow-300/70 font-bold tracking-wider">从这里开始</div>
                    <div class="text-sm font-black text-white mt-0.5">先选你要拿到的结果</div>
                    <div class="text-[10px] text-dim mt-1">点入口，再填关键词或原文；生成后可存灵感池、接入项目。</div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2 flex-1">
                    ${quickRoutes.map(([kind, label, desc, icon, color]) => `
                        <button class="group rounded-lg border border-${color}-500/20 bg-${color}-500/10 px-3 py-2 text-left hover:bg-${color}-500/20 hover:border-${color}-500/40 transition min-h-[62px]" onclick="Modules.creative_studio._quickResult('${kind}')">
                            <div class="flex items-center gap-2">
                                <i class="fa-solid ${icon} text-${color}-300 text-xs"></i>
                                <span class="text-xs font-black text-${color}-100">${label}</span>
                            </div>
                            <div class="text-[10px] text-dim mt-1 leading-relaxed">${desc}</div>
                        </button>
                    `).join('')}
                </div>
                <div class="grid grid-cols-3 gap-2 2xl:w-[360px]">
                    <div class="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
                        <div class="text-[9px] text-dim">当前页</div>
                        <div class="text-xs font-bold text-white truncate">${this._getTabLabel(this.currentTab)}</div>
                    </div>
                    <div class="rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
                        <div class="text-[9px] text-dim">灵感池</div>
                        <div class="text-xs font-bold text-cyan-300">${this.ideaPool.length}条</div>
                    </div>
                    <button class="rounded-lg border ${projectTone} px-3 py-2 text-left hover:bg-white/10 transition" onclick="Navigation.show('project_manager')">
                        <div class="text-[9px] opacity-70">项目</div>
                        <div class="text-xs font-bold truncate">${activeProject}</div>
                    </button>
                </div>
            </div>
        </div>`;
    },

    _refreshCommandStrip() {
        const el = document.getElementById('cs-command-strip');
        if (el) el.innerHTML = this._renderCommandStrip();
    },

    _quickResult(kind) {
        const cfg = {
            idea: { tab: 'inspiration', quick: 'idea', focus: 'cs-free-input', msg: '已切到新脑洞：填关键词，点生成。' },
            quickwrite: { tab: 'quickwrite', focus: 'cs-sw-synopsis', msg: '已切到短篇/片段：填标题或一句话梗概。' },
            deai: { tab: 'deai', focus: 'cs-deai-input', msg: '已切到消AI味：粘贴原文后处理。' },
            storyboard: { tab: 'storyboard', focus: 'cs-sb-scene', msg: '已切到分镜/画面：粘贴场景后生成。' },
            platform: { tab: 'platform', focus: 'cs-platform-input', msg: '已切到发布文案：粘贴章节或卖点。' }
        }[kind];
        if (!cfg) return;
        if (cfg.quick) this._selectedQuickType = cfg.quick;
        this.switchTab(cfg.tab);
        UI.toast(cfg.msg);
        setTimeout(() => {
            const el = document.getElementById(cfg.focus) || document.querySelector('#cs-workspace textarea, #cs-workspace input');
            if (el && typeof el.focus === 'function') el.focus();
        }, 80);
    },

    render: () => {
        const CS = Modules.creative_studio;
        const t = CS.currentTab;
        const tabs = [
            {id:'inspiration', icon:'fa-lightbulb', text:'灵感中枢', color:'text-yellow-400'},
            {id:'quickwrite', icon:'fa-feather-pointed', text:'快写模式', color:'text-green-400'},
            {id:'pool', icon:'fa-bucket', text:'灵感池', color:'text-cyan-400'},
            {id:'generators', icon:'fa-shapes', text:'生成器广场', color:'text-amber-400'},
            {id:'deai', icon:'fa-eraser', text:'AI消痕', color:'text-emerald-400'},
            {id:'deconstruct', icon:'fa-scissors', text:'拆书工坊', color:'text-violet-400'},
            {id:'storyboard', icon:'fa-film', text:'分镜设计', color:'text-rose-400'},
            {id:'comic', icon:'fa-mask', text:'漫画脚本', color:'text-pink-400'},
            {id:'visual', icon:'fa-eye', text:'视觉提示词', color:'text-indigo-400'},
            {id:'video', icon:'fa-video', text:'视频生成', color:'text-fuchsia-400'},
            {id:'drama', icon:'fa-clapperboard', text:'漫剧流水线', color:'text-orange-400'},
            {id:'lookbook', icon:'fa-portrait', text:'角色外观库', color:'text-teal-400'},
            {id:'platform', icon:'fa-share-from-square', text:'平台适配', color:'text-cyan-400'},
            {id:'trends', icon:'fa-fire-flame-curved', text:'热点扫榜', color:'text-red-400'}
        ];
        return `
        <div class="flex h-full bg-[#08080a] overflow-hidden">
            <div class="w-56 md:w-64 shrink-0 flex flex-col bg-[#0e0e10] border-r border-white/5">
                <div class="p-4 border-b border-white/5 bg-gradient-to-r from-yellow-900/20 to-transparent">
                    <div class="flex items-center gap-2">
                        <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 flex center text-white text-sm shadow-lg shadow-yellow-500/20"><i class="fa-solid fa-wand-magic-sparkles"></i></div>
                        <div>
                            <div class="font-bold text-white text-sm">创意工坊</div>
                            <div class="text-[10px] text-dim">灵感 · 快写 · 消痕 · 拆书 · 分镜 · 漫剧</div>
                        </div>
                    </div>
                </div>
                <div class="p-2 space-y-1">
                    ${tabs.map(tb => `
                        <button class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-bold transition-all ${t===tb.id ? 'bg-white/10 text-white border border-white/10' : 'text-dim hover:bg-white/5 border border-transparent'}" onclick="Modules.creative_studio.switchTab('${tb.id}')">
                            <i class="fa-solid ${tb.icon} ${tb.color} w-5 text-center"></i>
                            <span>${tb.text}</span>
                        </button>
                    `).join('')}
                </div>
                <div class="flex-1"></div>
                <div class="p-3 border-t border-white/5 bg-[#0a0a0c] space-y-2">
                    <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30 w-full" onclick="Modules.creative_studio._toPhoenix()"><i class="fa-solid fa-fire mr-1"></i>灵感→凤凰流</button>
                </div>
            </div>
            <div class="flex-1 flex flex-col min-w-0">
                <div id="cs-command-strip" class="shrink-0">${CS._renderCommandStrip()}</div>
                <div class="flex-1 flex flex-col min-w-0 overflow-hidden" id="cs-workspace">${CS._renderWorkspace()}</div>
            </div>
        </div>`;
    },

    switchTab(tab) {
        this._saveTabCache();
        this.currentTab = tab;
        const ws = document.getElementById('cs-workspace');
        if (ws) {
            ws.innerHTML = this._renderWorkspace();
        } else {
            const v = document.getElementById('module-view-creative_studio');
            if(v) v.innerHTML = this.render();
        }
        this._updateSidebarHighlight();
        this._refreshCommandStrip();
        this._restoreTabCache();
        if(tab==='pool') this._loadIdeaPool();
    },
    init() {
        this._restoreTabCache();
        this._loadAllCustomPrompts();
        if(this.currentTab==='pool') this._loadIdeaPool();
    },
    _saveTabCache() {
        const t = this.currentTab;
        const c = {};
        if (t === 'inspiration') {
            c.freeInput = (document.getElementById('cs-free-input') || {}).value || '';
            c.freeType = (document.getElementById('cs-free-type') || {}).value || '';
            c.freeGenre = (document.getElementById('cs-free-genre') || {}).value || '';
            c.result = (document.getElementById('cs-result') || {}).innerHTML || '';
            c.customPrompt = (document.getElementById('cs-custom-prompt') || {}).value || this._customQuickPrompt;
            c.bsTopic = (document.getElementById('cs-bs-topic') || {}).value || '';
            c.bsResults = (document.getElementById('cs-bs-results') || {}).innerHTML || '';
        } else if (t === 'quickwrite') {
            this.shortDraft.title = (document.getElementById('cs-sw-title') || {}).value || this.shortDraft.title;
            this.shortDraft.genre = (document.getElementById('cs-sw-genre') || {}).value || this.shortDraft.genre;
            this.shortDraft.outline = (document.getElementById('cs-sw-outline') || {}).value || this.shortDraft.outline;
            this.shortDraft.content = (document.getElementById('cs-sw-content') || {}).value || this.shortDraft.content;
            c.hotInput = (document.getElementById('cs-hot-input') || {}).value || '';
            c.hotResult = (document.getElementById('cs-hot-result') || {}).innerHTML || '';
        }
        this._tabCache[t] = c;
    },
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
                const bt = document.getElementById('cs-bs-topic'); if (bt && c.bsTopic) bt.value = c.bsTopic;
                const br = document.getElementById('cs-bs-results'); if (br && c.bsResults) br.innerHTML = c.bsResults;
            } else if (t === 'quickwrite') {
                const ti = document.getElementById('cs-sw-title'); if (ti) ti.value = this.shortDraft.title;
                const ge = document.getElementById('cs-sw-genre'); if (ge) ge.value = this.shortDraft.genre;
                const ol = document.getElementById('cs-sw-outline'); if (ol) ol.value = this.shortDraft.outline;
                const co = document.getElementById('cs-sw-content'); if (co) co.value = this.shortDraft.content;
                const hi = document.getElementById('cs-hot-input'); if (hi && c.hotInput) hi.value = c.hotInput;
                const hr = document.getElementById('cs-hot-result'); if (hr && c.hotResult) hr.innerHTML = c.hotResult;
            }
        }, 0);
    },
    _updateSidebarHighlight() {
        const t = this.currentTab;
        const tabs = ['inspiration','quickwrite','pool','generators','deai','deconstruct','storyboard','comic','visual','video','drama','lookbook','platform','trends'];
        tabs.forEach(id => {
            const btns = document.querySelectorAll(`[onclick="Modules.creative_studio.switchTab('${id}')"]`);
            btns.forEach(btn => {
                if (id === t) {
                    btn.className = btn.className.replace(/text-dim hover:bg-white\/5 border border-transparent/g, 'bg-white/10 text-white border border-white/10');
                    if (!btn.className.includes('bg-white/10')) btn.className += ' bg-white/10 text-white border border-white/10';
                } else {
                    btn.className = btn.className.replace(/bg-white\/10 text-white border border-white\/10/g, 'text-dim hover:bg-white/5 border border-transparent');
                }
            });
        });
    },

    _renderWorkspace() {
        const t = this.currentTab;

        // ═══ 灵感中枢 ═══
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
            <div class="h-11 flex items-center px-5 bg-[#0d0d0f] border-b border-white/5 shrink-0">
                <span class="text-xs font-bold text-yellow-400"><i class="fa-solid fa-lightbulb mr-1"></i>灵感中枢 — 选择类型 → 点击生成</span>
                <div class="flex-1"></div>
                ${this._renderPromptEditButton('inspiration','灵感中枢')}
                <div class="flex items-center gap-2 ml-2">
                    <label class="flex items-center gap-1 text-[10px] text-dim cursor-pointer">
                        <input type="checkbox" class="w-3 h-3 rounded" ${this._deepMode ? 'checked' : ''} onchange="Modules.creative_studio._toggleDeepMode()">
                        <span>深度模式</span>
                    </label>
                    <select class="bg-black/30 border border-white/10 rounded px-2 py-1 text-[10px] text-white" onchange="Modules.creative_studio._batchCount=+this.value;Modules.creative_studio._refreshCommandStrip()">
                        <option value="1" ${this._batchCount===1?'selected':''}>单次生成</option>
                        <option value="3" ${this._batchCount===3?'selected':''}>批量×3</option>
                        <option value="5" ${this._batchCount===5?'selected':''}>批量×5</option>
                        <option value="10" ${this._batchCount===10?'selected':''}>批量×10</option>
                    </select>
                </div>
            </div>
            <div class="flex-1 overflow-y-auto p-6 space-y-4">
                <div class="grid grid-cols-4 gap-2">
                    ${cards.map(([k,name,icon,color]) => `
                        <button class="p-3 rounded-xl border-2 transition-all text-left group ${sel===k ? 'bg-'+color+'-900/30 border-'+color+'-400 shadow-lg shadow-'+color+'-500/20 ring-1 ring-'+color+'-400/50' : 'bg-'+color+'-900/10 border-'+color+'-500/15 hover:border-'+color+'-500/40'}" onclick="Modules.creative_studio._selectQuickType('${k}')">
                            <div class="flex items-center gap-2">
                                <i class="fa-solid ${icon} text-${color}-400 ${sel===k ? 'animate-pulse' : ''}"></i>
                                <span class="text-xs font-bold text-${color}-300">${name}</span>
                                ${sel===k ? '<i class="fa-solid fa-check-circle text-'+color+'-400 ml-auto text-xs"></i>' : ''}
                            </div>
                        </button>
                    `).join('')}
                </div>
                ${sel === 'custom' ? `
                <div class="bg-[#111113] rounded-xl border border-cyan-500/20 p-4 space-y-2">
                    <span class="text-xs font-bold text-cyan-400"><i class="fa-solid fa-pen-to-square mr-1"></i>自定义灵感提示词</span>
                    <textarea id="cs-custom-prompt" class="textarea bg-black/30 border-white/10 text-white w-full h-24 text-xs leading-relaxed resize-none" placeholder="输入你想让AI生成的任何灵感类型，例如：&#10;生成一个赛博朋克风格的悬疑开头...&#10;设计一个双重人格的反派角色..." oninput="Modules.creative_studio._customQuickPrompt=this.value">${this._customQuickPrompt}</textarea>
                </div>` : ''}
                <div class="flex justify-center">
                    <button class="btn h-11 px-10 rounded-xl bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white font-bold text-sm shadow-lg shadow-yellow-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all" onclick="Modules.creative_studio._doQuickGen()" ${!sel ? 'disabled' : ''}>
                        <i class="fa-solid fa-wand-magic-sparkles mr-2"></i>${sel ? '生成「' + (cards.find(c=>c[0]===sel)||[])[1] + '」' : '请先选择灵感类型'}
                    </button>
                </div>
                <div class="bg-[#111113] rounded-xl border border-white/5 p-4 space-y-3">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-white">自由灵感生成</span>
                        <button class="btn btn-xs bg-yellow-600/20 text-yellow-400 border-yellow-600/30" onclick="Modules.creative_studio._freeGen()"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>生成</button>
                    </div>
                    <input id="cs-free-input" class="input bg-black/30 border-white/10 text-white w-full" placeholder="输入关键词、主题或任何灵感碎片...">
                    <div class="flex gap-2">
                        <select id="cs-free-type" class="input bg-black/30 border-white/10 text-white text-xs flex-1">
                            <option value="idea">脑洞创意</option><option value="outline">速写大纲</option><option value="scene">场景描写</option>
                            <option value="dialogue">精彩对话</option><option value="emotion">情感渲染</option><option value="world">世界观补全</option>
                            <option value="ending">意外结局</option><option value="conflict">核心冲突</option>
                        </select>
                        <select id="cs-free-genre" class="input bg-black/30 border-white/10 text-white text-xs flex-1">
                            <option value="">不限类型</option><option value="玄幻">玄幻</option><option value="都市">都市</option>
                            <option value="科幻">科幻</option><option value="悬疑">悬疑</option><option value="言情">言情</option>
                            <option value="历史">历史</option><option value="恐怖">恐怖</option><option value="奇幻">奇幻</option>
                        </select>
                    </div>
                </div>
                <div class="bg-[#111113] rounded-xl border border-white/5 flex flex-col min-h-[250px]">
                    <div class="flex items-center justify-between px-4 py-2 border-b border-white/5">
                        <span class="text-[10px] text-yellow-400 font-bold">生成结果</span>
                        <div class="flex gap-1">
                            <button class="btn btn-xs bg-white/5 text-dim" onclick="Utils.copy(document.getElementById('cs-result').innerText);UI.toast('已复制')"><i class="fa-solid fa-copy"></i></button>
                            <button class="btn btn-xs bg-cyan-600/20 text-cyan-400" onclick="Modules.creative_studio._saveToPool()"><i class="fa-solid fa-bucket mr-1"></i>存灵感池</button>
                        </div>
                    </div>
                    <div id="cs-result" class="flex-1 p-4 text-sm text-gray-300 leading-relaxed overflow-y-auto markdown-body"></div>
                </div>
                <!-- 脑洞工具 -->
                <div class="bg-[#111113] rounded-xl border border-purple-500/20 p-4 space-y-3">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-bold text-purple-400"><i class="fa-solid fa-brain mr-1"></i>脑洞工具</span>
                            ${this._renderPromptEditButton('brainstorm','脑洞风暴')}
                        </div>
                        <div class="flex gap-2">
                            <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30" onclick="Modules.creative_studio._randomCollision()"><i class="fa-solid fa-shuffle mr-1"></i>随机碰撞</button>
                            <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30" onclick="Modules.creative_studio._ideaEvolution()"><i class="fa-solid fa-dna mr-1"></i>创意进化</button>
                            <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30" onclick="Modules.creative_studio._runBrainStorm()"><i class="fa-solid fa-bolt mr-1"></i>开始风暴</button>
                        </div>
                    </div>
                    <div class="grid grid-cols-3 gap-3">
                        <div class="space-y-1">
                            <span class="text-[10px] text-dim font-bold uppercase">主题/关键词</span>
                            <input id="cs-bs-topic" class="input bg-black/30 border-white/10 text-white w-full text-xs" placeholder="例如：末日、AI觉醒、时间循环...">
                        </div>
                        <div class="space-y-1">
                            <span class="text-[10px] text-dim font-bold uppercase">生成数量</span>
                            <select id="cs-bs-count" class="input bg-black/30 border-white/10 text-white w-full text-xs">
                                <option value="5">5个创意</option><option value="10" selected>10个创意</option><option value="20">20个创意</option>
                            </select>
                        </div>
                        <div class="space-y-1">
                            <span class="text-[10px] text-dim font-bold uppercase">创意模式</span>
                            <select id="cs-bs-mode" class="input bg-black/30 border-white/10 text-white w-full text-xs">
                                <option value="normal">普通模式</option>
                                <option value="extreme">极端脑洞</option>
                                <option value="crossover">跨界融合</option>
                                <option value="subvert">颠覆套路</option>
                            </select>
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        ${['反套路','跨类型混搭','极端设定','情感核弹','社会隐喻','黑色幽默','硬核科幻','东方玄幻','赛博朋克','克苏鲁'].map(tag => `
                            <button class="px-3 py-1.5 rounded-full text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20" onclick="document.getElementById('cs-bs-topic').value+=' ${tag}'">${tag}</button>
                        `).join('')}
                    </div>
                    <div id="cs-bs-results" class="grid grid-cols-2 gap-3"></div>
                </div>
            </div>`;
        }

        // ═══ 快写模式 ═══
        if(t === 'quickwrite') return this._renderQuickWrite();

        // ═══ 灵感池 ═══
        if(t === 'pool') return `
            <div class="h-11 flex items-center justify-between px-5 bg-[#0d0d0f] border-b border-white/5 shrink-0">
                <span class="text-xs font-bold text-cyan-400"><i class="fa-solid fa-bucket mr-1"></i>灵感池</span>
                <div class="flex gap-2">
                    <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30" onclick="Modules.creative_studio._addIdeaManual()"><i class="fa-solid fa-plus mr-1"></i>手动添加</button>
                    <button class="btn btn-xs bg-red-600/20 text-red-400 border-red-600/30" onclick="Modules.creative_studio._clearPool()"><i class="fa-solid fa-trash mr-1"></i>清空</button>
                </div>
            </div>
            <div class="flex-1 overflow-y-auto p-6">
                <div class="flex gap-2 mb-4">
                    <button class="px-2 py-1 rounded text-[10px] bg-white/5 text-dim hover:bg-yellow-500/10 hover:text-yellow-400" onclick="Modules.creative_studio._filterPool('all')">全部</button>
                    <button class="px-2 py-1 rounded text-[10px] bg-white/5 text-dim hover:bg-yellow-500/10 hover:text-yellow-400" onclick="Modules.creative_studio._filterPool('inspiration')">灵感</button>
                    <button class="px-2 py-1 rounded text-[10px] bg-white/5 text-dim hover:bg-red-500/10 hover:text-red-400" onclick="Modules.creative_studio._filterPool('hotspot')">热点</button>
                    <button class="px-2 py-1 rounded text-[10px] bg-white/5 text-dim hover:bg-purple-500/10 hover:text-purple-400" onclick="Modules.creative_studio._filterPool('brainstorm')">脑洞</button>
                    <button class="px-2 py-1 rounded text-[10px] bg-white/5 text-dim hover:bg-cyan-500/10 hover:text-cyan-400" onclick="Modules.creative_studio._filterPool('manual')">手动</button>
                </div>
                <div id="cs-pool-list" class="grid grid-cols-3 gap-3"></div>
            </div>`;

        // ═══ 生成器广场 ═══
        if(t === 'generators') return this._renderGeneratorsTab ? this._renderGeneratorsTab() : '<div class="flex center h-full text-dim">生成器广场加载中...</div>';

        // ═══ AI消痕 ═══
        if(t === 'deai') return this._renderDeaiTab ? this._renderDeaiTab() : '<div class="flex center h-full text-dim">AI消痕加载中...</div>';

        // ═══ 拆书工坊 ═══
        if(t === 'deconstruct') return this._renderDeconstructTab ? this._renderDeconstructTab() : '<div class="flex center h-full text-dim">拆书工坊加载中...</div>';

        // ═══ 分镜设计 ═══
        if(t === 'storyboard') return this._renderStoryboard();

        // ═══ 漫剧脚本 ═══
        if(t === 'comic') return this._renderComic();

        // ═══ 漫剧流水线 ═══
        if(t === 'drama') return this._renderDramaTab ? this._renderDramaTab() : '<div class="flex center h-full text-dim">漫剧流水线加载中...</div>';

        // ═══ 角色外观库 ═══
        if(t === 'lookbook') return this._renderLookbookTab ? this._renderLookbookTab() : '<div class="flex center h-full text-dim">角色外观库加载中...</div>';

        // ═══ 平台适配 ═══
        if(t === 'platform') return this._renderPlatformTab ? this._renderPlatformTab() : '<div class="flex center h-full text-dim">平台适配加载中...</div>';

        // ═══ 热点扫榜 ═══
        if(t === 'trends') return this._renderTrendsTab ? this._renderTrendsTab() : '<div class="flex center h-full text-dim">热点扫榜加载中...</div>';
        if(t === 'visual') return this._renderVisualTab ? this._renderVisualTab() : '<div class="flex center h-full text-dim">视觉提示词加载中...</div>';
        if(t === 'video') return this._renderVideoTab ? this._renderVideoTab() : '<div class="flex center h-full text-dim">视频生成加载中...</div>';

        return '';
    },

    // ═══ 分镜设计工作台 ═══
    _renderStoryboard() {
        return `
            <div class="h-11 flex items-center justify-between px-5 bg-[#0d0d0f] border-b border-white/5 shrink-0">
                <span class="text-xs font-bold text-rose-400"><i class="fa-solid fa-film mr-1"></i>分镜设计工作台</span>
                <div class="flex gap-2">
                    <button class="btn btn-xs bg-rose-600/20 text-rose-400 border-rose-600/30" onclick="Modules.creative_studio._aiStoryboard()"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>AI生成分镜</button>
                    <button class="btn btn-xs bg-blue-600/20 text-blue-400 border-blue-600/30" onclick="Modules.creative_studio._saveStoryboard()"><i class="fa-solid fa-save mr-1"></i>保存</button>
                </div>
            </div>
            <div class="flex h-full min-h-0">
                <div class="w-72 shrink-0 border-r border-white/5 flex flex-col bg-[#0d0d0f] p-3 space-y-3 overflow-y-auto">
                    <div class="space-y-1">
                        <span class="text-[10px] text-dim font-bold">场景描述</span>
                        <textarea id="cs-sb-scene" class="textarea bg-black/30 border-white/10 text-gray-300 w-full h-24 text-xs resize-none" placeholder="输入需要分镜化的场景描述，如：主角在雨夜中追逐反派..."></textarea>
                    </div>
                    <div class="space-y-1">
                        <span class="text-[10px] text-dim font-bold">风格</span>
                        <select id="cs-sb-style" class="input bg-black/30 border-white/10 text-white w-full text-xs">
                            <option value="cinematic">电影感</option>
                            <option value="anime">日式动画</option>
                            <option value="noir">黑色电影</option>
                            <option value="documentary">纪录片</option>
                        </select>
                    </div>
                    <div class="space-y-1">
                        <span class="text-[10px] text-dim font-bold">镜头数量</span>
                        <select id="cs-sb-count" class="input bg-black/30 border-white/10 text-white w-full text-xs">
                            <option value="3">3镜 (精简)</option>
                            <option value="5" selected>5镜 (标准)</option>
                            <option value="8">8镜 (详细)</option>
                        </select>
                    </div>
                </div>
                <div class="flex-1 overflow-y-auto p-6">
                    <div id="cs-sb-result" class="space-y-3"></div>
                </div>
            </div>`;
    },

    // ═══ 漫剧脚本工作台 ═══
    _renderComic() {
        return `
            <div class="h-11 flex items-center justify-between px-5 bg-[#0d0d0f] border-b border-white/5 shrink-0">
                <span class="text-xs font-bold text-violet-400"><i class="fa-solid fa-mask mr-1"></i>漫画脚本工作台</span>
                <div class="flex gap-2">
                    <button class="btn btn-xs bg-violet-600/20 text-violet-400 border-violet-600/30" onclick="Modules.creative_studio._aiComicScript()"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>AI生成脚本</button>
                    <button class="btn btn-xs bg-blue-600/20 text-blue-400 border-blue-600/30" onclick="Modules.creative_studio._saveComicScript()"><i class="fa-solid fa-save mr-1"></i>保存</button>
                </div>
            </div>
            <div class="flex h-full min-h-0">
                <div class="w-72 shrink-0 border-r border-white/5 flex flex-col bg-[#0d0d0f] p-3 space-y-3 overflow-y-auto">
                    <div class="space-y-1">
                        <span class="text-[10px] text-dim font-bold">原作/情节</span>
                        <textarea id="cs-cm-scene" class="textarea bg-black/30 border-white/10 text-gray-300 w-full h-24 text-xs resize-none" placeholder="输入原作情节或场景描述..."></textarea>
                    </div>
                    <div class="space-y-1">
                        <span class="text-[10px] text-dim font-bold">漫剧类型</span>
                        <select id="cs-cm-type" class="input bg-black/30 border-white/10 text-white w-full text-xs">
                            <option value="vertical">竖屏漫剧 (短视频)</option>
                            <option value="horizontal">横屏漫剧 (长视频)</option>
                            <option value="webtoon">条漫</option>
                        </select>
                    </div>
                    <div class="space-y-1">
                        <span class="text-[10px] text-dim font-bold">每话格数</span>
                        <select id="cs-cm-panels" class="input bg-black/30 border-white/10 text-white w-full text-xs">
                            <option value="6">6格 (快速节奏)</option>
                            <option value="10" selected>10格 (标准)</option>
                            <option value="15">15格 (详细叙事)</option>
                        </select>
                    </div>
                </div>
                <div class="flex-1 overflow-y-auto p-6">
                    <div id="cs-cm-result" class="space-y-3"></div>
                </div>
            </div>`;
    },

    // ═══ 快写模式工作台 ═══
    _renderQuickWrite() {
        const d = this.shortDraft;
        const templates = [
            { name: '悬疑反转', outline: '开篇设置悬念→层层铺垫→误导读者→惊人真相→反转结局' },
            { name: '治愈系', outline: '主角遭遇困境→遇见温暖的人/事→逐渐治愈→成长蜕变' },
            { name: '爽文打脸', outline: '主角被欺压→获得金手指→打脸反转→收获满满' },
            { name: '规则怪谈', outline: '诡异规则发布→逐步触犯→发现真相→生死博弈' },
            { name: '甜宠日常', outline: '意外相遇→欢喜冤家→感情升温→甜蜜结局' },
            { name: '恐怖惊悚', outline: '诡异氛围→恐怖事件→绝望挣扎→开放式结局' }
        ];
        return `
            <div class="h-11 flex items-center justify-between px-5 bg-[#0d0d0f] border-b border-white/5 shrink-0">
                <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-green-400"><i class="fa-solid fa-feather-pointed mr-1"></i>短篇快写工作台</span>
                    ${this._renderPromptEditButton('quickwrite','快写模式')}
                </div>
                <div class="flex gap-2">
                    <button class="btn btn-xs bg-white/5 text-dim border-white/10 hover:bg-green-600/20 hover:text-green-400" onclick="Modules.creative_studio._addShortTask()"><i class="fa-solid fa-plus mr-1"></i>加入队列</button>
                    <button class="btn btn-xs bg-white/5 text-dim border-white/10 hover:bg-green-600/20 hover:text-green-400" onclick="Modules.creative_studio._runAllShortTasks()"><i class="fa-solid fa-forward mr-1"></i>批量执行</button>
                    <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30" onclick="Modules.creative_studio._oneClickWrite()"><i class="fa-solid fa-bolt mr-1"></i>一键成文</button>
                    <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30" onclick="Modules.creative_studio._aiShortOutline()"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>AI生成大纲</button>
                    <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30" onclick="Modules.creative_studio._aiShortWrite()"><i class="fa-solid fa-pen-nib mr-1"></i>AI写正文</button>
                    <button class="btn btn-xs bg-blue-600/20 text-blue-400 border-blue-600/30" onclick="Modules.creative_studio._saveShort()"><i class="fa-solid fa-save mr-1"></i>保存</button>
                    <button class="btn btn-xs bg-red-600/20 text-red-400 border-red-600/30" onclick="Modules.creative_studio._toggleHotspotPanel()"><i class="fa-solid fa-fire-flame-curved mr-1"></i>分析热点</button>
                </div>
            </div>
            <div class="flex h-full min-h-0">
                <div class="w-72 shrink-0 border-r border-white/5 flex flex-col bg-[#0d0d0f]">
                    <div class="p-3 space-y-3 overflow-y-auto flex-1">
                        <div class="space-y-1">
                            <span class="text-[10px] text-dim font-bold">标题</span>
                            <input id="cs-sw-title" class="input bg-black/30 border-white/10 text-white w-full font-bold" placeholder="短篇标题" value="${d.title}" oninput="Modules.creative_studio.shortDraft.title=this.value">
                        </div>
                        <div class="space-y-1">
                            <span class="text-[10px] text-dim font-bold">类型</span>
                            <select id="cs-sw-genre" class="input bg-black/30 border-white/10 text-white w-full text-xs" onchange="Modules.creative_studio.shortDraft.genre=this.value">
                                <option value="">选择类型</option>
                                <option>玄幻脑洞</option><option>都市重生</option><option>赘婿逆袭</option>
                                <option>修仙升级</option><option>悬疑推理</option><option>言情虐恋</option>
                                <option>甜宠日常</option><option>恐怖灵异</option><option>末日求生</option>
                                <option>历史穿越</option><option>游戏电竞</option><option>科幻星际</option>
                                <option>职场商战</option><option>种田休闲</option><option>规则怪谈</option>
                                <option>无限流</option><option>签到系统</option><option>苟道流</option>
                                <option>模拟器</option><option>国运争霸</option>
                            </select>
                        </div>
                        <div class="space-y-1">
                            <div class="flex justify-between">
                                <span class="text-[10px] text-dim font-bold">目标字数</span>
                                <span class="text-[9px] text-dim">自定义</span>
                            </div>
                            <input id="cs-sw-target" type="number" class="input bg-black/30 border-white/10 text-white w-full text-xs" placeholder="输入字数" value="${d.wordTarget || 3000}" min="500" max="50000" onchange="Modules.creative_studio.shortDraft.wordTarget=+this.value;Modules.creative_studio._updateWC()">
                        </div>
                        <div class="space-y-1">
                            <div class="flex justify-between items-center">
                                <span class="text-[10px] text-dim font-bold">简介梗概</span>
                                <span class="text-[9px] text-dim">一句话故事</span>
                            </div>
                            <textarea id="cs-sw-synopsis" class="textarea bg-black/30 border-white/10 text-gray-300 w-full h-16 text-xs leading-relaxed resize-none" placeholder="一句话概括核心冲突，如：废柴赘婿被离婚当天，发现自己是隐世宗门少主...">${d.synopsis || ''}</textarea>
                        </div>
                        <div class="space-y-1 flex-1">
                            <div class="flex justify-between items-center">
                                <span class="text-[10px] text-dim font-bold">大纲/构思</span>
                                <span class="text-[9px] text-green-400 cursor-pointer hover:text-green-300" onclick="Modules.creative_studio._aiShortOutline()"><i class="fa-solid fa-wand-magic-sparkles mr-0.5"></i>根据梗概生成</span>
                            </div>
                            <textarea id="cs-sw-outline" class="textarea bg-black/30 border-white/10 text-gray-300 w-full min-h-[120px] text-xs leading-relaxed resize-none" placeholder="故事梗概、人物设定、情节走向...没有大纲请点击上方「AI生成大纲」或「根据梗概生成」" oninput="Modules.creative_studio.shortDraft.outline=this.value">${d.outline}</textarea>
                        </div>
                        <div class="flex gap-2">
                            <button class="btn btn-xs bg-yellow-600/20 text-yellow-400 flex-1" onclick="Modules.creative_studio._aiShortContinue()"><i class="fa-solid fa-play mr-1"></i>AI续写</button>
                            <button class="btn btn-xs bg-pink-600/20 text-pink-400 flex-1" onclick="Modules.creative_studio._aiShortPolish()"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>润色</button>
                        </div>
                        <div class="text-[10px] text-dim bg-black/20 rounded p-2 border border-white/5">
                            <div>当前字数: <span class="text-green-400 font-bold" id="cs-sw-wc">0</span> / <span id="cs-sw-target-display">${d.wordTarget || 3000}</span></div>
                        </div>
                        <!-- 批量任务队列 -->
                        <div class="border-t border-white/5 pt-2 mt-2">
                            <div class="flex items-center justify-between mb-1">
                                <div class="text-[10px] text-dim font-bold uppercase tracking-wider"><i class="fa-solid fa-list-check mr-1 text-amber-400"></i>写作队列</div>
                                <button class="text-[9px] text-red-400 hover:text-red-300" onclick="Modules.creative_studio._clearShortTasks()">清空</button>
                            </div>
                            <div id="cs-sw-tasklist" class="space-y-1 max-h-[120px] overflow-y-auto">
                                ${(this._shortTasks || []).length ? this._shortTasks.map(t => `
                                    <div class="flex items-center gap-2 px-2 py-1.5 rounded bg-white/5 text-[10px] group">
                                        <div class="w-1.5 h-1.5 rounded-full ${t.status==='done'?'bg-green-400':t.status==='running'?'bg-amber-400 animate-pulse':t.status==='error'?'bg-red-400':'bg-dim'}"></div>
                                        <div class="flex-1 truncate ${t.status==='done'?'text-green-400':t.status==='error'?'text-red-400':'text-white'}">${t.name}</div>
                                        <button class="text-[9px] text-dim hover:text-red-400 opacity-0 group-hover:opacity-100 transition" onclick="Modules.creative_studio._removeShortTask('${t.id}')"><i class="fa-solid fa-xmark"></i></button>
                                    </div>
                                `).join('') : '<div class="text-[10px] text-dim text-center py-2">暂无任务</div>'}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="w-56 shrink-0 border-r border-white/5 bg-[#0a0a0c] p-3 space-y-2 overflow-y-auto">
                    <div class="text-[10px] text-dim font-bold uppercase tracking-wider"><i class="fa-solid fa-bookmark mr-1 text-green-400"></i>模板库</div>
                    ${templates.map(t => `
                        <button class="w-full text-left px-3 py-2 rounded-lg text-[10px] bg-white/5 hover:bg-green-500/10 hover:text-green-400 border border-transparent hover:border-green-500/20 transition-all" onclick="Modules.creative_studio._applyTemplate('${t.name}','${t.outline}')">
                            <div class="font-bold">${t.name}</div>
                            <div class="text-[9px] text-dim mt-0.5 line-clamp-1">${t.outline}</div>
                        </button>
                    `).join('')}
                    <div class="border-t border-white/5 pt-2 mt-2">
                        <div class="text-[10px] text-dim font-bold uppercase tracking-wider mb-1"><i class="fa-solid fa-sliders mr-1 text-amber-400"></i>写作风格</div>
                        <select id="cs-sw-style" class="input bg-black/30 border-white/10 text-white w-full text-[10px]">
                            <option value="default">默认风格</option>
                            <option value="literary">文艺细腻</option>
                            <option value="humorous">幽默诙谐</option>
                            <option value="suspense">悬疑紧张</option>
                            <option value="passionate">热血激昂</option>
                            <option value="warm">温馨治愈</option>
                        </select>
                    </div>
                    <div class="border-t border-white/5 pt-2 mt-2">
                        <div class="text-[10px] text-dim font-bold uppercase tracking-wider mb-1"><i class="fa-solid fa-user mr-1 text-cyan-400"></i>视角</div>
                        <select id="cs-sw-pov" class="input bg-black/30 border-white/10 text-white w-full text-[10px]">
                            <option value="first">第一人称</option>
                            <option value="third">第三人称</option>
                            <option value="multi">多视角</option>
                        </select>
                    </div>
                </div>
                <div class="flex-1 flex flex-col min-w-0 relative">
                    <!-- 生产中提示 -->
                    <div id="cs-sw-producing" class="hidden absolute top-0 left-0 right-0 z-10 bg-green-900/20 border-b border-green-500/20 px-4 py-2 flex items-center gap-2">
                        <i class="fa-solid fa-circle-notch fa-spin text-green-400 text-xs"></i>
                        <span class="text-[11px] text-green-400" id="cs-sw-producing-text">正在创作...</span>
                        <div class="flex-1"></div>
                        <span class="text-[9px] text-dim" id="cs-sw-producing-wc">0字</span>
                    </div>
                    <textarea id="cs-sw-content" class="flex-1 bg-transparent border-none p-6 text-base text-gray-200 leading-loose resize-none focus:outline-none font-serif" placeholder="在此创作短篇正文..." oninput="Modules.creative_studio.shortDraft.content=this.value;Modules.creative_studio._updateWC()">${d.content}</textarea>
                </div>
                <!-- 热点分析面板 -->
                <div id="cs-hot-panel" class="w-80 shrink-0 border-l border-white/5 bg-[#0a0a0c] flex flex-col" style="display:none">
                    <div class="h-10 flex items-center justify-between px-3 border-b border-white/5 shrink-0">
                        <span class="text-xs font-bold text-red-400"><i class="fa-solid fa-fire-flame-curved mr-1"></i>热点分析</span>
                        <button class="text-dim hover:text-white text-xs" onclick="Modules.creative_studio._toggleHotspotPanel()"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="flex-1 overflow-y-auto p-3 space-y-3">
                        <input id="cs-hot-input" class="input bg-black/30 border-white/10 text-white w-full text-xs" placeholder="输入热梗、热门话题、爆款书名...">
                        <div class="flex flex-wrap gap-1">
                            ${['赘婿流','系统流','无限流','末日废土','AI觉醒','穿越种田','修仙','都市异能','重生复仇','签到系统','苟道流','模拟器'].map(tag => `
                                <button class="px-2 py-1 rounded-full text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20" onclick="document.getElementById('cs-hot-input').value='${tag}'">${tag}</button>
                            `).join('')}
                        </div>
                        <div class="flex gap-2">
                            <select id="cs-hot-mode" class="input bg-black/30 border-white/10 text-white text-[10px] flex-1">
                                <option value="trope">热梗拆解</option>
                                <option value="market">市场趋势</option>
                                <option value="reader">读者心理</option>
                                <option value="innovate">创新融合</option>
                            </select>
                            <button class="btn btn-xs bg-red-600/20 text-red-400 border-red-600/30 shrink-0" onclick="Modules.creative_studio._analyzeHot()"><i class="fa-solid fa-bolt mr-1"></i>分析</button>
                        </div>
                        <div id="cs-hot-result" class="bg-[#111113] rounded-lg border border-white/5 p-3 text-xs text-gray-300 leading-relaxed overflow-y-auto markdown-body min-h-[200px]"></div>
                    </div>
                </div>
            </div>`;
    },
    _hotspotPanelVisible: false,
    _toggleHotspotPanel() {
        this._hotspotPanelVisible = !this._hotspotPanelVisible;
        const p = document.getElementById('cs-hot-panel');
        if(p) p.style.display = this._hotspotPanelVisible ? '' : 'none';
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
        const outline = (document.getElementById('cs-sw-outline') || {}).value || '';
        if (!outline.trim() || outline === '生成中...') {
            UI.toast('请先填写大纲或点击「AI生成大纲」', 'warning');
            const outlineEl = document.getElementById('cs-sw-outline');
            if (outlineEl) { outlineEl.focus(); outlineEl.placeholder = '⚠️ 一键成文需要大纲！请在此填写大纲，或点击上方「AI生成大纲」自动生成'; }
            return;
        }
        // 一键成文 = 直接调用 AI写正文（带字数检测和自动续写）
        await this._aiShortWrite();
    },

    _updateWC() {
        const content = this.shortDraft.content || '';
        const wc = content.length;
        const target = this.shortDraft.wordTarget || 3000;
        const wcEl = document.getElementById('cs-sw-wc');
        const targetDisplayEl = document.getElementById('cs-sw-target-display');
        if (wcEl) wcEl.textContent = wc;
        if (targetDisplayEl) targetDisplayEl.textContent = target;
        // 字数不足时标红
        if (wcEl) {
            wcEl.className = wc >= target ? 'text-green-400 font-bold' : wc >= target * 0.8 ? 'text-amber-400 font-bold' : 'text-red-400 font-bold';
        }
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
    // ═══ 灵感池方法 ═══
    async _loadIdeaPool() {
        const store = await DB.get('settings', 'idea_pool');
        this.ideaPool = (store && store.items) ? store.items : [];
        this._refreshCommandStrip();
        this._renderPool();
    },

    _poolFilter: 'all',
    _filterPool(type) {
        this._poolFilter = type;
        this._renderPool();
    },
    _renderPool() {
        const el = document.getElementById('cs-pool-list');
        if(!el) return;
        const filtered = this._poolFilter === 'all' ? this.ideaPool : this.ideaPool.filter(i => i.type === this._poolFilter);
        if(!filtered.length) {
            el.innerHTML = '<div class="col-span-3 flex flex-col items-center justify-center text-dim h-48"><i class="fa-solid fa-bucket text-3xl mb-3 opacity-20"></i><p class="text-sm">灵感池为空</p></div>';
            return;
        }
        const typeColors = { inspiration: 'yellow', hotspot: 'red', brainstorm: 'purple', manual: 'cyan' };
        const typeLabels = { inspiration: '灵感', hotspot: '热点', brainstorm: '脑洞', manual: '手动' };
        el.innerHTML = filtered.map((idea, i) => {
            const c = typeColors[idea.type] || 'gray';
            const globalIdx = this.ideaPool.indexOf(idea);
            return `
            <div class="p-3 rounded-xl bg-${c}-900/10 border border-${c}-500/15 hover:border-${c}-500/40 transition-all group relative">
                <div class="flex items-center justify-between mb-1">
                    <span class="text-xs font-bold text-${c}-300 truncate flex-1">${idea.title}</span>
                    <span class="text-[8px] text-${c}-400 bg-${c}-500/10 px-1.5 py-0.5 rounded ml-1">${typeLabels[idea.type] || '其他'}</span>
                </div>
                <div class="text-[10px] text-dim leading-relaxed line-clamp-3">${(idea.content || '').slice(0, 120)}</div>
                <div class="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="btn btn-xs bg-white/5 text-dim flex-1" onclick="Utils.copy('${idea.content.replace(/'/g, "\\'")}');UI.toast('已复制')"><i class="fa-solid fa-copy"></i></button>
                    <button class="btn btn-xs bg-green-600/20 text-green-400 flex-1" onclick="Modules.creative_studio._poolToPhoenix(${globalIdx})"><i class="fa-solid fa-fire"></i></button>
                    <button class="btn btn-xs bg-red-600/20 text-red-400 flex-1" onclick="Modules.creative_studio._removeFromPool(${globalIdx})"><i class="fa-solid fa-trash"></i></button>
                </div>
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
        this._refreshCommandStrip();
        this._renderPool();
        UI.toast('已添加到灵感池');
    },

    async _removeFromPool(idx) {
        this.ideaPool.splice(idx, 1);
        await DB.put('settings', { id: 'idea_pool', items: this.ideaPool });
        this._refreshCommandStrip();
        this._renderPool();
    },

    async _clearPool() {
        if(!confirm('确定清空灵感池？')) return;
        this.ideaPool = [];
        await DB.put('settings', { id: 'idea_pool', items: [] });
        this._refreshCommandStrip();
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
        this._refreshCommandStrip();
        UI.toast('已存入灵感池');
    },

    _resultToLibrary() {
        const content = (document.getElementById('cs-result') || {}).innerText;
        if(!content) return UI.toast('无内容');
        Utils.copy(content);
        UI.toast('已复制到剪贴板');
    },

    _toPhoenix() {
        const pool = this.ideaPool;
        if(!pool.length) return UI.toast('灵感池为空');
        if(!Modules.phoenix) return UI.toast('凤凰创作流未加载');
        const text = pool.map(i => `[${i.title}] ${i.content}`).join('\n\n');
        Modules.phoenix.data.worldContext = (Modules.phoenix.data.worldContext || '') + '\n[创意工坊灵感注入]\n' + text.slice(0, 3000);
        UI.toast('灵感池已注入凤凰流 (' + pool.length + '条)');
    },

    // ═══════════════════════════════════════════════════════════════
    // ★ Phase 6: 分镜设计 + 漫剧脚本
    // ═══════════════════════════════════════════════════════════════

    async _aiStoryboard() {
        const scene = (document.getElementById('cs-sb-scene') || {}).value || '';
        if (!scene.trim()) return UI.toast('请输入场景描述');
        const style = (document.getElementById('cs-sb-style') || {}).value || 'cinematic';
        const count = +(document.getElementById('cs-sb-count') || {}).value || 5;
        const styleLabels = { cinematic: '电影感', anime: '日式动画', noir: '黑色电影', documentary: '纪录片' };

        const prompt = `你是一位专业分镜师。请将以下场景拆解为${count}个分镜，每个分镜包含：镜号、景别、机位、画面内容、时长、备注。
风格：${styleLabels[style] || style}

场景描述：
${scene.slice(0, 1000)}

请按以下格式输出：
镜号X | 景别 | 机位 | 画面内容 | 时长 | 备注`;

        let result = '';
        const resultEl = document.getElementById('cs-sb-result');
        if (resultEl) resultEl.innerHTML = '<div class="text-dim text-xs">AI 生成分镜中...</div>';

        try {
            await AI.generate(prompt, {}, c => {
                result += c;
                if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none">${typeof marked !== 'undefined' ? marked.parse(result) : result}</div>`;
            });
        } catch(e) {
            UI.toast('生成分镜失败: ' + e.message, 'error');
        }
    },

    async _saveStoryboard() {
        const resultEl = document.getElementById('cs-sb-result');
        const content = resultEl ? resultEl.innerText : '';
        if (!content.trim()) return UI.toast('无内容可保存');
        const id = 'sb_' + Utils.uuid();
        await DB.put('library_books', { id, name: '分镜_' + new Date().toLocaleDateString(), content, size: content.length, date: new Date().toLocaleDateString(), type: 'storyboard' });
        UI.toast('分镜已保存到阅读中心');
    },

    async _aiComicScript() {
        const scene = (document.getElementById('cs-cm-scene') || {}).value || '';
        if (!scene.trim()) return UI.toast('请输入原作情节');
        const type = (document.getElementById('cs-cm-type') || {}).value || 'vertical';
        const panels = +(document.getElementById('cs-cm-panels') || {}).value || 10;
        const typeLabels = { vertical: '竖屏漫剧', horizontal: '横屏漫剧', webtoon: '条漫' };

        const prompt = `你是一位专业漫剧脚本师。请将以下情节改编为${typeLabels[type] || type}脚本，共${panels}格。
每格包含：格号、画面描述、对白/旁白、音效、镜头提示。

原作情节：
${scene.slice(0, 1500)}

请按以下格式输出：
第X格
画面：...
对白：...
音效：...
镜头：...`;

        let result = '';
        const resultEl = document.getElementById('cs-cm-result');
        if (resultEl) resultEl.innerHTML = '<div class="text-dim text-xs">AI 生成脚本中...</div>';

        try {
            await AI.generate(prompt, {}, c => {
                result += c;
                if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none">${typeof marked !== 'undefined' ? marked.parse(result) : result}</div>`;
            });
        } catch(e) {
            UI.toast('生成脚本失败: ' + e.message, 'error');
        }
    },

    async _saveComicScript() {
        const resultEl = document.getElementById('cs-cm-result');
        const content = resultEl ? resultEl.innerText : '';
        if (!content.trim()) return UI.toast('无内容可保存');
        const id = 'cm_' + Utils.uuid();
        await DB.put('library_books', { id, name: '漫剧_' + new Date().toLocaleDateString(), content, size: content.length, date: new Date().toLocaleDateString(), type: 'comic' });
        UI.toast('漫剧脚本已保存到阅读中心');
    }
};
