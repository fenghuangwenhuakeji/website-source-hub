/**
 * 角色升级系统
 * 属性升级、技能点分配、职业进阶
 */

export default class CharacterUpgradeSystem {
    constructor() {
        this.player = null;
        this.levels = {
            current: 1,
            exp: 0,
            expToNext: 100
        };
        this.statPoints = 0;
        this.skillPoints = 0;
        this.attributes = {
            strength: 10,    // 力量 - 影响物理攻击
            agility: 10,    // 敏捷 - 影响速度和闪避
            intelligence: 10,// 智力 - 影响魔法攻击
            vitality: 10,   // 体质 - 影响生命值
            luck: 10,       // 幸运 - 影响暴击和掉落
            charisma: 10    // 魅力 - 影响NPC交互
        };
        this.derivedStats = {
            hp: 100,
            maxHp: 100,
            mp: 100,
            maxMp: 100,
            attack: 10,
            defense: 10,
            magicAttack: 10,
            magicDefense: 10,
            speed: 10,
            critRate: 0.05,
            critDamage: 1.5
        };
        this.upgradeHistory = [];
    }

    async initialize() {
        console.log('📈 角色升级系统初始化...');
        await this.loadCharacterData();
    }

    /**
     * 加载角色数据
     */
    async loadCharacterData() {
        try {
            const saved = localStorage.getItem('rpg_character_data');
            if (saved) {
                const data = JSON.parse(saved);
                this.levels = data.levels || this.levels;
                this.statPoints = data.statPoints || 0;
                this.skillPoints = data.skillPoints || 0;
                this.attributes = { ...this.attributes, ...data.attributes };
                this.derivedStats = { ...this.derivedStats, ...data.derivedStats };
                this.upgradeHistory = data.upgradeHistory || [];
                this.player = data.player || null;
            }
            this.calculateDerivedStats();
        } catch (e) {
            console.error('加载角色数据失败:', e);
        }
    }

    /**
     * 保存角色数据
     */
    async saveCharacterData() {
        try {
            const data = {
                levels: this.levels,
                statPoints: this.statPoints,
                skillPoints: this.skillPoints,
                attributes: this.attributes,
                derivedStats: this.derivedStats,
                upgradeHistory: this.upgradeHistory,
                player: this.player
            };
            localStorage.setItem('rpg_character_data', JSON.stringify(data));
        } catch (e) {
            console.error('保存角色数据失败:', e);
        }
    }

    /**
     * 创建新角色
     */
    createCharacter(characterData) {
        this.player = {
            id: Date.now(),
            name: characterData.name || '冒险者',
            class: characterData.class || 'warrior',
            race: characterData.race || 'human',
            gender: characterData.gender || 'male',
            avatar: characterData.avatar || '👤',
            createdAt: Date.now()
        };

        // 应用种族加成
        this.applyRaceBonuses(this.player.race);

        // 应用职业基础属性
        this.applyClassBaseStats(this.player.class);

        this.saveCharacterData();

        return { success: true, player: this.player };
    }

    /**
     * 应用种族加成
     */
    applyRaceBonuses(race) {
        const bonuses = {
            human: { all: 1 },
            elf: { agility: 2, intelligence: 2, vitality: -1 },
            dwarf: { vitality: 2, strength: 2, agility: -1 },
            orc: { strength: 3, vitality: 1, intelligence: -2, charisma: -1 },
            dragonborn: { strength: 2, vitality: 1, intelligence: 1 },
            gnome: { intelligence: 3, agility: 1, strength: -2 }
        };

        const bonus = bonuses[race] || bonuses.human;

        if (bonus.all) {
            for (const attr in this.attributes) {
                this.attributes[attr] += bonus.all;
            }
        } else {
            for (const attr in bonus) {
                if (this.attributes[attr] !== undefined) {
                    this.attributes[attr] += bonus[attr];
                }
            }
        }

        this.calculateDerivedStats();
    }

