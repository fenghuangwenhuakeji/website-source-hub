# 创世纪长篇项目 SPEC 与优化审计

生成日期：2026-05-14  
项目目录：`F:\长篇修改专用项目文件夹\长篇`  
分析范围：`index.html`、`assets/js/core`、`assets/js/modules`、`assets/js/modules_split`、`css`、`assets/css`、`README*`、`versions/*`。已排除 `backups` 作为运行主链路，但把其中暴露的旧版重复文件作为维护风险记录。

## 0. 总结

这是一个本地优先的长篇小说创作工作台。它不是单一写作器，而是把“开书、拆书、导入续写、世界观、章节执笔、RAG、记忆、阅读、网页对话、工具流、设置和移动端”揉成一个静态前端应用。当前最核心的产品价值是：围绕一本书建立项目，把所有正文、细纲、世界设定、实体、拆书弹药和记忆都归到同一个项目下，让作者可以在写作、拆技法、查资料和续写之间来回切换。

当前最大风险不是功能缺失，而是工程边界太软：所有模块都在全局 `Modules`、`App`、`DB`、`GenesisCore` 下协作，脚本顺序和内联事件依赖很重。只要某个模块名、全局对象或 DOM id 不一致，就会在点击时才爆雷。

必须优先优化的点：

1. P0：移除或外置内嵌 API Key，当前 `assets/js/core/ai.js` 存在明文默认模型配置。
2. P0：明确授权体系边界，当前卡密密钥和会员逻辑都在客户端，不能当作真实防破解授权。
3. P1：补齐 `Navigation.show(...)` 兼容层，当前活跃文件里有调用但没有定义，点击相关入口会报错。
4. P1：修复项目管理页顶部遮挡点击问题，实测顶部栏元素会拦截“新建项目”等按钮点击。
5. P1：处理 Keep-Alive 隐藏 DOM 的副作用：重复文本、重复按钮、自动化定位混乱、可访问性噪声、内存累积。
6. P1：梳理 `modules/*_original.js` 旧文件，避免优化时改到未加载旧版。
7. P1：建立最小回归测试：进入应用、创建项目、三条路径入口、写作保存、RAG/记忆/设置打开、移动端导航。

## 1. 产品定位

### 1.1 一句话定位

创世纪长篇是一个面向网文/长篇作者的本地创作中枢：用项目隔离一本书，把创意、细纲、正文、世界观、拆书技法、记忆和 AI 上下文统一管理。

### 1.2 目标用户

- 从零开新书的作者：需要快速从一句话、题材、钩子、角色和细纲进入正文。
- 已有旧稿的作者：需要导入已有正文、解析结构、提取风格和人物，接着续写。
- 拆书学习型作者：需要从两本参考书里拆技法、节奏、钩子和循环，再转化成原创写作弹药。
- 重度 AI 写作用户：需要多模型、提示词管理、RAG、记忆、上下文注入、批量生成和诊断。
- 手机端随时改稿用户：需要低门槛移动端导航和单栏编辑体验。

### 1.3 核心价值主张

- 一本书一个项目：正文、实体、细纲、拆书、记忆、RAG 统一归档。
- 三条创作路径：凤凰从零开书、导入续写、双书融合拆技法。
- 写作中枢：长篇执笔是最终事实来源，其他模块都服务于正文。
- 上下文中枢：世界引擎、RAG、三层记忆共同给 AI 输出提供约束。
- 本地优先：IndexedDB 加本地文件夹同步，适合私有创作素材。

## 2. 当前运行方式

### 2.1 应用形态

- 静态 HTML 应用，主入口是 `index.html`。
- 直接用浏览器打开 `file:///F:/长篇修改专用项目文件夹/长篇/index.html` 可以运行。
- 不依赖构建步骤。第三方库通过本地脚本标签加载。
- 数据主要存在 IndexedDB，部分设置和登录/会员状态存在 localStorage 或 SafeStorage。

### 2.2 实际加载顺序

`index.html` 先加载本地第三方库：

- `marked.min.js`
- `echarts.min.js`
- `jszip.min.js`
- `epub.min.js`
- `pdf.min.js`
- `vis-network.min.js`
- `3d-force-graph.min.js`
- `tailwindcss.js`

然后加载核心脚本：

- `assets/js/core/db.js`
- `assets/js/core/utils.js`
- `assets/js/core/ui.js`
- `assets/js/core/machine-id.js`
- `assets/js/core/license-core.js`
- `assets/js/core/user-manager.js`
- `assets/js/core/membership.js`
- `assets/js/core/ai.js`
- `assets/js/core/ai_multimodal.js`
- `assets/js/modules/theme_engine.js`
- `assets/js/modules/genesis_core.js`
- `assets/js/modules_split/core_path_hub.js`
- 各业务模块
- `assets/js/core/app.js`

这个顺序本身就是运行契约。任何模块拆分、懒加载或重命名都必须先处理全局依赖。

### 2.3 全局对象契约

| 全局对象 | 责任 | 当前风险 |
| --- | --- | --- |
| `App` | 应用初始化、导航、登录入口、顶部栏、移动菜单、进度日志 | `App.nav` 同时做路由、DOM 创建、模块初始化、移动端状态，职责偏重 |
| `Modules` | 所有页面模块注册表 | 无类型约束，名字拼错只能运行时发现 |
| `DB` | IndexedDB 封装、项目作用域写入 | store 迁移、项目过滤、同步写入耦合较重 |
| `LocalSync` | 本地文件夹/虚拟工作空间同步 | store 白名单和 DB store 不完全一致 |
| `GenesisCore` | 项目、模式、读者协议、路径协议、跨模块上下文 | 是产品中枢，应保留但需要更清晰的数据接口 |
| `AI` | API 池、模型配置、生成调用 | 明文默认 key、浏览器直连三方接口、CORS 和泄漏风险 |
| `MemorySystem` | 工作/会话/长期/永久记忆，上下文构建 | 存储混在 `settings`，需要迁移或 schema 化 |
| `RAGSystem` | 多源检索、文档索引、上下文预算 | 全量扫描 IndexedDB，数据多后性能会下降 |
| `UI` | toast、modal、dialog | `innerHTML` 拼接较多，需要统一转义策略 |

