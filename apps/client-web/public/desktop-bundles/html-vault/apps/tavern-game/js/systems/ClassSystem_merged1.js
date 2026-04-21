/**
 * 职业系统
 * 职业选择、转职、职业技能树
 */

export default class ClassSystem {
    constructor() {
        this.availableClasses = new Map();
        this.playerClass = null;
        this.subClass = null;
        this.classLevel = 1;
        this.skillTrees = new Map();
        this.unlockedSkills = new Set();
        this.classHistory = [];
    }

    async initialize() {
        console.log('⚔️ 职业系统初始化...');
        await this.loadClasses();
        await this.loadPlayerClass();
    }

    /**
     * 加载职业数据
     */
    async loadClasses() {
        // 战士
        this.addClass({
            id: 'warrior',
            name: '战士',
            icon: '⚔️',
            description: '近战专家，擅长使用各种武器和重甲，拥有强大的物理攻击力。',
            role: 'tank',
            primaryStats: ['strength', 'vitality'],
            secondaryStats: ['agility'],
            equipment: ['sword', 'axe', 'hammer', 'heavy_armor', 'shield'],
            baseHp: 120,
            baseMp: 60,
            skills: ['slash', 'shield_bash', 'taunt', 'berserker_rage'],
            skillTree: 'warrior_tree',
            availableSubClasses: ['paladin', 'berserker', 'guardian'],
            bonuses: {
                strength: 3,
                vitality: 2,
                defense: 5
            }
        });

        // 法师
        this.addClass({
            id: 'mage',
            name: '法师',
            icon: '🔮',
            description: '魔法大师，掌握各种元素魔法，能够释放强大的范围攻击。',
            role: 'damage',
            primaryStats: ['intelligence'],
            secondaryStats: ['vitality'],
            equipment: ['staff', 'wand', 'robe'],
            baseHp: 70,
            baseMp: 150,
            skills: ['fireball', 'ice_spike', 'lightning', 'meteor'],
            skillTree: 'mage_tree',
            availableSubClasses: ['elementalist', 'necromancer', 'chronomancer'],
            bonuses: {
                intelligence: 4,
                magicAttack: 5,
                mp: 20
            }
        });

        // 盗贼
        this.addClass({
            id: 'rogue',
            name: '盗贼',
            icon: '🗡️',
            description: '暗影行者，擅长潜行、偷袭和致命一击。',
            role: 'assassin',
            primaryStats: ['agility', 'luck'],
            secondaryStats: ['strength'],
            equipment: ['dagger', 'bow', 'leather_armor'],
            baseHp: 85,
            baseMp: 80,
            skills: ['backstab', 'poison', 'vanish', 'assassinate'],
            skillTree: 'rogue_tree',
            availableSubClasses: ['shadow_dancer', 'assassin', 'trickster'],
            bonuses: {
                agility: 3,
                luck: 2,
                critRate: 0.1
            }
        });

        // 圣骑士（子职业）
        this.addClass({
            id: 'paladin',
            name: '圣骑士',
            icon: '⛪',
            description: '神圣战士，结合了战斗能力和神圣魔法。',
            role: 'hybrid',
            primaryStats: ['strength', 'charisma'],
            secondaryStats: ['vitality'],
            equipment: ['sword', 'holy_armor', 'shield'],
            baseHp: 110,
            baseMp: 100,
            skills: ['holy_strike', 'heal', 'divine_shield', 'smite'],
            skillTree: 'paladin_tree',
            parentClass: 'warrior',
            requiredLevel: 20,
            bonuses: {
                strength: 2,
                charisma: 2,
                healing: 10
            },
            isSubClass: true
        级
        });

        // 狂战士（子职业）
        this.addClass({
            id: 'berserker',
            name: '狂战士',
            icon: '💢',
            description: '失去理智的战士，以生命为代价换取强大破坏力。',
            role: 'damage',
            primaryStats: ['strength', 'vitality'],
            equipment: ['axe', 'heavy_armor'],
            baseHp: 140,
            baseMp: 40,
            skills: ['rage', 'bloodthirst', 'execute', 'reckless_assault'],
            skillTree: 'berserker_tree',
            parentClass: 'warrior',
            requiredLevel: 20,
            bonuses: {
                strength: 4,
                attack: 10,
                damageTaken: 0.1
            },
            isSubClass: true
        });

        // 元素师（子职业）
        this.addClass({
            id: 'elementalist',
            name: '元素师',
            icon: '🌟',
            description: '掌控四大元素的魔法大师。',
            role: 'damage',
            primaryStats: ['intelligence'],
            equipment: ['staff', 'elemental_orb'],
            baseHp: 75,
            baseMp: 170,
            skills: ['fire_storm', 'ice_nova', 'thunder_bolt', 'earthquake'],
            skillTree: 'elementalist_tree',
            parentClass: 'mage',
            requiredLevel: 20,
            bonuses: {
                intelligence: 3,
                elementalDamage: 0.2
            },
            isSubClass: true
        });

        // 死灵法师（子职业）
        this.addClass({
            id: 'necromancer',
            name: '死灵法师',
            icon: '💀',
            description: '操控死亡和灵魂的黑暗法师。',
            role: 'summoner',
            primaryStats: ['intelligence', 'vitality'],
            equipment: ['necromancer_staff', 'dark_robe'],
            baseHp: 80,
            baseMp: 140,
            skills: ['summon_skeleton', 'curse', 'drain_life', 'raise_dead'],
            skillTree: 'necromancer_tree',
            parentClass: 'mage',
            requiredLevel: 20,
            bonuses: {
                intelligence: 3,
                summonPower: 0.2
            },
            isSubClass: true
        });

        // 影舞者（子职业）
        this.addClass({
            id: 'shadow_dancer',
            name: '影舞者',
            icon: '🌑',
            description: '在阴影中穿梭的致命刺客。',
            role: 'assassin',
            primaryStats: ['agility'],
            equipment: ['twin_blades', 'shadow_cloak'],
            baseHp: 90,
            baseMp: 100,
            skills: ['shadow_step', 'blade_dance', 'shadow_clone', 'assassination'],
            skillTree: 'shadow_dancer_tree',
            parentClass: 'rogue',
            requiredLevel: 20,
            bonuses: {
                agility: 4,
                evasion: 0.15
            },
            isSubClass: true
        });

        // 加载技能树
        this.loadSkillTrees();
    }

