// creative_comic.js — 漫画生成器完整实现 (Comic Generator)
// 对标: 文镜画师 文字即分镜 + 千绘AI 分镜生成
// 文本→漫画页面（分格布局/画面描述/对话气泡/SFX）
Object.assign(Modules.creative_studio, {
    _comicResult: null,
    _comicPages: [],
    _cmStyle: 'shonen',

    _renderComic() {
        const styles = [
            { id: 'shonen', label: '少年漫', desc: '粗线条、动态动作、速度线', icon: 'fa-fire', color: 'orange' },
            { id: 'shojo', label: '少女漫', desc: '柔和线条、花卉、情感特写', icon: 'fa-heart', color: 'pink' },
            { id: 'seinen', label: '青年漫', desc: '详细解剖、重阴影、电影构图', icon: 'fa-skull', color: 'gray' },
            { id: 'daily', label: '日常漫', desc: '简洁线条、温暖表情、治愈', icon: 'fa-mug-hot', color: 'green' },
            { id: 'chibi', label: 'Q版/喜剧', desc: '超变形、夸张反应、萌系', icon: 'fa-face-laugh-beam', color: 'yellow' },
            { id: 'guofeng', label: '国风漫', desc: '水墨意境、古风服饰、飘逸', icon: 'fa-dragon', color: 'red' },
            { id: 'webtoon', label: '条漫', desc: '竖向长条、手机适配、渐变', icon: 'fa-mobile-screen', color: 'purple' }
        ];
        return `
        <div class="flex flex-col h-full overflow-hidden">
            <div class="shrink-0 flex items-center justify-between px-5 bg-[#0d0d0f] border-b border-white/5">
                <div>
                    <span class="text-xs font-bold text-pink-400"><i class="fa-solid fa-mask mr-1"></i>漫画生成器</span>
                    <div class="flex items-center justify-between mt-0.5">
                        <div class="text-[10px] text-dim">将情节改编为漫画脚本与分格设计</div>
                        ${Modules.creative_studio._renderPromptEditButton('comic','漫剧脚本')}
                    </div>
                </div>
                <div class="flex gap-2">
                    <button class="btn btn-xs bg-pink-600/20 text-pink-400 border-pink-600/30" onclick="Modules.creative_studio._aiComicScript()"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>AI生成漫画</button>
                    <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30" onclick="Modules.creative_studio._enhanceCmImagePrompts()"><i class="fa-solid fa-wand-magic mr-1"></i>增强画面提示词</button>
                    <button class="btn btn-xs bg-blue-600/20 text-blue-400 border-blue-600/30" onclick="Modules.creative_studio._saveComicScript()"><i class="fa-solid fa-save mr-1"></i>保存</button>
                    <button class="btn btn-xs bg-emerald-600/20 text-emerald-400 border-emerald-600/30" onclick="Modules.creative_studio._exportCmPrompts()"><i class="fa-solid fa-image mr-1"></i>导出提示词</button>
                </div>
            </div>
            <div class="flex-1 flex min-h-0">
                <!-- 左侧配置 -->
                <div class="w-72 shrink-0 border-r border-white/5 flex flex-col bg-[#0d0d0f] p-3 space-y-3 overflow-y-auto">
                    <div class="space-y-1">
                        <span class="text-[10px] text-dim font-bold">故事/情节</span>
                        <textarea id="cs-cm-scene" class="textarea bg-black/30 border-white/10 text-gray-300 w-full h-28 text-xs resize-none focus:border-pink-500/50 focus:outline-none" placeholder="输入需要漫画化的故事段落。建议包含：人物动作、对话情绪、场景转换、关键画面..."></textarea>
                    </div>
                    <div class="space-y-1">
                        <span class="text-[10px] text-dim font-bold">漫画风格</span>
                        <div class="grid grid-cols-2 gap-1.5">
                            ${styles.map(s => `
                                <button class="p-2 rounded-lg border text-left transition-all ${this._cmStyle===s.id ? 'bg-'+s.color+'-500/15 border-'+s.color+'-500/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}"
                                    onclick="Modules.creative_studio._setCmStyle('${s.id}')">
                                    <div class="flex items-center gap-1.5">
                                        <i class="fa-solid ${s.icon} text-[9px] ${this._cmStyle===s.id ? 'text-'+s.color+'-400' : 'text-dim'}"></i>
                                        <span class="text-[10px] font-bold ${this._cmStyle===s.id ? 'text-white' : 'text-dim'}">${s.label}</span>
                                    </div>
                                    <div class="text-[8px] text-dim mt-0.5">${s.desc}</div>
                                </button>
                            `).join('')}
                        </div>
                        <div class="mt-1.5">
                            <span class="text-[9px] text-dim">自定义风格描述（可选）</span>
                            <input id="cs-cm-custom-style" class="w-full bg-black/30 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-main focus:border-pink-500/50 focus:outline-none" placeholder="如：宫崎骏+赛博朋克融合、复古美式漫画...">
                        </div>
                    </div>
                    <div class="space-y-1">
                        <span class="text-[10px] text-dim font-bold">页面格数</span>
                        <select id="cs-cm-panels" class="input bg-black/30 border-white/10 text-white w-full text-xs">
                            <option value="4">4格 (极简)</option>
                            <option value="6">6格 (快节奏)</option>
                            <option value="8" selected>8格 (标准)</option>
                            <option value="12">12格 (详细)</option>
                            <option value="16">16格 (复杂)</option>
                        </select>
                    </div>
                    <div class="space-y-1">
                        <span class="text-[10px] text-dim font-bold">页面数量</span>
                        <select id="cs-cm-pages" class="input bg-black/30 border-white/10 text-white w-full text-xs">
                            <option value="1" selected>1页</option>
                            <option value="3">3页 (短篇)</option>
                            <option value="5">5页 (中篇)</option>
                            <option value="10">10页 (长片段)</option>
                        </select>
                    </div>
                    <div class="space-y-1">
                        <span class="text-[10px] text-dim font-bold">阅读方向</span>
                        <select id="cs-cm-direction" class="input bg-black/30 border-white/10 text-white w-full text-xs">
                            <option value="rtl">从右到左（日式/国漫）</option>
                            <option value="ltr">从左到右（美漫/条漫）</option>
                        </select>
                    </div>
                    <div class="space-y-1">
                        <span class="text-[10px] text-dim font-bold"><i class="fa-solid fa-users mr-1 text-teal-400"></i>关联角色（确保一致性）</span>
                        <div class="flex flex-wrap gap-1" id="cs-cm-chars-selected">
                            ${(this._cmSelectedChars || []).map(cid => {
                                const ch = this._lookbookChars.find(x => x.id === cid);
                                return ch ? `<span class="text-[9px] px-1.5 py-0.5 rounded bg-teal-500/15 text-teal-400 border border-teal-500/20 cursor-pointer" onclick="Modules.creative_studio._removeCmChar('${cid}')">${ch.name} <i class="fa-solid fa-xmark"></i></span>` : '';
                            }).join('')}
                        </div>
                        <select id="cs-cm-char-select" class="input bg-black/30 border-white/10 text-white w-full text-[10px]" onchange="Modules.creative_studio._addCmChar(this.value);this.value=''">
                            <option value="">+ 从角色库添加</option>
                            ${this._lookbookChars.map(ch => `<option value="${ch.id}">${ch.name} · ${ch.role || '角色'}</option>`).join('')}
                        </select>
                    </div>
                    <div class="p-2 bg-pink-500/10 border border-pink-500/20 rounded-lg">
                        <div class="text-[9px] text-pink-300 font-bold mb-1"><i class="fa-solid fa-circle-info mr-1"></i>漫画分格术语</div>
                        <div class="text-[8px] text-dim leading-relaxed">
                            景别: 远景/中景/近景/特写<br>
                            格型: 跨页/出血格/圆格/无边框<br>
                            SFX: 拟声词/音效字设计
                        </div>
                    </div>
                </div>
                <!-- 右侧结果区 -->
                <div class="flex-1 overflow-y-auto p-4" id="cs-cm-result-area">
                    <div id="cs-cm-result" class="space-y-3"></div>
                </div>
            </div>
        </div>`;
    },

    _setCmStyle(id) {
        this._cmStyle = id;
        this.switchTab('comic');
    },

    _cmSelectedChars: [],

    _addCmChar(id) {
        if (!id) return;
        if (!this._cmSelectedChars.includes(id)) {
            this._cmSelectedChars.push(id);
            this.switchTab('comic');
        }
    },

    _removeCmChar(id) {
        this._cmSelectedChars = this._cmSelectedChars.filter(x => x !== id);
        this.switchTab('comic');
    },

    _getCmCharPrompts() {
        if (!this._cmSelectedChars.length) return '';
        let text = '\n\n【关联角色外观锁定（画面提示词必须遵守）】\n';
        this._cmSelectedChars.forEach(cid => {
            const ch = this._lookbookChars.find(x => x.id === cid);
            if (ch) {
                text += `角色「${ch.name}」：${ch.hair}，${ch.eyes}，${ch.clothing}，${ch.feature}。气质：${ch.vibe}。`;
                if (ch.prompt) text += ` 图像参考：${ch.prompt.slice(0, 200)}`;
                text += '\n';
            }
        });
        return text;
    },

    async _aiComicScript() {
        const scene = (document.getElementById('cs-cm-scene') || {}).value || '';
        if (!scene.trim()) return UI.toast('请输入原作情节');
        const style = this._cmStyle;
        const panels = +(document.getElementById('cs-cm-panels') || {}).value || 8;
        const pages = +(document.getElementById('cs-cm-pages') || {}).value || 1;
        const direction = (document.getElementById('cs-cm-direction') || {}).value || 'rtl';

        const styleDesc = {
            shonen: '少年漫画风格：粗线条、动态动作、速度线、强调冲击力',
            shojo: '少女漫画风格：柔和线条、花卉装饰、情感特写、梦幻氛围',
            seinen: '青年漫画风格：详细解剖、重阴影、电影构图、现实主义',
            daily: '日常漫画风格：简洁线条、温暖表情、治愈氛围、轻松幽默',
            chibi: 'Q版/喜剧风格：超变形比例、夸张反应、萌系元素、搞笑氛围',
            guofeng: '国风漫画风格：水墨意境、古风服饰、飘逸线条、东方美学',
            webtoon: '条漫风格：竖向长条布局、手机适配、渐变过渡、连续画面'
        };
        const customStyle = (document.getElementById('cs-cm-custom-style') || {}).value || '';
        const finalStyle = customStyle || (styleDesc[style] || style);
        const dirDesc = { rtl: '从右到左阅读（日式/国漫传统）', ltr: '从左到右阅读（美漫/现代条漫）' };

        const basePrompt = Modules.creative_studio._getPrompt('comic', `你执行真值执行协议影视化转制层(M10) + 漫画分镜专业协议。

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

【镜头语言七法则】
1. 权力赋予镜头：低角度仰拍+平稳推近
2. 压迫与窥视镜头：手持晃动+框景构图
3. 评估与审视镜头：缓慢横移或静止固定
4. 亲密/威胁镜头：大特写，聚焦局部细节
5. 权力关系镜头：主角处于视觉中心
6. 混乱爆发节奏：快速剪辑(<2s/镜)
7. 掌控从容节奏：长镜头(>10s)

【去AI味协议】
- 禁情绪标签：不写"他很愤怒"，必须动作/环境/对话呈现
- 禁解释癖：禁用"这意味着…/换句话说…/其实…"
- 对话必须有功能：推进剧情/塑造性格/埋伏笔/制造情绪
- 对话必须有潜台词：让角色说A，但读者听出B

【漫画脚本规范】
请将以下情节改编为漫画脚本，共${pages}页，每页${panels}格。

【风格】${finalStyle}
【阅读方向】${dirDesc[direction]}

每页必须包含：
- 页面编号
- 分格布局说明（如：上3下3，左大右小等）
- 每格详细内容：格号、景别、画面描述（150字内）、角色（表情/动作）、对白/旁白（「」标注）、音效字/SFX、画面提示词（英文60词内）

请确保：
1. 画面有视觉节奏变化（大格小格交替）
2. 关键画面用跨页或大格强调
3. 对话气泡位置合理，不遮挡重要画面
4. 每页结尾有翻页动力
5. 画面提示词包含风格关键词和角色外观描述
6. 材质与细节真实可信，特效服务画面不喧宾夺主`);
        const charPrompts = this._getCmCharPrompts();
        const prompt = `${basePrompt}${charPrompts}\n\n【用户输入】\n${scene.slice(0, 2500)}`;

        let result = '';
        const resultEl = document.getElementById('cs-cm-result');
        if (resultEl) resultEl.innerHTML = '<div class="text-dim text-xs flex items-center gap-2 p-4"><i class="fa-solid fa-spinner fa-spin"></i>AI正在生成漫画脚本，请稍候...</div>';

        try {
            await AI.generate(prompt, {}, c => {
                result += c;
                if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">${typeof marked !== 'undefined' ? marked.parse(result) : result}</div>`;
            });
            this._comicResult = result;
            this._parseComicPages(result);
            UI.toast('漫画脚本生成完成 ✓', 'success');
        } catch(e) {
            UI.toast('生成脚本失败: ' + e.message, 'error');
        }
    },

    _parseComicPages(text) {
        const pages = [];
        const pageBlocks = text.split(/(?=第\d+页|页面\s*\d+|Page\s*\d+)/i);
        pageBlocks.forEach(block => {
            const pageNum = block.match(/第(\d+)页|页面\s*(\d+)|Page\s*(\d+)/i);
            const panels = [];
            const panelBlocks = block.split(/(?=第\d+格|格\d+|Panel\s*\d+)/i);
            panelBlocks.forEach(pb => {
                const num = pb.match(/第(\d+)格|格(\d+)|Panel\s*(\d+)/i);
                const shot = pb.match(/景别[:：]\s*([^\n]+)/);
                const content = pb.match(/画面描述[:：]\s*([^\n]+(?:\n(?!第\d+格|格\d+|Panel)[^\n]+)*)/);
                const chars = pb.match(/角色[:：]\s*([^\n]+)/);
                const dialogue = pb.match(/对白[\/旁白]*[:：]\s*([^\n]+)/);
                const sfx = pb.match(/音效[\/SFX]*[:：]\s*([^\n]+)/);
                const prompt = pb.match(/画面提示词[:：]\s*([^\n]+)/);
                if (num) {
                    panels.push({ num: num[1] || num[2] || num[3], shot: shot?.[1]?.trim(), content: content?.[1]?.trim(), chars: chars?.[1]?.trim(), dialogue: dialogue?.[1]?.trim(), sfx: sfx?.[1]?.trim(), prompt: prompt?.[1]?.trim() });
                }
            });
            if (pageNum) pages.push({ num: pageNum[1] || pageNum[2] || pageNum[3], panels });
        });
        this._comicPages = pages;
    },

    _exportCmPrompts() {
        if (!this._comicPages || !this._comicPages.length) return UI.toast('请先生成漫画脚本');
        let prompts = [];
        this._comicPages.forEach(p => {
            p.panels.forEach(panel => {
                if (panel.prompt) prompts.push(`P${p.num}-G${panel.num}: ${panel.prompt}`);
            });
        });
        if (!prompts.length) return UI.toast('未找到画面提示词');
        navigator.clipboard.writeText(prompts.join('\n\n')).then(() => UI.toast('画面提示词已复制到剪贴板'));
    },

    async _enhanceCmImagePrompts() {
        if (!this._comicPages || !this._comicPages.length) return UI.toast('请先生成漫画脚本');
        const resultEl = document.getElementById('cs-cm-result');
        if (resultEl) resultEl.innerHTML = '<div class="text-dim text-xs flex items-center gap-2 p-4"><i class="fa-solid fa-spinner fa-spin"></i>正在增强画面提示词...</div>';

        const styleDesc = {
            shonen: '少年漫画风格：粗线条、动态动作、速度线、强调冲击力',
            shojo: '少女漫画风格：柔和线条、花卉装饰、情感特写、梦幻氛围',
            seinen: '青年漫画风格：详细解剖、重阴影、电影构图、现实主义',
            daily: '日常漫画风格：简洁线条、温暖表情、治愈氛围、轻松幽默',
            chibi: 'Q版/喜剧风格：超变形比例、夸张反应、萌系元素、搞笑氛围',
            guofeng: '国风漫画风格：水墨意境、古风服饰、飘逸线条、东方美学',
            webtoon: '条漫风格：竖向长条布局、手机适配、渐变过渡、连续画面'
        };

        let allPrompts = [];
        this._comicPages.forEach(p => {
            p.panels.forEach(panel => {
                if (panel.prompt || panel.content) {
                    allPrompts.push({
                        page: p.num,
                        grid: panel.num,
                        shot: panel.shot || '',
                        content: panel.content || '',
                        chars: panel.chars || '',
                        originalPrompt: panel.prompt || ''
                    });
                }
            });
        });

        if (!allPrompts.length) return UI.toast('未找到可处理的画面');

        const basePrompt = `你是一位AI图像生成提示词工程师（Midjourney/Stable Diffusion/即梦/可灵专家）。
请将以下漫画分镜转换为专业级的英文图像生成提示词。

【漫画风格】${styleDesc[this._cmStyle] || this._cmStyle}

【转换规则】
1. 每个提示词80-120个英文单词
2. 包含角色详细外观、表情、动作、服装
3. 包含场景环境、光影、氛围
4. 包含构图（景别、角度）
5. 包含风格关键词和质量参数
6. 使用具体名词而非抽象描述
7. 添加负面约束词（不需要的元素）

【输出格式】
P{页码}-G{格号}:
[英文提示词]
--ar 16:9 --v 6 --style raw

【负面约束】
--no text, watermark, signature, blurry, low quality, distorted anatomy, extra limbs`;

        let fullResult = '# 漫画画面生成提示词\n\n> 风格: ' + (styleDesc[this._cmStyle] || this._cmStyle) + '\n> 生成时间: ' + new Date().toLocaleString() + '\n\n---\n\n';

        try {
            for (let i = 0; i < allPrompts.length; i++) {
                const p = allPrompts[i];
                if (resultEl) resultEl.innerHTML = `<div class="text-orange-400 text-xs flex items-center gap-2 p-4"><i class="fa-solid fa-spinner fa-spin"></i>正在处理 ${i+1}/${allPrompts.length}: P${p.page}-G${p.grid}...</div>`;

                const prompt = `${basePrompt}\n\n【原始信息】\n页码: P${p.page}-G${p.grid}\n景别: ${p.shot}\n画面描述: ${p.content}\n角色: ${p.chars}\n原始提示词: ${p.originalPrompt}\n\n请输出P${p.page}-G${p.grid}的专业英文图像生成提示词。`;

                let res = '';
                await AI.generate(prompt, {}, c => { res += c; });
                fullResult += res + '\n\n---\n\n';
            }

            if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">${typeof marked !== 'undefined' ? marked.parse(fullResult) : fullResult}</div>`;
            this._comicResult = fullResult;
            UI.toast('画面提示词增强完成 ✓', 'success');
        } catch(e) {
            UI.toast('增强失败: ' + e.message, 'error');
        }
    },

    async _saveComicScript() {
        const resultEl = document.getElementById('cs-cm-result');
        const content = resultEl ? resultEl.innerText : '';
        if (!content.trim()) return UI.toast('无内容可保存');
        const id = 'cm_' + Utils.uuid();
        await DB.put('library_books', { id, name: '漫画_' + new Date().toLocaleDateString(), content, size: content.length, date: new Date().toLocaleDateString(), type: 'comic' });
        UI.toast('漫画脚本已保存到阅读中心');
    }
});
