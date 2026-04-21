/**
 * 战斗系统
 * 回合制战斗系统，支持普通攻击、技能、道具、卡牌等
 */

export default class CombatSystem {
    constructor() {
        this.inCombat = false;
        this.currentCombat = null;
        this.combatQueue = [];
        this.turnOrder = [];
        this.currentTurn = 0;
        this.combatLog = [];
    }

    async initialize() {
        console.log('⚔️ 战斗系统初始化...');
        await this.loadEnemies();
    }

    /**
     * 加载敌人数据
     */
    async loadEnemies() {
        this.enemies = {
            // 森林怪物
            'wolf': {
                id: 'wolf',
                name: '森林狼',
                icon: '🐺',
                level: 3,
                hp: 50,
                mp: 0,
                attack: 15,
                defense: 8,
                agility: 12,
                exp: 20,
                gold: 5,
                drops: ['wolf_fang', 'wolf_pelt'],
                skills: ['bite', 'howl'],
                ai: 'aggressive',
                type: 'beast'
            },
            'goblin': {
                id: 'goblin',
                name: '哥布林',
                icon: '👺',
                level: 2,
                hp: 30,
                mp: 10,
                attack: 12,
                defense: 5,
                agility: 15,
                exp: 15,
                gold: 3,
                drops: ['goblin_ear', 'rusty_dagger'],
                skills: ['stab', 'throw_rock'],
                ai: 'cowardly',
                type: 'humanoid'
            },
            'forest_spirit': {
                id: 'forest_spirit',
                name: '森林精灵',
                icon: '🧚',
                level: 8,
                hp: 80,
                mp: 50,
                attack: 18,
                defense: 12,
                agility: 20,
                exp: 50,
                gold: 0,
                drops: ['spirit_dust', 'nature_essence'],
                skills: ['heal', 'nature_blessing', 'thorn_armor'],
                ai: 'supportive',
                type: 'spirit'
            },

            // 山脉怪物
            'golem': {
                id: 'golem',
                name: '岩石巨人',
                icon: '🗿',
                level: 25,
                hp: 300,
                mp: 0,
                attack: 40,
                defense: 50,
                agility: 5,
                exp: 200,
                gold: 50,
                drops: ['magic_stone', 'golem_core'],
                skills: ['rock_throw', 'stomp', 'earthquake'],
                ai: 'slow_powerful',
                type: 'construct'
            },
            'elemental': {
                id: 'elemental',
                name: '元素精灵',
                icon: '🔥',
                level: 30,
                hp: 200,
                mp: 100,
                attack: 35,
                defense: 25,
                agility: 18,
                exp: 150,
                gold: 30,
                drops: ['elemental_core', 'mana_crystal'],
                skills: ['fireball', 'inferno', 'immolate'],
                ai: 'aggressive',
                type: 'elemental'
            },

            // 龙骨山脉BOSS
            'ancient_dragon': {
                id: 'ancient_dragon',
                name: '上古巨龙',
                icon: '🐉',
                level: 50,
                hp: 5000,
                mp: 500,
                attack: 100,
                defense: 80,
                agility: 30,
                exp: 5000,
                gold: 1000,
                drops: ['dragon_scale', 'dragon_bone', 'dragon_heart', 'legendary_gem'],
                skills: ['dragon_breath', 'wing_attack', 'tail_swipe', 'roar', 'dragon_fury'],
                ai: 'boss',
                type: 'dragon',
                phases: [
                    { hpPercent: 100, aggression: 'normal' },
                    { hpPercent: 50, aggression: 'enraged' },
                    { hpPercent: 20, aggression: 'desperate' }
                ]
            },

            // 遗迹怪物
            'skeleton': {
                id: 'skeleton',
                name: '骷髅战士',
                icon: '💀',
                level: 12,
                hp: 80,
                mp: 0,
                attack: 22,
                defense: 15,
                agility: 10,
                exp: 40,
                gold: 8,
                drops: ['bone', 'rusty_sword'],
                skills: ['bone_strike', 'summon_skeleton'],
                ai: 'aggressive',
                type: 'undead'
            },
            'mummy': {
                id: 'mummy',
                name: '木乃伊',
                icon: '🧟',
                level: 18,
                hp: 150,
                mp: 30,
                attack: 28,
                defense: 20,
                agility: 8,
                exp: 80,
                gold: 20,
                drops: ['ancient_bandage', 'cursed_amulet'],
                skills: ['curse', 'disease_touch', 'mummy_wrap'],
                ai: 'defensive',
                type: 'undead'
            },

            // 沼泽怪物
            'slime': {
                id: 'slime',
                name: '史莱姆',
                icon: '🟢',
                level: 5,
                hp: 60,
                mp: 0,
                attack: 10,
                defense: 20,
                agility: 5,
                exp: 25,
                gold: 2,
                drops: ['slime_gel', 'poison_resistance'],
                skills: ['acid_spit', 'absorb'],
                ai: 'passive',
                type: 'slime'
            },
            'hydra': {
                id: 'hydra',
                name: '九头蛇',
                icon: '🐍',
                level: 40,
                hp: 2000,
                mp: 100,
                attack: 70,
                defense: 40,
                agility: 25,
                exp: 1000,
                gold: 300,
                drops: ['hydra_head', 'poison_fang', 'regeneration_potion'],
                skills: ['multi_bite', 'poison_breath', 'regenerate', 'head_regen'],
                ai: 'boss',
                type: 'beast'
            }
        };

        // 技能库
        this.skills = {
            'bite': { name: '撕咬', type: 'attack', power: 1.2, cost: 0, cooldown: 0 },
            'howl': { name: '嚎叫', type: 'buff', effect: 'attack_up', power: 1.3, cost: 5, cooldown: 3 },
            'stab': { name: '刺击', type: 'attack', power: 1.1, cost: 0, cooldown: 0 },
            'throw_rock': { name: '扔石头', type: 'attack', power: 0.8, cost: 0, cooldown: 0, range: 'ranged' },
            'heal': { name: '治疗', type: 'heal', power: 30, cost: 15, cooldown: 2 },
            'nature_blessing': { name: '自然祝福', type: 'buff', effect: 'defend_up', power: 1.5, cost: 20, cooldown: 4 },
            'thorn_armor': { name: '荆棘护甲', type: 'buff', effect: 'reflect', power: 0.3, cost: 25, cooldown: 5 },
            'rock_throw': { name: '投石', type: 'attack', power: 1.5, cost: 0, cooldown: 1 },
            'stomp': { name: '践踏', type: 'attack', power: 1.8, cost: 10, cooldown: 2, area: true },
            'earthquake': { name: '地震', type: 'attack', power: 2.0, cost: 30, cooldown: 5, area: true },
            'fireball': { name: '火球术', type: 'attack', power: 1.5, cost: 20, cooldown: 2, element: 'fire' },
            'inferno': { name: '炼狱', type: 'attack', power: 2.5, cost: 50, cooldown: 4, area: true, element: 'fire' },
            'immolate': { name: '献祭', type: 'dot', power: 20, duration: 3, cost: 30, cooldown: 3, element: 'fire' },
            'dragon_breath': { name: '龙息', type: 'attack', power: 3.0, cost: 50, cooldown: 3, element: 'dragon', area: true },
            'wing_attack': { name: '翼击', type: 'attack', power: 1.8, cost: 0, cooldown: 1 },
            'tail_swipe': { name: '尾扫', type: 'attack', power: 1.5, cost: 0, cooldown: 0, area: true },
            'roar': { name: '龙吼', type: 'debuff', effect: 'fear', power: 0.5, cost: 30, cooldown: 4 },
            'dragon_fury': { name: '龙之怒', type: 'attack', power: 4.0, cost: 100, cooldown: 6, element: 'dragon' },
            'bone_strike': { name: '骨击', type: 'attack', power: 1.2, cost: 0, cooldown: 0 },
            'summon_skeleton': { name: '召唤骷髅', type: 'summon', power: 1, cost: 30, cooldown: 5 },
            'curse': { name: '诅咒', type: 'debuff', effect: 'curse', power: 0.3, duration: 3, cost: 15, cooldown: 3 },
            'disease_touch': { name: '疾病之触', type: 'dot', power: 15, duration: 4, cost: 20, cooldown: 3 },
            'mummy_wrap': { name: '木乃伊缠绕', type: 'debuff', effect: 'bind', power: 1, duration: 2, cost: 25, cooldown: 4 },
            'acid_spit': { name: '酸液喷射', type: 'attack', power: 0.8, cost: 0, cooldown: 0, effect: 'acid' },
            'absorb': { name: '吸收', type: 'drain', power: 0.5, cost: 0, cooldown: 2 },
            'multi_bite': { name: '多重撕咬', type: 'attack', power: 2.0, cost: 0, cooldown: 2, hits: 3 },
            'poison_breath': { name: '毒息', type: 'attack', power: 1.5, cost: 20, cooldown: 2, effect: 'poison', area: true },
            'regenerate': { name: '再生', type: 'heal', power: 50, cost: 30, cooldown: 3 },
            'head_regen': { name: '头颅再生', type: 'special', effect: 'regrow_head', cost: 50, cooldown: 5 }
        };
    }

