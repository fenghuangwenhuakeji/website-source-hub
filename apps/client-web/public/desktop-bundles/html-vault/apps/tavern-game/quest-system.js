// ========== 任务系统 ==========

class QuestSystem {
    constructor() {
        this.isInitialized = false;
        this.activeQuests = [];
        this.completedQuests = [];
    }

    // 初始化任务系统
    init() {
        this.isInitialized = true;
    }

    // 接取任务
    acceptQuest(questId) {
        const questData = GameData.quests[questId];
        if (!questData) {
            console.error('未找到任务:', questId);
            return;
        }

        // 检查是否已经接取
        if (this.activeQuests.find(q => q.id === questId)) {
            game.showNotification('你已经接取了这个任务', 'warning');
            return;
        }

        // 检查是否已完成
        if (this.completedQuests.includes(questId)) {
            game.showNotification('这个任务已经完成了', 'info');
            return;
        }

        // 添加到活跃任务
        this.activeQuests.push({
            id: questId,
            progress: 0,
            startTime: Date.now()
        });

        game.player.quests.push({
            id: questId,
            progress: 0,
            completed: false
        });

        audioSystem.playSound('notification');
        game.showNotification(`接取任务：${questData.name}`, 'success');
    }

    // 更新任务进度
    updateQuestProgress(type, targetId, amount = 1) {
        this.activeQuests.forEach(quest => {
            const questData = GameData.quests[quest.id];
            if (!questData) return;

            let shouldUpdate = false;

            // 根据任务类型更新进度
            switch (questData.type) {
                case 'kill':
                    if (targetId === questData.target) {
                        quest.progress += amount;
                        shouldUpdate = true;
                    }
                    break;
                case 'collect':
                    if (targetId === questData.target) {
                        quest.progress += amount;
                        shouldUpdate = true;
                    }
                    break;
                case 'explore':
                    if (targetId === questData.target) {
                        quest.progress = Math.min(quest.progress + amount, questData.count);
                        shouldUpdate = true;
                    }
                    break;
                case 'boss':
                    if (targetId === questData.target) {
                        quest.progress = questData.count;
                        shouldUpdate = true;
                    }
                    break;
            }

            if (shouldUpdate) {
                this.checkQuestCompletion(quest);
                this.updatePlayerQuest(quest);
            }
        });
    }

    // 检查任务完成
    checkQuestCompletion(quest) {
        const questData = GameData.quests[quest.id];
        if (!questData) return;

        if (quest.progress >= questData.count) {
            this.completeQuest(quest.id);
        }
    }

    // 完成任务
    completeQuest(questId) {
        const questIndex = this.activeQuests.findIndex(q => q.id === questId);
        if (questIndex === -1) return;

        const quest = this.activeQuests[questIndex];
        const questData = GameData.quests[questId];
        if (!questData) return;

        // 给予奖励
        this.giveQuestRewards(questData);

        // 移动到已完成列表
        this.activeQuests.splice(questIndex, 1);
        this.completedQuests.push(questId);

        // 更新玩家任务状态
        const playerQuest = game.player.quests.find(q => q.id === questId);
        if (playerQuest) {
            playerQuest.completed = true;
        }

        // 更新统计
        if (game.player.stats) {
            game.player.stats.questsCompleted++;
        }

        audioSystem.playSound('levelUp');
        game.showNotification(`任务完成：${questData.name}！`, 'success');
    }

    // 给予任务奖励
    giveQuestRewards(questData) {
        const reward = questData.reward;

        // 经验奖励
        if (reward.exp) {
            game.player.exp += reward.exp;
            game.showNotification(`获得 ${reward.exp} 经验！`, 'success');
            upgradeSystem.checkLevelUp(game.player);
        }

        // 金币奖励
        if (reward.gold) {
            game.player.gold += reward.gold;
            game.showNotification(`获得 ${reward.gold} 金币！`, 'success');
        }

        // 物品奖励
        if (reward.item) {
            game.player.inventory.push(reward.item);
            const itemData = GameData.items[reward.item];
            if (itemData) {
                game.showNotification(`获得 ${itemData.name}！`, 'success');
            }
        }

        // 技能点奖励
        if (reward.skillPoints) {
            upgradeSystem.skillPoints += reward.skillPoints;
            game.showNotification(`获得 ${reward.skillPoints} 技能点！`, 'success');
        }

        game.updateUI();
    }

