// creative_deconstruct.js — 拆书工坊 (Deconstruction Workshop)
// 对标: 白梦写作 章节解析/拆书 + 星月写作 AI拆书
// 智能分析优秀小说结构，提取写作公式
Object.assign(Modules.creative_studio, {
    _deconResult: null,
    _deconMode: 'chapter', // chapter | batch

    _renderDeconstructTab() {
        return `
        <div class="flex flex-col h-full overflow-hidden">
            <div class="shrink-0 p-4 border-b border-white/5 bg-gradient-to-r from-violet-900/20 to-transparent">
                <div class="flex items-center gap-2 mb-1">
                    <i class="fa-solid fa-scissors text-violet-400"></i>
                    <span class="font-bold text-white text-sm">拆书工坊</span>
                    <span class="text-[9px] text-dim bg-white/5 px-1.5 py-0.5 rounded">v3.0</span>
                </div>
                <div class="flex items-center justify-between">
                    <div class="text-[10px] text-dim">智能拆解爆款小说，提取可复用的写作公式和创作技巧</div>
                    ${Modules.creative_studio._renderPromptEditButton('deconstruct','拆书工坊')}
                </div>
            </div>
            <div class="flex-1 flex min-h-0">
                <!-- 输入区 -->
                <div class="w-[45%] flex flex-col border-r border-white/5 p-4 gap-3">
                    <div class="flex items-center gap-2">
                        <button class="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${this._deconMode==='chapter' ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' : 'bg-white/5 text-dim hover:bg-white/10'}" onclick="Modules.creative_studio._setDeconMode('chapter')">单章拆书</button>
                        <button class="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${this._deconMode==='batch' ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' : 'bg-white/5 text-dim hover:bg-white/10'}" onclick="Modules.creative_studio._setDeconMode('batch')">多章批量</button>
                    </div>
                    <div class="flex items-center justify-between">
                        <label class="text-xs font-bold text-white">粘贴原文</label>
                        <button class="text-[10px] text-dim hover:text-white transition" onclick="Modules.creative_studio._pasteDecon()"><i class="fa-solid fa-paste mr-1"></i>粘贴</button>
                    </div>
                    <textarea id="cs-decon-input" class="flex-1 min-h-0 bg-[#0a0a0c] border border-white/10 rounded-lg p-3 text-xs text-main resize-none focus:border-violet-500/50 focus:outline-none" placeholder="粘贴爆款小说的章节内容（建议2000-5000字），AI将自动拆解其结构、节奏和写作技巧..."></textarea>
                    <div class="text-[10px] text-dim">
                        <i class="fa-solid fa-circle-info mr-1"></i>建议粘贴完整章节以获得最佳分析效果
                    </div>
                    <button class="btn bg-violet-600/20 text-violet-400 border-violet-600/30 hover:bg-violet-600/30 font-bold text-xs py-2.5 rounded-xl" onclick="Modules.creative_studio._runDeconstruct()">
                        <i class="fa-solid fa-wand-magic-sparkles mr-1"></i>开始拆解
                    </button>
                </div>
                <!-- 输出区 -->
                <div class="flex-1 flex flex-col p-4 gap-3 overflow-hidden">
                    <div class="flex items-center justify-between">
                        <label class="text-xs font-bold text-white">拆解报告</label>
                        <div class="flex gap-1">
                            <button class="text-[10px] text-dim hover:text-white transition px-2 py-1" onclick="Modules.creative_studio._copyDeconResult()"><i class="fa-solid fa-copy mr-1"></i>复制</button>
                            <button class="text-[10px] text-dim hover:text-white transition px-2 py-1" onclick="Modules.creative_studio._saveDeconResult()"><i class="fa-solid fa-save mr-1"></i>保存</button>
                            <button class="text-[10px] text-dim hover:text-white transition px-2 py-1" onclick="Modules.creative_studio._exportFormula()"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>提取公式</button>
                        </div>
                    </div>
                    <div id="cs-decon-result" class="flex-1 min-h-0 bg-[#0a0a0c] border border-white/10 rounded-lg p-3 text-xs text-main overflow-y-auto"></div>
                </div>
            </div>
        </div>`;
    },

    _setDeconMode(mode) {
        this._deconMode = mode;
        this.switchTab('deconstruct');
    },

    _pasteDecon() {
        navigator.clipboard.readText().then(t => {
            const el = document.getElementById('cs-decon-input');
            if (el) el.value = t;
        }).catch(() => UI.toast('无法读取剪贴板', 'error'));
    },

    async _runDeconstruct() {
        const input = (document.getElementById('cs-decon-input') || {}).value || '';
        if (!input.trim()) return UI.toast('请输入需要拆解的文本');
        if (input.length < 200) return UI.toast('文本太短，建议至少200字');
        const resultEl = document.getElementById('cs-decon-result');
        if (resultEl) resultEl.innerHTML = '<div class="text-dim text-xs flex items-center gap-2"><i class="fa-solid fa-spinner fa-spin"></i>AI深度拆解中，请稍候...</div>';

        const basePrompt = Modules.creative_studio._getPrompt('deconstruct', `你执行《叙事工程·元系统》拆书案例库协议（第四部分，L2强制建议）。

【系统总纲】
核心理念：没有案例，不落一笔。每章写作前必须调取相关案例学习。

【案例库结构】
每条案例包含：原文片段（标注出处）、作家/作品、技法标签、拆解分析（为什么鲜活）、可模仿的写作模式。

【核心案例库20则参考】
1. 海明威《白象似的群山》：情绪呈现、物象象征、对话重复——用甘草的重复传递无法言说的压抑
2. 张爱玲《倾城之恋》：潜台词、简短对话、重复句式——说A但读者听出B
3. 鲁迅《药》：意外细节、动作描写、阶级质感——"抖抖的装入衣袋，又在外面按了两下"
4. 余华《活着》：环境映心、重复、反衬——阳光很好+牛老、人老
5. 莫泊桑《项链》：反转、伏笔、代价——反转前至少埋下三处不起眼的线索
6. 杨绛《我们仨》：共情锚点、日常动作、深情——剥橘子一瓣一瓣递
7. 海明威《杀手》：零度叙事、紧张感、重复——用"不知道"的重复制造压抑
8. 太宰治《人间失格》：第一人称、内心独白、反常——直接、碎片、反逻辑

【分析维度】
一、结构拆解：开篇钩子、起承转合、段落节奏、章末钩子
二、爽点分析：类型/压抑字数/释放手法/密度分布
三、人设表现：行为逻辑、配角功能、对话质量（是否有潜台词）、关系变化
四、文笔特征：长短句比例、描写风格、信息密度、情绪渲染手法
五、鲜活度评分（0-10分）：
  10分=经典级创造性突破，8-9分=明显鲜活瞬间，6-7分=有亮点不突出，4-5分=机械感强需修正，0-3分=严重不达标
六、可复用公式：填空式模板+适用题材+使用禁忌`);

        const prompt = `${basePrompt}

【原文】
${input.slice(0, 6000)}

请用中文输出完整分析报告，格式清晰，有层次感。`;

        let result = '';
        try {
            await AI.generate(prompt, {}, chunk => {
                result += chunk;
                if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">${typeof marked !== 'undefined' ? marked.parse(result) : result}</div>`;
            });
            this._deconResult = result;
            UI.toast('拆解完成 ✓', 'success');
        } catch(e) {
            UI.toast('拆解失败: ' + e.message, 'error');
        }
    },

    _copyDeconResult() {
        if (!this._deconResult) return UI.toast('无内容可复制');
        navigator.clipboard.writeText(this._deconResult).then(() => UI.toast('已复制到剪贴板'));
    },

    async _saveDeconResult() {
        if (!this._deconResult) return UI.toast('无内容可保存');
        const id = 'decon_' + Utils.uuid();
        await DB.put('library_books', { id, name: '拆书_' + new Date().toLocaleDateString(), content: this._deconResult, size: this._deconResult.length, date: new Date().toLocaleDateString(), type: 'deconstruct' });
        UI.toast('已保存到阅读中心');
    },

    async _exportFormula() {
        if (!this._deconResult) return UI.toast('请先完成拆书分析');
        const resultEl = document.getElementById('cs-decon-result');
        if (resultEl) resultEl.innerHTML += '<div class="mt-4 p-3 bg-violet-500/10 border border-violet-500/20 rounded-lg text-[10px] text-violet-300"><i class="fa-solid fa-spinner fa-spin mr-1"></i>正在提取可复用公式...</div>';

        const prompt = `基于以上拆书分析报告，请提取一个最核心、最可复用的"写作公式"。

要求：
1. 用填空式模板表达（如：【钩子】→【压抑X字】→【转折】→【爽点释放】→【钩子】）
2. 标注每个步骤的字数比例
3. 给出3个不同题材的应用示例
4. 列出使用这个公式的禁忌（什么情况不能用）

输出格式：
【公式名称】
【适用题材】
【公式模板】
【字数比例】
【应用示例1】
【应用示例2】
【应用示例3】
【使用禁忌】`;

        let result = '';
        try {
            await AI.generate(prompt, {}, chunk => { result += chunk; });
            if (resultEl) {
                resultEl.innerHTML = resultEl.innerHTML.replace(/<div class="mt-4 p-3 bg-violet-500\/10[^]*?<\/div>/, '');
                resultEl.innerHTML += `<div class="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg"><div class="text-xs font-bold text-emerald-400 mb-2"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>可复用写作公式</div><div class="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">${typeof marked !== 'undefined' ? marked.parse(result) : result}</div></div>`;
            }
            UI.toast('公式提取完成 ✓', 'success');
        } catch(e) {
            UI.toast('公式提取失败', 'error');
        }
    }
});
