// creative_video.js — 视频生成提示词 (Video Prompt Engineer)
// 图生视频 / 文生视频 提示词生成
// 支持 Kling / Runway Gen-2 / Pika / 可灵 等主流视频模型
Object.assign(Modules.creative_studio, {
    _videoResult: '',
    _videoMode: 'text2video', // text2video | image2video

    _renderVideoTab() {
        return `
        <div class="flex flex-col h-full overflow-hidden">
            <div class="shrink-0 p-4 border-b border-white/5 bg-gradient-to-r from-fuchsia-900/20 to-transparent">
                <div class="flex items-center gap-2 mb-1">
                    <i class="fa-solid fa-video text-fuchsia-400"></i>
                    <span class="font-bold text-white text-sm">视频生成</span>
                    <span class="text-[9px] text-dim bg-white/5 px-1.5 py-0.5 rounded">v1.0</span>
                </div>
                <div class="flex items-center justify-between">
                    <div class="text-[10px] text-dim">文生视频/图生视频专业提示词生成（Kling/Runway/Pika/可灵）</div>
                    ${Modules.creative_studio._renderPromptEditButton('video','视频生成')}
                </div>
            </div>
            <div class="flex-1 flex min-h-0">
                <div class="w-[42%] flex flex-col border-r border-white/5 p-4 gap-3 overflow-y-auto">
                    <div class="flex gap-2">
                        <button class="flex-1 px-3 py-2 rounded-lg text-[11px] font-bold transition-all ${this._videoMode==='text2video' ? 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30' : 'bg-white/5 text-dim hover:bg-white/10'}" onclick="Modules.creative_studio._setVideoMode('text2video')">文生视频</button>
                        <button class="flex-1 px-3 py-2 rounded-lg text-[11px] font-bold transition-all ${this._videoMode==='image2video' ? 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30' : 'bg-white/5 text-dim hover:bg-white/10'}" onclick="Modules.creative_studio._setVideoMode('image2video')">图生视频</button>
                    </div>
                    <div class="space-y-1">
                        <div class="flex justify-between">
                            <label class="text-xs font-bold text-white">${this._videoMode==='text2video' ? '视频描述' : '图片内容描述'}</label>
                            <button class="text-[9px] text-rose-400 hover:text-rose-300" onclick="Modules.creative_studio._importFromStoryboard()"><i class="fa-solid fa-film mr-0.5"></i>从分镜导入</button>
                        </div>
                        <textarea id="cs-vid-input" class="w-full bg-[#0a0a0c] border border-white/10 rounded-lg p-3 text-xs text-main resize-none h-24 focus:border-fuchsia-500/50 focus:outline-none" placeholder="${this._videoMode==='text2video' ? '描述你想生成的视频场景，如：雨夜古庙，一位黑衣剑客缓缓拔剑，闪电照亮他的侧脸...' : '描述你提供的图片内容，以及希望视频如何动起来...'}"></textarea>
                    </div>
                    <div class="space-y-1">
                        <span class="text-[10px] text-dim font-bold"><i class="fa-solid fa-users mr-1 text-teal-400"></i>角色一致性锁定</span>
                        <div class="flex flex-wrap gap-1" id="cs-vid-chars-selected">
                            ${(this._vidSelectedChars || []).map(cid => {
                                const ch = this._lookbookChars.find(x => x.id === cid);
                                return ch ? `<span class="text-[9px] px-1.5 py-0.5 rounded bg-teal-500/15 text-teal-400 border border-teal-500/20 cursor-pointer" onclick="Modules.creative_studio._removeVidChar('${cid}')">${ch.name} <i class="fa-solid fa-xmark"></i></span>` : '';
                            }).join('')}
                        </div>
                        <select id="cs-vid-char-select" class="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-[10px] text-main focus:border-fuchsia-500/50 focus:outline-none" onchange="Modules.creative_studio._addVidChar(this.value);this.value=''">
                            <option value="">+ 从角色库添加（确保视频中角色外观一致）</option>
                            ${this._lookbookChars.map(ch => `<option value="${ch.id}">${ch.name} · ${ch.role || '角色'}</option>`).join('')}
                        </select>
                    </div>
                    <div class="space-y-1">
                        <label class="text-xs font-bold text-white">镜头运动</label>
                        <select id="cs-vid-camera" class="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-xs text-main focus:border-fuchsia-500/50 focus:outline-none">
                            <option value="push_in">推近 (Push In)</option>
                            <option value="pull_out">拉远 (Pull Out)</option>
                            <option value="pan_left">左摇 (Pan Left)</option>
                            <option value="pan_right">右摇 (Pan Right)</option>
                            <option value="tilt_up">上摇 (Tilt Up)</option>
                            <option value="tilt_down">下摇 (Tilt Down)</option>
                            <option value="dolly_left">左移 (Dolly Left)</option>
                            <option value="dolly_right">右移 (Dolly Right)</option>
                            <option value="orbit">环绕 (Orbit)</option>
                            <option value="static">固定 (Static)</option>
                            <option value="handheld">手持 (Handheld)</option>
                            <option value="crane_up">升镜 (Crane Up)</option>
                            <option value="crane_down">降镜 (Crane Down)</option>
                        </select>
                    </div>
                    <div class="space-y-1">
                        <label class="text-xs font-bold text-white">视频时长</label>
                        <select id="cs-vid-duration" class="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-xs text-main focus:border-fuchsia-500/50 focus:outline-none">
                            <option value="3s">3秒（短视频/表情包）</option>
                            <option value="5s" selected>5秒（标准片段）</option>
                            <option value="10s">10秒（长镜头）</option>
                        </select>
                    </div>
                    <div class="space-y-1">
                        <label class="text-xs font-bold text-white">目标模型</label>
                        <select id="cs-vid-model" class="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-xs text-main focus:border-fuchsia-500/50 focus:outline-none">
                            <option value="kling">可灵 (Kling) — 国产最强，动态自然</option>
                            <option value="runway">Runway Gen-3 — 电影级画质</option>
                            <option value="pika">Pika Labs — 创意风格化</option>
                            <option value="luma">Luma Dream Machine — 物理真实</option>
                            <option value="hailuo">海螺AI (Hailuo) — 人物一致性好</option>
                        </select>
                    </div>
                    <div class="space-y-1">
                        <label class="text-xs font-bold text-white">运动强度</label>
                        <select id="cs-vid-motion" class="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-xs text-main focus:border-fuchsia-500/50 focus:outline-none">
                            <option value="low">低 — 微动、呼吸感、氛围</option>
                            <option value="medium" selected>中 — 自然运动、人物动作</option>
                            <option value="high">高 — 剧烈运动、战斗、奔跑</option>
                        </select>
                    </div>
                    <button class="btn bg-fuchsia-600/20 text-fuchsia-400 border-fuchsia-600/30 hover:bg-fuchsia-600/30 font-bold text-xs py-2.5 rounded-xl" onclick="Modules.creative_studio._runVideoPrompt()">
                        <i class="fa-solid fa-wand-magic-sparkles mr-1"></i>生成视频提示词
                    </button>
                </div>
                <div class="flex-1 flex flex-col p-4 gap-3 overflow-hidden">
                    <div class="flex items-center justify-between">
                        <label class="text-xs font-bold text-white">生成的提示词</label>
                        <div class="flex gap-1">
                            <button class="text-[10px] text-dim hover:text-white transition px-2 py-1" onclick="Modules.creative_studio._copyVideoResult()"><i class="fa-solid fa-copy mr-1"></i>复制</button>
                            <button class="text-[10px] text-dim hover:text-white transition px-2 py-1" onclick="Modules.creative_studio._saveVideoResult()"><i class="fa-solid fa-save mr-1"></i>保存</button>
                        </div>
                    </div>
                    <div id="cs-vid-result" class="flex-1 min-h-0 bg-[#0a0a0c] border border-white/10 rounded-lg p-3 text-xs text-main overflow-y-auto"></div>
                </div>
            </div>
        </div>`;
    },

    _setVideoMode(mode) {
        this._videoMode = mode;
        this.switchTab('video');
    },

    _vidSelectedChars: [],

    _addVidChar(id) {
        if (!id) return;
        if (!this._vidSelectedChars.includes(id)) {
            this._vidSelectedChars.push(id);
            this.switchTab('video');
        }
    },

    _removeVidChar(id) {
        this._vidSelectedChars = this._vidSelectedChars.filter(x => x !== id);
        this.switchTab('video');
    },

    _importFromStoryboard() {
        if (!this._storyboardResult) return UI.toast('请先在「分镜设计」中生成场景');
        const inputEl = document.getElementById('cs-vid-input');
        if (inputEl) {
            inputEl.value = '[从分镜设计导入]\n\n' + this._storyboardResult.slice(0, 1500);
            UI.toast('已导入分镜场景描述');
        }
    },

    _getVidCharPrompts() {
        if (!this._vidSelectedChars.length) return '';
        let text = '\n\n【角色一致性锁定（视频提示词必须遵守）】\n';
        this._vidSelectedChars.forEach(cid => {
            const ch = this._lookbookChars.find(x => x.id === cid);
            if (ch) {
                text += `角色「${ch.name}」外观锁定：${ch.hair}，${ch.eyes}，${ch.clothing}，${ch.feature}。`;
                if (ch.prompt) text += ` 参考prompt：${ch.prompt.slice(0, 200)}`;
                text += '\n';
            }
        });
        text += '\n视频中必须确保以上角色的外观、服装、发型、面部特征完全一致，不能有任何变化。';
        return text;
    },

    async _runVideoPrompt() {
        const input = (document.getElementById('cs-vid-input') || {}).value || '';
        if (!input.trim()) return UI.toast('请输入描述');
        const camera = (document.getElementById('cs-vid-camera') || {}).value || 'push_in';
        const duration = (document.getElementById('cs-vid-duration') || {}).value || '5s';
        const model = (document.getElementById('cs-vid-model') || {}).value || 'kling';
        const motion = (document.getElementById('cs-vid-motion') || {}).value || 'medium';
        const resultEl = document.getElementById('cs-vid-result');
        if (resultEl) resultEl.innerHTML = '<div class="text-dim text-xs flex items-center gap-2"><i class="fa-solid fa-spinner fa-spin"></i>正在生成视频提示词...</div>';

        const modelDesc = {
            kling: '可灵(Kling)：国产最强视频模型，擅长自然动态、人物动作、物理真实。推荐提示词风格：详细描述主体运动、环境变化、光影演变。',
            runway: 'Runway Gen-3：电影级画质，擅长艺术风格、创意镜头。推荐提示词风格：强调构图、色彩、氛围、电影感。',
            pika: 'Pika Labs：创意风格化强，支持多种艺术风格转换。推荐提示词风格：可以加入风格关键词（anime/cinematic/paint等）。',
            luma: 'Luma Dream Machine：物理真实感强，3D空间理解好。推荐提示词风格：强调空间关系、物理运动、光影真实。',
            hailuo: '海螺AI(Hailuo)：人物一致性好，适合角色视频。推荐提示词风格：详细描述人物外貌、动作、表情变化。'
        };

        const cameraDesc = {
            push_in: '镜头缓慢推近主体，营造紧张/聚焦感',
            pull_out: '镜头拉远， reveal 更大场景，营造震撼/孤独感',
            pan_left: '镜头向左平摇，展示横向空间',
            pan_right: '镜头向右平摇，展示横向空间',
            tilt_up: '镜头向上仰摇，展示高大/宏伟',
            tilt_down: '镜头向下俯摇，展示渺小/俯视',
            dolly_left: '镜头向左横移（dolly），跟随主体',
            dolly_right: '镜头向右横移（dolly），跟随主体',
            orbit: '镜头环绕主体旋转，360度展示',
            static: '固定机位，主体在画面中运动',
            handheld: '手持摄影的轻微晃动，增强真实感',
            crane_up: '镜头上升（crane up），营造疏离/升华感',
            crane_down: '镜头下降（crane down），营造压迫/降临感'
        };

        const basePrompt = Modules.creative_studio._getPrompt('video', `你是一位AI视频生成提示词工程师。请根据用户提供的描述，生成适合AI视频生成模型使用的专业视频提示词。

【视频提示词核心原则】
1. 主体明确：清晰描述谁在画面中，在做什么
2. 运动具体：不是"人物在动"，而是"人物缓缓抬起头，眼神从迷茫转为坚定"
3. 环境演变：描述环境如何随时间变化（雨变大、天变暗、雾散去）
4. 镜头语言：明确指定镜头运动方式
5. 物理真实：遵循物理规律，避免不合理的运动
6. 时间感：描述动作的速度和节奏（缓慢/急促/渐变）

【镜头运动词汇库】
- 推近/拉远：push in / pull out / dolly zoom
- 平移：pan left/right, dolly left/right, truck
- 升降：crane up/down, pedestal up/down
- 环绕：orbit, arc shot
- 手持：handheld, shaky cam
- 固定：static, locked-off

【时间描述词汇】
- 缓慢：slowly, gradually, gently
- 急促：rapidly, suddenly, abruptly
- 渐变：fading into, transitioning to, morphing

【负面约束】
- 避免快速切换（除非明确要求）
- 避免主体变形或断裂
- 避免不合理的物理运动
- 避免文字出现在画面中（除非明确要求）`);

        const modePrefix = this._videoMode === 'text2video'
            ? '[文生视频模式]\n请根据以下描述，生成一段完整的视频生成提示词。'
            : '[图生视频模式]\n请根据以下图片内容描述，生成一段图生视频提示词。图生视频需要特别注意：\n1. 保持图片中主体的外观一致性\n2. 描述主体如何从静态变为动态\n3. 描述环境如何随时间演变\n4. 镜头运动不能破坏原图构图';

        const charPrompts = this._getVidCharPrompts();
        const prompt = `${basePrompt}${charPrompts}

${modePrefix}

【用户输入】
${input}

【参数设置】
- 镜头运动：${cameraDesc[camera] || camera}
- 视频时长：${duration}
- 目标模型：${modelDesc[model] || model}
- 运动强度：${motion}

请输出：
1. 场景分析（主体、环境、氛围）
2. 完整的英文视频提示词（200-500词，适合${model}模型）
3. 镜头运动详细描述
4. 时间线分解（每1秒发生什么）
5. 负面约束词（Negative Prompt）
6. 推荐的生成参数（如果适用）`;

        let result = '';
        try {
            await AI.generate(prompt, {}, chunk => {
                result += chunk;
                if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">${typeof marked !== 'undefined' ? marked.parse(result) : result}</div>`;
            });
            this._videoResult = result;
            UI.toast('视频提示词生成完成 ✓', 'success');
        } catch(e) {
            UI.toast('生成失败: ' + e.message, 'error');
        }
    },

    _copyVideoResult() {
        if (!this._videoResult) return UI.toast('无内容可复制');
        navigator.clipboard.writeText(this._videoResult).then(() => UI.toast('已复制到剪贴板'));
    },

    async _saveVideoResult() {
        if (!this._videoResult) return UI.toast('无内容可保存');
        const id = 'vid_' + Utils.uuid();
        await DB.put('library_books', { id, name: '视频提示词_' + new Date().toLocaleDateString(), content: this._videoResult, size: this._videoResult.length, date: new Date().toLocaleDateString(), type: 'video' });
        UI.toast('已保存到阅读中心');
    }
});