### 2.4 模块生命周期契约

每个模块通常注册为：

```js
Modules.xxx = {
  render() {},
  init() {},
  onShow() {}
}
```

`App.nav(mod)` 的行为：

1. 如果模块需要项目但当前没有活动项目，跳到 `project_manager`。
2. 设置 `App._currentModule`。
3. 高亮侧边栏。
4. 隐藏 `#viewport` 下所有已有模块视图。
5. 如果 `#module-view-${mod}` 不存在，创建 DOM 并写入 `Modules[mod].render()`。
6. 首次创建时执行 `Modules[mod].init()`。
7. 每次进入时执行 `Modules[mod].onShow()`。
8. 触发 resize，让图表、画布、移动端导航刷新。

优化含义：模块不能假设自己每次进入都会重新 render；很多状态会留在 DOM 里。后续做 bugfix 时要区分“首次 init”和“每次 onShow”。

## 3. 数据规格

### 3.1 IndexedDB

数据库名：`GenesisDB`  
当前版本：`14`

主要 store：

| Store | 用途 | 项目隔离 | 优化说明 |
| --- | --- | --- | --- |
| `projects` | 项目元数据、模式、进度、统计 | 否，项目本身是根 | 应建立 schema 版本和迁移记录 |
| `project_snapshots` | 项目快照/备份 | 否/按快照元数据 | 应增加恢复前预览 |
| `volumes` | 卷 | 是 | 需要和 chapters 的顺序、级联删除保持一致 |
| `chapters` | 章节正文、细纲、状态、标签 | 是 | 长文本编辑核心，需保存冲突保护 |
| `outlines` | 细纲、拆书结果、导入结构 | 是 | 类型很多，建议加 `kind` 枚举 |
| `writings` | 写作片段、流水线输出 | 是 | 和 chapters 边界需要明确 |
| `entities` | 人物、势力、地点、物品、伏笔等实体 | 是 | 需统一字段：name/type/desc/relations/source |
| `vectors` | 旧向量/检索降级数据 | 是 | 与 `rag_documents` 分工不清 |
| `rag_documents` | RAG 文档和分块来源 | 是 | 需项目过滤和索引重建策略 |
| `prompts` | 自定义提示词 | 否或混合 | 应区分全局提示词和项目提示词 |
| `tools_custom` | 自定义工具/工作流 | 否或混合 | 需要导入导出版本 |
| `assets` | 资源、素材、导入文件片段 | 否或混合 | 需清理孤儿资源 |
| `library_books` | 阅读中心书籍 | 是 | 大文本存储需分块或压缩 |
| `trading_strategies` | 遗留/泛工具数据 | 未明确 | 如果无用应迁移或隐藏 |
| `code_snippets` | 遗留/工具片段 | 未明确 | 同上 |
| `text_api_pool` | 文本模型 API 池 | 全局 | 高敏感，不能跟项目同步到不可信目录 |
| `parse_api_pool` | 解析模型 API 池 | 全局 | 同上 |
| `fusion_api_pool` | 拆书模型 API 池 | 全局 | 同上 |
| `image_api_pool` | 图像模型 API 池 | 全局 | 当前 LocalSync 白名单不含它 |
| `video_api_pool` | 视频模型 API 池 | 全局 | 当前 LocalSync 白名单不含它 |
| `audio_api_pool` | 音频模型 API 池 | 全局 | 当前 LocalSync 白名单不含它 |
| `settings` | 设置、记忆、工作流等杂项 | 混合 | 需要拆分命名空间 |
| `chat_sessions` | 网页对话会话 | 是 | 附件和消息需大小限制 |
| `cycles` | 融合拆书循环 | 是 | 和弹药库、世界引擎强相关 |
| `file_system_handles` | 文件夹授权句柄 | 全局 | 浏览器兼容和权限过期要处理 |

### 3.2 项目隔离规则

`DB.put` 会给以下 store 自动补 `projectId`：

- `volumes`
- `chapters`
- `outlines`
- `writings`
- `entities`
- `vectors`
- `rag_documents`
- `library_books`
- `chat_sessions`
- `cycles`

风险：如果旧数据没有 `projectId`，当前兼容逻辑会把“无 projectId 的旧记录”视作属于当前项目。优化时需要先做一次旧数据归属确认，而不是直接强制过滤掉。

### 3.3 LocalSync 同步规则

`LocalSync.ALL_STORES` 包含：

- `volumes`
- `chapters`
- `outlines`
- `writings`
- `entities`
- `vectors`
- `rag_documents`
- `prompts`
- `tools_custom`
- `assets`
- `library_books`
- `text_api_pool`
- `parse_api_pool`
- `fusion_api_pool`
- `settings`
- `chat_sessions`
- `cycles`
- `projects`
- `project_snapshots`

`GLOBAL_STORES` 包含：

- `text_api_pool`
- `parse_api_pool`
- `fusion_api_pool`
- `image_api_pool`
- `video_api_pool`
- `audio_api_pool`
- `projects`
- `project_snapshots`

发现：`image_api_pool`、`video_api_pool`、`audio_api_pool` 在 DB store 和 GLOBAL_STORES 里存在，但不在 `ALL_STORES`。这意味着本地文件夹同步策略和数据库 schema 不完全对齐。

优化建议：把同步策略改为单一 schema 源，明确每个 store 的同步级别：

- `project`: 跟随项目文件夹。
- `global_sensitive`: 只本机保存，不导出到普通项目包。
- `global_exportable`: 可以随备份导出。
- `legacy`: 只读迁移。

## 4. 核心业务流程 SPEC

### 4.1 首次进入、登录、卡密、免费体验

当前流程：

1. 打开 `index.html`。
2. 显示登录/注册入口。
3. 用户可选择“不登录，直接免费体验”。
4. 进入卡密/免费体验层。
5. 免费体验给出本地 token 配额。
6. 进入创作中心首页。

