Object.assign(Modules.writer, {
    async refreshRAG() {
        const resultsEl = document.getElementById('w-rag-results');
        if (!resultsEl) return;
        
        resultsEl.innerHTML = '<div class="text-center text-dim py-4"><i class="fa-solid fa-spinner fa-spin text-xl mb-2"></i><div>正在检索上下文...</div></div>';
        
        try {
            const editorText = (document.getElementById('w-editor') || {}).value || '';
            const outlineText = (document.getElementById('w-outline') || {}).value || '';
            const title = (document.getElementById('w-title') || {}).value || '';
            const query = (title + ' ' + outlineText + ' ' + editorText).slice(-800);
            
            const entities = await DB.getAll('entities') || [];
            const normalEntities = entities.filter(e => !e.id.startsWith('world_'));
            const worldEntities = entities.filter(e => e.id.startsWith('world_'));
            
            const fusionCtx = this._getFusionContext();
            
            const chapters = await DB.getAll('chapters') || [];
            const volumes = await DB.getAll('volumes') || [];
            const currentChapter = chapters.find(c => c.id === this.currentChapterId);
            const currentVolume = volumes.find(v => v.id === this.currentVolumeId);
            
            const knowledgeGraph = await this._buildKnowledgeGraph(normalEntities);
            const writingPatterns = await this._loadWritingPatterns();
            
            const entitiesEl = document.getElementById('w-rag-entities');
            const worldEl = document.getElementById('w-rag-world');
            const fusionEl = document.getElementById('w-rag-fusion');
            const chaptersEl = document.getElementById('w-rag-chapters');
            
            if (entitiesEl) entitiesEl.textContent = normalEntities.length;
            if (worldEl) worldEl.textContent = worldEntities.length;
            if (fusionEl) fusionEl.textContent = fusionCtx ? '1' : '0';
            if (chaptersEl) chaptersEl.textContent = chapters.length;
            
            this._ragData = {
                entities: normalEntities,
                world: worldEntities,
                fusion: fusionCtx ? [{ id: 'fusion', name: '融合技法精华', content: fusionCtx }] : [],
                chapters: chapters,
                volumes: volumes,
                knowledgeGraph: knowledgeGraph,
                writingPatterns: writingPatterns,
                currentChapter: currentChapter,
                currentVolume: currentVolume
            };
            
            const relevantEntities = await this._findRelevantEntitiesEnhanced(query, normalEntities, 10);
            const relevantWorld = this._findRelevantWorld(query, worldEntities, 5);
            const relevantChapters = await this._findRelevantChapters(query, chapters, 3);
            const relatedEntities = this._findRelatedEntitiesFromGraph(query, knowledgeGraph, 5);
            
            this._renderRAGResultsEnhanced(relevantEntities, relevantWorld, fusionCtx, currentChapter, relevantChapters, relatedEntities, writingPatterns);
            
        } catch (e) {
            resultsEl.innerHTML = `<div class="text-center text-red-400 py-4"><i class="fa-solid fa-exclamation-triangle text-xl mb-2"></i><div>检索失败: ${e.message}</div></div>`;
        }
    },

    async _buildKnowledgeGraph(entities) {
        const graph = { nodes: [], edges: [] };
        const nodeMap = new Map();
        
        entities.forEach(e => {
            nodeMap.set(e.name, {
                id: e.id,
                name: e.name,
                type: e.type || '其他',
                desc: e.desc || '',
                relations: e.relations || [],
                chapterRef: e.chapterRef || []
            });
            graph.nodes.push({
                id: e.id,
                label: e.name,
                type: e.type || '其他',
                size: (e.relations?.length || 0) + 1
            });
        });
        
        entities.forEach(e => {
            if (e.relations && e.relations.length > 0) {
                e.relations.forEach(rel => {
                    const match = rel.match(/(.+?)[：:]\s*(.+)/);
                    if (match) {
                        const relationType = match[1];
                        const targetName = match[2];
                        if (nodeMap.has(targetName)) {
                            graph.edges.push({
                                source: e.id,
                                target: nodeMap.get(targetName).id,
                                relation: relationType,
                                label: relationType
                            });
                        }
                    }
                });
            }
        });
        
        return graph;
    },

    async _loadWritingPatterns() {
        const patterns = [];
        try {
            const saved = await DB.get('settings', 'writer_patterns');
            if (saved && saved.patterns) {
                patterns.push(...saved.patterns);
            }
            const fusionCtx = this._getFusionContext();
            if (fusionCtx) {
                patterns.push({
                    id: 'fusion_hooks',
                    name: '融合技法-钩子模板',
                    source: 'fusion',
                    content: fusionCtx.slice(0, 1500)
                });
            }
        } catch(e) {}
        return patterns;
    },

    async _findRelevantEntitiesEnhanced(query, entities, limit) {
        if (!query || !entities.length) return entities.slice(0, limit);
        
        const queryLower = query.toLowerCase();
        const keywords = queryLower.split(/[\s,，。！？、]+/).filter(k => k.length > 1);
        
        const currentChapterNum = this.currentChapterId ? 
            parseInt((await DB.get('chapters', this.currentChapterId))?.order || 0) : 0;
        
        const scored = entities.map(e => {
            let score = 0;
            const nameLower = (e.name || '').toLowerCase();
            const descLower = (e.desc || '').toLowerCase();
            
            if (queryLower.includes(nameLower)) score += 15;
            keywords.forEach(k => {
                if (nameLower.includes(k)) score += 8;
                if (descLower.includes(k)) score += 3;
            });
            if (queryLower.includes((e.type || '').toLowerCase())) score += 5;
            
            if (e.chapterRef && e.chapterRef.length > 0) {
                const nearestChapter = e.chapterRef.reduce((prev, curr) => 
                    Math.abs(curr - currentChapterNum) < Math.abs(prev - currentChapterNum) ? curr : prev
                );
                const distance = Math.abs(nearestChapter - currentChapterNum);
                if (distance <= 3) score += 10;
                else if (distance <= 10) score += 5;
            }
            
            if (e.relations && e.relations.length > 0) {
                score += Math.min(e.relations.length * 2, 10);
            }
            
            return { ...e, score };
        });
        
        return scored.sort((a, b) => b.score - a.score).slice(0, limit);
    },

    async _findRelevantChapters(query, chapters, limit) {
        if (!query || !chapters.length) return [];
        
        const queryLower = query.toLowerCase();
        const keywords = queryLower.split(/[\s,，。！？、]+/).filter(k => k.length > 1);
        
        const scored = chapters.map(c => {
            let score = 0;
            const titleLower = (c.title || '').toLowerCase();
            const outlineLower = (c.outline || '').toLowerCase();
            const contentLower = (c.content || '').toLowerCase().slice(0, 500);
            
            keywords.forEach(k => {
                if (titleLower.includes(k)) score += 10;
                if (outlineLower.includes(k)) score += 5;
                if (contentLower.includes(k)) score += 3;
            });
            
            return { ...c, score };
        });
        
        return scored.filter(c => c.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
    },

    _findRelatedEntitiesFromGraph(query, graph, limit) {
        if (!graph || !graph.nodes.length) return [];
        
        const queryLower = query.toLowerCase();
        const relatedNodes = [];
        
        graph.nodes.forEach(node => {
            if (queryLower.includes(node.label.toLowerCase())) {
                const connectedEdges = graph.edges.filter(e => 
                    e.source === node.id || e.target === node.id
                );
                connectedEdges.forEach(edge => {
                    const targetId = edge.source === node.id ? edge.target : edge.source;
                    const targetNode = graph.nodes.find(n => n.id === targetId);
                    if (targetNode && !relatedNodes.find(r => r.id === targetNode.id)) {
                        relatedNodes.push({
                            ...targetNode,
                            relationFrom: node.label,
                            relationType: edge.relation
                        });
                    }
                });
            }
        });
        
        return relatedNodes.slice(0, limit);
    },

    _renderRAGResultsEnhanced(entities, world, fusion, currentChapter, relevantChapters, relatedEntities, writingPatterns) {
        const resultsEl = document.getElementById('w-rag-results');
        if (!resultsEl) return;
        
        let html = '';
        
        if (entities.length > 0) {
            html += `<div class="mb-3">
                <div class="text-[9px] text-cyan-400 font-bold uppercase mb-1 flex items-center gap-1">
                    <i class="fa-solid fa-user"></i>相关实体 (${entities.length})
                    <button class="ml-auto text-dim hover:text-white" onclick="Modules.writer._showAllEntities()"><i class="fa-solid fa-expand"></i></button>
                </div>
                <div class="space-y-1">
                    ${entities.map(e => `
                        <div class="p-2 bg-cyan-500/5 rounded border border-cyan-500/10 cursor-pointer hover:bg-cyan-500/10 transition-all" onclick="Modules.writer._showEntityDetail('${e.id}')">
                            <div class="flex items-center gap-2 mb-0.5">
                                <span class="text-[8px] px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-300">${e.type || '其他'}</span>
                                <span class="text-xs text-white font-bold">${this._esc(e.name)}</span>
                                ${e.score ? `<span class="text-[8px] text-amber-400 ml-auto">★${e.score}</span>` : ''}
                            </div>
                            <div class="text-[10px] text-dim line-clamp-2">${this._esc((e.desc || '').slice(0, 100))}</div>
                            ${e.relations && e.relations.length ? `<div class="text-[8px] text-cyan-400 mt-1"><i class="fa-solid fa-link mr-1"></i>${e.relations.slice(0, 3).join(' · ')}</div>` : ''}
                            ${e.chapterRef && e.chapterRef.length ? `<div class="text-[8px] text-green-400 mt-0.5"><i class="fa-solid fa-bookmark mr-1"></i>章节: ${e.chapterRef.slice(0, 5).join(', ')}${e.chapterRef.length > 5 ? '...' : ''}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }
        
        if (relatedEntities && relatedEntities.length > 0) {
            html += `<div class="mb-3">
                <div class="text-[9px] text-pink-400 font-bold uppercase mb-1 flex items-center gap-1">
                    <i class="fa-solid fa-project-diagram"></i>关联实体网络 (${relatedEntities.length})
                </div>
                <div class="space-y-1">
                    ${relatedEntities.map(e => `
                        <div class="p-2 bg-pink-500/5 rounded border border-pink-500/10 cursor-pointer hover:bg-pink-500/10 transition-all">
                            <div class="flex items-center gap-2">
                                <span class="text-[8px] px-1 py-0.5 rounded bg-pink-500/20 text-pink-300">${e.type || '其他'}</span>
                                <span class="text-xs text-white">${this._esc(e.label || e.name)}</span>
                            </div>
                            <div class="text-[9px] text-pink-300 mt-1">
                                <i class="fa-solid fa-arrow-right-arrow-left mr-1"></i>
                                ${e.relationFrom} — ${e.relationType} — ${e.label}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }
        
        if (world.length > 0) {
            const catLabels = {
                history: '历史与传说', geography: '地理与地貌', magic: '魔法/科技体系',
                factions: '势力与组织', species: '种族与生物', rules: '世界规则', culture: '文化与习俗'
            };
            html += `<div class="mb-3">
                <div class="text-[9px] text-amber-400 font-bold uppercase mb-1 flex items-center gap-1">
                    <i class="fa-solid fa-earth-americas"></i>世界观设定 (${world.length})
                </div>
                <div class="space-y-1">
                    ${world.map(w => {
                        const cat = (w.id || '').replace('world_', '');
                        return `
                        <div class="p-2 bg-amber-500/5 rounded border border-amber-500/10 cursor-pointer hover:bg-amber-500/10 transition-all" onclick="Modules.writer._showWorldDetail('${w.id}')">
                            <div class="flex items-center gap-2 mb-0.5">
                                <span class="text-xs text-amber-300 font-bold">${catLabels[cat] || w.name}</span>
                            </div>
                            <div class="text-[10px] text-dim line-clamp-3">${this._esc((w.desc || '').slice(0, 150))}</div>
                        </div>`;
                    }).join('')}
                </div>
            </div>`;
        }
        
        if (relevantChapters && relevantChapters.length > 0) {
            html += `<div class="mb-3">
                <div class="text-[9px] text-green-400 font-bold uppercase mb-1 flex items-center gap-1">
                    <i class="fa-solid fa-file-lines"></i>相关章节 (${relevantChapters.length})
                </div>
                <div class="space-y-1">
                    ${relevantChapters.map(c => `
                        <div class="p-2 bg-green-500/5 rounded border border-green-500/10 cursor-pointer hover:bg-green-500/10 transition-all" onclick="Modules.writer.load('${c.id}')">
                            <div class="text-xs text-green-300 font-bold">${this._esc(c.title)}</div>
                            <div class="text-[9px] text-dim line-clamp-2 mt-1">${this._esc((c.outline || '').slice(0, 100))}</div>
                            ${c.score ? `<div class="text-[8px] text-amber-400 mt-1">相关度: ${c.score}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }
        
        if (fusion) {
            html += `<div class="mb-3">
                <div class="text-[9px] text-purple-400 font-bold uppercase mb-1 flex items-center gap-1">
                    <i class="fa-solid fa-wand-magic-sparkles"></i>融合技法精华
                </div>
                <div class="p-2 bg-purple-500/5 rounded border border-purple-500/10">
                    <div class="text-[10px] text-dim leading-relaxed max-h-32 overflow-y-auto">${this._esc(fusion.slice(0, 500))}...</div>
                </div>
            </div>`;
        }
        
        if (writingPatterns && writingPatterns.length > 0) {
            html += `<div class="mb-3">
                <div class="text-[9px] text-indigo-400 font-bold uppercase mb-1 flex items-center gap-1">
                    <i class="fa-solid fa-lightbulb"></i>写作模式参考 (${writingPatterns.length})
                </div>
                <div class="space-y-1">
                    ${writingPatterns.slice(0, 3).map(p => `
                        <div class="p-2 bg-indigo-500/5 rounded border border-indigo-500/10">
                            <div class="text-[10px] text-indigo-300 font-bold">${p.name}</div>
                            <div class="text-[9px] text-dim line-clamp-2 mt-1">${this._esc((p.content || '').slice(0, 100))}</div>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }
        
        if (currentChapter && currentChapter.outline) {
            html += `<div class="mb-3">
                <div class="text-[9px] text-blue-400 font-bold uppercase mb-1 flex items-center gap-1">
                    <i class="fa-solid fa-map"></i>当前章节大纲
                </div>
                <div class="p-2 bg-blue-500/5 rounded border border-blue-500/10">
                    <div class="text-[10px] text-dim leading-relaxed">${this._esc(currentChapter.outline.slice(0, 300))}</div>
                </div>
            </div>`;
        }
        
        if (!html) {
            html = `<div class="text-center text-dim py-4">
                <i class="fa-solid fa-database text-2xl mb-2 opacity-30"></i>
                <div>暂无相关上下文</div>
                <div class="text-[10px] mt-1">请先在世界引擎中创建实体或导入世界观</div>
            </div>`;
        }
        
        resultsEl.innerHTML = html;
    },

    async _showAllEntities() {
        const entities = await DB.getAll('entities') || [];
        const normalEntities = entities.filter(e => !e.id.startsWith('world_'));
        
        const modal = document.createElement('div');
        modal.id = 'w-all-entities-modal';
        modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm';
        modal.innerHTML = `
            <div class="bg-[#1a1a2e] rounded-2xl border border-white/10 w-[800px] max-h-[85vh] flex flex-col shadow-2xl">
                <div class="flex items-center justify-between px-5 py-3 border-b border-white/5">
                    <span class="font-bold text-white"><i class="fa-solid fa-users mr-2 text-cyan-400"></i>全部实体 (${normalEntities.length})</span>
                    <button class="text-dim hover:text-white" onclick="this.closest('#w-all-entities-modal').remove()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="p-3 border-b border-white/5">
                    <input type="text" id="w-entity-filter" class="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm text-white" placeholder="搜索实体..." oninput="Modules.writer._filterAllEntities(this.value)">
                </div>
                <div id="w-all-entities-list" class="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2">
                    ${normalEntities.map(e => `
                        <div class="p-2 bg-black/20 rounded-lg border border-white/5 cursor-pointer hover:bg-white/5 transition-all" onclick="Modules.writer._showEntityDetail('${e.id}')">
                            <div class="flex items-center gap-2">
                                <span class="text-[8px] px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-300">${e.type || '其他'}</span>
                                <span class="text-xs text-white font-bold">${this._esc(e.name)}</span>
                            </div>
                            <div class="text-[9px] text-dim mt-1 line-clamp-2">${this._esc((e.desc || '').slice(0, 80))}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        this._allEntitiesList = normalEntities;
    },

    _filterAllEntities(keyword) {
        const list = document.getElementById('w-all-entities-list');
        if (!list || !this._allEntitiesList) return;
        
        const filtered = keyword ? 
            this._allEntitiesList.filter(e => 
                e.name.includes(keyword) || 
                (e.desc || '').includes(keyword) ||
                (e.type || '').includes(keyword)
            ) : this._allEntitiesList;
        
        list.innerHTML = filtered.map(e => `
            <div class="p-2 bg-black/20 rounded-lg border border-white/5 cursor-pointer hover:bg-white/5 transition-all" onclick="Modules.writer._showEntityDetail('${e.id}')">
                <div class="flex items-center gap-2">
                    <span class="text-[8px] px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-300">${e.type || '其他'}</span>
                    <span class="text-xs text-white font-bold">${this._esc(e.name)}</span>
                </div>
                <div class="text-[9px] text-dim mt-1 line-clamp-2">${this._esc((e.desc || '').slice(0, 80))}</div>
            </div>
        `).join('');
    },

    _findRelevantEntities(query, entities, limit) {
        if (!query || !entities.length) return entities.slice(0, limit);
        
        const queryLower = query.toLowerCase();
        const keywords = queryLower.split(/[\s,，。！？、]+/).filter(k => k.length > 1);
        
        const scored = entities.map(e => {
            let score = 0;
            const nameLower = (e.name || '').toLowerCase();
            const descLower = (e.desc || '').toLowerCase();
            
            // 名称完全匹配
            if (queryLower.includes(nameLower)) score += 10;
            // 名称部分匹配
            keywords.forEach(k => {
                if (nameLower.includes(k)) score += 5;
                if (descLower.includes(k)) score += 2;
            });
            // 类型匹配
            if (queryLower.includes((e.type || '').toLowerCase())) score += 3;
            
            return { ...e, score };
        });
        
        return scored.sort((a, b) => b.score - a.score).slice(0, limit);
    },

    _findRelevantWorld(query, worldEntities, limit) {
        if (!query || !worldEntities.length) return worldEntities.slice(0, limit);
        
        const queryLower = query.toLowerCase();
        const catKeywords = {
            history: ['历史', '传说', '故事', '过去', '古代', '纪元'],
            geography: ['地理', '地点', '城市', '山', '河', '位置', '地图'],
            magic: ['魔法', '功法', '技能', '力量', '修炼', '等级'],
            factions: ['势力', '门派', '组织', '阵营', '国家', '家族'],
            species: ['种族', '生物', '妖', '兽', '精灵', '龙'],
            rules: ['规则', '法则', '定律', '禁忌', '限制'],
            culture: ['文化', '习俗', '节日', '信仰', '传统']
        };
        
        const scored = worldEntities.map(e => {
            let score = 0;
            const cat = (e.id || '').replace('world_', '');
            const descLower = (e.desc || '').toLowerCase();
            
            // 分类关键词匹配
            if (catKeywords[cat]) {
                catKeywords[cat].forEach(k => {
                    if (queryLower.includes(k)) score += 5;
                });
            }
            // 内容匹配
            if (queryLower.includes(cat)) score += 3;
            if (descLower.includes(queryLower.slice(0, 20))) score += 2;
            
            return { ...e, score };
        });
        
        return scored.sort((a, b) => b.score - a.score).slice(0, limit);
    },

    _renderRAGResults(entities, world, fusion, currentChapter) {
        const resultsEl = document.getElementById('w-rag-results');
        if (!resultsEl) return;
        
        let html = '';
        
        // 实体部分
        if (entities.length > 0) {
            html += `<div class="mb-3">
                <div class="text-[9px] text-cyan-400 font-bold uppercase mb-1 flex items-center gap-1">
                    <i class="fa-solid fa-user"></i>相关实体 (${entities.length})
                </div>
                <div class="space-y-1">
                    ${entities.map(e => `
                        <div class="p-2 bg-cyan-500/5 rounded border border-cyan-500/10 cursor-pointer hover:bg-cyan-500/10 transition-all" onclick="Modules.writer._showEntityDetail('${e.id}')">
                            <div class="flex items-center gap-2 mb-0.5">
                                <span class="text-[8px] px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-300">${e.type || '其他'}</span>
                                <span class="text-xs text-white font-bold">${this._esc(e.name)}</span>
                                ${e.score ? `<span class="text-[8px] text-dim ml-auto">相关度:${e.score}</span>` : ''}
                            </div>
                            <div class="text-[10px] text-dim line-clamp-2">${this._esc((e.desc || '').slice(0, 100))}</div>
                            ${e.relations && e.relations.length ? `<div class="text-[8px] text-cyan-400 mt-1">关联: ${e.relations.slice(0, 3).join(', ')}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }
        
        // 世界观部分
        if (world.length > 0) {
            const catLabels = {
                history: '历史与传说', geography: '地理与地貌', magic: '魔法/科技体系',
                factions: '势力与组织', species: '种族与生物', rules: '世界规则', culture: '文化与习俗'
            };
            html += `<div class="mb-3">
                <div class="text-[9px] text-amber-400 font-bold uppercase mb-1 flex items-center gap-1">
                    <i class="fa-solid fa-earth-americas"></i>世界观设定 (${world.length})
                </div>
                <div class="space-y-1">
                    ${world.map(w => {
                        const cat = (w.id || '').replace('world_', '');
                        return `
                        <div class="p-2 bg-amber-500/5 rounded border border-amber-500/10 cursor-pointer hover:bg-amber-500/10 transition-all" onclick="Modules.writer._showWorldDetail('${w.id}')">
                            <div class="flex items-center gap-2 mb-0.5">
                                <span class="text-xs text-amber-300 font-bold">${catLabels[cat] || w.name}</span>
                            </div>
                            <div class="text-[10px] text-dim line-clamp-3">${this._esc((w.desc || '').slice(0, 150))}</div>
                        </div>`;
                    }).join('')}
                </div>
            </div>`;
        }
        
        // 融合技法部分
        if (fusion) {
            html += `<div class="mb-3">
                <div class="text-[9px] text-purple-400 font-bold uppercase mb-1 flex items-center gap-1">
                    <i class="fa-solid fa-wand-magic-sparkles"></i>融合技法精华
                </div>
                <div class="p-2 bg-purple-500/5 rounded border border-purple-500/10">
                    <div class="text-[10px] text-dim leading-relaxed max-h-32 overflow-y-auto">${this._esc(fusion.slice(0, 500))}...</div>
                </div>
            </div>`;
        }
        
        // 当前章节大纲
        if (currentChapter && currentChapter.outline) {
            html += `<div class="mb-3">
                <div class="text-[9px] text-green-400 font-bold uppercase mb-1 flex items-center gap-1">
                    <i class="fa-solid fa-file-lines"></i>当前章节大纲
                </div>
                <div class="p-2 bg-green-500/5 rounded border border-green-500/10">
                    <div class="text-[10px] text-dim leading-relaxed">${this._esc(currentChapter.outline.slice(0, 300))}</div>
                </div>
            </div>`;
        }
        
        if (!html) {
            html = `<div class="text-center text-dim py-4">
                <i class="fa-solid fa-database text-2xl mb-2 opacity-30"></i>
                <div>暂无相关上下文</div>
                <div class="text-[10px] mt-1">请先在世界引擎中创建实体或导入世界观</div>
            </div>`;
        }
        
        resultsEl.innerHTML = html;
    },

    async _showEntityDetail(id) {
        const entity = await DB.get('entities', id);
        if (!entity) return UI.toast('实体不存在', 'error');
        
        const modal = document.createElement('div');
        modal.id = 'w-entity-detail-modal';
        modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm';
        modal.innerHTML = `
            <div class="bg-[#1a1a2e] rounded-2xl border border-white/10 w-[500px] max-h-[70vh] flex flex-col shadow-2xl">
                <div class="flex items-center justify-between px-4 py-3 border-b border-white/5">
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400">${entity.type || '其他'}</span>
                        <span class="font-bold text-white">${this._esc(entity.name)}</span>
                    </div>
                    <button class="text-dim hover:text-white" onclick="this.closest('#w-entity-detail-modal').remove()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="flex-1 overflow-y-auto p-4 space-y-3">
                    <div>
                        <div class="text-[10px] text-dim font-bold uppercase mb-1">描述</div>
                        <div class="text-xs text-gray-300 leading-relaxed">${this._esc(entity.desc || '暂无描述')}</div>
                    </div>
                    ${entity.relations && entity.relations.length ? `
                    <div>
                        <div class="text-[10px] text-dim font-bold uppercase mb-1">关联关系</div>
                        <div class="flex flex-wrap gap-1">
                            ${entity.relations.map(r => `<span class="text-[9px] px-2 py-0.5 rounded bg-white/5 text-dim">${this._esc(r)}</span>`).join('')}
                        </div>
                    </div>` : ''}
                    <div class="text-[9px] text-dim">
                        来源: ${entity.source || '手动创建'} | 
                        更新: ${entity.updatedAt ? new Date(entity.updatedAt).toLocaleString() : '未知'}
                    </div>
                </div>
                <div class="flex gap-2 p-3 border-t border-white/5">
                    <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30 flex-1" onclick="Modules.writer._injectEntityToPrompt('${id}')">
                        <i class="fa-solid fa-syringe mr-1"></i>注入到续写
                    </button>
                    <button class="btn btn-xs bg-white/5 text-dim flex-1" onclick="navigator.clipboard.writeText('${entity.name}: ${entity.desc || ''}');UI.toast('已复制')">
                        <i class="fa-solid fa-copy mr-1"></i>复制
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    async _showWorldDetail(id) {
        const world = await DB.get('entities', id);
        if (!world) return UI.toast('世界观不存在', 'error');
        
        const catLabels = {
            history: '历史与传说', geography: '地理与地貌', magic: '魔法/科技体系',
            factions: '势力与组织', species: '种族与生物', rules: '世界规则', culture: '文化与习俗'
        };
        const cat = (id || '').replace('world_', '');
        
        const modal = document.createElement('div');
        modal.id = 'w-world-detail-modal';
        modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm';
        modal.innerHTML = `
            <div class="bg-[#1a1a2e] rounded-2xl border border-white/10 w-[600px] max-h-[80vh] flex flex-col shadow-2xl">
                <div class="flex items-center justify-between px-4 py-3 border-b border-white/5">
                    <div class="flex items-center gap-2">
                        <i class="fa-solid fa-earth-americas text-amber-400"></i>
                        <span class="font-bold text-white">${catLabels[cat] || world.name}</span>
                    </div>
                    <button class="text-dim hover:text-white" onclick="this.closest('#w-world-detail-modal').remove()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="flex-1 overflow-y-auto p-4">
                    <div class="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">${this._esc(world.desc || '暂无内容')}</div>
                </div>
                <div class="flex gap-2 p-3 border-t border-white/5">
                    <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30 flex-1" onclick="Modules.writer._injectWorldToPrompt('${id}')">
                        <i class="fa-solid fa-syringe mr-1"></i>注入到续写
                    </button>
                    <button class="btn btn-xs bg-white/5 text-dim flex-1" onclick="navigator.clipboard.writeText(\`${world.desc || ''}\`);UI.toast('已复制')">
                        <i class="fa-solid fa-copy mr-1"></i>复制
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    async _injectEntityToPrompt(id) {
        const entity = await DB.get('entities', id);
        if (!entity) return;
        
        const input = document.getElementById('w-chat-in');
        if (input) {
            input.value += `\n【引用实体: ${entity.name}】\n类型: ${entity.type || '其他'}\n描述: ${entity.desc || ''}\n`;
        }
        
        const modal = document.getElementById('w-entity-detail-modal');
        if (modal) modal.remove();
        
        this.tab('chat');
        UI.toast('已注入实体: ' + entity.name);
    },

    async _injectWorldToPrompt(id) {
        const world = await DB.get('entities', id);
        if (!world) return;
        
        const input = document.getElementById('w-chat-in');
        if (input) {
            input.value += `\n【引用世界观】\n${world.desc || ''}\n`;
        }
        
        const modal = document.getElementById('w-world-detail-modal');
        if (modal) modal.remove();
        
        this.tab('chat');
        UI.toast('已注入世界观设定');
    },

    async _searchRAG() {
        const searchEl = document.getElementById('w-rag-search');
        const keyword = searchEl?.value?.trim();
        if (!keyword) return this.refreshRAG();
        
        const resultsEl = document.getElementById('w-rag-results');
        if (!resultsEl) return;
        
        resultsEl.innerHTML = '<div class="text-center text-dim py-4"><i class="fa-solid fa-spinner fa-spin"></i></div>';
        
        // 搜索实体
        const entities = await DB.getAll('entities') || [];
        const matched = entities.filter(e => {
            const nameLower = (e.name || '').toLowerCase();
            const descLower = (e.desc || '').toLowerCase();
            const keywordLower = keyword.toLowerCase();
            return nameLower.includes(keywordLower) || descLower.includes(keywordLower);
        });
        
        const normalEntities = matched.filter(e => !e.id.startsWith('world_'));
        const worldEntities = matched.filter(e => e.id.startsWith('world_'));
        
        this._renderRAGResults(normalEntities, worldEntities, null, null);
        
        if (matched.length === 0) {
            resultsEl.innerHTML = `<div class="text-center text-dim py-4">
                <i class="fa-solid fa-search text-2xl mb-2 opacity-30"></i>
                <div>未找到匹配 "${keyword}" 的内容</div>
            </div>`;
        }
    },

    _ragSource(source) {
        this._ragCurrentSource = source;
        const resultsEl = document.getElementById('w-rag-results');
        if (!resultsEl || !this._ragData) return;
        
        const { entities, world, fusion, chapters } = this._ragData;
        
        if (source === 'entities') {
            this._renderRAGResults(entities.slice(0, 15), [], null, null);
        } else if (source === 'world') {
            this._renderRAGResults([], world, null, null);
        } else if (source === 'fusion') {
            this._renderRAGResults([], [], fusion[0]?.content || null, null);
        } else if (source === 'chapters') {
            this._renderRAGResults([], [], null, chapters[0]);
        } else {
            this.refreshRAG();
        }
    },

    _clearRAG() {
        const resultsEl = document.getElementById('w-rag-results');
        if (resultsEl) {
            resultsEl.innerHTML = `<div class="text-center text-dim py-4">
                <i class="fa-solid fa-database text-2xl mb-2 opacity-30"></i>
                <div>点击刷新获取相关上下文</div>
            </div>`;
        }
        this._ragData = { entities: [], world: [], fusion: [], chapters: [] };
        UI.toast('已清空');
    },

    async _injectRAGToPrompt() {
        const { entities, world, fusion } = this._ragData;
        
        let context = '';
        
        if (entities.length > 0) {
            context += '[相关实体]\n';
            entities.slice(0, 5).forEach(e => {
                context += `• ${e.name}(${e.type || '其他'}): ${(e.desc || '').slice(0, 80)}\n`;
            });
            context += '\n';
        }
        
        if (world.length > 0) {
            context += '[世界观设定]\n';
            world.slice(0, 3).forEach(w => {
                context += `${w.name}: ${(w.desc || '').slice(0, 100)}\n`;
            });
            context += '\n';
        }
        
        if (fusion.length > 0 && fusion[0]?.content) {
            context += '[融合技法]\n' + fusion[0].content.slice(0, 500) + '\n';
        }
        
        if (!context) return UI.toast('暂无可注入的上下文', 'error');
        
        const input = document.getElementById('w-chat-in');
        if (input) {
            input.value = context + '\n' + (input.value || '');
        }
        
        this.tab('chat');
        UI.toast('已注入上下文到对话');
    },

    async _buildFullContext() {
        const resultsEl = document.getElementById('w-rag-results');
        if (!resultsEl) return;
        
        resultsEl.innerHTML = '<div class="text-center text-dim py-4"><i class="fa-solid fa-spinner fa-spin"></i><div>正在构建完整上下文...</div></div>';
        
        try {
            // 获取所有数据
            const entities = await DB.getAll('entities') || [];
            const normalEntities = entities.filter(e => !e.id.startsWith('world_'));
            const worldEntities = entities.filter(e => e.id.startsWith('world_'));
            const fusionCtx = this._getFusionContext();
            const chapters = await DB.getAll('chapters') || [];
            const volumes = await DB.getAll('volumes') || [];
            
            // 构建完整上下文
            let fullContext = '# 完整创作上下文\n\n';
            
            // 1. 世界观
            if (worldEntities.length > 0) {
                const catLabels = {
                    history: '历史与传说', geography: '地理与地貌', magic: '魔法/科技体系',
                    factions: '势力与组织', species: '种族与生物', rules: '世界规则', culture: '文化与习俗'
                };
                fullContext += '## 世界观设定\n\n';
                worldEntities.forEach(w => {
                    const cat = (w.id || '').replace('world_', '');
                    fullContext += `### ${catLabels[cat] || w.name}\n${w.desc || ''}\n\n`;
                });
            }
            
            // 2. 实体库
            if (normalEntities.length > 0) {
                const grouped = {};
                normalEntities.forEach(e => {
                    const t = e.type || '其他';
                    if (!grouped[t]) grouped[t] = [];
                    grouped[t].push(e);
                });
                fullContext += '## 实体库\n\n';
                for (const [type, items] of Object.entries(grouped)) {
                    fullContext += `### ${type} (${items.length})\n`;
                    items.forEach(e => {
                        fullContext += `- **${e.name}**: ${(e.desc || '').slice(0, 100)}\n`;
                    });
                    fullContext += '\n';
                }
            }
            
            // 3. 融合技法
            if (fusionCtx) {
                fullContext += '## 融合技法精华\n\n' + fusionCtx.slice(0, 2000) + '\n\n';
            }
            
            // 4. 章节大纲
            if (chapters.length > 0) {
                fullContext += '## 章节大纲\n\n';
                const sortedChapters = chapters.sort((a, b) => (a.order || 0) - (b.order || 0));
                sortedChapters.slice(0, 20).forEach((c, i) => {
                    fullContext += `### 第${i + 1}章: ${c.title}\n${(c.outline || '暂无大纲').slice(0, 200)}\n\n`;
                });
            }
            
            // 5. 统计信息
            fullContext += `---\n\n**统计**: ${volumes.length}卷 · ${chapters.length}章 · ${normalEntities.length}实体 · ${worldEntities.length}世界观维度`;
            
            // 显示结果
            resultsEl.innerHTML = `
                <div class="p-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded border border-purple-500/20 mb-2">
                    <div class="text-[10px] text-purple-400 font-bold mb-1">
                        <i class="fa-solid fa-layer-group mr-1"></i>完整上下文已构建
                    </div>
                    <div class="text-[9px] text-dim">${fullContext.length} 字符</div>
                </div>
                <div class="flex gap-1 mb-2">
                    <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30 flex-1" onclick="navigator.clipboard.writeText(\`${fullContext.replace(/`/g, '\\`')}\`);UI.toast('已复制')">
                        <i class="fa-solid fa-copy mr-1"></i>复制全部
                    </button>
                    <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30 flex-1" onclick="Modules.writer._saveFullContext()">
                        <i class="fa-solid fa-floppy-disk mr-1"></i>保存
                    </button>
                </div>
                <div class="text-[10px] text-gray-300 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto bg-black/20 rounded p-2">${this._esc(fullContext)}</div>
            `;
            
            this._fullContext = fullContext;
            
        } catch (e) {
            resultsEl.innerHTML = `<div class="text-center text-red-400 py-4"><i class="fa-solid fa-exclamation-triangle"></i><div>构建失败: ${e.message}</div></div>`;
        }
    },

    async _saveFullContext() {
        if (!this._fullContext) return UI.toast('暂无上下文', 'error');
        
        await DB.put('settings', {
            id: 'writer_full_context',
            content: this._fullContext,
            updatedAt: Date.now()
        });
        
        UI.toast('完整上下文已保存');
    },

    async _exportRAG() {
        const { entities, world, fusion } = this._ragData;
        
        let exportText = '# RAG上下文导出\n\n';
        exportText += `导出时间: ${new Date().toLocaleString()}\n\n`;
        
        if (entities.length > 0) {
            exportText += '## 实体\n\n';
            entities.forEach(e => {
                exportText += `### ${e.name} (${e.type || '其他'})\n${e.desc || ''}\n\n`;
            });
        }
        
        if (world.length > 0) {
            exportText += '## 世界观\n\n';
            world.forEach(w => {
                exportText += `### ${w.name}\n${w.desc || ''}\n\n`;
            });
        }
        
        if (fusion.length > 0 && fusion[0]?.content) {
            exportText += '## 融合技法\n\n' + fusion[0].content + '\n';
        }
        
        Utils.download('RAG上下文_' + new Date().toLocaleDateString() + '.md', exportText);
        UI.toast('已导出');
    },
});
