# 统一酒馆游戏 - 设计文档

## 1. 系统架构设计

### 1.1 整体架构

```
UNIFIED_TAVERN_GAME/
├── index.html                 # 主入口文件
├── css/
│   └── style.css             # 主样式表
├── js/
│   ├── core/                 # 核心引擎
│   │   ├── game-engine.js    # 游戏引擎
│   │   ├── event-system.js   # 事件系统
│   │   └── state-manager.js  # 状态管理
│   ├── systems/              # 游戏系统
│   │   ├── character-system.js    # 角色系统
│   │   ├── battle-system.js       # 战斗系统
│   │   ├── card-system.js         # 卡牌系统
│   │   ├── map-system.js          # 地图系统
│   │   ├── tavern-system.js       # 酒馆系统
│   │   ├── quest-system.js        # 任务系统
│   │   ├── story-system.js        # 剧情系统
│   │   ├── class-system.js        # 职业系统
│   │   ├── upgrade-system.js      # 升级系统
│   │   ├── save-system.js         # 存档系统
│   │   └── audio-system.js        # 音频系统
│   ├── data/                 # 数据层
│   │   ├── game-data.js      # 游戏数据
│   │   ├── config.js         # 配置数据
│   │   └── constants.js      # 常量定义
│   ├── ui/                   # UI层
│   │   ├── ui-manager.js     # UI管理器
│   │   ├── dialogue-box.js   # 对话框
│   │   └── hud.js            # 游戏HUD
│   ├── ai/                   # AI层
│   │   ├── ai-generator.js   # AI生成器
│   │   ├── cache-manager.js  # 缓存管理
│   │   └── prompt-engine.js  # 提示词引擎
│   └── utils/                # 工具类
│       ├── math.js           # 数学工具
│       ├── storage.js        # 存储工具
│       └── helpers.js        # 辅助函数
├── assets/                   # 资源文件
│   ├── images/               # 图片资源
│   ├── audio/                # 音频资源
│   └── fonts/                # 字体资源
└── docs/                     # 文档
    ├── REQUIREMENT.MD
    ├── DESIGN.MD
    └── TASK.MD
```

### 1.2 模块依赖关系

```
┌─────────────────────────────────────────┐
│         Game Engine (game-engine.js)     │
│  ┌────────────────────────────────────┐ │
│  │      State Manager                 │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │      Event System                  │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│           Game Systems Layer             │
│  ┌──────┬──────┬──────┬──────┬──────┐   │
│  │角色  │战斗  │地图  │酒馆  │任务  │   │
│  │系统  │系统  │系统  │系统  │系统  │   │
│  └──────┴──────┴──────┴──────┴──────┘   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│              Data Layer                  │
│  ┌────────────────────────────────────┐ │
│  │    Game Data (所有游戏数据)        │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│              Presentation Layer          │
│  ┌────────────────────────────────────┐ │
│  │         UI Manager                 │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## 2. 核心模块设计

### 2.1 游戏引擎 (GameEngine)

**职责**: 
- 游戏生命周期管理
- 全局状态管理
- 模块协调
- 主循环控制

**核心类**:

```javascript
class GameEngine {
    constructor() {
        this.state = new StateManager();
        this.eventSystem = new EventSystem();
        this.systems = new Map();
        this.running = false;
    }

    // 初始化游戏
    async init() { }

    // 注册系统
    registerSystem(name, system) { }

    // 启动游戏循环
    start() { }

    // 停止游戏
    stop() { }

    // 更新游戏状态
    update(deltaTime) { }

    // 渲染游戏画面
    render() { }
}
```

**关键设计点**:
- 单例模式，全局唯一实例
- 使用Map存储所有子系统
- 事件驱动架构
- 模块化设计，松耦合

### 2.2 状态管理器 (StateManager)

**职责**:
- 全局状态存储
- 状态变更通知
- 状态历史记录
- 状态序列化

**核心类**:

```javascript
class StateManager {
    constructor() {
        this.state = {};
        this.history = [];
        this.listeners = new Map();
    }

    // 获取状态
    get(path) { }

    // 设置状态
    set(path, value) { }

    // 订阅状态变更
    subscribe(path, callback) { }

    // 取消订阅
    unsubscribe(path, callback) { }

    // 保存快照
    saveSnapshot() { }

    // 恢复快照
    restoreSnapshot(snapshot) { }
}
```

### 2.3 事件系统 (EventSystem)

**职责**:
- 事件发布/订阅
- 事件优先级
- 事件过滤
- 事件历史

**核心类**:

```javascript
class EventSystem {
    constructor() {
        this.listeners = new Map();
        this.history = [];
    }

    // 订阅事件
    on(event, callback, priority = 0) { }

