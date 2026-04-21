/**
 * 酒馆系统
 * 管理酒馆交互、商店、任务板等功能
 */

export class TavernSystem {
    constructor(engine) {
        this.engine = engine;
        this.isInitialized = false;
        this.items = [];
        this.quests = [];
    }

    async init() {
        if (this.isInitialized) return;

        console.log('[TavernSystem] 初始化酒馆系统...');

        // 初始化商店物品
        this.initializeShopItems();

        // 初始化任务板
        this.initializeQuestBoard();

        this.isInitialized = true;
        console.log('[TavernSystem] 酒馆系统初始化完成');
    }

    // 初始化商店物品
    initializeShopItems() {
        this.items = [
            { id: 'health_potion', name: '生命药水', price: 50, icon: '🧪', description: '恢复50点生命值', effect: { hp: 50 } },
            { id: 'mana_potion', name: '魔法药水', price: 50, icon: '🧪', description: '恢复30点魔法值', effect: { mp: 30 } },
            { id: 'sword', name: '铁剑', price: 200, icon: '⚔️', description: '攻击力+5', effect: { atk: 5 } },
            { id: 'shield', name: '圆盾', price: 150, icon: '🛡️', description: '防御力+3', effect: { def: 3 } },
            { id: 'boots', name: '皮靴', price: 100, icon: '👢', description: '速度+2', effect: { spd: 2 } },
            { id: 'ring', name: '力量戒指', price: 300, icon: '💍', description: '暴击+3%', effect: { crit: 3 } }
        ];
    }

    // 初始化任务板
    initializeQuestBoard() {
        this.quests = [
            {
                id: 'slime_hunt',
                name: '史莱姆狩猎',
                description: '消灭5只史莱姆',
                reward: { gold: 100, exp: 50 },
                requirements: { kills: 5, target: 'slime' },
                accepted: false,
                completed: false
            },
            {
                id: 'herb_collect',
                name: '草药采集',
                description: '收集10株草药',
                reward: { gold: 80, exp: 40 },
                requirements: { collect: 10, item: 'herb' },
                accepted: false,
                completed: false
            },
            {
                id: 'boss_defeat',
                name: '击败魔物首领',
                description: '击败森林中的魔物首领',
                reward: { gold: 500, exp: 200, item: 'rare_sword' },
                requirements: { defeat: 1, target: 'boss' },
                accepted: false,
                completed: false
            }
        ];
    }

