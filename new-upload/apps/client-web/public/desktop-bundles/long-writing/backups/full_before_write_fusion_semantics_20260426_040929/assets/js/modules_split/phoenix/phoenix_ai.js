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
            await AI.generate(prompt, {}, c => {
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
5. 每章必须有可提取的实体线索，方便下一步注入世界引擎知识图谱
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
5. 每章必须有可提取的实体线索，方便下一步注入世界引擎知识图谱
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
            await AI.generate(prompt, {}, c => {
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
        if(fusionCtx) prompt += '[融合技法参考]\n' + fusionCtx.slice(0, 1500) + '\n\n';
        if(this.data.worldContext) prompt += '[世界观设定]\n' + this.data.worldContext.slice(0, 1200) + '\n\n';
        if(this.data.memoryContext) prompt += '[三层记忆上下文]\n' + this.data.memoryContext.slice(0, 1200) + '\n\n';
        prompt += `[已有细纲末尾]\n${current.slice(-2500)}\n\n请从断点处直接继续，不要任何开场白或解释，直接输出后续的卷章内容：`;

        console.log('[Phoenix] continueGen prompt length:', prompt.length);
        this.updateIO(prompt, '续写中...');
        this._setGenerating(true);
        try {
            await AI.generate(prompt, {}, c => {
                const el = document.getElementById('ph-outline-raw');
                if (el) { el.value += c; el.scrollTop = el.scrollHeight; }
                this.data.outlineRaw = el ? el.value : '';
                this._updateGenProgress(el ? el.value : '');
                this.updateIO(prompt, this.data.outlineRaw);
                this._updateStats();
            });
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
        let prompt = `[任务] 请对以下小说细纲进行迭代优化：\n1. 保持固定细纲格式：本章目标 / 阻力与代价 / 情节动作 / 人物变化 / 世界规则 / 伏笔钩子 / 实体线索 / 上下文记忆 / 一致性风险\n2. 检查逻辑漏洞和前后矛盾\n3. 检查人物状态是否连续，人物不能无理由OOC\n4. 检查世界规则是否有代价、边界和一致性\n5. 加强伏笔、章末钩子和回收计划\n6. 每章补齐可提取实体线索，方便下一步注入世界引擎知识图谱\n7. 按 M06 改写空泛表达，用动作、物件、对话错位和物理细节呈现\n`;
        if(fusionCtx) prompt += `\n[融合技法参考 — 请用这些技法优化细纲]\n${fusionCtx.slice(0, 3000)}\n`;
        prompt += `\n[当前细纲]\n${current.slice(0,6000)}\n\n请输出优化后的完整细纲，保持固定细纲格式：本章目标 / 阻力与代价 / 情节动作 / 人物变化 / 世界规则 / 伏笔钩子 / 实体线索 / 上下文记忆 / 一致性风险。`;
        const el = document.getElementById('ph-outline-raw');
        if(el) el.value = '';
        this.updateIO(prompt, '迭代优化中...');
        this._setGenerating(true);
        let fullRes = '';
        await AI.generate(prompt, {}, c => {
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
        const volMatches = text.match(/^## .+$/gm) || [];
        const chapMatches = text.match(/^### .+$/gm) || [];
        const lastVol = volMatches.length > 0 ? volMatches[volMatches.length - 1] : '';
        const lastChap = chapMatches.length > 0 ? chapMatches[chapMatches.length - 1] : '';
        return { volCount: volMatches.length, chapCount: chapMatches.length, lastVol, lastChap };
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
        await AI.generate(prompt, {}, c => {
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
        await AI.generate(prompt, {}, c => {
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
        await AI.generate(prompt, {}, c => {
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
        await AI.generate(prompt, {}, c => {
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
        await AI.generate(prompt, {}, c => {
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
        await AI.generate(prompt, {}, c => {
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
        await AI.generate(contextPrompt, {}, c => { reply += c; });
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

        log.innerHTML += `<div class="p-1.5 bg-accent/10 rounded border border-accent/20"><span class="text-accent font-bold text-[9px]">你</span><div class="text-gray-200 mt-0.5 text-[10px]">${selected ? '[选中修改] ' : ''}${txt}</div></div>`;

        const outline = this.data.outlineRaw || (editor || {}).value || '';
        const fusionCtx = this._getFusionFullContext();
        let prompt = '';

        if (selected) {
            // 局部修改模式：只改选中的段落
            prompt = `[你是一位长篇小说细纲编辑。硬规则：M06反AI写作、人物状态连续、世界规则不崩、伏笔可回收]\n\n${fusionCtx ? '[参考技法]\n' + fusionCtx.slice(0, 800) + '\n\n' : ''}${this.data.worldContext ? '[世界引擎]\n' + this.data.worldContext.slice(0, 800) + '\n\n' : ''}${this.data.memoryContext ? '[记忆上下文]\n' + this.data.memoryContext.slice(0, 800) + '\n\n' : ''}[当前大纲上下文]\n${outline.slice(Math.max(0, selStart - 500), selEnd + 500)}\n\n[待修改片段]\n${selected}\n\n[作者要求]\n${txt}\n\n请直接输出替换后的新片段（只输出替换内容，不要输出上下文）。如果要求删除，请输出空字符串表示删除。`;
        } else {
            // 全局建议模式
            prompt = `[你是一位长篇小说细纲编辑。硬规则：M06反AI写作、人物变化连续、世界规则边界清楚、实体线索可提取、人物一致]\n\n${fusionCtx ? '[参考技法]\n' + fusionCtx.slice(0, 1500) + '\n\n' : ''}${this.data.worldContext ? '[世界引擎]\n' + this.data.worldContext.slice(0, 1000) + '\n\n' : ''}${this.data.memoryContext ? '[记忆上下文]\n' + this.data.memoryContext.slice(0, 1000) + '\n\n' : ''}[当前大纲]\n${outline.slice(0,3000)}\n\n[作者要求]\n${txt}\n\n请直接输出修改后的相关段落，不要开场白。如果要求不涉及大纲修改，给出建议即可。`;
        }

        let reply = '';
        try {
            await AI.generate(prompt, {}, c => { reply += c; });
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

    // 快捷局部操作（扩写/精简/加钩子/加爽点/删除）
    async _inlineQuickAction(action) {
        const editor = document.getElementById('ph-outline-raw');
        if (!editor) return UI.toast('未找到编辑器');
        const selStart = editor.selectionStart;
        const selEnd = editor.selectionEnd;
        if (selEnd <= selStart) return UI.toast('请先在大纲中选中要修改的文字');

        const selected = editor.value.slice(selStart, selEnd);
        const instructions = {
            expand: '扩写以下片段，增加动作、物件、对话错位、冲突和代价，让情节可直接开写',
            trim: '精简以下片段，删除冗余描述，保留核心冲突、人物选择、世界规则和钩子',
            hook: '强化以下片段的悬念钩子，在结尾处增加未完成动作、意外信息、时间压力或信息差',
            cool: '强化以下片段的看点，但不能破坏人物状态和世界规则；用具体动作和结果呈现爽感',
            delete: '删除以下片段（请直接输出空字符串）'
        };

        const log = document.getElementById('ph-inline-chat-log');
        if (log) {
            log.innerHTML += `<div class="p-1.5 bg-accent/10 rounded border border-accent/20"><span class="text-accent font-bold text-[9px]">你</span><div class="text-gray-200 mt-0.5 text-[10px]">[快捷] ${instructions[action]}</div></div>`;
        }

        const outline = editor.value;
        const prompt = `[你是一位长篇小说细纲编辑。硬规则：M06、人物一致、世界规则不崩、伏笔可回收]\n\n[当前大纲上下文]\n${outline.slice(Math.max(0, selStart - 300), selEnd + 300)}\n\n[待修改片段]\n${selected}\n\n[要求]\n${instructions[action]}\n\n请直接输出替换后的新片段（只输出替换内容，不要输出上下文）。`;

        let reply = '';
        try {
            this._setGenerating(true);
            await AI.generate(prompt, {}, c => { reply += c; });
        } catch(e) {
            if (log) log.innerHTML += `<div class="p-1.5 bg-red-500/10 rounded border border-red-500/20"><span class="text-red-400 font-bold text-[9px]">AI</span><div class="text-gray-300 mt-0.5 text-[10px]">失败: ${e.message || '未知错误'}</div></div>`;
        } finally {
            this._setGenerating(false);
        }

        if (!reply.trim()) return;

        const editId = 'inline_edit_' + Date.now();
        if (log) {
            log.innerHTML += `<div class="p-1.5 bg-white/5 rounded border border-white/5" id="${editId}"><span class="text-green-400 font-bold text-[9px]">AI</span><div class="text-gray-300 mt-0.5 text-[10px] leading-relaxed">${reply}</div><div class="flex gap-1.5 mt-1.5"><button class="text-[9px] px-2 py-0.5 rounded bg-accent/20 text-accent border border-accent/30" onclick="Modules.phoenix._applyInlineEdit('${editId}', ${selStart}, ${selEnd})"><i class="fa-solid fa-check mr-0.5"></i>替换</button><button class="text-[9px] px-2 py-0.5 rounded bg-white/5 text-dim border border-white/10" onclick="document.getElementById('${editId}').remove()"><i class="fa-solid fa-xmark mr-0.5"></i>取消</button></div></div>`;
            log.scrollTop = log.scrollHeight;
        }
    },

    // ===== 快捷优化 =====
    async _quickOptimize(type) {
        const outline = this.data.outlineRaw || (document.getElementById('ph-outline-raw') || {}).value || '';
        if (!outline) return UI.toast('请先生成大纲');
        const fusionCtx = this._getFusionFullContext();
        let task = '', instruction = '';
        switch(type) {
            case 'expand': task = '扩写'; instruction = '把当前最后一卷或最短的卷扩写，每章情节描述增加到150字以上，增加动作、物件、对话错位、冲突和代价'; break;
            case 'hook': task = '加钩子'; instruction = '为每章结尾添加或强化悬念钩子，使用未完成动作、意外信息、时间压力或信息差'; break;
            case 'cool': task = '加看点'; instruction = '强化每章看点，但必须保持人物状态连续、世界规则不崩、代价清楚'; break;
            case 'trim': task = '精简'; instruction = '删除冗余描述，保留核心冲突、人物选择、世界规则、伏笔和章末钩子'; break;
            case 'custom':
                const custom = prompt('输入你的优化要求：');
                if (!custom) return;
                task = '自定义优化'; instruction = custom;
                break;
        }
        const prompt = `[小说大纲${task}]\n\n硬规则：M06反AI写作、人物一致、世界规则不崩、伏笔可回收、实体线索可提取。\n\n${fusionCtx ? '[参考技法]\n' + fusionCtx.slice(0, 1500) + '\n\n' : ''}${this.data.worldContext ? '[世界引擎]\n' + this.data.worldContext.slice(0, 1000) + '\n\n' : ''}${this.data.memoryContext ? '[记忆上下文]\n' + this.data.memoryContext.slice(0, 1000) + '\n\n' : ''}[当前大纲]\n${outline.slice(0,4000)}\n\n[优化要求]\n${instruction}\n\n请直接输出优化后的完整大纲，保持固定细纲格式：本章目标 / 阻力与代价 / 情节动作 / 人物变化 / 世界规则 / 伏笔钩子 / 实体线索 / 上下文记忆 / 一致性风险。`;
        const el = document.getElementById('ph-outline-raw');
        if (el) el.value = '';
        this._setGenerating(true);
        let result = '';
        try {
            await AI.generate(prompt, {}, c => {
                result += c;
                if (el) { el.value = result; this.data.outlineRaw = result; this._updateStats(); }
            });
            UI.toast(task + '完成');
        } catch(e) {
            console.error('[Phoenix] _quickOptimize error:', e);
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
        const prompt = `[任务] 请润色以下小说大纲，提升文笔和表达力，但保持结构和内容不变：\n\n${current.slice(0,6000)}`;
        let fullRes = '';
        try {
            await AI.generate(prompt, {}, c => { fullRes += c; if(el) el.value = fullRes; this.updatePreview(); });
            UI.toast('大纲润色完成');
        } catch(e) {
            console.error('[Phoenix] aiPolishOutline error:', e);
            UI.toast('润色失败: ' + (e.message || '未知错误'), 'error');
        } finally {
            this._setGenerating(false);
        }
    },
});
