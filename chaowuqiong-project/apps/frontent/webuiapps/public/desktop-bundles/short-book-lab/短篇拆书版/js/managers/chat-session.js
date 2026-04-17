/**
 * 聊天会话管理器 - 集成三层记忆系统
 */
const chatManager = {
    sessions: {
        fusion: { messages: [], contextCount: 0, mode: 'continue', selectedBooks: [], selectedPrompts: [], totalTokens: 0, compressedSummary: '' },
        writing: { messages: [], contextCount: 0, mode: 'continue', selectedBooks: [], selectedPrompts: [], totalTokens: 0, compressedSummary: '' }
    },

    getSession(type) { return this.sessions[type]; },

    addMessage(type, role, content) {
        this.sessions[type].messages.push({ role, content, timestamp: new Date().toISOString() });
        this.updateStats(type);

        // 同步到三层记忆
        if (typeof memoryEngine !== 'undefined') {
            memoryEngine.working.add(
                `[${role}] ${content.substring(0, 500)}`,
                role === 'user' ? 'medium' : 'high',
                'conversation',
                [type, role]
            );
            memoryEngine.session.add(
                `[${type}:${role}] ${content.substring(0, 300)}`,
                [type, role],
                'conversation'
            );
        }
    },

    clearSession(type) {
        // 压缩旧会话到记忆再清空
        if (typeof memoryEngine !== 'undefined' && this.sessions[type].messages.length > 2) {
            const summary = this.sessions[type].messages.map(m =>
                `[${m.role}] ${m.content.substring(0, 100)}`
            ).join('\n');
            memoryEngine.session.add(
                `[会话归档:${type}] ${summary.substring(0, 500)}`,
                [type, 'archive'],
                'conversation'
            );
        }
        this.sessions[type] = { messages: [], contextCount: 0, mode: 'continue', selectedBooks: [], selectedPrompts: [], totalTokens: 0, compressedSummary: '' };
        this.updateStats(type);
    },

    updateStats(type) {
        const session = this.sessions[type];
        const turnCount = Math.floor(session.messages.length / 2);
        const totalText = session.messages.map(m => m.content).join('');
        const tokenCount = estimateTokens(totalText);
        session.totalTokens = tokenCount;

        const el = (id) => document.getElementById(id);
        if (el(type + '-turn-count')) el(type + '-turn-count').textContent = turnCount;
        if (el(type + '-token-count')) el(type + '-token-count').textContent = tokenCount;
        if (el(type + '-library-count')) el(type + '-library-count').textContent = session.selectedBooks.length;

        // 记忆强度 = 综合三层记忆状态
        let memoryLevel = 100;
        if (typeof memoryEngine !== 'undefined') {
            const wmStats = memoryEngine.working.getStats();
            const wmUsage = wmStats.usage;
            const sessionCount = memoryEngine.session.getStats().count;
            memoryLevel = Math.max(0, Math.min(100,
                100 - wmUsage * 0.5 + Math.min(30, sessionCount * 2)
            ));
        } else {
            const maxTokens = 8000;
            memoryLevel = Math.max(0, Math.min(100, Math.round((1 - tokenCount / maxTokens) * 100)));
        }

        if (el(type + '-memory-level')) el(type + '-memory-level').textContent = memoryLevel + '%';

        const indicator = el(type + '-memory-indicator');
        if (indicator) {
            if (memoryLevel >= 70) { indicator.className = 'memory-indicator'; indicator.innerHTML = '🧠 三层记忆运行良好'; }
            else if (memoryLevel >= 40) { indicator.className = 'memory-indicator warning'; indicator.innerHTML = '⚠️ 工作记忆接近上限，自动压缩中'; }
            else { indicator.className = 'memory-indicator danger'; indicator.innerHTML = '🔴 记忆压力大，建议清理'; }
        }
    },

    async smartCompress(type) {
        const session = this.sessions[type];
        if (session.messages.length < 4) return null;

        // 先尝试用本地压缩
        if (typeof memoryEngine !== 'undefined') {
            memoryEngine.session.compressOld(3600000);
            memoryEngine.working._compress();
        }

        const allContent = session.messages.map(m => `[${m.role}]: ${m.content}`).join('\n\n');
        const compressPrompt = `请将以下对话历史压缩成简洁摘要，保留核心主题、人物设定、修改意见、创作方向（500字以内）：\n${allContent}`;
        try {
            const summary = await apiClient.call(compressPrompt);
            const recent = session.messages.slice(-4);
            session.compressedSummary = summary;
            session.messages = recent;

            // 存入长期记忆
            if (typeof memoryEngine !== 'undefined') {
                memoryEngine.persistent.store(summary, 'session_summary', 0.8, [type, 'compressed']);
                memoryEngine.session.add(`[压缩摘要] ${summary.substring(0, 300)}`, ['compressed', type], 'summary');
            }

            this.updateStats(type);
            return { summary, recent };
        } catch (e) { throw e; }
    }
};
