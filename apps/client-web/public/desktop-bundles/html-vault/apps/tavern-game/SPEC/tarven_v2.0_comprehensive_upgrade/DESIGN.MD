# Tarven游戏 V2.0 - 全面升级设计文档

> **文档版本**: v1.0
> **创建日期**: 2026-03-07
> **关联需求**: REQUIREMENT.MD v1.0
> **关联任务**: TASK.MD v1.0
> **当前迭代**: Round 1 - 需求确认与架构设计

---

## 文档说明

本文档基于`REQUIREMENT.MD`中的需求,进行系统架构设计、模块设计、接口设计。设计文档会随着需求迭代不断更新完善。

**设计原则**:
- **模块化**: 高内聚、低耦合的模块设计
- **可扩展**: 预留扩展点,支持未来功能扩展
- **性能优先**: 优化渲染和逻辑性能
- **可维护**: 代码结构清晰,易于维护
- **AI集成**: 支持AI生成和智能交互

---

## 📊 设计状态追踪

### 迭代Round 1 设计状态 (2026-03-07 ~ 进行中)

#### ✅ 已完成设计 (17/20+)
- ✅ 系统架构V2.0设计
- ✅ 目录结构V2.0设计
- ✅ GameEngineV2核心引擎设计
- ✅ AssetManager资源管理器设计
- ✅ Renderer渲染器设计
- ✅ ParticleSystem粒子系统设计
- ✅ AnimationSystem动画系统设计
- ✅ EffectSystem特效系统设计
- ✅ CharacterSystemV2角色系统设计
- ✅ BattleSystemV2战斗系统设计
- ✅ MapSystemV2地图系统设计
- ✅ TavernSystemV2酒馆系统设计
- ✅ NPCSystem NPC系统设计
- ✅ AIGenerator AI生成器设计
- ✅ UIComponent组件系统设计
- ✅ 性能优化方案 (对象池、懒加载)
- ✅ 数据结构V2.0设计

#### 🟡 进行中设计 (3/20+)
- 🟡 AI系统深度优化
- 🟡 3D渲染引擎集成方案
- 🟡 WebSockets通信架构 (可选)

#### ⏳ 待开始设计 (0/20+)
- 所有关键设计已完成

#### 📝 设计调整记录

| 调整ID | 设计模块 | 调整类型 | 调整内容 | 调整原因 | 影响范围 | 调整日期 |
|--------|---------|---------|---------|---------|---------|---------|
| 暂无 | - | - | - | - | - | - |

**设计完成度**: 🟡 85% (17/20+项设计已完成)

---

### 技术债务记录

| 债务ID | 描述 | 优先级 | 预计工时 | 计划处理时间 | 负责人 | 状态 |
|--------|------|--------|---------|------------|--------|------|
| TD-001 | 需求范围过大，需要分阶段实现 | P0 | 待定 | Round 2 | 项目经理 | 🟡 已识别 |
| TD-002 | AI集成复杂度未知，需要先实现基础功能 | P0 | 待定 | Round 4 | AI工程师 | 🟡 已识别 |
| TD-003 | 性能优化需要预留充足时间 | P1 | 待定 | Round 5 | 性能工程师 | 🟡 已识别 |

---

## 1. 系统架构升级

### 1.1 整体架构V2.0

