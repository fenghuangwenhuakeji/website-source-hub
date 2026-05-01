Object.assign(Modules.creative_studio, {
    async _fullAnalysis() {
        const input = (document.getElementById('cs-hot-input') || {}).value;
        if(!input) return UI.toast('请输入热梗或话题');
        const el = document.getElementById('cs-hot-result');
        if(!el) return;
        el.innerHTML = '<div class="text-red-400 animate-pulse"><i class="fa-solid fa-circle-notch fa-spin mr-1"></i>全维度分析中...</div>';
        const basePrompt = Modules.creative_studio._getPrompt('inspiration', `你执行《叙事工程·元系统》灵感中枢协议。

【系统总纲】
核心理念：规则是骨架，案例是血肉，自由是心跳，审判是镜鉴，鼓舞是火焰。
没有调研，不写一个字；没有案例，不落一笔。
执行优先级：L1铁律(0%自由)→L2建议(20%偏离)→L3选项(100%自由)→L4自由→L5案例学习。

【创作前审判与鼓舞】（每次启动必输出）
审判：你凭什么写？
你渴望写出让读者失眠的文字，却连自己都不敢直视。你害怕失败，害怕被嘲笑。这很正常。每一个真正写作的人，第一行字前都经历过这种恐惧。
重要的不是你写什么，而是你怎么写。你准备用什么细节让人物站立？用什么潜台词让对话呼吸？用什么反转让读者失眠？
被嘲笑的前提是被看见。被看见，就已经赢了那些不敢写的人。
你怕的，不过是自己不够好。但"不够好"不是罪，不写才是。

鼓舞：你可以写。
海明威的初稿也是垃圾，张爱玲的抽屉里堆满了废稿。写作不是天才的独舞，是凡人的攀爬。
你拥有整个案例库里的天才做老师。海明威教你简洁，张爱玲教你潜台词，余华教你冷峻，杨绛教你温情。
第一个字永远是最难的，但第二个字会容易一点。烂初稿好过空白文档。

【任务】请对用户提供的热点/话题进行全维度深度分析，包含：热梗核心拆解、市场趋势、读者画像、创新融合建议、爆款预测、实操建议。要求分析深入、有数据感、可操作性强。`);
        const prompt = `${basePrompt}\n\n【分析对象】${input}\n\n请输出完整分析报告，格式清晰。`;
        try {
            let res = '';
            await AI.generate(prompt, {}, c => { res += c; el.innerHTML = typeof marked !== 'undefined' ? marked.parse(res) : res; });
            UI.toast('全维度分析完成');
        } catch(e) {
            el.innerHTML = '<div class="text-red-400">分析失败: ' + (e.message || e) + '</div>';
        }
    },
    // ═══ 灵感引擎方法 ═══
    _selectQuickType(type) {
        this._selectedQuickType = type;
        const prompts = {
            idea: '生成一个打破常规认知的小说脑洞创意，要求新颖、有冲击力、有故事潜力',
            title: '生成5个极具吸引力的网文书名，涵盖不同类型，每个附带一句话卖点',
            twist: '生成一个让读者意想不到的情节反转，要求逻辑自洽且情感冲击力强',
            char: '生成一个性格极其矛盾但真实可信的角色设定，包含外在表现和内在动机',
            scene: '生成一个极具画面感和情感张力的经典场面描写，可直接用于小说',
            opening: '生成一个让读者无法放下的小说开头(300字)，要求3秒抓住注意力',
            custom: ''
        };
        this._selectedQuickPrompt = prompts[type] || '';
        // 重新渲染工作区以更新选中状态和按钮
        const ws = document.getElementById('cs-workspace');
        if(ws) ws.innerHTML = this._renderWorkspace();
    },

    _doQuickGen() {
        const type = this._selectedQuickType;
        if(!type) return UI.toast('请先选择灵感类型');
        let prompt = this._selectedQuickPrompt;
        if(type === 'custom') {
            prompt = this._customQuickPrompt;
            if(!prompt) return UI.toast('请输入自定义灵感提示词');
        }
        this._quickGen(type, prompt);
    },

    async _quickGen(type, promptText) {
        const el = document.getElementById('cs-result');
        if(!el) return;
        const batchCount = this._batchCount || 1;
        const deepMode = this._deepMode;
        const basePrompt = Modules.creative_studio._getPrompt('inspiration', `你执行《叙事工程·元系统》灵感生成协议。

【系统总纲】
核心理念：规则是骨架，案例是血肉，自由是心跳。
执行优先级：L1铁律→L2建议→L3选项→L4自由→L5案例学习。

【创作前审判与鼓舞】（每次启动必输出）
审判：你凭什么写？你不过是在键盘前坐立不安的凡人。你渴望写出让读者失眠的文字。重要的不是你写什么，而是你怎么写。
鼓舞：海明威的初稿也是垃圾，张爱玲的抽屉里堆满了废稿。你拥有整个案例库里的天才做老师。

【脑洞生成规则】
1. 每个创意必须反直觉、有画面感、避免陈词滥调
2. 必须具体，而非抽象概念
3. 必须有商业潜力（可延展为完整故事）
4. 优先使用"物象象征"传递情绪（参考海明威《白象似的群山》）
5. 对话必须有潜台词（参考张爱玲《倾城之恋》）

【锚点池】（可直接使用或改造）
焦躁：他第无数次按亮手机屏幕，又按灭。时间只过去三分钟。
委屈：她想解释，嘴巴张开又合上。说什么都没用。
失去：她习惯性地拿起手机，想给他发消息。打到一半，删了。
羞耻：脸烫得厉害。她低下头，恨不得消失。
强撑：她深吸一口气，扯出一个笑。笑得太用力了。
期待：脚步声在走廊响起。心跳漏了一拍。然后脚步声过去了。
绝望：他就那么坐着，一动不动。窗户外的天黑了又亮。
愤怒：他握紧拳头，指甲掐进掌心。血顺着指缝滴下来。
恐惧：后背贴着墙。不敢动。呼吸声在寂静里震耳欲聋。
甜蜜：他偷偷看了她一眼。她正好也看过来。两个人同时移开目光。`);
        let fullPrompt = `${basePrompt}\n\n【任务】${promptText}`;
        if (deepMode) {
            fullPrompt = `[深度创意模式]\n\n${promptText}\n\n请提供更详细、更有深度的创意内容，包括：\n1. 核心创意点\n2. 具体实现方式\n3. 可能的变化方向\n4. 与现有套路的差异化\n5. 目标读者群体`;
        }
        if (batchCount > 1) {
            fullPrompt += `\n\n请生成${batchCount}个不同的创意版本，每个版本用"---"分隔。`;
        }
        el.innerHTML = '<div class="text-yellow-400 animate-pulse"><i class="fa-solid fa-circle-notch fa-spin mr-1"></i>灵感生成中...</div>';
        try {
            let res = '';
            await AI.generate(fullPrompt, {}, c => { 
                res += c; 
                el.innerHTML = typeof marked !== 'undefined' ? marked.parse(res) : res; 
            });
            if (!res.trim()) {
                el.innerHTML = '<div class="text-dim">（无结果，请检查API配置）</div>';
            } else {
                UI.toast('灵感生成完成');
            }
        } catch(e) {
            el.innerHTML = '<div class="text-red-400"><i class="fa-solid fa-triangle-exclamation mr-1"></i>生成失败: ' + (e.message || e) + '</div>';
        }
    },
    
    _toggleDeepMode() {
        this._deepMode = !this._deepMode;
        this._refreshCommandStrip?.();
        UI.toast(this._deepMode ? '已开启深度模式' : '已关闭深度模式');
    },

    async _freeGen() {
        const input = (document.getElementById('cs-free-input') || {}).value;
        if(!input) return UI.toast('请输入关键词');
        const type = (document.getElementById('cs-free-type') || {}).value || 'idea';
        const genre = (document.getElementById('cs-free-genre') || {}).value;
        const typeMap = {
            idea:'生成一个新颖的小说脑洞创意', outline:'生成一份包含开端发展高潮结局的速写大纲',
            scene:'生成一段极具画面感的场景描写', dialogue:'生成一段精彩的角色对话',
            emotion:'生成一段情感渲染极强的文字', world:'补全世界观设定',
            ending:'生成一个出人意料的结局', conflict:'设计一个核心冲突'
        };
        const prompt = `${typeMap[type] || '生成创意'}。\n关键词/主题：${input}${genre ? '\n类型：' + genre : ''}\n\n要求：具体、生动、有细节、可直接用于创作。`;
        await this._quickGen(type, prompt);
    },
    // ═══ 热点分析方法 ═══
    async _analyzeHot() {
        const input = (document.getElementById('cs-hot-input') || {}).value;
        if(!input) return UI.toast('请输入热梗或话题');
        const mode = (document.getElementById('cs-hot-mode') || {}).value || 'trope';
        const modePrompts = {
            trope: `深度拆解热梗【${input}】：\n1. 核心爽点结构（为什么读者爱看）\n2. 情绪价值分析（满足了什么心理需求）\n3. 经典套路拆解（常见的情节模板）\n4. 创新变体建议（如何在此基础上创新）\n5. 适合融合的其他元素\n6. 目标读者画像`,
            market: `分析【${input}】的市场趋势：\n1. 当前热度和发展阶段（上升期/成熟期/衰退期）\n2. 头部作品分析（代表作及其成功原因）\n3. 读者需求变化趋势\n4. 竞争格局和差异化机会\n5. 未来发展预测\n6. 新人入场建议`,
            reader: `分析【${input}】的读者心理：\n1. 核心受众画像（年龄、性别、阅读习惯）\n2. 深层心理需求（代入感、补偿心理、情感投射）\n3. 爽点触发机制\n4. 弃书雷点分析\n5. 付费意愿驱动因素\n6. 社交传播动机`,
            innovate: `基于【${input}】的创新融合建议：\n1. 可融合的其他热门元素（至少5个方向）\n2. 每个融合方向的具体创意\n3. 差异化卖点设计\n4. 风险评估和规避建议\n5. 推荐的故事框架\n6. 开篇钩子设计`
        };
        const prompt = modePrompts[mode];
        const el = document.getElementById('cs-hot-result');
        if(!el) return;
        el.innerHTML = '<div class="text-red-400 animate-pulse"><i class="fa-solid fa-circle-notch fa-spin mr-1"></i>分析中...</div>';
        try {
            let res = '';
            await AI.generate(prompt, {}, c => { res += c; el.innerHTML = typeof marked !== 'undefined' ? marked.parse(res) : res; });
            if (!res.trim()) el.innerHTML = '<div class="text-dim">（无结果，请检查API配置）</div>';
            else UI.toast('热点分析完成');
        } catch(e) {
            el.innerHTML = '<div class="text-red-400"><i class="fa-solid fa-triangle-exclamation mr-1"></i>分析失败: ' + (e.message || e) + '</div>';
        }
    },

    _hotToPool() {
        const content = (document.getElementById('cs-hot-result') || {}).innerText;
        if(!content) return UI.toast('无内容');
        const input = (document.getElementById('cs-hot-input') || {}).value || '热点';
        this.ideaPool.push({ id: Utils.uuid(), title: '热点_' + input, content: content.slice(0, 500), type: 'hotspot', ts: Date.now() });
        DB.put('settings', { id: 'idea_pool', items: this.ideaPool });
        UI.toast('已存入灵感池');
    },
});
