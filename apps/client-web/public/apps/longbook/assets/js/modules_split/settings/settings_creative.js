// settings_creative.js — 创作工具设置 (Creative Tools Settings)
Modules.settings = Object.assign(Modules.settings || {}, {
    _renderCreativeSettingsTab() {
        const deaiIntensity = localStorage.getItem('genesis_deai_intensity') || 'medium';
        const reviewDims = JSON.parse(localStorage.getItem('genesis_review_dims') || '["plot_logic","character","style","pacing","dialogue","world_consistency","commercial"]');
        const allDims = [
            { id: 'plot_logic', label: '情节逻辑' },
            { id: 'character', label: '人物塑造' },
            { id: 'style', label: '文笔风格' },
            { id: 'pacing', label: '节奏把控' },
            { id: 'dialogue', label: '对话质量' },
            { id: 'world_consistency', label: '世界观一致性' },
            { id: 'commercial', label: '商业潜力' }
        ];
        return `
        <div class="space-y-5">
            <div class="text-xs font-bold text-white"><i class="fa-solid fa-wand-magic-sparkles mr-1 text-accent"></i>创作工具设置</div>

            <!-- AI消痕 -->
            <div class="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-default)] space-y-3">
                <div class="text-[10px] font-bold text-dim uppercase tracking-wider">AI消痕引擎</div>
                <div class="space-y-1">
                    <label class="text-[10px] text-dim">默认消痕强度</label>
                    <div class="flex gap-2">
                        <button class="flex-1 py-2 rounded-lg text-[11px] font-bold transition-all ${deaiIntensity==='light' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-dim hover:bg-white/10'}" onclick="localStorage.setItem('genesis_deai_intensity','light');Modules.settings.refresh();">轻度</button>
                        <button class="flex-1 py-2 rounded-lg text-[11px] font-bold transition-all ${deaiIntensity==='medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-white/5 text-dim hover:bg-white/10'}" onclick="localStorage.setItem('genesis_deai_intensity','medium');Modules.settings.refresh();">中度</button>
                        <button class="flex-1 py-2 rounded-lg text-[11px] font-bold transition-all ${deaiIntensity==='strong' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-white/5 text-dim hover:bg-white/10'}" onclick="localStorage.setItem('genesis_deai_intensity','strong');Modules.settings.refresh();">强力</button>
                    </div>
                </div>
            </div>

            <!-- 智能审稿 -->
            <div class="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-default)] space-y-3">
                <div class="text-[10px] font-bold text-dim uppercase tracking-wider">智能审稿</div>
                <div class="space-y-1">
                    <label class="text-[10px] text-dim">审稿维度（勾选启用）</label>
                    <div class="grid grid-cols-2 gap-2">
                        ${allDims.map(d => `
                            <label class="flex items-center gap-2 p-2 rounded-lg bg-white/5 cursor-pointer hover:bg-white/10 transition">
                                <input type="checkbox" class="w-3.5 h-3.5 rounded accent-accent" ${reviewDims.includes(d.id) ? 'checked' : ''}
                                    onchange="Modules.settings._toggleReviewDim('${d.id}', this.checked)">
                                <span class="text-[11px] text-dim">${d.label}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- 生成器偏好 -->
            <div class="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-default)] space-y-3">
                <div class="text-[10px] font-bold text-dim uppercase tracking-wider">生成器广场</div>
                <div class="space-y-1">
                    <label class="text-[10px] text-dim">默认保存位置</label>
                    <select class="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white" onchange="localStorage.setItem('genesis_gen_save',this.value)">
                        <option value="library" ${(localStorage.getItem('genesis_gen_save')||'library')==='library'?'selected':''}>阅读中心</option>
                        <option value="clipboard" ${(localStorage.getItem('genesis_gen_save')||'')==='clipboard'?'selected':''}>仅复制到剪贴板</option>
                    </select>
                </div>
            </div>

            <!-- 多模态API状态 -->
            <div class="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-default)] space-y-3">
                <div class="text-[10px] font-bold text-dim uppercase tracking-wider">多模态API状态</div>
                <div class="grid grid-cols-3 gap-2">
                    <div class="p-2 rounded-lg bg-white/5 text-center">
                        <i class="fa-solid fa-image text-purple-400 text-xs mb-1"></i>
                        <div class="text-[10px] text-dim">图像</div>
                        <div class="text-[9px] ${AI.hasConfig ? 'text-dim' : 'text-dim'}">检测中...</div>
                    </div>
                    <div class="p-2 rounded-lg bg-white/5 text-center">
                        <i class="fa-solid fa-video text-red-400 text-xs mb-1"></i>
                        <div class="text-[10px] text-dim">视频</div>
                        <div class="text-[9px] text-dim">需配置</div>
                    </div>
                    <div class="p-2 rounded-lg bg-white/5 text-center">
                        <i class="fa-solid fa-music text-green-400 text-xs mb-1"></i>
                        <div class="text-[10px] text-dim">音频</div>
                        <div class="text-[9px] text-dim">需配置</div>
                    </div>
                </div>
                <div class="text-[9px] text-dim">提示: 在「API卡池」标签页配置 image/video/audio API 以启用多模态生成功能。</div>
            </div>
        </div>`;
    },

    _toggleReviewDim(dim, enabled) {
        let dims = JSON.parse(localStorage.getItem('genesis_review_dims') || '["plot_logic","character","style","pacing","dialogue","world_consistency","commercial"]');
        if (enabled) { if (!dims.includes(dim)) dims.push(dim); }
        else { dims = dims.filter(d => d !== dim); }
        localStorage.setItem('genesis_review_dims', JSON.stringify(dims));
    }
});
