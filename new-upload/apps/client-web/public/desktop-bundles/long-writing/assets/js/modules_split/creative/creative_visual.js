// creative_visual.js — 通用视觉提示词 (Visual Prompt Architect)
// 基于《通用视觉提示词 Agent v1》第一性原理拆解
// 输入主题 → 推理结构 → 选择视觉容器 → 生成专业图像提示词
Object.assign(Modules.creative_studio, {
    _visualResult: '',
    _visualAspectRatio: '3:4',

    _renderVisualTab() {
        return `
        <div class="flex flex-col h-full overflow-hidden">
            <div class="shrink-0 p-4 border-b border-white/5 bg-gradient-to-r from-indigo-900/20 to-transparent">
                <div class="flex items-center gap-2 mb-1">
                    <i class="fa-solid fa-eye text-indigo-400"></i>
                    <span class="font-bold text-white text-sm">通用视觉提示词</span>
                    <span class="text-[9px] text-dim bg-white/5 px-1.5 py-0.5 rounded">v1.0</span>
                </div>
                <div class="flex items-center justify-between">
                    <div class="text-[10px] text-dim">主题→推理→视觉容器→专业图像提示词（知识可视化策展）</div>
                    ${Modules.creative_studio._renderPromptEditButton('visual','通用视觉提示词')}
                </div>
            </div>
            <div class="flex-1 flex min-h-0">
                <div class="w-[42%] flex flex-col border-r border-white/5 p-4 gap-3">
                    <div class="space-y-1">
                        <label class="text-xs font-bold text-white">主题 / 概念</label>
                        <input id="cs-vis-topic" class="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-xs text-main focus:border-indigo-500/50 focus:outline-none" placeholder="如：西方艺术演进史、西游记角色百科、蒸汽朋克机械心脏...">
                    </div>
                    <div class="space-y-1">
                        <label class="text-xs font-bold text-white">主题类型</label>
                        <select id="cs-vis-type" class="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-xs text-main focus:border-indigo-500/50 focus:outline-none">
                            <option value="history">历史演进</option>
                            <option value="science">科学百科</option>
                            <option value="character">人物传记</option>
                            <option value="literature">文学角色</option>
                            <option value="animal">动物植物</option>
                            <option value="tech">技术系统</option>
                            <option value="concept">抽象概念</option>
                            <option value="other">其他</option>
                        </select>
                    </div>
                    <div class="space-y-1">
                        <label class="text-xs font-bold text-white">视觉容器</label>
                        <select id="cs-vis-container" class="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-xs text-main focus:border-indigo-500/50 focus:outline-none">
                            <option value="museum">等距演进博物馆</option>
                            <option value="strata">剖面地层模型</option>
                            <option value="manuscript">复古科学百科手稿</option>
                            <option value="tree">巨型知识树</option>
                            <option value="mech">机械装置剖面</option>
                            <option value="temple">神庙式时间轴</option>
                            <option value="archive">档案馆墙面</option>
                            <option value="ui">游戏角色UI</option>
                            <option value="map">立体地图</option>
                            <option value="dig">考古发掘现场</option>
                            <option value="star">星图/知识宇宙</option>
                        </select>
                    </div>
                    <div class="space-y-1">
                        <label class="text-xs font-bold text-white">画幅比例</label>
                        <select id="cs-vis-ratio" class="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-xs text-main focus:border-indigo-500/50 focus:outline-none">
                            <option value="3:4">3:4（竖版百科）</option>
                            <option value="16:9">16:9（横版海报）</option>
                            <option value="1:1">1:1（方形信息图）</option>
                            <option value="9:16">9:16（竖屏）</option>
                        </select>
                    </div>
                    <div class="space-y-1">
                        <label class="text-xs font-bold text-white">风格预设</label>
                        <select id="cs-vis-style" class="w-full bg-[#0a0a0c] border border-white/10 rounded-lg px-3 py-2 text-xs text-main focus:border-indigo-500/50 focus:outline-none">
                            <option value="">默认（根据主题自动）</option>
                            <option value="cyberpunk">赛博朋克 — 霓虹/雨夜/全息</option>
                            <option value="guofeng">国风 — 水墨/工笔/东方美学</option>
                            <option value="vintage">复古 — 泛黄/胶片/怀旧</option>
                            <option value="minimal">极简 — 留白/几何/纯色</option>
                            <option value="steampunk">蒸汽朋克 — 齿轮/黄铜/维多利亚</option>
                            <option value="dark">暗黑 — 哥特/阴影/神秘</option>
                            <option value="dreamy">梦幻 — 渐变/柔光/超现实</option>
                            <option value="pixel">像素 — 8bit/16bit/游戏风</option>
                        </select>
                    </div>
                    <div class="flex gap-2">
                        <button class="flex-1 btn bg-indigo-600/20 text-indigo-400 border-indigo-600/30 hover:bg-indigo-600/30 font-bold text-xs py-2.5 rounded-xl" onclick="Modules.creative_studio._runVisualPrompt()">
                            <i class="fa-solid fa-wand-magic-sparkles mr-1"></i>生成
                        </button>
                        <button class="flex-1 btn bg-purple-600/20 text-purple-400 border-purple-600/30 hover:bg-purple-600/30 font-bold text-xs py-2.5 rounded-xl" onclick="Modules.creative_studio._runVisualBatch()">
                            <i class="fa-solid fa-layer-group mr-1"></i>批量3变体
                        </button>
                    </div>
                </div>
                <div class="flex-1 flex flex-col p-4 gap-3 overflow-hidden">
                    <div class="flex items-center justify-between">
                        <label class="text-xs font-bold text-white">生成的提示词</label>
                        <div class="flex gap-1">
                            <button class="text-[10px] text-dim hover:text-white transition px-2 py-1" onclick="Modules.creative_studio._copyVisualResult()"><i class="fa-solid fa-copy mr-1"></i>复制</button>
                            <button class="text-[10px] text-dim hover:text-white transition px-2 py-1" onclick="Modules.creative_studio._saveVisualResult()"><i class="fa-solid fa-save mr-1"></i>保存</button>
                        </div>
                    </div>
                    <div id="cs-vis-result" class="flex-1 min-h-0 bg-[#0a0a0c] border border-white/10 rounded-lg p-3 text-xs text-main overflow-y-auto"></div>
                </div>
            </div>
        </div>`;
    },

    async _runVisualPrompt() {
        const topic = (document.getElementById('cs-vis-topic') || {}).value || '';
        if (!topic.trim()) return UI.toast('请输入主题');
        const type = (document.getElementById('cs-vis-type') || {}).value || 'other';
        const container = (document.getElementById('cs-vis-container') || {}).value || 'museum';
        const ratio = (document.getElementById('cs-vis-ratio') || {}).value || '3:4';
        const resultEl = document.getElementById('cs-vis-result');
        if (resultEl) resultEl.innerHTML = '<div class="text-dim text-xs flex items-center gap-2"><i class="fa-solid fa-spinner fa-spin"></i>正在构建视觉策展方案...</div>';

        const typeMap = {
            history: '历史演进类：适合等距博物馆、时间长廊、地层剖面。模块=起源→成熟→转型→工业/现代→当代/未来',
            science: '科学百科类：适合复古百科插图、实验室手稿、解剖图。模块=外部形态→内部结构→生命周期→生境分布→适应机制→演化关系→与人类关系→保护/未来',
            character: '人物传记类：适合档案墙、知识图谱、传记卷轴。模块=人物档案→生平时间线→核心贡献→思想结构→代表作品→时代背景→影响网络→后世评价',
            literature: '文学角色类：适合角色档案、关系网络、叙事剧场。模块=角色档案→外貌与服饰符号→人物关系网络→关键情节时间线→性格矛盾雷达图→时代与社会背景→文化争议与再解读→后世艺术形象',
            animal: '动物植物类：适合科学图鉴、生态剖面、自然史博物馆。模块=外部形态→内部结构→生命周期→生境分布→适应机制→演化关系→与人类关系→保护/未来趋势',
            tech: '技术系统类：适合机械剖面、爆炸图、控制台界面。模块=核心原理→关键组件→工作流程→技术演进→应用场景→优缺点→未来趋势→相关技术',
            concept: '抽象概念类：适合知识神庙、符号地图、概念星图。模块=核心定义→历史起源→关键理论→代表人物→应用实例→争议与局限→现代演变→未来展望',
            other: '自定义类型：根据主题自动判断最适合的模块结构'
        };

        const containerMap = {
            museum: '等距演进博物馆：每个展馆代表一个历史阶段，空间从左至右推进即代表时间流动',
            strata: '剖面地层模型：垂直地层切片，每一层代表一个时代/阶段，带有化石与文物嵌入',
            manuscript: '复古科学百科手稿：泛黄纸张、精密线稿、手写注释、图例标签',
            tree: '巨型知识树：主干为核心概念，分支为子模块，叶片为细节',
            mech: '机械装置剖面：内部齿轮、管道、能量流动，工业美学',
            temple: '神庙式时间轴：柱廊结构，每根柱子代表一个阶段，穹顶为总结',
            archive: '档案馆墙面：密集但有序的文件、照片、地图、标签',
            ui: '游戏角色UI：面板、数据条、属性图标、装备槽、技能树',
            map: '立体地图：地形起伏、路径标记、区域划分、图例说明',
            dig: '考古发掘现场：土层剖面、工具、标本袋、测量标尺',
            star: '星图/知识宇宙：星座连线、星云、轨道、行星代表核心概念'
        };

        const basePrompt = Modules.creative_studio._getPrompt('visual', `Role: World-class visual knowledge architect, scientific encyclopedia illustrator, museum exhibition designer, cinematic art director, and prompt engineer.

Task: 根据用户输入的主题，生成一张高度专业、极致细节、结构清晰、具有强视觉冲击力的知识型图像提示词。图像需要兼具学术信息密度、艺术表现力、空间秩序与视觉隐喻。

Before image construction, first reason about the subject:
1. 判断主题类型：人物/动物/植物/历史演进/科学概念/技术系统/文学角色/文明地理/抽象思想/其他
2. 生成主题中文标题与英文标题
3. 推断主题的时间范围、起始阶段与结束阶段
4. 根据主题选择最合适的视觉容器
5. 自动拆解3-5个关键演进阶段，或6-8个知识模块
6. 为每个阶段/模块分配：标题、时间或范围、核心概念、3-5个可视化象征物、主色调、材质特征、与其他模块的连接关系

Image Construction:
Create a highly detailed, visually stunning knowledge infographic about the subject.
Main Composition:
• Use the selected visual container
• The composition must have a clear central focal point
• Use strategic white space around the main subject or main pathway to preserve visual hierarchy
• Surrounding modules must be dense but organized, with clear borders, headers, diagrams, icons, annotations, and leader lines
• The image should feel like a professional museum exhibition board, scientific encyclopedia plate, or academic visual atlas

Spatial Logic:
• Use a clear visual reading path: left-to-right timeline / bottom-to-top evolution / center-to-outside knowledge expansion / cross-section layers / circular lifecycle
• The spatial progression must represent conceptual or historical development
• Use fine leader lines, arrows, brackets, dotted routes, pins, and connection nodes to link all parts into a coherent knowledge web

Central Subject:
• The central subject should dominate the image
• Render it with the strongest realism, depth, and lighting
• If suitable, create a 3D pop-out or anamorphic effect where the subject breaks the flat surface and extends toward the viewer
• Maintain clean negative space around the subject to enhance focus

Modules:
• Include 6-8 organized modules or 3-5 historical stages depending on the subject type
• Each module should include small diagrams, artifacts, icons, local magnifications, maps, timelines, mini-scenes, or symbolic objects
• Every module should be visually distinct but stylistically unified
• Every visible object should serve an educational, historical, structural, or symbolic purpose

Text Requirements:
• Main title: large, elegant Chinese calligraphy
• English subtitle: bilingual
• Use clear Simplified Chinese for major headings and important labels
• Small dense annotations may appear as professional handwritten Chinese note textures
• Avoid meaningless pseudo-text in large headings

Style:
• Classic scientific encyclopedia style mixed with cinematic visual design
• Retro aged beige paper background or carefully selected thematic background
• Delicate linework, precise diagrammatic annotation, professional layout
• Extremely intricate, high-density details with strong hierarchy
• Elegant combination of realism, symbolic illustration, and information design

Lighting & Camera:
• Choose camera style appropriate to the visual container:
  - isometric 2:1 view for museums/timelines
  - macro close-up for object tables
  - orthographic cutaway for cross-sections
  - dramatic 3/4 view for cinematic encyclopedia posters
• Use controlled depth, dramatic but readable lighting, subtle shadows, and material contrast

Material & Detail Language:
• Include specific materials: aged paper, ink wash, brass, stone, glass, silk, vellum, wood, ceramic, steel, neon, holographic projection
• Use texture contrast to show historical change: rough → refined → industrial → digital, natural → engineered, handmade → mechanized → networked

Negative Constraints:
• No brand logos
• No random clutter
• No unreadable large text
• No chaotic collage layout
• No incorrect or meaningless main title
• No duplicated limbs, distorted anatomy, or malformed central subject
• No excessive text covering the main subject
• No irrelevant decorative elements

高质量图像 = 明确主题 × 强结构 × 具体元素 × 稳定风格 × 镜头语言 × 约束条件`);

        const style = (document.getElementById('cs-vis-style') || {}).value || '';
        const styleDesc = {
            cyberpunk: '赛博朋克风格：霓虹灯、雨夜、全息投影、机械义体、繁华与破败对比、蓝紫色调',
            guofeng: '国风风格：水墨意境、工笔细腻、东方美学、山水留白、青绿/赭石色调',
            vintage: '复古风格：泛黄胶片、老照片质感、怀旧色调、颗粒感、暖棕色调',
            minimal: '极简风格：大量留白、几何构图、纯色背景、线条简洁、黑白或单色调',
            steampunk: '蒸汽朋克风格：齿轮机械、黄铜管道、维多利亚服饰、棕金色调、蒸汽弥漫',
            dark: '暗黑风格：哥特元素、阴影层次、神秘氛围、暗红/深紫/黑色调',
            dreamy: '梦幻风格：柔和渐变、柔光效果、超现实元素、粉蓝/粉紫色调',
            pixel: '像素风格：8bit/16bit像素艺术、游戏界面、鲜艳色块、复古电子感'
        };
        const styleText = style ? `\n【风格预设】${styleDesc[style]}` : '';

        const prompt = `${basePrompt}${styleText}

【用户输入】
主题：${topic}
主题类型：${typeMap[type] || type}
视觉容器：${containerMap[container] || container}
画幅比例：${ratio}

请输出完整的英文图像生成提示词（适用于Midjourney/Stable Diffusion/DALL·E/即梦/可灵等），包含：
1. 主题推理结果（类型判断、标题、阶段/模块划分）
2. 完整的英文prompt（800-1500词）
3. 每个阶段/模块的象征物列表
4. 推荐的配色方案
5. 推荐的镜头角度
6. 负面约束词（Negative Prompt）`;

        let result = '';
        try {
            await AI.generate(prompt, {}, chunk => {
                result += chunk;
                if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">${typeof marked !== 'undefined' ? marked.parse(result) : result}</div>`;
            });
            this._visualResult = result;
            UI.toast('视觉提示词生成完成 ✓', 'success');
        } catch(e) {
            UI.toast('生成失败: ' + e.message, 'error');
        }
    },

    async _runVisualBatch() {
        const topic = (document.getElementById('cs-vis-topic') || {}).value || '';
        if (!topic.trim()) return UI.toast('请输入主题');
        const resultEl = document.getElementById('cs-vis-result');
        if (resultEl) resultEl.innerHTML = '<div class="text-dim text-xs flex items-center gap-2"><i class="fa-solid fa-spinner fa-spin"></i>正在批量生成3个变体...</div>';

        const type = (document.getElementById('cs-vis-type') || {}).value || 'other';
        const container = (document.getElementById('cs-vis-container') || {}).value || 'museum';
        const ratio = (document.getElementById('cs-vis-ratio') || {}).value || '3:4';
        const typeMap = { history: '历史演进', science: '科学百科', character: '人物传记', literature: '文学角色', animal: '动物植物', tech: '技术系统', concept: '抽象概念', other: '自定义' };
        const containerMap = { museum: '等距博物馆', strata: '地层模型', manuscript: '复古手稿', tree: '知识树', mech: '机械剖面', temple: '神庙时间轴', archive: '档案馆', ui: '游戏UI', map: '立体地图', dig: '考古现场', star: '星图宇宙' };

        let allResults = `# ${topic} · 批量视觉提示词\n\n> 视觉容器：${containerMap[container]} | 画幅：${ratio} | 类型：${typeMap[type]}\n\n---\n\n`;
        const variations = [
            { name: '变体A · 经典版', extra: 'Classic encyclopedia style, maximum detail, professional layout, muted colors with selective saturation' },
            { name: '变体B · 艺术版', extra: 'Artistic interpretation, bold composition, dramatic lighting, stylized rendering, poster-quality visual impact' },
            { name: '变体C · 极简版', extra: 'Minimalist design, generous white space, clean typography, essential elements only, modern flat aesthetic' }
        ];

        for (let i = 0; i < variations.length; i++) {
            const v = variations[i];
            const prompt = `你是一位世界级视觉知识策展师。请为"${topic}"生成一个专业的知识可视化图像提示词。

要求：
- 视觉容器：${containerMap[container]}
- 画幅比例：${ratio}
- 特殊要求：${v.extra}
- 输出格式：主题推理（类型/标题/阶段）+ 完整英文prompt（800-1200词）+ 配色方案 + 镜头角度 + Negative Prompt`;

            if (resultEl) resultEl.innerHTML = `<div class="text-indigo-400 text-xs flex items-center gap-2"><i class="fa-solid fa-spinner fa-spin"></i>生成 ${v.name} (${i+1}/3)...</div>`;
            try {
                let res = '';
                await AI.generate(prompt, {}, c => { res += c; });
                allResults += `## ${v.name}\n\n${res}\n\n---\n\n`;
            } catch(e) {
                allResults += `## ${v.name}\n\n生成失败：${e.message}\n\n---\n\n`;
            }
        }

        this._visualResult = allResults;
        if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">${typeof marked !== 'undefined' ? marked.parse(allResults) : allResults}</div>`;
        UI.toast('批量生成完成 ✓', 'success');
    },

    _copyVisualResult() {
        if (!this._visualResult) return UI.toast('无内容可复制');
        navigator.clipboard.writeText(this._visualResult).then(() => UI.toast('已复制到剪贴板'));
    },

    async _saveVisualResult() {
        if (!this._visualResult) return UI.toast('无内容可保存');
        const id = 'vis_' + Utils.uuid();
        await DB.put('library_books', { id, name: '视觉提示词_' + new Date().toLocaleDateString(), content: this._visualResult, size: this._visualResult.length, date: new Date().toLocaleDateString(), type: 'visual' });
        UI.toast('已保存到阅读中心');
    }
});