```
UNIFIED_TAVERN_GAME V2.0/
├── index.html                          # 主入口
├── css/
│   ├── styles.css                      # 主样式
│   ├── animations.css                  # 动画样式
│   ├── themes/                         # 主题系统
│   │   ├── dark.css
│   │   └── light.css
│   └── components/                    # 组件样式
│       ├── buttons.css
│       ├── cards.css
│       ├── modals.css
│       └── tooltips.css
├── js/
│   ├── core/                           # 核心引擎升级
│   │   ├── game-engine.js              # 游戏引擎V2
│   │   ├── state-manager.js            # 状态管理器
│   │   ├── event-system.js             # 事件系统
│   │   ├── asset-manager.js            # 资源管理器
│   │   └── ui-manager.js               # UI管理器
│   ├── systems/                        # 游戏系统升级
│   │   ├── character-system.js         # 角色系统V2
│   │   ├── battle-system.js            # 战斗系统V2
│   │   ├── card-system.js              # 卡牌系统V2
│   │   ├── map-system.js               # 地图系统V2
│   │   ├── tavern-system.js            # 酒馆系统V2
│   │   ├── quest-system.js             # 任务系统V2
│   │   ├── story-system.js             # 剧情系统V2
│   │   ├── class-system.js             # 职业系统V2
│   │   ├── upgrade-system.js           # 升级系统V2
│   │   ├── save-system.js              # 存档系统V2
│   │   ├── audio-system.js             # 音频系统V2
│   │   ├── inventory-system.js         # 背包系统V2
│   │   ├── npc-system.js               # NPC系统V2
│   │   └── weather-system.js           # 天气系统
│   ├── graphics/                       # 图形系统（新增）
│   │   ├── renderer.js                 # 渲染引擎
│   │   ├── sprite.js                   # 精灵管理
│   │   ├── animation.js                # 动画系统
│   │   ├── particle.js                 # 粒子系统
│   │   ├── effect.js                   # 特效系统
│   │   └── camera.js                   # 摄像机系统
│   ├── ai/                             # AI系统（新增）
│   │   ├── ai-generator.js             # AI生成器
│   │   ├── ai-dialogue.js              # AI对话
│   │   ├── ai-npc.js                   # AI NPC
│   │   ├── ai-recommender.js           # AI推荐
│   │   ├── cache-manager.js           # 缓存管理
│   │   └── prompt-engine.js            # 提示词引擎
│   ├── data/                           # 数据层升级
│   │   ├── game-data.js                # 游戏数据
│   │   ├── config.js                   # 配置数据
│   │   ├── constants.js                # 常量定义
│   │   ├── localization.js             # 本地化
│   │   └── schemas/                    # 数据模式
│   │       ├── character.js
│   │       ├── item.js
│   │       ├── skill.js
│   │       └── quest.js
│   ├── ui/                             # UI层（新增）
│   │   ├── ui-component.js             # UI组件基类
│   │   ├── ui-dialogue.js              # 对话框
│   │   ├── ui-hud.js                   # HUD
│   │   ├── ui-menu.js                  # 菜单
│   │   ├── ui-tooltip.js               # 提示框
│   │   └── ui-notification.js          # 通知
│   └── utils/                          # 工具类
│       ├── math.js                     # 数学工具
│       ├── storage.js                  # 存储工具
│       ├── helpers.js                  # 辅助函数
│       ├── validation.js               # 验证工具
│       └── performance.js              # 性能工具
├── assets/                             # 资源升级
│   ├── images/
│   │   ├── sprites/                    # 精灵图
│   │   ├── backgrounds/                # 背景图
│   │   ├── ui/                         # UI图片
│   │   ├── items/                      # 物品图标
│   │   ├── cards/                      # 卡牌图片
│   │   └── characters/                 # 角色图片
│   ├── audio/
│   │   ├── music/                      # 背景音乐
│   │   ├── sfx/                        # 音效
│   │   └── voice/                      # 语音
│   ├── fonts/                          # 字体
│   ├── shaders/                        # 着色器（WebGL）
│   └── data/                           # 数据文件
├── plugins/                            # 插件系统（新增）
│   ├── analytics.js                    # 统计分析
│   ├── social.js                       # 社交功能
│   └── iap.js                          # 内购（可选）
└── docs/                               # 文档
    ├── REQUIREMENT.MD
    ├── DESIGN.MD
    ├── TASK.MD
    └── API.MD                          # API文档
```

### 1.2 架构依赖关系

```
┌──────────────────────────────────────────────┐
│         Game Engine V2 (Core)               │
│  ┌──────────────────────────────────────┐   │
│  │  Asset Manager  │  State Manager    │   │
│  └──────────────────────────────────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │  Event System  │  UI Manager        │   │
│  └──────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│         Systems Layer (V2)                   │
│  ┌─────────┬─────────┬─────────┬──────────┐ │
│  │ Character│ Battle  │  Card   │  Map     │ │
│  │ System  │ System  │ System  │ System   │ │
│  └─────────┴─────────┴─────────┴──────────┘ │
│  ┌─────────┬─────────┬─────────┬──────────┐ │
│  │ Tavern  │  Quest  │  Story  │  NPC     │ │
│  │ System  │ System  │ System  │ System   │ │
│  └─────────┴─────────┴─────────┴──────────┘ │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│         Graphics Layer (New)                  │
│  ┌──────────────────────────────────────┐   │
│  │ Renderer │ Animation │ Particle    │   │
│  └──────────────────────────────────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │   Effect  │   Camera  │   Sprite    │   │
│  └──────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│         AI Layer (New)                        │
│  ┌──────────────────────────────────────┐   │
│  │ Generator │ Dialogue  │  NPC AI     │   │
│  └──────────────────────────────────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │ Recommender │ Cache  │ Prompts      │   │
│  └──────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│         Data Layer                            │
│  ┌──────────────────────────────────────┐   │
│  │  Game Data  │  Config  │  Constants  │   │
│  └──────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│         Presentation Layer                    │
│  ┌──────────────────────────────────────┐   │
│  │         UI Components V2             │   │
│  └──────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

---

## 2. 核心模块设计V2.0

### 2.1 游戏引擎升级 (GameEngine V2)

```javascript
class GameEngineV2 {
    constructor() {
        this.version = '2.0.0';
        this.player = null;
        this.currentView = 'main-menu';
        this.isInitialized = false;
        this.playTime = 0;
        this.frameCount = 0;
        this.lastFrameTime = 0;
        this.deltaTime = 0;
        this.fps = 60;

        // 新增
        this.assetManager = new AssetManager();
        this.stateManager = new StateManager();
        this.eventSystem = new EventSystem();
        this.uiManager = new UIManager();
        this.renderer = new Renderer();
        this.particleSystem = new ParticleSystem();
        this.aiGenerator = new AIGenerator();

        // 天气系统
        this.weatherSystem = new WeatherSystem();

        // 性能监控
        this.performanceMonitor = new PerformanceMonitor();

        // 插件系统
        this.plugins = new Map();
    }

