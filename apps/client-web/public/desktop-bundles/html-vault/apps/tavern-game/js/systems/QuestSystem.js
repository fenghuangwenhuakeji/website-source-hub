/**
 * 任务系统
 * 管理游戏任务、追踪和奖励
 */

export class QuestSystem {
    constructor(engine) {
        this.engine = engine;
        this.isInitialized = false;
        this.availableQuests = [];
        this.activeQuests = [];
        this.completedQuests = [];
    }

    async init() {
        if (this.isInitialized) return;

        console.log('[QuestSystem] 初始化任务系统...');

        // 初始化任务
        this.initializeQuests();

        this.isInitialized = true;
        console.log('[QuestSystem] 任务系统初始化完成');
    }

    // 初始化任务
    initializeQuests() {
        this.availableQuests = [
            {
                id: 'slime_hunt',
                name: '史莱姆狩猎',
                description: '消灭5只史莱姆',
                type: 'kill',
                target: 'slime',
                count: 5,
                current: 0,
                reward: { gold: 100, exp: 50 },
                status: 'available'
            },
            {
                id: 'herb_collect',
                name: '草药采集',
                description: '收集10株草药',
                type: 'collect',
                target: 'herb',
                count: 10,
                current: 0,
                reward: { gold: 80, exp: 40 },
                status: 'available'
            },
            {
                id: 'boss_defeat',
                name: '击败魔物首领',
                description: '击败森林中的魔物首领',
                type: 'defeat',
                target: 'boss',
                count: 1,
                current: 0,
                reward: { gold: 500, exp: 200 },
                status: 'available'
            },
            {
                id: 'explore_forest',
                name: '探索森林',
                description: '在森林中探索3个地点',
                type: 'explore',
                target: 'location',
                count: 3,
                current: 0,
                reward: { gold: 150, exp: 100 },
                status: 'available'
            },
            {
                id: 'reach_level_5',
                name: '成长之路',
                description: '达到等级5',
                type: 'level',
                target: 5,
                count: 5,
                current: 0,
                reward: { gold: 300, exp: 150, item: 'rare_ring' },
                status: 'available'
            }
        ];
    }

    // 获取可用任务
    getAvailableQuests() {
        return this.availableQuests.filter(q => q.status === 'available');
    }

    // 获取进行中任务
    getActiveQuests() {
        return this.availableQuests.filter(q => q.status === 'active');
    }

    // 获取已完成任务
    getCompletedQuests() {
        return this.completedQuests;
    }

    // 接受任务
    acceptQuest(questId) {
        const quest = this.availableQuests.find(q => q.id === questId);
        if (!quest || quest.status !== 'available') {
            return false;
        }

        quest.status = 'active';
        this.activeQuests.push(quest);

        if (window.game) {
            game.showNotification(`接受了任务: ${quest.name}`, 'success');
        }

        return true;
    }

    // 更新任务进度
    updateQuestProgress(type, target, amount = 1) {
        this.activeQuests.forEach(quest => {
            if (quest.type === type) {
                if (type === 'kill' && quest.target === target) {
                    quest.current += amount;
                } else if (type === 'collect' && quest.target === target) {
                    quest.current += amount;
                } else if (type === 'defeat' && quest.target === target) {
                    quest.current += amount;
                } else if (type === 'explore') {
                    quest.current += amount;
                } else if (type === 'level' && window.game && game.player) {
                    quest.current = game.player.level;
                }

                // 检查任务是否完成
                if (quest.current >= quest.count) {
                    this.completeQuest(quest.id);
                }
            }
        });

        this.updateQuestUI();
    }

    // 完成任务
    completeQuest(questId) {
        const quest = this.activeQuests.find(q => q.id === questId);
        if (!quest) return;

        quest.status = 'completed';
        this.completedQuests.push(quest);
        this.activeQuests = this.activeQuests.filter(q => q.id !== questId);

        if (window.game) {
            game.showNotification(`完成任务: ${quest.name}`, 'success');

            // 发放奖励
            if (game.player && quest.reward) {
                if (quest.reward.gold) {
                    game.player.gold += quest.reward.gold;
                }
                if (quest.reward.exp) {
                    game.player.exp += quest.reward.exp;
                }
                if (quest.reward.item) {
                    if (!game.player.inventory) {
                        game.player.inventory = [];
                    }
                    game.player.inventory.push(quest.reward.item);
                }
                game.updateUI();
            }
        }
    }

    // 领取任务奖励
    claimQuestReward(questId) {
        const quest = this.completedQuests.find(q => q.id === questId);
        if (!quest || quest.claimed) {
            return false;
        }

        quest.claimed = true;

        if (window.game) {
            game.showNotification('奖励已领取', 'success');
        }

        return true;
    }

    // 更新任务UI
    updateQuestUI() {
        const questListEl = document.getElementById('quest-list');
        const questContentEl = document.getElementById('quest-content');

        const renderQuests = (quests, targetEl) => {
            if (!targetEl) return;

            if (quests.length === 0) {
                targetEl.innerHTML = '<div class="story-text">无</div>';
                return;
            }

            targetEl.innerHTML = quests.map(quest => {
                const progress = Math.min(quest.current, quest.count);
                const progressPercent = (progress / quest.count) * 100;
                const status = quest.status === 'completed' ? '✅' : quest.status === 'active' ? '⏳' : '📋';

                return `
                    <div class="panel" style="margin-bottom: 10px; padding: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                            <strong>${status} ${quest.name}</strong>
                        </div>
                        <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">${quest.description}</div>
                        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
                            <div style="flex: 1; margin-right: 10px;">
                                <div style="background: var(--bg-primary); height: 6px; border-radius: 3px; overflow: hidden;">
                                    <div style="width: ${progressPercent}%; height: 100%; background: var(--success);"></div>
                                </div>
                            </div>
                            <span>${progress}/${quest.count}</span>
                        </div>
                        ${quest.status === 'completed' ? `
                            <button class="btn btn-primary" onclick="questSystem.claimQuestReward('${quest.id}')" style="margin-top: 8px; width: 100%; padding: 5px;">
                                领取奖励
                            </button>
                        ` : quest.status === 'available' ? `
                            <button class="btn" onclick="questSystem.acceptQuest('${quest.id}')" style="margin-top: 8px; width: 100%; padding: 5px;">
                                接受任务
                            </button>
                        ` : ''}
                    </div>
                `;
            }).join('');
        };

        renderQuests(this.activeQuests, questListEl);
        renderQuests(this.activeQuests, questContentEl);
    }

    // 更新任务进度（自动触发）
    onEvent(event, data) {
        switch (event) {
            case 'enemy_killed':
                this.updateQuestProgress('kill', data.enemyId);
                break;
            case 'item_collected':
                this.updateQuestProgress('collect', data.itemId);
                break;
            case 'boss_defeated':
                this.updateQuestProgress('defeat', 'boss');
                break;
            case 'location_explored':
                this.updateQuestProgress('explore', 'location');
                break;
            case 'level_up':
                this.updateQuestProgress('level', 'level');
                break;
        }
    }
}
