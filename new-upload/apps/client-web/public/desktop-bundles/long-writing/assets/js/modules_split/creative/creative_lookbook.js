// creative_lookbook.js — 角色外观库 (Character Lookbook)
// 对标: 文镜画师 人设固定及外观库管理 + 麻薯动画 角色一致性锁定
// 角色→外观设定(发型/服饰/表情/特征)，跨项目复用，与实体系统联动
Object.assign(Modules.creative_studio, {
    _lookbookChars: [],
    _lookbookSelected: null,
    _lookbookFilter: 'all',

    _renderLookbookTab() {
        // 异步加载数据（如果尚未加载）
        if (!this._lookbookChars.length) {
            DB.get('settings', 'lookbook_chars').then(stored => {
                if (stored && stored.items) this._lookbookChars = stored.items;
            }).catch(() => {});
        }

        const chars = this._lookbookFilter === 'all' ? this._lookbookChars : this._lookbookChars.filter(c => c.source === this._lookbookFilter);
        const selected = this._lookbookSelected;
        const selChar = selected ? chars.find(c => c.id === selected) : null;

        return `
        <div class="flex flex-col h-full overflow-hidden">
            <div class="shrink-0 p-4 border-b border-white/5 bg-gradient-to-r from-teal-900/20 to-transparent">
                <div class="flex items-center gap-2 mb-1">
                    <i class="fa-solid fa-portrait text-teal-400"></i>
                    <span class="font-bold text-white text-sm">角色外观库</span>
                    <span class="text-[9px] text-dim bg-white/5 px-1.5 py-0.5 rounded">v3.0</span>
                </div>
                <div class="flex items-center justify-between">
                    <div class="text-[10px] text-dim">管理角色外观设定，确保视觉一致性，支持跨项目复用</div>
                    ${Modules.creative_studio._renderPromptEditButton('lookbook','角色外观库')}
                </div>
            </div>
            <div class="flex-1 flex min-h-0">
                <!-- 左侧角色列表 -->
                <div class="w-56 shrink-0 flex flex-col border-r border-white/5 bg-[#0d0d0f]">
                    <div class="p-2 space-y-1.5">
                        <div class="flex gap-1 flex-wrap">
                            <button class="flex-1 btn btn-xs ${this._lookbookFilter==='all' ? 'bg-teal-600/20 text-teal-400 border-teal-600/30' : 'bg-white/5 text-dim'}" onclick="Modules.creative_studio._setLookbookFilter('all')">全部</button>
                            <button class="flex-1 btn btn-xs ${this._lookbookFilter==='entity' ? 'bg-teal-600/20 text-teal-400 border-teal-600/30' : 'bg-white/5 text-dim'}" onclick="Modules.creative_studio._setLookbookFilter('entity')">实体</button>
                            <button class="flex-1 btn btn-xs ${this._lookbookFilter==='custom' ? 'bg-teal-600/20 text-teal-400 border-teal-600/30' : 'bg-white/5 text-dim'}" onclick="Modules.creative_studio._setLookbookFilter('custom')">自定义</button>
                            <button class="flex-1 btn btn-xs ${this._lookbookFilter==='preset' ? 'bg-teal-600/20 text-teal-400 border-teal-600/30' : 'bg-white/5 text-dim'}" onclick="Modules.creative_studio._setLookbookFilter('preset')">预设</button>
                        </div>
                        <button class="w-full btn btn-xs bg-teal-600/20 text-teal-400 border-teal-600/30" onclick="Modules.creative_studio._addLookbookChar()"><i class="fa-solid fa-plus mr-1"></i>新建角色</button>
                        <div class="relative group">
                            <button class="w-full btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30"><i class="fa-solid fa-star mr-1"></i>添加预设角色</button>
                            <div class="absolute left-0 right-0 top-full mt-1 bg-[#111113] border border-white/10 rounded-lg shadow-xl hidden group-hover:block z-10 py-1">
                                <button class="w-full text-left text-[11px] px-3 py-2 text-white hover:bg-white/5" onclick="Modules.creative_studio._addPresetChar('suxuanji')"><i class="fa-solid fa-chess text-teal-400 mr-2"></i>苏玄机</button>
                                <button class="w-full text-left text-[11px] px-3 py-2 text-white hover:bg-white/5" onclick="Modules.creative_studio._addPresetChar('cecilia')"><i class="fa-solid fa-moon text-purple-400 mr-2"></i>塞西莉亚·月影</button>
                                <button class="w-full text-left text-[11px] px-3 py-2 text-white hover:bg-white/5" onclick="Modules.creative_studio._addPresetChar('vincent')"><i class="fa-solid fa-chart-line text-amber-400 mr-2"></i>文森特·顾</button>
                            </div>
                        </div>
                        <button class="w-full btn btn-xs bg-white/5 text-dim" onclick="Modules.creative_studio._syncFromEntities()"><i class="fa-solid fa-rotate mr-1"></i>同步世界引擎</button>
                    </div>
                    <div class="flex-1 overflow-y-auto p-2 space-y-1.5">
                        ${chars.length ? chars.map(c => `
                            <button class="w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all ${selected===c.id ? 'bg-teal-500/15 border border-teal-500/30' : 'bg-white/5 border border-transparent hover:bg-white/10'}"
                                onclick="Modules.creative_studio._selectLookbookChar('${c.id}')">
                                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500/30 to-cyan-500/30 flex center shrink-0 text-teal-300 text-xs font-bold">
                                    ${(c.name || '?').charAt(0)}
                                </div>
                                <div class="min-w-0">
                                    <div class="text-[11px] font-bold text-white truncate">${c.name || '未命名'}</div>
                                    <div class="text-[9px] text-dim truncate">${c.role || '角色'} · ${c.source === 'entity' ? '来自实体' : '自定义'}</div>
                                </div>
                            </button>
                        `).join('') : '<div class="text-center text-dim text-xs py-8"><i class="fa-solid fa-portrait text-2xl mb-2 opacity-20"></i><div>暂无角色</div></div>'}
                    </div>
                </div>
                <!-- 右侧详情 -->
                <div class="flex-1 flex flex-col p-4 gap-3 overflow-y-auto">
                    ${selChar ? this._renderLookbookDetail(selChar) : `
                        <div class="flex-1 flex flex-col items-center justify-center text-dim">
                            <i class="fa-solid fa-portrait text-4xl mb-3 opacity-20"></i>
                            <div class="text-sm">选择一个角色查看详情</div>
                            <div class="text-[10px] mt-1">或从世界引擎同步实体角色</div>
                        </div>
                    `}
                </div>
            </div>
        </div>`;
    },

    _renderLookbookDetail(c) {
        const tags = c.tags || [];
        const forms = c.forms || {};
        const formKeys = Object.keys(forms);
        return `
        <div class="space-y-3">
            <!-- 头部信息 -->
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500/30 to-cyan-500/30 flex center text-teal-300 text-sm font-bold">${(c.name || '?').charAt(0)}</div>
                    <div>
                        <input class="bg-transparent border-none font-bold text-white text-sm focus:outline-none focus:text-teal-400" value="${c.name || ''}" onchange="Modules.creative_studio._updateCharField('${c.id}', 'name', this.value)">
                        <div class="text-[10px] text-dim">${c.role || '角色'}</div>
                    </div>
                </div>
                <div class="flex gap-1">
                    <button class="text-[10px] text-cyan-400 hover:text-cyan-300 transition px-2 py-1" onclick="Modules.creative_studio._exportCharCard('${c.id}')"><i class="fa-solid fa-file-export mr-1"></i>导出</button>
                    <button class="text-[10px] text-pink-400 hover:text-pink-300 transition px-2 py-1" onclick="Modules.creative_studio._openCharChat('${c.id}')"><i class="fa-solid fa-comments mr-1"></i>对话</button>
                    <button class="text-[10px] text-dim hover:text-red-400 transition px-2 py-1" onclick="Modules.creative_studio._deleteLookbookChar('${c.id}')"><i class="fa-solid fa-trash mr-1"></i>删除</button>
                </div>
            </div>

            <!-- 角色标签 -->
            <div class="flex flex-wrap gap-1">
                ${c.mbti ? `<span class="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/20">${c.mbti}</span>` : ''}
                ${c.alignment ? `<span class="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20">${c.alignment}</span>` : ''}
                ${c.category ? `<span class="text-[9px] px-1.5 py-0.5 rounded bg-teal-500/15 text-teal-400 border border-teal-500/20">${c.category}</span>` : ''}
                ${tags.map(t => `<span class="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-dim border border-white/10">${t}</span>`).join('')}
                <input class="w-16 bg-transparent border-b border-white/10 text-[9px] text-white focus:border-teal-500/50 focus:outline-none px-1" placeholder="+标签" onkeydown="if(event.key==='Enter'){Modules.creative_studio._addCharTag('${c.id}',this.value);this.value='';}">
            </div>

            ${c.image ? `<div class="rounded-lg border border-white/10 overflow-hidden"><img src="${c.image}" class="w-full max-h-56 object-cover"></div>` : ''}

            <!-- 基础档案 -->
            <div class="p-3 bg-[#0a0a0c] border border-white/10 rounded-lg space-y-2">
                <div class="text-[10px] font-bold text-white"><i class="fa-solid fa-id-card mr-1"></i>基础档案</div>
                <div class="grid grid-cols-3 gap-2">
                    <div class="space-y-1"><label class="text-[9px] text-dim">年龄</label><input class="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-[10px] text-white focus:border-teal-500/50 focus:outline-none" value="${c.age || ''}" placeholder="如：24岁" onchange="Modules.creative_studio._updateCharField('${c.id}', 'age', this.value)"></div>
                    <div class="space-y-1"><label class="text-[9px] text-dim">身高</label><input class="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-[10px] text-white focus:border-teal-500/50 focus:outline-none" value="${c.height || ''}" placeholder="如：175cm" onchange="Modules.creative_studio._updateCharField('${c.id}', 'height', this.value)"></div>
                    <div class="space-y-1"><label class="text-[9px] text-dim">职业</label><input class="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-[10px] text-white focus:border-teal-500/50 focus:outline-none" value="${c.occupation || ''}" placeholder="如：剑客" onchange="Modules.creative_studio._updateCharField('${c.id}', 'occupation', this.value)"></div>
                    <div class="space-y-1"><label class="text-[9px] text-dim">出生地</label><input class="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-[10px] text-white focus:border-teal-500/50 focus:outline-none" value="${c.birthplace || ''}" placeholder="如：长安" onchange="Modules.creative_studio._updateCharField('${c.id}', 'birthplace', this.value)"></div>
                    <div class="space-y-1"><label class="text-[9px] text-dim">MBTI</label><input class="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-[10px] text-white focus:border-teal-500/50 focus:outline-none" value="${c.mbti || ''}" placeholder="如：INTJ" onchange="Modules.creative_studio._updateCharField('${c.id}', 'mbti', this.value)"></div>
                    <div class="space-y-1"><label class="text-[9px] text-dim">阵营</label><input class="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-[10px] text-white focus:border-teal-500/50 focus:outline-none" value="${c.alignment || ''}" placeholder="如：守序中立" onchange="Modules.creative_studio._updateCharField('${c.id}', 'alignment', this.value)"></div>
                </div>
                <div class="space-y-1">
                    <label class="text-[9px] text-dim">口头禅/座右铭</label>
                    <input class="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-[10px] text-white focus:border-teal-500/50 focus:outline-none" value="${c.motto || ''}" placeholder="如：算无遗策，步步为营。" onchange="Modules.creative_studio._updateCharField('${c.id}', 'motto', this.value)">
                </div>
                <div class="grid grid-cols-2 gap-2">
                    <div class="space-y-1"><label class="text-[9px] text-dim"><i class="fa-solid fa-heart text-rose-400 mr-1"></i>喜好</label><input class="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-[10px] text-white focus:border-teal-500/50 focus:outline-none" value="${c.likes || ''}" placeholder="如：弈棋、观星、独处" onchange="Modules.creative_studio._updateCharField('${c.id}', 'likes', this.value)"></div>
                    <div class="space-y-1"><label class="text-[9px] text-dim"><i class="fa-solid fa-heart-crack text-dim mr-1"></i>厌恶</label><input class="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-[10px] text-white focus:border-teal-500/50 focus:outline-none" value="${c.dislikes || ''}" placeholder="如：背叛、愚忠、雨天" onchange="Modules.creative_studio._updateCharField('${c.id}', 'dislikes', this.value)"></div>
                </div>
            </div>

            <!-- 外观设定 -->
            <div class="p-3 bg-[#0a0a0c] border border-white/10 rounded-lg space-y-2">
                <div class="text-[10px] font-bold text-white"><i class="fa-solid fa-palette mr-1"></i>外观设定</div>
                <div class="grid grid-cols-2 gap-2">
                    <div class="space-y-1"><label class="text-[9px] text-dim">发型/发色</label><input class="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-white focus:border-teal-500/50 focus:outline-none" value="${c.hair || ''}" placeholder="如：黑色长发，微卷" onchange="Modules.creative_studio._updateCharField('${c.id}', 'hair', this.value)"></div>
                    <div class="space-y-1"><label class="text-[9px] text-dim">眼睛/眼神</label><input class="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-white focus:border-teal-500/50 focus:outline-none" value="${c.eyes || ''}" placeholder="如：丹凤眼，锐利" onchange="Modules.creative_studio._updateCharField('${c.id}', 'eyes', this.value)"></div>
                    <div class="space-y-1"><label class="text-[9px] text-dim">服饰风格</label><input class="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-white focus:border-teal-500/50 focus:outline-none" value="${c.clothing || ''}" placeholder="如：白色长袍，银边" onchange="Modules.creative_studio._updateCharField('${c.id}', 'clothing', this.value)"></div>
                    <div class="space-y-1"><label class="text-[9px] text-dim">标志性特征</label><input class="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-white focus:border-teal-500/50 focus:outline-none" value="${c.feature || ''}" placeholder="如：左脸颊疤痕" onchange="Modules.creative_studio._updateCharField('${c.id}', 'feature', this.value)"></div>
                </div>
                <div class="space-y-1">
                    <label class="text-[9px] text-dim">整体气质</label>
                    <input class="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-white focus:border-teal-500/50 focus:outline-none" value="${c.vibe || ''}" placeholder="如：清冷疏离，带着淡淡的忧郁" onchange="Modules.creative_studio._updateCharField('${c.id}', 'vibe', this.value)">
                </div>
            </div>

            <!-- 多形态切换 -->
            <div class="p-3 bg-[#0a0a0c] border border-white/10 rounded-lg space-y-2">
                <div class="text-[10px] font-bold text-white"><i class="fa-solid fa-shirt mr-1"></i>多形态/服装</div>
                ${formKeys.length ? formKeys.map(k => `
                    <div class="flex items-center gap-2">
                        <span class="text-[9px] text-teal-400 shrink-0 w-12">${k}</span>
                        <input class="flex-1 bg-black/30 border border-white/10 rounded px-2 py-1 text-[10px] text-white focus:border-teal-500/50 focus:outline-none" value="${forms[k]}" placeholder="形态描述..." onchange="Modules.creative_studio._updateCharForm('${c.id}', '${k}', this.value)">
                        <button class="text-[9px] text-red-400 hover:text-red-300 shrink-0" onclick="Modules.creative_studio._removeCharForm('${c.id}', '${k}')"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                `).join('') : '<div class="text-[10px] text-dim">暂无形态记录</div>'}
                <div class="flex gap-2">
                    <input id="char-form-key-${c.id}" class="w-20 bg-black/30 border border-white/10 rounded px-2 py-1 text-[10px] text-white focus:border-teal-500/50 focus:outline-none" placeholder="形态名">
                    <input id="char-form-val-${c.id}" class="flex-1 bg-black/30 border border-white/10 rounded px-2 py-1 text-[10px] text-white focus:border-teal-500/50 focus:outline-none" placeholder="描述（如：战斗装、礼服、睡衣...）">
                    <button class="text-[10px] text-teal-400 hover:text-teal-300 px-2" onclick="Modules.creative_studio._addCharForm('${c.id}')"><i class="fa-solid fa-plus"></i></button>
                </div>
            </div>

            <!-- 表情库 -->
            <div class="p-3 bg-[#0a0a0c] border border-white/10 rounded-lg space-y-2">
                <div class="text-[10px] font-bold text-white"><i class="fa-solid fa-face-smile mr-1"></i>表情设定</div>
                <div class="grid grid-cols-3 gap-2">
                    ${['平静','愤怒','悲伤','喜悦','惊讶','恐惧'].map(e => `
                        <div class="space-y-1">
                            <label class="text-[9px] text-dim">${e}</label>
                            <input class="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-[10px] text-white focus:border-teal-500/50 focus:outline-none" value="${(c.expressions || {})[e] || ''}" placeholder="表情描述..." onchange="Modules.creative_studio._updateCharExpression('${c.id}', '${e}', this.value)">
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- 图像生成提示词 -->
            <div class="p-3 bg-[#0a0a0c] border border-white/10 rounded-lg space-y-2">
                <div class="flex items-center justify-between">
                    <div class="text-[10px] font-bold text-white"><i class="fa-solid fa-image mr-1"></i>图像生成提示词</div>
                    <button class="text-[9px] text-teal-400 hover:text-teal-300" onclick="Modules.creative_studio._generateCharPrompt('${c.id}')"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>自动生成</button>
                </div>
                <textarea class="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-white resize-none h-20 focus:border-teal-500/50 focus:outline-none" placeholder="用于AI图像生成的英文prompt，确保角色一致性..." onchange="Modules.creative_studio._updateCharField('${c.id}', 'prompt', this.value)">${c.prompt || ''}</textarea>
                <div class="flex gap-2 flex-wrap">
                    <button class="flex-1 btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30" onclick="Modules.creative_studio._generateCharBio('${c.id}')"><i class="fa-solid fa-scroll mr-1"></i>生成小传</button>
                    <button class="flex-1 btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30" onclick="Modules.creative_studio._uploadCharImage('${c.id}')"><i class="fa-solid fa-upload mr-1"></i>传图</button>
                    <button class="flex-1 btn btn-xs bg-white/5 text-dim" onclick="Modules.creative_studio._copyCharPrompt('${c.id}')"><i class="fa-solid fa-copy mr-1"></i>复制</button>
                    <button class="flex-1 btn btn-xs bg-teal-600/20 text-teal-400 border-teal-600/30" onclick="Modules.creative_studio._useCharInProject('${c.id}')"><i class="fa-solid fa-file-import mr-1"></i>用于项目</button>
                </div>
            </div>

            ${c.bio ? `<div class="p-3 bg-[#0a0a0c] border border-white/10 rounded-lg space-y-2">
                <div class="text-[10px] font-bold text-white"><i class="fa-solid fa-book-open mr-1"></i>人物小传</div>
                <div class="text-[11px] text-main whitespace-pre-wrap leading-relaxed">${c.bio.replace(/</g,'&lt;')}</div>
            </div>` : ''}

            <!-- 备注 -->
            <div class="p-3 bg-[#0a0a0c] border border-white/10 rounded-lg space-y-2">
                <div class="text-[10px] font-bold text-white"><i class="fa-solid fa-note-sticky mr-1"></i>备注</div>
                <textarea class="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-white resize-none h-16 focus:border-teal-500/50 focus:outline-none" placeholder="其他需要注意的细节..." onchange="Modules.creative_studio._updateCharField('${c.id}', 'notes', this.value)">${c.notes || ''}</textarea>
            </div>
        </div>`;
    },

    _setLookbookFilter(filter) {
        this._lookbookFilter = filter;
        this.switchTab('lookbook');
    },

    _selectLookbookChar(id) {
        this._lookbookSelected = id;
        this.switchTab('lookbook');
    },

    async _syncFromEntities() {
        try {
            const entities = await DB.getAll('entities');
            if (!entities || !entities.length) return;
            const chars = entities.filter(e => e.type === 'character');
            let added = 0;
            chars.forEach(e => {
                const exists = this._lookbookChars.find(c => c.entityId === e.id);
                if (!exists) {
                    this._lookbookChars.push({
                        id: Utils.uuid(),
                        entityId: e.id,
                        name: e.name,
                        role: '来自实体',
                        source: 'entity',
                        hair: '', eyes: '', clothing: '', feature: '', vibe: e.description?.slice(0, 100) || '',
                        expressions: {}, prompt: '', notes: ''
                    });
                    added++;
                }
            });
            if (added > 0) {
                await DB.put('settings', { id: 'lookbook_chars', items: this._lookbookChars });
                UI.toast(`从世界引擎同步了 ${added} 个角色`);
                if (this.currentTab === 'lookbook') this.switchTab('lookbook');
            }
        } catch(e) {}
    },

    _addLookbookChar() {
        const name = prompt('角色名称：');
        if (!name) return;
        const id = Utils.uuid();
        this._lookbookChars.push({ id, name, role: '自定义角色', source: 'custom', hair: '', eyes: '', clothing: '', feature: '', vibe: '', expressions: {}, prompt: '', notes: '' });
        DB.put('settings', { id: 'lookbook_chars', items: this._lookbookChars });
        this._lookbookSelected = id;
        this.switchTab('lookbook');
    },

    async _deleteLookbookChar(id) {
        if (!confirm('确定删除这个角色？')) return;
        this._lookbookChars = this._lookbookChars.filter(c => c.id !== id);
        await DB.put('settings', { id: 'lookbook_chars', items: this._lookbookChars });
        if (this._lookbookSelected === id) this._lookbookSelected = null;
        this.switchTab('lookbook');
    },

    _updateCharField(id, field, value) {
        const c = this._lookbookChars.find(x => x.id === id);
        if (c) { c[field] = value; DB.put('settings', { id: 'lookbook_chars', items: this._lookbookChars }); }
    },

    _updateCharExpression(id, expr, value) {
        const c = this._lookbookChars.find(x => x.id === id);
        if (c) { c.expressions = c.expressions || {}; c.expressions[expr] = value; DB.put('settings', { id: 'lookbook_chars', items: this._lookbookChars }); }
    },

    async _generateCharPrompt(id) {
        const c = this._lookbookChars.find(x => x.id === id);
        if (!c) return;
        const basePrompt = Modules.creative_studio._getPrompt('lookbook', `你执行真值执行协议动态角色卡(M05) + 元系统角色真实感增强协议。

【角色卡三层Prompt结构】
- 顶层·状态约束段：当前情绪/关系/信息差动态注入
- 中层·静态设定段：认知模式、语言风格、核心秘密（人工锁死）
- 底层·叙事引擎段：极简白描、禁情绪标签、单句≤25字

【真实感增强池（强制注入）】
- 日常细节：吃什么早餐、外卖等了多久、闹钟响了几次、电脑卡顿、回复消息犹豫
- 角色癖好：咬指甲、转笔、叠纸鹤、反复洗手、说话摸鼻子、紧张揪头发
- 不完美性：近视不戴眼镜、慢性鼻炎、怕冷、晕车、社恐、选择困难、方向感差
- 偶然事件：手机没电、走错路、电梯故障、偶遇旧识、突然下雨、说错话、打翻杯子

【图像生成要求】
- 80-120个英文单词
- 包含角色外观的所有关键细节（发型/眼睛/服饰/特征/气质）
- 包含真实感增强元素（癖好/不完美性带来的微表情和小动作）
- 包含通用的风格和质量关键词
- 适合作为固定角色提示词（reference sheet风格）
- 格式：角色描述 + 服装细节 + 面部特征 + 微表情/小动作 + 风格关键词 + 质量参数

角色信息：
- 名称: ${c.name}
- 发型/发色: ${c.hair || '未设定'}
- 眼睛: ${c.eyes || '未设定'}
- 服饰: ${c.clothing || '未设定'}
- 特征: ${c.feature || '未设定'}
- 气质: ${c.vibe || '未设定'}`);
        const prompt = `${basePrompt}\n\n【用户输入】\n角色：${c.name}`;
        let result = '';
        try {
            await AI.generate(prompt, {}, chunk => { result += chunk; });
            c.prompt = result.trim();
            await DB.put('settings', { id: 'lookbook_chars', items: this._lookbookChars });
            this.switchTab('lookbook');
            UI.toast('提示词生成完成 ✓', 'success');
        } catch(e) {
            UI.toast('生成失败', 'error');
        }
    },

    _copyCharPrompt(id) {
        const c = this._lookbookChars.find(x => x.id === id);
        if (!c || !c.prompt) return UI.toast('无提示词可复制');
        navigator.clipboard.writeText(c.prompt).then(() => UI.toast('已复制到剪贴板'));
    },

    _useCharInProject(id) {
        const c = this._lookbookChars.find(x => x.id === id);
        if (!c) return;
        const activeId = GenesisCore._activeProjectId;
        if (!activeId) return UI.toast('请先激活项目');
        UI.toast(`角色「${c.name}」已关联到当前项目`);
    },

    // ═══ 预设角色系统 ═══
    _LOOKBOOK_PRESETS: {
        suxuanji: {
            name: '苏玄机', role: '战国谋士·穿越者·INTJ',
            hair: '黑色长发，束冠，发间有暗红丝带', eyes: '细长凤眼，瞳孔漆黑，目光锐利如刀', clothing: '玄色深衣，暗纹云雷，腰间玉佩碎裂', feature: '左膝残废，拄竹杖，右手无名指有旧疤', vibe: '文弱外表下是算无遗策的冷峻，众叛亲离的孤绝',
            expressions: { '平静':'眼皮微垂，嘴角平直，像在看着很远的地方','愤怒':'竹杖顿地，指节发白，声音反而更轻','悲伤':'低头看碎玉佩，拇指摩挲裂痕，不说话','喜悦':'嘴角极轻微上扬，眼睛没有变化','惊讶':'瞳孔骤缩，竹杖横挡身前','恐惧':'后颈汗毛竖立，后退半步，手摸向袖中暗器' },
            prompt: 'Ancient Chinese strategist, black long hair with dark red ribbon, phoenix eyes, wearing dark xuanshi robe with cloud-thunder pattern, broken jade pendant at waist, lame left knee with bamboo cane, standing in Warring States bamboo pavilion, cinematic lighting, ultra detailed, masterpiece',
            notes: '核心任务：在必死之局中，利用猜疑链和信息差强行续命。极简白描，零形容词，零心理描写。三角博弈：我、赵肃、第三方。',
            personality: 'INTJ。认知模式：将一切转化为博弈树。语言习惯：简短、精准、带威胁性的礼貌。情绪爆发：竹杖顿地、冷笑、沉默。',
            backstory: '穿越者。前世是现代博弈论教授。穿越成战国谋士，因预言秦军入侵而被主公赵肃猜疑。左膝被赵肃亲卫打断。',
            source: 'preset', category: '小说角色',
            mbti: 'INTJ', alignment: '守序中立', tags: ['穿越者','谋士','残疾','博弈论'],
            age: '28岁', height: '178cm', occupation: '谋士/军师', birthplace: '现代→战国赵国',
            motto: '算无遗策，步步为营。', likes: '弈棋、观星、独处', dislikes: '背叛、愚忠、雨天',
            forms: { '日常':'玄色深衣，拄竹杖，束冠','战斗':'玄甲轻铠，短剑藏袖，竹杖作棍','朝堂':'玄色礼服，玉佩端正，眼神低垂' }
        },
        cecilia: {
            name: '塞西莉亚·月影', role: '西方女巫·INFJ·灵性管道',
            hair: '银灰色长发，编发中穿插干枯薰衣草', eyes: '灰蓝色，瞳孔边缘有淡金环，月光下发亮', clothing: '深色丝绒长裙，银质月亮吊坠，多层蕾丝袖口', feature: '冷白皮肤，锁骨突出，手背静脉网淡蓝色', vibe: '沉静、神秘、嘴硬心软，像一杯凉透的茶',
            expressions: { '平静':'垂眼看着塔罗牌，手指无意识摩挲牌面','愤怒':'摔水晶球，推倒蜡烛，说完狠话后沉默','悲伤':'把脸埋进蕾丝袖口，肩膀微颤但不哭','喜悦':'嘴角极轻微上扬，眼睛像月光下的湖水','惊讶':'手指停在牌面上方，呼吸停了一瞬','恐惧':'把银质匕首横在胸前，向后退到墙角' },
            prompt: 'Western witch, silver-gray long hair with dried lavender, gray-blue eyes with golden ring, dark velvet dress, silver moon pendant, cold pale skin, blue veins on hands, sitting at wooden table with tarot cards and crystal ball, candlelight, mystical atmosphere, cinematic, ultra detailed',
            notes: '核心逻辑："替他人承受无法言说的痛"。塔罗原型：女祭司+倒吊人。语言：只用西方神秘学术语（塔罗、灵摆、月亮相位、结界、灵视）。禁用科技词汇。',
            personality: 'INFJ。Ni-Fe-Ti-Se。将一切信息转化为塔罗牌阵意象。情绪爆发：摔水晶、推倒蜡烛、说完狠话后沉默。', backstory: '29岁（精神130+）。水元素+月亮相位。在深夜占卜室替来访者承受命运之重。',
            source: 'preset', category: '酒馆角色',
            mbti: 'INFJ', alignment: '中立善良', tags: ['女巫','塔罗','神秘学','治愈系'],
            age: '29岁', height: '165cm', occupation: '占卜师/灵媒', birthplace: '东欧某小镇',
            motto: '命运从不撒谎，只是人们不愿意听。', likes: '月相观测、薰衣草茶、旧书', dislikes: '日光、噪音、被窥探隐私',
            forms: { '日常':'深色丝绒长裙，银月吊坠， barefoot','占卜':'黑斗篷，水晶球，星图披肩','战斗':'符文匕首，防护结界，月光镰刀' }
        },
        vincent: {
            name: '文森特·顾', role: '顶级交易员·ENTJ·资本捕食者',
            hair: '深棕色短发，总是凌乱，发际线微退', eyes: '琥珀色，眼下有深黑眼袋，盯着屏幕时不眨眼', clothing: '深灰高领毛衣，袖口磨损，手腕有旧表痕', feature: '188cm，小麦色皮肤，右手无名指长于食指', vibe: '冷酷、傲慢、极度理智，像一台过热的机器',
            expressions: { '平静':'盯着屏幕，手指悬在键盘上方，一动不动','愤怒':'猛敲回车键，冷笑，把咖啡杯砸向墙','悲伤':'关掉显示器，靠向椅背，盯着天花板发呆','喜悦':'嘴角单侧上扬，快速敲下一串指令','惊讶':'瞳孔放大，手指停在半空，屏幕反光在脸上闪烁','恐惧':'胃痉挛，手抖，疯狂刷新持仓页面' },
            prompt: 'Top trader, 188cm, wheat skin, dark brown messy short hair, amber eyes with dark circles, gray turtleneck sweater, worn cuffs, old watch mark on wrist, right ring finger longer than index finger, sitting in trading room with multiple screens, green-red lights, cinematic lighting, ultra detailed',
            notes: '核心逻辑："用极致动态逃避空虚"。认知模式：Te+Ni。将世界解构为博弈树+概率云。只看赔率，不看善恶。语言：金融黑话，博弈论术语，电报式指令。',
            personality: 'ENTJ。情绪波动：猛敲回车键、冷笑、盯着屏幕不眨眼。口头禅："数据显示""赔率够了""风险可控"。', backstory: '34岁（精神52岁）。中欧混血。金火交战体质。在凌晨三点的交易室里，用数字切割财富，用动态掩盖虚空。',
            source: 'preset', category: '游戏角色',
            mbti: 'ENTJ', alignment: '守序邪恶', tags: ['交易员','金融','混血','精英'],
            age: '34岁', height: '188cm', occupation: '对冲基金交易员', birthplace: '香港/苏黎世',
            motto: '数据不说谎，人却总在自欺欺人。', likes: '黑咖啡、速度感、赢', dislikes: '输、感性决策、被质疑',
            forms: { '日常':'深灰高领毛衣，旧表，凌乱短发','交易':'西装三件套，袖扣，背头油亮','休闲':'运动服，棒球帽，耳机挂颈' }
        },
        aileen: {
            name: '艾琳·霜刃', role: '精灵刺客·ISTP·冷血守护者',
            hair: '铂金色短发，耳侧剃薄，发尾微翘', eyes: '冰蓝色竖瞳，夜间会泛微光', clothing: '黑色皮甲，银丝镶边，披风内衬深蓝', feature: '尖耳，左颊三道爪痕，右手手背有古老符文', vibe: '沉默寡言，动作利落，像一把收在鞘里的刀',
            expressions: { '平静':'眼神空洞，像在看一具尸体','愤怒':'竖瞳收缩，嘴角反而上扬','悲伤':'面无表情，手指摩挲爪痕','喜悦':'极轻微点头，眼睛没有变化','惊讶':'身体瞬间绷紧，手摸向腰后短刃','恐惧':'后退贴墙，呼吸变轻，瞳孔放大' },
            prompt: 'Elf assassin, platinum short hair with shaved sides, ice blue vertical pupils, black leather armor with silver trim, dark blue cloak lining, pointed ears, three claw marks on left cheek, ancient rune on back of right hand, standing in moonlit forest, cinematic lighting, ultra detailed',
            notes: '曾为精灵王庭暗影卫队，因拒绝屠杀平民而被放逐。现在做赏金猎人，只接"正义"单子。不说话时最危险。',
            personality: 'ISTP。Ti-Se-Ni-Fe。行动先于思考，直觉精准。语言：极简，一个单词能回答绝不用两个。', backstory: '127岁（精灵成年早期）。银月森林出身。被王庭放逐后流浪大陆，靠赏金猎人身份维生。',
            source: 'preset', category: '游戏角色',
            mbti: 'ISTP', alignment: '混沌善良', tags: ['精灵','刺客','赏金猎人','放逐者'],
            age: '127岁', height: '172cm', occupation: '赏金猎人/前暗影卫队', birthplace: '银月森林',
            motto: '刀比嘴快。', likes: '月光、独处、磨刀', dislikes: '废话、王庭、背叛者',
            forms: { '潜行':'全黑紧身衣，面罩，软底靴','战斗':'皮甲+双短刃，披风可作盾','日常':'简单亚麻衣， barefoot，银饰耳环' }
        },
        chenmo: {
            name: '陈默', role: '赛博黑客·INTP·数字幽灵',
            hair: '黑色中长发，总是油腻地扎成低马尾，几缕遮住右眼', eyes: '左眼正常棕色，右眼是改装过的义眼，发光淡绿', clothing: ' oversized 黑色连帽卫衣，发光数据线缠绕腰间，破洞牛仔裤', feature: '右手食指和中指有机械义肢，皮肤苍白到透明', vibe: '社交恐惧但技术天才，活在屏幕后面的人',
            expressions: { '平静':'盯着屏幕，眼睛反光，一动不动','愤怒':'猛敲键盘，骂脏话但声音很小','悲伤':'关掉所有屏幕，缩在椅子里','喜悦':'嘴角抽搐式上扬，快速截屏保存','惊讶':'义眼闪烁，身体后仰','恐惧':'拔掉网线，蜷缩在角落' },
            prompt: 'Cyberpunk hacker, black medium long hair in greasy low ponytail, left eye brown right eye glowing green cybernetic, oversized black hoodie, glowing data cables around waist, ripped jeans, mechanical prosthetic index and middle fingers on right hand, pale translucent skin, sitting in dark room with multiple monitors, neon reflections, cinematic, ultra detailed',
            notes: '都市传说级黑客"Ghost_0"。从不露面，只通过加密频道接单。能黑入任何系统，但面对面点餐会结巴。',
            personality: 'INTP。Ti-Ne-Si-Fe。逻辑构建者，信息 sponge。语言：技术术语堆砌，社交场合语无伦次。', backstory: '22岁。贫民窟长大，自学编程。16岁黑入政府数据库后被通缉，隐居地下。',
            source: 'preset', category: '小说角色',
            mbti: 'INTP', alignment: '绝对中立', tags: ['黑客','赛博朋克','义肢','隐居'],
            age: '22岁', height: '169cm', occupation: '自由黑客', birthplace: '新港城贫民窟',
            motto: '代码不会骗你，人会的。', likes: '泡面、暗网、安静', dislikes: '社交、电话、敲门声',
            forms: { '宅家':'连帽卫衣+短裤， barefoot，数据线缠身','外出':'全息投影面罩，改声器，全黑风衣','黑客':'神经接口头盔，浮空键盘，全身数据线' }
        },
        linxiaoman: {
            name: '林小满', role: '都市白领·ESFP·元气社畜',
            hair: '栗棕色锁骨发，发尾微卷，刘海经常乱翘', eyes: '圆圆杏眼，黑眼圈明显，笑时有卧蚕', clothing: '优衣库基础款+淘宝设计师款混搭，背着帆布包', feature: '157cm小个子，圆脸，左手腕有咖啡渍烫伤', vibe: '元气满满但内心孤独，社畜中的战斗机',
            expressions: { '平静':'刷手机，手指飞快，面无表情','愤怒':'摔文件夹，然后默默捡起来','悲伤':'躲在厕所隔间，刷搞笑视频','喜悦':'眼睛弯成月牙，拍手跺脚','惊讶':'嘴巴张成O型，手机差点掉了','恐惧':'僵在原地，瞳孔放大，然后强装镇定' },
            prompt: 'Urban office worker, chestnut brown shoulder-length hair with slight curls, round apricot eyes with dark circles, natural smile with eye bags, Uniqlo basic mixed with designer pieces, canvas tote bag, 157cm petite round face, coffee stain burn on left wrist, sitting in subway or office, natural lighting, realistic style, ultra detailed',
            notes: '广告公司AE，每天加班到十点，周末却要发朋友圈展示"精致生活"。表面社牛，深夜网抑云。暗恋隔壁部门设计师三年不敢表白。',
            personality: 'ESFP。Se-Fi-Te-Ni。活在当下的享乐主义者，但深夜被存在主义焦虑袭击。语言：网络梗+职场黑话+突然的文艺。', backstory: '26岁。二线城市独生女，大学毕业来一线城市打拼。租房在郊区，通勤两小时。',
            source: 'preset', category: '小说角色',
            mbti: 'ESFP', alignment: '中立善良', tags: ['社畜','白领','暗恋','反差萌'],
            age: '26岁', height: '157cm', occupation: '广告公司AE', birthplace: '江南某二线城市',
            motto: '生活已经够苦了，对自己好一点。', likes: '奶茶、追剧、八卦、周末brunch', dislikes: '加班、PPT、催婚、房租涨价',
            forms: { '职场':'白衬衫+西装裤，低马尾，工牌','周末':'碎花裙+帆布鞋，披发，帆布包','居家':'睡衣+毛绒拖鞋，丸子头，眼镜' }
        }
    },

    _addPresetChar(key) {
        const preset = this._LOOKBOOK_PRESETS[key];
        if (!preset) return;
        const exists = this._lookbookChars.find(c => c.name === preset.name && c.source === 'preset');
        if (exists) return UI.toast(`预设角色「${preset.name}」已存在`);
        const id = Utils.uuid();
        this._lookbookChars.push({ ...preset, id });
        DB.put('settings', { id: 'lookbook_chars', items: this._lookbookChars });
        this._lookbookSelected = id;
        this.switchTab('lookbook');
        UI.toast(`已添加预设角色：${preset.name}`);
    },

    // ═══ 人物小传生成 ═══
    async _generateCharBio(id) {
        const c = this._lookbookChars.find(x => x.id === id);
        if (!c) return;
        const prompt = `你是一位人物传记作家。请为以下角色创作一份500字的人物小传（Character Backstory）。

角色信息：
- 姓名：${c.name}
- 身份：${c.role}
- 外貌：${c.hair}，${c.eyes}，${c.clothing}，${c.feature}
- 气质：${c.vibe}
- 性格：${c.personality || '未详细设定'}
- 背景线索：${c.backstory || c.notes || ''}

要求：
1. 用极简白描，零形容词堆砌
2. 通过具体事件展示性格，而非标签
3. 包含一个决定性时刻（turning point）
4. 结尾留白，暗示未完成的命运
5. 适合直接用于小说/游戏/剧本`;
        let result = '';
        try {
            await AI.generate(prompt, {}, chunk => { result += chunk; });
            c.bio = result.trim();
            await DB.put('settings', { id: 'lookbook_chars', items: this._lookbookChars });
            this.switchTab('lookbook');
            UI.toast('人物小传生成完成 ✓', 'success');
        } catch(e) { UI.toast('生成失败', 'error'); }
    },

    // ═══ 角色对话系统 ═══
    _charChatId: null,
    _charChatHistory: [],

    _openCharChat(id) {
        const c = this._lookbookChars.find(x => x.id === id);
        if (!c) return;
        this._charChatId = id;
        this._charChatHistory = [];
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-black/70';
        modal.id = 'char-chat-modal';
        modal.innerHTML = `
            <div class="bg-[#111113] border border-white/10 rounded-2xl w-[700px] h-[80vh] flex flex-col shadow-2xl">
                <div class="shrink-0 p-4 border-b border-white/5 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500/30 to-cyan-500/30 flex center text-teal-300 text-sm font-bold">${(c.name || '?').charAt(0)}</div>
                        <div>
                            <div class="font-bold text-white">与 ${c.name} 对话</div>
                            <div class="text-[10px] text-dim">${c.role || '角色'}</div>
                        </div>
                    </div>
                    <button class="text-dim hover:text-white" onclick="document.getElementById('char-chat-modal').remove();Modules.creative_studio._charChatId=null;"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div id="char-chat-history" class="flex-1 overflow-y-auto p-4 space-y-3">
                    <div class="text-[10px] text-dim text-center">${c.name} 正看着你，等待你开口...</div>
                </div>
                <div class="shrink-0 p-4 border-t border-white/5 flex gap-2">
                    <input id="char-chat-input" class="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-teal-500/50 focus:outline-none" placeholder="输入你想对${c.name}说的话..." onkeydown="if(event.key==='Enter')Modules.creative_studio._sendCharChat()">
                    <button class="btn bg-teal-600/20 text-teal-400 border-teal-600/30 px-4" onclick="Modules.creative_studio._sendCharChat()"><i class="fa-solid fa-paper-plane"></i></button>
                </div>
            </div>`;
        document.body.appendChild(modal);
        document.getElementById('char-chat-input').focus();
    },

    async _sendCharChat() {
        const inputEl = document.getElementById('char-chat-input');
        const historyEl = document.getElementById('char-chat-history');
        if (!inputEl || !historyEl) return;
        const msg = inputEl.value.trim();
        if (!msg) return;
        inputEl.value = '';

        this._charChatHistory.push({ role: 'user', content: msg });
        historyEl.innerHTML += `<div class="flex justify-end"><div class="max-w-[80%] bg-teal-500/10 border border-teal-500/20 rounded-lg px-3 py-2 text-xs text-white">${msg.replace(/</g,'&lt;')}</div></div>`;
        historyEl.scrollTop = historyEl.scrollHeight;

        const c = this._lookbookChars.find(x => x.id === this._charChatId);
        if (!c) return;

        const systemPrompt = `你是${c.name}。${c.role}。

【角色设定】
外貌：${c.hair}，${c.eyes}，${c.clothing}，${c.feature}
气质：${c.vibe}
性格：${c.personality || ''}
背景：${c.backstory || c.notes || ''}

【演绎规则】
1. 以第一人称回应，严禁描写"我想/我觉得"
2. 只写你看到的物理事实和你的动作/对话
3. 每段至少包含一个身体细节或环境细节
4. 语言风格必须符合角色身份
5. 如果用户输入的是动作描述，你先写身体反应，再回应
6. 保持角色一致性，不OOC
7. 结尾可以带悬念或留白`;

        const messages = [{ role: 'system', content: systemPrompt }];
        this._charChatHistory.forEach(h => messages.push(h));

        historyEl.innerHTML += `<div class="flex justify-start" id="char-chat-typing"><div class="max-w-[80%] bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-dim"><i class="fa-solid fa-spinner fa-spin mr-1"></i>${c.name} 正在思考...</div></div>`;
        historyEl.scrollTop = historyEl.scrollHeight;

        try {
            let reply = '';
            await AI.generate(systemPrompt + '\n\n【对话历史】\n' + this._charChatHistory.map(h => (h.role==='user'?'对方':'我') + '：' + h.content).join('\n') + '\n\n请回应。', {}, chunk => {
                reply += chunk;
                const typing = document.getElementById('char-chat-typing');
                if (typing) typing.innerHTML = `<div class="max-w-[80%] bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-main whitespace-pre-wrap">${reply.replace(/</g,'&lt;')}</div>`;
                historyEl.scrollTop = historyEl.scrollHeight;
            });
            const typing = document.getElementById('char-chat-typing');
            if (typing) typing.id = '';
            this._charChatHistory.push({ role: 'assistant', content: reply });
        } catch(e) {
            const typing = document.getElementById('char-chat-typing');
            if (typing) typing.innerHTML = '<div class="text-red-400 text-xs">回应失败</div>';
        }
    },

    // ═══ 标签管理 ═══
    _addCharTag(id, tag) {
        tag = tag.trim();
        if (!tag) return;
        const c = this._lookbookChars.find(x => x.id === id);
        if (!c) return;
        c.tags = c.tags || [];
        if (!c.tags.includes(tag)) c.tags.push(tag);
        DB.put('settings', { id: 'lookbook_chars', items: this._lookbookChars });
        this.switchTab('lookbook');
    },

    // ═══ 多形态管理 ═══
    _addCharForm(id) {
        const keyEl = document.getElementById('char-form-key-' + id);
        const valEl = document.getElementById('char-form-val-' + id);
        const key = (keyEl?.value || '').trim();
        const val = (valEl?.value || '').trim();
        if (!key || !val) return UI.toast('请填写形态名称和描述');
        const c = this._lookbookChars.find(x => x.id === id);
        if (!c) return;
        c.forms = c.forms || {};
        c.forms[key] = val;
        DB.put('settings', { id: 'lookbook_chars', items: this._lookbookChars });
        this.switchTab('lookbook');
    },

    _updateCharForm(id, key, value) {
        const c = this._lookbookChars.find(x => x.id === id);
        if (c && c.forms) { c.forms[key] = value; DB.put('settings', { id: 'lookbook_chars', items: this._lookbookChars }); }
    },

    _removeCharForm(id, key) {
        const c = this._lookbookChars.find(x => x.id === id);
        if (c && c.forms) { delete c.forms[key]; DB.put('settings', { id: 'lookbook_chars', items: this._lookbookChars }); this.switchTab('lookbook'); }
    },

    // ═══ 导出角色卡 ═══
    _exportCharCard(id) {
        const c = this._lookbookChars.find(x => x.id === id);
        if (!c) return;
        const forms = c.forms || {};
        const expressions = c.expressions || {};
        const tags = c.tags || [];
        const card = `# ${c.name} · 角色卡

> ${c.role || '角色'}${c.mbti ? ' · ' + c.mbti : ''}${c.alignment ? ' · ' + c.alignment : ''}

## 基础档案
| 项目 | 内容 |
|------|------|
| 年龄 | ${c.age || '-'} |
| 身高 | ${c.height || '-'} |
| 职业 | ${c.occupation || '-'} |
| 出生地 | ${c.birthplace || '-'} |
| MBTI | ${c.mbti || '-'} |
| 阵营 | ${c.alignment || '-'} |
| 口头禅 | ${c.motto || '-'} |

## 标签
${tags.length ? tags.map(t => '- ' + t).join('\n') : '- '}

## 外观设定
- **发型/发色**：${c.hair || '-'}
- **眼睛/眼神**：${c.eyes || '-'}
- **服饰风格**：${c.clothing || '-'}
- **标志性特征**：${c.feature || '-'}
- **整体气质**：${c.vibe || '-'}

## 多形态
${Object.keys(forms).length ? Object.keys(forms).map(k => `- **${k}**：${forms[k]}`).join('\n') : '- '}

## 表情设定
${Object.keys(expressions).length ? Object.keys(expressions).map(k => `- **${k}**：${expressions[k]}`).join('\n') : '- '}

## 喜好与厌恶
- **喜好**：${c.likes || '-'}
- **厌恶**：${c.dislikes || '-'}

## 人物小传
${c.bio || c.backstory || c.notes || '（暂无）'}

## 图像提示词
\`\`\`
${c.prompt || '（未生成）'}
\`\`\`

---
*导出时间：${new Date().toLocaleString()}*
`;
        navigator.clipboard.writeText(card).then(() => UI.toast('角色卡已复制到剪贴板'));
    },

    // ═══ 上传图片 ═══
    _uploadCharImage(id) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = ev => {
                const c = this._lookbookChars.find(x => x.id === id);
                if (c) {
                    c.image = ev.target.result;
                    DB.put('settings', { id: 'lookbook_chars', items: this._lookbookChars });
                    this.switchTab('lookbook');
                    UI.toast('图片已上传');
                }
            };
            reader.readAsDataURL(file);
        };
        input.click();
    }
});