    // 初始化游戏引擎
    async init() {
        if (this.isInitialized) return;

        console.log('初始化游戏引擎 V2.0...');

        // 加载配置
        await this.loadConfig();

        // 初始化资源管理器
        await this.assetManager.init();

        // 初始化渲染器
        await this.renderer.init();

        // 初始化粒子系统
        this.particleSystem.init(this.renderer);

        // 初始化AI生成器
        await this.aiGenerator.init();

        // 初始化天气系统
        this.weatherSystem.init();

        // 初始化所有系统
        await this.initSystems();

        // 绑定事件
        this.bindEvents();

        // 设置游戏循环
        this.startGameLoop();

        // 开始性能监控
        this.performanceMonitor.start();

        this.isInitialized = true;
        console.log('游戏引擎 V2.0 初始化完成');
    }

    // 加载配置
    async loadConfig() {
        const config = await fetch('/data/config.json').then(r => r.json());
        this.config = config;
    }

    // 初始化系统
    async initSystems() {
        const systems = [
            'audioSystem',
            'mapSystem',
            'tavernSystem',
            'cardSystem',
            'storySystem',
            'characterSystem',
            'upgradeSystem',
            'classSystem',
            'questSystem',
            'saveSystem',
            'inventorySystem',
            'npcSystem'
        ];

        for (const systemName of systems) {
            if (window[systemName]) {
                window[systemName].init();
            }
        }
    }

    // 游戏主循环（优化版）
    startGameLoop() {
        const gameLoop = (timestamp) => {
            this.calculateDeltaTime(timestamp);
            this.update(this.deltaTime);
            this.renderer.render();
            this.performanceMonitor.update();
            requestAnimationFrame(gameLoop);
        };
        requestAnimationFrame(gameLoop);
    }

    // 计算Delta Time
    calculateDeltaTime(timestamp) {
        if (!this.lastFrameTime) {
            this.lastFrameTime = timestamp;
        }
        this.deltaTime = (timestamp - this.lastFrameTime) / 1000;
        this.lastFrameTime = timestamp;

        // 计算FPS
        this.fps = Math.round(1 / this.deltaTime);
    }

    // 更新游戏状态
    update(deltaTime) {
        this.frameCount++;
        this.playTime += deltaTime;

        // 更新粒子系统
        this.particleSystem.update(deltaTime);

        // 更新天气系统
        this.weatherSystem.update(deltaTime);

        // 更新当前活动系统
        this.updateActiveSystem(deltaTime);
    }

    // 更新活动系统
    updateActiveSystem(deltaTime) {
        switch (this.currentView) {
            case 'map':
                mapSystem.update(deltaTime);
                break;
            case 'tavern':
                tavernSystem.update(deltaTime);
                break;
            case 'battle':
                battleSystem.update(deltaTime);
                break;
        }
    }

    // 注册插件
    registerPlugin(name, plugin) {
        this.plugins.set(name, plugin);
        plugin.init(this);
    }
}
```

### 2.2 资源管理器 (AssetManager)

```javascript
class AssetManager {
    constructor() {
        this.images = new Map();
        this.audio = new Map();
        this.data = new Map();
        this.loadedCount = 0;
        this.totalCount = 0;
    }

