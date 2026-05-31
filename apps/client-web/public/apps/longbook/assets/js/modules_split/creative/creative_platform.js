// creative_platform.js — 平台适配中心 (Platform Adapter)
// 对标: 星月写作 多平台格式与敏感词适配
// 预置番茄/起点/晋江/飞卢/七猫等平台模板，格式调整+敏感词检测
Object.assign(Modules.creative_studio, {
    _platformType: 'fanqie',
    _platformResult: '',

    PLATFORMS: {
        fanqie: { name: '番茄小说', maxTitle: 15, paraLines: 3, sensitive: ['赘婿','重生','王爷','总裁'], replace: {'赘婿':'上门女婿','重生':'重回少年时','王爷':'殿下','总裁':'CEO'} },
        qidian: { name: '起点中文网', maxTitle: 20, paraLines: 4, sensitive: ['杀','死','血'], replace: {'杀':'斩','死':'逝去','血':'红'} },
        jinjiang: { name: '晋江文学城', maxTitle: 25, paraLines: 3, sensitive: ['啪啪','肏','操'], replace: {'啪啪':'声音','肏':'','操':'做'} },
        feilu: { name: '飞卢小说', maxTitle: 15, paraLines: 3, sensitive: [], replace: {} },
        qimao: { name: '七猫小说', maxTitle: 18, paraLines: 3, sensitive: [], replace: {} }
    },

    _renderPlatformTab() {
        const p = this.PLATFORMS[this._platformType];
        return `
        <div class="flex flex-col h-full overflow-hidden">
            <div class="shrink-0 p-4 border-b border-white/5 bg-gradient-to-r from-cyan-900/20 to-transparent">
                <div class="flex items-center gap-2 mb-1">
                    <i class="fa-solid fa-share-from-square text-cyan-400"></i>
                    <span class="font-bold text-white text-sm">平台适配中心</span>
                    <span class="text-[9px] text-dim bg-white/5 px-1.5 py-0.5 rounded">v3.0</span>
                </div>
                <div class="flex items-center justify-between">
                    <div class="text-[10px] text-dim">一键适配各网文平台的格式要求和敏感词规则</div>
                    ${Modules.creative_studio._renderPromptEditButton('platform','平台适配')}
                </div>
            </div>
            <div class="flex-1 flex min-h-0">
                <div class="w-64 shrink-0 flex flex-col border-r border-white/5 bg-[#0d0d0f] p-3 gap-2 overflow-y-auto">
                    <div class="text-[10px] text-dim font-bold">选择平台</div>
                    ${Object.entries(this.PLATFORMS).map(([k, v]) => `
                        <button class="w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all ${this._platformType===k ? 'bg-cyan-500/15 border border-cyan-500/30' : 'bg-white/5 border border-transparent hover:bg-white/10'}"
                            onclick="Modules.creative_studio._setPlatform('${k}')">
                            <div class="w-6 h-6 rounded bg-white/10 flex center shrink-0">
                                <span class="text-[8px] font-bold ${this._platformType===k ? 'text-cyan-400' : 'text-dim'}">${v.name.charAt(0)}</span>
                            </div>
                            <div>
                                <div class="text-[11px] font-bold ${this._platformType===k ? 'text-white' : 'text-dim'}">${v.name}</div>
                                <div class="text-[8px] text-dim">标题≤${v.maxTitle}字 · 每段≤${v.paraLines}行</div>
                            </div>
                        </button>
                    `).join('')}
                    <div class="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg mt-2">
                        <div class="text-[9px] text-cyan-300 font-bold mb-1">${p.name}规则</div>
                        <div class="text-[8px] text-dim space-y-0.5">
                            <div>• 章节标题 ≤ ${p.maxTitle}字</div>
                            <div>• 每段 ≤ ${p.paraLines}行</div>
                            <div>• 敏感词: ${p.sensitive.length ? p.sensitive.join(' / ') : '暂无预设'}</div>
                        </div>
                    </div>
                </div>
                <div class="flex-1 flex flex-col p-4 gap-3">
                    <div class="flex items-center justify-between">
                        <label class="text-xs font-bold text-white">输入内容</label>
                        <button class="text-[10px] text-dim hover:text-white transition" onclick="Modules.creative_studio._pastePlatform()"><i class="fa-solid fa-paste mr-1"></i>粘贴</button>
                    </div>
                    <textarea id="cs-platform-input" class="flex-1 min-h-0 bg-[#0a0a0c] border border-white/10 rounded-lg p-3 text-xs text-main resize-none focus:border-cyan-500/50 focus:outline-none" placeholder="粘贴需要适配的章节内容..."></textarea>
                    <button class="btn bg-cyan-600/20 text-cyan-400 border-cyan-600/30 hover:bg-cyan-600/30 font-bold text-xs py-2.5 rounded-xl" onclick="Modules.creative_studio._runPlatformAdapt()">
                        <i class="fa-solid fa-wand-magic-sparkles mr-1"></i>适配${p.name}格式
                    </button>
                    <div class="flex items-center justify-between">
                        <label class="text-xs font-bold text-white">适配结果</label>
                        <div class="flex gap-1">
                            <button class="text-[10px] text-dim hover:text-white transition px-2 py-1" onclick="Modules.creative_studio._copyPlatformResult()"><i class="fa-solid fa-copy mr-1"></i>复制</button>
                            <button class="text-[10px] text-dim hover:text-white transition px-2 py-1" onclick="Modules.creative_studio._downloadPlatformResult()"><i class="fa-solid fa-download mr-1"></i>下载TXT</button>
                        </div>
                    </div>
                    <div id="cs-platform-result" class="flex-1 min-h-[200px] bg-[#0a0a0c] border border-white/10 rounded-lg p-3 text-xs text-main overflow-y-auto"></div>
                </div>
            </div>
        </div>`;
    },

    _setPlatform(id) {
        this._platformType = id;
        this.switchTab('platform');
    },

    _pastePlatform() {
        navigator.clipboard.readText().then(t => {
            const el = document.getElementById('cs-platform-input');
            if (el) el.value = t;
        }).catch(() => UI.toast('无法读取剪贴板', 'error'));
    },

    _runPlatformAdapt() {
        const input = (document.getElementById('cs-platform-input') || {}).value || '';
        if (!input.trim()) return UI.toast('请输入内容');
        const p = this.PLATFORMS[this._platformType];
        const resultEl = document.getElementById('cs-platform-result');

        // 处理格式
        let result = input;
        let stats = { replaced: 0, paragraphs: 0, warnings: [] };

        // 段落处理：按平台要求拆分长段落
        const lines = result.split('\n');
        const newLines = [];
        lines.forEach(line => {
            if (line.trim().startsWith('第') && line.trim().includes('章')) {
                // 章节标题
                if (line.length > p.maxTitle + 10) {
                    stats.warnings.push(`章节标题过长 (${line.length}字 > ${p.maxTitle}字限制)`);
                }
                newLines.push(line.trim());
                newLines.push('');
            } else if (line.trim()) {
                const paras = this._splitParagraph(line.trim(), p.paraLines);
                paras.forEach(para => {
                    newLines.push(para);
                    newLines.push('');
                    stats.paragraphs++;
                });
            }
        });
        result = newLines.join('\n');

        // 敏感词替换
        Object.entries(p.replace).forEach(([word, replacement]) => {
            const regex = new RegExp(word, 'g');
            const matches = result.match(regex);
            if (matches) {
                stats.replaced += matches.length;
                result = result.replace(regex, replacement);
            }
        });

        // 检测未替换的敏感词
        p.sensitive.forEach(word => {
            if (result.includes(word) && !p.replace[word]) {
                stats.warnings.push(`发现敏感词未处理: 「${word}」`);
            }
        });

        this._platformResult = result;

        // 渲染结果
        const warningHtml = stats.warnings.length ? `<div class="mb-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg"><div class="text-[9px] font-bold text-amber-400 mb-1"><i class="fa-solid fa-triangle-exclamation mr-1"></i>警告</div>${stats.warnings.map(w => `<div class="text-[10px] text-amber-300">• ${w}</div>`).join('')}</div>` : '';
        const statsHtml = `<div class="mb-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg"><div class="text-[9px] font-bold text-green-400 mb-1"><i class="fa-solid fa-check mr-1"></i>处理统计</div><div class="text-[10px] text-dim">段落拆分: ${stats.paragraphs}处 · 敏感词替换: ${stats.replaced}处 · 总字数: ${result.length}</div></div>`;

        if (resultEl) resultEl.innerHTML = warningHtml + statsHtml + `<pre class="text-xs text-main whitespace-pre-wrap font-mono leading-relaxed">${result}</pre>`;
        UI.toast('适配完成', stats.warnings.length ? 'warning' : 'success');
    },

    _splitParagraph(text, maxLines) {
        const maxChars = maxLines * 25; // 估算每行25字
        if (text.length <= maxChars) return [text];
        const sentences = text.split(/([。！？；\.\!\?\;])/);
        const result = [];
        let current = '';
        for (let i = 0; i < sentences.length; i++) {
            const s = sentences[i];
            if ((current + s).length > maxChars && current) {
                result.push(current);
                current = s;
            } else {
                current += s;
            }
        }
        if (current) result.push(current);
        return result;
    },

    _copyPlatformResult() {
        if (!this._platformResult) return UI.toast('无内容可复制');
        navigator.clipboard.writeText(this._platformResult).then(() => UI.toast('已复制到剪贴板'));
    },

    _downloadPlatformResult() {
        if (!this._platformResult) return UI.toast('无内容可下载');
        const blob = new Blob([this._platformResult], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `适配_${this._platformType}_${new Date().toLocaleDateString()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        UI.toast('已下载');
    }
});
