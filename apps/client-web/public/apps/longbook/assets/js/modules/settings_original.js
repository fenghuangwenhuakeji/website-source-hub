// ═══════════════════════════════════════════════════════════════
// 系统设置 (Settings) — 大幅升级版
// (LocalSync 已移至 db.js，与 DB 深度集成)
// ═══════════════════════════════════════════════════════════════
Modules.settings = {
    currentTab: 'api',
    currentType: null,
    currentId: null,

    render: () => {
        const t = Modules.settings.currentTab;
        const tabs = [
            {id:'api',      icon:'fa-plug',         text:'API 配置'},
            {id:'appear',   icon:'fa-palette',       text:'外观主题'},
            {id:'writing',  icon:'fa-feather-pointed', text:'写作偏好'},
            {id:'memory',   icon:'fa-brain',         text:'记忆与上下文'},
            {id:'shortcut', icon:'fa-keyboard',      text:'快捷键'},
            {id:'data',     icon:'fa-database',      text:'数据管理'},
            {id:'about',    icon:'fa-circle-info',   text:'关于'}
        ];
        return `
        <div class="flex h-full bg-[#08080a] overflow-hidden">
            <!-- 左侧导航 -->
            <div class="w-56 shrink-0 flex flex-col bg-[#0e0e10] border-r border-white/5">
                <div class="p-4 border-b border-white/5">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-600 to-gray-800 flex center text-white text-sm"><i class="fa-solid fa-gear"></i></div>
                        <div>
                            <div class="font-bold text-white text-sm">系统设置</div>
                            <div class="text-[10px] text-dim">v2.0 Genesis</div>
                        </div>
                    </div>
                </div>
                <div class="flex-1 overflow-y-auto p-2 space-y-0.5">
                    ${tabs.map(tb => `
                        <button class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-bold transition-all ${t===tb.id ? 'bg-white/10 text-white' : 'text-dim hover:bg-white/5'}" onclick="Modules.settings.switchTab('${tb.id}')">
                            <i class="fa-solid ${tb.icon} w-4 text-center text-[10px]"></i>
                            <span>${tb.text}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
            <!-- 右侧内容 -->
            <div class="flex-1 overflow-y-auto p-6" id="settings-content">
                ${Modules.settings._renderContent()}
            </div>
        </div>
        <!-- API Modal -->
        ${Modules.settings._renderApiModal()}
        `;
    },

    switchTab: (tab) => {
        Modules.settings.currentTab = tab;
        const el = document.getElementById('module-view-settings');
        if(el) el.innerHTML = Modules.settings.render();
        if(tab === 'api') Modules.settings._refreshApiPool();
        if(tab === 'data') setTimeout(() => LocalSync._updateStatusBar(), 50);
    },

    init: () => {
        if(Modules.settings.currentTab === 'api') Modules.settings._refreshApiPool();
        if(Modules.settings.currentTab === 'data') setTimeout(() => LocalSync._updateStatusBar(), 50);
    },

    // ═══ 内容渲染 ═══
    _renderContent: () => {
        const t = Modules.settings.currentTab;

        if(t === 'api') return `
            <div class="max-w-3xl space-y-6">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-lg font-bold text-white">文本生成 API 流量池</h2>
                        <p class="text-xs text-dim mt-1">配置多个 API 端点，点击卡片切换激活状态。支持 OpenAI / Gemini / Claude 等兼容接口。</p>
                    </div>
                    <button class="btn btn-sm bg-white/10 text-white hover:bg-white/20 font-bold" onclick="Modules.settings.addPool()"><i class="fa-solid fa-plus mr-1"></i>添加配置</button>
                </div>
                <div id="pool-text" class="space-y-2"></div>
                <!-- 连接测试 -->
                <div class="p-4 bg-[#111] rounded-xl border border-white/5 space-y-3">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-dim uppercase">连接测试</span>
                        <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30" onclick="Modules.settings.testConnection()"><i class="fa-solid fa-bolt mr-1"></i>测试当前激活 API</button>
                    </div>
                    <div id="api-test-result" class="text-xs text-dim font-mono p-2 bg-black/30 rounded min-h-[40px]">点击测试按钮检查 API 连通性...</div>
                </div>
                <!-- 全局参数 -->
                <div class="p-4 bg-[#111] rounded-xl border border-white/5 space-y-4">
                    <span class="text-xs font-bold text-dim uppercase">全局生成参数</span>
                    <div class="grid grid-cols-3 gap-4">
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] text-dim">Temperature</label>
                            <input id="g-temp" type="number" step="0.1" min="0" max="2" class="input bg-black/30 border-white/10 h-9 text-sm text-white" value="0.7">
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] text-dim">Max Tokens</label>
                            <input id="g-tokens" type="number" min="256" max="128000" class="input bg-black/30 border-white/10 h-9 text-sm text-white" value="4096">
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] text-dim">Top P</label>
                            <input id="g-topp" type="number" step="0.05" min="0" max="1" class="input bg-black/30 border-white/10 h-9 text-sm text-white" value="0.95">
                        </div>
                    </div>
                    <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.settings._saveGlobalParams()"><i class="fa-solid fa-save mr-1"></i>保存全局参数</button>
                </div>
            </div>`;

        if(t === 'appear') return `
            <div class="max-w-3xl space-y-6">
                <h2 class="text-lg font-bold text-white">外观与主题</h2>
                <!-- 主题色 -->
                <div class="p-4 bg-[#111] rounded-xl border border-white/5 space-y-4">
                    <span class="text-xs font-bold text-dim uppercase">主题色</span>
                    <div class="flex gap-3">
                        ${[
                            {color:'#ffd700',name:'金色'},
                            {color:'#3b82f6',name:'蓝色'},
                            {color:'#ec4899',name:'粉色'},
                            {color:'#10b981',name:'绿色'},
                            {color:'#f97316',name:'橙色'},
                            {color:'#a855f7',name:'紫色'},
                            {color:'#ef4444',name:'红色'},
                            {color:'#06b6d4',name:'青色'}
                        ].map(c => `
                            <button class="w-8 h-8 rounded-full border-2 border-white/20 hover:scale-110 hover:border-white/50 transition-all relative group" style="background:${c.color}" onclick="document.documentElement.style.setProperty('--accent','${c.color}');localStorage.setItem('theme_accent','${c.color}');UI.toast('主题色已切换')">
                                <span class="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-dim opacity-0 group-hover:opacity-100 whitespace-nowrap">${c.name}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
                <!-- 字体 -->
                <div class="p-4 bg-[#111] rounded-xl border border-white/5 space-y-4">
                    <span class="text-xs font-bold text-dim uppercase">字体设置</span>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] text-dim">界面字体</label>
                            <select class="input bg-black/30 border-white/10 h-9 text-sm text-white" onchange="document.body.style.fontFamily=this.value;localStorage.setItem('ui_font',this.value)">
                                <option value="'Inter',system-ui,sans-serif">默认 (System)</option>
                                <option value="'Microsoft YaHei',sans-serif">微软雅黑</option>
                                <option value="'PingFang SC',sans-serif">苹方</option>
                                <option value="'Noto Sans SC',sans-serif">Noto Sans</option>
                            </select>
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] text-dim">编辑器字体</label>
                            <select class="input bg-black/30 border-white/10 h-9 text-sm text-white" id="editor-font" onchange="localStorage.setItem('editor_font',this.value)">
                                <option value="'Georgia',serif">Georgia (衬线)</option>
                                <option value="'Songti SC',serif">宋体</option>
                                <option value="'Fira Code',monospace">Fira Code (等宽)</option>
                                <option value="system-ui,sans-serif">系统无衬线</option>
                            </select>
                        </div>
                    </div>
                </div>
                <!-- 字号 -->
                <div class="p-4 bg-[#111] rounded-xl border border-white/5 space-y-4">
                    <span class="text-xs font-bold text-dim uppercase">字号与行距</span>
                    <div class="grid grid-cols-3 gap-4">
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] text-dim">编辑器字号</label>
                            <input type="range" min="12" max="24" value="16" class="accent-blue-500" oninput="localStorage.setItem('editor_size',this.value);document.getElementById('sz-val').textContent=this.value+'px'">
                            <span class="text-[10px] text-dim text-center" id="sz-val">16px</span>
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] text-dim">行距</label>
                            <input type="range" min="1.2" max="2.5" step="0.1" value="1.8" class="accent-blue-500" oninput="localStorage.setItem('editor_lh',this.value);document.getElementById('lh-val').textContent=this.value">
                            <span class="text-[10px] text-dim text-center" id="lh-val">1.8</span>
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] text-dim">侧边栏宽度</label>
                            <select class="input bg-black/30 border-white/10 h-9 text-xs text-white" onchange="localStorage.setItem('sidebar_w',this.value)">
                                <option value="compact">紧凑</option>
                                <option value="normal" selected>标准</option>
                                <option value="wide">宽松</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>`;

        if(t === 'writing') return Modules.settings._renderWritingTab();
        if(t === 'memory') return Modules.settings._renderMemoryTab();
        if(t === 'shortcut') return Modules.settings._renderShortcutTab();
        if(t === 'data') return Modules.settings._renderDataTab();
        if(t === 'about') return Modules.settings._renderAboutTab();
        return '';
    },

    _renderWritingTab: () => `
        <div class="max-w-3xl space-y-6">
            <h2 class="text-lg font-bold text-white">写作偏好</h2>
            <div class="p-4 bg-[#111] rounded-xl border border-white/5 space-y-4">
                <span class="text-xs font-bold text-dim uppercase">默认创作参数</span>
                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] text-dim">默认文风</label>
                        <select id="s-style" class="input bg-black/30 border-white/10 h-9 text-sm text-white">
                            <option>严肃文学</option><option>网络小说</option><option>轻小说</option><option>学术论文</option><option>剧本</option><option>诗歌</option>
                        </select>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] text-dim">默认人称</label>
                        <select id="s-pov" class="input bg-black/30 border-white/10 h-9 text-sm text-white">
                            <option>第一人称</option><option>第三人称限制</option><option>第三人称全知</option><option>第二人称</option>
                        </select>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] text-dim">单次生成目标字数</label>
                        <input type="number" id="s-wordcount" class="input bg-black/30 border-white/10 h-9 text-sm text-white" value="2000" min="500" max="10000" step="500">
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] text-dim">续写上文截取长度</label>
                        <input type="number" id="s-context-len" class="input bg-black/30 border-white/10 h-9 text-sm text-white" value="1500" min="500" max="5000" step="500">
                    </div>
                </div>
            </div>
            <div class="p-4 bg-[#111] rounded-xl border border-white/5 space-y-4">
                <span class="text-xs font-bold text-dim uppercase">自动功能</span>
                <div class="space-y-3">
                    <label class="flex items-center justify-between text-xs text-gray-300 cursor-pointer">
                        <span>生成后自动保存到工作记忆</span>
                        <input type="checkbox" checked class="accent-blue-500" onchange="localStorage.setItem('auto_memory',this.checked)">
                    </label>
                    <label class="flex items-center justify-between text-xs text-gray-300 cursor-pointer">
                        <span>续写时自动注入 RAG 上下文</span>
                        <input type="checkbox" checked class="accent-blue-500" onchange="localStorage.setItem('auto_rag',this.checked)">
                    </label>
                    <label class="flex items-center justify-between text-xs text-gray-300 cursor-pointer">
                        <span>生成完成后自动复制到剪贴板</span>
                        <input type="checkbox" class="accent-blue-500" onchange="localStorage.setItem('auto_copy',this.checked)">
                    </label>
                    <label class="flex items-center justify-between text-xs text-gray-300 cursor-pointer">
                        <span>编辑器自动保存 (每30秒)</span>
                        <input type="checkbox" checked class="accent-blue-500" onchange="localStorage.setItem('auto_save',this.checked)">
                    </label>
                </div>
            </div>
            <div class="p-4 bg-[#111] rounded-xl border border-white/5 space-y-4">
                <span class="text-xs font-bold text-dim uppercase">全局写作规则 (注入所有创作提示词)</span>
                <textarea id="s-global-rules" class="textarea w-full bg-black/30 border-white/10 h-32 text-xs text-gray-300 font-mono leading-relaxed" placeholder="例如：\n- 禁止使用「的」字超过3次连续\n- 对话要有潜台词\n- 描写要调动五感\n- 每段不超过200字">${localStorage.getItem('global_rules') || ''}</textarea>
                <button class="btn btn-xs bg-white/5 text-dim" onclick="localStorage.setItem('global_rules',document.getElementById('s-global-rules').value);UI.toast('全局规则已保存')"><i class="fa-solid fa-save mr-1"></i>保存规则</button>
            </div>
        </div>`,

    _renderMemoryTab: () => `
        <div class="max-w-3xl space-y-6">
            <h2 class="text-lg font-bold text-white">记忆与上下文</h2>
            <div class="p-4 bg-[#111] rounded-xl border border-white/5 space-y-4">
                <span class="text-xs font-bold text-dim uppercase">RAG 检索配置</span>
                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] text-dim">检索结果数量 (Top K)</label>
                        <input type="number" class="input bg-black/30 border-white/10 h-9 text-sm text-white" value="5" min="1" max="20" onchange="localStorage.setItem('rag_topk',this.value)">
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] text-dim">上下文窗口 (tokens)</label>
                        <input type="number" class="input bg-black/30 border-white/10 h-9 text-sm text-white" value="1000" min="200" max="5000" step="200" onchange="localStorage.setItem('rag_window',this.value)">
                    </div>
                </div>
            </div>
            <div class="p-4 bg-[#111] rounded-xl border border-white/5 space-y-4">
                <span class="text-xs font-bold text-dim uppercase">三层记忆配置</span>
                <div class="grid grid-cols-3 gap-4">
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] text-dim">工作记忆容量</label>
                        <input type="number" class="input bg-black/30 border-white/10 h-9 text-sm text-white" value="50" min="10" max="200" onchange="localStorage.setItem('mem_working',this.value)">
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] text-dim">短期记忆容量</label>
                        <input type="number" class="input bg-black/30 border-white/10 h-9 text-sm text-white" value="200" min="50" max="1000" onchange="localStorage.setItem('mem_short',this.value)">
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] text-dim">长期记忆容量</label>
                        <input type="number" class="input bg-black/30 border-white/10 h-9 text-sm text-white" value="1000" min="100" max="10000" onchange="localStorage.setItem('mem_long',this.value)">
                    </div>
                </div>
            </div>
            <div class="p-4 bg-[#111] rounded-xl border border-white/5 space-y-3">
                <span class="text-xs font-bold text-dim uppercase">记忆统计</span>
                <div class="grid grid-cols-3 gap-4 text-center" id="mem-stats">
                    <div class="p-3 bg-black/30 rounded-lg"><div class="text-xl font-bold text-amber-400" id="ms-working">-</div><div class="text-[10px] text-dim">工作记忆</div></div>
                    <div class="p-3 bg-black/30 rounded-lg"><div class="text-xl font-bold text-blue-400" id="ms-short">-</div><div class="text-[10px] text-dim">短期记忆</div></div>
                    <div class="p-3 bg-black/30 rounded-lg"><div class="text-xl font-bold text-green-400" id="ms-long">-</div><div class="text-[10px] text-dim">长期记忆</div></div>
                </div>
                <button class="btn btn-xs bg-red-600/20 text-red-400 border-red-600/30" onclick="if(confirm('清空所有记忆数据？')){if(typeof MemorySystem!=='undefined'){MemorySystem.working=[];MemorySystem.shortTerm=[];MemorySystem.longTerm=[];}UI.toast('记忆已清空')}"><i class="fa-solid fa-eraser mr-1"></i>清空全部记忆</button>
            </div>
        </div>`,

    _renderShortcutTab: () => `
        <div class="max-w-3xl space-y-6">
            <h2 class="text-lg font-bold text-white">快捷键配置</h2>
            <div class="p-4 bg-[#111] rounded-xl border border-white/5">
                <div class="space-y-2">
                    ${[
                        {action:'AI 续写', key:'Ctrl + Enter'},
                        {action:'唤起搜索', key:'Ctrl + K'},
                        {action:'保存', key:'Ctrl + S'},
                        {action:'新建对话', key:'Ctrl + N'},
                        {action:'切换侧边栏', key:'Ctrl + B'},
                        {action:'复制选中', key:'Ctrl + C'},
                        {action:'全选', key:'Ctrl + A'},
                        {action:'撤销', key:'Ctrl + Z'}
                    ].map(s => `
                        <div class="flex justify-between items-center text-xs text-gray-300 bg-black/20 p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                            <span>${s.action}</span>
                            <kbd class="bg-black/50 px-3 py-1 rounded border border-white/10 font-mono text-white text-[11px]">${s.key}</kbd>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>`,

    _renderDataTab: () => `
        <div class="max-w-3xl space-y-6">
            <h2 class="text-lg font-bold text-white">数据管理</h2>
            <!-- 本地文件夹永久存储 -->
            <div class="p-4 bg-[#111] rounded-xl border border-amber-500/20 space-y-4 relative overflow-hidden">
                <div class="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500"></div>
                <div class="flex items-center gap-2">
                    <i class="fa-solid fa-hard-drive text-amber-400"></i>
                    <span class="text-xs font-bold text-amber-400 uppercase">本地文件夹永久存储</span>
                    <span class="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">${LocalSync.hasFSAPI() || LocalSync.isElectron() ? '可用' : '不支持'}</span>
                </div>
                <div id="local-sync-status"></div>
            </div>
            <!-- 备份恢复 -->
            <div class="p-4 bg-[#111] rounded-xl border border-white/5 space-y-4">
                <span class="text-xs font-bold text-dim uppercase">备份与恢复</span>
                <div class="grid grid-cols-2 gap-4">
                    <button class="p-4 bg-black/30 rounded-xl border border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all text-left group" onclick="Modules.settings.exportData()">
                        <i class="fa-solid fa-download text-blue-400 text-lg mb-2 group-hover:scale-110 transition-transform inline-block"></i>
                        <div class="text-sm font-bold text-white">导出备份</div>
                        <div class="text-[10px] text-dim mt-1">将所有数据导出为 JSON 文件</div>
                    </button>
                    <button class="p-4 bg-black/30 rounded-xl border border-white/5 hover:border-green-500/30 hover:bg-green-500/5 transition-all text-left group" onclick="document.getElementById('import-file').click()">
                        <i class="fa-solid fa-upload text-green-400 text-lg mb-2 group-hover:scale-110 transition-transform inline-block"></i>
                        <div class="text-sm font-bold text-white">恢复数据</div>
                        <div class="text-[10px] text-dim mt-1">从 JSON 备份文件恢复</div>
                    </button>
                    <input type="file" id="import-file" class="hidden" accept=".json" onchange="Modules.settings.importData(this)">
                </div>
            </div>
            <!-- 存储统计 -->
            <div class="p-4 bg-[#111] rounded-xl border border-white/5 space-y-4">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-dim uppercase">存储统计</span>
                    <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.settings._refreshStorageStats()"><i class="fa-solid fa-rotate mr-1"></i>刷新</button>
                </div>
                <div class="grid grid-cols-4 gap-3" id="storage-stats">
                    <div class="p-3 bg-black/30 rounded-lg text-center"><div class="text-lg font-bold text-white" id="ss-entities">-</div><div class="text-[9px] text-dim">实体</div></div>
                    <div class="p-3 bg-black/30 rounded-lg text-center"><div class="text-lg font-bold text-white" id="ss-vectors">-</div><div class="text-[9px] text-dim">向量</div></div>
                    <div class="p-3 bg-black/30 rounded-lg text-center"><div class="text-lg font-bold text-white" id="ss-prompts">-</div><div class="text-[9px] text-dim">提示词</div></div>
                    <div class="p-3 bg-black/30 rounded-lg text-center"><div class="text-lg font-bold text-white" id="ss-books">-</div><div class="text-[9px] text-dim">图书</div></div>
                    <div class="p-3 bg-black/30 rounded-lg text-center"><div class="text-lg font-bold text-white" id="ss-volumes">-</div><div class="text-[9px] text-dim">卷</div></div>
                    <div class="p-3 bg-black/30 rounded-lg text-center"><div class="text-lg font-bold text-white" id="ss-chapters">-</div><div class="text-[9px] text-dim">章节</div></div>
                    <div class="p-3 bg-black/30 rounded-lg text-center"><div class="text-lg font-bold text-white" id="ss-sessions">-</div><div class="text-[9px] text-dim">对话</div></div>
                    <div class="p-3 bg-black/30 rounded-lg text-center"><div class="text-lg font-bold text-white" id="ss-outlines">-</div><div class="text-[9px] text-dim">大纲</div></div>
                </div>
            </div>
            <!-- 选择性清理 -->
            <div class="p-4 bg-[#111] rounded-xl border border-white/5 space-y-4">
                <span class="text-xs font-bold text-dim uppercase">选择性清理</span>
                <div class="grid grid-cols-3 gap-3">
                    ${[
                        {store:'chat_sessions', label:'对话记录', color:'blue'},
                        {store:'vectors', label:'向量数据', color:'cyan'},
                        {store:'prompts', label:'提示词', color:'orange'}
                    ].map(s => `
                        <button class="p-3 bg-black/30 rounded-lg border border-white/5 hover:border-${s.color}-500/30 text-xs text-dim hover:text-white transition-all text-left" onclick="if(confirm('确定清空 ${s.label}？')){Modules.settings._clearStore('${s.store}');UI.toast('${s.label} 已清空')}">
                            <i class="fa-solid fa-trash-can text-${s.color}-400/50 mr-1"></i>${s.label}
                        </button>
                    `).join('')}
                </div>
            </div>
            <!-- 危险区域 -->
            <div class="p-4 bg-red-900/10 rounded-xl border border-red-900/30 space-y-3">
                <span class="text-xs font-bold text-red-400 uppercase">危险区域</span>
                <p class="text-[10px] text-dim">不可逆操作：清空所有本地数据库，恢复到初始状态。</p>
                <button class="btn btn-sm bg-red-600/20 text-red-400 border-red-600/30 hover:bg-red-600 hover:text-white" onclick="if(confirm('确定恢复出厂设置？所有数据将永久丢失。')){indexedDB.deleteDatabase(DB.name);localStorage.clear();location.reload()}"><i class="fa-solid fa-skull-crossbones mr-1"></i>恢复出厂设置</button>
            </div>
        </div>`,

    _renderAboutTab: () => `
        <div class="max-w-3xl space-y-6">
            <h2 class="text-lg font-bold text-white">关于 Genesis 创世引擎</h2>
            <div class="p-6 bg-[#111] rounded-xl border border-white/5 space-y-4">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex center text-white text-2xl"><i class="fa-solid fa-dragon"></i></div>
                    <div>
                        <div class="text-xl font-bold text-white">Genesis Writer Center</div>
                        <div class="text-xs text-dim">Archon Edition · v2.0</div>
                    </div>
                </div>
                <div class="text-xs text-gray-400 leading-relaxed space-y-2">
                    <p>Genesis 创世引擎是一款全功能 AI 写作工作站，集成了长篇创作、灵感生成、世界观构建、知识图谱、RAG 上下文增强、三层记忆系统等核心能力。</p>
                    <p>所有数据存储在浏览器本地 IndexedDB 中，无需服务器，支持离线使用。API 调用直接从浏览器发出，密钥不经过任何第三方。</p>
                </div>
            </div>
            <div class="p-4 bg-[#111] rounded-xl border border-white/5 space-y-3">
                <span class="text-xs font-bold text-dim uppercase">模块清单</span>
                <div class="grid grid-cols-2 gap-2 text-xs">
                    ${[
                        '凤凰创作流','长篇执笔 (旗舰)','世界引擎','创意工坊',
                        '万能工坊','工具中心','融合拆书','RAG 上下文',
                        '三层记忆','阅读中心','网页对话','系统设置'
                    ].map(m => `<div class="flex items-center gap-2 text-gray-400 p-2 bg-black/20 rounded"><i class="fa-solid fa-check text-green-400/50 text-[9px]"></i>${m}</div>`).join('')}
                </div>
            </div>
            <div class="p-4 bg-[#111] rounded-xl border border-white/5 space-y-3">
                <span class="text-xs font-bold text-dim uppercase">技术栈</span>
                <div class="flex flex-wrap gap-2">
                    ${['Vanilla JS','IndexedDB','Tailwind CSS','Font Awesome','marked.js','vis-network','echarts','file:// 兼容'].map(t => `<span class="px-2 py-1 bg-black/30 rounded text-[10px] text-dim border border-white/5">${t}</span>`).join('')}
                </div>
            </div>
        </div>`,

    // ═══ API Modal ═══
    _renderApiModal: () => `
        <div id="api-modal" class="fixed inset-0 bg-black/90 hidden z-[100] flex center backdrop-blur-md overflow-y-auto py-8">
            <div class="bg-[#121212] border border-white/10 rounded-2xl p-6 w-[480px] flex flex-col gap-5 shadow-2xl animate-fade-in relative my-auto max-h-[90vh] overflow-y-auto">
                <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                <div class="flex justify-between items-center">
                    <h3 class="text-base font-bold text-white" id="api-modal-title">API 配置</h3>
                    <button class="w-7 h-7 rounded-full hover:bg-white/10 text-dim flex center" onclick="document.getElementById('api-modal').classList.add('hidden')"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="space-y-3">
                    <div class="flex flex-col gap-1">
                        <span class="text-[10px] text-dim font-bold uppercase">配置名称</span>
                        <input id="api-name" class="input bg-black/30 border-white/10 h-9 text-sm text-white" placeholder="例如: GPT-4o 生产环境">
                    </div>
                    <div class="flex flex-col gap-1">
                        <span class="text-[10px] text-dim font-bold uppercase">服务商</span>
                        <select id="api-provider" class="input bg-black/30 border-white/10 h-9 text-sm text-white">
                            <option value="custom">自定义 / OpenAI 兼容</option>
                            <option value="gemini">Google Gemini</option>
                            <option value="claude">Anthropic Claude</option>
                            <option value="minimax">MiniMax</option>
                        </select>
                    </div>
                    <div class="flex flex-col gap-1">
                        <span class="text-[10px] text-dim font-bold uppercase">Base URL</span>
                        <input id="api-url" class="input bg-black/30 border-white/10 h-9 text-sm text-white font-mono" placeholder="https://api.openai.com/v1">
                    </div>
                    <div class="flex flex-col gap-1">
                        <span class="text-[10px] text-dim font-bold uppercase">API Key</span>
                        <input id="api-key" class="input bg-black/30 border-white/10 h-9 text-sm text-white font-mono" type="password" placeholder="sk-...">
                    </div>
                    <div class="flex flex-col gap-1">
                        <span class="text-[10px] text-dim font-bold uppercase">Model ID</span>
                        <input id="api-model" class="input bg-black/30 border-white/10 h-9 text-sm text-white font-mono" placeholder="gpt-4o / gemini-2.0-flash">
                    </div>
                    <input id="api-temp" type="hidden" value="">
                    <input id="api-tokens" type="hidden" value="">
                </div>
                <div class="flex gap-2 justify-end">
                    <button class="btn btn-sm bg-white/5 text-dim hover:text-white" onclick="document.getElementById('api-modal').classList.add('hidden')">取消</button>
                    <button class="btn btn-sm bg-white text-black hover:bg-gray-200 font-bold px-6" onclick="Modules.settings.savePool()">保存</button>
                </div>
            </div>
        </div>`,

    // ═══ API Pool CRUD ═══
    addPool: () => {
        Modules.settings.currentType = 'text';
        Modules.settings.currentId = null;
        document.getElementById('api-modal').classList.remove('hidden');
        document.getElementById('api-modal-title').innerText = '添加 API 配置';
        ['api-name','api-url','api-key','api-model','api-temp','api-tokens'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
        document.getElementById('api-provider').value = 'custom';
    },

    edit: async (id) => {
        Modules.settings.currentType = 'text';
        Modules.settings.currentId = id;
        const c = await DB.get('text_api_pool', id);
        if(!c) return;
        document.getElementById('api-modal').classList.remove('hidden');
        document.getElementById('api-modal-title').innerText = '编辑 API 配置';
        document.getElementById('api-name').value = c.config_name || '';
        document.getElementById('api-provider').value = c.provider || 'custom';
        document.getElementById('api-url').value = c.base_url || '';
        document.getElementById('api-key').value = c.api_key || '';
        document.getElementById('api-model').value = c.model_name || '';
        document.getElementById('api-temp').value = c.temperature || '';
        document.getElementById('api-tokens').value = c.max_tokens || '';
    },

    savePool: async () => {
        const id = Modules.settings.currentId || Date.now();
        const existing = Modules.settings.currentId ? await DB.get('text_api_pool', id) : null;
        const config = {
            id,
            config_name: document.getElementById('api-name').value || '未命名',
            provider: document.getElementById('api-provider').value,
            base_url: document.getElementById('api-url').value,
            api_key: document.getElementById('api-key').value,
            model_name: document.getElementById('api-model').value,
            temperature: document.getElementById('api-temp').value,
            max_tokens: document.getElementById('api-tokens').value,
            is_active: existing ? existing.is_active : 0
        };
        await DB.put('text_api_pool', config);
        document.getElementById('api-modal').classList.add('hidden');
        Modules.settings._refreshApiPool();
        UI.toast('API 配置已保存');
    },

    _refreshApiPool: async () => {
        const list = await DB.getAll('text_api_pool');
        const el = document.getElementById('pool-text');
        if(!el) return;
        if(!list.length) {
            el.innerHTML = '<div class="p-6 text-center text-dim text-xs border border-dashed border-white/10 rounded-xl">暂无 API 配置，点击右上角"添加配置"开始</div>';
            return;
        }
        el.innerHTML = list.map(c => `
            <div class="p-4 bg-[#111] rounded-xl border ${c.is_active ? 'border-green-500/30 bg-green-500/5' : 'border-white/5'} flex justify-between items-center group hover:border-white/20 transition-all cursor-pointer" onclick="Modules.settings.activate(${c.id})">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg ${c.is_active ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-dim'} flex center text-xs">
                        <i class="fa-solid ${c.provider==='gemini'?'fa-google':c.provider==='claude'?'fa-robot':'fa-plug'}"></i>
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="font-bold text-sm ${c.is_active ? 'text-green-400' : 'text-white'}">${c.config_name}</span>
                            ${c.is_active ? '<span class="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-bold border border-green-500/30">激活</span>' : ''}
                        </div>
                        <span class="text-[10px] text-dim">${c.provider} / ${c.model_name || '未设置模型'}</span>
                    </div>
                </div>
                <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="w-7 h-7 rounded-lg hover:bg-white/10 text-dim hover:text-white flex center" onclick="event.stopPropagation();Modules.settings.edit(${c.id})" title="编辑"><i class="fa-solid fa-pen text-[10px]"></i></button>
                    <button class="w-7 h-7 rounded-lg hover:bg-red-500/20 text-dim hover:text-red-400 flex center" onclick="event.stopPropagation();Modules.settings.del(${c.id})" title="删除"><i class="fa-solid fa-trash-can text-[10px]"></i></button>
                </div>
            </div>
        `).join('');
    },

    activate: async (id) => {
        const list = await DB.getAll('text_api_pool');
        for(const c of list) {
            c.is_active = c.id === id ? 1 : 0;
            await DB.put('text_api_pool', c);
        }
        Modules.settings._refreshApiPool();
        UI.toast('已切换激活 API');
    },

    del: async (id) => {
        if(confirm('删除此 API 配置？')) {
            await DB.del('text_api_pool', id);
            Modules.settings._refreshApiPool();
        }
    },

    testConnection: async () => {
        const el = document.getElementById('api-test-result');
        el.textContent = '正在测试连接...';
        el.className = 'text-xs text-yellow-400 font-mono p-2 bg-black/30 rounded min-h-[40px]';
        try {
            const config = await AI.getActiveConfig('text');
            if(!config) { el.textContent = '❌ 未找到激活的 API 配置'; el.className = 'text-xs text-red-400 font-mono p-2 bg-black/30 rounded min-h-[40px]'; return; }
            const start = Date.now();
            let result = '';
            await AI.generate('请回复"连接成功"四个字。', {}, c => { result += c; });
            const ms = Date.now() - start;
            el.textContent = '✅ 连接成功 (' + ms + 'ms)\n模型: ' + config.model_name + '\n响应: ' + result.slice(0, 100);
            el.className = 'text-xs text-green-400 font-mono p-2 bg-black/30 rounded min-h-[40px] whitespace-pre-wrap';
        } catch(e) {
            el.textContent = '❌ 连接失败: ' + e.message;
            el.className = 'text-xs text-red-400 font-mono p-2 bg-black/30 rounded min-h-[40px]';
        }
    },

    _saveGlobalParams: () => {
        localStorage.setItem('g_temp', document.getElementById('g-temp').value);
        localStorage.setItem('g_tokens', document.getElementById('g-tokens').value);
        localStorage.setItem('g_topp', document.getElementById('g-topp').value);
        UI.toast('全局参数已保存');
    },

    _refreshStorageStats: async () => {
        const counts = {
            entities: (await DB.getAll('entities')).length,
            vectors: (await DB.getAll('vectors')).length,
            prompts: (await DB.getAll('prompts')).length,
            books: (await DB.getAll('library_books')).length,
            volumes: (await DB.getAll('volumes')).length,
            chapters: (await DB.getAll('chapters')).length,
            sessions: (await DB.getAll('chat_sessions')).length,
            outlines: (await DB.getAll('outlines')).length
        };
        for(const [k,v] of Object.entries(counts)) {
            const el = document.getElementById('ss-' + k);
            if(el) el.textContent = v;
        }
    },

    _clearStore: async (store) => {
        const items = await DB.getAll(store);
        for(const item of items) await DB.del(store, item.id);
    },

    // ═══ 数据导入导出 ═══
    exportData: async () => {
        const data = {};
        const stores = ['volumes','chapters','outlines','entities','vectors','prompts','tools_custom','assets','library_books','text_api_pool','settings','chat_sessions'];
        for(const s of stores) { try { data[s] = await DB.getAll(s); } catch(e) { data[s] = []; } }
        const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'genesis_backup_' + new Date().toISOString().slice(0,10) + '.json';
        a.click();
        URL.revokeObjectURL(url);
        UI.toast('数据备份已导出');
    },

    importData: async (input) => {
        const file = input.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                let count = 0;
                for(const s in data) {
                    for(const item of data[s]) { await DB.put(s, item); count++; }
                }
                UI.toast('恢复成功，共导入 ' + count + ' 条记录。即将刷新...');
                setTimeout(() => location.reload(), 1500);
            } catch(err) { UI.toast('导入失败: ' + err.message); }
        };
        reader.readAsText(file);
    }
};