    async init() {
        console.log('初始化资源管理器...');
        await this.loadAssets();
    }

    // 加载资源
    async loadAssets() {
        const manifest = await fetch('/data/assets-manifest.json')
            .then(r => r.json());

        this.totalCount = manifest.images.length +
                         manifest.audio.length +
                         manifest.data.length;

        // 加载图片
        for (const img of manifest.images) {
            await this.loadImage(img.id, img.path);
        }

        // 加载音频
        for (const audio of manifest.audio) {
            await this.loadAudio(audio.id, audio.path);
        }

        // 加载数据
        for (const data of manifest.data) {
            await this.loadData(data.id, data.path);
        }
    }

    // 加载图片
    loadImage(id, path) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                this.images.set(id, img);
                this.loadedCount++;
                this.updateProgress();
                resolve();
            };
            img.src = path;
        });
    }

    // 加载音频
    async loadAudio(id, path) {
        const audio = new Audio(path);
        await new Promise(resolve => audio.oncanplaythrough = resolve);
        this.audio.set(id, audio);
        this.loadedCount++;
        this.updateProgress();
    }

    // 加载数据
    async loadData(id, path) {
        const data = await fetch(path).then(r => r.json());
        this.data.set(id, data);
        this.loadedCount++;
        this.updateProgress();
    }

    // 更新加载进度
    updateProgress() {
        const progress = (this.loadedCount / this.totalCount) * 100;
        this.eventSystem.emit('loading-progress', progress);
    }

    // 获取图片
    getImage(id) {
        return this.images.get(id);
    }

    // 获取音频
    getAudio(id) {
        return this.audio.get(id);
    }

    // 获取数据
    getData(id) {
        return this.data.get(id);
    }
}
```

### 2.3 渲染器 (Renderer)

```javascript
class Renderer {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 0;
        this.height = 0;
        this.layers = [];
        this.camera = new Camera();
    }

    async init() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        // 响应式画布
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    // 调整大小
    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    // 渲染
    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 应用摄像机变换
        this.camera.apply(this.ctx);

        // 渲染所有图层
        for (const layer of this.layers) {
            layer.render(this.ctx);
        }

        // 渲染粒子
        if (window.particleSystem) {
            window.particleSystem.render(this.ctx);
        }
    }

    // 添加图层
    addLayer(layer) {
        this.layers.push(layer);
        this.layers.sort((a, b) => a.zIndex - b.zIndex);
    }
}

// 摄像机类
class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.zoom = 1;
        this.target = null;
        this.following = false;
    }

    // 应用摄像机变换
    apply(ctx) {
        ctx.save();
        ctx.translate(this.width / 2, this.height / 2);
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.x, -this.y);
    }

    // 更新摄像机位置
    update() {
        if (this.following && this.target) {
            // 平滑跟随
            this.x += (this.target.x - this.x) * 0.1;
            this.y += (this.target.y - this.y) * 0.1;
        }
    }

    // 跟随目标
    follow(target) {
        this.target = target;
        this.following = true;
    }
}
```

### 2.4 粒子系统 (ParticleSystem)

```javascript
class ParticleSystem {
    constructor() {
        this.particles = [];
        this.pools = new Map();
        this.emitters = [];
    }

    init(renderer) {
        this.renderer = renderer;
    }

    // 更新粒子
    update(deltaTime) {
        // 更新所有粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update(deltaTime);

            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // 更新发射器
        for (const emitter of this.emitters) {
            emitter.update(deltaTime);
        }
    }

    // 渲染粒子
    render(ctx) {
        for (const particle of this.particles) {
            particle.render(ctx);
        }
    }

    // 发射粒子
    emit(config, x, y, count = 1) {
        for (let i = 0; i < count; i++) {
            const particle = this.createParticle(config, x, y);
            this.particles.push(particle);
        }
    }

    // 创建粒子
    createParticle(config, x, y) {
        return new Particle({
            x,
            y,
            vx: (Math.random() - 0.5) * config.speedX,
            vy: (Math.random() - 0.5) * config.speedY,
            life: config.life,
            maxLife: config.life,
            color: config.color,
            size: config.size,
            gravity: config.gravity || 0
        });
    }
}

// 粒子类
class Particle {
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
        this.vx = config.vx;
        this.vy = config.vy;
        this.life = config.life;
        this.maxLife = config.maxLife;
        this.color = config.color;
        this.size = config.size;
        this.gravity = config.gravity;
    }

    update(deltaTime) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.vy += this.gravity * deltaTime;
        this.life -= deltaTime;
    }

    render(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}
