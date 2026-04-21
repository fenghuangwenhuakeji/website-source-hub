/**
 * RPGGame - 完整的角色扮演游戏主入口
 * 集成所有游戏系统
 */

import { RPGCore } from './systems/RPGameCore.js';
import { state, resetGameState } from './core/state.js';
import { DB } from './core/db.js';
import { callAPI } from './core/api.js';
import { showNotification } from './utils.js';

// 导入UI渲染函数
let renderFunctions = null;

export class RPGGame {
    constructor() {
        this.initialized = false;
        this.currentView = 'game';
    }

    /**
     * 初始化游戏
     */
    async initialize() {
        if (this.initialized) return;

        console.log('🎮 正在初始化RPG游戏...');

        try {
            // 初始化核心系统
            await RPGCore.initialize();

            // 动态导入UI模块
            const renderModule = await import('./ui/render.js');
            renderFunctions = renderModule;

            this.initialized = true;
            console.log('✅ RPG游戏初始化完成！');

            showNotification('欢迎来到完整版RPG酒馆！', 'success');
        } catch (error) {
            console.error('初始化失败:', error);
            showNotification('游戏初始化失败: ' + error.message, 'error');
        }
    }

    /**
     * 新游戏
     */
    async newGame() {
        // 检查是否已初始化
        if (!this.initialized) {
            await this.initialize();
        }

        // 检查是否选择了剧本
        if (!state.currentScript) {
            showNotification('请先选择剧本', 'error');
            return;
        }

        // 检查API配置
        const apiConfig = await DB.getAll('api_pool');
        const activeApi = apiConfig.find(c => c.is_active === 1);
        if (!activeApi) {
            showNotification('请先配置并激活API', 'error');
            return;
        }

        // 重置游戏状态
        resetGameState();

        // 初始化角色（如果没有创建）
        const charSystem = RPGCore.getSystem('characterUpgrade');
        if (!charSystem.player) {
            // 需要先创建角色
            return this.showCharacterCreation();
        }

        // 显示游戏界面
        this.showGameInterface();

        // 开始剧情
        const storySystem = RPGCore.getSystem('story');
        storySystem.startStory('prologue');

        // 初始化卡牌系统
        const cardSystem = RPGCore.getSystem('cards');
        cardSystem.startBattle();

        showNotification('游戏开始！', 'success');
    }

    /**
     * 显示角色创建界面
     */
    showCharacterCreation() {
        // 这里应该显示角色创建UI
        console.log('显示角色创建界面');
        // 暂时使用默认角色
        const charSystem = RPGCore.getSystem('characterUpgrade');
        charSystem.createCharacter({
            name: '冒险者',
            class: 'warrior',
            race: 'human',
            gender: 'male'
        });

        const classSystem = RPGCore.getSystem('class');
        classSystem.selectClass('warrior');

        this.newGame();
    }

    /**
     * 显示游戏界面
     */
    showGameInterface() {
        document.getElementById('game-interface').style.display = 'block';
        document.querySelector('.card').style.display = 'none';

        // 更新界面
        this.updateUI();
    }

    /**
     * 更新UI
     */
    updateUI() {
        if (!renderFunctions) return;

        // 更新角色信息
        const charSystem = RPGCore.getSystem('characterUpgrade');
        const charData = charSystem.getCharacter();

        this.updateCharacterPanel(charData);

        // 更新地图信息
        const mapSystem = RPGCore.getSystem('map');
        this.updateMapPanel(mapSystem.getRenderData());
    }

    /**
     * 更新角色面板
     */
    updateCharacterPanel(charData) {
        if (!charData) return;

        const { player, attributes, derivedStats, levels } = charData;

        document.getElementById('char-name').textContent = player?.name || '冒险者';
        document.getElementById('char-level').textContent = `等级 ${levels.current}`;

        // 更新属性条
        this.updateStatBar('hp', derivedStats.hp, derivedStats.maxHp);
        this.updateStatBar('mp', derivedStats.mp, derivedStats.maxMp);

        // 更新属性值
        document.getElementById('str').textContent = attributes.strength;
        document.getElementById('agi').textContent = attributes.agility;
        document.getElementById('int').textContent = attributes.intelligence;
        document.getElementById('luk').textContent = attributes.luck;
    }

    /**
     * 更新属性条
     */
    updateStatBar(type, current, max) {
        const percent = (current / max) * 100;
        document.getElementById(`${type}-bar`).style.width = `${percent}%`;
        document.getElementById(`${type}-text`).textContent = `${Math.floor(current)}/${max}`;
    }