功能细节：

- `UserManager` 管理本地用户。
- `Membership` 管理会员、配额、卡密激活。
- `LicenseCore` 负责卡密签名/解析。
- 顶部栏展示用户、配额、升级入口。

优化重点：

- 明确这只是本机体验门禁，不是安全授权。
- 登录/会员/卡密 UI 不应阻塞用户理解主流程。
- 免费体验与 API Key 计费边界需要文案说明。
- 会员 token 消耗应有可解释日志，用户知道哪次生成扣了多少。

### 4.2 项目管理

入口：`Modules.project_manager`  
核心文件：`assets/js/modules_split/project_manager/project_manager.js`

当前能力：

- 新建项目。
- 三种创作路径：从零写一本、导入新书/续写、拆书融合。
- 搜索项目。
- 按路径筛选。
- 按状态筛选：刚开始、资料就绪、大纲完成、写正文、已完结。
- 排序：最近动过、最新创建、字数最多、进度最远。
- 卡片/列表视图切换。
- 当前项目 banner。
- 阶段进度条。
- 下一步路由。
- 快照和项目状态维护。

数据：

- `projects`
- `project_snapshots`
- `localStorage.genesis_active_project`
- `GenesisCore._activeProjectId`

优化重点：

- P1：修复顶部栏遮挡点击，实测按钮被 `topMemberQuota` 相关区域拦截。
- 项目创建弹窗应支持“项目名、目标、路径、是否导入已有资料、默认 AI 池”。
- 删除项目必须显示会删除/保留哪些业务数据。
- 快照要能预览包含：章节、实体、拆书、记忆、RAG、设置。
- 切项目时提示未保存章节。

验收标准：

- 新用户 3 次点击内能创建第一个项目。
- 从项目卡片进入“继续下一步”永远不报错。
- 切换项目后，执笔台、世界引擎、RAG、记忆不显示其他项目数据。

### 4.3 GenesisCore 中枢

入口：`GenesisCore`  
核心文件：`assets/js/modules/genesis_core.js`

当前能力：

- 三条路径配置：`phoenix`、`import`、`fusion`。
- 每条路径定义 label、icon、color、阶段、入口模块、默认数据结构、功能标签。
- 项目创建、更新、删除、激活、继续写作。
- 读者服务协议：路人、饥民、熟客、共谋、上瘾者。
- 写作与融合拆书协议：写作和拆书可交替，用户手写内容是源事实。
- 构建读者上下文和工作流上下文。
- 同步项目状态、统计、世界/执笔台关联。

优化重点：

- 把 `MODE_CONFIG` 视作产品 schema，不要散落复制。
- 项目状态要从字符串变成受控枚举。
- `modeData` 要带版本号，便于后续迁移。
- `buildReaderContext` 和 `buildWorkflowContext` 可以作为 AI Prompt 的系统层，不应每个模块各写一份。

### 4.4 凤凰创作流

入口：`Modules.phoenix`  
核心文件：

- `assets/js/modules_split/phoenix/phoenix_core.js`
- `phoenix_step1.js`
- `phoenix_step2.js`
- `phoenix_ai.js`
- `phoenix_finish.js`

当前能力：

- 从零开书。
- 一句话开书。
- 题材/路径预设。
- 创意模板、钩子模板。
- 读者协议注入。
- 世界设定、角色、冲突、卖点、节奏生成。
- 细纲生成、续写、优化。
- 从细纲解析卷章。
- 实体提取。
- 同步世界引擎。
- 同步执笔台。
- 同步 RAG/记忆。

功能环节：

1. 输入种子：一句话、题材、目标读者、核心爽点。
2. 扩展创意：主角、欲望、阻力、代价、金手指/规则。
3. 生成细纲：按卷/章/节奏点生成。
4. 检查读者契约：前三章、钩子、缺口、兑现。
5. 提取实体：角色、势力、地点、规则、伏笔。
6. 入世界引擎：结构化 worldSetting/timeline/entities。
7. 入执笔台：生成 volumes/chapters/outlines。
8. 后续写作：跳到 writer。

优化重点：

- “一句话开书”和“细纲定稿”之间需要保存草稿版本，避免一次生成覆盖。
- 细纲解析要提供人工确认表格。
- 每章细纲应固定字段：读者期待、读者恐惧、冲突、转折、钩子、需要回收的伏笔。
- 实体提取结果应先进入待确认池，再写入正式实体库。
- 从凤凰同步到执笔台后，应能回溯源 prompt 和生成时间。

### 4.5 导入新书/续写

入口：`world_engine` 里的导入功能，以及 `GenesisCore` 的 `import` 模式  
核心文件：

- `assets/js/modules_split/world/world_import.js`
- `assets/js/modules_split/world/world_novel_import.js`

当前能力：

- 导入已有小说/设定。
- 章节识别。
- 结构解析。
- 原文字数和章节统计。
- 提取实体、世界观、风格指纹。
- 生成续写细纲。
- 把旧文保留，把续写点写入执笔台。

功能环节：

1. 选择或粘贴原文。
2. 自动识别章节标题。
3. 解析章节列表和正文。
4. 生成导入摘要。
5. 提取人物、关系、地点、势力、规则、未回收伏笔。
6. 识别续写断点。
7. 生成后续细纲。
8. 同步到世界引擎、RAG、执笔台。

优化重点：

- 章节识别需要可视化纠错。
- 导入正文不应被 AI 改写，必须标记为“原文锁定”。
- 续写前应强制展示“继承事实清单”：人物已知、世界规则、未回收伏笔、禁改项。
- 风格指纹要保存到项目，不只存在临时状态。

### 4.6 长篇执笔

入口：`Modules.writer`  
核心文件：

- `assets/js/modules_split/writer/writer_core.js`
- `writer_tree.js`
- `writer_ai.js`
- `writer_batch.js`
- `writer_panel.js`
- `writer_rag.js`
- `writer_review.js`
- `writer_consistency.js`
- `writer_rhythm.js`

当前能力：

