// settings_typography.js — 字体与排版设置
Modules.settings = Object.assign(Modules.settings || {}, {
    _renderTypographyTab() {
        const current = ThemeEngine.getCurrentSettings();
        const fonts = ThemeEngine.getFontList();
        const editorFonts = ThemeEngine.getEditorFontList();

        return `
        <div class="space-y-6">
            <!-- 界面字体 -->
            <div>
                <div class="text-[10px] font-bold text-dim uppercase tracking-wider mb-3">界面字体</div>
                <div class="grid grid-cols-2 gap-2">
                    ${fonts.map(f => `
                        <button class="p-3 rounded-xl border text-left transition-all ${current.font === f.id ? 'border-accent bg-accent/5' : 'border-white/10 hover:border-white/20'}"
                            onclick="ThemeEngine.applyFont('${f.id}'); Modules.settings.refresh();">
                            <div class="text-sm font-bold text-white mb-1" style="font-family: ${f.family};">${f.label}</div>
                            <div class="text-[10px] text-dim" style="font-family: ${f.family};">ABCDEFG abcdefg 12345 中文示例</div>
                        </button>
                    `).join('')}
                </div>
            </div>

            <!-- 编辑器字体 -->
            <div>
                <div class="text-[10px] font-bold text-dim uppercase tracking-wider mb-3">编辑器字体</div>
                <div class="grid grid-cols-2 gap-2">
                    ${editorFonts.map(f => `
                        <button class="p-3 rounded-xl border text-left transition-all ${current.editorFont === f.id ? 'border-accent bg-accent/5' : 'border-white/10 hover:border-white/20'}"
                            onclick="ThemeEngine.applyEditorFont('${f.id}'); Modules.settings.refresh();">
                            <div class="text-sm font-bold text-white mb-1" style="font-family: ${f.family};">${f.label}</div>
                            <div class="text-[10px] text-dim" style="font-family: ${f.family};">春风又绿江南岸，明月何时照我还。</div>
                        </button>
                    `).join('')}
                </div>
            </div>

            <!-- 编辑器排版 -->
            <div>
                <div class="text-[10px] font-bold text-dim uppercase tracking-wider mb-3">编辑器排版</div>
                <div class="space-y-4 p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-default)]">
                    <div>
                        <div class="flex justify-between mb-2">
                            <span class="text-xs text-white font-bold">字号</span>
                            <span class="text-xs text-accent font-bold" id="st-editor-size-val">${current.editorSize}px</span>
                        </div>
                        <input type="range" min="12" max="32" value="${current.editorSize}" class="w-full accent-accent"
                            oninput="ThemeEngine.setEditorSize(this.value); document.getElementById('st-editor-size-val').textContent = this.value + 'px';">
                        <div class="flex justify-between text-[9px] text-dim mt-1"><span>12px</span><span>32px</span></div>
                    </div>
                    <div>
                        <div class="flex justify-between mb-2">
                            <span class="text-xs text-white font-bold">行高</span>
                            <span class="text-xs text-accent font-bold" id="st-editor-lh-val">${current.editorLineHeight}</span>
                        </div>
                        <input type="range" min="12" max="25" value="${Math.round(current.editorLineHeight * 10)}" class="w-full accent-accent"
                            oninput="const v=this.value/10; ThemeEngine.setEditorLineHeight(v); document.getElementById('st-editor-lh-val').textContent = v.toFixed(1);">
                        <div class="flex justify-between text-[9px] text-dim mt-1"><span>1.2</span><span>2.5</span></div>
                    </div>
                    <div class="pt-2 border-t border-white/5">
                        <div class="text-[10px] text-dim mb-2">预览</div>
                        <div class="p-3 bg-black/30 rounded-lg border border-white/5 editor-dynamic" id="st-editor-preview">
                            春风又绿江南岸，明月何时照我还。
                        </div>
                    </div>
                </div>
            </div>

            <!-- 侧边栏宽度 -->
            <div>
                <div class="text-[10px] font-bold text-dim uppercase tracking-wider mb-3">侧边栏宽度</div>
                <div class="flex items-center gap-3 p-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border-default)]">
                    <input type="range" min="180" max="400" value="${current.sidebarWidth}" class="flex-1 accent-accent"
                        oninput="ThemeEngine.setSidebarWidth(this.value)">
                    <span class="text-xs text-accent font-bold w-12 text-right">${current.sidebarWidth}px</span>
                </div>
            </div>
        </div>`;
    }
});
