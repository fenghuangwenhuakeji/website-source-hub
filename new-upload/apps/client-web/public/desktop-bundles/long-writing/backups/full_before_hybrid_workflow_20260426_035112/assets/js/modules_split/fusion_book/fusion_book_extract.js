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

    // ---- 世界引擎一致性桥 ----

    /**
     * 从世界引擎构建全局一致性上下文
     * 包含：世界观维度、已出场角色、地点、势力、力量体系、伏笔追踪、情绪弧线
     */
    async _buildConsistencyContext() {
        const allEntities = await DB.getAll('entities') || [];
        const pipelineEntities = allEntities.filter(e => e.source === 'pipeline' || e.source === 'world');

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
    async _pipelineExtractEntities() {
        const fusion = this._pipelineResults.fusion || '';
        const outline = this._pipelineResults.outline || '';
        const sourceText = (fusion + '\n' + outline).slice(0, 8000);
        if (!sourceText.trim()) return;

        // 获取已有实体名称，让AI建立关联
        const existingEntities = await DB.getAll('entities') || [];
        const existingNames = existingEntities.filter(e => !e.id.startsWith('world_')).map(e => e.name);
        const existingHint = existingNames.length ? `\n\n【已有实体(请在relations中引用这些名称建立关联)】\n${existingNames.slice(0,50).join('、')}` : '';

        const outEl = document.getElementById('pl-output');
        if (outEl) outEl.textContent = '正在提取融合细纲中的实体...';
        this._setGenerating(true);

        let raw = '';
        try {
            await AI.generate(
                `你是深度实体提取引擎。\n【核心任务】从以下融合细纲中提取所有原创实体和世界观元素。\n\n【数据来源说明】\n以下内容是一份基于两书技法融合而成的全新网文细纲。\n细纲中的角色、物品、地点、势力等全部是原创的，不是原书中的任何内容。\n你的任务是从这份原创细纲中提取构建世界引擎所需的实体。\n\n${sourceText}\n${existingHint}

【提取铁律】\n1. 提取的是融合细纲中的原创实体，不是原书内容\n2. 尽可能完整地提取角色关系、势力结构、魔法体系等\n3. 如果某个实体在细纲中只是提及但无详细描述，根据上下文合理补全\n4. 不要遗漏任何实体，关系网络要尽可能完整\n\n【提取类型】\n- 人物：所有角色（主角、配角、反派），含性格、身份\n- 物品：道具、武器、法宝、关键物件\n- 地点：地名、场景、建筑、地标\n- 情节：关键事件、转折点、冲突\n- 伏笔：暗示、线索、未解之谜\n- 势力：门派、组织、国家、阵营、家族\n- 种族：种族设定、族群特征\n- 魔法：功法、技能、法术、科技体系、修炼等级\n- 规则：世界法则、力量体系、禁忌\n- 文化：风俗、社会制度、信仰\n- 历史：历史事件、传说、纪元\n- 技法：可复用的写作套路、节奏模型、爽点公式\n\n【输出格式】JSON数组：\n[{"name":"名称","type":"人物/物品/地点/情节/伏笔/势力/种族/魔法/规则/文化/历史/技法","description":"详细描述50-200字","relations":["关系类型:关联实体名"]}]\n\n【关键要求 - 关系网络】\n- 每个实体的relations必须尽可能多地引用其他实体名称\n- 关系格式："关系类型:实体名"，例如 "师父:张三","敌对:魔教","位于:青云山","拥有:轩辕剑"\n- 人物之间要有师徒/敌友/从属关系\n- 人物与地点要有"位于"/"出没"关系\n- 人物与物品要有"拥有"/"使用"关系\n- 人物与势力要有"所属"/"统治"关系\n- 情节与人物要有"参与"关系\n- 这些关系是构建知识网络图的关键，不要遗漏！\n- 尽可能多提取，不要遗漏。\n- 直接输出纯JSON数组，禁止使用markdown代码块(\`\`\`json)包裹，禁止输出任何非JSON文本。`,
                {}, c => {
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

        // ★ 实体去重合并：与已有实体对比，避免重复创建
        const allExisting = await DB.getAll('entities') || [];
        const mergedEntities = [];
        let mergeCount = 0;
        for (const ent of entities) {
            if (!ent || !ent.name) continue;
            const entType = ent.type || '其他';
            // 查找同名同类型的已有实体（排除世界观维度实体）
            const existing = allExisting.find(e =>
                e.name === ent.name && e.type === entType && !e.id.startsWith('world_')
            );
            if (existing) {
                // 合并描述：取更详细的一个，或拼接
                const newDesc = ent.description || ent.desc || '';
                const oldDesc = existing.desc || '';
                if (newDesc && newDesc.length > oldDesc.length * 0.3) {
                    existing.desc = newDesc.length > oldDesc.length ? newDesc : (oldDesc + '\n【补充】' + newDesc);
                    // 合并关系
                    const newRels = (ent.relations || []).filter(r => typeof r === 'string' && !existing.relations.includes(r));
                    if (newRels.length) {
                        existing.relations = [...existing.relations, ...newRels];
                    }
                    existing.updatedAt = now;
                    await DB.put('entities', existing);
                    // 同步更新向量
                    const vectorContent = `[${existing.type}] ${existing.name}: ${existing.desc}`;
                    await DB.put('vectors', { id: existing.id, content: vectorContent, vector: Array.from({length:1536}, ()=>Math.random()), timestamp: now });
                    mergeCount++;
                    this._plLog(`  🔄 实体合并更新: ${ent.name} (${newRels.length ? '+' + newRels.length + '关系' : '描述更新'})`, 'entity');
                }
            } else {
                mergedEntities.push(ent);
            }
        }
        entities = mergedEntities;
        if (mergeCount > 0) {
            this._plLog(`实体去重: ${mergeCount} 个已有实体已合并更新`, 'info');
        }

        // 存入世界引擎 + 向量库
        let count = 0;
        // ★ 计算当前循环ID（如果启用循环模式）
        let currentCycleId = null;
        const chNum = (this._accContext || {}).chapterNum;
        if(this._plConfig.cycleMode && chNum && typeof Modules !== 'undefined' && Modules.world_engine) {
            const cycleInfo = Modules.world_engine.getCycleIdForChapter(chNum, this._plConfig.cycleSize);
            if(cycleInfo) currentCycleId = cycleInfo.cycleId;
        }
        for (const ent of entities) {
            if (!ent || !ent.name) continue;
            const typeMap = { technique:'技法', character_template:'人物', conflict_model:'情节', rhythm:'技法', hook:'技法' };
            const type = typeMap[ent.type] || ent.type || '技法';
            // ★ 确保relations是字符串数组
            let relations = ent.relations || [];
            if(!Array.isArray(relations)) relations = [];
            relations = relations.map(r => typeof r === 'string' ? r : String(r)).filter(Boolean);

            const id = Utils.uuid();
            const entityPayload = {
                id, name: ent.name, type: type,
                desc: ent.description || ent.desc || '',
                relations: relations,
                tags: ent.tags || ['融合', '流水线', '原创实体'],
                source: 'pipeline',
                sourceBook: '融合细纲原创',
                updatedAt: now
            };
            if(currentCycleId) entityPayload.cycles = [currentCycleId];
            await DB.put('entities', entityPayload);
            const vectorContent = `[${type}] ${ent.name}: ${ent.description || ent.desc || ''}`;
            await DB.put('vectors', { id, content: vectorContent, vector: Array.from({length:1536}, ()=>Math.random()), timestamp: now });
            count++;
            this._plLog(`  → ${type}: ${ent.name}${relations.length ? ' (关联'+relations.length+'个)' : ''}${currentCycleId ? ' [循环]' : ''}`, 'entity');
        }

        this._pipelineResults.world = raw.slice(0, 4000);
        this._allPipelineResults.world = (this._allPipelineResults.world || '') + `\n[第${(this._accContext||{}).chapterNum||'?'}章] ${count}个实体已提取\n`;
        this._plLog(`世界引擎: 共提取 ${count} 个实体`, 'ok');

        // ★ 刷新世界引擎缓存，确保图谱能看到新数据
        if(Modules.world_engine) Modules.world_engine._cachedEntities = null;

        // ★ 自动提取世界观维度 (从实体中归纳到世界观构建的各个维度)
        if (count > 0) {
            try {
                await this._pipelineExtractWorldView(entities, sourceText);
            } catch(e) { this._plLog('世界观自动提取失败: ' + e.message, 'err'); }
        }

        if (fusion) {
            await DB.put('assets', {
                id: 'fusion_tech_' + Date.now(),
                name: '融合写作技法', type: 'technique',
                content: fusion, tags: ['融合', '技法', '自动生成'], createdAt: now
            });
        }
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

        // 写入世界观维度 (追加模式，不覆盖已有内容)
        let worldCount = 0;
        for (const [cat, label] of Object.entries(catMap)) {
            if (!worldData[cat]) continue;
            const id = 'world_' + cat;
            const existing = await DB.get('entities', id);
            const oldDesc = (existing && existing.desc) ? existing.desc : '';
            const newContent = worldData[cat].trim();
            // 追加新内容（去重）
            const merged = oldDesc ? oldDesc + '\n' + newContent : newContent;
            await DB.put('entities', {
                id, name: label, type: 'world',
                desc: merged.slice(0, 5000),
                source: 'pipeline', updatedAt: Date.now()
            });
            worldCount++;
            this._plLog(`  🌍 世界观: ${label} 已更新`, 'entity');
        }

        if (worldCount > 0) {
            if (Modules.world_engine) Modules.world_engine._cachedEntities = null;
            this._plLog(`世界观: ${worldCount} 个维度已自动更新`, 'ok');
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

        // 获取累积上下文（前章细纲+实体+知识图谱）
        const acc = this._accContext || {};
        const prevOutlines = acc.outlines ? acc.outlines.slice(-3000) : '';
        const prevEntities = acc.entities ? acc.entities.slice(-2000) : '';
        const knowledgeGraph = acc.knowledgeGraph || '';
        const chNum = acc.chapterNum || 1;

        let prompt = await Modules.short.getPrompt('fusion_outline');
        if (!prompt) {
            prompt = `你是一位资深网文编辑。基于以下融合细纲，生成第${chNum}章的详细展开细纲。\n【核心原则】融合细纲中的角色/世界观/情节全部是原创的，不是原书内容。你要做的是把融合细纲中的本章内容展开为更详细的写作指导。\n\n【融合细纲】\n${fusion.slice(0, 4000)}\n\n【对比分析】\n${(this._pipelineResults.compare || '').slice(0, 2000)}
${knowledgeGraph ? `\n${knowledgeGraph.slice(0, 3000)}` : ''}
${prevOutlines ? `\n【前章细纲参考（保持连贯性）】\n${prevOutlines}` : ''}

【核心要求】
- 所有人物性格、身份、关系必须与融合细纲中的设定保持一致
- 伏笔和线索要与前章呼应，新伏笔要标注回收计划
- 世界观设定（魔法体系、势力关系、地理等）遵循融合细纲的原创设定
- 新出现的人物/物品/地点要标注，方便后续提取到知识图谱
- 技法运用标注来源（主书骨架/辅书血肉/融合创新）

请生成本章详细细纲，包含：
1. 章节标题
2. 核心事件（100字内）
3. 场景分段（每段场景的目的和情绪）
4. 运用的融合技法（标注来源）
5. 情绪节奏（起/承/转/合，标注分值）
6. 爽点/钩子设计
7. 对话要点（潜台词、信息差）
8. 一致性校验：是否与融合细纲矛盾？
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
            await AI.generate(prompt, {}, c => {
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

        // 存入DB
        await DB.put('outlines', {
            id: 'fusion_outline_' + Date.now(),
            title: `融合细纲 (${lName} × ${rName})`,
            content: result,
            source: 'pipeline',
            createdAt: Date.now()
        });

        // 同步到凤凰创作流
        if (typeof Modules.phoenix !== 'undefined') {
            Modules.phoenix.data = Modules.phoenix.data || {};
            const chIdx = this.left.chapterIdx;
            Modules.phoenix.data.outlineRaw = (Modules.phoenix.data.outlineRaw || '') + '\n\n---\n\n## 第' + (chIdx + 1) + '章细纲\n\n' + result;
            this._plLog('📋 细纲→凤凰创作流', 'entity');
        }

        // 同步到长篇执笔大纲
        const chIdx = this.left.chapterIdx;
        const leftBook2 = (this._books || []).find(b => b.id === this.left.bookId);
        const lCh = leftBook2 && leftBook2.chapters[chIdx] ? leftBook2.chapters[chIdx] : null;
        const chapTitle = lCh ? lCh.title : '第' + (chIdx + 1) + '章';
        const chapId = Utils.uuid();
        await DB.put('chapters', { id: chapId, title: `第${chIdx + 1}章 ${chapTitle}(融合)`, content: '', outline: result, order: chIdx + 1, volumeId: null, source: 'pipeline' });
        this._plLog('📋 细纲→长篇执笔大纲', 'entity');

        this._plLog(`细纲生成完成 (${result.length}字)`, 'ok');
    },

    async _pipelineWrite() {
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
            await AI.generate(prompt, {}, c => {
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

        // 存入DB
        if (result) {
            await DB.put('writings', {
                id: 'fusion_write_' + Date.now(),
                title: '融合正文',
                content: result,
                source: 'pipeline',
                createdAt: Date.now()
            });

            // 同步到长篇执笔正文：找到刚才细纲创建的章节并更新正文
            const chIdx = this.left.chapterIdx;
            const allChaps = await DB.getAll('chapters') || [];
            const targetChap = allChaps.find(c => c.source === 'pipeline' && c.title && c.title.includes(`第${chIdx + 1}章`));
            if (targetChap) {
                targetChap.content = result;
                await DB.put('chapters', targetChap);
                this._plLog('✍️ 正文→长篇执笔', 'entity');
            }

            // 正文存RAG
            if (typeof RAGSystem !== 'undefined') {
                await RAGSystem.addDocument(`正文_第${chIdx + 1}章`, result.slice(0, 8000), 'pipeline_write');
                this._plLog('🔍 正文→RAG', 'entity');
            }
        }
    },
});
