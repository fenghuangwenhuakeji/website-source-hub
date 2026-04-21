# 超无穹 APP 开发完整指南 - Agent 出口

## 概述

本项目采用**双轨制 APP 开发模式**：

1. **内置 APP 模式** - React 组件，深度集成
2. **外部项目模式** - 独立 HTML，iframe 嵌入

---

## 一、内置 APP 开发模式（推荐用于深度集成）

### 1.1 目录结构

```
apps/webuiapps/src/pages/
├── YourApp/                    # 你的APP目录
│   ├── index.tsx              # 主组件（必需）
│   ├── index.module.scss      # 样式（可选）
│   ├── types.ts               # 类型定义（可选）
│   ├── actions/
│   │   ├── constants.ts       # APP_ID、ActionTypes
│   │   └── handlers.ts        # 动作处理器
│   ├── components/            # 子组件
│   ├── hooks/                 # 自定义 Hooks
│   └── i18n/                  # 多语言（可选）
```

### 1.2 最小可运行 APP 模板

```typescript
// apps/webuiapps/src/pages/YourApp/index.tsx
import React, { useEffect, useState } from 'react';
import { initVibeApp, AppLifecycle } from '@gui/vibe-container';
import {
  useAgentActionListener,
  reportAction,
  reportLifecycle,
  createAppFileApi,
} from '@/lib';
import styles from './index.module.scss';

// APP 配置
const APP_ID = 100;  // 唯一ID，从100开始
const APP_NAME = 'yourapp';
const DISPLAY_NAME = '你的应用';

// 创建文件 API
const fileApi = createAppFileApi(APP_NAME);

const YourApp: React.FC = () => {
  const [data, setData] = useState<any>(null);

  // 初始化
  useEffect(() => {
    reportLifecycle(APP_ID, AppLifecycle.INIT);
    initVibeApp({ appId: APP_ID, appName: APP_NAME });
    loadData();
  }, []);

  // 监听 AI 动作
  useAgentActionListener(APP_ID, async (action) => {
    switch (action.action_type) {
      case 'DO_SOMETHING':
        await handleDoSomething(action.params);
        return 'success';
      default:
        return 'unknown_action';
    }
  });

  const loadData = async () => {
    // 读取应用数据
    const content = await fileApi.readFile('data.json');
    if (content) {
      setData(JSON.parse(content));
    }
  };

  const handleDoSomething = async (params: any) => {
    // 处理 AI 指令
    reportAction(APP_ID, 'DO_SOMETHING', params);
  };

  return (
    <div className={styles.container}>
      <h1>{DISPLAY_NAME}</h1>
      {/* 你的应用内容 */}
    </div>
  );
};

export default YourApp;
```

### 1.3 注册 APP

```typescript
// apps/webuiapps/src/lib/appRegistry.ts

const APP_STATIC_REGISTRY: AppStaticDef[] = [
  // ... 其他 APP
  {
    appId: 100,                          // 唯一ID
    appName: 'yourapp',                  // 路由名
    route: '/yourapp',                   // 路由路径
    displayName: '你的应用',              // 显示名称
    sourceDir: 'YourApp',                // 目录名
    icon: 'AppWindow',                   // Lucide 图标名
    color: '#4ecca3',                    // 主题色
    defaultSize: { width: 800, height: 600 },  // 默认窗口大小
    minSize: { width: 400, height: 300 },      // 最小尺寸
    maxSize: { width: 1200, height: 900 },     // 最大尺寸
    resizable: true,                     // 是否可调整大小
    singleton: false,                    // 是否单例
  },
];
```

### 1.4 添加到桌面

```typescript
// apps/webuiapps/src/components/Shell/index.tsx

// 在 DESKTOP_APPS_WITH_ICONS 数组中添加
const DESKTOP_APPS_WITH_ICONS = [
  // ... 其他 APP
  {
    appId: 100,
    IconComp: AppWindow,  // 从 lucide-react 导入
    displayName: '你的应用',
    color: '#4ecca3',
  },
];
```

