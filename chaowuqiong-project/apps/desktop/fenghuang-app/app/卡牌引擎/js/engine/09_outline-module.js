/*
 * 文件路径: /js/engine/09_outline-module.js
 * 版本: V108.0 - 博士构造版 (宿命与混沌)
 * 描述: 【大纲模块】核心逻辑。一个支持多种叙事理论的可视化故事板。
 */

const OutlineModule = (() => {
    // --- 模块私有变量 ---
    let _canvas, _toolbar, _structureSelect;
    let _plotCards = []; // 故事板上的情节卡
    let _draggedElement = null; // 当前被拖拽的卡片

    // --- 叙事结构模板 ---
    const NARRATIVE_STRUCTURES = {
        'three-act': {
            name: '三幕剧 (Three-Act Structure)',
            columns: ['第一幕: 布局 (Setup)', '第二幕: 对抗 (Confrontation)', '第三幕: 结局 (Resolution)']
        },
        'hero-journey': {
            name: '英雄之旅 (Hero\'s Journey)',
            columns: [
                '1. 平凡世界', '2. 冒险召唤', '3. 拒絕召喚', '4. 遇上導師',
                '5. 跨越界限', '6. 考验、盟友与敌人', '7. 深入洞穴', '8. 最终考验',
                '9. 获得奖励', '10. 回归之路', '11. 复活', '12. 携 elixir 归返'
            ]
        },
        'eight-point': {
            name: '八点序列 (Eight-Point Arc)',
            columns: [
                '1. 静态平衡', '2. 触发事件', '3. 任务', '4. 关键转折',
                '5. 上升行动', '6. 高潮', '7. 下降行动', '8. 新的平衡'
            ]
        },
        'free-form': {
            name: '自由创作 (Free Form)',
            columns: ['故事板']
        }
    };

    // --- 模块初始化 ---
    function init() {
        console.log("引擎模块 [大纲模块] 开始唤醒...");

        // 缓存DOM元素
        _canvas = document.getElementById('outline-canvas');
        _toolbar = document.getElementById('outline-toolbar');
        _structureSelect = document.getElementById('narrative-structure-select');

        if (!_canvas || !_toolbar || !_structureSelect) {
            console.error("[大纲模块] 初始化失败: 未找到核心DOM元素。");
            return;
        }

        // 绑定事件
        _structureSelect.addEventListener('change', _handleStructureChange);

        // 初始化时渲染默认结构
        _renderStructure(NARRATIVE_STRUCTURES['three-act']);
        _addDragAndDropListeners();

        console.log("引擎模块 [大纲模块] 已成功唤醒，准备编织命运。");
    }

    // --- 核心渲染函数 ---
    function render() {
        if (!_canvas) return;
        // 注意：大纲模块的渲染是基于结构选择的，主要由 _renderStructure 控制
        // 这里可以保留为空，或者用于未来可能的刷新逻辑
    }

    // --- 结构与卡片渲染 ---

    function _handleStructureChange() {
        const selectedStructureKey = _structureSelect.value;
        const structure = NARRATIVE_STRUCTURES[selectedStructureKey];
        if (structure) {
            _renderStructure(structure);
        }
    }

    // 渲染故事板的列
    function _renderStructure(structure) {
        _canvas.innerHTML = ''; // 清空画布
        _canvas.className = 'outline-canvas-grid';
        // 动态设置CSS Grid的列数
        _canvas.style.gridTemplateColumns = `repeat(${structure.columns.length}, 1fr)`;

        structure.columns.forEach(columnName => {
            const column = document.createElement('div');
            column.className = 'storyboard-column';
            column.innerHTML = `<h3>${columnName}</h3><div class="card-drop-zone"></div>`;
            _canvas.appendChild(column);
        });
        showNotification(`叙事结构已切换为: ${structure.name}`, 'info');
    }
    
    // 从卡牌库拖拽卡片到故事板
    function _addDragAndDropListeners() {
        // 监听卡牌库里卡片的拖拽开始事件
        document.getElementById('card-library-canvas').addEventListener('dragstart', (event) => {
            const card = event.target.closest('.card');
            // 只允许情节卡被拖拽
            if (card && card.dataset.cardType === '情节卡') {
                const cardId = card.dataset.internalId; // 我们需要一个内部ID来查找数据
                event.dataTransfer.setData('text/plain', cardId);
                event.dataTransfer.effectAllowed = 'move';
                _draggedElement = card;
            } else {
                event.preventDefault(); // 阻止其他类型的卡片拖拽
            }
        });

        // 监听故事板区域的拖拽行为
        _canvas.addEventListener('dragover', (event) => {
            event.preventDefault(); // 必须阻止默认行为才能触发drop
            const dropZone = event.target.closest('.card-drop-zone');
            if (dropZone) {
                dropZone.classList.add('drag-over');
                event.dataTransfer.dropEffect = 'move';
            }
        });
        
        _canvas.addEventListener('dragleave', (event) => {
            const dropZone = event.target.closest('.card-drop-zone');
            if (dropZone) {
                dropZone.classList.remove('drag-over');
            }
        });

        _canvas.addEventListener('drop', (event) => {
            event.preventDefault();
            const dropZone = event.target.closest('.card-drop-zone');
            if (!dropZone) return;
            
            dropZone.classList.remove('drag-over');
            const cardId = event.dataTransfer.getData('text/plain');
            const cardData = CardManager.getAllCards().find(c => c.id === cardId);

            if (cardData) {
                // 创建一个大纲模块专用的卡片元素
                const outlineCard = _createOutlineCard(cardData);
                dropZone.appendChild(outlineCard);
                showNotification(`情节卡 "${cardData.data.name}" 已添加到大纲。`, 'success');
            }
        });
    }

    // 创建放在故事板上的卡片元素
    function _createOutlineCard(cardData) {
        const cardEl = document.createElement('div');
        cardEl.className = 'outline-card';
        cardEl.dataset.cardId = cardData.id;
        cardEl.draggable = true; // 让它可以在故事板内部拖拽

        cardEl.innerHTML = `
            <h5><i class="fa-solid fa-scroll"></i> ${cardData.data.name}</h5>
            <p>${cardData.data.description.substring(0, 50)}...</p>
            <div class="outline-card-toolbar">
                <button title="设为关键节点 (宿命)" class="node-btn" data-type="key"><i class="fa-solid fa-anchor"></i></button>
                <button title="设为自由节点 (意志)" class="node-btn active" data-type="free"><i class="fa-solid fa-feather"></i></button>
                <button title="设为混沌节点 (概率风暴)" class="node-btn" data-type="chaos"><i class="fa-solid fa-dice-d20"></i></button>
            </div>
        `;

        // 添加工具栏按钮的点击事件
        cardEl.querySelector('.outline-card-toolbar').addEventListener('click', (e) => {
            const button = e.target.closest('.node-btn');
            if (!button) return;

            // 移除所有按钮的 active 状态
            cardEl.querySelectorAll('.node-btn').forEach(btn => btn.classList.remove('active'));
            // 给当前点击的按钮添加 active 状态
            button.classList.add('active');
            
            // 更新卡片的节点类型样式
            const nodeType = button.dataset.type;
            cardEl.dataset.nodeType = nodeType;
            showNotification(`节点已设为: ${nodeType.toUpperCase()}`, 'info');
        });
        
        // 默认设置为'自由节点'
        cardEl.dataset.nodeType = 'free';

        return cardEl;
    }


    // --- 模块接口 ---
    return {
        init,
        render
    };
})();