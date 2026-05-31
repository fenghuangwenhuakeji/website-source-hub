# 导出整本正文 TXT 功能设计 Spec

> 本 spec 只规划，不修改现有代码。后续实现前应再写 implementation plan。

**目标：** 在不改变现有“导出工程”功能行为的前提下，为导出入口增加一个下拉菜单，并新增“导出整本正文 TXT”能力。

**设计原则：**

- 原“导出工程”仍然可用，输出内容、文件名、Markdown 格式、下载逻辑、可选阅读库导出逻辑均保持不变。
- 新功能只导出当前项目的章节正文，不包含世界观、实体库、细纲库、正文库补充、融合拆书弹药。
- 新增 UI 尽量小，不打断执笔台写作主流程。
- TXT 导出必须按当前项目隔离，不能混入其他项目章节。

---

## 1. 当前代码背景

### 1.1 现有入口

当前有两个活跃“导出工程”入口：

1. 执笔台顶部工具栏  
   文件：`assets/js/modules_split/writer/writer_core.js`  
   当前按钮文案：`导出工程`  
   当前调用：`Modules.world_engine?.exportAll?.()`

2. 世界引擎左侧底部  
   文件：`assets/js/modules_split/world/world_core.js`  
   当前按钮文案：`一键导出工程`  
   当前调用：`Modules.world_engine.exportAll()`

### 1.2 现有实现

真正实现位于：

`assets/js/modules_split/world/world_graph.js`

该文件通过：

```js
Object.assign(Modules.world_engine, {
  exportAll: async () => { ... }
})
```

为 `Modules.world_engine` 增加 `exportAll()`。

现有 `exportAll()` 会生成 Markdown，包含世界引擎、实体库、循环、细纲、正文、融合拆书弹药等完整工程内容，并通过 `Utils.download()` 下载。

### 1.3 下载基础设施

下载函数位于：

`assets/js/core/utils.js`

现有接口：

```js
Utils.download(filename, text, mime = 'text/markdown;charset=utf-8')
```

新增 TXT 导出应复用这个下载函数，并传入：

```js
mime = 'text/plain;charset=utf-8'
```

---

## 2. 用户体验设计

### 2.1 入口形态

把当前单按钮“导出工程”升级为“导出下拉按钮”。

推荐形态：

```text
[ 导出工程 ▾ ]
```

点击后展开菜单：

```text
导出工程 Markdown
导出整本正文 TXT
```

### 2.2 默认行为

为了不改变原有使用习惯：

- 点击按钮主体时，仍执行原来的 `Modules.world_engine.exportAll()`。
- 点击右侧下拉箭头时，才展开菜单。

如果实现上做分裂按钮成本较高，可以接受整个按钮点击展开菜单，但菜单第一项必须是“导出工程 Markdown”，且调用原 `exportAll()`。

### 2.3 菜单文案

执笔台入口建议：

- 主按钮：`导出工程`
- 菜单项 1：`导出工程 Markdown`
- 菜单项 2：`导出整本正文 TXT`

世界引擎入口建议：

- 主按钮：`一键导出工程`
- 菜单项 1：`导出工程 Markdown`
- 菜单项 2：`导出整本正文 TXT`

### 2.4 空状态提示

没有活动项目时：

```text
请先创建或选择一个项目
```

当前项目没有章节时：

```text
当前项目暂无章节正文可导出
```

当前项目有章节但全部没有正文时：

```text
当前项目章节暂无正文内容
```

---

## 3. 新增功能：导出整本正文 TXT

### 3.1 功能定义

导出当前项目下所有章节的正文，生成一个 `.txt` 文件。

不导出：

- 世界观设定
- 实体库
- 关系图谱
- 分层循环
- 章节细纲
- 细纲库补充
- 正文库补充
- 融合拆书弹药
- RAG 上下文
- 记忆系统内容
- API 配置

### 3.2 数据来源

主要数据源：

- `GenesisCore.getActiveProject()`
- `DB.getAll('chapters')`
- 可选：`DB.getAll('volumes')`

章节必须用当前项目过滤：

```js
GenesisCore.filterProjectItems(chapters, activeProject.id)
```

卷也必须用当前项目过滤：

```js
GenesisCore.filterProjectItems(volumes, activeProject.id)
```

### 3.3 排序规则

章节排序优先级：

1. `chapter.order`
2. `chapter.number`
3. `chapter.createdAt`
4. `chapter.id`

卷排序优先级：

1. `volume.order`
2. `volume.createdAt`
3. `volume.id`

如果章节有 `volumeId`，TXT 中按卷分组。

如果没有卷，直接按章节顺序导出。

### 3.4 TXT 内容格式

推荐格式：

```text
《项目名》

导出时间：2026/5/14 16:42:00
章节数：12
正文字数：34567

============================================================

第一卷 卷名

第1章 章节标题

正文内容……


第2章 章节标题

正文内容……

============================================================

第二卷 卷名

第3章 章节标题

正文内容……
```

如果没有卷：

```text
《项目名》

导出时间：2026/5/14 16:42:00
章节数：12
正文字数：34567

============================================================

第1章 章节标题

正文内容……


第2章 章节标题

正文内容……
```

### 3.5 文件名格式

推荐：

```text
项目名_整本正文_YYYY-MM-DD.txt
```

文件名需要清理 Windows 不允许的字符：

```text
\ / : * ? " < > |
```

示例：

```text
我的长篇_整本正文_2026-05-14.txt
```

如果项目名为空：

```text
未命名项目_整本正文_2026-05-14.txt
```

---

## 4. 建议新增接口

### 4.1 新方法位置

推荐放在：

`assets/js/modules_split/world/world_graph.js`

原因：

