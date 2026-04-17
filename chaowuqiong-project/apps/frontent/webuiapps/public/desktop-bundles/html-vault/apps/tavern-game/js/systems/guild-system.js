// ========== 公会系统 ==========
// 负责公会管理和公会功能

class GuildSystem {
    constructor() {
        this.isInitialized = false;
        this.currentGuild = null;
        this.guildData = new Map();
        this.guildRank = 0;
        this.guildPoints = 0;
    }

    // 初始化公会系统
    init() {
        this.loadGuildData();
        this.loadPlayerGuild();
        this.setupEventListeners();
        this.isInitialized = true;
        console.log('公会系统初始化完成');
    }

    // 加载公会数据
    loadGuildData() {
        this.registerGuild({
            id: 'guild_warriors',
            name: '战士公会',
            icon: '⚔️',
            description: '战士的聚集地，专注于战斗技巧和武器精通',
            benefits: [
                { type: 'atk', value: 5, description: '攻击力 +5' },
                { type: 'hp', value: 20, description: '生命上限 +20' }
            ],
            levels: [
                { points: 0, name: '新手战士', perks: [] },
                { points: 100, name: '熟练战士', perks: [{ type: 'skill_unlock', id: 'warrior_special' }] },
                { points: 500, name: '精英战士', perks: [{ type: 'bonus_damage', value: 0.1 }] },
                { points: 2000, name: '传奇战士', perks: [{ type: 'skill_unlock', id: 'warrior_ultimate' }] }
            ]
        });

        this.registerGuild({
            id: 'guild_mages',
            name: '法师公会',
            icon: '🔮',
            description: '魔法师的殿堂，专注于奥术研究和法术威力',
            benefits: [
                { type: 'mag', value: 8, description: '魔法攻击 +8' },
                { type: 'mp', value: 30, description: '魔法上限 +30' }
            ],
            levels: [
                { points: 0, name: '学徒法师', perks: [] },
                { points: 100, name: '正式法师', perks: [{ type: 'skill_unlock', id: 'mage_special' }] },
                { points: 500, name: '高阶法师', perks: [{ type: 'mana_efficiency', value: 0.15 }] },
                { points: 2000, name: '大魔导师', perks: [{ type: 'skill_unlock', id: 'mage_ultimate' }] }
            ]
        });

        this.registerGuild({
            id: 'guild_rogues',
            name: '盗贼公会',
            icon: '🗡️',
            description: '暗影中的组织，专注于潜行、暗杀和偷盗',
            benefits: [
                { type: 'crit', value: 3, description: '暴击率 +3%' },
                { type: 'spd', value: 5, description: '速度 +5' }
            ],
            levels: [
                { points: 0, name: '见习盗贼', perks: [] },
                { points: 100, name: '正式盗贼', perks: [{ type: 'skill_unlock', id: 'rogue_special' }] },
                { points: 500, name: '精英盗贼', perks: [{ type: 'critical_bonus', value: 0.2 }] },
                { points: 2000, name: '暗影大师', perks: [{ type: 'skill_unlock', id: 'rogue_ultimate' }] }
            ]
        });

        this.registerGuild({
            id: 'guild_merchants',
            name: '商人公会',
            icon: '💰',
            description: '商业联盟，专注于贸易、谈判和财富积累',
            benefits: [
                { type: 'gold_bonus', value: 0.1, description: '金币获取 +10%' },
                { type: 'discount', value: 0.1, description: '商店折扣 10%' }
            ],
            levels: [
                { points: 0, name: '小商贩', perks: [] },
                { points: 100, name: '商人', perks: [{ type: 'shop_unlock', id: 'merchant_special' }] },
                { points: 500, name: '大商人', perks: [{ type: 'discount', value: 0.15 }] },
                { points: 2000, name: '贸易大师', perks: [{ type: 'gold_bonus', value: 0.2 }] }
            ]
        });

        this.registerGuild({
            id: 'guild_craftsmen',
            name: '工匠公会',
            icon: '🔨',
            description: '工匠的家园，专注于制作、锻造和工艺提升',
            benefits: [
                { type: 'crafting_exp', value: 0.2, description: '制作经验 +20%' },
                { type: 'crafting_bonus', value: 0.1, description: '制作成功率 +10%' }
            ],
            levels: [
                { points: 0, name: '学徒工匠', perks: [] },
                { points: 100, name: '工匠', perks: [{ type: 'recipe_unlock', category: 'basic' }] },
                { points: 500, name: '高级工匠', perks: [{ type: 'recipe_unlock', category: 'advanced' }] },
                { points: 2000, name: '大师工匠', perks: [{ type: 'recipe_unlock', category: 'legendary' }] }
            ]
        });

        this.registerGuild({
            id: 'guild_adventurers',
            name: '冒险者公会',
            icon: '🗺️',
            description: '冒险者的聚集地，专注于探索和完成任务',
            benefits: [
                { type: 'exp_bonus', value: 0.1, description: '经验获取 +10%' },
                { type: 'quest_reward', value: 0.15, description: '任务奖励 +15%' }
            ],
            levels: [
                { points: 0, name: '见习冒险者', perks: [] },
                { points: 100, name: '冒险者', perks: [{ type: 'quest_unlock', type: 'daily' }] },
                { points: 500, name: '精英冒险者', perks: [{ type: 'map_unlock', id: 'secret_area' }] },
                { points: 2000, name: '传奇冒险者', perks: [{ type: 'title_unlock', id: 'world_explorer' }] }
            ]
        });
    }

