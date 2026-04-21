// ========== 成就系统 ==========

class AchievementSystem {
    constructor() {
        this.isInitialized = false;
        this.achievements = new Map();
        this.unlockedAchievements = new Set();
        this.achievementCategories = {
            combat: '战斗成就',
            exploration: '探索成就',
            social: '社交成就',
            collection: '收集成就',
            milestone: '里程碑成就',
            special: '特殊成就'
        };
    }

    // 初始化成就系统
    init() {
        if (this.isInitialized) return;

        console.log('初始化成就系统...');
        this.registerDefaultAchievements();
        this.loadAchievementProgress();
        this.setupAchievementUI();
        this.isInitialized = true;
        console.log('成就系统初始化完成');
    }

    // 注册默认成就
    registerDefaultAchievements() {
        // 战斗成就
        this.registerAchievement('first_blood', {
            name: '初露锋芒',
            description: '完成第一次战斗',
            category: 'combat',
            icon: '⚔️',
            rarity: 'common',
            reward: { gold: 100, exp: 50 },
            condition: (player) => player.stats.battlesWon >= 1
        });

        this.registerAchievement('battle_master', {
            name: '战斗大师',
            description: '赢得100场战斗',
            category: 'combat',
            icon: '🏆',
            rarity: 'epic',
            reward: { gold: 5000, exp: 2000, diamonds: 50 },
            condition: (player) => player.stats.battlesWon >= 100
        });

        this.registerAchievement('boss_slayer', {
            name: 'BOSS杀手',
            description: '击败10个BOSS',
            category: 'combat',
            icon: '💀',
            rarity: 'rare',
            reward: { gold: 2000, exp: 1000, diamonds: 20 },
            condition: (player) => player.stats.bossesDefeated >= 10
        });

        this.registerAchievement('combo_master', {
            name: '连击大师',
            description: '达成50连击',
            category: 'combat',
            icon: '💥',
            rarity: 'rare',
            reward: { gold: 1500, exp: 800, diamonds: 15 },
            condition: (player) => player.stats.maxCombo >= 50
        });

        // 探索成就
        this.registerAchievement('world_explorer', {
            name: '世界探索者',
            description: '探索所有地点',
            category: 'exploration',
            icon: '🗺️',
            rarity: 'legendary',
            reward: { gold: 10000, exp: 5000, diamonds: 100 },
            condition: (player) => player.stats.locationsExplored >= 20
        });

        this.registerAchievement('treasure_hunter', {
            name: '宝藏猎人',
            description: '发现50个宝箱',
            category: 'exploration',
            icon: '📦',
            rarity: 'rare',
            reward: { gold: 3000, exp: 1500, diamonds: 30 },
            condition: (player) => player.stats.chestsOpened >= 50
        });

        this.registerAchievement('resource_collector', {
            name: '资源收集者',
            description: '采集100次资源',
            category: 'exploration',
            icon: '🌿',
            rarity: 'uncommon',
            reward: { gold: 800, exp: 400 },
            condition: (player) => player.stats.resourcesCollected >= 100
        });

        // 社交成就
        this.registerAchievement('tavern_regular', {
            name: '酒馆常客',
            description: '访问酒馆50次',
            category: 'social',
            icon: '🍺',
            rarity: 'uncommon',
            reward: { gold: 600, exp: 300 },
            condition: (player) => player.stats.tavernVisits >= 50
        });

        this.registerAchievement('friend_maker', {
            name: '交友达人',
            description: '与10个NPC建立友好关系',
            category: 'social',
            icon: '🤝',
            rarity: 'rare',
            reward: { gold: 1500, exp: 800 },
            condition: (player) => player.stats.friendsMade >= 10
        });

        this.registerAchievement('merchant_trader', {
            name: '商人',
            description: '交易100次',
            category: 'social',
            icon: '💰',
            rarity: 'uncommon',
            reward: { gold: 1000, exp: 500 },
            condition: (player) => player.stats.tradesCompleted >= 100
        });

        // 收集成就
        this.registerAchievement('card_collector', {
            name: '卡牌收藏家',
            description: '收集50张卡牌',
            category: 'collection',
            icon: '🃏',
            rarity: 'rare',
            reward: { gold: 2000, exp: 1000, diamonds: 25 },
            condition: (player) => player.stats.cardsCollected >= 50
        });

        this.registerAchievement('item_hoarder', {
            name: '物品囤积者',
            description: '背包中拥有200个物品',
            category: 'collection',
            icon: '🎒',
            rarity: 'uncommon',
            reward: { gold: 800, exp: 400 },
            condition: (player) => player.stats.itemsCollected >= 200
        });

        // 里程碑成就
        this.registerAchievement('level_10', {
            name: '初出茅庐',
            description: '达到10级',
            category: 'milestone',
            icon: '🎯',
            rarity: 'common',
            reward: { gold: 500, exp: 200, diamonds: 5 },
            condition: (player) => player.level >= 10
        });

        this.registerAchievement('level_50', {
            name: '身经百战',
            description: '达到50级',
            category: 'milestone',
            icon: '⭐',
            rarity: 'epic',
            reward: { gold: 5000, exp: 2000, diamonds: 50 },
            condition: (player) => player.level >= 50
        });

        this.registerAchievement('level_100', {
            name: '传说',
            description: '达到100级',
            category: 'milestone',
            icon: '👑',
            rarity: 'legendary',
            reward: { gold: 20000, exp: 10000, diamonds: 200 },
            condition: (player) => player.level >= 100
        });

        // 特殊成就
        this.registerAchievement('speed_runner', {
            name: '速度达人',
            description: '在10天内达到20级',
            category: 'special',
            icon: '⚡',
            rarity: 'rare',
            reward: { gold: 3000, exp: 1500, diamonds: 40 },
            condition: (player) => player.level >= 20 && player.stats.daysPlayed <= 10
        });

        this.registerAchievement('millionaire', {
            name: '百万富翁',
            description: '拥有1,000,000金币',
            category: 'special',
            icon: '💎',
            rarity: 'legendary',
            reward: { gold: 100000, exp: 50000, diamonds: 500 },
            condition: (player) => player.gold >= 1000000
        });

        this.registerAchievement('perfectionist', {
            name: '完美主义者',
            description: '解锁所有成就',
            category: 'special',
            icon: '🏅',
            rarity: 'legendary',
            reward: { gold: 50000, exp: 25000, diamonds: 1000 },
            condition: () => this.unlockedAchievements.size >= this.achievements.size
        });
    }

