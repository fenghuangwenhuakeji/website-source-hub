# 🤖 Agent 分类索引

## 📂 分类目录结构

由于系统限制，Agent 文件保留在原位置，但通过本文档建立分类索引。

```
.trae/skills/
│
├── 📂 01-核心功能Agent/          # 4个Agent
│   ├── agent-generator/          # Agent制造生成器
│   ├── plan-agent/               # 规划Agent
│   ├── spec-agent/               # 规格Agent
│   └── debug-agent/              # 调试Agent
│
├── 📂 02-编程语言Agent/           # 11个Agent
│   ├── 📂 系统级语言/             # 4个
│   │   ├── c-agent/              # C语言
│   │   ├── cpp-agent/            # C++
│   │   ├── rust-agent/           # Rust
│   │   └── go-agent/             # Go
│   │
│   ├── 📂 企业级语言/             # 3个
│   │   ├── java-agent/           # Java
│   │   ├── kotlin-agent/         # Kotlin
│   │   └── csharp-agent/         # C#
│   │
│   └── 📂 脚本动态语言/           # 3个
│       ├── python-agent/         # Python
│       ├── javascript-agent/     # JavaScript
│       └── typescript-agent/     # TypeScript
│
├── 📂 03-前端框架Agent/           # 3个Agent
│   ├── vue3-agent/               # Vue3
│   ├── react-agent/              # React
│   └── flutter-agent/            # Flutter
│
├── 📂 04-游戏开发Agent/           # 6个Agent
│   ├── godot-gdscript-agent/     # Godot GDScript
│   ├── godot-csharp-agent/       # Godot C#
│   ├── godot-asset-agent/        # Godot资源
│   ├── godot-asset-script-agent/ # Godot程序化资源
│   ├── godot-scene-agent/        # Godot场景
│   └── GodotGame/                # 示例项目
│
├── 📂 05-内容创作Agent/           # 5个Agent
│   ├── brainstorm-agent/         # 头脑风暴
│   ├── outline-agent/            # 大纲设计
│   ├── narrative-engine-agent/   # 叙事引擎
│   ├── polish-agent/             # 润色优化
│   └── storyboard-agent/         # 分镜设计
│
├── 📂 06-AI创作Agent/             # 6个Agent
│   ├── nanobanana-asset-agent/   # NanoBanana资源
│   ├── nanobanana-grid-agent/    # NanoBanana宫格
│   ├── suno-music-agent/         # Suno音乐
│   ├── comic-creator-agent/      # 漫画创作
│   ├── script-creator-agent/     # 剧本创作
│   └── animation-creator-agent/  # 动画创作
│
└── 📂 07-工具辅助Agent/           # 1个Agent
    └── language-selector-agent/  # 语言选择器
```

---

## 🎯 按类别快速访问

### 01-核心功能Agent (4个)

| Agent | 路径 | 功能 | 使用频率 |
|-------|------|------|----------|
| **agent-generator** | `agent-generator/` | Agent制造生成器 | ⭐⭐⭐⭐⭐ |
| **plan-agent** | `plan-agent/` | 项目规划与任务分解 | ⭐⭐⭐⭐⭐ |
| **spec-agent** | `spec-agent/` | 需求分析与规格定义 | ⭐⭐⭐⭐⭐ |
| **debug-agent** | `debug-agent/` | 代码审查与调试 | ⭐⭐⭐⭐⭐ |

**使用示例**:
```
@plan-agent 制定项目计划
@spec-agent 定义需求规格
@debug-agent 审查代码质量
```

---

### 02-编程语言Agent (11个)

#### 系统级语言 (4个)

| Agent | 路径 | 专长 | 适用场景 |
|-------|------|------|----------|
| **c-agent** | `c-agent/` | 系统编程、嵌入式 | 操作系统、驱动开发 |
| **cpp-agent** | `cpp-agent/` | C++17/20、Qt、高性能 | 游戏引擎、系统软件 |
| **rust-agent** | `rust-agent/` | 所有权、并发安全 | 区块链、Web后端 |
| **go-agent** | `go-agent/` | 云原生、微服务 | 分布式系统、API服务 |

**使用示例**:
```
@rust-agent 创建Web API项目
@go-agent 实现微服务架构
@cpp-agent 开发高性能组件
```

#### 企业级语言 (3个)

| Agent | 路径 | 专长 | 适用场景 |
|-------|------|------|----------|
| **java-agent** | `java-agent/` | Spring Boot、企业应用 | 企业级后端、大数据 |
| **kotlin-agent** | `kotlin-agent/` | Android、Ktor、KMP | 移动应用、跨平台 |
| **csharp-agent** | `csharp-agent/` | .NET、WPF、Unity | Windows应用、游戏 |

**使用示例**:
```
@java-agent 开发Spring Boot应用
@kotlin-agent 创建Android应用
@csharp-agent 开发Unity游戏
```

#### 脚本与动态语言 (3个)

| Agent | 路径 | 专长 | 适用场景 |
|-------|------|------|----------|
| **python-agent** | `python-agent/` | AI/ML、数据科学、自动化 | 数据分析、AI应用 |
| **javascript-agent** | `javascript-agent/` | ES6+、Node.js | 全栈开发、脚本工具 |
| **typescript-agent** | `typescript-agent/` | 类型安全、大型项目 | 企业级前端、工具库 |

**使用示例**:
```
@python-agent 实现机器学习模型
@typescript-agent 开发大型前端项目
@javascript-agent 编写Node.js脚本
```

---

### 03-前端框架Agent (3个)