    /**
     * 开始战斗
     */
    startCombat(player, enemies) {
        if (this.inCombat) {
            return { success: false, error: '已在战斗中' };
        }

        // 初始化战斗
        this.inCombat = true;
        this.combatLog = [];
        this.currentTurn = 0;

        // 创建战斗参与者
        const combatPlayer = {
            ...player,
            maxHp: player.hp,
            maxMp: player.mp,
            isPlayer: true,
            buffs: [],
            debuffs: []
        };

        const combatEnemies = enemies.map(enemyId => {
            const enemyTemplate = this.enemies[enemyId];
            return {
                ...enemyTemplate,
                maxHp: enemyTemplate.hp,
                maxMp: enemyTemplate.mp,
                isPlayer: false,
                buffs: [],
                debuffs: [],
                skillCooldowns: {}
            };
        });

        // 确定行动顺序（基于敏捷度）
        this.turnOrder = this.calculateTurnOrder([combatPlayer, ...combatEnemies]);

        this.currentCombat = {
            player: combatPlayer,
            enemies: combatEnemies,
            turnOrder: this.turnOrder,
            currentTurnIndex: 0,
            round: 1
        };

        this.addCombatLog('⚔️ 战斗开始！');
        this.addCombatLog(`遭遇敌人：${combatEnemies.map(e => e.name).join(', ')}`);

        return {
            success: true,
            combat: this.currentCombat,
            firstTurn: this.turnOrder[0]
        };
    }

