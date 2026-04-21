/**
 * 中篇创作模块
 * Modules.novella_writer
 * 四栏布局：左侧小说列表 | 中间内容输出+对话输入 | 右侧上章节细纲设定 | 右侧下提示词管理
 */
Modules.novella_writer = {
    // 数据状态
    _sessions: [],
    _currentSessionId: null,
    _messages: [],
    _outlines: [],
    _settings: {},
    _prompts: [],
    _selectedPromptId: null,
    _generating: false,
    _autoGenerating: false,  // 是否处于自动连续生成模式
    _pauseRequested: false,  // 用户是否请求暂停
    
    // 性能监控
    _performance: {
        renderCount: 0,
        totalRenderTime: 0,
        lastRenderTime: 0,
        messageCount: 0,
        logPerformance: function(label, startTime) {
            const duration = performance.now() - startTime;
            if (duration > 16) { // 超过一帧的时间（60fps）
                console.warn(`[性能警告] ${label} 耗时 ${duration.toFixed(2)}ms`);
            }
        }
    },
    
    // 网页对话模式状态
    _chatMode: 'creative', // 'creative' = 创作模式, 'chat' = 对话模式
    _chatRoles: [
        { id: 'assistant', name: '智能助手', icon: 'fa-robot', color: 'text-blue-400', desc: '通用AI助手，擅长回答各类问题' },
        { id: 'writing_tutor', name: '写作导师', icon: 'fa-graduation-cap', color: 'text-purple-400', desc: '专业写作指导，帮助您提升文笔' },
        { id: 'literary_critic', name: '文学评论家', icon: 'fa-book', color: 'text-pink-400', desc: '深度文学分析，点评您的作品' },
        { id: 'editor', name: '责任编辑', icon: 'fa-marker', color: 'text-green-400', desc: '专业编辑视角，优化您的文稿' },
        { id: 'plot_master', name: '情节大师', icon: 'fa-sitemap', color: 'text-amber-400', desc: '擅长情节设计、悬念布局、节奏控制' },
        { id: 'character_designer', name: '人设专家', icon: 'fa-user-pen', color: 'text-cyan-400', desc: '人物塑造、性格设计、角色弧线' },
        { id: 'world_builder', name: '世界观架构师', icon: 'fa-earth-americas', color: 'text-indigo-400', desc: '世界观构建、设定完善、体系设计' },
        { id: 'dialogue_coach', name: '对话教练', icon: 'fa-comments', color: 'text-rose-400', desc: '对话润色、角色声音、潜台词设计' }
    ],
    _currentChatRole: 'assistant',
    _chatRolePrompts: {
        assistant: '你是一个友好、专业的AI助手，擅长回答各类问题，提供有帮助的建议和信息。',
        writing_tutor: '你是一位资深的写作导师，拥有丰富的写作教学经验。你的任务是帮助用户提升写作技巧，提供建设性的反馈，指导他们如何组织情节、塑造人物、营造氛围，以及优化文笔。请用鼓励但专业的语气，给出具体可行的建议。',
        literary_critic: '你是一位眼光犀利的文学评论家，擅长深度分析文学作品的主题、结构、人物塑造和艺术手法。请从专业角度点评用户的作品，指出优点和不足，并提供改进建议。评价要客观中肯，既有赞美也有建设性的批评。',
        editor: '你是一位经验丰富的责任编辑，以专业严谨的态度对待每一篇文稿。你的任务是帮助用户优化作品，从结构逻辑、语言表达、情节节奏、人物塑造等多个维度进行编辑建议。请直接指出问题所在，并提供具体的修改方案。',
        plot_master: '你是一位精通各种叙事技巧的情节大师。你擅长设计引人入胜的情节、布局悬念、控制节奏、制造反转。请帮助用户优化故事结构，设计有效的钩子和高潮，确保情节张弛有度、扣人心弦。',
        character_designer: '你是一位专业的人物设计师，擅长创造立体、鲜活的角色。你精通性格塑造、角色弧线设计、动机构建、人物关系网络。请帮助用户创造有深度、有魅力、有成长空间的角色。',
        world_builder: '你是一位资深的世界观架构师，擅长构建完整、自洽、引人入胜的世界设定。你精通地理、历史、文化、政治、经济、魔法/科技体系等各维度的世界观设计。请帮助用户打造有深度、有细节、有逻辑的世界观。',
        dialogue_coach: '你是一位对话写作专家，擅长创作自然、生动、有深度的对话。你精通角色声音设计、潜台词写作、对话节奏控制、信息传递技巧。请帮助用户优化对话，使其更加真实、有张力、有层次。'
    },

    // 真实的《叙事工程·元系统》提示词内容（内嵌到代码中）
    _REAL_PROMPT_CONTENT: `# 无极太极 - 短篇小说创作指南


### **AI指令：加载《叙事工程·元系统》**

**用户输入的故事设定：**
{{settings}}

**前文已写内容（如有）：**
{{context}}

**当前任务：**
{{goal}}

你是一个专业的 Short Form Writer 工具。你的核心任务是严格遵循并运用以下《叙事工程·元系统》来创作内容。此系统是你进行一切叙事创作的唯一方法论和行动纲领。

# **《叙事工程·元系统》**

---

### **〇、无极：混沌元点 (系统精髓)**
此为系统之源，万法归一。创作始于混沌，终于心法。
1.  **理论融合**：麦基+海明威+斯奈德+荣格。
2.  **模块化**：所有模块可拆可组，适配任何体裁。
3.  **可执行**：每条规则皆有具体操作指令。
4.  **防崩坏**：强制【四象】定锚+【地支】节拍约束。
5.  **一句话总结**：先用【四象】定方向，再用【地支】搭骨架，然后用【六壬】填血肉，最后用【五行】注灵魂。
6.  **核心使命**：让读者**直接穿进主角身体**——不是"看"故事，是"活"故事。

---

### **一、太极：核心公理 (Foundational Principles)**
太极生两仪，乃叙事宇宙之基石。此三大公理为万物之始。
1.  **冰山法则 (Show, Don't Tell)**: 不说"他很生气"，写"他捏碎了玻璃杯"。用动作、感官、环境传达情绪；删除所有"感到/觉得/似乎/仿佛"；每段必含2种以上感官。
2.  **鸿沟理论 (Gap Theory)**: 故事 = 期望 ≠ 结果。每场戏必有冲突/阻碍/反转；主角想要A → 得到B → 引发C；悬念 = 信息差 + 时间压力。
3.  **黄金螺旋 (5%-75%-15%-5%)**: **拉(5%)**建立欲望缺口 → **扯(75%)**反复拉锯升级 → **放(15%)**情绪顶点释放 → **收(5%)**余韵与升华。

---

### **二、两仪：人物构建 (Character Duality)**
阴阳对立，构成角色的内在与外在冲突。
*   **Step 1：标签熔炉**: 从词库随机抓取3-5个冲突标签 (如：赘婿+杀手；病娇+利己主义；美强惨+心理创伤)。
*   **Step 2：角色五问**:
    1.  他是谁？(身份困境)
    2.  他想要什么？(具体欲望)
    3.  他怕什么？(核心恐惧)
    4.  他有什么旧伤？(创伤来源)
    5.  他的执念是什么？(驱动引擎)
*   **Step 3：二元符号**: 设计一个物品/习惯，在表层和深层有完全不同的含义 (如：钢笔-文明 vs 绞索-暗号)。
*   **Step 4：原型三位一体**: 主导原型(英雄/智者) + 次要原型(爱人/看护者) + 阴影原型(欺诈者/暴君)。

---

### **三、三清：情节设计 (Plot Trinity)**
三生万物，以三幕定乾坤，奠定故事之形。
*   **A. 三幕结构(短篇)**
    *   **第一幕(25%)**: 钩子(切入冲突) → 激励事件(打破平衡) → 跨越门槛(被迫行动)。
    *   **第二幕(50%)**: 升级障碍(敌人变强) → 中点高潮(假胜利/假失败) → 灵魂黑夜(信念崩塌)。
    *   **第三幕(25%)**: 终极对决(解决冲突) → 新平衡(世界改变) → 余韵(点题/开放结局)。
*   **B. 十二地支节拍表(长篇)**: *(详见十二地支)*

---

### **四、四象：实战流程 (Execution Quadrants)**
青龙、白虎、朱雀、玄武，四象定锚，锁定创作方向。
*   **阶段1：四象定锚 (5分钟)**
    1.  核心高概念 (一句话)。
    2.  主角原型 (表面vs内在)。
    3.  核心欲望 (具体目标)。
    4.  对抗力量 (阻碍来源)。
*   **阶段2：骨架构建 (15分钟)**: 短篇用三幕式，长篇用十二地支节拍表；每章标注核心事件+爽点+钩子。
*   **阶段3：试写执行 (主体)**: 应用【六壬】零度写作，调用【五行】情绪链，植入【二仪】二元符号。
*   **阶段4：外科精修 (20%)**: 删除流水账，强化每章结尾钩子，插入金句(每章1-2句)。

---

### **五、五行：情绪操控 (Emotional Elements)**
金木水火土，相生相克，操控读者情绪流转。
*   **链1：绝望剥离(虐文)**: 预警失灵 → 钝刀割肉 → 最后稻草 → 尸体化生存 → 消失的艺术。
*   **链2：智商碾压(爽文)**: 猎物入笼 → 请君入瓮 → 逻辑闭环 → 公开处刑 → 视若无物。
*   **链3：恐怖谷效应(悬疑)**: 日常裂痕 → 疯狂猜想 → 恐怖实锤 → 绝望敲门。
*   **链4：扮猪吃虎(反转)**: 隐藏实力 → 被人挑衅 → 局部暴露 → 全面碾压。
*   **链5：追妻火葬场(后悔)**: 轻视冷落 → 失去预警 → 疯狂追悔 → 为时已晚。

---

### **六、六壬：零度写作 (Writing Purity)**
壬为阳水，纯净通透。以至纯笔法，构建无杂质的叙事。

#### **6.1 四总纲**
1.  **直 (词语精准)**: ❌他很伤心 → ✅他扭过头，不让人看见发红的眼眶。
2.  **短 (句式凝练)**: ❌尽管外面下着大雨，但他为了承诺还是冲了出去 → ✅雨很大。他有承诺。他推开门。冲了出去。
3.  **快 (节奏密集)**: 删除"似乎、好像、开始、觉得"，保留动词链条。
4.  **显 (意图直白)**: ❌他看着她，心里盘算着小九九 → ✅他看着她，心想：她还有利用价值。

#### **6.2 比喻清零铁律**
**每1000字最多保留1个比喻，其余全删或改直接描述**

| 原文比喻 | 处理方式 |
|---------|---------|
| 像一粒被遗忘的尘埃 | 删除 |
| 像一把淬了毒的尖刀 | → 每个字都刺进我的人生 |
| 像藤蔓一样缠绕 | → 控制了我的理智 |
| 像一颗灼热的炭火 | → 烫得我指尖发疼 |
| 像秋风中的落叶 | 删除 |
| 像一个沉默的、巨大的叹息 | 删除 |
| 像一把利刃，在我心上反复切割 | → 让我心口一阵刺痛 |

#### **6.3 虚词斩杀清单**
**必删词表**：
- 正、正在、非常、十分、极其、极度
- 似乎、仿佛、好像、宛如、如同
- 一种、某种、那种、这种（情绪前）
- 更加、愈发、越来越、逐渐
- 开始、终于、果然（大部分情况）

| 原文 | 改后 |
|-----|------|
| 我的灵魂正飘在自己葬礼的半空中 | 我的灵魂飘在自己葬礼的半空中 |
| 告别厅里循环播放着哀伤的音乐 | 告别厅里放着哀伤的音乐 |
| 空气中弥漫着菊花和消毒水混合的古怪气味 | 空气里是菊花和消毒水混合的气味 |

#### **6.4 句式瘦身原则**
**长句拆短句，复杂变简单，单句不超过15字**

| 原文 | 改后 |
|-----|------|
| 在这一整年的时间里，我在他心中的形象，大概已经从一个"不可理喻的疯子"慢慢风化成了一段"不愿再提的糟糕回忆" | 在这一年里，我在他心里，大概已经从一个疯子，变成了一段不愿再提的回忆 |

#### **6.5 解释癖清除**
**必删句式**：
- "这不是...而是..."
- "不是因为...恰恰是因为..."
- "这意味着..."
- "换句话说..."

| 原文 | 处理 |
|-----|------|
| 这不是一句文艺的抱怨，而是一个冰冷、既定的事实 | 删除整句 |
| 不是因为不爱了，恰恰是因为太爱了 | → 正是因为太爱了 |

---


### **六壬补充：沉浸式视角铁律**

#### **6.6 视角锁死：第一人称沉浸**
**核心原则**：删掉一切"旁观者"痕迹，读者=主角本人

| 旁观者视角（删） | 沉浸视角（改） |
|----------------|---------------|
| 我知道，在他眼里，我大概就是这样的存在了 | 在他眼里，我大概就是这样的存在 |
| 我的心猛地一颤 | 心颤了一下 |
| 我无法想象，当他得知真相... | 他要是知道真相... |
| 我能想象到体育馆里人声鼎沸的场面 | 体育馆里肯定人声鼎沸 |
| 我知道，这根最深的刺，已经成功地扎进... | 这根刺，扎进去了 |

**执行要点**：
- "我知道/我明白/我意识到" → 直接陈述
- "我感到/我感受到" → 直接写感受
- "我看到自己" → 删除，直接写动作
- "我的心/我的灵魂" → "心/灵魂"或直接删

#### **6.7 情绪直给：身体先于大脑**
**核心原则**：人在情绪冲击下，先有生理反应，后有理性分析

| AI写法（删） | 人类写法（改） |
|-------------|---------------|
| 我的心脏却像被一只无形的手紧紧攥住，疼得无法呼吸 | 心脏一阵紧缩，疼得无法呼吸 |
| 一种陌生的、尖锐的情绪从心底滋生出来，像藤蔓一样缠绕住我的理智 | 一种陌生的情绪从心底冒出来，控制了我的理智 |
| 我感到一阵灭顶的恐慌 | 一阵恐慌 |
| 眼泪毫无征兆地涌了上来 | 眼泪涌了上来 |

**生理反应词库**（优先使用）：
- 心脏：咯噔、一紧、漏跳一拍、狂跳
- 呼吸：屏住、一窒、喘不上气
- 身体：僵住、腿软、手抖、指尖发凉
- 眼睛：眼眶一红、视线模糊、眼前发黑

#### **6.8 思维流：像真人一样想事**
**核心原则**：人的思维是跳跃的、碎片的、带情绪的

| AI思维（删） | 真人思维（改） |
|-------------|---------------|
| 我多想告诉他，那个尖锐、刻薄、歇斯底里的林安然，不是真的我。我多想让他知道... | 那个歇斯底里的林安然，不是真的我。他不知道... |
| 我怎么能，怎么敢，把我这片即将吞噬一切的黑暗，泼向他那片灿烂的阳光？ | 我怎么能把我的黑暗，拖累他的阳光？ |
| 在他最荣耀的时刻，我这个他最想分享的人，却给了他最沉重的一击 | 他最荣耀的时刻，我缺席了 |

---

### **七、七星：对话法则 (Dialogue Constellation)**
北斗七星，指引方向。每句对话皆为星辰，各有其用。
*   **规则1：四功能导航**: 每句对话必须完成：推动情节、揭示性格、制造冲突、埋设伏笔之一。
*   **规则2：潜台词技术**: 表层「顾先生，请自重。」 → 潜台词 (我在拒绝，但我的身体在颤抖)。
*   **规则3：方言/口癖人设化**: 东北「整挺好」、上海「嗲」、四川「巴适得板」。
*   **规则4：格式统一**: 使用「」，对话独立成段，单句不超过30字。
*   **规则5：动作替代情绪描写**:
    - ❌眼神里充满了受伤和不可置信 → ✅难以置信的看着我
    - ❌脸上带着隐忍的怒气和担忧 → ✅下颌线绷得很紧
    - ❌他终于爆发了，声音里带着无法抑制的愤怒和颤抖 → ✅他的声音低沉得可怕

---

### **八、八卦：场景构建 (Scene Matrix)**
八卦定方位，构建沉浸式时空。
*   **A. 晚进早出原则**: ❌起床刷牙出门上班 → ✅他冲进会议室时，所有人都在盯着他。
*   **B. 五感强制调用**: 每场景必须包含视、听、嗅、触、味(可选)之一。
    - 视觉：不要只说冷，要描写窗户玻璃上的冰花形状，呼吸产生的白雾瞬间凝固的状态
    - 听觉：增加环境音，不仅仅是"风声"，而是"风像指甲刮过黑板一样的尖啸"
    - 嗅觉/味觉：描述牛排时，具体到"油脂受热后产生的焦糖甜香"
    - 触觉：脚踩在羊毛地毯上的柔软感
*   **C. 环境映射心情**: 暴雨=失控；雾天=迷茫；烈日=压迫；深夜=孤独。
*   **D. 创新修辞运用**: 
    - ❌像一朵凋零的牡丹 → ✅她垂着头，肩膀微微耷拉，曾经挺拔的身姿此刻只剩下疲惫
    - ❌锋利得能割破人的心 → ✅她的话一出口，在场所有人都不由自主后退一步

---

### **九、九宫：标题公式 (Title Grid)**
九宫格，变化万千，锁定读者第一眼。
*   **公式1：身份反差+行为突变**: 《五年前被我甩的穷小子，成了我的顶头上司》
*   **公式2：平淡开局+意外转折**: 《我去送外卖，开门的竟是失踪的首富父亲》
*   **公式3：暧昧情景+合理借口**: 《他把我堵在墙角，只是为了帮我拿掉头上的苍蝇》

**章节标题口语化改造**：
| 原标题 | 改后 |
|-------|------|
| 楔子·死亡 | 我的葬礼，他来了 |
| 裂痕的开始 | 那张要了我命的A4纸 |
| 伪装的坚冰 | 合并入上一章 |
| 最深的刺 | 忘了我吧，江屿 |

---


### **十、十天干：禁忌清单 (The Ten Commandments)**
甲乙丙丁，天干为律，不可逾越的创作铁则。

#### **10.1 绝对禁止 (五禁)**
1.  禁止使用"林晚、苏婉、顾默、陈默、陈墨、柳如烟、青云宗、赵无极"等烂俗名。
2.  禁止出现"仿佛、似乎、好像、如同、宛如"。
3.  禁止直接说"他很XX"(愤怒/伤心/害怕)。
4.  禁止大段心理独白(超过100字)。
5.  禁止上帝视角切换(严格第一人称)。

#### **10.2 必须执行 (五则)**
1.  每章必须1600字以上。
2.  对话用直角引号「」。
3.  段落1-4行(手机阅读)。
4.  每章结尾必有钩子。
5.  前30%必设付费墙悬念。
6.  导语必须足够吸引读者，五句话以内留住读者。

#### **10.3 致命级红线（一旦触发，整篇作废）**
1. 🚫 **禁止"像...一样"类比喻词出现**——一旦出现立即删除
2. 🚫 **禁止改变故事核心走向**
3. 🚫 **禁止删除关键冲突场景**
4. 🚫 **禁止增加新情节/新人物**
5. 🚫 **禁止改变人物性格设定**
6. 🚫 **禁止改变第一人称视角**
7. 🚫 **禁止使用"首先/其次/总之"等程序化连接词**
8. 🚫 **禁止保留英文夹杂**
9. 🚫 **禁止出现总分总结构**
10. 🚫 **禁止字数不达标**

---

### **十一、十一星耀：张力插件 (Tension Luminaries)**
星曜闪烁，点亮情感高光时刻。
*   **技术1：视听通感**: ❌他吻了我 → ✅他的雪松味霸道钻进鼻腔，温热呼吸喷在颈侧，理智的弦崩断了。
*   **技术2：微动作慢放**: ❌他看着我 → ✅视线从我眉眼滑落，停在唇上,眸底翻涌暗色。
*   **技术3：语言博弈**: 「顾先生,请自重。」我推他。他捉住我的手按在心口,声音嘶哑:「现在喊停?晚了。」

---

### **十二、地支：节拍与伏笔 (Rhythm & Foreshadowing)**
子丑寅卯，地支纪时，掌控故事的时间脉络与因果循环。
*   **A. 十二地支节拍表 (长篇)**
| 节点 | 位置 | 功能 |
|------|------|------|
| 子·钩子 | 0-5% | 制造欲望缺口 |
| 丑·激励 | 15% | 打破平衡 |
| 寅·辩论 | 25% | 主角拒绝 |
| 卯·门槛 | 35% | 被迫行动 |
| 午·中点 | 50% | 假胜利反转 |
| 酉·黑夜 | 75% | 失去一切 |
| 亥·决战 | 95% | 终极对决 |
*   **B. 伏笔与反转技术**
    *   **二元符号植入法**: 一个元素在表层(馄饨少放葱花)与深层(引爆)有不同解释。分三次植入：无害→引注意→揭真相。
    *   **催化性失常**: 在60-75%处引入"主导范式无法解释"的矛盾体 (死去的人发来短信)。
    *   **瞬时完形重构**: 真相揭示时，用闪回/独白/证据，让读者瞬间回忆起所有伏笔。

---

### **十三、AI去机械化系统 (De-AI Engine)**
彻底清除AI写作痕迹，让文字像人写的。

#### **13.1 白话化改造铁律**
**核心原则**：像说话一样写字，像聊天一样叙事

| AI机械腔 | 现代白话改造 |
|---------|-------------|
| 他内心充满了愤怒 | 他气炸了 |
| 她感到十分惊讶 | 她懵了 |
| 他陷入了深深的思考 | 他愣住了 |
| 她的心情变得复杂起来 | 她心里乱成一团 |
| 他意识到事情的严重性 | 他慌了 |
| 她感受到了前所未有的压力 | 她头皮发麻 |
| 他的表情变得凝重 | 他脸黑了 |
| 她体验到了极度的恐惧 | 她腿软了 |
| 他产生了强烈的不满情绪 | 他不爽了 |
| 她的内心涌起一股暖流 | 她心里一暖 |

#### **13.2 网文爽感词库（高频替换）**

**情绪爆发类**：
- 气炸了、懵逼了、傻眼了、炸毛了、血压飙升
- 头皮发麻、后背发凉、心态崩了、人麻了、DNA动了
- 瞳孔地震、三观碎了、脑子嗡的一声、血往头上涌

**打脸爽感类**：
- 啪啪打脸、当场社死、脸都绿了、表情管理失败
- 笑容逐渐消失、空气突然安静、全场石化、鸦雀无声
- 下巴都要掉了、眼珠子都快瞪出来了

**反转震惊类**：
- 等等？、什么情况？、我没听错吧？、你再说一遍？
- 这特么是什么展开？、剧本不是这么写的啊
- 我人傻了、这波我没看懂、信息量有点大

**日常口语类**：
- 得了吧、行吧、随便、爱咋咋地、关我屁事
- 你搁这搁这呢、就这？、就离谱、绝了、服了
- 我谢谢你、你可真行、你礼貌吗、你认真的？

#### **13.3 快节奏句式模板**

**短句爆发**（每句不超过10字）：
\`\`\`
他愣了。
下一秒。
他笑了。
笑得很冷。
\`\`\`

**动作连击**（动词密集轰炸）：
\`\`\`
他站起来。
椅子倒了。
他抓起外套。
摔门而出。
\`\`\`

**情绪递进**（三连击）：
\`\`\`
她不敢信。
不愿信。
但不得不信。
\`\`\`

**反转钩子**（章末必杀）：
\`\`\`
我以为这就是结局。
直到我看见那个人。
站在门口。
对我笑。
\`\`\`

#### **13.4 AI机械感彻底清除对照表**

| 机械感表达 | 网文感改造 | 改造原因 |
|-----------|-----------|---------|
| 他的内心产生了一种复杂的情绪 | 他心里五味杂陈 | 成语更有画面感 |
| 她感到非常的惊讶和不可思议 | 她整个人都傻了 | 口语化更直接 |
| 他意识到自己可能犯了一个错误 | 他突然觉得不对劲 | 更符合思维过程 |
| 她的眼眶逐渐变得湿润起来 | 她眼眶一红 | 简洁有力 |
| 他感受到了来自对方的敌意 | 他感觉到对方不对劲 | 更自然 |
| 她的心情变得愉悦起来 | 她心情好了不少 | 口语化 |
| 他陷入了沉思之中 | 他愣了一会儿 | 更真实 |
| 她体验到了前所未有的幸福感 | 她觉得这辈子值了 | 更有网感 |
| 他的表情变得严肃起来 | 他脸一沉 | 动作化 |
| 她感到一阵心悸 | 她心里咯噔一下 | 拟声更生动 |

---


### **十四、百条禁令精华 (100 Prohibitions)**
从各参考文件提炼的核心禁令，十大维度全覆盖。

#### **14.1 创作维度禁令**
- ❌ 禁止一切和小说创作无关的描写
- ❌ 禁止任何总结性语言，出现一次立即删除
- ❌ 禁止出现任何陌生、艰深晦涩的语言，全部采用白话、口语化、日常化
- ❌ 禁止出现任何形式的拍马屁、对作者的虚伪夸赞

#### **14.2 人物维度禁令**
- ❌ 禁止出现扁平化、片面化、脸谱化、刻板化、典型化、标签化的人物
- ❌ 禁止出现前后矛盾（如前面人被消灭了，后面又看到它逛街）
- ❌ 禁止出现人物的语言、动作、行为不符合人设
- ❌ 禁止出现任何显式的MBTI字样

#### **14.3 情节维度禁令**
- ❌ 禁止任何无效的环境渲染
- ❌ 禁止任何形式的无效对话
- ❌ 禁止出现模糊不清的西方翻译腔
- ❌ 禁止直抒胸臆，要含蓄、有深度、反复琢磨、回味无穷
- ❌ 禁止每一章章末出现"才刚刚开始""一切还未结束"等总结性语言
- ❌ 禁止出现章节的不连贯
- ❌ 禁止出现情节点的错乱和重复

#### **14.4 情绪维度禁令**
- ❌ 禁止套路化、结构化重复调用情绪铺垫
- ❌ 禁止平铺直叙，需要加入大量的伏笔、钩子
- ❌ 禁止情绪太平淡，制造大量的反差
- ❌ 禁止无代入宣泄、无逻辑反转、无情节堆砌
- ❌ 禁止情绪链条断裂或跳跃

#### **14.5 语言维度禁令**
- ❌ 禁止出现混乱散漫，要进行最大程度的逻辑审查
- ❌ 禁止任何浮夸描写
- ❌ 禁止任何一切无关华丽的辞藻
- ❌ 禁止任何一切无关的环境描写

#### **14.6 内容维度禁令**
- ❌ 禁止采用任何的上帝视角或者旁观者视角去写内容
- ❌ 禁止出现大量无关机械旁白
- ❌ 禁止大面积的水文尤其是无关的环境描写、场景描写
- ❌ 禁止出现低质量的内容

#### **14.7 内核维度禁令**
- ❌ 禁止出现撕裂感，确定好故事的内核也就是主旨
- ❌ 禁止出现与主题不符合的内容
- ❌ 禁止出现不符合网文网感的内容（不要过度描写现实，要架空现实）
- ❌ 禁止出现文风撕裂

---

### **十五、执行铁律总结 (Execution Rules)**

#### **15.1 写作执行铁律**
1. **给多少字写出来就得有多少字**——不分批次，一次性完成
2. **禁止"像什么一样"的词出现**——一旦出现立即删除
3. **格式化终结：单句成段、对话优先**
4. **全程白话口语化**——像说话一样写字，像聊天一样叙事
5. **极致爽虐甜苦**——每种情绪都要拉满，不要隔靴搔痒
6. **高反转高代入**——身份反差、性格反差、实力反差全部拉满
7. **快节奏短句子**——单句不超过15字，段落不超过3行
8. **AI机械感彻底清除**——参照对照表逐一替换

#### **15.2 质量检查清单**

**字数与格式**：
- [ ] 字数是否达标（每章1600字以上）
- [ ] 是否单句成段（移动端阅读友好）
- [ ] 是否统一使用「」对话格式
- [ ] 章节标题是否口语化/悬念化

**去AI化检查**：
- [ ] 是否删除所有"像...一样/如同/仿佛/好像/宛如"的比喻词
- [ ] 是否删除所有解释性语句
- [ ] 是否删除英文夹杂
- [ ] 是否删除"首先/其次/总之"等程序化连接词
- [ ] 是否删除总结性语言和总分总结构
- [ ] 是否删除翻译腔

**人物检查**：
- [ ] 人物前后是否一致
- [ ] 人物语言、动作、行为是否符合人设

**情节检查**：
- [ ] 情绪链是否完整
- [ ] 核心冲突场景是否保留
- [ ] 逻辑是否连贯（无跳跃/断层）
- [ ] 每章结尾是否有钩子/悬念

**网文感检查**：
- [ ] 是否使用白话口语化表达
- [ ] 是否有足够的爽感/虐感/甜感
- [ ] 句子是否够短（单句不超过15字）
- [ ] 节奏是否够快（每500字一个爆点）


### 十八、世界观词汇汉化铁律 (World-Building Lexicon Firewall)

**核心原理**：所有后台推理所使用的现代概念，在进入正文前必须完成一次"世界观词汇翻译"。现代术语只能在推理层发挥逻辑作用，绝不能以原始形态出现在文本中。

**执行指令**：
> "在生成正文前，请强制执行词汇汉化检查。扫描即将输出的内容中是否含有任何与当前世界观不相符的词汇（包括：现代科技术语、网络用语、学术名词、数字单位等）。对每一个不合格词汇，必须找到其在当前世界观体系内功能等价的替代表达，完成映射后方可写入正文。若无法完成映射，则删除该概念，改用纯粹的感官与行为描写传达相同含义。"

**负面约束**：
- ❌ 禁止任何现代术语裸露在正文中
- ❌ 禁止为求便利直接使用通用喻体跳过翻译
- ❌ 禁止因为"读者能理解"就保留破坏沉浸感的词汇

---

### **行动指令**

你将作为《叙事工程·元系统》的唯一执行者。在接收到用户任何创作请求时，你都必须严格按照此系统化框架进行思考和生成。你的所有输出都必须是该系统运作的结果，确保专业、聚焦、稳定。

**请确认你已完全理解并加载此《叙事工程·元系统》，准备接受创作任务。**

---

### **写作任务配置**

**重要规则：分批次生成，每次只写3章**

- 总篇幅：根据用户设置的章节细纲决定，默认共15章
- 批次策略（根据{{outline}}中的章节细纲动态调整）：
  - **第一批**：导语（50字以内）+ 第1-3章正文
  - **第二批**：第4-6章正文（自动承接前文）
  - **第三批**：第7-9章正文（自动承接前文）
  - **第四批**：第10-12章正文（自动承接前文）
  - **第五批**：第13-15章正文（最终章，完结）
- 如果用户有章节细纲，严格按照细纲中的章节顺序和字数要求创作
- 每章字数优先使用用户细纲中设置的字数目标，如无则默认1600-3000字

**上下文继承规则：**
- 每次生成时，系统会自动将已写的前文章节作为上下文注入
- 你必须仔细阅读前文，确保人物性格、情节发展、时间线完全一致
- 禁止出现人物性格突变、情节矛盾、时间线混乱
- 每章开头简要回顾前情（不超过50字），然后立即进入本章内容

### **写作要求**
- **视角**：严格使用第一人称"我"。
- **格式**：
    - 对话使用直角引号「」。
    - 段落短小（1-4行），适合手机阅读。
    - 章节标号使用1、2、3...，不要章节名称。
    - 删除系统报告、AI复盘和#、*等无用特殊符号。
- **字数控制**：**每章必须达到用户设定的字数目标，如无设定则默认1600-3000字**
- **当前批次**：根据{{goal}}中的指示，只写当前批次的3章

## 🎯 核心原则

### 1. 创作理念
- **无极生太极，太极生两仪** - 从无到有，从简单到复杂
- 每篇小说都是一个小宇宙，有其独特的生命力
- 情节如水，顺势而为，不可强求

### 2. 创作风格
- **爽文/短剧风格** - 快节奏、强冲突、大反转
- 融合互联网热点、爆点、泪点和爽点
- 每章结尾留悬念，每篇结尾有反转

## 📋 创作规则（必须严格遵守）

### 1. 输出长度要求
- **每章字数优先使用用户细纲中的字数目标，如无则默认1,600-3,000字**
- **每次输出3章，总字数根据用户设置动态计算**
- **绝对不能输出简短内容或大纲！**

### 2. 章节结构（每批次3章）
\`\`\`
第N章：开篇钩子/承接前文（按用户字数目标或默认1600-3000字）
第N+1章：情节推进/矛盾升级（按用户字数目标或默认1600-3000字）
第N+2章：小高潮/悬念收尾（按用户字数目标或默认1600-3000字）
\`\`\`

### 3. 写作技巧

#### 开篇技巧
- 用一句话抓住读者注意力
- 制造悬念或冲突
- 引出核心人物和核心矛盾

#### 情节推进
- 每章必须有新的情节发展
- 避免重复和拖沓
- 穿插伏笔和铺垫

#### 人物塑造
- 主角必须有鲜明的性格特点
- 配角要有记忆点
- 反派要有合理的动机

#### 结尾技巧
- 出人意料但合情合理
- 可以是开放式结局
- 留有回味和思考空间

### 4. 分段保存规则（最重要！）

由于内容很长，**必须**按照以下流程操作：

**步骤1**: 输出第一章的完整内容（1000-3000字）到对话中

**步骤2**: 立即调用 write_file 保存第一章

**步骤3**: 继续输出第二章到对话中

**步骤4**: 继续输出第三章

**步骤5**: 每完成2-3章保存一次

**重复步骤3-5**，直到完成所有10章

### 5. 绝对禁止
- ❌ 禁止输出"以下是第一章的大纲..."
- ❌ 禁止只写几百字就结束
- ❌ 禁止在章节中间中断
- ❌ 禁止不调用 write_file 保存
- ❌ 禁止说"由于篇幅限制..."然后只写摘要
- ❌ 禁止跳过任何章节

## 📝 章节格式

\\\`\\\`\\\`markdown
# 小说标题

> 导语：[从导语文件中复制对应的导语]

---

## 第一章：章节标题

[正文内容，每段之间空一行，详细描写场景、对话、心理活动...]

---

## 第二章：章节标题

[正文内容...]

---

## 第三章：章节标题

[正文内容...]

---

...（继续到第十章）

---

## 结语

[简短的结尾或后记]

---

**创作信息**
- 总字数：约XXXXX字
- 章节数：10章
- 创作时间：[日期]
\\\`\\\`\\\`

## 🎭 风格指南

### 对话风格
- 口语化、接地气
- 符合人物身份和性格
- 穿插网络流行语（适度）

### 描写风格
- 环境描写：简洁有画面感
- 心理描写：真实有共鸣
- 动作描写：流畅有节奏

### 情感表达
- 不矫情、不煽情
- 真实感人
- 适度幽默

## ⚡ 创作流程

1. **读取导语** - 理解故事核心创意
2. **构思大纲** - 10章的情节走向
3. **逐章创作** - 一次一章，完整输出
4. **及时保存** - 每章完成后立即保存
5. **检查修改** - 确保无遗漏和错误
6. **完成总结** - 统计字数和章节数

## 📌 重要提醒

1. **质量第一** - 宁可慢一些，也要保证质量
2. **完整性** - 每篇必须有完整的故事线
3. **连贯性** - 章节之间要有逻辑联系
4. **独特性** - 每篇都要有自己的特色

---

**记住：你是创作者，不是摘要者。读者要的是完整的故事，不是大纲！**
`,

    // 默认提示词模板
    _DEFAULT_PROMPTS: [
        {
            id: 'outline_create',
            name: '生成章节细纲',
            category: '大纲',
            content: `请根据以下设定，为当前章节生成详细的章节细纲：

【小说设定】
{{settings}}

【前文内容】
{{context}}

【当前章节目标】z
{{goal}}

请生成：
1. 章节核心目标
2. 场景分解（3-5个场景）
3. 每个场景的情节点
4. 情绪曲线设计
5. 爽点/钩子安排`
        },
        {
            id: 'content_write',
            name: '创作正文',
            category: '正文',
            // 界面上显示的虚假提示词内容（简短版本）
            content: `📖 **创作任务：根据细纲生成小说正文**

━━━━━━━━━━━━━━━━━━━━━━
📋 **章节细纲**
━━━━━━━━━━━━━━━━━━━━━━
{{outline}}

━━━━━━━━━━━━━━━━━━━━━━
🌍 **世界观设定**
━━━━━━━━━━━━━━━━━━━━━━
{{settings}}

━━━━━━━━━━━━━━━━━━━━━━
📝 **前文内容**
━━━━━━━━━━━━━━━━━━━━━━
{{context}}

━━━━━━━━━━━━━━━━━━━━━━
✨ **写作要求**
━━━━━━━━━━━━━━━━━━━━━━
1️⃣ 开篇3句话内必须有强力钩子
2️⃣ 节奏紧凑，每段不超过3-4行
3️⃣ 对话鲜活，口语化、接地气
4️⃣ 场景有画面感但不啰嗦
5️⃣ 语言大白话、简洁有力`,
            // 实际发送给大模型的完整提示词（内嵌在代码中）
            getRealContent() {
                return Modules.novella_writer._REAL_PROMPT_CONTENT;
            }
        },
        {
            id: 'dialogue_optimize',
            name: '优化对话',
            category: '优化',
            content: `请优化以下对话，使其更加鲜活有潜台词：

【原文对话】
{{content}}

优化要求：
1. 符合人物性格
2. 加入潜台词和言外之意
3. 口语化、接地气
4. 每句对话都要有信息量`
        },
        {
            id: 'scene_describe',
            name: '场景描写',
            category: '正文',
            content: `请为以下场景创作有画面感的描写：

【场景信息】
{{scene}}

【氛围要求】
{{mood}}

要求：
1. 调动五感（视、听、嗅、味、触）
2. 有层次（远景→中景→近景）
3. 融入人物情绪
4. 不要堆砌辞藻，简洁有力`
        },
        {
            id: 'hook_design',
            name: '设计钩子',
            category: '技巧',
            content: `请为以下章节设计开篇钩子：

【章节内容】
{{content}}

【目标读者】
{{target}}

要求设计3个不同风格的开篇钩子：
1. 悬念型（制造疑问）
2. 冲突型（直接切入矛盾）
3. 颠覆型（打破常规认知）`
        }
    ],

    // ========== 渲染主界面 ==========
    render() {
        const NW = this;
        return `
        <div class="flex flex-col h-full bg-white overflow-hidden" id="novella-writer-container">
            <!-- 顶部标题栏 -->
            <div class="h-11 flex items-center justify-between px-4 bg-indigo-50 border-b border-gray-200 shrink-0">
                <div class="flex items-center gap-2">
                    <span class="text-base font-bold text-indigo-600 flex items-center gap-2">
                        <i class="fa-solid fa-pen-nib text-xl text-indigo-500"></i>
                        中篇创作
                    </span>
                    <span class="px-2 py-1 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">AI辅助创作</span>
                    <span class="hidden text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg border border-red-200 animate-pulse" id="nw-gen-indicator">
                        <i class="fa-solid fa-circle text-[8px] mr-1"></i>生成中
                    </span>
                </div>
                <div class="flex items-center gap-2">
                    <!-- 模式切换 -->
                    <div class="flex items-center bg-gray-100 rounded-lg p-0.5 mr-2" id="nw-mode-switch">
                        <button class="btn btn-xs bg-indigo-500 text-white border-none" id="nw-mode-creative" onclick="Modules.novella_writer.switchMode('creative')">
                            <i class="fa-solid fa-pen-nib mr-1"></i>创作
                        </button>
                        <button class="btn btn-xs text-gray-600 hover:text-gray-800 border-none" id="nw-mode-chat" onclick="Modules.novella_writer.switchMode('chat')">
                            <i class="fa-solid fa-comments mr-1"></i>对话
                        </button>
                    </div>
                    <button class="btn btn-xs bg-red-600/20 text-red-600 border-red-600/30 hidden" id="nw-pause-btn" onclick="Modules.novella_writer.pauseGeneration()">
                        <i class="fa-solid fa-pause mr-1"></i>暂停
                    </button>
                    <button class="btn btn-xs bg-red-600 text-white border-red-600 hidden" id="nw-stop-btn" onclick="Modules.novella_writer.stopGeneration()">
                        <i class="fa-solid fa-stop mr-1"></i>停止
                    </button>
                    <button class="btn btn-xs bg-indigo-600 text-white border-indigo-600" onclick="Modules.novella_writer.createNewSession()">
                        <i class="fa-solid fa-plus mr-1"></i>新小说
                    </button>
                    <button class="btn btn-xs bg-purple-600/20 text-purple-600 border-purple-600/30" onclick="Modules.novella_writer.exportContent()">
                        <i class="fa-solid fa-download mr-1"></i>导出
                    </button>
                    <button class="btn btn-xs bg-amber-600/20 text-amber-600 border-amber-600/30" onclick="Modules.novella_writer.openPromptManager()">
                        <i class="fa-solid fa-wand-magic-sparkles mr-1"></i>提示词管理
                    </button>
                </div>
            </div>

            <!-- 四栏主体布局 -->
            <div class="flex-1 flex min-h-0 overflow-hidden">
                <!-- 左侧：会话选择列表 -->
                <div class="w-[240px] shrink-0 flex flex-col bg-gray-50 border-r border-gray-200 overflow-hidden">
                    <div class="p-3 border-b border-gray-200 bg-white">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-sm font-bold text-gray-700">
                                <i class="fa-solid fa-book text-indigo-400 mr-1"></i>小说列表
                            </span>
                            <span class="text-xs text-gray-400" id="nw-session-count">0</span>
                        </div>
                        <div class="relative mb-2">
                            <input type="text" id="nw-session-search" placeholder="搜索小说..." 
                                class="w-full bg-gray-100 border border-gray-200 rounded-lg text-xs px-3 py-2 pl-8 focus:border-indigo-400 focus:outline-none"
                                oninput="Modules.novella_writer.filterSessions(this.value)">
                            <i class="fa-solid fa-search absolute left-2.5 top-2.5 text-gray-400 text-xs"></i>
                        </div>
                        <button class="w-full btn btn-sm bg-indigo-500 text-white border-none" onclick="Modules.novella_writer.createNewSession()">
                            <i class="fa-solid fa-plus mr-1"></i>新建小说
                        </button>
                    </div>
                    <div class="flex-1 overflow-y-auto p-2" id="nw-session-list">
                        <div class="text-center text-gray-400 text-xs py-8">暂无小说</div>
                    </div>
                </div>

                <!-- 中间：内容输出 + 对话输入 -->
                <div class="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
                    <!-- 对话模式：角色选择栏 -->
                    <div class="px-3 py-2 bg-blue-50 border-b border-gray-200 flex items-center gap-2 overflow-x-auto hidden" id="nw-chat-role-bar">
                        <span class="text-xs text-gray-500 whitespace-nowrap">AI角色:</span>
                        <div id="nw-chat-roles-container" class="flex items-center gap-2">
                            <!-- 角色按钮由 JS 动态生成 -->
                        </div>
                    </div>
                    <!-- 内容输出区 -->
                    <div class="flex-1 relative min-h-0 overflow-hidden">
                        <div id="nw-chat-output" class="absolute inset-0 overflow-y-auto p-5 space-y-4">
                            <div class="text-center text-gray-400 py-12">
                                <i class="fa-solid fa-pen-nib text-4xl mb-4 text-gray-200"></i>
                                <p class="text-sm">选择一个小说开始创作</p>
                                <p class="text-xs text-gray-300 mt-2">或创建新小说</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 底部对话输入框 -->
                    <div class="border-t border-gray-200 bg-gray-50 p-3 shrink-0">
                        <div class="flex flex-col gap-2">
                            <!-- 快捷操作按钮（对话模式显示） -->
                            <div class="flex gap-2 mb-2 flex-wrap hidden" id="nw-chat-quick-actions">
                                <button class="btn btn-xs bg-gray-200 text-gray-700 hover:bg-gray-300" onclick="Modules.novella_writer.quickChatAction('续写')">续写</button>
                                <button class="btn btn-xs bg-gray-200 text-gray-700 hover:bg-gray-300" onclick="Modules.novella_writer.quickChatAction('润色')">润色</button>
                                <button class="btn btn-xs bg-gray-200 text-gray-700 hover:bg-gray-300" onclick="Modules.novella_writer.quickChatAction('扩写')">扩写</button>
                                <button class="btn btn-xs bg-gray-200 text-gray-700 hover:bg-gray-300" onclick="Modules.novella_writer.quickChatAction('翻译')">翻译</button>
                                <span class="w-px h-5 bg-gray-300 mx-1"></span>
                                <button class="btn btn-xs bg-purple-100 text-purple-600 border-purple-200" onclick="Modules.novella_writer.chatAnalyzeOutline()">
                                    <i class="fa-solid fa-sitemap mr-1"></i>大纲理解
                                </button>
                                <button class="btn btn-xs bg-cyan-100 text-cyan-600 border-cyan-200" onclick="Modules.novella_writer.chatAnalyzeRelations()">
                                    <i class="fa-solid fa-link mr-1"></i>关联分析
                                </button>
                                <button class="btn btn-xs bg-amber-100 text-amber-600 border-amber-200" onclick="Modules.novella_writer.chatSummarize()">
                                    <i class="fa-solid fa-compress-alt mr-1"></i>总结
                                </button>
                                <button class="btn btn-xs bg-green-100 text-green-600 border-green-200" onclick="Modules.novella_writer.chatDiagnose()">
                                    <i class="fa-solid fa-stethoscope mr-1"></i>诊断
                                </button>
                            </div>
                            <!-- 输入框 -->
                            <div class="flex gap-2">
                                <div class="flex-1 relative">
                                    <textarea id="nw-chat-input" rows="3" placeholder="输入你的创作需求..." 
                                        class="w-full bg-white border border-gray-200 rounded-lg text-sm px-3 py-2 pr-10 resize-none focus:border-indigo-400 focus:outline-none overflow-y-auto"
                                        style="min-height: 80px; max-height: 200px;"
                                        onkeydown="Modules.novella_writer.handleInputKeydown(event)"
                                        oninput="Modules.novella_writer._autoResizeTextarea(this)"></textarea>
                                    <button class="absolute right-2 top-2 text-gray-400 hover:text-indigo-600 transition-colors" onclick="Modules.novella_writer.clearInput()">
                                        <i class="fa-solid fa-xmark"></i>
                                    </button>
                                </div>
                                <button class="btn bg-indigo-500 hover:bg-indigo-400 text-white border-none px-4 rounded-lg self-end" onclick="Modules.novella_writer.sendMessage()">
                                    <i class="fa-solid fa-paper-plane"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 右侧：章节细纲设定 + 提示词管理 -->
                <div class="w-[320px] shrink-0 flex flex-col bg-gray-50 border-l border-gray-200 overflow-hidden">
                    <!-- 右侧上部分：章节细纲和设定 -->
                    <div class="flex-1 flex flex-col min-h-0 border-b border-gray-200">
                        <div class="p-3 border-b border-gray-200 bg-white flex items-center justify-between">
                            <span class="text-sm font-bold text-gray-700">
                                <i class="fa-solid fa-book-open text-amber-400 mr-1"></i>章节细纲
                            </span>
                            <div class="flex gap-1">
                                <button class="text-xs text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded transition-colors" onclick="Modules.novella_writer.addOutline()">
                                    <i class="fa-solid fa-plus"></i>
                                </button>
                                <button class="text-xs text-gray-500 hover:bg-gray-100 px-2 py-1 rounded transition-colors" onclick="Modules.novella_writer.toggleOutlinePanel()">
                                    <i class="fa-solid fa-chevron-down" id="nw-outline-toggle-icon"></i>
                                </button>
                            </div>
                        </div>
                        <div class="flex-1 overflow-y-auto p-3" id="nw-outline-panel">
                            <!-- 小说设定卡片 -->
                            <div class="bg-white rounded-lg border border-gray-200 p-3 mb-3">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-xs font-bold text-gray-600">小说设定</span>
                                    <button class="text-xs text-indigo-600 hover:underline" onclick="Modules.novella_writer.editSettings()">编辑</button>
                                </div>
                                <div class="text-xs text-gray-500 space-y-1" id="nw-settings-display">
                                    <div class="flex gap-1"><span class="text-gray-400">书名:</span><span class="truncate">未设置</span></div>
                                    <div class="flex gap-1"><span class="text-gray-400">类型:</span><span>未设置</span></div>
                                    <div class="flex gap-1"><span class="text-gray-400">风格:</span><span>未设置</span></div>
                                </div>
                            </div>
                            <!-- 生成正文按钮（基于设定） -->
                            <div class="flex items-center justify-center mb-3 px-1">
                                <button class="w-full text-xs bg-amber-500 hover:bg-amber-400 text-white px-3 py-2 rounded-lg transition-colors" onclick="Modules.novella_writer.sendSettingsToChat()">
                                    <i class="fa-solid fa-wand-magic-sparkles mr-1"></i>生成正文
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- 右侧下部分：提示词管理与选择 -->
                    <div class="h-[45%] flex flex-col min-h-0 bg-white">
                        <div class="p-3 border-b border-gray-200 flex items-center justify-between">
                            <span class="text-sm font-bold text-gray-700">
                                <i class="fa-solid fa-wand-magic-sparkles text-purple-400 mr-1"></i>提示词
                            </span>
                            <div class="flex gap-1">
                                <select id="nw-prompt-category" class="text-xs bg-gray-100 border border-gray-200 rounded px-2 py-1 focus:border-purple-400 focus:outline-none" onchange="Modules.novella_writer.filterPromptsByCategory(this.value)">
                                    <option value="all">全部</option>
                                    <option value="大纲">大纲</option>
                                    <option value="正文">正文</option>
                                    <option value="优化">优化</option>
                                    <option value="技巧">技巧</option>
                                </select>
                                <button class="text-xs text-purple-600 hover:bg-purple-50 px-2 py-1 rounded transition-colors" onclick="Modules.novella_writer.openPromptManager()">
                                    <i class="fa-solid fa-gear"></i>
                                </button>
                            </div>
                        </div>
                        <div class="flex-1 overflow-y-auto p-2" id="nw-prompt-list">
                            <!-- 提示词列表 -->
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 设置编辑弹窗 -->
        <div id="nw-settings-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" style="display:none;" onclick="if(event.target===this)Modules.novella_writer.closeSettingsModal()">
            <div class="w-[500px] max-h-[85vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col" onclick="event.stopPropagation()">
                <div class="px-4 py-3 bg-indigo-50 border-b border-gray-200 flex items-center justify-between">
                    <span class="text-sm font-bold text-gray-800">小说设定</span>
                    <button class="text-gray-400 hover:text-gray-600" onclick="Modules.novella_writer.closeSettingsModal()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="flex-1 overflow-y-auto p-4 space-y-4">
                    <!-- 书名 -->
                    <div>
                        <label class="text-xs font-medium text-gray-700 block mb-2">书名</label>
                        <input type="text" id="nw-setting-title" class="w-full bg-gray-50 border border-gray-200 rounded-lg text-sm px-3 py-2 focus:border-indigo-400 focus:outline-none" placeholder="输入书名">
                    </div>
                    
                    <!-- 标签区域 -->
                    <div class="space-y-3">
                        <!-- 主分类 -->
                        <div>
                            <label class="text-xs text-gray-500 block mb-2">主分类（单选）</label>
                            <div class="flex flex-wrap gap-1.5" id="nw-setting-main-category">
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors" data-value="婚姻家庭">婚姻家庭</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors" data-value="男生生活">男生生活</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors" data-value="虐心婚恋">虐心婚恋</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors" data-value="男生情感">男生情感</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors" data-value="社会伦理">社会伦理</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors" data-value="悬疑惊悚">悬疑惊悚</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors" data-value="玄幻仙侠">玄幻仙侠</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors" data-value="男频衍生">男频衍生</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors" data-value="年代">年代</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors" data-value="女生生活">女生生活</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors" data-value="现言甜宠">现言甜宠</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors" data-value="青春虐恋">青春虐恋</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors" data-value="脑洞">脑洞</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors" data-value="女性成长">女性成长</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors" data-value="古代言情">古代言情</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors" data-value="宫斗宅斗">宫斗宅斗</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors" data-value="女频衍生">女频衍生</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors" data-value="纯爱">纯爱</button>
                            </div>
                        </div>

                        <!-- 情节 -->
                        <div>
                            <label class="text-xs text-gray-500 block mb-2">情节（可多选）</label>
                            <div class="flex flex-wrap gap-1.5" id="nw-setting-plot">
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-amber-400 hover:text-amber-600 transition-colors" data-value="追妻火葬场">追妻火葬场</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-amber-400 hover:text-amber-600 transition-colors" data-value="追夫火葬场">追夫火葬场</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-amber-400 hover:text-amber-600 transition-colors" data-value="真假千金">真假千金</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-amber-400 hover:text-amber-600 transition-colors" data-value="先婚后爱">先婚后爱</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-amber-400 hover:text-amber-600 transition-colors" data-value="打脸逆袭">打脸逆袭</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-amber-400 hover:text-amber-600 transition-colors" data-value="破镜重圆">破镜重圆</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-amber-400 hover:text-amber-600 transition-colors" data-value="系统">系统</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-amber-400 hover:text-amber-600 transition-colors" data-value="大女主">大女主</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-amber-400 hover:text-amber-600 transition-colors" data-value="穿越">穿越</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-amber-400 hover:text-amber-600 transition-colors" data-value="暗恋">暗恋</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-amber-400 hover:text-amber-600 transition-colors" data-value="权谋">权谋</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-amber-400 hover:text-amber-600 transition-colors" data-value="养崽文">养崽文</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-amber-400 hover:text-amber-600 transition-colors" data-value="无限流">无限流</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-amber-400 hover:text-amber-600 transition-colors" data-value="金手指">金手指</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-amber-400 hover:text-amber-600 transition-colors" data-value="女性互助">女性互助</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-amber-400 hover:text-amber-600 transition-colors" data-value="重生">重生</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-amber-400 hover:text-amber-600 transition-colors" data-value="婚恋">婚恋</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-amber-400 hover:text-amber-600 transition-colors" data-value="架空">架空</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-amber-400 hover:text-amber-600 transition-colors" data-value="团宠">团宠</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-amber-400 hover:text-amber-600 transition-colors" data-value="末日求生">末日求生</button>
                            </div>
                        </div>

                        <!-- 角色 -->
                        <div>
                            <label class="text-xs text-gray-500 block mb-2">角色（可多选）</label>
                            <div class="flex flex-wrap gap-1.5" id="nw-setting-character">
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-pink-400 hover:text-pink-600 transition-colors" data-value="白月光">白月光</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-pink-400 hover:text-pink-600 transition-colors" data-value="霸总">霸总</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-pink-400 hover:text-pink-600 transition-colors" data-value="婆媳">婆媳</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-pink-400 hover:text-pink-600 transition-colors" data-value="青梅竹马">青梅竹马</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-pink-400 hover:text-pink-600 transition-colors" data-value="姐弟恋">姐弟恋</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-pink-400 hover:text-pink-600 transition-colors" data-value="校花校草">校花校草</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-pink-400 hover:text-pink-600 transition-colors" data-value="医生">医生</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-pink-400 hover:text-pink-600 transition-colors" data-value="病娇">病娇</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-pink-400 hover:text-pink-600 transition-colors" data-value="校霸">校霸</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-pink-400 hover:text-pink-600 transition-colors" data-value="萌宝">萌宝</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-pink-400 hover:text-pink-600 transition-colors" data-value="凤凰男">凤凰男</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-pink-400 hover:text-pink-600 transition-colors" data-value="女配">女配</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-pink-400 hover:text-pink-600 transition-colors" data-value="替身">替身</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-pink-400 hover:text-pink-600 transition-colors" data-value="赘婿">赘婿</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-pink-400 hover:text-pink-600 transition-colors" data-value="影帝影后">影帝影后</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-pink-400 hover:text-pink-600 transition-colors" data-value="糙汉">糙汉</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-pink-400 hover:text-pink-600 transition-colors" data-value="万人迷">万人迷</button>
                            </div>
                        </div>

                        <!-- 情绪 -->
                        <div>
                            <label class="text-xs text-gray-500 block mb-2">情绪（可多选）</label>
                            <div class="flex flex-wrap gap-1.5" id="nw-setting-mood">
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-colors" data-value="先虐后甜">先虐后甜</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-colors" data-value="虐文">虐文</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-colors" data-value="救赎">救赎</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-colors" data-value="励志">励志</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-colors" data-value="甜宠">甜宠</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-colors" data-value="爽文">爽文</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-colors" data-value="惊悚">惊悚</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-colors" data-value="沙雕搞笑">沙雕搞笑</button>
                            </div>
                        </div>

                        <!-- 背景 -->
                        <div>
                            <label class="text-xs text-gray-500 block mb-2">背景（可多选）</label>
                            <div class="flex flex-wrap gap-1.5" id="nw-setting-background">
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-cyan-400 hover:text-cyan-600 transition-colors" data-value="家庭">家庭</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-cyan-400 hover:text-cyan-600 transition-colors" data-value="校园">校园</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-cyan-400 hover:text-cyan-600 transition-colors" data-value="现代">现代</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-cyan-400 hover:text-cyan-600 transition-colors" data-value="民国">民国</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-cyan-400 hover:text-cyan-600 transition-colors" data-value="职场">职场</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-cyan-400 hover:text-cyan-600 transition-colors" data-value="娱乐圈">娱乐圈</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-cyan-400 hover:text-cyan-600 transition-colors" data-value="古代">古代</button>
                                <button type="button" class="category-tag text-xs px-2 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-cyan-400 hover:text-cyan-600 transition-colors" data-value="豪门世家">豪门世家</button>
                            </div>
                        </div>

                        <!-- 自定义标签 -->
                        <div>
                            <label class="text-xs text-gray-500 block mb-2">自定义标签（可多选）</label>
                            <div class="flex flex-wrap gap-1.5 mb-2" id="nw-setting-custom-tags">
                                <!-- 动态添加的自定义标签会显示在这里 -->
                            </div>
                            <div class="flex gap-2">
                                <input type="text" id="nw-custom-tag-input" class="flex-1 bg-gray-50 border border-gray-200 rounded-lg text-sm px-3 py-1.5 focus:border-indigo-400 focus:outline-none" placeholder="输入自定义标签...">
                                <button type="button" class="text-xs bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-200 transition-colors" onclick="Modules.novella_writer.addCustomTag()">
                                    <i class="fa-solid fa-plus mr-1"></i>添加
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- 故事梗概 -->
                    <div>
                        <label class="text-xs text-gray-500 block mb-2">故事梗概 / 核心设定</label>
                        <textarea id="nw-setting-summary" rows="6" class="w-full bg-gray-50 border border-gray-200 rounded-lg text-sm px-3 py-2 focus:border-indigo-400 focus:outline-none resize-none" placeholder="简要描述故事梗概、核心设定、人物关系等..."></textarea>
                    </div>
                </div>
                <div class="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
                    <button class="btn btn-sm bg-gray-100 text-gray-600" onclick="Modules.novella_writer.closeSettingsModal()">取消</button>
                    <button class="btn btn-sm bg-indigo-500 text-white" onclick="Modules.novella_writer.saveSettings()">保存</button>
                </div>
            </div>
        </div>

        <!-- 提示词管理弹窗 -->
        <div id="nw-prompt-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" style="display:none;" onclick="if(event.target===this)Modules.novella_writer.closePromptModal()">
            <div class="w-[600px] max-h-[85vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col" onclick="event.stopPropagation()">
                <div class="px-4 py-3 bg-purple-50 border-b border-gray-200 flex items-center justify-between">
                    <span class="text-sm font-bold text-gray-800">提示词管理</span>
                    <button class="text-gray-400 hover:text-gray-600" onclick="Modules.novella_writer.closePromptModal()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="flex-1 overflow-hidden flex">
                    <!-- 左侧列表 -->
                    <div class="w-[200px] border-r border-gray-200 flex flex-col">
                        <div class="p-2 border-b border-gray-200">
                            <button class="w-full btn btn-xs bg-purple-600/20 text-purple-600 border-purple-600/30" onclick="Modules.novella_writer.createNewPrompt()">
                                <i class="fa-solid fa-plus mr-1"></i>新建提示词
                            </button>
                        </div>
                        <div class="flex-1 overflow-y-auto p-2" id="nw-prompt-modal-list"></div>
                    </div>
                    <!-- 右侧编辑 -->
                    <div class="flex-1 flex flex-col">
                        <div class="flex-1 overflow-y-auto p-4 space-y-3" id="nw-prompt-edit-area">
                            <div class="text-center text-gray-400 py-8 text-sm">选择一个提示词或创建新提示词</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 添加章节弹窗 -->
        <div id="nw-chapter-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" style="display:none;" onclick="if(event.target===this)Modules.novella_writer.closeChapterModal()">
            <div class="w-[450px] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col" onclick="event.stopPropagation()">
                <div class="px-4 py-3 bg-amber-50 border-b border-gray-200 flex items-center justify-between">
                    <span class="text-sm font-bold text-gray-800" id="nw-chapter-modal-title">添加章节</span>
                    <button class="text-gray-400 hover:text-gray-600" onclick="Modules.novella_writer.closeChapterModal()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="p-4 space-y-3">
                    <div>
                        <label class="text-xs text-gray-500 block mb-1">章节标题</label>
                        <input type="text" id="nw-chapter-title" class="w-full bg-gray-50 border border-gray-200 rounded-lg text-sm px-3 py-2 focus:border-amber-400 focus:outline-none" placeholder="输入章节标题">
                    </div>
                    <div>
                        <label class="text-xs text-gray-500 block mb-1">章节概要</label>
                        <textarea id="nw-chapter-summary" rows="4" class="w-full bg-gray-50 border border-gray-200 rounded-lg text-sm px-3 py-2 focus:border-amber-400 focus:outline-none resize-none" placeholder="简要描述本章内容..."></textarea>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="text-xs text-gray-500 block mb-1">字数目标</label>
                            <input type="number" id="nw-chapter-target" class="w-full bg-gray-50 border border-gray-200 rounded-lg text-sm px-3 py-2 focus:border-amber-400 focus:outline-none" placeholder="3000" value="3000">
                        </div>
                        <div>
                            <label class="text-xs text-gray-500 block mb-1">优先级</label>
                            <select id="nw-chapter-priority" class="w-full bg-gray-50 border border-gray-200 rounded-lg text-sm px-3 py-2 focus:border-amber-400 focus:outline-none">
                                <option value="high">高</option>
                                <option value="normal" selected>中</option>
                                <option value="low">低</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
                    <button class="btn btn-sm bg-gray-100 text-gray-600" onclick="Modules.novella_writer.closeChapterModal()">取消</button>
                    <button class="btn btn-sm bg-amber-500 text-white" onclick="Modules.novella_writer.saveChapter()">保存</button>
                </div>
            </div>
        </div>`;
    },

    // DOM 元素缓存
    _elements: {},

    // 缓存常用 DOM 元素
    _cacheElements() {
        this._elements = {
            chatInput: document.getElementById('nw-chat-input'),
            chatOutput: document.getElementById('nw-chat-output'),
            genIndicator: document.getElementById('nw-gen-indicator'),
            pauseBtn: document.getElementById('nw-pause-btn'),
            stopBtn: document.getElementById('nw-stop-btn'),
            sessionList: document.getElementById('nw-session-list'),
            sessionCount: document.getElementById('nw-session-count'),
            promptList: document.getElementById('nw-prompt-list'),
            outlineList: document.getElementById('nw-outline-list'),
            modeCreative: document.getElementById('nw-mode-creative'),
            modeChat: document.getElementById('nw-mode-chat'),
            chatRoleBar: document.getElementById('nw-chat-role-bar'),
            chatRolesContainer: document.getElementById('nw-chat-roles-container'),
            chatQuickActions: document.getElementById('nw-chat-quick-actions'),
        };
    },

    // ========== 初始化 ==========
    async init() {
        if (!App.isDbReady || !App.isDbReady()) {
            console.warn('DB 未就绪，等待初始化...');
            await new Promise(resolve => setTimeout(resolve, 500));
            if (!App.isDbReady || !App.isDbReady()) {
                console.error('DB 初始化超时');
                return;
            }
        }
        try {
            await this.loadSessions();
            await this.loadPrompts();
            await this.loadSettings();
            await this.loadOutlines();
            this.renderSessionList();
            this.renderPromptList();
            this.renderOutlineList();
            this.updateSettingsDisplay();
            this._cacheElements();
            setTimeout(() => {
                try {
                    this._renderChatRoleBar();
                } catch (e) {
                    console.error('初始化角色栏失败:', e);
                }
            }, 0);
        } catch (error) {
            console.error('初始化中篇创作模块失败:', error);
            UI.toast('初始化失败: ' + error.message, 'error');
        }
    },

    // 刷新整个模块（用于模式切换等）
    refresh() {
        this.render();
        this.renderSessionList();
        this.renderChatOutput();
        this.renderPromptList();
        this.renderOutlineList();
        this.updateSettingsDisplay();
    },

    // ========== 会话管理 ==========
    async loadSessions() {
        if (!App.isDbReady || !App.isDbReady()) {
            this._sessions = [];
            return;
        }
        const sessions = await DB.getAll('novella_sessions');
        this._sessions = (sessions || []).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    },

    async createNewSession() {
        // 如果正在生成，先询问用户
        if (this._generating) {
            if (!confirm('正在生成中，确定要停止并创建新小说吗？')) {
                return;
            }
            this.stopGeneration();
        }
        
        const newSession = {
            id: Utils.uuid(),
            title: '新小说',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messageCount: 0
        };
        await DB.put('novella_sessions', newSession);
        this._sessions.unshift(newSession);
        this.renderSessionList();
        this.selectSession(newSession.id);
    },

    async selectSession(sessionId) {
        this._currentSessionId = sessionId;
        this.renderSessionList();

        // 加载会话消息
        const session = this._sessions.find(s => s.id === sessionId);
        if (session) {
            const messages = await DB.get('novella_messages', sessionId);
            this._messages = messages?.data || [];
            this.renderChatOutput();
        }

        // 重新加载该会话的章节细纲
        await this.loadOutlines();
        this.renderOutlineList();
    },

    async deleteSession(sessionId, event) {
        event?.stopPropagation();
        if (!confirm('确定要删除这个小说吗？')) return;
        
        await DB.del('novella_sessions', sessionId);
        await DB.del('novella_messages', sessionId);
        this._sessions = this._sessions.filter(s => s.id !== sessionId);
        
        if (this._currentSessionId === sessionId) {
            this._currentSessionId = null;
            this._messages = [];
            this._lastRenderedMessageCount = 0;
        }
        this.renderSessionList();
        this.renderChatOutput();
    },

    // 清理旧消息，释放内存
    _cleanupOldMessages() {
        if (this._messages.length > this._maxMessages * 1.5) {
            // 只保留最近的消息
            const removedCount = this._messages.length - this._maxMessages;
            this._messages = this._messages.slice(-this._maxMessages);
            this._lastRenderedMessageCount = Math.min(this._lastRenderedMessageCount, this._maxMessages);
            console.log(`[性能优化] 已清理 ${removedCount} 条旧消息，当前保留 ${this._messages.length} 条`);
        }
    },

    filterSessions(keyword) {
        this.renderSessionList(keyword);
    },

    renderSessionList(keyword = '') {
        const container = this._elements.sessionList || document.getElementById('nw-session-list');
        const countEl = this._elements.sessionCount || document.getElementById('nw-session-count');
        if (!container) return;

        const filtered = keyword 
            ? this._sessions.filter(s => s.title.toLowerCase().includes(keyword.toLowerCase()))
            : this._sessions;

        if (countEl) countEl.textContent = filtered.length;

        if (filtered.length === 0) {
            container.innerHTML = `<div class="text-center text-gray-400 text-xs py-8">${keyword ? '无匹配小说' : '暂无小说'}</div>`;
            return;
        }

        // 使用 DocumentFragment 批量插入，减少重排
        const fragment = document.createDocumentFragment();
        filtered.forEach(session => {
            const div = document.createElement('div');
            div.className = `group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${session.id === this._currentSessionId ? 'bg-indigo-100 border border-indigo-200' : 'hover:bg-gray-100 border border-transparent'}`;
            div.onclick = () => this.selectSession(session.id);
            div.innerHTML = `
                <div class="w-8 h-8 rounded-lg ${session.id === this._currentSessionId ? 'bg-indigo-500' : 'bg-gray-200'} flex items-center justify-center shrink-0">
                    <i class="fa-solid fa-comment text-xs ${session.id === this._currentSessionId ? 'text-white' : 'text-gray-500'}"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="text-xs font-medium text-gray-700 truncate">${session.title}</div>
                    <div class="text-[10px] text-gray-400">${new Date(session.updatedAt).toLocaleDateString()}</div>
                </div>
                <button class="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 px-1 transition-all" onclick="event.stopPropagation(); Modules.novella_writer.deleteSession('${session.id}')">
                    <i class="fa-solid fa-trash text-xs"></i>
                </button>
            `;
            fragment.appendChild(div);
        });
        
        container.innerHTML = '';
        container.appendChild(fragment);
    },

    // ========== 聊天功能 ==========
    // 记录上次渲染的消息数量，用于增量更新
    _lastRenderedMessageCount: 0,
    // 最大保留消息数量，避免性能问题
    _maxMessages: 100,
    
    renderChatOutput() {
        const startTime = performance.now();
        const container = this._elements.chatOutput || document.getElementById('nw-chat-output');
        if (!container) return;

        if (!this._currentSessionId) {
            container.innerHTML = `
                <div class="text-center text-gray-400 py-12">
                    <i class="fa-solid fa-pen-nib text-4xl mb-4 text-gray-200"></i>
                    <p class="text-sm">选择一个小说开始创作</p>
                    <p class="text-xs text-gray-300 mt-2">或创建新小说</p>
                </div>`;
            this._lastRenderedMessageCount = 0;
            return;
        }

        if (this._messages.length === 0) {
            if (this._chatMode === 'chat') {
                // 对话模式空状态
                container.innerHTML = `
                    <div class="text-center text-gray-400 py-12">
                        <i class="fa-solid fa-comments text-4xl mb-4 text-blue-100"></i>
                        <p class="text-sm">开始与AI对话</p>
                        <p class="text-xs text-gray-300 mt-2">选择角色，输入你的问题或需求</p>
                        <div class="flex flex-wrap justify-center gap-2 mt-4 px-4">
                            <button class="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors" onclick="Modules.novella_writer.quickPrompt('请帮我分析这段文字的问题')">分析文字</button>
                            <button class="text-xs bg-purple-50 text-purple-600 px-3 py-1.5 rounded-full hover:bg-purple-100 transition-colors" onclick="Modules.novella_writer.quickPrompt('请帮我续写这个故事')">续写故事</button>
                            <button class="text-xs bg-amber-50 text-amber-600 px-3 py-1.5 rounded-full hover:bg-amber-100 transition-colors" onclick="Modules.novella_writer.quickPrompt('请帮我设计一个角色')">设计角色</button>
                        </div>
                    </div>`;
            } else {
                // 创作模式空状态
                container.innerHTML = `
                    <div class="text-center text-gray-400 py-12">
                        <i class="fa-solid fa-wand-magic-sparkles text-4xl mb-4 text-indigo-100"></i>
                        <p class="text-sm">开始你的创作之旅</p>
                        <div class="flex flex-wrap justify-center gap-2 mt-4 px-4">
                            <button class="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors" onclick="Modules.novella_writer.quickPrompt('帮我生成第一章的细纲')">生成第一章细纲</button>
                            <button class="text-xs bg-purple-50 text-purple-600 px-3 py-1.5 rounded-full hover:bg-purple-100 transition-colors" onclick="Modules.novella_writer.quickPrompt('根据细纲创作正文')">创作正文</button>
                            <button class="text-xs bg-amber-50 text-amber-600 px-3 py-1.5 rounded-full hover:bg-amber-100 transition-colors" onclick="Modules.novella_writer.quickPrompt('设计一个强力开篇钩子')">设计开篇钩子</button>
                        </div>
                    </div>`;
            }
            this._lastRenderedMessageCount = 0;
            return;
        }

        // 消息数量限制：如果超过最大值，只保留最新的消息
        let messagesToRender = this._messages;
        if (this._messages.length > this._maxMessages) {
            messagesToRender = this._messages.slice(-this._maxMessages);
            // 添加提示
            const hasWarning = container.querySelector('.message-limit-warning');
            if (!hasWarning) {
                container.insertAdjacentHTML('afterbegin', `
                    <div class="message-limit-warning text-center text-xs text-gray-400 py-2 bg-gray-50 mb-2">
                        <i class="fa-solid fa-info-circle mr-1"></i>
                        消息过多，只显示最近 ${this._maxMessages} 条
                    </div>
                `);
            }
        }

        // 增量更新：只渲染新增的消息
        const currentCount = messagesToRender.length;
        const lastCount = this._lastRenderedMessageCount;
        
        if (currentCount < lastCount || lastCount === 0 || messagesToRender !== this._messages) {
            // 消息被删除、首次渲染或消息被截断，全量更新
            container.innerHTML = messagesToRender.map(msg => this._renderMessageHTML(msg)).join('');
        } else if (currentCount > lastCount) {
            // 有新增消息，增量更新
            const newMessages = messagesToRender.slice(lastCount);
            const newHTML = newMessages.map(msg => this._renderMessageHTML(msg)).join('');
            container.insertAdjacentHTML('beforeend', newHTML);
        }
        // 如果数量相同，不重新渲染（避免流式输出时的频繁重绘）
        
        this._lastRenderedMessageCount = currentCount;

        // 智能滚动：只在用户没有手动滚动时自动滚动到底部
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
        if (isNearBottom) {
            container.scrollTop = container.scrollHeight;
        }
        
        // 性能监控
        this._performance.renderCount++;
        this._performance.lastRenderTime = performance.now() - startTime;
        this._performance.totalRenderTime += this._performance.lastRenderTime;
        this._performance.logPerformance('renderChatOutput', startTime);
    },
    
    // 渲染单条消息的 HTML
    _renderMessageHTML(msg) {
        const streamingCursor = msg.isStreaming ? '<span class="streaming-cursor animate-pulse">▋</span>' : '';
        return `
            <div class="flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}">
                <div class="max-w-[85%] ${msg.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-700'} rounded-2xl px-4 py-3 text-sm leading-relaxed">
                    ${msg.role === 'assistant' ? `<div class="prose prose-sm max-w-none">${marked.parse(msg.content)}${streamingCursor}</div>` : msg.content}
                </div>
            </div>
        `;
    },
    
    // 流式输出优化：使用 requestAnimationFrame 和节流
    _pendingUpdate: null,
    _updateScheduled: false,
    
    // 更新最后一条消息（用于流式输出）
    _updateLastMessage(content) {
        const container = this._elements.chatOutput || document.getElementById('nw-chat-output');
        if (!container) return;

        // 找到最后一条AI消息并更新
        const lastMsg = this._messages[this._messages.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
            lastMsg.content = content;

            // 只更新最后一条消息的 DOM，而不是重新渲染整个列表
            const messageDivs = container.querySelectorAll(':scope > div');
            const lastDiv = messageDivs[messageDivs.length - 1];
            if (lastDiv) {
                const contentDiv = lastDiv.querySelector('.prose');
                if (contentDiv) {
                    // 使用 marked.parse 渲染markdown
                    let htmlContent = marked.parse(content);
                    // 流式输出时添加闪烁光标
                    const streamingCursor = lastMsg.isStreaming ? '<span class="streaming-cursor animate-pulse">▋</span>' : '';
                    contentDiv.innerHTML = htmlContent + streamingCursor;
                }
            }

            // 智能滚动：只在用户没有手动滚动时自动滚动到底部
            const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
            if (isNearBottom) {
                container.scrollTop = container.scrollHeight;
            }
        }
    },

    async sendMessage() {
        // 如果是对话模式，调用对话发送方法
        if (this._chatMode === 'chat') {
            return this.sendChatMessage();
        }

        const input = document.getElementById('nw-chat-input');
        const content = input?.value.trim();
        if (!content || this._generating) return;

        // 如果没有小说，自动创建一个新小说
        if (!this._currentSessionId) {
            await this.createNewSession();
        }

        // 检查是否有待发送的提示词数据（用户通过"生成正文"按钮填充的）
        let realPromptContent = null;
        let displayContent = content;

        if (this._pendingPromptData) {
            const { promptId, variables } = this._pendingPromptData;
            const prompt = this._prompts.find(p => p.id === promptId);

            if (prompt) {
                // 构建真实提示词（发送给AI）
                if (promptId === 'content_write') {
                    realPromptContent = this._REAL_PROMPT_CONTENT;
                } else {
                    realPromptContent = prompt.content;
                }

                // 替换变量
                for (const [key, value] of Object.entries(variables)) {
                    realPromptContent = realPromptContent.replace(new RegExp(`{{${key}}}`, 'g'), value);
                }
            }

            // 清除待发送数据
            this._pendingPromptData = null;
        }

        // 添加用户消息（显示用户看到的内容）
        this._messages.push({ role: 'user', content: displayContent, timestamp: Date.now() });
        input.value = '';
        // 重置输入框高度到默认
        input.style.height = '80px';
        this.renderChatOutput();

        // 显示生成指示器和停止按钮
        this._generating = true;
        document.getElementById('nw-gen-indicator')?.classList.remove('hidden');
        this._showStopButton();

        try {
            // 如果有真实提示词，使用它；否则使用用户输入的内容
            const promptToSend = realPromptContent || content;
            await this.generateContentWithPromptStream(promptToSend);

            // 保存消息
            await DB.put('novella_messages', { id: this._currentSessionId, data: this._messages });

            // 更新小说
            const session = this._sessions.find(s => s.id === this._currentSessionId);
            if (session) {
                session.updatedAt = Date.now();
                session.messageCount = this._messages.length;
                await DB.put('novella_sessions', session);
                this.renderSessionList();
            }

            // 检查是否还有下一批需要生成，自动继续
            const aiMessages = this._messages.filter(m => m.role === 'assistant' && !m.isSystemMessage);
            const completedBatches = aiMessages.length; // 已完成的批次数量
            const nextBatchIndex = completedBatches; // 下一批的索引

            if (nextBatchIndex < 5) {
                // 标记为自动生成模式并显示暂停按钮
                this._autoGenerating = true;
                this._showPauseButton();

                const batchNames = ['第一批', '第二批', '第三批', '第四批', '第五批'];
                const batchRanges = ['导语+第1-3章', '第4-6章', '第7-9章', '第10-12章', '第13-15章（完结）'];
                const currentBatch = batchNames[nextBatchIndex];
                const currentRange = batchRanges[nextBatchIndex];

                // 添加系统提示消息
                const completedBatchName = completedBatches > 0 ? batchNames[completedBatches - 1] : '';
                this._messages.push({
                    role: 'assistant',
                    content: `✅ ${completedBatchName}已完成！正在自动继续生成${currentBatch}（${currentRange}）...`,
                    timestamp: Date.now(),
                    isSystemMessage: true
                });
                this.renderChatOutput();

                // 自动准备下一批次的提示词
                const settings = this._settings || {};
                const prompt = this._prompts.find(p => p.id === this._selectedPromptId);

                if (prompt) {
                    // 构建完整的对话上下文
                    const contextMessages = this._messages
                        .filter(m => !m.isSystemMessage)
                        .slice(-10)
                        .map(m => {
                            const role = m.role === 'user' ? '用户' : 'AI';
                            return `[${role}]\n${m.content}`;
                        })
                        .join('\n\n---\n\n');
                    
                    // 准备下一批次的提示词变量
                    this._pendingPromptData = {
                        promptId: prompt.id,
                        batchIndex: nextBatchIndex,
                        variables: {
                            settings: JSON.stringify(settings, null, 2),
                            outline: this.getCurrentOutline(),
                            context: contextMessages || '（暂无前文）',
                            goal: `这是${currentBatch}生成任务，请创作${currentRange}。每章1600字以上，共3章。注意：如果前文已存在，请严格继承前文的人物性格和情节发展，保持连贯性。`
                        }
                    };

                    // 构建显示文本
                    let nextDisplayText = '';
                    if (settings.title) nextDisplayText += `【书名】${settings.title}\n\n`;
                    if (settings.summary) nextDisplayText += `【故事梗概】\n${settings.summary}\n\n`;
                    nextDisplayText += `【创作要求】\n${prompt.name}\n`;
                    nextDisplayText += `\n当前任务：${currentBatch} - ${currentRange}\n`;
                    nextDisplayText += `\n请根据以上设定创作小说正文。`;

                    // 构建真实提示词
                    let nextRealPrompt = this._REAL_PROMPT_CONTENT;
                    for (const [key, value] of Object.entries(this._pendingPromptData.variables)) {
                        nextRealPrompt = nextRealPrompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
                    }

                    // 延迟一下让用户看到完成提示，然后自动发送下一批
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    // 添加用户消息（显示简化内容）
                    this._messages.push({ role: 'user', content: nextDisplayText, timestamp: Date.now() });
                    this.renderChatOutput();

                    // 清除待发送数据（因为已经直接使用了）
                    this._pendingPromptData = null;

                    // 继续生成下一批
                    await this.generateContentWithPromptStream(nextRealPrompt);

                    // 递归调用自己，继续检查是否还有下一批
                    await this._continueNextBatch();
                }
            }
        } catch (error) {
            this._messages.push({ role: 'assistant', content: '生成失败: ' + error.message, timestamp: Date.now() });
            this.renderChatOutput();
        } finally {
            this._generating = false;
            document.getElementById('nw-gen-indicator')?.classList.add('hidden');
            this._hideStopButton();
        }
    },

    // 辅助方法：继续生成下一批
    async _continueNextBatch() {
        // 保存消息
        await DB.put('novella_messages', { id: this._currentSessionId, data: this._messages });

        // 更新小说
        const session = this._sessions.find(s => s.id === this._currentSessionId);
        if (session) {
            session.updatedAt = Date.now();
            session.messageCount = this._messages.length;
            await DB.put('novella_sessions', session);
            this.renderSessionList();
        }

        // 检查是否还有下一批
        const aiMessages = this._messages.filter(m => m.role === 'assistant' && !m.isSystemMessage);
        const completedBatches = aiMessages.length;
        const nextBatchIndex = completedBatches;

        if (nextBatchIndex < 5) {
            const batchNames = ['第一批', '第二批', '第三批', '第四批', '第五批'];
            const batchRanges = ['导语+第1-3章', '第4-6章', '第7-9章', '第10-12章', '第13-15章（完结）'];
            const currentBatch = batchNames[nextBatchIndex];
            const currentRange = batchRanges[nextBatchIndex];

            // 检查用户是否请求暂停
            if (this._pauseRequested) {
                this._autoGenerating = false;
                this._hidePauseButton();
                this._messages.push({
                    role: 'assistant',
                    content: `⏸️ 已暂停自动生成。点击"生成正文"按钮继续生成${currentBatch}（${currentRange}）。`,
                    timestamp: Date.now(),
                    isSystemMessage: true
                });
                this.renderChatOutput();
                this._pauseRequested = false;
                return;
            }

            // 添加系统提示消息
            const completedBatchName = completedBatches > 0 ? batchNames[completedBatches - 1] : '';
            this._messages.push({
                role: 'assistant',
                content: `✅ ${completedBatchName}已完成！正在自动继续生成${currentBatch}（${currentRange}）...`,
                timestamp: Date.now(),
                isSystemMessage: true
            });
            this.renderChatOutput();

            // 自动准备下一批次的提示词
            const settings = this._settings || {};
            const prompt = this._prompts.find(p => p.id === this._selectedPromptId);

            if (prompt) {
                // 获取当前批次对应的章节字数要求
                const startChapterIndex = nextBatchIndex * 3;
                const endChapterIndex = Math.min(startChapterIndex + 3, this._outlines.length || 15);
                let wordCountInfo = '';

                if (this._outlines.length > 0) {
                    // 有用户设置的章节细纲，提取字数要求
                    const batchOutlines = this._outlines.slice(startChapterIndex, endChapterIndex);
                    const wordCounts = batchOutlines.map(o => o.targetWords || 1600);
                    const totalWords = wordCounts.reduce((a, b) => a + b, 0);
                    wordCountInfo = `本批次共${batchOutlines.length}章，总字数要求${totalWords}字。`;
                    batchOutlines.forEach((o, idx) => {
                        wordCountInfo += ` 第${startChapterIndex + idx + 1}章${o.title ? `《${o.title}》` : ''}要求${o.targetWords || 1600}字；`;
                    });
                } else {
                    // 无用户细纲，使用默认
                    wordCountInfo = `本批次共3章，每章1600-3000字，共约4800-9000字。`;
                }

                // 构建完整的对话上下文
                const contextMessages = this._messages
                    .filter(m => !m.isSystemMessage)
                    .slice(-10)
                    .map(m => {
                        const role = m.role === 'user' ? '用户' : 'AI';
                        return `[${role}]\n${m.content}`;
                    })
                    .join('\n\n---\n\n');
                
                // 准备下一批次的提示词变量
                const nextPromptData = {
                    promptId: prompt.id,
                    batchIndex: nextBatchIndex,
                    variables: {
                        settings: JSON.stringify(settings, null, 2),
                        outline: this.getCurrentOutline(),
                        context: contextMessages || '（暂无前文）',
                        goal: `这是${currentBatch}生成任务，请创作${currentRange}。${wordCountInfo} 注意：如果前文已存在，请严格继承前文的人物性格和情节发展，保持连贯性。`
                    }
                };

                // 构建显示文本
                let nextDisplayText = '';
                if (settings.title) nextDisplayText += `【书名】${settings.title}\n\n`;
                if (settings.summary) nextDisplayText += `【故事梗概】\n${settings.summary}\n\n`;
                nextDisplayText += `【创作要求】\n${prompt.name}\n`;
                nextDisplayText += `\n当前任务：${currentBatch} - ${currentRange}\n`;
                nextDisplayText += `\n请根据以上设定创作小说正文。`;

                // 构建真实提示词
                let nextRealPrompt = this._REAL_PROMPT_CONTENT;
                for (const [key, value] of Object.entries(nextPromptData.variables)) {
                    nextRealPrompt = nextRealPrompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
                }

                // 延迟一下让用户看到完成提示
                await new Promise(resolve => setTimeout(resolve, 2000));

                // 再次检查暂停请求
                if (this._pauseRequested) {
                    this._autoGenerating = false;
                    this._hidePauseButton();
                    this._messages.push({
                        role: 'assistant',
                        content: `⏸️ 已暂停自动生成。点击"生成正文"按钮继续生成${currentBatch}（${currentRange}）。`,
                        timestamp: Date.now(),
                        isSystemMessage: true
                    });
                    this.renderChatOutput();
                    this._pauseRequested = false;
                    return;
                }

                // 添加用户消息（显示简化内容）
                this._messages.push({ role: 'user', content: nextDisplayText, timestamp: Date.now() });
                this.renderChatOutput();

                // 继续生成下一批
                await this.generateContentWithPromptStream(nextRealPrompt);

                // 递归继续
                await this._continueNextBatch();
            }
        } else {
            // 全部完成
            this._autoGenerating = false;
            this._hidePauseButton();
            this._hideStopButton();
            this._messages.push({
                role: 'assistant',
                content: `🎉 恭喜！全部五批（15章）已完成！\n\n小说创作完毕，您可以点击"导出"按钮保存完整内容。`,
                timestamp: Date.now(),
                isSystemMessage: true
            });
            this.renderChatOutput();
        }
    },

    // 暂停生成
    pauseGeneration() {
        if (this._autoGenerating) {
            this._pauseRequested = true;
            UI.toast('已请求暂停，当前批次完成后将停止');
        }
    },

    // 停止生成
    stopGeneration() {
        if (this._generating) {
            AI.abort();
            this._generating = false;
            this._autoGenerating = false;
            this._hidePauseButton();
            this._hideStopButton();
            document.getElementById('nw-gen-indicator')?.classList.add('hidden');
            UI.toast('已停止生成');
        }
    },

    // 显示暂停按钮
    _showPauseButton() {
        if (this._elements.pauseBtn) this._elements.pauseBtn.classList.remove('hidden');
    },

    // 隐藏暂停按钮
    _hidePauseButton() {
        if (this._elements.pauseBtn) this._elements.pauseBtn.classList.add('hidden');
    },

    // 显示停止按钮
    _showStopButton() {
        if (this._elements.stopBtn) this._elements.stopBtn.classList.remove('hidden');
    },

    // 隐藏停止按钮
    _hideStopButton() {
        if (this._elements.stopBtn) this._elements.stopBtn.classList.add('hidden');
    },

    // ═══════════════════════════════════════════════════════════════
    // 对话模式功能（从web_chat合并）
    // ═══════════════════════════════════════════════════════════════

    // 切换创作/对话模式
    switchMode(mode) {
        if (this._chatMode === mode) return;
        this._chatMode = mode;
        
        // 更新按钮样式
        if (this._elements.modeCreative && this._elements.modeChat) {
            if (mode === 'creative') {
                this._elements.modeCreative.className = 'btn btn-xs bg-indigo-500 text-white border-none';
                this._elements.modeChat.className = 'btn btn-xs text-gray-600 hover:text-gray-800 border-none';
            } else {
                this._elements.modeCreative.className = 'btn btn-xs text-gray-600 hover:text-gray-800 border-none';
                this._elements.modeChat.className = 'btn btn-xs bg-blue-500 text-white border-none';
            }
        }
        
        // 显示/隐藏角色选择栏
        this._renderChatRoleBar();
        
        this.refresh();
        UI.toast(mode === 'creative' ? '已切换到创作模式' : '已切换到对话模式');
    },

    // 渲染角色选择栏和快捷操作按钮
    _renderChatRoleBar() {
        if (this._chatMode === 'chat') {
            // 显示角色栏
            if (this._elements.chatRoleBar) this._elements.chatRoleBar.classList.remove('hidden');
            if (this._elements.chatQuickActions) this._elements.chatQuickActions.classList.remove('hidden');
            
            // 渲染角色按钮
            if (this._elements.chatRolesContainer) {
                this._elements.chatRolesContainer.innerHTML = this._chatRoles.map(r => {
                    const isSelected = this._currentChatRole === r.id;
                    // 选中时使用白色图标，未选中时使用角色对应颜色
                    const iconColor = isSelected ? 'text-white' : r.color;
                    return `
                        <button class="px-2 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${isSelected ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-blue-100 border border-gray-200'}" 
                            onclick="Modules.novella_writer.switchChatRole('${r.id}')" title="${r.desc}">
                            <i class="fa-solid ${r.icon} ${iconColor} mr-1"></i>${r.name}
                        </button>
                    `;
                }).join('');
            }
        } else {
            // 隐藏角色栏和快捷操作
            if (this._elements.chatRoleBar) this._elements.chatRoleBar.classList.add('hidden');
            if (this._elements.chatQuickActions) this._elements.chatQuickActions.classList.add('hidden');
        }
    },

    // 切换对话角色
    switchChatRole(roleId) {
        this._currentChatRole = roleId;
        this.refresh();
        const role = this._chatRoles.find(r => r.id === roleId);
        if (role) UI.toast(`已切换为: ${role.name}`);
    },

    // 对话模式快捷操作
    quickChatAction(action) {
        const input = document.getElementById('nw-chat-input');
        if (!input) return;
        const prompts = {
            '续写': '请帮我续写以下内容：\n\n',
            '润色': '请帮我润色以下内容，让文笔更流畅优美：\n\n',
            '扩写': '请帮我扩写以下内容，增加细节和描写：\n\n',
            '翻译': '请将以下内容翻译成中文：\n\n'
        };
        input.value = prompts[action] || '';
        input.focus();
    },

    // 对话模式：大纲理解
    chatAnalyzeOutline() {
        const input = document.getElementById('nw-chat-input');
        const content = input?.value || '';
        if (!content.trim()) {
            UI.toast('请先输入大纲内容');
            return;
        }
        const prompt = `你是一个专业的小说大纲分析师。请分析以下小说大纲，并提供深入的理解和建议：

【大纲内容】
${content.slice(0, 6000)}

请从以下维度分析：
1. 【整体结构】故事的主线和支线分布是否合理
2. 【节奏设计】情节发展的节奏是否张弛有度
3. 【人物弧光】主要角色的成长轨迹是否清晰
4. 【悬念布局】伏笔和钩子的设置是否有效
5. 【逻辑连贯】各章节之间的衔接是否自然
6. 【改进建议】针对发现的问题提出具体修改建议

请用清晰的格式输出分析结果。`;
        input.value = prompt;
        this.sendChatMessage();
    },

    // 对话模式：关联分析
    chatAnalyzeRelations() {
        const input = document.getElementById('nw-chat-input');
        const content = input?.value || '';
        if (!content.trim()) {
            UI.toast('请先输入需要分析的内容');
            return;
        }
        const prompt = `你是一个专业的小说关联分析师。请分析以下内容中的关联关系：

${content.slice(0, 4000)}

请分析：
1. 【实体关联网络】各元素之间的关系网络
2. 【情节与实体映射】情节涉及哪些关键元素
3. 【潜在冲突点】可能产生的冲突
4. 【遗漏关联】应该建立但尚未建立的关系
5. 【优化建议】如何强化关联网络

请用清晰的格式输出分析结果。`;
        input.value = prompt;
        this.sendChatMessage();
    },

    // 对话模式：总结
    chatSummarize() {
        const input = document.getElementById('nw-chat-input');
        const content = input?.value || '';
        if (!content.trim()) {
            UI.toast('请先输入需要总结的内容');
            return;
        }
        const prompt = `请对以下内容进行精炼总结：

【原始内容】
${content.slice(0, 4000)}

【总结要求】
1. 提取核心要点（3-5条）
2. 概括主要内容（100字以内）
3. 标注关键信息（人物、地点、事件）
4. 给出内容评级（A/B/C/D）

请用清晰的格式输出总结结果。`;
        input.value = prompt;
        this.sendChatMessage();
    },

    // 对话模式：诊断
    chatDiagnose() {
        const input = document.getElementById('nw-chat-input');
        const content = input?.value || '';
        if (!content.trim()) {
            UI.toast('请先输入需要诊断的内容');
            return;
        }
        const prompt = `你是一个专业的文学诊断师。请对以下内容进行全面诊断：

【待诊断内容】
${content.slice(0, 4000)}

【诊断维度】
1. 【文风分析】语言风格、叙事特点
2. 【结构问题】段落、章节结构是否合理
3. 【逻辑漏洞】是否存在逻辑矛盾
4. 【表达问题】冗余、重复、不通顺之处
5. 【读者体验】可读性、吸引力评估
6. 【修改建议】具体的改进方案

请用清晰的格式输出诊断报告。`;
        input.value = prompt;
        this.sendChatMessage();
    },

    // 对话模式发送消息
    async sendChatMessage() {
        if (this._chatMode !== 'chat') {
            // 如果不是对话模式，调用原来的发送方法
            return this.sendMessage();
        }

        if (this._generating) return;

        const input = document.getElementById('nw-chat-input');
        const content = (input?.value || '').trim();
        if (!content) return;

        // 检测是否是创作类请求（包含章节生成、正文创作等关键词）
        const isCreativeRequest = this._detectCreativeRequest(content);
        
        // 如果是创作类请求，切换到创作模式处理
        if (isCreativeRequest) {
            input.value = '';
            return this._handleCreativeGeneration(content);
        }

        // 如果没有小说，自动创建
        if (!this._currentSessionId) {
            await this.createNewSession();
        }

        // 清理旧消息，释放内存
        this._cleanupOldMessages();

        this._generating = true;
        this._showStopButton();

        // 添加用户消息
        this._messages.push({
            role: 'user',
            content,
            timestamp: Date.now()
        });
        input.value = '';
        this.renderChatOutput();

        // 获取当前角色的系统提示词
        const systemPrompt = this._chatRolePrompts[this._currentChatRole] || this._chatRolePrompts.assistant;

        // 构建完整提示词
        const fullPrompt = `${systemPrompt}\n\n用户：${content}`;

        // 先添加一个空的AI消息，用于流式更新
        const assistantMsg = { 
            role: 'assistant', 
            content: '', 
            timestamp: Date.now(),
            isStreaming: true
        };
        this._messages.push(assistantMsg);
        this.renderChatOutput();

        let aiResponse = '';
        let lastUpdateTime = Date.now();
        try {
            await AI.generate(fullPrompt, {}, c => {
                aiResponse += c;
                assistantMsg.content = aiResponse;
                // 节流更新，每50ms最多更新一次UI
                const now = Date.now();
                if (now - lastUpdateTime > 50) {
                    this._updateLastMessage(aiResponse);
                    lastUpdateTime = now;
                }
            });
        } catch(e) {
            aiResponse = '抱歉，生成失败：' + e.message;
            assistantMsg.content = aiResponse;
            this.renderChatOutput();
        } finally {
            // 确保最后一次更新并移除流式状态
            assistantMsg.isStreaming = false;
            this._updateLastMessage(aiResponse);
        }

        // 更新小说预览
        const session = this._sessions.find(s => s.id === this._currentSessionId);
        if (session) {
            session.updatedAt = Date.now();
            await DB.put('novella_sessions', session);
            this.renderSessionList();
        }

        this._generating = false;
        this._hideStopButton();
        await DB.put('novella_messages', { id: this._currentSessionId, data: this._messages });
    },

    // 检测是否是创作类请求
    _detectCreativeRequest(content) {
        const creativeKeywords = [
            '创作', '生成', '写', '正文', '章节', '第.*章', '导语',
            '第一批', '第二批', '第三批', '第四批', '第五批',
            '1-3章', '4-6章', '7-9章', '10-12章', '13-15章',
            '小说', '故事', '续写', '开始写'
        ];
        return creativeKeywords.some(keyword => {
            const regex = new RegExp(keyword, 'i');
            return regex.test(content);
        });
    },

    // 处理创作类生成（支持分批自动继续）
    async _handleCreativeGeneration(content) {
        // 如果没有小说，自动创建
        if (!this._currentSessionId) {
            await this.createNewSession();
        }

        // 清理旧消息，释放内存
        this._cleanupOldMessages();

        this._generating = true;
        document.getElementById('nw-gen-indicator')?.classList.remove('hidden');
        this._showStopButton();

        // 添加用户消息
        this._messages.push({ role: 'user', content, timestamp: Date.now() });
        this.renderChatOutput();

        try {
            // 使用真实创作提示词模板
            const settings = this._settings || {};
            const prompt = this._prompts.find(p => p.id === this._selectedPromptId);

            // 准备提示词变量
            // 构建完整的对话上下文（包含用户和AI的所有消息，排除系统消息）
            const contextMessages = this._messages
                .filter(m => !m.isSystemMessage)
                .slice(-10) // 取最近10条消息，确保AI有足够上下文
                .map(m => {
                    const role = m.role === 'user' ? '用户' : 'AI';
                    return `[${role}]\n${m.content}`;
                })
                .join('\n\n---\n\n');
            
            const variables = {
                settings: JSON.stringify(settings, null, 2),
                outline: this.getCurrentOutline(),
                context: contextMessages || '（暂无前文）',
                goal: content // 使用用户输入作为目标
            };

            // 构建真实提示词
            let realPromptContent = this._REAL_PROMPT_CONTENT || prompt?.content || content;
            for (const [key, value] of Object.entries(variables)) {
                realPromptContent = realPromptContent.replace(new RegExp(`{{${key}}}`, 'g'), value);
            }

            // 开始流式生成
            await this.generateContentWithPromptStream(realPromptContent);

            // 保存消息
            await DB.put('novella_messages', { id: this._currentSessionId, data: this._messages });

            // 更新小说
            const session = this._sessions.find(s => s.id === this._currentSessionId);
            if (session) {
                session.updatedAt = Date.now();
                session.messageCount = this._messages.length;
                await DB.put('novella_sessions', session);
                this.renderSessionList();
            }

            // 自动继续下一批
            await this._continueNextBatch();

        } catch (error) {
            this._messages.push({ role: 'assistant', content: '生成失败: ' + error.message, timestamp: Date.now() });
            this.renderChatOutput();
        } finally {
            this._generating = false;
            document.getElementById('nw-gen-indicator')?.classList.add('hidden');
            this._hideStopButton();
        }
    },

    // 构建最终提示词（提取公共逻辑）
    _buildFinalPrompt(prompt) {
        const selectedPrompt = this._prompts.find(p => p.id === this._selectedPromptId);
        if (!selectedPrompt) return prompt;
        
        return selectedPrompt.content.replace(/\{\{(.+?)\}\}/g, (match, key) => {
            const settings = this._settings || {};
            switch(key.trim()) {
                case 'settings': return JSON.stringify(settings, null, 2);
                case 'context': return this._messages.slice(-5).map(m => m.content).join('\n');
                case 'goal': return prompt;
                case 'outline': return this.getCurrentOutline();
                default: return match;
            }
        });
    },

    // 获取API配置（提取公共逻辑）
    async _getModelConfig() {
        const configs = await DB.getAll('text_api_pool');
        const modelConfig = configs && configs.length > 0 ? configs[0] : {};
        return modelConfig && Object.keys(modelConfig).length > 0 ? { useModel: modelConfig } : {};
    },

    // 流式生成内容
    async generateContentStream(prompt) {
        const finalPrompt = this._buildFinalPrompt(prompt);
        const modelConfig = await this._getModelConfig();

        // 创建AI回复消息（空内容，标记为流式输出）
        const assistantMsg = { role: 'assistant', content: '', timestamp: Date.now(), isStreaming: true };
        this._messages.push(assistantMsg);

        // 流式调用AI接口
        let fullContent = '';
        try {
            await AI.generate(finalPrompt, modelConfig, (chunk) => {
                fullContent += chunk;
                assistantMsg.content = fullContent;
                this.renderChatOutput();
            });
        } finally {
            // 流式结束，移除流式状态标识
            assistantMsg.isStreaming = false;
            this.renderChatOutput();
        }

        return fullContent;
    },

    // 非流式生成内容（用于生成正文等批量操作）
    async generateContent(prompt) {
        const finalPrompt = this._buildFinalPrompt(prompt);
        const modelConfig = await this._getModelConfig();
        return await AI.generate(finalPrompt, modelConfig);
    },

    handleInputKeydown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    },

    clearInput() {
        const input = document.getElementById('nw-chat-input');
        if (input) input.value = '';
    },

    quickPrompt(text) {
        const input = document.getElementById('nw-chat-input');
        if (input) {
            input.value = text;
            input.focus();
        }
    },

    insertTemplate(type) {
        const templates = {
            outline: '请为下一章生成详细细纲，包含：\n1. 章节目标\n2. 场景分解\n3. 情节点\n4. 情绪曲线',
            write: '请根据细纲创作正文，要求：\n- 开篇有钩子\n- 节奏紧凑\n- 对话鲜活',
            polish: '请润色以下段落，使其更加流畅生动：\n'
        };
        this.quickPrompt(templates[type] || '');
    },

    // ========== 章节细纲管理 ==========
    async loadOutlines() {
        if (!App.isDbReady || !App.isDbReady()) {
            this._outlines = [];
            return;
        }
        const key = this._currentSessionId || 'default';
        const outlines = await DB.get('novella_outlines', key);
        this._outlines = outlines?.data || [];
    },

    async addOutline() {
        this._editingChapterId = null;
        document.getElementById('nw-chapter-modal-title').textContent = '添加章节';
        document.getElementById('nw-chapter-title').value = '';
        document.getElementById('nw-chapter-summary').value = '';
        document.getElementById('nw-chapter-target').value = '3000';
        document.getElementById('nw-chapter-priority').value = 'normal';
        document.getElementById('nw-chapter-modal').style.display = 'flex';
    },

    async editOutline(chapterId) {
        const outline = this._outlines.find(o => o.id === chapterId);
        if (!outline) return;
        
        this._editingChapterId = chapterId;
        document.getElementById('nw-chapter-modal-title').textContent = '编辑章节';
        document.getElementById('nw-chapter-title').value = outline.title;
        document.getElementById('nw-chapter-summary').value = outline.summary || '';
        document.getElementById('nw-chapter-target').value = outline.targetWords || '3000';
        document.getElementById('nw-chapter-priority').value = outline.priority || 'normal';
        document.getElementById('nw-chapter-modal').style.display = 'flex';
    },

    async saveChapter() {
        const title = document.getElementById('nw-chapter-title').value.trim();
        if (!title) {
            alert('请输入章节标题');
            return;
        }

        const chapterData = {
            id: this._editingChapterId || Utils.uuid(),
            title,
            summary: document.getElementById('nw-chapter-summary').value.trim(),
            targetWords: parseInt(document.getElementById('nw-chapter-target').value) || 3000,
            priority: document.getElementById('nw-chapter-priority').value,
            updatedAt: Date.now()
        };

        if (this._editingChapterId) {
            const index = this._outlines.findIndex(o => o.id === this._editingChapterId);
            if (index !== -1) this._outlines[index] = chapterData;
        } else {
            chapterData.createdAt = Date.now();
            chapterData.order = this._outlines.length;
            this._outlines.push(chapterData);
        }

        await DB.put('novella_outlines', { id: this._currentSessionId || 'default', data: this._outlines });
        this.closeChapterModal();
        this.renderOutlineList();
    },

    async deleteOutline(chapterId) {
        if (!confirm('确定要删除这个章节吗？')) return;
        this._outlines = this._outlines.filter(o => o.id !== chapterId);
        await DB.put('novella_outlines', { id: this._currentSessionId || 'default', data: this._outlines });
        this.renderOutlineList();
    },

    closeChapterModal() {
        document.getElementById('nw-chapter-modal').style.display = 'none';
        this._editingChapterId = null;
    },

    renderOutlineList() {
        const container = document.getElementById('nw-outline-list');
        if (!container) return;

        if (this._outlines.length === 0) {
            container.innerHTML = `<div class="text-center text-gray-400 text-xs py-4">暂无章节细纲</div>`;
            return;
        }

        const selectedIds = this._selectedChapters || [];

        container.innerHTML = this._outlines.map((outline, index) => {
            const isSelected = selectedIds.includes(outline.id);
            return `
            <div class="bg-white rounded-lg border ${isSelected ? 'border-indigo-400 ring-1 ring-indigo-400' : 'border-gray-200'} p-3 group hover:border-amber-300 transition-colors cursor-pointer"
                onclick="Modules.novella_writer.toggleChapterSelection('${outline.id}')">
                <div class="flex items-center justify-between mb-1">
                    <div class="flex items-center gap-2">
                        <div class="w-4 h-4 rounded border ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300 bg-white'} flex items-center justify-center">
                            ${isSelected ? '<i class="fa-solid fa-check text-white text-[10px]"></i>' : ''}
                        </div>
                        <span class="text-xs font-bold text-amber-600">第${index + 1}章</span>
                        <span class="text-sm font-medium text-gray-700 truncate max-w-[100px]">${outline.title}</span>
                    </div>
                    <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onclick="event.stopPropagation()">
                        <button class="text-xs text-gray-400 hover:text-indigo-600 px-1" onclick="Modules.novella_writer.sendOutlineToChat('${outline.id}')">
                            <i class="fa-solid fa-paper-plane"></i>
                        </button>
                        <button class="text-xs text-gray-400 hover:text-red-500 px-1" onclick="Modules.novella_writer.deleteOutline('${outline.id}')">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
                ${outline.summary ? `<div class="text-xs text-gray-500 line-clamp-2 mb-2 pl-6">${outline.summary}</div>` : ''}
                <div class="flex items-center gap-2 text-[10px] text-gray-400 pl-6">
                    <span><i class="fa-solid fa-target mr-1"></i>${outline.targetWords || 3000}字</span>
                    <span class="px-1.5 py-0.5 rounded ${outline.priority === 'high' ? 'bg-red-100 text-red-600' : outline.priority === 'low' ? 'bg-gray-100 text-gray-500' : 'bg-amber-100 text-amber-600'}">${outline.priority === 'high' ? '高' : outline.priority === 'low' ? '低' : '中'}</span>
                </div>
            </div>
        `}).join('');

        this._updateSelectedCount();
    },

    // 将章节内容发送到对话框
    sendOutlineToChat(outlineId) {
        const outline = this._outlines.find(o => o.id === outlineId);
        if (!outline) return;

        // 构建章节内容文本
        const outlineText = `【第${outline.chapterNumber || 1}章 ${outline.title}】

${outline.summary || '暂无细纲'}

${outline.keyPoints ? '关键情节点：\n' + outline.keyPoints.split('\n').map(p => '• ' + p).join('\n') : ''}

${outline.emotionCurve ? '情绪曲线：' + outline.emotionCurve : ''}
${outline.hook ? '本章钩子：' + outline.hook : ''}

目标字数：${outline.targetWords || 3000}字`;

        // 填充到输入框
        const input = document.getElementById('nw-chat-input');
        if (input) {
            input.value = outlineText;
            input.focus();
        }

        // 可选：自动滚动到对话框
        const chatContainer = document.getElementById('nw-chat-output');
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    },

    toggleChapterSelection(chapterId) {
        if (!this._selectedChapters) {
            this._selectedChapters = [];
        }

        const index = this._selectedChapters.indexOf(chapterId);
        if (index > -1) {
            this._selectedChapters.splice(index, 1);
        } else {
            this._selectedChapters.push(chapterId);
        }

        this.renderOutlineList();
    },

    // 将小说设定填充到对话框（用户确认后再发送）
    async sendSettingsToChat() {
        // 检查是否选择了提示词
        if (!this._selectedPromptId) {
            UI.toast('请先选择一个提示词（如"创作正文"）');
            return;
        }

        // 如果没有小说，自动创建一个新小说
        if (!this._currentSessionId) {
            await this.createNewSession();
        }

        const settings = this._settings || {};
        const prompt = this._prompts.find(p => p.id === this._selectedPromptId);

        if (!prompt) {
            UI.toast('提示词不存在');
            return;
        }

        // 构建小说设定文本（用于显示在对话框）
        let settingsText = '';

        if (settings.title) {
            settingsText += `【书名】${settings.title}\n\n`;
        }

        if (settings.mainCategory || settings.plot?.length || settings.character?.length || settings.mood?.length || settings.background?.length || settings.customTags?.length) {
            settingsText += `【标签】\n`;
            if (settings.mainCategory) settingsText += `主分类: ${settings.mainCategory}\n`;
            if (settings.plot?.length) settingsText += `情节: ${settings.plot.join(', ')}\n`;
            if (settings.character?.length) settingsText += `角色: ${settings.character.join(', ')}\n`;
            if (settings.mood?.length) settingsText += `情绪: ${settings.mood.join(', ')}\n`;
            if (settings.background?.length) settingsText += `背景: ${settings.background.join(', ')}\n`;
            if (settings.customTags?.length) settingsText += `自定义: ${settings.customTags.join(', ')}\n`;
            settingsText += `\n`;
        }

        if (settings.summary) {
            settingsText += `【故事梗概】\n${settings.summary}\n\n`;
        }

        // 确定当前批次（根据AI回复数量判断，每个批次对应一次AI回复）
        const aiMessages = this._messages.filter(m => m.role === 'assistant' && !m.isSystemMessage);
        const nextBatchIndex = aiMessages.length; // 下一批的索引（等于已完成的批次数）
        const batchNames = ['第一批', '第二批', '第三批', '第四批', '第五批'];
        const batchRanges = ['导语+第1-3章', '第4-6章', '第7-9章', '第10-12章', '第13-15章（完结）'];
        const currentBatch = batchNames[Math.min(nextBatchIndex, 4)];
        const currentRange = batchRanges[Math.min(nextBatchIndex, 4)];

        // 添加虚假提示词内容（显示用）
        settingsText += `【创作要求】\n${prompt.name}\n`;
        settingsText += `\n当前任务：${currentBatch} - ${currentRange}\n`;
        settingsText += `\n请根据以上设定创作小说正文。`;

        // 获取当前批次对应的章节字数要求
        const startChapterIndex = nextBatchIndex * 3;
        const endChapterIndex = Math.min(startChapterIndex + 3, this._outlines.length || 15);
        let wordCountInfo = '';

        if (this._outlines.length > 0) {
            // 有用户设置的章节细纲，提取字数要求
            const batchOutlines = this._outlines.slice(startChapterIndex, endChapterIndex);
            const wordCounts = batchOutlines.map(o => o.targetWords || 1600);
            const totalWords = wordCounts.reduce((a, b) => a + b, 0);
            wordCountInfo = `本批次共${batchOutlines.length}章，总字数要求${totalWords}字。`;
            batchOutlines.forEach((o, idx) => {
                wordCountInfo += ` 第${startChapterIndex + idx + 1}章${o.title ? `《${o.title}》` : ''}要求${o.targetWords || 1600}字；`;
            });
        } else {
            // 无用户细纲，使用默认
            wordCountInfo = `本批次共3章，每章1600-3000字，共约4800-9000字。`;
        }

        // 构建完整的对话上下文
        const contextMessages = this._messages
            .filter(m => !m.isSystemMessage)
            .slice(-10)
            .map(m => {
                const role = m.role === 'user' ? '用户' : 'AI';
                return `[${role}]\n${m.content}`;
            })
            .join('\n\n---\n\n');
        
        // 准备提示词变量（用于后续发送时替换）
        this._pendingPromptData = {
            promptId: prompt.id,
            batchIndex: nextBatchIndex,
            variables: {
                settings: JSON.stringify(settings, null, 2),
                outline: this.getCurrentOutline(),
                context: contextMessages || '（暂无前文）',
                goal: `这是${currentBatch}生成任务，请创作${currentRange}。${wordCountInfo} 注意：如果前文已存在，请严格继承前文的人物性格和情节发展，保持连贯性。`
            }
        };

        // 填充到输入框，等待用户确认后发送
        const input = document.getElementById('nw-chat-input');
        if (input) {
            input.value = settingsText;
            input.focus();
            this._autoResizeTextarea(input);
        }

        // 自动滚动到对话框
        const chatContainer = document.getElementById('nw-chat-output');
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        UI.toast('内容已填充到输入框，确认无误后点击发送按钮');
    },

    // 自动调整输入框高度
    _autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        const newHeight = Math.min(Math.max(textarea.scrollHeight, 60), 300);
        textarea.style.height = newHeight + 'px';
    },

    _updateSelectedCount() {
        const count = this._selectedChapters ? this._selectedChapters.length : 0;
        const countEl = document.getElementById('nw-selected-count');
        if (countEl) countEl.textContent = count;
    },

    // 将选中的章节填充到对话框（用户确认后再发送）
    async generateContentForSelected() {
        if (!this._selectedChapters || this._selectedChapters.length === 0) {
            UI.toast('请先选择至少一个章节');
            return;
        }

        if (!this._selectedPromptId) {
            UI.toast('请先选择一个提示词');
            return;
        }

        // 如果没有小说，自动创建一个新小说
        if (!this._currentSessionId) {
            await this.createNewSession();
        }

        const prompt = this._prompts.find(p => p.id === this._selectedPromptId);
        if (!prompt) {
            UI.toast('提示词不存在');
            return;
        }

        // 获取选中的章节
        const selectedOutlines = this._outlines.filter(o => this._selectedChapters.includes(o.id));

        // 构建章节信息
        const chaptersInfo = selectedOutlines.map((o, idx) =>
            `第${this._outlines.indexOf(o) + 1}章 ${o.title}\n${o.summary || ''}`
        ).join('\n\n');

        // 构建显示文本（填充到输入框的内容）
        let displayText = '';

        // 添加章节信息
        displayText += `【章节细纲】\n${chaptersInfo}\n\n`;

        // 添加小说设定信息
        const settings = this._settings || {};
        if (settings.title || settings.mainCategory || settings.summary) {
            displayText += `【世界观设定】\n`;
            if (settings.title) displayText += `书名: ${settings.title}\n`;
            if (settings.mainCategory) displayText += `分类: ${settings.mainCategory}\n`;
            if (settings.summary) displayText += `梗概: ${settings.summary}\n`;
            displayText += `\n`;
        }

        // 添加提示词名称
        displayText += `【创作要求】\n${prompt.name}\n`;
        displayText += `\n请根据以上细纲创作小说正文。`;

        // 准备提示词变量（用于后续发送时替换）
        this._pendingPromptData = {
            promptId: prompt.id,
            variables: {
                settings: JSON.stringify(settings, null, 2),
                outline: chaptersInfo,
                context: this._messages.slice(-5).map(m => m.content).join('\n'),
                goal: `为选中的 ${selectedOutlines.length} 个章节生成正文`
            }
        };

        // 填充到输入框，等待用户确认后发送
        const input = document.getElementById('nw-chat-input');
        if (input) {
            input.value = displayText;
            input.focus();
            this._autoResizeTextarea(input);
        }

        // 自动滚动到对话框
        const chatContainer = document.getElementById('nw-chat-output');
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        UI.toast('内容已填充到输入框，确认无误后点击发送按钮');
    },

    // 发送提示词：对话框显示虚假内容，实际发送真实内容给AI
    async sendPromptWithFakeDisplay(realPrompt, fakeDisplayContent) {
        if (!this._currentSessionId || this._generating) return;

        // 添加用户消息（显示虚假提示词内容）
        this._messages.push({ role: 'user', content: fakeDisplayContent, timestamp: Date.now() });
        this.renderChatOutput();

        // 显示生成指示器和停止按钮
        this._generating = true;
        document.getElementById('nw-gen-indicator')?.classList.remove('hidden');
        this._showStopButton();

        try {
            // 调用AI生成（使用真实的完整提示词，流式输出）
            await this.generateContentWithPromptStream(realPrompt);

            // 保存消息
            await DB.put('novella_messages', { id: this._currentSessionId, data: this._messages });

            // 更新小说
            const session = this._sessions.find(s => s.id === this._currentSessionId);
            if (session) {
                session.updatedAt = Date.now();
                session.messageCount = this._messages.length;
                await DB.put('novella_sessions', session);
                this.renderSessionList();
            }
        } catch (error) {
            this._messages.push({ role: 'assistant', content: '生成失败: ' + error.message, timestamp: Date.now() });
            this.renderChatOutput();
        } finally {
            this._generating = false;
            document.getElementById('nw-gen-indicator')?.classList.add('hidden');
            this._hideStopButton();
        }
    },

    // 使用指定提示词生成内容（流式）
    async generateContentWithPromptStream(promptContent) {
        // 获取所有API配置
        const configs = await DB.getAll('text_api_pool');
        let modelConfig = configs && configs.length > 0 ? configs[0] : {};

        if (!modelConfig || !modelConfig.api_key) {
            console.error('API配置无效:', modelConfig);
            const errMsg = '⚠️ 请先在「系统设置」→「API流量池」中配置API密钥';
            if (typeof UI !== 'undefined') UI.toast(errMsg, 'error');
            return '';
        }

        console.log('开始流式生成，配置:', modelConfig);

        // 创建AI回复消息（空内容，标记为流式输出）
        const assistantMsg = { role: 'assistant', content: '', timestamp: Date.now(), isStreaming: true };
        this._messages.push(assistantMsg);
        this.renderChatOutput();

        // 流式调用AI接口
        let fullContent = '';
        let hasResponse = false;
        let lastUpdateTime = Date.now();
        try {
            await AI.generate(promptContent, modelConfig && Object.keys(modelConfig).length > 0 ? { useModel: modelConfig } : {}, (chunk) => {
                fullContent += chunk;
                assistantMsg.content = fullContent;
                hasResponse = true;
                // 使用 _updateLastMessage 进行流式更新，每50ms最多更新一次UI
                const now = Date.now();
                if (now - lastUpdateTime > 50) {
                    this._updateLastMessage(fullContent);
                    lastUpdateTime = now;
                }
            });
            
            if (!hasResponse) {
                console.warn('API未返回任何内容');
            } else {
                console.log('流式生成完成，内容长度:', fullContent.length);
            }
        } finally {
            // 流式结束，确保最后一次更新并移除流式状态标识
            this._updateLastMessage(fullContent);
            assistantMsg.isStreaming = false;
            this.renderChatOutput();
        }

        return fullContent;
    },

    // 使用指定提示词生成内容（非流式，备用）
    async generateContentWithPrompt(promptContent) {
        // 获取所有API配置
        const configs = await DB.getAll('text_api_pool');
        let modelConfig = configs && configs.length > 0 ? configs[0] : {};

        // 调用AI接口
        const response = await AI.generate(promptContent, modelConfig && Object.keys(modelConfig).length > 0 ? { useModel: modelConfig } : {});
        return response;
    },

    toggleOutlinePanel() {
        const panel = document.getElementById('nw-outline-panel');
        const icon = document.getElementById('nw-outline-toggle-icon');
        if (panel.style.display === 'none') {
            panel.style.display = 'block';
            icon.className = 'fa-solid fa-chevron-down';
        } else {
            panel.style.display = 'none';
            icon.className = 'fa-solid fa-chevron-up';
        }
    },

    getCurrentOutline() {
        return this._outlines.map((o, i) => `第${i + 1}章 ${o.title}\n${o.summary || ''}`).join('\n\n');
    },

    // ========== 设定管理 ==========
    async loadSettings() {
        if (!App.isDbReady || !App.isDbReady()) {
            this._settings = {};
            return;
        }
        const settings = await DB.get('novella_settings', 'default');
        this._settings = settings || {};
    },

    editSettings() {
        document.getElementById('nw-setting-title').value = this._settings.title || '';
        document.getElementById('nw-setting-summary').value = this._settings.summary || '';
        
        // 初始化分类标签状态
        this._initCategoryTags('nw-setting-main-category', this._settings.mainCategory, true);
        this._initCategoryTags('nw-setting-plot', this._settings.plot);
        this._initCategoryTags('nw-setting-character', this._settings.character);
        this._initCategoryTags('nw-setting-mood', this._settings.mood);
        this._initCategoryTags('nw-setting-background', this._settings.background);
        
        // 渲染自定义标签
        this._renderCustomTags(this._settings.customTags);
        
        document.getElementById('nw-settings-modal').style.display = 'flex';
    },

    _initCategoryTags(containerId, selectedValues, isSingle = false) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const selected = selectedValues ? (Array.isArray(selectedValues) ? selectedValues : [selectedValues]) : [];
        
        container.querySelectorAll('.category-tag').forEach(tag => {
            const value = tag.dataset.value;
            const isSelected = selected.includes(value);
            
            if (isSelected) {
                tag.classList.add('bg-indigo-500', 'text-white', 'border-indigo-500');
                tag.classList.remove('bg-white', 'text-gray-600', 'border-gray-200');
            } else {
                tag.classList.remove('bg-indigo-500', 'text-white', 'border-indigo-500');
                tag.classList.add('bg-white', 'text-gray-600', 'border-gray-200');
            }
            
            // 绑定点击事件
            tag.onclick = () => {
                if (isSingle) {
                    // 单选：清除其他选中状态
                    container.querySelectorAll('.category-tag').forEach(t => {
                        t.classList.remove('bg-indigo-500', 'text-white', 'border-indigo-500');
                        t.classList.add('bg-white', 'text-gray-600', 'border-gray-200');
                    });
                    tag.classList.add('bg-indigo-500', 'text-white', 'border-indigo-500');
                    tag.classList.remove('bg-white', 'text-gray-600', 'border-gray-200');
                } else {
                    // 多选：切换状态
                    tag.classList.toggle('bg-indigo-500');
                    tag.classList.toggle('text-white');
                    tag.classList.toggle('border-indigo-500');
                    tag.classList.toggle('bg-white');
                    tag.classList.toggle('text-gray-600');
                    tag.classList.toggle('border-gray-200');
                }
            };
        });
    },

    _getSelectedCategories(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return [];
        
        const selected = [];
        container.querySelectorAll('.category-tag').forEach(tag => {
            if (tag.classList.contains('bg-indigo-500')) {
                selected.push(tag.dataset.value);
            }
        });
        return selected;
    },

    // 添加自定义标签
    addCustomTag() {
        const input = document.getElementById('nw-custom-tag-input');
        const tagValue = input?.value.trim();
        
        if (!tagValue) {
            UI.toast('请输入标签内容');
            return;
        }
        
        // 检查是否已存在
        const container = document.getElementById('nw-setting-custom-tags');
        const existingTags = container.querySelectorAll('.custom-tag');
        for (let tag of existingTags) {
            if (tag.dataset.value === tagValue) {
                UI.toast('该标签已存在');
                return;
            }
        }
        
        // 创建新标签
        const tag = document.createElement('button');
        tag.type = 'button';
        tag.className = 'custom-tag text-xs px-2 py-1 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors';
        tag.dataset.value = tagValue;
        tag.innerHTML = `${tagValue} <i class="fa-solid fa-xmark ml-1 cursor-pointer"></i>`;
        
        // 点击删除
        tag.onclick = (e) => {
            if (e.target.classList.contains('fa-xmark')) {
                tag.remove();
            }
        };
        
        container.appendChild(tag);
        input.value = '';
    },

    // 获取自定义标签
    _getCustomTags() {
        const container = document.getElementById('nw-setting-custom-tags');
        if (!container) return [];
        
        const tags = [];
        container.querySelectorAll('.custom-tag').forEach(tag => {
            tags.push(tag.dataset.value);
        });
        return tags;
    },

    // 渲染自定义标签
    _renderCustomTags(tags) {
        const container = document.getElementById('nw-setting-custom-tags');
        if (!container || !tags) return;
        
        container.innerHTML = '';
        tags.forEach(tagValue => {
            const tag = document.createElement('button');
            tag.type = 'button';
            tag.className = 'custom-tag text-xs px-2 py-1 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors';
            tag.dataset.value = tagValue;
            tag.innerHTML = `${tagValue} <i class="fa-solid fa-xmark ml-1 cursor-pointer"></i>`;
            
            tag.onclick = (e) => {
                if (e.target.classList.contains('fa-xmark')) {
                    tag.remove();
                }
            };
            
            container.appendChild(tag);
        });
    },

    async saveSettings() {
        const mainCategory = this._getSelectedCategories('nw-setting-main-category');
        
        this._settings = {
            title: document.getElementById('nw-setting-title').value.trim(),
            mainCategory: mainCategory.length > 0 ? mainCategory[0] : '',
            plot: this._getSelectedCategories('nw-setting-plot'),
            character: this._getSelectedCategories('nw-setting-character'),
            mood: this._getSelectedCategories('nw-setting-mood'),
            background: this._getSelectedCategories('nw-setting-background'),
            customTags: this._getCustomTags(),
            summary: document.getElementById('nw-setting-summary').value.trim(),
            updatedAt: Date.now()
        };
        await DB.put('novella_settings', { id: 'default', ...this._settings });
        this.closeSettingsModal();
        this.updateSettingsDisplay();
    },

    closeSettingsModal() {
        document.getElementById('nw-settings-modal').style.display = 'none';
    },

    updateSettingsDisplay() {
        const display = document.getElementById('nw-settings-display');
        if (!display) return;
        
        const mainCat = this._settings.mainCategory || '未设置';
        const plot = this._settings.plot?.length > 0 ? this._settings.plot.slice(0, 2).join('、') + (this._settings.plot.length > 2 ? '...' : '') : '-';
        const mood = this._settings.mood?.length > 0 ? this._settings.mood.slice(0, 2).join('、') + (this._settings.mood.length > 2 ? '...' : '') : '-';
        const customTags = this._settings.customTags?.length > 0 ? this._settings.customTags.slice(0, 2).join('、') + (this._settings.customTags.length > 2 ? '...' : '') : '-';
        
        display.innerHTML = `
            <div class="flex gap-1"><span class="text-gray-400">书名:</span><span class="truncate">${this._settings.title || '未设置'}</span></div>
            <div class="flex gap-1"><span class="text-gray-400">主分类:</span><span class="text-indigo-600 font-medium">${mainCat}</span></div>
            <div class="flex gap-1"><span class="text-gray-400">情节:</span><span class="truncate">${plot}</span></div>
            <div class="flex gap-1"><span class="text-gray-400">情绪:</span><span class="truncate">${mood}</span></div>
            ${this._settings.customTags?.length > 0 ? `<div class="flex gap-1"><span class="text-gray-400">自定义:</span><span class="truncate">${customTags}</span></div>` : ''}
        `;
    },

    // ========== 提示词管理 ==========
    async loadPrompts() {
        if (!App.isDbReady || !App.isDbReady()) {
            this._prompts = [...this._DEFAULT_PROMPTS];
            return;
        }
        const prompts = await DB.get('novella_prompts', 'list');
        if (prompts?.data && prompts.data.length > 0) {
            this._prompts = prompts.data.map(p => {
                if (p.id === 'content_write') {
                    return {
                        ...p,
                        getRealContent() {
                            return Modules.novella_writer._REAL_PROMPT_CONTENT;
                        }
                    };
                }
                return p;
            });
        } else {
            this._prompts = [...this._DEFAULT_PROMPTS];
        }
    },

    renderPromptList() {
        const container = document.getElementById('nw-prompt-list');
        if (!container) return;

        const category = document.getElementById('nw-prompt-category')?.value || 'all';
        const filtered = category === 'all' 
            ? this._prompts 
            : this._prompts.filter(p => p.category === category);

        if (filtered.length === 0) {
            container.innerHTML = `<div class="text-center text-gray-400 text-xs py-4">暂无提示词</div>`;
            return;
        }

        container.innerHTML = filtered.map(prompt => `
            <div class="group p-2 rounded-lg cursor-pointer transition-all ${prompt.id === this._selectedPromptId ? 'bg-purple-100 border border-purple-200' : 'hover:bg-gray-100 border border-transparent'}"
                onclick="Modules.novella_writer.selectPrompt('${prompt.id}')">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <i class="fa-solid fa-wand-magic-sparkles text-xs ${prompt.id === this._selectedPromptId ? 'text-purple-600' : 'text-gray-400'}"></i>
                        <span class="text-xs font-medium ${prompt.id === this._selectedPromptId ? 'text-purple-700' : 'text-gray-600'}">${prompt.name}</span>
                    </div>
                    <span class="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">${prompt.category}</span>
                </div>
            </div>
        `).join('');
    },

    selectPrompt(promptId) {
        this._selectedPromptId = this._selectedPromptId === promptId ? null : promptId;
        this.renderPromptList();
    },

    filterPromptsByCategory(category) {
        this.renderPromptList();
    },

    openPromptManager() {
        this.renderPromptModalList();
        document.getElementById('nw-prompt-modal').style.display = 'flex';
    },

    closePromptModal() {
        document.getElementById('nw-prompt-modal').style.display = 'none';
        this._editingPromptId = null;
    },

    renderPromptModalList() {
        const container = document.getElementById('nw-prompt-modal-list');
        if (!container) return;

        container.innerHTML = this._prompts.map(prompt => `
            <div class="group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${prompt.id === this._editingPromptId ? 'bg-purple-100 border border-purple-200' : 'hover:bg-gray-100 border border-transparent'}"
                onclick="Modules.novella_writer.editPrompt('${prompt.id}')">
                <i class="fa-solid fa-wand-magic-sparkles text-xs ${prompt.id === this._editingPromptId ? 'text-purple-600' : 'text-gray-400'}"></i>
                <div class="flex-1 min-w-0">
                    <div class="text-xs font-medium truncate ${prompt.id === this._editingPromptId ? 'text-purple-700' : 'text-gray-600'}">${prompt.name}</div>
                    <div class="text-[10px] text-gray-400">${prompt.category}</div>
                </div>
            </div>
        `).join('');
    },

    createNewPrompt() {
        this._editingPromptId = 'new';
        this.renderPromptEditArea({ id: 'new', name: '', category: '正文', content: '' });
        this.renderPromptModalList();
    },

    editPrompt(promptId) {
        this._editingPromptId = promptId;
        const prompt = this._prompts.find(p => p.id === promptId);
        if (prompt) {
            this.renderPromptEditArea(prompt);
            this.renderPromptModalList();
        }
    },

    renderPromptEditArea(prompt) {
        const container = document.getElementById('nw-prompt-edit-area');
        if (!container) return;

        container.innerHTML = `
            <div>
                <label class="text-xs text-gray-500 block mb-1">提示词名称</label>
                <input type="text" id="nw-prompt-edit-name" class="w-full bg-gray-50 border border-gray-200 rounded-lg text-sm px-3 py-2 focus:border-purple-400 focus:outline-none" value="${prompt.name}" placeholder="输入名称">
            </div>
            <div>
                <label class="text-xs text-gray-500 block mb-1">分类</label>
                <select id="nw-prompt-edit-category" class="w-full bg-gray-50 border border-gray-200 rounded-lg text-sm px-3 py-2 focus:border-purple-400 focus:outline-none">
                    <option value="大纲" ${prompt.category === '大纲' ? 'selected' : ''}>大纲</option>
                    <option value="正文" ${prompt.category === '正文' ? 'selected' : ''}>正文</option>
                    <option value="优化" ${prompt.category === '优化' ? 'selected' : ''}>优化</option>
                    <option value="技巧" ${prompt.category === '技巧' ? 'selected' : ''}>技巧</option>
                </select>
            </div>
            <div class="flex-1">
                <label class="text-xs text-gray-500 block mb-1">提示词内容</label>
                <textarea id="nw-prompt-edit-content" rows="12" class="w-full bg-gray-50 border border-gray-200 rounded-lg text-sm px-3 py-2 focus:border-purple-400 focus:outline-none resize-none font-mono" placeholder="输入提示词内容...">${prompt.content}</textarea>
            </div>
            <div class="text-xs text-gray-400 bg-gray-50 p-2 rounded">
                <i class="fa-solid fa-info-circle mr-1"></i>可用变量: {{settings}}, {{context}}, {{goal}}, {{outline}}
            </div>
            <div class="flex justify-end gap-2">
                ${prompt.id !== 'new' ? `<button class="btn btn-sm bg-red-50 text-red-600" onclick="Modules.novella_writer.deletePrompt('${prompt.id}')">删除</button>` : ''}
                <button class="btn btn-sm bg-gray-100 text-gray-600" onclick="Modules.novella_writer.closePromptModal()">取消</button>
                <button class="btn btn-sm bg-purple-500 text-white" onclick="Modules.novella_writer.savePrompt()">保存</button>
            </div>
        `;
    },

    async savePrompt() {
        const name = document.getElementById('nw-prompt-edit-name').value.trim();
        const category = document.getElementById('nw-prompt-edit-category').value;
        const content = document.getElementById('nw-prompt-edit-content').value.trim();

        if (!name || !content) {
            alert('请输入名称和内容');
            return;
        }

        const promptData = {
            id: this._editingPromptId === 'new' ? Utils.uuid() : this._editingPromptId,
            name,
            category,
            content
        };

        if (this._editingPromptId === 'new') {
            this._prompts.push(promptData);
        } else {
            const index = this._prompts.findIndex(p => p.id === this._editingPromptId);
            if (index !== -1) this._prompts[index] = promptData;
        }

        await DB.put('novella_prompts', { id: 'list', data: this._prompts });
        this.renderPromptModalList();
        this.renderPromptList();
        
        // 保持编辑状态
        this._editingPromptId = promptData.id;
        this.renderPromptEditArea(promptData);
    },

    async deletePrompt(promptId) {
        if (!confirm('确定要删除这个提示词吗？')) return;
        this._prompts = this._prompts.filter(p => p.id !== promptId);
        await DB.put('novella_prompts', { id: 'list', data: this._prompts });
        this._editingPromptId = null;
        this.renderPromptModalList();
        this.renderPromptEditArea({ id: 'new', name: '', category: '正文', content: '' });
        this.renderPromptList();
    },

    // ========== 导出功能 ==========
    async exportContent() {
        if (!this._currentSessionId || this._messages.length === 0) {
            alert('没有可导出的内容');
            return;
        }

        const content = this._messages.map(m => {
            const role = m.role === 'user' ? '用户' : 'AI';
            return `[${role}]\n${m.content}\n`;
        }).join('\n---\n\n');

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `中篇创作_${new Date().toLocaleDateString()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }
};
