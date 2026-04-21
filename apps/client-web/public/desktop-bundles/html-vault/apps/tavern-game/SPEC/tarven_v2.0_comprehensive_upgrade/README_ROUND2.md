# Round 2 系统使用指南

> **版本**: v2.0.2
> **更新日期**: 2026-03-10
> **文档**: Round 2系统使用说明

---

## 📖 概述

Round 2为游戏添加了4个核心系统，大大提升了游戏的视觉效果、可玩性和用户体验：

1. **天气系统** - 5种天气类型，动态粒子效果
2. **时间系统** - 日夜循环，时间事件
3. **成就系统** - 18个成就，稀有度系统
4. **快速访问系统** - 快捷键，快速访问

---

## 🌦️ 天气系统使用指南

### 系统初始化
天气系统在游戏启动时自动初始化，无需手动操作。

### 天气类型

| 天气 | 图标 | 描述 | 效果 |
|------|------|------|------|
| 晴天 | ☀️ | 阳光明媚的好天气 | 战斗+20%，探索+20%，心情+20% |
| 雨天 | 🌧️ | 淅淅沥沥的雨声 | 战斗-10%，探索-20%，心情-10% |
| 雪天 | ❄️ | 雪花飘落的浪漫时刻 | 战斗-20%，探索-30%，心情0% |
| 雾天 | 🌫️ | 雾气弥漫，能见度降低 | 战斗-30%，探索-40%，心情-20% |
| 暴风雨 | ⛈️ | 雷声隆隆，电闪雷鸣 | 战斗+20%，探索-50%，心情-30% |

### 天气控制

#### 查看当前天气
```javascript
const weather = weatherSystem.getCurrentWeather();
console.log(weather);
// 输出: { type: 'sunny', info: {...}, duration: 45000 }
```

#### 手动设置天气
```javascript
weatherSystem.setWeather('rainy'); // 切换到雨天
weatherSystem.setWeather('sunny'); // 切换到晴天
```

#### 获取天气影响
```javascript
const impact = weatherSystem.getWeatherImpact();
console.log(impact);
// 输出: { combat: 1.0, exploration: 1.2, mood: 1.2 }
```

### 天气UI
天气显示在屏幕右上角，包含：
- 天气图标
- 天气名称
- 天气倒计时

---

## 🕐 时间系统使用指南

### 系统初始化
时间系统在游戏启动时自动初始化，无需手动操作。

### 时间段

| 时间段 | 时间范围 | 图标 | 特点 |
|--------|---------|------|------|
| 黎明 | 5:00-8:00 | 🌅 | 太阳刚升起 |
| 上午 | 8:00-12:00 | ☀️ | 阳光明媚 |
| 中午 | 12:00-14:00 | 🌞 | 太阳高悬 |
| 下午 | 14:00-18:00 | 🌤️ | 阳光西斜 |
| 傍晚 | 18:00-20:00 | 🌆 | 夕阳西下 |
| 夜晚 | 20:00-23:00 | 🌙 | 夜幕降临 |
| 深夜 | 23:00-5:00 | 🌑 | 万籁俱寂 |

### 时间控制

#### 获取当前时间
```javascript
const time = timeSystem.getTimeInfo();
console.log(time);
// 输出: { hours: 10, minutes: 30, formatted: "10:30", timeOfDay: "morning", dayCount: 1, ... }
```

#### 设置时间
```javascript
timeSystem.setTime(14, 30); // 设置为14:30
```

#### 跳过时间
```javascript
timeSystem.skipTime(4); // 跳过4小时
```

#### 调整时间流速
```javascript
timeSystem.setTimeScale(2.0); // 时间流速2倍
timeSystem.setTimeScale(0.5); // 时间流速0.5倍
```

### 时间事件
```javascript
// 添加定时事件
timeSystem.addTimeEvent(18, () => {
    console.log('傍晚到了！');
});
```

### 每日恢复
每天6:00自动触发：
- 恢复20%最大生命值
- 恢复30%最大魔法值

---

## 🏆 成就系统使用指南

### 系统初始化
成就系统在游戏启动时自动初始化，并在特定事件触发时检查成就。

### 成就分类

| 分类 | 成就数量 | 图标 |
|------|---------|------|
| 战斗成就 | 4 | ⚔️ |
| 探索成就 | 3 | 🗺️ |
| 社交成就 | 3 | 🤝 |
| 收集成就 | 2 | 🃏 |
| 里程碑成就 | 3 | 🎯 |
| 特殊成就 | 3 | ⭐ |

### 成就稀有度

| 稀有度 | 颜色 | 成就数量 |
|--------|------|---------|
| 普通 | 灰色 | 4 |
| 优秀 | 绿色 | 4 |
| 稀有 | 蓝色 | 5 |
| 史诗 | 紫色 | 3 |
| 传说 | 金色 | 2 |

### 成就列表

#### 战斗成就
- **初露锋芒** - 完成第一次战斗
- **战斗大师** - 赢得100场战斗
- **BOSS杀手** - 击败10个BOSS
- **连击大师** - 达成50连击