    // 更新玩家任务数据
    updatePlayerQuest(quest) {
        const playerQuest = game.player.quests.find(q => q.id === quest.id);
        if (playerQuest) {
            playerQuest.progress = quest.progress;
            playerQuest.completed = quest.progress >= GameData.quests[quest.id].count;
        }
    }

    // 放弃任务
    abandonQuest(questId) {
        const questIndex = this.activeQuests.findIndex(q => q.id === questId);
        if (questIndex === -1) return;

        this.activeQuests.splice(questIndex, 1);

        // 更新玩家任务列表
        const playerQuestIndex = game.player.quests.findIndex(q => q.id === questId);
        if (playerQuestIndex !== -1) {
            game.player.quests.splice(playerQuestIndex, 1);
        }

        audioSystem.playSound('click');
        game.showNotification('已放弃任务', 'info');
    }

    // 获取任务详情
    getQuestDetails(questId) {
        const questData = GameData.quests[questId];
        if (!questData) return null;

        const activeQuest = this.activeQuests.find(q => q.id === questId);
        const isActive = !!activeQuest;
        const progress = activeQuest ? activeQuest.progress : 0;

        return {
            ...questData,
            isActive,
            progress,
            isCompleted: this.completedQuests.includes(questId)
        };
    }

    // 获取活跃任务列表
    getActiveQuests() {
        return this.activeQuests.map(quest => ({
            ...quest,
            data: GameData.quests[quest.id]
        }));
    }

    // 获取可接取任务
    getAvailableQuests() {
        return Object.entries(GameData.quests)
            .filter(([id, quest]) => {
                const isActive = this.activeQuests.find(q => q.id === id);
                const isCompleted = this.completedQuests.includes(id);
                return !isActive && !isCompleted;
            })
            .map(([id, quest]) => ({
                id,
                ...quest
            }));
    }

    // 渲染任务列表
    renderQuestList(type = 'active') {
        let quests = [];
        let container = null;

        if (type === 'active') {
            quests = this.getActiveQuests();
            container = document.getElementById('active-quest-list');
        } else {
            quests = this.getAvailableQuests();
            container = document.getElementById('available-quest-list');
        }

        if (!container) return;

        container.innerHTML = '';

        if (quests.length === 0) {
            container.innerHTML = '<p>没有任务</p>';
            return;
        }

        quests.forEach(quest => {
            const questElement = document.createElement('div');
            questElement.className = 'quest-item';
            
            const progressPercent = type === 'active' 
                ? Math.min(100, (quest.progress / quest.data.count) * 100)
                : 0;

            questElement.innerHTML = `
                <div class="quest-header">
                    <h4>${quest.data.name}</h4>
                    <span class="quest-type">${this.getQuestTypeText(quest.data.type)}</span>
                </div>
                <p class="quest-description">${quest.data.description}</p>
                <div class="quest-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                    <span class="progress-text">
                        ${type === 'active' ? `${quest.progress}/${quest.data.count}` : ''}
                    </span>
                </div>
                <div class="quest-reward">
                    <span>奖励: ${quest.data.reward.exp} EXP, ${quest.data.reward.gold} 金币</span>
                </div>
            `;

            container.appendChild(questElement);
        });
    }

    // 获取任务类型文本
    getQuestTypeText(type) {
        const types = {
            kill: '击杀',
            collect: '收集',
            explore: '探索',
            boss: 'Boss战'
        };
        return types[type] || type;
    }

    // 每日任务（预留功能）
    generateDailyQuests() {
        // 可以根据玩家等级生成每日任务
        const dailyQuests = [];
        
        // 示例：生成3个每日任务
        for (let i = 0; i < 3; i++) {
            const questTypes = ['kill', 'collect', 'explore'];
            const randomType = questTypes[Math.floor(Math.random() * questTypes.length)];
            
            dailyQuests.push({
                id: `daily_${Date.now()}_${i}`,
                type: randomType,
                name: `每日任务 ${i + 1}`,
                description: '完成这个每日任务',
                count: 5 + Math.floor(Math.random() * 10),
                reward: {
                    exp: 50,
                    gold: 25
                },
                isDaily: true
            });
        }

        return dailyQuests;
    }

    // 刷新每日任务
    refreshDailyQuests() {
        const dailyQuests = this.generateDailyQuests();
        dailyQuests.forEach(quest => {
            if (!this.completedQuests.includes(quest.id)) {
                this.acceptQuest(quest.id);
            }
        });

        game.showNotification('每日任务已刷新！', 'success');
    }
}

// 创建全局任务系统实例
const questSystem = new QuestSystem();
