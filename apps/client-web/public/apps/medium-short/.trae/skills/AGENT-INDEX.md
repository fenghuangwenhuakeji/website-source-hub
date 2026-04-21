# 🤖 Agent 技能索引 - 多功能协调中心

## 📋 快速导航

| 分类 | 数量 | 链接 |
|------|------|------|
| 🎯 核心功能 | 4 | [核心功能](#核心功能-agent) |
| 💻 编程语言 | 10 | [编程语言](#编程语言-agent) |
| 🎨 前端框架 | 3 | [前端框架](#前端框架-agent) |
| 🎮 游戏开发 | 6 | [游戏开发](#游戏开发-agent) |
| ✍️ 内容创作 | 5 | [内容创作](#内容创作-agent) |
| 🎬 AI 创作 | 6 | [AI创作](#ai创作-agent) |
| 🔧 工具辅助 | 1 | [工具辅助](#工具辅助-agent) |
| 👥 团队协作 | 6方向 | [团队协作](#agent-团队协作) |
| 📊 总计 | **35+** | [完整列表](#完整-agent-列表) |

---

## 🎯 核心功能 Agent

### 1. Agent-Generator (制造生成器)
**路径**: `01-核心功能Agent/agent-generator/`
**功能**: 生成、配置、管理所有 Agent
**能力**: 
- 自动生成 5 文档标准 (SKILL/requirement/design/tasks/checklist)
- 支持自定义模板
- 插件扩展机制

### 2. Plan-Agent (规划专家)
**路径**: `01-核心功能Agent/plan-agent/`
**功能**: 项目规划与任务分解
**能力**:
- 目标解析与 WBS 分解
- 时间管理与资源分配
- 敏捷/瀑布/混合方法论

### 3. Spec-Agent (规格专家)
**路径**: `01-核心功能Agent/spec-agent/`
**功能**: 需求分析与规格定义
**能力**:
- 需求获取与分析
- API 规格定义 (OpenAPI)
- 用户故事地图

### 4. Debug-Agent (调试专家)
**路径**: `01-核心功能Agent/debug-agent/`
**功能**: 智能调试与问题诊断
**能力**:
- 错误诊断与根因分析
- 代码审查与性能分析
- 修复建议生成

---

## 💻 编程语言 Agent

### 系统级语言
| Agent | 路径 | 专长 | 适用场景 |
|-------|------|------|----------|
| **C-Agent** | `02-编程语言Agent/01-系统级语言/c-agent/` | 系统编程、嵌入式 | 操作系统、驱动开发 |
| **Cpp-Agent** | `02-编程语言Agent/01-系统级语言/cpp-agent/` | C++17/20、Qt、高性能 | 游戏引擎、系统软件 |
| **Rust-Agent** | `02-编程语言Agent/01-系统级语言/rust-agent/` | 所有权、并发安全 | 区块链、Web后端 |
| **Go-Agent** | `02-编程语言Agent/01-系统级语言/go-agent/` | 云原生、微服务 | 分布式系统、API服务 |

### 企业级语言
| Agent | 路径 | 专长 | 适用场景 |
|-------|------|------|----------|
| **Java-Agent** | `02-编程语言Agent/02-企业级语言/java-agent/` | Spring Boot、企业应用 | 企业级后端、大数据 |
| **Kotlin-Agent** | `02-编程语言Agent/02-企业级语言/kotlin-agent/` | Android、Ktor、KMP | 移动应用、跨平台 |
| **CSharp-Agent** | `02-编程语言Agent/02-企业级语言/csharp-agent/` | .NET、WPF、Unity | Windows应用、游戏 |

### 脚本与动态语言
| Agent | 路径 | 专长 | 适用场景 |
|-------|------|------|----------|
| **Python-Agent** | `02-编程语言Agent/03-脚本动态语言/python-agent/` | AI/ML、数据科学、自动化 | 数据分析、AI应用 |
| **JavaScript-Agent** | `02-编程语言Agent/03-脚本动态语言/javascript-agent/` | ES6+、Node.js | 全栈开发、脚本工具 |
| **TypeScript-Agent** | `02-编程语言Agent/03-脚本动态语言/typescript-agent/` | 类型安全、大型项目 | 企业级前端、工具库 |

---

## 🎨 前端框架 Agent

| Agent | 路径 | 专长 | 适用场景 |
|-------|------|------|----------|
| **Vue3-Agent** | `03-前端框架Agent/vue3-agent/` | Vue3、Composition API、Vite | 中小型项目、快速开发 |
| **React-Agent** | `03-前端框架Agent/react-agent/` | Hooks、Next.js、状态管理 | 大型应用、复杂交互 |
| **Flutter-Agent** | `03-前端框架Agent/flutter-agent/` | 跨平台、Dart、UI组件 | 移动App、桌面应用 |

---

## 🎮 游戏开发 Agent

### Godot 引擎系列
| Agent | 路径 | 功能 | 语言 |
|-------|------|------|------|
| **Godot-GDScript-Agent** | `04-游戏开发Agent/godot-gdscript-agent/` | Godot原生开发 | GDScript |
| **Godot-CSharp-Agent** | `04-游戏开发Agent/godot-csharp-agent/` | 复杂游戏逻辑 | C# |
| **Godot-Asset-Agent** | `04-游戏开发Agent/godot-asset-agent/` | 资源管理、导入导出 | - |
| **Godot-Asset-Script-Agent** | `04-游戏开发Agent/godot-asset-script-agent/` | 程序化资源生成 | GDScript/C# |
| **Godot-Scene-Agent** | `04-游戏开发Agent/godot-scene-agent/` | 场景构建、节点系统 | - |

### 示例项目
| 项目 | 路径 | 说明 |
|------|------|------|
| **GodotGame** | `04-游戏开发Agent/GodotGame/` | 完整游戏示例 (GDScript + C#) |

---

## ✍️ 内容创作 Agent

### 写作流程
| Agent | 路径 | 功能 | 输出 |
|-------|------|------|------|
| **Brainstorm-Agent** | `05-内容创作Agent/brainstorm-agent/` | 头脑风暴、创意生成 | 创意列表、概念图 |
| **Outline-Agent** | `