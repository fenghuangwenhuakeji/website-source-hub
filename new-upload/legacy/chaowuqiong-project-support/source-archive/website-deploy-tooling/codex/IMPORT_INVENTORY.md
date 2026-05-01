# 网站部署 Codex 独立目录完整清单

## 1. 这份清单说明什么

这份清单描述的是独立 Codex Home `D:\网站部署\codex` 里已经挂载的全部 AI / Agent / Skill / MCP 相关内容。

这次导入采用的是“挂载原目录”的方式，不是大规模复制文件，所以：

- `D:\网站部署\codex\skills\site-deployment-imports\...` 看到的是原始技能库的链接挂载。
- `D:\网站部署\codex\vendor_imports\site-deployment\...` 看到的是参考源码或理论项目的链接挂载。
- `D:\网站部署\codex\skills\site-deployment-hub\SKILL.md` 是给 Codex 用的总控入口 skill。

## 2. 总体结构

独立 Codex 目录：

- `D:\网站部署\codex\config.toml`
  作用：独立 Codex Home 的模型和运行配置。
- `D:\网站部署\codex\skills\site-deployment-hub`
  作用：总控 skill，告诉 Codex 去哪里找这批导入内容。
- `D:\网站部署\codex\skills\site-deployment-imports\trae-main`
  作用：主 Trae 技能树挂载。
- `D:\网站部署\codex\skills\site-deployment-imports\agent-plus-agent`
  作用：Agent+Agent 制造机技能树挂载。
- `D:\网站部署\codex\vendor_imports\site-deployment\trae-copy-docs`
  作用：Trae 便携版/编排系统文档与脚本挂载。
- `D:\网站部署\codex\vendor_imports\site-deployment\codeeditor-mcp-source`
  作用：超无穹 CodeEditor MCP 源码挂载。
- `D:\网站部署\codex\vendor_imports\site-deployment\site-deployment-manifest.json`
  作用：机器可读的总清单。
- `D:\网站部署\codex\vendor_imports\site-deployment\site-deployment-skill-index.json`
  作用：机器可读的技能索引，可按名字定位技能。

## 3. 已导入内容统计

- `trae-main`
  作用：主技能库。
  直连技能目录 176 个。
  递归技能目录 5260 个。
- `agent-plus-agent`
  作用：Agent+Agent 制造机技能库。
  直连技能目录 81 个。
  递归技能目录 5024 个。
- `trae-copy-docs`
  作用：理论、文档、启动、驱动、脚本。
  文件数 43。
- `codeeditor-mcp-source`
  作用：MCP 模块源码。
  文件数 7。
- `llm-proxy.js`
  作用：LLM API 代理路由源码。

## 4. `trae-main` 是什么

源路径：

- `D:\网站部署\.trae\skills`

它是整套系统里最大的技能总库，结构上分成 6 类：

1. 编号专题库
2. 单体技能
3. 项目专用技能
4. 批量生成技能包
5. 系统支撑目录
6. 历史/别名/整理目录

### 4.1 编号专题库

这类目录是“按主题组织的一整族技能”，每个目录下还有很多子技能。

- `00-第一性原理Agent`，33 个技能
  作用：理论类、数学类、机器学习类、基础科学类 agent，总体用于抽象分析、推理、建模。
- `01-核心功能Agent`，26 个技能
  作用：计划、规格、调试、生成、编排、自动驾驶这类通用核心 agent。
- `01-系统级语言`，4 个技能
  作用：C / C++ / Go / Rust 等系统语言技能组。
- `02-企业级语言`，3 个技能
  作用：Java / Kotlin / C# 这类企业级语言技能组。
- `02-编程语言Agent`，20 个技能
  作用：语言类 agent 的总集，包含系统级、企业级、脚本语言分组。
- `02-超无穹项目Agent`，11 个技能
  作用：围绕“超无穹”项目的项目专用 agent。
- `03-脚本动态语言`，3 个技能
  作用：JavaScript / Python / TypeScript。
- `03-前端框架Agent`，2 个技能
  作用：前端框架开发。
- `04-游戏开发Agent`，20 个技能
  作用：游戏设计、测试、引擎、美术、关卡、联机等。
- `04-游戏引擎Agent`，7 个技能
  作用：Godot / Unity / Unreal 相关。
- `05-内容创作Agent`，27 个技能
  作用：故事、角色、文风、剧本、叙事等内容生产。
- `05-游戏设计Agent`，7 个技能
  作用：关卡、任务、设计、测试、本地化等。
