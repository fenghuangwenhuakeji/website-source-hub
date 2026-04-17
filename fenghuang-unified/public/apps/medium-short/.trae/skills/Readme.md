# 🤖 Trae Skills - AI Agent 技能库

## 🌟 简介

这是 Trae IDE 的 AI Agent 技能库，采用**1+3+6+N**架构，包含 **35+** 个专业 Agent，覆盖编程开发、内容创作、游戏开发、AI 创作等多个领域。

```
┌─────────────────────────────────────────────────────────────┐
│                    Trae Skills 技能库                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │  🎯 核心    │  │  💻 编程    │  │  🎨 前端    │        │
│   │  4个Agent   │  │  10个Agent  │  │  3个Agent   │        │
│   └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│   │  🎮 游戏    │  │  ✍️ 内容    │  │  🎬 AI创作  │        │
│   │  6个Agent   │  │  5个Agent   │  │  6个Agent   │        │
│   └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  🔧 工具辅助  ·  👥 团队协作  ·  ⚔️ 十种阵法       │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 目录结构

```
.trae/skills/
│
├── 📁 01-核心功能Agent/                    # 4个 - 基础设施
│   ├── agent-generator/                    # Agent制造生成器
│   ├── plan-agent/                         # 规划Agent
│   ├── spec-agent/                         # 规格Agent
│   └── debug-agent/                        # 调试Agent
│
├── 📁 02-编程语言Agent/                     # 10个 - 语言专家
│   ├── 📁 01-系统级语言/                    # 4个
│   │   ├── c-agent/                        # C语言
│   │   ├── cpp-agent/                      # C++
│   │   ├── rust-agent/                     # Rust
│   │   └── go-agent/                       # Go
│   │
│   ├── 📁 02-企业级语言/                    # 3个
│   │   ├── java-agent/                     # Java
│   │   ├── kotlin-agent/                   # Kotlin
│   │   └── csharp-agent/                   # C#
│   │
│   └── 📁 03-脚本动态语言/                  # 3个
│       ├── python-agent/                   # Python
│       ├── javascript-agent/               # JavaScript
│       └── typescript-agent/               # TypeScript
│
├── 📁 03-前端框架Agent/                     # 3个 - 前端专家
│   ├── vue3-agent/                         # Vue3
│   ├── react-agent/                        # React
│   └── flutter-agent/                      # Flutter
│
├── 📁 04-游戏开发Agent/                     # 6个 - 游戏引擎
│   ├── godot-gdscript-agent/               # Godot GDScript
│   ├── godot-csharp-agent/                 # Godot C#
│   ├── godot-asset-agent/                  # Godot资源
│   ├── godot-asset-script-agent/           # Godot程序化资源
│   ├── godot-scene-agent/                  # Godot场景
│   └── GodotGame/                          # 示例项目
│
├── 📁 05-内容创作Agent/                     # 5个 - 写作流程
│   ├── brainstorm-agent/                   # 头脑风暴
│   ├── outline-agent/                      # 大纲设计
│   ├── narrative-engine-agent/             # 叙事引擎
│   ├── polish-agent/                       # 润色优化
│   └── storyboard-agent/                   # 分镜设计
│
├── 📁 06-AI创作Agent/                       # 6个 - AI生成
│   ├── nanobanana-asset-agent/             # NanoBanana资源
│   ├── nanobanana-grid-agent/              # NanoBanana宫格
│   ├── suno-music-agent/                   # Suno音乐
│   ├── comic-creator-agent/                # 漫画创作
│   ├── script-creator-agent/               # 剧本创作
│   └── animation-creator-agent/            # 动画创作
│
├── 📁 07-工具辅助Agent/                     # 1个 - 辅助工具
│   └── language-selector-agent/            # 语言选择器
│
├── 📁 08-Agent团队协作/                     # 团队协作体系
│   ├── 📁 01-核心功能Agent/                 # 核心Agent定义
│   ├── 📁 02-AI编程教学/                    # 方向1: 编程教学
│   ├── 📁 03-AI软件开发/                    # 方向2: 软件开发
│   ├── 📁 04-AI内容编写/                    # 方向3: 内容创作
│   ├── 📁 05-AI游戏开发/                    # 方向4: 游戏开发
│   ├── 📁 06-AI漫剧生产/                    # 方向5: 漫剧生产
│   ├── 📁 07-AI量化金融/                    # 方向6: 量化金融
│   └── 📁 99-阵法配置/                      # 十种协作阵法
│
├── AGENT-INDEX.md                          # 完整Agent索引
├── AGENT-COORDINATION.md                   # 多任务协调机制
└── README.md                               # 本文件
```

---

## 🏗️ 架构体系

### 1+3+6+N 架构

| 层级 | 说明 | 组件 |
|------|------|------|
| **1** | Agent制造生成器 | agent-generator |
| **3** | 核心功能Agent | plan-agent, spec-agent, debug-agent |
| **6** | 六大方向团队 | 编程教学/软件开发/内容编写/游戏开发/漫剧生产/量化金融 |
| **N** | 衍生Agent体系 | 35+ 个专业Agent |
| **10** | 协作阵法 | 朝廷九品/三省六部/战时军工等 |

---

## 🎯 核心功能 Agent (4个)

### 1. Agent-Generator - Agent制造生成器
- **路径**: `01-核心功能Agent/agent-generator/`
- **功能**: 自动生成符合5文档标准的Agent
- **能力**: 模板生成、自定义配置、插件扩展

### 2. Plan-Agent - 智能规划专家
- **路径**: `01-核心功能Agent/plan-agent/`
- **功能**: 项目规划与任务分解
- **能力**: WBS、甘特图、资源分配

### 3. Spec-Agent - 需求规格专家
- **路径**: `01-核心功能Agent/spec-agent/`
- **功能**: 需求分析与规格定义
- **能力**: 用户故事、API规格、数据模型

### 4. Debug-Agent - 智能调试专家
- **路径**: `01-核心功能Agent/debug-agent/`
- **功能**: 错误诊断与问题修复
- **能力**: 根因分析、性能优化、修复建议

---

## 💻 编程语言 Agent (10个)

### 系统级语言 (4个)
| Agent | 路径 | 专长 | 场景 |
|-------|------|------|------|
| **c-agent** | `02-编程语言Agent/01-系统级语言/c-agent/` | 系统编程、嵌入式 | 操作系统、驱动 |
| **cpp-agent** | `02-编程语言Agent/01-系统级语言/cpp-agent/` | C++17/20、Qt | 游戏引擎、高性能 |
| **rust-agent** | `02-编程语言Agent/01-系统级语言/rust-agent/` | 所有权、并发安全 | 区块链、Web后端 |
| **go-agent** | `02-编程语言Agent/01-系统级语言/go-agent/` | 云原生、微服务 | 分布式系统 |

### 企业级语言 (3个)
| Agent | 路径 | 专长 | 场景 |
|-------|------|------|------|
| **java-agent** | `02-编程语言Agent/02-企业级语言/java-agent/` | Spring Boot | 企业后端、大数据 |
| **kotlin-agent** | `02-编程语言Agent/02-企业级语言/kotlin-agent/` | Android、KMP | 移动应用 |
| **csharp-agent** | `02-编程语言Agent/02-企业级语言/csharp-agent/` | .NET、Unity | Windows应用、游戏 |

### 脚本与动态语言 (3个)
| Agent | 路径 | 专长 | 场景 |
|-------|------|------|------|
| **python-agent** | `02-编程语言Agent/03-脚本动态语言/python-agent/` | AI/ML、数据科学 | 数据分析、AI应用 |
| **javascript-agent** | `02-编程语言Agent/03-脚本动态语言/javascript-agent/` | ES6+、Node.js | 全栈开发 |
| **typescript-agent** | `02-编程语言Agent/03-脚本动态语言/typescript-agent/` | 类型安全 | 企业级前端 |

---

## 🎨 前端框架 Agent (3个)

| Agent | 路径 | 框架 | 特点 |
|-------|------|------|------|
| **vue3-agent** | `03-前端框架Agent/vue3-agent/` | Vue 3 | 组合式API、Vite、轻量 |
| **react-agent** | `03-前端框架Agent/react-agent/` | React | Hooks、Next.js、生态丰富 |
| **flutter-agent** | `03-前端框架Agent/flutter-agent/` | Flutter | 跨平台、Dart、UI精美 |

---

## 🎮 游戏开发 Agent (6个)

| Agent | 路径 | 功能 | 语言 |
|-------|------|------|------|
| **godot-gdscript-agent** | `04-游戏开发Agent/godot-gdscript-agent/` | Godot原生开发 | GDScript |
| **godot-csharp-agent** | `04-游戏开发Agent/godot-csharp-agent/` | 复杂游戏逻辑 | C# |
| **godot-asset-agent** | `04-游戏开发Agent/godot-asset-agent/` | 资源管理 | - |
| **godot-asset-script-agent** | `04-游戏开发Agent/godot-asset-script-agent/` | 程序化生成 | GDScript/C# |
| **godot-scene-agent** | `04-游戏开发Agent/godot-scene-agent/` | 场景构建 | - |
| **GodotGame** | `04-游戏开发Agent/GodotGame/` | 完整示例项目 | GDScript+C# |

---

## ✍️ 内容创作 Agent (5个)

| Agent | 路径 | 阶段 | 功能 |
|-------|------|------|------|
| **brainstorm-agent** | `05-内容创作Agent/brainstorm-agent/` | 创意 | 头脑风暴、创意生成 |
| **outline-agent** | `05-内容创作Agent/outline-agent/` | 大纲 | 结构设计、章节规划 |
| **narrative-engine-agent** | `05-内容创作Agent/narrative-engine-agent/` | 创作 | 故事生成、叙事设计 |
| **polish-agent** | `05-内容创作Agent/polish-agent/` | 润色 | 语言优化、风格调整 |
| **storyboard-agent** | `05-内容创作Agent/storyboard-agent/` | 视觉 | 分镜设计、镜头规划 |

---

## 🎬 AI 创作 Agent (6个)

| Agent | 路径 | 功能 | 输出 |
|-------|------|------|------|
| **nanobanana-asset-agent** | `06-AI创作Agent/nanobanana-asset-agent/` | AI美术资源生成 | 角色、场景、道具 |
| **nanobanana-grid-agent** | `06-AI创作Agent/nanobanana-grid-agent/` | 宫格提示词生成 | 多面板角色表 |
| **suno-music-agent** | `06-AI创作Agent/suno-music-agent/` | AI音乐生成 | 歌词、Suno提示词 |
| **comic-creator-agent** | `06-AI创作Agent/comic-creator-agent/` | 漫画创作 | 剧本、分镜、角色 |
| **script-creator-agent** | `06-AI创作Agent/script-creator-agent/` | 剧本创作 | 电影/短视频剧本 |
| **animation-creator-agent** | `06-AI创作Agent/animation-creator-agent/` | 动画制作 | 动画脚本、关键帧 |

---

## 🔧 工具辅助 Agent (1个)

| Agent | 路径 | 功能 | 使用场景 |
|-------|------|------|----------|
| **language-selector-agent** | `07-工具辅助Agent/language-selector-agent/` | 技术栈选型 | 项目启动时选择最佳语言 |

---

## 👥 Agent 团队协作 (6大方向)

### 08-Agent团队协作/ 目录结构

| 方向 | 路径 | 说明 |
|------|------|------|
| **核心功能** | `08-Agent团队协作/01-核心功能Agent/` | Agent制造、规划、规格、调试定义 |
| **AI编程教学** | `08-Agent团队协作/02-AI编程教学/` | 基础编程、算法训练、项目实战 |
| **AI软件开发** | `08-Agent团队协作/03-AI软件开发/` | 需求分析、架构设计、代码生成、测试部署 |
| **AI内容编写** | `08-Agent团队协作/04-AI内容编写/` | 创意构思、大纲设计、内容创作、润色优化 |
| **AI游戏开发** | `08-Agent团队协作/05-AI游戏开发/` | 游戏策划、美术资源、程序开发、音效音乐 |
| **AI漫剧生产** | `08-Agent团队协作/06-AI漫剧生产/` | 剧本创作、分镜设计、角色设计、动画制作 |
| **AI量化金融** | `08-Agent团队协作/07-AI量化金融/` | 数据分析、策略研发、回测优化、交易执行 |
| **阵法配置** | `08-Agent团队协作/99-阵法配置/` | 十种协作阵法 |

---

## ⚔️ 十种阵法配置

根据不同任务场景，灵活选择Agent协作模式：

| 阵法 | 特点 | 适用场景 |
|------|------|----------|
| **朝廷九品阵** | 层级分明 | 大型项目 |
| **三省六部阵** | 分工明确 | 政府/企业系统 |
| **战时军工阵** | 快速响应 | 紧急项目/MVP |
| **君主立宪阵** | 民主决策 | 创新研究 |
| **分封制阵** | 分布式 | 微服务架构 |
| **公司制阵** | 商业化 | 商业产品 |
| **宗族制度阵** | 传承学习 | 教育培训 |
| **社群制度阵** | 协作共享 | 开源项目 |
| **人民民主阵** | 平等参与 | 众包项目 |
| **技术公会阵** | 专业细分 | 技术研究 |

---

## 🚀 快速使用指南

### 场景1: 启动新项目
```
1. @language-selector-agent → 选择技术栈
2. @plan-agent → 制定项目计划
3. @spec-agent → 定义需求规格
4. [选择对应语言Agent] → 开始开发
5. @debug-agent → 测试调试
```

### 场景2: Web全栈开发
```
后端: @rust-agent / @go-agent / @java-agent
前端: @vue3-agent / @react-agent
协调: @plan-agent + @spec-agent + @debug-agent
```

### 场景3: 游戏开发
```
@godot-gdscript-agent + @godot-scene-agent + @suno-music-agent
+ @nanobanana-asset-agent → 完整游戏开发
```

### 场景4: 内容创作
```
@brainstorm-agent → @outline-agent → @narrative-engine-agent
→ @polish-agent → @storyboard-agent → 完整内容产出
```

### 场景5: AI漫剧生产
```
@script-creator-agent → @storyboard-agent → @comic-creator-agent
→ @animation-creator-agent → @suno-music-agent → 完整漫剧
```

### 场景6: 阵法团队协作
```
使用 朝廷九品阵:
- 皇帝: @agent-generator (总控)
- 三公: @plan-agent + @spec-agent + @debug-agent
- 六部: @rust-agent + @vue3-agent + @godot-agent...
```

---

## 📚 文档导航

| 文档 | 用途 | 路径 |
|------|------|------|
| **AGENT-INDEX** | 完整Agent索引与分类 | `AGENT-INDEX.md` |
| **AGENT-COORDINATION** | 多任务协调机制 | `AGENT-COORDINATION.md` |
| **阵法配置** | 十种协作阵法 | `08-Agent团队协作/99-阵法配置/` |

---

## 📊 统计概览

| 分类 | 数量 | 占比 |
|------|------|------|
| 01-核心功能 | 4 | 11.4% |
| 02-编程语言 | 10 | 28.6% |
| 03-前端框架 | 3 | 8.6% |
| 04-游戏开发 | 6 | 17.1% |
| 05-内容创作 | 5 | 14.3% |
| 06-AI创作 | 6 | 17.1% |
| 07-工具辅助 | 1 | 2.9% |
| **总计** | **35** | **100%** |

---

## 🎯 使用模式

### 单Agent模式
```
用户 → Agent → 输出
```
适用于简单、明确的任务

### 顺序协作模式
```
用户 → Plan → Spec → 开发 → Debug → 输出
```
适用于软件开发生命周期

### 并行协作模式
```
        ┌→ iOS开发 →┐
