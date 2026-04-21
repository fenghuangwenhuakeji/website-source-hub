/**
 * 角色系统
 * 管理角色属性、状态和升级
 */

export class CharacterSystem {
    constructor(engine) {
        this.engine = engine;
        this.isInitialized = false;
        this.attributes = {};
    }

    async init() {
        if (this.isInitialized) return;

        console.log('[CharacterSystem] 初始化角色系统...');

        this.isInitialized = true;
        console.log('[CharacterSystem] 角色系统初始化完成');
    }

    // 创建新角色
    createNewCharacter(classType, name) {
        console.log(`[CharacterSystem] 创建角色: ${name}, 职业: ${classType}`);

        const baseStats = this.getClassBaseStats(classType);

        return {
            name: name,
            class: classType,
            level: 1,
            exp: 0,
            expToNext: 100,
            hp: baseStats.hp,
            maxHp: baseStats.hp,
            mp: baseStats.mp,
            maxMp: baseStats.mp,
            atk: baseStats.atk,
            def: baseStats.def,
            spd: baseStats.spd,
            crit: baseStats.crit,
            gold: 100,
            diamonds: 0,
            skills: [],
            inventory: [],
            equipment: {},
            quests: []
        };
    }

    // 获取职业基础属性
    getClassBaseStats(classType) {
        const stats = {
            warrior: { hp: 120, mp: 30, atk: 15, def: 10, spd: 8, crit: 3 },
            mage: { hp: 70, mp: 100, atk: 8, def: 5, spd: 10, crit: 5 },
            rogue: { hp: 90, mp: 50, atk: 12, def: 6, spd: 15, crit: 10 },
            priest: { hp: 80, mp: 80, atk: 6, def: 8, spd: 9, crit: 2 }
        };

        return stats[classType] || stats.warrior;
    }

    // 更新角色面板
    updateCharacterPanel() {
        if (!window.game || !game.player) return;

        const player = game.player;

        // 更新角色信息
        const nameEl = document.getElementById('char-panel-name');
        const levelEl = document.getElementById('char-panel-level');
        const avatarEl = document.getElementById('char-panel-avatar');

        if (nameEl) nameEl.textContent = player.name;
        if (levelEl) levelEl.textContent = `Lv.${player.level} ${this.getClassName(player.class)}`;
        if (avatarEl) avatarEl.textContent = this.getClassIcon(player.class);

        // 更新属性网格
        const statsEl = document.getElementById('char-panel-stats');
        if (statsEl) {
            statsEl.innerHTML = `
                <div class="stat-item"><span>❤️ 生命值</span><span>${player.hp}/${player.maxHp}</span></div>
                <div class="stat-item"><span>⚡ 魔法值</span><span>${player.mp}/${player.maxMp}</span></div>
                <div class="stat-item"><span>⚔️ 攻击力</span><span>${player.atk}</span></div>
                <div class="stat-item"><span>🛡️ 防御力</span><span>${player.def}</span></div>
                <div class="stat-item"><span>💨 速度</span><span>${player.spd}</span></div>
                <div class="stat-item"><span>🎯 暴击率</span><span>${player.crit}%</span></div>
                <div class="stat-item"><span>💰 金币</span><span>${player.gold}</span></div>
                <div class="stat-item"><span>💎 钻石</span><span>${player.diamonds}</span></div>
            `;
        }
    }

    // 获取职业名称
    getClassName(classType) {
        const names = {
            warrior: '战士',
            mage: '法师',
            rogue: '盗贼',
            priest: '牧师'
        };
        return names[classType] || '未知';
    }

    // 获取职业图标
    getClassIcon(classType) {
        const icons = {
            warrior: '⚔️',
            mage: '🔮',
            rogue: '🗡️',
            priest: '✨'
        };
        return icons[classType] || '👤';
    }

    // 计算升级所需经验
    calculateExpToNext(level) {
        return Math.floor(100 * Math.pow(1.5, level - 1));
    }

    // 检查是否可以升级
    checkLevelUp(player) {
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

        // 恢复生命和魔法
        player.hp = player.maxHp;
        player.mp = player.maxMp;

        if (window.game) {
            game.showNotification(`升级了！现在是 Lv.${player.level}`, 'success');
            if (window.audioSystem) {
                audioSystem.playSound('levelUp');
            }
        }
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

    // 获取角色属性
    getAttributes(player) {
        return {
            strength: Math.floor(player.atk / 3),
            agility: Math.floor(player.spd / 2),
            intelligence: Math.floor(player.mp / 5),
            vitality: Math.floor(player.maxHp / 20),
            luck: Math.floor(player.crit / 2),
            charisma: 10 // 默认值
        };
    }
}