---

## 二、外部项目模式（推荐用于独立开发）

### 2.1 适用场景

- 已有独立项目需要集成
- 需要完全独立的开发环境
- 团队并行开发
- 复杂应用（如 短篇/长篇/小说漫剧）

### 2.2 项目结构

```
D:\网站部署\chaowuqiong-project\
├── apps/webuiapps/              # 主桌面系统
├── 你的项目/                     # 独立项目
│   ├── index.html              # 入口文件（必需）
│   ├── css/
│   ├── js/
│   ├── assets/
│   └── ...
```

### 2.3 开发步骤

#### 步骤 1：创建独立项目

```html
<!-- 你的项目/index.html -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>你的应用</title>
  <link rel="stylesheet" href="./css/style.css">
</head>
<body>
  <div id="app">
    <!-- 你的应用内容 -->
  </div>
  <script src="./js/app.js"></script>
</body>
</html>
```

#### 步骤 2：创建包装组件

```typescript
// apps/webuiapps/src/pages/YourExternalApp/index.tsx
import React, { useRef, useState } from 'react';
import styles from './index.module.scss';

const YourExternalApp: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div className={styles.container}>
      {isLoading && (
        <div className={styles.loading}>
          <span>加载中...</span>
        </div>
      )}
      
      {hasError && (
        <div className={styles.error}>
          <span>加载失败，请刷新重试</span>
        </div>
      )}
      
      <iframe
        ref={iframeRef}
        src="./static/yourapp/index.html"  // 指向外部项目
        className={styles.iframe}
        title="你的应用"
        sandbox="allow-scripts allow-same-origin allow-forms"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
};

export default YourExternalApp;
```

```scss
// apps/webuiapps/src/pages/YourExternalApp/index.module.scss
.container {
  width: 100%;
  height: 100%;
  position: relative;
}

.iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.loading,
.error {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a2e;
  color: #fff;
}
```

#### 步骤 3：配置 Vite 静态服务

```typescript
// apps/webuiapps/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

function staticExternalPlugin(): PluginOption {
  const projectRoot = resolve(__dirname, '../../');
  const yourAppPath = resolve(projectRoot, '你的项目');

  return {
    name: 'static-external',
    configureServer(server) {
      server.middlewares.use('/static/yourapp', (req, res, next) => {
        const filePath = join(yourAppPath, req.url || 'index.html');
        // 静态文件服务逻辑
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), staticExternalPlugin()],
  // ...
});
```

#### 步骤 4：注册到系统

```typescript
// apps/webuiapps/src/lib/appRegistry.ts
{
  appId: 101,
  appName: 'yourexternalapp',
  route: '/yourexternalapp',
  displayName: '你的外部应用',
  sourceDir: 'YourExternalApp',  // 包装组件目录
  icon: 'ExternalLink',
  color: '#8B5CF6',
  defaultSize: { width: 1200, height: 800 },
}
```

#### 步骤 5：配置构建脚本

```json
// apps/webuiapps/package.json
{
  "scripts": {
    "copy-static": "node copy-static.js"
  }
}
```

```javascript
// apps/webuiapps/copy-static.js
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../../');
const distDir = path.join(__dirname, 'dist/static');

// 复制外部项目
const apps = ['你的项目'];
apps.forEach(app => {
  const src = path.join(srcDir, app);
  const dest = path.join(distDir, app.toLowerCase().replace(/\s/g, ''));
  if (fs.existsSync(src)) {
    fs.mkdirSync(dest, { recursive: true });
    fs.cpSync(src, dest, { recursive: true });
    console.log('Copied', src, 'to', dest);
  }
});
```

---

## 三、AI 集成（可选但推荐）

### 3.1 定义 Action Types

