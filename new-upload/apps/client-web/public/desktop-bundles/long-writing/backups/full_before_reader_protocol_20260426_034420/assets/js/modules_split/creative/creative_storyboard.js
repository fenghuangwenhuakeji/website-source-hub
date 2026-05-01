// creative_storyboard.js — 分镜工作台完整实现 (Storyboard Workbench)
// 对标: 麻薯动画 智能分镜 + 文镜画师 文字即分镜
// 文本→专业分镜故事板（镜头/景别/运镜/时长）
Object.assign(Modules.creative_studio, {
    _storyboardResult: null,
    _storyboardShots: [],
    _sbStyle: 'cinematic',

    _renderStoryboard() {
        const styles = [
            { id: 'cinematic', label: '电影感', desc: '写实、大气、光影层次', icon: 'fa-film' },
            { id: 'anime', label: '日式动画', desc: '唯美、张力、速度线', icon: 'fa-wand-magic-sparkles' },
            { id: 'noir', label: '黑色电影', desc: '高反差、阴影、压抑', icon: 'fa-moon' },
            { id: 'documentary', label: '纪录片', desc: '真实、自然、手持感', icon: 'fa-video' },
            { id: 'wuxia', label: '武侠古风', desc: '飘逸、意境、水墨感', icon: 'fa-dragon' },
            { id: 'cyberpunk', label: '赛博朋克', desc: '霓虹、雨夜、科技感', icon: 'fa-bolt' },
            { id: 'horror', label: '恐怖惊悚', desc: '阴影、跳切、不安感', icon: 'fa-ghost' }
        ];
        return `
        <div class="flex flex-col h-full overflow-hidden">
            <div class="shrink-0 flex items-center justify-between px-5 bg-[#0d0d0f] border-b border-white/5">
                <div>
                    <span class="text-xs font-bold text-rose-400"><i class="fa-solid fa-film mr-1"></i>分镜设计工作台</span>
                    <div class="flex items-center justify-between mt-0.5">
                        <div class="text-[10px] text-dim">AI智能分镜拆解与画面提示词生成</div>
                        ${Modules.creative_studio._renderPromptEditButton('storyboard','分镜设计')}
                    </div>
                </div>
                <div class="flex gap-2">
                    <button class="btn btn-xs bg-rose-600/20 text-rose-400 border-rose-600/30" onclick="Modules.creative_studio._aiStoryboard()"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>AI生成分镜</button>
                    <button class="btn btn-xs bg-blue-600/20 text-blue-400 border-blue-600/30" onclick="Modules.creative_studio._saveStoryboard()"><i class="fa-solid fa-save mr-1"></i>保存</button>
                    <button class="btn btn-xs bg-emerald-600/20 text-emerald-400 border-emerald-600/30" onclick="Modules.creative_studio._exportSbPrompts()"><i class="fa-solid fa-image mr-1"></i>导出画面提示词</button>
                </div>
            </div>
            <div class="flex-1 flex min-h-0">
                <!-- 左侧配置 -->
                <div class="w-72 shrink-0 border-r border-white/5 flex flex-col bg-[#0d0d0f] p-3 space-y-3 overflow-y-auto">
                    <div class="space-y-1">
                        <span class="text-[10px] text-dim font-bold">剧本/场景描述</span>
                        <textarea id="cs-sb-scene" class="textarea bg-black/30 border-white/10 text-gray-300 w-full h-28 text-xs resize-none focus:border-rose-500/50 focus:outline-none" placeholder="输入需要分镜化的剧本或场景描述。建议包含：场景地点、人物动作、对话情绪、关键转折..."></textarea>
                    </div>
                    <div class="space-y-1">
                        <span class="text-[10px] text-dim font-bold">视觉风格</span>
                        <div class="grid grid-cols-2 gap-1.5">
                            ${styles.map(s => `
                                <button class="p-2 rounded-lg border text-left transition-all ${this._sbStyle===s.id ? 'bg-rose-500/15 border-rose-500/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}"
                                    onclick="Modules.creative_studio._setSbStyle('${s.id}')">
                                    <div class="flex items-center gap-1.5">
                                        <i class="fa-solid ${s.icon} text-[9px] ${this._sbStyle===s.id ? 'text-rose-400' : 'text-dim'}"></i>
                                        <span class="text-[10px] font-bold ${this._sbStyle===s.id ? 'text-white' : 'text-dim'}">${s.label}</span>
                                    </div>
                                    <div class="text-[8px] text-dim mt-0.5">${s.desc}</div>
                                </button>
                            `).join('')}
                        </div>
                        <div class="mt-1.5">
                            <span class="text-[9px] text-dim">自定义风格描述（可选）</span>
                            <input id="cs-sb-custom-style" class="w-full bg-black/30 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-main focus:border-rose-500/50 focus:outline-none" placeholder="如：赛博朋克+水墨融合、蒸汽朋克民国风...">
                        </div>
                    </div>
                    <div class="space-y-1">
                        <span class="text-[10px] text-dim font-bold">镜头数量</span>
                        <select id="cs-sb-count" class="input bg-black/30 border-white/10 text-white w-full text-xs">
                            <option value="3">3镜 (精简预告)</option>
                            <option value="5">5镜 (标准场景)</option>
                            <option value="8" selected>8镜 (详细叙事)</option>
                            <option value="12">12镜 (复杂场景)</option>
                            <option value="20">20镜 (完整片段)</option>
                        </select>
                    </div>
                    <div class="space-y-1">
                        <span class="text-[10px] text-dim font-bold">运镜偏好</span>
                        <select id="cs-sb-camera" class="input bg-black/30 border-white/10 text-white w-full text-xs">
                            <option value="mixed">混合运镜（推荐）</option>
                            <option value="static">静态为主（文艺感）</option>
                            <option value="dynamic">动态为主（快节奏）</option>
                            <option value="handheld">手持感（真实感）</option>
                        </select>
                    </div>
                    <div class="space-y-1">
                        <span class="text-[10px] text-dim font-bold">时长预估</span>
                        <select id="cs-sb-duration" class="input bg-black/30 border-white/10 text-white w-full text-xs">
                            <option value="short">短片 (15-30秒)</option>
                            <option value="medium" selected>中片 (30-60秒)</option>
                            <option value="long">长片 (1-3分钟)</option>
                        </select>
                    </div>
                    <div class="space-y-1">
                        <span class="text-[10px] text-dim font-bold"><i class="fa-solid fa-users mr-1 text-teal-400"></i>关联角色（确保一致性）</span>
                        <div class="flex flex-wrap gap-1" id="cs-sb-chars-selected">
                            ${(this._sbSelectedChars || []).map(cid => {
                                const ch = this._lookbookChars.find(x => x.id === cid);
                                return ch ? `<span class="text-[9px] px-1.5 py-0.5 rounded bg-teal-500/15 text-teal-400 border border-teal-500/20 cursor-pointer" onclick="Modules.creative_studio._removeSbChar('${cid}')">${ch.name} <i class="fa-solid fa-xmark"></i></span>` : '';
                            }).join('')}
                        </div>
                        <select id="cs-sb-char-select" class="input bg-black/30 border-white/10 text-white w-full text-[10px]" onchange="Modules.creative_studio._addSbChar(this.value);this.value=''">
                            <option value="">+ 从角色库添加</option>
                            ${this._lookbookChars.map(ch => `<option value="${ch.id}">${ch.name} · ${ch.role || '角色'}</option>`).join('')}
                        </select>
                    </div>
                    <div class="p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                        <div class="text-[9px] text-rose-300 font-bold mb-1"><i class="fa-solid fa-circle-info mr-1"></i>镜头词汇库</div>
                        <div class="text-[8px] text-dim leading-relaxed">
                            景别: 大全景→全景→中景→近景→特写→大特写<br>
                            运镜: 推/拉/摇/移/跟/升/降/甩/环绕<br>
                            角度: 平视/俯视/仰视/倾斜/过肩
                        </div>
                    </div>
                </div>
                <!-- 右侧结果区 -->
                <div class="flex-1 overflow-y-auto p-4" id="cs-sb-result-area">
                    <div id="cs-sb-result" class="space-y-3"></div>
                </div>
            </div>
        </div>`;
    },

    _setSbStyle(id) {
        this._sbStyle = id;
        this.switchTab('storyboard');
    },

    _sbSelectedChars: [],

    _addSbChar(id) {
        if (!id) return;
        if (!this._sbSelectedChars.includes(id)) {
            this._sbSelectedChars.push(id);
            this.switchTab('storyboard');
        }
    },

    _removeSbChar(id) {
        this._sbSelectedChars = this._sbSelectedChars.filter(x => x !== id);
        this.switchTab('storyboard');
    },

    _getSbCharPrompts() {
        if (!this._sbSelectedChars.length) return '';
        let text = '\n\n【关联角色外观锁定（画面提示词必须遵守）】\n';
        this._sbSelectedChars.forEach(cid => {
            const ch = this._lookbookChars.find(x => x.id === cid);
            if (ch) {
                text += `角色「${ch.name}」：${ch.hair}，${ch.eyes}，${ch.clothing}，${ch.feature}。气质：${ch.vibe}。`;
                if (ch.prompt) text += ` 图像参考：${ch.prompt.slice(0, 200)}`;
                text += '\n';
            }
        });
        return text;
    },

    async _aiStoryboard() {
        const scene = (document.getElementById('cs-sb-scene') || {}).value || '';
        if (!scene.trim()) return UI.toast('请输入场景描述');
        const style = this._sbStyle;
        const count = +(document.getElementById('cs-sb-count') || {}).value || 8;
        const camera = (document.getElementById('cs-sb-camera') || {}).value || 'mixed';
        const duration = (document.getElementById('cs-sb-duration') || {}).value || 'medium';

        const styleDesc = {
            cinematic: '电影感：写实光影，大气构图，景深层次，情绪饱满',
            anime: '日式动画：唯美画风，夸张张力，速度线，情感特写',
            noir: '黑色电影：高反差黑白，长阴影，烟雾，霓虹点缀',
            documentary: '纪录片：自然光，手持感，真实场景，采访穿插',
            wuxia: '武侠古风：飘逸意境，水墨留白，竹林/雪景，慢动作',
            cyberpunk: '赛博朋克：霓虹雨夜，全息投影，机械义体，繁华与破败对比',
            horror: '恐怖惊悚：低角度，阴影遮挡，跳切，不安的静止'
        };
        const customStyle = (document.getElementById('cs-sb-custom-style') || {}).value || '';
        const finalStyle = customStyle || (styleDesc[style] || style);
        const cameraDesc = {
            mixed: '混合使用推拉摇移跟升降等多种运镜',
            static: '以固定机位为主，偶尔缓慢推近',
            dynamic: '大量运动镜头，快速切换',
            handheld: '手持摄影的轻微晃动，增强真实感'
        };
        const durationDesc = { short: '15-30秒，节奏极快', medium: '30-60秒，标准叙事节奏', long: '1-3分钟，可以充分展开' };

        const basePrompt = Modules.creative_studio._getPrompt('storyboard', `你执行真值执行协议影视化转制层(M10) + 专业分镜法则。

【小说转剧本12条L1铁律】
1. 叙述转动作：心理描写转可见动作
2. 对话提纯：删无功能对白，前标注角色名
3. 场景划分：【场号】地点-时间
4. 删评论：删除"幸运的是"等
5. 时间显式化："三天后"→[时间跳转-三日]
6. 感官转音视：嗅觉触觉转画面+音效
7. 旁白限制：仅限第一人称，每场≤2次
8. 背景转对话：背景交代转对话动作暗示

【剧本切分镜8条铁律】
1. 动作切镜：每个独立动作切一镜
2. 台词切镜：每句台词切一镜，后可加反应镜
3. 景别默认：对话中景，高潮特写，环境全景
4. 时长估算：动作2s；对话=字数÷3s；反应1-2s
5. 表格输出：镜头号、景别、画面、对白、音效、时长
6. 禁风格标签：不添加风格化标签
7. 场末统计：每场总时长
8. 分镜统计：镜头总数、平均时长、景别分布

【镜头语言七法则】
1. 权力赋予镜头：低角度仰拍+平稳推近，用于主角成长/胜利/掌控
2. 压迫与窥视镜头：手持晃动+框景构图（门缝/窗户），制造恐惧
3. 评估与审视镜头：缓慢横移或静止固定，表现冷静分析
4. 亲密/威胁镜头：大特写，聚焦颤抖嘴唇、滚动喉结、闪烁眼神等局部
5. 权力关系镜头：主角处于视觉中心，他人环绕/依附/边缘
6. 混乱爆发节奏：快速剪辑(<2s/镜)+手持晃动，表现突发战斗
7. 掌控从容节奏：长镜头(>10s)或缓慢剪辑，表现安全感

【九宫格故事板模板】
- 登场：全身正面→面部特写→低角仰→背影上半身→高角俯→侧面中→手部大特→侧后曲线→远景背
- 战斗：对峙全景→主角特写→敌人特写→低角跃起→高角俯视→碰撞瞬间→大特击中→落地背影→远景敌倒
- 暧昧：双人全景→眼神特写→嘴唇大特→手部接触→侧脸近→过肩对话→背影相依→局部特→环境空镜
- 离别：双人远景→面部泪→对方背影→手部松开→高角俯→侧面擦肩→信物大特→独自站立→空镜远去

【风格要求】${finalStyle}
【运镜偏好】${cameraDesc[camera]}
【时长】${durationDesc[duration]}
【镜头总数】${count}个

每个分镜必须包含：镜号、景别、机位/角度、运镜、画面内容（200字内）、时长、对白/旁白、音效/音乐、情绪标记、画面提示词（英文80词内）。

请按专业分镜格式输出，确保镜头之间有逻辑衔接和视觉节奏变化。材质与细节真实可信，特效服务画面不喧宾夺主，色彩与氛围统一。`);
        const charPrompts = this._getSbCharPrompts();
        const prompt = `${basePrompt}${charPrompts}\n\n【用户输入】\n${scene.slice(0, 2000)}`;

        let result = '';
        const resultEl = document.getElementById('cs-sb-result');
        if (resultEl) resultEl.innerHTML = '<div class="text-dim text-xs flex items-center gap-2 p-4"><i class="fa-solid fa-spinner fa-spin"></i>AI正在拆解分镜，请稍候...</div>';

        try {
            await AI.generate(prompt, {}, c => {
                result += c;
                if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">${typeof marked !== 'undefined' ? marked.parse(result) : result}</div>`;
            });
            this._storyboardResult = result;
            // 尝试解析镜头数据
            this._parseShots(result);
            UI.toast('分镜生成完成 ✓', 'success');
        } catch(e) {
            UI.toast('生成分镜失败: ' + e.message, 'error');
        }
    },

    _parseShots(text) {
        const shots = [];
        const blocks = text.split(/(?=镜号[:：]|第\d+镜|镜\d+)/);
        blocks.forEach(block => {
            const num = block.match(/镜号[:：]\s*(\d+)|第(\d+)镜|镜(\d+)/);
            const shot = block.match(/景别[:：]\s*([^\n]+)/);
            const angle = block.match(/机位[\/角度]*[:：]\s*([^\n]+)/);
            const camera = block.match(/运镜[:：]\s*([^\n]+)/);
            const content = block.match(/画面内容[:：]\s*([^\n]+(?:\n(?!镜号|景别|机位|运镜|时长|对白|音效|情绪|画面提示词)[^\n]+)*)/);
            const time = block.match(/时长[:：]\s*([^\n]+)/);
            const prompt = block.match(/画面提示词[:：]\s*([^\n]+)/);
            if (num) {
                shots.push({
                    num: num[1] || num[2] || num[3],
                    shot: shot ? shot[1].trim() : '',
                    angle: angle ? angle[1].trim() : '',
                    camera: camera ? camera[1].trim() : '',
                    content: content ? content[1].trim() : '',
                    time: time ? time[1].trim() : '',
                    prompt: prompt ? prompt[1].trim() : ''
                });
            }
        });
        this._storyboardShots = shots;
    },

    _exportSbPrompts() {
        if (!this._storyboardShots || !this._storyboardShots.length) {
            return UI.toast('请先生成分镜');
        }
        const prompts = this._storyboardShots.map((s, i) => `镜${s.num}: ${s.prompt || s.content}`).join('\n\n');
        navigator.clipboard.writeText(prompts).then(() => UI.toast('画面提示词已复制到剪贴板'));
    },

    async _saveStoryboard() {
        const resultEl = document.getElementById('cs-sb-result');
        const content = resultEl ? resultEl.innerText : '';
        if (!content.trim()) return UI.toast('无内容可保存');
        const id = 'sb_' + Utils.uuid();
        await DB.put('library_books', { id, name: '分镜_' + new Date().toLocaleDateString(), content, size: content.length, date: new Date().toLocaleDateString(), type: 'storyboard' });
        UI.toast('分镜已保存到阅读中心');
    }
});
