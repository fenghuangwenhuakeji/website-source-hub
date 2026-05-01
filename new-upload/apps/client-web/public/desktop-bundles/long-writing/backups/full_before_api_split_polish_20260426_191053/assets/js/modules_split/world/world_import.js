Object.assign(Modules.world_engine, {
    _openImportModal() {
        const we = Modules.world_engine;
        we._importModalOpen = true;
        we._importPreview = null;
        we._importParsed = null;
        we._renderImportModal();
    },

    _closeImportModal() {
        const we = Modules.world_engine;
        we._importModalOpen = false;
        const modal = document.getElementById('we-import-modal');
        if(modal) modal.remove();
    },

    _renderImportModal() {
        const we = Modules.world_engine;
        let modal = document.getElementById('we-import-modal');
        if(!modal) {
            modal = document.createElement('div');
            modal.id = 'we-import-modal';
            document.body.appendChild(modal);
        }
        modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm';
        modal.onclick = (e) => { if(e.target === modal) we._closeImportModal(); };
        modal.innerHTML = `
            <div class="bg-[#1a1a2e] rounded-2xl border border-white/10 w-[900px] max-h-[85vh] flex flex-col shadow-2xl">
                <div class="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex center text-white">
                            <i class="fa-solid fa-file-import text-lg"></i>
                        </div>
                        <div>
                            <div class="font-bold text-white text-base">世界观设定导入</div>
                            <div class="text-[10px] text-dim">支持导入并解析结构化世界观设定</div>
                        </div>
                    </div>
                    <button class="btn btn-sm bg-white/5 text-dim hover:text-white" onclick="Modules.world_engine._closeImportModal()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="flex-1 flex min-h-0 overflow-hidden">
                    <div class="w-1/2 flex flex-col border-r border-white/5">
                        <div class="px-4 py-3 border-b border-white/5 shrink-0">
                            <div class="text-[10px] text-blue-400 font-bold uppercase mb-2">导入源</div>
                            <div class="flex gap-2">
                                <label class="btn btn-xs bg-blue-600/20 text-blue-400 border-blue-600/30 flex-1 cursor-pointer text-center">
                                    <i class="fa-solid fa-upload mr-1"></i>选择文件
                                    <input type="file" accept=".txt,.md,.json" class="hidden" onchange="Modules.world_engine._handleImportFile(this)">
                                </label>
                                <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30 flex-1" onclick="Modules.world_engine._pasteFromClipboard()">
                                    <i class="fa-solid fa-paste mr-1"></i>粘贴内容
                                </button>
                            </div>
                        </div>
                        <div class="flex-1 p-4 min-h-0">
                            <textarea id="we-import-source" class="w-full h-full bg-black/30 border border-white/5 rounded-lg p-3 text-xs text-gray-300 resize-none font-mono leading-relaxed" placeholder="在此粘贴或导入世界观设定内容...

支持的格式：
═══════════════════════════════
【历史与传说】
内容...

【地理与地貌】
内容...

【魔法/科技体系】
内容...

【势力与组织】
内容...

【种族与生物】
内容...

【世界规则】
内容...

【文化与习俗】
内容...

═══════════════════════════════
或者实体格式：
[人物] 张三
描述：主角，性格...

[物品] 神剑
描述：一把上古神剑...

[地点] 青云门
描述：修仙门派...
"></textarea>
                        </div>
                        <div class="px-4 py-3 border-t border-white/5 shrink-0">
                            <button class="btn btn-sm bg-amber-600/20 text-amber-400 border-amber-600/30 w-full font-bold" onclick="Modules.world_engine._parseImportContent()">
                                <i class="fa-solid fa-wand-magic-sparkles mr-1"></i>解析设定
                            </button>
                        </div>
                    </div>
                    <div class="w-1/2 flex flex-col">
                        <div class="px-4 py-3 border-b border-white/5 shrink-0">
                            <div class="flex items-center justify-between">
                                <div class="text-[10px] text-green-400 font-bold uppercase">解析结果预览</div>
                                <div id="we-import-stats" class="text-[9px] text-dim"></div>
                            </div>
                        </div>
                        <div class="flex-1 overflow-y-auto p-4" id="we-import-preview">
                            <div class="text-center text-dim text-xs py-8">
                                <i class="fa-solid fa-file-lines text-3xl mb-2 opacity-30"></i>
                                <p>解析结果将显示在这里</p>
                            </div>
                        </div>
                        <div class="px-4 py-3 border-t border-white/5 shrink-0 space-y-2">
                            <div class="flex gap-2">
                                <label class="flex items-center gap-2 text-[10px] text-dim cursor-pointer">
                                    <input type="checkbox" id="we-import-merge" checked class="accent-green-500">
                                    <span>合并到现有设定</span>
                                </label>
                                <label class="flex items-center gap-2 text-[10px] text-dim cursor-pointer">
                                    <input type="checkbox" id="we-import-to-vectors" checked class="accent-cyan-500">
                                    <span>同步到向量库</span>
                                </label>
                            </div>
                            <div class="flex flex-col gap-1">
                                <div class="text-[9px] text-dim font-bold">分配到章节</div>
                                <select id="we-import-chapter" class="text-[10px] bg-white/5 border border-white/10 rounded px-2 py-1 text-dim">
                                    <option value="">不分配</option>
                                    ${(we._chapters||[]).sort((a,b)=>(a.number||0)-(b.number||0)).map(c => `<option value="${c.id}">第${c.number||'?'}章: ${c.title||'未命名'}</option>`).join('')}
                                </select>
                            </div>
                            <div class="flex gap-2">
                                <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30 flex-1 font-bold" onclick="Modules.world_engine._aiParseImportContent()">
                                    <i class="fa-solid fa-brain mr-1"></i>AI智能解析
                                </button>
                            </div>
                            <button class="btn btn-sm bg-green-600/20 text-green-400 border-green-600/30 w-full font-bold" onclick="Modules.world_engine._confirmImport()">
                                <i class="fa-solid fa-check mr-1"></i>确认导入
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
    },

    async _handleImportFile(input) {
        const we = Modules.world_engine;
        const file = input.files[0];
        if(!file) return;
        
        const text = await file.text();
        const sourceEl = document.getElementById('we-import-source');
        if(sourceEl) sourceEl.value = text;
        
        UI.toast(`已加载文件: ${file.name}`);
    },

    async _pasteFromClipboard() {
        const we = Modules.world_engine;
        try {
            const text = await navigator.clipboard.readText();
            const sourceEl = document.getElementById('we-import-source');
            if(sourceEl) sourceEl.value = text;
            UI.toast('已粘贴剪贴板内容');
        } catch(e) {
            UI.toast('无法访问剪贴板');
        }
    },

    async _parseImportContent() {
        const we = Modules.world_engine;
        const sourceEl = document.getElementById('we-import-source');
        if(!sourceEl || !sourceEl.value.trim()) {
            UI.toast('请先输入或导入内容');
            return;
        }
        
        const content = sourceEl.value;
        const parsed = we._parseWorldSetting(content);
        we._importParsed = parsed;
        
        const previewEl = document.getElementById('we-import-preview');
        const statsEl = document.getElementById('we-import-stats');
        
        if(!parsed.worldViews.length && !parsed.entities.length) {
            if(previewEl) previewEl.innerHTML = `
                <div class="text-center text-amber-400 text-xs py-8">
                    <i class="fa-solid fa-exclamation-triangle text-3xl mb-2"></i>
                    <p>未能识别出结构化内容</p>
                    <p class="text-dim mt-1">请检查格式是否符合要求</p>
                </div>`;
            return;
        }
        
        let statsText = [];
        if(parsed.worldViews.length) statsText.push(`世界观: ${parsed.worldViews.length}项`);
        if(parsed.entities.length) statsText.push(`实体: ${parsed.entities.length}个`);
        if(statsEl) statsEl.textContent = statsText.join(' | ');
        
        let html = '';
        
        if(parsed.worldViews.length) {
            html += `<div class="mb-4">
                <div class="text-[10px] text-blue-400 font-bold uppercase mb-2"><i class="fa-solid fa-earth-americas mr-1"></i>世界观设定</div>
                <div class="space-y-2">`;
            parsed.worldViews.forEach(w => {
                html += `<div class="p-2 rounded-lg bg-blue-500/5 border border-blue-500/10">
                    <div class="text-[11px] font-bold text-blue-300 mb-1">${w.label}</div>
                    <div class="text-[10px] text-dim leading-relaxed max-h-20 overflow-hidden">${w.content.slice(0, 200)}${w.content.length > 200 ? '...' : ''}</div>
                </div>`;
            });
            html += `</div></div>`;
        }
        
        if(parsed.entities.length) {
            const typeColors = {
                '人物': 'yellow', '物品': 'blue', '地点': 'green', '情节': 'red',
                '伏笔': 'purple', '势力': 'rose', '种族': 'orange', '魔法': 'indigo',
                '规则': 'sky', '文化': 'pink', '历史': 'amber', '技法': 'teal'
            };
            const grouped = {};
            parsed.entities.forEach(e => {
                const t = e.type || '其他';
                if(!grouped[t]) grouped[t] = [];
                grouped[t].push(e);
            });
            
            html += `<div>
                <div class="text-[10px] text-amber-400 font-bold uppercase mb-2"><i class="fa-solid fa-boxes-stacked mr-1"></i>实体提取</div>
                <div class="space-y-2">`;
            for(const [type, items] of Object.entries(grouped)) {
                const color = typeColors[type] || 'gray';
                html += `<div class="p-2 rounded-lg bg-${color}-500/5 border border-${color}-500/10">
                    <div class="text-[10px] font-bold text-${color}-300 mb-1">${type} (${items.length})</div>
                    <div class="flex flex-wrap gap-1">
                        ${items.map(e => `<span class="px-1.5 py-0.5 rounded text-[9px] bg-white/5 text-gray-300">${e.name}</span>`).join('')}
                    </div>
                </div>`;
            }
            html += `</div></div>`;
        }
        
        if(previewEl) previewEl.innerHTML = html;
        UI.toast('解析完成');
    },

    _parseWorldSetting(content) {
        const we = Modules.world_engine;
        const result = { worldViews: [], entities: [] };
        
        const catPatterns = [
            { id: 'history', patterns: ['历史与传说', '历史', '传说', '历史背景', '历史设定'] },
            { id: 'geography', patterns: ['地理与地貌', '地理', '地貌', '世界地图', '地理设定'] },
            { id: 'magic', patterns: ['魔法/科技体系', '魔法体系', '科技体系', '魔法', '功法体系', '修炼体系'] },
            { id: 'factions', patterns: ['势力与组织', '势力', '组织', '门派', '势力设定'] },
            { id: 'species', patterns: ['种族与生物', '种族', '生物', '种族设定'] },
            { id: 'rules', patterns: ['世界规则', '规则', '法则', '世界法则'] },
            { id: 'culture', patterns: ['文化与习俗', '文化', '习俗', '风俗'] }
        ];
        
        const catLabels = {
            history: '历史与传说', geography: '地理与地貌', magic: '魔法/科技体系',
            factions: '势力与组织', species: '种族与生物', rules: '世界规则', culture: '文化与习俗'
        };
        
        for(const cat of catPatterns) {
            for(const pattern of cat.patterns) {
                const regex = new RegExp(`[【\\[]${pattern}[】\\]][\\s\\S]*?(?=[【\\[](?:${catPatterns.flatMap(c => c.patterns).join('|')})[】\\]]|$)`, 'gi');
                const match = content.match(regex);
                if(match) {
                    let text = match[0].replace(new RegExp(`[【\\[]${pattern}[】\\]]`, 'i'), '').trim();
                    if(text && text.length > 10) {
                        result.worldViews.push({
                            id: cat.id,
                            label: catLabels[cat.id],
                            content: text
                        });
                        break;
                    }
                }
            }
        }
        
        const entityPatterns = [
            { type: '人物', patterns: ['人物', '角色', '人物设定', '角色设定'] },
            { type: '物品', patterns: ['物品', '道具', '装备', '物品设定'] },
            { type: '地点', patterns: ['地点', '场景', '地点设定', '场景设定'] },
            { type: '情节', patterns: ['情节', '剧情', '情节设定'] },
            { type: '伏笔', patterns: ['伏笔', '伏笔设定'] },
            { type: '势力', patterns: ['势力', '组织', '门派'] },
            { type: '种族', patterns: ['种族', '种族设定'] },
            { type: '魔法', patterns: ['魔法', '功法', '技能', '法术'] },
            { type: '规则', patterns: ['规则', '法则'] },
            { type: '文化', patterns: ['文化', '习俗'] },
            { type: '历史', patterns: ['历史事件', '历史记录'] },
            { type: '技法', patterns: ['技法', '写作技法'] }
        ];
        
        const entityRegex = /(?:^|\n)[【\[]?([^\n【\】\[\]]+)[】\]]?\s*[\n:：]\s*([\s\S]*?)(?=(?:^|\n)[【\[]?[^\n【\】\[\]]+[】\]]?\s*[\n:：]|$)/g;
        let entityMatch;
        while((entityMatch = entityRegex.exec(content)) !== null) {
            const name = entityMatch[1].trim();
            const desc = entityMatch[2].trim();
            
            if(name.length > 20 || desc.length < 5) continue;
            
            let type = '其他';
            for(const ep of entityPatterns) {
                for(const p of ep.patterns) {
                    if(name.includes(p) || content.slice(entityMatch.index - 50, entityMatch.index).includes(p)) {
                        type = ep.type;
                        break;
                    }
                }
                if(type !== '其他') break;
            }
            
            if(desc.length > 10) {
                result.entities.push({
                    id: Utils.uuid(),
                    name: name.replace(/^[【\[]?([^】\]]+)[】\]]?$/, '$1'),
                    type,
                    desc,
                    relations: [],
                    source: 'import',
                    createdAt: Date.now()
                });
            }
        }
        
        const simpleEntityRegex = /(?:^|\n)\[([^\]]+)\]\s*([^\n]+)/g;
        let simpleMatch;
        while((simpleMatch = simpleEntityRegex.exec(content)) !== null) {
            const typeStr = simpleMatch[1].trim();
            const rest = simpleMatch[2].trim();
            
            let type = '其他';
            for(const ep of entityPatterns) {
                if(ep.patterns.some(p => typeStr.includes(p))) {
                    type = ep.type;
                    break;
                }
            }
            
            const nameDesc = rest.split(/[:：]/);
            const name = nameDesc[0].trim();
            const desc = nameDesc.slice(1).join(':').trim() || rest;
            
            if(name.length > 0 && name.length < 30 && !result.entities.find(e => e.name === name)) {
                result.entities.push({
                    id: Utils.uuid(),
                    name,
                    type,
                    desc,
                    relations: [],
                    source: 'import',
                    createdAt: Date.now()
                });
            }
        }
        
        return result;
    },

    async _confirmImport() {
        const we = Modules.world_engine;
        if(!we._importParsed || (!we._importParsed.worldViews.length && !we._importParsed.entities.length)) {
            UI.toast('没有可导入的内容');
            return;
        }
        
        const mergeEl = document.getElementById('we-import-merge');
        const toVectorsEl = document.getElementById('we-import-to-vectors');
        const chapterEl = document.getElementById('we-import-chapter');
        const shouldMerge = mergeEl ? mergeEl.checked : true;
        const toVectors = toVectorsEl ? toVectorsEl.checked : true;
        const assignChapter = chapterEl ? chapterEl.value : '';
        
        await we._ensureCache();
        
        let worldCount = 0;
        let entityCount = 0;
        
        for(const wv of we._importParsed.worldViews) {
            const existingId = `world_${wv.id}`;
            if(shouldMerge) {
                const existing = we._cachedEntities.find(e => e.id === existingId);
                if(existing) {
                    existing.desc = (existing.desc || '') + '\n\n' + wv.content;
                    existing.updatedAt = Date.now();
                    await DB.put('entities', existing);
                    worldCount++;
                    continue;
                }
            }
            
            const worldEntity = {
                id: existingId,
                name: wv.label,
                type: '世界观',
                desc: wv.content,
                relations: [],
                chapters: assignChapter ? [assignChapter] : [],
                source: 'import',
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            we._cachedEntities.push(worldEntity);
            await DB.put('entities', worldEntity);
            worldCount++;
        }
        
        for(const ent of we._importParsed.entities) {
            if(shouldMerge) {
                const existing = we._cachedEntities.find(e => e.name === ent.name && !e.id.startsWith('world_'));
                if(existing) {
                    existing.desc = (existing.desc || '') + '\n\n' + ent.desc;
                    existing.updatedAt = Date.now();
                    if(assignChapter) {
                        if(!existing.chapters) existing.chapters = [];
                        if(!existing.chapters.includes(assignChapter)) existing.chapters.push(assignChapter);
                    }
                    await DB.put('entities', existing);
                    entityCount++;
                    continue;
                }
            }
            
            if(assignChapter) {
                ent.chapters = [assignChapter];
            }
            we._cachedEntities.push(ent);
            await DB.put('entities', ent);
            entityCount++;
        }
        
        if(toVectors && typeof Modules.rag !== 'undefined') {
            for(const ent of we._importParsed.entities) {
                try {
                    await Modules.rag.addVector(ent.name + ': ' + ent.desc, { type: ent.type, source: 'world_import' });
                } catch(e) {}
            }
        }
        
        we._closeImportModal();
        we._refreshEntities();
        
        UI.toast(`导入完成: ${worldCount}项世界观, ${entityCount}个实体` + (assignChapter ? ' (已分配章节)' : ''));
    },

    async _aiParseImportContent() {
        const we = Modules.world_engine;
        const sourceEl = document.getElementById('we-import-source');
        if(!sourceEl || !sourceEl.value.trim()) {
            UI.toast('请先输入或导入内容');
            return;
        }
        
        const content = sourceEl.value;
        const btn = document.querySelector('button[onclick*="_aiParseImportContent"]');
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i>解析中...'; }
        
        try {
            await we._ensureCache();
            const existingEntities = (we._cachedEntities || []).filter(e => !e.id.startsWith('world_'));
            const existingNames = existingEntities.map(e => e.name);
            
            const prompt = `你是一个专业的小说世界观解析引擎。请从以下内容中提取结构化的世界观设定和实体。

【原始内容】
${content.slice(0, 8000)}

【已有实体库（请尽可能匹配这些名称建立关联）】
${existingNames.join('、') || '无'}

【提取要求】
请提取以下内容：

1. 世界观设定（7个维度）：
   - history (历史与传说)
   - geography (地理与地貌)
   - magic (魔法/科技体系)
   - factions (势力与组织)
   - species (种族与生物)
   - rules (世界规则)
   - culture (文化与习俗)

2. 实体（12种类型）：
   - 人物、物品、地点、情节、伏笔、势力、种族、魔法、规则、文化、历史、技法

【输出格式】严格JSON：
{
  "worldViews": [
    {"id": "history", "label": "历史与传说", "content": "详细内容..."}
  ],
  "entities": [
    {"name": "实体名", "type": "类型", "desc": "详细描述(100-300字)", "relations": ["关系类型:关联实体名"]}
  ]
}

【关键要求】
- 每个实体的relations必须尽可能多地引用其他实体名称
- 关系类型例如：师父、徒弟、敌对、盟友、所属、位于、拥有、使用等
- 直接输出JSON，不要包裹markdown代码块`;

            UI.toast('AI智能解析中...');
            let fullRes = '';
            await AI.generate(prompt, {}, c => { fullRes += c; });
            
            let parsed = null;
            try {
                let cleanRes = fullRes.trim();
                cleanRes = cleanRes.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '').trim();
                const s = cleanRes.indexOf('{');
                const e = cleanRes.lastIndexOf('}');
                if(s !== -1 && e > s) {
                    parsed = JSON.parse(cleanRes.slice(s, e + 1));
                }
            } catch(e) {
                UI.toast('AI解析失败，请检查内容格式', 'error');
                return;
            }
            
            if(!parsed || (!parsed.worldViews?.length && !parsed.entities?.length)) {
                UI.toast('未能解析出有效内容', 'warning');
                return;
            }
        
            // 标准化数据
            const result = {
                worldViews: (parsed.worldViews || []).map(w => ({
                    id: w.id || 'other',
                    label: w.label || w.id || '其他',
                    content: w.content || ''
                })),
                entities: (parsed.entities || []).map(e => ({
                    id: Utils.uuid(),
                    name: e.name || '',
                    type: e.type || '其他',
                    desc: e.desc || e.description || '',
                    relations: e.relations || [],
                    source: 'import',
                    createdAt: Date.now()
                }))
            };
            
            we._importParsed = result;
            
            const previewEl = document.getElementById('we-import-preview');
            const statsEl = document.getElementById('we-import-stats');
            
            let statsText = [];
            if(result.worldViews.length) statsText.push(`世界观: ${result.worldViews.length}项`);
            if(result.entities.length) statsText.push(`实体: ${result.entities.length}个`);
            if(statsEl) statsEl.textContent = statsText.join(' | ');
            
            let html = '';
            
            if(result.worldViews.length) {
                html += `<div class="mb-4">
                    <div class="text-[10px] text-blue-400 font-bold uppercase mb-2"><i class="fa-solid fa-earth-americas mr-1"></i>世界观设定</div>
                    <div class="space-y-2">`;
                result.worldViews.forEach(w => {
                    html += `<div class="p-2 rounded-lg bg-blue-500/5 border border-blue-500/10">
                        <div class="text-[11px] font-bold text-blue-300 mb-1">${w.label}</div>
                        <div class="text-[10px] text-dim leading-relaxed max-h-20 overflow-hidden">${w.content.slice(0, 200)}${w.content.length > 200 ? '...' : ''}</div>
                    </div>`;
                });
                html += `</div></div>`;
            }
            
            if(result.entities.length) {
                const typeColors = {
                    '人物': 'yellow', '物品': 'blue', '地点': 'green', '情节': 'red',
                    '伏笔': 'purple', '势力': 'rose', '种族': 'orange', '魔法': 'indigo',
                    '规则': 'sky', '文化': 'pink', '历史': 'amber', '技法': 'teal'
                };
                const grouped = {};
                result.entities.forEach(e => {
                    const t = e.type || '其他';
                    if(!grouped[t]) grouped[t] = [];
                    grouped[t].push(e);
                });
                
                html += `<div>
                    <div class="text-[10px] text-amber-400 font-bold uppercase mb-2"><i class="fa-solid fa-boxes-stacked mr-1"></i>实体提取</div>
                    <div class="space-y-2">`;
                for(const [type, items] of Object.entries(grouped)) {
                    const color = typeColors[type] || 'gray';
                    html += `<div class="p-2 rounded-lg bg-${color}-500/5 border border-${color}-500/10">
                        <div class="text-[10px] font-bold text-${color}-300 mb-1">${type} (${items.length})</div>
                        <div class="flex flex-wrap gap-1">
                            ${items.map(e => `<span class="px-1.5 py-0.5 rounded text-[9px] bg-white/5 text-gray-300">${e.name}</span>`).join('')}
                        </div>
                    </div>`;
                }
                html += `</div></div>`;
            }
            
            if(previewEl) previewEl.innerHTML = html;
            UI.toast('AI智能解析完成');
        } catch(e) {
            console.error('[WorldImport] AI parse error:', e);
            UI.toast('AI解析失败: ' + (e.message || '未知错误'), 'error');
        } finally {
            if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-brain mr-1"></i>AI智能解析'; }
        }
    },

    // ═══════════════════════════════════════════════════════════════
    //  作品导入中心 — 外部已有小说导入 + 双向同步桥
    // ═══════════════════════════════════════════════════════════════

});
