# AI酒馆 RPG - 系统整合指南

## 🏗️ 系统架构总览

```
┌─────────────────────────────────────────────────────────┐
│                    RPG Game Engine                       │
│              (核心游戏引擎 - 统一调度)                      │
└─────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   核心系统    │  │   游戏系统    │  │   内容系统    │
└──────────────┘  └──────────────┘  └──────────────┘
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ AI生成系统   │  │  地图系统    │  │  剧情系统    │
└──────────────┘  │  交互系统    │  │  卡牌系统    │
                  │  战斗系统    │  └──────────────┘
                  └──────────────┘
                           │
                    ┌──────┴──────┐
                    ▼             ▼
              ┌──────────┐  ┌──────────┐
              │ 角色系统  │  │ 职业系统  │
              └──────────┘  └──────────┘
```

## 🔗 系统间依赖关系

### 1. AI生成系统 ↔ 所有系统
```
AI生成系统
    ↓ 生成文本
剧情系统 ←────────────┐
    ↓ 生成对话        │
交互系统 ←──────────┤
    ↓ 生成图像        │
地图系统 ←───────────┤
    ↓ 生成角色头像     │
角色系统 ←───────────┤
    ↓ 生成卡牌图像     │
卡牌系统 ←───────────┘
```

### 2. 战斗系统集成
```
战斗系统
    ├─→ 使用卡牌 ←──── 卡牌系统
    ├─→ 角色属性 ←──── 角色系统
    ├─→ 职业技能 ←──── 职业系统
    └─→ 地图战斗 ←──── 地图系统
```

### 3. 角色成长链
```
角色升级系统
    ↓
职业系统
    ↓
技能树
    ↓
战斗能力/卡牌效果
```

### 4. 剧情分支
```
剧情系统
    ↓ 玩家决策
角色系统（属性检查）
    ↓
交互系统（NPC对话）
    ↓
战斗系统（战斗触发）
```

## 🔄 数据流向

### 游戏初始化流程
```javascript
1. 初始化游戏引擎
   ↓
2. 初始化所有子系统
   ├─ AI生成系统
   ├─ 地图系统
   ├─ 交互系统
   ├─ 战斗系统
   ├─ 卡牌系统
   ├─ 剧情系统
   ├─ 角色升级系统
   └─ 职业系统
   ↓
3. 加载游戏数据
   ↓
4. 启动游戏循环
   ↓
5. 等待玩家输入
```

### 玩家行动处理流程
```javascript
玩家输入
   ↓
解析行动类型
   ↓
根据类型分发到对应系统
   ├─ 移动 → 地图系统
   ├─ 交互 → 交互系统
   ├─ 战斗 → 战斗系统
   ├─ 使用物品 → 角色系统
   ├─ 查看信息 → UI系统
   └─ 自定义 → AI生成系统
   ↓
执行行动
   ↓
更新游戏状态
   ↓
触发事件（如果有）
   ↓
返回结果
```

### 战斗流程
```javascript
进入战斗
   ↓
初始化战斗数据
   ├─ 玩家属性 ← 角色系统
   ├─ 敌人数据 ← 战斗系统
   └─ 抽取卡牌 ← 卡牌系统
   ↓
开始回合循环
   ├─ 玩家回合
   │  ├─ 选择卡牌/技能
   │  ├─ 计算效果
   │  ├─ 更新状态
   │  └─ 检查战斗结束
   ├─ 敌人回合
   │  ├─ AI决策
   │  ├─ 执行行动
   │  ├─ 更新状态
   │  └─ 检查战斗结束
   └─ 检查战斗结束
      ├─ 胜利 → 获得奖励 → 更新角色系统
      └─ 失败 → 游戏结束/复活
```

## 📦 模块导出/导入

### 游戏引擎导入
```javascript
import { gameEngine } from './js/game/RPGGameEngine.js';
```

### 系统独立导入
```javascript
import AIGenerationSystem from './js/systems/AIGenerationSystem.js';
import MapSystem from './js/systems/MapSystem.js';
import CombatSystem from './js/systems/CombatSystem.js';
// ... 其他系统
```

### 全局访问
游戏引擎自动导出全局实例：
```javascript
window.Game.engine  // 访问游戏引擎
```

## 🎯 系统接口

