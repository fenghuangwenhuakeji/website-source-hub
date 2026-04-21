/*
 * 文件路径: /js/engine/05_character-module.js
 * 版本: V104.1 - 博士构造版 (灵魂注入-修复版)
 * 描述: 【角色模块】核心逻辑。负责角色卡组的渲染、创建、编辑与数据管理。
 */

const CharacterModule = (() => {
    let _canvas;
    let _characterDeck = []; 
    let _selectedCharIds = [];

    // --- 模块初始化 ---
    function init() {
        console.log("引擎模块 [角色模块] 开始唤醒...");
        _canvas = document.getElementById('char-canvas');
        if (!_canvas) {
            console.error("[角色模块] 初始化失败: 未找到 'char-canvas' 元素。");
            return;
        }
        document.getElementById('char-add-new-btn')?.addEventListener('click', () => _openEditor());
        document.getElementById('add-selected-to-blueprint-btn')?.addEventListener('click', _handleAddToBlueprint);
        _initEditorModal();
        _loadAndRenderDeck();
        console.log("引擎模块 [角色模块] 已成功唤醒。");
    }

    function _loadAndRenderDeck() {
        _characterDeck = CardManager.getAllCards().filter(card => card.type === 'character');
        // 同步WorldState中的选中状态
        const blueprintChars = WorldState.data.blueprintCharacters || [];
        _selectedCharIds = blueprintChars.map(c => c.id);
        _renderDeck();
        
        // 更新仪表盘的角色总数
        WorldState.update({ characterCount: _characterDeck.length });
    }

    function _renderDeck() {
        _canvas.innerHTML = '';
        if (_characterDeck.length === 0) {
            _canvas.innerHTML = '<p class="empty-message">角色库为空，请使用【拆解室】或手动创建您的第一个角色。</p>';
            return;
        }
        const pokerMap = _getPokerDeckMap();
        _characterDeck.forEach((charCard, index) => {
            const cardInfo = pokerMap[index % pokerMap.length];
            const cardEl = _createPokerCard(charCard, cardInfo);
            _canvas.appendChild(cardEl);
        });
    }

    function _createPokerCard(charCard, cardInfo) {
        const charData = charCard.data.timeline[0] || charCard.data;
        const cardEl = document.createElement('div');
        cardEl.className = `char-profile-card suit-${cardInfo.suitName}`;
        cardEl.dataset.cardId = charCard.id;
        cardEl.setAttribute('data-suit', cardInfo.suit);
        cardEl.title = `点击编辑: ${charData.name}`;

        const isSelected = _selectedCharIds.includes(charCard.id);
        if (isSelected) cardEl.classList.add('selected');

        cardEl.innerHTML = `
            <div class="char-card-header">
                <span class="rank">${cardInfo.rank}</span>
                <span class="suit">${cardInfo.suit}</span>
            </div>
            <div class="char-card-body">
                <h5>${charData.name || '未命名'}</h5>
                <p>${charData.role || '身份待补充'}</p>
            </div>
            <div class="char-card-footer">
                <span class="rank">${cardInfo.rank}</span>
                <span class="suit">${cardInfo.suit}</span>
            </div>
            <input type="checkbox" class="char-select-checkbox" ${isSelected ? 'checked' : ''} title="勾选以加入蓝图">
        `;

        cardEl.addEventListener('click', (e) => {
            if (e.target.type !== 'checkbox') _openEditor(charCard.id);
        });

        cardEl.querySelector('.char-select-checkbox').addEventListener('click', (e) => {
            e.stopPropagation();
            _handleCharacterSelection(charCard.id, e.currentTarget.checked);
            cardEl.classList.toggle('selected', e.currentTarget.checked);
        });

        return cardEl;
    }

    let _modal, _form, _saveBtn, _deleteBtn, _closeBtn;
    function _initEditorModal() {
        _modal = document.getElementById('char-editor-modal');
        _form = document.getElementById('char-editor-form');
        _saveBtn = document.getElementById('char-editor-save-btn');
        _deleteBtn = document.getElementById('char-editor-delete-btn');
        _closeBtn = _modal.querySelector('.modal-close-btn');
        _closeBtn.addEventListener('click', () => _modal.classList.add('hidden'));
        _modal.addEventListener('click', (e) => { if (e.target === _modal) _modal.classList.add('hidden'); });
        _saveBtn.addEventListener('click', _handleSave);
        _deleteBtn.addEventListener('click', _handleDelete);
    }
    
    function _openEditor(cardId = null) {
        _form.reset();
        _form.dataset.cardId = cardId || '';
        const titleEl = document.getElementById('char-editor-title');
        
        let char;
        if (cardId) {
            const card = CardManager.getAllCards().find(c => c.id === cardId);
            if (card) {
                char = card.data;
                titleEl.innerHTML = `<i class="fa-solid fa-user-pen"></i> 编辑角色: ${char.timeline[0].name}`;
            }
        } else {
            titleEl.innerHTML = `<i class="fa-solid fa-user-plus"></i> 创建新角色`;
            char = {
                name: "新角色",
                timeline: [{ stageName: '初始设定', name: '新角色', role: '主角' }]
            };
        }
        
        if (!char.timeline || char.timeline.length === 0) {
            char.timeline = [{ stageName: '初始设定', name: char.name }];
        }
        
        _renderTimelineNav(char, 0);
        _populateEditor(char, 0);
        _modal.classList.remove('hidden');
    }

    function _renderTimelineNav(char, activeIndex) {
        const navBar = document.getElementById('timeline-nav-bar');
        navBar.innerHTML = '';
        char.timeline.forEach((stage, index) => {
            const stageWrapper = document.createElement('div');
            stageWrapper.className = 'timeline-stage-group';
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `timeline-stage-btn ${index === activeIndex ? 'active' : ''}`;
            btn.textContent = stage.stageName || `阶段 ${index + 1}`;
            btn.dataset.index = index;
            btn.addEventListener('click', () => {
                _saveCurrentStageTemporary();
                _populateEditor(char, index);
            });
            stageWrapper.appendChild(btn);
            navBar.appendChild(stageWrapper);
        });
    }
    
    function _populateEditor(char, timelineIndex) {
        document.getElementById('modal-char-id').value = char.id || '';
        document.getElementById('modal-char-timeline-index').value = timelineIndex;
        const stageData = char.timeline[timelineIndex];
        const fields = ['name', 'role', 'tags', 'summary', 'personality', 'motive', 'flaws', 'arc', 'background', 'abilities'];
        fields.forEach(f => {
            const el = document.getElementById(`char-${f}`);
            if(el) el.value = stageData[f] || '';
        });
        
        // 更新所有导航按钮的激活状态
        document.querySelectorAll('#timeline-nav-bar .timeline-stage-btn').forEach(b => {
            b.classList.toggle('active', parseInt(b.dataset.index) === timelineIndex);
        });
    }

    function _saveCurrentStageTemporary() {
        const charId = document.getElementById('modal-char-id').value;
        const card = CardManager.getAllCards().find(c => c.id === charId);
        if (!card) return; // Should not happen if editor is open for an existing char
        
        const timelineIndex = parseInt(document.getElementById('modal-char-timeline-index').value);
        const stageData = card.data.timeline[timelineIndex];

        const fields = ['name', 'role', 'tags', 'summary', 'personality', 'motive', 'flaws', 'arc', 'background', 'abilities'];
        fields.forEach(f => {
            const el = document.getElementById(`char-${f}`);
            if (el) stageData[f] = el.value;
        });
    }

    function _handleSave() {
        _saveCurrentStageTemporary(); // 保存当前标签页的修改
        
        const cardId = document.getElementById('modal-char-id').value;
        let cardToSave;

        if (cardId) {
            cardToSave = CardManager.getAllCards().find(c => c.id === cardId);
            if (!cardToSave) return;
        } else {
            const newCharData = {
                name: document.getElementById('char-name').value || "新角色",
                timeline: [{
                    stageName: '初始设定',
                    name: document.getElementById('char-name').value || "新角色"
                }]
            };
            const fields = ['role', 'tags', 'summary', 'personality', 'motive', 'flaws', 'arc', 'background', 'abilities'];
            fields.forEach(f => {
                const el = document.getElementById(`char-${f}`);
                if (el) newCharData.timeline[0][f] = el.value;
            });
            cardToSave = CardManager.addCard('character', newCharData);
        }
        
        _modal.classList.add('hidden');
        CardManager.notifyUpdate(); // 手动触发更新
        showNotification(`角色 "${cardToSave.data.timeline[0].name}" 已保存！`, 'success');
    }

    function _handleDelete() {
        const cardId = document.getElementById('modal-char-id').value;
        if (cardId && confirm('您确定要永久删除这个角色吗？此操作无法撤销。')) {
            CardManager.deleteCard(cardId);
            _modal.classList.add('hidden');
            CardManager.notifyUpdate();
            showNotification('角色已删除。', 'info');
        }
    }
    
    function _handleCharacterSelection(cardId, isSelected) {
        const index = _selectedCharIds.indexOf(cardId);
        if (isSelected && index === -1) {
            _selectedCharIds.push(cardId);
        } else if (!isSelected && index > -1) {
            _selectedCharIds.splice(index, 1);
        }
    }

    function _handleAddToBlueprint() {
        if (_selectedCharIds.length === 0) {
            showNotification('请先勾选至少一个角色再加入蓝图。', 'warning');
            return;
        }
        WorldState.update({
            blueprintCharacters: _characterDeck.filter(c => _selectedCharIds.includes(c.id))
        });
        showNotification(`已成功将 ${_selectedCharIds.length} 个角色加入故事蓝图！`, 'success');
    }

    function _getPokerDeckMap() {
        const suits = { spades: '♠', hearts: '♥', diams: '♦', clubs: '♣' };
        const ranks = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
        let deck = [];
        ranks.forEach(rank => deck.push({ rank, suit: suits.spades, suitName: 'spades' }));
        ranks.forEach(rank => deck.push({ rank, suit: suits.hearts, suitName: 'hearts' }));
        ranks.forEach(rank => deck.push({ rank, suit: suits.diams, suitName: 'diams' }));
        ranks.forEach(rank => deck.push({ rank, suit: suits.clubs, suitName: 'clubs' }));
        deck.push({ rank: '大', suit: '🃏', suitName: 'joker' });
        deck.push({ rank: '小', suit: '🃏', suitName: 'joker' });
        return deck;
    }

    return {
        init: init,
        renderDeck: _loadAndRenderDeck
    };
})();