- 项目门禁：没有活动项目时跳项目管理。
- 卷/章树。
- 新建卷、新建章。
- 章节筛选：全部、待写、草稿、完成、已润色。
- 批量移动、批量改状态、批量删除。
- 编辑正文和章节细纲。
- 保存。
- AI 续写。
- 润色。
- 风格锁。
- RAG 注入。
- 融合技法注入。
- NEXUS/读者协议/工作流上下文注入。
- 导出到阅读中心。
- 同步世界引擎。
- 上下文 tab、文风 tab、助手 tab、诊断 tab。
- 节奏、审稿、人物一致性检查。

功能环节：

1. 选择章节。
2. 加载标题、正文、细纲、状态、标签、字数。
3. 编辑正文。
4. 手动保存或自动保存。
5. 从当前章构建 AI 上下文。
6. 选择续写长度：短/中/长。
7. 选择约束：风格锁、RAG、融合。
8. 调用 AI 续写。
9. 写入正文或附加到当前位置。
10. 同步章节事实到世界引擎。
11. 运行诊断/节奏/一致性检查。
12. 标记状态。

优化重点：

- 保存需要防抖和冲突提示：切章节、切项目、关闭页面前都要兜底。
- AI 续写应提供“插入/替换/另存草稿”三种模式。
- 批量自动写正文必须支持暂停、恢复、失败重试、失败章节列表。
- 右侧面板字段多，建议固定为“章节事实、AI上下文、质量检查、设置”四组。
- 文风锁应显示当前锁定来源：原文、当前项目、用户自定义、某本参考书。
- 人物一致性检查要输出可执行修复建议，而不是只给长评。

验收标准：

- 章节树不会因批量操作丢顺序。
- 任意 AI 失败不破坏当前正文。
- 同一项目 100 章以上仍能流畅切换。
- 进入 writer 后不泄漏其他项目章节。

### 4.7 世界引擎

入口：`Modules.world_engine`  
核心文件：

- `assets/js/modules_split/world/world_core.js`
- `world_dashboard.js`
- `world_graph.js`
- `world_chapters.js`
- `world_import.js`
- `world_novel_import.js`
- `world_pipeline.js`

当前能力：

- 世界观仪表盘。
- 时间线。
- 势力。
- 地理/规则/能力体系。
- 伏笔。
- 情绪与节奏。
- 章节关联。
- 从流水线或正文提取实体。
- 3D 知识图谱。
- 图谱控件。
- 导出工程。
- 为写作构建结构化注入包。

功能环节：

1. 从项目 modeData、entities、chapters、cycles 读取信息。
2. 整理成世界上下文。
3. 图谱展示实体关系。
4. 从章节或拆书结果提取新实体。
5. 将新实体写回 `entities`。
6. 为 writer/RAG/Memory 提供上下文。

优化重点：

- 图谱实体类型要标准化：角色、势力、地点、物品、规则、事件、伏笔、情绪节点。
- 实体关系要从字符串数组升级为结构化边：source、target、relation、evidence、chapterId。
- 3D 图谱需要空状态、加载状态、错误状态。
- 实体合并/去重要做成正式工具。
- 每个世界设定项应有来源：用户输入、AI 提取、拆书弹药、导入旧文。

### 4.8 融合拆书

入口：`Modules.fusion_book`  
核心文件：

- `assets/js/modules_split/fusion_book/fusion_book_core.js`
- `fusion_book_extract.js`
- `fusion_book_pipeline.js`
- `fusion_book_consistency.js`
- `fusion_book_export.js`

当前能力：

- 双书导入。
- 主书/辅书三栏拆书。
- 选择拆书模式。
- 循环拆解。
- 暂停/停止/恢复流水线。
- 实时写入拆书结果。
- 输出细纲、正文、实体、弹药。
- 一致性检查。
- 导出。
- 跳转凤凰、执笔台、弹药库。

功能环节：

1. 导入参考书 A/B。
2. 识别章节或段落。
3. 设定拆书目标：节奏、钩子、人设、冲突、爽点、转折。
4. 运行循环拆解。
5. 对比两本书相似/差异。
6. 提炼融合技法。
7. 生成原创细纲或正文模板。
8. 写入 `cycles`、`outlines`、`writings`、`entities`。
9. 同步到世界引擎和执笔台。

优化重点：

- 强化“只拆技法不搬内容”的原创护栏。
- 拆书结果要分层：观察、技法、可复用模板、禁用原文元素。
- 每个弹药要有来源章节和相似度风险。
- 流水线长任务需要统一任务控制器，避免多个模块各自实现暂停/停止。
- 一致性检查应包含“过度相似风险”。

### 4.9 拆书弹药库

入口：`Modules.fusion_workbench`  
核心文件：

- `assets/js/modules_split/fusion_workbench/fwb_core.js`
- `fwb_tabs.js`
- `fwb_actions.js`

当前能力：

- 汇总拆书流水线产物。
- Tabs：overview、analysis、compare、fusion、outline、entity、write、cycle。
- 浏览拆书分析、融合结果、细纲、实体、写作弹药。
- 发布实体。
- 导入执笔台。
- 恢复拆书流水线。
- 清空、导出。

优化重点：

- 弹药库是 fusion 到 writer 的关键桥，应强化筛选和标记：
  - 未使用
  - 已注入
  - 已写入正文
  - 高相似风险
  - 用户收藏
- 导入执笔台前要显示会新增哪些卷/章/实体。
- “清空”要按项目和类型确认，不能一键误删全部。
- 应支持把弹药绑定到具体章节，writer 才能按当前章节精准注入。

### 4.10 RAG 上下文

入口：`RAGSystem` 和 `Modules.rag_context`  
核心文件：

- `assets/js/modules_split/rag/rag_core.js`
- `rag_advanced.js`
- `assets/js/modules/rag_ui.js`

当前能力：

- 多源检索。
- 数据源包括：章节、细纲、实体、拆书、流水线、记忆、阅读库、向量、文档、知识图谱、写作模式、世界观、循环融合。
- 文档添加。
- 文档分块：默认 800 字，100 字重叠。
- 内存索引。
- IndexedDB 持久化。
- 评分、片段提取、上下文预算。
- 模块专用检索。

