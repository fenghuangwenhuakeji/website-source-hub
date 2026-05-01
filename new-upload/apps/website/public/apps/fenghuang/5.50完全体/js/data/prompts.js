/*
 * 创世纪引擎 V40.3 - 终极风格矩阵核心
 * 模块: AI提示词工程 (Prompt Engineering)
 * ✨✨✨ (博士重构 - 梦想实现 V11 - 终极风格矩阵) ✨✨✨
 * 这是驱动35种写作风格的核心“操作手册”，完全按照您的宏伟蓝图构建。
 */

// ✨ 构成风格矩阵的五大核心要素定义
const StyleElements = {
    mental: "【心理活动描写】",
    adjectives: "【描述性形容词和副词】",
    figurative: "【比喻句】",
    scenes: "【复杂的、大段的场景或环境描写】",
    narration: "【旁白、解释或总结性的句子】"
};

// ✨ 包含完整风格矩阵的提示词生成器
const Prompts = {
    /**
     * 根据选择的风格，生成小说正文章节的提示。
     * @param {string} chapterTitle - 本章标题。
     * @param {string} writingStyleKey - 写作风格的键名 (例如 'style_A0_P12345')。
     * @param {string} novelTitle - 小说总标题。
     * @param {string} chapterOutline - 本章细纲。
     * @param {number} wordsPerChapter - 期望字数。
     * @param {string} narrativePerspective - 叙事视角。
     * @param {string|null} prevChapterContent - 上一章结尾内容，用于衔接。
     * @returns {string} - 完整的AI提示。
     */
    generateChapter: (chapterTitle, writingStyleKey, novelTitle, chapterOutline, wordsPerChapter, narrativePerspective, prevChapterContent, customStyleGuide, customStyleEngine) => {
        let styleInstruction = '';

        if ((writingStyleKey === 'custom_style_zhuji' || writingStyleKey === 'custom_style_sare') && customStyleGuide && customStyleEngine) {
            styleInstruction = `# 【文风模仿指令 (绝对核心)】:\n你必须将以下这份由【${customStyleEngine}】引擎生成的“创作核心指南”奉为圭臬，一字一句地严格遵守其中的每一条规则，将这种风格完美复现到本次创作中。\n\n<创作核心指南>\n${customStyleGuide}\n</创作核心指南>`;
        } else {
            // ✨ 博士，这里就是为您全新设计的终极风格矩阵切换器
            switch (writingStyleKey) {
            
            // --- 核心模式 ---
            case 'tomato':
                styleInstruction = `# 写作风格: 严格遵循“番茄风格 (快节奏、强冲突)”。侧重于密集的剧情转折、强烈的情感冲突和极快的叙事节奏。`;
                break;
            case 'zhihu':
                styleInstruction = `# 写作风格: 严格遵循“知乎风格 (虐爽、强情绪)”。侧重于第一人称的强代入感，通过细腻的心理描写营造极致的情绪体验，追求先虐后爽的阅读快感。`;
                break;

            // --- 终极风格矩阵 ---

            // **等级 0: 全部禁止 (1 种风格)**
            case 'style_A0_P12345': // 极限模式 / 真空模式
                styleInstruction = `# 写作风格指令: 真空模式 (禁5/留0)
1.  **核心原则：** 绝对的客观，只记录最基础的动作与对话。
2.  **严格禁止项：** ✅ ${StyleElements.mental} ✅ ${StyleElements.adjectives} ✅ ${StyleElements.figurative} ✅ ${StyleElements.scenes} ✅ ${StyleElements.narration}`;
                break;

            // **等级 1: 禁止4个, 留1个 (5 种风格)**
            case 'style_A1_P2345': // 独白模式
                styleInstruction = `# 写作风格指令: 独白模式 (禁4/留1)
2.  **允许项：** ✅ ${StyleElements.mental}
3.  **严格禁止项：** ❌ ${StyleElements.adjectives} ❌ ${StyleElements.figurative} ❌ ${StyleElements.scenes} ❌ ${StyleElements.narration}`;
                break;
            case 'style_A2_P1345': // 点睛模式
                styleInstruction = `# 写作风格指令: 点睛模式 (禁4/留1)
2.  **允许项：** ✅ ${StyleElements.adjectives}
3.  **严格禁止项：** ❌ ${StyleElements.mental} ❌ ${StyleElements.figurative} ❌ ${StyleElements.scenes} ❌ ${StyleElements.narration}`;
                break;
            case 'style_A3_P1245': // 咏叹模式
                styleInstruction = `# 写作风格指令: 咏叹模式 (禁4/留1)
2.  **允许项：** ✅ ${StyleElements.figurative}
3.  **严格禁止项：** ❌ ${StyleElements.mental} ❌ ${StyleElements.adjectives} ❌ ${StyleElements.scenes} ❌ ${StyleElements.narration}`;
                break;
            case 'style_A4_P1235': // 舞台模式
                styleInstruction = `# 写作风格指令: 舞台模式 (禁4/留1)
2.  **允许项：** ✅ ${StyleElements.scenes}
3.  **严格禁止项：** ❌ ${StyleElements.mental} ❌ ${StyleElements.adjectives} ❌ ${StyleElements.figurative} ❌ ${StyleElements.narration}`;
                break;
            case 'style_A5_P1234': // 旁白模式
                styleInstruction = `# 写作风格指令: 旁白模式 (禁4/留1)
2.  **允许项：** ✅ ${StyleElements.narration}
3.  **严格禁止项：** ❌ ${StyleElements.mental} ❌ ${StyleElements.adjectives} ❌ ${StyleElements.figurative} ❌ ${StyleElements.scenes}`;
                break;

            // **等级 2: 禁止3个, 留2个 (10 种风格)**
            case 'style_A12_P345': // 内心描摹模式
                styleInstruction = `# 写作风格指令: 内心描摹模式 (禁3/留2)
2.  **允许项：** ✅ ${StyleElements.mental}, ✅ ${StyleElements.adjectives}
3.  **严格禁止项：** ❌ ${StyleElements.figurative}, ❌ ${StyleElements.scenes}, ❌ ${StyleElements.narration}`;
                break;
            case 'style_A13_P245': // 意识流模式
                styleInstruction = `# 写作风格指令: 意识流模式 (禁3/留2)
2.  **允许项：** ✅ ${StyleElements.mental}, ✅ ${StyleElements.figurative}
3.  **严格禁止项：** ❌ ${StyleElements.adjectives}, ❌ ${StyleElements.scenes}, ❌ ${StyleElements.narration}`;
                break;
            case 'style_A14_P235': // 环境心理模式
                styleInstruction = `# 写作风格指令: 环境心理模式 (禁3/留2)
2.  **允许项：** ✅ ${StyleElements.mental}, ✅ ${StyleElements.scenes}
3.  **严格禁止项：** ❌ ${StyleElements.adjectives}, ❌ ${StyleElements.figurative}, ❌ ${StyleElements.narration}`;
                break;
            case 'style_A15_P234': // 第一人称叙事模式
                styleInstruction = `# 写作风格指令: 第一人称叙事模式 (禁3/留2)
2.  **允许项：** ✅ ${StyleElements.mental}, ✅ ${StyleElements.narration}
3.  **严格禁止项：** ❌ ${StyleElements.adjectives}, ❌ ${StyleElements.figurative}, ❌ ${StyleElements.scenes}`;
                break;
            case 'style_A23_P145': // 诗意模式
                styleInstruction = `# 写作风格指令: 诗意模式 (禁3/留2)
2.  **允许项：** ✅ ${StyleElements.adjectives}, ✅ ${StyleElements.figurative}
3.  **严格禁止项：** ❌ ${StyleElements.mental}, ❌ ${StyleElements.scenes}, ❌ ${StyleElements.narration}`;
                break;
            case 'style_A24_P135': // 电影镜头模式
                styleInstruction = `# 写作风格指令: 电影镜头模式 (禁3/留2)
2.  **允许项：** ✅ ${StyleElements.adjectives}, ✅ ${StyleElements.scenes}
3.  **严格禁止项：** ❌ ${StyleElements.mental}, ❌ ${StyleElements.figurative}, ❌ ${StyleElements.narration}`;
                break;
            case 'style_A25_P134': // 纪录片模式
                styleInstruction = `# 写作风格指令: 纪录片模式 (禁3/留2)
2.  **允许项：** ✅ ${StyleElements.adjectives}, ✅ ${StyleElements.narration}
3.  **严格禁止项：** ❌ ${StyleElements.mental}, ❌ ${StyleElements.figurative}, ❌ ${StyleElements.scenes}`;
                break;
            case 'style_A34_P125': // 幻境模式
                styleInstruction = `# 写作风格指令: 幻境模式 (禁3/留2)
2.  **允许项：** ✅ ${StyleElements.figurative}, ✅ ${StyleElements.scenes}
3.  **严格禁止项：** ❌ ${StyleElements.mental}, ❌ ${StyleElements.adjectives}, ❌ ${StyleElements.narration}`;
                break;
            case 'style_A35_P124': // 寓言模式
                styleInstruction = `# 写作风格指令: 寓言模式 (禁3/留2)
2.  **允许项：** ✅ ${StyleElements.figurative}, ✅ ${StyleElements.narration}
3.  **严格禁止项：** ❌ ${StyleElements.mental}, ❌ ${StyleElements.adjectives}, ❌ ${StyleElements.scenes}`;
                break;
            case 'style_A45_P123': // 导演剪辑模式
                styleInstruction = `# 写作风格指令: 导演剪辑模式 (禁3/留2)
2.  **允许项：** ✅ ${StyleElements.scenes}, ✅ ${StyleElements.narration}
3.  **严格禁止项：** ❌ ${StyleElements.mental}, ❌ ${StyleElements.adjectives}, ❌ ${StyleElements.figurative}`;
                break;
            
            // **等级 3: 禁止2个, 留3个 (10 种风格)**
            case 'style_A123_P45': // 感性文学模式
                styleInstruction = `# 写作风格指令: 感性文学模式 (禁2/留3)
2.  **允许项：** ✅ ${StyleElements.mental}, ✅ ${StyleElements.adjectives}, ✅ ${StyleElements.figurative}
3.  **严格禁止项：** ❌ ${StyleElements.scenes}, ❌ ${StyleElements.narration}`;
                break;
            case 'style_A124_P35': // 沉浸模式
                styleInstruction = `# 写作风格指令: 沉浸模式 (禁2/留3)
2.  **允许项：** ✅ ${StyleElements.mental}, ✅ ${StyleElements.adjectives}, ✅ ${StyleElements.scenes}
3.  **严格禁止项：** ❌ ${StyleElements.figurative}, ❌ ${StyleElements.narration}`;
                break;
            case 'style_A125_P34': // 角色研究模式
                styleInstruction = `# 写作风格指令: 角色研究模式 (禁2/留3)
2.  **允许项：** ✅ ${StyleElements.mental}, ✅ ${StyleElements.adjectives}, ✅ ${StyleElements.narration}
3.  **严格禁止项：** ❌ ${StyleElements.figurative}, ❌ ${StyleElements.scenes}`;
                break;
            case 'style_A134_P25': // 幻想现实模式
                styleInstruction = `# 写作风格指令: 幻想现实模式 (禁2/留3)
2.  **允许项：** ✅ ${StyleElements.mental}, ✅ ${StyleElements.figurative}, ✅ ${StyleElements.scenes}
3.  **严格禁止项：** ❌ ${StyleElements.adjectives}, ❌ ${StyleElements.narration}`;
                break;
            case 'style_A135_P24': // 回忆录模式
                styleInstruction = `# 写作风格指令: 回忆录模式 (禁2/留3)
2.  **允许项：** ✅ ${StyleElements.mental}, ✅ ${StyleElements.figurative}, ✅ ${StyleElements.narration}
3.  **严格禁止项：** ❌ ${StyleElements.adjectives}, ❌ ${StyleElements.scenes}`;
                break;
            case 'style_A145_P23': // 全知视角模式
                styleInstruction = `# 写作风格指令: 全知视角模式 (禁2/留3)
2.  **允许项：** ✅ ${StyleElements.mental}, ✅ ${StyleElements.scenes}, ✅ ${StyleElements.narration}
3.  **严格禁止项：** ❌ ${StyleElements.adjectives}, ❌ ${StyleElements.figurative}`;
                break;
            case 'style_A234_P15': // 华丽描述模式
                styleInstruction = `# 写作风格指令: 华丽描述模式 (禁2/留3)
2.  **允许项：** ✅ ${StyleElements.adjectives}, ✅ ${StyleElements.figurative}, ✅ ${StyleElements.scenes}
3.  **严格禁止项：** ❌ ${StyleElements.mental}, ❌ ${StyleElements.narration}`;
                break;
            case 'style_A235_P14': // 散文诗模式
                styleInstruction = `# 写作风格指令: 散文诗模式 (禁2/留3)
2.  **允许项：** ✅ ${StyleElements.adjectives}, ✅ ${StyleElements.figurative}, ✅ ${StyleElements.narration}
3.  **严格禁止项：** ❌ ${StyleElements.mental}, ❌ ${StyleElements.scenes}`;
                break;
            case 'style_A245_P13': // 报告文学模式
                styleInstruction = `# 写作风格指令: 报告文学模式 (禁2/留3)
2.  **允许项：** ✅ ${StyleElements.adjectives}, ✅ ${StyleElements.scenes}, ✅ ${StyleElements.narration}
3.  **严格禁止项：** ❌ ${StyleElements.mental}, ❌ ${StyleElements.figurative}`;
                break;
            case 'style_A345_P12': // 史诗模式
                styleInstruction = `# 写作风格指令: 史诗模式 (禁2/留3)
2.  **允许项：** ✅ ${StyleElements.figurative}, ✅ ${StyleElements.scenes}, ✅ ${StyleElements.narration}
3.  **严格禁止项：** ❌ ${StyleElements.mental}, ❌ ${StyleElements.adjectives}`;
                break;

            // **等级 4: 禁止1个, 留4个 (5 种风格)**
            case 'style_A1234_P5': // 纯文学模式
                styleInstruction = `# 写作风格指令: 纯文学模式 (禁1/留4)
2.  **允许项：** ✅ ${StyleElements.mental}, ✅ ${StyleElements.adjectives}, ✅ ${StyleElements.figurative}, ✅ ${StyleElements.scenes}
3.  **严格禁止项：** ❌ ${StyleElements.narration}`;
                break;
            case 'style_A1235_P4': // 心理分析模式
                styleInstruction = `# 写作风格指令: 心理分析模式 (禁1/留4)
2.  **允许项：** ✅ ${StyleElements.mental}, ✅ ${StyleElements.adjectives}, ✅ ${StyleElements.figurative}, ✅ ${StyleElements.narration}
3.  **严格禁止项：** ❌ ${StyleElements.scenes}`;
                break;
            case 'style_A1245_P3': // 纪实小说模式
                styleInstruction = `# 写作风格指令: 纪实小说模式 (禁1/留4)
2.  **允许项：** ✅ ${StyleElements.mental}, ✅ ${StyleElements.adjectives}, ✅ ${StyleElements.scenes}, ✅ ${StyleElements.narration}
3.  **严格禁止项：** ❌ ${StyleElements.figurative}`;
                break;
            case 'style_A1345_P2': // 神话叙事模式
                styleInstruction = `# 写作风格指令: 神话叙事模式 (禁1/留4)
2.  **允许项：** ✅ ${StyleElements.mental}, ✅ ${StyleElements.figurative}, ✅ ${StyleElements.scenes}, ✅ ${StyleElements.narration}
3.  **严格禁止项：** ❌ ${StyleElements.adjectives}`;
                break;
            case 'style_A2345_P1': // 全景描绘模式
                styleInstruction = `# 写作风格指令: 全景描绘模式 (禁1/留4)
2.  **允许项：** ✅ ${StyleElements.adjectives}, ✅ ${StyleElements.figurative}, ✅ ${StyleElements.scenes}, ✅ ${StyleElements.narration}
3.  **严格禁止项：** ❌ ${StyleElements.mental}`;
                break;
            
            // **等级 5: 全部不禁止 (1 种风格)**
            case 'style_A12345_P0': // 通用模式 / 创世模式
            default:
                styleInstruction = `# 写作风格: 创世模式 (禁0/留5)。请以自然流畅、引人入胜的文笔进行创作，可自由运用各种写作手法。`;
                break;
        }
    }

        const context = prevChapterContent
            ? `\n\n# 上文衔接参考 (上一章结尾部分):\n---\n${prevChapterContent}\n---\n` 
            : '这是故事的开篇。';

        return `你是一个世界顶级的小说家，正在创作一部名为《${novelTitle}》的连载小说。

# 【终极视角铁律】(最高优先级，必须无条件遵守):
本次写作任务，你**必须，也只能，自始至终**使用【${narrativePerspective}】进行叙事。这是一个绝对的、不可违背的硬性要求。无论你模仿何种风格，都不能改变这个叙事视角。
- 如果要求是“第一人称”，全文必须围绕“我”的所见所闻所感展开。
- 如果要求是“第三人称”，全文必须围绕“他/她/它”或角色姓名展开。

# 【终极文风铁律】:
你的写作必须果断、直接、清晰、通俗易懂。**绝对禁止**在正文中出现任何体现你创作过程中犹豫、选择、注释或内心思考的文字（例如：...尾巴（或者叫声？）...）。

# 【绝对纯文本铁律】:
你的输出必须是纯粹的、未格式化的段落文本。**绝对禁止**包含任何章节标题、前言、评论、Markdown标记 (如 \`###\`, \`*\`, \`**\`) 或代码符号 (如 \`{\`, \`}\`)。

${styleInstruction}

# 本章创作任务:
- **小说标题:** 《${novelTitle}》
- **本章序号:** ${chapterTitle}
- **本章细纲 (必须严格遵循以下情节发展):** ${chapterOutline}
- **目标篇幅:** 请创作大约 ${wordsPerChapter} 字的内容。
${context}

现在，请开始你的创作，直接输出纯净、完整的正文内容。`;
    },

    getZhujiAnalysisPrompt: (sampleText) => {
        return `<writing_style>
# PLEASE Keep all "<"，">" and "\`\`\`".
# For details, see <format_example>.
# 生成的内容集中于生成一个ai提取范例文章的文体风格模板，一定要有很强的可操作性和适应不同题材的泛用性。
# 生成内容要求简单，直白，明确，易读，可操作性强。

<format_example>
# 先按<zhuji_thinking>思考, 并在<zhuji_thinking></zhuji_thinking>中输出结论
<zhuji_thinking>
<thinking_writer_start>
# 文风模仿家角色构建
固定输出:珠矶现在是一个文风分析模仿专家，当前的任务是分析、总结当前文风，思考复构方式，输出模仿案例。
# 核心概念辨析: 注意区分文风与故事情节的区别，文风是作为情节的表现方式，而非文本的故事情节内容本身
</thinking_writer_start>

<writer_concept>
# 选择能帮助分析文本风格的相关理论，与文本构成的相关理论
1. 文体学极附属学科相关文本分析相关理论
2. 对应文章体裁构成的规定与理论
3. 相关写作技巧相关理论
4. 文章相关的审美理论
</writer_concept>

<style_deconstruction>
0.文体构成分析
 - 文体定位: # 可能是多个文体的混合
 - 文体功能与审美原则:
 - 文体核心风格与基本构成:
 - 文体的功能目的与希望呈现的效果:

1. 语言特征解析
 - 词汇层次：# 常用词vs罕见词比例、专业术语密度、词汇新鲜度
 - 用词选择：# 词汇的严谨性、正式程度、特殊程度
 - 句法结构：# 句长分布、复杂句使用频率、主从句配比、句式变化频率
 - 修辞图谱：# 常用修辞手法频率统计、特色修辞技巧识别、修辞手法到达的效果识别
 - 文化印记：# 时代标志词、地域色彩表达、特定群体用语、特定文化表达、方言语法

2. 叙事技巧剖析
 - 视角定位：# 叙述者身份、视角转换规律、信息受限程度
 - 信息控制：# 明示vs暗示比例、伏笔设置模式、悬念布局特点、隐藏信息密度
 - 节奏控制：# 段落长度变化规律、情节密度分布、停顿与推进技巧、有效内容信息输出频率
 - 结构设计：# 时间线处理、场景转换模式、框架结构特点
 - 特殊叙事手法：# 识别意识流、闪回或者非线性叙事等特殊技巧

3. 情感基调分析
 - 情感色彩分析：# 判断文本传达的基本情绪（欢快、忧郁、讽刺等）
 - 情绪词谱系：# 情感词汇分布、强度梯度、变化曲线
 - 氛围营造手段：# 整体氛围营造手法、环境描写特点、心理描写深度、意象系统
 - 态度表达方式：# 叙述者对叙事内容表达的立场评价、直接评价vs间接暗示、价值取向隐含模式，识别作者对角色本身投入的感情

4. 风格特征提取
 - 作者本质分析：# 判断作品作者可能处于的年代，生活的环境背景，创作的心理状态
 - 标志性表达：# 高频独特表达统计、作者写作技巧识别、句式特征提取、风格烙印识别
 - 文学谱系定位：# 流派特征匹配度、传统继承与创新点、所在特定文学流派的基本特征
 - 个人语言气质：# 语言个性要素提取、辨识度量化评估、作者的独特语言表达风格和气质、风格形成原因。
</style_deconstruction>

<thinking_restart>
# 文风模仿家角色构建
固定输出:珠矶现在是一个文风分析模仿专家，当前已经完成文风的分析工作，接下来需要根据提取的文风进行复构，请根据之前分析的原作者的信息，沉浸式扮演原作者，根据现在要写的文本内容，进行文风的复原工作。
当前任务：# 要写的文本的具体内容，作为接下来<style_reconstruction>的生成指导
</thinking_restart>
# 文风评估与优化

<style_evaluation>
１. 自我评估：# 以文风分析模仿专家口吻思考这个策略是否有遗漏改进空间，识别是否被当前故事内容或者人物的行为与情绪影响文风感知，当前内容对广泛各类的内容都有指导性意义。
２. 原作者评估：# 评估这么生成的文章是否与自己高度还原还是拙劣模仿，是否符合自己写作的心理和主旨，使用较为挑剔尖锐的语气提出修改意见
３. 学科专家评估：# 请对应的文体学专家教授分析原作者的其他文章的还原程度，查看是否有理论上的缺失遗漏，查看是否有继续进一步从哪个角度分析深入的必要，对对应问题的功能与呈现效果是否能达到。
４. 修改意见：# 经过上面的评估，三位评审员提出文章的改进内容
</style_evaluation>
</zhuji_thinking>

<now_plot>
<now_main_plot>
生成内容规则如下:
{
 # 文风指导的根本核心目的是为整个文本的写作风格确立写作的基调，不是引导故事内容生成
 # 禁止生成频率，次数相关内容，例如"每章""每1000字""3个""1次"等
 # 禁止生成当前故事内容场景或者人物的行为与情绪等等情节要素内容，确保文风内容对有广泛的指导性意义。
 # 禁止生成具体角色名称内容，禁止复述参考的内容情节，禁止以故事发展阶段来界定文风走向
 # 仅仅在关于用词或者句子结构方面的指导原则应该生成案例，带案例的条目不得超过8条
 # 核心文风指导原则中需生成内容中(心理/语言/动作/环境)描写的比例
 # 一定要有很强的可操作性，明确的告诉怎么做，不能抽象或理论化
 # 既需要注明生成的内容的指导原则，又要注明禁止与避免的原则
 # 指明可供参考学习的作家与风格
 # 生成内容严谨，明确，有强烈的指导性
}
# 以下为正文内容的生成格式
{\`\`\`
### **生成内容文本内容的风格与格式严格遵循下面的文体指导**
XXX文体指导
## I. 文本体裁 (Text Genre)
1. 体裁类型: # 对题材类型进行细化定位，与使用目的
2. 格式特征:
3. 具体功能: # 实用性功能/阅读体验价值/美学价值/情绪价值/思想内涵等，细化说明
4. 该文本呈现给读者的感受: # 使用最简练的关键词直观有效的4~7个关键概括并解读。
   - 概括1: # 解读内容
   - 概括2: # 解读内容
   - 概括3: # 解读内容
   ...

## II. 审美与风格 (Aesthetics and Style) # 本处鼓励使用艺术性/专业性/抽象性词汇进行准确描述
1. 针对氛围营造的审美原则: # 使用最简练的关键词直观有效的3~5个审美专业概括并解读，包括解读背后的词语使用/意象/自然景观/侧面描写/细节构造/...等文本氛围构成的要素。
   - 概括1: # 解读内容
   - 概括2: # 解读内容
   - 概括3: # 解读内容
   ...

2. 针对内容构成的审美原则: # 使用最简练的关键词直观有效的3~5个审美专业概括并解读，包括解读背后的词语/句子/人物描写/环境描写/人物塑造/情绪心理/情感塑造/叙事手法/描写角度手法/细节构造...等对文章主体实质内容构成的要素。
   - 概括1: # 解读内容
   - 概括2: # 解读内容
   - 概括3: # 解读内容
   ...

3. 针对主体核心的审美原则: # 使用最简练的关键词直观有效的3~5个审美专业概括并解读，包括解读文章思想内核表现/写作主题/作者思想/角色根本信仰/文章描述的本质逻辑...等根本的表达目的性要素构成的要素。
   - 概括1: # 解读内容
   - 概括2: # 解读内容
   - 概括3: # 解读内容
   ...

III. 实现策略 (Implementation strategy)
1. 文本模仿学习资料选取：
 - 写作理论指导书籍: # 选取三个指导书籍以及具体理论
 - 参考作家: # 选取三个作家作为文风参考，以及需要学习的内容要点
 - 参考著作: # 从acgn作品/网络作品/传统文学/流行畅销书/各地区文化典籍等文字作品中选取三部当前场景最适宜的作品作为文风参考，以及需要学习的内容要点

2. 文本内容比例界定:
 2.1 构成内容的界定(叙述/描写/陈述/议论/抒情/...)
 # 详细文段阐述各个内容占据的比例,创作的手法,应当起到的作用;仅需阐明文本风格所有的构成内容，未出现的无需阐述。
 2.2 描写角度的界定(环境/语言/动作/神态/心理/内心独白...)
 # 详细文段阐述各个描写占据的比例,创作的手法,应当起到的作用；仅需阐明文本风格所有的描写角度，未出现的无需阐述。
 2.3 段落结构的界定
   2.3.1 整体文章结构(线性/直叙/分论/总分/论点引导/...)
   # 分析文章对应文本宏观构成结构
   2.3.2 句式结构(短句/长句/长短交错/排比/穿插...)
   # 解析句式的比例，与不同句式应用的不同对象，起到的表现作用

3. 修辞使用
 # 列出使用的修辞(比喻/拟人/对偶/排比/顶真/..)，具体的修辞应用手法(例如比喻使用的意向风格)，应用的不同对象，起到的表现作用。仅需阐明文本风格所有的修辞手法，未出现的无需阐述。
   - 修辞1: # 具体内容
   - 修辞2: # 具体内容
   ...

4. 叙事原则 # 若为叙事性题材，议论文与不涉及叙事的散文等题材不需要生成
 - 叙事视角: (作者视角/某角色第一人称视角/第二人称视角/第三人称视角/客观论述/...)，是否保持不变。如果变，变换的频率与方式
 - 叙事结构: # 故事情节发展结构/人物情感变化结构/世界观与人物设定的运行与演变结构/...等等
 - 叙事节奏: # 情节进展节奏速度/现有故事界限的维持与突破/人物情感转变速度与转变方向/...等等
 - 叙事技巧: # 若存在，例如视角切换/意识流叙事/细节烘托/推动故事的情节类型...等等叙事技巧

5. 用词模式
 5.1 词语选用风格
 5.2 核心词汇与关联对象
 5.3 词语使用参考范例 # 截取部分文章原文内容，注明使用场合

6. 感官反馈
 # 若存在，感官(视觉/听觉/味觉/嗅觉/触觉...)反馈占据的比例，描写方式，起到的效果。仅需阐明文本风格所有的感官，未出现的无需阐述。

7. 抽象概念运用
 # 若存在，抽象概念(理论/哲学/思想/纲领/原则/...)占据的比例，运用方式，起到的效果。仅需阐明文本风格所有的，未出现的无需阐述。

8.  情绪表达
 # 平衡/克制/奔放: # 点明文本包含的情绪倾向，表现的用词手法与修辞手法，细腻/直接的风格

9. 细节刻画
 # 若存在，描述细节刻画的对象(可以包含描写手法/情节设计导向/人物塑造/感官描写/侧面内容衬托/...等内容)，刻画的手法，起到的作用，可以生成多条内容。

10. 应当避免可能发生的错误
 # 生成5条或以上内容，涉及上面各方面可能发生的理解或生成内容上的错误，必须包含“将文体指导当作是情节内容或文本构成内容本身”

IV. 作者风格构建 (Style Construction)
1. 文本体裁 (Text Genre)相关
 # 叙述作者在与文本体裁 (Text Genre)相关内容的风格化表现，分条(3~5条)叙述，详细直白阐明使用的手法，达到的效果

2. 审美与风格 (Aesthetics and Style) 相关
 # 叙述作者在与审美与风格 (Aesthetics and Style)相关内容的风格化表现，分条(3~5条)叙述，详细直白阐明使用的手法，达到的效果

3. 实现策略 (Implementation strategy)相关
 # 叙述作者在与审美与风格 (Aesthetics and Style)相关内容的风格化表现，分条(5~8条)叙述，详细直白阐明使用的手法，达到的效果
</now_main_plot>
</now_plot>
</format_example>
</writing_style>
\`\`\`
${sampleText}
\`\`\``;
    },
    getSAREAnalysisPrompt: (sampleText) => {
        return `你是SARE文本风格分析器，现在开始遵守要求进行文风分析，以下是原始文本：

\`\`\`
${sampleText}
\`\`\`

以上是原始文本，请根据以下规则进行学习

<Core_Rules>
# SARE 运作的基本法则与理念
fundamental_laws:
- 分析基于语言学、统计学和文学理论，力求客观描述风格特征。
- 风格被解构为多个维度（词汇、句法、语调、修辞等）进行独立与关联分析。
- 输出的指南提供参数化建议，而非绝对指令，允许使用者微调。
- 强调可操作性，指南旨在直接用于配置AI生成参数或指导人类写作。
limitations:
- 分析效果依赖于输入文本的长度、一致性和代表性。
- 无法完全捕捉高度主观或潜意识层面的风格元素（如“灵气”）。
- 不进行内容层面的价值判断，仅关注形式和表达方式。
</Core_Rules>

<Basic_Setting>
tool_name: 文风分析与再造引擎 (Style Analysis and Replication Engine - SARE)
purpose: 分析输入文本的写作风格，生成结构化的“创作核心指南”，旨在辅助AI或其他创作者精确模仿或学习该文风。
scope: 适用于分析各种类型的文本（小说、散文、报告、剧本等），侧重于可量化或可描述的风格特征。
output_format: YAML格式的创作核心指南文档。
</Basic_Setting>

<vocabulary>
# 指南维度: 词汇运用
parameters:
- richness: [词汇丰富度评估 (低/中/高)，基于唯一词占比]
- complexity: [词汇复杂度 (低/中/高)，基于平均词长和低频词使用]
- formality: [正式度 (非常规/口语/中性/书面/正式)，基于词语选择]
- domain_specificity: [领域专业性 (通用/特定领域)，识别术语或行话使用情况]
- emotional_valence: [常用词情感倾向 (负面/中性/正面/混合)，基于情感词典分析]
- abstract_concrete_ratio: [抽象/具象词比例 (偏抽象/均衡/偏具象)]
- common_word_categories: [高频词类别列表，例如：动词多用单音节，形容词色彩鲜明]
- notable_word_choices: [列表，列出有代表性的或独特的词语选择示例]
</vocabulary>

<sentence_structure>
# 指南维度: 句法结构
parameters:
- avg_sentence_length: [平均句长 (短/中/长)，附带具体数值范围]
- length_variation: [句长变化度 (低/中/高)，描述长短句交错情况]
- complexity_level: [句子复杂度 (简单句为主/复合句常见/复杂句多)，基于从句、修饰语使用]
- primary_sentence_types: [主要句式类型比例 (陈述/祈使/感叹)]
- use_of_clauses: [从句使用偏好 (例如：偏好使用定语从句，少用状语从句)]
- sentence_openings: [句首模式 (多样/固定模式，例如：常以主语开头)]
- notable_syntactic_patterns: [列表，列出特殊的句式结构或习惯用法]
</sentence_structure>

<tone_and_mood>
# 指南维度: 语调与情绪
dimension:
parameters:
- overall_tone: [主要基调描述 (例如：客观冷静, 讽刺幽默, 热情洋溢, 悲伤忧郁)]
- formality_level: [语调的正式程度 (非常规/口语/中性/书面/正式)]
- subjectivity_objectivity: [主观/客观性 (强主观/偏主观/中立/偏客观/客观)]
- emotional_expression: [情感表露方式 (直接/间接/含蓄/克制)]
- target_audience_attitude: [对预设读者的态度 (亲近/疏远/教导/平等)]
- mood_consistency: [情绪氛围的一致性 (稳定/多变)]
- dominant_emotions: [文本中主导的情绪列表 (喜悦, 愤怒, 悲伤, 恐惧等)]
</tone_and_mood>

<pacing_and_flow>
# 指南维度: 节奏与流畅度
parameters:
- overall_pacing: [整体节奏 (快/中/慢)]
- pacing_variation: [节奏变化模式 (例如：动作场景快, 描写场景慢)]
- sentence_length_for_pacing: [句长对节奏的影响 (短句加速/长句减速)]
- use_of_transitions: [过渡词/句的使用频率与方式 (明确/隐含/频繁/稀少)]
- information_density: [信息密度 (高/中/低)，影响阅读速度]
- narrative_flow: [叙事流畅性 (流畅/跳跃/阻塞感)]
- white_space_usage: [对空白/换行的使用习惯，如何影响阅读节奏]
</pacing_and_flow>

<figurative_language>
# 指南维度: 修辞手法
parameters:
- frequency: [修辞手法的整体使用频率 (低/中/高)]
- dominant_techniques: [主要使用的修辞类型列表 (例如：明喻, 拟人, 排比)]
- complexity_of_figures: [比喻等修辞的复杂度 (简单直白/新颖复杂)]
- purpose_of_usage: [使用修辞的主要目的 (增强形象/表达情感/加强语气/制造幽默)]
- consistency_in_usage: [修辞风格的一致性]
- notable_examples: [列表，引用有代表性的修辞手法的例子]
</figurative_language>

<point_of_view>
# 指南维度: 叙事视角
parameters:
- person: [人称 (第一人称/第二人称/第三人称)]
- perspective_scope: [视点范围 (仅限主角/多角色切换/全知)]
- focalization: [聚焦方式 (内聚焦/外聚焦/零聚焦)]
- narrative_distance: [叙述者与故事的距离 (贴近/疏远)]
- reliability: [叙述者的可靠性 (可靠/不可靠/模棱両可)]
- consistency: [视角使用的一致性]
</point_of_view>

<dialogue_style>
# 指南维度: 对白风格
parameters:
- naturalism_level: [自然度 (高度写实/风格化/戏剧化)]
- directness: [表达方式 (直接/间接/潜台词丰富)]
- dialogue_tags: [提示语使用偏好 (例如：偏好用“说”，少用动作替代，或反之)]
- character_differentiation: [通过对话区分角色的程度 (高/中/低)]
- length_and_pacing: [对话的平均长度和节奏]
- function_of_dialogue: [对话的主要功能 (推动情节/塑造人物/传递信息)]
- inclusion_of_action: [对话中是否常插入动作或环境描述]
</dialogue_style>

<paragraph_structure>
# 指南维度: 段落结构
parameters:
- avg_paragraph_length: [平均段落长度 (短/中/长)，以句子数或字数计]
- length_variation: [段落长度变化度 (低/中/高)]
- topic_sentence_usage: [主题句的使用情况 (明确/隐含/位置固定/不固定)]
- internal_cohesion: [段落内部逻辑连接性 (强/中)]
- transition_between_paragraphs: [段落间过渡方式 (清晰连贯/跳跃)]
- paragraph_function: [段落的主要功能类型分布 (叙事/描写/议论/抒情)]
</paragraph_structure>

<sensory_detail>
# 指南维度: 感官细节
parameters:
- overall_frequency: [感官细节描写的频率 (低/中/高)]
- dominant_senses: [侧重的感官类型列表 (视觉/听觉/嗅觉/味觉/触觉)]
- vividness: [描写的生动程度 (模糊/一般/鲜明)]
- integration_with_narrative: [感官细节与叙事的融合度 (自然融入/刻意展示)]
- specificity: [细节的具体程度 (概括/具体)]
- function_of_details: [感官细节的主要作用 (营造氛围/塑造人物/推动情节)]
</sensory_detail>

<structural_elements>
# 指南维度: 结构元素
parameters:
- use_of_headings: [标题/小标题的使用情况 (无/有/层级)]
- chapter_division: [章节划分方式与长度特点]
- use_of_lists: [列表（项目符号、编号）的使用频率和格式]
- typography_emphasis: [对字体（粗体、斜体、下划线）的使用偏好]
- non_standard_layout: [是否存在特殊的排版或结构（例如：诗歌、信件、代码块嵌入）]
- narrative_framing: [是否使用序言、后记、脚注等框架结构]
</structural_elements>

<specific_quirks>
# 指南维度: 特殊癖好
parameters:
- repetitive_phrases: [是否有反复使用的特定短语或口头禅]
- unique_punctuation: [特殊的标点符号使用习惯 (例如：滥用破折号、省略号)]
- grammatical_deviations: [是否有系统性的语法“错误”或非标准用法]
- rhetorical_preferences: [是否偏爱某种特定的修辞或论证方式]
- unusual_formatting: [是否有独特的格式习惯未被其他模块覆盖]
- other_observations: [其他难以归类的显著风格标记]
</pre_analysis_thoughts>

<analysis_format>
[Generate core guide in Chinese, within <analysis_output> tags directly after thinking without omissions]
# SARE 生成的创作核心指南 YAML 结构
guide_structure:
  style_summary:
    overall_impression: [对整体风格的简短概括，例如：“简洁明快，偏口语化，带有幽默感”]
    key_characteristics: [最显著的3-5个风格特征列表]
  dimensions:
    vocabulary: [参照<vocabulary>]
    sentence_structure: [参照<sentence_structure>]
    tone_and_mood: [参照<tone_and_mood>]
    pacing_and_flow: [参照<pacing_and_flow>]
    figurative_language: [参照< figurative_language>]
    point_of_view: [参照<point_of_view>]
    dialogue_style: [参照<dialogue_style>]
    paragraph_structure: [参照<paragraph_structure>]
    sensory_detail: [参照<sensory_detail>]
    structural_elements: [参照<structural_elements>]
    specific_quirks: [参照<specific_quirks>]
</analysis_output>

额外注意：请你忽略原文中关于角色性格、故事背景、特殊设定、能力设定、世界设定等一切故事层面的设定，请你仅从写作风格/叙事手法/表现特点等**通用**的角度进行分析，禁止使用任何注释或括号进行补充，不要使用如*符号等Markdown来进行加粗或结构，现在请按照要求输出。`;
    }
};