    /**
     * 计算行动顺序
     */
    calculateTurnOrder(participants) {
        return participants
            .map(p => ({
                ...p,
                initiative: p.agility + Math.random() * 10
            }))
            .sort((a, b) => b.initiative - a.initiative);
    }

    /**
     * 执行回合
     */
    async executeTurn(action) {
        if (!this.inCombat) {
            return { success: false, error: '不在战斗中' };
        }

        const combat = this.currentCombat;
        const currentActor = combat.turnOrder[combat.currentTurnIndex];

        // 检查战斗是否结束
        const battleResult = this.checkBattleEnd();
        if (battleResult.ended) {
            return this.endBattle(battleResult);
        }

        if (currentActor.isPlayer) {
            // 玩家行动
            return await this.executePlayerAction(action);
        } else {
            // 敌人行动
            return await this.executeEnemyAction(currentActor);
        }
    }

    /**
     * 执行玩家行动
     */
    async executePlayerAction(action) {
        const combat = this.currentCombat;
        const player = combat.player;

        let result;

        switch (action.type) {
            case 'attack':
                result = this.performAttack(player, action.target, action.skill || null);
                break;
            case 'skill':
                result = this.performSkill(player, action.skill, action.target);
                break;
            case 'item':
                result = this.useItem(player, action.item);
                break;
            case 'defend':
                result = this.performDefend(player);
                break;
            case 'flee':
                result = this.attemptFlee(player);
                break;
            case 'card':
                result = this.useCard(player, action.card, action.target);
                break;
            default:
                return { success: false, error: '未知行动类型' };
        }

        if (!result.success) {
            return result;
        }

        // 处理状态效果
        this.processStatusEffects();

        // 下一回合
        this.nextTurn();

        return {
            success: true,
            action: action,
            result: result,
            combat: this.getCombatState()
        };
    }