    /**
     * 应用职业基础属性
     */
    applyClassBaseStats(classType) {
        const baseStats = {
            warrior: { strength: 3, vitality: 2, agility: 1 },
            mage: { intelligence: 4, vitality: -1, luck: 1 },
            rogue: { agility: 3, luck: 2, strength: 1, vitality: -1 },
            paladin: { strength: 2, vitality: 2, intelligence: 1, charisma: 1 },
            ranger: { agility: 2, intelligence: 1, luck: 2 },
            necromancer: { intelligence: 3, vitality: 1, charisma: -1 }
        };

        const stats = baseStats[classType] || baseStats.warrior;

        for (const attr in stats) {
            if (this.attributes[attr] !== undefined) {
                this.attributes[attr] += stats[attr];
            }
        }

        this.calculateDerivedStats();
    }

    /**
     * 计算衍生属性
     */
    calculateDerivedStats() {
        const attrs = this.attributes;

        this.derivedStats.maxHp = 100 + (attrs.vitality * 10) + (this.levels.current * 20);
        this.derivedStats.maxMp = 100 + (attrs.intelligence * 8) + (this.levels.current * 15);
        this.derivedStats.attack = attrs.strength + Math.floor(this.levels.current * 1.5);
        this.derivedStats.defense = Math.floor((attrs.vitality + attrs.strength) / 2) + this.levels.current;
        this.derivedStats.magicAttack = attrs.intelligence + Math.floor(this.levels.current * 1.5);
        this.derivedStats.magicDefense = Math.floor((attrs.intelligence + attrs.vitality) / 2) + this.levels.current;
        this.derivedStats.speed = attrs.agility + Math.floor(this.levels.current * 0.5);
        this.derivedStats.critRate = 0.05 + (attrs.luck * 0.002);
        this.derivedStats.critDamage = 1.5 + (attrs.luck * 0.01);

        // 限制范围
        this.derivedStats.hp = Math.min(this.derivedStats.hp, this.derivedStats.maxHp);
        this.derivedStats.mp = Math.min(this.derivedStats.mp, this.derivedStats.maxMp);
    }

    /**
     * 增加经验值
     */
    addExp(amount) {
        this.levels.exp += amount;

        // 检查升级
        while (this.levels.exp >= this.levels.expToNext) {
            this.levelUp();
        }

        this.saveCharacterData();

        return {
            currentExp: this.levels.exp,
            expToNext: this.levels.expToNext,
            level: this.levels.current
        };
    }

    /**
     * 升级
     */
    levelUp() {
        this.levels.exp -= this.levels.expToNext;
        this.levels.current++;

        // 计算下一级所需经验
        this.levels.expToNext = Math.floor(100 * Math.pow(1.2, this.levels.current - 1));

        // 获得属性点和技能点
        const statPointsGain = 3;
        const skillPointsGain = 1;

        this.statPoints += statPointsGain;
        this.skillPoints += skillPointsGain;

        // 完全恢复状态
        this.derivedStats.hp = this.derivedStats.maxHp;
        this.derivedStats.mp = this.derivedStats.maxMp;

        // 记录升级历史
        this.upgradeHistory.push({
            type: 'level_up',
            level: this.levels.current,
            timestamp: Date.now(),
            statPoints: statPointsGain,
            skillPoints: skillPointsGain
        });

        // 重新计算衍生属性
        this.calculateDerivedStats();

        console.log(`🎉 角色升级到 ${this.levels.current} 级！`);

        return {
            success: true,
            level: this.levels.current,
            statPoints: this.statPoints,
            skillPoints: this.skillPoints
        };
    }

    /**
     * 分配属性点
     */
    allocateStatPoint(attribute, points = 1) {
        if (points > this.statPoints) {
            return { success: false, error: '属性点不足' };
        }

        if (this.attributes[attribute] === undefined) {
            return { success: false, error: '无效的属性' };
        }

        // 属性上限检查
        if (this.attributes[attribute] + points > 99) {
            return { success: false, error: '属性已达到上限' };
        }

        this.attributes[attribute] += points;
        this.statPoints -= points;

        // 记录分配历史
        this.upgradeHistory.push({
            type: 'stat_allocation',
            attribute,
            points,
            timestamp: Date.now()
        });

        // 重新计算衍生属性
        this.calculateDerivedStats();
        this.saveCharacterData();

        return {
            success: true,
            attribute,
            newValue: this.attributes[attribute],
            remainingPoints: this.statPoints
        };
    }