- `06-AI创作Agent`，6 个技能
  作用：AI 美术、分镜、动画、音乐、漫画。
- `06-游戏美术Agent`，4 个技能
  作用：音效、特效、Shader、视觉资产。
- `07-工具辅助Agent`，1 个技能
  作用：辅助工具类。
- `07-小说创作Agent`，2115 个技能
  作用：超大规模小说写作/脑洞/风格/角色/题材生成库，是最大的生成内容池之一。
- `08-Agent团队协作`，2 个技能
  作用：多 agent 协作与团队编排。
- `08-剧本创作Agent`，6 个技能
  作用：剧本创作与结构化分工。
- `09-影视剧本Agent`，7 个技能
  作用：影视方向的剧作技能。
- `09-运维部署Agent`，8 个技能
  作用：部署、服务器、Nginx、PM2、云环境。
- `09-量化金融Agent`，7 个技能
  作用：量化、回测、风险、技术分析。
- `10-分镜制作Agent`，4 个技能
  作用：分镜、镜头、画面表达。
- `11-AI创作Agent`，4 个技能
  作用：第二批 AI 创作技能分组。
- `12-角色设计Agent`，3 个技能
  作用：角色设定、人物塑造。
- `13-世界构建Agent`，0 个技能
  作用：预留分类，目前基本是空壳。
- `14-叙事技巧Agent`，4 个技能
  作用：节奏、反转、三幕式、潜台词等。
- `15-量化金融Agent`，7 个技能
  作用：量化技能的另一套分组。
- `16-垂直行业Agent`，561 个技能
  作用：面向细分行业的大规模专用 agent 库。
- `17-工具辅助Agent`，2 个技能
  作用：工具类技能扩展。
- `18-Agent协作Agent`，2 个技能
  作用：协作调度、编排。
- `19-Agent生成Agent`，1 个技能
  作用：Agent 生成器。
- `20-特殊创作Agent`，0 个技能
  作用：预留分类。
- `99-其他`，0 个技能
  作用：杂项预留。

### 4.2 单体技能

这类目录是“单个可直接触发的 skill / agent”，不再按专题包裹。

#### 核心编排与通用开发

- `agent-generator`
  作用：生成新的 agent。
- `agent-orchestrator`
  作用：按任务自动分配多个 agent。
- `Agent-team`
  作用：团队型 agent 协作。
- `autopilot-agent`
  作用：自动驾驶式处理任务。
- `batch-agent-creator`
  作用：批量生成 agent。
- `plan-agent`
  作用：做计划、分解任务、WBS、排期。
- `spec-agent`
  作用：做规格、需求说明、方案约束。
- `debug-agent`
  作用：定位并修复问题。
- `meta-agent`
  作用：元控制、反思、协调。

#### 编程语言与框架

- `c-agent`
- `cpp-agent`
- `csharp-agent`
- `go-agent`
- `java-agent`
- `javascript-agent`
- `kotlin-agent`
- `php-agent`
- `python-agent`
- `rust-agent`
- `typescript-agent`
- `react-agent`
- `vue3-agent`
- `vue3-admin-agent`
- `flutter-agent`
- `turbo-monorepo-agent`
- `browser-extension`
- `electron-app`

作用：按语言、框架、工程形态提供面向实现的专门技能。

#### 数据、文档、运维与系统

- `csv-data-agent`
- `data-acquisition-agent`
- `data-processing-agent`
- `database-admin-agent`
- `sql-database-agent`
- `json-config-agent`
- `yaml-config-agent`
- `html-document-agent`
- `markdown-document-agent`
- `pdf-document-agent`
- `ppt-document-agent`
- `excel-document-agent`
- `word-document-agent`
- `deployment-agent`
- `aliyun-deployment-agent`
- `cloud-server-agent`
- `server-management`
- `nginx-admin-agent`
- `pm2-management-agent`
- `web-server`
- `rag-system-agent`
- `memory-engine-agent`

作用：处理数据、配置、文档、数据库、部署、服务器与知识检索。

#### 创作与游戏