```

---

## 3. 游戏系统设计V2.0

### 3.1 角色系统升级 (CharacterSystem V2)

```javascript
class CharacterSystemV2 {
    constructor() {
        this.characters = new Map();
        this.activeCharacter = null;
    }

    // 创建角色V2
    createCharacter(data) {
        const character = {
            id: generateId(),
            name: data.name,
            race: data.race,
            class: data.class,

            // 基础属性
            level: 1,
            exp: 0,
            expToNext: 100,

            // 六大属性
            attributes: {
                str: data.str || 10,
                agi: data.agi || 10,
                int: data.int || 10,
                con: data.con || 10,
                luck: data.luck || 10,
                cha: data.cha || 10
            },

            // 衍生属性
            stats: {
                hp: 100,
                mp: 50,
                maxHp: 100,
                maxMp: 50,
                atk: 10,
                def: 5,
                mag: 10,
                mdef: 5,
                spd: 10,
                crit: 5,
                critDmg: 150
            },

            // 装备
            equipment: {
                weapon: null,
                armor: null,
                helmet: null,
                accessory: null
            },

            // 技能
            skills: [],
            skillPoints: 0,

            // 背包
            inventory: {
                items: [],
                capacity: 50
            },

            // 货币
            currency: {
                gold: 100,
                diamonds: 0,
                tokens: 0
            },

            // 好感度
            relationships: new Map(),

            // 成就
            achievements: [],

            // 统计
            statistics: {
                battlesWon: 0,
                battlesLost: 0,
                monstersKilled: 0,
                questsCompleted: 0,
                goldEarned: 0,
                playTime: 0
            },

            // 外观
            appearance: {
                hairstyle: 'default',
                hairColor: 'default',
                skinColor: 'default',
                outfit: 'default'
            }
        };

        this.characters.set(character.id, character);
        return character;
    }

    // 计算总属性（包含装备、技能等）
    calculateTotalStats(character) {
        const stats = { ...character.stats };

        // 添加装备属性
        Object.values(character.equipment).forEach(itemId => {
            if (itemId) {
                const item = game.data.items.get(itemId);
                if (item && item.stats) {
                    Object.entries(item.stats).forEach(([stat, value]) => {
                        stats[stat] += value;
                    });
                }
            }
        });

        // 添加技能属性
        character.skills.forEach(skillId => {
            const skill = game.data.skills.get(skillId);
            if (skill && skill.passiveStats) {
                Object.entries(skill.passiveStats).forEach(([stat, value]) => {
                    stats[stat] += value;
                });
            }
        });

        // 添加职业属性
        const classData = game.data.classes.get(character.class);
        if (classData && classData.stats) {
            Object.entries(classData.stats).forEach(([stat, value]) => {
                stats[stat] += value;
            });
        }

        return stats;
    }
}
```

### 3.2 战斗系统升级 (BattleSystem V2)

```javascript
class BattleSystemV2 {
    constructor() {
        this.inBattle = false;
        this.currentBattle = null;
        this.animationSystem = new AnimationSystem();
        this.effectSystem = new EffectSystem();
    }

    // 开始战斗V2
    startBattle(enemies) {
        const battle = {
            id: generateId(),
            player: game.player,
            enemies: enemies,
            turn: 1,
            round: 1,
            log: [],
            effects: [],

            // 战斗场
            arena: {
                background: 'battle-bg-01',
                weather: 'clear'
            },

            // 摄像机
            camera: {
                x: 0,
                y: 0,
                zoom: 1,
                shake: 0
            },

            // 时间缩放
            timeScale: 1
        };

        this.currentBattle = battle;
        this.inBattle = true;

        // 计算行动顺序
        this.calculateTurnOrder();

        // 播放战斗开始动画
        this.playBattleStartAnimation();

        // 播放战斗音乐
        game.audio.playBattleMusic();
    }

    // 执行攻击（带动画）
    async executeAttack(attacker, target, skill = null) {
        // 播放攻击动画
        await this.animationSystem.playAttack(attacker, target);

        // 计算伤害
        const damage = this.calculateDamage(attacker, target, skill);

        // 应用伤害
        target.hp -= damage;

        // 显示伤害特效
        this.effectSystem.showDamage(target.x, target.y, damage);

        // 播放受击动画
        await this.animationSystem.playHit(target);

        // 摄像机震动
        this.shakeCamera(5);

        // 记录战斗日志
        this.addBattleLog(`${attacker.name} 攻击 ${target.name} 造成 ${damage} 伤害`);
    }

