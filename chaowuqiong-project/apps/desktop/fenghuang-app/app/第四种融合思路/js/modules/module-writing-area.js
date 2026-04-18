/*
 * 创世纪引擎 V76.2 - 最终稳定版
 * 模块: 写作区 (Writing Area)
 * ✨✨✨ (博士重构 - 最终修正) ✨✨✨
 * 1. 【核心修复】将全局状态锁变量从 `isGenerating` 重命名为 `isPolishing`，解决了变量重名导致的致命语法错误。
 * ✨✨✨ (博士重构 - 梦想实现 V3) ✨✨✨
 * 2. 【核心修复】为避免全局变量冲突，将模块专属状态锁从 `isPolishing` 重命名为 `isAreaPolishing`。
 */

// 模块级状态，用于存储当前写作区的润色配置
let polishingConfig = {
    selectedCardIds: [],
    typeLimits: {}
};

// 模块专属的状态锁
let isAreaPolishing = false;

function initializeWritingArea() {
    const container = document.getElementById('writing-area-panel');
    if (container) {
        container.innerHTML = UITemplates.writingAreaPanel;
    } else {
        console.error("未能找到写作区面板容器。");
        return;
    }

    document.getElementById('select-polish-cards-btn')?.addEventListener('click', openCardSelectionModal);
    document.getElementById('polish-text-btn')?.addEventListener('click', handlePolish);
    document.getElementById('copy-polished-btn')?.addEventListener('click', handleCopyPolished);
    
    initCardSelectionModal();
}

function initCardSelectionModal() {
    const modal = document.getElementById('card-selection-modal');
    if (!modal) return;
    const closeBtn = modal.querySelector('.close-btn');
    const confirmBtn = document.getElementById('confirm-card-selection-btn');
    const hide = () => modal.classList.add('hidden');

    closeBtn?.addEventListener('click', hide);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) hide();
    });
    
    confirmBtn?.addEventListener('click', () => {
        const selectedIds = [];
        modal.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
            selectedIds.push(checkbox.value);
        });
        polishingConfig.selectedCardIds = selectedIds;
        updatePolishingPalette();
        hide();
    });
}

function openCardSelectionModal() {
    const modal = document.getElementById('card-selection-modal');
    const listContainer = document.getElementById('card-selection-list');
    if (!modal || !listContainer) return;
    
    const { cardLibrary } = getState();

    if (cardLibrary.length === 0) {
        listContainer.innerHTML = `<p class="placeholder-text">您的卡牌库是空的，请先去“拆解室”分析文本以生成卡牌。</p>`;
    } else {
        listContainer.innerHTML = cardLibrary.map(card => `
            <li class="card-selection-item">
                <input type="checkbox" id="card-select-${card.id}" value="${card.id}" ${polishingConfig.selectedCardIds.includes(card.id) ? 'checked' : ''}>
                <label for="card-select-${card.id}">
                    <span class="item-title">${Utils.escapeHTML(card.title)}</span>
                    <span class="item-type">${Utils.escapeHTML(card.type)}</span>
                </label>
            </li>`).join('');
    }
    modal.classList.remove('hidden');
}

function updatePolishingPalette() {
    const paletteBody = document.getElementById('palette-body');
    if(!paletteBody) return;

    const { cardLibrary } = getState();
    const selectedCards = polishingConfig.selectedCardIds.map(id => cardLibrary.find(c => c.id === id)).filter(Boolean);

    if (selectedCards.length === 0) {
        paletteBody.innerHTML = `<p class="placeholder-text">请先选择卡牌...</p>`;
        return;
    }

    const cardsByType = selectedCards.reduce((acc, card) => {
        if (!acc[card.type]) acc[card.type] = [];
        acc[card.type].push(card);
        return acc;
    }, {});

    let html = '<div id="palette-limits-container">';
    Object.keys(cardsByType).forEach(type => {
        const currentLimit = polishingConfig.typeLimits[type] || 1;
        html += `<div class="palette-limit-group">
                    <label for="limit-${type}">${Utils.escapeHTML(type)}</label>
                    <input type="number" id="limit-${type}" data-type="${Utils.escapeHTML(type)}" value="${currentLimit}" min="0">
                 </div>`;
    });
    html += '</div>';
    paletteBody.innerHTML = html;

    // 重新绑定事件
    paletteBody.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('change', (e) => {
            polishingConfig.typeLimits[e.target.dataset.type] = parseInt(e.target.value, 10);
        });
    });
}

function handleCopyPolished() {
    const outputArea = document.getElementById('writing-output-area');
    if (outputArea) {
        navigator.clipboard.writeText(outputArea.textContent)
            .then(() => showNotification("已复制到剪贴板！", "success"))
            .catch(err => showNotification("复制失败: " + err, "error"));
    }
}

