// ========== 战斗系统 ==========

class BattleSystem {
    constructor() {
        this.inBattle = false;
        this.currentEnemy = null;
        this.turn = 0;
        this.battleLog = [];
        this.playerEnergy = 3;
        this.maxEnergy = 3;
        this.isPlayerTurn = true;
        this.battleAnimationId = null;
    }

    // 开始战斗
    startBattle(monsterId) {
        const monsterData = GameData.monsters[monsterId];
        if (!monsterData) return;

        this.inBattle = true;
        this.currentEnemy = {
            ...monsterData,
            maxHp: monsterData.hp,
            currentHp: monsterData.hp
        };
        this.turn = 0;
        this.playerEnergy = this.maxEnergy;
        this.isPlayerTurn = true;
        this.battleLog = [];

        // 切换到战斗视图
        game.switchView('battle');
        
        // 更新战斗UI
        this.updateBattleUI();
        
        // 播放战斗开始音效
        audioSystem.playBattleStart();
        
        // 显示战斗开始通知
        game.showNotification(`遭遇 ${this.currentEnemy.name}！`, 'warning');
        
        // 开始战斗循环
        this.startBattleLoop();
    }

    // 开始战斗循环
    startBattleLoop() {
        const battleLoop = () => {
            if (!this.inBattle) return;

            if (this.isPlayerTurn) {
                // 等待玩家行动
            } else {
                // 敌人行动
                setTimeout(() => this.enemyAction(), 1000);
            }

            this.battleAnimationId = requestAnimationFrame(battleLoop);
        };
        
        battleLoop();
    }

    // 玩家攻击
    attack() {
        if (!this.isPlayerTurn || this.playerEnergy < 1) {
            audioSystem.playSound('error');
            return;
        }

        this.playerEnergy--;
        const damage = this.calculateDamage(game.player, this.currentEnemy);
        this.currentEnemy.currentHp -= damage;

        this.addBattleLog(`${game.player.name} 攻击造成 ${damage} 点伤害！`);
        audioSystem.playSound('attack');
        this.showDamageEffect(damage, 'player');

        this.updateBattleUI();
        this.checkBattleEnd();

        if (this.inBattle) {
            this.endPlayerTurn();
        }
    }

    // 显示技能菜单
    showSkills() {
        if (!this.isPlayerTurn) return;

        const skillMenu = document.getElementById('skill-menu');
        const mainMenu = document.getElementById('battle-menu');
        const skillList = document.getElementById('skill-list');

        skillMenu.classList.remove('hidden');
        mainMenu.classList.add('hidden');

        skillList.innerHTML = '';

        // 获取玩家技能
        const playerSkills = this.getPlayerSkills();
        playerSkills.forEach(skill => {
            const skillData = GameData.skills[skill];
            if (!skillData) return;

            const skillElement = document.createElement('div');
            skillElement.className = 'skill-item';
            skillElement.innerHTML = `
                <div style="font-size: 2rem;">${skillData.icon}</div>
                <div>${skillData.name}</div>
                <div style="font-size: 0.8rem;">消耗: ${skillData.cost} MP</div>
            `;
            skillElement.addEventListener('click', () => this.useSkill(skill));
            skillList.appendChild(skillElement);
        });
    }

    // 获取玩家技能
    getPlayerSkills() {
        const classData = GameData.classes[game.player.class];
        return classData ? classData.skills : [];
    }

    // 使用技能
    useSkill(skillId) {
        if (!this.isPlayerTurn) return;

        const skillData = GameData.skills[skillId];
        if (!skillData) return;

        if (game.player.mp < skillData.cost) {
            game.showNotification('魔法不足！', 'error');
            audioSystem.playSound('error');
            return;
        }

        game.player.mp -= skillData.cost;
        const result = skillData.effect(game.player, this.currentEnemy);

        this.addBattleLog(result.message);
        audioSystem.playSound('magic');

        this.updateBattleUI();
        this.checkBattleEnd();

        if (this.inBattle) {
            this.showMainMenu();
            this.endPlayerTurn();
        }
    }

    // 显示卡牌菜单
    showCards() {
        if (!this.isPlayerTurn) return;

        const cardMenu = document.getElementById('card-menu');
        const mainMenu = document.getElementById('battle-menu');
        const cardHand = document.getElementById('card-hand');

        cardMenu.classList.remove('hidden');
        mainMenu.classList.add('hidden');

        cardHand.innerHTML = '';

        // 获取玩家手牌
        const handCards = cardSystem.getHandCards();
        handCards.forEach(card => {
            const cardData = GameData.cards[card.id];
            if (!cardData) return;

            const cardElement = document.createElement('div');
            cardElement.className = 'battle-card';
            cardElement.innerHTML = `
                <div class="card-icon">${cardData.icon}</div>
                <div class="card-name">${cardData.name}</div>
                <div class="card-cost">消耗: ${cardData.cost}</div>
            `;
            cardElement.addEventListener('click', () => this.playCard(card));
            cardHand.appendChild(cardElement);
        });
    }

