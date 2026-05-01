Object.assign(Modules.reader_center, {
    renderChapterNav: () => {
        const RC = Modules.reader_center;
        if (RC.chapters.length === 0) return '';
        return `
            <div class="absolute left-0 top-0 bottom-0 w-48 bg-[#0a0a0c] border-r border-white/5 overflow-y-auto z-10" id="rc-chapter-nav">
                <div class="p-2 border-b border-white/5 sticky top-0 bg-[#0a0a0c]">
                    <div class="text-[9px] font-bold text-amber-400"><i class="fa-solid fa-list mr-1"></i>章节导航 (${RC.chapters.length})</div>
                </div>
                <div class="p-1 space-y-0.5">
                    ${RC.chapters.map((ch, i) => `
                        <button class="w-full text-left px-2 py-1.5 rounded text-[9px] transition-all ${RC.currentChapter === i ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-dim hover:bg-white/5 hover:text-white'}" onclick="Modules.reader_center.jumpToChapter(${i})">
                            <span class="text-[8px] text-dim mr-1">${ch.number}.</span>
                            <span class="truncate">${ch.title}</span>
                            <span class="text-[7px] text-dim ml-1">${ch.wordCount}字</span>
                        </button>
                    `).join('')}
                </div>
            </div>`;
    },

    jumpToChapter: (index) => {
        const RC = Modules.reader_center;
        if (!RC.chapters[index]) return;
        RC.currentChapter = index;
        const container = document.getElementById('rc-reader-container');
        if (container) {
            const targetEl = document.querySelector(`[data-chapter="${index}"]`);
            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth' });
            } else {
                const ch = RC.chapters[index];
                const percent = ch.start / (RC.currentBook?.content?.length || 1);
                container.scrollTop = container.scrollHeight * percent;
            }
        }
        RC._updateChapterHighlight();
    },

    _updateChapterHighlight: () => {
        const RC = Modules.reader_center;
        document.querySelectorAll('#rc-chapter-nav button').forEach((btn, i) => {
            if (i === RC.currentChapter) {
                btn.classList.add('bg-amber-500/20', 'text-amber-400', 'font-bold');
                btn.classList.remove('text-dim');
            } else {
                btn.classList.remove('bg-amber-500/20', 'text-amber-400', 'font-bold');
                btn.classList.add('text-dim');
            }
        });
    },

    // ═══════════════════════════════════════════════════════════
    // 实体自动提取与关联
    // ═══════════════════════════════════════════════════════════
    extractEntitiesFromBook: async (bookId) => {
        const RC = Modules.reader_center;
        const book = await DB.get('library_books', bookId);
        if (!book) return [];
        const content = book.content || '';
        const slice = content.slice(0, 8000);
        const prompt = `请从以下文本中提取所有重要实体，按类型分类输出JSON格式：

文本：
${slice}

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

只输出JSON，不要其他内容。`;

        try {
            const result = await AI.generate(prompt);
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const entities = JSON.parse(jsonMatch[0]);
                const flatEntities = [];
                for (const [type, items] of Object.entries(entities)) {
                    if (Array.isArray(items)) {
                        items.forEach(item => {
                            if (item.name) {
                                flatEntities.push({
                                    name: item.name,
                                    type,
                                    desc: item.desc || '',
                                    source: 'reader_extract',
                                    bookId,
                                    bookName: book.name
                                });
                            }
                        });
                    }
                }
                RC._extractedEntities = flatEntities;
                return flatEntities;
            }
        } catch (e) {
            console.error('实体提取失败:', e);
        }
        return [];
    },

    injectEntitiesToWorld: async () => {
        const RC = Modules.reader_center;
        const entities = RC._extractedEntities;
        if (!entities || entities.length === 0) {
            return UI.toast('没有可注入的实体，请先提取');
        }
        if (!Modules.world_engine) {
            return UI.toast('世界引擎未加载');
        }
        await Modules.world_engine._ensureCache();
        const existingEntities = Modules.world_engine._cachedEntities || [];
        const existingNameMap = new Map();
        existingEntities.forEach(e => {
            if (e.name) {
                existingNameMap.set(e.name.toLowerCase().trim(), e);
            }
        });
        // 检测当前书籍中的循环标记，为实体附加 cycleIds
        let bookCycleIds = [];
        if (RC.currentBook && RC.currentBook.content) {
            const cycleMatches = RC.currentBook.content.match(/【循环[\d]+-[\d]+】/g);
            if (cycleMatches) {
                bookCycleIds = [...new Set(cycleMatches.map(m => m.replace(/[【】]/g, '')))];
            }
        }
        let addedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        const now = Date.now();
        for (const ent of entities) {
            if (!ent.name) continue;
            const normalizedName = ent.name.toLowerCase().trim();
            const existingEntity = existingNameMap.get(normalizedName);
            const cycleIds = bookCycleIds.length > 0 ? bookCycleIds : (ent.cycleIds || []);
            if (existingEntity) {
                if (existingEntity.desc !== ent.desc || existingEntity.type !== ent.type) {
                    const entityData = {
                        id: existingEntity.id,
                        name: ent.name,
                        type: ent.type || existingEntity.type || '其他',
                        desc: ent.desc || existingEntity.desc,
                        relations: existingEntity.relations || [],
                        source: existingEntity.source || 'reader_extract',
                        cycleIds: cycleIds.length > 0 ? cycleIds : (existingEntity.cycleIds || []),
                        updatedAt: now
                    };
                    await DB.put('entities', entityData);
                    updatedCount++;
                } else {
                    skippedCount++;
                }
            } else {
                const id = 'reader_' + Utils.uuid();
                const entityData = {
                    id,
                    name: ent.name,
                    type: ent.type || '其他',
                    desc: ent.desc || '',
                    relations: [],
                    source: 'reader_extract',
                    cycleIds: cycleIds,
                    updatedAt: now
                };
                await DB.put('entities', entityData);
                addedCount++;
            }
        }
        Modules.world_engine._cachedEntities = null;
        let message = `实体注入完成！新增: ${addedCount}，更新: ${updatedCount}`;
        if (skippedCount > 0) message += `，跳过: ${skippedCount}`;
        UI.toast(message);
        RC._extractedEntities = [];
    },

    // ═══════════════════════════════════════════════════════════
    // NEXUS 阅读面板 & 选中文本分析
    // ═══════════════════════════════════════════════════════════
    _toggleNexusPanel: () => {
        const RC = Modules.reader_center;
        RC._nexusPanelOpen = !RC._nexusPanelOpen;
        const panel = document.getElementById('rc-nexus-panel');
        const icon = document.getElementById('rc-nexus-toggle-icon');
        if (panel) {
            if (RC._nexusPanelOpen) {
                panel.classList.remove('translate-x-full');
                panel.classList.add('translate-x-0');
            } else {
                panel.classList.add('translate-x-full');
                panel.classList.remove('translate-x-0');
            }
        }
        if (icon) icon.className = RC._nexusPanelOpen ? 'fa-solid fa-chevron-right' : 'fa-solid fa-chevron-left';
    },

    _renderNexusPanel: async (cycleData) => {
        const RC = Modules.reader_center;
        const container = document.getElementById('rc-nexus-content');
        if (!container) return;
        if (!cycleData) {
            container.innerHTML = `<div class="text-[10px] text-dim text-center py-4">未检测到循环标记<br><span class="text-[9px] opacity-50">滚动到含【循环X-Y】的段落以激活</span></div>`;
            return;
        }
        const { cycleId, chr, wld, foe, emo } = cycleData;
        const chrItems = (chr || []).map(c => `<div class="text-[9px] text-gray-300 truncate"><span class="text-amber-500/80">●</span> ${c}</div>`).join('') || '<div class="text-[9px] text-dim italic">无数据</div>';
        const wldItems = (wld || []).map(w => `<div class="text-[9px] text-gray-300 truncate"><span class="text-blue-500/80">●</span> ${w}</div>`).join('') || '<div class="text-[9px] text-dim italic">无数据</div>';
        const foeItems = (foe || []).map(f => `<div class="text-[9px] text-gray-300 truncate"><span class="text-purple-500/80">●</span> ${f}</div>`).join('') || '<div class="text-[9px] text-dim italic">无数据</div>';
        const emoItems = (emo || []).map(e => `<div class="text-[9px] text-gray-300 truncate"><span class="text-rose-500/80">●</span> ${e}</div>`).join('') || '<div class="text-[9px] text-dim italic">无数据</div>';
        container.innerHTML = `
            <div class="space-y-2">
                <div class="p-2 bg-[#08080a] rounded border border-white/5">
                    <div class="flex items-center gap-1.5 text-[10px] font-bold text-amber-500 mb-1">
                        <i class="fa-solid fa-rotate text-[9px]"></i>当前循环
                    </div>
                    <div class="text-[11px] text-white font-mono">${cycleId}</div>
                </div>
                <div class="p-2 bg-[#08080a] rounded border border-white/5">
                    <div class="flex items-center gap-1.5 text-[10px] font-bold text-amber-500 mb-1">
                        <i class="fa-solid fa-user text-[9px]"></i>CHR 角色状态
                    </div>
                    <div class="space-y-0.5">${chrItems}</div>
                </div>
                <div class="p-2 bg-[#08080a] rounded border border-white/5">
                    <div class="flex items-center gap-1.5 text-[10px] font-bold text-blue-500 mb-1">
                        <i class="fa-solid fa-globe text-[9px]"></i>WLD 世界规则
                    </div>
                    <div class="space-y-0.5">${wldItems}</div>
                </div>
                <div class="p-2 bg-[#08080a] rounded border border-white/5">
                    <div class="flex items-center gap-1.5 text-[10px] font-bold text-purple-500 mb-1">
                        <i class="fa-solid fa-network-wired text-[9px]"></i>FOE 伏笔网络
                    </div>
                    <div class="space-y-0.5">${foeItems}</div>
                </div>
                <div class="p-2 bg-[#08080a] rounded border border-white/5">
                    <div class="flex items-center gap-1.5 text-[10px] font-bold text-rose-500 mb-1">
                        <i class="fa-solid fa-heart-pulse text-[9px]"></i>EMO 情绪锚点
                    </div>
                    <div class="space-y-0.5">${emoItems}</div>
                </div>
            </div>`;
    },

    _detectCycleOnScroll: async (scrollTop) => {
        const RC = Modules.reader_center;
        const container = document.getElementById('rc-reader-container');
        if (!container || !RC.currentBook) return;
        const contentEl = document.getElementById('rc-reader-content');
        if (!contentEl) return;
        // 找到当前视口中心的段落
        const centerY = scrollTop + container.clientHeight / 2;
        const paragraphs = Array.from(contentEl.querySelectorAll('p, h1, h2, h3'));
        let target = null;
        for (const p of paragraphs) {
            const top = p.offsetTop;
            const bottom = top + p.offsetHeight;
            if (centerY >= top && centerY <= bottom) {
                target = p;
                break;
            }
        }
        if (!target) return;
        const text = target.innerText || '';
        const match = text.match(/【循环([\d]+-[\d]+)】/);
        if (match) {
            const cycleId = match[1];
            if (RC._currentCycleId !== cycleId) {
                RC._currentCycleId = cycleId;
                try {
                    const cycleData = await DB.get('cycles', cycleId);
                    if (cycleData) {
                        await RC._renderNexusPanel(cycleData);
                    } else {
                        await RC._renderNexusPanel({
                            cycleId,
                            chr: ['未入库，请在循环编辑器中补全'],
                            wld: ['未入库，请在循环编辑器中补全'],
                            foe: ['未入库，请在循环编辑器中补全'],
                            emo: ['未入库，请在循环编辑器中补全']
                        });
                    }
                } catch (e) {
                    await RC._renderNexusPanel({
                        cycleId,
                        chr: [], wld: [], foe: [], emo: []
                    });
                }
            }
        } else {
            if (RC._currentCycleId !== null) {
                RC._currentCycleId = null;
                RC._renderNexusPanel(null);
            }
        }
    },

    _bindSelectionListener: () => {
        const RC = Modules.reader_center;
        const container = document.getElementById('rc-reader-container');
        if (!container) return;
        container.onmouseup = (e) => {
            if (RC._selectionPopupTimer) clearTimeout(RC._selectionPopupTimer);
            RC._selectionPopupTimer = setTimeout(() => {
                const sel = window.getSelection();
                const text = sel ? sel.toString().trim() : '';
                const popup = document.getElementById('rc-selection-popup');
                if (!popup) return;
                if (text.length > 0 && text.length < 2000) {
                    const rect = sel.getRangeAt(0).getBoundingClientRect();
                    const readerRect = document.getElementById('rc-reader-view').getBoundingClientRect();
                    popup.style.left = (rect.left - readerRect.left + rect.width / 2 - popup.offsetWidth / 2) + 'px';
                    popup.style.top = (rect.top - readerRect.top - popup.offsetHeight - 8) + 'px';
                    popup.classList.remove('hidden');
                    popup.dataset.selectedText = text;
                } else {
                    popup.classList.add('hidden');
                }
            }, 200);
        };
        container.onmousedown = () => {
            const popup = document.getElementById('rc-selection-popup');
            if (popup) popup.classList.add('hidden');
        };
    },

    analyzeSelection: async (mode) => {
        const RC = Modules.reader_center;
        const popup = document.getElementById('rc-selection-popup');
        const text = popup ? popup.dataset.selectedText : '';
        if (!text) return UI.toast('未检测到选中文本');
        const modal = document.getElementById('rc-analysis-modal');
        const title = document.getElementById('rc-analysis-title');
        const body = document.getElementById('rc-analysis-body');
        if (!modal || !body) return;
        const modeNames = { technique: '技法拆解', entity: '实体提取', nexus: 'NEXUS 标注' };
        if (title) title.innerText = modeNames[mode] || '分析结果';
        body.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-amber-500 mr-1"></i>分析中...';
        modal.classList.remove('hidden');
        const prompts = {
            technique: `请对以下文本进行技法拆解分析，要求：\n1. 识别修辞手法（比喻、拟人、排比等）\n2. 分析叙事视角和节奏\n3. 指出人物塑造技巧\n4. 提取可学习的写作技法\n\n文本：\n${text}`,
            entity: `请从以下文本中提取所有重要实体（人物、地点、物品、势力等），并给出简要描述和相互关系：\n\n${text}`,
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

    // ═══════════════════════════════════════════════════════════
    // 与世界引擎联动（纯分析，不导入）
    // ═══════════════════════════════════════════════════════════

    // ═══════════════════════════════════════════════════════════
    // 三层记忆集成
    // ═══════════════════════════════════════════════════════════
    buildReadingContext: async (query, options = {}) => {
        const RC = Modules.reader_center;
        const {
            maxTokens = 4000,
            includeMemory = true,
            includeRAG = true,
            includeEntities = true
        } = options;
        let context = '';
        if (includeMemory && Modules.memory) {
            try {
                const memCtx = await Modules.memory.buildBrainContext(query, {
                    moduleName: 'reader_center',
                    maxTokens: 1500,
                    includeWorking: true,
                    includePersistent: true,
                    includeRAG: false
                });
                if (memCtx) context += '【记忆上下文】\n' + memCtx + '\n\n';
            } catch (e) {}
        }
        if (includeRAG && typeof RAGSystem !== 'undefined') {
            try {
                const ragCtx = await RAGSystem.buildEnhancedContext(query, {
                    moduleName: 'reader_center',
                    maxTokens: 1500
                });
                if (ragCtx) context += '【RAG检索】\n' + ragCtx + '\n\n';
            } catch (e) {}
        }
        if (includeEntities && RC.bookEntities.length > 0) {
            const entityCtx = RC.bookEntities.slice(0, 20).map(e => 
                `[${e.type}] ${e.name}: ${e.desc || ''}`
            ).join('\n');
            context += '【相关实体】\n' + entityCtx + '\n\n';
        }
        if (RC.currentBook) {
            const bookCtx = RC.currentBook.content.slice(0, 2000);
            context += '【当前书籍片段】\n' + bookCtx + '\n\n';
        }
        return context.slice(0, maxTokens);
    },

    recordToMemory: async (type, content, metadata = {}) => {
        const RC = Modules.reader_center;
        if (!Modules.memory) return;
        try {
            if (type === 'chapter') {
                await Modules.memory.addChapterMemory(
                    metadata.chapterId || 'unknown',
                    content,
                    {
                        bookId: RC.currentBook?.id,
                        bookName: RC.currentBook?.name,
                        ...metadata
                    }
                );
            } else if (type === 'entity') {
                await Modules.memory.addEntityMemory(
                    metadata.entityName || 'unknown',
                    content,
                    metadata.entityType || '其他'
                );
            } else {
                await Modules.memory.add('reader_center', content, {
                    type,
                    bookId: RC.currentBook?.id,
                    bookName: RC.currentBook?.name,
                    ...metadata
                });
            }
        } catch (e) {
            console.log('记忆记录失败:', e);
        }
    },

    // ═══════════════════════════════════════════════════════════
    // 阅读统计与洞察
    // ═══════════════════════════════════════════════════════════
    analyzeReadingStats: async () => {
        const RC = Modules.reader_center;
        if (!RC.currentBook) return null;
        const content = RC.currentBook.content || '';
        const stats = {
            totalWords: content.length,
            totalChapters: RC.chapters.length,
            avgChapterLen: RC.chapters.length > 0 ? Math.round(content.length / RC.chapters.length) : content.length,
            readingTime: Math.round(content.length / 500),
            paragraphs: (content.match(/\n{2,}|\r\n\r\n/g) || []).length + 1,
            sentences: (content.match(/[。！？\.\!\?]/g) || []).length,
            dialogues: (content.match(/["「」『』""]/g) || []).length / 2,
            entities: RC._extractedEntities.length,
            relations: 0
        };
        RC.readingStats = stats;
        return stats;
    },

    renderStatsPanel: () => {
        const RC = Modules.reader_center;
        const s = RC.readingStats;
        return `
            <div class="p-3 bg-black/20 rounded-lg border border-white/5">
                <div class="text-[10px] font-bold text-amber-400 mb-2"><i class="fa-solid fa-chart-bar mr-1"></i>阅读统计</div>
                <div class="grid grid-cols-2 gap-2 text-[9px]">
                    <div class="flex justify-between"><span class="text-dim">总字数</span><span class="text-white font-mono">${s.totalWords?.toLocaleString() || 0}</span></div>
                    <div class="flex justify-between"><span class="text-dim">章节数</span><span class="text-white font-mono">${s.totalChapters || 0}</span></div>
                    <div class="flex justify-between"><span class="text-dim">平均章节</span><span class="text-white font-mono">${s.avgChapterLen?.toLocaleString() || 0}字</span></div>
                    <div class="flex justify-between"><span class="text-dim">预计阅读</span><span class="text-white font-mono">${s.readingTime || 0}分钟</span></div>
                    <div class="flex justify-between"><span class="text-dim">段落数</span><span class="text-white font-mono">${s.paragraphs || 0}</span></div>
                    <div class="flex justify-between"><span class="text-dim">对话数</span><span class="text-white font-mono">${Math.round(s.dialogues || 0)}</span></div>
                    <div class="flex justify-between"><span class="text-dim">提取实体</span><span class="text-amber-400 font-mono">${s.entities || 0}</span></div>
                    <div class="flex justify-between"><span class="text-dim">句数</span><span class="text-white font-mono">${s.sentences || 0}</span></div>
                </div>
            </div>`;
    },

    // ═══════════════════════════════════════════════════════════
    // 智能推荐与创作联动
    // ═══════════════════════════════════════════════════════════
    smartSuggest: async () => {
        const RC = Modules.reader_center;
        if (!RC.currentBook) return;
        const content = RC.currentBook.content.slice(0, 5000);
        const prompt = `分析以下文本，给出创作建议：

${content}

请从以下角度分析：
1. 写作风格特点（叙事节奏、语言风格、视角运用）
2. 可借鉴的技法（开头钩子、悬念设置、人物塑造）
3. 潜在改进点（节奏调整、细节补充、逻辑优化）
4. 创作灵感延伸（相似题材、变体方向、融合建议）

简洁输出，每项2-3条。`;

        const log = document.getElementById('rc-ai-log');
        if (log) {
            log.innerHTML += `<div class="p-2 bg-white/5 rounded text-[10px] text-dim"><i class="fa-solid fa-spinner fa-spin mr-1 text-amber-500"></i>智能分析中...</div>`;
        }
        try {
            const result = await AI.generate(prompt);
            if (log) {
                log.innerHTML += `
                    <div class="p-2 bg-gradient-to-br from-purple-900/20 to-transparent border border-purple-500/20 rounded-lg text-[10px] text-gray-300 leading-relaxed">
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-purple-400 font-bold text-[9px]"><i class="fa-solid fa-lightbulb mr-1"></i>创作建议</span>
                            <button class="text-dim hover:text-white" onclick="Utils.copy(this.closest('.p-2').querySelector('.ai-suggest-text').innerText);UI.toast('已复制')"><i class="fa-solid fa-copy"></i></button>
                        </div>
                        <div class="ai-suggest-text whitespace-pre-wrap">${typeof marked !== 'undefined' ? marked.parse(result) : result}</div>
                    </div>`;
                log.scrollTop = log.scrollHeight;
            }
        } catch (e) {
            if (log) {
                log.innerHTML += `<div class="p-2 bg-red-900/20 border border-red-500/20 rounded text-[10px] text-red-400">分析失败: ${e.message}</div>`;
            }
        }
    },

    extractToCreation: async (type) => {
        const RC = Modules.reader_center;
        if (!RC.currentBook) return UI.toast('请先打开一本书');
        const content = RC.currentBook.content.slice(0, 6000);
        const prompts = {
            outline: `从以下文本中提取故事大纲结构，输出为可用的创作框架：\n\n${content}\n\n要求：\n1. 提取核心故事线\n2. 列出关键转折点\n3. 标注高潮和结局\n4. 输出为Markdown格式的大纲`,
            characters: `从以下文本中提取人物设定模板：\n\n${content}\n\n要求：\n1. 提取主要人物的性格特征\n2. 分析人物关系网络\n3. 总结人物塑造手法\n4. 输出可直接使用的人物卡模板`,
            worldbuilding: `从以下文本中提取世界观设定：\n\n${content}\n\n要求：\n1. 提取核心设定规则\n2. 列出势力/组织体系\n3. 总结魔法/科技体系\n4. 输出为世界观设定文档`,
            techniques: `分析以下文本的写作技法：\n\n${content}\n\n要求：\n1. 分析叙事技巧\n2. 总结对话写法\n3. 提取场景描写手法\n4. 输出技法总结和示例`
        };
        const prompt = prompts[type] || prompts.outline;
        const log = document.getElementById('rc-ai-log');
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
                    <div class="p-2 bg-gradient-to-br from-green-900/20 to-transparent border border-green-500/20 rounded-lg text-[10px] text-gray-300 leading-relaxed">
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-green-400 font-bold text-[9px]"><i class="fa-solid fa-file-export mr-1"></i>提取结果</span>
                            <div class="flex gap-1">
                                <button class="text-dim hover:text-white" onclick="Utils.copy(this.closest('.p-2').querySelector('.ai-extract-text').innerText);UI.toast('已复制')"><i class="fa-solid fa-copy"></i></button>
                                <button class="text-dim hover:text-amber-400" onclick="App.nav('phoenix')">前往凤凰流</button>
                            </div>
                        </div>
                        <div class="ai-extract-text whitespace-pre-wrap">${typeof marked !== 'undefined' ? marked.parse(result) : result}</div>
                    </div>`;
                log.scrollTop = log.scrollHeight;
            }
        } catch (e) {
            if (log) {
                log.innerHTML += `<div class="p-2 bg-red-900/20 border border-red-500/20 rounded text-[10px] text-red-400">提取失败: ${e.message}</div>`;
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
            const result = await AI.generate(`翻译以下中文为英文，保持文学性：\n\n${text}`);
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
        const prompt = `${context}\n\n请解释以下选中文本的含义、背景和写作手法：\n\n"${text}"`;
        const log = document.getElementById('rc-ai-log');
        if (log) {
            log.innerHTML += `<div class="p-2 bg-white/5 rounded text-[10px] text-dim"><i class="fa-solid fa-spinner fa-spin mr-1 text-amber-500"></i>解释中...</div>`;
        }
        try {
            const result = await AI.generate(prompt);
            if (log) {
                log.innerHTML += `
                    <div class="p-2 bg-white/5 border border-white/10 rounded-lg text-[10px] text-gray-300 leading-relaxed">
                        <div class="text-amber-400 font-bold text-[9px] mb-1"><i class="fa-solid fa-quote-left mr-1"></i>文本解释</div>
                        <div class="text-dim italic mb-2 line-clamp-2">"${text}"</div>
                        <div class="whitespace-pre-wrap">${typeof marked !== 'undefined' ? marked.parse(result) : result}</div>
                    </div>`;
                log.scrollTop = log.scrollHeight;
            }
        } catch (e) {
            if (log) {
                log.innerHTML += `<div class="p-2 bg-red-900/20 rounded text-[10px] text-red-400">解释失败</div>`;
            }
        }
    },

    quickContinue: async () => {
        const RC = Modules.reader_center;
        if (!RC.currentBook) return UI.toast('请先打开一本书');
        const content = RC.currentBook.content || '';
        const lastPart = content.slice(-3000);
        const context = await RC.buildReadingContext(lastPart, { maxTokens: 2000 });
        const prompt = `${context}\n\n请根据上文续写500字左右，保持相同的风格和叙事节奏：`;
        const log = document.getElementById('rc-ai-log');
        if (log) {
            log.innerHTML += `<div class="p-2 bg-white/5 rounded text-[10px] text-dim"><i class="fa-solid fa-spinner fa-spin mr-1 text-amber-500"></i>续写中...</div>`;
        }
        try {
            const result = await AI.generate(prompt);
            if (log) {
                log.innerHTML += `
                    <div class="p-2 bg-gradient-to-br from-cyan-900/20 to-transparent border border-cyan-500/20 rounded-lg text-[10px] text-gray-300 leading-relaxed">
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-cyan-400 font-bold text-[9px]"><i class="fa-solid fa-pen-fancy mr-1"></i>续写结果</span>
                            <div class="flex gap-1">
                                <button class="text-dim hover:text-white" onclick="Utils.copy(this.closest('.p-2').querySelector('.ai-continue-text').innerText);UI.toast('已复制')"><i class="fa-solid fa-copy"></i></button>
                                <button class="text-dim hover:text-amber-400" onclick="ContextHelper.exportToLibrary('续写_${RC.currentBook?.name||''}',this.closest('.p-2').querySelector('.ai-continue-text').innerText);UI.toast('已存书架')"><i class="fa-solid fa-book"></i></button>
                            </div>
                        </div>
                        <div class="ai-continue-text whitespace-pre-wrap">${result}</div>
                    </div>`;
                log.scrollTop = log.scrollHeight;
            }
            RC.recordToMemory('generation', result, { type: 'continuation' });
        } catch (e) {
            if (log) {
                log.innerHTML += `<div class="p-2 bg-red-900/20 rounded text-[10px] text-red-400">续写失败</div>`;
            }
        }
    },

    // ═══════════════════════════════════════════════════════════
    // 与世界引擎联动（纯分析，不导入）
    // ═══════════════════════════════════════════════════════════
    linkToWorldEngine: async () => {
        const RC = Modules.reader_center;
        if (!RC.currentBook) return UI.toast('请先打开一本书');
        if (!Modules.world_engine) return UI.toast('世界引擎未加载');
        await RC.extractEntitiesFromBook(RC.currentBook.id);
        if (RC._extractedEntities.length > 0) {
            const confirmed = confirm(`发现 ${RC._extractedEntities.length} 个实体，是否注入世界引擎？`);
            if (confirmed) {
                await RC.injectEntitiesToWorld();
            }
        } else {
            UI.toast('未发现可提取的实体');
        }
    },

    pullFromWorldEngine: async () => {
        const RC = Modules.reader_center;
        if (!Modules.world_engine) return;
        await Modules.world_engine._ensureCache();
        const entities = Modules.world_engine._cachedEntities || [];
        RC.bookEntities = entities.filter(e => !e.id.startsWith('world_')).slice(0, 50);
        UI.toast(`已加载 ${RC.bookEntities.length} 个实体`);
    }
});
