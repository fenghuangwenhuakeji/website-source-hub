/*
 * 创世纪引擎 V76.0 - 完美形态重生版
 * 模块: 卡牌库 (Card Library)
 * ✨✨✨ (博士重构 - 完美形态) ✨✨✨
 * 1. 【核心】筛选逻辑完全重写，以驱动 V3.0 的“多维创作矩阵”。
 * 2. 【核心】新增 `renderFilterOptions` 函数，它会根据知识库中的 `Knowledge.MASTER_TAG_LIST_CONFIG` 动态生成筛选器UI。
 * 3. 【核心】重写 `filterAndRenderCards` 函数，使其能根据用户在矩阵中点击的多个标签进行“与”逻辑筛选。
 * 4. 【核心】提供了 `createV3CardElement` 这个全局可用的 V3 卡牌渲染函数，供本模块和“拆解室”模块统一调用。
 * 5. 完整复刻了卡牌删除、关键词搜索、一键整理等功能，并适配了全新的UI。
 */

function initializeCardLibrary() {
    // 渲染UI
    const container = document.getElementById('card-library-panel');
    if (container) {
        container.innerHTML = UITemplates.cardLibraryPanel;
    }

    // 绑定事件
    setupCardLibraryListeners();
    
    // 初始化时，渲染筛选器和卡牌
    renderFilterOptions();
    filterAndRenderCards();
}

function setupCardLibraryListeners() {
    document.getElementById('card-search-input')?.addEventListener('input', filterAndRenderCards);
    document.getElementById('sort-cards-btn')?.addEventListener('click', () => {
        const state = getState();
        state.cardLibrary.sort((a, b) => {
            if (a.type < b.type) return -1;
            if (a.type > b.type) return 1;
            if (a.title < b.title) return -1;
            if (a.title > b.title) return 1;
            return 0;
        });
        updateState({ cardLibrary: state.cardLibrary });
        saveCardLibrary();
        filterAndRenderCards();
        showNotification("卡牌已按类型和标题整理完毕。", "success");
    });

    const filterContainer = document.getElementById('unified-filter-container');
    if (filterContainer) {
        filterContainer.addEventListener('click', (event) => {
            if (event.target.classList.contains('tag-item')) {
                event.target.classList.toggle('active');
                filterAndRenderCards();
            }
        });
    }
    
    // 事件委托，处理卡牌删除
    const cardGridContainer = document.getElementById('card-grid-container');
    cardGridContainer?.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.card-delete-btn');
        if (deleteBtn) {
            const cardElement = deleteBtn.closest('.story-card');
            const cardId = cardElement.dataset.cardId;
            handleDeleteCard(cardId);
        }
    });
}

// 渲染“多维创作矩阵”筛选器
function renderFilterOptions() {
    const container = document.getElementById('unified-filter-container');
    if (!container || !Knowledge.MASTER_TAG_LIST_CONFIG) return;

    let html = '';
    Knowledge.MASTER_TAG_LIST_CONFIG.forEach(matrix => {
        html += `<h4 class="filter-main-title">${matrix.mainTitle}</h4>`;
        matrix.groups.forEach(group => {
            html += `<div class="filter-group">
                        <h5 class="filter-group-title">${group.title}</h5>
                        <div class="tags-container">`;
            group.tags.forEach(tag => {
                html += `<span class="tag-item" data-tag="${Utils.escapeHTML(tag)}">${Utils.escapeHTML(tag)}</span>`;
            });
            html += `</div></div>`;
        });
    });
    container.innerHTML = html;
}

// 根据筛选条件渲染卡牌库
function filterAndRenderCards() {
    const container = document.getElementById('card-grid');
    if (!container) return;

    const { cardLibrary } = getState();
    const searchKeyword = document.getElementById('card-search-input')?.value.toLowerCase() || '';
    const activeTagElements = document.querySelectorAll('#unified-filter-container .tag-item.active');
    const activeTags = [...activeTagElements].map(el => el.dataset.tag);

    const filteredCards = cardLibrary.filter(card => {
        const searchContent = `${card.title} ${card.type} ${card.example || ''} ${card.analysis || ''} ${(card.tags || []).join(' ')}`.toLowerCase();
        const matchesKeyword = !searchKeyword || searchContent.includes(searchKeyword);
        
        if (!matchesKeyword) return false;
        if (activeTags.length === 0) return true;

        const cardAllTags = new Set([card.type, ...(card.tags || [])]);
        return activeTags.every(activeTag => cardAllTags.has(activeTag));
    });

    renderCardGrid(container, filteredCards);
}

// 在指定的容器中渲染卡牌网格
function renderCardGrid(container, cards) {
    if (!container) return;
    if (cards.length === 0) {
        container.innerHTML = `<p class="placeholder-text">没有找到符合条件的卡牌。</p>`;
        return;
    }
    container.innerHTML = cards.map(card => createV3CardElement(card, true).outerHTML).join('');
}

// 通用的卡牌删除函数
function handleDeleteCard(cardId) {
    let state = getState();
    const cardToDelete = state.cardLibrary.find(c => c.id === cardId);
    if (!cardToDelete) return;

    if (confirm(`确定要删除卡牌 "${cardToDelete.title}" 吗？`)) {
        state.cardLibrary = state.cardLibrary.filter(c => c.id !== cardId);
        updateState({ cardLibrary: state.cardLibrary });
        saveCardLibrary();

        // 刷新所有可能显示卡牌的视图
        const activePanelId = document.querySelector('.tab-content.active')?.id;
        if (activePanelId === 'card-library-panel') {
            filterAndRenderCards();
        } else if (activePanelId === 'deconstruction-panel') {
            // 在拆解室视图中，直接移除DOM元素
            const cardElement = document.querySelector(`.story-card[data-card-id="${cardId}"]`);
            cardElement?.remove();
        }
        showNotification("卡牌已删除", "info");
    }
}

/**
 * ✨✨✨ 1:1 复刻核心 - 全局可用的V3卡牌渲染函数 ✨✨✨
 * 创建 V3 卡牌 HTML 元素的全新通用函数
 * @param {object} cardData - 卡牌数据对象。
 * @param {boolean} [isActionable=true] - 是否显示删除按钮等操作。
 * @returns {HTMLElement} The card element.
 */
function createV3CardElement(cardData, isActionable = true) {
    const cardElement = document.createElement('div');
    cardElement.className = 'story-card';
    cardElement.dataset.cardId = cardData.id;
    const cardType = cardData.type || '未知';
    cardElement.dataset.cardType = cardType;

    const title = cardData.title || '无标题';
    const example = cardData.example || '';
    const analysis = cardData.analysis || '';
    const tags = cardData.tags || [];

    cardElement.innerHTML = `
        ${isActionable ? `<button class="card-delete-btn" title="删除卡牌"><i class="fas fa-trash-alt"></i></button>` : ''}
        <div class="card-header">
            <h5 class="card-full-title"><span class="card-type">${Utils.escapeHTML(cardType)}卡：</span>${Utils.escapeHTML(title)}</h5>
        </div>
        <div>
            ${example ? `<div class="card-section-title">【原文示例】</div><div class="card-example">${Utils.escapeHTML(example)}</div>` : ''}
            ${analysis ? `<div class="card-section-title">【效果分析】</div><div class="card-analysis">${Utils.escapeHTML(analysis)}</div>` : ''}
        </div>
        ${tags.length > 0 ? `<div class="card-footer">${tags.map(tag => `#${Utils.escapeHTML(tag)}`).join(' ')}</div>` : ''}
    `;
    
    return cardElement;
}