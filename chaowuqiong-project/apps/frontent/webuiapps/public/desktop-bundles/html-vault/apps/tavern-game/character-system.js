// ========== 角色系统 ==========

class CharacterSystem {
    constructor() {
        this.isInitialized = false;
    }

    // 初始化角色系统
    init() {
        this.isInitialized = true;
    }

    // 创建新角色
    createNewCharacter(classType, name) {
        const classData = GameData.classes[classType];
        if (!classData) {
            console.error('未找到职业:', classType);
            return null;
        }

        const character = {
            name: name || "勇者",
            class: classType,
            level: 1,
            exp: 0,
            expToNext: 100,
            gold: 100,
            diamonds: 0,
            
            // 基础属性
            maxHp: 100 + classData.bonuses.hp,
            hp: 100 + classData.bonuses.hp,
            maxMp: 50 + classData.bonuses.mp,
            mp: 50 + classData.bonuses.mp,
            atk: 10 + classData.bonuses.atk,
            def: 5 + classData.bonuses.def,
            spd: 10 + classData.bonuses.spd,
            crit: 5 + classData.bonuses.crit,
            
            // 战斗状态
            defending: false,
            armor: 0,
            energy: 3,
            maxEnergy: 3,
            
            // 技能
            skills: [...classData.skills],
            
            // 装备
            equipment: {
                main_hand: null,
                off_hand: null,
                body: null,
                accessory: null
            },
            
            // 物品栏
            inventory: [],
            
            // 任务
            quests: [],
            
            // 已解锁内容
            unlockedLocations: ['tavern', 'village'],
            unlockedSkills: [...classData.skills],
            
            // 统计
            stats: {
                battlesWon: 0,
                battlesLost: 0,
                monstersKilled: 0,
                questsCompleted: 0,
                goldEarned: 0
            }
        };

        return character;
    }

    // 更新角色面板
    updateCharacterPanel() {
        const player = game.player;
        if (!player) return;

        // 基本信息
        document.getElementById('char-panel-name').textContent = player.name;
        const classData = GameData.classes[player.class];
        document.getElementById('char-panel-class').textContent = `职业：${classData ? classData.name : '未知'}`;
        document.getElementById('char-panel-level').textContent = `等级：${player.level}`;

        // 属性
        document.getElementById('stat-hp').textContent = `${player.hp}/${player.maxHp}`;
        document.getElementById('stat-mp').textContent = `${player.mp}/${player.maxMp}`;
        document.getElementById('stat-atk').textContent = player.atk;
        document.getElementById('stat-def').textContent = player.def;
        document.getElementById('stat-spd').textContent = player.spd;
        document.getElementById('stat-crit').textContent = `${player.crit}%`;

        // 技能
        this.renderSkills(player.skills);

        // 装备
        this.renderEquipment(player.equipment);

        // 天赋（示例）
        this.renderAbilities();
    }

    // 渲染技能
    renderSkills(skills) {
        const skillPanel = document.getElementById('skill-panel');
        if (!skillPanel) return;

        skillPanel.innerHTML = '';

        skills.forEach(skillId => {
            const skillData = GameData.skills[skillId];
            if (!skillData) return;

            const skillElement = document.createElement('div');
            skillElement.className = 'skill-icon';
            skillElement.innerHTML = `<div style="font-size: 2rem;">${skillData.icon}</div>`;
            skillElement.title = `${skillData.name}\n${skillData.description}`;
            skillPanel.appendChild(skillElement);
        });
    }

    // 渲染装备
    renderEquipment(equipment) {
        const equipmentPanel = document.getElementById('equipment-panel');
        if (!equipmentPanel) return;

        equipmentPanel.innerHTML = '';

        const slots = [
            { id: 'main_hand', name: '主手', icon: '⚔️' },
            { id: 'off_hand', name: '副手', icon: '🛡️' },
            { id: 'body', name: '身体', icon: '🦺' },
            { id: 'accessory', name: '饰品', icon: '💍' }
        ];

        slots.forEach(slot => {
            const slotElement = document.createElement('div');
            slotElement.className = 'equipment-slot';
            
            const equippedItem = equipment[slot.id];
            if (equippedItem) {
                const itemData = GameData.items[equippedItem];
                slotElement.innerHTML = `<div style="font-size: 2rem;">${itemData ? itemData.icon : '❓'}</div>`;
                slotElement.title = itemData ? itemData.name : '未知物品';
            } else {
                slotElement.innerHTML = `<div style="font-size: 2rem;">${slot.icon}</div>`;
                slotElement.title = `${slot.name}（空）`;
            }

            slotElement.addEventListener('click', () => this.showEquipmentMenu(slot.id));
            equipmentPanel.appendChild(slotElement);
        });
    }