    // 注册成就
    registerAchievement(id, config) {
        this.achievements.set(id, {
            id,
            name: config.name,
            description: config.description,
            category: config.category,
            icon: config.icon,
            rarity: config.rarity,
            reward: config.reward || {},
            condition: config.condition,
            progress: 0,
            maxProgress: 1,
            unlocked: false,
            unlockedAt: null
        });
    }

    // 设置成就UI
    setupAchievementUI() {
        // 创建成就面板
        if (!document.getElementById('achievement-panel')) {
            const achievementPanel = document.createElement('div');
            achievementPanel.id = 'achievement-panel';
            achievementPanel.className = 'panel hidden';
            achievementPanel.innerHTML = `
                <div class="panel-title">
                    <span>🏆 成就系统</span>
                    <button class="close-btn" onclick="achievementSystem.closePanel()">×</button>
                </div>
                <div class="achievement-categories">
                    ${Object.entries(this.achievementCategories).map(([key, name]) => `
                        <button class="category-btn" data-category="${key}" onclick="achievementSystem.filterByCategory('${key}')">
                            ${name}
                        </button>
                    `).join('')}
                    <button class="category-btn active" data-category="all" onclick="achievementSystem.showAll()">
                        全部成就
                    </button>
                </div>
                <div class="achievement-list" id="achievement-list"></div>
                <div class="achievement-summary">
                    <div class="stat-item">
                        <span>已解锁</span>
                        <span id="unlocked-count">0</span>
                    </div>
                    <div class="stat-item">
                        <span>总成就</span>
                        <span id="total-count">0</span>
                    </div>
                </div>
            `;
            document.body.appendChild(achievementPanel);
        }
    }

