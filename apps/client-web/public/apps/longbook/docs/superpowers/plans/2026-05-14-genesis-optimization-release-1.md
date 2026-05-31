# Genesis Optimization Release 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the first optimization pass for the Genesis long-form writing app without breaking the existing single-file HTML workflow.

**Architecture:** Keep the current global-script architecture and make narrowly scoped compatibility/safety improvements. Export additions live on `Modules.world_engine`; UI entry points in writer/world call those methods. Navigation and keep-alive fixes stay in `App.nav`/global compat so every module benefits without large rewrites.

**Tech Stack:** Static HTML, vanilla JavaScript global modules, IndexedDB via `DB`, browser download via `Blob`/`URL.createObjectURL`, local file execution.

---

## File Structure

- Modify: `F:\长篇修改专用项目文件夹\长篇\assets\js\core\app.js`
  - Add `Navigation.show` compatibility after `App` exists.
  - Add keep-alive visibility attributes (`display`, `aria-hidden`, `inert`) inside `App.nav`.
- Modify: `F:\长篇修改专用项目文件夹\长篇\assets\js\core\ai.js`
  - Remove active built-in API key risk by making the built-in config an unconfigured placeholder.
  - Preserve `AI.getConfig()` and user API pool behavior.
- Modify: `F:\长篇修改专用项目文件夹\长篇\assets\js\modules_split\world\world_graph.js`
  - Add project-scoped export helpers.
  - Add `Modules.world_engine.exportNovelTxt()`.
  - Update `exportAll()` to project-filter volumes/chapters/outlines/writings/cycles while keeping output structure and filename.
- Modify: `F:\长篇修改专用项目文件夹\长篇\assets\js\modules_split\writer\writer_core.js`
  - Replace single export button with a compact dropdown/split export control.
- Modify: `F:\长篇修改专用项目文件夹\长篇\assets\js\modules_split\world\world_core.js`
  - Replace single world-engine export button with matching dropdown/split export control.
- Modify: `F:\长篇修改专用项目文件夹\长篇\css\mobile.css` or `F:\长篇修改专用项目文件夹\长篇\assets\css\style.css` only if needed after inspecting the top bar overlap.

---

### Task 1: App Compatibility And Keep-Alive Hygiene

**Files:**
- Modify: `F:\长篇修改专用项目文件夹\长篇\assets\js\core\app.js`

- [ ] **Step 1: Inspect `App.nav` and global function footer**

Read around `App.nav` and the end of `app.js`.

Run:

```powershell
Get-Content -LiteralPath assets\js\core\app.js -Encoding utf8 | Select-Object -Skip 360 -First 180
```

Expected: see `App.nav` hiding `vp.children` and `window.onload = App.init`.

- [ ] **Step 2: Add hidden-view attributes**

In `App.nav`, when hiding all existing views, set:

```js
child.style.display = 'none';
child.setAttribute('aria-hidden', 'true');
child.inert = true;
```

When showing the requested view, set:

```js
view.style.display = 'block';
view.setAttribute('aria-hidden', 'false');
view.inert = false;
```

- [ ] **Step 3: Add Navigation compatibility**

After the `App` object is defined and before `window.onload = App.init`, add:

```js
window.Navigation = window.Navigation || {
    show(mod) {
        if (typeof App !== 'undefined' && App.nav) App.nav(mod);
    }
};
```

- [ ] **Step 4: Verify references**

Run:

```powershell
rg -n "Navigation\.show|window\.Navigation|aria-hidden|inert" assets\js\core\app.js assets\js\modules_split -g "!*.min.js"
```

Expected: `Navigation.show` callers still exist, and `window.Navigation` exists once in `app.js`.

---

### Task 2: Export Dropdown And Full Novel TXT

**Files:**
- Modify: `F:\长篇修改专用项目文件夹\长篇\assets\js\modules_split\world\world_graph.js`
- Modify: `F:\长篇修改专用项目文件夹\长篇\assets\js\modules_split\writer\writer_core.js`
- Modify: `F:\长篇修改专用项目文件夹\长篇\assets\js\modules_split\world\world_core.js`

- [ ] **Step 1: Add pure export helpers**

In `world_graph.js`, inside `Object.assign(Modules.world_engine, { ... })`, add helper methods before `exportAll`:

```js
async _getCurrentProjectExportScope() {
    const project = (typeof GenesisCore !== 'undefined' && GenesisCore.getActiveProject)
        ? await GenesisCore.getActiveProject()
        : null;
    const projectId = project?.id || null;
    const scope = rows => (typeof GenesisCore !== 'undefined' && GenesisCore.filterProjectItems && projectId)
        ? GenesisCore.filterProjectItems(rows || [], projectId)
        : (rows || []);
    const [volumesRaw, chaptersRaw, outlinesRaw, writingsRaw, cyclesRaw] = await Promise.all([
        DB.getAll('volumes').catch(() => []),
        DB.getAll('chapters').catch(() => []),
        DB.getAll('outlines').catch(() => []),
        DB.getAll('writings').catch(() => []),
        DB.getAll('cycles').catch(() => [])
    ]);
    const volumes = scope(volumesRaw).slice().sort((a, b) => (a.order || 0) - (b.order || 0) || (a.createdAt || 0) - (b.createdAt || 0) || String(a.id || '').localeCompare(String(b.id || '')));
    const chapters = scope(chaptersRaw).slice().sort((a, b) => (a.order || a.number || 0) - (b.order || b.number || 0) || (a.createdAt || 0) - (b.createdAt || 0) || String(a.id || '').localeCompare(String(b.id || '')));
    const outlines = scope(outlinesRaw);
    const writings = scope(writingsRaw);
    const cycles = scope(cyclesRaw);
    return { project, projectId, volumes, chapters, outlines, writings, cycles };
},

_safeExportFilename(name) {
    return String(name || '未命名项目').replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim() || '未命名项目';
},

_buildNovelTxt(project, volumes, chapters) {
    const projectName = project?.name || '未命名项目';
    const chaptersWithText = (chapters || []).filter(ch => (ch.content || '').trim());
    const totalWords = chaptersWithText.reduce((sum, ch) => sum + (ch.content || '').length, 0);
    const lines = [];
    lines.push(`《${projectName}》`, '');
    lines.push(`导出时间：${new Date().toLocaleString('zh-CN')}`);
    lines.push(`章节数：${chapters.length}`);
    lines.push(`正文字数：${totalWords}`, '');
    lines.push('============================================================', '');
    const volumeMap = new Map((volumes || []).map(v => [v.id, v]));
    let lastVolumeId = null;
    chapters.forEach(ch => {
        const volumeId = ch.volumeId || '';
        if (volumeId && volumeId !== lastVolumeId) {
            const vol = volumeMap.get(volumeId);
            lines.push(vol?.title || vol?.name || '未命名卷', '');
            lastVolumeId = volumeId;
        }
        lines.push(`第${ch.order || ch.number || '?'}章 ${ch.title || '未命名'}`, '');
        const content = (ch.content || '').trim();
        if (content) lines.push(content, '');
        lines.push('');
    });
    return lines.join('\n').replace(/\n{4,}/g, '\n\n\n').trim() + '\n';
},
```

- [ ] **Step 2: Add `exportNovelTxt`**

Still in `world_graph.js`, add:

```js
exportNovelTxt: async () => {
    const we = Modules.world_engine;
    const { project, volumes, chapters } = await we._getCurrentProjectExportScope();
    if (!project) return UI.toast('请先创建或选择一个项目', 'warning');
    if (!chapters.length) return UI.toast('当前项目暂无章节正文可导出', 'warning');
    if (!chapters.some(ch => (ch.content || '').trim())) return UI.toast('当前项目章节暂无正文内容', 'warning');
    const txt = we._buildNovelTxt(project, volumes, chapters);
    const filename = `${we._safeExportFilename(project.name)}_整本正文_${new Date().toISOString().slice(0, 10)}.txt`;
    if (Utils.download) Utils.download(filename, txt, 'text/plain;charset=utf-8');
    UI.toast('已导出整本正文 TXT');
},
```

- [ ] **Step 3: Project-filter existing `exportAll` collections**

Replace the current direct `Promise.all(DB.getAll(...))` block in `exportAll` with:

```js
const { project: activeProject, volumes, chapters, outlines, writings, cycles } = await we._getCurrentProjectExportScope();
```

Keep the rest of Markdown output structure and filename unchanged.

- [ ] **Step 4: Add dropdown render helper**

Add a small helper in `world_graph.js`:

```js
renderExportMenu(label = '导出工程', fullWidth = false) {
    const widthClass = fullWidth ? 'w-full' : '';
    return `
    <div class="relative inline-block ${widthClass}" data-export-menu-root>
        <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30 ${widthClass} font-bold" onclick="Modules.world_engine.toggleExportMenu(this)">
            <i class="fa-solid fa-download mr-1"></i>${label}<i class="fa-solid fa-chevron-down ml-1 text-[9px]"></i>
        </button>
        <div class="hidden absolute right-0 bottom-full mb-1 min-w-[160px] rounded-lg border border-white/10 bg-[#111113] shadow-2xl z-[80] overflow-hidden" data-export-menu>
            <button class="w-full text-left px-3 py-2 text-[11px] text-white hover:bg-white/10" onclick="Modules.world_engine.closeExportMenus();Modules.world_engine.exportAll()">导出工程 Markdown</button>
            <button class="w-full text-left px-3 py-2 text-[11px] text-amber-300 hover:bg-white/10" onclick="Modules.world_engine.closeExportMenus();Modules.world_engine.exportNovelTxt()">导出整本正文 TXT</button>
        </div>
    </div>`;
},

toggleExportMenu(btn) {
    const root = btn?.closest?.('[data-export-menu-root]');
    const menu = root?.querySelector?.('[data-export-menu]');
    if (!menu) return;
    const willShow = menu.classList.contains('hidden');
    this.closeExportMenus();
    menu.classList.toggle('hidden', !willShow);
},

closeExportMenus() {
    document.querySelectorAll('[data-export-menu]').forEach(el => el.classList.add('hidden'));
},
```