### 核心引擎接口
```javascript
// 初始化
await gameEngine.initialize()

// 开始新游戏
await gameEngine.startNewGame(characterData)

// 执行行动
await gameEngine.executePlayerAction(action)

// 获取状态
gameEngine.getGameState()
gameEngine.getSystemStates()

// 存档系统
await gameEngine.saveGame(slot)
await gameEngine.loadGame(slot)

// 事件系统
gameEngine.on(event, callback)
gameEngine.off(event, callback)
gameEngine.emit(event, data)
```

### AI生成系统接口
```javascript
// 文本生成
await gameEngine.aiSystem.generateText(prompt)

// 图像生成
await gameEngine.aiSystem.generateImage(prompt)

// 角色头像生成
await gameEngine.aiSystem.generateCharacterAvatar(characterInfo)

// 语音合成
await gameEngine.aiSystem.generateSpeech(text)
```

### 地图系统接口
```javascript
// 移动
gameEngine.mapSystem.moveTo(x, y)

// 切换地图
gameEngine.mapSystem.switchMap(mapId)

// 获取位置信息
gameEngine.mapSystem.getLocationDetails(locationId)

// 创建自定义地图
gameEngine.mapSystem.createMap(mapData)
```

### 战斗系统接口
```javascript
// 开始战斗
gameEngine.combatSystem.startCombat(player, enemies)

// 执行回合
await gameEngine.combatSystem.executeTurn(action)

// 获取战斗状态
gameEngine.combatSystem.getCombatState()
```

### 卡牌系统接口
```javascript
// 开始战斗（洗牌、抽初始手牌）
gameEngine.cardSystem.startBattle()

// 抽牌
gameEngine.cardSystem.drawCards(count)

// 打出卡牌
gameEngine.cardSystem.playCard(cardIndex)

// 添加卡牌到卡组
gameEngine.cardSystem.addCardToDeck(cardId)
```

### 角色系统接口
```javascript
// 创建角色
gameEngine.characterSystem.createCharacter(characterData)

// 升级
gameEngine.characterSystem.levelUp()

// 分配属性点
gameEngine.characterSystem.allocateStatPoint(stat, amount)

// 获取角色信息
gameEngine.characterSystem.getPlayerInfo()
```

### 职业系统接口
```javascript
// 选择职业
gameEngine.classSystem.selectClass(classId)

// 转职
gameEngine.classSystem.changeClass(subClassId)

// 解锁技能
gameEngine.classSystem.unlockSkill(skillId)

// 获取职业信息
gameEngine.classSystem.getClassInfo()
```

### 剧情系统接口
```javascript
// 开始章节
await gameEngine.storySystem.startChapter(chapterId)

// 做出选择
await gameEngine.storySystem.makeChoice(choiceId)

// 获取当前场景
gameEngine.storySystem.getCurrentScene()
```

### 交互系统接口
```javascript
// 开始交互
await gameEngine.interactionSystem.startInteraction(npcId)

// 继续对话
await gameEngine.interactionSystem.continueDialogue(action)

// 获取NPC信息
gameEngine.interactionSystem.getNPC(npcId)
```

## 🎨 UI系统集成

### 状态监听
```javascript
// 监听游戏状态变化
gameEngine.on('state-change', (newState) => {
    UI.update(newState);
});

// 监听战斗事件
gameEngine.on('combat-started', (data) => {
    UI.showCombat(data);
});

// 监听角色更新
gameEngine.on('character-updated', (character) => {
    UI.updateCharacter(character);
});
```

### 视图更新
```javascript
// 更新角色状态
function updateCharacterPanel(character) {
    document.getElementById('hp-bar').style.width = `${(character.hp/character.maxHp)*100}%`;
    document.getElementById('mp-bar').style.width = `${(character.mp/character.maxMp)*100}%`;
}

// 更新地图
function updateMap(mapData) {
    renderMap(mapData);
}

// 更新战斗界面
function updateCombat(combatState) {
    renderCombatUI(combatState);
}
```

## 🔧 扩展开发

### 添加新系统
```javascript
// 1. 创建系统类
export default class NewSystem {
    constructor() {
        // 初始化
    }

    async initialize() {
        // 初始化逻辑
    }

    // 系统方法
    async doSomething() {
        // 实现功能
    }

    async save() {
        return {}; // 返回保存数据
    }

    async load(data) {
        // 加载数据
    }
}

// 2. 在游戏引擎中注册
class RPGGameEngine {
    constructor() {
        this.newSystem = new NewSystem();
    }

    async initialize() {
        await this.newSystem.initialize();
    }
}
```

