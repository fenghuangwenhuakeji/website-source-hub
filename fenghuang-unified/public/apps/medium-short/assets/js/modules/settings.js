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
        <div class="flex h-full bg-[#F8F9FA] overflow-hidden">
            <!-- 左侧导航 -->
            <div class="w-56 shrink-0 flex flex-col bg-[#F1F3F5] border-r border-gray-200">
                <div class="p-4 border-b border-gray-200">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-600 to-gray-800 flex center text-gray-800 text-sm"><i class="fa-solid fa-gear"></i></div>
                        <div>
                            <div class="font-bold text-white text-sm">系统设置</div>
                            <div class="text-[10px] text-dim">v2.0 Genesis</div>
                        </div>
                    </div>
                </div>
                <div class="flex-1 overflow-y-auto p-2 space-y-0.5">
                    ${tabs.map(tb => `
                        <button class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-bold transition-all ${t===tb.id ? 'bg-gray-200 text-gray-800' : 'text-dim hover:bg-gray-100'}" onclick="Modules.settings.switchTab('${tb.id}')">
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
                        <h2 class="text-lg font-bold text-gray-800">文本生成 API 流量池</h2>
                        <p class="text-xs text-dim mt-1">配置多个 API 端点，点击卡片切换激活状态。支持 OpenAI / Gemini / Claude 等兼容接口。</p>
                    </div>
                    <button class="btn btn-sm bg-gray-200 text-gray-800 hover:bg-gray-300 font-bold" onclick="Modules.settings.addPool()"><i class="fa-solid fa-plus mr-1"></i>添加配置</button>
                </div>
                <div id="pool-text" class="space-y-2"></div>
                <!-- 连接测试 -->
                <div class="p-4 bg-white rounded-xl border border-gray-200 space-y-3">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-bold text-dim uppercase">连接测试</span>
                        <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30" onclick="Modules.settings.testConnection()"><i class="fa-solid fa-bolt mr-1"></i>测试当前激活 API</button>
                    </div>
                    <div id="api-test-result" class="text-xs text-dim font-mono p-2 bg-gray-100 rounded min-h-[40px]">点击测试按钮检查 API 连通性...</div>
                </div>
                <!-- 全局参数 -->
                <div class="p-4 bg-white rounded-xl border border-gray-200 space-y-4">
                    <span class="text-xs font-bold text-dim uppercase">全局生成参数</span>
                    <div class="grid grid-cols-3 gap-4">
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] text-dim">Temperature</label>
                            <input id="g-temp" type="number" step="0.1" min="0" max="2" class="input bg-gray-100 border-gray-300 h-9 text-sm text-gray-800" value="0.7">
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] text-dim">Max Tokens</label>
                            <input id="g-tokens" type="number" min="256" max="128000" class="input bg-gray-100 border-gray-300 h-9 text-sm text-gray-800" value="4096">
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] text-dim">Top P</label>
                            <input id="g-topp" type="number" step="0.05" min="0" max="1" class="input bg-gray-100 border-gray-300 h-9 text-sm text-gray-800" value="0.95">
                        </div>
                    </div>
                    <button class="btn btn-xs bg-gray-100 text-dim" onclick="Modules.settings._saveGlobalParams()"><i class="fa-solid fa-save mr-1"></i>保存全局参数</button>
                </div>
            </div>`;

        if(t === 'appear') return `
            <div class="max-w-3xl space-y-6">
                <h2 class="text-lg font-bold text-gray-800">外观与主题</h2>
                <!-- 主题色 -->
                <div class="p-4 bg-white rounded-xl border border-gray-200 space-y-4">
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
                            <button class="w-8 h-8 rounded-full border-2 border-white/20 hover:scale-110 hover:border-black/50 transition-all relative group" style="background:${c.color}" onclick="document.documentElement.style.setProperty('--accent','${c.color}');localStorage.setItem('theme_accent','${c.color}');UI.toast('主题色已切换')">
                                <span class="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-dim opacity-0 group-hover:opacity-100 whitespace-nowrap">${c.name}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
                <!-- 字体 -->
                <div class="p-4 bg-white rounded-xl border border-gray-200 space-y-4">
                    <span class="text-xs font-bold text-dim uppercase">字体设置</span>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] text-dim">界面字体</label>
                            <select class="input bg-gray-100 border-gray-300 h-9 text-sm text-gray-800" onchange="document.body.style.fontFamily=this.value;localStorage.setItem('ui_font',this.value)">
                                <option value="'Inter',system-ui,sans-serif">默认 (System)</option>
                                <option value="'Microsoft YaHei',sans-serif">微软雅黑</option>
                                <option value="'PingFang SC',sans-serif">苹方</option>
                                <option value="'Noto Sans SC',sans-serif">Noto Sans</option>
                            </select>
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] text-dim">编辑器字体</label>
                            <select class="input bg-gray-100 border-gray-300 h-9 text-sm text-gray-800" id="editor-font" onchange="localStorage.setItem('editor_font',this.value)">
                                <option value="'Georgia',serif">Georgia (衬线)</option>
                                <option value="'Songti SC',serif">宋体</option>
                                <option value="'Fira Code',monospace">Fira Code (等宽)</option>
                                <option value="system-ui,sans-serif">系统无衬线</option>
                            </select>
                        </div>
                    </div>
                </div>
                <!-- 字号 -->
                <div class="p-4 bg-white rounded-xl border border-gray-200 space-y-4">
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
                            <select class="input bg-gray-100 border-gray-300 h-9 text-xs text-gray-800" onchange="localStorage.setItem('sidebar_w',this.value)">
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
            <h2 class="text-lg font-bold text-gray-800">写作偏好</h2>
            <div class="p-4 bg-white rounded-xl border border-gray-200 space-y-4">
                <span class="text-xs font-bold text-dim uppercase">默认创作参数</span>
                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] text-dim">默认文风</label>
                        <select id="s-style" class="input bg-gray-100 border-gray-300 h-9 text-sm text-gray-800">
                            <option>严肃文学</option><option>网络小说</option><option>轻小说</option><option>学术论文</option><option>剧本</option><option>诗歌</option>
                        </select>
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] text-dim">默认人称</label>
                        <select id="s-pov" class="input bg-gray-100 border-gray-300 h-9 text-sm text-gray-800">
                            <option>第一人称</option><option>第三人称限制</option><option>第三人称全知</option><option>第二人称</option>
                        </select>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] text-dim">单次生成目标字数</label>
                        <input type="number" id="s-wordcount" class="input bg-gray-100 border-gray-300 h-9 text-sm text-gray-800" value="2000" min="500" max="10000" step="500">
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] text-dim">续写上文截取长度</label>
                        <input type="number" id="s-context-len" class="input bg-gray-100 border-gray-300 h-9 text-sm text-gray-800" value="1500" min="500" max="5000" step="500">
                    </div>
                </div>
            </div>
            <div class="p-4 bg-white rounded-xl border border-gray-200 space-y-4">
                <span class="text-xs font-bold text-dim uppercase">自动功能</span>
                <div class="space-y-3">
                    <div class="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border-2 border-indigo-200">
                        <div class="flex items-start gap-2">
                            <i class="fa-solid fa-circle-info text-indigo-400 text-base mt-0.5"></i>
                            <div class="text-xs text-gray-700 font-bold leading-relaxed">
                                <strong>快速开始：</strong>选择服务商后，系统将自动填充默认 API 地址。输入 API Key 后点击"获取模型列表"按钮，即可看到该服务商下所有可用模型。
                            </div>
                        </div>
                    </div>
                    <label class="flex items-center justify-between text-xs text-gray-600 cursor-pointer">
                        <span>生成后自动保存到工作记忆</span>
                        <input type="checkbox" checked class="accent-blue-500" onchange="localStorage.setItem('auto_memory',this.checked)">
                    </label>
                    <label class="flex items-center justify-between text-xs text-gray-600 cursor-pointer">
                        <span>续写时自动注入 RAG 上下文</span>
                        <input type="checkbox" checked class="accent-blue-500" onchange="localStorage.setItem('auto_rag',this.checked)">
                    </label>
                    <label class="flex items-center justify-between text-xs text-gray-600 cursor-pointer">
                        <span>生成完成后自动复制到剪贴板</span>
                        <input type="checkbox" class="accent-blue-500" onchange="localStorage.setItem('auto_copy',this.checked)">
                    </label>
                    <label class="flex items-center justify-between text-xs text-gray-600 cursor-pointer">
                        <span>编辑器自动保存 (每30秒)</span>
                        <input type="checkbox" checked class="accent-blue-500" onchange="localStorage.setItem('auto_save',this.checked)">
                    </label>
                </div>
            </div>
            <div class="p-4 bg-white rounded-xl border border-gray-200 space-y-4">
                <span class="text-xs font-bold text-dim uppercase">全局写作规则 (注入所有创作提示词)</span>
                <textarea id="s-global-rules" class="textarea w-full bg-gray-100 border-gray-300 h-32 text-xs text-gray-600 font-mono leading-relaxed" placeholder="例如：\n- 禁止使用「的」字超过3次连续\n- 对话要有潜台词\n- 描写要调动五感\n- 每段不超过200字">${localStorage.getItem('global_rules') || ''}</textarea>
                <button class="btn btn-xs bg-gray-100 text-dim" onclick="localStorage.setItem('global_rules',document.getElementById('s-global-rules').value);UI.toast('全局规则已保存')"><i class="fa-solid fa-save mr-1"></i>保存规则</button>
            </div>
        </div>`,

    _renderMemoryTab: () => `
        <div class="max-w-3xl space-y-6">
            <h2 class="text-lg font-bold text-gray-800">记忆与上下文</h2>
            <div class="p-4 bg-white rounded-xl border border-gray-200 space-y-4">
                <span class="text-xs font-bold text-dim uppercase">RAG 检索配置</span>
                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] text-dim">检索结果数量 (Top K)</label>
                        <input type="number" class="input bg-gray-100 border-gray-300 h-9 text-sm text-gray-800" value="5" min="1" max="20" onchange="localStorage.setItem('rag_topk',this.value)">
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] text-dim">上下文窗口 (tokens)</label>
                        <input type="number" class="input bg-gray-100 border-gray-300 h-9 text-sm text-gray-800" value="1000" min="200" max="5000" step="200" onchange="localStorage.setItem('rag_window',this.value)">
                    </div>
                </div>
            </div>
            <div class="p-4 bg-white rounded-xl border border-gray-200 space-y-4">
                <span class="text-xs font-bold text-dim uppercase">三层记忆配置</span>
                <div class="grid grid-cols-3 gap-4">
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] text-dim">工作记忆容量</label>
                        <input type="number" class="input bg-gray-100 border-gray-300 h-9 text-sm text-gray-800" value="50" min="10" max="200" onchange="localStorage.setItem('mem_working',this.value)">
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] text-dim">短期记忆容量</label>
                        <input type="number" class="input bg-gray-100 border-gray-300 h-9 text-sm text-gray-800" value="200" min="50" max="1000" onchange="localStorage.setItem('mem_short',this.value)">
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] text-dim">长期记忆容量</label>
                        <input type="number" class="input bg-gray-100 border-gray-300 h-9 text-sm text-gray-800" value="1000" min="100" max="10000" onchange="localStorage.setItem('mem_long',this.value)">
                    </div>
                </div>
            </div>
            <div class="p-4 bg-white rounded-xl border border-gray-200 space-y-3">
                <span class="text-xs font-bold text-dim uppercase">记忆统计</span>
                <div class="grid grid-cols-3 gap-4 text-center" id="mem-stats">
                    <div class="p-3 bg-gray-100 rounded-lg"><div class="text-xl font-bold text-amber-400" id="ms-working">-</div><div class="text-[10px] text-dim">工作记忆</div></div>
                    <div class="p-3 bg-gray-100 rounded-lg"><div class="text-xl font-bold text-blue-400" id="ms-short">-</div><div class="text-[10px] text-dim">短期记忆</div></div>
                    <div class="p-3 bg-gray-100 rounded-lg"><div class="text-xl font-bold text-green-400" id="ms-long">-</div><div class="text-[10px] text-dim">长期记忆</div></div>
                </div>
                <button class="btn btn-xs bg-red-600/20 text-red-400 border-red-600/30" onclick="if(confirm('清空所有记忆数据？')){if(typeof MemorySystem!=='undefined'){MemorySystem.working=[];MemorySystem.shortTerm=[];MemorySystem.longTerm=[];}UI.toast('记忆已清空')}"><i class="fa-solid fa-eraser mr-1"></i>清空全部记忆</button>
            </div>
        </div>`,

    _renderShortcutTab: () => `
        <div class="max-w-3xl space-y-6">
            <h2 class="text-lg font-bold text-gray-800">快捷键配置</h2>
            <div class="p-4 bg-white rounded-xl border border-gray-200">
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
                        <div class="flex justify-between items-center text-xs text-gray-600 bg-gray-100 p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                            <span>${s.action}</span>
                            <kbd class="bg-gray-200 px-3 py-1 rounded border border-gray-300 font-mono text-gray-800 text-[11px]">${s.key}</kbd>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>`,

    _renderDataTab: () => `
        <div class="max-w-3xl space-y-6">
            <h2 class="text-lg font-bold text-gray-800">数据管理</h2>
            <!-- 本地文件夹永久存储 -->
            <div class="p-4 bg-white rounded-xl border border-amber-500/20 space-y-4 relative overflow-hidden">
                <div class="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500"></div>
                <div class="flex items-center gap-2">
                    <i class="fa-solid fa-hard-drive text-amber-400"></i>
                    <span class="text-xs font-bold text-amber-400 uppercase">本地文件夹永久存储</span>
                    <span class="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">${LocalSync.hasFSAPI() || LocalSync.isElectron() ? '可用' : '不支持'}</span>
                </div>
                <div id="local-sync-status"></div>
            </div>
            <!-- 备份恢复 -->
            <div class="p-4 bg-white rounded-xl border border-gray-200 space-y-4">
                <span class="text-xs font-bold text-dim uppercase">备份与恢复</span>
                <div class="grid grid-cols-2 gap-4">
                    <button class="p-4 bg-gray-100 rounded-xl border border-gray-200 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all text-left group" onclick="Modules.settings.exportData()">
                        <i class="fa-solid fa-download text-blue-400 text-lg mb-2 group-hover:scale-110 transition-transform inline-block"></i>
                        <div class="text-sm font-bold text-gray-800">导出备份</div>
                        <div class="text-[10px] text-dim mt-1">将所有数据导出为 JSON 文件</div>
                    </button>
                    <button class="p-4 bg-gray-100 rounded-xl border border-gray-200 hover:border-green-500/30 hover:bg-green-500/5 transition-all text-left group" onclick="document.getElementById('import-file').click()">
                        <i class="fa-solid fa-upload text-green-400 text-lg mb-2 group-hover:scale-110 transition-transform inline-block"></i>
                        <div class="text-sm font-bold text-gray-800">恢复数据</div>
                        <div class="text-[10px] text-dim mt-1">从 JSON 备份文件恢复</div>
                    </button>
                    <input type="file" id="import-file" class="hidden" accept=".json" onchange="Modules.settings.importData(this)">
                </div>
            </div>
            <!-- 存储统计 -->
            <div class="p-4 bg-white rounded-xl border border-gray-200 space-y-4">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-dim uppercase">存储统计</span>
                    <button class="btn btn-xs bg-gray-100 text-dim" onclick="Modules.settings._refreshStorageStats()"><i class="fa-solid fa-rotate mr-1"></i>刷新</button>
                </div>
                <div class="grid grid-cols-4 gap-3" id="storage-stats">
                    <div class="p-3 bg-gray-100 rounded-lg text-center"><div class="text-lg font-bold text-gray-800" id="ss-entities">-</div><div class="text-[9px] text-dim">实体</div></div>
                    <div class="p-3 bg-gray-100 rounded-lg text-center"><div class="text-lg font-bold text-gray-800" id="ss-vectors">-</div><div class="text-[9px] text-dim">向量</div></div>
                    <div class="p-3 bg-gray-100 rounded-lg text-center"><div class="text-lg font-bold text-gray-800" id="ss-prompts">-</div><div class="text-[9px] text-dim">提示词</div></div>
                    <div class="p-3 bg-gray-100 rounded-lg text-center"><div class="text-lg font-bold text-gray-800" id="ss-books">-</div><div class="text-[9px] text-dim">图书</div></div>
                    <div class="p-3 bg-gray-100 rounded-lg text-center"><div class="text-lg font-bold text-gray-800" id="ss-volumes">-</div><div class="text-[9px] text-dim">卷</div></div>
                    <div class="p-3 bg-gray-100 rounded-lg text-center"><div class="text-lg font-bold text-gray-800" id="ss-chapters">-</div><div class="text-[9px] text-dim">章节</div></div>
                    <div class="p-3 bg-gray-100 rounded-lg text-center"><div class="text-lg font-bold text-gray-800" id="ss-sessions">-</div><div class="text-[9px] text-dim">对话</div></div>
                    <div class="p-3 bg-gray-100 rounded-lg text-center"><div class="text-lg font-bold text-gray-800" id="ss-outlines">-</div><div class="text-[9px] text-dim">大纲</div></div>
                </div>
            </div>
            <!-- 选择性清理 -->
            <div class="p-4 bg-white rounded-xl border border-gray-200 space-y-4">
                <span class="text-xs font-bold text-dim uppercase">选择性清理</span>
                <div class="grid grid-cols-3 gap-3">
                    ${[
                        {store:'chat_sessions', label:'对话记录', color:'blue'},
                        {store:'vectors', label:'向量数据', color:'cyan'},
                        {store:'prompts', label:'提示词', color:'orange'}
                    ].map(s => `
                        <button class="p-3 bg-gray-100 rounded-lg border border-gray-200 hover:border-${s.color}-500/30 text-xs text-dim hover:text-gray-800 transition-all text-left" onclick="if(confirm('确定清空 ${s.label}？')){Modules.settings._clearStore('${s.store}');UI.toast('${s.label} 已清空')}">
                            <i class="fa-solid fa-trash-can text-${s.color}-400/50 mr-1"></i>${s.label}
                        </button>
                    `).join('')}
                </div>
            </div>
            <!-- 危险区域 -->
            <div class="p-4 bg-red-900/10 rounded-xl border border-red-900/30 space-y-3">
                <span class="text-xs font-bold text-red-400 uppercase">危险区域</span>
                <p class="text-[10px] text-dim">不可逆操作：清空所有本地数据库，恢复到初始状态。</p>
                <button class="btn btn-sm bg-red-600/20 text-red-400 border-red-600/30 hover:bg-red-600 hover:text-gray-800" onclick="if(confirm('确定恢复出厂设置？所有数据将永久丢失。')){indexedDB.deleteDatabase(DB.name);localStorage.clear();location.reload()}"><i class="fa-solid fa-skull-crossbones mr-1"></i>恢复出厂设置</button>
            </div>
        </div>`,

    _renderAboutTab: () => `
        <div class="max-w-3xl space-y-6">
            <h2 class="text-lg font-bold text-gray-800">关于 Genesis 创世引擎</h2>
            <div class="p-6 bg-white rounded-xl border border-gray-200 space-y-4">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex center text-gray-800 text-2xl"><i class="fa-solid fa-dragon"></i></div>
                    <div>
                        <div class="text-xl font-bold text-gray-800">Genesis Writer Center</div>
                        <div class="text-xs text-dim">Archon Edition · v2.0</div>
                    </div>
                </div>
                <div class="text-xs text-gray-400 leading-relaxed space-y-2">
                    <p>Genesis 创世引擎是一款全功能 AI 写作工作站，集成了长篇创作、灵感生成、世界观构建、知识图谱、RAG 上下文增强、三层记忆系统等核心能力。</p>
                    <p>所有数据存储在浏览器本地 IndexedDB 中，无需服务器，支持离线使用。API 调用直接从浏览器发出，密钥不经过任何第三方。</p>
                </div>
            </div>
            <div class="p-4 bg-white rounded-xl border border-gray-200 space-y-3">
                <span class="text-xs font-bold text-dim uppercase">模块清单</span>
                <div class="grid grid-cols-2 gap-2 text-xs">
                    ${[
                        '中篇创作','RAG 上下文',
                        '三层记忆','阅读中心','系统设置'
                    ].map(m => `<div class="flex items-center gap-2 text-gray-400 p-2 bg-gray-100 rounded"><i class="fa-solid fa-check text-green-400/50 text-[9px]"></i>${m}</div>`).join('')}
                </div>
            </div>
            <div class="p-4 bg-white rounded-xl border border-gray-200 space-y-3">
                <span class="text-xs font-bold text-dim uppercase">技术栈</span>
                <div class="flex flex-wrap gap-2">
                    ${['Vanilla JS','IndexedDB','Tailwind CSS','Font Awesome','marked.js','vis-network','echarts','file:// 兼容'].map(t => `<span class="px-2 py-1 bg-gray-100 rounded text-[10px] text-dim border border-gray-200">${t}</span>`).join('')}
                </div>
            </div>
            <!-- 隐私政策和用户协议 -->
            <div class="flex items-center justify-center gap-4 text-xs text-gray-400 pt-4 border-t border-gray-200">
                <a href="assets/js/modules/用户协议.txt" target="_blank" class="hover:text-indigo-500 transition-colors">用户协议</a>
                <span class="text-gray-300">|</span>
                <a href="assets/js/modules/隐私政策.txt" target="_blank" class="hover:text-indigo-500 transition-colors">隐私政策</a>
            </div>
        </div>`,

    // ═══ API Modal ═══
    _renderApiModal: () => `
        <div id="api-modal" class="fixed inset-0 bg-gray-400 hidden z-[100] flex center backdrop-blur-md overflow-y-auto py-8">
            <div class="bg-white border border-gray-300 rounded-2xl p-6 w-[480px] flex flex-col gap-5 shadow-2xl animate-fade-in relative my-auto max-h-[90vh] overflow-y-auto">
                <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                <div class="flex justify-between items-center">
                    <h3 class="text-base font-bold text-gray-800" id="api-modal-title">API 配置</h3>
                    <button class="w-7 h-7 rounded-full hover:bg-gray-200 text-dim flex center" onclick="document.getElementById('api-modal').classList.add('hidden')"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="space-y-3">
                    <div class="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border-2 border-indigo-200">
                        <div class="flex items-start gap-2">
                            <i class="fa-solid fa-circle-info text-indigo-400 text-base mt-0.5"></i>
                            <div class="text-xs text-gray-700 font-bold leading-relaxed">
                                <strong>快速开始：</strong>选择服务商后，系统将自动填充默认 API 地址。输入 API Key 后点击"获取模型列表"按钮，即可看到该服务商下所有可用模型。
                            </div>
                        </div>
                    </div>
                    <div class="flex flex-col gap-1">
                        <span class="text-xs font-bold text-gray-700 flex items-center gap-2">
                            <i class="fa-solid fa-tag text-indigo-400"></i>
                            配置名称
                        </span>
                        <input id="api-name" class="input bg-white border-2 border-gray-300 rounded-lg h-10 text-sm text-gray-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200" placeholder="例如：GPT-4o 生产环境">
                    </div>
                    <div class="flex flex-col gap-1">
                        <span class="text-xs font-bold text-gray-700 flex items-center gap-2">
                            <i class="fa-solid fa-sliders text-indigo-400"></i>
                            服务商
                        </span>
                        <select id="api-provider" class="input bg-white border-2 border-gray-300 h-10 px-3 text-sm text-gray-800 font-bold rounded-lg focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200" style="min-width: 200px;" onchange="Modules.settings._onProviderChange()">
                            <option value="zhipu">🧠 智谱清言 (Zhipu AI)</option>
                            <option value="volcark">🌋 火山方舟 (VolcArk)</option>
                            <option value="volcano_coding">💻 火山Coding Plan</option>
                            <option value="kimi">🌙 月之暗面 (Kimi)</option>
                            <option value="minimax">🤖 MiniMax</option>
                            <option value="deepseek">🔍 深度求索 (DeepSeek)</option>
                            <option value="baichuan">📚 百川智能</option>
                            <option value="stepfun">🚀 阶跃星辰</option>
                            <option value="openai">🟢 OpenAI</option>
                            <option value="azure">💠 Azure OpenAI</option>
                            <option value="openai_compat">🔗 OpenAI 兼容 (自定义)</option>
                        </select>
                    </div>
                    <div class="flex flex-col gap-1" id="api-url-group" style="display:none">
                        <span class="text-xs font-bold text-gray-700 flex items-center gap-2">
                            <i class="fa-solid fa-link text-indigo-400"></i>
                            API 地址 (Base URL)
                        </span>
                        <input id="api-url" class="input bg-white border-2 border-gray-300 rounded-lg h-10 text-sm text-gray-800 font-mono focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200" placeholder="https://api.openai.com/v1">
                    </div>
                    <div class="flex flex-col gap-1">
                        <span class="text-xs font-bold text-gray-700 flex items-center gap-2">
                            <i class="fa-solid fa-key text-indigo-400"></i>
                            API 密钥
                        </span>
                        <input id="api-key" class="input bg-white border-2 border-gray-300 rounded-lg h-10 text-sm text-gray-800 font-mono focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200" type="password" placeholder="sk-...">
                    </div>
                    <div class="flex flex-col gap-1">
                        <span class="text-xs font-bold text-gray-700 flex items-center gap-2">
                            <i class="fa-solid fa-box text-indigo-400"></i>
                            模型选择
                        </span>
                        <div class="flex gap-2">
                            <select id="api-model-select" class="flex-1 bg-white border-2 border-gray-300 rounded-lg h-10 text-sm text-gray-800 font-bold focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200">
                                <option value="">- 请先获取模型列表 -</option>
                            </select>
                            <button class="btn px-3 py-2 bg-indigo-500 hover:bg-indigo-400 text-white border-none rounded-lg" onclick="Modules.settings._fetchModels()" title="获取可用模型列表">
                                <i class="fa-solid fa-rotate"></i>
                            </button>
                        </div>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-[10px] text-dim whitespace-nowrap">或自定义模型:</span>
                            <input id="api-model-custom" class="flex-1 bg-white border border-gray-300 rounded-lg h-8 text-xs text-gray-800 font-mono focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-200 px-2" placeholder="输入自定义模型名称" oninput="Modules.settings._onCustomModelInput()">
                        </div>
                        <input id="api-model" type="hidden" value="">
                    </div>
                    <input id="api-temp" type="hidden" value="">
                    <input id="api-tokens" type="hidden" value="">
                </div>
                <div class="flex gap-2 justify-end">
                    <button class="btn px-6 py-2.5 bg-gray-500 hover:bg-gray-400 text-white border-none rounded-lg" onclick="document.getElementById('api-modal').classList.add('hidden')">取消</button>
                    <button class="btn px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white border-none rounded-lg font-bold" onclick="Modules.settings.savePool()">保存配置</button>
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
        document.getElementById('api-provider').value = 'zhipu';
        document.getElementById('api-model-select').innerHTML = '<option value="">- 请选择模型 -</option>';
        document.getElementById('api-model-custom').value = '';
        document.getElementById('api-url-group').style.display = 'none';
    },

    // 服务商变更时自动填充默认 URL
    _onProviderChange: () => {
        const provider = document.getElementById('api-provider').value;
        const urlField = document.getElementById('api-url');
        const urlGroup = document.getElementById('api-url-group');
        const presets = {
            'zhipu': 'https://open.bigmodel.cn/api/paas/v4',
            'volcark': 'https://ark.cn-beijing.volces.com/api/v3',
            'volcano_coding': 'https://ark.cn-beijing.volces.com/api/coding/v3',
            'kimi': 'https://api.moonshot.cn/v1',
            'minimax': 'https://api.minimax.chat/v1',
            'deepseek': 'https://api.deepseek.com/v1',
            'baichuan': 'https://api.baichuan-ai.com/v1',
            'stepfun': 'https://api.stepfun.com/v1',
            'openai': 'https://api.openai.com/v1',
            'azure': 'https://your-resource.openai.azure.com/openai',
            'openai_compat': ''
        };
        if(presets[provider] !== undefined) {
            urlField.value = presets[provider];
        }
        if(provider === 'openai_compat') {
            urlGroup.style.display = '';
            urlField.placeholder = 'https://your-api-endpoint.com/v1';
        } else {
            urlGroup.style.display = 'none';
        }
        document.getElementById('api-model-select').innerHTML = '<option value="">- 请先获取模型列表 -</option>';
        document.getElementById('api-model').value = '';
        document.getElementById('api-model-custom').value = '';
    },

    _onCustomModelInput: () => {
        const customInput = document.getElementById('api-model-custom');
        const val = customInput.value.trim();
        if(val) {
            document.getElementById('api-model').value = val;
            document.getElementById('api-model-select').value = '';
        }
    },

    // 预设模型列表（当 CORS 失败时使用）
    _presetModels: {
        'zhipu': ['glm-4', 'glm-4-plus', 'glm-4-flash', 'glm-4-air', 'glm-4-airx', 'glm-4-long', 'glm-4-alltools', 'glm-4v', 'glm-4v-plus', 'glm-3-turbo'],
        'volcark': ['doubao-pro-32k', 'doubao-pro-128k', 'doubao-lite-32k', 'doubao-lite-128k', 'doubao-vision-pro-32k', 'doubao-vision-lite-32k', 'doubao-embedding', 'doubao-asr', 'doubao-tts'],
        'volcano_coding': ['ark-code-latest', 'doubao-seed-2.0-code', 'doubao-seed-2.0-pro', 'doubao-seed-2.0-lite', 'doubao-seed-code', 'minimax-m2.5', 'glm-4.7', 'deepseek-v3.2', 'kimi-k2.5'],
        'kimi': ['kimi-latest', 'kimi-k1-5', 'kimi-k1', 'kimi-moonshot-v1-8k', 'kimi-moonshot-v1-32k', 'kimi-moonshot-v1-128k', 'kimi-moonshot-v1-256k'],
        'minimax': ['abab6.5s', 'abab6.5t', 'abab6.5g', 'abab5.5', 'abab5.5s', 'abab6-chat', 'abab6.5-chat'],
        'deepseek': ['deepseek-chat', 'deepseek-reasoner', 'deepseek-coder', 'deepseek-v3', 'deepseek-r1'],
        'baichuan': ['Baichuan4', 'Baichuan3-Turbo', 'Baichuan3-Turbo-128k', 'Baichuan2-Turbo', 'Baichuan2-13B-Chat', 'Baichuan2-7B-Chat'],
        'stepfun': ['step-1-8k', 'step-1-32k', 'step-1-128k', 'step-1-256k', 'step-1-flash', 'step-2-16k', 'step-2-32k'],
        'openai': ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo', 'gpt-3.5-turbo-16k', 'o1-preview', 'o1-mini'],
        'azure': ['gpt-4', 'gpt-4-32k', 'gpt-4-turbo', 'gpt-35-turbo', 'gpt-35-turbo-16k', 'text-embedding-ada-002']
    },

    // 获取可用模型列表
    _fetchModels: async () => {
        const provider = document.getElementById('api-provider').value;
        const baseUrl = document.getElementById('api-url').value.trim();
        const apiKey = document.getElementById('api-key').value.trim();
        const selectEl = document.getElementById('api-model-select');
        
        if(!baseUrl || !apiKey) {
            UI.toast('请先填写 API 地址和 API Key');
            return;
        }

        // 显示加载状态
        selectEl.innerHTML = '<option value="">⏳ 正在加载模型列表...</option>';
        
        try {
            // 构建请求
            let url = baseUrl.endsWith('/models') ? baseUrl : `${baseUrl.replace(/\/$/, '')}/models`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if(!response.ok) {
                const errorText = await response.text().catch(() => response.statusText);
                throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
            }

            const data = await response.json();
            
            // 解析模型列表（OpenAI 兼容格式）
            let models = [];
            if(data.data && Array.isArray(data.data)) {
                models = data.data.map(m => m.id).filter(id => id);
            } else if(Array.isArray(data)) {
                models = data.map(m => m.id || m.name).filter(id => id);
            }

            if(models.length === 0) {
                selectEl.innerHTML = '<option value="">❌ 未找到可用模型</option>';
                UI.toast('未找到可用模型，请检查 API 配置');
                return;
            }

            // 填充下拉框
            selectEl.innerHTML = '<option value="">✅ 请选择模型</option>' + 
                models.map(m => `<option value="${m}">${m}</option>`).join('');
            
            // 添加选择变更事件，自动更新隐藏字段
            selectEl.onchange = function() {
                document.getElementById('api-model').value = this.value;
                if(this.value) document.getElementById('api-model-custom').value = '';
            };
            
            UI.toast(`✨ 成功获取 ${models.length} 个模型`);

        } catch(error) {
            console.error('获取模型列表失败:', error);
            
            // 检查是否是 CORS 错误
            const isCorsError = error.message.includes('CORS') || 
                               error.message.includes('Failed to fetch') ||
                               error.message.includes('blocked');
            
            if(isCorsError && Modules.settings._presetModels[provider]) {
                // 使用预设模型列表作为降级方案
                const presetModels = Modules.settings._presetModels[provider];
                selectEl.innerHTML = '<option value="">⚠️ 使用预设模型列表</option>' + 
                    presetModels.map(m => `<option value="${m}">${m}</option>`).join('');
                // 添加选择变更事件
                selectEl.onchange = function() {
                    document.getElementById('api-model').value = this.value;
                    if(this.value) document.getElementById('api-model-custom').value = '';
                };
                UI.toast(`⚠️ 由于浏览器 CORS 安全限制，无法直接获取模型列表。已加载 ${provider} 的预设模型列表，请从中选择。`, 'warning', 5000);
            } else {
                selectEl.innerHTML = `<option value="">❌ 获取失败：${error.message.substring(0, 50)}</option>`;
                
                // 提供有用的错误提示
                let tip = '';
                if(isCorsError) {
                    tip = '（CORS 限制：请在服务器端启用跨域访问，或手动输入模型名称）';
                } else if(error.message.includes('AuthenticationError') || error.message.includes('401')) {
                    tip = '（API Key 无效或已过期）';
                } else if(error.message.includes('404')) {
                    tip = '（该服务商不支持模型列表接口，请手动输入模型名称）';
                }
                
                UI.toast(`获取失败：${error.message} ${tip}`);
            }
        }
    },

    edit: async (id) => {
        Modules.settings.currentType = 'text';
        Modules.settings.currentId = id;
        const c = await DB.get('text_api_pool', id);
        if(!c) return;
        document.getElementById('api-modal').classList.remove('hidden');
        document.getElementById('api-modal-title').innerText = '编辑 API 配置';
        document.getElementById('api-name').value = c.config_name || '';
        document.getElementById('api-provider').value = c.provider || 'zhipu';
        document.getElementById('api-url').value = c.base_url || '';
        document.getElementById('api-key').value = c.api_key || '';
        document.getElementById('api-model').value = c.model_name || '';
        document.getElementById('api-temp').value = c.temperature || '';
        document.getElementById('api-tokens').value = c.max_tokens || '';
        document.getElementById('api-model-select').innerHTML = '<option value="">- 请选择模型 -</option>';
        document.getElementById('api-model-custom').value = c.model_name || '';
        const urlGroup = document.getElementById('api-url-group');
        if(c.provider === 'openai_compat') {
            urlGroup.style.display = '';
        } else {
            urlGroup.style.display = 'none';
        }
    },

    savePool: async () => {
        if (!App.isDbReady || !App.isDbReady()) {
            UI.toast('数据库未就绪，请稍后重试', 'error');
            return;
        }
        const id = Modules.settings.currentId || Date.now();
        const existing = Modules.settings.currentId ? await DB.get('text_api_pool', id) : null;
        const customModel = document.getElementById('api-model-custom').value.trim();
        const selectModel = document.getElementById('api-model').value;
        const config = {
            id,
            config_name: document.getElementById('api-name').value || '未命名',
            provider: document.getElementById('api-provider').value,
            base_url: document.getElementById('api-url').value,
            api_key: document.getElementById('api-key').value,
            model_name: customModel || selectModel,
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
        const list = await DB.getAll('text_api_pool') || [];
        const el = document.getElementById('pool-text');
        if(!el) return;
        if(!list || list.length === 0) {
            el.innerHTML = '<div class="p-6 text-center text-dim text-xs border border-dashed border-gray-300 rounded-xl">暂无 API 配置，点击右上角"添加配置"开始</div>';
            return;
        }
        el.innerHTML = list.map(c => `
            <div class="p-4 bg-white rounded-xl border ${c.is_active ? 'border-green-500/30 bg-green-500/5' : 'border-gray-200'} flex justify-between items-center group hover:border-white/20 transition-all cursor-pointer" onclick="Modules.settings.activate(${c.id})">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg ${c.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-100 text-dim'} flex center text-xs">
                        <i class="fa-solid ${c.provider==='gemini'?'fa-google':c.provider==='claude'?'fa-robot':'fa-plug'}"></i>
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="font-bold text-sm ${c.is_active ? 'text-green-400' : 'text-gray-800'}">${c.config_name}</span>
                            ${c.is_active ? '<span class="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-bold border border-green-500/30">激活</span>' : ''}
                        </div>
                        <span class="text-[10px] text-dim">${c.provider} / ${c.model_name || '未设置模型'}</span>
                    </div>
                </div>
                <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="w-7 h-7 rounded-lg hover:bg-gray-200 text-dim hover:text-gray-800 flex center" onclick="event.stopPropagation();Modules.settings.edit(${c.id})" title="编辑"><i class="fa-solid fa-pen text-[10px]"></i></button>
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
        el.className = 'text-xs text-yellow-400 font-mono p-2 bg-gray-100 rounded min-h-[40px]';
        try {
            const config = await AI.getActiveConfig('text');
            if(!config) { el.textContent = '❌ 未找到激活的 API 配置'; el.className = 'text-xs text-red-400 font-mono p-2 bg-gray-100 rounded min-h-[40px]'; return; }
            const start = Date.now();
            let result = '';
            await AI.generate('请回复"连接成功"四个字。', {}, c => { result += c; });
            const ms = Date.now() - start;
            el.textContent = '✅ 连接成功 (' + ms + 'ms)\n模型: ' + config.model_name + '\n响应: ' + result.slice(0, 100);
            el.className = 'text-xs text-green-400 font-mono p-2 bg-gray-100 rounded min-h-[40px] whitespace-pre-wrap';
        } catch(e) {
            el.textContent = '❌ 连接失败: ' + e.message;
            el.className = 'text-xs text-red-400 font-mono p-2 bg-gray-100 rounded min-h-[40px]';
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
