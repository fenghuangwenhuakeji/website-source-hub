Object.assign(Modules.tools_center, {
    async runWorkflow(overrideInput) {
        const TC = this;
        if (TC.nodes.length === 0) return UI.toast('画布为空，请添加节点');
        const inputNodes = TC.nodes.filter(n => n.type === 'input');
        if (inputNodes.length === 0) return UI.toast('请添加至少一个输入源节点');

        // 自动打开IO面板
        const ioPanel = document.getElementById('tc-global-io');
        if (ioPanel) ioPanel.classList.remove('hidden');

        UI.toast('工作流开始执行...');
        const ioIn = document.getElementById('tc-io-in');
        const ioOut = document.getElementById('tc-io-out');
        const executed = new Set();
        const results = {};

        for (const inp of inputNodes) {
            if (overrideInput !== undefined) {
                results[inp.id] = overrideInput;
            } else {
                const preset = inp.data.prompt || '';
                results[inp.id] = preset || (window.prompt('请输入工作流起始数据 (' + (inp.data.label || '输入源') + ')：') || '');
            }
            executed.add(inp.id);
            if (ioIn) ioIn.value = `[输入源] ${(results[inp.id] || '').slice(0, 1000)}`;
        }

        let queue = [...inputNodes.map(n => n.id)];
        let safety = 0;
        let stepCount = 0;
        while (queue.length > 0 && safety < 100) {
            safety++;
            const nextQueue = [];
            for (const nodeId of queue) {
                const outConns = TC.connections.filter(c => c.from === nodeId);
                for (const conn of outConns) {
                    const targetNode = TC.nodes.find(n => n.id === conn.to);
                    if (!targetNode || executed.has(targetNode.id)) continue;
                    const sourceNode = TC.nodes.find(n => n.id === nodeId);
                    if (sourceNode && sourceNode.type === 'condition' && sourceNode._condResult && conn.fromPort !== sourceNode._condResult) continue;
                    const inConns = TC.connections.filter(c => c.to === targetNode.id);
                    const allReady = inConns.every(c => executed.has(c.from));
                    if (!allReady) continue;
                    const inputs = inConns.map(c => results[c.from] || '').filter(Boolean);
                    const inputText = inputs.join('\n\n---\n\n');
                    stepCount++;
                    if (ioIn) ioIn.value = `[步骤${stepCount}] ${targetNode.data.label || targetNode.type}\n\n输入:\n${inputText.slice(0,2000)}`;
                    if (ioOut) ioOut.value = `[步骤${stepCount}] ${targetNode.data.label || targetNode.type} 执行中...`;
                    try {
                        const result = await TC._executeNode(targetNode, inputText);
                        results[targetNode.id] = result;
                        if (ioOut) { ioOut.value = `[步骤${stepCount}] ${targetNode.data.label || targetNode.type} ✓ 完成\n\n${result}`; ioOut.scrollTop = ioOut.scrollHeight; }
                    } catch(err) {
                        results[targetNode.id] = '[错误] ' + err.message;
                        UI.toast('节点执行失败: ' + targetNode.data.label);
                    }
                    executed.add(targetNode.id);
                    nextQueue.push(targetNode.id);
                }
            }
            queue = nextQueue;
        }

        const outputNodes = TC.nodes.filter(n => n.type === 'output');
        const finalResults = outputNodes.map(n => results[n.id] || '').filter(Boolean);
        if (finalResults.length === 0) {
            const lastId = [...executed].pop();
            if (lastId && results[lastId]) finalResults.push(results[lastId]);
        }
        const finalText = finalResults.join('\n\n===\n\n');
        UI.toast('工作流执行完成');
        TC.logIO(Object.values(results).slice(0,2).join('\n').slice(0,200), finalText.slice(0,500));
        return finalText;
    },

    async _executeNode(node, input) {
        const type = node.type;
        const customPrompt = node.data.prompt || '';
        const opts = {};
        if (node.data.model) opts.model = node.data.model;
        if (node.data.temperature) opts.temperature = parseFloat(node.data.temperature);
        const ioOut = document.getElementById('tc-io-out');

        const defaultPrompts = {
            llm: '请根据以下内容生成高质量文本：',
            polish: '请润色以下文本，提升文笔质量，保持原意：',
            translate: '请将以下内容翻译为英文（如已是英文则翻译为中文）：',
            summary: '请总结以下内容的核心要点：',
            expand: '请将以下内容扩写为更详细、更有画面感的文字：',
            rewrite: '请用不同的表达方式改写以下内容，保持核心含义：',
            extract: '请从以下文本中提取关键信息（人物、事件、地点、时间等）：'
        };

        if (defaultPrompts[type]) {
            const prompt = (customPrompt || defaultPrompts[type]) + '\n\n' + input;
            let res = '';
            await AI.generate(prompt, opts, c => { res += c; if (ioOut) { ioOut.value = `[${node.data.label || type}] 实时输出:\n${res}`; ioOut.scrollTop = ioOut.scrollHeight; } });
            return res;
        }
        if (type === 'output') return input;

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
            let current = input;
            const iterPrompt = customPrompt || '请在保持核心内容的基础上进一步优化以下文本';
            for (let i = 0; i < count; i++) {
                const p = `${iterPrompt}（第${i+1}/${count}次迭代）：\n\n${current}`;
                let res = '';
                await AI.generate(p, opts, c => { res += c; if (ioOut) { ioOut.value = `[${node.data.label || '循环'}] 迭代${i+1}/${count}:\n${res}`; ioOut.scrollTop = ioOut.scrollHeight; } });
                current = res;
            }
            return current;
        }

        if (type === 'agent_node') {
            const agentId = node.data.agentId;
            if (!agentId) return '[错误] 未选择智能体';
            const agents = await this._getAgents();
            const agent = agents.find(a => a.id === agentId);
            if (!agent) return '[错误] 智能体不存在';
            let res = '';
            await AI.generate(agent.prompt + '\n\n用户输入：\n' + input, opts, c => { res += c; if (ioOut) { ioOut.value = `[${agent.name}] 实时输出:\n${res}`; ioOut.scrollTop = ioOut.scrollHeight; } });
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
            if (!wfId) return '[错误] 未选择子工作流';
            const wfs = await this._getSavedWorkflows();
            const wf = wfs.find(w => w.id === wfId);
            if (!wf) return '[错误] 子工作流不存在';
            const backup = { nodes: [...this.nodes], connections: [...this.connections] };
            this.nodes = JSON.parse(JSON.stringify(wf.nodes));
            this.connections = JSON.parse(JSON.stringify(wf.connections));
            let result = '';
            try { result = await this.runWorkflow(input); } catch(e) { result = '[子工作流错误] ' + e.message; }
            this.nodes = backup.nodes;
            this.connections = backup.connections;
            return result;
        }

        if (type === 'rag_node') {
            const query = node.data.query || input.slice(0, 200);
            const limit = parseInt(node.data.limit) || 8;
            if (typeof RAGSystem !== 'undefined') {
                const results = await RAGSystem.search(query, limit);
                const context = results.map(r => `[${r.source}] ${r.title}: ${r.content.slice(0,300)}`).join('\n\n');
                return context ? (context + '\n\n---\n原始输入：\n' + input) : input;
            }
            return '[RAG不可用] ' + input;
        }

        return input;
    },

    // ═══════════════════════════════════════════
    // 工作流保存/加载/导入/导出
    // ═══════════════════════════════════════════
    async saveWorkflow() {
        if (this.nodes.length === 0) return UI.toast('画布为空');
        const name = window.prompt('工作流名称：', '我的工作流_' + new Date().toLocaleDateString());
        if (!name) return;
        const wf = { id: 'wf_' + Date.now(), name, nodes: JSON.parse(JSON.stringify(this.nodes)), connections: [...this.connections], ts: Date.now() };
        const store = await DB.get('settings', 'tc_workflows') || { id: 'tc_workflows', items: [] };
        store.items.push(wf);
        await DB.put('settings', store);
        UI.toast('工作流已保存: ' + name);
        this.loadSavedWorkflows();
    },

    async loadWorkflow(id) {
        const wfs = await this._getSavedWorkflows();
        const wf = wfs.find(w => w.id === id);
        if (!wf) return UI.toast('工作流不存在');
        this.nodes = JSON.parse(JSON.stringify(wf.nodes));
        this.connections = JSON.parse(JSON.stringify(wf.connections));
        this._renderAllNodes();
        this.drawConnections();
        UI.toast('已加载: ' + wf.name);
    },

    async deleteWorkflow(id) {
        const store = await DB.get('settings', 'tc_workflows') || { id: 'tc_workflows', items: [] };
        store.items = store.items.filter(w => w.id !== id);
        await DB.put('settings', store);
        UI.toast('已删除');
        this.loadSavedWorkflows();
    },

    async loadSavedWorkflows() {
        const wfs = await this._getSavedWorkflows();
        const el = document.getElementById('tc-saved-workflows');
        if (!el) return;
        el.innerHTML = wfs.length === 0 ? '<div class="text-[9px] text-dim px-1">暂无保存的工作流</div>' :
            wfs.map(w => `
                <div class="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-white/5 hover:bg-indigo-500/10 cursor-pointer group transition-all" onclick="Modules.tools_center.loadWorkflow('${w.id}')">
                    <i class="fa-solid fa-diagram-project text-indigo-400/50"></i>
                    <span class="flex-1 truncate text-dim group-hover:text-white">${w.name}</span>
                    <span class="text-[8px] text-dim">${(w.nodes||[]).length}节点</span>
                    <button class="opacity-0 group-hover:opacity-100 text-dim hover:text-green-400 text-[8px]" onclick="event.stopPropagation();Modules.tools_center.exportSingleWorkflow('${w.id}')" title="导出"><i class="fa-solid fa-download"></i></button>
                    <button class="opacity-0 group-hover:opacity-100 text-dim hover:text-red-400 text-[8px]" onclick="event.stopPropagation();Modules.tools_center.deleteWorkflow('${w.id}')"><i class="fa-solid fa-xmark"></i></button>
                </div>
            `).join('');
    },

    async _getSavedWorkflows() {
        const store = await DB.get('settings', 'tc_workflows');
        return (store && store.items) ? store.items : [];
    },

    // 导出当前画布为JSON
    exportWorkflowJSON() {
        if (this.nodes.length === 0) return UI.toast('画布为空');
        const data = { name: '工作流_' + new Date().toLocaleDateString(), nodes: this.nodes, connections: this.connections, exportedAt: Date.now(), version: 'v4' };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = data.name + '.json';
        a.click();
        UI.toast('已导出工作流JSON');
    },

    // 导出单个已保存工作流
    async exportSingleWorkflow(id) {
        const wfs = await this._getSavedWorkflows();
        const wf = wfs.find(w => w.id === id);
        if (!wf) return;
        const data = { name: wf.name, nodes: wf.nodes, connections: wf.connections, exportedAt: Date.now(), version: 'v4' };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = wf.name + '.json';
        a.click();
        UI.toast('已导出: ' + wf.name);
    },

    // 导入JSON工作流
    importWorkflowJSON() {
        let input = document.getElementById('tc-import-wf-input');
        if (!input) {
            input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.id = 'tc-import-wf-input';
            input.style.display = 'none';
            document.body.appendChild(input);
        }
        input.value = '';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                if (!data.nodes || !Array.isArray(data.nodes)) return UI.toast('无效的工作流文件');
                // 加载到画布
                this.nodes = data.nodes;
                this.connections = data.connections || [];
                this._renderAllNodes();
                this.drawConnections();
                UI.toast('已导入工作流: ' + (data.name || '未命名') + ' (' + data.nodes.length + '个节点)');
                // 同时保存
                const store = await DB.get('settings', 'tc_workflows') || { id: 'tc_workflows', items: [] };
                store.items.push({ id: 'wf_' + Date.now(), name: data.name || '导入_' + file.name, nodes: data.nodes, connections: data.connections || [], ts: Date.now() });
                await DB.put('settings', store);
                this.loadSavedWorkflows();
            } catch(err) { UI.toast('导入失败: ' + err.message); }
        };
        input.click();
    },

    // ═══════════════════════════════════════════
    // 6条预设工作流
    // ═══════════════════════════════════════════
    resetPan() {
        this.panX = 0; this.panY = 0;
        const inner = document.getElementById('tc-canvas-inner');
        if (inner) inner.style.transform = `translate(0px,0px)`;
        this.drawConnections();
    },

    autoLayout() {
        if (this.nodes.length === 0) return;
        // 重置平移
        this.panX = 0; this.panY = 0;
        const inner = document.getElementById('tc-canvas-inner');
        if (inner) inner.style.transform = `translate(0px,0px)`;
        const levels = {};
        const visited = new Set();
        const assignLevel = (id, level) => {
            if (visited.has(id)) return;
            visited.add(id);
            levels[id] = Math.max(levels[id] || 0, level);
            this.connections.filter(c => c.from === id).forEach(c => assignLevel(c.to, level + 1));
        };
        this.nodes.filter(n => n.type === 'input').forEach(n => assignLevel(n.id, 0));
        this.nodes.forEach(n => { if (!visited.has(n.id)) levels[n.id] = 0; });
        const groups = {};
        for (const [id, lv] of Object.entries(levels)) { if (!groups[lv]) groups[lv] = []; groups[lv].push(id); }
        for (const [lv, ids] of Object.entries(groups)) {
            ids.forEach((id, i) => { const n = this.nodes.find(x => x.id === id); if (n) { n.x = 60 + parseInt(lv) * 280; n.y = 60 + i * 140; } });
        }
        this._renderAllNodes(); this.drawConnections();
        UI.toast('已自动排列');
    },

    clearCanvas() {
        if (this.nodes.length > 0 && !confirm('确定清空画布？')) return;
        this.nodes = []; this.connections = [];
        this._renderAllNodes(); this.drawConnections();
        this._refreshCommandCenter?.();
    },

    addPresetWorkflow(preset) {
        if (!preset) return;
        this.nodes = []; this.connections = [];

        const _n = (type, x, y, data) => {
            const def = this._nodeTypes[type];
            const node = { id: 'n_' + Date.now() + '_' + Math.random().toString(36).slice(2,5), type, x, y, data: { prompt: '', label: def?.name || type, ...(def?.params || {}), ...data }, _result: '' };
            this.nodes.push(node);
            return node;
        };
        const _c = (from, to, fp, tp) => this.connections.push({ from: from.id, fromPort: fp || 'out_0', to: to.id, toPort: tp || 'in_0' });

        const presets = {
            // 1. 基础生成
            basic_gen: () => {
                const a = _n('input', 60, 120, { label:'输入文本' });
                const b = _n('llm', 360, 120, { label:'AI生成', prompt:'请根据以下内容生成高质量文本：' });
                const c = _n('output', 660, 120, { label:'输出结果' });
                _c(a,b); _c(b,c);
            },
            // 2. 润色链
            polish_chain: () => {
                const a = _n('input', 60, 120, { label:'原始文本' });
                const b = _n('polish', 340, 120, { label:'AI润色', prompt:'请润色以下文本，大幅提升文笔质量：' });
                const c = _n('output', 620, 120, { label:'最终结果' });
                _c(a,b); _c(b,c);
            },
            // 3. RAG生成
            rag_gen: () => {
                const a = _n('input', 60, 120, { label:'创作主题' });
                const b = _n('rag_node', 340, 120, { label:'RAG检索', query:'', limit:10 });
                const c = _n('llm', 620, 120, { label:'上下文生成', prompt:'请参考以下检索到的上下文资料，生成高质量内容：' });
                const d = _n('output', 900, 120, { label:'输出' });
                _c(a,b); _c(b,c); _c(c,d);
            },
            // 4. 循环精炼
            loop_refine: () => {
                const a = _n('input', 60, 150, { label:'待优化文本' });
                const b = _n('rewrite', 320, 150, { label:'结构重写', prompt:'请先重写文本结构，保留核心含义，提升可读性：' });
                const c = _n('loop', 580, 150, { label:'两轮精修', count:2, prompt:'请继续压实细节、删掉空话、强化人物动作和场景质感' });
                const d = _n('polish', 840, 150, { label:'最终润色', prompt:'请做最后一轮语言润色，保持自然，不要AI腔：' });
                const e = _n('output', 1100, 150, { label:'精修结果' });
                _c(a,b); _c(b,c); _c(c,d); _c(d,e);
            },
            // 5. 双语翻译对比
            translate_compare: () => {
                const a = _n('input', 60, 150, { label:'原文' });
                const b = _n('translate', 340, 60, { label:'直译版', prompt:'请忠实翻译以下内容，保留原意和信息密度：' });
                const c = _n('rewrite', 340, 250, { label:'本地化改写', prompt:'请将以下内容改写成目标语言读者更自然接受的表达，保留核心含义：' });
                const d = _n('parallel', 620, 150, { label:'双版本汇合' });
                const e = _n('llm', 900, 150, { label:'差异评审', prompt:'请对比两个版本，指出直译、本地化表达的优劣，并给出推荐终稿：' });
                const f = _n('output', 1180, 150, { label:'对比终稿' });
                _c(a,b); _c(a,c); _c(b,d,'out_0','in_0'); _c(c,d,'out_0','in_1'); _c(d,e); _c(e,f);
            },
            // 6. 分流融合
            split_merge: () => {
                const a = _n('input', 60, 170, { label:'项目材料' });
                const b = _n('summary', 320, 70, { label:'提炼主线', prompt:'请从材料中提炼主线、核心冲突和关键节点：' });
                const c = _n('extract', 320, 270, { label:'提取资产', prompt:'请提取人物、地点、规则、伏笔、可复用设定：' });
                const d = _n('parallel', 600, 170, { label:'资产汇合' });
                const e = _n('llm', 880, 170, { label:'融合方案', prompt:'请把主线与资产融合成一个可执行创作方案，输出下一步写作清单：' });
                const f = _n('output', 1160, 170, { label:'融合结果' });
                _c(a,b); _c(a,c); _c(b,d,'out_0','in_0'); _c(c,d,'out_0','in_1'); _c(d,e); _c(e,f);
            },
            // 4. 智能体对话流
            agent_chat_flow: () => {
                const a = _n('input', 60, 140, { label:'用户问题' });
                const b = _n('agent_node', 360, 140, { label:'智能体处理' });
                const c = _n('output', 660, 140, { label:'最终回复' });
                _c(a,b); _c(b,c);
            },
            // 5. 大纲转章节
            outline_to_chapter: () => {
                const a = _n('input', 60, 120, { label:'故事大纲' });
                const b = _n('llm', 320, 120, { label:'细化大纲', prompt:'请将以下粗略大纲细化为详细的章节大纲，包含每章的核心事件、人物、冲突：' });
                const c = _n('expand', 580, 120, { label:'扩写章节', prompt:'请根据以下章节大纲扩写为完整的章节正文(2000字以上)：' });
                const d = _n('polish', 840, 120, { label:'润色' });
                const e = _n('output', 1100, 120, { label:'成品章节' });
                _c(a,b); _c(b,c); _c(c,d); _c(d,e);
            },
            // 8. 角色构建器
            character_builder: () => {
                const a = _n('input', 60, 170, { label:'角色种子' });
                const b = _n('llm', 320, 70, { label:'人物欲望', prompt:'请生成角色的核心欲望、恐惧、误信念和底层缺口：' });
                const c = _n('llm', 320, 270, { label:'外在表现', prompt:'请生成角色的外貌、习惯动作、说话方式、社交策略和日常物件：' });
                const d = _n('parallel', 600, 170, { label:'角色汇合' });
                const e = _n('llm', 880, 170, { label:'角色卡成稿', prompt:'请整合为可直接写作的角色卡，包含状态机、关系张力、出场场景和禁写误区：' });
                const f = _n('output', 1160, 170, { label:'角色卡' });
                _c(a,b); _c(a,c); _c(b,d,'out_0','in_0'); _c(c,d,'out_0','in_1'); _c(d,e); _c(e,f);
            },
            // 9. 完整流水线
            full_pipeline: () => {
                const a = _n('input', 60, 180, { label:'创作主题' });
                const b = _n('rag_node', 320, 180, { label:'RAG检索灵感' });
                const c = _n('llm', 580, 60, { label:'生成大纲', prompt:'请根据以下主题和参考资料，生成一个精彩的故事大纲：' });
                const d = _n('expand', 840, 60, { label:'扩写正文', prompt:'请将以下大纲扩写为完整的故事正文(3000字以上)：' });
                const e = _n('condition', 580, 300, { label:'质量检查', prompt:'文本质量是否达到发表标准' });
                const f = _n('loop', 840, 300, { label:'迭代优化', count:2, prompt:'请进一步优化文笔和情节张力' });
                const g = _n('polish', 1100, 180, { label:'最终润色' });
                const h = _n('output', 1360, 180, { label:'成品' });
                _c(a,b); _c(b,c); _c(c,d); _c(d,e); _c(e,g); _c(e,f,'out_1','in_0'); _c(f,g); _c(g,h);
            }
        };

        if (presets[preset]) {
            presets[preset]();
            this._renderAllNodes();
            this.drawConnections();
            this._refreshCommandCenter?.();
            UI.toast('模板已放到画布，填写输入后点运行。');
        }
    },

    // ═══════════════════════════════════════════
    // 智能体管理
    // ═══════════════════════════════════════════
    async _getAgents() {
        const store = await DB.get('settings', 'tc_agents');
        return (store && store.items) ? store.items : [];
    },

    async createAgent() {
        const name = document.getElementById('tc-agent-name')?.value;
        const desc = document.getElementById('tc-agent-desc')?.value || '';
        const prompt = document.getElementById('tc-agent-prompt')?.value;
        const model = document.getElementById('tc-agent-model')?.value || '';
        if (!name || !prompt) return UI.toast('请填写名称和提示词');
        const agent = { id: 'agent_' + Date.now(), name, desc, prompt, model, icon: 'fa-solid fa-robot', ts: Date.now() };
        const store = await DB.get('settings', 'tc_agents') || { id: 'tc_agents', items: [] };
        store.items.push(agent);
        await DB.put('settings', store);
        UI.toast('智能体已部署: ' + name);
        ['tc-agent-name','tc-agent-desc','tc-agent-prompt','tc-agent-model'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        this.loadAgentList();
    },

    async delAgent(id) {
        if (!confirm('确定删除此智能体？')) return;
        const store = await DB.get('settings', 'tc_agents') || { id: 'tc_agents', items: [] };
        store.items = store.items.filter(a => a.id !== id);
        await DB.put('settings', store);
        UI.toast('已删除');
        this.loadAgentList();
    },

    async loadAgentList() {
        const agents = await this._getAgents();
        const el = document.getElementById('tc-agent-list');
        if (!el) return;
        el.innerHTML = agents.length === 0 ? '<div class="text-[9px] text-dim">暂无智能体</div>' :
            agents.map(a => `
                <div class="flex items-center gap-2 px-2 py-1.5 rounded bg-white/5 hover:bg-blue-500/10 cursor-pointer group transition-all" onclick="Modules.tools_center.chatWithAgent('${a.id}')">
                    <i class="fa-solid fa-robot text-blue-400 text-xs"></i>
                    <div class="flex-1 min-w-0">
                        <div class="text-[10px] font-bold text-white truncate">${a.name}</div>
                        <div class="text-[9px] text-dim truncate">${a.model ? '⚙️'+a.model+' ' : ''}${(a.desc||'').slice(0,30)}</div>
                    </div>
                    <button class="opacity-0 group-hover:opacity-100 text-dim hover:text-red-400" onclick="event.stopPropagation();Modules.tools_center.delAgent('${a.id}')"><i class="fa-solid fa-xmark text-[8px]"></i></button>
                </div>
            `).join('');
    },

    async _loadAgentWorkflowOptions() {
        const sel = document.getElementById('tc-agent-workflow');
        if (!sel) return;
        const wfs = await this._getSavedWorkflows();
        sel.innerHTML = '<option value="">绑定工作流(可选)</option>' + wfs.map(w => `<option value="${w.id}">${w.name}</option>`).join('');
    },

    // ═══════════════════════════════════════════
    // 智能体对话 (工具中心内)
    // ═══════════════════════════════════════════
    async chatWithAgent(agentId) {
        const agents = await this._getAgents();
        const agent = agents.find(a => a.id === agentId);
        if (!agent) return UI.toast('智能体不存在');

        // 如果正在生成中，只更新右侧详情面板，不切换对话
        if (this._agentGenerating) {
            const detail = document.getElementById('tc-agent-detail');
            if (detail) detail.innerHTML = `
                <div class="space-y-3">
                    <div class="text-center">
                        <div class="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex center text-blue-400 text-xl mx-auto mb-2"><i class="fa-solid fa-robot"></i></div>
                        <div class="font-bold text-white text-sm">${agent.name}</div>
                    </div>
                    <div class="text-[10px] text-amber-400 bg-amber-500/10 rounded-lg p-2 border border-amber-500/20 text-center"><i class="fa-solid fa-circle-notch fa-spin mr-1"></i>当前有智能体正在回复中，请等待完成后再切换</div>
                    <div class="text-[10px] text-dim bg-white/5 rounded-lg p-2 border border-white/5 max-h-40 overflow-y-auto">${agent.prompt.slice(0,500)}</div>
                </div>`;
            return;
        }

        // 保存当前智能体的对话到缓存
        if (this.agentChatId) {
            this._agentChatCache[this.agentChatId] = [...this.agentChatLog];
            this._saveAgentChats();
        }

        this.agentChatId = agentId;
        // 恢复目标智能体的对话缓存，如果没有则新建
        this.agentChatLog = this._agentChatCache[agentId] ? [...this._agentChatCache[agentId]] : [];

        const title = document.getElementById('tc-agent-chat-title');
        if (title) title.innerHTML = `<i class="${agent.icon || 'fa-solid fa-robot'} mr-1"></i>${agent.name}`;
        const detail = document.getElementById('tc-agent-detail');
        if (detail) detail.innerHTML = `
            <div class="space-y-3">
                <div class="text-center">
                    <div class="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex center text-blue-400 text-xl mx-auto mb-2"><i class="fa-solid fa-robot"></i></div>
                    <div class="font-bold text-white text-sm">${agent.name}</div>
                    ${agent.model ? '<div class="text-[9px] text-indigo-400 mt-1">⚙️ '+agent.model+'</div>' : ''}
                </div>
                ${agent.desc ? '<div class="text-[10px] text-dim bg-white/5 rounded-lg p-2 border border-white/5">'+agent.desc+'</div>' : ''}
                <div class="text-[10px] text-dim bg-white/5 rounded-lg p-2 border border-white/5 max-h-40 overflow-y-auto">${agent.prompt.slice(0,500)}</div>
            </div>`;
        const log = document.getElementById('tc-agent-chat-log');
        if (log) {
            if (this.agentChatLog.length > 0) {
                log.innerHTML = this.agentChatLog.map(m => this._renderChatMsg(m)).join('');
                log.scrollTop = log.scrollHeight;
            } else {
                log.innerHTML = `<div class="text-center text-dim text-xs py-4"><i class="${agent.icon || 'fa-solid fa-robot'} text-2xl text-blue-400/20 block mb-2"></i>开始与 ${agent.name} 对话</div>`;
            }
        }
    },

    async sendAgentChat() {
        if (!this.agentChatId) return UI.toast('请先选择智能体');
        if (this._agentGenerating) return UI.toast('正在回复中，请等待...');
        const input = document.getElementById('tc-agent-chat-input');
        const msg = input?.value?.trim();
        if (!msg) return;
        input.value = '';
        const agents = await this._getAgents();
        const agent = agents.find(a => a.id === this.agentChatId);
        if (!agent) return;
        this.agentChatLog.push({ role: 'user', content: msg });
        const log = document.getElementById('tc-agent-chat-log');
        if (log) log.innerHTML = this.agentChatLog.map(m => this._renderChatMsg(m)).join('');
        const history = this.agentChatLog.filter(m => m.role !== 'system').slice(-10).map(m => `${m.role === 'user' ? '用户' : '助手'}：${m.content}`).join('\n');
        const prompt = `${agent.prompt}\n\n对话历史：\n${history}\n\n请回复用户最新消息：`;
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
                    log.innerHTML = this.agentChatLog.map(m => this._renderChatMsg(m)).join('');
                    log.scrollTop = log.scrollHeight;
                }
            });
        } catch(e) {
            this.agentChatLog[this.agentChatLog.length - 1].content = res || '生成失败: ' + e.message;
        }
        this._agentGenerating = false;
        // 保存到缓存
        this._agentChatCache[currentAgentId] = [...this.agentChatLog];
        this._saveAgentChats();
    },

    // ═══════════════════════════════════════════
    // 批量 & IO
    // ═══════════════════════════════════════════
    toggleBatchMode() {
        UI.toast('批量模式：请在IO面板中输入多行数据，每行作为一次工作流输入');
        document.getElementById('tc-global-io')?.classList.remove('hidden');
    },

    logIO(input, output) {
        const ioIn = document.getElementById('tc-io-in');
        const ioOut = document.getElementById('tc-io-out');
        if (ioIn) ioIn.value = input || '';
        if (ioOut) ioOut.value = output || '';
    },

    clearAgentChat() {
        if (!this.agentChatId) return UI.toast('请先选择智能体');
        if (this._agentGenerating) return UI.toast('正在回复中，请等待...');
        this.agentChatLog = [];
        this._agentChatCache[this.agentChatId] = [];
        this._saveAgentChats();
        const log = document.getElementById('tc-agent-chat-log');
        if (log) log.innerHTML = '<div class="text-center text-dim text-xs py-4"><i class="fa-solid fa-check-circle mr-1 text-green-400"></i>对话已清除</div>';
        UI.toast('对话已清除');
    }
});