    // 检查所有成就
    checkAchievements(player) {
        if (!player) return;

        this.achievements.forEach((achievement, id) => {
            if (!achievement.unlocked) {
                this.checkAchievement(id, player);
            }
        });
    }

    // 检查单个成就
    checkAchievement(id, player) {
        const achievement = this.achievements.get(id);
        if (!achievement || achievement.unlocked) return false;

        try {
            const unlocked = achievement.condition(player);
            if (unlocked) {
                this.unlockAchievement(id);
                return true;
            }
        } catch (error) {
            console.error(`检查成就 ${id} 失败:`, error);
        }

        return false;
    }

    // 解锁成就
    unlockAchievement(id) {
        const achievement = this.achievements.get(id);
        if (!achievement || achievement.unlocked) return;

        achievement.unlocked = true;
        achievement.unlockedAt = Date.now();
        this.unlockedAchievements.add(id);

        // 给予奖励
        this.giveReward(achievement);

        // 显示通知
        this.showAchievementNotification(achievement);

        // 保存进度
        this.saveAchievementProgress();

        console.log(`成就解锁: ${achievement.name}`);
    }

    // 给予奖励
    giveReward(achievement) {
        if (!game.player) return;

        const reward = achievement.reward;

        if (reward.gold) {
            game.player.gold += reward.gold;
        }
        if (reward.exp) {
            game.player.exp += reward.exp;
            game.checkLevelUp();
        }
        if (reward.diamonds) {
            game.player.diamonds += reward.diamonds;
        }

        // 更新UI
        game.updateUI();
    }