用户 →  ├→ Android →┼→ 聚合 → 输出
        └→ Web开发 →┘
```
适用于多平台同时开发

### 阵法协作模式
```
用户 → Agent-Generator → 选择阵法 → Agent团队 → 输出
```
适用于复杂项目，详见 `08-Agent团队协作/99-阵法配置/`

---

## 📖 文档规范

每个Agent包含5个标准文档：

| 文档 | 用途 | 必须 |
|------|------|------|
| `SKILL.md` | 技能定义、能力说明 | ✅ |
| `requirement.md` | 需求规格说明书 | ✅ |
| `design.md` | 架构设计文档 | ✅ |
| `tasks.md` | 任务分解文档 | ✅ |
| `checklist.md` | 质量检查清单 | ✅ |

---

## 🛠️ 扩展开发

### 添加新Agent

1. 在对应分类下创建目录
2. 添加5个标准文档
3. 更新 `AGENT-INDEX.md`
4. 测试验证

### 添加新阵法

1. 在 `08-Agent团队协作/99-阵法配置/` 创建文档
2. 定义角色关系和协作流程
3. 提供配置示例

---

## 📈 更新日志

### 2026-03-18
- ✅ 重新规划目录结构
- ✅ 整合Agent团队协作体系
- ✅ 添加6大方向团队配置
- ✅ 完善十种阵法配置
- ✅ 更新所有文档

---

## 🤝 贡献指南

欢迎贡献新的Agent或改进建议！

1. 遵循5文档标准
2. 更新索引文档
3. 提供使用示例
4. 测试验证

---

## 📄 License

MIT License - 开源、免费使用

---

**让AI Agent协作，释放无限创造力！** 🚀
