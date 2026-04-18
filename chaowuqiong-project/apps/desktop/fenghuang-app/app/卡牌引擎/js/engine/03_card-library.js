/*
 * 文件路径: /js/engine/03_card-library.js
 * 版本: V106 - 博士升级版 (派系认知)
 * 描述: 【卡牌库】模块的核心逻辑。已升级，能够识别和渲染包括“派系卡”在内的所有已知卡牌。
 */

const CardLibrary = (() => {
    // --- 模块私有变量 ---
    let _canvas, _filterButtons;
    let _activeFilter = 'all';

    function init() {
        console.log("引擎模块 [卡牌库] 开始唤醒...");
        _canvas = document.getElementById('card-library-canvas');
        _filterButtons = document.querySelectorAll('.filter-btn');

        if (!_canvas || _filterButtons.length === 0) {
            console.error("[卡牌库] 初始化失败: 未找到必要的DOM元素。");
            return;
        }

        _filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                _activeFilter = btn.dataset.filter;
                _filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                render(); // 应用筛选并重新渲染
            });
        });

        console.log("引擎模块 [卡牌库] 已成功唤醒，准备展示所有卡牌。");
    }

    // --- 核心渲染函数 ---
    function render() {
        if (!_canvas) return;

        const allCards = CardManager.getAllCards();
        _canvas.innerHTML = '';

        const filteredCards = allCards.filter(card => 
            _activeFilter === 'all' || card.type === _activeFilter
        );

        if (filteredCards.length === 0) {
            _canvas.innerHTML = `<p class="empty-message">未找到符合条件的卡牌。</p>`;
            return;
        }

        filteredCards.forEach(cardObject => {
            const cardElement = _createCardElement(cardObject);
            _canvas.appendChild(cardElement);
        });
    }

    // --- 卡牌类型定义 (集中管理) ---
    const CARD_DEFINITIONS = {
        'inspiration': { name: '灵感卡', icon: 'fa-wand-magic-sparkles' },
        'character': { name: '角色卡', icon: 'fa-user' },
        'plot': { name: '情节卡', icon: 'fa-scroll' },
        'location': { name: '地点卡', icon: 'fa-map-marker-alt' },
        'faction': { name: '派系卡', icon: 'fa-sitemap' },
        'clue': { name: '线索卡', icon: 'fa-key' },
        'error': { name: '错误报告', icon: 'fa-exclamation-triangle' },
        'default': { name: '未知卡牌', icon: 'fa-question-circle' }
    };

    // --- 辅助函数：根据卡牌对象创建HTML元素 ---
    function _createCardElement(cardObject) {
        const definition = CARD_DEFINITIONS[cardObject.type] || CARD_DEFINITIONS['default'];
        const card = document.createElement('div');
        card.className = 'card';
        if (cardObject.type === 'error') card.classList.add('error-card');
        card.setAttribute('data-card-type', definition.name);

        const data = cardObject.data;
        let title, description, tagsHTML = '';
        
        // --- 博士新增：兼容角色卡和派系卡的复杂数据结构 ---
        if (cardObject.type === 'character') {
            const timelineData = data.timeline ? data.timeline[0] : data;
            title = timelineData.name || '无名氏';
            description = timelineData.summary || '无简介';
            tagsHTML = _formatTags(timelineData.tags);
        } else {
            title = data.name || data.title || '无标题';
            description = data.description || data.summary || data.errorMessage || '无描述';
            tagsHTML = _formatTags(data.tags || data.culture);
        }

        card.innerHTML = `
            <h3><i class="fa-solid ${definition.icon}"></i> ${title}</h3>
            <p>${description}</p>
            ${tagsHTML}
        `;
        return card;
    }

    function _formatTags(tagsData) {
        let tagsArray = [];
        if (Array.isArray(tagsData)) {
            tagsArray = tagsData;
        } else if (typeof tagsData === 'string') {
            tagsArray = tagsData.split(',').map(t => t.trim()).filter(t => t);
        }
        
        if (tagsArray.length > 0) {
            return `<div class="card-tags">${tagsArray.map(tag => `<span class="tag">#${tag}</span>`).join('')}</div>`;
        }
        return '';
    }
    
    // --- 模块接口 ---
    return {
        init,
        render
    };
})();