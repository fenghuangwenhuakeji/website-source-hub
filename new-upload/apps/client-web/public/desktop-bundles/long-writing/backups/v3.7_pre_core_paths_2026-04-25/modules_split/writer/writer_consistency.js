// writer_consistency.js — 人设一致性守卫 (Character Consistency Guard)
// 对标: 星月写作 人设一致性检测
// 注: 基础一致性检测已由 writer_panel.js 的 _checkConsistency 提供
// 本模块扩展更深度的人设专项检测
Object.assign(Modules.writer, {
    async _checkCharacterConsistency() {
        const editor = document.getElementById('w-editor');
        const content = editor ? editor.value : '';
        if (!content.trim()) return UI.toast('请先写入内容');

        // 获取角色数据
        let charCtx = '';
        try {
            const entities = await DB.getAll('entities');
            const chars = entities.filter(e => e.type === 'character');
            charCtx = chars.map(c => `【${c.name}】${c.description?.slice(0, 300) || ''}`).join('\n');
        } catch(e) {}

        // 获取前文内容
        let prevCtx = '';
        try {
            prevCtx = await this._getPrevChapterSummary();
        } catch(e) {}

        const prompt = `你是一位严格的人设一致性审查员。请检查以下文本中是否存在人设崩塌或逻辑矛盾。

【角色设定】
${charCtx || '未提供'}

【前文摘要】
${prevCtx || '未提供'}

【待检查文本】
${content.slice(0, 4000)}

请检查以下问题（如有发现，引用原文并指出问题）：
1. 角色性格偏离：行为是否与前文人设矛盾？
2. 能力超限：角色是否使用了未设定的能力？
3. 关系矛盾：人物关系是否与已建立的不一致？
4. 言行不一：角色是否说了不符合其立场的话？
5. 知识泄露：角色是否知道不该知道的信息？
6. OOC警告：角色是否做出了"不符合逻辑"的行为？

输出格式：
- 如无问题：输出"✓ 人设一致性检查通过"
- 如有问题：按严重程度排序，每条包含：问题类型、引用原文、问题说明、修改建议`;

        let result = '';
        const resultEl = document.getElementById('w-diagnose-result');
        if (resultEl) resultEl.innerHTML = '<div class="text-dim text-xs flex items-center gap-2"><i class="fa-solid fa-spinner fa-spin"></i>正在深度检测人设一致性...</div>';

        try {
            await AI.generate(prompt, {}, chunk => {
                result += chunk;
                if (resultEl) resultEl.innerHTML = `<div class="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">${typeof marked !== 'undefined' ? marked.parse(result) : result}</div>`;
            });
            UI.toast('人设深度检测完成', result.includes('✓') ? 'success' : 'warning');
        } catch(e) {
            UI.toast('检测失败: ' + e.message, 'error');
        }
    }
});
