Object.assign(Modules.phoenix, {
    _renderStep1() {
        const extracted = this.data._extractedEntities || [];
        const outlineStats = this._getOutlineStructureStats(this.data.outlineRaw || '');
        return `
            <div class="flex-1 flex flex-col min-h-0 animate-fade-in">
                <div class="h-11 flex items-center justify-between px-5 bg-[#0d0d0f] border-b border-white/5 shrink-0">
                    <span class="text-xs font-bold text-white">第二步：细纲定稿 & 实体入图谱</span>
                    <div class="flex gap-2 items-center">
                        <span class="text-[10px] text-dim">支持 Markdown</span>
                        <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30" onclick="Modules.phoenix.importWorldSetting()" id="ph-btn-import-world"><i class="fa-solid fa-earth-americas mr-1"></i>导入世界观</button>
                        <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30" onclick="Modules.phoenix._extractEntitiesFromOutline()" id="ph-btn-extract-ent"><i class="fa-solid fa-diagram-project mr-1"></i>提取实体</button>
                        <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30" onclick="Modules.phoenix.nexusSelfCheck()" id="ph-btn-fusion"><i class="fa-solid fa-shield-halved mr-1"></i>一致性自检</button>
                        <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30" onclick="Modules.phoenix.nexusEnhance()" id="ph-btn-ai-polish"><i class="fa-solid fa-pen-nib mr-1"></i>细纲校准</button>
                    </div>
                </div>
                <div id="ph-entity-extract-status" class="hidden shrink-0 px-5 py-2 border-b border-green-500/20 bg-green-500/[0.055] text-[11px] text-green-300">
                    <i class="fa-solid fa-circle-notch fa-spin mr-1"></i><span id="ph-entity-extract-status-text">正在准备提取实体...</span>
                </div>
                <div class="flex-1 flex min-h-0">
                    <div class="flex-1 flex flex-col border-r border-white/5 min-w-0">
                        <div class="px-4 py-2 text-[10px] text-accent font-bold uppercase bg-black/20 border-b border-white/5 shrink-0 flex items-center justify-between">
                            <span>执行级细纲</span>
                            <span class="text-dim font-mono">${(this.data.outlineRaw||'').length} 字 · ${outlineStats.chapCount} 章</span>
                        </div>
                        <textarea class="flex-1 bg-transparent border-none p-5 font-mono text-sm resize-none text-gray-300 leading-relaxed focus:outline-none" id="ph-outline-edit" oninput="Modules.phoenix.updatePreview()">${this.data.outlineRaw || ''}</textarea>
                    </div>
                    <!-- 中间: 结构预览 -->
                    <div class="flex-1 flex flex-col border-r border-white/5 min-w-0">
                        <div class="px-4 py-2 text-[10px] text-accent font-bold uppercase bg-black/20 border-b border-white/5 shrink-0">结构预览 / 人物一致 / 世界不崩</div>
                        <div class="flex-1 p-5 overflow-y-auto text-sm text-dim font-serif whitespace-pre-wrap leading-loose" id="ph-outline-preview">${this.data.outlineRaw || '<span class="opacity-30">等待内容...</span>'}</div>
                    </div>
                    <!-- 右侧: 实体提取结果 -->
                    <div class="w-64 shrink-0 flex flex-col bg-[#0a0a0c] border-l border-white/5">
                        <div class="px-4 py-2 text-[10px] text-green-400 font-bold uppercase bg-black/20 border-b border-white/5 shrink-0 flex items-center justify-between">
                            <span><i class="fa-solid fa-diagram-project mr-1"></i>图谱实体</span>
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
                                    <div>暂无图谱实体</div>
                                    <div class="text-[10px] mt-1">点击「提取实体」，识别人、规则、伏笔、地点和关系</div>
                                </div>
                            `}
                        </div>
                        <div class="p-3 border-t border-white/5 space-y-2 shrink-0">
                            <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30 w-full ${extracted.length===0?'opacity-50 pointer-events-none':''}" onclick="Modules.phoenix.syncExtractedEntitiesToWorld()" id="ph-inject-entities-btn">
                                <i class="fa-solid fa-atom mr-1"></i>同步到世界引擎
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
        if (this._generating) {
            this._setEntityExtractStatus('已有任务正在运行。若按钮卡住，请稍等几秒或点停止后再提取。', { busy: false });
            return UI.toast('已有任务正在运行，请稍候', 'warning');
        }
        const outline = (document.getElementById('ph-outline-edit') || {}).value || this.data.outlineRaw || '';
        if (!outline.trim()) {
            this._setEntityExtractStatus('细纲内容为空，无法提取实体。', { busy: false });
            return UI.toast('细纲内容为空', 'error');
        }

        this.data.outlineRaw = outline;
        UI.toast('已开始提取实体：先本地解析，再用解析模型增强...', 'info');
        this._setGenerating(true);
        this._setEntityExtractStatus('已接到指令，正在本地解析实体线索...');

        let localEntities = [];
        let fullRes = '';
        let parsed = null;
        try {
            localEntities = this._extractEntitiesDeterministicFromOutline(outline);
            this.data._extractedEntities = localEntities;
            this._renderExtractedEntities(`本地已识别 ${localEntities.length} 个实体，正在调用解析模型增强...`);
            this._setEntityExtractStatus(`本地已识别 ${localEntities.length} 个实体，正在调用解析模型增强...`);
        } catch (e) {
            console.warn('本地实体解析失败:', e);
            this._setEntityExtractStatus('本地解析遇到问题，正在改用解析模型增强...');
        }

        const prompt = `你是一位长篇小说知识图谱提取引擎。请从以下小说细纲中提取所有关键实体，并把它们整理成可注入世界引擎的图谱资产。

【细纲内容】
${outline.slice(0, 8000)}

【提取要求】
请提取以下类型：
1. 人物 - 角色名、身份、欲望、伤口、能力、关系、当前状态
2. 世界规则 - 世界运行规则、力量体系、代价、禁忌、边界
3. 伏笔 - 埋设位置、强化方式、预计回收章节
	4. 地点 - 场景、城市、秘境、地标
	5. 势力 - 门派、组织、阵营、国家
	6. 物品/能力 - 只提关键武器、法宝、道具、系统、协议、证据、功法、技能

【输出格式】严格JSON数组：
[
  {
    "name":"名称",
	    "type":"人物|世界规则|伏笔|地点|势力|物品|能力|情节",
    "desc":"一句话描述",
    "state":"当前状态，如CHR:S1激活 / WLD:S0提出 / FOE:S0埋设 / EMO:7分",
    "relations":["关系:关联对象"],
    "risk":"可能导致人物不一致或世界观崩坏的风险"
  },
  ...
]

注意：
- 只输出JSON数组，不要包裹markdown代码块
- 确保每个条目都有name、type、desc、state
	- 人物必须写清欲望和变化，世界规则必须写清代价和边界，伏笔必须写预计回收点
	- 实体必须是可复用的“要素节点”，不要把上下文记忆、情绪句、摘要句、普通动作、一次性日用品当实体
	- relations 只能指向本次输出中的其他实体名，用来画图谱连线；不要塞一长串杂物
	- 不要遗漏主角、核心反派、核心世界规则、第一卷主伏笔`;

        try {
            this._setEntityExtractStatus(`本地已识别 ${localEntities.length} 个实体，解析模型增强中...`);
            await AI.generate(prompt, { apiType: 'parse', module: 'phoenix_outline_entity_extract' }, c => {
                fullRes += c;
                this._setEntityExtractStatus(`解析模型增强中... 已接收 ${fullRes.length} 字`);
            });
        } catch(e) {
            console.warn('解析模型实体提取失败，使用本地结果:', e);
            this._setEntityExtractStatus('解析模型暂不可用，正在使用本地提取结果写入图谱...');
        }

        if (fullRes.trim()) {
            try {
                let cleanRes = fullRes.trim().replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '').trim();
                parsed = JSON.parse(cleanRes);
            } catch(e) {
                const m = fullRes.match(/\[[\s\S]*\]/);
                if(m) { try { parsed = JSON.parse(m[0]); } catch(e2) {} }
            }
        }

	        const aiEntities = Array.isArray(parsed) ? parsed.map(ent => this._normalizeExtractedEntity(ent)).filter(Boolean) : [];
	        const unique = this._filterGraphEntitiesForWorld(this._mergeExtractedEntities(localEntities, aiEntities));

        if (!unique.length) {
            this.data._extractedEntities = [];
            this._renderExtractedEntities('未提取到实体。请检查细纲里是否有「实体线索 / 世界规则 / 伏笔钩子」。');
            this._setEntityExtractStatus('未提取到实体。请检查细纲字段，或稍后重试解析模型。', { busy: false });
            UI.toast('未提取到实体，请检查细纲内容', 'warning');
            this._setGenerating(false);
            return;
        }

        this.data._extractedEntities = unique;
        this._renderExtractedEntities(`提取完成：${unique.length} 个实体，正在同步到世界引擎...`);
        let saved = null;
        try {
            saved = await this._syncPhoenixEntitiesToWorldEngine();
        } catch (e) {
            console.error('实体同步世界引擎失败:', e);
            this._renderExtractedEntities(`提取完成：${unique.length} 个实体，但同步世界引擎失败。请稍后点「同步到世界引擎」重试。`);
            this._setEntityExtractStatus(`提取完成：${unique.length} 个实体，但同步世界引擎失败。`, { busy: false });
            UI.toast('实体已提取，但同步世界引擎失败', 'error');
            this._setGenerating(false);
            return;
        }
        this._renderExtractedEntities(`提取完成：${unique.length} 个实体。已同步 ${saved.total || 0} 个世界引擎节点。`);
        this._setEntityExtractStatus(`提取完成：${unique.length} 个实体。已同步 ${saved.total || 0} 个世界引擎节点。`, { busy: false, done: true });
        UI.toast(`提取完成：${unique.length} 个实体，已同步到世界引擎`);
        this._setGenerating(false);
    },

    async _injectExtractedEntities() {
        const entities = this.data._extractedEntities || [];
        if (entities.length === 0) return UI.toast('没有可同步的实体', 'error');

        this._setEntityExtractStatus('正在同步到世界引擎...');
        let saved = null;
        try {
            saved = await this._syncPhoenixEntitiesToWorldEngine();
        } catch (e) {
            console.error('实体同步失败:', e);
            this._renderExtractedEntities('同步世界引擎失败。请检查本地数据库状态后重试。');
            UI.toast('实体同步失败', 'error');
            return;
        }
        this._renderExtractedEntities(`已同步 ${saved.total || 0} 个世界引擎实体。`);
        UI.toast(`已同步 ${saved.total || 0} 个实体到世界引擎`);
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

    _setEntityExtractStatus(text, opts = {}) {
        const top = document.getElementById('ph-entity-extract-status');
        const topText = document.getElementById('ph-entity-extract-status-text');
        if (top) {
            top.classList.remove('hidden');
            top.className = `shrink-0 px-5 py-2 border-b text-[11px] ${
                opts.done ? 'border-green-500/25 bg-green-500/[0.075] text-green-300' :
                opts.busy === false ? 'border-amber-500/25 bg-amber-500/[0.075] text-amber-300' :
                'border-green-500/20 bg-green-500/[0.055] text-green-300'
            }`;
            top.innerHTML = `${opts.done || opts.busy === false ? '<i class="fa-solid fa-circle-info mr-1"></i>' : '<i class="fa-solid fa-circle-notch fa-spin mr-1"></i>'}<span id="ph-entity-extract-status-text"></span>`;
            const refreshedText = document.getElementById('ph-entity-extract-status-text');
            if (refreshedText) refreshedText.textContent = text || '正在解析细纲...';
        } else if (topText) {
            topText.textContent = text || '正在解析细纲...';
        }
        const btn = document.getElementById('ph-btn-extract-ent');
        if (btn) {
            if (opts.done || opts.busy === false) btn.innerHTML = '<i class="fa-solid fa-diagram-project mr-1"></i>提取实体';
            else btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-1"></i>正在提取...';
        }
        if (typeof App !== 'undefined' && App.logIO) App.logIO('[凤凰流] ' + (text || '正在解析细纲...'), opts.done ? 'success' : 'info');
        const panel = document.getElementById('ph-extracted-entities');
        if (!panel) return;
        panel.innerHTML = `
            <div class="p-3 rounded-lg border border-green-500/20 bg-green-500/10 text-[10px] text-green-300 leading-relaxed">
                <div class="font-bold text-green-200 flex items-center gap-2">
                    <i class="fa-solid fa-circle-notch fa-spin"></i>
                    <span>实体提取中</span>
                </div>
                <div class="mt-2 text-green-300/80">${text || '正在解析细纲...'}</div>
            </div>`;
    },

    _renderExtractedEntities(statusText = '') {
        const entities = this.data._extractedEntities || [];
        const countEl = document.getElementById('ph-ent-count');
        if (countEl) countEl.textContent = entities.length;
        const injectBtn = document.getElementById('ph-inject-entities-btn');
        if (injectBtn) {
            if (entities.length === 0) injectBtn.classList.add('opacity-50', 'pointer-events-none');
            else injectBtn.classList.remove('opacity-50', 'pointer-events-none');
        }
        const panel = document.getElementById('ph-extracted-entities');
        if (!panel) return;
        if (!entities.length) {
            panel.innerHTML = `
                <div class="text-center text-dim text-xs py-8">
                    <i class="fa-solid fa-boxes-stacked text-2xl mb-2 opacity-30"></i>
                    <div>暂无图谱实体</div>
                    <div class="text-[10px] mt-1">${statusText || '点击「提取实体」，识别人、规则、伏笔、地点和关系'}</div>
                </div>`;
            return;
        }
        panel.innerHTML = `
            ${statusText ? `<div class="p-2 rounded border border-green-500/20 bg-green-500/10 text-[10px] text-green-300 leading-relaxed">${statusText}</div>` : ''}
            ${entities.map(e => `
                <div class="p-2 bg-black/20 rounded border border-white/5 text-[10px]">
                    <div class="font-bold text-white flex items-center gap-1">
                        <span class="text-[8px] px-1 rounded ${this._entityTypeBadgeClass(e.type)}">${e.type || '其他'}</span>
                        ${this._escapeHtml(e.name || '')}
                    </div>
                    <div class="text-dim leading-relaxed mt-1 line-clamp-2">${this._escapeHtml((e.desc || '').slice(0, 80))}</div>
                    ${e.state ? `<div class="text-[9px] text-amber-300/80 mt-1">${this._escapeHtml(e.state)}</div>` : ''}
                </div>
            `).join('')}`;
    },

    _entityTypeBadgeClass(type) {
        if (type === '人物') return 'bg-cyan-500/20 text-cyan-300';
        if (type === '地点') return 'bg-green-500/20 text-green-300';
        if (type === '势力') return 'bg-amber-500/20 text-amber-300';
        if (type === '伏笔') return 'bg-red-500/20 text-red-300';
        if (type === '世界规则' || type === '规则') return 'bg-purple-500/20 text-purple-300';
        return 'bg-white/10 text-gray-300';
    },

    _escapeHtml(text) {
        return String(text || '').replace(/[&<>"']/g, ch => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[ch]));
    },

    _extractEntitiesDeterministicFromOutline(outline) {
        const entities = [];
        const add = (rawName, rawType, desc, state = '', relations = [], risk = '', chapter = '', volume = '') => {
            const name = this._cleanExtractedEntityName(rawName);
            if (!name || name.length < 2) return;
            const type = this._normalizeExtractedEntityType(rawType);
            entities.push(this._normalizeExtractedEntity({
                name,
                type,
                desc,
                state,
                relations,
                risk,
                chapter,
                volume,
                chapterOrder: this._parseChapterOrder(chapter)
            }));
        };

        let currentChapter = '';
        let currentVolume = '';
        const lines = String(outline || '').split(/\n+/);
        for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line) continue;
            const cleanLine = line.replace(/\*\*/g, '').trim();
            const headingTitle = this._cleanOutlineHeading ? this._cleanOutlineHeading(line) : cleanLine.replace(/^\s{0,3}#{1,6}\s*/, '').trim();
            if (this._isVolumeHeadingTitle && this._isVolumeHeadingTitle(headingTitle)) {
                currentVolume = headingTitle;
                currentChapter = '';
                add(currentVolume.replace(/^第.+?卷[:：]\s*/, ''), '情节', '卷级结构节点：' + currentVolume, 'VOL:S0', [], '', '', currentVolume);
                continue;
            }
            if (this._isChapterHeadingTitle && this._isChapterHeadingTitle(headingTitle)) {
                currentChapter = headingTitle;
                continue;
            }

            const entityLineMatch = cleanLine.match(/实体线索[:：]\s*(.+)$/);
            if (entityLineMatch) {
                const body = entityLineMatch[1].replace(/^[:：]\s*/, '').trim();
                const itemRe = /([^，、；;()（）]+?)[(（]([^）)]+)[)）]/g;
                let match;
                while ((match = itemRe.exec(body))) {
                    const rawName = match[1].trim();
                    const rawType = match[2].trim();
                    add(rawName, rawType, `${currentChapter || currentVolume || '细纲'}实体线索：${rawName}`, this._stateFromType(rawType), [], '', currentChapter, currentVolume);
                }
                continue;
            }

            const ruleMatch = cleanLine.match(/(?:卷规则|世界规则)[:：]\s*(.+)$/);
            if (ruleMatch) {
                const body = ruleMatch[1].trim();
                const first = body.split(/[——:：。；;]/)[0].trim();
                const name = first.includes('法则') || first.includes('规则') ? first : first.slice(0, 24);
                add(name, '世界规则', body, 'WLD:S0提出', [], '', currentChapter, currentVolume);
                continue;
            }

            const foeMatch = cleanLine.match(/(?:卷伏笔|伏笔钩子)[:：]\s*(.+)$/);
            if (foeMatch) {
                const body = foeMatch[1].trim();
                const candidates = [];
                body.split(/[；;]/).forEach(part => {
                    part.split(/[，、]/).forEach(chunk => {
                        const cleaned = chunk
                            .replace(/^(埋设|强化|回收|章末未完成动作|章末意外信息|章末信息差)[:：]?/, '')
                            .replace(/（FOE-[^)）]+）/g, '')
                            .trim();
                        if (cleaned.length >= 3 && cleaned.length <= 36) candidates.push(cleaned);
                    });
                });
                candidates.slice(0, 6).forEach(name => add(name, '伏笔', body, name.includes('回收') ? 'FOE:S2回收' : 'FOE:S0埋设', [], '', currentChapter, currentVolume));
                continue;
            }

	            const memoryMatch = cleanLine.match(/上下文记忆[:：]\s*(.+)$/);
	            if (memoryMatch) {
	                continue;
	            }
        }

        return this._mergeExtractedEntities(entities);
    },

    _cleanExtractedEntityName(name) {
        return String(name || '')
            .replace(/\*\*/g, '')
            .replace(/^[-*\s]+/, '')
            .replace(/^[：:，、；;]+/, '')
            .replace(/[。.!！?？]+$/, '')
            .replace(/[+＋]\d+$/, '')
            .replace(/（[^）]*）/g, '')
            .replace(/\([^)]*\)/g, '')
            .trim()
            .slice(0, 40);
    },

    _normalizeExtractedEntityType(type) {
        const t = String(type || '').trim();
        if (/CHR|人物|角色|主角|反派/.test(t)) return '人物';
        if (/WLD|规则|法则|体系|世界/.test(t)) return '世界规则';
        if (/FOE|伏笔|线索/.test(t)) return '伏笔';
        if (/EMO|情绪|锚点/.test(t)) return '情绪锚点';
        if (/地点|场景|地标|城市|秘境|玄关|客厅|厨房|浴室/.test(t)) return '地点';
        if (/势力|组织|阵营|门派|国家/.test(t)) return '势力';
        if (/能力|技能|功法|法术/.test(t)) return '能力';
        if (/物品|道具|装备|状态|伤口|感官|物理/.test(t)) return '物品';
        if (/情节|卷|章节/.test(t)) return '情节';
        if (/记忆|上下文/.test(t)) return '记忆';
        return t || '其他';
    },

    _stateFromType(type) {
        const t = String(type || '');
        if (/CHR|人物|角色/.test(t)) return 'CHR:S1激活';
        if (/WLD|规则|法则/.test(t)) return 'WLD:S0提出';
        if (/FOE|伏笔|线索/.test(t)) return 'FOE:S0埋设';
        if (/EMO|情绪/.test(t)) return 'EMO:S0记录';
        return '';
    },

    _parseChineseNumberText(value) {
        const raw = String(value || '').trim();
        if (!raw) return 0;
        if (/^\d+$/.test(raw)) return parseInt(raw, 10) || 0;
        const map = { 零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
        const units = { 十: 10, 百: 100, 千: 1000 };
        let total = 0;
        let num = 0;
        for (const ch of raw) {
            if (/\d/.test(ch)) {
                num = num * 10 + parseInt(ch, 10);
                continue;
            }
            if (Object.prototype.hasOwnProperty.call(map, ch)) {
                num = map[ch];
                continue;
            }
            if (units[ch]) {
                total += (num || 1) * units[ch];
                num = 0;
            }
        }
        return total + num;
    },

    _parseChapterOrder(text) {
        const raw = String(text || '');
        const match = raw.match(/第([0-9零一二两三四五六七八九十百千]+)章/);
        if (!match) return 0;
        return this._parseChineseNumberText(match[1]);
    },

    _compactExtractedDesc(desc, ent = {}) {
        const type = this._normalizeExtractedEntityType(ent.type || ent.category);
        const name = String(ent.name || '').trim();
        let text = String(desc || ent.description || '')
            .replace(/\r/g, '\n')
            .replace(/\s*\|\s*来源(章节|卷)[:：][^|\n]+/g, '')
            .replace(/\s*\|\s*风险[:：][^|\n]+/g, '')
            .replace(/来源(章节|卷)[:：][^\n|。；;]+[。；;]?/g, '')
            .replace(/\[第[0-9零一二两三四五六七八九十百千]+章更新\]/g, '\n')
            .replace(/第[0-9零一二两三四五六七八九十百千]+章更新[:：]?/g, '\n')
            .replace(/本章状态[:：][^。；;\n]+[。；;]?/g, '')
            .replace(/本章关键行为[:：][^。；;\n]+[。；;]?/g, '')
            .replace(/关键行为[:：][^。；;\n]+[。；;]?/g, '')
            .replace(/章末钩子[:：][^。；;\n]+[。；;]?/g, '')
            .replace(/变化原因[:：][^。；;\n]+[。；;]?/g, '')
            .trim();
        if (!text) return name ? `${type}：${name}` : '';
        const parts = [];
        const seen = new Set();
        text.split(/\n+|\s+\|\s+/).forEach(part => {
            const clean = String(part || '')
                .replace(/^\s*[-*]\s*/, '')
                .replace(/^(当前状态|本章状态|关键行为|描述|设定)[:：]\s*/, '')
                .replace(/\s+/g, ' ')
                .replace(/[。；;\s]+$/g, '')
                .trim();
            if (!clean) return;
            const key = clean.replace(/\s+/g, '').toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);
            parts.push(clean);
        });
        if (!parts.length) return name ? `${type}：${name}` : '';
        const clip = (value, max) => {
            const str = String(value || '').trim();
            if (str.length <= max) return str;
            const cut = str.slice(0, max);
            const idx = Math.max(cut.lastIndexOf('。'), cut.lastIndexOf('；'), cut.lastIndexOf(';'));
            return (idx > 40 ? cut.slice(0, idx) : cut).replace(/[，,、；;。]+$/g, '') + '。';
        };
        let selected = [];
        if (type === '人物') {
            const identity = parts.find(part => /(岁|男|女|主角|反派|老板|组长|员工|租户|独居|社恐|身份|职业|核心|欲望|能力|性格|人设)/.test(part)) || parts[0];
            const status = [...parts].reverse().find(part => /(当前|状态|被|卷入|收到|警告|标记|掌握|失去|获得|追杀|倒计时|清洗|危险)/.test(part) && part !== identity);
            selected = [identity, status].filter(Boolean);
        } else {
            selected = [parts[0], parts.find(part => part !== parts[0] && /(当前|用途|所属|位置|能力|规则|关系|风险|状态)/.test(part))].filter(Boolean);
        }
        return clip(selected.map(part => clip(part, type === '人物' ? 180 : 150)).join('\n'), type === '人物' ? 360 : 220);
    },

    _normalizeExtractedEntity(ent) {
        if (!ent || !ent.name) return null;
        const name = this._cleanExtractedEntityName(ent.name);
        if (!name) return null;
        const type = this._normalizeExtractedEntityType(ent.type || ent.category);
        const chapter = ent.chapter || ent.chapterTitle || '';
        const volume = ent.volume || ent.volumeTitle || '';
        const chapterOrder = parseInt(ent.chapterOrder, 10) || this._parseChapterOrder(chapter);
        const baseDesc = this._compactExtractedDesc(ent.desc || ent.description || '', { ...ent, name, type });
        return {
            name,
            type,
            desc: baseDesc || `${type}：${name}`,
            state: ent.state || this._stateFromType(type),
            relations: Array.isArray(ent.relations) ? ent.relations.filter(Boolean) : [],
            risk: ent.risk || '',
            chapter,
            volume,
            chapterOrder,
            chapterRef: chapterOrder ? [chapterOrder] : (Array.isArray(ent.chapterRef) ? ent.chapterRef : [])
        };
    },

	    _mergeExtractedEntities(...groups) {
	        const merged = new Map();
	        groups.flat().filter(Boolean).forEach(ent => {
	            const normalized = this._normalizeExtractedEntity(ent);
	            if (!normalized) return;
            const key = normalized.name.toLowerCase();
            if (!merged.has(key)) {
                merged.set(key, normalized);
                return;
            }
            const old = merged.get(key);
            old.type = old.type === '其他' ? normalized.type : old.type;
            old.desc = this._compactExtractedDesc([old.desc, normalized.desc].filter(Boolean).join('\n'), old);
            old.state = old.state || normalized.state;
            old.risk = old.risk || normalized.risk;
            old.chapter = old.chapter || normalized.chapter;
            old.volume = old.volume || normalized.volume;
            old.chapterOrder = old.chapterOrder || normalized.chapterOrder;
            old.chapterRef = Array.from(new Set([...(old.chapterRef || []), ...(normalized.chapterRef || [])].filter(Boolean)));
            old.relations = Array.from(new Set([...(old.relations || []), ...(normalized.relations || [])]));
        });
        return Array.from(merged.values()).sort((a, b) => {
            const rank = { '人物': 1, '世界规则': 2, '伏笔': 3, '地点': 4, '势力': 5, '能力': 6, '物品': 7, '情绪锚点': 8, '记忆': 9, '情节': 10 };
            return (rank[a.type] || 99) - (rank[b.type] || 99) || a.name.localeCompare(b.name, 'zh-CN');
	        });
	    },

	    _isLowValueGraphEntity(ent) {
	        if (!ent || !ent.name) return true;
	        const name = String(ent.name || '').trim();
	        const type = this._normalizeExtractedEntityType(ent.type || ent.category);
	        const desc = String(ent.desc || ent.description || '');
	        const full = `${name}\n${desc}`;
	        if (!name || name.length < 2) return true;
	        if (/^FOE\d+$/i.test(name)) return true;
	        if (/^\d+\s*(章|循环)$/.test(name)) return true;
	        if (/^(但|而且|并且|因为|所以|这是|里面|最后|建议|假装|请于|点：|和它|下次|说明她|每修补|审计风险|也可能是|D架)/.test(name)) return true;
	        if (/[。；;]/.test(name) && name.length > 16) return true;
	        if (['记忆','情绪锚点','技法'].includes(type)) return true;
	        if (type === '其他') return true;
	        if (type === '物品') {
	            const strongItem = /(系统|芯片|钥匙|枪|刀|剑|卡|身份|证据|日志|协议|核心|终端|设备|义体|晶体|晶石|兽核|武器|螺纹钢|钢管|铁棍|模块|U盘|硬盘|信封|纸条|短信|电话|手机|合同|债务|遗物|戒指|药|符|法宝|装置|引擎|账户|密码|令牌|档案|日记|录音)/;
	            if (!strongItem.test(full)) return true;
	        }
	        if (type === '伏笔') {
	            const usefulFoe = /(伏笔|埋设|回收|秘密|隐藏|异常|倒计时|追杀|身份|电话|短信|信封|危险|未完成|信息差|钩子|真相|背后|标记|泄露|警告)/;
	            if (name.length > 30 && !usefulFoe.test(full)) return true;
	        }
	        return false;
	    },

	    _compactExtractedRelationsForWorld(relations, allowedNames, selfName = '', limit = 8) {
	        const rawList = Array.isArray(relations)
	            ? relations
	            : (typeof relations === 'string' ? relations.split(',') : []);
	        const allowed = new Set([...allowedNames].map(n => String(n || '').trim()).filter(Boolean));
	        const normalize = value => String(value || '')
	            .toLowerCase()
	            .replace(/[《》「」『』"'“”‘’\s]/g, '')
	            .replace(/[：:，、；;。.!！?？\-—_]/g, '')
	            .trim();
	        const allowedNorm = new Map([...allowed].map(n => [normalize(n), n]));
	        const selfNorm = normalize(selfName);
	        const out = [];
	        const seen = new Set();
	        for (const raw of rawList) {
	            let text = String(raw || '').trim();
	            if (!text || text.length > 50) continue;
	            let label = '';
	            let target = text;
	            if (text.includes(':')) {
	                const idx = text.indexOf(':');
	                label = text.slice(0, idx).trim().slice(0, 10);
	                target = text.slice(idx + 1).trim();
	            }
	            target = target
	                .replace(/[。.!！?？]+$/, '')
	                .replace(/^["'“”‘’「」]+|["'“”‘’「」]+$/g, '')
	                .trim();
	            const targetNorm = normalize(target);
	            if (!targetNorm || targetNorm === selfNorm) continue;
	            let canonical = allowedNorm.get(targetNorm);
	            if (!canonical) {
	                canonical = [...allowed].find(name => {
	                    const n = normalize(name);
	                    return n && n !== selfNorm && (n.includes(targetNorm) || targetNorm.includes(n));
	                });
	            }
	            if (!canonical) continue;
	            const value = label ? `${label}:${canonical}` : canonical;
	            const key = normalize(value);
	            if (seen.has(key)) continue;
	            seen.add(key);
	            out.push(value);
	            if (out.length >= limit) break;
	        }
	        return out;
	    },

	    _filterGraphEntitiesForWorld(entities) {
	        const normalized = (entities || [])
	            .map(ent => this._normalizeExtractedEntity(ent))
	            .filter(Boolean)
	            .filter(ent => !this._isLowValueGraphEntity(ent));
	        const allowedNames = new Set(normalized.map(ent => ent.name));
	        return normalized.map(ent => ({
	            ...ent,
	            relations: this._compactExtractedRelationsForWorld(ent.relations || [], allowedNames, ent.name)
	        }));
	    },

    _asUniqueArray(...values) {
        const out = [];
        values.flat(Infinity).forEach(value => {
            if (value === undefined || value === null || value === '') return;
            if (!out.includes(value)) out.push(value);
        });
        return out;
    },

    _normalizeScopeTitle(text) {
        return String(text || '')
            .replace(/\*\*/g, '')
            .replace(/[《》「」『』"'“”‘’\s]/g, '')
            .replace(/[：:，、；;。.!！?？-]/g, '')
            .trim()
            .toLowerCase();
    },

    _extractChapterRefs(value) {
        const refs = new Set();
        const addNumber = num => {
            const parsed = parseInt(num, 10);
            if (parsed > 0) refs.add(parsed);
        };
        const scan = item => {
            if (item === undefined || item === null) return;
            if (Array.isArray(item)) {
                item.forEach(scan);
                return;
            }
            if (typeof item === 'number') {
                addNumber(item);
                return;
            }
            const text = String(item || '');
            if (!text.trim()) return;
            let rangeMatch;
            const rangeRe = /(\d{1,4})\s*[-~至到]\s*(\d{1,4})/g;
            while ((rangeMatch = rangeRe.exec(text))) {
                const start = parseInt(rangeMatch[1], 10);
                const end = parseInt(rangeMatch[2], 10);
                if (start > 0 && end >= start && end - start <= 80) {
                    for (let n = start; n <= end; n++) refs.add(n);
                }
            }
            let chMatch;
            const chRe = /第([0-9零一二两三四五六七八九十百千]+)章/g;
            while ((chMatch = chRe.exec(text))) {
                const parsed = this._parseChineseNumberText(chMatch[1]);
                if (parsed > 0) refs.add(parsed);
            }
            if (/^\d{1,4}$/.test(text.trim())) addNumber(text.trim());
        };
        for (const item of Array.from(arguments)) scan(item);
        return Array.from(refs).sort((a, b) => a - b);
    },

    _resolveExtractedEntityScope(ent, chapters = [], volumes = [], cycles = []) {
        const chapterRefs = this._extractChapterRefs(ent.chapterRef, ent.chapterOrder, ent.chapter, ent.desc);
        const chapterIds = new Set();
        const volumeIds = new Set();
        const cycleIds = new Set();
        const volumeTitle = ent.volume || ent.volumeTitle || '';
        const chapterTitle = ent.chapter || ent.chapterTitle || '';
        const normVolume = this._normalizeScopeTitle(volumeTitle);
        const normChapter = this._normalizeScopeTitle(chapterTitle);

        const addChapter = chapter => {
            if (!chapter || !chapter.id) return;
            chapterIds.add(chapter.id);
            if (chapter.volumeId) volumeIds.add(chapter.volumeId);
        };

        chapters.forEach(chapter => {
            const order = chapter.order || chapter.number || chapter.chapterNum || (Number.isInteger(chapter.index) ? chapter.index + 1 : 0);
            const title = this._normalizeScopeTitle(chapter.title || '');
            if (chapterRefs.includes(order)) addChapter(chapter);
            else if (normChapter && title && (normChapter.includes(title) || title.includes(normChapter))) addChapter(chapter);
            else if (ent.desc && title && this._normalizeScopeTitle(ent.desc).includes(title)) addChapter(chapter);
        });

        volumes.forEach(volume => {
            const title = this._normalizeScopeTitle(volume.title || volume.name || '');
            if (normVolume && title && (normVolume.includes(title) || title.includes(normVolume))) volumeIds.add(volume.id);
        });

        if (!volumeIds.size && chapterRefs.length && volumes.length) {
            const firstRef = chapterRefs[0];
            const volumeByOrder = volumes.find(volume => {
                const start = volume.startChapter || volume.start || 0;
                const end = volume.endChapter || volume.end || 0;
                return start && end && firstRef >= start && firstRef <= end;
            });
            if (volumeByOrder?.id) volumeIds.add(volumeByOrder.id);
        }

        cycles.forEach(cycle => {
            const start = cycle.startChapter || 0;
            const end = cycle.endChapter || 0;
            const cycleChapterIds = cycle.chapterIds || [];
            if (chapterRefs.some(num => start && end && num >= start && num <= end)) cycleIds.add(cycle.id);
            if ([...chapterIds].some(id => cycleChapterIds.includes(id))) cycleIds.add(cycle.id);
        });

        return {
            chapters: Array.from(chapterIds),
            volumes: Array.from(volumeIds),
            cycles: Array.from(cycleIds),
            chapterRef: chapterRefs,
            chapterTitle,
            volumeTitle
        };
    },

    async _saveExtractedEntitiesToWorld(entities, project = null) {
        const now = Date.now();
        const activeProject = project || await GenesisCore.getActiveProject?.();
        const projectId = activeProject?.id || '';
        let added = 0;
        let updated = 0;
        let [existing, chapters, volumes, cycles] = await Promise.all([
            DB.getAll('entities').catch(() => []),
            DB.getAll('chapters').catch(() => []),
            DB.getAll('volumes').catch(() => []),
            DB.getAll('cycles').catch(() => [])
        ]);
        if (projectId && typeof GenesisCore !== 'undefined' && GenesisCore.filterProjectItems) {
            existing = GenesisCore.filterProjectItems(existing || [], projectId);
            chapters = GenesisCore.filterProjectItems(chapters || [], projectId);
            volumes = GenesisCore.filterProjectItems(volumes || [], projectId);
            cycles = GenesisCore.filterProjectItems(cycles || [], projectId);
        }
        const nameMap = new Map();
        existing.forEach(e => {
            if (e && e.name) nameMap.set(String(e.name).toLowerCase().trim(), e);
        });

	        const normalizedEntities = this._filterGraphEntitiesForWorld(entities);
	        for (const ent of normalizedEntities) {
	            const key = ent.name.toLowerCase().trim();
	            const old = nameMap.get(key);
	            const id = old?.id || ('phoenix_ent_' + (typeof Utils !== 'undefined' && Utils.uuid ? Utils.uuid() : now + '_' + Math.random().toString(36).slice(2)));
	            const oldRelations = Array.isArray(old?.relations)
	                ? old.relations
	                : (typeof old?.relations === 'string' ? old.relations.split(',').map(s => s.trim()).filter(Boolean) : []);
	            const allNames = new Set([...normalizedEntities.map(item => item.name), ...Array.from(nameMap.values()).map(item => item?.name).filter(Boolean)]);
	            const relations = this._compactExtractedRelationsForWorld([...oldRelations, ...(ent.relations || [])], allNames, ent.name);
            const desc = this._compactExtractedDesc([old?.desc || '', ent.desc || ''].filter(Boolean).join('\n'), ent);
            const scope = this._resolveExtractedEntityScope(ent, chapters || [], volumes || [], cycles || []);
            const entityData = {
                ...(old || {}),
                id,
                projectId: projectId || old?.projectId || '',
                name: ent.name,
                type: ent.type || old?.type || '其他',
                desc,
                relations,
                chapters: this._asUniqueArray(old?.chapters || [], scope.chapters || []),
                volumes: this._asUniqueArray(old?.volumes || [], scope.volumes || []),
                cycles: this._asUniqueArray(old?.cycles || [], scope.cycles || []),
                chapterRef: this._asUniqueArray(old?.chapterRef || [], ent.chapterRef || [], scope.chapterRef || []),
                chapterTitle: old?.chapterTitle || scope.chapterTitle || ent.chapter || '',
                volumeTitle: old?.volumeTitle || scope.volumeTitle || ent.volume || '',
                chapterTitles: this._asUniqueArray(old?.chapterTitles || [], scope.chapterTitle || ent.chapter || ''),
                volumeTitles: this._asUniqueArray(old?.volumeTitles || [], scope.volumeTitle || ent.volume || ''),
                state: ent.state || old?.state || '',
                risk: ent.risk || old?.risk || '',
                source: old?.source || 'phoenix_extract',
                updatedAt: now
            };
            if (typeof GenesisCore !== 'undefined' && GenesisCore.stampProjectRecord) GenesisCore.stampProjectRecord(entityData, projectId);
            await DB.put('entities', entityData);
            try {
                await DB.put('vectors', {
                    id,
                    content: `[${entityData.type}] ${entityData.name}: ${entityData.desc}`,
                    vector: Array.from({length: 1536}, () => Math.random()),
                    timestamp: now,
                    source: 'phoenix_extract',
                    projectId,
                    entityName: entityData.name,
                    entityType: entityData.type,
                    chapters: entityData.chapters,
                    volumes: entityData.volumes,
                    chapterRef: entityData.chapterRef
                });
            } catch(e) {}
            try {
                if (typeof MemorySystem !== 'undefined') {
                    MemorySystem.addWorking(`[从零写一本/知识图谱] ${entityData.type} ${entityData.name}: ${entityData.desc}`, 'phoenix_graph', 4, {
                        module: 'phoenix',
                        tags: ['从零写一本', '知识图谱', entityData.type],
                        source: 'phoenix_extract'
                    });
                }
            } catch(e) {}
            if (old) updated++; else added++;
            nameMap.set(key, entityData);
        }

        if (Modules.world_engine) {
            Modules.world_engine._cachedEntities = null;
            Modules.world_engine._cachedLayeredGraphs = null;
            try { await Modules.world_engine._ensureCache?.(); } catch(e) {}
            try { await Modules.world_engine.rebuildLayeredGraphs?.('phoenix_outline_extract', { silent: true }); } catch(e) {}
            try { Modules.world_engine._refreshDashboard?.(); } catch(e) {}
            try { Modules.world_engine._refreshEntities?.(); } catch(e) {}
            if (Modules.world_engine.currentTab === 'graph') {
                try { setTimeout(() => Modules.world_engine._initGraph?.(), 100); } catch(e) {}
            }
        }
        return { added, updated, total: added + updated };
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
                                <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30 w-full" onclick="Modules.phoenix.syncExtractedEntitiesToWorld()"><i class="fa-solid fa-atom mr-1"></i>同步实体</button>
                                <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30 w-full" onclick="Modules.phoenix.syncExtractedEntitiesToWorld()"><i class="fa-solid fa-circle-nodes mr-1"></i>同步图谱</button>
                            </div>
                            <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30 w-full" onclick="Modules.phoenix.syncExtractedEntitiesToWorld()"><i class="fa-solid fa-atom mr-1"></i>同步到世界引擎</button>
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
	只提取能画成知识图谱节点的要素点，不要提取整句剧情摘要、上下文记忆、情绪锚点、写作技法。
	请提取以下类型的信息：
	1. 人物 - 角色名、身份、性格、外貌、能力、背景
	2. 物品 - 武器、法宝、道具、关键物件
	3. 地点 - 场景、城市、秘境、地标
	4. 势力 - 门派、组织、阵营、国家
	5. 种族 - 种族、族群、特殊生物
	6. 能力/魔法 - 功法、技能、法术体系
	7. 世界规则 - 世界运行规则、力量等级
	8. 文化 - 风俗、信仰、语言、节日
	9. 历史 - 历史事件、传说、纪元

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
	    {"name":"实体名","type":"类型","desc":"要素卡(30-80字)","relations":["关系:关联实体"]}
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

	实体名必须是短名词；relations只保留3-8条关键关系，且只能指向实体名。
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