优化重点：

- 所有 RAG 检索必须默认按当前项目过滤。
- 增加索引状态：未构建、构建中、已过期、错误。
- 数据多后不能每次全量扫描，应建立增量索引。
- 分块大小需要按中文 token 估算调整，而不是只按字符。
- UI 应让用户知道“这次 AI 用了哪些资料”。
- AI 重排序如果存在，应有开关和成本提示。

### 4.11 三层记忆

入口：`MemorySystem` 和 `Modules.memory_system`  
核心文件：

- `assets/js/modules_split/memory/memory_core.js`
- `memory_working.js`
- `memory_longterm.js`
- `assets/js/modules/memory_ui.js`

当前能力：

- 工作记忆。
- 会话记忆。
- 长期记忆。
- 永久记忆缓存。
- 模块专用记忆通道。
- 循环专用记忆通道。
- 重要度。
- 标签。
- 统计面板。
- 导入导出。
- 构建 Brain Context。
- 结合 RAG、实体、世界观、融合、NEXUS、循环数据。

优化重点：

- `settings` store 承载过多记忆数据，应迁移为独立 store 或至少统一 key 前缀 schema。
- 记忆要支持项目隔离和全局记忆两级。
- 自动记忆需要用户可审计：哪些内容被记住、为什么重要、来自哪里。
- 重要度衰减应可关闭，创作设定类记忆不应被误降级。
- `buildBrainContext` 要输出可追踪片段列表，方便调试 AI 幻觉。

### 4.12 阅读中心

入口：`Modules.reader_center`  
核心文件：

- `assets/js/modules_split/library/library_core.js`
- `library_reader.js`
- `library_chat.js`

当前能力：

- 导入 txt/md/html 等书籍。
- 书架。
- 阅读进度。
- 字号、主题。
- 章节跳转。
- AI 分析、提取、解释、续写。
- 提取结果可进入凤凰流或其他模块。
- 阅读对话和命令。

优化重点：

- 大书需要分块存储和虚拟滚动。
- 导入时保留源文件名、编码、章节识别规则。
- 阅读提取和项目导入要打通：从阅读中心选中一本书，可以一键作为“导入续写”源或“拆书参考书”源。
- AI 分析结果要可保存为 RAG 文档、实体或拆书弹药。

### 4.13 网页对话

入口：`Modules.web_chat`  
核心文件：

- `assets/js/modules_split/web_chat/web_chat_core.js`
- `web_chat_ai.js`

当前能力：

- 多模型网页对话。
- 单聊/会议室。
- 多供应商预设：OpenAI、Claude、Gemini、DeepSeek、Qwen、Kimi、GLM、Doubao、Yi、Grok、Mistral、Perplexity、MiniMax、OpenRouter、自定义。
- 会话保存。
- 附件/文件。
- 深度思考/联网开关的配置层。
- 兼容旧接口：quickAction、summarize、diagnose、analyze。

优化重点：

- 供应商配置应全部走 API 池，不内置真实 key。
- 对话消息要有项目绑定，避免不同书的会话混在一起。
- 会议室模式需要清晰展示每个模型的角色、成本、失败状态。
- 文件附件需要大小限制、类型限制和隐私提示。
- “联网”如果只是配置开关而非实际浏览能力，应避免误导。

### 4.14 创意工坊

入口：`Modules.creative_studio`，兼容别名 `Modules.short`  
核心文件：

- `assets/js/modules_split/creative/creative_core.js`
- `creative_inspiration.js`
- `creative_short.js`
- `creative_brainstorm.js`
- `creative_deai.js`
- `creative_generators.js`
- `creative_deconstruct.js`
- `creative_storyboard.js`
- `creative_comic.js`
- `creative_visual.js`
- `creative_video.js`
- `creative_drama.js`
- `creative_lookbook.js`
- `creative_platform.js`
- `creative_trends.js`

当前能力：

- 灵感中枢。
- 快写。
- 灵感池。
- 生成器广场。
- AI 消痕。
- 拆书工坊。
- 分镜。
- 漫画。
- 视觉提示词。
- 视频。
- 漫剧。
- 角色外观库。
- 平台适配。
- 热点扫榜。
- 自定义提示词管理。
- `Modules.short` 作为旧代码兼容入口，writer 等模块依赖它取 prompt。

优化重点：

- 创意工坊功能很多，但需要区分“写长篇必需”和“泛创作工具”。
- 提示词管理应独立成全局 Prompt Center，而不是挂在 creative 兼容别名下。
- 视觉/视频/漫画能力如果没有完整模型链路，应标注为提示词工具或半成品。
- 热点扫榜如果没有真实联网数据源，应避免展示成实时能力。

### 4.15 工具中心

入口：`Modules.tools_center`  
核心文件：

- `assets/js/modules_split/tools_center/tools_center_core.js`
- `tools_center_workflow.js`

当前能力：

- 工作流画布。
- 节点拖拽。
- 预设工作流。
- 运行工作流。
- 保存、导入、导出。
- 批量模式。
- 全局 IO 面板。
- 智能体部署。
- 智能体聊天。

优化重点：

- 当前工具中心里存在 `Navigation.show(...)` 调用，应替换为 `App.nav(...)` 或定义兼容层。
- 工作流节点需要 schema：输入、输出、失败策略、成本估算、是否写数据库。
- 智能体不是外部 agent，只是本地配置和对话时，要避免命名误导。
- 工作流运行日志应能保存到项目审计记录。

### 4.16 万能工坊

入口：`Modules.workshop`  
核心文件：

- `assets/js/modules_split/toolbox/toolbox_core.js`
- `toolbox_fusion.js`
- `toolbox_tools.js`

当前能力：

- 文本工具。
- 融合类工具。
- 继续生成。
- 自定义提示词调用。
- 辅助处理。

优化重点：

- 和创意工坊、工具中心功能有重叠，应做边界整理：
  - 创意工坊：生成内容和素材。
  - 万能工坊：一次性文本处理。
  - 工具中心：流程编排和智能体。
