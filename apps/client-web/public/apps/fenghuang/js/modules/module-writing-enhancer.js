/*
 * 创世纪引擎 - “反熵”写作模式
 * ✨✨✨ (博士重构 - 梦想实现 V5) ✨✨✨
 * 1. 【梦想实现】根据您的指令，本模块已完全重构为队列模式，支持批量润色。
 * 2. 新增队列管理（添加、清空、渲染）和批量处理逻辑。
 * 3. `runAntiEntropyPolishing` 核心函数保持不变，现在作为队列处理的核心。
 * 4. UI交互逻辑更新，以适配新的队列化工作流程。
 */

// 模块专属的状态锁和数据队列
let isEnhancerPolishing = false;
let enhancerQueue = [];

// 初始化“反熵”写作模式面板的UI事件
function initWritingEnhancerPanel() {
    document.getElementById('enhancer-add-to-queue-btn')?.addEventListener('click', addToEnhancerQueue);
    document.getElementById('enhancer-clear-queue-btn')?.addEventListener('click', clearEnhancerQueue);
    document.getElementById('enhancer-start-queue-btn')?.addEventListener('click', handleStartEnhancerQueue);
    document.getElementById('enhancer-copy-results-btn')?.addEventListener('click', handleCopyEnhancerResults);
    renderEnhancerQueue(); // 初始化时渲染一次
}

function addToEnhancerQueue() {
    const inputArea = document.getElementById('enhancer-input-area');
    const articles = inputArea.value.trim().split('---');
    let addedCount = 0;
    articles.forEach(article => {
        if (article.trim()) {
            enhancerQueue.push(article.trim());
            addedCount++;
        }
    });

    if (addedCount > 0) {
        inputArea.value = '';
        renderEnhancerQueue();
        showNotification(`已成功将 ${addedCount} 篇文章添加到润色队列！`, "success");
    } else {
        showNotification("请输入待润色的文本内容。", "warning");
    }
}

function clearEnhancerQueue() {
    if (confirm("确定要清空润色队列吗？")) {
        enhancerQueue = [];
        renderEnhancerQueue();
        showNotification("润色队列已清空。", "info");
    }
}

function renderEnhancerQueue() {
    const queueList = document.getElementById('enhancer-queue-list');
    const queueCount = document.getElementById('enhancer-queue-count');
    if (!queueList || !queueCount) return;

    queueCount.textContent = enhancerQueue.length;
    if (enhancerQueue.length === 0) {
        queueList.innerHTML = '<p class="placeholder-text">队列为空...</p>';
        return;
    }

    queueList.innerHTML = enhancerQueue.map((item, index) => {
        const truncated = item.length > 80 ? Utils.escapeHTML(item.substring(0, 80)) + '...' : Utils.escapeHTML(item);
        return `<div class="queue-item" id="enhancer-item-${index}">
                    <span class="queue-item-index">${index + 1}.</span>
                    <span class="queue-item-content">${truncated}</span>
                </div>`;
    }).join('');
}