#### 探索成就
- **世界探索者** - 探索所有地点
- **宝藏猎人** - 发现50个宝箱
- **资源收集者** - 采集100次资源

#### 社交成就
- **酒馆常客** - 访问酒馆50次
- **交友达人** - 与10个NPC建立友好关系
- **商人** - 交易100次

#### 收集成就
- **卡牌收藏家** - 收集50张卡牌
- **物品囤积者** - 背包中拥有200个物品

#### 里程碑成就
- **初出茅庐** - 达到10级
- **身经百战** - 达到50级
- **传说** - 达到100级

#### 特殊成就
- **速度达人** - 在10天内达到20级
- **百万富翁** - 拥有1,000,000金币
- **完美主义者** - 解锁所有成就

### 成就控制

#### 手动检查成就
```javascript
achievementSystem.checkAchievements(game.player);
```

#### 打开成就面板
```javascript
achievementSystem.showPanel();
// 或按快捷键 '7'
```

#### 获取成就完成率
```javascript
const rate = achievementSystem.getCompletionRate();
console.log(`成就完成率: ${rate.toFixed(1)}%`);
```

### 成就奖励
成就解锁时自动给予奖励：
- 金币
- 经验值
- 钻石

---

## ⚡ 快速访问系统使用指南

### 快速访问面板
快速访问面板位于屏幕左下角，包含12个快速访问按钮。

### 快捷键列表

| 快捷键 | 功能 | 说明 |
|--------|------|------|
| 1 | 地图 | 切换到地图视图 |
| 2 | 酒馆 | 切换到酒馆视图 |
| 3 | 角色 | 切换到角色面板 |
| 4 | 卡牌 | 切换到卡牌收藏 |
| 5 | 职业 | 切换到职业系统 |
| 6 | 任务 | 切换到任务系统 |
| 7 | 成就 | 打开成就面板 |
| 8 | 存档 | 保存游戏 |
| 9 | 设置 | 打开设置面板 |
| 0 | 关闭 | 关闭当前菜单 |
| w | 天气 | 显示天气信息 |
| t | 时间 | 显示时间信息 |
| s | 跳过 | 跳过4小时 |
| + | 加速 | 加快时间流速 |
| - | 减速 | 减慢时间流速 |
| Escape | 菜单 | 打开游戏菜单 |
| F11 | 全屏 | 切换全屏模式 |

### 自定义快捷键

```javascript
quickAccessSystem.registerShortcut('key', () => {
    console.log('自定义快捷键！');
}, '快捷键说明');
```

### 添加自定义按钮

```javascript
quickAccessSystem.addQuickAccessButton({
    icon: '🔔',
    label: '通知',
    action: () => alert('通知'),
    key: 'n'
});
```

---

## 🔧 开发者指南

### 系统API

#### 天气系统API
```javascript
// 获取系统信息
weatherSystem.getSystemInfo()

// 设置天气
weatherSystem.setWeather(weatherType)

// 获取当前天气
weatherSystem.getCurrentWeather()

// 获取天气影响
weatherSystem.getWeatherImpact()
```

#### 时间系统API
```javascript
// 获取系统信息
timeSystem.getSystemInfo()

// 设置时间
timeSystem.setTime(hours, minutes)

// 跳过时间
timeSystem.skipTime(hours)

// 设置时间流速
timeSystem.setTimeScale(scale)

// 添加时间事件
timeSystem.addTimeEvent(hour, callback, once)
```

#### 成就系统API
```javascript
// 获取系统信息
achievementSystem.getSystemInfo()

// 注册成就
achievementSystem.registerAchievement(id, config)

// 检查成就
achievementSystem.checkAchievements(player)

// 打开面板
achievementSystem.showPanel()
```

#### 快速访问系统API
```javascript
// 获取系统信息
quickAccessSystem.getSystemInfo()

// 注册快捷键
quickAccessSystem.registerShortcut(key, action, description)

// 添加按钮
quickAccessSystem.addQuickAccessButton(button)
```

---

## 🐛 故障排除

### 天气系统不工作
1. 检查浏览器是否支持CSS动画
2. 检查控制台是否有错误
3. 确认weatherSystem已初始化

### 时间系统不工作
1. 检查timeSystem是否初始化
2. 检查时间流速是否为0
3. 查看控制台错误信息

### 成就系统不工作
1. 检查achievementSystem是否初始化
2. 确认player.stats数据正确
3. 手动调用checkAchievements测试

### 快捷键不工作
1. 确认焦点不在输入框中
2. 检查快捷键是否被占用
3. 查看quickAccessSystem日志

---

## 📚 相关文档

- [TASK.MD](./TASK.MD) - 任务列表
- [ITERATION.MD](./ITERATION.MD) - 迭代追踪
- [ROUND2_SUMMARY.MD](./ROUND2_SUMMARY.MD) - Round 2总结
- [ROUND2_UPDATE.md](../../ROUND2_UPDATE.md) - 更新日志

---

**文档版本**: v2.0.2
**最后更新**: 2026-03-10
**维护人员**: HyperInfinity IDE