    // 摄像机震动
    shakeCamera(intensity) {
        this.currentBattle.camera.shake = intensity;
    }

    // 更新战斗
    update(deltaTime) {
        if (!this.inBattle) return;

        // 更新摄像机震动
        if (this.currentBattle.camera.shake > 0) {
            this.currentBattle.camera.shake *= 0.9;
            if (this.currentBattle.camera.shake < 0.1) {
                this.currentBattle.camera.shake = 0;
            }
        }

        // 更新效果
        this.effectSystem.update(deltaTime);
    }

    // 渲染战斗
    render(ctx) {
        if (!this.inBattle) return;

        // 应用摄像机震动
        const shake = this.currentBattle.camera.shake;
        ctx.translate(
            (Math.random() - 0.5) * shake * 10,
            (Math.random() - 0.5) * shake * 10
        );

        // 渲染敌人
        this.currentBattle.enemies.forEach(enemy => {
            this.renderCharacter(ctx, enemy);
        });

        // 渲染玩家
        this.renderCharacter(ctx, this.currentBattle.player);

        // 渲染效果
        this.effectSystem.render(ctx);
    }
}
```

### 3.3 地图系统升级 (MapSystem V2)

```javascript
class MapSystemV2 {
    constructor() {
        this.currentMap = null;
        this.playerPosition = { x: 0, y: 0 };
        this.fogOfWar = new Set();
        this.locations = new Map();
        this.npcs = [];
    }

    // 加载地图V2
    async loadMap(mapId) {
        const mapData = await game.assetManager.getData(mapId);

        this.currentMap = {
            id: mapId,
            name: mapData.name,
            width: mapData.width,
            height: mapData.height,
            tileSize: mapData.tileSize,
            layers: mapData.layers,

            // 动态元素
            weather: mapData.weather || 'clear',
            timeOfDay: mapData.timeOfDay || 'day',

            // 环境对象
            objects: mapData.objects || [],

            // 采集点
            gatherPoints: mapData.gatherPoints || []
        };

        // 初始化迷雾
        this.initializeFogOfWar();

        // 加载地点
        this.loadLocations(mapData.locations);

        // 加载NPC
        this.loadNPCs(mapData.npcs);

        // 开始天气系统
        game.weatherSystem.setWeather(this.currentMap.weather);

        // 渲染地图
        this.render();
    }

    // 移动玩家（带动画）
    async movePlayerTo(x, y) {
        const path = this.findPath(
            this.playerPosition,
            { x, y }
        );

        // 逐步移动
        for (const point of path) {
            await this.animateMovement(point);
            this.playerPosition = point;

            // 检查事件
            this.checkEvents(point);

            // 更新迷雾
            this.updateFogOfWar(point);
        }
    }

    // 寻路（A*算法）
    findPath(start, end) {
        // A*寻路算法实现
        // ...
        return [];
    }

    // 移动动画
    async animateMovement(target) {
        return new Promise(resolve => {
            // 平滑移动动画
            // ...
            resolve();
        });
    }

    // 渲染地图
    render() {
        const ctx = game.renderer.ctx;

        // 渲染天气效果
        game.weatherSystem.render(ctx);

        // 渲染地图图层
        this.renderLayers(ctx);

        // 渲染NPC
        this.renderNPCs(ctx);

        // 渲染采集点
        this.renderGatherPoints(ctx);

        // 渲染玩家
        this.renderPlayer(ctx);

        // 渲染迷雾
        this.renderFogOfWar(ctx);
    }
}
```

### 3.4 酒馆系统升级 (TavernSystem V2)

```javascript
class TavernSystemV2 {
    constructor() {
        this.currentTavern = null;
        this.npcs = new Map();
        this.dialogueHistory = [];
        this.affection = new Map();
    }

    // 进入酒馆
    async enterTavern(tavernId) {
        const tavernData = await game.assetManager.getData(tavernId);

        this.currentTavern = {
            id: tavernId,
            name: tavernData.name,
            description: tavernData.description,

            // 视觉
            background: tavernData.background,
            music: tavernData.music,
            ambient: tavernData.ambient,

            // NPC列表
            npcs: tavernData.npcs,

            // 商店
            shop: tavernData.shop,

            // 服务
            services: tavernData.services
        };

        // 加载NPC
        await this.loadNPCs(tavernData.npcs);

        // 播放酒馆音乐
        game.audio.playMusic(this.currentTavern.music);

        // 渲染酒馆场景
        this.render();
    }