- 工具执行结果需要统一保存入口：复制、保存到章节、保存到弹药库、保存到 RAG。

### 4.17 系统设置

入口：`Modules.settings`  
核心文件：

- `assets/js/modules_split/settings/settings_core.js`
- `settings_theme.js`
- `settings_typography.js`
- `settings_api_pool.js`
- `settings_creative.js`
- `settings_api.js`
- `settings_data.js`

当前能力：

- 快速开始。
- API 池。
- 体验设置。
- 记忆设置。
- 会员设置。
- 数据备份/恢复。
- 高级设置。
- 关于。
- 主题、字体、排版。

优化重点：

- 当前 `settings_core.js` 存在 `Navigation.show(...)` 调用，需修。
- API 池要分文本、解析、拆书、图像、视频、音频，并统一测试连接。
- API Key 输入要默认遮挡，导出备份时默认不包含敏感 key。
- 数据恢复必须先创建恢复点。
- 高级设置里的危险操作要双确认。

### 4.18 移动端引擎

入口：`MobileEngine`  
核心文件：`assets/js/modules/mobile_engine.js`、`css/mobile.css`

当前能力：

- 移动端检测。
- 底部导航。
- 侧边栏开关。
- 键盘适配。
- 手势适配。
- 移动端模块降级。
- 切模块后滚动到顶部。

优化重点：

- 长篇执笔移动端要优先保证“章节树、正文、AI按钮”三件事。
- 底部导航不应覆盖编辑器底部文字。
- 弹窗宽度、按钮热区、顶部栏高度要做固定验收。
- 移动端隐藏模块时也要避免重复可访问文本。

### 4.19 主题与排版

入口：`ThemeEngine`  
核心文件：`assets/js/modules/theme_engine.js`

当前能力：

- 主题。
- 字体。
- 编辑器字号。
- 行高。
- 半透明效果。
- 动画速度。
- localStorage 持久化。

优化重点：

- 主题设置要作用到所有模块，不应有模块写死色值导致冲突。
- 编辑器排版应独立于全局 UI 字号。
- 应提供“专注写作模式”：隐藏侧栏、隐藏顶部、最大化正文。

## 5. 当前已验证的运行状态

浏览器实测：

- `file:///F:/长篇修改专用项目文件夹/长篇/index.html` 可打开。
- 点击“不登录，直接免费体验”后可进入应用。
- 首页能加载，IndexedDB 初始化正常。
- 项目管理能进入。
- 项目创建弹窗逻辑存在。

发现的问题：

- `ThemeEngine` 和 `MobileEngine` 初始化日志出现重复，需确认是否重复初始化。
- Keep-Alive 导致隐藏模块仍留在 DOM，自动化工具会看到隐藏文本。
- 项目管理按钮点击可能被顶部栏覆盖，需要 CSS 层级/布局修复。
- `Navigation.show(...)` 无定义。

## 6. 技术债清单

### 6.1 全局脚本顺序依赖

问题：所有脚本按 `index.html` 顺序串行加载。模块之间通过全局对象互相调用。

影响：

- 改名或拆文件容易引发运行时错误。
- 旧文件和新文件同时存在，难判断真实加载对象。
- 测试成本高。

优化：

- 建立 `module-registry.md` 或自动生成模块清单。
- 给每个模块增加 `dependencies` 声明。
- 短期保留静态脚本，但把全局兼容层集中到 `core/compat.js`。

### 6.2 旧版 original 文件混淆

当前存在：

- `writer_original.js`
- `world_original.js`
- `phoenix_original.js`
- `fusion_book_original.js`
- `library_original.js`
- `rag_original.js`
- `tools_center_original.js`
- `memory_original.js`
- `fusion_workbench_original.js`
- `creative_original.js`
- `toolbox_original.js`
- `settings_original.js`

影响：

- 搜索时大量命中旧文件。
- 容易误改未加载代码。
- 文件体积增加。

优化：

- 建立 `legacy/` 目录或从运行目录移出。
- 在文档中标记“只读参考”。
- 所有修复只改 `modules_split` 或真实加载文件。

### 6.3 内联 onclick 与 innerHTML

问题：大量 UI 通过字符串模板和 `onclick` 拼接。

影响：

- XSS 风险。
- 事件绑定难测试。
- hidden DOM 中重复按钮干扰自动化。
- 用户输入必须到处手动 escape。

优化：

- 短期统一 `_escapeHtml`、`_escapeAttr`。
- 中期新增 `UI.html()` 和 `UI.bindActions()` 约定。
- 长期迁移到组件化或模板层。

### 6.4 Keep-Alive 副作用

问题：`App.nav` 隐藏旧视图而不销毁。

优点：

- 保留模块状态。
- 切回模块更快。

缺点：

- DOM 越切越多。
- 重复 id 和重复文本概率增加。
- 自动化点击容易命中隐藏按钮。
- 屏幕阅读器可能读到隐藏内容。

优化：

- 隐藏模块时加 `aria-hidden="true"` 和 `inert`。
- `App.nav` 查询活跃按钮时限定当前可见模块。
- 对重型模块加释放策略，如 world graph、web chat、library reader。

### 6.5 数据迁移缺少显式记录

问题：IndexedDB 已到 v14，但项目里没有清晰 migration 文档。

优化：

- 新增 `DB_SCHEMA.md`。
- 每次 DB version 增加必须记录新增 store/index/migration。
- 增加旧数据扫描器。

### 6.6 API 调用在浏览器直连

问题：浏览器直接请求第三方模型 API。

影响：

- API Key 泄漏。
- CORS 失败。
- 流式响应兼容差。
- 成本难控。

优化：

- 短期移除内嵌 key，用户自行配置。
- 中期加本地代理或桌面壳安全存储。
- 长期支持后端代理、加密 key、用量审计。

## 7. 安全与隐私风险