### 添加新事件
```javascript
// 触发自定义事件
gameEngine.emit('custom-event', { data: 'value' });

// 监听自定义事件
gameEngine.on('custom-event', (data) => {
    console.log('Custom event:', data);
});
```

### 添加自定义卡牌
```javascript
const customCard = {
    id: 'my_card',
    name: '我的卡牌',
    type: 'attack',
    cost: 2,
    rarity: 'rare',
    description: '造成15点伤害',
    effect: 'damage',
    value: 15,
    icon: '⭐'
};

gameEngine.cardSystem.addCard(customCard);
```

### 添加自定义NPC
```javascript
const customNPC = {
    id: 'my_npc',
    name: '新NPC',
    title: '神秘旅人',
    icon: '🎭',
    personality: 'friendly',
    dialogue: {
        greeting: ['你好！'],
        topics: []
    }
};

gameEngine.interactionSystem.addNPC(customNPC);
```

## 📊 数据持久化

### LocalStorage结构
```javascript
localStorage = {
    'rpg_save_auto': '...',           // 自动存档
    'rpg_save_slot1': '...',          // 存档槽1
    'rpg_character_data': '...',      // 角色数据
    'rpg_player_class': '...',        // 职业数据
    'rpg_card_deck': '...',           // 卡组数据
    'rpg_maps': '...',                // 地图数据
    'rpg_map_progress': '...',        // 地图进度
    'rpg_story_progress': '...',      // 剧情进度
    'ai_generation_cache': '...',      // AI缓存
}
```

### 导出/导入存档
```javascript
// 导出存档
const saveData = localStorage.getItem('rpg_save_auto');
downloadJSON(saveData, 'save.json');

// 导入存档
const saveData = uploadJSON();
localStorage.setItem('rpg_save_auto', saveData);
```

## 🐛 调试

### 启用调试模式
```javascript
// 在控制台输入
gameEngine.debug = true;
```

### 查看系统状态
```javascript
// 查看所有系统状态
console.log(gameEngine.getSystemStates());

// 查看特定系统
console.log(gameEngine.combatSystem.getCombatState());
console.log(gameEngine.characterSystem.getPlayerInfo());
```

### 手动触发事件
```javascript
// 手动触发战斗
gameEngine.combatSystem.startCombat(player, ['wolf']);

// 手动移动
gameEngine.mapSystem.moveTo(100, 100);

// 手动升级
gameEngine.characterSystem.levelUp();
```

## 📈 性能优化

### 启用性能监控
```javascript
// 启用性能监控
gameEngine.enableProfiling = true;

// 查看性能报告
console.log(gameEngine.getProfilingReport());
```

### 优化建议
1. **缓存AI生成内容**：减少API调用
2. **懒加载地图**：只在需要时加载地图数据
3. **限制渲染频率**：使用requestAnimationFrame
4. **使用Web Worker**：将AI计算移到后台线程
5. **清理无用数据**：定期清理缓存

## 🔒 安全性

### API密钥保护
```javascript
// API密钥存储在LocalStorage
// 使用时从LocalStorage读取
const apiKey = localStorage.getItem('api_key');
```

### 数据验证
```javascript
// 所有外部输入需要验证
function validateInput(input) {
    if (typeof input !== 'object') return false;
    if (!input.type) return false;
    // 更多验证...
    return true;
}
```

## 📚 最佳实践

### 系统设计
1. **单一职责**：每个系统只负责一个功能
2. **松耦合**：系统间通过事件通信
3. **可扩展**：使用模块化设计
4. **可测试**：每个系统可以独立测试

### 代码规范
1. **使用ES6+语法**：模块化、箭头函数、异步/等待
2. **错误处理**：所有异步操作都要try/catch
3. **注释**：复杂逻辑添加注释
4. **命名规范**：驼峰命名法

### 性能
1. **避免频繁DOM操作**：批量更新
2. **使用事件委托**：减少事件监听器数量
3. **懒加载**：延迟加载非关键资源
4. **使用缓存**：缓存计算结果

---

## 🎉 总结

这个完整的RPG游戏系统通过精心设计的架构，将八大核心系统无缝整合在一起，提供了一个功能完整、易于扩展的游戏开发框架。开发者可以基于这个框架快速创建自己的RPG游戏，或者添加新的功能和内容。