    /**
     * 执行敌人AI行动
     */
    async executeEnemyAction(enemy) {
        // AI决策
        const action = this.decideEnemyAction(enemy);

        let result;
        switch (action.type) {
            case 'attack':
                result = this.performAttack(enemy, action.target, action.skill);
                break;
            case 'skill':
                result = this.performSkill(enemy, action.skill, action.target);
                break;
            case 'defend':
                result = this.performDefend(enemy);
                break;
            default:
                result = this.performAttack(enemy, combat.player);
        }

        // 处理状态效果
        this.processStatusEffects();

        // 下一回合
        this.nextTurn();

        return {
            success: true,
            enemy: enemy.name,
            action: action,
            result: result,
            combat: this.getCombatState()
        };
    }

    /**
     * 敌人AI决策
     */
    decideEnemyAction(enemy) {
        const combat = this.currentCombat;
        const player = combat.player;
        const aliveEnemies = combat.enemies.filter(e => e.hp > 0);

        // 检查BOSS阶段
        if (enemy.phases) {
            const hpPercent = (enemy.hp / enemy.maxHp) * 100;
            const currentPhase = enemy.phases.find(p => hpPercent <= p.hpPercent) ||
                                enemy.phases[enemy.phases.length - 1];

            if (currentPhase.aggression === 'enraged') {
                // 愤怒状态：使用强力技能
                const powerfulSkills = enemy.skills.filter(s => {
                    const skill = this.skills[s];
                    return skill && skill.power > 1.5 && this.canUseSkill(enemy, s);
                });
                if (powerfulSkills.length > 0) {
                    return {
                        type: 'skill',
                        skill: powerfulSkills[0],
                        target: player
                    };
                }
            }
        }

        // 治疗AI
        const healSkill = enemy.skills.find(s => {
            const skill = this.skills[s];
            return skill && skill.type === 'heal' && this.canUseSkill(enemy, s);
        });
        if (healSkill && enemy.hp < enemy.maxHp * 0.3) {
            return {
                type: 'skill',
                skill: healSkill,
                target: enemy
            };
        }

        // 攻击型AI
        if (enemy.ai === 'aggressive' || enemy.ai === 'boss') {
            // 优先使用强力技能
            const strongSkills = enemy.skills.filter(s => {
                const skill = this.skills[s];
                return skill && skill.type === 'attack' && skill.power > 1.2 && this.canUseSkill(enemy, s);
            });
            if (strongSkills.length > 0) {
                return {
                    type: 'skill',
                    skill: strongSkills[0],
                    target: player
                };
            }
        }

        // 默认普通攻击
        return {
            type: 'attack',
            target: player
        };
    }

    /**
     * 检查是否可以使用技能
     */
    canUseSkill(actor, skillId) {
        const skill = this.skills[skillId];
        if (!skill) return false;

        if (actor.mp < skill.cost) return false;

        const cooldown = actor.skillCooldowns?.[skillId] || 0;
        if (cooldown > 0) return false;

        return true;
    }

