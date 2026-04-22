# Round 1 Agent Mechanism Integration

## 目标

第 1 轮先把 `.trae` 里最核心的机制下沉到可复用的数据结构层，而不是一开始就把所有界面都重写一遍。

本轮主线：

- 给 `聊天 / Agent / Code Edit / 写作 / 凤煌创世合集` 建立统一的体验画像。
- 把身份、记忆层、生命周期、唤醒关键词、编排重点抽成共享蓝图。
- 先接到 `webuiapps` 的底层类型、默认 Agent、桌面应用定义和静态应用注册表上。

## 本轮落地点

### 1. 共享体验蓝图

新增共享蓝图模块：

- `apps/frontent/webuiapps/src/lib/agentExperienceBlueprints.ts`

它统一定义了：

- `chat`
- `agent`
- `code-edit`
- `writing`
- `fenghuang`

每个画像都带：

- 使命
- 语气
- 激活关键词
- 记忆层
- 生命周期
- 多 Agent / 多工具编排重点
- UI 关注点
- 默认系统提示词

### 2. Agent 对话系统

影响文件：

- `src/lib/agent/types.ts`
- `src/lib/agent/store.ts`

增强点：

- `AgentConfig` 新增体验画像、身份、唤醒关键词、生命周期字段。
- `MemoryConfig` 新增 `memoryTags`。
- 默认的 `通用助手 / 代码助手 / 调试专家` 现在不再只是简单 prompt，而是带有 `.trae` 风格的身份与生命周期。

### 3. 多 Agent 引擎

影响文件：

- `src/lib/agents/types.ts`
- `src/lib/agents/builtins.ts`
- `src/lib/agents/engine.ts`

增强点：

- 内建 Agent 可声明体验画像、激活关键词、记忆重点、生命周期。
- 引擎构造系统提示词时，会自动把这些机制注入 prompt。
- 这为后续真正做“自动唤醒 / 多 Agent 编排 / 复盘压缩”预留了标准接口。

### 4. 应用入口与数据结构

影响文件：

- `src/types/desktopApp.ts`
- `src/lib/desktopApps.ts`
- `src/lib/appRegistry.ts`

增强点：

- 桌面应用和静态应用注册表现在都可声明：
  - `experienceProfileId`
  - `activationKeywords`
  - `mobilePriority`
  - `experienceHighlights`
- 这意味着应用层已经开始理解“它自己属于哪种能力入口”，而不是只有标题和描述。

## 为什么这样做

这样做有三个好处：

1. 后续改 UI 时，不需要每个模块重复写一套“我是做什么的”说明。
2. 后续做自动路由和自动唤醒时，可以直接用 `experienceProfileId + activationKeywords`。
3. 后续做移动端优先级排序、首页分层、Agent 编排时，不需要再从零补字段。

## 第 2 轮建议

下一轮适合继续做：

1. 把 `AgentChatPanel / ChatPanel / CodeEditor AIChatPanel` 真的接上这套共享画像，而不只是底层有字段。
2. 把 `desktopApps` 和 `appRegistry` 的画像字段真正用于首页排序、移动端入口优先级和搜索命中。
3. 引入轻量的 `runtime host`，让 Agent 生命周期和状态流不只停留在配置层。
