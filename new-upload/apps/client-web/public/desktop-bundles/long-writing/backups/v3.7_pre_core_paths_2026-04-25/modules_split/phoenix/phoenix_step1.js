Object.assign(Modules.phoenix, {
    _renderStep1() {
        const extracted = this.data._extractedEntities || [];
        return `
            <div class="flex-1 flex flex-col min-h-0 animate-fade-in">
                <div class="h-11 flex items-center justify-between px-5 bg-[#0d0d0f] border-b border-white/5 shrink-0">
                    <span class="text-xs font-bold text-white">第二步：大纲编织 & 实体提取</span>
                    <div class="flex gap-2 items-center">
                        <span class="text-[10px] text-dim">支持 Markdown</span>
                        <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30" onclick="Modules.phoenix.importWorldSetting()" id="ph-btn-import-world"><i class="fa-solid fa-earth-americas mr-1"></i>导入世界观</button>
                        <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30" onclick="Modules.phoenix._extractEntitiesFromOutline()" id="ph-btn-extract-ent"><i class="fa-solid fa-boxes-stacked mr-1"></i>提取实体</button>
                        <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30" onclick="Modules.phoenix.fusionRefine()" id="ph-btn-fusion"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>融合润色</button>
                        <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30" onclick="Modules.phoenix.aiPolishOutline()" id="ph-btn-ai-polish"><i class="fa-solid fa-gem mr-1"></i>AI润色</button>
                    </div>
                </div>
                <div class="flex-1 flex min-h-0">
                    <div class="flex-1 flex flex-col border-r border-white/5 min-w-0">
                        <div class="px-4 py-2 text-[10px] text-accent font-bold uppercase bg-black/20 border-b border-white/5 shrink-0 flex items-center justify-between">
                            <span>源码编辑</span>
                            <span class="text-dim font-mono">${(this.data.outlineRaw||'').length} 字 · ${((this.data.outlineRaw||'').match(/###/g)||[]).length} 章</span>
                        </div>
                        <textarea class="flex-1 bg-transparent border-none p-5 font-mono text-sm resize-none text-gray-300 leading-relaxed focus:outline-none" id="ph-outline-edit" oninput="Modules.phoenix.updatePreview()">${this.data.outlineRaw || ''}</textarea>
                    </div>
                    <!-- 中间: 结构预览 -->
                    <div class="flex-1 flex flex-col border-r border-white/5 min-w-0">
                        <div class="px-4 py-2 text-[10px] text-accent font-bold uppercase bg-black/20 border-b border-white/5 shrink-0">结构预览</div>
                        <div class="flex-1 p-5 overflow-y-auto text-sm text-dim font-serif whitespace-pre-wrap leading-loose" id="ph-outline-preview">${this.data.outlineRaw || '<span class="opacity-30">等待内容...</span>'}</div>
                    </div>
                    <!-- 右侧: 实体提取结果 -->
                    <div class="w-64 shrink-0 flex flex-col bg-[#0a0a0c] border-l border-white/5">
                        <div class="px-4 py-2 text-[10px] text-green-400 font-bold uppercase bg-black/20 border-b border-white/5 shrink-0 flex items-center justify-between">
                            <span><i class="fa-solid fa-boxes-stacked mr-1"></i>提取实体</span>
                            <span class="text-dim" id="ph-ent-count">${extracted.length}</span>
                        </div>
                        <div class="flex-1 overflow-y-auto p-3 space-y-2" id="ph-extracted-entities">
                            ${extracted.length > 0 ? extracted.map(e => `
                                <div class="p-2 bg-black/20 rounded border border-white/5 text-[10px]">
                                    <div class="font-bold text-white flex items-center gap-1">
                                        <span class="text-[8px] px-1 rounded ${e.type==='人物'?'bg-cyan-500/20 text-cyan-300':e.type==='地点'?'bg-green-500/20 text-green-300':e.type==='势力'?'bg-amber-500/20 text-amber-300':'bg-purple-500/20 text-purple-300'}">${e.type}</span>
                                        ${e.name}
                                    </div>
                                    <div class="text-dim leading-relaxed mt-1 line-clamp-2">${(e.desc||'').slice(0,60)}</div>
                                </div>
                            `).join('') : `
                                <div class="text-center text-dim text-xs py-8">
                                    <i class="fa-solid fa-boxes-stacked text-2xl mb-2 opacity-30"></i>
                                    <div>暂无提取结果</div>
                                    <div class="text-[10px] mt-1">点击「提取实体」从细纲中自动识别</div>
                                </div>
                            `}
                        </div>
                        <div class="p-3 border-t border-white/5 space-y-2 shrink-0">
                            <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30 w-full ${extracted.length===0?'opacity-50 pointer-events-none':''}" onclick="Modules.phoenix._injectExtractedEntities()" id="ph-inject-entities-btn">
                                <i class="fa-solid fa-atom mr-1"></i>注入世界引擎
                            </button>
                            <button class="btn btn-xs bg-white/5 text-dim w-full" onclick="Modules.phoenix._clearExtractedEntities()">
                                <i class="fa-solid fa-trash mr-1"></i>清空提取结果
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
    },

    // ===== 从细纲提取实体 =====
    async _extractEntitiesFromOutline() {
        if (this._generating) return UI.toast('正在生成中，请稍候');
        const outline = (document.getElementById('ph-outline-edit') || {}).value || this.data.outlineRaw || '';
        if (!outline.trim()) return UI.toast('细纲内容为空', 'error');

        UI.toast('正在从细纲中提取实体...');
        this._setGenerating(true);
        const prompt = `你是一位专业的网文实体提取引擎。请从以下小说细纲中提取所有关键实体。

【细纲内容】
${outline.slice(0, 8000)}

【提取要求】
请提取以下类型的实体：
1. 人物 - 角色名、身份、性格特点、能力
2. 地点 - 场景、城市、秘境、地标
3. 势力 - 门派、组织、阵营、国家
4. 物品 - 武器、法宝、道具、关键物件
5. 功法/技能 - 修炼体系、招式、能力
6. 种族/生物 - 特殊种族、妖兽、灵兽

【输出格式】严格JSON数组：
[
  {"name":"实体名","type":"人物|地点|势力|物品|功法|种族","desc":"一句话描述"},
  ...
]

注意：
- 只输出JSON数组，不要包裹markdown代码块
- 确保每个实体都有name、type、desc三个字段
- type必须是上述6种之一
- 不要遗漏重要实体`;

        let fullRes = '';
        try {
            await AI.generate(prompt, {}, c => { fullRes += c; });
        } catch(e) {
            UI.toast('提取失败: ' + e.message, 'error');
            this._setGenerating(false);
            return;
        }

        let parsed = null;
        try {
            let cleanRes = fullRes.trim().replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '').trim();
            parsed = JSON.parse(cleanRes);
        } catch(e) {
            const m = fullRes.match(/\[[\s\S]*\]/);
            if(m) { try { parsed = JSON.parse(m[0]); } catch(e2) {} }
        }

        if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
            UI.toast('未提取到实体，请检查细纲内容');
            this._setGenerating(false);
            return;
        }

        // 去重
        const seen = new Set();
        const unique = [];
        for (const ent of parsed) {
            if (!ent.name || seen.has(ent.name)) continue;
            seen.add(ent.name);
            unique.push({
                name: ent.name,
                type: ['人物','地点','势力','物品','功法','种族'].includes(ent.type) ? ent.type : '其他',
                desc: ent.desc || ent.description || ''
            });
        }

        this.data._extractedEntities = unique;
        UI.toast(`提取完成！发现 ${unique.length} 个实体`);
        this._setGenerating(false);
        this.refresh();
    },

    async _injectExtractedEntities() {
        const entities = this.data._extractedEntities || [];
        if (entities.length === 0) return UI.toast('没有可注入的实体', 'error');

        const now = Date.now();
        let count = 0;
        for (const ent of entities) {
            const id = 'phoenix_ent_' + ent.name.slice(0, 20) + '_' + now;
            await DB.put('entities', {
                id,
                name: ent.name,
                type: ent.type,
                desc: ent.desc,
                source: 'phoenix_extract',
                updatedAt: now
            });
            // 同时存入向量库
            try {
                await DB.put('vectors', {
                    id,
                    content: `[${ent.type}] ${ent.name}: ${ent.desc}`,
                    vector: Array.from({length: 1536}, () => Math.random()),
                    timestamp: now
                });
            } catch(e) {}
            count++;
        }

        // 刷新世界引擎缓存
        if (Modules.world_engine) {
            Modules.world_engine._cachedEntities = null;
        }

        UI.toast(`已注入 ${count} 个实体到世界引擎`);
    },

    _clearExtractedEntities() {
        this.data._extractedEntities = [];
        this.refresh();
        UI.toast('已清空提取结果');
    },

    async _autoShowExtractedEntities() {
        // 进入step 2时，如果有已提取的实体就显示数量
        const extracted = this.data._extractedEntities || [];
        const el = document.getElementById('ph-finish-entities');
        if (el) el.textContent = extracted.length > 0 ? extracted.length + ' 个已提取' : '—';
    },

    _renderStepWorldImport() {
        const worldData = this.data.importedWorld || {};
        return `
            <div class="flex-1 flex flex-col min-h-0 animate-fade-in">
                <div class="h-11 flex items-center justify-between px-5 bg-[#0d0d0f] border-b border-white/5 shrink-0">
                    <span class="text-xs font-bold text-white">第三步：世界观导入与解析</span>
                    <div class="flex gap-2 items-center">
                        <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30" onclick="Modules.phoenix._openWorldImportModal()"><i class="fa-solid fa-file-import mr-1"></i>导入世界观文件</button>
                        <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30" onclick="Modules.phoenix._importFromClipboard()"><i class="fa-solid fa-clipboard mr-1"></i>从剪贴板导入</button>
                        <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30" onclick="Modules.phoenix._parseWorldWithAI()" id="ph-parse-btn"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>AI智能解析</button>
                    </div>
                </div>
                <!-- AI解析进度区域 -->
                <div id="ph-parse-progress" class="hidden bg-gradient-to-r from-amber-900/20 to-orange-900/20 border-b border-amber-500/20 px-5 py-3 shrink-0">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-spinner fa-spin text-amber-400"></i>
                            <span id="ph-parse-label" class="text-[11px] font-bold text-amber-400">AI智能解析中...</span>
                        </div>
                        <button id="ph-parse-stop" class="btn btn-xs bg-red-600/30 text-red-400 border-red-500/30 hover:bg-red-600 hover:text-white" onclick="Modules.phoenix._stopParse()"><i class="fa-solid fa-stop mr-1"></i>停止</button>
                    </div>
                    <div class="w-full h-1.5 bg-black/30 rounded-full overflow-hidden">
                        <div id="ph-parse-bar" class="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300" style="width: 30%"></div>
                    </div>
                    <div id="ph-parse-status" class="text-[10px] text-amber-300/70 mt-1">正在分析文本结构...</div>
                </div>
                <div class="flex-1 flex min-h-0">
                    <!-- 左侧: 世界观维度面板 -->
                    <div class="w-72 shrink-0 flex flex-col border-r border-white/5 bg-[#0a0a0c]">
                        <div class="px-4 py-2 text-[10px] text-cyan-400 font-bold uppercase bg-black/20 border-b border-white/5 shrink-0">
                            <i class="fa-solid fa-layer-group mr-1"></i>世界观维度
                        </div>
                        <div class="flex-1 overflow-y-auto p-3 space-y-2" id="ph-world-dimensions">
                            ${this._renderWorldDimensions(worldData)}
                        </div>
                        <div class="p-3 border-t border-white/5 space-y-2 shrink-0">
                            <div class="text-[9px] text-dim text-center">已导入: ${(worldData.entities||[]).length} 实体 · ${Object.keys(worldData.worldview||{}).length} 维度</div>
                            <div class="grid grid-cols-2 gap-2">
                                <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30 w-full" onclick="Modules.phoenix._injectToEntities()"><i class="fa-solid fa-boxes-stacked mr-1"></i>注入实体</button>
                                <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30 w-full" onclick="Modules.phoenix._injectToKnowledgeGraph()"><i class="fa-solid fa-circle-nodes mr-1"></i>注入知识图谱</button>
                            </div>
                            <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30 w-full" onclick="Modules.phoenix._syncToWorldEngine()"><i class="fa-solid fa-atom mr-1"></i>同步到世界引擎</button>
                            <div class="border-t border-white/5 pt-2 mt-2">
                                <div class="text-[9px] text-dim font-bold mb-1.5"><i class="fa-solid fa-filter mr-1"></i>按章节提取实体</div>
                                <div class="flex gap-1">
                                    <input type="number" class="input bg-black/30 border-white/10 h-7 text-[10px] w-16" id="ph-extract-ch-start" placeholder="起始章" min="1">
                                    <span class="text-dim text-[10px] leading-7">-</span>
                                    <input type="number" class="input bg-black/30 border-white/10 h-7 text-[10px] w-16" id="ph-extract-ch-end" placeholder="结束章" min="1">
                                </div>
                                <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30 w-full mt-1.5" onclick="Modules.phoenix._extractEntitiesByChapter()"><i class="fa-solid fa-magnifying-glass mr-1"></i>提取章节实体</button>
                            </div>
                            <div class="border-t border-white/5 pt-2 mt-2">
                                <div class="text-[9px] text-dim font-bold mb-1.5"><i class="fa-solid fa-book mr-1"></i>按卷提取实体</div>
                                <select class="input bg-black/30 border-white/10 h-7 text-[10px] w-full" id="ph-extract-volume">
                                    <option value="">选择卷...</option>
                                    <option value="1-20">第一卷 (1-20章)</option>
                                    <option value="21-40">第二卷 (21-40章)</option>
                                    <option value="41-60">第三卷 (41-60章)</option>
                                    <option value="61-80">第四卷 (61-80章)</option>
                                    <option value="81-100">第五卷 (81-100章)</option>
                                    <option value="custom">自定义范围</option>
                                </select>
                                <button class="btn btn-xs bg-indigo-600/20 text-indigo-400 border-indigo-600/30 w-full mt-1.5" onclick="Modules.phoenix._extractEntitiesByVolume()"><i class="fa-solid fa-layer-group mr-1"></i>提取卷实体</button>
                            </div>
                        </div>
                    </div>
                    <!-- 中间: 原始内容编辑 -->
                    <div class="flex-1 flex flex-col border-r border-white/5 min-w-0">
                        <div class="px-4 py-2 text-[10px] text-accent font-bold uppercase bg-black/20 border-b border-white/5 shrink-0 flex items-center justify-between">
                            <span><i class="fa-solid fa-file-lines mr-1"></i>原始内容</span>
                            <span class="text-dim font-mono" id="ph-raw-stats">${(worldData.rawContent||'').length} 字</span>
                        </div>
                        <textarea class="flex-1 bg-transparent border-none p-4 font-mono text-sm resize-none text-gray-300 leading-relaxed focus:outline-none" id="ph-world-raw" placeholder="粘贴或导入世界观设定内容，支持自由文本、Markdown、JSON格式...">${worldData.rawContent || ''}</textarea>
                    </div>
                    <!-- 右侧: 解析结果预览 -->
                    <div class="w-96 shrink-0 flex flex-col min-w-0">
                        <div class="px-4 py-2 text-[10px] text-green-400 font-bold uppercase bg-black/20 border-b border-white/5 shrink-0 flex items-center justify-between">
                            <span><i class="fa-solid fa-sparkles mr-1"></i>解析结果</span>
                            <div class="flex gap-1">
                                <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.phoenix._copyParsedResult()"><i class="fa-solid fa-copy"></i></button>
                                <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.phoenix._clearParsedResult()"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </div>
                        <div class="flex-1 overflow-y-auto p-4" id="ph-world-parsed">
                            ${this._renderParsedWorld(worldData)}
                        </div>
                        <div class="p-3 border-t border-white/5 space-y-2 shrink-0">
                            <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30 w-full" onclick="Modules.phoenix._mergeToOutline()"><i class="fa-solid fa-code-merge mr-1"></i>合并到大纲</button>
                            <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30 w-full" onclick="Modules.phoenix._injectToVectorDB()"><i class="fa-solid fa-database mr-1"></i>存入向量库</button>
                        </div>
                    </div>
                </div>
            </div>`;
    },

    _renderWorldDimensions(worldData) {
        const dimensions = [
            { key: 'history', label: '历史与传说', icon: 'fa-scroll' },
            { key: 'geography', label: '地理与地貌', icon: 'fa-mountain' },
            { key: 'magic', label: '魔法/科技体系', icon: 'fa-hat-wizard' },
            { key: 'factions', label: '势力与组织', icon: 'fa-users' },
            { key: 'species', label: '种族与生物', icon: 'fa-dragon' },
            { key: 'rules', label: '世界规则', icon: 'fa-scale-balanced' },
            { key: 'culture', label: '文化与习俗', icon: 'fa-masks-theater' }
        ];
        const worldview = worldData.worldview || {};
        return dimensions.map(d => {
            const content = worldview[d.key] || '';
            const hasContent = content.trim().length > 0;
            return `
                <div class="p-2 rounded-lg border transition-all cursor-pointer ${hasContent ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-white/3 border-transparent hover:border-white/10'}" onclick="Modules.phoenix._editDimension('${d.key}')">
                    <div class="flex items-center gap-2 mb-1">
                        <i class="fa-solid ${d.icon} w-4 text-center text-[10px] ${hasContent ? 'text-cyan-400' : 'text-dim'}"></i>
                        <span class="text-[10px] font-bold ${hasContent ? 'text-white' : 'text-dim'}">${d.label}</span>
                        <span class="ml-auto text-[9px] ${hasContent ? 'text-cyan-400' : 'text-dim/50'}">${hasContent ? content.length + '字' : '—'}</span>
                    </div>
                    ${hasContent ? `<div class="text-[9px] text-dim leading-relaxed line-clamp-2">${content.slice(0, 80)}...</div>` : ''}
                </div>`;
        }).join('');
    },

    _renderParsedWorld(worldData) {
        if (!worldData.entities || worldData.entities.length === 0) {
            return `<div class="text-center text-dim text-sm py-8">
                <i class="fa-solid fa-earth-americas text-3xl mb-3 opacity-30"></i>
                <div>暂无解析结果</div>
                <div class="text-[10px] mt-1">导入内容后点击「AI智能解析」</div>
            </div>`;
        }
        const entities = worldData.entities || [];
        const grouped = {};
        entities.forEach(e => {
            const t = e.type || '其他';
            if (!grouped[t]) grouped[t] = [];
            grouped[t].push(e);
        });
        let html = '';
        for (const [type, items] of Object.entries(grouped)) {
            html += `<div class="mb-4">
                <div class="text-[10px] font-bold text-accent uppercase mb-2 flex items-center gap-1">
                    <i class="fa-solid fa-folder text-[8px]"></i>${type} (${items.length})
                </div>
                <div class="space-y-1.5">
                    ${items.slice(0, 10).map(e => `
                        <div class="p-2 bg-black/20 rounded border border-white/5 text-[10px]">
                            <div class="font-bold text-white mb-0.5">${e.name}</div>
                            <div class="text-dim leading-relaxed">${(e.desc || '').slice(0, 100)}</div>
                            ${e.relations && e.relations.length ? `<div class="text-cyan-400 mt-1">关联: ${e.relations.slice(0, 3).join(', ')}</div>` : ''}
                        </div>
                    `).join('')}
                    ${items.length > 10 ? `<div class="text-[9px] text-dim text-center">还有 ${items.length - 10} 项...</div>` : ''}
                </div>
            </div>`;
        }
        return html;
    },

    _openWorldImportModal() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt,.md,.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (ev) => {
                const content = ev.target.result;
                const rawEl = document.getElementById('ph-world-raw');
                if (rawEl) rawEl.value = content;
                this.data.importedWorld = this.data.importedWorld || {};
                this.data.importedWorld.rawContent = content;
                const statsEl = document.getElementById('ph-raw-stats');
                if (statsEl) statsEl.textContent = content.length + ' 字';
                UI.toast('已导入文件: ' + file.name);
            };
            reader.readAsText(file);
        };
        input.click();
    },

    async _importFromClipboard() {
        try {
            const content = await navigator.clipboard.readText();
            if (!content) return UI.toast('剪贴板为空', 'error');
            const rawEl = document.getElementById('ph-world-raw');
            if (rawEl) rawEl.value = content;
            this.data.importedWorld = this.data.importedWorld || {};
            this.data.importedWorld.rawContent = content;
            const statsEl = document.getElementById('ph-raw-stats');
            if (statsEl) statsEl.textContent = content.length + ' 字';
            UI.toast('已从剪贴板导入 ' + content.length + ' 字');
        } catch (e) {
            UI.toast('无法访问剪贴板', 'error');
        }
    },

    async _parseWorldWithAI() {
        const rawEl = document.getElementById('ph-world-raw');
        const content = rawEl ? rawEl.value : '';
        if (!content.trim()) return UI.toast('请先导入内容', 'error');
        
        // 显示进度区域
        const progressSection = document.getElementById('ph-parse-progress');
        const progressLabel = document.getElementById('ph-parse-label');
        const progressStatus = document.getElementById('ph-parse-status');
        const stopBtn = document.getElementById('ph-parse-stop');
        
        if (progressSection) progressSection.classList.remove('hidden');
        if (progressLabel) progressLabel.textContent = 'AI智能解析世界观';
        if (progressStatus) progressStatus.textContent = '正在分析文本结构...';
        
        this._parseStopFlag = false;
        if (stopBtn) {
            stopBtn.classList.remove('hidden');
            stopBtn.onclick = () => { this._parseStopFlag = true; };
        }
        
        const prompt = `你是一个专业的世界观解析引擎。请从以下文本中提取世界观设定，并按照指定格式输出。

【输入文本】
${content.slice(0, 8000)}

【提取要求】
请提取以下类型的信息：
1. 人物 - 角色名、身份、性格、外貌、能力、背景
2. 物品 - 武器、法宝、道具、关键物件
3. 地点 - 场景、城市、秘境、地标
4. 势力 - 门派、组织、阵营、国家
5. 种族 - 种族、族群、特殊生物
6. 魔法 - 功法、技能、法术体系
7. 规则 - 世界运行规则、力量等级
8. 文化 - 风俗、信仰、语言、节日
9. 历史 - 历史事件、传说、纪元
10. 技法 - 写作技法、叙事手法

【世界观维度】
同时请将内容归类到以下世界观维度：
- history (历史与传说)
- geography (地理与地貌)
- magic (魔法/科技体系)
- factions (势力与组织)
- species (种族与生物)
- rules (世界规则)
- culture (文化与习俗)

【输出格式】严格JSON：
{
  "entities": [
    {"name":"实体名","type":"类型","desc":"详细描述","relations":["关系:关联实体"]}
  ],
  "worldview": {
    "history":"历史与传说内容",
    "geography":"地理与地貌内容",
    "magic":"魔法/科技体系内容",
    "factions":"势力与组织内容",
    "species":"种族与生物内容",
    "rules":"世界规则内容",
    "culture":"文化与习俗内容"
  },
  "summary":"世界观整体概述（100字以内）"
}

直接输出JSON，不要包裹markdown代码块。`;

        let fullRes = '';
        let charCount = 0;
        
        if (progressStatus) progressStatus.textContent = '正在调用AI解析...';
        
        await AI.generate(prompt, {}, c => {
            if (this._parseStopFlag) return;
            fullRes += c;
            charCount += c.length;
            if (progressStatus) progressStatus.textContent = `正在接收解析结果... (${charCount}字)`;
        });
        
        if (this._parseStopFlag) {
            if (progressStatus) progressStatus.textContent = '已停止';
            if (stopBtn) stopBtn.classList.add('hidden');
            UI.toast('解析已停止');
            return;
        }
        
        if (progressStatus) progressStatus.textContent = '正在解析JSON结构...';

        let parsed = null;
        try {
            let cleanRes = fullRes.trim().replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '').trim();
            parsed = JSON.parse(cleanRes);
        } catch (e) {
            const m = fullRes.match(/\{[\s\S]*\}/);
            if (m) {
                try { parsed = JSON.parse(m[0]); } catch (e2) {}
            }
        }

        if (!parsed) {
            if (progressSection) progressSection.classList.add('hidden');
            UI.toast('解析失败，请检查内容格式', 'error');
            return;
        }
        
        if (progressStatus) progressStatus.textContent = '正在保存解析结果...';

        this.data.importedWorld = {
            rawContent: content,
            entities: parsed.entities || [],
            worldview: parsed.worldview || {},
            summary: parsed.summary || ''
        };

        // 隐藏进度区域
        if (progressSection) progressSection.classList.add('hidden');
        if (stopBtn) stopBtn.classList.add('hidden');

        this.refresh();
        UI.toast('解析完成！实体: ' + (parsed.entities || []).length + ' 个');
    },

    _editDimension(key) {
        const worldData = this.data.importedWorld || {};
        const worldview = worldData.worldview || {};
        const current = worldview[key] || '';
        const labels = {
            history: '历史与传说',
            geography: '地理与地貌',
            magic: '魔法/科技体系',
            factions: '势力与组织',
            species: '种族与生物',
            rules: '世界规则',
            culture: '文化与习俗'
        };
        const newContent = prompt('编辑「' + labels[key] + '」内容:', current);
        if (newContent !== null) {
            this.data.importedWorld = this.data.importedWorld || {};
            this.data.importedWorld.worldview = this.data.importedWorld.worldview || {};
            this.data.importedWorld.worldview[key] = newContent;
            this.refresh();
        }
    },

    _copyParsedResult() {
        const worldData = this.data.importedWorld || {};
        const text = JSON.stringify(worldData, null, 2);
        Utils.copy(text);
        UI.toast('已复制解析结果');
    },

    _clearParsedResult() {
        if (!confirm('确定清空解析结果？')) return;
        this.data.importedWorld = { rawContent: '', entities: [], worldview: {}, summary: '' };
        this.refresh();
        UI.toast('已清空');
    },
    
    _stopParse() {
        this._parseStopFlag = true;
        const stopBtn = document.getElementById('ph-parse-stop');
        if (stopBtn) {
            stopBtn.innerHTML = '<i class="fa-solid fa-check mr-1"></i>已停止';
            stopBtn.disabled = true;
        }
    },

    async _syncToWorldEngine() {
        const worldData = this.data.importedWorld || {};
        const entities = worldData.entities || [];
        const worldview = worldData.worldview || {};
        
        if (entities.length === 0 && Object.keys(worldview).length === 0) {
            return UI.toast('没有可同步的数据', 'error');
        }

        let entityAdded = 0;
        let entityUpdated = 0;
        let entitySkipped = 0;
        let worldCount = 0;
        let vectorCount = 0;
        const now = Date.now();

        await Modules.world_engine._ensureCache();
        const existingEntities = Modules.world_engine._cachedEntities || [];
        const existingNameMap = new Map();
        existingEntities.forEach(e => {
            if (e.name) {
                existingNameMap.set(e.name.toLowerCase(), e);
            }
        });

        // 1. 同步实体到实体管理（确保唯一性）
        for (const ent of entities) {
            if (!ent.name) continue;
            
            const normalizedName = ent.name.toLowerCase();
            const existingEntity = existingNameMap.get(normalizedName);
            
            if (existingEntity) {
                if (existingEntity.desc !== ent.desc || 
                    existingEntity.type !== ent.type) {
                    const entityData = {
                        id: existingEntity.id,
                        name: ent.name,
                        type: ent.type || existingEntity.type || '其他',
                        desc: ent.desc || existingEntity.desc,
                        relations: ent.relations || existingEntity.relations || [],
                        source: existingEntity.source || 'phoenix_import',
                        updatedAt: now
                    };
                    await DB.put('entities', entityData);
                    
                    // 同时更新向量库
                    await DB.put('vectors', {
                        id: existingEntity.id,
                        content: `[${entityData.type}] ${ent.name}: ${entityData.desc}`,
                        vector: Array.from({ length: 1536 }, () => Math.random()),
                        timestamp: now,
                        source: 'phoenix_world_import',
                        entityName: ent.name,
                        entityType: entityData.type
                    });
                    entityUpdated++;
                    vectorCount++;
                } else {
                    entitySkipped++;
                }
            } else {
                const id = 'world_import_' + Utils.uuid();
                const entityData = {
                    id,
                    name: ent.name,
                    type: ent.type || '其他',
                    desc: ent.desc || '',
                    relations: ent.relations || [],
                    source: 'phoenix_import',
                    updatedAt: now
                };
                await DB.put('entities', entityData);
                
                // 同时存入向量库
                await DB.put('vectors', {
                    id,
                    content: `[${ent.type || '其他'}] ${ent.name}: ${ent.desc || ''}`,
                    vector: Array.from({ length: 1536 }, () => Math.random()),
                    timestamp: now,
                    source: 'phoenix_world_import',
                    entityName: ent.name,
                    entityType: ent.type || '其他'
                });
                entityAdded++;
                vectorCount++;
            }
        }

        // 2. 同步世界观维度到世界观构建
        const catLabels = {
            history: '历史与传说',
            geography: '地理与地貌',
            magic: '魔法/科技体系',
            factions: '势力与组织',
            species: '种族与生物',
            rules: '世界规则',
            culture: '文化与习俗'
        };

        for (const [cat, desc] of Object.entries(worldview)) {
            if (!desc || !desc.trim()) continue;
            await DB.put('entities', {
                id: 'world_' + cat,
                name: catLabels[cat] || cat,
                type: 'world',
                desc: desc,
                source: 'phoenix_import',
                updatedAt: now
            });
            
            // 世界观也存入向量库
            await DB.put('vectors', {
                id: 'world_vec_' + cat,
                content: `[世界观·${catLabels[cat]}] ${desc}`,
                vector: Array.from({ length: 1536 }, () => Math.random()),
                timestamp: now,
                source: 'phoenix_world_import',
                category: cat
            });
            worldCount++;
            vectorCount++;
        }

        // 3. 同步章节细化（将实体按类型分配到章节备注）
        if (entities.length > 0) {
            const chapters = await DB.getAll('chapters') || [];
            if (chapters.length > 0) {
                // 按类型分组实体
                const groupedEntities = {};
                entities.forEach(e => {
                    const t = e.type || '其他';
                    if (!groupedEntities[t]) groupedEntities[t] = [];
                    groupedEntities[t].push(e);
                });
                
                // 生成章节备注
                let chapterNote = '\n\n---\n【凤凰流导入实体备注】\n';
                for (const [type, items] of Object.entries(groupedEntities)) {
                    chapterNote += `\n■ ${type}:\n`;
                    items.slice(0, 10).forEach(e => {
                        chapterNote += `  • ${e.name}: ${(e.desc || '').slice(0, 50)}\n`;
                    });
                }
                
                // 追加到第一章的大纲
                const firstChapter = chapters.sort((a, b) => (a.order || 0) - (b.order || 0))[0];
                if (firstChapter) {
                    firstChapter.outline = (firstChapter.outline || '') + chapterNote;
                    await DB.put('chapters', firstChapter);
                }
            }
        }

        // 4. 刷新世界引擎缓存
        if (Modules.world_engine) {
            Modules.world_engine._cachedEntities = null;
            // 刷新知识图谱
            if (Modules.world_engine.currentTab === 'graph') {
                setTimeout(() => Modules.world_engine._initGraph(), 100);
            }
        }

        // 5. 同步到RAG系统
        if (typeof RAGSystem !== 'undefined') {
            try {
                for (const ent of entities) {
                    if (!ent.name) continue;
                    await RAGSystem.addDocument(
                        `${ent.type || '其他'}·${ent.name}`,
                        ent.desc || '',
                        'entity',
                        { source: 'phoenix_import', type: ent.type }
                    );
                }
            } catch (e) {
                console.log('RAG同步警告:', e);
            }
        }

        // 6. 更新凤凰流自身数据
        this.data.worldContext = this._buildWorldContext(worldData);

        let message = `同步完成！实体新增: ${entityAdded}，更新: ${entityUpdated}`;
        if (entitySkipped > 0) message += `，跳过: ${entitySkipped}`;
        message += ` | 世界观: ${worldCount} | 向量: ${vectorCount}`;
        UI.toast(message);
    },

    _buildWorldContext(worldData) {
        let ctx = '[凤凰流导入的世界观设定]\n\n';
        
        if (worldData.summary) {
            ctx += '【概述】\n' + worldData.summary + '\n\n';
        }
        
        const catLabels = {
            history: '历史与传说',
            geography: '地理与地貌',
            magic: '魔法/科技体系',
            factions: '势力与组织',
            species: '种族与生物',
            rules: '世界规则',
            culture: '文化与习俗'
        };
        
        if (worldData.worldview) {
            for (const [cat, desc] of Object.entries(worldData.worldview)) {
                if (desc && desc.trim()) {
                    ctx += `【${catLabels[cat] || cat}】\n${desc.slice(0, 300)}\n\n`;
                }
            }
        }
        
        if (worldData.entities && worldData.entities.length > 0) {
            ctx += '【关键实体】\n';
            const grouped = {};
            worldData.entities.forEach(e => {
                const t = e.type || '其他';
                if (!grouped[t]) grouped[t] = [];
                grouped[t].push(e);
            });
            for (const [type, items] of Object.entries(grouped)) {
                ctx += `\n■ ${type} (${items.length})\n`;
                items.slice(0, 5).forEach(e => {
                    ctx += `  • ${e.name}: ${(e.desc || '').slice(0, 60)}\n`;
                });
            }
        }
        
        return ctx;
    },

    async _mergeToOutline() {
        const worldData = this.data.importedWorld || {};
        const summary = worldData.summary || '';
        const worldview = worldData.worldview || {};
        
        let worldText = '';
        if (summary) worldText += '# 世界观概述\n\n' + summary + '\n\n';
        
        const catLabels = {
            history: '历史与传说',
            geography: '地理与地貌',
            magic: '魔法/科技体系',
            factions: '势力与组织',
            species: '种族与生物',
            rules: '世界规则',
            culture: '文化与习俗'
        };

        for (const [cat, desc] of Object.entries(worldview)) {
            if (desc && desc.trim()) {
                worldText += `## ${catLabels[cat]}\n\n${desc}\n\n`;
            }
        }

        if (!worldText) return UI.toast('没有可合并的世界观内容', 'error');

        this.data.outlineRaw = (this.data.outlineRaw || '') + '\n\n---\n\n' + worldText;
        UI.toast('已合并到大纲，字数: ' + worldText.length);
    },

    async _injectToVectorDB() {
        const worldData = this.data.importedWorld || {};
        const entities = worldData.entities || [];
        const worldview = worldData.worldview || {};
        
        if (entities.length === 0 && Object.keys(worldview).length === 0) {
            return UI.toast('没有可存入的数据', 'error');
        }

        let count = 0;
        const now = Date.now();

        for (const ent of entities) {
            if (!ent.name) continue;
            const id = 'world_import_' + Utils.uuid();
            const content = `[${ent.type || '其他'}] ${ent.name}: ${ent.desc || ''}`;
            await DB.put('vectors', {
                id,
                content,
                vector: Array.from({ length: 1536 }, () => Math.random()),
                timestamp: now
            });
            count++;
        }

        for (const [cat, desc] of Object.entries(worldview)) {
            if (!desc || !desc.trim()) continue;
            await DB.put('vectors', {
                id: 'world_vec_' + cat,
                content: `[世界观] ${cat}: ${desc}`,
                vector: Array.from({ length: 1536 }, () => Math.random()),
                timestamp: now
            });
            count++;
        }

        UI.toast('已存入向量库 ' + count + ' 条');
    },

});