- `brainstorm-agent`
- `outline-agent`
- `narrative-engine-agent`
- `polish-agent`
- `dialogue-writer-agent`
- `dialogue-polish-agent`
- `character-arc-agent`
- `character-design-agent`
- `character-emotion-agent`
- `character-relationship-agent`
- `genre-agent`
- `hero-journey-agent`
- `plot-twist-agent`
- `scene-transition-agent`
- `screenplay-format-agent`
- `script-creator-agent`
- `storyboard-agent`
- `short-film-agent`
- `short-story-writer-agent`
- `stage-play-agent`
- `radio-drama-agent`
- `tv-series-agent`
- `web-series-agent`
- `worldbuilding-agent`
- `comic-creator-agent`
- `animation-creator-agent`
- `nanobanana-asset-agent`
- `nanobanana-grid-agent`
- `suno-music-agent`
- `suno-workbench-agent`
- `vfx-agent`
- `sound-design-agent`
- `shader-agent`
- `game-ai-agent`
- `game-audio-agent`
- `game-design-agent`
- `game-localization-agent`
- `game-performance-agent`
- `game-server-agent`
- `game-testing-agent`
- `level-design-agent`
- `multiplayer-agent`
- `quest-design-agent`
- `godot-asset-agent`
- `godot-asset-script-agent`
- `godot-csharp-agent`
- `godot-gdscript-agent`
- `godot-scene-agent`
- `unity-agent`
- `unreal-agent`
- `galgame-engine-agent`
- `phoenix-engine-agent`
- `wuxia-engine-agent`
- `xiuxian-engine-agent`

作用：覆盖小说、剧本、分镜、动画、音乐、游戏设计、引擎开发和资产生成。

#### 理论、模型与金融

- `bayesian-statistics-agent`
- `cnn-agent`
- `convex-optimization-agent`
- `cv-agent`
- `deep-learning-agent`
- `differential-equations-agent`
- `dissipative-structure-agent`
- `fibonacci-agent`
- `first-principles-agent`
- `game-theory-agent`
- `gnn-agent`
- `grid-search-agent`
- `information-theory-agent`
- `knowledge-graph-agent`
- `linguistics-agent`
- `lstm-agent`
- `machine-learning-agent`
- `markov-agent`
- `mathematics-agent`
- `ml-trading-agent`
- `moe-agent`
- `multimodal-model-agent`
- `nlp-agent`
- `operations-research-agent`
- `organization-optimization-agent`
- `philosophy-agent`
- `physics-agent`
- `reinforcement-learning-agent`
- `rnn-agent`
- `stable-diffusion-agent`
- `statistical-causal-model-agent`
- `systems-theory-agent`
- `technical-analysis-agent`
- `topology-agent`
- `transformer-agent`
- `world-model-agent`
- `backtesting-agent`
- `risk-management-agent`
- `equity-distribution-agent`
- `payment-integration-agent`

作用：理论分析、机器学习、金融分析、推理建模。

### 4.3 项目专用技能

最明显的是 `chaowuqiong-*` 这一组，一共 24 个。

包括：

- `chaowuqiong-admin-agent`
- `chaowuqiong-agentengine-agent`
- `chaowuqiong-auth-agent`
- `chaowuqiong-backend-agent`
- `chaowuqiong-character-agent`
- `chaowuqiong-codeeditor-agent`
- `chaowuqiong-database-agent`
- `chaowuqiong-deploy-agent`
- `chaowuqiong-duration-agent`
- `chaowuqiong-electron-agent`
- `chaowuqiong-frontend-agent`
- `chaowuqiong-gacha-agent`
- `chaowuqiong-llm-agent`
- `chaowuqiong-llmproxy-agent`
- `chaowuqiong-memory-agent`
- `chaowuqiong-mobile-agent`
- `chaowuqiong-novel-agent`
- `chaowuqiong-novelwriter-agent`
- `chaowuqiong-order-agent`
- `chaowuqiong-payment-agent`
- `chaowuqiong-points-agent`
- `chaowuqiong-recharge-agent`
- `chaowuqiong-referral-agent`
- `chaowuqiong-vip-agent`

作用：这是围绕“超无穹”项目拆出来的一套垂直 agent，分别负责后台、前端、支付、会员、订单、推荐、记忆、LLM、桌面端等模块。

另一个项目技能：

- `fenghuang-fullstack-agent`
  作用：围绕凤煌/凤凰类项目的全栈开发。

### 4.4 批量生成技能包

这类目录不是单个能力，而是“成批产出的技能池”。

- `generated_400_agents`，400 个技能
- `generated_500_agents`，500 个技能
- `generated_agents`，560 个技能
- `generated_comprehensive_agents`，380 个技能
- `generated_novel_agents`，269 个技能
- `generated-test-agents`，2 个技能

作用：大规模自动生成的角色化 agent 库，主要偏小说、行业、创作、题材、分工。

### 4.5 系统支撑目录

这类目录不是给 Codex 直接触发的 skill，而是系统资源。

- `_config`
  作用：配置文件。
- `_core-scripts`
  作用：核心编排和控制脚本。
