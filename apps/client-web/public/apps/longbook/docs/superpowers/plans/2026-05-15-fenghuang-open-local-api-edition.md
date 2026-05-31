# Fenghuang Open Local API Edition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a no-login, no-billing, no-built-in-key open local edition that keeps the existing writing workflow and lets users configure OpenAI-compatible, Anthropic, and other model providers freely.

**Architecture:** Keep the current static app and IndexedDB model pool. Add an open edition adapter that bypasses auth, membership, and activation while preserving API pool settings and existing AI request logic.

**Tech Stack:** Static HTML/JavaScript frontend, browser IndexedDB/localStorage, current `AI.buildRequest` provider logic, settings API pool.

---

### Task 1: Freeze Baseline And Create Open Source

**Files:**
- Source: `F:\长篇修改专用项目文件夹\长篇`
- Backup: `F:\长篇修改专用项目文件夹\备份\长篇_双版本会员登录充值与开放API规划前_20260515_014353`
- Create: `F:\长篇修改专用项目文件夹\版本源码\凤煌引擎_开放API本地版_20260515_014400`

- [x] **Step 1: Copy current source before modification**

Run:

```powershell
Copy-Item -LiteralPath 'F:\长篇修改专用项目文件夹\长篇' -Destination 'F:\长篇修改专用项目文件夹\版本源码\凤煌引擎_开放API本地版_20260515_014400' -Recurse -Force
```

Expected: Open local source directory exists and original `长篇` remains untouched.

### Task 2: Add Open Local Adapter

**Files:**
- Create: `F:\长篇修改专用项目文件夹\版本源码\凤煌引擎_开放API本地版_20260515_014400\assets\js\editions\fenghuang_open_local.js`
- Modify: `F:\长篇修改专用项目文件夹\版本源码\凤煌引擎_开放API本地版_20260515_014400\index.html`

- [x] **Step 1: Add adapter after `app.js`**

Add:

```html
<script src="assets/js/editions/fenghuang_open_local.js?v=fenghuang-open-local-v1"></script>
```

Expected: Adapter can override `App.init`, `Membership`, and top bar behavior after core scripts load.

- [x] **Step 2: Bypass login and billing**

Implementation responsibilities:

```javascript
App.init = async () => originalEnter();
Membership.canConsume = () => ({ allowed: true });
App.showLicenseOverlay = () => UI.toast('开放 API 本地版没有充值、会员或激活码。');
```

Expected: App enters directly without login or activation.

### Task 3: Preserve API Pool Freedom

**Files:**
- Modify: `assets\js\editions\fenghuang_open_local.js`
- Existing: `assets\js\modules_split\settings\settings_api_pool.js`

- [x] **Step 1: Keep settings API pool visible**

Expected: The `api_pool` tab remains available, and users can configure master/parse/fusion/image models.

- [x] **Step 2: Ensure OpenAI-compatible and Anthropic choices are explicit**

Implementation:

```javascript
Modules.settings.API_PROVIDERS.unshift({ id: 'openai-compatible', label: 'OpenAI 兼容', ... });
Modules.settings.API_PROVIDERS.push({ id: 'anthropic', label: 'Anthropic 协议', ... });
```

Expected: Users can clearly choose OpenAI-compatible or Anthropic protocol.

### Task 4: Add Legal Docs

**Files:**
- Create: `docs\legal\USER_AGREEMENT_OPEN_LOCAL.md`
- Create: `docs\legal\PRIVACY_POLICY_OPEN_LOCAL.md`

- [x] **Step 1: Explain local data and third-party API boundary**

Expected: Documents state that the app does not require login, does not provide a company API proxy, and user-selected API providers receive content when invoked.

### Task 5: Verify Open Local Edition

**Files:**
- Check: `index.html`
- Check: `assets\js\editions\fenghuang_open_local.js`

- [x] **Step 1: JavaScript syntax check**

Run:

```powershell
node --check 'F:\长篇修改专用项目文件夹\版本源码\凤煌引擎_开放API本地版_20260515_014400\assets\js\editions\fenghuang_open_local.js'
```

Expected: no syntax errors.

- [x] **Step 2: Browser smoke test**

Open:

```text
file:///F:/长篇修改专用项目文件夹/版本源码/凤煌引擎_开放API本地版_20260515_014400/index.html
```

Expected: The app enters without login, top bar says open edition, settings still has model/API configuration.