- 当前 `exportAll()` 已在这里实现。
- 新功能属于导出能力扩展，和 `exportAll()` 同域。
- 不需要创建新模块。

建议新增：

```js
Modules.world_engine.exportNovelTxt()
```

或在 `Object.assign(Modules.world_engine, {...})` 中新增：

```js
exportNovelTxt: async () => { ... }
```

### 4.2 推荐辅助方法

为了避免 `exportAll()` 继续膨胀，建议拆出纯辅助函数：

```js
_getCurrentProjectExportScope()
```

职责：

- 获取 active project。
- 读取 volumes/chapters。
- 按项目过滤。
- 排序。
- 返回 `{ project, volumes, chapters }`。

```js
_buildNovelTxt(project, volumes, chapters)
```

职责：

- 将当前项目正文拼成 TXT 字符串。
- 不读 DB。
- 不下载文件。
- 不修改状态。

```js
_safeExportFilename(name)
```

职责：

- 清理文件名非法字符。
- 处理空项目名。

这些辅助方法不是必须，但推荐加入，便于测试和后续扩展 EPUB/DOCX。

---

## 5. UI 改动范围

### 5.1 执笔台

文件：

`assets/js/modules_split/writer/writer_core.js`

当前按钮：

```html
<button ... onclick="Modules.world_engine?.exportAll?.()" ...>导出工程</button>
```

规划改为：

```text
导出工程 split/dropdown 控件
```

行为：

- 原主操作调用 `Modules.world_engine?.exportAll?.()`。
- 新菜单项调用 `Modules.world_engine?.exportNovelTxt?.()`。

### 5.2 世界引擎

文件：

`assets/js/modules_split/world/world_core.js`

当前按钮：

```html
<button ... onclick="Modules.world_engine.exportAll()">一键导出工程</button>
```

规划改为：

```text
一键导出工程 split/dropdown 控件
```

行为：

- 原主操作调用 `Modules.world_engine.exportAll()`。
- 新菜单项调用 `Modules.world_engine.exportNovelTxt()`。

### 5.3 菜单关闭规则

菜单关闭条件：

- 点击菜单项后关闭。
- 点击菜单外区域关闭。
- 按 Escape 关闭。
- 切换模块后不应残留菜单。

最小实现可以用内联 `onclick` 和一个小的 `Modules.world_engine.toggleExportMenu(source)`，保持项目现有风格。

---

## 6. 非目标

本次不做：

- 不修改现有 Markdown 工程导出的内容。
- 不把 TXT 导出并入 `exportAll()`。
- 不新增 JSON 工程包。
- 不新增 EPUB/DOCX。
- 不新增导出预览弹窗。
- 不重构 `exportAll()` 的历史项目串数据问题，除非实现 TXT 时只对新方法做项目过滤。
- 不处理 `ContextHelper` 是否存在的问题。
- 不改 DB schema。
- 不改阅读中心。

---

## 7. 兼容性要求

### 7.1 保持原功能

以下行为必须保持：

- 执笔台点击“导出工程”仍可导出原 Markdown 工程。
- 世界引擎点击“一键导出工程”仍可导出原 Markdown 工程。
- 原 `Modules.world_engine.exportAll()` 函数名不变。
- 原 Markdown 文件名规则不变。
- 原 `Utils.download()` 调用方式不变。

### 7.2 新功能失败不影响旧功能

如果 `exportNovelTxt()` 出错：

- 不影响 `exportAll()`。
- 不改动任何 DB 数据。
- 只显示 toast 错误提示。

---

## 8. 验收标准

### 8.1 基础验收

- 执笔台可看到导出下拉入口。
- 世界引擎可看到导出下拉入口。
- 原“导出工程 Markdown”仍下载 `.md`。
- 新“导出整本正文 TXT”下载 `.txt`。

### 8.2 数据验收

- TXT 只包含当前项目章节正文。
- TXT 不包含章节细纲。
- TXT 不包含世界观和实体库。
- TXT 不包含其他项目章节。
- 空正文章节可以显示章节标题，但不输出“无正文”占位到正文内容中。

### 8.3 顺序验收

- 有卷时按卷顺序，再按章节顺序。
- 无卷时按章节顺序。
- 章节标题格式稳定：`第N章 标题`。

### 8.4 回归验收

- 原 Markdown 工程导出仍能下载。
- 导出 TXT 后，当前章节编辑内容不被修改。
- 导出 TXT 后，世界引擎实体不被修改。
- 控制台无未捕获错误。

---

## 9. 手工测试清单

1. 创建或选择项目 A。
2. 在项目 A 建 2 卷 3 章，每章写入不同正文。
3. 从执笔台下拉菜单选择“导出整本正文 TXT”。
4. 检查下载文件名包含项目名和日期。
5. 打开 TXT，确认正文顺序正确。
6. 确认 TXT 不包含细纲、实体、世界观。
7. 从执笔台下拉菜单选择“导出工程 Markdown”。
8. 确认原 `.md` 工程导出仍正常。
9. 切换到项目 B，创建 1 章正文。
10. 导出项目 B TXT，确认没有项目 A 的正文。
11. 打开世界引擎，从下拉菜单导出 TXT，结果与执笔台一致。

---

## 10. 自审结果

- 占位扫描：无 `TBD`、`TODO`、`稍后实现` 等占位。
- 范围检查：本 spec 聚焦单一功能，即导出入口下拉和整本正文 TXT。
- 兼容检查：明确保留 `exportAll()` 及原 Markdown 行为。
- 数据边界检查：新 TXT 导出强制当前项目过滤。
- 风险检查：标明 `_ensureCache()` 和 `exportAll()` 的历史问题不在本次非目标内，避免误改旧功能。