    /**
     * 加载技能树
     */
    loadSkillTrees() {
        // 战士技能树
        this.skillTrees.set('warrior_tree', {
            id: 'warrior_tree',
            name: '战士技能树',
            tiers: [
                {
                    level: 1,
                    skills: [
                        { id: 'slash', name: '斩击', type: 'active', cost: 1, description: '造成120%武器伤害', maxLevel: 5 },
                        { id: 'shield_bash', name: '盾击', type: 'active', cost: 2, description: '造成伤害并眩晕1回合', maxLevel: 3 },
                        { id: 'taunt', name: '嘲讽', type: 'active', cost: 1, description: '吸引敌人注意力', maxLevel: 3 }
                    ]
                },
                {
                    level: 5,
                    skills: [
                        { id: 'berserker_rage', name: '狂暴', type: 'active', cost: 3, description: '攻击力+50%，防御-30%', maxLevel: 5 },
                        { id: 'fortify', name: '强化防御', type: 'passive', description: '防御力+10%', maxLevel: 3 },
                        { id: 'vitality_boost', name: '生命强化', type: 'passive', description: '最大生命值+10%', maxLevel: 3 }
                    ]
                },
                {
                    level: 10,
                    skills: [
                        { id: 'execute', name: '处决', type: 'active', cost: 4, description: '对低血量敌人造成巨大伤害', maxLevel: 5 },
                        { id: 'iron_wall', name: '铁壁', type: 'passive', description: '格挡几率+15%', maxLevel: 3 }
                    ]
                },
                {
                    level: 15,
                    skills: [
                        { id: 'war_cry', name: '战吼', type: 'active', cost: 5, description: '提升全队攻击力', maxLevel: 3 },
                        { id: 'unbreakable', name: '坚不可摧', type: 'passive', description: '受到致命伤害时保留1点生命值', maxLevel: 1 }
                    ]
                }
            ]
        });

        // 法师技能树
        this.skillTrees.set('mage_tree', {
            id: 'mage_tree',
            name: '法师技能树',
            tiers: [
                {
                    level: 1,
                    skills: [
                        { id: 'fireball', name: '火球术', type: 'active', cost: 2, description: '发射火球造成80魔法伤害', maxLevel: 5 },
                        { id: 'ice_spike', name: '冰刺', type: 'active', cost: 2, description: '发射冰刺造成60魔法伤害', maxLevel: 5 },
                        { id: 'mana_shield', name: '魔法护盾', type: 'active', cost: 3, description: '吸收伤害', maxLevel: 3 }
                    ]
                },
                {
                    level: 5,
                    skills: [
                        { id: 'lightning', name: '闪电链', type: 'active', cost: 3, description: '闪电跳跃攻击3个目标', maxLevel: 5 },
                        { id: 'mana_efficiency', name: '魔力效率', type: 'passive', description: '魔法消耗-10%', maxLevel: 3 },
                        { id: 'spell_power', name: '法术强度', type: 'passive', description: '魔法伤害+10%', maxLevel: 3 }
                    ]
                },
                {
                    level: 10,
                    skills: [
                        { id: 'meteor', name: '陨石术', type: 'active', cost: 5, description: '召唤陨石造成大范围伤害', maxLevel: 5 },
                        { id: 'elemental_mastery', name: '元素精通', type: 'passive', description: '所有魔法伤害+20%', maxLevel: 3 }
                    ]
                },
                {
                    level: 15,
                    skills: [
                        { id: 'time_warp', name: '时间扭曲', type: 'active', cost: 5, description: '减缓敌人速度', maxLevel: 3 },
                        { id: 'arcane_explosion', name: '奥术爆炸', type: 'active', cost: 6, description: '造成巨大的范围伤害', maxLevel: 3 }
                    ]
                }
            ]
        });

        // 盗贼技能树
        this.skillTrees.set('rogue_tree', {
            id: 'rogue_tree',
            name: '盗贼技能树',
            tiers: [
                {
                    level: 1,
                    skills: [
                        { id: 'backstab', name: '背刺', type: 'active', cost: 1, description: '背后攻击造成150%伤害', maxLevel: 5 },
                        { id: 'poison', name: '涂毒', type: 'active', cost: 1, description: '武器涂毒，攻击附加毒', maxLevel: 3 },
                        { id: 'stealth', name: '潜行', type: 'active', cost: 2, description: '进入潜行状态', maxLevel: 3 }
                    ]
                },
                {
                    level: 5,
                    skills: [
                        { id: 'vanish', name: '消失', type: 'active', cost: 3, description: '立即脱离战斗', maxLevel: 3 },
                        { id: 'crit_chance', name: '致命一击', type: 'passive', description: '暴击率+10%', maxLevel: 3 },
                        { id: 'evasion', name: '闪避', type: 'passive', description: '闪避率+10%', maxLevel: 3 }
                    ]
                },
                {
                    level: 10,
                    skills: [
                        { id: 'assassinate', name: '刺杀', type: 'active', cost: 4, description: '对低生命值敌人造成致命伤害', maxLevel: 5 },
                        { id: 'poison_mastery', name: '毒药精通', type: 'passive', description: '毒药效果+50%', maxLevel: 3 }
                    ]
                },
                {
                    level: 15,
                    skills: [
                        { id: 'shadow_step', name: '暗影步', type: 'active', cost: 3, description: '瞬间移动到敌人身后', maxLevel: 3 },
                        { id: 'blade_dance', name: '剑舞', type: 'active', cost: 5, description: '连续攻击5次', maxLevel: 3 }
                    ]
                }
            ]
        });
    }

