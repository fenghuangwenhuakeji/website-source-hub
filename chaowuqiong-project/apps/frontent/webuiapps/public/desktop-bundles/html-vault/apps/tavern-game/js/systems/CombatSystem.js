/**
 * 战斗系统 - 增强版
 * 管理战斗逻辑、敌人、战斗结算和战斗特效
 * 合并了RPG_TAVERN_GAME的完整功能
 */

export class CombatSystem {
    constructor(engine) {
        this.engine = engine;
        this.isInitialized = false;
        this.currentEnemy = null;
        this.turn = 0;
        this.isInCombat = false;
        this.enemies = [];
        this.playerEnergy = 3;
        this.maxEnergy = 3;
        this.isPlayerTurn = true;
        this.battleLog = [];
        this.battleAnimationId = null;
    }

    async init() {
        if (this.isInitialized) return;

        console.log('[CombatSystem] 初始化战斗系统...');

        // 初始化敌人数据
        this.initializeEnemies();

        this.isInitialized = true;
        console.log('[CombatSystem] 战斗系统初始化完成');
    }

    // 初始化敌人
    initializeEnemies() {
        this.enemies = [
            { id: 'slime', name: '史莱姆', icon: '💧', hp: 30, maxHp: 30, atk: 5, def: 2, exp: 20, gold: 10, spd: 5, crit: 0 },
            { id: 'goblin', name: '哥布林', icon: '👺', hp: 50, maxHp: 50, atk: 8, def: 4, exp: 40, gold: 25, spd: 8, crit: 5, skills: ['bite'] },
            { id: 'wolf', name: '野狼', icon: '🐺', hp: 60, maxHp: 60, atk: 10, def: 3, exp: 50, gold: 30, spd: 12, crit: 10 },
            { id: 'orc', name: '兽人', icon: '👹', hp: 100, maxHp: 100, atk: 15, def: 8, exp: 80, gold: 50, spd: 6, crit: 5, skills: ['smash'] },
            { id: 'skeleton', name: '骷髅', icon: '💀', hp: 70, maxHp: 70, atk: 12, def: 5, exp: 60, gold: 40, spd: 7, crit: 8 },
            { id: 'dragon', name: '幼龙', icon: '🐉', hp: 200, maxHp: 200, atk: 25, def: 15, exp: 200, gold: 150, spd: 10, crit: 15, skills: ['firebreath'] },
            { id: 'demon', name: '恶魔', icon: '👿', hp: 300, maxHp: 300, atk: 35, def: 20, exp: 300, gold: 250, spd: 8, crit: 20, skills: ['demonslash'] }
        ];

        // 怪物技能数据
        this.monsterSkills = {
            bite: { name: '撕咬', damage: 12, description: '造成12点伤害' },
            smash: { name: '重击', damage: 20, description: '造成20点伤害' },
            firebreath: { name: '龙息', damage: 35, description: '造成35点火焰伤害' },
            demonslash: { name: '恶魔斩', damage: 45, description: '造成45点黑暗伤害' }
        };
    }

    // 开始战斗
    startCombat(enemyId) {
        if (!window.game || !game.player) {
            game.showNotification('请先开始游戏', 'error');
            return;
        }

        const enemy = this.enemies.find(e => e.id === enemyId) || this.enemies[Math.floor(Math.random() * this.enemies.length)];
        this.currentEnemy = { ...enemy, currentHp: enemy.hp };
        this.turn = 0;
        this.isInCombat = true;
        this.playerEnergy = this.maxEnergy;
        this.isPlayerTurn = true;
        this.battleLog = [];
        game.state.inCombat = true;

        console.log(`[CombatSystem] 开始战斗: ${this.currentEnemy.name}`);
        game.showNotification(`遭遇了${this.currentEnemy.name}！`, 'warning');

        // 切换到战斗视图
        game.switchView('combat');

        // 更新战斗UI
        this.updateCombatUI();

        // 播放战斗音效
        if (window.audioSystem) {
            audioSystem.playSound('battle_start');
        }

        // 开始战斗循环
        this.startBattleLoop();
    }

