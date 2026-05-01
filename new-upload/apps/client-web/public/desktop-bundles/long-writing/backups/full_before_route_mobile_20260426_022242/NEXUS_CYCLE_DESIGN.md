# NEXUS OS v2.0 × 循环层级架构 改造设计文档

## 一、核心目标

1. **世界引擎** → 实体/关系/图谱 细化到「循环」维度（每N章为一个循环）
2. **融合拆书** → 循环拆解结果自动同步到世界引擎的循环层
3. **长篇执笔** → 写作注入按「当前章节所属循环」精准注入（循环实体 + 循环融合精华 + NEXUS四状态机）
4. **凤凰创作流** → 外部导入后无缝续写，NEXUS OS INIT流程贯穿
5. **系统指令贯穿** → NEXUS OS v2.0 的审判/鼓舞、四状态机(CHR/WLD/FOE/EMO)、L1铁律、零件库、微循环 融入所有Prompt

---

## 二、数据模型扩展

### 2.1 新增 `cycles` IndexedDB Store

```js
{
  id: 'cycle_book_123_1_5',     // cycle_{bookId}_{start}_{end}
  bookId: 'book_123',
  startChapter: 1,
  endChapter: 5,
  cycleNum: 1,                   // 第几个循环
  cycleSize: 5,
  
  // 融合拆书数据
  fusionEssence: '',             // 循环融合精华（长文本）
  compareResult: '',             // 循环对比结论
  leftAnalysis: '',              // 左书本章循环分析汇总
  rightAnalysis: '',             // 右书本章循环分析汇总
  patterns: [],                  // 可复用套路清单 [{name, desc, source}]
  emotionCurve: '',              // 情绪曲线分析文本
  rhythmFormula: '',             // 节奏公式
  hookTemplates: [],             // 本章循环钩子模板
  
  // NEXUS OS 四状态机
  nexusCHR: [],                  // 角色状态变迁 [{charId, name, from, to, trigger}]
  nexusWLD: [],                  // 世界规则变化 [{ruleId, from, to, chapter}]
  nexusFOE: [],                  // 伏笔状态 [{foeId, desc, status, planRecycle}]
  nexusEMO: [],                  // 情绪锚点 [{chapter, score, word, type}]
  
  // 关联
  entityNames: [],               // 本循环涉及的实体名称列表（快速索引）
  chapterIds: [],                // 关联的章节ID列表
  
  createdAt, updatedAt
}
```

### 2.2 实体 (Entity) 扩展字段

```js
{
  // 现有字段
  id, name, type, desc, relations, chapters, source, updatedAt,
  // 新增
  cycles: ['cycle_book_123_1_5', 'cycle_book_123_6_10'],
  nexusState: {
    chrStatus: 'S1激活',       // CHR表状态
    foeRole: 'S0埋设',         // 伏笔角色
    emoScore: 7,               // 情绪分值
    wldVersion: 'v1.0'         // 世界观规则版本
  },
  cycleEvolution: [           // 跨循环的演进记录
    {cycleId, desc: '此循环中的变化'}
  ]
}
```

---

## 三、模块改造清单

### 3.1 DB.js
- [ ] version 9 → 10
- [ ] 新增 `cycles` store
- [ ] LocalSync.ALL_STORES 加入 `cycles`

### 3.2 World.js
- [ ] `_cachedCycles` + `_ensureCycleCache()`
- [ ] `buildInjectPackage` 增加 `cycleId` 参数路径
- [ ] 新增 `syncCycle(cycleData)` — 接收 fusion_book 的循环数据写入 DB
- [ ] 新增 `getCycleContext(cycleId)` — 构建循环级注入文本
- [ ] 新增 `getCycleIdForChapter(chapterNum, cycleSize)` 工具函数
- [ ] `_renderSubPanel` entities tab 增加「循环筛选」下拉框
- [ ] `_renderSubPanel` graph tab 增加「循环筛选」
- [ ] `_initGraph` 支持按 cycleId 过滤节点
- [ ] `extractFromFusion` 标记实体 `cycles`（如果当前有活跃循环）
- [ ] `_saveEntity` 保存 cycles 字段
- [ ] `injectToWriter` / `injectToPhoenix` 增加循环选项
- [ ] 新增 `_renderNexusPanel()` 显示四状态机数据

