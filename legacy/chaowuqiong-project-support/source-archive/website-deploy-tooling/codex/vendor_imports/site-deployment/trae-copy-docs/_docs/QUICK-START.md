# 🚀 Agent 快速启动指南

## ⚡ 3秒启动法则

### 方式1: 快捷键启动（推荐）

在 Trae 中输入快捷键直接调用 Agent：

```
Ctrl+Shift+1 → 启动 Rust Agent
Ctrl+Shift+2 → 启动 Go Agent
Ctrl+Shift+3 → 启动 Python Agent
Ctrl+Shift+P → 启动 Plan Agent
Ctrl+Shift+R → 启动 Debug Agent
```

### 方式2: 命令别名启动

```
# 编程语言
@rust  →  @rust-agent
@go    →  @go-agent
@py    →  @python-agent
@ts    →  @typescript-agent
@js    →  @javascript-agent
@java  →  @java-agent
@kt    →  @kotlin-agent
@cs    →  @csharp-agent
@cpp   →  @cpp-agent
@c     →  @c-agent

# 前端框架
@vue   →  @vue3-agent
@react →  @react-agent
@flutter → @flutter-agent

# 核心功能
@plan  →  @plan-agent
@spec  →  @spec-agent
@debug →  @debug-agent
@gen   →  @agent-generator

# 游戏开发
@godot →  @godot-gdscript-agent
@godotcs → @godot-csharp-agent

# 内容创作
@write →  @narrative-engine-agent
@story →  @storyboard-agent
@comic →  @comic-creator-agent
@script → @script-creator-agent
@music →  @suno-music-agent
```

### 方式3: 任务模板启动

```
# Web开发
/web  → 自动组合 @plan-agent + @rust-agent + @vue3-agent

# 移动App
/app  → 自动组合 @plan-agent + @flutter-agent + @go-agent

# 游戏开发
/game → 自动组合 @plan-agent + @godot-gdscript-agent + @nanobanana-asset-agent

# 内容创作
/content → 自动组合 @brainstorm-agent + @outline-agent + @narrative-engine-agent

# AI漫剧
/comic → 自动组合 @script-creator-agent + @storyboard-agent + @comic-creator-agent
```

---

## 🎯 快速任务模板

### 模板1: 一键创建项目

```
/new rust-api
→ 自动执行:
  1. @plan-agent 制定API开发计划
  2. @rust-agent 创建Axum项目结构
  3. @spec-agent 定义API规格
  4. @debug-agent 生成测试代码

/new vue-admin
→ 自动执行:
  1. @plan-agent 制定前端开发计划
  2. @vue3-agent 创建Vue3管理后台
  3. @spec-agent 定义组件规格
  4. @debug-agent 代码审查

/new godot-game
→ 自动执行:
  1. @plan-agent 制定GDD
  2. @godot-gdscript-agent 创建项目
  3. @nanobanana-asset-agent 生成美术资源
  4. @suno-music-agent 制作音效
```

### 模板2: 快速修复

```
/fix
→ 自动执行:
  1. @debug-agent 分析当前错误
  2. 定位问题根因
  3. 提供修复方案
  4. 生成修复代码

/fix performance
→ 自动执行:
  1. @debug-agent 性能分析
  2. 识别性能瓶颈
  3. 提供优化建议
  4. 生成优化代码
```

### 模板3: 快速生成

```
/gen crud
→ 自动生成CRUD代码:
  - Entity/Model
  - Repository/DAO
  - Service/Business
  - Controller/Handler
  - DTO/ViewModel
  - Unit Tests

/gen api
→ 自动生成API代码:
  - RESTful endpoints
  - Request/Response DTO
  - Validation
  - Error handling
  - Swagger/OpenAPI docs

/gen ui
→ 自动生成UI代码:
  - Component structure
  - Props/Events
  - Styling
  - Storybook stories
  - Unit tests
```

---

## 🔧 配置文件

### 1. 创建 `.trae/agent-config.json`