    // 与NPC对话V2
    async talkToNPC(npcId) {
        const npc = this.npcs.get(npcId);
        if (!npc) return;

        // 获取好感度
        const affection = this.affection.get(npcId) || 0;

        // 基于好感度生成对话
        const dialogue = await this.generateDialogue(npc, affection);

        // 显示对话
        game.ui.showDialogue(dialogue);

        // 记录对话历史
        this.dialogueHistory.push({
            npcId,
            dialogue,
            timestamp: Date.now()
        });

        // 增加好感度
        this.increaseAffection(npcId, 1);
    }

    // AI生成对话
    async generateDialogue(npc, affection) {
        const context = {
            npc: npc,
            player: game.player,
            affection: affection,
            time: new Date().getHours()
        };

        return await game.aiGenerator.generateDialogue(context);
    }

    // 增加好感度
    increaseAffection(npcId, amount) {
        const current = this.affection.get(npcId) || 0;
        this.affection.set(npcId, Math.min(100, current + amount));
    }
}
```

### 3.5 NPC系统（新增）

```javascript
class NPCSystem {
    constructor() {
        this.npcs = new Map();
        this.activeNPCs = [];
    }

    // 创建NPC
    createNPC(data) {
        const npc = {
            id: generateId(),
            name: data.name,
            role: data.role,
            personality: data.personality,

            // 位置
            position: data.position,
            targetPosition: data.position,

            // 外观
            sprite: data.sprite,
            color: data.color,

            // 对话
            dialogues: data.dialogues,

            // 服务
            services: data.services,

            // 行为
            behavior: data.behavior || 'idle',

            // AI
            ai: new NPCAI(data.aiConfig)
        };

        this.npcs.set(npc.id, npc);
        return npc;
    }

    // 更新NPC
    update(deltaTime) {
        for (const npc of this.activeNPCs) {
            npc.ai.update(deltaTime);
            this.moveNPC(npc, deltaTime);
        }
    }

    // 移动NPC
    moveNPC(npc, deltaTime) {
        const dx = npc.targetPosition.x - npc.position.x;
        const dy = npc.targetPosition.y - npc.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 5) {
            const speed = 50 * deltaTime;
            npc.position.x += (dx / distance) * speed;
            npc.position.y += (dy / distance) * speed;
        }
    }
}

// NPC AI类
class NPCAI {
    constructor(config) {
        this.state = 'idle';
        this.target = null;
        this.patrolPath = config.patrolPath || [];
        this.patrolIndex = 0;
        this.behaviors = config.behaviors || [];
    }

    update(deltaTime) {
        switch (this.state) {
            case 'idle':
                this.idleBehavior(deltaTime);
                break;
            case 'patrol':
                this.patrolBehavior(deltaTime);
                break;
            case 'interact':
                this.interactBehavior(deltaTime);
                break;
        }
    }

    // 巡逻行为
    patrolBehavior(deltaTime) {
        if (this.patrolPath.length === 0) return;

        const target = this.patrolPath[this.patrolIndex];
        // 移动到目标点
        // ...
    }
}
```

---

## 4. AI系统设计

### 4.1 AI生成器 (AIGenerator)

```javascript
class AIGenerator {
    constructor() {
        this.apiKey = '';
        this.baseUrl = '';
        this.cache = new Map();
        this.cacheEnabled = true;
    }

    // 生成对话
    async generateDialogue(context) {
        const prompt = this.buildDialoguePrompt(context);

        // 检查缓存
        const cached = this.checkCache(prompt);
        if (cached) return cached;

        // 调用API
        const response = await this.callAPI(prompt);

        // 缓存结果
        this.setCache(prompt, response);

        return response;
    }

    // 构建对话提示词
    buildDialoguePrompt(context) {
        return `你是一个${context.npc.role}，性格${context.npc.personality}。
当前时间：${context.time}:00。
与玩家好感度：${context.affection}/100。
请根据这些信息生成一句符合角色性格的对话。`;
    }

    // 生成图像
    async generateImage(description) {
        const prompt = this.buildImagePrompt(description);

        // 检查缓存
        const cached = this.checkCache(prompt);
        if (cached) return cached;

        // 调用API
        const response = await this.callImageAPI(prompt);

        // 缓存结果
        this.setCache(prompt, response);

        return response;
    }

    // 检查缓存
    checkCache(key) {
        if (!this.cacheEnabled) return null;
        return this.cache.get(key);
    }

