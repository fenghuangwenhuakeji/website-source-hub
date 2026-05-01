Object.assign(Modules.writer, {
    async loadTree() {
        const vols = (await DB.getAll('volumes') || []).sort((a,b) => (a.order||0) - (b.order||0));
        let chaps = (await DB.getAll('chapters') || []).sort((a,b) => (a.order||0) - (b.order||0));
        const list = document.getElementById('w-chap-list');
        if (!list) return;

        const search = (document.getElementById('w-tree-search')?.value || '').toLowerCase();
        if (search) {
            chaps = chaps.filter(c => (c.title || '').toLowerCase().includes(search));
        }
        const filter = this._treeFilter;
        if (filter !== 'all') {
            chaps = chaps.filter(c => (c.status || 'outline') === filter);
        }

        let html = '';
        const volCount = vols.length;
        let chapCount = 0;
        let totalWords = 0;
        let doneWords = 0;
        let doneChaps = 0;

        const statusEmoji = { outline: '🟡', draft: '🟠', done: '🟢', polished: '🔵' };
        const statusColor = { outline: 'text-yellow-400', draft: 'text-orange-400', done: 'text-green-400', polished: 'text-blue-400' };

        for (const v of vols) {
            const isVolActive = v.id === this.currentVolumeId;
            const volChaps = chaps.filter(c => c.volumeId === v.id);
            const volWords = volChaps.reduce((s, c) => s + (c.content || '').length, 0);
            const volDone = volChaps.filter(c => ['done','polished'].includes(c.status || '')).length;
            const volProgress = volChaps.length > 0 ? Math.round((volDone / volChaps.length) * 100) : 0;

            html += `<div class="px-2 py-1.5 rounded-lg mb-1 ${isVolActive ? 'bg-amber-500/10 border border-amber-500/20' : 'hover:bg-white/5'} cursor-pointer group" onclick="Modules.writer.selectVol('${v.id}')">
                <div class="flex items-center justify-between">
                    <span class="text-[10px] font-bold uppercase tracking-wider truncate ${isVolActive ? 'text-amber-400' : 'text-accent'}">
                        <i class="fa-solid fa-folder mr-1 ${isVolActive ? 'text-amber-400' : 'text-accent/50'}"></i>${this._esc(v.title)}
                    </span>
                    <div class="flex items-center gap-1 ${this._batchMode ? '' : 'hidden group-hover:flex'}">
                        <span class="text-[9px] text-dim font-mono">${volChaps.length}章</span>
                        <button class="text-dim hover:text-white text-[9px]" onclick="event.stopPropagation();Modules.writer.rename('vol','${v.id}','${this._esc(v.title)}')"><i class="fa-solid fa-pen"></i></button>
                        <button class="text-dim hover:text-red-400 text-[9px]" onclick="event.stopPropagation();Modules.writer.del('vol','${v.id}')"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </div>
                ${volChaps.length > 0 ? `<div class="flex items-center gap-1.5 mt-1">
                    <div class="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-accent to-green-400 transition-all" style="width:${volProgress}%"></div>
                    </div>
                    <span class="text-[8px] text-dim font-mono">${volProgress}%</span>
                </div>` : ''}
            </div>`;

            chapCount += volChaps.length;
            for (const c of volChaps) {
                const isActive = c.id === this.currentChapterId;
                const wordCount = (c.content || '').length;
                const targetWords = c.targetWords || 2500;
                const st = c.status || 'outline';
                totalWords += wordCount;
                if (['done','polished'].includes(st)) { doneWords += wordCount; doneChaps++; }

                html += `<div class="px-2 py-1 text-xs cursor-pointer rounded flex items-center gap-1.5 group transition-colors ${isActive ? 'bg-accent/10 text-accent font-bold' : 'text-dim hover:bg-white/5 hover:text-white'}" onclick="Modules.writer.load('${c.id}')">
                    ${this._batchMode ? `<input type="checkbox" class="accent-accent w-3 h-3" ${this._batchSelected.has(c.id) ? 'checked' : ''} onclick="event.stopPropagation();Modules.writer.toggleBatchSelect('${c.id}')">` : ''}
                    <span class="text-[10px] ${statusColor[st] || 'text-dim'}">${statusEmoji[st] || '🟡'}</span>
                    <span class="truncate flex-1">${this._esc(c.title)}</span>
                    <div class="flex items-center gap-1">
                        ${wordCount > 0 ? `<span class="text-[8px] ${wordCount >= targetWords ? 'text-green-400' : 'text-dim/50'} font-mono">${wordCount}</span>` : ''}
                        <div class="${this._batchMode ? '' : 'hidden group-hover:flex'} gap-1">
                            <button class="text-dim hover:text-white text-[9px]" onclick="event.stopPropagation();Modules.writer.rename('chap','${c.id}','${this._esc(c.title)}')"><i class="fa-solid fa-pen"></i></button>
                            <button class="text-dim hover:text-red-400 text-[9px]" onclick="event.stopPropagation();Modules.writer.del('chap','${c.id}')"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                    </div>
                </div>`;
            }
        }
        const orphans = chaps.filter(c => !c.volumeId || !vols.find(v => v.id === c.volumeId));
        if (orphans.length > 0) {
            html += `<div class="px-2 py-1.5 text-[10px] font-bold text-dim uppercase tracking-wider mt-2"><i class="fa-solid fa-folder-open mr-1"></i>未分卷</div>`;
            chapCount += orphans.length;
            for (const c of orphans) {
                const isActive = c.id === this.currentChapterId;
                const wordCount = (c.content || '').length;
                const st = c.status || 'outline';
                totalWords += wordCount;
                if (['done','polished'].includes(st)) { doneWords += wordCount; doneChaps++; }
                html += `<div class="px-2 py-1 text-xs cursor-pointer rounded flex items-center gap-1.5 group transition-colors ${isActive ? 'bg-accent/10 text-accent font-bold' : 'text-dim hover:bg-white/5 hover:text-white'}" onclick="Modules.writer.load('${c.id}')">
                    ${this._batchMode ? `<input type="checkbox" class="accent-accent w-3 h-3" ${this._batchSelected.has(c.id) ? 'checked' : ''} onclick="event.stopPropagation();Modules.writer.toggleBatchSelect('${c.id}')">` : ''}
                    <span class="text-[10px] ${statusColor[st] || 'text-dim'}">${statusEmoji[st] || '🟡'}</span>
                    <span class="truncate flex-1">${this._esc(c.title)}</span>
                    <div class="flex items-center gap-1">
                        ${wordCount > 0 ? `<span class="text-[8px] text-dim/50 font-mono">${wordCount}</span>` : ''}
                        <div class="${this._batchMode ? '' : 'hidden group-hover:flex'} gap-1">
                            <button class="text-dim hover:text-white text-[9px]" onclick="event.stopPropagation();Modules.writer.rename('chap','${c.id}','${this._esc(c.title)}')"><i class="fa-solid fa-pen"></i></button>
                            <button class="text-dim hover:text-red-400 text-[9px]" onclick="event.stopPropagation();Modules.writer.del('chap','${c.id}')"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                    </div>
                </div>`;
            }
        }
        list.innerHTML = html;
        const vc = document.getElementById('w-vol-count'); if(vc) vc.textContent = volCount;
        const cc = document.getElementById('w-chap-count'); if(cc) cc.textContent = chapCount;
        const tw = document.getElementById('w-total-words'); if(tw) tw.textContent = (totalWords / 10000).toFixed(1);
        const gp = document.getElementById('w-global-progress'); if(gp) gp.style.width = (chapCount > 0 ? Math.round((doneChaps / chapCount) * 100) : 0) + '%';
    },
    _esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; },

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

    async saveStatus() {
        if (!this.currentChapterId) return;
        const chap = await DB.get('chapters', this.currentChapterId);
        if (!chap) return;
        const stEl = document.getElementById('w-chap-status');
        if (stEl) chap.status = stEl.value;
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
        if (this._batchSelected.size === 0) return UI.toast('请先选择章节');
        const vols = (await DB.getAll('volumes') || []).sort((a,b) => (a.order||0) - (b.order||0));
        const volId = prompt('移动到哪个卷？输入卷ID或名称（' + vols.map(v => v.title).join(' / ') + '）');
        if (!volId) return;
        const targetVol = vols.find(v => v.id === volId || v.title === volId);
        if (!targetVol) return UI.toast('未找到该卷');
        for (const id of this._batchSelected) {
            const chap = await DB.get('chapters', id);
            if (chap) { chap.volumeId = targetVol.id; await DB.put('chapters', chap); }
        }
        this._batchSelected.clear();
        this.loadTree();
        UI.toast(`已移动 ${this._batchSelected.size} 章到 ${targetVol.title}`);
    },

    async batchSetStatus() {
        if (this._batchSelected.size === 0) return UI.toast('请先选择章节');
        const status = prompt('设置状态: outline(待写) / draft(草稿) / done(已完成) / polished(已润色)');
        if (!['outline','draft','done','polished'].includes(status)) return UI.toast('无效状态');
        for (const id of this._batchSelected) {
            const chap = await DB.get('chapters', id);
            if (chap) { chap.status = status; await DB.put('chapters', chap); }
        }
        this._batchSelected.clear();
        this.loadTree();
        UI.toast('状态已批量更新');
    },

    async batchDelete() {
        if (this._batchSelected.size === 0) return UI.toast('请先选择章节');
        if (!confirm(`确定删除选中的 ${this._batchSelected.size} 个章节？`)) return;
        for (const id of this._batchSelected) {
            await DB.del('chapters', id);
        }
        this._batchSelected.clear();
        this.currentChapterId = null;
        this.loadTree();
        UI.toast('已删除');
    },

    selectVol(id) {
        this.currentVolumeId = id;
        this.currentChapterId = null;
        this.loadTree();
        UI.toast('已选中卷，新建章节将归属此卷');
    },

    // ===== CRUD =====
    newVol() {
        const list = document.getElementById('w-chap-list');
        if (!list || list.querySelector('.w-inline-input')) return;
        const row = document.createElement('div');
        row.className = 'w-inline-input flex items-center gap-1 px-2 py-1';
        row.innerHTML = `<i class="fa-solid fa-folder-plus text-accent text-xs"></i>
            <input class="flex-1 bg-black/40 border border-accent/40 rounded px-2 py-1 text-xs text-white focus:outline-none" placeholder="输入卷名..." autofocus
                onkeydown="if(event.key==='Enter')Modules.writer._confirmNewVol(this.value);if(event.key==='Escape')Modules.writer.loadTree();">
            <button class="text-accent text-xs hover:text-white" onclick="Modules.writer._confirmNewVol(this.previousElementSibling.value)"><i class="fa-solid fa-check"></i></button>
            <button class="text-dim text-xs hover:text-red-400" onclick="Modules.writer.loadTree()"><i class="fa-solid fa-xmark"></i></button>`;
        // 找到当前卷的最后一个元素，在其后插入
        let inserted = false;
        if (this.currentVolumeId) {
            const allItems = list.children;
            let foundVol = false;
            let lastInVol = null;
            for (let i = 0; i < allItems.length; i++) {
                const item = allItems[i];
                const onclick = item.getAttribute('onclick') || '';
                // 找到当前卷的卷头
                if (onclick.includes("currentVolumeId='" + this.currentVolumeId + "'")) {
                    foundVol = true;
                    lastInVol = item;
                    continue;
                }
                if (foundVol) {
                    // 遇到下一个卷头或未分卷区域就停止
                    if (item.querySelector('.fa-folder') && !onclick.includes("Modules.writer.load")) {
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
        if (!title || !title.trim()) return UI.toast('卷名不能为空', 'error');
        const vols = (await DB.getAll('volumes') || []).sort((a,b) => (a.order||0) - (b.order||0));
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
        await DB.put('volumes', { id, title: title.trim(), order: insertOrder });
        this.currentVolumeId = id;
        this.loadTree();
        UI.toast('已新建卷：' + title.trim());
    },
    newChap() {
        const list = document.getElementById('w-chap-list');
        if (!list || list.querySelector('.w-inline-input')) return;
        const row = document.createElement('div');
        row.className = 'w-inline-input flex items-center gap-1 px-2 py-1';
        row.innerHTML = `<i class="fa-solid fa-file-circle-plus text-blue-400 text-xs"></i>
            <input class="flex-1 bg-black/40 border border-blue-400/40 rounded px-2 py-1 text-xs text-white focus:outline-none" placeholder="输入章节名..." autofocus
                onkeydown="if(event.key==='Enter')Modules.writer._confirmNewChap(this.value);if(event.key==='Escape')Modules.writer.loadTree();">
            <button class="text-blue-400 text-xs hover:text-white" onclick="Modules.writer._confirmNewChap(this.previousElementSibling.value)"><i class="fa-solid fa-check"></i></button>
            <button class="text-dim text-xs hover:text-red-400" onclick="Modules.writer.loadTree()"><i class="fa-solid fa-xmark"></i></button>`;
        // 插入到当前选中章节的后面
        let inserted = false;
        if (this.currentChapterId) {
            const allItems = list.children;
            for (let i = 0; i < allItems.length; i++) {
                const onclick = allItems[i].getAttribute('onclick') || '';
                if (onclick.includes("Modules.writer.load('" + this.currentChapterId + "')")) {
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
        if (!title || !title.trim()) return UI.toast('章节名不能为空', 'error');
        const chaps = (await DB.getAll('chapters') || []).sort((a,b) => (a.order||0) - (b.order||0));
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
        
        await DB.put('chapters', { id, title: title.trim(), content: '', outline: '', order: insertOrder, volumeId: volId, status: 'outline', targetWords: 2500 });
        this.loadTree();
        this.load(id);
        UI.toast('已新建章节：' + title.trim());
    },
    rename(type, id, oldTitle) {
        const el = event.target.closest('[onclick]').parentElement.parentElement;
        if (!el) return;
        const span = el.querySelector('span');
        if (!span) return;
        span.innerHTML = `<input class="bg-black/40 border border-accent/40 rounded px-1 py-0.5 text-xs text-white w-full focus:outline-none" value="${oldTitle}"
            onkeydown="if(event.key==='Enter')Modules.writer._confirmRename('${type}','${id}',this.value);if(event.key==='Escape')Modules.writer.loadTree();"
            onblur="Modules.writer.loadTree()">`;
        const inp = span.querySelector('input');
        if (inp) { inp.focus(); inp.select(); }
    },
    async _confirmRename(type, id, title) {
        if (!title || !title.trim()) return this.loadTree();
        const store = type === 'vol' ? 'volumes' : 'chapters';
        const item = await DB.get(store, id);
        if (item) { item.title = title.trim(); await DB.put(store, item); }
        this.loadTree();
    },
    async del(type, id) {
        if (!confirm('确定删除？')) return;
        const store = type === 'vol' ? 'volumes' : 'chapters';
        await DB.del(store, id);
        if (type === 'chap' && id === this.currentChapterId) {
            this.currentChapterId = null;
            const ed = document.getElementById('w-editor'); if (ed) ed.value = '';
            const ti = document.getElementById('w-title'); if (ti) ti.value = '';
            const ol = document.getElementById('w-outline'); if (ol) ol.value = '';
        }
        this.loadTree();
    },
    async clearAll() {
        if (!confirm('确定清空所有卷和章节？此操作不可撤销！')) return;
        const vols = await DB.getAll('volumes') || [];
        const chaps = await DB.getAll('chapters') || [];
        for (const v of vols) await DB.del('volumes', v.id);
        for (const c of chaps) await DB.del('chapters', c.id);
        this.currentChapterId = null;
        const ed = document.getElementById('w-editor'); if (ed) ed.value = '';
        const ti = document.getElementById('w-title'); if (ti) ti.value = '';
        const ol = document.getElementById('w-outline'); if (ol) ol.value = '';
        this.loadTree();
        UI.toast('已清空');
    },


    // ===== RAG (旗舰强化版：多维度实体关联 + 章节卷维度检索 + 知识图谱集成) =====
    _ragData: { entities: [], world: [], fusion: [], chapters: [], knowledgeGraph: [], writingPatterns: [] },
    _ragCurrentSource: 'all',
    _ragFilters: { volumeId: null, chapterRange: null, entityTypes: [] },

});
