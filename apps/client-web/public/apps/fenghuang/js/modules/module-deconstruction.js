/*
 * 创世纪引擎 V76.2 - 最终稳定版
 * 模块: 拆解室 (Deconstruction Room)
 * ✨✨✨ (博士重构 - 最终修正) ✨✨✨
 * 1. 【核心修复】将全局状态锁变量从 `isGenerating` 重命名为 `isDeconstructing`，解决了变量重名导致的致命语法错误。
 */

// 模块专属的状态锁，防止在AI生成时重复点击
let isDeconstructing = false;

function initializeDeconstructionRoom() {
    // 渲染UI
    const container = document.getElementById('deconstruction-panel');
    if (container) {
        container.innerHTML = UITemplates.deconstructionRoomPanel;
    } else {
        console.error("未能找到拆解室面板容器。");
        return;
    }

    // 绑定事件
    document.getElementById('deconstruct-text-btn')?.addEventListener('click', handleDeconstruct);
}

async function handleDeconstruct() {
    const textToDeconstruct = document.getElementById('deconstruction-input-area').value.trim();
    if (textToDeconstruct.length < 10) {
        showNotification("请输入至少10个字用于分析。", "warning");
        return;
    }
    if (isDeconstructing) {
        showNotification("AI正在分析中，请稍候...", "warning");
        return;
    }

    isDeconstructing = true;
    const btn = document.getElementById('deconstruct-text-btn');
    if(btn) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> 正在深度扫描...`;
    }
    
    const outputGrid = document.getElementById('deconstruction-card-grid');
    if(outputGrid) {
        outputGrid.innerHTML = `<p class="placeholder-text"><i class="fas fa-spinner fa-spin"></i> AI地质勘探专家正在扫描文本...`;
    }

    const allTagsToCheck = Knowledge.MASTER_TAG_LIST_CONFIG.flatMap(matrix => matrix.groups.flatMap(group => group.tags));
    const tagChecklist = JSON.stringify(allTagsToCheck);

    const prompt = `# 角色：你是一位极其严谨、知识渊博的文学地质勘探专家。你的任务不是随机寻宝，而是执行一次系统性的、地毯式的文本扫描。\n\n# 核心指令：强制扫描\n你必须严格遵循以下流程，对用户提供的【待分析原文】进行彻底勘探：\n1.  你将收到一份【强制扫描清单】，其中包含了所有需要寻找的文学“元素”（标签）。\n2.  你必须逐一检查清单上的【每一个】标签。\n3.  对于每一个标签，你都要在【待分析原文】中寻找清晰、有力、与之对应的实例。\n4.  如果找到，就根据该实例生成一张卡牌。找不到则【必须跳过】，严禁为了凑数而杜撰或进行模糊归类。\n5.  **优化原则**：如果一个句子同时体现了多个紧密相关的标签（例如“悬疑”和“紧张”），请将它们合并到一张卡牌中，并同时赋予这两个标签，以避免信息冗余。\n\n## 【待分析原文】:\n---\n${textToDeconstruct}\n---\n\n## 【强制扫描清单】 (你必须逐一检查的“元素周期表”):\n${tagChecklist}\n\n# 【卡牌输出格式铁律】\n你的回答必须是【纯粹的JSON数组】，直接以 \`[\` 开始，以 \`]\` 结束。数组中的每个对象都代表一张卡牌，且必须严格遵循以下【KEY大写】的格式：\n\n\`\`\`json\n{\n  "TYPE": "卡牌类型 (例如: 修辞手法, 感官描写等)",\n  "TITLE": "卡牌标题 (不含类型, 高度概括)",\n  "EXAMPLE": "【原文示例】从原文中摘录的最能体现该卡牌核心的句子。",\n  "ANALYSIS": "【效果分析】用专业的角度，精准分析该示例为什么写得好，它如何体现了你找到的标签，并达到了什么艺术效果。",\n  "TAGS": ["触发生成这张卡牌的核心标签", "其他相关标签1", "其他相关标签2"]\n}\n\`\`\`\n\n请立即开始你的勘探工作。记住，全面、系统、精准是你的唯一准则。`;

    try {
        const result = await callAI(prompt, true);
        const generatedCardsRaw = (typeof result === 'string') ? JSON.parse(result) : result;
        if (!Array.isArray(generatedCardsRaw)) {
            throw new Error("AI未能返回预期的数组格式。");
        }

        const generatedCards = generatedCardsRaw.map(rawCard => ({
            id: Utils.generateUUID(),
            type: rawCard.TYPE,
            title: rawCard.TITLE,
            example: rawCard.EXAMPLE,
            analysis: rawCard.ANALYSIS,
            tags: rawCard.TAGS || []
        }));

        const state = getState();
        state.cardLibrary.unshift(...generatedCards);
        updateState({ cardLibrary: state.cardLibrary });
        saveCardLibrary();

        renderDeconstructionCardGrid(generatedCards);
        showNotification(`扫描完成！共生成 ${generatedCards.length} 张新卡牌。`, "success");

    } catch (error) {
        if(outputGrid) {
            outputGrid.innerHTML = `<p class="placeholder-text" style="color:var(--error-color);">分析失败: ${error.message}。</p>`;
        }
        showNotification(`分析失败: ${error.message}`, 'error');
    } finally {
        isDeconstructing = false;
        if(btn) {
            btn.disabled = false;
            btn.innerHTML = `<i class="fas fa-cogs"></i> 重新开始分析`;
        }
    }
}

function renderDeconstructionCardGrid(cards) {
    const container = document.getElementById('deconstruction-card-grid');
    if (!container) return;

    if (!cards || cards.length === 0) {
        container.innerHTML = `<p class="placeholder-text">未能从文本中分析出任何卡牌。</p>`;
        return;
    }

    if (typeof createV3CardElement === 'function') {
         container.innerHTML = cards.map(card => createV3CardElement(card, true).outerHTML).join('');
    } else {
        console.error("createV3CardElement function is not defined. Card library module might not be loaded yet.");
        container.innerHTML = `<p class="placeholder-text" style="color:var(--error-color);">卡牌渲染函数丢失！</p>`;
    }
}