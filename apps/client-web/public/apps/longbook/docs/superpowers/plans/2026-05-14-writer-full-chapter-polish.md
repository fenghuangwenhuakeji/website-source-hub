# 执笔台整章润色与自动润色实施计划

生成时间：2026-05-14  
模式：superpower 规划；当前只写计划，不改业务代码。

## 目标

把执笔台润色升级成统一的“整章润色管线”，支持：

1. 手动点击“润色”完整润色当前章。
2. 一章一章手动确认、替换、还原。
3. 开启自动润色后，AI生成稿先后台润色，再以打字机方式显示最终正文。
4. 批量生成时可自动保存润色后正文。
5. 用户给出的正则和提示词可以被吸收进统一配方。

## 当前约束

1. `writer_ai.js` 的 `polish()` 当前只传 `content.slice(-4000)`。
2. `aiWrite()` 和 `fusionWrite()` 当前直接把 chunk 写进编辑器。
3. `writer_batch.js` 的批量生成也直接流式更新内容。
4. 当前已有 `_sanitizeGeneratedProse()` 和 `_sanitizeEditableProse()`，应复用。
5. 当前已有 `_mergeStyleRules()`、`_getMandatoryStyleRules()`、`#w-polish-rules`，应继续作为规则来源。
6. 当前工程不是 git 仓库，实施前建议额外复制目录快照。

## 实施阶段

### 阶段 0：实施前保护

目的：确保优化时可以回退。

动作：

1. 复制当前 `F:\长篇修改专用项目文件夹\长篇` 到备份目录。
2. 记录当前文档和脚本文件数量。
3. 确认 `index.html` 能直接打开。
4. 确认当前“润色”“AI续写”“批量生成”原始行为。

验收：

```text
备份目录存在
index.html 可打开
现有生成/润色按钮可见
```

### 阶段 1：新增润色服务层

建议新增文件：

```text
assets/js/modules_split/writer/writer_polish.js
```

职责：

```text
Object.assign(Modules.writer, {
  _getPolishSettings,
  _savePolishSettings,
  _getPolishRulesBundle,
  _applyPolishRegex,
  _splitChapterForPolish,
  _buildPolishPrompt,
  _polishText,
  _validatePolishResult,
  _renderTypewriter
})
```

设计细节：

1. `_getPolishSettings()` 从 `settings` 读取自动润色开关、打字机速度、配方版本。
2. `_getPolishRulesBundle()` 合并强制 M06/M07、提取文风、润色规则、全局规则。
3. `_applyPolishRegex(text, stage)` 支持 `pre` 和 `post` 两个阶段。
4. `_splitChapterForPolish()` 按自然段分块，优先不切断对话。
5. `_buildPolishPrompt()` 给整章和分块共用。
6. `_polishText()` 是所有入口唯一调用的润色函数。
7. `_validatePolishResult()` 防止空输出、过短输出、元信息泄漏。
8. `_renderTypewriter()` 只负责把最终文本写进编辑器，不负责生成或润色。

验收：

```text
手动润色、AI续写、融合写作、批量生成都能调用同一套 _polishText
正则清洗和提示词构建不散落在多个文件
```

### 阶段 2：改造手动润色

目标文件：

```text
assets/js/modules_split/writer/writer_ai.js
```

改造入口：

```text
Modules.writer.polish()
Modules.writer._acceptPolish()
Modules.writer._rejectPolish()
```

改造步骤：

1. 保留现有按钮和入口名，避免 UI 调用断裂。
2. 把 `content.slice(-4000)` 改为完整 `content`。
3. 调用 `_polishText(content, { mode: 'manual', chapterId, preview: true })`。
4. 长章由 `_polishText()` 内部分块。
5. 预览仍写入编辑器并标红。
6. `_acceptPolish()` 改成“替换并保存”。
7. 接受后写入章节状态：

```text
polishStatus = "polished"
lastPolishedAt = 当前时间
lastPolishMode = "manual"
```

8. `_rejectPolish()` 保持还原原文。

验收：

```text
8000 字章节点击润色不会只处理末尾
接受后刷新页面仍是润色版
还原后不会保存润色版
```

### 阶段 3：增加自动润色开关

目标文件：

```text
assets/js/modules_split/writer/writer_core.js
```

建议 UI：

```text
润色 ▼
  润色当前章
  自动润色：开/关
  应用到批量生成：开/关
```

最小实现：

1. 保持原“润色”按钮点击仍是 `Modules.writer.polish()`。
2. 在按钮旁增加一个小下拉。
3. 下拉中只有“自动润色：开/关”。
4. 开关状态保存到 `settings.writer_auto_polish_enabled`。
5. 按钮附近或状态栏显示当前开关状态。

验收：

```text
刷新页面后自动润色状态仍保留
关闭自动润色时所有生成行为保持原样
```

### 阶段 4：改造 AI 续写自动润色

目标文件：

```text
assets/js/modules_split/writer/writer_ai.js
```

改造入口：

```text
Modules.writer.aiWrite()
```

自动润色关闭：

1. 保留现有 chunk 流式写入。
2. 保留现有保存和后处理。

自动润色开启：