    /**
     * 更新地图面板
     */
    updateMapPanel(mapData) {
        if (!mapData) return;

        const locationElement = document.getElementById('current-location');
        const mapSystem = RPGCore.getSystem('map');
        const nearbyLocations = mapSystem.getNearbyLocations();

        if (locationElement) {
            locationElement.innerHTML = `
                <div>当前位置: ${mapData.map?.name || '未知'}</div>
                <div style="margin-top: 8px; font-size: 12px; color: #666;">
                    附近地点: ${nearbyLocations.map(l => l.icon + l.name).join(', ')}
                </div>
            `;
        }
    }

    /**
     * 发送行动
     */
    async sendAction() {
        const input = document.getElementById('user-input');
        const action = input.value.trim();
        if (!action) return;

        // 添加到故事内容
        this.addStoryEntry('user', action);
        input.value = '';

        try {
            // 调用AI生成响应
            const context = this.buildContext();
            const response = await callAPI(context + '\n\n玩家行动: ' + action);

            this.addStoryEntry('ai', response);

            // 分析响应，触发游戏系统
            this.processAIResponse(response);

        } catch (error) {
            this.addStoryEntry('system', '❌ 错误: ' + error.message);
        }
    }

    /**
     * 构建上下文
     */
    buildContext() {
        const charSystem = RPGCore.getSystem('characterUpgrade');
        const storySystem = RPGCore.getSystem('story');
        const mapSystem = RPGCore.getSystem('map');

        const charData = charSystem.getCharacter();
        const storyScene = storySystem.currentScene;

        let context = `你是一个RPG游戏GM。以下是当前游戏状态：

【角色信息】
姓名: ${charData.player?.name || '冒险者'}
等级: ${charData.levels.current}
职业: ${charData.player?.class || '未定'}
生命值: ${Math.floor(charData.derivedStats.hp)}/${charData.derivedStats.maxHp}
魔法值: ${Math.floor(charData.derivedStats.mp)}/${charData.derivedStats.maxHp}

【当前位置】
${mapSystem.currentMap?.name || '未知区域'}

【当前剧情】
${storyScene?.text || '游戏刚开始...'}

【互动提示】
- 当玩家想要战斗时，提示使用战斗系统
- 当玩家移动时，更新地图位置
- 当玩家与NPC交谈时，使用交互系统
- 当玩家使用卡牌时，描述卡牌效果

请根据玩家的行动自然地推进剧情，同时保持RPG游戏的感觉。`;

        return context;
    }

    /**
     * 处理AI响应
     */
    processAIResponse(response) {
        // 这里可以添加关键词检测，触发相应的游戏系统

        // 检测战斗关键词
        if (response.includes('战斗') || response.includes('敌人') || response.includes('怪物')) {
            console.log('检测到战斗场景');
            // 可以触发战斗系统
        }

        // 检测移动关键词
        if (response.includes('移动') || response.includes('前往') || response.includes('前往')) {
            console.log('检测到移动意图');
        }

        // 更新UI
        this.updateUI();
    }

    /**
     * 添加故事条目
     */
    addStoryEntry(type, content) {
        const storyContent = document.getElementById('story-content');
        if (!storyContent) return;

        const entry = document.createElement('div');
        entry.className = `story-entry ${type}`;

        const icons = {
            user: '👤',
            ai: '🤖',
            system: '⚙️',
            combat: '⚔️',
            story: '📖'
        };

        entry.innerHTML = `
            <div class="story-icon">${icons[type] || '💬'}</div>
            <div class="story-text">${content}</div>
        `;

        storyContent.appendChild(entry);
        storyContent.scrollTop = storyContent.scrollHeight;
    }

    /**
     * 快速行动
     */
    quickAction(action) {
        document.getElementById('user-input').value = action;
        this.sendAction();
    }

    /**
     * 自动存档
     */
    async autoSave() {
        try {
            const saveData = {
                timestamp: Date.now(),
                systems: {}
            };

            // 保存所有系统数据
            for (const [name, system] of Object.entries(RPGCore.systems)) {
                if (system.save) {
                    saveData.systems[name] = await system.save();
                }
            }

            // 保存到数据库
            await DB.put('rpg_saves', {
                id: 'autosave',
                data: saveData,
                timestamp: Date.now()
            });

            showNotification('游戏已自动保存', 'success');
        } catch (error) {
            console.error('自动存档失败:', error);
            showNotification('保存失败: ' + error.message, 'error');
        }
    }