### 3.3 Fusion_book.js
- [ ] `_cycleFusionSummary` 结尾调用 `Modules.world_engine.syncCycle(...)`
- [ ] `_pipelineExtractEntities` 按循环标记实体 cycles 字段
- [ ] 新增 `_getCycleFusionForChapter(chapterIdx)` 公共API
- [ ] `_runConfiguredPipeline` 循环总结后同步世界引擎
- [ ] Prompt改造：
  - `analyze` → 增加 NEXUS 8+2维度 + L1铁律提示
  - `fusion` → 增加零件库格式 + 变异方案
  - `write` → 增加四状态机约束 + 鲜活度评分
  - `outline` → 增加黄金螺旋 + 情绪曲线
- [ ] 循环融合Prompt增加 NEXUS 四状态机提取要求

### 3.4 Writer.js
- [ ] 新增 `_getCycleContext(chapterId)` — 拉取所属循环的融合精华+实体
- [ ] 新增 `_getNexusContext(chapterId)` — 构建四状态机注入文本
  - CHR: 当前活跃角色及状态
  - WLD: 当前生效的世界规则
  - FOE: 待回收伏笔 + 本循环新埋设
  - EMO: 情绪目标分值
- [ ] `aiWrite` → prompt 注入 cycleContext + nexusContext
- [ ] `fusionWrite` → 同上
- [ ] `autoWriteAll` → 每章动态计算循环上下文
- [ ] `autoWriteAllEnhanced` → 同上 + NEXUS巡检
- [ ] `_buildFullContext` → 增加循环层 + NEXUS层
- [ ] `_getWorldEngineContext` → 增加循环过滤

### 3.5 Phoenix.js
- [ ] `_parseWorldSetting` → 检测循环标记（如 `【循环1-5】`），自动创建cycle数据并同步世界引擎
- [ ] `continueGen` → 
  - 检测已有大纲末尾，从断点续写
  - 支持外部导入文件后调用 continueGen 无缝衔接
  - 自动填充 `data.importedWorld` 和 `data.outlineRaw`
- [ ] `genOutline` prompt → 
  - 头部注入 NEXUS 审判/鼓舞
  - INIT流程参数（篇幅/受众/情绪）
  - 零件库注入
  - 黄金螺旋分章约束
- [ ] `finish` → 按循环组织章节数据，批量创建 cycle 记录
- [ ] 新增 `_detectBreakpoint()` — 分析 outlineRaw 找出已完成的卷/章数

---

## 四、NEXUS OS Prompt 注入模板

### 4.1 通用前缀（所有生成类Prompt）

```
【超无穹 · 真值引擎 · NEXUS OS v2.0 执行域】

=== 创作前审判 ===
你以为你准备好了？你不过是塞满套路、数据和他人影子的凡人...（略）

=== 行文铁律 L1（违反即重写）===
1. 视角锁死: {{perspective}}
2. 禁解释癖: 禁用"这不是…而是…"
3. 禁烂俗比喻: 禁用"像刀/阳光/风/水/火/石头"
4. 禁虚词模糊: 删除"似乎/仿佛/好像"
5. 禁情绪标签: 不写"他很愤怒"，必须动作/环境/对话呈现
6. 禁连续长句: 单句≤25字；逗号连接分句≤2个
7. 章末必有钩子: 未完成动作+意外信息 / 时间压力 / 信息差
8. 对话格式: {{dialogueFormat}}
9. 对话功能化: 推进剧情/塑造性格/埋伏笔/制造情绪，否则删除
10. 开篇100字: 必须是动作或对话，禁环境/背景/独白
11. 结局禁梦: 禁止"醒来发现是梦/幻觉/游戏"
12. 时间线向前: 除重生/回溯外禁无理由跳跃
13. 行为一致: 不得无理由OOC
14. 禁逻辑连词: 删除"首先/其次/然后/最后/总的来说"
15. 段落限制: 每段≤5行（约60字）
16. 跨模块铁律: 仿写/续写必须遵守对应规则

=== 四状态机当前快照 ===
[CHR表] {{chrSnapshot}}
[WLD表] {{wldSnapshot}}
[FOE表] {{foeSnapshot}}
[EMO表] {{emoSnapshot}}

=== 零件库注入 ===
{{partsInjection}}
```

### 4.2 循环级上下文格式

```
【循环级技法精华 | 第X-Y章】
{{cycleFusionEssence}}

【循环情绪曲线目标】
{{cycleEmotionCurve}}

【循环节奏公式】
{{cycleRhythmFormula}}

【循环伏笔网络】
{{cycleFoeNetwork}}

【循环角色状态约束】
{{cycleChrConstraints}}
```

---

## 五、实施顺序

1. DB.js 基础设施
2. World.js 核心循环层（数据结构 + 同步接口 + 注入包）
3. Fusion_book.js 循环同步 + NEXUS Prompt
4. Writer.js 循环注入 + NEXUS 状态机
5. Phoenix.js 续写 + NEXUS INIT
