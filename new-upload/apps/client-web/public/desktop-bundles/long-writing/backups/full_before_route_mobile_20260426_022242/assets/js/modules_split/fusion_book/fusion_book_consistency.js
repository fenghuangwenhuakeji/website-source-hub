Object.assign(Modules.fusion_book, {
    async checkConsistency() {
        const FB = Modules.fusion_book;
        
        if(!FB._primarySettings) {
            await FB._loadPrimarySettings();
        }
        
        if(!FB._primarySettings || !FB._primarySettings.bookId) {
            UI.toast('请先设置主拆书');
            return;
        }
        
        const primaryBook = FB._primaryBook === 'left' ? FB.left : FB.right;
        const secondaryBook = FB._primaryBook === 'left' ? FB.right : FB.left;
        
        if(!primaryBook.bookId) {
            UI.toast('主书未选择书籍');
            return;
        }
        
        const books = FB._books || [];
        const primary = books.find(b => b.id === primaryBook.bookId);
        const secondary = secondaryBook.bookId ? books.find(b => b.id === secondaryBook.bookId) : null;
        
        if(!primary) {
            UI.toast('找不到主书数据');
            return;
        }
        
        const modal = document.createElement('div');
        modal.id = 'fb-consistency-modal';
        modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm';
        modal.onclick = (e) => { if(e.target === modal) modal.remove(); };
        
        modal.innerHTML = `
            <div class="bg-[#1a1a2e] rounded-2xl border border-white/10 w-[700px] max-h-[80vh] flex flex-col shadow-2xl">
                <div class="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex center text-white">
                            <i class="fa-solid fa-check-double text-lg"></i>
                        </div>
                        <div>
                            <div class="font-bold text-white text-base">一致性检查报告</div>
                            <div class="text-[10px] text-dim">主拆书: ${FB._primarySettings.bookName || primary.name}</div>
                        </div>
                    </div>
                    <button class="btn btn-sm bg-white/5 text-dim hover:text-white" onclick="this.closest('#fb-consistency-modal').remove()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="flex-1 overflow-y-auto p-5" id="fb-consistency-content">
                    <div class="text-center text-dim py-8">
                        <i class="fa-solid fa-spinner fa-spin text-2xl mb-2"></i>
                        <p>正在分析一致性...</p>
                    </div>
                </div>
                <div class="px-6 py-3 border-t border-white/5 shrink-0 flex gap-2">
                    <button class="btn btn-sm bg-cyan-600/20 text-cyan-400 border-cyan-600/30 flex-1" onclick="Modules.fusion_book._fixConsistencyIssues()">
                        <i class="fa-solid fa-wrench mr-1"></i>自动修复
                    </button>
                    <button class="btn btn-sm bg-white/5 text-dim flex-1" onclick="this.closest('#fb-consistency-modal').remove()">关闭</button>
                </div>
            </div>`;
        
        document.body.appendChild(modal);
        
        const contentEl = document.getElementById('fb-consistency-content');
        
        const report = await FB._generateConsistencyReport(primary, secondary);
        
        if(contentEl) {
            contentEl.innerHTML = report.html;
        }
        
        FB._lastConsistencyReport = report;
    },

    async _generateConsistencyReport(primary, secondary) {
        const FB = Modules.fusion_book;
        const issues = [];
        const suggestions = [];
        
        const primaryChars = primary.chapters?.reduce((sum, ch) => sum + (ch.content?.length || 0), 0) || 0;
        const secondaryChars = secondary ? secondary.chapters?.reduce((sum, ch) => sum + (ch.content?.length || 0), 0) || 0 : 0;
        
        if(secondary && secondaryChars > primaryChars * 1.5) {
            issues.push({
                type: 'warning',
                title: '字数比例失衡',
                desc: `副书字数(${(secondaryChars/10000).toFixed(1)}万)远超主书(${(primaryChars/10000).toFixed(1)}万)，可能影响融合质量`,
                fix: '建议增加主书章节数量或减少副书章节'
            });
        }
        
        if(secondary && primary.chapters && secondary.chapters) {
            const primaryChapters = primary.chapters.length;
            const secondaryChapters = secondary.chapters.length;
            
            if(Math.abs(primaryChapters - secondaryChapters) > Math.max(primaryChapters, secondaryChapters) * 0.3) {
                issues.push({
                    type: 'info',
                    title: '章节数量差异',
                    desc: `主书${primaryChapters}章 vs 副书${secondaryChapters}章`,
                    fix: '流水线会自动配对，但建议选择相近章节数'
                });
            }
        }
        
        const worldEngine = Modules.world_engine;
        if(worldEngine) {
            await worldEngine._ensureCache();
            const entities = worldEngine._cachedEntities || [];
            const worldEntities = entities.filter(e => !e.id.startsWith('world_'));
            
            if(worldEntities.length > 0) {
                const primaryContent = primary.chapters?.map(ch => ch.content || '').join('\n') || '';
                let matchedCount = 0;
                
                worldEntities.forEach(ent => {
                    if(primaryContent.includes(ent.name)) {
                        matchedCount++;
                    }
                });
                
                const matchRate = (matchedCount / worldEntities.length * 100).toFixed(1);
                
                if(matchRate < 30) {
                    issues.push({
                        type: 'warning',
                        title: '实体匹配率低',
                        desc: `世界引擎中${worldEntities.length}个实体，仅${matchedCount}个在主书中出现(${matchRate}%)`,
                        fix: '建议从主书提取实体到世界引擎'
                    });
                } else {
                    suggestions.push({
                        type: 'success',
                        title: '实体匹配良好',
                        desc: `${worldEntities.length}个实体中${matchedCount}个在主书中出现(${matchRate}%)`
                    });
                }
            }
        }
        
        const fusion = FB._allPipelineResults?.fusion || FB._pipelineResults?.fusion || '';
        if(fusion) {
            const primaryNames = primary.chapters?.slice(0, 5).map(ch => ch.title).join(', ') || '';
            suggestions.push({
                type: 'success',
                title: '融合技法已生成',
                desc: `已生成${fusion.length}字融合技法精华`
            });
        } else {
            issues.push({
                type: 'info',
                title: '尚未生成融合技法',
                desc: '建议运行流水线生成融合技法精华',
                fix: '点击"一键自动拆书链"开始'
            });
        }
        
        let html = '<div class="space-y-4">';
        
        if(issues.length > 0) {
            html += `<div>
                <div class="text-[11px] text-amber-400 font-bold uppercase mb-2"><i class="fa-solid fa-exclamation-triangle mr-1"></i>发现的问题 (${issues.length})</div>
                <div class="space-y-2">`;
            issues.forEach(issue => {
                const colors = {
                    warning: 'border-amber-500/30 bg-amber-500/5',
                    error: 'border-red-500/30 bg-red-500/5',
                    info: 'border-blue-500/30 bg-blue-500/5'
                };
                html += `<div class="p-3 rounded-lg border ${colors[issue.type] || colors.info}">
                    <div class="text-[11px] font-bold text-white mb-1">${issue.title}</div>
                    <div class="text-[10px] text-dim mb-1">${issue.desc}</div>
                    ${issue.fix ? `<div class="text-[10px] text-cyan-400"><i class="fa-solid fa-lightbulb mr-1"></i>${issue.fix}</div>` : ''}
                </div>`;
            });
            html += '</div></div>';
        }
        
        if(suggestions.length > 0) {
            html += `<div>
                <div class="text-[11px] text-green-400 font-bold uppercase mb-2"><i class="fa-solid fa-check-circle mr-1"></i>状态良好 (${suggestions.length})</div>
                <div class="space-y-2">`;
            suggestions.forEach(sug => {
                html += `<div class="p-3 rounded-lg border border-green-500/20 bg-green-500/5">
                    <div class="text-[11px] font-bold text-white mb-1">${sug.title}</div>
                    <div class="text-[10px] text-dim">${sug.desc}</div>
                </div>`;
            });
            html += '</div></div>';
        }
        
        html += `<div class="mt-4 p-3 rounded-lg border border-white/5 bg-white/[0.02]">
            <div class="text-[10px] text-dim font-bold uppercase mb-2">主拆书基准信息</div>
            <div class="grid grid-cols-2 gap-2 text-[10px]">
                <div><span class="text-dim">书名:</span> <span class="text-white">${primary.name}</span></div>
                <div><span class="text-dim">章节数:</span> <span class="text-white">${primary.chapters?.length || 0}</span></div>
                <div><span class="text-dim">总字数:</span> <span class="text-white">${(primaryChars/10000).toFixed(1)}万</span></div>
                <div><span class="text-dim">设定时间:</span> <span class="text-white">${FB._primarySettings?.setAt ? new Date(FB._primarySettings.setAt).toLocaleString('zh-CN') : '-'}</span></div>
            </div>
        </div></div>`;
        
        return { html, issues, suggestions };
    },

    async _fixConsistencyIssues() {
        const FB = Modules.fusion_book;
        
        if(!FB._lastConsistencyReport) {
            UI.toast('请先运行一致性检查');
            return;
        }
        
        const issues = FB._lastConsistencyReport.issues || [];
        let fixedCount = 0;
        
        for(const issue of issues) {
            if(issue.title === '实体匹配率低') {
                if(Modules.world_engine) {
                    await Modules.world_engine.extractFromFusion();
                    fixedCount++;
                }
            }
        }
        
        if(fixedCount > 0) {
            UI.toast(`已修复 ${fixedCount} 个问题`);
            const modal = document.getElementById('fb-consistency-modal');
            if(modal) modal.remove();
            await FB.checkConsistency();
        } else {
            UI.toast('没有可自动修复的问题');
        }
    },

    _toggleAdvancedPanel() {
        const panel = document.getElementById('fb-advanced-panel');
        if (panel) panel.classList.toggle('hidden');
    },

    _updateAgentStats() {
        const s = this._agentScheduler._stats;
        const el = document.getElementById('pl-agent-stats');
        if (el) {
            const elapsed = (Date.now() - s.startTime) / 60000;
            const rate = elapsed > 0 ? (s.done / elapsed).toFixed(1) : 0;
            el.textContent = `${s.running}运行/${s.pending}排队/${s.done}完成 | ${rate}章/分`;
        }
        const pending = document.getElementById('pl-agent-pending');
        const running = document.getElementById('pl-agent-running');
        const done = document.getElementById('pl-agent-done');
        if (pending) pending.textContent = s.pending;
        if (running) running.textContent = s.running;
        if (done) done.textContent = s.done;
        const bar = document.getElementById('pl-progress-bar');
        if (bar) {
            const total = s.pending + s.running + s.done + s.failed;
            const pct = total > 0 ? ((s.done + s.failed) / total * 100) : 0;
            bar.style.width = pct + '%';
        }
    },

    _setPhase(phase) {
        this._agentScheduler._phase = phase;
        for (let i = 1; i <= 4; i++) {
            const el = document.getElementById('pl-phase-' + i);
            if (el) {
                if (i === phase) {
                    el.className = 'px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20 font-bold';
                } else if (i < phase) {
                    el.className = 'px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 border border-green-500/20';
                } else {
                    el.className = 'px-1.5 py-0.5 rounded bg-white/5 text-dim';
                }
            }
        }
    },

    async _savePipelineState(pairs, completedPairs, accOutlines, accEntities, allOutlines, allWritings, cfg) {
        await DB.put('settings', {
            id: 'pipeline_state',
            completedPairs, accOutlines, accEntities, allOutlines, allWritings,
            allPipelineResults: this._allPipelineResults,
            config: { leftBookId: this.left.bookId, rightBookId: this.right.bookId, ...cfg },
            pausedAt: Date.now()
        });
        this._savedPipelineState = await DB.get('settings', 'pipeline_state');
        this._plLog('流水线已暂停，进度已保存', 'info');
    },

    // ═══════════════════════════════════════════════════════════════
    // Agent 并发调度器系统
    // ═══════════════════════════════════════════════════════════════
    _agentScheduler: {
        _queue: [],
        _running: 0,
        _maxConcurrency: 1,
        _results: {},
        _stats: { pending: 0, running: 0, done: 0, failed: 0, startTime: 0 },
        _phase: 0,
        
        reset() {
            this._queue = [];
            this._running = 0;
            this._results = {};
            this._stats = { pending: 0, running: 0, done: 0, failed: 0, startTime: Date.now() };
            this._phase = 0;
        },
        
        addTask(id, fn, priority = 5, phase = 1) {
            this._queue.push({ id, fn, priority, phase, status: 'pending', retries: 0 });
            this._stats.pending++;
        },
        
        async run(maxConcurrency = 1) {
            this._maxConcurrency = maxConcurrency;
            this._stats.startTime = Date.now();
            const processQueue = async () => {
                while (this._queue.some(t => t.status === 'pending') || this._running > 0) {
                    // ★ 检查流水线是否被暂停或停止
                    const FB = Modules.fusion_book;
                    if(FB && FB._pipelinePaused) {
                        // 暂停状态：不再派发新任务，等待已有任务完成或中断
                        if(this._running === 0) break; // 所有任务都停了，退出循环
                        await new Promise(r => setTimeout(r, 500));
                        continue;
                    }
                    if(FB && !FB._pipelineRunning) {
                        // 停止状态：标记所有 pending 任务为取消，等待 running 任务结束
                        this._queue.filter(t => t.status === 'pending').forEach(t => { t.status = 'cancelled'; });
                        if(this._running === 0) break;
                        await new Promise(r => setTimeout(r, 500));
                        continue;
                    }
                    const available = this._queue.filter(t => t.status === 'pending');
                    const slots = this._maxConcurrency - this._running;
                    if (available.length > 0 && slots > 0) {
                        const toRun = available.slice(0, slots);
                        for (const task of toRun) {
                            task.status = 'running';
                            this._stats.pending--;
                            this._stats.running++;
                            this._running++;
                            this._executeTask(task);
                        }
                    }
                    await new Promise(r => setTimeout(r, 100));
                }
            };
            await processQueue();
        },

        async _executeTask(task) {
            const execute = async () => {
                // ★ 检查是否已停止
                const FB = Modules.fusion_book;
                if(FB && !FB._pipelineRunning && !FB._pipelinePaused) {
                    task.status = 'cancelled';
                    this._results[task.id] = { error: '用户停止' };
                    return;
                }
                try {
                    const result = await task.fn();
                    task.status = 'done';
                    this._results[task.id] = result;
                    this._stats.done++;
                } catch(e) {
                    // ★ 重试前检查暂停/停止状态
                    const fb = Modules.fusion_book;
                    if(fb && fb._pipelinePaused) {
                        task.status = 'pending'; // 放回队列，等继续时再跑
                        return;
                    }
                    if(fb && !fb._pipelineRunning) {
                        task.status = 'cancelled';
                        this._results[task.id] = { error: '用户停止' };
                        return;
                    }
                    if (task.retries < 5) {
                        task.retries++;
                        const delay = Math.pow(2, task.retries) * 1000;
                        await new Promise(r => setTimeout(r, delay));
                        // 递归重试
                        await execute();
                    } else {
                        task.status = 'failed';
                        this._results[task.id] = { error: e.message };
                        this._stats.failed++;
                    }
                }
            };
            await execute();
            this._stats.running--;
            this._running--;
        }
    }
});
