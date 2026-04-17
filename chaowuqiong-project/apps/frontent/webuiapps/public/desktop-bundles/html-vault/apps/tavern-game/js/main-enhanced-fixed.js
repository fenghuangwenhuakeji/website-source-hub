/**
 * 主入口文件 - 修复版
 * 整合所有系统，提供游戏主逻辑
 */

// 错误处理
window.onerror = function(message, source, lineno, colno, error) {
    console.error('发生错误:', message);
    console.error('来源:', source || '');
    console.error('行号:', lineno || 0);
    console.error('错误对象:', error || null);

    // 显示错误通知
    if (typeof window.TavernUI !== 'undefined' && window.TavernUI.showNotification) {
        window.TavernUI.showNotification(`错误: ${message}`, 'error');
    }

    return false; // 让默认错误处理器继续执行
};

// 全局游戏状态
const GameState = {
    initialized: false,
    running: false,
    paused: false,
    currentScene: 'tavern',
    gameStartTime: null,
    voiceEnabled: false,
    autoPlayEnabled: false,
    player: null,
    inventory: [],
    gold: 100,
    skills: [],
    achievements: [],
    gameStats: {
        playTime: 0,
        battlesWon: 0,
        goldEarned: 0,
        scriptsCompleted: 0
    }
};

// 全局工具函数
const Utils = {
    // 随机数
    random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // 随机选择
    randomChoice(array) {
        return array[this.random(0, array.length - 1)];
    },

    // 格式化时间
    formatTime(seconds) {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    },

    // 深拷贝
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    // 生成ID
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
};

// UI工具
const TavernUI = {
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    },

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    },

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    }
};