- `_docs`
  作用：说明文档、索引、指南。
- `_drivers`
  作用：驱动或运行控制层。
- `_indexes`
  作用：索引。
- `_logs`
  作用：日志。
- `_powershell`
  作用：PowerShell 脚本。
- `_startup` / `_startups`
  作用：启动脚本。
- `_system-config`
  作用：系统级配置。
- `_system-docs`
  作用：系统级说明文档。
- `_system-logs`
  作用：系统级日志。
- `_system-scripts`
  作用：系统级脚本。
- `_system-startup`
  作用：系统级启动入口。
- `_temp`
  作用：临时文件。
- `_tools`
  作用：工具目录。

### 4.6 历史/别名/整理目录

这些目录多半是重复整理、中文别名、收纳区或半成品区：

- `企业级语言`
- `系统级语言`
- `脚本动态语言`
- `文档Agent家族`
- `角色`
- `角色和开发app系统`
- `公司建造技术架构`
- `待Agent化的`
- `运维部署Agent`
- `workspace`
- `logs`

作用：补充整理、分类镜像、工作区残留或过渡目录。

## 5. `agent-plus-agent` 是什么

源路径：

- `D:\网站部署\Agent+Agent制造机\Agent阵法\.trae\skills`

它本质上是另一套“可批量制造 agent 的技能树”，相比 `trae-main` 更像一个成品工厂或镜像版：

- 直连技能目录 81 个
- 递归技能目录 5024 个

它包含的主要内容：

- 核心功能类 agent
  如 `agent-generator`、`autopilot-agent`、`batch-agent-creator`、`plan-agent`、`spec-agent`、`debug-agent`、`meta-agent`
- 编程语言类 agent
  如 `c-agent`、`cpp-agent`、`go-agent`、`java-agent`、`python-agent`、`typescript-agent`
- 前端框架类 agent
  如 `react-agent`、`vue3-agent`、`flutter-agent`
- 游戏与创作类 agent
  如 `godot-*`、`unity-agent`、`unreal-agent`、`storyboard-agent`、`comic-creator-agent`
- 大量批量生成库
  如 `generated_400_agents`、`generated_500_agents`、`generated_agents`、`generated_comprehensive_agents`、`generated_novel_agents`

它和 `trae-main` 的关系：

- `trae-main` 更像主仓库
- `agent-plus-agent` 更像扩展镜像和制造机产物库
- 两边有大量同名/同主题技能

## 6. `trae复制` 是什么

源路径：

- `D:\网站部署\trae复制`

这个目录不是技能库本体，而是一套“便携版运行壳 + 文档 + 驱动 + 启动脚本”。

### 6.1 目录作用

- `_config`
  作用：任务队列、批量文档配置、示例任务配置。
- `_core-scripts`
  作用：系统核心控制脚本。
- `_docs`
  作用：索引、快速开始、协作说明、自动驾驶说明、路由说明。
- `_drivers`
  作用：运行驱动层。
- `_indexes`
  作用：索引文件。
- `_logs`
  作用：日志文件。
- `_powershell`
  作用：PowerShell 辅助脚本。
- `_startup` / `_startups`
  作用：一键启动入口。
- `_system-config`
  作用：系统配置。
- `_system-docs`
  作用：系统文档。
- `_system-logs`
  作用：系统日志。
- `_system-scripts`
  作用：系统脚本。
- `_system-startup`
  作用：系统启动脚本。
- `_temp`
  作用：临时目录。
- `_tools-temp`
  作用：测试/示例工具。

### 6.2 核心脚本

- `agent-cli.js`
  作用：命令行入口。
- `agent-driver.js`
  作用：agent 驱动。
- `agent-integration.js`
  作用：agent 集成层。
- `agent-orchestrator.js`
  作用：多 agent 编排。
- `auto-scheduler.js`
  作用：自动调度。
- `autopilot-system.js`
  作用：自动驾驶系统。
- `core-agent-system.js`
  作用：核心系统主程序。
- `master-controller.js`
  作用：总控器。
- `sentient-agent-core.js`
  作用：智能体核心逻辑。
- `trae-agent-controller.js`
  作用：Trae agent 控制器。
- `trae-agent-supervisor.js`
  作用：Trae agent 监督器。

### 6.3 主要文档

- `AGENT-INDEX.md`
  作用：总索引。
- `AGENT-COORDINATION.md`
  作用：协作说明。
- `REAL-AGENT-INTEGRATION.md`
  作用：真实集成说明。
- `SMART-ROUTER.md`
  作用：智能路由说明。