```json
{
  "version": "1.0.0",
  "default_agent": "rust-agent",
  "shortcuts": {
    "rust": "rust-agent",
    "go": "go-agent",
    "py": "python-agent",
    "ts": "typescript-agent",
    "js": "javascript-agent",
    "java": "java-agent",
    "kt": "kotlin-agent",
    "cs": "csharp-agent",
    "cpp": "cpp-agent",
    "c": "c-agent",
    "vue": "vue3-agent",
    "react": "react-agent",
    "flutter": "flutter-agent",
    "plan": "plan-agent",
    "spec": "spec-agent",
    "debug": "debug-agent",
    "gen": "agent-generator",
    "godot": "godot-gdscript-agent",
    "write": "narrative-engine-agent",
    "story": "storyboard-agent",
    "comic": "comic-creator-agent"
  },
  "templates": {
    "web": {
      "agents": ["plan-agent", "rust-agent", "vue3-agent", "debug-agent"],
      "workflow": "sequential"
    },
    "app": {
      "agents": ["plan-agent", "flutter-agent", "go-agent", "debug-agent"],
      "workflow": "sequential"
    },
    "game": {
      "agents": ["plan-agent", "godot-gdscript-agent", "nanobanana-asset-agent", "suno-music-agent"],
      "workflow": "sequential"
    },
    "content": {
      "agents": ["brainstorm-agent", "outline-agent", "narrative-engine-agent", "polish-agent"],
      "workflow": "sequential"
    }
  },
  "hotkeys": {
    "ctrl+shift+1": "rust-agent",
    "ctrl+shift+2": "go-agent",
    "ctrl+shift+3": "python-agent",
    "ctrl+shift+p": "plan-agent",
    "ctrl+shift+r": "debug-agent",
    "ctrl+shift+g": "agent-generator"
  }
}
```

### 2. 创建 `.trae/commands.json`

```json
{
  "commands": [
    {
      "name": "Rust开发",
      "shortcut": "rust",
      "prompt": "@rust-agent 使用最佳实践实现以下功能",
      "keybinding": "ctrl+shift+1"
    },
    {
      "name": "Go开发",
      "shortcut": "go",
      "prompt": "@go-agent 使用最佳实践实现以下功能",
      "keybinding": "ctrl+shift+2"
    },
    {
      "name": "Python开发",
      "shortcut": "py",
      "prompt": "@python-agent 使用最佳实践实现以下功能",
      "keybinding": "ctrl+shift+3"
    },
    {
      "name": "项目规划",
      "shortcut": "plan",
      "prompt": "@plan-agent 请为当前项目制定开发计划",
      "keybinding": "ctrl+shift+p"
    },
    {
      "name": "代码审查",
      "shortcut": "debug",
      "prompt": "@debug-agent 请审查当前代码并提供优化建议",
      "keybinding": "ctrl+shift+r"
    },
    {
      "name": "生成Agent",
      "shortcut": "gen",
      "prompt": "@agent-generator 请创建一个新的Agent",
      "keybinding": "ctrl+shift+g"
    },
    {
      "name": "Web项目",
      "shortcut": "web",
      "prompt": "@plan-agent 制定计划 → @rust-agent 开发后端 → @vue3-agent 开发前端 → @debug-agent 测试",
      "keybinding": ""
    },
    {
      "name": "移动App",
      "shortcut": "app",
      "prompt": "@plan-agent 制定计划 → @flutter-agent 开发App → @go-agent 开发API → @debug-agent 测试",
      "keybinding": ""
    },
    {
      "name": "游戏开发",
      "shortcut": "game",
      "prompt": "@plan-agent 制定GDD → @godot-gdscript-agent 开发 → @nanobanana-asset-agent 生成美术 → @suno-music-agent 制作音效",
      "keybinding": ""
    },
    {
      "name": "内容创作",
      "shortcut": "content",
      "prompt": "@brainstorm-agent 头脑风暴 → @outline-agent 设计大纲 → @narrative-engine-agent 创作内容 → @polish-agent 润色",
      "keybinding": ""
    }
  ]
}
```