    // 显示成就通知
    showAchievementNotification(achievement) {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `achievement-notification ${achievement.rarity}`;
        notification.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-content">
                <div class="achievement-name">成就解锁！</div>
                <div class="achievement-title">${achievement.name}</div>
                <div class="achievement-description">${achievement.description}</div>
            </div>
        `;

        container.appendChild(notification);

        // 自动消失
        setTimeout(() => {
            notification.style.animation = 'achievementPopup 5s ease-out';
            setTimeout(() => {
                notification.remove();
            }, 5000);
        }, 100);

        // 播放音效
        if (audioSystem) {
            audioSystem.playSound('achievement');
        }
    }

    // 显示成就面板
    showPanel() {
        const panel = document.getElementById('achievement-panel');
        if (panel) {
            panel.classList.remove('hidden');
            this.renderAchievementList();
        }
    }

    // 关闭成就面板
    closePanel() {
        const panel = document.getElementById('achievement-panel');
        if (panel) {
            panel.classList.add('hidden');
        }
    }

    // 渲染成就列表
    renderAchievementList(category = 'all') {
        const list = document.getElementById('achievement-list');
        if (!list) return;

        const filtered = category === 'all'
            ? Array.from(this.achievements.values())
            : Array.from(this.achievements.values()).filter(a => a.category === category);

        list.innerHTML = filtered.map(achievement => this.createAchievementCard(achievement)).join('');

        // 更新统计
        document.getElementById('unlocked-count').textContent = this.unlockedAchievements.size;
        document.getElementById('total-count').textContent = this.achievements.size;
    }

    // 创建成就卡片
    createAchievementCard(achievement) {
        const rarityColors = {
            common: '#9e9e9e',
            uncommon: '#4CAF50',
            rare: '#2196F3',
            epic: '#9C27B0',
            legendary: '#FFD700'
        };

        const rarityNames = {
            common: '普通',
            uncommon: '优秀',
            rare: '稀有',
            epic: '史诗',
            legendary: '传说'
        };

        return `
            <div class="achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}" style="border-color: ${rarityColors[achievement.rarity]}">
                <div class="achievement-card-icon">${achievement.icon}</div>
                <div class="achievement-card-content">
                    <div class="achievement-card-header">
                        <div class="achievement-card-name">${achievement.name}</div>
                        <div class="achievement-card-rarity" style="color: ${rarityColors[achievement.rarity]}">${rarityNames[achievement.rarity]}</div>
                    </div>
                    <div class="achievement-card-description">${achievement.description}</div>
                    ${achievement.unlocked ? `
                        <div class="achievement-card-reward">
                            <span>🎁 奖励:</span>
                            ${Object.entries(achievement.reward).map(([key, value]) => `
                                <span class="reward-item">${this.getRewardName(key)}: ${value}</span>
                            `).join('')}
                        </div>
                        <div class="achievement-card-unlocked-at">解锁于: ${new Date(achievement.unlockedAt).toLocaleString()}</div>
                    ` : `
                        <div class="achievement-card-locked">🔒 未解锁</div>
                    `}
                </div>
            </div>
        `;
    }

    // 获取奖励名称
    getRewardName(rewardType) {
        const names = {
            gold: '金币',
            exp: '经验',
            diamonds: '钻石'
        };
        return names[rewardType] || rewardType;
    }

    // 按分类过滤
    filterByCategory(category) {
        // 更新按钮状态
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.category === category) {
                btn.classList.add('active');
            }
        });

        this.renderAchievementList(category);
    }

    // 显示全部
    showAll() {
        this.filterByCategory('all');
    }

    // 保存成就进度
    saveAchievementProgress() {
        const progress = {
            unlockedAchievements: Array.from(this.unlockedAchievements),
            achievementData: Array.from(this.achievements.entries()).map(([id, achievement]) => ({
                id,
                unlocked: achievement.unlocked,
                unlockedAt: achievement.unlockedAt
            }))
        };

        localStorage.setItem('tavern_achievements', JSON.stringify(progress));
    }

    // 加载成就进度
    loadAchievementProgress() {
        const saved = localStorage.getItem('tavern_achievements');
        if (saved) {
            try {
                const progress = JSON.parse(saved);

                // 恢复解锁状态
                if (progress.unlockedAchievements) {
                    this.unlockedAchievements = new Set(progress.unlockedAchievements);
                }

                // 恢复成就数据
                if (progress.achievementData) {
                    progress.achievementData.forEach(data => {
                        const achievement = this.achievements.get(data.id);
                        if (achievement) {
                            achievement.unlocked = data.unlocked;
                            achievement.unlockedAt = data.unlockedAt;
                        }
                    });
                }
            } catch (error) {
                console.error('加载成就进度失败:', error);
            }
        }
    }

    // 获取成就完成率
    getCompletionRate() {
        if (this.achievements.size === 0) return 0;
        return (this.unlockedAchievements.size / this.achievements.size) * 100;
    }

    // 获取分类统计
    getCategoryStats() {
        const stats = {};

        this.achievementCategories.forEach((name, category) => {
            const achievements = Array.from(this.achievements.values()).filter(a => a.category === category);
            const unlocked = achievements.filter(a => a.unlocked).length;

            stats[category] = {
                name,
                total: achievements.length,
                unlocked,
                rate: achievements.length > 0 ? (unlocked / achievements.length) * 100 : 0
            };
        });

        return stats;
    }

    // 获取系统信息
    getSystemInfo() {
        return {
            isInitialized: this.isInitialized,
            totalAchievements: this.achievements.size,
            unlockedAchievements: this.unlockedAchievements.size,
            completionRate: this.getCompletionRate(),
            categoryStats: this.getCategoryStats()
        };
    }
}

// 创建全局成就系统实例
const achievementSystem = new AchievementSystem();