    /**
     * 执行普通攻击
     */
    performAttack(attacker, target, skill = null) {
        const skillData = skill ? this.skills[skill] : null;
        const power = skillData ? skillData.power : 1.0;

        // 计算伤害
        let baseDamage = attacker.attack * power;
        let defense = target.defense;

        // 考虑暴击
        const isCritical = Math.random() < 0.1;
        if (isCritical) {
            baseDamage *= 2;
        }

        // 随机波动
        baseDamage *= (0.9 + Math.random() * 0.2);

        // 最终伤害
        const damage = Math.max(1, Math.floor(baseDamage - defense * 0.5));

        // 应用伤害
        target.hp = Math.max(0, target.hp - damage);

        // 记录日志
        const actionText = skill ? `使用${skillData.name}` : '发起攻击';
        this.addCombatLog(`${attacker.name}${actionText}对${target.name}造成${damage}点伤害！${isCritical ? '（暴击！）' : ''}`);

        return {
            success: true,
            damage,
            isCritical,
            targetHp: target.hp,
            targetMaxHp: target.maxHp
        };
    }

    /**
     * 执行技能
     */
    performSkill(actor, skillId, target) {
        const skill = this.skills[skillId];
        if (!skill || !this.canUseSkill(actor, skillId)) {
            return { success: false, error: '无法使用该技能' };
        }

        // 消耗MP
        actor.mp -= skill.cost;

        // 设置冷却
        if (!actor.skillCooldowns) actor.skillCooldowns = {};
        actor.skillCooldowns[skillId] = skill.cooldown;

        let result;

        switch (skill.type) {
            case 'attack':
                result = this.performAttack(actor, target, skillId);
                break;
            case 'heal':
                const healAmount = Math.floor(skill.power + actor.intelligence * 0.5);
                target.hp = Math.min(target.maxHp, target.hp + healAmount);
                this.addCombatLog(`${actor.name}使用${skill.name}，恢复了${healAmount}点生命值！`);
                result = { success: true, healed: healAmount };
                break;
            case 'buff':
                target.buffs = target.buffs || [];
                target.buffs.push({
                    effect: skill.effect,
                    power: skill.power,
                    duration: 3
                });
                this.addCombatLog(`${actor.name}使用${skill.name}，获得增益效果！`);
                result = { success: true };
                break;
            case 'debuff':
                target.debuffs = target.debuffs || [];
                target.debuffs.push({
                    effect: skill.effect,
                    power: skill.power,
                    duration: skill.duration || 3
                });
                this.addCombatLog(`${actor.name}使用${skill.name}，${target.name}受到减益效果！`);
                result = { success: true };
                break;
            default:
                result = { success: false, error: '未知技能类型' };
        }

        return result;
    }

    /**
     * 使用道具
     */
    useItem(actor, item) {
        // 这里应该从背包中获取物品数据
        const itemEffects = {
            'potion_hp': { type: 'heal', value: 50 },
            'potion_mp': { type: 'restore_mp', value: 50 },
            'antidote': { type: 'cure', effect: 'poison' }
        };

        const effect = itemEffects[item.id];
        if (!effect) {
            return { success: false, error: '未知物品' };
        }

        switch (effect.type) {
            case 'heal':
                actor.hp = Math.min(actor.maxHp, actor.hp + effect.value);
                this.addCombatLog(`${actor.name}使用了${item.name}，恢复了${effect.value}点生命值！`);
                break;
            case 'restore_mp':
                actor.mp = Math.min(actor.maxMp, actor.mp + effect.value);
                this.addCombatLog(`${actor.name}使用了${item.name}，恢复了${effect.value}点魔法值！`);
                break;
            case 'cure':
                actor.debuffs = actor.debuffs?.filter(d => d.effect !== effect.effect) || [];
                this.addCombatLog(`${actor.name}使用了${item.name}，解除了${effect.effect}状态！`);
                break;
        }

        return { success: true };
    }

    /**
     * 防御
     */
    performDefend(actor) {
        actor.buffs = actor.buffs || [];
        actor.buffs.push({
            effect: 'defend',
            power: 0.5,
            duration: 1
        });
        this.addCombatLog(`${actor.name}采取防御姿态！`);
        return { success: true };
    }

    /**
     * 逃跑
     */
    attemptFlee(actor) {
        const successChance = 0.3 + (actor.agility * 0.01);
        const success = Math.random() < successChance;

        if (success) {
            this.addCombatLog(`${actor.name}成功逃离了战斗！`);
            this.inCombat = false;
            return { success: true, fled: true };
        } else {
            this.addCombatLog(`${actor.name}逃跑失败！`);
            return { success: true, fled: false };
        }
    }