    /**
     * 重置属性点
     */
    resetStatPoints() {
        const totalPoints = Object.values(this.attributes).reduce((sum, val) => {
            return sum + (val - 10); // 减去初始值
        }, 0);

        // 重置为基础值
        const baseStats = {
            strength: 10,
            agility: 10,
            intelligence: 10,
            vitality: 10,
            luck: 10,
            charisma: 10
        };

        this.attributes = { ...baseStats };
        this.statPoints += totalPoints;

        this.calculateDerivedStats();
        this.saveCharacterData();

        return {
            success: true,
            resetPoints: totalPoints,
            newStatPoints: this.statPoints
        };
    }

    /**
     * 使用技能点（由职业系统调用）
     */
    useSkillPoint(skillId) {
        if (this.skillPoints <= 0) {
            return { success: false, error: '技能点不足' };
        }

        this.skillPoints--;

        this.saveCharacterData();

        return {
            success: true,
            remainingPoints: this.skillPoints
        };
    }

    /**
     * 获取角色信息
     */
    getCharacter() {
        this.calculateDerivedStats();
        return {
            player: this.player,
            levels: this.levels,
            attributes: this.attributes,
            derivedStats: this.derivedStats,
            statPoints: this.statPoints,
            skillPoints: this.skillPoints
        };
    }

    /**
     * 获取属性信息
     */
    getAttributes() {
        return {
            attributes: this.attributes,
            derived: this.derivedStats,
            availablePoints: this.statPoints
        };
    }

    /**
     * 恢复生命值
     */
    restoreHp(amount) {
        if (amount === 'full') {
            this.derivedStats.hp = this.derivedStats.maxHp;
        } else {
            this.derivedStats.hp = Math.min(this.derivedStats.maxHp, this.derivedStats.hp + amount);
        }
        this.saveCharacterData();
        return this.derivedStats.hp;
    }

    /**
     * 恢复魔法值
     */
    restoreMp(amount) {
        if (amount === 'full') {
            this.derivedStats.mp = this.derivedStats.maxMp;
        } else {
            this.derivedStats.mp = Math.min(this.derivedStats.maxMp, this.derivedStats.mp + amount);
        }
        this.saveCharacterData();
        return this.derivedStats.mp;
    }

    /**
     * 造成伤害
     */
    takeDamage(amount) {
        this.derivedStats.hp = Math.max(0, this.derivedStats.hp - amount);
        this.saveCharacterData();
        return {
            currentHp: this.derivedStats.hp,
            maxHp: this.derivedStats.maxHp,
            isDead: this.derivedStats.hp <= 0
        };
    }

    /**
     * 消耗魔法值
     */
    consumeMp(amount) {
        if (this.derivedStats.mp < amount) {
            return { success: false, error: '魔法值不足' };
        }

        this.derivedStats.mp -= amount;
        this.saveCharacterData();
        return { success: true, remainingMp: this.derivedStats.mp };
    }

    /**
     * 获取升级历史
     */
    getUpgradeHistory(limit = 50) {
        return this.upgradeHistory.slice(-limit);
    }

    /**
     * 保存系统数据
     */
    async save() {
        await this.saveCharacterData();
        return {
            player: this.player,
            levels: this.levels,
            attributes: this.attributes,
            derivedStats: this.derivedStats,
            statPoints: this.statPoints,
            skillPoints: this.skillPoints
        };
    }

    /**
     * 加载系统数据
     */
    async load(data) {
        if (data) {
            if (data.player) this.player = data.player;
            if (data.levels) this.levels = data.levels;
            if (data.attributes) this.attributes = data.attributes;
            if (data.derivedStats) this.derivedStats = data.derivedStats;
            if (data.statPoints !== undefined) this.statPoints = data.statPoints;
            if (data.skillPoints !== undefined) this.skillPoints = data.skillPoints;

            this.calculateDerivedStats();
        }
    }
}
