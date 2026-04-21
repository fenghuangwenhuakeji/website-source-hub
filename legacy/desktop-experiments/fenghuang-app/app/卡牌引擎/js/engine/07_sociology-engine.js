/*
 * 文件路径: /js/engine/07_sociology-engine.js
 * 版本: V106.0 - 博士构造版 (文明的动力学)
 * 描述: 【派系与社会学引擎】核心逻辑。负责派系卡的渲染、创建、编辑与数据管理。
 */

const SociologyEngine = (() => {
    // --- 模块私有变量 ---
    let _canvas;
    let _factionCards = [];

    // --- 编辑器相关变量 ---
    let _modal, _form, _saveBtn, _deleteBtn, _closeBtn, _titleEl;
    let _idInput, _nameInput, _typeInput, _govInput, _techInput, _cultureInput, _descInput;

    // --- 模块初始化 ---
    function init() {
        console.log("引擎模块 [派系与社会学] 开始唤醒...");
        _canvas = document.getElementById('sociology-canvas');
        if (!_canvas) {
            console.error("[派系引擎] 初始化失败: 未找到 'sociology-canvas' 元素。");
            return;
        }
        document.getElementById('faction-add-new-btn')?.addEventListener('click', () => _openEditor());
        _initEditorModal();
        console.log("引擎模块 [派系与社会学] 已成功唤醒，准备构建文明。");
    }

    // --- 核心渲染函数 ---
    function render() {
        if (!_canvas) return;
        
        _factionCards = CardManager.getAllCards().filter(card => card.type === 'faction');
        _canvas.innerHTML = '';

        if (_factionCards.length === 0) {
            _canvas.innerHTML = '<p class="empty-message">当前世界不存在任何派系。请使用【拆解室】或手动创建您的第一个文明。</p>';
            return;
        }

        _factionCards.forEach(card => {
            const cardEl = _createFactionCardElement(card);
            _canvas.appendChild(cardEl);
        });
    }

    // --- 创建派系卡片HTML元素 ---
    function _createFactionCardElement(cardObject) {
        const cardEl = document.createElement('div');
        cardEl.className = 'faction-card';
        cardEl.dataset.cardId = cardObject.id;
        cardEl.title = `点击编辑: ${cardObject.data.name}`;

        const data = cardObject.data;
        const cultures = data.culture ? data.culture.split(',').map(tag => `<span class="tag">#${tag.trim()}</span>`).join('') : '无';

        cardEl.innerHTML = `
            <div class="faction-card-header">
                <h3><i class="fa-solid fa-flag"></i> ${data.name || '未命名派系'}</h3>
                <span class="faction-card-type">${data.type || '未知'}</span>
            </div>
            <div class="faction-card-body">
                <p>${data.description || '这个派系充满了神秘，尚无具体描述...'}</p>
                <div class="faction-stat">
                    <i class="fa-solid fa-landmark" title="政体"></i>
                    <span>${data.government || '未设定'}</span>
                </div>
                <div class="faction-stat">
                    <i class="fa-solid fa-cogs" title="科技水平"></i>
                    <span>${data.techLevel || '未设定'}</span>
                </div>
            </div>
            <div class="faction-card-footer">
                ${cultures}
            </div>
        `;

        cardEl.addEventListener('click', () => _openEditor(cardObject.id));
        return cardEl;
    }

    // --- 编辑器模态框逻辑 ---
    function _initEditorModal() {
        _modal = document.getElementById('faction-editor-modal');
        _form = document.getElementById('faction-editor-form');
        _saveBtn = document.getElementById('faction-editor-save-btn');
        _deleteBtn = document.getElementById('faction-editor-delete-btn');
        _closeBtn = _modal.querySelector('.modal-close-btn');
        _titleEl = document.getElementById('faction-editor-title');

        // 缓存表单输入框
        _idInput = document.getElementById('modal-faction-id');
        _nameInput = document.getElementById('faction-name');
        _typeInput = document.getElementById('faction-type');
        _govInput = document.getElementById('faction-government');
        _techInput = document.getElementById('faction-tech-level');
        _cultureInput = document.getElementById('faction-culture');
        _descInput = document.getElementById('faction-description');

        // 绑定事件
        _closeBtn.addEventListener('click', () => _modal.classList.add('hidden'));
        _modal.addEventListener('click', (e) => { if (e.target === _modal) _modal.classList.add('hidden'); });
        _saveBtn.addEventListener('click', _handleSave);
        _deleteBtn.addEventListener('click', _handleDelete);
    }

    function _openEditor(cardId = null) {
        _form.reset();
        _form.dataset.cardId = cardId || '';
        
        if (cardId) {
            const card = _factionCards.find(c => c.id === cardId);
            if (card) {
                const data = card.data;
                _titleEl.innerHTML = `<i class="fa-solid fa-flag-checkered"></i> 编辑派系: ${data.name}`;
                _idInput.value = card.id;
                _nameInput.value = data.name || '';
                _typeInput.value = data.type || '国家';
                _govInput.value = data.government || '';
                _techInput.value = data.techLevel || '';
                _cultureInput.value = data.culture || '';
                _descInput.value = data.description || '';
                _deleteBtn.style.display = 'block';
            }
        } else {
            _titleEl.innerHTML = `<i class="fa-solid fa-flag"></i> 创建新派系`;
            _idInput.value = '';
             _deleteBtn.style.display = 'none';
        }
        
        _modal.classList.remove('hidden');
    }

    function _handleSave() {
        const cardId = _idInput.value;
        const factionData = {
            name: _nameInput.value.trim() || '未命名派系',
            type: _typeInput.value,
            government: _govInput.value.trim(),
            techLevel: _techInput.value.trim(),
            culture: _cultureInput.value.trim(),
            description: _descInput.value.trim()
        };

        if (cardId) {
            const card = _factionCards.find(c => c.id === cardId);
            if (card) {
                // 更新现有卡牌
                card.data = factionData;
            }
        } else {
            // 创建新卡牌
            CardManager.addCard('faction', factionData);
        }

        _modal.classList.add('hidden');
        CardManager.notifyUpdate(); // 手动触发更新
        showNotification(`派系 "${factionData.name}" 已保存！`, 'success');
    }

    function _handleDelete() {
        const cardId = _idInput.value;
        if (cardId && confirm('您确定要永久删除这个派系吗？此操作将无法撤销。')) {
            CardManager.deleteCard(cardId);
            _modal.classList.add('hidden');
            CardManager.notifyUpdate();
            showNotification('派系已删除。', 'info');
        }
    }

    // --- 模块接口 ---
    return {
        init: init,
        render: render
    };
})();