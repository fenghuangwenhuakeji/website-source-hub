// ========== 成就系统 ==========
// 负责成就管理和成就解锁

class AchievementSystem {
    constructor() {
        this.isInitialized = false;
        this.achievements = new Map();
        this.unlockedAchievements = new Set();
        this.achievementProgress = new Map();
        this.achievementPoints = 0;
    }

    // 初始化成就系统
    init() {
        this.loadAchievementData();
        this.loadPlayerProgress();
        this.setupEventListeners();
        this.isInitialized = true;
        console.log('成就系统初始化完成');
    }

    // 加载成就数据
    loadAchievementData() {
        // 战斗类成就
        this.registerAchievement({
            id: 'first_blood',
            name: '初次杀敌',
            description: '击败你的第一个敌人',
            icon: '🗡️',
            category: 'combat',
            points: 10,
            condition: (player, stats) => stats.monstersKilled >= 1,
            hidden: false
        });

        this.registerAchievement({
            id: 'monster_hunter',
            name: '怪物猎人',
            description: '击败100个敌人',
            icon: '🎯',
            category: 'combat',
            points: 50,
            condition: (player, stats) => stats.monstersKilled >= 100,
            hidden: false
        });

        this.registerAchievement({
            id: 'undefeated',
            name: '无敌战神',
            description: '连续赢得10场战斗',
            icon: '🏆',
            category: 'combat',
            points: 100,
            condition: (player, stats) => this.getWinStreak() >= 10,
            hidden: false
        });

        // 装备类成就
        this.registerAchievement({
            id: 'first_equipment',
            name: '武装起来',
            description: '装备第一件物品',
            icon: '🛡️',
            category: 'equipment',
            points: 10,
            condition: (player, stats) => this.hasEquippedItem(player),
            hidden: false
        });

        this.registerAchievement({
            id: 'legendary_collector',
            name: '传说收藏家',
            description: '装备一件传说品质物品',
            icon: '⭐',
            category: 'equipment',
            points: 200,
            condition: (player, stats) => this.hasLegendaryItem(player),
            hidden: false
        });

        // 探索类成就
        this.registerAchievement({
            id: 'explorer',
            name: '探索者',
            description: '发现5个地点',
            icon: '🗺️',
            category: 'exploration',
            points: 20,
            condition: (player, stats) => player.unlockedLocations.length >= 5,
            hidden: false
        });

        this.registerAchievement({
            id: 'world_traveler',
            name: '世界旅行者',
            description: '发现所有地点',
            icon: '🌍',
            category: 'exploration',
            points: 100,
            condition: (player, stats) => player.unlockedLocations.length >= this.getTotalLocations(),
            hidden: false
        });

        // 任务类成就
        this.registerAchievement({
            id: 'quest_starter',
            name: '冒险开始',
            description: '完成第一个任务',
            icon: '📜',
            category: 'quest',
            points: 15,
            condition: (player, stats) => stats.questsCompleted >= 1,
            hidden: false
        });

        this.registerAchievement({
            id: 'quest_master',
            name: '任务大师',
            description: '完成50个任务',
            icon: '🎖️',
            category: 'quest',
            points: 100,
            condition: (player, stats) => stats.questsCompleted >= 50,
            hidden: false
        });

        // 等级类成就
        this.registerAchievement({
            id: 'level_10',
            name: '初出茅庐',
            description: '达到10级',
            icon: '🌱',
            category: 'level',
            points: 20,
            condition: (player, stats) => player.level >= 10,
            hidden: false
        });

        this.registerAchievement({
            id: 'level_50',
            name: '经验丰富',
            description: '达到50级',
            icon: '💪',
            category: 'level',
            points: 150,
            condition: (player, stats) => player.level >= 50,
            hidden: false
        });

        this.registerAchievement({
            id: 'level_100',
            name: '传说等级',
            description: '达到100级',
            icon: '👑',
            category: 'level',
            points: 300,
            condition: (player, stats) => player.level >= 100,
            hidden: false
        });

        // 金币类成就
        this.registerAchievement({
            id: 'first_gold',
            name: '第一桶金',
            description: '获得1000金币',
            icon: '💰',
            category: 'gold',
            points: 10,
            condition: (player, stats) => player.gold >= 1000,
            hidden: false
        });

        this.registerAchievement({
            id: 'millionaire',
            name: '百万富翁',
            description: '获得1,000,000金币',
            icon: '💎',
            category: 'gold',
            points: 200,
            condition: (player, stats) => player.gold >= 1000000,
            hidden: false
        });

        // 卡牌类成就
        this.registerAchievement({
            id: 'card_collector',
            name: '卡牌收藏家',
            description: '收集30张卡牌',
            icon: '🃏',
            category: 'card',
            points: 50,
            condition: (player, stats) => this.getCollectedCardsCount() >= 30,
            hidden: false
        });

        this.registerAchievement({
            id: 'deck_master',
            name: '卡组大师',
            description: '组建一套完美卡组',
            icon: '📚',
            category: 'card',
            points: 100,
            condition: (player, stats) => this.hasPerfectDeck(),
            hidden: false
        });

        // 隐藏成就
        this.registerAchievement({
            id: 'secret_finding',
            name: '秘密发现者',
            description: '发现一个隐藏地点',
            icon: '🔮',
            category: 'secret',
            points: 150,
            condition: (player, stats) => this.hasDiscoveredSecret(player),
            hidden: true
        });
    }