    // 渲染天赋
    renderAbilities() {
        const abilityPanel = document.getElementById('ability-panel');
        if (!abilityPanel) return;

        abilityPanel.innerHTML = '';

        // 根据职业显示天赋
        const abilities = this.getClassAbilities(game.player.class);
        
        abilities.forEach(ability => {
            const abilityElement = document.createElement('div');
            abilityElement.className = 'ability-icon';
            abilityElement.innerHTML = `<div style="font-size: 2rem;">${ability.icon}</div>`;
            abilityElement.title = `${ability.name}\n${ability.description}`;
            abilityPanel.appendChild(abilityElement);
        });
    }

    // 获取职业天赋
    getClassAbilities(playerClass) {
        const abilities = {
            warrior: [
                { name: '战斗精通', icon: '💪', description: '攻击力+10%' },
                { name: '坚韧', icon: '🛡️', description: '防御力+10%' }
            ],
            mage: [
                { name: '魔力充盈', icon: '🔮', description: '魔法值+20%' },
                { name: '元素亲和', icon: '✨', description: '魔法伤害+10%' }
            ],
            rogue: [
                { name: '暗影步', icon: '👤', description: '闪避率+10%' },
                { name:致命一击', icon: '⚔️', description: '暴击伤害+20%' }
            ],
            priest: [
                { name: '神圣之盾', icon: '✨', description: '受到伤害减少10%' },
                { name: '祝福', icon: '💚', description: '治疗效果+15%' }
            ],
            archer: [
                { name: '鹰眼', icon: '🎯', description: '命中率+15%' },
                { name: '连射', icon: '🏹', description: '攻击速度+10%' }
            ]
        };

        return abilities[playerClass] || [];
    }

    // 装备物品
    equipItem(itemId, slot) {
        const itemData = GameData.items[itemId];
        if (!itemData) return;

        // 检查是否是正确的装备槽
        if (itemData.slot !== slot) {
            game.showNotification('该物品不能装备到此槽位', 'error');
            return;
        }

        // 卸下当前装备
        const currentItem = game.player.equipment[slot];
        if (currentItem) {
            this.unequipItem(slot);
        }

        // 装备新物品
        game.player.equipment[slot] = itemId;
        
        // 应用物品属性
        if (itemData.stats) {
            Object.entries(itemData.stats).forEach(([stat, value]) => {
                game.player[stat] += value;
                if (stat === 'hp') game.player.maxHp += value;
                if (stat === 'mp') game.player.maxMp += value;
            });
        }

        game.showNotification(`装备了 ${itemData.name}`, 'success');
        audioSystem.playSound('item');
        game.updateUI();
    }

    // 卸下装备
    unequipItem(slot) {
        const itemId = game.player.equipment[slot];
        if (!itemId) return;

        const itemData = GameData.items[itemId];
        if (!itemData) return;

        // 移除物品属性
        if (itemData.stats) {
            Object.entries(itemData.stats).forEach(([stat, value]) => {
                game.player[stat] -= value;
                if (stat === 'hp') {
                    game.player.maxHp -= value;
                    game.player.hp = Math.min(game.player.hp, game.player.maxHp);
                }
                if (stat === 'mp') {
                    game.player.maxMp -= value;
                    game.player.mp = Math.min(game.player.mp, game.player.maxMp);
                }
            });
        }

        game.player.equipment[slot] = null;
        game.player.inventory.push(itemId);

        game.showNotification(`卸下了 ${itemData.name}`, 'info');
        audioSystem.playSound('item');
        game.updateUI();
    }

    // 显示装备菜单
    showEquipmentMenu(slot) {
        // 实现装备选择菜单
        const availableItems = game.player.inventory.filter(itemId => {
            const itemData = GameData.items[itemId];
            return itemData && itemData.slot === slot;
        });

        if (availableItems.length === 0) {
            game.showNotification('该槽位没有可用装备', 'info');
            return;
        }

        let message = `选择${slot}装备：\n\n`;
        availableItems.forEach(itemId => {
            const itemData = GameData.items[itemId];
            message += `${itemData.icon} ${itemData.name}\n${itemData.description}\n\n`;
        });

        // 这里可以显示一个选择对话框
        console.log(message);
    }

    // 计算总属性（包含装备加成）
    calculateTotalStats(character) {
        const stats = {
            hp: character.maxHp,
            mp: character.maxMp,
            atk: character.atk,
            def: character.def,
            spd: character.spd,
            crit: character.crit
        };

        // 添加装备属性
        Object.values(character.equipment).forEach(itemId => {
            if (!itemId) return;
            const itemData = GameData.items[itemId];
            if (itemData && itemData.stats) {
                Object.entries(itemData.stats).forEach(([stat, value]) => {
                    stats[stat] += value;
                });
            }
        });

        return stats;
    }

    // 角色状态重置
    resetStatus(character) {
        character.hp = character.maxHp;
        character.mp = character.maxMp;
        character.defending = false;
        character.armor = 0;
        character.energy = character.maxEnergy;
    }
}

// 创建全局角色系统实例
const characterSystem = new CharacterSystem();
