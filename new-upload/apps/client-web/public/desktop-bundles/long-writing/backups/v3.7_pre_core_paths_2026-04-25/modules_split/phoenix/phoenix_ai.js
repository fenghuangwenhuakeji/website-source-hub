Object.assign(Modules.phoenix, {
    async fusionDrivenGen() {
        if(this._generating) return;
        const fusionCtx = this._getFusionFullContext();
        if(!fusionCtx) return UI.toast('请先在融合拆书中运行流水线获取融合精华');
        const idea = (document.getElementById('ph-idea') || {}).value || '';
        const genre = (document.getElementById('ph-genre') || {}).value || '';
        const style = (document.getElementById('ph-style') || {}).value || '';

        const prompt = `你是一位年入千万的网文大神级策划师，精通所有爆款网文的底层套路。现在你手握两本畅销书的融合技法精华，请运用这些技法来构建一部让读者疯狂追更的长篇网文细纲。

${fusionCtx}
${this.data.worldContext ? '[世界观设定]\n' + this.data.worldContext.slice(0,2000) + '\n\n' : ''}${idea ? '[作者创意]\n' + idea + '\n\n' : ''}${genre ? '[类型] ' + genre + '\n' : ''}${style ? '[风格] ' + style + '\n' : ''}
[核心要求]
1. 必须深度运用上述融合技法中的每一项套路（开篇钩子模板、节奏公式、爽点矩阵、悬念体系）
2. 每章标注运用了哪些融合技法
3. 格式：## 第X卷：卷名 / ### 第X章：章名 / **情节：** / **看点：**
4. 至少生成前3卷，每卷6-8章
5. 每章必须包含：核心事件、运用技法、爽点设计（装逼打脸/升级突破/众人震惊等）、章末钩子
6. 网文铁律：开篇三章定生死，3章一小高潮，卷末大高潮+超级悬念
7. 主角每章必须有成长或收获，绝不能连续吃瘪
8. 确保全书有完整的主线悬念链和伏笔回收计划
9. 升级体系要清晰，每次突破都要有仪式感和爽感`;

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
            // 如果没有自定义提示词，或者还是旧版简单提示词，则更新为网文专业版
            if (!existingPrompt || (existingPrompt.content && existingPrompt.content.length < 300)) {
                await DB.put('prompts', { id: 'phoenix_outline', name: 'phoenix_outline', content: `你是一位精通网文套路的顶级大纲策划师，擅长设计让读者欲罢不能的爽文结构。

基于创意【{{idea}}】
类型：{{genre}}
风格：{{style}}

请生成一份详细的长篇网文分卷细纲。

格式要求：
## 第一卷：卷名（用吸引眼球的卷名）
### 第一章：章名
**情节：** 本章核心事件、冲突推进、主角行动
**看点：** 爽点设计/反转/悬念钩子/读者情绪引导
### 第二章：章名
...

网文铁律（必须遵守）：
1. 开篇三章定生死——第一章必须有强钩子（重生/觉醒/打脸/金手指激活），让读者根本停不下来
2. 黄金三章法则：冲突→小高潮→更大悬念，3章一个小循环
3. 爽点密度：每章至少一个爽点（装逼打脸/实力碾压/获得宝物/突破升级/美女倒贴/众人震惊）
4. 悬念钩子：每章结尾必须留钩子，让读者忍不住看下一章
5. 主角光环：主角每章都要有成长、收获或装逼时刻，绝不能让主角吃瘪超过1章
6. 节奏控制：紧3松1，连续3章高强度剧情后安排1章过渡（但过渡章也要有伏笔和小爽点）
7. 卷末大高潮：每卷结尾必须是全卷最燃最爽的大场面，同时埋下一卷的超级悬念
8. 升级体系清晰：主角的实力成长要有明确的阶梯感，每次突破都要有仪式感
9. 配角工具人到位：每个配角都要有明确功能（衬托主角/制造冲突/提供资源/搞笑调节）
10. 伏笔回收：前面埋的伏笔要在合适时机回收，给读者"原来如此"的爽感

至少生成前3卷，每卷6-8章，每章情节描述不少于100字。` });
            }
        } catch (e) {}

        this.data.idea = idea; this.data.genre = genre; this.data.style = style;

        // 细纲生成核心指令（直接内联，不依赖 getPrompt 避免空值）
        let prompt = `你是一位精通网文套路的顶级大纲策划师，擅长设计让读者欲罢不能的爽文结构。

基于创意【${idea}】
类型：${genre || '未指定'}
风格：${style || '爽文、快节奏'}

请生成一份详细的长篇网文分卷细纲。

格式要求（必须严格遵守）：
## 第一卷：卷名（用吸引眼球的卷名）
### 第一章：章名
**情节：** 本章核心事件、冲突推进、主角行动（不少于100字）
**看点：** 爽点设计/反转/悬念钩子/读者情绪引导
### 第二章：章名
...

网文铁律（必须遵守）：
1. 开篇三章定生死——第一章必须有强钩子，让读者根本停不下来
2. 黄金三章法则：冲突→小高潮→更大悬念，3章一个小循环
3. 爽点密度：每章至少一个爽点（装逼打脸/实力碾压/获得宝物/突破升级/众人震惊）
4. 悬念钩子：每章结尾必须留钩子，让读者忍不住看下一章
5. 主角光环：主角每章都要有成长、收获或装逼时刻，绝不能让主角吃瘪超过1章
6. 节奏控制：紧3松1，连续3章高强度剧情后安排1章过渡（但过渡章也要有伏笔和小爽点）
7. 卷末大高潮：每卷结尾必须是全卷最燃最爽的大场面，同时埋下一卷的超级悬念
8. 升级体系清晰：主角的实力成长要有明确的阶梯感，每次突破都要有仪式感
9. 配角工具人到位：每个配角都要有明确功能（衬托主角/制造冲突/提供资源/搞笑调节）
10. 伏笔回收：前面埋的伏笔要在合适时机回收，给读者"原来如此"的爽感

至少生成前3卷，每卷6-8章，每章情节描述不少于100字。`;

        // ★ NEXUS OS v2.0 创作规则作为辅助约束注入（不覆盖核心指令）
        prompt += '\n\n' + this._buildNEXUSCore({ mode: 'outline' });

        // M04A/B/C 融合上下文注入
        const fusionCtx = this._getFusionFullContext();
        if(fusionCtx) prompt += '\n\n[M04 融合技法参考 — 请在细纲中运用这些技法]\n' + fusionCtx;
        if(this.data.worldContext) prompt += '\n\n[世界引擎素材]\n' + this.data.worldContext.slice(0,2000);
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
        let prompt = `你是一位精通网文套路的顶级大纲策划师。请继续撰写以下长篇网文的分卷细纲。\n\n`;
        prompt += `[核心任务] 为一部${genre || '网文'}长篇小说续写分卷细纲，风格定位：${style || '爽文、快节奏'}。\n\n`;
        prompt += `[续写约束]\n`;
        prompt += `- 你必须从上文最后断开的位置【无缝衔接】继续往下写，不要重复已有内容\n`;
        prompt += `- 当前已写到：${bp.lastVol} / ${bp.lastChap}（共${bp.volCount}卷${bp.chapCount}章）\n`;
        prompt += `- 继续保持 ## 卷名 / ### 章名 / **情节** / **看点** 格式\n`;
        prompt += `- 每章必须包含：核心事件+冲突推进+爽点/反转/悬念钩子\n`;
        prompt += `- 节奏要求：3章一小高潮，卷末大高潮+悬念钩子\n`;
        prompt += `- 主角每章都要有成长或收获，读者每章都要有爽感或期待感\n`;
        prompt += `- 至少继续写2-3卷，每卷5-8章，每章情节描述不少于100字\n\n`;
        if(fusionCtx) prompt += '[融合技法参考]\n' + fusionCtx.slice(0, 1500) + '\n\n';
        if(this.data.worldContext) prompt += '[世界观设定]\n' + this.data.worldContext.slice(0, 1200) + '\n\n';
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

    // ===== 迭代优化 (注入融合技法) =====
    async iterateOutline() {
        if(this._generating) return;
        const current = (document.getElementById('ph-outline-raw') || {}).value || '';
        if (!current) return UI.toast('请先生成大纲');
        const fusionCtx = this._getFusionFullContext();
        let prompt = `[任务] 请对以下小说细纲进行迭代优化：\n1. 检查逻辑漏洞和前后矛盾\n2. 优化节奏，确保高潮迭起\n3. 加强伏笔和悬念设置\n4. 丰富每章的情节密度\n5. 确保人物弧光完整\n`;
        if(fusionCtx) prompt += `\n[融合技法参考 — 请用这些技法优化细纲]\n${fusionCtx.slice(0, 3000)}\n`;
        prompt += `\n[当前细纲]\n${current.slice(0,6000)}\n\n请输出优化后的完整细纲，保持原有格式。`;
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

    // ===== 扩展细化 (注入融合技法) =====
    async expandOutline() {
        if(this._generating) return;
        const current = (document.getElementById('ph-outline-raw') || {}).value || '';
        if (!current) return UI.toast('请先生成大纲');
        const fusionCtx = this._getFusionFullContext();
        let prompt = `[任务] 请对以下细纲进行扩展细化：\n1. 为每章增加更详细的场景描述\n2. 补充角色的情感变化和内心活动\n3. 增加具体的对话提示和名场面设计\n4. 标注每章的字数建议和节奏标记\n`;
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

        const prompt = `你是网文技法大师。请用以下融合技法精华来润色和强化这份细纲。

${fusionCtx}
[当前细纲]
${current.slice(0,6000)}

[润色要求]
1. 用融合技法中的「开篇钩子模板」优化每章开头
2. 用「节奏公式」调整全书节奏曲线
3. 用「爽点矩阵」在关键节点插入爽点
4. 用「悬念体系」加强伏笔和钩子
5. 每章标注运用了哪些融合技法
6. 保持原有故事框架不变，只强化技法运用

请输出润色后的完整细纲。`;

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

请输出强化后的完整细纲。`;

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

    // ===== AI打磨对话 (深度注入融合上下文) =====
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
        const contextPrompt = `[你是一位资深小说策划，精通融合技法，正在帮助作者打磨大纲]\n\n${fusionCtx ? '[融合技法参考]\n' + fusionCtx.slice(0, 2000) + '\n\n' : ''}[当前大纲]\n${outline.slice(0,4000)}\n\n[作者要求]\n${txt}\n\n请根据作者要求修改或建议。如果需要修改大纲，请输出修改后的完整段落。可以引用融合技法中的具体套路来支撑你的建议。`;
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
            prompt = `[你是一位资深小说策划，精通网文套路]\n\n${fusionCtx ? '[融合技法参考]\n' + fusionCtx.slice(0, 800) + '\n\n' : ''}[当前大纲上下文]\n${outline.slice(Math.max(0, selStart - 500), selEnd + 500)}\n\n[待修改片段]\n${selected}\n\n[作者要求]\n${txt}\n\n请直接输出替换后的新片段（只输出替换内容，不要输出上下文）。如果要求删除，请输出空字符串表示删除。`;
        } else {
            // 全局建议模式
            prompt = `[你是一位资深小说策划，精通网文套路和融合技法]\n\n${fusionCtx ? '[融合技法参考]\n' + fusionCtx.slice(0, 1500) + '\n\n' : ''}[当前大纲]\n${outline.slice(0,3000)}\n\n[作者要求]\n${txt}\n\n请直接输出修改后的相关段落，不要开场白。如果要求不涉及大纲修改，给出建议即可。`;
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
            expand: '扩写以下片段，增加细节、冲突和感官描写，让情节更饱满',
            trim: '精简以下片段，删除冗余描述，保留核心冲突和爽点',
            hook: '强化以下片段的悬念钩子，在结尾处增加让读者忍不住想看下一章的吸引力',
            cool: '在以下片段中增加爽点设计（装逼打脸/实力碾压/收获/突破/众人震惊）',
            delete: '删除以下片段（请直接输出空字符串）'
        };

        const log = document.getElementById('ph-inline-chat-log');
        if (log) {
            log.innerHTML += `<div class="p-1.5 bg-accent/10 rounded border border-accent/20"><span class="text-accent font-bold text-[9px]">你</span><div class="text-gray-200 mt-0.5 text-[10px]">[快捷] ${instructions[action]}</div></div>`;
        }

        const outline = editor.value;
        const prompt = `[你是一位资深小说策划]\n\n[当前大纲上下文]\n${outline.slice(Math.max(0, selStart - 300), selEnd + 300)}\n\n[待修改片段]\n${selected}\n\n[要求]\n${instructions[action]}\n\n请直接输出替换后的新片段（只输出替换内容，不要输出上下文）。`;

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
            case 'expand': task = '扩写'; instruction = '把当前最后一卷或最短的卷扩写，每章情节描述增加到150字以上，增加细节和冲突'; break;
            case 'hook': task = '加钩子'; instruction = '为每章结尾添加或强化悬念钩子，确保读者忍不住想看下一章'; break;
            case 'cool': task = '加爽点'; instruction = '在合适的位置增加爽点设计（装逼打脸/实力碾压/收获/突破），每章至少一个'; break;
            case 'trim': task = '精简'; instruction = '删除冗余描述，精简情节，保留核心冲突和爽点，让大纲更紧凑'; break;
            case 'custom':
                const custom = prompt('输入你的优化要求：');
                if (!custom) return;
                task = '自定义优化'; instruction = custom;
                break;
        }
        const prompt = `[小说大纲${task}]\n\n${fusionCtx ? '[融合技法参考]\n' + fusionCtx.slice(0, 1500) + '\n\n' : ''}[当前大纲]\n${outline.slice(0,4000)}\n\n[优化要求]\n${instruction}\n\n请直接输出优化后的完整大纲，保持原有格式（##卷名 / ###章名 / **情节** / **看点**）。`;
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
