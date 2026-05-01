Object.assign(Modules.world_engine, {
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
            <div class="bg-[#1a1a2e] rounded-2xl border border-white/10 w-[980px] max-w-[96vw] max-h-[90vh] flex flex-col shadow-2xl">
                <div class="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex center text-white">
                            <i class="fa-solid fa-book text-lg"></i>
                        </div>
                        <div>
                            <div class="font-bold text-white text-base">导入续写</div>
                            <div class="text-[10px] text-dim">正文按章节保留到执笔台；每章拆到分部分细纲，再提实体建图谱。</div>
                        </div>
                    </div>
                    <button class="btn btn-sm bg-white/5 text-dim hover:text-white" onclick="Modules.world_engine._closeNovelImportModal()">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="px-6 py-3 border-b border-white/5 grid grid-cols-4 gap-2 shrink-0">
                    ${[
                        ['1','导入正文','原文作为已写正文进入执笔台'],
                        ['2','拆成细纲','每章拆到分部分/场次级细纲'],
                        ['3','实体入图谱','人物、规则、伏笔、关系进世界引擎'],
                        ['4','补续写','已有正文不动，缺章继续写']
                    ].map(([n,t,s]) => `
                        <div class="rounded-lg bg-black/20 border border-white/5 px-3 py-2">
                            <div class="text-[9px] text-amber-300 font-mono font-bold">${n}</div>
                            <div class="text-[11px] text-white font-bold mt-0.5">${t}</div>
                            <div class="text-[9px] text-dim mt-0.5 leading-relaxed">${s}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="flex-1 flex min-h-0 overflow-hidden">
                    <!-- 左侧面板：输入源 -->
                    <div class="w-[45%] flex flex-col border-r border-white/5">
                        <div class="px-4 py-3 border-b border-white/5 shrink-0">
                            <div class="text-[10px] text-amber-400 font-bold uppercase mb-2">第一步：放入已有正文</div>
                            <div class="flex gap-2">
                                <label class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30 flex-1 cursor-pointer text-center">
                                    <i class="fa-solid fa-upload mr-1"></i>选择文件
                                    <input type="file" accept=".txt,.md" class="hidden" onchange="Modules.world_engine._handleNovelImportFile(this)">
                                </label>
                                <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30 flex-1" onclick="Modules.world_engine._pasteNovelFromClipboard()">
                                    <i class="fa-solid fa-paste mr-1"></i>粘贴内容
                                </button>
                            </div>
                        </div>
                        <div class="flex-1 p-4 min-h-0">
                            <textarea id="we-novel-import-source" class="w-full h-full bg-black/30 border border-white/5 rounded-lg p-3 text-xs text-gray-300 resize-none font-mono leading-relaxed" placeholder="在此粘贴或导入已有小说正文...&#10;&#10;支持识别：&#10;• 第1章 标题&#10;• 第一章 标题&#10;• ### 标题&#10;• ## 第一卷&#10;• 【细纲】/【正文】/本章目标 等已有细纲标记&#10;&#10;导入后会做四件事：&#10;1. 原文正文按章节保留到执笔台&#10;2. 有细纲就自动填入每章细纲&#10;3. 没细纲就 AI 生成章内分部分细纲&#10;4. 人物、世界规则、伏笔、关系注入世界引擎知识图谱"></textarea>
                        </div>
                        <div class="px-4 py-3 border-t border-white/5 shrink-0 space-y-2">
                            <div class="flex gap-2">
                                <label class="flex items-center gap-2 text-[10px] text-dim cursor-pointer">
                                    <input type="checkbox" id="we-novel-import-merge" checked class="accent-amber-500">
                                    <span>保留已有正文，只补充/合并本次导入</span>
                                </label>
                            </div>
                            <div class="flex gap-2">
                                <label class="flex items-center gap-2 text-[10px] text-dim cursor-pointer">
                                    <input type="checkbox" id="we-novel-import-extract-entities" checked class="accent-green-500">
                                    <span>提取实体入图谱</span>
                                </label>
                                <label class="flex items-center gap-2 text-[10px] text-dim cursor-pointer">
                                    <input type="checkbox" id="we-novel-import-ai-outline" checked class="accent-purple-500">
                                    <span>缺细纲时 AI 生成</span>
                                </label>
                                <label class="flex items-center gap-2 text-[10px] text-dim cursor-pointer">
                                    <input type="checkbox" id="we-novel-import-build-cycles" checked class="accent-cyan-500">
                                    <span>构建续写循环</span>
                                </label>
                            </div>
                            <button class="btn btn-sm bg-gradient-to-r from-amber-600/20 to-orange-600/20 text-amber-400 border border-amber-500/30 w-full font-bold" onclick="Modules.world_engine._startNovelImport()">
                                <i class="fa-solid fa-wand-magic-sparkles mr-1"></i>解析原稿
                            </button>
                        </div>
                    </div>
                    <!-- 右侧面板：解析结果预览 -->
                    <div class="w-[55%] flex flex-col">
                        <div class="px-4 py-3 border-b border-white/5 shrink-0">
                            <div class="flex items-center justify-between">
                                <div class="text-[10px] text-green-400 font-bold uppercase">原稿体检报告</div>
                                <div id="we-novel-import-stats" class="text-[9px] text-dim">${hasParsed ? we._novelImportParsed.volumes.length + ' 卷 / ' + we._novelImportParsed.chapters.length + ' 章 / ' + we._novelImportParsed.entities.length + ' 实体' : '等待解析'}</div>
                            </div>
                        </div>
                        <div class="flex-1 overflow-y-auto p-4" id="we-novel-import-preview">
                            ${hasParsed ? we._renderNovelImportPreview() : `
                            <div class="text-center text-dim text-xs py-12">
                                <i class="fa-solid fa-book-open text-4xl mb-3 opacity-30"></i>
                                <p>体检报告会显示在这里</p>
                                <p class="text-[10px] mt-1 opacity-50">卷章正文、章内细纲、图谱实体、续写点会一起生成</p>
                            </div>`}
                        </div>
                        <div class="px-4 py-3 border-t border-white/5 shrink-0">
                            <button class="btn btn-sm bg-green-600/20 text-green-400 border-green-600/30 w-full font-bold" onclick="Modules.world_engine._confirmNovelImport()" ${!hasParsed ? 'disabled style="opacity:0.4"' : ''}>
                                <i class="fa-solid fa-check mr-1"></i>确认：正文入执笔台，实体入图谱
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
    },

    _renderNovelImportPreview() {
        const p = Modules.world_engine._novelImportParsed;
        if(!p) return '';
        let html = '<div class="space-y-3 text-xs">';
        // 卷/章概览
        if(p.volumes?.length) {
            const outlineReady = (p.chapters || []).filter(c => (c.outline || '').trim()).length;
            const aiCount = (p.chapters || []).filter(c => c.outlineSource === 'ai').length;
            const originalCount = (p.chapters || []).filter(c => c.outlineSource === 'original').length;
            html += `<div class="p-2 rounded bg-amber-500/5 border border-amber-500/10">
                <div class="text-[10px] font-bold text-amber-400 mb-1">卷章正文保留 (${p.volumes.length}卷 / ${p.chapters?.length||0}章 / ${outlineReady}份细纲)</div>
                <div class="text-[9px] text-dim mb-1">原文细纲 ${originalCount} 章 · AI/规则补纲 ${Math.max(0, outlineReady - originalCount)} 章${aiCount ? ' · AI生成 ' + aiCount + ' 章' : ''}</div>`;
            p.volumes.forEach(v => {
                const vchaps = p.chapters?.filter(c => c.volumeId === v.id) || [];
                html += `<div class="ml-2 mb-1"><span class="text-white font-bold">${v.title}</span> <span class="text-dim">(${vchaps.length}章)</span></div>`;
                vchaps.slice(0, 3).forEach(c => {
                    html += `<div class="ml-4 text-[10px] text-gray-400 truncate">• ${c.title} <span class="text-dim">(${(c.sections||[]).length || '?'}部分 · ${c.outlineSource || '规则'}细纲)</span></div>`;
                });
                if(vchaps.length > 3) html += `<div class="ml-4 text-[10px] text-dim">...还有${vchaps.length - 3}章</div>`;
            });
            html += '</div>';
        }
        // 世界观
        if(p.worldview && Object.keys(p.worldview).some(k => p.worldview[k])) {
            html += `<div class="p-2 rounded bg-blue-500/5 border border-blue-500/10">
                <div class="text-[10px] font-bold text-blue-400 mb-1">世界规则护栏</div>`;
            const wvLabels = {history:'历史', geography:'地理', magic:'魔法', factions:'势力', species:'种族', rules:'规则', culture:'文化'};
            Object.entries(p.worldview).forEach(([k, v]) => {
                if(v) html += `<div class="ml-2 text-[10px] text-gray-400"><span class="text-blue-300">${wvLabels[k]||k}:</span> ${String(v).slice(0,80)}${String(v).length>80?'...':''}</div>`;
            });
            html += '</div>';
        }
        // 实体
        if(p.entities?.length) {
            const grouped = {};
            p.entities.forEach(e => { grouped[e.type] = (grouped[e.type]||[]).concat(e); });
            html += `<div class="p-2 rounded bg-purple-500/5 border border-purple-500/10">
                <div class="text-[10px] font-bold text-purple-400 mb-1">知识图谱实体 (${p.entities.length}个)</div>
                <div class="flex flex-wrap gap-1">`;
            Object.entries(grouped).forEach(([type, items]) => {
                html += `<span class="px-1.5 py-0.5 rounded text-[9px] bg-white/5 text-gray-300">${type}:${items.length}</span>`;
            });
            html += '</div></div>';
        }
        if(p.continuationPoint) {
            html += `<div class="p-2 rounded bg-green-500/5 border border-green-500/10">
                <div class="text-[10px] font-bold text-green-400 mb-1">续写点</div>
                <div class="text-[10px] text-gray-400">第 ${p.continuationPoint.chapterIndex} 章结尾之后继续；已自动准备“下一章：待续写”占位。</div>
            </div>`;
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
        const merge = document.getElementById('we-novel-import-merge')?.checked !== false;

        // 超长文本分块保护
        const MAX_CHARS_PER_CHUNK = 8000;
        let chunks = [];
        if(text.length <= MAX_CHARS_PER_CHUNK * 1.5) {
            chunks = [text];
        } else {
            // 按段落分块，尽量保持章节完整
            const paras = text.split(/\n{2,}/);
            let cur = '';
            for(const p of paras) {
                if(cur.length + p.length > MAX_CHARS_PER_CHUNK && cur.length > 1000) {
                    chunks.push(cur);
                    cur = p;
                } else {
                    cur += '\n\n' + p;
                }
            }
            if(cur) chunks.push(cur);
        }

        UI.toast(`开始原稿体检，共 ${chunks.length} 个文本块...`);
        App.showProgress('拆卷章与细纲', 0, chunks.length);

        try {
            // Step 1: 解析结构（用第一个chunk估计整体结构，如果有多个chunk则综合）
            const structure = await we._parseNovelStructure(text, chunks);
            const aiOutline = document.getElementById('we-novel-import-ai-outline')?.checked !== false;
            App.showProgress('生成章内细纲', 1, Math.max(3, (structure.chapters || []).length + 2));
            const outlinedChapters = await we._prepareImportedChapterOutlines(structure.chapters || [], { aiOutline });
            const parsedChapters = outlinedChapters.map(c => ({
                ...c,
                outline: c.outline || we._buildImportedChapterOutline(c),
                sections: c.sections || we._splitChapterIntoSections(c.content || '', c.title || ''),
                outlineSource: c.outlineSource || 'rules',
                outlineLevel: 'chapter_parts',
                status: c.content && c.content.trim() ? 'done' : 'outline',
                source: 'import',
                importedAt: Date.now()
            }));
            structure.chapters = parsedChapters;
            if (structure.chapters.length && (!structure.volumes || !structure.volumes.length)) {
                const volId = Utils.uuid();
                structure.volumes = [{ id: volId, title: '导入作品', order: 1 }];
                structure.chapters.forEach(c => { c.volumeId = c.volumeId || volId; });
            }
            App.showProgress('拆卷章与细纲', 2, 3);

            // Step 2: 提取世界观与实体
            const extractEntities = document.getElementById('we-novel-import-extract-entities')?.checked !== false;
            let entities = [], worldview = {};
            if(extractEntities) {
                const extracted = await we._parseNovelEntities(text, structure.chapters);
                entities = extracted.entities || [];
                worldview = extracted.worldview || {};
                App.showProgress('实体入图谱准备', 2, 3);
            }

            // Step 3: 组装结果
            we._novelImportParsed = {
                volumes: structure.volumes || [],
                chapters: structure.chapters || [],
                entities,
                worldview,
                continuationPoint: { chapterIndex: structure.chapters.length, position: 'end' },
                sourceText: text.slice(0, 500) + '...',
                importedAt: Date.now()
            };

            we._renderNovelImportModal();
            UI.toast(`体检完成: ${structure.volumes?.length||0}卷 / ${structure.chapters?.length||0}章 / ${entities.length}图谱实体`, 'success');
        } catch(e) {
            console.error('小说导入解析失败:', e);
            UI.toast('解析失败: ' + e.message, 'error');
        } finally {
            App.hideProgress();
        }
    },

    _buildImportedChapterOutline(chapter) {
        const content = (chapter?.content || '').replace(/\s+/g, ' ').trim();
        const title = chapter?.title || `第${chapter?.order || '?'}章`;
        const sections = chapter?.sections?.length ? chapter.sections : this._splitChapterIntoSections(chapter?.content || '', title);
        if (!content) return [
            `【已导入章节】${title}`,
            `**本章目标：** 待从原文补齐`,
            `**阻力与代价：** 待从原文补齐`,
            `**情节动作：** 原文正文已保留在执笔台，本章细纲待补`,
            `**人物变化：** 待提取`,
            `**世界规则：** 待提取`,
            `**伏笔钩子：** 待提取`,
            `**实体线索：** 待提取人物、地点、势力、物品、能力、规则、关系`,
            `**上下文记忆：** 后续续写前必须回看本章`,
            `**一致性风险：** 不要跳过原文事实，不要重写已有正文`
        ].join('\n');
        const head = content.slice(0, 180);
        const tail = content.length > 260 ? content.slice(-120) : '';
        const outline = [
            `【已导入章节】${title}`,
            `**本章目标：** 从已导入正文拆解，原文正文已保留在执笔台`,
            `**阻力与代价：** 依据原文冲突补齐，续写时不得临时加无代价能力`,
            `**情节动作：** ${head}${content.length > 180 ? '...' : ''}`,
            `**人物变化：** 从本章行动和选择中提取，不凭空改人设`,
            `**世界规则：** 从本章明确出现的规则、限制、禁忌、代价中提取`,
            `**伏笔钩子：** ${tail ? tail : '检查本章末尾是否有未完成动作、信息差或待回收伏笔'}`,
            `**实体线索：** 提取人物、地点、势力、物品、能力、规则、关系`,
            `**上下文记忆：** 本章事实、承诺、误会、伤口、限制必须进入续写上下文`,
            `**一致性风险：** 已有正文默认不重写；后续续写必须承接本章人物状态、世界规则和未回收伏笔`
        ].filter(Boolean).join('\n');
        return outline + '\n\n' + this._formatSectionOutline(sections);
    },

    async _prepareImportedChapterOutlines(chapters, opts = {}) {
        const we = Modules.world_engine;
        const out = [];
        const aiEnabled = opts.aiOutline !== false;
        const total = chapters.length || 1;
        for (let i = 0; i < chapters.length; i++) {
            const c = { ...chapters[i] };
            const embedded = we._extractEmbeddedChapterOutline(c.content || '');
            if (embedded?.outline) {
                c.outline = embedded.outline;
                c.sections = embedded.sections?.length ? embedded.sections : we._outlineToSections(embedded.outline, c.content || '');
                c.outlineSource = 'original';
            } else {
                c.sections = we._splitChapterIntoSections(c.content || '', c.title || `第${i + 1}章`);
                if (c.outline && c.outline.trim().length > 80) {
                    c.outlineSource = c.outlineSource || 'parsed';
                    c.sections = c.sections.length ? c.sections : we._outlineToSections(c.outline, c.content || '');
                    c.outline = we._normalizeImportedOutline(c, c.outline);
                } else if (aiEnabled && (c.content || '').trim().length > 300 && typeof AI !== 'undefined' && AI.generate) {
                    try {
                        const ai = await we._aiGenerateImportedChapterOutline(c);
                        if (ai?.outline) {
                            c.outline = ai.outline;
                            c.sections = ai.sections?.length ? ai.sections : c.sections;
                            c.outlineSource = 'ai';
                        }
                    } catch(e) {
                        console.warn('[WorldImport] AI章内细纲失败，使用规则兜底:', c.title, e);
                    }
                }
                if (!c.outline) {
                    c.outlineSource = c.outlineSource || 'rules';
                    c.outline = we._buildImportedChapterOutline(c);
                }
            }
            c.sections = (c.sections || []).map((s, idx) => ({
                id: s.id || `${c.id || 'chapter'}_part_${idx + 1}`,
                order: s.order || idx + 1,
                title: s.title || `第${idx + 1}部分`,
                summary: s.summary || '',
                function: s.function || s.role || '',
                entities: s.entities || [],
                hook: s.hook || '',
                source: c.outlineSource || 'rules'
            }));
            out.push(c);
            App.showProgress('生成章内细纲', Math.min(i + 2, total + 1), total + 2);
        }
        return out;
    },

    _extractEmbeddedChapterOutline(content) {
        const text = String(content || '');
        if (!text.trim()) return null;
        const marked = text.match(/(?:【(?:本章)?细纲】|【大纲】|##+\s*(?:本章)?细纲|(?:本章)?细纲[:：])([\s\S]*?)(?:【正文】|##+\s*正文|正文[:：]|$)/i);
        let outline = marked ? marked[1].trim() : '';
        if (!outline) {
            const first = text.slice(0, 2600);
            const hasOutlineFields = /本章目标|阻力与代价|情节动作|人物变化|世界规则|伏笔钩子|实体线索|上下文记忆|一致性风险|场次|分段|第[一二三四五六七八九十\d]+部分/.test(first);
            if (hasOutlineFields) {
                const stop = first.search(/\n\s*(?:【正文】|正文[:：]|第一段正文|原文[:：])/);
                outline = (stop > 0 ? first.slice(0, stop) : first).trim();
            }
        }
        if (!outline || outline.length < 40) return null;
        return { outline: this._normalizeOutlineText(outline), sections: this._outlineToSections(outline, content) };
    },

    _normalizeOutlineText(outline) {
        return String(outline || '').trim()
            .replace(/^```(?:markdown|md)?\s*/i, '')
            .replace(/```$/i, '')
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
  "outline":"按固定格式写完整章纲：**本章目标：**...\\n**阻力与代价：**...\\n**情节动作：**...\\n**人物变化：**...\\n**世界规则：**...\\n**伏笔钩子：**...\\n**实体线索：**...\\n**上下文记忆：**...\\n**一致性风险：**...",
  "sections":[
    {"order":1,"title":"第1部分标题","function":"开场/推进/转折/收束","summary":"本部分发生了什么，必须具体","entities":["人物/地点/物品/规则"],"hook":"本部分留下的钩子或信息差"}
  ]
}

规则：
1. 只能基于原文，不能新增剧情。
2. 每个部分都要能指导后续续写，不要写主题口号。
3. 实体线索必须可进入世界引擎知识图谱。
4. 一致性风险要指出续写时最容易写崩的地方。`;
        let raw = '';
        await AI.generate(prompt, { max_tokens: 2600, temperature: 0.2 }, c => { raw += c; });
        const clean = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();
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

    async _parseNovelStructure(fullText, chunks) {
        // 先尝试规则分章（无需AI）
        const lines = fullText.split('\n');
        const volumes = [];
        const chapters = [];
        let currentVol = null;
        let currentChap = null;
        let chapOrder = 1;
        let volOrder = 1;
        let chapContentLines = [];

        // 分章正则：支持 "第1章" "第一章" "第1回" "Chapter 1" "### 标题" 等
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
            const prompt = `你是导入续写的小说结构解析引擎。请分析以下小说文本，识别卷/章结构，并为每章拆出可续写细纲。\n\n要求输出严格JSON（不要markdown代码块，不要额外文字）：\n{\n  "volumes": [{"title":"卷名","order":1}],\n  "chapters": [{"title":"章名","order":1,"volumeOrder":1,"outline":"**本章目标：** ...\\n**阻力与代价：** ...\\n**情节动作：** ...\\n**人物变化：** ...\\n**世界规则：** ...\\n**伏笔钩子：** ...\\n**实体线索：** ...\\n**上下文记忆：** ...\\n**一致性风险：** ..."}]\n}\n\n规则：\n1. 如果没有明显的卷，则 volumes 留空数组，所有章的 volumeOrder 为 1\n2. 章按自然顺序编号\n3. 原文正文后续会保留到执笔台，不要改写原文\n4. outline 必须按固定细纲格式写，方便下一步提取实体入世界引擎知识图谱\n5. 实体线索要写人物、地点、势力、物品、能力、规则、关系；不要写成抽象主题\n\n文本开头（前12000字）：\n${sample}`;

            let raw = '';
            try {
                await AI.generate(prompt, { max_tokens: 2000, temperature: 0.1 }, chunk => { raw += chunk; });
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

        const sampleText = sampleChaps.map(c => `【${c.title}】\n【章内细纲】\n${(c.outline||'').slice(0, 1800)}\n\n【正文样本】\n${(c.content||'').slice(0, 2600)}`).join('\n\n---\n\n');

        const prompt = `你是导入续写的知识图谱提取引擎。请分析以下小说片段，提取世界规则、关键实体、伏笔和续写护栏。\n\n要求输出严格JSON（不要markdown代码块，不要额外文字）：\n{\n  "worldview": {\n    "history":"历史与传说（100-300字）",\n    "geography":"地理与地貌（100-300字）",\n    "magic":"魔法/科技体系（100-300字）",\n    "factions":"势力与组织（100-300字）",\n    "species":"种族与生物（100-300字）",\n    "rules":"世界规则、代价、禁忌与边界（100-300字）",\n    "culture":"文化与习俗（100-300字）"\n  },\n  "entities": [\n    {"name":"名称", "type":"人物|物品|地点|势力|魔法|规则|种族|文化|历史|情节|伏笔|情绪锚点", "desc":"描述（50-200字，写清当前状态/已知事实/续写禁忌）", "relations":["关系类型:关联名称"]}\n  ]\n}\n\n规则：\n1. worldview 的每个维度如果没有相关内容则留空字符串""\n2. entities 最多提取30个最关键实体，优先主角、重要配角、世界规则、未回收伏笔、关键地点\n3. type 必须从给定类型中选\n4. relations 用于世界引擎知识图谱关联\n5. 优先结合章内细纲和正文样本提取，不要只看正文开头\n6. 只能提取原文明确内容；推断内容必须在desc中标注“推断”\n\n小说片段：\n${sampleText.slice(0, 12000)}`;

        let raw = '';
        try {
            await AI.generate(prompt, { max_tokens: 4000, temperature: 0.2 }, chunk => { raw += chunk; });
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

        const merge = document.getElementById('we-novel-import-merge')?.checked !== false;
        const buildCycles = document.getElementById('we-novel-import-build-cycles')?.checked !== false;

        // 如果不合并，先确认是否清空
        if(!merge) {
            const existing = await DB.getAll('chapters');
            if(existing.length > 0) {
                if(!confirm(`当前已有 ${existing.length} 个章节。你关闭了“保留已有正文”，继续会清空重建。确定继续？`)) return;
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

            // 2. 写入章节：已有正文保留在执笔台，outline 用于续写拆纲
            for(const c of data.chapters) {
                await DB._rawPut('chapters', c);
                App.showProgress('写入数据库', ++progress, data.chapters.length + data.entities.length + 5);
            }

            // 2.5 自动准备下一章占位：已有正文不动，缺口从这里续写
            const lastImported = [...data.chapters].sort((a,b) => (a.order||0) - (b.order||0)).pop();
            let continuationChapter = null;
            if(lastImported) {
                const nextOrder = (lastImported.order || data.chapters.length) + 1;
                const allChapters = await DB.getAll('chapters') || [];
                const existsNext = allChapters.some(c => (c.order || 0) === nextOrder);
                if(!existsNext) {
                    continuationChapter = {
                        id: 'continue_' + Utils.uuid(),
                        title: `第${nextOrder}章：待续写`,
                        order: nextOrder,
                        volumeId: lastImported.volumeId || null,
                        content: '',
                        outline: [
                            `【续写点】从第${lastImported.order || data.chapters.length}章《${lastImported.title || '未命名'}》结尾继续。`,
                            `**本章目标：** 承接前章结尾，推进下一处缺口`,
                            `**阻力与代价：** 读取知识图谱实体、世界规则和未回收伏笔后确定`,
                            `**情节动作：** 不重写已有正文，只从当前断点往后写`,
                            `**人物变化：** 必须承接前章人物状态和选择后果`,
                            `**世界规则：** 不得临时改规则，不得无代价开新能力`,
                            `**伏笔钩子：** 优先回收或强化导入正文中已有伏笔`,
                            `**实体线索：** 使用已导入人物、地点、势力、物品、能力、规则、关系`,
                            `**上下文记忆：** 前章结尾、文风指纹、原文事实、承诺、误会、限制`,
                            `**一致性风险：** 不要覆盖原文正文，不要写出与已导入章节冲突的新事实`,
                            ``,
                            `【章内分部分细纲】`,
                            `#### 第1部分：断点承接`,
                            `- 情节功能：承接/开场`,
                            `- 核心动作：接住前章最后一个动作或信息差`,
                            `- 伏笔/钩子：沿用前章未完成动作`,
                            `- 实体线索：从世界引擎读取`
                        ].join('\n'),
                        sections: [{
                            id: 'continue_part_1_' + Utils.uuid(),
                            order: 1,
                            title: '断点承接',
                            summary: '接住前章最后一个动作或信息差',
                            function: '承接/开场',
                            entities: []
                        }],
                        outlineSource: 'continuation',
                        outlineLevel: 'chapter_parts',
                        status: 'outline',
                        source: 'import_continuation',
                        createdAt: Date.now(),
                        updatedAt: Date.now()
                    };
                    await DB._rawPut('chapters', continuationChapter);
                }
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
            const importedChapters = data.chapters || [];
            const inferScopes = (entity) => {
                const chapters = [];
                const volumes = [];
                const name = String(entity.name || '').trim();
                if(name) {
                    importedChapters.forEach(ch => {
                        const haystack = `${ch.title || ''}\n${ch.outline || ''}\n${ch.content || ''}`;
                        if(haystack.includes(name)) {
                            chapters.push(ch.id);
                            if(ch.volumeId && !volumes.includes(ch.volumeId)) volumes.push(ch.volumeId);
                        }
                    });
                }
                return { chapters: [...new Set(chapters)], volumes: [...new Set(volumes)] };
            };
            const asRelArray = (value) => Array.isArray(value)
                ? value.filter(Boolean)
                : (typeof value === 'string' ? value.split(',').map(s => s.trim()).filter(Boolean) : []);
            for(const e of data.entities || []) {
                const scopes = inferScopes(e);
                e.chapters = [...new Set([...(e.chapters || []), ...scopes.chapters])];
                e.volumes = [...new Set([...(e.volumes || []), ...scopes.volumes])];
                e.relations = asRelArray(e.relations);
                // 去重检查
                const allEnts = await DB.getAll('entities');
                const existing = allEnts.find(ex => ex.name === e.name && ex.type === e.type);
                if(existing) {
                    // 合并描述
                    existing.desc = (existing.desc || '') + '\n\n[导入补充]\n' + e.desc;
                    existing.chapters = [...new Set([...(existing.chapters || []), ...(e.chapters || [])])];
                    existing.volumes = [...new Set([...(existing.volumes || []), ...(e.volumes || [])])];
                    existing.relations = [...new Set([...asRelArray(existing.relations), ...asRelArray(e.relations)])];
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
            we._cachedLayeredGraphs = null;
            if(we.rebuildLayeredGraphs) await we.rebuildLayeredGraphs('novel_import', { silent: true });

            // 8. 通知writer刷新
            if(Modules.writer) {
                Modules.writer.loadTree();
                setTimeout(() => Modules.writer.loadTree(), 800);
            }

            App.hideProgress();
            we._closeNovelImportModal();
            UI.toast(`导入成功: ${data.volumes?.length||0}卷 / ${data.chapters.length}章正文 / ${data.entities?.length||0}图谱实体${continuationChapter ? ' / 已建续写占位章' : ''}`, 'success');

            // ★ 导入模式专属：保存到 modeData
            await this._saveImportModeData(data);

            // 提示用户下一步
            if(confirm('作品已导入成功：已有正文已保留到执笔台，实体已进世界引擎。是否立即跳转到执笔台从“待续写”继续？')) {
                App.nav('writer');
            }
        } catch(e) {
            App.hideProgress();
            console.error('导入写入失败:', e);
            UI.toast('导入失败: ' + e.message, 'error');
        }
    },


    // ═══════════════════════════════════════════════════════════════
    // ★ 导入模式专属 — 文风指纹 / 续写起点 / 导入统计
    // ═══════════════════════════════════════════════════════════════

    async _saveImportModeData(data) {
        const originalText = data.chapters.map(c => c.content || '').join('\n\n');
        const wordCount = originalText.length;
        const chapterCount = data.chapters.length;
        const genre = data.worldview?.genre || '未知';
        const isCharacter = e => ['人物', '角色', 'character', 'Character'].includes(e?.type);

        // 1. 文风指纹提取（异步，不阻塞UI）
        this._extractStyleFingerprint(originalText).then(fp => {
            GenesisCore.updateModeData({ styleFingerprint: fp });
        }).catch(() => {});

        // 2. 生成导入摘要（异步）
        this._generateImportSummary(data).then(summary => {
            GenesisCore.updateModeData({ importSummary: summary });
        }).catch(() => {});

        // 3. 保存基础统计
        await GenesisCore.updateModeData({
            originalText: originalText.slice(0, 5000),
            parsedStructure: {
                chapters: data.chapters.map(c => ({
                    title: c.title,
                    order: c.order,
                    outline: c.outline || '',
                    sections: c.sections || [],
                    outlineSource: c.outlineSource || 'rules',
                    outlineLevel: c.outlineLevel || 'chapter_parts'
                })),
                characters: (data.entities || []).filter(isCharacter).map(e => e.name),
                arcs: data.volumes?.map(v => v.title || v.name).filter(Boolean) || []
            },
            extractedEntities: data.entities || [],
            originalStats: { wordCount, chapterCount, genre, characterCount: (data.entities || []).length },
            continuationPoint: { chapterIndex: chapterCount, position: 'end' },
            continuationPolicy: {
                keepImportedText: true,
                useChapterOutlines: true,
                useChapterPartOutlines: true,
                useKnowledgeGraph: true,
                writeOnlyMissingOrNext: true
            }
        });
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
  "overall": "整体文风标签"
}

片段：${sample.slice(0, 2000)}`,
                {}, c => { result += c; }
            );
        } catch(e) {}
        return result || '{}';
    },

    async _generateImportSummary(data) {
        const characterNames = (data.entities || []).filter(e => ['人物','角色','character','Character'].includes(e.type)).map(e => e.name).slice(0, 10).join('、');
        const outline = data.chapters.map(c => `第${c.order}章 ${c.title}: ${c.outline?.slice(0, 50) || ''}`).join('\n');
        const prompt = `请对以下小说生成精炼的导入摘要（不超过300字），包含：主要人物、核心冲突、世界观概要、已完结构。

人物：${characterNames}
章节概要：
${outline.slice(0, 1500)}`;
        let summary = '';
        try {
            await AI.generate(prompt, {}, c => { summary += c; });
        } catch(e) {}
        return summary || `导入作品：共${data.chapters.length}章，主要人物${characterNames}`;
    },

    // 设置续写起点
    async _setContinuationPoint(chapterIndex, position) {
        await GenesisCore.updateModeData({
            continuationPoint: { chapterIndex, position, setAt: Date.now() }
        });
        UI.toast(`续写起点已设置：第${chapterIndex}章 ${position === 'end' ? '结尾' : '开头'}`);
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
    //  项目级同步：接收 GenesisCore 推送，批量更新世界引擎
    // ═══════════════════════════════════════════════════════════════
    async syncFromProject(projectId, data) {
        const we = Modules.world_engine;
        if(!projectId) return;
        try {
            await we._ensureCache();
            // 批量注入实体
            if(data.entities && Array.isArray(data.entities)) {
                for(const ent of data.entities) {
                    const id = 'proj_' + projectId + '_' + (ent.id || Utils.uuid());
                    await DB.put('entities', {
                        id, name: ent.name, type: ent.type || '其他',
                        desc: ent.desc || '', relations: ent.relations || [],
                        source: 'project', projectId, updatedAt: Date.now()
                    });
                }
            }
            // 批量注入世界观维度
            if(data.worldview) {
                for(const [cat, desc] of Object.entries(data.worldview)) {
                    if(!desc) continue;
                    await DB.put('entities', {
                        id: 'proj_wv_' + projectId + '_' + cat,
                        name: cat, type: 'world', desc,
                        source: 'project', projectId, updatedAt: Date.now()
                    });
                }
            }
            we._cachedEntities = null;
            console.log('[WorldEngine] syncFromProject OK:', projectId);
        } catch(e) {
            console.error('[WorldEngine] syncFromProject failed:', e);
        }
    },
});
