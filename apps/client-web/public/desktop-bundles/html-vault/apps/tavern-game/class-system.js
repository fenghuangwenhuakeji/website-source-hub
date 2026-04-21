// ========== 职业系统 ==========

class ClassSystem {
    constructor() {
        this.isInitialized = false;
    }

    // 初始化职业系统
    init() {
        this.isInitialized = true;
    }

    // 获取所有职业
    getAllClasses() {
        return Object.entries(GameData.classes).map(([id, classData]) => ({
            id,
            ...classData
        }));
    }

    // 渲染职业列表
    renderClassList() {
        const container = document.getElementById('class-list');
        if (!container) return;

        container.innerHTML = '';

        const classes = this.getAllClasses();

        classes.forEach(classInfo => {
            const classElement = document.createElement('div');
            classElement.className = 'class-card';
            if (classInfo.id === game.player.class) {
                classElement.classList.add('active');
            }

            classElement.innerHTML = `
                <div class="class-icon">${classInfo.icon}</div>
                <h3>${classInfo.name}</h3>
                <p>${classInfo.description}</p>
                <div class="class-bonuses">
                    ${this.renderClassBonuses(classInfo.bonuses)}
                </div>
            `;

            classElement.addEventListener('click', () => this.selectClass(classInfo.id));
            container.appendChild(classElement);
        });
    }

    // 渲染职业加成
    renderClassBonuses(bonuses) {
        const bonusText = [];
        
        if (bonuses.hp > 0) bonusText.push(`❤️ 生命 +${bonuses.hp}`);
        if (bonuses.mp > 0) bonusText.push(`⚡ 魔法 +${bonuses.mp}`);
        if (bonuses.atk > 0) bonusText.push(`⚔️ 攻击 +${bonuses.atk}`);
        if (bonuses.def > 0) bonusText.push(`🛡️ 防御 +${bonuses.def}`);
        if (bonuses.spd > 0) bonusText.push(`💨 速度 +${bonuses.spd}`);
        if (bonuses.crit > 0) bonusText.push(`🎯 暴击 +${bonuses.crit}%`);

        return bonusText.map(text => `<span>${text}</span>`).join('');
    }

    // 选择职业
    selectClass(classId) {
        if (classId === game.player.class) {
            game.showNotification('你已经选择了这个职业', 'info');
            return;
        }

        const classData = GameData.classes[classId];
        if (!classData) {
            console.error('未找到职业:', classId);
            return;
        }

        if (confirm(`确定要转职为 ${classData.name} 吗？\n这将保留你的等级，但会改变技能和属性加成。`)) {
            this.changeClass(classId);
        }
    }

    // 转换职业
    changeClass(newClassId) {
        const oldClass = game.player.class;
        const oldClassData = GameData.classes[oldClass];
        const newClassData = GameData.classes[newClassId];

        // 移除旧职业的属性加成
        if (oldClassData && oldClassData.bonuses) {
            game.player.maxHp -= oldClassData.bonuses.hp;
            game.player.maxMp -= oldClassData.bonuses.mp;
            game.player.atk -= oldClassData.bonuses.atk;
            game.player.def -= oldClassData.bonuses.def;
            game.player.spd -= oldClassData.bonuses.spd;
            game.player.crit -= oldClassData.bonuses.crit;
        }

        // 应用新职业的属性加成
        if (newClassData && newClassData.bonuses) {
            game.player.maxHp += newClassData.bonuses.hp;
            game.player.maxMp += newClassData.bonuses.mp;
            game.player.atk += newClassData.bonuses.atk;
            game.player.def += newClassData.bonuses.def;
            game.player.spd += newClassData.bonuses.spd;
            game.player.crit += newClassData.bonuses.crit;
        }

        // 更新职业
        game.player.class = newClassId;

        // 更新技能
        game.player.skills = [...newClassData.skills];
        game.player.unlockedSkills = [...newClassData.skills];

        // 更新装备（移除不兼容的装备）
        this.incompatibleEquipment(newClassId);

        // 确保生命和魔法不超过最大值
        game.player.hp = Math.min(game.player.hp, game.player.maxHp);
        game.player.mp = Math.min(game.player.mp, game.player.maxMp);

        // 播放音效
        audioSystem.playSound('magic');
        game.showNotification(`成功转职为 ${newClassData.name}！`, 'success');

        // 更新UI
        this.renderClassList();
        game.updateUI();
    }

    // 检查不兼容的装备
    incompatibleEquipment(newClassId) {
        const classData = GameData.classes[newClassId];
        if (!classData || !classData.equipment) return;

        // 移除不属于新职业的装备
        Object.keys(game.player.equipment).forEach(slot => {
            const equippedItemId = game.player.equipment[slot];
            if (!equippedItemId) return;

            const itemData = GameData.items[equippedItemId];
            if (!itemData) return;

            // 检查装备是否属于该职业
            if (!classData.equipment.includes(equippedItemId)) {
                // 卸下装备
                characterSystem.unequipItem(slot);
                game.showNotification(`${itemData.name} 已卸下（与新职业不兼容）`, 'info');
            }
        });
    }

    // 获取职业详情
    getClassDetails(classId) {
        const classData = GameData.classes[classId];
        if (!classData) return null;

        return {
            ...classData,
            skills: classData.skills.map(skillId => GameData.skills[skillId])
        };
    }

    // 职业进阶（预留功能）
    advanceClass(classId) {
        // 可以实现职业进阶系统
        // 例如：战士 → 圣骑士 / 狂战士
        game.showNotification('职业进阶功能开发中...', 'info');
    }

    // 职业树（预留功能）
    getClassTree() {
        return {
            warrior: {
                base: 'warrior',
                advanced: ['paladin', 'berserker']
            },
            mage: {
                base: 'mage',
                advanced: ['wizard', 'sorcerer']
            },
            rogue: {
                base: 'rogue',
                advanced: ['assassin', 'ranger']
            },
            priest: {
                base: 'priest',
                advanced: ['cleric', 'monk']
            },
            archer: {
                base: 'archer',
                advanced: ['sniper', 'hunter']
            }
        };
    }
}

// 创建全局职业系统实例
const classSystem = new ClassSystem();
