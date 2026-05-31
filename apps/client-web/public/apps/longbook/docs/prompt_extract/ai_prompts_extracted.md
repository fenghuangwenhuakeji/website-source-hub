# ?????? API ??? AI ???????

- ?????`F:\长篇修改专用项目文件夹\版本源码\凤煌引擎_开放API本地版_20260515_014400`
- ?????2026/5/28 00:54:43
- ??????????????????????????? AI prompt / prompt ?? / AI ???????????????? `prompts_extracted.md`?

## ??

- AI ???/?????401 ?
- AI.generate ????249 ?
- ?????44 ?

## ????

- assets/js/modules_split/world/world_novel_import.js: 53
- assets/js/modules_split/fusion_book/fusion_book_extract.js: 44
- assets/js/modules/world_original.js: 36
- assets/js/modules_split/phoenix/phoenix_step1.js: 30
- assets/js/modules_split/world/world_core.js: 30
- assets/js/modules_split/writer/writer_polish.js: 28
- assets/js/modules_split/fusion_book/fusion_book_core.js: 17
- assets/js/modules/library_original.js: 16
- assets/js/modules/memory_ui.js: 15
- assets/js/modules/fusion_book_original.js: 12
- assets/js/modules_split/phoenix/phoenix_finish.js: 11
- assets/js/modules_split/web_chat/web_chat_core.js: 10
- assets/js/modules_split/fusion_workbench/fwb_actions.js: 9
- assets/js/modules_split/world/world_pipeline.js: 9
- assets/js/modules_split/phoenix/phoenix_core.js: 8
- assets/js/modules/phoenix_original.js: 7
- assets/js/modules_split/library/library_reader.js: 7
- assets/js/modules_split/world/world_graph.js: 7
- assets/js/modules_split/writer/writer_batch.js: 7
- assets/js/modules/rag_ui.js: 5
- assets/js/modules_split/creative/creative_brainstorm.js: 4
- assets/js/modules_split/writer/writer_tree.js: 4
- assets/js/modules/creative_original.js: 3
- assets/js/modules_split/memory/memory_core.js: 3
- assets/js/modules/fusion_workbench_original.js: 2
- assets/js/modules/tools_center_original.js: 2
- assets/js/modules/writer_original.js: 2
- assets/js/modules_split/settings/settings_core.js: 2
- assets/js/modules_split/tools_center/tools_center_core.js: 2
- assets/js/modules_split/writer/writer_core.js: 2
- assets/js/core/ai.js: 1
- assets/js/modules/memory_original.js: 1
- assets/js/modules/settings_original.js: 1
- assets/js/modules/toolbox_original.js: 1
- assets/js/modules_split/creative/creative_deai.js: 1
- assets/js/modules_split/creative/creative_deconstruct.js: 1
- assets/js/modules_split/fusion_book/fusion_book_export.js: 1
- assets/js/modules_split/project_manager/project_manager.js: 1
- assets/js/modules_split/toolbox/toolbox_tools.js: 1
- assets/js/modules_split/world/world_import.js: 1
- assets/js/modules_split/writer/writer_ai.js: 1
- assets/js/modules_split/writer/writer_polish_deepseek.js: 1
- assets/js/modules_split/writer/writer_review.js: 1
- assets/js/modules_split/writer/writer_rhythm.js: 1

## AI.generate ???

### assets/js/core/ai.js:85

```js
let cn = 0, en = 0;
        for (const ch of String(text)) {
            if (/[\u4e00-\u9fa5]/.test(ch)) cn++;
            else if (/[a-zA-Z]/.test(ch)) en += 0.3;
            else en += 0.2;
        }
        return Math.ceil(cn + en);
    },

    async generate(prompt, config = {}, onChunk) {
        // 兼容旧模块的调用顺序: AI.generate(prompt, onChunk, config)
        if (typeof config === 'function') {
            const legacyOnChunk = config;
            config = (onChunk && typeof onChunk === 'object') ? onChunk :
```

### assets/js/core/ai.js:86

```js
{
            if (/[\u4e00-\u9fa5]/.test(ch)) cn++;
            else if (/[a-zA-Z]/.test(ch)) en += 0.3;
            else en += 0.2;
        }
        return Math.ceil(cn + en);
    },

    async generate(prompt, config = {}, onChunk) {
        // 兼容旧模块的调用顺序: AI.generate(prompt, onChunk, config)
        if (typeof config === 'function') {
            const legacyOnChunk = config;
            config = (onChunk && typeof onChunk === 'object') ? onChunk : {};
            onChunk = legacyOnChunk;
        }
        conf
```

### assets/js/core/ai.js:93

```js
ig === 'function') {
            const legacyOnChunk = config;
            config = (onChunk && typeof onChunk === 'object') ? onChunk : {};
            onChunk = legacyOnChunk;
        }
        config = config || {};
        // 兼容无回调调用: const result = await AI.generate(prompt)
        if (!onChunk) {
            let fullText = '';
            await AI.generate(prompt, config, c => { fullText += c; });
            return fullText;
        }

        // 额度预检
        if (typeof Membership !== 'undefined') {
```

### assets/js/core/ai.js:96

```js
&& typeof onChunk === 'object') ? onChunk : {};
            onChunk = legacyOnChunk;
        }
        config = config || {};
        // 兼容无回调调用: const result = await AI.generate(prompt)
        if (!onChunk) {
            let fullText = '';
            await AI.generate(prompt, config, c => { fullText += c; });
            return fullText;
        }

        // 额度预检
        if (typeof Membership !== 'undefined') {
            const quotaCheck = Membership.canConsume(1);
            if (!quotaCheck.allowed) {
```

### assets/js/core/license-core.js:48

```js
const sig = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
        return Array.from(new Uint8Array(sig))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase();
    },

    // ===== 生成卡密 =====
    async generate(type, tier, serial = 1) {
        if (!this.TYPES[type]) throw new Error('无效卡密类型: ' + type);
        if (!this.TIERS[tier]) throw new Error('无效版本等级: ' + tier);
        if (serial < 1 || serial > 4095) throw new Error('序列号超出范围(1-4095)');

        const
```

### assets/js/core/license-core.js:130

```js
// 注：卡密有效期从激活时刻开始计算，不在验证时检查生成日期
        return { valid: true, info };
    },

    // ===== 批量生成 =====
    async generateBatch(type, tier, count = 1) {
        const keys = [];
        for (let i = 1; i <= count; i++) {
            const key = await this.generate(type, tier, i);
            keys.push(this.parse(key));
        }
        return keys;
    },

    // ===== 格式化显示 =====
    formatInfo(info) {
        return `${info.typeName} · ${info.tierName} · 每日${info.dailyQuota.toLocaleString()}Token · 有效期${info
```

### assets/js/modules/creative_original.js:451

```js
子和反转点`;
        const outlineEl = document.getElementById('cs-sw-outline');
        const contentEl = document.getElementById('cs-sw-content');
        if (outlineEl) outlineEl.value = '正在生成大纲...';
        try {
            let outline = '';
            await AI.generate(outlinePrompt, {}, c => { outline += c; if (outlineEl) outlineEl.value = outline; });
            this.shortDraft.outline = outline;
            const contentPrompt = `请根据以下大纲创作完整的短篇小说正文：\n\n标题：${title}\n类型：${genre}\n风格：${styleMap[style]}\n视角：${pov
```

### assets/js/modules/creative_original.js:456

```js
eMap[style]}\n视角：${povMap[pov]}\n目标字数：${target}字\n\n[大纲]\n${outline}\n\n要求：\n1. 严格按照大纲的情节走向\n2. 文笔优美，节奏紧凑\n3. 对话自然，人物鲜活\n4. 场景描写有画面感\n5. 字数接近${target}字`;
            if (contentEl) contentEl.value = '正在创作正文...';
            let content = '';
            await AI.generate(contentPrompt, {}, c => { content += c; if (contentEl) contentEl.value = content; });
            this.shortDraft.content = content;
            this._updateWC();
            UI.toast('一键成文完成！');
        } catch(e) {
            UI.toast('生成失败: ' +
```

### assets/js/modules/creative_original.js:479

```js
n\n## 三、读者画像分析\n1. 核心读者群体特征\n2. 阅读偏好和行为习惯\n3. 付费意愿和消费能力\n\n## 四、创新融合建议\n1. 可融合的其他元素\n2. 差异化创新方向\n3. 新人入场建议\n\n## 五、爆款预测\n1. 未来3个月趋势预测\n2. 潜力细分方向\n3. 风险提示\n\n## 六、实操建议\n1. 开篇设计建议\n2. 节奏把控要点\n3. 爽点密度建议`;
        try {
            let res = '';
            await AI.generate(prompt, {}, c => { res += c; el.innerHTML = typeof marked !== 'undefined' ? marked.parse(res) : res; });
            UI.toast('全维度分析完成');
        } catch(e) {
            el.innerHTML = '<div class="text-red-400">分析失败: ' + (e.message || e) + '</div
```

### assets/js/modules/creative_original.js:529

```js
rompt += `\n\n请生成${batchCount}个不同的创意版本，每个版本用"---"分隔。`;
        }
        el.innerHTML = '<div class="text-yellow-400 animate-pulse"><i class="fa-solid fa-circle-notch fa-spin mr-1"></i>灵感生成中...</div>';
        try {
            let res = '';
            await AI.generate(fullPrompt, {}, c => { 
                res += c; 
                el.innerHTML = typeof marked !== 'undefined' ? marked.parse(res) : res; 
            });
            if (!res.trim()) {
                el.innerHTML = '<div class="text-dim">（无结果，请检
```

### assets/js/modules/creative_original.js:575

```js
n\n要求：\n1. 包含开端、发展、高潮、结局四个阶段\n2. 每个阶段标注预计字数分配\n3. 明确主要角色和核心冲突\n4. 标注情绪曲线走向\n5. 结局要有余韵`;
        const el = document.getElementById('cs-sw-outline');
        if(!el) return;
        el.value = '生成中...';
        try {
            let res = '';
            await AI.generate(prompt, {}, c => { res += c; el.value = res; });
            this.shortDraft.outline = res;
            UI.toast('大纲生成完成');
        } catch(e) { el.value = '生成失败: ' + (e.message || e); }
    },

    async _aiShortWrite() {
        const d = this.sh
```

### assets/js/modules/creative_original.js:602

```js
}\n\n要求：\n1. 文笔优美，节奏紧凑\n2. 对话自然，人物鲜活\n3. 场景描写有画面感\n4. 严格按照大纲的情节走向\n5. 字数接近${target}字`;
        const el = document.getElementById('cs-sw-content');
        if(!el) return;
        el.value = '正在创作...';
        try {
            let res = '';
            await AI.generate(prompt, {}, c => { res += c; el.value = res; });
            this.shortDraft.content = res;
            this._updateWC();
            UI.toast('短篇创作完成');
        } catch(e) { el.value = '创作失败: ' + (e.message || e); }
    },

    async _aiShortConti
```

### assets/js/modules/creative_original.js:617

```js
tline') || {}).value || '';
        const prompt = `[续写任务]\n\n${outline ? '[大纲参考]\n' + outline.slice(0, 800) + '\n\n' : ''}[已有正文(最后部分)]\n...${current.slice(-1500)}\n\n请从断点处无缝续写，保持文风一致，情节紧凑，约500-800字。`;
        try {
            let res = '';
            await AI.generate(prompt, {}, c => { res += c; el.value = current + res; });
            this.shortDraft.content = el.value;
            this._updateWC();
            UI.toast('续写完成');
        } catch(e) { UI.toast('续写失败: ' + (e.message || e)); }
    },

    async _
```

### assets/js/modules/creative_original.js:632

```js
n UI.toast('正文为空');
        const prompt = `请对以下短篇小说正文进行深度润色：\n\n${content.slice(0, 5000)}\n\n要求：\n1. 提升文笔质量和表现力\n2. 优化对话的自然度\n3. 增强场景描写的画面感\n4. 保持原有情节和人物不变\n5. 修正语病和逻辑问题`;
        el.value = '润色中...';
        try {
            let res = '';
            await AI.generate(prompt, {}, c => { res += c; el.value = res; });
            this.shortDraft.content = res;
            this._updateWC();
            UI.toast('润色完成');
        } catch(e) { el.value = content; UI.toast('润色失败: ' + (e.message || e)); }
    },

    as
```

### assets/js/modules/creative_original.js:666

```js
l = document.getElementById('cs-hot-result');
        if(!el) return;
        el.innerHTML = '<div class="text-red-400 animate-pulse"><i class="fa-solid fa-circle-notch fa-spin mr-1"></i>分析中...</div>';
        try {
            let res = '';
            await AI.generate(prompt, {}, c => { res += c; el.innerHTML = typeof marked !== 'undefined' ? marked.parse(res) : res; });
            if (!res.trim()) el.innerHTML = '<div class="text-dim">（无结果，请检查API配置）</div>';
            else UI.toast('热点分析完成');
        } catch(
```

### assets/js/modules/creative_original.js:701

```js
'cs-bs-results');
        if(!el) return;
        el.innerHTML = '<div class="col-span-2 text-purple-400 animate-pulse text-center p-8"><i class="fa-solid fa-circle-notch fa-spin mr-1"></i>脑洞风暴中...</div>';
        let res = '';
        try {
            await AI.generate(prompt, {}, c => { res += c; });
        } catch(e) {
            el.innerHTML = '<div class="col-span-2 text-red-400 text-center p-8"><i class="fa-solid fa-triangle-exclamation mr-1"></i>风暴失败: ' + (e.message || e) + '</div>';
            return;
```

### assets/js/modules/creative_original.js:752

```js
if(!el) return;
        el.innerHTML = `<div class="col-span-2 text-cyan-400 animate-pulse text-center p-8"><i class="fa-solid fa-shuffle fa-spin mr-1"></i>随机碰撞: ${elemA} + ${elemB} + ${elemC}...</div>`;
        let res = '';
        try {
            await AI.generate(prompt, {}, c => { res += c; });
            let ideas = JSON.parse(res.replace(/```json?\s*/g,'').replace(/```/g,'').trim());
            this.brainStorm = ideas;
            const colors = ['cyan','teal','emerald','sky','blue'];
            el.in
```

### assets/js/modules/creative_original.js:782

```js
ementById('cs-bs-results');
        if(!el) return;
        el.innerHTML = '<div class="col-span-2 text-green-400 animate-pulse text-center p-8"><i class="fa-solid fa-dna fa-spin mr-1"></i>创意进化中...</div>';
        let res = '';
        try {
            await AI.generate(prompt, {}, c => { res += c; });
            let ideas = JSON.parse(res.replace(/```json?\s*/g,'').replace(/```/g,'').trim());
            this.brainStorm = ideas;
            const colors = ['green','emerald','lime','teal','cyan'];
            el.
```

### assets/js/modules/fusion_book_original.js:557

```js
t plOut = this._pipelineRunning ? document.getElementById('pl-output') : null;
        if (plOut) plOut.textContent = `分析${side === 'left' ? '左' : '右'}书: ${ch.title}...\n`;

        let result = '';
        let aborted = false;
        try {
            await AI.generate(prompt, {}, c => {
                result += c;
                if (outEl) outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(result) : result;
                if (plOut) plOut.textContent = result;
            });
        } catch(e) {
```

### assets/js/modules/fusion_book_original.js:616

```js
if (!prompt) prompt = this._PROMPTS.analyze;
            prompt = prompt.replace('{{book}}', book.name).replace('{{title}}', ch.title).replace('{{content}}', ch.content.slice(0, 6000));

            let result = '';
            try {
                await AI.generate(prompt, {}, c => {
                    result += c;
                    if (outEl) outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(`## ${ch.title}\n\n${result}`) : result;
                });
            } catch(e) { result = '(分析失败:
```

### assets/js/modules/fusion_book_original.js:656

```js
const outEl = document.getElementById('fb-output');
        if (outEl) outEl.innerHTML = '<div class="text-purple-400 animate-pulse"><i class="fa-solid fa-spinner fa-spin mr-2"></i>正在对比...</div>';

        let result = '';
        try {
            await AI.generate(prompt, {}, c => {
                result += c;
                if (outEl) outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(result) : result;
            });
        } catch(e) { UI.toast('对比出错: ' + e.message); }

        this._pipeli
```

### assets/js/modules/fusion_book_original.js:698

```js
s="fa-solid fa-spinner fa-spin mr-2"></i>正在对比...</div>';

        const plOut = this._pipelineRunning ? document.getElementById('pl-output') : null;
        if (plOut) plOut.textContent = '对比分析中...\n';

        let result = '';
        try {
            await AI.generate(prompt, {}, c => {
                result += c;
                if (outEl) outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(result) : result;
                if (plOut) plOut.textContent = result;
            });
        } catch(e) {
```

### assets/js/modules/fusion_book_original.js:760

```js
s="fa-solid fa-spinner fa-spin mr-2"></i>正在融合...</div>';

        const plOut = this._pipelineRunning ? document.getElementById('pl-output') : null;
        if (plOut) plOut.textContent = '融合精华中...\n';

        let result = '';
        try {
            await AI.generate(prompt, {}, c => {
                result += c;
                if (outEl) outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(result) : result;
                if (plOut) plOut.textContent = result;
            });
        } catch(e) {
```

### assets/js/modules/fusion_book_original.js:1980

```js
联)】\n${existingNames.slice(0,50).join('、')}` : '';

        const outEl = document.getElementById('pl-output');
        if (outEl) outEl.textContent = '正在提取融合细纲中的实体...';
        this._setGenerating(true);

        let raw = '';
        try {
            await AI.generate(
                `你是深度实体提取引擎。\n【核心任务】从以下融合细纲中提取所有原创实体和世界观元素。\n\n【数据来源说明】\n以下内容是一份基于两书技法融合而成的全新网文细纲。\n细纲中的角色、物品、地点、势力等全部是原创的，不是原书中的任何内容。\n你的任务是从这份原创细纲中提取构建世界引擎所需的实体。\n\n${sourceText}\n${existingHint}

【提取铁律】\n1. 提取的是融合细纲中的原创实体，不是原书内容\n2. 尽可能完整地提取角色关
```

### assets/js/modules/fusion_book_original.js:2323

```js
} catch(e) { console.warn('一致性上下文构建失败:', e); }

        const outEl = document.getElementById('pl-output');
        if (outEl) outEl.textContent = '正在生成细纲...\n';
        this._setGenerating(true);

        let result = '';
        try {
            await AI.generate(prompt, {}, c => {
                result += c;
                if (outEl) outEl.textContent = result;
                const fbOut = document.getElementById('fb-output');
                if (fbOut) fbOut.innerHTML = typeof marked !== 'undefined' ?
```

### assets/js/modules/fusion_book_original.js:2414

```js
en-400 animate-pulse"><i class="fa-solid fa-spinner fa-spin mr-2"></i>正在创作正文...</div>';

        const plOut = document.getElementById('pl-output');
        if (plOut) plOut.textContent = '正文创作中...\n';

        let result = '';
        try {
            await AI.generate(prompt, {}, c => {
                result += c;
                if (outEl) outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(result) : result;
                if (plOut) plOut.textContent = result;
            });
        } catch(e) {
```

### assets/js/modules/fusion_book_original.js:2641

```js
段原创细纲（新角色、新情节，展示技法运用）
9. 【下一循环优化建议】针对下${cycleSize}章的技法提升建议
10. 【可复用套路清单(零件库)】3-5个可直接套用的写作模板，每个含:名称+适用场景+执行步骤

只输出技法总结和原创细纲片段，严禁涉及原书的具体角色和情节。`;

        this._plSetStep('fusion', 'active', '循环深度融合中...');
        let result = '';
        try {
            await AI.generate(cycleFusionPrompt, {}, c => {
                result += c;
                const outEl = document.getElementById('pl-output');
                if (outEl) outEl.textContent = result;
            });
        } catch (e) {
            if (e.message ==
```

### assets/js/modules/fusion_book_original.js:2757

```js
urn results;
    },

    async _cycleExtractPatterns(startIdx, endIdx, fusionResult) {
        if (!fusionResult || fusionResult.length < 500) return;

        this._plLog(`📝 提取循环可复用模式...`, 'info');

        let patterns = '';
        try {
            await AI.generate(
                `从以下循环融合总结中提取可复用的写作模式和模板，以JSON格式输出：

${fusionResult.slice(0, 3000)}

输出格式：
{
  "hooks": ["开篇钩子模板1", "开篇钩子模板2"],
  "rhythms": ["节奏控制模板1", "节奏控制模板2"],
  "coolPoints": ["爽点设计模板1", "爽点设计模板2"],
  "suspenses": ["悬念布局模板1", "悬念布局模板2"],
  "
```

### assets/js/modules/library_original.js:735

```js
-500"></i>正在${typeNames[type] || '分析'}...</div>`;
        log.scrollTop = log.scrollHeight;

        // IO 调试
        const ioIn = document.getElementById('rc-io-in');
        if (ioIn) ioIn.value = finalPrompt;

        try {
            const result = await AI.generate(finalPrompt);
            const ioOut = document.getElementById('rc-io-out');
            if (ioOut) ioOut.value = result;
            log.innerHTML += `
                <div class="p-2 bg-gradient-to-br from-amber-900/10 to-transparent border bord
```

### assets/js/modules/library_original.js:765

```js
const log = document.getElementById('rc-ai-log');
        log.innerHTML += `<div class="p-2 bg-white/5 rounded text-[10px] text-dim"><i class="fa-solid fa-spinner fa-spin mr-1"></i>${tool.name}...</div>`;
        try {
            const result = await AI.generate(prompt);
            log.innerHTML += `<div class="p-2 bg-white/5 rounded text-[10px] text-gray-300"><div class="text-amber-500 font-bold text-[9px] mb-1">${tool.name}</div><div class="whitespace-pre-wrap">${result}</div></div>`;
        } catch (e
```

### assets/js/modules/library_original.js:790

```js
Context = RC.currentBook ? RC.currentBook.content.slice(0, 4000) : '';
        const prompt = bookContext
            ? `你是一个智能阅读助手。以下是用户正在阅读的文本：\n\n${bookContext}\n\n用户问题：${msg}\n\n请基于文本内容回答。`
            : msg;
        try {
            const result = await AI.generate(prompt);
            const typing = document.getElementById('rc-chat-typing');
            if (typing) typing.remove();
            log.innerHTML += `<div class="flex"><div class="bg-white/5 border border-white/5 rounded-lg px-3 py-1.5 text-xs text
```

### assets/js/modules/library_original.js:843

```js
at: async () => {
        const input = document.getElementById('rc-ty-in');
        if (!input || !input.value.trim()) return UI.toast('请先输入文本');
        const raw = input.value;
        UI.toast('AI 排版优化中...');
        try {
            const result = await AI.generate(`请对以下文本进行排版优化，包括：合理分段、添加标点、修正格式、统一引号。只返回优化后的文本，不要解释：\n\n${raw}`);
            input.value = result;
            Modules.reader_center.renderTypesetPage();
            UI.toast('排版优化完成');
        } catch (e) { UI.toast('AI 排版失败'); }
    },

    rend
```

### assets/js/modules/library_original.js:1062

```js
- 地点：重要场景、城市、秘境
- 势力：门派、组织、家族
- 魔法：功法、技能、特殊能力
- 情节：关键事件、转折点

输出格式（严格JSON）：
{
  "人物": [{"name":"名称", "desc":"简短描述"}],
  "物品": [...],
  "地点": [...],
  "势力": [...],
  "魔法": [...],
  "情节": [...]
}

只输出JSON，不要其他内容。`;

        try {
            const result = await AI.generate(prompt);
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const entities = JSON.parse(jsonMatch[0]);
                const flatEntities = [];
                for (const [type, items] of Object.
```

### assets/js/modules/library_original.js:1336

```js
text}`,
            nexus: `请将以下文本按照 NEXUS OS 协议进行标注分析：\n- CHR：涉及的角色及其状态变化\n- WLD：体现的世界规则或设定\n- FOE：埋下的伏笔或悬念\n- EMO：情绪锚点和氛围营造\n\n文本：\n${text}`
        };
        const prompt = prompts[mode] || prompts.technique;
        try {
            const result = await AI.generate(prompt);
            body.innerHTML = typeof marked !== 'undefined' ? marked.parse(result) : result;
        } catch (e) {
            body.innerHTML = `<div class="text-red-400">分析失败: ${e.message || '未知错误'}</div>`;
        }
    },

    sendToFusi
```

### assets/js/modules/library_original.js:1520

```js
Id('rc-ai-log');
        if (log) {
            log.innerHTML += `<div class="p-2 bg-white/5 rounded text-[10px] text-dim"><i class="fa-solid fa-spinner fa-spin mr-1 text-amber-500"></i>智能分析中...</div>`;
        }
        try {
            const result = await AI.generate(prompt);
            if (log) {
                log.innerHTML += `
                    <div class="p-2 bg-gradient-to-br from-purple-900/20 to-transparent border border-purple-500/20 rounded-lg text-[10px] text-gray-300 leading-relaxed">
```

### assets/js/modules/library_original.js:1555

```js
ById('rc-ai-log');
        if (log) {
            log.innerHTML += `<div class="p-2 bg-white/5 rounded text-[10px] text-dim"><i class="fa-solid fa-spinner fa-spin mr-1 text-amber-500"></i>提取中...</div>`;
        }
        try {
            const result = await AI.generate(prompt);
            if (Modules.phoenix) {
                Modules.phoenix.data.outlineRaw = result;
                UI.toast('已提取到凤凰创作流');
            }
            if (log) {
                log.innerHTML += `
                    <div class="p-2
```

### assets/js/modules/library_original.js:1633

```js
ckTranslate: async () => {
        const RC = Modules.reader_center;
        const sel = window.getSelection();
        const text = sel ? sel.toString().trim() : '';
        if (!text) return UI.toast('请先选择文本');
        try {
            const result = await AI.generate(`翻译以下中文为英文，保持文学性：\n\n${text}`);
            UI.toast(result, 3000);
        } catch (e) {
            UI.toast('翻译失败');
        }
    },

    quickExplain: async () => {
        const RC = Modules.reader_center;
        const sel = window.getSelect
```

### assets/js/modules/library_original.js:1652

```js
ById('rc-ai-log');
        if (log) {
            log.innerHTML += `<div class="p-2 bg-white/5 rounded text-[10px] text-dim"><i class="fa-solid fa-spinner fa-spin mr-1 text-amber-500"></i>解释中...</div>`;
        }
        try {
            const result = await AI.generate(prompt);
            if (log) {
                log.innerHTML += `
                    <div class="p-2 bg-white/5 border border-white/10 rounded-lg text-[10px] text-gray-300 leading-relaxed">
                        <div class="text-amber-400 font-
```

### assets/js/modules/library_original.js:1681

```js
ById('rc-ai-log');
        if (log) {
            log.innerHTML += `<div class="p-2 bg-white/5 rounded text-[10px] text-dim"><i class="fa-solid fa-spinner fa-spin mr-1 text-amber-500"></i>续写中...</div>`;
        }
        try {
            const result = await AI.generate(prompt);
            if (log) {
                log.innerHTML += `
                    <div class="p-2 bg-gradient-to-br from-cyan-900/20 to-transparent border border-cyan-500/20 rounded-lg text-[10px] text-gray-300 leading-relaxed">
```

### assets/js/modules/library_original.js:2096

```js
><i class="fa-solid fa-circle-notch fa-spin text-blue-400"></i> <span class="text-blue-300">智能体思考中...</span></div></div></div>`;
                        msgsEl.scrollTop = msgsEl.scrollHeight;
                        result = '';
                        await AI.generate(agentPrompt, {}, c => {
                            result += c;
                            const bodyEl = document.getElementById(streamId + '-body');
                            if (bodyEl) bodyEl.innerHTML = typeof marked !== 'undefined' ? mark
```

### assets/js/modules/library_original.js:2199

```js
"></i></div><div class="flex-1 max-w-[85%]"><div class="bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-gray-300 leading-relaxed" id="${streamBodyId}"><i class="fa-solid fa-ellipsis fa-beat-fade"></i> 思考中...</div></div>`;

            await AI.generate(fullPrompt, {}, c => {
                result += c;
                const sEl = document.getElementById(streamBodyId);
                if (sEl) sEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(result) : result;
                msgsEl.sc
```

### assets/js/modules/memory_original.js:100

```js
mpressWorking() {
        if (this.working.length < 5) return null;
        const allText = this.working.map(m => `[${m.type}/P${m.priority}${m.module ? '/' + m.module : ''}] ${m.content}`).join('\n');
        let summary = '';
        try {
            await AI.generate(
                `你是记忆压缩引擎。将以下${this.working.length}条工作记忆压缩为一段精炼摘要（保留关键信息、人物、情节要点、模块来源），不超过600字：\n\n${allText}`,
                {}, c => { summary += c; }
            );
            if (summary.length > 20) {
                await this.addSession(
```

### assets/js/modules/memory_original.js:748

```js
= '';
        const allContent = [
            ...this.working.map(m => `[${m.type}/${m.module || 'general'}] ${m.content}`),
            ...persistent.slice(-20).map(m => `[${m.category}] ${m.content}`)
        ].join('\n');

        try {
            await AI.generate(
                `你是记忆压缩引擎。将以下记忆内容压缩为精炼摘要，保留关键信息、人物、情节、设定要点。按模块分类输出，不超过800字：\n\n${allContent.slice(0, 6000)}`,
                {}, c => { summary += c; }
            );

            if (summary.length > 50) {
                await this.addPersisten
```

### assets/js/modules/phoenix_original.js:600

```js
6. 种族/生物 - 特殊种族、妖兽、灵兽

【输出格式】严格JSON数组：
[
  {"name":"实体名","type":"人物|地点|势力|物品|功法|种族","desc":"一句话描述"},
  ...
]

注意：
- 只输出JSON数组，不要包裹markdown代码块
- 确保每个实体都有name、type、desc三个字段
- type必须是上述6种之一
- 不要遗漏重要实体`;

        let fullRes = '';
        try {
            await AI.generate(prompt, {}, c => { fullRes += c; });
        } catch(e) {
            return UI.toast('提取失败: ' + e.message, 'error');
        }

        let parsed = null;
        try {
            let cleanRes = fullRes.trim().replace(/^```(?:json)?\s*\n?/i, '').
```

### assets/js/modules/phoenix_original.js:955

```js
":"世界规则内容",
    "culture":"文化与习俗内容"
  },
  "summary":"世界观整体概述（100字以内）"
}

直接输出JSON，不要包裹markdown代码块。`;

        let fullRes = '';
        let charCount = 0;
        
        if (progressStatus) progressStatus.textContent = '正在调用AI解析...';
        
        await AI.generate(prompt, {}, c => {
            if (this._parseStopFlag) return;
            fullRes += c;
            charCount += c.length;
            if (progressStatus) progressStatus.textContent = `正在接收解析结果... (${charCount}字)`;
        });
        
        if
```

### assets/js/modules/phoenix_original.js:1466

```js
话描述核心卖点
5. 标注每个创意的「爆款指数」(1-10)

【输出格式】
## 创意一：标题
- 核心设定：...
- 金手指：...
- 开篇钩子：...
- 爆款指数：X/10

请直接输出5个创意。`;

        const ideaEl = document.getElementById('ph-idea');
        this.updateIO(prompt, 'AI头脑风暴中...');
        
        let result = '';
        await AI.generate(prompt, {}, c => {
            result += c;
            this.updateIO(prompt, result);
        });
        
        if (ideaEl && result) {
            ideaEl.value = (ideaEl.value || '') + '\n\n---\n【AI头脑风暴结果】\n' + result;
            this.data.id
```

### assets/js/modules/phoenix_original.js:1523

```js
指/系统设定
- 成长路线

## 世界观简述
...

## 主要人物
- 配角A：...
- 反派B：...

## 剧情规划
### 第一卷：xxx
- 核心事件
- 爽点设计
- 卷末高潮

请详细扩展。`;

        const ideaEl = document.getElementById('ph-idea');
        this.updateIO(prompt, 'AI扩展中...');
        
        let result = '';
        await AI.generate(prompt, {}, c => {
            result += c;
            this.updateIO(prompt, result);
        });
        
        if (ideaEl && result) {
            ideaEl.value = idea + '\n\n---\n【AI扩展结果】\n' + result;
            this.data.idea = ideaEl.value;
```

### assets/js/modules/phoenix_original.js:1580

```js
如何提升爆款潜质）
5. 风险提示（可能踩的坑）

【输出格式】
## 市场评估
- 热度指数：X/10
- 受众画像：...
- 竞品分析：...

## 创意亮点
1. ...
2. ...

## 潜在问题
1. ...
2. ...

## 优化建议
1. ...
2. ...

## 综合评分：X/10

请客观分析。`;

        this.updateIO(prompt, 'AI分析中...');
        
        let result = '';
        await AI.generate(prompt, {}, c => {
            result += c;
            this.updateIO(prompt, result);
        });
        
        const outlineEl = document.getElementById('ph-outline-raw');
        if (outlineEl && result) {
            outlineEl.value = '【创意分析
```

### assets/js/modules/phoenix_original.js:1787

```js
有完整的主线悬念链和伏笔回收计划
9. 升级体系要清晰，每次突破都要有仪式感和爽感`;

        const el = document.getElementById('ph-outline-raw');
        if (el) el.value = '';
        this.updateIO(prompt, '融合技法驱动生成中...');
        this._setGenerating(true);
        let fullRes = '';
        await AI.generate(prompt, {}, c => {
            fullRes += c;
            if (el) el.value = fullRes;
            this.data.outlineRaw = fullRes;
            this.updateIO(prompt, fullRes);
            this._updateStats();
            this._updateGenProgress(fullRe
```

### assets/js/modules/phoenix_original.js:1867

```js
{genre}}', genre).replace('{{style}}', style)}`;

        const el = document.getElementById('ph-outline-raw');
        if (el) el.value = '';
        this.updateIO(prompt, '生成中...');
        this._setGenerating(true);

        let fullRes = '';
        await AI.generate(prompt, {}, c => {
            fullRes += c;
            if (el) el.value = fullRes;
            this.data.outlineRaw = fullRes;
            this.updateIO(prompt, fullRes);
            this._updateStats();
        });
        this._setGenerating(fa
```

### assets/js/modules/phoenix_original.js:1917

```js
ext) prompt += '[世界观设定]\n' + this.data.worldContext.slice(0, 1500) + '\n\n';
        prompt += `[已有细纲末尾]\n${current.slice(-3000)}\n\n请从断点处直接继续，不要任何开场白或解释，直接输出后续的卷章内容：`;

        this.updateIO(prompt, '续写中...');
        this._setGenerating(true);
        await AI.generate(prompt, {}, c => {
            const el = document.getElementById('ph-outline-raw');
            if (el) { el.value += c; el.scrollTop = el.scrollHeight; }
            this.data.outlineRaw = el ? el.value : '';
            this._updateGenProgress(e
```

### assets/js/modules/phoenix_original.js:1942

```js
${current.slice(0,6000)}\n\n请输出优化后的完整细纲，保持原有格式。`;
        const el = document.getElementById('ph-outline-raw');
        if(el) el.value = '';
        this.updateIO(prompt, '迭代优化中...');
        this._setGenerating(true);
        let fullRes = '';
        await AI.generate(prompt, {}, c => {
            fullRes += c;
            if(el) el.value = fullRes;
            this.data.outlineRaw = fullRes;
            this._updateStats();
        });
        this._setGenerating(false);
        UI.toast('迭代优化完成');
    },
```

### assets/js/modules/phoenix_original.js:2012

```js
当前细纲]\n${current.slice(0,6000)}\n\n请输出扩展后的完整细纲。`;
        const el = document.getElementById('ph-outline-raw');
        if(el) el.value = '';
        this.updateIO(prompt, '扩展细化中...');
        this._setGenerating(true);
        let fullRes = '';
        await AI.generate(prompt, {}, c => {
            fullRes += c;
            if(el) el.value = fullRes;
            this.data.outlineRaw = fullRes;
            this._updateStats();
        });
        this._setGenerating(false);
        UI.toast('扩展细化完成');
    },
```

### assets/js/modules/phoenix_original.js:2051

```js
const el = document.getElementById('ph-outline-raw') || document.getElementById('ph-outline-edit');
        if(el) el.value = '';
        this.updateIO(prompt, '融合技法润色中...');
        this._setGenerating(true);
        let fullRes = '';
        await AI.generate(prompt, {}, c => {
            fullRes += c;
            if(el) { el.value = fullRes; }
            this.data.outlineRaw = fullRes;
            this._updateStats();
        });
        this._setGenerating(false);
        UI.toast('融合技法润色完成');
    }
```

### assets/js/modules/phoenix_original.js:2103

```js
【输出格式】
## 节奏曲线图
(用文字描述节奏走势)

## 章节节奏表
| 章节 | 紧张度 | 类型 | 问题 |
|------|--------|------|------|

## 高潮分布
- 主要高潮：第X章、第Y章...
- 次要高潮：...

## 问题诊断
1. ...
2. ...

## 优化建议
1. ...
2. ...`;

        this.updateIO(prompt, '分析中...');
        let result = '';
        await AI.generate(prompt, {}, c => {
            result += c;
            this.updateIO(prompt, result);
        });
        
        const el = document.getElementById('ph-outline-raw');
        if (el) {
            el.value = current + '\n\n---\n\n【节奏分析报告】\n' + r
```

### assets/js/modules/phoenix_original.js:2159

```js
未回收、突兀出现）

【输出格式】
## 发现的问题 (共X个)

### 问题1：[问题类型]
- 位置：第X章
- 描述：...
- 严重程度：高/中/低
- 修复建议：...

### 问题2：...

## 总体评估
- 逻辑完整性：X/10
- 人物一致性：X/10
- 设定自洽性：X/10

## 优先修复建议
1. ...
2. ...`;

        this.updateIO(prompt, '检测中...');
        let result = '';
        await AI.generate(prompt, {}, c => {
            result += c;
            this.updateIO(prompt, result);
        });
        
        const el = document.getElementById('ph-outline-raw');
        if (el) {
            el.value = current + '\n\n---\n\n【漏洞检测报告】\n' + r
```

### assets/js/modules/phoenix_original.js:2206

```js
：
**章末钩子：** [钩子内容] (类型：悬念/反转/期待)

请输出强化后的完整细纲。`;

        const el = document.getElementById('ph-outline-raw');
        if (el) el.value = '';
        this.updateIO(prompt, '强化钩子中...');
        this._setGenerating(true);
        let result = '';
        await AI.generate(prompt, {}, c => {
            result += c;
            if (el) el.value = result;
            this.data.outlineRaw = result;
            this._updateStats();
            this.updateIO(prompt, result);
        });
        this._setGenerating(false)
```

### assets/js/modules/phoenix_original.js:2250

```js
】** [高潮内容] (类型：打脸/突破/战斗/揭秘/情感)

请输出添加高潮后的完整细纲。`;

        const el = document.getElementById('ph-outline-raw');
        if (el) el.value = '';
        this.updateIO(prompt, '添加高潮中...');
        this._setGenerating(true);
        let result = '';
        await AI.generate(prompt, {}, c => {
            result += c;
            if (el) el.value = result;
            this.data.outlineRaw = result;
            this._updateStats();
            this.updateIO(prompt, result);
        });
        this._setGenerating(false)
```

### assets/js/modules/phoenix_original.js:2274

```js
mpt = `[你是一位资深小说策划，精通融合技法，正在帮助作者打磨大纲]\n\n${fusionCtx ? '[融合技法参考]\n' + fusionCtx.slice(0, 2000) + '\n\n' : ''}[当前大纲]\n${outline.slice(0,4000)}\n\n[作者要求]\n${txt}\n\n请根据作者要求修改或建议。如果需要修改大纲，请输出修改后的完整段落。可以引用融合技法中的具体套路来支撑你的建议。`;
        let reply = '';
        await AI.generate(contextPrompt, {}, c => { reply += c; });
        log.innerHTML += `<div class="p-2 bg-white/5 rounded-lg border border-white/5"><span class="text-green-400 font-bold text-[10px]">AI</span><div class="text-gray-300 mt-1 text-xs leading-relaxed">${r
```

### assets/js/modules/phoenix_original.js:2302

```js
xt();
        const prompt = `[你是一位资深小说策划，精通网文套路和融合技法]\n\n${fusionCtx ? '[融合技法参考]\n' + fusionCtx.slice(0, 1500) + '\n\n' : ''}[当前大纲]\n${outline.slice(0,3000)}\n\n[作者要求]\n${txt}\n\n请直接输出修改后的相关段落，不要开场白。如果要求不涉及大纲修改，给出建议即可。`;
        let reply = '';
        await AI.generate(prompt, {}, c => { reply += c; });
        log.innerHTML += `<div class="p-1.5 bg-white/5 rounded border border-white/5"><span class="text-green-400 font-bold text-[9px]">AI</span><div class="text-gray-300 mt-0.5 text-[10px] leading-relaxed">${repl
```

### assets/js/modules/phoenix_original.js:2329

```js
,4000)}\n\n[优化要求]\n${instruction}\n\n请直接输出优化后的完整大纲，保持原有格式（##卷名 / ###章名 / **情节** / **看点**）。`;
        const el = document.getElementById('ph-outline-raw');
        if (el) el.value = '';
        this._setGenerating(true);
        let result = '';
        await AI.generate(prompt, {}, c => {
            result += c;
            if (el) { el.value = result; this.data.outlineRaw = result; this._updateStats(); }
        });
        this._setGenerating(false);
        UI.toast(task + '完成');
    },

    // ===== AI润色大纲 (S
```

### assets/js/modules/phoenix_original.js:2345

```js
e-edit');
        const current = el ? el.value : '';
        if(!current) return UI.toast('大纲为空');
        const prompt = `[任务] 请润色以下小说大纲，提升文笔和表达力，但保持结构和内容不变：\n\n${current.slice(0,6000)}`;
        if(el) el.value = '';
        let fullRes = '';
        await AI.generate(prompt, {}, c => { fullRes += c; if(el) el.value = fullRes; this.updatePreview(); });
        UI.toast('大纲润色完成');
    },

    // ===== 导出到阅读 =====
    async exportToLib() {
        const content = (document.getElementById('ph-outline-raw') || {}).v
```

### assets/js/modules/phoenix_original.js:2505

```js
容",
    "geography":"地理与地貌内容",
    "magic":"魔法/科技体系内容",
    "factions":"势力与组织内容",
    "species":"种族与生物内容",
    "rules":"世界规则内容",
    "culture":"文化与习俗内容"
  },
  "summary":"世界观整体概述（100字以内）"
}

直接输出JSON，不要包裹markdown代码块。`;

        let fullRes = '';
        await AI.generate(prompt, {}, c => { fullRes += c; });

        let parsed = null;
        try {
            let cleanRes = fullRes.trim().replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '').trim();
            parsed = JSON.parse(cleanRes);
        } catc
```

### assets/js/modules/phoenix_original.js:2861

```js
;
                }
            }
        } catch(e) {
            return UI.toast('读取章节失败: ' + e.message);
        }

        if (!allContent.trim()) {
            return UI.toast('未找到指定章节内容');
        }

        let raw = '';
        try {
            await AI.generate(
                `你是深度实体提取引擎。从以下章节内容中提取所有实体。

【提取类型】
- 人物：所有角色（主角、配角、反派），含性格、身份
- 物品：道具、武器、法宝、关键物件
- 地点：地名、场景、建筑、地标
- 情节：关键事件、转折点、冲突
- 伏笔：暗示、线索、未解之谜
- 势力：门派、组织、国家、阵营、家族

【章节内容】
${allContent.slice(0, 10000)}

【输出格式】JSON数组：
[{"name":"名称","type":"人物/物
```

### assets/js/modules/phoenix_original.js:2984

```js
[];
        const existingNames = existingEntities.map(e => e.name);
        const existingHint = existingNames.length > 0 ? 
            `\n\n【已有实体(请建立关联)】\n${existingNames.slice(0, 30).join('、')}` : '';

        let raw = '';
        try {
            await AI.generate(
                `你是深度实体提取引擎。从以下章节内容中提取所有实体，并进行深度关联分析。${existingHint}

【提取类型】
- 人物：所有角色（主角、配角、反派），含性格、身份、能力
- 物品：道具、武器、法宝、关键物件
- 地点：地名、场景、建筑、地标
- 情节：关键事件、转折点、冲突
- 伏笔：暗示、线索、未解之谜
- 势力：门派、组织、国家、阵营、家族
- 种族：种族设定、族群特征

【章节内容】(共${chapterCount}章)
${allCont
```

### assets/js/modules/phoenix_original.js:3192

```js
erall_score": 85,\n  "critical_count": 0,\n  "warning_count": 0,\n  "top_fixes": ["最重要的3条修正建议"]\n}\n\n[待检细纲]\n${current.slice(0, 8000)}\n\n请只输出JSON，不要其他文字。`;

        let raw = '';
        try {
            App.showProgress('NEXUS自检', 1, 5);
            await AI.generate(prompt, (chunk) => { raw += chunk; }, { max_tokens: 4000, temperature: 0.1 });
            App.showProgress('NEXUS自检', 4, 5);

            const json = (() => { try { const m = raw.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : null; } catch(e
```

### assets/js/modules/phoenix_original.js:3272

```js
slice(0, 8000)}\n\n请输出强化后的完整细纲，在修改处用【强化】标记。`;

        const el = document.getElementById('ph-outline-raw');
        if(el) el.value = '';
        this.updateIO(prompt, 'NEXUS强化中...');
        this._setGenerating(true);
        let fullRes = '';
        await AI.generate(prompt, {}, c => {
            fullRes += c;
            if(el) el.value = fullRes;
            this.data.outlineRaw = fullRes;
            this._updateStats();
        });
        this._setGenerating(false);
        UI.toast('NEXUS强化完成', 'success'
```

### assets/js/modules/rag_original.js:444

```js
r.source] || {}).label || r.source}] ${r.title}\n${r.content}`).join('\n---\n');
        if (compress.length > 0) {
            const compressText = compress.map(r => r.content).join('\n');
            let summary = '';
            try {
                await AI.generate(
                    `你是上下文压缩引擎。将以下${compress.length}条检索结果压缩为一段精炼的创作参考，保留关键信息（人物、设定、技法要点、伏笔、情绪节奏），不超过400字：\n\n${compressText.slice(0, 4000)}`,
                    {}, c => { summary += c; }
                );
            } catch (e) {}
```

### assets/js/modules/rag_original.js:548

```js
ts || [];
        const candidates = results.slice(0, Math.min(results.length, 30));
        const list = candidates.map((r, i) => `[${i}] (${r.source}) ${r.title}: ${r.content.slice(0, 150)}`).join('\n');
        let raw = '';
        try {
            await AI.generate(
                `你是上下文相关性评估引擎。给定查询和候选结果，返回最相关的${topK}个结果编号（按相关性从高到低排列）。

查询: ${query}

候选结果:
${list}

只输出编号数组，如 [0,3,7,1,5]。不要解释。`,
                {}, c => { raw += c; }
            );
            // 解析编号
            const m = raw.match(/\[[\d,\s
```

### assets/js/modules/rag_original.js:605

```js
).slice(0, limit);
    },

    // —— AI 智能摘要 (将检索结果压缩为精炼上下文) ——
    async aiSummarize(query, maxTokens = 4000) {
        const context = await this.buildContext(query, maxTokens);
        if (!context.trim()) return '';
        let summary = '';
        await AI.generate(
            `你是上下文压缩引擎。将以下检索结果压缩为一段精炼的创作参考上下文，保留所有关键信息（人物、事件、设定、关系），去除冗余。不超过800字。\n\n检索词: ${query}\n\n${context}`,
            {}, c => { summary += c; }
        );
        return summary;
    },

    // —— 获取数据源统计 ——
    async getSourceStats() {
```

### assets/js/modules/rag_ui.js:310

```js
ery) return UI.toast('先输入关键词');
        UI.toast('AI 正在压缩上下文...');
        const raw = await RAGSystem.buildContext(query, 5000, 'structured', null, this._filters);
        if (!raw.trim()) return UI.toast('没有可压缩的上下文');
        let summary = '';
        await AI.generate(
            `你是小说创作上下文压缩器。把下面资料压成可直接给AI续写使用的上下文包，保留人物状态、世界规则、伏笔、章节事实、禁写点。不要解释过程，不超过900字。\n\n检索词：${query}\n\n${raw}`,
            {}, c => { summary += c; }
        );
        this._lastQuery = query;
        this._lastContext = summary;
        co
```

### assets/js/modules/settings_original.js:567

```js
fig('text');
            if(!config) { el.textContent = '❌ 未找到激活的 API 配置'; el.className = 'text-xs text-red-400 font-mono p-2 bg-black/30 rounded min-h-[40px]'; return; }
            const start = Date.now();
            let result = '';
            await AI.generate('请回复"连接成功"四个字。', {}, c => { result += c; });
            const ms = Date.now() - start;
            el.textContent = '✅ 连接成功 (' + ms + 'ms)\n模型: ' + config.model_name + '\n响应: ' + result.slice(0, 100);
            el.className = 'text-xs text-gr
```

### assets/js/modules/toolbox_original.js:480

```js
=== 'world') {
                // 尝试提取实体
                const prompt = `从以下文本中提取所有实体信息，返回JSON数组格式：[{"name":"名称","type":"类型(人物/物品/地点/势力/规则等)","desc":"描述"}]\n\n${content.slice(0, 3000)}`;
                UI.toast('正在提取实体...');
                const res = await AI.generate(prompt);
                let entities = [];
                try { entities = JSON.parse(res.replace(/```json?\n?/g,'').replace(/```/g,'').trim()); } catch(e) {
                    const m = res.match(/\[[\s\S]*\]/); if (m) try { entities = JSON.par
```

### assets/js/modules/toolbox_original.js:543

```js
以下全局创作上下文，生成一份综合分析报告，包括：当前创作进度评估、各模块数据一致性检查、下一步创作建议：\n\n${ctx}\n${extra ? '\n附加要求: ' + extra : ''}`;
            }
            if (!prompt) return outEl.innerHTML = '<div class="text-dim text-sm">请选择联动模式</div>';
            let fullRes = '';
            await AI.generate(prompt, {}, c => { if (!fullRes) outEl.innerHTML = ''; fullRes += c; outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(fullRes) : fullRes; });
            W.history.push({ tool: '跨模块联动', mode, result: fullRes, ts: Date.now() });
```

### assets/js/modules/toolbox_original.js:628

```js
outEl.innerHTML = '<div class="flex items-center gap-2 text-amber-400 animate-pulse p-4"><i class="fa-solid fa-circle-notch fa-spin"></i> 正在生成...</div>';
        W.updateIO(prompt, '生成中...');

        try {
            let fullRes = '';
            await AI.generate(prompt, {}, chunk => {
                if (!fullRes) outEl.innerHTML = '';
                fullRes += chunk;
                outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(fullRes) : fullRes;
                W.updateIO(prompt, fullR
```

### assets/js/modules/toolbox_original.js:659

```js
上文的内容，保持风格和逻辑一致，从上次结束的地方接着写：\n\n' + prev.slice(-2000);
        outEl.innerHTML += '<div class="text-amber-400 animate-pulse mt-2"><i class="fa-solid fa-circle-notch fa-spin"></i> 继续生成中...</div>';
        try {
            let fullRes = prev;
            await AI.generate(prompt, {}, chunk => {
                fullRes += chunk;
                outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(fullRes) : fullRes;
            });
            Modules.workshop.updateIO('继续生成', fullRes);
        } catch(e) {
```

### assets/js/modules/toolbox_original.js:770

```js
t');
        if (outEl) {
            outEl.innerHTML = '<div class="flex items-center gap-2 text-cyan-400 animate-pulse"><i class="fa-solid fa-circle-notch fa-spin"></i> AI对比分析中...</div>';
            try {
                let res = '';
                await AI.generate(prompt, {}, c => { res += c; outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(res) : res; });
            } catch(e) { outEl.innerHTML = '<div class="text-red-400">对比分析失败: ' + e.message + '</div>'; }
        }
        // 关闭弹窗
```

### assets/js/modules/tools_center_original.js:794

```js
ite: '请用不同的表达方式改写以下内容，保持核心含义：',
            extract: '请从以下文本中提取关键信息（人物、事件、地点、时间等）：'
        };

        if (defaultPrompts[type]) {
            const prompt = (customPrompt || defaultPrompts[type]) + '\n\n' + input;
            let res = '';
            await AI.generate(prompt, opts, c => { res += c; if (ioOut) { ioOut.value = `[${node.data.label || type}] 实时输出:\n${res}`; ioOut.scrollTop = ioOut.scrollHeight; } });
            return res;
        }
        if (type === 'output') return input;

        if (type ===
```

### assets/js/modules/tools_center_original.js:803

```js
nput;

        if (type === 'condition') {
            const condPrompt = customPrompt || '判断以下内容是否满足条件';
            const judgePrompt = `请判断以下内容是否满足条件："${condPrompt}"\n\n内容：${input.slice(0,2000)}\n\n请只回答"是"或"否"。`;
            let res = '';
            await AI.generate(judgePrompt, opts, c => { res += c; });
            node._condResult = res.includes('是') ? 'out_0' : 'out_1';
            return input;
        }

        if (type === 'loop') {
            const count = parseInt(node.data.count) || 3;
```

### assets/js/modules/tools_center_original.js:815

```js
t = input;
            const iterPrompt = customPrompt || '请在保持核心内容的基础上进一步优化以下文本';
            for (let i = 0; i < count; i++) {
                const p = `${iterPrompt}（第${i+1}/${count}次迭代）：\n\n${current}`;
                let res = '';
                await AI.generate(p, opts, c => { res += c; if (ioOut) { ioOut.value = `[${node.data.label || '循环'}] 迭代${i+1}/${count}:\n${res}`; ioOut.scrollTop = ioOut.scrollHeight; } });
                current = res;
            }
            return current;
        }
```

### assets/js/modules/tools_center_original.js:828

```js
gentId;
            if (!agentId) return '[错误] 未选择智能体';
            const agents = await this._getAgents();
            const agent = agents.find(a => a.id === agentId);
            if (!agent) return '[错误] 智能体不存在';
            let res = '';
            await AI.generate(agent.prompt + '\n\n用户输入：\n' + input, opts, c => { res += c; if (ioOut) { ioOut.value = `[${agent.name}] 实时输出:\n${res}`; ioOut.scrollTop = ioOut.scrollHeight; } });
            return res;
        }

        if (type === 'chat_node') {
```

### assets/js/modules/tools_center_original.js:836

```js
t; } });
            return res;
        }

        if (type === 'chat_node') {
            const userInput = window.prompt('对话节点 - 请输入你的回复：\n\n上下文：' + input.slice(0, 300));
            if (!userInput) return input;
            let res = '';
            await AI.generate(`上下文：\n${input}\n\n用户回复：${userInput}\n\n请根据上下文和用户回复继续对话：`, opts, c => { res += c; });
            return res;
        }

        if (type === 'subworkflow') {
            const wfId = node.data.workflowId;
            if (!wfId) return '[错误] 未选择子工作
```

### assets/js/modules/tools_center_original.js:1233

```js
y}\n\n请回复用户最新消息：`;
        let res = '';
        this.agentChatLog.push({ role: 'assistant', content: '', agent: agent.name });
        this._agentGenerating = true;
        const currentAgentId = this.agentChatId; // 记住当前智能体ID
        try {
            await AI.generate(prompt, {}, c => {
                res += c;
                this.agentChatLog[this.agentChatLog.length - 1].content = res;
                // 只有当前显示的还是这个智能体时才更新UI
                if (this.agentChatId === currentAgentId && log) {
```

### assets/js/modules/web_chat_original.js:1107

```js
t);
        }

        const projectContext = await this._getProjectContext();

        const fullPrompt = `${systemPrompt}\n\n${nexusContext}\n${projectContext}\n\n${ragContext}\n\n用户：${content}`;

        let aiResponse = '';
        try {
            await AI.generate(fullPrompt, {}, c => {
                aiResponse += c;
                this._updateLastMessage(aiResponse);
            });
        } catch(e) {
            aiResponse = '抱歉，生成失败：' + e.message;
        }

        this.messages.push({
            r
```

### assets/js/modules/world_original.js:1177

```js
：\n名称：${name}\n已有描述：${desc || '无'}${pipelineCtx}\n\n要求：\n1. 外貌/特征描述\n2. 背景故事\n3. 性格/属性\n4. 与其他实体的潜在关系\n5. 在故事中的作用和定位\n6. 独特的标志性特点`;
        const el = document.getElementById('we-ent-desc');
        el.value = '生成中...';
        let fullRes = '';
        await AI.generate(prompt, {}, c => { fullRes += c; el.value = fullRes; });
        UI.toast('AI 扩写完成');
    },

    // ═══ 从融合拆书深度提取实体 (12类型) — 修复: 确保关系正确、同步刷新图谱+世界观 ═══
    extractFromFusion: async () => {
        const we = Modules.world_engine;
        const FB =
```

### assets/js/modules/world_original.js:1237

```js
、徒弟、敌对、盟友、所属、位于、拥有、使用、参与、创造、守护、统治等
- 人物之间要有师徒/敌友/从属关系
- 人物与地点要有"位于"/"出没"关系
- 人物与物品要有"拥有"/"使用"关系
- 人物与势力要有"所属"/"统治"关系
- 情节与人物要有"参与"关系
- 这些关系是构建知识网络图的关键，不要遗漏！
- 直接输出JSON，不要包裹markdown代码块`;

        UI.toast('正在深度提取实体...');
        let fullRes = '';
        await AI.generate(prompt, {}, c => { fullRes += c; });

        // ═══ 健壮JSON解析（6层容错） ═══
        let entities = null;
        // 预处理: 去掉markdown代码块包裹
        let cleanRes = fullRes.trim();
        cleanRes = cleanRes.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?
```

### assets/js/modules/world_original.js:1410

```js
格式】严格JSON对象：
{"history":"详细内容","geography":"详细内容","magic":"详细内容","factions":"详细内容","species":"详细内容","rules":"详细内容","culture":"详细内容"}

注意：每个维度至少200字，要具体、可直接用于创作。直接输出JSON，不要包裹markdown代码块`;

        UI.toast('正在提取世界观...');
        let fullRes = '';
        await AI.generate(prompt, {}, c => { fullRes += c; });

        let worldData = null;
        try { worldData = JSON.parse(fullRes); } catch(e1) {
            try { worldData = JSON.parse(fullRes.replace(/```json?\s*/g,'').replace(/```/g,'').trim()); } catch(e2) {
```

### assets/js/modules/world_original.js:1477

```js
1500) : '【当前为空，请从零构建】'}\n${refCtx}\n\n要求：\n1. 内容详细、具体、有层次感\n2. 包含具体的名称、数据、细节\n3. 适合直接用于小说创作\n4. 至少500字\n5. 使用清晰的分段和标题`;
        const el = document.getElementById('we-world-editor');
        if(el) el.value = '生成中...';
        let fullRes = '';
        await AI.generate(prompt, {}, c => { fullRes += c; if(el) el.value = fullRes; });
        UI.toast('AI 世界观生成完成');
    },

    // ═══ 知识图谱 3D — 核心修复: 真正的网络结构，不是孤立的点 ═══
    // 每个实体(人物/物品/地点/情节/伏笔/势力/种族/魔法/规则/文化/历史/技法)
    // 都是一个具体节点，通过关系连线交织成3D网络
    _graph3d: null,
```

### assets/js/modules/world_original.js:2291

```js
节脉络清晰，有起承转合
2. 明确关键事件和转折点
3. 规划人物出场和互动
4. 标注情感节奏和氛围营造
5. 与世界观和已有实体相结合
6. 字数约500-800字`;

        const outlineEl = document.getElementById('we-chapter-outline');
        if(outlineEl) outlineEl.value = '生成中...';
        
        let fullRes = '';
        await AI.generate(prompt, {}, c => { 
            fullRes += c; 
            if(outlineEl) outlineEl.value = fullRes; 
        });
        
        UI.toast('AI 细纲生成完成');
    },

    async _extractChapterEntities() {
        const we = Modules.world_engine;
```

### assets/js/modules/world_original.js:2328

```js
=> e.name);
        
        const prompt = `请从以下章节细纲中提取涉及的实体名称，只返回实体名称列表，用逗号分隔：
【章节细纲】
${outlineEl.value}

【已有实体库（请尽可能匹配这些名称）】
${existingNames.join('、') || '无'}

只返回实体名称，用逗号分隔，不要其他内容。`;

        UI.toast('正在提取实体...');
        let fullRes = '';
        await AI.generate(prompt, {}, c => { fullRes += c; });
        
        const extractedNames = fullRes.split(/[,，\n]/).map(s => s.trim()).filter(Boolean);
        if(entitiesEl) entitiesEl.value = extractedNames.join(', ');
        
        UI.toast(`已提取 ${extracted
```

### assets/js/modules/world_original.js:2894

```js
],
  "entities": [
    {"name": "实体名", "type": "类型", "desc": "详细描述(100-300字)", "relations": ["关系类型:关联实体名"]}
  ]
}

【关键要求】
- 每个实体的relations必须尽可能多地引用其他实体名称
- 关系类型例如：师父、徒弟、敌对、盟友、所属、位于、拥有、使用等
- 直接输出JSON，不要包裹markdown代码块`;

        let fullRes = '';
        await AI.generate(prompt, {}, c => { fullRes += c; });
        
        let parsed = null;
        try {
            let cleanRes = fullRes.trim();
            cleanRes = cleanRes.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '').trim();
            cons
```

### assets/js/modules/world_original.js:3300

```js
,"order":1}],\n  "chapters": [{"title":"章名","order":1,"volumeOrder":1}]\n}\n\n规则：\n1. 如果没有明显的卷，则 volumes 留空数组，所有章的 volumeOrder 为 1\n2. 章按自然顺序编号\n3. 只输出能明确识别的章节标题\n\n文本开头（前12000字）：\n${sample}`;

            let raw = '';
            try {
                await AI.generate(prompt, (chunk) => { raw += chunk; }, { max_tokens: 2000, temperature: 0.1 });
                const json = (() => { try { const m = raw.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : null; } catch(e) { return null; } })();
                if(
```

### assets/js/modules/world_original.js:3360

```js
":["关系类型:关联名称"]}\n  ]\n}\n\n规则：\n1. worldview 的每个维度如果没有相关内容则留空字符串""\n2. entities 最多提取30个最关键实体，优先主角、重要配角、核心物品、关键地点\n3. type 必须从给定的12种中选\n4. relations 可选，表示与其他实体的关系\n\n小说片段：\n${sampleText.slice(0, 10000)}`;

        let raw = '';
        try {
            await AI.generate(prompt, (chunk) => { raw += chunk; }, { max_tokens: 4000, temperature: 0.2 });
            const json = (() => { try { const m = raw.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : null; } catch(e) { return null; } })();
            if(json) {
```

### assets/js/modules/writer_original.js:2025

```js
eIO(prompt, '生成中...');
        const st = document.getElementById('w-save-status');
        if (st) st.textContent = 'AI 生成中... (' + lenHint + ', ' + styleSource + ')';
        this._setGenerating(true);

        const startLen = content.length;
        await AI.generate(prompt, {}, c => {
            if (editor) { editor.value += c; this.onInput(); }
            this.updateIO(prompt, editor ? editor.value.slice(-2000) : c);
        });
        this._setGenerating(false);
        const added = (editor ? editor.valu
```

### assets/js/modules/writer_original.js:2071

```js
直接输出正文，不要解释`;

        this.updateIO(prompt, '融合技法写作中...');
        const st = document.getElementById('w-save-status');
        if (st) st.textContent = '融合技法写作中...';
        this._setGenerating(true);

        const startLen = content.length;
        await AI.generate(prompt, {}, c => {
            if (editor) { editor.value += c; this.onInput(); }
            this.updateIO(prompt, editor ? editor.value.slice(-2000) : c);
        });
        this._setGenerating(false);
        const added = (editor ? editor.valu
```

### assets/js/modules/writer_original.js:2130

```js
) + '\n\n' + prompt;
        }

        this.updateIO(prompt, '润色中...');
        this._setGenerating(true);
        UI.toast('正在润色... (风格: ' + styleSource + ')');

        // 保存原文
        this._polishOriginal = content;

        let result = '';
        await AI.generate(prompt, {}, c => { result += c; this.updateIO(prompt, result); });
        this._setGenerating(false);

        if (!result || !result.trim()) return UI.toast('润色结果为空');

        // 红色预览模式 — 编辑器显示润色结果，加替换确认浮层
        if (editor) {
            edito
```

### assets/js/modules/writer_original.js:2527

```js
()}</span>
            </div>
            <div class="text-gray-300 text-xs leading-relaxed"><i class="fa-solid fa-spinner fa-spin mr-1"></i>思考中...</div>
        </div>`;
        log.scrollTop = log.scrollHeight;
        
        let reply = '';
        await AI.generate(contextPrompt, {}, c => {
            reply += c;
            const msgEl = document.getElementById(aiMsgId);
            if (msgEl) {
                const contentDiv = msgEl.querySelector('div:last-child');
                if (contentDiv) {
```

### assets/js/modules/writer_original.js:2914

```js
onCtx || cycleCtx ? '运用融合技法中的套路（钩子、节奏、爽点）' : '文风统一，情节连贯'}\n3. ${ragContext ? '参考RAG上下文保持世界观/人设/伏笔一致性' : '保持前后文一致'}\n4. 遵守NEXUS OS L1铁律（单句≤25字、禁情绪标签、章末钩子）\n5. 字数约1500-2500字\n6. 直接输出正文`;

            try {
                let content = '';
                await AI.generate(writePrompt, {}, c => {
                    content += c;
                    // 实时显示到编辑器
                    if (editorEl) editorEl.value = content;
                    this.onInput();
                });
                chap.content = content;
```

### assets/js/modules/writer_original.js:3330

```js
字数约${targetWords}字
6. 直接输出正文，不要标题`;
            
            if(useLogic && prevContent) {
                writePrompt += `\n7. 注意与前文的逻辑连贯，避免人物性格突变、时间线混乱等问题`;
            }
            
            try {
                let content = '';
                await AI.generate(writePrompt, {}, c => {
                    content += c;
                    if (editorEl) editorEl.value = content;
                    W.onInput();
                });
                
                if(useLogic && content.length > 500) {
```

### assets/js/modules/writer_original.js:3359

```js
4. 是否有明显的逻辑漏洞

如果发现问题，请用JSON格式输出修复建议：
{"issues":["问题1","问题2"],"suggestions":["建议1","建议2"]}

如果没有明显问题，输出：{"issues":[],"suggestions":[]}`;
                    
                    try {
                        let logicResult = '';
                        await AI.generate(logicPrompt, { maxTokens: 500 }, c => { logicResult += c; });
                        
                        const jsonMatch = logicResult.match(/\{[\s\S]*\}/);
                        if(jsonMatch) {
                            const logic = JSO
```

### assets/js/modules/writer_original.js:3390

```js
}
                
                if (autoPolish && content.length > 500) {
                    try {
                        if (st) st.textContent = `润色中: ${chap.title}`;
                        let polished = '';
                        await AI.generate(
                            `请润色以下小说正文，保持原意和风格，优化语言表达和节奏：

${content.slice(0, 3000)}

要求：
1. 保持原有情节和人物性格
2. 优化句子节奏，使其更加流畅
3. 增强描写生动性
4. 删除冗余表达
5. 直接输出润色后的正文`,
                            {}, c => { polished += c; }
                        );
```

### assets/js/modules/writer_original.js:3455

```js
W.loadTree();
        
        if (useCheckpoint) {
            await DB.del('settings', 'auto_write_checkpoint');
        }
    },

    async _extractEntitiesFromContent(content, title, chapterNum) {
        let raw = '';
        try {
            await AI.generate(
                `从以下章节内容中提取关键实体：

【章节】${title}
【内容】
${content.slice(0, 4000)}

提取类型：人物、物品、地点、势力、情节、伏笔
输出JSON数组：[{"name":"名称","type":"类型","desc":"描述","relations":["关系:实体"]}]

只输出JSON。`,
                {}, c => { raw += c; }
            );
```

### assets/js/modules/writer_original.js:3502

```js
cleSummary(chapters, cycleSize) {
        const contents = chapters.map((c, i) => 
            `【第${c.order || i + 1}章: ${c.title}】\n${(c.content || '').slice(0, 1000)}`
        ).join('\n\n---\n\n');

        let summary = '';
        try {
            await AI.generate(
                `请对以下${cycleSize}章内容进行写作总结：

${contents.slice(0, 6000)}

输出：
1. 【核心情节】简要概括
2. 【人物发展】主要人物变化
3. 【伏笔追踪】已埋设的伏笔
4. 【下阶段建议】后续写作建议

简洁输出，不超过500字。`,
                {}, c => { summary += c; }
            );
            
            await D
```

### assets/js/modules/writer_original.js:3577

```js
塑造**
   - 人物性格是否一致
   - 对话是否符合人物身份
   - 人物动机是否清晰

3. **文笔风格**
   - 叙事节奏是否恰当
   - 描写是否生动具体
   - 是否有冗余或重复

4. **读者体验**
   - 开头是否吸引人
   - 情绪曲线是否合理
   - 悬念和钩子设置

5. **改进建议**
   - 具体的修改建议
   - 优先级排序

请用清晰的Markdown格式输出诊断报告。`;

        let result = '';
        await AI.generate(prompt, {}, c => { result += c; });
        
        if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none">${this._formatMarkdown(result)}</div>`;
        UI.toast('诊断完成');
    },

    async analyzeContent() {
```

### assets/js/modules/writer_original.js:3635

```js
- 标注情绪高低点
   - 分析节奏控制效果
   - 提出优化建议

3. **爽点/看点分析**
   - 识别文中的爽点
   - 分析爽点设置效果
   - 建议增加的爽点

4. **悬念体系分析**
   - 伏笔设置情况
   - 钩子效果评估
   - 悬念链完整性

5. **读者心理分析**
   - 预期读者情绪变化
   - 可能的弃读点
   - 优化建议

请用Markdown格式输出详细分析报告。`;

        let result = '';
        await AI.generate(prompt, {}, c => { result += c; });
        
        if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none">${this._formatMarkdown(result)}</div>`;
        UI.toast('深度分析完成');
    },

    async summarizeContent() {
```

### assets/js/modules/writer_original.js:3665

```js
const prompt = `请对以下小说内容进行总结概述：

【内容】
${content.slice(0, 8000)}

【输出要求】
1. **一句话概括**（20字以内）
2. **核心情节**（100字以内）
3. **关键人物**（列出出场人物及其行动）
4. **重要场景**（列出主要场景）
5. **伏笔/悬念**（如有）
6. **情绪走向**（从...到...）

请简洁清晰地输出。`;

        let result = '';
        await AI.generate(prompt, {}, c => { result += c; });
        
        if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none">${this._formatMarkdown(result)}</div>`;
        UI.toast('总结完成');
    },
    async _refreshInfoTab() {
```

### assets/js/modules/writer_original.js:3788

```js
将以下章节大纲进一步细化，补充更多具体细节。

【章节标题】${title}
【当前大纲】
${outline}

【已有正文片段】
${content.slice(0, 1000)}

【细化要求】
1. 保留原有结构，补充具体细节（场景描写、对话要点、情绪转折）
2. 每个情节点标注情绪值(1-10)和钩子类型
3. 确保与已有正文片段衔接自然
4. 输出格式：情节 → 细节补充 → 情绪/钩子标记

请直接输出细化后的大纲。`;

        let result = '';
        await AI.generate(prompt, {}, c => { result += c; });
        if (outlineEl) outlineEl.value = result;
        UI.toast('大纲细化完成');
    },

    async _aiExpandOutline() {
        const input = document.getElementById('w-outline-chat');
        const demand = input ?
```

### assets/js/modules/writer_original.js:3812

```js
line.trim()) return UI.toast('请先输入本章大纲', 'error');
        
        UI.toast('AI 正在补充细节...');
        const prompt = `你是一位资深网文策划师。用户提出了以下补充要求：

【用户要求】${demand}

【当前大纲】
${outline}

请根据用户要求，在保留原有大纲结构的基础上补充细节。直接输出修改后的大纲。`;

        let result = '';
        await AI.generate(prompt, {}, c => { result += c; });
        if (outlineEl) outlineEl.value = result;
        if (input) input.value = '';
        UI.toast('细节补充完成');
    },

    // ===== 上下文Tab（融合+RAG合并） =====
    async _loadContextTab() {
        const resultsEl
```

### assets/js/modules/writer_original.js:3998

```js
const targetText = selected.trim() ? selected : content.slice(-1500);
        const prompt = `你是一位专业网文编辑。${instruction}

【待处理内容】
${targetText}

【要求】
- 直接输出处理后的文本，不要任何开场白
- 保持原有风格和人物设定一致
- 如果是续写，确保无缝衔接上文`;

        let result = '';
        await AI.generate(prompt, {}, c => { result += c; });
        
        if (log) log.innerHTML += `<div class="p-1.5 bg-white/5 rounded border border-white/5"><span class="text-green-400 font-bold text-[9px]">AI</span><div class="text-gray-300 mt-0.5 text-[10px] lead
```

### assets/js/modules/writer_original.js:4078

```js
理？
4. **伏笔回收**：前文埋下的伏笔是否被提及或回收？
5. **逻辑一致性**：剧情推进是否合理？因果关系是否成立？
6. **称谓一致性**：同一角色/地点的称呼是否统一？

【输出格式】
### 总体评分：X/10
### 问题列表（按严重程度排序）
- [严重/中等/轻微] 具体问题描述 → 修复建议
### 未发现问题的维度
### 一句话总结

请用Markdown格式输出。`;

        let result = '';
        try {
            await AI.generate(prompt, {}, c => { result += c; });
            if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none">${this._formatMarkdown(result)}</div>`;
            UI.toast('一致性检测完成');
        } catch(e) {
            if (re
```

### assets/js/modules/writer_original.js:4122

```js
特点
8. **节奏控制**：情节推进速度，场景切换方式
9. **特色表达**：作者的标志性用词、句式或表达习惯

[输出格式]
请以简洁的列表形式输出，每个维度1-2句话，总字数控制在300-500字。输出内容应该能直接作为AI写作的风格指南。`;

        this._setGenerating(true);
        UI.toast('正在分析文风...');
        
        let result = '';
        try {
            await AI.generate(prompt, {}, c => { result += c; });
            if (result.trim()) {
                resultEl.value = result.trim();
                UI.toast('文风提取完成！');
            } else {
                UI.toast('提取结果为空', 'error');
            }
        } catc
```

### assets/js/modules/writer_original.js:4317

```js
面感强弱
- 是否有" telling 过多 "的问题？

### 4️⃣ 剧情结构（0-10分）
- 起承转合是否清晰
- 伏笔/悬念设置
- 与大纲的契合度

### 5️⃣ 综合评分与改进优先级
- 总分：/50
- Top 3 最优先改进点（具体到段落位置）
- 一句话总结：本章最大的亮点 + 最大的短板

请用清晰的Markdown格式输出。避免空泛评价，每个扣分点都要给出"怎么改"。`;

        let result = '';
        try {
            await AI.generate(prompt, {}, c => { result += c; });
            if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none">${this._formatMarkdown(result)}</div>`;
            UI.toast('诊断完成');
        } catch(e) {
            if (resul
```

### assets/js/modules/writer_original.js:4359

```js
utline.slice(0, 1000) || '无'}

【正文内容】
${content.slice(0, 6000)}

${fusionCtx ? `【融合技法参考】\n${fusionCtx.slice(0, 1500)}\n` : ''}

【要求】
请严格按照用户的需求进行分析。输出要实用、具体、可操作。如果用户的问题不明确，请给出你最专业的解读。用 Markdown 格式输出。`;

        let result = '';
        try {
            await AI.generate(prompt, {}, c => { result += c; });
            if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none">${this._formatMarkdown(result)}</div>`;
            UI.toast('分析完成');
            if (input) input.value = '';
```

### assets/js/modules/writer_original.js:4518

```js
ult');
        if (resultEl) resultEl.innerHTML = '<div class="text-center text-dim py-4"><i class="fa-solid fa-spinner fa-spin text-xl mb-2"></i><div>正在执行...</div></div>';
        
        this.tab('diagnose');
        
        let result = '';
        await AI.generate(promptText, {}, c => { result += c; });
        
        if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none">${this._formatMarkdown(result)}</div>`;
        UI.toast('执行完成');
    },

    _formatMarkdown(text) {
```

### assets/js/modules_split/creative/creative_brainstorm.js:55

```js
'cs-bs-results');
        if(!el) return;
        el.innerHTML = '<div class="col-span-2 text-purple-400 animate-pulse text-center p-8"><i class="fa-solid fa-circle-notch fa-spin mr-1"></i>脑洞风暴中...</div>';
        let res = '';
        try {
            await AI.generate(prompt, {}, c => { res += c; });
        } catch(e) {
            el.innerHTML = '<div class="col-span-2 text-red-400 text-center p-8"><i class="fa-solid fa-triangle-exclamation mr-1"></i>风暴失败: ' + (e.message || e) + '</div>';
            return;
```

### assets/js/modules_split/creative/creative_brainstorm.js:106

```js
if(!el) return;
        el.innerHTML = `<div class="col-span-2 text-cyan-400 animate-pulse text-center p-8"><i class="fa-solid fa-shuffle fa-spin mr-1"></i>随机碰撞: ${elemA} + ${elemB} + ${elemC}...</div>`;
        let res = '';
        try {
            await AI.generate(prompt, {}, c => { res += c; });
            let ideas = JSON.parse(res.replace(/```json?\s*/g,'').replace(/```/g,'').trim());
            this.brainStorm = ideas;
            const colors = ['cyan','teal','emerald','sky','blue'];
            el.in
```

### assets/js/modules_split/creative/creative_brainstorm.js:136

```js
ementById('cs-bs-results');
        if(!el) return;
        el.innerHTML = '<div class="col-span-2 text-green-400 animate-pulse text-center p-8"><i class="fa-solid fa-dna fa-spin mr-1"></i>创意进化中...</div>';
        let res = '';
        try {
            await AI.generate(prompt, {}, c => { res += c; });
            let ideas = JSON.parse(res.replace(/```json?\s*/g,'').replace(/```/g,'').trim());
            this.brainStorm = ideas;
            const colors = ['green','emerald','lime','teal','cyan'];
            el.
```

### assets/js/modules_split/creative/creative_comic.js:233

```js
nst resultEl = document.getElementById('cs-cm-result');
        if (resultEl) resultEl.innerHTML = '<div class="text-dim text-xs flex items-center gap-2 p-4"><i class="fa-solid fa-spinner fa-spin"></i>AI正在生成漫画脚本，请稍候...</div>';

        try {
            await AI.generate(prompt, {}, c => {
                result += c;
                if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">${typeof marked !== 'undefined' ? marked.parse(result) : result}</div>`;
```

### assets/js/modules_split/creative/creative_comic.js:346

```js
const prompt = `${basePrompt}\n\n【原始信息】\n页码: P${p.page}-G${p.grid}\n景别: ${p.shot}\n画面描述: ${p.content}\n角色: ${p.chars}\n原始提示词: ${p.originalPrompt}\n\n请输出P${p.page}-G${p.grid}的专业英文图像生成提示词。`;

                let res = '';
                await AI.generate(prompt, {}, c => { res += c; });
                fullResult += res + '\n\n---\n\n';
            }

            if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">${typeof marked !== 'undefine
```

### assets/js/modules_split/creative/creative_core.js:935

```js
以下格式输出：
镜号X | 景别 | 机位 | 画面内容 | 时长 | 备注`;

        let result = '';
        const resultEl = document.getElementById('cs-sb-result');
        if (resultEl) resultEl.innerHTML = '<div class="text-dim text-xs">AI 生成分镜中...</div>';

        try {
            await AI.generate(prompt, {}, c => {
                result += c;
                if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none">${typeof marked !== 'undefined' ? marked.parse(result) : result}</div>`;
            });
```

### assets/js/modules_split/creative/creative_core.js:978

```js
下格式输出：
第X格
画面：...
对白：...
音效：...
镜头：...`;

        let result = '';
        const resultEl = document.getElementById('cs-cm-result');
        if (resultEl) resultEl.innerHTML = '<div class="text-dim text-xs">AI 生成脚本中...</div>';

        try {
            await AI.generate(prompt, {}, c => {
                result += c;
                if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none">${typeof marked !== 'undefined' ? marked.parse(result) : result}</div>`;
            });
```

### assets/js/modules_split/creative/creative_deai.js:152

```js
人物人设和情节逻辑一致
- 增加具体细节、感官描写、人物小动作
- 让对话更口语化、更有潜台词
- 打乱过于工整的句式结构
- 长短句交替，增加节奏感
- 适当使用方言、俚语、省略句
- 对照L1铁律和拟人化协议逐条检查修正

【输出格式】
只输出消痕后的完整文本。
不要输出修改统计。
不要解释。
不要出现“AI检测率”“修改统计”“降低百分比”等自评内容。

请处理以下文本：
${input}`;

        let result = '';
        try {
            await AI.generate(prompt, { apiType: 'text', module: 'creative_deai' }, chunk => {
                result += chunk;
                if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">${typeof marked !== 'undef
```

### assets/js/modules_split/creative/creative_deconstruct.js:112

```js
五、鲜活度评分（0-10分）：
  10分=经典级创造性突破，8-9分=明显鲜活瞬间，6-7分=有亮点不突出，4-5分=机械感强需修正，0-3分=严重不达标
六、可复用公式：填空式模板+适用题材+使用禁忌`);

        const prompt = `${basePrompt}

【原文】
${input.slice(0, 6000)}

请用中文输出完整分析报告，格式清晰，有层次感。`;

        let result = '';
        try {
            await AI.generate(prompt, {}, chunk => {
                result += chunk;
                if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">${typeof marked !== 'undefined' ? marked.parse(result) : result}</di
```

### assets/js/modules_split/creative/creative_deconstruct.js:160

```js
拆书分析报告，请提取一个最核心、最可复用的"写作公式"。

要求：
1. 用填空式模板表达（如：【钩子】→【压抑X字】→【转折】→【爽点释放】→【钩子】）
2. 标注每个步骤的字数比例
3. 给出3个不同题材的应用示例
4. 列出使用这个公式的禁忌（什么情况不能用）

输出格式：
【公式名称】
【适用题材】
【公式模板】
【字数比例】
【应用示例1】
【应用示例2】
【应用示例3】
【使用禁忌】`;

        let result = '';
        try {
            await AI.generate(prompt, {}, chunk => { result += chunk; });
            if (resultEl) {
                resultEl.innerHTML = resultEl.innerHTML.replace(/<div class="mt-4 p-3 bg-violet-500\/10[^]*?<\/div>/, '');
                resultEl.innerHTML += `<div class="mt
```

### assets/js/modules_split/creative/creative_drama.js:444

```js
is._dramaSkipConfig[step.key];
            if (skipped) {
                content = `【此步骤已设置为「仅提示词」，未调用AI生成完整内容。以下是该步骤的提示词，可复制到对应平台使用】\n\n---\n\n${prompt}`;
                await new Promise(r => setTimeout(r, 200));
            } else {
                await AI.generate(prompt, {}, c => { content += c; });
            }
            task.data[step.key] = content;
            this._dramaData[step.key] = content;
        }
        this._dramaResult = this._buildFullResult();
    },

    // ═══ 提示词构建 ═══
    _buildDra
```

### assets/js/modules_split/creative/creative_drama.js:556

```js
{prompt}`;
            } else {
                if (resultEl) resultEl.innerHTML = `<div class="text-orange-400 text-xs flex items-center gap-2"><i class="fa-solid fa-spinner fa-spin"></i>Step ${stepId}/7: ${stepNames[stepId]}...</div>`;
                await AI.generate(prompt, {}, c => { content += c; });
            }

            this._dramaData[key] = content;

            // 更新任务数据（如果有关联任务）
            if (this._dramaActiveTaskId) {
                const task = this._dramaTasks.find(t => t.id === this._dramaA
```

### assets/js/modules_split/creative/creative_drama.js:634

```js
// 执行模式：调用AI完整生成
                    if (resultEl) resultEl.innerHTML = `<div class="text-orange-400 text-xs flex items-center gap-2"><i class="fa-solid fa-spinner fa-spin"></i>Step ${i}/7: ${step.label}...</div>`;
                    await AI.generate(prompt, {}, c => { content += c; });
                }

                this._dramaData[step.key] = content;

                // 更新任务数据
                if (this._dramaActiveTaskId) {
                    const task = this._dramaTasks.find(t => t.id
```

### assets/js/modules_split/creative/creative_generators.js:307

```js
sultEl) resultEl.innerHTML = '<div class="text-dim text-xs flex items-center gap-2"><i class="fa-solid fa-spinner fa-spin"></i>生成中...</div>';

        const prompt = this._getGeneratorPrompt(id, input);
        let result = '';
        try {
            await AI.generate(prompt, {}, chunk => {
                result += chunk;
                if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">${typeof marked !== 'undefined' ? marked.parse(result) : result}</di
```

### assets/js/modules_split/creative/creative_inspiration.js:31

```js
教你温情。
第一个字永远是最难的，但第二个字会容易一点。烂初稿好过空白文档。

【任务】请对用户提供的热点/话题进行全维度深度分析，包含：热梗核心拆解、市场趋势、读者画像、创新融合建议、爆款预测、实操建议。要求分析深入、有数据感、可操作性强。`);
        const prompt = `${basePrompt}\n\n【分析对象】${input}\n\n请输出完整分析报告，格式清晰。`;
        try {
            let res = '';
            await AI.generate(prompt, {}, c => { res += c; el.innerHTML = typeof marked !== 'undefined' ? marked.parse(res) : res; });
            UI.toast('全维度分析完成');
        } catch(e) {
            el.innerHTML = '<div class="text-red-400">分析失败: ' + (e.message || e) + '</div
```

### assets/js/modules_split/creative/creative_inspiration.js:109

```js
rompt += `\n\n请生成${batchCount}个不同的创意版本，每个版本用"---"分隔。`;
        }
        el.innerHTML = '<div class="text-yellow-400 animate-pulse"><i class="fa-solid fa-circle-notch fa-spin mr-1"></i>灵感生成中...</div>';
        try {
            let res = '';
            await AI.generate(fullPrompt, {}, c => { 
                res += c; 
                el.innerHTML = typeof marked !== 'undefined' ? marked.parse(res) : res; 
            });
            if (!res.trim()) {
                el.innerHTML = '<div class="text-dim">（无结果，请检
```

### assets/js/modules_split/creative/creative_inspiration.js:160

```js
l = document.getElementById('cs-hot-result');
        if(!el) return;
        el.innerHTML = '<div class="text-red-400 animate-pulse"><i class="fa-solid fa-circle-notch fa-spin mr-1"></i>分析中...</div>';
        try {
            let res = '';
            await AI.generate(prompt, {}, c => { res += c; el.innerHTML = typeof marked !== 'undefined' ? marked.parse(res) : res; });
            if (!res.trim()) el.innerHTML = '<div class="text-dim">（无结果，请检查API配置）</div>';
            else UI.toast('热点分析完成');
        } catch(
```

### assets/js/modules_split/creative/creative_lookbook.js:312

```js
- 发型/发色: ${c.hair || '未设定'}
- 眼睛: ${c.eyes || '未设定'}
- 服饰: ${c.clothing || '未设定'}
- 特征: ${c.feature || '未设定'}
- 气质: ${c.vibe || '未设定'}`);
        const prompt = `${basePrompt}\n\n【用户输入】\n角色：${c.name}`;
        let result = '';
        try {
            await AI.generate(prompt, {}, chunk => { result += chunk; });
            c.prompt = result.trim();
            await DB.put('settings', { id: 'lookbook_chars', items: this._lookbookChars });
            this.switchTab('lookbook');
            UI.toast('提示词生成完成 ✓',
```

### assets/js/modules_split/creative/creative_lookbook.js:454

```js
c.feature}
- 气质：${c.vibe}
- 性格：${c.personality || '未详细设定'}
- 背景线索：${c.backstory || c.notes || ''}

要求：
1. 用极简白描，零形容词堆砌
2. 通过具体事件展示性格，而非标签
3. 包含一个决定性时刻（turning point）
4. 结尾留白，暗示未完成的命运
5. 适合直接用于小说/游戏/剧本`;
        let result = '';
        try {
            await AI.generate(prompt, {}, chunk => { result += chunk; });
            c.bio = result.trim();
            await DB.put('settings', { id: 'lookbook_chars', items: this._lookbookChars });
            this.switchTab('lookbook');
            UI.toast('人物小传生成完成 ✓', 's
```

### assets/js/modules_split/creative/creative_lookbook.js:538

```js
/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-dim"><i class="fa-solid fa-spinner fa-spin mr-1"></i>${c.name} 正在思考...</div></div>`;
        historyEl.scrollTop = historyEl.scrollHeight;

        try {
            let reply = '';
            await AI.generate(systemPrompt + '\n\n【对话历史】\n' + this._charChatHistory.map(h => (h.role==='user'?'对方':'我') + '：' + h.content).join('\n') + '\n\n请回应。', {}, chunk => {
                reply += chunk;
                const typing = document.getElementById('char-chat-t
```

### assets/js/modules_split/creative/creative_short.js:89

```js
不安→反复揪心→崩溃→心碎等）
5. 结局要有余韵
6. 每个阶段至少1个共情锚点`;

        const el = document.getElementById('cs-sw-outline');
        if (!el) return;
        el.value = '生成中...';
        this._showProducing('正在生成大纲...');
        try {
            let res = '';
            await AI.generate(prompt, {}, c => { res += c; el.value = res; this._updateProducingWC(res); });
            this.shortDraft.outline = res;
            UI.toast('大纲生成完成');
        } catch (e) {
            el.value = '生成失败: ' + (e.message || e);
            UI.toast
```

### assets/js/modules_split/creative/creative_short.js:202

```js
续写约${Math.min(remaining, 3000)}字，使总字数接近${target}字。`;
                }

                if (retryCount > 0) {
                    this._showProducing(`字数不足，正在第${retryCount}次续写补充...`);
                }

                let chunkRes = '';
                await AI.generate(prompt, {}, c => {
                    chunkRes += c;
                    el.value = fullContent + chunkRes;
                    this._updateProducingWC(fullContent + chunkRes);
                    this._updateWC();
                    // 滚动到底部
```

### assets/js/modules_split/creative/creative_short.js:262

```js
`[续写任务]\n\n${outline ? '[大纲参考]\n' + outline.slice(0, 800) + '\n\n' : ''}[已有正文(最后部分)]\n...${current.slice(-1500)}\n\n请从断点处无缝续写，保持文风一致，情节紧凑，约800-1200字。严格遵循L1铁律。`;

        this._showProducing('正在续写...');
        try {
            let res = '';
            await AI.generate(prompt, {}, c => {
                res += c;
                el.value = current + res;
                this._updateProducingWC(current + res);
                this._updateWC();
                el.scrollTop = el.scrollHeight;
            });
```

### assets/js/modules_split/creative/creative_short.js:312

```js
`;

        const prompt = (custom ? custom + '\n\n' : basePrompt + '\n\n') + `请对以下短篇小说正文进行深度润色：\n\n${content.slice(0, 5000)}`;
        const original = content;
        this._showProducing('正在润色...');
        try {
            let res = '';
            await AI.generate(prompt, {}, c => {
                res += c;
                el.value = res;
                this._updateProducingWC(res);
            });
            this.shortDraft.content = res;
            this._updateWC();
            UI.toast('润色完成');
```

### assets/js/modules_split/creative/creative_short.js:376

```js
const prompt = (custom ? custom + '\n\n' : basePrompt + '\n\n') + `标题：${task.name}\n类型：${task.genre || '短篇'}\n目标字数：${task.wordTarget}字\n\n要求：包含开端、发展、高潮、结局四个阶段，标注情绪曲线，每个阶段至少1个共情锚点。`;
                    let res = '';
                    await AI.generate(prompt, {}, c => { res += c; });
                    outline = res;
                    task.outline = outline;
                }
                const custom = this._getPrompt('quickwrite', '');
                const basePrompt = `你执行《叙事工程·元系统》自动化
```

### assets/js/modules_split/creative/creative_short.js:384

```js
= (custom ? custom + '\n\n' : basePrompt + '\n\n') + `标题：${task.name}\n类型：${task.genre || '短篇'}\n目标字数：${task.wordTarget}字\n\n[大纲]\n${outline}\n\n要求：严格执行L1铁律和L2建议，对话自然有潜台词，场景描写有画面感，字数接近${task.wordTarget}字。`;
                let res = '';
                await AI.generate(prompt, {}, c => { res += c; });
                task.content = res;
                task.status = 'done';
                const id = 'short_' + Utils.uuid();
                await DB.put('library_books', { id, name: task.name, content: res, size:
```

### assets/js/modules_split/creative/creative_storyboard.js:232

```js
const resultEl = document.getElementById('cs-sb-result');
        if (resultEl) resultEl.innerHTML = '<div class="text-dim text-xs flex items-center gap-2 p-4"><i class="fa-solid fa-spinner fa-spin"></i>AI正在拆解分镜，请稍候...</div>';

        try {
            await AI.generate(prompt, {}, c => {
                result += c;
                if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">${typeof marked !== 'undefined' ? marked.parse(result) : result}</div>`;
```

### assets/js/modules_split/creative/creative_trends.js:154

```js
：最受欢迎的角色类型、可复用人设公式
6. 变现设计：付费点位置、追更动力设计
7. 可复用公式总结：填空式模板+风险标注（是否已过时/同质化）
8. 情绪链匹配：分析爆款作品使用的情绪链类型（爽/虐/甜/悬疑/复仇）

请输出结构化的分析报告。`);
        const prompt = `${basePrompt}\n\n【用户输入】\n${input.slice(0, 4000)}`;

        let result = '';
        try {
            await AI.generate(prompt, {}, chunk => {
                result += chunk;
                if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">${typeof marked !== 'undefined' ? marked.parse(result) : result}</di
```

### assets/js/modules_split/creative/creative_video.js:245

```js
：${duration}
- 目标模型：${modelDesc[model] || model}
- 运动强度：${motion}

请输出：
1. 场景分析（主体、环境、氛围）
2. 完整的英文视频提示词（200-500词，适合${model}模型）
3. 镜头运动详细描述
4. 时间线分解（每1秒发生什么）
5. 负面约束词（Negative Prompt）
6. 推荐的生成参数（如果适用）`;

        let result = '';
        try {
            await AI.generate(prompt, {}, chunk => {
                result += chunk;
                if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">${typeof marked !== 'undefined' ? marked.parse(result) : result}</di
```

### assets/js/modules_split/creative/creative_visual.js:244

```js
画幅比例：${ratio}

请输出完整的英文图像生成提示词（适用于Midjourney/Stable Diffusion/DALL·E/即梦/可灵等），包含：
1. 主题推理结果（类型判断、标题、阶段/模块划分）
2. 完整的英文prompt（800-1500词）
3. 每个阶段/模块的象征物列表
4. 推荐的配色方案
5. 推荐的镜头角度
6. 负面约束词（Negative Prompt）`;

        let result = '';
        try {
            await AI.generate(prompt, {}, chunk => {
                result += chunk;
                if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">${typeof marked !== 'undefined' ? marked.parse(result) : result}</di
```

### assets/js/modules_split/creative/creative_visual.js:287

```js
;

            if (resultEl) resultEl.innerHTML = `<div class="text-indigo-400 text-xs flex items-center gap-2"><i class="fa-solid fa-spinner fa-spin"></i>生成 ${v.name} (${i+1}/3)...</div>`;
            try {
                let res = '';
                await AI.generate(prompt, {}, c => { res += c; });
                allResults += `## ${v.name}\n\n${res}\n\n---\n\n`;
            } catch(e) {
                allResults += `## ${v.name}\n\n生成失败：${e.message}\n\n---\n\n`;
            }
        }

        this._visual
```

### assets/js/modules_split/fusion_book/fusion_book_core.js:759

```js
line ? document.getElementById('pl-output') : null;
        if (plOut) plOut.textContent = `分析${side === 'left' ? '左' : '右'}书: ${ch.title}...\n`;

        let result = '';
        let aborted = false;
        let errorMsg = '';
        try {
            await AI.generate(prompt, { apiType: 'fusion', module: 'fusion_analyze' }, c => {
                result += c;
                if (outEl) outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(result) : result;
                if (plOut) plOut.textContent =
```

### assets/js/modules_split/fusion_book/fusion_book_core.js:843

```js
ompt = prompt.replace('{{book}}', book.name).replace('{{title}}', ch.title).replace('{{content}}', ch.content.slice(0, 6000));
            prompt = this._withDirectionGuard(prompt, '拆书弹药');

            let result = '';
            try {
                await AI.generate(prompt, { apiType: 'fusion', module: 'fusion_batch_analyze' }, c => {
                    result += c;
                    if (outEl) outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(`## ${ch.title}\n\n${result}`) : result;
```

### assets/js/modules_split/fusion_book/fusion_book_core.js:884

```js
const outEl = document.getElementById('fb-output');
        if (outEl) outEl.innerHTML = '<div class="text-purple-400 animate-pulse"><i class="fa-solid fa-spinner fa-spin mr-2"></i>正在对比...</div>';

        let result = '';
        try {
            await AI.generate(prompt, { apiType: 'fusion', module: 'fusion_compare_chapters' }, c => {
                result += c;
                if (outEl) outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(result) : result;
            });
        } catch(e) { U
```

### assets/js/modules_split/fusion_book/fusion_book_core.js:930

```js
i>正在对比...</div>';

        const inPipeline = this._pipelineRunning;
        const plOut = inPipeline ? document.getElementById('pl-output') : null;
        if (plOut) plOut.textContent = '对比分析中...\n';

        let result = '';
        try {
            await AI.generate(prompt, { apiType: 'fusion', module: 'fusion_compare_analysis' }, c => {
                result += c;
                if (outEl) outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(result) : result;
                if (plOut) plOut.textC
```

### assets/js/modules_split/fusion_book/fusion_book_core.js:1012

```js
i>正在融合...</div>';

        const inPipeline = this._pipelineRunning;
        const plOut = inPipeline ? document.getElementById('pl-output') : null;
        if (plOut) plOut.textContent = '融合精华中...\n';

        let result = '';
        try {
            await AI.generate(prompt, { apiType: 'fusion', module: 'fusion_merge_ammo' }, c => {
                result += c;
                if (outEl) outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(result) : result;
                if (plOut) plOut.textContent
```

### assets/js/modules_split/fusion_book/fusion_book_export.js:227

```js
cycleFusionPrompt += `\n\n${this._strictWritingLawText('创作循环融合')}\n【创作融合额外口味】必须纯大白话、现代话术、人物对话能接地气；可以使用日常网络梗，但不能把梗写成说明书。`;
        }

        this._plSetStep('fusion', 'active', '循环深度融合中...');
        let result = '';
        try {
            await AI.generate(cycleFusionPrompt, { apiType: 'fusion', module: 'fusion_cycle_ammo' }, c => {
                result += c;
                const outEl = document.getElementById('pl-output');
                if (outEl) outEl.textContent = result;
            });
```

### assets/js/modules_split/fusion_book/fusion_book_export.js:351

```js
urn results;
    },

    async _cycleExtractPatterns(startIdx, endIdx, fusionResult) {
        if (!fusionResult || fusionResult.length < 500) return;

        this._plLog(`📝 提取循环可复用模式...`, 'info');

        let patterns = '';
        try {
            await AI.generate(
                `从以下循环融合内容中提取可复用的写作模式和模板，以JSON格式输出：

${fusionResult.slice(0, 3000)}

输出格式：
{
  "hooks": ["开篇钩子模板1", "开篇钩子模板2"],
  "rhythms": ["节奏控制模板1", "节奏控制模板2"],
  "coolPoints": ["爽点设计模板1", "爽点设计模板2"],
  "suspenses": ["悬念布局模板1", "悬念布局模板2"],
  "
```

### assets/js/modules_split/fusion_book/fusion_book_extract.js:547

```js
禁止编造人物、地点、势力、物品、种族、魔法体系
3. description写清适用场景、执行步骤、避坑
4. relations用于连接已有技法、当前方向护栏或适用场景
5. 直接输出纯JSON数组，不要markdown

【输出格式】JSON数组：
[{"name":"技法名称","type":"技法/规则/伏笔/情节","description":"50-200字描述","relations":["适用:场景","约束:方向护栏"]}]

禁止输出任何非JSON文本。`;
            await AI.generate(
                entityGuard + (isStorySource ? storyPrompt : ammoPrompt),
                {
                    apiType: isStorySource ? 'parse' : 'fusion',
                    module: isStorySource ? 'fusion_story_entities' : 'fusion_ammo_entitie
```

### assets/js/modules_split/fusion_book/fusion_book_extract.js:896

```js
atch(e) { console.warn('一致性上下文构建失败:', e); }

        const outEl = document.getElementById('pl-output');
        if (outEl) outEl.textContent = '正在生成细纲...\n';
        this._setGenerating(true);

        let result = '';
        try {
            await AI.generate(prompt, { apiType: 'fusion', module: 'fusion_outline' }, c => {
                result += c;
                if (outEl) outEl.textContent = result;
                const fbOut = document.getElementById('fb-output');
                if (fbOut) fbOut
```

### assets/js/modules_split/fusion_book/fusion_book_extract.js:1089

```js
ById('fb-output');
        if (outEl) outEl.innerHTML = '<div class="text-green-400 animate-pulse"><i class="fa-solid fa-spinner fa-spin mr-2"></i>执笔台正在写正文...</div>';
        this._setGenerating(true);

        let result = '';
        try {
            await AI.generate(prompt, { apiType: 'text', module: 'writer_auto_current', flowMode: 'fusion', max_tokens: 8192, temperature: 0.85 }, c => {
                result += c;
                if (plOut) plOut.textContent = result;
                if (outEl) outEl.innerHT
```

### assets/js/modules_split/fusion_book/fusion_book_extract.js:1185

```js
animate-pulse"><i class="fa-solid fa-spinner fa-spin mr-2"></i>正在创作正文...</div>';

        const plOut = document.getElementById('pl-output');
        if (plOut) plOut.textContent = '正文创作中...\n';

        let result = '';
        try {
            await AI.generate(prompt, { apiType: 'text', module: 'fusion_write_body' }, c => {
                result += c;
                if (outEl) outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(result) : result;
                if (plOut) plOut.textContent =
```

### assets/js/modules_split/fusion_book/fusion_book_pipeline.js:970

```js
共同的开篇/节奏/爽点/钩子规律。
2. 再按章节列出“第X章技法弹药”，每章保留可复用模板和零件库。
3. 每章都要有 L1/P 协议评分。
4. 必须覆盖第${startCh}-${endCh}章全部章节，不得只输出第一章，不得中途要求用户确认。
5. 输出必须是拆解内容，不要说“弹药已送达”“请核查”“准备下一轮”“返回执笔台”“等待指令”。

【本循环原文】
${contentPack}`;

        let result = '';
        try {
            await AI.generate(prompt, { apiType: 'fusion', module: 'fusion_cycle_analyze' }, c => {
                result += c;
                if (outEl) outEl.textContent = result;
                const fbOut = document.getElementById('fb-output');
                if (fbOut)
```

### assets/js/modules_split/library/library_chat.js:366

```js
class="fa-solid fa-circle-notch fa-spin text-blue-400"></i> <span class="text-blue-300">智能体思考中...</span></div></div></div>`;
                        msgsEl.scrollTop = msgsEl.scrollHeight;
                        result = '';
                        await AI.generate(agentPrompt, {}, c => {
                            result += c;
                            const bodyEl = document.getElementById(streamId + '-body');
                            if (bodyEl) bodyEl.innerHTML = typeof marked !== 'undefined' ? m
```

### assets/js/modules_split/library/library_chat.js:469

```js
</i></div><div class="flex-1 max-w-[85%]"><div class="bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-gray-300 leading-relaxed" id="${streamBodyId}"><i class="fa-solid fa-ellipsis fa-beat-fade"></i> 思考中...</div></div>`;

            await AI.generate(fullPrompt, {}, c => {
                result += c;
                const sEl = document.getElementById(streamBodyId);
                if (sEl) sEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(result) : result;
                msgsE
```

### assets/js/modules_split/library/library_reader.js:88

```js
- 地点：重要场景、城市、秘境
- 势力：门派、组织、家族
- 魔法：功法、技能、特殊能力
- 情节：关键事件、转折点

输出格式（严格JSON）：
{
  "人物": [{"name":"名称", "desc":"简短描述"}],
  "物品": [...],
  "地点": [...],
  "势力": [...],
  "魔法": [...],
  "情节": [...]
}

只输出JSON，不要其他内容。`;

        try {
            const result = await AI.generate(prompt);
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const entities = JSON.parse(jsonMatch[0]);
                const flatEntities = [];
                for (const [type, items] of Object.
```

### assets/js/modules_split/library/library_reader.js:362

```js
text}`,
            nexus: `请将以下文本按照 NEXUS OS 协议进行标注分析：\n- CHR：涉及的角色及其状态变化\n- WLD：体现的世界规则或设定\n- FOE：埋下的伏笔或悬念\n- EMO：情绪锚点和氛围营造\n\n文本：\n${text}`
        };
        const prompt = prompts[mode] || prompts.technique;
        try {
            const result = await AI.generate(prompt);
            body.innerHTML = typeof marked !== 'undefined' ? marked.parse(result) : result;
        } catch (e) {
            body.innerHTML = `<div class="text-red-400">分析失败: ${e.message || '未知错误'}</div>`;
        }
    },

    // ═══════
```

### assets/js/modules_split/library/library_reader.js:517

```js
Id('rc-ai-log');
        if (log) {
            log.innerHTML += `<div class="p-2 bg-white/5 rounded text-[10px] text-dim"><i class="fa-solid fa-spinner fa-spin mr-1 text-amber-500"></i>智能分析中...</div>`;
        }
        try {
            const result = await AI.generate(prompt);
            if (log) {
                log.innerHTML += `
                    <div class="p-2 bg-gradient-to-br from-purple-900/20 to-transparent border border-purple-500/20 rounded-lg text-[10px] text-gray-300 leading-relaxed">
```

### assets/js/modules_split/library/library_reader.js:552

```js
ById('rc-ai-log');
        if (log) {
            log.innerHTML += `<div class="p-2 bg-white/5 rounded text-[10px] text-dim"><i class="fa-solid fa-spinner fa-spin mr-1 text-amber-500"></i>提取中...</div>`;
        }
        try {
            const result = await AI.generate(prompt);
            if (Modules.phoenix) {
                Modules.phoenix.data.outlineRaw = result;
                UI.toast('已提取到凤凰创作流');
            }
            if (log) {
                log.innerHTML += `
                    <div class="p-2
```

### assets/js/modules_split/library/library_reader.js:630

```js
ckTranslate: async () => {
        const RC = Modules.reader_center;
        const sel = window.getSelection();
        const text = sel ? sel.toString().trim() : '';
        if (!text) return UI.toast('请先选择文本');
        try {
            const result = await AI.generate(`翻译以下中文为英文，保持文学性：\n\n${text}`);
            UI.toast(result, 3000);
        } catch (e) {
            UI.toast('翻译失败');
        }
    },

    quickExplain: async () => {
        const RC = Modules.reader_center;
        const sel = window.getSelect
```

### assets/js/modules_split/library/library_reader.js:649

```js
ById('rc-ai-log');
        if (log) {
            log.innerHTML += `<div class="p-2 bg-white/5 rounded text-[10px] text-dim"><i class="fa-solid fa-spinner fa-spin mr-1 text-amber-500"></i>解释中...</div>`;
        }
        try {
            const result = await AI.generate(prompt);
            if (log) {
                log.innerHTML += `
                    <div class="p-2 bg-white/5 border border-white/10 rounded-lg text-[10px] text-gray-300 leading-relaxed">
                        <div class="text-amber-400 font-
```

### assets/js/modules_split/library/library_reader.js:678

```js
ById('rc-ai-log');
        if (log) {
            log.innerHTML += `<div class="p-2 bg-white/5 rounded text-[10px] text-dim"><i class="fa-solid fa-spinner fa-spin mr-1 text-amber-500"></i>续写中...</div>`;
        }
        try {
            const result = await AI.generate(prompt);
            if (log) {
                log.innerHTML += `
                    <div class="p-2 bg-gradient-to-br from-cyan-900/20 to-transparent border border-cyan-500/20 rounded-lg text-[10px] text-gray-300 leading-relaxed">
```

### assets/js/modules_split/memory/memory_core.js:437

```js
= '';
        const allContent = [
            ...this.working.map(m => `[${m.type}/${m.module || 'general'}] ${m.content}`),
            ...persistent.slice(-20).map(m => `[${m.category}] ${m.content}`)
        ].join('\n');

        try {
            await AI.generate(
                `你是记忆压缩引擎。将以下记忆内容压缩为精炼摘要，保留关键信息、人物、情节、设定要点。按模块分类输出，不超过800字：\n\n${allContent.slice(0, 6000)}`,
                {}, c => { summary += c; }
            );

            if (summary.length > 50) {
                await this.addPersisten
```

### assets/js/modules_split/memory/memory_core.js:701

```js
memory = this._permanent.find(m => m.id === memoryId);
        }
        if (!memory) return { success: false, error: '记忆不存在' };

        const content = memory.content;

        // 使用 AI 提取实体信息
        let extractResult = '';
        try {
            await AI.generate(
                `从以下记忆中提取实体信息，以JSON格式返回：
{
  "name": "实体名称",
  "type": "${targetType}",
  "description": "详细描述（不超过200字）",
  "tags": ["标签1", "标签2"],
  "relations": ["关系类型:关联实体名"]
}

记忆内容：${content.slice(0, 1000)}`,
                {}, c => { extrac
```

### assets/js/modules_split/memory/memory_working.js:84

```js
sWorking() {
        if (this.working.length < 5) return null;
        const allText = this.working.map(m => `[${m.type}/P${m.priority}${m.module ? '/' + m.module : ''}] ${m.content}`).join('\n');
        let summary = '';
        try {
            await AI.generate(
                `你是记忆压缩引擎。将以下${this.working.length}条工作记忆压缩为一段精炼摘要（保留关键信息、人物、情节要点、模块来源），不超过600字：\n\n${allText}`,
                {}, c => { summary += c; }
            );
            if (summary.length > 20) {
                await this.addSes
```

### assets/js/modules_split/phoenix/phoenix_ai.js:52

```js
._outlineFormatGuide()}`;

        const el = document.getElementById('ph-outline-raw');
        if (el) el.value = '';
        this.updateIO(prompt, '融合技法驱动生成中...');
        this._setGenerating(true);
        let fullRes = '';
        try {
            await AI.generate(prompt, { apiType: 'text', module: 'phoenix_outline_fusion_driven' }, c => {
                fullRes += c;
                if (el) el.value = fullRes;
                this.data.outlineRaw = fullRes;
                this.updateIO(prompt, fullRes);
```

### assets/js/modules_split/phoenix/phoenix_ai.js:150

```js
a.fusionContext.slice(0,1500);

        const el = document.getElementById('ph-outline-raw');
        if (el) el.value = '';
        this.updateIO(prompt, '生成中...');
        this._setGenerating(true);

        let fullRes = '';
        try {
            await AI.generate(prompt, { apiType: 'text', module: 'phoenix_outline_generate' }, c => {
                fullRes += c;
                if (el) el.value = fullRes;
                this.data.outlineRaw = fullRes;
                this.updateIO(prompt, fullRes);
```

### assets/js/modules_split/phoenix/phoenix_ai.js:211

```js
.context}\n\n请从断点处直接继续，不要任何开场白或解释，直接输出后续的卷章内容：`;

        console.log('[Phoenix] continueGen prompt length:', prompt.length);
        this.updateIO(prompt, '续写中...');
        this._setGenerating(true);
        let fullRes = '';
        try {
            await AI.generate(prompt, { apiType: 'text', module: 'phoenix_outline_continue' }, c => {
                fullRes += c;
                const el = document.getElementById('ph-outline-raw');
                if (el) { el.value = current.replace(/\s*$/, '\n\n') + fullR
```

### assets/js/modules_split/phoenix/phoenix_ai.js:253

```js
动作 / 人物变化 / 世界规则 / 伏笔钩子 / 实体线索 / 上下文记忆 / 一致性风险。`;
        const el = document.getElementById('ph-outline-raw');
        if(el) el.value = '';
        this.updateIO(prompt, '迭代优化中...');
        this._setGenerating(true);
        let fullRes = '';
        await AI.generate(prompt, { apiType: 'text', module: 'phoenix_outline_iterate' }, c => {
            fullRes += c;
            if(el) el.value = fullRes;
            this.data.outlineRaw = fullRes;
            this._updateStats();
        });
        this._setGenera
```

### assets/js/modules_split/phoenix/phoenix_ai.js:609

```js
当前细纲]\n${current.slice(0,6000)}\n\n请输出扩展后的完整细纲。`;
        const el = document.getElementById('ph-outline-raw');
        if(el) el.value = '';
        this.updateIO(prompt, '扩展细化中...');
        this._setGenerating(true);
        let fullRes = '';
        await AI.generate(prompt, { apiType: 'text', module: 'phoenix_outline_detail' }, c => {
            fullRes += c;
            if(el) el.value = fullRes;
            this.data.outlineRaw = fullRes;
            this._updateStats();
        });
        this._setGenerat
```

### assets/js/modules_split/phoenix/phoenix_ai.js:648

```js
const el = document.getElementById('ph-outline-raw') || document.getElementById('ph-outline-edit');
        if(el) el.value = '';
        this.updateIO(prompt, '融合技法润色中...');
        this._setGenerating(true);
        let fullRes = '';
        await AI.generate(prompt, { apiType: 'text', module: 'phoenix_outline_fusion_refine' }, c => {
            fullRes += c;
            if(el) { el.value = fullRes; }
            this.data.outlineRaw = fullRes;
            this._updateStats();
        });
        this.
```

### assets/js/modules_split/phoenix/phoenix_ai.js:700

```js
【输出格式】
## 节奏曲线图
(用文字描述节奏走势)

## 章节节奏表
| 章节 | 紧张度 | 类型 | 问题 |
|------|--------|------|------|

## 高潮分布
- 主要高潮：第X章、第Y章...
- 次要高潮：...

## 问题诊断
1. ...
2. ...

## 优化建议
1. ...
2. ...`;

        this.updateIO(prompt, '分析中...');
        let result = '';
        await AI.generate(prompt, { apiType: 'parse', module: 'phoenix_rhythm_analysis' }, c => {
            result += c;
            this.updateIO(prompt, result);
        });
        
        const el = document.getElementById('ph-outline-raw');
        if (el) {
```

### assets/js/modules_split/phoenix/phoenix_ai.js:756

```js
未回收、突兀出现）

【输出格式】
## 发现的问题 (共X个)

### 问题1：[问题类型]
- 位置：第X章
- 描述：...
- 严重程度：高/中/低
- 修复建议：...

### 问题2：...

## 总体评估
- 逻辑完整性：X/10
- 人物一致性：X/10
- 设定自洽性：X/10

## 优先修复建议
1. ...
2. ...`;

        this.updateIO(prompt, '检测中...');
        let result = '';
        await AI.generate(prompt, { apiType: 'parse', module: 'phoenix_outline_audit' }, c => {
            result += c;
            this.updateIO(prompt, result);
        });
        
        const el = document.getElementById('ph-outline-raw');
        if (el) {
```

### assets/js/modules_split/phoenix/phoenix_ai.js:803

```js
：
**章末钩子：** [钩子内容] (类型：悬念/反转/期待)

请输出优化后的完整细纲。`;

        const el = document.getElementById('ph-outline-raw');
        if (el) el.value = '';
        this.updateIO(prompt, '强化钩子中...');
        this._setGenerating(true);
        let result = '';
        await AI.generate(prompt, { apiType: 'text', module: 'phoenix_hook_enhance' }, c => {
            result += c;
            if (el) el.value = result;
            this.data.outlineRaw = result;
            this._updateStats();
            this.updateIO(prompt, result
```

### assets/js/modules_split/phoenix/phoenix_ai.js:847

```js
】** [高潮内容] (类型：打脸/突破/战斗/揭秘/情感)

请输出添加高潮后的完整细纲。`;

        const el = document.getElementById('ph-outline-raw');
        if (el) el.value = '';
        this.updateIO(prompt, '添加高潮中...');
        this._setGenerating(true);
        let result = '';
        await AI.generate(prompt, { apiType: 'text', module: 'phoenix_climax_design' }, c => {
            result += c;
            if (el) el.value = result;
            this.data.outlineRaw = result;
            this._updateStats();
            this.updateIO(prompt, resul
```

### assets/js/modules_split/phoenix/phoenix_ai.js:871

```js
1200) + '\n\n' : ''}${this.data.memoryContext ? '[记忆上下文]\n' + this.data.memoryContext.slice(0, 1200) + '\n\n' : ''}[当前大纲]\n${outline.slice(0,4000)}\n\n[作者要求]\n${txt}\n\n请根据作者要求修改或建议。若需要改大纲，直接输出可替换的完整段落；同时指出人物一致性和世界观风险。`;
        let reply = '';
        await AI.generate(contextPrompt, { apiType: 'text', module: 'phoenix_outline_chat' }, c => { reply += c; });
        log.innerHTML += `<div class="p-2 bg-white/5 rounded-lg border border-white/5"><span class="text-green-400 font-bold text-[10px]">AI</span><div class
```

### assets/js/modules_split/phoenix/phoenix_ai.js:964

```js
'\n\n' : ''}${this.data.memoryContext ? '[记忆上下文]\n' + this.data.memoryContext.slice(0, 1000) + '\n\n' : ''}[当前大纲]
${outlineForPrompt}

[作者要求]
${txt}

请直接输出修改后的相关段落，不要开场白。如果要求不涉及大纲修改，给出可执行建议。`;
        }

        let reply = '';
        try {
            await AI.generate(prompt, { apiType: 'text', module: 'phoenix_inline_chat' }, c => { reply += c; });
        } catch(e) {
            log.innerHTML += `<div class="p-1.5 bg-red-500/10 rounded border border-red-500/20"><span class="text-red-400 font-bold text-[9px]">
```

### assets/js/modules_split/phoenix/phoenix_ai.js:1096

```js
n class="text-green-400 font-bold text-[9px]">AI</span><div class="text-gray-300 mt-0.5 text-[10px]"><i class="fa-solid fa-circle-notch fa-spin mr-1"></i>正在续写细纲...</div></div>`;
                log.scrollTop = log.scrollHeight;
            }
            await AI.generate(prompt, { apiType: 'text', module: 'phoenix_inline_outline' }, c => { reply += c; });
        } catch(e) {
            if (log) log.innerHTML += `<div class="p-1.5 bg-red-500/10 rounded border border-red-500/20"><span class="text-red-400 font-bold
```

### assets/js/modules_split/phoenix/phoenix_ai.js:1190

```js
章目标 / 阻力与代价 / 情节动作 / 人物变化 / 世界规则 / 伏笔钩子 / 实体线索 / 上下文记忆 / 一致性风险。不要解释。`;
        const el = document.getElementById('ph-outline-raw');
        this._setGenerating(true);
        let result = '';
        try {
            if (el) el.value = '';
            await AI.generate(prompt, { apiType: 'text', module: 'phoenix_outline_optimize' }, c => {
                result += c;
                if (el) { el.value = result; this.data.outlineRaw = result; this._updateStats(); }
            });
            UI.toast(task + '完成'
```

### assets/js/modules_split/phoenix/phoenix_ai.js:1230

```js
级细纲。

【硬规则】
- 保持原结构和主要事件不变
- 补齐目标、阻力、代价、动作链、人物变化、规则边界、伏笔回收、实体线索
- 按M06删除抽象空话，改成动作、物件、对话错位和物理细节
- 章末必须能驱动下一章
- 禁止输出：读者期待、读者恐惧、技法标签、AI痕迹、内心OS、反应涟漪、本章分析

【待校准大纲】
${current.slice(0,6000)}

请直接输出校准后的完整大纲。`;
        let fullRes = '';
        try {
            await AI.generate(prompt, { apiType: 'text', module: 'phoenix_outline_polish' }, c => { fullRes += c; if(el) el.value = fullRes; this.updatePreview(); });
            UI.toast('大纲润色完成');
        } catch(e) {
            console.error('[Phoenix] aiPolishOutline error
```

### assets/js/modules_split/phoenix/phoenix_finish.js:446

```js
容",
    "geography":"地理与地貌内容",
    "magic":"魔法/科技体系内容",
    "factions":"势力与组织内容",
    "species":"种族与生物内容",
    "rules":"世界规则内容",
    "culture":"文化与习俗内容"
  },
  "summary":"世界观整体概述（100字以内）"
}

直接输出JSON，不要包裹markdown代码块。`;

        let fullRes = '';
        await AI.generate(prompt, {}, c => { fullRes += c; });

        let parsed = null;
        try {
            let cleanRes = fullRes.trim().replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '').trim();
            parsed = JSON.parse(cleanRes);
        } catc
```

### assets/js/modules_split/phoenix/phoenix_finish.js:804

```js
;
                }
            }
        } catch(e) {
            return UI.toast('读取章节失败: ' + e.message);
        }

        if (!allContent.trim()) {
            return UI.toast('未找到指定章节内容');
        }

        let raw = '';
        try {
            await AI.generate(
                `你是深度实体提取引擎。从以下章节内容中提取所有实体。

【提取类型】
- 人物：所有角色（主角、配角、反派），含性格、身份
- 物品：道具、武器、法宝、关键物件
- 地点：地名、场景、建筑、地标
- 情节：关键事件、转折点、冲突
- 伏笔：暗示、线索、未解之谜
- 势力：门派、组织、国家、阵营、家族

【章节内容】
${allContent.slice(0, 10000)}

【输出格式】JSON数组：
[{"name":"名称","type":"人物/物
```

### assets/js/modules_split/phoenix/phoenix_finish.js:927

```js
[];
        const existingNames = existingEntities.map(e => e.name);
        const existingHint = existingNames.length > 0 ? 
            `\n\n【已有实体(请建立关联)】\n${existingNames.slice(0, 30).join('、')}` : '';

        let raw = '';
        try {
            await AI.generate(
                `你是深度实体提取引擎。从以下章节内容中提取所有实体，并进行深度关联分析。${existingHint}

【提取类型】
- 人物：所有角色（主角、配角、反派），含性格、身份、能力
- 物品：道具、武器、法宝、关键物件
- 地点：地名、场景、建筑、地标
- 情节：关键事件、转折点、冲突
- 伏笔：暗示、线索、未解之谜
- 势力：门派、组织、国家、阵营、家族
- 种族：种族设定、族群特征

【章节内容】(共${chapterCount}章)
${allCont
```

### assets/js/modules_split/phoenix/phoenix_finish.js:1148

```js
erall_score": 85,\n  "critical_count": 0,\n  "warning_count": 0,\n  "top_fixes": ["最重要的3条修正建议"]\n}\n\n[待检细纲]\n${current.slice(0, 8000)}\n\n请只输出JSON，不要其他文字。`;

        let raw = '';
        try {
            App.showProgress('NEXUS自检', 1, 5);
            await AI.generate(prompt, (chunk) => { raw += chunk; }, { max_tokens: 4000, temperature: 0.1 });
            App.showProgress('NEXUS自检', 4, 5);

            const json = (() => { try { const m = raw.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : null; } catch(e
```

### assets/js/modules_split/phoenix/phoenix_finish.js:1229

```js
nt.slice(0, 8000)}\n\n请输出校准后的完整细纲，在修改处用【校准】标记。`;

        const el = document.getElementById('ph-outline-raw');
        if(el) el.value = '';
        this.updateIO(prompt, '细纲校准中...');
        this._setGenerating(true);
        let fullRes = '';
        await AI.generate(prompt, {}, c => {
            fullRes += c;
            if(el) el.value = fullRes;
            this.data.outlineRaw = fullRes;
            this._updateStats();
        });
        this._setGenerating(false);
        UI.toast('细纲校准完成', 'success');
```

### assets/js/modules_split/phoenix/phoenix_step1.js:136

```js
必须写预计回收点
	- 实体必须是可复用的“要素节点”，不要把上下文记忆、情绪句、摘要句、普通动作、一次性日用品当实体
	- relations 只能指向本次输出中的其他实体名，用来画图谱连线；不要塞一长串杂物
	- 不要遗漏主角、核心反派、核心世界规则、第一卷主伏笔`;

        try {
            this._setEntityExtractStatus(`本地已识别 ${localEntities.length} 个实体，解析模型增强中...`);
            await AI.generate(prompt, { apiType: 'parse', module: 'phoenix_outline_entity_extract' }, c => {
                fullRes += c;
                this._setEntityExtractStatus(`解析模型增强中... 已接收 ${fullRes.length} 字`);
            });
        } catch(e) {
            consol
```

### assets/js/modules_split/phoenix/phoenix_step1.js:1128

```js
"summary":"世界观整体概述（100字以内）"
}

	实体名必须是短名词；relations只保留3-8条关键关系，且只能指向实体名。
	直接输出JSON，不要包裹markdown代码块。`;

        let fullRes = '';
        let charCount = 0;
        
        if (progressStatus) progressStatus.textContent = '正在调用AI解析...';
        
        await AI.generate(prompt, {}, c => {
            if (this._parseStopFlag) return;
            fullRes += c;
            charCount += c.length;
            if (progressStatus) progressStatus.textContent = `正在接收解析结果... (${charCount}字)`;
        });
        
        if
```

### assets/js/modules_split/phoenix/phoenix_step2.js:155

```js
) 和最大风险

【输出格式】
## 创意一：标题
- 一句话：...
- CHR：...
- WLD：...
- FOE/EMO：...
- 可写指数：X/10
- 最大风险：...

请直接输出5个创意。`;

        const ideaEl = document.getElementById('ph-idea');
        this.updateIO(prompt, 'AI头脑风暴中...');
        
        let result = '';
        await AI.generate(prompt, { apiType: 'text', module: 'phoenix_idea_brainstorm' }, c => {
            result += c;
            this.updateIO(prompt, result);
        });
        
        if (ideaEl && result) {
            ideaEl.value = (ideaEl.value || '') + '\n\n-
```

### assets/js/modules_split/phoenix/phoenix_step2.js:211

```js
界引擎
...

## 主要人物
- 配角A：...
- 反派B：...

## 剧情规划
### 第一卷：xxx
- 核心事件
- 具体动作/物件/对话错位
- 人物变化/规则变化
- 卷末高潮

请详细扩展。`;

        const ideaEl = document.getElementById('ph-idea');
        this.updateIO(prompt, 'AI扩展中...');
        
        let result = '';
        await AI.generate(prompt, { apiType: 'text', module: 'phoenix_idea_expand' }, c => {
            result += c;
            this.updateIO(prompt, result);
        });
        
        if (ideaEl && result) {
            ideaEl.value = idea + '\n\n---\n【AI扩展结果】\n' + re
```

### assets/js/modules_split/phoenix/phoenix_step2.js:268

```js
06风险：是否容易写成空话、解释设定、抽象情绪

【输出格式】
## 可写性评估
- 可写指数：X/10
- 主要优势：...
- 最大风险：...

## 创意亮点
1. ...
2. ...

## 潜在问题
1. ...
2. ...

## 优化建议
1. ...
2. ...

## 综合评分：X/10

请客观分析。`;

        this.updateIO(prompt, 'AI分析中...');
        
        let result = '';
        await AI.generate(prompt, { apiType: 'parse', module: 'phoenix_idea_analysis' }, c => {
            result += c;
            this.updateIO(prompt, result);
        });
        
        const outlineEl = document.getElementById('ph-outline-raw');
        if (outlineE
```

### assets/js/modules_split/rag/rag_core.js:462

```js
'...' : ''}`).join('\n---\n');
        }
        if (tier3.length > 0) {
            const compressText = tier3.map(r => `[${r.source}] ${r.title}: ${r.content.slice(0, 500)}`).join('\n');
            let summary = '';
            try {
                await AI.generate(
                    `你是上下文压缩引擎。将以下${tier3.length}条检索结果压缩为一段精炼的创作参考，保留关键信息（人物、设定、技法要点、伏笔、情绪节奏），不超过300字：\n\n${compressText.slice(0, 4000)}`,
                    {}, c => { summary += c; }
                );
            } catch (e) {}
            if
```

### assets/js/modules_split/rag/rag_core.js:657

```js
ts || [];
        const candidates = results.slice(0, Math.min(results.length, 30));
        const list = candidates.map((r, i) => `[${i}] (${r.source}) ${r.title}: ${r.content.slice(0, 150)}`).join('\n');
        let raw = '';
        try {
            await AI.generate(
                `你是上下文相关性评估引擎。给定查询和候选结果，返回最相关的${topK}个结果编号（按相关性从高到低排列）。

查询: ${query}

候选结果:
${list}

只输出编号数组，如 [0,3,7,1,5]。不要解释。`,
                {}, c => { raw += c; }
            );
            // 解析编号
            const m = raw.match(/\[[\d,\s
```

### assets/js/modules_split/rag/rag_core.js:714

```js
).slice(0, limit);
    },

    // —— AI 智能摘要 (将检索结果压缩为精炼上下文) ——
    async aiSummarize(query, maxTokens = 4000) {
        const context = await this.buildContext(query, maxTokens);
        if (!context.trim()) return '';
        let summary = '';
        await AI.generate(
            `你是上下文压缩引擎。将以下检索结果压缩为一段精炼的创作参考上下文，保留所有关键信息（人物、事件、设定、关系），去除冗余。不超过800字。\n\n检索词: ${query}\n\n${context}`,
            {}, c => { summary += c; }
        );
        return summary;
    },

    // —— 获取数据源统计 ——
    async getSourceStats() {
```

### assets/js/modules_split/settings/settings_api.js:107

```js
eConfig('text');
            if(!config) { el.textContent = '❌ 未找到激活的 API 配置'; el.className = 'text-xs text-red-400 font-mono p-2 bg-black/30 rounded min-h-[40px]'; return; }
            const start = Date.now();
            let result = '';
            await AI.generate('请回复"连接成功"四个字。', {}, c => { result += c; });
            const ms = Date.now() - start;
            el.textContent = '✅ 连接成功 (' + ms + 'ms)\n模型: ' + config.model_name + '\n响应: ' + result.slice(0, 100);
            el.className = 'text-xs text-green
```

### assets/js/modules_split/settings/settings_api_pool.js:365

```js
UI.toast('测试中...');
        const api = await DB.get(type + '_api_pool', id);
        if (!api) return UI.toast('API 不存在', 'error');
        try {
            let ok = false;
            if (['text','parse','fusion'].includes(type)) {
                await AI.generate('Hello', { useModel: api, noReaderProtocol: true, apiType: type }, () => {});
                ok = true;
            } else {
                // 非文本API简单ping测试
                const resp = await fetch(api.base_url.replace(/\/$/, '') + '/', { method
```

### assets/js/modules_split/toolbox/toolbox_tools.js:106

```js
=== 'world') {
                // 尝试提取实体
                const prompt = `从以下文本中提取所有实体信息，返回JSON数组格式：[{"name":"名称","type":"类型(人物/物品/地点/势力/规则等)","desc":"描述"}]\n\n${content.slice(0, 3000)}`;
                UI.toast('正在提取实体...');
                const res = await AI.generate(prompt);
                let entities = [];
                try { entities = JSON.parse(res.replace(/```json?\n?/g,'').replace(/```/g,'').trim()); } catch(e) {
                    const m = res.match(/\[[\s\S]*\]/); if (m) try { entities = JSON.par
```

### assets/js/modules_split/toolbox/toolbox_tools.js:169

```js
以下全局创作上下文，生成一份综合分析报告，包括：当前创作进度评估、各模块数据一致性检查、下一步创作建议：\n\n${ctx}\n${extra ? '\n附加要求: ' + extra : ''}`;
            }
            if (!prompt) return outEl.innerHTML = '<div class="text-dim text-sm">请选择联动模式</div>';
            let fullRes = '';
            await AI.generate(prompt, {}, c => { if (!fullRes) outEl.innerHTML = ''; fullRes += c; outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(fullRes) : fullRes; });
            W.history.push({ tool: '跨模块联动', mode, result: fullRes, ts: Date.now() });
```

### assets/js/modules_split/toolbox/toolbox_tools.js:254

```js
outEl.innerHTML = '<div class="flex items-center gap-2 text-amber-400 animate-pulse p-4"><i class="fa-solid fa-circle-notch fa-spin"></i> 正在生成...</div>';
        W.updateIO(prompt, '生成中...');

        try {
            let fullRes = '';
            await AI.generate(prompt, {}, chunk => {
                if (!fullRes) outEl.innerHTML = '';
                fullRes += chunk;
                outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(fullRes) : fullRes;
                W.updateIO(prompt, fullR
```

### assets/js/modules_split/toolbox/toolbox_tools.js:285

```js
上文的内容，保持风格和逻辑一致，从上次结束的地方接着写：\n\n' + prev.slice(-2000);
        outEl.innerHTML += '<div class="text-amber-400 animate-pulse mt-2"><i class="fa-solid fa-circle-notch fa-spin"></i> 继续生成中...</div>';
        try {
            let fullRes = prev;
            await AI.generate(prompt, {}, chunk => {
                fullRes += chunk;
                outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(fullRes) : fullRes;
            });
            Modules.workshop.updateIO('继续生成', fullRes);
        } catch(e) {
```

### assets/js/modules_split/toolbox/toolbox_tools.js:396

```js
t');
        if (outEl) {
            outEl.innerHTML = '<div class="flex items-center gap-2 text-cyan-400 animate-pulse"><i class="fa-solid fa-circle-notch fa-spin"></i> AI对比分析中...</div>';
            try {
                let res = '';
                await AI.generate(prompt, {}, c => { res += c; outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(res) : res; });
            } catch(e) { outEl.innerHTML = '<div class="text-red-400">对比分析失败: ' + e.message + '</div>'; }
        }
        // 关闭弹窗
```

### assets/js/modules_split/tools_center/tools_center_workflow.js:98

```js
用不同的表达方式改写以下内容，保持核心含义：',
            extract: '请从以下文本中提取关键信息（人物、事件、地点、时间等）：'
        };

        if (defaultPrompts[type]) {
            const prompt = (customPrompt || defaultPrompts[type]) + '\n\n' + input;
            let res = '';
            await AI.generate(prompt, opts, c => { res += c; if (ioOut) { ioOut.value = `[${node.data.label || type}] 实时输出:\n${res}`; ioOut.scrollTop = ioOut.scrollHeight; } });
            return res;
        }
        if (type === 'output') return input;

        if (typ
```

### assets/js/modules_split/tools_center/tools_center_workflow.js:107

```js
if (type === 'condition') {
            const condPrompt = customPrompt || '判断以下内容是否满足条件';
            const judgePrompt = `请判断以下内容是否满足条件："${condPrompt}"\n\n内容：${input.slice(0,2000)}\n\n请只回答"是"或"否"。`;
            let res = '';
            await AI.generate(judgePrompt, opts, c => { res += c; });
            node._condResult = res.includes('是') ? 'out_0' : 'out_1';
            return input;
        }

        if (type === 'loop') {
            const count = parseInt(node.data.count) || 3;
```

### assets/js/modules_split/tools_center/tools_center_workflow.js:119

```js
nput;
            const iterPrompt = customPrompt || '请在保持核心内容的基础上进一步优化以下文本';
            for (let i = 0; i < count; i++) {
                const p = `${iterPrompt}（第${i+1}/${count}次迭代）：\n\n${current}`;
                let res = '';
                await AI.generate(p, opts, c => { res += c; if (ioOut) { ioOut.value = `[${node.data.label || '循环'}] 迭代${i+1}/${count}:\n${res}`; ioOut.scrollTop = ioOut.scrollHeight; } });
                current = res;
            }
            return current;
        }
```

### assets/js/modules_split/tools_center/tools_center_workflow.js:132

```js
;
            if (!agentId) return '[错误] 未选择智能体';
            const agents = await this._getAgents();
            const agent = agents.find(a => a.id === agentId);
            if (!agent) return '[错误] 智能体不存在';
            let res = '';
            await AI.generate(agent.prompt + '\n\n用户输入：\n' + input, opts, c => { res += c; if (ioOut) { ioOut.value = `[${agent.name}] 实时输出:\n${res}`; ioOut.scrollTop = ioOut.scrollHeight; } });
            return res;
        }

        if (type === 'chat_node') {
```

### assets/js/modules_split/tools_center/tools_center_workflow.js:140

```js
return res;
        }

        if (type === 'chat_node') {
            const userInput = window.prompt('对话节点 - 请输入你的回复：\n\n上下文：' + input.slice(0, 300));
            if (!userInput) return input;
            let res = '';
            await AI.generate(`上下文：\n${input}\n\n用户回复：${userInput}\n\n请根据上下文和用户回复继续对话：`, opts, c => { res += c; });
            return res;
        }

        if (type === 'subworkflow') {
            const wfId = node.data.workflowId;
            if (!wfId) return '[错误]
```

### assets/js/modules_split/tools_center/tools_center_workflow.js:578

```js
请回复用户最新消息：`;
        let res = '';
        this.agentChatLog.push({ role: 'assistant', content: '', agent: agent.name });
        this._agentGenerating = true;
        const currentAgentId = this.agentChatId; // 记住当前智能体ID
        try {
            await AI.generate(prompt, {}, c => {
                res += c;
                this.agentChatLog[this.agentChatLog.length - 1].content = res;
                // 只有当前显示的还是这个智能体时才更新UI
                if (this.agentChatId === currentAgentId && log) {
```

### assets/js/modules_split/web_chat/web_chat_core.js:303

```js
">
                                <i class="fa-solid fa-copy mr-1"></i>复制
                            </button>
                            <button class="h-8 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-gray-300" onclick="Modules.web_chat.regenerate()">
                                <i class="fa-solid fa-rotate-right mr-1"></i>重答
                            </button>
                        ` : `
                            <button class="h-8 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-[1
```

### assets/js/modules_split/web_chat/web_chat_core.js:1517

```js
!s) return;
        if (!s.title || s.title === '新对话') s.title = (userText || '新对话').slice(0, 28).replace(/\s+/g, ' ');
        s.preview = (answerText || userText || '').slice(0, 80).replace(/\s+/g, ' ');
        s.updatedAt = Date.now();
    },

    async regenerate() {
        if (this._generating) return;
        const lastUserIndex = [...this.messages].map((m, i) => ({ m, i })).reverse().find(x => x.m.role === 'user')?.i;
        if (lastUserIndex == null) return UI.toast('没有可重答的问题');
        const lastUser =
```

### assets/js/modules_split/world/world_chapters.js:295

```js
2. 明确关键事件和转折点
3. 规划人物出场和互动
4. 标注情感节奏和氛围营造
5. 与世界观和已有实体相结合
6. 字数约500-800字`;

        const outlineEl = document.getElementById('we-chapter-outline');
        if(outlineEl) outlineEl.value = '生成中...';
        
        let fullRes = '';
        await AI.generate(prompt, {}, c => { 
            fullRes += c; 
            if(outlineEl) outlineEl.value = fullRes; 
        });
        
        UI.toast('AI 细纲生成完成');
    },

    async _extractChapterEntities() {
        const we = Modules.world_engine;
```

### assets/js/modules_split/world/world_chapters.js:332

```js
const prompt = `请从以下章节细纲中提取涉及的实体名称，只返回实体名称列表，用逗号分隔：
【章节细纲】
${outlineEl.value}

【已有实体库（请尽可能匹配这些名称）】
${existingNames.join('、') || '无'}

只返回实体名称，用逗号分隔，不要其他内容。`;

        UI.toast('正在提取实体...');
        let fullRes = '';
        await AI.generate(prompt, {}, c => { fullRes += c; });
        
        const extractedNames = fullRes.split(/[,，\n]/).map(s => s.trim()).filter(Boolean);
        if(entitiesEl) entitiesEl.value = extractedNames.join(', ');
        
        UI.toast(`已提取 ${extr
```

### assets/js/modules_split/world/world_import.js:518

```js
80字)", "relations": ["关系类型:关联实体名"]}
  ]
}

【关键要求】
- 实体名必须是短名词，不要用一整句话当实体名
- 每个实体的relations只保留3-8条关键关系，并且只能指向实体名
- 关系类型例如：师父、徒弟、敌对、盟友、所属、位于、拥有、使用等
- 直接输出JSON，不要包裹markdown代码块`;

            UI.toast('AI智能解析中...');
            let fullRes = '';
            await AI.generate(prompt, {}, c => { fullRes += c; });
            
            let parsed = null;
            try {
                let cleanRes = fullRes.trim();
                cleanRes = cleanRes.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '').trim
```

### assets/js/modules_split/world/world_novel_import.js:1055

```js
第1部分标题","function":"开场/推进/转折/收束","summary":"本部分发生了什么，必须具体","entities":["人物/地点/物品/规则"],"hook":"本部分留下的钩子或信息差"}
  ]
}

规则：
1. 只能基于原文，不能新增剧情。
2. 每个部分都要能指导后续续写，不要写主题口号。
3. 实体线索必须能同步到世界引擎知识图谱，并服务后续执笔台续写。
4. 一致性风险要指出续写时最容易写崩的地方。`;
        let raw = '';
        await AI.generate(prompt, { apiType: 'parse', module: 'world_import_outline', max_tokens: 2600, temperature: 0.2 }, c => { raw += c; });
        const clean = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();
        let json = null;
        t
```

### assets/js/modules_split/world/world_novel_import.js:1191

```js
的卷，则 volumes 留空数组，所有章的 volumeOrder 为 1\n2. 章按自然顺序编号\n3. 原文正文会直接进入执笔台，不要改写原文\n4. outline 必须按固定细纲格式写，方便下一步从细纲提取实体并同步世界引擎\n5. 实体线索要写人物、地点、势力、物品、能力、规则、关系；不要写成抽象主题\n\n文本开头（前12000字）：\n${sample}`;

            let raw = '';
            try {
                await AI.generate(prompt, { apiType: 'parse', module: 'world_import_structure', max_tokens: 2000, temperature: 0.1 }, chunk => { raw += chunk; });
                const json = (() => { try { const m = raw.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : null; } c
```

### assets/js/modules_split/world/world_novel_import.js:1255

```js
s 最多提取30个最关键实体，优先主角、重要配角、世界规则、未回收伏笔、关键地点\n3. type 必须从给定类型中选\n4. relations 用于世界引擎知识图谱关联\n5. 优先从章内细纲提取；正文样本只用于校验和补充，不要让正文覆盖细纲设定\n6. 只能提取原文明确内容；推断内容必须在desc中标注“推断”\n\n小说片段：\n${sampleText.slice(0, 12000)}`;

        let raw = '';
        try {
            await AI.generate(prompt, { apiType: 'parse', module: 'world_import_entities', max_tokens: 4000, temperature: 0.2 }, chunk => { raw += chunk; });
            const json = (() => { try { const m = raw.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : null; } catch(
```

### assets/js/modules_split/world/world_novel_import.js:1708

```js
rue
            }
        });
	        await this._syncImportedOutlineToPhoenix(data, phoenixOutline);
    },

    async _extractStyleFingerprint(text) {
        const sample = text.slice(0, 3000);
        let result = '';
        try {
            await AI.generate(
                `分析以下小说片段的文风特征，输出JSON格式：
{
  "sentencePattern": "句式特征（长短句比例、修辞偏好）",
  "vocabulary": "词汇偏好（文言/白话、华丽/朴实）",
  "rhythm": "节奏模式（快节奏/慢节奏、段落长度）",
  "descriptionStyle": "描写风格（细腻/粗犷、感官侧重）",
  "dialogueStyle": "对话风格（简洁/冗长、标点特征）",
  "
```

### assets/js/modules_split/world/world_novel_import.js:1739

```js
''}`).join('\n');
	        const prompt = `请对以下小说生成精炼的导入摘要（不超过300字），包含：主要人物、核心冲突、世界观概要、已完结构。
	
一句话开书：
${(data.bookBrief || '').slice(0, 800)}

人物：${characterNames}
章节概要：
${outline.slice(0, 1500)}`;
        let summary = '';
        try {
            await AI.generate(prompt, { apiType: 'parse', module: 'world_import_summary' }, c => { summary += c; });
        } catch(e) {}
        return summary || `导入作品：共${data.chapters.length}章，主要人物${characterNames}`;
    },

    // 设置续写起点
    async _setContinuationPoin
```

### assets/js/modules_split/world/world_pipeline.js:223

```js
称：${name}\n已有描述：${desc || '无'}${pipelineCtx}\n\n要求：\n1. 外貌/特征描述\n2. 背景故事\n3. 性格/属性\n4. 与其他实体的潜在关系\n5. 在故事中的作用和定位\n6. 独特的标志性特点`;
        const el = document.getElementById('we-ent-desc');
        el.value = '生成中...';
        let fullRes = '';
        await AI.generate(prompt, {}, c => { fullRes += c; el.value = fullRes; });
        UI.toast('AI 扩写完成');
    },

    // ═══ 从融合拆书深度提取实体 (12类型) — 修复: 确保关系正确、同步刷新图谱+世界观 ═══
    extractFromFusion: async () => {
        const we = Modules.world_engine;
        con
```

### assets/js/modules_split/world/world_pipeline.js:273

```js
句、摘要、杂物清单
- 关系类型例如：师父、徒弟、敌对、盟友、所属、位于、拥有、使用、参与、创造、守护、统治等
- 人物之间要有师徒/敌友/从属关系
- 人物与地点要有"位于"/"出没"关系
- 人物与物品要有"拥有"/"使用"关系
- 人物与势力要有"所属"/"统治"关系
- 情节与人物要有"参与"关系
- 直接输出JSON，不要包裹markdown代码块`;

        UI.toast('正在深度提取实体...');
        let fullRes = '';
        await AI.generate(prompt, {}, c => { fullRes += c; });

        // ═══ 健壮JSON解析（6层容错） ═══
        let entities = null;
        // 预处理: 去掉markdown代码块包裹
        let cleanRes = fullRes.trim();
        cleanRes = cleanRes.replace(/^```(?:json)?\s*\n?/i, '').replac
```

### assets/js/modules_split/world/world_pipeline.js:462

```js
ON对象：
{"history":"详细内容","geography":"详细内容","magic":"详细内容","factions":"详细内容","species":"详细内容","rules":"详细内容","culture":"详细内容"}

注意：每个维度至少200字，要具体、可直接用于创作。直接输出JSON，不要包裹markdown代码块`;

        UI.toast('正在提取世界观...');
        let fullRes = '';
        await AI.generate(prompt, {}, c => { fullRes += c; });

        let worldData = null;
        try { worldData = JSON.parse(fullRes); } catch(e1) {
            try { worldData = JSON.parse(fullRes.replace(/```json?\s*/g,'').replace(/```/g,'').trim()); } catch(e2)
```

### assets/js/modules_split/world/world_pipeline.js:529

```js
0) : '【当前为空，请从零构建】'}\n${refCtx}\n\n要求：\n1. 内容详细、具体、有层次感\n2. 包含具体的名称、数据、细节\n3. 适合直接用于小说创作\n4. 至少500字\n5. 使用清晰的分段和标题`;
        const el = document.getElementById('we-world-editor');
        if(el) el.value = '生成中...';
        let fullRes = '';
        await AI.generate(prompt, {}, c => { fullRes += c; if(el) el.value = fullRes; });
        UI.toast('AI 世界观生成完成');
    },

    // ═══ 知识图谱 3D — 核心修复: 真正的网络结构，不是孤立的点 ═══
    // 每个实体(人物/物品/地点/情节/伏笔/势力/种族/能力/魔法/世界规则/文化/历史)
    // 都是一个具体节点，通过关系连线交织成3D网络
    _graph3d
```

### assets/js/modules_split/writer/writer_ai.js:153

```js
utoPolishEnabled());
        } catch (e) {
            console.warn('[Writer] auto polish flag read failed:', e);
            return false;
        }
    },

    async _generateTextBuffer(prompt, aiOptions, onProgress) {
        let buffer = '';
        await AI.generate(prompt, aiOptions, c => {
            buffer += c;
            if (typeof onProgress === 'function') onProgress(buffer, c);
            else this.updateIO(prompt, buffer);
        });
        return buffer;
    },

    async _runPolishText(text, {
```

### assets/js/modules_split/writer/writer_ai.js:493

```js
owMode !== 'manual' },
                successToast: '生成完成，正在从正文+细纲反推细纲和提取实体...',
                memoryTag: '[执笔/AI续写] '
            });
            return;
        }

        this._setGenerating(true);

        const startLen = content.length;
        await AI.generate(prompt, { apiType: 'text', module: 'writer', flowMode: opts.flowMode || 'hybrid' }, c => {
            if (editor) { editor.value += c; this.onInput(); }
            this.updateIO(prompt, editor ? editor.value.slice(-2000) : c);
        });
```

### assets/js/modules_split/writer/writer_ai.js:584

```js
saveOptions: { silent: true, forcePostProcess: true },
                successToast: '融合写作完成，正在从正文+细纲反推细纲和提取实体...'
            });
            return;
        }

        this._setGenerating(true);

        const startLen = content.length;
        await AI.generate(prompt, { apiType: 'text', module: 'writer', flowMode: 'fusion' }, c => {
            if (editor) { editor.value += c; this.onInput(); }
            this.updateIO(prompt, editor ? editor.value.slice(-2000) : c);
        });
        this._setGenerat
```

### assets/js/modules_split/writer/writer_ai.js:1122

```js
()}</span>
            </div>
            <div class="text-gray-300 text-xs leading-relaxed"><i class="fa-solid fa-spinner fa-spin mr-1"></i>思考中...</div>
        </div>`;
        log.scrollTop = log.scrollHeight;
        
        let reply = '';
        await AI.generate(contextPrompt, { apiType: 'text', module: 'writer_assistant' }, c => {
            reply += c;
            const msgEl = document.getElementById(aiMsgId);
            if (msgEl) {
                const contentDiv = msgEl.querySelector('div:last-chi
```

### assets/js/modules_split/writer/writer_batch.js:256

```js
// ── 生成正文（带实时字数显示 + 流式输出） ──
        let content = '';
        let lastUpdate = 0;
        let firstChunkReceived = false;
        try {
            // max_tokens：8192（glm-5.1支持32K上下文，留足余量写2500字正文）
            const maxTokens = 8192;
            await AI.generate(writePrompt, { apiType: 'text', module: 'writer_auto_current', max_tokens: maxTokens, temperature: 0.85 }, c => {
                content += c;
                const now = Date.now();
                // 首字响应后立刻更新状态
                if (!firstChunkRe
```

### assets/js/modules_split/writer/writer_batch.js:583

```js
? '运用融合技法中的套路（钩子、节奏、爽点）' : '文风统一，情节连贯'}
3. ${worldCtx || ragContext ? '参考上下文保持世界观/人设/伏笔一致性' : '保持前后文一致'}
4. M06/M07强制默认规则最高优先级，必须同时遵守NEXUS OS L1铁律
5. 字数约${targetWords}字
6. 直接输出正文，不要标题`;
            try {
                let content = '';
                await AI.generate(writePrompt, { apiType: 'text', module: 'writer_scoped_auto', max_tokens: 8192, temperature: 0.85 }, c => {
                    content += c;
                    if (editorEl) editorEl.value = content;
                    W.onInput();
```

### assets/js/modules_split/writer/writer_batch.js:698

```js
塑造**
   - 人物性格是否一致
   - 对话是否符合人物身份
   - 人物动机是否清晰

3. **文笔风格**
   - 叙事节奏是否恰当
   - 描写是否生动具体
   - 是否有冗余或重复

4. **读者体验**
   - 开头是否吸引人
   - 情绪曲线是否合理
   - 悬念和钩子设置

5. **改进建议**
   - 具体的修改建议
   - 优先级排序

请用清晰的Markdown格式输出诊断报告。`;

        let result = '';
        await AI.generate(prompt, {}, c => { result += c; });
        
        if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none">${this._formatMarkdown(result)}</div>`;
        UI.toast('诊断完成');
    },

    async analyzeContent() {
```

### assets/js/modules_split/writer/writer_batch.js:756

```js
- 标注情绪高低点
   - 分析节奏控制效果
   - 提出优化建议

3. **爽点/看点分析**
   - 识别文中的爽点
   - 分析爽点设置效果
   - 建议增加的爽点

4. **悬念体系分析**
   - 伏笔设置情况
   - 钩子效果评估
   - 悬念链完整性

5. **读者心理分析**
   - 预期读者情绪变化
   - 可能的弃读点
   - 优化建议

请用Markdown格式输出详细分析报告。`;

        let result = '';
        await AI.generate(prompt, {}, c => { result += c; });
        
        if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none">${this._formatMarkdown(result)}</div>`;
        UI.toast('深度分析完成');
    },

    async summarizeContent() {
```

### assets/js/modules_split/writer/writer_batch.js:786

```js
const prompt = `请对以下小说内容进行总结概述：

【内容】
${content.slice(0, 8000)}

【输出要求】
1. **一句话概括**（20字以内）
2. **核心情节**（100字以内）
3. **关键人物**（列出出场人物及其行动）
4. **重要场景**（列出主要场景）
5. **伏笔/悬念**（如有）
6. **情绪走向**（从...到...）

请简洁清晰地输出。`;

        let result = '';
        await AI.generate(prompt, {}, c => { result += c; });
        
        if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none">${this._formatMarkdown(result)}</div>`;
        UI.toast('总结完成');
    },
});
```

### assets/js/modules_split/writer/writer_consistency.js:53

```js
const resultEl = document.getElementById('w-diagnose-result');
        if (resultEl) resultEl.innerHTML = '<div class="text-dim text-xs flex items-center gap-2"><i class="fa-solid fa-spinner fa-spin"></i>正在深度检测人设一致性...</div>';

        try {
            await AI.generate(prompt, {}, chunk => {
                result += chunk;
                if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">${typeof marked !== 'undefined' ? marked.parse(result) : result}</di
```

### assets/js/modules_split/writer/writer_core.js:1190

```js
世界引擎，不要写主题分析
3. 保留正文里已经发生的事实，不得改剧情
4. 每个部分必须能被执笔台直接继续写
5. 最后补一行：章末钩子：具体钩子内容
6. 只输出细纲，不要解释。`;

        try {
            let outline = '';
            this._updateSyncProgress('反推章内细纲 · 调用解析 API', 3, 7, { showProgress: !!opts.showProgress });
            await AI.generate(prompt, { apiType: 'parse', module: 'writer', max_tokens: 2048, temperature: 0.5 }, c => {
                outline += c;
                if (opts.showProgress && outline.length % 300 < c.length) {
                    this._updateSyncProgress(`反推章内细
```

### assets/js/modules_split/writer/writer_core.js:1279

```js
/势力/魔法/规则/伏笔","desc":"详细描述（包含本章关键行为和状态）","relations":"关联的其他实体名，逗号分隔"}
]

只输出JSON数组，不要任何其他文字。`;

        try {
            let jsonStr = '';
            this._updateSyncProgress('实体提取 · 调用解析 API', 5, 7, { showProgress: !!opts.showProgress });
            await AI.generate(prompt, { apiType: 'parse', module: 'writer', max_tokens: 3000, temperature: 0.25 }, c => {
                jsonStr += c;
                if (opts.showProgress && jsonStr.length % 240 < c.length) {
                    this._updateSyncProgress(`实体提取
```

### assets/js/modules_split/writer/writer_panel.js:188

```js
(0, 1000) + '\n\n' : ''}
【细化要求】
- 拆成3到6个场次。
- 每个场次必须有可拍出来的动作链，不能只有概念。
- 每个场次至少绑定1个物件或环境反馈。
- 对话关键句只给正文可用台词，不解释潜台词。
- 人物变化必须写成可观察变化，不写抽象心理。
- 规则/伏笔只写本章实际触碰、埋设、强化或回收的内容。
- 章末钩子必须是未完成动作 + 意外信息/时间压力/信息差。`;

        let result = '';
        try {
            await AI.generate(prompt, { apiType: 'text', module: 'writer_outline_refine' }, c => { result += c; });
            this._showOutlineConfirm(this._sanitizeOutlineDraft(result), outlineEl ? outlineEl.value : '');
            UI.toast('大纲细化完成，请确认是否替换');
        } catc
```

### assets/js/modules_split/writer/writer_panel.js:245

```js
、写作意图、M06、NEXUS、读者协议。

【输出格式】
直接输出修改后的完整大纲。优先使用：
【场次X：短标题】
- 场次目标：
- 冲突阻力：
- 动作链：
- 物件与环境反馈：
- 对话关键句：
- 人物状态变化：
- 规则/伏笔影响：
- 实体线索：
- 本场信息缺口：

【用户要求】${demand}

【当前大纲】
${outline}

只输出修改后的完整大纲，不要解释修改过程。`;

        let result = '';
        try {
            await AI.generate(prompt, { apiType: 'text', module: 'writer_outline_edit' }, c => { result += c; });
            this._showOutlineConfirm(this._sanitizeOutlineDraft(result), outlineEl ? outlineEl.value : '');
            if (input) input.value = '';
            UI.
```

### assets/js/modules_split/writer/writer_panel.js:492

```js
';
        const prompt = `你是一位专业网文编辑。${instruction}

${proseContract}

【强制默认写文规则】
${hardRules}

【待处理内容】
${targetText}

【要求】
	- 直接输出处理后的文本，不要任何开场白
	- 保持原有风格和人物设定一致
	- 如果是续写，确保无缝衔接上文
	- 如果样本文风或用户要求与强制默认写文规则冲突，按强制默认规则执行`;

        let result = '';
        await AI.generate(prompt, {}, c => { result += c; });
        if (this._sanitizeEditableProse) result = this._sanitizeEditableProse(result);
        
        if (log) log.innerHTML += `<div class="p-1.5 bg-white/5 rounded border border-white/5"><span class="text-gre
```

### assets/js/modules_split/writer/writer_panel.js:575

```js
理？
4. **伏笔回收**：前文埋下的伏笔是否被提及或回收？
5. **逻辑一致性**：剧情推进是否合理？因果关系是否成立？
6. **称谓一致性**：同一角色/地点的称呼是否统一？

【输出格式】
### 总体评分：X/10
### 问题列表（按严重程度排序）
- [严重/中等/轻微] 具体问题描述 → 修复建议
### 未发现问题的维度
### 一句话总结

请用Markdown格式输出。`;

        let result = '';
        try {
            await AI.generate(prompt, {}, c => { result += c; });
            if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none">${this._formatMarkdown(result)}</div>`;
            UI.toast('一致性检测完成');
        } catch(e) {
            if (re
```

### assets/js/modules_split/writer/writer_panel.js:601

```js
xt.length < 100) return UI.toast('原文样例太短，至少需要100字', 'error');

        const prompt = this._getStyleExtractPrompt(sourceText);

        this._setGenerating(true);
        UI.toast('正在分析文风...');
        
        let result = '';
        try {
            await AI.generate(prompt, {}, c => { result += c; });
            if (result.trim()) {
                resultEl.value = this._mergeStyleRules ? this._mergeStyleRules(result.trim()) : result.trim();
                UI.toast('文风提取完成！');
            } else {
```

### assets/js/modules_split/writer/writer_panel.js:799

```js
面感强弱
- 是否有" telling 过多 "的问题？

### 4️⃣ 剧情结构（0-10分）
- 起承转合是否清晰
- 伏笔/悬念设置
- 与大纲的契合度

### 5️⃣ 综合评分与改进优先级
- 总分：/50
- Top 3 最优先改进点（具体到段落位置）
- 一句话总结：本章最大的亮点 + 最大的短板

请用清晰的Markdown格式输出。避免空泛评价，每个扣分点都要给出"怎么改"。`;

        let result = '';
        try {
            await AI.generate(prompt, {}, c => { result += c; });
            if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none">${this._formatMarkdown(result)}</div>`;
            UI.toast('诊断完成');
        } catch(e) {
            if (resul
```

### assets/js/modules_split/writer/writer_panel.js:841

```js
utline.slice(0, 1000) || '无'}

【正文内容】
${content.slice(0, 6000)}

${fusionCtx ? `【融合技法参考】\n${fusionCtx.slice(0, 1500)}\n` : ''}

【要求】
请严格按照用户的需求进行分析。输出要实用、具体、可操作。如果用户的问题不明确，请给出你最专业的解读。用 Markdown 格式输出。`;

        let result = '';
        try {
            await AI.generate(prompt, {}, c => { result += c; });
            if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none">${this._formatMarkdown(result)}</div>`;
            UI.toast('分析完成');
            if (input) input.value = '';
```

### assets/js/modules_split/writer/writer_panel.js:1012

```js
ult');
        if (resultEl) resultEl.innerHTML = '<div class="text-center text-dim py-4"><i class="fa-solid fa-spinner fa-spin text-xl mb-2"></i><div>正在执行...</div></div>';
        
        this.tab('diagnose');
        
        let result = '';
        await AI.generate(promptText, {}, c => { result += c; });
        
        if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none">${this._formatMarkdown(result)}</div>`;
        UI.toast('执行完成');
    },

    _formatMarkdown(text) {
```

### assets/js/modules_split/writer/writer_polish.js:598

```js
apiType: 'text',
                    module: 'writer_polish',
                    ...(options.aiOptions || {})
                };

                try {
                    if (typeof options.onChunk === 'function') {
                        await AI.generate(prompt, aiOptions, piece => {
                            rawResult += piece;
                            options.onChunk(piece, {
                                chunkIndex: chunk.index,
                                totalChunks: chunk.total,
```

### assets/js/modules_split/writer/writer_polish.js:608

```js
totalChunks: chunk.total,
                                prompt,
                                chunk
                            });
                        });
                    } else {
                        rawResult = await AI.generate(prompt, aiOptions);
                    }
                } catch (error) {
                    console.warn('[Writer polish] AI polish failed:', error);
                    if (typeof options.onError === 'function') {
                        try {
```

### assets/js/modules_split/writer/writer_review.js:122

```js
world_consistency":X,"commercial":X,"total":X,"summary":"总体评价100字内"}

然后输出详细审稿报告：
- 每个维度的具体问题和修改建议（至少2条 actionable 建议）
- 标出具体问题段落（引用原文+修改建议）
- 给出修改优先级排序（必须改/建议改/可不改）

【待审稿件】
${content.slice(0, 5000)}`;

        let result = '';
        try {
            await AI.generate(prompt, {}, chunk => {
                result += chunk;
            });

            // 解析JSON评分
            let scores = null;
            try {
                const jsonMatch = result.match(/\{[^{}]*"plot_logic":[\d.]+[^}]*\}/);
```

### assets/js/modules_split/writer/writer_rhythm.js:42

```js
"连续800字无冲突，建议插入转折"},
    ...
  ],
  "summary": "本章整体节奏评价"
}

评分标准（1-10分）：
- conflict: 冲突强度（1=平静，10=激烈对抗）
- emotion: 情感起伏（1=平淡，10=强烈情绪）
- info_density: 信息密度（1=水分大，10=信息饱和）
- dialogue_ratio: 对话占比（百分比）`;

        let result = '';
        try {
            await AI.generate(prompt, {}, chunk => { result += chunk; });

            // 解析JSON
            let data = null;
            try {
                const jsonMatch = result.match(/\{[\s\S]*\}/);
                if (jsonMatch) data = JSON.parse(jsonMatch[0]);
```

### js/core/AI.js:11

```js
ort const AI = {
    async getActiveConfig(type = 'text') {
        const configs = await DB.getAll(`${type}_api_pool`);
        // 假设数据结构中 is_active 是数字 1 或布尔值
        return configs.find(c => c.is_active == 1) || configs[0] || null;
    },

    async generate(prompt, config = {}, onChunk) {
        const apiConfig = config.useModel ? config.useModel : await AI.getActiveConfig('text');
        
        if (!apiConfig) {
            let mock = "【模拟输出】请先在设置中配置API流量池。\n" + prompt.slice(0, 50) + "...";
```

## AI ???/????

# ???assets/js/core/ai.js

## AIP001 ? url ? line 335 ? template ? 80 chars

```text
https://generativelanguage.googleapis.com/v1beta/models/${...}:${...}?key=${...}
```

# ???assets/js/modules/creative_original.js

## AIP002 ? prompt ? line 695 ? template ? 222 chars

```text
你是一个创意风暴引擎。请围绕主题【${...}】生成${...}个独特的小说创意脑洞。\n\n${...}\n\n要求：\n1. 每个创意都要新颖、有冲击力\n2. 涵盖不同的类型和角度\n3. 每个创意包含：标题(10字内)、一句话概念、核心冲突、独特卖点\n4. 越反直觉越好\n\n输出格式为JSON数组：[{"title":"标题","concept":"一句话概念","conflict":"核心冲突","hook":"独特卖点"}]
```

## AIP003 ? prompt ? line 746 ? template ? 225 chars

```text
你是一个创意碰撞引擎。请将以下三个随机元素进行创意碰撞，生成5个独特的小说创意：\n\n元素A：${...}\n元素B：${...}\n元素C：${...}\n\n要求：\n1. 每个创意都要有机融合这三个元素\n2. 产生意想不到的化学反应\n3. 每个创意包含：标题、一句话概念、核心冲突、独特卖点\n\n输出JSON数组格式：[{"title":"标题","concept":"概念","conflict":"冲突","hook":"卖点"}]
```

## AIP004 ? prompt ? line 776 ? template ? 303 chars

```text
你是一个创意进化引擎。请基于以下创意进行进化升级，生成5个更完善的版本：\n\n原创意：${...}\n概念：${...}\n冲突：${...}\n卖点：${...}\n\n进化方向：\n1. 强化冲突 - 让冲突更激烈、更不可调和\n2. 深化主题 - 增加哲学思考和社会隐喻\n3. 扩展世界观 - 让设定更宏大、更完整\n4. 优化人设 - 让角色更立体、更有魅力\n5. 创新结构 - 尝试非线性、多视角等叙事结构\n\n输出JSON数组格式：[{"title":"标题","concept":"概念","conflict":"冲突","hook":"卖点","evolution":"进化点"}]
```

# ???assets/js/modules/fusion_book_original.js

## AIP005 ? render() ? line 96 ? template ? 26514 chars

```text
<div class="flex flex-col h-full bg-[#0a0a0c] overflow-hidden relative">
            <!-- 顶部标题栏 -->
            <div class="h-10 flex items-center justify-between px-4 bg-[#0e0e10] border-b border-white/5 shrink-0">
                <div class="flex items-center gap-2">
                    <span class="text-sm font-bold text-green-400"><i class="fa-solid fa-book-open-reader mr-1.5"></i>融合拆书</span>
                    <span class="px-1.5 py-0.5 rounded text-[9px] bg-green-500/15 text-green-400 border border-green-500/20">双书对比模式</span>
                    <span class="hidden text-[10px] text-red-400 animate-pulse font-bold" id="fb-gen-indicator">● 生成中</span>
                    <span class="text-[8px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 ${...}" id="fb-primary-badge-top">主书:左</span>
                    <span class="text-[8px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 ${...}" id="fb-primary-badge-top-right">主书:右</span>
                </div>
                <div class="flex items-center gap-1.5">
                    <button class="btn btn-xs bg-white/5 text-dim hover:text-white" onclick="Modules.fusion_book._toggleAdvancedPanel()" title="高级设置"><i class="fa-solid fa-sliders"></i></button>
                    <label class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30 cursor-pointer"><i class="fa-solid fa-upload mr-1"></i>导入书籍<input type="file" accept=".txt,.epub" class="hidden" onchange="Modules.fusion_book._handleImportFile(this)"></label>
                </div>
            </div>

            <!-- 高级设置面板 -->
            <div id="fb-advanced-panel" class="hidden absolute top-10 left-0 right-0 z-40 bg-[#111113] border-b border-white/10 p-3 shadow-xl">
                <div class="flex flex-wrap gap-2 items-center">
                    <span class="text-[10px] text-dim mr-1">步骤提示词:</span>
                    <button class="btn btn-xs bg-amber-600/15 text-amber-400 border-amber-600/20 text-[10px]" onclick="Modules.short.openPromptModal('fusion_analyze')"><i class="fa-solid fa-gear mr-0.5"></i>拆解</button>
                    <button class="btn btn-xs bg-purple-600/15 text-purple-400 border-purple-600/20 text-[10px]" onclick="Modules.short.openPromptModal('fusion_compare_analysis')"><i class="fa-solid fa-gear mr-0.5"></i>对比</button>
                    <button class="btn btn-xs bg-green-600/15 text-green-400 border-green-600/20 text-[10px]" onclick="Modules.short.openPromptModal('fusion_merge')"><i class="fa-solid fa-gear mr-0.5"></i>融合</button>
                    <button class="btn btn-xs bg-blue-600/15 text-blue-400 border-blue-600/20 text-[10px]" onclick="Modules.short.openPromptModal('fusion_outline')"><i class="fa-solid fa-gear mr-0.5"></i>细纲</button>
                    <button class="btn btn-xs bg-pink-600/15 text-pink-400 border-pink-600/20 text-[10px]" onclick="Modules.short.openPromptModal('fusion_write')"><i class="fa-solid fa-gear mr-0.5"></i>正文</button>
                    <span class="w-px h-4 bg-white/10 mx-1"></span>
                    <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30" onclick="Modules.fusion_book.checkConsistency()"><i class="fa-solid fa-check-double mr-1"></i>一致性检查</button>
                    <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30" onclick="Modules.fusion_book.selectSaveFolder()"><i class="fa-solid fa-folder-open mr-1"></i>${...}</button>
                    ${...}
                </div>
            </div>

            <!-- 三栏主体 -->
            <div class="flex-1 flex min-h-0 overflow-hidden">
                <!-- 左书栏 -->
                <div class="w-[260px] shrink-0 flex flex-col bg-[#0e0e10] border-r border-white/5 overflow-hidden">
                    <div class="p-2.5 border-b border-white/5 bg-blue-500/5 shrink-0">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="text-xs font-bold text-blue-400">A 左书</span>
                            <select id="fb-left-book" class="flex-1 bg-black/30 border border-white/5 rounded text-[10px] text-white p-1 min-w-0" onchange="Modules.fusion_book.selectBook('left',this.value)"></select>
                            <button class="text-red-400/50 hover:text-red-400 text-[10px]" onclick="Modules.fusion_book.deleteSelectedBook('left')"><i class="fa-solid fa-trash"></i></button>
                        </div>
                        <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30 w-full text-[9px] ${...}" onclick="Modules.fusion_book.setPrimaryBook('left')"><i class="fa-solid fa-crown mr-0.5"></i>设为主书</button>
                    </div>
                    <div id="fb-left-chapters" class="flex-1 overflow-y-auto min-h-0"></div>
                    <div id="fb-left-preview" class="h-48 shrink-0 border-t border-white/5 bg-[#0a0a0c] p-2.5 overflow-y-auto text-[10px] text-gray-400 leading-relaxed">
                        <div class="text-dim text-center mt-8">点击章节查看正文</div>
                    </div>
                </div>

                <!-- 中间面板 -->
                <div class="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#0a0a0c]">
                    <div class="p-3 border-b border-white/5 bg-[#0e0e10]">
                        <div class="flex items-center justify-center mb-2">
                            <button class="btn btn-md bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold shadow-lg hover:scale-105 transition-transform px-6" onclick="Modules.fusion_book.showPipelineConfig()"><i class="fa-solid fa-rocket mr-2"></i>一键智能拆书链</button>
                        </div>
                        <div class="flex items-center justify-center gap-2 mb-2">
                            <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30" onclick="Modules.fusion_book.sendToPhoenix()"><i class="fa-solid fa-feather mr-1"></i>→凤凰流</button>
                            <button class="btn btn-xs bg-indigo-600/20 text-indigo-400 border-indigo-600/30" onclick="Modules.fusion_book.sendToWriter()"><i class="fa-solid fa-pen-nib mr-1"></i>→执笔台</button>
                        </div>
                        <div class="flex items-center justify-center gap-6 text-center">
                            <div><div class="text-lg font-bold text-blue-400">${...}</div><div class="text-[9px] text-dim">左书字数</div></div>
                            <div class="text-dim text-xs">⚡</div>
                            <div><div class="text-lg font-bold text-pink-400">${...}</div><div class="text-[9px] text-dim">右书字数</div></div>
                        </div>
                    </div>
                    <div class="flex-1 relative min-h-0">
                        <div id="fb-output" class="absolute inset-0 overflow-y-auto p-5 text-gray-200 text-sm leading-loose markdown-body"></div>
                    </div>
                </div>

                <!-- 右书栏 -->
                <div class="w-[260px] shrink-0 flex flex-col bg-[#0e0e10] border-l border-white/5 overflow-hidden">
                    <div class="p-2.5 border-b border-white/5 bg-pink-500/5 shrink-0">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="text-xs font-bold text-pink-400">B 右书</span>
                            <select id="fb-right-book" class="flex-1 bg-black/30 border border-white/5 rounded text-[10px] text-white p-1 min-w-0" onchange="Modules.fusion_book.selectBook('right',this.value)"></select>
                            <button class="text-red-400/50 hover:text-red-400 text-[10px]" onclick="Modules.fusion_book.deleteSelectedBook('right')"><i class="fa-solid fa-trash"></i></button>
                        </div>
                        <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30 w-full text-[9px] ${...}" onclick="Modules.fusion_book.setPrimaryBook('right')"><i class="fa-solid fa-crown mr-0.5"></i>设为主书</button>
                    </div>
                    <div id="fb-right-chapters" class="flex-1 overflow-y-auto min-h-0"></div>
                    <div id="fb-right-preview" class="h-48 shrink-0 border-t border-white/5 bg-[#0a0a0c] p-2.5 overflow-y-auto text-[10px] text-gray-400 leading-relaxed">
                        <div class="text-dim text-center mt-8">点击章节查看正文</div>
                    </div>
                </div>
            </div>

            <!-- 底部状态栏 -->
            <div class="h-8 flex items-center gap-2 px-3 bg-[#0e0e10] border-t border-white/5 shrink-0">
                <span class="text-[9px] text-dim" id="fb-status">就绪</span>
                <span class="flex-1"></span>
                <button class="btn btn-xs bg-white/5 text-dim text-[9px]" onclick="Utils.copy(document.getElementById('fb-output')?.innerText)"><i class="fa-solid fa-copy mr-1"></i>复制</button>
                <button class="btn btn-xs bg-white/5 text-dim text-[9px]" onclick="Modules.fusion_book.clearAll()"><i class="fa-solid fa-rotate-right mr-1"></i>清空</button>
            </div>

            <!-- ===== 自动化流水线浮层 ===== -->
            <div id="fb-pipeline-overlay" class="absolute inset-0 z-50 flex flex-col bg-[#0a0a0c] border border-white/5" style="display:none;">
                <div class="h-11 flex items-center justify-between px-4 bg-[#0e0e10] border-b border-white/5 shrink-0">
                    <div class="flex items-center gap-3">
                        <span class="text-base font-bold text-green-400"><i class="fa-solid fa-link mr-2"></i>自动化流水线 · 实时监控</span>
                        <span class="px-2 py-0.5 rounded text-[10px] bg-blue-500/15 text-blue-400 border border-blue-500/20 font-bold" id="pl-step-label"></span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <button class="btn btn-xs bg-blue-600/20 text-blue-400 border-blue-600/30" onclick="Modules.fusion_book.plMinimize()"><i class="fa-solid fa-compress mr-1"></i>最小化</button>
                        <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30" id="pl-pause-btn" style="display:none;" onclick="Modules.fusion_book.plPause()"><i class="fa-solid fa-pause mr-1"></i>暂停</button>
                        <button class="btn btn-xs bg-red-600/20 text-red-400 border-red-600/30" id="pl-stop-btn" style="display:none;" onclick="Modules.fusion_book.plStop()"><i class="fa-solid fa-stop mr-1"></i>停止</button>
                        <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.fusion_book.plClose()"><i class="fa-solid fa-xmark mr-1"></i>关闭</button>
                    </div>
                </div>
                <!-- Agent 并发统计条 -->
                <div class="px-4 py-1.5 bg-[#0e0e10] border-b border-white/5 shrink-0 flex items-center gap-3">
                    <div class="flex items-center gap-1.5 text-[10px]">
                        <span class="text-dim">Agent:</span>
                        <span class="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20" id="pl-agent-pending">0</span>
                        <span class="text-dim">排队</span>
                        <span class="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20" id="pl-agent-running">0</span>
                        <span class="text-dim">运行</span>
                        <span class="px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20" id="pl-agent-done">0</span>
                        <span class="text-dim">完成</span>
                    </div>
                    <div class="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div id="pl-progress-bar" class="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-300" style="width:0%"></div>
                    </div>
                    <span class="text-[10px] text-dim font-mono" id="pl-agent-stats">0运行/0排队/0完成 | 0章/分</span>
                </div>
                <!-- 阶段指示器 -->
                <div class="px-4 py-1 bg-[#0e0e10] border-b border-white/5 shrink-0 flex items-center gap-2 text-[10px]">
                    <span class="text-dim">阶段:</span>
                    <span class="px-1.5 py-0.5 rounded bg-white/5 text-dim" id="pl-phase-1">①分析</span>
                    <span class="text-dim">→</span>
                    <span class="px-1.5 py-0.5 rounded bg-white/5 text-dim" id="pl-phase-2">②融合</span>
                    <span class="text-dim">→</span>
                    <span class="px-1.5 py-0.5 rounded bg-white/5 text-dim" id="pl-phase-3">③循环</span>
                    <span class="text-dim">→</span>
                    <span class="px-1.5 py-0.5 rounded bg-white/5 text-dim" id="pl-phase-4">④写作</span>
                </div>
                <div class="flex-1 flex min-h-0 overflow-hidden">
                    <!-- 左侧：实时输出 -->
                    <div class="flex-1 flex flex-col min-w-0 border-r border-white/5">
                        <div class="flex items-center justify-between px-4 py-2 bg-[#0e0e10] border-b border-white/5 shrink-0">
                            <span class="text-xs font-bold text-white" id="pl-current-title"><i class="fa-solid fa-file-lines mr-1 text-green-400"></i>等待启动</span>
                            <span class="text-[10px] text-dim font-mono" id="pl-current-chars"></span>
                        </div>
                        <div class="flex-1 overflow-y-auto p-5 text-sm text-gray-200 leading-loose whitespace-pre-wrap" id="pl-output">等待流水线启动...</div>
                    </div>
                    <!-- 右侧：状态面板 -->
                    <div class="w-[340px] shrink-0 flex flex-col overflow-y-auto bg-[#0e0e10]">
                        <!-- 实时写入状态 - 2列网格卡片 -->
                        <div class="p-3 border-b border-white/5">
                            <div class="text-[10px] text-dim font-bold uppercase tracking-wider mb-2">实时写入状态</div>
                            <div class="grid grid-cols-2 gap-1.5" id="pl-status-grid">
                                <div class="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-white/5 bg-white/[0.02] cursor-pointer hover:bg-white/5 transition-all" id="pl-s-left" onclick="Modules.fusion_book.plPreview('left')"><span class="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" id="pl-d-left"></span><span class="text-[11px] text-blue-400 font-bold truncate">左书分析</span><span class="ml-auto text-[9px] text-dim" id="pl-i-left"></span></div>
                                <div class="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-white/5 bg-white/[0.02] cursor-pointer hover:bg-white/5 transition-all" id="pl-s-right" onclick="Modules.fusion_book.plPreview('right')"><span class="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" id="pl-d-right"></span><span class="text-[11px] text-pink-400 font-bold truncate">右书分析</span><span class="ml-auto text-[9px] text-dim" id="pl-i-right"></span></div>
                                <div class="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-white/5 bg-white/[0.02] cursor-pointer hover:bg-white/5 transition-all" id="pl-s-compare" onclick="Modules.fusion_book.plPreview('compare')"><span class="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" id="pl-d-compare"></span><span class="text-[11px] text-amber-400 font-bold truncate">对比</span><span class="ml-auto text-[9px] text-dim" id="pl-i-compare"></span></div>
                                <div class="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-white/5 bg-white/[0.02] cursor-pointer hover:bg-white/5 transition-all" id="pl-s-fusion" onclick="Modules.fusion_book.plPreview('fusion')"><span class="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" id="pl-d-fusion"></span><span class="text-[11px] text-green-400 font-bold truncate">融合</span><span class="ml-auto text-[9px] text-dim" id="pl-i-fusion"></span></div>
                                <div class="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-white/5 bg-white/[0.02] cursor-pointer hover:bg-white/5 transition-all col-span-2" id="pl-s-outline" onclick="Modules.fusion_book.plPreview('outline')"><span class="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" id="pl-d-outline"></span><span class="text-[11px] text-orange-400 font-bold">📋 细纲</span><span class="ml-auto text-[9px] text-dim" id="pl-i-outline"></span></div>
                                <div class="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-white/5 bg-white/[0.02] cursor-pointer hover:bg-white/5 transition-all" id="pl-s-world" onclick="Modules.fusion_book.plPreview('world')"><span class="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" id="pl-d-world"></span><span class="text-[11px] text-cyan-400 font-bold truncate">实体提取</span><span class="ml-auto text-[9px] text-dim" id="pl-i-world"></span></div>
                                <div class="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-white/5 bg-white/[0.02] cursor-pointer hover:bg-white/5 transition-all" id="pl-s-write" onclick="Modules.fusion_book.plPreview('write')"><span class="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" id="pl-d-write"></span><span class="text-[11px] text-purple-400 font-bold truncate">正文</span><span class="ml-auto text-[9px] text-dim" id="pl-i-write"></span></div>
                            </div>
                        </div>
                        <!-- 流水线信息 -->
                        <div class="p-3 border-b border-white/5">
                            <div class="text-[10px] text-dim font-bold uppercase tracking-wider mb-2">流水线信息</div>
                            <div class="text-[11px] text-dim leading-relaxed" id="pl-pipeline-info">等待配置...</div>
                        </div>
                        <!-- 操作日志 -->
                        <div class="flex-1 p-3 min-h-0">
                            <div class="text-[10px] text-dim font-bold uppercase tracking-wider mb-2">操作日志</div>
                            <div class="overflow-y-auto text-[10px] font-mono leading-relaxed space-y-0.5" id="pl-log" style="max-height:calc(100vh - 380px);"></div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- 右下角全局悬浮胶囊 -->
            <div id="fb-pipeline-mini" class="absolute bottom-12 right-4 z-50 bg-gradient-to-r from-red-600 to-orange-500 rounded-full shadow-lg shadow-red-500/30 px-5 py-2.5 flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform" onclick="Modules.fusion_book._pipelineRunning ? Modules.fusion_book.plRestore() : (Modules.fusion_book._savedPipelineState ? Modules.fusion_book._resumeFromSaved() : Modules.fusion_book.showPipelineConfig())">
                <span class="text-white text-sm font-bold"><i class="fa-solid fa-rocket mr-1.5"></i><span id="pl-mini-status">${...}</span></span>
                ${...}
            </div>

            <!-- ===== 流水线配置弹窗 ===== -->
            <div id="fb-pipeline-config" class="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" style="display:none;" onclick="if(event.target===this)this.style.display='none'">
                <div class="w-[720px] max-h-[85vh] bg-[#111113] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col" onclick="event.stopPropagation()">
                    <div class="px-5 py-3 bg-[#0e0e10] border-b border-white/5 flex items-center justify-between">
                        <span class="text-base font-bold text-green-400"><i class="fa-solid fa-rocket mr-2"></i>一键自动拆书链 · 配置</span>
                        <button class="text-dim hover:text-white" onclick="document.getElementById('fb-pipeline-config').style.display='none'"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="flex-1 overflow-y-auto p-5 space-y-4">
                        <!-- 章节选择 -->
                        <div class="flex gap-4">
                            <div class="flex-1">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-xs font-bold text-blue-400">A 左书章节</span>
                                    <div class="flex gap-1">
                                        <button class="text-[10px] text-blue-400 hover:underline" onclick="Modules.fusion_book._plConfigSelectAll('left',true)">全选</button>
                                        <button class="text-[10px] text-dim hover:underline" onclick="Modules.fusion_book._plConfigSelectAll('left',false)">全不选</button>
                                    </div>
                                </div>
                                <div id="plc-left-chapters" class="max-h-[180px] overflow-y-auto space-y-0.5 bg-black/20 rounded-lg p-2 border border-white/5"></div>
                            </div>
                            <div class="flex-1">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-xs font-bold text-pink-400">B 右书章节</span>
                                    <div class="flex gap-1">
                                        <button class="text-[10px] text-pink-400 hover:underline" onclick="Modules.fusion_book._plConfigSelectAll('right',true)">全选</button>
                                        <button class="text-[10px] text-dim hover:underline" onclick="Modules.fusion_book._plConfigSelectAll('right',false)">全不选</button>
                                    </div>
                                </div>
                                <div id="plc-right-chapters" class="max-h-[180px] overflow-y-auto space-y-0.5 bg-black/20 rounded-lg p-2 border border-white/5"></div>
                            </div>
                        </div>
                        <!-- 流水线选项 -->
                        <div class="bg-black/20 rounded-lg p-4 border border-white/5 space-y-3">
                            <div class="text-xs font-bold text-white mb-2">流水线选项</div>
                            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="plc-do-extract" checked class="accent-green-500"><span class="text-xs text-gray-300">🌍 提取知识图谱 → 世界引擎 + 向量数据库(RAG)</span></label>
                            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="plc-do-outline" checked class="accent-green-500"><span class="text-xs text-gray-300">📋 生成细纲 → 凤凰创作流 + 长篇执笔(旗舰)大纲</span></label>
                            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="plc-do-write" checked class="accent-green-500"><span class="text-xs text-gray-300">✍️ 写正文 → 长篇执笔(旗舰)正文 + RAG存储</span></label>
                            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="plc-do-rag" checked class="accent-green-500"><span class="text-xs text-gray-300">🔍 拆解结果存入RAG向量数据库</span></label>
                            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="plc-do-local" ${...} class="accent-green-500"><span class="text-xs text-gray-300">💾 保存到本地文件夹</span>
                                ${...}
                            </label>
                        </div>
                        <!-- 循环拆解模式 -->
                        <div class="bg-cyan-900/10 rounded-lg p-4 border border-cyan-500/20 space-y-3">
                            <div class="text-xs font-bold text-cyan-400 mb-2"><i class="fa-solid fa-sync mr-1"></i>循环拆解模式</div>
                            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="plc-cycle-mode" ${...} class="accent-cyan-500"><span class="text-xs text-gray-300">启用循环拆解 (以N章为一个小循环进行融合)</span></label>
                            <div class="flex items-center gap-3">
                                <div class="flex items-center gap-2">
                                    <span class="text-[10px] text-dim">每</span>
                                    <select id="plc-cycle-size" class="bg-black/30 border border-white/10 rounded px-2 py-1 text-[10px] text-white">
                                        <option value="3" ${...}>3</option>
                                        <option value="5" ${...}>5</option>
                                        <option value="10" ${...}>10</option>
                                        <option value="20" ${...}>20</option>
                                    </select>
                                    <span class="text-[10px] text-dim">章为一个循环</span>
                                </div>
                            </div>
                        </div>
                        <!-- 并发设置 -->
                        <div class="bg-purple-900/10 rounded-lg p-4 border border-purple-500/20 space-y-3">
                            <div class="text-xs font-bold text-purple-400 mb-2"><i class="fa-solid fa-bolt mr-1"></i>Agent 并发设置</div>
                            <div class="flex items-center gap-3">
                                <span class="text-[10px] text-dim">最大并发数:</span>
                                <input type="range" id="plc-concurrency" min="1" max="10" value="${...}" class="accent-purple-500 w-32" oninput="document.getElementById('plc-concurrency-val').textContent=this.value">
                                <span class="text-xs text-purple-400 font-bold font-mono" id="plc-concurrency-val">${...}</span>
                                <span class="text-[10px] text-dim">个Agent同时运行</span>
                            </div>
                        </div>
                    </div>
                    <div class="px-5 py-3 bg-[#0e0e10] border-t border-white/5 flex items-center justify-between">
                        <span class="text-[10px] text-dim" id="plc-summary">选择章节后开始</span>
                        <div class="flex gap-2">
                            <button class="btn btn-sm bg-white/5 text-dim" onclick="document.getElementById('fb-pipeline-config').style.display='none'">取消</button>
                            <button class="btn btn-sm bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold shadow-lg" onclick="Modules.fusion_book.startConfiguredPipeline()"><i class="fa-solid fa-rocket mr-1"></i>开始执行</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
```

## AIP006 ? (???) ? line 1981 ? template ? 977 chars

```text
你是深度实体提取引擎。\n【核心任务】从以下融合细纲中提取所有原创实体和世界观元素。\n\n【数据来源说明】\n以下内容是一份基于两书技法融合而成的全新网文细纲。\n细纲中的角色、物品、地点、势力等全部是原创的，不是原书中的任何内容。\n你的任务是从这份原创细纲中提取构建世界引擎所需的实体。\n\n${...}\n${...}

【提取铁律】\n1. 提取的是融合细纲中的原创实体，不是原书内容\n2. 尽可能完整地提取角色关系、势力结构、魔法体系等\n3. 如果某个实体在细纲中只是提及但无详细描述，根据上下文合理补全\n4. 不要遗漏任何实体，关系网络要尽可能完整\n\n【提取类型】\n- 人物：所有角色（主角、配角、反派），含性格、身份\n- 物品：道具、武器、法宝、关键物件\n- 地点：地名、场景、建筑、地标\n- 情节：关键事件、转折点、冲突\n- 伏笔：暗示、线索、未解之谜\n- 势力：门派、组织、国家、阵营、家族\n- 种族：种族设定、族群特征\n- 魔法：功法、技能、法术、科技体系、修炼等级\n- 规则：世界法则、力量体系、禁忌\n- 文化：风俗、社会制度、信仰\n- 历史：历史事件、传说、纪元\n- 技法：可复用的写作套路、节奏模型、爽点公式\n\n【输出格式】JSON数组：\n[{"name":"名称","type":"人物/物品/地点/情节/伏笔/势力/种族/魔法/规则/文化/历史/技法","description":"详细描述50-200字","relations":["关系类型:关联实体名"]}]\n\n【关键要求 - 关系网络】\n- 每个实体的relations必须尽可能多地引用其他实体名称\n- 关系格式："关系类型:实体名"，例如 "师父:张三","敌对:魔教","位于:青云山","拥有:轩辕剑"\n- 人物之间要有师徒/敌友/从属关系\n- 人物与地点要有"位于"/"出没"关系\n- 人物与物品要有"拥有"/"使用"关系\n- 人物与势力要有"所属"/"统治"关系\n- 情节与人物要有"参与"关系\n- 这些关系是构建知识网络图的关键，不要遗漏！\n- 尽可能多提取，不要遗漏。\n- 直接输出纯JSON数组，禁止使用markdown代码块(???json)包裹，禁止输出任何非JSON文本。
```

## AIP007 ? (???) ? line 2023 ? string ? 149 chars

```text
); // 零宽字符
                    // 安全处理换行: 只替换JSON字符串值内部的裸换行
                    fixed = fixed.replace(/"([^"]*)\n([^"]*)"/g, (m) => m.replace(/\n/g,
```

## AIP008 ? (???) ? line 2025 ? string ? 690 chars

```text
));
                    entities = JSON.parse(fixed);
                } catch(e3) {
                    // 尝试4: 逐行拼接修复 — 逐个JSON对象提取（支持含数组的对象）
                    try {
                        // 匹配 { ... } 对象，允许内部有 [...] 数组
                        const objMatches = cleanRaw.match(/\{(?:[^{}]|\{[^{}]*\})*"name"\s*:\s*"[^"]+?"(?:[^{}]|\[[^\]]*\]|\{[^{}]*\})*\}/g);
                        if (objMatches && objMatches.length) {
                            entities = [];
                            for (const objStr of objMatches) {
                                try {
                                    let fixedObj = objStr
                                        .replace(/,\s*}/g,
```

## AIP009 ? (???) ? line 2083 ? string ? 14304 chars

```text
/);
                                    if (dm) current.description = dm[1];
                                }
                            }
                            if (current && current.name) entities.push(current);
                            if (entities.length) this._plLog(`JSON修复: 逐行扫描提取到 ${entities.length} 个实体`, 'info');
                        } catch(e5) {}
                    }

                    if (!entities.length) {
                        this._plLog('实体JSON解析失败，原始文本已保存', 'err');
                    }
                }
            }
        }

        if (!Array.isArray(entities)) entities = [entities];

        const now = Date.now();

        // ★ 实体去重合并：与已有实体对比，避免重复创建
        const allExisting = await DB.getAll('entities') || [];
        const mergedEntities = [];
        let mergeCount = 0;
        for (const ent of entities) {
            if (!ent || !ent.name) continue;
            const entType = ent.type || '其他';
            // 查找同名同类型的已有实体（排除世界观维度实体）
            const existing = allExisting.find(e =>
                e.name === ent.name && e.type === entType && !e.id.startsWith('world_')
            );
            if (existing) {
                // 合并描述：取更详细的一个，或拼接
                const newDesc = ent.description || ent.desc || '';
                const oldDesc = existing.desc || '';
                if (newDesc && newDesc.length > oldDesc.length * 0.3) {
                    existing.desc = newDesc.length > oldDesc.length ? newDesc : (oldDesc + '
【补充】' + newDesc);
                    // 合并关系
                    const newRels = (ent.relations || []).filter(r => typeof r === 'string' && !existing.relations.includes(r));
                    if (newRels.length) {
                        existing.relations = [...existing.relations, ...newRels];
                    }
                    existing.updatedAt = now;
                    await DB.put('entities', existing);
                    // 同步更新向量
                    const vectorContent = `[${existing.type}] ${existing.name}: ${existing.desc}`;
                    await DB.put('vectors', { id: existing.id, content: vectorContent, vector: Array.from({length:1536}, ()=>Math.random()), timestamp: now });
                    mergeCount++;
                    this._plLog(`  🔄 实体合并更新: ${ent.name} (${newRels.length ? '+' + newRels.length + '关系' : '描述更新'})`, 'entity');
                }
            } else {
                mergedEntities.push(ent);
            }
        }
        entities = mergedEntities;
        if (mergeCount > 0) {
            this._plLog(`实体去重: ${mergeCount} 个已有实体已合并更新`, 'info');
        }

        // 存入世界引擎 + 向量库
        let count = 0;
        // ★ 计算当前循环ID（如果启用循环模式）
        let currentCycleId = null;
        const chNum = (this._accContext || {}).chapterNum;
        if(this._plConfig.cycleMode && chNum && typeof Modules !== 'undefined' && Modules.world_engine) {
            const cycleInfo = Modules.world_engine.getCycleIdForChapter(chNum, this._plConfig.cycleSize);
            if(cycleInfo) currentCycleId = cycleInfo.cycleId;
        }
        for (const ent of entities) {
            if (!ent || !ent.name) continue;
            const typeMap = { technique:'技法', character_template:'人物', conflict_model:'情节', rhythm:'技法', hook:'技法' };
            const type = typeMap[ent.type] || ent.type || '技法';
            // ★ 确保relations是字符串数组
            let relations = ent.relations || [];
            if(!Array.isArray(relations)) relations = [];
            relations = relations.map(r => typeof r === 'string' ? r : String(r)).filter(Boolean);

            const id = Utils.uuid();
            const entityPayload = {
                id, name: ent.name, type: type,
                desc: ent.description || ent.desc || '',
                relations: relations,
                tags: ent.tags || ['融合', '流水线', '原创实体'],
                source: 'pipeline',
                sourceBook: '融合细纲原创',
                updatedAt: now
            };
            if(currentCycleId) entityPayload.cycles = [currentCycleId];
            await DB.put('entities', entityPayload);
            const vectorContent = `[${type}] ${ent.name}: ${ent.description || ent.desc || ''}`;
            await DB.put('vectors', { id, content: vectorContent, vector: Array.from({length:1536}, ()=>Math.random()), timestamp: now });
            count++;
            this._plLog(`  → ${type}: ${ent.name}${relations.length ? ' (关联'+relations.length+'个)' : ''}${currentCycleId ? ' [循环]' : ''}`, 'entity');
        }

        this._pipelineResults.world = raw.slice(0, 4000);
        this._allPipelineResults.world = (this._allPipelineResults.world || '') + `
[第${(this._accContext||{}).chapterNum||'?'}章] ${count}个实体已提取
`;
        this._plLog(`世界引擎: 共提取 ${count} 个实体`, 'ok');

        // ★ 刷新世界引擎缓存，确保图谱能看到新数据
        if(Modules.world_engine) Modules.world_engine._cachedEntities = null;

        // ★ 自动提取世界观维度 (从实体中归纳到世界观构建的各个维度)
        if (count > 0) {
            try {
                await this._pipelineExtractWorldView(entities, sourceText);
            } catch(e) { this._plLog('世界观自动提取失败: ' + e.message, 'err'); }
        }

        if (fusion) {
            await DB.put('assets', {
                id: 'fusion_tech_' + Date.now(),
                name: '融合写作技法', type: 'technique',
                content: fusion, tags: ['融合', '技法', '自动生成'], createdAt: now
            });
        }
    },

    // ★ 自动从提取的实体中归纳世界观维度
    async _pipelineExtractWorldView(entities, sourceText) {
        const catMap = {
            history: '历史与传说', geography: '地理与地貌', magic: '魔法/科技体系',
            factions: '势力与组织', species: '种族与生物', rules: '世界规则', culture: '文化与习俗'
        };

        // 从已提取的实体中按类型归纳世界观
        const worldData = {};
        for (const ent of entities) {
            if (!ent || !ent.name) continue;
            const type = (ent.type || '').toLowerCase();
            const desc = ent.description || ent.desc || '';
            if (!desc) continue;

            // 映射实体类型到世界观维度
            if (type === '历史' || type === 'history') {
                worldData.history = (worldData.history || '') + `
- ${ent.name}: ${desc}`;
            } else if (type === '地点' || type === 'geography' || type === 'location') {
                worldData.geography = (worldData.geography || '') + `
- ${ent.name}: ${desc}`;
            } else if (type === '魔法' || type === 'magic' || type === '功法') {
                worldData.magic = (worldData.magic || '') + `
- ${ent.name}: ${desc}`;
            } else if (type === '势力' || type === 'factions' || type === '组织') {
                worldData.factions = (worldData.factions || '') + `
- ${ent.name}: ${desc}`;
            } else if (type === '种族' || type === 'species') {
                worldData.species = (worldData.species || '') + `
- ${ent.name}: ${desc}`;
            } else if (type === '规则' || type === 'rules') {
                worldData.rules = (worldData.rules || '') + `
- ${ent.name}: ${desc}`;
            } else if (type === '文化' || type === 'culture') {
                worldData.culture = (worldData.culture || '') + `
- ${ent.name}: ${desc}`;
            }
        }

        // 写入世界观维度 (追加模式，不覆盖已有内容)
        let worldCount = 0;
        for (const [cat, label] of Object.entries(catMap)) {
            if (!worldData[cat]) continue;
            const id = 'world_' + cat;
            const existing = await DB.get('entities', id);
            const oldDesc = (existing && existing.desc) ? existing.desc : '';
            const newContent = worldData[cat].trim();
            // 追加新内容（去重）
            const merged = oldDesc ? oldDesc + '
' + newContent : newContent;
            await DB.put('entities', {
                id, name: label, type: 'world',
                desc: merged.slice(0, 5000),
                source: 'pipeline', updatedAt: Date.now()
            });
            worldCount++;
            this._plLog(`  🌍 世界观: ${label} 已更新`, 'entity');
        }

        if (worldCount > 0) {
            if (Modules.world_engine) Modules.world_engine._cachedEntities = null;
            this._plLog(`世界观: ${worldCount} 个维度已自动更新`, 'ok');
        }
    },

    async _pipelineSaveOutline() {
        const fusion = this._pipelineResults.fusion;
        if (!fusion) return;

        // 获取书名（用于日志和自定义prompt变量替换）
        const leftBook = (this._books || []).find(b => b.id === this.left.bookId);
        const rightBook = (this._books || []).find(b => b.id === this.right.bookId);
        const lName = leftBook ? leftBook.name : '左书';
        const rName = rightBook ? rightBook.name : '右书';

        // 获取累积上下文（前章细纲+实体+知识图谱）
        const acc = this._accContext || {};
        const prevOutlines = acc.outlines ? acc.outlines.slice(-3000) : '';
        const prevEntities = acc.entities ? acc.entities.slice(-2000) : '';
        const knowledgeGraph = acc.knowledgeGraph || '';
        const chNum = acc.chapterNum || 1;

        let prompt = await Modules.short.getPrompt('fusion_outline');
        if (!prompt) {
            prompt = `你是一位资深网文编辑。基于以下融合细纲，生成第${chNum}章的详细展开细纲。
【核心原则】融合细纲中的角色/世界观/情节全部是原创的，不是原书内容。你要做的是把融合细纲中的本章内容展开为更详细的写作指导。

【融合细纲】
${fusion.slice(0, 4000)}

【对比分析】
${(this._pipelineResults.compare || '').slice(0, 2000)}
${knowledgeGraph ? `
${knowledgeGraph.slice(0, 3000)}` : ''}
${prevOutlines ? `
【前章细纲参考（保持连贯性）】
${prevOutlines}` : ''}

【核心要求】
- 所有人物性格、身份、关系必须与融合细纲中的设定保持一致
- 伏笔和线索要与前章呼应，新伏笔要标注回收计划
- 世界观设定（魔法体系、势力关系、地理等）遵循融合细纲的原创设定
- 新出现的人物/物品/地点要标注，方便后续提取到知识图谱
- 技法运用标注来源（主书骨架/辅书血肉/融合创新）

请生成本章详细细纲，包含：
1. 章节标题
2. 核心事件（100字内）
3. 场景分段（每段场景的目的和情绪）
4. 运用的融合技法（标注来源）
5. 情绪节奏（起/承/转/合，标注分值）
6. 爽点/钩子设计
7. 对话要点（潜台词、信息差）
8. 一致性校验：是否与融合细纲矛盾？
${prevOutlines ? '9. 与前章的衔接和递进关系' : ''}

格式清晰，可直接用于写作。`;
        } else {
            prompt = prompt
                .replace(/{{primaryBook}}/g, primaryName).replace(/{{secondaryBook}}/g, secondaryName)
                .replace('{{fusion}}', fusion.slice(0, 4000))
                .replace('{{compare}}', (this._pipelineResults.compare || '').slice(0, 2000))
                .replace('{{left_name}}', lName).replace('{{right_name}}', rName);
            if (knowledgeGraph) prompt += `

${knowledgeGraph.slice(0, 3000)}`;
            if (prevOutlines) prompt += `

【前章细纲参考】
${prevOutlines}`;
        }

        // ★ 注入世界引擎全局一致性上下文
        try {
            const consistencyCtx = await this._buildConsistencyContext();
            if (consistencyCtx) prompt += `

${consistencyCtx}`;
        } catch(e) { console.warn('一致性上下文构建失败:', e); }

        const outEl = document.getElementById('pl-output');
        if (outEl) outEl.textContent = '正在生成细纲...
';
        this._setGenerating(true);

        let result = '';
        try {
            await AI.generate(prompt, {}, c => {
                result += c;
                if (outEl) outEl.textContent = result;
                const fbOut = document.getElementById('fb-output');
                if (fbOut) fbOut.innerHTML = typeof marked !== 'undefined' ? marked.parse(result) : result;
            });
        } catch(e) {
            if (e.message === '已中止') { this._setGenerating(false); throw e; }
            this._plLog('细纲生成失败: ' + e.message, 'err');
            this._setGenerating(false);
            return;
        }

        this._setGenerating(false);
        this._pipelineResults.outline = result;
        this._allPipelineResults.outline = (this._allPipelineResults.outline || '') + '

---

' + result;

        // 存入DB
        await DB.put('outlines', {
            id: 'fusion_outline_' + Date.now(),
            title: `融合细纲 (${lName} × ${rName})`,
            content: result,
            source: 'pipeline',
            createdAt: Date.now()
        });

        // 同步到凤凰创作流
        if (typeof Modules.phoenix !== 'undefined') {
            Modules.phoenix.data = Modules.phoenix.data || {};
            const chIdx = this.left.chapterIdx;
            Modules.phoenix.data.outlineRaw = (Modules.phoenix.data.outlineRaw || '') + '

---

## 第' + (chIdx + 1) + '章细纲

' + result;
            this._plLog('📋 细纲→凤凰创作流', 'entity');
        }

        // 同步到长篇执笔大纲
        const chIdx = this.left.chapterIdx;
        const leftBook2 = (this._books || []).find(b => b.id === this.left.bookId);
        const lCh = leftBook2 && leftBook2.chapters[chIdx] ? leftBook2.chapters[chIdx] : null;
        const chapTitle = lCh ? lCh.title : '第' + (chIdx + 1) + '章';
        const chapId = Utils.uuid();
        await DB.put('chapters', { id: chapId, title: `第${chIdx + 1}章 ${chapTitle}(融合)`, content: '', outline: result, order: chIdx + 1, volumeId: null, source: 'pipeline' });
        this._plLog('📋 细纲→长篇执笔大纲', 'entity');

        this._plLog(`细纲生成完成 (${result.length}字)`, 'ok');
    },

    async _pipelineWrite() {
        const fusion = this._pipelineResults.fusion || '';
        const outline = this._pipelineResults.outline || '';
        if (!fusion && !outline) return;

        // ★ 获取累积上下文 + 知识图谱
        const acc = this._accContext || {};
        const prevOutlines = acc.outlines ? acc.outlines.slice(-2000) : '';
        const knowledgeGraph = acc.knowledgeGraph || '';

        let prompt = await Modules.short.getPrompt('fusion_write');
        if (!prompt) prompt = this._PROMPTS.write;
        prompt = prompt
            .replace('{{fusion}}', fusion.slice(0, 4000))
            .replace('{{outline}}', outline.slice(0, 3000))
            .replace('{{world}}', (this._pipelineResults.world || '').slice(0, 2000));

        // ★ 注入知识图谱上下文（实体+世界观+关系网络）
        if (knowledgeGraph) prompt += `

${knowledgeGraph.slice(0, 3000)}`;
        if (prevOutlines) prompt += `

【前章细纲（保持情节连贯）】
${prevOutlines}`;
        prompt += `

【一致性与排版要求】
- 人物性格、世界观设定、伏笔线索必须与知识图谱保持一致，不得矛盾
- 语言风格：大白话、简洁有力、一句一个信息点，拒绝文绉绉和水字数
- 排版：每段不超过3-4行（手机屏幕友好），多用短句，对话单独成段
- 前后章节的人物称呼、能力设定、地名必须完全一致
- 新出现的伏笔要自然埋入，已有伏笔要适时呼应`;

        // ★ 注入世界引擎全局一致性上下文
        try {
            const consistencyCtx = await this._buildConsistencyContext();
            if (consistencyCtx) prompt += `

${consistencyCtx}`;
        } catch(e) { console.warn('一致性上下文构建失败:', e); }

        const status = document.getElementById('fb-status');
        if (status) status.textContent = '正在写正文...';
        this._setGenerating(true);

        const outEl = document.getElementById('fb-output');
        if (outEl) outEl.innerHTML = '<div class=
```

## AIP010 ? (???) ? line 2407 ? string ? 5631 chars

```text
></i>正在创作正文...</div>';

        const plOut = document.getElementById('pl-output');
        if (plOut) plOut.textContent = '正文创作中...
';

        let result = '';
        try {
            await AI.generate(prompt, {}, c => {
                result += c;
                if (outEl) outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(result) : result;
                if (plOut) plOut.textContent = result;
            });
        } catch(e) {
            if (e.message === '已中止') { throw e; }
            UI.toast('写正文出错: ' + e.message);
        }
        if (!this._pipelineRunning) { this._setGenerating(false); throw new Error('已中止'); }

        this._pipelineResults.write = result;
        this._allPipelineResults.write = (this._allPipelineResults.write || '') + '

---

' + result;
        this._setGenerating(false);
        if (status) status.textContent = '正文创作完成';
        this._plLog(`正文创作完成 (${result.length}字)`, 'ok');

        // 存入DB
        if (result) {
            await DB.put('writings', {
                id: 'fusion_write_' + Date.now(),
                title: '融合正文',
                content: result,
                source: 'pipeline',
                createdAt: Date.now()
            });

            // 同步到长篇执笔正文：找到刚才细纲创建的章节并更新正文
            const chIdx = this.left.chapterIdx;
            const allChaps = await DB.getAll('chapters') || [];
            const targetChap = allChaps.find(c => c.source === 'pipeline' && c.title && c.title.includes(`第${chIdx + 1}章`));
            if (targetChap) {
                targetChap.content = result;
                await DB.put('chapters', targetChap);
                this._plLog('✍️ 正文→长篇执笔', 'entity');
            }

            // 正文存RAG
            if (typeof RAGSystem !== 'undefined') {
                await RAGSystem.addDocument(`正文_第${chIdx + 1}章`, result.slice(0, 8000), 'pipeline_write');
                this._plLog('🔍 正文→RAG', 'entity');
            }
        }
    },

    // ---- 查看结果 ----
    viewResult(key) {
        const content = this._pipelineResults[key];
        if (!content) return;
        const outEl = document.getElementById('fb-output');
        if (outEl) outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(content) : content;
    },

    exportResult() {
        const outEl = document.getElementById('fb-output');
        const content = outEl?.innerText;
        if (!content) return UI.toast('暂无内容');
        ContextHelper.exportToLibrary('融合拆书_' + new Date().toLocaleTimeString(), content);
    },

    saveToMemory() {
        const outEl = document.getElementById('fb-output');
        const content = outEl?.innerText;
        if (!content) return UI.toast('暂无内容');
        MemorySystem.addWorking('[融合拆书] ' + content.slice(0, 500), 'fusion', 4, { source: 'fusion_book' });
        UI.toast('已存入工作记忆');
    },

    async sendToWorld(side) {
        const analysis = this[side]?.analysis;
        if (!analysis) return UI.toast('请先分析' + (side === 'left' ? '左' : '右') + '书');
        await DB.put('assets', {
            id: 'fusion_' + side + '_' + Date.now(),
            name: (side === 'left' ? '左书' : '右书') + '技法分析',
            type: 'technique',
            content: analysis,
            tags: ['融合', '技法', side],
            createdAt: Date.now()
        });
        UI.toast('已存入世界引擎');
    },

    sendToPhoenix() {
        const content = this._pipelineResults.fusion || this._pipelineResults.compare || '';
        if (!content) return UI.toast('请先完成融合或对比');
        // 融合技法为去内容化通用模板，可套用到任何新故事
        const ctx = '[融合拆书技法] 以下内容为两书技法融合产出的原创细纲/通用技法模板。角色/世界观/情节全部原创，严禁复用原书内容。';
        const fullContent = ctx + '

' + content;
        // 存入凤凰创作的素材
        if (typeof Modules.phoenix !== 'undefined' && Modules.phoenix._fusionRef !== undefined) {
            Modules.phoenix._fusionRef = fullContent;
        }
        MemorySystem.addWorking('[融合技法→凤凰流] ' + ctx + '
' + content.slice(0, 300), 'fusion_ref', 5, { nexusState: { chr: '原创', wld: '融合细纲' } });
        App.nav('phoenix');
        UI.toast('已跳转到凤凰创作，融合技法已注入');
    },

    sendToWriter() {
        const content = this._pipelineResults.fusion || this._pipelineResults.write || '';
        if (!content) return UI.toast('请先完成融合');
        // 融合技法为去内容化通用模板，可套用到任何新故事
        const ctx = '[融合拆书技法] 以下内容为两书技法融合产出的原创细纲/通用技法模板。角色/世界观/情节全部原创，严禁复用原书内容。';
        const fullContent = ctx + '

' + content;
        MemorySystem.addWorking('[融合技法→执笔台] ' + ctx + '
' + content.slice(0, 300), 'fusion_ref', 5, { nexusState: { chr: '原创', wld: '融合细纲' } });
        App.nav('writer');
        UI.toast('已跳转到执笔台，融合技法已注入工作记忆');
    },

    async _cycleFusionSummary(cyclePairs, cycleSize, leftBook, rightBook) {
        const cycleNum = Math.ceil(cyclePairs.length / cycleSize);
        const startIdx = cyclePairs[0].leftIdx + 1;
        const endIdx = cyclePairs[cyclePairs.length - 1].leftIdx + 1;

        // 获取书名（用于日志和prompt）
        const primarySide = this._primaryBook || 'left';
        const secondarySide = primarySide === 'left' ? 'right' : 'left';
        const primaryBookObj = primarySide === 'left' ? leftBook : rightBook;
        const secondaryBookObj = primarySide === 'left' ? rightBook : leftBook;
        const primaryName = primaryBookObj ? primaryBookObj.name : (primarySide === 'left' ? '左书' : '右书');
        const secondaryName = secondaryBookObj ? secondaryBookObj.name : (primarySide === 'left' ? '右书' : '左书');

        this._plLog(`🔄 执行第${cycleNum}个循环总结 (第${startIdx}-${endIdx}章)`, 'info');

        const titleEl = document.getElementById('pl-current-title');
        if (titleEl) titleEl.innerHTML = `<i class=
```

## AIP011 ? (???) ? line 2538 ? string ? 3406 chars

```text
></i>循环融合总结: 第${startIdx}-${endIdx}章`; 

        let leftCycleAnalyses = '';
        let rightCycleAnalyses = '';
        let cycleOutlines = '';
        let cycleEntities = [];
        let cycleWritings = '';

        for (let i = 0; i < cyclePairs.length; i++) {
            const { leftIdx, rightIdx } = cyclePairs[i];
            const lCh = leftBook.chapters[leftIdx];
            const rCh = rightBook.chapters[rightIdx];

            const leftKey = `cycle_${leftBook.id}_${leftIdx}`;
            const rightKey = `cycle_${rightBook.id}_${rightIdx}`;
            const outlineKey = `cycle_outline_${leftIdx}`;
            const writeKey = `cycle_write_${leftIdx}`;

            try {
                const leftStored = await DB.get('settings', leftKey);
                const rightStored = await DB.get('settings', rightKey);
                const outlineStored = await DB.get('settings', outlineKey);
                const writeStored = await DB.get('settings', writeKey);

                if (leftStored?.content) {
                    leftCycleAnalyses += `## 第${leftIdx + 1}章: ${lCh.title}
${leftStored.content}

`;
                }
                if (rightStored?.content) {
                    rightCycleAnalyses += `## 第${rightIdx + 1}章: ${rCh.title}
${rightStored.content}

`;
                }
                if (outlineStored?.content) {
                    cycleOutlines += `### 第${leftIdx + 1}章细纲
${outlineStored.content.slice(0, 1000)}

`;
                }
                if (writeStored?.content) {
                    cycleWritings += `### 第${leftIdx + 1}章正文片段
${writeStored.content.slice(0, 500)}

`;
                }
            } catch (e) {
                console.warn('读取循环章节分析失败:', e);
            }
        }

        if (leftCycleAnalyses.length === 0 || rightCycleAnalyses.length === 0) {
            this._plLog('⚠️ 循环章节分析不足，跳过循环总结', 'info');
            return;
        }

        const allEntities = await DB.getAll('entities') || [];
        const cycleRelatedEntities = allEntities.filter(e => {
            if (!e.chapterRef) return false;
            for (let i = startIdx; i <= endIdx; i++) {
                if (e.chapterRef.includes(i)) return true;
            }
            return false;
        });

        let entityContext = '';
        if (cycleRelatedEntities.length > 0) {
            entityContext = `

【本循环已提取实体 (${cycleRelatedEntities.length}个)】
`;
            const grouped = {};
            cycleRelatedEntities.forEach(e => {
                const t = e.type || '其他';
                if (!grouped[t]) grouped[t] = [];
                grouped[t].push(e);
            });
            for (const [type, ents] of Object.entries(grouped)) {
                entityContext += `[${type}] ${ents.map(e => e.name + (e.relations?.length ? `(${e.relations.slice(0,3).join(',')})` : '')).join('、')}
`;
            }
        }

        const prevCycleKey = `cycle_fusion_prev_${startIdx}`;
        let prevCycleSummary = '';
        try {
            const prevStored = await DB.get('settings', prevCycleKey);
            if (prevStored?.content) {
                prevCycleSummary = `

【上一循环总结参考】
${prevStored.content.slice(0, 1500)}`;
            }
        } catch(e) {}

        const cycleFusionPrompt = `你是顶级网文技法融合大师，同时是NEXUS OS v2.0叙事工程的技法拆解专家。
【核心原则】以下分析来自两书的技法拆解，你要做的是融合这些技法，产出一份去内容化的技法总结和融合细纲片段。
【绝对禁令】
1. 禁止出现原书角色名、地名、势力名
2. 禁止复述原书的具体情节
3. 所有输出必须是
```

## AIP012 ? (???) ? line 2616 ? string ? 6271 chars

```text
\n\n【技法来源A（${leftBook.name || '左书'}）】\n${leftCycleAnalyses.slice(0, 5000)}\n\n【技法来源B（${rightBook.name || '右书'}）】\n${rightCycleAnalyses.slice(0, 5000)}\n\n【本循环细纲参考】\n${cycleOutlines.slice(0, 2000)}
${entityContext}
${prevCycleSummary}

=== NEXUS OS v2.0 循环融合输出规范 ===
1. 【技法融合总结】两书技法融合后的核心创作指南（去内容化，通用模板）
2. 【循环核心技法模板】提炼可直接套用的写作公式（开篇钩子、节奏控制、爽点设计）
3. 【节奏曲线分析】这${cycleSize}章的节奏变化规律，标注高潮点和过渡点
4. 【爽点矩阵】爽点类型、密度、释放节奏，情绪价值曲线
5. 【悬念链条】伏笔和钩子的衔接设计，跨章节信息差运用
6. 【实体关联网络】本循环关键实体及其关系变化（原创实体，非原书内容）
7. 【NEXUS四状态机快照】
   - CHR角色状态: 列出本循环中各核心角色的状态变迁(S0注册→S1激活→S2互动→S3转折→S4休眠→S5退场→S6死亡)
   - WLD世界规则: 本循环中提出/验证/扩展/冲突/重构/冻结的规则
   - FOE伏笔网络: 本循环埋设/强化/回收/废弃的伏笔清单，标注计划回收章节
   - EMO情绪锚点: 每章情绪分值(1-10)、情绪词、钩子类型、张力等级
8. 【融合细纲片段】基于融合技法，创作一段原创细纲（新角色、新情节，展示技法运用）
9. 【下一循环优化建议】针对下${cycleSize}章的技法提升建议
10. 【可复用套路清单(零件库)】3-5个可直接套用的写作模板，每个含:名称+适用场景+执行步骤

只输出技法总结和原创细纲片段，严禁涉及原书的具体角色和情节。`;

        this._plSetStep('fusion', 'active', '循环深度融合中...');
        let result = '';
        try {
            await AI.generate(cycleFusionPrompt, {}, c => {
                result += c;
                const outEl = document.getElementById('pl-output');
                if (outEl) outEl.textContent = result;
            });
        } catch (e) {
            if (e.message === '已中止') { throw e; }
            this._plLog(`🔴 循环融合失败: ${e.message}`, 'err');
            return;
        }

        const cycleKey = `cycle_fusion_${startIdx}_${endIdx}`;
        await DB.put('settings', { id: cycleKey, content: result, createdAt: Date.now() });

        const nextCycleKey = `cycle_fusion_prev_${endIdx + 1}`;
        await DB.put('settings', { id: nextCycleKey, content: result.slice(0, 2000), createdAt: Date.now() });

        this._allPipelineResults.fusion += `\n\n---\n\n## 循环融合总结: 第${startIdx}-${endIdx}章\n\n${result}`;
        await DB.put('settings', { id: 'pipeline_fusion_context', content: this._allPipelineResults.fusion, updatedAt: Date.now() });

        if (this._plConfig.doRAG && typeof RAGSystem !== 'undefined') {
            await RAGSystem.addDocument(`循环融合_第${startIdx}-${endIdx}章`, result.slice(0, 8000), 'pipeline');
            
            if (cycleRelatedEntities.length > 0) {
                const entitySummary = cycleRelatedEntities.map(e => 
                    `${e.name}(${e.type}): ${e.desc?.slice(0, 50) || ''}`
                ).join('\n');
                await RAGSystem.addDocument(`循环实体_第${startIdx}-${endIdx}章`, entitySummary, 'entity');
            }
        }

        if (cycleWritings) {
            const cycleWriteKey = `cycle_writings_${startIdx}_${endIdx}`;
            await DB.put('settings', { id: cycleWriteKey, content: cycleWritings, createdAt: Date.now() });
        }

        this._plSetStep('fusion', 'done', `${result.length}字`);
        this._plLog(`✅ 循环融合完成: 第${startIdx}-${endIdx}章 (${result.length}字)`, 'ok');
        this._plLog(`   📊 提取实体: ${cycleRelatedEntities.length}个 | 细纲: ${cycleOutlines.length}字`, 'entity');

        await this._cycleExtractPatterns(startIdx, endIdx, result);

        // ★ 同步到世界引擎循环层
        try {
            const cycleData = {
                id: `cycle_${startIdx}_${endIdx}`,
                bookId: leftBook.id + '_' + rightBook.id,
                startChapter: startIdx,
                endChapter: endIdx,
                cycleNum: Math.ceil(endIdx / cycleSize),
                cycleSize,
                fusionEssence: result,
                compareResult: this._pipelineResults.compare || '',
                entityNames: cycleRelatedEntities.map(e => e.name),
                chapterIds: cyclePairs.map(p => 'ch_' + (p.leftIdx + 1)),
                // 简单正则提取NEXUS数据（容错）
                nexusCHR: this._parseNexusBlock(result, 'CHR角色状态', 'CHR'),
                nexusWLD: this._parseNexusBlock(result, 'WLD世界规则', 'WLD'),
                nexusFOE: this._parseNexusBlock(result, 'FOE伏笔网络', 'FOE'),
                nexusEMO: this._parseNexusEMO(result),
                createdAt: Date.now()
            };
            if(typeof Modules !== 'undefined' && Modules.world_engine) {
                await Modules.world_engine.syncCycle(cycleData);
                this._plLog(`🌍 已同步循环数据到世界引擎`, 'ok');
            }
        } catch(syncErr) {
            this._plLog(`⚠️ 同步世界引擎失败: ${syncErr.message}`, 'warn');
        }
    },

    // 简易NEXUS数据解析器（从循环融合文本中提取）
    _parseNexusBlock(text, blockName, prefix) {
        const lines = text.split('\n');
        const results = [];
        let inBlock = false;
        for(const line of lines) {
            if(line.includes(blockName) || line.includes(prefix)) inBlock = true;
            if(inBlock && (line.trim().startsWith('•') || line.trim().startsWith('-'))) {
                const clean = line.replace(/^[•\-\s]+/, '').trim();
                if(clean && clean.length > 3) {
                    const parts = clean.split(/[:：]/);
                    results.push({
                        name: parts[0]?.trim() || clean.slice(0, 20),
                        desc: clean,
                        status: parts[1]?.trim() || '',
                        from: '', to: parts[1]?.trim() || ''
                    });
                }
            }
            if(inBlock && line.trim() === '') { inBlock = false; }
        }
        return results;
    },
    _parseNexusEMO(text) {
        const results = [];
        const lines = text.split('\n');
        let inBlock = false;
        for(const line of lines) {
            if(line.includes('EMO情绪锚点')) inBlock = true;
            if(inBlock && (line.trim().startsWith('•') || line.trim().startsWith('-') || /第\d+章/.test(line))) {
                const m = line.match(/第(\d+)章.*?([\d]+).*?([\u4e00-\u9fa5]+)/);
                if(m) results.push({ chapter: parseInt(m[1]), score: parseInt(m[2]) || 5, word: m[3] || '', type: '' });
            }
            if(inBlock && line.trim().startsWith('【')) { inBlock = false; }
        }
        return results;
    },

    async _cycleExtractPatterns(startIdx, endIdx, fusionResult) {
        if (!fusionResult || fusionResult.length < 500) return;

        this._plLog(`📝 提取循环可复用模式...`, 'info');

        let patterns = '';
        try {
            await AI.generate(
                `从以下循环融合总结中提取可复用的写作模式和模板，以JSON格式输出：

${fusionResult.slice(0, 3000)}

输出格式：
{
```

## AIP013 ? (???) ? line 2768 ? string ? 5396 chars

```text
]
}

只输出JSON，不要其他内容。`,
                {}, c => { patterns += c; }
            );

            let cleanPatterns = patterns.trim();
            cleanPatterns = cleanPatterns.replace(/^???(?:json)?\s*\n?/i, '').replace(/\n????\s*$/, '').trim();
            
            const parsed = JSON.parse(cleanPatterns);
            const patternKey = `cycle_patterns_${startIdx}_${endIdx}`;
            await DB.put('settings', { 
                id: patternKey, 
                patterns: parsed,
                createdAt: Date.now()
            });

            const totalCount = Object.values(parsed).flat().length;
            this._plLog(`✅ 提取可复用模式: ${totalCount}个模板`, 'ok');

            if (this._plConfig.doRAG && typeof RAGSystem !== 'undefined') {
                const patternText = Object.entries(parsed).map(([k, v]) => 
                    `[${k}]\n${v.join('\n')}`
                ).join('\n\n');
                await RAGSystem.addDocument(`写作模式_第${startIdx}-${endIdx}章`, patternText, 'pattern');
            }
        } catch(e) {
            console.warn('提取循环模式失败:', e);
        }
    },

    // ★ 公共API：获取指定章节所属循环的融合精华（供writer.js调用）
    async getCycleFusionForChapter(chapterIdx) {
        if(!this._plConfig.cycleMode) return null;
        const cycleSize = this._plConfig.cycleSize || 5;
        const cycleNum = Math.ceil((chapterIdx + 1) / cycleSize);
        const start = (cycleNum - 1) * cycleSize + 1;
        const end = cycleNum * cycleSize;
        const cycleKey = `cycle_fusion_${start}_${end}`;
        try {
            const stored = await DB.get('settings', cycleKey);
            if(stored && stored.content) return { cycleId: cycleKey, start, end, fusion: stored.content };
        } catch(e) {}
        return null;
    },

    clearAll() {
        this.left = { bookId: null, chapterIdx: null, analysis: '' };
        this.right = { bookId: null, chapterIdx: null, analysis: '' };
        this._pipelineResults = {};
        this._pipelineStep = 0;
        const outEl = document.getElementById('fb-output');
        if (outEl) outEl.innerHTML = '';
        const view = document.getElementById('module-view-fusion_book');
        if (view) view.innerHTML = this.render();
        this.init();
        UI.toast('已清空');
    },

    // ═══════════════════════════════════════════════════════════════
    // 主书设定系统 - 以主拆书为基准保证一致性
    // ═══════════════════════════════════════════════════════════════
    setPrimaryBook(side) {
        const FB = Modules.fusion_book;
        FB._primaryBook = side;
        
        const leftBadge = document.getElementById('fb-primary-badge-left');
        const rightBadge = document.getElementById('fb-primary-badge-right');
        
        if(leftBadge) leftBadge.classList.toggle('hidden', side !== 'left');
        if(rightBadge) rightBadge.classList.toggle('hidden', side !== 'right');
        
        UI.toast(`${side === 'left' ? '左书' : '右书'}已设为主拆书基准`);
        
        FB._savePrimarySettings();
    },

    async _savePrimarySettings() {
        const FB = Modules.fusion_book;
        const primaryBook = FB._primaryBook === 'left' ? FB.left : FB.right;
        const books = FB._books || [];
        const book = books.find(b => b.id === primaryBook.bookId);
        
        if(!book) return;
        
        const settings = {
            id: 'primary_book_settings',
            side: FB._primaryBook,
            bookId: primaryBook.bookId,
            bookName: book.name,
            chapterCount: book.chapters?.length || 0,
            totalChars: book.chapters?.reduce((sum, ch) => sum + (ch.content?.length || 0), 0) || 0,
            setAt: Date.now()
        };
        
        await DB.put('settings', settings);
        FB._primarySettings = settings;
    },

    async _loadPrimarySettings() {
        const FB = Modules.fusion_book;
        try {
            const saved = await DB.get('settings', 'primary_book_settings');
            if(saved && saved.bookId) {
                FB._primaryBook = saved.side || 'left';
                FB._primarySettings = saved;
            }
        } catch(e) {}
    },

    // ═══ 一致性检查 - 确保所有内容以主拆书为基准 ═══
    async checkConsistency() {
        const FB = Modules.fusion_book;
        
        if(!FB._primarySettings) {
            await FB._loadPrimarySettings();
        }
        
        if(!FB._primarySettings || !FB._primarySettings.bookId) {
            UI.toast('请先设置主拆书');
            return;
        }
        
        const primaryBook = FB._primaryBook === 'left' ? FB.left : FB.right;
        const secondaryBook = FB._primaryBook === 'left' ? FB.right : FB.left;
        
        if(!primaryBook.bookId) {
            UI.toast('主书未选择书籍');
            return;
        }
        
        const books = FB._books || [];
        const primary = books.find(b => b.id === primaryBook.bookId);
        const secondary = secondaryBook.bookId ? books.find(b => b.id === secondaryBook.bookId) : null;
        
        if(!primary) {
            UI.toast('找不到主书数据');
            return;
        }
        
        const modal = document.createElement('div');
        modal.id = 'fb-consistency-modal';
        modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm';
        modal.onclick = (e) => { if(e.target === modal) modal.remove(); };
        
        modal.innerHTML = `
            <div class=
```

## AIP014 ? (???) ? line 2938 ? string ? 3792 chars

```text
>关闭</button>
                </div>
            </div>`;
        
        document.body.appendChild(modal);
        
        const contentEl = document.getElementById('fb-consistency-content');
        
        const report = await FB._generateConsistencyReport(primary, secondary);
        
        if(contentEl) {
            contentEl.innerHTML = report.html;
        }
        
        FB._lastConsistencyReport = report;
    },

    async _generateConsistencyReport(primary, secondary) {
        const FB = Modules.fusion_book;
        const issues = [];
        const suggestions = [];
        
        const primaryChars = primary.chapters?.reduce((sum, ch) => sum + (ch.content?.length || 0), 0) || 0;
        const secondaryChars = secondary ? secondary.chapters?.reduce((sum, ch) => sum + (ch.content?.length || 0), 0) || 0 : 0;
        
        if(secondary && secondaryChars > primaryChars * 1.5) {
            issues.push({
                type: 'warning',
                title: '字数比例失衡',
                desc: `副书字数(${(secondaryChars/10000).toFixed(1)}万)远超主书(${(primaryChars/10000).toFixed(1)}万)，可能影响融合质量`,
                fix: '建议增加主书章节数量或减少副书章节'
            });
        }
        
        if(secondary && primary.chapters && secondary.chapters) {
            const primaryChapters = primary.chapters.length;
            const secondaryChapters = secondary.chapters.length;
            
            if(Math.abs(primaryChapters - secondaryChapters) > Math.max(primaryChapters, secondaryChapters) * 0.3) {
                issues.push({
                    type: 'info',
                    title: '章节数量差异',
                    desc: `主书${primaryChapters}章 vs 副书${secondaryChapters}章`,
                    fix: '流水线会自动配对，但建议选择相近章节数'
                });
            }
        }
        
        const worldEngine = Modules.world_engine;
        if(worldEngine) {
            await worldEngine._ensureCache();
            const entities = worldEngine._cachedEntities || [];
            const worldEntities = entities.filter(e => !e.id.startsWith('world_'));
            
            if(worldEntities.length > 0) {
                const primaryContent = primary.chapters?.map(ch => ch.content || '').join('
') || '';
                let matchedCount = 0;
                
                worldEntities.forEach(ent => {
                    if(primaryContent.includes(ent.name)) {
                        matchedCount++;
                    }
                });
                
                const matchRate = (matchedCount / worldEntities.length * 100).toFixed(1);
                
                if(matchRate < 30) {
                    issues.push({
                        type: 'warning',
                        title: '实体匹配率低',
                        desc: `世界引擎中${worldEntities.length}个实体，仅${matchedCount}个在主书中出现(${matchRate}%)`,
                        fix: '建议从主书提取实体到世界引擎'
                    });
                } else {
                    suggestions.push({
                        type: 'success',
                        title: '实体匹配良好',
                        desc: `${worldEntities.length}个实体中${matchedCount}个在主书中出现(${matchRate}%)`
                    });
                }
            }
        }
        
        const fusion = FB._allPipelineResults?.fusion || FB._pipelineResults?.fusion || '';
        if(fusion) {
            const primaryNames = primary.chapters?.slice(0, 5).map(ch => ch.title).join(', ') || '';
            suggestions.push({
                type: 'success',
                title: '融合技法已生成',
                desc: `已生成${fusion.length}字融合技法精华`
            });
        } else {
            issues.push({
                type: 'info',
                title: '尚未生成融合技法',
                desc: '建议运行流水线生成融合技法精华',
                fix: '点击
```

## AIP015 ? (???) ? line 3076 ? string ? 80 chars

```text
>${primary.chapters?.length || 0}</span></div>
                <div><span class=
```

## AIP016 ? (???) ? line 3106 ? template ? 706 chars

```text
);
            const modal = document.getElementById('fb-consistency-modal');
            if(modal) modal.remove();
            await FB.checkConsistency();
        } else {
            UI.toast('没有可自动修复的问题');
        }
    },

    _toggleAdvancedPanel() {
        const panel = document.getElementById('fb-advanced-panel');
        if (panel) panel.classList.toggle('hidden');
    },

    _updateAgentStats() {
        const s = this._agentScheduler._stats;
        const el = document.getElementById('pl-agent-stats');
        if (el) {
            const elapsed = (Date.now() - s.startTime) / 60000;
            const rate = elapsed > 0 ? (s.done / elapsed).toFixed(1) : 0;
            el.textContent =
```

# ???assets/js/modules/fusion_workbench_original.js

## AIP017 ? (???) ? line 790 ? string ? 416 chars

```text
,
            exportedAt: new Date().toISOString(),
            fusionContext: d.fusionContext,
            analyses: d.analysis,
            cycles: d.cycles,
            outlines: d.outlines,
            writings: d.writings,
            entities: d.entities,
            worldCycles: d.worldCycles
        };
        const json = JSON.stringify(exportData, null, 2);
        const blob = new Blob([json], { type:
```

## AIP018 ? (???) ? line 828 ? string ? 89 chars

```text
) || [];
            for (const w of allWritings) {
                if (w.id?.startsWith(
```

# ???assets/js/modules/library_original.js

## AIP019 ? prompt ? line 1036 ? template ? 295 chars

```text
请从以下文本中提取所有重要实体，按类型分类输出JSON格式：

文本：
${...}

要求提取的实体类型：
- 人物：主要角色、重要配角
- 物品：关键道具、法宝、神器
- 地点：重要场景、城市、秘境
- 势力：门派、组织、家族
- 魔法：功法、技能、特殊能力
- 情节：关键事件、转折点

输出格式（严格JSON）：
{
  "人物": [{"name":"名称", "desc":"简短描述"}],
  "物品": [...],
  "地点": [...],
  "势力": [...],
  "魔法": [...],
  "情节": [...]
}

只输出JSON，不要其他内容。
```

## AIP020 ? (???) ? line 1484 ? string ? 84 chars

```text
>${s.totalWords?.toLocaleString() || 0}</span></div>
                    <div class=
```

## AIP021 ? (???) ? line 1486 ? string ? 88 chars

```text
>${s.avgChapterLen?.toLocaleString() || 0}字</span></div>
                    <div class=
```

## AIP022 ? (???) ? line 1528 ? string ? 255 chars

```text
>${typeof marked !== 'undefined' ? marked.parse(result) : result}</div>
                    </div>`;
                log.scrollTop = log.scrollHeight;
            }
        } catch (e) {
            if (log) {
                log.innerHTML += `<div class=
```

## AIP023 ? (???) ? line 1570 ? string ? 255 chars

```text
>${typeof marked !== 'undefined' ? marked.parse(result) : result}</div>
                    </div>`;
                log.scrollTop = log.scrollHeight;
            }
        } catch (e) {
            if (log) {
                log.innerHTML += `<div class=
```

## AIP024 ? if() ? line 1576 ? string ? 2527 chars

```text
>提取失败: ${e.message}</div>`;
            }
        }
    },

    // ═══════════════════════════════════════════════════════════
    // RAG深度集成
    // ═══════════════════════════════════════════════════════════
    indexBookToRAG: async (bookId) => {
        const RC = Modules.reader_center;
        const book = await DB.get('library_books', bookId);
        if (!book) return UI.toast('找不到书籍');
        if (typeof RAGSystem === 'undefined') return UI.toast('RAG系统未加载');
        const content = book.content || '';
        const chunks = RC.chapters.length > 0 ? RC.chapters : RC.smartChapterDetect(content);
        let indexed = 0;
        for (const chunk of chunks) {
            try {
                await RAGSystem.addDocument(
                    `${book.name} - ${chunk.title}`,
                    chunk.content || content.slice(chunk.start, chunk.end),
                    'library',
                    {
                        bookId,
                        bookName: book.name,
                        chapter: chunk.number,
                        chapterTitle: chunk.title
                    }
                );
                indexed++;
            } catch (e) {
                console.log('RAG索引失败:', e);
            }
        }
        UI.toast(`已索引 ${indexed} 个片段到RAG`);
    },

    searchInRAG: async (query) => {
        if (typeof RAGSystem === 'undefined') return [];
        try {
            const results = await RAGSystem.search(query, 10);
            return results;
        } catch (e) {
            console.log('RAG搜索失败:', e);
            return [];
        }
    },

    // ═══════════════════════════════════════════════════════════
    // 阅读增强工具
    // ═══════════════════════════════════════════════════════════
    quickTranslate: async () => {
        const RC = Modules.reader_center;
        const sel = window.getSelection();
        const text = sel ? sel.toString().trim() : '';
        if (!text) return UI.toast('请先选择文本');
        try {
            const result = await AI.generate(`翻译以下中文为英文，保持文学性：

${text}`);
            UI.toast(result, 3000);
        } catch (e) {
            UI.toast('翻译失败');
        }
    },

    quickExplain: async () => {
        const RC = Modules.reader_center;
        const sel = window.getSelection();
        const text = sel ? sel.toString().trim() : '';
        if (!text) return UI.toast('请先选择文本');
        const context = await RC.buildReadingContext(text, { maxTokens: 2000 });
        const prompt = `${context}

请解释以下选中文本的含义、背景和写作手法：
```

## AIP025 ? (???) ? line 1658 ? string ? 255 chars

```text
>${typeof marked !== 'undefined' ? marked.parse(result) : result}</div>
                    </div>`;
                log.scrollTop = log.scrollHeight;
            }
        } catch (e) {
            if (log) {
                log.innerHTML += `<div class=
```

## AIP026 ? (???) ? line 1820 ? string ? 81 chars

```text
>${WC.currentSession?.title || '新对话'}</span>
                        <span class=
```

## AIP027 ? (???) ? line 1939 ? string ? 1178 chars

```text
>在工具中心部署工作流/智能体后，这里会显示快捷按钮</span>';
        }
    },

    newSession: () => {
        const WC = Modules.web_chat;
        const session = { id: Utils.uuid(), title: '新对话', persona: WC.currentPersona, messages: [], ts: Date.now() };
        WC.sessions.unshift(session);
        WC.currentSession = session;
        DB.put('chat_sessions', session);
        WC.init();
        WC._renderMessages();
    },

    loadSession: (id) => {
        const WC = Modules.web_chat;
        const session = WC.sessions.find(s => s.id === id);
        if (!session) return;
        WC.currentSession = session;
        if (session.persona) WC.currentPersona = session.persona;
        WC.init();
        WC._renderMessages();
    },

    delSession: async (id) => {
        const WC = Modules.web_chat;
        await DB.del('chat_sessions', id);
        WC.sessions = WC.sessions.filter(s => s.id !== id);
        if (WC.currentSession?.id === id) WC.currentSession = null;
        WC.init();
        const msgs = document.getElementById('wc-messages');
        if (msgs && !WC.currentSession) {
            const p = WC.personas[WC.currentPersona];
            msgs.innerHTML = `<div class=
```

## AIP028 ? (???) ? line 1972 ? string ? 3391 chars

```text
>${p.name}</p></div>`;
        }
    },

    clearSession: () => {
        const WC = Modules.web_chat;
        if (!WC.currentSession) return;
        if (!confirm('确定清空当前对话？')) return;
        WC.currentSession.messages = [];
        DB.put('chat_sessions', WC.currentSession);
        WC._renderMessages();
    },

    delCurrentSession: async () => {
        const WC = Modules.web_chat;
        if (!WC.currentSession) return UI.toast('没有当前会话');
        if (!confirm('确定删除当前对话？')) return;
        await WC.delSession(WC.currentSession.id);
    },

    setPersona: (key) => {
        const WC = Modules.web_chat;
        WC.currentPersona = key;
        if (key === 'custom') {
            const name = prompt('角色名称：', '自定义角色');
            const system = prompt('系统提示词（角色设定）：', '');
            if (name) WC.personas.custom.name = name;
            if (system) WC.personas.custom.system = system;
        }
        if (WC.currentSession) {
            WC.currentSession.persona = key;
            DB.put('chat_sessions', WC.currentSession);
        }
        // 刷新视图
        const view = document.getElementById('module-view-web_chat');
        if (view) view.innerHTML = WC.render();
        WC.init();
    },

    send: async () => {
        const WC = Modules.web_chat;
        const input = document.getElementById('wc-input');
        const msg = input?.value?.trim();
        if (!msg || WC.typing) return;
        input.value = '';
        document.getElementById('wc-shortcuts')?.classList.add('hidden');

        // 自动创建会话
        if (!WC.currentSession) WC.newSession();
        const session = WC.currentSession;

        // ===== 命令拦截: /workflow /agent /rag =====
        if (msg.startsWith('/workflow ') || msg.startsWith('/agent ') || msg.startsWith('/rag ')) {
            session.messages.push({ role: 'user', content: msg, ts: Date.now() });
            if (session.title === '新对话') session.title = msg.slice(0, 25);
            WC._renderMessages();
            const msgsEl = document.getElementById('wc-messages');
            const persona = WC.personas[WC.currentPersona];

            try {
                let result = '';
                if (msg.startsWith('/workflow ')) {
                    const rest = msg.slice(10).trim();
                    const spaceIdx = rest.indexOf(' ');
                    const wfName = spaceIdx > 0 ? rest.slice(0, spaceIdx) : rest;
                    const wfInput = spaceIdx > 0 ? rest.slice(spaceIdx + 1) : '';
                    const TC = Modules.tools_center;
                    const wfs = await TC._getSavedWorkflows();
                    const wf = wfs.find(w => w.name.includes(wfName) || w.id === wfName);
                    if (!wf) {
                        result = '未找到工作流: ' + wfName + '

可用工作流: ' + (wfs.length > 0 ? wfs.map(w => w.name).join(', ') : '暂无');
                    } else {
                        // IO面板显示
                        const ioIn = document.getElementById('wc-io-in');
                        if (ioIn) ioIn.value = '[工作流: ' + wf.name + ']
输入: ' + (wfInput || '(无)');
                        // 状态指示
                        WC.typing = true;
                        WC._setGenStatus(true, '工作流 ' + wf.name + ' 执行中...');
                        // 流式占位
                        const streamId = 'wc-wf-stream-' + Date.now();
                        msgsEl.innerHTML += `<div class=
```

## AIP029 ? (???) ? line 2052 ? string ? 2738 chars

```text
></i> 工作流执行中: ${wf.name}...</div></div></div>`;
                        msgsEl.scrollTop = msgsEl.scrollHeight;
                        const backup = { nodes: [...TC.nodes], connections: [...TC.connections] };
                        TC.nodes = JSON.parse(JSON.stringify(wf.nodes));
                        TC.connections = JSON.parse(JSON.stringify(wf.connections));
                        try {
                            result = await TC.runWorkflow(wfInput || undefined);
                            const bodyEl = document.getElementById(streamId + '-body');
                            if (bodyEl) bodyEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(result || '(无结果)') : (result || '(无结果)');
                        } catch(e) { result = '工作流执行失败: ' + e.message; }
                        TC.nodes = backup.nodes;
                        TC.connections = backup.connections;
                        // IO输出
                        const ioOut = document.getElementById('wc-io-out');
                        if (ioOut) ioOut.value = result || '';
                        // 移除流式占位
                        const streamEl = document.getElementById(streamId);
                        if (streamEl) streamEl.remove();
                        WC.typing = false;
                        WC._setGenStatus(false);
                    }
                } else if (msg.startsWith('/agent ')) {
                    const rest = msg.slice(7).trim();
                    const spaceIdx = rest.indexOf(' ');
                    const agentName = spaceIdx > 0 ? rest.slice(0, spaceIdx) : rest;
                    const agentMsg = spaceIdx > 0 ? rest.slice(spaceIdx + 1) : '';
                    const TC = Modules.tools_center;
                    const agents = await TC._getAgents();
                    const agent = agents.find(a => a.name.includes(agentName) || a.id === agentName);
                    if (!agent) {
                        result = '未找到智能体: ' + agentName + '

可用智能体: ' + (agents.length > 0 ? agents.map(a => a.name).join(', ') : '暂无');
                    } else {
                        const agentPrompt = agent.prompt + (agentMsg ? '

用户输入：
' + agentMsg : '

请自我介绍并说明你能做什么。');
                        // IO面板显示
                        const ioIn = document.getElementById('wc-io-in');
                        if (ioIn) ioIn.value = '[智能体: ' + agent.name + ']
' + agentPrompt;
                        // 状态指示
                        WC.typing = true;
                        WC._setGenStatus(true, '智能体 ' + agent.name + ' 生成中...');
                        // 流式输出 — 先插入占位消息
                        const streamId = 'wc-agent-stream-' + Date.now();
                        msgsEl.innerHTML += `<div class=
```

## AIP030 ? (???) ? line 2093 ? string ? 2418 chars

```text
>智能体思考中...</span></div></div></div>`;
                        msgsEl.scrollTop = msgsEl.scrollHeight;
                        result = '';
                        await AI.generate(agentPrompt, {}, c => {
                            result += c;
                            const bodyEl = document.getElementById(streamId + '-body');
                            if (bodyEl) bodyEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(result) : result;
                            msgsEl.scrollTop = msgsEl.scrollHeight;
                            const ioOut = document.getElementById('wc-io-out');
                            if (ioOut) ioOut.value = result;
                            WC._updateGenChars(result.length);
                        });
                        WC.typing = false;
                        WC._setGenStatus(false);
                        // 如果智能体绑定了工作流，追加执行
                        if (agent.workflowId && result) {
                            const wfs = await TC._getSavedWorkflows();
                            const wf = wfs.find(w => w.id === agent.workflowId);
                            if (wf) {
                                const backup = { nodes: [...TC.nodes], connections: [...TC.connections] };
                                TC.nodes = JSON.parse(JSON.stringify(wf.nodes));
                                TC.connections = JSON.parse(JSON.stringify(wf.connections));
                                try {
                                    const wfResult = await TC.runWorkflow(result);
                                    if (wfResult) result += '

---
📋 工作流(' + wf.name + ')结果：
' + wfResult;
                                } catch(e) {}
                                TC.nodes = backup.nodes;
                                TC.connections = backup.connections;
                            }
                        }
                        // 移除流式占位，由后面统一push消息
                        const streamEl = document.getElementById(streamId);
                        if (streamEl) streamEl.remove();
                    }
                } else if (msg.startsWith('/rag ')) {
                    const query = msg.slice(5).trim();
                    if (typeof RAGSystem !== 'undefined') {
                        const results = await RAGSystem.search(query, 10);
                        if (results.length === 0) {
                            result = '未找到与
```

## AIP031 ? if() ? line 2132 ? string ? 2271 chars

```text
相关的内容';
                        } else {
                            result = '🔍 RAG检索结果 (' + results.length + '条)：

' + results.map((r, i) => `**${i+1}. [${r.source}] ${r.title}** (${(r.score*100).toFixed(0)}分)
${r.content.slice(0,200)}`).join('

');
                        }
                    } else {
                        result = 'RAG系统不可用';
                    }
                }

                session.messages.push({ role: 'assistant', content: result || '(无结果)', ts: Date.now() });
                session.ts = Date.now();
                await DB.put('chat_sessions', session);
                WC._renderMessages();
                ContextHelper.recordGeneration?.('web_chat_cmd', result?.slice(0, 150));
            } catch(e) {
                session.messages.push({ role: 'assistant', content: '命令执行失败: ' + e.message, ts: Date.now() });
                WC._renderMessages();
            }
            WC.init();
            return;
        }
        // ===== 命令拦截结束 =====

        // 添加用户消息
        session.messages.push({ role: 'user', content: msg, ts: Date.now() });
        // 自动命名
        if (session.title === '新对话' && msg.length > 2) {
            session.title = msg.slice(0, 25) + (msg.length > 25 ? '...' : '');
        }

        WC._renderMessages();
        const msgsEl = document.getElementById('wc-messages');

        // 构建 prompt
        const persona = WC.personas[WC.currentPersona];
        let systemPrompt = persona.system || '';

        // RAG 增强
        if (WC.ragEnabled && typeof RAGSystem !== 'undefined') {
            try {
                const context = await RAGSystem.query(msg);
                if (context) systemPrompt += `

[参考上下文]:
${context}`;
            } catch (e) {}
        }

        // 多轮记忆 - 取最近10轮
        const history = session.messages.slice(-20).map(m => `${m.role === 'user' ? '用户' : 'AI'}: ${m.content}`).join('
');
        const fullPrompt = `${systemPrompt}

对话历史:
${history}

请回复用户最新的消息。`;

        // IO 调试
        const ioIn = document.getElementById('wc-io-in');
        if (ioIn) ioIn.value = fullPrompt;

        // 显示打字动画
        WC.typing = true;
        WC._setGenStatus(true, '生成中...');
        const typingId = 'wc-typing-' + Date.now();
        msgsEl.innerHTML += `<div class=
```

## AIP032 ? (???) ? line 2197 ? string ? 1103 chars

```text
></i> 思考中...</div></div>`;

            await AI.generate(fullPrompt, {}, c => {
                result += c;
                const sEl = document.getElementById(streamBodyId);
                if (sEl) sEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(result) : result;
                msgsEl.scrollTop = msgsEl.scrollHeight;
                WC._updateGenChars(result.length);
            });

            const ioOut = document.getElementById('wc-io-out');
            if (ioOut) ioOut.value = result;

            session.messages.push({ role: 'assistant', content: result, ts: Date.now() });
            session.ts = Date.now();
            await DB.put('chat_sessions', session);

            // 移除流式容器，渲染完整消息
            const typingEl = document.getElementById(typingId);
            if (typingEl) typingEl.remove();
            WC._renderMessages();

            // 记录到工作记忆
            ContextHelper.recordGeneration?.('web_chat', result);
        } catch (e) {
            const typingEl = document.getElementById(typingId);
            if (typingEl) typingEl.innerHTML = `<div class=
```

## AIP033 ? (???) ? line 2267 ? string ? 180 chars

```text
></i></div></div>`;
            }
            const rendered = typeof marked !== 'undefined' ? marked.parse(m.content) : m.content;
            return `
                <div class=
```

## AIP034 ? (???) ? line 2280 ? template ? 1217 chars

```text
;
        }).join('');
        msgsEl.scrollTop = msgsEl.scrollHeight;
        // 更新标题
        const titleEl = document.getElementById('wc-session-title');
        if (titleEl) titleEl.innerText = WC.currentSession.title || '新对话';
    },

    onInput: (el) => {
        const val = el.value;
        const shortcuts = document.getElementById('wc-shortcuts');
        if (!shortcuts) return;
        if (val.startsWith('/')) {
            shortcuts.classList.remove('hidden');
        } else {
            shortcuts.classList.add('hidden');
        }
    },

    useShortcut: (index) => {
        const WC = Modules.web_chat;
        const sc = WC.shortcuts[index];
        if (!sc) return;
        const input = document.getElementById('wc-input');
        if (input) input.value = sc.prompt;
        document.getElementById('wc-shortcuts')?.classList.add('hidden');
        input?.focus();
    },

    toggleIO: () => {
        document.getElementById('wc-io-panel')?.classList.toggle('hidden');
    },

    exportSession: () => {
        const WC = Modules.web_chat;
        if (!WC.currentSession) return UI.toast('无当前会话');
        const msgs = WC.currentSession.messages || [];
        const text = msgs.map(m =>
```

# ???assets/js/modules/memory_original.js

## AIP035 ? (???) ? line 676 ? string ? 1637 chars

```text
/g,
            /「([^」]+)」/g
        ];

        for (const pattern of entityPatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                if (match[1].length >= 2 && match[1].length <= 20) {
                    entities.push(match[1]);
                }
            }
        }

        const relationPatterns = [
            /(.+?)是(.+?)的(.+)/g,
            /(.+?)与(.+?)的关系/g,
            /(.+?)属于(.+)/g
        ];

        for (const pattern of relationPatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                if (match[1] && match[2]) {
                    relations.push(`${match[1]} -> ${match[2]}`);
                }
            }
        }

        if (entities.length > 0 || relations.length > 0) {
            await this.addPersistent(
                `[自动提取] 实体: ${entities.slice(0, 10).join(', ')} | 关系: ${relations.slice(0, 5).join('; ')}`,
                'auto_extract',
                0.5,
                [...keywords, 'auto', source],
                { source, entities, relations }
            );
        }

        return { entities: [...new Set(entities)], relations: [...new Set(relations)], keywords };
    },

    _extractKeywords(text) {
        const stopWords = new Set(['的', '了', '是', '在', '有', '和', '与', '或', '这', '那', '他', '她', '它', '我', '你', '们', '着', '过', '会', '能', '可以', '但是', '因为', '所以', '如果', '虽然', '但是', '然而', '而且', '或者', '以及', '还是', '不是', '没有', '什么', '怎么', '为什么', '哪里', '谁', '多少', '几', '第', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']);

        const words = text.split(/[\s,，。！？、；：
```

# ???assets/js/modules/memory_ui.js

## AIP036 ? (???) ? line 168 ? string ? 219 chars

```text
${checked ? 'checked' : ''}>
                                <span>${label}</span>
                            </label>
                        `).join('')}
                    </div>
                    <button class=
```

## AIP037 ? (???) ? line 355 ? string ? 277 chars

```text
>暂无数据</span>';
            }

            const recentEl = el('mem-recent-working');
            if (recentEl) {
                const recent = MemorySystem.working.slice(-8).reverse();
                recentEl.innerHTML = recent.length === 0
                    ? '<div class=
```

## AIP038 ? (???) ? line 367 ? string ? 4096 chars

```text
>P${m.priority}</span>
                        </div>
                    `).join('');
            }
        } catch (e) {
            console.warn('加载记忆总览失败:', e);
        }
    },

    quickAction(id) {
        if (id === 'sync_rag') return this.syncWorkingToRAG();
        if (id === 'compress') return this.smartCompress();
        if (id === 'world') return this.syncWorld();
        this.switchTab(id);
        setTimeout(() => {
            const focusMap = {
                working: 'mem-wk-content',
                persistent: 'mem-pm-content',
                context: 'mem-ctx-query'
            };
            document.getElementById(focusMap[id])?.focus();
        }, 80);
    },

    loadContextOutput() {
        const el = document.getElementById('mem-ctx-output');
        if (el) el.textContent = this._lastContext || '暂无记忆包。';
    },

    fillContextQuery(text) {
        const el = document.getElementById('mem-ctx-query');
        if (el) {
            el.value = text;
            el.focus();
        }
    },

    async buildContextPack() {
        const query = document.getElementById('mem-ctx-query')?.value?.trim();
        if (!query) return UI.toast('先输入要组包的关键词');
        const chapterNumRaw = document.getElementById('mem-ctx-chapter')?.value;
        const chapterNum = chapterNumRaw ? parseInt(chapterNumRaw) : null;
        const maxTokens = parseInt(document.getElementById('mem-ctx-budget')?.value || '5000');
        const output = document.getElementById('mem-ctx-output');
        if (output) output.textContent = '正在生成记忆包...';

        const ctx = await MemorySystem.buildBrainContext(query, {
            moduleName: 'writer',
            chapterNum,
            chapterId: chapterNum ? `ch_${chapterNum}` : null,
            maxTokens,
            includeWorking: document.getElementById('mem-include-working')?.checked !== false,
            includeSession: true,
            includePersistent: document.getElementById('mem-include-persistent')?.checked !== false,
            includeRAG: document.getElementById('mem-include-rag')?.checked !== false,
            includeEntities: document.getElementById('mem-include-world')?.checked !== false,
            includeWorldView: document.getElementById('mem-include-world')?.checked !== false,
            includeFusion: true,
            includeNexus: true,
            includeCycle: true
        });
        this._lastContext = `【记忆包查询】${query}${chapterNum ? `
【章节】第${chapterNum}章` : ''}
${ctx || '没有找到可用记忆。'}`;
        if (output) output.textContent = this._lastContext;
        UI.toast('记忆包已生成');
    },

    copyContext() {
        if (!this._lastContext) return UI.toast('暂无记忆包');
        Utils.copy(this._lastContext);
    },

    async saveContextAsLongTerm() {
        if (!this._lastContext) return UI.toast('暂无记忆包');
        await MemorySystem.addPersistent(this._lastContext.slice(0, 3000), 'context_pack', 0.75, ['context_pack', 'memory'], { source: 'memory_center', module: 'memory' });
        UI.toast('记忆包已存入长期记忆');
    },

    addWorking() {
        const content = document.getElementById('mem-wk-content')?.value?.trim();
        if (!content) return UI.toast('请输入内容');
        const type = document.getElementById('mem-wk-type')?.value || 'note';
        const priority = parseInt(document.getElementById('mem-wk-priority')?.value || '3');
        const module = document.getElementById('mem-wk-module')?.value?.trim() || '';
        const tags = (document.getElementById('mem-wk-tags')?.value || '').split(/[,，]/).map(t => t.trim()).filter(Boolean);
        MemorySystem.addWorking(content, type, priority, { module, tags, source: 'manual' });
        document.getElementById('mem-wk-content').value = '';
        document.getElementById('mem-wk-tags').value = '';
        this.loadWorking();
        UI.toast('已加入工作记忆');
    },

    loadWorking() {
        const listEl = document.getElementById('mem-working-list');
        if (!listEl) return;
        const items = MemorySystem.working.slice().reverse();
        if (!items.length) {
            listEl.innerHTML = '<div class=
```

## AIP039 ? (???) ? line 475 ? string ? 166 chars

```text
>${this._esc((m.content || '').length > 500 ? (m.content || '').slice(0, 500) + '...' : m.content || '')}</div>
                ${(m.tags || []).length ? `<div class=
```

## AIP040 ? (???) ? line 481 ? string ? 1037 chars

```text
></i>删除</button>
                </div>
            </div>
        `).join('');
    },

    async promoteWorking(id) {
        await MemorySystem.promoteToLongTerm(id);
        this.loadWorking();
        UI.toast('已提升为长期记忆');
    },

    copyWorking(id) {
        const m = MemorySystem.working.find(x => x.id === id);
        if (m) Utils.copy(m.content || '');
    },

    async indexMemory(id) {
        const r = await MemorySystem.indexMemoryToRAG(id);
        if (r?.success) UI.toast('已同步到RAG');
        else UI.toast(r?.error || '同步失败', 'error');
    },

    async syncWorkingToRAG() {
        if (!MemorySystem.working.length) return UI.toast('没有工作记忆可同步');
        const count = await MemorySystem.syncToRAG(3);
        UI.toast(`已同步 ${count} 条工作记忆到RAG`);
    },

    async loadSessions() {
        const listEl = document.getElementById('mem-session-list');
        if (!listEl) return;
        const sessions = await MemorySystem.getAllSessionIds();
        if (!sessions.length) {
            listEl.innerHTML = '<div class=
```

## AIP041 ? (???) ? line 524 ? string ? 123 chars

```text
>${s.updatedAt ? new Date(s.updatedAt).toLocaleDateString() : ''}</span>
                </div>
                <div class=
```

## AIP042 ? (???) ? line 530 ? string ? 488 chars

```text
></div>
            </div>
        `).join('');
    },

    async viewSession(sessionId) {
        const container = document.getElementById('mem-session-items-' + sessionId);
        if (!container) return;
        if (!container.classList.contains('hidden')) {
            container.classList.add('hidden');
            return;
        }
        const items = await MemorySystem.getSessionItems(sessionId, 50);
        container.innerHTML = items.length === 0
            ? '<div class=
```

## AIP043 ? (???) ? line 548 ? string ? 156 chars

```text
>${this._esc((item.content || '').length > 240 ? (item.content || '').slice(0, 240) + '...' : item.content || '')}</div>
                        <div class=
```

## AIP044 ? (???) ? line 554 ? string ? 737 chars

```text
></i></button>
                </div>
            `).join('');
        container.classList.remove('hidden');
    },

    async deleteSession(sessionId) {
        if (!confirm('确定删除此会话记忆？')) return;
        await MemorySystem.deleteSession(sessionId);
        await this.loadSessions();
        UI.toast('已删除');
    },

    async loadWebChatMemory() {
        const listEl = document.getElementById('mem-webchat-list');
        if (!listEl) return;
        const saved = await DB.get('settings', 'web_chat_memory_index_v1').catch(() => null);
        const records = (saved?.records || []).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        if (!records.length) {
            listEl.innerHTML = `
                <div class=
```

## AIP045 ? (???) ? line 585 ? string ? 123 chars

```text
>${r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : ''}</span>
                </div>
                <div class=
```

## AIP046 ? (???) ? line 587 ? string ? 139 chars

```text
>${this._esc((r.summary || r.preview || '').slice(0, 520))}${(r.summary || '').length > 520 ? '...' : ''}</div>
                <div class=
```

## AIP047 ? (???) ? line 591 ? string ? 1877 chars

```text
></i>复制</button>
                </div>
            </div>
        `).join('');
    },

    async syncWebChatMemory() {
        if (Modules.web_chat?.syncAllToMemory) {
            await Modules.web_chat.syncAllToMemory();
        }
        await this.loadWebChatMemory();
    },

    async openWebChatRecord(kind, id) {
        App.nav('web_chat');
        setTimeout(() => {
            if (kind === 'room') Modules.web_chat?.selectRoomRecord?.(id);
            else Modules.web_chat?.openChatRecord?.(id);
        }, 120);
    },

    async copyWebChatMemory(id) {
        const saved = await DB.get('settings', 'web_chat_memory_index_v1').catch(() => null);
        const r = (saved?.records || []).find(x => x.id === id);
        if (r) Utils.copy(r.summary || r.preview || '');
    },

    async promoteWebChatMemory(id) {
        const saved = await DB.get('settings', 'web_chat_memory_index_v1').catch(() => null);
        const r = (saved?.records || []).find(x => x.id === id);
        if (!r) return UI.toast('找不到这条对话记忆');
        await MemorySystem.addPersistent((r.summary || r.preview || '').slice(0, 5000), 'conversation', 0.9, ['网页对话', r.kind === 'room' ? '会议室' : '单聊', '手动固化'], { source: 'web_chat_memory', module: 'web_chat' });
        UI.toast('已固化为长期记忆');
    },

    async loadPersistent() {
        const listEl = document.getElementById('mem-persistent-list');
        if (!listEl) return;
        let items = await MemorySystem.getAllPersistent();
        if (this._pmFilter !== 'all') items = items.filter(m => m.category === this._pmFilter);
        if (this._pmSearch) {
            const q = this._pmSearch.toLowerCase();
            items = items.filter(m => ((m.content || '') + ' ' + (m.tags || []).join(' ') + ' ' + (m.module || '')).toLowerCase().includes(q));
        }
        if (!items.length) {
            listEl.innerHTML = '<div class=
```

## AIP048 ? (???) ? line 651 ? string ? 166 chars

```text
>${this._esc((m.content || '').length > 700 ? (m.content || '').slice(0, 700) + '...' : m.content || '')}</div>
                ${(m.tags || []).length ? `<div class=
```

## AIP049 ? (???) ? line 659 ? template ? 1451 chars

```text
;
        }).join('');
    },

    async addPersistent() {
        const content = document.getElementById('mem-pm-content')?.value?.trim();
        if (!content) return UI.toast('请输入内容');
        const category = document.getElementById('mem-pm-category')?.value || 'fact';
        const importance = parseFloat(document.getElementById('mem-pm-importance')?.value || '0.7');
        const module = document.getElementById('mem-pm-module')?.value?.trim() || '';
        const tags = (document.getElementById('mem-pm-tags')?.value || '').split(/[,，]/).map(t => t.trim()).filter(Boolean);
        await MemorySystem.addPersistent(content, category, importance, tags, { source: 'manual', module });
        document.getElementById('mem-pm-content').value = '';
        document.getElementById('mem-pm-tags').value = '';
        await this.loadPersistent();
        UI.toast('已加入长期记忆');
    },

    async deletePersistent(id) {
        if (!confirm('确定删除此长期记忆？')) return;
        await MemorySystem.deletePersistent(id);
        await this.loadPersistent();
        UI.toast('已删除');
    },

    async copyPersistent(id) {
        const items = await MemorySystem.getAllPersistent();
        const m = items.find(x => x.id === id);
        if (m) Utils.copy(m.content || '');
    },

    async smartCompress() {
        UI.toast('正在整理记忆...');
        const result = await MemorySystem.smartCompress();
        if (result.compressed) {
            UI.toast(
```

## AIP050 ? (???) ? line 704 ? template ? 2312 chars

```text
);
        await this.init();
    },

    async decayImportance() {
        await MemorySystem.decayImportance();
        UI.toast('重要度衰减已执行');
        await this.init();
    },

    async clearAllSessions() {
        if (!confirm('确定清空所有会话记忆？此操作不可恢复。')) return;
        await MemorySystem.clearAllSessions();
        await this.loadSessions();
        UI.toast('已清空所有会话记忆');
    },

    async exportAll() {
        try {
            const data = await MemorySystem.exportAll();
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = '三层记忆_' + new Date().toISOString().slice(0, 10) + '.json';
            a.click();
            URL.revokeObjectURL(url);
            UI.toast('导出成功');
        } catch (e) {
            UI.toast('导出失败: ' + e.message, 'error');
        }
    },

    importData() {
        let input = document.getElementById('mem-import-input');
        if (!input) {
            input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.id = 'mem-import-input';
            input.style.display = 'none';
            document.body.appendChild(input);
        }
        input.value = '';
        input.onchange = async e => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const data = JSON.parse(await file.text());
                let count = 0;
                if (data.persistent && Array.isArray(data.persistent)) count += await MemorySystem.importPersistent(data.persistent);
                if (data.working && Array.isArray(data.working)) {
                    for (const item of data.working) {
                        if (!item.content) continue;
                        MemorySystem.addWorking(item.content, item.type || 'note', item.priority || 3, {
                            tags: item.tags || [],
                            module: item.module || '',
                            source: 'import'
                        });
                        count++;
                    }
                }
                UI.toast(
```

# ???assets/js/modules/phoenix_original.js

## AIP051 ? prompt ? line 572 ? template ? 374 chars

```text
你是一位专业的网文实体提取引擎。请从以下小说细纲中提取所有关键实体。

【细纲内容】
${...}

【提取要求】
请提取以下类型的实体：
1. 人物 - 角色名、身份、性格特点、能力
2. 地点 - 场景、城市、秘境、地标
3. 势力 - 门派、组织、阵营、国家
4. 物品 - 武器、法宝、道具、关键物件
5. 功法/技能 - 修炼体系、招式、能力
6. 种族/生物 - 特殊种族、妖兽、灵兽

【输出格式】严格JSON数组：
[
  {"name":"实体名","type":"人物|地点|势力|物品|功法|种族","desc":"一句话描述"},
  ...
]

注意：
- 只输出JSON数组，不要包裹markdown代码块
- 确保每个实体都有name、type、desc三个字段
- type必须是上述6种之一
- 不要遗漏重要实体
```

## AIP052 ? (???) ? line 688 ? template ? 8484 chars

```text
<div class="flex-1 flex flex-col min-h-0 animate-fade-in">
                <div class="h-11 flex items-center justify-between px-5 bg-[#0d0d0f] border-b border-white/5 shrink-0">
                    <span class="text-xs font-bold text-white">第三步：世界观导入与解析</span>
                    <div class="flex gap-2 items-center">
                        <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30" onclick="Modules.phoenix._openWorldImportModal()"><i class="fa-solid fa-file-import mr-1"></i>导入世界观文件</button>
                        <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30" onclick="Modules.phoenix._importFromClipboard()"><i class="fa-solid fa-clipboard mr-1"></i>从剪贴板导入</button>
                        <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30" onclick="Modules.phoenix._parseWorldWithAI()" id="ph-parse-btn"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>AI智能解析</button>
                    </div>
                </div>
                <!-- AI解析进度区域 -->
                <div id="ph-parse-progress" class="hidden bg-gradient-to-r from-amber-900/20 to-orange-900/20 border-b border-amber-500/20 px-5 py-3 shrink-0">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-spinner fa-spin text-amber-400"></i>
                            <span id="ph-parse-label" class="text-[11px] font-bold text-amber-400">AI智能解析中...</span>
                        </div>
                        <button id="ph-parse-stop" class="btn btn-xs bg-red-600/30 text-red-400 border-red-500/30 hover:bg-red-600 hover:text-white" onclick="Modules.phoenix._stopParse()"><i class="fa-solid fa-stop mr-1"></i>停止</button>
                    </div>
                    <div class="w-full h-1.5 bg-black/30 rounded-full overflow-hidden">
                        <div id="ph-parse-bar" class="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300" style="width: 30%"></div>
                    </div>
                    <div id="ph-parse-status" class="text-[10px] text-amber-300/70 mt-1">正在分析文本结构...</div>
                </div>
                <div class="flex-1 flex min-h-0">
                    <!-- 左侧: 世界观维度面板 -->
                    <div class="w-72 shrink-0 flex flex-col border-r border-white/5 bg-[#0a0a0c]">
                        <div class="px-4 py-2 text-[10px] text-cyan-400 font-bold uppercase bg-black/20 border-b border-white/5 shrink-0">
                            <i class="fa-solid fa-layer-group mr-1"></i>世界观维度
                        </div>
                        <div class="flex-1 overflow-y-auto p-3 space-y-2" id="ph-world-dimensions">
                            ${...}
                        </div>
                        <div class="p-3 border-t border-white/5 space-y-2 shrink-0">
                            <div class="text-[9px] text-dim text-center">已导入: ${...} 实体 · ${...} 维度</div>
                            <div class="grid grid-cols-2 gap-2">
                                <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30 w-full" onclick="Modules.phoenix._injectToEntities()"><i class="fa-solid fa-boxes-stacked mr-1"></i>注入实体</button>
                                <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30 w-full" onclick="Modules.phoenix._injectToKnowledgeGraph()"><i class="fa-solid fa-circle-nodes mr-1"></i>注入知识图谱</button>
                            </div>
                            <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30 w-full" onclick="Modules.phoenix._syncToWorldEngine()"><i class="fa-solid fa-atom mr-1"></i>同步到世界引擎</button>
                            <div class="border-t border-white/5 pt-2 mt-2">
                                <div class="text-[9px] text-dim font-bold mb-1.5"><i class="fa-solid fa-filter mr-1"></i>按章节提取实体</div>
                                <div class="flex gap-1">
                                    <input type="number" class="input bg-black/30 border-white/10 h-7 text-[10px] w-16" id="ph-extract-ch-start" placeholder="起始章" min="1">
                                    <span class="text-dim text-[10px] leading-7">-</span>
                                    <input type="number" class="input bg-black/30 border-white/10 h-7 text-[10px] w-16" id="ph-extract-ch-end" placeholder="结束章" min="1">
                                </div>
                                <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30 w-full mt-1.5" onclick="Modules.phoenix._extractEntitiesByChapter()"><i class="fa-solid fa-magnifying-glass mr-1"></i>提取章节实体</button>
                            </div>
                            <div class="border-t border-white/5 pt-2 mt-2">
                                <div class="text-[9px] text-dim font-bold mb-1.5"><i class="fa-solid fa-book mr-1"></i>按卷提取实体</div>
                                <select class="input bg-black/30 border-white/10 h-7 text-[10px] w-full" id="ph-extract-volume">
                                    <option value="">选择卷...</option>
                                    <option value="1-20">第一卷 (1-20章)</option>
                                    <option value="21-40">第二卷 (21-40章)</option>
                                    <option value="41-60">第三卷 (41-60章)</option>
                                    <option value="61-80">第四卷 (61-80章)</option>
                                    <option value="81-100">第五卷 (81-100章)</option>
                                    <option value="custom">自定义范围</option>
                                </select>
                                <button class="btn btn-xs bg-indigo-600/20 text-indigo-400 border-indigo-600/30 w-full mt-1.5" onclick="Modules.phoenix._extractEntitiesByVolume()"><i class="fa-solid fa-layer-group mr-1"></i>提取卷实体</button>
                            </div>
                        </div>
                    </div>
                    <!-- 中间: 原始内容编辑 -->
                    <div class="flex-1 flex flex-col border-r border-white/5 min-w-0">
                        <div class="px-4 py-2 text-[10px] text-accent font-bold uppercase bg-black/20 border-b border-white/5 shrink-0 flex items-center justify-between">
                            <span><i class="fa-solid fa-file-lines mr-1"></i>原始内容</span>
                            <span class="text-dim font-mono" id="ph-raw-stats">${...} 字</span>
                        </div>
                        <textarea class="flex-1 bg-transparent border-none p-4 font-mono text-sm resize-none text-gray-300 leading-relaxed focus:outline-none" id="ph-world-raw" placeholder="粘贴或导入世界观设定内容，支持自由文本、Markdown、JSON格式...">${...}</textarea>
                    </div>
                    <!-- 右侧: 解析结果预览 -->
                    <div class="w-96 shrink-0 flex flex-col min-w-0">
                        <div class="px-4 py-2 text-[10px] text-green-400 font-bold uppercase bg-black/20 border-b border-white/5 shrink-0 flex items-center justify-between">
                            <span><i class="fa-solid fa-sparkles mr-1"></i>解析结果</span>
                            <div class="flex gap-1">
                                <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.phoenix._copyParsedResult()"><i class="fa-solid fa-copy"></i></button>
                                <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.phoenix._clearParsedResult()"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        </div>
                        <div class="flex-1 overflow-y-auto p-4" id="ph-world-parsed">
                            ${...}
                        </div>
                        <div class="p-3 border-t border-white/5 space-y-2 shrink-0">
                            <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30 w-full" onclick="Modules.phoenix._mergeToOutline()"><i class="fa-solid fa-code-merge mr-1"></i>合并到大纲</button>
                            <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30 w-full" onclick="Modules.phoenix._injectToVectorDB()"><i class="fa-solid fa-database mr-1"></i>存入向量库</button>
                        </div>
                    </div>
                </div>
            </div>
```

## AIP053 ? prompt ? line 903 ? template ? 795 chars

```text
你是一个专业的世界观解析引擎。请从以下文本中提取世界观设定，并按照指定格式输出。

【输入文本】
${...}

【提取要求】
请提取以下类型的信息：
1. 人物 - 角色名、身份、性格、外貌、能力、背景
2. 物品 - 武器、法宝、道具、关键物件
3. 地点 - 场景、城市、秘境、地标
4. 势力 - 门派、组织、阵营、国家
5. 种族 - 种族、族群、特殊生物
6. 魔法 - 功法、技能、法术体系
7. 规则 - 世界运行规则、力量等级
8. 文化 - 风俗、信仰、语言、节日
9. 历史 - 历史事件、传说、纪元
10. 技法 - 写作技法、叙事手法

【世界观维度】
同时请将内容归类到以下世界观维度：
- history (历史与传说)
- geography (地理与地貌)
- magic (魔法/科技体系)
- factions (势力与组织)
- species (种族与生物)
- rules (世界规则)
- culture (文化与习俗)

【输出格式】严格JSON：
{
  "entities": [
    {"name":"实体名","type":"类型","desc":"详细描述","relations":["关系:关联实体"]}
  ],
  "worldview": {
    "history":"历史与传说内容",
    "geography":"地理与地貌内容",
    "magic":"魔法/科技体系内容",
    "factions":"势力与组织内容",
    "species":"种族与生物内容",
    "rules":"世界规则内容",
    "culture":"文化与习俗内容"
  },
  "summary":"世界观整体概述（100字以内）"
}

直接输出JSON，不要包裹markdown代码块。
```

## AIP054 ? prompt ? line 2457 ? template ? 795 chars

```text
你是一个专业的世界观解析引擎。请从以下文本中提取世界观设定，并按照指定格式输出。

【输入文本】
${...}

【提取要求】
请提取以下类型的信息：
1. 人物 - 角色名、身份、性格、外貌、能力、背景
2. 物品 - 武器、法宝、道具、关键物件
3. 地点 - 场景、城市、秘境、地标
4. 势力 - 门派、组织、阵营、国家
5. 种族 - 种族、族群、特殊生物
6. 魔法 - 功法、技能、法术体系
7. 规则 - 世界运行规则、力量等级
8. 文化 - 风俗、信仰、语言、节日
9. 历史 - 历史事件、传说、纪元
10. 技法 - 写作技法、叙事手法

【世界观维度】
同时请将内容归类到以下世界观维度：
- history (历史与传说)
- geography (地理与地貌)
- magic (魔法/科技体系)
- factions (势力与组织)
- species (种族与生物)
- rules (世界规则)
- culture (文化与习俗)

【输出格式】严格JSON：
{
  "entities": [
    {"name":"实体名","type":"类型","desc":"详细描述","relations":["关系:关联实体"]}
  ],
  "worldview": {
    "history":"历史与传说内容",
    "geography":"地理与地貌内容",
    "magic":"魔法/科技体系内容",
    "factions":"势力与组织内容",
    "species":"种族与生物内容",
    "rules":"世界规则内容",
    "culture":"文化与习俗内容"
  },
  "summary":"世界观整体概述（100字以内）"
}

直接输出JSON，不要包裹markdown代码块。
```

## AIP055 ? (???) ? line 2862 ? template ? 412 chars

```text
你是深度实体提取引擎。从以下章节内容中提取所有实体。

【提取类型】
- 人物：所有角色（主角、配角、反派），含性格、身份
- 物品：道具、武器、法宝、关键物件
- 地点：地名、场景、建筑、地标
- 情节：关键事件、转折点、冲突
- 伏笔：暗示、线索、未解之谜
- 势力：门派、组织、国家、阵营、家族

【章节内容】
${...}

【输出格式】JSON数组：
[{"name":"名称","type":"人物/物品/地点/情节/伏笔/势力","desc":"详细描述50-200字","relations":["关系类型:关联实体名"],"chapters":[${...}-${...}]]

【关键要求】
- 每个实体的relations必须尽可能多地引用其他实体名称
- 关系格式："关系类型:实体名"
- chapters字段标注实体出现的章节范围
- 直接输出纯JSON数组，禁止使用markdown代码块包裹。
```

## AIP056 ? (???) ? line 2985 ? template ? 531 chars

```text
你是深度实体提取引擎。从以下章节内容中提取所有实体，并进行深度关联分析。${...}

【提取类型】
- 人物：所有角色（主角、配角、反派），含性格、身份、能力
- 物品：道具、武器、法宝、关键物件
- 地点：地名、场景、建筑、地标
- 情节：关键事件、转折点、冲突
- 伏笔：暗示、线索、未解之谜
- 势力：门派、组织、国家、阵营、家族
- 种族：种族设定、族群特征

【章节内容】(共${...}章)
${...}

【输出格式】JSON数组：
[{"name":"名称","type":"人物/物品/地点/情节/伏笔/势力/种族","desc":"详细描述100-300字","relations":["关系类型:关联实体名"],"chapters":[出现章节],"importance":1-5}]

【关键要求】
- 每个实体的relations必须尽可能多地引用其他实体名称
- 关系格式："关系类型:实体名"，例如 "师父:张三"、"敌对:魔教"
- chapters字段标注实体出现的具体章节
- importance表示实体重要程度(1-5)
- 提取本卷的核心实体和关键关系
- 直接输出纯JSON数组，禁止使用markdown代码块包裹。
```

## AIP057 ? prompt ? line 3187 ? template ? 544 chars

```text
${...}\n\n=== 自检任务 ===\n请对以下细纲执行 NEXUS OS v2.0 M09 完整自检，输出严格JSON格式：\n{\n  "l1_violations": [{"rule":"规则名","location":"第X章","severity":"严重/警告","fix":"修正建议"}],\n  "p_violations": [{"protocol":"P编号","location":"位置","issue":"问题"}],\n  "chr_issues": [{"character":"角色名","issue":"问题描述"}],\n  "emo_curve": [{"chapter":"章名","score":7,"issue":"无/断裂/疲劳"}],\n  "foe_issues": [{"hook":"伏笔","status":"超期/未回收/冲突"}],\n  "overall_score": 85,\n  "critical_count": 0,\n  "warning_count": 0,\n  "top_fixes": ["最重要的3条修正建议"]\n}\n\n[待检细纲]\n${...}\n\n请只输出JSON，不要其他文字。
```

# ???assets/js/modules/rag_ui.js

## AIP058 ? (???) ? line 93 ? string ? 106 chars

```text
>
                        ${history.length ? history.map(h => `
                            <button class=
```

## AIP059 ? (???) ? line 200 ? string ? 2667 chars

```text
></i>存记忆</button>
                </div>
            </div>`;
        }).join('');
    },

    async init() {
        await RAGSystem.init?.();
        await this.loadStats();
    },

    _presetActive(id) {
        const p = this._sourcePresets[id];
        if (!p) return false;
        return p.filters.length === this._filters.length && p.filters.every(f => this._filters.includes(f));
    },

    applyPreset(id) {
        const p = this._sourcePresets[id];
        if (!p) return;
        this._filters = [...p.filters];
        this._refresh();
        UI.toast(`已切换到「${p.label}」范围`);
    },

    selectAllSources() {
        this._filters = Object.keys(RAGSystem._SOURCES || {});
        this._refresh();
    },

    toggleFilter(key, checked) {
        if (checked && !this._filters.includes(key)) this._filters.push(key);
        if (!checked) this._filters = this._filters.filter(f => f !== key);
    },

    setMode(mode) {
        this._contextMode = mode;
        this._refresh();
    },

    _refresh() {
        const view = document.getElementById('module-view-rag_context');
        if (view) view.innerHTML = this.render();
        this.init();
    },

    async loadStats() {
        this._stats = await RAGSystem.getSourceStats();
        const map = {
            chapter: this._stats.chapters,
            outline: this._stats.outlines,
            entity: this._stats.entities,
            knowledge: this._stats.knowledge,
            world: this._stats.world,
            fusion_book: this._stats.fusionChapters,
            pipeline: this._stats.pipeline,
            document: this._stats.documents,
            memory: this._stats.persistent,
            library: this._stats.library,
            vector: this._stats.vectors,
            pattern: this._stats.patterns,
            cycle: this._stats.cycles
        };
        for (const [k, v] of Object.entries(map)) {
            const el = document.getElementById('rag-stat-' + k);
            if (el) el.textContent = v || 0;
        }
        const summary = document.getElementById('rag-stat-summary');
        if (summary) summary.innerHTML = this._renderStatCards();
    },

    quickSearch(query) {
        const input = document.getElementById('rag-search-input');
        if (input) input.value = query;
        this.doSearch();
    },

    async doSearch() {
        const input = document.getElementById('rag-search-input');
        const query = input?.value?.trim();
        if (!query) return UI.toast('先输入要查的关键词');
        this._lastQuery = query;
        const resultsEl = document.getElementById('rag-results');
        if (resultsEl) resultsEl.innerHTML = '<div class=
```

## AIP060 ? buildCtx() ? line 290 ? string ? 83 chars

```text
);
        const query = input?.value?.trim();
        if (!query) return UI.toast(
```

## AIP061 ? aiSummarize() ? line 303 ? string ? 83 chars

```text
);
        const query = input?.value?.trim();
        if (!query) return UI.toast(
```

## AIP062 ? aiRerank() ? line 322 ? string ? 102 chars

```text
);
        const query = input?.value?.trim() || this._lastQuery;
        if (!query) return UI.toast(
```

# ???assets/js/modules/settings_original.js

## AIP063 ? (???) ? line 316 ? template ? 5388 chars

```text
<div class="max-w-3xl space-y-6">
            <h2 class="text-lg font-bold text-white">数据管理</h2>
            <!-- 本地文件夹永久存储 -->
            <div class="p-4 bg-[#111] rounded-xl border border-amber-500/20 space-y-4 relative overflow-hidden">
                <div class="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500"></div>
                <div class="flex items-center gap-2">
                    <i class="fa-solid fa-hard-drive text-amber-400"></i>
                    <span class="text-xs font-bold text-amber-400 uppercase">本地文件夹永久存储</span>
                    <span class="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">${...}</span>
                </div>
                <div id="local-sync-status"></div>
            </div>
            <!-- 备份恢复 -->
            <div class="p-4 bg-[#111] rounded-xl border border-white/5 space-y-4">
                <span class="text-xs font-bold text-dim uppercase">备份与恢复</span>
                <div class="grid grid-cols-2 gap-4">
                    <button class="p-4 bg-black/30 rounded-xl border border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all text-left group" onclick="Modules.settings.exportData()">
                        <i class="fa-solid fa-download text-blue-400 text-lg mb-2 group-hover:scale-110 transition-transform inline-block"></i>
                        <div class="text-sm font-bold text-white">导出备份</div>
                        <div class="text-[10px] text-dim mt-1">将所有数据导出为 JSON 文件</div>
                    </button>
                    <button class="p-4 bg-black/30 rounded-xl border border-white/5 hover:border-green-500/30 hover:bg-green-500/5 transition-all text-left group" onclick="document.getElementById('import-file').click()">
                        <i class="fa-solid fa-upload text-green-400 text-lg mb-2 group-hover:scale-110 transition-transform inline-block"></i>
                        <div class="text-sm font-bold text-white">恢复数据</div>
                        <div class="text-[10px] text-dim mt-1">从 JSON 备份文件恢复</div>
                    </button>
                    <input type="file" id="import-file" class="hidden" accept=".json" onchange="Modules.settings.importData(this)">
                </div>
            </div>
            <!-- 存储统计 -->
            <div class="p-4 bg-[#111] rounded-xl border border-white/5 space-y-4">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-dim uppercase">存储统计</span>
                    <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.settings._refreshStorageStats()"><i class="fa-solid fa-rotate mr-1"></i>刷新</button>
                </div>
                <div class="grid grid-cols-4 gap-3" id="storage-stats">
                    <div class="p-3 bg-black/30 rounded-lg text-center"><div class="text-lg font-bold text-white" id="ss-entities">-</div><div class="text-[9px] text-dim">实体</div></div>
                    <div class="p-3 bg-black/30 rounded-lg text-center"><div class="text-lg font-bold text-white" id="ss-vectors">-</div><div class="text-[9px] text-dim">向量</div></div>
                    <div class="p-3 bg-black/30 rounded-lg text-center"><div class="text-lg font-bold text-white" id="ss-prompts">-</div><div class="text-[9px] text-dim">提示词</div></div>
                    <div class="p-3 bg-black/30 rounded-lg text-center"><div class="text-lg font-bold text-white" id="ss-books">-</div><div class="text-[9px] text-dim">图书</div></div>
                    <div class="p-3 bg-black/30 rounded-lg text-center"><div class="text-lg font-bold text-white" id="ss-volumes">-</div><div class="text-[9px] text-dim">卷</div></div>
                    <div class="p-3 bg-black/30 rounded-lg text-center"><div class="text-lg font-bold text-white" id="ss-chapters">-</div><div class="text-[9px] text-dim">章节</div></div>
                    <div class="p-3 bg-black/30 rounded-lg text-center"><div class="text-lg font-bold text-white" id="ss-sessions">-</div><div class="text-[9px] text-dim">对话</div></div>
                    <div class="p-3 bg-black/30 rounded-lg text-center"><div class="text-lg font-bold text-white" id="ss-outlines">-</div><div class="text-[9px] text-dim">大纲</div></div>
                </div>
            </div>
            <!-- 选择性清理 -->
            <div class="p-4 bg-[#111] rounded-xl border border-white/5 space-y-4">
                <span class="text-xs font-bold text-dim uppercase">选择性清理</span>
                <div class="grid grid-cols-3 gap-3">
                    ${...}
                </div>
            </div>
            <!-- 危险区域 -->
            <div class="p-4 bg-red-900/10 rounded-xl border border-red-900/30 space-y-3">
                <span class="text-xs font-bold text-red-400 uppercase">危险区域</span>
                <p class="text-[10px] text-dim">不可逆操作：清空所有本地数据库，恢复到初始状态。</p>
                <button class="btn btn-sm bg-red-600/20 text-red-400 border-red-600/30 hover:bg-red-600 hover:text-white" onclick="if(confirm('确定恢复出厂设置？所有数据将永久丢失。')){indexedDB.deleteDatabase(DB.name);localStorage.clear();location.reload()}"><i class="fa-solid fa-skull-crossbones mr-1"></i>恢复出厂设置</button>
            </div>
        </div>
```

# ???assets/js/modules/toolbox_original.js

## AIP064 ? prompt ? line 478 ? template ? 92 chars

```text
从以下文本中提取所有实体信息，返回JSON数组格式：[{"name":"名称","type":"类型(人物/物品/地点/势力/规则等)","desc":"描述"}]\n\n${...}
```

# ???assets/js/modules/tools_center_original.js

## AIP065 ? _renderCollapsedSidebar() ? line 53 ? template ? 1257 chars

```text
<button class="w-10 h-10 flex center text-dim hover:text-white hover:bg-white/10 border-b border-white/5" onclick="Modules.tools_center.toggleSidebar()" title="展开面板"><i class="fa-solid fa-angles-right text-xs"></i></button>
            <button class="w-10 h-10 flex center ${...}" onclick="Modules.tools_center.switchTab('workflow')" title="工作流"><i class="fa-solid fa-diagram-project text-xs"></i></button>
            <button class="w-10 h-10 flex center ${...}" onclick="Modules.tools_center.switchTab('agents')" title="智能体"><i class="fa-solid fa-robot text-xs"></i></button>
            <div class="flex-1"></div>
            <button class="w-10 h-10 flex center text-dim hover:text-green-400 hover:bg-green-500/10" onclick="Modules.tools_center.runWorkflow()" title="运行工作流"><i class="fa-solid fa-play text-xs"></i></button>
            <button class="w-10 h-10 flex center text-dim hover:text-white hover:bg-white/10" onclick="Modules.tools_center.saveWorkflow()" title="保存"><i class="fa-solid fa-floppy-disk text-xs"></i></button>
            <button class="w-10 h-10 flex center text-dim hover:text-white hover:bg-white/10" onclick="Modules.tools_center.importWorkflowJSON()" title="导入"><i class="fa-solid fa-upload text-xs"></i></button>
```

## AIP066 ? _renderBottomActions() ? line 97 ? template ? 1397 chars

```text
<button class="btn w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9 rounded-lg font-bold" onclick="Modules.tools_center.runWorkflow()"><i class="fa-solid fa-play mr-1"></i>运行工作流</button>
            <div class="flex gap-1">
                <button class="btn flex-1 bg-white/5 hover:bg-white/10 text-dim text-[10px] h-7 rounded" onclick="Modules.tools_center.saveWorkflow()"><i class="fa-solid fa-floppy-disk mr-1"></i>保存</button>
                <button class="btn flex-1 bg-white/5 hover:bg-white/10 text-dim text-[10px] h-7 rounded" onclick="Modules.tools_center.importWorkflowJSON()"><i class="fa-solid fa-upload mr-1"></i>导入</button>
                <button class="btn flex-1 bg-white/5 hover:bg-white/10 text-dim text-[10px] h-7 rounded" onclick="Modules.tools_center.exportWorkflowJSON()"><i class="fa-solid fa-download mr-1"></i>导出</button>
            </div>
            <div class="flex gap-1">
                <button class="btn flex-1 bg-white/5 hover:bg-white/10 text-dim text-[10px] h-7 rounded" onclick="Modules.tools_center.toggleBatchMode()"><i class="fa-solid fa-layer-group mr-1"></i>批量</button>
                <button class="btn flex-1 bg-white/5 hover:bg-white/10 text-dim text-[10px] h-7 rounded" onclick="document.getElementById('tc-global-io')?.classList.toggle('hidden')"><i class="fa-solid fa-terminal mr-1"></i>IO</button>
            </div>
```

# ???assets/js/modules/world_original.js

## AIP067 ? prompt ? line 1200 ? template ? 687 chars

```text
你是一个专业的小说实体提取引擎。请从以下融合拆书分析数据中，提取所有有价值的实体。

【数据来源】
${...}
${...}

【提取要求】
请提取以下12种类型的实体：
1. 人物 — 角色名、身份、性格、外貌、能力
2. 物品 — 武器、法宝、道具、关键物件
3. 地点 — 场景、城市、秘境、地标
4. 情节 — 关键事件、转折点、冲突
5. 伏笔 — 暗示、线索、未解之谜
6. 势力 — 门派、组织、阵营、国家
7. 种族 — 种族、族群、特殊生物
8. 魔法 — 功法、技能、法术体系
9. 规则 — 世界运行规则、力量等级
10. 文化 — 风俗、信仰、语言、节日
11. 历史 — 历史事件、传说、纪元
12. 技法 — 写作技法、叙事手法、结构技巧

【输出格式】严格JSON数组：
[{"name":"实体名","type":"类型","desc":"详细描述(100-300字)","relations":["关系类型:关联实体名"]}]

【关键要求 - 关系网络】
- 每个实体的relations必须尽可能多地引用其他实体名称，用"关系类型:实体名"格式
- 关系类型例如：师父、徒弟、敌对、盟友、所属、位于、拥有、使用、参与、创造、守护、统治等
- 人物之间要有师徒/敌友/从属关系
- 人物与地点要有"位于"/"出没"关系
- 人物与物品要有"拥有"/"使用"关系
- 人物与势力要有"所属"/"统治"关系
- 情节与人物要有"参与"关系
- 这些关系是构建知识网络图的关键，不要遗漏！
- 直接输出JSON，不要包裹markdown代码块
```

## AIP068 ? (???) ? line 1263 ? string ? 541 chars

```text
));
                    entities = JSON.parse(fixed);
                } catch(e3) {
                    // 尝试4: 逐个对象提取（支持含数组的对象）
                    const objMatches = cleanRes.match(/\{(?:[^{}]|\[[^\]]*\]|\{[^{}]*\})*"name"\s*:\s*"[^"]+?"(?:[^{}]|\[[^\]]*\]|\{[^{}]*\})*\}/g);
                    if (objMatches && objMatches.length) {
                        entities = [];
                        for (const objStr of objMatches) {
                            try {
                                let fixedObj = objStr.replace(/,\s*}/g,
```

## AIP069 ? if() ? line 1298 ? string ? 4428 chars

```text
/);
                                if (dm) cur.desc = dm[1];
                            }
                        }
                        if (cur && cur.name) entities.push(cur);
                    }
                }
            }
        }
        if(!entities || !Array.isArray(entities) || !entities.length) return UI.toast('提取失败，AI返回格式异常');

        await we._ensureCache();
        const existingEntities = we._cachedEntities || [];
        const existingNameMap = new Map();
        existingEntities.forEach(e => {
            if (e.name) {
                existingNameMap.set(e.name.toLowerCase().trim(), e);
            }
        });

        let addedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        const now = Date.now();
        for(const ent of entities) {
            if(!ent.name || !ent.type) continue;
            
            const normalizedName = ent.name.toLowerCase().trim();
            const existingEntity = existingNameMap.get(normalizedName);
            
            let relations = ent.relations || [];
            if(!Array.isArray(relations)) relations = [];
            relations = relations.map(r => typeof r === 'string' ? r : String(r)).filter(Boolean);

            if (existingEntity) {
                const newDesc = ent.description || ent.desc || '';
                if (existingEntity.desc !== newDesc || existingEntity.type !== ent.type) {
                    await DB.put('entities', {
                        id: existingEntity.id,
                        name: ent.name,
                        type: ent.type,
                        desc: newDesc || existingEntity.desc,
                        relations: [...new Set([...(existingEntity.relations || []), ...relations])],
                        source: existingEntity.source || 'pipeline',
                        updatedAt: now
                    });
                    await DB.put('vectors', { 
                        id: existingEntity.id, 
                        content: `[${ent.type}] ${ent.name}: ${newDesc}`, 
                        vector: Array.from({length:1536}, ()=>Math.random()), 
                        timestamp: now 
                    });
                    updatedCount++;
                } else {
                    skippedCount++;
                }
            } else {
                const id = 'ent_pipeline_' + Utils.uuid();
                await DB.put('entities', {
                    id, name: ent.name, type: ent.type,
                    desc: ent.description || ent.desc || '', relations,
                    source: 'pipeline', updatedAt: now
                });
                await DB.put('vectors', { id, content: `[${ent.type}] ${ent.name}: ${ent.description||ent.desc||''}`, vector: Array.from({length:1536}, ()=>Math.random()), timestamp: now });
                addedCount++;
            }
        }
        we._cachedEntities = null;
        let message = `深度提取完成: 新增 ${addedCount}，更新 ${updatedCount}`;
        if (skippedCount > 0) message += `，跳过 ${skippedCount}`;
        UI.toast(message);

        // ★ 同时刷新: 实体列表 + 知识图谱 + 世界观
        we.switchTab('graph');
    },

    // ═══ 从流水线提取世界观 — 修复: 提取后同步刷新图谱 ═══
    extractWorldView: async () => {
        const we = Modules.world_engine;
        const FB = Modules.fusion_book;
        if(!FB) return UI.toast('融合拆书模块未加载');
        const allPr = FB._allPipelineResults || {};
        const pr = FB._pipelineResults || {};
        const fusion = (allPr.fusion && allPr.fusion.trim()) ? allPr.fusion : (pr.fusion || '');
        const compare = (allPr.compare && allPr.compare.trim()) ? allPr.compare : (pr.compare || '');
        const left = (allPr.left && allPr.left.trim()) ? allPr.left : (pr.left || '');
        const right = (allPr.right && allPr.right.trim()) ? allPr.right : (pr.right || '');
        const src = [fusion, compare, left, right].filter(Boolean).join('

');
        if(!src || src.length < 50) return UI.toast('流水线数据不足，请先运行融合拆书');

        const prompt = `你是一个专业的世界观构建引擎。请从以下融合拆书分析数据中，提取并构建完整的世界观设定。

【数据来源】
${src.slice(0, 6000)}

【提取要求】请为以下7个维度各生成详细的世界观设定：

1. history (历史与传说) — 世界的历史脉络、重大事件、传说故事、纪元划分
2. geography (地理与地貌) — 地理环境、重要地标、气候特征、空间布局
3. magic (魔法/科技体系) — 力量体系、等级划分、修炼/科技路线、核心规则
4. factions (势力与组织) — 主要势力、组织架构、势力关系、权力格局
5. species (种族与生物) — 种族分类、特殊生物、种族特征、种族关系
6. rules (世界规则) — 世界运行的底层规则、禁忌、自然法则
7. culture (文化与习俗) — 文化传统、社会制度、信仰体系、日常习俗

【输出格式】严格JSON对象：
{
```

## AIP070 ? (???) ? line 1404 ? string ? 5032 chars

```text
}

注意：每个维度至少200字，要具体、可直接用于创作。直接输出JSON，不要包裹markdown代码块`;

        UI.toast('正在提取世界观...');
        let fullRes = '';
        await AI.generate(prompt, {}, c => { fullRes += c; });

        let worldData = null;
        try { worldData = JSON.parse(fullRes); } catch(e1) {
            try { worldData = JSON.parse(fullRes.replace(/???json?\s*/g,'').replace(/???/g,'').trim()); } catch(e2) {
                const m = fullRes.match(/\{[\s\S]*\}/);
                if(m) try { worldData = JSON.parse(m[0]); } catch(e3) {}
            }
        }
        if(!worldData || typeof worldData !== 'object') return UI.toast('提取失败，AI返回格式异常');

        const cats = ['history','geography','magic','factions','species','rules','culture'];
        let count = 0;
        const now = Date.now();
        for(const cat of cats) {
            if(worldData[cat]) {
                await DB.put('entities', { id: 'world_' + cat, name: cat, type: 'world', desc: worldData[cat], source: 'pipeline', updatedAt: now });
                count++;
            }
        }
        we._cachedEntities = null;
        UI.toast(`世界观提取完成: ${count} 个维度已更新`);

        // ★ 同时刷新: 世界观 + 知识图谱
        we.switchTab('graph');
    },

    // ═══ 世界观构建 ═══
    _loadWorldCat: async () => {
        const we = Modules.world_engine;
        const cat = we.worldCat;
        const data = await DB.get('entities', 'world_' + cat);
        const el = document.getElementById('we-world-editor');
        if(el) el.value = (data && data.desc) ? data.desc : '';
    },
    _saveWorld: async () => {
        const we = Modules.world_engine;
        const cat = we.worldCat;
        const el = document.getElementById('we-world-editor');
        const desc = el ? el.value : '';
        if(!desc) return UI.toast('内容为空');
        await DB.put('entities', { id: 'world_' + cat, name: cat, type: 'world', desc, source: 'manual', updatedAt: Date.now() });
        we._cachedEntities = null;
        UI.toast('世界观已保存: ' + cat);
    },
    _aiGenWorld: async () => {
        const we = Modules.world_engine;
        const cat = we.worldCat;
        const catLabels = {history:'历史与传说',geography:'地理与地貌',magic:'魔法/科技体系',factions:'势力与组织',species:'种族与生物',rules:'世界规则',culture:'文化与习俗'};
        const existing = (document.getElementById('we-world-editor') || {}).value || '';
        let refCtx = '';
        const FB = Modules.fusion_book;
        if(FB) {
            const allPr = FB._allPipelineResults || {};
            const pr = FB._pipelineResults || {};
            const fusion = (allPr.fusion && allPr.fusion.trim()) ? allPr.fusion : (pr.fusion || '');
            if(fusion) refCtx += '\n[融合技法参考]\n' + fusion.slice(0, 1500);
        }
        await we._ensureCache();
        const relatedEntities = (we._cachedEntities || []).filter(e => !e.id.startsWith('world_')).slice(0, 15);
        if(relatedEntities.length) {
            refCtx += '\n[已有实体参考]\n' + relatedEntities.map(e => `${e.type}·${e.name}: ${(e.desc||'').slice(0,80)}`).join('\n');
        }
        const prompt = `请为小说世界观的「${catLabels[cat]}」维度生成详细设定。\n${existing ? '【已有内容(请在此基础上扩展)】\n' + existing.slice(0, 1500) : '【当前为空，请从零构建】'}\n${refCtx}\n\n要求：\n1. 内容详细、具体、有层次感\n2. 包含具体的名称、数据、细节\n3. 适合直接用于小说创作\n4. 至少500字\n5. 使用清晰的分段和标题`;
        const el = document.getElementById('we-world-editor');
        if(el) el.value = '生成中...';
        let fullRes = '';
        await AI.generate(prompt, {}, c => { fullRes += c; if(el) el.value = fullRes; });
        UI.toast('AI 世界观生成完成');
    },

    // ═══ 知识图谱 3D — 核心修复: 真正的网络结构，不是孤立的点 ═══
    // 每个实体(人物/物品/地点/情节/伏笔/势力/种族/魔法/规则/文化/历史/技法)
    // 都是一个具体节点，通过关系连线交织成3D网络
    _graph3d: null,
    _graphShowLabels: true,
    _graphPhysics: true,
    _graphAutoRotate: false,
    _graphRotateTimer: null,
    _graphChapterFilter: 'all',

    _initGraph: async () => {
        const we = Modules.world_engine;
        await we._ensureCache();
        const container = document.getElementById('we-graph-canvas');
        if(!container) return;

        // 清理旧图 + 旧定时器
        if(we._graphRotateTimer) { clearInterval(we._graphRotateTimer); we._graphRotateTimer = null; }
        if(we._graph3d) { try { we._graph3d._destructor && we._graph3d._destructor(); } catch(e){} we._graph3d = null; }
        container.innerHTML = '';

        let entities = (we._cachedEntities || []).filter(e => !e.id.startsWith('world_'));

        // 章节筛选
        const chapterFilter = we._graphChapterFilter;
        if(chapterFilter && chapterFilter !== 'all') {
            entities = entities.filter(e => e.chapters && e.chapters.includes(chapterFilter));
        }

        // ★ 循环筛选 (NEXUS)
        const cycleFilter = we._graphCycleFilter;
        if(cycleFilter && cycleFilter !== 'all') {
            entities = entities.filter(e => e.cycles && e.cycles.includes(cycleFilter));
        }

        if(!entities.length) {
            const msg = (cycleFilter !== 'all') ? '当前循环暂无实体数据' : (chapterFilter !== 'all' ? '当前章节暂无实体数据' : '暂无实体数据，请先提取或创建实体');
            container.innerHTML = '<div class=
```

## AIP071 ? if() ? line 1623 ? string ? 5679 chars

```text
>3D图谱库加载中，请稍后刷新...</div>';
            return;
        }

        const width = container.clientWidth || 800;
        const height = container.clientHeight || 600;

        const Graph = ForceGraph3D()(container)
            .width(width)
            .height(height)
            .backgroundColor('#08080a')
            .graphData({ nodes, links })
            .nodeVal('val')
            .nodeColor(n => n.color)
            .nodeOpacity(0.9)
            .nodeResolution(16)
            .linkColor(link => {
                // 有明确关系的连线更亮
                if(link.label && link.label !== '同类' && link.label !== '提及') return 'rgba(255,255,255,0.25)';
                if(link.label === '提及') return 'rgba(100,200,255,0.15)';
                return 'rgba(255,255,255,0.06)';
            })
            .linkWidth(link => {
                if(link.label && link.label !== '同类' && link.label !== '提及') return 1.2;
                return 0.4;
            })
            .linkOpacity(0.6)
            .linkDirectionalParticles(link => (link.label && link.label !== '同类') ? 2 : 0)
            .linkDirectionalParticleWidth(1)
            .linkDirectionalParticleColor(() => 'rgba(255,200,100,0.6)')
            .d3AlphaDecay(0.02)
            .d3VelocityDecay(0.3)
            .warmupTicks(80)
            .cooldownTicks(200)
            .onNodeHover(node => { container.style.cursor = node ? 'pointer' : 'default'; })
            .onNodeClick(node => {
                if(!node) return;
                const distance = 120;
                const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
                Graph.cameraPosition(
                    { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
                    node, 1000
                );
                we._loadEntity(node.id);
                we.currentTab = 'dashboard';
                const ws = document.getElementById('we-workspace');
                if(ws) ws.innerHTML = we._renderWorkspace();
                we._refreshEntities();
            });

        // 标签渲染
        if(we._graphShowLabels) {
            const T = window.THREE;
            if(!T || !T.CanvasTexture) {
                Graph.nodeLabel(n => `[${n.type}] ${n.name} (${n.degree}条连线): ${n.desc || ''}`);
            } else {
                Graph.nodeThreeObject(node => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const fontSize = Math.max(24, 18 + (node.degree || 0) * 4);
                    const text = node.name || '';
                    ctx.font = `${node.degree > 3 ? 'bold ' : ''}${fontSize}px sans-serif`;
                    const textWidth = ctx.measureText(text).width;
                    canvas.width = textWidth + 16;
                    canvas.height = fontSize + 12;
                    ctx.fillStyle = 'rgba(0,0,0,0.6)';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.font = `${node.degree > 3 ? 'bold ' : ''}${fontSize}px sans-serif`;
                    ctx.fillStyle = node.color || '#fff';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
                    const texture = new T.CanvasTexture(canvas);
                    const spriteMat = new T.SpriteMaterial({ map: texture, depthWrite: false, transparent: true });
                    const sprite = new T.Sprite(spriteMat);
                    const scale = Math.max(8, 5 + (node.degree || 0) * 1.5);
                    sprite.scale.set(scale * (canvas.width / canvas.height), scale, 1);
                    return sprite;
                });
            }
        } else {
            Graph.nodeLabel(n => `[${n.type}] ${n.name} (${n.degree}条连线): ${n.desc || ''}`);
        }

        we._graph3d = Graph;
        if(we._graphAutoRotate) {
            const controls = Graph.controls();
            if(controls) {
                controls.autoRotate = true;
                controls.autoRotateSpeed = 0.5;
            }
            // 如果controls不支持autoRotate，用手动旋转
            if(!controls || !controls.autoRotate) {
                we._graphRotateTimer = setInterval(() => {
                    if(!we._graph3d || !we._graphAutoRotate) {
                        clearInterval(we._graphRotateTimer);
                        we._graphRotateTimer = null;
                        return;
                    }
                    const scene = we._graph3d.scene();
                    if(scene) scene.rotation.y += 0.003;
                }, 30);
            }
        }
    },

    _graphResetView() {
        if(this._graph3d) this._graph3d.cameraPosition({ x: 0, y: 0, z: 500 }, { x: 0, y: 0, z: 0 }, 1000);
    },
    _graphTogglePhysics() {
        this._graphPhysics = !this._graphPhysics;
        if(this._graph3d) {
            if(this._graphPhysics) {
                // 重新启用物理: 恢复力模型并重新加热
                this._graph3d.d3AlphaDecay(0.02);
                this._graph3d.d3VelocityDecay(0.3);
                this._graph3d.d3ReheatSimulation();
            } else {
                // 冻结物理: 将所有节点固定在当前位置
                const gd = this._graph3d.graphData();
                if(gd && gd.nodes) {
                    gd.nodes.forEach(n => { n.fx = n.x; n.fy = n.y; n.fz = n.z; });
                }
                // 停止模拟
                this._graph3d.d3AlphaDecay(1);
                this._graph3d.cooldownTicks(0);
            }
        }
        const btn = document.getElementById('we-g-physics-btn');
        if(btn) btn.innerHTML = `<i class=
```

## AIP072 ? (???) ? line 1752 ? string ? 246 chars

```text
></i>物理模拟 (${this._graphPhysics ? '开启' : '关闭'})`;
    },
    _graphToggleLabels() {
        this._graphShowLabels = !this._graphShowLabels;
        const btn = document.getElementById('we-g-labels-btn');
        if(btn) btn.innerHTML = `<i class=
```

## AIP073 ? _graphToggleLabels() ? line 1757 ? string ? 3687 chars

```text
></i>${this._graphShowLabels ? '显示标签' : '隐藏标签'}`;
        
        if(!this._graph3d) return;
        
        if(this._graphShowLabels) {
            // 开启标签: 用 sprite 文字替代球体
            const T = window.THREE;
            const colorMap = {'人物':'#eab308','物品':'#3b82f6','地点':'#22c55e','情节':'#ef4444','伏笔':'#a855f7','势力':'#f43f5e','种族':'#f97316','魔法':'#6366f1','规则':'#0ea5e9','文化':'#ec4899','历史':'#f59e0b','技法':'#14b8a6'};
            if(T && T.CanvasTexture) {
                this._graph3d.nodeThreeObject(node => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const fontSize = Math.max(24, 18 + (node.degree || 0) * 4);
                    const text = node.name || '';
                    ctx.font = `${node.degree > 3 ? 'bold ' : ''}${fontSize}px sans-serif`;
                    const textWidth = ctx.measureText(text).width;
                    canvas.width = textWidth + 16;
                    canvas.height = fontSize + 12;
                    ctx.fillStyle = 'rgba(0,0,0,0.6)';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.font = `${node.degree > 3 ? 'bold ' : ''}${fontSize}px sans-serif`;
                    ctx.fillStyle = node.color || colorMap[node.type] || '#fff';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
                    const texture = new T.CanvasTexture(canvas);
                    const spriteMat = new T.SpriteMaterial({ map: texture, depthWrite: false, transparent: true });
                    const sprite = new T.Sprite(spriteMat);
                    const scale = Math.max(8, 5 + (node.degree || 0) * 1.5);
                    sprite.scale.set(scale * (canvas.width / canvas.height), scale, 1);
                    return sprite;
                });
                this._graph3d.nodeThreeObjectExtend(false);
            } else {
                // THREE不可用时用tooltip
                this._graph3d.nodeThreeObject(null);
                this._graph3d.nodeLabel(n => `[${n.type}] ${n.name} (${n.degree}条连线)`);
            }
        } else {
            // 关闭标签: 恢复默认球体渲染
            this._graph3d.nodeThreeObject(null);
            this._graph3d.nodeThreeObjectExtend(false);
            this._graph3d.nodeLabel(n => `[${n.type}] ${n.name} (${n.degree}条连线): ${n.desc || ''}`);
        }
        // 触发重绘
        this._graph3d.refresh();
    },
    _graphToggleRotate() {
        this._graphAutoRotate = !this._graphAutoRotate;
        if(this._graph3d) {
            const controls = this._graph3d.controls();
            if(controls) {
                controls.autoRotate = this._graphAutoRotate;
                controls.autoRotateSpeed = 0.5;
            }
            // 如果controls不支持autoRotate，用手动旋转
            if(this._graphAutoRotate && (!controls || !controls.autoRotate)) {
                this._graphRotateTimer = setInterval(() => {
                    if(!this._graph3d || !this._graphAutoRotate) {
                        clearInterval(this._graphRotateTimer);
                        return;
                    }
                    const scene = this._graph3d.scene();
                    if(scene) scene.rotation.y += 0.003;
                }, 30);
            } else if(!this._graphAutoRotate && this._graphRotateTimer) {
                clearInterval(this._graphRotateTimer);
                this._graphRotateTimer = null;
            }
        }
        const btn = document.getElementById('we-g-rotate-btn');
        if(btn) btn.innerHTML = `<i class=
```

## AIP074 ? (???) ? line 1828 ? string ? 4832 chars

```text
></i>自动旋转${this._graphAutoRotate ? ' ●' : ''}`;
    },

    // ═══ 刷新RAG上下文 ═══
    async _refreshRAGContext() {
        await this._ensureCache();
        const entities = (this._cachedEntities || []).filter(e => !e.id.startsWith('world_'));
        const worlds = (this._cachedEntities || []).filter(e => e.id.startsWith('world_') && e.desc);
        if(!entities.length && !worlds.length) return UI.toast('无数据可刷新');
        UI.toast('正在刷新RAG上下文...');
        let count = 0;
        for(const e of entities) {
            const content = `[${e.type}] ${e.name}: ${(e.desc||'').slice(0,500)}${e.relations && e.relations.length ? ' | 关联: ' + e.relations.join(', ') : ''}`;
            if(typeof RAGSystem !== 'undefined') { await RAGSystem.addDocument(`实体_${e.type}_${e.name}`, content, 'world_engine'); count++; }
        }
        const catLabels = {history:'历史与传说',geography:'地理与地貌',magic:'魔法/科技体系',factions:'势力与组织',species:'种族与生物',rules:'世界规则',culture:'文化与习俗'};
        for(const w of worlds) {
            const cat = w.id.replace('world_', '');
            if(typeof RAGSystem !== 'undefined') { await RAGSystem.addDocument(`世界观_${catLabels[cat]||cat}`, (w.desc||'').slice(0,2000), 'world_engine'); count++; }
        }
        const FB = Modules.fusion_book;
        if(FB) {
            const allPr = FB._allPipelineResults || {};
            const pr = FB._pipelineResults || {};
            const fusion = (allPr.fusion && allPr.fusion.trim()) ? allPr.fusion : (pr.fusion || '');
            if(fusion && typeof RAGSystem !== 'undefined') { await RAGSystem.addDocument('融合技法精华_' + Date.now(), fusion.slice(0,4000), 'world_engine'); count++; }
        }
        UI.toast(`RAG上下文已刷新: ${count}条数据`);
    },

    // ═══ 图谱→凤凰流/执笔台 ═══
    async _injectGraphToPhoenix() {
        await this._ensureCache();
        const pkg = this.buildInjectPackage({ includeEntities:true, includeWorld:true, includeFusion:true, maxLen:6000 });
        if(!pkg) return UI.toast('没有可注入的数据');
        if(Modules.phoenix) {
            Modules.phoenix.data = Modules.phoenix.data || {};
            Modules.phoenix.data.worldContext = pkg;
            const entities = (this._cachedEntities || []).filter(e => !e.id.startsWith('world_'));
            const relSummary = entities.filter(e => e.relations && e.relations.length).map(e => `${e.name}(${e.type}): ${e.relations.join(', ')}`).join('
');
            if(relSummary) Modules.phoenix.data.worldContext += '

【实体关系网络】
' + relSummary.slice(0, 2000);
            UI.toast('已注入凤凰创作流 (含关系网络)');
        } else { UI.toast('凤凰创作流未加载'); }
    },
    async _injectGraphToWriter() {
        await this._ensureCache();
        const pkg = this.buildInjectPackage({ includeEntities:true, includeWorld:true, includeFusion:true, maxLen:5000 });
        if(!pkg) return UI.toast('没有可注入的数据');
        const ol = document.getElementById('w-outline');
        if(ol) {
            ol.value = (ol.value ? ol.value + '

' : '') + '[世界引擎·知识图谱注入]
' + pkg;
            if(typeof MemorySystem !== 'undefined') MemorySystem.addWorking('[知识图谱注入] ' + pkg.slice(0, 500), 'world_graph', 5, { source: 'world_engine' });
            UI.toast('已注入执笔台 (含记忆关联)');
        } else {
            if(typeof MemorySystem !== 'undefined') MemorySystem.addWorking('[知识图谱] ' + pkg.slice(0, 800), 'world_graph', 5, { source: 'world_engine' });
            UI.toast('已存入工作记忆，打开执笔台后可用');
        }
    },
    _exportGraph: async () => {
        const we = Modules.world_engine;
        await we._ensureCache();
        const entities = (we._cachedEntities || []).filter(e => !e.id.startsWith('world_'));
        if(!entities.length) return UI.toast('无实体数据');
        let md = '# 知识图谱导出

';
        const grouped = {};
        entities.forEach(e => { const t = e.type || '其他'; if(!grouped[t]) grouped[t] = []; grouped[t].push(e); });
        for(const [type, items] of Object.entries(grouped)) {
            md += `## ${type} (${items.length})
`;
            items.forEach(e => {
                md += `### ${e.name}
${e.desc || '无描述'}
`;
                if(e.relations && e.relations.length) md += `关联: ${e.relations.join(', ')}
`;
                if(e.updatedAt) md += `更新: ${new Date(e.updatedAt).toLocaleString('zh-CN')}
`;
                md += '
';
            });
        }
        if(typeof ContextHelper !== 'undefined') ContextHelper.exportToLibrary('知识图谱_' + new Date().toLocaleTimeString(), md);
        UI.toast('已导出到阅读库');
    },

    // ═══ 向量数据库 ═══
    _refreshVectors: async () => {
        const vecs = await DB.getAll('vectors') || [];
        const el = document.getElementById('we-vec-list');
        const countEl = document.getElementById('we-vec-count');
        if(countEl) countEl.textContent = vecs.length;
        if(!el) return;
        el.innerHTML = vecs.length ? vecs.map(v => `
            <div class=
```

## AIP075 ? (???) ? line 1918 ? string ? 98 chars

```text
>${v.vector ? v.vector.length : '?'}d</span>
            </div>
        `).join('') : '<div class=
```

## AIP076 ? (???) ? line 1920 ? string ? 4440 chars

```text
>向量库为空</div>';
    },
    _clearAllVectors: async () => {
        if(!confirm('确定清空全部向量数据？此操作不可恢复。')) return;
        const vecs = await DB.getAll('vectors') || [];
        for(const v of vecs) { try { await DB.del('vectors', v.id); } catch(e) {} }
        Modules.world_engine._refreshVectors();
        UI.toast('向量数据库已清空');
    },

    // ═══ 一键清空 — 修复: 彻底清空所有实体+世界观+向量 ═══
    _clearAllEntities: async () => {
        if(!confirm('确定清空全部实体和世界观数据？此操作不可恢复。')) return;
        const entities = await DB.getAll('entities') || [];
        // ★ 清空所有实体，包括世界观(world_开头的)
        for(const e of entities) {
            try { await DB.del('entities', e.id); } catch(err) {}
            try { await DB.del('vectors', e.id); } catch(err) {}
        }
        Modules.world_engine.cur = null;
        Modules.world_engine._cachedEntities = null;
        const n = document.getElementById('we-ent-name'); if(n) n.value = '';
        const d = document.getElementById('we-ent-desc'); if(d) d.value = '';
        const r = document.getElementById('we-ent-relations'); if(r) r.value = '';
        const badge = document.getElementById('we-ent-source-badge'); if(badge) badge.innerHTML = '';
        Modules.world_engine._refreshEntities();
        // 如果在图谱页面，也刷新图谱
        if(Modules.world_engine.currentTab === 'graph') {
            setTimeout(() => Modules.world_engine._initGraph(), 100);
        }
        UI.toast('全部实体和世界观已清空');
    },

    // ═══ 导出全部设定 ═══
    exportAll: async () => {
        const we = Modules.world_engine;
        await we._ensureCache();
        const entities = (we._cachedEntities || []).filter(e => !e.id.startsWith('world_'));
        const worlds = (we._cachedEntities || []).filter(e => e.id.startsWith('world_') && e.desc);
        const catLabels = {history:'历史与传说',geography:'地理与地貌',magic:'魔法/科技体系',factions:'势力与组织',species:'种族与生物',rules:'世界规则',culture:'文化与习俗'};
        let md = '# 世界引擎 — 全部设定导出

';
        md += `导出时间: ${new Date().toLocaleString()}

`;
        if(worlds.length) {
            md += '---
## 世界观设定

';
            worlds.forEach(w => {
                const cat = w.id.replace('world_', '');
                md += `### ${catLabels[cat] || cat}
${w.desc}
`;
                if(w.updatedAt) md += `> 更新: ${new Date(w.updatedAt).toLocaleString('zh-CN')}
`;
                md += '
';
            });
        }
        if(entities.length) {
            md += '---
## 实体库

';
            const grouped = {};
            entities.forEach(e => { const t = e.type || '其他'; if(!grouped[t]) grouped[t] = []; grouped[t].push(e); });
            for(const [type, items] of Object.entries(grouped)) {
                md += `### ${type} (${items.length})
`;
                items.forEach(e => {
                    md += `#### ${e.name}
${e.desc || '无描述'}
`;
                    if(e.relations && e.relations.length) md += `> 关联: ${e.relations.join(', ')}
`;
                    md += `> 来源: ${e.source || 'manual'}`;
                    if(e.updatedAt) md += ` | 更新: ${new Date(e.updatedAt).toLocaleString('zh-CN')}`;
                    md += '

';
                });
            }
        }
        const FB = Modules.fusion_book;
        if(FB) {
            const allPr = FB._allPipelineResults || {};
            const pr = FB._pipelineResults || {};
            const fusion = (allPr.fusion && allPr.fusion.trim()) ? allPr.fusion : (pr.fusion || '');
            if(fusion) md += '---
## 融合技法精华

' + fusion + '

';
        }
        if(typeof ContextHelper !== 'undefined') ContextHelper.exportToLibrary('世界引擎全部设定_' + new Date().toLocaleTimeString(), md);
        UI.toast('全部设定已导出到阅读库');
    },

    // ═══ 章节细化功能 ═══
    async _loadChapters() {
        const we = Modules.world_engine;
        try {
            const saved = await DB.get('settings', 'world_engine_chapters');
            if(saved && saved.chapters) {
                we._chapters = saved.chapters;
            }
        } catch(e) {
            we._chapters = [];
        }
        we._refreshChaptersList();
    },

    async _saveChapters() {
        const we = Modules.world_engine;
        await DB.put('settings', { id: 'world_engine_chapters', chapters: we._chapters });
    },

    _refreshChaptersList() {
        const we = Modules.world_engine;
        const el = document.getElementById('we-chapter-list');
        if(!el) return;
        
        if(we._chapters.length === 0) {
            el.innerHTML = '<div class=
```

## AIP077 ? (???) ? line 2031 ? string ? 98 chars

```text
>${c.number ? `第${c.number}章` : '章节'}: ${c.title || '未命名'}</span>
                    <span class=
```

## AIP078 ? (???) ? line 2032 ? string ? 2038 chars

```text
>${c.updatedAt ? new Date(c.updatedAt).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}) : ''}</span>
                </button>
            `).join('');
    },

    _addChapter() {
        const we = Modules.world_engine;
        const id = Utils.uuid();
        const newChapter = {
            id,
            title: '',
            number: we._chapters.length + 1,
            outline: '',
            entities: [],
            notes: '',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        we._chapters.unshift(newChapter);
        we._currentChapter = id;
        we._loadChapter(id);
        we._saveChapters();
        UI.toast('已添加新章节');
    },

    _loadChapter(id) {
        const we = Modules.world_engine;
        const chapter = we._chapters.find(c => c.id === id);
        if(!chapter) return;
        
        we._currentChapter = id;
        
        const titleEl = document.getElementById('we-chapter-title');
        const numberEl = document.getElementById('we-chapter-number');
        const outlineEl = document.getElementById('we-chapter-outline');
        const entitiesEl = document.getElementById('we-chapter-entities');
        const notesEl = document.getElementById('we-chapter-notes');
        
        if(titleEl) titleEl.value = chapter.title || '';
        if(numberEl) numberEl.value = chapter.number || '';
        if(outlineEl) outlineEl.value = chapter.outline || '';
        if(entitiesEl) entitiesEl.value = (chapter.entities || []).join(', ');
        if(notesEl) notesEl.value = chapter.notes || '';
        
        we._refreshChapterEntityPreview(chapter.entities || []);
        we._refreshChaptersList();
    },

    _refreshChapterEntityPreview(entityNames) {
        const we = Modules.world_engine;
        const previewEl = document.getElementById('we-chapter-entity-preview');
        if(!previewEl) return;
        
        if(!entityNames || !entityNames.length) {
            previewEl.innerHTML = '<span class=
```

## AIP079 ? (???) ? line 2113 ? string ? 11074 chars

```text
></i>${e.name}
            </span>`;
        }).join('');
    },

    async _syncChapterEntities() {
        const we = Modules.world_engine;
        if(!we._currentChapter) {
            UI.toast('请先选择一个章节');
            return;
        }
        
        const chapter = we._chapters.find(c => c.id === we._currentChapter);
        if(!chapter) return;
        
        const entitiesEl = document.getElementById('we-chapter-entities');
        const entityNames = entitiesEl ? entitiesEl.value.split(',').map(s => s.trim()).filter(Boolean) : [];
        
        if(!entityNames.length) {
            UI.toast('请先输入实体名称');
            return;
        }
        
        await we._ensureCache();
        const entities = (we._cachedEntities || []).filter(e => !e.id.startsWith('world_'));
        let syncCount = 0;
        
        for(const name of entityNames) {
            const entity = entities.find(e => e.name === name || e.name.includes(name) || name.includes(e.name));
            if(entity) {
                if(!entity.chapters) entity.chapters = [];
                if(!entity.chapters.includes(we._currentChapter)) {
                    entity.chapters.push(we._currentChapter);
                    entity.updatedAt = Date.now();
                    await DB.put('entities', entity);
                    syncCount++;
                }
            }
        }
        
        we._cachedEntities = null;
        we._refreshChapterEntityPreview(entityNames);
        UI.toast(`已同步 ${syncCount} 个实体的章节关联`);
    },

    async _saveChapter() {
        const we = Modules.world_engine;
        if(!we._currentChapter) {
            UI.toast('请先选择或创建一个章节');
            return;
        }
        
        const chapter = we._chapters.find(c => c.id === we._currentChapter);
        if(!chapter) return;
        
        const titleEl = document.getElementById('we-chapter-title');
        const numberEl = document.getElementById('we-chapter-number');
        const outlineEl = document.getElementById('we-chapter-outline');
        const entitiesEl = document.getElementById('we-chapter-entities');
        const notesEl = document.getElementById('we-chapter-notes');
        
        if(titleEl) chapter.title = titleEl.value;
        if(numberEl) chapter.number = parseInt(numberEl.value) || 0;
        if(outlineEl) chapter.outline = outlineEl.value;
        if(entitiesEl) chapter.entities = entitiesEl.value.split(',').map(s => s.trim()).filter(Boolean);
        if(notesEl) chapter.notes = notesEl.value;
        
        chapter.updatedAt = Date.now();
        
        await we._saveChapters();
        we._refreshChaptersList();
        UI.toast('章节已保存');
    },

    async _deleteChapter() {
        const we = Modules.world_engine;
        if(!we._currentChapter) {
            UI.toast('请先选择一个章节');
            return;
        }
        if(!confirm('确定删除此章节？')) return;
        
        we._chapters = we._chapters.filter(c => c.id !== we._currentChapter);
        we._currentChapter = null;
        
        const titleEl = document.getElementById('we-chapter-title');
        const numberEl = document.getElementById('we-chapter-number');
        const outlineEl = document.getElementById('we-chapter-outline');
        const entitiesEl = document.getElementById('we-chapter-entities');
        const notesEl = document.getElementById('we-chapter-notes');
        
        if(titleEl) titleEl.value = '';
        if(numberEl) numberEl.value = '';
        if(outlineEl) outlineEl.value = '';
        if(entitiesEl) entitiesEl.value = '';
        if(notesEl) notesEl.value = '';
        
        await we._saveChapters();
        we._refreshChaptersList();
        UI.toast('章节已删除');
    },

    async _clearAllChapters() {
        const we = Modules.world_engine;
        if(!confirm('确定清空所有章节？此操作不可恢复。')) return;
        
        we._chapters = [];
        we._currentChapter = null;
        
        const titleEl = document.getElementById('we-chapter-title');
        const numberEl = document.getElementById('we-chapter-number');
        const outlineEl = document.getElementById('we-chapter-outline');
        const entitiesEl = document.getElementById('we-chapter-entities');
        const notesEl = document.getElementById('we-chapter-notes');
        
        if(titleEl) titleEl.value = '';
        if(numberEl) numberEl.value = '';
        if(outlineEl) outlineEl.value = '';
        if(entitiesEl) entitiesEl.value = '';
        if(notesEl) notesEl.value = '';
        
        await we._saveChapters();
        we._refreshChaptersList();
        UI.toast('所有章节已清空');
    },

    async _aiGenChapterOutline() {
        const we = Modules.world_engine;
        if(!we._currentChapter) {
            UI.toast('请先选择或创建一个章节');
            return;
        }
        
        const chapter = we._chapters.find(c => c.id === we._currentChapter);
        if(!chapter) return;
        
        await we._ensureCache();
        const entities = (we._cachedEntities || []).filter(e => !e.id.startsWith('world_'));
        const worlds = (we._cachedEntities || []).filter(e => e.id.startsWith('world_') && e.desc);
        
        let refCtx = '';
        if(entities.length) {
            refCtx += '
【已有实体参考】
' + entities.slice(0, 10).map(e => `${e.type}·${e.name}: ${(e.desc||'').slice(0,80)}`).join('
');
        }
        if(worlds.length) {
            const catLabels = {history:'历史与传说',geography:'地理与地貌',magic:'魔法/科技体系',factions:'势力与组织',species:'种族与生物',rules:'世界规则',culture:'文化与习俗'};
            refCtx += '
【世界观设定参考】
' + worlds.slice(0, 3).map(w => {
                const cat = w.id.replace('world_', '');
                return `${catLabels[cat]||cat}: ${(w.desc||'').slice(0,150)}`;
            }).join('
');
        }
        
        const FB = Modules.fusion_book;
        if(FB) {
            const allPr = FB._allPipelineResults || {};
            const pr = FB._pipelineResults || {};
            const fusion = (allPr.fusion && allPr.fusion.trim()) ? allPr.fusion : (pr.fusion || '');
            if(fusion) refCtx += '
【融合技法参考】
' + fusion.slice(0, 1500);
        }
        
        const prompt = `请为以下小说章节生成详细的写作细纲：
章节标题：${chapter.title || '待定'}
章节序号：第${chapter.number || '?'}章
已有细纲：${chapter.outline || '无'}
${refCtx}

【要求】
1. 情节脉络清晰，有起承转合
2. 明确关键事件和转折点
3. 规划人物出场和互动
4. 标注情感节奏和氛围营造
5. 与世界观和已有实体相结合
6. 字数约500-800字`;

        const outlineEl = document.getElementById('we-chapter-outline');
        if(outlineEl) outlineEl.value = '生成中...';
        
        let fullRes = '';
        await AI.generate(prompt, {}, c => { 
            fullRes += c; 
            if(outlineEl) outlineEl.value = fullRes; 
        });
        
        UI.toast('AI 细纲生成完成');
    },

    async _extractChapterEntities() {
        const we = Modules.world_engine;
        if(!we._currentChapter) {
            UI.toast('请先选择一个章节');
            return;
        }
        
        const outlineEl = document.getElementById('we-chapter-outline');
        const entitiesEl = document.getElementById('we-chapter-entities');
        if(!outlineEl || !outlineEl.value) {
            UI.toast('请先填写章节细纲');
            return;
        }
        
        await we._ensureCache();
        const existingEntities = (we._cachedEntities || []).filter(e => !e.id.startsWith('world_'));
        const existingNames = existingEntities.map(e => e.name);
        
        const prompt = `请从以下章节细纲中提取涉及的实体名称，只返回实体名称列表，用逗号分隔：
【章节细纲】
${outlineEl.value}

【已有实体库（请尽可能匹配这些名称）】
${existingNames.join('、') || '无'}

只返回实体名称，用逗号分隔，不要其他内容。`;

        UI.toast('正在提取实体...');
        let fullRes = '';
        await AI.generate(prompt, {}, c => { fullRes += c; });
        
        const extractedNames = fullRes.split(/[,，
]/).map(s => s.trim()).filter(Boolean);
        if(entitiesEl) entitiesEl.value = extractedNames.join(', ');
        
        UI.toast(`已提取 ${extractedNames.length} 个实体`);
    },

    async _injectChapterToPhoenix() {
        const we = Modules.world_engine;
        if(!we._currentChapter) {
            UI.toast('请先选择一个章节');
            return;
        }
        
        const chapter = we._chapters.find(c => c.id === we._currentChapter);
        if(!chapter) return;
        
        let injectContent = `【章节细化】
`;
        injectContent += `章节：第${chapter.number || '?'}章 ${chapter.title || '未命名'}

`;
        if(chapter.outline) injectContent += `【细纲】
${chapter.outline}

`;
        if(chapter.entities && chapter.entities.length) injectContent += `【关联实体】
${chapter.entities.join('、')}

`;
        if(chapter.notes) injectContent += `【备注】
${chapter.notes}

`;
        
        if(Modules.phoenix) {
            Modules.phoenix.data = Modules.phoenix.data || {};
            Modules.phoenix.data.worldContext = (Modules.phoenix.data.worldContext || '') + '
' + injectContent;
            UI.toast('章节已注入凤凰创作流');
        } else {
            UI.toast('凤凰创作流未加载');
        }
    },

    async _injectChapterToWriter() {
        const we = Modules.world_engine;
        if(!we._currentChapter) {
            UI.toast('请先选择一个章节');
            return;
        }
        
        const chapter = we._chapters.find(c => c.id === we._currentChapter);
        if(!chapter) return;
        
        let injectContent = `【章节细化】
`;
        injectContent += `章节：第${chapter.number || '?'}章 ${chapter.title || '未命名'}

`;
        if(chapter.outline) injectContent += `【细纲】
${chapter.outline}

`;
        if(chapter.entities && chapter.entities.length) injectContent += `【关联实体】
${chapter.entities.join('、')}

`;
        if(chapter.notes) injectContent += `【备注】
${chapter.notes}

`;
        
        const ol = document.getElementById('w-outline');
        if(ol) {
            ol.value = (ol.value ? ol.value + '

' : '') + injectContent;
            UI.toast('章节已注入执笔台');
        } else {
            UI.toast('请先打开执笔台');
        }
    },

    // ═══════════════════════════════════════════════════════════════
    // 世界观导入解析系统 - 支持外部设定文件导入并解析到世界引擎
    // ═══════════════════════════════════════════════════════════════
    _importModalOpen: false,
    _importPreview: null,
    _importParsed: null,

    _openImportModal() {
        const we = Modules.world_engine;
        we._importModalOpen = true;
        we._importPreview = null;
        we._importParsed = null;
        we._renderImportModal();
    },

    _closeImportModal() {
        const we = Modules.world_engine;
        we._importModalOpen = false;
        const modal = document.getElementById('we-import-modal');
        if(modal) modal.remove();
    },

    _renderImportModal() {
        const we = Modules.world_engine;
        let modal = document.getElementById('we-import-modal');
        if(!modal) {
            modal = document.createElement('div');
            modal.id = 'we-import-modal';
            document.body.appendChild(modal);
        }
        modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm';
        modal.onclick = (e) => { if(e.target === modal) we._closeImportModal(); };
        modal.innerHTML = `
            <div class=
```

## AIP080 ? (???) ? line 2518 ? string ? 176 chars

```text
>第${c.number||'?'}章: ${c.title||'未命名'}</option>`).join('')}
                                </select>
                            </div>
                            <div class=
```

## AIP081 ? (???) ? line 2598 ? string ? 761 chars

```text
>${w.content.slice(0, 200)}${w.content.length > 200 ? '...' : ''}</div>
                </div>`;
            });
            html += `</div></div>`;
        }
        
        if(parsed.entities.length) {
            const typeColors = {
                '人物': 'yellow', '物品': 'blue', '地点': 'green', '情节': 'red',
                '伏笔': 'purple', '势力': 'rose', '种族': 'orange', '魔法': 'indigo',
                '规则': 'sky', '文化': 'pink', '历史': 'amber', '技法': 'teal'
            };
            const grouped = {};
            parsed.entities.forEach(e => {
                const t = e.type || '其他';
                if(!grouped[t]) grouped[t] = [];
                grouped[t].push(e);
            });
            
            html += `<div>
                <div class=
```

## AIP082 ? (???) ? line 2625 ? string ? 9443 chars

```text
>${e.name}</span>`).join('')}
                    </div>
                </div>`;
            }
            html += `</div></div>`;
        }
        
        if(previewEl) previewEl.innerHTML = html;
        UI.toast('解析完成');
    },

    _parseWorldSetting(content) {
        const we = Modules.world_engine;
        const result = { worldViews: [], entities: [] };
        
        const catPatterns = [
            { id: 'history', patterns: ['历史与传说', '历史', '传说', '历史背景', '历史设定'] },
            { id: 'geography', patterns: ['地理与地貌', '地理', '地貌', '世界地图', '地理设定'] },
            { id: 'magic', patterns: ['魔法/科技体系', '魔法体系', '科技体系', '魔法', '功法体系', '修炼体系'] },
            { id: 'factions', patterns: ['势力与组织', '势力', '组织', '门派', '势力设定'] },
            { id: 'species', patterns: ['种族与生物', '种族', '生物', '种族设定'] },
            { id: 'rules', patterns: ['世界规则', '规则', '法则', '世界法则'] },
            { id: 'culture', patterns: ['文化与习俗', '文化', '习俗', '风俗'] }
        ];
        
        const catLabels = {
            history: '历史与传说', geography: '地理与地貌', magic: '魔法/科技体系',
            factions: '势力与组织', species: '种族与生物', rules: '世界规则', culture: '文化与习俗'
        };
        
        for(const cat of catPatterns) {
            for(const pattern of cat.patterns) {
                const regex = new RegExp(`[【\\[]${pattern}[】\\]][\\s\\S]*?(?=[【\\[](?:${catPatterns.flatMap(c => c.patterns).join('|')})[】\\]]|$)`, 'gi');
                const match = content.match(regex);
                if(match) {
                    let text = match[0].replace(new RegExp(`[【\\[]${pattern}[】\\]]`, 'i'), '').trim();
                    if(text && text.length > 10) {
                        result.worldViews.push({
                            id: cat.id,
                            label: catLabels[cat.id],
                            content: text
                        });
                        break;
                    }
                }
            }
        }
        
        const entityPatterns = [
            { type: '人物', patterns: ['人物', '角色', '人物设定', '角色设定'] },
            { type: '物品', patterns: ['物品', '道具', '装备', '物品设定'] },
            { type: '地点', patterns: ['地点', '场景', '地点设定', '场景设定'] },
            { type: '情节', patterns: ['情节', '剧情', '情节设定'] },
            { type: '伏笔', patterns: ['伏笔', '伏笔设定'] },
            { type: '势力', patterns: ['势力', '组织', '门派'] },
            { type: '种族', patterns: ['种族', '种族设定'] },
            { type: '魔法', patterns: ['魔法', '功法', '技能', '法术'] },
            { type: '规则', patterns: ['规则', '法则'] },
            { type: '文化', patterns: ['文化', '习俗'] },
            { type: '历史', patterns: ['历史事件', '历史记录'] },
            { type: '技法', patterns: ['技法', '写作技法'] }
        ];
        
        const entityRegex = /(?:^|\n)[【\[]?([^\n【\】\[\]]+)[】\]]?\s*[\n:：]\s*([\s\S]*?)(?=(?:^|\n)[【\[]?[^\n【\】\[\]]+[】\]]?\s*[\n:：]|$)/g;
        let entityMatch;
        while((entityMatch = entityRegex.exec(content)) !== null) {
            const name = entityMatch[1].trim();
            const desc = entityMatch[2].trim();
            
            if(name.length > 20 || desc.length < 5) continue;
            
            let type = '其他';
            for(const ep of entityPatterns) {
                for(const p of ep.patterns) {
                    if(name.includes(p) || content.slice(entityMatch.index - 50, entityMatch.index).includes(p)) {
                        type = ep.type;
                        break;
                    }
                }
                if(type !== '其他') break;
            }
            
            if(desc.length > 10) {
                result.entities.push({
                    id: Utils.uuid(),
                    name: name.replace(/^[【\[]?([^】\]]+)[】\]]?$/, '$1'),
                    type,
                    desc,
                    relations: [],
                    source: 'import',
                    createdAt: Date.now()
                });
            }
        }
        
        const simpleEntityRegex = /(?:^|\n)\[([^\]]+)\]\s*([^\n]+)/g;
        let simpleMatch;
        while((simpleMatch = simpleEntityRegex.exec(content)) !== null) {
            const typeStr = simpleMatch[1].trim();
            const rest = simpleMatch[2].trim();
            
            let type = '其他';
            for(const ep of entityPatterns) {
                if(ep.patterns.some(p => typeStr.includes(p))) {
                    type = ep.type;
                    break;
                }
            }
            
            const nameDesc = rest.split(/[:：]/);
            const name = nameDesc[0].trim();
            const desc = nameDesc.slice(1).join(':').trim() || rest;
            
            if(name.length > 0 && name.length < 30 && !result.entities.find(e => e.name === name)) {
                result.entities.push({
                    id: Utils.uuid(),
                    name,
                    type,
                    desc,
                    relations: [],
                    source: 'import',
                    createdAt: Date.now()
                });
            }
        }
        
        return result;
    },

    async _confirmImport() {
        const we = Modules.world_engine;
        if(!we._importParsed || (!we._importParsed.worldViews.length && !we._importParsed.entities.length)) {
            UI.toast('没有可导入的内容');
            return;
        }
        
        const mergeEl = document.getElementById('we-import-merge');
        const toVectorsEl = document.getElementById('we-import-to-vectors');
        const chapterEl = document.getElementById('we-import-chapter');
        const shouldMerge = mergeEl ? mergeEl.checked : true;
        const toVectors = toVectorsEl ? toVectorsEl.checked : true;
        const assignChapter = chapterEl ? chapterEl.value : '';
        
        await we._ensureCache();
        
        let worldCount = 0;
        let entityCount = 0;
        
        for(const wv of we._importParsed.worldViews) {
            const existingId = `world_${wv.id}`;
            if(shouldMerge) {
                const existing = we._cachedEntities.find(e => e.id === existingId);
                if(existing) {
                    existing.desc = (existing.desc || '') + '\n\n' + wv.content;
                    existing.updatedAt = Date.now();
                    await DB.put('entities', existing);
                    worldCount++;
                    continue;
                }
            }
            
            const worldEntity = {
                id: existingId,
                name: wv.label,
                type: '世界观',
                desc: wv.content,
                relations: [],
                chapters: assignChapter ? [assignChapter] : [],
                source: 'import',
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            we._cachedEntities.push(worldEntity);
            await DB.put('entities', worldEntity);
            worldCount++;
        }
        
        for(const ent of we._importParsed.entities) {
            if(shouldMerge) {
                const existing = we._cachedEntities.find(e => e.name === ent.name && !e.id.startsWith('world_'));
                if(existing) {
                    existing.desc = (existing.desc || '') + '\n\n' + ent.desc;
                    existing.updatedAt = Date.now();
                    if(assignChapter) {
                        if(!existing.chapters) existing.chapters = [];
                        if(!existing.chapters.includes(assignChapter)) existing.chapters.push(assignChapter);
                    }
                    await DB.put('entities', existing);
                    entityCount++;
                    continue;
                }
            }
            
            if(assignChapter) {
                ent.chapters = [assignChapter];
            }
            we._cachedEntities.push(ent);
            await DB.put('entities', ent);
            entityCount++;
        }
        
        if(toVectors && typeof Modules.rag !== 'undefined') {
            for(const ent of we._importParsed.entities) {
                try {
                    await Modules.rag.addVector(ent.name + ': ' + ent.desc, { type: ent.type, source: 'world_import' });
                } catch(e) {}
            }
        }
        
        we._closeImportModal();
        we._refreshEntities();
        
        UI.toast(`导入完成: ${worldCount}项世界观, ${entityCount}个实体` + (assignChapter ? ' (已分配章节)' : ''));
    },

    async _aiParseImportContent() {
        const we = Modules.world_engine;
        const sourceEl = document.getElementById('we-import-source');
        if(!sourceEl || !sourceEl.value.trim()) {
            UI.toast('请先输入或导入内容');
            return;
        }
        
        const content = sourceEl.value;
        UI.toast('AI智能解析中...');
        
        await we._ensureCache();
        const existingEntities = (we._cachedEntities || []).filter(e => !e.id.startsWith('world_'));
        const existingNames = existingEntities.map(e => e.name);
        
        const prompt = `你是一个专业的小说世界观解析引擎。请从以下内容中提取结构化的世界观设定和实体。

【原始内容】
${content.slice(0, 8000)}

【已有实体库（请尽可能匹配这些名称建立关联）】
${existingNames.join('、') || '无'}

【提取要求】
请提取以下内容：

1. 世界观设定（7个维度）：
   - history (历史与传说)
   - geography (地理与地貌)
   - magic (魔法/科技体系)
   - factions (势力与组织)
   - species (种族与生物)
   - rules (世界规则)
   - culture (文化与习俗)

2. 实体（12种类型）：
   - 人物、物品、地点、情节、伏笔、势力、种族、魔法、规则、文化、历史、技法

【输出格式】严格JSON：
{
```

## AIP083 ? (???) ? line 2884 ? string ? 2053 chars

```text
]}
  ]
}

【关键要求】
- 每个实体的relations必须尽可能多地引用其他实体名称
- 关系类型例如：师父、徒弟、敌对、盟友、所属、位于、拥有、使用等
- 直接输出JSON，不要包裹markdown代码块`;

        let fullRes = '';
        await AI.generate(prompt, {}, c => { fullRes += c; });
        
        let parsed = null;
        try {
            let cleanRes = fullRes.trim();
            cleanRes = cleanRes.replace(/^???(?:json)?\s*\n?/i, '').replace(/\n????\s*$/, '').trim();
            const s = cleanRes.indexOf('{');
            const e = cleanRes.lastIndexOf('}');
            if(s !== -1 && e > s) {
                parsed = JSON.parse(cleanRes.slice(s, e + 1));
            }
        } catch(e) {
            UI.toast('AI解析失败，请检查内容格式');
            return;
        }
        
        if(!parsed || (!parsed.worldViews?.length && !parsed.entities?.length)) {
            UI.toast('未能解析出有效内容');
            return;
        }
        
        // 标准化数据
        const result = {
            worldViews: (parsed.worldViews || []).map(w => ({
                id: w.id || 'other',
                label: w.label || w.id || '其他',
                content: w.content || ''
            })),
            entities: (parsed.entities || []).map(e => ({
                id: Utils.uuid(),
                name: e.name || '',
                type: e.type || '其他',
                desc: e.desc || e.description || '',
                relations: e.relations || [],
                source: 'import',
                createdAt: Date.now()
            }))
        };
        
        we._importParsed = result;
        
        const previewEl = document.getElementById('we-import-preview');
        const statsEl = document.getElementById('we-import-stats');
        
        let statsText = [];
        if(result.worldViews.length) statsText.push(`世界观: ${result.worldViews.length}项`);
        if(result.entities.length) statsText.push(`实体: ${result.entities.length}个`);
        if(statsEl) statsEl.textContent = statsText.join(' | ');
        
        let html = '';
        
        if(result.worldViews.length) {
            html += `<div class=
```

## AIP084 ? (???) ? line 2952 ? string ? 761 chars

```text
>${w.content.slice(0, 200)}${w.content.length > 200 ? '...' : ''}</div>
                </div>`;
            });
            html += `</div></div>`;
        }
        
        if(result.entities.length) {
            const typeColors = {
                '人物': 'yellow', '物品': 'blue', '地点': 'green', '情节': 'red',
                '伏笔': 'purple', '势力': 'rose', '种族': 'orange', '魔法': 'indigo',
                '规则': 'sky', '文化': 'pink', '历史': 'amber', '技法': 'teal'
            };
            const grouped = {};
            result.entities.forEach(e => {
                const t = e.type || '其他';
                if(!grouped[t]) grouped[t] = [];
                grouped[t].push(e);
            });
            
            html += `<div>
                <div class=
```

## AIP085 ? (???) ? line 2979 ? string ? 1673 chars

```text
>${e.name}</span>`).join('')}
                    </div>
                </div>`;
            }
            html += `</div></div>`;
        }
        
        if(previewEl) previewEl.innerHTML = html;
        UI.toast('AI智能解析完成');
    },

    // ═══════════════════════════════════════════════════════════════
    //  作品导入中心 — 外部已有小说导入 + 双向同步桥
    // ═══════════════════════════════════════════════════════════════

    _novelImportModalOpen: false,
    _novelImportText: '',
    _novelImportParsed: null,

    _openNovelImportModal() {
        const we = Modules.world_engine;
        we._novelImportModalOpen = true;
        we._novelImportText = '';
        we._novelImportParsed = null;
        we._renderNovelImportModal();
    },

    _closeNovelImportModal() {
        const we = Modules.world_engine;
        we._novelImportModalOpen = false;
        const modal = document.getElementById('we-novel-import-modal');
        if(modal) modal.remove();
    },

    _renderNovelImportModal() {
        const we = Modules.world_engine;
        let modal = document.getElementById('we-novel-import-modal');
        if(!modal) {
            modal = document.createElement('div');
            modal.id = 'we-novel-import-modal';
            document.body.appendChild(modal);
        }
        modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm';
        modal.onclick = (e) => { if(e.target === modal) we._closeNovelImportModal(); };

        const hasParsed = we._novelImportParsed && (we._novelImportParsed.volumes?.length || we._novelImportParsed.entities?.length);

        modal.innerHTML = `
            <div class=
```

## AIP086 ? (???) ? line 3087 ? string ? 277 chars

```text
>${hasParsed ? we._novelImportParsed.volumes.length + ' 卷 / ' + we._novelImportParsed.chapters.length + ' 章 / ' + we._novelImportParsed.entities.length + ' 实体' : '等待解析'}</div>
                            </div>
                        </div>
                        <div class=
```

## AIP087 ? (???) ? line 3090 ? string ? 118 chars

```text
>
                            ${hasParsed ? we._renderNovelImportPreview() : `
                            <div class=
```

## AIP088 ? _renderNovelImportPreview() ? line 3111 ? string ? 85 chars

```text
>';
        // 卷/章概览
        if(p.volumes?.length) {
            html += `<div class=
```

## AIP089 ? if() ? line 3115 ? string ? 224 chars

```text
>📚 卷章结构 (${p.volumes.length}卷 / ${p.chapters?.length||0}章)</div>`;
            p.volumes.forEach(v => {
                const vchaps = p.chapters?.filter(c => c.volumeId === v.id) || [];
                html += `<div class=
```

## AIP090 ? (???) ? line 3132 ? string ? 351 chars

```text
>${wvLabels[k]||k}:</span> ${String(v).slice(0,80)}${String(v).length>80?'...':''}</div>`;
            });
            html += '</div>';
        }
        // 实体
        if(p.entities?.length) {
            const grouped = {};
            p.entities.forEach(e => { grouped[e.type] = (grouped[e.type]||[]).concat(e); });
            html += `<div class=
```

## AIP091 ? (???) ? line 3144 ? string ? 3693 chars

```text
>${type}:${items.length}</span>`;
            });
            html += '</div></div>';
        }
        html += '</div>';
        return html;
    },

    async _handleNovelImportFile(input) {
        const file = input.files[0];
        if(!file) return;
        const text = await file.text();
        const sourceEl = document.getElementById('we-novel-import-source');
        if(sourceEl) sourceEl.value = text;
        UI.toast(`已加载文件: ${file.name} (${text.length.toLocaleString()}字)`);
    },

    async _pasteNovelFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            const sourceEl = document.getElementById('we-novel-import-source');
            if(sourceEl) sourceEl.value = text;
            UI.toast(`已粘贴剪贴板内容 (${text.length.toLocaleString()}字)`);
        } catch(e) { UI.toast('无法访问剪贴板'); }
    },

    async _startNovelImport() {
        const we = Modules.world_engine;
        const sourceEl = document.getElementById('we-novel-import-source');
        if(!sourceEl || !sourceEl.value.trim()) { UI.toast('请先输入或导入小说内容'); return; }

        const text = sourceEl.value.trim();
        const merge = document.getElementById('we-novel-import-merge')?.checked;

        // 超长文本分块保护
        const MAX_CHARS_PER_CHUNK = 8000;
        let chunks = [];
        if(text.length <= MAX_CHARS_PER_CHUNK * 1.5) {
            chunks = [text];
        } else {
            // 按段落分块，尽量保持章节完整
            const paras = text.split(/
{2,}/);
            let cur = '';
            for(const p of paras) {
                if(cur.length + p.length > MAX_CHARS_PER_CHUNK && cur.length > 1000) {
                    chunks.push(cur);
                    cur = p;
                } else {
                    cur += '

' + p;
                }
            }
            if(cur) chunks.push(cur);
        }

        UI.toast(`开始解析，共 ${chunks.length} 个文本块...`);
        App.showProgress('AI解析小说结构', 0, chunks.length);

        try {
            // Step 1: 解析结构（用第一个chunk估计整体结构，如果有多个chunk则综合）
            const structure = await we._parseNovelStructure(text, chunks);
            App.showProgress('AI解析小说结构', 1, 3);

            // Step 2: 提取世界观与实体
            const extractEntities = document.getElementById('we-novel-import-extract-entities')?.checked !== false;
            let entities = [], worldview = {};
            if(extractEntities) {
                const extracted = await we._parseNovelEntities(text, structure.chapters);
                entities = extracted.entities || [];
                worldview = extracted.worldview || {};
                App.showProgress('提取实体与世界观', 2, 3);
            }

            // Step 3: 组装结果
            we._novelImportParsed = {
                volumes: structure.volumes || [],
                chapters: structure.chapters || [],
                entities,
                worldview,
                sourceText: text.slice(0, 500) + '...',
                importedAt: Date.now()
            };

            we._renderNovelImportModal();
            UI.toast(`解析完成: ${structure.volumes?.length||0}卷 / ${structure.chapters?.length||0}章 / ${entities.length}实体`, 'success');
        } catch(e) {
            console.error('小说导入解析失败:', e);
            UI.toast('解析失败: ' + e.message, 'error');
        } finally {
            App.hideProgress();
        }
    },

    async _parseNovelStructure(fullText, chunks) {
        // 先尝试规则分章（无需AI）
        const lines = fullText.split('
');
        const volumes = [];
        const chapters = [];
        let currentVol = null;
        let currentChap = null;
        let chapOrder = 1;
        let volOrder = 1;
        let chapContentLines = [];

        // 分章正则：支持
```

## AIP092 ? (???) ? line 3247 ? string ? 2071 chars

```text
等
        const chapRegex = /^(?:第[一二三四五六七八九十百千零\d]+[章回节]|Chapter\s+\d+[\.:\s]|\#{2,3}\s+)(.+)?$/i;
        const volRegex = /^(?:第[一二三四五六七八九十百千零\d]+[卷部篇]|Volume\s+\d+[\.:\s]|\#{2}\s+)(.+)?$/i;

        for(let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if(!line) continue;

            const volMatch = line.match(volRegex);
            const chapMatch = line.match(chapRegex);

            if(volMatch && !chapMatch) {
                // 保存上一章内容
                if(currentChap) {
                    currentChap.content = chapContentLines.join('\n').trim();
                    chapters.push(currentChap);
                    chapContentLines = [];
                }
                const volTitle = volMatch[1] ? volMatch[1].trim() : line;
                currentVol = { id: Utils.uuid(), title: volTitle, order: volOrder++ };
                volumes.push(currentVol);
            } else if(chapMatch) {
                // 保存上一章内容
                if(currentChap) {
                    currentChap.content = chapContentLines.join('\n').trim();
                    chapters.push(currentChap);
                    chapContentLines = [];
                }
                const chapTitle = chapMatch[1] ? chapMatch[1].trim() : line;
                currentChap = {
                    id: Utils.uuid(),
                    title: chapTitle,
                    order: chapOrder++,
                    volumeId: currentVol ? currentVol.id : null,
                    content: ''
                };
            } else if(currentChap) {
                chapContentLines.push(line);
            }
        }
        // 保存最后一章
        if(currentChap) {
            currentChap.content = chapContentLines.join('\n').trim();
            chapters.push(currentChap);
        }

        // 如果没有规则分章成功，尝试AI解析
        if(chapters.length === 0) {
            const sample = fullText.slice(0, Math.min(fullText.length, 12000));
            const prompt = `你是NEXUS OS v2.0小说结构解析引擎。请分析以下小说文本，识别其卷/章结构。\n\n要求输出严格JSON（不要markdown代码块，不要额外文字）：\n{\n
```

## AIP093 ? (???) ? line 3296 ? string ? 2847 chars

```text
:1}]\n}\n\n规则：\n1. 如果没有明显的卷，则 volumes 留空数组，所有章的 volumeOrder 为 1\n2. 章按自然顺序编号\n3. 只输出能明确识别的章节标题\n\n文本开头（前12000字）：\n${sample}`;

            let raw = '';
            try {
                await AI.generate(prompt, (chunk) => { raw += chunk; }, { max_tokens: 2000, temperature: 0.1 });
                const json = (() => { try { const m = raw.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : null; } catch(e) { return null; } })();
                if(json) {
                    if(json.volumes?.length) {
                        json.volumes.forEach((v, i) => { v.id = Utils.uuid(); v.order = i + 1; });
                        volumes.push(...json.volumes);
                    }
                    if(json.chapters?.length) {
                        json.chapters.forEach((c, i) => {
                            const vol = volumes.find(v => v.order === (c.volumeOrder || 1));
                            chapters.push({
                                id: Utils.uuid(), title: c.title, order: i + 1,
                                volumeId: vol ? vol.id : null, content: ''
                            });
                        });
                    }
                }
            } catch(e) { console.warn('AI结构解析失败，尝试段落分章:', e); }
        }

        // 仍然没有章节？按段落 fallback
        if(chapters.length === 0) {
            const paras = fullText.split(/\n{2,}/).filter(p => p.trim().length > 50);
            const volId = Utils.uuid();
            volumes.push({ id: volId, title: '导入作品', order: 1 });
            paras.forEach((p, i) => {
                chapters.push({
                    id: Utils.uuid(), title: `第${i+1}章`, order: i+1,
                    volumeId: volId, content: p.trim()
                });
            });
        }

        // 为每章填充内容（按规则分章时已有，AI分章时需要从原文提取）
        if(chapters.every(c => !c.content)) {
            // 简单按字数均分原文
            const avgLen = Math.floor(fullText.length / chapters.length);
            chapters.forEach((c, i) => {
                const start = i * avgLen;
                const end = (i === chapters.length - 1) ? fullText.length : (i + 1) * avgLen;
                c.content = fullText.slice(start, end).trim();
            });
        }

        return { volumes, chapters };
    },

    async _parseNovelEntities(fullText, chapters) {
        // 抽取代表性样本（前3章+中1章+后1章）用于实体提取
        const sampleChaps = [];
        if(chapters.length > 0) sampleChaps.push(chapters[0]);
        if(chapters.length > 2) sampleChaps.push(chapters[Math.floor(chapters.length/2)]);
        if(chapters.length > 1) sampleChaps.push(chapters[chapters.length-1]);

        const sampleText = sampleChaps.map(c => `【${c.title}】\n${(c.content||'').slice(0, 3000)}`).join('\n\n---\n\n');

        const prompt = `你是NEXUS OS v2.0实体提取引擎。请分析以下小说片段，提取世界观设定和关键实体。\n\n要求输出严格JSON（不要markdown代码块，不要额外文字）：\n{\n
```

## AIP094 ? (???) ? line 3356 ? string ? 9705 chars

```text
\n2. entities 最多提取30个最关键实体，优先主角、重要配角、核心物品、关键地点\n3. type 必须从给定的12种中选\n4. relations 可选，表示与其他实体的关系\n\n小说片段：\n${sampleText.slice(0, 10000)}`;

        let raw = '';
        try {
            await AI.generate(prompt, (chunk) => { raw += chunk; }, { max_tokens: 4000, temperature: 0.2 });
            const json = (() => { try { const m = raw.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : null; } catch(e) { return null; } })();
            if(json) {
                // 标准化实体
                const entities = (json.entities || []).map(e => ({
                    id: 'import_' + Utils.uuid(),
                    name: e.name || '未命名',
                    type: e.type || '人物',
                    desc: e.desc || '',
                    relations: e.relations || [],
                    chapters: [],
                    cycles: [],
                    source: 'import',
                    updatedAt: Date.now()
                }));
                return { entities, worldview: json.worldview || {} };
            }
        } catch(e) { console.warn('AI实体提取失败:', e); }
        return { entities: [], worldview: {} };
    },

    async _confirmNovelImport() {
        const we = Modules.world_engine;
        const data = we._novelImportParsed;
        if(!data || !data.chapters?.length) { UI.toast('没有可导入的数据'); return; }

        const merge = document.getElementById('we-novel-import-merge')?.checked;
        const buildCycles = document.getElementById('we-novel-import-build-cycles')?.checked !== false;

        // 如果不合并，先确认是否清空
        if(!merge) {
            const existing = await DB.getAll('chapters');
            if(existing.length > 0) {
                if(!confirm(`当前已有 ${existing.length} 个章节，导入将清空重建。确定继续？`)) return;
                // 清空相关数据
                for(const v of await DB.getAll('volumes')) await DB.del('volumes', v.id);
                for(const c of existing) await DB.del('chapters', c.id);
            }
        }

        App.showProgress('写入数据库', 0, data.chapters.length + data.entities.length + 5);

        try {
            // 1. 写入卷
            let progress = 0;
            for(const v of data.volumes) {
                await DB._rawPut('volumes', v);
                App.showProgress('写入数据库', ++progress, data.chapters.length + data.entities.length + 5);
            }

            // 2. 写入章节
            for(const c of data.chapters) {
                await DB._rawPut('chapters', c);
                App.showProgress('写入数据库', ++progress, data.chapters.length + data.entities.length + 5);
            }

            // 3. 写入世界观实体
            const wvLabels = {history:'历史与传说', geography:'地理与地貌', magic:'魔法/科技体系', factions:'势力与组织', species:'种族与生物', rules:'世界规则', culture:'文化与习俗'};
            for(const [key, desc] of Object.entries(data.worldview || {})) {
                if(!desc) continue;
                const ent = {
                    id: 'world_' + key,
                    name: wvLabels[key] || key,
                    type: 'world',
                    desc: String(desc),
                    category: key,
                    source: 'import',
                    updatedAt: Date.now()
                };
                await DB._rawPut('entities', ent);
                App.showProgress('写入数据库', ++progress, data.chapters.length + data.entities.length + 5);
            }

            // 4. 写入普通实体
            for(const e of data.entities || []) {
                // 去重检查
                const allEnts = await DB.getAll('entities');
                const existing = allEnts.find(ex => ex.name === e.name && ex.type === e.type);
                if(existing) {
                    // 合并描述
                    existing.desc = (existing.desc || '') + '\n\n[导入补充]\n' + e.desc;
                    existing.updatedAt = Date.now();
                    await DB._rawPut('entities', existing);
                } else {
                    await DB._rawPut('entities', e);
                }
                App.showProgress('写入数据库', ++progress, data.chapters.length + data.entities.length + 5);
            }

            // 5. 构建循环（每5章一个）
            if(buildCycles && data.chapters.length >= 3) {
                const cycleSize = 5;
                const numCycles = Math.ceil(data.chapters.length / cycleSize);
                for(let i = 0; i < numCycles; i++) {
                    const start = i * cycleSize + 1;
                    const end = Math.min((i + 1) * cycleSize, data.chapters.length);
                    const cycleChaps = data.chapters.filter(c => c.order >= start && c.order <= end);
                    await we.syncCycle({
                        id: `cycle_${start}_${end}`,
                        startChapter: start, endChapter: end, cycleNum: i + 1,
                        fusionEssence: `导入作品循环${i+1}：第${start}-${end}章`,
                        chapterIds: cycleChaps.map(c => c.id),
                        entityNames: (data.entities || []).slice(0, 10).map(e => e.name),
                        patterns: [],
                        nexusCHR: [], nexusWLD: [], nexusFOE: [], nexusEMO: [],
                        updatedAt: Date.now()
                    });
                }
            }

            // 6. 触发LocalSync
            ['volumes', 'chapters', 'entities', 'cycles'].forEach(s => LocalSync._scheduleWrite(s));

            // 7. 刷新缓存
            we._cachedEntities = null;
            we._cachedCycles = null;

            // 8. 通知writer刷新
            if(Modules.writer) {
                Modules.writer.loadTree();
                setTimeout(() => Modules.writer.loadTree(), 800);
            }

            App.hideProgress();
            we._closeNovelImportModal();
            UI.toast(`导入成功: ${data.volumes?.length||0}卷 / ${data.chapters.length}章 / ${data.entities?.length||0}实体`, 'success');

            // 提示用户下一步
            if(confirm('作品已导入成功！是否立即跳转到执笔台继续创作？')) {
                App.nav('writer');
            }
        } catch(e) {
            App.hideProgress();
            console.error('导入写入失败:', e);
            UI.toast('导入失败: ' + e.message, 'error');
        }
    },

    // ═══════════════════════════════════════════════════════════════
    //  双向同步桥：接收 writer 推送，更新世界引擎
    // ═══════════════════════════════════════════════════════════════

    async syncFromWriter(chapterData) {
        const we = Modules.world_engine;
        // chapterData: { chapterId, title, order, content, outline, extractedEntities? }
        if(!chapterData || !chapterData.chapterId) return;

        try {
            // 1. 刷新缓存
            await we._ensureCache();

            // 2. 更新实体关联
            if(chapterData.extractedEntities?.length) {
                for(const ent of chapterData.extractedEntities) {
                    const existing = (we._cachedEntities || []).find(e => e.name === ent.name && e.type === ent.type);
                    if(existing) {
                        // 更新关联章节
                        if(!existing.chapters) existing.chapters = [];
                        if(!existing.chapters.includes(chapterData.chapterId)) {
                            existing.chapters.push(chapterData.chapterId);
                        }
                        // 更新关联循环
                        const cycleInfo = we.getCycleIdForChapter(chapterData.order, 5);
                        if(cycleInfo && !existing.cycles?.includes(cycleInfo.id)) {
                            if(!existing.cycles) existing.cycles = [];
                            existing.cycles.push(cycleInfo.id);
                        }
                        existing.updatedAt = Date.now();
                        await DB.put('entities', existing);
                    } else {
                        // 新建实体
                        const newEnt = {
                            id: 'writer_sync_' + Utils.uuid(),
                            name: ent.name,
                            type: ent.type || '人物',
                            desc: ent.desc || '',
                            relations: ent.relations || [],
                            chapters: [chapterData.chapterId],
                            cycles: [],
                            source: 'writer_sync',
                            updatedAt: Date.now()
                        };
                        const cycleInfo = we.getCycleIdForChapter(chapterData.order, 5);
                        if(cycleInfo) newEnt.cycles = [cycleInfo.id];
                        await DB.put('entities', newEnt);
                    }
                }
            }

            // 3. 更新循环实体列表（如果这个章节属于某个循环）
            const cycleInfo = we.getCycleIdForChapter(chapterData.order, 5);
            if(cycleInfo) {
                await we._ensureCycleCache();
                const cycle = (we._cachedCycles || []).find(c => c.id === cycleInfo.id);
                if(cycle && chapterData.extractedEntities?.length) {
                    const newNames = chapterData.extractedEntities.map(e => e.name);
                    cycle.entityNames = [...new Set([...(cycle.entityNames||[]), ...newNames])];
                    cycle.updatedAt = Date.now();
                    await DB.put('cycles', cycle);
                }
            }

            // 4. 刷新缓存
            we._cachedEntities = null;
            we._cachedCycles = null;

            console.log('[WorldEngine] syncFromWriter OK:', chapterData.title);
        } catch(e) {
            console.error('[WorldEngine] syncFromWriter failed:', e);
        }
    },

    // ═══════════════════════════════════════════════════════════════
    //  仪表盘 — 世界引擎全景总览
    // ═══════════════════════════════════════════════════════════════

    _renderDashboard() {
        return `
        <div class=
```

## AIP095 ? (???) ? line 3684 ? string ? 2552 chars

```text
>加载中...</div>
                </div>
            </div>
        </div>`;
    },

    // ═══ 叙事一致性监控中心 — 数据刷新 ═══
    async _refreshNarrativeConsistency() {
        const we = Modules.world_engine;
        await we._ensureCache();

        const allEnts = we._cachedEntities || [];
        const pipelineEnts = allEnts.filter(e => e.source === 'pipeline' || e.source === 'world');
        const nonWorldEnts = pipelineEnts.filter(e => !e.id.startsWith('world_'));

        // 1. 统计卡片
        const entTotal = nonWorldEnts.length;
        const entBreakdown = {};
        nonWorldEnts.forEach(e => { entBreakdown[e.type || '其他'] = (entBreakdown[e.type || '其他'] || 0) + 1; });
        const breakdownText = Object.entries(entBreakdown).map(([t,c]) => `${t}:${c}`).join(' ');

        const elTotal = document.getElementById('we-cs-ent-total');
        const elBreak = document.getElementById('we-cs-ent-breakdown');
        if(elTotal) elTotal.textContent = entTotal;
        if(elBreak) elBreak.textContent = breakdownText || '暂无实体';

        // 2. 伏笔追踪（从 fusion_book 获取 + 世界引擎实体中的伏笔类型）
        const FB = Modules.fusion_book;
        let pendingFS = [], resolvedFS = [];
        if(FB) {
            const allOutlines = FB._allPipelineResults?.outline || '';
            const fsData = FB._extractForeshadowing ? FB._extractForeshadowing(allOutlines) : { pending: [], resolved: [] };
            pendingFS = fsData.pending || [];
            resolvedFS = fsData.resolved || [];
        }
        // 同时从实体库中查找伏笔类型实体
        const fsEntities = nonWorldEnts.filter(e => e.type === '伏笔');
        fsEntities.forEach(e => {
            const text = e.name + (e.desc ? ': ' + e.desc.slice(0, 80) : '');
            if(!pendingFS.includes(text) && !resolvedFS.includes(text)) pendingFS.push(text);
        });

        const elPending = document.getElementById('we-cs-pending-fs');
        const elResolved = document.getElementById('we-cs-resolved-fs');
        const elPCount = document.getElementById('we-cs-pending-count');
        const elRCount = document.getElementById('we-cs-resolved-count');
        if(elPending) elPending.textContent = pendingFS.length;
        if(elResolved) elResolved.textContent = resolvedFS.length;
        if(elPCount) elPCount.textContent = pendingFS.length;
        if(elRCount) elRCount.textContent = resolvedFS.length;

        // 渲染待回收列表
        const elPList = document.getElementById('we-cs-pending-list');
        if(elPList) {
            if(pendingFS.length === 0) {
                elPList.innerHTML = '<div class=
```

## AIP096 ? (???) ? line 3762 ? string ? 2531 chars

```text
>${f}</div>
                    </div>
                `).join('');
            }
        }

        // 3. 情绪弧线（ECharts）
        let emotionCurve = [];
        if(FB && FB._extractEmotionCurve) {
            emotionCurve = FB._extractEmotionCurve(FB._allPipelineResults?.outline || '');
        }
        // 同时从实体中查找情绪相关数据（EMO类型）
        const emoEnts = nonWorldEnts.filter(e => e.type === '技法' && (e.name || '').includes('情绪'));

        const elEmoAvg = document.getElementById('we-cs-emo-avg');
        if(elEmoAvg) {
            const avg = emotionCurve.length ? (emotionCurve.reduce((a,b) => a + b.score, 0) / emotionCurve.length).toFixed(1) : '-';
            elEmoAvg.textContent = avg;
        }

        const chartDom = document.getElementById('we-cs-emotion-chart');
        if(chartDom && typeof echarts !== 'undefined') {
            if(emotionCurve.length >= 2) {
                const chart = echarts.init(chartDom);
                const option = {
                    backgroundColor: 'transparent',
                    grid: { top: 30, right: 20, bottom: 30, left: 40 },
                    tooltip: { trigger: 'axis', backgroundColor: '#1a1a1e', borderColor: '#333', textStyle: { color: '#fff', fontSize: 11 } },
                    xAxis: { type: 'category', data: emotionCurve.map(e => '第' + e.chapter + '章'), axisLine: { lineStyle: { color: '#333' } }, axisLabel: { color: '#888', fontSize: 9 } },
                    yAxis: { type: 'value', min: 1, max: 10, axisLine: { lineStyle: { color: '#333' } }, axisLabel: { color: '#888', fontSize: 9 }, splitLine: { lineStyle: { color: '#1a1a1e' } } },
                    series: [
                        { name: '情绪分值', type: 'line', data: emotionCurve.map(e => e.score), smooth: true, symbol: 'circle', symbolSize: 8, lineStyle: { color: '#06b6d4', width: 2 }, itemStyle: { color: '#06b6d4' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(6,182,212,0.3)' }, { offset: 1, color: 'rgba(6,182,212,0)' }] } } },
                        { name: '张力等级', type: 'line', data: emotionCurve.map(e => e.tension), smooth: true, symbol: 'diamond', symbolSize: 6, lineStyle: { color: '#f59e0b', width: 1.5, type: 'dashed' }, itemStyle: { color: '#f59e0b' } }
                    ],
                    legend: { data: ['情绪分值', '张力等级'], textStyle: { color: '#888', fontSize: 9 }, top: 0 }
                };
                chart.setOption(option);
            } else {
                chartDom.innerHTML = '<div class=
```

## AIP097 ? if() ? line 3817 ? string ? 702 chars

```text
>数据不足</div>';
        }

        // 4. 世界观维度完成度
        const worldCats = { history: '历史与传说', geography: '地理与地貌', magic: '魔法/科技体系', factions: '势力与组织', species: '种族与生物', rules: '世界规则', culture: '文化与习俗' };
        const elWorld = document.getElementById('we-cs-world-dims');
        if(elWorld) {
            let worldHtml = '';
            for(const [key, label] of Object.entries(worldCats)) {
                const ent = allEnts.find(e => e.id === 'world_' + key);
                const hasContent = ent && ent.desc && ent.desc.length > 50;
                const percent = hasContent ? Math.min(100, Math.round(ent.desc.length / 10)) : 0;
                worldHtml += `
                    <div class=
```

## AIP098 ? (???) ? line 3835 ? string ? 90 chars

```text
>${hasContent ? '已建' : '未建'}</span>
                        ${hasContent ? `<button class=
```

## AIP099 ? (???) ? line 3871 ? string ? 927 chars

```text
>${c}</div>`).join('');
        }
    },

    // ═══ 叙事一致性 — 交互方法 ═══

    /**
     * 标记伏笔为已回收
     */
    _resolveForeshadowing(index) {
        const FB = Modules.fusion_book;
        if(!FB) return;
        const allOutlines = FB._allPipelineResults?.outline || '';
        const fsData = FB._extractForeshadowing ? FB._extractForeshadowing(allOutlines) : { pending: [], resolved: [] };
        const pending = fsData.pending || [];
        if(index >= 0 && index < pending.length) {
            const item = pending[index];
            // 在 allPipelineResults.outline 中追加回收标记
            FB._allPipelineResults.outline = FB._allPipelineResults.outline + '

【伏笔回收】已回收：' + item;
            UI.toast('已标记伏笔回收: ' + item.slice(0, 30) + '...');
            this._refreshNarrativeConsistency();
        }
    },

    /**
     * 手动添加伏笔
     */
    _showAddForeshadowingModal() {
        UI.dialog('添加伏笔', `
            <div class=
```

## AIP100 ? (???) ? line 3907 ? string ? 886 chars

```text
>
                </div>
            </div>
        `, {
            confirm: { text: '添加', action: async () => {
                const text = document.getElementById('we-cs-add-fs-text').value.trim();
                const ch = document.getElementById('we-cs-add-fs-chapter').value;
                if(!text) return UI.toast('请输入伏笔描述');
                const FB = Modules.fusion_book;
                if(FB && FB._allPipelineResults) {
                    FB._allPipelineResults.outline = (FB._allPipelineResults.outline || '') + '

【手动添加伏笔】' + text + (ch ? ' [计划回收:第' + ch + '章]' : '');
                    UI.toast('伏笔已添加');
                    this._refreshNarrativeConsistency();
                }
            }},
            cancel: { text: '取消' }
        });
    },

    /**
     * 手动记录情绪
     */
    _showAddEmotionModal() {
        UI.dialog('记录情绪锚点', `
            <div class=
```

## AIP101 ? (???) ? line 3946 ? string ? 2629 chars

```text
>
                </div>
            </div>
        `, {
            confirm: { text: '记录', action: async () => {
                const ch = document.getElementById('we-cs-add-emo-ch').value;
                const score = document.getElementById('we-cs-add-emo-score').value;
                const tension = document.getElementById('we-cs-add-emo-tension').value;
                const hook = document.getElementById('we-cs-add-emo-hook').value.trim();
                if(!ch || !score) return UI.toast('请输入章节号和情绪分值');
                const FB = Modules.fusion_book;
                if(FB && FB._allPipelineResults) {
                    FB._allPipelineResults.outline = (FB._allPipelineResults.outline || '') + `

### 第${ch}章
**情绪节奏:** 起→承→转→合
**emotion_score:** ${score}
**tension_level:** ${tension || 5}
**hook_type:** ${hook || '待定'}`;
                    UI.toast('情绪锚点已记录');
                    this._refreshNarrativeConsistency();
                }
            }},
            cancel: { text: '取消' }
        });
    },

    /**
     * 同步一致性状态到融合拆书（刷新 _accContext）
     */
    async _syncConsistencyToFusion() {
        const FB = Modules.fusion_book;
        if(!FB) return UI.toast('融合拆书模块未加载');
        await this._ensureCache();
        const allEnts = this._cachedEntities || [];
        const nonWorld = allEnts.filter(e => !e.id.startsWith('world_'));

        // 构建最新的知识图谱文本
        let kg = '';
        const grouped = {};
        nonWorld.forEach(e => { const t = e.type || '其他'; if(!grouped[t]) grouped[t]=[]; grouped[t].push(e); });
        for(const [type, items] of Object.entries(grouped)) {
            kg += `【${type}】${items.map(e => e.name + (e.desc ? ':' + e.desc.slice(0,60) : '')).join(' | ')}
`;
        }
        const worlds = allEnts.filter(e => e.id.startsWith('world_') && e.desc);
        if(worlds.length) {
            kg += '
【世界观设定】
';
            worlds.forEach(w => kg += `[${w.name}] ${w.desc.slice(0, 200)}
`);
        }

        // 更新 fusion_book 的累积上下文
        FB._accContext = FB._accContext || {};
        FB._accContext.entities = kg;
        FB._accContext.knowledgeGraph = kg;
        UI.toast('一致性状态已同步到融合拆书 (' + nonWorld.length + ' 个实体)');
    },

    /**
     * 编辑世界观维度
     */
    _editWorldDim(cat) {
        const catLabels = {history:'历史与传说',geography:'地理与地貌',magic:'魔法/科技体系',factions:'势力与组织',species:'种族与生物',rules:'世界规则',culture:'文化与习俗'};
        const label = catLabels[cat] || cat;
        DB.get('entities', 'world_' + cat).then(ent => {
            const current = ent && ent.desc ? ent.desc : '';
            UI.dialog('编辑：' + label, `
                <textarea id=
```

## AIP102 ? (???) ? line 4006 ? string ? 3861 chars

```text
>${current}</textarea>
            `, {
                confirm: { text: '保存', action: async () => {
                    const text = document.getElementById('we-cs-edit-world-text').value.trim();
                    await DB.put('entities', { id: 'world_' + cat, name: label, type: 'world', desc: text, source: 'pipeline', updatedAt: Date.now() });
                    this._cachedEntities = null;
                    UI.toast(label + ' 已更新');
                    this._refreshNarrativeConsistency();
                }},
                cancel: { text: '取消' }
            });
        });
    },

    async _refreshDashboard() {
        const we = Modules.world_engine;
        await we._ensureCache();
        await we._ensureCycleCache();

        const worldCats = ['history','geography','magic','factions','species','rules','culture'];
        let worldFilled = 0;
        const allEnts = we._cachedEntities || [];
        for(const cat of worldCats) {
            const ent = allEnts.find(e => e.id === 'world_' + cat);
            if(ent && ent.desc && ent.desc.length > 50) worldFilled++;
        }
        const worldProgress = Math.round((worldFilled / 7) * 100);
        const wpEl = document.getElementById('we-db-world-progress');
        const wbEl = document.getElementById('we-db-world-bar');
        if(wpEl) wpEl.textContent = `${worldFilled}/7`;
        if(wbEl) wbEl.style.width = `${worldProgress}%`;
        const wnEl = document.getElementById('we-nav-world-progress');
        if(wnEl) wnEl.textContent = `${worldFilled}/7`;

        const nonWorldEnts = allEnts.filter(e => !e.id?.startsWith('world_'));
        const ecEl = document.getElementById('we-db-entity-count');
        const etEl = document.getElementById('we-db-entity-types');
        const enEl = document.getElementById('we-nav-ent-count');
        if(ecEl) ecEl.textContent = nonWorldEnts.length;
        if(enEl) enEl.textContent = nonWorldEnts.length;
        const typeCounts = {};
        nonWorldEnts.forEach(e => { typeCounts[e.type] = (typeCounts[e.type]||0)+1; });
        const topTypes = Object.entries(typeCounts).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([t,c])=>`${t}:${c}`).join(' ');
        if(etEl) etEl.textContent = topTypes || '暂无实体';

        const gnEl = document.getElementById('we-db-graph-nodes');
        const geEl = document.getElementById('we-db-graph-edges');
        if(gnEl) gnEl.textContent = nonWorldEnts.length;
        let edgeCount = 0;
        nonWorldEnts.forEach(e => { edgeCount += (e.relations?.length || 0); });
        if(geEl) geEl.textContent = `${edgeCount} 关系`;

        const ccEl = document.getElementById('we-db-cycle-count');
        const cycles = we._cachedCycles || [];
        if(ccEl) ccEl.textContent = cycles.length;

        const flEl = document.getElementById('we-db-fusion-len');
        const FB = Modules.fusion_book;
        let fusionLen = 0;
        if(FB) {
            const ps = FB._getPipelineStatus ? FB._getPipelineStatus() : null;
            if(ps?.results?.fusion) fusionLen = ps.results.fusion.length;
        }
        if(flEl) flEl.textContent = fusionLen > 0 ? `${(fusionLen/1000).toFixed(1)}k` : '—';

        const vcEl = document.getElementById('we-db-vector-count');
        try {
            const vectors = await DB.getAll('vectors');
            if(vcEl) vcEl.textContent = vectors.length;
        } catch(e) { if(vcEl) vcEl.textContent = '—'; }

        const actEl = document.getElementById('we-dashboard-activity');
        if(actEl) {
            let html = '';
            const recentEnts = nonWorldEnts.sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)).slice(0, 5);
            if(recentEnts.length) {
                recentEnts.forEach(e => {
                    const time = e.updatedAt ? new Date(e.updatedAt).toLocaleDateString() : '未知';
                    html += `<div class=
```

# ???assets/js/modules/writer_original.js

## AIP103 ? logicPrompt ? line 3337 ? template ? 236 chars

```text
请检查以下小说正文的逻辑问题：

【章节标题】${...}
【正文内容】
${...}

【前文末尾】
${...}

请检查：
1. 人物行为是否前后一致
2. 时间线是否合理
3. 场景转换是否自然
4. 是否有明显的逻辑漏洞

如果发现问题，请用JSON格式输出修复建议：
{"issues":["问题1","问题2"],"suggestions":["建议1","建议2"]}

如果没有明显问题，输出：{"issues":[],"suggestions":[]}
```

## AIP104 ? (???) ? line 3456 ? template ? 144 chars

```text
从以下章节内容中提取关键实体：

【章节】${...}
【内容】
${...}

提取类型：人物、物品、地点、势力、情节、伏笔
输出JSON数组：[{"name":"名称","type":"类型","desc":"描述","relations":["关系:实体"]}]

只输出JSON。
```

# ???assets/js/modules_split/creative/creative_brainstorm.js

## AIP105 ? (???) ? line 14 ? template ? 797 chars

```text
你执行《叙事工程·元系统》脑洞生成协议（第五部分）。

【系统总纲】
核心理念：规则是骨架，案例是血肉，自由是心跳。
执行优先级：L1铁律→L2建议→L3选项→L4自由→L5案例学习。

【标题生成公式】（按情绪基调匹配）
爽 = 身份反转+打脸：[卑微身份]+[其实是隐藏大佬]
虐 = 失去+后悔：[删除/离开]+[严重后果]
甜 = 反差+意外相遇：[平凡身份]+[与高地位者相遇]
悬疑 = 规则怪谈+异常：[诡异规则]+[违反后果]
复仇 = 极端行为+毁灭后果：[疯狂操作]+[彻底摧毁]

【三层反转设计】
第一反转（拉阶段末章约5%）：打破主角初始认知
第二反转（扯阶段中点章约50%）：颠覆中段格局，前30%埋下至少1处伏笔
第三反转（放阶段中段章约85%）：终极真相，前70%埋下至少3处伏笔
彩蛋反转（最后一章最后一句）：暗示未完

【情绪链选择】
爽-智商碾压：设局→收网→揭底→碾压（期待→紧张→恍然大悟→极致爽）
虐-绝望剥离：预警失灵→钝刀割肉→最后稻草→不可逆（不安→反复揪心→崩溃→心碎）
甜-追妻火葬场：相遇→心动→阻碍→双向奔赴（怦然→甜蜜→揪心→圆满）
悬疑-恐怖谷效应：日常裂痕→疯狂猜想→恐怖实锤→绝望敲门（不安→恐惧→震惊→绝望）
复仇-扮猪吃虎：隐忍→挑衅→局部暴露→全面碾压→终极反转（憋屈→愤怒→暗爽→炸裂→震撼）

【共情锚点池】
焦躁：他第无数次按亮手机屏幕，又按灭。时间只过去三分钟。
委屈：她想解释，嘴巴张开又合上。说什么都没用。
失去：她习惯性地拿起手机，想给他发消息。打到一半，删了。
强撑：她深吸一口气，扯出一个笑。笑得太用力了。
绝望：他就那么坐着，一动不动。窗户外的天黑了又亮。

【输出要求】
每个创意包含：标题(10字内)、一句话概念、核心冲突、独特卖点、建议情绪链、推荐共情锚点。越反直觉越好。输出格式为JSON数组。
```

## AIP106 ? prompt ? line 49 ? template ? 148 chars

```text
${...}\n\n主题：【${...}】\n数量：${...}个\n模式要求：${...}\n\n请生成${...}个独特的小说创意脑洞。输出格式为JSON数组：[{"title":"标题","concept":"一句话概念","conflict":"核心冲突","hook":"独特卖点"}]
```

## AIP107 ? prompt ? line 100 ? template ? 225 chars

```text
你是一个创意碰撞引擎。请将以下三个随机元素进行创意碰撞，生成5个独特的小说创意：\n\n元素A：${...}\n元素B：${...}\n元素C：${...}\n\n要求：\n1. 每个创意都要有机融合这三个元素\n2. 产生意想不到的化学反应\n3. 每个创意包含：标题、一句话概念、核心冲突、独特卖点\n\n输出JSON数组格式：[{"title":"标题","concept":"概念","conflict":"冲突","hook":"卖点"}]
```

## AIP108 ? prompt ? line 130 ? template ? 303 chars

```text
你是一个创意进化引擎。请基于以下创意进行进化升级，生成5个更完善的版本：\n\n原创意：${...}\n概念：${...}\n冲突：${...}\n卖点：${...}\n\n进化方向：\n1. 强化冲突 - 让冲突更激烈、更不可调和\n2. 深化主题 - 增加哲学思考和社会隐喻\n3. 扩展世界观 - 让设定更宏大、更完整\n4. 优化人设 - 让角色更立体、更有魅力\n5. 创新结构 - 尝试非线性、多视角等叙事结构\n\n输出JSON数组格式：[{"title":"标题","concept":"概念","conflict":"冲突","hook":"卖点","evolution":"进化点"}]
```

# ???assets/js/modules_split/creative/creative_deai.js

## AIP109 ? (???) ? line 195 ? string ? 1652 chars

```text
]/g) || []).length;
        let score = 28
            + hits * 7
            + Math.max(0, avgLen - 22) * 1.2
            + longCount * 4
            + repeatedStarts * 3
            + Math.max(0, commaLoad - 2) * 6
            - shortRatio * 18
            - Math.min(18, sensory * 1.2)
            - Math.min(8, quoteCount * 0.35);
        return Math.max(3, Math.min(98, Math.round(score)));
    },

    _estimateDeaiChanges(before, after) {
        const a = String(before || '').trim();
        const b = String(after || '').trim();
        if (!a && !b) return 0;
        const beforeParts = a.split(/[。！？!?；;
]+/).map(s => s.trim()).filter(Boolean);
        const afterParts = b.split(/[。！？!?；;
]+/).map(s => s.trim()).filter(Boolean);
        const lenDelta = Math.abs(a.length - b.length);
        const sentenceDelta = Math.abs(beforeParts.length - afterParts.length);
        let changed = sentenceDelta;
        const max = Math.max(beforeParts.length, afterParts.length);
        for (let i = 0; i < max; i++) {
            if ((beforeParts[i] || '') !== (afterParts[i] || '')) changed++;
        }
        return Math.max(1, Math.round(changed + lenDelta / 80));
    },

    _renderDeaiStats() {
        const el = document.getElementById('cs-deai-stats');
        if (!el) return;
        const s = this._deaiStats || {};
        const before = Number.isFinite(s.aiScoreBefore) ? s.aiScoreBefore : 0;
        const afterText = s.aiScoreAfter == null ? '待生成' : `${s.aiScoreAfter}%`;
        const deltaText = s.aiScoreAfter == null ? '生成后计算' : `-${Math.max(0, before - s.aiScoreAfter)}%`;
        el.innerHTML = `
            <div class=
```

# ???assets/js/modules_split/creative/creative_deconstruct.js

## AIP110 ? class ? line 162 ? string ? 94 chars

```text
mt-4 p-3 bg-violet-500/10[^]*?</div>/, '');
                resultEl.innerHTML += `<div class=
```

# ???assets/js/modules_split/fusion_book/fusion_book_core.js

## AIP111 ? render() ? line 99 ? template ? 32130 chars

```text
<div class="flex flex-col h-full bg-[#0a0a0c] overflow-hidden relative">
            <!-- 顶部标题栏 -->
            <div class="h-10 flex items-center justify-between px-4 bg-[#0e0e10] border-b border-white/5 shrink-0">
                <div class="flex items-center gap-2">
                    <span class="text-sm font-bold text-green-400"><i class="fa-solid fa-book-open-reader mr-1.5"></i>融合拆书</span>
                    <span class="px-1.5 py-0.5 rounded text-[9px] bg-green-500/15 text-green-400 border border-green-500/20">弹药库：拆几章也能用 · 可暂停回写</span>
                    <span class="hidden text-[10px] text-red-400 animate-pulse font-bold" id="fb-gen-indicator">● 生成中</span>
                    <span class="text-[8px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 ${...}" id="fb-primary-badge-top">主书:左</span>
                    <span class="text-[8px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 ${...}" id="fb-primary-badge-top-right">主书:右</span>
                </div>
                <div class="flex items-center gap-1.5">
                    <button class="btn btn-xs bg-white/5 text-dim hover:text-white" onclick="Modules.fusion_book._toggleAdvancedPanel()" title="高级设置"><i class="fa-solid fa-sliders"></i></button>
                    <label class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30 cursor-pointer"><i class="fa-solid fa-upload mr-1"></i>导入书籍<input type="file" accept=".txt,.epub" class="hidden" onchange="Modules.fusion_book._handleImportFile(this)"></label>
                </div>
            </div>
            <!-- 高级设置面板 -->
            <div id="fb-advanced-panel" class="hidden absolute top-10 left-0 right-0 z-40 bg-[#111113] border-b border-white/10 p-3 shadow-xl">
                <div class="flex flex-wrap gap-2 items-center">
                    <span class="text-[10px] text-dim mr-1">步骤提示词:</span>
                    <button class="btn btn-xs bg-amber-600/15 text-amber-400 border-amber-600/20 text-[10px]" onclick="Modules.short.openPromptModal('fusion_analyze')"><i class="fa-solid fa-gear mr-0.5"></i>拆解</button>
                    <button class="btn btn-xs bg-purple-600/15 text-purple-400 border-purple-600/20 text-[10px]" onclick="Modules.short.openPromptModal('fusion_compare_analysis')"><i class="fa-solid fa-gear mr-0.5"></i>对比</button>
                    <button class="btn btn-xs bg-green-600/15 text-green-400 border-green-600/20 text-[10px]" onclick="Modules.short.openPromptModal('fusion_merge')"><i class="fa-solid fa-gear mr-0.5"></i>弹药</button>
                    <button class="btn btn-xs bg-blue-600/15 text-blue-400 border-blue-600/20 text-[10px]" onclick="Modules.short.openPromptModal('fusion_outline')"><i class="fa-solid fa-gear mr-0.5"></i>细纲</button>
                    <button class="btn btn-xs bg-pink-600/15 text-pink-400 border-pink-600/20 text-[10px]" onclick="Modules.short.openPromptModal('fusion_write')"><i class="fa-solid fa-gear mr-0.5"></i>正文</button>
                    <span class="w-px h-4 bg-white/10 mx-1"></span>
                    <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30" onclick="Modules.fusion_book.checkConsistency()"><i class="fa-solid fa-check-double mr-1"></i>一致性检查</button>
                    <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30" onclick="Modules.fusion_book.selectSaveFolder()"><i class="fa-solid fa-folder-open mr-1"></i>${...}</button>
                    ${...}
                </div>
            </div>

            <!-- 三栏主体 -->
            <div class="fb-main-layout flex-1 flex min-h-0 overflow-hidden">
                <!-- 左书栏 -->
                <div class="fb-side-panel fb-left-panel w-[260px] shrink-0 flex flex-col bg-[#0e0e10] border-r border-white/5 overflow-hidden">
                    <div class="p-2.5 border-b border-white/5 bg-blue-500/5 shrink-0">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="text-xs font-bold text-blue-400">A 左书</span>
                            <select id="fb-left-book" class="flex-1 bg-black/30 border border-white/5 rounded text-[10px] text-white p-1 min-w-0" onchange="Modules.fusion_book.selectBook('left',this.value)"></select>
                            <button class="text-red-400/50 hover:text-red-400 text-[10px]" onclick="Modules.fusion_book.deleteSelectedBook('left')"><i class="fa-solid fa-trash"></i></button>
                        </div>
                        <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30 w-full text-[9px] ${...}" onclick="Modules.fusion_book.setPrimaryBook('left')"><i class="fa-solid fa-crown mr-0.5"></i>设为主书</button>
                    </div>
                    <div id="fb-left-chapters" class="flex-1 overflow-y-auto min-h-0"></div>
                    <div id="fb-left-preview" class="h-48 shrink-0 border-t border-white/5 bg-[#0a0a0c] p-2.5 overflow-y-auto text-[10px] text-gray-400 leading-relaxed">
                        <div class="text-dim text-center mt-8">点击章节查看正文</div>
                    </div>
                </div>

                <!-- 中间面板 -->
                <div class="fb-main-panel flex-1 flex flex-col min-w-0 overflow-hidden bg-[#0a0a0c]">
                    <div class="p-3 border-b border-white/5 bg-[#0e0e10]">
                        <div class="flex items-center justify-center mb-2">
                    <button class="btn btn-md bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold shadow-lg hover:scale-105 transition-transform px-6" onclick="Modules.fusion_book.showPipelineConfig()"><i class="fa-solid fa-layer-group mr-2"></i>选择拆书模式</button>
                        </div>
                        <div class="flex items-center justify-center gap-2 mb-2">
                            <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30" onclick="Modules.fusion_book.sendToPhoenix()"><i class="fa-solid fa-feather mr-1"></i>→凤凰流</button>
                            <button class="btn btn-xs bg-indigo-600/20 text-indigo-400 border-indigo-600/30" onclick="Modules.fusion_book.sendToWriter()"><i class="fa-solid fa-table-columns mr-1"></i>送弹药到弹药库</button>
                            <button class="btn btn-xs bg-white/5 text-dim border-white/10" onclick="Modules.fusion_book.returnToWriter()"><i class="fa-solid fa-arrow-left mr-1"></i>回执笔台</button>
                        </div>
                        <div class="rounded-lg border border-white/5 bg-black/20 p-2 mb-2 space-y-2">
                            <div class="flex items-center justify-between gap-2">
                                <span class="text-[10px] text-amber-400 font-bold"><i class="fa-solid fa-compass mr-1"></i>方向 / 人物护栏</span>
                                <div class="flex gap-1">
                                    <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30 text-[9px]" onclick="Modules.fusion_book.pullWriterDirection()">拉取执笔台</button>
                                    <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30 text-[9px]" onclick="Modules.fusion_book.saveDirectionLock()">保存</button>
                                </div>
                            </div>
                            <textarea id="fb-direction-lock" class="w-full h-16 bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-gray-200 resize-none outline-none focus:border-amber-500/40" placeholder="写清当前新书方向、主角欲望、不能崩的人设、世界规则、下一步要推进什么。拆书只提供技法弹药，不能替你改方向。">${...}</textarea>
                            <div class="text-[9px] text-dim leading-relaxed">两种模式：创作融合按你的脑洞生成新书细纲/正文；弹药模式只沉淀弹药到弹药库/RAG。</div>
                        </div>
                        <div class="flex items-center justify-center gap-6 text-center">
                            <div><div class="text-lg font-bold text-blue-400">${...}</div><div class="text-[9px] text-dim">左书字数</div></div>
                            <div class="text-dim text-xs">⚡</div>
                            <div><div class="text-lg font-bold text-pink-400">${...}</div><div class="text-[9px] text-dim">右书字数</div></div>
                        </div>
                    </div>
                    <div class="flex-1 relative min-h-0">
                        <div id="fb-output" class="absolute inset-0 overflow-y-auto p-5 text-gray-200 text-sm leading-loose markdown-body"></div>
                    </div>
                </div>

                <!-- 右书栏 -->
                <div class="fb-side-panel fb-right-panel w-[260px] shrink-0 flex flex-col bg-[#0e0e10] border-l border-white/5 overflow-hidden">
                    <div class="p-2.5 border-b border-white/5 bg-pink-500/5 shrink-0">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="text-xs font-bold text-pink-400">B 右书</span>
                            <select id="fb-right-book" class="flex-1 bg-black/30 border border-white/5 rounded text-[10px] text-white p-1 min-w-0" onchange="Modules.fusion_book.selectBook('right',this.value)"></select>
                            <button class="text-red-400/50 hover:text-red-400 text-[10px]" onclick="Modules.fusion_book.deleteSelectedBook('right')"><i class="fa-solid fa-trash"></i></button>
                        </div>
                        <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30 w-full text-[9px] ${...}" onclick="Modules.fusion_book.setPrimaryBook('right')"><i class="fa-solid fa-crown mr-0.5"></i>设为主书</button>
                    </div>
                    <div id="fb-right-chapters" class="flex-1 overflow-y-auto min-h-0"></div>
                    <div id="fb-right-preview" class="h-48 shrink-0 border-t border-white/5 bg-[#0a0a0c] p-2.5 overflow-y-auto text-[10px] text-gray-400 leading-relaxed">
                        <div class="text-dim text-center mt-8">点击章节查看正文</div>
                    </div>
                </div>
            </div>

            <!-- 底部状态栏 -->
            <div class="h-8 flex items-center gap-2 px-3 bg-[#0e0e10] border-t border-white/5 shrink-0">
                <span class="text-[9px] text-dim" id="fb-status">就绪</span>
                <span class="flex-1"></span>
                <button class="btn btn-xs bg-white/5 text-dim text-[9px]" onclick="Utils.copy(document.getElementById('fb-output')?.innerText)"><i class="fa-solid fa-copy mr-1"></i>复制</button>
                <button class="btn btn-xs bg-white/5 text-dim text-[9px]" onclick="Modules.fusion_book.clearAll()"><i class="fa-solid fa-rotate-right mr-1"></i>清空</button>
            </div>

            <!-- ===== 拆书弹药监控浮层 ===== -->
            <div id="fb-pipeline-overlay" class="fb-pipeline-overlay absolute inset-0 z-50 flex flex-col bg-[#0a0a0c] border border-white/5" style="display:none;">
                <div class="h-11 flex items-center justify-between px-4 bg-[#0e0e10] border-b border-white/5 shrink-0">
                    <div class="flex items-center gap-3">
                        <span class="text-base font-bold text-green-400" id="pl-overlay-title"><i class="fa-solid fa-box-open mr-2"></i>拆书弹药 · 实时监控</span>
                        <span class="px-2 py-0.5 rounded text-[10px] bg-blue-500/15 text-blue-400 border border-blue-500/20 font-bold" id="pl-step-label"></span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <button class="btn btn-xs bg-blue-600/20 text-blue-400 border-blue-600/30" onclick="Modules.fusion_book.plMinimize()"><i class="fa-solid fa-compress mr-1"></i>最小化</button>
                        <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30" id="pl-pause-btn" style="display:none;" onclick="Modules.fusion_book.plPause()"><i class="fa-solid fa-pause mr-1"></i>暂停</button>
                        <button class="btn btn-xs bg-red-600/20 text-red-400 border-red-600/30" id="pl-stop-btn" style="display:none;" onclick="Modules.fusion_book.plStop()"><i class="fa-solid fa-stop mr-1"></i>停止</button>
                        <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.fusion_book.plClose()"><i class="fa-solid fa-xmark mr-1"></i>关闭</button>
                    </div>
                </div>
                <!-- 串行进度条 -->
                <div class="px-4 py-1.5 bg-[#0e0e10] border-b border-white/5 shrink-0 flex items-center gap-3">
                    <div class="flex items-center gap-1.5 text-[10px]">
                        <span class="text-dim">进度:</span>
                        <span class="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20" id="pl-agent-pending">0</span>
                        <span class="text-dim">待处理</span>
                        <span class="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20" id="pl-agent-running">0</span>
                        <span class="text-dim">处理中</span>
                        <span class="px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20" id="pl-agent-done">0</span>
                        <span class="text-dim">完成</span>
                    </div>
                    <div class="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div id="pl-progress-bar" class="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-300" style="width:0%"></div>
                    </div>
                    <span class="text-[10px] text-dim font-mono" id="pl-agent-stats">串行循环 · 0/0</span>
                </div>
                <!-- 阶段指示器 -->
                <div class="px-4 py-1 bg-[#0e0e10] border-b border-white/5 shrink-0 flex items-center gap-2 text-[10px]">
                    <span class="text-dim">阶段:</span>
                    <span class="px-1.5 py-0.5 rounded bg-white/5 text-dim" id="pl-phase-1">①分析</span>
                    <span class="text-dim">→</span>
                    <span class="px-1.5 py-0.5 rounded bg-white/5 text-dim" id="pl-phase-2">②融合</span>
                    <span class="text-dim">→</span>
                    <span class="px-1.5 py-0.5 rounded bg-white/5 text-dim" id="pl-phase-3">③循环</span>
                    <span class="text-dim">→</span>
                    <span class="px-1.5 py-0.5 rounded bg-white/5 text-dim" id="pl-phase-4">④弹药入库</span>
                </div>
                <div class="flex-1 flex min-h-0 overflow-hidden">
                    <!-- 左侧：实时输出 -->
                    <div class="flex-1 flex flex-col min-w-0 border-r border-white/5">
                        <div class="flex items-center justify-between px-4 py-2 bg-[#0e0e10] border-b border-white/5 shrink-0">
                            <span class="text-xs font-bold text-white" id="pl-current-title"><i class="fa-solid fa-file-lines mr-1 text-green-400"></i>等待启动</span>
                            <span class="text-[10px] text-dim font-mono" id="pl-current-chars"></span>
                        </div>
                        <div class="flex-1 overflow-y-auto p-5 text-sm text-gray-200 leading-loose whitespace-pre-wrap" id="pl-output">等待流水线启动...</div>
                    </div>
                    <!-- 右侧：状态面板 -->
                    <div class="w-[340px] shrink-0 flex flex-col overflow-y-auto bg-[#0e0e10]">
                        <!-- 实时写入状态 - 2列网格卡片 -->
                        <div class="p-3 border-b border-white/5">
                            <div class="text-[10px] text-dim font-bold uppercase tracking-wider mb-2">实时写入状态</div>
                            <div class="grid grid-cols-2 gap-1.5" id="pl-status-grid">
                                <div class="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-white/5 bg-white/[0.02] cursor-pointer hover:bg-white/5 transition-all" id="pl-s-left" onclick="Modules.fusion_book.plPreview('left')"><span class="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" id="pl-d-left"></span><span class="text-[11px] text-blue-400 font-bold truncate">左书分析</span><span class="ml-auto text-[9px] text-dim" id="pl-i-left"></span></div>
                                <div class="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-white/5 bg-white/[0.02] cursor-pointer hover:bg-white/5 transition-all" id="pl-s-right" onclick="Modules.fusion_book.plPreview('right')"><span class="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" id="pl-d-right"></span><span class="text-[11px] text-pink-400 font-bold truncate">右书分析</span><span class="ml-auto text-[9px] text-dim" id="pl-i-right"></span></div>
                                <div class="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-white/5 bg-white/[0.02] cursor-pointer hover:bg-white/5 transition-all" id="pl-s-compare" onclick="Modules.fusion_book.plPreview('compare')"><span class="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" id="pl-d-compare"></span><span class="text-[11px] text-amber-400 font-bold truncate">对比</span><span class="ml-auto text-[9px] text-dim" id="pl-i-compare"></span></div>
                                <div class="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-white/5 bg-white/[0.02] cursor-pointer hover:bg-white/5 transition-all" id="pl-s-fusion" onclick="Modules.fusion_book.plPreview('fusion')"><span class="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" id="pl-d-fusion"></span><span class="text-[11px] text-green-400 font-bold truncate">融合</span><span class="ml-auto text-[9px] text-dim" id="pl-i-fusion"></span></div>
                                <div class="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-white/5 bg-white/[0.02] cursor-pointer hover:bg-white/5 transition-all col-span-2" id="pl-s-outline" onclick="Modules.fusion_book.plPreview('outline')"><span class="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" id="pl-d-outline"></span><span class="text-[11px] text-orange-400 font-bold">📋 细纲</span><span class="ml-auto text-[9px] text-dim" id="pl-i-outline"></span></div>
                                <div class="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-white/5 bg-white/[0.02] cursor-pointer hover:bg-white/5 transition-all" id="pl-s-world" onclick="Modules.fusion_book.plPreview('world')"><span class="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" id="pl-d-world"></span><span class="text-[11px] text-cyan-400 font-bold truncate">实体提取</span><span class="ml-auto text-[9px] text-dim" id="pl-i-world"></span></div>
                                <div class="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-white/5 bg-white/[0.02] cursor-pointer hover:bg-white/5 transition-all" id="pl-s-write" onclick="Modules.fusion_book.plPreview('write')"><span class="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" id="pl-d-write"></span><span class="text-[11px] text-purple-400 font-bold truncate">正文</span><span class="ml-auto text-[9px] text-dim" id="pl-i-write"></span></div>
                            </div>
                        </div>
                        <!-- 流水线信息 -->
                        <div class="p-3 border-b border-white/5">
                            <div class="text-[10px] text-dim font-bold uppercase tracking-wider mb-2">流水线信息</div>
                            <div class="text-[11px] text-dim leading-relaxed" id="pl-pipeline-info">等待配置...</div>
                        </div>
                        <!-- 操作日志 -->
                        <div class="flex-1 p-3 min-h-0">
                            <div class="text-[10px] text-dim font-bold uppercase tracking-wider mb-2">操作日志</div>
                            <div class="overflow-y-auto text-[10px] font-mono leading-relaxed space-y-0.5" id="pl-log" style="max-height:calc(100vh - 380px);"></div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- 右下角全局悬浮胶囊 -->
            <div id="fb-pipeline-mini" class="absolute bottom-12 right-4 z-50 bg-gradient-to-r from-red-600 to-orange-500 rounded-full shadow-lg shadow-red-500/30 px-5 py-2.5 flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform" onclick="Modules.fusion_book._pipelineRunning ? Modules.fusion_book.plRestore() : (Modules.fusion_book._savedPipelineState ? Modules.fusion_book._resumeFromSaved() : Modules.fusion_book.showPipelineConfig())">
                    <span class="text-white text-sm font-bold"><i class="fa-solid fa-box-open mr-1.5"></i><span id="pl-mini-status">${...}</span></span>
                ${...}
            </div>

            <!-- ===== 流水线配置弹窗 ===== -->
            <div id="fb-pipeline-config" class="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" style="display:none;" onclick="if(event.target===this)this.style.display='none'">
                <div class="fb-config-panel w-[720px] max-h-[85vh] bg-[#111113] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col" onclick="event.stopPropagation()">
                    <div class="px-5 py-3 bg-[#0e0e10] border-b border-white/5 flex items-center justify-between">
                        <span class="text-base font-bold text-green-400"><i class="fa-solid fa-layer-group mr-2"></i>选择拆书模式</span>
                        <button class="text-dim hover:text-white" onclick="document.getElementById('fb-pipeline-config').style.display='none'"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="flex-1 overflow-y-auto p-5 space-y-4">
                        <!-- 章节选择 -->
                        <div class="flex gap-4">
                            <div class="flex-1">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-xs font-bold text-blue-400">A 左书章节</span>
                                    <div class="flex gap-1">
                                        <button class="text-[10px] text-blue-400 hover:underline" onclick="Modules.fusion_book._plConfigSelectAll('left',true)">全选</button>
                                        <button class="text-[10px] text-dim hover:underline" onclick="Modules.fusion_book._plConfigSelectAll('left',false)">全不选</button>
                                    </div>
                                </div>
                                <div class="flex items-center gap-1.5 mb-2 rounded-lg border border-blue-500/10 bg-blue-500/[0.03] px-2 py-1.5">
                                    <input id="plc-range-left-start" type="number" min="1" inputmode="numeric" placeholder="起始章" class="w-16 bg-black/30 border border-white/10 rounded px-2 py-1 text-[10px] text-white placeholder:text-gray-500 focus:border-blue-400 outline-none">
                                    <span class="text-[10px] text-dim">到</span>
                                    <input id="plc-range-left-end" type="number" min="1" inputmode="numeric" placeholder="结束章" class="w-16 bg-black/30 border border-white/10 rounded px-2 py-1 text-[10px] text-white placeholder:text-gray-500 focus:border-blue-400 outline-none">
                                    <button class="ml-auto text-[10px] text-blue-300 hover:text-blue-200 hover:underline" onclick="Modules.fusion_book._plConfigSelectRange('left')">选择范围</button>
                                </div>
                                <div id="plc-left-chapters" class="max-h-[180px] overflow-y-auto space-y-0.5 bg-black/20 rounded-lg p-2 border border-white/5"></div>
                            </div>
                            <div class="flex-1">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-xs font-bold text-pink-400">B 右书章节</span>
                                    <div class="flex gap-1">
                                        <button class="text-[10px] text-pink-400 hover:underline" onclick="Modules.fusion_book._plConfigSelectAll('right',true)">全选</button>
                                        <button class="text-[10px] text-dim hover:underline" onclick="Modules.fusion_book._plConfigSelectAll('right',false)">全不选</button>
                                    </div>
                                </div>
                                <div class="flex items-center gap-1.5 mb-2 rounded-lg border border-pink-500/10 bg-pink-500/[0.03] px-2 py-1.5">
                                    <input id="plc-range-right-start" type="number" min="1" inputmode="numeric" placeholder="起始章" class="w-16 bg-black/30 border border-white/10 rounded px-2 py-1 text-[10px] text-white placeholder:text-gray-500 focus:border-pink-400 outline-none">
                                    <span class="text-[10px] text-dim">到</span>
                                    <input id="plc-range-right-end" type="number" min="1" inputmode="numeric" placeholder="结束章" class="w-16 bg-black/30 border border-white/10 rounded px-2 py-1 text-[10px] text-white placeholder:text-gray-500 focus:border-pink-400 outline-none">
                                    <button class="ml-auto text-[10px] text-pink-300 hover:text-pink-200 hover:underline" onclick="Modules.fusion_book._plConfigSelectRange('right')">选择范围</button>
                                </div>
                                <div id="plc-right-chapters" class="max-h-[180px] overflow-y-auto space-y-0.5 bg-black/20 rounded-lg p-2 border border-white/5"></div>
                            </div>
                        </div>
                        <!-- 模式选择 -->
                        <div class="grid grid-cols-2 gap-3">
                            <button id="plc-flow-creative" class="text-left rounded-xl border p-3 transition-all ${...}" onclick="Modules.fusion_book._setPipelineFlowMode('creative')">
                                <div class="flex items-center gap-2 text-sm font-bold text-orange-300"><i class="fa-solid fa-wand-magic-sparkles"></i>创作融合</div>
                                <div class="mt-1 text-[10px] text-gray-300 leading-relaxed">按你的脑洞出新书。A/B逐章拆解，每N章对比融合，细纲和正文进执笔台，实体进世界引擎。</div>
                                <div class="mt-2 text-[9px] text-orange-200/80">适合：从零写一本、融合两本优势、自动循环产出。</div>
                            </button>
                            <button id="plc-flow-tool" class="text-left rounded-xl border p-3 transition-all ${...}" onclick="Modules.fusion_book._setPipelineFlowMode('tool')">
                                <div class="flex items-center gap-2 text-sm font-bold text-emerald-300"><i class="fa-solid fa-box-archive"></i>弹药模式</div>
                                <div class="mt-1 text-[10px] text-gray-300 leading-relaxed">不写新书。只拆技法、节奏、钩子、实体素材，进入拆书弹药库和RAG。</div>
                                <div class="mt-2 text-[9px] text-emerald-200/80">适合：当素材库、给续写/执笔调用、后续手动发布。</div>
                            </button>
                        </div>

                        <!-- 流水线选项 -->
                        <div class="bg-black/20 rounded-lg p-4 border border-white/5 space-y-3">
	                            <div class="flex items-center justify-between gap-2 mb-2">
	                                <div>
	                                    <div class="text-xs font-bold text-white" id="plc-mode-title">执行开关</div>
	                                    <div class="text-[9px] text-dim mt-0.5" id="plc-mode-desc">创作融合写入执笔台/世界引擎；弹药模式只实时沉淀弹药。</div>
	                                </div>
	                                <div class="text-[9px] text-dim">两个入口，流程自动锁定</div>
	                            </div>
                            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="plc-do-extract" ${...} class="accent-green-500" onchange="Modules.fusion_book._updateConfigSummary()"><span class="text-xs text-gray-300">🌍 创作入世界引擎；弹药入弹药库/RAG</span></label>
                            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="plc-do-outline" ${...} class="accent-green-500" onchange="Modules.fusion_book._updateConfigSummary()"><span class="text-xs text-gray-300">📋 生成原创循环细纲 → 执笔台</span></label>
                            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="plc-do-write" ${...} class="accent-green-500" onchange="Modules.fusion_book._updateConfigSummary()"><span class="text-xs text-gray-300">✍️ 执笔台自动写正文 → M06默认文风</span></label>
                            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="plc-do-rag" ${...} class="accent-green-500" onchange="Modules.fusion_book._updateConfigSummary()"><span class="text-xs text-gray-300">🔍 RAG上下文同步</span></label>
                            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="plc-do-local" ${...} class="accent-green-500"><span class="text-xs text-gray-300">💾 保存到本地文件夹</span>
                                ${...}
                            </label>
                        </div>
                        <!-- 循环拆解模式 -->
                        <div class="bg-cyan-900/10 rounded-lg p-4 border border-cyan-500/20 space-y-3">
                            <div class="text-xs font-bold text-cyan-400 mb-2"><i class="fa-solid fa-sync mr-1"></i>逐循环处理</div>
	                            <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="plc-cycle-mode" ${...} class="accent-cyan-500" onchange="Modules.fusion_book._updateConfigSummary()"><span class="text-xs text-gray-300">左书N章 + 右书N章 → 批量拆左N章 → 批量拆右N章 → 循环对比 → 按脑洞融合 → 产出新书N章。</span></label>
                            <div class="flex items-center gap-3">
                                <div class="flex items-center gap-2">
                                    <span class="text-[10px] text-dim">每</span>
                                    <select id="plc-cycle-size" class="bg-black/30 border border-white/10 rounded px-2 py-1 text-[10px] text-white" onchange="Modules.fusion_book._updateConfigSummary()">
                                        <option value="3" ${...}>3</option>
                                        <option value="5" ${...}>5</option>
                                        <option value="10" ${...}>10</option>
                                        <option value="20" ${...}>20</option>
                                    </select>
                                    <span class="text-[10px] text-dim">章为一个循环</span>
                                </div>
                            </div>
                        </div>
                        <!-- 执行方式 -->
                        <div class="bg-purple-900/10 rounded-lg p-4 border border-purple-500/20 space-y-2">
                            <div class="text-xs font-bold text-purple-400 mb-1"><i class="fa-solid fa-route mr-1"></i>执行方式</div>
                            <input type="hidden" id="plc-concurrency" value="1">
                            <div class="text-[10px] text-gray-300 leading-relaxed">
                                固定串行逐循环：批量拆左书本循环N章 → 批量拆右书本循环N章 → 循环对比融合 → 出本循环N章细纲/实体/正文，再进入下一循环。
                            </div>
                            <div class="text-[9px] text-purple-200/75">不再先攒任务，跑一步、融合一步、产出一步。</div>
                        </div>
                    </div>
                    <div class="px-5 py-3 bg-[#0e0e10] border-t border-white/5 flex items-center justify-between">
                        <span class="text-[10px] text-dim" id="plc-summary">选择章节后开始</span>
                        <div class="flex gap-2">
                            <button class="btn btn-sm bg-white/5 text-dim" onclick="document.getElementById('fb-pipeline-config').style.display='none'">取消</button>
                            <button id="plc-start-btn" class="btn btn-sm bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold shadow-lg" onclick="Modules.fusion_book.startConfiguredPipeline()"><i class="fa-solid fa-box-open mr-1"></i>开始</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
```

## AIP112 ? _escapeAttr() ? line 409 ? string ? 5560 chars

```text
/g, '&quot;');
    },

    _fusionAmmoPrompt() {
        return `【NEXUS 拆书弹药融合】
你是网文技法融合编辑。你的任务不是直接替用户写完一本书，而是把两本书的拆解结果合成可随取随用的写作弹药。

【核心边界】
- 拆书只提供技法、节奏、钩子、信息差、爽点、反转、场景推进方式
- 人物、世界规则、主线方向以当前项目、世界引擎、执笔台细纲为准
- 允许给出可选细纲方向，但不得擅自替用户锁死新书剧情
- 如果方向护栏不足，只输出通用弹药，不生成原创角色和世界观实体

【绝对禁令】
1. 禁止出现原书角色名、地名、势力名、物品名
2. 禁止复述原书具体情节
3. 禁止把原书设定换皮搬运
4. 禁止输出付款读者理论、方法论解释和系统术语给用户看
5. 禁止让技法压过当前人物一致性和世界规则

【技法来源A】
{{primary}}

【技法来源B】
{{secondary}}

【对比结论】
{{compare}}

【输出格式】
## 融合弹药包
### 1. 本轮能拿走的核心技法
- 技法名 | 适用场景 | 执行步骤 | 避坑

### 2. 钩子与信息差弹药
- 开场钩子
- 段落钩子
- 章末钩子
- 回收一个缺口时新埋的缺口

### 3. 节奏与情绪弹药
- 压抑/释放/停顿/反转的排列方式
- 哪些地方该快，哪些地方该留白
- 哪类日常细节能增强在场感

### 4. 人物与世界护栏
- 当前主角欲望不能被技法改写
- 当前关系不能被技法强行扭转
- 当前世界规则不能为了爽点临时改

### 5. 可选使用方式
- 直接写时怎么插入
- 续写时怎么不吃书
- 写不动时拆哪一类书补弹药
- 若用户选择生成细纲，可作为下一步细纲输入

只输出弹药包。不要输出完整正文。不要默认生成整本书细纲。`;
    },

    _getDirectionLockText() {
        const el = document.getElementById('fb-direction-lock');
        return String((el ? el.value : this._plConfig.directionLock) || '').trim();
    },

    _withDirectionGuard(prompt, scope = '拆书融合') {
        const direction = this._getDirectionLockText();
        const guard = [
            `【${scope}护栏】`,
            '拆书只提供技法弹药，不能替换当前新书方向。',
            '所有输出必须服从世界引擎、执笔台细纲、当前人物关系和主线方向。',
            direction ? `当前方向/人物护栏：
${direction}` : '当前方向/人物护栏：未填写。若生成细纲或正文，只允许给出通用弹药，不得擅自决定主线。'
        ].join('
');
        return `${guard}

${prompt}`;
    },

    _strictWritingLawText(scope = '正文生成') {
        return `【${scope}·M06去AI味硬约束】
以下规则是硬约束，违反任意一条都必须重写：
1. 视角锁死：长篇只允许第三人称有限，禁止第一人称视角，禁止上帝视角，禁止突然钻进其他角色脑子。
2. 禁止解释癖：禁用“这不是…而是…/不是因为…恰恰是因为…/这意味着…/换句话说…/其实…”开头。
3. 禁止烂俗比喻：禁用“像刀/阳光/风/水/火/石头”；新颖比喻每千字最多2个。
4. 禁止虚词模糊：删除“似乎/仿佛/好像”这类糊弄描述，除非场景本身故意朦胧。
5. 禁止情绪标签：不写“他很愤怒/她很伤心”，用动作、环境、对话呈现。
6. 禁止连续长句：单句不超过25字，逗号连接分句不超过2个。
7. 章末必有钩子：最后一句必须含未完成动作+意外信息、时间压力或信息差。
8. 对话格式：正文一律使用中文双引号“”独立成段，严禁使用「」。
9. 对话功能化：每句台词必须推进剧情、塑造性格、埋伏笔或制造情绪。
10. 开篇100字内：必须是动作或对话，禁止环境、背景、内心独白起手。
11. 结局禁梦：禁止“醒来发现是梦/幻觉/游戏”。
12. 时间线向前：除重生/回溯设定外，不允许无理由跳跃。
13. 主角行为一致：不得无理由OOC。
14. 禁逻辑连词：删除“首先/其次/然后/最后/总的来说”。
15. 段落限制：每段不超过5行，约60字，手机阅读优先。
16. 跨模块铁律：仿写、续写、拆书写作都必须遵守以上规则。

【语言口味】
- 纯大白话，现代话术，句子要像真人在讲事。
- 可以加入当下日常网络梗和口语梗，但只能服务人物和情绪，不能出戏。
- 禁止AI味总结、升华、说明书口吻、论文腔、过度文艺腔。
- 输出正文时只给正文；输出细纲时只给可执行细纲，不要自检报告。`;
    },

    async loadDirectionLock() {
        try {
            const saved = await DB.get('settings', 'fusion_direction_lock');
            this._plConfig.directionLock = saved?.content || this._plConfig.directionLock || '';
            const el = document.getElementById('fb-direction-lock');
            if (el) el.value = this._plConfig.directionLock;
        } catch(e) {}
    },

    async saveDirectionLock() {
        const content = this._getDirectionLockText();
        this._plConfig.directionLock = content;
        await DB.put('settings', { id: 'fusion_direction_lock', content, updatedAt: Date.now() });
        UI.toast(content ? '方向护栏已保存' : '方向护栏已清空');
    },

    async pullWriterDirection() {
        const title = (document.getElementById('w-title') || {}).value || '';
        const outline = (document.getElementById('w-outline') || {}).value || '';
        const content = (document.getElementById('w-editor') || {}).value || '';
        let text = '';
        if (title) text += `当前章节：${title}
`;
        if (outline) text += `当前细纲：
${outline.slice(0, 2000)}
`;
        if (content) text += `当前正文片段：
${content.slice(-1500)}
`;
        if (!text.trim()) return UI.toast('请先在执笔台打开章节，或手动填写方向护栏');
        const el = document.getElementById('fb-direction-lock');
        const merged = (this._getDirectionLockText() ? this._getDirectionLockText() + '

' : '') + text.trim();
        if (el) el.value = merged;
        this._plConfig.directionLock = merged;
        await this.saveDirectionLock();
    },

    returnToWriter() {
        localStorage.setItem('writer_flow_mode', 'fusion');
        App.nav('writer');
    },

    // ---- 初始化 ----
    async init() {
        this._PROMPTS.fusion = this._fusionAmmoPrompt();
        await this.loadBookList();
        this._renderChapterList('left');
        this._renderChapterList('right');
        // 恢复保存的文件夹配置
        const folderCfg = await DB.get('settings', 'pipeline_save_folder');
        if (folderCfg && folderCfg.name) this._plConfig.saveFolder = folderCfg.name;
        await this.loadDirectionLock();
        // 恢复保存的流水线进度
        const savedState = await DB.get('settings', 'pipeline_state');
        const hasSavedPipeline = savedState && (
            (savedState.completedPairs && savedState.completedPairs.length > 0) ||
            Object.keys(savedState.analysisResults || {}).length > 0 ||
            Object.keys(savedState.fusionResults || {}).length > 0
        );
        if (hasSavedPipeline) {
            this._savedPipelineState = savedState;
            this._plLog && this._plLog('检测到上次未完成的流水线进度', 'info');
        }
        // 加载章节时间戳
        const timestamps = await DB.get('settings', 'pipeline_chapter_timestamps');
        this._chapterTimestamps = (timestamps && timestamps.data) ? timestamps.data : {};
    },

    _getSelectedChapterCharCount(side) {
        // 同步方法，从缓存取
        if (!this['_cache_' + side]) return 0;
        return this['_cache_' + side].totalChars || 0;
    },

    async loadBookList() {
        const books = await FusionBookSystem.getBooks();
        this._books = books;
        for (const side of ['left', 'right']) {
            const sel = document.getElementById(`fb-${side}-book`);
            if (sel) {
                const cur = sel.value || (this[side].bookId || '');
                sel.innerHTML = '<option value=
```

## AIP113 ? if() ? line 611 ? string ? 505 chars

```text
>请先选择书籍</div>';
            return;
        }
        const curIdx = this[side].chapterIdx;
        const color = side === 'left' ? 'blue' : 'pink';
        const ts = this._chapterTimestamps || {};
        el.innerHTML = book.chapters.map((ch, i) => {
            const tsKey = `${book.id}_${side}_${i}`;
            const timeStr = ts[tsKey] ? new Date(ts[tsKey]).toLocaleString('zh-CN', {month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}) : '';
            return `
            <div class=
```

## AIP114 ? (???) ? line 640 ? string ? 823 chars

```text
>${(ch.content || '').slice(0, 3000)}${(ch.content || '').length > 3000 ? '

...(已截断)' : ''}</div>`;
    },

    selectChapter(side, idx) {
        this[side].chapterIdx = idx !== '' ? parseInt(idx) : null;
    },

    async deleteSelectedBook(side) {
        const bookId = this[side].bookId;
        if (!bookId) return UI.toast('请先选择书籍');
        if (!confirm('确定删除此书？')) return;
        await FusionBookSystem.deleteBook(bookId);
        this[side].bookId = null;
        this[side].chapterIdx = null;
        this['_cache_' + side] = null;
        await this.loadBookList();
        this._renderChapterList(side);
        const preview = document.getElementById(`fb-${side}-preview`);
        if (preview) preview.innerHTML = '';
        UI.toast('已删除');
    },

    // ---- 导入书籍 ----
    // ★ 用 <label> + <input type=
```

## AIP115 ? (???) ? line 663 ? string ? 3571 chars

```text
> 触发，不用 input.click()
    // Electron 会阻止 JS 程序化触发的 input.click()
    async _handleImportFile(input) {
        const file = input.files[0];
        input.value = ''; // 重置，允许重复选择同一文件
        if (!file) return;
        UI.toast('正在导入...');
        let text = '';
        if (file.name.endsWith('.epub') && typeof ePub !== 'undefined') {
            try {
                const book = ePub(await file.arrayBuffer());
                const spine = await book.loaded.spine;
                for (const item of spine.items) {
                    const doc = await item.load(book.load.bind(book));
                    text += doc.body?.innerText || '';
                    text += '\n\n';
                }
            } catch(err) { text = await file.text(); }
        } else {
            text = await file.text();
        }
        const name = file.name.replace(/\.(txt|epub)$/i, '');
        // ★ 不用 prompt() — Electron 里 prompt() 会被静默阻止返回 null
        const defaultRegex = '第[一二三四五六七八九十百千\\d]+章\\s*(.+?)(?=\\n|\\r|$)';
        try {
            const book = await FusionBookSystem.addBook(name, text, defaultRegex);
            await this.loadBookList();
            UI.toast(`《${name}》导入成功，共${book.chapters.length}章`);
        } catch(err) {
            console.error('导入失败:', err);
            UI.toast('导入失败: ' + err.message);
        }
    },

    async deleteBook(bookId) {
        if (!confirm('确定删除此书？')) return;
        await FusionBookSystem.deleteBook(bookId);
        await this.loadBookList();
        this._renderChapterList('left');
        this._renderChapterList('right');
        UI.toast('已删除');
    },

    // ---- 分析 ----
    async _getChapterContent(side) {
        const books = this._books || await FusionBookSystem.getBooks();
        const book = books.find(b => b.id === this[side].bookId);
        if (!book) { UI.toast('请先选择' + (side === 'left' ? '左' : '右') + '书'); return null; }
        const ch = book.chapters[this[side].chapterIdx];
        if (!ch) { UI.toast('请选择章节'); return null; }
        return { book, ch };
    },

    _setGenerating(on) {
        this._generating = on;
        const ind = document.getElementById('fb-gen-indicator');
        if (ind) { if (on) ind.classList.remove('hidden'); else ind.classList.add('hidden'); }
    },

    async analyzeLeft() { await this._analyzeSide('left'); },
    async analyzeRight() { await this._analyzeSide('right'); },
    async analyzeSelected() {
        if (this.left.chapterIdx !== null) await this._analyzeSide('left');
        if (this.right.chapterIdx !== null) await this._analyzeSide('right');
    },

    async _analyzeSide(side) {
        const data = await this._getChapterContent(side);
        if (!data) return;
        if (this._generating) return UI.toast('正在生成中');
        const { book, ch } = data;

        let prompt = await Modules.short.getPrompt('fusion_analyze');
        if (!prompt) prompt = this._PROMPTS.analyze;
        prompt = prompt.replace('{{book}}', book.name).replace('{{title}}', ch.title).replace('{{content}}', ch.content.slice(0, 6000));
        prompt = this._withDirectionGuard(prompt, '拆书弹药');
        if (this._pipelineRunning) {
            prompt += '\n\n【流水线输出纪律】\n只输出拆解内容本身。禁止输出“弹药已送达”“请核查”“准备下一轮”“返回执笔台”“等待指令”等收尾话术。完成后自然结束。';
        }

        const status = document.getElementById('fb-status');
        if (status) status.textContent = `正在分析${side === 'left' ? '左' : '右'}书：${ch.title}`;
        this._setGenerating(true);

        const outEl = document.getElementById('fb-output');
        if (outEl) outEl.innerHTML = '<div class=
```

## AIP116 ? (???) ? line 748 ? string ? 1405 chars

```text
></i>正在分析...</div>';

        // 流水线模式下同步写入浮层输出
        const inPipeline = this._pipelineRunning;
        const plOut = inPipeline ? document.getElementById('pl-output') : null;
        if (plOut) plOut.textContent = `分析${side === 'left' ? '左' : '右'}书: ${ch.title}...
`;

        let result = '';
        let aborted = false;
        let errorMsg = '';
        try {
            await AI.generate(prompt, { apiType: 'fusion', module: 'fusion_analyze' }, c => {
                result += c;
                if (outEl) outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(result) : result;
                if (plOut) plOut.textContent = result;
            });
        } catch(e) {
            if (e.message === '已中止') { aborted = true; }
            else {
                errorMsg = e.message || '未知错误';
                UI.toast('分析出错: ' + errorMsg, 'error');
            }
        }

        // ★ 如果被中止或流水线已停止，不保存结果，抛出错误中断调用链
        if (aborted || (inPipeline && !this._pipelineRunning)) {
            this._setGenerating(false);
            if (status) status.textContent = `${side === 'left' ? '左' : '右'}书分析已中止`;
            throw new Error('已中止');
        }

        // 如果有错误且不是中止，清理状态并返回
        if (errorMsg) {
            this._setGenerating(false);
            if (status) status.textContent = `${side === 'left' ? '左' : '右'}书分析失败`;
            if (outEl) outEl.innerHTML = `<div class=
```

## AIP117 ? (???) ? line 783 ? string ? 4337 chars

```text
></i>分析失败: ${errorMsg}</div>`;
            return;
        }

        this[side].analysis = result;
        this._pipelineResults[side] = result;
        this._allPipelineResults[side] = (this._allPipelineResults[side] || '') + '

---

' + result;
        this._setGenerating(false);
        if (status) status.textContent = `${side === 'left' ? '左' : '右'}书分析完成 (${result.length}字)`;
        ContextHelper.recordGeneration('拆书分析-' + book.name, result.slice(0, 200));

        // 保存每章分析结果，供循环拆解模式使用
        if (this._plConfig.cycleMode) {
            const cycleKey = `cycle_${book.id}_${this[side].chapterIdx}`;
            await DB.put('settings', { id: cycleKey, content: result, createdAt: Date.now() });
        }

        if (result) {
            await this._savePipelineAmmo?.('analysis', {
                side,
                bookId: book.id,
                bookName: book.name,
                chapterIndex: (this[side].chapterIdx || 0) + 1,
                chapterTitle: ch.title,
                content: result,
                title: `${side === 'left' ? '左书' : '右书'}第${(this[side].chapterIdx || 0) + 1}章技法弹药 · ${ch.title}`,
                tags: ['章节拆解', side === 'left' ? '左书' : '右书']
            });
        }

        // 拆解结果存RAG
        if (this._pipelineRunning && result && typeof RAGSystem !== 'undefined') {
            await RAGSystem.addDocument(`拆解_${side === 'left' ? '左' : '右'}书_${ch.title}`, result.slice(0, 8000), 'pipeline');
        }
    },

    // ---- 批量拆解 ----
    async batchAnalyze(side) {
        const books = this._books || await FusionBookSystem.getBooks();
        const book = books.find(b => b.id === this[side].bookId);
        if (!book) return UI.toast('请先选择' + (side === 'left' ? '左' : '右') + '书');
        if (this._generating) return UI.toast('正在生成中');

        const status = document.getElementById('fb-status');
        const outEl = document.getElementById('fb-output');
        let allResults = '';

        for (let i = 0; i < book.chapters.length; i++) {
            if (this._pipelinePaused) break;
            const ch = book.chapters[i];
            if (status) status.textContent = `批量拆解 [${i + 1}/${book.chapters.length}] ${ch.title}`;
            this._setGenerating(true);

            let prompt = await Modules.short.getPrompt('fusion_analyze');
            if (!prompt) prompt = this._PROMPTS.analyze;
            prompt = prompt.replace('{{book}}', book.name).replace('{{title}}', ch.title).replace('{{content}}', ch.content.slice(0, 6000));
            prompt = this._withDirectionGuard(prompt, '拆书弹药');

            let result = '';
            try {
                await AI.generate(prompt, { apiType: 'fusion', module: 'fusion_batch_analyze' }, c => {
                    result += c;
                    if (outEl) outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(`## ${ch.title}

${result}`) : result;
                });
            } catch(e) { result = '(分析失败: ' + e.message + ')'; }

            allResults += `## ${ch.title}

${result}

---

`;
        }

        this[side].analysis = allResults;
        this._pipelineResults[side] = allResults;
        this._setGenerating(false);
        if (outEl) outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(allResults) : allResults;
        if (status) status.textContent = `批量拆解完成 (${book.chapters.length}章)`;
        UI.toast('批量拆解完成');
    },

    async batchAll() {
        await this.batchAnalyze('left');
        await this.batchAnalyze('right');
    },

    // ---- 对比章节 (直接对比原文) ----
    async compareChapters() {
        const leftData = await this._getChapterContent('left');
        const rightData = await this._getChapterContent('right');
        if (!leftData || !rightData) return;
        if (this._generating) return;

        let prompt = `请对比以下两个章节的写作技法差异（只关注技巧层面，不涉及具体角色情节）：

【左书 - ${leftData.ch.title}】
${leftData.ch.content.slice(0, 4000)}

【右书 - ${rightData.ch.title}】
${rightData.ch.content.slice(0, 4000)}

请从开篇、节奏、爽点、悬念、对话、场景六个维度对比。`;
        prompt = this._withDirectionGuard(prompt, '技法对比');

        const status = document.getElementById('fb-status');
        if (status) status.textContent = '正在对比章节...';
        this._setGenerating(true);

        const outEl = document.getElementById('fb-output');
        if (outEl) outEl.innerHTML = '<div class=
```

## AIP118 ? (???) ? line 880 ? string ? 2110 chars

```text
></i>正在对比...</div>';

        let result = '';
        try {
            await AI.generate(prompt, { apiType: 'fusion', module: 'fusion_compare_chapters' }, c => {
                result += c;
                if (outEl) outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(result) : result;
            });
        } catch(e) { UI.toast('对比出错: ' + e.message); }

        this._pipelineResults.compare = result;
        this._setGenerating(false);
        if (status) status.textContent = '章节对比完成';
    },

    async compareAnalysis() {
        if (!this.left.analysis || !this.right.analysis) return UI.toast('请先分析左右两书');
        if (this._generating) return;

        // 获取主书/辅书，保证对比提示词不会丢变量
        const primarySide = this._primaryBook || 'left';
        const secondarySide = primarySide === 'left' ? 'right' : 'left';
        const primaryBook = (this._books || []).find(b => b.id === this[primarySide].bookId);
        const secondaryBook = (this._books || []).find(b => b.id === this[secondarySide].bookId);
        const primaryName = primaryBook ? primaryBook.name : (primarySide === 'left' ? '左书' : '右书');
        const secondaryName = secondaryBook ? secondaryBook.name : (primarySide === 'left' ? '右书' : '左书');

        let prompt = await Modules.short.getPrompt('fusion_compare_analysis');
        if (!prompt) prompt = this._PROMPTS.compare;
        prompt = prompt
            .replace(/{{primaryBook}}/g, primaryName).replace(/{{secondaryBook}}/g, secondaryName)
            .replace('{{primary}}', this[primarySide].analysis.slice(0, 4000))
            .replace('{{secondary}}', this[secondarySide].analysis.slice(0, 4000))
            .replace('{{left}}', this.left.analysis.slice(0, 4000))
            .replace('{{right}}', this.right.analysis.slice(0, 4000));
        prompt = this._withDirectionGuard(prompt, '技法对比');

        const status = document.getElementById('fb-status');
        if (status) status.textContent = '正在对比分析...';
        this._setGenerating(true);

        const outEl = document.getElementById('fb-output');
        if (outEl) outEl.innerHTML = '<div class=
```

## AIP119 ? (???) ? line 922 ? string ? 4154 chars

```text
></i>正在对比...</div>';

        const inPipeline = this._pipelineRunning;
        const plOut = inPipeline ? document.getElementById('pl-output') : null;
        if (plOut) plOut.textContent = '对比分析中...
';

        let result = '';
        try {
            await AI.generate(prompt, { apiType: 'fusion', module: 'fusion_compare_analysis' }, c => {
                result += c;
                if (outEl) outEl.innerHTML = typeof marked !== 'undefined' ? marked.parse(result) : result;
                if (plOut) plOut.textContent = result;
            });
        } catch(e) {
            if (e.message === '已中止') { this._setGenerating(false); throw e; }
            UI.toast('对比出错: ' + e.message);
        }
        if (inPipeline && !this._pipelineRunning) { this._setGenerating(false); throw new Error('已中止'); }

        this._pipelineResults.compare = result;
        this._allPipelineResults.compare = (this._allPipelineResults.compare || '') + '

---

' + result;
        this._setGenerating(false);
        if (status) status.textContent = '对比分析完成';

        if (result) {
            const leftBook = (this._books || []).find(b => b.id === this.left.bookId);
            const rightBook = (this._books || []).find(b => b.id === this.right.bookId);
            const leftIdx = this.left.chapterIdx;
            const rightIdx = this.right.chapterIdx;
            await this._savePipelineAmmo?.('compare', {
                leftBookId: this.left.bookId,
                rightBookId: this.right.bookId,
                leftIndex: leftIdx,
                rightIndex: rightIdx,
                leftTitle: leftBook?.chapters?.[leftIdx]?.title || '',
                rightTitle: rightBook?.chapters?.[rightIdx]?.title || '',
                content: result,
                title: `对比弹药 · 第${(leftIdx || 0) + 1}章 vs 第${(rightIdx || 0) + 1}章`,
                tags: ['逐章对比']
            });
        }
    },

    async fusionMerge() {
        if (!this._pipelineResults.compare && !this.left.analysis && !this.right.analysis) return UI.toast('请先完成分析或对比');
        if (this._generating) return;

        // 获取书名（用于prompt变量替换）
        const primarySide = this._primaryBook || 'left';
        const secondarySide = primarySide === 'left' ? 'right' : 'left';
        const primaryBook = (this._books || []).find(b => b.id === this[primarySide].bookId);
        const secondaryBook = (this._books || []).find(b => b.id === this[secondarySide].bookId);
        const primaryName = primaryBook ? primaryBook.name : (primarySide === 'left' ? '左书' : '右书');
        const secondaryName = secondaryBook ? secondaryBook.name : (primarySide === 'left' ? '右书' : '左书');

        let prompt = await Modules.short.getPrompt('fusion_merge');
        if (!prompt) prompt = this._fusionAmmoPrompt();
        prompt = prompt
            .replace(/{{primaryBook}}/g, primaryName).replace(/{{secondaryBook}}/g, secondaryName)
            .replace('{{primary}}', (this[primarySide].analysis || '').slice(0, 3000))
            .replace('{{secondary}}', (this[secondarySide].analysis || '').slice(0, 3000))
            .replace('{{left}}', (this.left.analysis || '').slice(0, 3000))
            .replace('{{right}}', (this.right.analysis || '').slice(0, 3000))
            .replace('{{compare}}', (this._pipelineResults.compare || '').slice(0, 3000));
        prompt = this._withDirectionGuard(prompt, '融合弹药');

        // 流水线模式下注入前章上下文 + 世界引擎一致性约束
        const acc = this._accContext || {};
        if (acc.outlines) prompt += `

【前章细纲参考（保持连贯性）】
${acc.outlines.slice(-2000)}`;
        if (acc.entities) prompt += `

【已提取实体（保持一致性）】
${acc.entities.slice(-1500)}`;

        // ★ 注入世界引擎全局一致性上下文（跨章世界观/角色/伏笔/情绪约束）
        try {
            const consistencyCtx = await this._buildConsistencyContext();
            if (consistencyCtx) prompt += `

${consistencyCtx}`;
        } catch(e) { console.warn('一致性上下文构建失败:', e); }

        const status = document.getElementById('fb-status');
        if (status) status.textContent = '正在融合精华...';
        this._setGenerating(true);

        const outEl = document.getElementById('fb-output');
        if (outEl) outEl.innerHTML = '<div class=
```

## AIP120 ? (???) ? line 1004 ? string ? 112 chars

```text
;

        const inPipeline = this._pipelineRunning;
        const plOut = inPipeline ? document.getElementById(
```

## AIP121 ? (???) ? line 1014 ? string ? 156 chars

```text
? marked.parse(result) : result;
                if (plOut) plOut.textContent = result;
            });
        } catch(e) {
            if (e.message ===
```

## AIP122 ? (???) ? line 1026 ? string ? 120 chars

```text
;

        // ★ 持久化融合精华到DB，供凤凰创作流和其他模块读取
        if (result) {
            const contextId = this._isCreativeFlow?.() ?
```

## AIP123 ? if() ? line 1031 ? string ? 408 chars

```text
, { id: contextId, content: this._allPipelineResults.fusion, updatedAt: Date.now() });
            const leftBook = (this._books || []).find(b => b.id === this.left.bookId);
            const rightBook = (this._books || []).find(b => b.id === this.right.bookId);
            const leftIdx = this.left.chapterIdx;
            const rightIdx = this.right.chapterIdx;
            await this._savePipelineAmmo?.(
```

## AIP124 ? (???) ? line 1036 ? string ? 239 chars

```text
, {
                leftBookId: this.left.bookId,
                rightBookId: this.right.bookId,
                leftIndex: leftIdx,
                rightIndex: rightIdx,
                leftTitle: leftBook?.chapters?.[leftIdx]?.title ||
```

## AIP125 ? if() ? line 1067 ? string ? 368 chars

```text
).filter(l => l.trim());
            lines.forEach(line => {
                const match = line.match(/^\d+\.\s*【?([^】:]+)】?[:：]\s*(.+)$/);
                if (match) techniques.push({ name: match[1].trim(), desc: match[2].trim() });
            });
        }

        // 提取写作模板
        const templates = [];
        const compareText = allPr.compare || pr.compare ||
```

## AIP126 ? (???) ? line 1089 ? string ? 239 chars

```text
,
                chapters: (leftBook.chapters || []).map(c => ({ title: c.title, index: c.index })),
                patterns: leftBook.analysis ? [leftBook.analysis.slice(0, 200)] : [],
                essence: (allPr.left || pr.left ||
```

## AIP127 ? (???) ? line 1096 ? string ? 244 chars

```text
,
                chapters: (rightBook.chapters || []).map(c => ({ title: c.title, index: c.index })),
                patterns: rightBook.analysis ? [rightBook.analysis.slice(0, 200)] : [],
                essence: (allPr.right || pr.right ||
```

# ???assets/js/modules_split/fusion_book/fusion_book_export.js

## AIP128 ? (???) ? line 352 ? template ? 261 chars

```text
从以下循环融合内容中提取可复用的写作模式和模板，以JSON格式输出：

${...}

输出格式：
{
  "hooks": ["开篇钩子模板1", "开篇钩子模板2"],
  "rhythms": ["节奏控制模板1", "节奏控制模板2"],
  "coolPoints": ["爽点设计模板1", "爽点设计模板2"],
  "suspenses": ["悬念布局模板1", "悬念布局模板2"],
  "transitions": ["场景转换模板1", "场景转换模板2"]
}

只输出JSON，不要其他内容。
```

# ???assets/js/modules_split/fusion_book/fusion_book_extract.js

## AIP129 ? (???) ? line 284 ? string ? 11457 chars

```text
“”]/g, '')
            .trim()
            .slice(0, 60);
        if (!title) return `第${chapterNum}章`;
        if (/第\s*[0-9一二三四五六七八九十百千万零〇两]+\s*章/.test(title)) return title;
        return `第${chapterNum}章 ${title}`;
    },

    async _requireCreativeProject() {
        const project = typeof GenesisCore !== 'undefined'
            ? await GenesisCore.requireActiveProject('创作融合需要先创建或选择一个项目，细纲/正文会直接写入执笔台')
            : null;
        if (!project) throw new Error('未选择项目，无法写入执笔台/世界引擎');
        return project;
    },

    async _ensureCreativeVolumeForChapter(chapterNum, project) {
        const volumeOrder = Math.max(1, Math.ceil((parseInt(chapterNum, 10) || 1) / 5));
        const startChapter = (volumeOrder - 1) * 5 + 1;
        const endChapter = volumeOrder * 5;
        const title = `第${volumeOrder}卷 第${startChapter}-${endChapter}章`;
        const allVolumes = await DB.getAll('volumes').catch(() => []) || [];
        const scoped = typeof GenesisCore !== 'undefined'
            ? GenesisCore.filterProjectItems(allVolumes, project.id)
            : allVolumes;
        let existing = scoped.find(v => (v.source === 'fusion_creative_pipeline' || v.fusionCreative) && (v.order || 0) === volumeOrder);
        if (!existing) existing = scoped.find(v => (v.order || 0) === volumeOrder && String(v.title || v.name || '') === title);
        const now = Date.now();
        const payload = {
            ...(existing || {}),
            id: existing?.id || Utils.uuid(),
            title,
            name: title,
            order: volumeOrder,
            source: 'fusion_creative_pipeline',
            fusionCreative: true,
            startChapter,
            endChapter,
            outline: existing?.outline || `创作融合自动分卷：第${startChapter}-${endChapter}章。`,
            createdAt: existing?.createdAt || now,
            updatedAt: now
        };
        if (typeof GenesisCore !== 'undefined') GenesisCore.stampProjectRecord(payload, project.id);
        await DB.put('volumes', payload);
        return payload;
    },

    async _ensureCreativeWriterChapter({ outline = '', content = '', title = '' } = {}) {
        const project = await this._requireCreativeProject();
        const acc = this._accContext || {};
        const chapterNum = acc.chapterNum || ((this.left?.chapterIdx ?? 0) + 1);
        const generatedTitle = String(title || this._extractCreativeChapterTitle(outline, chapterNum))
            .replace(/\*\*/g, '')
            .trim();
        const volume = await this._ensureCreativeVolumeForChapter(chapterNum, project);
        const allChapters = await DB.getAll('chapters').catch(() => []) || [];
        const scoped = typeof GenesisCore !== 'undefined'
            ? GenesisCore.filterProjectItems(allChapters, project.id)
            : allChapters;
        const cycleKey = `fusion_creative_${this.left?.bookId || 'left'}_${this.left?.chapterIdx ?? chapterNum - 1}_${this.right?.bookId || 'right'}_${this.right?.chapterIdx ?? chapterNum - 1}`;
        let existing = scoped.find(c => c.fusionCycleKey === cycleKey || c.sourceFusionKey === cycleKey);
        if (!existing) existing = scoped.find(c => (c.source === 'fusion_creative_pipeline' || c.fusionCreative) && (c.order || c.number) === chapterNum);
        if (!existing) existing = scoped.find(c => (c.order || c.number) === chapterNum && !(c.content || '').trim());
        const now = Date.now();
        const payload = {
            ...(existing || {}),
            id: existing?.id || Utils.uuid(),
            title: generatedTitle,
            outline: outline || existing?.outline || '',
            content: content || existing?.content || '',
            volumeId: volume.id,
            volumeTitle: volume.title,
            order: chapterNum,
            number: chapterNum,
            status: content ? 'draft' : (existing?.status || 'outline'),
            source: 'fusion_creative_pipeline',
            fusionCreative: true,
            fusionCycleKey: cycleKey,
            sourceFusionKey: cycleKey,
            leftBookId: this.left?.bookId || '',
            rightBookId: this.right?.bookId || '',
            leftChapterIndex: this.left?.chapterIdx ?? null,
            rightChapterIndex: this.right?.chapterIdx ?? null,
            targetWords: existing?.targetWords || 2500,
            createdAt: existing?.createdAt || now,
            updatedAt: now
        };
        if (typeof GenesisCore !== 'undefined') GenesisCore.stampProjectRecord(payload, project.id);
        await DB.put('chapters', payload);
        this._lastCreativeChapterId = payload.id;
        if (Modules.writer) Modules.writer.currentVolumeId = volume.id;
        try { await Modules.writer?.loadTree?.(); } catch(e) {}
        return payload;
    },

    async _writeExtractedEntitiesToWorld(entities, { raw = '' } = {}) {
        const project = await this._requireCreativeProject();
        const acc = this._accContext || {};
        const chapterNum = acc.chapterNum || ((this.left?.chapterIdx ?? 0) + 1);
        const chapter = this._lastCreativeChapterId ? await DB.get('chapters', this._lastCreativeChapterId).catch(() => null) : null;
        const chapterId = chapter?.id || '';
        const now = Date.now();
        const typeMap = {
            technique: '技法',
            character_template: '人物',
            conflict_model: '情节',
            rhythm: '技法',
            hook: '技法',
            location: '地点',
            faction: '势力',
            item: '物品',
            magic: '魔法',
            rule: '规则'
        };
        const allEntities = await DB.getAll('entities').catch(() => []) || [];
        const scoped = typeof GenesisCore !== 'undefined'
            ? GenesisCore.filterProjectItems(allEntities, project.id)
            : allEntities;
        const byNameType = new Map();
        scoped.forEach(e => byNameType.set(`${String(e.name || '').trim()}::${e.type || '其他'}`, e));

        let added = 0, updated = 0;
        for (const ent of (Array.isArray(entities) ? entities : [])) {
            if (!ent || !ent.name) continue;
            const type = typeMap[ent.type] || ent.type || '其他';
            const key = `${String(ent.name || '').trim()}::${type}`;
            const existing = byNameType.get(key);
            const desc = ent.description || ent.desc || '';
            const relations = this._normalizeRelations(ent.relations);
            const existingRelations = this._normalizeRelations(existing?.relations);
            const mergedRelations = [...new Set([...existingRelations, ...relations])];
            const oldDesc = existing?.desc || '';
            const nextDesc = oldDesc && desc && !oldDesc.includes(desc)
                ? `${oldDesc}\n\n[第${chapterNum}章更新]\n${desc}`.slice(0, 4000)
                : (oldDesc || desc || '').slice(0, 4000);
            const payload = {
                ...(existing || {}),
                id: existing?.id || Utils.uuid(),
                name: ent.name,
                type,
                desc: nextDesc,
                relations: mergedRelations,
                tags: [...new Set([...(existing?.tags || []), '创作融合', '自动提取'])],
                source: existing?.source || 'fusion_creative_pipeline',
                chapters: [...new Set([...this._asArray(existing?.chapters), chapterId].filter(Boolean))],
                chapterRef: [...new Set([...this._asArray(existing?.chapterRef), chapterNum].filter(Boolean))],
                chapterTitle: existing?.chapterTitle || chapter?.title || '',
                chapterTitles: [...new Set([...this._asArray(existing?.chapterTitles), chapter?.title].filter(Boolean))],
                sourceChapterId: chapterId,
                updatedAt: now
            };
            if (typeof GenesisCore !== 'undefined') GenesisCore.stampProjectRecord(payload, project.id);
            await DB.put('entities', payload);
            byNameType.set(key, payload);
            if (existing) updated++; else added++;
            try {
                await DB.put('vectors', {
                    id: payload.id,
                    content: `[${payload.type}] ${payload.name}: ${payload.desc || ''}\n来源：创作融合第${chapterNum}章 ${chapter?.title || ''}`,
                    vector: Array.from({ length: 1536 }, () => Math.random()),
                    timestamp: now,
                    source: 'fusion_creative_entity_extract',
                    chapterId,
                    chapterRef: [chapterNum]
                });
            } catch(e) {}
            this._plLog(`  → 世界引擎 ${existing ? '更新' : '新增'} ${type}: ${ent.name}`, 'entity');
        }

        if (Modules.world_engine) {
            Modules.world_engine._cachedEntities = null;
            Modules.world_engine._cachedLayeredGraphs = null;
            try { await Modules.world_engine.rebuildLayeredGraphs?.('fusion_creative_extract', { silent: true }); } catch(e) {}
            try { await Modules.world_engine._ensureCache?.(); } catch(e) {}
            try { Modules.world_engine._refreshDashboard?.(); } catch(e) {}
            try { Modules.world_engine._refreshEntities?.(); } catch(e) {}
            try { Modules.world_engine._initGraph?.(); } catch(e) {}
        }
        if (typeof RAGSystem !== 'undefined' && raw) {
            try { await RAGSystem.addDocument(`创作实体_第${chapterNum}章`, raw.slice(0, 6000), 'world_engine', { chapterId }); } catch(e) {}
        }
        return { added, updated, total: added + updated };
    },

    async _pipelineExtractEntities() {
        const fusion = this._pipelineResults.fusion || '';
        const outline = this._pipelineResults.outline || '';
        const write = this._pipelineResults.write || '';
        const storyText = (outline + '\n' + write).trim();
        const isStorySource = !!storyText;
        const creativeTarget = this._isCreativeFlow() && isStorySource;
        const sourceText = (isStorySource ? (fusion + '\n' + storyText) : fusion).slice(0, 8000);
        if (!sourceText.trim()) return;

        // 获取已有实体名称，让AI建立关联
        const existingEntities = await DB.getAll('entities') || [];
        const stagedEntities = await this._getWorkbenchEntitySnapshots();
        const existingNames = [
            ...existingEntities.filter(e => !String(e.id || '').startsWith('world_')).map(e => e.name),
            ...stagedEntities.map(e => e.name)
        ].filter(Boolean);
        const existingHint = existingNames.length ? `\n\n【已有实体(请在relations中引用这些名称建立关联)】\n${existingNames.slice(0,50).join('、')}` : '';

        const outEl = document.getElementById('pl-output');
        if (outEl) outEl.textContent = isStorySource ? '正在提取细纲/正文中的实体...' : '正在提取拆书弹药技法节点...';
        this._setGenerating(true);

        let raw = '';
        try {
            const entityGuard = this._withDirectionGuard ? this._withDirectionGuard('', '实体提取') : '';
            const storyPrompt = `你是深度实体提取引擎。
【核心任务】从以下细纲/正文中提取原创实体、世界观元素、伏笔、规则和关系，${creativeTarget ? '直接写入世界引擎，供执笔台后续章节调用。' : '暂存到拆书弹药库；由用户确认后再入世界引擎。'}

【数据来源说明】
以下内容来自当前新书的细纲或正文，不是原书内容。融合拆书内容只作为技法来源，不能被当作新书事实。

${sourceText}
${existingHint}

【提取铁律】
1. 只提取当前新书已经明确出现或细纲明确规划的实体，不要凭空扩写
2. 人物、物品、地点、势力、规则、伏笔必须建立关系
3. 如果只有技法描述，不要伪造人物和世界观
4. 直接输出纯JSON数组，不要markdown

【提取类型】
- 人物：所有角色，含身份、欲望、限制、关系
- 物品：道具、武器、法宝、关键物件
- 地点：地名、场景、建筑、地标
- 情节：关键事件、转折点、冲突
- 伏笔：暗示、线索、未解之谜
- 势力：门派、组织、国家、阵营、家族
- 种族：种族设定、族群特征
- 魔法：功法、技能、法术、科技体系、修炼等级
- 规则：世界法则、力量体系、禁忌
- 文化：风俗、社会制度、信仰
- 历史：历史事件、传说、纪元
- 技法：本章明确采用的写作套路、节奏模型、钩子公式

【输出格式】JSON数组：
[{
```

## AIP130 ? (???) ? line 528 ? string ? 178 chars

```text
- 直接输出纯JSON数组，禁止输出任何非JSON文本。`;
            const ammoPrompt = `你是写作技法入库引擎。
【核心任务】当前内容是拆书融合弹药，不是新书细纲。只能提取可复用技法节点，暂存到拆书弹药库。

${sourceText}
${existingHint}

【提取铁律】
1. 只允许输出 type 为
```

## AIP131 ? (???) ? line 537 ? string ? 139 chars

```text
的抽象节点
2. 禁止编造人物、地点、势力、物品、种族、魔法体系
3. description写清适用场景、执行步骤、避坑
4. relations用于连接已有技法、当前方向护栏或适用场景
5. 直接输出纯JSON数组，不要markdown

【输出格式】JSON数组：
[{
```

## AIP132 ? (???) ? line 544 ? string ? 1860 chars

```text
]}]

禁止输出任何非JSON文本。`;
            await AI.generate(
                entityGuard + (isStorySource ? storyPrompt : ammoPrompt),
                {
                    apiType: isStorySource ? 'parse' : 'fusion',
                    module: isStorySource ? 'fusion_story_entities' : 'fusion_ammo_entities'
                }, c => {
                    raw += c;
                    if (outEl) outEl.textContent = raw;
                }
            );
        } catch(e) {
            if (e.message === '已中止') { this._setGenerating(false); throw e; }
            this._plLog('实体提取AI调用失败: ' + e.message, 'err');
            this._setGenerating(false);
            return;
        }
        this._setGenerating(false);

        // ═══ 解析JSON（6层容错，健壮解析） ═══
        let entities = [];
        // 预处理: 先去掉markdown代码块包裹
        let cleanRaw = raw.trim();
        cleanRaw = cleanRaw.replace(/^???(?:json)?\s*\n?/i, '').replace(/\n????\s*$/, '').trim();

        // 尝试1: 直接解析
        try { entities = JSON.parse(cleanRaw); } catch(e1) {
            // 尝试2: 提取最外层 [...] 
            try {
                const start = cleanRaw.indexOf('[');
                const end = cleanRaw.lastIndexOf(']');
                if (start !== -1 && end > start) {
                    entities = JSON.parse(cleanRaw.slice(start, end + 1));
                }
            } catch(e2) {
                // 尝试3: 修复常见JSON问题（尾部逗号、单引号、中文引号、零宽字符）
                // 注意: 不做 \n→\\n 替换，那会破坏字符串内已有的合法换行
                try {
                    let fixed = cleanRaw;
                    const s = fixed.indexOf('[');
                    const e = fixed.lastIndexOf(']');
                    if (s !== -1 && e > s) fixed = fixed.slice(s, e + 1);
                    fixed = fixed.replace(/,\s*([}\]])/g, '$1');  // 尾部逗号
                    fixed = fixed.replace(/'/g, '
```

## AIP133 ? (???) ? line 590 ? string ? 185 chars

```text
');           // 中文引号→英文引号
                    fixed = fixed.replace(/[​-‍﻿]/g, ''); // 零宽字符
                    // 安全处理换行: 只替换JSON字符串值内部的裸换行
                    fixed = fixed.replace(/
```

## AIP134 ? (???) ? line 593 ? string ? 345 chars

```text
/g, (m) => m.replace(/\n/g, '\\n'));
                    entities = JSON.parse(fixed);
                } catch(e3) {
                    // 尝试4: 逐行拼接修复 — 逐个JSON对象提取（支持含数组的对象）
                    try {
                        // 匹配 { ... } 对象，允许内部有 [...] 数组
                        const objMatches = cleanRaw.match(/\{(?:[^{}]|\{[^{}]*\})*
```

## AIP135 ? (???) ? line 608 ? string ? 909 chars

```text
));
                                    entities.push(JSON.parse(fixedObj));
                                } catch(e) {
                                    // 正则提取核心字段
                                    const nameM = objStr.match(/"name"\s*:\s*"([^"]+?)"/);
                                    const typeM = objStr.match(/"type"\s*:\s*"([^"]+?)"/);
                                    const descM = objStr.match(/"desc(?:ription)?"\s*:\s*"([\s\S]*?)"/);
                                    // 提取relations数组
                                    const relM = objStr.match(/"relations"\s*:\s*\[([\s\S]*?)\]/);
                                    let relations = [];
                                    if (relM) {
                                        relations = relM[1].match(/"([^"]+?)"/g);
                                        if (relations) relations = relations.map(r => r.replace(/"/g,
```

## AIP136 ? if() ? line 620 ? string ? 343 chars

```text
));
                                        else relations = [];
                                    }
                                    if (nameM) {
                                        entities.push({
                                            name: nameM[1],
                                            type: typeM ? typeM[1] :
```

## AIP137 ? (???) ? line 627 ? string ? 320 chars

```text
,
                                            relations: relations
                                        });
                                    }
                                }
                            }
                            if (entities.length) this._plLog(`JSON修复: 正则提取到 ${entities.length} 个实体`,
```

## AIP138 ? (???) ? line 646 ? string ? 679 chars

```text
, relations: [] };
                                }
                                if (current) {
                                    const tm = line.match(/"type"\s*:\s*"([^"]+)"/);
                                    if (tm) current.type = tm[1];
                                    const dm = line.match(/"desc(?:ription)?"\s*:\s*"([^"]+)"/);
                                    if (dm) current.description = dm[1];
                                }
                            }
                            if (current && current.name) entities.push(current);
                            if (entities.length) this._plLog(`JSON修复: 逐行扫描提取到 ${entities.length} 个实体`,
```

## AIP139 ? (???) ? line 696 ? string ? 118 chars

```text
? r : String(r)).filter(Boolean);

            const existing = stagedAssets.find(a =>
                (a.type ===
```

## AIP140 ? (???) ? line 699 ? string ? 96 chars

```text
)) &&
                a.name === ent.name &&
                (a.entityType || a.entity?.type ||
```

## AIP141 ? (???) ? line 714 ? string ? 180 chars

```text
, {
                ...(existing || {}),
                id: existing?.id || `fusion_entity_${now}_${count}_${Utils.uuid()}`,
                name: ent.name,
                type:
```

## AIP142 ? (???) ? line 718 ? string ? 259 chars

```text
,
                entityType: type,
                desc: entityPayload.desc,
                relations,
                entity: entityPayload,
                chapterRef: chNum ? [chNum] : [],
                cycleId: currentCycleId,
                source:
```

## AIP143 ? (???) ? line 725 ? string ? 240 chars

```text
,
                tags: entityPayload.tags,
                createdAt: existing?.createdAt || now,
                updatedAt: now
            });
            count++;
            this._plLog(`  → 暂存 ${type}: ${ent.name}${relations.length ?
```

## AIP144 ? (???) ? line 742 ? string ? 261 chars

```text
], createdAt: now
            });
        }
        try { await Modules.fusion_workbench?.refresh?.(); } catch(e) {}
    },

    // ★ 自动从提取的实体中归纳世界观维度
    async _pipelineExtractWorldView(entities, sourceText) {
        const catMap = {
            history:
```

## AIP145 ? (???) ? line 787 ? string ? 263 chars

```text
, id);
            const assetId = `fusion_entity_world_${cat}`;
            const existingAsset = stagedAssets.find(a => a.id === assetId && !a.publishedEntityId);
            const oldDesc = existingAsset?.desc || ((existing && existing.desc) ? existing.desc :
```

## AIP146 ? (???) ? line 790 ? string ? 129 chars

```text
);
            const newContent = worldData[cat].trim();
            // 追加新内容（去重）
            const merged = oldDesc ? oldDesc +
```

## AIP147 ? (???) ? line 801 ? string ? 147 chars

```text
, {
                ...(existingAsset || {}),
                id: existingAsset?.id || assetId,
                name: label,
                type:
```

## AIP148 ? (???) ? line 811 ? string ? 200 chars

```text
],
                createdAt: existingAsset?.createdAt || Date.now(),
                updatedAt: Date.now()
            });
            worldCount++;
            this._plLog(`  🌍 世界观: ${label} 已暂存`,
```

## AIP149 ? (???) ? line 820 ? string ? 476 chars

```text
);
            try { await Modules.fusion_workbench?.refresh?.(); } catch(e) {}
        }
    },

    async _pipelineSaveOutline() {
        const fusion = this._pipelineResults.fusion;
        if (!fusion) return;

        // 获取书名（用于日志和自定义prompt变量替换）
        const leftBook = (this._books || []).find(b => b.id === this.left.bookId);
        const rightBook = (this._books || []).find(b => b.id === this.right.bookId);
        const lName = leftBook ? leftBook.name :
```

## AIP150 ? (???) ? line 836 ? string ? 171 chars

```text
? rName : lName;

        // 获取累积上下文（前章细纲+实体+知识图谱）
        const acc = this._accContext || {};
        const prevOutlines = acc.outlines ? acc.outlines.slice(-3000) :
```

## AIP151 ? (???) ? line 849 ? string ? 342 chars

```text
}

【核心要求】
- 所有人物性格、身份、关系必须与世界引擎和执笔台方向保持一致
- 伏笔和线索要与前章呼应，新伏笔要标注回收计划
- 世界观设定（魔法体系、势力关系、地理等）遵循世界引擎，不允许被拆书技法改写
- 新出现的人物/物品/地点要标注，方便后续提取到知识图谱
- 技法运用标注来源（技法骨架/补强弹药/融合创新）

请生成本章详细细纲，包含：
1. 章节标题
2. 核心事件（100字内）
3. 场景分段（每段场景的目的和情绪）
4. 运用的融合技法（标注来源）
5. 情绪节奏（起/承/转/合，标注分值）
6. 爽点/钩子设计
7. 对话要点（潜台词、信息差）
8. 一致性校验：是否与世界引擎、人物关系和前章事实矛盾？
${prevOutlines ?
```

## AIP152 ? (???) ? line 875 ? string ? 253 chars

```text
, rName);
            if (knowledgeGraph) prompt += `\n\n${knowledgeGraph.slice(0, 3000)}`;
            if (prevOutlines) prompt += `\n\n【前章细纲参考】\n${prevOutlines}`;
        }
        prompt = this._withDirectionGuard ? this._withDirectionGuard(prompt,
```

## AIP153 ? (???) ? line 900 ? string ? 102 chars

```text
? marked.parse(result) : result;
            });
        } catch(e) {
            if (e.message ===
```

## AIP154 ? (???) ? line 917 ? string ? 309 chars

```text
);
            return chapter;
        }

        const chIdx = this.left.chapterIdx;
        const leftBook2 = (this._books || []).find(b => b.id === this.left.bookId);
        const lCh = leftBook2 && leftBook2.chapters[chIdx] ? leftBook2.chapters[chIdx] : null;
        const chapTitle = lCh ? lCh.title :
```

## AIP155 ? (???) ? line 941 ? string ? 127 chars

```text
);
        try { await Modules.fusion_workbench?.refresh?.(); } catch(e) {}

        this._plLog(`细纲生成完成 (${result.length}字)`,
```

## AIP156 ? (???) ? line 944 ? string ? 240 chars

```text
);
    },

    async _buildCreativeWriterPrompt(chapter) {
        const W = Modules.writer;
        const project = await this._requireCreativeProject();
        const chaps = W?._scopeRecords
            ? W._scopeRecords(await DB.getAll(
```

## AIP157 ? (???) ? line 952 ? string ? 195 chars

```text
).catch(() => []) || []).sort((a,b) => (a.order || 0) - (b.order || 0));
        const oldChapterId = W?.currentChapterId;
        if (W) W.currentChapterId = chapter.id;

        let worldCtx =
```

## AIP158 ? (???) ? line 956 ? string ? 269 chars

```text
;
        try {
            if (Modules.world_engine) {
                await Modules.world_engine._ensureCache?.();
                const entities = Modules.world_engine._cachedEntities || [];
                const worldEntities = entities.filter(e => !String(e.id ||
```

## AIP159 ? (???) ? line 1005 ? string ? 136 chars

```text
;
        } catch(e) {}
        const mandatoryRules = W?._mergeStyleRules
            ? W._mergeStyleRules(W._getExtractedStyle?.() ||
```

## AIP160 ? (???) ? line 1009 ? string ? 88 chars

```text
);
        const nexusPrefix = W?._buildNexusPrefix ? await W._buildNexusPrefix(true) :
```

## AIP161 ? (???) ? line 1013 ? string ? 383 chars

```text
;
        const prevIdx = chaps.findIndex(c => c.id === chapter.id) - 1;
        if (prevIdx >= 0 && chaps[prevIdx].content) prevContent = chaps[prevIdx].content.slice(-1200);

        const targetWords = parseInt(chapter.targetWords || 2500, 10) || 2500;
        const proseContract = W?._buildWriterProseContract ? W._buildWriterProseContract({
            title: chapter.title ||
```

## AIP162 ? (???) ? line 1028 ? string ? 94 chars

```text
)
            .trim();
        const fusionCtx = [
            this._pipelineResults.fusion ?
```

## AIP163 ? (???) ? line 1034 ? string ? 123 chars

```text
);
        const direction = this._getDirectionLockText ? this._getDirectionLockText() : (this._plConfig?.directionLock ||
```

## AIP164 ? (???) ? line 1035 ? string ? 118 chars

```text
);
        const isGoldenOpening = chapter.order && chapter.order <= 3;
        const goldenExtra = isGoldenOpening ?
```

## AIP165 ? (???) ? line 1092 ? string ? 188 chars

```text
? marked.parse(result) : result;
            });
        } catch(e) {
            this._setGenerating(false);
            W.currentChapterId = oldChapterId;
            if (e.message ===
```

## AIP166 ? catch() ? line 1098 ? string ? 256 chars

```text
));
        }

        result = W._sanitizeGeneratedProse ? W._sanitizeGeneratedProse(result) : result.trim();
        if (!result.trim()) {
            this._setGenerating(false);
            W.currentChapterId = oldChapterId;
            throw new Error(
```

## AIP167 ? (???) ? line 1120 ? string ? 142 chars

```text
);

        try {
            await W._runPostWriteProcessing?.(chapter.id, {
                forcePostProcess: true,
                source:
```

## AIP168 ? catch() ? line 1129 ? string ? 362 chars

```text
);
        }
        try { await W.loadTree?.(); } catch(e) {}
        if (oldChapterId) W.currentChapterId = oldChapterId;
        else W.currentChapterId = chapter.id;
        return chapter;
    },

    async _pipelineWrite() {
        if (this._isCreativeFlow?.()) return this._pipelineWriteToWriter();
        const fusion = this._pipelineResults.fusion ||
```

## AIP169 ? _pipelineWrite() ? line 1140 ? string ? 193 chars

```text
;
        if (!fusion && !outline) return;

        // ★ 获取累积上下文 + 知识图谱
        const acc = this._accContext || {};
        const prevOutlines = acc.outlines ? acc.outlines.slice(-2000) :
```

## AIP170 ? (???) ? line 1164 ? string ? 82 chars

```text
)}`;
        prompt = this._withDirectionGuard ? this._withDirectionGuard(prompt,
```

## AIP171 ? (???) ? line 1187 ? string ? 157 chars

```text
? marked.parse(result) : result;
                if (plOut) plOut.textContent = result;
            });
        } catch(e) {
            if (e.message ===
```

## AIP172 ? (???) ? line 1200 ? string ? 335 chars

```text
);

        // 存入拆书弹药库，默认不直写执笔台
        if (result) {
            const chIdx = this.left.chapterIdx;
            const leftBook = (this._books || []).find(b => b.id === this.left.bookId);
            const lCh = leftBook && leftBook.chapters[chIdx] ? leftBook.chapters[chIdx] : null;
            const chapTitle = lCh ? lCh.title :
```

# ???assets/js/modules_split/fusion_workbench/fwb_actions.js

## AIP173 ? _sameWorkbenchTitle() ? line 94 ? string ? 9043 chars

```text
'“”‘’\s]/g, '')
            .replace(/[：:，、；;。.!！?？-]/g, '')
            .trim()
            .toLowerCase();
        return norm(a) && norm(a) === norm(b);
    },

    async _ensureWriterVolumeFromWorkbench(item, project = null) {
        const title = this._getWorkbenchVolumeTitle(item);
        if (!title) return null;
        const projectId = project?.id || item?.projectId || '';
        const allVolumes = await DB.getAll('volumes').catch(() => []) || [];
        const scoped = allVolumes.filter(v => !projectId || !v.projectId || v.projectId === projectId);
        const order = this._parseWorkbenchVolumeIndex(item);
        let existing = scoped.find(v => this._sameWorkbenchTitle(v.title || v.name, title));
        if (!existing) existing = scoped.find(v => (v.order || 0) === order && this._sameWorkbenchTitle(v.title || v.name, title));
        const payload = this._stampProjectPayload({
            ...(existing || {}),
            id: existing?.id || Utils.uuid(),
            title,
            order: existing?.order || order,
            source: existing?.source || 'fusion_workbench_publish',
            outline: existing?.outline || (this._isWorkbenchVolumeTitle(item?.title) ? (item?.content || '') : ''),
            createdAt: existing?.createdAt || Date.now(),
            updatedAt: Date.now()
        }, project || { id: projectId });
        await DB.put('volumes', payload);
        return payload;
    },

    _parseWorkbenchChapterIndex(item) {
        const direct = item?.chapterIndex ?? item?.chapterOrder ?? item?.order;
        if (Number.isFinite(Number(direct))) return Number(direct);
        const text = `${item?.title || ''}\n${item?.content || ''}`;
        const m = text.match(/第\s*([0-9]+|[一二三四五六七八九十百千万零〇两]+)\s*章/);
        if (!m) return Date.now();
        return this._parseCnOrdinal(m[1], Date.now());
    },

    _publishedTitle(item, fallback) {
        return String(item?.targetChapterTitle || item?.chapterTitle || item?.title || fallback || '工作台导入章节')
            .replace(/^融合弹药(细纲|正文)\s*\([^)]+\)\s*/, '')
            .replace(/（(?:从零|融合|导入)(?:细纲|正文)）$/g, '')
            .trim();
    },

    async publishOutlineToWriter(id) {
        const item = await DB.get('outlines', id);
        if (!item) return UI.toast('找不到这条细纲');
        const project = await GenesisCore.getActiveProject?.();
        if (this._isWorkbenchVolumeTitle(item.title || item.chapterTitle || '') || this._isWorkbenchVolumeTitle(String(item.content || '').split('\n').find(Boolean) || '')) {
            const volume = await this._ensureWriterVolumeFromWorkbench(item, project);
            item.publishedVolumeId = volume?.id || '';
            item.publishedAt = Date.now();
            await DB.put('outlines', item);
            try { Modules.writer?.loadTree?.(); } catch(e) {}
            return UI.toast('已从拆书弹药库建立执笔台卷结构');
        }
        const order = this._parseWorkbenchChapterIndex(item);
        const volume = await this._ensureWriterVolumeFromWorkbench(item, project);
        const allChapters = await DB.getAll('chapters').catch(() => []) || [];
        const existing = allChapters.find(c => c.workbenchOutlineId === id || c.sourceOutlineId === id);
        const payload = this._stampProjectPayload({
            ...(existing || {}),
            id: existing?.id || Utils.uuid(),
            title: this._publishedTitle(item, `第${order}章（工作台细纲）`),
            outline: item.content || '',
            content: existing?.content || '',
            order,
            number: order,
            volumeId: volume?.id || existing?.volumeId || item.volumeId || null,
            volumeTitle: volume?.title || item.volumeTitle || existing?.volumeTitle || '',
            status: existing?.content ? (existing.status || 'draft') : 'outline',
            source: 'fusion_workbench_publish',
            sourceOutlineId: id,
            workbenchOutlineId: id,
            targetWords: existing?.targetWords || 2500,
            createdAt: existing?.createdAt || Date.now(),
            updatedAt: Date.now()
        }, project);
        await DB.put('chapters', payload);
        item.publishedChapterId = payload.id;
        item.publishedAt = Date.now();
        await DB.put('outlines', item);
        try { Modules.writer?.loadTree?.(); } catch(e) {}
        UI.toast('已从拆书弹药库送入执笔台细纲');
    },

    async publishWritingToWriter(id) {
        const item = await DB.get('writings', id);
        if (!item) return UI.toast('找不到这条正文');
        const project = await GenesisCore.getActiveProject?.();
        const order = this._parseWorkbenchChapterIndex(item);
        const volume = await this._ensureWriterVolumeFromWorkbench(item, project);
        const allChapters = await DB.getAll('chapters').catch(() => []) || [];
        let existing = allChapters.find(c => c.workbenchWritingId === id || c.sourceWritingId === id);
        if (!existing && item.outlineId) existing = allChapters.find(c => c.workbenchOutlineId === item.outlineId || c.sourceOutlineId === item.outlineId);
        const payload = this._stampProjectPayload({
            ...(existing || {}),
            id: existing?.id || Utils.uuid(),
            title: this._publishedTitle(item, `第${order}章（工作台正文）`),
            outline: existing?.outline || item.outline || '',
            content: item.content || '',
            order,
            number: order,
            volumeId: volume?.id || existing?.volumeId || item.volumeId || null,
            volumeTitle: volume?.title || item.volumeTitle || existing?.volumeTitle || '',
            status: 'draft',
            source: 'fusion_workbench_publish',
            sourceWritingId: id,
            workbenchWritingId: id,
            targetWords: existing?.targetWords || 2500,
            createdAt: existing?.createdAt || Date.now(),
            updatedAt: Date.now()
        }, project);
        await DB.put('chapters', payload);
        item.publishedChapterId = payload.id;
        item.publishedAt = Date.now();
        await DB.put('writings', item);
        try { Modules.writer?.loadTree?.(); } catch(e) {}
        UI.toast('已从拆书弹药库送入执笔台正文');
    },

    async publishEntityToWorld(id) {
        const asset = await DB.get('assets', id);
        if (!asset) return UI.toast('找不到这条暂存实体');
        const ent = asset.entity || {};
        const entityId = asset.publishedEntityId || Utils.uuid();
        const payload = {
            id: entityId,
            name: asset.name || ent.name,
            type: asset.entityType || ent.type || '其他',
            desc: asset.desc || ent.desc || ent.description || asset.content || '',
            relations: Array.isArray(asset.relations || ent.relations) ? (asset.relations || ent.relations) : [],
            tags: asset.tags || ['融合', '工作台', '暂存发布'],
            source: 'fusion_workbench',
            sourceAssetId: id,
            updatedAt: Date.now()
        };
        await DB.put('entities', payload);
        await DB.put('vectors', {
            id: entityId,
            content: `[${payload.type}] ${payload.name}: ${payload.desc}`,
            vector: Array.from({ length: 1536 }, () => Math.random()),
            timestamp: Date.now()
        });
        asset.publishedEntityId = entityId;
        asset.publishedAt = Date.now();
        await DB.put('assets', asset);
        if (Modules.world_engine) {
            Modules.world_engine._cachedEntities = null;
            Modules.world_engine._cachedLayeredGraphs = null;
            try { Modules.world_engine._refreshEntities?.(); } catch(e) {}
            try { await Modules.world_engine.rebuildLayeredGraphs?.('fusion_workbench_publish', { silent: true }); } catch(e) {}
        }
        await this.refresh();
        UI.toast('已从拆书弹药库送入世界引擎');
    },

    async publishCycleToWorld(id) {
        const item = await DB.get('settings', id);
        if (!item) return UI.toast('找不到这条循环融合');
        if (!Modules.world_engine?.syncCycle) return UI.toast('世界引擎未就绪');
        const cycleData = {
            id: id.replace(/^fwb_/, ''),
            bookId: item.bookId || 'fusion_workbench',
            startChapter: item.startChapter,
            endChapter: item.endChapter,
            cycleNum: item.cycleNum,
            cycleSize: item.cycleSize,
            fusionEssence: item.fusionEssence || item.content || '',
            compareResult: item.compareResult || '',
            entityNames: item.entityNames || [],
            chapterIds: item.chapterIds || [],
            nexusCHR: item.nexusCHR || [],
            nexusWLD: item.nexusWLD || [],
            nexusFOE: item.nexusFOE || [],
            nexusEMO: item.nexusEMO || [],
            createdAt: item.createdAt || Date.now()
        };
        await Modules.world_engine.syncCycle(cycleData);
        item.publishedCycleId = cycleData.id;
        item.publishedAt = Date.now();
        await DB.put('settings', item);
        await this.refresh();
        UI.toast('已从拆书弹药库同步循环数据到世界引擎');
    },

    _emptyState(text, icon, color) {
        return `
        <div class=
```

## AIP174 ? (???) ? line 291 ? string ? 1393 chars

```text
></i>去拆书
            </button>
        </div>`;
    },

    _matchesSearch(text) {
        if (!this._search) return true;
        return (text || '').toLowerCase().includes(this._search.toLowerCase());
    },

    // ───────────────────────────────────────────
    // 流水线实时监控
    // ───────────────────────────────────────────
    _renderPipelineMonitorInner() {
        const FB = Modules.fusion_book;
        if (!FB) return '';

        const isRunning = FB._pipelineRunning;
        const isPaused = FB._pipelinePaused;
        const hasSaved = FB._savedPipelineState;
        const stats = FB._linearStats || FB._agentScheduler?._stats || { pending: 0, running: 0, done: 0, failed: 0, total: 0, startTime: 0 };
        const phase = FB._linearPhase || FB._agentScheduler?._phase || 0;
        const results = FB._pipelineResults || {};

        // 计算进度
        const totalPairs = stats.total || FB._plConfig?.leftChapters?.length || 0;
        const doneCount = stats.done;
        const progressPct = totalPairs > 0 ? Math.round((doneCount / totalPairs) * 100) : 0;
        const elapsedMin = stats.startTime ? ((Date.now() - stats.startTime) / 60000).toFixed(1) : '0.0';
        const speed = elapsedMin > 0 ? (doneCount / parseFloat(elapsedMin)).toFixed(1) : '0.0';

        // ── 未启动 ──
        if (!isRunning && !isPaused && !hasSaved) {
            return `
            <div class=
```

## AIP175 ? (???) ? line 333 ? string ? 341 chars

```text
></i>启动流水线
                    </button>
                </div>
            </div>`;
        }

        // ── 有保存进度但未运行 ──
        if (!isRunning && !isPaused && hasSaved) {
            const completed = hasSaved.completedPairs?.length || 0;
            const total = hasSaved.pairs?.length || 0;
            return `
            <div class=
```

## AIP176 ? (???) ? line 356 ? string ? 324 chars

```text
></i>重新配置
                        </button>
                    </div>
                </div>
            </div>`;
        }

        // ── 运行中 / 已暂停 ──
        const statusColor = isPaused ? 'amber' : 'green';
        const statusText = isPaused ? '⏸ 已暂停' : '🚀 运行中';
        const statusDot = isPaused ? '' : '<span class=
```

## AIP177 ? (???) ? line 366 ? string ? 1636 chars

```text
>●</span>';

        // 阶段指示器
        const phases = [
            { num: 1, name: '分析', color: 'blue' },
            { num: 2, name: '融合', color: 'purple' },
            { num: 3, name: '循环', color: 'cyan' },
            { num: 4, name: FB._plConfig?.flowMode === 'creative' ? '创作' : '入库', color: 'orange' }
        ];

        // 实时写入状态
        const stepCards = [
            { key: 'left', label: '左书分析', color: 'blue', result: results.left },
            { key: 'right', label: '右书分析', color: 'pink', result: results.right },
            { key: 'compare', label: '对比', color: 'amber', result: results.compare },
            { key: 'fusion', label: '融合', color: 'green', result: results.fusion },
            { key: 'outline', label: '📋细纲', color: 'cyan', result: results.outline },
            { key: 'world', label: '实体提取', color: 'cyan', result: results.world },
            { key: 'write', label: '正文', color: 'purple', result: results.write }
        ];

        const stepHtml = stepCards.map(s => {
            const len = (s.result || '').length;
            const hasData = len > 0;
            const isActive = isRunning && !isPaused && !hasData;
            const bgClass = isActive ? `bg-${s.color}-500/10 border-${s.color}-500/30` : (hasData ? `bg-${s.color}-500/5 border-${s.color}-500/20` : 'bg-white/[0.02] border-white/5');
            const dotClass = isActive ? `bg-${s.color}-400 animate-pulse` : (hasData ? `bg-${s.color}-400` : 'bg-white/10');
            const textClass = isActive ? `text-${s.color}-400` : (hasData ? `text-${s.color}-400` : 'text-dim');
            const statusIcon = isActive ? '<i class=
```

## AIP178 ? (???) ? line 400 ? string ? 144 chars

```text
>${s.label}</span>
                    </div>
                    ${statusIcon}
                </div>
                ${hasData ? `<span class=
```

## AIP179 ? (???) ? line 438 ? string ? 81 chars

```text
>${p.num}${p.name}</span>
                            ${p.num < 4 ? '<span class=
```

## AIP180 ? (???) ? line 445 ? string ? 140 chars

```text
>${doneCount}/${totalPairs || '?'} (${progressPct}%)</span>
                </div>
                <!-- 进度统计 -->
                <div class=
```

## AIP181 ? (???) ? line 459 ? string ? 222 chars

```text
>
                        ${stepHtml}
                    </div>
                </div>
                <!-- 当前输出预览 -->
                ${(results.fusion || results.outline || results.write) ? `
                <div class=
```

# ???assets/js/modules_split/library/library_reader.js

## AIP182 ? prompt ? line 62 ? template ? 295 chars

```text
请从以下文本中提取所有重要实体，按类型分类输出JSON格式：

文本：
${...}

要求提取的实体类型：
- 人物：主要角色、重要配角
- 物品：关键道具、法宝、神器
- 地点：重要场景、城市、秘境
- 势力：门派、组织、家族
- 魔法：功法、技能、特殊能力
- 情节：关键事件、转折点

输出格式（严格JSON）：
{
  "人物": [{"name":"名称", "desc":"简短描述"}],
  "物品": [...],
  "地点": [...],
  "势力": [...],
  "魔法": [...],
  "情节": [...]
}

只输出JSON，不要其他内容。
```

## AIP183 ? (???) ? line 481 ? string ? 84 chars

```text
>${s.totalWords?.toLocaleString() || 0}</span></div>
                    <div class=
```

## AIP184 ? (???) ? line 483 ? string ? 88 chars

```text
>${s.avgChapterLen?.toLocaleString() || 0}字</span></div>
                    <div class=
```

## AIP185 ? (???) ? line 525 ? string ? 255 chars

```text
>${typeof marked !== 'undefined' ? marked.parse(result) : result}</div>
                    </div>`;
                log.scrollTop = log.scrollHeight;
            }
        } catch (e) {
            if (log) {
                log.innerHTML += `<div class=
```

## AIP186 ? (???) ? line 567 ? string ? 255 chars

```text
>${typeof marked !== 'undefined' ? marked.parse(result) : result}</div>
                    </div>`;
                log.scrollTop = log.scrollHeight;
            }
        } catch (e) {
            if (log) {
                log.innerHTML += `<div class=
```

## AIP187 ? if() ? line 573 ? string ? 2527 chars

```text
>提取失败: ${e.message}</div>`;
            }
        }
    },

    // ═══════════════════════════════════════════════════════════
    // RAG深度集成
    // ═══════════════════════════════════════════════════════════
    indexBookToRAG: async (bookId) => {
        const RC = Modules.reader_center;
        const book = await DB.get('library_books', bookId);
        if (!book) return UI.toast('找不到书籍');
        if (typeof RAGSystem === 'undefined') return UI.toast('RAG系统未加载');
        const content = book.content || '';
        const chunks = RC.chapters.length > 0 ? RC.chapters : RC.smartChapterDetect(content);
        let indexed = 0;
        for (const chunk of chunks) {
            try {
                await RAGSystem.addDocument(
                    `${book.name} - ${chunk.title}`,
                    chunk.content || content.slice(chunk.start, chunk.end),
                    'library',
                    {
                        bookId,
                        bookName: book.name,
                        chapter: chunk.number,
                        chapterTitle: chunk.title
                    }
                );
                indexed++;
            } catch (e) {
                console.log('RAG索引失败:', e);
            }
        }
        UI.toast(`已索引 ${indexed} 个片段到RAG`);
    },

    searchInRAG: async (query) => {
        if (typeof RAGSystem === 'undefined') return [];
        try {
            const results = await RAGSystem.search(query, 10);
            return results;
        } catch (e) {
            console.log('RAG搜索失败:', e);
            return [];
        }
    },

    // ═══════════════════════════════════════════════════════════
    // 阅读增强工具
    // ═══════════════════════════════════════════════════════════
    quickTranslate: async () => {
        const RC = Modules.reader_center;
        const sel = window.getSelection();
        const text = sel ? sel.toString().trim() : '';
        if (!text) return UI.toast('请先选择文本');
        try {
            const result = await AI.generate(`翻译以下中文为英文，保持文学性：

${text}`);
            UI.toast(result, 3000);
        } catch (e) {
            UI.toast('翻译失败');
        }
    },

    quickExplain: async () => {
        const RC = Modules.reader_center;
        const sel = window.getSelection();
        const text = sel ? sel.toString().trim() : '';
        if (!text) return UI.toast('请先选择文本');
        const context = await RC.buildReadingContext(text, { maxTokens: 2000 });
        const prompt = `${context}

请解释以下选中文本的含义、背景和写作手法：
```

## AIP188 ? (???) ? line 655 ? string ? 255 chars

```text
>${typeof marked !== 'undefined' ? marked.parse(result) : result}</div>
                    </div>`;
                log.scrollTop = log.scrollHeight;
            }
        } catch (e) {
            if (log) {
                log.innerHTML += `<div class=
```

# ???assets/js/modules_split/memory/memory_core.js

## AIP189 ? (???) ? line 367 ? string ? 1636 chars

```text
/g,
            /「([^」]+)」/g
        ];

        for (const pattern of entityPatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                if (match[1].length >= 2 && match[1].length <= 20) {
                    entities.push(match[1]);
                }
            }
        }

        const relationPatterns = [
            /(.+?)是(.+?)的(.+)/g,
            /(.+?)与(.+?)的关系/g,
            /(.+?)属于(.+)/g
        ];

        for (const pattern of relationPatterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                if (match[1] && match[2]) {
                    relations.push(`${match[1]} -> ${match[2]}`);
                }
            }
        }

        if (entities.length > 0 || relations.length > 0) {
            await this.addPersistent(
                `[自动提取] 实体: ${entities.slice(0, 10).join(', ')} | 关系: ${relations.slice(0, 5).join('; ')}`,
                'auto_extract',
                0.5,
                [...keywords, 'auto', source],
                { source, entities, relations }
            );
        }

        return { entities: [...new Set(entities)], relations: [...new Set(relations)], keywords };
    },
    _extractKeywords(text) {
        const stopWords = new Set(['的', '了', '是', '在', '有', '和', '与', '或', '这', '那', '他', '她', '它', '我', '你', '们', '着', '过', '会', '能', '可以', '但是', '因为', '所以', '如果', '虽然', '但是', '然而', '而且', '或者', '以及', '还是', '不是', '没有', '什么', '怎么', '为什么', '哪里', '谁', '多少', '几', '第', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']);

        const words = text.split(/[\s,，。！？、；：
```

## AIP190 ? (???) ? line 410 ? string ? 10608 chars

```text
''【】「」《》
	]+/).filter(w => 
            w.length >= 2 && w.length <= 10 && !stopWords.has(w)
        );

        const freq = {};
        words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });

        return Object.entries(freq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word]) => word);
    },
    async smartCompress() {
        const workingCount = this.working.length;
        const persistent = await this.getAllPersistent();

        if (workingCount < 10 && persistent.length < 50) {
            return { compressed: false, reason: '数据量不足' };
        }

        let summary = '';
        const allContent = [
            ...this.working.map(m => `[${m.type}/${m.module || 'general'}] ${m.content}`),
            ...persistent.slice(-20).map(m => `[${m.category}] ${m.content}`)
        ].join('
');

        try {
            await AI.generate(
                `你是记忆压缩引擎。将以下记忆内容压缩为精炼摘要，保留关键信息、人物、情节、设定要点。按模块分类输出，不超过800字：

${allContent.slice(0, 6000)}`,
                {}, c => { summary += c; }
            );

            if (summary.length > 50) {
                await this.addPersistent('[智能压缩摘要] ' + summary, 'compress', 0.8, ['ai_compress', 'auto']);

                const oldWorking = this.working.length;
                this.working = this.working.filter(m => m.priority >= 4);
                this._moduleChannels = {};

                return {
                    compressed: true,
                    summary,
                    workingBefore: oldWorking,
                    workingAfter: this.working.length
                };
            }
        } catch(e) {
            console.warn('智能压缩失败:', e);
        }

        return { compressed: false, reason: 'AI生成失败' };
    },
    async getMemoryStats() {
        const stats = await this.getStats();
        const persistent = await this.getAllPersistent();

        const typeDistribution = {};
        const moduleDistribution = {};
        const timeDistribution = { today: 0, week: 0, month: 0, older: 0 };

        const now = Date.now();
        const day = 86400000;

        for (const m of persistent) {
            typeDistribution[m.category] = (typeDistribution[m.category] || 0) + 1;
            if (m.module) moduleDistribution[m.module] = (moduleDistribution[m.module] || 0) + 1;

            const age = now - (m.ts || 0);
            if (age < day) timeDistribution.today++;
            else if (age < day * 7) timeDistribution.week++;
            else if (age < day * 30) timeDistribution.month++;
            else timeDistribution.older++;
        }

        return {
            ...stats,
            typeDistribution,
            moduleDistribution,
            timeDistribution,
            avgContentLength: persistent.length > 0 
                ? Math.round(persistent.reduce((s, m) => s + (m.content?.length || 0), 0) / persistent.length)
                : 0,
            topTags: this._getTopTags(persistent)
        };
    },
    _getTopTags(memories) {
        const tagFreq = {};
        for (const m of memories) {
            for (const tag of (m.tags || [])) {
                tagFreq[tag] = (tagFreq[tag] || 0) + 1;
            }
        }
        return Object.entries(tagFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15)
            .map(([tag, count]) => ({ tag, count }));
    },
    async syncWithWorldEngine() {
        try {
            const entities = await DB.getAll('entities') || [];
            let synced = 0;

            for (const entity of entities) {
                if (!entity.id?.startsWith('world_') && entity.name) {
                    const existingMemories = await this.getEntityMemories(entity.id);
                    if (existingMemories.length === 0) {
                        await this.addEntityMemory(entity.id, 
                            `[实体创建] ${entity.type || '未知'}: ${entity.name} - ${(entity.desc || '').slice(0, 100)}`,
                            'creation'
                        );
                        synced++;
                    }
                }
            }

            return { synced, total: entities.length };
        } catch(e) {
            console.warn('同步世界引擎失败:', e);
            return { synced: 0, error: e.message };
        }
    },
    async buildContextForGeneration(query, chapterNum = null, maxTokens = 5000) {
        let context = '';
        let tokens = 0;

        // 获取当前章节对应的cycleId
        let cycleId = null;
        if (chapterNum && typeof Modules !== 'undefined' && Modules.fusion_book) {
            const cy = Modules.fusion_book.getCycleFusionForChapter?.(chapterNum);
            if (cy) cycleId = cy.id;
        }

        const brainCtx = await this.buildBrainContext(query, {
            moduleName: 'writer',
            chapterId: chapterNum ? `ch_${chapterNum}` : null,
            chapterNum,
            cycleId,
            maxTokens: maxTokens * 0.6,
            includeWorking: true,
            includePersistent: true,
            includeRAG: true,
            includeEntities: true,
            includeWorldView: true,
            includeFusion: true,
            includeNexus: true,
            includeCycle: true
        });
        context += brainCtx;
        tokens += Math.ceil(brainCtx.length / 2);

        if (chapterNum && tokens < maxTokens) {
            try {
                const chapters = await DB.getAll('chapters') || [];
                const currentChapter = chapters.find(c => c.chapterNum === chapterNum || c.index === chapterNum - 1);
                if (currentChapter) {
                    if (currentChapter.outline) {
                        context += `
【本章大纲】
${currentChapter.outline.slice(0, 500)}
`;
                    }
                    if (currentChapter.content) {
                        context += `
【已写内容】
${currentChapter.content.slice(-1000)}
`;
                    }
                }

                const prevChapter = chapters.find(c => c.chapterNum === chapterNum - 1 || c.index === chapterNum - 2);
                if (prevChapter && prevChapter.content) {
                    context += `
【前章结尾】
${prevChapter.content.slice(-500)}
`;
                }
            } catch(e) {}
        }

        return context;
    },

    // ═══════════════════════════════════════════════════════════════
    // ★ Phase 4: 永久记忆层 + 记忆可视化 + 自动转化
    // ═══════════════════════════════════════════════════════════════

    // —— 永久记忆（永不衰减，用户主动标记）——
    async addPermanent(content, category = 'fact', tags = [], meta = {}) {
        const item = {
            id: 'perm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            content, category, tags, ts: Date.now(),
            source: meta.source || 'manual', module: meta.module || '',
            projectId: meta.projectId || this._projectId || null
        };
        this._permanent.push(item);
        // 持久化
        try {
            await DB.put('settings', { id: 'memory_permanent', items: this._permanent });
        } catch(e) {}
        return item;
    },

    async loadPermanent() {
        try {
            const saved = await DB.get('settings', 'memory_permanent');
            if (saved && saved.items) this._permanent = saved.items;
        } catch(e) { this._permanent = []; }
    },

    async searchPermanent(query, limit = 10) {
        if (!this._permanent.length) await this.loadPermanent();
        const q = query.toLowerCase();
        return this._permanent
            .filter(m => m.content.toLowerCase().includes(q) || (m.tags || []).some(t => t.toLowerCase().includes(q)))
            .slice(0, limit);
    },

    // —— 记忆可视化图谱 ——
    async buildMemoryGraph(options = {}) {
        const { maxNodes = 50, includeWorking = true, includePersistent = true, includePermanent = true } = options;
        const nodes = [];
        const edges = [];
        const nodeMap = new Map();
        let id = 0;

        const addNode = (data, group) => {
            const key = data.id || data.content?.slice(0, 50);
            if (nodeMap.has(key)) return nodeMap.get(key);
            const n = { id: id++, label: data.content?.slice(0, 30) || data.name || '...', group, data };
            nodes.push(n);
            nodeMap.set(key, n.id);
            return n.id;
        };

        // 工作记忆节点
        if (includeWorking) {
            for (const m of this.working.slice(-maxNodes / 3)) {
                addNode(m, 'working');
            }
        }

        // 长期记忆节点
        if (includePersistent) {
            const persistent = await this.getAllPersistent();
            for (const m of persistent.slice(-maxNodes / 3)) {
                addNode(m, 'persistent');
            }
        }

        // 永久记忆节点
        if (includePermanent) {
            for (const m of this._permanent.slice(-maxNodes / 3)) {
                addNode(m, 'permanent');
            }
        }

        // 构建边：基于标签相似度
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const a = nodes[i], b = nodes[j];
                const tagsA = new Set(a.data.tags || []);
                const tagsB = new Set(b.data.tags || []);
                const common = [...tagsA].filter(t => tagsB.has(t));
                if (common.length > 0) {
                    edges.push({
                        source: a.id, target: b.id,
                        label: common[0],
                        weight: common.length
                    });
                }
                // 模块关联
                if (a.data.module && a.data.module === b.data.module) {
                    edges.push({ source: a.id, target: b.id, label: a.data.module, weight: 0.5 });
                }
            }
        }

        return { nodes, edges, stats: { nodeCount: nodes.length, edgeCount: edges.length } };
    },

    // —— 记忆 → 实体 自动转化 ——
    async convertMemoryToEntity(memoryId, options = {}) {
        const { autoCreate = false, targetType = 'character' } = options;

        // 查找记忆
        let memory = this.working.find(m => m.id === memoryId);
        if (!memory) {
            const persistent = await this.getAllPersistent();
            memory = persistent.find(m => m.id === memoryId);
        }
        if (!memory) {
            memory = this._permanent.find(m => m.id === memoryId);
        }
        if (!memory) return { success: false, error: '记忆不存在' };

        const content = memory.content;

        // 使用 AI 提取实体信息
        let extractResult = '';
        try {
            await AI.generate(
                `从以下记忆中提取实体信息，以JSON格式返回：
{
```

## AIP191 ? (???) ? line 711 ? template ? 1183 chars

```text
,
                {}, c => { extractResult += c; }
            );
        } catch(e) {
            return { success: false, error: 'AI提取失败: ' + e.message };
        }

        // 解析 JSON
        let entity = null;
        try {
            const jsonMatch = extractResult.match(/\{[\s\S]*\}/);
            if (jsonMatch) entity = JSON.parse(jsonMatch[0]);
        } catch(e) {}

        if (!entity || !entity.name) {
            return { success: false, error: '无法提取有效实体', raw: extractResult };
        }

        if (autoCreate && typeof Modules !== 'undefined' && Modules.world_engine) {
            // 自动创建到世界引擎
            const entId = 'ent_' + Date.now();
            const newEntity = {
                id: entId, name: entity.name, type: entity.type || targetType,
                description: entity.description || content.slice(0, 200),
                desc: entity.description || content.slice(0, 200),
                tags: entity.tags || [], relations: entity.relations || [],
                source: 'memory_convert', createdAt: Date.now()
            };
            await DB.put('entities', newEntity);
            return { success: true, entity: newEntity, message:
```

# ???assets/js/modules_split/phoenix/phoenix_core.js

## AIP192 ? (???) ? line 41 ? template ? 5428 chars

```text
/g, '')
            .trim();
    },

    _isVolumeHeadingTitle(title) {
        return /^第\s*[一二三四五六七八九十百千万零〇两0-9]+\s*卷(?:[：:\s]|$)/.test(String(title || '').trim());
    },

    _isChapterHeadingTitle(title) {
        return /^第\s*[一二三四五六七八九十百千万零〇两0-9]+\s*章(?:[：:\s]|$)/.test(String(title || '').trim());
    },

    _isOutlineStructureHeading(rawLine) {
        const title = this._cleanOutlineHeading(rawLine);
        return this._isVolumeHeadingTitle(title) || this._isChapterHeadingTitle(title);
    },

    _parseOutlineStructureLegacy(outline) {
        const lines = String(outline || '').split('\n');
        const volumes = [];
        const chapters = [];
        let currentVol = null;
        let volOrder = 1;
        let chapOrder = 1;
        const collectOutline = index => {
            const parts = [];
            for(let j = index + 1; j < lines.length; j++) {
                const nextLine = lines[j].trim();
                if(nextLine.startsWith('#')) break;
                parts.push(lines[j]);
            }
            return parts.join('\n').trim();
        };
        lines.forEach((rawLine, index) => {
            const line = rawLine.trim();
            if(!line) return;
            if(/^##\s+/.test(line) && !/^###\s+/.test(line)) {
                currentVol = {
                    title: this._cleanOutlineHeading(line),
                    order: volOrder++
                };
                volumes.push(currentVol);
                return;
            }
            if(/^###\s+/.test(line)) {
                if(!currentVol) {
                    currentVol = { title: '正文卷', order: volOrder++ };
                    volumes.push(currentVol);
                }
                chapters.push({
                    title: this._cleanOutlineHeading(line),
                    order: chapOrder++,
                    volumeOrder: currentVol.order,
                    volumeTitle: currentVol.title,
                    outline: collectOutline(index) || '从凤凰流导入'
                });
            }
        });
        return { volumes, chapters };
    },

    _parseOutlineStructureForSync(outline) {
        const lines = String(outline || '').split('\n');
        const volumes = [];
        const chapters = [];
        let currentVol = null;
        let volOrder = 1;
        let chapOrder = 1;
        const collectOutline = index => {
            const parts = [];
            for(let j = index + 1; j < lines.length; j++) {
                if(this._isOutlineStructureHeading(lines[j])) break;
                parts.push(lines[j]);
            }
            return parts.join('\n').trim();
        };
        lines.forEach((rawLine, index) => {
            const title = this._cleanOutlineHeading(rawLine);
            if(!title) return;
            if(this._isVolumeHeadingTitle(title)) {
                currentVol = { title, order: volOrder++ };
                volumes.push(currentVol);
                return;
            }
            if(this._isChapterHeadingTitle(title)) {
                if(!currentVol) {
                    currentVol = { title: '正文卷', order: volOrder++ };
                    volumes.push(currentVol);
                }
                chapters.push({
                    title,
                    order: chapOrder++,
                    volumeOrder: currentVol.order,
                    volumeTitle: currentVol.title,
                    outline: collectOutline(index) || '从凤凰流导入'
                });
            }
        });
        if(!volumes.length && !chapters.length) return this._parseOutlineStructureLegacy(outline);
        return { volumes, chapters };
    },

    _getOutlineStructureStats(outline) {
        const parsed = this._parseOutlineStructureForSync(outline);
        return {
            volumes: parsed.volumes || [],
            chapters: parsed.chapters || [],
            volCount: (parsed.volumes || []).length,
            chapCount: (parsed.chapters || []).length
        };
    },

    // ===== 获取流水线状态摘要 =====
    _getPipelineStatus() {
        const FB = Modules.fusion_book;
        if (!FB) return { hasData: false };
        const allPr = FB._allPipelineResults || {};
        const pr = FB._pipelineResults || {};
        const merged = {};
        ['left','right','compare','fusion','world','outline','write'].forEach(k => {
            merged[k] = (allPr[k] && allPr[k].trim()) ? allPr[k] : (pr[k] || '');
        });
        
        // ★ 如果内存中没有融合精华，用缓存的DB数据
        if (!merged.fusion && this._cachedFusion) merged.fusion = this._cachedFusion;
        
        const hasData = !!(merged.left || merged.right || merged.compare || merged.fusion || merged.world || merged.outline || merged.write);
        const running = !!FB._pipelineRunning;
        // ★ 主辅锚定信息
        const primaryBook = FB._primaryBook || 'left';
        const primarySettings = FB._primarySettings;
        const primaryName = primarySettings?.bookName || (primaryBook === 'left' ? '左书' : '右书');
        const secondaryName = primaryBook === 'left' ? '右书' : '左书';
        const steps = [];
        if (merged.left) steps.push({ key:'left', label:'左书拆解', len: merged.left.length });
        if (merged.right) steps.push({ key:'right', label:'右书拆解', len: merged.right.length });
        if (merged.compare) steps.push({ key:'compare', label:'对比结论', len: merged.compare.length });
        if (merged.fusion) steps.push({ key:'fusion', label:
```

## AIP193 ? (???) ? line 178 ? template ? 2000 chars

```text
, len: merged.fusion.length });
        if (merged.world) steps.push({ key:'world', label:'实体提取', len: merged.world.length });
        if (merged.outline) steps.push({ key:'outline', label:'细纲', len: merged.outline.length });
        if (merged.write) steps.push({ key:'write', label:'正文', len: merged.write.length });
        return { hasData, running, steps, results: merged, primaryBook: primaryName, secondaryBook: secondaryName };
    },
    _cachedFusion: null,

    // ★ 初始化: 从DB加载持久化的融合精华
    async init() {
        try {
            const saved = await DB.get('settings', 'pipeline_fusion_context');
            if (saved && saved.content) this._cachedFusion = saved.content;
        } catch(e) {}
        try {
            const modeData = typeof GenesisCore !== 'undefined' && GenesisCore.getModeData
                ? await GenesisCore.getModeData()
                : null;
            const importedOutline = modeData?.outlineRaw || modeData?.phoenixOutline || modeData?.globalOutline || modeData?.importedOutlineRaw || '';
            if (importedOutline && !this.data.outlineRaw) this.data.outlineRaw = importedOutline;
            if (modeData?.bookBrief && !this.data.idea) this.data.idea = modeData.bookBrief;
        } catch(e) {}
    },

    // ===== 获取融合拆书全量上下文(用于AI生成) =====
    _getFusionFullContext() {
        const ps = this._getPipelineStatus();
        if (!ps.hasData) return '';
        let ctx = '[技法来源声明] 以下内容全部来自拆书融合的"去内容化"通用写作技法模板，严禁复用原书的角色、情节、场景。目标是：同样的技法，完全不同的故事。\n\n';
        if (ps.results.fusion) ctx += '【融合技法精华（通用模板）】\n' + ps.results.fusion.slice(0, 4000) + '\n\n';
        if (ps.results.compare) ctx += '【技法对比（去内容化）】\n' + ps.results.compare.slice(0, 2000) + '\n\n';
        if (ps.results.left) ctx += '【左书技法拆解】\n' + ps.results.left.slice(0, 2000) + '\n\n';
        if (ps.results.right) ctx += '【右书技法拆解】\n' + ps.results.right.slice(0, 2000) + '\n\n';
        return ctx;
    },

    render() {
        const ps = this._getPipelineStatus();
        return
```

## AIP194 ? class ? line 259 ? string ? 93 chars

```text
flex items-center gap-2 text-[10px] ${this.data.worldContext ? 'text-green-400' : 'text-dim'}
```

## AIP195 ? class ? line 264 ? string ? 94 chars

```text
flex items-center gap-2 text-[10px] ${this.data.memoryContext ? 'text-green-400' : 'text-dim'}
```

## AIP196 ? class ? line 434 ? string ? 98 chars

```text
tab-btn flex-1 p-2.5 text-[10px] font-bold text-center cursor-pointer ${t==='preview'?'active':''}
```

## AIP197 ? class ? line 435 ? string ? 130 chars

```text
tab-btn flex-1 p-2.5 text-[10px] font-bold text-center cursor-pointer ${t==='fusion'?'active':''} ${hasFusion?'text-amber-400':''}
```

## AIP198 ? class ? line 438 ? string ? 131 chars

```text
tab-btn flex-1 p-2.5 text-[10px] font-bold text-center cursor-pointer ${t==='pipeline'?'active':''} ${ps.hasData?'text-red-400':''}
```

## AIP199 ? (???) ? line 605 ? template ? 1669 chars

```text
;
    },

    _viewPipelineStep(key) {
        const ps = this._getPipelineStatus();
        if (!ps.results[key]) return;
        const labels = { left:'左书拆解', right:'右书拆解', compare:'对比结论', fusion:'融合精华', world:'实体提取', outline:'细纲', write:'正文' };
        const el = document.getElementById('ph-pp-content');
        const title = document.getElementById('ph-pp-title');
        if (el) el.value = ps.results[key];
        if (title) title.textContent = labels[key] + ' (' + ps.results[key].length + '字)';
        document.querySelectorAll('[id^="ph-pp-btn-"]').forEach(btn => {
            btn.classList.remove('bg-white/10', 'border-white/10');
            btn.classList.add('border-transparent');
        });
        const activeBtn = document.getElementById('ph-pp-btn-' + key);
        if (activeBtn) { activeBtn.classList.add('bg-white/10', 'border-white/10'); activeBtn.classList.remove('border-transparent'); }
    },

    _pipelineToOutline() {
        const content = (document.getElementById('ph-pp-content') || {}).value;
        if (!content) return UI.toast('没有内容');
        const el = document.getElementById('ph-outline-raw');
        if (el) { el.value = el.value ? el.value + '\n\n---\n\n' + content : content; this.data.outlineRaw = el.value; this._updateStats(); }
        this.tab('preview');
        UI.toast('已追加到细纲');
    },

    _exportPipelineAll() {
        const ps = this._getPipelineStatus();
        if (!ps.hasData) return UI.toast('无数据');
        const labels = { left:'左书拆解', right:'右书拆解', compare:'对比结论', fusion:'融合精华', world:'实体提取', outline:'细纲', write:'正文' };
        let md = '# 流水线全部数据\n\n';
        ps.steps.forEach(s => { md +=
```

# ???assets/js/modules_split/phoenix/phoenix_finish.js

## AIP200 ? _normalizeSyncTitle() ? line 61 ? string ? 16448 chars

```text
'“”‘’\s]/g, '')
            .replace(/[：:，、；;。.!！?？-]/g, '')
            .trim()
            .toLowerCase();
    },

    _filterProjectRows(rows, projectId) {
        if(!projectId) return rows || [];
        if(GenesisCore?.filterProjectItems) return GenesisCore.filterProjectItems(rows || [], projectId);
        return (rows || []).filter(row => !row.projectId || row.projectId === projectId);
    },

    async _syncOutlineStructureToStores(outline, project = null) {
        const activeProject = project || await GenesisCore.getActiveProject?.();
        const projectId = activeProject?.id || '';
        const parsed = this._parseOutlineStructureForSync(outline);
        const existingVolumes = this._filterProjectRows(await DB.getAll('volumes').catch(() => []), projectId);
        const existingChapters = this._filterProjectRows(await DB.getAll('chapters').catch(() => []), projectId);
        const savedVolumes = [];
        const savedChapters = [];
        const byVolumeOrder = new Map();

        for(const vol of parsed.volumes) {
            const norm = this._normalizeSyncTitle(vol.title);
            const existing = existingVolumes.find(v =>
                this._normalizeSyncTitle(v.title || v.name) === norm ||
                ((v.order || 0) === vol.order && (v.source || '').startsWith('phoenix'))
            );
            const id = existing?.id || (projectId ? `ph_${projectId}_vol_${vol.order}` : `ph_vol_${vol.order}_${Utils.uuid()}`);
            const payload = {
                ...(existing || {}),
                id,
                projectId: projectId || existing?.projectId || '',
                title: vol.title,
                order: vol.order,
                source: existing?.source || 'phoenix_outline',
                createdAt: existing?.createdAt || Date.now(),
                updatedAt: Date.now()
            };
            if (typeof GenesisCore !== 'undefined' && GenesisCore.stampProjectRecord) GenesisCore.stampProjectRecord(payload, projectId);
            await DB.put('volumes', payload);
            savedVolumes.push(payload);
            byVolumeOrder.set(vol.order, payload);
        }

        for(const chapter of parsed.chapters) {
            const norm = this._normalizeSyncTitle(chapter.title);
            const existing = existingChapters.find(c =>
                this._normalizeSyncTitle(c.title || c.name) === norm ||
                ((c.order || c.number || 0) === chapter.order && (c.source || '').startsWith('phoenix'))
            );
            const volume = byVolumeOrder.get(chapter.volumeOrder) || savedVolumes[0] || null;
            const id = existing?.id || (projectId ? `ph_${projectId}_ch_${chapter.order}` : `ph_ch_${chapter.order}_${Utils.uuid()}`);
            const payload = {
                ...(existing || {}),
                id,
                projectId: projectId || existing?.projectId || '',
                title: chapter.title,
                content: existing?.content || '',
                outline: chapter.outline || existing?.outline || '从凤凰流导入',
                order: chapter.order,
                number: chapter.order,
                volumeId: volume?.id || existing?.volumeId || null,
                volumeTitle: volume?.title || chapter.volumeTitle || existing?.volumeTitle || '',
                status: existing?.status || ((existing?.content || '').trim() ? 'draft' : 'outline'),
                targetWords: existing?.targetWords || 2500,
                source: existing?.source || 'phoenix_outline',
                createdAt: existing?.createdAt || Date.now(),
                updatedAt: Date.now()
            };
            if (typeof GenesisCore !== 'undefined' && GenesisCore.stampProjectRecord) GenesisCore.stampProjectRecord(payload, projectId);
            await DB.put('chapters', payload);
            savedChapters.push(payload);
        }

        return { volumes: savedVolumes, chapters: savedChapters };
    },

    // ===== 完成时同步世界引擎 =====
    async syncWorldOnFinish(project = null) {
        const outline = this.data.outlineRaw;
        if(!outline) return;
        const activeProject = project || await GenesisCore.getActiveProject?.();
        const projectId = activeProject?.id || '';
        const structure = await this._syncOutlineStructureToStores(outline, activeProject);
        for(const vol of structure.volumes) {
            const title = vol.title;
            const id = 'world_phoenix_' + (vol.id || title).slice(0, 36);
            await DB.put('entities', {
                id,
                projectId,
                name: '凤凰流_' + title,
                type: '情节',
                desc: '来自凤凰创作流的卷级大纲: ' + title,
                source: 'phoenix',
                updatedAt: Date.now()
            });
        }
        // ★ 按循环组织章节（每5章一个循环，自动创建cycle记录）
        const chapMatches = structure.chapters || [];
        if(chapMatches.length > 0 && Modules.world_engine) {
            const cycleSize = 5;
            const totalCycles = Math.ceil(chapMatches.length / cycleSize);
            for(let c = 0; c < totalCycles; c++) {
                const start = c * cycleSize + 1;
                const end = Math.min((c + 1) * cycleSize, chapMatches.length);
                const cycleChapters = chapMatches.slice(start - 1, end);
                await Modules.world_engine.syncCycle({
                    id: `cycle_${start}_${end}`,
                    bookId: activeProject?.id || 'phoenix_export',
                    projectId,
                    startChapter: start,
                    endChapter: end,
                    cycleNum: c + 1,
                    cycleSize,
                    volumeId: cycleChapters[0]?.volumeId || null,
                    fusionEssence: `【凤凰创作流导出】卷级大纲包含 ${structure.volumes.length} 卷 ${chapMatches.length} 章`,
                    entityNames: [],
                    chapterIds: cycleChapters.map(ch => ch.id),
                    nexusCHR: [], nexusWLD: [], nexusFOE: [], nexusEMO: [],
                    createdAt: Date.now()
                });
            }
        }
        try {
            if (typeof MemorySystem !== 'undefined') {
                MemorySystem.addWorking(
                    `[从零写一本/世界引擎同步] 已同步 ${structure.volumes.length} 个卷、${chapMatches.length} 章。细纲需保持 M06、CHR/WLD/FOE/EMO、人物一致和世界规则边界。`,
                    'phoenix_sync',
                    5,
                    { module: 'phoenix', tags: ['从零写一本', '世界引擎', '图谱实体'], source: 'phoenix_finish' }
                );
            }
        } catch(e) {}
        if(Modules.world_engine) {
            Modules.world_engine._cachedEntities = null;
            Modules.world_engine._cachedLayeredGraphs = null;
            await Modules.world_engine.rebuildLayeredGraphs?.('phoenix_sync_outline', { silent: true });
            try { Modules.world_engine._refreshDashboard?.(); } catch(e) {}
            if(Modules.world_engine.currentTab === 'graph') setTimeout(() => Modules.world_engine._initGraph?.(), 100);
        }
        UI.toast('已同步 ' + structure.volumes.length + ' 个卷、' + Math.ceil(chapMatches.length/5) + ' 个循环到世界引擎和记忆');
        return { structure, chapters: chapMatches };
    },

    async _refreshWriterAfterDirectSync(project = null) {
        try {
            const activeProject = project || await GenesisCore.getActiveProject?.();
            if (!activeProject || !Modules.writer) return;
            await Modules.writer.loadTree?.();
            await Modules.writer._loadProjectContext?.();
            const chaps = Modules.writer._scopeRecords
                ? Modules.writer._scopeRecords(await DB.getAll('chapters') || [], activeProject.id).sort((a,b) => (a.order||0) - (b.order||0))
                : (await DB.getAll('chapters') || []).sort((a,b) => (a.order||0) - (b.order||0));
            const current = Modules.writer.currentChapterId ? await DB.get('chapters', Modules.writer.currentChapterId) : null;
            if ((!current || (current.projectId && current.projectId !== activeProject.id)) && chaps.length) {
                const withContent = chaps.find(c => c.content && c.content.trim());
                await Modules.writer.load?.(withContent ? withContent.id : chaps[0].id);
            }
            await Modules.writer.loadTree?.();
        } catch(e) {
            console.warn('[Phoenix] 刷新执笔台失败:', e);
        }
    },

    async _stagePhoenixOutlineToWorkbench(project = null) {
        const outline = this.data.outlineRaw || '';
        if(!outline.trim()) return { volumes: [], chapters: [] };
        const parsed = this._parseOutlineStructureForSync(outline);
        // 兼容旧入口：从零写一本不再暂存到拆书弹药库，结构只走执笔台/世界引擎直连同步。
        if (project?.id && this.syncWorldOnFinish) {
            try { await this.syncWorldOnFinish(project); } catch(e) {}
        }
        return parsed;
    },

    async _syncPhoenixEntitiesToWorldEngine(project = null) {
        const now = Date.now();
        const activeProject = project || await GenesisCore.getActiveProject?.();
        const projectId = activeProject?.id || 'draft';
        const importedWorld = this.data.importedWorld || {};
        const rawEntities = [
            ...(this.data._extractedEntities || []),
            ...(importedWorld.entities || [])
        ];
        const entityResult = this._saveExtractedEntitiesToWorld
            ? await this._saveExtractedEntitiesToWorld(rawEntities, activeProject)
            : { added: 0, updated: 0, total: 0 };

        const labels = { history:'历史与传说', geography:'地理与地貌', magic:'魔法/科技体系', factions:'势力与组织', species:'种族与生物', rules:'世界规则', culture:'文化与习俗' };
        let worldCount = 0;
        for(const [key, desc] of Object.entries(importedWorld.worldview || {})) {
            if(!String(desc || '').trim()) continue;
            const id = `world_phoenix_${projectId}_${key}`;
            const payload = {
                id,
                name: labels[key] || key,
                type: 'world',
                desc: String(desc),
                relations: [],
                source: 'phoenix_world',
                projectId,
                updatedAt: now
            };
            await DB.put('entities', payload);
            try {
                await DB.put('vectors', {
                    id,
                    content: `[世界观·${payload.name}] ${payload.desc}`,
                    vector: Array.from({ length: 1536 }, () => Math.random()),
                    timestamp: now,
                    source: 'phoenix_world',
                    category: key,
                    projectId
                });
            } catch(e) {}
            try {
                if (typeof MemorySystem !== 'undefined') {
                    MemorySystem.addWorking(`[从零写一本/世界规则] ${payload.name}: ${payload.desc}`, 'phoenix_world', 4, {
                        module: 'phoenix',
                        tags: ['从零写一本', '世界引擎', payload.name],
                        source: 'phoenix_world'
                    });
                }
            } catch(e) {}
            worldCount++;
        }
        if (Modules.world_engine) {
            Modules.world_engine._cachedEntities = null;
            Modules.world_engine._cachedLayeredGraphs = null;
            try { await Modules.world_engine._ensureCache?.(); } catch(e) {}
            try { await Modules.world_engine.rebuildLayeredGraphs?.('phoenix_entities_sync', { silent: true }); } catch(e) {}
            try { Modules.world_engine._refreshDashboard?.(); } catch(e) {}
            try { Modules.world_engine._refreshEntities?.(); } catch(e) {}
            if (Modules.world_engine.currentTab === 'graph') {
                try { setTimeout(() => Modules.world_engine._initGraph?.(), 100); } catch(e) {}
            }
        }
        return {
            added: entityResult.added || 0,
            updated: entityResult.updated || 0,
            worldCount,
            total: (entityResult.total || 0) + worldCount
        };
    },

    async _stagePhoenixEntitiesToWorkbench() {
        const result = await this._syncPhoenixEntitiesToWorldEngine();
        return result.total || 0;
    },

    async syncOutlineToWriterAndWorld() {
        const outline = this.data.outlineRaw || (document.getElementById('ph-outline-edit') || {}).value || (document.getElementById('ph-outline-raw') || {}).value || '';
        if(!outline.trim()) return UI.toast('没有可同步的细纲');
        this.data.outlineRaw = outline;
        const project = await GenesisCore.getActiveProject?.();
        const synced = await this.syncWorldOnFinish(project);
        const structure = synced?.structure || { volumes: [], chapters: [] };
        await this._refreshWriterAfterDirectSync(project);
        if (project?.id) await GenesisCore.refreshStats?.(project.id);
        UI.toast(`已同步结构：${structure.volumes?.length || 0}卷 / ${structure.chapters?.length || 0}章 → 执笔台章节树 + 世界引擎循环`);
        return structure;
    },

    async syncExtractedEntitiesToWorld() {
        const count = (this.data._extractedEntities || []).length + ((this.data.importedWorld || {}).entities || []).length + Object.keys((this.data.importedWorld || {}).worldview || {}).length;
        if(!count) return UI.toast('没有可同步的图谱实体', 'error');
        const project = await GenesisCore.getActiveProject?.();
        const result = await this._syncPhoenixEntitiesToWorldEngine(project);
        UI.toast(`已同步到世界引擎：新增${result.added || 0} / 更新${result.updated || 0} / 世界观${result.worldCount || 0}`);
        return result;
    },

    async stageOutlineToWorkbench() {
        return await this.syncOutlineToWriterAndWorld();
    },

    async stageExtractedEntitiesToWorkbench() {
        return await this.syncExtractedEntitiesToWorld();
    },

    // ===== Finish: Direct Sync =====
    async finish() {
        // ★ GenesisCore 项目绑定
        let project = await GenesisCore.getActiveProject();
        if (!project || project.mode !== 'phoenix') {
            const projName = (this.data.idea || this.data.genre || '凤凰创作流项目').slice(0, 30);
            project = await GenesisCore.createProject({
                name: projName,
                mode: 'phoenix',
                metadata: { outline: this.data.outlineRaw, genre: this.data.genre, style: this.data.style }
            });
        }

        const outlineSync = await this.syncWorldOnFinish(project);
        const syncedStructure = outlineSync?.structure || { volumes: [], chapters: [] };
        const entitySync = await this._syncPhoenixEntitiesToWorldEngine(project);

        // ★ 更新项目状态
        await GenesisCore.updateProject(project.id, {
            status: 'synced',
            stageIndex: 3,
            bookId: project.id,
            worldEngineId: project.id,
            chapterCount: syncedStructure.chapters.length,
            wordCount: 0,
            metadata: { ...project.metadata, outline: this.data.outlineRaw, volCount: syncedStructure.volumes.length, syncedAt: Date.now() }
        });

        App.nav('writer');
        await this._refreshWriterAfterDirectSync(project);
        UI.toast(`已直接同步：${syncedStructure.chapters.length}章进入执笔台 / ${entitySync.total || 0}个图谱节点进入世界引擎`, 'success');
    },

    // ===== 导入世界观设定 (新增) =====
    async importWorldSetting() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt,.md,.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (ev) => {
                const content = ev.target.result;
                await this._parseWorldSetting(content, file.name);
            };
            reader.readAsText(file);
        };
        input.click();
    },

    async _parseWorldSetting(content, filename) {
        if (this._generating) return UI.toast('正在生成中，请稍候');
        UI.toast('正在解析世界观设定...');
        this._setGenerating(true);
        
        const prompt = `你是一个专业的世界观解析引擎。请从以下文本中提取世界观设定，并按照指定格式输出。

【输入文本】
${content.slice(0, 8000)}

【提取要求】
请提取以下类型的信息：
1. 人物 - 角色名、身份、性格、外貌、能力、背景
2. 物品 - 武器、法宝、道具、关键物件
3. 地点 - 场景、城市、秘境、地标
4. 势力 - 门派、组织、阵营、国家
5. 种族 - 种族、族群、特殊生物
6. 魔法 - 功法、技能、法术体系
7. 规则 - 世界运行规则、力量等级
8. 文化 - 风俗、信仰、语言、节日
9. 历史 - 历史事件、传说、纪元
10. 技法 - 写作技法、叙事手法

【世界观维度】
同时请将内容归类到以下世界观维度：
- history (历史与传说)
- geography (地理与地貌)
- magic (魔法/科技体系)
- factions (势力与组织)
- species (种族与生物)
- rules (世界规则)
- culture (文化与习俗)

【输出格式】严格JSON：
{
```

## AIP201 ? (???) ? line 440 ? string ? 13554 chars

```text
}

直接输出JSON，不要包裹markdown代码块。`;

        let fullRes = '';
        await AI.generate(prompt, {}, c => { fullRes += c; });

        let parsed = null;
        try {
            let cleanRes = fullRes.trim().replace(/^???(?:json)?\s*\n?/i, '').replace(/\n????\s*$/, '').trim();
            parsed = JSON.parse(cleanRes);
        } catch(e) {
            const m = fullRes.match(/\{[\s\S]*\}/);
            if(m) {
                try { parsed = JSON.parse(m[0]); } catch(e2) {}
            }
        }

        if (!parsed) {
            UI.toast('解析失败，请检查文件格式');
            this._setGenerating(false);
            return;
        }

        let entityCount = 0;
        let worldCount = 0;
        const now = Date.now();

        // 保存实体
        if (parsed.entities && Array.isArray(parsed.entities)) {
            for (const ent of parsed.entities) {
                if (!ent.name) continue;
                const id = 'world_import_' + Utils.uuid();
                await DB.put('entities', {
                    id,
                    name: ent.name,
                    type: ent.type || '其他',
                    desc: ent.desc || ent.description || '',
                    relations: ent.relations || [],
                    source: 'import',
                    file: filename,
                    updatedAt: now
                });
                await DB.put('vectors', {
                    id,
                    content: `[${ent.type || '其他'}] ${ent.name}: ${ent.desc || ent.description || ''}`,
                    vector: Array.from({length: 1536}, () => Math.random()),
                    timestamp: now
                });
                entityCount++;
            }
        }

        // 保存世界观维度
        const catLabels = {
            history: '历史与传说',
            geography: '地理与地貌',
            magic: '魔法/科技体系',
            factions: '势力与组织',
            species: '种族与生物',
            rules: '世界规则',
            culture: '文化与习俗'
        };

        if (parsed.worldview) {
            for (const [cat, desc] of Object.entries(parsed.worldview)) {
                if (!desc || !desc.trim()) continue;
                await DB.put('entities', {
                    id: 'world_' + cat,
                    name: catLabels[cat] || cat,
                    type: 'world',
                    desc: desc,
                    source: 'import',
                    file: filename,
                    updatedAt: now
                });
                worldCount++;
            }
        }

        // 更新世界引擎缓存
        if (Modules.world_engine) {
            Modules.world_engine._cachedEntities = null;
        }

        // ★ 检测导入内容中的循环标记，自动创建循环数据
        const cycleMatches = content.match(/【循环\s*(\d+)[\-~]\s*(\d+)\s*】/g);
        if(cycleMatches && Modules.world_engine) {
            const uniqueCycles = new Set();
            cycleMatches.forEach(m => {
                const nums = m.match(/(\d+)[\-~](\d+)/);
                if(nums) uniqueCycles.add(`${nums[1]}_${nums[2]}`);
            });
            for(const cycleStr of uniqueCycles) {
                const [start, end] = cycleStr.split('_').map(Number);
                await Modules.world_engine.syncCycle({
                    id: `cycle_${start}_${end}`,
                    bookId: 'import_' + filename,
                    startChapter: start,
                    endChapter: end,
                    cycleNum: Math.ceil(end / 5),
                    cycleSize: end - start + 1,
                    fusionEssence: `【导入来源】${filename}\n包含循环标记 ${start}-${end} 的技法/世界观数据`,
                    entityNames: (parsed.entities || []).map(e => e.name),
                    chapterIds: [],
                    nexusCHR: [], nexusWLD: [], nexusFOE: [], nexusEMO: [],
                    createdAt: Date.now()
                });
            }
        }

        // 将摘要注入到大纲
        if (parsed.summary) {
            const el = document.getElementById('ph-outline-edit');
            if (el) {
                const header = `# 世界观设定\n\n> 来源：${filename}\n> 概述：${parsed.summary}\n\n---\n\n`;
                el.value = header + el.value;
                this.data.outlineRaw = el.value;
                this.updatePreview();
            }
        }

        this._setGenerating(false);
        UI.toast(`导入成功！实体: ${entityCount}个，世界观维度: ${worldCount}个${cycleMatches ? '，循环:'+cycleMatches.length+'个' : ''}`);
    },

    // ===== 注入到实体管理 =====
    async _injectToEntities() {
        const worldData = this.data.importedWorld || {};
        const entities = worldData.entities || [];
        
        if (entities.length === 0) {
            return UI.toast('没有可注入的实体');
        }

        let addedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        const now = Date.now();
        
        await Modules.world_engine._ensureCache();
        const existingEntities = Modules.world_engine._cachedEntities || [];
        const existingNameMap = new Map();
        existingEntities.forEach(e => {
            if (e.name) {
                existingNameMap.set(e.name.toLowerCase(), e);
            }
        });
        
        for (const ent of entities) {
            if (!ent.name) continue;
            
            const normalizedName = ent.name.toLowerCase();
            const existingEntity = existingNameMap.get(normalizedName);
            
            if (existingEntity) {
                if (existingEntity.desc !== ent.desc || 
                    existingEntity.type !== ent.type) {
                    const entityData = {
                        id: existingEntity.id,
                        name: ent.name,
                        type: ent.type || existingEntity.type || '其他',
                        desc: ent.desc || existingEntity.desc,
                        relations: ent.relations || existingEntity.relations || [],
                        source: existingEntity.source || 'phoenix',
                        updatedAt: now
                    };
                    await DB.put('entities', entityData);
                    
                    await DB.put('vectors', {
                        id: existingEntity.id,
                        content: `[${entityData.type}] ${ent.name}: ${entityData.desc}`,
                        vector: Array.from({ length: 1536 }, () => Math.random()),
                        timestamp: now,
                        source: 'phoenix',
                        entityName: ent.name,
                        entityType: entityData.type
                    });
                    updatedCount++;
                } else {
                    skippedCount++;
                }
            } else {
                const id = 'phoenix_ent_' + Utils.uuid();
                const entityData = {
                    id,
                    name: ent.name,
                    type: ent.type || '其他',
                    desc: ent.desc || '',
                    relations: ent.relations || [],
                    source: 'phoenix',
                    updatedAt: now
                };
                await DB.put('entities', entityData);
                
                await DB.put('vectors', {
                    id,
                    content: `[${ent.type || '其他'}] ${ent.name}: ${ent.desc || ''}`,
                    vector: Array.from({ length: 1536 }, () => Math.random()),
                    timestamp: now,
                    source: 'phoenix',
                    entityName: ent.name,
                    entityType: ent.type || '其他'
                });
                addedCount++;
            }
        }
        
        if (Modules.world_engine) {
            Modules.world_engine._cachedEntities = null;
            if (Modules.world_engine.currentTab === 'entities') {
                setTimeout(() => Modules.world_engine._refreshEntities(), 100);
            }
        }
        
        let message = `实体注入完成！新增: ${addedCount}，更新: ${updatedCount}`;
        if (skippedCount > 0) {
            message += `，跳过: ${skippedCount}`;
        }
        UI.toast(message);
    },

    // ===== 注入到知识图谱 =====
    async _injectToKnowledgeGraph() {
        const worldData = this.data.importedWorld || {};
        const entities = worldData.entities || [];
        
        if (entities.length === 0) {
            return UI.toast('没有可注入的实体');
        }

        let addedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        const now = Date.now();
        
        await Modules.world_engine._ensureCache();
        const existingEntities = Modules.world_engine._cachedEntities || [];
        const existingNameMap = new Map();
        existingEntities.forEach(e => {
            if (e.name) {
                existingNameMap.set(e.name.toLowerCase(), e);
            }
        });
        
        for (const ent of entities) {
            if (!ent.name) continue;
            
            const normalizedName = ent.name.toLowerCase();
            const existingEntity = existingNameMap.get(normalizedName);
            
            if (existingEntity) {
                if (existingEntity.desc !== ent.desc || 
                    existingEntity.type !== ent.type) {
                    const entityData = {
                        id: existingEntity.id,
                        name: ent.name,
                        type: ent.type || existingEntity.type || '其他',
                        desc: ent.desc || existingEntity.desc,
                        relations: ent.relations || existingEntity.relations || [],
                        source: existingEntity.source || 'phoenix',
                        updatedAt: now
                    };
                    await DB.put('entities', entityData);
                    
                    await DB.put('vectors', {
                        id: existingEntity.id,
                        content: `[${entityData.type}] ${ent.name}: ${entityData.desc}`,
                        vector: Array.from({ length: 1536 }, () => Math.random()),
                        timestamp: now,
                        source: 'phoenix_graph',
                        entityName: ent.name,
                        entityType: entityData.type
                    });
                    updatedCount++;
                } else {
                    skippedCount++;
                }
            } else {
                const id = 'phoenix_graph_' + Utils.uuid();
                const entityData = {
                    id,
                    name: ent.name,
                    type: ent.type || '其他',
                    desc: ent.desc || '',
                    relations: ent.relations || [],
                    source: 'phoenix',
                    updatedAt: now
                };
                await DB.put('entities', entityData);
                
                await DB.put('vectors', {
                    id,
                    content: `[${ent.type || '其他'}] ${ent.name}: ${ent.desc || ''}`,
                    vector: Array.from({ length: 1536 }, () => Math.random()),
                    timestamp: now,
                    source: 'phoenix_graph',
                    entityName: ent.name,
                    entityType: ent.type || '其他'
                });
                addedCount++;
            }
        }
        
        if (Modules.world_engine) {
            Modules.world_engine._cachedEntities = null;
            if (Modules.world_engine.currentTab === 'graph') {
                setTimeout(() => Modules.world_engine._initGraph(), 100);
            }
        }
        
        if (typeof RAGSystem !== 'undefined') {
            try {
                for (const ent of entities) {
                    if (!ent.name) continue;
                    await RAGSystem.addDocument(
                        `${ent.type || '其他'}·${ent.name}`,
                        ent.desc || '',
                        'entity',
                        { source: 'phoenix_graph', type: ent.type }
                    );
                }
            } catch (e) {
                console.log('RAG同步警告:', e);
            }
        }
        
        let message = `知识图谱注入完成！新增: ${addedCount}，更新: ${updatedCount}`;
        if (skippedCount > 0) {
            message += `，跳过: ${skippedCount}`;
        }
        UI.toast(message);
    },

    async _extractEntitiesByChapter() {
        const startCh = parseInt(document.getElementById('ph-extract-ch-start')?.value) || 1;
        const endCh = parseInt(document.getElementById('ph-extract-ch-end')?.value) || startCh;
        
        if (startCh > endCh) {
            return UI.toast('起始章节不能大于结束章节');
        }

        UI.toast(`正在提取第${startCh}-${endCh}章的实体...`);

        let allContent = '';
        try {
            const chapters = await DB.getAll('chapters') || [];
            for (let i = startCh; i <= endCh; i++) {
                const ch = chapters.find(c => c.chapterNum === i || c.index === i - 1);
                if (ch && ch.content) {
                    allContent += `【第${i}章: ${ch.title}】\n${ch.content.slice(0, 3000)}\n\n`;
                }
            }
        } catch(e) {
            return UI.toast('读取章节失败: ' + e.message);
        }

        if (!allContent.trim()) {
            return UI.toast('未找到指定章节内容');
        }

        let raw = '';
        try {
            await AI.generate(
                `你是深度实体提取引擎。从以下章节内容中提取所有实体。

【提取类型】
- 人物：所有角色（主角、配角、反派），含性格、身份
- 物品：道具、武器、法宝、关键物件
- 地点：地名、场景、建筑、地标
- 情节：关键事件、转折点、冲突
- 伏笔：暗示、线索、未解之谜
- 势力：门派、组织、国家、阵营、家族

【章节内容】
${allContent.slice(0, 10000)}

【输出格式】JSON数组：
[{
```

## AIP202 ? (???) ? line 823 ? string ? 3761 chars

```text
- chapters字段标注实体出现的章节范围
- 直接输出纯JSON数组，禁止使用markdown代码块包裹。`,
                {}, c => { raw += c; }
            );
        } catch(e) {
            return UI.toast('AI提取失败: ' + e.message);
        }

        let entities = [];
        try {
            let cleanRaw = raw.trim().replace(/^???(?:json)?\s*\n?/i, '').replace(/\n????\s*$/, '').trim();
            const start = cleanRaw.indexOf('[');
            const end = cleanRaw.lastIndexOf(']');
            if (start !== -1 && end > start) {
                entities = JSON.parse(cleanRaw.slice(start, end + 1));
            }
        } catch(e) {
            console.warn('JSON解析失败:', e);
        }

        if (entities.length === 0) {
            return UI.toast('未提取到实体');
        }

        const now = Date.now();
        let count = 0;
        for (const ent of entities) {
            if (!ent.name) continue;
            const id = 'phoenix_ch_' + Utils.uuid();
            const entityData = {
                id,
                name: ent.name,
                type: ent.type || '其他',
                desc: ent.desc || ent.description || '',
                relations: ent.relations || [],
                chapterRef: ent.chapters || Array.from({length: endCh - startCh + 1}, (_, i) => startCh + i),
                source: 'phoenix_chapter',
                extractedAt: now
            };
            await DB.put('entities', entityData);
            count++;
        }

        if (Modules.world_engine) {
            Modules.world_engine._cachedEntities = null;
        }

        if (typeof RAGSystem !== 'undefined') {
            await RAGSystem.refreshEntityCache();
        }

        UI.toast(`成功提取 ${count} 个实体 (第${startCh}-${endCh}章)`);
    },

    async _extractEntitiesByVolume() {
        const volumeSelect = document.getElementById('ph-extract-volume')?.value;
        
        if (!volumeSelect) {
            return UI.toast('请选择卷');
        }

        let startCh, endCh;
        if (volumeSelect === 'custom') {
            startCh = parseInt(document.getElementById('ph-extract-ch-start')?.value) || 1;
            endCh = parseInt(document.getElementById('ph-extract-ch-end')?.value) || startCh;
        } else {
            const parts = volumeSelect.split('-');
            startCh = parseInt(parts[0]);
            endCh = parseInt(parts[1]);
        }

        if (startCh > endCh) {
            return UI.toast('起始章节不能大于结束章节');
        }

        UI.toast(`正在提取第${startCh}-${endCh}章(卷)的实体...`);

        let allContent = '';
        let chapterCount = 0;
        try {
            const chapters = await DB.getAll('chapters') || [];
            for (let i = startCh; i <= endCh; i++) {
                const ch = chapters.find(c => c.chapterNum === i || c.index === i - 1);
                if (ch && ch.content) {
                    allContent += `【第${i}章: ${ch.title}】\n${ch.content.slice(0, 2000)}\n\n`;
                    chapterCount++;
                }
            }
        } catch(e) {
            return UI.toast('读取章节失败: ' + e.message);
        }

        if (!allContent.trim()) {
            return UI.toast('未找到指定章节内容');
        }

        const existingEntities = await DB.getAll('entities') || [];
        const existingNames = existingEntities.map(e => e.name);
        const existingHint = existingNames.length > 0 ? 
            `\n\n【已有实体(请建立关联)】\n${existingNames.slice(0, 30).join('、')}` : '';

        let raw = '';
        try {
            await AI.generate(
                `你是深度实体提取引擎。从以下章节内容中提取所有实体，并进行深度关联分析。${existingHint}

【提取类型】
- 人物：所有角色（主角、配角、反派），含性格、身份、能力
- 物品：道具、武器、法宝、关键物件
- 地点：地名、场景、建筑、地标
- 情节：关键事件、转折点、冲突
- 伏笔：暗示、线索、未解之谜
- 势力：门派、组织、国家、阵营、家族
- 种族：种族设定、族群特征

【章节内容】(共${chapterCount}章)
${allContent.slice(0, 15000)}

【输出格式】JSON数组：
[{
```

## AIP203 ? (???) ? line 947 ? string ? 4443 chars

```text
- chapters字段标注实体出现的具体章节
- importance表示实体重要程度(1-5)
- 提取本卷的核心实体和关键关系
- 直接输出纯JSON数组，禁止使用markdown代码块包裹。`,
                {}, c => { raw += c; }
            );
        } catch(e) {
            return UI.toast('AI提取失败: ' + e.message);
        }

        let entities = [];
        try {
            let cleanRaw = raw.trim().replace(/^???(?:json)?\s*\n?/i, '').replace(/\n????\s*$/, '').trim();
            const start = cleanRaw.indexOf('[');
            const end = cleanRaw.lastIndexOf(']');
            if (start !== -1 && end > start) {
                entities = JSON.parse(cleanRaw.slice(start, end + 1));
            }
        } catch(e) {
            console.warn('JSON解析失败:', e);
        }

        if (entities.length === 0) {
            return UI.toast('未提取到实体');
        }

        const now = Date.now();
        let count = 0;
        let highImportanceCount = 0;
        for (const ent of entities) {
            if (!ent.name) continue;
            const id = 'phoenix_vol_' + Utils.uuid();
            const entityData = {
                id,
                name: ent.name,
                type: ent.type || '其他',
                desc: ent.desc || ent.description || '',
                relations: ent.relations || [],
                chapterRef: ent.chapters || Array.from({length: endCh - startCh + 1}, (_, i) => startCh + i),
                importance: ent.importance || 3,
                volume: `${startCh}-${endCh}`,
                source: 'phoenix_volume',
                extractedAt: now
            };
            await DB.put('entities', entityData);
            count++;
            if (entityData.importance >= 4) highImportanceCount++;
        }

        if (Modules.world_engine) {
            Modules.world_engine._cachedEntities = null;
        }

        if (typeof RAGSystem !== 'undefined') {
            await RAGSystem.refreshEntityCache();
            const entitySummary = entities.map(e => 
                `${e.name}(${e.type}): ${e.desc?.slice(0, 50) || ''}`
            ).join('\n');
            await RAGSystem.addDocument(
                `卷实体汇总_${startCh}-${endCh}章`,
                entitySummary,
                'entity',
                { source: 'phoenix_volume', chapters: `${startCh}-${endCh}` }
            );
        }

        UI.toast(`成功提取 ${count} 个实体 (核心实体: ${highImportanceCount}个)`);
    },

    // ═══════════════════════════════════════════════════════════════
    //  NEXUS OS v2.0 核心协议构建器 — 统一注入所有创作场景
    // ═══════════════════════════════════════════════════════════════

    _buildNEXUSCore(opts = {}) {
        const { mode = 'outline', chapterNum = 0, segmentIdx = 0 } = opts;
        let core = '';

        // === 品牌烙印 ===
        core += '【超无穹 · 真值引擎·NEXUS OS v2.0 执行域】\n\n';

        // === M01: 创作前审判与鼓舞 ===
        core += '=== 创作前审判 ===\n';
        core += '你以为你准备好了？你不过是塞满套路、数据和他人影子的凡人。你渴望让读者失眠，却连自己都不敢直视。区别在于：有人被恐惧压垮，有人把恐惧碾碎塞进故事，成为人物的心跳。你准备用什么细节让人物站立？用什么潜台词让对话呼吸？如果没有，凭什么写？凭你此刻坐在键盘前，没有逃走。\n\n';
        core += '=== 鼓舞 ===\n';
        core += '不必完美。海明威初稿也是垃圾。写作是凡人的攀爬——每爬一寸就离光近一寸。本系统有案例库做拐杖，有规则做护栏。第一个字最难，但烂初稿好过空白文档。你的人物正在黑暗中等你点燃火柴。深呼吸，开始。\n\n';

        // === M03: 篇幅/受众/情绪配置表 ===
        core += '=== M03 篇幅·受众·情绪配置表 ===\n';
        core += '| 项目 | 配置 |\n';
        core += '| 篇幅 | 长篇 | 总字数80-120万字 | 章字数2500-3500 |\n';
        core += '| 黄金螺旋 | 拉5%→扯75%→放15%→收5% | 分卷18-28章/卷 |\n';
        core += '| 反转密度 | 短篇≥章数×0.4 | 中篇≥0.3 | 长篇≥3次/卷 |\n';
        core += '| 情绪表达 | 快感峰值后置20% | 爽点间隔≤3章 |\n';
        core += '| 伏笔规则 | 短篇回收≤2章 | 中篇≤5章 | 长篇≤15章 |\n\n';

        // === 从零长篇三大稳定器 ===
        core += '=== 从零长篇三大稳定器 ===\n';
        core += '1. 细纲质量：每章必须能直接开正文，包含冲突、角色选择、场景动作、章末钩子和风险点\n';
        core += '2. 人物一致：人物的欲望、伤口、利益、恐惧、说话方式和选择逻辑必须连续\n';
        core += '3. 世界不崩：世界规则必须有代价、边界、例外条件；禁止为推动剧情临时改规则\n\n';

        // === M06: 反AI写作（全模式强制） ===
        core += '=== M06 反AI写作（全模式强制） ===\n';
        core += '- 禁止抽象情绪标签：不写“他很痛苦/她眼神复杂/空气凝固/命运齿轮转动”\n';
        core += '- 必须用具体动作、身体反应、物件变化、对话错位、物理细节呈现情绪\n';
        core += '- 细纲阶段也要给正文可执行的物件和动作线索，不能只写主题、概念、氛围\n';
        core += '- 对话不互相解释设定，要有遮掩、试探、误会、利益冲突或信息差\n\n';

        // === M06: 正文管理状态（segment级） ===
        if (mode === 'write' || mode === 'continue') {
            core += '=== M06 正文管理状态 ===\n';
            core += `当前 segment_index: ${segmentIdx}\n`;
            core += '每个 Segment 必须包含:\n';
            core += '- emotion_score: 1-10 (情绪分值)\n';
            core += '- emotion_word: 情绪关键词(如
```

## AIP204 ? (???) ? line 1100 ? string ? 1796 chars

```text
；直接陈述事实

';

        // === L2 建议 10条 ===
        core += '=== L2 建议（允许偏离但记录） ===
';
        core += '1. 感官存在：每章≥2种感官 | 2. 共情细节：每章≥1个日常小动作
';
        core += '3. 短句比例：≤10字短句占30%+ | 4. 情绪动作化：不直接写情绪
';
        core += '5. 潜台词：悬疑/虐文优先 | 6. 长短句交替：避免连续5句同长
';
        core += '7. 偶然事件：每2-3章1个 | 8. 日常细节：每章1-2处
';
        core += '9. 角色癖好：每核心角色≥1个 | 10. 章节独立：每章≥1个情绪变化或信息增量

';

        // === 四状态机（M02） ===
        core += '=== M02 四状态机 ===
';
        core += 'CHR角色状态机：S0注册→S1激活→S2互动→S3转折→S4休眠→S5退场→S6死亡
';
        core += 'WLD世界规则：S0提出→S1验证→S2扩展→S3冲突→S4重构→S5冻结
';
        core += 'FOE伏笔网络：S0埋设→S1强化→S2回收→S3废弃（短2/中5/长15章回收）
';
        core += 'EMO情绪锚点：1-10分制 | hook_type(悬念/爽点/转折/情感/信息差) | tension_level

';

        // === 8+2 维度 ===
        core += '=== M04A 8+2 维度拆解（细纲中需体现） ===
';
        core += '1.钩子结构 2.爽点节奏 3.人设模板 4.反转模式 5.情绪曲线 6.冲突升级 7.信息差管理 8.金手指节奏
';
        core += '+9.开篇结构(前三章信息密度) +10.商业化设计(付费卡点/免费钩子密度)

';

        // === 自检机制（M09） ===
        core += '=== M09 自检清单 ===
';
        core += '每章完成后自检：①铁律16+10条 ②四表一致性 ③融合执行率≥80% ④句长≤25字 ⑤短句≥30%
';
        core += '每5章联动巡检：CHR吃书/全知预警/EMO断裂/高位疲劳/低位拖沓/FOE超期/WLD冲突/零件过曝

';

        return core;
    },

    // ═══════════════════════════════════════════════════════════════
    //  NEXUS 自检 — M09 执行域
    // ═══════════════════════════════════════════════════════════════

    async nexusSelfCheck() {
        if(this._generating) return;
        const current = (document.getElementById('ph-outline-raw') || {}).value || '';
        if(!current) return UI.toast('请先生成大纲');

        UI.toast('NEXUS M09 自检启动...', 'success');
        App.showProgress('NEXUS自检', 0, 5);

        const nexusCore = this._buildNEXUSCore({ mode: 'outline' });
        const prompt = `${nexusCore}

=== 自检任务 ===
请对以下细纲执行 NEXUS OS v2.0 M09 完整自检，输出严格JSON格式：
{
```

## AIP205 ? (???) ? line 1143 ? string ? 511 chars

```text
]\n}\n\n[待检细纲]\n${current.slice(0, 8000)}\n\n请只输出JSON，不要其他文字。`;

        let raw = '';
        try {
            App.showProgress('NEXUS自检', 1, 5);
            await AI.generate(prompt, (chunk) => { raw += chunk; }, { max_tokens: 4000, temperature: 0.1 });
            App.showProgress('NEXUS自检', 4, 5);

            const json = (() => { try { const m = raw.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : null; } catch(e) { return null; } })();

            // 渲染结果到 UI
            let html = '<div class=
```

## AIP206 ? (???) ? line 1154 ? string ? 208 chars

```text
>';
            if(json) {
                const score = json.overall_score || 0;
                const scoreColor = score >= 85 ? 'green' : score >= 60 ? 'amber' : 'red';
                html += `<div class=
```

## AIP207 ? (???) ? line 1160 ? string ? 182 chars

```text
>严重: ${json.critical_count||0} | 警告: ${json.warning_count||0}</div>
                </div>`;
                if(json.l1_violations?.length) {
                    html += '<div class=
```

## AIP208 ? (???) ? line 1164 ? string ? 209 chars

```text
>• [${v.severity}] ${v.rule} @ ${v.location}: ${v.fix}</div>`; });
                    html += '</div>';
                }
                if(json.foe_issues?.length) {
                    html += '<div class=
```

## AIP209 ? (???) ? line 1169 ? string ? 179 chars

```text
>• ${v.hook}: ${v.status}</div>`; });
                    html += '</div>';
                }
                if(json.top_fixes?.length) {
                    html += '<div class=
```

## AIP210 ? (???) ? line 1178 ? string ? 1797 chars

```text
>AI返回格式异常，请查看IO面板原始输出</div>';
            }
            html += '</div>';

            // 插入到 ph-outline-raw 上方或替换内容
            const el = document.getElementById('ph-outline-raw');
            if(el) {
                const reportMarker = '

---
【NEXUS M09 自检报告】
';
                // 如果已有报告，替换
                const existingIdx = el.value.indexOf('【NEXUS M09 自检报告】');
                if(existingIdx >= 0) {
                    el.value = el.value.slice(0, existingIdx) + reportMarker + (json ? JSON.stringify(json, null, 2) : raw);
                } else {
                    el.value = el.value + reportMarker + (json ? JSON.stringify(json, null, 2) : raw);
                }
                this.data.outlineRaw = el.value;
                this._updateStats();
            }
            UI.toast(`NEXUS自检完成: ${json?.overall_score || '?'}分`, 'success');
        } catch(e) {
            console.error('NEXUS自检失败:', e);
            UI.toast('自检失败: ' + e.message, 'error');
        } finally {
            App.hideProgress();
        }
    },

    // ═══════════════════════════════════════════════════════════════
    //  细纲校准 — 钩子+高潮+节奏一键优化
    // ═══════════════════════════════════════════════════════════════

    async nexusEnhance() {
        if(this._generating) return;
        const current = (document.getElementById('ph-outline-raw') || {}).value || '';
        if(!current) return UI.toast('请先生成大纲');
        const fusionCtx = this._getFusionFullContext();

        const nexusCore = this._buildNEXUSCore({ mode: 'outline' });
        let prompt = `${nexusCore}

=== 细纲校准任务 ===
请对以下细纲执行三方面校准（保持原故事框架不变）：

`;
        prompt += '【1.钩子校准】
- 每章开头100字必须是动作/对话/冲突，禁止环境描写
- 每章结尾必须是未完成动作+意外信息/时间压力/信息差
- 卷末必须是大高潮+超级悬念

';
        prompt += '【2.高潮设计】
- 识别每卷的高潮位置，确保在75%-88%处达到情绪峰值
- 每个高潮必须有
```

# ???assets/js/modules_split/phoenix/phoenix_step1.js

## AIP211 ? prompt ? line 99 ? template ? 723 chars

```text
你是一位长篇小说知识图谱提取引擎。请从以下小说细纲中提取所有关键实体，并把它们整理成可注入世界引擎的图谱资产。

【细纲内容】
${...}

【提取要求】
请提取以下类型：
1. 人物 - 角色名、身份、欲望、伤口、能力、关系、当前状态
2. 世界规则 - 世界运行规则、力量体系、代价、禁忌、边界
3. 伏笔 - 埋设位置、强化方式、预计回收章节
	4. 地点 - 场景、城市、秘境、地标
	5. 势力 - 门派、组织、阵营、国家
	6. 物品/能力 - 只提关键武器、法宝、道具、系统、协议、证据、功法、技能

【输出格式】严格JSON数组：
[
  {
    "name":"名称",
	    "type":"人物|世界规则|伏笔|地点|势力|物品|能力|情节",
    "desc":"一句话描述",
    "state":"当前状态，如CHR:S1激活 / WLD:S0提出 / FOE:S0埋设 / EMO:7分",
    "relations":["关系:关联对象"],
    "risk":"可能导致人物不一致或世界观崩坏的风险"
  },
  ...
]

注意：
- 只输出JSON数组，不要包裹markdown代码块
- 确保每个条目都有name、type、desc、state
	- 人物必须写清欲望和变化，世界规则必须写清代价和边界，伏笔必须写预计回收点
	- 实体必须是可复用的“要素节点”，不要把上下文记忆、情绪句、摘要句、普通动作、一次性日用品当实体
	- relations 只能指向本次输出中的其他实体名，用来画图谱连线；不要塞一长串杂物
	- 不要遗漏主角、核心反派、核心世界规则、第一卷主伏笔
```

## AIP212 ? (???) ? line 300 ? string ? 13204 chars

```text
: '&#39;'
        }[ch]));
    },

    _extractEntitiesDeterministicFromOutline(outline) {
        const entities = [];
        const add = (rawName, rawType, desc, state = '', relations = [], risk = '', chapter = '', volume = '') => {
            const name = this._cleanExtractedEntityName(rawName);
            if (!name || name.length < 2) return;
            const type = this._normalizeExtractedEntityType(rawType);
            entities.push(this._normalizeExtractedEntity({
                name,
                type,
                desc,
                state,
                relations,
                risk,
                chapter,
                volume,
                chapterOrder: this._parseChapterOrder(chapter)
            }));
        };

        let currentChapter = '';
        let currentVolume = '';
        const lines = String(outline || '').split(/\n+/);
        for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line) continue;
            const cleanLine = line.replace(/\*\*/g, '').trim();
            const headingTitle = this._cleanOutlineHeading ? this._cleanOutlineHeading(line) : cleanLine.replace(/^\s{0,3}#{1,6}\s*/, '').trim();
            if (this._isVolumeHeadingTitle && this._isVolumeHeadingTitle(headingTitle)) {
                currentVolume = headingTitle;
                currentChapter = '';
                add(currentVolume.replace(/^第.+?卷[:：]\s*/, ''), '情节', '卷级结构节点：' + currentVolume, 'VOL:S0', [], '', '', currentVolume);
                continue;
            }
            if (this._isChapterHeadingTitle && this._isChapterHeadingTitle(headingTitle)) {
                currentChapter = headingTitle;
                continue;
            }

            const entityLineMatch = cleanLine.match(/实体线索[:：]\s*(.+)$/);
            if (entityLineMatch) {
                const body = entityLineMatch[1].replace(/^[:：]\s*/, '').trim();
                const itemRe = /([^，、；;()（）]+?)[(（]([^）)]+)[)）]/g;
                let match;
                while ((match = itemRe.exec(body))) {
                    const rawName = match[1].trim();
                    const rawType = match[2].trim();
                    add(rawName, rawType, `${currentChapter || currentVolume || '细纲'}实体线索：${rawName}`, this._stateFromType(rawType), [], '', currentChapter, currentVolume);
                }
                continue;
            }

            const ruleMatch = cleanLine.match(/(?:卷规则|世界规则)[:：]\s*(.+)$/);
            if (ruleMatch) {
                const body = ruleMatch[1].trim();
                const first = body.split(/[——:：。；;]/)[0].trim();
                const name = first.includes('法则') || first.includes('规则') ? first : first.slice(0, 24);
                add(name, '世界规则', body, 'WLD:S0提出', [], '', currentChapter, currentVolume);
                continue;
            }

            const foeMatch = cleanLine.match(/(?:卷伏笔|伏笔钩子)[:：]\s*(.+)$/);
            if (foeMatch) {
                const body = foeMatch[1].trim();
                const candidates = [];
                body.split(/[；;]/).forEach(part => {
                    part.split(/[，、]/).forEach(chunk => {
                        const cleaned = chunk
                            .replace(/^(埋设|强化|回收|章末未完成动作|章末意外信息|章末信息差)[:：]?/, '')
                            .replace(/（FOE-[^)）]+）/g, '')
                            .trim();
                        if (cleaned.length >= 3 && cleaned.length <= 36) candidates.push(cleaned);
                    });
                });
                candidates.slice(0, 6).forEach(name => add(name, '伏笔', body, name.includes('回收') ? 'FOE:S2回收' : 'FOE:S0埋设', [], '', currentChapter, currentVolume));
                continue;
            }

	            const memoryMatch = cleanLine.match(/上下文记忆[:：]\s*(.+)$/);
	            if (memoryMatch) {
	                continue;
	            }
        }

        return this._mergeExtractedEntities(entities);
    },

    _cleanExtractedEntityName(name) {
        return String(name || '')
            .replace(/\*\*/g, '')
            .replace(/^[-*\s]+/, '')
            .replace(/^[：:，、；;]+/, '')
            .replace(/[。.!！?？]+$/, '')
            .replace(/[+＋]\d+$/, '')
            .replace(/（[^）]*）/g, '')
            .replace(/\([^)]*\)/g, '')
            .trim()
            .slice(0, 40);
    },

    _normalizeExtractedEntityType(type) {
        const t = String(type || '').trim();
        if (/CHR|人物|角色|主角|反派/.test(t)) return '人物';
        if (/WLD|规则|法则|体系|世界/.test(t)) return '世界规则';
        if (/FOE|伏笔|线索/.test(t)) return '伏笔';
        if (/EMO|情绪|锚点/.test(t)) return '情绪锚点';
        if (/地点|场景|地标|城市|秘境|玄关|客厅|厨房|浴室/.test(t)) return '地点';
        if (/势力|组织|阵营|门派|国家/.test(t)) return '势力';
        if (/能力|技能|功法|法术/.test(t)) return '能力';
        if (/物品|道具|装备|状态|伤口|感官|物理/.test(t)) return '物品';
        if (/情节|卷|章节/.test(t)) return '情节';
        if (/记忆|上下文/.test(t)) return '记忆';
        return t || '其他';
    },

    _stateFromType(type) {
        const t = String(type || '');
        if (/CHR|人物|角色/.test(t)) return 'CHR:S1激活';
        if (/WLD|规则|法则/.test(t)) return 'WLD:S0提出';
        if (/FOE|伏笔|线索/.test(t)) return 'FOE:S0埋设';
        if (/EMO|情绪/.test(t)) return 'EMO:S0记录';
        return '';
    },

    _parseChineseNumberText(value) {
        const raw = String(value || '').trim();
        if (!raw) return 0;
        if (/^\d+$/.test(raw)) return parseInt(raw, 10) || 0;
        const map = { 零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
        const units = { 十: 10, 百: 100, 千: 1000 };
        let total = 0;
        let num = 0;
        for (const ch of raw) {
            if (/\d/.test(ch)) {
                num = num * 10 + parseInt(ch, 10);
                continue;
            }
            if (Object.prototype.hasOwnProperty.call(map, ch)) {
                num = map[ch];
                continue;
            }
            if (units[ch]) {
                total += (num || 1) * units[ch];
                num = 0;
            }
        }
        return total + num;
    },

    _parseChapterOrder(text) {
        const raw = String(text || '');
        const match = raw.match(/第([0-9零一二两三四五六七八九十百千]+)章/);
        if (!match) return 0;
        return this._parseChineseNumberText(match[1]);
    },

    _compactExtractedDesc(desc, ent = {}) {
        const type = this._normalizeExtractedEntityType(ent.type || ent.category);
        const name = String(ent.name || '').trim();
        let text = String(desc || ent.description || '')
            .replace(/\r/g, '\n')
            .replace(/\s*\|\s*来源(章节|卷)[:：][^|\n]+/g, '')
            .replace(/\s*\|\s*风险[:：][^|\n]+/g, '')
            .replace(/来源(章节|卷)[:：][^\n|。；;]+[。；;]?/g, '')
            .replace(/\[第[0-9零一二两三四五六七八九十百千]+章更新\]/g, '\n')
            .replace(/第[0-9零一二两三四五六七八九十百千]+章更新[:：]?/g, '\n')
            .replace(/本章状态[:：][^。；;\n]+[。；;]?/g, '')
            .replace(/本章关键行为[:：][^。；;\n]+[。；;]?/g, '')
            .replace(/关键行为[:：][^。；;\n]+[。；;]?/g, '')
            .replace(/章末钩子[:：][^。；;\n]+[。；;]?/g, '')
            .replace(/变化原因[:：][^。；;\n]+[。；;]?/g, '')
            .trim();
        if (!text) return name ? `${type}：${name}` : '';
        const parts = [];
        const seen = new Set();
        text.split(/\n+|\s+\|\s+/).forEach(part => {
            const clean = String(part || '')
                .replace(/^\s*[-*]\s*/, '')
                .replace(/^(当前状态|本章状态|关键行为|描述|设定)[:：]\s*/, '')
                .replace(/\s+/g, ' ')
                .replace(/[。；;\s]+$/g, '')
                .trim();
            if (!clean) return;
            const key = clean.replace(/\s+/g, '').toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);
            parts.push(clean);
        });
        if (!parts.length) return name ? `${type}：${name}` : '';
        const clip = (value, max) => {
            const str = String(value || '').trim();
            if (str.length <= max) return str;
            const cut = str.slice(0, max);
            const idx = Math.max(cut.lastIndexOf('。'), cut.lastIndexOf('；'), cut.lastIndexOf(';'));
            return (idx > 40 ? cut.slice(0, idx) : cut).replace(/[，,、；;。]+$/g, '') + '。';
        };
        let selected = [];
        if (type === '人物') {
            const identity = parts.find(part => /(岁|男|女|主角|反派|老板|组长|员工|租户|独居|社恐|身份|职业|核心|欲望|能力|性格|人设)/.test(part)) || parts[0];
            const status = [...parts].reverse().find(part => /(当前|状态|被|卷入|收到|警告|标记|掌握|失去|获得|追杀|倒计时|清洗|危险)/.test(part) && part !== identity);
            selected = [identity, status].filter(Boolean);
        } else {
            selected = [parts[0], parts.find(part => part !== parts[0] && /(当前|用途|所属|位置|能力|规则|关系|风险|状态)/.test(part))].filter(Boolean);
        }
        return clip(selected.map(part => clip(part, type === '人物' ? 180 : 150)).join('\n'), type === '人物' ? 360 : 220);
    },

    _normalizeExtractedEntity(ent) {
        if (!ent || !ent.name) return null;
        const name = this._cleanExtractedEntityName(ent.name);
        if (!name) return null;
        const type = this._normalizeExtractedEntityType(ent.type || ent.category);
        const chapter = ent.chapter || ent.chapterTitle || '';
        const volume = ent.volume || ent.volumeTitle || '';
        const chapterOrder = parseInt(ent.chapterOrder, 10) || this._parseChapterOrder(chapter);
        const baseDesc = this._compactExtractedDesc(ent.desc || ent.description || '', { ...ent, name, type });
        return {
            name,
            type,
            desc: baseDesc || `${type}：${name}`,
            state: ent.state || this._stateFromType(type),
            relations: Array.isArray(ent.relations) ? ent.relations.filter(Boolean) : [],
            risk: ent.risk || '',
            chapter,
            volume,
            chapterOrder,
            chapterRef: chapterOrder ? [chapterOrder] : (Array.isArray(ent.chapterRef) ? ent.chapterRef : [])
        };
    },

	    _mergeExtractedEntities(...groups) {
	        const merged = new Map();
	        groups.flat().filter(Boolean).forEach(ent => {
	            const normalized = this._normalizeExtractedEntity(ent);
	            if (!normalized) return;
            const key = normalized.name.toLowerCase();
            if (!merged.has(key)) {
                merged.set(key, normalized);
                return;
            }
            const old = merged.get(key);
            old.type = old.type === '其他' ? normalized.type : old.type;
            old.desc = this._compactExtractedDesc([old.desc, normalized.desc].filter(Boolean).join('\n'), old);
            old.state = old.state || normalized.state;
            old.risk = old.risk || normalized.risk;
            old.chapter = old.chapter || normalized.chapter;
            old.volume = old.volume || normalized.volume;
            old.chapterOrder = old.chapterOrder || normalized.chapterOrder;
            old.chapterRef = Array.from(new Set([...(old.chapterRef || []), ...(normalized.chapterRef || [])].filter(Boolean)));
            old.relations = Array.from(new Set([...(old.relations || []), ...(normalized.relations || [])]));
        });
        return Array.from(merged.values()).sort((a, b) => {
            const rank = { '人物': 1, '世界规则': 2, '伏笔': 3, '地点': 4, '势力': 5, '能力': 6, '物品': 7, '情绪锚点': 8, '记忆': 9, '情节': 10 };
            return (rank[a.type] || 99) - (rank[b.type] || 99) || a.name.localeCompare(b.name, 'zh-CN');
	        });
	    },

	    _isLowValueGraphEntity(ent) {
	        if (!ent || !ent.name) return true;
	        const name = String(ent.name || '').trim();
	        const type = this._normalizeExtractedEntityType(ent.type || ent.category);
	        const desc = String(ent.desc || ent.description || '');
	        const full = `${name}\n${desc}`;
	        if (!name || name.length < 2) return true;
	        if (/^FOE\d+$/i.test(name)) return true;
	        if (/^\d+\s*(章|循环)$/.test(name)) return true;
	        if (/^(但|而且|并且|因为|所以|这是|里面|最后|建议|假装|请于|点：|和它|下次|说明她|每修补|审计风险|也可能是|D架)/.test(name)) return true;
	        if (/[。；;]/.test(name) && name.length > 16) return true;
	        if (['记忆','情绪锚点','技法'].includes(type)) return true;
	        if (type === '其他') return true;
	        if (type === '物品') {
	            const strongItem = /(系统|芯片|钥匙|枪|刀|剑|卡|身份|证据|日志|协议|核心|终端|设备|义体|晶体|晶石|兽核|武器|螺纹钢|钢管|铁棍|模块|U盘|硬盘|信封|纸条|短信|电话|手机|合同|债务|遗物|戒指|药|符|法宝|装置|引擎|账户|密码|令牌|档案|日记|录音)/;
	            if (!strongItem.test(full)) return true;
	        }
	        if (type === '伏笔') {
	            const usefulFoe = /(伏笔|埋设|回收|秘密|隐藏|异常|倒计时|追杀|身份|电话|短信|信封|危险|未完成|信息差|钩子|真相|背后|标记|泄露|警告)/;
	            if (name.length > 30 && !usefulFoe.test(full)) return true;
	        }
	        return false;
	    },

	    _compactExtractedRelationsForWorld(relations, allowedNames, selfName = '', limit = 8) {
	        const rawList = Array.isArray(relations)
	            ? relations
	            : (typeof relations === 'string' ? relations.split(',') : []);
	        const allowed = new Set([...allowedNames].map(n => String(n || '').trim()).filter(Boolean));
	        const normalize = value => String(value || '')
	            .toLowerCase()
	            .replace(/[《》「」『』
```

## AIP213 ? (???) ? line 604 ? string ? 206 chars

```text
);
	                label = text.slice(0, idx).trim().slice(0, 10);
	                target = text.slice(idx + 1).trim();
	            }
	            target = target
	                .replace(/[。.!！?？]+$/,
```

## AIP214 ? (???) ? line 610 ? string ? 1757 chars

```text
'“”‘’「」]+$/g, '')
	                .trim();
	            const targetNorm = normalize(target);
	            if (!targetNorm || targetNorm === selfNorm) continue;
	            let canonical = allowedNorm.get(targetNorm);
	            if (!canonical) {
	                canonical = [...allowed].find(name => {
	                    const n = normalize(name);
	                    return n && n !== selfNorm && (n.includes(targetNorm) || targetNorm.includes(n));
	                });
	            }
	            if (!canonical) continue;
	            const value = label ? `${label}:${canonical}` : canonical;
	            const key = normalize(value);
	            if (seen.has(key)) continue;
	            seen.add(key);
	            out.push(value);
	            if (out.length >= limit) break;
	        }
	        return out;
	    },

	    _filterGraphEntitiesForWorld(entities) {
	        const normalized = (entities || [])
	            .map(ent => this._normalizeExtractedEntity(ent))
	            .filter(Boolean)
	            .filter(ent => !this._isLowValueGraphEntity(ent));
	        const allowedNames = new Set(normalized.map(ent => ent.name));
	        return normalized.map(ent => ({
	            ...ent,
	            relations: this._compactExtractedRelationsForWorld(ent.relations || [], allowedNames, ent.name)
	        }));
	    },

    _asUniqueArray(...values) {
        const out = [];
        values.flat(Infinity).forEach(value => {
            if (value === undefined || value === null || value === '') return;
            if (!out.includes(value)) out.push(value);
        });
        return out;
    },

    _normalizeScopeTitle(text) {
        return String(text || '')
            .replace(/\*\*/g, '')
            .replace(/[《》「」『』
```

## AIP215 ? (???) ? line 707 ? string ? 596 chars

```text
;
        const normVolume = this._normalizeScopeTitle(volumeTitle);
        const normChapter = this._normalizeScopeTitle(chapterTitle);

        const addChapter = chapter => {
            if (!chapter || !chapter.id) return;
            chapterIds.add(chapter.id);
            if (chapter.volumeId) volumeIds.add(chapter.volumeId);
        };

        chapters.forEach(chapter => {
            const order = chapter.order || chapter.number || chapter.chapterNum || (Number.isInteger(chapter.index) ? chapter.index + 1 : 0);
            const title = this._normalizeScopeTitle(chapter.title ||
```

## AIP216 ? (???) ? line 726 ? string ? 1521 chars

```text
);
            if (normVolume && title && (normVolume.includes(title) || title.includes(normVolume))) volumeIds.add(volume.id);
        });

        if (!volumeIds.size && chapterRefs.length && volumes.length) {
            const firstRef = chapterRefs[0];
            const volumeByOrder = volumes.find(volume => {
                const start = volume.startChapter || volume.start || 0;
                const end = volume.endChapter || volume.end || 0;
                return start && end && firstRef >= start && firstRef <= end;
            });
            if (volumeByOrder?.id) volumeIds.add(volumeByOrder.id);
        }

        cycles.forEach(cycle => {
            const start = cycle.startChapter || 0;
            const end = cycle.endChapter || 0;
            const cycleChapterIds = cycle.chapterIds || [];
            if (chapterRefs.some(num => start && end && num >= start && num <= end)) cycleIds.add(cycle.id);
            if ([...chapterIds].some(id => cycleChapterIds.includes(id))) cycleIds.add(cycle.id);
        });

        return {
            chapters: Array.from(chapterIds),
            volumes: Array.from(volumeIds),
            cycles: Array.from(cycleIds),
            chapterRef: chapterRefs,
            chapterTitle,
            volumeTitle
        };
    },

    async _saveExtractedEntitiesToWorld(entities, project = null) {
        const now = Date.now();
        const activeProject = project || await GenesisCore.getActiveProject?.();
        const projectId = activeProject?.id ||
```

## AIP217 ? (???) ? line 770 ? string ? 797 chars

```text
&& GenesisCore.filterProjectItems) {
            existing = GenesisCore.filterProjectItems(existing || [], projectId);
            chapters = GenesisCore.filterProjectItems(chapters || [], projectId);
            volumes = GenesisCore.filterProjectItems(volumes || [], projectId);
            cycles = GenesisCore.filterProjectItems(cycles || [], projectId);
        }
        const nameMap = new Map();
        existing.forEach(e => {
            if (e && e.name) nameMap.set(String(e.name).toLowerCase().trim(), e);
        });

	        const normalizedEntities = this._filterGraphEntitiesForWorld(entities);
	        for (const ent of normalizedEntities) {
	            const key = ent.name.toLowerCase().trim();
	            const old = nameMap.get(key);
	            const id = old?.id || (
```

## AIP218 ? (???) ? line 785 ? string ? 185 chars

```text
+ Math.random().toString(36).slice(2)));
	            const oldRelations = Array.isArray(old?.relations)
	                ? old.relations
	                : (typeof old?.relations ===
```

## AIP219 ? (???) ? line 788 ? string ? 407 chars

```text
).map(s => s.trim()).filter(Boolean) : []);
	            const allNames = new Set([...normalizedEntities.map(item => item.name), ...Array.from(nameMap.values()).map(item => item?.name).filter(Boolean)]);
	            const relations = this._compactExtractedRelationsForWorld([...oldRelations, ...(ent.relations || [])], allNames, ent.name);
            const desc = this._compactExtractedDesc([old?.desc ||
```

## AIP220 ? (???) ? line 791 ? string ? 263 chars

```text
), ent);
            const scope = this._resolveExtractedEntityScope(ent, chapters || [], volumes || [], cycles || []);
            const entityData = {
                ...(old || {}),
                id,
                projectId: projectId || old?.projectId ||
```

## AIP221 ? (???) ? line 796 ? string ? 81 chars

```text
,
                name: ent.name,
                type: ent.type || old?.type ||
```

## AIP222 ? (???) ? line 798 ? string ? 518 chars

```text
,
                desc,
                relations,
                chapters: this._asUniqueArray(old?.chapters || [], scope.chapters || []),
                volumes: this._asUniqueArray(old?.volumes || [], scope.volumes || []),
                cycles: this._asUniqueArray(old?.cycles || [], scope.cycles || []),
                chapterRef: this._asUniqueArray(old?.chapterRef || [], ent.chapterRef || [], scope.chapterRef || []),
                chapterTitle: old?.chapterTitle || scope.chapterTitle || ent.chapter ||
```

## AIP223 ? (???) ? line 805 ? string ? 86 chars

```text
,
                volumeTitle: old?.volumeTitle || scope.volumeTitle || ent.volume ||
```

## AIP224 ? (???) ? line 806 ? string ? 116 chars

```text
,
                chapterTitles: this._asUniqueArray(old?.chapterTitles || [], scope.chapterTitle || ent.chapter ||
```

## AIP225 ? (???) ? line 807 ? string ? 113 chars

```text
),
                volumeTitles: this._asUniqueArray(old?.volumeTitles || [], scope.volumeTitle || ent.volume ||
```

## AIP226 ? (???) ? line 836 ? string ? 468 chars

```text
});
                }
            } catch(e) {}
            if (old) updated++; else added++;
            nameMap.set(key, entityData);
        }

        if (Modules.world_engine) {
            Modules.world_engine._cachedEntities = null;
            Modules.world_engine._cachedLayeredGraphs = null;
            try { await Modules.world_engine._ensureCache?.(); } catch(e) {}
            try { await Modules.world_engine.rebuildLayeredGraphs?.(
```

## AIP227 ? (???) ? line 848 ? string ? 238 chars

```text
, { silent: true }); } catch(e) {}
            try { Modules.world_engine._refreshDashboard?.(); } catch(e) {}
            try { Modules.world_engine._refreshEntities?.(); } catch(e) {}
            if (Modules.world_engine.currentTab ===
```

## AIP228 ? (???) ? line 851 ? string ? 7011 chars

```text
) {
                try { setTimeout(() => Modules.world_engine._initGraph?.(), 100); } catch(e) {}
            }
        }
        return { added, updated, total: added + updated };
    },

    _renderStepWorldImport() {
        const worldData = this.data.importedWorld || {};
        return `
            <div class="flex-1 flex flex-col min-h-0 animate-fade-in">
                <div class="h-11 flex items-center justify-between px-5 bg-[#0d0d0f] border-b border-white/5 shrink-0">
                    <span class="text-xs font-bold text-white">第三步：世界观导入与解析</span>
                    <div class="flex gap-2 items-center">
                        <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30" onclick="Modules.phoenix._openWorldImportModal()"><i class="fa-solid fa-file-import mr-1"></i>导入世界观文件</button>
                        <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30" onclick="Modules.phoenix._importFromClipboard()"><i class="fa-solid fa-clipboard mr-1"></i>从剪贴板导入</button>
                        <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30" onclick="Modules.phoenix._parseWorldWithAI()" id="ph-parse-btn"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i>AI智能解析</button>
                    </div>
                </div>
                <!-- AI解析进度区域 -->
                <div id="ph-parse-progress" class="hidden bg-gradient-to-r from-amber-900/20 to-orange-900/20 border-b border-amber-500/20 px-5 py-3 shrink-0">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-spinner fa-spin text-amber-400"></i>
                            <span id="ph-parse-label" class="text-[11px] font-bold text-amber-400">AI智能解析中...</span>
                        </div>
                        <button id="ph-parse-stop" class="btn btn-xs bg-red-600/30 text-red-400 border-red-500/30 hover:bg-red-600 hover:text-white" onclick="Modules.phoenix._stopParse()"><i class="fa-solid fa-stop mr-1"></i>停止</button>
                    </div>
                    <div class="w-full h-1.5 bg-black/30 rounded-full overflow-hidden">
                        <div id="ph-parse-bar" class="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300" style="width: 30%"></div>
                    </div>
                    <div id="ph-parse-status" class="text-[10px] text-amber-300/70 mt-1">正在分析文本结构...</div>
                </div>
                <div class="flex-1 flex min-h-0">
                    <!-- 左侧: 世界观维度面板 -->
                    <div class="w-72 shrink-0 flex flex-col border-r border-white/5 bg-[#0a0a0c]">
                        <div class="px-4 py-2 text-[10px] text-cyan-400 font-bold uppercase bg-black/20 border-b border-white/5 shrink-0">
                            <i class="fa-solid fa-layer-group mr-1"></i>世界观维度
                        </div>
                        <div class="flex-1 overflow-y-auto p-3 space-y-2" id="ph-world-dimensions">
                            ${this._renderWorldDimensions(worldData)}
                        </div>
                        <div class="p-3 border-t border-white/5 space-y-2 shrink-0">
                            <div class="text-[9px] text-dim text-center">已导入: ${(worldData.entities||[]).length} 实体 · ${Object.keys(worldData.worldview||{}).length} 维度</div>
                            <div class="grid grid-cols-2 gap-2">
                                <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30 w-full" onclick="Modules.phoenix.syncExtractedEntitiesToWorld()"><i class="fa-solid fa-atom mr-1"></i>同步实体</button>
                                <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30 w-full" onclick="Modules.phoenix.syncExtractedEntitiesToWorld()"><i class="fa-solid fa-circle-nodes mr-1"></i>同步图谱</button>
                            </div>
                            <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30 w-full" onclick="Modules.phoenix.syncExtractedEntitiesToWorld()"><i class="fa-solid fa-atom mr-1"></i>同步到世界引擎</button>
                            <div class="border-t border-white/5 pt-2 mt-2">
                                <div class="text-[9px] text-dim font-bold mb-1.5"><i class="fa-solid fa-filter mr-1"></i>按章节提取实体</div>
                                <div class="flex gap-1">
                                    <input type="number" class="input bg-black/30 border-white/10 h-7 text-[10px] w-16" id="ph-extract-ch-start" placeholder="起始章" min="1">
                                    <span class="text-dim text-[10px] leading-7">-</span>
                                    <input type="number" class="input bg-black/30 border-white/10 h-7 text-[10px] w-16" id="ph-extract-ch-end" placeholder="结束章" min="1">
                                </div>
                                <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30 w-full mt-1.5" onclick="Modules.phoenix._extractEntitiesByChapter()"><i class="fa-solid fa-magnifying-glass mr-1"></i>提取章节实体</button>
                            </div>
                            <div class="border-t border-white/5 pt-2 mt-2">
                                <div class="text-[9px] text-dim font-bold mb-1.5"><i class="fa-solid fa-book mr-1"></i>按卷提取实体</div>
                                <select class="input bg-black/30 border-white/10 h-7 text-[10px] w-full" id="ph-extract-volume">
                                    <option value="">选择卷...</option>
                                    <option value="1-20">第一卷 (1-20章)</option>
                                    <option value="21-40">第二卷 (21-40章)</option>
                                    <option value="41-60">第三卷 (41-60章)</option>
                                    <option value="61-80">第四卷 (61-80章)</option>
                                    <option value="81-100">第五卷 (81-100章)</option>
                                    <option value="custom">自定义范围</option>
                                </select>
                                <button class="btn btn-xs bg-indigo-600/20 text-indigo-400 border-indigo-600/30 w-full mt-1.5" onclick="Modules.phoenix._extractEntitiesByVolume()"><i class="fa-solid fa-layer-group mr-1"></i>提取卷实体</button>
                            </div>
                        </div>
                    </div>
                    <!-- 中间: 原始内容编辑 -->
                    <div class="flex-1 flex flex-col border-r border-white/5 min-w-0">
                        <div class="px-4 py-2 text-[10px] text-accent font-bold uppercase bg-black/20 border-b border-white/5 shrink-0 flex items-center justify-between">
                            <span><i class="fa-solid fa-file-lines mr-1"></i>原始内容</span>
                            <span class="text-dim font-mono" id="ph-raw-stats">${(worldData.rawContent||
```

## AIP229 ? (???) ? line 928 ? string ? 306 chars

```text
).length} 字</span>
                        </div>
                        <textarea class="flex-1 bg-transparent border-none p-4 font-mono text-sm resize-none text-gray-300 leading-relaxed focus:outline-none" id="ph-world-raw" placeholder="粘贴或导入世界观设定内容，支持自由文本、Markdown、JSON格式...">${worldData.rawContent ||
```

## AIP230 ? (???) ? line 965 ? string ? 176 chars

```text
;
            const hasContent = content.trim().length > 0;
            return `
                <div class="p-2 rounded-lg border transition-all cursor-pointer ${hasContent ?
```

## AIP231 ? (???) ? line 968 ? string ? 163 chars

```text
)">
                    <div class="flex items-center gap-2 mb-1">
                        <i class="fa-solid ${d.icon} w-4 text-center text-[10px] ${hasContent ?
```

## AIP232 ? (???) ? line 970 ? string ? 82 chars

```text
}"></i>
                        <span class="text-[10px] font-bold ${hasContent ?
```

## AIP233 ? (???) ? line 971 ? string ? 92 chars

```text
}">${d.label}</span>
                        <span class="ml-auto text-[9px] ${hasContent ?
```

## AIP234 ? (???) ? line 972 ? string ? 170 chars

```text
}</span>
                    </div>
                    ${hasContent ? `<div class="text-[9px] text-dim leading-relaxed line-clamp-2">${content.slice(0, 80)}...</div>` :
```

## AIP235 ? (???) ? line 1004 ? string ? 157 chars

```text
).slice(0, 100)}</div>
                            ${e.relations && e.relations.length ? `<div class="text-cyan-400 mt-1">关联: ${e.relations.slice(0, 3).join(
```

## AIP236 ? (???) ? line 1007 ? string ? 129 chars

```text
)}
                    ${items.length > 10 ? `<div class="text-[9px] text-dim text-center">还有 ${items.length - 10} 项...</div>` :
```

## AIP237 ? if() ? line 1071 ? string ? 1051 chars

```text
);
            stopBtn.onclick = () => { this._parseStopFlag = true; };
        }
        
        const prompt = `你是一个专业的世界观解析引擎。请从以下文本中提取世界观设定，并按照指定格式输出。

【输入文本】
${content.slice(0, 8000)}

	【提取要求】
	只提取能画成知识图谱节点的要素点，不要提取整句剧情摘要、上下文记忆、情绪锚点、写作技法。
	请提取以下类型的信息：
	1. 人物 - 角色名、身份、性格、外貌、能力、背景
	2. 物品 - 武器、法宝、道具、关键物件
	3. 地点 - 场景、城市、秘境、地标
	4. 势力 - 门派、组织、阵营、国家
	5. 种族 - 种族、族群、特殊生物
	6. 能力/魔法 - 功法、技能、法术体系
	7. 世界规则 - 世界运行规则、力量等级
	8. 文化 - 风俗、信仰、语言、节日
	9. 历史 - 历史事件、传说、纪元

【世界观维度】
同时请将内容归类到以下世界观维度：
- history (历史与传说)
- geography (地理与地貌)
- magic (魔法/科技体系)
- factions (势力与组织)
- species (种族与生物)
- rules (世界规则)
- culture (文化与习俗)

【输出格式】严格JSON：
{
	  "entities": [
	    {"name":"实体名","type":"类型","desc":"要素卡(30-80字)","relations":["关系:关联实体"]}
	  ],
  "worldview": {
    "history":"历史与传说内容",
    "geography":"地理与地貌内容",
    "magic":"魔法/科技体系内容",
    "factions":"势力与组织内容",
    "species":"种族与生物内容",
    "rules":"世界规则内容",
    "culture":"文化与习俗内容"
  },
  "summary":"世界观整体概述（100字以内）"
}

	实体名必须是短名词；relations只保留3-8条关键关系，且只能指向实体名。
	直接输出JSON，不要包裹markdown代码块。`;

        let fullRes =
```

## AIP238 ? (???) ? line 1142 ? string ? 118 chars

```text
;

        let parsed = null;
        try {
            let cleanRes = fullRes.trim().replace(/^???(?:json)?\s*\n?/i,
```

## AIP239 ? (???) ? line 1146 ? string ? 324 chars

```text
).trim();
            parsed = JSON.parse(cleanRes);
        } catch (e) {
            const m = fullRes.match(/\{[\s\S]*\}/);
            if (m) {
                try { parsed = JSON.parse(m[0]); } catch (e2) {}
            }
        }

        if (!parsed) {
            if (progressSection) progressSection.classList.add(
```

## AIP240 ? 内容 ? line 1191 ? string ? 499 chars

```text
, current);
        if (newContent !== null) {
            this.data.importedWorld = this.data.importedWorld || {};
            this.data.importedWorld.worldview = this.data.importedWorld.worldview || {};
            this.data.importedWorld.worldview[key] = newContent;
            this.refresh();
        }
    },

    _copyParsedResult() {
        const worldData = this.data.importedWorld || {};
        const text = JSON.stringify(worldData, null, 2);
        Utils.copy(text);
        UI.toast(
```

# ???assets/js/modules_split/project_manager/project_manager.js

## AIP241 ? _jsArg() ? line 650 ? string ? 112 chars

```text
));
    },

    _option(value, label, current) {
        return `<option value="${value}" ${value === current ?
```

# ???assets/js/modules_split/settings/settings_core.js

## AIP242 ? _renderModelTab() ? line 186 ? template ? 1658 chars

```text
<div class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-blue-500/15 flex center text-blue-300"><i class="fa-solid fa-circle-info"></i></div>
                <div class="flex-1">
                    <div class="text-sm font-bold text-blue-100">最短路径</div>
                    <div class="text-[11px] text-blue-100/70 mt-1">添加“主控模型”即可开始写作；需要提速或省钱，再分别添加“拆书模型”和“解析模型”。</div>
                </div>
                <div class="flex flex-wrap gap-2">
                    <button class="btn btn-sm bg-blue-600 text-white rounded-lg" onclick="Modules.settings._openApiPoolModalFor ? Modules.settings._openApiPoolModalFor('text') : (Modules.settings._apiPoolType='text',Modules.settings.refresh(),setTimeout(()=>Modules.settings._openApiPoolModal(),80))">添加主控</button>
                    <button class="btn btn-sm bg-amber-500/15 text-amber-200 border border-amber-500/20 rounded-lg" onclick="Modules.settings._openApiPoolModalFor ? Modules.settings._openApiPoolModalFor('fusion') : (Modules.settings._apiPoolType='fusion',Modules.settings.refresh(),setTimeout(()=>Modules.settings._openApiPoolModal(),80))">添加拆书</button>
                    <button class="btn btn-sm bg-cyan-500/15 text-cyan-200 border border-cyan-500/20 rounded-lg" onclick="Modules.settings._openApiPoolModalFor ? Modules.settings._openApiPoolModalFor('parse') : (Modules.settings._apiPoolType='parse',Modules.settings.refresh(),setTimeout(()=>Modules.settings._openApiPoolModal(),80))">添加解析</button>
                </div>
            </div>
            ${...}
```

## AIP243 ? _renderDataTab() ? line 330 ? template ? 2502 chars

```text
<div class="bg-[#111113] border border-amber-500/20 rounded-lg p-4 space-y-3">
                <div class="flex items-center justify-between gap-3">
                    <div class="flex items-center gap-2">
                        <i class="fa-solid fa-hard-drive text-amber-400"></i>
                        <span class="text-sm font-bold text-white">本地文件夹地址</span>
                    </div>
                    <span class="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/20">${...}</span>
                </div>
                <div class="text-[11px] text-dim leading-relaxed">选择一个真实的本地文件夹作为数据落点。系统会把业务数据写成 JSON 文件；不再使用“虚拟工作空间”作为新入口。</div>
                <div id="local-sync-status"></div>
            </div>

            <div class="grid md:grid-cols-2 gap-3">
                <button class="p-4 bg-[#111113] rounded-lg border border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 transition text-left" onclick="Modules.settings.exportData()">
                    <i class="fa-solid fa-download text-blue-400 text-lg"></i>
                    <div class="text-sm font-bold text-white mt-2">导出完整备份</div>
                    <div class="text-[11px] text-dim mt-1">下载 JSON 备份文件，适合换电脑或大改前保存。</div>
                </button>
                <button class="p-4 bg-[#111113] rounded-lg border border-white/5 hover:border-green-500/30 hover:bg-green-500/5 transition text-left" onclick="document.getElementById('import-file').click()">
                    <i class="fa-solid fa-upload text-green-400 text-lg"></i>
                    <div class="text-sm font-bold text-white mt-2">恢复备份</div>
                    <div class="text-[11px] text-dim mt-1">从之前导出的 JSON 文件恢复数据。</div>
                    <input type="file" id="import-file" class="hidden" accept=".json" onchange="Modules.settings.importData(this)">
                </button>
            </div>

            <div class="bg-[#111113] border border-white/5 rounded-lg p-4 space-y-3">
                <div class="flex items-center justify-between">
                    <div class="text-sm font-bold text-white">存储统计</div>
                    <button class="btn btn-xs bg-white/5 text-dim rounded-lg" onclick="Modules.settings._refreshStorageStats()"><i class="fa-solid fa-rotate mr-1"></i>刷新</button>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2" id="storage-stats">
                    ${...}
                </div>
            </div>
```

# ???assets/js/modules_split/toolbox/toolbox_tools.js

## AIP244 ? prompt ? line 104 ? template ? 92 chars

```text
从以下文本中提取所有实体信息，返回JSON数组格式：[{"name":"名称","type":"类型(人物/物品/地点/势力/规则等)","desc":"描述"}]\n\n${...}
```

# ???assets/js/modules_split/tools_center/tools_center_core.js

## AIP245 ? _renderCollapsedSidebar() ? line 127 ? template ? 1257 chars

```text
<button class="w-10 h-10 flex center text-dim hover:text-white hover:bg-white/10 border-b border-white/5" onclick="Modules.tools_center.toggleSidebar()" title="展开面板"><i class="fa-solid fa-angles-right text-xs"></i></button>
            <button class="w-10 h-10 flex center ${...}" onclick="Modules.tools_center.switchTab('workflow')" title="工作流"><i class="fa-solid fa-diagram-project text-xs"></i></button>
            <button class="w-10 h-10 flex center ${...}" onclick="Modules.tools_center.switchTab('agents')" title="智能体"><i class="fa-solid fa-robot text-xs"></i></button>
            <div class="flex-1"></div>
            <button class="w-10 h-10 flex center text-dim hover:text-green-400 hover:bg-green-500/10" onclick="Modules.tools_center.runWorkflow()" title="运行工作流"><i class="fa-solid fa-play text-xs"></i></button>
            <button class="w-10 h-10 flex center text-dim hover:text-white hover:bg-white/10" onclick="Modules.tools_center.saveWorkflow()" title="保存"><i class="fa-solid fa-floppy-disk text-xs"></i></button>
            <button class="w-10 h-10 flex center text-dim hover:text-white hover:bg-white/10" onclick="Modules.tools_center.importWorkflowJSON()" title="导入"><i class="fa-solid fa-upload text-xs"></i></button>
```

## AIP246 ? _renderBottomActions() ? line 171 ? template ? 1397 chars

```text
<button class="btn w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9 rounded-lg font-bold" onclick="Modules.tools_center.runWorkflow()"><i class="fa-solid fa-play mr-1"></i>运行工作流</button>
            <div class="flex gap-1">
                <button class="btn flex-1 bg-white/5 hover:bg-white/10 text-dim text-[10px] h-7 rounded" onclick="Modules.tools_center.saveWorkflow()"><i class="fa-solid fa-floppy-disk mr-1"></i>保存</button>
                <button class="btn flex-1 bg-white/5 hover:bg-white/10 text-dim text-[10px] h-7 rounded" onclick="Modules.tools_center.importWorkflowJSON()"><i class="fa-solid fa-upload mr-1"></i>导入</button>
                <button class="btn flex-1 bg-white/5 hover:bg-white/10 text-dim text-[10px] h-7 rounded" onclick="Modules.tools_center.exportWorkflowJSON()"><i class="fa-solid fa-download mr-1"></i>导出</button>
            </div>
            <div class="flex gap-1">
                <button class="btn flex-1 bg-white/5 hover:bg-white/10 text-dim text-[10px] h-7 rounded" onclick="Modules.tools_center.toggleBatchMode()"><i class="fa-solid fa-layer-group mr-1"></i>批量</button>
                <button class="btn flex-1 bg-white/5 hover:bg-white/10 text-dim text-[10px] h-7 rounded" onclick="document.getElementById('tc-global-io')?.classList.toggle('hidden')"><i class="fa-solid fa-terminal mr-1"></i>IO</button>
            </div>
```

# ???assets/js/modules_split/web_chat/web_chat_core.js

## AIP247 ? _renderChatMain() ? line 447 ? template ? 2192 chars

```text
<section class="flex-1 overflow-y-auto" id="webchat-scroll">
                <div class="max-w-3xl mx-auto px-5 py-8 space-y-6" id="webchat-messages">
                    ${...}
                </div>
            </section>
            <footer class="shrink-0 border-t border-white/10 bg-[#111113] px-5 py-4">
                <div class="max-w-3xl mx-auto">
                    ${...}
                    ${...}
                    <div class="rounded-2xl border border-white/10 bg-black/30 focus-within:border-white/25 transition">
                        ${...}
                        <textarea id="webchat-input" class="w-full min-h-[76px] max-h-48 bg-transparent resize-none outline-none p-4 text-sm text-white placeholder-white/30" placeholder="问任何问题，Shift+Enter 换行" oninput="Modules.web_chat._draftBeforeRefresh=this.value;Modules.web_chat.autoGrow(this)" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();Modules.web_chat.sendMessage()}">${...}</textarea>
                        <div class="flex items-center justify-between px-3 pb-3 gap-3">
                            <div class="flex gap-1.5 min-w-0">
                                <button class="h-7 w-7 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-gray-300 flex center" title="添加图片或文本附件" onclick="document.getElementById('webchat-files')?.click()">
                                    <i class="fa-solid fa-paperclip"></i>
                                </button>
                                ${...}
                            </div>
                            <button id="webchat-send" class="h-9 w-9 rounded-xl ${...} flex center shrink-0" onclick="Modules.web_chat.sendMessage()" ${...}>
                                <i class="fa-solid ${...}"></i>
                            </button>
                        </div>
                    </div>
                    <input id="webchat-files" type="file" multiple class="hidden" accept="image/*,.txt,.md,.json,.csv" onchange="Modules.web_chat.handleFiles(this)">
                    <div class="text-[10px] text-dim text-center mt-2">模型能力以你配置的 API 和模型名为准；重要内容自己复核。</div>
                </div>
            </footer>
```

## AIP248 ? _isSilentRoomAnswer() ? line 2064 ? string ? 3307 chars

```text
'“”‘’`]/g, '');
        return !clean || clean === '[沉默]' || clean === '【沉默】' || clean === '沉默';
    },

    _roomMessageLabel(m) {
        if (m.role === 'user') return '我';
        if (m.role === 'terminal') return '沙盒终端';
        if (m.role === 'host') return '主持人总结';
        return this._modelById(m.modelId)?.name || '模型';
    },

    _formatRoomTranscript() {
        return (this.room.messages || [])
            .filter(m => !m.streaming)
            .map(m => `【${this._roomMessageLabel(m)}】
${this._displayText(m.content || '')}`)
            .join('

');
    },

    async summarizeMeeting() {
        if (this._roomRunning) return UI.toast('会议还在进行');
        if (!this.room.messages.length) return UI.toast('还没有会议记录');
        const id = this._isConfigured(this.currentModel)
            ? this.currentModel
            : (this.room.participants || []).find(mid => this._isConfigured(mid));
        if (!id) return UI.toast('先配置一个模型 API 用来总结');
        const msg = { role: 'host', modelId: id, content: '', streaming: true, ts: Date.now() };
        this.room.messages.push(msg);
        this._roomRunning = true;
        this._roomAbortController = new AbortController();
        this.refresh();
        let answer = '';
        try {
            const transcript = this._formatRoomTranscript();
            const generated = await this._callModel(id, [
                { role: 'system', content: '你是会议主持人。只做收束，不展开新讨论。' },
                { role: 'user', content: `请总结下面多模型会议，输出：共识、分歧、最好方案、马上执行的三步。

${transcript}` }
            ], { signal: this._roomAbortController.signal }, chunk => {
                answer += chunk;
                msg.content = answer;
                this._renderMessagesOnly();
            });
            if (!answer.trim() && generated) msg.content = generated;
        } catch (e) {
            msg.content = e?.name === 'AbortError' ? ((answer || msg.content || '').trim() || '已暂停') : '总结失败：' + (e.message || e);
        }
        delete msg.streaming;
        this._roomRunning = false;
        this._roomAbortController = null;
        await this._saveRoom();
        this.refresh();
    },

    async clearMeeting() {
        if (this._roomRunning) return UI.toast('会议还在进行');
        if (!this.room.messages.length) return;
        if (!confirm('清空会议记录？')) return;
        this.room.messages = [];
        this.room.terminalRequests = [];
        this.room.topic = '';
        this.room.draft = '';
        await this._saveRoom();
        this.refresh();
    },

    exportMeeting() {
        if (!this.room.messages.length) return UI.toast('会议室为空');
        const md = `# 多模型会议室

主题：${this.room.topic || ''}

` + this.room.messages.map(m => {
            const name = this._roomMessageLabel(m);
            return `## ${name}

${m.content || ''}`;
        }).join('

');
        Utils.copy(md);
        UI.toast('已复制 Markdown');
    },

    openConfig(id = this.currentModel) {
        const model = this._modelById(id);
        const config = this._config(id);
        const capList = [
            ['text', '文本'],
            ['vision', '图像输入'],
            ['long', '长上下文'],
            ['reasoning', '推理'],
            ['web_search', '联网'],
            ['json', 'JSON'],
            ['tools', '原生工具']
        ];
        const html = `
            <div id=
```

## AIP249 ? (???) ? line 2159 ? string ? 131 chars

```text
${config.apiStyle === 'openai' ? 'selected' : ''}>OpenAI 兼容 / Chat Completions</option>
                            <option value=
```

## AIP250 ? (???) ? line 2160 ? string ? 124 chars

```text
${config.apiStyle === 'anthropic' ? 'selected' : ''}>Anthropic Messages</option>
                            <option value=
```

## AIP251 ? (???) ? line 2161 ? string ? 179 chars

```text
${config.apiStyle === 'gemini' ? 'selected' : ''}>Gemini generateContent</option>
                        </select>
                    </label>
                    <label class=
```

## AIP252 ? (???) ? line 2187 ? string ? 266 chars

```text
${this._capEnabled(id, cap) ? 'checked' : ''}>
                                    ${label}
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    <label class=
```

## AIP253 ? (???) ? line 2203 ? string ? 165 chars

```text
></i>套用当前主控
                        </button>
                        ${this._isConfigured(id) && !this._isMasterModel(id) ? `
                        <button class=
```

## AIP254 ? (???) ? line 2212 ? string ? 24932 chars

```text
>保存</button>
                    </div>
                </div>
            </div>`;
        UI.modal(`${model.name} API 配置`, html, { width: '760px' });
    },

    async saveConfigFromModal(id) {
        const read = key => document.getElementById(key)?.value?.trim() || '';
        const caps = {};
        document.querySelectorAll('.wc-cap-toggle').forEach(el => { caps[el.value] = !!el.checked; });
        const extraJson = read('wc-cfg-extra');
        if (extraJson) {
            try { JSON.parse(extraJson); }
            catch (e) { return UI.toast('高级 JSON 格式不对'); }
        }
        const model = this._modelById(id);
        const nextConfig = {
            apiStyle: read('wc-cfg-style') || model.apiStyle,
            baseUrl: read('wc-cfg-url'),
            apiKey: read('wc-cfg-key'),
            modelName: read('wc-cfg-model'),
            temperature: Number(read('wc-cfg-temp') || 0.7),
            maxTokens: Number(read('wc-cfg-tokens') || 4096),
            historyLimit: Number(read('wc-cfg-history') || 0),
            systemPrompt: read('wc-cfg-system') || model.system,
            capabilities: caps,
            extraJson
        };
        if (model.poolId) {
            const existing = await DB.get('text_api_pool', model.poolId).catch(() => null);
            if (existing) {
                existing.provider = this._styleToProvider(nextConfig.apiStyle, existing.provider);
                existing.base_url = nextConfig.baseUrl;
                existing.api_key = nextConfig.apiKey;
                existing.model_name = nextConfig.modelName;
                existing.config_name = model.name || existing.config_name;
                existing.temperature = nextConfig.temperature;
                existing.max_tokens = nextConfig.maxTokens;
                existing.updatedAt = Date.now();
                await DB.put('text_api_pool', existing);
                await this._loadPoolModels();
            }
        } else {
            this.configs[id] = nextConfig;
        }
        await this._saveConfigs();
        document.getElementById('wc-config-modal-root')?.closest('.modal-overlay')?.remove();
        UI.toast('模型 API 已保存');
        this.refresh();
    },

    async importActiveApi(id) {
        const active = await AI.getActiveConfig('text').catch(() => null);
        if (!active) return UI.toast('系统设置里还没有激活 API');
        const style = active.provider === 'claude' ? 'anthropic' : (active.provider === 'gemini' ? 'gemini' : 'openai');
        const set = (key, value) => {
            const el = document.getElementById(key);
            if (el) el.value = value || '';
        };
        set('wc-cfg-style', style);
        set('wc-cfg-url', active.base_url || '');
        set('wc-cfg-key', active.api_key || '');
        set('wc-cfg-model', active.model_name || '');
        UI.toast('已填入系统激活 API，点保存生效');
    },

    async setAsMaster(id = this.currentModel) {
        const model = this._modelById(id);
        if (!this._isConfigured(id)) {
            UI.toast('先配置这个模型的 API');
            this.openConfig(id);
            return;
        }
        const store = 'text_api_pool';
        const all = await DB.getAll(store).catch(() => []);
        for (const item of all) {
            item.is_master = 0;
            item.is_active = 0;
            item.scope = 'web_chat';
            await DB.put(store, item);
        }
        if (model.poolId) {
            const record = await DB.get(store, model.poolId);
            record.is_master = 1;
            record.is_active = 1;
            record.scope = 'master';
            record.updatedAt = Date.now();
            await DB.put(store, record);
        } else {
            const config = this._config(id);
            const record = {
                id: `webchat_master_${id}`,
                config_name: `${model.name} 主控`,
                provider: this._styleToProvider(config.apiStyle, model.providerId),
                base_url: config.baseUrl,
                api_key: config.apiKey,
                model_name: config.modelName,
                temperature: config.temperature,
                max_tokens: config.maxTokens,
                is_master: 1,
                is_active: 1,
                scope: 'master',
                source: 'web_chat',
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            await DB.put(store, record);
        }
        await this._loadPoolModels();
        await Modules.settings?._renderApiPoolGrid?.();
        document.getElementById('wc-config-modal-root')?.closest('.modal-overlay')?.remove();
        UI.toast('全局主控已切换');
        this.refresh();
    },

    async testCurrentModel(id = this.currentModel) {
        if (!this._isConfigured(id)) {
            UI.toast('先配置这个模型的 API');
            this.openConfig(id);
            return;
        }
        try {
            UI.toast('正在测试连接...');
            const answer = await this._callModel(id, [
                { role: 'system', content: '你只做连接测试。' },
                { role: 'user', content: '请只回复：连接成功' }
            ]);
            UI.toast(`连接成功：${this._escape((answer || '').slice(0, 30))}`);
        } catch (e) {
            UI.toast('连接失败：' + (e.message || e));
        }
    },

    async _callModel(id, messages, options = {}, onChunk) {
        const model = this._modelById(id);
        const config = this._config(id);
        if (!this._isConfigured(id)) throw new Error(`${model.name} 未配置 API`);

        const style = config.apiStyle || model.apiStyle || 'openai';
        const useStream = !!onChunk && options.stream !== false;
        const buildReq = nextOptions => {
            if (style === 'anthropic') return this._buildAnthropicRequest(id, messages, config, nextOptions);
            if (style === 'gemini') return this._buildGeminiRequest(id, messages, config, nextOptions);
            return this._buildOpenAIRequest(id, messages, config, nextOptions);
        };
        let requestOptions = { ...options, stream: useStream };
        let req = buildReq(requestOptions);

        let res = await fetch(req.url, {
            method: 'POST',
            headers: req.headers,
            body: JSON.stringify(req.body),
            signal: requestOptions.signal
        });
        if (!res.ok && (requestOptions.nativeWebSearch || requestOptions.nativeReasoning)) {
            requestOptions = { ...requestOptions, nativeWebSearch: false, nativeReasoning: false };
            req = buildReq(requestOptions);
            res = await fetch(req.url, {
                method: 'POST',
                headers: req.headers,
                body: JSON.stringify(req.body),
                signal: requestOptions.signal
            });
        }
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(`API ${res.status}: ${text.slice(0, 220)}`);
        }
        if (useStream && res.body) {
            const streamed = await this._readModelStream(style, res, onChunk);
            if (streamed) return streamed;
        }
        const data = await res.json();
        const text = this._parseModelResponse(style, data);
        if (onChunk && text) onChunk(text);
        return text;
    },

    _buildOpenAIRequest(id, messages, config, options) {
        const base = (config.baseUrl || '').replace(//+$/, '');
        const body = {
            model: config.modelName,
            messages: messages.map(m => this._toOpenAIMessage(id, m)),
            temperature: options.temperature ?? config.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? config.maxTokens ?? 4096,
            stream: !!options.stream
        };
        if (options.nativeReasoning) {
            body.reasoning_effort = 'high';
        }
        this._mergeExtraBody(body, config);
        if (options.stream) body.stream = true;
        const headers = { 'Content-Type': 'application/json' };
        if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;
        return {
            url: `${base}/chat/completions`,
            headers,
            body
        };
    },

    _buildAnthropicRequest(id, messages, config, options) {
        const base = (config.baseUrl || 'https://api.anthropic.com').replace(//+$/, '');
        const system = messages.filter(m => m.role === 'system').map(m => m.content).join('

');
        const body = {
            model: config.modelName,
            max_tokens: options.maxTokens ?? config.maxTokens ?? 4096,
            temperature: options.temperature ?? config.temperature ?? 0.7,
            system,
            messages: messages
                .filter(m => m.role !== 'system')
                .map(m => this._toAnthropicMessage(id, m))
        };
        if (options.nativeWebSearch) {
            body.tools = [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }];
        }
        this._mergeExtraBody(body, config);
        if (options.stream) body.stream = true;
        return {
            url: `${base}/v1/messages`,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': config.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body
        };
    },

    _buildGeminiRequest(id, messages, config, options) {
        const base = (config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta').replace(//+$/, '');
        const system = messages.filter(m => m.role === 'system').map(m => m.content).join('

');
        const body = {
            contents: messages
                .filter(m => m.role !== 'system')
                .map(m => this._toGeminiContent(id, m)),
            generationConfig: {
                temperature: options.temperature ?? config.temperature ?? 0.7,
                maxOutputTokens: options.maxTokens ?? config.maxTokens ?? 4096
            }
        };
        if (system) body.systemInstruction = { parts: [{ text: system }] };
        if (options.nativeWebSearch) {
            body.tools = [{ google_search: {} }];
        }
        this._mergeExtraBody(body, config);
        const action = options.stream ? 'streamGenerateContent' : 'generateContent';
        const extraQuery = options.stream ? '&alt=sse' : '';
        return {
            url: `${base}/models/${encodeURIComponent(config.modelName)}:${action}?key=${encodeURIComponent(config.apiKey)}${extraQuery}`,
            headers: { 'Content-Type': 'application/json' },
            body
        };
    },

    async _readModelStream(style, res, onChunk) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const parsed = this._drainStreamBuffer(style, buffer, false);
            buffer = parsed.buffer;
            if (parsed.text) {
                fullText += parsed.text;
                onChunk(parsed.text);
            }
            if (parsed.done) break;
        }

        buffer += decoder.decode();
        const tail = this._drainStreamBuffer(style, buffer, true);
        if (tail.text) {
            fullText += tail.text;
            onChunk(tail.text);
        }
        return fullText;
    },

    _drainStreamBuffer(style, buffer, flush = false) {
        const lines = buffer.split(/?
/);
        const rest = flush ? '' : (lines.pop() || '');
        let text = '';
        let done = false;

        for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line || line.startsWith(':') || line.startsWith('event:')) continue;
            let payload = line.startsWith('data:') ? line.slice(5).trim() : line;
            if (!payload) continue;
            if (payload === '[DONE]') {
                done = true;
                continue;
            }
            try {
                const data = JSON.parse(payload);
                text += this._parseStreamChunk(style, data);
            } catch (e) {
                // Some proxies split JSON across chunks; keep the last unfinished line for the next read.
                if (!flush) return { text, done, buffer: `${payload}
${rest}` };
            }
        }
        return { text, done, buffer: rest };
    },

    _parseStreamChunk(style, data) {
        if (!data) return '';
        if (style === 'anthropic') {
            if (data.type === 'content_block_delta') {
                return data.delta?.text || data.delta?.partial_json || '';
            }
            if (data.type === 'content_block_start') {
                return data.content_block?.text || '';
            }
            if (data.content) return this._parseModelResponse(style, data);
            return '';
        }
        if (style === 'gemini') {
            return (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
        }
        const choices = data.choices || [];
        const streamed = choices.map(choice => {
            const delta = choice.delta || {};
            const content = delta.content ?? choice.text ?? '';
            if (Array.isArray(content)) return content.map(p => p.text || p.content || '').join('');
            return content || '';
        }).join('');
        return streamed || this._parseModelResponse(style, data);
    },

    _toOpenAIMessage(id, msg) {
        const role = msg.role === 'assistant' ? 'assistant' : (msg.role === 'system' ? 'system' : 'user');
        if (role === 'system') return { role, content: msg.content || '' };
        const attachments = msg._attachments || [];
        const text = this._composeText(msg.content || '', attachments);
        const images = attachments.filter(f => f.type === 'image');
        if (images.length) {
            this._assertVision(id);
            return {
                role,
                content: [
                    { type: 'text', text },
                    ...images.map(f => ({ type: 'image_url', image_url: { url: f.dataUrl } }))
                ]
            };
        }
        return { role, content: text };
    },

    _toAnthropicMessage(id, msg) {
        const role = msg.role === 'assistant' ? 'assistant' : 'user';
        const attachments = msg._attachments || [];
        const text = this._composeText(msg.content || '', attachments);
        const images = attachments.filter(f => f.type === 'image');
        if (images.length) {
            this._assertVision(id);
            return {
                role,
                content: [
                    { type: 'text', text },
                    ...images.map(f => ({
                        type: 'image',
                        source: {
                            type: 'base64',
                            media_type: f.mime || 'image/png',
                            data: this._dataUrlPayload(f.dataUrl)
                        }
                    }))
                ]
            };
        }
        return { role, content: text };
    },

    _toGeminiContent(id, msg) {
        const attachments = msg._attachments || [];
        const text = this._composeText(msg.content || '', attachments);
        const images = attachments.filter(f => f.type === 'image');
        if (images.length) this._assertVision(id);
        return {
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [
                { text },
                ...images.map(f => ({
                    inlineData: {
                        mimeType: f.mime || 'image/png',
                        data: this._dataUrlPayload(f.dataUrl)
                    }
                }))
            ]
        };
    },

    _composeText(content, attachments) {
        const textParts = (attachments || [])
            .filter(f => f.type === 'text')
            .map(f => `

【附件：${f.name}】
${f.text || ''}`);
        return `${content || ''}${textParts.join('')}`.trim() || '请处理附件内容。';
    },

    _parseModelResponse(style, data) {
        if (style === 'anthropic') {
            const parts = data.content || [];
            return parts.map(p => p.text || '').join('').trim() || data.completion || '';
        }
        if (style === 'gemini') {
            return (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('').trim();
        }
        const content = data.choices?.[0]?.message?.content;
        if (Array.isArray(content)) return content.map(p => p.text || p.content || '').join('').trim();
        return content || data.choices?.[0]?.text || data.output_text || data.response || data.content || '';
    },

    _mergeExtraBody(body, config) {
        if (!config.extraJson) return;
        try {
            Object.assign(body, JSON.parse(config.extraJson));
        } catch (e) {}
    },

    _assertVision(id) {
        if (!this._capEnabled(id, 'vision')) {
            throw new Error('当前模型未开启图像输入；换视觉模型或在配置里打开图像输入');
        }
    },

    _dataUrlPayload(dataUrl) {
        return String(dataUrl || '').split(',')[1] || '';
    },

    copyMessage(index) {
        const msg = this.messages[index];
        if (!msg) return;
        Utils.copy(msg.role === 'user' ? (msg.content || '') : this._displayText(msg.content || ''));
    },

    copyLastAnswer() {
        const msg = [...this.messages].reverse().find(m => m.role === 'assistant' && m.content);
        if (!msg) return UI.toast('没有可复制的回复');
        Utils.copy(this._displayText(msg.content));
    },

    exportCurrentSession() {
        if (!this.messages.length) return UI.toast('当前会话为空');
        const session = this._session();
        const md = `# ${session?.title || '网页对话'}

` + this.messages.map(m => {
            const name = this._chatMessageLabel(m);
            return `## ${name}

${m.content}`;
        }).join('

');
        Utils.copy(md);
        UI.toast('已复制 Markdown');
    },

    autoGrow(textarea) {
        if (!textarea) return;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 192) + 'px';
    },

    _scrollBottom() {
        setTimeout(() => {
            const scroller = document.getElementById('webchat-scroll');
            if (scroller) scroller.scrollTop = scroller.scrollHeight;
        }, 20);
    },

    _shouldAutoScroll(scroller = document.getElementById('webchat-scroll')) {
        if (!scroller) return true;
        const distance = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
        return distance < 96;
    },

    _session() {
        return this.sessions.find(s => s.id === this.currentSessionId);
    },

    _model() {
        return this._modelById(this.currentModel);
    },

    _modelById(id) {
        return this._visibleModels().find(m => m.id === id) || this.models[0];
    },

    _messageModel(msg) {
        return this._modelById(msg.modelId || this.currentModel);
    },

    _chatMessageLabel(msg) {
        if (msg.role === 'user') {
            const target = msg.targetModelId ? this._modelById(msg.targetModelId)?.name : '';
            return target ? `我 → ${target}` : '我';
        }
        return this._modelById(msg.modelId || this.currentModel)?.name || '模型';
    },

    _formatChatMessageForContext(msg) {
        const label = this._chatMessageLabel(msg);
        return `【${label}】
${this._displayText(msg.content || '')}`.trim();
    },

    _config(id) {
        const model = this._modelById(id);
        if (model.poolApi) {
            const api = model.poolApi;
            return {
                apiStyle: this._providerToStyle(api.provider),
                baseUrl: api.base_url || model.baseUrl || '',
                apiKey: api.api_key || '',
                modelName: api.model_name || '',
                temperature: api.temperature ?? 0.7,
                maxTokens: api.max_tokens || 4096,
                historyLimit: api.historyLimit || 0,
                systemPrompt: api.systemPrompt || model.system || '',
                capabilities: this.configs[id]?.capabilities || null,
                extraJson: api.extraJson || ''
            };
        }
        const saved = this.configs[id] || {};
        return {
            apiStyle: saved.apiStyle || model.apiStyle || 'openai',
            baseUrl: saved.baseUrl ?? model.baseUrl ?? '',
            apiKey: saved.apiKey || '',
            modelName: saved.modelName || '',
            temperature: saved.temperature ?? 0.7,
            maxTokens: saved.maxTokens || 4096,
            historyLimit: saved.historyLimit || 0,
            systemPrompt: saved.systemPrompt || model.system || '',
            capabilities: saved.capabilities || null,
            extraJson: saved.extraJson || ''
        };
    },

    _isConfigured(id) {
        const config = this._config(id);
        const model = this._modelById(id);
        const keyOk = !!config.apiKey || model.providerId === 'ollama';
        return !!(keyOk && config.modelName && (config.baseUrl || config.apiStyle === 'gemini'));
    },

    _configuredCount() {
        return this._visibleModels().filter(m => this._isConfigured(m.id)).length;
    },

    _capEnabled(id, cap) {
        const model = this._modelById(id);
        const saved = this.configs[id]?.capabilities;
        if (saved && Object.prototype.hasOwnProperty.call(saved, cap)) return !!saved[cap];
        return (model.caps || []).includes(cap);
    },

    _normalizeCurrentModel() {
        const legacy = { gpt: 'openai', claude: 'claude', gemini: 'gemini', deepseek: 'deepseek' };
        this.currentModel = legacy[this.currentModel] || this.currentModel;
        if (!this._visibleModels().some(m => m.id === this.currentModel)) this.currentModel = 'openai';
        localStorage.setItem('web_chat_model', this.currentModel);
    },

    _visibleModels() {
        if (typeof this._allModels === 'function') return this._allModels();
        return this.models || [];
    },

    _allModels() {
        const poolIds = new Set((this.poolModels || []).map(m => m.id));
        return [...(this.poolModels || []), ...this.models.filter(m => !poolIds.has(m.id))];
    },

    _isMasterModel(id) {
        const model = this._modelById(id);
        return !!(model.poolApi && (model.poolApi.is_master === 1 || model.poolApi.is_active === 1));
    },

    _providerToStyle(provider) {
        if (provider === 'claude') return 'anthropic';
        if (provider === 'gemini') return 'gemini';
        return 'openai';
    },

    _styleToProvider(style, fallback = 'custom') {
        if (style === 'anthropic') return 'claude';
        if (style === 'gemini') return 'gemini';
        return fallback || 'custom';
    },

    _readAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    _turnNumberForIndex(index) {
        let n = 0;
        for (let i = 0; i <= index; i++) {
            if (this.messages[i]?.role === 'user') n++;
        }
        return Math.max(1, n);
    },

    _displayText(content) {
        return this._splitModelOutput(this._stripTerminalBlocks(this._extractOutputTrace(content).answer)).answer;
    },

    _renderRunTrace(msg) {
        const meta = msg?.meta || {};
        const trace = this._extractOutputTrace(msg?.content || '');
        const split = this._splitModelOutput(this._stripTerminalBlocks(trace.answer));
        const panels = [];
        if (meta.deepThink || trace.thinking) {
            const seconds = meta.elapsedMs ? Math.max(1, Math.round(meta.elapsedMs / 1000)) : 0;
            const title = meta.elapsedMs ? `已思考(用时${seconds}秒)` : '正在思考';
            const lines = [
                meta.useReasoning ? '已请求模型推理能力。' : '当前模型未标注原生推理，已使用提示词增强。',
                trace.thinking || split.process || '未返回额外思考摘要，正文已按最终答案展示。'
            ];
            panels.push(this._renderTracePanel('brain', title, lines.join('
')));
        }
        if (meta.webSearch || trace.search) {
            const title = meta.nativeWebSearch ? '联网检索(已尝试原生搜索)' : '联网检索(已请求)';
            const urlLines = (trace.urls || meta.searchUrls || []).slice(0, 8).map(url => `- ${url}`);
            const lines = [
                meta.useWebSearch ? '当前模型标注了联网能力，已要求返回检索记录。' : '当前模型未标注原生联网；如果没有检索记录，不应视为真实搜索。',
                trace.search || '模型没有返回明确的【联网记录】。',
                urlLines.length ? `
识别到的链接：
${urlLines.join('
')}` : ''
            ].filter(Boolean);
            panels.push(this._renderTracePanel('globe', title, lines.join('
')));
        }
        return panels.join('');
    },

    _renderTracePanel(icon, title, body) {
        return `
            <details class=
```

## AIP255 ? (???) ? line 2853 ? string ? 1052 chars

```text
></i><span>${this._escape(title)}</span></summary>
                <div>${this._escape(body || '').replace(/\n/g, '<br>')}</div>
            </details>`;
    },

    _extractOutputTrace(content) {
        let text = String(content || '').trim();
        const result = { thinking: '', search: '', answer: text, urls: [] };
        if (!text) return result;

        const capture = label => {
            const re = new RegExp(`【${label}】([\\s\\S]*?)(?=\\n?【(?:思考摘要|联网记录|正文|终端请求)】|$)`, 'i');
            const match = text.match(re);
            if (!match) return '';
            text = text.replace(match[0], '').trim();
            return (match[1] || '').trim();
        };

        result.thinking = capture('思考摘要');
        result.search = capture('联网记录');
        const body = String(content || '').match(/【正文】([\s\S]*)/i);
        result.answer = (body ? body[1] : text.replace(/【正文】/g, '')).trim();
        const urlSource = `${result.search}\n${result.answer}`;
        result.urls = Array.from(new Set((urlSource.match(/https?:\/\/[^\s)）\]】>
```

## AIP256 ? (???) ? line 2882 ? string ? 194 chars

```text
};

        const thinkBlocks = [];
        text = text.replace(/<think>([\s\S]*?)<\/think>/gi, (_, inner) => {
            if (inner.trim()) thinkBlocks.push(inner.trim());
            return
```

# ???assets/js/modules_split/world/world_core.js

## AIP257 ? _normalizeEntityName() ? line 264 ? string ? 551 chars

```text
'“”‘’\s]/g, '')
            .replace(/[：:，、；;。.!！?？\-—_]/g, '')
            .trim();
    },

    _deriveEntityName(entity) {
        const raw = String(entity?.desc || entity?.description || '').trim();
        if(!raw) return '';
        const line = raw
            .split(/\n+/)
            .map(s => s.replace(/^[-*#\s]+/, '').replace(/^(上下文记忆|伏笔钩子|世界规则|实体线索|规则|记忆|描述)[:：]\s*/, '').trim())
            .find(s => s && !/^来源/.test(s));
        if(!line) return '';
        return line
            .replace(/[。；;，,].*$/, '')
            .replace(/^[
```

## AIP258 ? (???) ? line 304 ? string ? 103 chars

```text
)
            .trim()
            .slice(0, 18);

        const pairRules = [
            [/ERR_?7B/i,
```

## AIP259 ? (???) ? line 351 ? string ? 478 chars

```text
]
        ];
        for(const [regex, label] of pairRules) {
            if(regex.test(text)) return label;
        }

        const quoted = text.match(/[「“"]([^」”"]{2,18})[」”"]/);
        if(quoted?.[1]) return clean(quoted[1]);
        const named = text.match(/(黑桃Q|陈默|赵衍|陆沉|林深|周鹤|赵楷|林琦|王恪|陈姐|苏晚晴|赵小满|陌生号码|诺基亚手机|地下二层|医院机房|登录界面|测试间|服务器日志|公司服务器|行为预测引擎|加密分区|创建日志|声纹记录|未知IP地址|传感器接口|测试模式|休眠模式|情感权重算法|人事档案|门禁系统|备份|密钥|声纹|句点|句号)/);
        if(named?.[1]) {
            if(type ===
```

## AIP260 ? if() ? line 361 ? string ? 323 chars

```text
&& !/(伏笔|线索|暗号|备份|异常|记录|日志|门禁|模式|算法|接口|档案|密钥|声纹|句点|句号)/.test(named[1])) {
                return clean(`${named[1]}线索`);
            }
            return clean(named[1]);
        }
        const first = text
            .split(/\n|[。；;，,：:？?！!]/)
            .map(s => s.replace(/^(信息差|伏笔|世界规则|上下文记忆|本章目标|规则|记忆|描述)[:：]?/,
```

## AIP261 ? (???) ? line 368 ? string ? 168 chars

```text
).trim())
            .find(Boolean);
        return clean(first || rawName);
    },

    _shouldRepairEntityName(entity) {
        const name = String(entity?.name ||
```

## AIP262 ? _shouldRepairEntityName() ? line 374 ? string ? 186 chars

```text
).trim();
        if(!name) return true;
        if(/^\d+\s*(章|循环)$/.test(name)) return true;
        if(this._isSentenceLikeEntityName(name, entity?.type)) return true;
        return [
```

## AIP263 ? (???) ? line 407 ? string ? 149 chars

```text
, allowedNames = null, limit = 12) {
	        const rawList = Array.isArray(relations)
	            ? relations
	            : (typeof relations ===
```

## AIP264 ? _compactEntityRelations() ? line 410 ? string ? 96 chars

```text
) : []);
	        const allowed = allowedNames ? new Set([...allowedNames].map(n => String(n ||
```

## AIP265 ? (???) ? line 411 ? string ? 495 chars

```text
).trim()).filter(Boolean)) : null;
	        const normAllowed = allowed ? new Map([...allowed].map(n => [this._normalizeEntityName(n), n])) : null;
	        const selfNorm = this._normalizeEntityName(selfName);
	        const out = [];
	        const seen = new Set();
	        for(const raw of rawList) {
	            if(raw === undefined || raw === null) continue;
	            let text = String(raw).trim();
	            if(!text) continue;
	            if(text.length > 50 && !text.includes(
```

## AIP266 ? (???) ? line 424 ? string ? 215 chars

```text
);
	                label = text.slice(0, idx).trim().slice(0, 12);
	                target = text.slice(idx + 1).trim();
	            }
	            target = target
	                .replace(/^(关联|关系|目标|对象)[:：]?/,
```

## AIP267 ? (???) ? line 431 ? string ? 13805 chars

```text
'“”‘’「」]+$/g, '')
	                .trim();
	            if(target.length < 2 || target.length > 28) continue;
	            const targetNorm = this._normalizeEntityName(target);
	            if(!targetNorm || targetNorm === selfNorm) continue;
	            if(allowed) {
	                let canonical = normAllowed.get(targetNorm);
	                if(!canonical) {
	                    canonical = [...allowed].find(n => {
	                        const nn = this._normalizeEntityName(n);
	                        return nn && targetNorm && nn !== selfNorm && (nn.includes(targetNorm) || targetNorm.includes(nn));
	                    });
	                }
	                if(!canonical) continue;
	                target = canonical;
	            }
	            const value = label ? `${label}:${target}` : target;
	            const key = this._normalizeEntityName(value);
	            if(seen.has(key)) continue;
	            seen.add(key);
	            out.push(value);
	            if(out.length >= limit) break;
	        }
	        return out;
	    },

	    _compactEntityDesc(desc, entity = {}) {
	        const type = this._normalizeEntityType(entity.type);
	        const name = String(entity.name || '').trim();
	        let text = String(desc || entity.description || '')
	            .replace(/\r/g, '\n')
	            .replace(/\s*\|\s*来源(章节|卷)[:：][^|\n]+/g, '')
	            .replace(/\s*\|\s*风险[:：][^|\n]+/g, '')
	            .replace(/来源(章节|卷)[:：][^\n|。；;]+[。；;]?/g, '')
	            .replace(/\[第[0-9零一二两三四五六七八九十百千]+章更新\]/g, '\n')
	            .replace(/第[0-9零一二两三四五六七八九十百千]+章更新[:：]?/g, '\n')
	            .replace(/本章状态[:：][^。；;\n]+[。；;]?/g, '')
	            .replace(/本章关键行为[:：][^。；;\n]+[。；;]?/g, '')
	            .replace(/关键行为[:：][^。；;\n]+[。；;]?/g, '')
	            .replace(/章末钩子[:：][^。；;\n]+[。；;]?/g, '')
	            .replace(/变化原因[:：][^。；;\n]+[。；;]?/g, '')
	            .replace(/一致性风险[:：][\s\S]*$/g, '')
	            .replace(/上下文记忆[:：]/g, '')
	            .trim();
	        if(!text) return name ? `${type || '实体'}：${name}` : '';

	        const rawParts = text
	            .split(/\n+|\s+\|\s+/)
	            .map(part => part
	                .replace(/^\s*[-*]\s*/, '')
	                .replace(/^(当前状态|本章状态|关键行为|描述|设定)[:：]\s*/, '')
	                .replace(/\s+/g, ' ')
	                .trim())
	            .filter(Boolean);
	        const parts = [];
	        const seen = new Set();
	        rawParts.forEach(part => {
	            const clean = part.replace(/[。；;\s]+$/g, '').trim();
	            if(!clean) return;
	            const key = clean.replace(/\s+/g, '').toLowerCase();
	            if(seen.has(key)) return;
	            seen.add(key);
	            parts.push(clean);
	        });
	        if(!parts.length) return name ? `${type || '实体'}：${name}` : '';

	        const clip = (value, max) => {
	            const str = String(value || '').trim();
	            if(str.length <= max) return str;
	            const cut = str.slice(0, max);
	            const idx = Math.max(cut.lastIndexOf('。'), cut.lastIndexOf('；'), cut.lastIndexOf(';'));
	            return (idx > 40 ? cut.slice(0, idx) : cut).replace(/[，,、；;。]+$/g, '') + '。';
	        };

	        let selected = [];
	        if(type === '人物') {
	            const identity = parts.find(part => /(岁|男|女|主角|反派|老板|组长|员工|租户|独居|社恐|身份|职业|核心|欲望|能力|性格|人设)/.test(part)) || parts[0];
	            const status = [...parts].reverse().find(part => /(当前|状态|被|卷入|收到|警告|标记|掌握|失去|获得|追杀|倒计时|清洗|危险)/.test(part) && part !== identity);
	            selected = [identity, status].filter(Boolean);
	        } else if(type === '世界规则') {
	            selected = [parts.find(part => /(规则|协议|限制|权限|触发|代价|禁止|必须|需要|机制)/.test(part)) || parts[0]];
	        } else if(type === '伏笔') {
	            selected = [parts.find(part => /(伏笔|埋设|回收|异常|秘密|隐藏|信息差|倒计时|电话|短信|信封|真相|未解|钩子)/.test(part)) || parts[0]];
	        } else {
	            selected = [parts[0], parts.find(part => part !== parts[0] && /(当前|用途|所属|位置|能力|规则|关系|风险|状态)/.test(part))].filter(Boolean);
	        }

	        const max = type === '人物' ? 360 : 220;
	        let result = selected
	            .map(part => clip(part, type === '人物' ? 180 : 160))
	            .filter(Boolean)
	            .join('\n');
	        result = result.replace(/\n{3,}/g, '\n\n').trim();
	        return clip(result || parts[0], max);
	    },

	    _mergeEntityDesc(base, incoming, entity = {}) {
	        const left = this._compactEntityDesc(base, entity);
	        const right = this._compactEntityDesc(incoming, entity);
	        if(!right) return left;
	        if(!left) return right;
	        if(left === right || left.includes(right)) return left;
	        if(right.includes(left)) return right;
	        const leftHasProfile = /(岁|男|女|主角|反派|老板|组长|员工|租户|身份|职业|核心|欲望|能力|性格|人设)/.test(left);
	        const rightHasProfile = /(岁|男|女|主角|反派|老板|组长|员工|租户|身份|职业|核心|欲望|能力|性格|人设)/.test(right);
	        if(right.length < left.length * 0.75 && right.length > 20) return right;
	        if(!leftHasProfile && rightHasProfile) return right;
	        return this._compactEntityDesc([left, right].join('\n'), entity);
	    },

    _mergeEntityRecords(base, incoming) {
        const out = { ...base };
        out.type = this._normalizeEntityType(out.type || incoming.type);
        const mergeArr = (...vals) => {
            const arr = [];
            vals.flat().forEach(v => {
                if(v === undefined || v === null || v === '') return;
                if(Array.isArray(v)) arr.push(...v);
                else if(typeof v === 'string' && v.includes(',') && !v.includes(':')) arr.push(...v.split(',').map(s => s.trim()));
                else arr.push(v);
            });
            return [...new Set(arr.map(v => String(v).trim()).filter(Boolean))];
        };
        out.name = out.name || incoming.name;
        out.desc = this._mergeEntityDesc(out.desc || out.description, incoming.desc || incoming.description, out);
	        out.relations = this._compactEntityRelations(mergeArr(out.relations, incoming.relations), out.name || incoming.name);
        out.chapters = mergeArr(out.chapters, incoming.chapters, incoming.chapterIds, incoming.chapterId);
        out.cycles = mergeArr(out.cycles, incoming.cycles, incoming.cycleIds, incoming.cycleId);
        out.volumes = mergeArr(out.volumes, incoming.volumes, incoming.volumeIds, incoming.volumeId);
        out.tags = mergeArr(out.tags, incoming.tags);
        out.sources = mergeArr(out.sources, out.source, incoming.source, incoming.sources);
        out.source = out.source || incoming.source || (out.sources?.[0]) || 'manual';
        out.projectId = out.projectId || incoming.projectId;
        out.createdAt = Math.min(out.createdAt || incoming.createdAt || Date.now(), incoming.createdAt || out.createdAt || Date.now());
        out.updatedAt = Math.max(out.updatedAt || 0, incoming.updatedAt || 0, Date.now());
        return out;
    },

    _updateEntityCountBadges(entities = null) {
	        const list = entities || (this._cachedEntities || []).filter(e => this._isGraphNodeEntity(e));
        const count = list.length;
        const enEl = document.getElementById('we-nav-ent-count');
        const ecEl = document.getElementById('we-db-entity-count');
        if(enEl) enEl.textContent = count;
        if(ecEl) ecEl.textContent = count;
        const typeEl = document.getElementById('we-db-entity-types');
        if(typeEl) {
            const typeCounts = {};
            list.forEach(e => { typeCounts[e.type || '其他'] = (typeCounts[e.type || '其他'] || 0) + 1; });
            const topTypes = Object.entries(typeCounts).sort((a,b) => b[1] - a[1]).slice(0,3).map(([t,c]) => `${t}:${c}`).join(' ');
            typeEl.textContent = topTypes || '暂无实体';
        }
    },

    async _ensureCache() {
        const projectId = await this._activeProjectIdForWorld();
        let allEntities = await DB.getAll('entities') || [];
        allEntities = this._filterWorldProjectRows(allEntities, projectId);
        const nameMap = new Map();
        const removals = [];
        const dirty = new Map();
	        allEntities.forEach(raw => {
            if(!raw) return;
            const e = { ...raw, type: this._normalizeEntityType(raw.type) };
            if(this._shouldRepairEntityName(e)) {
                const originalName = String(e.name || '').trim();
                const repaired = this._compactEntityName(e) || this._deriveEntityName(e);
                if(repaired) {
                    e.name = repaired;
                    if(originalName && originalName !== repaired) {
                        const desc = String(e.desc || e.description || '').trim();
                        e.desc = desc.includes(originalName) ? desc : [desc, `原始提取句：${originalName}`].filter(Boolean).join('\n');
                    }
                }
            }
            if(this._isJunkEntity(e)) {
                if(e.id) removals.push(e);
                return;
            }
            if(!e.name) return;
            const normalizedName = this._normalizeEntityName(e.name);
            const key = `${this._isWorldEntity(e) ? '世界观' : e.type || '其他'}::${normalizedName}`;
            if(nameMap.has(key)) {
                const merged = this._mergeEntityRecords(nameMap.get(key), e);
                nameMap.set(key, merged);
                dirty.set(merged.id, merged);
                if(e.id && e.id !== merged.id) removals.push(e);
            } else {
                nameMap.set(key, e);
                if(JSON.stringify(e) !== JSON.stringify(raw)) dirty.set(e.id, e);
	            }
	        });
	        const graphNames = new Set(Array.from(nameMap.values()).filter(e => this._isGraphNodeEntity(e)).map(e => e.name));
	        for(const ent of nameMap.values()) {
	            if(!this._isGraphNodeEntity(ent)) continue;
	            const compactDesc = this._compactEntityDesc(ent.desc || ent.description || '', ent);
	            if(compactDesc !== (ent.desc || '')) {
	                ent.desc = compactDesc;
	                if(ent.id) dirty.set(ent.id, ent);
	            }
	            const oldRelations = Array.isArray(ent.relations)
	                ? ent.relations
	                : (typeof ent.relations === 'string' ? ent.relations.split(',').map(s => s.trim()).filter(Boolean) : []);
	            const compacted = this._compactEntityRelations(oldRelations, ent.name, graphNames, 12);
	            if(JSON.stringify(oldRelations) !== JSON.stringify(compacted)) {
	                ent.relations = compacted;
	                if(ent.id) dirty.set(ent.id, ent);
	            }
	        }
	        if(removals.length || dirty.size) {
            for(const ent of removals) {
                try {
                    await DB.del('entities', ent.id);
                    try { await DB.del('vectors', ent.id); } catch(e) {}
                } catch(e) {}
            }
            for(const ent of dirty.values()) {
                try {
                    await DB.put('entities', ent);
                    await DB.put('vectors', {
                        id: ent.id,
                        content: `[${ent.type || '其他'}] ${ent.name}: ${ent.desc || ''}`,
                        vector: Array.from({ length: 1536 }, () => Math.random()),
                        timestamp: Date.now(),
                        projectId: ent.projectId || projectId || undefined
                    });
                } catch(e) {}
            }
            this._cachedLayeredGraphs = null;
        }
        this._cachedEntities = Array.from(nameMap.values());
        this._updateEntityCountBadges();
    },

    async _loadGraphSources() {
        const projectId = await this._activeProjectIdForWorld();
        const [volumesRaw, chaptersRaw, cyclesRaw] = await Promise.all([
            DB.getAll('volumes').catch(() => []),
            DB.getAll('chapters').catch(() => []),
            DB.getAll('cycles').catch(() => [])
        ]);
        const scopedVolumes = this._filterWorldProjectRows(volumesRaw || [], projectId);
        const scopedChapters = this._filterWorldProjectRows(chaptersRaw || [], projectId);
        const scopedCycles = this._filterWorldProjectRows(cyclesRaw || [], projectId);
        const chapters = scopedChapters.sort((a,b) => (a.order || a.number || 0) - (b.order || b.number || 0));
        const volumes = scopedVolumes.sort((a,b) => (a.order || 0) - (b.order || 0));
        const cycles = scopedCycles.sort((a,b) => (a.startChapter || 0) - (b.startChapter || 0));
        const chapterMap = new Map(chapters.map(c => [c.id, c]));
        const volumeMap = new Map(volumes.map(v => [v.id, v]));
        const cycleMap = new Map(cycles.map(c => [c.id, c]));
        return { volumes, chapters, cycles, chapterMap, volumeMap, cycleMap };
    },

    _syntheticVolumeForChapter(chapter) {
        const order = chapter.order || chapter.number || 0;
        if(!order) {
            return { id: 'volume_unassigned', title: '未分卷章节', order: 999999, synthetic: true };
        }
        const start = Math.floor((order - 1) / 20) * 20 + 1;
        const end = start + 19;
        return { id: `volume_auto_${start}_${end}`, title: `未分卷 · 第${start}-${end}章`, order: start, synthetic: true };
    },

    _getChapterVolumeId(chapter) {
        if(!chapter) return null;
        if(chapter.volumeId) return chapter.volumeId;
        return this._syntheticVolumeForChapter(chapter).id;
    },

    _asArray(value) {
        if(Array.isArray(value)) return value.filter(v => v !== undefined && v !== null && v !== '');
        if(value === undefined || value === null || value === '') return [];
        return [value];
    },

    _normalizeGraphScopeText(text) {
        return String(text || '')
            .replace(/\*\*/g, '')
            .replace(/[《》「」『』
```

## AIP268 ? (???) ? line 756 ? string ? 1843 chars

```text
);
            if(!text.trim()) return;
            let rangeMatch;
            const rangeRe = /(\d{1,4})\s*[-~至到]\s*(\d{1,4})/g;
            while((rangeMatch = rangeRe.exec(text))) {
                const start = parseInt(rangeMatch[1], 10);
                const end = parseInt(rangeMatch[2], 10);
                if(start > 0 && end >= start && end - start <= 100) {
                    for(let n = start; n <= end; n++) refs.add(n);
                }
            }
            let chMatch;
            const chRe = /第([0-9零一二两三四五六七八九十百千]+)章/g;
            while((chMatch = chRe.exec(text))) {
                const parsed = this._parseChineseNumberText(chMatch[1]);
                if(parsed > 0) refs.add(parsed);
            }
            if(/^\d{1,4}$/.test(text.trim())) add(text.trim());
        };
        [
            entity.chapterRef,
            entity.chapterRefs,
            entity.chapterOrder,
            entity.chapterNum,
            entity.chapter,
            entity.chapterTitle,
            entity.chapterTitles,
            entity.volume,
            entity.desc
        ].forEach(scan);
        return Array.from(refs).sort((a,b) => a - b);
    },

    _chapterOrderValue(chapter) {
        if(!chapter) return 0;
        return chapter.order || chapter.number || chapter.chapterNum || (Number.isInteger(chapter.index) ? chapter.index + 1 : 0);
    },

    _inferEntityChapterIds(entity, sources) {
        const ids = new Set();
        const addChapter = chapter => {
            if(chapter?.id) ids.add(chapter.id);
        };
        this._asArray(entity.chapters).concat(this._asArray(entity.chapterIds)).forEach(ref => {
            const direct = sources.chapterMap.get(ref);
            if(direct) {
                addChapter(direct);
                return;
            }
            if(typeof ref ===
```

## AIP269 ? (???) ? line 864 ? string ? 384 chars

```text
);
                return title && normRef && (title.includes(normRef) || normRef.includes(title));
            });
            if(match?.id) ids.add(match.id);
        });

        const volumeText = this._normalizeGraphScopeText([
            entity.volume,
            entity.volumeTitle,
            ...(this._asArray(entity.volumeTitles)),
            entity.desc
        ].join(
```

## AIP270 ? (???) ? line 878 ? string ? 1012 chars

```text
);
                if(title && volumeText.includes(title)) ids.add(volume.id);
            });
        }

        this._inferEntityChapterIds(entity, sources).forEach(chId => {
            const chapter = sources.chapterMap.get(chId);
            addVolumeId(this._getChapterVolumeId(chapter));
        });

        this._asArray(entity.cycles).forEach(cycleId => {
            const cycle = sources.cycleMap.get(cycleId);
            addVolumeId(cycle?.volumeId);
            (cycle?.chapterIds || []).forEach(chId => {
                const chapter = sources.chapterMap.get(chId);
                addVolumeId(this._getChapterVolumeId(chapter));
            });
        });

        return Array.from(ids);
    },

    _countScopedRelations(entities) {
        const names = new Set(entities.map(e => e.name).filter(Boolean));
        let count = 0;
        entities.forEach(e => {
            const relations = Array.isArray(e.relations)
                ? e.relations
                : (typeof e.relations ===
```

## AIP271 ? (???) ? line 1037 ? string ? 216 chars

```text
);
            if(saved?.graphs) this._cachedLayeredGraphs = saved.graphs;
        } catch(e) {}
        if(this._cachedLayeredGraphs) return this._cachedLayeredGraphs;
        return await this.rebuildLayeredGraphs(
```

## AIP272 ? (???) ? line 1110 ? string ? 373 chars

```text
, { silent: true });
        UI.toast(`[世界引擎] 循环 ${cycleData.startChapter}-${cycleData.endChapter} 已同步 (${cycleData.entityNames?.length||0}实体)`);
    },

    // 获取循环纯文本上下文（供writer.js使用）
    async getCycleContext(chapterNum, opts = {}) {
        const { maxLen = 4000 } = opts;
        const cycle = await this.getCycleForChapter(chapterNum);
        if(!cycle) return
```

## AIP273 ? if() ? line 1135 ? string ? 97 chars

```text
).forEach(f => {
                ctx += `• ${f.desc.slice(0,60)} [${f.status}]${f.planRecycle ?
```

## AIP274 ? (???) ? line 1158 ? string ? 517 chars

```text
);
        }
        // EMO
        if(cycle.nexusEMO && cycle.nexusEMO.length) {
            const current = cycle.nexusEMO.find(e => e.chapter == chapterNum);
            snapshot.emo = current ? `${current.word}(${current.score})` : `avg:${Math.round(cycle.nexusEMO.reduce((a,b)=>a+(b.score||0),0)/cycle.nexusEMO.length)}`;
        }
        return snapshot;
    },

    render: () => {
        const we = Modules.world_engine;
        const t = we.currentTab;
        const tabs = [
            {id:
```

## AIP275 ? (???) ? line 1213 ? string ? 177 chars

```text
)">
                        <i class="fa-solid fa-rocket text-red-400 w-5 text-center"></i>
                        <span>融合数据</span>
                        ${hasPipeline ?
```

## AIP276 ? (???) ? line 1218 ? string ? 633 chars

```text
)">
                        <i class="fa-solid fa-shield-halved text-emerald-400 w-5 text-center"></i>
                        <span>叙事一致性</span>
                        <span class="ml-auto text-[8px] text-dim" id="we-nav-consistency-badge">监控中</span>
                    </button>
                </div>
                <div class="flex-1 overflow-y-auto" id="we-sub-panel">
                    ${we._renderSubPanel()}
                </div>
                <div class="p-3 border-t border-white/5 bg-[#0a0a0c] space-y-2">
                    ${Modules.world_engine.renderExportMenu ? Modules.world_engine.renderExportMenu(
```

## AIP277 ? (???) ? line 1260 ? string ? 364 chars

```text
) Modules.world_engine._refreshVectors();
    },

    onShow: async () => {
        Modules.world_engine._cachedEntities = null;
        Modules.world_engine._cachedLayeredGraphs = null;
        await Modules.world_engine._ensureCache();
        const t = Modules.world_engine.currentTab;
        await Modules.world_engine._refreshDashboard?.();
        if(t ===
```

## AIP278 ? if() ? line 1270 ? string ? 120 chars

```text
, { silent: true });
            setTimeout(() => Modules.world_engine._initGraph?.(), 100);
        }
        if(t ===
```

## AIP279 ? (???) ? line 1312 ? string ? 1003 chars

```text
}
            ];
            return `<div class="p-2 space-y-2">
                <button class="btn btn-xs bg-gradient-to-r from-blue-600/20 to-cyan-600/20 text-cyan-400 border border-cyan-500/30 w-full font-bold" onclick="Modules.world_engine._openImportModal()"><i class="fa-solid fa-file-import mr-1"></i>导入世界观设定</button>
                <button class="btn btn-xs bg-gradient-to-r from-amber-600/20 to-orange-600/20 text-amber-400 border border-amber-500/30 w-full font-bold" onclick="Modules.world_engine._openNovelImportModal()"><i class="fa-solid fa-book mr-1"></i>导入新书/续写</button>
                <div class="border-t border-white/5 pt-2 mt-1">
                    <div class="text-[9px] text-dim font-bold uppercase tracking-wider mb-1.5">七大维度</div>
                </div>
                <div class="space-y-1">${cats.map(c => `
                    <button class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[11px] font-bold transition-all ${we.worldCat===c.id ?
```

## AIP280 ? (???) ? line 1335 ? string ? 190 chars

```text
};
                            const active = we._entityFilter === f;
                            return `<button class="flex-1 text-[9px] py-1 rounded font-bold transition-all ${active ?
```

## AIP281 ? (???) ? line 1341 ? string ? 202 chars

```text
].map(tp => {
                            const active = we._typeFilter === tp;
                            return `<button class="text-[8px] px-1.5 py-0.5 rounded font-bold transition-all ${active ?
```

## AIP282 ? (???) ? line 1363 ? string ? 227 chars

```text
;Modules.world_engine._initGraph()">
                        <option value="auto">自动选择有效卷</option>
                        ${(graphs.volumes || []).map(g => `<option value="${g.scopeId}" ${we._graphVolumeFilter === g.scopeId ?
```

## AIP283 ? (???) ? line 1367 ? string ? 226 chars

```text
;Modules.world_engine._initGraph()">
                        <option value="auto">自动选择有效循环</option>
                        ${(graphs.cycles || []).map(g => `<option value="${g.scopeId}" ${we._graphCycleFilter === g.scopeId ?
```

## AIP284 ? (???) ? line 1604 ? string ? 544 chars

```text
;
        const entities = (this._cachedEntities || []).filter(e => this._isGraphNodeEntity ? this._isGraphNodeEntity(e) : !this._isWorldEntity(e));
        const worlds = (this._cachedEntities || []).filter(e => this._isWorldEntity(e) && e.desc);
        const FB = Modules.fusion_book;
        const hasFusion = FB && ((FB._allPipelineResults||{}).fusion || (FB._pipelineResults||{}).fusion);
        const hasPipeline = FB && FB._pipelineResults && Object.keys(FB._pipelineResults).length > 0;
        const ec = document.getElementById(
```

## AIP285 ? (???) ? line 1766 ? string ? 312 chars

```text
);
    },

    // ═══ 流水线概览 ═══
    _renderPipelineOverview: () => {
        const FB = Modules.fusion_book;
        const allPr = (FB && FB._allPipelineResults) ? FB._allPipelineResults : {};
        const curPr = (FB && FB._pipelineResults) ? FB._pipelineResults : {};
        const pr = {};
        [
```

## AIP286 ? (???) ? line 1775 ? string ? 94 chars

```text
].forEach(k => {
            pr[k] = (allPr[k] && allPr[k].trim()) ? allPr[k] : (curPr[k] ||
```

# ???assets/js/modules_split/world/world_graph.js

## AIP287 ? _safeExportFilename() ? line 330 ? string ? 1835 chars

```text
<>|]/g, '_')
            .replace(/\s+/g, ' ')
            .trim() || '未命名项目';
    },

    _buildNovelTxt(project, volumes, chapters) {
        const projectName = project?.name || '未命名项目';
        const chaptersWithText = (chapters || []).filter(ch => (ch.content || '').trim());
        const totalWords = chaptersWithText.reduce((sum, ch) => sum + (ch.content || '').length, 0);
        const volumeMap = new Map((volumes || []).map(v => [v.id, v]));
        const lines = [
            `《${projectName}》`,
            `导出时间：${new Date().toLocaleString('zh-CN')}`,
            `章节数：${chaptersWithText.length}`,
            `正文字数：${totalWords}`,
            '',
            '============================================================',
            ''
        ];
        let lastVolumeId = null;
        chaptersWithText.forEach((ch, index) => {
            const volumeId = ch.volumeId || '';
            if (volumeId && volumeId !== lastVolumeId) {
                const vol = volumeMap.get(volumeId);
                if (index > 0) lines.push('============================================================', '');
                lines.push(`第${vol?.order || '?'}卷 ${vol?.title || vol?.name || '未命名卷'}`, '');
                lastVolumeId = volumeId;
            } else if (!volumeId) {
                lastVolumeId = null;
            }
            lines.push(`第${ch.order || ch.number || '?'}章 ${ch.title || '未命名'}`, '');
            lines.push((ch.content || '').trim(), '');
        });
        return lines.join('\n').replace(/\n{4,}/g, '\n\n\n').trim() + '\n';
    },

    renderExportMenu(label = '导出工程', fullWidth = false, direction = 'up') {
        const widthClass = fullWidth ? 'w-full' : '';
        const positionClass = direction === 'down' ? 'top-full mt-1' : 'bottom-full mb-1';
        return `
        <div class=
```

## AIP288 ? (???) ? line 378 ? template ? 2146 chars

```text
;
    },

    toggleExportMenu(btn) {
        if (!this._exportMenuEventsBound && typeof document !== 'undefined') {
            this._exportMenuEventsBound = true;
            document.addEventListener('click', evt => {
                if (!evt.target?.closest?.('[data-export-menu-root]')) Modules.world_engine.closeExportMenus();
            });
            document.addEventListener('keydown', evt => {
                if (evt.key === 'Escape') Modules.world_engine.closeExportMenus();
            });
        }
        const root = btn?.closest?.('[data-export-menu-root]');
        const menu = root?.querySelector?.('[data-export-menu]');
        if (!menu) return;
        const willShow = menu.classList.contains('hidden');
        this.closeExportMenus();
        menu.classList.toggle('hidden', !willShow);
    },

    closeExportMenus() {
        if (typeof document === 'undefined') return;
        document.querySelectorAll('[data-export-menu]').forEach(el => el.classList.add('hidden'));
    },

    _getScopedFusionPipeline(projectId) {
        const FB = Modules.fusion_book;
        if (!FB || !projectId) return null;
        const saved = FB._savedPipelineState || {};
        const markers = [
            FB._pipelineProjectId,
            FB._plConfig?.projectId,
            saved.projectId,
            saved.config?.projectId
        ].filter(Boolean).map(String);
        if (!markers.length || !markers.includes(String(projectId))) return null;
        return {
            allPr: FB._allPipelineResults || saved.allPipelineResults || {},
            pr: FB._pipelineResults || saved.results || {}
        };
    },

    exportNovelTxt: async () => {
        const we = Modules.world_engine;
        const { project, volumes, chapters } = await we._getCurrentProjectExportScope();
        if (!project) return UI.toast('请先创建或选择一个项目', 'warning');
        if (!chapters.length) return UI.toast('当前项目暂无章节正文可导出', 'warning');
        if (!chapters.some(ch => (ch.content || '').trim())) return UI.toast('当前项目章节暂无正文内容', 'warning');
        const txt = we._buildNovelTxt(project, volumes, chapters);
        const filename =
```

## AIP289 ? (???) ? line 428 ? template ? 1406 chars

```text
;
        if (Utils.download) Utils.download(filename, txt, 'text/plain;charset=utf-8');
        UI.toast('已导出整本正文 TXT');
    },

    // ═══ 一键导出完整工程：世界引擎 + 细纲 + 正文 ═══
    exportAll: async () => {
        const we = Modules.world_engine;
        const { project: activeProject, projectId, volumes, chapters, outlines, writings, cycles, entities: scopedEntities } = await we._getCurrentProjectExportScope();
        if (!activeProject) return UI.toast('请先创建或选择一个项目', 'warning');
        const exportEntities = (scopedEntities || [])
            .filter(e => e && e.id)
            .map(e => ({ ...e, type: we._normalizeEntityType ? we._normalizeEntityType(e.type) : (e.type || '其他') }));
        const entities = exportEntities.filter(e => !String(e.id || '').startsWith('world_'));
        const worlds = exportEntities.filter(e => String(e.id || '').startsWith('world_') && e.desc);
        const catLabels = {history:'历史与传说',geography:'地理与地貌',magic:'魔法/科技体系',factions:'势力与组织',species:'种族与生物',rules:'世界规则',culture:'文化与习俗'};
        const sortedChapters = (chapters || []).slice().sort((a,b) => (a.order || a.number || 0) - (b.order || b.number || 0));
        const sortedVolumes = (volumes || []).slice().sort((a,b) => (a.order || 0) - (b.order || 0));
        const totalWords = sortedChapters.reduce((sum, ch) => sum + ((ch.content || '').length), 0);
        let md = '# 创作工程一键导出\n\n';
        md +=
```

## AIP290 ? (???) ? line 487 ? template ? 399 chars

```text
;
                    md += '\n\n';
                });
            }
        }
        if(cycles && cycles.length) {
            md += '---\n## 分层图谱 / 循环\n\n';
            cycles.slice().sort((a,b) => (a.startChapter || 0) - (b.startChapter || 0)).forEach(c => {
                const cycleTitle = c.title || ('循环 ' + (c.startChapter || '?') + '-' + (c.endChapter || '?'));
                md +=
```

## AIP291 ? (???) ? line 510 ? template ? 223 chars

```text
;
                md += (ch.outline && ch.outline.trim()) ? ch.outline.trim() + '\n\n' : '（无细纲）\n\n';
            });

            md += '---\n## 执笔台正文\n\n';
            sortedChapters.forEach(ch => {
                md +=
```

## AIP292 ? (???) ? line 516 ? template ? 331 chars

```text
;
                md += (ch.content && ch.content.trim()) ? ch.content.trim() + '\n\n' : '（无正文）\n\n';
            });
        }

        if(outlines && outlines.length) {
            md += '---\n## 细纲库补充\n\n';
            outlines.slice().sort((a,b) => (a.createdAt || 0) - (b.createdAt || 0)).forEach(o => {
                md +=
```

## AIP293 ? (???) ? line 535 ? template ? 828 chars

```text
;
            });
        }

        const scopedPipeline = we._getScopedFusionPipeline(projectId);
        if(scopedPipeline) {
            const allPr = scopedPipeline.allPr || {};
            const pr = scopedPipeline.pr || {};
            const labels = { left:'左书拆解弹药', right:'右书拆解弹药', compare:'技法对比', fusion:'融合弹药', world:'实体提取', outline:'拆书生成细纲', write:'拆书生成正文' };
            const keys = ['left','right','compare','fusion','world','outline','write'];
            const hasPipeline = keys.some(k => ((allPr[k] && allPr[k].trim()) || (pr[k] && pr[k].trim())));
            if(hasPipeline) {
                md += '---\n## 融合拆书弹药\n\n';
                keys.forEach(k => {
                    const content = (allPr[k] && allPr[k].trim()) ? allPr[k] : (pr[k] || '');
                    if(content && content.trim()) md +=
```

# ???assets/js/modules_split/world/world_import.js

## AIP294 ? prompt ? line 476 ? template ? 707 chars

```text
你是一个专业的小说世界观解析引擎。请从以下内容中提取结构化的世界观设定和实体。

【原始内容】
${...}

【已有实体库（请尽可能匹配这些名称建立关联）】
${...}

【提取要求】
请提取以下内容：

1. 世界观设定（7个维度）：
   - history (历史与传说)
   - geography (地理与地貌)
   - magic (魔法/科技体系)
   - factions (势力与组织)
   - species (种族与生物)
   - rules (世界规则)
   - culture (文化与习俗)

2. 实体：
   - 只提取能画成知识图谱节点的要素点：人物、物品、地点、情节、伏笔、势力、种族、能力、魔法、世界规则、文化、历史
   - 不提取整句剧情摘要、上下文记忆、情绪锚点、写作技法

【输出格式】严格JSON：
{
  "worldViews": [
    {"id": "history", "label": "历史与传说", "content": "详细内容..."}
  ],
  "entities": [
    {"name": "实体名", "type": "类型", "desc": "要素卡(30-80字)", "relations": ["关系类型:关联实体名"]}
  ]
}

【关键要求】
- 实体名必须是短名词，不要用一整句话当实体名
- 每个实体的relations只保留3-8条关键关系，并且只能指向实体名
- 关系类型例如：师父、徒弟、敌对、盟友、所属、位于、拥有、使用等
- 直接输出JSON，不要包裹markdown代码块
```

# ???assets/js/modules_split/world/world_novel_import.js

## AIP295 ? _mergeImportedDuplicateChapters() ? line 716 ? string ? 15540 chars

```text
'“”‘’\s]/g, '')
		            .replace(/[：:，、；;。.!！?？\-]/g, '')
		            .toLowerCase();
		        const hasBody = c => this._normalizeImportedBodyContent(c?.content || '').length > 0;
		        const hasOutline = c => String(c?.outline || '').trim().length > 0;
		        const bodyLooksOutline = c => this._looksLikeImportedOutlineText(c?.content || '');
		        const merged = [];
		        const byTitle = new Map();
		        const byOrder = new Map();
		        const byLooseOrder = new Map();
		        const rememberOrder = (chapter, scopedKey, looseKey) => {
		            if (scopedKey && !byOrder.has(scopedKey)) byOrder.set(scopedKey, chapter);
		            if (looseKey) {
		                const rows = byLooseOrder.get(looseKey) || [];
		                if (!rows.includes(chapter)) rows.push(chapter);
		                byLooseOrder.set(looseKey, rows);
		            }
		        };
		        for (const chapter of chapters || []) {
		            chapter.content = this._normalizeImportedBodyContent(chapter.content || '');
		            if (!hasOutline(chapter) && bodyLooksOutline(chapter)) {
		                chapter.outline = this._normalizeOutlineText(chapter.content || '');
		                chapter.content = '';
		                chapter.outlineSource = chapter.outlineSource || 'original';
		            }
		            const key = normalize(chapter.title || '');
		            const scopedOrderKey = chapter.order ? `order:${chapter.volumeId || ''}:${chapter.order}` : '';
		            const looseOrderKey = chapter.order ? `order:${chapter.order}` : '';
		            if (!key) {
		                merged.push(chapter);
		                rememberOrder(chapter, scopedOrderKey, looseOrderKey);
		                continue;
		            }
		            const looseMatches = looseOrderKey ? (byLooseOrder.get(looseOrderKey) || []) : [];
		            const existing = byTitle.get(key)
		                || (scopedOrderKey ? byOrder.get(scopedOrderKey) : null)
		                || (!chapter.volumeId && looseMatches.length === 1 ? looseMatches[0] : null);
		            if (!existing) {
		                byTitle.set(key, chapter);
		                rememberOrder(chapter, scopedOrderKey, looseOrderKey);
		                merged.push(chapter);
		                continue;
		            }
		            if (!hasBody(existing) && hasBody(chapter)) existing.content = chapter.content;
		            else if (bodyLooksOutline(existing) && hasBody(chapter) && !bodyLooksOutline(chapter)) existing.content = chapter.content;
		            if (!hasOutline(existing) && hasOutline(chapter)) {
		                existing.outline = chapter.outline;
		                existing.outlineSource = chapter.outlineSource || existing.outlineSource;
		            }
		            if ((!existing.sections || !existing.sections.length) && chapter.sections?.length) existing.sections = chapter.sections;
		            if (!existing.volumeId && chapter.volumeId) existing.volumeId = chapter.volumeId;
		            if (key && !byTitle.has(key)) byTitle.set(key, existing);
		            existing.mergedImportIds = [...new Set([...(existing.mergedImportIds || []), existing.id, chapter.id].filter(Boolean))];
	            existing.status = existing.content ? 'done' : 'outline';
	        }
	        return merged.map((chapter, idx) => ({ ...chapter, order: idx + 1 }));
	    },

	    _extractEmbeddedChapterOutline(content) {
	        const text = String(content || '');
	        if (!text.trim()) return null;
	        const markerRe = /(?:【(?:本章)?细纲】|【大纲】|##+\s*(?:本章)?细纲|(?:本章)?细纲[:：])([\s\S]*?)(?:【正文】|##+\s*正文|正文[:：]|$)/i;
	        const bodyMarkerRe = /(?:【正文】|##+\s*正文|正文[:：])([\s\S]*)$/i;
	        const marked = text.match(markerRe);
	        let outline = marked ? marked[1].trim() : '';
	        let body = '';
	        const bodyMarked = text.match(bodyMarkerRe);
	        if (bodyMarked) body = bodyMarked[1].trim();
	        if (!outline) {
	            const first = text.slice(0, 2600);
	            const hasOutlineFields = /本章目标|阻力与代价|情节动作|人物变化|世界规则|伏笔钩子|实体线索|上下文记忆|一致性风险|核心事件|叙事功能|情节流|卷目标|卷规则|卷伏笔|前情提要|场次|分段|第[一二三四五六七八九十\d]+部分/.test(first);
	            if (hasOutlineFields) {
	                const stop = first.search(/\n\s*(?:【正文】|正文[:：]|第一段正文|原文[:：])/);
	                outline = (stop > 0 ? first.slice(0, stop) : first).trim();
	                if (stop > 0) body = text.slice(stop).replace(/^\s*(?:【正文】|正文[:：]|第一段正文|原文[:：])\s*/i, '').trim();
	            }
	        }
	        if (!outline || outline.length < 40) return null;
	        return { outline: this._normalizeOutlineText(outline), sections: this._outlineToSections(outline, body || ''), body };
	    },

    _normalizeOutlineText(outline) {
        return String(outline || '').trim()
            .replace(/^???(?:markdown|md)?\s*/i, '')
            .replace(/???$/i, '')
            .trim();
    },

    _normalizeImportedOutline(chapter, outline) {
        const base = this._normalizeOutlineText(outline);
        const hasFixedFields = /本章目标|阻力与代价|情节动作|实体线索|上下文记忆/.test(base);
        if (hasFixedFields) return base;
        const sections = chapter.sections?.length ? chapter.sections : this._splitChapterIntoSections(chapter.content || '', chapter.title || '');
        return [
            `【已导入章节】${chapter.title || ''}`,
            `**本章目标：** ${base.slice(0, 160)}`,
            `**阻力与代价：** 依据原细纲和正文冲突补齐`,
            `**情节动作：** 参考原文正文推进，不重写已导入正文`,
            `**人物变化：** 从原细纲和正文行为中提取`,
            `**世界规则：** 从原细纲和正文明确设定中提取`,
            `**伏笔钩子：** 从原细纲和章末内容提取`,
            `**实体线索：** 人物、地点、势力、物品、能力、规则、关系`,
            `**上下文记忆：** 原文事实、承诺、误会、限制必须保留`,
            `**一致性风险：** 不要覆盖原文正文，不要跳过原文事实`,
            '',
            `【原文细纲】`,
            base,
            '',
            this._formatSectionOutline(sections)
        ].join('\n');
    },

    _splitChapterIntoSections(content, title = '') {
        const raw = String(content || '').trim();
        if (!raw) return [];
        let chunks = raw
            .split(/\n\s*(?:[-*_]{3,}|【(?:场景|分段|部分)\s*\d+[^】]*】|#{3,}\s+.+)\s*\n/g)
            .map(x => x.trim())
            .filter(x => x.length > 40);
        if (chunks.length <= 1) {
            const paras = raw.split(/\n{2,}/).map(x => x.trim()).filter(x => x.length > 30);
            const target = Math.min(6, Math.max(3, Math.ceil(raw.length / 1800)));
            if (paras.length >= target) {
                chunks = [];
                let cur = '';
                const groupSize = Math.ceil(paras.length / target);
                paras.forEach((p, idx) => {
                    cur += (cur ? '\n\n' : '') + p;
                    if ((idx + 1) % groupSize === 0 || idx === paras.length - 1) {
                        chunks.push(cur.trim());
                        cur = '';
                    }
                });
            } else {
                chunks = [];
                const targetByLen = Math.min(6, Math.max(2, Math.ceil(raw.length / 2200)));
                const size = Math.ceil(raw.length / targetByLen);
                for (let i = 0; i < raw.length; i += size) chunks.push(raw.slice(i, i + size).trim());
            }
        }
        return chunks.filter(Boolean).slice(0, 8).map((chunk, idx) => {
            const firstSentence = (chunk.match(/[^。！？!?；;]+[。！？!?；;]?/) || [chunk.slice(0, 120)])[0].trim();
            const tailSentence = (chunk.match(/[^。！？!?；;]+[。！？!?；;]?\s*$/) || [''])[0].trim();
            return {
                order: idx + 1,
                title: `${title ? title + ' · ' : ''}第${idx + 1}部分`,
                summary: firstSentence.slice(0, 160),
                function: idx === 0 ? '开场/承接' : idx === chunks.length - 1 ? '收束/钩子' : '推进/转折',
                hook: tailSentence.slice(0, 120),
                wordCount: chunk.length
            };
        });
    },

	    _formatSectionOutline(sections = []) {
	        if (!sections.length) return '【章内分部分细纲】\n- 暂无分段，等待补齐';
	        return ['【章内分部分细纲】'].concat(sections.map(s => [
            `#### 第${s.order}部分：${s.title || '未命名'}`,
            `- 情节功能：${s.function || '推进'}`,
            `- 核心动作：${s.summary || '待补'}`,
            `- 伏笔/钩子：${s.hook || '待补'}`,
            `- 实体线索：${(s.entities || []).join('、') || '从本部分正文提取'}`
	        ].join('\n'))).join('\n\n');
	    },

	    _cleanNovelImportHeading(line = '') {
	        return String(line || '')
	            .replace(/^\s{0,3}#{1,6}\s*/, '')
	            .replace(/\*\*/g, '')
	            .replace(/^\s*[-*+]\s*/, '')
	            .replace(/^\s*>\s*/, '')
	            .trim();
	    },

	    _detectNovelImportZone(line = '') {
	        const raw = this._cleanNovelImportHeading(line);
	        if (/^【\s*(?:一句话开书|开书一句话|故事种子|开书种子)\s*】/.test(raw)) return 'brief';
	        if (/^【\s*(?:细纲|大纲|层级大纲|创作大纲|章纲|章节细纲|分章细纲|本书细纲|故事细纲|卷章细纲)\s*】/.test(raw)) return 'outline';
	        if (/^【\s*(?:正文|原文|已有正文|正文内容|原稿正文|章节正文)\s*】/.test(raw)) return 'body';
	        const text = raw
	            .replace(/^【\s*/, '')
	            .replace(/\s*】/, '')
	            .replace(/^\[\s*/, '')
	            .replace(/\s*\]/, '')
	            .trim();
	        if (/^(?:一句话开书|开书一句话|故事种子|开书种子)(?:[：:\s]|$)/.test(text)) return 'brief';
	        if (/^(?:细纲|大纲|层级大纲|创作大纲|章纲|章节细纲|分章细纲|本书细纲|故事细纲|卷章细纲)(?:[：:\s]|$)/.test(text)) return 'outline';
	        if (/^(?:正文|原文|已有正文|正文内容|原稿正文|章节正文)(?:[：:\s]|$)/.test(text)) return 'body';
	        return null;
	    },

	    _extractNovelImportZonePayload(line = '', zone = '') {
	        const text = this._cleanNovelImportHeading(line)
	            .replace(/^【\s*/, '')
	            .replace(/\s*】/, '')
	            .replace(/^\[\s*/, '')
	            .replace(/\s*\]/, '')
	            .trim();
	        const patterns = {
	            brief: /^(?:一句话开书|开书一句话|故事种子|开书种子)\s*[：:\s]*/,
	            outline: /^(?:细纲|大纲|层级大纲|创作大纲|章纲|章节细纲|分章细纲|本书细纲|故事细纲|卷章细纲)\s*[：:\s]*/,
	            body: /^(?:正文|原文|已有正文|正文内容|原稿正文|章节正文)\s*[：:\s]*/
	        };
	        const re = patterns[zone];
	        return re ? text.replace(re, '').trim() : '';
	    },

	    _parseNovelImportOrdinal(raw, fallback = 1) {
	        const text = String(raw || '').trim();
	        if (/^\d+$/.test(text)) return parseInt(text, 10);
	        const digits = { 零:0, 〇:0, 一:1, 二:2, 两:2, 三:3, 四:4, 五:5, 六:6, 七:7, 八:8, 九:9 };
	        if (!/[十百千]/.test(text)) {
	            const direct = text.split('').reduce((n, ch) => n * 10 + (digits[ch] ?? 0), 0);
	            return direct || fallback;
	        }
	        let total = 0;
	        let section = 0;
	        let number = 0;
	        for (const ch of text) {
	            if (digits[ch] != null) {
	                number = digits[ch];
	            } else if (ch === '十') {
	                section += (number || 1) * 10;
	                number = 0;
	            } else if (ch === '百') {
	                section += (number || 1) * 100;
	                number = 0;
	            } else if (ch === '千') {
	                section += (number || 1) * 1000;
	                number = 0;
	            }
	        }
	        total = section + number;
	        return total || fallback;
	    },

	    _parseNovelImportChapterOrder(title = '', fallback = 1) {
	        const text = this._cleanNovelImportHeading(title);
	        const cn = text.match(/第\s*([一二三四五六七八九十百千零〇两\d]+)\s*[章回节]/);
	        if (cn) return this._parseNovelImportOrdinal(cn[1], fallback);
	        const en = text.match(/Chapter\s+(\d+)/i);
	        return en ? parseInt(en[1], 10) : fallback;
	    },

	    _parseNovelImportVolumeOrder(title = '', fallback = 1) {
	        const text = this._cleanNovelImportHeading(title);
	        const cn = text.match(/第\s*([一二三四五六七八九十百千零〇两\d]+)\s*[卷部篇]/);
	        if (cn) return this._parseNovelImportOrdinal(cn[1], fallback);
	        const en = text.match(/Volume\s+(\d+)/i);
	        return en ? parseInt(en[1], 10) : fallback;
	    },

	    _looksLikeImportedOutlineText(text = '') {
	        const sample = String(text || '').slice(0, 3000);
	        if (!sample.trim()) return false;
	        const hits = [
	            /本章目标/, /阻力与代价/, /情节动作/, /人物变化/, /世界规则/,
	            /伏笔钩子/, /实体线索/, /上下文记忆/, /一致性风险/,
	            /章内分部分细纲/, /核心事件/, /叙事功能/, /情节流/, /读者期待/,
	            /第[一二三四五六七八九十\d]+(?:部分|场|段)/
	        ].filter(re => re.test(sample)).length;
	        return hits >= 2 || /【(?:本章)?细纲】|【大纲】/.test(sample);
	    },

	    _normalizeImportedBodyContent(content = '') {
	        const text = String(content || '').trim();
	        if(!text) return '';
	        const compact = text
	            .replace(/\s+/g, '')
	            .replace(/[。.!！…．·]+$/g, '');
	        if(/^(?:无正文内容|暂无正文|正文暂无|暂无原文|待写|待补写|待续写|未生成正文|AI正在努力创作中请稍候|AI生成中请稍候)$/i.test(compact)) return '';
	        if(/^AI正在努力创作中/i.test(compact) && compact.length <= 40) return '';
	        return text;
	    },

	    _isNovelImportGenericChapterHeading(title = '') {
	        const text = this._cleanNovelImportHeading(title);
	        if(!text) return false;
	        if(this._isNovelImportVolumeHeading(text) || this._isNovelImportChapterHeading(text)) return false;
	        if(/^(?:前言|创作核心理念|项目标题|最后修改|创世蓝图|层级大纲|正文内容|前情提要)(?:[：:\s]|$)/i.test(text)) return false;
	        if(/^第\s*[一二三四五六七八九十百千零〇两\d]+\s*步(?:[：:\s]|$)/.test(text)) return false;
	        if(/^\d+\s*[.、．]\s*/.test(text)) return false;
	        if(/^【?第\s*[一二三四五六七八九十百千零〇两\d]+\s*卷\s*(?:完|完结|结束|END)\s*】?$/i.test(text)) return false;
	        if(/^(?:情绪节奏应用解析|开篇模式选择|开篇情景简述)(?:[：:\s]|$)/.test(text)) return false;
	        return true;
	    },

	    _isNovelImportVolumeHeading(line = '') {
	        const text = this._cleanNovelImportHeading(line);
	        if(/^【?第\s*[一二三四五六七八九十百千零〇两\d]+\s*卷\s*(?:完|完结|结束|END)\s*】?$/i.test(text)) return false;
	        if(/^[（(]\s*第\s*[一二三四五六七八九十百千零〇两\d]+\s*卷\s*(?:完|完结|结束|END)\s*[）)]$/i.test(text)) return false;
	        return /^(?:[（(]?\s*第\s*[一二三四五六七八九十百千零〇两\d]+\s*[卷部篇]\s*[）)]?|Volume\s+\d+)(?:[：:\s]|$)/i.test(text);
	    },

	    _isNovelImportChapterHeading(line = '') {
	        const text = this._cleanNovelImportHeading(line);
	        if (this._isNovelImportVolumeHeading(text)) return false;
	        return /^(?:第\s*[一二三四五六七八九十百千零〇两\d]+\s*[章回节]|Chapter\s+\d+)(?:[：:\s]|$)/i.test(text);
	    },

	    _outlineToSections(outline, content = '') {
        const text = String(outline || '');
        const blocks = text.split(/\n(?=(?:#{3,4}\s+第|第[一二三四五六七八九十\d]+(?:部分|场|段)|【(?:场次|分段|部分)))/).map(x => x.trim()).filter(x => x.length > 30);
        if (blocks.length > 1) {
            return blocks.slice(0, 8).map((b, idx) => ({
                order: idx + 1,
                title: (b.split('\n')[0] || `第${idx + 1}部分`).replace(/^#+\s*/, '').slice(0, 40),
                summary: b.slice(0, 180),
                function: /收束|钩子|章末/.test(b) ? '收束/钩子' : idx === 0 ? '开场/承接' : '推进/转折',
                hook: ((b.match(/(?:钩子|伏笔)[:：]?\s*([^\n]+)/) || [])[1] || '').slice(0, 120),
                source: 'outline'
            }));
        }
        return this._splitChapterIntoSections(content, '');
    },

    async _aiGenerateImportedChapterOutline(chapter) {
        const sections = this._splitChapterIntoSections(chapter.content || '', chapter.title || '');
        const sourceParts = sections.map(s => `【第${s.order}部分】${s.summary}\n${s.hook ? '末尾：' + s.hook : ''}`).join('\n\n');
        const prompt = `你是导入续写的章内细纲解析器。不要改写原文正文，只从原文反推每章可续写细纲。

【章节】第${chapter.order || ''}章 ${chapter.title || ''}
【正文分段摘要】
${sourceParts || (chapter.content || '').slice(0, 5000)}

输出严格JSON，不要markdown：
{
```

## AIP296 ? (???) ? line 1045 ? string ? 6568 chars

```text
}
  ]
}

规则：
1. 只能基于原文，不能新增剧情。
2. 每个部分都要能指导后续续写，不要写主题口号。
3. 实体线索必须能同步到世界引擎知识图谱，并服务后续执笔台续写。
4. 一致性风险要指出续写时最容易写崩的地方。`;
        let raw = '';
        await AI.generate(prompt, { apiType: 'parse', module: 'world_import_outline', max_tokens: 2600, temperature: 0.2 }, c => { raw += c; });
        const clean = raw.trim().replace(/^???(?:json)?\s*/i, '').replace(/???$/i, '').trim();
        let json = null;
        try {
            const m = clean.match(/\{[\s\S]*\}/);
            json = m ? JSON.parse(m[0]) : JSON.parse(clean);
        } catch(e) {
            return null;
        }
        const parsedSections = Array.isArray(json.sections) ? json.sections : sections;
        const outline = this._normalizeOutlineText(json.outline || '');
        if (!outline) return null;
        return {
            outline: outline + '\n\n' + this._formatSectionOutline(parsedSections),
            sections: parsedSections
        };
    },

	    async _parseNovelStructure(fullText, chunks, opts = {}) {
	        // 先尝试规则分章：显式区分【细纲】与【正文】，避免细纲文本被当作正文写进执笔台。
	        const lines = fullText.split('\n');
	        const volumes = [];
	        const chapters = [];
	        const briefLines = [];
	        let currentVol = null;
	        let currentChap = null;
	        let chapOrder = 1;
	        let volOrder = 1;
	        let currentZone = null;
	        let hasExplicitOutlineZone = false;

	        const markdownHeadingRegex = /^#{2,6}\s+(.+)$/;
	        const excludedMarkdownHeading = /^(?:创世蓝图|层级大纲|正文内容|前情提要|卷目标|卷规则|卷伏笔|实体线索|上下文记忆|一致性风险|一句话开书|细纲|大纲|章纲|正文|原文)(?:[（(:：\s]|$)/i;

	        const flushChapter = () => {
	            if(!currentChap) return;
	            const outline = (currentChap._outlineLines || []).join('\n').trim();
	            const content = this._normalizeImportedBodyContent((currentChap._contentLines || []).join('\n'));
	            const raw = (currentChap._rawLines || []).join('\n').trim();
	            if(outline) {
	                currentChap.outline = outline;
	                currentChap.outlineSource = currentChap.outlineSource || 'original';
	            }
	            if(content) {
	                currentChap.content = content;
	            } else if(!outline && raw) {
	                currentChap.content = this._normalizeImportedBodyContent(raw);
	            } else {
	                currentChap.content = '';
	            }
	            delete currentChap._outlineLines;
	            delete currentChap._contentLines;
	            delete currentChap._rawLines;
	            chapters.push(currentChap);
	            currentChap = null;
	        };

	        for(let i = 0; i < lines.length; i++) {
	            const line = lines[i].trim();
	            if(!line) continue;

	            const zone = this._detectNovelImportZone(line);
	            if(zone) {
	                const prevZone = currentZone;
	                const payload = this._extractNovelImportZonePayload(line, zone);
	                if((zone === 'outline' || zone === 'body') && prevZone !== zone) {
	                    flushChapter();
	                    currentVol = null;
	                    chapOrder = 1;
	                }
	                currentZone = zone;
	                if(zone === 'outline') hasExplicitOutlineZone = true;
	                if(payload) {
	                    if(zone === 'brief') briefLines.push(payload);
	                    else if(currentChap && zone === 'outline') currentChap._outlineLines.push(payload);
	                    else if(currentChap && zone === 'body') currentChap._contentLines.push(payload);
	                }
	                continue;
	            }

	            const cleanTitle = this._cleanNovelImportHeading(line);
	            if((currentZone !== 'body' && /^(?:={3,}|[-*_]{3,})$/.test(line)) ||
	                /^[（(]?\s*第\s*[一二三四五六七八九十百千零〇两\d]+\s*卷\s*(?:完|完结|结束|END)\s*[）)]?$/i.test(cleanTitle)) continue;
	            const headingMatch = line.match(markdownHeadingRegex);
	            const isVolume = this._isNovelImportVolumeHeading(line);
	            const isChapter = !isVolume && (
	                this._isNovelImportChapterHeading(line) ||
	                (!!headingMatch && currentZone === 'body' && !excludedMarkdownHeading.test(cleanTitle) && this._isNovelImportGenericChapterHeading(cleanTitle))
	            );

	            if(isVolume) {
	                flushChapter();
	                const volTitle = cleanTitle || line;
	                const parsedOrder = this._parseNovelImportVolumeOrder(volTitle, volOrder);
	                let existingVol = volumes.find(v => this._cleanNovelImportHeading(v.title) === this._cleanNovelImportHeading(volTitle));
	                if(!existingVol) {
	                    existingVol = { id: Utils.uuid(), title: volTitle, order: parsedOrder };
	                    volumes.push(existingVol);
	                }
	                currentVol = existingVol;
	                volOrder = Math.max(volOrder + 1, parsedOrder + 1);
	            } else if(isChapter) {
	                flushChapter();
	                const chapTitle = cleanTitle || line;
	                const parsedOrder = this._parseNovelImportChapterOrder(chapTitle, chapOrder);
	                currentChap = {
	                    id: Utils.uuid(),
	                    title: chapTitle,
	                    order: parsedOrder,
	                    volumeId: currentVol ? currentVol.id : null,
	                    content: '',
	                    outline: '',
	                    sourceZone: currentZone || 'body',
	                    _outlineLines: [],
	                    _contentLines: [],
	                    _rawLines: []
	                };
	                chapOrder = Math.max(chapOrder + 1, parsedOrder + 1);
	            } else if(currentChap) {
	                if(currentZone === 'outline') currentChap._outlineLines.push(line);
	                else if(currentZone === 'brief') currentChap._rawLines.push(line);
	                else if(currentZone === 'body') currentChap._contentLines.push(line);
	                else currentChap._rawLines.push(line);
	            } else if(currentZone === 'brief' || (!currentZone && briefLines.length < 20)) {
	                briefLines.push(line);
	            }
	        }
	        flushChapter();

        // 如果没有规则分章成功，尝试AI解析
	        if(chapters.length === 0 && opts.allowAI !== false) {
            const sample = fullText.slice(0, Math.min(fullText.length, 12000));
	            const prompt = `你是导入续写的小说结构解析引擎。请分析以下小说文本，识别卷/章结构，并为每章拆出可续写细纲。\n\n要求输出严格JSON（不要markdown代码块，不要额外文字）：\n{\n
```

## AIP297 ? (???) ? line 1187 ? string ? 3397 chars

```text
}]\n}\n\n规则：\n1. 如果没有明显的卷，则 volumes 留空数组，所有章的 volumeOrder 为 1\n2. 章按自然顺序编号\n3. 原文正文会直接进入执笔台，不要改写原文\n4. outline 必须按固定细纲格式写，方便下一步从细纲提取实体并同步世界引擎\n5. 实体线索要写人物、地点、势力、物品、能力、规则、关系；不要写成抽象主题\n\n文本开头（前12000字）：\n${sample}`;

            let raw = '';
            try {
                await AI.generate(prompt, { apiType: 'parse', module: 'world_import_structure', max_tokens: 2000, temperature: 0.1 }, chunk => { raw += chunk; });
                const json = (() => { try { const m = raw.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : null; } catch(e) { return null; } })();
                if(json) {
                    if(json.volumes?.length) {
                        json.volumes.forEach((v, i) => { v.id = Utils.uuid(); v.order = i + 1; });
                        volumes.push(...json.volumes);
                    }
                    if(json.chapters?.length) {
                        json.chapters.forEach((c, i) => {
                            const vol = volumes.find(v => v.order === (c.volumeOrder || 1));
                            chapters.push({
                                id: Utils.uuid(), title: c.title, order: i + 1,
                                volumeId: vol ? vol.id : null, content: '',
                                outline: c.outline || ''
                            });
                        });
                    }
                }
            } catch(e) { console.warn('AI结构解析失败，尝试段落分章:', e); }
        }

        // 仍然没有章节？按段落 fallback
        if(chapters.length === 0) {
            const paras = fullText.split(/\n{2,}/).filter(p => p.trim().length > 50);
            const volId = Utils.uuid();
            volumes.push({ id: volId, title: '导入作品', order: 1 });
            paras.forEach((p, i) => {
                chapters.push({
                    id: Utils.uuid(), title: `第${i+1}章`, order: i+1,
                    volumeId: volId, content: p.trim()
                });
            });
        }

        // 为每章填充内容（按规则分章时已有，AI分章时需要从原文提取）
	        if(chapters.every(c => !c.content) && !hasExplicitOutlineZone) {
	            // 简单按字数均分原文
	            const avgLen = Math.floor(fullText.length / chapters.length);
	            chapters.forEach((c, i) => {
                const start = i * avgLen;
                const end = (i === chapters.length - 1) ? fullText.length : (i + 1) * avgLen;
                c.content = this._normalizeImportedBodyContent(fullText.slice(start, end));
            });
        }

	        return { volumes, chapters, bookBrief: briefLines.join('\n').trim() };
	    },

	    async _parseNovelEntities(fullText, chapters, bookBrief = '') {
        // 抽取代表性样本（前3章+中1章+后1章）用于实体提取
        const sampleChaps = [];
        if(chapters.length > 0) sampleChaps.push(chapters[0]);
        if(chapters.length > 2) sampleChaps.push(chapters[Math.floor(chapters.length/2)]);
        if(chapters.length > 1) sampleChaps.push(chapters[chapters.length-1]);

		        const sampleText = [
		            bookBrief ? `【一句话开书】\n${bookBrief.slice(0, 1200)}` : '',
		            sampleChaps.map(c => `【${c.title}】\n【章内细纲】\n${(c.outline||'').slice(0, 2400)}\n\n【正文校验样本】\n${(c.content||'').slice(0, 1200)}`).join('\n\n---\n\n')
		        ].filter(Boolean).join('\n\n---\n\n');

        let prompt = `你是导入续写的知识图谱提取引擎。请分析以下小说片段，提取世界规则、关键实体、伏笔和续写护栏。\n\n要求输出严格JSON（不要markdown代码块，不要额外文字）：\n{\n
```

## AIP298 ? (???) ? line 1251 ? string ? 2929 chars

```text
\n2. entities 最多提取30个最关键实体，优先主角、重要配角、世界规则、未回收伏笔、关键地点\n3. type 必须从给定类型中选\n4. relations 用于世界引擎知识图谱关联\n5. 优先从章内细纲提取；正文样本只用于校验和补充，不要让正文覆盖细纲设定\n6. 只能提取原文明确内容；推断内容必须在desc中标注“推断”\n\n小说片段：\n${sampleText.slice(0, 12000)}`;

        let raw = '';
        try {
            await AI.generate(prompt, { apiType: 'parse', module: 'world_import_entities', max_tokens: 4000, temperature: 0.2 }, chunk => { raw += chunk; });
            const json = (() => { try { const m = raw.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : null; } catch(e) { return null; } })();
            if(json) {
                // 标准化实体
                const entities = (json.entities || []).map(e => ({
                    id: 'import_' + Utils.uuid(),
                    name: e.name || '未命名',
                    type: e.type || '人物',
                    desc: e.desc || '',
                    relations: e.relations || [],
                    chapters: [],
                    cycles: [],
                    source: 'import',
                    updatedAt: Date.now()
                }));
                return { entities, worldview: json.worldview || {} };
            }
        } catch(e) { console.warn('AI实体提取失败:', e); }
        return { entities: [], worldview: {} };
    },

	    async _applyNovelImportToWriterAndWorld(data, opts = {}) {
	        const we = Modules.world_engine;
		        const buildCycles = opts.buildCycles !== false;
		        const merge = opts.merge !== false;
		        const buildRuleOutline = opts.buildRuleOutline !== false;
		        const lightImport = opts.lightImport === true;
		        const now = Date.now();
	        const project = typeof GenesisCore !== 'undefined'
	            ? await GenesisCore.requireActiveProject?.('请先创建或选择项目，再导入到执笔台')
	            : null;
	        if(!project?.id) return;

		        const worldEntries = lightImport ? {} : (data.worldview || {});
		        const entityEntries = lightImport ? [] : (data.entities || []);
		        const worldCount = Object.values(worldEntries).filter(v => String(v || '').trim()).length;
			        const workbenchOutlineCount = lightImport ? 0 : (data.chapters || []).filter(c => String(c.outline || '').trim()).length;
			        const cycleCount = (!lightImport && buildCycles && (data.chapters || []).length >= 3) ? Math.ceil((data.chapters || []).length / 5) : 0;
		        const importVolumes = (data.volumes && data.volumes.length) ? data.volumes : [{ id: 'import_default_volume', title: '正文卷', order: 1 }];
			        const total = importVolumes.length + (data.chapters?.length || 0) + workbenchOutlineCount + worldCount + entityEntries.length + cycleCount + 3;
	        let progress = 0;

	        const clean = value => String(value || '')
	            .replace(/^\s{0,3}#{1,6}\s*/, '')
	            .replace(/\*\*/g, '')
	            .trim();
	        const norm = value => clean(value)
	            .replace(/[《》「」『』
```

## AIP299 ? (???) ? line 1306 ? string ? 285 chars

```text
&& GenesisCore.stampProjectRecord)
	            ? GenesisCore.stampProjectRecord(payload, project.id)
	            : { ...payload, projectId: project.id };
	        const asRelArray = value => Array.isArray(value)
	            ? value.filter(Boolean)
	            : (typeof value ===
```

## AIP300 ? (???) ? line 1311 ? string ? 92 chars

```text
? value.split(/[,，]/).map(s => s.trim()).filter(Boolean) : []);

	        App.showProgress(
```

## AIP301 ? (???) ? line 1318 ? string ? 167 chars

```text
,
	            current: 0,
	            total,
	            options: { ...(we._novelImportJob?.options || {}), buildCycles, merge },
			            log: lightImport ?
```

## AIP302 ? (???) ? line 1344 ? string ? 281 chars

```text
));
	                }
	                const payload = stamp({
	                    ...(existing || {}),
	                    id: existing?.id || Utils.uuid(),
	                    title,
	                    order,
	                    outline: existing?.outline || v.outline ||
```

## AIP303 ? (???) ? line 1355 ? string ? 149 chars

```text
,
	                    createdAt: existing?.createdAt || now,
	                    updatedAt: now
	                });
	                await DB.put(
```

## AIP304 ? (???) ? line 1363 ? string ? 936 chars

```text
, ++progress, total);
	                we._setNovelImportJob({ current: progress, log: `卷结构入执笔台：${title}` });
	            }

	            for(const c of data.chapters || []) {
	                we._checkNovelImportPaused();
	                const order = Number(c.order || savedChapters.length + 1);
	                const title = clean(c.title || `第${order}章`) || `第${order}章`;
	                const importedVolume = c.volumeId ? volumeByImportedId.get(c.volumeId) : null;
	                const volume = importedVolume || volumeByOrder.get(Number(c.volumeOrder || 1)) || Array.from(volumeByOrder.values())[0] || null;
	                let existing = null;
	                if(merge) {
	                    existing = existingChapters.find(row => row.importedChapterId === c.id || row.sourceImportId === c.id);
	                    if(!existing) existing = existingChapters.find(row => sameTitle(row.title, title) && (row.volumeId ||
```

## AIP305 ? (???) ? line 1379 ? string ? 99 chars

```text
);
		                const existingContent = we._normalizeImportedBodyContent(existing?.content ||
```

## AIP306 ? (???) ? line 1380 ? string ? 240 chars

```text
);
		                const content = merge && existingContent ? existingContent : incomingContent;
		                const outline = c.outline || existing?.outline || (buildRuleOutline ? we._buildImportedChapterOutline({ ...c, content }) :
```

## AIP307 ? (???) ? line 1382 ? string ? 244 chars

```text
);
		                const chapterId = existing?.id || Utils.uuid();
			                const workbenchOutlineId = existing?.workbenchOutlineId || existing?.sourceOutlineId || (!lightImport ? `novel_import_outline_${project.id}_${chapterId}` :
```

## AIP308 ? (???) ? line 1384 ? string ? 517 chars

```text
);
		                const payload = stamp({
		                    ...(existing || {}),
		                    id: chapterId,
		                    title,
		                    content,
		                    outline,
	                    sections: c.sections || existing?.sections || [],
	                    order,
	                    number: order,
	                    volumeId: volume?.id || existing?.volumeId || null,
	                    volumeTitle: volume?.title || c.volumeTitle || existing?.volumeTitle ||
```

## AIP309 ? (???) ? line 1395 ? string ? 83 chars

```text
,
		                    status: content ? (existing?.status && existing.status !==
```

## AIP310 ? (???) ? line 1396 ? string ? 133 chars

```text
,
	                    targetWords: existing?.targetWords || c.targetWords || 2500,
	                    source: existing?.source ||
```

## AIP311 ? (???) ? line 1401 ? string ? 186 chars

```text
,
		                    workbenchOutlineId,
		                    sourceOutlineId: workbenchOutlineId,
		                    outlineSource: c.outlineSource || existing?.outlineSource ||
```

## AIP312 ? (???) ? line 1404 ? string ? 81 chars

```text
,
	                    outlineLevel: c.outlineLevel || existing?.outlineLevel ||
```

## AIP313 ? (???) ? line 1405 ? string ? 203 chars

```text
,
	                    importedAt: c.importedAt || now,
	                    createdAt: existing?.createdAt || now,
	                    updatedAt: now
	                });
	                await DB.put(
```

## AIP314 ? (???) ? line 1414 ? string ? 198 chars

```text
, ++progress, total);
		                we._setNovelImportJob({ current: progress, log: content ? `正文入执笔台：${title}` : `细纲占位入执笔台：${title}` });
			                if(!lightImport && String(outline ||
```

## AIP315 ? (???) ? line 1416 ? string ? 343 chars

```text
).trim()) {
		                    const existingOutline = merge
		                        ? existingOutlines.find(row =>
		                            row.id === workbenchOutlineId ||
		                            row.chapterId === payload.id ||
		                            (sameTitle(row.chapterTitle || row.title, title) && row.source ===
```

## AIP316 ? (???) ? line 1421 ? string ? 346 chars

```text
))
		                        : null;
		                    const outlinePayload = stamp({
		                        ...(existingOutline || {}),
		                        id: existingOutline?.id || workbenchOutlineId,
		                        title: `${title}（导入细纲）`,
		                        content: outline,
		                        source:
```

## AIP317 ? (???) ? line 1436 ? string ? 176 chars

```text
,
		                        createdAt: existingOutline?.createdAt || now,
		                        updatedAt: now
		                    });
		                    await DB.put(
```

## AIP318 ? (???) ? line 1451 ? string ? 218 chars

```text
).trim();
	                if(!desc) continue;
	                const name = wvLabels[key] || key;
	                let existing = merge ? existingEntities.find(e => (e.category === key || sameTitle(e.name, name)) && [
```

## AIP319 ? (???) ? line 1454 ? string ? 219 chars

```text
)) : null;
	                const payload = stamp({
	                    ...(existing || {}),
	                    id: existing?.id || `world_${project.id}_${key}`,
	                    name,
	                    type:
```

## AIP320 ? (???) ? line 1459 ? string ? 160 chars

```text
,
	                    desc: merge && existing?.desc && !existing.desc.includes(desc.slice(0, 80)) ? `${existing.desc}\n\n${desc}` : (desc || existing?.desc ||
```

## AIP321 ? (???) ? line 1460 ? string ? 204 chars

```text
),
	                    category: key,
	                    relations: existing?.relations || [],
	                    chapters: existing?.chapters || [],
	                    source: existing?.source ||
```

## AIP322 ? (???) ? line 1465 ? string ? 149 chars

```text
,
	                    updatedAt: now,
	                    createdAt: existing?.createdAt || now
	                });
	                await DB.put(
```

## AIP323 ? (???) ? line 1473 ? string ? 343 chars

```text
, ++progress, total);
	                we._setNovelImportJob({ current: progress, log: `世界规则入图谱：${name}` });
	            }

		            for(const e of entityEntries) {
	                we._checkNovelImportPaused();
	                if(!e?.name) continue;
	                const name = clean(e.name);
	                const type = e.type ||
```

## AIP324 ? (???) ? line 1482 ? string ? 121 chars

```text
).trim();
	                let existing = merge ? existingEntities.find(row => sameTitle(row.name, name) && (row.type ||
```

## AIP325 ? (???) ? line 1484 ? string ? 707 chars

```text
}`.includes(name));
	                const relationSet = new Set([...(asRelArray(existing?.relations)), ...(asRelArray(e.relations))]);
	                const chapterSet = new Set([...(existing?.chapters || []), ...refs.map(ch => ch.id), ...(e.chapters || []).map(id => chapterByImportedId.get(id)?.id || id)].filter(Boolean));
	                const volumeSet = new Set([...(existing?.volumes || []), ...refs.map(ch => ch.volumeId).filter(Boolean), ...(e.volumes || [])].filter(Boolean));
	                const mergedDesc = merge && existing?.desc && desc && !existing.desc.includes(desc.slice(0, 80))
	                    ? `${existing.desc}\n\n${desc}`
	                    : (desc || existing?.desc ||
```

## AIP326 ? (???) ? line 1490 ? string ? 545 chars

```text
);
	                const payload = stamp({
	                    ...(existing || {}),
	                    id: existing?.id || `novel_import_${project.id}_${Utils.uuid()}`,
	                    name,
	                    type,
	                    desc: mergedDesc,
	                    relations: Array.from(relationSet),
	                    chapters: Array.from(chapterSet),
	                    volumes: Array.from(volumeSet),
	                    cycles: existing?.cycles || e.cycles || [],
	                    source: existing?.source ||
```

## AIP327 ? (???) ? line 1502 ? string ? 149 chars

```text
,
	                    updatedAt: now,
	                    createdAt: existing?.createdAt || now
	                });
	                await DB.put(
```

## AIP328 ? (???) ? line 1510 ? string ? 956 chars

```text
, ++progress, total);
	                we._setNovelImportJob({ current: progress, log: `细纲实体入图谱：${name}` });
	            }

		            if(!lightImport && buildCycles && savedChapters.length >= 3) {
	                const cycleSize = 5;
	                const numCycles = Math.ceil(savedChapters.length / cycleSize);
	                for(let i = 0; i < numCycles; i++) {
	                    we._checkNovelImportPaused();
	                    const start = i * cycleSize + 1;
	                    const end = Math.min((i + 1) * cycleSize, savedChapters.length);
	                    const cycleChaps = savedChapters.filter(c => (c.order || c.number || 0) >= start && (c.order || c.number || 0) <= end);
	                    const id = `novel_import_${project.id}_cycle_${start}_${end}`;
	                    const existing = merge ? existingCycles.find(c => c.id === id || ((c.startChapter || 0) === start && (c.endChapter || 0) === end && (c.source ||
```

## AIP329 ? (???) ? line 1523 ? string ? 1054 chars

```text
))) : null;
	                    const payload = stamp({
	                        ...(existing || {}),
	                        id: existing?.id || id,
		                    title: `导入续写循环${i + 1} · 第${start}-${end}章`,
		                    content: `导入续写循环${i + 1}：第${start}-${end}章`,
		                    fusionEssence: `导入续写循环${i + 1}：第${start}-${end}章细纲与正文承接`,
	                        startChapter: start,
	                        endChapter: end,
	                        cycleNum: i + 1,
	                        cycleSize,
	                        chapterIds: cycleChaps.map(c => c.id),
		                        entityNames: entityEntries.slice(0, 12).map(e => e.name).filter(Boolean),
	                        nexusCHR: existing?.nexusCHR || [],
	                        nexusWLD: existing?.nexusWLD || [],
	                        nexusFOE: existing?.nexusFOE || [],
	                        nexusEMO: existing?.nexusEMO || [],
	                        patterns: existing?.patterns || [],
	                        source: existing?.source ||
```

## AIP330 ? (???) ? line 1542 ? string ? 165 chars

```text
,
	                        createdAt: existing?.createdAt || now,
	                        updatedAt: now
	                    });
	                    await DB.put(
```

## AIP331 ? (???) ? line 1547 ? string ? 439 chars

```text
, ++progress, total);
	                    we._setNovelImportJob({ current: progress, log: `续写循环入世界：第${start}-${end}章` });
	                }
	            }

	            we._checkNovelImportPaused();
		            try { await this._saveImportModeData(data, { skipAi: lightImport }); } catch(e) {}
	            try { await GenesisCore.refreshStats?.(project.id); } catch(e) {}
	            try {
		                if (typeof LocalSync !==
```

## AIP332 ? (???) ? line 1556 ? string ? 249 chars

```text
].forEach(s => LocalSync._scheduleWrite?.(s));
		            } catch(e) {}
	            we._cachedEntities = null;
	            we._cachedCycles = null;
	            we._cachedLayeredGraphs = null;
	            try { await we.rebuildLayeredGraphs?.(
```

## AIP333 ? (???) ? line 1561 ? string ? 450 chars

```text
, { silent: true }); } catch(e) {}
	            try { await we._refreshEntities?.(); } catch(e) {}
		            try { await Modules.writer?.loadTree?.(); } catch(e) {}
		            try { await Modules.fusion_workbench?.refresh?.(); } catch(e) {}

	            App.hideProgress();
	            we._finishNovelImportJob(`已导入：${savedChapters.length}章入执笔台 / ${importedEntityCount}实体入世界`);
	            we._closeNovelImportModal();
	            App.nav(
```

## AIP334 ? (???) ? line 1570 ? string ? 305 chars

```text
);
	        } catch(e) {
	            App.hideProgress();
	            if (we._novelImportPauseRequested || /暂停|中止|abort|aborted/i.test(String(e?.message || e))) {
	                we._setNovelImportJob({
	                    running: false,
	                    paused: true,
	                    phase:
```

## AIP335 ? (???) ? line 1586 ? string ? 197 chars

```text
);
	        }
	    },

    async _confirmNovelImport() {
        const we = Modules.world_engine;
        const data = we._novelImportParsed;
        if(!data || !data.chapters?.length) { UI.toast(
```

## AIP336 ? if() ? line 1593 ? string ? 132 chars

```text
); return; }

	        const savedOptions = we._novelImportJob?.options || {};
	        const buildCycles = document.getElementById(
```

## AIP337 ? (???) ? line 1596 ? string ? 99 chars

```text
)?.checked ?? (savedOptions.buildCycles !== false);
	        const merge = document.getElementById(
```

## AIP338 ? (???) ? line 1597 ? string ? 457 chars

```text
)?.checked ?? (savedOptions.merge !== false);
	        await we._applyNovelImportToWriterAndWorld(data, { buildCycles, merge });
	    },


    // ═══════════════════════════════════════════════════════════════
    // ★ 导入模式专属 — 文风指纹 / 续写起点 / 导入统计
    // ═══════════════════════════════════════════════════════════════

	    _buildPhoenixOutlineFromImport(data = {}) {
	        const volumes = (data.volumes && data.volumes.length) ? data.volumes : [{ id:
```

## AIP339 ? (???) ? line 1636 ? string ? 256 chars

```text
);
	                if(rawEl) rawEl.value = text;
	                try { Modules.phoenix._updateStats?.(); } catch(e) {}
	                try { Modules.phoenix.updatePreview?.(); } catch(e) {}
	            }
	        } catch(e) {
	            console.warn(
```

## AIP340 ? mportModeData() ? line 1648 ? string ? 151 chars

```text
);
	        const wordCount = originalText.length;
	        const chapterCount = data.chapters.length;
	        const genre = data.worldview?.genre ||
```

## AIP341 ? (???) ? line 1652 ? string ? 128 chars

```text
].includes(e?.type);
		        const quickSummary = `快速导入完成：共${chapterCount}章，${(data.chapters || []).filter(c => (c.outline ||
```

## AIP342 ? (???) ? line 1671 ? string ? 501 chars

```text
,
			            globalOutline: phoenixOutline,
			            outlineRaw: phoenixOutline,
			            phoenixOutline,
			            importedOutlineRaw: phoenixOutline,
			            ...(opts.skipAi ? { importSummary: quickSummary } : {}),
			            originalText: originalText.slice(0, 5000),
	            parsedStructure: {
                chapters: data.chapters.map(c => ({
                    title: c.title,
                    order: c.order,
                    outline: c.outline ||
```

## AIP343 ? (???) ? line 1685 ? string ? 956 chars

```text
})),
                characters: (data.entities || []).filter(isCharacter).map(e => e.name),
                arcs: data.volumes?.map(v => v.title || v.name).filter(Boolean) || []
            },
            extractedEntities: data.entities || [],
            originalStats: { wordCount, chapterCount, genre, characterCount: (data.entities || []).length },
	            continuationPoint: data.continuationPoint || this._getNovelImportContinuationPoint(data.chapters || []),
            continuationPolicy: {
                keepImportedText: true,
                useChapterOutlines: true,
                useChapterPartOutlines: true,
                useKnowledgeGraph: true,
                writeOnlyMissingOrNext: true
            }
        });
	        await this._syncImportedOutlineToPhoenix(data, phoenixOutline);
    },

    async _extractStyleFingerprint(text) {
        const sample = text.slice(0, 3000);
        let result =
```

## AIP344 ? _extractStyleFingerprint() ? line 1706 ? string ? 379 chars

```text
;
        try {
            await AI.generate(
                `分析以下小说片段的文风特征，输出JSON格式：
{
  "sentencePattern": "句式特征（长短句比例、修辞偏好）",
  "vocabulary": "词汇偏好（文言/白话、华丽/朴实）",
  "rhythm": "节奏模式（快节奏/慢节奏、段落长度）",
  "descriptionStyle": "描写风格（细腻/粗犷、感官侧重）",
  "dialogueStyle": "对话风格（简洁/冗长、标点特征）",
  "overall": "整体文风标签"
}

片段：${sample.slice(0, 2000)}`,
                { apiType:
```

## AIP345 ? _generateImportSummary() ? line 1727 ? string ? 105 chars

```text
);
        const outline = data.chapters.map(c => `第${c.order}章 ${c.title}: ${c.outline?.slice(0, 50) ||
```

## AIP346 ? (???) ? line 1749 ? string ? 1579 chars

```text
}`);
    },

    // ═══════════════════════════════════════════════════════════════
    //  双向同步桥：接收 writer 推送，更新世界引擎
    // ═══════════════════════════════════════════════════════════════

    async syncFromWriter(chapterData) {
        const we = Modules.world_engine;
        // chapterData: { chapterId, title, order, content, outline, extractedEntities? }
        if(!chapterData || !chapterData.chapterId) return;

        try {
            // 1. 刷新缓存
            await we._ensureCache();

            // 2. 更新实体关联
            if(chapterData.extractedEntities?.length) {
                for(const ent of chapterData.extractedEntities) {
                    const existing = (we._cachedEntities || []).find(e => e.name === ent.name && e.type === ent.type);
                    if(existing) {
                        // 更新关联章节
                        if(!existing.chapters) existing.chapters = [];
                        if(!existing.chapters.includes(chapterData.chapterId)) {
                            existing.chapters.push(chapterData.chapterId);
                        }
                        // 更新关联循环
                        const cycleInfo = we.getCycleIdForChapter(chapterData.order, 5);
                        if(cycleInfo && !existing.cycles?.includes(cycleInfo.id)) {
                            if(!existing.cycles) existing.cycles = [];
                            existing.cycles.push(cycleInfo.id);
                        }
                        existing.updatedAt = Date.now();
                        await DB.put(
```

## AIP347 ? (???) ? line 1798 ? string ? 695 chars

```text
, newEnt);
                    }
                }
            }

            // 3. 更新循环实体列表（如果这个章节属于某个循环）
            const cycleInfo = we.getCycleIdForChapter(chapterData.order, 5);
            if(cycleInfo) {
                await we._ensureCycleCache();
                const cycle = (we._cachedCycles || []).find(c => c.id === cycleInfo.id);
                if(cycle && chapterData.extractedEntities?.length) {
                    const newNames = chapterData.extractedEntities.map(e => e.name);
                    cycle.entityNames = [...new Set([...(cycle.entityNames||[]), ...newNames])];
                    cycle.updatedAt = Date.now();
                    await DB.put(
```

# ???assets/js/modules_split/world/world_pipeline.js

## AIP348 ? prompt ? line 246 ? template ? 617 chars

```text
你是一个专业的小说实体提取引擎。请从以下融合拆书分析数据中，提取所有有价值的实体。

【数据来源】
${...}
${...}

【提取要求】
只提取能画成知识图谱节点的“要素点”，不要提取整句剧情摘要、上下文记忆、情绪锚点、写作技法。
可用类型：人物、物品、地点、情节、伏笔、势力、种族、能力、魔法、世界规则、文化、历史。
实体名必须是短名词，例如“陈默”“诺基亚手机”“陌生号码”“三阶协议”，不能是“赵小满的手机铃声响起后转身跑上楼”这种句子。

【输出格式】严格JSON数组：
[{"name":"实体名","type":"类型","desc":"要素卡(30-80字，写身份/用途/规则/状态，不写整章剧情)","relations":["关系类型:关联实体名"]}]

【关键要求 - 关系网络】
- 每个实体的relations只保留3-8条关键关系，用"关系类型:实体名"格式
- relations只能指向本次输出或已有实体中的实体名；不要塞长句、摘要、杂物清单
- 关系类型例如：师父、徒弟、敌对、盟友、所属、位于、拥有、使用、参与、创造、守护、统治等
- 人物之间要有师徒/敌友/从属关系
- 人物与地点要有"位于"/"出没"关系
- 人物与物品要有"拥有"/"使用"关系
- 人物与势力要有"所属"/"统治"关系
- 情节与人物要有"参与"关系
- 直接输出JSON，不要包裹markdown代码块
```

## AIP349 ? (???) ? line 299 ? string ? 550 chars

```text
));
                    entities = JSON.parse(fixed);
                } catch(e3) {
                    // 尝试4: 逐个对象提取（支持含数组的对象）
                    const objMatches = cleanRes.match(/\{(?:[^{}]|\[[^\]]*\]|\{[^{}]*\})*"name"\s*:\s*"[^"]+?"(?:[^{}]|\[[^\]]*\]|\{[^{}]*\})*\}/g);
                    if (objMatches && objMatches.length) {
                        entities = [];
                        for (const objStr of objMatches) {
                            try {
                                let fixedObj = objStr.replace(/,\s*}/g,
```

## AIP350 ? f() ? line 334 ? string ? 5685 chars

```text
/);
                                if (dm) cur.desc = dm[1];
                            }
                        }
                        if (cur && cur.name) entities.push(cur);
                    }
                }
            }
        }
        if(!entities || !Array.isArray(entities) || !entities.length) return UI.toast('提取失败，AI返回格式异常');

        await we._ensureCache();
        const existingEntities = we._cachedEntities || [];
        const existingNameMap = new Map();
        existingEntities.forEach(e => {
            if (e.name) {
                existingNameMap.set(e.name.toLowerCase().trim(), e);
            }
        });

        let addedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        const now = Date.now();
        const allNames = new Set([
            ...entities.map(ent => String(ent?.name || '').trim()).filter(Boolean),
            ...existingEntities.map(ent => String(ent?.name || '').trim()).filter(Boolean)
        ]);
        for(const ent of entities) {
            if(!ent.name || !ent.type) continue;
            const type = we._normalizeEntityType ? we._normalizeEntityType(ent.type) : ent.type;
            const name = String(ent.name || '').trim();
            const desc = we._compactEntityDesc ? we._compactEntityDesc(ent.description || ent.desc || '', { name, type }) : (ent.description || ent.desc || '');
            if(we._isJunkEntity && we._isJunkEntity({ name, type, desc })) {
                skippedCount++;
                continue;
            }
            
            const normalizedName = name.toLowerCase();
            const existingEntity = existingNameMap.get(normalizedName);
            
            let relations = ent.relations || [];
            if(!Array.isArray(relations)) relations = [];
            relations = relations.map(r => typeof r === 'string' ? r : String(r)).filter(Boolean);
            if(we._compactEntityRelations) relations = we._compactEntityRelations(relations, name, allNames, 8);

            if (existingEntity) {
                const mergedDesc = we._mergeEntityDesc ? we._mergeEntityDesc(existingEntity.desc || '', desc, { name, type }) : (desc || existingEntity.desc || '');
                const oldRelations = Array.isArray(existingEntity.relations)
                    ? existingEntity.relations
                    : (typeof existingEntity.relations === 'string' ? existingEntity.relations.split(',').map(s => s.trim()).filter(Boolean) : []);
                const mergedRelations = we._compactEntityRelations ? we._compactEntityRelations([...oldRelations, ...relations], name, allNames, 12) : [...new Set([...oldRelations, ...relations])];
                if (existingEntity.desc !== mergedDesc || existingEntity.type !== type || JSON.stringify(existingEntity.relations || []) !== JSON.stringify(mergedRelations)) {
                    await DB.put('entities', {
                        id: existingEntity.id,
                        name,
                        type,
                        desc: mergedDesc,
                        relations: mergedRelations,
                        source: existingEntity.source || 'pipeline',
                        updatedAt: now
                    });
                    await DB.put('vectors', { 
                        id: existingEntity.id, 
                        content: `[${type}] ${name}: ${mergedDesc}`, 
                        vector: Array.from({length:1536}, ()=>Math.random()), 
                        timestamp: now 
                    });
                    updatedCount++;
                } else {
                    skippedCount++;
                }
            } else {
                const id = 'ent_pipeline_' + Utils.uuid();
                await DB.put('entities', {
                    id, name, type,
                    desc, relations,
                    source: 'pipeline', updatedAt: now
                });
                await DB.put('vectors', { id, content: `[${type}] ${name}: ${desc}`, vector: Array.from({length:1536}, ()=>Math.random()), timestamp: now });
                addedCount++;
            }
        }
        we._cachedEntities = null;
        let message = `深度提取完成: 新增 ${addedCount}，更新 ${updatedCount}`;
        if (skippedCount > 0) message += `，跳过 ${skippedCount}`;
        UI.toast(message);

        // ★ 同时刷新: 实体列表 + 知识图谱 + 世界观
        we.switchTab('graph');
    },

    // ═══ 从流水线提取世界观 — 修复: 提取后同步刷新图谱 ═══
    extractWorldView: async () => {
        const we = Modules.world_engine;
        const FB = Modules.fusion_book;
        if(!FB) return UI.toast('融合拆书模块未加载');
        const allPr = FB._allPipelineResults || {};
        const pr = FB._pipelineResults || {};
        const fusion = (allPr.fusion && allPr.fusion.trim()) ? allPr.fusion : (pr.fusion || '');
        const compare = (allPr.compare && allPr.compare.trim()) ? allPr.compare : (pr.compare || '');
        const left = (allPr.left && allPr.left.trim()) ? allPr.left : (pr.left || '');
        const right = (allPr.right && allPr.right.trim()) ? allPr.right : (pr.right || '');
        const src = [fusion, compare, left, right].filter(Boolean).join('

');
        if(!src || src.length < 50) return UI.toast('流水线数据不足，请先运行融合拆书');

        const prompt = `你是一个专业的世界观构建引擎。请从以下融合拆书分析数据中，提取并构建完整的世界观设定。

【数据来源】
${src.slice(0, 6000)}

【提取要求】请为以下7个维度各生成详细的世界观设定：

1. history (历史与传说) — 世界的历史脉络、重大事件、传说故事、纪元划分
2. geography (地理与地貌) — 地理环境、重要地标、气候特征、空间布局
3. magic (魔法/科技体系) — 力量体系、等级划分、修炼/科技路线、核心规则
4. factions (势力与组织) — 主要势力、组织架构、势力关系、权力格局
5. species (种族与生物) — 种族分类、特殊生物、种族特征、种族关系
6. rules (世界规则) — 世界运行的底层规则、禁忌、自然法则
7. culture (文化与习俗) — 文化传统、社会制度、信仰体系、日常习俗

【输出格式】严格JSON对象：
{
```

## AIP351 ? (???) ? line 456 ? string ? 4932 chars

```text
}

注意：每个维度至少200字，要具体、可直接用于创作。直接输出JSON，不要包裹markdown代码块`;

        UI.toast('正在提取世界观...');
        let fullRes = '';
        await AI.generate(prompt, {}, c => { fullRes += c; });

        let worldData = null;
        try { worldData = JSON.parse(fullRes); } catch(e1) {
            try { worldData = JSON.parse(fullRes.replace(/???json?\s*/g,'').replace(/???/g,'').trim()); } catch(e2) {
                const m = fullRes.match(/\{[\s\S]*\}/);
                if(m) try { worldData = JSON.parse(m[0]); } catch(e3) {}
            }
        }
        if(!worldData || typeof worldData !== 'object') return UI.toast('提取失败，AI返回格式异常');

        const cats = ['history','geography','magic','factions','species','rules','culture'];
        let count = 0;
        const now = Date.now();
        for(const cat of cats) {
            if(worldData[cat]) {
                await DB.put('entities', { id: 'world_' + cat, name: cat, type: 'world', desc: worldData[cat], source: 'pipeline', updatedAt: now });
                count++;
            }
        }
        we._cachedEntities = null;
        UI.toast(`世界观提取完成: ${count} 个维度已更新`);

        // ★ 同时刷新: 世界观 + 知识图谱
        we.switchTab('graph');
    },

    // ═══ 世界观构建 ═══
    _loadWorldCat: async () => {
        const we = Modules.world_engine;
        const cat = we.worldCat;
        const data = await DB.get('entities', 'world_' + cat);
        const el = document.getElementById('we-world-editor');
        if(el) el.value = (data && data.desc) ? data.desc : '';
    },
    _saveWorld: async () => {
        const we = Modules.world_engine;
        const cat = we.worldCat;
        const el = document.getElementById('we-world-editor');
        const desc = el ? el.value : '';
        if(!desc) return UI.toast('内容为空');
        await DB.put('entities', { id: 'world_' + cat, name: cat, type: 'world', desc, source: 'manual', updatedAt: Date.now() });
        we._cachedEntities = null;
        UI.toast('世界观已保存: ' + cat);
    },
    _aiGenWorld: async () => {
        const we = Modules.world_engine;
        const cat = we.worldCat;
        const catLabels = {history:'历史与传说',geography:'地理与地貌',magic:'魔法/科技体系',factions:'势力与组织',species:'种族与生物',rules:'世界规则',culture:'文化与习俗'};
        const existing = (document.getElementById('we-world-editor') || {}).value || '';
        let refCtx = '';
        const FB = Modules.fusion_book;
        if(FB) {
            const allPr = FB._allPipelineResults || {};
            const pr = FB._pipelineResults || {};
            const fusion = (allPr.fusion && allPr.fusion.trim()) ? allPr.fusion : (pr.fusion || '');
            if(fusion) refCtx += '\n[融合技法参考]\n' + fusion.slice(0, 1500);
        }
        await we._ensureCache();
        const relatedEntities = (we._cachedEntities || []).filter(e => we._isGraphNodeEntity ? we._isGraphNodeEntity(e) : !we._isWorldEntity(e)).slice(0, 15);
        if(relatedEntities.length) {
            refCtx += '\n[已有实体参考]\n' + relatedEntities.map(e => `${e.type}·${e.name}: ${(e.desc||'').slice(0,80)}`).join('\n');
        }
        const prompt = `请为小说世界观的「${catLabels[cat]}」维度生成详细设定。\n${existing ? '【已有内容(请在此基础上扩展)】\n' + existing.slice(0, 1500) : '【当前为空，请从零构建】'}\n${refCtx}\n\n要求：\n1. 内容详细、具体、有层次感\n2. 包含具体的名称、数据、细节\n3. 适合直接用于小说创作\n4. 至少500字\n5. 使用清晰的分段和标题`;
        const el = document.getElementById('we-world-editor');
        if(el) el.value = '生成中...';
        let fullRes = '';
        await AI.generate(prompt, {}, c => { fullRes += c; if(el) el.value = fullRes; });
        UI.toast('AI 世界观生成完成');
    },

    // ═══ 知识图谱 3D — 核心修复: 真正的网络结构，不是孤立的点 ═══
    // 每个实体(人物/物品/地点/情节/伏笔/势力/种族/能力/魔法/世界规则/文化/历史)
    // 都是一个具体节点，通过关系连线交织成3D网络
    _graph3d: null,
    _graphShowLabels: false,
    _graphPhysics: true,
    _graphAutoRotate: false,
    _graphRotateTimer: null,
    _graphChapterFilter: 'all',

	    _releaseGraph3D(container = null) {
	        const we = Modules.world_engine;
	        if(we._graphRotateTimer) {
	            clearInterval(we._graphRotateTimer);
	            we._graphRotateTimer = null;
	        }
	        if(we._graph3d) {
	            try {
	                const controls = we._graph3d.controls?.();
	                if(controls) {
	                    controls.autoRotate = false;
	                    controls.dispose?.();
	                }
	            } catch(e) {}
	            try { we._graph3d.pauseAnimation?.(); } catch(e) {}
	            try { we._graph3d.graphData?.({ nodes: [], links: [] }); } catch(e) {}
	            try { we._graph3d._destructor?.(); } catch(e) {}
	            we._graph3d = null;
	        }
	        const root = container || document.getElementById('we-graph-canvas');
	        const canvases = new Set();
	        if(root) root.querySelectorAll('canvas').forEach(canvas => canvases.add(canvas));
	        document.querySelectorAll('canvas[data-engine=
```

## AIP352 ? (???) ? line 604 ? string ? 396 chars

```text
>${g.title} · ${g.entityIds?.length || 0}实体</option>`));
            volumeSel.innerHTML = options.join('');
            volumeSel.value = (graphs.volumes || []).some(g => g.scopeId === we._graphVolumeFilter) ? we._graphVolumeFilter : 'auto';
        }

        const cycleSel = document.getElementById('we-graph-cycle-filter');
        if(cycleSel) {
            const options = ['<option value=
```

## AIP353 ? (???) ? line 612 ? string ? 2566 chars

```text
>${g.title} · ${g.entityIds?.length || 0}实体</option>`));
            cycleSel.innerHTML = options.join('');
            cycleSel.value = (graphs.cycles || []).some(g => g.scopeId === we._graphCycleFilter) ? we._graphCycleFilter : 'auto';
        }
    },

	    _chooseGraphScope(graphs) {
	        const we = Modules.world_engine;
	        const layer = we._graphLayerFilter === 'cycle' ? 'cycle' : 'volume';
	        const list = layer === 'cycle' ? (graphs.cycles || []) : (graphs.volumes || []);
	        if(!list.length) return { layer, graph: null };
        const selectedId = layer === 'cycle' ? we._graphCycleFilter : we._graphVolumeFilter;
        let graph = selectedId && selectedId !== 'auto'
            ? list.find(g => g.scopeId === selectedId)
            : null;
        if(!graph) graph = list.find(g => (g.entityIds || []).length > 0) || list[0];
        if(layer === 'cycle') we._graphCycleFilter = graph.scopeId;
	        else we._graphVolumeFilter = graph.scopeId;
	        return { layer, graph };
	    },

	    _initGraph: async () => {
        const we = Modules.world_engine;
        await we._ensureCache();
        await we.rebuildLayeredGraphs('graph_view', { silent: true });
        const graphs = await we._ensureLayeredGraphs();
        we._refreshGraphFilterOptions();
        const container = document.getElementById('we-graph-canvas');
        if(!container) return;

        // 清理旧图 + 主动释放 WebGL context，避免反复刷新后浏览器拒绝创建新上下文。
	        we._releaseGraph3D(container);
	        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	        container.style.minHeight = '620px';

        const scope = we._chooseGraphScope(graphs);
        const selectedGraph = scope.graph;
	        const allGraphEntities = (we._cachedEntities || []).filter(e => we._isGraphNodeEntity ? we._isGraphNodeEntity(e) : !we._isWorldEntity(e));
        let entities = allGraphEntities;
        let scopeFallback = !selectedGraph;
        if(selectedGraph) {
            const ids = new Set(selectedGraph.entityIds || []);
            const scoped = allGraphEntities.filter(e => ids.has(e.id));
            if(scoped.length) {
                entities = scoped;
            } else {
                scopeFallback = true;
                entities = allGraphEntities;
            }
        }

        if(!entities.length) {
            const msg = scope.layer === 'cycle'
                ? '当前循环暂无图谱实体。拆书融合同步循环后会出现在这里。'
                : '当前卷暂无图谱实体。正文生成后会用正文+细纲提取实体并写入本卷。';
            container.innerHTML = '<div class=
```

## AIP354 ? (???) ? line 667 ? string ? 1685 chars

```text
>' + msg + '</div>';
            const statsEl = document.getElementById('we-graph-stats');
            if(statsEl) statsEl.textContent = scope.layer === 'cycle' ? '循环图谱 · 空' : '卷图谱 · 空';
            const scopeTitle = document.getElementById('we-graph-scope-title');
            if(scopeTitle) scopeTitle.textContent = scope.layer === 'cycle' ? '循环图谱' : '卷图谱';
            const scopeEl = document.getElementById('we-g-scope');
            if(scopeEl) scopeEl.textContent = selectedGraph?.title || '未选择';
            return;
        }

        const colorMap = {'人物':'#eab308','物品':'#3b82f6','地点':'#22c55e','情节':'#ef4444','伏笔':'#a855f7','势力':'#f43f5e','种族':'#f97316','魔法':'#6366f1','规则':'#0ea5e9','世界规则':'#0ea5e9','文化':'#ec4899','历史':'#f59e0b','技法':'#14b8a6','记忆':'#84cc16','能力':'#f97316','情绪锚点':'#fb7185'};

        // ★ 构建 name→entity 映射 (模糊匹配)
        const nameToEntity = {};
        entities.forEach(e => {
            nameToEntity[e.name] = e;
            // 也用小写做映射，增加匹配率
            nameToEntity[e.name.toLowerCase()] = e;
        });

        // ★ 构建边 — 核心: 实体是要素点，关系才是图谱连线；软连接只做辅助，不铺满全屏
        const links = [];
        const edgeSet = new Set();
        const softLabels = new Set(['提及','同章','同循环','同卷']);
        const isStrongLink = link => link?.label && !softLabels.has(link.label);

        const addLink = (sourceId, targetId, label) => {
            if(!targetId || sourceId === targetId) return;
            const key = [sourceId, targetId].sort().join('_');
            if(edgeSet.has(key)) return;
            edgeSet.add(key);
            links.push({ source: sourceId, target: targetId, label: label || '' });
        };

        // 1. 从 relations 字段解析关系 (格式:
```

## AIP355 ? (???) ? line 701 ? string ? 5785 chars

```text
)
        entities.forEach(e => {
            const relations = Array.isArray(e.relations)
                ? e.relations
                : (typeof e.relations === 'string' ? e.relations.split(',').map(s => s.trim()).filter(Boolean) : []);
            if(!relations.length) return;
            relations.forEach(rel => {
                if(!rel || typeof rel !== 'string') return;
                let label = '', targetName = rel.trim();
                if(rel.includes(':')) {
                    const colonIdx = rel.indexOf(':');
                    label = rel.slice(0, colonIdx).trim();
                    targetName = rel.slice(colonIdx + 1).trim();
                }
                // 精确匹配
                let target = nameToEntity[targetName] || nameToEntity[targetName.toLowerCase()];
                // 模糊匹配: 如果精确匹配失败，尝试包含匹配
                if(!target) {
                    for(const ent of entities) {
                        if(ent.id === e.id) continue;
                        if(ent.name.includes(targetName) || targetName.includes(ent.name)) {
                            target = ent;
                            break;
                        }
                    }
                }
                if(target) addLink(e.id, target.id, label);
            });
        });

        // 2. 描述文本交叉引用：只补少量“提及”关系，避免图谱被句子级噪音糊住
        entities.forEach(a => {
            const relations = Array.isArray(a.relations)
                ? a.relations
                : (typeof a.relations === 'string' ? a.relations.split(',').map(s => s.trim()).filter(Boolean) : []);
            const aText = (a.desc || '') + ' ' + relations.join(' ');
            if(!aText || aText.length < 5) return;
            let mentionCount = 0;
            entities.forEach(b => {
                if(mentionCount >= 4) return;
                if(a.id === b.id) return;
                if(b.name.length < 2) return;
                if(aText.includes(b.name)) {
                    addLink(a.id, b.id, '提及');
                    mentionCount++;
                }
            });
        });

	        // 3. 同章/同循环共现关系：图谱看的是要素之间的关联，不把记忆句子当节点
	        const addCoLinks = (field, label, maxPerScope = 16) => {
	            const scopeMap = new Map();
	            entities.forEach(e => {
	                const ids = Array.isArray(e[field]) ? e[field] : [];
	                ids.forEach(id => {
	                    if(!id) return;
	                    if(!scopeMap.has(id)) scopeMap.set(id, []);
	                    scopeMap.get(id).push(e);
	                });
	            });
	            scopeMap.forEach(group => {
	                const sorted = group
	                    .slice()
	                    .sort((a,b) => {
	                        const ar = (a.type === '人物' ? 0 : a.type === '势力' ? 1 : a.type === '伏笔' ? 2 : 3);
	                        const br = (b.type === '人物' ? 0 : b.type === '势力' ? 1 : b.type === '伏笔' ? 2 : 3);
	                        return ar - br;
	                    })
	                    .slice(0, maxPerScope);
	                for(let i = 0; i < sorted.length; i++) {
	                    for(let j = i + 1; j < sorted.length; j++) {
	                        addLink(sorted[i].id, sorted[j].id, label);
	                    }
	                }
	            });
	        };
	        addCoLinks('chapters', '同章', 8);
	        if(links.length < entities.length * 1.5) addCoLinks('cycles', '同循环', 10);

        // 图二那种干净图谱：保留强关系，软连接按预算补足，避免 80 个节点拉出几百条线
        const maxLinks = Math.min(260, Math.max(80, Math.ceil(entities.length * 2.15)));
        if(links.length > maxLinks) {
            const strong = links.filter(isStrongLink);
            const soft = links.filter(link => !isStrongLink(link));
            const trimmed = strong.slice(0, maxLinks);
            if(trimmed.length < maxLinks) trimmed.push(...soft.slice(0, maxLinks - trimmed.length));
            links.splice(0, links.length, ...trimmed);
        }

        // 计算每个节点的连接数
        const degreeMap = {};
        entities.forEach(e => { degreeMap[e.id] = 0; });
        links.forEach(l => { degreeMap[l.source] = (degreeMap[l.source]||0) + 1; degreeMap[l.target] = (degreeMap[l.target]||0) + 1; });

        // 构建节点
        const nodes = entities.map(e => {
            const deg = degreeMap[e.id] || 0;
            return {
                id: e.id,
                name: e.name,
                type: e.type || '其他',
                desc: (e.desc || '').slice(0, 150),
                val: Math.min(18, 4 + deg * 1.15),
                color: colorMap[e.type] || '#888',
                degree: deg
            };
        });

        // 更新统计
        const nodesEl = document.getElementById('we-g-nodes');
        const edgesEl = document.getElementById('we-g-edges');
        if(nodesEl) nodesEl.textContent = nodes.length;
        if(edgesEl) edgesEl.textContent = links.length;
        const statsEl = document.getElementById('we-graph-stats');
        const scopeName = scopeFallback
            ? '全局有效实体（有章节 + 有实体，直接绘制）'
            : (selectedGraph?.title || (scope.layer === 'cycle' ? '循环图谱' : '卷图谱'));
        if(statsEl) statsEl.textContent = `节点:${nodes.length} 连线:${links.length}`;
        const scopeTitle = document.getElementById('we-graph-scope-title');
        if(scopeTitle) scopeTitle.textContent = scopeFallback ? '全局图谱统计' : (scope.layer === 'cycle' ? '循环图谱统计' : '卷图谱统计');
        const scopeEl = document.getElementById('we-g-scope');
        if(scopeEl) scopeEl.textContent = scopeName;

        // 检查 3d-force-graph 是否可用；这里不再降级成静态2D图，避免整句节点铺满屏。
	        const ForceGraph = window.ForceGraph3D || globalThis.ForceGraph3D;
	        if(typeof ForceGraph !== 'function') {
	            container.innerHTML = '<div class=
```

## AIP356 ? if() ? line 827 ? string ? 2443 chars

```text
>3D图谱库还没加载完成，请刷新3D图谱或硬刷新页面。</div>';
	            return;
	        }
        const width = container.clientWidth || 800;
        const height = container.clientHeight || 600;

	        let Graph = null;
	        try {
	        Graph = ForceGraph()(container)
	            .width(width)
	            .height(height)
	            .backgroundColor('#08080a')
            .graphData({ nodes, links })
            .nodeVal('val')
            .nodeColor(n => n.color)
            .nodeOpacity(0.9)
            .nodeResolution(16)
            .linkColor(link => {
                if(isStrongLink(link)) return 'rgba(255,220,150,0.22)';
                if(link.label === '提及') return 'rgba(90,170,255,0.08)';
                return 'rgba(255,255,255,0.035)';
            })
            .linkWidth(link => isStrongLink(link) ? 1.05 : 0.35)
            .linkOpacity(0.45)
            .linkDirectionalParticles(link => isStrongLink(link) ? 1 : 0)
            .linkDirectionalParticleWidth(1)
            .linkDirectionalParticleColor(() => 'rgba(255,200,100,0.6)')
            .d3AlphaDecay(0.02)
            .d3VelocityDecay(0.3)
            .warmupTicks(80)
            .cooldownTicks(200)
            .onNodeHover(node => { container.style.cursor = node ? 'pointer' : 'default'; })
            .onNodeClick(node => {
                if(!node) return;
                const distance = 120;
                const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
                Graph.cameraPosition(
                    { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
                    node, 1000
                );
                we._loadEntity(node.id);
	                we.currentTab = 'entities';
                const ws = document.getElementById('we-workspace');
                if(ws) ws.innerHTML = we._renderWorkspace();
	                we._refreshEntities();
	            });
	            const graphCanvas = container.querySelector('canvas');
	            if(graphCanvas) graphCanvas.classList.add('we-graph-webgl');
	        } catch(e) {
	            console.warn('3D图谱渲染失败:', e);
	            we._releaseGraph3D(container);
	            const rawMessage = String(e?.message || e || '未知错误');
	            if(/WebGL context|webgl/i.test(rawMessage) && !we._graphContextRetry) {
	                we._graphContextRetry = true;
	                container.innerHTML = '<div class=
```

# ???assets/js/modules_split/writer/writer_ai.js

## AIP357 ? _buildWriterProseContract() ? line 69 ? template ? 659 chars

```text
【正文生成硬合同】
0. M06/M07是强制默认规则。没有额外提示词时也必须完全执行；任何样本文风、用户方向、融合技法不得覆盖。
1. 只输出小说正文；禁止标题、分析、清单、JSON、自检、字数统计、括号注释。
2. 读者协议、M06、M07、NEXUS、拆书术语只在后台执行，绝不能写进正文。
3. 禁止出现这些显性词：读者期待、读者恐惧、反应涟漪、本章分析、技法标签、写作意图、写作目的、AI痕迹、内心OS、M06、NEXUS、读者协议、Segment、emotion_score、hook_type、tension_level、characters_in_segment。
4. 长篇只允许第三人称有限。优先以当前项目主角为观察位；即使题眼写旁观者吃瓜，也必须转为第三人称旁观者观察位。禁止第一人称视角，禁止上帝视角。非观察位人物不得出现“知道/觉得/意识到/心想/感觉/以为/发现自己”等内心直写。
5. 用动作、物件、对话、环境反馈推进。每段至少有一个可见动作或可感细节。少解释。
6. 禁止句式/词：这不是、而是、这意味着、换句话说、其实、首先、其次、然后、最后、总的来说、似乎、仿佛、好像、他很愤怒、她很伤心、内心很。
7. 对话只能用中文双引号“”，单句独立成段；严禁「」。
8. 单句尽量≤25字，段落≤5行。章末必须是未完成动作+意外信息/时间压力/信息差。
9. ${...}
10. 在内部检查前三段留人、每段信息缺口、回收一个缺口时补一个新缺口。检查结果不得输出。
${...}${...}
```

# ???assets/js/modules_split/writer/writer_batch.js

## AIP358 ? (???) ? line 348 ? string ? 500 chars

```text
:'&#39;'}[m]));
        const labelOf = c => `${c.volumeTitle ? c.volumeTitle + ' / ' : ''}${c.title || '未命名章节'}`;
        
        if (targets.length === 0) {
            UI.toast('没有需要写正文的章节（需要有细纲且正文为空）');
            return;
        }

        const modal = document.createElement('div');
        modal.id = 'w-scoped-write-modal';
        modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm';
        modal.innerHTML = `
            <div class=
```

## AIP359 ? (???) ? line 375 ? string ? 210 chars

```text
${i===0?'selected':''}>${i+1}. ${esc(labelOf(c))}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <div class=
```

## AIP360 ? (???) ? line 381 ? string ? 235 chars

```text
${i===targets.length-1?'selected':''}>${i+1}. ${esc(labelOf(c))}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    
                    <div class=
```

## AIP361 ? (???) ? line 414 ? string ? 11596 chars

```text
></i>开始写作
                    </button>
                </div>
            </div>`;
        
        document.body.appendChild(modal);
    },

    async _startScopedAutoWrite() {
        const W = Modules.writer;
        const project = await W._requireActiveProject?.({ renderGate: true });
        if (!project) return;
        
        const startSelect = document.getElementById('w-scope-start');
        const endSelect = document.getElementById('w-scope-end');
        const delayInput = document.getElementById('w-scope-delay');
        const wordsSelect = document.getElementById('w-scope-words');
        const styleInput = document.getElementById('w-scope-style');
        
        const startIdx = parseInt(startSelect?.value || 0);
        const endIdx = parseInt(endSelect?.value || 0) + 1;
        const delaySeconds = parseInt(delayInput?.value || 2);
        const targetWords = parseInt(wordsSelect?.value || 2000);
        const styleHint = styleInput?.value?.trim() || '';
        
        const modal = document.getElementById('w-scoped-write-modal');
        if(modal) modal.remove();
        
        const chaps = W._scopeRecords(await DB.getAll('chapters') || [], project.id).sort((a,b) => (a.order||0) - (b.order||0));
        const targets = chaps.filter(c => c.outline && c.outline.trim().length > 20 && (!c.content || c.content.trim().length < 50));
        const toWrite = targets.slice(startIdx, endIdx);
        
        if(toWrite.length === 0) {
            UI.toast('没有选中任何章节');
            return;
        }

        let rules = '';
        const rulesData = await DB.get('settings', 'writer_rules');
        if (rulesData) rules = rulesData.rules || '';
        const mandatoryRules = W._mergeStyleRules
            ? W._mergeStyleRules(W._getExtractedStyle?.() || '', rules)
            : (rules || '');
        const polishState = await W._resolveAutoPolishConfig();
        
        const fusionCtx = W._getFusionContext ? W._getFusionContext() : '';
        
        let worldCtx = '';
        if(Modules.world_engine) {
            await Modules.world_engine._ensureCache();
            const entities = Modules.world_engine._cachedEntities || [];
            const worldEntities = entities.filter(e => !e.id.startsWith('world_'));
            const worldViews = entities.filter(e => e.id.startsWith('world_') && e.desc);
            
            if(worldEntities.length > 0) {
                worldCtx += '[世界引擎实体]\n';
                worldEntities.slice(0, 15).forEach(e => {
                    worldCtx += `${e.type}·${e.name}: ${(e.desc || '').slice(0, 100)}`;
                    if(e.relations && e.relations.length) {
                        worldCtx += ` | 关联: ${e.relations.slice(0, 3).join(', ')}`;
                    }
                    worldCtx += '\n';
                });
            }
            if(worldViews.length > 0) {
                const catLabels = {history:'历史与传说',geography:'地理与地貌',magic:'魔法/科技体系',factions:'势力与组织',species:'种族与生物',rules:'世界规则',culture:'文化与习俗'};
                worldCtx += '\n[世界观设定]\n';
                worldViews.slice(0, 3).forEach(w => {
                    const cat = w.id.replace('world_', '');
                    worldCtx += `${catLabels[cat] || cat}: ${(w.desc || '').slice(0, 200)}\n`;
                });
            }
        }
        
        W._setGenerating(true);
        const st = document.getElementById('w-save-status');
        
        // 初始化全局进度面板
        if (typeof App !== 'undefined') {
            App.showProgress?.('指定卷章写正文', 0, toWrite.length, true);
            App.logIO?.(`开始指定卷章写正文，共 ${toWrite.length} 章`, 'info');
            App.resetStop?.();
        }
        
        for (let i = 0; i < toWrite.length; i++) {
            // 检查是否被停止
            if (typeof App !== 'undefined' && App.isStopped?.()) {
                App.logIO?.('用户停止了指定卷章写作', 'warning');
                if (st) st.textContent = '已停止';
                break;
            }
            
            const chap = toWrite[i];
            const currentNum = i + 1;
            
            // 更新全局进度
            if (typeof App !== 'undefined') {
                App.showProgress?.(`正在写作: ${chap.title}`, currentNum, toWrite.length, true);
                App.logIO?.(`[${currentNum}/${toWrite.length}] 开始写作: ${chap.title}`, 'input');
            }
            
            if (st) st.textContent = `指定卷章写正文 [${currentNum}/${toWrite.length}] ${chap.title}`;
            
            W.currentChapterId = chap.id;
            W.currentVolumeId = chap.volumeId || W.currentVolumeId;
            const titleEl = document.getElementById('w-title');
            const editorEl = document.getElementById('w-editor');
            const outlineEl = document.getElementById('w-outline');
            if (titleEl) titleEl.value = chap.title || '';
            if (editorEl) editorEl.value = '';
            if (outlineEl) outlineEl.value = chap.outline || '';
            W.onInput();
            W.loadTree();
            
            let prevContent = '';
            const prevIdx = chaps.findIndex(c => c.id === chap.id) - 1;
            if (prevIdx >= 0 && chaps[prevIdx].content) {
                prevContent = chaps[prevIdx].content.slice(-2000);
            }
            
            let ragContext = '';
            if (typeof RAGSystem !== 'undefined') {
                try {
                    const ragQuery = (chap.title || '') + ' ' + (chap.outline || '').slice(0, 300);
                    const ragResults = await RAGSystem.search(ragQuery, 5);
                    if (ragResults && ragResults.length > 0) {
                        ragContext = '[RAG参考上下文]\n' + ragResults.map(r => `[${r.source||''}] ${r.title}: ${r.content.slice(0, 400)}`).join('\n---\n') + '\n\n';
                    }
                } catch(e) {}
            }
            
            // ★ NEXUS 前缀 + 循环上下文（按章节动态获取）
            const nexusPrefix = await W._buildNexusPrefix();
            const cycleCtx = await W._getCycleContext();
            const proseContract = W._buildWriterProseContract ? W._buildWriterProseContract({
                title: chap.title || '',
                targetWords: `约${targetWords}字`,
                hasContent: false
            }) : '';

            let writePrompt = nexusPrefix + proseContract + `\n\n【强制默认写文规则】\n${mandatoryRules}\n\n你是一位专业小说家。请根据以下信息编写本章正文。\n\n`;
            if(fusionCtx) writePrompt += fusionCtx + '\n';
            if(worldCtx) writePrompt += worldCtx + '\n';
            if(cycleCtx) writePrompt += '[循环级技法约束]\n' + cycleCtx.slice(0, 2000) + '\n\n';
            if(ragContext) writePrompt += ragContext;
            if(styleHint) writePrompt += `[用户额外风格要求（只做补充，不得覆盖M06/M07）] ${styleHint}\n\n`;
            
            const cleanOutline = (W._sanitizeOutlineDraft ? W._sanitizeOutlineDraft(chap.outline || '') : (chap.outline || ''))
                .replace(/\[情绪\d+\|[^\]]+\]/g, '')
                .replace(/读者期待[:：].*$/gm, '')
                .replace(/读者恐惧[:：].*$/gm, '')
                .replace(/反应涟漪[:：].*$/gm, '')
                .replace(/\n{3,}/g, '\n\n')
                .trim();
            writePrompt += `[本章标题] ${chap.title}\n\n[本章细纲]\n${cleanOutline.slice(0, 3000)}\n\n`;
            
            if(prevContent) {
                writePrompt += '[前文末尾(保持连贯性)]\n' + prevContent + '\n\n';
            }
            
            writePrompt += `要求：
1. 严格按照细纲展开情节
2. ${fusionCtx || cycleCtx ? '运用融合技法中的套路（钩子、节奏、爽点）' : '文风统一，情节连贯'}
3. ${worldCtx || ragContext ? '参考上下文保持世界观/人设/伏笔一致性' : '保持前后文一致'}
4. M06/M07强制默认规则最高优先级，必须同时遵守NEXUS OS L1铁律
5. 字数约${targetWords}字
6. 直接输出正文，不要标题`;
            try {
                let content = '';
                await AI.generate(writePrompt, { apiType: 'text', module: 'writer_scoped_auto', max_tokens: 8192, temperature: 0.85 }, c => {
                    content += c;
                    if (editorEl) editorEl.value = content;
                    W.onInput();
                });
                content = W._sanitizeGeneratedProse ? W._sanitizeGeneratedProse(content) : content;
                if (editorEl) { editorEl.value = content; W.onInput(); }

                const polishResult = await W._maybeAutoPolishGeneratedContent(content, {
                    polishState,
                    mode: 'auto-write',
                    chapter: chap,
                    project,
                    st,
                    editorEl,
                    statusText: `指定卷章写正文 [${currentNum}/${toWrite.length}] ${chap.title} · 润色中...`,
                    fallbackStatusText: `指定卷章写正文 [${currentNum}/${toWrite.length}] ${chap.title} · 润色失败，回退原稿...`,
                    onStatus: () => {
                        if (typeof App !== 'undefined') {
                            App.logIO?.(`[${currentNum}/${toWrite.length}] ${chap.title} 自动润色中...`, 'info');
                        }
                    },
                    onFallback: e => {
                        if (typeof App !== 'undefined') {
                            App.logIO?.(`[${currentNum}/${toWrite.length}] ${chap.title} 润色失败，回退原稿: ${e.message || '未知错误'}`, 'warning');
                        }
                    }
                });
                content = polishResult.content;
                
                chap.content = content;
                W._stampProject(chap, project.id);
                await DB.put('chapters', chap);
                
                if(typeof RAGSystem !== 'undefined') {
                    try {
                        await RAGSystem.addDocument(`第${chap.order||''}章: ${chap.title}`, content, 'chapter', { chapterId: chap.id });
                    } catch(e) {}
                }
                
                if (content.length > 500) {
                    try {
                        if (st) st.textContent = `正在从正文+细纲提取: ${chap.title}`;
                        if (W._autoExtractOutline) await W._autoExtractOutline(content, chap.id);
                        if (W._autoExtractEntities) await W._autoExtractEntities(content, chap.id);
                    } catch(e) { console.warn('实体提取失败:', e); }
                }
                
                if (typeof MemorySystem !== 'undefined') {
                    MemorySystem.addWorking(`[自动写作] ${chap.title} (${content.length}字)`, 'generation', 3);
                }
                
                if (st) st.textContent = `✓ ${chap.title} (${content.length}字) [${currentNum}/${toWrite.length}]`;
                if (typeof App !== 'undefined') App.logIO?.(`✓ ${chap.title} 完成 (${content.length}字)`, 'success');
            } catch(e) {
                if (st) st.textContent = `第${i+1}章写作失败: ${e.message}`;
                if (typeof App !== 'undefined') App.logIO?.(`✗ ${chap.title} 失败: ${e.message}`, 'error');
            }
            
            if (i < toWrite.length - 1 && delaySeconds > 0) {
                if (st) st.textContent += ` | 等待${delaySeconds}秒...`;
                await new Promise(r => setTimeout(r, delaySeconds * 1000));
            }
        }
        
        W._setGenerating(false);
        if (st) st.textContent = `指定卷章写作完成 (${toWrite.length}章)`;
        UI.toast(`指定卷章写作完成！共写 ${toWrite.length} 章`);
        W.loadTree();
    },

    // ===== 诊断与分析功能 =====
    async diagnoseContent() {
        const editor = document.getElementById('w-editor');
        const content = editor ? editor.value : '';
        if (!content.trim()) return UI.toast('编辑器内容为空', 'error');
        
        const resultEl = document.getElementById('w-diagnose-result');
        if (resultEl) resultEl.innerHTML = '<div class=
```

## AIP362 ? (???) ? line 700 ? string ? 417 chars

```text
>${this._formatMarkdown(result)}</div>`;
        UI.toast('诊断完成');
    },

    async analyzeContent() {
        const editor = document.getElementById('w-editor');
        const content = editor ? editor.value : '';
        if (!content.trim()) return UI.toast('编辑器内容为空', 'error');
        
        const resultEl = document.getElementById('w-diagnose-result');
        if (resultEl) resultEl.innerHTML = '<div class=
```

## AIP363 ? (???) ? line 710 ? string ? 851 chars

```text
></i><div>正在深度分析...</div></div>';
        
        const outline = (document.getElementById('w-outline') || {}).value || '';
        const fusionCtx = this._getFusionContext();
        
        const prompt = `你是一位资深的网文分析师，精通各种写作技法和套路。请对以下内容进行深度分析：

【章节大纲】
${outline.slice(0, 1000) || '无'}

【正文内容】
${content.slice(0, 6000)}

${fusionCtx ? `【融合技法参考】
${fusionCtx.slice(0, 2000)}
` : ''}

【分析要求】
请进行以下深度分析：

1. **技法运用分析**
   - 使用了哪些写作技法
   - 技法运用是否到位
   - 与融合技法的对照

2. **节奏曲线分析**
   - 标注情绪高低点
   - 分析节奏控制效果
   - 提出优化建议

3. **爽点/看点分析**
   - 识别文中的爽点
   - 分析爽点设置效果
   - 建议增加的爽点

4. **悬念体系分析**
   - 伏笔设置情况
   - 钩子效果评估
   - 悬念链完整性

5. **读者心理分析**
   - 预期读者情绪变化
   - 可能的弃读点
   - 优化建议

请用Markdown格式输出详细分析报告。`;

        let result = '';
        await AI.generate(prompt, {}, c => { result += c; });
        
        if (resultEl) resultEl.innerHTML = `<div class=
```

## AIP364 ? (???) ? line 758 ? string ? 421 chars

```text
>${this._formatMarkdown(result)}</div>`;
        UI.toast('深度分析完成');
    },

    async summarizeContent() {
        const editor = document.getElementById('w-editor');
        const content = editor ? editor.value : '';
        if (!content.trim()) return UI.toast('编辑器内容为空', 'error');
        
        const resultEl = document.getElementById('w-diagnose-result');
        if (resultEl) resultEl.innerHTML = '<div class=
```

# ???assets/js/modules_split/writer/writer_core.js

## AIP365 ? _projectRequiredView() ? line 164 ? template ? 1178 chars

```text
<div class="h-full flex items-center justify-center bg-[#08080a] text-white p-6">
            <div class="max-w-[520px] w-full rounded-lg border border-amber-500/20 bg-amber-500/[0.045] p-6 text-center">
                <div class="w-12 h-12 rounded-lg bg-amber-500/10 flex center mx-auto mb-4">
                    <i class="fa-solid fa-lock text-amber-400 text-xl"></i>
                </div>
                <div class="text-lg font-bold">先创建或选择一个项目</div>
                <div class="text-xs text-dim mt-2 leading-relaxed">执笔台不会再读取游离章节。每本书的正文、细纲、实体、RAG 和记忆都绑定到当前项目。</div>
                <div class="flex gap-2 justify-center mt-5">
                    <button class="btn btn-sm bg-accent/20 text-accent border-accent/30 font-bold" onclick="App.nav('project_manager')">
                        <i class="fa-solid fa-layer-group mr-1"></i>去项目管理
                    </button>
                    <button class="btn btn-sm bg-white/5 text-dim border-white/10" onclick="Modules.project_manager?._showCreateModal?.()">
                        <i class="fa-solid fa-plus mr-1"></i>新建项目
                    </button>
                </div>
            </div>
        </div>
```

## AIP366 ? prompt ? line 1245 ? template ? 597 chars

```text
你是一个专业的小说知识图谱实体提取引擎。请同时读取「优化后的章内细纲」和「章节正文」，提取本章会影响后续长篇一致性的实体。

【章节标题】${...}
【卷/循环归属】
卷图谱：${...}
循环图谱：${...}

【优化后的章内细纲】
${...}

【章节正文】
${...}${...}

【提取规则】
1. 实体类型仅限：人物、物品、地点、势力、魔法、规则、伏笔
2. 每个人物必须提取：姓名、身份、当前状态、本章中的关键行为
3. 每个物品必须提取：名称、功能、与剧情的关联
4. 每个地点必须提取：名称、环境特征、在剧情中的作用
5. 势力：组织/门派/阵营名称及立场
6. 魔法/规则：功法名称、世界规则、特殊能力
7. 伏笔：埋下的未解之谜或后续可能展开的信息
8. 如果实体已在「已有实体」列表中，只输出名称和本章新信息，不要重复描述
9. 必须结合细纲和正文：细纲用于识别结构、伏笔、规则，正文用于确认事实和动作
10. 不确定的内容必须在desc里标注“推断”，不能当成已发生事实
11. 输出严格JSON数组格式：
[
  {"name":"实体名","type":"人物/物品/地点/势力/魔法/规则/伏笔","desc":"详细描述（包含本章关键行为和状态）","relations":"关联的其他实体名，逗号分隔"}
]

只输出JSON数组，不要任何其他文字。
```

# ???assets/js/modules_split/writer/writer_polish.js

## AIP367 ? (???) ? line 175 ? string ? 343 chars

```text
」』】）)]?(?:\s|\n|$)/g
        );
        if (sentenceEnd > -1) return start + sentenceEnd;

        const lineEnd = findBreakByRegex(windowText, minChars, /\n+/g);
        if (lineEnd > -1) return start + lineEnd;

        return hardEnd;
    }

    function resolveFallbackText(options, originalText) {
        if (typeof options.fallback ===
```

## AIP368 ? failed ? line 222 ? string ? 557 chars

```text
, error);
                }
            }

            this._polishSettingsCache = normalizeSettings(stored || {});
            return copySettings(this._polishSettingsCache);
        },

        async _savePolishSettings(patch = {}) {
            const current = await this._getPolishSettings();
            const next = normalizeSettings({
                ...current,
                ...patch,
                regexRules: patch.regexRules ?? current.regexRules
            });

            this._polishSettingsCache = next;

            if (typeof DB !==
```

## AIP369 ? (???) ? line 280 ? string ? 371 chars

```text
;

            const globalRules = pickText(options.rules, options.globalRules, domRules, storedRules?.rules);
            const polishRules = pickText(options.polishRules, domPolishRules, storedRules?.polishRules);
            const styleExtracted = pickText(
                options.styleExtracted,
                this._getExtractedStyle ? this._getExtractedStyle() :
```

## AIP370 ? (???) ? line 286 ? string ? 253 chars

```text
,
                domExtracted,
                storedRules?.styleExtracted
            );
            const customRules = pickText(options.customRules, settings.customRules);

            const preferredSections = [];
            let preferredSource =
```

## AIP371 ? if() ? line 303 ? string ? 215 chars

```text
;
            }

            if (customRules) preferredSections.push(customRules);

            const mandatoryRules = this._getMandatoryStyleRules
                ? this._getMandatoryStyleRules()
                :
```

## AIP372 ? (???) ? line 310 ? string ? 198 chars

```text
;
            const combinedRules = this._mergeStyleRules
                ? this._mergeStyleRules(...preferredSections)
                : [mandatoryRules, ...preferredSections].filter(Boolean).join(
```

## AIP373 ? (???) ? line 324 ? string ? 331 chars

```text
};
        },

        _applyPolishRegex(text, rulesOrOptions = {}) {
            const options = Array.isArray(rulesOrOptions)
                ? { rules: rulesOrOptions }
                : (rulesOrOptions || {});
            const fallback = options.fallback !== undefined ? String(options.fallback) : String(text ||
```

## AIP374 ? (???) ? line 333 ? string ? 600 chars

```text
);

            let rules = Array.isArray(options.rules) ? options.rules : [];
            if (!rules.length && options.settings && Array.isArray(options.settings.regexRules)) {
                rules = options.settings.regexRules;
            } else if (!rules.length && this._polishSettingsCache?.regexRules?.length) {
                rules = this._polishSettingsCache.regexRules;
            }

            for (const rule of rules) {
                if (!rule) continue;
                try {
                    if (rule instanceof RegExp) {
                        output = output.replace(rule,
```

## AIP375 ? skipped ? line 356 ? string ? 415 chars

```text
, error, rule);
                }
            }

            if (options.skipSanitize !== true) {
                output = this._sanitizeEditableProse
                    ? this._sanitizeEditableProse(output)
                    : String(output).trim();
            }

            return output || fallback;
        },

        _splitChapterForPolish(text, options = {}) {
            const source = String(text ||
```

## AIP376 ? _splitChapterForPolish() ? line 370 ? string ? 2108 chars

```text
);
            if (!source) return [];

            let maxChars = clampNumber(
                options.maxChars ?? options.chunkSize,
                DEFAULT_SETTINGS.chunkSize,
                600,
                20000
            );
            const maxChunks = clampNumber(
                options.maxChunks,
                DEFAULT_SETTINGS.maxChunks,
                1,
                200
            );
            if (source.length > maxChars * maxChunks) {
                maxChars = Math.ceil(source.length / maxChunks);
            }

            const minChars = clampNumber(
                options.minChars ?? options.minChunkSize,
                Math.min(DEFAULT_SETTINGS.minChunkSize, maxChars),
                200,
                maxChars
            );
            const contextChars = clampNumber(
                options.contextChars ?? options.overlap,
                DEFAULT_SETTINGS.contextChars,
                0,
                4000
            );

            const chunks = [];
            let start = 0;
            while (start < source.length) {
                const end = findChunkEnd(source, start, maxChars, minChars);
                const chunkText = source.slice(start, end);
                chunks.push({
                    index: chunks.length,
                    start,
                    end,
                    text: chunkText,
                    contextBefore: source.slice(Math.max(0, start - contextChars), start),
                    contextAfter: source.slice(end, Math.min(source.length, end + contextChars))
                });
                if (end <= start) break;
                start = end;
            }

            return chunks.map((chunk, index) => ({
                ...chunk,
                index,
                total: chunks.length
            }));
        },

        async _buildPolishPrompt(options = {}) {
            const bundle = options.bundle || await this._getPolishRulesBundle(options);
            const currentText = String(
                options.text ?? options.chunkText ?? options.input ?? options.content ??
```

## AIP377 ? rompt() ? line 429 ? string ? 552 chars

```text
);
            const chunkIndex = Number.isInteger(options.chunkIndex)
                ? options.chunkIndex
                : Number.isInteger(options.chunk?.index)
                    ? options.chunk.index
                    : 0;
            const totalChunks = Number.isInteger(options.totalChunks)
                ? options.totalChunks
                : Number.isInteger(options.chunk?.total)
                    ? options.chunk.total
                    : 1;
            const title = pickText(options.title, (document.getElementById(
```

## AIP378 ? (???) ? line 441 ? string ? 114 chars

```text
) || {}).value);
            const outline = String(
                options.outline ?? ((document.getElementById(
```

## AIP379 ? (???) ? line 448 ? string ? 128 chars

```text
&&
                bundle.settings?.deepseekV4?.enabled === true &&
                typeof this._buildDeepSeekPolishPrompt ===
```

## AIP380 ? (???) ? line 450 ? string ? 330 chars

```text
) {
                return this._buildDeepSeekPolishPrompt({
                    ...options,
                    text: currentText,
                    title,
                    outline,
                    extraInstruction: [
                        extraInstruction,
                        bundle.combinedRules ?
```

## AIP381 ? (???) ? line 465 ? string ? 159 chars

```text
).trim();
            if (!promptTpl && Modules.short?.getPrompt) {
                try {
                    promptTpl = String(await Modules.short.getPrompt(
```

## AIP382 ? (???) ? line 494 ? string ? 80 chars

```text
,
                totalChunks > 1 ? `[当前分块] ${chunkIndex + 1}/${totalChunks}` :
```

## AIP383 ? (???) ? line 521 ? string ? 127 chars

```text
);
        },

        async _polishText(text, options = {}) {
            const originalText = String(text ?? options.text ??
```

## AIP384 ? _polishText() ? line 525 ? string ? 753 chars

```text
);
            const fallbackText = resolveFallbackText(options, originalText);
            if (!originalText.trim()) {
                return options.returnMeta
                    ? { text: fallbackText, chunks: [], chunkCount: 0, usedFallback: fallbackText !== originalText }
                    : fallbackText;
            }

            let settings = options.settings || await this._getPolishSettings();
            if (options.forceDeepSeekRecipe) {
                settings = withDeepSeekRecipeSettings(settings);
            }
            const bundle = options.bundle || await this._getPolishRulesBundle({ ...options, settings });
            const usedDeepSeek = isDeepSeekRecipeActive(settings) && typeof this._buildDeepSeekPolishPrompt ===
```

## AIP385 ? (???) ? line 542 ? string ? 252 chars

```text
,
                forceDeepSeekRecipe: !!options.forceDeepSeekRecipe,
                usedDeepSeek,
                recipeId: settings.recipeId,
                oldSanitizeBeforeDeepSeek: usedDeepSeek,
                finalSanitizeMode: usedDeepSeek ?
```

## AIP386 ? (???) ? line 547 ? string ? 392 chars

```text
,
                startedAt: Date.now(),
                originalLength: originalText.length
            };
            const chunks = options.forceSingleChunk
                ? [{
                    index: 0,
                    total: 1,
                    start: 0,
                    end: originalText.length,
                    text: originalText,
                    contextBefore:
```

## AIP387 ? (???) ? line 559 ? string ? 1030 chars

```text
}]
                : this._splitChapterForPolish(originalText, {
                    maxChars: options.maxChars ?? settings.chunkSize,
                    minChars: options.minChars ?? settings.minChunkSize,
                    contextChars: options.contextChars ?? settings.contextChars,
                    maxChunks: options.maxChunks ?? settings.maxChunks
                });

            const outputs = [];
            const metaChunks = [];
            let usedFallback = false;

            for (const chunk of chunks) {
                const prompt = await this._buildPolishPrompt({
                    ...options,
                    settings,
                    bundle,
                    text: chunk.text,
                    chunk,
                    chunkIndex: chunk.index,
                    totalChunks: chunk.total,
                    contextBefore: chunk.contextBefore,
                    contextAfter: chunk.contextAfter
                });

                if (typeof this.updateIO ===
```

## AIP388 ? (???) ? line 625 ? string ? 98 chars

```text
)
                    ? this._applyDeepSeekHumanizePostRules(rawResult, { phase:
```

## AIP389 ? (???) ? line 672 ? string ? 87 chars

```text
)
                ? this._applyDeepSeekHumanizePostRules(joined, { phase:
```

## AIP390 ? (???) ? line 674 ? string ? 832 chars

```text
})
                : this._applyPolishRegex(joined, {
                    settings,
                    rules: options.finalRegexRules ?? options.regexRules,
                    fallback: fallbackText
                });
            const finalValidation = this._validatePolishResult(originalText, finalText, {
                settings,
                fallback: fallbackText,
                minLengthRatio: options.finalMinLengthRatio ?? options.minLengthRatio,
                maxLengthRatio: options.finalMaxLengthRatio ?? options.maxLengthRatio,
                regexRules: options.finalRegexRules ?? options.regexRules
            });

            usedFallback = usedFallback || finalValidation.usedFallback;
            this._lastPolishRunMeta = {
                ...(this._lastPolishRunMeta || {}),
                status:
```

## AIP391 ? (???) ? line 691 ? string ? 1326 chars

```text
,
                endedAt: Date.now(),
                chunkCount: chunks.length,
                usedFallback,
                reason: finalValidation.reason,
                outputLength: finalValidation.text.length
            };

            if (options.returnMeta) {
                return {
                    text: finalValidation.text,
                    chunks: metaChunks,
                    chunkCount: chunks.length,
                    usedFallback,
                    reason: finalValidation.reason,
                    rulesBundle: bundle
                };
            }

            return finalValidation.text;
        },

        _validatePolishResult(originalText, polishedText, options = {}) {
            const settings = options.settings || this._polishSettingsCache || DEFAULT_SETTINGS;
            const usedDeepSeek = isDeepSeekRecipeActive(settings);
            const sourceSanitizeOptions = usedDeepSeek
                ? { preserveCornerQuotes: false }
                : {};
            const outputSanitizeOptions = usedDeepSeek
                ? { preserveCornerQuotes: true, safetyOnly: true }
                : {};
            const rawFallbackText = resolveFallbackText(options, originalText);
            const fallbackText = usedDeepSeek && typeof this._sanitizeDeepSeekInputProse ===
```

## AIP392 ? (???) ? line 723 ? string ? 228 chars

```text
? this._sanitizeDeepSeekInputProse(rawFallbackText)
                : rawFallbackText;
            const source = this._sanitizeEditableProse
                ? this._sanitizeEditableProse(String(originalText ||
```

## AIP393 ? (???) ? line 728 ? string ? 134 chars

```text
).trim();
            const output = this._sanitizeEditableProse
                ? this._sanitizeEditableProse(String(polishedText ||
```

## AIP394 ? (???) ? line 734 ? string ? 240 chars

```text
, usedFallback: true };
            }

            const metaPattern = /^(?:#{1,6}\s|[-*]\s|润色说明[:：]|修改说明[:：]|以下是|总结[:：]|分析[:：])/m;
            if (metaPattern.test(output)) {
                return { ok: false, text: fallbackText, reason:
```

# ???assets/js/modules_split/writer/writer_polish_deepseek.js

## AIP395 ? verbatim_string_note ? line 714 ? string ? 99 chars

```text
本 JSON 中所有 pattern 已转为标准 JSON 字符串：C# verbatim @"\\d+" -> JSON "\\\\d+"。读取后直接交给 regex 引擎即可，无需再做转义处理。
```

# ???assets/js/modules_split/writer/writer_review.js

## AIP396 ? prompt ? line 64 ? template ? 765 chars

```text
你是一位资深文学编辑，请对以下章节进行7维度专业审稿。

【项目背景】
世界观: ${...}
大纲: ${...}
角色: ${...}

【审稿维度】（每项满分10分）

1. 情节逻辑
   - 因果链条是否清晰？
   - 有无逻辑漏洞或前后矛盾？
   - 事件发展是否符合人物动机？

2. 人物塑造
   - 人物行为是否符合人设？
   - 对话是否有辨识度？
   - 是否有"纸片人"倾向？

3. 文笔风格
   - 句式是否有节奏感？
   - 描写是否具体生动？
   - 有无过度解释或抽象概括？

4. 节奏把控
   - 信息密度是否合理？
   - 有无拖沓或跳跃？
   - 高潮和低谷的分布？

5. 对话质量
   - 对话是否推动剧情？
   - 是否有潜台词？
   - 口语化程度？

6. 世界观一致性
   - 设定是否前后一致？
   - 新信息是否与已有设定冲突？
   - 环境描写是否符合世界观？

7. 商业潜力
   - 是否有足够的钩子？
   - 爽点/情绪点是否到位？
   - 付费点设计如何？

【输出格式要求】
请先输出JSON格式的评分（必须严格符合以下格式）：
{"plot_logic":X,"character":X,"style":X,"pacing":X,"dialogue":X,"world_consistency":X,"commercial":X,"total":X,"summary":"总体评价100字内"}

然后输出详细审稿报告：
- 每个维度的具体问题和修改建议（至少2条 actionable 建议）
- 标出具体问题段落（引用原文+修改建议）
- 给出修改优先级排序（必须改/建议改/可不改）

【待审稿件】
${...}
```

# ???assets/js/modules_split/writer/writer_rhythm.js

## AIP397 ? prompt ? line 12 ? template ? 581 chars

```text
你是一位数据分析专家。请对以下小说章节进行节奏分析，按每500字为一个分析单元，输出结构化数据。

【待分析文本】
${...}

请按以下JSON格式输出（仅输出JSON，不要其他文字）：
{
  "segments": [
    {"range": "0-500字", "conflict": 7, "emotion": 5, "info_density": 6, "dialogue_ratio": 30, "label": "开篇悬念"},
    ...
  ],
  "highlights": [
    {"pos": "1000字", "type": "高潮", "desc": "主角发现真相"},
    ...
  ],
  "warnings": [
    {"pos": "2500字", "type": "平淡", "desc": "连续800字无冲突，建议插入转折"},
    ...
  ],
  "summary": "本章整体节奏评价"
}

评分标准（1-10分）：
- conflict: 冲突强度（1=平静，10=激烈对抗）
- emotion: 情感起伏（1=平淡，10=强烈情绪）
- info_density: 信息密度（1=水分大，10=信息饱和）
- dialogue_ratio: 对话占比（百分比）
```

# ???assets/js/modules_split/writer/writer_tree.js

## AIP398 ? _normalizeWriterTitle() ? line 167 ? string ? 13209 chars

```text
'“”‘’\s]/g, '')
            .replace(/[：:，、；;。.!！?？-]/g, '')
            .trim()
            .toLowerCase();
    },

    async _healFusionCreativeVolumes(project, vols, chaps) {
        if (!project?.id) return false;
        const creativeChaps = (chaps || []).filter(c => c && (c.fusionCreative || c.source === 'fusion_creative_pipeline'));
        if (!creativeChaps.length) return false;
        let changed = false;
        const scopedVolumes = vols || [];
        const byOrder = new Map();
        for (const vol of scopedVolumes) {
            const order = parseInt(vol.order || 0, 10);
            const startChapter = (order - 1) * 5 + 1;
            const endChapter = order * 5;
            const expectedTitle = `第${order}卷 第${startChapter}-${endChapter}章`;
            if (order > 0 && (vol.fusionCreative || vol.source === 'fusion_creative_pipeline' || this._writerCleanHeading(vol.title || vol.name) === expectedTitle)) {
                byOrder.set(order, vol);
            }
        }

        for (const chapter of creativeChaps) {
            const chapterOrder = parseInt(chapter.order || chapter.number || 1, 10) || 1;
            const volumeOrder = Math.max(1, Math.ceil(chapterOrder / 5));
            const startChapter = (volumeOrder - 1) * 5 + 1;
            const endChapter = volumeOrder * 5;
            const volumeTitle = `第${volumeOrder}卷 第${startChapter}-${endChapter}章`;
            let volume = byOrder.get(volumeOrder);
            if (!volume) {
                volume = this._stampProject({
                    id: Utils.uuid(),
                    title: volumeTitle,
                    name: volumeTitle,
                    order: volumeOrder,
                    source: 'fusion_creative_pipeline',
                    fusionCreative: true,
                    startChapter,
                    endChapter,
                    outline: `创作融合自动分卷：第${startChapter}-${endChapter}章。`,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                }, project.id);
                await DB.put('volumes', volume);
                scopedVolumes.push(volume);
                byOrder.set(volumeOrder, volume);
                changed = true;
            } else {
                const cleanVolumeTitle = this._writerCleanHeading(volume.title || volume.name);
                if (cleanVolumeTitle !== volumeTitle || !volume.fusionCreative || volume.source !== 'fusion_creative_pipeline') {
                    volume.title = volumeTitle;
                    volume.name = volumeTitle;
                    volume.order = volumeOrder;
                    volume.source = 'fusion_creative_pipeline';
                    volume.fusionCreative = true;
                    volume.startChapter = startChapter;
                    volume.endChapter = endChapter;
                    volume.updatedAt = Date.now();
                    this._stampProject(volume, project.id);
                    await DB.put('volumes', volume);
                    changed = true;
                }
            }

            const cleanTitle = this._writerCleanHeading(chapter.title);
            if (chapter.volumeId !== volume.id || chapter.volumeTitle !== volume.title || chapter.title !== cleanTitle) {
                chapter.volumeId = volume.id;
                chapter.volumeTitle = volume.title;
                chapter.title = cleanTitle || chapter.title;
                chapter.order = chapterOrder;
                chapter.number = chapterOrder;
                chapter.source = 'fusion_creative_pipeline';
                chapter.fusionCreative = true;
                chapter.updatedAt = Date.now();
                this._stampProject(chapter, project.id);
                await DB.put('chapters', chapter);
                changed = true;
            }
        }

        if (changed) {
            try { UI.toast('已按创作融合规则自动整理：每5章一卷'); } catch(e) {}
        }
        return changed;
    },

    async _healVolumeHeadingChapters(project, vols, chaps) {
        const pseudoVolumes = (chaps || []).filter(c => this._isVolumeHeadingTitle(c.title));
        if (!project?.id || !pseudoVolumes.length) return false;
        const defaultVolumeIds = new Set((vols || []).filter(v => this._writerCleanHeading(v.title || v.name) === '正文卷').map(v => v.id));
        const validVolumeIds = new Set((vols || []).map(v => v.id));
        let changed = false;

        for (const pseudo of pseudoVolumes) {
            const title = this._writerCleanHeading(pseudo.title);
            const norm = this._normalizeWriterTitle(title);
            const order = this._parseVolumeOrderFromTitle(title, (vols || []).length + 1);
            let volume = (vols || []).find(v => this._normalizeWriterTitle(v.title || v.name) === norm);
            if (!volume) {
                volume = this._stampProject({
                    id: Utils.uuid(),
                    title,
                    order,
                    source: 'writer_auto_heal',
                    outline: pseudo.outline || pseudo.content || '',
                    createdAt: pseudo.createdAt || Date.now(),
                    updatedAt: Date.now()
                }, project.id);
                await DB.put('volumes', volume);
                vols.push(volume);
            } else if (!volume.outline && (pseudo.outline || pseudo.content)) {
                volume.outline = pseudo.outline || pseudo.content || '';
                volume.updatedAt = Date.now();
                this._stampProject(volume, project.id);
                await DB.put('volumes', volume);
            }

            for (const chapter of chaps || []) {
                if (!chapter || chapter.id === pseudo.id || this._isVolumeHeadingTitle(chapter.title)) continue;
                if (!this._isChapterHeadingTitle(chapter.title)) continue;
                const chapterVolumeMissing = !chapter.volumeId || !validVolumeIds.has(chapter.volumeId);
                const chapterInDefault = chapter.volumeId && defaultVolumeIds.has(chapter.volumeId);
                const chapterMatchesTitle = this._normalizeWriterTitle(chapter.volumeTitle) === norm;
                const onlyPseudoAndUnassigned = pseudoVolumes.length === 1 && (!chapter.volumeId || chapterVolumeMissing || chapterInDefault || !chapter.volumeTitle);
                if (chapterVolumeMissing || chapterInDefault || chapterMatchesTitle || onlyPseudoAndUnassigned) {
                    chapter.volumeId = volume.id;
                    chapter.volumeTitle = volume.title;
                    this._stampProject(chapter, project.id);
                    await DB.put('chapters', chapter);
                }
            }

            if (this.currentChapterId === pseudo.id) {
                this.currentChapterId = null;
                this.currentVolumeId = volume.id;
            }
            await DB.del('chapters', pseudo.id);
            changed = true;
        }

        if (changed) {
            const latestChaps = this._scopeRecords(await DB.getAll('chapters') || [], project.id);
            for (const vol of vols || []) {
                if (this._writerCleanHeading(vol.title || vol.name) !== '正文卷') continue;
                const hasChapter = latestChaps.some(c => c.volumeId === vol.id);
                if (!hasChapter) await DB.del('volumes', vol.id);
            }
            try { UI.toast(`已自动修正 ${pseudoVolumes.length} 个卷标题，卷章结构已归位`); } catch(e) {}
        }
        return changed;
    },

    // ===== 筛选 & 批量操作 =====
    setFilter(filter) {
        this._treeFilter = filter;
        // 更新按钮样式
        document.querySelectorAll('#w-status-filters button').forEach(btn => {
            const isActive = btn.dataset.filter === filter;
            btn.className = isActive
                ? 'px-1.5 py-0.5 rounded text-[9px] border transition-all bg-accent/20 text-accent border-accent/30'
                : 'px-1.5 py-0.5 rounded text-[9px] border transition-all bg-white/5 text-dim border-white/10';
        });
        this.loadTree();
    },

    toggleBatchMode() {
        this._batchMode = !this._batchMode;
        this._batchSelected.clear();
        const bar = document.getElementById('w-batch-bar');
        const btn = document.getElementById('w-batch-toggle');
        if (bar) bar.classList.toggle('hidden', !this._batchMode);
        if (btn) btn.classList.toggle('bg-accent/20', this._batchMode);
        if (btn) btn.classList.toggle('text-accent', this._batchMode);
        this.loadTree();
    },

    toggleBatchSelect(id) {
        if (this._batchSelected.has(id)) this._batchSelected.delete(id);
        else this._batchSelected.add(id);
        const countEl = document.getElementById('w-batch-count');
        if (countEl) countEl.textContent = '已选 ' + this._batchSelected.size;
    },

    toggleTreeActions(target) {
        this._treeActionTarget = this._treeActionTarget === target ? null : target;
        this.loadTree();
    },

    async saveStatus() {
        const project = await this._requireActiveProject?.({ renderGate: true });
        if (!project) return;
        if (!this.currentChapterId) return;
        const chap = await DB.get('chapters', this.currentChapterId);
        if (!chap) return;
        if (chap.projectId && chap.projectId !== project.id) return UI.toast('该章节不属于当前项目', 'warning');
        const stEl = document.getElementById('w-chap-status');
        if (stEl) chap.status = stEl.value;
        this._stampProject(chap, project.id);
        await DB.put('chapters', chap);
        this.loadTree();
    },

    _updateWordProgress() {
        const stats = document.getElementById('w-stats');
        const target = document.getElementById('w-target-words');
        const bar = document.getElementById('w-word-progress');
        if (!stats || !target || !bar) return;
        const cur = parseInt(stats.textContent) || 0;
        const tgt = parseInt(target.value) || 2500;
        const pct = Math.min(100, Math.round((cur / tgt) * 100));
        bar.style.width = pct + '%';
    },

    async batchMove() {
        const project = await this._requireActiveProject?.({ renderGate: true });
        if (!project) return;
        if (this._batchSelected.size === 0) return UI.toast('请先选择章节');
        const vols = this._scopeRecords(await DB.getAll('volumes') || [], project.id).sort((a,b) => (a.order||0) - (b.order||0));
        const volId = prompt('移动到哪个卷？输入卷ID或名称（' + vols.map(v => v.title).join(' / ') + '）');
        if (!volId) return;
        const targetVol = vols.find(v => v.id === volId || v.title === volId);
        if (!targetVol) return UI.toast('未找到该卷');
        const moved = this._batchSelected.size;
        for (const id of this._batchSelected) {
            const chap = await DB.get('chapters', id);
            if (chap && (!chap.projectId || chap.projectId === project.id)) { chap.volumeId = targetVol.id; this._stampProject(chap, project.id); await DB.put('chapters', chap); }
        }
        this._batchSelected.clear();
        this.loadTree();
        UI.toast(`已移动 ${moved} 章到 ${targetVol.title}`);
    },

    async batchSetStatus() {
        const project = await this._requireActiveProject?.({ renderGate: true });
        if (!project) return;
        if (this._batchSelected.size === 0) return UI.toast('请先选择章节');
        const status = prompt('设置状态: outline(待写) / draft(草稿) / done(已完成) / polished(已润色)');
        if (!['outline','draft','done','polished'].includes(status)) return UI.toast('无效状态');
        for (const id of this._batchSelected) {
            const chap = await DB.get('chapters', id);
            if (chap && (!chap.projectId || chap.projectId === project.id)) { chap.status = status; this._stampProject(chap, project.id); await DB.put('chapters', chap); }
        }
        this._batchSelected.clear();
        this.loadTree();
        UI.toast('状态已批量更新');
    },

    async batchDelete() {
        const project = await this._requireActiveProject?.({ renderGate: true });
        if (!project) return;
        if (this._batchSelected.size === 0) return UI.toast('请先选择章节');
        if (!confirm(`确定删除选中的 ${this._batchSelected.size} 个章节？`)) return;
        for (const id of this._batchSelected) {
            const chap = await DB.get('chapters', id);
            if (chap && (!chap.projectId || chap.projectId === project.id)) await DB.del('chapters', id);
        }
        this._batchSelected.clear();
        this.currentChapterId = null;
        this.loadTree();
        UI.toast('已删除');
    },

    selectVol(id) {
        this._treeActionTarget = null;
        this.currentVolumeId = id;
        this.currentChapterId = null;
        this.loadTree();
        UI.toast('已选中卷，新建章节将归属此卷');
    },

    // ===== CRUD =====
    newVol() {
        if (!GenesisCore?._activeProjectId) return this._requireActiveProject?.({ renderGate: true });
        const list = document.getElementById('w-chap-list');
        if (!list || list.querySelector('.w-inline-input')) return;
        const row = document.createElement('div');
        row.className = 'w-inline-input flex items-center gap-1 px-2 py-1';
        row.innerHTML = `<i class=
```

## AIP399 ? if() ? line 467 ? string ? 1927 chars

```text
)) {
                        break;
                    }
                    lastInVol = item;
                }
            }
            if (lastInVol) {
                lastInVol.after(row);
                inserted = true;
            }
        }
        if (!inserted) list.appendChild(row);
        row.querySelector('input').focus();
    },
    async _confirmNewVol(title) {
        const project = await this._requireActiveProject?.({ renderGate: true });
        if (!project) return;
        if (!title || !title.trim()) return UI.toast('卷名不能为空', 'error');
        const vols = this._scopeRecords(await DB.getAll('volumes') || [], project.id).sort((a,b) => (a.order||0) - (b.order||0));
        const id = Utils.uuid();
        // 找到当前卷的order，新卷插入其后
        let insertOrder = vols.length + 1;
        if (this.currentVolumeId) {
            const curVol = vols.find(v => v.id === this.currentVolumeId);
            if (curVol) {
                insertOrder = (curVol.order || 0) + 1;
                // 后面的卷order全部+1
                for (const v of vols) {
                    if ((v.order || 0) >= insertOrder) {
                        v.order = (v.order || 0) + 1;
                        await DB.put('volumes', v);
                    }
                }
            }
        }
        await DB.put('volumes', this._stampProject({ id, title: title.trim(), order: insertOrder }, project.id));
        this.currentVolumeId = id;
        this.loadTree();
        UI.toast('已新建卷：' + title.trim());
    },
    newChap() {
        if (!GenesisCore?._activeProjectId) return this._requireActiveProject?.({ renderGate: true });
        const list = document.getElementById('w-chap-list');
        if (!list || list.querySelector('.w-inline-input')) return;
        const row = document.createElement('div');
        row.className = 'w-inline-input flex items-center gap-1 px-2 py-1';
        row.innerHTML = `<i class=
```

## AIP400 ? for() ? line 524 ? string ? 2335 chars

```text
)) {
                    allItems[i].after(row);
                    inserted = true;
                    break;
                }
            }
        }
        if (!inserted) list.appendChild(row);
        row.querySelector('input').focus();
    },
    async _confirmNewChap(title) {
        const project = await this._requireActiveProject?.({ renderGate: true });
        if (!project) return;
        if (!title || !title.trim()) return UI.toast('章节名不能为空', 'error');
        const chaps = this._scopeRecords(await DB.getAll('chapters') || [], project.id).sort((a,b) => (a.order||0) - (b.order||0));
        const id = Utils.uuid();
        let insertOrder = chaps.length + 1;
        let volId = this.currentVolumeId || null;
        
        if (this.currentChapterId) {
            const curChap = chaps.find(c => c.id === this.currentChapterId);
            if (curChap) {
                insertOrder = (curChap.order || 0) + 1;
                volId = curChap.volumeId || volId;
                for (const c of chaps) {
                    if (c.volumeId === volId && (c.order || 0) >= insertOrder) {
                        c.order = (c.order || 0) + 1;
                        await DB.put('chapters', c);
                    }
                }
            }
        } else if (volId) {
            const volChaps = chaps.filter(c => c.volumeId === volId).sort((a,b) => (a.order||0) - (b.order||0));
            if (volChaps.length > 0) {
                const lastChap = volChaps[volChaps.length - 1];
                insertOrder = (lastChap.order || 0) + 1;
            } else {
                insertOrder = 1;
            }
            for (const c of chaps) {
                if (c.volumeId === volId && (c.order || 0) >= insertOrder) {
                    c.order = (c.order || 0) + 1;
                    await DB.put('chapters', c);
                }
            }
        }
        
        await DB.put('chapters', this._stampProject({ id, title: title.trim(), content: '', outline: '', order: insertOrder, volumeId: volId, status: 'outline', targetWords: 2500, createdAt: Date.now(), updatedAt: Date.now() }, project.id));
        this.loadTree();
        this.load(id);
        UI.toast('已新建章节：' + title.trim());
    },
    async rename(type, id, evt) {
        const row = evt?.target?.closest?.(`[data-w-row=
```

## AIP401 ? (???) ? line 577 ? string ? 477 chars

```text
]`);
        const titleEl = row?.querySelector?.('[data-w-title]');
        const project = await this._requireActiveProject?.({ renderGate: true });
        if (!project) return;
        const store = type === 'vol' ? 'volumes' : 'chapters';
        const item = await DB.get(store, id);
        if (!item || (item.projectId && item.projectId !== project.id)) return UI.toast('不能修改其他项目的数据', 'warning');
        if (!titleEl) return;
        titleEl.innerHTML = `<input class=
```