```typescript
// apps/webuiapps/src/pages/YourApp/actions/constants.ts
export const APP_ID = 100;
export const APP_NAME = 'yourapp';

export enum ActionTypes {
  OPEN_FILE = 'OPEN_FILE',
  SAVE_FILE = 'SAVE_FILE',
  CREATE_NEW = 'CREATE_NEW',
  EXPORT_DATA = 'EXPORT_DATA',
  // ... 更多动作
}
```

### 3.2 处理 AI 指令

```typescript
// apps/webuiapps/src/pages/YourApp/index.tsx
useAgentActionListener(APP_ID, async (action) => {
  switch (action.action_type) {
    case ActionTypes.OPEN_FILE:
      const content = await fileApi.readFile(action.params.filename);
      setData(JSON.parse(content));
      return { success: true, data: content };
      
    case ActionTypes.SAVE_FILE:
      await fileApi.writeFile(
        action.params.filename,
        JSON.stringify(action.params.data)
      );
      return { success: true };
      
    default:
      return { success: false, error: 'Unknown action' };
  }
});
```

### 3.3 向 AI 报告状态

```typescript
// 报告用户操作
reportAction(APP_ID, 'USER_SAVED', { filename: 'data.json' });

// 报告生命周期
reportLifecycle(APP_ID, AppLifecycle.READY);
reportLifecycle(APP_ID, AppLifecycle.CLOSING);
```

---

## 四、完整示例：WebChat APP

### 4.1 目录结构

```
apps/webuiapps/src/pages/WebChat/
├── index.tsx
├── index.module.scss
├── types.ts
├── components/
│   ├── ChatList/
│   ├── ChatWindow/
│   └── MessageInput/
├── hooks/
│   └── useWebSocket.ts
└── actions/
    ├── constants.ts
    └── handlers.ts
```

### 4.2 核心实现

```typescript
// apps/webuiapps/src/pages/WebChat/index.tsx
import React, { useState, useEffect } from 'react';
import { initVibeApp } from '@gui/vibe-container';
import { useAgentActionListener, createAppFileApi } from '@/lib';
import { ChatList } from './components/ChatList';
import { ChatWindow } from './components/ChatWindow';
import { MessageInput } from './components/MessageInput';
import { APP_ID, APP_NAME, ActionTypes } from './actions/constants';
import styles from './index.module.scss';

const fileApi = createAppFileApi(APP_NAME);

const WebChat: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    initVibeApp({ appId: APP_ID, appName: APP_NAME });
    loadChats();
  }, []);

  // AI 动作监听
  useAgentActionListener(APP_ID, async (action) => {
    switch (action.action_type) {
      case ActionTypes.SEND_MESSAGE:
        await handleSendMessage(action.params.content);
        return 'success';
      case ActionTypes.CREATE_CHAT:
        await handleCreateChat(action.params.name);
        return 'success';
      default:
        return 'unknown_action';
    }
  });

  const loadChats = async () => {
    const data = await fileApi.readFile('chats.json');
    if (data) setChats(JSON.parse(data));
  };

  const handleSendMessage = async (content: string) => {
    // 发送消息逻辑
  };

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <ChatList chats={chats} onSelect={setCurrentChat} />
      </aside>
      <main className={styles.main}>
        {currentChat ? (
          <>
            <ChatWindow messages={messages} />
            <MessageInput onSend={handleSendMessage} />
          </>
        ) : (
          <div className={styles.empty}>选择一个聊天</div>
        )}
      </main>
    </div>
  );
};

export default WebChat;
```

### 4.3 注册

```typescript
// apps/webuiapps/src/lib/appRegistry.ts
{
  appId: 102,
  appName: 'webchat',
  route: '/webchat',
  displayName: '网络聊天',
  sourceDir: 'WebChat',
  icon: 'MessageCircle',
  color: '#10b981',
  defaultSize: { width: 900, height: 600 },
}
```

---

## 五、部署流程

### 5.1 开发环境

