// ========== 快速入口系统 ==========
// 负责游戏快速入口、存档选择、加载优化

class QuickEntrySystem {
    constructor() {
        this.isInitialized = false;
        this.saves = [];
        this.maxSaves = 5;
        this.loadingProgress = 0;
        this.isQuickLoading = false;
        this.quickEntryCache = new Map();

        // 快速入口配置
        this.config = {
            showLastPlayed: true,
            autoLoadLastSave: false,
            quickLoadEnabled: true,
            showSavePreviews: true
        };
    }

    // 初始化快速入口系统
    async init() {
        console.log('快速入口系统初始化完成');
        await this.loadSaveList();
        this.isInitialized = true;
    }

    // 加载存档列表
    async loadSaveList() {
        this.saves = [];
        for (let i = 0; i < this.maxSaves; i++) {
            const saveData = await this.loadSaveSlot(i);
            if (saveData) {
                this.saves.push({
                    slot: i,
                    ...saveData
                });
            }
        }

        // 按最后游玩时间排序
        this.saves.sort((a, b) => b.lastPlayed - a.lastPlayed);

        console.log(`找到 ${this.saves.length} 个存档`);
    }

    // 加载指定存档槽的数据（元数据）
    async loadSaveSlot(slot) {
        const saveKey = `tavern_save_${slot}`;
        const saved = localStorage.getItem(saveKey);

        if (!saved) return null;

        try {
            const data = JSON.parse(saved);
            return {
                player: {
                    name: data.player?.name || '冒险者',
                    level: data.player?.level || 1,
                    class: data.player?.class || '战士',
                    avatar: data.player?.avatar || '👤'
                },
                lastPlayed: data.metadata?.lastPlayed || Date.now(),
                playTime: data.metadata?.playTime || 0,
                location: data.player?.location || '冒险者酒馆',
                progress: this.calculateProgress(data)
            };
        } catch (error) {
            console.error(`加载存档槽 ${slot} 失败:`, error);
            return null;
        }

    }

    // 计算游戏进度
    calculateProgress(saveData) {
        if (!saveData.player) return 0;

        const player = saveData.player;
        let progress = 0;

        // 等级进度 (最高100级 = 40%)
        progress += Math.min(player.level, 100) / 100 * 40;

        // 任务进度 (最高20%)
        if (player.questsCompleted) {
            progress += Math.min(player.questsCompleted, 50) / 50 * 20;
        }

        // 地图探索进度 (最高20%)
        if (player.unlockedLocations) {
            const totalLocations = 15; // 假设有15个地点
            progress += Math.min(player.unlockedLocations.length, totalLocations) / totalLocations * 20;
        }

        // 成就进度 (最高20%)
        if (player.achievements) {
            const totalAchievements = 30; // 假设有30个成就
            progress += Math.min(player.achievements.length, totalAchievements) / totalAchievements * 20;
        }

        return Math.min(100, Math.round(progress));
    }

    // 获取最新存档
    getLatestSave() {
        return this.saves.length > 0 ? this.saves[0] : null;
    }

    // 检查是否有存档
    hasSave() {
        return this.saves.length > 0;
    }

    // 快速开始新游戏（带预加载）
    async quickStartNewGame() {
        console.log('快速开始新游戏...');
        const startTime = performance.now();

        // 预加载核心资源
        await this.preloadEssentialAssets();

        const loadTime = performance.now() - startTime;
        console.log(`快速加载完成，耗时: ${loadTime.toFixed(2)}ms`);

        // 开始新游戏
        if (window.gameEngine) {
            await window.gameEngine.startNewGame();
        } else if (window.Game && window.Game.engine) {
            await window.Game.engine.startNewGame();
        } else {
            console.error('游戏引擎未初始化');
        }
    }

    // 快速加载存档（带优化）
    async quickLoadSave(slot) {
        console.log(`快速加载存档 ${slot}...`);
        const startTime = performance.now();

        this.isQuickLoading = true;
        this.loadingProgress = 0;

        try {
            // 从缓存加载或从存储加载
            let saveData;
            const cached = this.quickEntryCache.get(slot);

            if (cached) {
                console.log('从缓存加载存档');
                saveData = cached;
                this.loadingProgress = 50;
            } else {
                saveData = await this.loadFullSave(slot);
                this.loadingProgress = 70;
            }

            // 预加载相关资源
            if (saveData.player?.location) {
                await this.preloadLocationAssets(saveData.player.location);
            }
            this.loadingProgress = 90;

            // 加载游戏状态
            if (window.gameEngine) {
                await window.gameEngine.loadGame(saveData);
            } else if (window.Game && window.Game.engine) {
                await window.Game.engine.loadGame(saveData);
            } else {
                console.error('游戏引擎未初始化');
                throw new Error('游戏引擎未初始化');
            }

            this.loadingProgress = 100;

            const loadTime = performance.now() - startTime;
            console.log(`存档加载完成，耗时: ${loadTime.toFixed(2)}ms`);

            // 缓存存档
            this.quickEntryCache.set(slot, saveData);

            return saveData;
        } catch (error) {
            console.error('快速加载存档失败:', error);
            throw error;
        } finally {
            this.isQuickLoading = false;
        }
    }