    // 注册公会
    registerGuild(guild) {
        this.guildData.set(guild.id, guild);
    }

    // 设置事件监听器
    setupEventListeners() {
        eventSystem.on(GameEvents.QUEST_COMPLETED, (data) => {
            if (this.currentGuild) {
                const guildInfo = this.guildData.get(this.currentGuild);
                if (guildInfo.id === 'guild_adventurers') {
                    const bonus = this.getGuildBenefit('quest_reward');
                    const extraReward = Math.floor(data.reward * bonus);
                    game.player.gold += extraReward;
                    game.showNotification(`公会奖励：+${extraReward} 金币`, 'success');
                }
            }
        });

        eventSystem.on(GameEvents.ITEM_CRAFTED, (data) => {
            if (this.currentGuild) {
                const guildInfo = this.guildData.get(this.currentGuild);
                if (guildInfo.id === 'guild_craftsmen') {
                    const bonus = this.getGuildBenefit('crafting_exp');
                    const extraExp = Math.floor(data.recipe.expReward * bonus);
                    craftingSystem.gainExp(extraExp);
                    game.showNotification(`公会奖励：+${extraExp} 制作经验`, 'success');
                }
            }
        });
    }

    // 加入公会
    joinGuild(guildId) {
        const guild = this.guildData.get(guildId);
        if (!guild) {
            game.showNotification('公会不存在', 'error');
            return false;
        }

        if (this.currentGuild === guildId) {
            game.showNotification('你已经在这个公会了', 'warning');
            return false;
        }

        if (this.currentGuild) {
            game.showNotification('退出当前公会才能加入新公会', 'warning');
            return false;
        }

        this.currentGuild = guildId;
        this.guildRank = 0;
        this.guildPoints = 0;

        // 应用基础福利
        this.applyGuildBenefits(guild);

        game.showNotification(`成功加入 ${guild.name}！`, 'success');
        audioSystem.playSound('levelUp');

        this.savePlayerGuild();
        return true;
    }

    // 退出公会
    leaveGuild() {
        if (!this.currentGuild) {
            game.showNotification('你还没有加入公会', 'warning');
            return false;
        }

        const guild = this.guildData.get(this.currentGuild);
        
        // 移除福利
        this.removeGuildBenefits(guild);

        this.currentGuild = null;
        this.guildRank = 0;
        this.guildPoints = 0;

        game.showNotification(`已退出 ${guild.name}`, 'info');
        this.savePlayerGuild();
        return true;
    }

