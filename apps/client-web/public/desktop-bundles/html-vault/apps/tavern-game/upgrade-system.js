// ========== 升级系统 ==========

class UpgradeSystem {
    constructor() {
        this.skillPoints = 0;
        this.isInitialized = false;
    }

    // 初始化升级系统
    init() {
        this.isInitialized = true;
    }

    // 检查是否可以升级
    checkLevelUp(player) {
        while (player.exp >= player.expToNext) {
            this.levelUp(player);
        }
    }

    // 升级
    levelUp(player) {
        player.exp -= player.expToNext;
        player.level++;
        this.skillPoints += 2;
        player.expToNext = Math.floor(player.expToNext * 1.5);

        // 基础属性提升
        player.maxHp += 10;
        player.maxMp += 5;
        player.atk += 2;
        player.def += 1;
        player.spd += 1;

        // 恢复生命和魔法
        player.hp = player.maxHp;
        player.mp = player.maxMp;

        // 播放升级音效
        audioSystem.playLevelUp();

        // 显示通知
        game.showNotification(`升级！现在是 ${player.level} 级！获得 2 技能点`, 'success');

        // 更新UI
        this.updateUpgradeUI();
        game.updateUI();
    }

    // 升级属性
    upgradeStat(stat) {
        if (this.skillPoints <= 0) {
            game.showNotification('技能点不足！', 'error');
            audioSystem.playSound('error');
            return;
        }

        const statIncreases = {
            hp: 10,
            mp: 5,
            atk: 2,
            def: 2,
            spd: 1,
            crit: 1
        };

        if (!statIncreases[stat]) {
            console.error('未知的属性:', stat);
            return;
        }

        const increase = statIncreases[stat];
        this.skillPoints--;

        if (stat === 'hp') {
            game.player.maxHp += increase;
            game.player.hp += increase;
        } else if (stat === 'mp') {
            game.player.maxMp += increase;
            game.player.mp += increase;
        } else if (stat === 'crit') {
            game.player.crit += increase;
        } else {
            game.player[stat] += increase;
        }

        audioSystem.playSound('item');
        game.showNotification(`${stat.toUpperCase()} +${increase}！`, 'success');
        
        this.updateUpgradeUI();
        game.updateUI();
    }

    // 学习技能
    learnSkill(skillId) {
        if (this.skillPoints < 3) {
            game.showNotification('技能点不足（需要3点）！', 'error');
            audioSystem.playSound('error');
            return;
        }

        if (game.player.skills.includes(skillId)) {
            game.showNotification('已经学会这个技能了！', 'warning');
            return;
        }

        const skillData = GameData.skills[skillId];
        if (!skillData) {
            console.error('未找到技能:', skillId);
            return;
        }

        this.skillPoints -= 3;
        game.player.skills.push(skillId);
        game.player.unlockedSkills.push(skillId);

        audioSystem.playSound('magic');
        game.showNotification(`学会了 ${skillData.name}！`, 'success');

        this.updateUpgradeUI();
        game.updateUI();
    }

    // 获取可学习的技能
    getLearnableSkills() {
        const classData = GameData.classes[game.player.class];
        if (!classData) return [];

        // 获取职业相关技能
        const classSkills = Object.entries(GameData.skills)
            .filter(([id, skill]) => {
                // 这里可以根据职业、等级等条件过滤
                return !game.player.skills.includes(id);
            })
            .map(([id, skill]) => ({ id, ...skill }));

        return classSkills;
    }

    // 更新升级界面
    updateUpgradeUI() {
        if (!document.getElementById('upgrade-view').classList.contains('active')) {
            return;
        }

        document.getElementById('upgrade-level').textContent = game.player.level;
        document.getElementById('skill-points').textContent = this.skillPoints;

        // 渲染可学习的技能
        this.renderLearnableSkills();
    }

    // 渲染可学习的技能
    renderLearnableSkills() {
        const container = document.getElementById('learn-skills');
        if (!container) return;

        container.innerHTML = '';

        const learnableSkills = this.getLearnableSkills();

        if (learnableSkills.length === 0) {
            container.innerHTML = '<p>没有可学习的技能</p>';
            return;
        }

        learnableSkills.forEach(skill => {
            const skillElement = document.createElement('div');
            skillElement.className = 'learnable-skill';
            skillElement.innerHTML = `
                <div style="font-size: 2rem;">${skill.icon}</div>
                <div style="font-weight: bold;">${skill.name}</div>
                <div style="font-size: 0.8rem;">${skill.description}</div>
                <div style="font-size: 0.8rem; color: #fdcb6e;">消耗: 3 技能点</div>
            `;
            
            if (this.skillPoints >= 3) {
                skillElement.addEventListener('click', () => this.learnSkill(skill.id));
                skillElement.style.cursor = 'pointer';
            } else {
                skillElement.style.opacity = '0.5';
                skillElement.style.cursor = 'not-allowed';
            }

            container.appendChild(skillElement);
        });
    }

    // 重置技能点
    resetSkillPoints() {
        if (confirm('确定要重置技能点吗？这将返还所有已使用的技能点。')) {
            // 计算已使用的技能点
            const usedPoints = this.calculateUsedSkillPoints();
            
            this.skillPoints += usedPoints;
            
            // 重置属性加成（保留基础属性）
            const baseStats = this.getBaseStats();
            game.player.maxHp = baseStats.hp;
            game.player.maxMp = baseStats.mp;
            game.player.atk = baseStats.atk;
            game.player.def = baseStats.def;
            game.player.spd = baseStats.spd;
            game.player.crit = baseStats.crit;
            
            game.player.hp = game.player.maxHp;
            game.player.mp = game.player.maxMp;

            game.showNotification('技能点已重置！', 'success');
            audioSystem.playSound('item');
            
            this.updateUpgradeUI();
            game.updateUI();
        }
    }

    // 计算已使用的技能点
    calculateUsedSkillPoints() {
        // 这里可以根据实际实现计算
        return 0;
    }

    // 获取基础属性（未升级前）
    getBaseStats() {
        const classData = GameData.classes[game.player.class];
        const level = game.player.level;

        return {
            hp: 100 + classData.bonuses.hp + (level - 1) * 10,
            mp: 50 + classData.bonuses.mp + (level - 1) * 5,
            atk: 10 + classData.bonuses.atk + (level - 1) * 2,
            def: 5 + classData.bonuses.def + (level - 1) * 1,
            spd: 10 + classData.bonuses.spd + (level - 1) * 1,
            crit: 5 + classData.bonuses.crit
        };
    }
}

// 创建全局升级系统实例
const upgradeSystem = new UpgradeSystem();
