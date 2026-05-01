# 移动端适配与重构说明

## 1. 核心变更
- **CSS 重构**: 废弃了部分内联样式，转为使用 `css/main.css` (核心样式) 和 `css/mobile.css` (移动端适配)。
- **HTML 结构**: 在 `index.html` 中添加了 `.sidebar-overlay` 和 `.mobile-menu-toggle` 以支持移动端抽屉式导航。
- **交互逻辑**: 新增 `js/ui/mobile-sidebar.js`，处理触控事件、遮罩层点击及手势操作。

## 2. 移动端特性
- **抽屉式侧边栏**: < 768px 屏幕下，侧边栏默认隐藏，通过汉堡菜单或边缘右滑呼出。
- **触控优化**: 按钮点击热区扩大至 44px+，移除点击高亮 (`-webkit-tap-highlight-color: transparent`)。
- **手势支持**: 支持左滑关闭侧边栏，边缘右滑打开侧边栏。

## 3. 开发指南
- 修改样式请优先编辑 `css/main.css` 中的 CSS 变量。
- 移动端特定样式请在 `css/mobile.css` 中修改。
