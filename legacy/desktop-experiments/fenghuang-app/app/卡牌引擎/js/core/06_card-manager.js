/*
 * 文件路径: /js/core/06_card-manager.js
 * 版本: V104.1 - 博士升级版 (主动通知)
 * 描述: 【卡牌管理器】核心模块。引擎所有卡牌的中央数据库与调度中心。
 */

const CardManager = (() => {
    let _cards = [];
    let _renderCallback = null;

    function init() {
        console.log("核心模块 [卡牌管理器] 已唤醒。");
    }

    function addCard(type, data) {
        const newCard = {
            id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: type,
            timestamp: new Date(),
            data: data
        };
        // 为角色卡数据添加ID
        if (type === 'character' && !newCard.data.id) {
            newCard.data.id = newCard.id;
        }
        
        _cards.unshift(newCard);
        console.log(`[卡牌管理器] 新卡牌已归档: [类型: ${type}]`, newCard);
        notifyUpdate();
        return newCard;
    }

    function deleteCard(cardId) {
        const index = _cards.findIndex(c => c.id === cardId);
        if (index > -1) {
            _cards.splice(index, 1);
            console.log(`[卡牌管理器] 卡牌已删除: ${cardId}`);
            notifyUpdate();
            return true;
        }
        return false;
    }

    function getAllCards() {
        return _cards;
    }

    function registerRenderCallback(callback) {
        if (typeof callback === 'function') {
            _renderCallback = callback;
        }
    }
    
    // 主动通知所有订阅者更新
    function notifyUpdate() {
        if (_renderCallback) {
            _renderCallback();
        }
    }

    return {
        init,
        addCard,
        deleteCard,
        getAllCards,
        registerRenderCallback,
        notifyUpdate 
    };
})();