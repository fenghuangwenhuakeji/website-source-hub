export class MercenarySystem {
    constructor(game) {
        this.game = game;
        this.roster = []; // 当前雇佣的队伍
        this.availableMercenaries = []; // 酒馆中可雇佣的角色
        this.maxSize = 3;
    }

    hire(mercenaryId) {
        if (this.roster.length >= this.maxSize) return false;
        // 扣除金币逻辑
        // 加载雇佣兵数据
        // this.roster.push(newMercenary);
        return true;
    }

    fire(index) {
        this.roster.splice(index, 1);
    }

    getPartyStats() {
        // 汇总队伍属性
    }

    triggerPartyBanters() {
        // 触发队伍内角色的随机对话
    }
}