    // 打出卡牌
    playCard(card) {
        if (!this.isPlayerTurn || this.playerEnergy < card.cost) {
            audioSystem.playSound('error');
            return;
        }

        this.playerEnergy -= card.cost;
        const cardData = GameData.cards[card.id];
        if (!cardData) return;

        const result = cardData.effect(game.player, this.currentEnemy);

        if (result.type === 'damage') {
            this.addBattleLog(`${game.player.name} 使用 ${cardData.name} 造成 ${result.value} 点伤害！`);
            audioSystem.playSound('attack');
        } else if (result.type === 'heal') {
            this.addBattleLog(`${game.player.name} 使用 ${cardData.name} 恢复 ${result.value} 点生命！`);
            audioSystem.playSound('heal');
        } else if (result.type === 'buff') {
            this.addBattleLog(`${game.player.name} 使用 ${cardData.name}！`);
            audioSystem.playSound('buff');
        }

        // 从手牌中移除
        cardSystem.removeCard(card);

        this.updateBattleUI();
        this.checkBattleEnd();

        if (this.inBattle) {
            this.showMainMenu();
            this.endPlayerTurn();
        }
    }

    // 防御
    defend() {
        if (!this.isPlayerTurn) return;

        game.player.defending = true;
        game.player.armor = (game.player.armor || 0) + 10;

        this.addBattleLog(`${game.player.name} 进入防御姿态！`);
        audioSystem.playSound('block');

        this.updateBattleUI();
        this.endPlayerTurn();
    }

    // 使用物品
    useItem() {
        // 实现物品使用逻辑
        game.showNotification('物品系统开发中...', 'info');
    }

    // 逃跑
    flee() {
        if (!this.isPlayerTurn) return;

        const fleeChance = 0.5 + (game.player.spd - this.currentEnemy.spd) * 0.02;
        
        if (Math.random() < fleeChance) {
            game.showNotification('逃跑成功！', 'success');
            audioSystem.playSound('click');
            this.endBattle(false);
        } else {
            this.addBattleLog('逃跑失败！');
            audioSystem.playSound('error');
            this.endPlayerTurn();
        }
    }

    // 显示主菜单
    showMainMenu() {
        document.getElementById('skill-menu').classList.add('hidden');
        document.getElementById('card-menu').classList.add('hidden');
        document.getElementById('battle-menu').classList.remove('hidden');
    }

    // 敌人行动
    enemyAction() {
        if (!this.inBattle || !this.currentEnemy) return;

        // 检查敌人状态
        if (this.currentEnemy.stunned) {
            this.addBattleLog(`${this.currentEnemy.name} 被眩晕了！`);
            this.currentEnemy.stunned = false;
        } else {
            // 随机选择行动
            const actions = ['attack'];
            if (this.currentEnemy.skills && this.currentEnemy.skills.length > 0) {
                actions.push('skill');
            }

            const action = actions[Math.floor(Math.random() * actions.length)];

            if (action === 'attack') {
                this.enemyAttack();
            } else {
                this.enemySkill();
            }

            // 处理持续伤害效果
            if (this.currentEnemy.poisoned) {
                const poisonDamage = 5;
                this.currentEnemy.currentHp -= poisonDamage;
                this.addBattleLog(`${this.currentEnemy.name} 受到 ${poisonDamage} 点毒伤害！`);
            }
        }

        this.updateBattleUI();
        this.checkBattleEnd();

        if (this.inBattle) {
            this.startPlayerTurn();
        }
    }

    // 敌人攻击
    enemyAttack() {
        let damage = this.calculateDamage(this.currentEnemy, game.player);
        
        // 检查防御
        if (game.player.defending) {
            damage = Math.floor(damage * 0.5);
            game.player.defending = false;
        }

        // 检查护甲
        if (game.player.armor) {
            damage = Math.max(0, damage - game.player.armor);
            game.player.armor = 0;
        }

        game.player.hp -= damage;
        this.addBattleLog(`${this.currentEnemy.name} 攻击造成 ${damage} 点伤害！`);
        audioSystem.playSound('hit');
        this.showDamageEffect(damage, 'enemy');
    }