    // 应用公会福利
    applyGuildBenefits(guild) {
        if (!game.player) return;

        for (const benefit of guild.benefits) {
            switch (benefit.type) {
                case 'atk':
                    game.player.atk = (game.player.atk || 0) + benefit.value;
                    break;
                case 'mag':
                    game.player.mag = (game.player.mag || 0) + benefit.value;
                    break;
                case 'hp':
                    game.player.maxHp = (game.player.maxHp || 100) + benefit.value;
                    game.player.hp = (game.player.hp || 100) + benefit.value;
                    break;
                case 'mp':
                    game.player.maxMp = (game.player.maxMp || 50) + benefit.value;
                    game.player.mp = (game.player.mp || 50) + benefit.value;
                    break;
            }
        }
    }

    // 移除公会福利
    removeGuildBenefits(guild) {
        if (!game.player) return;

        for (const benefit of guild.benefits) {
            switch (benefit.type) {
                case 'atk':
                    game.player.atk = Math.max(0, (game.player.atk || 0) - benefit.value);
                    break;
                case 'mag':
                    game.player.mag = Math.max(0, (game.player.mag || 0) - benefit.value);
                    break;
                case 'hp':
                    game.player.maxHp = Math.max(100, (game.player.maxHp || 100) - benefit.value);
                    game.player.hp = Math.min(game.player.maxHp, game.player.hp || 100);
                    break;
                case 'mp':
                    game.player.maxMp = Math.max(50, (game.player.maxMp || 50) - benefit.value);
                    game.player.mp = Math.min(game.player.maxMp, game.player.mp || 50);
                    break;
            }
        }
    }

    // 获得公会点数
    gainPoints(amount) {
        if (!this.currentGuild) return;

        this.guildPoints += amount;
        this.checkRankUp();

        this.savePlayerGuild();
    }

    // 检查是否可以升级
    checkRankUp() {
        const guild = this.guildData.get(this.currentGuild);
        if (!guild) return;

        const nextRank = guild.levels[this.guildRank + 1];
        if (nextRank && this.guildPoints >= nextRank.points) {
            this.guildRank++;
            
            // 应用新特权
            this.applyRankPerks(nextRank.perks);
            
            game.showNotification(`公会等级提升：${nextRank.name}！`, 'success');
            audioSystem.playSound('levelUp');
        }
    }

    // 应用等级特权
    applyRankPerks(perks) {
        for (const perk of perks) {
            switch (perk.type) {
                case 'skill_unlock':
                    if (game.player && game.player.skills) {
                        game.player.skills.push(perk.id);
                    }
                    break;
                case 'recipe_unlock':
                    if (craftingSystem) {
                        const recipes = craftingSystem.getAllRecipes(perk.category);
                        recipes.forEach(recipe => craftingSystem.unlockRecipe(recipe.id));
                    }
                    break;
                case 'shop_unlock':
                case 'quest_unlock':
                case 'map_unlock':
                case 'title_unlock':
                    // 标记解锁
                    if (game.player) {
                        if (!game.player.unlockedContent) {
                            game.player.unlockedContent = [];
                        }
                        game.player.unlockedContent.push(perk.id);
                    }
                    break;
            }
        }
    }

    // 获取公会福利值
    getGuildBenefit(type) {
        if (!this.currentGuild) return 0;

        const guild = this.guildData.get(this.currentGuild);
        const benefit = guild.benefits.find(b => b.type === type);
        return benefit ? benefit.value : 0;
    }

    // 获取当前公会
    getCurrentGuild() {
        return this.currentGuild ? this.guildData.get(this.currentGuild) : null;
    }

    // 获取所有公会
    getAllGuilds() {
        return Array.from(this.guildData.values());
    }

    // 获取当前等级
    getCurrentRank() {
        if (!this.currentGuild) return null;
        
        const guild = this.guildData.get(this.currentGuild);
        return guild.levels[this.guildRank];
    }

    // 获取下一等级
    getNextRank() {
        if (!this.currentGuild) return null;
        
        const guild = this.guildData.get(this.currentGuild);
        return guild.levels[this.guildRank + 1] || null;
    }