    // 设置缓存
    setCache(key, value) {
        if (this.cacheEnabled) {
            this.cache.set(key, value);
        }
    }
}
```

---

## 5. UI/UX设计V2.0

### 5.1 组件系统

```javascript
class UIComponent {
    constructor(config) {
        this.element = this.create(config);
        this.children = [];
    }

    create(config) {
        const element = document.createElement(config.tag);
        element.className = config.className || '';

        if (config.text) {
            element.textContent = config.text;
        }

        if (config.children) {
            config.children.forEach(child => {
                this.appendChild(child);
            });
        }

        return element;
    }

    appendChild(child) {
        this.element.appendChild(child.element);
        this.children.push(child);
    }
}

// 对话框组件
class DialogueBox extends UIComponent {
    constructor() {
        super({
            tag: 'div',
            className: 'dialogue-box'
        });

        this.setupStructure();
    }

    setupStructure() {
        // NPC头像
        this.avatar = new UIComponent({
            tag: 'div',
            className: 'npc-avatar'
        });

        // 对话内容
        this.content = new UIComponent({
            tag: 'div',
            className: 'dialogue-content'
        });

        // 选项列表
        this.options = new UIComponent({
            tag: 'div',
            className: 'dialogue-options'
        });

        this.appendChild(this.avatar);
        this.appendChild(this.content);
        this.appendChild(this.options);
    }

    show(dialogue) {
        this.content.element.textContent = dialogue.text;
        this.avatar.element.style.backgroundImage = dialogue.avatar;

        // 显示选项
        this.options.element.innerHTML = '';
        dialogue.options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'dialogue-option';
            button.textContent = option.text;
            button.addEventListener('click', () => option.action());
            this.options.element.appendChild(button);
        });
    }
}
```

---

## 6. 性能优化

### 6.1 对象池

```javascript
class ObjectPool {
    constructor(factory, initialSize = 10) {
        this.factory = factory;
        this.pool = [];

        // 预创建对象
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(factory());
        }
    }

    // 获取对象
    get() {
        return this.pool.length > 0 ?
            this.pool.pop() :
            this.factory();
    }

    // 释放对象
    release(obj) {
        // 重置对象状态
        if (obj.reset) {
            obj.reset();
        }
        this.pool.push(obj);
    }
}

// 使用示例
const particlePool = new ObjectPool(() => new Particle(), 100);

// 创建粒子
const particle = particlePool.get();

// 使用后释放
particlePool.release(particle);
```

### 6.2 懒加载

```javascript
class LazyLoader {
    constructor() {
        this.loaded = new Set();
    }

    // 懒加载资源
    async load(resourceId, loader) {
        if (this.loaded.has(resourceId)) {
            return;
        }

        await loader(resourceId);
        this.loaded.add(resourceId);
    }
}
```

---

## 7. 数据设计

### 7.1 角色数据结构V2

```javascript
{
    "id": "player_001",
    "name": "勇者",
    "race": "人类",
    "class": "warrior",
    "level": 10,
    "exp": 5000,
    "expToNext": 7500,

    "attributes": {
        "str": 20,
        "agi": 15,
        "int": 10,
        "con": 18,
        "luck": 12,
        "cha": 14
    },

    "stats": {
        "hp": 200,
        "mp": 80,
        "maxHp": 200,
        "maxMp": 80,
        "atk": 30,
        "def": 20,
        "mag": 15,
        "mdef": 12,
        "spd": 15,
        "crit": 10,
        "critDmg": 150
    },

    "equipment": {
        "weapon": "weapon_001",
        "armor": "armor_001",
        "helmet": "helmet_001",
        "accessory": "accessory_001"
    },

    "skills": ["skill_001", "skill_002", "skill_003"],
    "skillPoints": 5,

    "inventory": {
        "capacity": 50,
        "items": [
            { "id": "item_001", "count": 10 },
            { "id": "item_002", "count": 5 }
        ]
    },

    "currency": {
        "gold": 1000,
        "diamonds": 50,
        "tokens": 10
    },

    "relationships": {
        "npc_001": 50,
        "npc_002": 75
    },

    "achievements": ["achievement_001", "achievement_002"],

    "statistics": {
        "battlesWon": 50,
        "battlesLost": 5,
        "monstersKilled": 200,
        "questsCompleted": 30,
        "goldEarned": 50000,
        "playTime": 36000
    },

    "appearance": {
        "hairstyle": "short",
        "hairColor": "brown",
        "skinColor": "light",
        "outfit": "warrior"
    }
}
```

---

**文档版本**: v2.0
**创建日期**: 2026-03-07
**维护人员**: HyperInfinity IDE
**状态**: 🚀 设计完成