- [ ] **Step 5: Replace writer button**

In `writer_core.js`, replace the existing single `导出工程` button with:

```js
${Modules.world_engine?.renderExportMenu ? Modules.world_engine.renderExportMenu('导出工程') : `<button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30" onclick="Modules.world_engine?.exportAll?.()" title="导出世界引擎、细纲和正文"><i class="fa-solid fa-download mr-1"></i>导出工程</button>`}
```

- [ ] **Step 6: Replace world button**

In `world_core.js`, replace the existing single `一键导出工程` button with:

```js
${Modules.world_engine.renderExportMenu ? Modules.world_engine.renderExportMenu('一键导出工程', true) : `<button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30 w-full font-bold" onclick="Modules.world_engine.exportAll()"><i class="fa-solid fa-download mr-1"></i>一键导出工程</button>`}
```

- [ ] **Step 7: Verify references**

Run:

```powershell
rg -n "exportNovelTxt|renderExportMenu|toggleExportMenu|导出整本正文 TXT|_getCurrentProjectExportScope" assets\js\modules_split\world assets\js\modules_split\writer
```

Expected: methods exist in `world_graph.js`, UI references exist in writer/world files.

---

### Task 3: Remove Built-In API Key Risk

**Files:**
- Modify: `F:\长篇修改专用项目文件夹\长篇\assets\js\core\ai.js`

- [ ] **Step 1: Inspect built-in config**

Run:

```powershell
Get-Content -LiteralPath assets\js\core\ai.js -Encoding utf8 | Select-Object -First 80
```

Expected: `AI.BUILTIN_CONFIG` exists near the top.

- [ ] **Step 2: Replace sensitive defaults with placeholder**

Set built-in config to a disabled placeholder with no real key:

```js
BUILTIN_CONFIG: {
    id: 'builtin_unconfigured',
    name: '默认主控（未配置）',
    provider: 'custom',
    baseURL: '',
    apiKey: '',
    model: '',
    type: 'text',
    role: 'main',
    enabled: false,
    builtin: true,
    unconfigured: true
},
```

Do not change user API pool loading logic.

- [ ] **Step 3: Verify no known sensitive literals remain**

Run:

```powershell
rg -n "apiKey:\s*'[^']+|sk-|dashscope|Bearer|AwkenDawn2026Token" assets\js\core\ai.js assets\js\core\license-core.js
```

Expected: no real API key in `ai.js`; license token may still appear in `license-core.js` because license hardening is not part of this task.

---

### Task 4: Top Bar Click-Through Safety

**Files:**
- Inspect/Modify if needed: `F:\长篇修改专用项目文件夹\长篇\index.html`
- Inspect/Modify if needed: `F:\长篇修改专用项目文件夹\长篇\assets\css\style.css`
- Inspect/Modify if needed: `F:\长篇修改专用项目文件夹\长篇\css\mobile.css`

- [ ] **Step 1: Locate top bar CSS and DOM**

Run:

```powershell
rg -n "topBar|topMemberQuota|top-member|member-quota|pointer-events|z-index" index.html assets\css css assets\js -g "!*.min.js"
```

- [ ] **Step 2: Apply minimal CSS fix if overlap is caused by pointer capture**

If a full-width top bar overlay captures clicks, make only the non-interactive wrapper click-through and keep buttons interactive:

```css
#topBar {
    pointer-events: none;
}

#topBar button,
#topBar a,
#topBar [onclick],
#topBar input,
#topBar select {
    pointer-events: auto;
}
```

Only add this if inspection confirms `#topBar` is the overlay. Otherwise document the actual selector and use the same pattern.

- [ ] **Step 3: Verify selector presence**

Run:

```powershell
rg -n "pointer-events: none|topBar|topMemberQuota" index.html assets\css css
```

Expected: if modified, a single scoped click-through fix exists.

---

### Task 5: Browser Smoke Verification

**Files:**
- No code edits.

- [ ] **Step 1: Open app**

Use Browser/Playwright to open:

```text
file:///F:/长篇修改专用项目文件夹/长篇/index.html
```

- [ ] **Step 2: Enter free mode**

Click:

```text
不登录，直接免费体验
先免费体验
```

Expected: home page opens without console errors.

- [ ] **Step 3: Verify project manager click**

Navigate to project manager and click the visible create-project entry.

Expected: create modal opens by real click, not JS evaluation.

- [ ] **Step 4: Verify export menu**

Open writer or world engine with an active project.

Expected:

- Export dropdown opens.
- `导出工程 Markdown` still calls old markdown export.
- `导出整本正文 TXT` triggers TXT download or a correct empty-state toast.

- [ ] **Step 5: Static checks**

Run:

```powershell
rg -n "Navigation\.show|window\.Navigation|exportNovelTxt|导出整本正文 TXT|BUILTIN_CONFIG|apiKey" assets\js\core assets\js\modules_split index.html -g "!*.min.js"
```

Expected: compatibility and export functions present; no real API key in `ai.js`.