    // 注册成就
    registerAchievement(achievement) {
        this.achievements.set(achievement.id, achievement);
        
        // 初始化进度
        if (!this.achievementProgress.has(achievement.id)) {
            this.achievementProgress.set(achievement.id, {
                unlocked: false,
                progress: 0,
                maxProgress: 1,
                unlockedAt: null
            });
        }
    }

    // 设置事件监听器
    setupEventListeners() {
        eventSystem.on(GameEvents.BATTLE_END, (data) => {
            this.checkAchievements();
        });

        eventSystem.on(GameEvents.CHARACTER_LEVEL_UP, (data) => {
            this.checkAchievements();
        });

        eventSystem.on(GameEvents.ITEM_ACQUIRED, (data) => {
            this.checkAchievements();
        });

        eventSystem.on(GameEvents.QUEST_COMPLETED, (data) => {
            this.checkAchievements();
        });

        eventSystem.on(GameEvents.LOCATION_DISCOVERED, (data) => {
            this.checkAchievements();
        });
    }

    // 检查成就解锁
    checkAchievements() {
        if (!game || !game.player) return;

        const player = game.player;
        const stats = stateManager.get('statistics');

        for (const [id, achievement] of this.achievements) {
            if (this.unlockedAchievements.has(id)) continue;

            try {
                const progress = this.achievementProgress.get(id);
                
                // 检查条件
                if (achievement.condition(player, stats)) {
                    this.unlockAchievement(id);
                }
            } catch (error) {
                console.error(`Error checking achievement ${id}:`, error);
            }
        }
    }

    // 解锁成就
    unlockAchievement(id) {
        const achievement = this.achievements.get(id);
        if (!achievement || this.unlockedAchievements.has(id)) return;

        this.unlockedAchievements.add(id);
        this.achievementPoints += achievement.points;

        const progress = this.achievementProgress.get(id);
        progress.unlocked = true;
        progress.unlockedAt = Date.now();

        // 显示成就解锁通知
        this.showAchievementUnlocked(achievement);

        // 触发事件
        eventSystem.emit(GameEvents.ACHIEVEMENT_UNLOCKED, {
            achievement: achievement,
            points: achievement.points
        });

        // 保存进度
        this.saveProgress();

        console.log(`成就解锁: ${achievement.name}`);
    }