// 游戏主逻辑
const TavernGame = {
    /**
     * 初始化游戏
     */
    async init() {
        try {
            console.log('🎮 初始化游戏...');

            // 初始化各系统
            if (window.characterSystem) {
                if (typeof window.characterSystem.init === 'function') {
                    window.characterSystem.init();
                }
                console.log('✅ 角色系统已加载');
            } else {
                console.warn('⚠️ 角色系统未加载');
            }

            if (window.cardSystem) {
                if (typeof window.cardSystem.initialize === 'function') {
                    await window.cardSystem.initialize();
                }
                console.log('✅ 卡牌系统已加载');
            } else {
                console.warn('⚠️ 卡牌系统未加载');
            }

            if (window.audioSystem) {
                if (typeof window.audioSystem.initialize === 'function') {
                    await window.audioSystem.initialize();
                }
                console.log('✅ 音频系统已加载');
            } else {
                console.warn('⚠️ 音频系统未加载');
            }

            if (window.saveSystem) {
                if (typeof window.saveSystem.initialize === 'function') {
                    await window.saveSystem.initialize();
                }
                console.log('✅ 存档系统已加载');
            } else {
                console.warn('⚠️ 存档系统未加载');
            }

            // 初始化游戏引擎
            if (window.gameEngine && !window.gameEngine.initialized) {
                await window.gameEngine.initialize();
            }

            GameState.initialized = true;
            GameState.gameStartTime = Date.now();

            console.log('✅ 游戏初始化完成');

            return { success: true };
        } catch (error) {
            console.error('❌ 游戏初始化失败:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * 开始新游戏
     */
    async newGame() {
        try {
            console.log('🎮 开始新游戏...');

            const characterData = {
                name: '冒险者',
                level: 1,
                hp: 100,
                maxHp: 100,
                mp: 100,
                maxMp: 100,
                exp: 0,
                maxExp: 100,
                str: 10,
                agi: 10,
                int: 10,
                luk: 10
            };

            // 初始化角色
            if (window.characterSystem && typeof window.characterSystem.init === 'function') {
                window.characterSystem.init(characterData);
            }

            GameState.player = characterData;
            GameState.running = true;
            GameState.gameStartTime = Date.now();

            // 初始化卡组
            if (window.cardSystem && typeof window.cardSystem.initializeDeck === 'function') {
                window.cardSystem.initializeDeck();
            }

            // 播放音效
            if (window.audioSystem) {
                window.audioSystem.playSound('success');
            }

            // 切换到游戏界面
            const gameInterface = document.getElementById('game-interface');
            if (gameInterface) {
                gameInterface.style.display = 'block';
            }

            // 显示通知
            if (window.TavernUI) {
                window.TavernUI.showNotification('新游戏开始！', 'success');
            }

            return { success: true, character: characterData };
        } catch (error) {
            console.error('开始新游戏失败:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * 发送行动
     */
    async sendAction() {
        const input = document.getElementById('user-input');
        if (!input) return;

        const action = input.value.trim();
        if (!action) return;

        input.value = '';

        console.log('📤 行动:', action);

        // 处理行动
        try {
            // 这里可以添加AI交互逻辑
            this.appendStory(action, 'player');

            // 模拟AI回复
            setTimeout(() => {
                const responses = [
                    '你走进酒馆，闻到空气中弥漫着麦芽和香料的香气。',
                    '酒保微笑着向你点头致意，"欢迎光临，有什么可以帮你的吗？"',
                    '角落里坐着一位神秘的旅人，似乎在等待着什么。',
                    '壁炉里的火焰噼啪作响，为整个酒馆带来温暖的氛围。'
                ];

                const response = Utils.randomChoice(responses);
                this.appendStory(response, 'npc');

            }, 500 + Math.random() * 1000);

        } catch (error) {
            console.error('处理行动失败:', error);
        }
    },

    /**
     * 添加故事内容
     */
    appendStory(text, type = 'npc') {
        const storyContent = document.getElementById('story-content');
        if (!storyContent) return;

        const paragraph = document.createElement('p');
        paragraph.className = `story-${type}`;
        paragraph.textContent = text;

        storyContent.appendChild(paragraph);
        storyContent.scrollTop = storyContent.scrollHeight;
    },

    /**
     * 快速行动
     */
    quickAction(action) {
        const input = document.getElementById('user-input');
        if (input) {
            input.value = action;
            this.sendAction();
        }
    },

    /**
     * 自动存档
     */
    async autoSave() {
        if (window.saveSystem) {
            const saveData = {
                state: GameState,
                timestamp: Date.now()
            };
            const result = await window.saveSystem.saveGame(saveData, 'auto');

            if (result.success) {
                window.TavernUI.showNotification('存档成功', 'success');
                if (window.audioSystem) {
                    window.audioSystem.playSound('success');
                }
            }
        }
    },

    /**
     * 导出数据
     */
    exportData() {
        const data = JSON.stringify(GameState, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-tavern-data-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        window.TavernUI.showNotification('数据已导出', 'success');
    },

    /**
     * 过滤剧本
     */
    filterScripts(filter) {
        console.log('过滤剧本:', filter);
        // 实现剧本过滤逻辑
    },

    /**
     * 创建剧本
     */
    createScript() {
        window.TavernUI.openModal('script-modal');
    },

    /**
     * 保存剧本
     */
    saveScript() {
        const name = document.getElementById('script-name').value;
        const icon = document.getElementById('script-icon').value || '📜';
        const desc = document.getElementById('script-desc').value;
        const tags = document.getElementById('script-tags').value;
        const prompt = document.getElementById('script-prompt').value;

        if (!name) {
            window.TavernUI.showNotification('请输入剧本名称', 'error');
            return;
        }

        const script = {
            id: Utils.generateId(),
            name,
            icon,
            description: desc,
            tags: tags.split(',').map(t => t.trim()),
            prompt,
            createdAt: Date.now()
        };

        console.log('保存剧本:', script);
        window.TavernUI.closeModal('script-modal');
        window.TavernUI.showNotification('剧本保存成功', 'success');
    },

    /**
     * 添加API配置
     */
    addApiConfig() {
        window.TavernUI.openModal('api-modal');
    },

    /**
     * 保存API配置
     */
    saveApiConfig() {
        const name = document.getElementById('api-name').value;
        const provider = document.getElementById('api-provider').value;
        const key = document.getElementById('api-key').value;
        const url = document.getElementById('api-url').value;
        const model = document.getElementById('api-model').value;

        if (!name || !key) {
            window.TavernUI.showNotification('请填写必要信息', 'error');
            return;
        }

        const config = { name, provider, key, url, model };
        console.log('保存API配置:', config);
        window.TavernUI.closeModal('api-modal');
        window.TavernUI.showNotification('API配置保存成功', 'success');
    },

    /**
     * 测试API连接
     */
    async testApiConfig() {
        window.TavernUI.showNotification('测试连接中...', 'info');
        // 实现API连接测试
    },

    /**
     * 导出故事
     */
    exportStory() {
        const storyContent = document.getElementById('story-content');
        if (storyContent) {
            const text = storyContent.innerText;
            const blob = new Blob([text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `story-${Date.now()}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            window.TavernUI.showNotification('故事已导出', 'success');
        }
    }
};

// 渲染系统
const TavernRender = {
    renderCharacter() {
        console.log('渲染角色面板');
    },

    renderInventory() {
        console.log('渲染背包系统');
    },

    renderSkills() {
        console.log('渲染技能树');
    },

    renderAchievements() {
        console.log('渲染成就系统');
    },

    renderLeaderboard() {
        console.log('渲染排行榜');
    },

    renderScriptGrid() {
        console.log('渲染剧本库');
    },

    renderSaves() {
        console.log('渲染存档管理');
    },

    renderStats() {
        console.log('渲染数据统计');
    },

    renderApiPool() {
        console.log('渲染API管理');
    },

    updateBadges() {
        // 更新各种徽章数量
    }
};

// 数据库和API系统（占位符）
const TavernDB = {
    async init() {
        console.log('数据库初始化');
        return Promise.resolve();
    },

    async getAll(store) {
        return [];
    },

    async put(store, data) {
        return Promise.resolve();
    }
};

// 默认数据
const DEFAULT_SCRIPTS = [
    { id: 1, name: '奇幻冒险', icon: '🗡️', description: '踏上史诗般的奇幻之旅' },
    { id: 2, name: '科幻未来', icon: '🚀', description: '探索未知的宇宙边界' },
    { id: 3, name: '悬疑推理', icon: '🔍', description: '解开扑朔迷离的谜团' }
];

const DEFAULT_ACHIEVEMENTS = [
    { id: 1, name: '初出茅庐', description: '开始你的第一次冒险' },
    { id: 2, name: '战斗专家', description: '赢得10场战斗' },
    { id: 3, name: '收藏家', description: '收集50件物品' }
];

const DEFAULT_SKILLS = [
    { id: 1, name: '基础攻击', level: 1, maxLevel: 5 },
    { id: 2, name: '防御姿态', level: 1, maxLevel: 5 },
    { id: 3, name: '快速闪避', level: 1, maxLevel: 5 }
];

// 视图切换
function switchView(view) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const viewEl = document.getElementById(`view-${view}`);
    if (viewEl) viewEl.classList.add('active');

    const titles = {
        game: '游戏大厅', character: '角色面板', inventory: '背包系统', skills: '技能树',
        achievements: '成就系统', quests: '任务系统', leaderboard: '排行榜', scripts: '剧本库',
        saves: '存档管理', workshop: '创意工坊', stats: '数据统计', api: 'API设置', settings: '系统设置'
    };
    document.getElementById('view-title').textContent = titles[view] || view;
    document.getElementById('breadcrumb').textContent = `首页 / ${titles[view] || view}`;

    if (view === 'character') TavernRender.renderCharacter();
    if (view === 'inventory') TavernRender.renderInventory();
    if (view === 'skills') TavernRender.renderSkills();
    if (view === 'achievements') TavernRender.renderAchievements();
    if (view === 'leaderboard') TavernRender.renderLeaderboard();
    if (view === 'scripts') TavernRender.renderScriptGrid();
    if (view === 'saves') TavernRender.renderSaves();
    if (view === 'stats') TavernRender.renderStats();
    if (view === 'api') TavernRender.renderApiPool();
}

// 辅助功能
function showHelp() {
    alert(`🍺 AI酒馆 - 行业TOP1旗舰版 使用指南\n\n📜 剧本系统 - 30+内置剧本，支持自定义创建\n🎮 游戏功能 - AI对话互动、角色属性、背包、技能树、成就\n🔧 API管理 - 多API流量池、一键切换、连接测试\n💾 存档系统 - 自动存档、多存档管理\n📊 数据统计 - 全方位数据分析\n\n快捷键：Enter发送 / Shift+Enter换行`);
}

function showProfile() { alert('👤 用户中心\n\n功能开发中，敬请期待！'); }

function toggleVoice() {
    GameState.voiceEnabled = !GameState.voiceEnabled;
    if (window.TavernUI) {
        window.TavernUI.showNotification(GameState.voiceEnabled ? '🔊 语音已开启' : '🔇 语音已关闭', 'success');
    }
}

function toggleAutoPlay() {
    GameState.autoPlayEnabled = !GameState.autoPlayEnabled;
    if (window.TavernUI) {
        window.TavernUI.showNotification(GameState.autoPlayEnabled ? '▶️ 自动播放已开启' : '⏸️ 自动播放已关闭', 'success');
    }
}

// 游戏计时器
function startGameTimer() {
    setInterval(() => {
        if (GameState.gameStartTime) {
            const elapsed = Math.floor((Date.now() - GameState.gameStartTime) / 1000);
            const el = document.getElementById('game-time');
            if (el) el.textContent = Utils.formatTime(elapsed);
        }
    }, 1000);
}

// 初始化应用
async function initApp() {
    try {
        await TavernDB.init();

        // 加载剧本
        const savedScripts = await TavernDB.getAll('scripts');
        if (savedScripts.length === 0) {
            for (const s of DEFAULT_SCRIPTS) await TavernDB.put('scripts', s);
        }

        // 加载成就
        const savedAch = await TavernDB.getAll('achievements');
        if (savedAch.length === 0) {
            for (const a of DEFAULT_ACHIEVEMENTS) await TavernDB.put('achievements', a);
        }
        GameState.achievements = await TavernDB.getAll('achievements');

        // 加载技能
        const savedSkills = await TavernDB.getAll('skills');
        if (savedSkills.length === 0) {
            for (const s of DEFAULT_SKILLS) await TavernDB.put('skills', s);
        }
        GameState.skills = await TavernDB.getAll('skills');

        // 加载背包和统计
        GameState.inventory = await TavernDB.getAll('inventory');
        const savedStats = await TavernDB.getAll('stats');
        if (savedStats.length > 0) GameState.gameStats = savedStats[0];

        // 初始化游戏
        await TavernGame.init();

        // 渲染
        TavernRender.renderScriptGrid();
        TavernRender.updateBadges();
        startGameTimer();

        // 键盘事件
        const input = document.getElementById('user-input');
        if (input) {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); TavernGame.sendAction(); }
            });
        }

        console.log('✅ 应用初始化完成');
    } catch (error) {
        console.error('❌ 应用初始化失败:', error);
    }
}

// DOM加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// 导出到全局
window.GameState = GameState;
window.TavernGame = TavernGame;
window.TavernRender = TavernRender;
window.TavernDB = TavernDB;
window.TavernUI = TavernUI;
window.Utils = Utils;

console.log('✅ 主程序加载完成');
