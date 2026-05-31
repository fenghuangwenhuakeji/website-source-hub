# Fusion Book Chapter Range Select Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在融合拆书配置弹窗的左书/右书章节选择区增加“起始章-结束章”数字范围选择，不影响现有全选、全不选、手动勾选、对比、拆解、循环流水线。

**Architecture:** 范围输入只作为 checkbox 批量勾选工具，不新增第二套章节状态。UI 在 `fusion_book_core.js` 配置弹窗内新增每侧的范围输入栏；行为在 `fusion_book_pipeline.js` 中新增范围应用函数，继续复用现有 `.plc-ch-left/.plc-ch-right` checkbox、`_updateConfigSummary()` 和 `startConfiguredPipeline()`。

**Tech Stack:** 原生 HTML 字符串模板、浏览器 DOM API、现有 `Modules.fusion_book` 模块、PowerShell/Node 语法检查、Playwright 浏览器验证。

---

### Spec

用户在“A 左书章节”和“B 右书章节”区域需要可以直接输入“多少到多少章”，快速选择要拆解的章节。

验收行为：

- 左书和右书各自有一组范围输入：`起始章`、`结束章`、`选择范围`。
- 输入使用 UI 上看到的 1-based 章号，例如 `10` 到 `20` 表示第 10-20 章。
- 点击“选择范围”只改变对应侧 checkbox：范围内勾选，范围外取消勾选。
- `全选`、`全不选`、手动勾选继续可用，且仍然调用 `_updateConfigSummary()` 更新底部统计。
- `startConfiguredPipeline()` 不改收集逻辑，继续从 `.plc-ch-left:checked` / `.plc-ch-right:checked` 读取章节。
- 起始/结束超出书籍范围时 clamp 到合法范围；起始大于结束时自动交换。
- 空值、非数字、没有书籍、没有章节时 toast 提示，不启动流水线，不影响现有选择。

---

### File Structure

- Modify: `F:/长篇修改专用项目文件夹/长篇/assets/js/modules_split/fusion_book/fusion_book_core.js`
  - 在配置弹窗左右章节列表上方增加范围输入控件。
  - 控件 id 使用 `plc-range-left-start` / `plc-range-left-end` / `plc-range-right-start` / `plc-range-right-end`。
  - 按钮调用 `Modules.fusion_book._plConfigSelectRange('left')` 或 `('right')`。

- Modify: `F:/长篇修改专用项目文件夹/长篇/assets/js/modules_split/fusion_book/fusion_book_pipeline.js`
  - 新增 `_plConfigSelectRange(side)`。
  - 新增 `_getRangeSelectionState(side)` 或局部辅助逻辑，按当前 DOM input 和 checkbox 数量解析。
  - 不修改 `startConfiguredPipeline()` 的章节收集方式。

---

### Task 1: Add Range Select UI

**Files:**
- Modify: `F:/长篇修改专用项目文件夹/长篇/assets/js/modules_split/fusion_book/fusion_book_core.js`

- [ ] **Step 1: Add left range controls above `#plc-left-chapters`**

Find the left chapter block and insert this between the title row and `#plc-left-chapters`:

```html
<div class="flex items-center gap-1.5 mb-2 rounded-lg border border-blue-500/10 bg-blue-500/[0.03] px-2 py-1.5">
    <input id="plc-range-left-start" type="number" min="1" inputmode="numeric" placeholder="起始章" class="w-16 bg-black/30 border border-white/10 rounded px-2 py-1 text-[10px] text-white placeholder:text-gray-500 focus:border-blue-400 outline-none">
    <span class="text-[10px] text-dim">到</span>
    <input id="plc-range-left-end" type="number" min="1" inputmode="numeric" placeholder="结束章" class="w-16 bg-black/30 border border-white/10 rounded px-2 py-1 text-[10px] text-white placeholder:text-gray-500 focus:border-blue-400 outline-none">
    <button class="ml-auto text-[10px] text-blue-300 hover:text-blue-200 hover:underline" onclick="Modules.fusion_book._plConfigSelectRange('left')">选择范围</button>
</div>
```

- [ ] **Step 2: Add right range controls above `#plc-right-chapters`**

Insert the same structure for right side, replacing ids and color:

```html
<div class="flex items-center gap-1.5 mb-2 rounded-lg border border-pink-500/10 bg-pink-500/[0.03] px-2 py-1.5">
    <input id="plc-range-right-start" type="number" min="1" inputmode="numeric" placeholder="起始章" class="w-16 bg-black/30 border border-white/10 rounded px-2 py-1 text-[10px] text-white placeholder:text-gray-500 focus:border-pink-400 outline-none">
    <span class="text-[10px] text-dim">到</span>
    <input id="plc-range-right-end" type="number" min="1" inputmode="numeric" placeholder="结束章" class="w-16 bg-black/30 border border-white/10 rounded px-2 py-1 text-[10px] text-white placeholder:text-gray-500 focus:border-pink-400 outline-none">
    <button class="ml-auto text-[10px] text-pink-300 hover:text-pink-200 hover:underline" onclick="Modules.fusion_book._plConfigSelectRange('right')">选择范围</button>
</div>
```

