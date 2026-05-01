// creative_deai.js — AI消痕引擎 (De-AI Engine)
// 对标: 白梦写作 AI消痕功能
// 去除AI生成内容的机械感，降低AI检测率
Object.assign(Modules.creative_studio, {
    _deaiIntensity: 'medium', // light | medium | strong
    _deaiResult: '',
    _deaiOriginal: '',
    _deaiStats: { aiScoreBefore: 0, aiScoreAfter: 0, changes: 0 },

    _renderDeaiTab() {
        const intensities = [
            { id: 'light', label: '轻度', desc: '微调句式，保留原意', color: 'blue' },
            { id: 'medium', label: '中度', desc: '打乱结构，口语化', color: 'amber' },
            { id: 'strong', label: '强力', desc: '深度重构，风格变异', color: 'rose' }
        ];
        return `
        <div class="flex flex-col h-full overflow-hidden">
            <div class="shrink-0 p-4 border-b border-white/5 bg-gradient-to-r from-emerald-900/20 to-transparent">
                <div class="flex items-center gap-2 mb-1">
                    <i class="fa-solid fa-eraser text-emerald-400"></i>
                    <span class="font-bold text-white text-sm">AI 消痕引擎</span>
                    <span class="text-[9px] text-dim bg-white/5 px-1.5 py-0.5 rounded">v3.0</span>
                </div>
                <div class="flex items-center justify-between">
                    <div class="text-[10px] text-dim">去除AI生成内容的机械感，让文字更具人文温度</div>
                    ${Modules.creative_studio._renderPromptEditButton('deai','AI消痕')}
                </div>
            </div>
            <div class="flex-1 flex min-h-0">
                <!-- 输入区 -->
                <div class="w-1/2 flex flex-col border-r border-white/5 p-4 gap-3">
                    <div class="flex items-center justify-between">
                        <label class="text-xs font-bold text-white">原始文本 <span class="text-dim font-normal">(AI生成内容)</span></label>
                        <button class="text-[10px] text-dim hover:text-white transition" onclick="Modules.creative_studio._pasteDeai()">
                            <i class="fa-solid fa-paste mr-1"></i>粘贴
                        </button>
                    </div>
                    <textarea id="cs-deai-input" class="flex-1 min-h-0 bg-[#0a0a0c] border border-white/10 rounded-lg p-3 text-xs text-main resize-none focus:border-emerald-500/50 focus:outline-none" placeholder="将AI生成的文本粘贴到这里，消痕引擎会去除机械感表达..."></textarea>
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] text-dim">消痕强度:</span>
                        ${intensities.map(i => `
                            <button class="px-2 py-1 rounded text-[10px] font-bold transition-all ${this._deaiIntensity===i.id ? 'bg-'+i.color+'-500/20 text-'+i.color+'-400 border border-'+i.color+'-500/30' : 'bg-white/5 text-dim hover:bg-white/10 border border-transparent'}"
                                onclick="Modules.creative_studio._setDeaiIntensity('${i.id}')">${i.label}</button>
                        `).join('')}
                    </div>
                    <button class="btn bg-emerald-600/20 text-emerald-400 border-emerald-600/30 hover:bg-emerald-600/30 font-bold text-xs py-2.5 rounded-xl" onclick="Modules.creative_studio._runDeai()">
                        <i class="fa-solid fa-wand-magic-sparkles mr-1"></i>开始消痕
                    </button>
                </div>
                <!-- 输出区 -->
                <div class="w-1/2 flex flex-col p-4 gap-3">
                    <div class="flex items-center justify-between">
                        <label class="text-xs font-bold text-white">消痕结果</label>
                        <div class="flex gap-1">
                            <button class="text-[10px] text-dim hover:text-white transition" onclick="Modules.creative_studio._copyDeaiResult()"><i class="fa-solid fa-copy mr-1"></i>复制</button>
                            <button class="text-[10px] text-dim hover:text-white transition" onclick="Modules.creative_studio._saveDeaiResult()"><i class="fa-solid fa-save mr-1"></i>保存</button>
                        </div>
                    </div>
                    <div id="cs-deai-result" class="flex-1 min-h-0 bg-[#0a0a0c] border border-white/10 rounded-lg p-3 text-xs text-main overflow-y-auto"></div>
                    <div id="cs-deai-stats" class="shrink-0"></div>
                </div>
            </div>
        </div>`;
    },

    _setDeaiIntensity(id) {
        this._deaiIntensity = id;
        this.switchTab('deai');
    },

    _pasteDeai() {
        navigator.clipboard.readText().then(t => {
            const el = document.getElementById('cs-deai-input');
            if (el) el.value = t;
        }).catch(() => UI.toast('无法读取剪贴板', 'error'));
    },

    async _runDeai() {
        const input = (document.getElementById('cs-deai-input') || {}).value || '';
        if (!input.trim()) return UI.toast('请输入需要消痕的文本');
        const resultEl = document.getElementById('cs-deai-result');
        this._deaiStats = { aiScoreBefore: this._estimateAiTraceScore(input), aiScoreAfter: null, changes: 0 };
        this._renderDeaiStats();
        if (resultEl) resultEl.innerHTML = '<div class="text-dim text-xs flex items-center gap-2"><i class="fa-solid fa-spinner fa-spin"></i>AI消痕处理中...</div>';

        const intensityDesc = {
            light: '轻微调整：替换机械连接词，微调句式节奏，保留原文核心结构和词汇。',
            medium: '中度重构：打乱部分句子结构，增加口语化表达，替换常用AI词汇（如"不容忽视""值得一提的是"），增加具体细节。',
            strong: '强力改写：深度重构段落逻辑，大幅变化句式结构，加入个人风格化表达，使用更生动的动词和形容词，增加感官细节和人物小动作。'
        };

        const basePrompt = Modules.creative_studio._getPrompt('deai', `你是一位资深编辑，专门负责去除AI生成文本的"机械感"。以下规则来自真值执行协议，违反即重写。

【L1 铁律 — 去机械感核心】
1. 禁解释癖：禁用"这不是…而是…/不是因为…恰恰因为…/这意味着…/换句话说…/其实…"
2. 禁虚词模糊：删除"似乎/仿佛/好像"用于模糊描述
3. 禁情绪标签：不写"他很愤怒"；必须转化为动作/环境/对话呈现
4. 禁连续长句：单句≤25字；逗号连接分句≤2个
5. 禁逻辑连词：删除"首先/其次/然后/最后/总的来说/综上所述/不难看出"
6. 段落限制：每段≤5行（约60字）

【拟人化构建协议 — 去AI味核心】
P1 物理替代：严禁直接情绪形容词，必须转化为具体物理动作或状态
P2 拒绝升华：严禁结尾价值观总结/升华/强行圆满，在无力感或未完成中戛然而止
P3 沟通失效：严禁流畅剧本式对话，增加错位感、打断、沉默、答非所问
P4 细节碎片化：严禁宏大场景描写，只捕捉1-2个细微甚至无关的物理碎片
P7 感官钝化：严禁华丽比喻，使用低频、干瘪、甚至不适的感官词汇
P10 自我意识抹除：严禁"我意识到/我想起/我感觉到"，直接陈述事实

【真实感增强池 — 注入人味】
- 日常细节：吃什么早餐、外卖等了多久、闹钟响了几次、电脑卡顿、回复消息犹豫
- 角色癖好：咬指甲、转笔、叠纸鹤、反复洗手、说话摸鼻子、紧张揪头发
- 不完美性：近视不戴眼镜、慢性鼻炎、怕冷、晕车、社恐、选择困难、方向感差
- 偶然事件：手机没电、走错路、电梯故障、偶遇旧识、突然下雨、说错话、打翻杯子

【常见AI痕迹特征】
1. 抽象概括代替具体描写："他很伤心"→应有动作/神态
2. 句式过于工整对称
3. 缺乏感官细节（视觉/听觉/嗅觉/触觉/味觉）
4. 情绪标签代替情绪呈现："她感到愤怒"→应有行为表现
5. 过度使用"的"字结构和长定语
6. 段落开头模式化
7. 场景描写缺乏环境细节
8. 对话过于"正确"，缺乏口语化和潜台词
9. 缺乏人物小动作和微表情`);

        const prompt = `${basePrompt}

【消痕强度】${intensityDesc[this._deaiIntensity]}

【处理要求】
- 保持原意和核心信息不变
- 保持人物人设和情节逻辑一致
- 增加具体细节、感官描写、人物小动作
- 让对话更口语化、更有潜台词
- 打乱过于工整的句式结构
- 长短句交替，增加节奏感
- 适当使用方言、俚语、省略句
- 对照L1铁律和拟人化协议逐条检查修正

【输出格式】
只输出消痕后的完整文本。
不要输出修改统计。
不要解释。
不要出现“AI检测率”“修改统计”“降低百分比”等自评内容。

请处理以下文本：
${input}`;

        let result = '';
        try {
            await AI.generate(prompt, { apiType: 'text', module: 'creative_deai' }, chunk => {
                result += chunk;
                if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">${typeof marked !== 'undefined' ? marked.parse(result) : result}</div>`;
            });
            this._deaiResult = result;
            this._deaiOriginal = input;
            this._deaiStats = {
                aiScoreBefore: this._deaiStats.aiScoreBefore,
                aiScoreAfter: this._estimateAiTraceScore(result),
                changes: this._estimateDeaiChanges(input, result)
            };
            this._renderDeaiStats();
            UI.toast('消痕完成 ✓', 'success');
        } catch(e) {
            UI.toast('消痕失败: ' + e.message, 'error');
        }
    },

    _estimateAiTraceScore(text) {
        const raw = String(text || '').trim();
        if (!raw) return 0;
        const body = (raw.split(/---\s*【修改统计】/)[0] || raw)
            .replace(/```[\s\S]*?```/g, '')
            .trim();
        if (!body) return 0;
        const sentences = body.split(/[。！？!?；;\n]+/).map(s => s.trim()).filter(Boolean);
        const sentenceCount = Math.max(1, sentences.length);
        const avgLen = body.length / sentenceCount;
        const longCount = sentences.filter(s => s.length > 28).length;
        const shortCount = sentences.filter(s => s.length <= 10).length;
        const shortRatio = shortCount / sentenceCount;
        const patterns = [
            /首先|其次|然后|最后|总的来说|综上所述|值得一提|不难看出|这意味着|换句话说|其实/g,
            /我知道|我感到|我意识到|我看到自己|我注意到|我能想象|感到|意识到|注意到/g,
            /似乎|仿佛|好像|如同|宛如/g,
            /内心OS|技法标签|读者期待|读者恐惧|反应涟漪|AI痕迹|本章分析|修改统计|检测率/g,
            /显著|大幅|深刻|极致|震撼|令人|无与伦比|醍醐灌顶/g
        ];
        const hits = patterns.reduce((n, re) => n + ((body.match(re) || []).length), 0);
        const sensory = (body.match(/冷|热|疼|痒|湿|干|响|哑|腥|苦|酸|甜|亮|暗|刺|黏|粗|滑|硬|软|烫|涩|臭|呛/g) || []).length;
        const starts = sentences.map(s => s.slice(0, 2)).filter(Boolean);
        const repeatedStarts = starts.length - new Set(starts).size;
        const commaLoad = (body.match(/，/g) || []).length / sentenceCount;
        const quoteCount = (body.match(/[「」“”"]/g) || []).length;
        let score = 28
            + hits * 7
            + Math.max(0, avgLen - 22) * 1.2
            + longCount * 4
            + repeatedStarts * 3
            + Math.max(0, commaLoad - 2) * 6
            - shortRatio * 18
            - Math.min(18, sensory * 1.2)
            - Math.min(8, quoteCount * 0.35);
        return Math.max(3, Math.min(98, Math.round(score)));
    },

    _estimateDeaiChanges(before, after) {
        const a = String(before || '').trim();
        const b = String(after || '').trim();
        if (!a && !b) return 0;
        const beforeParts = a.split(/[。！？!?；;\n]+/).map(s => s.trim()).filter(Boolean);
        const afterParts = b.split(/[。！？!?；;\n]+/).map(s => s.trim()).filter(Boolean);
        const lenDelta = Math.abs(a.length - b.length);
        const sentenceDelta = Math.abs(beforeParts.length - afterParts.length);
        let changed = sentenceDelta;
        const max = Math.max(beforeParts.length, afterParts.length);
        for (let i = 0; i < max; i++) {
            if ((beforeParts[i] || '') !== (afterParts[i] || '')) changed++;
        }
        return Math.max(1, Math.round(changed + lenDelta / 80));
    },

    _renderDeaiStats() {
        const el = document.getElementById('cs-deai-stats');
        if (!el) return;
        const s = this._deaiStats || {};
        const before = Number.isFinite(s.aiScoreBefore) ? s.aiScoreBefore : 0;
        const afterText = s.aiScoreAfter == null ? '待生成' : `${s.aiScoreAfter}%`;
        const deltaText = s.aiScoreAfter == null ? '生成后计算' : `-${Math.max(0, before - s.aiScoreAfter)}%`;
        el.innerHTML = `
            <div class="grid grid-cols-3 gap-2 text-[10px]">
                <div class="rounded-lg bg-white/5 border border-white/10 p-2">
                    <div class="text-dim">原始痕迹</div>
                    <div class="text-amber-300 font-bold mt-0.5">${before}%</div>
                </div>
                <div class="rounded-lg bg-white/5 border border-white/10 p-2">
                    <div class="text-dim">处理后</div>
                    <div class="text-emerald-300 font-bold mt-0.5">${afterText}</div>
                </div>
                <div class="rounded-lg bg-white/5 border border-white/10 p-2">
                    <div class="text-dim">改动量</div>
                    <div class="text-blue-300 font-bold mt-0.5">${s.changes || 0}处 · ${deltaText}</div>
                </div>
            </div>`;
    },

    _copyDeaiResult() {
        if (!this._deaiResult) return UI.toast('无内容可复制');
        navigator.clipboard.writeText(this._deaiResult).then(() => UI.toast('已复制到剪贴板'));
    },

    async _saveDeaiResult() {
        if (!this._deaiResult) return UI.toast('无内容可保存');
        const id = 'deai_' + Utils.uuid();
        await DB.put('library_books', { id, name: '消痕_' + new Date().toLocaleDateString(), content: this._deaiResult, size: this._deaiResult.length, date: new Date().toLocaleDateString(), type: 'deai' });
        UI.toast('已保存到阅读中心');
    }
});