    /**
     * 加载存档
     */
    async loadGame(saveId = 'autosave') {
        try {
            const save = await DB.get('rpg_saves', saveId);
            if (!save || !save.data) {
                showNotification('存档不存在', 'error');
                return;
            }

            // 加载所有系统数据
            for (const [name, data] of Object.entries(save.data.systems)) {
                const system = RPGCore.getSystem(name);
                if (system && system.load) {
                    await system.load(data);
                }
            }

            this.updateUI();
            showNotification('存档加载成功', 'success');
        } catch (error) {
            console.error('加载存档失败:', error);
            showNotification('加载失败: ' + error.message, 'error');
        }
    }

    /**
     * 查看地图
     */
    showMap() {
        const mapSystem = RPGCore.getSystem('map');
        const mapData = mapSystem.getRenderData();

        // 这里应该显示地图界面
        console.log('显示地图:', mapData);

        showNotification(`当前位置: ${mapData.map?.name}`, 'info');
    }

    /**
     * 使用技能
     */
    useSkill(skillId) {
        // 这里应该显示技能选择界面
        console.log('使用技能:', skillId);
        showNotification('技能系统正在完善中...', 'info');
    }

    /**
     * 查看背包
     */
    showInventory() {
        // 切换到背包视图
        if (typeof switchView === 'function') {
            switchView('inventory');
        }
    }

    /**
     * 查看状态
     */
    showStatus() {
        const charSystem = RPGCore.getSystem('characterUpgrade');
        const charData = charSystem.getCharacter();

        const status = `
【角色状态】
等级: ${charData.levels.current}
经验: ${charData.levels.exp}/${charData.levels.expToNext}

【属性】
力量: ${charData.attributes.strength}
敏捷: ${charData.attributes.agility}
智力: ${charData.attributes.intelligence}
体质: ${charData.attributes.vitality}
幸运: ${charData.attributes.luck}
魅力: ${charData.attributes.charisma}

【战斗属性】
生命值: ${Math.floor(charData.derivedStats.hp)}/${charData.derivedStats.maxHp}
魔法值: ${Math.floor(charData.derivedStats.mp)}/${charData.derivedStats.maxMp}
攻击力: ${charData.derivedStats.attack}
防御力: ${charData.derivedStats.defense}
        `.trim();

        this.addStoryEntry('system', status);
    }

    /**
     * 开始战斗
     */
    async startCombat(enemies) {
        const combatSystem = RPGCore.getSystem('combat');
        const charSystem = RPGCore.getSystem('characterUpgrade');
        const player = charSystem.getCharacter();

        const result = combatSystem.startCombat(player.player, enemies);

        if (result.success) {
            this.addStoryEntry('combat', `⚔️ 遭遇敌人！${enemies.map(e => this.getEnemyName(e)).join(', ')}`);

            // 显示战斗界面
            this.showCombatUI(result.combat);
        }

        return result;
    }

    /**
     * 获取敌人名称
     */
    getEnemyName(enemyId) {
        const combatSystem = RPGCore.getSystem('combat');
        const enemy = combatSystem.enemies?.[enemyId];
        return enemy ? enemy.name : enemyId;
    }

    /**
     * 显示战斗界面
     */
    showCombatUI(combat) {
        // 这里应该创建并显示战斗界面
        console.log('显示战斗界面:', combat);
        this.addStoryEntry('combat', `战斗开始！第${combat.round}回合`);
    }

    /**
     * 执行战斗行动
     */
    async executeCombatAction(action) {
        const combatSystem = RPGCore.getSystem('combat');
        const result = await combatSystem.executeTurn(action);

        if (result.success) {
            if (result.ended) {
                // 战斗结束
                if (result.result === 'victory') {
                    this.addStoryEntry('combat', `🎉 战斗胜利！获得 ${result.rewards.exp} 经验，${result.rewards.gold} 金币`);

                    // 增加经验
                    const charSystem = RPGCore.getSystem('characterUpgrade');
                    charSystem.addExp(result.rewards.exp);
                } else {
                    this.addStoryEntry('combat', '💀 战斗失败...');
                }
            }
        }

        return result;
    }
}

// 创建全局实例
export const RPGGame = new RPGGame();

// 暴露给全局
window.RPGGame = RPGGame;
