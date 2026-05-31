# Plan: 作品导入 + 双向同步 + 三模式统一入口

## 背景与目标

用户希望实现三种创作模式的统一闭环：
1. **凤凰创作流**（0→1自建）— 已有
2. **外部导入续写**（导入已有作品 → AI继续写）— **待实现**
3. **拆书融合写**（学习技法 → 仿写）— 已有

核心诉求：
- 直接导入用户已有内容 → 世界引擎自动解析读取
- 同步到执笔台（AI诊断/润色/扩写/改写/续写）
- 新写的内容（章节、卷、细纲、实体）同步回世界引擎
- 三种模式统一入口

---

## 现有架构分析

### 数据层（GenesisDB v10）
```
volumes ──► chapters (via volumeId)
entities ──► cycles (via cycles[])
         └─► chapters (via chapters[])
cycles ──► entities/chapters (via entityNames/chapterIds)
settings ── world_engine_chapters, writer_rules, checkpoints
```

### 现有数据流
```
凤凰流:    idea → outlineRaw → volumes/chapters ──► writer
                                    └──► world_engine (syncWorldOnFinish)

融合拆书:  左书+右书 → analysis → fusion → cycles ──► world_engine
                                    └──► writer (可选细纲/正文)

writer:    读 chapters/entities/cycles → aiWrite/polish/expand/rewrite/continue
           写 chapters/entities (save/_extractEntitiesFromContent)
```

### 缺失的闭环
1. ❌ 用户已有作品 → 导入 → 解析 → volumes/chapters/entities → world_engine → writer
2. ❌ writer 修改后 → 主动同步回 world_engine（实体/循环更新）
3. ❌ 三种模式的统一入口界面

---

## 方案设计（最小侵入性）

### 方案A：增强世界引擎导入 + 双向同步桥（推荐）

**改动范围：world.js + writer.js + index.html导航**

#### 1. 世界引擎导入增强（world.js）

在现有 `_openImportModal` / `_aiParseImportContent` 基础上扩展：

**新增：小说全文导入模式**
- 入口：世界引擎面板新增「📥 导入已有作品」按钮
- 支持格式：.txt / .md（分章标记 `第X章` / `### ` / `## `）
- 解析流程：
  ```
  用户粘贴/上传全文
  → AI 分析：卷结构 + 章结构 + 世界观7维 + 12类实体
  → 生成 volumes[] + chapters[] + entities[] + cycles[]
  → 批量写入 DB
  → 自动 syncCycle() 到世界引擎
  → 通知 writer 刷新章节树
  ```

**新增方法：**
```js
// world.js
async importNovel(text, opts) { ... }
async _parseNovelStructure(text) { ... }  // AI解析卷章结构
async _parseNovelEntities(text, chapters) { ... }  // AI提取实体+世界观
async _syncImportedData(volumes, chapters, entities, cycles) { ... }
```

#### 2. 双向同步桥（writer.js ↔ world.js）

**writer → world_engine 推送：**
```js
// writer.js save() 后增加
async _syncToWorldEngine() {
    // 1. 提取当前章节的关键实体（已有 _extractEntitiesFromContent）
    // 2. 调用 Modules.world_engine.syncFromWriter(chapterData)
}

// world.js 新增
async syncFromWriter(chapterData) {
    // 更新关联实体的 chapters[] / cycles[]
    // 若章节属于某循环，更新循环的 nexus 状态机
    // 刷新 _cachedEntities / _cachedCycles
}
```

**新增 writer UI：**
- 保存按钮旁增加「🔄 同步到世界引擎」快捷按钮
- 诊断/润色/扩写/改写/续写结果支持「💾 更新到世界引擎」

#### 3. 统一创作入口（index.html 导航）

在首页或侧边导航增加「🚀 开始创作」面板：
```
┌─────────────────────────────────────┐
│        🚀 选择创作方式              │
├─────────────────────────────────────┤
│  🐦 凤凰创作流                      │
│     从0到1，AI辅助构建世界观+大纲    │
│                                     │
│  📥 导入已有作品                    │
│     上传/粘贴已有小说，AI解析续写    │
│                                     │
│  🔀 拆书融合                        │
│     导入两本书，学习技法后仿写       │
└─────────────────────────────────────┘
```

---

### 方案B：独立导入模块（更大改动）

新建 `import_hub.js` 模块，集中处理所有导入逻辑。改动更大但职责更清晰。

---

## 实施步骤

| 步骤 | 内容 | 文件 | 预计行数 |
|------|------|------|----------|
| 1 | 世界引擎新增 `_parseNovelStructure` / `_parseNovelEntities` | world.js | +200 |
| 2 | 世界引擎新增 `importNovel` 入口 + UI | world.js | +150 |
| 3 | world.js 新增 `syncFromWriter` 接收 writer 推送 | world.js | +80 |
| 4 | writer.js save() 后调用 `_syncToWorldEngine` | writer.js | +30 |
| 5 | writer.js 新增「同步到世界引擎」按钮 | writer.js render | +20 |
| 6 | 统一入口：index.html 导航面板 | index.html | +80 |
| 7 | 语法验证 + 联调测试 | - | - |

---

## 技术细节

### 导入解析 Prompt 设计
```
你是NEXUS OS v2.0小说解析引擎。请解析以下小说全文，输出严格JSON：
{
  "volumes": [{"title":"卷名","chapters":[{"title":"章名","order":1,"content":"正文"}]}],
  "worldview": {"history":"...","geography":"...","magic":"...","factions":"...","species":"...","rules":"...","culture":"..."},
  "entities": [{"name":"","type":"人物|物品|地点|...","desc":"","relations":["..."]}]
}
```

### 数据写入顺序（保证一致性）
```js
// 事务化写入（尽可能用同一事务，但IndexedDB限制，按依赖顺序）
1. await DB.put('settings', {id:'import_checkpoint', ...})
2. for (v of volumes) await DB.put('volumes', v)
3. for (c of chapters) await DB.put('chapters', c)
4. for (e of entities) await DB.put('entities', e)
5. for (cy of cycles) await Modules.world_engine.syncCycle(cy)
6. Modules.world_engine._cachedEntities = null
7. Modules.writer?.loadTree()
```

---

## 风险评估

| 风险 | 缓解措施 |
|------|----------|
| AI解析超长文本（100万+字）超时 | 分块解析，每5章一个批次 |
| 已有数据被覆盖 | 导入前弹窗确认，支持「合并」vs「新建作品」 |
| 实体去重冲突 | 按 name+type 匹配，用户确认合并/跳过/新建 |
| DB写入量大导致LocalSync卡顿 | 用 DB._rawPut 批量导入，最后再触发一次同步 |

---

## 推荐方案

**推荐方案A**（增强世界引擎导入 + 双向同步桥），理由：
- 复用 world.js 已有导入基础设施（`_openImportModal`、`_aiParseImportContent`）
- 复用 writer.js 已有实体提取逻辑
- 改动集中在2个文件，侵入性最小
- 与现有凤凰流/拆书流的 finish() 模式对齐
