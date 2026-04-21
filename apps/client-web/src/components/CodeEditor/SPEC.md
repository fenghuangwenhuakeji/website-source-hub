# VibeCoding - 智能代码编辑器规格文档

## 1. 项目概述

**项目名称**: VibeCoding (AI-Powered Code Editor)
**项目类型**: 高级代码编辑应用
**核心功能**: 集成 LSP 智能补全、DIFF 对比视图、代码执行、浏览器预览、终端模拟器、AI 对话系统的全能型代码编辑器
**目标用户**: 需要 AI 辅助编程的开发者

## 2. 功能规格

### 2.1 核心功能

#### 2.1.1 Monaco Editor 集成
- **功能描述**: 替换当前 textarea 为 Monaco Editor（VSCode 同款编辑器）
- **主要特性**:
  - 语法高亮（100+ 语言支持）
  - LSP 代码补全和诊断
  - 多光标编辑
  - 代码折叠
  - 查找和替换
  - 快捷键支持
- **依赖包**: `@monaco-editor/react`

#### 2.1.2 DIFF 对比视图
- **功能描述**: 实时流式对比修改前后的代码
- **布局**:
  - 左侧面板: 修改前的原始代码
  - 右侧面板: 修改后的代码（支持流式更新）
- **特性**:
  - 行级别差异高亮
  - 实时同步滚动
  - 差异统计（新增/删除/修改行数）

#### 2.1.3 代码执行能力
- **功能描述**: 在编辑器内直接运行代码
- **支持语言**:
  - JavaScript/TypeScript (Node.js)
  - Python
  - HTML/CSS/JS (浏览器预览)
- **实现方式**:
  - JavaScript: iframe sandbox 执行
  - Python: 后端 API 调用
  - HTML: 内置浏览器预览

#### 2.1.4 浏览器预览面板
- **功能描述**: 实时预览 HTML/CSS/JS 效果
- **特性**:
  - 实时刷新
  - 独立 iframe 沙箱
  - 控制台输出捕获
  - 移动端预览尺寸模拟

#### 2.1.5 终端模拟器
- **功能描述**: 内置命令行界面
- **特性**:
  - 支持常用命令
  - 输出分页
  - 命令历史

#### 2.1.6 AI 对话面板
- **功能描述**: 边写代码边与 AI 对话
- **特性**:
  - 代码片段发送
  - 上下文理解
  - 建议代码插入
  - 多轮对话记忆

#### 2.1.7 Skills 集成
- **功能描述**: 使用预定义技能辅助开发
- **技能类型**:
  - 代码重构
  - 单元测试生成
  - 文档生成
  - 代码审查

### 2.2 用户界面布局

```
┌─────────────────────────────────────────────────────────────────┐
│  菜单栏 (File | Edit | View | Run | AI | Help)                  │
├─────────────────────────────────────────────────────────────────┤
│  活动栏  │  文件浏览器  │        编辑器区域 (Monaco)              │
│  ─────   │  ────────   │  ┌──────────────┬──────────────┐       │
│  📁      │  文件列表    │  │   原始代码   │   修改后代码  │       │
│  🔍      │             │  │   (DIFF)    │   (流式)     │       │
│  ▶       │             │  │              │              │       │
│  💬      │             │  └──────────────┴──────────────┘       │
│  ⚡      │             ├─────────────────────────────────────────┤
│          │             │        底部面板 (可折叠)                │
│          │             │  [终端] [预览] [AI对话] [Problems]     │
├──────────┴─────────────┴─────────────────────────────────────────┤
│  状态栏 (语言 | 行号 | 编码 | LSP状态)                           │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 数据模型

#### FileData
```typescript
interface FileData {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  isModified: boolean;
  originalContent?: string;  // DIFF 用
}
```

#### DiffState
```typescript
interface DiffState {
  original: string;
  modified: string;
  streamingContent: string;
  isStreaming: boolean;
  changes: DiffChange[];
}

interface DiffChange {
  type: 'added' | 'removed' | 'modified';
  lineStart: number;
  lineEnd: number;
}
```

#### ExecutionResult
```typescript
interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
}
```

### 2.4 API 接口

#### 代码执行 API
```
POST /api/execute
Request: {
  language: 'javascript' | 'python' | 'html',
  code: string,
  timeout?: number
}
Response: {
  success: boolean,
  output: string,
  error?: string,
  executionTime: number
}
```

#### AI 对话 API
```
POST /api/ai/chat
Request: {
  message: string,
  context: {
    currentFile: string,
    selectedCode?: string,
    language: string
  },
  history: Array<{role: string, content: string}>
}
Response: StreamResponse<{
  content: string,
  suggestions?: CodeSuggestion[]
}>
```

## 3. 非功能规格

### 3.1 性能需求
- 编辑器响应延迟 < 50ms
- 代码补全弹出 < 100ms
- 文件切换 < 200ms
- DIFF 渲染 < 500ms

### 3.2 兼容性
- Chrome/Edge/Firefox/Safari 最新两个版本
- 1920x1080 及以上分辨率
- 移动端响应式布局（可选）

### 3.3 安全
- 代码执行在沙箱环境
- 不保存敏感信息到本地
- CSP 策略严格执行

## 4. 技术栈

| 组件 | 技术选择 | 理由 |
|------|----------|------|
| 编辑器 | Monaco Editor | VSCode 同款，功能强大 |
| 状态管理 | Zustand | 轻量级，TypeScript 支持好 |
| 样式 | SCSS Modules | 组件级样式隔离 |
| AI 集成 | WebChat API | 统一的 AI 对话接口 |
| 代码执行 | iframe sandbox + 后端 | 安全隔离 |

## 5. 实施阶段

### Phase 1: 基础增强
1. 安装 Monaco Editor
2. 迁移现有编辑器功能到 Monaco
3. 基础 LSP 配置

### Phase 2: DIFF 视图
1. 实现双面板编辑器
2. 流式更新机制
3. 差异高亮

### Phase 3: 执行与预览
1. 代码执行服务
2. 浏览器预览面板
3. 终端模拟器

### Phase 4: AI 集成
1. AI 对话面板
2. Skills 侧边栏
3. 代码建议插入

## 6. 风险评估

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| Monaco 包体积大 | 加载慢 | 代码分割，按需加载 |
| 代码执行安全 | 高 | 沙箱隔离，服务端验证 |
| AI 响应延迟 | 中 | 流式输出，显示加载状态 |
| LSP 服务连接 | 中 | 离线模式降级 |