---

## ⚡ 快速加载技巧

### 技巧1: 预加载常用Agent

在 Trae 启动时预加载常用 Agent：

```json
{
  "preload_agents": [
    "plan-agent",
    "spec-agent",
    "debug-agent",
    "rust-agent",
    "vue3-agent"
  ]
}
```

### 技巧2: 上下文缓存

保持项目上下文，避免重复说明：

```
/context save my-project
→ 保存当前项目上下文

/context load my-project
→ 快速加载项目上下文
```

### 技巧3: 智能路由

根据输入自动选择 Agent：

```
输入: "创建一个用户登录API"
→ 自动路由到: @rust-agent 或 @go-agent

输入: "设计一个电商网站"
→ 自动路由到: @plan-agent + @vue3-agent

输入: "修复这个bug"
→ 自动路由到: @debug-agent
```

---

## 🔄 批量快速启动

### 批量生成多个模块

```bash
# 创建批量生成脚本
$agents = @("user", "order", "product", "payment")
foreach ($agent in $agents) {
    @rust-agent 创建 $agent 模块，包含CRUD
}
```

### 批量审查代码

```bash
# 批量审查所有Rust文件
Get-ChildItem -Filter "*.rs" -Recurse | ForEach-Object {
    @debug-agent 审查文件 $_.Name
}
```

---

## 📱 快速启动面板

### 创建启动面板

```
┌─────────────────────────────────────┐
│        🚀 Agent 快速启动面板         │
├─────────────────────────────────────┤
│                                     │
│  💻 编程语言          🎨 前端框架   │
│  [Rust] [Go] [Py]     [Vue] [React] │
│  [Java] [TS] [JS]     [Flutter]     │
│                                     │
│  🎯 核心功能          🎮 游戏开发   │
│  [Plan] [Spec]        [Godot]       │
│  [Debug] [Gen]        [Unity]       │
│                                     │
│  ✍️ 内容创作          🎬 AI创作     │
│  [Write] [Story]      [Comic]       │
│  [Script] [Music]     [Animate]     │
│                                     │
│  📋 快速任务                        │
│  [Web项目] [App] [Game] [Content]   │
│                                     │
└─────────────────────────────────────┘
```

---

## 🎯 最佳实践

### 1. 使用别名加速

```
# 长命令
@rust-agent 帮我创建一个Web API项目

# 短命令（推荐）
@rust 创建Web API
```

### 2. 组合命令

```
# 单条命令完成多个任务
@plan + @rust + @vue 创建全栈项目

# 或者使用模板
/web 创建全栈项目
```

### 3. 上下文保持

```
# 开始会话时设置上下文
/context:rust-web
→ 自动加载Rust Web开发相关Agent和模板

/context:game-dev
→ 自动加载游戏开发相关Agent和模板
```

### 4. 智能补全

```
输入: @ru
→ 自动补全: @rust-agent

输入: /we
→ 自动补全: /web
```

---

## 🔥 极速启动示例

### 示例1: 5秒启动Web项目

```
1. 输入: /web
2. 输入: "创建一个博客系统"
3. 回车 → 自动执行完整流程
```

### 示例2: 3秒修复Bug

```
1. 选中错误代码
2. 按 Ctrl+Shift+R
3. 自动分析并修复
```

### 示例3: 10秒生成完整模块

```
1. 输入: @rust
2. 输入: /gen crud user
3. 自动生成完整用户模块
```

---

## 💡 性能优化

### 1. 延迟加载

不常用的Agent采用延迟加载，首次使用时初始化。

### 2. 缓存机制

缓存已加载的Agent和上下文，下次使用秒开。

### 3. 并行加载

多个Agent并行初始化，减少等待时间。

### 4. 预编译模板

常用模板预编译，直接填充变量即可使用。

---

**现在您可以秒级启动任何Agent！** ⚡🚀