    // 一次性订阅
    once(event, callback) { }

    // 发布事件
    emit(event, data) { }

    // 取消订阅
    off(event, callback) { }

    // 清除所有监听
    clear() { }
}
```

## 3. 游戏系统设计

### 3.1 角色系统 (CharacterSystem)

**数据结构**:

```javascript
class Character {
    constructor(data) {
        // 基本信息
        this.id = generateId();
        this.name = data.name;
        this.race = data.race;
        this.class = data.class;
        this.level = 1;
        this.exp = 0;

        // 基础属性
        this.attributes = {
            str: data.str || 10,
            agi: data.agi || 10,
            int: data.int || 10,
            con: data.con || 10,
            luck: data.luck || 10,
            cha: data.cha || 10
        };

        // 衍生属性
        this.stats = {
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
        };

        // 装备
        this.equipment = {
            weapon: null,
            armor: null,
            helmet: null,
            accessory: null
        };

        // 技能
        this.skills = [];
        this.skillPoints = 0;

        // 背包
        this.inventory = [];
        this.gold = 100;
    }

    // 计算衍生属性
    calculateStats() { }

    // 升级
    levelUp() { }

    // 装备物品
    equip(item) { }

    // 学习技能
    learnSkill(skillId) { }
}
```

**核心功能**:
- 角色创建与初始化
- 属性计算与更新
- 装备管理与变更
- 技能学习与升级
- 状态变化通知

### 3.2 战斗系统 (BattleSystem)

**战斗流程**:

```
开始战斗
    ↓
初始化战场
    ↓
生成敌人
    ↓
[战斗循环]
    ↓
判定行动顺序
    ↓
执行行动
    ↓
检查战斗结果
    ↓
结束战斗
```

**核心类**:

```javascript
class BattleSystem {
    constructor(engine) {
        this.engine = engine;
        this.activeBattle = null;
        this.turnOrder = [];
        this.currentTurn = 0;
    }

    // 开始战斗
    startBattle(enemies) {
        this.activeBattle = {
            player: this.engine.state.get('player'),
            enemies: enemies,
            round: 1,
            log: []
        };
        this.calculateTurnOrder();
    }

    // 计算行动顺序
    calculateTurnOrder() {
        const participants = [
            this.activeBattle.player,
            ...this.activeBattle.enemies
        ];
        
        this.turnOrder = participants.sort((a, b) => 
            b.stats.spd - a.stats.spd
        );
    }

    // 执行行动
    executeAction(actor, action, target) {
        // 执行攻击、技能等
    }

    // 检查战斗结果
    checkBattleResult() {
        const playerAlive = this.activeBattle.player.stats.hp > 0;
        const enemiesAlive = this.activeBattle.enemies.some(e => e.hp > 0);

        if (!playerAlive) return 'defeat';
        if (!enemiesAlive) return 'victory';
        return 'ongoing';
    }

    // 结束战斗
    endBattle(result) {
        // 分发奖励，更新状态
    }
}
```

### 3.3 地图系统 (MapSystem)

**核心类**:

```javascript
class MapSystem {
    constructor(engine) {
        this.engine = engine;
        this.currentMap = null;
        this.canvas = null;
        this.ctx = null;
        this.locations = new Map();
    }

    // 初始化地图
    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
    }

    // 加载地图
    loadMap(mapData) {
        this.currentMap = mapData;
        this.render();
    }

    // 渲染地图
    render() {
        if (!this.ctx || !this.currentMap) return;

        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制地图图层
        this.drawLayers();

        // 绘制地点标记
        this.drawLocations();

        // 绘制玩家位置
        this.drawPlayer();
    }

    // 移动玩家
    movePlayer(x, y) {
        // 移动逻辑
        this.render();
    }

    // 检查位置事件
    checkLocationEvent(x, y) {
        // 检查是否触发事件
    }
}
```

### 3.4 酒馆系统 (TavernSystem)

**核心类**:

```javascript
class TavernSystem {
    constructor(engine) {
        this.engine = engine;
        this.npcs = new Map();
        this.dialogueHistory = [];
    }

    // 进入酒馆
    enterTavern() {
        this.loadNPCs();
        this.showTavernUI();
    }

    // 与NPC对话
    talkToNPC(npcId) {
        const npc = this.npcs.get(npcId);
        const dialogue = this.generateDialogue(npc);
        this.showDialogue(dialogue);
    }

    // 生成对话
    generateDialogue(npc) {
        // 基于NPC性格、好感度生成对话
    }

    // 显示商店
    showShop() {
        const items = this.getShopItems();
        this.showShopUI(items);
    }