| 优先级 | 风险 | 位置 | 影响 | 建议 |
| --- | --- | --- | --- | --- |
| P0 | 明文内嵌 API Key | `assets/js/core/ai.js` | Key 泄漏、费用风险 | 移除真实 key，改为用户配置或本地安全存储 |
| P0 | 客户端卡密密钥 | `assets/js/core/license-core.js` | 授权可被逆向 | 标注为本地体验授权，真实授权需服务端验证 |
| P1 | localStorage 会员/登录状态 | `membership.js`、`user-manager.js` | 可被本机修改 | 不承诺安全，只做 UX 门禁 |
| P1 | `innerHTML` 渲染 AI/用户内容 | 多模块 | XSS/脚本注入 | Markdown 渲染前清洗，统一 escape |
| P1 | API 池随备份/同步泄漏 | `settings`、API pool stores | 敏感配置外流 | 导出默认排除 key，敏感 store 单独确认 |
| P2 | 导入文件无类型/大小统一限制 | library/import/fusion | 卡死或内存爆 | 限制文件大小，分块读取 |

## 8. UX 与交互审计

### 8.1 信息架构

当前左侧导航模块很多：

- 创世中心
- 项目管理
- 凤凰创作流
- 长篇执笔
- 世界引擎
- 融合拆书
- 拆书弹药库
- 创意工坊
- 万能工坊
- 工具中心
- RAG 上下文
- 三层记忆
- 阅读中心
- 网页对话
- 系统设置

建议分组：

- 项目与写作：项目管理、凤凰、导入续写、执笔台。
- 世界与上下文：世界引擎、RAG、记忆。
- 拆书融合：融合拆书、弹药库。
- 素材与工具：阅读中心、创意工坊、万能工坊、工具中心、网页对话。
- 系统：设置。

### 8.2 新手路径

当前能力强，但入口密度高。建议首页只问一个问题：

“你现在手里有什么？”

- 一个新想法：进入凤凰。
- 一份旧稿：进入导入续写。
- 两本参考书：进入融合拆书。
- 已有项目：继续写。

### 8.3 写作主路径

最重要的工作流应该始终可见：

1. 选项目。
2. 建章节。
3. 写正文。
4. 查上下文。
5. AI 续写/润色。
6. 保存。
7. 同步世界/记忆。

不要让用户在写作时被创意、工具、设置等次要入口打断。

### 8.4 文案

建议统一名词：

- “凤凰创作流”：从零开书。
- “导入续写”：旧稿解析和续写。
- “融合拆书”：拆参考书技法。
- “拆书弹药”：可用于原创写作的技法/模板/节奏。
- “世界引擎”：事实库和结构化设定。
- “三层记忆”：AI 长期上下文。
- “RAG”：资料检索。

## 9. 性能审计

### 9.1 冷启动

问题：

- 本地一次性加载所有模块和第三方库。
- `web_chat_core.js`、`fusion_book_pipeline.js`、`world_novel_import.js` 等文件较大。
- Tailwind 浏览器运行时会增加启动成本。

优化：

- 先做“按导航分组懒加载”的轻量方案。
- 首页只加载 project/home/settings 基础模块，进入时再加载大型模块。
- 长期引入构建工具，生成 chunk。

### 9.2 大文本

风险场景：

- 导入整本小说。
- 阅读中心打开大书。
- RAG 全量构建索引。
- 执笔台 1000 章项目。

优化：

- 文件分块读取。
- 章节列表虚拟滚动。
- RAG 增量索引。
- 大文本编辑器改为更稳定的文本编辑组件或分段保存。

### 9.3 图谱和图表

风险：

- 3D Force Graph、vis-network、echarts 都可能在隐藏容器初始化失败或占用内存。

优化：

- 只在可见时初始化。
- `onShow` 时 resize。
- `onHide` 或模块释放时销毁重型实例。

## 10. 优化路线图

### 10.1 第一阶段：止血和可用性

目标：不大改架构，先消灭会卡住用户的硬问题。

任务：

1. 移除 `AI.BUILTIN_CONFIG` 中的真实 key，改为占位配置。
2. 新增 `window.Navigation = { show: App.nav }` 或批量替换为 `App.nav`。
3. 修复项目管理顶部栏遮挡点击。
4. 隐藏旧模块 DOM 时加 `inert`、`aria-hidden`。
5. 建立运行模块清单，标记 original 文件为旧版。
6. 加一份最小手测清单。

验收：

- 新用户能进入、创建项目、打开三条路径、进入执笔台。
- 控制台无红色错误。
- 设置/创意/工具中心里的跳转按钮可用。

### 10.2 第二阶段：数据和安全

目标：让项目数据可控、敏感信息不乱跑。

任务：

1. 定义 DB schema 文档和 store 同步等级。
2. API 池敏感字段遮挡、导出默认排除。
3. 项目切换时清理模块运行态。
4. 旧数据归属扫描和迁移工具。
5. 导入/恢复前自动快照。

验收：

- 切项目不串数据。
- 备份恢复可预览。
- API Key 不出现在普通项目导出包。

### 10.3 第三阶段：写作主链路强化

目标：把“真正写长篇”做稳。

任务：

1. 执笔台保存冲突保护。
2. AI 续写支持插入、替换、另存草稿。
3. 批量写作任务队列化。
4. 章节质量检查输出结构化结果。
5. 世界实体待确认池。
6. 弹药绑定章节。

验收：

- 100 章项目仍可流畅使用。
- AI 失败不会覆盖正文。
- 用户能追踪每段 AI 文本的上下文来源。

### 10.4 第四阶段：架构整理

目标：减少全局脚本债务。

任务：

1. 建立模块注册器。
2. 把兼容层集中到 `core/compat.js`。
3. 把 Prompt Center 从 creative 中独立。
4. 把 Memory store 从 settings 中拆出或标准化。
5. 引入构建/测试工具。

验收：

- 新增模块不需要改多个全局文件。
- 搜索不会被 original 文件干扰。
- 关键流程有自动化测试。

## 11. 优化 Backlog

