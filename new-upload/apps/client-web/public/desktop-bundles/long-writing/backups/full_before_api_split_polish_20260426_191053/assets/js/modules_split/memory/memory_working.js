/**
 * MemorySystem - 工作记忆模块
 */
Object.assign(MemorySystem, {
    // —— 工作记忆 (内存，刷新清空) ——
    addWorking(content, type = 'conversation', priority = 3, meta = {}) {
        const item = {
            id: 'wm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            content, type, priority, ts: Date.now(), accessCount: 0,
            tags: meta.tags || [], source: meta.source || '', linkedTo: meta.linkedTo || null,
            module: meta.module || '', chapterId: meta.chapterId || null,
            cycleId: meta.cycleId || null,
            nexusState: meta.nexusState || null  // { chr, wld, foe, emo }
        };
        this.working.push(item);
        if (this.working.length > this.maxWorking) this._compressWorking();
        // 自动分发到模块通道
        if (item.module) {
            if (!this._moduleChannels[item.module]) this._moduleChannels[item.module] = [];
            this._moduleChannels[item.module].push(item);
            if (this._moduleChannels[item.module].length > 30) this._moduleChannels[item.module] = this._moduleChannels[item.module].slice(-20);
        }
        // 自动分发到循环通道
        if (item.cycleId) {
            if (!this._cycleChannels[item.cycleId]) this._cycleChannels[item.cycleId] = [];
            this._cycleChannels[item.cycleId].push(item);
            if (this._cycleChannels[item.cycleId].length > 20) this._cycleChannels[item.cycleId] = this._cycleChannels[item.cycleId].slice(-15);
        }
        return item;
    },

    getWorkingContext(maxItems = 20) {
        return this.working
            .sort((a, b) => (b.priority + b.accessCount * 0.2) - (a.priority + a.accessCount * 0.2))
            .slice(0, maxItems).map(m => m.content).join('\n---\n');
    },

    // 按模块获取工作记忆上下文
    getModuleContext(moduleName, maxItems = 10) {
        const channel = this._moduleChannels[moduleName] || [];
        if (channel.length > 0) return channel.slice(-maxItems).map(m => m.content).join('\n---\n');
        return this.working.filter(m => m.module === moduleName || m.type === moduleName)
            .slice(-maxItems).map(m => m.content).join('\n---\n');
    },

    getWorkingByType(type) {
        return this.working.filter(m => m.type === type);
    },

    touchWorking(id) {
        const m = this.working.find(x => x.id === id);
        if (m) { m.accessCount++; m.lastAccess = Date.now(); }
    },

    removeWorking(id) {
        this.working = this.working.filter(m => m.id !== id);
    },

    clearWorking() { this.working = []; this._moduleChannels = {}; this._cycleChannels = {}; },

    _compressWorking() {
        this.working.sort((a, b) => (b.priority + b.accessCount * 0.1) - (a.priority + a.accessCount * 0.1));
        const keep = Math.floor(this.maxWorking * 0.6);
        const removed = this.working.splice(keep);
        if (removed.length > 0) {
            const summary = removed.map(m => m.content.slice(0, 80)).join('; ');
            this.addSession('auto_compress', '[自动压缩] ' + summary, ['auto', 'compress']);
            // ★ 高优先级记忆同步到RAG
            const highPriority = removed.filter(m => m.priority >= 4);
            for (const m of highPriority) {
                if (typeof RAGSystem !== 'undefined') {
                    RAGSystem.addDocument('记忆_' + m.id, m.content, 'memory', { nexusTags: m.nexusState, cycleId: m.cycleId, ts: m.ts });
                }
            }
        }
    },

    // AI 智能压缩工作记忆
    async aiCompressWorking() {
        if (this.working.length < 5) return null;
        const allText = this.working.map(m => `[${m.type}/P${m.priority}${m.module ? '/' + m.module : ''}] ${m.content}`).join('\n');
        let summary = '';
        try {
            await AI.generate(
                `你是记忆压缩引擎。将以下${this.working.length}条工作记忆压缩为一段精炼摘要（保留关键信息、人物、情节要点、模块来源），不超过600字：\n\n${allText}`,
                {}, c => { summary += c; }
            );
            if (summary.length > 20) {
                await this.addSession('ai_compress', summary, ['ai_compress']);
                const oldCount = this.working.length;
                this.working = [];
                this._moduleChannels = {};
                this.addWorking('[AI压缩摘要] ' + summary.slice(0, 300), 'compress', 5);
                return { compressed: oldCount, summary };
            }
        } catch (e) { console.warn('AI压缩失败:', e); }
        return null;
    },

    // —— 模块专用记忆方法 ——
    // 凤凰流专用：记录流水线步骤
    addPhoenixMemory(step, content, chapterId) {
        return this.addWorking(`[凤凰/${step}] ${content.slice(0, 300)}`, 'phoenix', 5, { module: 'phoenix', tags: ['phoenix', step], chapterId });
    },
    // 执笔台专用：记录写作上下文
    addWriterMemory(action, content, chapterId) {
        return this.addWorking(`[执笔/${action}] ${content.slice(0, 300)}`, 'writer', 4, { module: 'writer', tags: ['writer', action], chapterId });
    },
    // 世界引擎专用：记录实体和世界观变更
    addWorldMemory(entityType, content) {
        return this.addWorking(`[世界/${entityType}] ${content.slice(0, 300)}`, 'world', 4, { module: 'world', tags: ['world', entityType] });
    },
    // 拆书融合专用：记录拆解和融合结果
    addFusionMemory(step, content) {
        return this.addWorking(`[拆书/${step}] ${content.slice(0, 400)}`, 'fusion', 5, { module: 'fusion', tags: ['fusion', step] });
    },
    // NEXUS四状态机专用记忆
    addNexusMemory(type, content, cycleId = null) {
        const nexusMap = { chr: '角色', wld: '世界', foe: '伏笔', emo: '情绪' };
        const label = nexusMap[type] || type;
        return this.addWorking(`[NEXUS/${label}] ${content.slice(0, 400)}`, 'nexus', 5, {
            module: 'nexus', tags: ['nexus', type, cycleId].filter(Boolean),
            cycleId,
            nexusState: { [type]: content.slice(0, 200) }
        });
    },
    // 循环专用记忆
    addCycleMemory(cycleId, content, type = 'cycle_event', priority = 4) {
        return this.addWorking(`[循环/${cycleId}] ${content.slice(0, 400)}`, type, priority, {
            module: 'cycle', tags: ['cycle', cycleId, type],
            cycleId
        });
    },
    // 获取循环记忆上下文
    getCycleMemory(cycleId, maxItems = 10) {
        const channel = this._cycleChannels[cycleId] || [];
        return channel.slice(-maxItems).map(m => m.content).join('\n---\n');
    },
    // 构建NEXUS记忆上下文
    buildNexusMemoryContext(cycleId = null, maxItems = 8) {
        let ctx = '';
        const nexusItems = this.working.filter(m => m.nexusState && (!cycleId || m.cycleId === cycleId));
        if (nexusItems.length > 0) {
            const sorted = nexusItems.sort((a, b) => b.priority - a.priority).slice(0, maxItems);
            ctx += '=== NEXUS 状态机记忆 ===\n';
            for (const m of sorted) {
                const ns = m.nexusState || {};
                if (ns.chr) ctx += `[CHR] ${ns.chr}\n`;
                if (ns.wld) ctx += `[WLD] ${ns.wld}\n`;
                if (ns.foe) ctx += `[FOE] ${ns.foe}\n`;
                if (ns.emo) ctx += `[EMO] ${ns.emo}\n`;
            }
        }
        return ctx;
    },
    // 同步重要记忆到RAG向量库
    async syncToRAG(minPriority = 4) {
        const toSync = this.working.filter(m => m.priority >= minPriority);
        let count = 0;
        for (const m of toSync) {
            if (typeof RAGSystem !== 'undefined') {
                await RAGSystem.addDocument(
                    `记忆_${m.module || 'general'}_${m.id}`,
                    m.content,
                    'memory',
                    { nexusTags: m.nexusState, cycleId: m.cycleId, module: m.module, ts: m.ts }
                );
                count++;
            }
        }
        return count;
    },
    // 跨循环记忆提升：被多次引用的记忆升级为长期
    async _promoteCrossCycle(minAccess = 3) {
        const promoted = [];
        for (const item of this.working) {
            if (item.accessCount >= minAccess && item.priority >= 3) {
                await this.addPersistent(item.content, 'cross_cycle', Math.min(item.priority / 5, 1),
                    [...(item.tags || []), 'cross_cycle', 'auto_promote'],
                    { source: 'cross_cycle', module: item.module, cycleId: item.cycleId, nexusState: item.nexusState }
                );
                promoted.push(item.id);
            }
        }
        return promoted;
    },

    // 构建模块专用上下文窗口
    async buildModuleWindow(moduleName, query, maxTokens = 3000) {
        let ctx = '';
        let tokens = 0;
        // 1. 模块通道记忆
        const channelCtx = this.getModuleContext(moduleName, 8);
        if (channelCtx) { ctx += '[模块记忆]\n' + channelCtx + '\n\n'; tokens += Math.ceil(channelCtx.length / 2); }
        // 2. RAG检索
        if (query && typeof RAGSystem !== 'undefined' && tokens < maxTokens) {
            const ragCtx = await RAGSystem.buildContext(query, maxTokens - tokens, 'structured');
            if (ragCtx) { ctx += '[RAG上下文]\n' + ragCtx + '\n\n'; tokens += Math.ceil(ragCtx.length / 2); }
        }
        // 3. 长期记忆检索
        if (query && tokens < maxTokens) {
            const persistent = await this.searchPersistent(query, 5);
            if (persistent.length > 0) {
                const pmCtx = persistent.map(m => `[${m.category}] ${m.content.slice(0, 200)}`).join('\n');
                ctx += '[长期记忆]\n' + pmCtx + '\n\n';
            }
        }
        return ctx;
    }

});
