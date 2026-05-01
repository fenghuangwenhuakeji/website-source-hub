Object.assign(Modules.world_engine, {
    _viewPipelineStep(key) {
        const FB = Modules.fusion_book;
        const allPr = (FB && FB._allPipelineResults) ? FB._allPipelineResults : {};
        const curPr = (FB && FB._pipelineResults) ? FB._pipelineResults : {};
        const val = (allPr[key] && allPr[key].trim()) ? allPr[key] : (curPr[key] || '');
        if(!val) return;
        const labels = { left:'左书拆解', right:'右书拆解', compare:'对比结论', fusion:'融合精华', world:'实体提取', outline:'细纲', write:'正文' };
        const el = document.getElementById('we-pp-content');
        const title = document.getElementById('we-pp-title');
        if(el) el.value = val;
        if(title) title.textContent = (labels[key]||key) + ' (' + val.length + '字)';
        document.querySelectorAll('[id^="we-pp-btn-"]').forEach(btn => { btn.classList.remove('bg-white/10','border-white/10'); btn.classList.add('border-transparent'); });
        const ab = document.getElementById('we-pp-btn-' + key);
        if(ab) { ab.classList.add('bg-white/10','border-white/10'); ab.classList.remove('border-transparent'); }
    },

    _exportPipelineAll() {
        const FB = Modules.fusion_book;
        const allPr = (FB && FB._allPipelineResults) ? FB._allPipelineResults : {};
        const curPr = (FB && FB._pipelineResults) ? FB._pipelineResults : {};
        const labels = { left:'左书拆解', right:'右书拆解', compare:'对比结论', fusion:'融合精华', world:'实体提取', outline:'细纲', write:'正文' };
        let md = '# 流水线全部数据\n\n';
        ['left','right','compare','fusion','world','outline','write'].forEach(k => {
            const v = (allPr[k] && allPr[k].trim()) ? allPr[k] : (curPr[k] || '');
            if(v) md += `## ${labels[k]||k}\n${v}\n\n`;
        });
        if(typeof ContextHelper !== 'undefined') ContextHelper.exportToLibrary('流水线数据_' + new Date().toLocaleTimeString(), md);
    },

    // ═══ 实体管理 ═══
    _refreshEntities: async () => {
        await Modules.world_engine._ensureCache();
        await Modules.world_engine._ensureCycleCache();
        const list = Modules.world_engine._cachedEntities || [];
        const el = document.getElementById('we-entity-list');
        if(!el) return;
        let filtered = list.filter(e => !e.id.startsWith('world_'));
        const f = Modules.world_engine._entityFilter;
        const tf = Modules.world_engine._typeFilter;
        const cf = Modules.world_engine._chapterFilter;
        const cyf = Modules.world_engine._cycleFilter;
        if(f === 'pipeline') filtered = filtered.filter(e => e.source === 'pipeline');
        if(f === 'manual') filtered = filtered.filter(e => e.source !== 'pipeline');
        if(tf) filtered = filtered.filter(e => e.type === tf);
        if(cf === 'none') filtered = filtered.filter(e => !e.chapters || !e.chapters.length);
        if(cf !== 'all' && cf !== 'none') {
            filtered = filtered.filter(e => e.chapters && e.chapters.includes(cf));
        }
        // ★ 循环筛选
        if(cyf === 'none') filtered = filtered.filter(e => !e.cycles || !e.cycles.length);
        if(cyf !== 'all' && cyf !== 'none') {
            filtered = filtered.filter(e => e.cycles && e.cycles.includes(cyf));
        }

        el.innerHTML = filtered.length ? filtered.map(e => {
            const isPipeline = e.source === 'pipeline';
            const iconMap = {'人物':'fa-user','地点':'fa-map-location-dot','物品':'fa-box','情节':'fa-film','伏笔':'fa-eye','势力':'fa-flag','种族':'fa-dragon','魔法':'fa-wand-sparkles','规则':'fa-gavel','文化':'fa-masks-theater','历史':'fa-scroll','技法':'fa-lightbulb'};
            const timeStr = e.updatedAt ? new Date(e.updatedAt).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}) : '';
            const chapterCount = (e.chapters || []).length;
            const cycleCount = (e.cycles || []).length;
            const nexusBadge = e.nexusState && e.nexusState.chrStatus ? `<span class="text-[8px] text-purple-400 bg-purple-500/10 px-1 py-0.5 rounded shrink-0">${e.nexusState.chrStatus}</span>` : '';
            return `
            <button class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[11px] font-bold transition-all ${Modules.world_engine.cur===e.id ? 'bg-amber-500/10 text-white border border-amber-500/20' : 'text-dim hover:bg-white/5 border border-transparent'}" onclick="Modules.world_engine._loadEntity('${e.id}')">
                <i class="fa-solid ${iconMap[e.type]||'fa-circle'} w-4 text-center text-[10px] text-amber-400/60"></i>
                <span class="truncate flex-1">${e.name}</span>
                ${isPipeline ? '<span class="text-[8px] text-red-400 bg-red-500/10 px-1 py-0.5 rounded shrink-0">流水线</span>' : ''}
                ${chapterCount>0 ? `<span class="text-[8px] text-cyan-400 bg-cyan-500/10 px-1 py-0.5 rounded shrink-0">${chapterCount}章</span>` : ''}
                ${cycleCount>0 ? `<span class="text-[8px] text-green-400 bg-green-500/10 px-1 py-0.5 rounded shrink-0">${cycleCount}循环</span>` : ''}
                ${nexusBadge}
                ${timeStr ? '<span class="text-[8px] text-dim shrink-0">' + timeStr + '</span>' : ''}
                <span class="text-[9px] text-dim bg-black/30 px-1.5 py-0.5 rounded">${e.type}</span>
            </button>`;
        }).join('') : '<div class="text-[10px] text-dim p-2">暂无实体' + (f !== 'all' || tf || cf !== 'all' || cyf !== 'all' ? '（当前有筛选）' : '') + '</div>';
    },
    _addEntity: () => {
        Modules.world_engine.cur = null;
        const n = document.getElementById('we-ent-name'); if(n) n.value = '';
        const d = document.getElementById('we-ent-desc'); if(d) d.value = '';
        const r = document.getElementById('we-ent-relations'); if(r) r.value = '';
        const badge = document.getElementById('we-ent-source-badge'); if(badge) badge.innerHTML = '';
        document.querySelectorAll('.we-ent-chapter-check').forEach(cb => cb.checked = false);
    },
    _loadEntity: async (id) => {
        Modules.world_engine.cur = id;
        const e = await DB.get('entities', id);
        if(!e) return;
        const n = document.getElementById('we-ent-name'); if(n) n.value = e.name || '';
        const t = document.getElementById('we-ent-type'); if(t) t.value = e.type || '人物';
        const d = document.getElementById('we-ent-desc'); if(d) d.value = e.desc || '';
        const r = document.getElementById('we-ent-relations'); if(r) r.value = (e.relations || []).join(', ');
        const entityChapters = e.chapters || [];
        document.querySelectorAll('.we-ent-chapter-check').forEach(cb => {
            cb.checked = entityChapters.includes(cb.dataset.chapterId);
        });
        const badge = document.getElementById('we-ent-source-badge');
        if(badge) {
            const badges = {
                pipeline: '<div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] text-red-400"><i class="fa-solid fa-rocket mr-1"></i>流水线提取' + (e.updatedAt ? ' · ' + new Date(e.updatedAt).toLocaleString('zh-CN') : '') + '</div>',
                phoenix: '<div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-[10px] text-orange-400"><i class="fa-solid fa-fire mr-1"></i>凤凰创作流</div>',
                fusion: '<div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-400"><i class="fa-solid fa-book-open-reader mr-1"></i>融合拆书</div>'
            };
            badge.innerHTML = badges[e.source] || '<div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] text-dim"><i class="fa-solid fa-pen mr-1"></i>手动创建' + (e.updatedAt ? ' · ' + new Date(e.updatedAt).toLocaleString('zh-CN') : '') + '</div>';
        }
        Modules.world_engine._refreshEntities();
    },
    _saveEntity: async () => {
        const name = document.getElementById('we-ent-name').value.trim();
        const type = document.getElementById('we-ent-type').value;
        const desc = document.getElementById('we-ent-desc').value;
        const relStr = document.getElementById('we-ent-relations').value;
        const relations = relStr ? relStr.split(',').map(s => s.trim()).filter(Boolean) : [];
        const chapters = [];
        document.querySelectorAll('.we-ent-chapter-check:checked').forEach(cb => {
            chapters.push(cb.dataset.chapterId);
        });
        if(!name) return UI.toast('请输入实体名称');
        
        await Modules.world_engine._ensureCache();
        const existingEntities = Modules.world_engine._cachedEntities || [];
        const normalizedName = name.toLowerCase();
        
        let id = Modules.world_engine.cur;
        let isUpdate = false;
        
        for (const e of existingEntities) {
            if (e.name && e.name.toLowerCase() === normalizedName) {
                if (id && e.id === id) {
                    isUpdate = true;
                    break;
                } else if (!id) {
                    id = e.id;
                    isUpdate = true;
                    break;
                } else {
                    const confirmOverwrite = confirm(`已存在同名实体「${e.name}」，是否覆盖更新？`);
                    if (confirmOverwrite) {
                        await DB.del('entities', id);
                        try { await DB.del('vectors', id); } catch(err) {}
                        id = e.id;
                        isUpdate = true;
                        break;
                    } else {
                        return UI.toast('保存已取消');
                    }
                }
            }
        }
        
        if (!id) id = Utils.uuid();
        
        let source = 'manual';
        let existingCycles = [];
        let existingVolumes = [];
        let existingNexus = null;
        if(isUpdate) {
            const ex = await DB.get('entities', id);
            if(ex) {
                if(ex.source) source = ex.source;
                if(ex.cycles) existingCycles = ex.cycles;
                if(ex.volumes) existingVolumes = ex.volumes;
                if(ex.nexusState) existingNexus = ex.nexusState;
            }
        }
        try {
            const chapterList = await DB.getAll('chapters') || [];
            const chapterMap = new Map(chapterList.map(c => [c.id, c]));
            chapters.forEach(chId => {
                const ch = chapterMap.get(chId);
                const volumeId = Modules.world_engine._getChapterVolumeId ? Modules.world_engine._getChapterVolumeId(ch) : ch?.volumeId;
                if(volumeId && !existingVolumes.includes(volumeId)) existingVolumes.push(volumeId);
            });
        } catch(e) {}
        Modules.world_engine.cur = id;
        await DB.put('entities', { id, name, type, desc, relations, chapters, cycles: existingCycles, volumes: existingVolumes, nexusState: existingNexus, source, updatedAt: Date.now() });
        await DB.put('vectors', { id, content: `[${type}] ${name}: ${desc}`, vector: Array.from({length:1536}, ()=>Math.random()), timestamp: Date.now() });
        Modules.world_engine._cachedEntities = null;
        Modules.world_engine._cachedLayeredGraphs = null;
        if(Modules.world_engine.rebuildLayeredGraphs) await Modules.world_engine.rebuildLayeredGraphs('manual_entity_save', { silent: true });
        UI.toast(isUpdate ? '实体已更新，向量库已同步' : '实体已保存，向量库已同步');
        Modules.world_engine._refreshEntities();
    },
    _deleteEntity: async () => {
        if(!Modules.world_engine.cur) return UI.toast('请先选择实体');
        if(!confirm('确定删除此实体？')) return;
        await DB.del('entities', Modules.world_engine.cur);
        try { await DB.del('vectors', Modules.world_engine.cur); } catch(e) {}
        Modules.world_engine.cur = null;
        Modules.world_engine._cachedEntities = null;
        Modules.world_engine._cachedLayeredGraphs = null;
        if(Modules.world_engine.rebuildLayeredGraphs) await Modules.world_engine.rebuildLayeredGraphs('entity_delete', { silent: true });
        const n = document.getElementById('we-ent-name'); if(n) n.value = '';
        const d = document.getElementById('we-ent-desc'); if(d) d.value = '';
        const r = document.getElementById('we-ent-relations'); if(r) r.value = '';
        const badge = document.getElementById('we-ent-source-badge'); if(badge) badge.innerHTML = '';
        Modules.world_engine._refreshEntities();
        UI.toast('已删除');
    },
    _entityToLib: async () => {
        const name = document.getElementById('we-ent-name').value;
        const desc = document.getElementById('we-ent-desc').value;
        if(!name || !desc) return UI.toast('实体为空');
        if(typeof ContextHelper !== 'undefined') ContextHelper.exportToLibrary('实体_' + name, desc);
    },
    _aiExpandEntity: async () => {
        const name = document.getElementById('we-ent-name').value;
        const type = document.getElementById('we-ent-type').value;
        const desc = document.getElementById('we-ent-desc').value;
        if(!name) return UI.toast('请先输入实体名称');
        let pipelineCtx = '';
        const FB = Modules.fusion_book;
        if(FB && FB._pipelineResults && FB._pipelineResults.fusion) pipelineCtx = '\n\n[流水线融合参考]\n' + FB._pipelineResults.fusion.slice(0, 800);
        const prompt = `请为以下${type}实体生成详细的设定描述：\n名称：${name}\n已有描述：${desc || '无'}${pipelineCtx}\n\n要求：\n1. 外貌/特征描述\n2. 背景故事\n3. 性格/属性\n4. 与其他实体的潜在关系\n5. 在故事中的作用和定位\n6. 独特的标志性特点`;
        const el = document.getElementById('we-ent-desc');
        el.value = '生成中...';
        let fullRes = '';
        await AI.generate(prompt, {}, c => { fullRes += c; el.value = fullRes; });
        UI.toast('AI 扩写完成');
    },

    // ═══ 从融合拆书深度提取实体 (12类型) — 修复: 确保关系正确、同步刷新图谱+世界观 ═══
    extractFromFusion: async () => {
        const we = Modules.world_engine;
        const FB = Modules.fusion_book;
        if(!FB) return UI.toast('融合拆书模块未加载');
        const allPr = FB._allPipelineResults || {};
        const pr = FB._pipelineResults || {};
        const fusion = (allPr.fusion && allPr.fusion.trim()) ? allPr.fusion : (pr.fusion || '');
        const compare = (allPr.compare && allPr.compare.trim()) ? allPr.compare : (pr.compare || '');
        const left = (allPr.left && allPr.left.trim()) ? allPr.left : (pr.left || '');
        const right = (allPr.right && allPr.right.trim()) ? allPr.right : (pr.right || '');
        const src = [fusion, compare, left, right].filter(Boolean).join('\n\n');
        if(!src || src.length < 50) return UI.toast('流水线数据不足，请先运行融合拆书');

        // 获取已有实体名称，让AI建立关联
        await we._ensureCache();
        const existingNames = (we._cachedEntities || []).filter(e => !e.id.startsWith('world_')).map(e => e.name);
        const existingHint = existingNames.length ? `\n\n【已有实体(请在relations中引用这些名称建立关联)】\n${existingNames.join('、')}` : '';

        const prompt = `你是一个专业的小说实体提取引擎。请从以下融合拆书分析数据中，提取所有有价值的实体。

【数据来源】
${src.slice(0, 6000)}
${existingHint}

【提取要求】
请提取以下12种类型的实体：
1. 人物 — 角色名、身份、性格、外貌、能力
2. 物品 — 武器、法宝、道具、关键物件
3. 地点 — 场景、城市、秘境、地标
4. 情节 — 关键事件、转折点、冲突
5. 伏笔 — 暗示、线索、未解之谜
6. 势力 — 门派、组织、阵营、国家
7. 种族 — 种族、族群、特殊生物
8. 魔法 — 功法、技能、法术体系
9. 规则 — 世界运行规则、力量等级
10. 文化 — 风俗、信仰、语言、节日
11. 历史 — 历史事件、传说、纪元
12. 技法 — 写作技法、叙事手法、结构技巧

【输出格式】严格JSON数组：
[{"name":"实体名","type":"类型","desc":"详细描述(100-300字)","relations":["关系类型:关联实体名"]}]

【关键要求 - 关系网络】
- 每个实体的relations必须尽可能多地引用其他实体名称，用"关系类型:实体名"格式
- 关系类型例如：师父、徒弟、敌对、盟友、所属、位于、拥有、使用、参与、创造、守护、统治等
- 人物之间要有师徒/敌友/从属关系
- 人物与地点要有"位于"/"出没"关系
- 人物与物品要有"拥有"/"使用"关系
- 人物与势力要有"所属"/"统治"关系
- 情节与人物要有"参与"关系
- 这些关系是构建知识网络图的关键，不要遗漏！
- 直接输出JSON，不要包裹markdown代码块`;

        UI.toast('正在深度提取实体...');
        let fullRes = '';
        await AI.generate(prompt, {}, c => { fullRes += c; });

        // ═══ 健壮JSON解析（6层容错） ═══
        let entities = null;
        // 预处理: 去掉markdown代码块包裹
        let cleanRes = fullRes.trim();
        cleanRes = cleanRes.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '').trim();

        // 尝试1: 直接解析
        try { entities = JSON.parse(cleanRes); } catch(e1) {
            // 尝试2: 提取最外层 [...]
            try {
                const s = cleanRes.indexOf('[');
                const e = cleanRes.lastIndexOf(']');
                if (s !== -1 && e > s) entities = JSON.parse(cleanRes.slice(s, e + 1));
            } catch(e2) {
                // 尝试3: 修复常见JSON问题（不做\n→\\n全局替换）
                try {
                    let fixed = cleanRes;
                    const s2 = fixed.indexOf('[');
                    const e2b = fixed.lastIndexOf(']');
                    if (s2 !== -1 && e2b > s2) fixed = fixed.slice(s2, e2b + 1);
                    fixed = fixed.replace(/,\s*([}\]])/g, '$1');
                    fixed = fixed.replace(/'/g, '"').replace(/[""]/g, '"');
                    fixed = fixed.replace(/[\u200B-\u200D\uFEFF]/g, '');
                    // 安全处理: 只替换字符串值内部的裸换行
                    fixed = fixed.replace(/"([^"]*)\n([^"]*)"/g, (m) => m.replace(/\n/g, '\\n'));
                    entities = JSON.parse(fixed);
                } catch(e3) {
                    // 尝试4: 逐个对象提取（支持含数组的对象）
                    const objMatches = cleanRes.match(/\{(?:[^{}]|\[[^\]]*\]|\{[^{}]*\})*"name"\s*:\s*"[^"]+?"(?:[^{}]|\[[^\]]*\]|\{[^{}]*\})*\}/g);
                    if (objMatches && objMatches.length) {
                        entities = [];
                        for (const objStr of objMatches) {
                            try {
                                let fixedObj = objStr.replace(/,\s*}/g, '}').replace(/,\s*\]/g, ']')
                                    .replace(/'/g, '"').replace(/[""]/g, '"');
                                fixedObj = fixedObj.replace(/"([^"]*)\n([^"]*)"/g, (m) => m.replace(/\n/g, '\\n'));
                                entities.push(JSON.parse(fixedObj));
                            } catch(e) {
                                const nameM = objStr.match(/"name"\s*:\s*"([^"]+?)"/);
                                const typeM = objStr.match(/"type"\s*:\s*"([^"]+?)"/);
                                const descM = objStr.match(/"desc(?:ription)?"\s*:\s*"([\s\S]*?)"/);
                                const relM = objStr.match(/"relations"\s*:\s*\[([\s\S]*?)\]/);
                                let relations = [];
                                if (relM) { relations = (relM[1].match(/"([^"]+?)"/g) || []).map(r => r.replace(/"/g, '')); }
                                if (nameM) entities.push({ name: nameM[1], type: typeM?typeM[1]:'其他', desc: descM?descM[1]:'', relations });
                            }
                        }
                    }
                    // 尝试5: 逐行扫描
                    if (!entities || !entities.length) {
                        entities = [];
                        const lines = cleanRes.split('\n');
                        let cur = null;
                        for (const line of lines) {
                            const nm = line.match(/"name"\s*:\s*"([^"]+)"/);
                            if (nm) { if (cur && cur.name) entities.push(cur); cur = { name: nm[1], type: '其他', desc: '', relations: [] }; }
                            if (cur) {
                                const tm = line.match(/"type"\s*:\s*"([^"]+)"/);
                                if (tm) cur.type = tm[1];
                                const dm = line.match(/"desc(?:ription)?"\s*:\s*"([^"]+)"/);
                                if (dm) cur.desc = dm[1];
                            }
                        }
                        if (cur && cur.name) entities.push(cur);
                    }
                }
            }
        }
        if(!entities || !Array.isArray(entities) || !entities.length) return UI.toast('提取失败，AI返回格式异常');

        await we._ensureCache();
        const existingEntities = we._cachedEntities || [];
        const existingNameMap = new Map();
        existingEntities.forEach(e => {
            if (e.name) {
                existingNameMap.set(e.name.toLowerCase().trim(), e);
            }
        });

        let addedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        const now = Date.now();
        for(const ent of entities) {
            if(!ent.name || !ent.type) continue;
            
            const normalizedName = ent.name.toLowerCase().trim();
            const existingEntity = existingNameMap.get(normalizedName);
            
            let relations = ent.relations || [];
            if(!Array.isArray(relations)) relations = [];
            relations = relations.map(r => typeof r === 'string' ? r : String(r)).filter(Boolean);

            if (existingEntity) {
                const newDesc = ent.description || ent.desc || '';
                if (existingEntity.desc !== newDesc || existingEntity.type !== ent.type) {
                    await DB.put('entities', {
                        id: existingEntity.id,
                        name: ent.name,
                        type: ent.type,
                        desc: newDesc || existingEntity.desc,
                        relations: [...new Set([...(existingEntity.relations || []), ...relations])],
                        source: existingEntity.source || 'pipeline',
                        updatedAt: now
                    });
                    await DB.put('vectors', { 
                        id: existingEntity.id, 
                        content: `[${ent.type}] ${ent.name}: ${newDesc}`, 
                        vector: Array.from({length:1536}, ()=>Math.random()), 
                        timestamp: now 
                    });
                    updatedCount++;
                } else {
                    skippedCount++;
                }
            } else {
                const id = 'ent_pipeline_' + Utils.uuid();
                await DB.put('entities', {
                    id, name: ent.name, type: ent.type,
                    desc: ent.description || ent.desc || '', relations,
                    source: 'pipeline', updatedAt: now
                });
                await DB.put('vectors', { id, content: `[${ent.type}] ${ent.name}: ${ent.description||ent.desc||''}`, vector: Array.from({length:1536}, ()=>Math.random()), timestamp: now });
                addedCount++;
            }
        }
        we._cachedEntities = null;
        let message = `深度提取完成: 新增 ${addedCount}，更新 ${updatedCount}`;
        if (skippedCount > 0) message += `，跳过 ${skippedCount}`;
        UI.toast(message);

        // ★ 同时刷新: 实体列表 + 知识图谱 + 世界观
        we.switchTab('graph');
    },

    // ═══ 从流水线提取世界观 — 修复: 提取后同步刷新图谱 ═══
    extractWorldView: async () => {
        const we = Modules.world_engine;
        const FB = Modules.fusion_book;
        if(!FB) return UI.toast('融合拆书模块未加载');
        const allPr = FB._allPipelineResults || {};
        const pr = FB._pipelineResults || {};
        const fusion = (allPr.fusion && allPr.fusion.trim()) ? allPr.fusion : (pr.fusion || '');
        const compare = (allPr.compare && allPr.compare.trim()) ? allPr.compare : (pr.compare || '');
        const left = (allPr.left && allPr.left.trim()) ? allPr.left : (pr.left || '');
        const right = (allPr.right && allPr.right.trim()) ? allPr.right : (pr.right || '');
        const src = [fusion, compare, left, right].filter(Boolean).join('\n\n');
        if(!src || src.length < 50) return UI.toast('流水线数据不足，请先运行融合拆书');

        const prompt = `你是一个专业的世界观构建引擎。请从以下融合拆书分析数据中，提取并构建完整的世界观设定。

【数据来源】
${src.slice(0, 6000)}

【提取要求】请为以下7个维度各生成详细的世界观设定：

1. history (历史与传说) — 世界的历史脉络、重大事件、传说故事、纪元划分
2. geography (地理与地貌) — 地理环境、重要地标、气候特征、空间布局
3. magic (魔法/科技体系) — 力量体系、等级划分、修炼/科技路线、核心规则
4. factions (势力与组织) — 主要势力、组织架构、势力关系、权力格局
5. species (种族与生物) — 种族分类、特殊生物、种族特征、种族关系
6. rules (世界规则) — 世界运行的底层规则、禁忌、自然法则
7. culture (文化与习俗) — 文化传统、社会制度、信仰体系、日常习俗

【输出格式】严格JSON对象：
{"history":"详细内容","geography":"详细内容","magic":"详细内容","factions":"详细内容","species":"详细内容","rules":"详细内容","culture":"详细内容"}

注意：每个维度至少200字，要具体、可直接用于创作。直接输出JSON，不要包裹markdown代码块`;

        UI.toast('正在提取世界观...');
        let fullRes = '';
        await AI.generate(prompt, {}, c => { fullRes += c; });

        let worldData = null;
        try { worldData = JSON.parse(fullRes); } catch(e1) {
            try { worldData = JSON.parse(fullRes.replace(/```json?\s*/g,'').replace(/```/g,'').trim()); } catch(e2) {
                const m = fullRes.match(/\{[\s\S]*\}/);
                if(m) try { worldData = JSON.parse(m[0]); } catch(e3) {}
            }
        }
        if(!worldData || typeof worldData !== 'object') return UI.toast('提取失败，AI返回格式异常');

        const cats = ['history','geography','magic','factions','species','rules','culture'];
        let count = 0;
        const now = Date.now();
        for(const cat of cats) {
            if(worldData[cat]) {
                await DB.put('entities', { id: 'world_' + cat, name: cat, type: 'world', desc: worldData[cat], source: 'pipeline', updatedAt: now });
                count++;
            }
        }
        we._cachedEntities = null;
        UI.toast(`世界观提取完成: ${count} 个维度已更新`);

        // ★ 同时刷新: 世界观 + 知识图谱
        we.switchTab('graph');
    },

    // ═══ 世界观构建 ═══
    _loadWorldCat: async () => {
        const we = Modules.world_engine;
        const cat = we.worldCat;
        const data = await DB.get('entities', 'world_' + cat);
        const el = document.getElementById('we-world-editor');
        if(el) el.value = (data && data.desc) ? data.desc : '';
    },
    _saveWorld: async () => {
        const we = Modules.world_engine;
        const cat = we.worldCat;
        const el = document.getElementById('we-world-editor');
        const desc = el ? el.value : '';
        if(!desc) return UI.toast('内容为空');
        await DB.put('entities', { id: 'world_' + cat, name: cat, type: 'world', desc, source: 'manual', updatedAt: Date.now() });
        we._cachedEntities = null;
        UI.toast('世界观已保存: ' + cat);
    },
    _aiGenWorld: async () => {
        const we = Modules.world_engine;
        const cat = we.worldCat;
        const catLabels = {history:'历史与传说',geography:'地理与地貌',magic:'魔法/科技体系',factions:'势力与组织',species:'种族与生物',rules:'世界规则',culture:'文化与习俗'};
        const existing = (document.getElementById('we-world-editor') || {}).value || '';
        let refCtx = '';
        const FB = Modules.fusion_book;
        if(FB) {
            const allPr = FB._allPipelineResults || {};
            const pr = FB._pipelineResults || {};
            const fusion = (allPr.fusion && allPr.fusion.trim()) ? allPr.fusion : (pr.fusion || '');
            if(fusion) refCtx += '\n[融合技法参考]\n' + fusion.slice(0, 1500);
        }
        await we._ensureCache();
        const relatedEntities = (we._cachedEntities || []).filter(e => !e.id.startsWith('world_')).slice(0, 15);
        if(relatedEntities.length) {
            refCtx += '\n[已有实体参考]\n' + relatedEntities.map(e => `${e.type}·${e.name}: ${(e.desc||'').slice(0,80)}`).join('\n');
        }
        const prompt = `请为小说世界观的「${catLabels[cat]}」维度生成详细设定。\n${existing ? '【已有内容(请在此基础上扩展)】\n' + existing.slice(0, 1500) : '【当前为空，请从零构建】'}\n${refCtx}\n\n要求：\n1. 内容详细、具体、有层次感\n2. 包含具体的名称、数据、细节\n3. 适合直接用于小说创作\n4. 至少500字\n5. 使用清晰的分段和标题`;
        const el = document.getElementById('we-world-editor');
        if(el) el.value = '生成中...';
        let fullRes = '';
        await AI.generate(prompt, {}, c => { fullRes += c; if(el) el.value = fullRes; });
        UI.toast('AI 世界观生成完成');
    },

    // ═══ 知识图谱 3D — 核心修复: 真正的网络结构，不是孤立的点 ═══
    // 每个实体(人物/物品/地点/情节/伏笔/势力/种族/魔法/规则/文化/历史/技法)
    // 都是一个具体节点，通过关系连线交织成3D网络
    _graph3d: null,
    _graphShowLabels: true,
    _graphPhysics: true,
    _graphAutoRotate: false,
    _graphRotateTimer: null,
    _graphChapterFilter: 'all',

    _refreshGraphFilterOptions() {
        const we = Modules.world_engine;
        const graphs = we._cachedLayeredGraphs || { volumes: [], cycles: [] };
        const layerSel = document.getElementById('we-graph-layer-filter');
        if(layerSel) layerSel.value = we._graphLayerFilter || 'volume';

        const volumeSel = document.getElementById('we-graph-volume-filter');
        if(volumeSel) {
            const options = ['<option value="auto">自动选择有效卷</option>']
                .concat((graphs.volumes || []).map(g => `<option value="${g.scopeId}">${g.title} · ${g.entityIds?.length || 0}实体</option>`));
            volumeSel.innerHTML = options.join('');
            volumeSel.value = (graphs.volumes || []).some(g => g.scopeId === we._graphVolumeFilter) ? we._graphVolumeFilter : 'auto';
        }

        const cycleSel = document.getElementById('we-graph-cycle-filter');
        if(cycleSel) {
            const options = ['<option value="auto">自动选择有效循环</option>']
                .concat((graphs.cycles || []).map(g => `<option value="${g.scopeId}">${g.title} · ${g.entityIds?.length || 0}实体</option>`));
            cycleSel.innerHTML = options.join('');
            cycleSel.value = (graphs.cycles || []).some(g => g.scopeId === we._graphCycleFilter) ? we._graphCycleFilter : 'auto';
        }
    },

    _chooseGraphScope(graphs) {
        const we = Modules.world_engine;
        const layer = we._graphLayerFilter === 'cycle' ? 'cycle' : 'volume';
        const list = layer === 'cycle' ? (graphs.cycles || []) : (graphs.volumes || []);
        if(!list.length) return { layer, graph: null };
        const selectedId = layer === 'cycle' ? we._graphCycleFilter : we._graphVolumeFilter;
        let graph = selectedId && selectedId !== 'auto'
            ? list.find(g => g.scopeId === selectedId)
            : null;
        if(!graph) graph = list.find(g => (g.entityIds || []).length > 0) || list[0];
        if(layer === 'cycle') we._graphCycleFilter = graph.scopeId;
        else we._graphVolumeFilter = graph.scopeId;
        return { layer, graph };
    },

    _initGraph: async () => {
        const we = Modules.world_engine;
        await we._ensureCache();
        await we.rebuildLayeredGraphs('graph_view', { silent: true });
        const graphs = await we._ensureLayeredGraphs();
        we._refreshGraphFilterOptions();
        const container = document.getElementById('we-graph-canvas');
        if(!container) return;

        // 清理旧图 + 旧定时器
        if(we._graphRotateTimer) { clearInterval(we._graphRotateTimer); we._graphRotateTimer = null; }
        if(we._graph3d) { try { we._graph3d._destructor && we._graph3d._destructor(); } catch(e){} we._graph3d = null; }
        container.innerHTML = '';

        const scope = we._chooseGraphScope(graphs);
        const selectedGraph = scope.graph;
        let entities = (we._cachedEntities || []).filter(e => !e.id.startsWith('world_'));
        if(selectedGraph) {
            const ids = new Set(selectedGraph.entityIds || []);
            entities = entities.filter(e => ids.has(e.id));
        } else {
            entities = [];
        }

        if(!entities.length) {
            const msg = scope.layer === 'cycle'
                ? '当前循环暂无图谱实体。拆书融合同步循环后会出现在这里。'
                : '当前卷暂无图谱实体。正文生成后会用正文+细纲提取实体并写入本卷。';
            container.innerHTML = '<div class="flex items-center justify-center h-full text-dim text-sm text-center px-6 leading-relaxed">' + msg + '</div>';
            const statsEl = document.getElementById('we-graph-stats');
            if(statsEl) statsEl.textContent = scope.layer === 'cycle' ? '循环图谱 · 空' : '卷图谱 · 空';
            const scopeTitle = document.getElementById('we-graph-scope-title');
            if(scopeTitle) scopeTitle.textContent = scope.layer === 'cycle' ? '循环图谱' : '卷图谱';
            const scopeEl = document.getElementById('we-g-scope');
            if(scopeEl) scopeEl.textContent = selectedGraph?.title || '未选择';
            return;
        }

        const colorMap = {'人物':'#eab308','物品':'#3b82f6','地点':'#22c55e','情节':'#ef4444','伏笔':'#a855f7','势力':'#f43f5e','种族':'#f97316','魔法':'#6366f1','规则':'#0ea5e9','文化':'#ec4899','历史':'#f59e0b','技法':'#14b8a6'};

        // ★ 构建 name→entity 映射 (模糊匹配)
        const nameToEntity = {};
        entities.forEach(e => {
            nameToEntity[e.name] = e;
            // 也用小写做映射，增加匹配率
            nameToEntity[e.name.toLowerCase()] = e;
        });

        // ★ 构建边 — 核心: 从relations字段解析真正的关系
        const links = [];
        const edgeSet = new Set();

        const addLink = (sourceId, targetId, label) => {
            if(!targetId || sourceId === targetId) return;
            const key = [sourceId, targetId].sort().join('_');
            if(edgeSet.has(key)) return;
            edgeSet.add(key);
            links.push({ source: sourceId, target: targetId, label: label || '' });
        };

        // 1. 从 relations 字段解析关系 (格式: "关系类型:实体名" 或 纯 "实体名")
        entities.forEach(e => {
            const relations = Array.isArray(e.relations)
                ? e.relations
                : (typeof e.relations === 'string' ? e.relations.split(',').map(s => s.trim()).filter(Boolean) : []);
            if(!relations.length) return;
            relations.forEach(rel => {
                if(!rel || typeof rel !== 'string') return;
                let label = '', targetName = rel.trim();
                if(rel.includes(':')) {
                    const colonIdx = rel.indexOf(':');
                    label = rel.slice(0, colonIdx).trim();
                    targetName = rel.slice(colonIdx + 1).trim();
                }
                // 精确匹配
                let target = nameToEntity[targetName] || nameToEntity[targetName.toLowerCase()];
                // 模糊匹配: 如果精确匹配失败，尝试包含匹配
                if(!target) {
                    for(const ent of entities) {
                        if(ent.id === e.id) continue;
                        if(ent.name.includes(targetName) || targetName.includes(ent.name)) {
                            target = ent;
                            break;
                        }
                    }
                }
                if(target) addLink(e.id, target.id, label);
            });
        });

        // 2. 描述文本交叉引用: 如果实体A的描述中提到了实体B的名称，建立"提及"关系
        entities.forEach(a => {
            const relations = Array.isArray(a.relations)
                ? a.relations
                : (typeof a.relations === 'string' ? a.relations.split(',').map(s => s.trim()).filter(Boolean) : []);
            const aText = (a.desc || '') + ' ' + relations.join(' ');
            if(!aText || aText.length < 5) return;
            entities.forEach(b => {
                if(a.id === b.id) return;
                if(b.name.length < 2) return;
                if(aText.includes(b.name)) {
                    addLink(a.id, b.id, '提及');
                }
            });
        });

        // 3. 同类型实体链式连接 (让同类型的节点聚在一起但不是孤立的)
        const typeGroups = {};
        entities.forEach(e => { if(!typeGroups[e.type]) typeGroups[e.type] = []; typeGroups[e.type].push(e); });
        Object.values(typeGroups).forEach(group => {
            if(group.length < 2 || group.length > 40) return;
            for(let i = 0; i < group.length - 1; i++) {
                addLink(group[i].id, group[i+1].id, '同类');
            }
        });

        // 计算每个节点的连接数
        const degreeMap = {};
        entities.forEach(e => { degreeMap[e.id] = 0; });
        links.forEach(l => { degreeMap[l.source] = (degreeMap[l.source]||0) + 1; degreeMap[l.target] = (degreeMap[l.target]||0) + 1; });

        // 构建节点
        const nodes = entities.map(e => {
            const deg = degreeMap[e.id] || 0;
            return {
                id: e.id,
                name: e.name,
                type: e.type || '其他',
                desc: (e.desc || '').slice(0, 150),
                val: 3 + deg * 2,
                color: colorMap[e.type] || '#888',
                degree: deg
            };
        });

        // 更新统计
        const nodesEl = document.getElementById('we-g-nodes');
        const edgesEl = document.getElementById('we-g-edges');
        if(nodesEl) nodesEl.textContent = nodes.length;
        if(edgesEl) edgesEl.textContent = links.length;
        const statsEl = document.getElementById('we-graph-stats');
        const scopeName = selectedGraph?.title || (scope.layer === 'cycle' ? '循环图谱' : '卷图谱');
        if(statsEl) statsEl.textContent = `${scope.layer === 'cycle' ? '循环图谱' : '卷图谱'} · ${scopeName} · 节点:${nodes.length} 连线:${links.length}`;
        const scopeTitle = document.getElementById('we-graph-scope-title');
        if(scopeTitle) scopeTitle.textContent = scope.layer === 'cycle' ? '循环图谱统计' : '卷图谱统计';
        const scopeEl = document.getElementById('we-g-scope');
        if(scopeEl) scopeEl.textContent = scopeName;

        // 检查 3d-force-graph 是否可用
        if(typeof ForceGraph3D === 'undefined') {
            container.innerHTML = '<div class="flex items-center justify-center h-full text-dim text-sm">3D图谱库加载中，请稍后刷新...</div>';
            return;
        }

        const width = container.clientWidth || 800;
        const height = container.clientHeight || 600;

        const Graph = ForceGraph3D()(container)
            .width(width)
            .height(height)
            .backgroundColor('#08080a')
            .graphData({ nodes, links })
            .nodeVal('val')
            .nodeColor(n => n.color)
            .nodeOpacity(0.9)
            .nodeResolution(16)
            .linkColor(link => {
                // 有明确关系的连线更亮
                if(link.label && link.label !== '同类' && link.label !== '提及') return 'rgba(255,255,255,0.25)';
                if(link.label === '提及') return 'rgba(100,200,255,0.15)';
                return 'rgba(255,255,255,0.06)';
            })
            .linkWidth(link => {
                if(link.label && link.label !== '同类' && link.label !== '提及') return 1.2;
                return 0.4;
            })
            .linkOpacity(0.6)
            .linkDirectionalParticles(link => (link.label && link.label !== '同类') ? 2 : 0)
            .linkDirectionalParticleWidth(1)
            .linkDirectionalParticleColor(() => 'rgba(255,200,100,0.6)')
            .d3AlphaDecay(0.02)
            .d3VelocityDecay(0.3)
            .warmupTicks(80)
            .cooldownTicks(200)
            .onNodeHover(node => { container.style.cursor = node ? 'pointer' : 'default'; })
            .onNodeClick(node => {
                if(!node) return;
                const distance = 120;
                const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
                Graph.cameraPosition(
                    { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
                    node, 1000
                );
                we._loadEntity(node.id);
                we.currentTab = 'dashboard';
                const ws = document.getElementById('we-workspace');
                if(ws) ws.innerHTML = we._renderWorkspace();
                we._refreshEntities();
            });

        // 标签渲染
        if(we._graphShowLabels) {
            const T = window.THREE;
            if(!T || !T.CanvasTexture) {
                Graph.nodeLabel(n => `[${n.type}] ${n.name} (${n.degree}条连线): ${n.desc || ''}`);
            } else {
                Graph.nodeThreeObject(node => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const fontSize = Math.max(24, 18 + (node.degree || 0) * 4);
                    const text = node.name || '';
                    ctx.font = `${node.degree > 3 ? 'bold ' : ''}${fontSize}px sans-serif`;
                    const textWidth = ctx.measureText(text).width;
                    canvas.width = textWidth + 16;
                    canvas.height = fontSize + 12;
                    ctx.fillStyle = 'rgba(0,0,0,0.6)';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.font = `${node.degree > 3 ? 'bold ' : ''}${fontSize}px sans-serif`;
                    ctx.fillStyle = node.color || '#fff';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
                    const texture = new T.CanvasTexture(canvas);
                    const spriteMat = new T.SpriteMaterial({ map: texture, depthWrite: false, transparent: true });
                    const sprite = new T.Sprite(spriteMat);
                    const scale = Math.max(8, 5 + (node.degree || 0) * 1.5);
                    sprite.scale.set(scale * (canvas.width / canvas.height), scale, 1);
                    return sprite;
                });
            }
        } else {
            Graph.nodeLabel(n => `[${n.type}] ${n.name} (${n.degree}条连线): ${n.desc || ''}`);
        }

        we._graph3d = Graph;
        if(we._graphAutoRotate) {
            const controls = Graph.controls();
            if(controls) {
                controls.autoRotate = true;
                controls.autoRotateSpeed = 0.5;
            }
            // 如果controls不支持autoRotate，用手动旋转
            if(!controls || !controls.autoRotate) {
                we._graphRotateTimer = setInterval(() => {
                    if(!we._graph3d || !we._graphAutoRotate) {
                        clearInterval(we._graphRotateTimer);
                        we._graphRotateTimer = null;
                        return;
                    }
                    const scene = we._graph3d.scene();
                    if(scene) scene.rotation.y += 0.003;
                }, 30);
            }
        }
    },
});