    /**
     * 使用卡牌（与卡牌系统联动）
     */
    useCard(actor, card, target) {
        // 这里应该调用卡牌系统
        this.addCombatLog(`${actor.name}使用了卡牌：${card.name}`);
        return { success: true };
    }

    /**
     * 处理状态效果
     */
    processStatusEffects() {
        const combat = this.currentCombat;
        const allActors = [combat.player, ...combat.enemies];

        for (const actor of allActors) {
            // 处理增益
            if (actor.buffs) {
                actor.buffs = actor.buffs.filter(buff => {
                    buff.duration--;
                    return buff.duration > 0;
                });
            }

            // 处理减益
            if (actor.debuffs) {
                actor.debuffs.forEach(debuff => {
                    if (debuff.effect === 'poison') {
                        const damage = Math.floor(debuff.power * actor.maxHp);
                        actor.hp = Math.max(0, actor.hp - damage);
                        this.addCombatLog(`${actor.name}受到${damage}点毒素伤害！`);
                    }
                });

                actor.debuffs = actor.debuffs.filter(debuff => {
                    debuff.duration--;
                    return debuff.duration > 0;
                });
            }

            // 减少技能冷却
            if (actor.skillCooldowns) {
                for (const skillId in actor.skillCooldowns) {
                    actor.skillCooldowns[skillId]--;
                }
            }
        }
    }

    /**
     * 下一回合
     */
    nextTurn() {
        const combat = this.currentCombat;
        combat.currentTurnIndex++;

        // 新回合
        if (combat.currentTurnIndex >= combat.turnOrder.length) {
            combat.currentTurnIndex = 0;
            combat.round++;
            this.addCombatLog(`--- 第${combat.round}回合 ---`);
        }
    }

    /**
     * 检查战斗结束
     */
    checkBattleEnd() {
        const combat = this.currentCombat;

        // 检查玩家是否死亡
        if (combat.player.hp <= 0) {
            return { ended: true, result: 'defeat' };
        }

        // 检查所有敌人是否死亡
        const aliveEnemies = combat.enemies.filter(e => e.hp > 0);
        if (aliveEnemies.length === 0) {
            return { ended: true, result: 'victory' };
        }

        return { ended: false };
    }

    /**
     * 结束战斗
     */
    endBattle(battleResult) {
        this.inCombat = false;

        let rewards = {};

        if (battleResult.result === 'victory') {
            // 计算奖励
            const combat = this.currentCombat;
            let totalExp = 0;
            let totalGold = 0;
            let drops = [];

            for (const enemy of combat.enemies) {
                totalExp += enemy.exp;
                totalGold += enemy.gold;
                if (enemy.drops) {
                    drops.push(...enemy.drops);
                }
            }

            rewards = {
                exp: totalExp,
                gold: totalGold,
                drops: drops
            };

            this.addCombatLog(`🎉 战斗胜利！获得经验：${totalExp}，金币：${totalGold}`);
        } else {
            this.addCombatLog(`💀 战斗失败...`);
        }

        return {
            success: true,
            ended: true,
            result: battleResult.result,
            rewards,
            combatLog: this.combatLog
        };
    }

    /**
     * 添加战斗日志
     */
    addCombatLog(message) {
        this.combatLog.push({
            time: Date.now(),
            message
        });
    }

    /**
     * 获取战斗状态
     */
    getCombatState() {
        if (!this.inCombat) return null;

        return {
            ...this.currentCombat,
            combatLog: this.combatLog
        };
    }

    /**
     * 保存系统数据
     */
    async save() {
        return {
            inCombat: this.inCombat,
            currentCombat: this.currentCombat,
            combatLog: this.combatLog
        };
    }

    /**
     * 加载系统数据
     */
    async load(data) {
        if (data) {
            this.inCombat = data.inCombat || false;
            this.currentCombat = data.currentCombat;
            this.combatLog = data.combatLog || [];
        }
    }
}
