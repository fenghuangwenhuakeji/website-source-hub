/**
 * 模块化核心架构 - AI酒馆增强版
 * 
 * 特性:
 * - 模块懒加载
 * - Keep-Alive 视图缓存
 * - 统一状态管理
 * - 事件驱动通信
 */

import { dbManager } from './db_manager.js';
import { eventBus } from './event_bus.js';
import { ThreeLayerMemorySystem } from '../systems/memory_system.js';
import { WorkspaceManager } from '../systems/workspace_manager.js';

const Modules = {};
const ViewCache = new Map();
let CurrentModule = null;

class AppCore {
    constructor() {
        this.db = null;
        this.memory = null;
        this.workspace = null;
        this.state = this._createReactiveState();
        this._initialized = false;
    }

    _createReactiveState() {
        const state = {
            currentView: 'game',
            currentScript: null,
            gameRunning: false,
            sidebarCollapsed: false,
            theme: 'dark',
            notifications: []
        };

        return new Proxy(state, {
            set(target, key, value) {
                const oldVal = target[key];
                target[key] = value;
                eventBus.emit('state-change', { key, oldVal, newVal: value });
                return true;
            }
        });
    }

    async init() {
        if (this._initialized) return;
        
        try {
            this.db = dbManager;
            await this.db.init();
            
            this.memory = new ThreeLayerMemorySystem(this.db);
            await this.memory.init();
            
            this.workspace = new WorkspaceManager(this.db);
            await this.workspace.init();
            
            this._registerModules();
            this._bindGlobalEvents();
            
            this._initialized = true;
            console.log('AppCore initialized successfully');
            
            eventBus.emit('app-ready');
            
        } catch (e) {
            console.error('AppCore init error:', e);
            this._showError('初始化失败: ' + e.message);
        }
    }

    _registerModules() {
        Modules.game = {
            name: '游戏大厅',
            icon: '🎮',
            render: () => this._renderGameModule(),
            init: () => this._initGameModule()
        };

        Modules.character = {
            name: '角色面板',
            icon: '👤',
            render: () => this._renderCharacterModule(),
            init: () => this._initCharacterModule()
        };

        Modules.inventory = {
            name: '背包系统',
            icon: '🎒',
            render: () => this._renderInventoryModule(),
            init: () => this._initInventoryModule()
        };

        Modules.skills = {
            name: '技能树',
            icon: '⚡',
            render: () => this._renderSkillsModule(),
            init: () => this._initSkillsModule()
        };

        Modules.achievements = {
            name: '成就系统',
            icon: '🏆',
            render: () => this._renderAchievementsModule(),
            init: () => this._initAchievementsModule()
        };

        Modules.scripts = {
            name: '剧本库',
            icon: '📜',
            render: () => this._renderScriptsModule(),
            init: () => this._initScriptsModule()
        };

        Modules.saves = {
            name: '存档管理',
            icon: '💾',
            render: () => this._renderSavesModule(),
            init: () => this._initSavesModule()
        };

        Modules.workshop = {
            name: '创意工坊',
            icon: '🛠️',
            render: () => this._renderWorkshopModule(),
            init: () => this._initWorkshopModule()
        };

        Modules.memory = {
            name: '记忆系统',
            icon: '🧠',
            render: () => this._renderMemoryModule(),
            init: () => this._initMemoryModule()
        };

        Modules.workspace = {
            name: '工作空间',
            icon: '🗂️',
            render: () => this._renderWorkspaceModule(),
            init: () => this._initWorkspaceModule()
        };

        Modules.settings = {
            name: '系统设置',
            icon: '⚙️',
            render: () => this._renderSettingsModule(),
            init: () => this._initSettingsModule()
        };

        Modules.api = {
            name: 'API设置',
            icon: '🔧',
            render: () => this._renderApiModule(),
            init: () => this._initApiModule()
        };
    }