- `AUTOPILOT-GUIDE.md`
  作用：自动驾驶说明。
- `QUICK-START.md`
  作用：快速启动。
- `PORTABLE-GUIDE.md`
  作用：便携方案。
- `AGENT-分类索引.md`
  作用：分类索引。
- `AGENT-完整分类索引.md`
  作用：完整分类索引。
- `AGENT分类说明.md`
  作用：分类解释。
- `封装方案指南.md`
  作用：封装/分发说明。

### 6.4 启动脚本

- `start-all-agents.bat`
  作用：启动全部 agent。
- `start-autopilot.bat`
  作用：启动自动驾驶模式。
- `start-enhanced-system.bat`
  作用：启动增强系统。
- `make-portable.ps1`
  作用：制作便携版。

## 7. `codeeditor-mcp-source` 是什么

源路径：

- `D:\网站部署\超无穹项目\chaowuqiong-project\apps\desktop\待打包\CodeEditor\mcp`

这是一个 MCP 模块源码目录，不是现成的 Codex `.mcp.json` 运行配置。

### 7.1 文件作用

- `index.ts`
  作用：模块总入口，统一导出 transport、client、service、context、tools、types。
- `types.ts`
  作用：定义 MCP 协议里的消息结构、能力声明、工具、资源、提示词、连接配置。
- `transport.ts`
  作用：传输层，负责 stdio / SSE / WebSocket / HTTP 等连接方式。
- `client.ts`
  作用：客户端逻辑，负责建立 MCP 连接、读写消息、维护能力。
- `service.ts`
  作用：服务管理器，负责注册扩展、管理连接、汇总工具/资源/提示词。
- `context.ts`
  作用：上下文管理，负责 MCP context 相关数据。
- `tools.ts`
  作用：工具注册表，负责 MCP tools 管理。

### 7.2 当前状态

- 已被挂载进独立 Codex 目录，可供读取和改造。
- 目前还是“源码级 MCP 模块”。
- 还没有被封成 Codex 可直接启动的本地 MCP 插件。

## 8. `llm-proxy.js` 是什么

源路径：

- `D:\网站部署\llm-proxy.js`

这是一个 Express 路由模块，主要用途是做聊天接口代理。

它的作用分成两部分：

- `POST /`
  作用：接收聊天请求，做登录校验、会员/积分检查，然后把请求转发到真正的 LLM 服务。
  当前状态：代码里还是“模拟返回”，并没有真的连外部模型 API。
- `POST /stream`
  作用：做流式响应接口，使用 SSE 返回增量内容。
  当前状态：也是模拟流式输出。

简单说：

- 它是“LLM 接口网关草稿”
- 不是真正已经接好 OpenAI / Claude / 文心等模型的生产版

## 9. 目前哪些东西是真正可用的

### 已经可直接被 Codex 发现/调用的

- `D:\网站部署\codex\skills\site-deployment-hub`
- `D:\网站部署\codex\skills\site-deployment-imports\trae-main`
- `D:\网站部署\codex\skills\site-deployment-imports\agent-plus-agent`

这部分的 `SKILL.md` 已经能被 Codex 当作 skill 来源读取。

### 已经接入，但更偏“参考源码/参考工程”的

- `trae复制`
- `codeeditor-mcp-source`
- `llm-proxy.js`

这部分是“导入成功，可读可改”，但不是“已经封装成可直接运行的 Codex 插件/MCP 服务”。

## 10. 当前限制

- 很多中文 `SKILL.md` 有编码问题，显示会出现乱码。
  这不影响目录挂载，但会影响直接阅读说明文字。
- `generated_*`、`07-小说创作Agent`、`16-垂直行业Agent` 这类目录非常大，里面很多是批量生成技能。
  它们更适合按名字索引定位，不适合人工逐个浏览。
- `codeeditor-mcp-source` 目前是源码，不是 live MCP。
- `llm-proxy.js` 目前是模拟响应，不是真实连模型。

## 11. 最重要的使用入口

- 总控 skill：
  `D:\网站部署\codex\skills\site-deployment-hub\SKILL.md`
- 总清单：
  `D:\网站部署\codex\vendor_imports\site-deployment\site-deployment-manifest.json`
- 技能索引：
  `D:\网站部署\codex\vendor_imports\site-deployment\site-deployment-skill-index.json`

如果后续要继续做“把源码真正改造成 Codex 可运行插件 / MCP 服务”，优先处理：

1. `codeeditor-mcp-source`
2. `llm-proxy.js`
3. `trae复制` 的核心脚本封装