    // 显示商店
    showShop() {
        console.log('[TavernSystem] 显示商店');

        const viewGame = document.getElementById('view-game');
        if (viewGame) {
            const storyPanel = viewGame.querySelector('.story-panel');
            if (storyPanel) {
                storyPanel.innerHTML = `
                    <h3 style="color: var(--accent); margin-bottom: 15px;">🏪 商店</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
                        ${this.items.map(item => `
                            <div class="panel" style="margin-bottom: 0;">
                                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                                    <span style="font-size: 24px;">${item.icon}</span>
                                    <div>
                                        <div style="font-weight: bold;">${item.name}</div>
                                        <div style="color: #FFC107;">💰 ${item.price}</div>
                                    </div>
                                </div>
                                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 10px;">
                                    ${item.description}
                                </div>
                                <button class="btn btn-primary" onclick="tavernSystem.buyItem('${item.id}')" style="width: 100%;">
                                    购买
                                </button>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
        }
    }

    // 购买物品
    buyItem(itemId) {
        if (!window.game || !game.player) {
            game.showNotification('请先开始游戏', 'error');
            return;
        }

        const item = this.items.find(i => i.id === itemId);
        if (!item) {
            game.showNotification('物品不存在', 'error');
            return;
        }

        if (game.player.gold < item.price) {
            game.showNotification('金币不足', 'error');
            return;
        }

        // 扣除金币
        game.player.gold -= item.price;

        // 应用物品效果
        if (item.effect) {
            if (item.effect.hp) {
                game.player.hp = Math.min(game.player.hp + item.effect.hp, game.player.maxHp);
            }
            if (item.effect.mp) {
                game.player.mp = Math.min(game.player.mp + item.effect.mp, game.player.maxMp);
            }
            if (item.effect.atk) {
                game.player.atk += item.effect.atk;
            }
            if (item.effect.def) {
                game.player.def += item.effect.def;
            }
            if (item.effect.spd) {
                game.player.spd += item.effect.spd;
            }
            if (item.effect.crit) {
                game.player.crit += item.effect.crit;
            }
        }

        // 添加到背包
        if (!game.player.inventory) {
            game.player.inventory = [];
        }
        game.player.inventory.push({
            ...item,
            purchasedAt: new Date().toISOString()
        });

        game.updateUI();
        game.showNotification(`购买了 ${item.name}！`, 'success');
    }

    // 显示吧台
    showBar() {
        console.log('[TavernSystem] 显示吧台');

        const viewGame = document.getElementById('view-game');
        if (viewGame) {
            const storyPanel = viewGame.querySelector('.story-panel');
            if (storyPanel) {
                storyPanel.innerHTML = `
                    <h3 style="color: var(--accent); margin-bottom: 15px;">🍺 吧台</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
                        <div class="panel" style="margin-bottom: 0;">
                            <div style="font-size: 24px; text-align: center; margin-bottom: 10px;">🍺</div>
                            <div style="font-weight: bold; text-align: center; margin-bottom: 5px;">麦芽酒</div>
                            <div style="color: #FFC107; text-align: center; margin-bottom: 10px;">💰 20</div>
                            <div style="font-size: 12px; color: var(--text-secondary); text-align: center; margin-bottom: 10px;">
                                恢复30点生命值
                            </div>
                            <button class="btn btn-primary" onclick="tavernSystem.drink('beer')" style="width: 100%;">
                                饮用
                            </button>
                        </div>
                        <div class="panel" style="margin-bottom: 0;">
                            <div style="font-size: 24px; text-align: center; margin-bottom: 10px;">🍷</div>
                            <div style="font-weight: bold; text-align: center; margin-bottom: 5px;">红酒</div>
                            <div style="color: #FFC107; text-align: center; margin-bottom: 10px;">💰 30</div>
                            <div style="font-size: 12px; color: var(--text-secondary); text-align: center; margin-bottom: 10px;">
                                恢复20点魔法值
                            </div>
                            <button class="btn btn-primary" onclick="tavernSystem.drink('wine')" style="width: 100%;">
                                饮用
                            </button>
                        </div>
                        <div class="panel" style="margin-bottom: 0;">
                            <div style="font-size: 24px; text-align: center; margin-bottom: 10px;">🥘</div>
                            <div style="font-weight: bold; text-align: center; margin-bottom: 5px;">炖肉</div>
                            <div style="color: #FFC107; text-align: center; margin-bottom: 10px;">💰 40</div>
                            <div style="font-size: 12px; color: var(--text-secondary); text-align: center; margin-bottom: 10px;">
                                恢复50点生命值
                            </div>
                            <button class="btn btn-primary" onclick="tavernSystem.drink('stew')" style="width: 100%;">
                                食用
                            </button>
                        </div>
                    </div>
                `;
            }
        }
    }

    // 饮用/食用物品
    drink(type) {
        if (!window.game || !game.player) {
            game.showNotification('请先开始游戏', 'error');
            return;
        }

        const prices = { beer: 20, wine: 30, stew: 40 };
        const effects = {
            beer: { hp: 30, name: '麦芽酒' },
            wine: { mp: 20, name: '红酒' },
            stew: { hp: 50, name: '炖肉' }
        };

        const effect = effects[type];
        const price = prices[type];

        if (game.player.gold < price) {
            game.showNotification('金币不足', 'error');
            return;
        }

        game.player.gold -= price;

        if (effect.hp) {
            game.player.hp = Math.min(game.player.hp + effect.hp, game.player.maxHp);
        }
        if (effect.mp) {
            game.player.mp = Math.min(game.player.mp + effect.mp, game.player.maxMp);
        }

        game.updateUI();
        game.showNotification(`享用了${effect.name}！`, 'success');
    }

    // 显示任务板
    showQuestBoard() {
        console.log('[TavernSystem] 显示任务板');

        const viewGame = document.getElementById('view-game');
        if (viewGame) {
            const storyPanel = viewGame.querySelector('.story-panel');
            if (storyPanel) {
                storyPanel.innerHTML = `
                    <h3 style="color: var(--accent); margin-bottom: 15px;">📜 任务板</h3>
                    <div style="display: flex; flex-direction: column; gap: 15px;">
                        ${this.quests.map(quest => {
                            const status = quest.completed ? '✅ 已完成' : quest.accepted ? '⏳ 进行中' : '📋 可接取';
                            const statusColor = quest.completed ? 'var(--success)' : quest.accepted ? 'var(--warning)' : 'var(--info)';
                            const buttonText = quest.completed ? '领取奖励' : quest.accepted ? '查看详情' : '接受任务';
                            const buttonAction = quest.completed ? `tavernSystem.claimQuest('${quest.id}')` : quest.accepted ? `alert('任务进行中')` : `tavernSystem.acceptQuest('${quest.id}')`;
                            const buttonClass = quest.completed ? 'btn-primary' : '';

                            return `
                                <div class="panel" style="margin-bottom: 0;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                        <h4 style="margin: 0;">${quest.name}</h4>
                                        <span style="color: ${statusColor}; font-size: 12px;">${status}</span>
                                    </div>
                                    <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 10px;">
                                        ${quest.description}
                                    </p>
                                    <div style="font-size: 12px; color: #FFC107; margin-bottom: 10px;">
                                        奖励: 💰${quest.reward.gold} XP:${quest.reward.exp}
                                    </div>
                                    <button class="btn ${buttonClass}" onclick="${buttonAction}" style="width: 100%;">
                                        ${buttonText}
                                    </button>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `;
            }
        }
    }

    // 接受任务
    acceptQuest(questId) {
        if (!window.game || !game.player) {
            game.showNotification('请先开始游戏', 'error');
            return;
        }

        const quest = this.quests.find(q => q.id === questId);
        if (!quest) {
            game.showNotification('任务不存在', 'error');
            return;
        }

        if (quest.accepted) {
            game.showNotification('任务已接取', 'info');
            return;
        }

        quest.accepted = true;

        // 添加到玩家的任务列表
        if (!game.player.quests) {
            game.player.quests = [];
        }
        game.player.quests.push(quest);

        game.showNotification(`接受了任务: ${quest.name}`, 'success');
        this.showQuestBoard();
    }

    // 领取任务奖励
    claimQuest(questId) {
        if (!window.game || !game.player) {
            game.showNotification('请先开始游戏', 'error');
            return;
        }

        const quest = this.quests.find(q => q.id === questId);
        if (!quest) {
            game.showNotification('任务不存在', 'error');
            return;
        }

        if (!quest.completed) {
            game.showNotification('任务未完成', 'warning');
            return;
        }

        // 发放奖励
        if (quest.reward.gold) {
            game.player.gold += quest.reward.gold;
        }
        if (quest.reward.exp) {
            game.player.exp += quest.reward.exp;
        }

        // 从任务板移除
        this.quests = this.quests.filter(q => q.id !== questId);

        // 从玩家任务列表移除
        if (game.player.quests) {
            game.player.quests = game.player.quests.filter(q => q.id !== questId);
        }

        game.updateUI();
        game.showNotification(`完成任务: ${quest.name}`, 'success');
        this.showQuestBoard();
    }

    // 显示住宿
    showInn() {
        console.log('[TavernSystem] 显示住宿');

        const viewGame = document.getElementById('view-game');
        if (viewGame) {
            const storyPanel = viewGame.querySelector('.story-panel');
            if (storyPanel) {
                storyPanel.innerHTML = `
                    <h3 style="color: var(--accent); margin-bottom: 15px;">🛏️ 住宿</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
                        <div class="panel" style="margin-bottom: 0;">
                            <div style="font-size: 24px; text-align: center; margin-bottom: 10px;">🛏️</div>
                            <div style="font-weight: bold; text-align: center; margin-bottom: 5px;">普通房间</div>
                            <div style="color: #FFC107; text-align: center; margin-bottom: 10px;">💰 50</div>
                            <div style="font-size: 12px; color: var(--text-secondary); text-align: center; margin-bottom: 10px;">
                                完全恢复生命和魔法
                            </div>
                            <button class="btn btn-primary" onclick="tavernSystem.rentRoom('normal')" style="width: 100%;">
                                入住
                            </button>
                        </div>
                        <div class="panel" style="margin-bottom: 0;">
                            <div style="font-size: 24px; text-align: center; margin-bottom: 10px;">🏨</div>
                            <div style="font-weight: bold; text-align: center; margin-bottom: 5px;">豪华房间</div>
                            <div style="color: #FFC107; text-align: center; margin-bottom: 10px;">💰 100</div>
                            <div style="font-size: 12px; color: var(--text-secondary); text-align: center; margin-bottom: 10px;">
                                完全恢复并获得临时buff
                            </div>
                            <button class="btn btn-primary" onclick="tavernSystem.rentRoom('luxury')" style="width: 100%;">
                                入住
                            </button>
                        </div>
                    </div>
                `;
            }
        }
    }

    // 租住房间
    rentRoom(type) {
        if (!window.game || !game.player) {
            game.showNotification('请先开始游戏', 'error');
            return;
        }

        const prices = { normal: 50, luxury: 100 };

        if (game.player.gold < prices[type]) {
            game.showNotification('金币不足', 'error');
            return;
        }

        game.player.gold -= prices[type];

        // 完全恢复
        game.player.hp = game.player.maxHp;
        game.player.mp = game.player.maxMp;

        if (type === 'luxury') {
            // 豪华房间获得临时buff
            game.player.atk += 5;
            game.player.def += 5;
            game.showNotification('豪华休息！攻击和防御临时+5', 'success');
        } else {
            game.showNotification('休息了一晚，完全恢复了！', 'success');
        }

        game.updateUI();
    }
}