    // 购买物品
    buyItem(itemId) {
        const item = this.getItem(itemId);
        const player = this.engine.state.get('player');
        
        if (player.gold >= item.price) {
            player.gold -= item.price;
            player.inventory.push(item);
        }
    }

    // 休息
    rest() {
        const player = this.engine.state.get('player');
        player.stats.hp = player.stats.maxHp;
        player.stats.mp = player.stats.maxMp;
    }
}
```

### 3.5 任务系统 (QuestSystem)

**任务数据结构**:

```javascript
class Quest {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description;
        this.type = data.type; // main, side, daily
        this.objectives = data.objectives;
        this.rewards = data.rewards;
        this.prerequisites = data.prerequisites;
        this.status = 'available'; // available, active, completed
        this.progress = 0;
    }

    // 开始任务
    start() {
        this.status = 'active';
    }

    // 更新进度
    updateProgress(amount = 1) {
        this.progress += amount;
        if (this.progress >= this.objectives.length) {
            this.complete();
        }
    }

    // 完成任务
    complete() {
        this.status = 'completed';
        // 分发奖励
    }
}
```

### 3.6 卡牌系统 (CardSystem)

**卡牌数据结构**:

```javascript
class Card {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.type = data.type; // attack, defend, skill, item
        this.cost = data.cost;
        this.effect = data.effect;
        this.rarity = data.rarity; // common, uncommon, rare, epic, legendary
        this.level = 1;
        this.description = data.description;
    }

    // 升级卡牌
    upgrade() {
        this.level++;
        this.cost = Math.max(0, this.cost - 1);
        this.effect.power *= 1.2;
    }

    // 使用卡牌
    use(target) {
        // 应用卡牌效果
    }
}
```

### 3.7 AI生成系统 (AIGenerator)

**核心类**:

```javascript
class AIGenerator {
    constructor(config) {
        this.apiKey = config.apiKey;
        this.baseUrl = config.baseUrl;
        this.cache = new CacheManager();
    }

    // 生成对话
    async generateDialogue(character, context) {
        const prompt = this.buildDialoguePrompt(character, context);
        const cacheKey = this.getCacheKey(prompt);
        
        // 检查缓存
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        // 生成新内容
        const result = await this.callAPI(prompt);
        this.cache.set(cacheKey, result);
        return result;
    }

    // 生成图像
    async generateImage(description) {
        const cacheKey = this.getCacheKey(description);
        
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;

        const result = await this.callImageAPI(description);
        this.cache.set(cacheKey, result);
        return result;
    }

    // 构建提示词
    buildDialoguePrompt(character, context) {
        return `你是一个${character.role}，性格特征：${character.personality}。
                当前情况：${context}
                请生成一句符合角色性格的对话。`;
    }

    // 调用API
    async callAPI(prompt) {
        // API调用逻辑
    }
}
```

### 3.8 存档系统 (SaveSystem)

**核心类**:

```javascript
class SaveSystem {
    constructor(engine) {
        this.engine = engine;
        this.saveSlots = 5;
        this.autoSaveInterval = 300000; // 5分钟
    }

    // 保存游戏
    save(slotId, isAutoSave = false) {
        const gameState = this.engine.state.export();
        const saveData = {
            timestamp: Date.now(),
            player: gameState.player,
            map: gameState.map,
            quests: gameState.quests,
            version: this.engine.version
        };

        localStorage.setItem(`save_${slotId}`, JSON.stringify(saveData));
    }

    // 加载游戏
    load(slotId) {
        const saveData = JSON.parse(localStorage.getItem(`save_${slotId}`));
        this.engine.state.import(saveData);
    }

    // 自动保存
    startAutoSave() {
        setInterval(() => {
            this.save('auto', true);
        }, this.autoSaveInterval);
    }

    // 导出存档
    exportSave(slotId) {
        const saveData = localStorage.getItem(`save_${slotId}`);
        return btoa(saveData); // Base64编码
    }