```bash
# 1. 启动主系统
cd apps/webuiapps
npm run dev

# 2. 开发你的 APP
# 在 src/pages/YourApp/ 中开发

# 3. 实时预览
# 在桌面双击你的 APP 图标
```

### 5.2 生产构建

```bash
# 构建主系统
cd apps/webuiapps
npm run build

# 构建输出
dist/
├── index.html
├── assets/
│   ├── index-*.js
│   └── ...
└── static/           # 外部项目
    ├── long/
    ├── short/
    ├── novel/
    └── yourapp/
```

### 5.3 部署到服务器

```bash
# 复制到服务器
scp -r dist/* root@your-server:/var/www/chaowuqiong/webui/

# 重启后端（如果需要）
ssh root@your-server "pm2 restart license-backend"
```

---

## 六、最佳实践

### 6.1 文件存储

```typescript
// 使用应用隔离的文件 API
const fileApi = createAppFileApi(APP_NAME);

// 读取
const data = await fileApi.readFile('data.json');

// 写入
await fileApi.writeFile('data.json', JSON.stringify(data));

// 列出文件
const files = await fileApi.listFiles();
```

### 6.2 状态管理

```typescript
// 使用 React hooks
const [state, setState] = useState<AppState>(initialState);

// 使用 useCallback 优化性能
const handleAction = useCallback((params) => {
  // 处理逻辑
}, [deps]);
```

### 6.3 样式规范

```scss
// 使用 CSS Modules
.container {
  width: 100%;
  height: 100%;
  display: flex;
  background: #1a1a2e;
  color: #fff;
}

// 适配窗口大小
.content {
  flex: 1;
  overflow: auto;
}
```

### 6.4 错误处理

```typescript
try {
  const result = await someAsyncOperation();
} catch (error) {
  console.error('操作失败:', error);
  // 显示错误提示
  showErrorToast('操作失败，请重试');
}
```

---

## 七、参考项目

### 7.1 简单 APP 示例

- `Alarm/` - 闹钟（基础组件）
- `Notes/` - 笔记（文件操作）
- `Drawing/` - 画板（Canvas）

### 7.2 复杂 APP 示例

- `MusicApp/` - 音乐播放器（完整功能）
- `Chess/` - 国际象棋（3D渲染）
- `CodeEditor/` - 代码编辑器（Monaco）

### 7.3 外部项目示例

- `LongBook/` - 长篇创作（iframe包装）
- `ShortBook/` - 短篇创作（iframe包装）
- `NovelComics/` - 小说漫剧（iframe包装）

---

## 八、快速开始模板

```bash
# 1. 复制模板
cp -r apps/webuiapps/src/pages/Notes apps/webuiapps/src/pages/MyApp

# 2. 修改配置
# 编辑 apps/webuiapps/src/pages/MyApp/actions/constants.ts
# 修改 APP_ID、APP_NAME

# 3. 注册到系统
# 编辑 apps/webuiapps/src/lib/appRegistry.ts
# 添加你的 APP 配置

# 4. 添加到桌面
# 编辑 apps/webuiapps/src/components/Shell/index.tsx
# 添加到 DESKTOP_APPS_WITH_ICONS

# 5. 开发你的功能
# 编辑 apps/webuiapps/src/pages/MyApp/index.tsx

# 6. 运行测试
npm run dev
```

---

## 九、总结

| 开发模式 | 适用场景 | 集成深度 | 开发难度 |
|---------|---------|---------|---------|
| **内置 APP** | 新功能、深度集成 | 高 | 中 |
| **外部项目** | 已有项目、复杂应用 | 中 | 低 |

**推荐选择**：
- 新功能开发 → **内置 APP 模式**
- 已有项目集成 → **外部项目模式**

这套架构的优势：
1. **模块化** - 每个 APP 独立开发
2. **可扩展** - 轻松添加新功能
3. **AI原生** - 内置 AI 集成支持
4. **桌面体验** - 类操作系统交互
