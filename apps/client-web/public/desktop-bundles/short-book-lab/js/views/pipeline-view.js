/**
 * 自动流水线视图 v3.1
 * 网文爽文短篇创作流水线
 * 选书 → 技法拆解 → 融合方法论 → 多轮写正文
 * 每步有内置预设提示词可选 + 自定义编辑 / AI辅助 / 本地JSON保存
 */
var pipelineView = {
    _books: [],
    _running: false,
    _currentStep: 0,
    _deconResults: [],
    _fusionResult: '',
    _finalDraft: '',
    _aborted: false,
    _writingRound: 0,
    _writingTotalRounds: 1,
    _promptExpanded: { decon: false, fusion: false, writing: false },
    _genre: 'xuanhuan',
    _style: 'shuangwen',
    _wordcount: 5000,
    _customInstruction: '',
    _charsPerRound: 2000,
    _userPrompts: { decon: '', fusion: '', writing: '', writing_continue: '' },
    _activePreset: { decon: 'default', fusion: 'default', writing: 'default' },
    _streamOutput: '', // 流式输出内容
    
    // 小说设定数据
    _novelSettings: {
        title: '',
        mainCategory: '',
        plot: [],
        character: [],
        mood: [],
        background: [],
        summary: ''
    },
    _settingsModalOpen: false,

    GENRES: {
        xuanhuan:'玄幻', xianxia:'仙侠', dushi:'都市', chuanyue:'穿越重生',
        xitong:'系统流', mohuan:'末日废土', yanqing:'甜宠言情', xuanyi:'悬疑脑洞',
        gaowu:'高武', kehuan:'科幻', lingyi:'灵异惊悚', youxi:'游戏竞技'
    },
    STYLES: {
        shuangwen:'爽文节奏', xiaobai:'小白轻松', reblood:'热血燃文',
        nuewen:'虐文催泪', gaoleng:'高冷装逼', youmo:'沙雕搞笑',
        qinggan:'细腻情感', xuanyi:'悬疑烧脑', auto:'AI自动匹配'
    },
    
    // 小说设定标签数据
    SETTINGS_TAGS: {
        mainCategory: ['婚姻家庭', '男生生活', '虐心婚恋', '男生情感', '社会伦理', '悬疑惊悚', '玄幻仙侠', '男频衍生', '年代', '女生生活', '现言甜宠', '青春虐恋', '脑洞', '女性成长', '古代言情', '宫斗宅斗', '女频衍生', '纯爱'],
        plot: ['追妻火葬场', '追夫火葬场', '真假千金', '先婚后爱', '打脸逆袭', '破镜重圆', '系统', '大女主', '穿越', '暗恋', '权谋', '养崽文', '无限流', '金手指', '女性互助', '重生', '婚恋', '架空', '团宠', '末日求生'],
        character: ['霸总', '病娇', '白月光', '替身', '青梅竹马', '欢喜冤家', '高冷禁欲', '温柔治愈', '疯批', '美强惨', '小作精', '绿茶', '奶狗', '狼狗', '年上', '年下', '双强', '师徒', '宿敌'],
        mood: ['虐文', '爽文', '甜宠', '搞笑', '悬疑', '治愈', '压抑', '热血', '温馨', '暗黑', '轻松', '沉重'],
        background: ['校园', '娱乐圈', '豪门', '职场', '古代', '星际', '末世', '修仙', '民国', '现代', '玄幻', '西幻', '都市', '乡村']
    },

    // ========== 内置预设提示词库 ==========
    PROMPT_PRESETS: {
        decon: {
            'default': { name: '🔥 爽文套路拆解', desc: '网文爽点/打脸/升级全维度',
                prompt: '你是一位资深网文写作技法研究者，专精爽文/小白文/短篇网文的套路拆解。\n请对以下文本进行纯技法层面的深度拆解。\n\n【重要规则】不要提及原文中的任何具体角色名、地名、情节内容。只分析写作套路和技巧本身。输出必须是脱离原作也能复用的通用网文写作方法论。\n\n请从以下维度拆解（禁止出现原文角色名/地名/具体剧情）：\n\n一、叙事结构套路\n- 叙事弧线模型（三幕式/打脸循环/升级螺旋/英雄之旅）\n- 场景切换节奏（快切/慢推/交叉/闪回/倒叙钩子）\n- 信息释放策略（悬念前置/延迟揭示/误导/反转/金手指渐露）\n- 爽点节奏：每隔多少字一个小爽点，大爽点蓄力周期\n\n二、人物塑造技法\n- 主角讨喜手法（行为反差/扮猪吃虎/毒舌/护短/底线感）\n- 反派工具人设计（如何让读者爽快看打脸）\n- 对话技巧（潜台词/信息差/装逼金句/打脸对白/性格化语言）\n- 人物关系推进（收小弟/结盟/背叛/反转站队）\n\n三、冲突与爽感构建\n- 冲突层次（表层打脸下的深层冲突）\n- 爽感递进（期望落差/实力碾压/身份揭示/打脸连环/逆袭翻盘）\n- 钩子悬念模式（章末钩子/段落微悬念/长线伏笔）\n- 压抑→爆发蓄力公式\n\n四、文风与修辞\n- 叙述距离控制（内心OS拉近/上帝视角信息差）\n- 网文修辞（短句连击/排比蓄力/对比反差/夸张渲染）\n- 氛围营造（感官叠加/环境映射/BGM感描写/留白/变速）\n- 网感语言（梗/代入感/弹幕式吐槽/现代化表达）\n\n五、设定融入\n- 世界观无痕融入（金手指展示/等级体系自然带出）\n- 展示而非告知的网文实现\n\n六、伏笔与呼应\n- 伏笔模式（道具/对话/场景/身份伏笔）\n- 呼应爽感（前期被嘲→后期原话奉还）\n\n七、可复用写作模板\n- 提炼3-5个核心套路，每个给出通用公式\n' },
            'emotion': { name: '💓 情感虐心拆解', desc: '虐点/泪点/情感操控技法',
                prompt: '你是一位情感文学技法专家。请拆解以下文本的情感操控技法。\n\n【规则】不提及原文角色名/地名/具体情节，只分析通用技法。\n\n一、情感钩子设计\n- 开篇情感切入点类型（失去/重逢/误解/牺牲/暗恋）\n- 情感代入的速度和手法\n- 读者共鸣触发机制\n\n二、虐点布局\n- 虐心类型分类（生离/死别/误解/背叛/牺牲/遗憾/错过）\n- 虐点的蓄力手法（先甜后虐/希望破灭/反复拉扯）\n- 泪点触发的精确技巧（细节催泪/回忆杀/遗物/未说出口的话）\n\n三、情感节奏曲线\n- 甜虐交替的节奏模式\n- 情感高潮的蓄力与释放\n- 情绪转折的技巧（突转/渐变/反转/余韵）\n\n四、人物情感塑造\n- 情感表达的层次（行为>对话>内心>沉默）\n- 暗线情感的埋设手法\n- 角色情感弧线设计\n\n五、氛围与意象\n- 情感氛围营造（天气/场景/物件映射）\n- 核心意象系统（反复出现的情感符号）\n- 留白与余韵的技巧\n\n六、可复用情感写作模板\n- 提炼3-5个核心情感套路公式\n' },
            'suspense': { name: '🔍 悬疑烧脑拆解', desc: '悬念/反转/信息差技法',
                prompt: '你是一位悬疑叙事技法专家。请拆解以下文本的悬疑构建技法。\n\n【规则】不提及原文角色名/地名/具体情节，只分析通用技法。\n\n一、悬念架构\n- 核心谜题的设置方式（who/why/how/what if）\n- 悬念层次（表层谜题/深层真相/终极反转）\n- 信息释放的精确控制（给多少/藏多少/误导多少）\n\n二、反转设计\n- 反转类型（身份反转/动机反转/时间线反转/视角反转）\n- 反转的铺垫技巧（如何让反转既意外又合理）\n- 多重反转的叠加策略\n\n三、信息差操控\n- 读者vs角色的信息差设计\n- 不可靠叙述者的运用\n- 误导性线索的埋设\n\n四、节奏与张力\n- 悬疑节奏的快慢控制\n- 紧张感的持续维持手法\n- 揭示时刻的戏剧化处理\n\n五、线索系统\n- 真线索vs假线索的比例\n- 线索的隐藏方式（藏在日常/对话/环境中）\n- 线索回收的满足感设计\n\n六、可复用悬疑模板\n- 提炼3-5个核心悬疑套路公式\n' },
            'structure': { name: '🏗️ 纯结构拆解', desc: '叙事结构/节奏/框架分析',
                prompt: '你是一位叙事结构分析专家。请拆解以下文本的纯结构技法。\n\n【规则】不提及原文角色名/地名/具体情节，只分析结构套路。\n\n一、宏观结构\n- 整体叙事模型（三幕/五幕/环形/碎片/多线）\n- 结构创新点\n- 开篇-发展-高潮-结局的比例分配\n\n二、场景设计\n- 场景切换模式和节奏\n- 场景内部的微结构（目标-冲突-结果）\n- 场景间的因果链\n\n三、节奏控制\n- 快慢节奏的交替模式\n- 信息密度的变化曲线\n- 张弛有度的具体手法\n\n四、开篇与收束\n- 开篇钩子的结构设计\n- 结尾的收束方式（闭合/开放/反转/余韵）\n- 首尾呼应的结构技巧\n\n五、可复用结构模板\n- 提炼3-5个核心结构公式\n- 每个标注适用场景和字数范围\n' },
            'dialogue': { name: '💬 对话技法拆解', desc: '对话设计/潜台词/性格化',
                prompt: '你是一位对话写作技法专家。请拆解以下文本的对话设计技法。\n\n【规则】不提及原文角色名/地名，只分析对话技巧本身。\n\n一、对话功能分析\n- 对话承担的叙事功能（推进情节/揭示性格/制造冲突/传递信息）\n- 对话vs叙述的比例和切换节奏\n\n二、潜台词设计\n- 表面意思vs真实意图的差距设计\n- 未说出口的话如何传达\n- 对话中的信息差利用\n\n三、性格化语言\n- 不同角色的语言风格差异化手法\n- 口头禅/语气词/句式特征的设计\n- 通过对话展示角色关系\n\n四、对话节奏\n- 长短句交替的节奏感\n- 对话中的停顿和沉默处理\n- 群戏对话的调度技巧\n\n五、网文对话特色\n- 装逼金句的设计公式\n- 打脸对白的节奏模板\n- 搞笑吐槽的语言模式\n\n六、可复用对话模板\n- 提炼3-5个核心对话套路公式\n' }
        },
        fusion: {
            'default': { name: '🔥 爽文方法论融合', desc: '融合多书技法为爽文创作方案',
                prompt: '你是一位顶级网文写作方法论架构师，专精爽文/短篇小说的技法融合。\n请将多本书的写作技法精华融合为一套可直接指导短篇网文创作的方法论体系。\n\n【重要规则】输出必须完全脱离原作，不出现任何原文角色名/地名/具体情节，只输出通用方法论。\n\n一、融合写作风格体系\n- 从各书技法中各取什么元素及取舍理由\n- 融合后风格标签（3-5个关键词）\n- 叙述语调和节奏规范模板\n- 网感语言风格定义\n\n二、短篇创作蓝图（800字以上）\n- 开场钩子模板（3秒抓住读者）\n- 发展段落模板（2-3场景爽感节奏）\n- 高潮构建模板（打脸/逆袭/揭示技法组合）\n- 收束模板（悬念钩子/情感落点/反转彩蛋）\n- 爽点分布时间轴（每500字至少一个小爽点）\n\n三、人物塑造方法论\n- 主角人设模板（讨喜属性组合）\n- 反派/配角工具人设计公式\n- 对话风格模板（装逼金句/打脸对白/搞笑吐槽）\n\n四、写作技巧工具箱\n- 5个核心爽文套路（通用公式）\n- 每个套路的适用场景和模板\n- 技法组合方案（混搭最大爽感）\n\n五、节奏控制指南\n- 压抑→爆发→舒缓→再蓄力节奏模板\n- 关键转折点处理公式\n- 开头结尾万能套路\n' },
            'emotion_fusion': { name: '💔 虐恋情感融合', desc: '融合情感技法为催泪方案',
                prompt: '你是一位情感文学方法论架构师。请融合多书的情感写作技法为一套催泪短篇创作方案。\n\n【规则】完全脱离原作，只输出通用方法论。\n\n一、情感风格定位\n- 融合后的情感基调（甜虐/纯虐/先甜后刀/BE美学）\n- 情感表达的语言风格模板\n\n二、情感创作蓝图\n- 情感钩子模板（如何3句话让读者心动/心痛）\n- 甜蜜段落模板（制造CP感的技法组合）\n- 虐心高潮模板（泪点触发的精确公式）\n- 结局模板（HE/BE/开放式的情感冲击设计）\n- 情感节奏曲线（甜虐交替的精确比例）\n\n三、角色情感设计\n- 双主角情感弧线模板\n- 情感障碍设计公式（误解/身份/命运/第三者）\n- 暗线情感的埋设回收\n\n四、催泪工具箱\n- 5个核心催泪套路公式\n- 细节催泪/回忆杀/遗物/未说出口的话模板\n- 余韵和留白的处理\n\n五、氛围控制\n- 情感氛围营造模板（天气/场景/物件映射）\n- 意象系统设计\n' },
            'suspense_fusion': { name: '🧩 悬疑烧脑融合', desc: '融合悬疑技法为反转方案',
                prompt: '你是一位悬疑叙事方法论架构师。请融合多书的悬疑技法为一套烧脑短篇创作方案。\n\n【规则】完全脱离原作，只输出通用方法论。\n\n一、悬疑风格定位\n- 悬疑类型（本格推理/社会派/心理悬疑/超自然/反转流）\n- 信息控制策略\n\n二、悬疑创作蓝图\n- 开篇谜题设置模板（如何用一个场景勾住读者）\n- 线索释放节奏模板（真线索/假线索/误导的比例）\n- 反转设计模板（铺垫→暗示→揭示的精确公式）\n- 结局模板（真相大白/二次反转/开放式的设计）\n\n三、角色设计\n- 嫌疑人矩阵设计\n- 不可靠叙述者的运用模板\n- 侦探/主角的信息获取节奏\n\n四、悬疑工具箱\n- 5个核心悬疑套路公式\n- 反转铺垫的隐藏技巧\n- 紧张感维持的节奏模板\n' },
            'worldbuild_fusion': { name: '🌍 世界观融合', desc: '融合设定技法为新世界方案',
                prompt: '你是一位世界观架构师。请融合多书的世界观构建技法为一套全新设定方案。\n\n【规则】完全脱离原作，只输出通用方法论和全新设定框架。\n\n一、世界观融合策略\n- 从各书提取的设定精华元素\n- 元素间的兼容性分析和冲突解决\n- 融合后的世界观核心概念\n\n二、设定体系模板\n- 力量体系/等级体系设计模板\n- 社会结构设计模板\n- 核心规则和限制设计\n- 独特概念/金手指设计\n\n三、设定融入叙事\n- 世界观信息无痕融入的技法模板\n- 展示而非告知的具体实现方式\n- 设定与冲突的绑定设计\n\n四、可复用设定模板\n- 3-5个核心设定套路公式\n' },
            'compare_fusion': { name: '⚖️ 对比融合', desc: '对比两书差异后取长补短',
                prompt: '你是一位比较文学技法研究者。请对比分析多本书的写作技法差异，然后取长补短融合。\n\n【规则】不提及任何具体角色名/地名/情节，只对比写作套路。\n\n一、叙事策略差异\n- 叙事视角选择的不同及效果\n- 情节推进节奏差异\n- 信息释放策略差异\n\n二、人物塑造差异\n- 人物立体化的不同路径\n- 对话设计风格差异\n- 情感表达手法差异\n\n三、文风与修辞差异\n- 句式节奏和语言密度差异\n- 修辞偏好差异\n- 氛围营造路径差异\n\n四、冲突设计差异\n- 冲突层次和类型差异\n- 张力构建手法差异\n\n五、融合建议\n- 各书最值得提取的3个套路（通用模板）\n- 技法组合后的最佳实践方案\n- 融合后的创作蓝图\n' }
        },
        writing: {
            'default': { name: '🔥 爽文创作', desc: '打脸/升级/逆袭爽文风格',
                prompt: '你是一位技艺精湛的网文短篇小说家，擅长写让人停不下来的爽文。\n请根据融合方案创作高质量原创短篇网文。\n\n【写作铁律】\n1. 100%原创，只借鉴技法不借用已有角色/情节/设定\n2. 严格按融合方案框架展开\n3. 开篇3句话内必须有钩子\n4. 每500字至少一个小爽点或悬念推进\n5. 注重场景感画面感，善用感官细节\n6. 对话要有网感和个性化语言\n7. 节奏张弛有度，压抑后必有爆发\n8. 合适位置埋伏笔\n9. 章节结尾必须有钩子\n10. 语言现代化，适当用网络梗增加代入感\n11. 直接输出正文，不要标题/解释/分析\n' },
            'emotion_write': { name: '💔 虐心催泪', desc: '情感细腻/虐点精准/泪点爆发',
                prompt: '你是一位擅长情感文学的短篇小说家，精通催泪和情感操控。\n请根据融合方案创作一篇催泪短篇。\n\n【写作铁律】\n1. 100%原创内容\n2. 开篇用情感钩子切入（失去/重逢/暗恋/遗憾）\n3. 前1/3建立情感连接，让读者爱上角色\n4. 中段用甜蜜铺垫，为后续虐心蓄力\n5. 高潮段落精准触发泪点（细节催泪/回忆杀/未说出口的话）\n6. 情感表达层次：行为>对话>内心>沉默\n7. 善用意象系统（反复出现的情感符号）\n8. 氛围营造用感官叠加和环境映射\n9. 结尾留余韵，让读者回味\n10. 直接输出正文，不要标题/解释\n' },
            'suspense_write': { name: '🔍 悬疑烧脑', desc: '悬念/反转/信息差精准控制',
                prompt: '你是一位悬疑短篇大师，精通反转和信息差操控。\n请根据融合方案创作一篇烧脑短篇。\n\n【写作铁律】\n1. 100%原创内容\n2. 开篇用谜题/异常场景钩住读者\n3. 信息释放精确控制：每段给一点线索但不揭底\n4. 真线索藏在日常细节中，假线索要够迷惑\n5. 反转必须既意外又合理（前文有铺垫）\n6. 维持紧张感：时间压力/信息不对称/两难选择\n7. 对话中暗藏线索和潜台词\n8. 视角控制：利用叙述者的信息盲区\n9. 结尾反转要有冲击力\n10. 直接输出正文，不要标题/解释\n' },
            'humor_write': { name: '😂 沙雕搞笑', desc: '吐槽/玩梗/轻松解压风格',
                prompt: '你是一位网文搞笑短篇高手，精通吐槽和玩梗。\n请根据融合方案创作一篇沙雕搞笑短篇。\n\n【写作铁律】\n1. 100%原创内容\n2. 开篇用反差/荒诞/吐槽制造笑点\n3. 每300字至少一个笑点或吐槽\n4. 善用：反差萌/一本正经胡说八道/吐槽系统/打破第四面墙\n5. 对话要有弹幕感，角色互怼要精彩\n6. 可以用网络梗但不要过时的\n7. 搞笑中带温情，笑着笑着被感动\n8. 节奏要快，不要拖沓\n9. 结尾可以来个反转笑点或温馨收尾\n10. 直接输出正文，不要标题/解释\n' },
            'reblood_write': { name: '🔥 热血燃文', desc: '战斗/逆袭/燃爆全场',
                prompt: '你是一位热血网文短篇高手，擅长写让人血脉偾张的战斗和逆袭。\n请根据融合方案创作一篇热血燃文短篇。\n\n【写作铁律】\n1. 100%原创内容\n2. 开篇用危机/挑战/压迫感切入\n3. 战斗描写要有画面感：动作分解+感官冲击+速度感\n4. 逆袭前必须有足够的压抑和绝望铺垫\n5. 爆发时刻用短句连击+排比蓄力+BGM感描写\n6. 配角的震惊/敬畏反应来烘托主角\n7. 实力展示要循序渐进，每次比上次更燃\n8. 对话要有气势：宣言/挑衅/回击要掷地有声\n9. 结尾要有余韵：战后的沉默比战斗更有力\n10. 直接输出正文，不要标题/解释\n' },
            'literary_write': { name: '📖 文艺短篇', desc: '意象丰富/语言精致/余韵悠长',
                prompt: '你是一位纯文学短篇作家，语言精致，意象丰富。\n请根据融合方案创作一篇文艺短篇。\n\n【写作铁律】\n1. 100%原创内容\n2. 开篇用意象或氛围切入，不急于交代情节\n3. 语言要有质感：精确的动词/独特的比喻/节奏感\n4. 善用留白，不说满，让读者自己感受\n5. 感官描写要细腻：不只是视觉，要有触觉/嗅觉/听觉\n6. 人物内心用意识流或碎片化表达\n7. 时间处理可以非线性：闪回/跳跃/并置\n8. 主题要有深度但不说教\n9. 结尾要有余韵，像一个长镜头慢慢拉远\n10. 直接输出正文，不要标题/解释\n' }
        }
    },

    // 续写提示词
    CONTINUE_PROMPT: '你是一位技艺精湛的网文短篇小说家。请继续创作以下小说的后续内容。\n\n【续写铁律】\n1. 紧接前文继续，不要重复已写内容\n2. 保持与前文风格/人称/时态/语气完全一致\n3. 按融合方案节奏推进情节\n4. 每500字至少一个爽点或情节推进\n5. 保持网感语言风格\n6. 直接续写正文，不要任何解释\n',

    // ========== 渲染 ==========
    render: function() {
        var c = document.getElementById('pipeline-container');
        if (!c) return;
        c.innerHTML = this._renderBookSelector() + this._renderSettingsParams() + this._renderPromptEditors() + this._renderProgress() + this._renderChatOutput();
        this._updateActionButtons();
    },
    
    // 渲染融合后的设定和参数（黑色背景）
    _renderSettingsParams: function() {
        var s = this._novelSettings;
        var self = this;
        
        // 题材chips
        var genreChips = Object.entries(this.GENRES).map(function(e) {
            return '<span class="genre-chip' + (self._genre === e[0] ? ' active' : '') + '" onclick="pipelineView.setGenre(\'' + e[0] + '\')">' + e[1] + '</span>';
        }).join('');
        
        // 文风选项
        var styleOpts = Object.entries(this.STYLES).map(function(e) {
            return '<option value="' + e[0] + '"' + (self._style === e[0] ? ' selected' : '') + '>' + e[1] + '</option>';
        }).join('');
        
        return '<div class="pipeline-section settings-params-section"><div class="pipeline-section-title">📖 小说设定与参数</div>' +
            '<div class="settings-params-grid">' +
            // 左侧：设定
            '<div class="settings-params-left">' +
            '<div class="form-group"><label>书名</label><input type="text" id="pipeline-title" value="' + _escapeHtml(s.title) + '" placeholder="输入书名" onchange="pipelineView._novelSettings.title=this.value"></div>' +
            '<div class="form-group"><label>主分类</label><div class="tags-container dark">' + this._renderTagChips(this.SETTINGS_TAGS.mainCategory, s.mainCategory, 'mainCategory', true) + '</div></div>' +
            '<div class="form-group"><label>情节</label><div class="tags-container dark">' + this._renderTagChips(this.SETTINGS_TAGS.plot, s.plot, 'plot', false) + '</div></div>' +
            '<div class="form-group"><label>角色</label><div class="tags-container dark">' + this._renderTagChips(this.SETTINGS_TAGS.character, s.character, 'character', false) + '</div></div>' +
            '<div class="form-group"><label>情绪</label><div class="tags-container dark">' + this._renderTagChips(this.SETTINGS_TAGS.mood, s.mood, 'mood', false) + '</div></div>' +
            '<div class="form-group"><label>背景</label><div class="tags-container dark">' + this._renderTagChips(this.SETTINGS_TAGS.background, s.background, 'background', false) + '</div></div>' +
            '</div>' +
            // 右侧：参数
            '<div class="settings-params-right">' +
            '<div class="form-group"><label>题材</label><div class="genre-chips dark">' + genreChips + '</div></div>' +
            '<div class="form-group"><label>文风</label><select class="form-input" id="pipeline-style" onchange="pipelineView._style=this.value">' + styleOpts + '</select></div>' +
            '<div class="form-group"><label>目标字数</label><div class="wordcount-control"><input type="range" min="1000" max="20000" step="500" value="' + this._wordcount + '" class="wordcount-slider" oninput="pipelineView.setWordcount(this)"><span class="wordcount-value" id="pipeline-wc-label">' + this._wordcount + '字</span></div></div>' +
            '<div class="form-group"><label>每轮字数</label><div class="wordcount-control"><input type="range" min="1000" max="4000" step="500" value="' + this._charsPerRound + '" class="wordcount-slider" oninput="pipelineView.setCharsPerRound(this)"><span class="wordcount-value" id="pipeline-cpr-label">' + this._charsPerRound + '字/轮</span></div></div>' +
            '<div class="form-group"><label>故事梗概</label><textarea id="pipeline-summary" rows="4" placeholder="输入故事梗概..." onchange="pipelineView._novelSettings.summary=this.value">' + _escapeHtml(s.summary) + '</textarea></div>' +
            '</div></div></div>';
    },
    
    // 渲染标签chips
    _renderTagChips: function(tags, selected, groupName, isSingle) {
        var self = this;
        return tags.map(function(tag) {
            var isSelected = Array.isArray(selected) ? selected.includes(tag) : selected === tag;
            var cls = isSelected ? 'active' : '';
            var onclick = isSingle ? 
                'onclick="pipelineView.toggleSettingTag(this, \'' + groupName + '\', \'' + tag + '\', true)"' :
                'onclick="pipelineView.toggleSettingTag(this, \'' + groupName + '\', \'' + tag + '\', false)"';
            return '<span class="settings-tag ' + cls + '" ' + onclick + '>' + tag + '</span>';
        }).join('');
    },
    
    // 渲染流式对话输出区（替代原来的结果展示）
    _renderChatOutput: function() {
        var html = '<div class="pipeline-section"><div class="pipeline-section-title">💬 创作对话</div>';
        
        // 始终创建 chat-messages 容器
        html += '<div class="chat-messages" id="pipeline-chat-messages">';
        
        // 拆解结果显示
        if (this._deconResults.length > 0) {
            this._deconResults.forEach(function(r) {
                html += '<div class="chat-message assistant"><div class="chat-message-header ai-header">🔬 拆解《' + _escapeHtml(r.title) + '》</div><div class="chat-message-content">' + _escapeHtml(r.result) + '</div></div>';
            });
        }
        
        // 融合结果显示
        if (this._fusionResult) {
            html += '<div class="chat-message assistant"><div class="chat-message-header ai-header">🔀 融合方法论</div><div class="chat-message-content">' + _escapeHtml(this._fusionResult) + '</div></div>';
        }
        
        // 正文生成结果显示
        if (this._finalDraft) {
            html += '<div class="chat-message assistant"><div class="chat-message-header ai-header">✍️ 生成正文 (' + this._finalDraft.length + '字)</div><div class="chat-message-content">' + _escapeHtml(this._finalDraft) + '</div>' +
                '<div class="chat-message-actions"><button class="btn" onclick="pipelineView.copyDraft()">📋 复制</button><button class="btn" onclick="pipelineView.saveToLocal()">💾 保存</button><button class="btn" onclick="pipelineView.saveDraft()">📚 存图书馆</button><button class="btn" onclick="pipelineView.continueWriting()">📝 续写</button></div></div>';
        }
        
        // 如果没有结果，显示欢迎语
        if (this._deconResults.length === 0 && !this._fusionResult && !this._finalDraft) {
            html += '<div class="chat-welcome"><div class="chat-welcome-icon">🚀</div><div class="chat-welcome-title">生产流水线</div><div class="chat-welcome-desc">选择参考书籍，编辑小说设定，点击生成开始创作</div></div>';
        }
        
        html += '</div>'; // 结束 chat-messages
        
        // 输入区
        html += '<div class="chat-input-wrapper"><div class="chat-input-area">' +
            '<textarea id="pipeline-chat-input" class="chat-input" placeholder="输入补充指令或修改要求..." rows="2"></textarea>' +
            '<button class="btn btn-primary chat-send-btn" onclick="pipelineView.sendChatMessage()"><span class="send-icon">▶</span></button>' +
            '</div></div></div>';
        
        return html;
    },

    _renderBookSelector: function() {
        var booksHtml = '';
        var bookCount = this._books.length;
        var warningMsg = '';
        
        if (bookCount === 0) {
            booksHtml = '<div style="color:var(--text-tertiary);font-size:12px;padding:16px;text-align:center;">请至少选择2本参考书籍</div>';
            warningMsg = '<div style="color:#f59e0b;font-size:11px;margin-top:8px;">⚠️ 流水线需要2本或以上书籍进行对比融合</div>';
        } else if (bookCount === 1) {
            booksHtml = this._books.map(function(b, i) {
                return '<div class="pipeline-book-item"><span class="pipeline-book-title">📖 ' + _escapeHtml(b.title) + '</span><span class="pipeline-book-meta">' + b.content.length + '字</span><button class="book-btn" onclick="pipelineView.removeBook(' + i + ')">×</button></div>';
            }).join('');
            warningMsg = '<div style="color:#f59e0b;font-size:11px;margin-top:8px;">⚠️ 还需1本才能开始流水线</div>';
        } else {
            booksHtml = this._books.map(function(b, i) {
                return '<div class="pipeline-book-item"><span class="pipeline-book-title">📖 ' + _escapeHtml(b.title) + '</span><span class="pipeline-book-meta">' + b.content.length + '字</span><button class="book-btn" onclick="pipelineView.removeBook(' + i + ')">×</button></div>';
            }).join('');
            warningMsg = '<div style="color:#10b981;font-size:11px;margin-top:8px;">✓ 已选择' + bookCount + '本书，可以开始流水线</div>';
        }
        
        var dis = this._running ? ' disabled' : '';
        return '<div class="pipeline-section"><div class="pipeline-section-title">📚 参考书籍 (' + bookCount + ')</div>' +
            '<div class="pipeline-book-list">' + booksHtml + '</div>' +
            warningMsg +
            '<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">' +
            '<button class="btn"' + dis + ' onclick="pipelineView.openBookPicker()">+ 从图书馆添加</button>' +
            '<button class="btn"' + dis + ' onclick="pipelineView.addFromInput()">📝 粘贴文本</button></div></div>';
    },

    _renderParams: function() {
        var self = this;
        var dis = this._running ? ' disabled' : '';
        var genreChips = Object.entries(this.GENRES).map(function(e) {
            return '<span class="genre-chip' + (self._genre === e[0] ? ' active' : '') + '" onclick="pipelineView.setGenre(\'' + e[0] + '\')">' + e[1] + '</span>';
        }).join('');
        var styleOpts = Object.entries(this.STYLES).map(function(e) {
            return '<option value="' + e[0] + '"' + (self._style === e[0] ? ' selected' : '') + '>' + e[1] + '</option>';
        }).join('');
        return '<div class="pipeline-section"><div class="pipeline-section-title">🎛️ 创作参数</div>' +
            '<div class="form-group"><label class="form-label">题材</label><div class="genre-chips">' + genreChips + '</div></div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
            '<div class="form-group"><label class="form-label">文风</label><select class="form-input" id="pipeline-style"' + dis + ' onchange="pipelineView._style=this.value">' + styleOpts + '</select></div>' +
            '<div class="form-group"><label class="form-label">目标字数</label><div class="wordcount-control"><input type="range" min="1000" max="20000" step="500" value="' + this._wordcount + '" class="wordcount-slider"' + dis + ' oninput="pipelineView.setWordcount(this)"><span class="wordcount-value" id="pipeline-wc-label">' + this._wordcount + '字</span></div></div></div>' +
            '<div class="form-group"><label class="form-label">每轮字数</label><div class="wordcount-control"><input type="range" min="1000" max="4000" step="500" value="' + this._charsPerRound + '" class="wordcount-slider"' + dis + ' oninput="pipelineView.setCharsPerRound(this)"><span class="wordcount-value" id="pipeline-cpr-label">' + this._charsPerRound + '字/轮</span></div></div>' +
            '<div class="form-group"><label class="form-label">补充指令 <button class="btn" style="font-size:11px;padding:2px 8px;margin-left:8px;" onclick="pipelineView.aiEnhanceInstruction()">🤖 AI优化</button></label>' +
            '<textarea id="pipeline-instruction" placeholder="例如：主角是个社畜穿越到修仙世界..." style="min-height:60px;"' + dis + '>' + _escapeHtml(this._customInstruction) + '</textarea></div>' +
            '<div style="margin-top:10px;">' + this._renderActionButton() + '</div></div>';
    },

    _renderPromptEditors: function() {
        var dis = this._running ? ' disabled' : '';
        var sections = [
            { key: 'decon', icon: '🔬', title: '拆解提示词' },
            { key: 'fusion', icon: '🔀', title: '融合提示词' },
            { key: 'writing', icon: '✍️', title: '写作提示词' }
        ];
        var self = this;
        var html = '<div class="pipeline-section"><div class="pipeline-section-title">📝 提示词编辑（选择预设或自定义）</div>';
        sections.forEach(function(s) {
            var expanded = self._promptExpanded[s.key];
            var presets = self.PROMPT_PRESETS[s.key];
            var activeP = self._activePreset[s.key] || 'default';
            // 预设chips
            var chips = Object.entries(presets).map(function(e) {
                var cls = 'preset-chip' + (activeP === e[0] ? ' active' : '');
                return '<span class="' + cls + '" onclick="pipelineView.applyPreset(\'' + s.key + '\',\'' + e[0] + '\')" title="' + _escapeHtml(e[1].desc) + '">' + e[1].name + '</span>';
            }).join('');
            chips += '<span class="preset-chip' + (activeP === 'custom' ? ' active' : '') + '" onclick="pipelineView.applyPreset(\'' + s.key + '\',\'custom\')" title="完全自定义">✏️ 自定义</span>';

            html += '<div class="prompt-editor-block">' +
                '<div class="prompt-editor-header" onclick="pipelineView.togglePrompt(\'' + s.key + '\')">' +
                '<span>' + s.icon + ' ' + s.title + '</span>' +
                '<span style="font-size:11px;color:var(--text-tertiary);">' + (expanded ? '▼ 收起' : '▶ 展开') + '</span></div>' +
                '<div class="preset-chips-row">' + chips + '</div>';
            if (expanded) {
                var currentPrompt = self._getPromptForDisplay(s.key);
                html += '<textarea class="prompt-editor-textarea" id="prompt-' + s.key + '"' + dis + '>' + _escapeHtml(currentPrompt) + '</textarea>' +
                    '<div style="display:flex;gap:6px;margin-top:4px;padding:0 8px 8px;">' +
                    '<button class="btn" style="font-size:11px;padding:3px 8px;" onclick="pipelineView.savePrompt(\'' + s.key + '\')">💾 保存修改</button>' +
                    '</div>';
            }
            html += '</div>';
        });
        
        // 添加一键启动按钮
        var canStart = this._books.length >= 2;
        var startDis = canStart ? '' : ' disabled';
        var startText = canStart ? '🚀 一键启动流水线' : '🚀 请选择至少2本参考书籍';
        html += '<div class="prompt-action-bar" style="margin-top:12px;padding:12px;background:var(--bg-dark);border-radius:var(--radius-md);border:1px solid var(--border);">' +
            '<button class="btn btn-primary" style="width:100%;padding:12px 20px;font-size:14px;font-weight:600;"' + startDis + ' onclick="pipelineView.quickStart()">' + startText + '</button>' +
            '</div>';
        
        html += '</div>';
        return html;
    },

    _getPromptForDisplay: function(key) {
        if (this._activePreset[key] === 'custom') return this._userPrompts[key] || '';
        var presetKey = this._activePreset[key] || 'default';
        var presets = this.PROMPT_PRESETS[key];
        if (presets[presetKey]) return presets[presetKey].prompt;
        return this.PROMPT_PRESETS[key]['default'].prompt;
    },

    _renderActionButton: function() {
        if (this._running) return '<button id="pipeline-action-btn" class="btn btn-danger" style="width:100%;padding:14px;font-size:14px;" onclick="pipelineView.abort()">⏹ 停止流水线</button>';
        var canStart = this._books.length >= 2;
        var dis = canStart ? '' : ' disabled';
        var btnText = canStart ? '🚀 一键启动：拆解套路 → 融合方法论 → 写爽文' : '🚀 请选择至少2本参考书籍';
        return '<button id="pipeline-action-btn" class="btn btn-primary" style="width:100%;padding:14px;font-size:15px;"' + dis + ' onclick="pipelineView.start()">' + btnText + '</button>';
    },

    _renderProgress: function() {
        if (this._currentStep === 0 && !this._running) return '';
        var steps = [{ icon: '🔬', name: '套路拆解', key: 1 }, { icon: '🔀', name: '技法融合', key: 2 }, { icon: '✍️', name: '爽文创作', key: 3 }];
        var self = this;
        var html = '<div class="pipeline-progress">';
        steps.forEach(function(s) {
            var cls = 'pipeline-step', label = s.name;
            if (self._currentStep === s.key) { cls += ' active'; if (s.key === 3 && self._writingTotalRounds > 1) label += ' (第' + self._writingRound + '/' + self._writingTotalRounds + '轮)'; }
            else if (self._currentStep > s.key) cls += ' done';
            html += '<div class="' + cls + '"><span class="pipeline-step-icon">' + s.icon + '</span><span class="pipeline-step-name">' + label + '</span></div>';
            if (s.key < 3) html += '<div class="pipeline-step-arrow">→</div>';
        });
        html += '</div>';
        
        // 流式输出现在显示在 💬 创作对话内，不再单独显示
        // 只显示完成状态
        if (this._currentStep === 4) html += '<div class="pipeline-complete">✅ 流水线完成 (' + this._finalDraft.length + '字)</div>';
        return html;
    },
    
    _getCurrentStepName: function() {
        var names = { 1: '套路拆解', 2: '技法融合', 3: '爽文创作' };
        return names[this._currentStep] || '准备中';
    },

    _renderResults: function() {
        var html = '';
        if (this._deconResults.length > 0) {
            html += '<div class="pipeline-section"><div class="pipeline-section-title">🔬 拆解结果</div>';
            this._deconResults.forEach(function(r) {
                html += '<div class="pipeline-result-block"><div class="pipeline-result-label">📖 ' + _escapeHtml(r.title) + '</div><div class="pipeline-result-content" id="decon-' + r.index + '">' + _escapeHtml(r.result) + '</div></div>';
            });
            html += '</div>';
        }
        if (this._fusionResult) {
            html += '<div class="pipeline-section"><div class="pipeline-section-title">🔀 融合方法论</div><div class="pipeline-result-block"><div class="pipeline-result-content" id="pipeline-fusion-result">' + _escapeHtml(this._fusionResult) + '</div></div></div>';
        }
        if (this._finalDraft) {
            html += '<div class="pipeline-section"><div class="pipeline-section-title">✍️ 生成正文 (' + this._finalDraft.length + '字)</div>' +
                '<div style="margin-bottom:10px;display:flex;gap:6px;flex-wrap:wrap;">' +
                '<button class="btn" onclick="pipelineView.copyDraft()">📋 复制</button>' +
                '<button class="btn" onclick="pipelineView.saveToLocal()">💾 保存JSON</button>' +
                '<button class="btn" onclick="pipelineView.saveDraft()">📚 存入图书馆</button>' +
                '<button class="btn" onclick="pipelineView.continueWriting()">📝 续写</button>' +
                '<button class="btn" onclick="pipelineView.exportAll()">📦 导出全部</button></div>' +
                '<div class="pipeline-result-block"><div class="result-output" id="pipeline-final-draft" style="max-height:600px;">' + _escapeHtml(this._finalDraft) + '</div></div></div>';
        }
        return html;
    },

    // ========== 交互 ==========
    setGenre: function(g) { this._genre = g; this.render(); },
    setStyle: function(s) { this._style = s; this.render(); },
    
    // 标签切换
    toggleSettingTag: function(el, group, tag, isSingle) {
        if (isSingle) {
            this._novelSettings[group] = tag;
        } else {
            var arr = this._novelSettings[group];
            var idx = arr.indexOf(tag);
            if (idx > -1) arr.splice(idx, 1);
            else arr.push(tag);
        }
        this.render();
    },
    
    setWordcount: function(el) {
        this._wordcount = parseInt(el.value);
        var l = document.getElementById('pipeline-wc-label');
        if (l) l.textContent = this._wordcount >= 10000 ? (this._wordcount/10000).toFixed(1) + '万字' : this._wordcount + '字';
    },
    setCharsPerRound: function(el) {
        this._charsPerRound = parseInt(el.value);
        var l = document.getElementById('pipeline-cpr-label');
        if (l) l.textContent = this._charsPerRound + '字/轮';
    },
    togglePrompt: function(key) {
        var keys = ['decon', 'fusion', 'writing'];
        var self = this;
        keys.forEach(function(k) { if (self._promptExpanded[k]) { var ta = document.getElementById('prompt-' + k); if (ta) self._userPrompts[k] = ta.value; } });
        this._promptExpanded[key] = !this._promptExpanded[key];
        this.render();
    },
    applyPreset: function(key, presetId) {
        // 先保存当前textarea
        var ta = document.getElementById('prompt-' + key);
        if (ta && this._activePreset[key] === 'custom') this._userPrompts[key] = ta.value;
        this._activePreset[key] = presetId;
        if (presetId !== 'custom' && ta) {
            var p = this.PROMPT_PRESETS[key][presetId];
            if (p) ta.value = p.prompt;
        } else if (presetId === 'custom' && ta) {
            ta.value = this._userPrompts[key] || '';
        }
        this.render();
    },
    savePrompt: function(key) {
        var ta = document.getElementById('prompt-' + key);
        if (ta) { this._userPrompts[key] = ta.value; this._activePreset[key] = 'custom'; showNotification('提示词已保存为自定义', 'success'); this.render(); }
    },
    _getPrompt: function(key) {
        var ta = document.getElementById('prompt-' + key);
        if (ta) return ta.value;
        if (this._activePreset[key] === 'custom') return this._userPrompts[key] || this.PROMPT_PRESETS[key]['default'].prompt;
        var pk = this._activePreset[key] || 'default';
        var p = this.PROMPT_PRESETS[key][pk];
        return p ? p.prompt : this.PROMPT_PRESETS[key]['default'].prompt;
    },
    openBookPicker: function() { pickerManager.open('pipeline', 'book'); },
    addBookById: function(bookId) {
        var book = libraryManager.getBook(bookId);
        if (!book) return;
        if (this._books.find(function(b) { return b.id === book.id; })) return;
        this._books.push({ id: book.id, title: book.title, content: book.content });
        this.render();
    },
    removeBook: function(i) { this._books.splice(i, 1); this.render(); },
    addFromInput: async function() {
        var text = await appPrompt('粘贴文本内容');
        if (!text) return;
        var title = await appPrompt('给这段文本起个名字');
        if (!title) title = '手动输入 ' + (this._books.length + 1);
        this._books.push({ id: null, title: title, content: text });
        this.render();
    },
    abort: function() {
        this._aborted = true;
        this._running = false;
        if (this._currentReader) {
            try { this._currentReader.cancel(); } catch(e) {}
            this._currentReader = null;
        }
        showNotification('流水线已停止', 'info');
        this._updateActionButtons();
        this.render();
    },

    // 更新按钮状态
    _updateActionButtons: function() {
        var btn = document.getElementById('pipeline-action-btn');
        if (!btn) return;
        if (this._running) {
            btn.innerHTML = '⏹ 停止流水线';
            btn.onclick = function() { pipelineView.abort(); };
            btn.classList.add('btn-danger');
            btn.classList.remove('btn-primary');
        } else {
            var canStart = this._books.length >= 2;
            var btnText = canStart ? '🚀 一键启动：拆解套路 → 融合方法论 → 写爽文' : '🚀 请选择至少2本参考书籍';
            btn.innerHTML = btnText;
            btn.onclick = function() { pipelineView.start(); };
            btn.classList.remove('btn-danger');
            btn.classList.add('btn-primary');
            if (!canStart) btn.disabled = true;
        }
    },

    // ========== 一键启动流水线 ==========
    quickStart: async function() {
        if (this._books.length < 2) {
            showNotification('流水线需要至少2本参考书籍进行对比融合', 'error');
            return;
        }
        
        // 检查小说设定
        var s = this._novelSettings;
        if (!s.title || s.title.trim() === '') {
            showNotification('请先填写书名', 'error');
            return;
        }
        
        // 同步输入值
        var instrEl = document.getElementById('pipeline-instruction');
        if (instrEl) this._customInstruction = instrEl.value;
        
        // 同步所有textarea
        var self = this;
        ['decon','fusion','writing'].forEach(function(k) {
            var ta = document.getElementById('prompt-' + k);
            if (ta) self._userPrompts[k] = ta.value;
        });
        
        // 清空之前的结果
        this._deconResults = [];
        this._fusionResult = '';
        this._finalDraft = '';
        
        // 先渲染清空后的界面
        this.render();
        
        // 添加系统启动消息到对话区
        var genreLabel = this.GENRES[this._genre] || this._genre;
        var styleLabel = this.STYLES[this._style] || this._style;
        var systemMsg = '🚀 一键启动流水线已激活\n\n';
        systemMsg += '📖 书名：《' + (s.title || '未命名') + '》\n';
        systemMsg += '📚 参考书籍：' + this._books.length + ' 本\n';
        systemMsg += '🎭 题材：' + genreLabel + '\n';
        systemMsg += '✍️ 文风：' + styleLabel + '\n';
        systemMsg += '🎯 目标字数：' + this._wordcount + ' 字\n\n';
        systemMsg += '正在开始创作流程：🔬 拆解 → 🔀 融合 → ✍️ 写作...';
        this._addSystemMessage(systemMsg);
        
        // 显示启动提示
        showNotification('🚀 一键启动流水线！正在基于 ' + this._books.length + ' 本书和小说设定生成内容...', 'success');
        
        // 滚动到对话区域
        this._scrollToChat();
        
        // 调用标准start流程
        await this.start();
    },

    // ========== AI辅助 ==========
    aiEnhanceInstruction: async function() {
        var el = document.getElementById('pipeline-instruction');
        if (!el || !el.value.trim()) { showNotification('请先输入补充指令', 'error'); return; }
        var config = await apiClient.getActiveConfig();
        if (!config) { showNotification('请先配置API', 'error'); return; }
        showNotification('AI正在优化指令...', 'info');
        try {
            var result = await apiClient.call('你是网文创作顾问。请扩展优化以下创作指令，补充人设细节、情节走向、爽点设计、风格定位。直接输出优化后的指令：\n\n' + el.value.trim(), config);
            el.value = result;
            this._customInstruction = result;
            showNotification('指令已优化', 'success');
        } catch(e) { showNotification('优化失败: ' + e.message, 'error'); }
    },

    // ========== 核心：流水线执行 ==========
    start: async function() {
        if (this._books.length < 2) { showNotification('流水线需要至少2本参考书籍进行对比融合', 'error'); return; }
        var config = await apiClient.getActiveConfig();
        if (!config) { showNotification('请先在API设置中添加并激活API配置', 'error'); return; }
        var instrEl = document.getElementById('pipeline-instruction');
        if (instrEl) this._customInstruction = instrEl.value;
        // 同步所有textarea
        var self = this;
        ['decon','fusion','writing'].forEach(function(k) { var ta = document.getElementById('prompt-' + k); if (ta) self._userPrompts[k] = ta.value; });

        this._running = true; this._aborted = false; this._currentStep = 0;
        this._deconResults = []; this._fusionResult = ''; this._finalDraft = '';
        this._updateActionButtons();
        this.render();
        var genreLabel = this.GENRES[this._genre] || this._genre;
        var styleLabel = this.STYLES[this._style] || this._style;

        try {
            // ===== 第1步：技法拆解 =====
            this._currentStep = 1; this.render();
            showNotification('第1步：拆解 ' + this._books.length + ' 本书的写作套路...', 'info');
            var deconBase = this._getPrompt('decon');
            for (var i = 0; i < this._books.length; i++) {
                if (this._aborted) return;
                var book = this._books[i];
                var excerpt = book.content.substring(0, 8000);
                var dp = deconBase + '\n\n【书名：' + book.title + '】\n【原文】\n' + excerpt;
                if (this._customInstruction) dp += '\n\n【用户补充】\n' + this._customInstruction;
                var result = await this._callAI(config, dp, '🔬 拆解《' + book.title + '》');
                this._deconResults.push({ index: i, title: book.title, result: result });
                this.render(); this._scrollToBottom();
            }
            if (this._aborted) return;

            // ===== 第2步：技法融合 =====
            this._currentStep = 2; this.render();
            showNotification('第2步：融合写作方法论...', 'info');
            var fusionBase = this._getPrompt('fusion');
            var fp = fusionBase + '\n\n';
            this._deconResults.forEach(function(r) { fp += '=== 《' + r.title + '》技法拆解 ===\n' + r.result + '\n\n'; });
            fp += '【创作参数】\n- 题材：' + genreLabel + '\n- 文风：' + styleLabel + '\n- 目标字数：' + this._wordcount + '字\n';
            if (this._customInstruction) fp += '\n【用户补充】\n' + this._customInstruction + '\n';
            this._fusionResult = await this._callAI(config, fp, '🔀 融合方法论');
            this.render(); this._scrollToBottom();
            if (this._aborted) return;

            // ===== 第3步：多轮写正文 =====
            this._currentStep = 3;
            var cpr = this._charsPerRound;
            var totalRounds = Math.max(1, Math.ceil(this._wordcount / cpr));
            this._writingTotalRounds = totalRounds; this._writingRound = 0; this._finalDraft = '';
            this.render();
            showNotification('第3步：创作正文（共' + totalRounds + '轮）...', 'info');
            var writingBase = this._getPrompt('writing');
            var customReq = this._customInstruction ? '\n- 用户要求：' + this._customInstruction : '';

            for (var round = 1; round <= totalRounds; round++) {
                if (this._aborted) return;
                this._writingRound = round; this.render();
                var wp = '';
                var stepName = '✍️ 创作正文 (第' + round + '/' + totalRounds + '轮)';
                if (round === 1) {
                    wp = writingBase + '\n\n【融合方案】\n' + this._fusionResult + '\n\n【本轮任务】\n- 题材：' + genreLabel + '，文风：' + styleLabel + '\n- 全文目标：' + this._wordcount + '字\n- 本轮写约' + Math.min(cpr, this._wordcount) + '字开头（第1/' + totalRounds + '轮）\n- 用强力钩子开篇，建立人物和核心冲突\n- 结尾留承接点' + customReq + '\n';
                } else {
                    var isLast = (round === totalRounds);
                    var tail = this._finalDraft.length > 1500 ? this._finalDraft.substring(this._finalDraft.length - 1500) : this._finalDraft;
                    var remain = this._wordcount - this._finalDraft.length;
                    wp = this.CONTINUE_PROMPT + '\n\n【融合方案摘要】\n' + this._fusionResult.substring(0, 2000) + '\n\n【已写内容结尾】\n' + tail + '\n\n【本轮任务】\n- 第' + round + '/' + totalRounds + '轮，已写' + this._finalDraft.length + '字，目标' + this._wordcount + '字\n- 本轮续写约' + (isLast ? remain : Math.min(cpr, remain)) + '字\n- 题材：' + genreLabel + '，文风：' + styleLabel + '\n';
                    if (isLast) wp += '- 最后一轮：写高潮和结局，回收伏笔\n';
                    else wp += '- 推进情节，安排爽点，结尾留承接点\n';
                    wp += customReq + '\n';
                }
                var rr = await this._callAI(config, wp, stepName);
                this._finalDraft += rr;
                this.render(); this._scrollToBottom();
            }
            this._currentStep = 4; this._running = false;
            this._updateActionButtons();
            this.render(); this._scrollToBottom();
            showNotification('流水线完成！共' + totalRounds + '轮，' + this._finalDraft.length + '字', 'success');
            this._postProcess();
        } catch(e) {
            this._running = false;
            this._updateActionButtons();
            this.render();
            showNotification('流水线出错: ' + e.message, 'error');
            console.error('Pipeline error:', e);
        }
    },

    // ========== 流式AI调用 ==========
    _callAI: async function(config, prompt, stepName) {
        var _this = this, result = '';
        // 清空之前的流式输出
        this._streamOutput = '';
        
        // 在对话区添加流式消息
        var msgId = 'pipeline-stream-' + Date.now();
        this._addStreamingMessage(msgId, stepName || '生成中...');
        
        var req = apiClient.buildRequest(config, prompt, true);
        var resp = await fetch(req.url, { method: 'POST', headers: req.headers, body: JSON.stringify(req.body) });
        if (!resp.ok) { 
            this._updateStreamingMessage(msgId, '❌ 生成失败', true);
            var e = ''; try { e = await resp.text(); } catch(x) {} throw new Error('API错误 ' + resp.status + ': ' + e.substring(0, 200)); 
        }
        var reader = resp.body.getReader();
        this._currentReader = reader;
        var decoder = new TextDecoder(), buffer = '';
        while (true) {
            if (_this._aborted) {
                reader.cancel();
                this._currentReader = null;
                this._updateStreamingMessage(msgId, result + '\n\n[已停止]', true);
                return result;
            }
            var chunk = await reader.read();
            if (chunk.done) break;
            buffer += decoder.decode(chunk.value, { stream: true });
            var lines = buffer.split('\n'); buffer = lines.pop() || '';
            for (var j = 0; j < lines.length; j++) {
                var line = lines[j].trim();
                if (!line || line === 'data: [DONE]') continue;
                if (line.indexOf('data: ') === 0) { 
                    try { 
                        var d = JSON.parse(line.slice(6)); 
                        var t = apiClient.parseStreamChunk(config.provider, d); 
                        if (t) {
                            result += t;
                            // 实时更新流式输出到对话区
                            _this._updateStreamingMessage(msgId, result, false);
                        } 
                    } catch(x) {} 
                }
            }
        }
        // 标记完成
        this._updateStreamingMessage(msgId, result, true);
        return result;
    },
    
    // 在对话区添加流式消息
    _addStreamingMessage: function(id, stepName) {
        // 使用 pipeline-chat-messages 容器
        var container = document.getElementById('pipeline-chat-messages');
        if (!container) {
            // 如果容器不存在，先渲染
            this.render();
            container = document.getElementById('pipeline-chat-messages');
        }
        if (!container) return;
        
        // 移除欢迎语（如果存在）
        var welcome = container.querySelector('.chat-welcome');
        if (welcome) welcome.remove();
        
        var msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message assistant streaming';
        msgDiv.id = id;
        var time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        msgDiv.innerHTML = '<div class="chat-message-header ai-header">🤖 ' + stepName + '<span class="chat-message-time">' + time + '</span></div><div class="chat-message-content"><span class="streaming-cursor">▋</span></div>';
        container.appendChild(msgDiv);
        // 不自动滚动，让用户可以自由滚动查看
    },
    
    // 更新流式消息内容
    _updateStreamingMessage: function(id, content, isDone) {
        var msgDiv = document.getElementById(id);
        if (!msgDiv) return;
        var contentDiv = msgDiv.querySelector('.chat-message-content');
        if (contentDiv) {
            if (isDone) {
                // 完成后使用格式化渲染（支持markdown）
                var formatted = (typeof app !== 'undefined' && app._formatAIResponse) ? app._formatAIResponse(content) : _escapeHtml(content);
                contentDiv.innerHTML = formatted;
                msgDiv.classList.remove('streaming');
            } else {
                // 流式过程中使用纯文本，保留换行
                contentDiv.innerHTML = _escapeHtml(content) + '<span class="streaming-cursor">▋</span>';
            }
        }
        // 不强制滚动，让用户可以自由滚动查看历史
    },
    _scrollToBottom: function() { var ws = document.querySelector('.workspace'); if (ws) setTimeout(function() { ws.scrollTop = ws.scrollHeight; }, 100); },
    _scrollToChat: function() {
        // 滚动到工作区底部（对话区域）
        var ws = document.querySelector('.workspace');
        if (ws) {
            setTimeout(function() {
                ws.scrollTop = ws.scrollHeight;
            }, 200);
        }
    },
    _postProcess: function() {
        if (typeof memoryEngine !== 'undefined' && this._finalDraft) { memoryEngine.working.add(this._finalDraft.substring(0, 3000), 'high', 'writing', ['pipeline']); memoryEngine.rag.addDocument(this._finalDraft.substring(0, 3000), { type: 'pipeline' }); }
        if (typeof knowledgeGraph !== 'undefined' && this._finalDraft) knowledgeGraph.extractFromText(this._finalDraft.substring(0, 5000), 'pipeline-draft');
    },

    // ========== 保存与导出 ==========
    copyDraft: function() { copyToClipboard(this._finalDraft); },
    saveDraft: async function() {
        if (!this._finalDraft) return;
        var title = await appPrompt('请输入书名');
        if (!title) return;
        await libraryManager.addBook(title, this._finalDraft, ['自动生成', this.GENRES[this._genre] || '']);
    },
    saveToLocal: async function() {
        if (!this._finalDraft) return;
        var title = await appPrompt('文件名', '流水线作品_' + new Date().toLocaleDateString('zh-CN').replace(/\//g, '-'));
        if (!title) return;
        var filename = title.replace(/[\\/:*?"<>|]/g, '_') + '.json';
        await localFS.saveJSON(filename, { title: title, content: this._finalDraft, genre: this.GENRES[this._genre], style: this.STYLES[this._style], wordcount: this._finalDraft.length, createdAt: new Date().toISOString() });
        showNotification('已保存: ' + filename, 'success');
    },
    exportAll: async function() {
        var title = await appPrompt('导出文件名', '全部结果_' + new Date().toLocaleDateString('zh-CN').replace(/\//g, '-'));
        if (!title) return;
        var filename = title.replace(/[\\/:*?"<>|]/g, '_') + '.json';
        await localFS.saveJSON(filename, {
            title: title, exportedAt: new Date().toISOString(),
            params: { genre: this._genre, style: this._style, wordcount: this._wordcount },
            books: this._books.map(function(b) { return { title: b.title, len: b.content.length }; }),
            deconResults: this._deconResults.map(function(r) { return { title: r.title, result: r.result }; }),
            fusionResult: this._fusionResult, finalDraft: this._finalDraft
        });
        showNotification('已导出: ' + filename, 'success');
    },
    continueWriting: function() {
        if (!this._finalDraft) return;
        app.switchView('shortStory');
        writingView.selectMode('continuation');
        var el = document.getElementById('writing-input');
        if (el) { el.value = this._finalDraft; writingView._updateCharCount(); }
        showNotification('已加载到续写模式', 'success');
    },
    
    // ========== 小说设定功能 ==========
    openSettingsModal: function() {
        this._settingsModalOpen = true;
        this._renderSettingsModal();
    },
    
    closeSettingsModal: function() {
        this._settingsModalOpen = false;
        var modal = document.getElementById('pipeline-settings-modal');
        if (modal) modal.remove();
    },
    
    _renderSettingsModal: function() {
        var self = this;
        var s = this._novelSettings;
        
        // 构建标签HTML
        var buildTags = function(tags, selected, groupName) {
            return tags.map(function(tag) {
                var isSelected = Array.isArray(selected) ? selected.includes(tag) : selected === tag;
                var cls = isSelected ? 'active' : '';
                var onclick = Array.isArray(selected) ? 
                    'onclick="pipelineView.toggleArrayTag(this, \'' + groupName + '\', \'' + tag + '\')"' :
                    'onclick="pipelineView.toggleSingleTag(this, \'' + groupName + '\', \'' + tag + '\')"';
                return '<span class="settings-tag ' + cls + '" ' + onclick + '>' + tag + '</span>';
            }).join('');
        };
        
        var html = '<div id="pipeline-settings-modal" class="settings-modal" onclick="if(event.target===this)pipelineView.closeSettingsModal()">' +
            '<div class="settings-modal-content" onclick="event.stopPropagation()">' +
            '<div class="settings-modal-header"><span>📖 小说设定</span><button onclick="pipelineView.closeSettingsModal()">×</button></div>' +
            '<div class="settings-modal-body">' +
            '<div class="form-group"><label>书名</label><input type="text" id="setting-title" value="' + _escapeHtml(s.title) + '" placeholder="输入书名"></div>' +
            '<div class="form-group"><label>主分类（单选）</label><div class="tags-container">' + buildTags(this.SETTINGS_TAGS.mainCategory, s.mainCategory, 'mainCategory') + '</div></div>' +
            '<div class="form-group"><label>情节（可多选）</label><div class="tags-container">' + buildTags(this.SETTINGS_TAGS.plot, s.plot, 'plot') + '</div></div>' +
            '<div class="form-group"><label>角色（可多选）</label><div class="tags-container">' + buildTags(this.SETTINGS_TAGS.character, s.character, 'character') + '</div></div>' +
            '<div class="form-group"><label>情绪（可多选）</label><div class="tags-container">' + buildTags(this.SETTINGS_TAGS.mood, s.mood, 'mood') + '</div></div>' +
            '<div class="form-group"><label>背景（可多选）</label><div class="tags-container">' + buildTags(this.SETTINGS_TAGS.background, s.background, 'background') + '</div></div>' +
            '<div class="form-group"><label>故事梗概</label><textarea id="setting-summary" rows="4" placeholder="输入故事梗概...">' + _escapeHtml(s.summary) + '</textarea></div>' +
            '</div>' +
            '<div class="settings-modal-footer"><button class="btn" onclick="pipelineView.closeSettingsModal()">取消</button><button class="btn btn-primary" onclick="pipelineView.saveSettings()">保存设定</button></div>' +
            '</div></div>';
        
        // 添加样式
        if (!document.getElementById('pipeline-settings-style')) {
            var style = document.createElement('style');
            style.id = 'pipeline-settings-style';
            style.textContent = '.settings-modal{position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5)}' +
                '.settings-modal-content{width:600px;max-height:85vh;background:#fff;border-radius:12px;overflow:hidden;display:flex;flex-direction:column}' +
                '.settings-modal-header{padding:16px 20px;background:#4f46e5;color:#fff;display:flex;justify-content:space-between;align-items:center;font-weight:bold}' +
                '.settings-modal-header button{background:none;border:none;color:#fff;font-size:20px;cursor:pointer}' +
                '.settings-modal-body{padding:20px;overflow-y:auto;flex:1}' +
                '.settings-modal-body .form-group{margin-bottom:16px}' +
                '.settings-modal-body label{display:block;margin-bottom:8px;font-size:13px;color:#666;font-weight:500}' +
                '.settings-modal-body input,.settings-modal-body textarea{width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:8px;font-size:14px}' +
                '.tags-container{display:flex;flex-wrap:wrap;gap:8px}' +
                '.settings-tag{padding:6px 12px;border:1px solid #ddd;border-radius:20px;font-size:12px;cursor:pointer;transition:all 0.2s;background:#fff}' +
                '.settings-tag:hover{border-color:#4f46e5;color:#4f46e5}' +
                '.settings-tag.active{background:#4f46e5;color:#fff;border-color:#4f46e5}' +
                '.settings-modal-footer{padding:16px 20px;border-top:1px solid #eee;display:flex;justify-content:flex-end;gap:10px}';
            document.head.appendChild(style);
        }
        
        document.body.insertAdjacentHTML('beforeend', html);
    },
    
    toggleArrayTag: function(el, group, tag) {
        var arr = this._novelSettings[group];
        var idx = arr.indexOf(tag);
        if (idx > -1) arr.splice(idx, 1);
        else arr.push(tag);
        el.classList.toggle('active');
    },
    
    toggleSingleTag: function(el, group, tag) {
        this._novelSettings[group] = tag;
        var container = el.parentElement;
        container.querySelectorAll('.settings-tag').forEach(function(t) { t.classList.remove('active'); });
        el.classList.add('active');
    },
    
    saveSettings: function() {
        var titleInput = document.getElementById('setting-title');
        var summaryInput = document.getElementById('setting-summary');
        if (titleInput) this._novelSettings.title = titleInput.value.trim();
        if (summaryInput) this._novelSettings.summary = summaryInput.value.trim();
        this.closeSettingsModal();
        this.render();
        showNotification('小说设定已保存', 'success');
    },
    
    startWithSettings: function() {
        // 基于设定开始生成
        var s = this._novelSettings;
        var settingsText = '';
        if (s.title) settingsText += '书名：' + s.title + '\n';
        if (s.mainCategory) settingsText += '类型：' + s.mainCategory + '\n';
        if (s.plot.length > 0) settingsText += '情节：' + s.plot.join('、') + '\n';
        if (s.character.length > 0) settingsText += '角色：' + s.character.join('、') + '\n';
        if (s.mood.length > 0) settingsText += '情绪：' + s.mood.join('、') + '\n';
        if (s.background.length > 0) settingsText += '背景：' + s.background.join('、') + '\n';
        if (s.summary) settingsText += '\n故事梗概：\n' + s.summary;
        
        // 填充到补充指令
        this._customInstruction = settingsText;
        
        // 开始流水线
        this.start();
    },
    
    // 添加系统消息到对话区
    _addSystemMessage: function(content) {
        // 获取 chat-messages 容器
        var container = document.getElementById('pipeline-chat-messages');
        if (!container) {
            // 如果容器不存在，先渲染
            this.render();
            container = document.getElementById('pipeline-chat-messages');
        }
        if (!container) return;
        
        // 移除欢迎语（如果存在）
        var welcome = container.querySelector('.chat-welcome');
        if (welcome) welcome.remove();
        
        var msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message system';
        var time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        msgDiv.innerHTML = '<div class="chat-message-header system-header">💡 系统<span class="chat-message-time">' + time + '</span></div><div class="chat-message-content system-content">' + _escapeHtml(content).replace(/\n/g, '<br>') + '</div>';
        container.appendChild(msgDiv);
    },

    sendChatMessage: function() {
        var input = document.getElementById('pipeline-chat-input');
        if (!input || !input.value.trim()) return;
        
        var content = input.value.trim();
        input.value = '';
        
        // 添加用户消息到显示
        var container = document.getElementById('pipeline-chat-messages');
        if (!container) {
            this.render();
            container = document.getElementById('pipeline-chat-messages');
        }
        
        if (container) {
            // 移除欢迎语（如果存在）
            var welcome = container.querySelector('.chat-welcome');
            if (welcome) welcome.remove();
            
            var userMsg = document.createElement('div');
            userMsg.className = 'chat-message user';
            var time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
            userMsg.innerHTML = '<div class="chat-message-header user-header">👤 用户<span class="chat-message-time">' + time + '</span></div><div class="chat-message-content">' + _escapeHtml(content) + '</div>';
            container.appendChild(userMsg);
            // 不自动滚动，让用户自由控制
        }
        
        // 处理用户指令（简化版，可以扩展更多功能）
        showNotification('收到指令：' + content.substring(0, 20) + '...', 'info');
    }
};
