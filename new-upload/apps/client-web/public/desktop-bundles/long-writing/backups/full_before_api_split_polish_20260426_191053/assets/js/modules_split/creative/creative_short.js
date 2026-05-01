Object.assign(Modules.creative_studio, {
    // ═══ 短篇快写方法 ═══

    _isShortWriting: false,

    _showProducing(text) {
        const el = document.getElementById('cs-sw-producing');
        const textEl = document.getElementById('cs-sw-producing-text');
        const wcEl = document.getElementById('cs-sw-producing-wc');
        if (el) el.classList.remove('hidden');
        if (textEl) textEl.textContent = text || '正在创作...';
        if (wcEl) wcEl.textContent = '0字';
    },

    _hideProducing() {
        const el = document.getElementById('cs-sw-producing');
        if (el) el.classList.add('hidden');
    },

    _updateProducingWC(text) {
        const wcEl = document.getElementById('cs-sw-producing-wc');
        if (wcEl) wcEl.textContent = this._countChineseChars(text) + '字';
    },

    _countChineseChars(text) {
        if (!text) return 0;
        // 中文字符 + 英文单词（按空格分割）+ 数字
        const cn = (text.match(/[\u4e00-\u9fff]/g) || []).length;
        const en = (text.match(/[a-zA-Z]+/g) || []).length;
        const num = (text.match(/\d+/g) || []).length;
        return cn + en + num;
    },

    async _aiShortOutline() {
        const title = (document.getElementById('cs-sw-title') || {}).value || '未命名';
        const genre = (document.getElementById('cs-sw-genre') || {}).value || '短篇';
        const target = this.shortDraft.wordTarget || 3000;
        const synopsis = (document.getElementById('cs-sw-synopsis') || {}).value || '';
        const custom = this._getPrompt('quickwrite', '');

        const basePrompt = `你执行《叙事工程·元系统》自动化写作引擎（第六部分，逐章L1-L5强制执行）。

【系统初始化】
- 短篇(SHORT)：8000-30000字，每章1600-1800字，第一人称「」独立成段
- 黄金螺旋：拉阶段(5%)→扯阶段(75%)→放阶段(15%)→收阶段(剩余)

【视角锁定（L1铁律）】
- 第一人称：全文使用"我"，强制删除"我知道/我感到/我看到自己/我意识到"
- 心理活动直接表达，不加过滤词

【逐句规则（分级执行）】
1. 比喻：禁止陈旧比喻（像刀/阳光/风/水/火/石头），新颖比喻≤2/千字
2. 句长：单句≤25字，段落≤5行（约60字），短句(≤10字)比例≥30%
3. 情绪：禁止直接写情绪词而不加动作/感官（如"他很愤怒"）
4. 感官：每章至少2种感官描写（视/听/嗅/触/味）
5. 虚词：禁止"似乎/仿佛/好像"用于模糊描述
6. 解释癖：禁止"这不是…而是…/不是因为…恰恰因为…/这意味着…/换句话说…/其实…"
7. 共情锚点：每章至少1个

【共情锚点池】
焦躁：他第无数次按亮手机屏幕，又按灭。时间只过去三分钟。
委屈：她想解释，嘴巴张开又合上。说什么都没用。
失去：她习惯性地拿起手机，想给他发消息。打到一半，删了。
强撑：她深吸一口气，扯出一个笑。笑得太用力了。
绝望：他就那么坐着，一动不动。窗户外的天黑了又亮。

【鲜活度评分】
10分=经典级，8-9分=明显鲜活，6-7分=有亮点，4-5分=机械感强需修正，0-3分=严重不达标。

【任务】请为以下短篇小说生成详细大纲：`;

        const prompt = (custom ? custom + '\n\n' : basePrompt + '\n\n') +
            `标题：${title}\n类型：${genre}\n目标字数：${target}字` +
            (synopsis ? `\n\n【简介梗概】\n${synopsis}\n\n请根据以上梗概，扩写为详细大纲。` : '') +
            `\n\n要求：
1. 包含开端(拉)、发展(扯)、高潮(放)、结局(收)四个阶段
2. 每个阶段标注预计字数分配
3. 明确主要角色和核心冲突
4. 标注情绪曲线走向（使用情绪链：期待→紧张→恍然大悟→极致爽/不安→反复揪心→崩溃→心碎等）
5. 结局要有余韵
6. 每个阶段至少1个共情锚点`;

        const el = document.getElementById('cs-sw-outline');
        if (!el) return;
        el.value = '生成中...';
        this._showProducing('正在生成大纲...');
        try {
            let res = '';
            await AI.generate(prompt, {}, c => { res += c; el.value = res; this._updateProducingWC(res); });
            this.shortDraft.outline = res;
            UI.toast('大纲生成完成');
        } catch (e) {
            el.value = '生成失败: ' + (e.message || e);
            UI.toast('大纲生成失败', 'error');
        } finally {
            this._hideProducing();
        }
    },

    async _aiShortWrite() {
        const d = this.shortDraft;
        const outline = (document.getElementById('cs-sw-outline') || {}).value;
        if (!outline || outline === '生成中...') return UI.toast('请先生成或填写大纲');

        const title = (document.getElementById('cs-sw-title') || {}).value || '';
        const genre = (document.getElementById('cs-sw-genre') || {}).value || '';
        const target = d.wordTarget || 3000;
        const style = (document.getElementById('cs-sw-style') || {}).value || 'default';
        const pov = (document.getElementById('cs-sw-pov') || {}).value || 'first';

        let fusionCtx = '';
        const FB = Modules.fusion_book;
        if (FB) {
            const allPr = FB._allPipelineResults || {};
            const pr = FB._pipelineResults || {};
            const fusion = (allPr.fusion && allPr.fusion.trim()) ? allPr.fusion : (pr.fusion || '');
            if (fusion) fusionCtx = '\n\n[融合技法参考(请运用这些技法)]\n' + fusion.slice(0, 1500);
        }

        const custom = this._getPrompt('quickwrite', '');
        const basePrompt = `你执行《叙事工程·元系统》自动化写作引擎（第六部分，逐章L1-L5强制执行）。

【L1铁律（违反即重写）】
- 视角锁死：${pov === 'first' ? '第一人称"我"，禁止"我知道/我感到/我意识到"等过滤词' : pov === 'third' ? '第三人称全知视角，可切换但每段必须锁定一个视角' : '多视角切换，每次切换必须有明确的视角标记'}
- 禁解释癖：禁止"这不是…而是…/换句话说…/其实…"
- 禁情绪标签：不写"他很愤怒"，必须动作/环境/对话呈现
- 禁连续长句：单句≤25字，段落≤5行
- 对话格式：「」独立成段
- 对话功能化：推进剧情/塑造性格/埋伏笔/制造情绪，否则删除
- 开篇100字：必须是动作或对话，禁环境/背景/独白

【L2建议】
- 比喻密度≤3/1000字，禁止陈旧比喻（像刀/阳光/风/水/火/石头）
- 短句(≤10字)比例≥30%
- 每章至少2种感官描写
- 每章至少1个共情锚点
- 每章结尾有悬念

【写作风格】${style === 'default' ? '标准网文叙事风格，节奏紧凑' : style === 'literary' ? '文艺细腻，注重心理描写和意象运用' : style === 'humorous' ? '幽默诙谐，轻松有趣的笔调' : style === 'suspense' ? '悬疑紧张，节奏紧凑，伏笔密集' : style === 'passionate' ? '热血激昂，情感充沛' : '温馨治愈，温暖人心的笔调'}

【共情锚点池】
焦躁：他第无数次按亮手机屏幕，又按灭。时间只过去三分钟。
委屈：她想解释，嘴巴张开又合上。说什么都没用。
失去：她习惯性地拿起手机，想给他发消息。打到一半，删了。
强撑：她深吸一口气，扯出一个笑。笑得太用力了。
绝望：他就那么坐着，一动不动。窗户外的天黑了又亮。
甜蜜：他偷偷看了她一眼。她正好也看过来。两个人同时移开目光。

【案例学习参考】
- 海明威《白象似的群山》：用物象（甘草）传递情绪，而非直接陈述
- 张爱玲《倾城之恋》：简短重复对话制造潜台词
- 鲁迅《药》：细微动作传递阶级质感（"抖抖的装入衣袋，又在外面按了两下"）
- 余华《活着》：环境与人物状态错位（阳光很好+人老）

【任务】请根据以下大纲创作完整的短篇小说正文。必须达到目标字数，差一个字都不算完成：`;

        const el = document.getElementById('cs-sw-content');
        if (!el) return;

        this._isShortWriting = true;
        el.value = '';
        this._showProducing('正在创作正文...');

        let fullContent = '';
        let retryCount = 0;
        const maxRetries = 3;

        try {
            while (retryCount <= maxRetries) {
                const currentLen = this._countChineseChars(fullContent);
                const remaining = target - currentLen;

                if (currentLen >= target * 0.95) break; // 达到95%即算完成

                let prompt;
                if (retryCount === 0) {
                    // 首次创作
                    prompt = (custom ? custom + '\n\n' : basePrompt + '\n\n') +
                        `标题：${title}\n类型：${genre}\n目标字数：${target}字\n\n[大纲]\n${outline}${fusionCtx}\n\n要求：\n1. 严格执行L1铁律和L2建议\n2. 对话自然有潜台词，人物鲜活有癖好/缺陷\n3. 场景描写有画面感，每章至少2种感官\n4. 严格按照大纲情节走向，使用黄金螺旋节奏\n5. 必须达到${target}字，当前需要写满${target}字\n6. 每个关键场景至少1个共情锚点\n7. 禁止在文末写"全文完"或总结性语句`;
                } else {
                    // 续写补充
                    prompt = `你执行《叙事工程·元系统》续写补充协议。

【续写要求】
1. 从以下断点处无缝续写，保持文风、视角、节奏完全一致
2. 当前已写${currentLen}字，目标${target}字，还需补充约${remaining}字
3. 继续按照大纲情节推进，不要跳过大纲中的任何阶段
4. 严格执行L1铁律：视角锁死、禁解释癖、禁情绪标签、单句≤25字
5. 不要重复已写过的内容，直接从新的情节点开始
6. 禁止在文末写"全文完"或总结性语句

【大纲参考（续写部分）】
${outline}\n\n【已写正文（最后1500字）】
${fullContent.slice(-1500)}\n\n请续写约${Math.min(remaining, 3000)}字，使总字数接近${target}字。`;
                }

                if (retryCount > 0) {
                    this._showProducing(`字数不足，正在第${retryCount}次续写补充...`);
                }

                let chunkRes = '';
                await AI.generate(prompt, {}, c => {
                    chunkRes += c;
                    el.value = fullContent + chunkRes;
                    this._updateProducingWC(fullContent + chunkRes);
                    this._updateWC();
                    // 滚动到底部
                    el.scrollTop = el.scrollHeight;
                });

                fullContent += chunkRes;
                retryCount++;
            }

            this.shortDraft.content = fullContent;
            this._updateWC();

            const finalLen = this._countChineseChars(fullContent);
            if (finalLen < target * 0.9) {
                UI.toast(`创作完成，但字数仅${finalLen}字，未达目标${target}字`, 'warning');
            } else {
                UI.toast(`短篇创作完成！共${finalLen}字`);
            }
        } catch (e) {
            if (fullContent) {
                el.value = fullContent;
                this.shortDraft.content = fullContent;
                UI.toast('创作中断，已保存已生成内容', 'warning');
            } else {
                el.value = '创作失败: ' + (e.message || e);
                UI.toast('创作失败', 'error');
            }
        } finally {
            this._isShortWriting = false;
            this._hideProducing();
        }
    },

    async _aiShortContinue() {
        const el = document.getElementById('cs-sw-content');
        const current = el ? el.value : '';
        if (!current || current.length < 20) return UI.toast('请先写一些内容');
        const outline = (document.getElementById('cs-sw-outline') || {}).value || '';
        const target = this.shortDraft.wordTarget || 3000;
        const custom = this._getPrompt('quickwrite', '');

        const basePrompt = `你执行《叙事工程·元系统》续写协议。L1铁律必须遵守：视角锁死、禁解释癖、禁情绪标签、单句≤25字、段落≤5行。

【续写规则】
1. 从断点处无缝续写，保持文风一致
2. 严格保持视角一致性，禁止描写他人内心
3. 每段至少1个感官细节或动作描写
4. 对话必须有功能（推进剧情/塑造性格/埋伏笔/制造情绪）
5. 结尾留悬念或钩子`;

        const prompt = (custom ? custom + '\n\n' : basePrompt + '\n\n') +
            `[续写任务]\n\n${outline ? '[大纲参考]\n' + outline.slice(0, 800) + '\n\n' : ''}[已有正文(最后部分)]\n...${current.slice(-1500)}\n\n请从断点处无缝续写，保持文风一致，情节紧凑，约800-1200字。严格遵循L1铁律。`;

        this._showProducing('正在续写...');
        try {
            let res = '';
            await AI.generate(prompt, {}, c => {
                res += c;
                el.value = current + res;
                this._updateProducingWC(current + res);
                this._updateWC();
                el.scrollTop = el.scrollHeight;
            });
            this.shortDraft.content = el.value;
            this._updateWC();
            UI.toast('续写完成');
        } catch (e) {
            UI.toast('续写失败: ' + (e.message || e));
        } finally {
            this._hideProducing();
        }
    },

    async _aiShortPolish() {
        const el = document.getElementById('cs-sw-content');
        const content = el ? el.value : '';
        if (!content) return UI.toast('正文为空');
        const custom = this._getPrompt('quickwrite', '');
        const basePrompt = `你执行《叙事工程·元系统》鲜活度学习与自检协议（第七部分+L5强制）。

【润色即自检修正】
1. 逐章自检L1铁律：视角锁死、禁解释癖、禁情绪标签、句长≤25字
2. 逐章自检L2建议：比喻密度≤3/千字、短句比例≥30%、感官描写≥2种/章、共情锚点≥1个/章
3. 鲜活度评分（0-10分）：
   10分=经典级创造性突破，8-9分=明显鲜活瞬间，6-7分=有亮点不突出，4-5分=机械感强需修正，0-3分=严重不达标
4. 若某段鲜活度≤5分，参考以下案例手法重写（非抄袭，模仿技法模式）：
   - 海明威：用物象传递情绪（甘草=压抑）
   - 张爱玲：简短重复对话制造潜台词
   - 鲁迅：细微动作传递阶级质感
   - 余华：环境与人物状态错位
   - 杨绛：日常动作传递深情（剥橘子）

【润色要求】
1. 提升文笔质量和表现力
2. 优化对话的自然度和潜台词
3. 增强场景描写的画面感和感官细节
4. 保持原有情节和人物不变
5. 修正语病和逻辑问题
6. 删除所有"的"字长定语和模式化开头
7. 输出润色后的文本，并附【鲜活度评分】和【修正记录】`;

        const prompt = (custom ? custom + '\n\n' : basePrompt + '\n\n') + `请对以下短篇小说正文进行深度润色：\n\n${content.slice(0, 5000)}`;
        const original = content;
        this._showProducing('正在润色...');
        try {
            let res = '';
            await AI.generate(prompt, {}, c => {
                res += c;
                el.value = res;
                this._updateProducingWC(res);
            });
            this.shortDraft.content = res;
            this._updateWC();
            UI.toast('润色完成');
        } catch (e) {
            el.value = original;
            UI.toast('润色失败: ' + (e.message || e));
        } finally {
            this._hideProducing();
        }
    },

    // ═══ 批量写作任务队列 ═══
    _shortTasks: [],
    _shortActiveTaskId: null,

    _addShortTask() {
        const title = (document.getElementById('cs-sw-title') || {}).value || '';
        const genre = (document.getElementById('cs-sw-genre') || {}).value || '';
        const outline = (document.getElementById('cs-sw-outline') || {}).value || '';
        const content = (document.getElementById('cs-sw-content') || {}).value || '';
        if (!title && !outline) return UI.toast('请至少输入标题或大纲');
        const task = {
            id: 'st_' + Utils.uuid(),
            name: title || '未命名任务',
            genre: genre,
            outline: outline,
            content: content,
            status: 'pending',
            wordTarget: this.shortDraft.wordTarget || 3000
        };
        this._shortTasks.push(task);
        UI.toast(`任务「${task.name}」已加入队列 (${this._shortTasks.length})`);
        this.switchTab('quickwrite');
    },

    _removeShortTask(id) {
        this._shortTasks = this._shortTasks.filter(t => t.id !== id);
        this.switchTab('quickwrite');
    },

    _clearShortTasks() {
        this._shortTasks = [];
        this.switchTab('quickwrite');
    },

    async _runAllShortTasks() {
        const pending = this._shortTasks.filter(t => t.status !== 'done');
        if (!pending.length) return UI.toast('没有待执行的任务');
        UI.toast(`开始批量写作，共 ${pending.length} 个任务`);
        for (const task of pending) {
            task.status = 'running';
            this.switchTab('quickwrite');
            try {
                let outline = task.outline;
                if (!outline) {
                    const custom = this._getPrompt('quickwrite', '');
                    const basePrompt = `你执行《叙事工程·元系统》自动化写作引擎。请为以下短篇小说生成详细大纲：`;
                    const prompt = (custom ? custom + '\n\n' : basePrompt + '\n\n') + `标题：${task.name}\n类型：${task.genre || '短篇'}\n目标字数：${task.wordTarget}字\n\n要求：包含开端、发展、高潮、结局四个阶段，标注情绪曲线，每个阶段至少1个共情锚点。`;
                    let res = '';
                    await AI.generate(prompt, {}, c => { res += c; });
                    outline = res;
                    task.outline = outline;
                }
                const custom = this._getPrompt('quickwrite', '');
                const basePrompt = `你执行《叙事工程·元系统》自动化写作引擎。请根据以下大纲创作完整的短篇小说正文。L1铁律：视角锁死、禁解释癖、禁情绪标签、单句≤25字。L2建议：比喻密度≤3/千字、感官描写≥2种/章、共情锚点≥1个/章。`;
                const prompt = (custom ? custom + '\n\n' : basePrompt + '\n\n') + `标题：${task.name}\n类型：${task.genre || '短篇'}\n目标字数：${task.wordTarget}字\n\n[大纲]\n${outline}\n\n要求：严格执行L1铁律和L2建议，对话自然有潜台词，场景描写有画面感，字数接近${task.wordTarget}字。`;
                let res = '';
                await AI.generate(prompt, {}, c => { res += c; });
                task.content = res;
                task.status = 'done';
                const id = 'short_' + Utils.uuid();
                await DB.put('library_books', { id, name: task.name, content: res, size: res.length, date: new Date().toLocaleDateString(), type: 'short' });
                UI.toast(`「${task.name}」写作完成并已保存`);
            } catch (e) {
                task.status = 'error';
                UI.toast(`「${task.name}」写作失败: ${e.message}`, 'error');
            }
            this.switchTab('quickwrite');
        }
        UI.toast('批量写作任务全部完成');
    }
});

// 别名：兼容旧代码中 Modules.short 的引用
Modules.short = Modules.creative_studio;