1. 记录 `startLen` 和已有正文。
2. 调用 `AI.generate(prompt, config)` 获取完整原始新增稿，不把 chunk 写进编辑器。
3. 对原始新增稿执行 `_sanitizeGeneratedProse()`。
4. 调用 `_polishText(cleanRaw, { mode: 'auto-write', baseContent, title, outline })`。
5. 校验润色结果。
6. 把编辑器恢复到生成前正文。
7. 调用 `_renderTypewriter(editor, polishedAdded, { append: true })`。
8. 保存当前章。

失败回退：

```text
如果润色失败，使用 cleanRaw 进入打字机输出或直接写入，不能丢稿。
```

验收：

```text
自动润色开启后，用户不会看到未经润色的原始稿
最终显示的是润色稿
输出仍有一个字一个字出现的感觉
```

### 阶段 5：改造融合写作自动润色

目标文件：

```text
assets/js/modules_split/writer/writer_ai.js
```

改造入口：

```text
Modules.writer.fusionWrite()
```

和 `aiWrite()` 同策略：

```text
关闭自动润色：保持当前流式写入
开启自动润色：后台生成 raw → 润色 → 打字机输出 polished
```

验收：

```text
融合写作在自动润色开启后也输出润色版
关闭自动润色后保持旧行为
```

### 阶段 6：改造批量生成

目标文件：

```text
assets/js/modules_split/writer/writer_batch.js
```

改造入口：

```text
autoWriteCurrent()
_startScopedAutoWrite()
```

策略：

1. 自动润色关闭：保持当前行为。
2. 自动润色开启且应用到批量生成：每章生成 raw 后调用 `_polishText()`。
3. 批量模式默认自动接受润色结果，不弹预览浮层。
4. 当前正在打开的章节需要同步编辑器显示。
5. 每章失败单独记录，不中断整个批量流程。

状态显示：

```text
第 4/20 章生成中...
第 4/20 章自动润色中...
第 4/20 章润色完成，已保存
```

验收：

```text
批量生成结束后，每章保存的是润色版
某章润色失败时保留原始生成稿
批量流程不会卡在确认弹窗
```

### 阶段 7：提示词与正则配置

目标文件：

```text
assets/js/modules_split/creative/creative_core.js
assets/js/modules_split/writer/writer_polish.js
```

动作：

1. 增加 `writer_polish` 的代码级 fallback 模板。
2. 支持从 `settings.writer_polish_recipe` 读取用户正则。
3. 用户贴出的正则按用途分到：

```text
preRegexRules：输入前清洗
postRegexRules：输出后清洗
```

4. 用户贴出的提示词作为 `promptTemplate`，保留变量：

```text
{{rules}}
{{title}}
{{outline}}
{{context}}
{{input}}
```

5. 如果用户提示词缺少 `{{input}}`，保存时拒绝或自动补齐，防止模型没有正文可润色。

验收：

```text
没有自定义提示词时也能润色
有自定义提示词时按用户版本执行
错误正则不会让整章内容清空
```

### 阶段 8：验证

静态验证：

```text
检查 index.html script 顺序，writer_polish.js 必须在 writer_ai.js 后可用或在调用前加载
检查所有新增函数挂在 Modules.writer 上
检查没有破坏原有按钮 onclick
```

浏览器验证：

1. 打开：

```text
msedge --app="file:///F:/长篇修改专用项目文件夹/长篇/index.html"
```

2. 手动建立一章长正文。
3. 点击润色，确认整章进入处理。
4. 接受保存后刷新页面检查内容。
5. 开启自动润色，点击 AI续写。
6. 观察状态是否经历“生成中 → 润色中 → 输出润色版”。
7. 确认没有先显示原始稿。
8. 运行当前章自动生成。
9. 运行范围批量生成小样本。

模拟测试：

1. 临时 mock `AI.generate()` 返回固定原始稿。
2. 校验自动润色开启时编辑器最终只出现润色稿。
3. mock 润色返回空字符串，确认回退原始稿。
4. mock 超长章节，确认分块数量正确。

验收样例：

```text
原文含 6 个段落，润色后仍按 6 个段落意图组织
输出不含“以下是”“分析”“评分”“M06”“NEXUS”
自动润色失败不清空编辑器
```

## 文件改动清单

计划实施时预计涉及：

```text
assets/js/modules_split/writer/writer_polish.js
assets/js/modules_split/writer/writer_ai.js
assets/js/modules_split/writer/writer_batch.js
assets/js/modules_split/writer/writer_core.js
assets/js/modules_split/creative/creative_core.js
index.html
```

其中：

1. `writer_polish.js` 是新增服务层。
2. `index.html` 只加脚本引用。
3. `writer_ai.js` 只接入润色服务，不继续堆大量新逻辑。
4. `writer_batch.js` 只在生成后插入自动润色步骤。
5. `writer_core.js` 只做 UI 开关与设置读写。

## 回退策略

1. 自动润色默认关闭。
2. 关闭自动润色后，AI续写、融合写作、批量生成走旧链路。
3. 手动润色保留还原入口。
4. 每次接受润色后保存前，原文仍在 `_polishOriginal` 中。
5. 实施前有目录级备份，可直接回退。

## 完成定义

这个功能完成时必须同时满足：

1. 手动润色覆盖整章。
2. 手动润色可接受、保存、还原。
3. 自动润色开关持久化。
4. 自动润色开启后，AI续写先后台润色，再打字机输出润色版。
5. 批量生成可以保存润色版。
6. 用户正则和提示词有明确接入口。
7. 出错时不丢正文。
8. 默认关闭自动润色时不改变原有生成体验。