    // 开始战斗循环
    startBattleLoop() {
        const battleLoop = () => {
            if (!this.isInCombat) return;

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
            if (window.audioSystem) audioSystem.playSound('error');
            return;
        }

        this.playerEnergy--;
        const damage = this.calculateDamage(game.player, this.currentEnemy);
        this.currentEnemy.currentHp -= damage;

        this.addBattleLog(`${game.player.name} 攻击造成 ${damage} 点伤害！`);
        if (window.audioSystem) audioSystem.playSound('attack');
        this.showDamageEffect(damage, 'player');

        this.updateCombatUI();
        this.checkBattleEnd();

        if (this.isInCombat) {
            this.endPlayerTurn();
        }
    }

    // 防御
    defend() {
        if (!this.isPlayerTurn) return;

        game.player.defending = true;
        game.player.armor = (game.player.armor || 0) + 10;

        this.addBattleLog(`${game.player.name} 进入防御姿态！`);
        if (window.audioSystem) audioSystem.playSound('block');

        this.updateCombatUI();
        this.endPlayerTurn();
    }

    // 使用技能
    useSkill(skillId) {
        if (!this.isPlayerTurn) return;

        const skillData = this.getSkillData(skillId);
        if (!skillData) return;

        if (game.player.mp < skillData.cost) {
            game.showNotification('魔法不足！', 'error');
            if (window.audioSystem) audioSystem.playSound('error');
            return;
        }

        game.player.mp -= skillData.cost;
        const damage = skillData.damage || 0;
        
        if (damage > 0) {
            this.currentEnemy.currentHp -= damage;
            this.addBattleLog(`${game.player.name} 使用 ${skillData.name} 造成 ${damage} 点伤害！`);
        } else {
            this.addBattleLog(`${game.player.name} 使用 ${skillData.name}！`);
        }

        if (window.audioSystem) audioSystem.playSound('magic');

        this.updateCombatUI();
        this.checkBattleEnd();

        if (this.isInCombat) {
            this.endPlayerTurn();
        }
    }

    // 获取技能数据
    getSkillData(skillId) {
        // 这里可以从游戏数据中获取技能信息
        const skills = {
            fireball: { name: '火球术', cost: 10, damage: 25, description: '造成25点火焰伤害' },
            heal: { name: '治疗术', cost: 15, damage: 0, heal: 30, description: '恢复30点生命值' },
            lightning: { name: '闪电链', cost: 20, damage: 35, description: '造成35点闪电伤害' }
        };
        return skills[skillId];
    }

    // 使用卡牌
    useCard(cardId) {
        if (!this.isPlayerTurn) return;

        // 这里实现卡牌使用逻辑
        game.showNotification('卡牌系统开发中...', 'info');
    }

    // 逃跑
    flee() {
        if (!this.isPlayerTurn) return;

        const fleeChance = 0.4 + (game.player.spd - this.currentEnemy.spd) * 0.02;

        if (Math.random() < fleeChance) {
            game.showNotification('逃跑成功！', 'success');
            if (window.audioSystem) audioSystem.playSound('click');
            this.endBattle(false);
        } else {
            this.addBattleLog('逃跑失败！');
            if (window.audioSystem) audioSystem.playSound('error');
            this.endPlayerTurn();
        }
    }

