// creative_trends.js — 热点扫榜 (Trend Scanner)
// 对标: 星月写作 AI扫榜
// 提示词驱动+模板库方案：预置各平台热榜分析prompt模板
Object.assign(Modules.creative_studio, {
    _trendPlatform: 'fanqie',
    _trendResult: '',

    TREND_TEMPLATES: {
        fanqie: { name: '番茄小说', desc: '都市/赘婿/神医/种田流', prompt: '分析番茄小说热榜作品的爆款公式。' },
        qidian: { name: '起点中文网', desc: '玄幻/仙侠/科幻/悬疑', prompt: '分析起点中文网热榜作品的爆款公式。' },
        jinjiang: { name: '晋江文学城', desc: '古言/现言/纯爱/无CP', prompt: '分析晋江文学城热榜作品的爆款公式。' },
        feilu: { name: '飞卢小说', desc: '脑洞/同人/系统/快节奏', prompt: '分析飞卢小说热榜作品的爆款公式。' },
        general: { name: '通用分析', desc: '跨平台通用规律', prompt: '分析网文市场的通用爆款规律。' }
    },

    _renderTrendsTab() {
        const t = this.TREND_TEMPLATES[this._trendPlatform];
        return `
        <div class="flex flex-col h-full overflow-hidden">
            <div class="shrink-0 p-4 border-b border-white/5 bg-gradient-to-r from-red-900/20 to-transparent">
                <div class="flex items-center gap-2 mb-1">
                    <i class="fa-solid fa-fire-flame-curved text-red-400"></i>
                    <span class="font-bold text-white text-sm">热点扫榜</span>
                    <span class="text-[9px] text-dim bg-white/5 px-1.5 py-0.5 rounded">v3.0</span>
                </div>
                <div class="flex items-center justify-between">
                    <div class="text-[10px] text-dim">分析爆款规律，提取可复用的写作公式（粘贴榜单内容或使用模板分析）</div>
                    ${Modules.creative_studio._renderPromptEditButton('trends','热点扫榜')}
                </div>
            </div>
            <div class="flex-1 flex min-h-0 overflow-y-auto p-4 gap-4">
                <div class="w-80 shrink-0 space-y-3">
                    <div class="text-[10px] text-dim font-bold">分析模式</div>
                    <div class="space-y-1.5">
                        ${Object.entries(this.TREND_TEMPLATES).map(([k, v]) => `
                            <button class="w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all ${this._trendPlatform===k ? 'bg-red-500/15 border border-red-500/30' : 'bg-white/5 border border-transparent hover:bg-white/10'}"
                                onclick="Modules.creative_studio._setTrendPlatform('${k}')">
                                <div class="w-6 h-6 rounded bg-white/10 flex center shrink-0">
                                    <span class="text-[8px] font-bold ${this._trendPlatform===k ? 'text-red-400' : 'text-dim'}">${v.name.charAt(0)}</span>
                                </div>
                                <div>
                                    <div class="text-[11px] font-bold ${this._trendPlatform===k ? 'text-white' : 'text-dim'}">${v.name}</div>
                                    <div class="text-[8px] text-dim">${v.desc}</div>
                                </div>
                            </button>
                        `).join('')}
                    </div>
                    <div class="p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <div class="text-[9px] text-red-300 font-bold mb-1"><i class="fa-solid fa-circle-info mr-1"></i>使用说明</div>
                        <div class="text-[8px] text-dim leading-relaxed">
                            1. 从各平台复制热榜作品标题+简介<br>
                            2. 粘贴到右侧输入框<br>
                            3. AI自动分析爆款规律<br>
                            4. 获取可复用的写作公式
                        </div>
                    </div>
                    <button class="w-full btn btn-xs bg-white/5 text-dim" onclick="Modules.creative_studio._loadTrendTemplate()"><i class="fa-solid fa-file-lines mr-1"></i>加载分析模板</button>
                </div>
                <div class="flex-1 flex flex-col gap-3">
                    <div class="flex items-center justify-between">
                        <label class="text-xs font-bold text-white">榜单内容 <span class="text-dim font-normal">(标题+简介)</span></label>
                        <button class="text-[10px] text-dim hover:text-white transition" onclick="Modules.creative_studio._pasteTrends()"><i class="fa-solid fa-paste mr-1"></i>粘贴</button>
                    </div>
                    <textarea id="cs-trend-input" class="flex-1 min-h-[150px] bg-[#0a0a0c] border border-white/10 rounded-lg p-3 text-xs text-main resize-none focus:border-red-500/50 focus:outline-none" placeholder="粘贴热榜作品的标题和简介，每部作品一行或分段..."></textarea>
                    <button class="btn bg-red-600/20 text-red-400 border-red-600/30 hover:bg-red-600/30 font-bold text-xs py-2.5 rounded-xl" onclick="Modules.creative_studio._runTrendAnalysis()">
                        <i class="fa-solid fa-magnifying-glass-chart mr-1"></i>分析爆款规律
                    </button>
                    <div class="flex items-center justify-between">
                        <label class="text-xs font-bold text-white">分析报告</label>
                        <div class="flex gap-1">
                            <button class="text-[10px] text-dim hover:text-white transition px-2 py-1" onclick="Modules.creative_studio._copyTrendResult()"><i class="fa-solid fa-copy mr-1"></i>复制</button>
                            <button class="text-[10px] text-dim hover:text-white transition px-2 py-1" onclick="Modules.creative_studio._saveTrendResult()"><i class="fa-solid fa-save mr-1"></i>保存</button>
                        </div>
                    </div>
                    <div id="cs-trend-result" class="flex-1 min-h-[200px] bg-[#0a0a0c] border border-white/10 rounded-lg p-3 text-xs text-main overflow-y-auto"></div>
                </div>
            </div>
        </div>`;
    },

    _setTrendPlatform(platform) {
        this._trendPlatform = platform;
        this.switchTab('trends');
    },

    _pasteTrends() {
        navigator.clipboard.readText().then(t => {
            const el = document.getElementById('cs-trend-input');
            if (el) el.value = t;
        }).catch(() => UI.toast('无法读取剪贴板', 'error'));
    },

    _loadTrendTemplate() {
        const templates = {
            fanqie: `《上门龙婿》 被丈母娘瞧不起的赘婿竟是神秘富豪
《神医下山》 山野神医初入都市，医术震惊全场
《退伍兵王》 退役特种兵回归都市，保护美女总裁`,
            qidian: `《诡秘之主》 蒸汽朋克+克苏鲁，愚者之路
《斗破苍穹》 废柴少年获异火，逆袭成帝
《大奉打更人》 破案+修仙，现代思维穿越古代`,
            jinjiang: `《知否知否》 庶女逆袭，深宅大院生存指南
《琅琊榜》 麒麟才子，梅长苏复仇记
《庆余年》 现代灵魂穿越，权谋争霸`,
            feilu: `《开局签到十万年》 签到流，无敌爽文
《我在火影当叛忍》 同人穿越，改变剧情
《全球高武》 灵气复苏，武道崛起`,
            general: `《作品A》 简介内容...
《作品B》 简介内容...
《作品C》 简介内容...`
        };
        const input = document.getElementById('cs-trend-input');
        if (input) input.value = templates[this._trendPlatform] || '';
    },

    async _runTrendAnalysis() {
        const input = (document.getElementById('cs-trend-input') || {}).value || '';
        if (!input.trim()) return UI.toast('请输入榜单内容');
        const resultEl = document.getElementById('cs-trend-result');
        if (resultEl) resultEl.innerHTML = '<div class="text-dim text-xs flex items-center gap-2"><i class="fa-solid fa-spinner fa-spin"></i>AI正在分析爆款规律...</div>';

        const t = this.TREND_TEMPLATES[this._trendPlatform];
        const basePrompt = Modules.creative_studio._getPrompt('trends', `你执行《叙事工程·元系统》联网热梗与深度市场调研协议（第三部分，L2强制建议）。

【核心理念】
没有调研，不写一个字。AI在生成任何脑洞前，必须先完成以下操作，否则不得开始写作。

【热梗抓取规范】
按来源分类：情绪爆发、身份反转、极致关系、网络热词、极端行为、规则怪谈、时空错位。
每条记录包含：梗文本、来源、热度、类别、关联情绪。
情绪爆发梗关键词：杀疯了/原地暴走/DNA动了/人麻了/血压飙升/心态崩了/破防了/蚌埠住了。

【标题生成公式】（按情绪基调匹配）
爽 = 身份反转+打脸：[卑微身份]+[其实是隐藏大佬]
虐 = 失去+后悔：[删除/离开]+[严重后果]
甜 = 反差+意外相遇：[平凡身份]+[与高地位者相遇]
悬疑 = 规则怪谈+异常：[诡异规则]+[违反后果]
复仇 = 极端行为+毁灭后果：[疯狂操作]+[彻底摧毁]

【分析维度】
1. 高频爆点元素：哪些梗/设定反复出现？吸引力来源？
2. 标题公式：提取3-5个可复用标题模板，标注适用题材
3. 开篇结构：前300字如何抓人？提取开篇公式
4. 节奏规律：爽点间隔字数、压抑与释放比例
5. 人设模板：最受欢迎的角色类型、可复用人设公式
6. 变现设计：付费点位置、追更动力设计
7. 可复用公式总结：填空式模板+风险标注（是否已过时/同质化）
8. 情绪链匹配：分析爆款作品使用的情绪链类型（爽/虐/甜/悬疑/复仇）

请输出结构化的分析报告。`);
        const prompt = `${basePrompt}\n\n【用户输入】\n${input.slice(0, 4000)}`;

        let result = '';
        try {
            await AI.generate(prompt, {}, chunk => {
                result += chunk;
                if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">${typeof marked !== 'undefined' ? marked.parse(result) : result}</div>`;
            });
            this._trendResult = result;
            UI.toast('分析完成 ✓', 'success');
        } catch(e) {
            UI.toast('分析失败: ' + e.message, 'error');
        }
    },

    _copyTrendResult() {
        if (!this._trendResult) return UI.toast('无内容可复制');
        navigator.clipboard.writeText(this._trendResult).then(() => UI.toast('已复制到剪贴板'));
    },

    async _saveTrendResult() {
        if (!this._trendResult) return UI.toast('无内容可保存');
        const id = 'trend_' + Utils.uuid();
        await DB.put('library_books', { id, name: '扫榜_' + this._trendPlatform + '_' + new Date().toLocaleDateString(), content: this._trendResult, size: this._trendResult.length, date: new Date().toLocaleDateString(), type: 'trend' });
        UI.toast('已保存到阅读中心');
    }
});