    // 敌人技能
    enemySkill() {
        const skills = this.currentEnemy.skills || [];
        if (skills.length === 0) {
            this.enemyAttack();
            return;
        }

        const skillId = skills[Math.floor(Math.random() * skills.length)];
        const skillData = GameData.monsterSkills[skillId];

        if (skillData && skillData.damage) {
            let damage = skillData.damage;
            if (game.player.defending) {
                damage = Math.floor(damage * 0.5);
                game.player.defending = false;
            }
            game.player.hp -= damage;
            this.addBattleLog(`${this.currentEnemy.name} 使用 ${skillData.name} 造成 ${damage} 点伤害！`);
            audioSystem.playSound('attack');
        } else {
            this.enemyAttack();
        }
    }

    // 结束玩家回合
    endPlayerTurn() {
        this.isPlayerTurn = false;
        this.turn++;
    }

    // 开始玩家回合
    startPlayerTurn() {
        this.isPlayerTurn = true;
        this.playerEnergy = this.maxEnergy;
        
        // 抽一张卡
        cardSystem.drawCard();
    }

    // 计算伤害
    calculateDamage(attacker, defender) {
        const baseDamage = Math.max(1, attacker.atk - Math.floor(defender.def / 2));
        
        // 暴击计算
        const critChance = (attacker.crit || 0) / 100;
        const isCrit = Math.random() < critChance;
        
        let finalDamage = baseDamage;
        if (isCrit) {
            finalDamage = Math.floor(baseDamage * 2);
            audioSystem.playSound('critical');
        }

        // 随机浮动
        finalDamage = Math.floor(finalDamage * (0.9 + Math.random() * 0.2));

        return Math.max(1, finalDamage);
    }

    // 检查战斗是否结束
    checkBattleEnd() {
        if (this.currentEnemy.currentHp <= 0) {
            this.endBattle(true);
        } else if (game.player.hp <= 0) {
            this.endBattle(false);
        }
    }

    // 结束战斗
    endBattle(victory) {
        this.inBattle = false;
        
        if (this.battleAnimationId) {
            cancelAnimationFrame(this.battleAnimationId);
        }

        if (victory) {
            // 胜利奖励
            const expGain = this.currentEnemy.exp;
            const goldGain = this.currentEnemy.gold;

            game.player.exp += expGain;
            game.player.gold += goldGain;

            // 检查升级
            game.checkLevelUp();

            audioSystem.playVictory();
            game.showNotification(`战斗胜利！获得 ${expGain} 经验和 ${goldGain} 金币！`, 'success');
            
            // 更新任务进度
            this.updateQuestProgress(this.currentEnemy);
        } else {
            audioSystem.playDefeat();
            game.showNotification('战斗失败...', 'error');
            
            // 失败惩罚
            game.player.hp = Math.floor(game.player.maxHp * 0.5);
            game.player.gold = Math.floor(game.player.gold * 0.9);
        }

        // 返回地图
        setTimeout(() => {
            game.switchView('map');
            game.updateUI();
        }, 2000);
    }

    // 更新任务进度
    updateQuestProgress(enemy) {
        game.player.quests.forEach(quest => {
            const questData = GameData.quests[quest.id];
            if (questData && questData.type === 'kill' && questData.target === enemy.icon) {
                quest.progress++;
                if (quest.progress >= questData.count) {
                    quest.completed = true;
                    game.showNotification(`任务完成：${questData.name}！`, 'success');
                    // 给予任务奖励
                    game.player.exp += questData.reward.exp;
                    game.player.gold += questData.reward.gold;
                    game.checkLevelUp();
                }
            }
        });
    }

    // 更新战斗UI
    updateBattleUI() {
        if (!this.currentEnemy) return;

        // 更新敌人信息
        document.getElementById('enemy-name').textContent = this.currentEnemy.name;
        document.getElementById('enemy-sprite').textContent = this.currentEnemy.icon;
        
        const hpPercent = (this.currentEnemy.currentHp / this.currentEnemy.maxHp) * 100;
        document.getElementById('enemy-hp-bar').style.width = `${hpPercent}%`;
        document.getElementById('enemy-hp-text').textContent = 
            `${Math.max(0, this.currentEnemy.currentHp)}/${this.currentEnemy.maxHp}`;

        // 更新玩家状态
        game.updateUI();
    }

    // 显示伤害效果
    showDamageEffect(damage, source) {
        const effectsContainer = document.getElementById('battle-effects');
        const damageText = document.createElement('div');
        damageText.textContent = `-${damage}`;
        damageText.style.color = source === 'player' ? '#ff6b6b' : '#74b9ff';
        damageText.style.fontSize = '3rem';
        damageText.style.fontWeight = 'bold';
        damageText.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
        
        effectsContainer.appendChild(damageText);

        setTimeout(() => {
            damageText.remove();
        }, 1000);
    }

    // 添加战斗日志
    addBattleLog(message) {
        this.battleLog.push(message);
        console.log(message); // 可以显示在战斗日志面板中
    }
}

// 创建全局战斗系统实例
const battleSystem = new BattleSystem();
