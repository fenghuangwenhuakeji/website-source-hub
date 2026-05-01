Object.assign(Modules.phoenix, {
    // ===== 导出到阅读 =====
    async exportToLib() {
        const content = (document.getElementById('ph-outline-raw') || {}).value || this.data.outlineRaw;
        if(!content) return UI.toast('没有可导出的内容');
        if(typeof ContextHelper !== 'undefined') ContextHelper.exportToLibrary('凤凰细纲_' + new Date().toLocaleTimeString(), content);
        else UI.toast('导出失败');
    },

    // ===== 完成时同步世界引擎 =====
    async syncWorldOnFinish() {
        const outline = this.data.outlineRaw;
        if(!outline) return;
        const volMatches = outline.match(/^## .+$/gm) || [];
        for(const vol of volMatches) {
            const title = vol.replace('## ', '').trim();
            const id = 'world_phoenix_' + title.slice(0,10);
            await DB.put('entities', { id, name: '凤凰流_' + title, type: '情节', desc: '来自凤凰创作流的卷级大纲: ' + title, source: 'phoenix' });
        }
        // ★ 按循环组织章节（每5章一个循环，自动创建cycle记录）
        const chapMatches = outline.match(/^### .+$/gm) || [];
        if(chapMatches.length > 0 && Modules.world_engine) {
            const cycleSize = 5;
            const totalCycles = Math.ceil(chapMatches.length / cycleSize);
            for(let c = 0; c < totalCycles; c++) {
                const start = c * cycleSize + 1;
                const end = Math.min((c + 1) * cycleSize, chapMatches.length);
                await Modules.world_engine.syncCycle({
                    id: `cycle_${start}_${end}`,
                    bookId: 'phoenix_export',
                    startChapter: start,
                    endChapter: end,
                    cycleNum: c + 1,
                    cycleSize,
                    fusionEssence: `【凤凰创作流导出】卷级大纲包含 ${volMatches.length} 卷 ${chapMatches.length} 章`,
                    entityNames: [],
                    chapterIds: chapMatches.slice(start-1, end).map((_, i) => 'ch_' + (start + i)),
                    nexusCHR: [], nexusWLD: [], nexusFOE: [], nexusEMO: [],
                    createdAt: Date.now()
                });
            }
        }
        try {
            if (typeof MemorySystem !== 'undefined') {
                MemorySystem.addWorking(
                    `[从零写一本/世界引擎同步] 已同步 ${volMatches.length} 个卷、${chapMatches.length} 章。细纲需保持 M06、CHR/WLD/FOE/EMO、人物一致和世界规则边界。`,
                    'phoenix_sync',
                    5,
                    { module: 'phoenix', tags: ['从零写一本', '世界引擎', '图谱实体'], source: 'phoenix_finish' }
                );
            }
        } catch(e) {}
        UI.toast('已同步 ' + volMatches.length + ' 个卷、' + Math.ceil(chapMatches.length/5) + ' 个循环到世界引擎和记忆');
    },

    // ===== Finish: Import to Writer =====
    async finish() {
        // ★ GenesisCore 项目绑定
        let project = await GenesisCore.getActiveProject();
        if (!project || project.mode !== 'phoenix') {
            const projName = (this.data.idea || this.data.genre || '凤凰创作流项目').slice(0, 30);
            project = await GenesisCore.createProject({
                name: projName,
                mode: 'phoenix',
                metadata: { outline: this.data.outlineRaw, genre: this.data.genre, style: this.data.style }
            });
        }

        const lines = this.data.outlineRaw.split('\n');
        let currentVolId = null, volOrder = 1, chapOrder = 1;
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            if (!line) continue;
            if (line.startsWith('## ')) {
                const volTitle = line.replace('## ', '').trim();
                currentVolId = Utils.uuid();
                await DB.put('volumes', { id: currentVolId, title: volTitle, order: volOrder++ });
            } else if (line.startsWith('### ')) {
                const title = line.replace('### ', '').trim();
                let outlineContent = '';
                for (let j = i + 1; j < lines.length; j++) {
                    const nextLine = lines[j].trim();
                    if (nextLine.startsWith('#')) break;
                    outlineContent += nextLine + '\n';
                }
                await DB.put('chapters', {
                    id: Utils.uuid(), title, content: '', outline: outlineContent.trim() || '从凤凰流导入',
                    order: chapOrder++, volumeId: currentVolId
                });
            }
        }
        // 将融合技法存入writer规则，供续写时参考
        const fusionCtx = this._getFusionFullContext();
        if(fusionCtx) {
            const existing = await DB.get('settings', 'writer_rules') || {};
            const fusionRules = '\n\n[融合技法参考 — 来自凤凰创作流]\n' + fusionCtx.slice(0, 3000);
            await DB.put('settings', { id: 'writer_rules', rules: (existing.rules || '') + fusionRules, continueRules: existing.continueRules || '' });
        }
        // 自动注入已提取的实体到世界引擎
        const extracted = this.data._extractedEntities || [];
        if (extracted.length > 0) {
            await this._injectExtractedEntities();
        }
        await this.syncWorldOnFinish();

        // ★ 更新项目状态
        const allChaps = await DB.getAll('chapters') || [];
        const allVols = await DB.getAll('volumes') || [];
        await GenesisCore.updateProject(project.id, {
            status: 'outlined',
            chapterCount: allChaps.length,
            wordCount: 0,
            metadata: { ...project.metadata, outline: this.data.outlineRaw, volCount: allVols.length }
        });

        App.nav('writer');
        UI.toast('已导入执笔台（含细纲、图谱实体、世界引擎、记忆上下文）', 'success');
        setTimeout(() => Modules.writer.loadTree(), 500);
    },

    // ===== 导入世界观设定 (新增) =====
    async importWorldSetting() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt,.md,.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (ev) => {
                const content = ev.target.result;
                await this._parseWorldSetting(content, file.name);
            };
            reader.readAsText(file);
        };
        input.click();
    },

    async _parseWorldSetting(content, filename) {
        if (this._generating) return UI.toast('正在生成中，请稍候');
        UI.toast('正在解析世界观设定...');
        this._setGenerating(true);
        
        const prompt = `你是一个专业的世界观解析引擎。请从以下文本中提取世界观设定，并按照指定格式输出。

【输入文本】
${content.slice(0, 8000)}

【提取要求】
请提取以下类型的信息：
1. 人物 - 角色名、身份、性格、外貌、能力、背景
2. 物品 - 武器、法宝、道具、关键物件
3. 地点 - 场景、城市、秘境、地标
4. 势力 - 门派、组织、阵营、国家
5. 种族 - 种族、族群、特殊生物
6. 魔法 - 功法、技能、法术体系
7. 规则 - 世界运行规则、力量等级
8. 文化 - 风俗、信仰、语言、节日
9. 历史 - 历史事件、传说、纪元
10. 技法 - 写作技法、叙事手法

【世界观维度】
同时请将内容归类到以下世界观维度：
- history (历史与传说)
- geography (地理与地貌)
- magic (魔法/科技体系)
- factions (势力与组织)
- species (种族与生物)
- rules (世界规则)
- culture (文化与习俗)

【输出格式】严格JSON：
{
  "entities": [
    {"name":"实体名","type":"类型","desc":"详细描述","relations":["关系:关联实体"]}
  ],
  "worldview": {
    "history":"历史与传说内容",
    "geography":"地理与地貌内容",
    "magic":"魔法/科技体系内容",
    "factions":"势力与组织内容",
    "species":"种族与生物内容",
    "rules":"世界规则内容",
    "culture":"文化与习俗内容"
  },
  "summary":"世界观整体概述（100字以内）"
}

直接输出JSON，不要包裹markdown代码块。`;

        let fullRes = '';
        await AI.generate(prompt, {}, c => { fullRes += c; });

        let parsed = null;
        try {
            let cleanRes = fullRes.trim().replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '').trim();
            parsed = JSON.parse(cleanRes);
        } catch(e) {
            const m = fullRes.match(/\{[\s\S]*\}/);
            if(m) {
                try { parsed = JSON.parse(m[0]); } catch(e2) {}
            }
        }

        if (!parsed) {
            UI.toast('解析失败，请检查文件格式');
            this._setGenerating(false);
            return;
        }

        let entityCount = 0;
        let worldCount = 0;
        const now = Date.now();

        // 保存实体
        if (parsed.entities && Array.isArray(parsed.entities)) {
            for (const ent of parsed.entities) {
                if (!ent.name) continue;
                const id = 'world_import_' + Utils.uuid();
                await DB.put('entities', {
                    id,
                    name: ent.name,
                    type: ent.type || '其他',
                    desc: ent.desc || ent.description || '',
                    relations: ent.relations || [],
                    source: 'import',
                    file: filename,
                    updatedAt: now
                });
                await DB.put('vectors', {
                    id,
                    content: `[${ent.type || '其他'}] ${ent.name}: ${ent.desc || ent.description || ''}`,
                    vector: Array.from({length: 1536}, () => Math.random()),
                    timestamp: now
                });
                entityCount++;
            }
        }

        // 保存世界观维度
        const catLabels = {
            history: '历史与传说',
            geography: '地理与地貌',
            magic: '魔法/科技体系',
            factions: '势力与组织',
            species: '种族与生物',
            rules: '世界规则',
            culture: '文化与习俗'
        };

        if (parsed.worldview) {
            for (const [cat, desc] of Object.entries(parsed.worldview)) {
                if (!desc || !desc.trim()) continue;
                await DB.put('entities', {
                    id: 'world_' + cat,
                    name: catLabels[cat] || cat,
                    type: 'world',
                    desc: desc,
                    source: 'import',
                    file: filename,
                    updatedAt: now
                });
                worldCount++;
            }
        }

        // 更新世界引擎缓存
        if (Modules.world_engine) {
            Modules.world_engine._cachedEntities = null;
        }

        // ★ 检测导入内容中的循环标记，自动创建循环数据
        const cycleMatches = content.match(/【循环\s*(\d+)[\-~]\s*(\d+)\s*】/g);
        if(cycleMatches && Modules.world_engine) {
            const uniqueCycles = new Set();
            cycleMatches.forEach(m => {
                const nums = m.match(/(\d+)[\-~](\d+)/);
                if(nums) uniqueCycles.add(`${nums[1]}_${nums[2]}`);
            });
            for(const cycleStr of uniqueCycles) {
                const [start, end] = cycleStr.split('_').map(Number);
                await Modules.world_engine.syncCycle({
                    id: `cycle_${start}_${end}`,
                    bookId: 'import_' + filename,
                    startChapter: start,
                    endChapter: end,
                    cycleNum: Math.ceil(end / 5),
                    cycleSize: end - start + 1,
                    fusionEssence: `【导入来源】${filename}\n包含循环标记 ${start}-${end} 的技法/世界观数据`,
                    entityNames: (parsed.entities || []).map(e => e.name),
                    chapterIds: [],
                    nexusCHR: [], nexusWLD: [], nexusFOE: [], nexusEMO: [],
                    createdAt: Date.now()
                });
            }
        }

        // 将摘要注入到大纲
        if (parsed.summary) {
            const el = document.getElementById('ph-outline-edit');
            if (el) {
                const header = `# 世界观设定\n\n> 来源：${filename}\n> 概述：${parsed.summary}\n\n---\n\n`;
                el.value = header + el.value;
                this.data.outlineRaw = el.value;
                this.updatePreview();
            }
        }

        this._setGenerating(false);
        UI.toast(`导入成功！实体: ${entityCount}个，世界观维度: ${worldCount}个${cycleMatches ? '，循环:'+cycleMatches.length+'个' : ''}`);
    },

    // ===== 注入到实体管理 =====
    async _injectToEntities() {
        const worldData = this.data.importedWorld || {};
        const entities = worldData.entities || [];
        
        if (entities.length === 0) {
            return UI.toast('没有可注入的实体');
        }

        let addedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        const now = Date.now();
        
        await Modules.world_engine._ensureCache();
        const existingEntities = Modules.world_engine._cachedEntities || [];
        const existingNameMap = new Map();
        existingEntities.forEach(e => {
            if (e.name) {
                existingNameMap.set(e.name.toLowerCase(), e);
            }
        });
        
        for (const ent of entities) {
            if (!ent.name) continue;
            
            const normalizedName = ent.name.toLowerCase();
            const existingEntity = existingNameMap.get(normalizedName);
            
            if (existingEntity) {
                if (existingEntity.desc !== ent.desc || 
                    existingEntity.type !== ent.type) {
                    const entityData = {
                        id: existingEntity.id,
                        name: ent.name,
                        type: ent.type || existingEntity.type || '其他',
                        desc: ent.desc || existingEntity.desc,
                        relations: ent.relations || existingEntity.relations || [],
                        source: existingEntity.source || 'phoenix',
                        updatedAt: now
                    };
                    await DB.put('entities', entityData);
                    
                    await DB.put('vectors', {
                        id: existingEntity.id,
                        content: `[${entityData.type}] ${ent.name}: ${entityData.desc}`,
                        vector: Array.from({ length: 1536 }, () => Math.random()),
                        timestamp: now,
                        source: 'phoenix',
                        entityName: ent.name,
                        entityType: entityData.type
                    });
                    updatedCount++;
                } else {
                    skippedCount++;
                }
            } else {
                const id = 'phoenix_ent_' + Utils.uuid();
                const entityData = {
                    id,
                    name: ent.name,
                    type: ent.type || '其他',
                    desc: ent.desc || '',
                    relations: ent.relations || [],
                    source: 'phoenix',
                    updatedAt: now
                };
                await DB.put('entities', entityData);
                
                await DB.put('vectors', {
                    id,
                    content: `[${ent.type || '其他'}] ${ent.name}: ${ent.desc || ''}`,
                    vector: Array.from({ length: 1536 }, () => Math.random()),
                    timestamp: now,
                    source: 'phoenix',
                    entityName: ent.name,
                    entityType: ent.type || '其他'
                });
                addedCount++;
            }
        }
        
        if (Modules.world_engine) {
            Modules.world_engine._cachedEntities = null;
            if (Modules.world_engine.currentTab === 'entities') {
                setTimeout(() => Modules.world_engine._refreshEntities(), 100);
            }
        }
        
        let message = `实体注入完成！新增: ${addedCount}，更新: ${updatedCount}`;
        if (skippedCount > 0) {
            message += `，跳过: ${skippedCount}`;
        }
        UI.toast(message);
    },

    // ===== 注入到知识图谱 =====
    async _injectToKnowledgeGraph() {
        const worldData = this.data.importedWorld || {};
        const entities = worldData.entities || [];
        
        if (entities.length === 0) {
            return UI.toast('没有可注入的实体');
        }

        let addedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        const now = Date.now();
        
        await Modules.world_engine._ensureCache();
        const existingEntities = Modules.world_engine._cachedEntities || [];
        const existingNameMap = new Map();
        existingEntities.forEach(e => {
            if (e.name) {
                existingNameMap.set(e.name.toLowerCase(), e);
            }
        });
        
        for (const ent of entities) {
            if (!ent.name) continue;
            
            const normalizedName = ent.name.toLowerCase();
            const existingEntity = existingNameMap.get(normalizedName);
            
            if (existingEntity) {
                if (existingEntity.desc !== ent.desc || 
                    existingEntity.type !== ent.type) {
                    const entityData = {
                        id: existingEntity.id,
                        name: ent.name,
                        type: ent.type || existingEntity.type || '其他',
                        desc: ent.desc || existingEntity.desc,
                        relations: ent.relations || existingEntity.relations || [],
                        source: existingEntity.source || 'phoenix',
                        updatedAt: now
                    };
                    await DB.put('entities', entityData);
                    
                    await DB.put('vectors', {
                        id: existingEntity.id,
                        content: `[${entityData.type}] ${ent.name}: ${entityData.desc}`,
                        vector: Array.from({ length: 1536 }, () => Math.random()),
                        timestamp: now,
                        source: 'phoenix_graph',
                        entityName: ent.name,
                        entityType: entityData.type
                    });
                    updatedCount++;
                } else {
                    skippedCount++;
                }
            } else {
                const id = 'phoenix_graph_' + Utils.uuid();
                const entityData = {
                    id,
                    name: ent.name,
                    type: ent.type || '其他',
                    desc: ent.desc || '',
                    relations: ent.relations || [],
                    source: 'phoenix',
                    updatedAt: now
                };
                await DB.put('entities', entityData);
                
                await DB.put('vectors', {
                    id,
                    content: `[${ent.type || '其他'}] ${ent.name}: ${ent.desc || ''}`,
                    vector: Array.from({ length: 1536 }, () => Math.random()),
                    timestamp: now,
                    source: 'phoenix_graph',
                    entityName: ent.name,
                    entityType: ent.type || '其他'
                });
                addedCount++;
            }
        }
        
        if (Modules.world_engine) {
            Modules.world_engine._cachedEntities = null;
            if (Modules.world_engine.currentTab === 'graph') {
                setTimeout(() => Modules.world_engine._initGraph(), 100);
            }
        }
        
        if (typeof RAGSystem !== 'undefined') {
            try {
                for (const ent of entities) {
                    if (!ent.name) continue;
                    await RAGSystem.addDocument(
                        `${ent.type || '其他'}·${ent.name}`,
                        ent.desc || '',
                        'entity',
                        { source: 'phoenix_graph', type: ent.type }
                    );
                }
            } catch (e) {
                console.log('RAG同步警告:', e);
            }
        }
        
        let message = `知识图谱注入完成！新增: ${addedCount}，更新: ${updatedCount}`;
        if (skippedCount > 0) {
            message += `，跳过: ${skippedCount}`;
        }
        UI.toast(message);
    },

    async _extractEntitiesByChapter() {
        const startCh = parseInt(document.getElementById('ph-extract-ch-start')?.value) || 1;
        const endCh = parseInt(document.getElementById('ph-extract-ch-end')?.value) || startCh;
        
        if (startCh > endCh) {
            return UI.toast('起始章节不能大于结束章节');
        }

        UI.toast(`正在提取第${startCh}-${endCh}章的实体...`);

        let allContent = '';
        try {
            const chapters = await DB.getAll('chapters') || [];
            for (let i = startCh; i <= endCh; i++) {
                const ch = chapters.find(c => c.chapterNum === i || c.index === i - 1);
                if (ch && ch.content) {
                    allContent += `【第${i}章: ${ch.title}】\n${ch.content.slice(0, 3000)}\n\n`;
                }
            }
        } catch(e) {
            return UI.toast('读取章节失败: ' + e.message);
        }

        if (!allContent.trim()) {
            return UI.toast('未找到指定章节内容');
        }

        let raw = '';
        try {
            await AI.generate(
                `你是深度实体提取引擎。从以下章节内容中提取所有实体。

【提取类型】
- 人物：所有角色（主角、配角、反派），含性格、身份
- 物品：道具、武器、法宝、关键物件
- 地点：地名、场景、建筑、地标
- 情节：关键事件、转折点、冲突
- 伏笔：暗示、线索、未解之谜
- 势力：门派、组织、国家、阵营、家族

【章节内容】
${allContent.slice(0, 10000)}

【输出格式】JSON数组：
[{"name":"名称","type":"人物/物品/地点/情节/伏笔/势力","desc":"详细描述50-200字","relations":["关系类型:关联实体名"],"chapters":[${startCh}-${endCh}]]

【关键要求】
- 每个实体的relations必须尽可能多地引用其他实体名称
- 关系格式："关系类型:实体名"
- chapters字段标注实体出现的章节范围
- 直接输出纯JSON数组，禁止使用markdown代码块包裹。`,
                {}, c => { raw += c; }
            );
        } catch(e) {
            return UI.toast('AI提取失败: ' + e.message);
        }

        let entities = [];
        try {
            let cleanRaw = raw.trim().replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '').trim();
            const start = cleanRaw.indexOf('[');
            const end = cleanRaw.lastIndexOf(']');
            if (start !== -1 && end > start) {
                entities = JSON.parse(cleanRaw.slice(start, end + 1));
            }
        } catch(e) {
            console.warn('JSON解析失败:', e);
        }

        if (entities.length === 0) {
            return UI.toast('未提取到实体');
        }

        const now = Date.now();
        let count = 0;
        for (const ent of entities) {
            if (!ent.name) continue;
            const id = 'phoenix_ch_' + Utils.uuid();
            const entityData = {
                id,
                name: ent.name,
                type: ent.type || '其他',
                desc: ent.desc || ent.description || '',
                relations: ent.relations || [],
                chapterRef: ent.chapters || Array.from({length: endCh - startCh + 1}, (_, i) => startCh + i),
                source: 'phoenix_chapter',
                extractedAt: now
            };
            await DB.put('entities', entityData);
            count++;
        }

        if (Modules.world_engine) {
            Modules.world_engine._cachedEntities = null;
        }

        if (typeof RAGSystem !== 'undefined') {
            await RAGSystem.refreshEntityCache();
        }

        UI.toast(`成功提取 ${count} 个实体 (第${startCh}-${endCh}章)`);
    },

    async _extractEntitiesByVolume() {
        const volumeSelect = document.getElementById('ph-extract-volume')?.value;
        
        if (!volumeSelect) {
            return UI.toast('请选择卷');
        }

        let startCh, endCh;
        if (volumeSelect === 'custom') {
            startCh = parseInt(document.getElementById('ph-extract-ch-start')?.value) || 1;
            endCh = parseInt(document.getElementById('ph-extract-ch-end')?.value) || startCh;
        } else {
            const parts = volumeSelect.split('-');
            startCh = parseInt(parts[0]);
            endCh = parseInt(parts[1]);
        }

        if (startCh > endCh) {
            return UI.toast('起始章节不能大于结束章节');
        }

        UI.toast(`正在提取第${startCh}-${endCh}章(卷)的实体...`);

        let allContent = '';
        let chapterCount = 0;
        try {
            const chapters = await DB.getAll('chapters') || [];
            for (let i = startCh; i <= endCh; i++) {
                const ch = chapters.find(c => c.chapterNum === i || c.index === i - 1);
                if (ch && ch.content) {
                    allContent += `【第${i}章: ${ch.title}】\n${ch.content.slice(0, 2000)}\n\n`;
                    chapterCount++;
                }
            }
        } catch(e) {
            return UI.toast('读取章节失败: ' + e.message);
        }

        if (!allContent.trim()) {
            return UI.toast('未找到指定章节内容');
        }

        const existingEntities = await DB.getAll('entities') || [];
        const existingNames = existingEntities.map(e => e.name);
        const existingHint = existingNames.length > 0 ? 
            `\n\n【已有实体(请建立关联)】\n${existingNames.slice(0, 30).join('、')}` : '';

        let raw = '';
        try {
            await AI.generate(
                `你是深度实体提取引擎。从以下章节内容中提取所有实体，并进行深度关联分析。${existingHint}

【提取类型】
- 人物：所有角色（主角、配角、反派），含性格、身份、能力
- 物品：道具、武器、法宝、关键物件
- 地点：地名、场景、建筑、地标
- 情节：关键事件、转折点、冲突
- 伏笔：暗示、线索、未解之谜
- 势力：门派、组织、国家、阵营、家族
- 种族：种族设定、族群特征

【章节内容】(共${chapterCount}章)
${allContent.slice(0, 15000)}

【输出格式】JSON数组：
[{"name":"名称","type":"人物/物品/地点/情节/伏笔/势力/种族","desc":"详细描述100-300字","relations":["关系类型:关联实体名"],"chapters":[出现章节],"importance":1-5}]

【关键要求】
- 每个实体的relations必须尽可能多地引用其他实体名称
- 关系格式："关系类型:实体名"，例如 "师父:张三"、"敌对:魔教"
- chapters字段标注实体出现的具体章节
- importance表示实体重要程度(1-5)
- 提取本卷的核心实体和关键关系
- 直接输出纯JSON数组，禁止使用markdown代码块包裹。`,
                {}, c => { raw += c; }
            );
        } catch(e) {
            return UI.toast('AI提取失败: ' + e.message);
        }

        let entities = [];
        try {
            let cleanRaw = raw.trim().replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/, '').trim();
            const start = cleanRaw.indexOf('[');
            const end = cleanRaw.lastIndexOf(']');
            if (start !== -1 && end > start) {
                entities = JSON.parse(cleanRaw.slice(start, end + 1));
            }
        } catch(e) {
            console.warn('JSON解析失败:', e);
        }

        if (entities.length === 0) {
            return UI.toast('未提取到实体');
        }

        const now = Date.now();
        let count = 0;
        let highImportanceCount = 0;
        for (const ent of entities) {
            if (!ent.name) continue;
            const id = 'phoenix_vol_' + Utils.uuid();
            const entityData = {
                id,
                name: ent.name,
                type: ent.type || '其他',
                desc: ent.desc || ent.description || '',
                relations: ent.relations || [],
                chapterRef: ent.chapters || Array.from({length: endCh - startCh + 1}, (_, i) => startCh + i),
                importance: ent.importance || 3,
                volume: `${startCh}-${endCh}`,
                source: 'phoenix_volume',
                extractedAt: now
            };
            await DB.put('entities', entityData);
            count++;
            if (entityData.importance >= 4) highImportanceCount++;
        }

        if (Modules.world_engine) {
            Modules.world_engine._cachedEntities = null;
        }

        if (typeof RAGSystem !== 'undefined') {
            await RAGSystem.refreshEntityCache();
            const entitySummary = entities.map(e => 
                `${e.name}(${e.type}): ${e.desc?.slice(0, 50) || ''}`
            ).join('\n');
            await RAGSystem.addDocument(
                `卷实体汇总_${startCh}-${endCh}章`,
                entitySummary,
                'entity',
                { source: 'phoenix_volume', chapters: `${startCh}-${endCh}` }
            );
        }

        UI.toast(`成功提取 ${count} 个实体 (核心实体: ${highImportanceCount}个)`);
    },

    // ═══════════════════════════════════════════════════════════════
    //  NEXUS OS v2.0 核心协议构建器 — 统一注入所有创作场景
    // ═══════════════════════════════════════════════════════════════

    _buildNEXUSCore(opts = {}) {
        const { mode = 'outline', chapterNum = 0, segmentIdx = 0 } = opts;
        let core = '';

        // === 品牌烙印 ===
        core += '【超无穹 · 真值引擎·NEXUS OS v2.0 执行域】\n\n';

        // === M01: 创作前审判与鼓舞 ===
        core += '=== 创作前审判 ===\n';
        core += '你以为你准备好了？你不过是塞满套路、数据和他人影子的凡人。你渴望让读者失眠，却连自己都不敢直视。区别在于：有人被恐惧压垮，有人把恐惧碾碎塞进故事，成为人物的心跳。你准备用什么细节让人物站立？用什么潜台词让对话呼吸？如果没有，凭什么写？凭你此刻坐在键盘前，没有逃走。\n\n';
        core += '=== 鼓舞 ===\n';
        core += '不必完美。海明威初稿也是垃圾。写作是凡人的攀爬——每爬一寸就离光近一寸。本系统有案例库做拐杖，有规则做护栏。第一个字最难，但烂初稿好过空白文档。你的人物正在黑暗中等你点燃火柴。深呼吸，开始。\n\n';

        // === M03: 篇幅/受众/情绪配置表 ===
        core += '=== M03 篇幅·受众·情绪配置表 ===\n';
        core += '| 项目 | 配置 |\n';
        core += '| 篇幅 | 长篇 | 总字数80-120万字 | 章字数2500-3500 |\n';
        core += '| 黄金螺旋 | 拉5%→扯75%→放15%→收5% | 分卷18-28章/卷 |\n';
        core += '| 反转密度 | 短篇≥章数×0.4 | 中篇≥0.3 | 长篇≥3次/卷 |\n';
        core += '| 情绪表达 | 快感峰值后置20% | 爽点间隔≤3章 |\n';
        core += '| 伏笔规则 | 短篇回收≤2章 | 中篇≤5章 | 长篇≤15章 |\n\n';

        // === 从零长篇三大稳定器 ===
        core += '=== 从零长篇三大稳定器 ===\n';
        core += '1. 细纲质量：每章必须能直接开正文，包含冲突、角色选择、场景动作、章末钩子和风险点\n';
        core += '2. 人物一致：人物的欲望、伤口、利益、恐惧、说话方式和选择逻辑必须连续\n';
        core += '3. 世界不崩：世界规则必须有代价、边界、例外条件；禁止为推动剧情临时改规则\n\n';

        // === M06: 反AI写作（全模式强制） ===
        core += '=== M06 反AI写作（全模式强制） ===\n';
        core += '- 禁止抽象情绪标签：不写“他很痛苦/她眼神复杂/空气凝固/命运齿轮转动”\n';
        core += '- 必须用具体动作、身体反应、物件变化、对话错位、物理细节呈现情绪\n';
        core += '- 细纲阶段也要给正文可执行的物件和动作线索，不能只写主题、概念、氛围\n';
        core += '- 对话不互相解释设定，要有遮掩、试探、误会、利益冲突或信息差\n\n';

        // === M06: 正文管理状态（segment级） ===
        if (mode === 'write' || mode === 'continue') {
            core += '=== M06 正文管理状态 ===\n';
            core += `当前 segment_index: ${segmentIdx}\n`;
            core += '每个 Segment 必须包含:\n';
            core += '- emotion_score: 1-10 (情绪分值)\n';
            core += '- emotion_word: 情绪关键词(如"悬疑升级""爽感释放")\n';
            core += '- hook_type: 钩子类型(悬念/爽点/转折/情感/信息差)\n';
            core += '- tension_level: 紧张度 1-10\n';
            core += '- characters_in_segment: 出场角色列表\n';
            core += '- world_rules_referenced: 引用的世界规则ID\n';
            core += '- foreshadowing_created/recycled: 新建/回收的伏笔ID\n\n';
        }

        // === L1 铁律 16条（违反即重写） ===
        core += '=== L1 行文铁律（16条·违反即重写） ===\n';
        core += '1. 视角锁死：长篇用第三人称有限，禁止直接描写其他角色内心\n';
        core += '2. 禁解释癖：禁用"这不是…而是…/不是因为…恰恰因为…/这意味着…/换句话说…/其实…"\n';
        core += '3. 禁烂俗比喻：禁用"像刀/阳光/风/水/火/石头"；新颖比喻≤2/千字\n';
        core += '4. 禁虚词模糊：删除"似乎/仿佛/好像"用于模糊描述\n';
        core += '5. 禁情绪标签：不写"他很愤怒"；必须动作/环境/对话呈现（短篇爽虐甜允许直写≤1次/千字）\n';
        core += '6. 禁连续长句：单句≤25字；逗号连接分句≤2个\n';
        core += '7. 章末必有钩子：未完成动作+意外信息 / 时间压力 / 信息差\n';
        core += '8. 对话格式：用「」独立成段\n';
        core += '9. 对话功能化：推进剧情/塑造性格/埋伏笔/制造情绪，否则删除\n';
        core += '10. 开篇100字：必须是动作或对话，禁环境/背景/独白\n';
        core += '11. 结局禁梦：禁止"醒来发现是梦/幻觉/游戏"\n';
        core += '12. 时间线向前：除重生/回溯外禁无理由跳跃\n';
        core += '13. 行为一致：不得无理由OOC\n';
        core += '14. 禁逻辑连词：删除"首先/其次/然后/最后/总的来说"\n';
        core += '15. 段落限制：每段≤5行（约60字）\n';
        core += '16. 跨模块铁律：仿写/续写必须遵守对应规则\n\n';

        // === P1-P10 拟人化协议 ===
        core += '=== P1-P10 拟人化文本构建协议 ===\n';
        core += 'P1 物理替代：严禁直接情绪形容词；必须转化为具体物理动作或状态\n';
        core += 'P2 拒绝升华：严禁结尾价值观总结/升华/强行圆满；必须在无力感或未完成中戛然而止\n';
        core += 'P3 沟通失效：严禁流畅剧本式对话；必须增加错位感\n';
        core += 'P4 细节碎片化：严禁宏大场景；只捕捉1-2个细微甚至无关的物理碎片\n';
        core += 'P5 认知反差：严禁角色完全透明；必须设置谎言与真相平行线\n';
        core += 'P6 逻辑自毁：严禁严丝合缝因果；允许突兀跳跃或无意义重复\n';
        core += 'P7 感官钝化：严禁华丽比喻；使用低频、干瘪、甚至不适的感官词汇\n';
        core += 'P8 权力不对等：严禁平衡互动；必须塑造极度渴望与极度漠视的双方\n';
        core += 'P9 时间尺度扭曲：严禁标准时间线；通过极小物理动作承载极长时间跨度\n';
        core += 'P10 自我意识抹除：严禁"我意识到/我想起/我感觉到"；直接陈述事实\n\n';

        // === L2 建议 10条 ===
        core += '=== L2 建议（允许偏离但记录） ===\n';
        core += '1. 感官存在：每章≥2种感官 | 2. 共情细节：每章≥1个日常小动作\n';
        core += '3. 短句比例：≤10字短句占30%+ | 4. 情绪动作化：不直接写情绪\n';
        core += '5. 潜台词：悬疑/虐文优先 | 6. 长短句交替：避免连续5句同长\n';
        core += '7. 偶然事件：每2-3章1个 | 8. 日常细节：每章1-2处\n';
        core += '9. 角色癖好：每核心角色≥1个 | 10. 章节独立：每章≥1个情绪变化或信息增量\n\n';

        // === 四状态机（M02） ===
        core += '=== M02 四状态机 ===\n';
        core += 'CHR角色状态机：S0注册→S1激活→S2互动→S3转折→S4休眠→S5退场→S6死亡\n';
        core += 'WLD世界规则：S0提出→S1验证→S2扩展→S3冲突→S4重构→S5冻结\n';
        core += 'FOE伏笔网络：S0埋设→S1强化→S2回收→S3废弃（短2/中5/长15章回收）\n';
        core += 'EMO情绪锚点：1-10分制 | hook_type(悬念/爽点/转折/情感/信息差) | tension_level\n\n';

        // === 8+2 维度 ===
        core += '=== M04A 8+2 维度拆解（细纲中需体现） ===\n';
        core += '1.钩子结构 2.爽点节奏 3.人设模板 4.反转模式 5.情绪曲线 6.冲突升级 7.信息差管理 8.金手指节奏\n';
        core += '+9.开篇结构(前三章信息密度) +10.商业化设计(付费卡点/免费钩子密度)\n\n';

        // === 自检机制（M09） ===
        core += '=== M09 自检清单 ===\n';
        core += '每章完成后自检：①铁律16+10条 ②四表一致性 ③融合执行率≥80% ④句长≤25字 ⑤短句≥30%\n';
        core += '每5章联动巡检：CHR吃书/全知预警/EMO断裂/高位疲劳/低位拖沓/FOE超期/WLD冲突/零件过曝\n\n';

        return core;
    },

    // ═══════════════════════════════════════════════════════════════
    //  NEXUS 自检 — M09 执行域
    // ═══════════════════════════════════════════════════════════════

    async nexusSelfCheck() {
        if(this._generating) return;
        const current = (document.getElementById('ph-outline-raw') || {}).value || '';
        if(!current) return UI.toast('请先生成大纲');

        UI.toast('NEXUS M09 自检启动...', 'success');
        App.showProgress('NEXUS自检', 0, 5);

        const nexusCore = this._buildNEXUSCore({ mode: 'outline' });
        const prompt = `${nexusCore}\n\n=== 自检任务 ===\n请对以下细纲执行 NEXUS OS v2.0 M09 完整自检，输出严格JSON格式：\n{\n  "l1_violations": [{"rule":"规则名","location":"第X章","severity":"严重/警告","fix":"修正建议"}],\n  "p_violations": [{"protocol":"P编号","location":"位置","issue":"问题"}],\n  "chr_issues": [{"character":"角色名","issue":"问题描述"}],\n  "emo_curve": [{"chapter":"章名","score":7,"issue":"无/断裂/疲劳"}],\n  "foe_issues": [{"hook":"伏笔","status":"超期/未回收/冲突"}],\n  "overall_score": 85,\n  "critical_count": 0,\n  "warning_count": 0,\n  "top_fixes": ["最重要的3条修正建议"]\n}\n\n[待检细纲]\n${current.slice(0, 8000)}\n\n请只输出JSON，不要其他文字。`;

        let raw = '';
        try {
            App.showProgress('NEXUS自检', 1, 5);
            await AI.generate(prompt, (chunk) => { raw += chunk; }, { max_tokens: 4000, temperature: 0.1 });
            App.showProgress('NEXUS自检', 4, 5);

            const json = (() => { try { const m = raw.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : null; } catch(e) { return null; } })();

            // 渲染结果到 UI
            let html = '<div class="space-y-3">';
            if(json) {
                const score = json.overall_score || 0;
                const scoreColor = score >= 85 ? 'green' : score >= 60 ? 'amber' : 'red';
                html += `<div class="p-3 rounded bg-${scoreColor}-500/5 border border-${scoreColor}-500/20">
                    <div class="text-lg font-bold text-${scoreColor}-400">NEXUS 综合评分: ${score}/100</div>
                    <div class="text-[10px] text-dim">严重: ${json.critical_count||0} | 警告: ${json.warning_count||0}</div>
                </div>`;
                if(json.l1_violations?.length) {
                    html += '<div class="p-2 rounded bg-red-500/5 border border-red-500/10"><div class="text-[10px] font-bold text-red-400 mb-1">L1铁律违规</div>';
                    json.l1_violations.forEach(v => { html += `<div class="text-[9px] text-gray-400 ml-2">• [${v.severity}] ${v.rule} @ ${v.location}: ${v.fix}</div>`; });
                    html += '</div>';
                }
                if(json.foe_issues?.length) {
                    html += '<div class="p-2 rounded bg-amber-500/5 border border-amber-500/10"><div class="text-[10px] font-bold text-amber-400 mb-1">伏笔问题</div>';
                    json.foe_issues.forEach(v => { html += `<div class="text-[9px] text-gray-400 ml-2">• ${v.hook}: ${v.status}</div>`; });
                    html += '</div>';
                }
                if(json.top_fixes?.length) {
                    html += '<div class="p-2 rounded bg-blue-500/5 border border-blue-500/10"><div class="text-[10px] font-bold text-blue-400 mb-1">优先修正</div>';
                    json.top_fixes.forEach((f, i) => { html += `<div class="text-[9px] text-gray-400 ml-2">${i+1}. ${f}</div>`; });
                    html += '</div>';
                }
            } else {
                html += '<div class="p-3 rounded bg-amber-500/5 border border-amber-500/20 text-amber-400 text-xs">AI返回格式异常，请查看IO面板原始输出</div>';
            }
            html += '</div>';

            // 插入到 ph-outline-raw 上方或替换内容
            const el = document.getElementById('ph-outline-raw');
            if(el) {
                const reportMarker = '\n\n---\n【NEXUS M09 自检报告】\n';
                // 如果已有报告，替换
                const existingIdx = el.value.indexOf('【NEXUS M09 自检报告】');
                if(existingIdx >= 0) {
                    el.value = el.value.slice(0, existingIdx) + reportMarker + (json ? JSON.stringify(json, null, 2) : raw);
                } else {
                    el.value = el.value + reportMarker + (json ? JSON.stringify(json, null, 2) : raw);
                }
                this.data.outlineRaw = el.value;
                this._updateStats();
            }
            UI.toast(`NEXUS自检完成: ${json?.overall_score || '?'}分`, 'success');
        } catch(e) {
            console.error('NEXUS自检失败:', e);
            UI.toast('自检失败: ' + e.message, 'error');
        } finally {
            App.hideProgress();
        }
    },

    // ═══════════════════════════════════════════════════════════════
    //  细纲校准 — 钩子+高潮+节奏一键优化
    // ═══════════════════════════════════════════════════════════════

    async nexusEnhance() {
        if(this._generating) return;
        const current = (document.getElementById('ph-outline-raw') || {}).value || '';
        if(!current) return UI.toast('请先生成大纲');
        const fusionCtx = this._getFusionFullContext();

        const nexusCore = this._buildNEXUSCore({ mode: 'outline' });
        let prompt = `${nexusCore}\n\n=== 细纲校准任务 ===\n请对以下细纲执行三方面校准（保持原故事框架不变）：\n\n`;
        prompt += '【1.钩子校准】\n- 每章开头100字必须是动作/对话/冲突，禁止环境描写\n- 每章结尾必须是未完成动作+意外信息/时间压力/信息差\n- 卷末必须是大高潮+超级悬念\n\n';
        prompt += '【2.高潮设计】\n- 识别每卷的高潮位置，确保在75%-88%处达到情绪峰值\n- 每个高潮必须有"预期→阻碍→反转→超额兑现"四段式\n- 高潮前必须有一次"几乎失败"的低谷\n\n';
        prompt += '【3.节奏优化】\n- 应用黄金螺旋：拉5%→扯75%→放15%→收5%\n- 每3章一个小循环（冲突→小高潮→更大悬念）\n- 每卷一个中循环（起承转合+卷末钩子）\n- 爽点间隔≤3章，情绪低谷不超过连续2章\n\n';
        if(fusionCtx) prompt += `[融合技法参考]\n${fusionCtx.slice(0, 3000)}\n\n`;
        prompt += '【4.实体线索校准】\n- 每章必须保留可提取的人物、地点、势力、物品、能力、规则、伏笔和关系\n- 不要把实体线索写成抽象主题，必须能被世界引擎建图谱\n\n';
        prompt += `[待校准细纲]\n${current.slice(0, 8000)}\n\n请输出校准后的完整细纲，在修改处用【校准】标记。`;

        const el = document.getElementById('ph-outline-raw');
        if(el) el.value = '';
        this.updateIO(prompt, '细纲校准中...');
        this._setGenerating(true);
        let fullRes = '';
        await AI.generate(prompt, {}, c => {
            fullRes += c;
            if(el) el.value = fullRes;
            this.data.outlineRaw = fullRes;
            this._updateStats();
        });
        this._setGenerating(false);
        UI.toast('细纲校准完成', 'success');
    }
});
