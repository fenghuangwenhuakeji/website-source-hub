Object.assign(Modules.world_engine, {
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
            el.innerHTML = '<div class="text-[10px] text-dim p-2">暂无章节，点击下方按钮添加</div>';
            return;
        }
        
        el.innerHTML = we._chapters
            .sort((a,b) => (a.number||0) - (b.number||0))
            .map((c, i) => `
                <button class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[11px] font-bold transition-all ${we._currentChapter===c.id ? 'bg-cyan-500/10 text-white border border-cyan-500/20' : 'text-dim hover:bg-white/5 border border-transparent'}" onclick="Modules.world_engine._loadChapter('${c.id}')">
                    <i class="fa-solid fa-file-lines w-4 text-center text-[10px] text-cyan-400/60"></i>
                    <span class="truncate flex-1">${c.number ? `第${c.number}章` : '章节'}: ${c.title || '未命名'}</span>
                    <span class="text-[8px] text-dim shrink-0">${c.updatedAt ? new Date(c.updatedAt).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}) : ''}</span>
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
            previewEl.innerHTML = '<span class="text-[9px] text-dim">暂无关联实体</span>';
            return;
        }
        
        const entities = (we._cachedEntities || []).filter(e => !e.id.startsWith('world_'));
        const typeColors = {
            '人物': 'yellow', '物品': 'blue', '地点': 'green', '情节': 'red',
            '伏笔': 'purple', '势力': 'rose', '种族': 'orange', '魔法': 'indigo',
            '规则': 'sky', '文化': 'pink', '历史': 'amber', '技法': 'teal'
        };
        
        const matchedEntities = [];
        entityNames.forEach(name => {
            const found = entities.find(e => e.name === name || e.name.includes(name) || name.includes(e.name));
            if(found) matchedEntities.push(found);
        });
        
        if(!matchedEntities.length) {
            previewEl.innerHTML = entityNames.map(name => 
                `<span class="px-2 py-1 rounded text-[9px] bg-white/5 text-gray-400 border border-white/10">${name}</span>`
            ).join('');
            return;
        }
        
        previewEl.innerHTML = matchedEntities.map(e => {
            const color = typeColors[e.type] || 'gray';
            return `<span class="px-2 py-1 rounded text-[9px] bg-${color}-500/10 text-${color}-300 border border-${color}-500/20 cursor-pointer hover:bg-${color}-500/20" onclick="Modules.world_engine._loadEntity('${e.id}');Modules.world_engine.switchTab('entities')">
                <i class="fa-solid fa-circle text-[6px] mr-1"></i>${e.name}
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
            refCtx += '\n【已有实体参考】\n' + entities.slice(0, 10).map(e => `${e.type}·${e.name}: ${(e.desc||'').slice(0,80)}`).join('\n');
        }
        if(worlds.length) {
            const catLabels = {history:'历史与传说',geography:'地理与地貌',magic:'魔法/科技体系',factions:'势力与组织',species:'种族与生物',rules:'世界规则',culture:'文化与习俗'};
            refCtx += '\n【世界观设定参考】\n' + worlds.slice(0, 3).map(w => {
                const cat = w.id.replace('world_', '');
                return `${catLabels[cat]||cat}: ${(w.desc||'').slice(0,150)}`;
            }).join('\n');
        }
        
        const FB = Modules.fusion_book;
        if(FB) {
            const allPr = FB._allPipelineResults || {};
            const pr = FB._pipelineResults || {};
            const fusion = (allPr.fusion && allPr.fusion.trim()) ? allPr.fusion : (pr.fusion || '');
            if(fusion) refCtx += '\n【融合技法参考】\n' + fusion.slice(0, 1500);
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
        
        const extractedNames = fullRes.split(/[,，\n]/).map(s => s.trim()).filter(Boolean);
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
        
        let injectContent = `【章节细化】\n`;
        injectContent += `章节：第${chapter.number || '?'}章 ${chapter.title || '未命名'}\n\n`;
        if(chapter.outline) injectContent += `【细纲】\n${chapter.outline}\n\n`;
        if(chapter.entities && chapter.entities.length) injectContent += `【关联实体】\n${chapter.entities.join('、')}\n\n`;
        if(chapter.notes) injectContent += `【备注】\n${chapter.notes}\n\n`;
        
        if(Modules.phoenix) {
            Modules.phoenix.data = Modules.phoenix.data || {};
            Modules.phoenix.data.worldContext = (Modules.phoenix.data.worldContext || '') + '\n' + injectContent;
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
        
        let injectContent = `【章节细化】\n`;
        injectContent += `章节：第${chapter.number || '?'}章 ${chapter.title || '未命名'}\n\n`;
        if(chapter.outline) injectContent += `【细纲】\n${chapter.outline}\n\n`;
        if(chapter.entities && chapter.entities.length) injectContent += `【关联实体】\n${chapter.entities.join('、')}\n\n`;
        if(chapter.notes) injectContent += `【备注】\n${chapter.notes}\n\n`;
        
        const ol = document.getElementById('w-outline');
        if(ol) {
            ol.value = (ol.value ? ol.value + '\n\n' : '') + injectContent;
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

});
