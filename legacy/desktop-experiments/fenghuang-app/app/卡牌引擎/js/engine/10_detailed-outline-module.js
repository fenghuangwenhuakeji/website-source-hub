/*
 * 文件路径: /js/engine/10_detailed-outline-module.js
 * 版本: V110.0 - 博士改造版 (连接作家圣殿)
 * 描述: 【细纲模块】核心逻辑。已添加前往【正文模块】的接口。
 */

const DetailedOutlineModule = (() => {
    // --- 模块私有变量 ---
    let _canvas;
    let _plotCards = []; // 所有情节卡
    let _activePlotCardId = null; // 当前正在查看的父情节卡ID

    // --- 编辑器相关变量 ---
    let _modal, _form, _saveBtn, _deleteBtn, _closeBtn, _titleEl;
    let _sceneIdInput, _sceneNameInput, _sceneTimeInput, _sceneLocationInput;
    let _sceneCharsInput, _sceneEventInput, _sceneDialogueInput, _scenePurposeInput;


    // --- 模块初始化 ---
    function init() {
        console.log("引擎模块 [细纲模块] 开始唤醒...");

        _canvas = document.getElementById('detailed-outline-canvas');
        if (!_canvas) {
            console.error("[细纲模块] 初始化失败: 未找到核心DOM元素 'detailed-outline-canvas'。");
            return;
        }
        
        _initEditorModal();

        console.log("引擎模块 [细纲模块] 已成功唤醒，准备记录历史。");
    }

    // --- 核心渲染函数 ---
    function render() {
        if (!_canvas) return;
        
        _plotCards = CardManager.getAllCards().filter(card => card.type === 'plot');
        _canvas.innerHTML = '';

        if (_plotCards.length === 0) {
            _canvas.innerHTML = '<p class="empty-message">细纲模块为空。请先在【拆解室】生成情节卡，或在【卡牌库】手动创建。</p>';
            return;
        }

        const listContainer = document.createElement('div');
        listContainer.className = 'plot-card-list';
        
        _plotCards.forEach(card => {
            const listItem = _createPlotCardListItem(card);
            listContainer.appendChild(listItem);
        });

        _canvas.appendChild(listContainer);

        // 默认选中并渲染第一个情节卡（或之前选中的卡）
        const targetPlotId = _activePlotCardId && _plotCards.some(c => c.id === _activePlotCardId) 
            ? _activePlotCardId 
            : _plotCards[0]?.id;

        if (targetPlotId) {
            _renderScenesForPlot(targetPlotId);
        }
    }
    
    // 创建左侧的情节卡列表项
    function _createPlotCardListItem(plotCard) {
        const item = document.createElement('div');
        item.className = 'plot-list-item';
        item.dataset.cardId = plotCard.id;
        
        item.innerHTML = `
            <h5><i class="fa-solid fa-scroll"></i> ${plotCard.data.name}</h5>
            <p>${(plotCard.data.scenes || []).length}个场景</p>
        `;

        item.addEventListener('click', () => {
            _renderScenesForPlot(plotCard.id);
        });

        return item;
    }

    // 根据情节卡ID，渲染右侧的场景卡片区域
    function _renderScenesForPlot(plotCardId) {
        _activePlotCardId = plotCardId;

        // 更新左侧列表的选中状态
        document.querySelectorAll('.plot-list-item').forEach(item => {
            item.classList.toggle('active', item.dataset.cardId === plotCardId);
        });

        let sceneContainer = _canvas.querySelector('.scene-card-container');
        if (!sceneContainer) {
            sceneContainer = document.createElement('div');
            sceneContainer.className = 'scene-card-container';
            _canvas.appendChild(sceneContainer);
        }
        
        sceneContainer.innerHTML = ''; // 清空

        const plotCard = _plotCards.find(c => c.id === plotCardId);
        if (!plotCard) return;

        // 如果该情节卡还没有场景数据，则初始化
        if (!plotCard.data.scenes) {
            plotCard.data.scenes = [];
        }

        const scenes = plotCard.data.scenes;
        
        // 渲染 "添加新场景" 的按钮
        const addSceneBtn = document.createElement('div');
        addSceneBtn.className = 'scene-card add-new';
        addSceneBtn.innerHTML = `<i class="fa-solid fa-plus"></i><p>创建新场景</p>`;
        addSceneBtn.addEventListener('click', () => _openEditor(plotCardId));
        sceneContainer.appendChild(addSceneBtn);

        // 渲染已有的场景卡
        scenes.forEach(scene => {
            const sceneCard = _createSceneCardElement(scene, plotCardId);
            sceneContainer.appendChild(sceneCard);
        });
    }

    // 创建单个场景卡片元素
    function _createSceneCardElement(sceneData, plotCardId) {
        const card = document.createElement('div');
        card.className = 'scene-card';
        
        card.innerHTML = `
            <h4>${sceneData.name || '未命名场景'}</h4>
            <div class="scene-card-details">
                <span><i class="fa-solid fa-clock"></i> ${sceneData.time || '时间未定'}</span>
                <span><i class="fa-solid fa-map-marker-alt"></i> ${sceneData.location || '地点未定'}</span>
            </div>
            <p>${(sceneData.event || '事件待补充...').substring(0, 80)}</p>
            <div class="scene-card-actions">
                <button class="glow-button scene-action-btn edit-btn"><i class="fa-solid fa-edit"></i> 编辑</button>
                <button class="glow-button scene-action-btn write-btn"><i class="fa-solid fa-pen-to-square"></i> 撰写</button>
            </div>
        `;

        card.querySelector('.edit-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            _openEditor(plotCardId, sceneData.id);
        });

        card.querySelector('.write-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            ProseModule.loadScene(plotCardId, sceneData.id);
            activateTab('prose-module');
        });
        
        return card;
    }

    // --- 编辑器模态框逻辑 ---
    function _initEditorModal() {
        _modal = document.getElementById('scene-editor-modal');
        _form = document.getElementById('scene-editor-form');
        _saveBtn = document.getElementById('scene-editor-save-btn');
        _deleteBtn = document.getElementById('scene-editor-delete-btn');
        _closeBtn = _modal.querySelector('.modal-close-btn');
        _titleEl = document.getElementById('scene-editor-title');

        // 缓存表单输入框
        _sceneIdInput = document.getElementById('modal-scene-id');
        _sceneNameInput = document.getElementById('scene-name');
        _sceneTimeInput = document.getElementById('scene-time');
        _sceneLocationInput = document.getElementById('scene-location');
        _sceneCharsInput = document.getElementById('scene-characters');
        _sceneEventInput = document.getElementById('scene-event');
        _sceneDialogueInput = document.getElementById('scene-dialogue');
        _scenePurposeInput = document.getElementById('scene-purpose');

        // 绑定事件
        _closeBtn.addEventListener('click', () => _modal.classList.add('hidden'));
        _modal.addEventListener('click', (e) => { if (e.target === _modal) _modal.classList.add('hidden'); });
        _saveBtn.addEventListener('click', _handleSave);
        _deleteBtn.addEventListener('click', _handleDelete);
    }

    function _openEditor(plotCardId, sceneId = null) {
        _form.reset();
        _form.dataset.plotCardId = plotCardId;
        _form.dataset.sceneId = sceneId || '';
        
        const plotCard = CardManager.getAllCards().find(c => c.id === plotCardId);
        if (!plotCard) return;

        if (sceneId) {
            // 确保 scenes 数组存在
            if (!plotCard.data.scenes) plotCard.data.scenes = [];
            const scene = plotCard.data.scenes.find(s => s.id === sceneId);
            if (scene) {
                _titleEl.innerHTML = `<i class="fa-solid fa-feather-pointed"></i> 编辑场景`;
                _sceneIdInput.value = scene.id;
                _sceneNameInput.value = scene.name || '';
                _sceneTimeInput.value = scene.time || '';
                _sceneLocationInput.value = scene.location || '';
                _sceneCharsInput.value = scene.characters || '';
                _sceneEventInput.value = scene.event || '';
                _sceneDialogueInput.value = scene.dialogue || '';
                _scenePurposeInput.value = scene.purpose || '';
                _deleteBtn.style.display = 'block';
            }
        } else {
            _titleEl.innerHTML = `<i class="fa-solid fa-feather-pointed"></i> 创建新场景`;
            _sceneIdInput.value = '';
            _deleteBtn.style.display = 'none';
        }
        
        _modal.classList.remove('hidden');
        _sceneNameInput.focus();
    }

    function _handleSave() {
        const plotCardId = _form.dataset.plotCardId;
        const sceneId = _form.dataset.sceneId;

        const plotCard = CardManager.getAllCards().find(c => c.id === plotCardId);
        if (!plotCard) return;

        // 确保 scenes 数组存在
        if (!plotCard.data.scenes) plotCard.data.scenes = [];

        const sceneData = {
            id: sceneId || `scene-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: _sceneNameInput.value.trim() || '未命名场景',
            time: _sceneTimeInput.value.trim(),
            location: _sceneLocationInput.value.trim(),
            characters: _sceneCharsInput.value.trim(),
            event: _sceneEventInput.value.trim(),
            dialogue: _sceneDialogueInput.value.trim(),
            purpose: _scenePurposeInput.value.trim(),
            prose: '' // 初始化正文内容
        };

        if (sceneId) {
            // 更新现有场景
            const sceneIndex = plotCard.data.scenes.findIndex(s => s.id === sceneId);
            if (sceneIndex > -1) {
                // 保留旧的正文内容
                sceneData.prose = plotCard.data.scenes[sceneIndex].prose || '';
                plotCard.data.scenes[sceneIndex] = sceneData;
            } else {
                 plotCard.data.scenes.push(sceneData); 
            }
        } else {
            // 创建新场景
            plotCard.data.scenes.push(sceneData);
        }
        
        _modal.classList.add('hidden');
        CardManager.notifyUpdate(); 
        _renderScenesForPlot(plotCardId); // 重新渲染当前情节卡的场景列表
        showNotification(`场景 "${sceneData.name}" 已保存！`, 'success');
    }

    function _handleDelete() {
        const plotCardId = _form.dataset.plotCardId;
        const sceneId = _form.dataset.sceneId;

        if (plotCardId && sceneId && confirm('您确定要永久删除这个场景吗？此操作无法撤销。')) {
            const plotCard = CardManager.getAllCards().find(c => c.id === plotCardId);
            if (plotCard && plotCard.data.scenes) {
                const sceneIndex = plotCard.data.scenes.findIndex(s => s.id === sceneId);
                if (sceneIndex > -1) {
                    plotCard.data.scenes.splice(sceneIndex, 1);
                    _modal.classList.add('hidden');
                    CardManager.notifyUpdate();
                    _renderScenesForPlot(plotCardId);
                    showNotification('场景已删除。', 'info');
                }
            }
        }
    }

    // --- 模块接口 ---
    return {
        init,
        render
    };
})();