| ID | 优先级 | 区域 | 问题/需求 | 建议方案 | 验收 |
| --- | --- | --- | --- | --- | --- |
| GEN-001 | P0 | AI | 明文默认 API Key | 移除真实 key，改为用户配置 | 仓库搜索不到真实 key |
| GEN-002 | P0 | 授权 | 客户端卡密可逆向 | 明确本地门禁，真实授权改服务端 | UI 不再暗示强安全 |
| GEN-003 | P1 | 导航 | `Navigation.show` 未定义 | 加兼容层或替换 `App.nav` | 点击相关入口无报错 |
| GEN-004 | P1 | 项目管理 | 顶部栏遮挡按钮 | 修 z-index/pointer-events/布局 | 新建项目真实点击成功 |
| GEN-005 | P1 | App.nav | hidden DOM 干扰 | 加 `inert`、`aria-hidden`，查询限定可见视图 | 自动化只命中当前模块 |
| GEN-006 | P1 | 旧代码 | original 文件误导 | 移到 legacy 或文档标记 | 搜索默认不扫旧版 |
| GEN-007 | P1 | DB | schema 无文档 | 新建 `DB_SCHEMA.md` | 每个 store 有用途和同步等级 |
| GEN-008 | P1 | LocalSync | ALL_STORES 与 DB 不一致 | 单一 schema 生成同步列表 | API pool 同步规则一致 |
| GEN-009 | P1 | Writer | 保存冲突风险 | 切章/切项目/关闭前保存检测 | 未保存正文有提示 |
| GEN-010 | P1 | Writer | AI 失败可能影响正文 | 生成结果先入草稿缓冲区 | 失败不改变正文 |
| GEN-011 | P1 | Fusion | 拆书原创护栏弱 | 输出“技法/禁搬元素/相似风险” | 弹药有风险标签 |
| GEN-012 | P1 | World | 实体关系弱结构 | 边对象包含 source/target/type/evidence | 图谱关系可追溯 |
| GEN-013 | P1 | RAG | 默认可能跨项目 | 所有源按 activeProject 过滤 | 不显示其他项目数据 |
| GEN-014 | P1 | Memory | settings 混存 | 统一 key schema 或独立 store | 记忆可按项目导出 |
| GEN-015 | P1 | Settings | API Key 备份泄漏 | 导出默认排除敏感字段 | 备份包不含 key |
| GEN-016 | P2 | Phoenix | 生成覆盖风险 | 草稿版本和确认步骤 | 用户确认后才同步 |
| GEN-017 | P2 | Import | 章节识别不可纠错 | 增加章节表格编辑 | 导入前可合并/拆分章节 |
| GEN-018 | P2 | Writer | 右侧面板信息过密 | 重组为事实/上下文/检查/设置 | 写作时主操作更清晰 |
| GEN-019 | P2 | Batch | 批量写作缺任务系统 | 抽象任务队列 | 可暂停、恢复、重试 |
| GEN-020 | P2 | Library | 大书性能 | 分块存储、虚拟滚动 | 大书不卡顿 |
| GEN-021 | P2 | WebChat | 多模型成本不透明 | 每模型显示配置、失败、估算成本 | 用户知道调用了谁 |
| GEN-022 | P2 | Creative | Prompt 依赖 creative 别名 | 独立 Prompt Center | writer 不再依赖 `Modules.short` |
| GEN-023 | P2 | Tools | 工作流节点无 schema | 定义输入输出和失败策略 | 工作流可验证 |
| GEN-024 | P2 | Mobile | 底栏可能遮挡编辑 | 视口 padding 和键盘适配 | 底部文字可见 |
| GEN-025 | P2 | UI | `innerHTML` 多 | 统一 escape 和安全渲染 | 用户输入不执行脚本 |
| GEN-026 | P2 | Theme | 模块写死颜色多 | CSS 变量化 | 主题切换一致 |
| GEN-027 | P3 | 架构 | 无构建 | 引入轻量构建和 lint | 可静态检查 |
| GEN-028 | P3 | 测试 | 无自动化回归 | Playwright smoke tests | 主流程一键测试 |
| GEN-029 | P3 | 性能 | 全模块冷启动 | 路由懒加载 | 首页加载更快 |
| GEN-030 | P3 | 文档 | README 与现状不一致 | 更新 README | 新人按文档可运行 |

## 12. 建议的最小回归测试

### 12.1 桌面 smoke

1. 打开 `index.html`。
2. 免费体验进入应用。
3. 进入项目管理。
4. 新建凤凰项目。
5. 进入凤凰创作流。
6. 回项目管理，新建导入项目。
7. 进入世界引擎导入入口。
8. 回项目管理，新建融合项目。
9. 进入融合拆书。
10. 进入长篇执笔，新建卷和章，保存正文。
11. 打开 RAG 上下文。
12. 打开三层记忆。
13. 打开系统设置 API 池。
14. 控制台无未捕获错误。

### 12.2 移动端 smoke

1. 以 390px 宽度打开。
2. 免费体验进入。
3. 底部导航可见。
4. 打开侧边栏。
5. 进入项目管理。
6. 新建项目弹窗不超屏。
7. 进入执笔台，正文输入框不被底栏遮挡。

### 12.3 数据隔离测试

1. 创建项目 A，写入一章和一个实体。
2. 创建项目 B。
3. 在项目 B 的 writer/world/RAG/memory 中不应看到项目 A 数据。
4. 切回项目 A，数据仍在。

### 12.4 安全测试

1. 全局搜索真实 API Key，不应命中。
2. 导出备份，不应默认包含 API Key。
3. 用户输入 `<script>alert(1)</script>` 到标题/实体/聊天，不应执行。

## 13. 推荐下一步执行顺序

最划算的改造顺序：

1. 先修 P0/P1 硬风险：API Key、Navigation、顶部遮挡、hidden DOM。
2. 再做 DB/LocalSync 文档和敏感导出策略。
3. 然后专注执笔台主链路：保存、AI 草稿、批量任务。
4. 最后拆 Prompt Center、模块注册器和测试框架。

这套顺序的好处是：前两步降低事故概率，第三步直接提升作者每天使用体验，第四步再处理长期维护成本。

