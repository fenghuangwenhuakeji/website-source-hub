Object.assign(Modules.phoenix, {
    _outlineFormatGuide() {
        return `格式要求（必须严格遵守）：
## 第一卷：卷名
**卷目标：** 本卷主角想要什么、核心阻力是什么、卷末必须发生什么变化
**卷规则：** 本卷会使用的世界规则、代价、禁忌和边界
**卷伏笔：** 本卷埋设/强化/回收的伏笔链

### 第一章：章名
**本章目标：** 主角/关键角色在本章具体想要什么
**阻力与代价：** 谁阻拦、代价是什么、失败后会失去什么
**情节动作：** 用场景动作、物件、对话错位推进剧情，不能只写概念
**人物变化：** 角色从什么状态变到什么状态，变化原因必须具体
**世界规则：** 本章调用的规则、限制、代价、禁忌
**伏笔钩子：** 埋设/强化/回收点，以及章末未完成动作或信息差
**实体线索：** 人物、地点、势力、物品、能力、规则、关系
**上下文记忆：** 后文必须记住的事实、承诺、伤口、误会、限制
**一致性风险：** 可能导致人物OOC或世界观崩坏的点`;
    },

    async fusionDrivenGen() {
        if(this._generating) return;
        const fusionCtx = this._getFusionFullContext();
        if(!fusionCtx) return UI.toast('请先在融合拆书中运行流水线获取融合精华');
        const idea = (document.getElementById('ph-idea') || {}).value || '';
        const genre = (document.getElementById('ph-genre') || {}).value || '';
        const style = (document.getElementById('ph-style') || {}).value || '';

        const prompt = `你是一位长篇小说总架构师。现在你手握参考作品的技法精华，但任务不是照搬套路，而是生成一份能长期稳定写下去的执行级细纲。

${fusionCtx}
${this.data.worldContext ? '[世界观设定]\n' + this.data.worldContext.slice(0,2000) + '\n\n' : ''}${idea ? '[作者创意]\n' + idea + '\n\n' : ''}${genre ? '[类型] ' + genre + '\n' : ''}${style ? '[风格] ' + style + '\n' : ''}
[核心要求]
1. 参考技法只能作为结构工具，不能搬运原作内容、人设、情节和专有设定
2. 内部追踪 CHR人物、WLD世界、FOE伏笔、EMO情绪，输出要服务实体提取和知识图谱
3. 先写执行级细纲，再让下一步从细纲提实体
4. 至少生成前3卷，每卷6-8章
5. 每章必须包含：目标、阻力、代价、人物变化、世界规则、伏笔钩子、实体线索、上下文记忆
6. M06是写作约束：禁止“他很痛苦/眼神复杂/空气凝固”等抽象空话，用动作、物件、对话错位和物理细节呈现
7. 主角每章必须有选择、代价或变化，不能无理由OOC
8. 确保全书有完整的主线悬念链、伏笔回收计划和世界规则边界
9. 每章标出最容易导致人物崩坏或世界观崩坏的风险点

${this._outlineFormatGuide()}`;

        const el = document.getElementById('ph-outline-raw');
        if (el) el.value = '';
        this.updateIO(prompt, '融合技法驱动生成中...');
        this._setGenerating(true);
        let fullRes = '';
        try {
            await AI.generate(prompt, { apiType: 'text', module: 'phoenix_outline_fusion_driven' }, c => {
                fullRes += c;
                if (el) el.value = fullRes;
                this.data.outlineRaw = fullRes;
                this.updateIO(prompt, fullRes);
                this._updateStats();
                this._updateGenProgress(fullRes);
            });
            if (typeof MemorySystem !== 'undefined') MemorySystem.addWorking('[凤凰流/融合驱动细纲] ' + (fullRes || '').slice(0, 200), 'outline', 5);
            UI.toast('融合技法驱动生成完成');
        } catch(e) {
            console.error('[Phoenix] fusionDrivenGen error:', e);
            UI.toast('生成失败: ' + (e.message || '未知错误'), 'error');
        } finally {
            this._setGenerating(false);
        }
    },

    // ===== 普通生成细纲 (注入融合上下文) =====
    async genOutline() {
        if(this._generating) return;
        const idea = (document.getElementById('ph-idea') || {}).value || '';
        const genre = (document.getElementById('ph-genre') || {}).value || '';
        const style = (document.getElementById('ph-style') || {}).value || '';
        if (!idea) return UI.toast('请输入核心创意');

        try {
            const existingPrompt = await DB.get('prompts', 'phoenix_outline');
            // 如果没有自定义提示词，或者还是旧版简单提示词，则更新为从零长篇专业版
            if (!existingPrompt || (existingPrompt.content && existingPrompt.content.length < 300)) {
                await DB.put('prompts', { id: 'phoenix_outline', name: 'phoenix_outline', content: `你是一位长篇小说总架构师。任务不是写漂亮概念，而是把一个从零开始的故事变成可持续写80万字以上的执行级细纲。

基于创意【{{idea}}】
类型：{{genre}}
风格：{{style}}

请生成一份详细的长篇小说分卷细纲。

${this._outlineFormatGuide()}

硬性要求：
1. 内部追踪 CHR人物、WLD世界、FOE伏笔、EMO情绪，输出按上面细纲格式写
2. 人物欲望、阻力、代价、变化必须贯穿每一卷
3. 世界规则必须有代价和边界，不能随剧情临时改规则
4. 细纲要写到“下一步能直接开正文”，不能只写概念
5. 每章必须有可提取的实体线索，方便下一步直接同步到世界引擎
6. 每章必须标出人物一致性风险和世界观风险
7. 每章结尾必须有未完成动作、意外信息、时间压力或信息差
8. M06反AI写作：不要“他很痛苦/眼神复杂/空气凝固”，改成动作、物件、对话、物理细节
9. 每3-5章一个小循环，每卷一个中循环，伏笔需要回收计划

至少生成前3卷，每卷6-8章，每章情节描述不少于100字。` });
            }
        } catch (e) {}

        this.data.idea = idea; this.data.genre = genre; this.data.style = style;

        // 细纲生成核心指令（直接内联，不依赖 getPrompt 避免空值）
        let prompt = `你是一位长篇小说总架构师。任务不是写漂亮概念，而是把一个从零开始的故事变成可持续写80万字以上的执行级细纲。

基于创意【${idea}】
类型：${genre || '未指定'}
风格：${style || '清晰、克制、可持续'}

请生成一份详细的长篇小说分卷细纲。

${this._outlineFormatGuide()}

硬性要求（必须遵守）：
1. 内部追踪 CHR人物、WLD世界、FOE伏笔、EMO情绪，输出按上面细纲格式写
2. 人物欲望、阻力、代价、变化必须贯穿每一卷
3. 世界规则必须有代价和边界，不能随剧情临时改规则
4. 细纲要写到“下一步能直接开正文”，不能只写概念
5. 每章必须有可提取的实体线索，方便下一步直接同步到世界引擎
6. 每章必须标出人物一致性风险和世界观风险
7. 每章结尾必须有未完成动作、意外信息、时间压力或信息差
8. M06反AI写作：不要“他很痛苦/眼神复杂/空气凝固”，改成动作、物件、对话、物理细节
9. 每3-5章一个小循环，每卷一个中循环，伏笔需要回收计划

至少生成前3卷，每卷6-8章，每章情节描述不少于100字。`;

        // ★ NEXUS OS v2.0 创作规则作为辅助约束注入（不覆盖核心指令）
        prompt += '\n\n' + this._buildNEXUSCore({ mode: 'outline' });

        // M04A/B/C 融合上下文注入
        const fusionCtx = this._getFusionFullContext();
        if(fusionCtx) prompt += '\n\n[M04 融合技法参考 — 请在细纲中运用这些技法]\n' + fusionCtx;
        if(this.data.worldContext) prompt += '\n\n[世界引擎素材]\n' + this.data.worldContext.slice(0,2000);
        if(this.data.memoryContext) prompt += '\n\n[三层记忆上下文]\n' + this.data.memoryContext.slice(0,2000);
        if(this.data.fusionContext && !fusionCtx) prompt += '\n\n[融合拆书精华]\n' + this.data.fusionContext.slice(0,1500);

        const el = document.getElementById('ph-outline-raw');
        if (el) el.value = '';
        this.updateIO(prompt, '生成中...');
        this._setGenerating(true);

        let fullRes = '';
        try {
            await AI.generate(prompt, { apiType: 'text', module: 'phoenix_outline_generate' }, c => {
                fullRes += c;
                if (el) el.value = fullRes;
                this.data.outlineRaw = fullRes;
                this.updateIO(prompt, fullRes);
                this._updateStats();
            });
            if (typeof MemorySystem !== 'undefined') MemorySystem.addWorking('[凤凰流/细纲] ' + (fullRes || '').slice(0, 200), 'outline', 4);
        } catch(e) {
            console.error('[Phoenix] genOutline error:', e);
            UI.toast('生成失败: ' + (e.message || '未知错误'), 'error');
        } finally {
            this._setGenerating(false);
        }
    },

    async continueGen() {
        if(this._generating) return;
        let current = (document.getElementById('ph-outline-raw') || {}).value || '';
        // ★ 支持外部导入后无缝续写：如果编辑器为空但有 importedWorld.rawContent，尝试提取大纲
        if(!current && this.data.importedWorld && this.data.importedWorld.rawContent) {
            current = this._extractOutlineFromImport(this.data.importedWorld.rawContent);
            if(current) {
                const el = document.getElementById('ph-outline-raw');
                if(el) el.value = current;
                this.data.outlineRaw = current;
            }
        }
        if (!current) return UI.toast('请先生成大纲或导入世界观/大纲');

        const fusionCtx = this._getFusionFullContext();
        const genre = this.data.genre || '';
        const style = this.data.style || '';

        // 分析当前进度
        const bp = this._detectBreakpoint(current);
        const continueIntent = this._analyzeInlineContinueRequest(current, '', current.length);

        // 精简续写指令（避免 _buildNEXUSCore 正文模式干扰 + 控制 prompt 长度）
        let prompt = `你是一位长篇小说总架构师。请继续撰写以下长篇小说的执行级分卷细纲。\n\n`;
        prompt += `[核心任务] 为一部${genre || '长篇'}小说续写分卷细纲，风格定位：${style || '清晰、克制、可持续'}。\n\n`;
        prompt += `[续写约束]\n`;
        prompt += `- 你必须从上文最后断开的位置【无缝衔接】继续往下写，不要重复已有内容\n`;
        prompt += `- 当前已写到：${bp.lastVol} / ${bp.lastChap}（共${bp.volCount}卷${bp.chapCount}章）\n`;
        prompt += `- 继续保持固定细纲格式：本章目标 / 阻力与代价 / 情节动作 / 人物变化 / 世界规则 / 伏笔钩子 / 实体线索 / 上下文记忆 / 一致性风险\n`;
        prompt += `- 每章必须包含：核心事件、冲突推进、角色变化、世界规则引用、伏笔钩子、可提取实体线索\n`;
        prompt += `- M06是写作约束：不用抽象情绪词，用动作、物件、对话错位呈现\n`;
        prompt += `- 节奏要求：3-5章一小循环，卷末大高潮+悬念钩子\n`;
        prompt += `- 主角每章都要有选择、代价或变化，人物不能无理由OOC\n`;
        prompt += `- 至少继续写2-3卷，每卷5-8章，每章情节描述不少于100字\n\n`;
        prompt += this._buildInlineContinueControl(continueIntent) + '\n';
        if(fusionCtx) prompt += '[融合技法参考]\n' + fusionCtx.slice(0, 1500) + '\n\n';
        if(this.data.worldContext) prompt += '[世界观设定]\n' + this.data.worldContext.slice(0, 1200) + '\n\n';
        if(this.data.memoryContext) prompt += '[三层记忆上下文]\n' + this.data.memoryContext.slice(0, 1200) + '\n\n';
        prompt += `[已有细纲/断点上下文]\n${continueIntent.context}\n\n请从断点处直接继续，不要任何开场白或解释，直接输出后续的卷章内容：`;

        console.log('[Phoenix] continueGen prompt length:', prompt.length);
        this.updateIO(prompt, '续写中...');
        this._setGenerating(true);
        let fullRes = '';
        try {
            await AI.generate(prompt, { apiType: 'text', module: 'phoenix_outline_continue' }, c => {
                fullRes += c;
                const el = document.getElementById('ph-outline-raw');
                if (el) { el.value = current.replace(/\s*$/, '\n\n') + fullRes; el.scrollTop = el.scrollHeight; }
                this.data.outlineRaw = el ? el.value : '';
                this._updateGenProgress(el ? el.value : '');
                this.updateIO(prompt, this.data.outlineRaw);
                this._updateStats();
            });
            const cleaned = this._sanitizeInlineContinueReply(fullRes, continueIntent, current);
            const el = document.getElementById('ph-outline-raw');
            if (el) {
                el.value = cleaned.trim() ? current.replace(/\s*$/, '\n\n') + cleaned.trim() : current;
                el.scrollTop = el.scrollHeight;
                this.data.outlineRaw = el.value;
                this._updateGenProgress(el.value);
                this.updateIO(prompt, el.value);
                this._updateStats();
            }
            if (!cleaned.trim()) UI.toast('续写结果与已有卷章重复，已拦截', 'warning');
        } catch(e) {
            console.error('[Phoenix] continueGen error:', e);
            UI.toast('续写失败: ' + (e.message || '未知错误'), 'error');
        } finally {
            this._setGenerating(false);
        }
    },

    // ===== 迭代优化: 细纲格式 + 实体线索 + 一致性 =====
    async iterateOutline() {
        if(this._generating) return;
        const current = (document.getElementById('ph-outline-raw') || {}).value || '';
        if (!current) return UI.toast('请先生成大纲');
        const fusionCtx = this._getFusionFullContext();
        let prompt = `[任务] 请对以下小说细纲进行迭代优化：\n1. 保持固定细纲格式：本章目标 / 阻力与代价 / 情节动作 / 人物变化 / 世界规则 / 伏笔钩子 / 实体线索 / 上下文记忆 / 一致性风险\n2. 检查逻辑漏洞和前后矛盾\n3. 检查人物状态是否连续，人物不能无理由OOC\n4. 检查世界规则是否有代价、边界和一致性\n5. 加强伏笔、章末钩子和回收计划\n6. 每章补齐可提取实体线索，方便下一步直接同步到世界引擎\n7. 按 M06 改写空泛表达，用动作、物件、对话错位和物理细节呈现\n`;
        if(fusionCtx) prompt += `\n[融合技法参考 — 请用这些技法优化细纲]\n${fusionCtx.slice(0, 3000)}\n`;
        prompt += `\n[当前细纲]\n${current.slice(0,6000)}\n\n请输出优化后的完整细纲，保持固定细纲格式：本章目标 / 阻力与代价 / 情节动作 / 人物变化 / 世界规则 / 伏笔钩子 / 实体线索 / 上下文记忆 / 一致性风险。`;
        const el = document.getElementById('ph-outline-raw');
        if(el) el.value = '';
        this.updateIO(prompt, '迭代优化中...');
        this._setGenerating(true);
        let fullRes = '';
        await AI.generate(prompt, { apiType: 'text', module: 'phoenix_outline_iterate' }, c => {
            fullRes += c;
            if(el) el.value = fullRes;
            this.data.outlineRaw = fullRes;
            this._updateStats();
        });
        this._setGenerating(false);
        UI.toast('迭代优化完成');
    },

    // ★ 断点检测：分析已有大纲，找出已完成的卷/章数
    _detectBreakpoint(text) {
        const parsed = this._getOutlineStructureStats ? this._getOutlineStructureStats(text) : { volumes: [], chapters: [], volCount: 0, chapCount: 0 };
        const volumes = parsed.volumes || [];
        const chapters = parsed.chapters || [];
        const lastVol = volumes.length > 0 ? volumes[volumes.length - 1].title : '';
        const lastChap = chapters.length > 0 ? chapters[chapters.length - 1].title : '';
        return { volCount: parsed.volCount || 0, chapCount: parsed.chapCount || 0, lastVol, lastChap };
    },

    _parseOutlineOrdinal(raw) {
        const text = String(raw || '').replace(/[第卷章节\s]/g, '').replace(/〇/g, '零').replace(/两/g, '二');
        if (!text) return 0;
        if (/^\d+$/.test(text)) return parseInt(text, 10) || 0;
        const map = { 零:0, 一:1, 二:2, 三:3, 四:4, 五:5, 六:6, 七:7, 八:8, 九:9 };
        const parseBelow100 = (part) => {
            part = String(part || '').replace(/零/g, '');
            if (!part) return 0;
            if (part.includes('十')) {
                const seg = part.split('十');
                const ten = seg[0] ? (map[seg[0]] || 0) : 1;
                const one = seg[1] ? (map[seg[1]] || 0) : 0;
                return ten * 10 + one;
            }
            if (part.length > 1) {
                return Array.from(part).reduce((n, ch) => n * 10 + (map[ch] || 0), 0);
            }
            return map[part] || 0;
        };
        if (text.includes('百')) {
            const seg = text.split('百');
            const hundred = seg[0] ? (map[seg[0]] || 0) : 1;
            return hundred * 100 + parseBelow100(seg[1] || '');
        }
        return parseBelow100(text);
    },

    _formatOutlineOrdinal(num) {
        num = Math.max(0, parseInt(num, 10) || 0);
        const cn = ['零','一','二','三','四','五','六','七','八','九'];
        const below100 = (n) => {
            if (n < 10) return cn[n];
            if (n < 20) return '十' + (n % 10 ? cn[n % 10] : '');
            return cn[Math.floor(n / 10)] + '十' + (n % 10 ? cn[n % 10] : '');
        };
        if (num < 100) return below100(num);
        const rest = num % 100;
        return cn[Math.floor(num / 100)] + '百' + (rest ? (rest < 10 ? '零' : '') + below100(rest) : '');
    },

    _extractOutlineHeadingMeta(line) {
        const raw = String(line || '').trim();
        const m = raw.match(/^#{1,6}\s*(第\s*([零〇一二三四五六七八九十百两\d]+)\s*(卷|章)[^\n]*)/);
        if (!m) return null;
        const order = this._parseOutlineOrdinal(m[2]);
        if (!order) return null;
        return {
            kind: m[3] === '卷' ? 'volume' : 'chapter',
            order,
            heading: m[1].replace(/\s+/g, ''),
            raw
        };
    },

    _parseInlineOutlineState(outline) {
        const lines = String(outline || '').split('\n');
        const volumes = [];
        const chapters = [];
        let currentVolume = null;
        let offset = 0;
        lines.forEach(line => {
            const meta = this._extractOutlineHeadingMeta(line);
            if (meta && meta.kind === 'volume') {
                currentVolume = {
                    order: meta.order,
                    title: meta.heading,
                    start: offset,
                    end: String(outline || '').length
                };
                volumes.push(currentVolume);
            } else if (meta && meta.kind === 'chapter') {
                chapters.push({
                    order: meta.order,
                    title: meta.heading,
                    start: offset,
                    volumeOrder: currentVolume ? currentVolume.order : null
                });
            }
            offset += line.length + 1;
        });
        for (let i = 0; i < volumes.length; i++) {
            volumes[i].end = i + 1 < volumes.length ? volumes[i + 1].start : String(outline || '').length;
        }
        const lastVolume = volumes.length ? volumes[volumes.length - 1] : null;
        const lastChapter = chapters.length ? chapters[chapters.length - 1] : null;
        const lastChapterOrder = chapters.reduce((max, c) => Math.max(max, c.order || 0), 0);
        const lastVolumeOrder = volumes.reduce((max, v) => Math.max(max, v.order || 0), 0);
        return {
            volumes,
            chapters,
            lastVolume,
            lastChapter,
            lastChapterOrder,
            lastVolumeOrder,
            volumeOrders: new Set(volumes.map(v => v.order)),
            chapterOrders: new Set(chapters.map(c => c.order))
        };
    },

    _chapterTitleCore(heading) {
        return String(heading || '')
            .replace(/^第\s*[零〇一二三四五六七八九十百两\d]+\s*章\s*[:：、.]?\s*/, '')
            .replace(/^\d{1,4}\s*[.、]\s*/, '')
            .replace(/[（(]\s*续[^）)]*[）)]/g, '')
            .trim();
    },

    _detectInlineChapterNumberingMode(outline, state) {
        const text = String(outline || '');
        if (/第\s*[零〇一二三四五六七八九十百两\d]+\s*[-—~到至]\s*[零〇一二三四五六七八九十百两\d]+\s*章/.test(text)) return 'global';
        if (/^#{1,6}\s*第\s*[零〇一二三四五六七八九十百两\d]+\s*章\s*[:：]\s*\d{2,4}\s*[.、]/m.test(text)) return 'global';
        const volumes = (state && state.volumes) || [];
        const chapters = (state && state.chapters) || [];
        if (volumes.length >= 2) {
            const firstByVolume = new Map();
            chapters.forEach(ch => {
                if (!ch.volumeOrder || firstByVolume.has(ch.volumeOrder)) return;
                firstByVolume.set(ch.volumeOrder, ch.order);
            });
            const starts = Array.from(firstByVolume.values());
            if (starts.slice(1).some(n => n === 1)) return 'volume_local';
            if (starts.length >= 2 && starts.every((n, i) => i === 0 || n > starts[i - 1])) return 'global';
        }
        return 'volume_local';
    },

    _shouldInlineChatContinue(txt, selected) {
        if (selected) return false;
        const t = String(txt || '').trim();
        if (/^(继续|续写|接着|接上|往下|继续写|往下写)/.test(t)) return true;
        if (/(下一卷|下卷|新卷|新一卷)/.test(t) && /(写|生成|补|续|继续|展开|规划)/.test(t)) return true;
        if (/第\s*[零〇一二三四五六七八九十百两\d]+\s*卷/.test(t) && /(写|生成|补|续|继续|展开|规划)/.test(t)) return true;
        return false;
    },

    _analyzeInlineContinueRequest(outline, userInstruction, fallbackPos) {
        const state = this._parseInlineOutlineState(outline);
        const numberingMode = this._detectInlineChapterNumberingMode(outline, state);
        const text = String(userInstruction || '').trim();
        const volMatch = text.match(/第\s*([零〇一二三四五六七八九十百两\d]+)\s*卷/);
        let targetVolumeOrder = volMatch ? this._parseOutlineOrdinal(volMatch[1]) : 0;
        if (!targetVolumeOrder && /(下一卷|下卷|新卷|新一卷)/.test(text)) {
            targetVolumeOrder = (state.lastVolumeOrder || 0) + 1;
        }
        const targetVolume = targetVolumeOrder ? state.volumes.find(v => v.order === targetVolumeOrder) : null;
        const targetVolumeExists = !!targetVolume;
        const targetVolumeChapters = targetVolumeOrder ? state.chapters.filter(c => c.volumeOrder === targetVolumeOrder) : [];
        let nextChapterOrder = 1;
        if (targetVolumeExists && targetVolumeChapters.length) {
            nextChapterOrder = Math.max(...targetVolumeChapters.map(c => c.order)) + 1;
        } else if (targetVolumeOrder && !targetVolumeExists) {
            nextChapterOrder = numberingMode === 'global' ? (state.lastChapterOrder || 0) + 1 : 1;
        } else {
            nextChapterOrder = (state.lastChapterOrder || 0) + 1;
        }
        const insertPos = targetVolumeExists ? targetVolume.end : (targetVolumeOrder ? String(outline || '').length : fallbackPos);
        const recentChapters = state.chapters.slice(-16).map(c => `第${this._formatOutlineOrdinal(c.order)}章：${this._chapterTitleCore(c.title)}`).join('\n');
        const chapterStartLabel = numberingMode === 'volume_local' && targetVolumeOrder
            ? `第${this._formatOutlineOrdinal(targetVolumeOrder)}卷内第${this._formatOutlineOrdinal(nextChapterOrder)}章`
            : `全书第${this._formatOutlineOrdinal(nextChapterOrder)}章`;
        const structure = [
            `已有卷数：${state.volumes.length || 0}`,
            `已有章节最高编号：第${this._formatOutlineOrdinal(state.lastChapterOrder || 0)}章`,
            `最后一章：${state.lastChapter ? state.lastChapter.title : '无'}`,
            targetVolumeOrder ? `作者目标卷：第${this._formatOutlineOrdinal(targetVolumeOrder)}卷（${targetVolumeExists ? '已存在，请续写该卷' : '尚不存在，请新开该卷'}）` : '作者目标卷：未指定，按断点继续',
            `章号模式：${numberingMode === 'volume_local' ? '卷内重置' : '全书连续'}`,
            `下一章建议从：${chapterStartLabel}开始`
        ].join('\n');
        const head = String(outline || '').slice(0, 2600);
        const tailStart = Math.max(0, insertPos - 3600);
        const tailEnd = Math.min(String(outline || '').length, insertPos + 1000);
        const context = String(outline || '').length > 7600
            ? head + '\n\n[中间细纲省略，以下是插入点附近]\n\n' + String(outline || '').slice(tailStart, tailEnd)
            : String(outline || '').slice(Math.max(0, insertPos - 5000), tailEnd);
        return {
            state,
            userInstruction: text,
            targetVolumeOrder,
            targetVolumeExists,
            numberingMode,
            insertPos,
            nextChapterOrder,
            structure,
            recentChapters,
            context
        };
    },

    _buildInlineContinueControl(intent) {
        if (!intent) return '';
        const targetVol = intent.targetVolumeOrder ? `第${this._formatOutlineOrdinal(intent.targetVolumeOrder)}卷` : '断点后的后续内容';
        const targetHeading = intent.targetVolumeOrder ? `## ${targetVol}：卷名` : '';
        const chapterHeading = `### 第${this._formatOutlineOrdinal(intent.nextChapterOrder)}章：章名`;
        const openingRule = intent.targetVolumeOrder && !intent.targetVolumeExists
            ? intent.numberingMode === 'global'
                ? `- 第一行必须是：${targetHeading}\n- 然后沿用全书连续章号，从：${chapterHeading} 开始写。`
                : `- 第一行必须是：${targetHeading}\n- 然后按卷内章号从：### 第一章：章名 开始写，不要写成全书第${this._formatOutlineOrdinal(intent.nextChapterOrder)}章。`
            : intent.targetVolumeOrder
                ? intent.numberingMode === 'global'
                    ? `- 直接从：${chapterHeading} 开始写，不要重复卷标题。`
                    : `- 直接从该卷下一章开始写；若模型输出了全书连续章号，后处理会自动改为卷内章号。`
                : `- 如果断点已经进入新卷，可以先输出新的 ## 第X卷：卷名；否则直接从：${chapterHeading} 开始写。`;
        return `\n[智能续写判定]\n${intent.structure}\n\n[严禁重复]\n- 不得输出已有章节编号，尤其不能输出最近已有章节：\n${intent.recentChapters || '无'}\n- 不得把[当前大纲上下文]里的章节复制、改名、写成“续”。\n- 用户说“写第几卷/继续第几卷”时，优先满足目标卷，不要回头补上一卷。\n\n[输出开头规则]\n${openingRule}\n- 章节标题必须用 ###，卷标题只能用 ##。\n`;
    },

    _sanitizeInlineContinueReply(reply, intent, outline) {
        let text = String(reply || '').trim()
            .replace(/^```(?:markdown|md)?\s*/i, '')
            .replace(/```\s*$/i, '')
            .replace(/^\s*[-—]{3,}\s*/g, '')
            .trim();
        if (!intent || !text) return text;
        const state = intent.state || this._parseInlineOutlineState(outline);
        const normalizeHeading = (line) => {
            const meta = this._extractOutlineHeadingMeta(line);
            if (!meta) return line;
            return (meta.kind === 'volume' ? '## ' : '### ') + meta.heading;
        };
        text = text.split('\n').map(normalizeHeading).join('\n');
        const lines = text.split('\n');
        const blocks = [];
        let current = null;
        const push = () => {
            if (current && current.lines.join('\n').trim()) blocks.push(current);
        };
        lines.forEach(line => {
            const meta = this._extractOutlineHeadingMeta(line);
            if (meta) {
                push();
                current = { meta, lines: [line] };
            } else {
                if (!current) current = { meta: null, lines: [] };
                current.lines.push(line);
            }
        });
        push();

        const kept = [];
        let seenStructuredHeading = false;
        const existingTitleCores = new Set((state.chapters || []).map(c => this._chapterTitleCore(c.title)).filter(Boolean));
        let localChapterOrder = Math.max(1, intent.nextChapterOrder || 1);
        blocks.forEach(block => {
            const meta = block.meta;
            if (!meta) {
                const body = block.lines.join('\n').trim();
                if (intent.targetVolumeOrder && !seenStructuredHeading) return;
                if (body) kept.push(body);
                return;
            }
            seenStructuredHeading = true;
            if (meta.kind === 'volume') {
                if (intent.targetVolumeOrder) {
                    if (meta.order < intent.targetVolumeOrder) return;
                    if (meta.order === intent.targetVolumeOrder && intent.targetVolumeExists) return;
                }
                kept.push(block.lines.join('\n').trim());
                return;
            }
            if (meta.kind === 'chapter') {
                const titleCore = this._chapterTitleCore(meta.heading);
                if (titleCore && existingTitleCores.has(titleCore)) return;
                if (intent.numberingMode !== 'volume_local' && state.chapterOrders && state.chapterOrders.has(meta.order)) return;
                if (intent.numberingMode !== 'volume_local' && intent.nextChapterOrder && meta.order < intent.nextChapterOrder) return;
                if (intent.numberingMode === 'volume_local' && intent.targetVolumeOrder) {
                    const suffix = titleCore || '未命名';
                    const lines = block.lines.slice();
                    lines[0] = `### 第${this._formatOutlineOrdinal(localChapterOrder)}章：${suffix}`;
                    localChapterOrder += 1;
                    kept.push(lines.join('\n').trim());
                    return;
                }
                kept.push(block.lines.join('\n').trim());
            }
        });

        let cleaned = kept.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
        if (intent.targetVolumeOrder && !intent.targetVolumeExists) {
            const targetHeadingRe = new RegExp(`^##\\s*第\\s*${this._formatOutlineOrdinal(intent.targetVolumeOrder)}\\s*卷`);
            if (cleaned && !targetHeadingRe.test(cleaned)) {
                cleaned = `## 第${this._formatOutlineOrdinal(intent.targetVolumeOrder)}卷：未命名卷\n\n` + cleaned;
            }
        }
        return cleaned;
    },

    // ★ 从导入的原始文本中提取/构造大纲（支持循环标记识别）
    _extractOutlineFromImport(rawContent) {
        if(!rawContent) return '';
        // 检测是否已有大纲格式
        if(rawContent.includes('## ') && rawContent.includes('### ')) return rawContent;
        // 检测循环标记如 【循环1-5】
        const cycleMatches = rawContent.match(/【循环\s*(\d+)[\-~]\s*(\d+)\s*】/g);
        if(cycleMatches) {
            let outline = '# 导入大纲（含循环标记）\n\n';
            const lines = rawContent.split('\n');
            let currentVol = '导入卷';
            outline += `## ${currentVol}\n\n`;
            let chapNum = 1;
            lines.forEach(line => {
                const cycleM = line.match(/【循环\s*(\d+)[\-~]\s*(\d+)\s*】/);
                if(cycleM) {
                    outline += `\n### 第${chapNum}章：循环${cycleM[1]}-${cycleM[2]}\n**情节：** ${line.replace(/【循环[^】]+】/, '').trim()}\n**看点：** 循环技法融合\n\n`;
                    chapNum++;
                } else if(line.trim().length > 20) {
                    outline += `### 第${chapNum}章：未命名\n**情节：** ${line.trim().slice(0,200)}\n\n`;
                    chapNum++;
                }
            });
            return outline;
        }
        // 简单分段作为大纲
        const paragraphs = rawContent.split('\n').filter(p => p.trim().length > 30);
        if(paragraphs.length) {
            let outline = '# 导入大纲\n\n## 导入卷\n\n';
            paragraphs.forEach((p, i) => {
                outline += `### 第${i+1}章：未命名\n**情节：** ${p.trim().slice(0,300)}\n\n`;
            });
            return outline;
        }
        return '';
    },

    // ===== 扩展细化: 执行级场景提示 =====
    async expandOutline() {
        if(this._generating) return;
        const current = (document.getElementById('ph-outline-raw') || {}).value || '';
        if (!current) return UI.toast('请先生成大纲');
        const fusionCtx = this._getFusionFullContext();
        let prompt = `[任务] 请对以下细纲进行扩展细化：\n1. 为每章增加可直接开写的场景动作、物件、地点和冲突\n2. 补充角色选择、代价、误解、遮掩和对话错位\n3. 标注 CHR/WLD/FOE/EMO 的变化点\n4. 标注每章的字数建议、节奏标记和一致性风险\n5. 按 M06 删除抽象情绪词，换成具体行为和物理细节\n`;
        if(fusionCtx) prompt += `\n[融合技法参考 — 请运用这些技法扩展]\n${fusionCtx.slice(0, 3000)}\n`;
        prompt += `\n[当前细纲]\n${current.slice(0,6000)}\n\n请输出扩展后的完整细纲。`;
        const el = document.getElementById('ph-outline-raw');
        if(el) el.value = '';
        this.updateIO(prompt, '扩展细化中...');
        this._setGenerating(true);
        let fullRes = '';
        await AI.generate(prompt, { apiType: 'text', module: 'phoenix_outline_detail' }, c => {
            fullRes += c;
            if(el) el.value = fullRes;
            this.data.outlineRaw = fullRes;
            this._updateStats();
        });
        this._setGenerating(false);
        UI.toast('扩展细化完成');
    },

    // ===== 融合技法润色 (新增: 用融合精华重新润色现有细纲) =====
    async fusionRefine() {
        if(this._generating) return;
        const current = (document.getElementById('ph-outline-raw') || document.getElementById('ph-outline-edit') || {}).value || '';
        if (!current) return UI.toast('大纲为空');
        const fusionCtx = this._getFusionFullContext();
        if(!fusionCtx) return UI.toast('请先在融合拆书中运行流水线获取融合精华');

        const prompt = `你是长篇小说细纲质检师。请用以下参考技法精华来校准这份细纲，同时保持人物变化、世界规则、伏笔线和实体线索稳定。

${fusionCtx}
[当前细纲]
${current.slice(0,6000)}

[校准要求]
1. 用参考技法优化每章钩子、节奏、信息差和冲突推进
2. 每章补齐：本章目标、阻力与代价、情节动作、人物变化、世界规则、伏笔钩子、实体线索、上下文记忆、一致性风险
3. 人物欲望、阻力、代价、变化必须连续
4. 世界规则不能临时改，必须写清代价和边界
5. 伏笔要有埋设位置和回收计划
6. 保持原有故事框架不变，只校准可写性、一致性和实体可提取性

请输出校准后的完整细纲。`;

        const el = document.getElementById('ph-outline-raw') || document.getElementById('ph-outline-edit');
        if(el) el.value = '';
        this.updateIO(prompt, '融合技法润色中...');
        this._setGenerating(true);
        let fullRes = '';
        await AI.generate(prompt, { apiType: 'text', module: 'phoenix_outline_fusion_refine' }, c => {
            fullRes += c;
            if(el) { el.value = fullRes; }
            this.data.outlineRaw = fullRes;
            this._updateStats();
        });
        this._setGenerating(false);
        UI.toast('融合技法润色完成');
    },

    async analyzeOutline() {
        if(this._generating) return;
        const current = (document.getElementById('ph-outline-raw') || {}).value || '';
        if (!current) return UI.toast('大纲为空');
        
        UI.toast('正在分析节奏...');
        const nexusCore = this._buildNEXUSCore({ mode: 'outline' });
        const prompt = `${nexusCore}\n\n=== 节奏分析任务 ===\n你是一位专业的网文节奏分析师。请对以下细纲进行深度节奏分析。

[当前细纲]
${current.slice(0, 8000)}

【分析维度】
1. 整体节奏曲线（开篇、发展、高潮、结尾的节奏分布）
2. 章节节奏评估（每章的紧张度/舒缓度）
3. 高潮点检测（识别高潮章节和低谷章节）
4. 爽点密度分析（爽点分布是否合理）
5. 悬念链分析（伏笔埋设和回收情况）
6. 问题诊断（节奏拖沓/过快/断层的位置）

【输出格式】
## 节奏曲线图
(用文字描述节奏走势)

## 章节节奏表
| 章节 | 紧张度 | 类型 | 问题 |
|------|--------|------|------|

## 高潮分布
- 主要高潮：第X章、第Y章...
- 次要高潮：...

## 问题诊断
1. ...
2. ...

## 优化建议
1. ...
2. ...`;

        this.updateIO(prompt, '分析中...');
        let result = '';
        await AI.generate(prompt, { apiType: 'parse', module: 'phoenix_rhythm_analysis' }, c => {
            result += c;
            this.updateIO(prompt, result);
        });
        
        const el = document.getElementById('ph-outline-raw');
        if (el) {
            el.value = current + '\n\n---\n\n【节奏分析报告】\n' + result;
            this.data.outlineRaw = el.value;
            this._updateStats();
        }
        UI.toast('节奏分析完成！');
    },

    async checkPlotHoles() {
        if(this._generating) return;
        const current = (document.getElementById('ph-outline-raw') || {}).value || '';
        if (!current) return UI.toast('大纲为空');
        
        UI.toast('正在检测漏洞...');
        const nexusCore = this._buildNEXUSCore({ mode: 'outline' });
        const prompt = `${nexusCore}\n\n=== 漏洞检测任务 ===\n你是一位严谨的逻辑审核专家。请检查以下小说细纲中的逻辑漏洞和问题。

[当前细纲]
${current.slice(0, 8000)}

【检测维度】
1. 逻辑漏洞（前后矛盾、因果不通、设定冲突）
2. 人物行为逻辑（动机是否合理、行为是否符合人设）
3. 时间线问题（时间顺序错误、时间跨度不合理）
4. 设定漏洞（世界观设定自相矛盾）
5. 情节漏洞（关键转折缺乏铺垫、巧合过多）
6. 伏笔问题（伏笔未回收、突兀出现）

【输出格式】
## 发现的问题 (共X个)

### 问题1：[问题类型]
- 位置：第X章
- 描述：...
- 严重程度：高/中/低
- 修复建议：...

### 问题2：...

## 总体评估
- 逻辑完整性：X/10
- 人物一致性：X/10
- 设定自洽性：X/10

## 优先修复建议
1. ...
2. ...`;

        this.updateIO(prompt, '检测中...');
        let result = '';
        await AI.generate(prompt, { apiType: 'parse', module: 'phoenix_outline_audit' }, c => {
            result += c;
            this.updateIO(prompt, result);
        });
        
        const el = document.getElementById('ph-outline-raw');
        if (el) {
            el.value = current + '\n\n---\n\n【漏洞检测报告】\n' + result;
            this.data.outlineRaw = el.value;
            this._updateStats();
        }
        UI.toast('漏洞检测完成！');
    },

    async enhanceHooks() {
        if(this._generating) return;
        const current = (document.getElementById('ph-outline-raw') || {}).value || '';
        if (!current) return UI.toast('大纲为空');
        
        UI.toast('正在强化钩子...');
        
        const fusionCtx = this._getFusionFullContext();
        const nexusCore = this._buildNEXUSCore({ mode: 'outline' });
        const prompt = `${nexusCore}\n\n=== 钩子强化任务 ===\n你是一位钩子设计大师。请强化以下细纲中的悬念钩子，让读者欲罢不能。

${fusionCtx ? '[融合技法参考]\n' + fusionCtx.slice(0, 1500) + '\n\n' : ''}
[当前细纲]
${current.slice(0, 6000)}

【强化要求】
1. 每章结尾必须有钩子（悬念/反转/期待）
2. 开篇三章要有超级钩子（让读者停不下来）
3. 卷末必须有超级悬念（让读者迫不及待看下一卷）
4. 钩子类型多样化（身份悬念、危机悬念、情感悬念、宝物悬念等）
5. 标注每个钩子的类型和预期效果

【输出格式】
保持原有细纲结构，在每章末尾添加：
**章末钩子：** [钩子内容] (类型：悬念/反转/期待)

请输出优化后的完整细纲。`;

        const el = document.getElementById('ph-outline-raw');
        if (el) el.value = '';
        this.updateIO(prompt, '强化钩子中...');
        this._setGenerating(true);
        let result = '';
        await AI.generate(prompt, { apiType: 'text', module: 'phoenix_hook_enhance' }, c => {
            result += c;
            if (el) el.value = result;
            this.data.outlineRaw = result;
            this._updateStats();
            this.updateIO(prompt, result);
        });
        this._setGenerating(false);
        UI.toast('钩子强化完成！');
    },

    async addClimax() {
        if(this._generating) return;
        const current = (document.getElementById('ph-outline-raw') || {}).value || '';
        if (!current) return UI.toast('大纲为空');
        
        UI.toast('正在添加高潮...');
        
        const fusionCtx = this._getFusionFullContext();
        const nexusCore = this._buildNEXUSCore({ mode: 'outline' });
        const prompt = `${nexusCore}\n\n=== 高潮设计任务 ===\n你是一位高潮设计专家。请在以下细纲中添加更多高潮点，让故事更加燃爆。

${fusionCtx ? '[融合技法参考]\n' + fusionCtx.slice(0, 1500) + '\n\n' : ''}
[当前细纲]
${current.slice(0, 6000)}

【高潮设计原则】
1. 每3-5章必须有一个小高潮
2. 每卷必须有1-2个大高潮
3. 高潮类型：打脸高潮、突破高潮、战斗高潮、揭秘高潮、情感高潮
4. 高潮前要有铺垫和压抑，高潮后要有释放和爽感
5. 高潮要有仪式感（众人震惊、实力展示、身份揭露等）

【输出格式】
保持原有细纲结构，在需要高潮的位置添加：
**【高潮】** [高潮内容] (类型：打脸/突破/战斗/揭秘/情感)

请输出添加高潮后的完整细纲。`;

        const el = document.getElementById('ph-outline-raw');
        if (el) el.value = '';
        this.updateIO(prompt, '添加高潮中...');
        this._setGenerating(true);
        let result = '';
        await AI.generate(prompt, { apiType: 'text', module: 'phoenix_climax_design' }, c => {
            result += c;
            if (el) el.value = result;
            this.data.outlineRaw = result;
            this._updateStats();
            this.updateIO(prompt, result);
        });
        this._setGenerating(false);
        UI.toast('高潮添加完成！');
    },

    // ===== AI打磨对话: 细纲格式 + 实体线索 + 上下文 =====
    async sendChat() {
        const input = document.getElementById('ph-chat-in');
        const log = document.getElementById('ph-chat-log');
        if (!input || !log) return;
        const txt = input.value.trim();
        if (!txt) return;
        input.value = '';
        log.innerHTML += `<div class="p-2 bg-accent/10 rounded-lg border border-accent/20"><span class="text-accent font-bold text-[10px]">你</span><div class="text-gray-200 mt-1">${txt}</div></div>`;
        const outline = this.data.outlineRaw || (document.getElementById('ph-outline-raw') || {}).value || '';
        const fusionCtx = this._getFusionFullContext();
        const contextPrompt = `[你是一位长篇小说细纲编辑，必须同时守住 M06、CHR人物状态、WLD世界规则、FOE伏笔、EMO情绪线]\n\n${fusionCtx ? '[参考技法]\n' + fusionCtx.slice(0, 2000) + '\n\n' : ''}${this.data.worldContext ? '[世界引擎]\n' + this.data.worldContext.slice(0, 1200) + '\n\n' : ''}${this.data.memoryContext ? '[记忆上下文]\n' + this.data.memoryContext.slice(0, 1200) + '\n\n' : ''}[当前大纲]\n${outline.slice(0,4000)}\n\n[作者要求]\n${txt}\n\n请根据作者要求修改或建议。若需要改大纲，直接输出可替换的完整段落；同时指出人物一致性和世界观风险。`;
        let reply = '';
        await AI.generate(contextPrompt, { apiType: 'text', module: 'phoenix_outline_chat' }, c => { reply += c; });
        log.innerHTML += `<div class="p-2 bg-white/5 rounded-lg border border-white/5"><span class="text-green-400 font-bold text-[10px]">AI</span><div class="text-gray-300 mt-1 text-xs leading-relaxed">${reply}</div></div>`;
        log.scrollTop = log.scrollHeight;
    },

    // ===== 智能生成（空时生成，有内容时续写） =====
    async smartGen() {
        const current = (document.getElementById('ph-outline-raw') || {}).value || '';
        if (!current || current.trim().length < 50) {
            await this.genOutline();
        } else {
            await this.continueGen();
        }
    },

    // ===== 内联AI对话（支持选中局部修改 + 一键替换） =====
    async sendInlineChat() {
        const input = document.getElementById('ph-inline-chat-in');
        const log = document.getElementById('ph-inline-chat-log');
        const editor = document.getElementById('ph-outline-raw');
        if (!input || !log) return;
        const txt = input.value.trim();
        if (!txt) return;
        input.value = '';

        // 检测编辑器中是否有选中文本
        let selected = '';
        let selStart = 0, selEnd = 0;
        if (editor) {
            selStart = editor.selectionStart;
            selEnd = editor.selectionEnd;
            if (selEnd > selStart) selected = editor.value.slice(selStart, selEnd);
        }

        if (this._shouldInlineChatContinue(txt, selected)) {
            await this._inlineQuickAction('continue', { userInstruction: txt, autoApply: true, source: 'chat' });
            return;
        }

        log.innerHTML += `<div class="p-1.5 bg-accent/10 rounded border border-accent/20"><span class="text-accent font-bold text-[9px]">你</span><div class="text-gray-200 mt-0.5 text-[10px]">${selected ? '[选中修改] ' : ''}${txt}</div></div>`;

        const outline = this.data.outlineRaw || (editor || {}).value || '';
        const fusionCtx = this._getFusionFullContext();
        let prompt = '';

        if (selected) {
            // 局部修改模式：只改选中的段落
            prompt = `[你是一位长篇小说执行级细纲编辑。]

【硬规则】
- M06反AI写作：动作、物件、对话错位、感官和物理后果优先
- 读者协议：每段必须有注意点、信息缺口、代入锚点和继续看的理由，但禁止把这些词写出来
- CHR/WLD/FOE/EMO：人物状态连续，世界规则有代价和边界，伏笔能回收，情绪不跳崖
- 固定字段优先：本章目标 / 阻力与代价 / 情节动作 / 人物变化 / 世界规则 / 伏笔钩子 / 实体线索 / 上下文记忆 / 一致性风险
- 禁止输出：读者期待、读者恐惧、技法标签、AI痕迹、内心OS、反应涟漪、本章分析

${fusionCtx ? '[参考技法]\n' + fusionCtx.slice(0, 800) + '\n\n' : ''}${this.data.worldContext ? '[世界引擎]\n' + this.data.worldContext.slice(0, 800) + '\n\n' : ''}${this.data.memoryContext ? '[记忆上下文]\n' + this.data.memoryContext.slice(0, 800) + '\n\n' : ''}[当前大纲上下文]
${outline.slice(Math.max(0, selStart - 1200), selEnd + 1200)}

[待修改片段]
${selected}

[作者要求]
${txt}

请直接输出替换后的新片段（只输出替换内容，不要输出上下文）。如果要求删除，请输出空字符串表示删除。`;
        } else {
            // 全局建议模式
            const outlineForPrompt = outline.length > 10000
                ? outline.slice(0, 5000) + '\n\n[中间长纲省略]\n\n' + outline.slice(-5000)
                : outline;
            prompt = `[你是一位长篇小说执行级细纲编辑。]

【硬规则】
- M06反AI写作：动作、物件、对话错位、感官和物理后果优先
- 读者协议：每章必须有注意点、信息缺口、代入锚点和继续看的理由，但禁止把这些词显性写进大纲
- CHR人物一致：欲望、伤口、位置、已知/未知信息不能乱
- WLD世界不崩：规则必须有代价、边界、触发条件
- FOE伏笔可回收：埋设、强化、回收计划要清楚
- EMO情绪不断线：不能连续空转，不能无故跳到高位
- 禁止输出：读者期待、读者恐惧、技法标签、AI痕迹、内心OS、反应涟漪、本章分析

${fusionCtx ? '[参考技法]\n' + fusionCtx.slice(0, 1500) + '\n\n' : ''}${this.data.worldContext ? '[世界引擎]\n' + this.data.worldContext.slice(0, 1000) + '\n\n' : ''}${this.data.memoryContext ? '[记忆上下文]\n' + this.data.memoryContext.slice(0, 1000) + '\n\n' : ''}[当前大纲]
${outlineForPrompt}

[作者要求]
${txt}

请直接输出修改后的相关段落，不要开场白。如果要求不涉及大纲修改，给出可执行建议。`;
        }

        let reply = '';
        try {
            await AI.generate(prompt, { apiType: 'text', module: 'phoenix_inline_chat' }, c => { reply += c; });
        } catch(e) {
            log.innerHTML += `<div class="p-1.5 bg-red-500/10 rounded border border-red-500/20"><span class="text-red-400 font-bold text-[9px]">AI</span><div class="text-gray-300 mt-0.5 text-[10px]">修改失败: ${e.message || '未知错误'}</div></div>`;
            log.scrollTop = log.scrollHeight;
            return;
        }

        if (selected) {
            // 局部修改：显示替换按钮
            const editId = 'inline_edit_' + Date.now();
            log.innerHTML += `<div class="p-1.5 bg-white/5 rounded border border-white/5" id="${editId}"><span class="text-green-400 font-bold text-[9px]">AI</span><div class="text-gray-300 mt-0.5 text-[10px] leading-relaxed">${reply}</div><div class="flex gap-1.5 mt-1.5"><button class="text-[9px] px-2 py-0.5 rounded bg-accent/20 text-accent border border-accent/30" onclick="Modules.phoenix._applyInlineEdit('${editId}', ${selStart}, ${selEnd})"><i class="fa-solid fa-check mr-0.5"></i>替换</button><button class="text-[9px] px-2 py-0.5 rounded bg-white/5 text-dim border border-white/10" onclick="document.getElementById('${editId}').remove()"><i class="fa-solid fa-xmark mr-0.5"></i>取消</button></div></div>`;
        } else {
            log.innerHTML += `<div class="p-1.5 bg-white/5 rounded border border-white/5"><span class="text-green-400 font-bold text-[9px]">AI</span><div class="text-gray-300 mt-0.5 text-[10px] leading-relaxed">${reply}</div></div>`;
        }
        log.scrollTop = log.scrollHeight;
    },

    // 应用内联修改替换
    _applyInlineEdit(editId, start, end) {
        const editor = document.getElementById('ph-outline-raw');
        const editEl = document.getElementById(editId);
        if (!editor || !editEl) return;
        // 提取 AI 生成的内容（去掉按钮区域）
        const textDiv = editEl.querySelector('div.text-gray-300');
        if (!textDiv) return;
        let replacement = textDiv.textContent.trim();
        // 执行替换
        const before = editor.value.slice(0, start);
        const after = editor.value.slice(end);
        editor.value = before + replacement + after;
        editor.selectionStart = editor.selectionEnd = start + replacement.length;
        editor.focus();
        this.data.outlineRaw = editor.value;
        this._updateStats();
        this._updateGenProgress(editor.value);
        editEl.remove();
        UI.toast('已替换选中内容');
    },

    _applyInlineInsert(editId, pos) {
        const editor = document.getElementById('ph-outline-raw');
        const editEl = document.getElementById(editId);
        if (!editor || !editEl) return;
        const textDiv = editEl.querySelector('div.text-gray-300');
        if (!textDiv) return;
        const insertion = textDiv.textContent.trim();
        if (!insertion) return UI.toast('没有可插入内容');
        const safePos = Math.max(0, Math.min(pos, editor.value.length));
        const before = editor.value.slice(0, safePos).replace(/\s*$/, '\n\n');
        const after = editor.value.slice(safePos).replace(/^\s*/, '\n\n');
        editor.value = before + insertion + after;
        editor.selectionStart = editor.selectionEnd = before.length + insertion.length;
        editor.focus();
        this.data.outlineRaw = editor.value;
        this._updateStats();
        this._updateGenProgress(editor.value);
        editEl.remove();
        UI.toast('已插入续写内容');
    },

    // 快捷局部操作（扩写/精简/加钩子/加爽点/删除）
    async _inlineQuickAction(action, opts = {}) {
        const editor = document.getElementById('ph-outline-raw');
        if (!editor) return UI.toast('未找到编辑器');
        const selStart = editor.selectionStart;
        const selEnd = editor.selectionEnd;
        if (selEnd <= selStart && action !== 'continue') return UI.toast('请先在大纲中选中要修改的文字');

        const selected = editor.value.slice(selStart, selEnd);
        if (action === 'delete') {
            editor.value = editor.value.slice(0, selStart) + editor.value.slice(selEnd);
            editor.selectionStart = editor.selectionEnd = selStart;
            this.data.outlineRaw = editor.value;
            this._updateStats();
            this._updateGenProgress(editor.value);
            UI.toast('已删除选中片段');
            return;
        }
        const instructions = {
            expand: '把选中片段扩成执行级细纲片段：保留原事件、人物方向和世界规则，补齐目标、阻力、代价、动作链、微动作、环境反馈、实体线索、人物变化、规则影响和章末钩子。',
            trim: '压缩成可写骨架：只保留目标、阻力、代价、动作链、人物变化、世界规则、实体线索和章末钩子，删掉抽象解释、重复标签和泛泛评价。',
            hook: '重做结尾钩子：必须是未完成动作+意外信息/时间压力/信息差；回收一个缺口时同时埋下新缺口；禁止解释。',
            cool: '增加付费看点：用信息差、权力位移、反常动作、伏笔回收、选择代价制造继续看的冲动；禁止口号式爽点，禁止显性读者标签。',
            continue: '从光标或选中片段之后继续写执行级细纲。只续写后续卷章或后续小节，不重复已有内容，不改前文方向。'
        };

        const log = document.getElementById('ph-inline-chat-log');
        if (log) {
            const ask = opts.userInstruction ? this._escapeInlineHtml(opts.userInstruction) : instructions[action];
            log.innerHTML += `<div class="p-1.5 bg-accent/10 rounded border border-accent/20"><span class="text-accent font-bold text-[9px]">你</span><div class="text-gray-200 mt-0.5 text-[10px]">${opts.source === 'chat' ? '' : '[快捷] '}${ask}</div></div>`;
            log.scrollTop = log.scrollHeight;
        }

        const outline = editor.value;
        const insertMode = action === 'continue';
        let insertPos = insertMode && opts.source === 'chat' && selEnd <= selStart ? outline.length : (selEnd > selStart ? selEnd : selStart);
        const continueIntent = insertMode ? this._analyzeInlineContinueRequest(outline, opts.userInstruction || '', insertPos) : null;
        if (continueIntent && typeof continueIntent.insertPos === 'number') insertPos = continueIntent.insertPos;
        const contextStart = Math.max(0, insertMode ? insertPos - 2200 : selStart - 1200);
        const contextEnd = Math.min(outline.length, insertMode ? insertPos + 800 : selEnd + 1200);
        const outlineContext = insertMode && continueIntent ? continueIntent.context : outline.slice(contextStart, contextEnd);
        const prompt = `[你是一位长篇小说执行级细纲编辑。]

【硬规则】
- 服从M06：只用动作、物件、对话、感官、物理后果推进，不写空话
- 服从读者协议：每一段都要有注意点、信息缺口、代入锚点和继续看的理由，但不要把这些词写出来
- 服从CHR/WLD/FOE/EMO：人物状态连续，世界规则有代价和边界，伏笔能回收，情绪不跳崖
- 输出只能是${insertMode ? '可插入的续写大纲片段' : '可替换的大纲片段'}
- 固定字段：本章目标 / 阻力与代价 / 情节动作 / 人物变化 / 世界规则 / 伏笔钩子 / 实体线索 / 上下文记忆 / 一致性风险
- 细纲只写“要写什么”和“怎么推进”，不要直接写正文
- 禁止出现：读者期待、读者恐惧、技法标签、AI痕迹、内心OS、反应涟漪、本章分析
${insertMode ? this._buildInlineContinueControl(continueIntent) : ''}

[当前大纲上下文]
${outlineContext}

${insertMode ? '[续写断点]\n' + (selected || outline.slice(Math.max(0, insertPos - 800), insertPos)) : '[待修改片段]\n' + selected}

[要求]
${instructions[action]}${opts.userInstruction ? '\n作者补充：' + opts.userInstruction : ''}

请直接输出${insertMode ? '要插入的新片段' : '替换后的新片段'}，不要输出上下文，不要解释。`;

        let reply = '';
        try {
            this._setGenerating(true);
            if (log) {
                const loadingId = 'inline_loading_' + Date.now();
                this._inlineLoadingId = loadingId;
                log.innerHTML += `<div class="p-1.5 bg-white/5 rounded border border-white/5" id="${loadingId}"><span class="text-green-400 font-bold text-[9px]">AI</span><div class="text-gray-300 mt-0.5 text-[10px]"><i class="fa-solid fa-circle-notch fa-spin mr-1"></i>正在续写细纲...</div></div>`;
                log.scrollTop = log.scrollHeight;
            }
            await AI.generate(prompt, { apiType: 'text', module: 'phoenix_inline_outline' }, c => { reply += c; });
        } catch(e) {
            if (log) log.innerHTML += `<div class="p-1.5 bg-red-500/10 rounded border border-red-500/20"><span class="text-red-400 font-bold text-[9px]">AI</span><div class="text-gray-300 mt-0.5 text-[10px]">失败: ${e.message || '未知错误'}</div></div>`;
        } finally {
            this._setGenerating(false);
            if (this._inlineLoadingId) {
                const loading = document.getElementById(this._inlineLoadingId);
                if (loading) loading.remove();
                this._inlineLoadingId = null;
            }
        }

        if (insertMode) {
            reply = this._sanitizeInlineContinueReply(reply, continueIntent, outline);
        }
        if (!reply.trim()) return;

        if (insertMode && opts.autoApply) {
            const safePos = Math.max(0, Math.min(insertPos, editor.value.length));
            const before = editor.value.slice(0, safePos).replace(/\s*$/, '\n\n');
            const after = editor.value.slice(safePos).replace(/^\s*/, '\n\n');
            editor.value = before + reply.trim() + after;
            editor.selectionStart = editor.selectionEnd = before.length + reply.trim().length;
            editor.focus();
            this.data.outlineRaw = editor.value;
            this._updateStats();
            this._updateGenProgress(editor.value);
            if (log) {
                log.innerHTML += `<div class="p-1.5 bg-white/5 rounded border border-white/5"><span class="text-green-400 font-bold text-[9px]">AI</span><div class="text-gray-300 mt-0.5 text-[10px] leading-relaxed">${this._escapeInlineHtml(reply)}</div><div class="text-[9px] text-accent mt-1">已插入到细纲</div></div>`;
                log.scrollTop = log.scrollHeight;
            }
            UI.toast('已续写并插入细纲');
            return;
        }

        const editId = 'inline_edit_' + Date.now();
        if (log) {
            const applyBtn = insertMode
                ? `<button class="text-[9px] px-2 py-0.5 rounded bg-accent/20 text-accent border border-accent/30" onclick="Modules.phoenix._applyInlineInsert('${editId}', ${insertPos})"><i class="fa-solid fa-check mr-0.5"></i>插入</button>`
                : `<button class="text-[9px] px-2 py-0.5 rounded bg-accent/20 text-accent border border-accent/30" onclick="Modules.phoenix._applyInlineEdit('${editId}', ${selStart}, ${selEnd})"><i class="fa-solid fa-check mr-0.5"></i>替换</button>`;
            log.innerHTML += `<div class="p-1.5 bg-white/5 rounded border border-white/5" id="${editId}"><span class="text-green-400 font-bold text-[9px]">AI</span><div class="text-gray-300 mt-0.5 text-[10px] leading-relaxed">${reply}</div><div class="flex gap-1.5 mt-1.5">${applyBtn}<button class="text-[9px] px-2 py-0.5 rounded bg-white/5 text-dim border border-white/10" onclick="document.getElementById('${editId}').remove()"><i class="fa-solid fa-xmark mr-0.5"></i>取消</button></div></div>`;
            log.scrollTop = log.scrollHeight;
        }
    },

    _escapeInlineHtml(text) {
        return String(text || '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
    },

    // ===== 快捷优化 =====
    async _quickOptimize(type) {
        const outline = this.data.outlineRaw || (document.getElementById('ph-outline-raw') || {}).value || '';
        if (!outline) return UI.toast('请先生成大纲');
        const fusionCtx = this._getFusionFullContext();
        const outlineForPrompt = outline.length > 12000
            ? outline.slice(0, 6000) + '\n\n[中间长纲已省略，请保持原有卷章方向，只重点校准前后断点]\n\n' + outline.slice(-6000)
            : outline;
        let task = '', instruction = '';
        switch(type) {
            case 'expand': task = '扩写'; instruction = '把薄弱章节扩成执行级细纲。不得改主线方向。每章补齐目标、阻力、代价、动作链、微动作、环境反馈、人物变化、规则影响、实体线索、章末钩子。'; break;
            case 'hook': task = '加钩子'; instruction = '重做每章结尾。钩子必须是未完成动作、意外信息、时间压力或信息差。回收一个缺口时必须埋下新的缺口。'; break;
            case 'cool': task = '加看点'; instruction = '强化付费看点。用信息差、权力位移、反常动作、伏笔回收、角色选择代价制造继续看的冲动；不许写口号，不许显性写读者反应。'; break;
            case 'trim': task = '精简'; instruction = '压成可写骨架。删掉解释、空话、重复标签，只保留目标、冲突、动作、规则、实体、伏笔、钩子和一致性风险。'; break;
            case 'custom':
                const custom = prompt('输入你的优化要求：');
                if (!custom) return;
                task = '自定义优化'; instruction = custom;
                break;
        }
        const prompt = `[小说大纲${task}]

【后台硬规则】
- M06反AI写作：动作、物件、对话错位、感官和物理后果优先
- 读者协议：每章必须有注意点、信息缺口、代入锚点和继续看的理由，但禁止把这些词显性写进大纲
- CHR人物一致：欲望、伤口、位置、已知/未知信息不能乱
- WLD世界不崩：规则必须有代价、边界、触发条件
- FOE伏笔可回收：埋设、强化、回收计划要清楚
- EMO情绪不断线：不能连续空转，不能无故跳到高位
- 每章必须可落到正文：有具体动作、有物件、有场景反馈、有选择代价
- 不新增无来源主角设定，不吞掉已有章节，不跳过实体线索
- 禁止输出：读者期待、读者恐惧、技法标签、AI痕迹、内心OS、反应涟漪、本章分析

${fusionCtx ? '[参考技法]\n' + fusionCtx.slice(0, 1500) + '\n\n' : ''}${this.data.worldContext ? '[世界引擎]\n' + this.data.worldContext.slice(0, 1000) + '\n\n' : ''}${this.data.memoryContext ? '[记忆上下文]\n' + this.data.memoryContext.slice(0, 1000) + '\n\n' : ''}[当前大纲]
${outlineForPrompt}

[优化要求]
${instruction}

请直接输出优化后的完整大纲，保持固定细纲格式：本章目标 / 阻力与代价 / 情节动作 / 人物变化 / 世界规则 / 伏笔钩子 / 实体线索 / 上下文记忆 / 一致性风险。不要解释。`;
        const el = document.getElementById('ph-outline-raw');
        this._setGenerating(true);
        let result = '';
        try {
            if (el) el.value = '';
            await AI.generate(prompt, { apiType: 'text', module: 'phoenix_outline_optimize' }, c => {
                result += c;
                if (el) { el.value = result; this.data.outlineRaw = result; this._updateStats(); }
            });
            UI.toast(task + '完成');
        } catch(e) {
            console.error('[Phoenix] _quickOptimize error:', e);
            if (el) {
                el.value = outline;
                this.data.outlineRaw = outline;
                this._updateStats();
            }
            UI.toast(task + '失败: ' + (e.message || '未知错误'), 'error');
        } finally {
            this._setGenerating(false);
        }
    },

    // ===== AI润色大纲 (Step 2) =====
    async aiPolishOutline() {
        if (this._generating) return UI.toast('正在生成中，请稍候');
        const el = document.getElementById('ph-outline-edit');
        const current = el ? el.value : '';
        if(!current) return UI.toast('大纲为空');
        this._setGenerating(true);
        const prompt = `[任务] 校准以下小说大纲。目标不是文采润色，而是让它变成可直接写正文、可提实体、可巡检的一份执行级细纲。

【硬规则】
- 保持原结构和主要事件不变
- 补齐目标、阻力、代价、动作链、人物变化、规则边界、伏笔回收、实体线索
- 按M06删除抽象空话，改成动作、物件、对话错位和物理细节
- 章末必须能驱动下一章
- 禁止输出：读者期待、读者恐惧、技法标签、AI痕迹、内心OS、反应涟漪、本章分析

【待校准大纲】
${current.slice(0,6000)}

请直接输出校准后的完整大纲。`;
        let fullRes = '';
        try {
            await AI.generate(prompt, { apiType: 'text', module: 'phoenix_outline_polish' }, c => { fullRes += c; if(el) el.value = fullRes; this.updatePreview(); });
            UI.toast('大纲润色完成');
        } catch(e) {
            console.error('[Phoenix] aiPolishOutline error:', e);
            UI.toast('润色失败: ' + (e.message || '未知错误'), 'error');
        } finally {
            this._setGenerating(false);
        }
    },
});
