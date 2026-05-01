// settings_theme.js — 主题与个性化设置
Modules.settings = Object.assign(Modules.settings || {}, {
    _renderThemeTab() {
        const current = ThemeEngine.getCurrentSettings();
        const themes = ThemeEngine.getThemeList();
        const animOpts = [{id:'none',label:'无动画'},{id:'fast',label:'快速'},{id:'normal',label:'标准'},{id:'slow',label:'慢速'}];
        const radiusOpts = [{id:'none',label:'无圆角'},{id:'small',label:'小'},{id:'medium',label:'中'},{id:'large',label:'大'},{id:'round',label:'全圆'}];

        return `
        <div class="space-y-6">
            <!-- 主题选择 -->
            <div>
                <div class="text-[10px] font-bold text-dim uppercase tracking-wider mb-3">主题预设</div>
                <div class="grid grid-cols-4 gap-2">
                    ${themes.map(t => `
                        <button class="group relative p-3 rounded-xl border transition-all ${current.theme === t.id ? 'border-accent ring-1 ring-accent' : 'border-white/10 hover:border-white/20'}"
                            onclick="ThemeEngine.applyTheme('${t.id}'); Modules.settings.refresh();"
                            style="background: ${t.vars['--bg-elevated']}; color: ${t.vars['--text-primary']};">
                            <div class="w-full h-8 rounded-lg mb-2" style="background: ${t.vars['--bg-card']}; border: 1px solid ${t.vars['--border-default']};">
                                <div class="w-3 h-3 rounded-full m-1.5" style="background: ${t.color};"></div>
                            </div>
                            <div class="text-[10px] font-bold" style="color: ${t.vars['--text-primary']};">${t.label}</div>
                            <div class="text-[8px] opacity-60">${t.icon}</div>
                            ${current.theme === t.id ? '<div class="absolute top-1 right-1 w-4 h-4 rounded-full bg-accent text-black flex center text-[8px] font-bold"><i class="fa-solid fa-check"></i></div>' : ''}
                        </button>
                    `).join('')}
                </div>
            </div>

            <!-- 界面效果 -->
            <div>
                <div class="text-[10px] font-bold text-dim uppercase tracking-wider mb-3">界面效果</div>
                <div class="space-y-3">
                    <div class="flex items-center justify-between p-3 bg-[var(--bg-card)] rounded-lg border border-[var(--border-default)]">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-wand-magic-sparkles text-accent"></i>
                            <div>
                                <div class="text-xs font-bold text-white">玻璃拟态</div>
                                <div class="text-[9px] text-dim">透明模糊背景效果</div>
                            </div>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" class="sr-only peer" ${current.glassEffect ? 'checked' : ''} onchange="ThemeEngine.setGlassEffect(this.checked)">
                            <div class="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent"></div>
                        </label>
                    </div>
                    <div class="flex items-center justify-between p-3 bg-[var(--bg-card)] rounded-lg border border-[var(--border-default)]">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-gauge-high text-accent"></i>
                            <div>
                                <div class="text-xs font-bold text-white">动画速度</div>
                                <div class="text-[9px] text-dim">界面过渡动画速度</div>
                            </div>
                        </div>
                        <div class="flex gap-1">
                            ${animOpts.map(o => `
                                <button class="px-2 py-1 rounded text-[10px] transition-all ${current.animSpeed === o.id ? 'bg-accent text-black font-bold' : 'bg-white/5 text-dim hover:bg-white/10'}"
                                    onclick="ThemeEngine.setAnimSpeed('${o.id}'); Modules.settings.refresh();">${o.label}</button>
                            `).join('')}
                        </div>
                    </div>
                    <div class="flex items-center justify-between p-3 bg-[var(--bg-card)] rounded-lg border border-[var(--border-default)]">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-circle-notch text-accent"></i>
                            <div>
                                <div class="text-xs font-bold text-white">圆角风格</div>
                                <div class="text-[9px] text-dim">全局组件圆角大小</div>
                            </div>
                        </div>
                        <div class="flex gap-1">
                            ${radiusOpts.map(o => `
                                <button class="px-2 py-1 rounded text-[10px] transition-all ${current.borderRadius === o.id ? 'bg-accent text-black font-bold' : 'bg-white/5 text-dim hover:bg-white/10'}"
                                    onclick="ThemeEngine.setBorderRadius('${o.id}'); Modules.settings.refresh();">${o.label}</button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    }
});