| Agent | 路径 | 框架 | 特点 |
|-------|------|------|------|
| **vue3-agent** | `vue3-agent/` | Vue 3 | 组合式API、Vite、轻量 |
| **react-agent** | `react-agent/` | React | Hooks、Next.js、生态丰富 |
| **flutter-agent** | `flutter-agent/` | Flutter | 跨平台、Dart、UI精美 |

**使用示例**:
```
@vue3-agent 创建管理后台
@react-agent 开发电商平台
@flutter-agent 构建移动App
```

---

### 04-游戏开发Agent (6个)

| Agent | 路径 | 功能 | 语言 |
|-------|------|------|------|
| **godot-gdscript-agent** | `godot-gdscript-agent/` | Godot原生开发 | GDScript |
| **godot-csharp-agent** | `godot-csharp-agent/` | 复杂游戏逻辑 | C# |
| **godot-asset-agent** | `godot-asset-agent/` | 资源管理 | - |
| **godot-asset-script-agent** | `godot-asset-script-agent/` | 程序化生成 | GDScript/C# |
| **godot-scene-agent** | `godot-scene-agent/` | 场景构建 | - |
| **GodotGame** | `GodotGame/` | 完整示例项目 | GDScript+C# |

**使用示例**:
```
@godot-gdscript-agent 开发2D平台游戏
@godot-scene-agent 设计游戏关卡
@godot-asset-agent 管理游戏资源
```

---

### 05-内容创作Agent (5个)

| Agent | 路径 | 阶段 | 功能 |
|-------|------|------|------|
| **brainstorm-agent** | `brainstorm-agent/` | 创意 | 头脑风暴、创意生成 |
| **outline-agent** | `outline-agent/` | 大纲 | 结构设计、章节规划 |
| **narrative-engine-agent** | `narrative-engine-agent/` | 创作 | 故事生成、叙事设计 |
| **polish-agent** | `polish-agent/` | 润色 | 语言优化、风格调整 |
| **storyboard-agent** | `storyboard-agent/` | 视觉 | 分镜设计、镜头规划 |

**使用示例**:
```
@brainstorm-agent 生成100个选题
@outline-agent 设计文章结构
@narrative-engine-agent 撰写小说
@polish-agent 润色文章
@storyboard-agent 创建分镜
```

---

### 06-AI创作Agent (6个)

| Agent | 路径 | 功能 | 输出 |
|-------|------|------|------|
| **nanobanana-asset-agent** | `nanobanana-asset-agent/` | AI美术资源生成 | 角色、场景、道具 |
| **nanobanana-grid-agent** | `nanobanana-grid-agent/` | 宫格提示词生成 | 多面板角色表 |
| **suno-music-agent** | `suno-music-agent/` | AI音乐生成 | 歌词、Suno提示词 |
| **comic-creator-agent** | `comic-creator-agent/` | 漫画创作 | 剧本、分镜、角色 |
| **script-creator-agent** | `script-creator-agent/` | 剧本创作 | 电影/短视频剧本 |
| **animation-creator-agent** | `animation-creator-agent/` | 动画制作 | 动画脚本、关键帧 |

**使用示例**:
```
@comic-creator-agent 创作科幻漫画
@script-creator-agent 编写电影剧本
@animation-creator-agent 制作动画
@suno-music-agent 生成背景音乐
```

---

### 07-工具辅助Agent (1个)

| Agent | 路径 | 功能 | 使用场景 |
|-------|------|------|----------|
| **language-selector-agent** | `language-selector-agent/` | 技术栈选型 | 项目启动时选择最佳语言 |

**使用示例**:
```
@language-selector-agent 推荐技术栈
```

---

## 🔥 常用组合推荐

### Web全栈开发
```
核心: @plan-agent + @spec-agent + @debug-agent
后端: @rust-agent / @go-agent / @java-agent
前端: @vue3-agent / @react-agent
```

### 移动应用开发
```
核心: @plan-agent + @spec-agent
跨平台: @flutter-agent
后端: @go-agent / @python-agent
```

### 游戏开发
```
核心: @plan-agent + @godot-gdscript-agent
美术: @nanobanana-asset-agent
音乐: @suno-music-agent
场景: @godot-scene-agent
```

### 内容创作
```
创意: @brainstorm-agent
大纲: @outline-agent
创作: @narrative-engine-agent
润色: @polish-agent
视觉: @storyboard-agent
```

### AI漫剧生产
```
剧本: @script-creator-agent
分镜: @storyboard-agent
漫画: @comic-creator-agent
动画: @animation-creator-agent
音乐: @suno-music-agent
```

---

## 📊 统计概览

| 分类 | 数量 | 占比 |
|------|------|------|
| 01-核心功能 | 4 | 10.8% |
| 02-编程语言 | 11 | 29.7% |
| 03-前端框架 | 3 | 8.1% |
| 04-游戏开发 | 6 | 16.2% |
| 05-内容创作 | 5 | 13.5% |
| 06-AI创作 | 6 | 16.2% |
| 07-工具辅助 | 1 | 2.7% |
| **总计** | **37** | **100%** |

---

## 🚀 快速开始

### 方式1: 直接引用
```
@rust-agent 帮我创建用户认证模块
```

### 方式2: 多Agent协作
```
先使用 @plan-agent 制定计划，
然后 @spec-agent 定义需求，
最后 @rust-agent + @vue3-agent 进行开发
```

### 方式3: 完整工作流
```
@language-selector-agent → 技术选型
@plan-agent → 项目规划
@spec-agent → 需求规格
@[开发Agent] → 代码实现
@debug-agent → 测试优化
```

---

**按类别快速找到你需要的 Agent！** 🎯
