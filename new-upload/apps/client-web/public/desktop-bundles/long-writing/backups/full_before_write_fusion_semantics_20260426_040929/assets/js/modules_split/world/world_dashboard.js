Object.assign(Modules.world_engine, {

    // ═══════════════════════════════════════════════════════════════
    //  仪表盘 — 世界引擎全景总览
    // ═══════════════════════════════════════════════════════════════

    _renderDashboard() {
        return `
        <div class="flex-1 overflow-y-auto p-6 space-y-6" id="we-dashboard-container">
            <!-- 标题 -->
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex center text-white shadow-lg shadow-amber-500/20">
                    <i class="fa-solid fa-gauge-high text-lg"></i>
                </div>
                <div>
                    <div class="text-lg font-bold text-white">世界引擎仪表盘</div>
                    <div class="text-[11px] text-dim">NEXUS 世界观中枢 · 数据全景</div>
                </div>
            </div>

            <!-- 六宫格数据卡片 -->
            <div class="grid grid-cols-3 gap-4">
                <div class="bg-[#0e0e12] rounded-xl border border-white/5 p-4">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fa-solid fa-earth-americas text-blue-400 text-sm"></i>
                        <span class="text-[10px] text-dim font-bold uppercase">世界观完成度</span>
                    </div>
                    <div class="text-2xl font-bold text-white" id="we-db-world-progress">—</div>
                    <div class="text-[9px] text-dim mt-1">7个维度</div>
                    <div class="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all" id="we-db-world-bar" style="width:0%"></div>
                    </div>
                </div>
                <div class="bg-[#0e0e12] rounded-xl border border-white/5 p-4">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fa-solid fa-users text-amber-400 text-sm"></i>
                        <span class="text-[10px] text-dim font-bold uppercase">实体总数</span>
                    </div>
                    <div class="text-2xl font-bold text-white" id="we-db-entity-count">—</div>
                    <div class="text-[9px] text-dim mt-1" id="we-db-entity-types">—</div>
                </div>
                <div class="bg-[#0e0e12] rounded-xl border border-white/5 p-4">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fa-solid fa-circle-nodes text-purple-400 text-sm"></i>
                        <span class="text-[10px] text-dim font-bold uppercase">分层图谱</span>
                    </div>
                    <div class="text-2xl font-bold text-white" id="we-db-graph-nodes">—</div>
                    <div class="text-[9px] text-dim mt-1" id="we-db-graph-edges">—</div>
                </div>
                <div class="bg-[#0e0e12] rounded-xl border border-white/5 p-4">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fa-solid fa-sync text-cyan-400 text-sm"></i>
                        <span class="text-[10px] text-dim font-bold uppercase">NEXUS循环</span>
                    </div>
                    <div class="text-2xl font-bold text-white" id="we-db-cycle-count">—</div>
                    <div class="text-[9px] text-dim mt-1">每5章一个循环</div>
                </div>
                <div class="bg-[#0e0e12] rounded-xl border border-white/5 p-4">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fa-solid fa-wand-magic-sparkles text-amber-400 text-sm"></i>
                        <span class="text-[10px] text-dim font-bold uppercase">融合技法</span>
                    </div>
                    <div class="text-2xl font-bold text-white" id="we-db-fusion-len">—</div>
                    <div class="text-[9px] text-dim mt-1">拆书精华字数</div>
                </div>
                <div class="bg-[#0e0e12] rounded-xl border border-white/5 p-4">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fa-solid fa-database text-green-400 text-sm"></i>
                        <span class="text-[10px] text-dim font-bold uppercase">向量库</span>
                    </div>
                    <div class="text-2xl font-bold text-white" id="we-db-vector-count">—</div>
                    <div class="text-[9px] text-dim mt-1">RAG语义检索</div>
                </div>
            </div>

            <!-- 五大板块入口 -->
            <div>
                <div class="text-[10px] text-dim font-bold uppercase tracking-wider mb-3">五大板块</div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="group cursor-pointer bg-[#0e0e12] rounded-xl border border-white/5 hover:border-blue-500/30 p-5 transition-all" onclick="Modules.world_engine.switchTab('world')">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="w-10 h-10 rounded-lg bg-blue-500/10 flex center"><i class="fa-solid fa-earth-americas text-blue-400 text-lg"></i></div>
                            <div><div class="font-bold text-white">世界观</div><div class="text-[9px] text-dim">7维设定 + 导入</div></div>
                        </div>
                        <div class="text-[10px] text-gray-400 leading-relaxed">构建你的宇宙：历史、地理、魔法体系、势力、种族、规则、文化。支持AI生成和批量导入。</div>
                    </div>
                    <div class="group cursor-pointer bg-[#0e0e12] rounded-xl border border-white/5 hover:border-amber-500/30 p-5 transition-all" onclick="Modules.world_engine.switchTab('entities')">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="w-10 h-10 rounded-lg bg-amber-500/10 flex center"><i class="fa-solid fa-users text-amber-400 text-lg"></i></div>
                            <div><div class="font-bold text-white">角色与实体</div><div class="text-[9px] text-dim">12类实体管理</div></div>
                        </div>
                        <div class="text-[10px] text-gray-400 leading-relaxed">管理人物、物品、地点、势力等12类实体。支持从拆书/导入自动提取，关联章节和循环。</div>
                    </div>
                    <div class="group cursor-pointer bg-[#0e0e12] rounded-xl border border-white/5 hover:border-purple-500/30 p-5 transition-all" onclick="Modules.world_engine.switchTab('graph')">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="w-10 h-10 rounded-lg bg-purple-500/10 flex center"><i class="fa-solid fa-circle-nodes text-purple-400 text-lg"></i></div>
                            <div><div class="font-bold text-white">关系与图谱</div><div class="text-[9px] text-dim">按卷/循环监控</div></div>
                        </div>
                        <div class="text-[10px] text-gray-400 leading-relaxed">每卷生成独立图谱；拆书融合按循环查看。实体、规则、伏笔不再挤成整本书一张大网。</div>
                    </div>
                    <div class="group cursor-pointer bg-[#0e0e12] rounded-xl border border-white/5 hover:border-red-500/30 p-5 transition-all" onclick="Modules.world_engine.switchTab('pipeline_overview')">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="w-10 h-10 rounded-lg bg-red-500/10 flex center"><i class="fa-solid fa-rocket text-red-400 text-lg"></i></div>
                            <div><div class="font-bold text-white">融合数据</div><div class="text-[9px] text-dim">拆书精华 + 注入中心</div></div>
                        </div>
                        <div class="text-[10px] text-gray-400 leading-relaxed">查看融合拆书流水线数据，提取技法精华。一键注入到凤凰流或执笔台，驱动创作。</div>
                    </div>
                    <!-- 导入续写入口 -->
                    <div class="group cursor-pointer bg-[#0e0e12] rounded-xl border border-white/5 hover:border-green-500/30 p-5 transition-all col-span-2" onclick="Modules.world_engine._openNovelImportModal()">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="w-10 h-10 rounded-lg bg-green-500/10 flex center"><i class="fa-solid fa-file-import text-green-400 text-lg"></i></div>
                            <div><div class="font-bold text-white">导入续写</div><div class="text-[9px] text-dim">按章保留 · 章内细纲 · 入图谱</div></div>
                        </div>
                        <div class="text-[10px] text-gray-400 leading-relaxed">上传或粘贴已有小说，系统把正文按章节保留到执笔台；有细纲就自动填，没有细纲就 AI 生成章内分部分细纲，再提实体、关系和续写点。</div>
                    </div>
                </div>
            </div>

            <!-- 最近活动 -->
            <div>
                <div class="text-[10px] text-dim font-bold uppercase tracking-wider mb-3">最近活动</div>
                <div class="bg-[#0e0e12] rounded-xl border border-white/5 p-4 space-y-2" id="we-dashboard-activity">
                    <div class="text-[10px] text-dim">加载中...</div>
                </div>
                <!-- 凤凰流专属面板占位 -->
                <div id="we-phoenix-panels"></div>
            </div>
        </div>`;
    },

    // ═══ 叙事一致性监控中心 — 数据刷新 ═══
    async _refreshNarrativeConsistency() {
        const we = Modules.world_engine;
        await we._ensureCache();

        const allEnts = we._cachedEntities || [];
        const pipelineEnts = allEnts.filter(e => e.source === 'pipeline' || e.source === 'world');
        const nonWorldEnts = pipelineEnts.filter(e => !e.id.startsWith('world_'));

        // 1. 统计卡片
        const entTotal = nonWorldEnts.length;
        const entBreakdown = {};
        nonWorldEnts.forEach(e => { entBreakdown[e.type || '其他'] = (entBreakdown[e.type || '其他'] || 0) + 1; });
        const breakdownText = Object.entries(entBreakdown).map(([t,c]) => `${t}:${c}`).join(' ');

        const elTotal = document.getElementById('we-cs-ent-total');
        const elBreak = document.getElementById('we-cs-ent-breakdown');
        if(elTotal) elTotal.textContent = entTotal;
        if(elBreak) elBreak.textContent = breakdownText || '暂无实体';

        // 2. 伏笔追踪（从 fusion_book 获取 + 世界引擎实体中的伏笔类型）
        const FB = Modules.fusion_book;
        let pendingFS = [], resolvedFS = [];
        if(FB) {
            const allOutlines = FB._allPipelineResults?.outline || '';
            const fsData = FB._extractForeshadowing ? FB._extractForeshadowing(allOutlines) : { pending: [], resolved: [] };
            pendingFS = fsData.pending || [];
            resolvedFS = fsData.resolved || [];
        }
        // 同时从实体库中查找伏笔类型实体
        const fsEntities = nonWorldEnts.filter(e => e.type === '伏笔');
        fsEntities.forEach(e => {
            const text = e.name + (e.desc ? ': ' + e.desc.slice(0, 80) : '');
            if(!pendingFS.includes(text) && !resolvedFS.includes(text)) pendingFS.push(text);
        });

        const elPending = document.getElementById('we-cs-pending-fs');
        const elResolved = document.getElementById('we-cs-resolved-fs');
        const elPCount = document.getElementById('we-cs-pending-count');
        const elRCount = document.getElementById('we-cs-resolved-count');
        if(elPending) elPending.textContent = pendingFS.length;
        if(elResolved) elResolved.textContent = resolvedFS.length;
        if(elPCount) elPCount.textContent = pendingFS.length;
        if(elRCount) elRCount.textContent = resolvedFS.length;

        // 渲染待回收列表
        const elPList = document.getElementById('we-cs-pending-list');
        if(elPList) {
            if(pendingFS.length === 0) {
                elPList.innerHTML = '<div class="text-[10px] text-dim italic">暂无待回收伏笔</div>';
            } else {
                elPList.innerHTML = pendingFS.map((f, i) => `
                    <div class="flex items-start gap-2 p-2 rounded-lg bg-red-500/5 border border-red-500/10 group">
                        <span class="w-5 h-5 rounded bg-red-500/20 text-red-400 flex center text-[9px] font-bold shrink-0 mt-0.5">${i+1}</span>
                        <div class="flex-1 min-w-0">
                            <div class="text-[11px] text-white leading-relaxed">${f}</div>
                        </div>
                        <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onclick="Modules.world_engine._resolveForeshadowing(${i})" title="标记为已回收"><i class="fa-solid fa-check mr-1"></i>回收</button>
                    </div>
                `).join('');
            }
        }

        // 渲染已回收列表
        const elRList = document.getElementById('we-cs-resolved-list');
        if(elRList) {
            if(resolvedFS.length === 0) {
                elRList.innerHTML = '<div class="text-[10px] text-dim italic">暂无已回收伏笔</div>';
            } else {
                elRList.innerHTML = resolvedFS.map((f, i) => `
                    <div class="flex items-start gap-2 p-2 rounded-lg bg-green-500/5 border border-green-500/10">
                        <i class="fa-solid fa-check-circle text-green-500 text-[10px] mt-0.5 shrink-0"></i>
                        <div class="text-[11px] text-white/70 leading-relaxed line-through">${f}</div>
                    </div>
                `).join('');
            }
        }

        // 3. 情绪弧线（ECharts）
        let emotionCurve = [];
        if(FB && FB._extractEmotionCurve) {
            emotionCurve = FB._extractEmotionCurve(FB._allPipelineResults?.outline || '');
        }
        // 同时从实体中查找情绪相关数据（EMO类型）
        const emoEnts = nonWorldEnts.filter(e => e.type === '技法' && (e.name || '').includes('情绪'));

        const elEmoAvg = document.getElementById('we-cs-emo-avg');
        if(elEmoAvg) {
            const avg = emotionCurve.length ? (emotionCurve.reduce((a,b) => a + b.score, 0) / emotionCurve.length).toFixed(1) : '-';
            elEmoAvg.textContent = avg;
        }

        const chartDom = document.getElementById('we-cs-emotion-chart');
        if(chartDom && typeof echarts !== 'undefined') {
            if(emotionCurve.length >= 2) {
                const chart = echarts.init(chartDom);
                const option = {
                    backgroundColor: 'transparent',
                    grid: { top: 30, right: 20, bottom: 30, left: 40 },
                    tooltip: { trigger: 'axis', backgroundColor: '#1a1a1e', borderColor: '#333', textStyle: { color: '#fff', fontSize: 11 } },
                    xAxis: { type: 'category', data: emotionCurve.map(e => '第' + e.chapter + '章'), axisLine: { lineStyle: { color: '#333' } }, axisLabel: { color: '#888', fontSize: 9 } },
                    yAxis: { type: 'value', min: 1, max: 10, axisLine: { lineStyle: { color: '#333' } }, axisLabel: { color: '#888', fontSize: 9 }, splitLine: { lineStyle: { color: '#1a1a1e' } } },
                    series: [
                        { name: '情绪分值', type: 'line', data: emotionCurve.map(e => e.score), smooth: true, symbol: 'circle', symbolSize: 8, lineStyle: { color: '#06b6d4', width: 2 }, itemStyle: { color: '#06b6d4' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(6,182,212,0.3)' }, { offset: 1, color: 'rgba(6,182,212,0)' }] } } },
                        { name: '张力等级', type: 'line', data: emotionCurve.map(e => e.tension), smooth: true, symbol: 'diamond', symbolSize: 6, lineStyle: { color: '#f59e0b', width: 1.5, type: 'dashed' }, itemStyle: { color: '#f59e0b' } }
                    ],
                    legend: { data: ['情绪分值', '张力等级'], textStyle: { color: '#888', fontSize: 9 }, top: 0 }
                };
                chart.setOption(option);
            } else {
                chartDom.innerHTML = '<div class="flex items-center justify-center h-full text-[10px] text-dim italic">情绪数据不足（需至少2章），处理更多章节后将自动绘制</div>';
            }
        }

        // 情绪异常预警
        const elAlerts = document.getElementById('we-cs-emo-alerts');
        if(elAlerts && emotionCurve.length >= 2) {
            const alerts = [];
            for(let i = 1; i < emotionCurve.length; i++) {
                const diff = Math.abs(emotionCurve[i].score - emotionCurve[i-1].score);
                if(diff > 3) alerts.push(`<span class="text-red-400">⚠️ 第${emotionCurve[i].chapter}章情绪跳变 ${diff} 分（${emotionCurve[i-1].score}→${emotionCurve[i].score}）</span>`);
            }
            const lowPoints = emotionCurve.filter(e => e.score <= 3);
            if(lowPoints.length > emotionCurve.length * 0.4) alerts.push(`<span class="text-amber-400">⚠️ 低情绪章节占比 ${Math.round(lowPoints.length/emotionCurve.length*100)}%，注意读者流失风险</span>`);
            if(alerts.length === 0) alerts.push('<span class="text-green-400">✓ 情绪曲线平稳，无明显异常</span>');
            elAlerts.innerHTML = alerts.map(a => `<div class="text-[10px] p-1.5 rounded bg-white/5">${a}</div>`).join('');
        } else if(elAlerts) {
            elAlerts.innerHTML = '<div class="text-[10px] text-dim italic">数据不足</div>';
        }

        // 4. 世界观维度完成度
        const worldCats = { history: '历史与传说', geography: '地理与地貌', magic: '魔法/科技体系', factions: '势力与组织', species: '种族与生物', rules: '世界规则', culture: '文化与习俗' };
        const elWorld = document.getElementById('we-cs-world-dims');
        if(elWorld) {
            let worldHtml = '';
            for(const [key, label] of Object.entries(worldCats)) {
                const ent = allEnts.find(e => e.id === 'world_' + key);
                const hasContent = ent && ent.desc && ent.desc.length > 50;
                const percent = hasContent ? Math.min(100, Math.round(ent.desc.length / 10)) : 0;
                worldHtml += `
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] text-dim w-20 shrink-0">${label}</span>
                        <div class="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <div class="h-full rounded-full ${hasContent ? 'bg-blue-500' : 'bg-white/10'} transition-all" style="width:${percent}%"></div>
                        </div>
                        <span class="text-[9px] ${hasContent ? 'text-blue-400' : 'text-dim'} w-8 text-right">${hasContent ? '已建' : '未建'}</span>
                        ${hasContent ? `<button class="btn btn-xs bg-white/5 text-dim hover:text-white px-1.5 py-0.5" onclick="Modules.world_engine._editWorldDim('${key}')" title="编辑"><i class="fa-solid fa-pen text-[8px]"></i></button>` : ''}
                    </div>`;
            }
            elWorld.innerHTML = worldHtml;
        }

        // 5. 一致性冲突检查
        const elConflicts = document.getElementById('we-cs-conflicts');
        if(elConflicts) {
            const conflicts = [];
            // 检查同名不同类型实体
            const nameMap = {};
            nonWorldEnts.forEach(e => {
                if(!nameMap[e.name]) nameMap[e.name] = [];
                nameMap[e.name].push(e);
            });
            for(const [name, ents] of Object.entries(nameMap)) {
                const types = [...new Set(ents.map(e => e.type))];
                if(types.length > 1) {
                    conflicts.push(`<span class="text-amber-400">⚠️ "${name}" 存在 ${types.length} 种类型 (${types.join('/')})，请确认是否为同一实体</span>`);
                }
            }
            // 检查无关联实体（孤立节点）
            const isolated = nonWorldEnts.filter(e => !e.relations || e.relations.length === 0);
            if(isolated.length > 0 && isolated.length < nonWorldEnts.length) {
                conflicts.push(`<span class="text-blue-400">ℹ️ ${isolated.length} 个实体无关联关系，建议补充关系网络</span>`);
            }
            // 检查世界观维度缺失
            const missingWorld = Object.keys(worldCats).filter(k => !allEnts.find(e => e.id === 'world_' + k));
            if(missingWorld.length > 0) {
                conflicts.push(`<span class="text-purple-400">ℹ️ 缺失世界观维度：${missingWorld.map(k => worldCats[k]).join('、')}</span>`);
            }
            if(conflicts.length === 0) {
                conflicts.push('<span class="text-green-400">✓ 未检测到明显一致性冲突</span>');
            }
            elConflicts.innerHTML = conflicts.map(c => `<div class="text-[10px] p-1.5 rounded bg-white/5">${c}</div>`).join('');
        }
    },

    // ═══ 叙事一致性 — 交互方法 ═══

    /**
     * 标记伏笔为已回收
     */
    _resolveForeshadowing(index) {
        const FB = Modules.fusion_book;
        if(!FB) return;
        const allOutlines = FB._allPipelineResults?.outline || '';
        const fsData = FB._extractForeshadowing ? FB._extractForeshadowing(allOutlines) : { pending: [], resolved: [] };
        const pending = fsData.pending || [];
        if(index >= 0 && index < pending.length) {
            const item = pending[index];
            // 在 allPipelineResults.outline 中追加回收标记
            FB._allPipelineResults.outline = FB._allPipelineResults.outline + '\n\n【伏笔回收】已回收：' + item;
            UI.toast('已标记伏笔回收: ' + item.slice(0, 30) + '...');
            this._refreshNarrativeConsistency();
        }
    },

    /**
     * 手动添加伏笔
     */
    _showAddForeshadowingModal() {
        UI.dialog('添加伏笔', `
            <div class="space-y-3">
                <div>
                    <span class="text-[10px] text-dim">伏笔描述</span>
                    <textarea id="we-cs-add-fs-text" class="input w-full h-20 bg-black/30 border-white/10 text-white text-xs mt-1" placeholder="描述这个伏笔的内容..."></textarea>
                </div>
                <div>
                    <span class="text-[10px] text-dim">计划回收章节</span>
                    <input id="we-cs-add-fs-chapter" type="number" class="input w-full bg-black/30 border-white/10 text-white text-xs mt-1" placeholder="例如：8">
                </div>
            </div>
        `, {
            confirm: { text: '添加', action: async () => {
                const text = document.getElementById('we-cs-add-fs-text').value.trim();
                const ch = document.getElementById('we-cs-add-fs-chapter').value;
                if(!text) return UI.toast('请输入伏笔描述');
                const FB = Modules.fusion_book;
                if(FB && FB._allPipelineResults) {
                    FB._allPipelineResults.outline = (FB._allPipelineResults.outline || '') + '\n\n【手动添加伏笔】' + text + (ch ? ' [计划回收:第' + ch + '章]' : '');
                    UI.toast('伏笔已添加');
                    this._refreshNarrativeConsistency();
                }
            }},
            cancel: { text: '取消' }
        });
    },

    /**
     * 手动记录情绪
     */
    _showAddEmotionModal() {
        UI.dialog('记录情绪锚点', `
            <div class="space-y-3">
                <div>
                    <span class="text-[10px] text-dim">章节号</span>
                    <input id="we-cs-add-emo-ch" type="number" class="input w-full bg-black/30 border-white/10 text-white text-xs mt-1" placeholder="例如：5">
                </div>
                <div>
                    <span class="text-[10px] text-dim">情绪分值 (1-10)</span>
                    <input id="we-cs-add-emo-score" type="number" min="1" max="10" class="input w-full bg-black/30 border-white/10 text-white text-xs mt-1" placeholder="5">
                </div>
                <div>
                    <span class="text-[10px] text-dim">张力等级 (1-10)</span>
                    <input id="we-cs-add-emo-tension" type="number" min="1" max="10" class="input w-full bg-black/30 border-white/10 text-white text-xs mt-1" placeholder="5">
                </div>
                <div>
                    <span class="text-[10px] text-dim">钩子类型</span>
                    <input id="we-cs-add-emo-hook" class="input w-full bg-black/30 border-white/10 text-white text-xs mt-1" placeholder="例如：信息差钩子">
                </div>
            </div>
        `, {
            confirm: { text: '记录', action: async () => {
                const ch = document.getElementById('we-cs-add-emo-ch').value;
                const score = document.getElementById('we-cs-add-emo-score').value;
                const tension = document.getElementById('we-cs-add-emo-tension').value;
                const hook = document.getElementById('we-cs-add-emo-hook').value.trim();
                if(!ch || !score) return UI.toast('请输入章节号和情绪分值');
                const FB = Modules.fusion_book;
                if(FB && FB._allPipelineResults) {
                    FB._allPipelineResults.outline = (FB._allPipelineResults.outline || '') + `\n\n### 第${ch}章\n**情绪节奏:** 起→承→转→合\n**emotion_score:** ${score}\n**tension_level:** ${tension || 5}\n**hook_type:** ${hook || '待定'}`;
                    UI.toast('情绪锚点已记录');
                    this._refreshNarrativeConsistency();
                }
            }},
            cancel: { text: '取消' }
        });
    },

    /**
     * 同步一致性状态到融合拆书（刷新 _accContext）
     */
    async _syncConsistencyToFusion() {
        const FB = Modules.fusion_book;
        if(!FB) return UI.toast('融合拆书模块未加载');
        await this._ensureCache();
        const allEnts = this._cachedEntities || [];
        const nonWorld = allEnts.filter(e => !e.id.startsWith('world_'));

        // 构建最新的知识图谱文本
        let kg = '';
        const grouped = {};
        nonWorld.forEach(e => { const t = e.type || '其他'; if(!grouped[t]) grouped[t]=[]; grouped[t].push(e); });
        for(const [type, items] of Object.entries(grouped)) {
            kg += `【${type}】${items.map(e => e.name + (e.desc ? ':' + e.desc.slice(0,60) : '')).join(' | ')}\n`;
        }
        const worlds = allEnts.filter(e => e.id.startsWith('world_') && e.desc);
        if(worlds.length) {
            kg += '\n【世界观设定】\n';
            worlds.forEach(w => kg += `[${w.name}] ${w.desc.slice(0, 200)}\n`);
        }

        // 更新 fusion_book 的累积上下文
        FB._accContext = FB._accContext || {};
        FB._accContext.entities = kg;
        FB._accContext.knowledgeGraph = kg;
        UI.toast('一致性状态已同步到融合拆书 (' + nonWorld.length + ' 个实体)');
    },

    /**
     * 编辑世界观维度
     */
    _editWorldDim(cat) {
        const catLabels = {history:'历史与传说',geography:'地理与地貌',magic:'魔法/科技体系',factions:'势力与组织',species:'种族与生物',rules:'世界规则',culture:'文化与习俗'};
        const label = catLabels[cat] || cat;
        DB.get('entities', 'world_' + cat).then(ent => {
            const current = ent && ent.desc ? ent.desc : '';
            UI.dialog('编辑：' + label, `
                <textarea id="we-cs-edit-world-text" class="input w-full h-48 bg-black/30 border-white/10 text-white text-xs" placeholder="输入${label}的详细设定...">${current}</textarea>
            `, {
                confirm: { text: '保存', action: async () => {
                    const text = document.getElementById('we-cs-edit-world-text').value.trim();
                    await DB.put('entities', { id: 'world_' + cat, name: label, type: 'world', desc: text, source: 'pipeline', updatedAt: Date.now() });
                    this._cachedEntities = null;
                    UI.toast(label + ' 已更新');
                    this._refreshNarrativeConsistency();
                }},
                cancel: { text: '取消' }
            });
        });
    },

    async _refreshDashboard() {
        const we = Modules.world_engine;
        await we._ensureCache();
        await we._ensureCycleCache();

        const worldCats = ['history','geography','magic','factions','species','rules','culture'];
        let worldFilled = 0;
        const allEnts = we._cachedEntities || [];
        for(const cat of worldCats) {
            const ent = allEnts.find(e => e.id === 'world_' + cat);
            if(ent && ent.desc && ent.desc.length > 50) worldFilled++;
        }
        const worldProgress = Math.round((worldFilled / 7) * 100);
        const wpEl = document.getElementById('we-db-world-progress');
        const wbEl = document.getElementById('we-db-world-bar');
        if(wpEl) wpEl.textContent = `${worldFilled}/7`;
        if(wbEl) wbEl.style.width = `${worldProgress}%`;
        const wnEl = document.getElementById('we-nav-world-progress');
        if(wnEl) wnEl.textContent = `${worldFilled}/7`;

        const nonWorldEnts = allEnts.filter(e => !e.id?.startsWith('world_'));
        const ecEl = document.getElementById('we-db-entity-count');
        const etEl = document.getElementById('we-db-entity-types');
        const enEl = document.getElementById('we-nav-ent-count');
        if(ecEl) ecEl.textContent = nonWorldEnts.length;
        if(enEl) enEl.textContent = nonWorldEnts.length;
        const typeCounts = {};
        nonWorldEnts.forEach(e => { typeCounts[e.type] = (typeCounts[e.type]||0)+1; });
        const topTypes = Object.entries(typeCounts).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([t,c])=>`${t}:${c}`).join(' ');
        if(etEl) etEl.textContent = topTypes || '暂无实体';

        const gnEl = document.getElementById('we-db-graph-nodes');
        const geEl = document.getElementById('we-db-graph-edges');
        let edgeCount = 0;
        nonWorldEnts.forEach(e => { edgeCount += (e.relations?.length || 0); });
        let layered = null;
        try { layered = await we._ensureLayeredGraphs(); } catch(e) {}
        const graphCount = (layered?.volumes?.length || 0) + (layered?.cycles?.length || 0);
        if(gnEl) gnEl.textContent = graphCount ? `${graphCount}层` : nonWorldEnts.length;
        if(geEl) geEl.textContent = graphCount ? `${nonWorldEnts.length}实体 / ${edgeCount}关系` : `${edgeCount} 关系`;

        const ccEl = document.getElementById('we-db-cycle-count');
        const cycles = we._cachedCycles || [];
        if(ccEl) ccEl.textContent = cycles.length;

        const flEl = document.getElementById('we-db-fusion-len');
        const FB = Modules.fusion_book;
        let fusionLen = 0;
        if(FB) {
            const ps = FB._getPipelineStatus ? FB._getPipelineStatus() : null;
            if(ps?.results?.fusion) fusionLen = ps.results.fusion.length;
        }
        if(flEl) flEl.textContent = fusionLen > 0 ? `${(fusionLen/1000).toFixed(1)}k` : '—';

        const vcEl = document.getElementById('we-db-vector-count');
        try {
            const vectors = await DB.getAll('vectors');
            if(vcEl) vcEl.textContent = vectors.length;
        } catch(e) { if(vcEl) vcEl.textContent = '—'; }

        const actEl = document.getElementById('we-dashboard-activity');
        if(actEl) {
            let html = '';
            const recentEnts = nonWorldEnts.sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)).slice(0, 5);
            if(recentEnts.length) {
                recentEnts.forEach(e => {
                    const time = e.updatedAt ? new Date(e.updatedAt).toLocaleDateString() : '未知';
                    html += `<div class="flex items-center gap-2 text-[10px]"><span class="px-1.5 py-0.5 rounded text-[8px] bg-white/5 text-dim">${e.type}</span><span class="text-gray-300">${e.name}</span><span class="text-dim ml-auto">${time}</span></div>`;
                });
            } else {
                html = '<div class="text-[10px] text-dim">暂无活动 — 从「导入续写」或「融合拆书」开始构建你的世界</div>';
            }
            actEl.innerHTML = html;
        }
        // ★ 凤凰流专属面板渲染
        const phoenixEl = document.getElementById('we-phoenix-panels');
        if (phoenixEl) {
            const panelsHtml = await this._renderPhoenixPanels();
            phoenixEl.innerHTML = panelsHtml;
        }
    },

    getCycleIdForChapter(chapterNum, cycleSize = 5) {
        const start = Math.floor((chapterNum - 1) / cycleSize) * cycleSize + 1;
        const end = start + cycleSize - 1;
        return { id: `cycle_${start}_${end}`, startChapter: start, endChapter: end };
    },

    // ═══════════════════════════════════════════════════════════════
    // ★ 凤凰流专属面板 — 时间线 / 力量体系 / 阵营
    // ═══════════════════════════════════════════════════════════════

    async _renderPhoenixPanels() {
        const proj = await GenesisCore.getActiveProject();
        if (!proj || proj.mode !== 'phoenix') return '';
        const modeData = proj.modeData || {};
        const timeline = modeData.timeline || [];
        const powerSystem = modeData.powerSystem || {};
        const factions = modeData.factions || [];
        let html = '<div class="space-y-4 mt-4">';
        html += '<div class="text-[10px] font-bold text-orange-400 uppercase tracking-wider"><i class="fa-solid fa-fire mr-1"></i>凤凰流专属</div>';
        html += '<div class="bg-[#0e0e12] border border-white/5 rounded-lg p-3">';
        html += '<div class="flex items-center justify-between mb-2"><span class="text-xs font-bold text-white"><i class="fa-solid fa-clock-rotate-left mr-1 text-amber-400"></i>时间线</span>';
        html += '<button class="text-[9px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20" onclick="Modules.world_engine._addTimelineEvent()">+ 添加</button></div>';
        html += '<div class="space-y-1.5 max-h-32 overflow-y-auto">';
        if (timeline.length === 0) html += '<div class="text-[9px] text-dim">暂无时间线事件</div>';
        else timeline.forEach(e => { html += '<div class="flex items-center gap-2 text-[10px]"><span class="text-amber-400 font-bold w-8">' + (e.time || '?') + '</span><span class="text-gray-300">' + (e.event || '') + '</span></div>'; });
        html += '</div></div>';
        html += '<div class="bg-[#0e0e12] border border-white/5 rounded-lg p-3">';
        html += '<div class="flex items-center justify-between mb-2"><span class="text-xs font-bold text-white"><i class="fa-solid fa-bolt mr-1 text-yellow-400"></i>力量体系</span>';
        html += '<button class="text-[9px] px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20" onclick="Modules.world_engine._addPowerSystem()">+ 添加</button></div>';
        html += '<div class="space-y-1.5">';
        const psKeys = Object.keys(powerSystem);
        if (psKeys.length === 0) html += '<div class="text-[9px] text-dim">暂无力量体系设定</div>';
        else psKeys.forEach(k => { html += '<div class="text-[10px]"><span class="text-yellow-400 font-bold">' + k + '</span>: <span class="text-gray-300">' + powerSystem[k] + '</span></div>'; });
        html += '</div></div>';
        html += '<div class="bg-[#0e0e12] border border-white/5 rounded-lg p-3">';
        html += '<div class="flex items-center justify-between mb-2"><span class="text-xs font-bold text-white"><i class="fa-solid fa-chess mr-1 text-red-400"></i>阵营</span>';
        html += '<button class="text-[9px] px-2 py-0.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20" onclick="Modules.world_engine._addFaction()">+ 添加</button></div>';
        html += '<div class="space-y-1.5">';
        if (factions.length === 0) html += '<div class="text-[9px] text-dim">暂无阵营设定</div>';
        else factions.forEach(f => { html += '<div class="text-[10px]"><span class="text-red-400 font-bold">' + (f.name || '') + '</span> <span class="text-gray-300">' + (f.desc || '') + '</span></div>'; });
        html += '</div></div></div>';
        return html;
    },

    async _addTimelineEvent() {
        const time = prompt('时间/时期：'); if (!time) return;
        const event = prompt('事件描述：'); if (!event) return;
        const modeData = await GenesisCore.getModeData();
        const timeline = [...(modeData.timeline || []), { time, event }];
        await GenesisCore.updateModeData({ timeline });
        this.refresh();
    },

    async _addPowerSystem() {
        const name = prompt('体系名称（如：魔法、斗气、科技）：'); if (!name) return;
        const desc = prompt('体系描述：'); if (!desc) return;
        const modeData = await GenesisCore.getModeData();
        const powerSystem = { ...(modeData.powerSystem || {}), [name]: desc };
        await GenesisCore.updateModeData({ powerSystem });
        this.refresh();
    },

    async _addFaction() {
        const name = prompt('阵营名称：'); if (!name) return;
        const desc = prompt('阵营描述：'); if (!desc) return;
        const modeData = await GenesisCore.getModeData();
        const factions = [...(modeData.factions || []), { name, desc }];
        await GenesisCore.updateModeData({ factions });
        this.refresh();
    },

});