- [ ] **Step 3: Run syntax check**

Run:

```powershell
node --check "F:\长篇修改专用项目文件夹\长篇\assets\js\modules_split\fusion_book\fusion_book_core.js"
```

Expected: exit code `0`.

---

### Task 2: Add Range Select Behavior

**Files:**
- Modify: `F:/长篇修改专用项目文件夹/长篇/assets/js/modules_split/fusion_book/fusion_book_pipeline.js`

- [ ] **Step 1: Add `_plConfigSelectRange(side)` after `_plConfigSelectAll`**

Implementation:

```javascript
    _plConfigSelectRange(side) {
        const sideKey = side === 'right' ? 'right' : 'left';
        const startInput = document.getElementById(`plc-range-${sideKey}-start`);
        const endInput = document.getElementById(`plc-range-${sideKey}-end`);
        const boxes = Array.from(document.querySelectorAll(`.plc-ch-${sideKey}`));
        if (!boxes.length) {
            UI.toast(sideKey === 'left' ? '左书没有可选章节' : '右书没有可选章节');
            return;
        }

        const rawStart = parseInt(startInput?.value, 10);
        const rawEnd = parseInt(endInput?.value, 10);
        if (!Number.isFinite(rawStart) || !Number.isFinite(rawEnd)) {
            UI.toast('请输入起始章和结束章');
            return;
        }

        const max = boxes.length;
        let start = Math.min(Math.max(rawStart, 1), max);
        let end = Math.min(Math.max(rawEnd, 1), max);
        if (start > end) {
            const tmp = start;
            start = end;
            end = tmp;
        }

        boxes.forEach(cb => {
            const chapterNo = parseInt(cb.dataset.idx, 10) + 1;
            cb.checked = chapterNo >= start && chapterNo <= end;
        });

        if (startInput) startInput.value = String(start);
        if (endInput) endInput.value = String(end);
        this._updateConfigSummary();
        UI.toast(`${sideKey === 'left' ? '左书' : '右书'}已选择第${start}-${end}章`);
    },
```

- [ ] **Step 2: Confirm no changes to existing pipeline collection**

Ensure `startConfiguredPipeline()` still contains:

```javascript
const leftIdxs = [];
document.querySelectorAll('.plc-ch-left:checked').forEach(cb => leftIdxs.push(parseInt(cb.dataset.idx)));
const rightIdxs = [];
document.querySelectorAll('.plc-ch-right:checked').forEach(cb => rightIdxs.push(parseInt(cb.dataset.idx)));
```

- [ ] **Step 3: Run syntax check**

Run:

```powershell
node --check "F:\长篇修改专用项目文件夹\长篇\assets\js\modules_split\fusion_book\fusion_book_pipeline.js"
```

Expected: exit code `0`.

---

### Task 3: Browser Verification

**Files:**
- Verify: `F:/长篇修改专用项目文件夹/长篇/index.html`

- [ ] **Step 1: Load app**

Open:

```text
file:///F:/长篇修改专用项目文件夹/长篇/index.html
```

Expected: no console errors.

- [ ] **Step 2: DOM smoke test**

In browser console/Playwright, create test checkboxes if no books are loaded and call:

```javascript
const host = document.createElement('div');
host.innerHTML = `
  <input id="plc-range-left-start" value="2">
  <input id="plc-range-left-end" value="4">
  <input class="plc-ch-left" data-idx="0" type="checkbox">
  <input class="plc-ch-left" data-idx="1" type="checkbox">
  <input class="plc-ch-left" data-idx="2" type="checkbox">
  <input class="plc-ch-left" data-idx="3" type="checkbox">
  <input class="plc-ch-left" data-idx="4" type="checkbox">
  <span id="plc-summary"></span>
`;
document.body.appendChild(host);
Modules.fusion_book._plConfigSelectRange('left');
Array.from(document.querySelectorAll('.plc-ch-left')).map(cb => cb.checked);
```

Expected:

```javascript
[false, true, true, true, false]
```

- [ ] **Step 3: Existing behavior regression**

Call:

```javascript
Modules.fusion_book._plConfigSelectAll('left', true);
Array.from(document.querySelectorAll('.plc-ch-left')).every(cb => cb.checked);
```

Expected:

```javascript
true
```

---

### Self-Review Checklist

- [ ] Range UI exists for both left and right chapter blocks.
- [ ] Range selection only toggles existing checkboxes.
- [ ] No new persistent chapter state was introduced.
- [ ] `startConfiguredPipeline()` collection logic unchanged.
- [ ] Invalid input does not crash.
- [ ] Out-of-bounds values are clamped.
- [ ] Reversed range is swapped.
- [ ] `node --check` passes for modified files.
- [ ] Browser has no console errors.
