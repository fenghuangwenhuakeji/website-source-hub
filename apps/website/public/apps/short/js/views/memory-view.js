/**
 * 记忆系统视图 v1.0
 * 三层记忆可视化管理：工作记忆 / 会话记忆 / 长期记忆 + RAG + 知识图谱
 * 按来源分类绑定各导航模块
 */
var memoryView = {
    _currentTab: 'working',
    _searchQuery: '',
    _sourceFilter: '',
    _typeFilter: '',

    // ========== 刷新仪表盘 ==========
    refresh: function() {
        this._updateDashboard();
        this._renderContent();
    },

    _updateDashboard: function() {
        // 工作记忆
        if (typeof memoryEngine !== 'undefined') {
            var ws = memoryEngine.working.getStats();
            var el1 = document.getElementById('mem-working-count');
            if (el1) el1.textContent = ws.count;
            var bar1 = document.getElementById('mem-working-bar');
            if (bar1) bar1.style.width = ws.usage + '%';

            // 会话记忆
            var ss = memoryEngine.session.getStats();
            var el2 = document.getElementById('mem-session-count');
            if (el2) el2.textContent = ss.count;
            var bar2 = document.getElementById('mem-session-bar');
            if (bar2) bar2.style.width = Math.min(100, ss.count * 5) + '%';

            // RAG
            var rs = memoryEngine.rag.getStats();
            var el4 = document.getElementById('mem-rag-count');
            if (el4) el4.textContent = rs.documentCount;
            var bar4 = document.getElementById('mem-rag-bar');
            if (bar4) bar4.style.width = Math.min(100, rs.documentCount * 2) + '%';
        }

        // 长期记忆
        if (typeof memoryEngine !== 'undefined') {
            memoryEngine.persistent.getStats().then(function(ps) {
                var el3 = document.getElementById('mem-persistent-count');
                if (el3) el3.textContent = ps.count;
                var bar3 = document.getElementById('mem-persistent-bar');
                if (bar3) bar3.style.width = Math.min(100, ps.count * 5) + '%';
            });
        }

        // 知识图谱
        if (typeof knowledgeGraph !== 'undefined') {
            var ks = knowledgeGraph.getStats();
            var el5 = document.getElementById('mem-kg-count');
            if (el5) el5.textContent = ks.entityCount || 0;
            var bar5 = document.getElementById('mem-kg-bar');
            if (bar5) bar5.style.width = Math.min(100, (ks.entityCount || 0) * 3) + '%';
        }
    },

    // ========== 标签页切换 ==========
    switchTab: function(tab) {
        this._currentTab = tab;
        var tabs = document.querySelectorAll('.mem-tab');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].classList.toggle('active', tabs[i].dataset.layer === tab);
        }
        this._renderContent();
    },

    // ========== 搜索与过滤 ==========
    search: function(query) {
        this._searchQuery = query.toLowerCase();
        this._renderContent();
    },
    filterBySource: function(source) {
        this._sourceFilter = source;
        this._renderContent();
    },
    filterByType: function(type) {
        this._typeFilter = type;
        this._renderContent();
    },

    // ========== 渲染内容 ==========
    _renderContent: function() {
        var container = document.getElementById('mem-content');
        if (!container) return;
        var tab = this._currentTab;
        if (tab === 'working') this._renderWorking(container);
        else if (tab === 'session') this._renderSession(container);
        else if (tab === 'persistent') this._renderPersistent(container);
        else if (tab === 'rag') this._renderRAG(container);
        else if (tab === 'kg') this._renderKG(container);
    },

    _filterItems: function(items) {
        var self = this;
        return items.filter(function(item) {
            if (self._searchQuery) {
                var content = (item.content || '').toLowerCase();
                var tags = (item.tags || []).join(' ').toLowerCase();
                if (content.indexOf(self._searchQuery) === -1 && tags.indexOf(self._searchQuery) === -1) return false;
            }
            if (self._sourceFilter) {
                var tags2 = item.tags || [];
                var meta = item.metadata || {};
                var source = meta.source || '';
                if (tags2.indexOf(self._sourceFilter) === -1 && source !== self._sourceFilter) {
                    // 也检查 contentType 映射
                    if (tags2.indexOf('fusion') === -1 && tags2.indexOf('pipeline') === -1 &&
                        tags2.indexOf('writer') === -1 && tags2.indexOf('technique') === -1 &&
                        source.indexOf(self._sourceFilter) === -1) return false;
                }
            }
            if (self._typeFilter && item.contentType !== self._typeFilter) return false;
            return true;
        });
    },

    _renderWorking: function(container) {
        if (typeof memoryEngine === 'undefined') { container.innerHTML = this._emptyHtml('记忆引擎未加载'); return; }
        var items = memoryEngine.working.items.slice().reverse();
        items = this._filterItems(items);
        if (items.length === 0) { container.innerHTML = this._emptyHtml('工作记忆为空', '⚡'); return; }
        container.innerHTML = items.map(function(item, idx) {
            return memoryView._renderItem(item, 'working', idx);
        }).join('');
    },

    _renderSession: function(container) {
        if (typeof memoryEngine === 'undefined') { container.innerHTML = this._emptyHtml('记忆引擎未加载'); return; }
        var session = memoryEngine.session.getCurrent();
        var items = session.items.slice().reverse();
        items = this._filterItems(items);
        var summaryHtml = '';
        if (session.summary) {
            summaryHtml = '<div class="mem-item" style="border-left:3px solid #58a6ff;"><div class="mem-item-header"><span class="mem-item-type instruction">摘要</span></div><div class="mem-item-content">' + _escapeHtml(session.summary) + '</div></div>';
        }
        if (items.length === 0 && !session.summary) { container.innerHTML = this._emptyHtml('会话记忆为空', '💬'); return; }
        container.innerHTML = summaryHtml + items.map(function(item, idx) {
            return memoryView._renderItem(item, 'session', idx);
        }).join('');
    },

    _renderPersistent: function(container) {
        if (typeof memoryEngine === 'undefined') { container.innerHTML = this._emptyHtml('记忆引擎未加载'); return; }
        container.innerHTML = '<div class="mem-empty"><div class="mem-empty-icon">⏳</div>加载中...</div>';
        var self = this;
        memoryEngine.persistent.getAll().then(function(items) {
            items = items.sort(function(a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
            items = self._filterItems(items);
            if (items.length === 0) { container.innerHTML = self._emptyHtml('长期记忆为空', '💾'); return; }
            container.innerHTML = items.map(function(item, idx) {
                return self._renderItem(item, 'persistent', idx);
            }).join('');
        });
    },

    _renderRAG: function(container) {
        if (typeof memoryEngine === 'undefined') { container.innerHTML = this._emptyHtml('记忆引擎未加载'); return; }
        var docs = memoryEngine.rag.documents.slice().reverse();
        if (docs.length === 0) { container.innerHTML = this._emptyHtml('RAG索引为空，点击「重建RAG」从图书馆导入', '🔍'); return; }
        container.innerHTML = docs.slice(0, 100).map(function(doc, idx) {
            var meta = doc.metadata || {};
            var title = meta.bookTitle || '文档';
            var chunk = meta.chunkIndex !== undefined ? ' #' + meta.chunkIndex : '';
            return '<div class="mem-item"><div class="mem-item-header">' +
                '<span class="mem-item-type result">RAG</span>' +
                '<span class="mem-item-source">' + _escapeHtml(title) + chunk + '</span>' +
                '<span class="mem-item-time">' + (doc.content.length) + '字</span></div>' +
                '<div class="mem-item-content">' + _escapeHtml(doc.content.substring(0, 300)) + '</div></div>';
        }).join('');
    },

    _renderKG: function(container) {
        if (typeof knowledgeGraph === 'undefined') { container.innerHTML = this._emptyHtml('知识图谱未加载'); return; }
        var entities = knowledgeGraph.getImportantEntities(50);
        if (entities.length === 0) { container.innerHTML = this._emptyHtml('知识图谱为空，拆解或对话后自动提取', '🕸️'); return; }
        var html = '<div class="mem-kg-grid">';
        for (var i = 0; i < entities.length; i++) {
            var e = entities[i];
            html += '<span class="kg-entity-tag ' + (e.type || '') + '" title="' + _escapeHtml(e.type || '') + ' | 提及' + (e.mentionCount || 0) + '次 | 重要度' + Math.round((e.importance || 0) * 100) + '%">' + _escapeHtml(e.name) + '</span>';
        }
        html += '</div>';
        // 关系列表
        var relations = [];
        for (var j = 0; j < Math.min(entities.length, 10); j++) {
            var rels = knowledgeGraph.getEntityRelations(entities[j].id);
            for (var k = 0; k < rels.length; k++) relations.push(rels[k]);
        }
        if (relations.length > 0) {
            html += '<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);">';
            html += '<div style="font-size:11px;color:var(--text-tertiary);margin-bottom:8px;font-weight:600;">关系网络</div>';
            var seen = {};
            for (var r = 0; r < Math.min(relations.length, 30); r++) {
                var rel = relations[r];
                var key = (rel.sourceName || '') + rel.type + (rel.targetName || '');
                if (seen[key]) continue;
                seen[key] = true;
                html += '<div style="font-size:11px;color:var(--text-secondary);padding:2px 0;">' +
                    '<span style="color:#f87171;">' + _escapeHtml(rel.sourceName || '?') + '</span>' +
                    ' <span style="color:var(--text-tertiary);">—' + _escapeHtml(rel.type || '关联') + '→</span> ' +
                    '<span style="color:#58a6ff;">' + _escapeHtml(rel.targetName || '?') + '</span></div>';
            }
            html += '</div>';
        }
        container.innerHTML = html;
    },

    // ========== 渲染单个记忆项 ==========
    _renderItem: function(item, layer, idx) {
        var type = item.contentType || 'conversation';
        var typeLabels = { writing: '写作', instruction: '指令', result: '结果', code: '代码', error: '错误', conversation: '对话', summary: '摘要' };
        var priority = item.priority || 'medium';
        var priorityLabels = { critical: '🔴 关键', high: '🟡 高', medium: '中', low: '低', trivial: '低' };
        var tags = item.tags || [];
        var sourceTag = '';
        var sourceMap = { fusion: '📖拆书', writing: '✍️写作', pipeline: '🚀流水线', market: '📊市场分析', chat: '💬对话', writer: '✍️写作', technique: '📋技法' };
        for (var i = 0; i < tags.length; i++) {
            if (sourceMap[tags[i]]) { sourceTag = sourceMap[tags[i]]; break; }
        }
        if (!sourceTag && item.metadata && item.metadata.source) sourceTag = sourceMap[item.metadata.source] || item.metadata.source;
        var time = item.createdAt ? new Date(item.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
        var content = item.compressed && item.summary ? item.summary : (item.content || '');
        var importance = typeof item.importance === 'number' ? Math.round(item.importance * 100) + '%' : '';

        return '<div class="mem-item">' +
            '<div class="mem-item-header">' +
            '<span class="mem-item-type ' + type + '">' + (typeLabels[type] || type) + '</span>' +
            (sourceTag ? '<span class="mem-item-source">' + sourceTag + '</span>' : '') +
            (item.compressed ? '<span class="mem-item-source">📦 已压缩</span>' : '') +
            '<span class="mem-item-priority ' + priority + '">' + (priorityLabels[priority] || '') + '</span>' +
            (importance ? '<span class="mem-item-time">重要度 ' + importance + '</span>' : '') +
            '<span class="mem-item-time">' + time + '</span>' +
            '</div>' +
            '<div class="mem-item-content" onclick="this.classList.toggle(\'expanded\')">' + _escapeHtml(content.substring(0, 800)) + (content.length > 800 ? '\n...(点击展开)' : '') + '</div>' +
            (tags.length > 0 ? '<div class="mem-item-tags">' + tags.map(function(t) { return '<span class="mem-item-tag">' + _escapeHtml(t) + '</span>'; }).join('') + '</div>' : '') +
            '<div class="mem-item-actions">' +
            '<button class="mem-item-btn" onclick="memoryView.copyItem(\'' + (item.id || idx) + '\',\'' + layer + '\')">📋 复制</button>' +
            '<button class="mem-item-btn" onclick="memoryView.promoteItem(\'' + (item.id || idx) + '\',\'' + layer + '\')">⬆️ 升级</button>' +
            '<button class="mem-item-btn danger" onclick="memoryView.deleteItem(\'' + (item.id || idx) + '\',\'' + layer + '\')">🗑️ 删除</button>' +
            '</div></div>';
    },

    _emptyHtml: function(msg, icon) {
        return '<div class="mem-empty"><div class="mem-empty-icon">' + (icon || '📭') + '</div>' + _escapeHtml(msg) + '</div>';
    },

    // ========== 操作 ==========
    copyItem: function(id, layer) {
        var item = this._findItem(id, layer);
        if (item) copyToClipboard(item.content || '');
    },

    promoteItem: function(id, layer) {
        var item = this._findItem(id, layer);
        if (!item) return;
        if (layer === 'working') {
            // 工作记忆 → 长期记忆
            memoryEngine.persistent.store(item.content, item.contentType || 'general', item.importance || 0.5, item.tags || [], item.metadata || {});
            showNotification('已升级到长期记忆', 'success');
        } else if (layer === 'session') {
            // 会话记忆 → 工作记忆
            memoryEngine.working.add(item.content, item.priority || 'medium', item.contentType || 'conversation', item.tags || []);
            showNotification('已升级到工作记忆', 'success');
        }
        this.refresh();
    },

    deleteItem: function(id, layer) {
        if (!confirm('确定删除此记忆？')) return;
        if (layer === 'working') {
            memoryEngine.working.items = memoryEngine.working.items.filter(function(i) { return i.id !== id; });
        } else if (layer === 'session') {
            var session = memoryEngine.session.getCurrent();
            session.items = session.items.filter(function(i) { return i.id !== id; });
        } else if (layer === 'persistent') {
            memoryEngine.persistent.remove(id);
        }
        this.refresh();
        showNotification('已删除', 'success');
    },

    _findItem: function(id, layer) {
        if (layer === 'working') return memoryEngine.working.items.find(function(i) { return i.id === id; });
        if (layer === 'session') return memoryEngine.session.getCurrent().items.find(function(i) { return i.id === id; });
        return null;
    },

    // ========== 全局操作 ==========
    reindexRAG: function() {
        if (typeof memoryEngine === 'undefined') return;
        memoryEngine.rag.clear();
        memoryEngine.rag.indexFromLibrary(libraryManager.books || []);
        this.refresh();
        showNotification('RAG已重建，索引 ' + (libraryManager.books || []).length + ' 本书', 'success');
    },

    clearAll: function() {
        if (!confirm('确定清空所有记忆数据？此操作不可恢复。')) return;
        if (typeof memoryEngine !== 'undefined') {
            memoryEngine.working.clear();
            memoryEngine.session.create();
            memoryEngine.rag.clear();
        }
        if (typeof knowledgeGraph !== 'undefined') knowledgeGraph.clear();
        this.refresh();
        showNotification('所有记忆已清空', 'success');
    },

    // ========== 外部调用：从各模块存入记忆 ==========
    storeFromModule: function(content, source, priority, contentType, tags) {
        if (typeof memoryEngine === 'undefined' || !content) return;
        var allTags = (tags || []).slice();
        if (source && allTags.indexOf(source) === -1) allTags.push(source);
        memoryEngine.working.add(content.substring(0, 3000), priority || 'medium', contentType || 'writing', allTags);
        // 重要内容同时存长期记忆
        if (priority === 'high' || priority === 'critical') {
            memoryEngine.persistent.store(content.substring(0, 5000), contentType || 'writing', priority === 'critical' ? 0.9 : 0.7, allTags, { source: source });
        }
    }
};