    // 加载完整存档
    async loadFullSave(slot) {
        const saveKey = `tavern_save_${slot}`;
        const saved = localStorage.getItem(saveKey);

        if (!saved) {
            throw new Error(`存档槽 ${slot} 为空`);
        }

        return JSON.parse(saved);
    }

    // 预加载核心资源
    async preloadEssentialAssets() {
        if (!window.assetManager) return;

        // 预加载关键图片
        const essentialImages = [
            'player-avatar',
            'tavern-bg',
            'ui-icons'
        ];

        for (const imgId of essentialImages) {
            try {
                await window.assetManager.loadImage(imgId);
            } catch (error) {
                console.warn(`预加载图片 ${imgId} 失败:`, error);
            }
        }
    }

    // 预加载地点资源
    async preloadLocationAssets(locationId) {
        if (!window.assetManager) return;

        const locationData = {
            '冒险者酒馆': ['tavern-bg', 'npc-tavern'],
            '森林': ['forest-bg', 'npc-forest'],
            '矿洞': ['cave-bg', 'npc-cave']
        };

        const assets = locationData[locationId] || [];
        for (const assetId of assets) {
            try {
                await window.assetManager.loadImage(assetId);
            } catch (error) {
                console.warn(`预加载地点资源 ${assetId} 失败:`, error);
            }
        }
    }

    // 获取加载进度
    getLoadingProgress() {
        return this.loadingProgress;
    }

    // 是否正在快速加载
    isQuickLoadingActive() {
        return this.isQuickLoading;
    }

    // 渲染快速入口UI
    renderQuickEntryUI() {
        const container = document.getElementById('quick-entry-container');
        if (!container) return;

        const latestSave = this.getLatestSave();

        let html = '<div class="quick-entry-section">';

        // 新游戏按钮
        html += `
            <div class="quick-entry-button" onclick="quickEntrySystem.quickStartNewGame()">
                <div class="button-icon">🎮</div>
                <div class="button-text">
                    <div class="button-title">开始新游戏</div>
                    <div class="button-subtitle">创建新的冒险之旅</div>
                </div>
            </div>
        `;

        // 继续游戏按钮（如果有存档）
        if (latestSave && this.config.showLastPlayed) {
            const lastPlayedTime = new Date(latestSave.lastPlayed);
            const timeAgo = this.getTimeAgo(lastPlayedTime);

            html += `
                <div class="quick-entry-button highlighted" onclick="quickEntrySystem.quickLoadSave(${latestSave.slot})">
                    <div class="button-avatar">${latestSave.player.avatar}</div>
                    <div class="button-text">
                        <div class="button-title">继续游戏</div>
                        <div class="button-subtitle">${latestSave.player.name} · Lv.${latestSave.player.level} ${latestSave.player.class}</div>
                        <div class="button-info">
                            <span>${timeAgo}</span>
                            <span>进度: ${latestSave.progress}%</span>
                        </div>
                    </div>
                    <div class="button-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${latestSave.progress}%"></div>
                        </div>
                    </div>
                </div>
            `;
        }

        html += '</div>';

        // 存档选择区域
        if (this.saves.length > 0 && this.config.showSavePreviews) {
            html += '<div class="save-slots-section">';
            html += '<h3>选择存档</h3>';

            for (const save of this.saves) {
                const lastPlayedTime = new Date(save.lastPlayed);
                const timeAgo = this.getTimeAgo(lastPlayedTime);

                html += `
                    <div class="save-slot-card" onclick="quickEntrySystem.quickLoadSave(${save.slot})">
                        <div class="save-slot-avatar">${save.player.avatar}</div>
                        <div class="save-slot-info">
                            <div class="save-slot-name">存档 ${save.slot + 1}</div>
                            <div class="save-slot-details">
                                ${save.player.name} · Lv.${save.player.level} ${save.player.class}
                            </div>
                            <div class="save-slot-meta">
                                <span>${timeAgo}</span>
                                <span>${save.location}</span>
                            </div>
                        </div>
                        <div class="save-slot-progress">
                            <div class="progress-bar-small">
                                <div class="progress-fill" style="width: ${save.progress}%"></div>
                            </div>
                            <span class="progress-text">${save.progress}%</span>
                        </div>
                    </div>
                `;
            }

            html += '</div>';
        }

        container.innerHTML = html;
    }

    // 计算时间差
    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return '刚刚';
        if (diffMins < 60) return `${diffMins}分钟前`;
        if (diffHours < 24) return `${diffHours}小时前`;
        if (diffDays < 30) return `${diffDays}天前`;

        return date.toLocaleDateString();
    }

    // 清除缓存
    clearCache() {
        this.quickEntryCache.clear();
        console.log('快速入口缓存已清除');
    }

    // 刷新存档列表
    async refresh() {
        await this.loadSaveList();
        this.renderQuickEntryUI();
    }

    // 获取系统状态
    getStatus() {
        return {
            initialized: this.isInitialized,
            savesCount: this.saves.length,
            cached: this.quickEntryCache.size,
            hasLatestSave: this.hasSave(),
            latestSave: this.getLatestSave()
        };
    }
}

// 创建全局快速入口系统实例
const quickEntrySystem = new QuickEntrySystem();
