# 🎮 AI酒馆 RPG - 快速入门指南

## 📥 5分钟快速开始

### 方法1: 使用Python（推荐）

1. **打开终端/命令行**
   - Windows: 按 Win+R，输入 `cmd`
   - Mac: 打开终端
   - Linux: 打开终端

2. **进入游戏目录**
   ```bash
   cd D:/AIcreateEngine/标准软件开发范式/酒馆/AI_Tavern_Refactored
   ```

3. **启动游戏**
   ```bash
   python3 start.py
   ```
   或者（Windows）:
   ```bash
   python start.py
   ```

4. **浏览器会自动打开游戏页面**
   - 如果没有自动打开，访问: http://localhost:8000

### 方法2: 使用Node.js

1. **确保已安装Node.js**
   ```bash
   node --version
   ```

2. **启动游戏**
   ```bash
   cd D:/AIcreateEngine/标准软件开发范式/酒馆/AI_Tavern_Refactored
   npm start
   ```
   或者:
   ```bash
   node start.js
   ```

### 方法3: 直接打开（功能受限）

直接双击 `index_full.html` 文件在浏览器中打开。

**注意**: 某些功能（如本地存储）在直接打开时可能受限。

---

## 🎯 第一次游戏

### 1. 创建角色
点击 **"新游戏"** 按钮，填写角色信息：
- **名称**: 你的角色名字
- **职业**: 战士、法师、盗贼
- **种族**: 人类、精灵、矮人等
- **性别**: 男性/女性

### 2. 探索世界
- 在 **游戏大厅** 中查看剧情
- 点击 **"探索"** 去发现新地点
- 与 **NPC对话** 获取任务和信息

### 3. 首次战斗
- 在探索中会遭遇敌人
- 进入战斗后，**打出卡牌**攻击敌人
- 合理分配能量，策略战斗
- 击败敌人获得**经验值和奖励**

### 4. 升级角色
- 击败敌人获得经验
- 升级后获得**属性点和技能点**
- 在**角色面板**中分配点数

### 5. 尝试AI生成
- 进入 **AI生成** 视图
- 输入提示词生成内容
- 生成文本、图像、角色等

---

## 🎮 基础操作

### 移动和探索
```
👀 查看周围  - 查看当前位置的环境
🔍 探索     - 探索周围区域，可能发现新地点
🗺️ 地图     - 查看世界地图
```

### 战斗操作
```
🃏 卡牌     - 使用卡牌进行攻击或防御
⚡ 技能     - 使用职业技能
🎒 物品     - 使用药水或其他物品
🛡️ 防御     - 减少受到的伤害
```

### 菜单导航
```
👤 角色面板  - 查看和升级角色
⚔️ 职业系统  - 查看职业技能树
📈 升级系统  - 分配属性点和技能点
🃏 卡牌系统  - 管理你的卡组
🎒 背包系统  - 查看和管理物品
📖 剧情系统  - 查看故事进度
💬 交互系统  - 与NPC对话
```

---

## 💡 游戏技巧

### 新手建议
1. **先在安全区域探索**：从酒馆周围开始熟悉游戏
2. **与NPC对话**：获取信息和任务
3. **合理升级**：根据职业特点分配属性点
   - 战士：优先提升力量和体质
   - 法师：优先提升智力
   - 盗贼：优先提升敏捷和幸运
4. **构建卡组**：根据职业特点选择合适的卡牌

### 战斗技巧
1. **优先处理危险敌人**：优先击杀高伤害敌人
2. **合理使用技能**：不要浪费能量
3. **保持生命值**：不要让生命值过低
4. **卡牌配合**：卡牌之间有联动效果

### 资源管理
1. **金币**：用于购买物品和服务
2. **药水**：在战斗中恢复生命和魔法
3. **技能点**：用于解锁和升级技能
4. **属性点**：用于提升角色属性

---

## 🎨 自定义内容

### 创建自定义地图
```javascript
// 在浏览器控制台输入
const customMap = {
    id: 'my_map',
    name: '我的地图',
    type: 'custom',
    size: { width: 1000, height: 800 },
    locations: []
};

Game.engine.mapSystem.createMap(customMap);
```

### 创建自定义卡牌
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

Game.engine.cardSystem.addCard(customCard);
```

### 调试游戏
```javascript
// 查看游戏状态
console.log(Game.engine.getGameState());

// 查看系统状态
console.log(Game.engine.getSystemStates());

// 立即升级
Game.engine.characterSystem.levelUp();

// 获得金币
Game.engine.state.gold += 1000;
```

---

## 🔧 常见问题

### Q: 游戏无法启动？
A: 确保使用的是现代浏览器（Chrome、Firefox、Edge等）

### Q: AI生成功能不工作？
A: 需要在"设置"中配置API密钥

### Q: 存档在哪里？
A: 存档存储在浏览器的LocalStorage中，不要清除浏览器数据

### Q: 如何导出存档？
A: 在控制台输入:
```javascript
const save = localStorage.getItem('rpg_save_auto');
console.log(save);
```
复制输出的JSON字符串保存为文件

### Q: 游戏运行卡顿？
A: 尝试关闭其他标签页或降低画面设置

---

## 📚 进一步学习

### 阅读文档
- `README_FULL.md` - 完整游戏文档
- `INTEGRATION_GUIDE.md` - 系统整合指南

### 开发者资源
- 查看源码学习系统实现
- 使用控制台调试和测试
- 参考自定义内容示例

---

## 🎉 享受游戏！

祝你在艾尔特大陆的冒险愉快！

遇到问题或建议，欢迎反馈！

---

**版本**: 1.0.0
**更新日期**: 2024
**作者**: HyperInfinity