    // 渲染公会列表
    renderGuildList() {
        const container = document.getElementById('guild-list');
        if (!container) return;

        container.innerHTML = '';

        for (const guild of this.guildData.values()) {
            const guildElement = document.createElement('div');
            guildElement.className = 'guild-card';
            const isCurrent = this.currentGuild === guild.id;

            guildElement.innerHTML = `
                <div class="guild-icon">${guild.icon}</div>
                <div class="guild-info">
                    <div class="guild-name">${guild.name}</div>
                    <div class="guild-description">${guild.description}</div>
                    <div class="guild-benefits">
                        ${guild.benefits.map(b => `<span>${b.description}</span>`).join(' | ')}
                    </div>
                </div>
                <div class="guild-actions">
                    ${isCurrent ? `
                        <span class="current-badge">当前公会</span>
                        <button class="btn btn-danger" onclick="guildSystem.leaveGuild()">退出</button>
                    ` : `
                        <button class="btn btn-primary" onclick="guildSystem.joinGuild('${guild.id}')">加入</button>
                    `}
                </div>
            `;

            container.appendChild(guildElement);
        }
    }

    // 渲染公会信息
    renderGuildInfo() {
        const container = document.getElementById('guild-info');
        if (!container) return;

        const currentGuild = this.getCurrentGuild();
        if (!currentGuild) {
            container.innerHTML = '<div class="empty-message">尚未加入任何公会</div>';
            return;
        }

        const currentRank = this.getCurrentRank();
        const nextRank = this.getNextRank();

        container.innerHTML = `
            <div class="guild-header">
                <div class="guild-icon large">${currentGuild.icon}</div>
                <div class="guild-title">${currentGuild.name}</div>
            </div>
            <div class="guild-rank">
                <div class="rank-name">${currentRank.name}</div>
                <div class="rank-points">公会点数: ${this.guildPoints}</div>
                ${nextRank ? `
                    <div class="next-rank">
                        <div class="next-rank-name">下一级: ${nextRank.name}</div>
                        <div class="points-bar">
                            <div class="points-fill" style="width: ${(this.guildPoints / nextRank.points) * 100}%"></div>
                        </div>
                        <div class="points-text">${this.guildPoints} / ${nextRank.points}</div>
                    </div>
                ` : '<div class="max-rank">已达到最高等级</div>'}
            </div>
            <div class="guild-perks">
                <div class="perk-title">特权:</div>
                <div class="perk-list">
                    ${currentGuild.levels.slice(0, this.guildRank + 1).flatMap(level => 
                        level.perks.map(perk => {
                            const perkText = this.getPerkText(perk);
                            return `<div class="perk-item">✓ ${perkText}</div>`;
                        })
                    ).join('')}
                </div>
            </div>
        `;
    }

    // 获取特权文本
    getPerkText(perk) {
        switch (perk.type) {
            case 'skill_unlock':
                const skill = GameData.skills?.[perk.id];
                return `解锁技能: ${skill?.name || perk.id}`;
            case 'recipe_unlock':
                return `解锁配方: ${perk.category}`;
            case 'shop_unlock':
                return '解锁特殊商店';
            case 'quest_unlock':
                return '解锁特殊任务';
            case 'map_unlock':
                return '解锁新地图';
            case 'title_unlock':
                return '解锁称号';
            case 'bonus_damage':
                return `伤害增加 ${(perk.value * 100).toFixed(0)}%`;
            case 'mana_efficiency':
                return `魔法消耗减少 ${(perk.value * 100).toFixed(0)}%`;
            case 'critical_bonus':
                return `暴击伤害增加 ${(perk.value * 100).toFixed(0)}%`;
            default:
                return '未知特权';
        }
    }

    // 加载玩家公会数据
    loadPlayerGuild() {
        const saved = localStorage.getItem('tavern_guild');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.currentGuild = data.guildId;
                this.guildRank = data.rank || 0;
                this.guildPoints = data.points || 0;
            } catch (error) {
                console.error('Failed to load guild data:', error);
            }
        }
    }

    // 保存玩家公会数据
    savePlayerGuild() {
        const data = {
            guildId: this.currentGuild,
            rank: this.guildRank,
            points: this.guildPoints
        };
        localStorage.setItem('tavern_guild', JSON.stringify(data));
    }
}

// 创建全局公会系统实例
const guildSystem = new GuildSystem();

export default GuildSystem;
export { guildSystem };