    _bindGlobalEvents() {
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.view) {
                this.nav(e.state.view, false);
            }
        });

        window.addEventListener('workspace-switched', async (e) => {
            console.log('Workspace switched:', e.detail);
            await this._refreshAllModules();
        });

        eventBus.on('state-change', ({ key, oldVal, newVal }) => {
            if (key === 'theme') {
                document.body.className = `theme-${newVal}`;
            }
        });
    }

    nav(moduleName, pushState = true) {
        if (!Modules[moduleName]) {
            console.warn(`Module "${moduleName}" not found`);
            return;
        }

        CurrentModule = moduleName;
        this.state.currentView = moduleName;

        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.toggle('active', el.dataset.view === moduleName);
        });

        const viewport = document.getElementById('viewport');
        if (!viewport) return;

        Array.from(viewport.children).forEach(child => {
            child.style.display = 'none';
        });

        let view = ViewCache.get(moduleName);

        if (!view) {
            view = document.createElement('div');
            view.id = `view-${moduleName}`;
            view.className = 'view-container animate-fade-in';
            view.innerHTML = Modules[moduleName].render();
            viewport.appendChild(view);
            ViewCache.set(moduleName, view);

            if (Modules[moduleName].init) {
                try {
                    Modules[moduleName].init();
                } catch (e) {
                    console.error(`Module ${moduleName} init error:`, e);
                }
            }
        }

        view.style.display = 'block';

        if (pushState) {
            history.pushState({ view: moduleName }, Modules[moduleName].name);
        }

        const titleEl = document.getElementById('view-title');
        if (titleEl) {
            titleEl.textContent = Modules[moduleName].name;
        }

        setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
    }

    async _refreshAllModules() {
        ViewCache.clear();
        if (CurrentModule) {
            this.nav(CurrentModule, false);
        }
    }

    _renderGameModule() {
        return `
            <div class="game-module">
                <div class="card">
                    <div class="card-title">
                        <span>📜 选择剧本开始冒险</span>
                        <div class="btn-group">
                            <button class="btn btn-sm" onclick="App.filterScripts('all')">全部</button>
                            <button class="btn btn-sm" onclick="App.filterScripts('hot')">🔥 热门</button>
                            <button class="btn btn-sm" onclick="App.filterScripts('new')">🆕 最新</button>
                        </div>
                    </div>
                    <div class="script-grid" id="script-grid"></div>
                </div>
                <div id="game-interface" style="display:none;">
                    ${this._renderGameInterface()}
                </div>
            </div>
        `;
    }

    _renderGameInterface() {
        return `
            <div class="game-area">
                <div class="character-panel">
                    <div class="character-header">
                        <div class="character-avatar">👤</div>
                        <div class="character-name" id="char-name">冒险者</div>
                        <div class="character-level" id="char-level">等级 1</div>
                    </div>
                    <div class="character-body">
                        <div class="stat-bar">
                            <div class="stat-bar-label"><span>❤️ 生命值</span><span id="hp-text">100/100</span></div>
                            <div class="stat-bar-bg"><div class="stat-bar-fill hp" id="hp-bar" style="width:100%"></div></div>
                        </div>
                        <div class="stat-bar">
                            <div class="stat-bar-label"><span>💙 魔法值</span><span id="mp-text">100/100</span></div>
                            <div class="stat-bar-bg"><div class="stat-bar-fill mp" id="mp-bar" style="width:100%"></div></div>
                        </div>
                        <div class="stat-bar">
                            <div class="stat-bar-label"><span>💜 经验值</span><span id="exp-text">0/100</span></div>
                            <div class="stat-bar-bg"><div class="stat-bar-fill exp" id="exp-bar" style="width:0%"></div></div>
                        </div>
                    </div>
                </div>
                <div class="story-panel">
                    <div class="story-header">
                        <span>📖 故事进程</span>
                        <div class="quick-actions">
                            <button class="quick-btn" onclick="App.exportStory()">📤 导出</button>
                            <button class="quick-btn" onclick="App.toggleMemory()">🧠 记忆</button>
                        </div>
                    </div>
                    <div class="story-content" id="story-content"></div>
                    <div class="input-area">
                        <textarea id="user-input" placeholder="输入你的行动..."></textarea>
                        <button class="btn btn-primary" onclick="App.sendAction()">发送</button>
                    </div>
                </div>
            </div>
        `;
    }

    _initGameModule() {
        this._loadScripts();
    }

    async _loadScripts() {
        let scripts = [];
        try {
            scripts = await this.db.getAll('scripts');
        } catch (e) {
            console.warn('Load scripts error:', e);
        }

        if (scripts.length === 0) {
            scripts = this._getDefaultScripts();
            for (const s of scripts) {
                await this.db.put('scripts', s);
            }
        }

        this._renderScriptGrid(scripts);
    }

    _getDefaultScripts() {
        return [
            {
                id: 'fantasy_adventure',
                name: '奇幻冒险',
                desc: '在一个充满魔法与怪物的世界中展开冒险',
                icon: '🐉',
                tags: ['奇幻', '冒险', 'RPG'],
                prompt: '你是一个奇幻世界的冒险者，拥有基础的剑术和魔法能力。你的旅程从一个小村庄开始...',
                hot: true
            },
            {
                id: 'cyberpunk_city',
                name: '赛博都市',
                desc: '在霓虹灯下的未来都市中生存与探索',
                icon: '🌃',
                tags: ['科幻', '赛博朋克', '悬疑'],
                prompt: '2077年，你是一名赛博都市的赏金猎人，在这座钢铁丛林中追踪目标...',
                hot: true
            },
            {
                id: 'cultivation',
                name: '修仙之路',
                desc: '踏上修仙问道之路，追求长生',
                icon: '☯️',
                tags: ['仙侠', '修真', '玄幻'],
                prompt: '你是一名刚入门的修仙者，拥有一个神秘的玉佩...',
                hot: true
            },
            {
                id: 'detective',
                name: '侦探故事',
                desc: '破解扑朔迷离的案件',
                icon: '🔍',
                tags: ['推理', '悬疑', '都市'],
                prompt: '你是一名私家侦探，刚刚接到一个离奇的失踪案...',
                new: true
            },
            {
                id: 'apocalypse',
                name: '末日生存',
                desc: '在末日世界中寻找生存之道',
                icon: '☢️',
                tags: ['末日', '生存', '恐怖'],
                prompt: '丧尸病毒爆发后，你独自一人在废弃的城市中寻找物资...',
                new: true
            },
            {
                id: 'romance',
                name: '都市情缘',
                desc: '在现代都市中展开一段浪漫故事',
                icon: '💕',
                tags: ['言情', '都市', '甜宠'],
                prompt: '你刚刚搬到一座新城市，在咖啡馆遇到了一个特别的人...'
            }
        ];
    }

    _renderScriptGrid(scripts) {
        const grid = document.getElementById('script-grid');
        if (!grid) return;

        grid.innerHTML = scripts.map(s => `
            <div class="script-card" onclick="App.startGame('${s.id}')">
                <div class="script-icon">${s.icon}</div>
                <div class="script-info">
                    <div class="script-name">${s.name}</div>
                    <div class="script-desc">${s.desc}</div>
                    <div class="script-tags">
                        ${s.tags.map(t => `<span class="tag">${t}</span>`).join('')}
                        ${s.hot ? '<span class="tag hot">🔥 热门</span>' : ''}
                        ${s.new ? '<span class="tag new">🆕 新品</span>' : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    async startGame(scriptId) {
        const scripts = await this.db.getAll('scripts');
        const script = scripts.find(s => s.id === scriptId);
        if (!script) return;

        this.state.currentScript = script;
        this.state.gameRunning = true;

        this.memory.newSession();
        this.memory.addMessage(script.prompt, 'system', { priority: 5 });

        document.getElementById('game-interface').style.display = 'block';
        document.querySelector('.script-grid').style.display = 'none';

        const storyContent = document.getElementById('story-content');
        if (storyContent) {
            storyContent.innerHTML = `
                <div class="story-message system">
                    <div class="message-content">🎮 游戏开始：${script.name}</div>
                </div>
            `;
        }

        eventBus.emit('game-started', { script });
    }

    async sendAction() {
        const input = document.getElementById('user-input');
        const action = input?.value?.trim();
        if (!action || !this.state.gameRunning) return;

        input.value = '';

        this.memory.addMessage(action, 'user');

        this._addStoryMessage('user', action);

        this._showTyping();

        try {
            const context = this.memory.getContext(4000);
            const response = await this._callAI(context);
            
            this._hideTyping();
            this._addStoryMessage('assistant', response);
            
            this.memory.addMessage(response, 'assistant');
            
            eventBus.emit('action-processed', { action, response });
        } catch (e) {
            this._hideTyping();
            this._addStoryMessage('error', '❌ 发生错误: ' + e.message);
        }
    }

    async _callAI(context) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(`(AI回复模拟) 你选择了「${context[context.length - 1]?.content?.slice(0, 20)}...」，故事继续发展...`);
            }, 1000);
        });
    }

    _addStoryMessage(role, content) {
        const storyContent = document.getElementById('story-content');
        if (!storyContent) return;

        const msg = document.createElement('div');
        msg.className = `story-message ${role}`;
        msg.innerHTML = `<div class="message-content">${content}</div>`;
        storyContent.appendChild(msg);
        storyContent.scrollTop = storyContent.scrollHeight;
    }

    _showTyping() {
        const storyContent = document.getElementById('story-content');
        if (!storyContent) return;

        const typing = document.createElement('div');
        typing.id = 'typing-indicator';
        typing.className = 'story-message assistant typing';
        typing.innerHTML = '<div class="message-content"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>';
        storyContent.appendChild(typing);
        storyContent.scrollTop = storyContent.scrollHeight;
    }

    _hideTyping() {
        const typing = document.getElementById('typing-indicator');
        if (typing) typing.remove();
    }

    _renderCharacterModule() {
        return `
            <div class="character-module">
                <div class="card">
                    <h3>👤 角色面板</h3>
                    <div class="character-display">
                        <div class="character-avatar-large">🧙</div>
                        <div class="character-info">
                            <div class="info-row"><span>名称</span><span id="char-name-display">冒险者</span></div>
                            <div class="info-row"><span>等级</span><span id="char-level-display">1</span></div>
                            <div class="info-row"><span>职业</span><span id="char-class">未知</span></div>
                        </div>
                    </div>
                </div>
                <div class="card">
                    <h3>📊 属性</h3>
                    <div class="attributes-grid">
                        <div class="attr-item"><span>力量</span><span id="attr-str">10</span></div>
                        <div class="attr-item"><span>敏捷</span><span id="attr-agi">10</span></div>
                        <div class="attr-item"><span>智力</span><span id="attr-int">10</span></div>
                        <div class="attr-item"><span>幸运</span><span id="attr-luk">10</span></div>
                    </div>
                </div>
            </div>
        `;
    }

    _initCharacterModule() {}

    _renderInventoryModule() {
        return `
            <div class="inventory-module">
                <div class="card">
                    <h3>🎒 背包 <span class="badge" id="inventory-count">0/50</span></h3>
                    <div class="inventory-grid" id="inventory-grid">
                        <div class="empty-state">暂无物品</div>
                    </div>
                </div>
            </div>
        `;
    }

    _initInventoryModule() {}

    _renderSkillsModule() {
        return `
            <div class="skills-module">
                <div class="card">
                    <h3>⚡ 技能树</h3>
                    <div class="skills-container">
                        <div class="skill-branch">
                            <h4>⚔️ 战斗</h4>
                            <div class="skill-list" id="combat-skills"></div>
                        </div>
                        <div class="skill-branch">
                            <h4>✨ 魔法</h4>
                            <div class="skill-list" id="magic-skills"></div>
                        </div>
                        <div class="skill-branch">
                            <h4>🎯 生存</h4>
                            <div class="skill-list" id="survival-skills"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    _initSkillsModule() {}

    _renderAchievementsModule() {
        return `
            <div class="achievements-module">
                <div class="card">
                    <h3>🏆 成就系统</h3>
                    <div class="achievements-grid" id="achievements-grid">
                        <div class="empty-state">暂无成就</div>
                    </div>
                </div>
            </div>
        `;
    }

    _initAchievementsModule() {}

    _renderScriptsModule() {
        return `
            <div class="scripts-module">
                <div class="card">
                    <h3>📜 剧本库管理</h3>
                    <div class="scripts-toolbar">
                        <button class="btn btn-primary" onclick="App.createScript()">➕ 新建剧本</button>
                        <button class="btn" onclick="App.importScripts()">📥 导入</button>
                        <button class="btn" onclick="App.exportScripts()">📤 导出</button>
                    </div>
                    <div class="scripts-list" id="scripts-list"></div>
                </div>
            </div>
        `;
    }

    _initScriptsModule() {}

    _renderSavesModule() {
        return `
            <div class="saves-module">
                <div class="card">
                    <h3>💾 存档管理</h3>
                    <div class="saves-toolbar">
                        <button class="btn btn-primary" onclick="App.quickSave()">💾 快速存档</button>
                        <button class="btn" onclick="App.autoSave()">🔄 自动存档</button>
                    </div>
                    <div class="saves-list" id="saves-list">
                        <div class="empty-state">暂无存档</div>
                    </div>
                </div>
            </div>
        `;
    }

    _initSavesModule() {}

    _renderWorkshopModule() {
        return `
            <div class="workshop-module">
                <div class="card">
                    <h3>🛠️ 创意工坊</h3>
                    <p class="module-desc">创建和分享你的剧本、角色、物品等游戏内容</p>
                    <div class="workshop-tabs">
                        <button class="tab-btn active" onclick="App.switchWorkshopTab('scripts')">剧本创作</button>
                        <button class="tab-btn" onclick="App.switchWorkshopTab('characters')">角色设计</button>
                        <button class="tab-btn" onclick="App.switchWorkshopTab('items')">物品制作</button>
                    </div>
                    <div class="workshop-content" id="workshop-content">
                        ${this._renderWorkshopScripts()}
                    </div>
                </div>
            </div>
        `;
    }

    _renderWorkshopScripts() {
        return `
            <div class="workshop-form">
                <div class="form-group">
                    <label>剧本名称</label>
                    <input type="text" id="ws-script-name" placeholder="输入剧本名称">
                </div>
                <div class="form-group">
                    <label>剧本描述</label>
                    <textarea id="ws-script-desc" placeholder="描述你的剧本..."></textarea>
                </div>
                <div class="form-group">
                    <label>开场提示词</label>
                    <textarea id="ws-script-prompt" placeholder="AI将根据此提示词开始故事..." rows="5"></textarea>
                </div>
                <div class="form-group">
                    <label>标签 (用逗号分隔)</label>
                    <input type="text" id="ws-script-tags" placeholder="奇幻, 冒险, RPG">
                </div>
                <button class="btn btn-primary" onclick="App.saveWorkshopScript()">保存剧本</button>
            </div>
        `;
    }

    _initWorkshopModule() {}

    _renderMemoryModule() {
        return `
            <div class="memory-module">
                <div class="card">
                    <h3>🧠 记忆系统</h3>
                    <div class="memory-stats" id="memory-stats"></div>
                </div>
                <div class="card">
                    <h3>📝 当前上下文</h3>
                    <div class="memory-context" id="memory-context">
                        <div class="empty-state">暂无记忆</div>
                    </div>
                </div>
                <div class="card">
                    <h3>⚙️ 记忆操作</h3>
                    <div class="memory-actions">
                        <button class="btn" onclick="App.exportMemory()">📤 导出记忆</button>
                        <button class="btn" onclick="App.clearMemory()">🗑️ 清空记忆</button>
                        <button class="btn" onclick="App.consolidateMemory()">💾 巩固记忆</button>
                    </div>
                </div>
            </div>
        `;
    }

    _initMemoryModule() {
        this._updateMemoryStats();
    }

    _updateMemoryStats() {
        const stats = this.memory?.getStats();
        const container = document.getElementById('memory-stats');
        if (!container || !stats) return;

        container.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">工作记忆</span>
                <span class="stat-value">${stats.working.size} 条 / ${stats.working.totalTokens} tokens</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">会话记忆</span>
                <span class="stat-value">${stats.session.itemCount} 条</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">压缩率</span>
                <span class="stat-value">${stats.working.compressedCount} 条已压缩</span>
            </div>
        `;
    }

    _renderWorkspaceModule() {
        const ws = this.workspace?.getCurrentWorkspace() || { name: '未设置', type: 'unknown' };
        return `
            <div class="workspace-module">
                <div class="card">
                    <h3>🗂️ 工作空间管理</h3>
                    <div class="workspace-info">
                        <div class="info-row">
                            <span>当前工作空间</span>
                            <span class="highlight">${ws.name}</span>
                        </div>
                        <div class="info-row">
                            <span>类型</span>
                            <span>${ws.type === 'virtual' ? '虚拟工作空间' : ws.type === 'electron' ? '本地文件夹' : '浏览器存储'}</span>
                        </div>
                    </div>
                    <div class="workspace-actions">
                        <button class="btn btn-primary" onclick="App.switchWorkspace()">🔄 切换工作空间</button>
                        <button class="btn" onclick="App.backupWorkspace()">💾 备份数据</button>
                        <button class="btn" onclick="App.restoreWorkspace()">📥 恢复数据</button>
                    </div>
                </div>
            </div>
        `;
    }

    _initWorkspaceModule() {}

    _renderSettingsModule() {
        return `
            <div class="settings-module">
                <div class="card">
                    <h3>⚙️ 系统设置</h3>
                    <div class="settings-list">
                        <div class="setting-item">
                            <span>主题</span>
                            <select id="theme-select" onchange="App.setTheme(this.value)">
                                <option value="dark">深色</option>
                                <option value="light">浅色</option>
                            </select>
                        </div>
                        <div class="setting-item">
                            <span>自动存档</span>
                            <input type="checkbox" id="auto-save-toggle" checked>
                        </div>
                        <div class="setting-item">
                            <span>记忆压缩</span>
                            <input type="checkbox" id="memory-compress-toggle" checked>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    _initSettingsModule() {}

    _renderApiModule() {
        return `
            <div class="api-module">
                <div class="card">
                    <h3>🔧 API 设置</h3>
                    <div class="api-form">
                        <div class="form-group">
                            <label>API 端点</label>
                            <input type="text" id="api-endpoint" placeholder="https://api.example.com/v1">
                        </div>
                        <div class="form-group">
                            <label>API Key</label>
                            <input type="password" id="api-key" placeholder="sk-...">
                        </div>
                        <div class="form-group">
                            <label>模型</label>
                            <input type="text" id="api-model" placeholder="gpt-4">
                        </div>
                        <button class="btn btn-primary" onclick="App.saveApiSettings()">保存设置</button>
                        <button class="btn" onclick="App.testApiConnection()">测试连接</button>
                    </div>
                </div>
            </div>
        `;
    }

    _initApiModule() {}

    async switchWorkspace() {
        if (this.workspace) {
            await this.workspace.pickWorkspace();
            this.nav('workspace', false);
        }
    }

    async backupWorkspace() {
        if (this.workspace) {
            await this.workspace.downloadBackup();
        }
    }

    async restoreWorkspace() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file && this.workspace) {
                await this.workspace.uploadBackup(file);
                await this._refreshAllModules();
            }
        };
        input.click();
    }

    async exportMemory() {
        if (this.memory) {
            const data = await this.memory.exportMemory();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tavern_memory_${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
    }

    clearMemory() {
        if (this.memory && confirm('确定要清空所有记忆吗？')) {
            this.memory.newSession();
            this._updateMemoryStats();
        }
    }

    async consolidateMemory() {
        if (this.memory) {
            const count = await this.memory.consolidateSession();
            this._showToast(`已巩固 ${count} 条记忆到长期存储`);
        }
    }

    setTheme(theme) {
        this.state.theme = theme;
        document.body.className = `theme-${theme}`;
    }

    _showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'app-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            color: #fff;
            padding: 12px 20px;
            border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.1);
            z-index: 10001;
            font-size: 13px;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    _showError(message) {
        const error = document.createElement('div');
        error.className = 'app-error';
        error.innerHTML = `
            <div class="error-content">
                <span>❌ ${message}</span>
                <button onclick="this.parentElement.parentElement.remove()">关闭</button>
            </div>
        `;
        error.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: #fff;
            padding: 16px 20px;
            border-radius: 8px;
            z-index: 10002;
        `;
        document.body.appendChild(error);
    }
}

const App = new AppCore();

window.addEventListener('DOMContentLoaded', () => App.init());

export { App, Modules, ViewCache };
