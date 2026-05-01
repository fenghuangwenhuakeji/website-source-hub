Object.assign(Modules.creative_studio, {
    // ═══ 脑洞风暴方法 ═══
    async _runBrainStorm() {
        const topic = (document.getElementById('cs-bs-topic') || {}).value;
        if(!topic) return UI.toast('请输入主题');
        const count = (document.getElementById('cs-bs-count') || {}).value || 10;
        const mode = (document.getElementById('cs-bs-mode') || {}).value || 'normal';
        const modePrompts = {
            normal: '',
            extreme: '每个创意都要极端、疯狂、打破常规认知，越离谱越好！',
            crossover: '每个创意都要融合至少两个完全不同类型的元素，产生奇妙的化学反应！',
            subvert: '每个创意都要颠覆传统套路，反其道而行之，让读者大呼意外！'
        };
        const basePrompt = Modules.creative_studio._getPrompt('brainstorm', `你执行《叙事工程·元系统》脑洞生成协议（第五部分）。

【系统总纲】
核心理念：规则是骨架，案例是血肉，自由是心跳。
执行优先级：L1铁律→L2建议→L3选项→L4自由→L5案例学习。

【标题生成公式】（按情绪基调匹配）
爽 = 身份反转+打脸：[卑微身份]+[其实是隐藏大佬]
虐 = 失去+后悔：[删除/离开]+[严重后果]
甜 = 反差+意外相遇：[平凡身份]+[与高地位者相遇]
悬疑 = 规则怪谈+异常：[诡异规则]+[违反后果]
复仇 = 极端行为+毁灭后果：[疯狂操作]+[彻底摧毁]

【三层反转设计】
第一反转（拉阶段末章约5%）：打破主角初始认知
第二反转（扯阶段中点章约50%）：颠覆中段格局，前30%埋下至少1处伏笔
第三反转（放阶段中段章约85%）：终极真相，前70%埋下至少3处伏笔
彩蛋反转（最后一章最后一句）：暗示未完

【情绪链选择】
爽-智商碾压：设局→收网→揭底→碾压（期待→紧张→恍然大悟→极致爽）
虐-绝望剥离：预警失灵→钝刀割肉→最后稻草→不可逆（不安→反复揪心→崩溃→心碎）
甜-追妻火葬场：相遇→心动→阻碍→双向奔赴（怦然→甜蜜→揪心→圆满）
悬疑-恐怖谷效应：日常裂痕→疯狂猜想→恐怖实锤→绝望敲门（不安→恐惧→震惊→绝望）
复仇-扮猪吃虎：隐忍→挑衅→局部暴露→全面碾压→终极反转（憋屈→愤怒→暗爽→炸裂→震撼）

【共情锚点池】
焦躁：他第无数次按亮手机屏幕，又按灭。时间只过去三分钟。
委屈：她想解释，嘴巴张开又合上。说什么都没用。
失去：她习惯性地拿起手机，想给他发消息。打到一半，删了。
强撑：她深吸一口气，扯出一个笑。笑得太用力了。
绝望：他就那么坐着，一动不动。窗户外的天黑了又亮。

【输出要求】
每个创意包含：标题(10字内)、一句话概念、核心冲突、独特卖点、建议情绪链、推荐共情锚点。越反直觉越好。输出格式为JSON数组。`);
        const prompt = `${basePrompt}\n\n主题：【${topic}】\n数量：${count}个\n模式要求：${modePrompts[mode] || '普通模式'}\n\n请生成${count}个独特的小说创意脑洞。输出格式为JSON数组：[{"title":"标题","concept":"一句话概念","conflict":"核心冲突","hook":"独特卖点"}]`;
        const el = document.getElementById('cs-bs-results');
        if(!el) return;
        el.innerHTML = '<div class="col-span-2 text-purple-400 animate-pulse text-center p-8"><i class="fa-solid fa-circle-notch fa-spin mr-1"></i>脑洞风暴中...</div>';
        let res = '';
        try {
            await AI.generate(prompt, {}, c => { res += c; });
        } catch(e) {
            el.innerHTML = '<div class="col-span-2 text-red-400 text-center p-8"><i class="fa-solid fa-triangle-exclamation mr-1"></i>风暴失败: ' + (e.message || e) + '</div>';
            return;
        }
        let ideas = null;
        try { ideas = JSON.parse(res); } catch(e1) {
            try { ideas = JSON.parse(res.replace(/```json?\s*/g,'').replace(/```/g,'').trim()); } catch(e2) {
                const m = res.match(/\[[\s\S]*\]/);
                if(m) try { ideas = JSON.parse(m[0]); } catch(e3) {}
            }
        }
        if(!ideas || !Array.isArray(ideas)) {
            el.innerHTML = '<div class="col-span-2 p-4 text-sm text-gray-300 leading-relaxed markdown-body">' + (typeof marked !== 'undefined' ? marked.parse(res) : res) + '</div>';
            return;
        }
        this.brainStorm = ideas;
        const colors = ['amber','blue','green','purple','pink','red','cyan','orange','indigo','teal'];
        el.innerHTML = ideas.map((idea, i) => `
            <div class="p-4 rounded-xl bg-${colors[i % colors.length]}-900/10 border border-${colors[i % colors.length]}-500/15 hover:border-${colors[i % colors.length]}-500/40 transition-all group">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-bold text-${colors[i % colors.length]}-300">${idea.title || '创意' + (i+1)}</span>
                    <button class="btn btn-xs bg-white/5 text-dim opacity-0 group-hover:opacity-100" onclick="Modules.creative_studio._saveIdeaFromStorm(${i})"><i class="fa-solid fa-bucket"></i></button>
                </div>
                <div class="text-xs text-white mb-1">${idea.concept || ''}</div>
                <div class="text-[10px] text-dim mb-1"><i class="fa-solid fa-bolt text-yellow-400 mr-1"></i>${idea.conflict || ''}</div>
                <div class="text-[10px] text-green-400"><i class="fa-solid fa-star mr-1"></i>${idea.hook || ''}</div>
            </div>
        `).join('');
        UI.toast('脑洞风暴完成: ' + ideas.length + '个创意');
    },

    _saveIdeaFromStorm(idx) {
        const idea = this.brainStorm[idx];
        if(!idea) return;
        this.ideaPool.push({ id: Utils.uuid(), title: idea.title, content: `${idea.concept}\n冲突: ${idea.conflict}\n卖点: ${idea.hook}`, type: 'brainstorm', ts: Date.now() });
        DB.put('settings', { id: 'idea_pool', items: this.ideaPool });
        UI.toast('已存入灵感池: ' + idea.title);
    },
    
    async _randomCollision() {
        const elements = ['重生', '系统', '穿越', '末日', '修仙', '都市', '星际', '宫斗', '悬疑', '言情', '科幻', '玄幻', '模拟器', '签到', '无限流', '克苏鲁', '赛博朋克', '蒸汽朋克', '魔法少女', '机甲'];
        const elemA = elements[Math.floor(Math.random() * elements.length)];
        const elemB = elements[Math.floor(Math.random() * elements.length)];
        const elemC = elements[Math.floor(Math.random() * elements.length)];
        const prompt = `你是一个创意碰撞引擎。请将以下三个随机元素进行创意碰撞，生成5个独特的小说创意：\n\n元素A：${elemA}\n元素B：${elemB}\n元素C：${elemC}\n\n要求：\n1. 每个创意都要有机融合这三个元素\n2. 产生意想不到的化学反应\n3. 每个创意包含：标题、一句话概念、核心冲突、独特卖点\n\n输出JSON数组格式：[{"title":"标题","concept":"概念","conflict":"冲突","hook":"卖点"}]`;
        const el = document.getElementById('cs-bs-results');
        if(!el) return;
        el.innerHTML = `<div class="col-span-2 text-cyan-400 animate-pulse text-center p-8"><i class="fa-solid fa-shuffle fa-spin mr-1"></i>随机碰撞: ${elemA} + ${elemB} + ${elemC}...</div>`;
        let res = '';
        try {
            await AI.generate(prompt, {}, c => { res += c; });
            let ideas = JSON.parse(res.replace(/```json?\s*/g,'').replace(/```/g,'').trim());
            this.brainStorm = ideas;
            const colors = ['cyan','teal','emerald','sky','blue'];
            el.innerHTML = ideas.map((idea, i) => `
                <div class="p-4 rounded-xl bg-${colors[i % colors.length]}-900/10 border border-${colors[i % colors.length]}-500/15 hover:border-${colors[i % colors.length]}-500/40 transition-all group">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-bold text-${colors[i % colors.length]}-300">${idea.title}</span>
                        <button class="btn btn-xs bg-white/5 text-dim opacity-0 group-hover:opacity-100" onclick="Modules.creative_studio._saveIdeaFromStorm(${i})"><i class="fa-solid fa-bucket"></i></button>
                    </div>
                    <div class="text-xs text-white mb-1">${idea.concept}</div>
                    <div class="text-[10px] text-dim mb-1"><i class="fa-solid fa-bolt text-yellow-400 mr-1"></i>${idea.conflict}</div>
                    <div class="text-[10px] text-green-400"><i class="fa-solid fa-star mr-1"></i>${idea.hook}</div>
                </div>
            `).join('');
            UI.toast('随机碰撞完成！');
        } catch(e) {
            el.innerHTML = '<div class="col-span-2 text-red-400 text-center p-8">碰撞失败: ' + (e.message || e) + '</div>';
        }
    },
    
    async _ideaEvolution() {
        if(this.brainStorm.length === 0) return UI.toast('请先进行脑洞风暴生成创意');
        const bestIdea = this.brainStorm[0];
        const prompt = `你是一个创意进化引擎。请基于以下创意进行进化升级，生成5个更完善的版本：\n\n原创意：${bestIdea.title}\n概念：${bestIdea.concept}\n冲突：${bestIdea.conflict}\n卖点：${bestIdea.hook}\n\n进化方向：\n1. 强化冲突 - 让冲突更激烈、更不可调和\n2. 深化主题 - 增加哲学思考和社会隐喻\n3. 扩展世界观 - 让设定更宏大、更完整\n4. 优化人设 - 让角色更立体、更有魅力\n5. 创新结构 - 尝试非线性、多视角等叙事结构\n\n输出JSON数组格式：[{"title":"标题","concept":"概念","conflict":"冲突","hook":"卖点","evolution":"进化点"}]`;
        const el = document.getElementById('cs-bs-results');
        if(!el) return;
        el.innerHTML = '<div class="col-span-2 text-green-400 animate-pulse text-center p-8"><i class="fa-solid fa-dna fa-spin mr-1"></i>创意进化中...</div>';
        let res = '';
        try {
            await AI.generate(prompt, {}, c => { res += c; });
            let ideas = JSON.parse(res.replace(/```json?\s*/g,'').replace(/```/g,'').trim());
            this.brainStorm = ideas;
            const colors = ['green','emerald','lime','teal','cyan'];
            el.innerHTML = ideas.map((idea, i) => `
                <div class="p-4 rounded-xl bg-${colors[i % colors.length]}-900/10 border border-${colors[i % colors.length]}-500/15 hover:border-${colors[i % colors.length]}-500/40 transition-all group">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-bold text-${colors[i % colors.length]}-300">${idea.title}</span>
                        <button class="btn btn-xs bg-white/5 text-dim opacity-0 group-hover:opacity-100" onclick="Modules.creative_studio._saveIdeaFromStorm(${i})"><i class="fa-solid fa-bucket"></i></button>
                    </div>
                    <div class="text-xs text-white mb-1">${idea.concept}</div>
                    <div class="text-[10px] text-dim mb-1"><i class="fa-solid fa-bolt text-yellow-400 mr-1"></i>${idea.conflict}</div>
                    <div class="text-[10px] text-green-400 mb-1"><i class="fa-solid fa-star mr-1"></i>${idea.hook}</div>
                    <div class="text-[10px] text-amber-400"><i class="fa-solid fa-arrow-up mr-1"></i>${idea.evolution || ''}</div>
                </div>
            `).join('');
            UI.toast('创意进化完成！');
        } catch(e) {
            el.innerHTML = '<div class="col-span-2 text-red-400 text-center p-8">进化失败: ' + (e.message || e) + '</div>';
        }
    },
});