    // 显示成就解锁通知
    showAchievementUnlocked(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-info">
                <div class="achievement-title">成就解锁！</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-points">+${achievement.points} 点</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // 播放音效
        audioSystem.playSound('achievement');

        // 自动消失
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    // 获取成就
    getAchievement(id) {
        return this.achievements.get(id);
    }

    // 获取所有成就
    getAllAchievements(category = null) {
        let achievements = Array.from(this.achievements.values());
        
        if (category) {
            achievements = achievements.filter(a => a.category === category);
        }
        
        return achievements;
    }

    // 检查成就是否已解锁
    isUnlocked(id) {
        return this.unlockedAchievements.has(id);
    }

    // 获取已解锁成就
    getUnlockedAchievements() {
        return Array.from(this.unlockedAchievements).map(id => this.achievements.get(id));
    }

    // 获取未解锁成就
    getLockedAchievements() {
        return Array.from(this.achievements.values())
            .filter(achievement => !this.unlockedAchievements.has(achievement.id));
    }

    // 获取成就进度
    getAchievementProgress(id) {
        return this.achievementProgress.get(id);
    }

    // 获取总成就点数
    getTotalPoints() {
        return Array.from(this.achievements.values())
            .reduce((sum, a) => sum + a.points, 0);
    }

    // 获取已获得的成就点数
    getUnlockedPoints() {
        return this.achievementPoints;
    }

    // 获取成就完成度
    getCompletionRate() {
        const total = this.achievements.size;
        const unlocked = this.unlockedAchievements.size;
        return total > 0 ? (unlocked / total * 100).toFixed(1) : 0;
    }

    // 辅助方法：检查是否装备了物品
    hasEquippedItem(player) {
        if (!player || !player.equipment) return false;
        return Object.values(player.equipment).some(item => item !== null);
    }

    // 辅助方法：检查是否有传说物品
    hasLegendaryItem(player) {
        if (!player || !player.equipment) return false;
        return Object.values(player.equipment).some(item => {
            if (!item) return false;
            const itemData = GameData.items[item];
            return itemData && itemData.rarity === 'legendary';
        });
    }

    // 辅助方法：获取连胜
    getWinStreak() {
        const stats = stateManager.get('statistics');
        // 简化实现
        return Math.min(stats.battlesWon - stats.battlesLost, stats.battlesWon);
    }

    // 辅助方法：获取总地点数
    getTotalLocations() {
        return Object.keys(GameData.locations || {}).length;
    }

    // 辅助方法：获取收集的卡牌数量
    getCollectedCardsCount() {
        if (!game || !game.player || !game.player.inventory) return 0;
        return game.player.inventory.filter(item => item.type === 'card').length;
    }

    // 辅助方法：检查是否有完美卡组
    hasPerfectDeck() {
        if (!game || !game.player) return false;
        // 简化实现
        return this.getCollectedCardsCount() >= 20;
    }

    // 辅助方法：检查是否发现秘密
    hasDiscoveredSecret(player) {
        if (!player || !player.unlockedLocations) return false;
        return player.unlockedLocations.some(loc => loc.includes('secret') || loc.includes('hidden'));
    }

    // 加载玩家进度
    loadPlayerProgress() {
        const saved = localStorage.getItem('tavern_achievements');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.unlockedAchievements = new Set(data.unlocked || []);
                this.achievementPoints = data.points || 0;
                
                if (data.progress) {
                    for (const [id, progress] of Object.entries(data.progress)) {
                        this.achievementProgress.set(id, progress);
                    }
                }
            } catch (error) {
                console.error('Failed to load achievement progress:', error);
            }
        }
    }

    // 保存进度
    saveProgress() {
        const data = {
            unlocked: Array.from(this.unlockedAchievements),
            points: this.achievementPoints,
            progress: {}
        };
        
        for (const [id, progress] of this.achievementProgress) {
            data.progress[id] = progress;
        }
        
        localStorage.setItem('tavern_achievements', JSON.stringify(data));
    }

    // 重置进度
    resetProgress() {
        this.unlockedAchievements.clear();
        this.achievementPoints = 0;
        this.achievementProgress.clear();
        this.loadAchievementData();
        this.saveProgress();
    }
}

// 创建全局成就系统实例
const achievementSystem = new AchievementSystem();

export default AchievementSystem;
export { achievementSystem };