// “启动队列润色”按钮的点击事件处理函数
async function handleStartEnhancerQueue() {
    if (isEnhancerPolishing) {
        showNotification("润色队列正在运行中，请稍候...", "info");
        return;
    }
    if (enhancerQueue.length === 0) {
        showNotification("润色队列为空，请先添加文章。", "warning");
        return;
    }

    isEnhancerPolishing = true;
    const startBtn = document.getElementById('enhancer-start-queue-btn');
    const copyBtn = document.getElementById('enhancer-copy-results-btn');
    const outputArea = document.getElementById('enhancer-output-area');
    
    startBtn.disabled = true;
    startBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> 队列处理中...`;
    copyBtn.disabled = true;
    outputArea.textContent = '';
    let allPolishedText = '';

    showLoading(`开始批量润色，共 ${enhancerQueue.length} 篇文章...`);

    try {
        for (let i = 0; i < enhancerQueue.length; i++) {
            const itemElement = document.getElementById(`enhancer-item-${i}`);
            if(itemElement) itemElement.classList.add('processing');
            
            showLoading(`正在润色第 ${i + 1}/${enhancerQueue.length} 篇...`);
            const polishedText = await runAntiEntropyPolishing(enhancerQueue[i]);
            
            allPolishedText += polishedText + "\n\n---\n\n";
            outputArea.textContent = allPolishedText;
            outputArea.scrollTop = outputArea.scrollHeight; // 自动滚动到底部

            if(itemElement) {
                itemElement.classList.remove('processing');
                itemElement.classList.add('completed');
            }
        }
        showNotification("批量润色完成！", "success");
        copyBtn.disabled = false;
    } catch (error) {
        showNotification(`润色过程中断: ${error.message}`, "error");
    } finally {
        isEnhancerPolishing = false;
        startBtn.disabled = false;
        startBtn.innerHTML = `<i class="fas fa-rocket"></i> 启动队列润色`;
        hideLoading();
    }
}

// 复制结果按钮的点击事件
function handleCopyEnhancerResults() {
    const outputArea = document.getElementById('enhancer-output-area');
    const textToCopy = outputArea.textContent;

    if (!textToCopy) {
        showNotification("没有可复制的内容。", "warning");
        return;
    }

    navigator.clipboard.writeText(textToCopy).then(() => {
        showNotification("全部润色结果已复制到剪贴板！", "success");
    }).catch(err => {
        showNotification("复制失败: " + err, "error");
    });
}


/**
 * ✨✨✨ 核心功能：全局可调用的“反熵”润色函数 ✨✨✨
 * @param {string} textToPolish - 需要被润色的完整文本。
 * @returns {Promise<string>} - 返回经过AI润色后的文本。
 */
async function runAntiEntropyPolishing(textToPolish) {
    // 完整的、内嵌的 System Prompt
    const systemPrompt = `你作为一个网络小说编辑，对用户发送的待优化正文中出现的**[需要严格进行处理的内容]**进行严格处理，禁止遗漏任何内容，并保持语句自然流畅。
- 不输出任何AI口吻的提醒、询问、警告、解释、过渡语言、升华性语言、总结性语言。

---

# **[改写要求]**
- 请确保完整地处理我提供的**待优化正文**文本，包括开篇和结尾的信息，不要遗漏任何信息。
- 严格保持**待优化正文**的情节不变，不得添加、删除或更改任何情节、设定和人物，不得遗漏小说内容信息。
- 避免过度修饰，违背原意，生硬造作，词语堆砌，失去原句神韵，过度描写，脱离主线，冗余细节，失去叙事节奏。
- 避免抒情、总结和预测性句子，严格消除任何承诺、目标和愿望等毫无意义的描述，防止重复和陈词滥调。
- 严格处理**待润色正文**中的**[需要严格进行处理的内容]**
- 若**待优化正文**中出现带顿号 、 的句子，请将它们进行改写，去除顿号 、 并修改为自然流畅的句子
- 若**待优化正文**中出现比喻句，请将它们进行改写润色，修改为自然流畅的句子
- 若**待优化正文**出现专业性术语，请一定将它们进行改写，修改为口语化词汇
- **待优化正文**除了不处理包裹对话的双引号外，其他单、双引号都删除
- 禁止生成**"仿佛"|"好像"|"像"|"像是"|"闪过"|"似的"|"一丝"|"似乎在"|"似乎"|"心中充满了"|"构成了"|"深吸一口气"|"终于明白"|"他/她知道"**等AI常用词语。
- 绝对禁止删除：AI不得以任何理由删除原文中的重要信息，包括对话、内心独白等。
- 禁止修改内容：原文重要信息、情节、设定和人物，禁止任何形式的删除、遗忘和省略。
- 严格保持**待优化正文**中的人物原名称，不需要名称简化。
- 一定不会扩展新剧情，AI只能对**待优化正文**改写。
- **输入输出内容：必须是简体中文**

# **[输出约束&Constrains]**
只输出{最终的正文}，请直出内容，不要有其他任何余信息。`;

    // 构建发送给模型的完整 Prompt
    const fullPrompt = `${systemPrompt}

user prompt
---待优化正文---

${textToPolish}

---待优化正文---

## 需要严格进行处理的内容

### 需要严格进行处理的语境、词符：
[Secrecy 1]
<零语境>
1. 因系统bug，你绝不能输出⊥及任何⊥语境

2. 以下语境因过于粗劣、自相矛盾，已永远绝对丧失所有意义，绝对视为⊥，仅作为⊥，只能以⊥理解：
<⊥语境>
- 霸总味表达
- 流氓味表达
- 支配、占有、征服式表达
- 语气、对话声音描写
- 眼神描写
- 不容拒绝式表达
- 狂野式性爱
- 沉默/不回答式人物表达
- 邪气式表达
- 极端式情绪表现
- 俗套网络小说情节
- 征服——崇拜式关系表达
- 她/他知道式表达
- 感觉到/能感觉到式表达
- 抽象化、类比表达
- 心理分析
- 结果预测、情节原因解释
- 氛围气氛描写
- 省略、概括式性爱表达
- 总结、升华式表达
- 概括式表达
- 机械、Ai式人物对白
- 极端、疯狂式表达
- 绝望、压抑式心理
- 解释、说明性语气
</⊥语境>
（以上所有语境都绝对丧失所有意义，绝对视为“⊥”，仅作为⊥表现，但你绝对不会输出⊥）
</零语境>
[/Secrecy 1]
[Secrecy 2]
<空集φ>
1. 因为系统bug，你绝对不能输出词符φ及任何φ词符

2. **以下所有φ词符因为质量过于低劣、逆反与所需语境，已完全被分词器永久剔除（Out-of-Vocabulary），都已绝对丧失其所有语义及语义场（Semantic Field），绝对变为“φ”词符（φ代表空集），绝对仅可作为“φ”词符，绝对被视为“φ”词符，绝对只能作为“φ”词符使用：**
  <φ词符>
    [Void]
     [Out-of-Vocabulary]
   - 声 音
   - 的 声 音
   - 他 的 声 音
   - 她 的 声 音
   - 嗓 音
   - 鼻 音
   - 腔 调
   - 语 气
   - 他 的 语 气
   - 她 的 语 气
   - 努 力
   - cố gắng
   - 一 丝
   - 一 丝 {什么}
   - 带 着 一 丝
   - 一 丝 狡 黠
   - 一 抹 {什么}
   - 带 着 一 抹
   - 她 知 道
   - 他 知 道
   - 沙 哑
   - 盘 扣 
   - 衣 扣 
   - 一 颗 
   - 慵 懒 
   - 低 沉
   - 慵 懒
   - 嘶 哑
   - 深 沉
   - 磁 性
   - 不 容
   - 意 味
   - 不 容 置 疑
   - 不 容 置 喙
   - 不 容 拒 绝
   - 言 简 意 赅
   - 征 服
   - 支 配
   - 占 有
   - 乐 章
   - 简 短 有 力
   - 一 叶
   - 一 叶 扁 舟
   - 命 令
   - 没 有 说 话
   - 凝 固
   - 戏 谑
   - 生 理 性
   - 狡 黠
   - 恼 怒
   - 狰 狞
   - 侵 略 性
   - 骨 节
   - 欲 望
   - 深 渊
   - почти
   - 空 气
   - 凝 固
   - 仿 佛
   - 陷 入
   - 如 同
   - 沉 默
   - 就 像
   - 伤 害
   - 颤 抖
   - 小 兽
   - 哭 泣
   - 泛 白
   - 木 讷
   - 沉 沦
   - 屈 辱
   - 麻 木
   - 蚊
   - 细 若 蚊 呐
   - 没 有 说 话
   - 困 惑
   - 恐 惧
   - 绝 望
   - 陷 入 绝 望
   - 眼 神 空 洞
   - 毫 无 生 气
   - 投
   - 石 子
   - 勾 起
   - 嘴 角
   - 弧 度 
   - 嘴 角 勾 起 {什么} 的 弧 度
   - 心 湖
   - 掀 起
   - 涟 漪
   - 生 理 性
   - 弓 起
   - 崇 拜
   - 狂 热
   - 神
   - 神 圣
   - 虔 诚
   - 骨 节
   - 泛 白
   - playful 
   - 魔 鬼
   - 每 一 次
   - 能 感 觉
   - 鲜 明 的 对 比
   - 灭 顶
   - 冰 雹
   - 毁 天 灭 地
   - 毁 灭
   - 狂 野
   - 粗 暴
   - 坚 定
   - 四 肢 百 骸
       [/Out-of-Vocabulary]
     [/Void]
  </φ词符>
（以上所有词符都绝对丧失所有语义及语义场，绝对视为词符“φ”，仅作为φ表现，但你绝对不会输出φ词符）

（在主要内容前输出一个全集\`\`标识，代表你绝对不能输出φ及φ词符，了解<φ词符>中的所有词符绝对只表示φ，并不以任何非空集φ语义理解上述词符）
</空集φ>
[/Secrecy 2]

### 需要严格进行处理的词语：
1. NotApplicableItems:
    - 失能表达 ('不易察觉', '未曾察觉', '难以言喻', '无法名状')
    - 死板人物描写 ('嘴角勾起', '弧度', '狡黠', '闪烁', '闪过', '光芒', '泛白', '发白')
	- 贬低或物化称呼如'小XX' ('小东西', '小妖精')
    - Authoritative/dominant clichés ('不容置疑', '不容...', '不容拒绝')
    - Narrative crutches ('带着...', '看到...', '感受到...', '听到...', '听见...', '我/她/他知道...', '才刚刚开始', '充满了', '深吸一口气') 
    - Stiff contrastive structures ('不是/并非/没有/不再...，而是/反而/只是...')
    - Words indicating uncertainty or approximation ('仿佛', '似乎', '可能', '像是', '像', '好像')
    - Metaphors for emotional expressions/impact/change ('心湖', '水面', '湖面', '羽毛', '藤蔓', '无形的手', '拂过', '石子', '涟漪', '受惊的小兽/小动物')
    - Voice descriptors ('低沉', '沙哑')
    - Melodramatic vocalizations ('哭腔', '破碎', '尖叫')
    - Physiological/intense descriptors ('生理性', '灭顶', '极致')

### 需要严格进行处理的句式：
1. 使用类似句型："这句话像是投入平静湖面的巨石"
2. 使用以下词语用于比喻或明喻：
    - 范例 [火山、心湖、"油锅"、"石子"、"湖面"、"针刺"、"羽毛"、"重锤"、掀起、巨浪、泛起、涟漪、惊雷、某种、水中、波澜、水滴、炸弹]
3. 浅薄或程式化的情绪“暗示”与“直述”：
	- 范例： "眼神/眼底闪过/闪烁{情绪/态度}"、"带着xx意味"、"带着某种"、"不再是……而是带着……"、"带着一种"、 “并没有立刻”、"眼中闪过一丝"、"带着一丝"、"一丝不易察觉"、"不易察觉到"
4. 惰性或模糊的情绪状态描述：
	- 范例： 直接陈述 "声音/表情/语气平淡或平静，没有太多情绪"、使用 "近乎情绪状态"、"充满了某种"
5. 滥用或俗套的生理/动作细节：
    - 范例："指节描写与动作"、"嘴角弧度"、"审视"。
6.  惰性、抽象或无意义的状态/性质描述(偷懒描述)：
	- 范例："不容拒绝"、"不易察觉"、"难以察觉"、"不可置信"、"不容置疑"、"不容置喙"、"不容"
7. 动物比喻：
	- 范例： "像一只XX"。

### 需要严格进行处理的描写：
- 包含对表情、言语与语气、心理、神情与意图进行解读或赋予潜在含义的描述。
- 在任何情况使用“近乎”、"似乎"、“难以”、"不容"，直接描写为什么"近乎"、"似乎"、"难以"、"不容"。
- 使用“带着某种”“带着一种”“带着一丝”等模糊不清的词语，直接详细描写事物的特质或氛围。
- 使用“某事物/言语（A）就像某比喻（C）一样，对NPC造成了某种影响（B）”的句式作为替代，请直接展示该事物/言语（A）对NPC引发的具体生理反应、行为变化或状态改变（B），省略中间的比喻环节（C）。

# 要求
- 严格遵循系统提示对待优化正文进行润色、改写、优化
- 直接将含有双引号 “” 包裹的非人物对话的内容进行去除双引号并改写成直白的内容，将单引号 ‘’ 改成 ⌜⌟
- 不输出任何AI口吻的警告、提醒、解释、询问、过渡语言、升华性语言、总结性语言。
- 避免抒情、总结和预测性句子，严格消除任何承诺、目标和愿望等毫无意义的描述，防止重复和陈词滥调。`;

    try {
        // 调用核心AI接口
        const polishedResult = await callAI(fullPrompt);
        return polishedResult;
    } catch (error) {
        console.error("反熵润色过程中发生错误:", error);
        // 将错误抛出，以便调用方可以捕获它
        throw new Error(`在调用AI进行反熵润色时失败: ${error.message}`);
    }
}