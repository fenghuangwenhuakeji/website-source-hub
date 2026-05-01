// creative_generators.js — 生成器广场 (Generator Plaza)
// 对标: 白梦写作 10+生成器 / 星月写作 创意工具箱
// 12+专业生成器，覆盖小说创作全要素
Object.assign(Modules.creative_studio, {
    _generatorHistory: [],
    _currentGenerator: 'title',
    _genResult: '',

    _renderGeneratorsTab() {
        const gens = [
            { id: 'title', icon: 'fa-heading', label: '书名生成', desc: '吸睛书名+一句话卖点', color: 'amber' },
            { id: 'intro', icon: 'fa-align-left', label: '简介生成', desc: '简介+核心卖点', color: 'blue' },
            { id: 'character', icon: 'fa-user-secret', label: '人设卡', desc: '立体角色设定', color: 'green' },
            { id: 'scene', icon: 'fa-mountain-sun', label: '场景设计', desc: '沉浸式场景描写', color: 'cyan' },
            { id: 'prop', icon: 'fa-gem', label: '道具设计', desc: '有故事的道具', color: 'purple' },
            { id: 'goldenfinger', icon: 'fa-hand-sparkles', label: '金手指', desc: '独特能力/系统', color: 'yellow' },
            { id: 'dialogue', icon: 'fa-comments', label: '对话生成', desc: '精彩对话片段', color: 'pink' },
            { id: 'chapter_title', icon: 'fa-list-ol', label: '章节标题', desc: '悬念章节名', color: 'orange' },
            { id: 'opening', icon: 'fa-door-open', label: '黄金开篇', desc: '开篇300字', color: 'red' },
            { id: 'climax', icon: 'fa-fire', label: '爽点设计', desc: '爽点/高潮设计', color: 'rose' },
            { id: 'conflict', icon: 'fa-bolt', label: '冲突设计', desc: '多层冲突', color: 'indigo' },
            { id: 'foreshadow', icon: 'fa-seedling', label: '伏笔设计', desc: '前后呼应', color: 'emerald' }
        ];
        const current = gens.find(g => g.id === this._currentGenerator) || gens[0];
        return `
        <div class="flex flex-col h-full overflow-hidden">
            <div class="shrink-0 p-4 border-b border-white/5 bg-gradient-to-r from-amber-900/20 to-transparent">
                <div class="flex items-center gap-2 mb-1">
                    <i class="fa-solid fa-shapes text-amber-400"></i>
                    <span class="font-bold text-white text-sm">生成器广场</span>
                    <span class="text-[9px] text-dim bg-white/5 px-1.5 py-0.5 rounded">12款</span>
                </div>
                <div class="flex items-center justify-between">
                    <div class="text-[10px] text-dim">从灵感到成稿，覆盖小说创作全要素的专业生成器</div>
                    ${Modules.creative_studio._renderPromptEditButton('generators','生成器广场')}
                </div>
            </div>
            <div class="flex-1 flex min-h-0">
                <!-- 生成器列表 -->
                <div class="w-56 shrink-0 flex flex-col border-r border-white/5 p-2 gap-1 overflow-y-auto">
                    ${gens.map(g => `
                        <button class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-[11px] transition-all ${this._currentGenerator===g.id ? 'bg-white/10 text-white border border-white/10' : 'text-dim hover:bg-white/5 border border-transparent'}"
                            onclick="Modules.creative_studio._switchGenerator('${g.id}')">
                            <div class="w-7 h-7 rounded-md bg-${g.color}-500/15 flex center shrink-0">
                                <i class="fa-solid ${g.icon} text-${g.color}-400 text-[10px]"></i>
                            </div>
                            <div>
                                <div class="font-bold">${g.label}</div>
                                <div class="text-[9px] text-dim">${g.desc}</div>
                            </div>
                        </button>
                    `).join('')}
                </div>
                <!-- 工作区 -->
                <div class="flex-1 flex flex-col p-4 gap-3 overflow-y-auto">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 rounded-lg bg-${current.color}-500/15 flex center">
                                <i class="fa-solid ${current.icon} text-${current.color}-400 text-xs"></i>
                            </div>
                            <div>
                                <div class="font-bold text-white text-sm">${current.label}</div>
                                <div class="text-[10px] text-dim">${current.desc}</div>
                            </div>
                        </div>
                        ${Modules.creative_studio._renderPromptEditButton('generator_' + current.id, current.label + '生成器')}
                    </div>
                    <div id="cs-gen-input-area" class="space-y-2">
                        ${this._renderGeneratorInputs(current.id)}
                    </div>
                    <button class="btn bg-${current.color}-600/20 text-${current.color}-400 border-${current.color}-600/30 hover:bg-${current.color}-600/30 font-bold text-xs py-2.5 rounded-xl" onclick="Modules.creative_studio._runGenerator('${current.id}')">
                        <i class="fa-solid fa-wand-magic-sparkles mr-1"></i>一键生成
                    </button>
                    <div id="cs-gen-result" class="flex-1 min-h-[200px] bg-[#0a0a0c] border border-white/10 rounded-lg p-3 text-xs text-main overflow-y-auto"></div>
                    <div class="flex gap-2 justify-end">
                        <button class="text-[10px] text-dim hover:text-white transition px-2 py-1" onclick="Modules.creative_studio._copyGenResult()"><i class="fa-solid fa-copy mr-1"></i>复制</button>
                        <button class="text-[10px] text-dim hover:text-white transition px-2 py-1" onclick="Modules.creative_studio._saveGenResult()"><i class="fa-solid fa-save mr-1"></i>保存</button>
                        <button class="text-[10px] text-dim hover:text-white transition px-2 py-1" onclick="Modules.creative_studio._insertToProject()"><i class="fa-solid fa-file-import mr-1"></i>插入项目</button>
                    </div>
                </div>
            </div>
        </div>`;
    },

    _switchGenerator(id) {
        this._currentGenerator = id;
        this.switchTab('generators');
    },

    _renderGeneratorInputs(id) {
        const inputs = {
            title: `<label class="text-[10px] text-dim">类型/关键词</label><input id="cs-gen-input" class="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-xs text-main focus:border-amber-500/50 focus:outline-none" placeholder="如：仙侠复仇、都市赘婿、科幻末日...">`,
            intro: `<label class="text-[10px] text-dim">书名+核心设定</label><input id="cs-gen-input" class="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-xs text-main focus:border-blue-500/50 focus:outline-none" placeholder="如：《逆天邪神》，废柴觉醒上古血脉...">`,
            character: `<label class="text-[10px] text-dim">角色定位</label><input id="cs-gen-input" class="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-xs text-main focus:border-green-500/50 focus:outline-none" placeholder="如：表面懦弱实则隐忍的赘婿、冷酷仙尊...">`,
            scene: `<label class="text-[10px] text-dim">场景类型</label><input id="cs-gen-input" class="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-xs text-main focus:border-cyan-500/50 focus:outline-none" placeholder="如：雨夜古庙、赛博朋克街道、宗门大殿...">`,
            prop: `<label class="text-[10px] text-dim">道具背景</label><input id="cs-gen-input" class="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-xs text-main focus:border-purple-500/50 focus:outline-none" placeholder="如：祖传玉佩、系统奖励、秘境中获得...">`,
            goldenfinger: `<label class="text-[10px] text-dim">世界观/类型</label><input id="cs-gen-input" class="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-xs text-main focus:border-yellow-500/50 focus:outline-none" placeholder="如：修仙界、末日废土、现代都市...">`,
            dialogue: `<label class="text-[10px] text-dim">对话场景</label><input id="cs-gen-input" class="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-xs text-main focus:border-pink-500/50 focus:outline-none" placeholder="如：分手对峙、宗门审判、夫妻吵架...">`,
            chapter_title: `<label class="text-[10px] text-dim">章节内容概括</label><input id="cs-gen-input" class="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-xs text-main focus:border-orange-500/50 focus:outline-none" placeholder="如：主角被退婚，觉醒金手指反打脸...">`,
            opening: `<label class="text-[10px] text-dim">作品类型+核心梗</label><input id="cs-gen-input" class="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-xs text-main focus:border-red-500/50 focus:outline-none" placeholder="如：重生复仇、系统流、废柴逆袭...">`,
            climax: `<label class="text-[10px] text-dim">当前剧情节点</label><input id="cs-gen-input" class="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-xs text-main focus:border-rose-500/50 focus:outline-none" placeholder="如：宗门大比决赛、BOSS战前、真相揭露...">`,
            conflict: `<label class="text-[10px] text-dim">人物关系/背景</label><input id="cs-gen-input" class="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-xs text-main focus:border-indigo-500/50 focus:outline-none" placeholder="如：师徒反目、家族内斗、正邪对抗...">`,
            foreshadow: `<label class="text-[10px] text-dim">后文重大情节</label><input id="cs-gen-input" class="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-xs text-main focus:border-emerald-500/50 focus:outline-none" placeholder="如：第50章主角身世揭晓、反派其实是父亲...">`
        };
        return inputs[id] || inputs.title;
    },

    _getGeneratorPrompt(id, input) {
        const defaultBase = `你执行《叙事工程·元系统》生成器协议（第五部分脑洞生成+L2强制拆书案例库）。

【系统总纲】
核心理念：规则是骨架，案例是血肉。没有案例，不落一笔。

【标题生成公式】（按情绪基调匹配）
爽 = 身份反转+打脸：[卑微身份]+[其实是隐藏大佬]
虐 = 失去+后悔：[删除/离开]+[严重后果]
甜 = 反差+意外相遇：[平凡身份]+[与高地位者相遇]
悬疑 = 规则怪谈+异常：[诡异规则]+[违反后果]
复仇 = 极端行为+毁灭后果：[疯狂操作]+[彻底摧毁]

【情绪链选择】
爽-智商碾压：设局→收网→揭底→碾压（期待→紧张→恍然大悟→极致爽）
虐-绝望剥离：预警失灵→钝刀割肉→最后稻草→不可逆（不安→反复揪心→崩溃→心碎）
甜-追妻火葬场：相遇→心动→阻碍→双向奔赴（怦然→甜蜜→揪心→圆满）
悬疑-恐怖谷效应：日常裂痕→疯狂猜想→恐怖实锤→绝望敲门（不安→恐惧→震惊→绝望）
复仇-扮猪吃虎：隐忍→挑衅→局部暴露→全面碾压→终极反转（憋屈→愤怒→暗爽→炸裂→震撼）

【拆书案例参考】
海明威《白象似的群山》：用物象（甘草）传递情绪
张爱玲《倾城之恋》：简短重复对话制造潜台词
鲁迅《药》：细微动作传递阶级质感
余华《活着》：环境与人物状态错位
莫泊桑《项链》：反转前至少埋下三处不起眼的线索
杨绛《我们仨》：日常动作传递深情（剥橘子）

【L1铁律】
- 禁情绪标签：不写"他很愤怒"，必须动作/环境/对话呈现
- 禁解释癖：禁用"这意味着…/换句话说…/其实…"
- 禁连续长句：单句≤25字
- 对话必须有功能：推进剧情/塑造性格/埋伏笔/制造情绪

请根据用户需求生成高质量内容。`;
        const basePrompt = Modules.creative_studio._getPrompt('generator_' + id, defaultBase);
        const prompts = {
            title: `你是资深网文编辑，擅长为小说起爆款书名。请为以下类型/关键词生成10个极具吸引力的书名，每个书名附带一句话卖点和适合的流派标签。

类型/关键词: ${input}

要求：
- 书名要有画面感、冲突感或悬念感
- 避免过于俗套的名字
- 包含不同风格：直白爽文型、文艺悬念型、反差幽默型
- 每个书名控制在2-8个字

输出格式：
1. 《书名》— 卖点 — [流派标签]`,
            intro: `你是专业的小说简介写手。请为以下作品写一个让人欲罢不能的简介。

作品信息: ${input}

要求：
- 第一段：抛出核心悬念或冲突（50字内）
- 第二段：展开世界观/主角处境（100字内）
- 第三段：点明独特卖点/爽点（50字内）
- 总字数200-400字
- 每段末尾不要有"敬请期待"等套话
- 语言要有画面感和节奏感`,
            character: `你是角色塑造大师。请为以下角色定位创作一个立体的人设卡。

角色定位: ${input}

输出格式：
【姓名】
【外在标签】（3个关键词）
【核心矛盾】（内在冲突）
【表层性格】（外人看到的）
【深层动机】（真实的驱动力）
【语言习惯】（口头禅、说话方式）
【标志性动作】（1-2个小动作）
【秘密/弱点】（不能被外人知道的）
【与其他角色的潜在关系】`,
            scene: `你是场景描写专家。请为以下场景创作一段200-400字的沉浸式描写。

场景: ${input}

要求：
- 至少包含3种感官细节（视/听/嗅/触/味）
- 用环境烘托情绪，不要直接说"这里很压抑"
- 包含1-2个动态元素（风、水、光影变化等）
- 段落≤5行，长短句交替
- 禁止解释性语句`,
            prop: `你是道具设计专家。请为以下背景设计一个有故事的道具。

背景: ${input}

输出格式：
【道具名称】
【外观描述】（50-100字，具体细节）
【来历/传说】（100-150字）
【功能/能力】
【隐藏属性】（表面看不到的）
【与剧情的关联】（如何推动故事）
【情感象征】（代表什么主题）`,
            goldenfinger: `你是网文系统/金手指设计专家。请为以下世界观设计3个独特且逻辑自洽的金手指/能力。

世界观: ${input}

要求：
- 每个金手指要有限制条件（不能无敌）
- 要有升级空间
- 能与主角的性格/经历产生化学反应
- 避免过于常见的套路

输出格式（每个）：
【金手指名称】
【核心能力】
【限制条件】（至少2条）
【升级路径】
【与主角的化学反应】
【潜在剧情冲突点】`,
            dialogue: `你是对话写作专家。请为以下场景创作一段精彩的对话（500-1000字）。

场景: ${input}

要求：
- 对话要推动剧情或揭示人物关系
- 每个人物的说话方式要有辨识度
- 潜台词丰富（话里有话）
- 适当使用打断、沉默、动作穿插
- 避免"正确"的对白，要有烟火气
- 每句对话独立成段，用「」标注`,
            chapter_title: `你是章节标题专家。请为以下内容生成15个悬念感强的章节标题。

内容概括: ${input}

要求：
- 每个标题都要有悬念或冲突暗示
- 避免剧透关键情节
- 风格多样：直白型、诗意型、反差型
- 控制在2-12个字
- 禁止用"第一章""第二章"等编号`,
            opening: `你是开篇写作大师。请为以下类型创作一个300字左右的黄金开篇。

类型+核心梗: ${input}

要求：
- 开篇第一句必须有动作或对话（禁止环境描写开头）
- 前100字必须建立冲突或悬念
- 300字内让读者产生"我必须知道后面发生了什么"的感觉
- 段落≤5行，长短句交替
- 禁止解释背景（背景通过细节暗示）
- 禁止心理描写开头`,
            climax: `你是爽点/高潮设计专家。请为以下节点设计一个让读者拍案叫绝的高潮场景。

当前节点: ${input}

输出格式：
【高潮类型】（打脸/逆袭/揭秘/牺牲/对决/反转）
【情绪曲线】（前期压抑→中期蓄力→顶点释放→余韵）
【核心爽点设计】（具体怎么让读者爽）
【3层反转】（每层反转的内容和时机）
【读者预期管理】（如何利用读者预期制造惊喜）
【高潮场景描写】（300-500字的关键段落）`,
            conflict: `你是冲突设计专家。请为以下背景设计一个多层嵌套的冲突系统。

背景: ${input}

输出格式：
【表层冲突】（所有人都能看到的外部矛盾）
【中层冲突】（涉及核心人物关系的矛盾）
【深层冲突】（触及价值观/世界观的矛盾）
【个人内心冲突】（主角的心理矛盾）
【冲突升级路径】（如何从表层升级到深层）
【冲突解决代价】（解决冲突需要牺牲什么）
【未解决的余波】（即使解决也会留下的隐患）`,
            foreshadow: `你是伏笔设计大师。请在以下前文设计中巧妙埋设伏笔，为后文重大情节做铺垫。

后文重大情节: ${input}

要求：
- 设计5-8个不同层级的伏笔
- 有明伏笔（读者能注意到但不知道含义）
- 有暗伏笔（读者第一次读完全注意不到）
- 每个伏笔标注：埋设位置/回收位置/误导方向
- 伏笔之间要有呼应关系

输出格式（每个）：
【伏笔编号】
【埋设方式】（对话/物品/环境/ rumor等）
【前文呈现】（读者看到什么）
【真实含义】（后文揭示什么）
【误导方向】（读者可能误以为）
【回收时机】（第几章回收）`
        };
        return basePrompt + '\n\n' + (prompts[id] || prompts.title);
    },

    async _runGenerator(id) {
        const input = (document.getElementById('cs-gen-input') || {}).value || '';
        if (!input.trim()) return UI.toast('请输入生成条件');
        const resultEl = document.getElementById('cs-gen-result');
        if (resultEl) resultEl.innerHTML = '<div class="text-dim text-xs flex items-center gap-2"><i class="fa-solid fa-spinner fa-spin"></i>生成中...</div>';

        const prompt = this._getGeneratorPrompt(id, input);
        let result = '';
        try {
            await AI.generate(prompt, {}, chunk => {
                result += chunk;
                if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">${typeof marked !== 'undefined' ? marked.parse(result) : result}</div>`;
            });
            this._genResult = result;
            this._generatorHistory.push({ id: Utils.uuid(), type: id, input, result, time: new Date().toLocaleString() });
            UI.toast('生成完成 ✓', 'success');
        } catch(e) {
            UI.toast('生成失败: ' + e.message, 'error');
        }
    },

    _copyGenResult() {
        if (!this._genResult) return UI.toast('无内容可复制');
        navigator.clipboard.writeText(this._genResult).then(() => UI.toast('已复制到剪贴板'));
    },

    async _saveGenResult() {
        if (!this._genResult) return UI.toast('无内容可保存');
        const id = 'gen_' + Utils.uuid();
        await DB.put('library_books', { id, name: '生成_' + this._currentGenerator + '_' + new Date().toLocaleDateString(), content: this._genResult, size: this._genResult.length, date: new Date().toLocaleDateString(), type: 'generator' });
        UI.toast('已保存到阅读中心');
    },

    _insertToProject() {
        if (!this._genResult) return UI.toast('无内容可插入');
        // 尝试插入到当前活跃的写作器
        const editor = document.getElementById('w-editor');
        if (editor) {
            editor.value += '\n\n' + this._genResult + '\n';
            UI.toast('已插入到写作器');
        } else {
            UI.toast('请先打开写作器模块');
        }
    }
});
