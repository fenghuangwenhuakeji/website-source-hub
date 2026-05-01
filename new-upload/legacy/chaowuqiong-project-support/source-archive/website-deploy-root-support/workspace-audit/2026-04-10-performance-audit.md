# 2026-04-10 性能审计

## 范围

- `D:\网站部署\fenghuang-unified`
- `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps`
- `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\web-manage`

## 当前结论

### A. `fenghuang-unified`

- 当前构建体积相对健康。
- `vendor` 约 `163 kB`，`api` 约 `117 kB`，路由级页面已经拆开。
- 这套站点性能上不是当前最大的瓶颈。

### B. `webuiapps`

- 当前是整个体系里最重的前端。
- 构建产物中存在超大 chunk：
  - `vendor-legacy` 约 `4053.85 kB`
  - `vendor` 约 `4196.24 kB`
  - `vendor-antd` 约 `282.85 kB`
  - `component-macosdesktop` 约 `113.13 kB`
  - `component-chatpanel` 约 `113.54 kB`
  - `vendor-editor` 约 `144.21 kB`
- CSS 也偏重：
  - `component-macosdesktop` 样式约 `86.02 kB`
  - 主样式约 `79.80 kB`
- 当前构建明确提示：
  - 存在 `circular chunk: vendor-antd -> vendor -> vendor-antd`
  - `fileApi.ts` 既被动态导入又被静态导入，导致拆包失效
  - legacy 构建开启后，会额外产出一整套 legacy bundle

### C. `web-manage`

- 管理后台虽然已做 `lazy()`，但当前最终仍几乎落成一个大包：
  - `dist/assets/index-*.js` 约 `1090.37 kB`
- 说明现有路由懒加载没有充分形成稳定的分块收益，或者大部分依赖仍被压进单个共享 chunk。

## 高优先级性能问题

### P1. `webuiapps` 打包过重

证据：

- `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps\vite.config.ts`
- 构建日志显示 `vendor` 与 `vendor-legacy` 都超过 4 MB。

原因判断：

- 该项目同时加载桌面壳、聊天、编辑器、日记、WebChat、前端转换器等多个重模块。
- legacy 构建开启后会再生成一份大体积兼容包。
- `manualChunks` 当前没有把“应用级模块”切得更细。

建议：

1. 优先把 `MacOSDesktop`、`ChatPanel`、`CodeEditor`、`Diary`、`WebChat`、`frontend-converter` 做更明确的按应用拆包。
2. 为桌面应用列表改成“点击再加载应用模块”，不要在首屏就把全部能力打进主包。
3. 重新设计 `manualChunks`，避免形成巨型 `vendor`。
4. 评估 legacy 构建是否必须常开；如果只服务现代环境，可单独出兼容版而不是默认双份输出。

### P1. `fileApi` 拆包失效

证据：

- `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps\src\hooks\useFileSystem.ts`
- `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps\src\lib\FileSystemStore.ts`
- `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps\src\lib\index.ts`

原因判断：

- `FileSystemStore.ts` 用了 `await import('./fileApi')`
- 但 `useFileSystem.ts` 和 `lib/index.ts` 又静态导入了 `fileApi`
- 结果是 Vite 无法把它真正移到独立 chunk

建议：

1. 把 `batchConcurrent` 从 `fileApi.ts` 抽到独立轻模块。
2. 保证 `fileApi.ts` 要么只静态导入，要么只动态导入，不混用。
3. 若必须混用，则拆成：
   - `fileApi-core.ts`
   - `fileApi-runtime.ts`
   - `fileApi-batch.ts`

### P1. `web-manage` 路由拆包收益不足

证据：

- `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\web-manage\src\App.tsx`
- 构建结果 `index-*.js` 约 `1090.37 kB`

原因判断：

- 虽然页面组件走了 `lazy()`，但 `antd`、图表、表格、共享页面依赖和布局仍可能进入单一主 chunk。

建议：

1. 检查 `vite.config.ts` 的 `manualChunks` 是否过度合并。
2. 把图表页、复杂表格页拆成更明确的业务 chunk。
3. 对 `dashboard / users / orders / referrals / exchange-products` 做页面级依赖隔离。

## 中优先级性能问题

### P2. 写作中心每次输入都同步写入 localStorage

证据：

- `D:\网站部署\fenghuang-unified\src\components\writing\WritingWorkbench.tsx`
- `D:\网站部署\fenghuang-unified\src\utils\localWriting.ts`

原因判断：

- `updateProject()` 每次输入都调用 `commit()`
- `commit()` 立即 `saveWritingProjects()`
- `saveWritingProjects()` 走 `window.localStorage.setItem(JSON.stringify(...))`

影响：

- 长文输入时会频繁同步序列化整个项目数组
- 手机端更容易出现输入卡顿

建议：

1. 给保存加 `300ms - 800ms` debounce。
2. 只在 `projects` 稳定后批量写入。
3. 长内容可考虑按 `projectId` 分片存储，而不是整数组整体覆盖。

### P2. `webuiapps` 仍保留大量 legacy Sass 旧 API

证据：

- `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps\src\components\MacOSDesktop\index.module.scss`
- 构建日志出现大量 `lighten()`、`darken()`、legacy JS API warning

建议：

1. 批量迁移到 `color.adjust()` / `color.scale()`
2. 统一 Sass 新 API，减少构建噪音并降低后续升级成本

## 低优先级优化点

### P3. `fenghuang-unified` 可继续细化缓存边界

建议：

- 保持当前 lazy page 方案即可
- 后续如接入更重的创作功能，可把写作中心的素材库、导出、预览能力继续懒加载

## 推荐执行顺序

1. 先做 `webuiapps` 的 `manualChunks + 应用级懒加载`
2. 再处理 `fileApi` 的动态/静态混用
3. 再收 `web-manage` 的页面 chunk 拆分
4. 最后优化写作中心 localStorage 持久化节流

## 最小执行方案

### 第一阶段

- 目标：先把最大包降下来
- 执行：
  - 调整 `webuiapps/vite.config.ts`
  - 把 `MacOSDesktop` 内的重应用改成动态加载
  - 让 `CodeEditor / ChatPanel / Diary / WebChat` 不进首屏主包

### 第二阶段

- 目标：减少无效拆包和重复依赖
- 执行：
  - 重构 `fileApi.ts` 依赖边界
  - 清理 circular chunk

### 第三阶段

- 目标：提升后台与写作体验
- 执行：
  - 拆 `web-manage` 大包
  - 给写作中心加持久化 debounce
