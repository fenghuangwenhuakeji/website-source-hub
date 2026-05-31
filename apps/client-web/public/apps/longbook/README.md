# WriterCenter Archon - 重构版

## 简介
这是基于标准软件开发范式重构的写作中心。采用了组件化架构，并针对移动端进行了深度适配。

## 架构说明
- `core/`: 核心逻辑 (App, EventBus, Store)
- `systems/`: 业务系统 (Editor, Storage)
- `ui/`: 界面管理 (Layout, UI Manager)
- `assets/`: 静态资源

## 移动端适配
- 采用了 Bottom Navigation (底部导航) 模式。
- 自动检测设备类型，在 PC 三栏布局和 Mobile 单栏视图间切换。

## 安装说明
1. 请将原项目中的 `assets/` 文件夹内的第三方库 (marked, echarts等) 复制到本项目的 `assets/libs/` 目录下（如果需要使用相关功能）。
2. 直接在浏览器打开 `index.html` 即可运行。