    // 导入存档
    importSave(encodedData) {
        const saveData = atob(encodedData);
        localStorage.setItem(`save_imported`, saveData);
    }
}
```

## 4. UI设计

### 4.1 整体布局

```
┌──────────────────────────────────────────────────────┐
│  [LOGO]  统一酒馆          [设置] [存档] [退出]      │
├──────────┬──────────────────────────────┬───────────┤
│          │                              │           │
│  [导航]  │       [主游戏区域]            │  [信息]   │
│          │                              │           │
│  - 地图  │                              │  - 角色信息│
│  - 酒馆  │                              │  - 任务列表│
│  - 背包  │                              │  - 战斗信息│
│  - 技能  │                              │           │
│  - 装备  │                              │           │
│  - 任务  │                              │           │
│          │                              │           │
└──────────┴──────────────────────────────┴───────────┘
```

### 4.2 CSS架构

**变量定义**:

```css
:root {
    /* 颜色主题 */
    --bg-primary: #1a1a2e;
    --bg-secondary: #16213e;
    --bg-tertiary: #0f3460;
    --accent: #e94560;
    --text-primary: #ffffff;
    --text-secondary: #a0a0a0;
    
    /* 成功/警告/危险 */
    --success: #4CAF50;
    --warning: #FFC107;
    --danger: #f44336;
    
    /* 稀有度颜色 */
    --rarity-common: #9e9e9e;
    --rarity-uncommon: #4CAF50;
    --rarity-rare: #2196F3;
    --rarity-epic: #9C27B0;
    --rarity-legendary: #FFD700;
    
    /* 尺寸 */
    --sidebar-width: 250px;
    --info-width: 300px;
    --header-height: 60px;
    
    /* 动画 */
    --transition-speed: 0.3s;
}
```

**组件样式**:

```css
/* 按钮组件 */
.btn {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all var(--transition-speed);
    background: var(--bg-secondary);
    color: var(--text-primary);
    border: 1px solid var(--accent);
}

.btn:hover {
    background: var(--accent);
    transform: translateY(-2px);
}

.btn:active {
    transform: translateY(0);
}

/* 卡片组件 */
.card {
    background: var(--bg-secondary);
    border-radius: 8px;
    padding: 15px;
    margin: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    transition: all var(--transition-speed);
}

.card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 12px rgba(0, 0, 0, 0.4);
}

/* 对话框组件 */
.dialogue-box {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: 80%;
    max-width: 800px;
    background: var(--bg-tertiary);
    border: 2px solid var(--accent);
    border-radius: 8px;
    padding: 20px;
}
```

### 4.3 响应式设计

```css
/* 平板 */
@media (max-width: 1024px) {
    .game-container {
        grid-template-columns: 200px 1fr 250px;
    }
}

/* 移动设备 */
@media (max-width: 768px) {
    .game-container {
        grid-template-columns: 1fr;
        grid-template-rows: 60px 1fr;
    }
    
    .sidebar, .info-panel {
        display: none;
    }
}
```

## 5. 数据设计

### 5.1 游戏数据结构

**玩家数据**:
```javascript
{
    id: "player_001",
    name: "勇者",
    race: "人类",
    class: "战士",
    level: 10,
    exp: 5000,
    attributes: {
        str: 20,
        agi: 15,
        int: 10,
        con: 18,
        luck: 12,
        cha: 14
    },
    equipment: {
        weapon: { id: "weapon_001", name: "铁剑", ... },
        armor: { id: "armor_001", name: "皮甲", ... }
    },
    inventory: [
        { id: "item_001", count: 5 },
        { id: "item_002", count: 3 }
    ],
    gold: 1000,
    completedQuests: ["quest_001"],
    activeQuests: ["quest_002"]
}
```

**NPC数据**:
```javascript
{
    id: "npc_001",
    name: "酒馆老板",
    role: "商人",
    personality: "友善、精明",
    appearance: "中年男性，胖乎乎的",
    dialogue: {
        greeting: ["欢迎来到我的酒馆！"],
        topics: ["天气", "任务", "传闻"]
    },
    services: ["shop", "rumors"],
    affection: 50
}
```

**怪物数据**:
```javascript
{
    id: "monster_001",
    name: "野狼",
    level: 5,
    hp: 100,
    mp: 20,
    atk: 15,
    def: 5,
    spd: 12,
    skills: ["skill_001", "skill_002"],
    drops: [
        { id: "item_003", chance: 0.3 },
        { id: "gold", min: 10, max: 20 }
    ]
}
```

### 5.2 配置数据

**游戏配置**:
```javascript
const GAME_CONFIG = {
    version: "1.0.0",
    maxLevel: 100,
    baseExp: 1000,
    expMultiplier: 1.5,
    saveSlots: 5,
    autoSaveInterval: 300000,
    battleSpeed: 1000
};
```

## 6. 性能优化

### 6.1 加载优化
- 懒加载资源
- 资源预加载
- 缓存策略

### 6.2 渲染优化
- Canvas分层渲染
- 视锥裁剪
- 对象池

### 6.3 内存优化
- 及时释放资源
- 对象复用
- 内存泄漏检测

## 7. 测试策略

### 7.1 单元测试
- 每个系统独立测试
- 边界条件测试
- 异常处理测试

### 7.2 集成测试
- 系统间交互测试
- 完整流程测试
- 性能测试

### 7.3 用户测试
- 可用性测试
- 兼容性测试
- 反馈收集

---

**文档版本**: v1.0  
**创建日期**: 2026-03-07  
**更新日期**: 2026-03-07  
**维护人员**: HyperInfinity IDE