async function handlePolish() {
    const textToPolish = document.getElementById('writing-input-area').value.trim();
    if (textToPolish.length < 10) {
        showNotification("请输入至少10个字的原文草稿。", "warning");
        return;
    }

    const { cardLibrary } = getState();
    const selectedCards = polishingConfig.selectedCardIds.map(id => cardLibrary.find(c => c.id === id)).filter(Boolean);
    if (selectedCards.length === 0) {
        showNotification("请点击“选择润色卡牌”并至少选择一张卡牌！", "error");
        return;
    }
    if (isAreaPolishing) {
        showNotification("AI正在润色中，请稍候...", "warning");
        return;
    }

    updatePolishingPalette(); // 更新一下限制数据
    const typeLimits = polishingConfig.typeLimits;

    isAreaPolishing = true;
    const btn = document.getElementById('polish-text-btn');
    if (btn) {
        btn.disabled = true;
        const icon = btn.querySelector('i');
        if (icon) {
            icon.classList.remove('fa-rocket');
            icon.classList.add('fa-spinner', 'fa-spin');
        }
    }
    
    const outputArea = document.getElementById('writing-output-area');
    const controlsContainer = document.getElementById('polished-output-controls-container');
    if(controlsContainer) controlsContainer.classList.add('hidden');
    if(outputArea) outputArea.innerHTML = `<p class="placeholder-text"><i class="fas fa-spinner fa-spin"></i> AI正在遵循您的指令进行精细润色...`;

    const knowledgeBase = JSON.stringify(selectedCards);
    const limitsJson = JSON.stringify(typeLimits);
    
    const prompt = `# 身份: 你是一位顶级文学编辑，拥有大师级的审美和对文字的深刻洞察力。你的工作不是重写，而是“画龙点睛”。\n\n# 核心指令: \n你的任务是根据用户提供的【待润色原文】、【指定的创作卡牌】和【严格的使用次数配额】，进行一次“外科手术式”的精准润色。你必须严格遵守以下三大忠诚协议。\n\n---\n## 三大忠诚协议 (绝对不可违背的铁律)\n\n### 协议一：风格继承 (Style Inheritance)\n在动手修改任何一个字之前，你必须先完整阅读并分析【待润色原文】的语言风格、叙事节奏和情绪基调。你的所有润色都必须【继承并延续】这种原生风格。如果原文是冷静克制的，你的润色也必须是冷静克制的，绝不能突然变得华丽奔放。你的修改应该像水滴融入大海，无缝衔接，而不是像油滴一样浮在表面。\n\n### 协议二：意图保留 (Intent Preservation)\n在任何情况下，润色都【不能损害或改变】原文句子的核心信息、逻辑和作者意图。绝不允许出现“内容掉没了”的情况。如果某张卡牌的应用会与原文意图产生冲突，你【必须放弃】使用该卡牌，或者寻找一种完全不损害原意图的、更巧妙的融合方式。作者的意图是神圣不可侵犯的。\n\n### 协议三：最小化干预 (Minimal Intervention)\n你的目标【不是用满所有配额】，而是【用最少的、最必要的修改，达到最佳的润色效果】。每一次修改都必须是有意义的，是能够显著提升文笔质感、描写精度或情感张力的。如果没有合适的润色机会，【宁可保持原文，也不要进行任何平庸或破坏性的修改】。珍惜每一次修改的机会，让它变得有价值。\n---\n\n# 任务资源\n\n## 1. 【指定的创作卡牌】 (你唯一可以使用的知识库):\n${knowledgeBase}\n\n## 2. 【严格的使用次数配额】 (用尽即止，绝不超额):\n${limitsJson}\n\n## 3. 【待润色原文】 (等待被精雕细琢的璞玉):\n${textToPolish}\n\n# 【输出格式铁律】:\n你必须返回一个JSON数组，数组的每个元素都是一个对象，代表一个文本片段。每个对象必须包含 "type" 和 "text" 两个字段。\n- 如果文本片段是未被修改的原文，则 type 为 "original"。\n- 如果文本片段是根据卡牌修改的，则 type 必须是卡牌的类型 (例如 "核心词汇", "句式卡", "世界观", "场景"等)，并且必须额外包含一个 "cardTitle" 字段，内容是所引用的卡牌的标题。\n\n输出示例:\n\`\`\`json\n[\n  { "type": "original", "text": "他走进那个房间。光线很暗。" },\n  { "type": "场景", "text": "他踏入了那间被誉为‘寂静王座’的密室，", "cardTitle": "传承洞穴/藏经阁" },\n  { "type": "感官描写", "text": "空气中弥漫着古老羊皮卷和尘埃混合的特殊气味，唯一的光源来自墙角一盏摇曳的油灯，", "cardTitle": "感官卡：视觉与嗅觉" }\n]\n\`\`\`\n\n请立即开始你的工作，记住，你是一位优雅的编辑，不是一位粗暴的改写者。`;

    try {
        const result = await callAI(prompt, true);
        let polishedResult = (typeof result === 'string') ? JSON.parse(result) : result;

        if (!Array.isArray(polishedResult)) throw new Error("AI未能返回预期的数组格式。");
        
        renderPolishedOutput(outputArea, polishedResult);
        if(controlsContainer) controlsContainer.classList.remove('hidden');

    } catch (error) {
        if(outputArea) outputArea.innerHTML = `<p class="placeholder-text" style="color:var(--error-color);">润色失败: ${error.message}。</p>`;
        showNotification(`润色失败: ${error.message}`, 'error');
    } finally {
        isAreaPolishing = false;
        if(btn) {
            btn.disabled = false;
            const icon = btn.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-spinner', 'fa-spin');
                icon.classList.add('fa-rocket');
            }
        }
    }
}

function renderPolishedOutput(outputArea, polishedData) {
    if (!outputArea) return;
    outputArea.innerHTML = '';
    if (Array.isArray(polishedData)) {
        polishedData.forEach(segment => {
            const span = document.createElement('span');
            span.textContent = segment.text;
            if (segment.type !== 'original') {
                const typeClassName = segment.type.replace(/[^a-zA-Z0-9]/g, '-');
                span.className = `highlight highlight-${typeClassName}`;
                span.title = `源自卡牌: ${segment.cardTitle || '未知'}\n类型: ${segment.type}`;
            }
            outputArea.appendChild(span);
        });
    } else {
        outputArea.textContent = String(polishedData);
    }
}