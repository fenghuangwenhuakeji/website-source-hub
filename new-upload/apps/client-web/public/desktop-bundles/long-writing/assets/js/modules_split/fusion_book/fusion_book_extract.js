Object.assign(Modules.fusion_book, {
    plPreview(key) {
        const labels = { left: '左书分析', right: '右书分析', compare: '对比分析', fusion: '融合精华', outline: '细纲', world: '实体提取', write: '正文' };
        const content = this._pipelineResults[key];
        if (!content) return UI.toast(labels[key] + '暂无数据');
        const outEl = document.getElementById('pl-output');
        if (outEl) outEl.textContent = content;
        const titleEl = document.getElementById('pl-current-title');
        if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-eye mr-1 text-cyan-400"></i>预览: ${labels[key]} (${content.length}字)`;
        const charsEl = document.getElementById('pl-current-chars');
        if (charsEl) charsEl.textContent = content.length + '字';
    },

    _plSetStep(key, state, info) {
        const dot = document.getElementById('pl-d-' + key);
        const row = document.getElementById('pl-s-' + key);
        const infoEl = document.getElementById('pl-i-' + key);
        if (dot) {
            dot.className = 'w-1.5 h-1.5 rounded-full shrink-0 ' + (
                state === 'active' ? 'bg-amber-400 animate-pulse' :
                state === 'done' ? 'bg-green-400' :
                state === 'error' ? 'bg-red-400' : 'bg-white/20'
            );
        }
        if (row) {
            row.className = 'flex items-center gap-1.5 px-2.5 py-2 rounded-lg border cursor-pointer transition-all ' + (
                row.classList.contains('col-span-2') ? 'col-span-2 ' : ''
            ) + (
                state === 'active' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                state === 'done' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                state === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-white/[0.02] border-white/5 hover:bg-white/5'
            );
        }
        if (infoEl) infoEl.textContent = info || '';
        // 同步字数到输出头
        if (state === 'done' || state === 'active') {
            const charsEl = document.getElementById('pl-current-chars');
            if (charsEl && info) charsEl.textContent = info;
        }
    },

    _plLog(msg, type) {
        const log = document.getElementById('pl-log');
        if (!log) return;
        const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const color = type === 'ok' ? 'text-green-400' : type === 'err' ? 'text-red-400' : type === 'entity' ? 'text-cyan-400' : 'text-blue-400';
        log.innerHTML += `<div class="flex gap-2"><span class="text-white/30 shrink-0">${time}</span><span class="${color}">${msg}</span></div>`;
        log.scrollTop = log.scrollHeight;
    },

    async _getWorkbenchEntitySnapshots() {
        const assets = await DB.getAll('assets').catch(() => []) || [];
        return assets
            .filter(a => a.type === 'fusion_entity' || a.id?.startsWith('fusion_entity_'))
            .map(a => ({
                id: a.id,
                name: a.name || a.entity?.name,
                type: a.entityType || a.entity?.type || '其他',
                desc: a.desc || a.entity?.desc || a.entity?.description || a.content || '',
                relations: Array.isArray(a.relations || a.entity?.relations) ? (a.relations || a.entity?.relations) : [],
                source: 'fusion_workbench',
                chapterRef: a.chapterRef || [],
                cycleId: a.cycleId || ''
            }))
            .filter(e => e.name);
    },

    // ---- 世界引擎一致性桥 ----

    /**
     * 从世界引擎构建全局一致性上下文
     * 包含：世界观维度、已出场角色、地点、势力、力量体系、伏笔追踪、情绪弧线
     */
    async _buildConsistencyContext() {
        const allEntities = await DB.getAll('entities') || [];
        const stagedEntities = await this._getWorkbenchEntitySnapshots();
        const pipelineEntities = [
            ...allEntities.filter(e => e.source === 'pipeline' || e.source === 'world' || e.source === 'fusion_workbench'),
            ...stagedEntities
        ];

        // 分类整理实体
        const characters = pipelineEntities.filter(e => e.type === '人物').map(e => ({
            name: e.name, desc: (e.desc || '').slice(0, 150), relations: e.relations || []
        }));
        const locations = pipelineEntities.filter(e => e.type === '地点').map(e => ({
            name: e.name, desc: (e.desc || '').slice(0, 100)
        }));
        const factions = pipelineEntities.filter(e => e.type === '势力').map(e => ({
            name: e.name, desc: (e.desc || '').slice(0, 100)
        }));
        const magic = pipelineEntities.filter(e => ['魔法','规则','功法'].includes(e.type)).map(e => ({
            name: e.name, type: e.type, desc: (e.desc || '').slice(0, 100)
        }));
        const items = pipelineEntities.filter(e => e.type === '物品').map(e => ({
            name: e.name, desc: (e.desc || '').slice(0, 80)
        }));
        const plots = pipelineEntities.filter(e => e.type === '情节').map(e => ({
            name: e.name, desc: (e.desc || '').slice(0, 100)
        }));

        // 获取世界观维度
        const worldCats = {
            history: '历史与传说', geography: '地理与地貌', magic: '魔法/科技体系',
            factions: '势力与组织', species: '种族与生物', rules: '世界规则', culture: '文化与习俗'
        };
        let worldDimText = '';
        for (const [key, label] of Object.entries(worldCats)) {
            const ent = await DB.get('entities', 'world_' + key);
            if (ent && ent.desc) worldDimText += `[${label}] ${ent.desc.slice(0, 300)}\n`;
        }

        // 从所有已处理细纲中提取伏笔和情绪
        const allOutlines = this._allPipelineResults.outline || '';
        const foreshadowing = this._extractForeshadowing(allOutlines);
        const emotionCurve = this._extractEmotionCurve(allOutlines);

        let ctx = '';
        if (worldDimText) {
            ctx += `=== 【世界观维度——绝对不可更改】 ===\n${worldDimText}\n`;
        }
        if (characters.length) {
            ctx += `=== 【已出场角色——性格/能力/关系不可擅自改变】 ===\n`;
            characters.slice(0, 25).forEach(c => {
                ctx += `- ${c.name}: ${c.desc}${c.relations.length ? ' | 关系: ' + c.relations.slice(0, 3).join(', ') : ''}\n`;
            });
            ctx += '\n';
        }
        if (locations.length) {
            ctx += `=== 【已建立地点——地理关系不可矛盾】 ===\n`;
            locations.slice(0, 15).forEach(l => ctx += `- ${l.name}: ${l.desc}\n`);
            ctx += '\n';
        }
        if (factions.length) {
            ctx += `=== 【势力格局——关系不可擅自改变】 ===\n`;
            factions.slice(0, 10).forEach(f => ctx += `- ${f.name}: ${f.desc}\n`);
            ctx += '\n';
        }
        if (magic.length) {
            ctx += `=== 【力量体系/规则——设定不可矛盾】 ===\n`;
            magic.slice(0, 10).forEach(m => ctx += `- ${m.name}(${m.type}): ${m.desc}\n`);
            ctx += '\n';
        }
        if (items.length) {
            ctx += `=== 【关键物品——归属/功能不可矛盾】 ===\n`;
            items.slice(0, 10).forEach(i => ctx += `- ${i.name}: ${i.desc}\n`);
            ctx += '\n';
        }
        if (plots.length) {
            ctx += `=== 【已发生情节——时间线不可逆】 ===\n`;
            plots.slice(0, 10).forEach(p => ctx += `- ${p.name}: ${p.desc}\n`);
            ctx += '\n';
        }
        if (foreshadowing.pending.length) {
            ctx += `=== 【待回收伏笔——必须按计划回收】 ===\n`;
            foreshadowing.pending.slice(0, 15).forEach(f => ctx += `- [待回收] ${f}\n`);
            ctx += '\n';
        }
        if (foreshadowing.resolved.length) {
            ctx += `=== 【已回收伏笔——不可重复回收】 ===\n`;
            foreshadowing.resolved.slice(0, 10).forEach(f => ctx += `- [已回收] ${f}\n`);
            ctx += '\n';
        }
        if (emotionCurve.length) {
            ctx += `=== 【情绪弧线——不可突兀跳变】 ===\n`;
            const recent = emotionCurve.slice(-10);
            ctx += `最近${recent.length}章情绪走势: ${recent.map(e => `${e.chapter}(${e.score})`).join(' → ')}\n`;
            ctx += `当前情绪位置: ${recent[recent.length - 1]?.score || 'N/A'}/10\n\n`;
        }

        ctx += `=== 【一致性铁律——违反即重写】 ===\n`;
        ctx += `1. 世界观维度（历史/地理/魔法/势力/种族/规则/文化）绝对不可更改\n`;
        ctx += `2. 已出场角色的性格、能力、身份、关系网络不可擅自改变\n`;
        ctx += `3. 已建立地点的名称、地理关系、功能不可矛盾\n`;
        ctx += `4. 势力格局（阵营关系、权力结构）不可擅自改变\n`;
        ctx += `5. 力量体系/规则的运作逻辑不可矛盾\n`;
        ctx += `6. 待回收伏笔必须在合适章节回收，已回收伏笔不可重复\n`;
        ctx += `7. 情绪曲线必须符合整体走势，禁止突兀跳变（相邻章情绪差≤3分）\n`;
        ctx += `8. 新出场角色/地点/物品不可与已有实体重名（除非是同一人/地/物）\n`;
        ctx += `9. 关键物品的功能、归属权改变必须有合理铺垫\n`;
        ctx += `10. 已发生情节的时间线不可逆，后续剧情必须在此基础上发展\n`;

        return ctx.slice(0, 8000);
    },

    /**
     * 从所有已处理细纲中提取伏笔状态
     */
    _extractForeshadowing(allOutlines) {
        const pending = [];
        const resolved = [];
        if (!allOutlines) return { pending, resolved };

        const lines = allOutlines.split('\n');
        for (const line of lines) {
            // 提取待回收伏笔（多种表述）
            const p1 = line.match(/(?:待回收|未回收|未揭晓|待揭晓|新埋设|新伏笔|悬念待解|留待后续).*?[：:]\s*(.+)/i);
            const p2 = line.match(/(?:伏笔|悬念|线索|暗示).*?(?:待回收|未回收|待揭晓|后续揭晓).*?[：:]\s*(.+)/i);
            const p3 = line.match(/(?:埋设|铺设|埋下|留).*?(?:伏笔|悬念|钩子).*?[：:]\s*(.+)/i);
            const match = p1 || p2 || p3;
            if (match && match[1].trim().length > 3) {
                const text = match[1].trim().slice(0, 100);
                if (!pending.includes(text) && !resolved.includes(text)) pending.push(text);
            }

            // 提取已回收伏笔
            const r1 = line.match(/(?:已回收|已揭晓|已呼应|已揭晓|回收|揭晓|呼应).*?[：:]\s*(.+)/i);
            const r2 = line.match(/(?:伏笔|悬念|线索).*?(?:已回收|已揭晓|已呼应).*?[：:]\s*(.+)/i);
            const rMatch = r1 || r2;
            if (rMatch && rMatch[1].trim().length > 3) {
                const text = rMatch[1].trim().slice(0, 100);
                const idx = pending.indexOf(text);
                if (idx !== -1) pending.splice(idx, 1);
                if (!resolved.includes(text)) resolved.push(text);
            }
        }
        return { pending, resolved };
    },

    /**
     * 从所有已处理细纲中提取情绪曲线
     */
    _extractEmotionCurve(allOutlines) {
        const curve = [];
        if (!allOutlines) return curve;

        // 按章节分块（匹配 "### 第X章" 或 "## 第X章" 或数字章节）
        const blocks = allOutlines.split(/(?:###|##)\s*第[一二三四五六七八九十\d]+章|第[一二三四五六七八九十\d]+章[：:]/);
        let chapterNum = 0;

        for (const block of blocks) {
            chapterNum++;
            const scoreM = block.match(/emotion_score[：:]?\s*(\d+)/i) ||
                          block.match(/情绪分[值数]?[：:]?\s*(\d+)/i) ||
                          block.match(/情绪.*?[:：]\s*(\d+)\s*\/\s*10/i) ||
                          block.match(/EMO[：:]?\s*(\d+)/i);
            const score = scoreM ? Math.min(10, Math.max(1, parseInt(scoreM[1]))) : null;

            const hookM = block.match(/hook_type[：:]?\s*(.+)/i) ||
                         block.match(/钩子[类型]?[：:]?\s*(.+)/i) ||
                         block.match(/钩子.*?[:：]\s*(.+)/i);
            const hook = hookM ? hookM[1].trim().slice(0, 30) : '';

            const tensionM = block.match(/tension_level[：:]?\s*(\d+)/i) ||
                            block.match(/张力[等级]?[：:]?\s*(\d+)/i) ||
                            block.match(/张力.*?[:：]\s*(\d+)/i);
            const tension = tensionM ? Math.min(10, Math.max(1, parseInt(tensionM[1]))) : null;

            if (score !== null || tension !== null) {
                curve.push({ chapter: chapterNum, score: score || 5, hook, tension: tension || 5 });
            }
        }
        return curve;
    },

    // ---- 流水线子步骤 ----
    _isCreativeFlow() {
        return this._plConfig?.flowMode === 'creative';
    },

    _normalizeRelations(value) {
        if (Array.isArray(value)) return value.map(r => typeof r === 'string' ? r : String(r || '')).filter(Boolean);
        if (typeof value === 'string') return value.split(/[,\n，、]/).map(s => s.trim()).filter(Boolean);
        return [];
    },

    _asArray(value) {
        if (Array.isArray(value)) return value.filter(v => v !== undefined && v !== null && v !== '');
        if (value === undefined || value === null || value === '') return [];
        return [value];
    },

    _extractCreativeChapterTitle(outline, chapterNum = 1) {
        const text = String(outline || '');
        const candidates = [
            text.match(/章节标题[：:\s]*["“]?([^\n"”]+)/),
            text.match(/^#{1,6}\s*([^\n]{2,60})/m),
            text.match(/^\s*(第\s*[0-9一二三四五六七八九十百千万零〇两]+\s*章[^\n]*)/m)
        ].filter(Boolean);
        let title = candidates[0]?.[1] || '';
        title = String(title)
            .replace(/^\s*[-*0-9.、）)]+\s*/, '')
            .replace(/\*\*/g, '')
            .replace(/[《》"“”]/g, '')
            .trim()
            .slice(0, 60);
        if (!title) return `第${chapterNum}章`;
        if (/第\s*[0-9一二三四五六七八九十百千万零〇两]+\s*章/.test(title)) return title;
        return `第${chapterNum}章 ${title}`;
    },

    async _requireCreativeProject() {
        const project = typeof GenesisCore !== 'undefined'
            ? await GenesisCore.requireActiveProject('创作融合需要先创建或选择一个项目，细纲/正文会直接写入执笔台')
            : null;
        if (!project) throw new Error('未选择项目，无法写入执笔台/世界引擎');
        return project;
    },

    async _ensureCreativeVolumeForChapter(chapterNum, project) {
        const volumeOrder = Math.max(1, Math.ceil((parseInt(chapterNum, 10) || 1) / 5));
        const startChapter = (volumeOrder - 1) * 5 + 1;
        const endChapter = volumeOrder * 5;
        const title = `第${volumeOrder}卷 第${startChapter}-${endChapter}章`;
        const allVolumes = await DB.getAll('volumes').catch(() => []) || [];
        const scoped = typeof GenesisCore !== 'undefined'
            ? GenesisCore.filterProjectItems(allVolumes, project.id)
            : allVolumes;
        let existing = scoped.find(v => (v.source === 'fusion_creative_pipeline' || v.fusionCreative) && (v.order || 0) === volumeOrder);
        if (!existing) existing = scoped.find(v => (v.order || 0) === volumeOrder && String(v.title || v.name || '') === title);
        const now = Date.now();
        const payload = {
            ...(existing || {}),
            id: existing?.id || Utils.uuid(),
            title,
            name: title,
            order: volumeOrder,
            source: 'fusion_creative_pipeline',
            fusionCreative: true,
            startChapter,
            endChapter,
            outline: existing?.outline || `创作融合自动分卷：第${startChapter}-${endChapter}章。`,
            createdAt: existing?.createdAt || now,
            updatedAt: now
        };
        if (typeof GenesisCore !== 'undefined') GenesisCore.stampProjectRecord(payload, project.id);
        await DB.put('volumes', payload);
        return payload;
    },

    async _ensureCreativeWriterChapter({ outline = '', content = '', title = '' } = {}) {
        const project = await this._requireCreativeProject();
        const acc = this._accContext || {};
        const chapterNum = acc.chapterNum || ((this.left?.chapterIdx ?? 0) + 1);
        const generatedTitle = String(title || this._extractCreativeChapterTitle(outline, chapterNum))
            .replace(/\*\*/g, '')
            .trim();
        const volume = await this._ensureCreativeVolumeForChapter(chapterNum, project);
        const allChapters = await DB.getAll('chapters').catch(() => []) || [];
        const scoped = typeof GenesisCore !== 'undefined'
            ? GenesisCore.filterProjectItems(allChapters, project.id)
            : allChapters;
        const cycleKey = `fusion_creative_${this.left?.bookId || 'left'}_${this.left?.chapterIdx ?? chapterNum - 1}_${this.right?.bookId || 'right'}_${this.right?.chapterIdx ?? chapterNum - 1}`;
        let existing = scoped.find(c => c.fusionCycleKey === cycleKey || c.sourceFusionKey === cycleKey);
        if (!existing) existing = scoped.find(c => (c.source === 'fusion_creative_pipeline' || c.fusionCreative) && (c.order || c.number) === chapterNum);
        if (!existing) existing = scoped.find(c => (c.order || c.number) === chapterNum && !(c.content || '').trim());
        const now = Date.now();
        const payload = {
            ...(existing || {}),
            id: existing?.id || Utils.uuid(),
            title: generatedTitle,
            outline: outline || existing?.outline || '',
            content: content || existing?.content || '',
            volumeId: volume.id,
            volumeTitle: volume.title,
            order: chapterNum,
            number: chapterNum,
            status: content ? 'draft' : (existing?.status || 'outline'),
            source: 'fusion_creative_pipeline',
            fusionCreative: true,
            fusionCycleKey: cycleKey,
            sourceFusionKey: cycleKey,
            leftBookId: this.left?.bookId || '',
            rightBookId: this.right?.bookId || '',
            leftChapterIndex: this.left?.chapterIdx ?? null,
            rightChapterIndex: this.right?.chapterIdx ?? null,
            targetWords: existing?.targetWords || 2500,
            createdAt: existing?.createdAt || now,
            updatedAt: now
        };
        if (typeof GenesisCore !== 'undefined') GenesisCore.stampProjectRecord(payload, project.id);
        await DB.put('chapters', payload);
        this._lastCreativeChapterId = payload.id;
        if (Modules.writer) Modules.writer.currentVolumeId = volume.id;
        try { await Modules.writer?.loadTree?.(); } catch(e) {}
        return payload;
    },

    async _writeExtractedEntitiesToWorld(entities, { raw = '' } = {}) {
        const project = await this._requireCreativeProject();
        const acc = this._accContext || {};
        const chapterNum = acc.chapterNum || ((this.left?.chapterIdx ?? 0) + 1);
        const chapter = this._lastCreativeChapterId ? await DB.get('chapters', this._lastCreativeChapterId).catch(() => null) : null;
        const chapterId = chapter?.id || '';
        const now = Date.now();
        const typeMap = {
            technique: '技法',
            character_template: '人物',
            conflict_model: '情节',
            rhythm: '技法',
            hook: '技法',
            location: '地点',
            faction: '势力',
            item: '物品',
            magic: '魔法',
            rule: '规则'
        };
        const allEntities = await DB.getAll('entities').catch(() => []) || [];
        const scoped = typeof GenesisCore !== 'undefined'
            ? GenesisCore.filterProjectItems(allEntities, project.id)
            : allEntities;
        const byNameType = new Map();
        scoped.forEach(e => byNameType.set(`${String(e.name || '').trim()}::${e.type || '其他'}`, e));

        let added = 0, updated = 0;
        for (const ent of (Array.isArray(entities) ? entities : [])) {
            if (!ent || !ent.name) continue;
            const type = typeMap[ent.type] || ent.type || '其他';
            const key = `${String(ent.name || '').trim()}::${type}`;
            const existing = byNameType.get(key);
            const desc = ent.description || ent.desc || '';
            const relations = this._normalizeRelations(ent.relations);
            const existingRelations = this._normalizeRelations(existing?.relations);
            const mergedRelations = [...new Set([...existingRelations, ...relations])];
            const oldDesc = existing?.desc || '';
            const nextDesc = oldDesc && desc && !oldDesc.includes(desc)
                ? `${oldDesc}\n\n[第${chapterNum}章更新]\n${desc}`.slice(0, 4000)
                : (oldDesc || desc || '').slice(0, 4000);
            const payload = {
                ...(existing || {}),
                id: existing?.id || Utils.uuid(),
                name: ent.name,
                type,
                desc: nextDesc,
                relations: mergedRelations,
                tags: [...new Set([...(existing?.tags || []), '创作融合', '自动提取'])],
                source: existing?.source || 'fusion_creative_pipeline',
                chapters: [...new Set([...this._asArray(existing?.chapters), chapterId].filter(Boolean))],
                chapterRef: [...new Set([...this._asArray(existing?.chapterRef), chapterNum].filter(Boolean))],
                chapterTitle: existing?.chapterTitle || chapter?.title || '',
                chapterTitles: [...new Set([...this._asArray(existing?.chapterTitles), chapter?.title].filter(Boolean))],
                sourceChapterId: chapterId,
                updatedAt: now
            };
            if (typeof GenesisCore !== 'undefined') GenesisCore.stampProjectRecord(payload, project.id);
            await DB.put('entities', payload);
            byNameType.set(key, payload);
            if (existing) updated++; else added++;
            try {
                await DB.put('vectors', {
                    id: payload.id,
                    content: `[${payload.type}] ${payload.name}: ${payload.desc || ''}\n来源：创作融合第${chapterNum}章 ${chapter?.title || ''}`,
                    vector: Array.from({ length: 1536 }, () => Math.random()),
                    timestamp: now,
                    source: 'fusion_creative_entity_extract',
                    chapterId,
                    chapterRef: [chapterNum]
                });
            } catch(e) {}
            this._plLog(`  → 世界引擎 ${existing ? '更新' : '新增'} ${type}: ${ent.name}`, 'entity');
        }

        if (Modules.world_engine) {
            Modules.world_engine._cachedEntities = null;
            Modules.world_engine._cachedLayeredGraphs = null;
            try { await Modules.world_engine.rebuildLayeredGraphs?.('fusion_creative_extract', { silent: true }); } catch(e) {}
            try { await Modules.world_engine._ensureCache?.(); } catch(e) {}
            try { Modules.world_engine._refreshDashboard?.(); } catch(e) {}
            try { Modules.world_engine._refreshEntities?.(); } catch(e) {}
            try { Modules.world_engine._initGraph?.(); } catch(e) {}
        }
        if (typeof RAGSystem !== 'undefined' && raw) {
            try { await RAGSystem.addDocument(`创作实体_第${chapterNum}章`, raw.slice(0, 6000), 'world_engine', { chapterId }); } catch(e) {}
        }
        return { added, updated, total: added + updated };
    },

    async _pipelineExtractEntities() {
        const fusion = this._pipelineResults.fusion || '';
        const outline = this._pipelineResults.outline || '';
        const write = this._pipelineResults.write || '';
        const storyText = (outline + '\n' + write).trim();
        const isStorySource = !!storyText;
        const creativeTarget = this._isCreativeFlow() && isStorySource;
        const sourceText = (isStorySource ? (fusion + '\n' + storyText) : fusion).slice(0, 8000);
        if (!sourceText.trim()) return;

        // 获取已有实体名称，让AI建立关联
        const existingEntities = await DB.getAll('entities') || [];
        const stagedEntities = await this._getWorkbenchEntitySnapshots();
        const existingNames = [
            ...existingEntities.filter(e => !String(e.id || '').startsWith('world_')).map(e => e.name),
            ...stagedEntities.map(e => e.name)
        ].filter(Boolean);
        const existingHint = existingNames.length ? `\n\n【已有实体(请在relations中引用这些名称建立关联)】\n${existingNames.slice(0,50).join('、')}` : '';

        const outEl = document.getElementById('pl-output');
        if (outEl) outEl.textContent = isStorySource ? '正在提取细纲/正文中的实体...' : '正在提取拆书弹药技法节点...';
        this._setGenerating(true);

        let raw = '';
        try {
            const entityGuard = this._withDirectionGuard ? this._withDirectionGuard('', '实体提取') : '';
            const storyPrompt = `你是深度实体提取引擎。
【核心任务】从以下细纲/正文中提取原创实体、世界观元素、伏笔、规则和关系，${creativeTarget ? '直接写入世界引擎，供执笔台后续章节调用。' : '暂存到拆书弹药库；由用户确认后再入世界引擎。'}

【数据来源说明】
以下内容来自当前新书的细纲或正文，不是原书内容。融合拆书内容只作为技法来源，不能被当作新书事实。

${sourceText}
${existingHint}

【提取铁律】
1. 只提取当前新书已经明确出现或细纲明确规划的实体，不要凭空扩写
2. 人物、物品、地点、势力、规则、伏笔必须建立关系
3. 如果只有技法描述，不要伪造人物和世界观
4. 直接输出纯JSON数组，不要markdown

【提取类型】
- 人物：所有角色，含身份、欲望、限制、关系
- 物品：道具、武器、法宝、关键物件
- 地点：地名、场景、建筑、地标
- 情节：关键事件、转折点、冲突
- 伏笔：暗示、线索、未解之谜
- 势力：门派、组织、国家、阵营、家族
- 种族：种族设定、族群特征
- 魔法：功法、技能、法术、科技体系、修炼等级
- 规则：世界法则、力量体系、禁忌
- 文化：风俗、社会制度、信仰
- 历史：历史事件、传说、纪元
- 技法：本章明确采用的写作套路、节奏模型、钩子公式

【输出格式】JSON数组：
[{"name":"名称","type":"人物/物品/地点/情节/伏笔/势力/种族/魔法/规则/文化/历史/技法","description":"50-200字描述","relations":["关系类型:关联实体名"]}]

【关系要求】
- relations尽可能引用已有实体或本次实体
- 关系格式："关系类型:实体名"
- 直接输出纯JSON数组，禁止输出任何非JSON文本。`;
            const ammoPrompt = `你是写作技法入库引擎。
【核心任务】当前内容是拆书融合弹药，不是新书细纲。只能提取可复用技法节点，暂存到拆书弹药库。

${sourceText}
${existingHint}

【提取铁律】
1. 只允许输出 type 为 "技法"、"规则"、"伏笔"、"情节" 的抽象节点
2. 禁止编造人物、地点、势力、物品、种族、魔法体系
3. description写清适用场景、执行步骤、避坑
4. relations用于连接已有技法、当前方向护栏或适用场景
5. 直接输出纯JSON数组，不要markdown

【输出格式】JSON数组：
[{"name":"技法名称","type":"技法/规则/伏笔/情节","description":"50-200字描述","relations":["适用:场景","约束:方向护栏"]}]

禁止输出任何非JSON文本。`;
            await AI.generate(
                entityGuard + (isStorySource ? storyPrompt : ammoPrompt),
                {
                    apiType: isStorySource ? 'parse' : 'fusion',
                    module: isStorySource ? 'fusion_story_entities' : 'fusion_ammo_entities'
                }, c => {
                    raw += c;
                    if (outEl) outEl.textContent = raw;
                }
            );
        } catch(e) {
            if (e.message === '已中止') { this._setGenerating(false); throw e; }
            this._plLog('实体提取AI调用失败: ' + e.message, 'err');
            this._setGenerating(false);
            return;
        }
        this._setGenerating(false);

        // ═══ 解析JSON（6层容错，健壮解析） ═══
        let entities = [];
        // 预处理: 先去掉markdown代码块包裹
        let cleanRaw = raw.trim();
        cleanRaw = cleanRaw.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '').trim();

        // 尝试1: 直接解析
        try { entities = JSON.parse(cleanRaw); } catch(e1) {
            // 尝试2: 提取最外层 [...] 
            try {
                const start = cleanRaw.indexOf('[');
                const end = cleanRaw.lastIndexOf(']');
                if (start !== -1 && end > start) {
                    entities = JSON.parse(cleanRaw.slice(start, end + 1));
                }
            } catch(e2) {
                // 尝试3: 修复常见JSON问题（尾部逗号、单引号、中文引号、零宽字符）
                // 注意: 不做 \n→\\n 替换，那会破坏字符串内已有的合法换行
                try {
                    let fixed = cleanRaw;
                    const s = fixed.indexOf('[');
                    const e = fixed.lastIndexOf(']');
                    if (s !== -1 && e > s) fixed = fixed.slice(s, e + 1);
                    fixed = fixed.replace(/,\s*([}\]])/g, '$1');  // 尾部逗号
                    fixed = fixed.replace(/'/g, '"');              // 单引号→双引号
                    fixed = fixed.replace(/[""]/g, '"');           // 中文引号→英文引号
                    fixed = fixed.replace(/[\u200B-\u200D\uFEFF]/g, ''); // 零宽字符
                    // 安全处理换行: 只替换JSON字符串值内部的裸换行
                    fixed = fixed.replace(/"([^"]*)\n([^"]*)"/g, (m) => m.replace(/\n/g, '\\n'));
                    entities = JSON.parse(fixed);
                } catch(e3) {
                    // 尝试4: 逐行拼接修复 — 逐个JSON对象提取（支持含数组的对象）
                    try {
                        // 匹配 { ... } 对象，允许内部有 [...] 数组
                        const objMatches = cleanRaw.match(/\{(?:[^{}]|\{[^{}]*\})*"name"\s*:\s*"[^"]+?"(?:[^{}]|\[[^\]]*\]|\{[^{}]*\})*\}/g);
                        if (objMatches && objMatches.length) {
                            entities = [];
                            for (const objStr of objMatches) {
                                try {
                                    let fixedObj = objStr
                                        .replace(/,\s*}/g, '}').replace(/,\s*\]/g, ']')
                                        .replace(/'/g, '"').replace(/[""]/g, '"');
                                    // 安全处理字符串内换行
                                    fixedObj = fixedObj.replace(/"([^"]*)\n([^"]*)"/g, (m) => m.replace(/\n/g, '\\n'));
                                    entities.push(JSON.parse(fixedObj));
                                } catch(e) {
                                    // 正则提取核心字段
                                    const nameM = objStr.match(/"name"\s*:\s*"([^"]+?)"/);
                                    const typeM = objStr.match(/"type"\s*:\s*"([^"]+?)"/);
                                    const descM = objStr.match(/"desc(?:ription)?"\s*:\s*"([\s\S]*?)"/);
                                    // 提取relations数组
                                    const relM = objStr.match(/"relations"\s*:\s*\[([\s\S]*?)\]/);
                                    let relations = [];
                                    if (relM) {
                                        relations = relM[1].match(/"([^"]+?)"/g);
                                        if (relations) relations = relations.map(r => r.replace(/"/g, ''));
                                        else relations = [];
                                    }
                                    if (nameM) {
                                        entities.push({
                                            name: nameM[1],
                                            type: typeM ? typeM[1] : '其他',
                                            description: descM ? descM[1] : '',
                                            relations: relations
                                        });
                                    }
                                }
                            }
                            if (entities.length) this._plLog(`JSON修复: 正则提取到 ${entities.length} 个实体`, 'info');
                        }
                    } catch(e4) {}
                    
                    // 尝试5: 最后手段 — 逐行扫描name/type/desc
                    if (!entities.length) {
                        try {
                            const lines = cleanRaw.split('\n');
                            let current = null;
                            for (const line of lines) {
                                const nm = line.match(/"name"\s*:\s*"([^"]+)"/);
                                if (nm) {
                                    if (current && current.name) entities.push(current);
                                    current = { name: nm[1], type: '其他', description: '', relations: [] };
                                }
                                if (current) {
                                    const tm = line.match(/"type"\s*:\s*"([^"]+)"/);
                                    if (tm) current.type = tm[1];
                                    const dm = line.match(/"desc(?:ription)?"\s*:\s*"([^"]+)"/);
                                    if (dm) current.description = dm[1];
                                }
                            }
                            if (current && current.name) entities.push(current);
                            if (entities.length) this._plLog(`JSON修复: 逐行扫描提取到 ${entities.length} 个实体`, 'info');
                        } catch(e5) {}
                    }

                    if (!entities.length) {
                        this._plLog('实体JSON解析失败，原始文本已保存', 'err');
                    }
                }
            }
        }

        if (!Array.isArray(entities)) entities = [entities];

        const now = Date.now();
        if (creativeTarget) {
            const sync = await this._writeExtractedEntitiesToWorld(entities, { raw, sourceText });
            const chNum = (this._accContext || {}).chapterNum;
            this._pipelineResults.world = raw.slice(0, 4000);
            this._allPipelineResults.world = (this._allPipelineResults.world || '') + `\n[第${chNum || '?'}章] 世界引擎新增${sync.added || 0}/更新${sync.updated || 0}\n`;
            this._plLog(`世界引擎: 新增 ${sync.added || 0} 个，更新 ${sync.updated || 0} 个实体/规则/伏笔`, 'ok');
            return sync;
        }

        // 暂存到拆书弹药库，不直接写入世界引擎。需要时在弹药库点击「入世界」发布。
        let count = 0;
        const stagedAssets = await DB.getAll('assets').catch(() => []) || [];
        let currentCycleId = null;
        const chNum = (this._accContext || {}).chapterNum;
        if(this._plConfig.cycleMode && chNum) {
            const cycleSize = Math.max(1, parseInt(this._plConfig.cycleSize || 5, 10));
            const start = Math.floor((chNum - 1) / cycleSize) * cycleSize + 1;
            currentCycleId = `cycle_${start}_${start + cycleSize - 1}`;
        }
        for (const ent of entities) {
            if (!ent || !ent.name) continue;
            const typeMap = { technique:'技法', character_template:'人物', conflict_model:'情节', rhythm:'技法', hook:'技法' };
            const type = typeMap[ent.type] || ent.type || '技法';
            // ★ 确保relations是字符串数组
            let relations = ent.relations || [];
            if(!Array.isArray(relations)) relations = [];
            relations = relations.map(r => typeof r === 'string' ? r : String(r)).filter(Boolean);

            const existing = stagedAssets.find(a =>
                (a.type === 'fusion_entity' || a.id?.startsWith('fusion_entity_')) &&
                a.name === ent.name &&
                (a.entityType || a.entity?.type || '其他') === type &&
                !a.publishedEntityId
            );
            const entityPayload = {
                name: ent.name, type: type,
                desc: ent.description || ent.desc || '',
                relations: relations,
                tags: ent.tags || ['融合', '流水线', '工作台暂存'],
                source: 'fusion_workbench',
                sourceBook: isStorySource ? '融合细纲/正文原创' : '融合拆书弹药',
                updatedAt: now
            };
            if(currentCycleId) entityPayload.cycles = [currentCycleId];
            await DB.put('assets', {
                ...(existing || {}),
                id: existing?.id || `fusion_entity_${now}_${count}_${Utils.uuid()}`,
                name: ent.name,
                type: 'fusion_entity',
                entityType: type,
                desc: entityPayload.desc,
                relations,
                entity: entityPayload,
                chapterRef: chNum ? [chNum] : [],
                cycleId: currentCycleId,
                source: 'fusion_workbench',
                tags: entityPayload.tags,
                createdAt: existing?.createdAt || now,
                updatedAt: now
            });
            count++;
            this._plLog(`  → 暂存 ${type}: ${ent.name}${relations.length ? ' (关联'+relations.length+'个)' : ''}${currentCycleId ? ' [循环]' : ''}`, 'entity');
        }

        this._pipelineResults.world = raw.slice(0, 4000);
        this._allPipelineResults.world = (this._allPipelineResults.world || '') + `\n[第${(this._accContext||{}).chapterNum||'?'}章] ${count}个实体已提取\n`;
        this._plLog(`拆书弹药库: 共暂存 ${count} 个实体/规则/伏笔`, 'ok');

        if (fusion) {
            await DB.put('assets', {
                id: 'fusion_tech_' + Date.now(),
                name: '融合技法弹药', type: 'fusion_ammo',
                content: fusion, tags: ['融合', '技法', '自动生成'], createdAt: now
            });
        }
        try { await Modules.fusion_workbench?.refresh?.(); } catch(e) {}
    },

    // ★ 自动从提取的实体中归纳世界观维度
    async _pipelineExtractWorldView(entities, sourceText) {
        const catMap = {
            history: '历史与传说', geography: '地理与地貌', magic: '魔法/科技体系',
            factions: '势力与组织', species: '种族与生物', rules: '世界规则', culture: '文化与习俗'
        };

        // 从已提取的实体中按类型归纳世界观
        const worldData = {};
        for (const ent of entities) {
            if (!ent || !ent.name) continue;
            const type = (ent.type || '').toLowerCase();
            const desc = ent.description || ent.desc || '';
            if (!desc) continue;

            // 映射实体类型到世界观维度
            if (type === '历史' || type === 'history') {
                worldData.history = (worldData.history || '') + `\n- ${ent.name}: ${desc}`;
            } else if (type === '地点' || type === 'geography' || type === 'location') {
                worldData.geography = (worldData.geography || '') + `\n- ${ent.name}: ${desc}`;
            } else if (type === '魔法' || type === 'magic' || type === '功法') {
                worldData.magic = (worldData.magic || '') + `\n- ${ent.name}: ${desc}`;
            } else if (type === '势力' || type === 'factions' || type === '组织') {
                worldData.factions = (worldData.factions || '') + `\n- ${ent.name}: ${desc}`;
            } else if (type === '种族' || type === 'species') {
                worldData.species = (worldData.species || '') + `\n- ${ent.name}: ${desc}`;
            } else if (type === '规则' || type === 'rules') {
                worldData.rules = (worldData.rules || '') + `\n- ${ent.name}: ${desc}`;
            } else if (type === '文化' || type === 'culture') {
                worldData.culture = (worldData.culture || '') + `\n- ${ent.name}: ${desc}`;
            }
        }

        // 暂存世界观维度 (追加模式，不覆盖已有内容)
        let worldCount = 0;
        const stagedAssets = await DB.getAll('assets').catch(() => []) || [];
        for (const [cat, label] of Object.entries(catMap)) {
            if (!worldData[cat]) continue;
            const id = 'world_' + cat;
            const existing = await DB.get('entities', id);
            const assetId = `fusion_entity_world_${cat}`;
            const existingAsset = stagedAssets.find(a => a.id === assetId && !a.publishedEntityId);
            const oldDesc = existingAsset?.desc || ((existing && existing.desc) ? existing.desc : '');
            const newContent = worldData[cat].trim();
            // 追加新内容（去重）
            const merged = oldDesc ? oldDesc + '\n' + newContent : newContent;
            const payload = {
                name: label, type: 'world',
                desc: merged.slice(0, 5000),
                relations: [],
                source: 'fusion_workbench',
                updatedAt: Date.now()
            };
            await DB.put('assets', {
                ...(existingAsset || {}),
                id: existingAsset?.id || assetId,
                name: label,
                type: 'fusion_entity',
                entityType: 'world',
                desc: payload.desc,
                relations: [],
                entity: payload,
                source: 'fusion_workbench',
                tags: ['融合', '世界观', '弹药库暂存'],
                createdAt: existingAsset?.createdAt || Date.now(),
                updatedAt: Date.now()
            });
            worldCount++;
            this._plLog(`  🌍 世界观: ${label} 已暂存`, 'entity');
        }

        if (worldCount > 0) {
            this._plLog(`世界观: ${worldCount} 个维度已暂存到拆书弹药库`, 'ok');
            try { await Modules.fusion_workbench?.refresh?.(); } catch(e) {}
        }
    },

    async _pipelineSaveOutline() {
        const fusion = this._pipelineResults.fusion;
        if (!fusion) return;

        // 获取书名（用于日志和自定义prompt变量替换）
        const leftBook = (this._books || []).find(b => b.id === this.left.bookId);
        const rightBook = (this._books || []).find(b => b.id === this.right.bookId);
        const lName = leftBook ? leftBook.name : '左书';
        const rName = rightBook ? rightBook.name : '右书';
        const primarySide = this._primaryBook || 'left';
        const primaryName = primarySide === 'left' ? lName : rName;
        const secondaryName = primarySide === 'left' ? rName : lName;

        // 获取累积上下文（前章细纲+实体+知识图谱）
        const acc = this._accContext || {};
        const prevOutlines = acc.outlines ? acc.outlines.slice(-3000) : '';
        const prevEntities = acc.entities ? acc.entities.slice(-2000) : '';
        const knowledgeGraph = acc.knowledgeGraph || '';
        const chNum = acc.chapterNum || 1;

        let prompt = await Modules.short.getPrompt('fusion_outline');
        if (!prompt) {
            prompt = `你是一位资深网文编辑。基于以下融合弹药包，生成第${chNum}章的详细展开细纲。\n【核心原则】融合弹药只提供技法、节奏、钩子和避坑。人物、世界观、关系、主线必须服从当前项目、世界引擎和执笔台方向。\n\n【融合弹药包】\n${fusion.slice(0, 4000)}\n\n【对比分析】\n${(this._pipelineResults.compare || '').slice(0, 2000)}
${knowledgeGraph ? `\n${knowledgeGraph.slice(0, 3000)}` : ''}
${prevOutlines ? `\n【前章细纲参考（保持连贯性）】\n${prevOutlines}` : ''}

【核心要求】
- 所有人物性格、身份、关系必须与世界引擎和执笔台方向保持一致
- 伏笔和线索要与前章呼应，新伏笔要标注回收计划
- 世界观设定（魔法体系、势力关系、地理等）遵循世界引擎，不允许被拆书技法改写
- 新出现的人物/物品/地点要标注，方便后续提取到知识图谱
- 技法运用标注来源（技法骨架/补强弹药/融合创新）

请生成本章详细细纲，包含：
1. 章节标题
2. 核心事件（100字内）
3. 场景分段（每段场景的目的和情绪）
4. 运用的融合技法（标注来源）
5. 情绪节奏（起/承/转/合，标注分值）
6. 爽点/钩子设计
7. 对话要点（潜台词、信息差）
8. 一致性校验：是否与世界引擎、人物关系和前章事实矛盾？
${prevOutlines ? '9. 与前章的衔接和递进关系' : ''}

格式清晰，可直接用于写作。`;
        } else {
            prompt = prompt
                .replace(/{{primaryBook}}/g, primaryName).replace(/{{secondaryBook}}/g, secondaryName)
                .replace('{{fusion}}', fusion.slice(0, 4000))
                .replace('{{compare}}', (this._pipelineResults.compare || '').slice(0, 2000))
                .replace('{{left_name}}', lName).replace('{{right_name}}', rName);
            if (knowledgeGraph) prompt += `\n\n${knowledgeGraph.slice(0, 3000)}`;
            if (prevOutlines) prompt += `\n\n【前章细纲参考】\n${prevOutlines}`;
        }
        prompt = this._withDirectionGuard ? this._withDirectionGuard(prompt, '细纲生成') : prompt;
        if (this._strictWritingLawText) {
            prompt += `\n\n${this._strictWritingLawText('循环融合细纲')}\n【细纲额外要求】每章必须写清：视角锁定、开篇动作/对话、章末钩子、现代口语化执行点、需要避开的AI味风险。`;
        }

        // ★ 注入世界引擎全局一致性上下文
        try {
            const consistencyCtx = await this._buildConsistencyContext();
            if (consistencyCtx) prompt += `\n\n${consistencyCtx}`;
        } catch(e) { console.warn('一致性上下文构建失败:', e); }

        const outEl = document.getElementById('pl-output');
        if (outEl) outEl.textContent = '正在生成细纲...\n';
        this._setGenerating(true);

        let result = '';
        try {
            await AI.generate(prompt, { apiType: 'fusion', module: 'fusion_outline' }, c => {
                result += c;
                if (outEl) outEl.textContent = result;
                const fbOut = document.getElementById('fb-output');
                if (fbOut) fbOut.innerHTML = typeof marked !== 'undefined' ? marked.parse(result) : result;
            });
        } catch(e) {
            if (e.message === '已中止') { this._setGenerating(false); throw e; }
            this._plLog('细纲生成失败: ' + e.message, 'err');
            this._setGenerating(false);
            return;
        }

        this._setGenerating(false);
        this._pipelineResults.outline = result;
        this._allPipelineResults.outline = (this._allPipelineResults.outline || '') + '\n\n---\n\n' + result;

        if (this._isCreativeFlow()) {
            const chapter = await this._ensureCreativeWriterChapter({ outline: result });
            this._lastWorkbenchOutlineId = '';
            this._plLog(`📋 细纲→执笔台: ${chapter.title}`, 'ok');
            this._plLog(`细纲生成完成 (${result.length}字)`, 'ok');
            return chapter;
        }

        const chIdx = this.left.chapterIdx;
        const leftBook2 = (this._books || []).find(b => b.id === this.left.bookId);
        const lCh = leftBook2 && leftBook2.chapters[chIdx] ? leftBook2.chapters[chIdx] : null;
        const chapTitle = lCh ? lCh.title : '第' + (chIdx + 1) + '章';
        const outlineId = 'fusion_outline_' + Date.now();

        // 存入拆书弹药库，默认不直写凤凰流/执笔台
        await DB.put('outlines', {
            id: outlineId,
            title: `第${chIdx + 1}章 ${chapTitle}（融合细纲）`,
            content: result,
            source: 'fusion_workbench',
            chapterIndex: chIdx + 1,
            chapterTitle: chapTitle,
            leftBookId: this.left.bookId,
            rightBookId: this.right.bookId,
            sourceBooks: [lName, rName],
            createdAt: Date.now()
        });
        this._lastWorkbenchOutlineId = outlineId;
        this._plLog('📋 细纲→拆书弹药库（待发布）', 'entity');
        try { await Modules.fusion_workbench?.refresh?.(); } catch(e) {}

        this._plLog(`细纲生成完成 (${result.length}字)`, 'ok');
    },

    async _buildCreativeWriterPrompt(chapter) {
        const W = Modules.writer;
        const project = await this._requireCreativeProject();
        const chaps = W?._scopeRecords
            ? W._scopeRecords(await DB.getAll('chapters').catch(() => []) || [], project.id).sort((a,b) => (a.order || 0) - (b.order || 0))
            : (await DB.getAll('chapters').catch(() => []) || []).sort((a,b) => (a.order || 0) - (b.order || 0));
        const oldChapterId = W?.currentChapterId;
        if (W) W.currentChapterId = chapter.id;

        let worldCtx = '';
        try {
            if (Modules.world_engine) {
                await Modules.world_engine._ensureCache?.();
                const entities = Modules.world_engine._cachedEntities || [];
                const worldEntities = entities.filter(e => !String(e.id || '').startsWith('world_'));
                const worldViews = entities.filter(e => String(e.id || '').startsWith('world_') && e.desc);
                if (worldEntities.length) {
                    worldCtx += '[世界引擎实体]\n';
                    worldEntities.slice(0, 12).forEach(e => {
                        worldCtx += `${e.type || '其他'}·${e.name}: ${(e.desc || '').slice(0, 90)}\n`;
                    });
                }
                if (worldViews.length) {
                    const catLabels = { history:'历史与传说', geography:'地理与地貌', magic:'魔法/科技体系', factions:'势力与组织', species:'种族与生物', rules:'世界规则', culture:'文化与习俗' };
                    worldCtx += '\n[世界观设定]\n';
                    worldViews.slice(0, 5).forEach(w => {
                        const cat = String(w.id || '').replace('world_', '');
                        worldCtx += `${catLabels[cat] || w.name || cat}: ${(w.desc || '').slice(0, 180)}\n`;
                    });
                }
            }
        } catch(e) {}

        let ragContext = '';
        if (typeof RAGSystem !== 'undefined') {
            try {
                if (RAGSystem.buildAutoInjectContext) {
                    ragContext = await RAGSystem.buildAutoInjectContext({
                        query: `${chapter.title || ''} ${(chapter.outline || '').slice(0, 300)}`,
                        chapterNum: chapter.order || null,
                        maxTokens: 2200,
                        mode: 'write',
                        includeCycles: true,
                        includeEntities: true,
                        includeWorld: true,
                        includeOutline: true,
                        includePatterns: true
                    });
                } else if (RAGSystem.search) {
                    const rows = await RAGSystem.search(`${chapter.title || ''} ${(chapter.outline || '').slice(0, 300)}`, 4);
                    if (rows?.length) ragContext = '[RAG参考上下文]\n' + rows.map(r => `[${r.source || ''}] ${r.title || ''}: ${(r.content || '').slice(0, 320)}`).join('\n---\n');
                }
            } catch(e) {}
        }

        let rules = '';
        try {
            const rulesData = await DB.get('settings', 'writer_rules');
            if (rulesData) rules = rulesData.rules || '';
        } catch(e) {}
        const mandatoryRules = W?._mergeStyleRules
            ? W._mergeStyleRules(W._getExtractedStyle?.() || '', rules)
            : (rules || '');
        const nexusPrefix = W?._buildNexusPrefix ? await W._buildNexusPrefix(true) : '';
        const cycleCtx = W?._getCycleContext ? await W._getCycleContext() : '';

        let prevContent = '';
        const prevIdx = chaps.findIndex(c => c.id === chapter.id) - 1;
        if (prevIdx >= 0 && chaps[prevIdx].content) prevContent = chaps[prevIdx].content.slice(-1200);

        const targetWords = parseInt(chapter.targetWords || 2500, 10) || 2500;
        const proseContract = W?._buildWriterProseContract ? W._buildWriterProseContract({
            title: chapter.title || '',
            targetWords: `约${targetWords}字`,
            hasContent: !!(chapter.content || '').trim()
        }) : '';
        const cleanOutline = String(chapter.outline || '')
            .replace(/\[情绪\d+\|[^\]]+\]/g, '')
            .replace(/读者期待[:：].*$/gm, '')
            .replace(/读者恐惧[:：].*$/gm, '')
            .replace(/反应涟漪[:：].*$/gm, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
        const fusionCtx = [
            this._pipelineResults.fusion ? '[本章融合技法]\n' + this._pipelineResults.fusion.slice(0, 2200) : '',
            this._pipelineResults.compare ? '[本章对比结论]\n' + this._pipelineResults.compare.slice(0, 1000) : '',
            W?._getFusionContext ? W._getFusionContext().slice(0, 1600) : ''
        ].filter(Boolean).join('\n\n');
        const direction = this._getDirectionLockText ? this._getDirectionLockText() : (this._plConfig?.directionLock || '');
        const isGoldenOpening = chapter.order && chapter.order <= 3;
        const goldenExtra = isGoldenOpening ? '开篇300字必动作/冲突。人物出场带记忆点。反派台词带刺带毒。反杀≤300字干净利落。章末钩子必是新威胁。' : '';

        let prompt = '';
        if (nexusPrefix) prompt += nexusPrefix + '\n';
        if (proseContract) prompt += proseContract + '\n\n';
        if (mandatoryRules) prompt += '【强制默认写文规则】\n' + mandatoryRules + '\n\n';
        if (direction) prompt += '【用户方向护栏/脑洞】\n' + direction.slice(0, 2500) + '\n\n';
        if (fusionCtx) prompt += '【融合拆书技法，只能当写法，不得复用原书内容】\n' + fusionCtx + '\n\n';
        if (worldCtx) prompt += worldCtx + '\n';
        if (cycleCtx) prompt += '[循环技法]\n' + cycleCtx.slice(0, 1400) + '\n\n';
        if (ragContext) prompt += '[RAG自动注入]\n' + ragContext.slice(0, 2200) + '\n\n';
        prompt += `[本章标题] ${chapter.title}\n\n[本章细纲]\n${cleanOutline.slice(0, 2200)}\n\n`;
        if (prevContent) prompt += '[前文末尾]\n' + prevContent.slice(-700) + '\n\n';
        prompt += `规则：M06/M07强制默认规则最高优先级。长篇只允许第三人称有限。禁止第一人称视角。禁止上帝视角。禁止直接写非观察位内心。纯大白话，现代口语，允许自然日常网络梗。动作短句≤25字，3-5短后接1长句。对话只能用中文双引号“”，严禁「」。段落≤4行。禁情绪标签、禁解释癖、禁虚词、禁逻辑连词。章末钩子。${goldenExtra}约${targetWords}字。

只输出小说正文。禁止输出标题、分析、规划、字数统计、元评论、心理解释、总结、任何非正文。

正文：`;
        if (W) W.currentChapterId = oldChapterId;
        return prompt;
    },

    async _pipelineWriteToWriter() {
        const fusion = this._pipelineResults.fusion || '';
        const outline = this._pipelineResults.outline || '';
        if (!fusion && !outline) return;
        const W = Modules.writer;
        if (!W) throw new Error('执笔台模块未加载');
        let chapter = await this._ensureCreativeWriterChapter({ outline });
        if ((chapter.content || '').trim().length > 100) {
            this._pipelineResults.write = chapter.content || '';
            this._allPipelineResults.write = (this._allPipelineResults.write || '') + `\n\n---\n\n${chapter.content || ''}`;
            this._plLog(`✍️ 执笔台已有正文，跳过重写: ${chapter.title}`, 'info');
            return chapter;
        }

        const oldChapterId = W.currentChapterId;
        W.currentChapterId = chapter.id;
        localStorage.setItem('writer_flow_mode', 'fusion');
        W.aiOpts = { ...(W.aiOpts || {}), flowMode: 'fusion', fusionInject: true, ragInject: true, styleKeep: true };

        const prompt = await this._buildCreativeWriterPrompt(chapter);
        const status = document.getElementById('fb-status');
        if (status) status.textContent = '执笔台正在写正文...';
        const plOut = document.getElementById('pl-output');
        if (plOut) plOut.textContent = '执笔台正文生成中...\n';
        const outEl = document.getElementById('fb-output');
        if (outEl) outEl.innerHTML = '<div class="text-green-400 animate-pulse"><i class="fa-solid fa-spinner fa-spin mr-2"></i>执笔台正在写正文...</div>';
        this._setGenerating(true);

        let result = '';
        try {
            await AI.generate(prompt, { apiType: 'text', module: 'writer_auto_current', flowMode: 'fusion', max_tokens: 8192, temperature: 0.85 }, c => {
                result += c;
                if (plOut) plOut.textContent = result;
                if (outEl) outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(result) : result;
            });
        } catch(e) {
            this._setGenerating(false);
            W.currentChapterId = oldChapterId;
            if (e.message === '已中止') throw e;
            throw new Error('执笔台写正文失败: ' + (e.message || '未知错误'));
        }

        result = W._sanitizeGeneratedProse ? W._sanitizeGeneratedProse(result) : result.trim();
        if (!result.trim()) {
            this._setGenerating(false);
            W.currentChapterId = oldChapterId;
            throw new Error('执笔台写正文失败: API未返回正文');
        }
        chapter = await DB.get('chapters', chapter.id) || chapter;
        chapter.content = result;
        chapter.status = 'draft';
        chapter.updatedAt = Date.now();
        if (typeof GenesisCore !== 'undefined') {
            const project = await this._requireCreativeProject();
            GenesisCore.stampProjectRecord(chapter, project.id);
        }
        await DB.put('chapters', chapter);
        this._pipelineResults.write = result;
        this._allPipelineResults.write = (this._allPipelineResults.write || '') + '\n\n---\n\n' + result;
        this._setGenerating(false);
        if (status) status.textContent = '执笔台正文完成';
        this._plLog(`✍️ 正文→执笔台: ${chapter.title} (${result.length}字)`, 'ok');

        try {
            await W._runPostWriteProcessing?.(chapter.id, {
                forcePostProcess: true,
                source: 'fusion_creative_pipeline',
                showProgress: false
            });
        } catch(e) {
            this._plLog('执笔台正文后处理失败: ' + (e.message || '未知错误'), 'err');
        }
        try { await W.loadTree?.(); } catch(e) {}
        if (oldChapterId) W.currentChapterId = oldChapterId;
        else W.currentChapterId = chapter.id;
        return chapter;
    },

    async _pipelineWrite() {
        if (this._isCreativeFlow?.()) return this._pipelineWriteToWriter();
        const fusion = this._pipelineResults.fusion || '';
        const outline = this._pipelineResults.outline || '';
        if (!fusion && !outline) return;

        // ★ 获取累积上下文 + 知识图谱
        const acc = this._accContext || {};
        const prevOutlines = acc.outlines ? acc.outlines.slice(-2000) : '';
        const knowledgeGraph = acc.knowledgeGraph || '';

        let prompt = await Modules.short.getPrompt('fusion_write');
        if (!prompt) prompt = this._PROMPTS.write;
        prompt = prompt
            .replace('{{fusion}}', fusion.slice(0, 4000))
            .replace('{{outline}}', outline.slice(0, 3000))
            .replace('{{world}}', (this._pipelineResults.world || '').slice(0, 2000));

        // ★ 注入知识图谱上下文（实体+世界观+关系网络）
        if (knowledgeGraph) prompt += `\n\n${knowledgeGraph.slice(0, 3000)}`;
        if (prevOutlines) prompt += `\n\n【前章细纲（保持情节连贯）】\n${prevOutlines}`;
        prompt += `\n\n【一致性与排版要求】
- 人物性格、世界观设定、伏笔线索必须与知识图谱保持一致，不得矛盾
- 语言风格：大白话、简洁有力、一句一个信息点，拒绝文绉绉和水字数
- 排版：每段不超过3-4行（手机屏幕友好），多用短句，对话单独成段
- 前后章节的人物称呼、能力设定、地名必须完全一致
- 新出现的伏笔要自然埋入，已有伏笔要适时呼应`;
        if (this._strictWritingLawText) prompt += `\n\n${this._strictWritingLawText('循环正文生成')}`;
        prompt = this._withDirectionGuard ? this._withDirectionGuard(prompt, '正文生成') : prompt;

        // ★ 注入世界引擎全局一致性上下文
        try {
            const consistencyCtx = await this._buildConsistencyContext();
            if (consistencyCtx) prompt += `\n\n${consistencyCtx}`;
        } catch(e) { console.warn('一致性上下文构建失败:', e); }

        const status = document.getElementById('fb-status');
        if (status) status.textContent = '正在写正文...';
        this._setGenerating(true);

        const outEl = document.getElementById('fb-output');
        if (outEl) outEl.innerHTML = '<div class="text-green-400 animate-pulse"><i class="fa-solid fa-spinner fa-spin mr-2"></i>正在创作正文...</div>';

        const plOut = document.getElementById('pl-output');
        if (plOut) plOut.textContent = '正文创作中...\n';

        let result = '';
        try {
            await AI.generate(prompt, { apiType: 'text', module: 'fusion_write_body' }, c => {
                result += c;
                if (outEl) outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(result) : result;
                if (plOut) plOut.textContent = result;
            });
        } catch(e) {
            if (e.message === '已中止') { throw e; }
            UI.toast('写正文出错: ' + e.message);
        }
        if (!this._pipelineRunning) { this._setGenerating(false); throw new Error('已中止'); }

        this._pipelineResults.write = result;
        this._allPipelineResults.write = (this._allPipelineResults.write || '') + '\n\n---\n\n' + result;
        this._setGenerating(false);
        if (status) status.textContent = '正文创作完成';
        this._plLog(`正文创作完成 (${result.length}字)`, 'ok');

        // 存入拆书弹药库，默认不直写执笔台
        if (result) {
            const chIdx = this.left.chapterIdx;
            const leftBook = (this._books || []).find(b => b.id === this.left.bookId);
            const lCh = leftBook && leftBook.chapters[chIdx] ? leftBook.chapters[chIdx] : null;
            const chapTitle = lCh ? lCh.title : '第' + (chIdx + 1) + '章';
            await DB.put('writings', {
                id: 'fusion_write_' + Date.now(),
                title: `第${chIdx + 1}章 ${chapTitle}（融合正文）`,
                content: result,
                outline: outline || '',
                outlineId: this._lastWorkbenchOutlineId || '',
                source: 'fusion_workbench',
                chapterIndex: chIdx + 1,
                chapterTitle: chapTitle,
                leftBookId: this.left.bookId,
                rightBookId: this.right.bookId,
                createdAt: Date.now()
            });
            this._plLog('✍️ 正文→拆书弹药库（待发布）', 'entity');

            // RAG 仍由配置控制，不再作为执笔台/世界引擎发布动作
            if (this._plConfig.doRAG && typeof RAGSystem !== 'undefined') {
                await RAGSystem.addDocument(`正文_第${chIdx + 1}章`, result.slice(0, 8000), 'pipeline_write');
                this._plLog('🔍 正文→RAG', 'entity');
            }
            try { await Modules.fusion_workbench?.refresh?.(); } catch(e) {}
        }
    },
});
