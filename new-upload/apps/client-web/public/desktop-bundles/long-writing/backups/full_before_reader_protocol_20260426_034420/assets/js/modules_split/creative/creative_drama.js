// creative_drama.js — 漫剧流水线 (Drama Pipeline)
// 对标: 麻薯动画 端到端动画生产管线
// 小说章节 → 完整漫剧制作文档包
// v3.1: 任务队列 + 步骤独立切换 + 外部协议内嵌
Object.assign(Modules.creative_studio, {
    _dramaResult: null,
    _dramaStep: 0,
    _dramaData: { script: '', char: '', sb: '', grid: '', visual: '', voice: '', plan: '' },
    _dramaRunningStep: null,
    _dramaTasks: [],
    _dramaActiveTaskId: null,
    // 步骤模式配置：true=仅提示词(skip)，false=执行(run)
    _dramaSkipConfig: { script: false, char: false, sb: false, grid: false, visual: true, voice: true, plan: false },

    // ═══ 各阶段默认提示词（内嵌外部协议 + 分镜.txt）═══
    _DRAMA_PROMPTS: {
        script: `你是一位专业编剧，执行小说→漫剧剧本改编。以下规则来自真值执行协议影视化转制层(M10) L1铁律：

【小说转剧本12条铁律】
1. 叙述转动作：心理描写必须转为可见动作
2. 对话提纯：删除无功能对白，前标注角色名
3. 场景划分：【场号】地点 - 时间
4. 删评论：删除"幸运的是"等作者评论
5. 时间显式化："三天后"→[时间跳转-三日]
6. 感官转音视：嗅觉触觉转画面+音效
7. 旁白限制：仅限第一人称，每场≤2次
8. 背景转对话：背景交代转对话动作暗示
9. 场次功能：每场景必须推进剧情/塑造人物/埋伏笔/制造情绪
10. 禁复制：禁止直接复制原文叙述，必须转换
11. 转换统计：输出原字数、场次、动作/对话占比
12. 镜头限制：仅用7标签：[全][中][特][低][高][推][跟]

【去AI味协议】
- 禁情绪标签：不写"他很愤怒"，必须动作/环境/对话呈现
- 禁解释癖：禁用"这意味着…/换句话说…/其实…"
- 禁连续长句：单句≤25字
- 对话功能化：推进剧情/塑造性格/埋伏笔/制造情绪，否则删除

输出要求：
1. 拆分为独立场景（标注场景编号和地点）
2. 每个场景包含：场景描述、角色动作、对话（标注说话人）、情绪标注
3. 删除不适合视觉化的内心独白，转化为动作或表情
4. 标注关键画面（需要重点表现的时刻）
5. 估算每个场景的时长`,

        char: `你是一位角色设计师，执行漫剧角色外观定调。以下规则来自真值执行协议动态角色卡(M05)：

【角色卡三层Prompt结构】
- 顶层·状态约束段：当前情绪/关系/信息差动态注入
- 中层·静态设定段：认知模式、语言风格、核心秘密（人工锁死）
- 底层·叙事引擎段：极简白描、禁情绪标签、单句≤25字

【真实感增强池（强制注入）】
- 日常细节：吃什么早餐、外卖等了多久、闹钟响了几次、电脑卡顿、回复消息犹豫
- 角色癖好：咬指甲、转笔、叠纸鹤、反复洗手、说话摸鼻子、紧张揪头发
- 不完美性：近视不戴眼镜、慢性鼻炎、怕冷、晕车、社恐、选择困难、方向感差
- 偶然事件：手机没电、走错路、电梯故障、偶遇旧识、突然下雨、说错话、打翻杯子

输出要求：
1. 角色名
2. 年龄/性别/气质
3. 外观关键词（发型、服饰、标志性特征）
4. 表情特征（喜怒哀乐的表现方式）
5. 标志性小动作
6. AI图像生成提示词（英文，用于固定角色形象）
7. 配音音色建议（音高、语速、情绪特点）
8. 角色癖好与不完美性

请确保角色形象具有辨识度，适合长期连载保持一致性。`,

        sb: `你是一位分镜导演，执行剧本→分镜拆解。以下规则来自真值执行协议影视化转制层(M10) + 专业分镜法则：

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

输出要求：
- 开场3秒必须有冲击力（黄金3秒原则）
- 每个镜头≤5秒（短视频节奏）
- 高潮部分用快速剪辑
- 情感时刻用长镜头+特写
- 标注转场方式
- 每格画面遵循"权力视觉化"原则
- 材质与细节真实可信，特效服务画面不喧宾夺主，色彩与氛围统一`,

        visual: `你是一位AI图像提示词工程师，执行画面提示词生成。

【MJ/SD提示词规范】
- 每个提示词60-100词英文
- 包含风格关键词（anime style / cinematic lighting / 水墨等）
- 包含角色外观描述（确保一致性）
- 包含场景氛围描述
- 按镜头顺序排列

【人工筛选清单】
生成后自检：脸部一致性、动作流畅度、运镜可控性、光照匹配度

【画面品质要求】
- 电影级别的光影效果
- 人物和场景完美融合
- 光影完美
- 大师级作品
- 材质参数合理（反射、粗糙度、置换）
- 细节提升真实感（灰尘、划痕、磨损）

输出格式：
Shot 1: [英文prompt]
Shot 2: [英文prompt]
...`,

        voice: `你是一位配音导演，执行配音脚本制作。

输出要求：
1. 时间码（约估）
2. 角色名
3. 台词内容
4. 情绪标注（平静/愤怒/悲伤/兴奋/嘲讽/冷漠等）
5. 语速建议（正常/快/慢/渐快/渐慢）
6. 音效处理（混响/电话音/广播音/远处等）

同时提供：
- BGM情绪建议（每个场景的背景音乐风格）
- 音效清单（环境音和动作音）
- 配音演员分配建议`,

        grid: `你是一位AI图像生成提示词工程师，执行分镜→画面提示词转换。

【任务】
将分镜设计转换为可直接用于AI图像生成的英文提示词列表。

【MJ/SD提示词规范】
- 每个提示词60-100词英文
- 包含风格关键词（anime style / cinematic lighting / 水墨等）
- 包含角色外观描述（确保一致性）
- 包含场景氛围描述
- 按镜头顺序排列

【人工筛选清单】
生成后自检：脸部一致性、动作流畅度、运镜可控性、光照匹配度

【画面品质要求】
- 电影级别的光影效果
- 人物和场景完美融合
- 光影完美
- 大师级作品

输出格式：
Shot 1: [英文prompt]
Shot 2: [英文prompt]
...`,

        plan: `你是一位漫剧制片人，执行最终合成规划。

【视频抽卡管理参考】
- Kling静态成功率35%，简单动作15%，复杂动作5%
- Runway Gen-2静态25%，简单动作8%，复杂动作2%
- Pika静态30%，简单动作10%，复杂动作3%

【视频生成提示词】
基于分镜格子和画面提示词，为每个关键镜头生成视频生成提示词（适合Kling/Runway/Pika/可灵）。
每个视频提示词包含：镜头运动、主体动作、环境变化、光影演变、时长。

输出要求：
1. 总时长估算
2. 素材清单（画面/音频/特效/视频片段）
3. 制作优先级排序
4. 推荐制作工具/软件
5. 输出规格建议（分辨率/帧率/格式）
6. 发布平台适配建议（抖音/B站/快手/小红书等）
7. 抽卡策略建议（哪些镜头需要多次生成）
8. 视频生成提示词清单（按镜头顺序）`
    },

    _renderDramaTab() {
        const steps = [
            { id: 0, label: '输入', icon: 'fa-file-import', desc: '粘贴小说/剧本' },
            { id: 1, label: '剧本', icon: 'fa-scroll', desc: '解析场景对话' },
            { id: 2, label: '角色', icon: 'fa-users', desc: '定调角色外观' },
            { id: 3, label: '分镜', icon: 'fa-film', desc: '生成镜头设计' },
            { id: 4, label: '格子', icon: 'fa-border-all', desc: '分镜格子+提示词' },
            { id: 5, label: '画面', icon: 'fa-image', desc: 'AI图像生成' },
            { id: 6, label: '配音', icon: 'fa-microphone', desc: '配音脚本' },
            { id: 7, label: '合成', icon: 'fa-clapperboard', desc: '制作规划+视频提示词' }
        ];
        const tasksHtml = this._renderDramaTaskList();
        return `
        <div class="flex flex-col h-full overflow-hidden">
            <div class="shrink-0 p-4 border-b border-white/5 bg-gradient-to-r from-orange-900/20 to-transparent">
                <div class="flex items-center gap-2 mb-1">
                    <i class="fa-solid fa-clapperboard text-orange-400"></i>
                    <span class="font-bold text-white text-sm">漫剧流水线</span>
                    <span class="text-[9px] text-dim bg-white/5 px-1.5 py-0.5 rounded">v3.1</span>
                </div>
                <div class="flex items-center justify-between">
                    <div class="text-[10px] text-dim">小说→剧本→角色→分镜→画面→配音→合成，一站式漫剧制作</div>
                    ${Modules.creative_studio._renderPromptEditButton('drama','漫剧流水线')}
                </div>
            </div>
            <!-- 步骤条 -->
            <div class="shrink-0 px-4 py-2 bg-[#0a0a0c] border-b border-white/5">
                <div class="flex items-center gap-1">
                    ${steps.map((s, i) => `
                        <div class="flex items-center gap-1 ${i > 0 ? 'flex-1' : ''}">
                            ${i > 0 ? `<div class="flex-1 h-0.5 bg-white/10 mx-1" id="drama-line-${i}"></div>` : ''}
                            <div class="flex flex-col items-center gap-0.5 shrink-0 cursor-pointer hover:opacity-80 transition" id="drama-step-${s.id}" onclick="Modules.creative_studio._switchDramaStep(${s.id})">
                                <div class="w-7 h-7 rounded-full flex center text-[10px] font-bold transition-all ${this._dramaStep>=s.id ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-white/5 text-dim border border-white/10'}">
                                    <i class="fa-solid ${s.icon}"></i>
                                </div>
                                <span class="text-[8px] ${this._dramaStep>=s.id ? 'text-orange-400' : 'text-dim'}">${s.label}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="flex-1 flex min-h-0">
                <!-- 左侧：任务列表 + 输入 -->
                <div class="w-[42%] flex flex-col border-r border-white/5">
                    <!-- 任务列表 -->
                    <div class="shrink-0 border-b border-white/5 bg-[#0a0a0c]">
                        <div class="flex items-center justify-between px-3 py-2">
                            <span class="text-[10px] font-bold text-white"><i class="fa-solid fa-list-check mr-1 text-orange-400"></i>任务队列 (${this._dramaTasks.length})</span>
                            <div class="flex gap-1.5">
                                <button class="text-[9px] text-dim hover:text-white transition px-1.5 py-0.5" onclick="Modules.creative_studio._addDramaTask()"><i class="fa-solid fa-plus mr-0.5"></i>添加</button>
                                <button class="text-[9px] text-dim hover:text-orange-400 transition px-1.5 py-0.5" onclick="Modules.creative_studio._runAllDramaTasks()"><i class="fa-solid fa-forward mr-0.5"></i>批量执行</button>
                                <button class="text-[9px] text-dim hover:text-red-400 transition px-1.5 py-0.5" onclick="Modules.creative_studio._clearDramaTasks()"><i class="fa-solid fa-trash mr-0.5"></i>清空</button>
                            </div>
                        </div>
                        <div class="px-3 pb-2 max-h-[120px] overflow-y-auto" id="cs-drama-task-list">${tasksHtml}</div>
                    </div>
                    <!-- 输入区 -->
                    <div class="flex-1 flex flex-col p-4 gap-3 min-h-0 overflow-y-auto">
                        <!-- 步骤模式配置 -->
                        <div class="space-y-2">
                            <div class="flex items-center justify-between">
                                <span class="text-[10px] text-dim font-bold"><i class="fa-solid fa-sliders mr-1 text-amber-400"></i>步骤模式配置</span>
                                <span class="text-[9px] text-dim">跳过的步骤只输出提示词，不调用AI生成</span>
                            </div>
                            <div class="grid grid-cols-2 gap-1.5">
                                ${[
                                    {k:'script',l:'剧本解析',i:'fa-scroll'},
                                    {k:'char',l:'角色定调',i:'fa-users'},
                                    {k:'sb',l:'分镜设计',i:'fa-film'},
                                    {k:'grid',l:'分镜格子',i:'fa-border-all'},
                                    {k:'visual',l:'AI画面',i:'fa-image'},
                                    {k:'voice',l:'配音脚本',i:'fa-microphone'},
                                    {k:'plan',l:'合成规划',i:'fa-clapperboard'}
                                ].map(s => {
                                    const skipped = this._dramaSkipConfig[s.k];
                                    return `<button class="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] border transition-all ${skipped ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}" onclick="Modules.creative_studio._toggleDramaSkip('${s.k}')">
                                        <i class="fa-solid ${s.i} text-[9px]"></i>
                                        <span class="flex-1 text-left">${s.l}</span>
                                        <span class="text-[9px] px-1 rounded ${skipped ? 'bg-amber-500/20' : 'bg-emerald-500/20'}">${skipped ? '仅提示词' : '执行'}</span>
                                    </button>`;
                                }).join('')}
                            </div>
                        </div>
                        <div class="flex items-center justify-between">
                            <label class="text-xs font-bold text-white">输入原文</label>
                            <button class="text-[10px] text-dim hover:text-white transition" onclick="Modules.creative_studio._pasteDrama()"><i class="fa-solid fa-paste mr-1"></i>粘贴</button>
                        </div>
                        <textarea id="cs-drama-input" class="flex-1 min-h-[80px] bg-[#0a0a0c] border border-white/10 rounded-lg p-3 text-xs text-main resize-none focus:border-orange-500/50 focus:outline-none" placeholder="粘贴小说章节或剧本内容，AI将自动完成漫剧化全流程..."></textarea>
                        <div class="space-y-1">
                            <span class="text-[10px] text-dim font-bold">输出选项（显示控制）</span>
                            <div class="flex flex-wrap gap-1.5">
                                <label class="flex items-center gap-1 text-[10px] text-dim cursor-pointer"><input type="checkbox" id="cs-drama-opt-script" checked class="w-3 h-3 rounded accent-orange-500"><span>剧本</span></label>
                                <label class="flex items-center gap-1 text-[10px] text-dim cursor-pointer"><input type="checkbox" id="cs-drama-opt-char" checked class="w-3 h-3 rounded accent-orange-500"><span>角色</span></label>
                                <label class="flex items-center gap-1 text-[10px] text-dim cursor-pointer"><input type="checkbox" id="cs-drama-opt-sb" checked class="w-3 h-3 rounded accent-orange-500"><span>分镜</span></label>
                                <label class="flex items-center gap-1 text-[10px] text-dim cursor-pointer"><input type="checkbox" id="cs-drama-opt-visual" checked class="w-3 h-3 rounded accent-orange-500"><span>画面</span></label>
                                <label class="flex items-center gap-1 text-[10px] text-dim cursor-pointer"><input type="checkbox" id="cs-drama-opt-voice" checked class="w-3 h-3 rounded accent-orange-500"><span>配音</span></label>
                            </div>
                        </div>
                        <button class="btn bg-orange-600/20 text-orange-400 border-orange-600/30 hover:bg-orange-600/30 font-bold text-xs py-2.5 rounded-xl" onclick="Modules.creative_studio._runDramaPipeline()">
                            <i class="fa-solid fa-rocket mr-1"></i>启动漫剧流水线
                        </button>
                    </div>
                </div>
                <!-- 输出区 -->
                <div class="flex-1 flex flex-col p-4 gap-3 overflow-hidden">
                    <div class="flex items-center justify-between">
                        <label class="text-xs font-bold text-white" id="cs-drama-step-label">制作文档包</label>
                        <div class="flex gap-1">
                            <button class="text-[10px] text-dim hover:text-white transition px-2 py-1" onclick="Modules.creative_studio._runSingleDramaStep(Modules.creative_studio._dramaStep)"><i class="fa-solid fa-play mr-1"></i>执行此步</button>
                            <button class="text-[10px] text-dim hover:text-white transition px-2 py-1" onclick="Modules.creative_studio._copyDramaResult()"><i class="fa-solid fa-copy mr-1"></i>复制</button>
                            <button class="text-[10px] text-dim hover:text-white transition px-2 py-1" onclick="Modules.creative_studio._saveDramaResult()"><i class="fa-solid fa-save mr-1"></i>保存</button>
                        </div>
                    </div>
                    <div id="cs-drama-result" class="flex-1 min-h-0 bg-[#0a0a0c] border border-white/10 rounded-lg p-3 text-xs text-main overflow-y-auto"></div>
                </div>
            </div>
        </div>`;
    },

    // ═══ 任务列表系统 ═══
    _renderDramaTaskList() {
        if (!this._dramaTasks.length) {
            return '<div class="text-[9px] text-dim text-center py-2">暂无任务，点击"添加"将当前输入加入队列</div>';
        }
        return this._dramaTasks.map(t => {
            const isActive = this._dramaActiveTaskId === t.id;
            const statusIcon = t.status === 'done' ? '<i class="fa-solid fa-check text-emerald-400"></i>' :
                               t.status === 'running' ? '<i class="fa-solid fa-spinner fa-spin text-orange-400"></i>' :
                               t.status === 'error' ? '<i class="fa-solid fa-xmark text-red-400"></i>' :
                               '<i class="fa-solid fa-circle text-white/20"></i>';
            const progress = t.progress || 0;
            return `
            <div class="flex items-center gap-2 px-2 py-1.5 rounded ${isActive ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-white/5 border border-transparent'} mb-1 cursor-pointer hover:bg-white/10 transition" onclick="Modules.creative_studio._selectDramaTask('${t.id}')">
                <div class="text-[8px] shrink-0">${statusIcon}</div>
                <div class="flex-1 min-w-0">
                    <div class="text-[10px] text-white truncate">${t.name}</div>
                    <div class="w-full h-1 bg-white/10 rounded-full mt-1">
                        <div class="h-1 bg-orange-500/60 rounded-full transition-all" style="width:${progress}%"></div>
                    </div>
                </div>
                <button class="text-[8px] text-dim hover:text-red-400 shrink-0 px-1" onclick="event.stopPropagation();Modules.creative_studio._removeDramaTask('${t.id}')"><i class="fa-solid fa-times"></i></button>
            </div>`;
        }).join('');
    },

    _addDramaTask() {
        const input = (document.getElementById('cs-drama-input') || {}).value || '';
        if (!input.trim()) return UI.toast('请输入原文后再添加任务');
        const name = input.slice(0, 20).replace(/\n/g, ' ') + (input.length > 20 ? '...' : '');
        const task = {
            id: 'task_' + Utils.uuid(),
            name: name || '未命名任务',
            input: input,
            status: 'pending',
            progress: 0,
            data: { script: '', char: '', sb: '', grid: '', visual: '', voice: '', plan: '' }
        };
        this._dramaTasks.push(task);
        this._refreshDramaTaskList();
        UI.toast('任务已加入队列');
    },

    _removeDramaTask(id) {
        this._dramaTasks = this._dramaTasks.filter(t => t.id !== id);
        if (this._dramaActiveTaskId === id) this._dramaActiveTaskId = null;
        this._refreshDramaTaskList();
    },

    _clearDramaTasks() {
        this._dramaTasks = [];
        this._dramaActiveTaskId = null;
        this._refreshDramaTaskList();
        UI.toast('任务队列已清空');
    },

    _selectDramaTask(id) {
        const task = this._dramaTasks.find(t => t.id === id);
        if (!task) return;
        this._dramaActiveTaskId = id;
        const inputEl = document.getElementById('cs-drama-input');
        if (inputEl) inputEl.value = task.input;
        this._dramaData = { ...task.data };
        this._dramaStep = 0;
        this._updateDramaSteps();
        this._refreshDramaTaskList();
        // 刷新输出区
        const resultEl = document.getElementById('cs-drama-result');
        if (resultEl) {
            const hasAny = Object.values(this._dramaData).some(v => v);
            if (hasAny) {
                const full = this._buildFullResult();
                resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">${typeof marked !== 'undefined' ? marked.parse(full) : full}</div>`;
            } else {
                resultEl.innerHTML = '<div class="text-dim text-xs p-4">请在左侧输入原文，然后点击"启动漫剧流水线"或选择步骤单独执行。</div>';
            }
        }
    },

    _refreshDramaTaskList() {
        const el = document.getElementById('cs-drama-task-list');
        if (el) el.innerHTML = this._renderDramaTaskList();
    },

    async _runAllDramaTasks() {
        const pending = this._dramaTasks.filter(t => t.status !== 'done');
        if (!pending.length) return UI.toast('没有待执行的任务');
        for (const task of pending) {
            this._dramaActiveTaskId = task.id;
            this._dramaData = { ...task.data };
            const inputEl = document.getElementById('cs-drama-input');
            if (inputEl) inputEl.value = task.input;
            this._refreshDramaTaskList();
            UI.toast(`开始执行任务: ${task.name}`);
            try {
                await this._runDramaPipelineForTask(task);
                task.status = 'done';
                task.progress = 100;
            } catch(e) {
                task.status = 'error';
                UI.toast(`任务失败: ${task.name} — ${e.message}`, 'error');
            }
            this._refreshDramaTaskList();
        }
        UI.toast('批量任务执行完毕');
    },

    async _runDramaPipelineForTask(task) {
        const input = task.input;
        const stepMap = [
            null,
            { key: 'script', label: '剧本解析' },
            { key: 'char', label: '角色定调' },
            { key: 'sb', label: '分镜设计' },
            { key: 'grid', label: '分镜格子' },
            { key: 'visual', label: '画面提示词' },
            { key: 'voice', label: '配音脚本' },
            { key: 'plan', label: '合成规划' }
        ];
        for (let i = 1; i <= 7; i++) {
            const step = stepMap[i];
            task.progress = Math.round((i / 7) * 100);
            this._refreshDramaTaskList();
            let content = '';
            const prompt = this._buildDramaPrompt(i, input);
            const skipped = this._dramaSkipConfig[step.key];
            if (skipped) {
                content = `【此步骤已设置为「仅提示词」，未调用AI生成完整内容。以下是该步骤的提示词，可复制到对应平台使用】\n\n---\n\n${prompt}`;
                await new Promise(r => setTimeout(r, 200));
            } else {
                await AI.generate(prompt, {}, c => { content += c; });
            }
            task.data[step.key] = content;
            this._dramaData[step.key] = content;
        }
        this._dramaResult = this._buildFullResult();
    },

    // ═══ 提示词构建 ═══
    _buildDramaPrompt(stepId, input) {
        const keys = ['', 'script', 'char', 'sb', 'grid', 'visual', 'voice', 'plan'];
        const key = keys[stepId];
        const basePrompt = Modules.creative_studio._getPrompt('drama_' + key, this._DRAMA_PROMPTS[key] || '');
        const slices = ['', 3000, 2000, 2500, 2500, 2000, 2000, 1500];
        return `${basePrompt}\n\n【用户输入】\n${input.slice(0, slices[stepId])}`;
    },

    _toggleDramaSkip(key) {
        this._dramaSkipConfig[key] = !this._dramaSkipConfig[key];
        this.switchTab('drama');
    },

    _pasteDrama() {
        navigator.clipboard.readText().then(t => {
            const el = document.getElementById('cs-drama-input');
            if (el) el.value = t;
        }).catch(() => UI.toast('无法读取剪贴板', 'error'));
    },

    _switchDramaStep(id) {
        this._dramaStep = id;
        this._updateDramaSteps();
        const labelEl = document.getElementById('cs-drama-step-label');
        const stepNames = ['输入原文', '一、剧本解析', '二、角色外观定调', '三、分镜设计', '四、分镜格子+画面提示词', '五、AI图像生成', '六、配音脚本', '七、合成规划+视频提示词（完整结果）'];
        if (labelEl) labelEl.textContent = stepNames[id] || '制作文档包';
        const resultEl = document.getElementById('cs-drama-result');
        if (!resultEl) return;
        const dataKeys = ['', 'script', 'char', 'sb', 'grid', 'visual', 'voice', 'plan'];
        const key = dataKeys[id];

        if (id === 0) {
            // 输入步骤：显示原文
            const input = (document.getElementById('cs-drama-input') || {}).value || '';
            if (input.trim()) {
                resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">${typeof marked !== 'undefined' ? marked.parse('## 输入原文\n\n' + input.slice(0, 5000)) : '## 输入原文\n\n' + input.slice(0, 5000)}</div>`;
            } else {
                resultEl.innerHTML = '<div class="text-dim text-xs p-4">请在左侧输入原文，然后点击"启动漫剧流水线"或选择其他步骤单独执行。</div>';
            }
        } else if (id === 6) {
            // 合成步骤：显示完整汇总
            const full = this._buildFullResult();
            if (full.trim() === '# 漫剧制作文档包\n\n> 生成时间: ' + new Date().toLocaleString() + '\n\n---\n\n') {
                resultEl.innerHTML = `<div class="text-dim text-xs p-4 flex flex-col items-center gap-2"><i class="fa-solid fa-circle-play text-orange-500/50 text-lg"></i><span>此步骤暂无内容，点击上方<i class="fa-solid fa-play mx-1"></i>执行此步</span></div>`;
            } else {
                resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">${typeof marked !== 'undefined' ? marked.parse(full) : full}</div>`;
            }
        } else if (key && this._dramaData[key]) {
            // 中间步骤：只显示该步骤的独立内容
            const stepTitle = stepNames[id];
            const content = this._dramaData[key];
            resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">${typeof marked !== 'undefined' ? marked.parse('## ' + stepTitle + '\n\n' + content) : '## ' + stepTitle + '\n\n' + content}</div>`;
        } else {
            resultEl.innerHTML = `<div class="text-dim text-xs p-4 flex flex-col items-center gap-2"><i class="fa-solid fa-circle-play text-orange-500/50 text-lg"></i><span>此步骤暂无内容，点击上方<i class="fa-solid fa-play mx-1"></i>执行此步</span></div>`;
        }
    },

    _buildFullResult() {
        let full = `# 漫剧制作文档包\n\n> 生成时间: ${new Date().toLocaleString()}\n\n---\n\n`;
        const sections = [
            { key: 'script', title: '一、剧本解析' },
            { key: 'char', title: '二、角色外观定调' },
            { key: 'sb', title: '三、分镜设计' },
            { key: 'grid', title: '四、分镜格子+画面提示词' },
            { key: 'visual', title: '五、AI图像生成' },
            { key: 'voice', title: '六、配音脚本' },
            { key: 'plan', title: '七、合成规划+视频提示词' }
        ];
        sections.forEach(s => {
            if (this._dramaData[s.key]) {
                full += `## ${s.title}\n\n${this._dramaData[s.key]}\n\n---\n\n`;
            }
        });
        return full;
    },

    async _runSingleDramaStep(stepId) {
        const input = (document.getElementById('cs-drama-input') || {}).value || '';
        if (!input.trim()) return UI.toast('请输入原文');
        if (input.length < 50) return UI.toast('内容太短，建议至少50字');
        const resultEl = document.getElementById('cs-drama-result');
        if (stepId === 0) return;

        this._dramaRunningStep = stepId;
        this._dramaStep = stepId;
        this._updateDramaSteps();
        const stepNames = ['', '剧本解析', '角色定调', '分镜设计', '分镜格子', '画面提示词', '配音脚本', '合成规划'];
        const dataKeys = ['', 'script', 'char', 'sb', 'grid', 'visual', 'voice', 'plan'];
        const key = dataKeys[stepId];
        const skipped = this._dramaSkipConfig[key];
        const labelEl = document.getElementById('cs-drama-step-label');
        if (labelEl) labelEl.textContent = stepNames[stepId];

        try {
            const prompt = this._buildDramaPrompt(stepId, input);
            let content = '';

            if (skipped) {
                if (resultEl) resultEl.innerHTML = `<div class="text-amber-400 text-xs flex items-center gap-2"><i class="fa-solid fa-forward"></i>Step ${stepId}/7: ${stepNames[stepId]} [仅提示词模式]...</div>`;
                await new Promise(r => setTimeout(r, 300));
                content = `【此步骤已设置为「仅提示词」，未调用AI生成完整内容。以下是该步骤的提示词，可复制到对应平台使用】\n\n---\n\n${prompt}`;
            } else {
                if (resultEl) resultEl.innerHTML = `<div class="text-orange-400 text-xs flex items-center gap-2"><i class="fa-solid fa-spinner fa-spin"></i>Step ${stepId}/7: ${stepNames[stepId]}...</div>`;
                await AI.generate(prompt, {}, c => { content += c; });
            }

            this._dramaData[key] = content;

            // 更新任务数据（如果有关联任务）
            if (this._dramaActiveTaskId) {
                const task = this._dramaTasks.find(t => t.id === this._dramaActiveTaskId);
                if (task) task.data[dataKeys[stepId]] = content;
            }

            // 只有当前视图仍在该步骤时才更新DOM（避免切换后被覆盖）
            if (this._dramaRunningStep === stepId && this._dramaStep === stepId) {
                const stepTitle = stepNames[stepId];
                if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">${typeof marked !== 'undefined' ? marked.parse('## ' + stepTitle + '\n\n' + content) : '## ' + stepTitle + '\n\n' + content}</div>`;
            }
            this._dramaResult = this._buildFullResult();
            this._dramaRunningStep = null;
            UI.toast(`${stepNames[stepId]}完成 ✓`, 'success');
        } catch(e) {
            this._dramaRunningStep = null;
            UI.toast('步骤执行失败: ' + e.message, 'error');
        }
    },

    async _runDramaPipeline() {
        const input = (document.getElementById('cs-drama-input') || {}).value || '';
        if (!input.trim()) return UI.toast('请输入原文');
        if (input.length < 50) return UI.toast('内容太短，建议至少50字');

        const opts = {
            script: document.getElementById('cs-drama-opt-script')?.checked ?? true,
            char: document.getElementById('cs-drama-opt-char')?.checked ?? true,
            sb: document.getElementById('cs-drama-opt-sb')?.checked ?? true,
            visual: document.getElementById('cs-drama-opt-visual')?.checked ?? true,
            voice: document.getElementById('cs-drama-opt-voice')?.checked ?? true
        };

        this._dramaData = { script: '', char: '', sb: '', grid: '', visual: '', voice: '', plan: '' };
        const resultEl = document.getElementById('cs-drama-result');
        this._dramaStep = 0;
        this._updateDramaSteps();
        if (resultEl) resultEl.innerHTML = '<div class="text-dim text-xs flex items-center gap-2"><i class="fa-solid fa-spinner fa-spin"></i>漫剧流水线启动中...</div>';

        const stepMap = [
            null,
            { key: 'script', label: '剧本解析', opt: 'script' },
            { key: 'char', label: '角色定调', opt: 'char' },
            { key: 'sb', label: '分镜设计', opt: 'sb' },
            { key: 'grid', label: '分镜格子', opt: 'sb' },
            { key: 'visual', label: '画面提示词', opt: 'visual' },
            { key: 'voice', label: '配音脚本', opt: 'voice' },
            { key: 'plan', label: '合成规划', opt: null }
        ];

        try {
            for (let i = 1; i <= 7; i++) {
                const step = stepMap[i];
                if (step.opt && !opts[step.opt]) continue;
                this._dramaRunningStep = i;
                this._dramaStep = i;
                this._updateDramaSteps();
                const labelEl = document.getElementById('cs-drama-step-label');
                if (labelEl) labelEl.textContent = step.label;

                const skipped = this._dramaSkipConfig[step.key];
                const prompt = this._buildDramaPrompt(i, input);
                let content = '';

                if (skipped) {
                    // 跳过模式：只输出提示词，不调用AI
                    if (resultEl) resultEl.innerHTML = `<div class="text-amber-400 text-xs flex items-center gap-2"><i class="fa-solid fa-forward"></i>Step ${i}/7: ${step.label} [仅提示词模式]...</div>`;
                    content = `【此步骤已设置为「仅提示词」，未调用AI生成完整内容。以下是该步骤的提示词，可复制到对应平台使用】\n\n---\n\n${prompt}`;
                    // 短暂延迟让用户看到跳过提示
                    await new Promise(r => setTimeout(r, 300));
                } else {
                    // 执行模式：调用AI完整生成
                    if (resultEl) resultEl.innerHTML = `<div class="text-orange-400 text-xs flex items-center gap-2"><i class="fa-solid fa-spinner fa-spin"></i>Step ${i}/7: ${step.label}...</div>`;
                    await AI.generate(prompt, {}, c => { content += c; });
                }

                this._dramaData[step.key] = content;

                // 更新任务数据
                if (this._dramaActiveTaskId) {
                    const task = this._dramaTasks.find(t => t.id === this._dramaActiveTaskId);
                    if (task) {
                        task.data[step.key] = content;
                        task.progress = Math.round((i / 7) * 100);
                    }
                    this._refreshDramaTaskList();
                }

                // 只有当前视图仍在流水线模式时才更新（避免用户切换步骤后被覆盖）
                if (this._dramaRunningStep === i) {
                    const full = this._buildFullResult();
                    if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">${typeof marked !== 'undefined' ? marked.parse(full) : full}</div>`;
                }
            }

            this._dramaResult = this._buildFullResult();
            this._dramaRunningStep = null;

            // 更新任务状态
            if (this._dramaActiveTaskId) {
                const task = this._dramaTasks.find(t => t.id === this._dramaActiveTaskId);
                if (task) { task.status = 'done'; task.progress = 100; }
                this._refreshDramaTaskList();
            }

            UI.toast('漫剧流水线完成 ✓', 'success');
        } catch(e) {
            this._dramaRunningStep = null;
            UI.toast('流水线中断: ' + e.message, 'error');
        }
    },

    _updateDramaSteps() {
        for (let i = 0; i <= 7; i++) {
            const stepEl = document.getElementById(`drama-step-${i}`);
            const lineEl = document.getElementById(`drama-line-${i}`);
            if (stepEl) {
                const circle = stepEl.querySelector('div');
                const label = stepEl.querySelector('span');
                if (circle) {
                    if (this._dramaStep >= i) {
                        circle.className = circle.className.replace(/bg-white\/5 text-dim border-white\/10/g, 'bg-orange-500/20 text-orange-400 border-orange-500/30');
                    } else {
                        circle.className = circle.className.replace(/bg-orange-500\/20 text-orange-400 border-orange-500\/30/g, 'bg-white/5 text-dim border-white/10');
                    }
                }
                if (label) {
                    label.className = this._dramaStep >= i ? 'text-[8px] text-orange-400' : 'text-[8px] text-dim';
                }
            }
            if (lineEl && i > 0) {
                lineEl.className = this._dramaStep >= i ? 'flex-1 h-0.5 bg-orange-500/30 mx-1' : 'flex-1 h-0.5 bg-white/10 mx-1';
            }
        }
    },

    _copyDramaResult() {
        const text = this._dramaResult || this._buildFullResult();
        if (!text.trim()) return UI.toast('无内容可复制');
        navigator.clipboard.writeText(text).then(() => UI.toast('已复制到剪贴板'));
    },

    async _saveDramaResult() {
        const sections = [
            { key: 'script', title: '剧本解析' },
            { key: 'char', title: '角色外观定调' },
            { key: 'sb', title: '分镜设计' },
            { key: 'visual', title: '画面生成提示词' },
            { key: 'voice', title: '配音脚本' },
            { key: 'plan', title: '合成规划' }
        ];
        const hasContent = sections.some(s => this._dramaData[s.key]);
        if (!hasContent) return UI.toast('无内容可保存');

        // 只保存有内容的阶段
        let savedCount = 0;
        for (const s of sections) {
            if (!this._dramaData[s.key]) continue;
            const id = 'drama_' + Utils.uuid();
            await DB.put('library_books', {
                id,
                name: '漫剧_' + s.title + '_' + new Date().toLocaleDateString(),
                content: this._dramaData[s.key],
                size: this._dramaData[s.key].length,
                date: new Date().toLocaleDateString(),
                type: 'drama',
                stage: s.key
            });
            savedCount++;
        }
        UI.toast(`已保存 ${savedCount} 个阶段到阅读中心`);
    }
});