    // 敌人行动
    enemyAction() {
        if (!this.isInCombat || !this.currentEnemy) return;

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

        this.updateCombatUI();
        this.checkBattleEnd();

        if (this.isInCombat) {
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

        game.player.hp = Math.max(0, game.player.hp - damage);
        this.addBattleLog(`${this.currentEnemy.name} 攻击造成 ${damage} 点伤害！`);
        if (window.audioSystem) audioSystem.playSound('hit');
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
        const skillData = this.monsterSkills[skillId];

        if (skillData && skillData.damage) {
            let damage = skillData.damage;
            if (game.player.defending) {
                damage = Math.floor(damage * 0.5);
                game.player.defending = false;
            }
            if (game.player.armor) {
                damage = Math.max(0, damage - game.player.armor);
                game.player.armor = 0;
            }
            
            game.player.hp = Math.max(0, game.player.hp - damage);
            this.addBattleLog(`${this.currentEnemy.name} 使用 ${skillData.name} 造成 ${damage} 点伤害！`);
            if (window.audioSystem) audioSystem.playSound('attack');
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
        this.addBattleLog('你的回合');
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
            if (window.audioSystem) audioSystem.playSound('critical');
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
        this.isInCombat = false;
        game.state.inCombat = false;

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
            if (window.characterSystem) {
                characterSystem.checkLevelUp();
            }

            if (window.audioSystem) audioSystem.playSound('victory');
            game.showNotification(`战斗胜利！获得 ${expGain} 经验和 ${goldGain} 金币！`, 'success');
        } else {
            if (window.audioSystem) audioSystem.playSound('defeat');
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

    // 更新战斗UI
    updateCombatUI() {
        if (!this.currentEnemy || !game.player) return;

        // 更新敌人信息
        const enemyStatsEl = document.getElementById('view-enemy-combat');
        const playerStatsEl = document.getElementById('view-player-combat');

        if (enemyStatsEl) {
            const hpPercent = (this.currentEnemy.currentHp / this.currentEnemy.maxHp) * 100;
            enemyStatsEl.innerHTML = `
                <div class="combat-entity">
                    <div style="font-size: 40px; text-align: center; margin-bottom: 10px;">${this.currentEnemy.icon}</div>
                    <div class="entity-name" style="text-align: center;">${this.currentEnemy.name}</div>
                    <div class="stat-bar" style="margin-top: 10px;">
                        <div class="stat-bar-bg">
                            <div class="stat-bar-fill hp" style="width: ${hpPercent}%"></div>
                        </div>
                    </div>
                    <div class="entity-hp" style="text-align: center; margin-top: 5px;">
                        ${Math.max(0, this.currentEnemy.currentHp)}/${this.currentEnemy.maxHp}
                    </div>
                </div>
            `;
        }

        if (playerStatsEl) {
            const hpPercent = (game.player.hp / game.player.maxHp) * 100;
            const mpPercent = (game.player.mp / game.player.maxMp) * 100;
            playerStatsEl.innerHTML = `
                <div class="combat-entity">
                    <div style="font-size: 40px; text-align: center; margin-bottom: 10px;">👤</div>
                    <div class="entity-name" style="text-align: center;">${game.player.name}</div>
                    <div class="stat-bar" style="margin-top: 10px;">
                        <div class="stat-bar-bg">
                            <div class="stat-bar-fill hp" style="width: ${hpPercent}%"></div>
                        </div>
                    </div>
                    <div class="entity-hp" style="text-align: center; margin-top: 5px;">
                        ${Math.max(0, game.player.hp)}/${game.player.maxHp}
                    </div>
                    <div class="stat-bar" style="margin-top: 5px;">
                        <div class="stat-bar-bg">
                            <div class="stat-bar-fill mp" style="width: ${mpPercent}%"></div>
                        </div>
                    </div>
                    <div style="text-align: center; margin-top: 5px; font-size: 12px; color: var(--info);">
                        ⚡ ${game.player.mp}/${game.player.maxMp}
                    </div>
                    <div style="text-align: center; margin-top: 10px; color: var(--warning);">
                        能量: ${this.playerEnergy}/${this.maxEnergy}
                    </div>
                </div>
            `;
        }
    }

    // 显示伤害效果
    showDamageEffect(damage, source) {
        const effectsContainer = document.getElementById('battle-effects');
        if (!effectsContainer) return;

        const damageText = document.createElement('div');
        damageText.textContent = `-${damage}`;
        damageText.style.color = source === 'player' ? '#ff6b6b' : '#74b9ff';
        damageText.style.fontSize = '3rem';
        damageText.style.fontWeight = 'bold';
        damageText.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
        damageText.style.position = 'absolute';
        damageText.style.animation = 'damageFloat 1s ease-out forwards';

        effectsContainer.appendChild(damageText);

        setTimeout(() => {
            damageText.remove();
        }, 1000);
    }

    // 添加战斗日志
    addBattleLog(message) {
        this.battleLog.push(message);
        console.log(`[Battle] ${message}`);
        
        // 可以在UI中显示战斗日志
        const logContainer = document.getElementById('combat-log');
        if (logContainer) {
            const logEntry = document.createElement('div');
            logEntry.textContent = message;
            logEntry.style.padding = '5px';
            logEntry.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
            logContainer.appendChild(logEntry);
            logContainer.scrollTop = logContainer.scrollHeight;
        }
    }
}