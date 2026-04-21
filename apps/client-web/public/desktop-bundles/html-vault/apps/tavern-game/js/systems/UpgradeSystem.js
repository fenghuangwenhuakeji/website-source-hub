/**
 * 升级系统
 * 管理角色升级、属性提升和技能学习
 */

export class UpgradeSystem {
    constructor(engine) {
        this.engine = engine;
        this.isInitialized = false;
        this.skillPoints = 0;
    }

    async init() {
        if (this.isInitialized) return;

        console.log('[UpgradeSystem] 初始化升级系统...');

        this.isInitialized = true;
        console.log('[UpgradeSystem] 升级系统初始化完成');
    }

    // 检查升级
    checkLevelUp(player) {
        if (!player) return false;

        if (player.exp >= player.expToNext) {
            this.levelUp(player);
            return true;
        }
        return false;
    }

    // 升级
    levelUp(player) {
        player.level++;
        player.exp -= player.expToNext;
        player.expToNext = this.calculateExpToNext(player.level);

        // 根据职业提升属性
        const classType = player.class;
        const growth = this.getClassGrowth(classType);

        player.maxHp += growth.hp;
        player.maxMp += growth.mp;
        player.atk += growth.atk;
        player.def += growth.def;
        player.spd += growth.spd;
        player.crit += growth.crit;

        // 获得技能点
        this.skillPoints += 3;

        // 恢复生命和魔法
        player.hp = player.maxHp;
        player.mp = player.maxMp;

        if (window.game) {
            game.showNotification(`升级了！现在是 Lv.${player.level}，获得3技能点`, 'success');
            if (window.audioSystem) {
                audioSystem.playSound('levelUp');
            }
            this.updateUpgradeUI();
        }
    }

    // 计算升级所需经验
    calculateExpToNext(level) {
        return Math.floor(100 * Math.pow(1.5, level - 1));
    }

    // 获取职业成长
    getClassGrowth(classType) {
        const growth = {
            warrior: { hp: 15, mp: 3, atk: 3, def: 2, spd: 1, crit: 0.5 },
            mage: { hp: 8, mp: 10, atk: 2, def: 1, spd: 1, crit: 0.5 },
            rogue: { hp: 10, mp: 5, atk: 2.5, def: 1, spd: 2, crit: 1 },
            priest: { hp: 9, mp: 8, atk: 1.5, def: 1.5, spd: 1, crit: 0.3 }
        };

        return growth[classType] || growth.warrior;
    }

    // 提升属性
    upgradeStat(stat) {
        if (!window.game || !game.player) {
            game.showNotification('请先开始游戏', 'error');
            return;
        }

        if (this.skillPoints <= 0) {
            game.showNotification('技能点不足', 'error');
            return;
        }

        const costs = {
            hp: { cost: 1, value: 10 },
            mp: { cost: 1, value: 5 },
            atk: { cost: 2, value: 2 },
            def: { cost: 2, value: 2 },
            spd: { cost: 1, value: 1 },
            crit: { cost: 3, value: 1 }
        };

        const upgrade = costs[stat];
        if (!upgrade) {
            game.showNotification('无效的属性', 'error');
            return;
        }

        if (this.skillPoints < upgrade.cost) {
            game.showNotification('技能点不足', 'error');
            return;
        }

        // 扣除技能点
        this.skillPoints -= upgrade.cost;

        // 提升属性
        switch (stat) {
            case 'hp':
                game.player.maxHp += upgrade.value;
                game.player.hp = game.player.maxHp;
                break;
            case 'mp':
                game.player.maxMp += upgrade.value;
                game.player.mp = game.player.maxMp;
                break;
            case 'atk':
                game.player.atk += upgrade.value;
                break;
            case 'def':
                game.player.def += upgrade.value;
                break;
            case 'spd':
                game.player.spd += upgrade.value;
                break;
            case 'crit':
                game.player.crit += upgrade.value;
                break;
        }

        game.updateUI();
        game.showNotification(`提升了 ${this.getStatName(stat)}！`, 'success');
        this.updateUpgradeUI();
    }

    // 获取属性名称
    getStatName(stat) {
        const names = {
            hp: '生命值',
            mp: '魔法值',
            atk: '攻击力',
            def: '防御力',
            spd: '速度',
            crit: '暴击率'
        };
        return names[stat] || stat;
    }

    // 更新升级UI
    updateUpgradeUI() {
        if (!window.game || !game.player) return;

        const levelEl = document.getElementById('upgrade-level');
        const skillPointsEl = document.getElementById('skill-points');

        if (levelEl) levelEl.textContent = game.player.level;
        if (skillPointsEl) skillPointsEl.textContent = this.skillPoints;
    }
}
