# Godot Game - 双版本项目

这是一个使用 Godot 4.x 引擎开发的 2D 像素艺术游戏项目，提供 **GDScript** 和 **C#** 两个版本。

## 📁 项目结构

```
GodotGame/
├── GDScript_Version/          # GDScript 版本
│   ├── project.godot         # 项目配置文件
│   ├── scripts/              # 脚本文件夹
│   │   ├── autoload/         # 自动加载的单例脚本
│   │   ├── player/           # 玩家相关脚本
│   │   ├── enemies/          # 敌人相关脚本
│   │   └── ui/               # UI 相关脚本
│   ├── scenes/               # 场景文件夹
│   └── assets/               # 资源文件夹
│       ├── sprites/          # 精灵图
│       ├── tilesets/         # 瓦片集
│       ├── audio/            # 音频文件
│       └── fonts/            # 字体文件
│
├── CSharp_Version/           # C# 版本
│   ├── project.godot         # 项目配置文件
│   ├── GodotGame_CSharp.csproj  # C# 项目文件
│   ├── scripts/              # 脚本文件夹
│   │   ├── autoload/         # 自动加载的单例脚本
│   │   ├── player/           # 玩家相关脚本
│   │   ├── enemies/          # 敌人相关脚本
│   │   └── ui/               # UI 相关脚本
│   ├── scenes/               # 场景文件夹
│   └── assets/               # 资源文件夹
│       ├── sprites/          # 精灵图
│       ├── tilesets/         # 瓦片集
│       ├── audio/            # 音频文件
│       └── fonts/            # 字体文件
│
└── Shared_Assets/            # 共享资源文件夹
    ├── sprites/              # 精灵图
    ├── tilesets/             # 瓦片集
    ├── audio/                # 音频文件
    │   ├── music/            # 音乐
    │   └── sfx/              # 音效
    ├── fonts/                # 字体
    └── shaders/              # 着色器
```

## 🎮 核心功能

### 已实现功能

- ✅ **玩家控制系统**
  - 流畅的移动和跳跃（支持 Coyote Time 和 Jump Buffer）
  - 攻击系统（带冷却时间）
  - 生命值和伤害系统
  - 无敌帧和闪烁效果
  - 生命和复活机制

- ✅ **游戏管理**
  - 游戏状态管理（菜单、游戏中、暂停、游戏结束）
  - 分数和生命系统
  - 关卡管理（支持多关卡）
  - 设置保存和加载

- ✅ **音频管理**
  - 背景音乐（支持淡入淡出）
  - 音效播放
  - 音量控制（主音量、音乐、音效）
  - 音频总线管理

- ✅ **场景过渡**
  - 淡入淡出效果
  - 屏幕震动
  - 屏幕闪光

- ✅ **道具系统**
  - 金币收集
  - 生命恢复
  - 速度提升
  - 攻击力提升

## 🚀 如何使用

### GDScript 版本

1. 打开 Godot 4.x 引擎
2. 点击 "导入项目"
3. 选择 `GDScript_Version/project.godot`
4. 点击 "打开"
5. 按 F5 或点击播放按钮运行游戏

### C# 版本

1. 确保已安装 .NET 6.0 SDK
2. 打开 Godot 4.x 引擎（Mono/C# 版本）
3. 点击 "导入项目"
4. 选择 `CSharp_Version/project.godot`
5. 点击 "打开"
6. 首次打开时，Godot 会自动生成 C# 解决方案
7. 按 F5 或点击播放按钮运行游戏

## 🎯 控制方式

| 按键 | 功能 |
|------|------|
| A / ← | 向左移动 |
| D / → | 向右移动 |
| W / ↑ | 向上移动 |
| S / ↓ | 向下移动 |
| 空格 | 跳跃 |
| 鼠标左键 | 攻击 |
| ESC | 暂停游戏 |

## 📋 技术规格

### 显示设置
- 视口大小：640×360（16:9）
- 窗口大小：1280×720
- 拉伸模式：Canvas Items
- 纹理过滤：Nearest（像素完美）

### 物理层
- Layer 1: World（世界）
- Layer 2: Player（玩家）
- Layer 3: Enemies（敌人）
- Layer 4: Items（物品）
- Layer 5: Projectiles（投射物）

### 自动加载（Autoload）
- GameManager: 游戏管理器
- AudioManager: 音频管理器
- SceneTransition: 场景过渡管理器

## 🔧 扩展开发

### 添加新关卡

1. 创建新场景 `level_X.tscn`
2. 继承自 `Node2D`
3. 添加 TileMapLayer 作为地图
4. 添加玩家实例
5. 添加敌人和物品

### 添加新敌人

1. 创建新脚本继承 `CharacterBody2D`
2. 实现 `TakeDamage` 方法
3. 添加 AI 移动逻辑
4. 添加到敌人组

### 添加新道具

1. 创建 Area2D 节点
2. 添加碰撞形状
3. 连接 `body_entered` 信号
4. 调用玩家的收集方法

## 📦 资源导入

将共享资源放在 `Shared_Assets` 文件夹中，然后在 Godot 中：

1. 打开 "文件系统" 面板
2. 右键点击 `res://`
3. 选择 "在文件管理器中打开"
4. 创建指向 `Shared_Assets` 的符号链接或复制资源

### 推荐的资源格式

| 类型 | 格式 | 说明 |
|------|------|------|
| 精灵图 | PNG | 透明背景，16/32/64px |
| 瓦片集 | PNG | 无缝拼接，16/32px |
| 音乐 | OGG | 循环播放，压缩率高 |
| 音效 | WAV | 短音效，低延迟 |
| 字体 | TTF/OTF | 像素字体推荐 |

## 🎨 像素艺术规范

- **调色板**: 限制 8/16/32 色
- **抗锯齿**: 禁用，保持硬边缘
- **分辨率**: 16×16, 32×32, 64×64
- **动画帧率**: 8-24 FPS

## 📝 版本对比

| 特性 | GDScript | C# |
|------|----------|-----|
| 学习曲线 | 低 | 中 |
| 性能 | 良好 | 优秀 |
| 类型安全 | 可选 | 强制 |
| IDE 支持 | 内置 | Visual Studio/Rider |
| 调试 | 内置 | 专业调试器 |
| 适用场景 | 快速原型 | 大型项目 |

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

**Godot 版本**: 4.2+
**创建日期**: 2026-03-17