    /**
     * 添加职业
     */
    addClass(classData) {
        this.availableClasses.set(classData.id, classData);
    }

    /**
     * 获取职业
     */
    getClass(classId) {
        return this.availableClasses.get(classId);
    }

    /**
     * 获取所有职业
     */
    getAllClasses() {
        return Array.from(this.availableClasses.values());
    }

    /**
     * 获取可用职业（非子职业）
     */
    getAvailableClasses() {
        return this.getAllClasses().filter(c => !c.isSubClass);
    }

    /**
     * 选择职业
     */
    selectClass(classId) {
        const classData = this.getClass(classId);
        if (!classData) {
            return { success: false, error: '职业不存在' };
        }

        if (classData.isSubClass) {
            return { success: false, error: '不能直接选择子职业' };
        }

        this.playerClass = classId;
        this.classLevel = 1;
        this.unlockedSkills = new Set(classData.skills);

        // 记录历史
        this.classHistory.push({
            type: 'select_class',
            classId,
            timestamp: Date.now()
        });

        this.savePlayerClass();

        return {
            success: true,
            class: classData,
            initialSkills: classData.skills
        };
    }

    /**
     * 转职为子职业
     */
    changeClass(subClassId) {
        const subClass = this.getClass(subClassId);
        if (!subClass) {
            return { success: false, error: '子职业不存在' };
        }

        if (!subClass.isSubClass) {
            return { success: false, error: '不是子职业' };
        }

        if (subClass.parentClass !== this.playerClass) {
            return { success: false, error: '子职业不匹配当前职业' };
        }

        if (this.classLevel < subClass.requiredLevel) {
            return { success: false, error: `等级不足，需要${subClass.requiredLevel}级` };
        }

        this.subClass = subClassId;

        // 解锁子职业技能
        if (subClass.skills) {
            subClass.skills.forEach(skillId => {
                this.unlockedSkills.add(skillId);
            });
        }

        // 记录历史
        this.classHistory.push({
            type: 'change_class',
            from: this.playerClass,
            to: subClassId,
            timestamp: Date.now()
        });

        this.savePlayerClass();

        return {
            success: true,
            subClass,
            unlockedSkills: subClass.skills
        };
    }

