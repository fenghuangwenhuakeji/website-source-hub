/**
 * 职业系统
 * 管理职业信息和职业技能
 */

export class ClassSystem {
    constructor(engine) {
        this.engine = engine;
        this.isInitialized = false;
        this.classes = [];
    }

    async init() {
        if (this.isInitialized) return;

        console.log('[ClassSystem] 初始化职业系统...');

        // 初始化职业数据
        this.initializeClasses();

        this.isInitialized = true;
        console.log('[ClassSystem] 职业系统初始化完成');
    }

    // 初始化职业
    initializeClasses() {
        this.classes = [
            {
                id: 'warrior',
                name: '战士',
                icon: '⚔️',
                description: '近战坦克，高生命值和防御力',
                baseStats: { hp: 120, mp: 30, atk: 15, def: 10, spd: 8, crit: 3 },
                growth: { hp: 15, mp: 3, atk: 3, def: 2, spd: 1, crit: 0.5 },
                skills: [
                    { id: 'slash', name: '斩击', icon: '⚔️', cost: 10, damage: 1.5, description: '造成150%攻击力的伤害' },
                    { id: 'shield_bash', name: '盾击', icon: '🛡️', cost: 15, damage: 1.2, stun: true, description: '造成120%攻击力的伤害并眩晕' },
                    { id: 'war_cry', name: '战吼', icon: '📢', cost: 20, buff: 'atk', value: 1.3, description: '提升30%攻击力' }
                ]
            },
            {
                id: 'mage',
                name: '法师',
                icon: '🔮',
                description: '远程输出，高魔法攻击和范围伤害',
                baseStats: { hp: 70, mp: 100, atk: 8, def: 5, spd: 10, crit: 5 },
                growth: { hp: 8, mp: 10, atk: 2, def: 1, spd: 1, crit: 0.5 },
                skills: [
                    { id: 'fireball', name: '火球术', icon: '🔥', cost: 20, damage: 2.0, description: '造成200%魔法攻击的伤害' },
                    { id: 'ice_spike', name: '冰锥', icon: '❄️', cost: 15, damage: 1.5, slow: true, description: '造成150%魔法攻击的伤害并减速' },
                    { id: 'lightning', name: '雷电', icon: '⚡', cost: 25, damage: 2.5, description: '造成250%魔法攻击的伤害' }
                ]
            },
            {
                id: 'rogue',
                name: '盗贼',
                icon: '🗡️',
                description: '敏捷刺客，高暴击和闪避',
                baseStats: { hp: 90, mp: 50, atk: 12, def: 6, spd: 15, crit: 10 },
                growth: { hp: 10, mp: 5, atk: 2.5, def: 1, spd: 2, crit: 1 },
                skills: [
                    { id: 'backstab', name: '背刺', icon: '🗡️', cost: 15, damage: 2.0, critBonus: 50, description: '造成200%伤害，暴击率+50%' },
                    { id: 'poison', name: '毒刃', icon: '☠️', cost: 10, damage: 1.2, poison: true, description: '造成120%伤害并施加中毒' },
                    { id: 'smoke_bomb', name: '烟雾弹', icon: '💨', cost: 20, dodge: true, description: '提高闪避率' }
                ]
            },
            {
                id: 'priest',
                name: '牧师',
                icon: '✨',
                description: '治疗辅助，恢复和增益技能',
                baseStats: { hp: 80, mp: 80, atk: 6, def: 8, spd: 9, crit: 2 },
                growth: { hp: 9, mp: 8, atk: 1.5, def: 1.5, spd: 1, crit: 0.3 },
                skills: [
                    { id: 'heal', name: '治疗术', icon: '💚', cost: 15, heal: 0.3, description: '恢复30%最大生命值' },
                    { id: 'blessing', name: '祝福', icon: '✨', cost: 20, buff: 'all', value: 1.2, description: '提升全属性20%' },
                    { id: 'smite', name: '圣击', icon: '⚡', cost: 18, damage: 1.8, holy: true, description: '造成180%魔法攻击的神圣伤害' }
                ]
            }
        ];
    }

    // 获取所有职业
    getClasses() {
        return this.classes;
    }

    // 获取职业信息
    getClass(classId) {
        return this.classes.find(c => c.id === classId);
    }

    // 渲染职业列表
    renderClassList() {
        const classSelectionEl = document.getElementById('class-selection');
        if (!classSelectionEl) return;

        classSelectionEl.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                ${this.classes.map(cls => `
                    <div class="panel" style="margin-bottom: 0; cursor: pointer; transition: all 0.3s;" onclick="classSystem.showClassDetails('${cls.id}')">
                        <div style="font-size: 40px; text-align: center; margin-bottom: 10px;">${cls.icon}</div>
                        <div style="font-weight: bold; text-align: center; font-size: 16px; margin-bottom: 5px;">${cls.name}</div>
                        <div style="font-size: 12px; color: var(--text-secondary); text-align: center;">${cls.description}</div>
                    </div>
                `).join('')}
            </div>
        `;

        // 渲染技能树
        this.renderSkillTree();
    }

    // 显示职业详情
    showClassDetails(classId) {
        const cls = this.getClass(classId);
        if (!cls) return;

        alert(`${cls.name}\n\n${cls.description}\n\n基础属性:\n生命: ${cls.baseStats.hp}\n魔法: ${cls.baseStats.mp}\n攻击: ${cls.baseStats.atk}\n防御: ${cls.baseStats.def}\n速度: ${cls.baseStats.spd}\n暴击: ${cls.baseStats.crit}%`);
    }

    // 渲染技能树
    renderSkillTree() {
        const skillTreeDisplayEl = document.getElementById('skill-tree-display');
        if (!skillTreeDisplayEl) return;

        // 获取当前玩家的职业
        const playerClass = window.game && game.player ? game.player.class : null;
        const currentClass = this.getClass(playerClass);

        if (!currentClass) {
            skillTreeDisplayEl.innerHTML = '<div class="story-text">请先创建角色</div>';
            return;
        }

        skillTreeDisplayEl.innerHTML = currentClass.skills.map((skill, index) => `
            <div class="skill-node ${index < 1 ? 'unlocked' : 'locked'}">
                <div class="skill-icon">${skill.icon}</div>
                <div class="skill-name">${skill.name}</div>
                <div class="skill-level">MP: ${skill.cost}</div>
                <div style="font-size: 10px; color: var(--text-secondary); margin-top: 5px;">${skill.description}</div>
            </div>
        `).join('');
    }
}
