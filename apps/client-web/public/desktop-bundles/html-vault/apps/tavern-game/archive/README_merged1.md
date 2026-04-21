# AI酒馆 - 行业TOP1旗舰版 (重构版)

本项目是基于原单文件 HTML 的模块化重构版本，采用标准 Web 开发范式，实现了结构、表现与行为的分离。

## 目录结构

- `index.html`: 应用入口，仅包含 DOM 结构和资源引用。
- `css/`: 样式资源
  - `style.css`: 所有 UI 样式定义。
- `js/`: JavaScript 源码
  - `data/`: 静态配置数据
    - `scripts.js`: 剧本库数据
    - `achievements.js`: 成就数据
    - `skills.js`: 技能树数据
  - `core/`: 核心基础设施
    - `db.js`: IndexedDB 数据库封装
    - `api.js`: API 流量池与网络请求管理
  - `game/`: 游戏业务逻辑
    - `state.js`: 全局状态管理 (Player, Inventory, Stats)
    - `logic.js`: 游戏循环、行动处理、存档管理
  - `ui/`: 界面交互
    - `render.js`: 视图渲染函数
    - `main.js`: 程序入口、事件监听、初始化

## 运行方式

直接在浏览器中打开 `index.html` 即可运行，无需构建工具。