    /**
     * 获取技能树
     */
    getSkillTree(classId) {
        const classData = this.getClass(classId);
        if (!classData || !classData.skillTree) {
            return null;
        }
        return this.skillTrees.get(classData.skillTree);
    }

    /**
     * 获取当前可解锁的技能
     */
    getAvailableSkills() {
        if (!this.playerClass) {
            return [];
        }

        const skillTree = this.getSkillTree(this.playerClass);
        if (!skillTree) {
            return [];
        }

        const availableSkills = [];

        for (const tier of skillTree.tiers) {
            if (tier.level <= this.classLevel) {
                availableSkills.push(...tier.skills);
            }
        }

        return availableSkills;
    }

    /**
     * 升级职业等级
     */
    levelUpClass() {
        this.classLevel++;

        // 记录历史
        this.classHistory.push({
            type: 'level_up',
            level: this.classLevel,
            timestamp: Date.now()
        });

        this.savePlayerClass();

        return {
            success: true,
            level: this.classLevel
        };
    }

    /**
     * 检查技能是否已解锁
     */
    isSkillUnlocked(skillId) {
        return this.unlockedSkills.has(skillId);
    }

    /**
     * 解锁技能
     */
    unlockSkill(skillId) {
        if (this.isSkillUnlocked(skillId)) {
            return { success: false, error: '技能已解锁' };
        }

        const availableSkills = this.getAvailableSkills();
        const skill = availableSkills.find(s => s.id === skillId);

        if (!skill) {
            return { success: false, error: '技能不可用' };
        }

        this.unlockedSkills.add(skillId);

        // 记录历史
        this.classHistory.push({
            type: 'unlock_skill',
            skillId,
            timestamp: Date.now()
        });

        this.savePlayerClass();

        return {
            success: true,
            skill
        };
    }

    /**
     * 获取职业信息
     */
    getClassInfo() {
        if (!this.playerClass) {
            return null;
        }

        const classData = this.getClass(this.playerClass);
        const subClassData = this.subClass ? this.getClass(this.subClass) : null;

        return {
            mainClass: classData,
            subClass: subClassData,
            level: this.classLevel,
            skills: Array.from(this.unlockedSkills),
            skillTree: this.getSkillTree(this.playerClass)
        };
    }

    /**
     * 获取可转职的子职业
     */
    getAvailableSubClasses() {
        if (!this.playerClass) {
            return [];
        }

        const classData = this.getClass(this.playerClass);
        if (!classData.availableSubClasses) {
            return [];
        }

        return classData.availableSubClasses
            .map(subClassId => {
                const subClass = this.getClass(subClassId);
                if (subClass) {
                    return {
                        ...subClass,
                        canChange: this.classLevel >= subClass.requiredLevel,
                        requiredLevel: subClass.requiredLevel
                    };
                }
                return null;
            })
            .filter(Boolean);
    }

    /**
     * 保存玩家职业
     */
    savePlayerClass() {
        try {
            const data = {
                playerClass: this.playerClass,
                subClass: this.subClass,
                classLevel: this.classLevel,
                unlockedSkills: Array.from(this.unlockedSkills),
                classHistory: this.classHistory
            };
            localStorage.setItem('rpg_player_class', JSON.stringify(data));
        } catch (e) {
            console.error('保存职业数据失败:', e);
        }
    }

    /**
     * 加载玩家职业
     */
    async loadPlayerClass() {
        try {
            const saved = localStorage.getItem('rpg_player_class');
            if (saved) {
                const data = JSON.parse(saved);
                this.playerClass = data.playerClass;
                this.subClass = data.subClass;
                this.classLevel = data.classLevel || 1;
                this.unlockedSkills = new Set(data.unlockedSkills || []);
                this.classHistory = data.classHistory || [];
            }
        } catch (e) {
            console.error('加载职业数据失败:', e);
        }
    }

    /**
     * 保存系统数据
     */
    async save() {
        this.savePlayerClass();
        return {
            playerClass: this.playerClass,
            subClass: this.subClass,
            classLevel: this.classLevel,
            unlockedSkills: Array.from(this.unlockedSkills),
            classHistory: this.classHistory
        };
    }

    /**
     * 加载系统数据
     */
    async load(data) {
        if (data) {
            if (data.playerClass) this.playerClass = data.playerClass;
            if (data.subClass) this.subClass = data.subClass;
            if (data.classLevel) this.classLevel = data.classLevel;
            if (data.unlockedSkills) {
                this.unlockedSkills = new Set(data.unlockedSkills);
            }
            if (data.classHistory) {
                this.classHistory = data.classHistory;
            }
        }
    }
}
