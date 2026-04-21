# Desktop App Standard

## Goal

所有桌面应用统一走同一个接口，不再区分：

- 内建 React 组件应用
- 历史遗留前端应用
- 通过 Converter 导入的 HTML / CSS / JS / TS 应用
- 已经构建好的静态站应用目录

统一链路：

`frontend source or static bundle -> DesktopAppDefinition -> desktop registry -> desktop icon -> window host`

## Core Type

统一类型定义位置：

- `src/types/desktopApp.ts`

关键字段：

- `kind`: `system | special | legacy | generated`
- `runtime`: `component | generated-web | static-web`
- `componentKey`: 内建组件应用使用
- `bundle`: Converter 生成应用使用
- `route`: 静态站应用入口地址使用

## Runtime

### 1. Component Runtime

适用于直接挂载的 React 组件，例如：

- Finder
- Terminal
- Settings
- Chat
- Agents
- Frontend Converter
- Diary

### 2. Generated Web Runtime

适用于 Converter 生成的前端应用：

- 单文件 `index.html`
- `HTML + CSS + JS`
- `HTML + CSS + TS`
- 原生模块入口 `main.ts / main.js`

运行方式：

- 先构造成 `bundle.html`
- 再通过 `iframe srcDoc` 承载

### 3. Static Web Runtime

适用于已经是完整静态站目录的应用：

- 原始静态网页目录
- Vite / Webpack / 其他构建工具产出的 `dist`
- 带图片、字体、分块 JS、移动端样式的完整前端包

运行方式：

- 将目录放入 `public/desktop-bundles/<app-id>`
- 桌面通过 `iframe src` 打开 `index.html`

## Storage Layout

已安装的生成应用仍存储在会话仓库：

- `desktop-apps/registry.json`
- `desktop-apps/apps/<appId>/manifest.json`

静态目录应用由项目资源提供：

- `public/desktop-bundles/<app-id>/...`

## Current Imported Apps

本轮已接入：

- `Agent创作`
- `CodeEditor`
- `短篇拆书版`
- `凤煌创世合集早期版`

其中：

- `Agent创作` 替换原 `webChat`
- `CodeEditor` 替换原 `codeEditor`

## Next Iterations

建议后续继续补强：

1. 做成批量打包脚本或可视化导入器
2. 支持从本地目录一键生成 `static-web` 应用 definition
3. 支持版本升级与回滚
4. 支持更细的权限声明与沙箱策略
