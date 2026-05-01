Object.assign(Modules.fusion_book, {
    // ---- 查看结果 ----
    viewResult(key) {
        const content = this._pipelineResults[key];
        if (!content) return;
        const outEl = document.getElementById('fb-output');
        if (outEl) outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(content) : content;
    },

    exportResult() {
        const outEl = document.getElementById('fb-output');
        const content = outEl?.innerText;
        if (!content) return UI.toast('暂无内容');
        ContextHelper.exportToLibrary('融合拆书_' + new Date().toLocaleTimeString(), content);
    },

    saveToMemory() {
        const outEl = document.getElementById('fb-output');
        const content = outEl?.innerText;
        if (!content) return UI.toast('暂无内容');
        MemorySystem.addWorking('[融合拆书] ' + content.slice(0, 500), 'fusion', 4, { source: 'fusion_book' });
        UI.toast('已存入工作记忆');
    },

    async sendToWorld(side) {
        const analysis = this[side]?.analysis;
        if (!analysis) return UI.toast('请先分析' + (side === 'left' ? '左' : '右') + '书');
        await DB.put('assets', {
            id: 'fusion_' + side + '_' + Date.now(),
            name: (side === 'left' ? '左书' : '右书') + '技法分析',
            type: 'technique',
            content: analysis,
            tags: ['融合', '技法', side],
            createdAt: Date.now()
        });
        UI.toast('已存入世界引擎');
    },

    sendToPhoenix() {
        const content = this._pipelineResults.fusion || this._pipelineResults.compare || '';
        if (!content) return UI.toast('请先完成融合或对比');
        // 融合技法为去内容化通用模板，可套用到任何新故事
        const ctx = '[融合拆书技法] 以下内容为两书技法融合产出的原创细纲/通用技法模板。角色/世界观/情节全部原创，严禁复用原书内容。';
        const fullContent = ctx + '\n\n' + content;
        // 存入凤凰创作的素材
        if (typeof Modules.phoenix !== 'undefined' && Modules.phoenix._fusionRef !== undefined) {
            Modules.phoenix._fusionRef = fullContent;
        }
        MemorySystem.addWorking('[融合技法→凤凰流] ' + ctx + '\n' + content.slice(0, 300), 'fusion_ref', 5, { nexusState: { chr: '原创', wld: '融合细纲' } });
        App.nav('phoenix');
        UI.toast('已跳转到凤凰创作，融合技法已注入');
    },

    async sendToWriter() {
        const content = this._pipelineResults.fusion || this._pipelineResults.write || '';
        if (!content) return UI.toast('请先完成融合');
        // 融合技法为去内容化通用模板，可套用到任何新故事
        const ctx = '[融合拆书技法] 以下内容为两书技法融合产出的原创细纲/通用技法模板。角色/世界观/情节全部原创，严禁复用原书内容。';
        const fullContent = ctx + '\n\n' + content;
        MemorySystem.addWorking('[融合技法→执笔台] ' + ctx + '\n' + content.slice(0, 300), 'fusion_ref', 5, { nexusState: { chr: '原创', wld: '融合细纲' } });

        // ★ GenesisCore 项目绑定
        let project = await GenesisCore.getActiveProject();
        if (!project || project.mode !== 'fusion') {
            project = await GenesisCore.createProject({
                name: '拆书融合项目',
                mode: 'fusion',
                metadata: { fusionContext: fullContent.slice(0, 2000) }
            });
        } else {
            await GenesisCore.updateActiveProject({
                status: 'writing',
                metadata: { ...project.metadata, fusionContext: fullContent.slice(0, 2000) }
            });
        }
        // 将融合技法写入 writer 规则
        const existing = await DB.get('settings', 'writer_rules') || {};
        const fusionRules = '\n\n[融合技法参考 — 来自拆书融合]\n' + fullContent.slice(0, 3000);
        await DB.put('settings', { id: 'writer_rules', rules: (existing.rules || '') + fusionRules, continueRules: existing.continueRules || '' });

        App.nav('writer');
        UI.toast('已跳转到执笔台，融合技法已注入');
    },

    async _cycleFusionSummary(cyclePairs, cycleSize, leftBook, rightBook) {
        const cycleNum = Math.ceil(cyclePairs.length / cycleSize);
        const startIdx = cyclePairs[0].leftIdx + 1;
        const endIdx = cyclePairs[cyclePairs.length - 1].leftIdx + 1;

        // 获取书名（用于日志和prompt）
        const primarySide = this._primaryBook || 'left';
        const secondarySide = primarySide === 'left' ? 'right' : 'left';
        const primaryBookObj = primarySide === 'left' ? leftBook : rightBook;
        const secondaryBookObj = primarySide === 'left' ? rightBook : leftBook;
        const primaryName = primaryBookObj ? primaryBookObj.name : (primarySide === 'left' ? '左书' : '右书');
        const secondaryName = secondaryBookObj ? secondaryBookObj.name : (primarySide === 'left' ? '右书' : '左书');

        this._plLog(`🔄 执行第${cycleNum}个循环总结 (第${startIdx}-${endIdx}章)`, 'info');

        const titleEl = document.getElementById('pl-current-title');
        if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-sync mr-1 text-cyan-400"></i>循环融合总结: 第${startIdx}-${endIdx}章`; 

        let leftCycleAnalyses = '';
        let rightCycleAnalyses = '';
        let cycleOutlines = '';
        let cycleEntities = [];
        let cycleWritings = '';

        for (let i = 0; i < cyclePairs.length; i++) {
            const { leftIdx, rightIdx } = cyclePairs[i];
            const lCh = leftBook.chapters[leftIdx];
            const rCh = rightBook.chapters[rightIdx];

            const leftKey = `cycle_${leftBook.id}_${leftIdx}`;
            const rightKey = `cycle_${rightBook.id}_${rightIdx}`;
            const outlineKey = `cycle_outline_${leftIdx}`;
            const writeKey = `cycle_write_${leftIdx}`;

            try {
                const leftStored = await DB.get('settings', leftKey);
                const rightStored = await DB.get('settings', rightKey);
                const outlineStored = await DB.get('settings', outlineKey);
                const writeStored = await DB.get('settings', writeKey);

                if (leftStored?.content) {
                    leftCycleAnalyses += `## 第${leftIdx + 1}章: ${lCh.title}\n${leftStored.content}\n\n`;
                }
                if (rightStored?.content) {
                    rightCycleAnalyses += `## 第${rightIdx + 1}章: ${rCh.title}\n${rightStored.content}\n\n`;
                }
                if (outlineStored?.content) {
                    cycleOutlines += `### 第${leftIdx + 1}章细纲\n${outlineStored.content.slice(0, 1000)}\n\n`;
                }
                if (writeStored?.content) {
                    cycleWritings += `### 第${leftIdx + 1}章正文片段\n${writeStored.content.slice(0, 500)}\n\n`;
                }
            } catch (e) {
                console.warn('读取循环章节分析失败:', e);
            }
        }

        if (leftCycleAnalyses.length === 0 || rightCycleAnalyses.length === 0) {
            this._plLog('⚠️ 循环章节分析不足，跳过循环总结', 'info');
            return;
        }

        const allEntities = await DB.getAll('entities') || [];
        const cycleRelatedEntities = allEntities.filter(e => {
            if (!e.chapterRef) return false;
            for (let i = startIdx; i <= endIdx; i++) {
                if (e.chapterRef.includes(i)) return true;
            }
            return false;
        });

        let entityContext = '';
        if (cycleRelatedEntities.length > 0) {
            entityContext = `\n\n【本循环已提取实体 (${cycleRelatedEntities.length}个)】\n`;
            const grouped = {};
            cycleRelatedEntities.forEach(e => {
                const t = e.type || '其他';
                if (!grouped[t]) grouped[t] = [];
                grouped[t].push(e);
            });
            for (const [type, ents] of Object.entries(grouped)) {
                entityContext += `[${type}] ${ents.map(e => e.name + (e.relations?.length ? `(${e.relations.slice(0,3).join(',')})` : '')).join('、')}\n`;
            }
        }

        const prevCycleKey = `cycle_fusion_prev_${startIdx}`;
        let prevCycleSummary = '';
        try {
            const prevStored = await DB.get('settings', prevCycleKey);
            if (prevStored?.content) {
                prevCycleSummary = `\n\n【上一循环总结参考】\n${prevStored.content.slice(0, 1500)}`;
            }
        } catch(e) {}

        const cycleFusionPrompt = `你是顶级网文技法融合大师，同时是NEXUS OS v2.0叙事工程的技法拆解专家。\n【核心原则】以下分析来自两书的技法拆解，你要做的是融合这些技法，产出一份去内容化的技法总结和融合细纲片段。\n【绝对禁令】\n1. 禁止出现原书角色名、地名、势力名\n2. 禁止复述原书的具体情节\n3. 所有输出必须是"通用技法"或"原创细纲片段"\n\n【技法来源A（${leftBook.name || '左书'}）】\n${leftCycleAnalyses.slice(0, 5000)}\n\n【技法来源B（${rightBook.name || '右书'}）】\n${rightCycleAnalyses.slice(0, 5000)}\n\n【本循环细纲参考】\n${cycleOutlines.slice(0, 2000)}
${entityContext}
${prevCycleSummary}

=== NEXUS OS v2.0 循环融合输出规范 ===
1. 【技法融合总结】两书技法融合后的核心创作指南（去内容化，通用模板）
2. 【循环核心技法模板】提炼可直接套用的写作公式（开篇钩子、节奏控制、爽点设计）
3. 【节奏曲线分析】这${cycleSize}章的节奏变化规律，标注高潮点和过渡点
4. 【爽点矩阵】爽点类型、密度、释放节奏，情绪价值曲线
5. 【悬念链条】伏笔和钩子的衔接设计，跨章节信息差运用
6. 【实体关联网络】本循环关键实体及其关系变化（原创实体，非原书内容）
7. 【NEXUS四状态机快照】
   - CHR角色状态: 列出本循环中各核心角色的状态变迁(S0注册→S1激活→S2互动→S3转折→S4休眠→S5退场→S6死亡)
   - WLD世界规则: 本循环中提出/验证/扩展/冲突/重构/冻结的规则
   - FOE伏笔网络: 本循环埋设/强化/回收/废弃的伏笔清单，标注计划回收章节
   - EMO情绪锚点: 每章情绪分值(1-10)、情绪词、钩子类型、张力等级
8. 【融合细纲片段】基于融合技法，创作一段原创细纲（新角色、新情节，展示技法运用）
9. 【下一循环优化建议】针对下${cycleSize}章的技法提升建议
10. 【可复用套路清单(零件库)】3-5个可直接套用的写作模板，每个含:名称+适用场景+执行步骤

只输出技法总结和原创细纲片段，严禁涉及原书的具体角色和情节。`;

        this._plSetStep('fusion', 'active', '循环深度融合中...');
        let result = '';
        try {
            await AI.generate(cycleFusionPrompt, {}, c => {
                result += c;
                const outEl = document.getElementById('pl-output');
                if (outEl) outEl.textContent = result;
            });
        } catch (e) {
            if (e.message === '已中止') { throw e; }
            this._plLog(`🔴 循环融合失败: ${e.message}`, 'err');
            return;
        }

        const cycleKey = `cycle_fusion_${startIdx}_${endIdx}`;
        await DB.put('settings', { id: cycleKey, content: result, createdAt: Date.now() });

        const nextCycleKey = `cycle_fusion_prev_${endIdx + 1}`;
        await DB.put('settings', { id: nextCycleKey, content: result.slice(0, 2000), createdAt: Date.now() });

        this._allPipelineResults.fusion += `\n\n---\n\n## 循环融合总结: 第${startIdx}-${endIdx}章\n\n${result}`;
        await DB.put('settings', { id: 'pipeline_fusion_context', content: this._allPipelineResults.fusion, updatedAt: Date.now() });

        if (this._plConfig.doRAG && typeof RAGSystem !== 'undefined') {
            await RAGSystem.addDocument(`循环融合_第${startIdx}-${endIdx}章`, result.slice(0, 8000), 'pipeline');
            
            if (cycleRelatedEntities.length > 0) {
                const entitySummary = cycleRelatedEntities.map(e => 
                    `${e.name}(${e.type}): ${e.desc?.slice(0, 50) || ''}`
                ).join('\n');
                await RAGSystem.addDocument(`循环实体_第${startIdx}-${endIdx}章`, entitySummary, 'entity');
            }
        }

        if (cycleWritings) {
            const cycleWriteKey = `cycle_writings_${startIdx}_${endIdx}`;
            await DB.put('settings', { id: cycleWriteKey, content: cycleWritings, createdAt: Date.now() });
        }

        this._plSetStep('fusion', 'done', `${result.length}字`);
        this._plLog(`✅ 循环融合完成: 第${startIdx}-${endIdx}章 (${result.length}字)`, 'ok');
        this._plLog(`   📊 提取实体: ${cycleRelatedEntities.length}个 | 细纲: ${cycleOutlines.length}字`, 'entity');

        await this._cycleExtractPatterns(startIdx, endIdx, result);

        // ★ 同步到世界引擎循环层
        try {
            const cycleData = {
                id: `cycle_${startIdx}_${endIdx}`,
                bookId: leftBook.id + '_' + rightBook.id,
                startChapter: startIdx,
                endChapter: endIdx,
                cycleNum: Math.ceil(endIdx / cycleSize),
                cycleSize,
                fusionEssence: result,
                compareResult: this._pipelineResults.compare || '',
                entityNames: cycleRelatedEntities.map(e => e.name),
                chapterIds: cyclePairs.map(p => 'ch_' + (p.leftIdx + 1)),
                // 简单正则提取NEXUS数据（容错）
                nexusCHR: this._parseNexusBlock(result, 'CHR角色状态', 'CHR'),
                nexusWLD: this._parseNexusBlock(result, 'WLD世界规则', 'WLD'),
                nexusFOE: this._parseNexusBlock(result, 'FOE伏笔网络', 'FOE'),
                nexusEMO: this._parseNexusEMO(result),
                createdAt: Date.now()
            };
            if(typeof Modules !== 'undefined' && Modules.world_engine) {
                await Modules.world_engine.syncCycle(cycleData);
                this._plLog(`🌍 已同步循环数据到世界引擎`, 'ok');
            }
        } catch(syncErr) {
            this._plLog(`⚠️ 同步世界引擎失败: ${syncErr.message}`, 'warn');
        }
    },

    // 简易NEXUS数据解析器（从循环融合文本中提取）
    _parseNexusBlock(text, blockName, prefix) {
        const lines = text.split('\n');
        const results = [];
        let inBlock = false;
        for(const line of lines) {
            if(line.includes(blockName) || line.includes(prefix)) inBlock = true;
            if(inBlock && (line.trim().startsWith('•') || line.trim().startsWith('-'))) {
                const clean = line.replace(/^[•\-\s]+/, '').trim();
                if(clean && clean.length > 3) {
                    const parts = clean.split(/[:：]/);
                    results.push({
                        name: parts[0]?.trim() || clean.slice(0, 20),
                        desc: clean,
                        status: parts[1]?.trim() || '',
                        from: '', to: parts[1]?.trim() || ''
                    });
                }
            }
            if(inBlock && line.trim() === '') { inBlock = false; }
        }
        return results;
    },
    _parseNexusEMO(text) {
        const results = [];
        const lines = text.split('\n');
        let inBlock = false;
        for(const line of lines) {
            if(line.includes('EMO情绪锚点')) inBlock = true;
            if(inBlock && (line.trim().startsWith('•') || line.trim().startsWith('-') || /第\d+章/.test(line))) {
                const m = line.match(/第(\d+)章.*?([\d]+).*?([\u4e00-\u9fa5]+)/);
                if(m) results.push({ chapter: parseInt(m[1]), score: parseInt(m[2]) || 5, word: m[3] || '', type: '' });
            }
            if(inBlock && line.trim().startsWith('【')) { inBlock = false; }
        }
        return results;
    },

    async _cycleExtractPatterns(startIdx, endIdx, fusionResult) {
        if (!fusionResult || fusionResult.length < 500) return;

        this._plLog(`📝 提取循环可复用模式...`, 'info');

        let patterns = '';
        try {
            await AI.generate(
                `从以下循环融合总结中提取可复用的写作模式和模板，以JSON格式输出：

${fusionResult.slice(0, 3000)}

输出格式：
{
  "hooks": ["开篇钩子模板1", "开篇钩子模板2"],
  "rhythms": ["节奏控制模板1", "节奏控制模板2"],
  "coolPoints": ["爽点设计模板1", "爽点设计模板2"],
  "suspenses": ["悬念布局模板1", "悬念布局模板2"],
  "transitions": ["场景转换模板1", "场景转换模板2"]
}

只输出JSON，不要其他内容。`,
                {}, c => { patterns += c; }
            );

            let cleanPatterns = patterns.trim();
            cleanPatterns = cleanPatterns.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '').trim();
            
            const parsed = JSON.parse(cleanPatterns);
            const patternKey = `cycle_patterns_${startIdx}_${endIdx}`;
            await DB.put('settings', { 
                id: patternKey, 
                patterns: parsed,
                createdAt: Date.now()
            });

            const totalCount = Object.values(parsed).flat().length;
            this._plLog(`✅ 提取可复用模式: ${totalCount}个模板`, 'ok');

            if (this._plConfig.doRAG && typeof RAGSystem !== 'undefined') {
                const patternText = Object.entries(parsed).map(([k, v]) => 
                    `[${k}]\n${v.join('\n')}`
                ).join('\n\n');
                await RAGSystem.addDocument(`写作模式_第${startIdx}-${endIdx}章`, patternText, 'pattern');
            }
        } catch(e) {
            console.warn('提取循环模式失败:', e);
        }
    },

    // ★ 公共API：获取指定章节所属循环的融合精华（供writer.js调用）
    async getCycleFusionForChapter(chapterIdx) {
        if(!this._plConfig.cycleMode) return null;
        const cycleSize = this._plConfig.cycleSize || 5;
        const cycleNum = Math.ceil((chapterIdx + 1) / cycleSize);
        const start = (cycleNum - 1) * cycleSize + 1;
        const end = cycleNum * cycleSize;
        const cycleKey = `cycle_fusion_${start}_${end}`;
        try {
            const stored = await DB.get('settings', cycleKey);
            if(stored && stored.content) return { cycleId: cycleKey, start, end, fusion: stored.content };
        } catch(e) {}
        return null;
    },

    clearAll() {
        this.left = { bookId: null, chapterIdx: null, analysis: '' };
        this.right = { bookId: null, chapterIdx: null, analysis: '' };
        this._pipelineResults = {};
        this._pipelineStep = 0;
        const outEl = document.getElementById('fb-output');
        if (outEl) outEl.innerHTML = '';
        const view = document.getElementById('module-view-fusion_book');
        if (view) view.innerHTML = this.render();
        this.init();
        UI.toast('已清空');
    },

    // ═══════════════════════════════════════════════════════════════
    // 主书设定系统 - 以主拆书为基准保证一致性
    // ═══════════════════════════════════════════════════════════════
    setPrimaryBook(side) {
        const FB = Modules.fusion_book;
        FB._primaryBook = side;
        
        const leftBadge = document.getElementById('fb-primary-badge-left');
        const rightBadge = document.getElementById('fb-primary-badge-right');
        
        if(leftBadge) leftBadge.classList.toggle('hidden', side !== 'left');
        if(rightBadge) rightBadge.classList.toggle('hidden', side !== 'right');
        
        UI.toast(`${side === 'left' ? '左书' : '右书'}已设为主拆书基准`);
        
        FB._savePrimarySettings();
    },

    async _savePrimarySettings() {
        const FB = Modules.fusion_book;
        const primaryBook = FB._primaryBook === 'left' ? FB.left : FB.right;
        const books = FB._books || [];
        const book = books.find(b => b.id === primaryBook.bookId);
        
        if(!book) return;
        
        const settings = {
            id: 'primary_book_settings',
            side: FB._primaryBook,
            bookId: primaryBook.bookId,
            bookName: book.name,
            chapterCount: book.chapters?.length || 0,
            totalChars: book.chapters?.reduce((sum, ch) => sum + (ch.content?.length || 0), 0) || 0,
            setAt: Date.now()
        };
        
        await DB.put('settings', settings);
        FB._primarySettings = settings;
    },

    async _loadPrimarySettings() {
        const FB = Modules.fusion_book;
        try {
            const saved = await DB.get('settings', 'primary_book_settings');
            if(saved && saved.bookId) {
                FB._primaryBook = saved.side || 'left';
                FB._primarySettings = saved;
            }
        } catch(e) {}
    },

    // ═══ 一致性检查 - 确保所有内容以主拆书为基准 ═══
});
