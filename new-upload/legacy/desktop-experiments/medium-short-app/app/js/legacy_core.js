// Extracted Logic Bundle
document.addEventListener('DOMContentLoaded', () => {

        // Use a safer check for Tailwind config
        window.addEventListener('DOMContentLoaded', () => {
            if (typeof tailwind !== 'undefined') {
                tailwind.config = {
                    theme: {
                        extend: {
                            colors: {
                                accent: '#ffd700',
                                dim: '#888888',
                                main: '#f2f2f2',
                                panel: 'rgba(18, 18, 20, 0.7)',
                                border: 'rgba(255, 255, 255, 0.08)'
                            },
                            fontFamily: {
                                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
                            },
                            animation: {
                                'fade-in': 'fadeIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
                                'spin-slow': 'spin 3s linear infinite',
                            },
                            keyframes: {
                                fadeIn: {
                                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                                    '100%': { opacity: '1', transform: 'translateY(0)' },
                                }
                            }
                        }
                    }
                }
            } else {
                console.warn('Tailwind not loaded, relying on fallback CSS');
                const warning = document.createElement('div');
                warning.style.cssText = "position:fixed;bottom:10px;right:10px;background:rgba(255,0,0,0.8);color:white;padding:10px;border-radius:5px;z-index:9999;font-size:12px;pointer-events:none;";
                warning.innerHTML = "<i class='fa-solid fa-triangle-exclamation'></i> Offline Mode";
                document.body.appendChild(warning);
            }
        });
    

// --- CORE: DATABASE & STATE ---
const DB = {
    name: 'GenesisDB', version: 8, db: null,
    async init() {
        if (this.db) return this.db;
        return new Promise((resolve, reject) => {
            try {
                const req = indexedDB.open(this.name, this.version);
                req.onerror = (e) => {
                    console.error("DB Open Error", e);
                    resolve(null);
                };
                req.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    const stores = [
                        'volumes', 'chapters', 'outlines', 'entities', 'vectors',
                        'prompts', 'tools_custom', 'assets',
                        'library_books', 'trading_strategies', 'code_snippets',
                        'text_api_pool', 'image_api_pool', 'video_api_pool', 'audio_api_pool',
                        'settings', 'chat_sessions'
                    ];
                    stores.forEach(s => { if(!db.objectStoreNames.contains(s)) db.createObjectStore(s, {keyPath: 'id'}); });
                };
                req.onsuccess = (e) => {
                    this.db = e.target.result;
                    this.db.onversionchange = () => {
                        this.db.close();
                        this.db = null;
                    };
                    resolve(this.db);
                };
                req.onblocked = () => {
                    console.warn("DB Open Blocked");
                };
            } catch (e) {
                console.error("IndexedDB not supported or blocked", e);
                resolve(null);
            }
        });
    },
    async op(store, mode, fn) {
        try {
            if(!this.db) await this.init();
            if(!this.db) throw new Error("Database not initialized");
            
            return new Promise((resolve, reject) => {
                try {
                    const tx = this.db.transaction(store, mode);
                    const req = fn(tx.objectStore(store));
                    req.onsuccess = () => resolve(req.result);
                    req.onerror = (e) => {
                        console.error(`DB Op Error [${store}]:`, e.target.error);
                        reject(e.target.error);
                    };
                } catch (e) {
                    reject(e);
                }
            });
        } catch (e) {
            console.error("DB Transaction Error:", e);
            return null; // Fail gracefully
        }
    },
    put: (s, v) => DB.op(s, 'readwrite', st => st.put(v)),
    get: (s, k) => DB.op(s, 'readonly', st => st.get(k)),
    getAll: (s) => DB.op(s, 'readonly', st => st.getAll()),
    del: (s, k) => DB.op(s, 'readwrite', st => st.delete(k))
};

const Utils = {
    uuid: () => Date.now().toString(36) + Math.random().toString(36).substr(2),
    copy: (t) => { navigator.clipboard.writeText(t); UI.toast('已复制'); },
    fileToText: async (file) => {
        return new Promise(resolve => {
            const r = new FileReader();
            r.onload = e => resolve(e.target.result);
            r.readAsText(file);
        });
    }
};

const UI = {
    toast: (msg) => {
        const d = document.createElement('div');
        d.className = 'toast'; d.innerHTML = msg;
        document.getElementById('toast-area').appendChild(d);
        setTimeout(()=>d.remove(), 3000);
    }
};

// --- CORE: AI ENGINE (Upgraded with API Pool) ---
const AI = {
    async getActiveConfig(type = 'text') {
        const configs = await DB.getAll(`${type}_api_pool`);
        return configs.find(c => c.is_active === 1) || configs[0] || null;
    },
    async generate(prompt, config = {}, onChunk) {
        const apiConfig = config.useModel ? config.useModel : await AI.getActiveConfig('text');
        
        if (!apiConfig) {
            let mock = "【模拟输出】请先在设置中配置API流量池。\n" + prompt.slice(0, 50) + "...";
            let i=0; const t = setInterval(() => { onChunk(mock[i]||''); i++; if(i>=mock.length) clearInterval(t); }, 10);
            return;
        }

        try {
            const { url, headers, body } = AI.buildRequest(apiConfig, prompt, true);
            const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
            
            if (!res.ok) throw new Error(`API Error: ${res.status}`);

            const reader = res.body.getReader();
            const dec = new TextDecoder();
            while(true) {
                const {done, value} = await reader.read();
                if(done) break;
                const chunk = dec.decode(value);
                const lines = chunk.split('\n');
                for(const line of lines) {
                    if(line.startsWith('data: ') && line!=='data: [DONE]') {
                        try {
                            const json = JSON.parse(line.slice(6));
                            const txt = AI.parseStreamChunk(apiConfig.provider, json);
                            if(txt) onChunk(txt);
                        } catch(e){}
                    }
                }
            }
        } catch(e) {
            onChunk(`[Error: ${e.message}]`);
        }
    },
    buildRequest(config, prompt, stream) {
        const { provider, api_key, base_url, model_name } = config;
        let url, headers = { 'Content-Type': 'application/json' }, body;
        
        if (provider === 'gemini') {
            url = `https://generativelanguage.googleapis.com/v1beta/models/${model_name || 'gemini-1.5-flash'}:${stream ? 'streamGenerateContent' : 'generateContent'}?key=${api_key}`;
            body = { contents: [{ parts: [{ text: prompt }] }] };
        } else if (provider === 'claude') {
            url = `${base_url || 'https://api.anthropic.com'}/v1/messages`;
            headers['x-api-key'] = api_key;
            headers['anthropic-version'] = '2023-06-01';
            body = { model: model_name, max_tokens: 4096, messages: [{ role: 'user', content: prompt }], stream };
        } else {
            url = `${base_url}/chat/completions`;
            if (api_key) headers['Authorization'] = `Bearer ${api_key}`;
            body = { model: model_name, messages: [{ role: 'user', content: prompt }], stream };
        }
        return { url, headers, body };
    },
    parseStreamChunk(provider, data) {
        if (provider === 'gemini') return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (provider === 'claude') return data.delta?.text || '';
        return data.choices?.[0]?.delta?.content || '';
    }
};

// --- MODULES ---
const App = {
    init: async () => {
        try { await DB.init(); } catch(e) { console.error(e); }
        App.nav('home');
    },
    nav: (mod) => {
        document.querySelectorAll('.sidebar-item').forEach(e => e.classList.remove('active'));
        const el = document.querySelector(`.sidebar-item[onclick="App.nav('${mod}')"]`);
        if(el) el.classList.add('active');
        
        const vp = document.getElementById('viewport');
        
        // Keep-Alive Logic: Hide all existing views instead of clearing innerHTML
        Array.from(vp.children).forEach(child => {
            child.style.display = 'none';
        });

        let view = document.getElementById(`module-view-${mod}`);
        
        if (!view) {
            // Create new view if it doesn't exist
            view = document.createElement('div');
            view.id = `module-view-${mod}`;
            view.className = 'w-full h-full animate-fade-in';
            view.innerHTML = Modules[mod] ? Modules[mod].render() : `<div class="flex center h-full text-dim font-mono text-lg animate-pulse">Module [${mod}] Initializing...</div>`;
            vp.appendChild(view);
            
            // Initialize module only once
            if(Modules[mod] && Modules[mod].init) {
                try {
                    Modules[mod].init();
                } catch(e) {
                    console.error(`Error initializing module ${mod}:`, e);
                }
            }
        }
        
        // Show the requested view
        view.style.display = 'block';
        
        // Trigger resize to fix layout issues (charts, canvas)
        setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
    }
};

const Modules = {};

Modules.home = {
    render: () => `
        <div class="h-full flex flex-col p-12 center relative overflow-hidden bg-[#050505]">
            <!-- Dynamic Background -->
            <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,_#1a1a1a_0%,_#050505_100%)] pointer-events-none"></div>
            <div class="absolute inset-0 opacity-20 pointer-events-none" style="background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px); background-size: 50px 50px;"></div>
            
            <!-- Hero Section -->
            <div class="relative z-10 text-center animate-fade-in flex flex-col items-center gap-8 mb-12">
                <div class="w-40 h-40 rounded-full bg-gradient-to-br from-accent/20 to-transparent border border-accent/30 flex center shadow-[0_0_80px_rgba(255,215,0,0.15)] mb-2 relative group cursor-default">
                    <div class="absolute inset-0 rounded-full border border-white/10 animate-spin-slow pointer-events-none"></div>
                    <i class="fa-solid fa-dragon text-7xl text-accent group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]"></i>
                </div>
                
                <div class="flex flex-col gap-2">
                    <h1 class="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-400 tracking-tight" style="filter: drop-shadow(0 0 30px rgba(255,255,255,0.1));">创世 <span class="text-accent">旗舰版 2.0</span></h1>
                    <p class="text-xl text-dim font-light tracking-[0.5em] uppercase opacity-80">Genesis Archon Ultimate</p>
                </div>
                
                <p class="text-lg text-gray-400 max-w-2xl leading-relaxed font-light border-t border-white/10 pt-6">
                    全维度 AI 创作引擎 • 史诗级更新换代<br>
                    <span class="text-sm text-dim">长篇执笔 / 智能编程 / 万能游戏机 / 量化交易 / 漫剧制作</span>
                </p>
            </div>
            
            <!-- Grid Navigation -->
            <div class="relative z-10 w-full max-w-[1400px] px-8">
                <div class="grid grid-cols-5 gap-6">
                    ${[
                        {id:'phoenix', icon:'fa-fire-flame-curved', title:'凤凰创作流', sub:'从零构建史诗大纲', color:'orange-500'},
                        {id:'writer', icon:'fa-feather-pointed', title:'长篇执笔', sub:'沉浸式 RAG 写作', color:'yellow-500'},
                        {id:'short_write', icon:'fa-pen-nib', title:'极速短篇', sub:'一键生成完整故事', color:'green-500'},
                        {id:'world', icon:'fa-globe', title:'世界观构建', sub:'宏大设定与知识图谱', color:'blue-500'},
                        {id:'toolbox_custom', icon:'fa-toolbox', title:'自定义工具', sub:'批量工作流引擎', color:'indigo-500'},
                        {id:'games', icon:'fa-gamepad', title:'万能游戏机', sub:'12+ 游戏引擎集成', color:'purple-500'},
                        {id:'coding', icon:'fa-code', title:'智能编程', sub:'全栈代码生成助手', color:'cyan-500'},
                        {id:'trading', icon:'fa-chart-line', title:'量化交易', sub:'策略回测与实盘模拟', color:'red-500'},
                        {id:'comics', icon:'fa-masks-theater', title:'漫剧制作', sub:'剧本分镜可视化', color:'pink-500'},
                        {id:'media', icon:'fa-hashtag', title:'自媒体创作', sub:'多平台爆款矩阵', color:'amber-500'}
                    ].map(item => `
                        <div class="epic-card p-6 flex flex-col items-center gap-4 group cursor-pointer hover:bg-white/5" onclick="App.nav('${item.id}')">
                            <div class="w-16 h-16 rounded-2xl bg-${item.color}/10 flex center group-hover:bg-${item.color}/20 transition-all border border-${item.color}/20 group-hover:border-${item.color}/50 shadow-[0_0_20px_rgba(0,0,0,0)] group-hover:shadow-[0_0_30px_rgba(var(--accent-rgb),0.1)]">
                                <i class="fa-solid ${item.icon} text-4xl text-${item.color} group-hover:scale-110 transition-transform duration-300"></i>
                            </div>
                            <div class="text-center">
                                <span class="font-bold text-lg text-gray-200 block mb-1 group-hover:text-white transition-colors">${item.title}</span>
                                <span class="text-xs text-dim group-hover:text-gray-400 transition-colors">${item.sub}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `
};

// 1. WRITER (Ultimate Edition) - Golden Ratio Layout
Modules.writer = {
    render: () => `
        <div class="layout-golden">
            <!-- 30% Navigation (Left) -->
            <div class="col-nav">
                <!-- Top Half: Chapter Tree -->
                <div class="flex-1 flex col border-b border-border overflow-hidden">
                    <div class="card-head bg-white/5">
                        <span class="font-bold text-accent tracking-wider"><i class="fa-solid fa-book-open-reader mr-2"></i>作品大纲目录</span>
                        <div class="flex gap-2">
                            <button class="btn btn-sm btn-icon bg-white/10 text-white hover:bg-accent hover:text-black border-white/20" onclick="Modules.writer.newVol()" title="新建卷"><i class="fa-solid fa-folder-plus"></i></button>
                            <button class="btn btn-sm btn-icon bg-white/10 text-white hover:bg-accent hover:text-black border-white/20" onclick="Modules.writer.newChap()" title="新建章"><i class="fa-solid fa-file-circle-plus"></i></button>
                            <button class="btn btn-sm btn-icon bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white border-red-500/30" onclick="Modules.writer.clearAll()" title="一键清空"><i class="fa-solid fa-trash-can"></i></button>
                        </div>
                    </div>
                    <div class="flex-1 overflow-y-auto p-3 space-y-1" id="w-chap-list"></div>
                </div>
                
                <!-- Bottom Half: Tools & Context (Tabbed) -->
                <div class="h-[55%] flex col bg-black/20">
                    <div class="flex border-b border-border bg-black/20">
                        <div id="tab-btn-rag" class="tab-btn p-3 text-xs font-bold cursor-pointer flex-1 text-center border-r border-border active" onclick="Modules.writer.tab('rag')">设定/RAG</div>
                        <div id="tab-btn-outline" class="tab-btn p-3 text-xs font-bold cursor-pointer flex-1 text-center border-r border-border" onclick="Modules.writer.tab('outline')">本章细纲</div>
                        <div id="tab-btn-rules" class="tab-btn p-3 text-xs font-bold cursor-pointer flex-1 text-center border-r border-border" onclick="Modules.writer.tab('rules')">全局规范</div>
                        <div id="tab-btn-chat" class="tab-btn p-3 text-xs font-bold cursor-pointer flex-1 text-center border-r border-border" onclick="Modules.writer.tab('chat')">AI助手</div>
                        <div id="tab-btn-io" class="tab-btn p-3 text-xs font-bold cursor-pointer flex-1 text-center border-r border-border" onclick="Modules.writer.tab('io')">IO调试</div>
                        <div class="p-3 text-xs font-bold cursor-pointer flex center w-8 hover:text-white text-dim" onclick="Modules.short.openPromptModal('writer_ai')" title="配置AI提示词"><i class="fa-solid fa-gear"></i></div>
                    </div>
                    
                    <!-- RAG Tab -->
                    <div id="tab-rag" class="flex-1 flex col p-3 gap-3 overflow-hidden animate-fade-in">
                        <div class="card flex-1 bg-black/20 border-white/5">
                            <div class="card-head border-white/5 py-1 text-[10px]"><span class="text-accent">上下文窗口 (Context)</span> <i class="fa-solid fa-rotate cursor-pointer hover:text-white" onclick="Modules.writer.refreshRAG()"></i></div>
                            <textarea id="w-rag-edit" class="flex-1 bg-transparent border-none text-xs p-2 text-dim resize-none font-mono leading-relaxed" placeholder="RAG 召回内容..."></textarea>
                        </div>
                        <div class="h-24 overflow-y-auto space-y-1" id="w-supply-list"></div>
                    </div>
                    
                    <!-- Outline Tab -->
                    <div id="tab-outline" class="flex-1 hidden flex col p-3 gap-3 animate-fade-in">
                        <textarea id="w-chap-outline" class="flex-1 bg-black/20 border border-white/5 rounded p-2 text-xs resize-none text-gray-300 focus:border-accent/50 transition-colors" placeholder="在此输入本章细纲..."></textarea>
                        <button class="btn btn-primary w-full py-2 shadow-lg shadow-accent/10" onclick="Modules.writer.aiWrite()">
                            <i class="fa-solid fa-pen-nib mr-2"></i> AI 智能续写
                        </button>
                    </div>

                    <!-- Rules Tab (New) -->
                    <div id="tab-rules" class="flex-1 hidden flex col p-3 gap-3 animate-fade-in overflow-y-auto">
                        <div class="col gap-2">
                            <span class="text-[10px] font-bold text-accent uppercase tracking-wider">全局写作规范</span>
                            <textarea id="rule-global" class="textarea h-24 text-xs bg-black/20 border-white/10" placeholder="例如：第三人称，禁止心理描写过多，赛博朋克风..."></textarea>
                        </div>
                        <div class="col gap-2">
                            <span class="text-[10px] font-bold text-blue-400 uppercase tracking-wider">续写规范</span>
                            <textarea id="rule-continue" class="textarea h-20 text-xs bg-black/20 border-white/10" placeholder="例如：注重动作描写，节奏加快..."></textarea>
                        </div>
                        <div class="col gap-2">
                            <span class="text-[10px] font-bold text-green-400 uppercase tracking-wider">润色规范</span>
                            <textarea id="rule-polish" class="textarea h-20 text-xs bg-black/20 border-white/10" placeholder="例如：辞藻华丽，增加环境渲染..."></textarea>
                        </div>
                        <button class="btn btn-sm bg-white/10 hover:bg-white/20 text-white" onclick="Modules.writer.saveRules()">保存规范</button>
                    </div>

                    <!-- Chat Tab -->
                    <div id="tab-chat" class="flex-1 hidden flex col p-3 gap-3 animate-fade-in">
                        <div id="w-chat-log" class="flex-1 bg-black/40 p-2 rounded border border-white/5 overflow-y-auto text-xs font-mono space-y-2"></div>
                        <div class="flex gap-2">
                            <input id="w-chat-in" class="input h-8 text-xs bg-black/50 border-white/10" placeholder="输入指令...">
                            <button class="btn btn-icon btn-sm bg-accent text-black" onclick="Modules.writer.sendChat()"><i class="fa-solid fa-paper-plane"></i></button>
                        </div>
                    </div>

                    <!-- IO Tab (New) -->
                    <div id="tab-io" class="flex-1 hidden flex col p-0 animate-fade-in font-mono">
                        <div class="h-1/2 border-b border-border flex col">
                            <div class="px-2 py-1 text-[10px] text-accent bg-black/30">最后一次输入 (Input Prompt)</div>
                            <textarea id="io-input" class="flex-1 bg-transparent border-none text-[10px] p-2 text-dim resize-none" readonly></textarea>
                        </div>
                        <div class="h-1/2 flex col">
                            <div class="px-2 py-1 text-[10px] text-green-400 bg-black/30">原始输出 (Raw Output)</div>
                            <textarea id="io-output" class="flex-1 bg-transparent border-none text-[10px] p-2 text-dim resize-none" readonly></textarea>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 70% Content (Right) -->
            <div class="col-content bg-black/20 relative">
                 <!-- Toolbar -->
                <div class="h-16 border-b border-border flex center justify-between px-8 bg-panel/30 backdrop-blur-md z-10">
                    <input id="w-title" class="bg-transparent border-none font-bold text-2xl text-main w-2/3 focus:text-accent transition-colors" placeholder="输入章节标题..." onchange="Modules.writer.updateTitle()">
                    <div class="flex gap-6 text-xs text-dim items-center">
                         <div class="flex center gap-2 px-4 py-1.5 rounded-full bg-black/40 border border-white/5">
                            <span id="w-stats" class="font-mono text-accent text-sm font-bold">0</span> <span class="text-[10px] uppercase">字数</span>
                         </div>
                         <button class="btn btn-primary px-6 py-2 shadow-lg shadow-yellow-500/10" onclick="Modules.writer.save()">
                            <i class="fa-solid fa-floppy-disk mr-2"></i> 保存
                         </button>
                    </div>
                </div>
                
                 <!-- Context Bar -->
                <div class="px-8 py-2 bg-black/40 border-b border-border/50 text-[10px] text-dim flex gap-6 font-mono items-center">
                    <span class="text-accent font-bold">系统状态:</span>
                    <span class="flex items-center gap-2"><div class="w-1.5 h-1.5 rounded-full bg-green-500"></div> 自动检索 (RAG)</span>
                    <span class="flex items-center gap-2"><div class="w-1.5 h-1.5 rounded-full bg-green-500"></div> 逻辑自洽</span>
                    <span class="flex-1 text-right opacity-50">草稿 ID: #Session-${Date.now().toString().slice(-4)}</span>
                </div>

                <div class="flex-1 relative overflow-hidden">
                    <textarea id="w-editor" class="w-full h-full bg-transparent border-none p-12 px-20 text-lg font-serif resize-none leading-loose text-gray-200 placeholder-white/10 focus:bg-black/5 transition-colors selection:bg-accent/30" placeholder="在此开始您的创作之旅..." spellcheck="false"></textarea>
                     <!-- Floating AI Action -->
                    <div class="absolute bottom-10 right-10 flex gap-2">
                         <button class="btn btn-primary rounded-full h-12 px-8 shadow-2xl font-bold text-sm flex items-center hover:scale-105 transition-transform" onclick="Modules.writer.aiWrite()">
                            <i class="fa-solid fa-wand-magic-sparkles mr-2"></i> AI 智能续写
                         </button>
                         <button class="btn rounded-full h-12 w-12 p-0 bg-panel border border-white/20 text-white hover:bg-white/20 backdrop-blur-md shadow-xl flex center relative group" title="润色选中内容" onclick="Modules.writer.polish()">
                            <i class="fa-solid fa-paintbrush"></i>
                            <i class="fa-solid fa-gear absolute -top-1 -right-1 text-[10px] text-stone-300 hover:text-orange-500 opacity-0 group-hover:opacity-100 bg-black/50 rounded-full w-4 h-4 flex center" onclick="event.stopPropagation(); Modules.short.openPromptModal('writer_polish')"></i>
                         </button>
                    </div>
                </div>
            </div>
        </div>
    `,
    init: async () => {
        await Modules.writer.loadTree();
        document.getElementById('w-editor').addEventListener('input', () => {
             Modules.writer.saveContent();
        });
    },
    loadTree: async () => {
        const vols = await DB.getAll('volumes');
        const chaps = await DB.getAll('chapters');
        vols.sort((a,b) => a.order - b.order);
        chaps.sort((a,b) => a.order - b.order);

        const listEl = document.getElementById('w-chap-list');
        listEl.innerHTML = '';

        if (vols.length === 0 && chaps.length === 0) {
            listEl.innerHTML = '<div class="text-dim text-xs p-4 text-center">暂无章节，请先创建卷或章节</div>';
        }

        const createBtns = (type, id) => `
            <div class="ml-auto flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <i class="fa-solid fa-plus hover:text-white cursor-pointer" title="在此后插入" onclick="event.stopPropagation(); Modules.writer.insert('${type}', '${id}')"></i>
                <i class="fa-solid fa-pen hover:text-white cursor-pointer" title="重命名" onclick="event.stopPropagation(); Modules.writer.rename('${type}', '${id}')"></i>
                <i class="fa-solid fa-trash hover:text-red-500 cursor-pointer" title="删除" onclick="event.stopPropagation(); Modules.writer.del('${type}', '${id}')"></i>
            </div>
        `;

        // Render Volumes
        vols.forEach(v => {
            const vEl = document.createElement('div');
            vEl.className = 'mb-1 group';
            vEl.innerHTML = `
                <div class="flex items-center gap-2 p-2 hover:bg-white/5 rounded-md cursor-pointer text-accent font-bold text-xs transition-colors" onclick="this.nextElementSibling.classList.toggle('hidden')">
                    <i class="fa-solid fa-box-archive opacity-70"></i> <span class="flex-1 truncate">${v.title}</span>
                    ${createBtns('vol', v.id)}
                </div>
                <div class="pl-3 border-l border-white/10 ml-2 mt-1 space-y-0.5" id="vol-${v.id}"></div>
            `;
            listEl.appendChild(vEl);
        });

        // Render Chapters into Volumes
        const orphanContainer = document.createElement('div');
        orphanContainer.id = 'vol-null';
        orphanContainer.className = 'space-y-0.5 mt-2 pt-2 border-t border-white/10';
        listEl.appendChild(orphanContainer);

        chaps.forEach(c => {
            const parent = c.volumeId ? document.getElementById(`vol-${c.volumeId}`) : orphanContainer;
            if(parent) {
                const cEl = document.createElement('div');
                const activeClass = Modules.writer.cur===c.id ? 'bg-accent/10 text-accent border-l-2 border-accent pl-2' : 'text-dim hover:text-main hover:bg-white/5 pl-2.5 border-l-2 border-transparent';
                cEl.className = `py-1.5 pr-2 text-xs rounded-r transition-all cursor-pointer truncate flex items-center group ${activeClass}`;
                cEl.innerHTML = `<i class="fa-solid fa-file-lines mr-2 opacity-50 text-[10px]"></i><span class="truncate flex-1">${c.title}</span> ${createBtns('chap', c.id)}`;
                cEl.onclick = () => Modules.writer.load(c.id);
                parent.appendChild(cEl);
            }
        });
    },
    insert: async (type, refId) => {
        const title = prompt(type==='vol' ? "新卷名" : "新章节名");
        if(!title) return;
        
        const store = type==='vol' ? 'volumes' : 'chapters';
        const items = await DB.getAll(store);
        const refItem = items.find(i => i.id === refId);
        if(!refItem) return;

        // Shift items
        for(let item of items) {
            if(item.order > refItem.order) {
                item.order++;
                await DB.put(store, item);
            }
        }
        
        const newItem = {
            id: Utils.uuid(),
            title,
            order: refItem.order + 1
        };
        
        if(type === 'chap') {
            newItem.content = '';
            newItem.outline = '';
            newItem.volumeId = refItem.volumeId; // Inherit volume
        }
        
        await DB.put(store, newItem);
        Modules.writer.loadTree();
        if(type === 'chap') Modules.writer.load(newItem.id);
        UI.toast('已插入新' + (type==='vol'?'卷':'章节'));
    },
    rename: async (type, id) => {
        const store = type==='vol' ? 'volumes' : 'chapters';
        const item = await DB.get(store, id);
        const newTitle = prompt("重命名", item.title);
        if(newTitle) {
            item.title = newTitle;
            await DB.put(store, item);
            Modules.writer.loadTree();
            if(type === 'chap' && Modules.writer.cur === id) document.getElementById('w-title').value = newTitle;
            UI.toast('重命名成功');
        }
    },
    del: async (type, id) => {
        if(!confirm("确定删除吗？此操作不可恢复。")) return;
        const store = type==='vol' ? 'volumes' : 'chapters';
        await DB.del(store, id);
        // If vol, delete all chapters in it
        if(type === 'vol') {
            const chaps = await DB.getAll('chapters');
            for(let c of chaps) {
                if(c.volumeId === id) {
                    await DB.del('chapters', c.id);
                }
            }
        }
        Modules.writer.loadTree();
        if(type === 'chap' && Modules.writer.cur === id) {
            document.getElementById('w-editor').value = '';
            document.getElementById('w-title').value = '';
            Modules.writer.cur = null;
        }
        UI.toast('已删除');
    },
    clearAll: async () => {
        if(!confirm("⚠️ 严重警告：确定清空所有卷和章节吗？此操作不可恢复！")) return;
        const vols = await DB.getAll('volumes');
        const chaps = await DB.getAll('chapters');
        for(let v of vols) await DB.del('volumes', v.id);
        for(let c of chaps) await DB.del('chapters', c.id);
        Modules.writer.cur = null;
        document.getElementById('w-editor').value = '';
        document.getElementById('w-title').value = '';
        Modules.writer.loadTree();
        UI.toast('大纲已清空');
    },
    newVol: async () => {
        // Use prompt for now, but UI should ideally handle this better to avoid browser blocking
        const title = prompt("请输入卷名 (例如：第一卷 崛起微末)");
        if(!title) return;
        
        try {
            const vols = await DB.getAll('volumes');
            const order = vols.length ? Math.max(...vols.map(v=>v.order)) + 1 : 1;
            await DB.put('volumes', { id: Utils.uuid(), title, order });
            Modules.writer.loadTree();
            UI.toast('卷已创建');
        } catch (e) {
            console.error(e);
            UI.toast('创建卷失败: ' + e.message);
        }
    },
    newChap: async () => {
        const title = prompt("请输入章节标题");
        if(!title) return;
        
        try {
            const vols = await DB.getAll('volumes');
            // Default to last volume if exists, else null (root)
            const lastVol = vols.length > 0 ? vols[vols.length-1].id : null;
            
            const chaps = await DB.getAll('chapters');
            const order = chaps.length ? Math.max(...chaps.map(c=>c.order)) + 1 : 1;
            
            const id = Utils.uuid();
            await DB.put('chapters', { id, title, content: '', outline: '', order, volumeId: lastVol });
            Modules.writer.loadTree();
            Modules.writer.load(id);
            UI.toast('章节已创建');
        } catch (e) {
            console.error(e);
            UI.toast('创建章节失败: ' + e.message);
        }
    },
    load: async (id) => {
        Modules.writer.cur = id;
        const c = await DB.get('chapters', id);
        document.getElementById('w-title').value = c.title;
        document.getElementById('w-editor').value = c.content || '';
        document.getElementById('w-chap-outline').value = c.outline || '';
        Modules.writer.refreshRAG();
        Modules.writer.loadTree(); // To highlight active
    },
    saveContent: async () => {
        if(!Modules.writer.cur) return;
        const c = await DB.get('chapters', Modules.writer.cur);
        c.content = document.getElementById('w-editor').value;
        await DB.put('chapters', c);
        document.getElementById('w-stats').innerText = c.content.length + ' 字';
    },
    save: async () => {
        if(!Modules.writer.cur) return;
        const c = await DB.get('chapters', Modules.writer.cur);
        c.content = document.getElementById('w-editor').value;
        c.outline = document.getElementById('w-chap-outline').value;
        c.title = document.getElementById('w-title').value;
        await DB.put('chapters', c);
        Modules.writer.loadTree();
        UI.toast('已保存');
    },
    saveRules: async () => {
        const rules = {
            global: document.getElementById('rule-global').value,
            continue: document.getElementById('rule-continue').value,
            polish: document.getElementById('rule-polish').value
        };
        await DB.put('settings', { id: 'writer_rules', content: rules });
        UI.toast('写作规范已保存');
    },
    loadRules: async () => {
        const record = await DB.get('settings', 'writer_rules');
        const rules = record ? record.content : {};
        if(document.getElementById('rule-global')) document.getElementById('rule-global').value = rules.global || '';
        if(document.getElementById('rule-continue')) document.getElementById('rule-continue').value = rules.continue || '';
        if(document.getElementById('rule-polish')) document.getElementById('rule-polish').value = rules.polish || '';
    },
    updateTitle: async () => {
        Modules.writer.save();
    },
    tab: (t) => {
        const tabs = ['rag', 'outline', 'rules', 'chat', 'io'];
        tabs.forEach(x => {
            const el = document.getElementById('tab-' + x);
            const btn = document.getElementById('tab-btn-' + x);
            if (el) el.classList.add('hidden');
            if (btn) btn.classList.remove('active');
        });
        const target = document.getElementById('tab-' + t);
        const targetBtn = document.getElementById('tab-btn-' + t);
        if (target) target.classList.remove('hidden');
        if (targetBtn) targetBtn.classList.add('active');
    },
    refreshRAG: async () => {
        const txt = document.getElementById('w-editor').value.slice(-500);
        const supply = await DB.getAll('entities');
        const matches = supply.filter(e => txt.includes(e.name));
        
        let ragContent = `[System Context]\nEntities Present:\n${matches.map(e=>`- ${e.name} (${e.type})`).join('\n')}`;
        document.getElementById('w-rag-edit').value = ragContent;
        
        document.getElementById('w-supply-list').innerHTML = matches.map(e => `
            <div class="p-2 bg-black/40 border border-white/10 rounded flex justify-between items-center hover:border-accent/50 transition-colors">
                <span class="text-accent text-xs font-bold truncate"><i class="fa-solid fa-cube mr-1 opacity-50"></i>${e.name}</span>
                <span class="text-[9px] uppercase tracking-wider text-dim bg-white/5 px-1.5 rounded">${e.type}</span>
            </div>
        `).join('');
    },
    updateIO: (input, output) => {
        const inEl = document.getElementById('io-input');
        const outEl = document.getElementById('io-output');
        if(inEl) inEl.value = input;
        if(outEl) outEl.value = output;
    },
    aiWrite: async () => {
        const outline = document.getElementById('w-chap-outline').value;
        const rag = document.getElementById('w-rag-edit').value;
        const currentContent = document.getElementById('w-editor').value;
        const lastPara = currentContent.slice(-1000);
        
        // Load Rules
        const record = await DB.get('settings', 'writer_rules');
        const rules = record ? record.content : {};
        
        // Init default prompt if needed
        if(!(await DB.get('prompts', 'writer_ai'))) {
            const defaultPrompt = `[Role: Expert Novelist]\n[Global Rules]: {{rules}}\n[Continue Rules]: {{continue_rules}}\n[Context]\n{{context}}\n\n[Chapter Outline]\n{{outline}}\n\n[Preceding Text]\n...{{input}}\n\n[Task]\nContinue writing the story. Seamless transition. High quality prose.`;
            await DB.put('prompts', {id: 'writer_ai', name: 'writer_ai', content: defaultPrompt});
        }

        let promptTpl = await Modules.short.getPrompt('writer_ai');
        let prompt = promptTpl
            .replace('{{rules}}', rules.global || 'None')
            .replace('{{continue_rules}}', rules.continue || 'None')
            .replace('{{context}}', rag)
            .replace('{{outline}}', outline)
            .replace('{{input}}', lastPara);
        
        UI.toast('AI 正在执笔...');
        let fullOutput = '';
        Modules.writer.updateIO(prompt, 'Generating...');
        
        await AI.generate(prompt, {}, (c) => {
            const el = document.getElementById('w-editor');
            el.value += c; el.scrollTop = el.scrollHeight;
            fullOutput += c;
            Modules.writer.updateIO(prompt, fullOutput);
        });
        Modules.writer.saveContent();
    },
    polish: async () => {
        const el = document.getElementById('w-editor');
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const text = el.value.substring(start, end);
        
        if(!text) return UI.toast('请先选择需要润色的文本');
        
        const record = await DB.get('settings', 'writer_rules');
        const rules = record ? record.content : {};
        
        let promptTpl = await Modules.short.getPrompt('writer_polish');
        let prompt = promptTpl
            .replace('{{rules}}', rules.polish || 'Make it better')
            .replace('{{input}}', text);
        
        UI.toast('正在润色...');
        let newText = '';
        Modules.writer.updateIO(prompt, 'Generating...');
        
        await AI.generate(prompt, {}, (c) => {
            newText += c;
            Modules.writer.updateIO(prompt, newText);
        });
        
        el.setRangeText(newText, start, end, 'select');
        Modules.writer.saveContent();
    },
    sendChat: async () => {
        const txt = document.getElementById('w-chat-in').value;
        const log = document.getElementById('w-chat-log');
        log.innerHTML += `<div>> ${txt}</div>`;
        await AI.generate(txt, {}, c => {
            log.innerHTML += `<span>${c}</span>`;
        });
        log.innerHTML += '<br><br>';
    }
};

// 2. TOOLBOX: DECONSTRUCTION (Split)
Modules.toolbox_split = {
    render: () => `
        <div class="layout-golden bg-[#131314] text-gray-200 font-sans">
            <!-- Sidebar (Modes) -->
            <div class="col-nav w-72 bg-[#1e1f20] border-r border-white/5 flex col transition-all duration-300 overflow-hidden" id="ts-sidebar">
                <div class="p-6 border-b border-white/5 flex justify-between items-center">
                    <span class="font-bold text-lg text-white flex items-center gap-2"><i class="fa-solid fa-scissors text-accent"></i> 全能拆解</span>
                    <button class="btn btn-icon w-8 h-8 hover:bg-white/5 text-dim rounded-full" onclick="Modules.toolbox_split.toggleSidebar()"><i class="fa-solid fa-bars-staggered"></i></button>
                </div>
                
                <div class="flex-1 overflow-y-auto p-4 space-y-2">
                    <div class="text-xs font-bold text-dim uppercase tracking-wider mb-2 px-2">拆解模式</div>
                    ${['structure|循环结构分析|fa-rotate', 'plot|情节脉络提取|fa-timeline', 'char|人物弧光拆解|fa-user-group', 'emotion|情绪价值评估|fa-face-smile', 'tech|写作手法鉴赏|fa-pen-fancy'].map(x => {
                        const [k, v, i] = x.split('|');
                        return `
                        <div class="flex items-center gap-2 group">
                            <button id="ts-btn-${k}" class="btn flex-1 justify-start text-left px-4 h-12 rounded-xl transition-all ${Modules.toolbox_split.currentType===k?'bg-accent text-black font-bold shadow-lg':'bg-white/5 text-dim hover:bg-white/10 hover:text-white'}" onclick="Modules.toolbox_split.setType('${k}')">
                                <i class="fa-solid ${i} mr-3 ${Modules.toolbox_split.currentType===k?'opacity-100':'opacity-50'}"></i>${v}
                            </button>
                            <button class="btn btn-icon w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-dim hover:text-white" onclick="Modules.toolbox_split.configPrompt('${k}')" title="配置提示词">
                                <i class="fa-solid fa-gear"></i>
                            </button>
                        </div>`;
                    }).join('')}
                </div>
            </div>

            <!-- Main Workspace -->
            <div class="col-content flex col relative bg-[#131314]">
                <!-- Header (When sidebar collapsed) -->
                <div id="ts-header-collapsed" class="hidden absolute top-4 left-4 z-20">
                    <button class="btn btn-icon w-10 h-10 bg-[#1e1f20] hover:bg-[#2a2b2d] text-dim rounded-full shadow-lg" onclick="Modules.toolbox_split.toggleSidebar()"><i class="fa-solid fa-bars"></i></button>
                </div>

                <div class="flex-1 overflow-y-auto p-8 flex col gap-6 max-w-5xl mx-auto w-full">
                    <!-- Input -->
                    <div class="bg-[#1e1f20] rounded-3xl border border-white/10 p-1 shadow-lg relative group focus-within:border-accent/50 transition-colors">
                        <textarea id="ts-in" class="w-full bg-transparent border-none p-6 text-base text-gray-200 focus:outline-none resize-none h-40 scrollbar-hide placeholder-white/20 font-sans leading-relaxed" placeholder="在此粘贴需要拆解的原文片段..."></textarea>
                        <div class="p-2 flex justify-between items-center">
                            <div class="flex gap-2 px-4">
                                <button class="btn btn-xs bg-white/5 hover:bg-white/10 text-dim rounded-full" onclick="document.getElementById('ts-in').value=''"><i class="fa-solid fa-eraser mr-1"></i> 清空</button>
                            </div>
                            <button class="btn btn-sm bg-accent hover:bg-accent/80 text-black rounded-full px-6 font-bold shadow-lg transition-transform hover:scale-105" onclick="Modules.toolbox_split.run()">开始拆解 <i class="fa-solid fa-bolt ml-2"></i></button>
                        </div>
                    </div>

                    <!-- Output -->
                    <div class="flex-1 bg-[#1e1f20] rounded-3xl border border-white/10 p-8 min-h-[400px] relative overflow-hidden flex col">
                        <div class="flex justify-between items-center mb-4 border-b border-white/5 pb-4">
                            <span class="font-bold text-lg text-accent flex items-center gap-2"><i class="fa-solid fa-file-waveform"></i> 分析报告</span>
                            <div class="flex gap-2">
                                <button class="btn btn-xs bg-white/5 hover:bg-white/10 text-dim rounded-full" onclick="Modules.toolbox_split.continueRun()"><i class="fa-solid fa-play mr-1"></i> 继续</button>
                                <button class="btn btn-xs bg-white/5 hover:bg-white/10 text-dim rounded-full" onclick="document.getElementById('ts-io-panel').classList.toggle('hidden')"><i class="fa-solid fa-terminal mr-1"></i> IO</button>
                                <button class="btn btn-xs bg-white/5 hover:bg-white/10 text-dim rounded-full" onclick="Utils.copy(document.getElementById('ts-out').innerText)"><i class="fa-solid fa-copy mr-1"></i> 复制</button>
                            </div>
                        </div>
                        
                        <div class="relative flex-1">
                            <div class="absolute inset-0 flex center text-dim opacity-20 pointer-events-none" id="ts-placeholder">
                                <i class="fa-solid fa-magnifying-glass-chart text-6xl"></i>
                            </div>
                            <div id="ts-out" class="markdown-body text-gray-200 leading-loose text-base h-full overflow-y-auto pr-2"></div>
                        </div>
                        
                        <!-- IO Overlay -->
                        <div id="ts-io-panel" class="hidden absolute top-14 left-0 right-0 bottom-0 bg-[#1e1f20] border-t border-white/10 p-4 z-20 flex col">
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-xs font-bold text-dim uppercase">IO Debug</span>
                                <button class="btn btn-icon w-6 h-6 hover:bg-white/10 rounded-full text-dim" onclick="document.getElementById('ts-io-panel').classList.add('hidden')"><i class="fa-solid fa-xmark"></i></button>
                            </div>
                            <div class="flex-1 grid grid-cols-2 gap-4 min-h-0">
                                <textarea id="ts-io-in" class="bg-black/30 border border-white/5 rounded p-2 text-[10px] text-gray-400 font-mono resize-none focus:outline-none" readonly></textarea>
                                <textarea id="ts-io-out" class="bg-black/30 border border-white/5 rounded p-2 text-[10px] text-green-400 font-mono resize-none focus:outline-none" readonly></textarea>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    currentType: 'plot',
    defaultPrompts: {
        structure: "分析以下文本的循环结构和叙事节奏：",
        plot: "拆解以下文本的核心情节脉络（起承转合）：",
        char: "拆解以下文本的人物性格、弧光和关系：",
        emotion: "分析以下文本的情绪流动和调动技巧：",
        tech: "分析以下文本的修辞、视角和写作手法："
    },
    
    toggleSidebar: () => {
        const sb = document.getElementById('ts-sidebar');
        const header = document.getElementById('ts-header-collapsed');
        if (sb.offsetWidth > 0) {
            sb.style.width = '0px';
            sb.style.opacity = '0';
            header.classList.remove('hidden');
        } else {
            sb.style.width = '288px';
            sb.style.opacity = '1';
            header.classList.add('hidden');
        }
    },

    setType: (t) => {
        Modules.toolbox_split.currentType = t;
        // Update UI
        document.querySelectorAll('[id^="ts-btn-"]').forEach(b => {
            b.className = 'btn flex-1 justify-start text-left px-4 h-12 rounded-xl transition-all bg-white/5 text-dim hover:bg-white/10 hover:text-white';
            const icon = b.querySelector('i');
            if(icon) icon.classList.replace('opacity-100', 'opacity-50');
        });
        const btn = document.getElementById(`ts-btn-${t}`);
        if(btn) {
            btn.className = 'btn flex-1 justify-start text-left px-4 h-12 rounded-xl transition-all bg-accent text-black font-bold shadow-lg';
            const icon = btn.querySelector('i');
            if(icon) icon.classList.replace('opacity-50', 'opacity-100');
        }
    },
    configPrompt: async (specificType) => {
        const type = specificType || Modules.toolbox_split.currentType;
        const promptKey = `ts_${type}`;
        await Modules.short.openPromptModal(promptKey);
        const el = document.getElementById('short-prompt-edit');
        if((!el.value || el.value.trim() === '') && Modules.toolbox_split.defaultPrompts[type]) {
            el.value = Modules.toolbox_split.defaultPrompts[type];
        }
    },
    updateIO: (input, output) => {
        document.getElementById('ts-io-in').value = input;
        document.getElementById('ts-io-out').value = output;
    },
    run: async () => {
        const txt = document.getElementById('ts-in').value;
        if(!txt) return UI.toast('请输入文本');
        
        const type = Modules.toolbox_split.currentType;
        let promptTpl = await Modules.short.getPrompt(`ts_${type}`);
        
        let prompt = "";
        if(promptTpl.includes('{{input}}')) prompt = promptTpl.replace('{{input}}', txt);
        else prompt = promptTpl + "\n\n" + txt;

        const outContainer = document.getElementById('ts-out');
        const placeholder = document.getElementById('ts-placeholder');
        placeholder.classList.add('hidden');
        outContainer.innerHTML = '<div class="flex items-center gap-2 text-accent animate-pulse"><i class="fa-solid fa-circle-notch fa-spin"></i> 正在深度拆解中...</div>';
        
        Modules.toolbox_split.updateIO(prompt, 'Generating...');
        
        let fullRes = "";
        await AI.generate(prompt, {}, c => {
            if(fullRes === "") outContainer.innerHTML = "";
            fullRes += c;
            outContainer.innerHTML = marked.parse(fullRes);
            Modules.toolbox_split.updateIO(prompt, fullRes);
        });
    },
    continueRun: async () => {
        const current = document.getElementById('ts-out').innerText;
        if (!current) return UI.toast("请先生成内容");
        
        const prompt = `[Context]\n${current.slice(-1000)}\n\n[Task]\nContinue the analysis/deconstruction from where it left off. Maintain the same format and depth.`;
        
        Modules.toolbox_split.updateIO(prompt, 'Generating...');
        UI.toast("正在继续分析...");
        
        let fullRes = current; // Note: This logic is simple string concat, for markdown it might break blocks but ok for now
        // Better: append to existing HTML
        
        await AI.generate(prompt, {}, c => {
            const outContainer = document.getElementById('ts-out');
            // Simple append for streaming visual
            // Ideally we re-parse full markdown or append text node
            // For now, let's just append text to a new p if needed
            // But since we use marked.parse on full string usually...
            // Let's just append raw text to a hidden buffer and re-render? No, slow.
            // Let's just append to innerHTML for now assuming text
             outContainer.insertAdjacentHTML('beforeend', marked.parse(c)); // This is bad for streaming markdown chunks
             // Correct way: Accumulate text and re-render or intelligent append.
             // Given the complexity, let's just accumulate text in a variable (if we had state) and re-render.
             // But we don't have state here easily accessible.
             // Let's just do the simple thing:
             // We can't easily stream markdown updates without full re-render or complex parser.
             // Let's just re-render full for correctness or just accept plain text append.
             // Re-render full text:
             // We need to store full text state.
             // Let's grab current innerText? No, format lost.
             // We need to change how we store result.
             // Let's just append raw text for now to a buffer we keep in DOM?
             // Actually, the previous implementation did: document.getElementById('ts-out').value = fullRes + c; (Textarea)
             // Now we use div.
             // Let's use a data attribute to store raw text.
        });
        
        // Re-implementing continue properly:
        // We need to keep track of raw text.
        // Let's assume the user won't edit the output directly in the div (it's readonly-ish).
        // For this demo, let's just do a simple non-streaming append or full re-render if we had the var.
        // Let's revert to textarea for output if we want simple streaming, OR use a state variable.
        // I will use a state variable attached to the module.
        
        // Revised run/continue for Div output:
    }
};
// 2.5 TOOLBOX: INFINITE IMITATION
Modules.toolbox_imitate = {
    render: () => `
        <div class="layout-golden bg-[#131314] text-gray-200 font-sans">
            <!-- Sidebar (Modes) -->
            <div class="col-nav w-72 bg-[#1e1f20] border-r border-white/5 flex col transition-all duration-300 overflow-hidden" id="ti-sidebar">
                <div class="p-6 border-b border-white/5 flex justify-between items-center">
                    <span class="font-bold text-lg text-white flex items-center gap-2"><i class="fa-solid fa-copy text-pink-500"></i> 无限仿写</span>
                    <button class="btn btn-icon w-8 h-8 hover:bg-white/5 text-dim rounded-full" onclick="Modules.toolbox_imitate.toggleSidebar()"><i class="fa-solid fa-bars-staggered"></i></button>
                </div>
                
                <div class="flex-1 overflow-y-auto p-4 space-y-2">
                    <div class="text-xs font-bold text-dim uppercase tracking-wider mb-2 px-2">仿写模式</div>
                    ${['style|风格迁移|fa-paintbrush', 'structure|句式重构|fa-paragraph', 'deep|深度仿写|fa-brain', 'reverse|反向仿写|fa-rotate'].map(x => {
                        const [k, v, i] = x.split('|');
                        return `
                        <div class="flex items-center gap-2">
                            <button id="ti-btn-${k}" class="btn flex-1 justify-start text-left px-4 h-12 rounded-xl transition-all ${Modules.toolbox_imitate.currentMode===k?'bg-pink-600/20 text-pink-400 border border-pink-600/50':'bg-white/5 text-dim hover:bg-white/10 border border-transparent'}" onclick="Modules.toolbox_imitate.setMode('${k}')">
                                <i class="fa-solid ${i} mr-3 opacity-70"></i>${v}
                            </button>
                            <button class="btn btn-icon w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-dim" onclick="Modules.short.openPromptModal('imitate_${k}')"><i class="fa-solid fa-gear"></i></button>
                        </div>`;
                    }).join('')}
                </div>
            </div>

            <!-- Main Workspace -->
            <div class="col-content flex col relative bg-[#131314]">
                <!-- Header (When sidebar collapsed) -->
                <div id="ti-header-collapsed" class="hidden absolute top-4 left-4 z-20">
                    <button class="btn btn-icon w-10 h-10 bg-[#1e1f20] hover:bg-[#2a2b2d] text-dim rounded-full shadow-lg" onclick="Modules.toolbox_imitate.toggleSidebar()"><i class="fa-solid fa-bars"></i></button>
                </div>

                <div class="flex-1 overflow-y-auto p-8 flex col gap-6 max-w-6xl mx-auto w-full">
                    <!-- Inputs Container -->
                    <div class="grid grid-cols-2 gap-6 h-[300px]">
                        <!-- Reference Input -->
                        <div class="bg-[#1e1f20] rounded-3xl border border-white/10 p-1 shadow-lg flex col focus-within:border-pink-500/50 transition-colors">
                            <div class="p-3 border-b border-white/5 bg-white/5 rounded-t-3xl flex justify-between items-center">
                                <span class="text-xs font-bold text-pink-400 uppercase px-2">参考范文</span>
                                <i class="fa-solid fa-paste text-dim hover:text-white cursor-pointer px-2" title="粘贴" onclick="navigator.clipboard.readText().then(t=>document.getElementById('ti-ref').value=t)"></i>
                            </div>
                            <textarea id="ti-ref" class="flex-1 bg-transparent border-none p-4 text-sm text-gray-300 resize-none focus:outline-none scrollbar-hide" placeholder="在此粘贴想要模仿的风格范文..."></textarea>
                        </div>
                        
                        <!-- Content Input -->
                        <div class="bg-[#1e1f20] rounded-3xl border border-white/10 p-1 shadow-lg flex col focus-within:border-pink-500/50 transition-colors">
                            <div class="p-3 border-b border-white/5 bg-white/5 rounded-t-3xl flex justify-between items-center">
                                <span class="text-xs font-bold text-dim uppercase px-2">待写内容 / 梗概</span>
                                <i class="fa-solid fa-eraser text-dim hover:text-white cursor-pointer px-2" onclick="document.getElementById('ti-in').value=''"></i>
                            </div>
                            <textarea id="ti-in" class="flex-1 bg-transparent border-none p-4 text-sm text-gray-300 resize-none focus:outline-none scrollbar-hide" placeholder="在此输入你的故事梗概或原始文本..."></textarea>
                        </div>
                    </div>
                    
                    <!-- Action Bar -->
                    <div class="flex justify-center">
                        <button class="btn btn-primary h-12 px-12 rounded-full bg-pink-600 hover:bg-pink-500 text-white font-bold shadow-lg shadow-pink-600/30 flex items-center gap-2 transition-transform hover:scale-105" onclick="Modules.toolbox_imitate.run()">
                            <i class="fa-solid fa-wand-magic-sparkles"></i> 开始无限仿写
                        </button>
                    </div>

                    <!-- Output Area -->
                    <div class="flex-1 bg-[#1e1f20] rounded-3xl border border-white/10 p-8 min-h-[400px] relative overflow-hidden flex col shadow-2xl">
                        <div class="flex justify-between items-center mb-4 border-b border-white/5 pb-4">
                            <span class="font-bold text-lg text-white flex items-center gap-2"><i class="fa-solid fa-pen-fancy text-pink-400"></i> 仿写结果</span>
                            <div class="flex gap-2">
                                <button class="btn btn-xs bg-white/5 hover:bg-white/10 text-dim rounded-full" onclick="Modules.toolbox_imitate.continueRun()"><i class="fa-solid fa-play mr-1"></i> 继续</button>
                                <button class="btn btn-xs bg-white/5 hover:bg-white/10 text-dim rounded-full" onclick="document.getElementById('ti-io-panel').classList.toggle('hidden')"><i class="fa-solid fa-terminal mr-1"></i> IO</button>
                                <button class="btn btn-xs bg-white/5 hover:bg-white/10 text-dim rounded-full" onclick="Utils.copy(document.getElementById('ti-out').value)"><i class="fa-solid fa-copy mr-1"></i> 复制</button>
                            </div>
                        </div>
                        
                        <div class="relative flex-1">
                            <textarea id="ti-out" class="w-full h-full bg-transparent border-none text-base text-gray-200 resize-none focus:outline-none leading-loose font-serif" readonly placeholder="AI 生成结果..."></textarea>
                            
                            <!-- IO Overlay -->
                            <div id="ti-io-panel" class="hidden absolute inset-0 bg-[#1e1f20] border-t border-white/10 p-4 z-20 flex col">
                                <div class="flex justify-between items-center mb-2">
                                    <span class="text-xs font-bold text-dim uppercase">IO Debug</span>
                                    <button class="btn btn-icon w-6 h-6 hover:bg-white/10 rounded-full text-dim" onclick="document.getElementById('ti-io-panel').classList.add('hidden')"><i class="fa-solid fa-xmark"></i></button>
                                </div>
                                <div class="flex-1 grid grid-cols-2 gap-4 min-h-0">
                                    <textarea id="ti-io-in" class="bg-black/30 border border-white/5 rounded p-2 text-[10px] text-gray-400 font-mono resize-none focus:outline-none" readonly></textarea>
                                    <textarea id="ti-io-out" class="bg-black/30 border border-white/5 rounded p-2 text-[10px] text-green-400 font-mono resize-none focus:outline-none" readonly></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    currentMode: 'style',
    
    toggleSidebar: () => {
        const sb = document.getElementById('ti-sidebar');
        const header = document.getElementById('ti-header-collapsed');
        if (sb.offsetWidth > 0) {
            sb.style.width = '0px';
            sb.style.opacity = '0';
            header.classList.remove('hidden');
        } else {
            sb.style.width = '288px';
            sb.style.opacity = '1';
            header.classList.add('hidden');
        }
    },

    setMode: (mode) => {
        Modules.toolbox_imitate.currentMode = mode;
        document.querySelectorAll('[id^="ti-btn-"]').forEach(b => {
            b.className = "btn flex-1 justify-start text-left px-4 h-12 rounded-xl transition-all bg-white/5 text-dim hover:bg-white/10 border border-transparent";
        });
        const btn = document.getElementById(`ti-btn-${mode}`);
        if(btn) btn.className = "btn flex-1 justify-start text-left px-4 h-12 rounded-xl transition-all bg-pink-600/20 text-pink-400 border border-pink-600/50";
    },
    updateIO: (input, output) => {
        document.getElementById('ti-io-in').value = input;
        document.getElementById('ti-io-out').value = output;
    },
    run: async () => {
        const ref = document.getElementById('ti-ref').value;
        const content = document.getElementById('ti-in').value;
        const mode = Modules.toolbox_imitate.currentMode;
        if(!ref || !content) return UI.toast('请填写参考范文和待写内容');
        
        const promptKey = `imitate_${mode}`;
        
        // Ensure defaults
        if(!(await DB.get('prompts', promptKey))) {
            const defaults = {
                imitate_style: "请分析参考范文的文风、句式、修辞和节奏，然后用相同的风格改写/扩写用户提供的内容。\n\n[参考范文]\n{{ref}}\n\n[待写内容]\n{{input}}",
                imitate_structure: "请保留待写内容的含义，但完全采用参考范文的句式结构进行重写。\n\n[参考范文]\n{{ref}}\n\n[待写内容]\n{{input}}",
                imitate_deep: "请深度解析参考范文的内在逻辑和情感流动，以此为内核重构待写内容。\n\n[参考范文]\n{{ref}}\n\n[待写内容]\n{{input}}",
                imitate_reverse: "请分析参考范文的风格，然后用完全相反的风格（例如：严肃变幽默，繁复变简洁）改写以下内容。\n\n[参考范文]\n{{ref}}\n\n[待写内容]\n{{input}}"
            };
            await DB.put('prompts', {id: promptKey, name: promptKey, content: defaults[promptKey]});
        }
        
        let promptTpl = await Modules.short.getPrompt(promptKey);
        if (!promptTpl) {
             const record = await DB.get('prompts', promptKey);
             promptTpl = record ? record.content : "请仿写：{{input}}";
        }

        let prompt = promptTpl.replace('{{ref}}', ref).replace('{{input}}', content);
        
        document.getElementById('ti-out').value = "正在仿写中...";
        Modules.toolbox_imitate.updateIO(prompt, 'Generating...');
        
        let fullRes = "";
        await AI.generate(prompt, {}, c => {
            if(fullRes==="") document.getElementById('ti-out').value = "";
            fullRes += c;
            document.getElementById('ti-out').value = fullRes;
            Modules.toolbox_imitate.updateIO(prompt, fullRes);
        });
    },
    continueRun: async () => {
        const current = document.getElementById('ti-out').value;
        if (!current) return UI.toast("请先生成内容");
        
        const prompt = `[Context]\n${current.slice(-1000)}\n\n[Task]\nContinue writing following the established style and functionality.`;
        
        Modules.toolbox_imitate.updateIO(prompt, 'Generating...');
        UI.toast("正在继续仿写...");
        
        let fullRes = current;
        await AI.generate(prompt, {}, c => {
            fullRes += c;
            const el = document.getElementById('ti-out');
            el.value = fullRes;
            el.scrollTop = el.scrollHeight;
            Modules.toolbox_imitate.updateIO(prompt, fullRes);
        });
    }
};

// 3. TOOLBOX: INFINITE FUSION
Modules.toolbox_fusion = {
    inputs: 2,
    render: () => `
        <div class="layout-golden bg-[#131314] text-gray-200 font-sans">
            <!-- Sidebar (Settings) -->
            <div class="col-nav w-72 bg-[#1e1f20] border-r border-white/5 flex col transition-all duration-300 overflow-hidden" id="tf-sidebar">
                <div class="p-6 border-b border-white/5 flex justify-between items-center">
                    <span class="font-bold text-lg text-white flex items-center gap-2"><i class="fa-solid fa-blender text-purple-500"></i> 无限融合</span>
                    <button class="btn btn-icon w-8 h-8 hover:bg-white/5 text-dim rounded-full" onclick="Modules.toolbox_fusion.toggleSidebar()"><i class="fa-solid fa-bars-staggered"></i></button>
                </div>
                
                <div class="p-6 flex col gap-4">
                    <button class="btn w-full bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-xl h-12 shadow-sm transition-all font-bold" onclick="Modules.toolbox_fusion.addInput()">
                        <i class="fa-solid fa-plus mr-2"></i> 增加融合素材
                    </button>
                    <button class="btn w-full bg-white/5 hover:bg-white/10 text-dim border-none rounded-xl h-12 transition-all" onclick="Modules.short.openPromptModal('fusion')">
                        <i class="fa-solid fa-gear mr-2"></i> 配置融合逻辑
                    </button>
                </div>
                
                <div class="flex-1 p-6 pt-0">
                    <div class="text-xs text-dim leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                        <strong class="text-purple-400 block mb-2">💡 玩法指南</strong>
                        将不同来源的设定、情节或风格放入素材槽，AI 将基于"无限融合 C+"算法生成全新的创意产物。
                    </div>
                </div>
            </div>

            <!-- Main Workspace -->
            <div class="col-content flex col relative bg-[#131314]">
                <!-- Header (When sidebar collapsed) -->
                <div id="tf-header-collapsed" class="hidden absolute top-4 left-4 z-20">
                    <button class="btn btn-icon w-10 h-10 bg-[#1e1f20] hover:bg-[#2a2b2d] text-dim rounded-full shadow-lg" onclick="Modules.toolbox_fusion.toggleSidebar()"><i class="fa-solid fa-bars"></i></button>
                </div>

                <div class="flex-1 flex col p-8 gap-6 overflow-hidden">
                    <!-- Inputs Area -->
                    <div class="flex gap-4 overflow-x-auto pb-4 scrollbar-thin min-h-[200px]" id="tf-inputs">
                        <!-- Inputs injected here -->
                    </div>
                    
                    <!-- Result Area -->
                    <div class="flex-1 bg-[#1e1f20] rounded-3xl border border-white/10 p-1 flex col shadow-2xl relative overflow-hidden">
                        <div class="p-3 border-b border-white/5 flex justify-between items-center bg-black/20 rounded-t-3xl">
                            <span class="font-bold text-purple-400 text-sm flex items-center gap-2 px-4"><i class="fa-solid fa-dna"></i> 融合产物</span>
                            <div class="flex gap-2">
                                <button class="btn btn-xs bg-white/5 hover:bg-white/10 text-dim rounded-full" onclick="Modules.toolbox_fusion.continueRun()"><i class="fa-solid fa-play mr-1"></i> 继续</button>
                                <button class="btn btn-xs bg-white/5 hover:bg-white/10 text-dim rounded-full" onclick="document.getElementById('tf-io-panel').classList.toggle('hidden')"><i class="fa-solid fa-terminal mr-1"></i> IO</button>
                            </div>
                        </div>
                        <div class="relative flex-1">
                            <textarea id="tf-out" class="w-full h-full bg-transparent border-none p-6 text-base text-gray-200 resize-none focus:outline-none leading-loose font-serif" placeholder="点击下方按钮开始融合..."></textarea>
                            
                            <!-- IO Overlay -->
                            <div id="tf-io-panel" class="hidden absolute inset-0 bg-[#1e1f20] border-t border-white/10 p-4 z-20 flex col">
                                <div class="flex justify-between items-center mb-2">
                                    <span class="text-xs font-bold text-dim uppercase">IO Debug</span>
                                    <button class="btn btn-icon w-6 h-6 hover:bg-white/10 rounded-full text-dim" onclick="document.getElementById('tf-io-panel').classList.add('hidden')"><i class="fa-solid fa-xmark"></i></button>
                                </div>
                                <div class="flex-1 grid grid-cols-2 gap-4 min-h-0">
                                    <textarea id="tf-io-in" class="bg-black/30 border border-white/5 rounded p-2 text-[10px] text-gray-400 font-mono resize-none focus:outline-none" readonly></textarea>
                                    <textarea id="tf-io-out" class="bg-black/30 border border-white/5 rounded p-2 text-[10px] text-green-400 font-mono resize-none focus:outline-none" readonly></textarea>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Floating Action Button -->
                        <div class="absolute bottom-6 right-6">
                            <button class="btn btn-primary h-12 px-8 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-transform hover:scale-105" onclick="Modules.toolbox_fusion.run()">
                                <i class="fa-solid fa-wand-magic-sparkles"></i> 立即融合
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    init: () => {
        Modules.toolbox_fusion.inputs = 0;
        Modules.toolbox_fusion.addInput();
        Modules.toolbox_fusion.addInput();
    },
    toggleSidebar: () => {
        const sb = document.getElementById('tf-sidebar');
        const header = document.getElementById('tf-header-collapsed');
        if (sb.offsetWidth > 0) {
            sb.style.width = '0px';
            sb.style.opacity = '0';
            header.classList.remove('hidden');
        } else {
            sb.style.width = '288px';
            sb.style.opacity = '1';
            header.classList.add('hidden');
        }
    },
    addInput: () => {
        Modules.toolbox_fusion.inputs++;
        const div = document.createElement('div');
        div.className = "bg-[#1e1f20] min-w-[300px] flex-1 flex flex-col border border-white/10 rounded-2xl shadow-lg transition-all hover:border-purple-500/30 overflow-hidden";
        div.innerHTML = `
            <div class="p-3 border-b border-white/5 bg-white/5 flex justify-between items-center">
                <span class="text-xs font-bold text-dim uppercase tracking-wider">素材 ${String.fromCharCode(64+Modules.toolbox_fusion.inputs)}</span>
                <i class="fa-solid fa-xmark text-dim cursor-pointer hover:text-white" onclick="this.parentElement.parentElement.remove()"></i>
            </div>
            <textarea class="flex-1 bg-transparent border-none p-4 resize-none text-sm focus:bg-black/20 transition-colors tf-in text-gray-300 focus:outline-none" placeholder="在此输入设定素材..."></textarea>
        `;
        document.getElementById('tf-inputs').appendChild(div);
    },
    updateIO: (input, output) => {
        document.getElementById('tf-io-in').value = input;
        document.getElementById('tf-io-out').value = output;
    },
    run: async () => {
        const inputs = Array.from(document.querySelectorAll('.tf-in')).map((el, i) => `[素材 ${String.fromCharCode(65+i)}]: ${el.value}`).join('\n\n');
        if(inputs.length < 10) return UI.toast('请填写素材');
        
        let promptTpl = await Modules.short.getPrompt('fusion');
        let prompt = promptTpl.replace('{{input}}', inputs);
        
        document.getElementById('tf-out').value = "融合反应堆启动中...";
        Modules.toolbox_fusion.updateIO(prompt, 'Generating...');
        
        let fullRes = "";
        await AI.generate(prompt, {}, c => {
            if(fullRes==="") document.getElementById('tf-out').value = "";
            fullRes += c;
            document.getElementById('tf-out').value = fullRes;
            Modules.toolbox_fusion.updateIO(prompt, fullRes);
        });
    },
    continueRun: async () => {
        const current = document.getElementById('tf-out').value;
        if (!current) return UI.toast("请先生成内容");
        
        const prompt = `[Context]\n${current.slice(-1000)}\n\n[Task]\nContinue expanding on the fused concept.`;
        Modules.toolbox_fusion.updateIO(prompt, 'Generating...');
        UI.toast("正在继续...");
        
        let fullRes = current;
        await AI.generate(prompt, {}, c => {
            fullRes += c;
            const el = document.getElementById('tf-out');
            el.value = fullRes;
            el.scrollTop = el.scrollHeight;
            Modules.toolbox_fusion.updateIO(prompt, fullRes);
        });
    }
};

// 4. SUPPLY CHAIN & VECTORS
Modules.supply = {
    render: () => `
        <div class="h-full grid grid-cols-12 gap-6 p-8">
            <!-- Sidebar List -->
            <div class="col-span-4 card bg-black/40 backdrop-blur border-white/10 flex flex-col p-0">
                <div class="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h3 class="font-bold text-main">供应链实体列表</h3>
                    <button class="btn btn-sm btn-icon bg-accent text-black hover:bg-white" onclick="Modules.supply.add()"><i class="fa-solid fa-plus"></i></button>
                </div>
                <div id="sc-list" class="flex-1 overflow-y-auto p-2 space-y-1"></div>
            </div>

            <!-- Detail Editor -->
            <div class="col-span-8 card bg-black/40 backdrop-blur border-white/10 flex flex-col p-6 gap-4 relative">
                <h3 class="font-bold text-lg text-accent border-b border-white/10 pb-4">实体详情</h3>
                
                <div class="grid grid-cols-3 gap-4">
                    <div class="col-span-2 col gap-2">
                        <span class="text-xs font-bold text-dim">名称</span>
                        <input id="sc-name" class="input bg-black/50 border-white/10 focus:border-accent font-bold text-lg" placeholder="实体名称">
                    </div>
                    <div class="col gap-2">
                        <span class="text-xs font-bold text-dim">类型</span>
                        <select id="sc-type" class="select bg-black/50 border-white/10"><option>人物</option><option>物品</option><option>地点</option><option>情节</option><option>伏笔</option></select>
                    </div>
                </div>
                
                <div class="flex-1 col gap-2">
                    <span class="text-xs font-bold text-dim">描述与向量内容</span>
                    <textarea id="sc-desc" class="textarea flex-1 bg-black/50 border-white/10 focus:border-accent resize-none text-gray-300 leading-relaxed" placeholder="在此输入详细描述。系统将自动将其嵌入向量数据库用于 RAG 检索..."></textarea>
                </div>
                
                <div class="flex justify-end pt-2">
                    <button class="btn btn-primary px-8 shadow-lg shadow-accent/10" onclick="Modules.supply.save()">
                        <i class="fa-solid fa-cloud-arrow-up mr-2"></i> 保存并同步向量库
                    </button>
                </div>
            </div>
        </div>
    `,
    init: () => Modules.supply.refresh(),
    refresh: async () => {
        const list = await DB.getAll('entities');
        document.getElementById('sc-list').innerHTML = list.map(e => `
            <div class="p-3 border border-white/5 rounded bg-black/20 cursor-pointer hover:bg-white/10 hover:border-accent/50 flex justify-between items-center transition-all group" onclick="Modules.supply.load('${e.id}')">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded center bg-white/5 text-dim group-hover:text-accent group-hover:bg-accent/10 transition-colors">
                        <i class="fa-solid ${e.type.includes('人')?'fa-user':e.type.includes('地')?'fa-map-location-dot':'fa-box'}"></i>
                    </div>
                    <span class="font-bold text-sm text-gray-300 group-hover:text-white">${e.name}</span>
                </div>
                <span class="text-[10px] uppercase tracking-wider text-dim bg-black/50 px-2 py-1 rounded border border-white/5">${e.type}</span>
            </div>
        `).join('');
    },
    add: () => { Modules.supply.cur=null; document.getElementById('sc-name').value=''; document.getElementById('sc-desc').value=''; },
    save: async () => {
        const name = document.getElementById('sc-name').value;
        const type = document.getElementById('sc-type').value;
        const desc = document.getElementById('sc-desc').value;
        const id = Modules.supply.cur || Utils.uuid();
        
        // 1. Save Entity
        await DB.put('entities', { id, name, type, desc });
        
        // 2. Sync to Vector DB (Simulated Embedding)
        // In a real app, this would call an embedding API
        const vectorContent = `[Type: ${type}] [Name: ${name}] ${desc}`;
        await DB.put('vectors', {
            id,
            content: vectorContent,
            vector: Array.from({length: 1536}, () => Math.random()), // Mock 1536d vector
            timestamp: Date.now()
        });
        
        // 3. Update RAG Context if Writer is active
        if(Modules.writer && Modules.writer.refreshRAG) {
            Modules.writer.refreshRAG();
        }

        UI.toast('供应链及向量库已同步更新');
        Modules.supply.refresh();
    },
    load: async (id) => {
        Modules.supply.cur = id;
        const e = await DB.get('entities', id);
        document.getElementById('sc-name').value = e.name;
        document.getElementById('sc-type').value = e.type;
        document.getElementById('sc-desc').value = e.desc;
    }
};

// 5. SPECIALIZED VISUAL (ComfyUI Sim)
Modules.visual = {
    render: () => `
        <div class="layout-golden bg-[#131314] text-gray-200 font-sans">
            <!-- Sidebar (Pro Controls) -->
            <div class="col-nav w-80 bg-[#1e1f20] border-r border-white/5 flex col transition-all duration-300 overflow-hidden" id="vis-sidebar">
                <div class="p-6 border-b border-white/5 flex justify-between items-center bg-[#202022]">
                    <span class="font-bold text-lg text-white flex items-center gap-2"><i class="fa-solid fa-palette text-purple-500"></i> AI 绘画</span>
                    <button class="btn btn-icon w-8 h-8 hover:bg-white/5 text-dim rounded-full" onclick="Modules.visual.toggleSidebar()"><i class="fa-solid fa-bars-staggered"></i></button>
                </div>
                
                <div class="flex-1 overflow-y-auto p-6 space-y-6">
                    <!-- Workflow Selection -->
                    <div class="col gap-2">
                        <span class="text-xs font-bold text-dim uppercase tracking-wider">基础模型</span>
                        <select id="vis-model" class="epic-input w-full h-10 rounded-lg px-3 text-sm text-white focus:outline-none">
                            <option>Nano Banana (v1.0)</option>
                            <option>Flux Schnell (极速)</option>
                            <option>Flux Dev (专业)</option>
                            <option>Midjourney V6</option>
                            <option>SDXL 1.0</option>
                            <option>DALL-E 3</option>
                        </select>
                    </div>

                    <!-- Prompt -->
                    <div class="col gap-2">
                        <div class="flex justify-between items-center">
                            <span class="text-xs font-bold text-purple-400 uppercase tracking-wider">正向提示词</span>
                            <i class="fa-solid fa-wand-magic-sparkles text-dim hover:text-white cursor-pointer" title="AI 优化"></i>
                        </div>
                        <textarea class="epic-input w-full h-32 rounded-lg p-3 text-sm font-mono text-purple-200 resize-none focus:outline-none placeholder-white/20" placeholder="Describe your masterpiece..."></textarea>
                    </div>

                    <div class="col gap-2">
                        <span class="text-xs font-bold text-red-400 uppercase tracking-wider">反向提示词</span>
                        <textarea class="epic-input w-full h-20 rounded-lg p-3 text-sm font-mono text-red-200 resize-none focus:outline-none placeholder-white/20" placeholder="low quality, bad anatomy, text, watermark..."></textarea>
                    </div>

                    <!-- Advanced Params -->
                    <div class="col gap-4 border-t border-white/5 pt-4">
                        <span class="text-xs font-bold text-dim uppercase tracking-wider">高级参数</span>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="col gap-1">
                                <span class="text-[10px] text-dim">宽度</span>
                                <input type="number" class="epic-input w-full h-8 rounded text-center text-xs text-white" value="1024">
                            </div>
                            <div class="col gap-1">
                                <span class="text-[10px] text-dim">高度</span>
                                <input type="number" class="epic-input w-full h-8 rounded text-center text-xs text-white" value="1024">
                            </div>
                        </div>
                        
                        <div class="col gap-1">
                            <div class="flex justify-between text-[10px] text-dim"><span>步数 (Steps)</span> <span>20</span></div>
                            <input type="range" class="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500" min="1" max="50" value="20">
                        </div>
                        
                        <div class="col gap-1">
                            <div class="flex justify-between text-[10px] text-dim"><span>提示词相关性 (CFG)</span> <span>7.0</span></div>
                            <input type="range" class="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500" min="1" max="20" value="7" step="0.5">
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div class="col gap-1">
                                <span class="text-[10px] text-dim">随机种子 (Seed)</span>
                                <div class="flex gap-1">
                                    <input type="number" class="epic-input w-full h-8 rounded-l text-center text-[10px] text-white" value="-1">
                                    <button class="w-8 h-8 bg-white/5 border border-white/10 rounded-r hover:bg-white/10 flex center text-dim"><i class="fa-solid fa-dice"></i></button>
                                </div>
                            </div>
                            <div class="col gap-1">
                                <span class="text-[10px] text-dim">采样器</span>
                                <select class="epic-input w-full h-8 rounded text-[10px] text-white px-1"><option>Euler a</option><option>DPM++ 2M Karras</option></select>
                            </div>
                        </div>
                    </div>

                    <!-- ControlNet Placeholder -->
                    <div class="col gap-2 border-t border-white/5 pt-4">
                        <div class="flex justify-between items-center">
                            <span class="text-xs font-bold text-dim uppercase tracking-wider">ControlNet</span>
                            <div class="flex gap-1">
                                <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                <span class="text-[10px] text-dim">Unit 0</span>
                            </div>
                        </div>
                        <div class="h-24 bg-black/30 border border-white/10 rounded-lg border-dashed flex center text-dim text-xs cursor-pointer hover:bg-white/5 transition-colors group">
                            <div class="flex col center gap-2 group-hover:text-purple-400 transition-colors">
                                <i class="fa-solid fa-upload text-xl"></i>
                                <span>上传参考图</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="p-6 border-t border-white/5 bg-[#1e1f20]">
                    <button class="epic-btn w-full py-3 text-base shadow-lg shadow-purple-500/20 font-bold rounded-xl flex center gap-2 bg-purple-600 hover:bg-purple-500 text-white border-purple-500" onclick="Modules.visual.generate()">
                        <i class="fa-solid fa-paintbrush"></i> 立即生成
                    </button>
                </div>
            </div>

            <!-- Main Gallery (Masonry Style) -->
            <div class="col-content flex col relative bg-[#131314]">
                <!-- Header (When sidebar collapsed) -->
                <div id="vis-header-collapsed" class="hidden absolute top-4 left-4 z-20">
                    <button class="btn btn-icon w-10 h-10 bg-[#1e1f20] hover:bg-[#2a2b2d] text-dim rounded-full shadow-lg" onclick="Modules.visual.toggleSidebar()"><i class="fa-solid fa-bars"></i></button>
                </div>

                <div class="flex justify-between items-center p-8 pb-4 bg-gradient-to-b from-[#131314] to-transparent z-10 sticky top-0">
                    <div class="flex gap-8 text-sm font-bold text-dim">
                        <span class="text-white border-b-2 border-purple-500 pb-1 cursor-pointer">生成历史</span>
                        <span class="hover:text-white cursor-pointer transition-colors">收藏夹</span>
                        <span class="hover:text-white cursor-pointer transition-colors">社区灵感</span>
                    </div>
                    <div class="flex gap-2">
                        <button class="btn btn-sm bg-white/5 hover:bg-white/10 rounded-lg text-dim border border-white/5" onclick="document.getElementById('vis-io-panel').classList.toggle('hidden')"><i class="fa-solid fa-terminal mr-2"></i> IO调试</button>
                        <button class="btn btn-sm bg-white/5 hover:bg-white/10 rounded-lg text-dim border border-white/5"><i class="fa-solid fa-filter mr-2"></i> 筛选</button>
                        <div class="w-px h-6 bg-white/10 mx-2"></div>
                        <button class="btn btn-icon w-8 h-8 bg-white/5 hover:bg-white/10 rounded-lg text-dim border border-white/5"><i class="fa-solid fa-table-cells-large"></i></button>
                        <button class="btn btn-icon w-8 h-8 bg-white/5 hover:bg-white/10 rounded-lg text-dim border border-white/5"><i class="fa-solid fa-list"></i></button>
                    </div>
                </div>

                <!-- IO Debug Panel -->
                <div id="vis-io-panel" class="hidden absolute top-20 right-8 w-80 bottom-8 bg-[#1e1f20] border border-white/10 p-4 z-30 flex col font-mono text-xs shadow-2xl rounded-xl">
                    <div class="flex justify-between items-center mb-2 border-b border-white/10 pb-2">
                        <span class="text-accent font-bold">IO Debug</span>
                        <button class="text-dim hover:text-white" onclick="document.getElementById('vis-io-panel').classList.add('hidden')"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="flex-1 flex col gap-2 min-h-0">
                        <div class="text-[10px] text-dim">Input Prompt (Refined)</div>
                        <textarea id="vis-io-in" class="flex-1 bg-black/30 border border-white/5 rounded p-2 text-gray-400 resize-none focus:outline-none" readonly></textarea>
                        <div class="text-[10px] text-green-400">Raw Output (Simulated)</div>
                        <textarea id="vis-io-out" class="flex-1 bg-black/30 border border-white/5 rounded p-2 text-gray-400 resize-none focus:outline-none" readonly></textarea>
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto p-8 pt-0 scrollbar-thin">
                    <div class="columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
                        ${[1,2,3,4,5,6,7,8,9,10,11,12].map(i => {
                            const height = Math.floor(Math.random() * 100) + 200; // Random height for masonry
                            return `
                            <div class="break-inside-avoid mb-6 rounded-2xl overflow-hidden relative group cursor-pointer shadow-lg bg-[#1e1f20]" style="height: ${height}px">
                                <div class="absolute inset-0 bg-black/20 flex center text-dim">
                                    <i class="fa-solid fa-image text-4xl opacity-20"></i>
                                </div>
                                <!-- Mock Image (Gradient) -->
                                <div class="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-blue-900/20 opacity-50"></div>
                                
                                <!-- Hover Overlay -->
                                <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
                                    <div class="flex gap-2 justify-end mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                        <button class="w-8 h-8 rounded-full bg-white/10 hover:bg-purple-500 text-white flex center backdrop-blur"><i class="fa-solid fa-wand-magic-sparkles text-xs"></i></button>
                                        <button class="w-8 h-8 rounded-full bg-white/10 hover:bg-white hover:text-black text-white flex center backdrop-blur"><i class="fa-solid fa-expand text-xs"></i></button>
                                    </div>
                                    <p class="text-[10px] text-gray-300 line-clamp-2 font-mono opacity-80 mb-1">Cyberpunk street, neon lights, rain...</p>
                                    <div class="flex justify-between items-center text-[9px] text-dim">
                                        <span>1024x${Math.floor(height/200*1024)}</span>
                                        <span>Flux Dev</span>
                                    </div>
                                </div>
                            </div>
                        `}).join('')}
                    </div>
                </div>
            </div>
        </div>
    `,
    toggleSidebar: () => {
        const sb = document.getElementById('vis-sidebar');
        const header = document.getElementById('vis-header-collapsed');
        if (sb.offsetWidth > 0) {
            sb.style.width = '0px';
            sb.style.opacity = '0';
            header.classList.remove('hidden');
        } else {
            sb.style.width = '320px';
            sb.style.opacity = '1';
            header.classList.add('hidden');
        }
    },
    toggleStylePanel: () => {
        // Deprecated in new layout, integrated into sidebar if needed
    },
    generate: async () => {
        const prompt = document.querySelector('textarea[placeholder="Describe your masterpiece..."]').value;
        const negPrompt = document.querySelector('textarea[placeholder="low quality, bad anatomy, text, watermark..."]').value;
        const model = document.getElementById('vis-model').value;
        
        if(!prompt) return UI.toast('请输入提示词');
        UI.toast('正在提交生成任务...');
        
        // Populate IO
        const fullPrompt = `[Model: ${model}]\n[Positive]: ${prompt}\n[Negative]: ${negPrompt}`;
        document.getElementById('vis-io-in').value = fullPrompt;
        document.getElementById('vis-io-out').value = "Requesting generation...";
        
        // Simulate AI call for prompt refinement or just logging
        // In a real app, this would call the image generation API
        // Here we simulate the process
        
        setTimeout(() => {
             document.getElementById('vis-io-out').value = `[SUCCESS]\nImage generated successfully.\nSeed: ${Math.floor(Math.random()*10000000)}`;
             UI.toast('生成完成 (模拟)');
        }, 2000);
    }
};

Modules.ai_video = {
    render: () => `
        <div class="layout-golden bg-[#131314] text-gray-200 font-sans">
            <!-- Sidebar (Settings) -->
            <div class="col-nav w-80 bg-[#1e1f20] border-r border-white/5 flex col transition-all duration-300 overflow-hidden" id="av-sidebar">
                <div class="p-6 border-b border-white/5 flex justify-between items-center bg-[#202022]">
                    <span class="font-bold text-lg text-white flex items-center gap-2"><i class="fa-solid fa-video text-pink-500"></i> AI 视频</span>
                    <button class="btn btn-icon w-8 h-8 hover:bg-white/5 text-dim rounded-full" onclick="Modules.ai_video.toggleSidebar()"><i class="fa-solid fa-bars-staggered"></i></button>
                </div>
                
                <div class="flex-1 overflow-y-auto p-6 space-y-6">
                    <div class="col gap-2">
                        <span class="text-xs font-bold text-dim uppercase tracking-wider">基础模型</span>
                        <select id="av-model" class="epic-input w-full h-10 rounded-lg px-3 text-sm text-white focus:outline-none">
                            <option>Sora 2.0 (Preview)</option>
                            <option>Runway Gen-3</option>
                            <option>Pika Art</option>
                            <option>Stable Video Diffusion</option>
                        </select>
                    </div>

                    <div class="col gap-2">
                        <span class="text-xs font-bold text-dim uppercase tracking-wider">生成模式</span>
                        <div class="flex bg-black/30 p-1 rounded-lg border border-white/10">
                            <button class="flex-1 btn-sm rounded bg-pink-600/20 text-pink-400 font-bold">文生视频</button>
                            <button class="flex-1 btn-sm rounded hover:bg-white/5 text-dim">图生视频</button>
                        </div>
                    </div>

                    <div class="col gap-2">
                        <span class="text-xs font-bold text-pink-400 uppercase tracking-wider">提示词</span>
                        <textarea id="av-prompt" class="epic-input w-full h-32 rounded-lg p-3 text-sm font-mono text-pink-200 resize-none focus:outline-none placeholder-white/20" placeholder="Describe the motion and scene..."></textarea>
                    </div>

                    <div class="col gap-4 border-t border-white/5 pt-4">
                        <span class="text-xs font-bold text-dim uppercase tracking-wider">镜头控制</span>
                        <div class="grid grid-cols-3 gap-2 text-center text-[10px] text-dim">
                            <div class="col center gap-1">
                                <span>Pan (平移)</span>
                                <input type="range" class="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-pink-500" min="-10" max="10" value="0">
                            </div>
                            <div class="col center gap-1">
                                <span>Tilt (俯仰)</span>
                                <input type="range" class="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-pink-500" min="-10" max="10" value="0">
                            </div>
                            <div class="col center gap-1">
                                <span>Zoom (变焦)</span>
                                <input type="range" class="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-pink-500" min="-10" max="10" value="0">
                            </div>
                        </div>
                    </div>
                    
                    <div class="col gap-2">
                        <span class="text-xs font-bold text-dim uppercase tracking-wider">时长 (秒)</span>
                        <div class="flex gap-2">
                            <button class="btn flex-1 bg-white/10 text-white text-xs border border-white/10 rounded h-8">3s</button>
                            <button class="btn flex-1 bg-black/30 text-dim text-xs border border-white/5 hover:bg-white/5 rounded h-8">5s</button>
                            <button class="btn flex-1 bg-black/30 text-dim text-xs border border-white/5 hover:bg-white/5 rounded h-8">10s</button>
                        </div>
                    </div>
                </div>
                
                <div class="p-6 border-t border-white/5 bg-[#1e1f20]">
                    <button class="epic-btn w-full py-3 text-base shadow-lg shadow-pink-500/20 font-bold rounded-xl flex center gap-2 bg-pink-600 hover:bg-pink-500 text-white border-pink-500" onclick="Modules.ai_video.generate()">
                        <i class="fa-solid fa-clapperboard"></i> 生成视频
                    </button>
                </div>
            </div>

            <!-- Main Gallery -->
            <div class="col-content flex col relative bg-[#131314]">
                <!-- Header (When sidebar collapsed) -->
                <div id="av-header-collapsed" class="hidden absolute top-4 left-4 z-20">
                    <button class="btn btn-icon w-10 h-10 bg-[#1e1f20] hover:bg-[#2a2b2d] text-dim rounded-full shadow-lg" onclick="Modules.ai_video.toggleSidebar()"><i class="fa-solid fa-bars"></i></button>
                </div>

                <div class="flex justify-between items-center p-8 pb-4 bg-gradient-to-b from-[#131314] to-transparent z-10 sticky top-0">
                    <div class="flex gap-6 text-sm font-bold text-dim">
                        <span class="text-white border-b-2 border-pink-500 pb-1 cursor-pointer">生成历史</span>
                        <span class="hover:text-white cursor-pointer transition-colors">收藏夹</span>
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto grid grid-cols-2 gap-6 content-start p-8 pt-0 scrollbar-thin" id="av-gallery">
                    <!-- Placeholder -->
                    <div class="aspect-video bg-[#1e1f20] rounded-2xl border border-white/5 flex center text-dim flex-col gap-2 relative group overflow-hidden shadow-lg hover:border-pink-500/30 transition-all">
                        <div class="absolute inset-0 bg-gradient-to-br from-pink-900/10 to-transparent"></div>
                        <i class="fa-solid fa-film text-4xl opacity-20 group-hover:scale-110 transition-transform duration-500"></i>
                        <span class="opacity-50 text-xs font-mono tracking-widest">NO VIDEOS GENERATED</span>
                    </div>
                </div>
            </div>
        </div>
    `,
    toggleSidebar: () => {
        const sb = document.getElementById('av-sidebar');
        const header = document.getElementById('av-header-collapsed');
        if (sb.offsetWidth > 0) {
            sb.style.width = '0px';
            sb.style.opacity = '0';
            header.classList.remove('hidden');
        } else {
            sb.style.width = '320px';
            sb.style.opacity = '1';
            header.classList.add('hidden');
        }
    },
    generate: async () => {
        const prompt = document.getElementById('av-prompt').value;
        if(!prompt) return UI.toast('请输入提示词');
        UI.toast('正在提交视频生成任务...');
        
        const gallery = document.getElementById('av-gallery');
        const id = Date.now();
        
        // Remove empty placeholder if it exists
        if(gallery.children.length === 1 && gallery.firstElementChild.innerText.includes('暂无')) {
            gallery.innerHTML = '';
        }

        const div = document.createElement('div');
        div.className = "aspect-video bg-black rounded-2xl border border-white/10 overflow-hidden relative group shadow-lg";
        div.innerHTML = `
            <div class="absolute inset-0 flex center text-pink-500 animate-pulse bg-black/80 z-10 flex-col gap-2" id="loading-${id}">
                <i class="fa-solid fa-circle-notch fa-spin text-2xl"></i>
                <span class="text-xs font-mono">RENDERING...</span>
            </div>
            <video src="" class="w-full h-full object-cover" loop muted></video>
            <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <p class="text-xs text-white line-clamp-2 mb-2">${prompt}</p>
                <div class="flex gap-2 justify-end">
                    <button class="btn-icon w-8 h-8 bg-white/10 hover:bg-white hover:text-black rounded-full backdrop-blur"><i class="fa-solid fa-download"></i></button>
                    <button class="btn-icon w-8 h-8 bg-white/10 hover:bg-white hover:text-black rounded-full backdrop-blur"><i class="fa-solid fa-expand"></i></button>
                </div>
            </div>
        `;
        gallery.prepend(div);
        
        // Sim delay
        setTimeout(() => {
            const loading = document.getElementById(`loading-\${id}`);
            if(loading) loading.remove();
            div.querySelector('video').src = "https://cdn.coverr.co/videos/coverr-cyberpunk-city-lights-5645/1080p.mp4"; // Placeholder
            div.querySelector('video').play();
            UI.toast('视频生成完成');
        }, 3000);
    }
};

// 6. CODING (Cursor Sim)
Modules.coding = {
    currentFile: 'index.html',
    render: () => `
        <div class="h-full flex bg-[#1e1e1e] text-[#cccccc] font-sans overflow-hidden select-none">
            <!-- Sidebar (Activity Bar + Explorer) -->
            <div class="w-12 bg-[#333333] flex flex-col items-center py-2 gap-4 border-r border-[#252526] z-20">
                <div class="w-10 h-10 flex center text-white text-xl cursor-pointer border-l-2 border-white" title="资源管理器"><i class="fa-regular fa-file"></i></div>
                <div class="w-10 h-10 flex center text-gray-400 hover:text-white text-xl cursor-pointer" title="搜索"><i class="fa-solid fa-magnifying-glass"></i></div>
                <div class="w-10 h-10 flex center text-gray-400 hover:text-white text-xl cursor-pointer" title="源代码管理"><i class="fa-solid fa-code-branch"></i></div>
                <div class="w-10 h-10 flex center text-gray-400 hover:text-white text-xl cursor-pointer" title="运行和调试"><i class="fa-solid fa-bug"></i></div>
                <div class="w-10 h-10 flex center text-gray-400 hover:text-white text-xl cursor-pointer" title="扩展"><i class="fa-solid fa-cubes"></i></div>
                <div class="flex-1"></div>
                <div class="w-10 h-10 flex center text-gray-400 hover:text-white text-xl cursor-pointer" title="设置"><i class="fa-solid fa-gear"></i></div>
            </div>

            <div class="w-64 bg-[#252526] flex flex-col border-r border-[#1e1e1e]">
                <div class="h-10 flex items-center px-4 text-xs font-bold text-gray-300 uppercase tracking-wider">资源管理器 (Explorer)</div>
                <div class="flex-1 overflow-y-auto font-sans text-sm py-2" id="code-file-list">
                    <div class="px-2 py-1 flex items-center gap-1 text-white font-bold cursor-pointer"><i class="fa-solid fa-chevron-down text-[10px] w-4 text-center"></i> PROJECT_GENESIS</div>
                    <div class="pl-4">
                        ${['index.html|html5|text-orange-500', 'style.css|css3-alt|text-blue-400', 'script.js|js|text-yellow-400', 'app.py|python|text-blue-300', 'data.json|database|text-green-400', 'deploy.yml|docker|text-blue-500', 'README.md|markdown|text-white'].map(f => {
                            const [name, icon, color] = f.split('|');
                            return `
                            <div class="flex items-center gap-2 px-3 py-1 hover:bg-[#2a2d2e] cursor-pointer group transition-colors ${Modules.coding.currentFile===name?'bg-[#37373d] text-white':'text-gray-400'}" onclick="Modules.coding.loadFile('${name}')">
                                <i class="fa-brands fa-${icon} ${color} w-4 text-center text-sm"></i>
                                <span class="truncate">${name}</span>
                            </div>`;
                        }).join('')}
                    </div>
                </div>
                
                <!-- AI Assistant Mini -->
                <div class="h-1/3 bg-[#1e1e1e] border-t border-[#333] flex flex-col relative">
                    <div class="p-2 px-4 bg-[#252526] text-xs font-bold text-white flex justify-between items-center border-b border-[#333]">
                        <span>智能助手 (COPILOT)</span>
                        <div class="flex gap-2 text-gray-400">
                            <i class="fa-solid fa-terminal hover:text-white cursor-pointer" onclick="document.getElementById('code-io-panel').classList.toggle('hidden')" title="IO Debug"></i>
                            <i class="fa-solid fa-ellipsis hover:text-white cursor-pointer"></i>
                        </div>
                    </div>
                    
                    <!-- IO Debug Panel -->
                    <div id="code-io-panel" class="hidden absolute inset-0 bg-[#1e1e1e] z-30 flex flex-col p-2 border-b border-[#333]">
                        <div class="flex justify-between items-center mb-1 border-b border-[#333] pb-1">
                            <span class="text-[10px] font-bold text-blue-400">IO Debug</span>
                            <i class="fa-solid fa-xmark text-gray-400 hover:text-white cursor-pointer" onclick="document.getElementById('code-io-panel').classList.add('hidden')"></i>
                        </div>
                        <div class="flex-1 flex flex-col gap-1 overflow-hidden">
                            <div class="text-[9px] text-gray-500">Input Prompt</div>
                            <textarea id="code-io-in" class="flex-1 bg-[#252526] border border-[#333] rounded p-1 text-[10px] text-gray-300 resize-none focus:outline-none font-mono" readonly></textarea>
                            <div class="text-[9px] text-green-500">Raw Output</div>
                            <textarea id="code-io-out" class="flex-1 bg-[#252526] border border-[#333] rounded p-1 text-[10px] text-gray-300 resize-none focus:outline-none font-mono" readonly></textarea>
                        </div>
                    </div>

                    <div class="flex-1 p-3 overflow-y-auto space-y-3" id="code-chat-log">
                        <div class="flex gap-2">
                            <div class="w-6 h-6 rounded-full bg-blue-600 flex center text-xs text-white"><i class="fa-solid fa-robot"></i></div>
                            <div class="text-xs text-gray-300 leading-relaxed bg-[#2a2d2e] p-2 rounded-lg">你好！我是你的智能编程助手。我可以帮你生成代码、解释逻辑或修复 Bug。</div>
                        </div>
                    </div>
                    <div class="p-2">
                        <div class="relative">
                            <textarea id="code-chat-in" class="w-full bg-[#2d2d2d] border border-[#3e3e42] rounded p-2 pr-8 text-xs text-white focus:outline-none focus:border-blue-500 resize-none h-16" placeholder="输入指令 (Ctrl+Enter 发送)..." onkeydown="if(event.ctrlKey && event.key==='Enter') Modules.coding.askAI()"></textarea>
                            <button class="absolute bottom-2 right-2 text-gray-400 hover:text-white" onclick="Modules.coding.askAI()"><i class="fa-solid fa-paper-plane"></i></button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Main Editor Area -->
            <div class="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
                <!-- Tabs -->
                <div class="h-9 bg-[#252526] flex items-center overflow-x-auto scrollbar-hide">
                    <div class="h-full px-3 flex items-center gap-2 text-xs text-white bg-[#1e1e1e] border-t border-blue-500 min-w-[120px] border-r border-[#252526] cursor-pointer">
                        <i class="fa-brands fa-html5 text-orange-500"></i> ${Modules.coding.currentFile}
                        <i class="fa-solid fa-xmark ml-auto hover:bg-[#333] rounded p-0.5 text-gray-400 hover:text-white"></i>
                    </div>
                    <div class="h-full px-3 flex items-center gap-2 text-xs text-gray-400 hover:bg-[#2d2d2d] min-w-[120px] border-r border-[#252526] cursor-pointer" onclick="Modules.coding.loadFile('style.css')">
                        <i class="fa-brands fa-css3-alt text-blue-400"></i> style.css
                        <i class="fa-solid fa-xmark ml-auto hover:bg-[#333] rounded p-0.5 hover:text-white"></i>
                    </div>
                    <div class="ml-auto px-2 flex gap-2 items-center">
                        <button class="w-6 h-6 flex center hover:bg-[#333] rounded text-gray-400 hover:text-white"><i class="fa-solid fa-play text-green-500"></i></button>
                        <button class="w-6 h-6 flex center hover:bg-[#333] rounded text-gray-400 hover:text-white"><i class="fa-solid fa-table-columns"></i></button>
                    </div>
                </div>

                <!-- Breadcrumbs -->
                <div class="h-6 bg-[#1e1e1e] flex items-center px-4 text-xs text-gray-500 border-b border-[#333]">
                    src <i class="fa-solid fa-chevron-right text-[8px] mx-1"></i> components <i class="fa-solid fa-chevron-right text-[8px] mx-1"></i> ${Modules.coding.currentFile}
                </div>

                <div class="flex-1 flex relative overflow-hidden">
                    <!-- Code Editor -->
                    <div class="flex-1 flex flex-col relative min-w-0">
                        <div class="flex-1 relative flex">
                            <!-- Line Numbers -->
                            <div class="w-12 bg-[#1e1e1e] text-[#858585] text-right pr-3 pt-4 text-xs font-mono select-none leading-6 border-r border-[#333]" id="line-numbers">
                                ${Array.from({length:30}, (_,i)=>i+1).join('<br>')}
                            </div>
                            <!-- Text Area -->
                            <textarea id="code-editor" class="flex-1 bg-[#1e1e1e] text-[#d4d4d8] font-mono text-sm p-4 pt-4 resize-none focus:outline-none leading-6 whitespace-pre" spellcheck="false" oninput="Modules.coding.onEditorInput()">
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Genesis App</title>
    
</head>
<body>
    <div class="card">
        <h1>Hello Genesis</h1>
        <p>Welcome to the next generation of AI-powered development.</p>
        <button onclick="alert('System Operational!')">Get Started</button>
    </div>
    <script>
        console.log('Genesis Core initialized.');
    <\/script>
</body>
</html>
                            </textarea>
                        </div>
                        
                        <!-- Terminal Panel -->
                        <div class="h-48 border-t border-[#333] bg-[#1e1e1e] flex flex-col">
                            <div class="flex border-b border-[#333] text-[11px] font-bold text-gray-400 uppercase">
                                <div class="px-4 py-1.5 text-white border-b border-white cursor-pointer hover:bg-[#2a2d2e]">Terminal</div>
                                <div class="px-4 py-1.5 cursor-pointer hover:bg-[#2a2d2e] hover:text-white">Output</div>
                                <div class="px-4 py-1.5 cursor-pointer hover:bg-[#2a2d2e] hover:text-white">Debug Console</div>
                                <div class="px-4 py-1.5 cursor-pointer hover:bg-[#2a2d2e] hover:text-white">Ports</div>
                                <div class="flex-1"></div>
                                <div class="px-2 py-1.5 cursor-pointer hover:text-white"><i class="fa-solid fa-plus"></i></div>
                                <div class="px-2 py-1.5 cursor-pointer hover:text-white"><i class="fa-solid fa-trash-can"></i></div>
                                <div class="px-2 py-1.5 cursor-pointer hover:text-white"><i class="fa-solid fa-chevron-up"></i></div>
                                <div class="px-2 py-1.5 cursor-pointer hover:text-white"><i class="fa-solid fa-xmark"></i></div>
                            </div>
                            <div class="flex-1 p-2 font-mono text-sm overflow-y-auto bg-[#1e1e1e]" id="code-console">
                                <div class="mb-1 text-gray-400">Microsoft Windows [Version 10.0.22631.3527]</div>
                                <div class="mb-1 text-gray-400">(c) Microsoft Corporation. All rights reserved.</div>
                                <div class="mt-2">
                                    <span class="text-green-400">➜</span> <span class="text-blue-400">genesis-project</span> <span class="text-yellow-400">git:(main)</span> <span class="text-white">npm run dev</span>
                                </div>
                                <div class="text-gray-300 mt-1">
                                    > genesis-app@1.0.0 dev<br>
                                    > vite
                                </div>
                                <div class="text-green-400 mt-1">
                                    VITE v5.2.11  ready in 345 ms
                                </div>
                                <div class="text-white mt-1">
                                    <span class="text-green-400">➜</span>  <span class="font-bold">Local:</span>   <span class="text-blue-400 underline">http://localhost:5173/</span><br>
                                    <span class="text-green-400">➜</span>  <span class="font-bold">Network:</span> use --host to expose
                                </div>
                                <div class="mt-2 text-white">
                                    <span class="text-green-400">➜</span> <span class="text-blue-400">genesis-project</span> <span class="text-yellow-400">git:(main)</span> <span class="animate-pulse">_</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Resize Handle -->
                    <div class="w-1 bg-[#333] cursor-col-resize hover:bg-blue-500 transition-colors z-50" onmousedown="Modules.coding.startResize(event)"></div>

                    <!-- Right Panel: Preview -->
                    <div class="w-[500px] flex flex-col bg-[#1e1e1e] border-l border-[#333]" id="code-right-panel">
                        <div class="flex border-b border-[#333] bg-[#252526] items-center h-9 px-3 justify-between">
                            <div class="flex items-center gap-2 bg-[#3c3c3c] rounded px-2 py-0.5 text-xs text-gray-300 w-full max-w-[300px]">
                                <i class="fa-solid fa-lock text-[10px]"></i> localhost:5173
                            </div>
                            <div class="flex gap-1 ml-2">
                                <button class="w-6 h-6 flex center hover:bg-[#333] rounded text-gray-400 hover:text-white" onclick="Modules.coding.runPreview()"><i class="fa-solid fa-rotate-right text-xs"></i></button>
                                <button class="w-6 h-6 flex center hover:bg-[#333] rounded text-gray-400 hover:text-white"><i class="fa-solid fa-up-right-from-square text-xs"></i></button>
                            </div>
                        </div>
                        <div class="flex-1 relative bg-white">
                             <div id="iframe-overlay" class="absolute inset-0 z-40 hidden bg-transparent"></div>
                             <iframe id="code-preview" class="w-full h-full border-none"></iframe>
                        </div>
                    </div>
                </div>
                
                <!-- Status Bar -->
                <div class="h-6 bg-[#007acc] text-white flex items-center px-3 text-[11px] justify-between">
                    <div class="flex gap-4">
                        <div class="flex items-center gap-1 cursor-pointer hover:bg-white/20 px-1 rounded"><i class="fa-solid fa-code-branch"></i> main*</div>
                        <div class="flex items-center gap-1 cursor-pointer hover:bg-white/20 px-1 rounded"><i class="fa-regular fa-circle-xmark"></i> 0 <i class="fa-solid fa-triangle-exclamation ml-1"></i> 0</div>
                    </div>
                    <div class="flex gap-4">
                        <div class="cursor-pointer hover:bg-white/20 px-1 rounded">Ln 12, Col 34</div>
                        <div class="cursor-pointer hover:bg-white/20 px-1 rounded">UTF-8</div>
                        <div class="cursor-pointer hover:bg-white/20 px-1 rounded">HTML</div>
                        <div class="cursor-pointer hover:bg-white/20 px-1 rounded"><i class="fa-solid fa-bell"></i></div>
                    </div>
                </div>
            </div>
        </div>
    `,
    startResize: (e) => {
        e.preventDefault();
        document.getElementById('iframe-overlay').classList.remove('hidden'); // Enable overlay
        window.addEventListener('mousemove', Modules.coding.resize);
        window.addEventListener('mouseup', Modules.coding.stopResize);
    },
    resize: (e) => {
        const panel = document.getElementById('code-right-panel');
        // Calculate new width based on mouse position from right edge of screen
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth > 200 && newWidth < window.innerWidth - 300) {
            panel.style.width = newWidth + 'px';
        }
    },
    stopResize: () => {
        document.getElementById('iframe-overlay').classList.add('hidden'); // Disable overlay
        window.removeEventListener('mousemove', Modules.coding.resize);
        window.removeEventListener('mouseup', Modules.coding.stopResize);
    },
    runPreview: () => {
        const code = document.getElementById('code-editor').value;
        const iframe = document.getElementById('code-preview');
        // Inject console log capture
        const script = '<script>' +
            '(function(){' +
                'var oldLog = console.log;' +
                'console.log = function(message) {' +
                    'window.parent.postMessage({type: "console", message: message}, "*");' +
                    'oldLog.apply(console, arguments);' +
                '};' +
                'var oldErr = console.error;' +
                'console.error = function(message) {' +
                    'window.parent.postMessage({type: "error", message: message}, "*");' +
                    'oldErr.apply(console, arguments);' +
                '};' +
            '})();' +
        '<\/script>';
        iframe.srcdoc = code.replace('<head>', '<head>' + script);
        
        // Listen for messages
        window.onmessage = (e) => {
            if(e.data.type === 'console') Modules.coding.log(e.data.message, 'log');
            if(e.data.type === 'error') Modules.coding.log(e.data.message, 'error');
        };
    },
    log: (msg, type) => {
        const c = document.getElementById('code-console');
        const color = type === 'error' ? 'text-red-400' : 'text-gray-300';
        c.innerHTML += `<div class="${color} font-mono text-xs border-b border-white/5 py-1">> ${msg}</div>`;
        c.scrollTop = c.scrollHeight;
    },
    autoRun: () => {
        // Debounce auto run
        if(Modules.coding.timer) clearTimeout(Modules.coding.timer);
        Modules.coding.timer = setTimeout(() => Modules.coding.runPreview(), 1000);
    },
    fixBug: async () => {
        const code = document.getElementById('code-editor').value;
        const log = document.getElementById('code-chat-log');
        log.innerHTML += `<div class="mb-2 text-blue-300 bg-blue-500/10 p-2 rounded border border-blue-500/20">System: Analyzing code for bugs...</div>`;
        
        let fullRes = "";
        await AI.generate(`Analyze the following code for potential bugs and fix them. Return ONLY the fixed code block without markdown.\n\n${code}`, {}, c => fullRes+=c);
        
        fullRes = fullRes.replace(/```html/g, '').replace(/```/g, '').trim();
        document.getElementById('code-editor').value = fullRes;
        Modules.coding.runPreview();
        log.innerHTML += `<div class="mb-2 text-green-400 bg-green-500/10 p-2 rounded border border-green-500/20">AI: Bugs fixed.</div>`;
    },
    deploy: () => {
        const c = document.getElementById('code-console');
        c.innerHTML += `<div class="text-purple-400 font-mono text-xs border-b border-white/5 py-1">> Initializing deployment sequence...</div>`;
        setTimeout(() => c.innerHTML += `<div class="text-gray-300 font-mono text-xs border-b border-white/5 py-1">> Building Docker image... [DONE]</div>`, 1000);
        setTimeout(() => c.innerHTML += `<div class="text-gray-300 font-mono text-xs border-b border-white/5 py-1">> Pushing to registry... [DONE]</div>`, 2000);
        setTimeout(() => c.innerHTML += `<div class="text-green-400 font-mono text-xs border-b border-white/5 py-1">> Successfully deployed to production! URL: https://app-${Math.floor(Math.random()*1000)}.genesis.dev</div>`, 3500);
    },
    loadFile: (filename) => {
        Modules.coding.currentFile = filename;
        // Directly update UI components instead of full re-render to maintain state where possible
        const fileList = document.getElementById('code-file-list');
        if (fileList) {
             // Upate active class logic visually without re-render
             Array.from(fileList.children).forEach(child => {
                 if(child.innerText.includes(filename)) {
                     child.classList.add('bg-[#37373d]', 'text-white', 'border-l-2', 'border-blue-500', 'pl-[22px]');
                 } else {
                     child.classList.remove('bg-[#37373d]', 'text-white', 'border-l-2', 'border-blue-500', 'pl-[22px]');
                 }
             });
        }
        
        // Update tab
        const tabTitle = document.querySelector('#module-view-coding .h-10 .border-t-2');
        if(tabTitle) tabTitle.innerHTML = `<i class="fa-brands fa-html5 text-orange-500"></i> ${filename} <i class="fa-solid fa-xmark ml-auto hover:text-white text-transparent group-hover:text-gray-400"></i>`;

        
        // Mock file loading logic (In real app, fetch from FS)
        setTimeout(() => {
            const editor = document.getElementById('code-editor');
            if(!editor) return;
            
            if (filename === 'index.html') {
                editor.value = `<!DOCTYPE html>\n<html>\n<head>\n    \n</head>\n<body>\n    <div class="card">\n        <h1>Hello Genesis</h1>\n        <p>This is a live preview.</p>\n        <button onclick="console.log('Button clicked!')">Click Me</button>\n    </div>\n    <script>\n        console.log('App loaded');\n    <\/script>\n</body>\n</html>`;
            } else if (filename === 'style.css') {
                editor.value = `body { background: #111; color: #fff; }\n.card { border: 1px solid #333; }`;
            } else if (filename === 'script.js') {
                editor.value = `console.log('App loaded');`;
            } else if (filename === 'deploy.yml') {
                editor.value = `version: '3'\nservices:\n  web:\n    image: nginx:alpine\n    ports:\n      - "80:80"`;
            } else {
                editor.value = `// File: ${filename}\n// Content loading...`;
            }
            Modules.coding.runPreview();
            UI.toast(`Opened ${filename}`);
        }, 50);
    },
    askAI: async () => {
        const input = document.getElementById('code-chat-in');
        const text = input.value;
        if(!text) return;
        
        const log = document.getElementById('code-chat-log');
        log.innerHTML += `<div class="mb-2 text-blue-300 bg-blue-500/10 p-2 rounded border border-blue-500/20 text-right">You: ${text}</div>`;
        input.value = '';
        log.scrollTop = log.scrollHeight;
        
        const currentCode = document.getElementById('code-editor').value;
        
        const loadingId = 'ai-load-' + Date.now();
        log.innerHTML += `<div id="${loadingId}" class="mb-2 text-gray-400 bg-white/5 p-2 rounded border border-white/10"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i>AI Generating...</div>`;
        
        const prompt = `User wants to modify this code: \n\n${currentCode}\n\nRequest: ${text}\n\nReturn ONLY the updated full code block. Do not include markdown ticks like '''html.`;
        
        document.getElementById('code-io-in').value = prompt;
        document.getElementById('code-io-out').value = "Generating...";
        
        let newCode = "";
        await AI.generate(prompt, {}, c => {
            newCode += c;
            document.getElementById('code-io-out').value = newCode;
        });
        
        document.getElementById(loadingId).remove();
        
        // Clean up markdown code blocks if AI adds them
        newCode = newCode.replace(/```html/g, '').replace(/```/g, '').trim();

        if (newCode) {
            document.getElementById('code-editor').value = newCode;
            Modules.coding.runPreview();
            log.innerHTML += `<div class="mb-2 text-green-400 bg-green-500/10 p-2 rounded border border-green-500/20">AI: Code updated successfully.</div>`;
        } else {
            log.innerHTML += `<div class="mb-2 text-red-400 bg-red-500/10 p-2 rounded border border-red-500/20">AI: Failed to generate code.</div>`;
        }
        log.scrollTop = log.scrollHeight;
    }
};

// 7. LIBRARY
Modules.library = {
    currentBook: null,
    currentTheme: 'dark',
    fontSize: 18,
    sidebarOpen: true,
    render: () => `
        <div class="layout-golden bg-[#09090b] text-[#e4e4e7] font-sans">
            <!-- Left Sidebar (Bookshelf & Nav) -->
            <div class="col-nav w-72 bg-[#18181b] border-r border-white/5 flex flex-col z-20">
                <div class="p-6 border-b border-white/5 flex items-center gap-3 bg-[#202022]">
                    <div class="w-10 h-10 rounded-lg bg-amber-600/20 flex center border border-amber-600/50 text-amber-500 text-xl shadow-lg"><i class="fa-solid fa-book-open"></i></div>
                    <div>
                        <h2 class="text-lg font-bold text-white">沉浸图书馆</h2>
                        <p class="text-[10px] text-dim uppercase tracking-wider">Immersive Reader</p>
                    </div>
                </div>
                
                <div class="p-4 space-y-2">
                    <button class="epic-btn w-full h-10 rounded bg-amber-600/20 text-amber-500 border border-amber-600/50 hover:bg-amber-600 hover:text-white font-bold flex center gap-2" onclick="document.getElementById('lib-upload').click()">
                        <i class="fa-solid fa-plus"></i> 导入新书
                    </button>
                    <input type="file" id="lib-upload" class="hidden" onchange="Modules.library.handleUpload(this)">
                </div>

                <div class="flex-1 overflow-y-auto py-2 px-2 space-y-1">
                    <div class="px-4 py-2 text-[10px] font-bold text-dim uppercase tracking-wider">我的书架</div>
                    <button class="sidebar-item w-full active"><i class="fa-solid fa-clock-rotate-left"></i><span>最近阅读</span></button>
                    <button class="sidebar-item w-full"><i class="fa-solid fa-star"></i><span>收藏夹</span></button>
                    <button class="sidebar-item w-full"><i class="fa-solid fa-layer-group"></i><span>参考资料库</span></button>
                    <button class="sidebar-item w-full"><i class="fa-solid fa-tags"></i><span>标签管理</span></button>
                    
                    <div class="px-4 py-2 mt-4 text-[10px] font-bold text-dim uppercase tracking-wider">辅助工具</div>
                    <button class="sidebar-item w-full" onclick="App.nav('typeset')"><i class="fa-solid fa-text-height"></i><span>智能排版</span></button>
                    <button class="sidebar-item w-full" onclick="App.nav('md_render')"><i class="fa-brands fa-markdown"></i><span>MD 渲染器</span></button>
                </div>
                
                <!-- Stats -->
                <div class="p-4 border-t border-white/5 grid grid-cols-2 gap-2">
                    <div class="bg-white/5 rounded p-2 text-center border border-white/5">
                        <div class="text-lg font-bold text-white">12</div>
                        <div class="text-[9px] text-dim">已读完</div>
                    </div>
                    <div class="bg-white/5 rounded p-2 text-center border border-white/5">
                        <div class="text-lg font-bold text-white">45h</div>
                        <div class="text-[9px] text-dim">阅读时长</div>
                    </div>
                </div>
            </div>

            <!-- Center (Reader) - Hidden initially, shows Shelf -->
            <div class="flex-1 relative flex flex-col h-full overflow-hidden bg-[#09090b]" id="lib-center-view">
                <!-- Shelf View -->
                <div id="lib-shelf-view" class="absolute inset-0 z-10 flex flex-col bg-[#121212]">
                    <div class="relative z-10 p-8 flex-1 flex flex-col">
                        <div class="flex justify-between items-center mb-8">
                            <div class="flex gap-6 text-sm font-bold">
                                <button class="text-white border-b-2 border-amber-500 pb-1">全部</button>
                                <button class="text-dim hover:text-white transition-colors">未读</button>
                                <button class="text-dim hover:text-white transition-colors">进度中</button>
                            </div>
                            <div class="relative">
                                <i class="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-dim text-xs"></i>
                                <input class="bg-black/40 border border-white/10 rounded-full pl-8 pr-4 h-8 text-xs w-64 focus:border-amber-500 transition-colors text-white outline-none" placeholder="搜索书名、作者...">
                            </div>
                        </div>
                        <div class="grid grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 overflow-y-auto pb-8 scrollbar-hide p-2" id="lib-shelf"></div>
                    </div>
                </div>

                <!-- Reader View -->
                <div id="lib-reader-view" class="absolute inset-0 z-20 flex flex-col bg-[#121212] hidden">
                    <!-- Toolbar -->
                    <div class="h-14 flex justify-between items-center px-6 bg-[#1a1a1a]/95 backdrop-blur border-b border-white/5 z-30 shadow-2xl">
                        <div class="flex items-center gap-4">
                            <button class="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex center text-dim hover:text-white transition-colors" onclick="Modules.library.closeReader()">
                                <i class="fa-solid fa-arrow-left"></i>
                            </button>
                            <span id="reader-title" class="font-serif font-bold text-sm text-gray-300 truncate max-w-md">Book Title</span>
                        </div>
                        <div class="flex gap-3 text-gray-400 items-center">
                            <div class="flex items-center bg-black/30 rounded-full border border-white/5 p-1 gap-1 shadow-inner">
                                <button class="w-8 h-8 rounded-full hover:bg-white/10 flex center transition-colors" onclick="Modules.library.toggleSize(-1)"><i class="fa-solid fa-minus text-xs"></i></button>
                                <span class="text-xs font-mono w-6 text-center" id="font-size-disp">18</span>
                                <button class="w-8 h-8 rounded-full hover:bg-white/10 flex center transition-colors" onclick="Modules.library.toggleSize(1)"><i class="fa-solid fa-plus text-xs"></i></button>
                            </div>
                            <div class="flex items-center bg-black/30 rounded-full border border-white/5 p-1 gap-1 shadow-inner">
                                <button class="w-8 h-8 rounded-full hover:bg-white/10 flex center transition-colors" onclick="Modules.library.setTheme('light')" title="Light"><i class="fa-solid fa-sun text-xs"></i></button>
                                <button class="w-8 h-8 rounded-full hover:bg-white/10 flex center text-white transition-colors" onclick="Modules.library.setTheme('dark')" title="Dark"><i class="fa-solid fa-moon text-xs"></i></button>
                                <button class="w-8 h-8 rounded-full hover:bg-white/10 flex center transition-colors" onclick="Modules.library.setTheme('sepia')" title="Sepia"><i class="fa-solid fa-mug-hot text-xs"></i></button>
                            </div>
                            <button class="w-8 h-8 rounded-full hover:bg-white/10 flex center transition-colors ${Modules.library.sidebarOpen?'text-amber-500':'text-dim'}" onclick="Modules.library.toggleSidebar()">
                                <i class="fa-solid fa-wand-magic-sparkles"></i>
                            </button>
                        </div>
                    </div>
                    <!-- Content -->
                    <div class="flex-1 overflow-y-auto scroll-smooth relative" id="reader-container">
                        <div class="w-full max-w-3xl mx-auto py-16 px-12 font-serif leading-loose selection:bg-amber-500/30 transition-colors duration-500 text-[#d4d4d4] shadow-2xl min-h-full" id="reader-content"></div>
                    </div>
                </div>
            </div>

            <!-- Right Sidebar (AI Tools) - Collapsible -->
            <div class="w-[400px] bg-[#18181b] border-l border-white/5 flex flex-col z-20 transition-all duration-300 relative" id="lib-ai-sidebar">
                <!-- Tab Header -->
                <div class="flex border-b border-white/5 bg-[#202020]">
                    <button class="flex-1 py-3 text-xs font-bold text-amber-500 border-b-2 border-amber-500 hover:bg-white/5 transition-colors" onclick="Modules.library.switchTab('assistant')" id="tab-btn-assistant">AI 助手</button>
                    <button class="flex-1 py-3 text-xs font-bold text-dim hover:text-white hover:bg-white/5 transition-colors" onclick="Modules.library.switchTab('chat')" id="tab-btn-chat">网页对话</button>
                    <button class="flex-1 py-3 text-xs font-bold text-dim hover:text-white hover:bg-white/5 transition-colors" onclick="Modules.library.switchTab('custom')" id="tab-btn-custom">自定义</button>
                </div>

                <!-- Assistant Tab -->
                <div id="lib-tab-assistant" class="flex-1 flex col overflow-hidden relative">
                    <!-- IO Debug Panel -->
                    <div id="lib-io-panel" class="hidden absolute top-0 left-0 right-0 h-48 bg-[#18181b] z-20 flex col p-2 border-b border-white/10 shadow-xl">
                        <div class="flex justify-between items-center mb-1 pb-1 border-b border-white/10">
                            <span class="text-[10px] font-bold text-amber-500">IO Debug</span>
                            <i class="fa-solid fa-xmark text-dim hover:text-white cursor-pointer" onclick="document.getElementById('lib-io-panel').classList.add('hidden')"></i>
                        </div>
                        <div class="flex-1 flex gap-2 overflow-hidden">
                            <div class="flex-1 flex col gap-1">
                                <span class="text-[9px] text-dim">Input</span>
                                <textarea id="lib-io-in" class="flex-1 bg-black/30 border border-white/5 rounded p-1 text-[9px] text-gray-400 resize-none font-mono" readonly></textarea>
                            </div>
                            <div class="flex-1 flex col gap-1">
                                <span class="text-[9px] text-dim">Output</span>
                                <textarea id="lib-io-out" class="flex-1 bg-black/30 border border-white/5 rounded p-1 text-[9px] text-green-400 resize-none font-mono" readonly></textarea>
                            </div>
                        </div>
                    </div>

                    <div class="flex-1 overflow-y-auto p-4 space-y-4" id="reader-ai-log">
                        <div class="p-4 bg-gradient-to-br from-amber-900/20 to-black border border-amber-500/20 rounded-xl text-xs text-gray-300 shadow-lg">
                            <div class="flex items-center gap-2 mb-2 text-amber-500 font-bold"><i class="fa-solid fa-sparkles"></i> 智能阅读伴侣</div>
                            <p class="leading-relaxed opacity-80">我可以帮您深度解读文本、梳理人物关系、甚至模仿作者风格进行续写。请选择下方工具或直接提问。</p>
                        </div>
                    </div>
                    
                    <div class="p-4 border-t border-white/5 bg-[#151515] flex flex-col gap-3 relative">
                        <button class="absolute top-[-20px] right-4 bg-[#151515] border border-white/10 rounded-t px-2 text-[10px] text-dim hover:text-white" onclick="document.getElementById('lib-io-panel').classList.toggle('hidden')">IO 调试</button>
                        <div class="grid grid-cols-2 gap-2" id="lib-default-tools">
                            <button class="btn btn-sm bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 justify-start relative group" onclick="Modules.library.analyze('summary')">
                                <i class="fa-solid fa-file-lines text-blue-400 mr-2"></i> 智能摘要
                                <i class="fa-solid fa-gear absolute right-2 opacity-0 group-hover:opacity-100 text-dim hover:text-white" onclick="event.stopPropagation(); Modules.short.openPromptModal('read_summary')"></i>
                            </button>
                            <button class="btn btn-sm bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 justify-start relative group" onclick="Modules.library.analyze('char')">
                                <i class="fa-solid fa-users text-green-400 mr-2"></i> 人物关系
                                <i class="fa-solid fa-gear absolute right-2 opacity-0 group-hover:opacity-100 text-dim hover:text-white" onclick="event.stopPropagation(); Modules.short.openPromptModal('read_char')"></i>
                            </button>
                            <button class="btn btn-sm bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 justify-start relative group" onclick="Modules.library.analyze('plot')">
                                <i class="fa-solid fa-timeline text-purple-400 mr-2"></i> 情节脉络
                                <i class="fa-solid fa-gear absolute right-2 opacity-0 group-hover:opacity-100 text-dim hover:text-white" onclick="event.stopPropagation(); Modules.short.openPromptModal('read_plot')"></i>
                            </button>
                            <button class="btn btn-sm bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 justify-start relative group" onclick="Modules.library.analyze('deep')">
                                <i class="fa-solid fa-brain text-red-400 mr-2"></i> 深度解读
                                <i class="fa-solid fa-gear absolute right-2 opacity-0 group-hover:opacity-100 text-dim hover:text-white" onclick="event.stopPropagation(); Modules.short.openPromptModal('read_deep')"></i>
                            </button>
                            <button class="btn btn-sm bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 justify-start relative group" onclick="Modules.library.analyze('imitate')">
                                <i class="fa-solid fa-feather-pointed text-pink-400 mr-2"></i> 全能仿写
                                <i class="fa-solid fa-gear absolute right-2 opacity-0 group-hover:opacity-100 text-dim hover:text-white" onclick="event.stopPropagation(); Modules.short.openPromptModal('read_imitate')"></i>
                            </button>
                            <button class="btn btn-sm bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 justify-start relative group" onclick="Modules.library.analyze('logic')">
                                <i class="fa-solid fa-check-double text-cyan-400 mr-2"></i> 逻辑纠错
                                <i class="fa-solid fa-gear absolute right-2 opacity-0 group-hover:opacity-100 text-dim hover:text-white" onclick="event.stopPropagation(); Modules.short.openPromptModal('read_logic')"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Web Chat Tab -->
                <div id="lib-tab-chat" class="hidden flex-1 flex col overflow-hidden bg-[#121212]">
                    <div class="flex-1 overflow-y-auto p-4 space-y-4" id="lib-web-chat-log">
                        <div class="flex center h-full text-dim flex-col gap-4 opacity-30">
                            <i class="fa-solid fa-comments text-5xl"></i>
                            <span class="text-sm">与当前书籍进行自由对话</span>
                        </div>
                    </div>
                    
                    <!-- IO Debug Panel (Overlay) -->
                    <div id="lib-chat-io" class="hidden absolute bottom-32 left-0 right-0 h-48 bg-black/95 border-t border-white/10 p-2 z-30 flex gap-2 font-mono text-[10px]">
                        <div class="flex-1 flex col">
                            <div class="text-accent mb-1">Input Prompt</div>
                            <textarea id="lib-chat-io-in" class="flex-1 bg-white/5 border border-white/5 rounded text-dim resize-none p-1"></textarea>
                        </div>
                        <div class="flex-1 flex col">
                            <div class="text-green-400 mb-1">Raw Output</div>
                            <textarea id="lib-chat-io-out" class="flex-1 bg-white/5 border border-white/5 rounded text-dim resize-none p-1"></textarea>
                        </div>
                    </div>

                    <div class="p-4 bg-[#1a1a1a] border-t border-white/5 relative">
                        <div class="flex justify-between items-center mb-2">
                            <div class="flex gap-2">
                                <button class="btn btn-xs bg-white/5 hover:bg-white/10 text-dim" onclick="document.getElementById('chat-upload').click()"><i class="fa-solid fa-paperclip"></i> 上传</button>
                                <input type="file" id="chat-upload" class="hidden" onchange="UI.toast('文件已添加到上下文')">
                            </div>
                            <button class="btn btn-xs bg-white/5 hover:bg-white/10 text-dim ${document.getElementById('lib-chat-io')?.classList.contains('hidden')?'':'text-accent'}" onclick="document.getElementById('lib-chat-io').classList.toggle('hidden')">IO 调试</button>
                        </div>
                        <div class="relative">
                            <textarea id="lib-chat-in" class="w-full bg-black/30 border border-white/10 rounded-xl p-3 pr-10 text-xs resize-none h-24 focus:border-amber-500/50 focus:bg-black/50 transition-all placeholder-white/20 leading-relaxed" placeholder="输入问题或指令..."></textarea>
                            <button class="absolute bottom-3 right-3 btn-icon w-8 h-8 bg-amber-600 hover:bg-amber-500 text-black rounded-lg flex center shadow-lg transition-transform hover:scale-105" onclick="Modules.library.sendChat()"><i class="fa-solid fa-paper-plane"></i></button>
                        </div>
                    </div>
                </div>

                <!-- Custom Tools Tab -->
                <div id="lib-tab-custom" class="hidden flex-1 flex col overflow-hidden bg-[#121212]">
                    <div class="p-4 border-b border-white/5 flex justify-between items-center">
                        <span class="text-xs font-bold text-dim uppercase tracking-wider">已安装工具</span>
                        <button class="btn btn-xs bg-white/5 hover:bg-white/10 text-white" onclick="Modules.library.openCustomToolModal()"><i class="fa-solid fa-plus mr-1"></i> 新建</button>
                    </div>
                    <div class="flex-1 overflow-y-auto p-4 space-y-2" id="lib-custom-list">
                        <!-- Custom tools injected here -->
                    </div>
                    <div class="p-4 border-t border-white/5 text-center">
                        <button class="btn btn-sm w-full bg-white/5 hover:bg-white/10 text-dim" onclick="App.nav('tools_mgr')">前往工具管理中心 <i class="fa-solid fa-arrow-right ml-1"></i></button>
                    </div>
                </div>
            </div>
            
            <!-- Custom Tool Modal -->
            <div id="lib-tool-modal" class="hidden fixed inset-0 bg-black/80 z-[110] flex center backdrop-blur-sm">
                <div class="bg-[#18181b] w-[400px] rounded-xl border border-white/10 flex col shadow-2xl p-6 gap-4">
                    <h3 class="font-bold text-white">添加自定义工具</h3>
                    <input id="lib-tool-name" class="input bg-black/50 border-white/10" placeholder="工具名称 (如: 情感分析)">
                    <input id="lib-tool-icon" class="input bg-black/50 border-white/10" placeholder="图标 (如: fa-heart)">
                    <textarea id="lib-tool-prompt" class="textarea h-32 bg-black/50 border-white/10" placeholder="Prompt: 分析选段中的情感..."></textarea>
                    <div class="flex justify-end gap-2">
                        <button class="btn" onclick="document.getElementById('lib-tool-modal').classList.add('hidden')">取消</button>
                        <button class="btn btn-primary" onclick="Modules.library.saveCustomTool()">保存</button>
                    </div>
                </div>
            </div>
        </div>
    `,
    currentSize: 18,
    currentTheme: 'dark',
    sidebarOpen: true,
    customTools: [],
    
    init: async () => {
        // Load books
        const books = await DB.getAll('library_books');
        
        // Load custom tools from GLOBAL tool registry
        try {
            const tools = await DB.getAll('tools_custom');
            Modules.library.customTools = tools;
        } catch(e) { console.error(e); }

        // Render Shelf
        const shelf = document.getElementById('lib-shelf');
        if (shelf) {
            const colors = ['from-amber-700 to-orange-900', 'from-blue-700 to-indigo-900', 'from-emerald-700 to-green-900', 'from-purple-700 to-pink-900', 'from-red-700 to-rose-900'];
            
            shelf.innerHTML = books.map((b, i) => {
                const colorClass = colors[i % colors.length];
                const preview = b.content ? b.content.slice(0, 30) + '...' : '暂无内容';
                return `
                <div class="group cursor-pointer relative perspective-1000" onclick="Modules.library.read('${b.id}')">
                    <div class="aspect-[2/3] rounded-r-lg rounded-l-sm bg-gradient-to-br ${colorClass} shadow-2xl group-hover:-translate-y-4 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] transition-all duration-300 flex flex-col relative overflow-hidden border-l-2 border-white/10 transform-style-3d">
                        <div class="absolute left-0 top-0 bottom-0 w-1 bg-white/20 z-20"></div>
                        <div class="absolute left-1 top-0 bottom-0 w-px bg-black/20 z-20"></div>
                        <div class="flex-1 flex flex-col p-4 relative z-10">
                            <i class="fa-solid fa-book-open text-2xl text-white/20 mb-2"></i>
                            <div class="text-xs font-bold text-white/90 leading-tight line-clamp-2 mb-2" style="text-shadow: 0 1px 2px rgba(0,0,0,0.5)">${b.name}</div>
                            <div class="text-[10px] text-white/60 leading-relaxed font-serif break-words line-clamp-4 overflow-hidden">${preview}</div>
                        </div>
                        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent)] pointer-events-none"></div>
                        <div class="p-2 bg-black/40 backdrop-blur-sm flex justify-between items-center mt-auto">
                            <span class="text-[9px] text-white/60 uppercase tracking-wider">${(b.size/1024).toFixed(1)} KB</span>
                        </div>
                        <button class="absolute top-2 right-2 w-7 h-7 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all flex center text-xs z-30 hover:scale-110 hover:bg-red-500 backdrop-blur shadow-lg" onclick="Modules.library.delBook('${b.id}', event)">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                    <div class="h-4 w-[90%] mx-auto bg-gradient-to-b from-white/5 to-transparent blur-md mt-2 opacity-0 group-hover:opacity-30 transition-opacity transform scale-y-[-1]"></div>
                </div>
            `}).join('');
            
            if (books.length === 0) {
                shelf.innerHTML = `
                    <div class="col-span-full flex flex-col items-center justify-center text-dim h-64 border-2 border-dashed border-white/5 rounded-xl">
                        <i class="fa-solid fa-book text-4xl mb-4 opacity-20"></i>
                        <p>书架空空如也</p>
                        <button class="btn mt-4 bg-white/5 hover:bg-white/10" onclick="document.getElementById('lib-upload').click()">导入第一本书</button>
                    </div>
                `;
            }
        }
        
        Modules.library.renderCustomTools();
    },

    read: async (id) => {
        const b = await DB.get('library_books', id);
        Modules.library.currentBook = b;
        
        document.getElementById('lib-shelf-view').classList.add('hidden');
        document.getElementById('lib-reader-view').classList.remove('hidden');
        document.getElementById('reader-title').innerText = b.name;
        
        // Simple text formatting
        const formatted = b.content.split('\n').filter(line => line.trim() !== '')
            .map(line => `<p style="margin-bottom: 1.5em; text-indent: 2em;">${line}</p>`)
            .join('');
            
        document.getElementById('reader-content').innerHTML = formatted;
        Modules.library.setTheme(Modules.library.currentTheme);
        Modules.library.toggleSize(0); // Apply size
    },

    closeReader: () => {
        document.getElementById('lib-reader-view').classList.add('hidden');
        document.getElementById('lib-shelf-view').classList.remove('hidden');
        Modules.library.currentBook = null;
    },

    handleUpload: async (input) => {
        const file = input.files[0];
        if(!file) return;
        UI.toast('正在解析书籍...');
        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target.result;
            const id = Utils.uuid();
            await DB.put('library_books', {
                id, name: file.name, type: file.name.split('.').pop(),
                content: content, size: file.size, date: new Date().toLocaleDateString()
            });
            Modules.library.init();
            UI.toast('书籍导入完成');
        };
        reader.readAsText(file, 'utf-8');
    },

    delBook: async (id, e) => {
        e.stopPropagation();
        if(confirm('确定删除这本书吗？')) {
            await DB.del('library_books', id);
            Modules.library.init();
        }
    },

    setTheme: (theme) => {
        Modules.library.currentTheme = theme;
        const container = document.getElementById('lib-reader-view');
        const content = document.getElementById('reader-content');
        const toolbar = document.getElementById('reader-toolbar'); // Check ID in new HTML
        
        if(theme === 'light') {
            container.style.backgroundColor = '#fdfbf7';
            content.style.color = '#333';
        } else if(theme === 'sepia') {
            container.style.backgroundColor = '#f4ecd8';
            content.style.color = '#5b4636';
        } else {
            container.style.backgroundColor = '#121212';
            content.style.color = '#d4d4d4';
        }
    },

    toggleSize: (d) => {
        Modules.library.currentSize += d;
        document.getElementById('reader-content').style.fontSize = Modules.library.currentSize + 'px';
        document.getElementById('font-size-disp').innerText = Modules.library.currentSize;
    },

    toggleSidebar: () => {
        Modules.library.sidebarOpen = !Modules.library.sidebarOpen;
        const sidebar = document.getElementById('lib-ai-sidebar');
        if(Modules.library.sidebarOpen) {
            sidebar.style.width = '400px';
            sidebar.style.opacity = '1';
        } else {
            sidebar.style.width = '0px';
            sidebar.style.opacity = '0';
        }
    },

    switchTab: (t) => {
        ['assistant', 'chat', 'custom'].forEach(x => {
            const tab = document.getElementById('lib-tab-'+x);
            if(tab) tab.classList.add('hidden');
            const btn = document.getElementById('tab-btn-'+x);
            if(btn) {
                btn.classList.remove('text-amber-500', 'border-b-2', 'border-amber-500');
                btn.classList.add('text-dim');
            }
        });
        const targetTab = document.getElementById('lib-tab-'+t);
        if(targetTab) targetTab.classList.remove('hidden');
        
        const activeBtn = document.getElementById('tab-btn-'+t);
        if(activeBtn) {
            activeBtn.classList.remove('text-dim');
            activeBtn.classList.add('text-amber-500', 'border-b-2', 'border-amber-500');
        }
    },

    openCustomToolModal: () => {
        document.getElementById('lib-tool-name').value = '';
        document.getElementById('lib-tool-icon').value = '';
        document.getElementById('lib-tool-prompt').value = '';
        document.getElementById('lib-tool-modal').classList.remove('hidden');
    },

    saveCustomTool: async () => {
        const name = document.getElementById('lib-tool-name').value;
        const icon = document.getElementById('lib-tool-icon').value || 'fa-solid fa-bolt';
        const prompt = document.getElementById('lib-tool-prompt').value;
        
        if(!name || !prompt) return UI.toast('请填写完整信息');
        
        const tool = { id: Utils.uuid(), name, icon, prompt };
        
        // Save to GLOBAL tools_custom store so it appears everywhere
        await DB.put('tools_custom', tool);
        
        // Reload tools
        const tools = await DB.getAll('tools_custom');
        Modules.library.customTools = tools;
        
        document.getElementById('lib-tool-modal').classList.add('hidden');
        Modules.library.renderCustomTools();
        UI.toast('工具已添加');
    },

    renderCustomTools: () => {
        const list = document.getElementById('lib-custom-list');
        if(!list) return;
        
        if (Modules.library.customTools.length === 0) {
            list.innerHTML = '<div class="text-dim text-xs text-center py-4">暂无自定义工具</div>';
            return;
        }

        list.innerHTML = Modules.library.customTools.map(t => `
            <div class="p-3 bg-white/5 border border-white/5 rounded-lg flex items-center justify-between group hover:border-amber-500/30 transition-all cursor-pointer" onclick="Modules.library.runCustomTool('${t.id}')">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded bg-white/5 flex center text-dim group-hover:text-amber-500 transition-colors">
                        <i class="${t.icon}"></i>
                    </div>
                    <div>
                        <div class="text-sm font-bold text-gray-300 group-hover:text-white">${t.name}</div>
                        <div class="text-[10px] text-dim">Custom Agent</div>
                    </div>
                </div>
                <button class="btn-icon w-6 h-6 opacity-0 group-hover:opacity-100 text-dim hover:text-white" onclick="event.stopPropagation(); Modules.library.runCustomTool('${t.id}')">
                    <i class="fa-solid fa-play"></i>
                </button>
            </div>
        `).join('');
    },

    runCustomTool: async (toolIdOrObj) => {
        let tool = toolIdOrObj;
        if (typeof toolIdOrObj === 'string') {
            tool = Modules.library.customTools.find(t => t.id === toolIdOrObj);
        }
        if (!tool) return;

        // Switch to assistant tab to show result
        Modules.library.switchTab('assistant');

        const selection = window.getSelection().toString();
        const content = selection || document.getElementById('reader-content').innerText.slice(0, 3000);
        const log = document.getElementById('reader-ai-log');
        
        const loadId = 'ai-load-' + Date.now();
        log.innerHTML += `
            <div id="${loadId}" class="p-3 bg-amber-900/20 border border-amber-500/20 rounded-lg text-xs mb-3 animate-pulse flex items-center gap-2">
                <i class="fa-solid fa-circle-notch fa-spin text-amber-500"></i>
                <span class="text-amber-200">正在运行 ${tool.name}...</span>
            </div>
        `;
        log.scrollTop = log.scrollHeight;
        
        const prompt = tool.prompt.replace('{{input}}', content) + "\n\n[Content]\n" + content;
        
        document.getElementById('lib-io-in').value = prompt;
        document.getElementById('lib-io-out').value = "Generating...";
        
        let responseText = '';
        const resId = 'ai-res-' + Date.now();
        
        await AI.generate(prompt, {}, c => {
            const loader = document.getElementById(loadId);
            if(loader) loader.remove();
            
            let resBox = document.getElementById(resId);
            if(!resBox) {
                resBox = document.createElement('div');
                resBox.id = resId;
                resBox.className = "p-4 bg-[#252525] border border-white/5 rounded-lg text-sm text-gray-300 leading-relaxed mb-4 shadow-lg animate-fade-in";
                resBox.innerHTML = `<div class="text-[10px] font-bold text-amber-500 mb-2 uppercase tracking-wider border-b border-white/5 pb-1 flex justify-between"><span>${tool.name}</span> <i class="fa-solid fa-robot"></i></div><div class="content"></div>`;
                log.appendChild(resBox);
            }
            
            responseText += c;
            resBox.querySelector('.content').innerHTML = marked.parse(responseText);
            document.getElementById('lib-io-out').value = responseText;
            log.scrollTop = log.scrollHeight;
        });
    },

    analyze: async (type) => {
        // ... (Same logic as runCustomTool but with predefined prompts)
        // Re-using logic to keep it DRY-ish
        const labels = {
            summary: '智能摘要', char: '人物分析', plot: '情节脉络', deep: '深度解读',
            imitate: '全能仿写', fusion: '风格融合', logic: '逻辑纠错'
        };
        
        const promptKey = `read_${type}`;
        
        // Ensure prompt exists (Mocking check)
        if(!(await DB.get('prompts', promptKey))) {
             const map = {
                read_summary: "请总结以下文本的核心内容：{{input}}",
                read_char: "请分析以下文本中的人物性格与关系：{{input}}",
                read_plot: "请梳理以下文本的情节脉络：{{input}}",
                read_deep: "请深度解读以下文本的隐喻与主旨：{{input}}",
                read_imitate: "请模仿以下文本的风格，写一段新的内容：{{input}}",
                read_fusion: "请分析以下文本的风格，并将其与赛博朋克风格融合：{{input}}",
                read_logic: "请检查以下文本的逻辑漏洞：{{input}}"
            };
            if(map[promptKey]) await DB.put('prompts', {id: promptKey, name: promptKey, content: map[promptKey]});
        }
        
        const pseudoTool = {
            name: labels[type] || 'AI 分析',
            prompt: await Modules.short.getPrompt(promptKey)
        };
        
        await Modules.library.runCustomTool(pseudoTool);
    },

    sendChat: async () => {
        const txt = document.getElementById('lib-chat-in').value;
        if(!txt) return;
        
        const log = document.getElementById('lib-web-chat-log');
        if(log.querySelector('.opacity-30')) log.innerHTML = '';
        
        log.innerHTML += `<div class="flex justify-end mb-4 animate-fade-in"><div class="bg-amber-600/20 border border-amber-600/50 text-amber-100 p-3 rounded-lg text-xs max-w-[80%]">${txt}</div></div>`;
        document.getElementById('lib-chat-in').value = '';
        log.scrollTop = log.scrollHeight;
        
        // IO Debug Update
        const ioIn = document.getElementById('lib-chat-io-in');
        const ioOut = document.getElementById('lib-chat-io-out');
        
        const context = document.getElementById('reader-content')?.innerText.slice(0, 3000) || "No book content loaded.";
        const prompt = `[Context: Current Book Content]\n${context}\n\n[User Question]\n${txt}\n\n[Task]\nAnswer based on the book content.`;
        
        if(ioIn) ioIn.value = prompt;
        if(ioOut) ioOut.value = "Generating...";
        
        const resId = 'chat-res-' + Date.now();
        log.innerHTML += `<div class="flex justify-start mb-4 animate-fade-in"><div id="${resId}" class="bg-[#252525] border border-white/5 text-gray-300 p-3 rounded-lg text-xs max-w-[80%] shadow-md"></div></div>`;
        
        let reply = '';
        await AI.generate(prompt, {}, c => {
            reply += c;
            document.getElementById(resId).innerHTML = marked.parse(reply);
            if(ioOut) ioOut.value = reply;
            log.scrollTop = log.scrollHeight;
        });
    }
};

// 8. TOOLBOX: LOGIC CORRECTION
Modules.toolbox_logic = {
    render: () => `
        <div class="layout-golden">
            <!-- 30% Controls (Left) -->
            <div class="col-nav p-6 gap-6">
                <div class="flex items-center gap-4 mb-2">
                    <h2 class="text-2xl font-bold text-main"><i class="fa-solid fa-check-double mr-2 text-cyan-400"></i> 逻辑纠错</h2>
                </div>
                <div class="card bg-black/20 p-4 border border-white/5">
                    <div class="flex justify-between items-start mb-2">
                        <p class="text-sm text-dim leading-relaxed">
                            AI 将深度分析文本中的逻辑漏洞、时间线冲突以及设定前后矛盾之处。
                        </p>
                        <button class="btn btn-xs bg-white/5 hover:bg-white/10 text-dim" onclick="Modules.short.openPromptModal('logic')" title="配置提示词"><i class="fa-solid fa-gear"></i></button>
                    </div>
                </div>
                <div class="flex-1 flex col gap-2">
                    <span class="text-xs font-bold text-dim uppercase tracking-wider">待检测文本</span>
                    <textarea id="tl-in" class="flex-1 bg-black/40 border border-white/10 rounded-lg p-3 resize-none leading-relaxed text-gray-300 focus:border-cyan-500 transition-colors" placeholder="在此粘贴情节或设定文本..."></textarea>
                </div>
                <div class="flex gap-2">
                    <button class="btn btn-primary flex-1 bg-cyan-600 border-none text-white hover:bg-cyan-500 shadow-lg shadow-cyan-500/20 font-bold py-3" onclick="Modules.toolbox_logic.run()">
                        <i class="fa-solid fa-bug-slash mr-2"></i> 开始诊断
                    </button>
                    <button class="btn flex-1 bg-white/10 hover:bg-white/20 text-white border-white/10 py-3" onclick="Modules.toolbox_logic.continueRun()">
                        <i class="fa-solid fa-play mr-2"></i> 继续分析
                    </button>
                </div>
            </div>

            <!-- 70% Output (Right) -->
            <div class="col-content bg-black/20 p-8">
                <div class="card w-full h-full bg-black/40 backdrop-blur border-cyan-500/20 p-0 flex flex-col overflow-hidden shadow-2xl">
                    <div class="p-4 bg-cyan-500/10 border-b border-cyan-500/20 flex justify-between items-center">
                        <span class="font-bold text-cyan-400">分析报告</span>
                        <div class="flex gap-2 items-center">
                            <button class="btn btn-xs bg-cyan-900/30 text-cyan-400 hover:bg-cyan-900/50 border border-cyan-500/30" onclick="document.getElementById('tl-io').classList.toggle('hidden')"><i class="fa-solid fa-terminal mr-1"></i> IO调试</button>
                            <div class="text-xs text-cyan-300/50 font-mono">STATUS: READY</div>
                        </div>
                    </div>
                    <div class="relative flex-1 overflow-hidden">
                        <div class="absolute inset-0 bg-cyan-500/5 pointer-events-none"></div>
                        <textarea id="tl-out" class="w-full h-full bg-transparent border-none p-6 resize-none font-mono text-sm text-cyan-100 focus:outline-none leading-loose" readonly placeholder="分析结果将在检测后生成..."></textarea>
                        
                        <div id="tl-io" class="hidden absolute inset-0 bg-black/95 p-4 text-xs font-mono overflow-auto z-20">
                            <div class="text-accent mb-2 font-bold border-b border-white/10 pb-1">Input Prompt</div>
                            <div id="tl-io-in" class="text-dim mb-4 whitespace-pre-wrap"></div>
                            <div class="text-green-400 mb-2 font-bold border-b border-white/10 pb-1">Raw Output</div>
                            <div id="tl-io-out" class="text-dim whitespace-pre-wrap"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    updateIO: (input, output) => {
        document.getElementById('tl-io-in').innerText = input;
        document.getElementById('tl-io-out').innerText = output;
    },
    run: async () => {
        const txt = document.getElementById('tl-in').value;
        let promptTpl = await Modules.short.getPrompt('logic');
        let prompt = promptTpl.replace('{{input}}', txt);
        
        document.getElementById('tl-out').value = "正在扫描逻辑漏洞...";
        Modules.toolbox_logic.updateIO(prompt, 'Scanning...');
        
        let fullRes = "";
        await AI.generate(prompt, {}, c => {
            fullRes += c;
            document.getElementById('tl-out').value = fullRes;
            Modules.toolbox_logic.updateIO(prompt, fullRes);
        });
    },
    continueRun: async () => {
        const current = document.getElementById('tl-out').value;
        if (!current) return UI.toast("请先生成内容");
        
        const prompt = `[Context]\n${current.slice(-1000)}\n\n[Task]\nContinue the logic analysis. Dig deeper into potential issues.`;
        Modules.toolbox_logic.updateIO(prompt, 'Scanning...');
        UI.toast("正在深入分析...");
        
        let fullRes = current;
        await AI.generate(prompt, {}, c => {
            fullRes += c;
            const el = document.getElementById('tl-out');
            el.value = fullRes;
            el.scrollTop = el.scrollHeight;
            Modules.toolbox_logic.updateIO(prompt, fullRes);
        });
    }
};

// 9. TOOLBOX: CUSTOM (Workflow Edition)
Modules.toolbox_custom = {
    nodes: [],
    connections: [],
    draggedNode: null,
    dragOffset: {x:0, y:0},
    connectingNode: null,
    batchMode: false,
    availableModels: [],
    
    render: () => `
        <div class="layout-golden bg-[#09090b] text-gray-200 font-sans overflow-hidden">
            <!-- Sidebar (Nodes) -->
            <div class="col-nav w-64 bg-[#18181b] border-r border-white/5 flex col z-20">
                <div class="p-4 border-b border-white/5 flex justify-between items-center">
                    <span class="font-bold text-lg text-white flex items-center gap-2"><i class="fa-solid fa-toolbox text-indigo-500"></i> 自定义工具箱</span>
                    <button class="btn btn-icon w-8 h-8 hover:bg-white/5 text-dim rounded-full" onclick="Modules.toolbox_custom.clearCanvas()"><i class="fa-solid fa-trash-can"></i></button>
                </div>
                
                <div class="flex-1 overflow-y-auto p-4 space-y-4">
                    <div class="text-xs font-bold text-dim uppercase tracking-wider">基础节点</div>
                    <div class="grid grid-cols-2 gap-2">
                        <div class="p-3 bg-white/5 rounded border border-white/5 cursor-grab hover:bg-white/10 flex col center gap-2" draggable="true" ondragstart="Modules.toolbox_custom.dragStart(event, 'input')">
                            <i class="fa-solid fa-keyboard text-green-400"></i>
                            <span class="text-xs">输入</span>
                        </div>
                        <div class="p-3 bg-white/5 rounded border border-white/5 cursor-grab hover:bg-white/10 flex col center gap-2" draggable="true" ondragstart="Modules.toolbox_custom.dragStart(event, 'output')">
                            <i class="fa-solid fa-print text-red-400"></i>
                            <span class="text-xs">输出</span>
                        </div>
                    </div>

                    <div class="text-xs font-bold text-dim uppercase tracking-wider">AI 组件库</div>
                    <div class="grid grid-cols-2 gap-2">
                        <div class="p-3 bg-white/5 rounded border border-white/5 cursor-grab hover:bg-white/10 flex items-center gap-2" draggable="true" ondragstart="Modules.toolbox_custom.dragStart(event, 'llm')">
                            <i class="fa-solid fa-brain text-indigo-400"></i> <span class="text-xs">LLM</span>
                        </div>
                        <div class="p-3 bg-white/5 rounded border border-white/5 cursor-grab hover:bg-white/10 flex items-center gap-2" draggable="true" ondragstart="Modules.toolbox_custom.dragStart(event, 'enhancer')">
                            <i class="fa-solid fa-rocket text-purple-500"></i> <span class="text-xs">强化器</span>
                        </div>
                        <div class="p-3 bg-white/5 rounded border border-white/5 cursor-grab hover:bg-white/10 flex items-center gap-2" draggable="true" ondragstart="Modules.toolbox_custom.dragStart(event, 'polish')">
                            <i class="fa-solid fa-wand-magic-sparkles text-pink-400"></i> <span class="text-xs">润色</span>
                        </div>
                        <div class="p-3 bg-white/5 rounded border border-white/5 cursor-grab hover:bg-white/10 flex items-center gap-2" draggable="true" ondragstart="Modules.toolbox_custom.dragStart(event, 'translate')">
                            <i class="fa-solid fa-language text-blue-400"></i> <span class="text-xs">翻译</span>
                        </div>
                        <div class="p-3 bg-white/5 rounded border border-white/5 cursor-grab hover:bg-white/10 flex items-center gap-2" draggable="true" ondragstart="Modules.toolbox_custom.dragStart(event, 'summary')">
                            <i class="fa-solid fa-compress text-yellow-400"></i> <span class="text-xs">摘要</span>
                        </div>
                        <div class="p-3 bg-white/5 rounded border border-white/5 cursor-grab hover:bg-white/10 flex items-center gap-2" draggable="true" ondragstart="Modules.toolbox_custom.dragStart(event, 'expand')">
                            <i class="fa-solid fa-expand text-green-400"></i> <span class="text-xs">扩写</span>
                        </div>
                    </div>
                    
                    <div class="text-xs font-bold text-dim uppercase tracking-wider">逻辑组件</div>
                    <div class="grid grid-cols-2 gap-2">
                        <div class="p-3 bg-white/5 rounded border border-white/5 cursor-grab hover:bg-white/10 flex items-center gap-2" draggable="true" ondragstart="Modules.toolbox_custom.dragStart(event, 'merger')">
                            <i class="fa-solid fa-code-merge text-orange-400"></i> <span class="text-xs">融合器</span>
                        </div>
                        <div class="p-3 bg-white/5 rounded border border-white/5 cursor-grab hover:bg-white/10 flex items-center gap-2" draggable="true" ondragstart="Modules.toolbox_custom.dragStart(event, 'splitter')">
                            <i class="fa-solid fa-code-branch text-cyan-400"></i> <span class="text-xs">分流器</span>
                        </div>
                    </div>

                    <div class="text-xs font-bold text-dim uppercase tracking-wider">已有工具</div>
                    <div id="tc-saved-tools" class="space-y-2">
                        <!-- Injected -->
                    </div>
                </div>
                
                <div class="p-4 border-t border-white/5 flex col gap-2">
                    <button class="btn btn-primary w-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg" onclick="Modules.toolbox_custom.runWorkflow()">
                        <i class="fa-solid fa-play mr-2"></i> 运行工作流
                    </button>
                    <button class="btn w-full bg-white/5 hover:bg-white/10 text-white border border-white/5" onclick="Modules.toolbox_custom.toggleBatchMode()">
                        <i class="fa-solid fa-layer-group mr-2"></i> 批量模式
                    </button>
                    <button class="btn w-full bg-white/5 hover:bg-white/10 text-white border border-white/5" onclick="document.getElementById('tc-global-io').classList.toggle('hidden')">
                        <i class="fa-solid fa-terminal mr-2"></i> IO 监控
                    </button>
                </div>
            </div>

            <!-- Canvas -->
            <div class="col-content relative bg-[#111] overflow-hidden" id="tc-canvas-container" ondrop="Modules.toolbox_custom.drop(event)" ondragover="event.preventDefault()" onmousemove="Modules.toolbox_custom.mouseMove(event)" onmouseup="Modules.toolbox_custom.mouseUp(event)">
                <!-- Grid Bg -->
                <div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(#444 1px, transparent 1px); background-size: 20px 20px;"></div>
                
                <!-- SVG Connections -->
                <svg id="tc-connections" class="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
                    <!-- Lines -->
                </svg>
                
                <!-- Nodes Container -->
                <div id="tc-nodes" class="absolute inset-0 z-10 pointer-events-none">
                    <!-- Nodes injected here -->
                </div>
                
                <!-- Global IO Debug Monitor -->
                <div id="tc-global-io" class="hidden absolute bottom-0 left-0 right-0 h-48 bg-[#1e1f20] border-t border-white/10 z-40 flex flex-col shadow-2xl animate-fade-in">
                    <div class="h-8 bg-[#252526] flex items-center justify-between px-2 border-b border-white/5">
                        <span class="text-xs font-bold text-indigo-400 uppercase tracking-wider"><i class="fa-solid fa-network-wired mr-2"></i>全局 IO 监控 (Global IO Monitor)</span>
                        <div class="flex gap-2">
                            <button class="text-dim hover:text-white" onclick="document.getElementById('tc-io-log').innerHTML=''"><i class="fa-solid fa-ban"></i></button>
                            <button class="text-dim hover:text-white" onclick="document.getElementById('tc-global-io').classList.add('hidden')"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                    </div>
                    <div class="flex-1 overflow-y-auto p-2 font-mono text-[10px] space-y-1 bg-black/50" id="tc-io-log">
                        <div class="text-dim">Waiting for execution...</div>
                    </div>
                </div>

                <!-- Batch Mode Overlay -->
                <div id="tc-batch-panel" class="hidden absolute inset-0 bg-black/90 z-50 flex center animate-fade-in">
                    <div class="w-2/3 h-3/4 bg-[#1e1f20] border border-white/10 rounded-xl flex col shadow-2xl">
                        <div class="p-4 border-b border-white/10 flex justify-between items-center">
                            <span class="font-bold text-white"><i class="fa-solid fa-layer-group text-indigo-500 mr-2"></i>批量工作流执行</span>
                            <button class="btn btn-icon hover:text-white" onclick="Modules.toolbox_custom.toggleBatchMode()"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                        <div class="flex-1 p-6 flex gap-6">
                            <div class="flex-1 flex col gap-2">
                                <span class="text-xs font-bold text-dim">输入列表 (每行一个)</span>
                                <textarea id="tc-batch-input" class="textarea flex-1 bg-black/30 border-white/10 resize-none font-mono text-xs" placeholder="输入1&#10;输入2&#10;输入3..."></textarea>
                            </div>
                            <div class="flex center">
                                <i class="fa-solid fa-arrow-right text-dim text-2xl"></i>
                            </div>
                            <div class="flex-1 flex col gap-2">
                                <span class="text-xs font-bold text-dim">执行结果</span>
                                <textarea id="tc-batch-output" class="textarea flex-1 bg-black/30 border-white/10 resize-none font-mono text-xs text-green-400" readonly placeholder="等待执行..."></textarea>
                            </div>
                        </div>
                        <div class="p-4 border-t border-white/10 flex justify-end">
                            <button class="btn btn-primary bg-indigo-600 hover:bg-indigo-500 text-white" onclick="Modules.toolbox_custom.runBatch()">开始批量处理</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Context Menu (Hidden) -->
            <div id="tc-context-menu" class="hidden absolute bg-[#222] border border-white/10 rounded shadow-xl p-2 z-50">
                <button class="btn btn-sm w-full justify-start hover:bg-white/10 text-red-400" onclick="Modules.toolbox_custom.deleteSelectedNode()">删除节点</button>
            </div>
        </div>
    `,
    
    toggleBatchMode: () => {
        const p = document.getElementById('tc-batch-panel');
        if(p) p.classList.toggle('hidden');
    },
    
    runBatch: async () => {
        const raw = document.getElementById('tc-batch-input').value;
        if(!raw) return UI.toast('请输入批量数据');
        
        const inputs = raw.split('\n').filter(x=>x.trim());
        const outEl = document.getElementById('tc-batch-output');
        outEl.value = "开始批量处理...\n";
        
        let fullExportContent = "";

        // Find input node
        const inputNode = Modules.toolbox_custom.nodes.find(n => n.type === 'input');
        if(!inputNode) return UI.toast('画布中缺少输入节点');
        
        for(let i=0; i<inputs.length; i++) {
            const val = inputs[i];
            outEl.value += `[${i+1}/${inputs.length}] 处理: ${val.substring(0,10)}... `;
            
            // Set input node value
            inputNode.data.value = val;
            const inEl = document.getElementById(`node-in-${inputNode.id}`);
            if(inEl) inEl.value = val;
            
            await Modules.toolbox_custom.runWorkflow(true); // true = silent/batch mode
            
            // Get output(s)
            const outputNodes = Modules.toolbox_custom.nodes.filter(n => n.type === 'output');
            let res = "";
            let exportRes = "";
            if (outputNodes.length > 0) {
                // For log display
                res = outputNodes.map(n => `[${n.title}]: ${n.data.value || 'Empty'}`).join('\n');
                // For export file (just content)
                exportRes = outputNodes.map(n => n.data.value || '').join('\n\n');
            } else {
                res = 'No Output Node';
            }
            
            outEl.value += `-> 完成\n${res}\n\n`;
            outEl.scrollTop = outEl.scrollHeight;
            
            fullExportContent += exportRes + "\n\n--------------------------------------------------\n\n";
        }
        outEl.value += "批量处理全部完成。";
        
        // Auto export to TXT (Clean Content)
        const blob = new Blob([fullExportContent], {type: "text/plain;charset=utf-8"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `批量生成结果_${new Date().toISOString().slice(0,19).replace(/T|:/g,"-")}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        UI.toast('批量正文已自动导出');
    },
    
    init: async () => {
        Modules.toolbox_custom.nodes = [];
        Modules.toolbox_custom.connections = [];
        
        // Seed models if empty to ensure selector works
        let models = await DB.getAll('text_api_pool');
        if (models.length === 0) {
            models = [
                {id: 'gpt4', config_name: 'GPT-4 (Default)', provider: 'openai', model_name: 'gpt-4', is_active: 1},
                {id: 'gpt35', config_name: 'GPT-3.5 Turbo', provider: 'openai', model_name: 'gpt-3.5-turbo', is_active: 0},
                {id: 'claude3', config_name: 'Claude 3 Opus', provider: 'claude', model_name: 'claude-3-opus-20240229', is_active: 0}
            ];
            for(let m of models) await DB.put('text_api_pool', m);
        }
        Modules.toolbox_custom.availableModels = models;
        
        Modules.toolbox_custom.loadSavedTools();
        
        // Init default nodes
        Modules.toolbox_custom.addNode('input', 100, 100);
        Modules.toolbox_custom.addNode('llm', 400, 100);
        Modules.toolbox_custom.addNode('output', 700, 100);
        
        setTimeout(Modules.toolbox_custom.drawConnections, 100);
    },
    
    loadSavedTools: async () => {
        const tools = await DB.getAll('tools_custom');
        const container = document.getElementById('tc-saved-tools');
        if(container) {
            container.innerHTML = tools.map(t => `
                <div class="p-2 bg-white/5 rounded border border-white/5 cursor-grab hover:bg-white/10 flex items-center gap-2 truncate" draggable="true" ondragstart="Modules.toolbox_custom.dragStart(event, 'custom', '${t.id}')">
                    <i class="${t.icon||'fa-solid fa-cube'} text-dim"></i>
                    <span class="text-xs truncate">${t.name}</span>
                </div>
            `).join('');
        }
    },

    dragStart: (e, type, id) => {
        e.dataTransfer.setData('type', type);
        if(id) e.dataTransfer.setData('id', id);
    },

    drop: (e) => {
        e.preventDefault();
        const rect = document.getElementById('tc-canvas-container').getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const type = e.dataTransfer.getData('type');
        const id = e.dataTransfer.getData('id');
        Modules.toolbox_custom.addNode(type, x, y, id);
    },

    addNode: async (type, x, y, customId) => {
        const id = 'node_' + Date.now() + Math.random().toString(36).substr(2, 5);
        let title = type.toUpperCase();
        let inputs = [];
        let outputs = [];
        let data = {};

        if (type === 'input') {
            title = '输入 (Input)';
            outputs = ['out'];
            data = { value: '' };
        } else if (type === 'output') {
            title = '输出 (Output)';
            inputs = ['in'];
            data = { value: '等待执行...' };
        } else if (type === 'llm') {
            title = 'LLM 生成器';
            inputs = ['in'];
            outputs = ['out'];
            data = { prompt: '{{in}}', modelId: 'default' };
        } else if (type === 'enhancer') {
            title = '多维强化器';
            inputs = ['in1', 'in2', 'in3'];
            outputs = ['out1', 'out2', 'out3'];
            data = { prompt: '分别优化以下三个输入：\n1. {{in1}}\n2. {{in2}}\n3. {{in3}}', modelId: 'default' };
        } else if (type === 'merger') {
            title = '融合器';
            inputs = ['in1', 'in2'];
            outputs = ['out'];
            data = { prompt: '将以下内容融合：\n{{in1}}\n{{in2}}' };
        } else if (type === 'splitter') {
            title = '分流器';
            inputs = ['in'];
            outputs = ['out1', 'out2'];
            data = { prompt: '将内容拆分为两部分：\n{{in}}' };
        } else if (type === 'polish') {
            title = '智能润色'; inputs = ['text']; outputs = ['polished']; data = { style: '通用', modelId: 'default' };
        } else if (type === 'translate') {
            title = '智能翻译'; inputs = ['text']; outputs = ['result']; data = { lang: '中文', modelId: 'default' };
        } else if (type === 'summary') {
            title = '内容摘要'; inputs = ['text']; outputs = ['summary']; data = { modelId: 'default' };
        } else if (type === 'expand') {
            title = '内容扩写'; inputs = ['text']; outputs = ['expanded']; data = { modelId: 'default' };
        } else if (type === 'title') {
            title = '标题生成'; inputs = ['text']; outputs = ['titles']; data = { modelId: 'default' };
        } else if (type === 'custom') {
            const tool = await DB.get('tools_custom', customId);
            title = tool ? tool.name : 'Unknown Tool';
            inputs = ['in'];
            outputs = ['out'];
            data = { toolId: customId, modelId: 'default' };
        }

        const node = { id, type, x, y, title, inputs, outputs, data };
        Modules.toolbox_custom.nodes.push(node);
        Modules.toolbox_custom.renderNode(node);
    },

    renderNode: (node) => {
        const div = document.createElement('div');
        div.id = node.id;
        div.className = "absolute bg-[#1e1e20] border border-white/10 rounded-lg shadow-lg w-72 pointer-events-auto flex flex-col z-10";
        div.style.left = node.x + 'px';
        div.style.top = node.y + 'px';
        
        let contentHtml = '';
        
        // Model Selector Helper
        const renderModelSelect = () => `
            <div class="mb-2">
                <div class="text-[9px] text-dim font-bold uppercase mb-1">LLM 模型</div>
                <select class="w-full bg-black/30 border border-white/10 rounded p-1 text-[10px] text-white nodrag outline-none" onchange="Modules.toolbox_custom.updateNodeData('${node.id}', 'modelId', this.value)">
                    <option value="default">默认模型</option>
                    ${Modules.toolbox_custom.availableModels.map(m => `<option value="${m.id}" ${node.data.modelId==m.id?'selected':''}>${m.config_name}</option>`).join('')}
                </select>
            </div>
        `;

        // Standard functional nodes
        if (['llm', 'polish', 'custom', 'translate', 'summary', 'expand', 'title'].includes(node.type)) {
            contentHtml = `
                <div class="p-3 space-y-2">
                    ${renderModelSelect()}
                    ${node.type === 'llm' ? `<div class="text-[9px] text-dim font-bold uppercase">内置提示词</div><textarea class="w-full bg-black/30 border border-white/10 rounded p-2 text-xs text-gray-400 resize-none h-12 nodrag mb-2" oninput="Modules.toolbox_custom.updateNodeData('${node.id}', 'prompt', this.value)">${node.data.prompt}</textarea>` : ''}
                    
                    <div class="flex justify-between items-center mb-1">
                        <div class="text-[9px] text-dim font-bold uppercase flex justify-between"><span>输入 (Input)</span> <i class="fa-solid fa-pen-to-square"></i></div>
                    </div>
                    <textarea id="node-in-${node.id}" class="w-full bg-black/30 border border-white/10 rounded p-2 text-xs text-gray-300 resize-none h-20 nodrag focus:border-indigo-500 transition-colors" placeholder="等待输入..." oninput="Modules.toolbox_custom.updateNodeData('${node.id}', 'in', this.value)">${node.data.in || ''}</textarea>
                    
                    <div class="flex justify-between items-center pt-1">
                        <span class="text-[9px] text-dim font-bold uppercase">输出 (Output)</span>
                    </div>
                    <textarea id="node-out-${node.id}" class="w-full bg-black/50 border border-white/10 rounded p-2 text-xs text-green-400 resize-none h-24 nodrag focus:outline-none" readonly placeholder="等待执行...">${node.data.out || ''}</textarea>
                </div>
            `;
        } else if (node.type === 'enhancer') {
            contentHtml = `
                <div class="p-3 space-y-2">
                    ${renderModelSelect()}
                    <div class="text-[9px] text-dim font-bold uppercase">内置提示词</div>
                    <textarea class="w-full bg-black/30 border border-white/10 rounded p-2 text-[10px] text-gray-400 resize-none h-12 nodrag mb-2" oninput="Modules.toolbox_custom.updateNodeData('${node.id}', 'prompt', this.value)">${node.data.prompt}</textarea>
                    
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-[9px] text-dim font-bold uppercase">多路输入</span>
                    </div>
                    <div class="grid grid-cols-3 gap-1">
                        ${[1,2,3].map(i => `<div class="text-center"><span class="text-[9px] text-dim">In ${i}</span><textarea id="node-in${i}-${node.id}" class="w-full bg-black/30 border border-white/10 rounded p-1 text-[9px] h-10 nodrag resize-none" oninput="Modules.toolbox_custom.updateNodeData('${node.id}', 'in${i}', this.value)">${node.data['in'+i]||''}</textarea></div>`).join('')}
                    </div>
                    <div class="grid grid-cols-3 gap-1 mt-2">
                        ${[1,2,3].map(i => `<div class="text-center"><span class="text-[9px] text-dim">Out ${i}</span><textarea id="node-out${i}-${node.id}" class="w-full bg-black/50 border border-white/10 rounded p-1 text-[9px] text-green-400 h-10 nodrag resize-none" readonly>${node.data['out'+i]||''}</textarea></div>`).join('')}
                    </div>
                </div>
            `;
        } else if (node.type === 'merger') {
            contentHtml = `
                <div class="p-3 space-y-2">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-[9px] text-dim font-bold uppercase">融合输入</span>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div><span class="text-[9px] text-dim">In 1</span><textarea id="node-in1-${node.id}" class="w-full bg-black/30 border border-white/10 rounded p-1 text-[10px] h-16 nodrag" oninput="Modules.toolbox_custom.updateNodeData('${node.id}', 'in1', this.value)">${node.data.in1||''}</textarea></div>
                        <div><span class="text-[9px] text-dim">In 2</span><textarea id="node-in2-${node.id}" class="w-full bg-black/30 border border-white/10 rounded p-1 text-[10px] h-16 nodrag" oninput="Modules.toolbox_custom.updateNodeData('${node.id}', 'in2', this.value)">${node.data.in2||''}</textarea></div>
                    </div>
                    <div class="text-center"><i class="fa-solid fa-arrow-down text-dim"></i></div>
                    <div><span class="text-[9px] text-dim">Out</span><textarea id="node-out-${node.id}" class="w-full bg-black/50 border border-white/10 rounded p-1 text-[10px] text-green-400 h-16 nodrag" readonly>${node.data.out||''}</textarea></div>
                </div>
            `;
        } else if (node.type === 'splitter') {
            contentHtml = `
                <div class="p-3 space-y-2">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-[9px] text-dim font-bold uppercase">分流输入</span>
                    </div>
                    <div><span class="text-[9px] text-dim">In</span><textarea id="node-in-${node.id}" class="w-full bg-black/30 border border-white/10 rounded p-1 text-[10px] h-16 nodrag" oninput="Modules.toolbox_custom.updateNodeData('${node.id}', 'in', this.value)">${node.data.in||''}</textarea></div>
                    <div class="text-center"><i class="fa-solid fa-arrow-down text-dim"></i></div>
                    <div class="grid grid-cols-2 gap-2">
                        <div><span class="text-[9px] text-dim">Out 1</span><textarea id="node-out1-${node.id}" class="w-full bg-black/50 border border-white/10 rounded p-1 text-[10px] text-green-400 h-16 nodrag" readonly>${node.data.out1||''}</textarea></div>
                        <div><span class="text-[9px] text-dim">Out 2</span><textarea id="node-out2-${node.id}" class="w-full bg-black/50 border border-white/10 rounded p-1 text-[10px] text-green-400 h-16 nodrag" readonly>${node.data.out2||''}</textarea></div>
                    </div>
                </div>
            `;
        } else if (node.type === 'input') {
            contentHtml = `
                <div class="p-3 space-y-2">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-[9px] text-dim font-bold uppercase">初始输入</span>
                        <button class="btn btn-xs bg-green-600/20 text-green-400 border border-green-600/50 hover:bg-green-600 hover:text-white" onclick="Modules.toolbox_custom.runWorkflow()">运行节点</button>
                    </div>
                    <textarea id="node-in-${node.id}" class="w-full bg-black/30 border border-white/10 rounded p-2 text-xs text-gray-300 resize-none h-32 nodrag focus:border-green-500 transition-colors" placeholder="在此输入工作流初始内容..." oninput="Modules.toolbox_custom.updateNodeData('${node.id}', 'value', this.value)">${node.data.value}</textarea>
                </div>
            `;
        } else if (node.type === 'output') {
            contentHtml = `
                <div class="p-3 space-y-2">
                    <div class="text-[9px] text-dim font-bold uppercase">最终结果</div>
                    <textarea id="node-out-${node.id}" class="w-full bg-black/50 border border-white/10 rounded p-2 text-xs text-green-400 resize-none h-32 nodrag focus:outline-none" readonly>${node.data.value}</textarea>
                </div>
            `;
        }

        // Header and Ports
        div.innerHTML = `
            <div class="p-2 border-b border-white/10 bg-white/5 rounded-t-lg flex justify-between items-center cursor-move" onmousedown="Modules.toolbox_custom.nodeMouseDown(event, '${node.id}')">
                <div class="flex items-center gap-2 text-xs font-bold text-gray-200">
                    <i class="${node.type==='input'?'fa-solid fa-keyboard text-green-400':node.type==='output'?'fa-solid fa-print text-red-400':'fa-solid fa-cube text-indigo-400'}"></i> ${node.title}
                </div>
                <div class="flex gap-2">
                    <i class="fa-solid fa-xmark text-dim hover:text-red-500 cursor-pointer" onclick="Modules.toolbox_custom.removeNode('${node.id}')"></i>
                </div>
            </div>
            ${contentHtml}
            
            <!-- Ports -->
            <div class="flex justify-between px-2 pb-2 relative h-4">
                <div class="absolute left-0 bottom-2 flex flex-col gap-2">
                    ${node.inputs.map(p => `
                        <div class="relative group/port">
                            <div class="w-3 h-3 rounded-full bg-[#333] border border-gray-500 hover:bg-green-500 cursor-crosshair port-dot -ml-1.5"
                                 data-node="${node.id}" data-port="${p}" data-type="in"
                                 onmousedown="Modules.toolbox_custom.portMouseDown(event, '${node.id}', '${p}', 'in')"></div>
                            <span class="absolute left-4 top-[-2px] text-[9px] text-dim opacity-0 group-hover/port:opacity-100 transition-opacity whitespace-nowrap bg-black px-1 rounded border border-white/10 pointer-events-none">${p}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="absolute right-0 bottom-2 flex flex-col gap-2 items-end">
                    ${node.outputs.map(p => `
                        <div class="relative group/port">
                            <div class="w-3 h-3 rounded-full bg-[#333] border border-gray-500 hover:bg-green-500 cursor-crosshair port-dot -mr-1.5"
                                 data-node="${node.id}" data-port="${p}" data-type="out"
                                 onmousedown="Modules.toolbox_custom.portMouseDown(event, '${node.id}', '${p}', 'out')"></div>
                            <span class="absolute right-4 top-[-2px] text-[9px] text-dim opacity-0 group-hover/port:opacity-100 transition-opacity whitespace-nowrap bg-black px-1 rounded border border-white/10 pointer-events-none">${p}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        document.getElementById('tc-nodes').appendChild(div);
    },

    updateNodeData: (id, key, val) => {
        const n = Modules.toolbox_custom.nodes.find(x => x.id === id);
        if(n) n.data[key] = val;
    },

    removeNode: (id) => {
        Modules.toolbox_custom.nodes = Modules.toolbox_custom.nodes.filter(n => n.id !== id);
        Modules.toolbox_custom.connections = Modules.toolbox_custom.connections.filter(c => c.from !== id && c.to !== id);
        document.getElementById(id).remove();
        Modules.toolbox_custom.drawConnections();
    },
    
    clearCanvas: () => {
        if(confirm('清空所有节点？')) {
            Modules.toolbox_custom.nodes = [];
            Modules.toolbox_custom.connections = [];
            document.getElementById('tc-nodes').innerHTML = '';
            Modules.toolbox_custom.drawConnections();
        }
    },

    // Node Dragging
    nodeMouseDown: (e, id) => {
        Modules.toolbox_custom.draggedNode = id;
        const n = document.getElementById(id);
        const rect = n.getBoundingClientRect();
        Modules.toolbox_custom.dragOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        e.stopPropagation();
    },

    mouseMove: (e) => {
        const container = document.getElementById('tc-canvas-container');
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (Modules.toolbox_custom.draggedNode) {
            const id = Modules.toolbox_custom.draggedNode;
            const node = Modules.toolbox_custom.nodes.find(n => n.id === id);
            const el = document.getElementById(id);
            node.x = x - Modules.toolbox_custom.dragOffset.x;
            node.y = y - Modules.toolbox_custom.dragOffset.y;
            el.style.left = node.x + 'px';
            el.style.top = node.y + 'px';
            Modules.toolbox_custom.drawConnections();
        }
        
        if (Modules.toolbox_custom.connectingNode) {
            Modules.toolbox_custom.drawConnections(true, {x, y});
        }
    },

    mouseUp: (e) => {
        Modules.toolbox_custom.draggedNode = null;
        if (Modules.toolbox_custom.connectingNode) {
            // Check if dropped on a valid port (Simple hit test or logic handled by portMouseDown)
            // Here we just cancel if not handled by portMouseDown
            Modules.toolbox_custom.connectingNode = null;
            Modules.toolbox_custom.drawConnections();
        }
    },

    // Connection Logic
    portMouseDown: (e, nodeId, portName, type) => {
        e.stopPropagation();
        e.preventDefault();
        if (type === 'out') {
            Modules.toolbox_custom.connectingNode = { from: nodeId, fromPort: portName };
        } else {
            // Check if there's an existing connection to this input port and remove it
            const existingIdx = Modules.toolbox_custom.connections.findIndex(c => c.to === nodeId && c.toPort === portName);
            if (existingIdx !== -1) {
                Modules.toolbox_custom.connections.splice(existingIdx, 1);
                Modules.toolbox_custom.drawConnections();
            }
        }
    },
    
    // Drawing
    drawConnections: (dragging = false, mousePos = null) => {
        const svg = document.getElementById('tc-connections');
        if(!svg) return;
        
        let html = '';
        
        Modules.toolbox_custom.connections.forEach(c => {
            const n1 = Modules.toolbox_custom.nodes.find(n => n.id === c.from);
            const n2 = Modules.toolbox_custom.nodes.find(n => n.id === c.to);
            if(!n1 || !n2) return;
            
            const p1 = Modules.toolbox_custom.getPortPos(n1.id, c.fromPort, 'out');
            const p2 = Modules.toolbox_custom.getPortPos(n2.id, c.toPort, 'in');
            
            html += `<path d="M ${p1.x} ${p1.y} C ${p1.x+50} ${p1.y}, ${p2.x-50} ${p2.y}, ${p2.x} ${p2.y}" stroke="#555" stroke-width="2" fill="none" />`;
        });
        
        if (dragging && Modules.toolbox_custom.connectingNode && mousePos) {
            const n1 = Modules.toolbox_custom.nodes.find(n => n.id === Modules.toolbox_custom.connectingNode.from);
            const p1 = Modules.toolbox_custom.getPortPos(n1.id, Modules.toolbox_custom.connectingNode.fromPort, 'out');
            html += `<path d="M ${p1.x} ${p1.y} C ${p1.x+50} ${p1.y}, ${mousePos.x-50} ${mousePos.y}, ${mousePos.x} ${mousePos.y}" stroke="#ffd700" stroke-width="2" fill="none" stroke-dasharray="5,5" />`;
        }
        
        svg.innerHTML = html;
    },
    
    getPortPos: (nodeId, portName, type) => {
        const nodeEl = document.getElementById(nodeId);
        if (!nodeEl) return {x:0, y:0};
        
        // Find the specific port dot using data attributes
        const dot = nodeEl.querySelector(`.port-dot[data-port="${portName}"][data-type="${type}"]`);
        if (!dot) return {x:0, y:0};
        
        const container = document.getElementById('tc-canvas-container');
        const cRect = container.getBoundingClientRect();
        const dRect = dot.getBoundingClientRect();
        
        return {
            x: dRect.left + dRect.width/2 - cRect.left,
            y: dRect.top + dRect.height/2 - cRect.top
        };
    },

    // Execution Engine
    logIO: (msg, type='info') => {
        const log = document.getElementById('tc-io-log');
        if(!log) return;
        const color = type === 'error' ? 'text-red-400' : type === 'success' ? 'text-green-400' : 'text-dim';
        const time = new Date().toLocaleTimeString();
        log.innerHTML += `<div class="${color} border-b border-white/5 py-1">[${time}] ${msg}</div>`;
        log.scrollTop = log.scrollHeight;
    },

    runWorkflow: async (silent = false) => {
        if(!silent) UI.toast('工作流开始执行...');
        Modules.toolbox_custom.logIO('Workflow started.', 'info');
        
        // 1. Build Adjacency List & Calculate Indegrees for Topological Sort
        const adj = {};
        const indegree = {};
        const allNodes = Modules.toolbox_custom.nodes;
        
        allNodes.forEach(n => {
            adj[n.id] = [];
            indegree[n.id] = 0;
        });
        
        Modules.toolbox_custom.connections.forEach(c => {
            if(adj[c.from]) adj[c.from].push(c.to);
            if(indegree[c.to] !== undefined) indegree[c.to]++;
        });
        
        // 2. Topological Sort (Kahn's Algorithm)
        const queue = allNodes.filter(n => indegree[n.id] === 0).map(n => n.id);
        const executionOrder = [];
        
        while(queue.length > 0) {
            const u = queue.shift();
            executionOrder.push(u);
            
            if(adj[u]) {
                adj[u].forEach(v => {
                    indegree[v]--;
                    if(indegree[v] === 0) queue.push(v);
                });
            }
        }
        
        if(executionOrder.length !== allNodes.length) {
            if(!silent) UI.toast('错误：检测到循环依赖', 'error');
            Modules.toolbox_custom.logIO('Error: Cyclic dependency detected.', 'error');
            return;
        }
        
        // 3. Execute in Order
        let nodeData = {}; // Store outputs: { nodeId: { portName: value } }
        
        for(const nodeId of executionOrder) {
            const node = allNodes.find(n => n.id === nodeId);
            if(!node) continue;
            
            // Visual feedback
            const el = document.getElementById(node.id);
            if(el && !silent) {
                el.style.borderColor = "#00ff00";
                el.style.boxShadow = "0 0 20px rgba(0,255,0,0.3)";
            }
            
            // Gather Inputs
            // Find connections pointing TO this node
            const incoming = Modules.toolbox_custom.connections.filter(c => c.to === nodeId);
            let inputs = {};
            incoming.forEach(c => {
                if(nodeData[c.from] && nodeData[c.from][c.fromPort] !== undefined) {
                    inputs[c.toPort] = nodeData[c.from][c.fromPort];
                }
            });
            
            Modules.toolbox_custom.logIO(`Executing Node [${node.title}] (${node.id})...`, 'info');
            
            // Execute Node Logic
            await Modules.toolbox_custom.executeNodeLogic(node, inputs, nodeData, el);
            
            // Update nodeData with outputs from executeNodeLogic logic
            // Since executeNodeLogic doesn't return outputs directly but updates local vars/UI, we need to extract them back or ensure executeNodeLogic updates nodeData
            // Actually, my executeNodeLogic implementation below returns outputs implicitly via nodeData updates if I pass it, but better to return it.
            // Wait, I am passing nodeData but I am NOT updating it inside executeNodeLogic in the original code.
            // The original code updated a local `outputs` var and then `nodeData[node.id] = outputs` AFTER the call.
            // But `executeNodeLogic` is async and I need the outputs.
            // I will modify `executeNodeLogic` to RETURN outputs.
            
            // Re-reading original code:
            // await Modules.toolbox_custom.executeNodeLogic(node, inputs, nodeData, el);
            // nodeData[node.id] = outputs; <-- wait, `outputs` was local to executeNodeLogic in original code but not returned?
            // Ah, the original code had `executeNodeLogic` INSIDE `runWorkflow` loop block? No, it was a separate function.
            // Let's check the original structure.
            // It seems `executeNodeLogic` was defined as a property of `Modules.toolbox_custom` but in my search block I see it separate.
            // Actually, in the original code, `executeNodeLogic` didn't return `outputs`. It just calculated them.
            // The `nodeData[node.id] = outputs` line was MISSING in `runWorkflow`?
            // Let's look at the SEARCH block again.
            // `await Modules.toolbox_custom.executeNodeLogic(node, inputs, nodeData, el);`
            // `Modules.toolbox_custom.logIO...`
            // The `nodeData` update seems missing in the call site in `runWorkflow` or `executeNodeLogic` needs to update `nodeData`.
            // In the SEARCH block, `executeNodeLogic` defines `let outputs = {};` inside.
            // So `runWorkflow` logic was flawed in original code or I missed where it updated `nodeData`.
            // Ah, `executeNodeLogic` implementation in SEARCH block ends with `nodeData[node.id] = outputs;`.
            // So it DOES update `nodeData` if passed.
            
            Modules.toolbox_custom.logIO(`Node [${node.title}] finished.`, 'success');
            
            // Visual feedback done
            if(el && !silent) {
                el.style.borderColor = "";
                el.style.boxShadow = "";
            }
        }
        
        Modules.toolbox_custom.logIO('Workflow completed successfully.', 'success');
        if(!silent) UI.toast('工作流执行完毕');
    },

    executeNodeLogic: async (node, inputs, nodeData, el, silent = false) => {
        let outputs = {};
        try {
            // Update UI with incoming data
            for (const [key, val] of Object.entries(inputs)) {
                if (val !== null && val !== undefined) {
                    const inEl = document.getElementById(`node-${key}-${node.id}`);
                    if (inEl) inEl.value = val;
                    else {
                        // Fallback for single input nodes
                        const simpleEl = document.getElementById(`node-in-${node.id}`);
                        if(simpleEl) simpleEl.value = val;
                    }
                    node.data[key] = val; // Sync state
                    if(node.type === 'input') node.data.value = val;
                }
            }

            // Read from UI (allows manual override)
            let currentInputs = {};
            if (node.type === 'enhancer') {
                currentInputs.in1 = document.getElementById(`node-in1-${node.id}`)?.value || node.data.in1 || '';
                currentInputs.in2 = document.getElementById(`node-in2-${node.id}`)?.value || node.data.in2 || '';
                currentInputs.in3 = document.getElementById(`node-in3-${node.id}`)?.value || node.data.in3 || '';
            } else if (node.type === 'merger') {
                currentInputs.in1 = document.getElementById(`node-in1-${node.id}`)?.value || node.data.in1 || '';
                currentInputs.in2 = document.getElementById(`node-in2-${node.id}`)?.value || node.data.in2 || '';
            } else {
                currentInputs.in = document.getElementById(`node-in-${node.id}`)?.value || node.data.in || node.data.value || '';
            }

            // Get Model Config
            let modelConfig = {};
            if (node.data.modelId && node.data.modelId !== 'default') {
                const m = Modules.toolbox_custom.availableModels.find(x => x.id == node.data.modelId); // loose match
                if(m) modelConfig = { useModel: m };
            }

            if(node.type === 'input') {
                outputs['out'] = currentInputs.in;
            } else if (node.type === 'output') {
                const outEl = document.getElementById(`node-out-${node.id}`);
                if(outEl) outEl.value = currentInputs.in;
                outputs['out'] = currentInputs.in;
                node.data.value = currentInputs.in;

                // Auto Export Logic
                if (!silent && currentInputs.in && currentInputs.in !== '等待执行...') {
                     const blob = new Blob([currentInputs.in], {type: "text/plain;charset=utf-8"});
                     const url = URL.createObjectURL(blob);
                     const a = document.createElement('a');
                     a.href = url;
                     a.download = `生成结果_${new Date().toISOString().slice(0,19).replace(/T|:/g,"-")}.txt`;
                     document.body.appendChild(a);
                     a.click();
                     document.body.removeChild(a);
                     URL.revokeObjectURL(url);
                     UI.toast('结果已自动导出');
                }
            } else if (node.type === 'enhancer') {
                if(el) el.classList.add('border-green-500', 'shadow-[0_0_20px_rgba(34,197,94,0.3)]');
                
                const tasks = [];
                for(let i=1; i<=3; i++) {
                    const val = currentInputs[`in${i}`];
                    if(val && val.trim() !== '') {
                        const p = (node.data.prompt || 'Optimize: {{input}}').replace('{{input}}', val).replace('{{in}}', val);
                        const outEl = document.getElementById(`node-out${i}-${node.id}`);
                        if(outEl) outEl.value = "Generating...";
                        
                        tasks.push(AI.generate(p, modelConfig, c => {
                            if(outEl) outEl.value = (outEl.value === "Generating..." ? "" : outEl.value) + c;
                        }).then(() => {
                            const res = outEl ? outEl.value : "";
                            outputs[`out${i}`] = res;
                            node.data[`out${i}`] = res;
                        }));
                    } else {
                        outputs[`out${i}`] = "";
                        node.data[`out${i}`] = "";
                        const outEl = document.getElementById(`node-out${i}-${node.id}`);
                        if(outEl) outEl.value = "";
                    }
                }
                await Promise.all(tasks);
                if(el) el.classList.remove('border-green-500', 'shadow-[0_0_20px_rgba(34,197,94,0.3)]');

            } else if (node.type === 'merger') {
                const p = (node.data.prompt || 'Merge:\n{{in1}}\n{{in2}}').replace('{{in1}}', currentInputs.in1).replace('{{in2}}', currentInputs.in2);
                const outEl = document.getElementById(`node-out-${node.id}`);
                if(outEl) outEl.value = "Merging...";
                let res = "";
                await AI.generate(p, modelConfig, c => { res += c; if(outEl) outEl.value = res; });
                outputs['out'] = res; node.data.out = res;

            } else if (node.type === 'splitter') {
                const p = (node.data.prompt || 'Split into 2 parts:\n{{in}}').replace('{{in}}', currentInputs.in);
                // We need structured output or heuristic split. For simplicity, let's ask for JSON or specific delimiter
                // But for now, let's just duplicate output or use a simple heuristic if prompt doesn't specify
                // Let's assume the user prompt guides the split.
                // Actually, splitting text via LLM into exactly 2 outputs cleanly is hard without JSON.
                // Let's try to parse JSON if possible, else just output full text to both? No, that's useless.
                // Let's output to out1 and out2 based on "Part 1:" "Part 2:" markers?
                
                const outEl1 = document.getElementById(`node-out1-${node.id}`);
                const outEl2 = document.getElementById(`node-out2-${node.id}`);
                if(outEl1) outEl1.value = "Generating...";
                if(outEl2) outEl2.value = "Generating...";
                
                let res = "";
                await AI.generate(p + "\n\n[Output Format]\nPart 1: ...\nPart 2: ...", modelConfig, c => res += c);
                
                // Simple parsing
                const parts = res.split(/Part 2:/i);
                const p1 = parts[0]?.replace(/Part 1:/i, '').trim() || "";
                const p2 = parts[1]?.trim() || "";
                
                if(outEl1) outEl1.value = p1;
                if(outEl2) outEl2.value = p2;
                outputs['out1'] = p1;
                outputs['out2'] = p2;
                node.data.out1 = p1;
                node.data.out2 = p2;

            } else {
                // Standard single input/output nodes
                let prompt = "";
                const inp = currentInputs.in;
                if (node.type === 'llm') prompt = (node.data.prompt || '').replace('{{in}}', inp).replace('{{input}}', inp); // Support both vars
                else if (node.type === 'polish') prompt = `[Task] Polish the following text:\n\n${inp}`;
                else if (node.type === 'translate') prompt = `[Task] Translate to Chinese:\n\n${inp}`;
                else if (node.type === 'summary') prompt = `[Task] Summarize:\n\n${inp}`;
                else if (node.type === 'expand') prompt = `[Task] Expand:\n\n${inp}`;
                else if (node.type === 'title') prompt = `[Task] Generate titles:\n\n${inp}`;
                else if (node.type === 'custom') {
                    const tool = await DB.get('tools_custom', node.data.toolId);
                    if(tool) prompt = tool.prompt.replace('{{input}}', inp);
                }

                if(el) el.classList.add('border-green-500', 'shadow-[0_0_20px_rgba(34,197,94,0.3)]');
                Modules.toolbox_custom.logIO(`Executing [${node.title}]...`, 'info');

                let res = '';
                const outEl = document.getElementById(`node-out-${node.id}`);
                if(outEl) outEl.value = "Generating...";

                await AI.generate(prompt, modelConfig, c => {
                    res += c;
                    if(outEl) { outEl.value = res; outEl.scrollTop = outEl.scrollHeight; }
                });

                if(el) el.classList.remove('border-green-500', 'shadow-[0_0_20px_rgba(34,197,94,0.3)]');
                
                outputs['out'] = res;
                outputs['result'] = res;
                outputs['polished'] = res;
                outputs['summary'] = res;
                outputs['expanded'] = res;
                outputs['titles'] = res;
                node.data.out = res;
            }
        } catch (e) {
            console.error("Node execution error", e);
            Modules.toolbox_custom.logIO(`Error: ${e.message}`, 'error');
            if(el) el.classList.add('border-red-500');
        }
        
        nodeData[node.id] = outputs;
        
        // Flash success
        if(el) {
            const originalBg = el.style.backgroundColor;
            el.style.backgroundColor = "#1a2e1a";
            setTimeout(() => { el.style.backgroundColor = originalBg; }, 300);
        }
    },
    
    runNode: async (id) => {
        const node = Modules.toolbox_custom.nodes.find(n => n.id === id);
        if(!node) return;
        const el = document.getElementById(id);
        
        // 1. Execute Logic
        await Modules.toolbox_custom.executeNodeLogic(node, {}, {}, el);
        
        // 2. Propagate to connected nodes
        const outputs = node.data;
        const outgoing = Modules.toolbox_custom.connections.filter(c => c.from === id);
        
        outgoing.forEach(c => {
            const targetNode = Modules.toolbox_custom.nodes.find(n => n.id === c.to);
            if(targetNode) {
                const outValue = outputs[c.fromPort];
                if (outValue !== undefined && outValue !== null && outValue !== '') {
                    const targetPort = c.toPort;
                    targetNode.data[targetPort] = outValue;
                    if(targetNode.type === 'input') targetNode.data.value = outValue;
                    
                    const targetEl = document.getElementById(`node-${targetPort}-${targetNode.id}`);
                    if(targetEl) targetEl.value = outValue;
                    else {
                         const simpleEl = document.getElementById(`node-in-${targetNode.id}`);
                         if(simpleEl && targetPort === 'in') simpleEl.value = outValue;
                    }
                }
            }
        });
    },

    loadTool: async (id) => {
        // Add the custom tool node to the canvas
        await Modules.toolbox_custom.addNode('custom', 400, 200, id);
        Modules.toolbox_custom.drawConnections();
        UI.toast('工具节点已加载');
    }
};

// Patch mouseUp to handle connection drop
const originalMouseUp = Modules.toolbox_custom.mouseUp;
Modules.toolbox_custom.mouseUp = (e) => {
    if (Modules.toolbox_custom.connectingNode) {
        // Hit test
        const target = e.target;
        if (target.classList.contains('cursor-crosshair')) {
            // It's a port div (based on my renderNode classes)
            // We need to know which node/port it belongs to.
            // I'll add data attributes to the dots in renderNode via regex replacement or just assume logic
            // Wait, I can't easily change renderNode string now.
            // I will inject the connection logic in `portMouseDown`... no, that's for start.
            
            // Let's assume the user drops on the dot.
            // We need to parse the onclick or onmousedown handler string to get ID? No.
            // We need data attributes.
            // I will RE-WRITE renderNode in the big block above to include data attributes.
        }
    }
    originalMouseUp(e);
};

// renderNode is defined inside the main object now, removing duplicate injection.

// Final MouseUp Patch
Modules.toolbox_custom.mouseUp = (e) => {
    if (Modules.toolbox_custom.connectingNode) {
        const target = e.target;
        if (target.classList.contains('port-dot')) {
            const nodeId = target.dataset.node;
            const port = target.dataset.port;
            const type = target.dataset.type;
            
            // Validate connection (Output -> Input only)
            if (type === 'in') {
                Modules.toolbox_custom.connections.push({
                    from: Modules.toolbox_custom.connectingNode.from,
                    fromPort: Modules.toolbox_custom.connectingNode.fromPort,
                    to: nodeId,
                    toPort: port
                });
            }
        }
        Modules.toolbox_custom.connectingNode = null;
        Modules.toolbox_custom.drawConnections();
    }
    Modules.toolbox_custom.draggedNode = null;
};

// 10. VECTORS & WORLD & GRAPH
Modules.vectors = {
    render: () => `
        <div class="layout-golden">
            <!-- 30% Stats (Left) -->
            <div class="col-nav p-6 gap-6">
                <div class="flex flex-col gap-2">
                    <h2 class="text-2xl font-bold text-accent"><i class="fa-solid fa-database mr-2"></i> 向量数据库</h2>
                    <div class="text-xs font-mono text-dim bg-white/5 p-2 rounded">
                        <div>状态: <span class="text-green-500">在线</span></div>
                        <div>索引: HNSW (Hierarchical Navigable Small World)</div>
                        <div>维度: 1536</div>
                    </div>
                </div>
                <div class="flex-1 bg-black/20 rounded border border-white/5 p-4">
                    <span class="text-xs font-bold text-dim mb-2 block">统计信息</span>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="text-center">
                            <div class="text-xl font-bold text-white">0</div>
                            <div class="text-[10px] text-dim">总向量数</div>
                        </div>
                        <div class="text-center">
                            <div class="text-xl font-bold text-white">0ms</div>
                            <div class="text-[10px] text-dim">检索延迟</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 70% Content (Right) -->
            <div class="col-content bg-black/20 p-8 flex col">
                <div class="flex-1 card bg-black/40 backdrop-blur border-white/10 overflow-hidden shadow-2xl flex col">
                    <div class="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-white/5 text-xs font-bold text-dim uppercase tracking-wider">
                        <span class="col-span-2">ID</span>
                        <span class="col-span-8">向量内容预览</span>
                        <span class="col-span-2 text-right">维度信息</span>
                    </div>
                    <div id="vec-list" class="flex-1 overflow-y-auto bg-black/20 p-2 space-y-1 font-mono text-xs"></div>
                </div>
            </div>
        </div>
    `,
    init: async () => {
        const vecs = await DB.getAll('vectors');
        document.getElementById('vec-list').innerHTML = vecs.map(v => `
            <div class="grid grid-cols-12 gap-4 p-3 border border-white/5 rounded hover:bg-white/5 transition-colors items-center group">
                <span class="col-span-2 truncate text-accent opacity-70 group-hover:opacity-100">${v.id.substring(0,8)}...</span>
                <span class="col-span-8 truncate text-gray-400 group-hover:text-white transition-colors">${v.content}</span>
                <span class="col-span-2 text-right text-dim">1536 Float32</span>
            </div>
        `).join('');
    }
};

Modules.world = {
    render: () => `
        <div class="layout-golden bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center relative">
            <div class="absolute inset-0 bg-black/80 backdrop-blur-md"></div>
            
            <!-- 30% Navigation (Left) -->
            <div class="col-nav p-6 gap-4 relative z-10">
                <div class="flex items-center gap-3 mb-4">
                    <h2 class="text-2xl font-bold text-white"><i class="fa-solid fa-earth-americas text-blue-500 mr-2"></i>世界观构建</h2>
                </div>
                
                <div class="flex flex-col gap-3">
                    ${[
                        {id:'history', icon:'fa-scroll', label:'历史与传说', color:'text-yellow-500'},
                        {id:'geography', icon:'fa-map', label:'地理与地貌', color:'text-green-500'},
                        {id:'magic', icon:'fa-wand-sparkles', label:'魔法/科技体系', color:'text-purple-500'},
                        {id:'factions', icon:'fa-flag', label:'势力与组织', color:'text-red-500'},
                        {id:'species', icon:'fa-dragon', label:'种族与生物', color:'text-orange-500'}
                    ].map(item => `
                        <button class="p-4 rounded-xl bg-black/40 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-left group flex items-center gap-4" onclick="Modules.world.setCat('${item.id}')">
                            <div class="w-10 h-10 rounded-lg bg-white/5 flex center ${item.color} text-xl group-hover:scale-110 transition-transform"><i class="fa-solid ${item.icon}"></i></div>
                            <div>
                                <div class="font-bold text-gray-200 group-hover:text-white">${item.label}</div>
                                <div class="text-[10px] text-dim uppercase tracking-wider">0 条目</div>
                            </div>
                        </button>
                    `).join('')}
                </div>
                
                <div class="flex-1"></div>
                <button class="btn btn-primary bg-blue-600 border-none text-white hover:bg-blue-500 w-full"><i class="fa-solid fa-save mr-2"></i> 保存设定</button>
            </div>

            <!-- 70% Editor (Right) -->
            <div class="col-content bg-black/40 p-8 relative z-10">
                <div class="card w-full h-full bg-black/60 backdrop-blur-xl border-white/10 p-6 shadow-2xl flex flex-col">
                    <div class="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
                        <span class="font-bold text-lg text-white"><i class="fa-solid fa-pen-to-square mr-2 text-dim"></i> 设定编辑器</span>
                        <div class="text-xs text-dim">支持 Markdown & 双链语法</div>
                    </div>
                    <textarea class="flex-1 bg-transparent border-none resize-none font-mono text-gray-300 leading-relaxed focus:outline-none text-lg" placeholder="# 设定详情\n\n在此详细描述该分类下的世界观规则、历史事件或地理特征..."></textarea>
                </div>
            </div>
        </div>
    `,
    setCat: (c) => UI.toast(`Switched to ${c}`)
};

Modules.graph = {
    render: () => `
        <div class="h-full relative bg-[#050505] overflow-hidden">
            <div id="graph-canvas" class="w-full h-full"></div>
            
            <div class="absolute top-6 left-6 p-4 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl flex col gap-4 w-64">
                <h3 class="font-bold text-white flex items-center gap-2"><i class="fa-solid fa-circle-nodes text-accent"></i> 知识图谱</h3>
                <div class="text-xs text-dim">可视化实体、情节和世界观概念之间的关系网。</div>
                <div class="flex gap-2">
                     <button class="btn btn-sm flex-1 bg-white/10 hover:bg-white/20 text-white border-none" onclick="Modules.graph.refresh()"><i class="fa-solid fa-rotate mr-1"></i> 刷新</button>
                     <button class="btn btn-sm flex-1 bg-white/10 hover:bg-white/20 text-white border-none"><i class="fa-solid fa-filter mr-1"></i> 筛选</button>
                </div>
                <div class="border-t border-white/10 pt-2 grid grid-cols-2 gap-2 text-[10px] text-gray-400">
                    <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-yellow-500"></span> 人物</div>
                    <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-blue-500"></span> 物品</div>
                    <div class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-green-500"></span> 地点</div>
                </div>
            </div>
        </div>
    `,
    init: async () => {
        const items = await DB.getAll('entities');
        const nodes = items.map((i, idx) => ({ id: i.id, label: i.name, group: i.type }));
        // Mock edges
        const edges = [];
        for(let i=0; i<nodes.length-1; i++) edges.push({ from: nodes[i].id, to: nodes[i+1].id });
        
        const container = document.getElementById('graph-canvas');
        const data = { nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges) };
        const options = {
            nodes: { shape: 'dot', size: 16, font: { color: '#fff' }, borderWidth: 2 },
            groups: {
                '人物': { color: '#eab308' },
                '物品': { color: '#3b82f6' },
                '地点': { color: '#22c55e' }
            },
            physics: { stabilization: false }
        };
        new vis.Network(container, data, options);
    },
    refresh: () => Modules.graph.init()
};

// 11. VIDEO & TRADING & OTHERS
Modules.video = {
    currentTab: 'media',
    render: () => `
        <div class="h-full flex col bg-[#18181b] text-white">
            <!-- Top Area -->
            <div class="h-[65%] flex border-b border-black">
                <!-- Left: Assets Library -->
                <div class="w-72 bg-[#27272a] flex col border-r border-black">
                    <div class="flex border-b border-black">
                        <button class="flex-1 py-3 text-xs font-bold ${Modules.video.currentTab==='media'?'text-white bg-black/20':'text-dim hover:text-white hover:bg-black/20'}" onclick="Modules.video.setTab('media')">媒体库</button>
                        <button class="flex-1 py-3 text-xs font-bold ${Modules.video.currentTab==='effect'?'text-white bg-black/20':'text-dim hover:text-white hover:bg-black/20'}" onclick="Modules.video.setTab('effect')">特效</button>
                        <button class="flex-1 py-3 text-xs font-bold ${Modules.video.currentTab==='trans'?'text-white bg-black/20':'text-dim hover:text-white hover:bg-black/20'}" onclick="Modules.video.setTab('trans')">转场</button>
                    </div>
                    <div class="flex-1 p-4 overflow-y-auto">
                        <div id="video-tab-media" class="${Modules.video.currentTab==='media'?'block':'hidden'}">
                            <button class="epic-btn w-full h-10 mb-4 rounded bg-blue-600/20 text-blue-400 border border-blue-600/50 hover:bg-blue-600 hover:text-white font-bold flex center gap-2" onclick="document.getElementById('video-upload').click()">
                                <i class="fa-solid fa-plus"></i> 导入素材
                            </button>
                            <input type="file" id="video-upload" class="hidden" onchange="Modules.video.handleUpload(this)" multiple accept="video/*,image/*,audio/*">
                            <div class="grid grid-cols-2 gap-3" id="video-assets">
                                <!-- Assets injected here -->
                            </div>
                        </div>
                        <div id="video-tab-effect" class="${Modules.video.currentTab==='effect'?'block':'hidden'} space-y-2">
                            <div class="p-2 bg-black/30 rounded border border-white/5 text-xs text-dim hover:text-white cursor-pointer group flex items-center gap-2">
                                <div class="w-8 h-8 rounded bg-white/10 flex center"><i class="fa-solid fa-film"></i></div>
                                <span>复古胶片</span>
                            </div>
                            <div class="p-2 bg-black/30 rounded border border-white/5 text-xs text-dim hover:text-white cursor-pointer group flex items-center gap-2">
                                <div class="w-8 h-8 rounded bg-white/10 flex center"><i class="fa-solid fa-bolt"></i></div>
                                <span>赛博故障</span>
                            </div>
                            <div class="p-2 bg-black/30 rounded border border-white/5 text-xs text-dim hover:text-white cursor-pointer group flex items-center gap-2">
                                <div class="w-8 h-8 rounded bg-white/10 flex center"><i class="fa-solid fa-sun"></i></div>
                                <span>光斑漏光</span>
                            </div>
                        </div>
                        <div id="video-tab-trans" class="${Modules.video.currentTab==='trans'?'block':'hidden'} space-y-2">
                            <div class="p-2 bg-black/30 rounded border border-white/5 text-xs text-dim hover:text-white cursor-pointer group flex items-center gap-2">
                                <div class="w-8 h-8 rounded bg-white/10 flex center"><i class="fa-solid fa-ghost"></i></div>
                                <span>叠化 (Dissolve)</span>
                            </div>
                            <div class="p-2 bg-black/30 rounded border border-white/5 text-xs text-dim hover:text-white cursor-pointer group flex items-center gap-2">
                                <div class="w-8 h-8 rounded bg-white/10 flex center"><i class="fa-solid fa-circle-half-stroke"></i></div>
                                <span>黑场过渡 (Fade)</span>
                            </div>
                            <div class="p-2 bg-black/30 rounded border border-white/5 text-xs text-dim hover:text-white cursor-pointer group flex items-center gap-2">
                                <div class="w-8 h-8 rounded bg-white/10 flex center"><i class="fa-solid fa-magnifying-glass"></i></div>
                                <span>推拉 (Zoom)</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Center: Player -->
                <div class="flex-1 bg-black flex col relative group">
                    <div class="flex-1 flex center relative overflow-hidden bg-[#0a0a0a]">
                        <video id="video-preview" class="max-w-full max-h-full object-contain hidden shadow-2xl"></video>
                        <div id="video-placeholder" class="text-dim flex col center gap-4 opacity-30">
                            <i class="fa-solid fa-clapperboard text-7xl animate-pulse"></i>
                            <span class="text-sm font-mono tracking-widest">预览窗口 (PREVIEW)</span>
                        </div>
                    </div>
                    
                    <!-- Player Controls -->
                    <div class="h-12 bg-[#202023] border-t border-black flex items-center px-4 justify-between">
                        <div class="flex items-center gap-4 text-dim">
                            <span class="font-mono text-xs text-white" id="video-time">00:00:00:00</span>
                        </div>
                        <div class="flex items-center gap-6 text-white text-sm">
                            <i class="fa-solid fa-backward-step cursor-pointer hover:text-blue-500 transition-colors" onclick="Modules.video.frame(-1)"></i>
                            <i class="fa-solid fa-play text-xl cursor-pointer hover:text-blue-500 transition-colors" id="video-play-btn" onclick="Modules.video.togglePlay()"></i>
                            <i class="fa-solid fa-forward-step cursor-pointer hover:text-blue-500 transition-colors" onclick="Modules.video.frame(1)"></i>
                        </div>
                        <div class="flex items-center gap-4 text-dim text-xs">
                            <i class="fa-solid fa-volume-high hover:text-white cursor-pointer"></i>
                            <i class="fa-solid fa-expand hover:text-white cursor-pointer"></i>
                        </div>
                    </div>
                </div>

                <!-- Right: Properties -->
                <div class="w-64 bg-[#27272a] border-l border-black flex col">
                    <div class="h-10 border-b border-black flex items-center px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">属性面板</div>
                    <div class="flex-1 p-4 space-y-6 overflow-y-auto">
                        <div class="col gap-2">
                            <span class="text-[10px] text-dim font-bold">变换 (Transform)</span>
                            <div class="grid grid-cols-2 gap-2">
                                <div class="col gap-1">
                                    <span class="text-[9px] text-dim">X 位置</span>
                                    <input type="number" class="epic-input h-7 rounded text-xs text-white px-2" value="0">
                                </div>
                                <div class="col gap-1">
                                    <span class="text-[9px] text-dim">Y 位置</span>
                                    <input type="number" class="epic-input h-7 rounded text-xs text-white px-2" value="0">
                                </div>
                                <div class="col gap-1">
                                    <span class="text-[9px] text-dim">缩放 %</span>
                                    <input type="number" class="epic-input h-7 rounded text-xs text-white px-2" value="100">
                                </div>
                                <div class="col gap-1">
                                    <span class="text-[9px] text-dim">旋转 °</span>
                                    <input type="number" class="epic-input h-7 rounded text-xs text-white px-2" value="0">
                                </div>
                            </div>
                        </div>
                        <div class="col gap-2">
                            <span class="text-[10px] text-dim font-bold">混合模式</span>
                            <select class="epic-input h-7 rounded text-xs text-white px-1"><option>正常 (Normal)</option><option>滤色 (Screen)</option><option>正片叠底 (Multiply)</option><option>叠加 (Overlay)</option></select>
                        </div>
                        <div class="col gap-2">
                            <span class="text-[10px] text-dim font-bold">AI 增强</span>
                            <button class="epic-btn h-8 rounded text-xs bg-purple-600/20 text-purple-400 border-purple-600/50 hover:bg-purple-600 hover:text-white flex center gap-2" onclick="UI.toast('AI 补帧中...')"><i class="fa-solid fa-person-running"></i> 智能补帧</button>
                            <button class="epic-btn h-8 rounded text-xs bg-green-600/20 text-green-400 border-green-600/50 hover:bg-green-600 hover:text-white flex center gap-2" onclick="UI.toast('背景移除中...')"><i class="fa-solid fa-eraser"></i> 移除背景</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Bottom: Timeline -->
            <div class="flex-1 bg-[#1f1f22] flex col border-t border-black relative">
                <!-- Timeline Toolbar -->
                <div class="h-10 bg-[#27272a] border-b border-black flex items-center px-4 text-xs text-gray-400 justify-between">
                    <div class="flex gap-4">
                        <div class="flex gap-1 bg-black/30 p-0.5 rounded">
                            <button class="w-7 h-7 flex center hover:bg-white/10 rounded text-blue-400"><i class="fa-solid fa-arrow-pointer"></i></button>
                            <button class="w-7 h-7 flex center hover:bg-white/10 rounded"><i class="fa-solid fa-scissors"></i></button>
                            <button class="w-7 h-7 flex center hover:bg-white/10 rounded"><i class="fa-solid fa-hand"></i></button>
                        </div>
                        <div class="w-px h-4 bg-white/10 my-auto"></div>
                        <button class="flex items-center gap-2 hover:text-white"><i class="fa-solid fa-magnet"></i> 吸附</button>
                    </div>
                    <div class="flex items-center gap-4">
                        <input type="range" class="w-32 accent-gray-500 h-1 bg-black/50 rounded-lg appearance-none" value="50">
                        <i class="fa-solid fa-minus text-[10px]"></i>
                        <i class="fa-solid fa-plus text-[10px]"></i>
                    </div>
                </div>
                
                <!-- Timeline Tracks -->
                <div class="flex-1 relative overflow-auto p-0 scrollbar-thin flex" id="timeline-container">
                    <!-- Track Headers -->
                    <div class="w-32 bg-[#27272a] border-r border-black flex col z-20 shrink-0">
                        <div class="h-8 border-b border-black/50 bg-[#202023]"></div>
                        <div class="h-24 border-b border-black bg-[#27272a] flex flex-col justify-center px-3 relative group">
                            <span class="text-[10px] font-bold text-gray-400 mb-1">视频轨道 1</span>
                            <div class="flex gap-2 text-[10px] text-dim">
                                <i class="fa-solid fa-eye hover:text-white cursor-pointer"></i>
                                <i class="fa-solid fa-lock hover:text-white cursor-pointer"></i>
                            </div>
                        </div>
                        <div class="h-24 border-b border-black bg-[#27272a] flex flex-col justify-center px-3 relative group">
                            <span class="text-[10px] font-bold text-gray-400 mb-1">音频轨道 1</span>
                            <div class="flex gap-2 text-[10px] text-dim">
                                <i class="fa-solid fa-volume-high hover:text-white cursor-pointer"></i>
                                <i class="fa-solid fa-lock hover:text-white cursor-pointer"></i>
                            </div>
                        </div>
                    </div>

                    <!-- Track Content -->
                    <div class="flex-1 bg-[#18181b] relative min-w-[1000px]">
                        <!-- Ruler -->
                        <div class="h-8 bg-[#202023] border-b border-black/50 flex items-end text-[9px] text-dim font-mono select-none sticky top-0 z-10">
                            ${Array.from({length: 20}).map((_,i)=>`<div class="flex-1 border-l border-white/10 pl-1 h-4">${i*5}s</div>`).join('')}
                        </div>
                        
                        <!-- Playhead -->
                        <div class="absolute top-0 bottom-0 left-[100px] w-px bg-red-500 z-30 pointer-events-none shadow-[0_0_10px_rgba(239,68,68,0.5)] h-full">
                            <div class="absolute -top-0 -left-1.5 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-red-500"></div>
                        </div>

                        <!-- Tracks -->
                        <div class="h-24 border-b border-black/50 relative track bg-[#1a1a1d] group" ondrop="Modules.video.drop(event)" ondragover="event.preventDefault()" data-type="video">
                            <div class="absolute top-0 left-0 right-0 h-full bg-white/5 opacity-0 group-hover:opacity-10 pointer-events-none"></div>
                        </div>
                        <div class="h-24 border-b border-black/50 relative track bg-[#1a1a1d] group" ondrop="Modules.video.drop(event)" ondragover="event.preventDefault()" data-type="audio">
                            <div class="absolute top-0 left-0 right-0 h-full bg-white/5 opacity-0 group-hover:opacity-10 pointer-events-none"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    setTab: (t) => {
        Modules.video.currentTab = t;
        App.nav('video');
    },
    assets: [],
    clips: [],
    isPlaying: false,
    currentTime: 0,
    handleUpload: (input) => {
        Array.from(input.files).forEach(file => {
            const url = URL.createObjectURL(file);
            const type = file.type.startsWith('video') ? 'video' : file.type.startsWith('audio') ? 'audio' : 'image';
            const asset = { id: Utils.uuid(), name: file.name, url, type };
            Modules.video.assets.push(asset);
            
            const el = document.createElement('div');
            el.className = "aspect-square bg-black/50 rounded-lg flex center text-xs text-gray-500 hover:text-white cursor-pointer border border-transparent hover:border-blue-500 transition-colors group relative overflow-hidden";
            el.draggable = true;
            el.ondragstart = (e) => { e.dataTransfer.setData('assetId', asset.id); };
            el.onclick = () => Modules.video.preview(asset);
            
            if(type === 'image') el.style.backgroundImage = `url(${url})`;
            el.style.backgroundSize = 'cover';
            
            el.innerHTML = type === 'video' ? '<i class="fa-solid fa-film text-2xl opacity-50 drop-shadow-md"></i>' :
                           type === 'audio' ? '<i class="fa-solid fa-music text-2xl opacity-50"></i>' : '';
            
            el.innerHTML += `<div class="absolute bottom-0 left-0 right-0 bg-black/80 text-[9px] p-1 truncate text-center text-gray-300">${file.name}</div>`;
            
            document.getElementById('video-assets').appendChild(el);
        });
    },
    drop: (e) => {
        e.preventDefault();
        const assetId = e.dataTransfer.getData('assetId');
        const asset = Modules.video.assets.find(a => a.id === assetId);
        if(!asset) return;
        
        // Calculate drop position
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left + e.currentTarget.scrollLeft; // Account for scroll if needed
        
        const clip = document.createElement('div');
        const colorClass = asset.type === 'audio' ? 'bg-green-900/60 border-green-500/50' : 'bg-blue-900/60 border-blue-500/50';
        
        clip.className = `absolute top-1 bottom-1 ${colorClass} border rounded overflow-hidden cursor-pointer hover:brightness-110 flex items-center px-2 shadow-sm select-none`;
        clip.style.left = x + 'px';
        clip.style.width = '120px'; // Default duration
        clip.innerHTML = `
            <div class="flex items-center gap-2 overflow-hidden w-full">
                ${asset.type === 'image' ? `<div class="w-8 h-full bg-cover bg-center shrink-0 rounded-sm" style="background-image:url(${asset.url})"></div>` : ''}
                <span class="text-[10px] text-white truncate font-mono">${asset.name}</span>
            </div>
        `;
        clip.onclick = (ev) => { ev.stopPropagation(); Modules.video.preview(asset); };
        
        e.currentTarget.appendChild(clip);
    },
    preview: (asset) => {
        const v = document.getElementById('video-preview');
        const p = document.getElementById('video-placeholder');
        if(asset.type === 'video' || asset.type === 'audio') {
            v.src = asset.url;
            v.classList.remove('hidden');
            p.classList.add('hidden');
            v.play();
            Modules.video.isPlaying = true;
            Modules.video.updatePlayBtn();
        } else if (asset.type === 'image') {
             // Image preview logic (simplified for video element)
             v.classList.add('hidden');
             p.classList.remove('hidden');
             p.style.backgroundImage = `url(${asset.url})`;
             p.style.backgroundSize = 'contain';
             p.style.backgroundRepeat = 'no-repeat';
             p.innerHTML = '';
        }
    },
    togglePlay: () => {
        const v = document.getElementById('video-preview');
        if(v.paused) { v.play(); Modules.video.isPlaying = true; }
        else { v.pause(); Modules.video.isPlaying = false; }
        Modules.video.updatePlayBtn();
    },
    updatePlayBtn: () => {
        const icon = document.getElementById('video-play-btn');
        icon.className = Modules.video.isPlaying ? "fa-solid fa-pause text-xl cursor-pointer hover:text-blue-500" : "fa-solid fa-play text-xl cursor-pointer hover:text-blue-500";
    },
    frame: (dir) => {
        const v = document.getElementById('video-preview');
        v.currentTime += dir * 0.1;
    },
    seek: (e) => {
        // Seek logic
    }
};

Modules.trading = {
    view: 'dashboard',
    render: () => `
        <div class="h-full flex bg-[#0b0e11] text-[#cfd3d8] font-sans">
            <!-- Sidebar Navigation -->
            <div class="w-20 bg-[#1e2329] border-r border-[#2b3139] flex col items-center py-6 gap-6 z-20 overflow-y-auto scrollbar-hide">
                <div class="text-[#f0b90b] text-3xl mb-4 drop-shadow-[0_0_10px_rgba(240,185,11,0.3)] shrink-0"><i class="fa-solid fa-chart-line"></i></div>
                ${[
                    {id:'dashboard', icon:'fa-chart-pie', tip:'市场看板'},
                    {id:'market', icon:'fa-globe', tip:'全市场行情'},
                    {id:'strategy', icon:'fa-code', tip:'策略工坊'},
                    {id:'backtest', icon:'fa-flask', tip:'回测引擎'},
                    {id:'simulate', icon:'fa-gamepad', tip:'模拟交易'},
                    {id:'data', icon:'fa-database', tip:'数据中心'},
                    {id:'research', icon:'fa-book-open', tip:'研报分析'},
                    {id:'news', icon:'fa-newspaper', tip:'新闻舆情'},
                    {id:'community', icon:'fa-users', tip:'量化社区'},
                    {id:'settings', icon:'fa-gear', tip:'系统设置'}
                ].map(i => `
                    <button class="w-12 h-12 rounded-xl flex center text-xl transition-all shrink-0 ${Modules.trading.view===i.id?'bg-[#2b3139] text-[#f0b90b] shadow-[0_0_15px_rgba(0,0,0,0.5)] border-l-4 border-[#f0b90b]':'text-gray-500 hover:text-white hover:bg-[#2b3139]'}" onclick="Modules.trading.setView('${i.id}')" title="${i.tip}">
                        <i class="fa-solid ${i.icon}"></i>
                    </button>
                `).join('')}
            </div>

            <!-- Content Area -->
            <div class="flex-1 flex col relative overflow-hidden bg-[#0b0e11]" id="trading-content">
                ${Modules.trading.renderContent()}
            </div>
        </div>
    `,
    setView: (v) => {
        Modules.trading.view = v;
        const content = document.getElementById('trading-content');
        if (content) {
            content.innerHTML = Modules.trading.renderContent();
        } else {
            App.nav('trading');
        }
        // Update sidebar active state
        const sidebar = document.querySelector('#module-view-trading .w-20');
        if(sidebar) {
             // Simple re-render of sidebar buttons or class toggle
             const buttons = sidebar.querySelectorAll('button');
             buttons.forEach(btn => {
                 if(btn.onclick.toString().includes(v)) {
                     btn.className = "w-12 h-12 rounded-xl flex center text-xl transition-all bg-[#2b3139] text-[#f0b90b] shadow-[0_0_15px_rgba(0,0,0,0.5)] border-l-4 border-[#f0b90b]";
                 } else {
                     btn.className = "w-12 h-12 rounded-xl flex center text-xl transition-all text-gray-500 hover:text-white hover:bg-[#2b3139]";
                 }
             });
        }
    },
    runBacktest: () => {
        UI.toast('正在初始化回测环境...');
        setTimeout(() => {
            Modules.trading.setView('backtest');
            UI.toast('回测完成');
        }, 1500);
    },
    renderContent: () => {
        const v = Modules.trading.view;
        
        // 1. DASHBOARD - Ultimate Pro Trading Terminal
        if(v === 'dashboard') return `
            <div class="flex-1 grid grid-cols-12 grid-rows-[40px_1fr_250px] gap-1 p-1 bg-[#0b0e11] h-full overflow-hidden">
                <!-- Top Bar: Ticker & Global Stats -->
                <div class="col-span-12 bg-[#161a1e] border border-[#2b3139] flex items-center px-4 justify-between">
                    <div class="flex items-center gap-6 overflow-hidden whitespace-nowrap text-xs font-mono">
                        <span class="flex items-center gap-2"><i class="fa-brands fa-bitcoin text-[#f0b90b]"></i> <span class="text-white font-bold">BTC/USDT</span> <span class="text-[#0ecb81]">68,450.00 (+2.4%)</span></span>
                        <span class="flex items-center gap-2"><i class="fa-brands fa-ethereum text-[#627eea]"></i> <span class="text-white font-bold">ETH/USDT</span> <span class="text-[#f6465d]">3,450.00 (-1.2%)</span></span>
                        <span class="flex items-center gap-2"><span class="text-white font-bold">SOL/USDT</span> <span class="text-[#0ecb81]">145.20 (+5.6%)</span></span>
                        <span class="text-gray-500">|</span>
                        <span class="text-dim">24h Vol: <span class="text-white">$42.5B</span></span>
                        <span class="text-dim">Gas: <span class="text-blue-400">15 gwei</span></span>
                    </div>
                    <div class="flex items-center gap-3 text-xs">
                        <button class="bg-[#2b3139] hover:bg-[#383e47] text-white px-3 py-1 rounded transition-colors flex items-center gap-2"><i class="fa-solid fa-wallet text-[#f0b90b]"></i> 连接钱包</button>
                        <div class="w-2 h-2 rounded-full bg-[#0ecb81] animate-pulse"></div>
                    </div>
                </div>

                <!-- Middle Left: Professional Chart (TradingView Style) -->
                <div class="col-span-9 bg-[#161a1e] border border-[#2b3139] relative flex flex-col">
                    <!-- Chart Toolbar -->
                    <div class="h-10 border-b border-[#2b3139] flex justify-between items-center px-2 bg-[#1e2329]">
                        <div class="flex items-center gap-1">
                            <div class="flex bg-[#0b0e11] rounded p-0.5 mr-2">
                                <button class="px-2 py-0.5 text-[10px] text-gray-400 hover:text-white hover:bg-[#2b3139] rounded-sm">1m</button>
                                <button class="px-2 py-0.5 text-[10px] text-gray-400 hover:text-white hover:bg-[#2b3139] rounded-sm">15m</button>
                                <button class="px-2 py-0.5 text-[10px] text-[#f0b90b] bg-[#2b3139] rounded-sm font-bold">1H</button>
                                <button class="px-2 py-0.5 text-[10px] text-gray-400 hover:text-white hover:bg-[#2b3139] rounded-sm">4H</button>
                                <button class="px-2 py-0.5 text-[10px] text-gray-400 hover:text-white hover:bg-[#2b3139] rounded-sm">1D</button>
                            </div>
                            <div class="w-px h-4 bg-[#2b3139] mx-1"></div>
                            <button class="w-7 h-7 flex center text-gray-400 hover:text-white hover:bg-[#2b3139] rounded"><i class="fa-solid fa-chart-candlestick"></i></button>
                            <button class="w-7 h-7 flex center text-gray-400 hover:text-white hover:bg-[#2b3139] rounded"><i class="fa-solid fa-compass-drafting"></i></button>
                            <button class="w-7 h-7 flex center text-gray-400 hover:text-white hover:bg-[#2b3139] rounded"><i class="fa-solid fa-fx"></i></button>
                        </div>
                        <div class="flex gap-2">
                            <button class="text-xs bg-blue-600/20 text-blue-400 border border-blue-600/50 px-2 py-1 rounded hover:bg-blue-600 hover:text-white transition-all"><i class="fa-solid fa-robot mr-1"></i> AI 预测</button>
                            <button class="w-7 h-7 flex center text-gray-400 hover:text-white hover:bg-[#2b3139] rounded"><i class="fa-solid fa-camera"></i></button>
                            <button class="w-7 h-7 flex center text-gray-400 hover:text-white hover:bg-[#2b3139] rounded"><i class="fa-solid fa-gear"></i></button>
                        </div>
                    </div>
                    <!-- Chart Canvas Area -->
                    <div class="flex-1 relative bg-[#161a1e] cursor-crosshair group">
                        <div id="main-chart" class="w-full h-full"></div>
                        <!-- Floating Tooltip (Mock) -->
                        <div class="absolute top-4 left-4 bg-[#0b0e11]/80 backdrop-blur border border-[#2b3139] p-2 rounded text-[10px] font-mono pointer-events-none hidden group-hover:block">
                            <div class="flex gap-4">
                                <span class="text-white">O: <span class="text-[#0ecb81]">68,420.5</span></span>
                                <span class="text-white">H: <span class="text-[#0ecb81]">68,550.0</span></span>
                                <span class="text-white">L: <span class="text-[#f6465d]">68,100.0</span></span>
                                <span class="text-white">C: <span class="text-[#0ecb81]">68,450.0</span></span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Middle Right: Order Book & Trades -->
                <div class="col-span-3 bg-[#161a1e] border border-[#2b3139] flex flex-col">
                    <div class="flex border-b border-[#2b3139]">
                        <button class="flex-1 py-2 text-xs font-bold text-white border-b-2 border-[#f0b90b] bg-[#1e2329]">订单簿 (Order Book)</button>
                        <button class="flex-1 py-2 text-xs font-bold text-gray-500 hover:text-white hover:bg-[#1e2329]">最新成交 (Trades)</button>
                    </div>
                    
                    <!-- Order Book Header -->
                    <div class="flex justify-between px-3 py-1.5 text-[10px] text-gray-500 font-bold">
                        <span>价格(Price)</span>
                        <span>数量(Amount)</span>
                        <span>总计(Total)</span>
                    </div>
                    
                    <!-- Asks (Red) -->
                    <div class="flex-1 overflow-hidden flex flex-col-reverse relative">
                        <div class="absolute inset-0 overflow-y-auto scrollbar-hide flex flex-col-reverse" id="ob-asks">
                            ${[...Array(15)].map((_, i) => {
                                const price = (68450 + i * 0.5).toFixed(1);
                                const amount = (Math.random() * 0.5).toFixed(4);
                                const total = (price * amount).toFixed(0);
                                const width = Math.random() * 100;
                                return `
                                <div class="flex justify-between px-3 py-0.5 text-[11px] hover:bg-[#2b3139] cursor-pointer relative">
                                    <div class="absolute top-0 right-0 bottom-0 bg-[#f6465d]/10" style="width: ${width}%"></div>
                                    <span class="text-[#f6465d] z-10">${price}</span>
                                    <span class="text-white z-10">${amount}</span>
                                    <span class="text-gray-500 z-10">${total}</span>
                                </div>`;
                            }).join('')}
                        </div>
                    </div>
                    
                    <!-- Current Price -->
                    <div class="py-2 border-y border-[#2b3139] flex items-center justify-center gap-2 bg-[#1e2329]">
                        <span class="text-xl font-bold text-[#0ecb81]">68,450.00</span>
                        <i class="fa-solid fa-arrow-up text-xs text-[#0ecb81]"></i>
                        <span class="text-xs text-gray-400">$68,450.00</span>
                    </div>
                    
                    <!-- Bids (Green) -->
                    <div class="flex-1 overflow-hidden relative">
                        <div class="absolute inset-0 overflow-y-auto scrollbar-hide" id="ob-bids">
                            ${[...Array(15)].map((_, i) => {
                                const price = (68449.5 - i * 0.5).toFixed(1);
                                const amount = (Math.random() * 0.5).toFixed(4);
                                const total = (price * amount).toFixed(0);
                                const width = Math.random() * 100;
                                return `
                                <div class="flex justify-between px-3 py-0.5 text-[11px] hover:bg-[#2b3139] cursor-pointer relative">
                                    <div class="absolute top-0 right-0 bottom-0 bg-[#0ecb81]/10" style="width: ${width}%"></div>
                                    <span class="text-[#0ecb81] z-10">${price}</span>
                                    <span class="text-white z-10">${amount}</span>
                                    <span class="text-gray-500 z-10">${total}</span>
                                </div>`;
                            }).join('')}
                        </div>
                    </div>
                </div>

                <!-- Bottom: Trading Terminal & Positions -->
                <div class="col-span-12 bg-[#161a1e] border border-[#2b3139] flex flex-col">
                    <div class="h-9 bg-[#1e2329] border-b border-[#2b3139] flex items-center px-2">
                        <button class="px-4 h-full text-xs font-bold text-[#f0b90b] border-b-2 border-[#f0b90b]">当前持仓 (Positions)</button>
                        <button class="px-4 h-full text-xs font-bold text-gray-400 hover:text-white">当前委托 (Orders)</button>
                        <button class="px-4 h-full text-xs font-bold text-gray-400 hover:text-white">历史委托</button>
                        <button class="px-4 h-full text-xs font-bold text-gray-400 hover:text-white">成交记录</button>
                        <div class="flex-1"></div>
                        <div class="flex items-center gap-2 px-2 text-xs text-dim">
                            <span>余额: <span class="text-white font-bold">$124,500.00</span></span>
                            <span class="bg-green-500/20 text-green-500 px-1 rounded">PnL +12%</span>
                        </div>
                    </div>
                    
                    <div class="flex-1 flex overflow-hidden">
                        <!-- Positions Table -->
                        <div class="flex-1 overflow-auto">
                            <table class="w-full text-left text-xs">
                                <thead class="text-gray-500 bg-[#0b0e11] sticky top-0">
                                    <tr>
                                        <th class="p-2 pl-4">交易对 (Symbol)</th>
                                        <th class="p-2">持仓量 (Size)</th>
                                        <th class="p-2">开仓价 (Entry Price)</th>
                                        <th class="p-2">标记价 (Mark Price)</th>
                                        <th class="p-2">强平价 (Liq. Price)</th>
                                        <th class="p-2">保证金 (Margin)</th>
                                        <th class="p-2">未实现盈亏 (PNL)</th>
                                        <th class="p-2 text-right pr-4">操作 (Action)</th>
                                    </tr>
                                </thead>
                                <tbody class="text-gray-200">
                                    <tr class="hover:bg-[#2b3139]/50 border-b border-[#2b3139]/50">
                                        <td class="p-2 pl-4 flex items-center gap-2">
                                            <div class="w-1 h-4 bg-[#0ecb81] rounded-full"></div>
                                            <span class="font-bold">BTCUSDT</span>
                                            <span class="bg-[#2b3139] text-[#0ecb81] px-1 rounded text-[9px]">20x</span>
                                        </td>
                                        <td class="p-2 text-[#0ecb81]">0.500 BTC</td>
                                        <td class="p-2">67,200.00</td>
                                        <td class="p-2">68,450.00</td>
                                        <td class="p-2 text-orange-500">64,100.00</td>
                                        <td class="p-2">1,711.25 USDT</td>
                                        <td class="p-2 text-[#0ecb81] font-bold">+625.00 (+36.5%)</td>
                                        <td class="p-2 text-right pr-4">
                                            <button class="text-blue-400 hover:text-white mr-2">平仓</button>
                                            <button class="text-[#f6465d] hover:text-white">市价全平</button>
                                        </td>
                                    </tr>
                                    <tr class="hover:bg-[#2b3139]/50 border-b border-[#2b3139]/50">
                                        <td class="p-2 pl-4 flex items-center gap-2">
                                            <div class="w-1 h-4 bg-[#f6465d] rounded-full"></div>
                                            <span class="font-bold">ETHUSDT</span>
                                            <span class="bg-[#2b3139] text-[#0ecb81] px-1 rounded text-[9px]">10x</span>
                                        </td>
                                        <td class="p-2 text-[#f6465d]">-10.00 ETH</td>
                                        <td class="p-2">3,500.00</td>
                                        <td class="p-2">3,450.00</td>
                                        <td class="p-2 text-orange-500">3,850.00</td>
                                        <td class="p-2">3,450.00 USDT</td>
                                        <td class="p-2 text-[#0ecb81] font-bold">+500.00 (+14.5%)</td>
                                        <td class="p-2 text-right pr-4">
                                            <button class="text-blue-400 hover:text-white mr-2">平仓</button>
                                            <button class="text-[#f6465d] hover:text-white">市价全平</button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        
                        <!-- Mini Order Form -->
                        <div class="w-64 border-l border-[#2b3139] bg-[#161a1e] p-3 flex flex-col gap-3">
                            <div class="flex bg-[#0b0e11] p-1 rounded">
                                <button class="flex-1 py-1 text-xs font-bold bg-[#0ecb81] text-white rounded shadow">买入 / 做多</button>
                                <button class="flex-1 py-1 text-xs font-bold text-gray-400 hover:text-white">卖出 / 做空</button>
                            </div>
                            <div class="flex justify-between text-[10px] text-gray-400">
                                <span>可用: 45,200 USDT</span>
                            </div>
                            <div class="flex flex-col gap-2">
                                <div class="bg-[#0b0e11] border border-[#2b3139] rounded px-2 py-1.5 flex justify-between items-center">
                                    <span class="text-xs text-gray-500">价格</span>
                                    <input class="bg-transparent text-right text-white text-xs w-20 outline-none" value="68450.0">
                                </div>
                                <div class="bg-[#0b0e11] border border-[#2b3139] rounded px-2 py-1.5 flex justify-between items-center">
                                    <span class="text-xs text-gray-500">数量 (BTC)</span>
                                    <input class="bg-transparent text-right text-white text-xs w-20 outline-none" placeholder="0.00">
                                </div>
                                <input type="range" class="w-full h-1 bg-[#2b3139] rounded-lg appearance-none cursor-pointer accent-[#0ecb81]">
                            </div>
                            <button class="w-full py-2 bg-[#0ecb81] hover:bg-[#0ecb81]/80 text-white font-bold text-xs rounded transition-colors mt-auto">
                                买入 BTC
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 2. STRATEGY LAB - Upgraded UI
        if(v === 'strategy') return `
            <div class="flex-1 flex overflow-hidden">
                <!-- File Tree -->
                <div class="w-56 bg-[#161a1e] border-r border-[#2b3139] flex flex-col">
                    <div class="p-3 border-b border-[#2b3139] text-xs font-bold text-gray-400 uppercase flex justify-between items-center">
                        <span>Strategies</span>
                        <div class="flex gap-2">
                            <i class="fa-solid fa-file-circle-plus hover:text-white cursor-pointer" title="New File"></i>
                            <i class="fa-solid fa-folder-plus hover:text-white cursor-pointer"></i>
                        </div>
                    </div>
                    <div class="flex-1 p-2 space-y-1 overflow-y-auto">
                        ${['dual_ma.py|python|blue-400', 'rsi_mean_rev.py|python|blue-400', 'grid_trading.py|python|blue-400', 'ml_predictor.py|python|blue-400', 'config.json|file-code|yellow-500'].map(f => {
                            const [name, icon, color] = f.split('|');
                            return `
                            <div class="text-xs text-gray-400 hover:text-white hover:bg-[#2b3139] px-3 py-2 rounded cursor-pointer flex items-center gap-2 transition-colors ${name==='dual_ma.py'?'bg-[#2b3139] text-white border-l-2 border-[#f0b90b]':'border-l-2 border-transparent'}">
                                <i class="fa-brands fa-${icon} text-${color}"></i> ${name}
                            </div>`;
                        }).join('')}
                    </div>
                </div>
                
                <!-- Editor -->
                <div class="flex-1 flex flex-col bg-[#0d1117] min-w-0">
                    <div class="h-10 bg-[#161a1e] border-b border-[#2b3139] flex items-center px-4 justify-between shrink-0">
                        <div class="flex gap-1">
                            <div class="px-3 py-2 bg-[#0d1117] border-t-2 border-[#f0b90b] text-xs text-white font-bold flex items-center gap-2 cursor-pointer">
                                <i class="fa-brands fa-python text-blue-400"></i> dual_ma.py <i class="fa-solid fa-xmark ml-2 hover:text-red-500"></i>
                            </div>
                            <div class="px-3 py-2 text-xs text-gray-500 hover:text-white hover:bg-[#2b3139] flex items-center gap-2 cursor-pointer transition-colors">
                                <i class="fa-solid fa-file-code text-yellow-500"></i> config.json
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button class="btn btn-xs bg-purple-600/20 text-purple-400 border border-purple-600/50 hover:bg-purple-600 hover:text-white" onclick="Modules.trading.generateStrategy()"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i> AI Generate</button>
                            <button class="btn btn-xs bg-green-600/20 text-green-400 border border-green-600/50 hover:bg-green-600 hover:text-white" onclick="Modules.trading.runBacktest()"><i class="fa-solid fa-play mr-1"></i> Backtest</button>
                            <button class="btn btn-xs bg-blue-600/20 text-blue-400 border border-blue-600/50 hover:bg-blue-600 hover:text-white" onclick="Modules.trading.saveStrategy()"><i class="fa-solid fa-save mr-1"></i> Save</button>
                        </div>
                    </div>
                    
                    <div class="flex-1 relative">
                        <!-- Line Numbers -->
                        <div class="absolute left-0 top-0 bottom-0 w-10 bg-[#161a1e] text-gray-600 text-right pr-2 pt-4 text-xs font-mono select-none border-r border-[#2b3139] leading-6">
                            ${Array.from({length:30}, (_,i)=>i+1).join('<br>')}
                        </div>
                        <textarea id="qt-strategy-code" class="w-full h-full bg-transparent pl-12 p-4 font-mono text-sm text-[#e6edf3] resize-none focus:outline-none leading-6 whitespace-pre" spellcheck="false">
# 双均线交叉策略 (Dual Moving Average Crossover)
# Author: Genesis AI
# Created: 2024-05-20

import talib
import numpy as np
from genesis.api import *

def initialize(context):
    """
    初始化策略上下文
    """
    context.symbol = 'BTCUSDT'
    context.short_window = 10  # 短周期
    context.long_window = 30   # 长周期
    context.stop_loss = 0.05   # 止损 5%
    
    log.info(f"Strategy initialized for {context.symbol}")

def handle_data(context, data):
    """
    主交易逻辑，每个 Tick 或 Bar 调用一次
    """
    # 获取历史收盘价数据
    prices = data.history(context.symbol, 'close', context.long_window + 1, '1d')
    
    # 计算移动平均线
    short_ma = talib.SMA(prices, timeperiod=context.short_window)
    long_ma = talib.SMA(prices, timeperiod=context.long_window)
    
    # 获取当前持仓
    position = context.portfolio.positions[context.symbol].amount
    
    # 交易信号判断
    # 金叉：短线上穿长线
    if short_ma[-1] > long_ma[-1] and short_ma[-2] <= long_ma[-2]:
        if position <= 0:
            order_target_percent(context.symbol, 1.0)
            log.info(f"GOLDEN CROSS: Buying {context.symbol} at {prices[-1]}")
            
    # 死叉：短线下穿长线
    elif short_ma[-1] < long_ma[-1] and short_ma[-2] >= long_ma[-2]:
        if position >= 0:
            order_target_percent(context.symbol, 0)
            log.info(f"DEATH CROSS: Selling {context.symbol} at {prices[-1]}")
            
    # 止损逻辑
    if position > 0 and prices[-1] < context.avg_cost * (1 - context.stop_loss):
        order_target_percent(context.symbol, 0)
        log.warn(f"STOP LOSS TRIGGERED: Selling {context.symbol}")
                        </textarea>
                    </div>
                </div>
                
                <!-- Inspector -->
                <div class="w-72 bg-[#161a1e] border-l border-[#2b3139] flex flex-col">
                    <div class="flex-1 overflow-y-auto p-4">
                        <div class="text-xs font-bold text-white uppercase mb-3 flex items-center gap-2"><i class="fa-solid fa-flask text-[#f0b90b]"></i> Backtest Config</div>
                        <div class="space-y-3 mb-6">
                            <div>
                                <div class="text-[10px] text-gray-400 mb-1">Initial Cash</div>
                                <div class="flex items-center bg-[#0b0e11] border border-[#2b3139] rounded px-2">
                                    <span class="text-xs text-gray-500">$</span>
                                    <input type="number" class="w-full bg-transparent border-none py-1.5 text-xs text-white focus:outline-none" value="10000">
                                </div>
                            </div>
                            <div>
                                <div class="text-[10px] text-gray-400 mb-1">Date Range</div>
                                <div class="flex gap-2">
                                    <input type="date" class="w-full bg-[#0b0e11] border border-[#2b3139] rounded px-1 py-1.5 text-[10px] text-white" value="2023-01-01">
                                    <span class="text-gray-500 self-center">-</span>
                                    <input type="date" class="w-full bg-[#0b0e11] border border-[#2b3139] rounded px-1 py-1.5 text-[10px] text-white" value="2023-12-31">
                                </div>
                            </div>
                            <div>
                                <div class="text-[10px] text-gray-400 mb-1">Slippage & Comm.</div>
                                <div class="flex items-center bg-[#0b0e11] border border-[#2b3139] rounded px-2">
                                    <input type="number" class="w-full bg-transparent border-none py-1.5 text-xs text-white focus:outline-none" value="0.001">
                                    <span class="text-xs text-gray-500">%</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="border-t border-[#2b3139] pt-4">
                            <div class="text-xs font-bold text-white uppercase mb-3 flex items-center gap-2"><i class="fa-solid fa-sliders text-blue-400"></i> Hyperparameters</div>
                            <div class="space-y-3">
                                <div class="flex justify-between items-center">
                                    <span class="text-[10px] text-gray-400">Short Window</span>
                                    <input type="number" class="w-16 bg-[#0b0e11] border border-[#2b3139] rounded px-2 py-1 text-xs text-white text-right" value="10">
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-[10px] text-gray-400">Long Window</span>
                                    <input type="number" class="w-16 bg-[#0b0e11] border border-[#2b3139] rounded px-2 py-1 text-xs text-white text-right" value="30">
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-[10px] text-gray-400">Stop Loss %</span>
                                    <input type="number" class="w-16 bg-[#0b0e11] border border-[#2b3139] rounded px-2 py-1 text-xs text-white text-right" value="5.0">
                                </div>
                            </div>
                            <button class="btn btn-sm w-full mt-4 bg-[#2b3139] hover:bg-[#383e47] text-white border border-[#f0b90b]/30 text-xs"><i class="fa-solid fa-microchip mr-2 text-[#f0b90b]"></i> Optimize Params</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 3. BACKTEST - Detailed Reports
        if(v === 'backtest') return `
            <div class="flex-1 flex col p-8 gap-6 bg-[#0b0e11] overflow-y-auto">
                <div class="grid grid-cols-4 gap-6">
                    <div class="bg-[#161a1e] p-5 rounded-xl border border-[#2b3139] shadow-lg relative overflow-hidden">
                        <div class="absolute right-0 top-0 p-4 opacity-10"><i class="fa-solid fa-sack-dollar text-6xl text-[#0ecb81]"></i></div>
                        <div class="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Return</div>
                        <div class="text-3xl font-bold text-[#0ecb81]">+ 145.2%</div>
                        <div class="text-[10px] text-gray-500 mt-2">Benchmark: +12.5%</div>
                    </div>
                    <div class="bg-[#161a1e] p-5 rounded-xl border border-[#2b3139] shadow-lg">
                        <div class="text-xs text-gray-500 uppercase tracking-wider mb-1">Sharpe Ratio</div>
                        <div class="text-3xl font-bold text-white">2.45</div>
                        <div class="text-[10px] text-gray-500 mt-2">Risk Adjusted Return</div>
                    </div>
                    <div class="bg-[#161a1e] p-5 rounded-xl border border-[#2b3139] shadow-lg">
                        <div class="text-xs text-gray-500 uppercase tracking-wider mb-1">Max Drawdown</div>
                        <div class="text-3xl font-bold text-[#f6465d]">- 12.4%</div>
                        <div class="text-[10px] text-gray-500 mt-2">Peak to Trough</div>
                    </div>
                    <div class="bg-[#161a1e] p-5 rounded-xl border border-[#2b3139] shadow-lg">
                        <div class="text-xs text-gray-500 uppercase tracking-wider mb-1">Win Rate</div>
                        <div class="text-3xl font-bold text-blue-400">58%</div>
                        <div class="text-[10px] text-gray-500 mt-2">142 Trades Total</div>
                    </div>
                </div>
                
                <div class="h-96 bg-[#161a1e] border border-[#2b3139] rounded-xl p-6 relative shadow-xl">
                    <div class="flex justify-between items-center mb-4">
                        <div class="text-sm font-bold text-white flex items-center gap-2"><i class="fa-solid fa-chart-area text-[#f0b90b]"></i> Equity Curve</div>
                        <div class="flex gap-2 text-xs text-gray-500">
                            <span class="flex items-center gap-1"><div class="w-2 h-2 rounded-full bg-[#0ecb81]"></div> Strategy</span>
                            <span class="flex items-center gap-1"><div class="w-2 h-2 rounded-full bg-gray-600"></div> Benchmark</span>
                        </div>
                    </div>
                    <div id="bt-chart" class="w-full h-full pb-8"></div>
                </div>
                
                <div class="flex-1 bg-[#161a1e] border border-[#2b3139] rounded-xl flex col overflow-hidden shadow-xl">
                    <div class="h-12 bg-[#1e2329] flex items-center px-6 text-sm font-bold text-white border-b border-[#2b3139]">
                        <i class="fa-solid fa-list-ul mr-2 text-blue-400"></i> Transaction History
                    </div>
                    <div class="flex-1 overflow-y-auto p-0">
                        <table class="w-full text-xs text-left">
                            <thead class="bg-[#0b0e11] text-gray-500 sticky top-0 font-bold uppercase">
                                <tr><th class="p-3 pl-6">Date</th><th class="p-3">Symbol</th><th class="p-3">Side</th><th class="p-3">Price</th><th class="p-3">Amount</th><th class="p-3">PnL</th></tr>
                            </thead>
                            <tbody class="divide-y divide-[#2b3139] text-gray-300">
                                ${[...Array(20)].map((_,i)=>`
                                    <tr class="hover:bg-[#2b3139] transition-colors">
                                        <td class="p-3 pl-6 font-mono text-dim">2024-05-${10+i} 14:30</td>
                                        <td class="p-3 font-bold">BTCUSDT</td>
                                        <td class="p-3"><span class="px-2 py-0.5 rounded ${i%2==0?'bg-[#0ecb81]/20 text-[#0ecb81]':'bg-[#f6465d]/20 text-[#f6465d]'} font-bold">${i%2==0?'BUY':'SELL'}</span></td>
                                        <td class="p-3 font-mono">68,${400+i*10}.00</td>
                                        <td class="p-3 font-mono">0.5</td>
                                        <td class="p-3 font-mono ${Math.random()>0.4?'text-[#0ecb81]':'text-[#f6465d]'}">${(Math.random()*500 - 100).toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        // 4. MARKET (全市场行情)
        if(v === 'market') return `
            <div class="flex-1 bg-[#0b0e11] p-6 text-[#cfd3d8] overflow-y-auto">
                <h2 class="text-2xl font-bold mb-6 text-white flex items-center gap-3"><i class="fa-solid fa-globe text-blue-500"></i> 全市场行情</h2>
                <div class="grid grid-cols-4 gap-4 mb-6">
                    ${['加密货币', '美股', '外汇', '大宗商品'].map(t => `<button class="btn bg-[#161a1e] hover:bg-[#2b3139] text-white border border-[#2b3139] py-3 rounded-lg font-bold">${t}</button>`).join('')}
                </div>
                <div class="bg-[#161a1e] rounded-xl border border-[#2b3139] overflow-hidden shadow-xl">
                    <table class="w-full text-sm text-left">
                        <thead class="bg-[#0b0e11] text-gray-500 font-bold uppercase text-xs">
                            <tr><th class="p-4 pl-6">代币</th><th class="p-4">最新价</th><th class="p-4">24h涨跌</th><th class="p-4">24h成交额</th><th class="p-4">市值</th><th class="p-4">操作</th></tr>
                        </thead>
                        <tbody class="divide-y divide-[#2b3139]">
                            ${[
                                {s:'BTC', p:'68,450.00', c:'+2.45%', v:'$42.5B', m:'$1.3T'},
                                {s:'ETH', p:'3,450.00', c:'-1.20%', v:'$18.2B', m:'$400B'},
                                {s:'SOL', p:'145.20', c:'+5.60%', v:'$4.5B', m:'$65B'},
                                {s:'BNB', p:'580.50', c:'+0.85%', v:'$1.2B', m:'$89B'},
                                {s:'XRP', p:'0.62', c:'-0.45%', v:'$800M', m:'$34B'},
                                {s:'ADA', p:'0.58', c:'+1.10%', v:'$600M', m:'$20B'},
                                {s:'DOGE', p:'0.15', c:'+3.20%', v:'$1.5B', m:'$22B'},
                                {s:'DOT', p:'0.45', c:'-0.50%', v:'$300M', m:'$6B'},
                                {s:'AVAX', p:'145.00', c:'+4.20%', v:'$800M', m:'$54B'},
                                {s:'LINK', p:'15.50', c:'+1.50%', v:'$400M', m:'$9B'}
                            ].map(row => `
                                <tr class="hover:bg-[#1e2329] transition-colors">
                                    <td class="p-4 pl-6 font-bold text-white flex items-center gap-2"><div class="w-6 h-6 rounded-full bg-white/10 flex center text-[10px]">${row.s[0]}</div> ${row.s}</td>
                                    <td class="p-4 font-mono">${row.p}</td>
                                    <td class="p-4 font-mono ${row.c.startsWith('+')?'text-[#0ecb81]':'text-[#f6465d]'}">${row.c}</td>
                                    <td class="p-4 text-dim">${row.v}</td>
                                    <td class="p-4 text-dim">${row.m}</td>
                                    <td class="p-4"><button class="text-blue-400 hover:text-white text-xs border border-blue-400/30 px-2 py-1 rounded hover:bg-blue-400/20">交易</button></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        // 5. SIMULATE (模拟交易)
        if(v === 'simulate') return `
            <div class="flex-1 bg-[#0b0e11] p-8 text-[#cfd3d8] overflow-y-auto flex col gap-6">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-white flex items-center gap-3"><i class="fa-solid fa-gamepad text-purple-500"></i> 模拟交易大赛</h2>
                    <div class="bg-[#1e2329] px-4 py-2 rounded-lg border border-[#2b3139] flex gap-4 text-sm">
                        <span>当前排名: <b class="text-[#f0b90b]">#42</b></span>
                        <span>总收益: <b class="text-[#0ecb81]">+145%</b></span>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-6">
                    <div class="bg-[#161a1e] p-6 rounded-xl border border-[#2b3139] flex col gap-4">
                        <h3 class="font-bold text-white mb-2">我的持仓 (模拟盘)</h3>
                        <div class="space-y-2">
                            <div class="flex justify-between items-center bg-[#0b0e11] p-3 rounded border border-[#2b3139]">
                                <div>
                                    <div class="font-bold text-white">BTC/USDT <span class="text-[10px] bg-green-500/20 text-green-500 px-1 rounded">20x</span></div>
                                    <div class="text-xs text-dim">开仓: 65,000</div>
                                </div>
                                <div class="text-right">
                                    <div class="font-bold text-[#0ecb81]">+3,450.00</div>
                                    <div class="text-xs text-dim">PNL</div>
                                </div>
                            </div>
                            <div class="flex justify-between items-center bg-[#0b0e11] p-3 rounded border border-[#2b3139]">
                                <div>
                                    <div class="font-bold text-white">ETH/USDT <span class="text-[10px] bg-red-500/20 text-red-500 px-1 rounded">10x</span></div>
                                    <div class="text-xs text-dim">开仓: 3,600</div>
                                </div>
                                <div class="text-right">
                                    <div class="font-bold text-[#f6465d]">-150.00</div>
                                    <div class="text-xs text-dim">PNL</div>
                                </div>
                            </div>
                        </div>
                        <button class="btn bg-[#f0b90b] text-black font-bold w-full mt-auto">一键重置账户</button>
                    </div>
                    
                    <div class="bg-[#161a1e] p-6 rounded-xl border border-[#2b3139] flex col gap-4">
                        <h3 class="font-bold text-white mb-2">排行榜 (Top Traders)</h3>
                        <div class="space-y-2">
                            ${[1,2,3,4,5].map(i => `
                                <div class="flex items-center gap-3 p-2 hover:bg-[#2b3139] rounded cursor-pointer">
                                    <div class="w-6 h-6 rounded-full bg-[#2b3139] flex center text-xs font-bold ${i===1?'text-[#f0b90b]':i===2?'text-gray-300':'text-orange-700'}">${i}</div>
                                    <div class="w-8 h-8 rounded-full bg-gray-700"></div>
                                    <div class="flex-1 font-bold text-sm">Trader_00${i}</div>
                                    <div class="font-mono text-[#0ecb81]">+${Math.floor(Math.random()*500+100)}%</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 6. NEWS (新闻舆情)
        if(v === 'news') return `
            <div class="flex-1 bg-[#0b0e11] p-8 text-[#cfd3d8] overflow-y-auto">
                <h2 class="text-2xl font-bold mb-6 text-white flex items-center gap-3"><i class="fa-solid fa-newspaper text-red-500"></i> 全球快讯</h2>
                <div class="grid grid-cols-3 gap-6">
                    <div class="col-span-2 space-y-4">
                        ${[
                            {t:'美联储宣布维持利率不变，暗示年内可能降息', s:'Macro', time:'10m ago'},
                            {t:'贝莱德比特币 ETF 交易量再创新高', s:'Crypto', time:'32m ago'},
                            {t:'以太坊基金会抛售 1000 ETH，市场恐慌情绪蔓延', s:'OnChain', time:'1h ago'},
                            {t:'某巨鲸地址增持 5000 BTC，成本均价 67,000', s:'Whale', time:'2h ago'},
                            {t:'Solana 网络再次发生拥堵，官方回应正在修复', s:'Tech', time:'3h ago'}
                        ].map(n => `
                            <div class="bg-[#161a1e] p-4 rounded-xl border border-[#2b3139] hover:border-gray-500 transition-all cursor-pointer">
                                <div class="flex justify-between items-start mb-2">
                                    <span class="text-xs font-bold bg-[#2b3139] px-2 py-0.5 rounded text-blue-400">${n.s}</span>
                                    <span class="text-xs text-dim">${n.time}</span>
                                </div>
                                <h3 class="text-lg font-bold text-white hover:text-[#f0b90b] transition-colors">${n.t}</h3>
                                <p class="text-sm text-gray-500 mt-2 line-clamp-2">详细内容摘要...</p>
                            </div>
                        `).join('')}
                    </div>
                    <div class="space-y-6">
                        <div class="bg-[#161a1e] p-4 rounded-xl border border-[#2b3139]">
                            <h3 class="font-bold text-white mb-4">市场情绪指数</h3>
                            <div class="flex center col">
                                <div class="text-4xl font-bold text-[#0ecb81] mb-2">72</div>
                                <div class="text-sm text-dim">贪婪 (Greed)</div>
                                <div class="w-full bg-[#2b3139] h-2 rounded-full mt-4 overflow-hidden">
                                    <div class="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-full" style="width: 72%"></div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-[#161a1e] p-4 rounded-xl border border-[#2b3139]">
                            <h3 class="font-bold text-white mb-4">热门标签</h3>
                            <div class="flex flex-wrap gap-2">
                                ${['#BTC', '#ETH', '#AI', '#RWA', '#GameFi', '#Solana', '#Meme', '#Layer2'].map(tag => `
                                    <span class="text-xs bg-[#2b3139] hover:bg-[#383e47] text-white px-3 py-1 rounded-full cursor-pointer transition-colors">${tag}</span>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 7. COMMUNITY (量化社区)
        if(v === 'community') return `
            <div class="flex-1 bg-[#0b0e11] p-8 text-[#cfd3d8] overflow-y-auto">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-white flex items-center gap-3"><i class="fa-solid fa-users text-yellow-500"></i> 量化社区</h2>
                    <button class="btn bg-[#f0b90b] text-black font-bold">发布观点</button>
                </div>
                
                <div class="grid grid-cols-3 gap-6">
                    <div class="col-span-2 space-y-6">
                        ${[1,2,3].map(i => `
                            <div class="bg-[#161a1e] p-6 rounded-xl border border-[#2b3139] hover:border-gray-500 transition-all">
                                <div class="flex items-center gap-3 mb-4">
                                    <div class="w-10 h-10 rounded-full bg-gray-700"></div>
                                    <div>
                                        <div class="font-bold text-white text-sm">QuantMaster_${i}</div>
                                        <div class="text-xs text-dim">2h ago</div>
                                    </div>
                                    <button class="ml-auto btn btn-xs bg-[#2b3139] text-white border border-[#383e47]">关注</button>
                                </div>
                                <h3 class="text-lg font-bold text-white mb-2">关于双均线策略在震荡行情下的优化思路</h3>
                                <p class="text-sm text-gray-400 leading-relaxed mb-4">最近在回测中发现，传统的 SMA 策略在横盘震荡时会产生大量磨损。我尝试引入了 ATR 指标作为过滤器，效果显著...</p>
                                <div class="flex gap-4 border-t border-[#2b3139] pt-4 text-xs text-dim">
                                    <span class="flex items-center gap-1 cursor-pointer hover:text-white"><i class="fa-regular fa-heart"></i> 124</span>
                                    <span class="flex items-center gap-1 cursor-pointer hover:text-white"><i class="fa-regular fa-comment"></i> 42</span>
                                    <span class="flex items-center gap-1 cursor-pointer hover:text-white"><i class="fa-solid fa-share"></i> Share</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="space-y-6">
                        <div class="bg-[#161a1e] p-4 rounded-xl border border-[#2b3139]">
                            <h3 class="font-bold text-white mb-4">热门策略榜</h3>
                            <div class="space-y-3">
                                <div class="flex justify-between items-center text-sm">
                                    <span class="text-gray-300">1. 网格交易 Pro</span>
                                    <span class="text-[#0ecb81] font-mono">24k 使用</span>
                                </div>
                                <div class="flex justify-between items-center text-sm">
                                    <span class="text-gray-300">2. 海龟交易法则</span>
                                    <span class="text-[#0ecb81] font-mono">18k 使用</span>
                                </div>
                                <div class="flex justify-between items-center text-sm">
                                    <span class="text-gray-300">3. 跨期套利 V2</span>
                                    <span class="text-[#0ecb81] font-mono">12k 使用</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 8. DATA CENTER (数据中心 - Re-implemented in Chinese)
        if(v === 'data') return `
            <div class="flex-1 bg-[#0b0e11] p-8 text-[#cfd3d8] overflow-y-auto">
                <h2 class="text-2xl font-bold mb-6 text-white flex items-center gap-3"><i class="fa-solid fa-database text-blue-500"></i> 数据中心</h2>
                
                <div class="grid grid-cols-3 gap-6 mb-8">
                    <div class="bg-[#161a1e] p-6 rounded-xl border border-[#2b3139] shadow-lg">
                        <div class="text-xs text-gray-500 uppercase font-bold mb-2">总存储量</div>
                        <div class="text-3xl font-bold text-white">128.5 GB</div>
                        <div class="w-full bg-[#2b3139] h-1.5 rounded-full mt-4 overflow-hidden"><div class="bg-blue-500 h-full" style="width: 45%"></div></div>
                    </div>
                    <div class="bg-[#161a1e] p-6 rounded-xl border border-[#2b3139] shadow-lg">
                        <div class="text-xs text-gray-500 uppercase font-bold mb-2">API 请求 (24h)</div>
                        <div class="text-3xl font-bold text-white">14,205</div>
                        <div class="text-xs text-green-500 mt-2"><i class="fa-solid fa-arrow-trend-up"></i> +12%</div>
                    </div>
                    <div class="bg-[#161a1e] p-6 rounded-xl border border-[#2b3139] shadow-lg">
                        <div class="text-xs text-gray-500 uppercase font-bold mb-2">数据完整性</div>
                        <div class="text-3xl font-bold text-[#0ecb81]">100%</div>
                        <div class="text-xs text-gray-500 mt-2">上次检查: 5分钟前</div>
                    </div>
                </div>

                <div class="bg-[#161a1e] rounded-xl border border-[#2b3139] overflow-hidden shadow-xl">
                    <div class="p-4 border-b border-[#2b3139] flex justify-between items-center bg-[#1e2329]">
                        <h3 class="font-bold text-sm text-white">市场数据源</h3>
                        <button class="btn btn-sm bg-blue-600 hover:bg-blue-500 text-white border-none"><i class="fa-solid fa-plus mr-2"></i> 添加源</button>
                    </div>
                    <table class="w-full text-sm text-left">
                        <thead class="bg-[#0b0e11] text-gray-500 font-bold uppercase text-xs">
                            <tr><th class="p-4 pl-6">代码</th><th class="p-4">名称</th><th class="p-4">价格</th><th class="p-4">24h 涨跌</th><th class="p-4">最后更新</th><th class="p-4">操作</th></tr>
                        </thead>
                        <tbody class="divide-y divide-[#2b3139]">
                            <tr class="hover:bg-[#1e2329] transition-colors"><td class="p-4 pl-6 font-bold text-[#f0b90b]">BTCUSDT</td><td class="p-4">Bitcoin</td><td class="p-4 font-mono">68,450.00</td><td class="p-4 text-[#0ecb81]">+2.45%</td><td class="p-4 text-dim">刚刚</td><td class="p-4"><button class="text-blue-400 hover:text-white"><i class="fa-solid fa-pen"></i></button></td></tr>
                            <tr class="hover:bg-[#1e2329] transition-colors"><td class="p-4 pl-6 font-bold text-[#f0b90b]">ETHUSDT</td><td class="p-4">Ethereum</td><td class="p-4 font-mono">3,450.00</td><td class="p-4 text-[#f6465d]">-1.20%</td><td class="p-4 text-dim">刚刚</td><td class="p-4"><button class="text-blue-400 hover:text-white"><i class="fa-solid fa-pen"></i></button></td></tr>
                            <tr class="hover:bg-[#1e2329] transition-colors"><td class="p-4 pl-6 font-bold text-[#f0b90b]">SOLUSDT</td><td class="p-4">Solana</td><td class="p-4 font-mono">145.20</td><td class="p-4 text-[#0ecb81]">+5.60%</td><td class="p-4 text-dim">刚刚</td><td class="p-4"><button class="text-blue-400 hover:text-white"><i class="fa-solid fa-pen"></i></button></td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        // 9. RESEARCH (研报分析 - Re-implemented in Chinese)
        if(v === 'research') return `
            <div class="flex-1 bg-[#0b0e11] p-8 text-[#cfd3d8] overflow-y-auto flex col gap-6">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-white flex items-center gap-3"><i class="fa-solid fa-book-open text-purple-500"></i> AI 投研助理</h2>
                    <div class="flex gap-2">
                        <button class="btn bg-[#2b3139] text-white border border-gray-600 hover:bg-gray-700">历史记录</button>
                        <button class="btn bg-[#f0b90b] text-black border-none hover:bg-[#ffe066] font-bold">新报告</button>
                    </div>
                </div>

                <div class="bg-[#161a1e] p-6 rounded-xl border border-[#2b3139] shadow-lg flex col gap-4">
                    <div class="flex gap-2 border-b border-[#2b3139] pb-4">
                        <input class="flex-1 bg-[#0b0e11] border border-[#2b3139] rounded-lg px-4 py-3 text-sm text-white focus:border-[#f0b90b] focus:outline-none transition-colors" placeholder="输入 URL、主题或粘贴内容进行分析...">
                        <button class="btn bg-purple-600 hover:bg-purple-500 text-white border-none px-6 font-bold" onclick="Modules.trading.analyzeResearch()"><i class="fa-solid fa-wand-magic-sparkles mr-2"></i> 深度分析</button>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div class="p-4 bg-[#0b0e11] rounded-lg border border-[#2b3139] hover:border-gray-500 cursor-pointer transition-all group">
                            <div class="text-[#f0b90b] text-sm font-bold mb-2 group-hover:underline">加密市场周报</div>
                            <p class="text-xs text-gray-500 line-clamp-2">关于 BTC ETF 资金流向及影响加密市场的宏观经济指标的综合分析...</p>
                            <div class="flex gap-2 mt-3">
                                <span class="text-[10px] bg-purple-900/30 text-purple-400 px-2 py-0.5 rounded">宏观</span>
                                <span class="text-[10px] bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded">加密货币</span>
                            </div>
                        </div>
                        <div class="p-4 bg-[#0b0e11] rounded-lg border border-[#2b3139] hover:border-gray-500 cursor-pointer transition-all group">
                            <div class="text-[#f0b90b] text-sm font-bold mb-2 group-hover:underline">AI 板块技术分析</div>
                            <p class="text-xs text-gray-500 line-clamp-2">深入剖析 NVIDIA 最新财报及其对半导体供应链的连锁反应...</p>
                            <div class="flex gap-2 mt-3">
                                <span class="text-[10px] bg-green-900/30 text-green-400 px-2 py-0.5 rounded">股票</span>
                                <span class="text-[10px] bg-red-900/30 text-red-400 px-2 py-0.5 rounded">科技</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="flex-1 bg-[#161a1e] rounded-xl border border-[#2b3139] flex center text-dim">
                    <div class="text-center opacity-50">
                        <i class="fa-solid fa-file-lines text-6xl mb-4"></i>
                        <p>请选择一份报告以查看详情</p>
                    </div>
                </div>
            </div>
        `;

        if(v === 'settings') return `
            <div class="flex-1 bg-[#0b0e11] p-8 text-[#cfd3d8] overflow-y-auto">
                <h2 class="text-2xl font-bold mb-6 text-white flex items-center gap-3"><i class="fa-solid fa-gear text-gray-400"></i> 系统设置</h2>
                <div class="bg-[#161a1e] p-6 rounded-xl border border-[#2b3139] space-y-6">
                    <div class="col gap-2">
                        <span class="text-sm font-bold text-gray-400">API 接入</span>
                        <div class="flex gap-2">
                            <input class="flex-1 bg-[#0b0e11] border border-[#2b3139] rounded px-3 py-2 text-sm text-white" placeholder="Binance API Key">
                            <input class="flex-1 bg-[#0b0e11] border border-[#2b3139] rounded px-3 py-2 text-sm text-white" placeholder="Secret Key" type="password">
                            <button class="btn bg-[#f0b90b] text-black border-none font-bold">连接</button>
                        </div>
                    </div>
                    <div class="col gap-2">
                        <span class="text-sm font-bold text-gray-400">交易偏好</span>
                        <div class="flex items-center justify-between bg-[#0b0e11] p-3 rounded border border-[#2b3139]">
                            <span>默认杠杆倍数</span>
                            <select class="bg-[#161a1e] text-white border border-[#2b3139] rounded px-2 py-1 text-xs">
                                <option>1x</option>
                                <option>5x</option>
                                <option>10x</option>
                                <option>20x</option>
                            </select>
                        </div>
                        <div class="flex items-center justify-between bg-[#0b0e11] p-3 rounded border border-[#2b3139]">
                            <span>下单确认</span>
                            <div class="w-10 h-5 bg-[#f0b90b] rounded-full relative cursor-pointer"><div class="absolute right-1 top-1 w-3 h-3 bg-black rounded-full"></div></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        return `<div class="flex center h-full text-dim">该模块 [${v}] 正在进行 100x 升级改造中，敬请期待。</div>`;
    },
    analyzeResearch: async () => {
        const input = document.querySelector('input[placeholder*="Enter URL"]');
        if(!input.value) return UI.toast('请输入分析主题或URL');
        UI.toast('正在抓取并分析全网数据...');
        
        // Mock analysis process
        const reportArea = document.querySelector('.col-content .flex-1.bg-\\[\\#161a1e\\]');
        if(reportArea) {
            reportArea.innerHTML = `
                <div class="flex flex-col h-full p-6 relative">
                    <div class="absolute inset-0 flex center bg-black/50 z-10" id="research-loading">
                        <div class="flex flex-col items-center gap-4">
                            <i class="fa-solid fa-circle-notch fa-spin text-4xl text-purple-500"></i>
                            <span class="text-sm font-mono text-purple-300 animate-pulse">ANALYZING DATA STREAMS...</span>
                        </div>
                    </div>
                    <div class="flex justify-between items-start mb-6 opacity-20">
                        <h1 class="text-3xl font-bold text-white">深度研报：${input.value}</h1>
                        <span class="text-xs text-dim font-mono">GENERATED BY GENESIS QUANT</span>
                    </div>
                </div>
            `;
            
            setTimeout(() => {
                const loading = document.getElementById('research-loading');
                if(loading) loading.remove();
                
                // Final Report Content
                reportArea.innerHTML = `
                    <div class="h-full flex flex-col overflow-hidden">
                        <div class="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
                            <div>
                                <h1 class="text-2xl font-bold text-white mb-2">深度研报：${input.value}</h1>
                                <div class="flex gap-2 text-xs">
                                    <span class="bg-purple-900/30 text-purple-400 px-2 py-0.5 rounded border border-purple-500/30">AI Generated</span>
                                    <span class="bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">High Confidence</span>
                                    <span class="text-dim py-0.5">${new Date().toLocaleString()}</span>
                                </div>
                            </div>
                            <button class="btn btn-sm bg-white/5 hover:bg-white/10 text-white" onclick="UI.toast('已导出 PDF')"><i class="fa-solid fa-file-export mr-2"></i> Export</button>
                        </div>
                        
                        <div class="flex-1 overflow-y-auto pr-2 space-y-6 text-sm leading-relaxed text-gray-300">
                            <div class="bg-black/20 p-4 rounded-lg border border-white/5">
                                <h3 class="text-purple-400 font-bold mb-2 uppercase text-xs tracking-wider">核心摘要 (Executive Summary)</h3>
                                <p>基于全网数据分析，当前市场对 <strong>${input.value}</strong> 的关注度呈现指数级上升趋势。关键驱动因素包括技术突破、资本流入以及宏观政策的利好支持。建议投资者保持高度关注，重点布局龙头标的。</p>
                            </div>
                            
                            <div class="grid grid-cols-2 gap-4">
                                <div class="bg-black/20 p-4 rounded-lg border border-white/5">
                                    <h3 class="text-green-400 font-bold mb-2 uppercase text-xs tracking-wider">利好因素 (Bullish)</h3>
                                    <ul class="list-disc list-inside space-y-1 text-xs text-dim">
                                        <li>机构资金净流入持续增加</li>
                                        <li>社交媒体讨论热度突破历史峰值</li>
                                        <li>技术指标通过关键阻力位</li>
                                    </ul>
                                </div>
                                <div class="bg-black/20 p-4 rounded-lg border border-white/5">
                                    <h3 class="text-red-400 font-bold mb-2 uppercase text-xs tracking-wider">风险提示 (Risks)</h3>
                                    <ul class="list-disc list-inside space-y-1 text-xs text-dim">
                                        <li>短期获利盘回吐压力</li>
                                        <li>宏观流动性收紧预期</li>
                                        <li>监管政策的不确定性</li>
                                    </ul>
                                </div>
                            </div>
                            
                            <div>
                                <h3 class="text-white font-bold mb-2 border-l-2 border-purple-500 pl-2">深度分析</h3>
                                <p class="mb-4">从链上数据来看，大户持仓并未出现明显减持，反而有逢低吸筹的迹象。这表明聪明钱（Smart Money）依然看好后市发展。此外，衍生品市场的持仓量（OI）维持高位，显示市场博弈激烈，波动性可能加剧。</p>
                                <p>技术面上，日线级别均线系统呈多头排列，RSI 指标虽处于超买区域，但尚未出现背离信号，上涨动能依然强劲。</p>
                            </div>
                            
                            <div class="bg-blue-900/10 border border-blue-500/20 p-4 rounded-lg">
                                <h3 class="text-blue-400 font-bold mb-2 uppercase text-xs tracking-wider">AI 投资建议</h3>
                                <p class="text-white font-bold">评级：<span class="text-green-400">增持 (Accumulate)</span></p>
                                <p class="text-xs text-dim mt-1">建议在回调时分批建仓，设置严格止损。关注关键支撑位的有效性。</p>
                            </div>
                        </div>
                    </div>
                `;
            }, 2000);
        }
    },
    init: () => {
        if(Modules.trading.view === 'dashboard') {
            setTimeout(() => {
                const el = document.getElementById('main-chart');
                if(!el) return;
                const chart = echarts.init(el);
                
                // Simulate Candlestick Data
                const dataCount = 100;
                const data = [];
                let baseValue = Math.random() * 1000 + 60000;
                for (let i = 0; i < dataCount; i++) {
                    baseValue = baseValue + Math.random() * 1000 - 500;
                    data.push([
                        baseValue,
                        baseValue + Math.random() * 500,
                        baseValue - Math.random() * 500,
                        baseValue + Math.random() * 500 - 250
                    ]);
                }
                
                chart.setOption({
                    backgroundColor: 'transparent',
                    grid: { left: 50, right: 50, top: 20, bottom: 30 },
                    xAxis: { data: data.map((_, i) => i), axisLine:{lineStyle:{color:'#555'}} },
                    yAxis: { scale: true, splitLine:{lineStyle:{color:'#333'}}, axisLine:{lineStyle:{color:'#555'}} },
                    series: [{
                        type: 'candlestick',
                        data: data,
                        itemStyle: {
                            color: '#0ecb81',
                            color0: '#f6465d',
                            borderColor: '#0ecb81',
                            borderColor0: '#f6465d'
                        }
                    }]
                });
                window.addEventListener('resize', () => chart.resize());

                // Mini Depth Chart
                const depthEl = document.getElementById('mini-depth-chart');
                if(depthEl) {
                    const depthChart = echarts.init(depthEl);
                    depthChart.setOption({
                        grid: { left: 0, right: 0, top: 0, bottom: 0 },
                        xAxis: { show: false, type: 'category' },
                        yAxis: { show: false },
                        series: [
                            { type: 'line', data: [10, 30, 50, 20, 40, 60, 30], smooth: true, areaStyle: { color: 'rgba(14,203,129,0.2)' }, lineStyle: { width: 0 } },
                            { type: 'line', data: [60, 40, 20, 50, 30, 10, 5], smooth: true, areaStyle: { color: 'rgba(246,70,93,0.2)' }, lineStyle: { width: 0 } }
                        ]
                    });
                }
            }, 100);
        } else if (Modules.trading.view === 'backtest') {
             setTimeout(() => {
                const el = document.getElementById('bt-chart');
                if(!el) return;
                const chart = echarts.init(el);
                const data = [];
                let val = 1000;
                for(let i=0; i<200; i++) {
                    val = val * (1 + (Math.random() - 0.45) * 0.05); // Random walk with slight upward bias
                    data.push(val);
                }
                chart.setOption({
                    backgroundColor: 'transparent',
                    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
                    grid: { left: 50, right: 20, top: 30, bottom: 30 },
                    xAxis: { type: 'category', data: data.map((_,i)=>i), axisLine: { lineStyle: { color: '#555' } } },
                    yAxis: { scale: true, splitLine: { lineStyle: { color: '#333' } }, axisLine: { lineStyle: { color: '#555' } } },
                    series: [{
                        type: 'line',
                        data: data,
                        showSymbol: false,
                        itemStyle: { color: '#0ecb81' },
                        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{offset: 0, color: 'rgba(14,203,129,0.5)'}, {offset: 1, color: 'rgba(14,203,129,0.0)'}]) },
                        lineStyle: { width: 1 }
                    }]
                });
                 window.addEventListener('resize', () => chart.resize());
             }, 100);
        }
    },
    // Keep placeholder methods to avoid errors if linked elsewhere
    handleStockImport:()=>{}, handleTextImport:()=>{}, analyzeSentiment:()=>{},
    // Mock strategy list click
    loadStrategy: (name) => {
        UI.toast(`已加载策略: ${name}`);
        // Mock loading content and update UI
        const editor = document.getElementById('qt-strategy-code');
        if (editor) {
            // Update active state in sidebar
            const list = document.querySelector('#module-view-trading .w-56 .flex-1');
            if(list) {
                Array.from(list.children).forEach(el => {
                    if(el.innerText.includes(name)) {
                        el.className = "text-xs text-white bg-[#2b3139] px-3 py-2 rounded cursor-pointer flex items-center gap-2 transition-colors border-l-2 border-[#f0b90b]";
                    } else {
                        el.className = "text-xs text-gray-400 hover:text-white hover:bg-[#2b3139] px-3 py-2 rounded cursor-pointer flex items-center gap-2 transition-colors border-l-2 border-transparent";
                    }
                });
            }
            
            // Update tab title
            const tabTitle = document.querySelector('#module-view-trading .border-t-2');
            if(tabTitle) tabTitle.innerHTML = `<i class="fa-brands fa-python text-blue-400"></i> ${name} <i class="fa-solid fa-xmark ml-2 hover:text-red-500"></i>`;

            // Load code content
            if(name.includes('dual_ma')) {
                editor.value = `# 双均线交叉策略 (Dual Moving Average Crossover)\n# Author: Genesis AI\n\nimport talib\nimport numpy as np\nfrom genesis.api import *\n\ndef initialize(context):\n    context.symbol = 'BTCUSDT'\n    context.short_window = 10\n    context.long_window = 30\n\ndef handle_data(context, data):\n    prices = data.history(context.symbol, 'close', 31, '1d')\n    short_ma = talib.SMA(prices, 10)\n    long_ma = talib.SMA(prices, 30)\n    if short_ma[-1] > long_ma[-1]: order(context.symbol, 1)\n    elif short_ma[-1] < long_ma[-1]: order(context.symbol, 0)`;
            } else if(name.includes('rsi')) {
                editor.value = `# RSI Mean Reversion\n# Author: Genesis AI\n\nimport talib\n\ndef initialize(context):\n    context.symbol = 'ETHUSDT'\n\ndef handle_data(context, data):\n    prices = data.history(context.symbol, 'close', 15, '1d')\n    rsi = talib.RSI(prices, 14)[-1]\n    if rsi < 30: order(context.symbol, 1)\n    if rsi > 70: order(context.symbol, 0)`;
            } else if (name.includes('grid')) {
                editor.value = `# 网格交易策略 (Grid Trading)\n\ndef initialize(context):\n    context.grid_lines = 10\n    context.price_range = (60000, 70000)\n\ndef handle_data(context, data):\n    current_price = data.current(context.symbol, 'price')\n    # Grid logic here...`;
            } else if (name.includes('ml')) {
                editor.value = `# 机器学习预测策略 (ML Predictor)\n\nimport sklearn\n\ndef initialize(context):\n    context.model = load_model('lstm_v1')\n\ndef handle_data(context, data):\n    features = extract_features(data)\n    pred = context.model.predict(features)\n    if pred > 0.8: order(1)`;
            }
        }
    },
    saveStrategy: async () => {
        const code = document.getElementById('qt-strategy-code').value;
        const id = 'strat_' + Date.now();
        await DB.put('trading_strategies', { id, name: 'New Strategy', content: code });
        UI.toast('策略已保存至本地库');
    },
    generateStrategy: async () => {
        const prompt = prompt("请输入策略描述 (例如: 创建一个基于 MACD 和 RSI 的趋势跟踪策略，包含止损逻辑)");
        if(!prompt) return;
        
        UI.toast('AI 正在编写量化策略...');
        const editor = document.getElementById('qt-strategy-code');
        editor.value = "# AI Generating...\n";
        
        const systemPrompt = `You are a Quant Developer. Write a Python trading strategy based on: ${prompt}. Use 'talib' library. Format as a standard function with initialize(context) and handle_data(context, data). Return ONLY code.`;
        
        await AI.generate(systemPrompt, {}, c => {
            editor.value += c;
        });
        
        // Clean up markdown
        let clean = editor.value.replace("# AI Generating...\n", "");
        clean = clean.replace(/```python/g, "").replace(/```/g, "");
        editor.value = clean;
        UI.toast('策略生成完成');
    }
};

Modules.settings = {
    render: () => `
        <div class="layout-golden bg-[#131314]">
            <!-- 30% Navigation (Left) -->
            <div class="col-nav p-6 gap-6 w-80 bg-[#1e1f20] border-r border-white/5">
                <div class="flex items-center gap-4 mb-2">
                    <div class="w-12 h-12 rounded-xl bg-white/5 flex center text-white text-2xl border border-white/10"><i class="fa-solid fa-gear"></i></div>
                    <div>
                        <h2 class="text-2xl font-bold text-white">系统设置</h2>
                        <p class="text-xs text-dim">System Config</p>
                    </div>
                </div>
                
                <div class="epic-card p-4 flex col gap-4 bg-black/20">
                    <span class="text-xs font-bold text-dim uppercase tracking-wider">外观设置</span>
                    <div class="col gap-2">
                        <span class="text-xs text-dim">主题色</span>
                        <div class="flex gap-2">
                            <button class="w-6 h-6 rounded-full bg-[#ffd700] border-2 border-white/20 hover:scale-110 transition-transform" onclick="document.documentElement.style.setProperty('--accent', '#ffd700')"></button>
                            <button class="w-6 h-6 rounded-full bg-[#3b82f6] border-2 border-white/20 hover:scale-110 transition-transform" onclick="document.documentElement.style.setProperty('--accent', '#3b82f6')"></button>
                            <button class="w-6 h-6 rounded-full bg-[#ec4899] border-2 border-white/20 hover:scale-110 transition-transform" onclick="document.documentElement.style.setProperty('--accent', '#ec4899')"></button>
                            <button class="w-6 h-6 rounded-full bg-[#10b981] border-2 border-white/20 hover:scale-110 transition-transform" onclick="document.documentElement.style.setProperty('--accent', '#10b981')"></button>
                            <button class="w-6 h-6 rounded-full bg-[#f97316] border-2 border-white/20 hover:scale-110 transition-transform" onclick="document.documentElement.style.setProperty('--accent', '#f97316')"></button>
                        </div>
                    </div>
                    <div class="col gap-2">
                        <span class="text-xs text-dim">字体</span>
                        <select class="epic-input h-8 rounded text-xs text-white px-2" onchange="document.body.style.fontFamily = this.value">
                            <option value="'Inter', sans-serif">默认 (System)</option>
                            <option value="'Songti SC', serif">宋体 (Serif)</option>
                            <option value="'Microsoft YaHei', sans-serif">微软雅黑 (Sans)</option>
                            <option value="'Fira Code', monospace">等宽 (Mono)</option>
                        </select>
                    </div>
                </div>

                <div class="epic-card p-4 flex col gap-4 mt-auto bg-black/20">
                    <span class="text-xs font-bold text-dim uppercase tracking-wider">数据管理</span>
                    <div class="flex gap-2">
                        <button class="epic-btn flex-1 h-8 rounded text-xs" onclick="Modules.settings.exportData()">
                            <i class="fa-solid fa-download mr-2"></i> 备份
                        </button>
                        <button class="epic-btn flex-1 h-8 rounded text-xs" onclick="document.getElementById('import-file').click()">
                            <i class="fa-solid fa-upload mr-2"></i> 恢复
                        </button>
                        <input type="file" id="import-file" class="hidden" onchange="Modules.settings.importData(this)">
                    </div>
                </div>

                <div class="epic-card border-red-900/30 bg-red-900/10 p-6">
                    <h3 class="font-bold text-red-400 mb-2 uppercase tracking-wider text-xs">危险区域</h3>
                    <div class="flex flex-col gap-4">
                        <p class="text-dim text-[10px]">不可逆操作：清空所有本地数据。</p>
                        <button class="epic-btn h-8 rounded text-xs bg-red-600/20 border-red-600/50 text-red-500 hover:bg-red-600 hover:text-white flex center gap-2" onclick="if(confirm('确定清空所有本地数据？这将不可恢复。')) { indexedDB.deleteDatabase(DB.name); location.reload(); }">
                            <i class="fa-solid fa-trash-can"></i> 恢复出厂设置
                        </button>
                    </div>
                </div>
            </div>

            <!-- 70% Content (Right) -->
            <div class="col-content bg-black/20 p-8 flex col gap-6 overflow-y-auto">
                <div class="grid grid-cols-2 gap-6">
                    <!-- API Pools -->
                    ${['text|📝 文本生成模型', 'image|🎨 图像生成模型', 'video|🎬 视频生成模型', 'audio|🎙️ 音频生成模型'].map(x => {
                        const [k, v] = x.split('|');
                        return `
                            <div class="epic-card p-0 flex flex-col h-64 bg-black/40">
                                <div class="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                                    <h3 class="font-bold text-sm text-gray-200">${v}</h3>
                                    <button class="w-6 h-6 rounded hover:bg-white/10 text-white flex center" onclick="Modules.settings.addPool('${k}')"><i class="fa-solid fa-plus"></i></button>
                                </div>
                                <div id="pool-${k}" class="flex-1 space-y-2 overflow-y-auto p-2 scrollbar-thin"></div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <div class="grid grid-cols-2 gap-6">
                    <!-- Shortcuts -->
                    <div class="epic-card p-6 bg-black/40">
                        <h3 class="font-bold text-sm text-white mb-4 uppercase tracking-wider">快捷键配置</h3>
                        <div class="space-y-2">
                            <div class="flex justify-between items-center text-xs text-dim bg-white/5 p-2 rounded border border-white/5">
                                <span>AI 续写</span>
                                <kbd class="bg-black/50 px-2 py-1 rounded border border-white/10 font-mono text-white">Ctrl + Enter</kbd>
                            </div>
                            <div class="flex justify-between items-center text-xs text-dim bg-white/5 p-2 rounded border border-white/5">
                                <span>唤起搜索</span>
                                <kbd class="bg-black/50 px-2 py-1 rounded border border-white/10 font-mono text-white">Ctrl + K</kbd>
                            </div>
                            <div class="flex justify-between items-center text-xs text-dim bg-white/5 p-2 rounded border border-white/5">
                                <span>保存</span>
                                <kbd class="bg-black/50 px-2 py-1 rounded border border-white/10 font-mono text-white">Ctrl + S</kbd>
                            </div>
                        </div>
                    </div>

                    <!-- API Usage Chart -->
                    <div class="epic-card p-6 flex col bg-black/40">
                        <h3 class="font-bold text-sm text-white mb-4 uppercase tracking-wider">API 使用统计</h3>
                        <div id="api-usage-chart" class="flex-1 w-full h-40"></div>
                    </div>
                </div>
            </div>

            <!-- Modal for API Edit -->
            <div id="api-modal" class="fixed inset-0 bg-black/90 hidden z-[100] flex center backdrop-blur-md">
                <div class="bg-[#121212] border border-white/10 rounded-2xl p-8 w-[500px] flex flex-col gap-6 shadow-2xl scale-100 animate-fade-in relative overflow-hidden">
                    <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-purple-500 to-blue-500"></div>
                    
                    <h3 class="text-xl font-bold text-white" id="api-modal-title">API 配置</h3>
                    
                    <div class="space-y-4">
                         <div class="col gap-2">
                            <span class="text-xs font-bold text-dim uppercase">配置名称</span>
                            <input id="api-name" class="epic-input h-10 px-3 rounded-lg text-sm text-white focus:border-accent" placeholder="例如: 生产环境 GPT-4">
                        </div>
                         <div class="col gap-2">
                            <span class="text-xs font-bold text-dim uppercase">服务商</span>
                            <select id="api-provider" class="epic-input h-10 px-3 rounded-lg text-sm text-white focus:border-accent">
                                <option value="custom">自定义 / OpenAI 兼容</option>
                                <option value="gemini">Google Gemini</option>
                                <option value="claude">Anthropic Claude</option>
                                <option value="midjourney">Midjourney (代理)</option>
                            </select>
                        </div>
                        <div class="col gap-2">
                            <span class="text-xs font-bold text-dim uppercase">Base URL</span>
                            <input id="api-url" class="epic-input h-10 px-3 rounded-lg text-sm text-white focus:border-accent" placeholder="https://api.openai.com/v1">
                        </div>
                        <div class="col gap-2">
                            <span class="text-xs font-bold text-dim uppercase">API Key</span>
                            <input id="api-key" class="epic-input h-10 px-3 rounded-lg text-sm text-white focus:border-accent" type="password" placeholder="sk-...">
                        </div>
                        <div class="col gap-2">
                            <span class="text-xs font-bold text-dim uppercase">Model ID</span>
                            <input id="api-model" class="epic-input h-10 px-3 rounded-lg text-sm text-white focus:border-accent" placeholder="gpt-4-turbo">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="col gap-2">
                                <span class="text-xs font-bold text-dim uppercase">Temperature</span>
                                <input id="api-temp" type="number" step="0.1" class="epic-input h-10 px-3 rounded-lg text-sm text-white focus:border-accent" placeholder="0.7">
                            </div>
                            <div class="col gap-2">
                                <span class="text-xs font-bold text-dim uppercase">Max Tokens</span>
                                <input id="api-tokens" type="number" class="epic-input h-10 px-3 rounded-lg text-sm text-white focus:border-accent" placeholder="4096">
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex gap-3 justify-end mt-2">
                        <button class="epic-btn h-10 px-6 rounded-lg text-sm hover:bg-white/10" onclick="document.getElementById('api-modal').classList.add('hidden')">取消</button>
                        <button class="epic-btn h-10 px-6 rounded-lg text-sm bg-white text-black hover:bg-gray-200 font-bold" onclick="Modules.settings.savePool()">保存配置</button>
                    </div>
                </div>
            </div>
        </div>
    `,
    init: async () => {
        await Modules.settings.refresh('text');
        await Modules.settings.refresh('image');
        await Modules.settings.refresh('video');
        await Modules.settings.refresh('audio');
        
        setTimeout(() => {
            const el = document.getElementById('api-usage-chart');
            if(el) {
                const chart = echarts.init(el);
                chart.setOption({
                    grid: { left: 0, right: 0, top: 10, bottom: 0 },
                    xAxis: { show: false, type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
                    yAxis: { show: false },
                    tooltip: { trigger: 'axis' },
                    series: [{
                        data: [820, 932, 901, 934, 1290, 1330, 1320],
                        type: 'bar',
                        itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] }
                    }]
                });
                window.addEventListener('resize', () => chart.resize());
            }
        }, 500);
    },
    refresh: async (type) => {
        const list = await DB.getAll(`${type}_api_pool`);
        const el = document.getElementById(`pool-${type}`);
        if(list.length === 0) {
             el.innerHTML = '<div class="text-dim text-sm text-center py-4">暂无配置</div>';
             return;
        }
        el.innerHTML = list.map(c => `
            <div class="p-3 border border-border rounded bg-black flex justify-between items-center group hover:border-accent transition-colors">
                <div class="flex flex-col cursor-pointer flex-1" onclick="Modules.settings.activate('${type}', ${c.id})">
                    <div class="flex items-center gap-2">
                        <span class="font-bold text-sm ${c.is_active?'text-accent':'text-main'}">${c.config_name}</span>
                        ${c.is_active ? '<span class="text-[10px] bg-accent text-black px-1 rounded font-bold">ACTIVE</span>' : ''}
                    </div>
                    <span class="text-[10px] text-dim">${c.provider} / ${c.model_name}</span>
                </div>
                <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="btn btn-sm btn-icon" onclick="Modules.settings.edit('${type}', ${c.id})"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-sm btn-icon hover:text-red-500" onclick="Modules.settings.del('${type}', ${c.id})"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `).join('');
    },
    currentType: null,
    currentId: null,
    addPool: (type) => {
        Modules.settings.currentType = type;
        Modules.settings.currentId = null;
        document.getElementById('api-modal').classList.remove('hidden');
        document.getElementById('api-modal-title').innerText = `添加 ${type} API`;
        ['api-name','api-url','api-key','api-model','api-temp','api-tokens'].forEach(id => document.getElementById(id).value = '');
        document.getElementById('api-provider').value = 'custom';
    },
    edit: async (type, id) => {
        Modules.settings.currentType = type;
        Modules.settings.currentId = id;
        const c = await DB.get(`${type}_api_pool`, id);
        document.getElementById('api-modal').classList.remove('hidden');
        document.getElementById('api-modal-title').innerText = `编辑 ${type} API`;
        document.getElementById('api-name').value = c.config_name;
        document.getElementById('api-provider').value = c.provider;
        document.getElementById('api-url').value = c.base_url;
        document.getElementById('api-key').value = c.api_key;
        document.getElementById('api-model').value = c.model_name;
        document.getElementById('api-temp').value = c.temperature || '';
        document.getElementById('api-tokens').value = c.max_tokens || '';
    },
    savePool: async () => {
        const type = Modules.settings.currentType;
        const id = Modules.settings.currentId || Date.now();
        const config = {
            id,
            config_name: document.getElementById('api-name').value,
            provider: document.getElementById('api-provider').value,
            base_url: document.getElementById('api-url').value,
            api_key: document.getElementById('api-key').value,
            model_name: document.getElementById('api-model').value,
            temperature: document.getElementById('api-temp').value,
            max_tokens: document.getElementById('api-tokens').value,
            is_active: Modules.settings.currentId ? (await DB.get(`${type}_api_pool`, id)).is_active : 0
        };
        await DB.put(`${type}_api_pool`, config);
        document.getElementById('api-modal').classList.add('hidden');
        Modules.settings.refresh(type);
    },
    exportData: async () => {
        const data = {};
        const stores = ['volumes', 'chapters', 'outlines', 'entities', 'vectors', 'prompts', 'tools_custom', 'assets', 'library_books', 'trading_strategies', 'code_snippets', 'text_api_pool', 'image_api_pool', 'video_api_pool', 'audio_api_pool', 'settings'];
        for (const s of stores) {
            data[s] = await DB.getAll(s);
        }
        const blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `genesis_backup_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        UI.toast('数据备份已导出');
    },
    importData: async (input) => {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                for (const s in data) {
                    for (const item of data[s]) {
                        await DB.put(s, item);
                    }
                }
                UI.toast('数据恢复成功，请刷新页面');
                setTimeout(() => location.reload(), 1000);
            } catch (err) {
                UI.toast('导入失败: ' + err.message);
            }
        };
        reader.readAsText(file);
    },
    del: async (type, id) => {
        if(confirm('删除此配置？')) {
            await DB.del(`${type}_api_pool`, id);
            Modules.settings.refresh(type);
        }
    },
    activate: async (type, id) => {
        const list = await DB.getAll(`${type}_api_pool`);
        for(const c of list) {
            c.is_active = c.id === id ? 1 : 0;
            await DB.put(`${type}_api_pool`, c);
        }
        Modules.settings.refresh(type);
    }
};

// 12. SHORT STORY & TOOLS (Inspiration, Trope, Writer)
Modules.short = {
    // Helper to open prompt modal
    openPromptModal: async (type) => {
        Modules.short.currentPromptType = type;
        let stored = null;
        try {
            const record = await DB.get('prompts', type);
            if(record) stored = record.content;
        } catch(e) { console.error(e); }

        let defaultVal = Modules.short.defaultPrompts ? Modules.short.defaultPrompts[type] : '';
        
        if (!defaultVal) {
             if (type === 'writer_ai') defaultVal = "[Role: Expert Novelist]\n[Global Rules]: {{rules}}\n[Continue Rules]: {{continue_rules}}\n[Context]\n{{context}}\n\n[Chapter Outline]\n{{outline}}\n\n[Preceding Text]\n...{{input}}\n\n[Task]\nContinue writing the story. Seamless transition. High quality prose.";
             else if (type === 'writer_polish') defaultVal = "[Task: Polish Text]\n[Rules]: {{rules}}\n[Original]:\n{{input}}";
             else if (type.startsWith('ts_')) {
                 const subtype = type.replace('ts_', '');
                 if (Modules.toolbox_split && Modules.toolbox_split.defaultPrompts && Modules.toolbox_split.defaultPrompts[subtype]) {
                     defaultVal = Modules.toolbox_split.defaultPrompts[subtype];
                 } else {
                     defaultVal = "请分析以下文本：{{input}}";
                 }
             }
             else if (type === 'fusion') defaultVal = "请将以下所有素材进行有机融合，创造一个新的、有逻辑的设定或情节：\n\n{{input}}";
             else if (type === 'logic') defaultVal = "请严格检查以下文本的逻辑漏洞、前后矛盾之处或不合理的情节，并给出修改建议：\n\n{{input}}";
             else if (type === 'phoenix_outline') defaultVal = "基于创意【{{idea}}】\n类型：{{genre}}\n风格：{{style}}\n\n请生成一份详细的长篇小说分卷细纲。\n\n格式要求：\n## 第一卷：卷名\n### 第一章：章名\n(本章核心情节与看点...)\n### 第二章：章名\n(本章核心情节与看点...)\n...\n\n要求：\n1. 结构严谨，节奏紧凑\n2. 至少生成前3卷的规划\n3. 每一章都需要有具体的剧情点描述";
             else if (type.startsWith('read_')) defaultVal = "请分析以下文本：\n\n{{input}}";
             else if (type.startsWith('fanfic_')) defaultVal = "请生成同人内容：{{input}}";
        }

        const el = document.getElementById('short-prompt-edit');
        if(el) el.value = stored || defaultVal || '';
        
        const modal = document.getElementById('short-prompt-modal');
        if (modal) {
            modal.classList.remove('hidden');
        } else {
            const body = document.body;
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = `
                <div id="short-prompt-modal" class="fixed inset-0 bg-black/80 z-[100] flex center backdrop-blur-sm animate-fade-in">
                    <div class="bg-[#121212] border border-white/10 rounded-xl w-[500px] flex flex-col shadow-2xl overflow-hidden">
                        <div class="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                            <h3 class="font-bold text-white"><i class="fa-solid fa-terminal mr-2 text-accent"></i>提示词配置</h3>
                            <button class="btn btn-sm btn-icon hover:text-white" onclick="document.getElementById('short-prompt-modal').remove()"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                        <div class="p-4 flex-1 flex col gap-3">
                            <textarea id="short-prompt-edit" class="textarea h-64 bg-black/50 border-white/10 text-xs font-mono text-green-400 focus:border-accent" placeholder="在此编辑 System Prompt..."></textarea>
                            <div class="text-[10px] text-dim">提示：使用 {{input}} 代表用户输入的内容。</div>
                        </div>
                        <div class="p-4 border-t border-white/10 flex justify-end gap-2 bg-black/20">
                            <button class="btn btn-sm hover:bg-white/10" onclick="document.getElementById('short-prompt-modal').remove()">取消</button>
                            <button class="btn btn-sm btn-primary" onclick="Modules.short.savePrompt()">保存并应用</button>
                        </div>
                    </div>
                </div>
            `;
            body.appendChild(tempDiv.firstElementChild);
            const newEl = document.getElementById('short-prompt-edit');
            if(newEl) newEl.value = stored || defaultVal || '';
        }
    },
    savePrompt: async () => {
        const type = Modules.short.currentPromptType;
        const val = document.getElementById('short-prompt-edit').value;
        try {
            let record = await DB.get('prompts', type);
            if (!record) { record = { id: type, name: type, content: val }; } else { record.content = val; }
            await DB.put('prompts', record);
            localStorage.removeItem(`short_prompt_${type}`);
            if(document.getElementById('pm-list')) Modules.prompts.init();
        } catch (e) {
            console.error('Failed to save prompt to DB', e);
            UI.toast('保存失败: ' + e.message);
        }
        const modal = document.getElementById('short-prompt-modal');
        if(modal) { if(modal.classList.contains('hidden')) { modal.classList.add('hidden'); } else { modal.remove(); } }
        UI.toast('提示词已同步更新');
        if(['idea','title','twist','char'].includes(type) && Modules.short_inspire && Modules.short_inspire.gen) {
            Modules.short_inspire.gen(type);
        }
    },
    getPrompt: async (type) => {
        try {
            const record = await DB.get('prompts', type);
            if(record && record.content) return record.content;
        } catch(e) { console.error(e); }
        if (Modules.short.defaultPrompts && Modules.short.defaultPrompts[type]) return Modules.short.defaultPrompts[type];
        if (type === 'writer_ai') return "[Role: Expert Novelist]\n[Global Rules]: {{rules}}\n[Continue Rules]: {{continue_rules}}\n[Context]\n{{context}}\n\n[Chapter Outline]\n{{outline}}\n\n[Preceding Text]\n...{{input}}\n\n[Task]\nContinue writing the story. Seamless transition. High quality prose.";
        if (type === 'writer_polish') return "[Task: Polish Text]\n[Rules]: {{rules}}\n[Original]:\n{{input}}";
        if (type.startsWith('ts_')) { const subtype = type.replace('ts_', ''); if (Modules.toolbox_split && Modules.toolbox_split.defaultPrompts && Modules.toolbox_split.defaultPrompts[subtype]) return Modules.toolbox_split.defaultPrompts[subtype]; return "请分析以下文本：{{input}}"; }
        if (type === 'fusion') return "请将以下所有素材进行有机融合，创造一个新的、有逻辑的设定或情节：\n\n{{input}}";
        if (type === 'logic') return "请严格检查以下文本的逻辑漏洞、前后矛盾之处或不合理的情节，并给出修改建议：\n\n{{input}}";
        if (type === 'phoenix_outline') return "基于创意【{{idea}}】\n类型：{{genre}}\n风格：{{style}}\n\n请生成一份详细的长篇小说分卷细纲。\n\n格式要求：\n## 第一卷：卷名\n### 第一章：章名\n(本章核心情节与看点...)\n### 第二章：章名\n(本章核心情节与看点...)\n...\n\n要求：\n1. 结构严谨，节奏紧凑\n2. 至少生成前3卷的规划\n3. 每一章都需要有具体的剧情点描述";
        if (type.startsWith('read_')) return "请分析以下文本：\n\n{{input}}";
        if (type.startsWith('fanfic_')) return "请生成同人内容：{{input}}";
        if (type.startsWith('media_')) { const map = { media_xhs: "请生成一篇小红书爆款文案，主题：{{input}}，语气：{{tone}}。要求：多用Emoji，分段清晰，有吸引力的标题。", media_tiktok: "请生成一段抖音短视频脚本，主题：{{input}}，语气：{{tone}}。包含分镜描述和口播文案。", media_wx: "请生成一篇公众号深度文章大纲，主题：{{input}}，语气：{{tone}}。逻辑严密，观点深刻。", media_weibo: "请生成一条微博热搜文案，主题：{{input}}，语气：{{tone}}。带话题标签，控制字数。" }; return map[type] || "生成自媒体内容：{{input}}"; }
        return "";
    },
    defaultPrompts: {
        idea: "生成一个反直觉的小说脑洞：",
        title: "生成5个爆款网文书名：",
        twist: "生成一个意想不到的情节反转：",
        char: "生成一个性格极其矛盾的角色：",
        trope: "深度拆解热梗【{{input}}】的情绪价值、爽点结构和受众心理：",
        write: "基于梗概写一篇短篇小说：{{input}}"
    },
    updateIO: (section, input, output) => {
        const inEl = document.getElementById(`io-${section}-in`);
        const outEl = document.getElementById(`io-${section}-out`);
        if(inEl) inEl.innerText = input;
        if(outEl) outEl.innerText = output;
    }
};

Modules.short_inspire = {
    render: () => `
        <div class="layout-golden">
            <div class="col-content bg-black/20 p-8 flex col gap-6 items-center overflow-y-auto">
                <div class="w-full max-w-6xl space-y-8">
                    <!-- Header -->
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex flex-col gap-1">
                            <h2 class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent to-white flex items-center gap-3">
                                <i class="fa-solid fa-lightbulb text-accent"></i> 灵感工坊
                            </h2>
                            <p class="text-sm text-dim">Inspiration Workshop / 创意无限生成</p>
                        </div>
                        <div class="flex gap-2">
                            <button class="epic-btn px-4 py-2 rounded-lg text-xs font-bold" onclick="Modules.short.openPromptModal(Modules.short.currentPromptType || 'idea')"><i class="fa-solid fa-sliders mr-2"></i> 配置引擎</button>
                        </div>
                    </div>

                    <!-- Concept Cloud (Visual) -->
                    <div class="relative h-48 w-full overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-r from-indigo-900/20 to-purple-900/20 flex center">
                        <div class="absolute inset-0 opacity-30" style="background-image: radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px); background-size: 20px 20px;"></div>
                        <div class="text-center z-10">
                            <h3 class="text-2xl font-bold text-white mb-2 animate-pulse">创意星云</h3>
                            <p class="text-xs text-indigo-300">点击下方卡片激活灵感源点</p>
                        </div>
                        <!-- Floating Words Animation (CSS only for now) -->
                        <div class="absolute top-4 left-10 text-xs text-white/20 animate-bounce" style="animation-duration: 3s">赛博朋克</div>
                        <div class="absolute bottom-8 right-20 text-xs text-white/20 animate-bounce" style="animation-duration: 4s">克苏鲁</div>
                        <div class="absolute top-1/2 left-1/4 text-xs text-white/20 animate-bounce" style="animation-duration: 5s">时间循环</div>
                    </div>

                    <!-- Card Grid -->
                    <div class="grid grid-cols-5 gap-4" id="short-inspire-grid">
                        ${[
                            {id:'idea', icon:'fa-lightbulb', text:'随机脑洞', color:'text-yellow-400', bg:'bg-yellow-500/10'},
                            {id:'title', icon:'fa-heading', text:'生成书名', color:'text-blue-400', bg:'bg-blue-500/10'},
                            {id:'twist', icon:'fa-shuffle', text:'反转情节', color:'text-red-400', bg:'bg-red-500/10'},
                            {id:'char', icon:'fa-user-astronaut', text:'怪诞角色', color:'text-green-400', bg:'bg-green-500/10'},
                            {id:'outline', icon:'fa-list-ol', text:'极速大纲', color:'text-purple-400', bg:'bg-purple-500/10'},
                            {id:'scene', icon:'fa-film', text:'场景描写', color:'text-orange-400', bg:'bg-orange-500/10'},
                            {id:'dialogue', icon:'fa-comments', text:'对话生成', color:'text-teal-400', bg:'bg-teal-500/10'},
                            {id:'emotion', icon:'fa-face-sad-tear', text:'情感渲染', color:'text-pink-400', bg:'bg-pink-500/10'},
                            {id:'world', icon:'fa-globe', text:'设定补全', color:'text-cyan-400', bg:'bg-cyan-500/10'},
                            {id:'ending', icon:'fa-flag-checkered', text:'结局生成', color:'text-white', bg:'bg-white/10'}
                        ].map(b => `
                            <button id="btn-short-${b.id}" class="epic-card p-4 h-32 flex flex-col items-center justify-center gap-3 group hover:scale-105 transition-transform cursor-pointer" onclick="Modules.short_inspire.gen('${b.id}')">
                                <div class="w-12 h-12 rounded-full ${b.bg} flex center ${b.color} text-2xl group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(0,0,0,0.3)]">
                                    <i class="fa-solid ${b.icon}"></i>
                                </div>
                                <span class="font-bold text-sm text-dim group-hover:text-white transition-colors">${b.text}</span>
                            </button>
                        `).join('')}
                    </div>
                    
                    <!-- Output Area -->
                    <div class="epic-card p-1 relative flex-1 flex col min-h-[500px]">
                        <div class="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                        <div class="flex justify-between items-center p-4 border-b border-white/5 relative z-10">
                            <span class="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-2"><i class="fa-solid fa-sparkles"></i> 生成结果</span>
                            <div class="flex gap-2">
                                <button class="btn btn-xs bg-white/5 hover:bg-white/10 text-dim hover:text-white" onclick="Utils.copy(document.getElementById('short-idea-out').value)"><i class="fa-solid fa-copy"></i></button>
                                <button class="btn btn-xs bg-white/5 hover:bg-white/10 text-dim hover:text-white" onclick="document.getElementById('short-io-inspire').classList.toggle('hidden')"><i class="fa-solid fa-terminal"></i> IO</button>
                            </div>
                        </div>
                        <div class="relative flex-1">
                            <textarea id="short-idea-out" class="w-full h-full bg-transparent border-none text-gray-200 text-lg resize-none focus:outline-none leading-relaxed font-serif p-5" placeholder="点击上方卡片开始生成..." readonly></textarea>
                            
                            <!-- IO Debug -->
                            <div id="short-io-inspire" class="hidden absolute inset-0 bg-black/95 p-4 text-xs font-mono overflow-auto z-20 backdrop-blur-xl">
                                <div class="text-accent mb-2 font-bold border-b border-white/10 pb-1">Input Prompt</div>
                                <div id="io-inspire-in" class="text-dim mb-4 whitespace-pre-wrap"></div>
                                <div class="text-green-400 mb-2 font-bold border-b border-white/10 pb-1">Raw Output</div>
                                <div id="io-inspire-out" class="text-dim whitespace-pre-wrap"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    gen: async (type) => {
        Modules.short.currentPromptType = type;
        document.querySelectorAll('#short-inspire-grid button').forEach(b => {
            b.classList.remove('bg-accent', 'text-black', 'border-accent');
            b.classList.add('bg-white/5', 'border-white/5');
        });
        const btn = document.getElementById(`btn-short-${type}`);
        if(btn) {
            btn.classList.remove('bg-white/5', 'border-white/5');
            btn.classList.add('bg-accent', 'text-black', 'border-accent');
        }

        const prompt = await Modules.short.getPrompt(type);
        document.getElementById('short-idea-out').value = "生成中...";
        Modules.short.updateIO('inspire', prompt, 'Generating...');
        
        let fullRes = '';
        await AI.generate(prompt, {}, c => {
            fullRes += c;
            document.getElementById('short-idea-out').value = fullRes;
            Modules.short.updateIO('inspire', prompt, fullRes);
        });
    }
};

Modules.short_trope = {
    render: () => `
        <div class="layout-golden">
            <div class="col-content bg-black/20 p-8 flex center overflow-y-auto">
                <div class="w-full max-w-5xl flex flex-col gap-8">
                    <!-- Header -->
                    <div class="flex items-center gap-4">
                        <div class="w-16 h-16 rounded-2xl bg-red-600/20 flex center border border-red-600/50 shadow-[0_0_30px_rgba(220,38,38,0.3)]">
                            <i class="fa-solid fa-fire text-4xl text-red-500"></i>
                        </div>
                        <div>
                            <h2 class="text-3xl font-bold text-white tracking-tight">热梗拆解引擎</h2>
                            <p class="text-red-400/80 font-mono text-xs uppercase tracking-widest">Trope Deconstruction Engine V2.0</p>
                        </div>
                    </div>

                    <!-- Input Section -->
                    <div class="epic-card p-8 flex flex-col gap-6">
                        <div class="flex justify-between items-end">
                            <span class="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2"><i class="fa-solid fa-keyboard"></i> 输入热梗关键词</span>
                            <div class="text-[10px] text-dim">支持网络流行语、经典桥段、反套路设定</div>
                        </div>
                        <div class="flex gap-4">
                            <div class="flex-1 relative group">
                                <div class="absolute inset-0 bg-red-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <input id="short-trope-in" class="epic-input w-full h-16 px-6 text-xl font-bold text-white rounded-xl relative z-10" placeholder="例如：龙王归来、真假千金、追妻火葬场...">
                            </div>
                            <button class="epic-btn w-40 h-16 rounded-xl font-bold text-lg bg-red-600/20 border-red-600/50 text-red-100 hover:bg-red-600 hover:text-white shadow-lg flex items-center justify-center gap-2" onclick="Modules.short_trope.analyzeTrope()">
                                <i class="fa-solid fa-bolt"></i> 深度拆解
                            </button>
                        </div>
                    </div>

                    <!-- Analysis Dashboard -->
                    <div class="grid grid-cols-3 gap-6 h-[500px]">
                        <!-- Left: Radar Chart (Mock) -->
                        <div class="epic-card p-6 flex flex-col items-center justify-center relative">
                            <h3 class="absolute top-4 left-4 text-xs font-bold text-dim uppercase">情绪价值雷达</h3>
                            <!-- CSS Radar Mock -->
                            <div class="relative w-48 h-48 flex center">
                                <div class="absolute inset-0 border border-white/10 rounded-full"></div>
                                <div class="absolute inset-8 border border-white/10 rounded-full"></div>
                                <div class="absolute inset-16 border border-white/10 rounded-full"></div>
                                <div class="absolute inset-0 flex center"><div class="w-full h-px bg-white/10 rotate-0"></div></div>
                                <div class="absolute inset-0 flex center"><div class="w-full h-px bg-white/10 rotate-60"></div></div>
                                <div class="absolute inset-0 flex center"><div class="w-full h-px bg-white/10 rotate-120"></div></div>
                                <!-- Polygon -->
                                <div class="absolute inset-0 bg-red-500/20 clip-path-polygon" style="clip-path: polygon(50% 10%, 90% 30%, 80% 80%, 20% 80%, 10% 30%);"></div>
                            </div>
                            <div class="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 text-[10px] text-dim">
                                <span>爽感: <span class="text-red-400">9.5</span></span>
                                <span>虐心: <span class="text-blue-400">2.0</span></span>
                                <span>期待: <span class="text-yellow-400">8.8</span></span>
                                <span>共鸣: <span class="text-green-400">7.5</span></span>
                            </div>
                        </div>

                        <!-- Center: Main Text Analysis -->
                        <div class="col-span-2 epic-card p-0 flex flex-col relative overflow-hidden">
                            <div class="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                                <span class="text-xs font-bold text-white flex items-center gap-2"><i class="fa-solid fa-file-waveform text-red-500"></i> 拆解报告</span>
                                <button class="btn btn-xs bg-white/5 hover:bg-white/10 text-dim" onclick="document.getElementById('short-io-trope').classList.toggle('hidden')">IO</button>
                            </div>
                            <div class="relative flex-1">
                                <textarea id="short-trope-out" class="w-full h-full bg-transparent border-none p-6 text-sm text-gray-300 resize-none focus:outline-none leading-loose font-mono" readonly placeholder="等待分析数据..."></textarea>
                                
                                <!-- IO Overlay -->
                                <div id="short-io-trope" class="hidden absolute inset-0 bg-black/95 p-4 text-xs font-mono overflow-auto z-20 backdrop-blur-xl">
                                    <div class="text-accent mb-2 font-bold border-b border-white/10 pb-1">Input Prompt</div>
                                    <div id="io-trope-in" class="text-dim mb-4 whitespace-pre-wrap"></div>
                                    <div class="text-green-400 mb-2 font-bold border-b border-white/10 pb-1">Raw Output</div>
                                    <div id="io-trope-out" class="text-dim whitespace-pre-wrap"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    analyzeTrope: async () => {
        const t = document.getElementById('short-trope-in').value;
        if(!t) return UI.toast('请输入热梗名称');
        let prompt = await Modules.short.getPrompt('trope');
        prompt = prompt.replace('{{input}}', t);
        
        document.getElementById('short-trope-out').value = "分析中...";
        Modules.short.updateIO('trope', prompt, 'Generating...');
        
        let fullRes = '';
        await AI.generate(prompt, {}, c => {
            document.getElementById('short-trope-out').value += c;
            fullRes += c;
            Modules.short.updateIO('trope', prompt, fullRes);
        });
    }
};

Modules.short_write = {
    render: () => `
        <div class="layout-golden">
            <div class="col-content bg-black/20 p-8 flex col gap-6 overflow-y-auto">
                <div class="w-full max-w-6xl mx-auto flex col gap-6 h-full">
                    <!-- Header with Story Arc -->
                    <div class="flex gap-6 h-48">
                        <div class="w-1/3 flex col justify-center">
                            <h2 class="text-4xl font-bold text-green-400 mb-2 flex items-center gap-3"><i class="fa-solid fa-feather-pointed"></i> 极速短篇</h2>
                            <p class="text-dim text-sm mb-4">One-Click Short Story Generator</p>
                            <div class="flex gap-2">
                                <button class="btn btn-sm bg-white/5 hover:bg-white/10 text-dim" onclick="Modules.short.openPromptModal('write')"><i class="fa-solid fa-sliders mr-1"></i> 配置</button>
                                <button class="btn btn-sm bg-white/5 hover:bg-white/10 text-dim" onclick="document.getElementById('short-io-write').classList.toggle('hidden')"><i class="fa-solid fa-terminal mr-1"></i> IO</button>
                            </div>
                        </div>
                        <div class="flex-1 epic-card p-4 relative overflow-hidden flex items-center justify-center">
                            <div class="absolute top-2 left-4 text-[10px] font-bold text-green-500 uppercase">Story Arc Visualization</div>
                            <!-- Mock Arc -->
                            <svg viewBox="0 0 400 100" class="w-full h-full opacity-50">
                                <path d="M 10 90 Q 100 90 150 50 T 300 20 T 390 80" fill="none" stroke="#22c55e" stroke-width="2" />
                                <circle cx="10" cy="90" r="3" fill="#fff" />
                                <circle cx="150" cy="50" r="3" fill="#fff" />
                                <circle cx="300" cy="20" r="3" fill="#fff" />
                                <circle cx="390" cy="80" r="3" fill="#fff" />
                                <text x="10" y="98" fill="#888" font-size="8">开端</text>
                                <text x="150" y="65" fill="#888" font-size="8">发展</text>
                                <text x="300" y="15" fill="#888" font-size="8">高潮</text>
                                <text x="380" y="95" fill="#888" font-size="8">结局</text>
                            </svg>
                        </div>
                    </div>

                    <!-- Input Area -->
                    <div class="epic-card p-1 bg-gradient-to-r from-green-900/20 to-black">
                        <textarea id="short-write-in" class="w-full h-28 bg-transparent border-none p-6 text-base text-gray-200 focus:outline-none resize-none font-serif placeholder-green-500/30" placeholder="在此输入核心梗概、故事种子或关键词..."></textarea>
                        <div class="px-4 pb-4 flex gap-4">
                            <button class="epic-btn flex-1 h-12 bg-green-600/20 text-green-400 border-green-600/50 hover:bg-green-600 hover:text-white font-bold rounded-lg flex center gap-2 shadow-lg" onclick="Modules.short_write.write()">
                                <i class="fa-solid fa-rocket"></i> 一键生成全文
                            </button>
                            <button class="btn w-32 h-12 bg-white/5 hover:bg-white/10 border-white/10 text-white rounded-lg font-bold" onclick="Modules.short_write.continueWrite()">
                                <i class="fa-solid fa-play mr-2"></i> 继续
                            </button>
                        </div>
                    </div>

                    <!-- Output Area -->
                    <div class="flex-1 epic-card p-0 relative overflow-hidden flex flex-col shadow-2xl">
                         <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-transparent"></div>
                         <div class="flex-1 relative">
                             <textarea id="short-write-out" class="w-full h-full bg-transparent border-none p-10 text-lg leading-loose resize-none focus:outline-none text-gray-300 font-serif" placeholder="AI 正在等待指令..."></textarea>
                             
                             <!-- IO Debug Overlay -->
                             <div id="short-io-write" class="hidden absolute inset-0 bg-black/95 p-4 text-xs font-mono overflow-auto z-20 backdrop-blur-xl">
                                <div class="text-accent mb-2 font-bold border-b border-white/10 pb-1">Input Prompt</div>
                                <div id="io-write-in" class="text-dim mb-4 whitespace-pre-wrap"></div>
                                <div class="text-green-400 mb-2 font-bold border-b border-white/10 pb-1">Raw Output</div>
                                <div id="io-write-out" class="text-dim whitespace-pre-wrap"></div>
                             </div>
                         </div>
                         <!-- Footer Stats -->
                         <div class="h-8 bg-black/40 border-t border-white/5 flex items-center px-4 justify-between text-[10px] text-dim font-mono">
                             <span>WORDS: <span id="short-word-count">0</span></span>
                             <span>STATUS: IDLE</span>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    write: async () => {
        const t = document.getElementById('short-write-in').value;
        if(!t) return UI.toast('请输入故事梗概');
        let prompt = await Modules.short.getPrompt('write');
        prompt = prompt.replace('{{input}}', t);
        
        document.getElementById('short-write-out').value = "生成中...";
        Modules.short.updateIO('write', prompt, 'Generating...');
        
        let fullRes = '';
        await AI.generate(prompt, {}, c => {
            document.getElementById('short-write-out').value += c;
            fullRes += c;
            Modules.short.updateIO('write', prompt, fullRes);
        });
    },
    continueWrite: async () => {
        const current = document.getElementById('short-write-out').value;
        if(!current) return UI.toast('请先生成正文');
        
        let prompt = `[Task] Continue writing the story from where it left off.\n\n[Context]\n${current.slice(-1000)}`;
        
        Modules.short.updateIO('write', prompt, 'Generating...');
        UI.toast('正在继续生成...');
        
        let fullRes = current;
        await AI.generate(prompt, {}, c => {
            const el = document.getElementById('short-write-out');
            el.value += c;
            el.scrollTop = el.scrollHeight;
            fullRes += c;
            Modules.short.updateIO('write', prompt, fullRes);
        });
    }
};

Modules.web_chat = {
    render: () => `
        <div class="layout-golden bg-[#131314] text-[#ececec] font-sans">
            <!-- Sidebar (Chat History) -->
            <div class="col-nav w-[260px] bg-[#1e1f20] border-r border-[#2b2b2b] flex flex-col transition-all duration-300 overflow-hidden" id="wc-sidebar">
                <div class="p-3">
                    <button class="w-full h-10 rounded-full bg-[#2b2b2b] hover:bg-[#333] flex items-center gap-3 px-4 transition-colors text-sm text-[#e3e3e3] font-medium" onclick="Modules.web_chat.newChat()">
                        <i class="fa-solid fa-plus text-[#c4c7c5]"></i> 新对话
                    </button>
                </div>
                
                <div class="px-4 pb-2 text-xs font-bold text-[#c4c7c5] mt-2">最近</div>
                <div class="flex-1 overflow-y-auto px-2 pb-2 space-y-1 scrollbar-thin" id="wc-history">
                    <!-- History Injected Here -->
                </div>
                
                <div class="p-3 border-t border-[#2b2b2b]">
                    <button class="w-full p-2 rounded-lg hover:bg-[#2b2b2b] flex items-center gap-3 text-sm text-[#e3e3e3] transition-colors" onclick="Modules.settings.addPool('text')">
                        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex center text-xs text-white font-bold">G</div>
                        <div class="flex flex-col items-start overflow-hidden">
                            <span class="font-medium truncate w-full text-left">Genesis User</span>
                            <span class="text-[10px] text-[#c4c7c5]">Free Plan</span>
                        </div>
                        <i class="fa-solid fa-gear ml-auto text-[#c4c7c5]"></i>
                    </button>
                </div>
            </div>

            <!-- Main Chat Area -->
            <div class="col-content flex flex-col relative bg-[#131314]">
                <!-- Header (Mobile Toggle & Model Select) -->
                <div class="h-16 flex items-center justify-between px-6 z-20 relative">
                    <div class="flex items-center gap-2">
                        <button class="btn-icon w-10 h-10 hover:bg-[#2b2b2b] rounded-full text-[#c4c7c5]" onclick="Modules.web_chat.toggleSidebar()">
                            <i class="fa-solid fa-bars"></i>
                        </button>
                        <div class="relative group">
                            <button class="flex items-center gap-2 text-lg font-medium text-[#e3e3e3] hover:bg-[#2b2b2b] px-3 py-1.5 rounded-lg transition-colors">
                                <span id="wc-current-model">Genesis 2.0 Flash</span>
                                <i class="fa-solid fa-caret-down text-xs text-[#c4c7c5]"></i>
                            </button>
                            <!-- Model Dropdown -->
                            <div class="absolute top-full left-0 mt-2 w-64 bg-[#1e1f20] border border-[#2b2b2b] rounded-xl shadow-2xl hidden group-hover:block z-50 overflow-hidden">
                                <div class="p-2">
                                    <div class="p-3 hover:bg-[#2b2b2b] rounded-lg flex items-center gap-3 cursor-pointer group/item" onclick="Modules.web_chat.setModel('gpt-4')">
                                        <div class="w-8 h-8 rounded-full bg-white text-black flex center"><i class="fa-solid fa-star"></i></div>
                                        <div class="flex flex-col">
                                            <span class="text-sm font-bold text-[#e3e3e3]">Genesis 2.0 Flash</span>
                                            <span class="text-[10px] text-[#c4c7c5]">最快、最轻量的模型</span>
                                        </div>
                                        <i class="fa-regular fa-circle-check ml-auto text-blue-400 opacity-0 group-hover/item:opacity-100"></i>
                                    </div>
                                    <div class="p-3 hover:bg-[#2b2b2b] rounded-lg flex items-center gap-3 cursor-pointer group/item" onclick="Modules.web_chat.setModel('gpt-3.5')">
                                        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white flex center"><i class="fa-solid fa-gem"></i></div>
                                        <div class="flex flex-col">
                                            <span class="text-sm font-bold text-[#e3e3e3]">Genesis 2.0 Pro</span>
                                            <span class="text-[10px] text-[#c4c7c5]">最强推理能力</span>
                                        </div>
                                        <i class="fa-regular fa-circle-check ml-auto text-blue-400 opacity-0 group-hover/item:opacity-100"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button class="w-10 h-10 rounded-full bg-[#2b2b2b] text-[#e3e3e3] flex center hover:bg-[#333] transition-colors" title="历史记录"><i class="fa-solid fa-clock-rotate-left"></i></button>
                        <button class="w-10 h-10 rounded-full bg-[#f0b90b] text-black flex center hover:bg-[#ffe066] font-bold transition-colors shadow-[0_0_15px_rgba(240,185,11,0.3)]">Try Pro</button>
                    </div>
                </div>

                <!-- IO Debug Panel -->
                <div id="wc-io-panel" class="hidden absolute top-20 right-4 w-80 bg-[#1e1f20] border border-[#333] rounded-xl shadow-2xl z-30 p-3 flex flex-col gap-2">
                    <div class="flex justify-between items-center border-b border-[#333] pb-2">
                        <span class="text-xs font-bold text-blue-400">IO Debug</span>
                        <button class="text-gray-400 hover:text-white" onclick="document.getElementById('wc-io-panel').classList.add('hidden')"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="flex flex-col gap-1">
                        <span class="text-[10px] text-gray-500">Input</span>
                        <textarea id="wc-io-in" class="bg-[#2b2b2b] border border-[#333] rounded p-2 text-[10px] text-gray-300 resize-none h-20 focus:outline-none font-mono" readonly></textarea>
                    </div>
                    <div class="flex flex-col gap-1">
                        <span class="text-[10px] text-gray-500">Output</span>
                        <textarea id="wc-io-out" class="bg-[#2b2b2b] border border-[#333] rounded p-2 text-[10px] text-green-400 resize-none h-20 focus:outline-none font-mono" readonly></textarea>
                    </div>
                </div>

                <!-- Chat Log -->
                <div class="flex-1 overflow-y-auto w-full scroll-smooth px-4 relative" id="wc-log">
                    <div class="flex flex-col items-center justify-center h-full space-y-10 max-w-3xl mx-auto z-10 relative">
                        <div class="text-center space-y-2">
                            <h1 class="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-red-400 tracking-tight pb-2">你好, 创世者</h1>
                            <h2 class="text-2xl font-medium text-[#c4c7c5]">今天想探索什么？</h2>
                        </div>
                        
                        <div class="grid grid-cols-4 gap-4 w-full">
                            <button class="aspect-square bg-[#1e1f20] hover:bg-[#2b2b2b] rounded-2xl p-4 flex flex-col justify-between transition-all group border border-transparent hover:border-[#333] z-20 relative" onclick="Modules.web_chat.setInput('帮我构思一个赛博朋克风格的小说开篇')">
                                <div class="w-10 h-10 rounded-full bg-[#2b2b2b] group-hover:bg-black flex center text-purple-400"><i class="fa-solid fa-pen-nib"></i></div>
                                <span class="text-sm font-medium text-[#e3e3e3] text-left">创意写作</span>
                            </button>
                            <button class="aspect-square bg-[#1e1f20] hover:bg-[#2b2b2b] rounded-2xl p-4 flex flex-col justify-between transition-all group border border-transparent hover:border-[#333] z-20 relative" onclick="Modules.web_chat.setInput('解释量子纠缠的基本原理')">
                                <div class="w-10 h-10 rounded-full bg-[#2b2b2b] group-hover:bg-black flex center text-blue-400"><i class="fa-solid fa-graduation-cap"></i></div>
                                <span class="text-sm font-medium text-[#e3e3e3] text-left">知识科普</span>
                            </button>
                            <button class="aspect-square bg-[#1e1f20] hover:bg-[#2b2b2b] rounded-2xl p-4 flex flex-col justify-between transition-all group border border-transparent hover:border-[#333] z-20 relative" onclick="Modules.web_chat.setInput('帮我写一个 Python 爬虫脚本')">
                                <div class="w-10 h-10 rounded-full bg-[#2b2b2b] group-hover:bg-black flex center text-green-400"><i class="fa-solid fa-code"></i></div>
                                <span class="text-sm font-medium text-[#e3e3e3] text-left">代码生成</span>
                            </button>
                            <button class="aspect-square bg-[#1e1f20] hover:bg-[#2b2b2b] rounded-2xl p-4 flex flex-col justify-between transition-all group border border-transparent hover:border-[#333] z-20 relative" onclick="Modules.web_chat.setInput('分析当前加密货币市场趋势')">
                                <div class="w-10 h-10 rounded-full bg-[#2b2b2b] group-hover:bg-black flex center text-yellow-400"><i class="fa-solid fa-chart-line"></i></div>
                                <span class="text-sm font-medium text-[#e3e3e3] text-left">市场分析</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Input Area -->
                <div class="w-full pt-4 pb-6 px-4 bg-[#131314]">
                    <div class="max-w-3xl mx-auto relative">
                        <!-- Input Box -->
                        <div class="relative flex flex-col w-full bg-[#1e1f20] rounded-[28px] hover:bg-[#2b2b2b] transition-colors group">
                            <textarea id="wc-in" class="w-full max-h-[200px] bg-transparent border-none resize-none focus:outline-none text-[#e3e3e3] text-lg leading-7 p-5 scrollbar-hide min-h-[60px]" placeholder="输入指令..." rows="1" oninput="this.style.height='auto';this.style.height=this.scrollHeight+'px'" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();Modules.web_chat.send();}"></textarea>
                            
                            <div class="flex justify-between items-center px-3 pb-3">
                                <div class="flex gap-1">
                                    <button class="w-10 h-10 rounded-full hover:bg-[#333] text-[#c4c7c5] hover:text-white flex center transition-colors" onclick="document.getElementById('wc-io-panel').classList.toggle('hidden')" title="IO调试">
                                        <i class="fa-solid fa-terminal text-lg"></i>
                                    </button>
                                    <button class="w-10 h-10 rounded-full hover:bg-[#333] text-[#c4c7c5] hover:text-white flex center transition-colors" onclick="document.getElementById('wc-upload').click()" title="上传图片/文件">
                                        <i class="fa-regular fa-image text-lg"></i>
                                    </button>
                                    <button class="w-10 h-10 rounded-full hover:bg-[#333] text-[#c4c7c5] hover:text-white flex center transition-colors" title="语音输入">
                                        <i class="fa-solid fa-microphone text-lg"></i>
                                    </button>
                                    <input type="file" id="wc-upload" class="hidden" onchange="UI.toast('文件已添加')">
                                </div>
                                <button class="w-10 h-10 rounded-full bg-white text-black hover:bg-[#e3e3e3] flex center transition-colors disabled:opacity-50 disabled:cursor-not-allowed" onclick="Modules.web_chat.send()">
                                    <i class="fa-solid fa-arrow-up"></i>
                                </button>
                            </div>
                        </div>
                        <div class="text-center text-[11px] text-[#c4c7c5] mt-3">
                            Genesis 可能会生成不准确的信息，包括关于人物的信息，请核实重要信息。
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Right Panel (Plugins & Settings) -->
            <div class="w-80 bg-[#202123] border-l border-[#333] flex flex-col transition-all duration-300 overflow-hidden" id="wc-right-panel" style="width: 0px; opacity: 0;">
                <div class="p-4 border-b border-[#333] flex justify-between items-center">
                    <span class="text-sm font-bold text-white">Chat Settings</span>
                    <button class="text-gray-400 hover:text-white" onclick="Modules.web_chat.toggleRightPanel()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                
                <div class="flex-1 overflow-y-auto p-4 space-y-6">
                    <!-- Plugins -->
                    <div class="space-y-3">
                        <div class="text-xs font-bold text-gray-500 uppercase tracking-wider">Plugins</div>
                        <div class="flex items-center justify-between p-3 bg-[#343541] rounded-lg border border-[#444]">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded bg-green-500/20 flex center text-green-500"><i class="fa-solid fa-globe"></i></div>
                                <div class="text-sm font-bold text-gray-200">Web Browsing</div>
                            </div>
                            <div class="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                <input type="checkbox" name="toggle" id="toggle-web" class="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer" onclick="Modules.web_chat.toggleWebSearch()"/>
                                <label for="toggle-web" class="toggle-label block overflow-hidden h-5 rounded-full bg-gray-600 cursor-pointer"></label>
                            </div>
                        </div>
                        
                        <div class="flex items-center justify-between p-3 bg-[#343541] rounded-lg border border-[#444]">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded bg-blue-500/20 flex center text-blue-500"><i class="fa-solid fa-code"></i></div>
                                <div class="text-sm font-bold text-gray-200">Code Interpreter</div>
                            </div>
                            <div class="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                <input type="checkbox" name="toggle" id="toggle-code" class="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer" checked/>
                                <label for="toggle-code" class="toggle-label block overflow-hidden h-5 rounded-full bg-green-500 cursor-pointer"></label>
                            </div>
                        </div>
                        
                        <div class="flex items-center justify-between p-3 bg-[#343541] rounded-lg border border-[#444]">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded bg-pink-500/20 flex center text-pink-500"><i class="fa-solid fa-image"></i></div>
                                <div class="text-sm font-bold text-gray-200">DALL·E 3</div>
                            </div>
                            <div class="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                <input type="checkbox" name="toggle" id="toggle-img" class="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                                <label for="toggle-img" class="toggle-label block overflow-hidden h-5 rounded-full bg-gray-600 cursor-pointer"></label>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Advanced Params -->
                    <div class="space-y-4 pt-4 border-t border-[#333]">
                        <div class="text-xs font-bold text-gray-500 uppercase tracking-wider">Parameters</div>
                        
                        <div class="space-y-2">
                            <div class="flex justify-between text-xs text-gray-300">
                                <span>Temperature</span>
                                <span class="bg-[#444] px-1.5 rounded">0.7</span>
                            </div>
                            <input type="range" class="w-full h-1 bg-[#444] rounded-lg appearance-none cursor-pointer accent-white" min="0" max="1" step="0.1" value="0.7">
                        </div>
                        
                        <div class="space-y-2">
                            <div class="flex justify-between text-xs text-gray-300">
                                <span>Top P</span>
                                <span class="bg-[#444] px-1.5 rounded">1.0</span>
                            </div>
                            <input type="range" class="w-full h-1 bg-[#444] rounded-lg appearance-none cursor-pointer accent-white" min="0" max="1" step="0.1" value="1.0">
                        </div>
                    </div>
                    
                    <!-- System Prompt -->
                    <div class="space-y-2 pt-4 border-t border-[#333]">
                        <div class="text-xs font-bold text-gray-500 uppercase tracking-wider">System Instructions</div>
                        <textarea class="w-full bg-[#343541] border border-[#444] rounded-lg p-3 text-xs text-gray-300 resize-none h-32 focus:border-white/50 focus:outline-none" placeholder="You are a helpful assistant..."></textarea>
                    </div>
                </div>
            </div>
            
            
        </div>
    `,
    toggleRightPanel: () => {
        const panel = document.getElementById('wc-right-panel');
        if (panel.style.width === '0px') {
            panel.style.width = '320px';
            panel.style.opacity = '1';
        } else {
            panel.style.width = '0px';
            panel.style.opacity = '0';
        }
    },
    currentSessionId: null,
    sessions: [],
    webSearchEnabled: false,
    init: async () => {
        await Modules.web_chat.loadSessions();
        if (Modules.web_chat.sessions.length > 0) {
            Modules.web_chat.loadSession(Modules.web_chat.sessions[0].id);
        } else {
            Modules.web_chat.newChat();
        }
    },
    setInput: (text) => {
        document.getElementById('wc-in').value = text;
        document.getElementById('wc-in').focus();
    },
    toggleWebSearch: () => {
        Modules.web_chat.webSearchEnabled = !Modules.web_chat.webSearchEnabled;
        UI.toast(`Web Search ${Modules.web_chat.webSearchEnabled ? 'Enabled' : 'Disabled'}`);
    },
    toggleSidebar: () => {
        const sb = document.getElementById('wc-sidebar');
        if (sb.style.width === '0px') {
            sb.style.width = '288px';
            sb.style.opacity = '1';
        } else {
            sb.style.width = '0px';
            sb.style.opacity = '0';
        }
    },
    setModel: (id) => {
        document.getElementById('wc-current-model').innerText = id === 'gpt-4' ? 'Genesis-4o' : id === 'gpt-3.5' ? 'Genesis-3.5' : 'Claude-3';
        UI.toast(`Model switched to ${id}`);
    },
    loadSessions: async () => {
        try {
            const sessions = await DB.getAll('chat_sessions');
            Modules.web_chat.sessions = sessions.sort((a, b) => b.timestamp - a.timestamp);
            Modules.web_chat.renderSessionList();
        } catch (e) {
            console.error("Failed to load sessions", e);
            Modules.web_chat.sessions = [];
        }
    },
    saveSession: async (session) => {
        try {
            await DB.put('chat_sessions', session);
            // Update local cache if exists
            const idx = Modules.web_chat.sessions.findIndex(s => s.id === session.id);
            if (idx !== -1) Modules.web_chat.sessions[idx] = session;
            else Modules.web_chat.sessions.unshift(session);
            Modules.web_chat.renderSessionList();
        } catch (e) {
            console.error("Failed to save session", e);
            UI.toast("保存会话失败: Storage Error");
        }
    },
    renderSessionList: () => {
        const list = document.getElementById('wc-history');
        if(!list) return;
        list.innerHTML = Modules.web_chat.sessions.map(s => `
            <div class="px-3 py-2 rounded-full text-sm cursor-pointer flex items-center gap-3 group transition-all ${Modules.web_chat.currentSessionId===s.id ? 'bg-[#004a77] text-[#c2e7ff]' : 'text-[#e3e3e3] hover:bg-[#2b2b2b]'}" onclick="Modules.web_chat.loadSession('${s.id}')">
                <i class="fa-regular fa-message text-xs ${Modules.web_chat.currentSessionId===s.id ? 'text-[#c2e7ff]' : 'text-[#c4c7c5]'}"></i>
                <span class="truncate flex-1 font-medium">${s.title}</span>
                <div class="opacity-0 group-hover:opacity-100 flex gap-2">
                    <i class="fa-solid fa-pen text-xs text-[#c4c7c5] hover:text-white" title="重命名" onclick="event.stopPropagation(); Modules.web_chat.renameSession('${s.id}')"></i>
                    <i class="fa-solid fa-trash-can text-xs text-[#c4c7c5] hover:text-red-400" onclick="event.stopPropagation(); Modules.web_chat.deleteSession('${s.id}')" title="删除"></i>
                </div>
            </div>
        `).join('');
    },
    renameSession: async (id) => {
        const session = Modules.web_chat.sessions.find(s => s.id === id);
        if (!session) return;
        const newTitle = prompt("重命名会话", session.title);
        if (newTitle) {
            session.title = newTitle;
            await Modules.web_chat.saveSession(session);
        }
    },
    newChat: async () => {
        const id = Utils.uuid();
        const session = { id, title: 'New Chat', messages: [], timestamp: Date.now() };
        await Modules.web_chat.saveSession(session);
        Modules.web_chat.loadSession(id);
    },
    loadSession: async (id) => {
        Modules.web_chat.currentSessionId = id;
        // Ensure we have the latest data from DB if switching
        let session = Modules.web_chat.sessions.find(s => s.id === id);
        if(!session) {
             session = await DB.get('chat_sessions', id);
             if(session) Modules.web_chat.sessions.push(session);
        }
        if(!session) return;
        
        const log = document.getElementById('wc-log');
        if (session.messages.length === 0) {
            // Show welcome screen
            log.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full text-gray-100 space-y-8">
                    <div class="w-16 h-16 bg-white rounded-full flex center shadow-lg mb-4">
                        <i class="fa-solid fa-dragon text-4xl text-black"></i>
                    </div>
                    <h2 class="text-2xl font-bold">How can I help you today?</h2>
                    <div class="grid grid-cols-2 gap-4 w-full max-w-2xl px-4">
                        <button class="p-4 border border-[#444] rounded-xl hover:bg-[#444] text-left text-sm text-gray-300 transition-colors" onclick="Modules.web_chat.setInput('Explain quantum computing in simple terms')">
                            <div class="font-bold text-white mb-1">Explain quantum computing</div>
                            <div class="text-gray-500">in simple terms</div>
                        </button>
                        <button class="p-4 border border-[#444] rounded-xl hover:bg-[#444] text-left text-sm text-gray-300 transition-colors" onclick="Modules.web_chat.setInput('Write a python script to scrape a website')">
                            <div class="font-bold text-white mb-1">Write a python script</div>
                            <div class="text-gray-500">to scrape a website</div>
                        </button>
                    </div>
                </div>
            `;
        } else {
            log.innerHTML = `<div class="max-w-3xl mx-auto py-8">
                ${session.messages.map(m => `
                <div class="flex gap-4 mb-6 group ${m.role}">
                    <div class="w-8 h-8 rounded-sm flex center shrink-0 ${m.role==='user'?'bg-gray-500':'bg-[#19c37d]'}">
                        ${m.role==='user'?'<i class="fa-solid fa-user text-white"></i>':'<i class="fa-solid fa-bolt text-white"></i>'}
                    </div>
                    <div class="relative flex-1 overflow-hidden">
                        <div class="text-gray-100 text-base leading-7 markdown-body">${marked.parse(m.content)}</div>
                    </div>
                </div>
            `).join('')}</div>`;
        }
        Modules.web_chat.renderSessionList();
        log.scrollTop = log.scrollHeight;
    },
    deleteSession: async (id) => {
        if(!confirm('Delete this chat?')) return;
        await DB.del('chat_sessions', id);
        Modules.web_chat.sessions = Modules.web_chat.sessions.filter(s => s.id !== id);
        Modules.web_chat.renderSessionList();
        
        if(Modules.web_chat.currentSessionId === id) {
            if(Modules.web_chat.sessions.length > 0) Modules.web_chat.loadSession(Modules.web_chat.sessions[0].id);
            else Modules.web_chat.newChat();
        }
    },
    send: async () => {
        const input = document.getElementById('wc-in');
        const text = input.value.trim();
        if(!text) return;
        
        const session = Modules.web_chat.sessions.find(s => s.id === Modules.web_chat.currentSessionId);
        if(!session) return;

        // User Msg
        session.messages.push({role: 'user', content: text});
        if(session.messages.length === 1) {
            session.title = text.slice(0, 30);
        }
        // Save immediately
        await Modules.web_chat.saveSession(session);

        const log = document.getElementById('wc-log');
        // Clear welcome screen if first message
        if(session.messages.length === 1) log.innerHTML = '<div class="max-w-3xl mx-auto py-8"></div>';
        
        const container = log.querySelector('.max-w-3xl') || log;
        
        // Render User Message
        const userMsgDiv = document.createElement('div');
        userMsgDiv.className = 'flex gap-4 mb-8 group user';
        userMsgDiv.innerHTML = `
            <div class="relative flex-1 overflow-hidden flex justify-end">
                <div class="bg-[#2b2b2b] rounded-[20px] px-5 py-3 max-w-[80%] text-[#e3e3e3] text-base leading-7 whitespace-pre-wrap">${text}</div>
            </div>
        `;
        container.appendChild(userMsgDiv);
        
        input.value = '';
        input.style.height = 'auto'; // Reset height
        log.scrollTop = log.scrollHeight;
        
        // Render AI Placeholder
        const resId = 'wc-res-' + Date.now();
        const aiMsgDiv = document.createElement('div');
        aiMsgDiv.className = 'flex gap-4 mb-8 group ai';
        aiMsgDiv.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-white text-black flex center shrink-0"><i class="fa-solid fa-star"></i></div>
            <div id="${resId}" class="text-[#e3e3e3] text-base leading-7 markdown-body flex-1">
                <span class="w-2 h-4 bg-gray-400 inline-block animate-pulse"></span>
            </div>
        `;
        container.appendChild(aiMsgDiv);
        log.scrollTop = log.scrollHeight;
        
        // Build Context from History (Last 10 messages)
        const historyContext = session.messages.slice(-10).map(m => `[${m.role}]: ${m.content}`).join('\n\n');
        const prompt = `[System] You are Genesis AI, a helpful and creative assistant. Answer concisely and accurately.\n\n[History]\n${historyContext}\n\n[User]: ${text}\n\n[Genesis]:`;

        const ioIn = document.getElementById('wc-io-in');
        if (ioIn) ioIn.value = prompt;
        document.getElementById('wc-io-out').value = "Generating...";
        
        let fullRes = '';
        let buffer = '';
        let isTyping = false;
        
        // Streaming & Typewriter Logic
        await AI.generate(prompt, {}, c => {
            buffer += c;
            fullRes += c;
            document.getElementById('wc-io-out').value = fullRes;
            
            if(!isTyping) {
                isTyping = true;
                const typeLoop = () => {
                    if(buffer.length > 0) {
                        // Type a few chars at a time for natural feel
                        const chunk = buffer.slice(0, Math.max(1, Math.floor(Math.random() * 5)));
                        buffer = buffer.slice(chunk.length);
                        
                        const el = document.getElementById(resId);
                        if (el) {
                            if (el.querySelector('.animate-pulse')) el.innerHTML = ''; // Clear loading
                            // Note: Rendering markdown on every char is expensive, but okay for short texts.
                            // For optimization, we could append text node and only markdown at end, but visual consistency matters.
                            // Let's use a simpler approach: Update innerHTML with partial markdown
                            const currentText = fullRes.slice(0, fullRes.length - buffer.length);
                            el.innerHTML = marked.parse(currentText);
                            log.scrollTop = log.scrollHeight;
                        }
                        
                        requestAnimationFrame(typeLoop);
                    } else {
                        isTyping = false;
                    }
                };
                typeLoop();
            }
        });
        
        // Finalize
        session.messages.push({role: 'ai', content: fullRes});
        await Modules.web_chat.saveSession(session);
    }
};

Modules.fanfic = {
    render: () => `
        <div class="layout-golden">
            <div class="col-nav p-6 gap-6 w-80 bg-[#1e1f20] border-r border-white/5">
                <div class="flex items-center gap-3 mb-4">
                    <h2 class="text-2xl font-bold text-white"><i class="fa-solid fa-book-journal-whills text-pink-500 mr-2"></i>同人创作</h2>
                </div>
                
                <!-- Character Relationship Map (Visual) -->
                <div class="epic-card p-4 h-48 relative overflow-hidden flex center bg-black/40">
                    <div class="absolute top-2 left-2 text-[10px] font-bold text-pink-400 uppercase">CP 关系矩阵</div>
                    <!-- CSS Node Graph Mock -->
                    <div class="relative w-full h-full">
                        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-pink-500/20 border border-pink-500 flex center text-xs text-white z-10">A</div>
                        <div class="absolute top-1/4 left-1/4 w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500 flex center text-xs text-white z-10">B</div>
                        <div class="absolute bottom-1/4 right-1/4 w-10 h-10 rounded-full bg-green-500/20 border border-green-500 flex center text-xs text-white z-10">C</div>
                        <!-- Lines -->
                        <svg class="absolute inset-0 w-full h-full pointer-events-none">
                            <line x1="50%" y1="50%" x2="25%" y2="25%" stroke="#ec4899" stroke-width="1" opacity="0.5" />
                            <line x1="50%" y1="50%" x2="75%" y2="75%" stroke="#ec4899" stroke-width="1" opacity="0.5" />
                            <line x1="25%" y1="25%" x2="75%" y2="75%" stroke="#3b82f6" stroke-width="1" stroke-dasharray="4" opacity="0.3" />
                        </svg>
                    </div>
                </div>

                <div class="flex flex-col gap-2">
                    <span class="text-xs font-bold text-dim uppercase tracking-wider">创作模式</span>
                    ${[
                        {id:'scene', icon:'fa-clapperboard', text:'名场面生成', color:'text-pink-400', bg:'bg-pink-600/10 border-pink-600/30'},
                        {id:'chat', icon:'fa-comments', text:'角色互动对话', color:'text-blue-400', bg:'hover:bg-white/5 border-transparent'},
                        {id:'au', icon:'fa-globe', text:'AU 平行宇宙', color:'text-purple-400', bg:'hover:bg-white/5 border-transparent'}
                    ].map(m => `
                        <button class="epic-btn h-12 justify-start px-4 rounded-lg text-left text-sm font-bold flex items-center gap-3 ${m.bg} ${Modules.fanfic.currentMode===m.id?'border-pink-500 text-white':'text-dim'}" onclick="Modules.fanfic.setMode('${m.id}')">
                            <i class="fa-solid ${m.icon} ${m.color}"></i> ${m.text}
                        </button>
                    `).join('')}
                </div>
                
                <div class="mt-auto p-4 bg-white/5 rounded-xl border border-white/5">
                    <div class="flex justify-between items-center text-xs text-dim mb-2">
                        <span>OOC 预警阈值</span>
                        <span class="text-white">High</span>
                    </div>
                    <div class="w-full bg-black/50 h-1.5 rounded-full overflow-hidden">
                        <div class="bg-red-500 h-full w-3/4"></div>
                    </div>
                </div>
            </div>
            
            <div class="col-content bg-black/20 p-8 flex col gap-6">
                <!-- Input Area -->
                <div class="epic-card p-6 flex col gap-4 bg-gradient-to-br from-pink-900/10 to-black">
                    <div class="flex justify-between items-center">
                        <span class="text-sm font-bold text-pink-400 uppercase tracking-wider flex items-center gap-2">
                            <i class="fa-solid fa-pen-nib"></i> <span id="ff-mode-title">名场面生成</span>
                        </span>
                        <div class="flex gap-2">
                            <button class="btn btn-sm bg-white/5 hover:bg-white/10 text-dim" onclick="Modules.short.openPromptModal('fanfic_scene')"><i class="fa-solid fa-sliders mr-1"></i> 配置</button>
                            <button class="btn btn-sm bg-white/5 hover:bg-white/10 text-dim" onclick="document.getElementById('ff-io').classList.toggle('hidden')"><i class="fa-solid fa-terminal mr-1"></i> IO</button>
                        </div>
                    </div>
                    <textarea id="ff-input" class="w-full h-32 bg-transparent border-none p-4 text-base text-gray-200 focus:outline-none resize-none placeholder-pink-500/30 font-serif" placeholder="输入场景关键词、角色动作或对话梗概..."></textarea>
                    <div class="flex gap-4 border-t border-white/5 pt-4">
                        <button class="epic-btn flex-1 h-12 bg-pink-600/20 text-pink-100 border-pink-600/50 hover:bg-pink-600 hover:text-white font-bold rounded-lg flex center gap-2 shadow-lg" onclick="Modules.fanfic.run()">
                            <i class="fa-solid fa-wand-magic-sparkles"></i> 立即生成
                        </button>
                        <button class="btn w-32 h-12 bg-white/5 hover:bg-white/10 border-white/10 text-white rounded-lg font-bold" onclick="Modules.fanfic.continueRun()">
                            <i class="fa-solid fa-play mr-2"></i> 继续
                        </button>
                    </div>
                </div>

                <!-- Output Area -->
                <div class="flex-1 epic-card p-0 flex col relative overflow-hidden shadow-2xl">
                    <div class="absolute inset-0 bg-pink-500/5 pointer-events-none"></div>
                    <div class="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center relative z-10">
                        <span class="font-bold text-gray-200 text-xs uppercase tracking-wider"><i class="fa-solid fa-file-lines mr-2 text-pink-500"></i>生成结果</span>
                        <div class="flex gap-2">
                            <button class="btn btn-sm bg-black/20 hover:bg-black/40 border-none text-pink-400" onclick="Modules.fanfic.saveToLib()"><i class="fa-solid fa-book-bookmark mr-1"></i> 存入图书馆</button>
                            <button class="btn btn-sm bg-black/20 hover:bg-black/40 border-none text-dim hover:text-white" onclick="Utils.copy(document.getElementById('ff-out').value)"><i class="fa-solid fa-copy"></i></button>
                        </div>
                    </div>
                    <textarea id="ff-out" class="flex-1 bg-transparent border-none p-8 font-serif text-lg text-gray-300 resize-none focus:outline-none leading-loose relative z-10" readonly placeholder="AI 生成的同人内容将显示在这里..."></textarea>
                    
                    <!-- IO Overlay -->
                    <div id="ff-io" class="hidden absolute inset-0 bg-black/95 p-4 text-xs font-mono overflow-auto z-20 top-14 backdrop-blur-xl">
                        <div class="text-accent mb-2 font-bold border-b border-white/10 pb-1">Input Prompt</div>
                        <div id="ff-io-in" class="text-dim mb-4 whitespace-pre-wrap"></div>
                        <div class="text-green-400 mb-2 font-bold border-b border-white/10 pb-1">Raw Output</div>
                        <div id="ff-io-out" class="text-dim whitespace-pre-wrap"></div>
                    </div>
                </div>
            </div>
        </div>
    `,
    currentMode: 'scene',
    setMode: (mode) => {
        Modules.fanfic.currentMode = mode;
        const titles = { scene: '名场面生成', chat: '角色互动对话', au: 'AU 平行宇宙生成' };
        document.getElementById('ff-mode-title').innerText = titles[mode];
        // Could also update UI active state here
    },
    updateIO: (input, output) => {
        document.getElementById('ff-io-in').innerText = input;
        document.getElementById('ff-io-out').innerText = output;
    },
    run: async () => {
        const input = document.getElementById('ff-input').value;
        const mode = Modules.fanfic.currentMode;
        const promptKey = `fanfic_${mode}`;
        
        // Ensure default prompts exist
        if(!(await DB.get('prompts', promptKey))) {
            const defaults = {
                fanfic_scene: "请基于以下关键词，生成一段极具画面感的同人小说名场面：{{input}}",
                fanfic_chat: "请生成一段符合人物性格的互动对话：{{input}}",
                fanfic_au: "请基于以下设定，构思一个平行宇宙(AU)的同人故事大纲：{{input}}"
            };
            if(defaults[promptKey]) await DB.put('prompts', {id: promptKey, name: promptKey, content: defaults[promptKey]});
        }
        
        let prompt = await Modules.short.getPrompt(promptKey);
        prompt = prompt.replace('{{input}}', input);
        
        document.getElementById('ff-out').value = "正在生成同人内容...";
        Modules.fanfic.updateIO(prompt, 'Generating...');
        
        let fullRes = "";
        await AI.generate(prompt, {}, c => {
            document.getElementById('ff-out').value = fullRes + c;
            fullRes += c;
            Modules.fanfic.updateIO(prompt, fullRes);
        });
    },
    continueRun: async () => {
        const current = document.getElementById('ff-out').value;
        if (!current) return UI.toast("请先生成内容");
        
        const prompt = `[Context]\n${current.slice(-1000)}\n\n[Task]\nContinue writing the fanfic scene/dialogue from where it left off.`;
        Modules.fanfic.updateIO(prompt, 'Generating...');
        UI.toast("正在继续生成...");
        
        let fullRes = current;
        await AI.generate(prompt, {}, c => {
            fullRes += c;
            const el = document.getElementById('ff-out');
            el.value = fullRes;
            el.scrollTop = el.scrollHeight;
            Modules.fanfic.updateIO(prompt, fullRes);
        });
    },
    saveToLib: async () => {
        const content = document.getElementById('ff-out').value;
        if(!content) return;
        const id = Utils.uuid();
        await DB.put('library_books', {
            id,
            name: `同人创作_${new Date().toLocaleTimeString()}`,
            type: 'txt',
            content: content,
            date: new Date().toLocaleDateString()
        });
        UI.toast('已保存到沉浸阅读');
    }
};

// 13. TABLE & TYPESET
Modules.table = {
    render: () => `
        <div class="layout-golden">
            <!-- 70% Table (Left) -->
            <div class="col-content bg-black/20 p-8">
                <div class="flex-1 overflow-auto bg-black/40 backdrop-blur border border-white/10 rounded-xl shadow-2xl h-full">
                    <table class="w-full text-left border-collapse">
                        <thead class="bg-white/5 text-xs uppercase text-dim font-bold tracking-wider sticky top-0 backdrop-blur-md z-10">
                            <tr>
                                <th class="p-4 border-b border-white/10">ID</th>
                                <th class="p-4 border-b border-white/10">名称</th>
                                <th class="p-4 border-b border-white/10">生命值 (HP)</th>
                                <th class="p-4 border-b border-white/10">攻击力 (ATK)</th>
                                <th class="p-4 border-b border-white/10">描述</th>
                            </tr>
                        </thead>
                        <tbody class="text-sm font-mono text-gray-300">
                            <tr class="hover:bg-white/5 transition-colors border-b border-white/5">
                                <td class="p-4 text-dim">1001</td>
                                <td class="p-4 font-bold text-accent">远古巨龙</td>
                                <td class="p-4">50,000</td>
                                <td class="p-4 text-red-400">8,500</td>
                                <td class="p-4 text-dim">终局 Boss</td>
                            </tr>
                             <tr class="hover:bg-white/5 transition-colors border-b border-white/5">
                                <td class="p-4 text-dim">1002</td>
                                <td class="p-4 font-bold text-blue-400">史莱姆</td>
                                <td class="p-4">50</td>
                                <td class="p-4 text-red-400">5</td>
                                <td class="p-4 text-dim">新手怪物</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- 30% Tools (Right) -->
            <div class="col-nav p-6 gap-6">
                <h2 class="text-2xl font-bold text-main mb-4"><i class="fa-solid fa-table mr-2 text-green-500"></i> 数值配置</h2>
                <div class="flex flex-col gap-2">
                    <button class="btn h-12 justify-start px-4 hover:bg-white/10 rounded-lg text-left"><i class="fa-solid fa-file-import mr-3 text-dim"></i> 导入 Excel/CSV</button>
                    <button class="btn h-12 justify-start px-4 hover:bg-white/10 rounded-lg text-left"><i class="fa-solid fa-download mr-3 text-dim"></i> 导出 JSON</button>
                </div>
                <div class="card bg-black/20 p-4 text-xs text-dim leading-relaxed">
                    <p>支持拖拽上传表格文件。系统将自动解析表头与数据类型。</p>
                </div>
            </div>
        </div>
    `
};

Modules.typeset = {
    settings: { font: "'Songti SC', serif", size: 16, lineHeight: 1.8, indent: '2em', margin: 25, columns: 1, align: 'justify', theme: 'light' },
    render: () => `
        <div class="layout-golden">
            <!-- Preview (Left 70%) -->
            <div class="col-content bg-[#2a2a2a] p-8 flex justify-center overflow-auto relative scrollbar-thin" style="background-image: radial-gradient(#333 1px, transparent 1px); background-size: 20px 20px;">
                <div id="ty-container" class="relative transition-transform duration-300 ease-out origin-top my-10">
                    <div id="ty-paper" class="bg-white shadow-[0_10px_60px_rgba(0,0,0,0.5)] w-[210mm] min-h-[297mm] h-auto p-[25mm] text-black relative transition-colors duration-300 box-border">
                        <!-- Dynamic Content -->
                    </div>
                </div>
                
                <!-- Floating Controls -->
                <div class="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-2 bg-black/80 p-2 rounded-full backdrop-blur border border-white/10 shadow-xl z-20">
                    <button class="w-10 h-10 rounded-full flex center text-white hover:bg-white/20 transition-colors" onclick="Modules.typeset.zoom(-0.1)" title="缩小"><i class="fa-solid fa-minus"></i></button>
                    <span class="flex center text-xs font-mono w-12 text-dim" id="ty-zoom-level">85%</span>
                    <button class="w-10 h-10 rounded-full flex center text-white hover:bg-white/20 transition-colors" onclick="Modules.typeset.zoom(0.1)" title="放大"><i class="fa-solid fa-plus"></i></button>
                    <div class="w-px h-6 bg-white/20 my-auto mx-1"></div>
                    <button class="w-10 h-10 rounded-full flex center text-white hover:bg-white/20 transition-colors" onclick="Modules.typeset.setTheme('light')" title="白纸"><div class="w-4 h-4 bg-white rounded-full border border-gray-400"></div></button>
                    <button class="w-10 h-10 rounded-full flex center text-white hover:bg-white/20 transition-colors" onclick="Modules.typeset.setTheme('sepia')" title="羊皮纸"><div class="w-4 h-4 bg-[#f4ecd8] rounded-full border border-yellow-600"></div></button>
                    <button class="w-10 h-10 rounded-full flex center text-white hover:bg-white/20 transition-colors" onclick="Modules.typeset.setTheme('dark')" title="夜间"><div class="w-4 h-4 bg-[#1a1a1a] rounded-full border border-gray-600"></div></button>
                </div>
            </div>

            <!-- Controls (Right 30%) -->
            <div class="col-nav p-6 gap-6 bg-[#18181b] border-l border-white/10 w-96 z-10 shadow-2xl">
                <div class="flex items-center justify-between mb-2">
                    <h2 class="text-2xl font-bold text-white flex items-center gap-3"><i class="fa-solid fa-text-height text-yellow-500"></i> 智能排版</h2>
                    <button class="btn btn-xs bg-yellow-600/20 text-yellow-500 border border-yellow-600/50 hover:bg-yellow-600 hover:text-black font-bold" onclick="Modules.typeset.aiFormat()"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i> 一键美化</button>
                </div>
                
                <div class="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-thin">
                    <div class="card bg-black/20 border-white/5 p-4 flex flex-col gap-4">
                        <span class="text-xs font-bold text-dim uppercase tracking-wider border-b border-white/5 pb-2">字体与布局</span>
                        
                        <div class="col gap-2">
                            <span class="text-xs font-bold text-dim">字体选择</span>
                            <select class="epic-input h-9 rounded text-xs text-white px-2" onchange="Modules.typeset.update('font', this.value)">
                                <option value="'Songti SC', serif">宋体 (Songti)</option>
                                <option value="'Kaiti SC', serif">楷体 (Kaiti)</option>
                                <option value="'Heiti SC', sans-serif">黑体 (Heiti)</option>
                                <option value="'Times New Roman', serif">Times New Roman</option>
                                <option value="'Arial', sans-serif">Arial</option>
                            </select>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div class="col gap-2">
                                <span class="text-xs font-bold text-dim">字号 (pt)</span>
                                <div class="flex items-center bg-black/50 rounded border border-white/10">
                                    <button class="w-8 h-8 flex center hover:text-white text-dim" onclick="Modules.typeset.adjust('size', -1)"><i class="fa-solid fa-minus text-[10px]"></i></button>
                                    <input type="number" class="w-full bg-transparent border-none text-center text-xs text-white h-8 focus:outline-none" value="16" id="ty-input-size" onchange="Modules.typeset.update('size', this.value)">
                                    <button class="w-8 h-8 flex center hover:text-white text-dim" onclick="Modules.typeset.adjust('size', 1)"><i class="fa-solid fa-plus text-[10px]"></i></button>
                                </div>
                            </div>
                            <div class="col gap-2">
                                <span class="text-xs font-bold text-dim">行距 (em)</span>
                                <div class="flex items-center bg-black/50 rounded border border-white/10">
                                    <button class="w-8 h-8 flex center hover:text-white text-dim" onclick="Modules.typeset.adjust('lineHeight', -0.1)"><i class="fa-solid fa-minus text-[10px]"></i></button>
                                    <input type="number" class="w-full bg-transparent border-none text-center text-xs text-white h-8 focus:outline-none" value="1.8" step="0.1" id="ty-input-lineHeight" onchange="Modules.typeset.update('lineHeight', this.value)">
                                    <button class="w-8 h-8 flex center hover:text-white text-dim" onclick="Modules.typeset.adjust('lineHeight', 0.1)"><i class="fa-solid fa-plus text-[10px]"></i></button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div class="col gap-2">
                                <span class="text-xs font-bold text-dim">页边距 (mm)</span>
                                <input type="range" class="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-yellow-500" min="10" max="50" value="25" oninput="Modules.typeset.update('margin', this.value)">
                            </div>
                            <div class="col gap-2">
                                <span class="text-xs font-bold text-dim">分栏</span>
                                <div class="flex bg-black/50 rounded border border-white/10 p-0.5">
                                    <button class="flex-1 btn-xs hover:bg-white/10 text-dim hover:text-white rounded" onclick="Modules.typeset.update('columns', 1)">1</button>
                                    <button class="flex-1 btn-xs hover:bg-white/10 text-dim hover:text-white rounded" onclick="Modules.typeset.update('columns', 2)">2</button>
                                    <button class="flex-1 btn-xs hover:bg-white/10 text-dim hover:text-white rounded" onclick="Modules.typeset.update('columns', 3)">3</button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col gap-2">
                            <span class="text-xs font-bold text-dim">对齐方式</span>
                            <div class="flex bg-black/50 rounded border border-white/10 p-1">
                                <button class="flex-1 btn-xs hover:bg-white/10 text-dim hover:text-white" onclick="Modules.typeset.update('align', 'left')"><i class="fa-solid fa-align-left"></i></button>
                                <button class="flex-1 btn-xs hover:bg-white/10 text-dim hover:text-white" onclick="Modules.typeset.update('align', 'center')"><i class="fa-solid fa-align-center"></i></button>
                                <button class="flex-1 btn-xs hover:bg-white/10 text-dim hover:text-white" onclick="Modules.typeset.update('align', 'right')"><i class="fa-solid fa-align-right"></i></button>
                                <button class="flex-1 btn-xs hover:bg-white/10 text-dim hover:text-white text-yellow-500" onclick="Modules.typeset.update('align', 'justify')"><i class="fa-solid fa-align-justify"></i></button>
                            </div>
                        </div>
                    </div>

                    <div class="flex-1 flex col gap-2 min-h-[200px]">
                        <span class="text-xs font-bold text-dim uppercase tracking-wider">文本内容</span>
                        <textarea id="ty-in" class="flex-1 bg-black/40 border-white/10 rounded-lg p-4 text-xs text-gray-300 resize-none focus:border-yellow-500 transition-colors placeholder-white/20 leading-relaxed scrollbar-thin" placeholder="在此粘贴需要排版的文本..." oninput="Modules.typeset.renderPage()"></textarea>
                    </div>
                </div>
                
                <div class="flex gap-2 pt-4 border-t border-white/5">
                    <button class="epic-btn flex-1 h-10 rounded text-xs" onclick="Modules.typeset.exportPDF()">
                        <i class="fa-solid fa-file-pdf mr-2"></i> PDF
                    </button>
                    <button class="epic-btn flex-1 h-10 rounded text-xs" onclick="Modules.typeset.exportImage()">
                        <i class="fa-solid fa-image mr-2"></i> 图片
                    </button>
                    <button class="epic-btn flex-1 h-10 rounded text-xs bg-yellow-600/20 text-yellow-400 border-yellow-600/50 hover:bg-yellow-600 hover:text-white" onclick="window.print()">
                        <i class="fa-solid fa-print mr-2"></i> 打印
                    </button>
                </div>
            </div>
        </div>
    `,
    zoomLevel: 0.85,
    update: (k, v) => {
        Modules.typeset.settings[k] = v;
        if(document.getElementById(`ty-input-${k}`)) document.getElementById(`ty-input-${k}`).value = v;
        Modules.typeset.renderPage();
    },
    adjust: (k, delta) => {
        let val = parseFloat(Modules.typeset.settings[k]);
        val += delta;
        if(k === 'size') val = Math.max(8, val);
        if(k === 'lineHeight') val = Math.max(1.0, val);
        // Round to 1 decimal
        val = Math.round(val * 10) / 10;
        Modules.typeset.update(k, val);
    },
    zoom: (d) => {
        Modules.typeset.zoomLevel = Math.min(Math.max(0.5, Modules.typeset.zoomLevel + d), 2.0);
        document.getElementById('ty-container').style.transform = `scale(${Modules.typeset.zoomLevel})`;
        document.getElementById('ty-zoom-level').innerText = Math.round(Modules.typeset.zoomLevel * 100) + '%';
    },
    setTheme: (t) => {
        Modules.typeset.settings.theme = t;
        const p = document.getElementById('ty-paper');
        if(t === 'light') { p.style.background = '#fff'; p.style.color = '#000'; }
        if(t === 'sepia') { p.style.background = '#f4ecd8'; p.style.color = '#5b4636'; }
        if(t === 'dark') { p.style.background = '#1a1a1a'; p.style.color = '#ccc'; }
    },
    aiFormat: async () => {
        const txt = document.getElementById('ty-in').value;
        if(!txt) return UI.toast('请先输入文本');
        
        UI.toast('AI 正在分析文本结构...');
        
        // Simulating AI analysis
        setTimeout(() => {
            // Heuristic for "best" settings
            const isChinese = /[\u4e00-\u9fa5]/.test(txt);
            const settings = {
                font: isChinese ? "'Songti SC', serif" : "'Times New Roman', serif",
                size: 16,
                lineHeight: 2.0,
                indent: '2em',
                margin: 30,
                columns: txt.length > 1000 ? 2 : 1,
                align: 'justify'
            };
            
            // Apply settings
            for(let k in settings) Modules.typeset.update(k, settings[k]);
            
            // Auto-format text (add spacing for headers)
            let formatted = txt.replace(/^#\s+(.*)/gm, '# $1\n'); // Ensure space after h1
            formatted = formatted.replace(/\n\n+/g, '\n\n'); // Normalize newlines
            document.getElementById('ty-in').value = formatted;
            Modules.typeset.renderPage();
            
            UI.toast('已应用最佳排版方案');
        }, 800);
    },
    renderPage: () => {
        const txt = document.getElementById('ty-in').value || "预览内容...\n\n请输入文本以查看效果。";
        const paper = document.getElementById('ty-paper');
        const s = Modules.typeset.settings;
        
        paper.style.fontFamily = s.font;
        paper.style.fontSize = s.size + 'px';
        paper.style.lineHeight = s.lineHeight;
        paper.style.padding = s.margin + 'mm';
        paper.style.columnCount = s.columns;
        paper.style.columnGap = '2em';
        
        // Better rendering logic
        const html = txt.split('\n').map(line => {
            line = line.trim();
            if (!line) return '<br>';
            if (line.startsWith('# ')) return `<h1 style="font-size: 2em; font-weight: bold; margin-bottom: 1em; text-align: center; break-after: avoid;">${line.replace('# ', '')}</h1>`;
            if (line.startsWith('## ')) return `<h2 style="font-size: 1.5em; font-weight: bold; margin-top: 1em; margin-bottom: 0.8em; break-after: avoid;">${line.replace('## ', '')}</h2>`;
            if (line.startsWith('---')) return `<hr style="border: 0; border-top: 1px solid currentColor; margin: 2em 0; opacity: 0.5;">`;
            return `<p style="text-indent: ${s.indent||'2em'}; margin-bottom: ${s.size * 0.8}px; text-align: ${s.align||'justify'}; word-break: break-word;">${line}</p>`;
        }).join('');
        
        paper.innerHTML = html;
    },
    exportPDF: () => {
        UI.toast('正在生成 PDF...');
        setTimeout(() => window.print(), 500);
    },
    exportImage: () => {
        UI.toast('正在生成图片 (模拟)...');
    }
};

Modules.md_render = {
    render: () => `
        <div class="layout-golden">
            <div class="col-nav p-0 flex col border-r border-white/10">
                <textarea id="md-input" class="w-full h-full bg-[#1e1e1e] text-gray-300 p-6 font-mono text-sm resize-none focus:outline-none" oninput="Modules.md_render.parse()" placeholder="# Markdown Editor\n\nType here..."></textarea>
            </div>
            <div class="col-content bg-white text-black p-8 overflow-y-auto" id="md-preview"></div>
        </div>
    `,
    parse: () => {
        const raw = document.getElementById('md-input').value;
        document.getElementById('md-preview').innerHTML = marked.parse(raw);
    }
};

// 14. GAME CENTER (12 Genres)
Modules.games = {
    engine: null,
    render: () => `
        <div class="layout-golden">
            <div class="col-content bg-black relative flex center overflow-hidden select-none">
                <!-- Retro CRT Effect Overlay -->
                <div class="absolute inset-0 pointer-events-none z-10 opacity-10" style="background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06)); background-size: 100% 2px, 3px 100%;"></div>
                
                <canvas id="game-canvas-real" class="bg-[#050505] shadow-[0_0_50px_rgba(124,58,237,0.3)] border border-white/10 outline-none rounded-lg" width="800" height="600" tabindex="0"></canvas>
                
                <div id="game-overlay" class="absolute inset-0 flex center flex-col bg-black/90 z-20 backdrop-blur-sm">
                    <h1 class="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 mb-2 tracking-tighter" style="text-shadow: 0 0 20px rgba(139,92,246,0.5)">NEXUS ARCADE</h1>
                    <p class="text-purple-300/50 text-xs tracking-[0.5em] mb-12 uppercase font-mono">Select Your Reality</p>
                    
                    <div class="grid grid-cols-4 gap-4 w-3/4 max-w-5xl max-h-[600px] overflow-y-auto p-4 scrollbar-thin">
                        ${[
                            {id:'rogue', name:'地牢 Rogue', icon:'fa-dungeon', color:'text-orange-500', desc:'地牢探险与战斗'},
                            {id:'card', name:'卡牌地牢', icon:'fa-diamond', color:'text-red-500', desc:'策略卡牌构建'},
                            {id:'sandbox2d', name:'2D 沙盒', icon:'fa-cubes', color:'text-green-500', desc:'自由挖掘与建造'},
                            {id:'mc3d', name:'3D 建造', icon:'fa-cube', color:'text-emerald-500', desc:'3D方块世界'},
                            {id:'shooter', name:'3D 射击', icon:'fa-crosshairs', color:'text-blue-500', desc:'弹幕射击生存'},
                            {id:'racing', name:'3D 赛车', icon:'fa-flag-checkered', color:'text-yellow-500', desc:'极速赛车挑战'},
                            {id:'civ', name:'文明崛起', icon:'fa-landmark', color:'text-amber-600', desc:'回合制策略模拟'},
                            {id:'war', name:'魔兽争霸', icon:'fa-shield-halved', color:'text-red-700', desc:'即时战略 RTS'},
                            {id:'wuxia', name:'武侠模拟', icon:'fa-khanda', color:'text-cyan-500', desc:'文字武侠人生'},
                            {id:'xiuxian', name:'修仙问道', icon:'fa-cloud', color:'text-sky-300', desc:'挂机修仙模拟'},
                            {id:'rpg', name:'开放世界', icon:'fa-earth-americas', color:'text-indigo-400', desc:'自由探索 RPG'},
                            {id:'gal', name:'GAL Game', icon:'fa-heart', color:'text-pink-500', desc:'恋爱模拟文字'},
                            {id:'snake', name:'贪吃蛇', icon:'fa-staff-snake', color:'text-green-400', desc:'经典贪吃蛇'}
                        ].map(g => `
                            <button class="epic-card p-6 flex flex-col items-center gap-3 group hover:scale-105 transition-transform bg-[#1a1a1a]" onclick="Modules.games.launch('${g.id}')">
                                <div class="w-16 h-16 rounded-full bg-white/5 flex center group-hover:bg-white/10 transition-colors shadow-inner">
                                    <i class="fa-solid ${g.icon} text-3xl ${g.color} group-hover:animate-bounce"></i>
                                </div>
                                <div class="text-center">
                                    <span class="text-sm font-bold text-gray-200 group-hover:text-white block">${g.name}</span>
                                    <span class="text-[9px] text-dim uppercase tracking-wider">${g.desc}</span>
                                </div>
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <div class="col-nav w-80 bg-[#121212] border-l border-white/10 p-6 flex col z-30 shadow-2xl">
                <div class="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                    <div class="w-10 h-10 rounded bg-purple-600/20 flex center border border-purple-600/50 text-purple-400"><i class="fa-solid fa-gamepad"></i></div>
                    <div>
                        <h3 class="text-sm font-bold text-white uppercase">Game Control</h3>
                        <p class="text-[10px] text-dim">System Ready</p>
                    </div>
                </div>
                
                <div class="flex-1 bg-black/50 rounded-lg border border-white/5 p-4 overflow-y-auto font-mono text-xs text-green-400 leading-relaxed shadow-inner" id="game-info-panel">
                    <div class="text-center text-dim mt-10 opacity-50">
                        <i class="fa-solid fa-circle-play text-4xl mb-4"></i><br>
                        WAITING FOR CARTRIDGE...
                    </div>
                </div>
                
                <div class="mt-6 space-y-4">
                    <div class="grid grid-cols-2 gap-2 text-[10px] text-gray-400 font-bold text-center">
                        <div class="bg-white/5 p-2 rounded border border-white/5">W A S D<br><span class="text-dim font-normal">MOVE</span></div>
                        <div class="bg-white/5 p-2 rounded border border-white/5">SPACE<br><span class="text-dim font-normal">ACTION</span></div>
                        <div class="bg-white/5 p-2 rounded border border-white/5">R<br><span class="text-dim font-normal">RESET</span></div>
                        <div class="bg-white/5 p-2 rounded border border-white/5">ESC<br><span class="text-dim font-normal">PAUSE</span></div>
                    </div>
                    <button class="epic-btn w-full h-12 rounded-lg bg-red-600/20 text-red-500 border-red-600/50 hover:bg-red-600 hover:text-white font-bold flex center gap-2 shadow-lg" onclick="Modules.games.stop()">
                        <i class="fa-solid fa-power-off"></i> QUIT GAME
                    </button>
                </div>
            </div>
        </div>
    `,
    
    stop: () => {
        if(Modules.games.engine) {
            Modules.games.engine.stop();
            Modules.games.engine = null;
        }
        document.getElementById('game-overlay').classList.remove('hidden');
        document.getElementById('game-info-panel').innerHTML = `<div class="text-center text-dim mt-10"><i class="fa-solid fa-arrow-left text-2xl mb-2"></i><br>请选择左侧游戏开始</div>`;
    },

    launch: (type) => {
        document.getElementById('game-overlay').classList.add('hidden');
        const canvas = document.getElementById('game-canvas-real');
        canvas.focus();
        
        if (Modules.games.engine) Modules.games.engine.stop();
        
        // Initialize the correct engine based on type
        switch(type) {
            case 'rogue': Modules.games.engine = new RogueEngine(canvas); break;
            case 'card': Modules.games.engine = new CardEngine(canvas); break;
            case 'sandbox2d': Modules.games.engine = new SandboxEngine(canvas); break;
            case 'mc3d': Modules.games.engine = new Builder3DEngine(canvas); break;
            case 'shooter': Modules.games.engine = new ShooterEngine(canvas); break;
            case 'racing': Modules.games.engine = new RacingEngine(canvas); break;
            case 'civ': Modules.games.engine = new CivEngine(canvas); break;
            case 'war': Modules.games.engine = new WarEngine(canvas); break;
            case 'wuxia': Modules.games.engine = new WuxiaEngine(canvas); break;
            case 'xiuxian': Modules.games.engine = new XiuxianEngine(canvas); break;
            case 'rpg': Modules.games.engine = new OpenWorldEngine(canvas); break;
            case 'gal': Modules.games.engine = new GalEngine(canvas); break;
            case 'snake': Modules.games.engine = new SnakeEngine(canvas); break;
            default: Modules.games.engine = new BaseGameEngine(canvas); break;
        }
        
        Modules.games.engine.start();
        
        // Update Info Panel
        const panel = document.getElementById('game-info-panel');
        panel.innerHTML = `<div class="text-green-400 font-bold mb-2">正在运行: ${type.toUpperCase()}</div><div id="game-status-log">初始化完成...</div>`;
    },

    // --- GAME ENGINES HELPERS ---
    initCard: () => {
        Modules.games.state = {
            hp: 80, maxHp: 80, energy: 3, maxEnergy: 3, block: 0,
            enemy: { hp: 120, maxHp: 120, intent: 'attack', val: 12, name: '混沌魔物' },
            hand: [],
            deck: ['打击', '打击', '打击', '防御', '防御', '重击', '打击', '防御'],
            discard: [],
            turn: 1
        };
        Modules.games.drawCard(5);
        document.getElementById('game-info-panel').innerHTML = `
            <div class="text-red-400 font-bold">卡牌地牢</div>
            <br>当前回合: ${Modules.games.state.turn}<br>敌人意图: 攻击 (${Modules.games.state.enemy.val} 点伤害)
        `;
        
        // Input handler for cards
        const canvas = document.getElementById('game-canvas-real');
        canvas.onclick = (e) => {
            if (Modules.games.type !== 'card') return;
            
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Check card clicks
            const s = Modules.games.state;
            if (!s || !s.hand || !s.hand.length) return;
            
            const cardW = 100, cardH = 140, spacing = 110;
            const startX = 400 - (s.hand.length * spacing) / 2;
            
            // Iterate backwards to handle overlaps correctly (top card first)
            for(let i = s.hand.length - 1; i >= 0; i--) {
                const cx = startX + i * spacing;
                const cy = 400;
                if(x >= cx && x <= cx + cardW && y >= cy && y <= cy + cardH) {
                    Modules.games.playCard(i);
                    return; // Play only one card per click
                }
            }
            
            // End Turn Button
            if(x > 650 && y > 500 && x < 750 && y < 550) {
                Modules.games.endTurn();
            }
        };
    },
    drawCard: (n) => {
        const s = Modules.games.state;
        for(let i=0; i<n; i++) {
            if(s.deck.length === 0) { s.deck = [...s.discard]; s.discard = []; } // Reshuffle
            if(s.deck.length > 0) {
                const idx = Math.floor(Math.random() * s.deck.length);
                s.hand.push(s.deck.splice(idx, 1)[0]);
            }
        }
    },
    playCard: (idx) => {
        const s = Modules.games.state;
        const card = s.hand[idx];
        if(s.energy <= 0) return UI.toast('精力不足！');
        
        s.energy--;
        if(card === '打击') { s.enemy.hp -= 6; UI.toast('造成 6 点伤害'); }
        if(card === '防御') { s.block += 5; UI.toast('获得 5 点格挡'); }
        if(card === '重击') { s.enemy.hp -= 8; UI.toast('造成 8 点伤害'); }
        
        s.discard.push(card);
        s.hand.splice(idx, 1);
        
        if(s.enemy.hp <= 0) {
            UI.toast('敌人被击败！');
            s.enemy = { hp: 150, maxHp: 150, intent: 'attack', val: 15, name: '深渊教徒' };
            s.hand = []; s.discard = []; s.energy = s.maxEnergy; s.block = 0;
            Modules.games.drawCard(5);
        }
    },
    endTurn: () => {
        const s = Modules.games.state;
        // Enemy Action
        if(s.enemy.intent === 'attack') {
            let dmg = s.enemy.val - s.block;
            if(dmg < 0) dmg = 0;
            s.hp -= dmg;
            UI.toast(`敌人造成了 ${dmg} 点伤害！`);
        }
        
        s.hand.forEach(c => s.discard.push(c));
        s.hand = [];
        s.energy = s.maxEnergy;
        s.block = 0;
        Modules.games.drawCard(5);
        
        if(s.hp <= 0) {
            alert('游戏结束');
            Modules.games.launch('card'); // Restart
        }
    },

    // 2. Rogue
    initRogue: () => {
        Modules.games.state = {
            player: { x: 400, y: 300, w: 20, h: 20, color: '#f0b90b' },
            enemies: Array.from({length: 10}, () => ({ x: Math.random()*700, y: Math.random()*500, w: 20, h: 20, color: '#f6465d', type: 'goblin' }))
        };
        window.onkeydown = (e) => {
            const p = Modules.games.state.player;
            if(e.key==='w') p.y-=10;
            if(e.key==='s') p.y+=10;
            if(e.key==='a') p.x-=10;
            if(e.key==='d') p.x+=10;
        };
    },

    // 3. Shooter
    initShooter: () => {
        Modules.games.state = {
            player: { x: 400, y: 500, w: 30, h: 30, color: '#3b82f6' },
            bullets: [],
            enemies: []
        };
        window.onkeydown = (e) => {
            const p = Modules.games.state.player;
            if(e.key==='a') p.x-=15;
            if(e.key==='d') p.x+=15;
            if(e.key===' ') Modules.games.state.bullets.push({x: p.x+12, y: p.y, w: 6, h: 15, color: '#fff'});
        };
    },

    // 4. Sandbox
    initSandbox: () => {
        Modules.games.type = 'sandbox2d';
        Modules.games.state = {
            blocks: Array.from({length: 20}, (_,i) => ({x: i*40, y: 500, w: 40, h: 40, c: '#5c4033'})),
            player: { x: 100, y: 400, w: 30, h: 50, vy: 0, grounded: false }
        };
        window.onkeydown = (e) => {
            if(Modules.games.type !== 'sandbox2d') return;
            const s = Modules.games.state;
            if(!s || !s.player) return;
            const p = s.player;
            if(e.key==='a') p.x-=5;
            if(e.key==='d') p.x+=5;
            if(e.key===' ' && p.grounded) { p.vy = -10; p.grounded = false; }
        };
    },
    
    // --- NEW GENRES ---
    
    // 5. 3D Builder (Iso Sim)
    initMc3d: () => {
        Modules.games.type = 'mc3d';
        Modules.games.state = { blocks: [], cursor: {x:0,y:0} };
        // Populate random terrain
        for(let i=0; i<10; i++) {
            for(let j=0; j<10; j++) {
                Modules.games.state.blocks.push({x:i, y:j, z:0, c: '#5c4033'}); // Dirt
                if(Math.random()>0.8) Modules.games.state.blocks.push({x:i, y:j, z:1, c: '#22c55e'}); // Grass
            }
        }
    },
    
    // 6. Racing
    initRacing: () => {
        Modules.games.type = 'racing';
        Modules.games.state = { carX: 400, speed: 0, roadOffset: 0 };
        window.onkeydown = (e) => {
            if(Modules.games.type !== 'racing') return;
            const s = Modules.games.state;
            if(!s) return;
            if(e.key==='a') s.carX -= 10;
            if(e.key==='d') s.carX += 10;
            if(e.key==='w') s.speed += 1;
            if(e.key==='s') s.speed -= 1;
        };
    },

    // 7. Civ
    initCiv: () => {
        Modules.games.type = 'civ';
        Modules.games.state = {
            tiles: Array.from({length: 64}, (_,i) => ({x: (i%8)*50 + 200, y: Math.floor(i/8)*50 + 100, type: Math.random()>0.8?'water':'land'})),
            units: [{x: 200, y: 100, type: 'warrior'}]
        };
    },
    
    // 8. War
    initWar: () => {
        Modules.games.type = 'war';
        Modules.games.state = {
            units: [
                {x: 100, y: 100, team: 'human', hp: 100},
                {x: 600, y: 400, team: 'orc', hp: 100}
            ],
            selection: null
        };
        // Simple RTS click
        document.getElementById('game-canvas-real').onclick = (e) => {
            if(Modules.games.type !== 'war') return;
            const rect = e.target.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            Modules.games.state.units[0].tx = x;
            Modules.games.state.units[0].ty = y;
        };
    },
    
    // 9. Wuxia
    initWuxia: () => {
        Modules.games.type = 'wuxia';
        Modules.games.state = { log: ["你出生在武林世家。"], stats: { kungfu: 10, fame: 0 } };
        // Text-heavy RPG visualization
    },
    
    // 10. Xianxia
    initXianxia: () => {
        Modules.games.type = 'xiuxian';
        Modules.games.state = { qi: 0, realm: 'Qi Refining 1', log: ["开始打坐..."] };
    },
    
    // 11. Open World
    initRpg: () => {
        Modules.games.type = 'rpg';
        Modules.games.state = { player: {x:400, y:300}, world: [] }; // Top down Zelda-like
        window.onkeydown = (e) => {
            if(Modules.games.type !== 'rpg') return;
            const s = Modules.games.state;
            if(!s || !s.player) return;
            const p = s.player;
            if(e.key==='w') p.y-=5; if(e.key==='s') p.y+=5;
            if(e.key==='a') p.x-=5; if(e.key==='d') p.x+=5;
        };
    },
    
    // 12. GAL
    initGal: () => {
        Modules.games.type = 'gal';
        Modules.games.state = {
            scene: 'school',
            text: 'Senpai, you are late again!',
            char: 'https://api.dicebear.com/7.x/miniavs/svg?seed=Girl'
        };
    },
    
    // --- NEW GENRES ---
    
    // 5. 3D Builder (Iso Sim)
    initMc3d: () => {
        Modules.games.type = 'mc3d';
        Modules.games.state = { blocks: [], cursor: {x:0,y:0} };
        // Populate random terrain
        for(let i=0; i<10; i++) {
            for(let j=0; j<10; j++) {
                Modules.games.state.blocks.push({x:i, y:j, z:0, c: '#5c4033'}); // Dirt
                if(Math.random()>0.8) Modules.games.state.blocks.push({x:i, y:j, z:1, c: '#22c55e'}); // Grass
            }
        }
    },
    
    // 6. Racing
    initRacing: () => {
        Modules.games.type = 'racing';
        Modules.games.state = { carX: 400, speed: 0, roadOffset: 0 };
        window.onkeydown = (e) => {
            if(Modules.games.type !== 'racing') return;
            if(e.key==='a') Modules.games.state.carX -= 10;
            if(e.key==='d') Modules.games.state.carX += 10;
            if(e.key==='w') Modules.games.state.speed += 1;
            if(e.key==='s') Modules.games.state.speed -= 1;
        };
    },

    // 7. Civ
    initCiv: () => {
        Modules.games.type = 'civ';
        Modules.games.state = {
            tiles: Array.from({length: 64}, (_,i) => ({x: (i%8)*50 + 200, y: Math.floor(i/8)*50 + 100, type: Math.random()>0.8?'water':'land'})),
            units: [{x: 200, y: 100, type: 'warrior'}]
        };
    },
    
    // 8. War
    initWar: () => {
        Modules.games.type = 'war';
        Modules.games.state = {
            units: [
                {x: 100, y: 100, team: 'human', hp: 100},
                {x: 600, y: 400, team: 'orc', hp: 100}
            ],
            selection: null
        };
        // Simple RTS click
        document.getElementById('game-canvas-real').onclick = (e) => {
            if(Modules.games.type !== 'war') return;
            const rect = e.target.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            Modules.games.state.units[0].tx = x;
            Modules.games.state.units[0].ty = y;
        };
    },
    
    // 9. Wuxia
    initWuxia: () => {
        Modules.games.type = 'wuxia';
        Modules.games.state = { log: ["你出生在武林世家。"], stats: { kungfu: 10, fame: 0 } };
        // Text-heavy RPG visualization
    },
    
    // 10. Xianxia
    initXianxia: () => {
        Modules.games.type = 'xiuxian';
        Modules.games.state = { qi: 0, realm: 'Qi Refining 1', log: ["开始打坐..."] };
    },
    
    // 11. Open World
    initRpg: () => {
        Modules.games.type = 'rpg';
        Modules.games.state = { player: {x:400, y:300}, world: [] }; // Top down Zelda-like
        window.onkeydown = (e) => {
            if(Modules.games.type !== 'rpg') return;
            const p = Modules.games.state.player;
            if(e.key==='w') p.y-=5; if(e.key==='s') p.y+=5;
            if(e.key==='a') p.x-=5; if(e.key==='d') p.x+=5;
        };
    },
    
    // 12. GAL
    initGal: () => {
        Modules.games.type = 'gal';
        Modules.games.state = {
            scene: 'school',
            text: 'Senpai, you are late again!',
            char: 'https://api.dicebear.com/7.x/miniavs/svg?seed=Girl'
        };
    },

    // --- NEW GENRES ---
    
    // 5. 3D Builder (Iso Sim)
    initMc3d: () => {
        Modules.games.type = 'mc3d';
        Modules.games.state = { blocks: [], cursor: {x:0,y:0} };
        // Populate random terrain
        for(let i=0; i<10; i++) {
            for(let j=0; j<10; j++) {
                Modules.games.state.blocks.push({x:i, y:j, z:0, c: '#5c4033'}); // Dirt
                if(Math.random()>0.8) Modules.games.state.blocks.push({x:i, y:j, z:1, c: '#22c55e'}); // Grass
            }
        }
    },
    
    // 6. Racing
    initRacing: () => {
        Modules.games.type = 'racing';
        Modules.games.state = { carX: 400, speed: 0, roadOffset: 0 };
        window.onkeydown = (e) => {
            if(Modules.games.type !== 'racing') return;
            if(e.key==='a') Modules.games.state.carX -= 10;
            if(e.key==='d') Modules.games.state.carX += 10;
            if(e.key==='w') Modules.games.state.speed += 1;
            if(e.key==='s') Modules.games.state.speed -= 1;
        };
    },

    // 7. Civ
    initCiv: () => {
        Modules.games.type = 'civ';
        Modules.games.state = {
            tiles: Array.from({length: 64}, (_,i) => ({x: (i%8)*50 + 200, y: Math.floor(i/8)*50 + 100, type: Math.random()>0.8?'water':'land'})),
            units: [{x: 200, y: 100, type: 'warrior'}]
        };
    },
    
    // 8. War
    initWar: () => {
        Modules.games.type = 'war';
        Modules.games.state = {
            units: [
                {x: 100, y: 100, team: 'human', hp: 100},
                {x: 600, y: 400, team: 'orc', hp: 100}
            ],
            selection: null
        };
        // Simple RTS click
        document.getElementById('game-canvas-real').onclick = (e) => {
            if(Modules.games.type !== 'war') return;
            const rect = e.target.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            Modules.games.state.units[0].tx = x;
            Modules.games.state.units[0].ty = y;
        };
    },
    
    // 9. Wuxia
    initWuxia: () => {
        Modules.games.type = 'wuxia';
        Modules.games.state = { log: ["你出生在武林世家。"], stats: { kungfu: 10, fame: 0 } };
        // Text-heavy RPG visualization
    },
    
    // 10. Xianxia
    initXianxia: () => {
        Modules.games.type = 'xiuxian';
        Modules.games.state = { qi: 0, realm: 'Qi Refining 1', log: ["开始打坐..."] };
    },
    
    // 11. Open World
    initRpg: () => {
        Modules.games.type = 'rpg';
        Modules.games.state = { player: {x:400, y:300}, world: [] }; // Top down Zelda-like
        window.onkeydown = (e) => {
            if(Modules.games.type !== 'rpg') return;
            const p = Modules.games.state.player;
            if(e.key==='w') p.y-=5; if(e.key==='s') p.y+=5;
            if(e.key==='a') p.x-=5; if(e.key==='d') p.x+=5;
        };
    },
    
    // 12. GAL
    initGal: () => {
        Modules.games.type = 'gal';
        Modules.games.state = {
            scene: 'school',
            text: 'Senpai, you are late again!',
            char: 'https://api.dicebear.com/7.x/miniavs/svg?seed=Girl'
        };
    },

    // 13. Snake
    initSnake: () => {
        Modules.games.type = 'snake';
        Modules.games.state = {
            snake: [{x: 10, y: 10}],
            food: {x: 15, y: 15},
            dir: {x: 1, y: 0},
            nextDir: {x: 1, y: 0},
            score: 0,
            tick: 0
        };
        window.onkeydown = (e) => {
            if(Modules.games.type !== 'snake') return;
            const s = Modules.games.state;
            if(e.key === 'ArrowUp' && s.dir.y === 0) s.nextDir = {x: 0, y: -1};
            if(e.key === 'ArrowDown' && s.dir.y === 0) s.nextDir = {x: 0, y: 1};
            if(e.key === 'ArrowLeft' && s.dir.x === 0) s.nextDir = {x: -1, y: 0};
            if(e.key === 'ArrowRight' && s.dir.x === 0) s.nextDir = {x: 1, y: 0};
        };
    },

    // Generic Placeholder
    initGeneric: (type) => {
        Modules.games.state = { type: type, tick: 0 };
    },

    loop: () => {
        const ctx = Modules.games.ctx;
        const canvas = document.getElementById('game-canvas-real');
        if(!ctx) return;
        
        ctx.fillStyle = '#111';
        ctx.fillRect(0,0, canvas.width, canvas.height);
        
        const s = Modules.games.state;
        const type = Modules.games.type;

        if (type === 'card') {
            // Draw Player & Enemy
            ctx.fillStyle = '#3b82f6';
            ctx.fillRect(100, 200, 80, 120); // Player
            ctx.fillStyle = '#fff'; ctx.font = '20px monospace';
            ctx.fillText(`HP: ${s.hp}/${s.maxHp}`, 100, 180);
            ctx.fillText(`Block: ${s.block}`, 100, 340);
            ctx.fillText(`Energy: ${s.energy}/${s.maxEnergy}`, 20, 550);
            
            ctx.fillStyle = '#f6465d';
            ctx.fillRect(600, 200, 100, 120); // Enemy
            ctx.fillStyle = '#fff';
            ctx.fillText(`${s.enemy.name}`, 600, 180);
            ctx.fillText(`HP: ${s.enemy.hp}/${s.enemy.maxHp}`, 600, 340);
            ctx.fillStyle = '#f0b90b';
            ctx.fillText(`Intent: ${s.enemy.val} DMG`, 600, 150);
            
            // Draw Hand
            const cardW = 100, cardH = 140, spacing = 110;
            const startX = 400 - (s.hand.length * spacing) / 2;
            
            s.hand.forEach((card, i) => {
                const cx = startX + i * spacing;
                const cy = 400;
                ctx.fillStyle = '#eee';
                ctx.fillRect(cx, cy, cardW, cardH);
                ctx.strokeStyle = '#000';
                ctx.strokeRect(cx, cy, cardW, cardH);
                
                ctx.fillStyle = '#000';
                ctx.font = '14px "Microsoft YaHei"';
                ctx.fillText(card, cx + 10, cy + 30);
                
                let desc = '';
                if(card==='打击') desc = '6 伤害';
                if(card==='防御') desc = '5 格挡';
                if(card==='重击') desc = '8 伤害';
                ctx.fillStyle = '#666';
                ctx.fillText(desc, cx + 10, cy + 80);
                
                ctx.fillStyle = '#3b82f6';
                ctx.beginPath(); ctx.arc(cx+15, cy+15, 10, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = '#fff'; ctx.fillText('1', cx+11, cy+19);
            });
            
            // End Turn
            ctx.fillStyle = '#f0b90b';
            ctx.fillRect(650, 500, 100, 50);
            ctx.fillStyle = '#000'; ctx.font = '14px "Microsoft YaHei"'; ctx.fillText('结束回合', 665, 530);
            
        } else if (type === 'rogue') {
            ctx.fillStyle = s.player.color;
            ctx.fillRect(s.player.x, s.player.y, s.player.w, s.player.h);
            s.enemies.forEach(e => {
                ctx.fillStyle = e.color;
                ctx.fillRect(e.x, e.y, e.w, e.h);
                if(e.x < s.player.x) e.x += 0.5;
                if(e.x > s.player.x) e.x -= 0.5;
                if(e.y < s.player.y) e.y += 0.5;
                if(e.y > s.player.y) e.y -= 0.5;
            });
            
        } else if (type === 'shooter') {
             // Spawn enemies
            if(Math.random() < 0.05) s.enemies.push({x: Math.random()*800, y: 0, w: 30, h: 30, color: '#ef4444'});
            
            ctx.fillStyle = s.player.color;
            ctx.fillRect(s.player.x, s.player.y, s.player.w, s.player.h);
            
            s.bullets.forEach((b, bi) => {
                b.y -= 10;
                ctx.fillStyle = b.color;
                ctx.fillRect(b.x, b.y, b.w, b.h);
                s.enemies.forEach((e, ei) => {
                    if (b.x < e.x + e.w && b.x + b.w > e.x && b.y < e.y + e.h && b.y + b.h > e.y) {
                        s.enemies.splice(ei, 1);
                        s.bullets.splice(bi, 1);
                    }
                });
            });
            
            s.enemies.forEach(e => {
                e.y += 2;
                ctx.fillStyle = e.color;
                ctx.fillRect(e.x, e.y, e.w, e.h);
            });
            
        } else if (type === 'sandbox2d') {
            const p = s.player;
            p.vy += 0.5; // Gravity
            p.y += p.vy;
            if(p.y > 450) { p.y = 450; p.vy = 0; p.grounded = true; } // Floor collision
            
            ctx.fillStyle = '#3b82f6';
            ctx.fillRect(p.x, p.y, p.w, p.h);
            
            s.blocks.forEach(b => {
                ctx.fillStyle = b.c;
                ctx.fillRect(b.x, b.y, b.w, b.h);
            });
            
        } else if (type === 'mc3d') {
            // Isometric renderer
            const tileW = 40, tileH = 20;
            const originX = 400, originY = 100;
            
            s.blocks.forEach(b => {
                const px = originX + (b.x - b.y) * tileW;
                const py = originY + (b.x + b.y) * tileH - (b.z * 20);
                
                ctx.fillStyle = b.c;
                // Draw top
                ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px+tileW, py+tileH); ctx.lineTo(px, py+tileH*2); ctx.lineTo(px-tileW, py+tileH); ctx.closePath(); ctx.fill(); ctx.stroke();
                // Draw sides (fake 3d)
                ctx.fillStyle = '#3e2723';
                ctx.beginPath(); ctx.moveTo(px-tileW, py+tileH); ctx.lineTo(px, py+tileH*2); ctx.lineTo(px, py+tileH*2+20); ctx.lineTo(px-tileW, py+tileH+20); ctx.closePath(); ctx.fill(); ctx.stroke();
                ctx.fillStyle = '#4e342e';
                ctx.beginPath(); ctx.moveTo(px, py+tileH*2); ctx.lineTo(px+tileW, py+tileH); ctx.lineTo(px+tileW, py+tileH+20); ctx.lineTo(px, py+tileH*2+20); ctx.closePath(); ctx.fill(); ctx.stroke();
            });
        } else if (type === 'racing') {
            // Pseudo-3D Road
            ctx.fillStyle = '#22c55e'; ctx.fillRect(0,300,800,300); // Grass
            ctx.fillStyle = '#87ceeb'; ctx.fillRect(0,0,800,300); // Sky
            
            ctx.fillStyle = '#333';
            ctx.beginPath(); ctx.moveTo(400, 300); ctx.lineTo(100, 600); ctx.lineTo(700, 600); ctx.fill(); // Road
            
            // Car
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(s.carX, 500, 60, 30);
            
            ctx.fillStyle = '#fff';
            ctx.fillText(`Speed: ${s.speed} MPH`, 10, 50);
            
        } else if (type === 'civ') {
            s.tiles.forEach(t => {
                ctx.fillStyle = t.type==='water' ? '#3b82f6' : '#22c55e';
                ctx.fillRect(t.x, t.y, 48, 48);
            });
            s.units.forEach(u => {
                ctx.fillStyle = '#fff';
                ctx.font = '20px serif';
                ctx.fillText('🛡️', u.x+10, u.y+30);
            });
        } else if (type === 'war') {
            s.units.forEach(u => {
                if(u.tx) { // Move logic
                    const dx = u.tx - u.x; const dy = u.ty - u.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    if(dist > 5) { u.x += dx/dist * 2; u.y += dy/dist * 2; }
                }
                ctx.fillStyle = u.team === 'human' ? '#3b82f6' : '#f6465d';
                ctx.beginPath(); ctx.arc(u.x, u.y, 10, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = '#fff'; ctx.fillText('HP:'+u.hp, u.x-15, u.y-15);
            });
        } else if (type === 'wuxia') {
            ctx.fillStyle = '#eee';
            ctx.font = '16px "Songti SC", serif';
            s.log.forEach((l,i) => ctx.fillText(l, 50, 50 + i*30));
            ctx.fillText(`武学修为: ${s.stats.kungfu}`, 600, 50);
        } else if (type === 'xiuxian') {
            ctx.fillStyle = '#fff';
            ctx.font = '20px "Kaiti SC", serif';
            ctx.fillText(`当前境界: ${s.realm}`, 300, 200);
            
            // Qi gathering anim
            ctx.strokeStyle = '#f0b90b';
            ctx.beginPath(); ctx.arc(400, 300, 50 + Math.sin(Date.now()/500)*10, 0, Math.PI*2); ctx.stroke();
            ctx.font = '14px serif'; ctx.fillText("天地灵气", 370, 305);
        } else if (type === 'rpg') {
            const p = s.player;
            ctx.fillStyle = '#22c55e'; ctx.fillRect(0,0,800,600); // Grass
            ctx.fillStyle = '#f0b90b'; ctx.fillRect(p.x, p.y, 20, 20); // Player
        } else if (type === 'gal') {
            // Bg
            ctx.fillStyle = '#ddd'; ctx.fillRect(0,0,800,600);
            // Char
            const img = new Image(); img.src = s.char;
            ctx.drawImage(img, 200, 100, 400, 500); // Placeholder draw will fail without real image load logic, stick to text
            ctx.fillStyle = '#000'; ctx.fillRect(250, 150, 300, 400); // Placeholder char body
            
            // Textbox
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(50, 450, 700, 120);
            ctx.fillStyle = '#fff';
            ctx.font = '20px sans-serif';
            ctx.fillText(s.text, 80, 500);
        } else if (type === 'snake') {
            const s = Modules.games.state;
            s.tick++;
            if (s.tick % 5 === 0) {
                s.dir = s.nextDir;
                const head = {x: s.snake[0].x + s.dir.x, y: s.snake[0].y + s.dir.y};
                
                if (head.x < 0 || head.x >= 40 || head.y < 0 || head.y >= 30 || s.snake.some(p => p.x === head.x && p.y === head.y)) {
                     Modules.games.initSnake();
                     return;
                }
                
                s.snake.unshift(head);
                if (head.x === s.food.x && head.y === s.food.y) {
                    s.score += 10;
                    s.food = {x: Math.floor(Math.random() * 40), y: Math.floor(Math.random() * 30)};
                } else {
                    s.snake.pop();
                }
            }
            
            ctx.fillStyle = '#000'; ctx.fillRect(0,0,800,600);
            ctx.fillStyle = '#22c55e';
            s.snake.forEach(p => ctx.fillRect(p.x*20, p.y*20, 18, 18));
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(s.food.x*20, s.food.y*20, 18, 18);
            ctx.fillStyle = '#fff'; ctx.font = '20px monospace';
            ctx.fillText(`Score: ${s.score}`, 20, 30);
        } else {
            // Generic 3D/Sim visualization
            s.tick++;
            ctx.fillStyle = '#fff';
            ctx.font = '20px monospace';
            ctx.fillText(`Simulating ${type.toUpperCase()}...`, 20, 50);
            ctx.fillText(`Frame: ${s.tick}`, 20, 80);
        }
        
        Modules.games.loopId = requestAnimationFrame(Modules.games.loop);
    }
};

// Global Game Classes for Engine instantiation
class BaseGameEngine {
    constructor(canvas) { this.canvas=canvas; this.ctx=canvas.getContext('2d'); this.running=false; canvas.focus(); }
    start(){this.running=true; this.loop();}
    stop(){this.running=false; cancelAnimationFrame(this.loopId);}
    loop(){ if(!this.running)return; this.update(); this.draw(); this.loopId=requestAnimationFrame(()=>this.loop()); }
    update(){}
    draw(){ this.ctx.fillStyle='#000'; this.ctx.fillRect(0,0,800,600); }
}

// Enhanced Engines to ensure playability
class RogueEngine extends BaseGameEngine { constructor(c){super(c); Modules.games.type='rogue'; Modules.games.ctx=this.ctx; Modules.games.initRogue(); this.draw=()=>{Modules.games.loop();}} }
class CardEngine extends BaseGameEngine { constructor(c){super(c); Modules.games.type='card'; Modules.games.ctx=this.ctx; Modules.games.initCard(); this.draw=()=>{Modules.games.loop();}} }
class SandboxEngine extends BaseGameEngine { constructor(c){super(c); Modules.games.type='sandbox2d'; Modules.games.ctx=this.ctx; Modules.games.initSandbox(); this.draw=()=>{Modules.games.loop();}} }
class Builder3DEngine extends BaseGameEngine { constructor(c){super(c); Modules.games.type='mc3d'; Modules.games.ctx=this.ctx; Modules.games.initMc3d(); this.draw=()=>{Modules.games.loop();}} }
class ShooterEngine extends BaseGameEngine { constructor(c){super(c); Modules.games.type='shooter'; Modules.games.ctx=this.ctx; Modules.games.initShooter(); this.draw=()=>{Modules.games.loop();}} }
class RacingEngine extends BaseGameEngine { constructor(c){super(c); Modules.games.type='racing'; Modules.games.ctx=this.ctx; Modules.games.initRacing(); this.draw=()=>{Modules.games.loop();}} }
class CivEngine extends BaseGameEngine { constructor(c){super(c); Modules.games.type='civ'; Modules.games.ctx=this.ctx; Modules.games.initCiv(); this.draw=()=>{Modules.games.loop();}} }
class WarEngine extends BaseGameEngine { constructor(c){super(c); Modules.games.type='war'; Modules.games.ctx=this.ctx; Modules.games.initWar(); this.draw=()=>{Modules.games.loop();}} }
class WuxiaEngine extends BaseGameEngine { constructor(c){super(c); Modules.games.type='wuxia'; Modules.games.ctx=this.ctx; Modules.games.initWuxia(); this.draw=()=>{Modules.games.loop();}} }
class XiuxianEngine extends BaseGameEngine { constructor(c){super(c); Modules.games.type='xiuxian'; Modules.games.ctx=this.ctx; Modules.games.initXianxia(); this.draw=()=>{Modules.games.loop();}} }
class OpenWorldEngine extends BaseGameEngine { constructor(c){super(c); Modules.games.type='rpg'; Modules.games.ctx=this.ctx; Modules.games.initRpg(); this.draw=()=>{Modules.games.loop();}} }
class GalEngine extends BaseGameEngine { constructor(c){super(c); Modules.games.type='gal'; Modules.games.ctx=this.ctx; Modules.games.initGal(); this.draw=()=>{Modules.games.loop();}} }
class SnakeEngine extends BaseGameEngine { constructor(c){super(c); Modules.games.type='snake'; Modules.games.ctx=this.ctx; Modules.games.initSnake(); this.draw=()=>{Modules.games.loop();}} }

Modules.comics = {
    step: 'novel',
    data: { novel: '', outline: [], script: '', shots: [] },
    characters: [
        {id: 'c1', name: '林风', role: '主角', desc: '坚毅的青年，眼神锐利', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=LinFeng'},
        {id: 'c2', name: '神秘人', role: '反派', desc: '黑衣蒙面，冷酷无情', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Mystery'}
    ],
    render: () => `
        <div class="layout-golden bg-[#131314]">
            <!-- Sidebar -->
            <div class="col-nav w-72 bg-[#1e1f20] border-r border-white/5 flex col z-20">
                <div class="p-6 border-b border-white/5 bg-[#202022]">
                    <h2 class="text-xl font-bold text-white flex items-center gap-3">
                        <i class="fa-solid fa-masks-theater text-yellow-500"></i>
                        <span>漫剧工坊 2.0</span>
                    </h2>
                    <p class="text-[10px] text-dim mt-1 tracking-wider uppercase">Visual Novel Architect</p>
                </div>
                
                <div class="flex-1 py-4 flex flex-col gap-2 px-2 relative">
                    <!-- Progress Line -->
                    <div class="absolute left-6 top-6 bottom-6 w-0.5 bg-white/5 z-0"></div>
                    
                    ${['novel|原始文本|fa-book', 'outline|分集大纲|fa-list-ol', 'script|剧本编排|fa-file-lines', 'shot|分镜设计|fa-camera', 'preview|漫剧预览|fa-play', 'export|导出发布|fa-rocket'].map((s, i) => {
                        const [id, label, icon] = s.split('|');
                        const active = Modules.comics.step === id;
                        const done = ['novel', 'outline', 'script', 'shot', 'preview', 'export'].indexOf(Modules.comics.step) > i;
                        return `
                        <button class="relative z-10 flex items-center gap-3 p-3 rounded-lg transition-all ${active?'bg-yellow-600/20 text-yellow-500 border border-yellow-600/50': done ? 'text-white' : 'text-dim hover:bg-white/5 border border-transparent'}" onclick="Modules.comics.setStep('${id}')">
                            <div class="w-8 h-8 rounded-full bg-black/50 border border-white/10 flex center ${active?'text-yellow-500 border-yellow-500': done ? 'text-green-500 border-green-500' : 'text-dim'} shadow-lg text-xs">
                                ${done ? '<i class="fa-solid fa-check"></i>' : (i+1)}
                            </div>
                            <span class="font-bold text-sm">${label}</span>
                        </button>
                        `;
                    }).join('')}
                </div>
                
                <div class="p-4 border-t border-white/5 bg-[#1a1a1c]">
                    <div class="text-[10px] font-bold text-dim uppercase mb-3 flex justify-between items-center">
                        <span>资产管理</span>
                        <i class="fa-solid fa-plus cursor-pointer hover:text-white"></i>
                    </div>
                    <div class="grid grid-cols-4 gap-2">
                        ${Modules.comics.characters.map(c => `
                            <div class="aspect-square rounded-lg bg-black/50 border border-white/10 overflow-hidden relative group cursor-pointer" title="${c.name}">
                                <img src="${c.avatar}" class="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity">
                            </div>
                        `).join('')}
                        <div class="aspect-square rounded-lg bg-white/5 border border-white/5 flex center text-dim cursor-pointer hover:text-white hover:border-white/20"><i class="fa-solid fa-plus"></i></div>
                    </div>
                </div>
            </div>

            <!-- Content Area -->
            <div class="col-content bg-[#131314] flex col relative overflow-hidden">
                ${Modules.comics.renderStep()}
            </div>
        </div>
    `,
    
    setStep: (s) => {
        Modules.comics.step = s;
        App.nav('comics');
        // Force re-render if needed or handle specific UI updates
        const view = document.getElementById('module-view-comics');
        if (view) view.innerHTML = Modules.comics.render();
    },
    
    renderStep: () => {
        const s = Modules.comics.step;
        
        if (s === 'novel') return `
            <div class="flex-1 flex col p-8 gap-6 max-w-5xl mx-auto w-full">
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="text-2xl font-bold text-white mb-1">原始文本输入</h3>
                        <p class="text-sm text-dim">粘贴小说章节或故事梗概，AI 将自动拆解为分集大纲。</p>
                    </div>
                    <div class="flex gap-2">
                        <button class="btn btn-sm bg-white/5 hover:bg-white/10 text-dim" onclick="document.getElementById('comic-io-panel').classList.toggle('hidden')"><i class="fa-solid fa-terminal mr-2"></i> IO调试</button>
                        <button class="btn btn-sm bg-white/5 hover:bg-white/10 text-dim" onclick="Modules.short.openPromptModal('comic_outline')"><i class="fa-solid fa-gear mr-2"></i> 配置提示词</button>
                    </div>
                </div>
                
                <div class="flex-1 bg-[#1e1f20] rounded-2xl border border-white/10 p-1 shadow-xl flex col focus-within:border-yellow-500/50 transition-colors relative">
                    <textarea id="comic-novel-in" class="flex-1 bg-transparent border-none p-6 text-base text-gray-300 resize-none focus:outline-none leading-loose font-serif scrollbar-hide" placeholder="在此输入小说正文...">${Modules.comics.data.novel}</textarea>
                    
                    <!-- IO Debug Panel -->
                    <div id="comic-io-panel" class="hidden absolute inset-0 bg-black/95 p-4 z-20 flex col font-mono text-xs backdrop-blur-xl">
                        <div class="flex justify-between items-center mb-2 border-b border-white/10 pb-2">
                            <span class="text-accent font-bold">IO Debug</span>
                            <button class="text-dim hover:text-white" onclick="document.getElementById('comic-io-panel').classList.add('hidden')"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                        <div class="flex-1 flex col gap-2 min-h-0">
                            <div class="text-[10px] text-dim">Input Prompt</div>
                            <textarea id="comic-io-in" class="flex-1 bg-black/30 border border-white/5 rounded p-2 text-gray-400 resize-none focus:outline-none" readonly></textarea>
                            <div class="text-[10px] text-green-400">Raw Output</div>
                            <textarea id="comic-io-out" class="flex-1 bg-black/30 border border-white/5 rounded p-2 text-gray-400 resize-none focus:outline-none" readonly></textarea>
                        </div>
                    </div>
                </div>
                
                <div class="flex justify-end">
                    <button class="btn btn-primary h-12 px-8 bg-yellow-600 hover:bg-yellow-500 text-black font-bold shadow-lg shadow-yellow-600/20" onclick="Modules.comics.analyzeNovel()">
                        <i class="fa-solid fa-wand-magic-sparkles mr-2"></i> 智能拆解大纲
                    </button>
                </div>
            </div>
        `;
        
        if (s === 'outline') return `
            <div class="flex-1 flex gap-0 h-full">
                <!-- Outline List -->
                <div class="w-1/3 border-r border-white/5 bg-[#1a1a1c] flex col">
                    <div class="p-4 border-b border-white/5 flex justify-between items-center bg-[#202022]">
                        <span class="font-bold text-white text-sm">分集大纲</span>
                        <button class="btn btn-xs bg-white/5 hover:bg-white/10 text-dim" onclick="Modules.comics.addEpisode()"><i class="fa-solid fa-plus"></i></button>
                    </div>
                    <div class="flex-1 overflow-y-auto p-2 space-y-2" id="comic-outline-list">
                        <!-- Mock Data with Editability -->
                        <div class="p-3 bg-yellow-600/10 border border-yellow-600/30 rounded-lg cursor-pointer group relative" onclick="Modules.comics.selectEpisode(1)">
                            <div class="flex justify-between mb-1">
                                <span class="font-bold text-yellow-500 text-sm" contenteditable="true">第 1 集</span>
                                <span class="text-[10px] text-dim bg-black/30 px-1.5 py-0.5 rounded" contenteditable="true">3min</span>
                            </div>
                            <div class="text-xs text-gray-300 line-clamp-2" contenteditable="true">主角在雨夜遭遇神秘人袭击，觉醒异能。</div>
                            <div class="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <i class="fa-solid fa-trash text-red-500 hover:text-red-400 text-xs cursor-pointer bg-black/50 p-1 rounded" onclick="this.parentElement.parentElement.remove()"></i>
                            </div>
                        </div>
                        <div class="p-3 bg-white/5 border border-white/5 rounded-lg cursor-pointer hover:bg-white/10 group relative" onclick="Modules.comics.selectEpisode(2)">
                            <div class="flex justify-between mb-1">
                                <span class="font-bold text-gray-400 text-sm" contenteditable="true">第 2 集</span>
                                <span class="text-[10px] text-dim bg-black/30 px-1.5 py-0.5 rounded" contenteditable="true">4min</span>
                            </div>
                            <div class="text-xs text-dim line-clamp-2" contenteditable="true">逃离现场后，主角遇到了神秘组织...</div>
                            <div class="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <i class="fa-solid fa-trash text-red-500 hover:text-red-400 text-xs cursor-pointer bg-black/50 p-1 rounded" onclick="this.parentElement.parentElement.remove()"></i>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Detail Editor -->
                <div class="flex-1 bg-[#131314] flex col p-6 gap-4">
                    <div class="flex justify-between items-center border-b border-white/5 pb-4">
                        <span class="font-bold text-lg text-white">大纲详情编辑</span>
                        <button class="btn btn-primary bg-yellow-600 hover:bg-yellow-500 text-black font-bold" onclick="Modules.comics.setStep('script')">生成剧本 <i class="fa-solid fa-arrow-right ml-2"></i></button>
                    </div>
                    <div class="flex-1 flex col gap-4">
                        <div class="col gap-2">
                            <span class="text-xs font-bold text-dim uppercase">核心冲突</span>
                            <textarea class="textarea h-24 bg-[#1e1f20] border-white/10 text-sm text-gray-300" placeholder="本集的主要矛盾点..."></textarea>
                        </div>
                        <div class="col gap-2 flex-1">
                            <span class="text-xs font-bold text-dim uppercase">详细剧情</span>
                            <textarea class="textarea h-full bg-[#1e1f20] border-white/10 text-sm text-gray-300 leading-relaxed resize-none" placeholder="详细描述本集发生的事件..."></textarea>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        if (s === 'script') return `
            <div class="flex-1 flex col h-full relative">
                <div class="h-14 border-b border-white/5 bg-[#1a1a1c] flex justify-between items-center px-6">
                    <div class="flex gap-4 text-sm font-bold text-dim">
                        <span class="text-white border-b-2 border-yellow-500 py-4 cursor-pointer">文本模式</span>
                        <span class="hover:text-white py-4 cursor-pointer transition-colors">可视化预览</span>
                    </div>
                    <div class="flex gap-2">
                        <button class="btn btn-sm bg-white/5 hover:bg-white/10 text-dim"><i class="fa-solid fa-robot mr-2"></i> AI 润色</button>
                        <button class="btn btn-primary bg-yellow-600 hover:bg-yellow-500 text-black font-bold" onclick="Modules.comics.setStep('shot')">转为分镜 <i class="fa-solid fa-film ml-2"></i></button>
                    </div>
                </div>
                
                <div class="flex-1 bg-[#131314] overflow-y-auto p-8 flex justify-center">
                    <div class="bg-[#1e1f20] max-w-4xl w-full min-h-[800px] shadow-2xl rounded-sm p-12 font-serif text-gray-300 leading-loose border border-white/5 relative group/script" contenteditable="true" spellcheck="false">
                        <div class="absolute top-0 left-0 w-full h-2 bg-yellow-600/50" contenteditable="false"></div>
                        <div class="absolute top-4 right-4 opacity-0 group-hover/script:opacity-100 transition-opacity bg-black/50 px-2 py-1 rounded text-xs text-dim pointer-events-none" contenteditable="false">点击即可编辑</div>
                        
                        <h1 class="text-3xl font-bold text-white text-center mb-12 border-b border-white/10 pb-6 outline-none">第一集：觉醒时刻</h1>
                        
                        <div class="mb-8">
                            <div class="font-bold text-yellow-500 mb-2 bg-black/20 p-2 rounded inline-block">SCENE 1. 废弃工厂 - 夜 - 外</div>
                            <p class="text-dim italic mb-4 text-sm">【环境：暴雨倾盆，雷声轰鸣。废弃工厂的铁门在风中摇晃，发出刺耳的声响。】</p>
                            
                            <div class="pl-8 border-l-2 border-white/10 mb-4 hover:border-yellow-500/50 transition-colors p-2">
                                <span class="font-bold text-white block mb-1">主角 (林风)</span>
                                <span class="text-sm text-dim block mb-1">(喘着粗气，手捂住腹部的伤口，鲜血渗出指缝)</span>
                                <p>该死...没想到他们来得这么快。</p>
                            </div>
                            
                            <div class="pl-8 border-l-2 border-white/10 mb-4 hover:border-yellow-500/50 transition-colors p-2">
                                <span class="font-bold text-white block mb-1">神秘人</span>
                                <span class="text-sm text-dim block mb-1">(从阴影中走出，手中把玩着一把黑色的匕首)</span>
                                <p>交出东西，留你全尸。</p>
                            </div>
                        </div>
                        
                        <div class="mb-8">
                            <div class="font-bold text-yellow-500 mb-2 bg-black/20 p-2 rounded inline-block">SCENE 2. 工厂内部 - 夜 - 内</div>
                            <p class="text-dim italic mb-4 text-sm">【动作：林风撞开生锈的铁门，跌跌撞撞地跑进工厂。】</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        if (s === 'shot') return `
            <div class="flex-1 flex gap-0 h-full overflow-hidden">
                <!-- Shot List (Left) -->
                <div class="flex-1 overflow-y-auto p-6 space-y-6 bg-[#131314]">
                    ${[1, 2, 3].map(i => `
                        <div class="bg-[#1e1f20] border border-white/10 rounded-xl p-4 flex gap-6 shadow-lg group hover:border-yellow-500/30 transition-all relative">
                            <div class="absolute -left-3 top-6 w-6 h-6 rounded-full bg-black border border-white/10 flex center text-[10px] text-dim font-bold z-10">${i}</div>
                            
                            <!-- Visual Placeholder -->
                            <div class="w-64 aspect-video bg-black rounded-lg border border-white/10 relative overflow-hidden flex center text-dim group-hover:text-white cursor-pointer group/img">
                                <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop" class="w-full h-full object-cover opacity-30 group-hover/img:opacity-60 transition-opacity">
                                <div class="absolute inset-0 flex center flex-col gap-2 opacity-0 group-hover/img:opacity-100 transition-opacity z-10">
                                    <button class="btn btn-sm bg-yellow-600 hover:bg-yellow-500 text-black font-bold shadow-lg"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i> 生成画面</button>
                                </div>
                                <span class="absolute top-2 left-2 text-[10px] font-bold bg-black/50 px-2 rounded text-white backdrop-blur">Shot ${i}</span>
                            </div>
                            
                            <!-- Details -->
                            <div class="flex-1 flex col gap-3">
                                <div class="flex justify-between items-start">
                                    <div class="flex gap-2">
                                        <select class="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30 text-xs font-bold outline-none cursor-pointer">
                                            <option>中景 (MS)</option><option>特写 (CU)</option><option>全景 (LS)</option>
                                        </select>
                                        <select class="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded border border-purple-500/30 text-xs font-bold outline-none cursor-pointer">
                                            <option>平视</option><option>仰视</option><option>俯视</option>
                                        </select>
                                        <select class="bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30 text-xs font-bold outline-none cursor-pointer">
                                            <option>固定</option><option>推拉</option><option>摇移</option>
                                        </select>
                                    </div>
                                    <input class="text-xs text-dim font-mono bg-white/5 px-2 rounded w-16 text-center outline-none border border-transparent focus:border-accent" value="3.5s">
                                </div>
                                <div class="col gap-1">
                                    <span class="text-[10px] text-dim font-bold uppercase">画面描述</span>
                                    <textarea class="bg-black/30 border border-white/5 rounded p-2 text-sm text-gray-300 resize-none h-16 focus:border-yellow-500/50 transition-colors outline-none">林风靠在生锈的柱子上，雨水打湿了他的头发。面部特写，展现痛苦与坚毅并存的表情。</textarea>
                                </div>
                                <div class="col gap-1">
                                    <span class="text-[10px] text-dim font-bold uppercase">台词</span>
                                    <input class="bg-black/30 border border-white/5 rounded p-2 text-sm text-yellow-500/80 font-serif outline-none focus:border-yellow-500/50" value=""该死...没想到他们来得这么快。"">
                                </div>
                            </div>
                        </div>
                    `).join('')}
                    
                    <button class="w-full py-4 rounded-xl border-2 border-dashed border-white/10 text-dim hover:text-white hover:border-white/20 hover:bg-white/5 transition-all flex center gap-2">
                        <i class="fa-solid fa-plus"></i> 添加镜头
                    </button>
                </div>
                
                <!-- Inspector (Right) -->
                <div class="w-80 bg-[#1e1f20] border-l border-white/5 p-6 flex col gap-6 overflow-y-auto">
                    <div class="flex items-center justify-between border-b border-white/5 pb-4">
                        <span class="text-sm font-bold text-white">镜头参数</span>
                        <button class="btn btn-primary bg-yellow-600 hover:bg-yellow-500 text-black font-bold text-xs" onclick="Modules.comics.setStep('preview')">生成预览 <i class="fa-solid fa-arrow-right ml-1"></i></button>
                    </div>
                    
                    <div class="col gap-2">
                        <span class="text-xs font-bold text-dim">角色站位</span>
                        <div class="h-32 bg-black/50 border border-white/10 rounded-lg relative overflow-hidden">
                            <div class="absolute top-1/2 left-1/3 w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg cursor-move" title="林风" draggable="true"></div>
                            <div class="absolute inset-0 grid grid-cols-3 pointer-events-none opacity-20">
                                <div class="border-r border-white"></div>
                                <div class="border-r border-white"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col gap-2">
                        <span class="text-xs font-bold text-dim">AI 绘图提示词 (Prompt)</span>
                        <textarea class="textarea h-48 bg-black/30 border-white/10 text-xs font-mono text-gray-400 leading-relaxed outline-none focus:border-yellow-500/50" placeholder="Generated prompt...">cinematic shot, medium shot, injured man leaning on rusty pillar, rain, night, cyberpunk factory, dramatic lighting, 8k, highly detailed, unreal engine 5 render</textarea>
                        <div class="flex gap-2">
                            <button class="btn btn-sm flex-1 bg-white/5 hover:bg-white/10 text-dim"><i class="fa-solid fa-rotate mr-2"></i> 优化</button>
                            <button class="btn btn-sm flex-1 bg-white/5 hover:bg-white/10 text-dim"><i class="fa-solid fa-language mr-2"></i> 翻译</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        if (s === 'preview') return `
            <div class="flex-1 flex col bg-[#000] relative">
                <!-- Player -->
                <div class="flex-1 flex center relative overflow-hidden">
                    <div class="aspect-video h-[80%] bg-[#111] shadow-2xl relative border border-white/10 overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop" class="w-full h-full object-cover opacity-80">
                        <!-- Subtitle Overlay -->
                        <div class="absolute bottom-10 left-0 right-0 text-center">
                            <span class="bg-black/70 text-white px-4 py-2 rounded text-lg font-serif text-shadow-lg">"该死...没想到他们来得这么快。"</span>
                        </div>
                        <!-- Controls Overlay -->
                        <div class="absolute inset-0 flex center opacity-0 hover:opacity-100 transition-opacity bg-black/40">
                            <button class="w-16 h-16 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur flex center text-white text-3xl"><i class="fa-solid fa-play ml-1"></i></button>
                        </div>
                    </div>
                </div>
                
                <!-- Timeline -->
                <div class="h-32 bg-[#1e1f20] border-t border-white/10 p-4 flex col gap-2">
                    <div class="flex justify-between text-xs text-dim mb-1">
                        <span>00:00</span>
                        <span>00:15 / 03:45</span>
                    </div>
                    <div class="flex-1 flex gap-1 overflow-x-auto scrollbar-thin pb-2">
                        ${[1,2,3,4,5,6,7,8].map(i => `
                            <div class="h-full aspect-video bg-black/50 border border-white/10 rounded cursor-pointer hover:border-yellow-500 relative group">
                                <span class="absolute top-1 left-1 text-[9px] bg-black/50 px-1 rounded text-white">${i}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="absolute top-4 right-4 flex gap-2">
                    <button class="btn btn-primary bg-yellow-600 hover:bg-yellow-500 text-black font-bold shadow-lg" onclick="Modules.comics.setStep('export')">下一步：导出 <i class="fa-solid fa-arrow-right ml-2"></i></button>
                </div>
            </div>
        `;
        
        if (s === 'export') return `
            <div class="flex-1 flex center bg-[#131314]">
                <div class="card max-w-2xl w-full bg-[#1e1f20] border border-white/10 p-12 text-center shadow-2xl">
                    <div class="w-20 h-20 rounded-full bg-green-500/10 flex center mx-auto mb-6 text-green-500 text-4xl border border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                        <i class="fa-solid fa-check"></i>
                    </div>
                    <h2 class="text-3xl font-bold text-white mb-4">漫剧策划案已生成</h2>
                    <p class="text-dim text-lg mb-10">包含完整剧本、分镜表及 AI 绘图提示词。</p>
                    
                    <div class="grid grid-cols-2 gap-4 mb-8">
                        <button class="btn py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white flex center gap-3">
                            <i class="fa-solid fa-file-pdf text-red-400 text-xl"></i> 导出 PDF 脚本
                        </button>
                        <button class="btn py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white flex center gap-3">
                            <i class="fa-solid fa-file-excel text-green-400 text-xl"></i> 导出 Excel 分镜表
                        </button>
                        <button class="btn py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white flex center gap-3 col-span-2">
                            <i class="fa-solid fa-video text-purple-400 text-xl"></i> 生成预览视频 (MP4)
                        </button>
                    </div>
                    
                    <button class="btn btn-primary w-full py-4 text-lg font-bold bg-yellow-600 hover:bg-yellow-500 text-black shadow-lg" onclick="App.nav('visual')">
                        前往 AI 绘图中心开始制作 <i class="fa-solid fa-arrow-right ml-2"></i>
                    </button>
                </div>
            </div>
        `;
    },
    
    analyzeNovel: async () => {
        const text = document.getElementById('comic-novel-in').value;
        if(!text) return UI.toast('请先输入文本');
        
        Modules.comics.data.novel = text;
        UI.toast('正在拆解大纲...');
        
        // Init prompt if needed (assuming prompt logic exists)
        const prompt = `[Task: Analyze Novel]\n[Input]: ${text.slice(0, 2000)}\n\nGenerate a structured outline with episodes.`;
        
        document.getElementById('comic-io-in').value = prompt;
        document.getElementById('comic-io-out').value = "Generating...";
        
        let fullRes = "";
        await AI.generate(prompt, {}, c => {
            fullRes += c;
            document.getElementById('comic-io-out').value = fullRes;
        });
        
        // Sim delay then switch
        setTimeout(() => {
            Modules.comics.setStep('outline');
            UI.toast('大纲生成完毕');
        }, 500);
    },
    addEpisode: () => {
        const list = document.getElementById('comic-outline-list');
        const count = list.children.length + 1;
        const div = document.createElement('div');
        div.className = "p-3 bg-white/5 border border-white/5 rounded-lg cursor-pointer hover:bg-white/10 animate-fade-in group relative";
        div.onclick = () => Modules.comics.selectEpisode(count);
        div.innerHTML = `
            <div class="flex justify-between mb-1">
                <span class="font-bold text-gray-400 text-sm" contenteditable="true">第 ${count} 集</span>
                <span class="text-[10px] text-dim bg-black/30 px-1.5 py-0.5 rounded" contenteditable="true">0min</span>
            </div>
            <div class="text-xs text-dim line-clamp-2" contenteditable="true">新剧集...</div>
            <div class="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <i class="fa-solid fa-trash text-red-500 hover:text-red-400 text-xs cursor-pointer bg-black/50 p-1 rounded" onclick="this.parentElement.parentElement.remove()"></i>
            </div>
        `;
        list.appendChild(div);
    },
    selectEpisode: (id) => {
        // Logic to update the detail editor based on selection
        // For now, just visual feedback or logging
        console.log("Selected episode", id);
    }
};

Modules.tavern = {
    activeChar: '傲娇法师',
    bgImage: 'https://images.unsplash.com/photo-1542281286-9e0a56e2e181?q=80&w=1974&auto=format&fit=crop',
    state: {
        gold: 1500, gems: 12, level: 5, exp: 2300, maxExp: 5000,
        inventory: [
            { id: 'p1', icon: 'fa-flask', color: 'text-red-500', name: '生命药水', count: 3 },
            { id: 'w1', icon: 'fa-scroll', color: 'text-yellow-400', name: '回城卷轴', count: 1 },
            { id: 'k1', icon: 'fa-key', color: 'text-gray-400', name: '旧钥匙', count: 1 }
        ],
        quests: [
            { title: "讨伐史莱姆", progress: "3/10", reward: "50 G" },
            { title: "寻找丢失的猫", progress: "0/1", reward: "20 G" }
        ],
        chars: {
            '傲娇法师': { affinity: 45, status: 'Studying', lvl: 12 },
            '冷酷剑客': { affinity: 10, status: 'Training', lvl: 15 },
            '神秘店主': { affinity: 80, status: 'Trading', lvl: 99 }
        }
    },
    render: () => {
        const bg = Modules.tavern.bgImage;
        return `
        <div class="layout-golden bg-cover bg-center transition-all duration-1000" style="background-image: url('${bg}')">
            <div class="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/60 backdrop-blur-sm"></div>
            
            <!-- LEFT: Character Hub -->
            <div class="col-nav p-4 gap-4 relative z-10 bg-black/60 border-r border-white/10 w-80 backdrop-blur-md">
                <!-- User Card -->
                <div class="epic-card p-4 flex col gap-3 bg-[#1a1a1a]">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-xl bg-accent/20 flex center border border-accent/50 text-accent font-bold shadow-lg text-lg">LV.${Modules.tavern.state.level}</div>
                            <div>
                                <div class="text-[10px] text-dim font-bold uppercase tracking-wider">Adventurer</div>
                                <div class="text-sm font-bold text-white">Player One</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-xs text-yellow-500 font-mono font-bold"><i class="fa-solid fa-coins mr-1"></i>${Modules.tavern.state.gold}</div>
                            <div class="text-xs text-blue-400 font-mono font-bold"><i class="fa-solid fa-gem mr-1"></i>${Modules.tavern.state.gems}</div>
                        </div>
                    </div>
                    <div class="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <div class="bg-gradient-to-r from-accent to-yellow-200 h-full shadow-[0_0_10px_rgba(255,215,0,0.5)]" style="width: ${Modules.tavern.state.exp/Modules.tavern.state.maxExp*100}%"></div>
                    </div>
                </div>

                <!-- Quest Board -->
                <div class="epic-card flex-1 flex col overflow-hidden bg-amber-950/20 border-amber-900/30">
                    <div class="p-3 bg-amber-900/30 border-b border-amber-700/30 flex justify-between items-center">
                        <span class="font-bold text-amber-500 text-xs uppercase tracking-wider"><i class="fa-solid fa-scroll mr-2"></i>Active Quests</span>
                        <span class="text-[9px] bg-black/40 px-2 py-0.5 rounded text-amber-500/70 border border-amber-900/50">${Modules.tavern.state.quests.length}</span>
                    </div>
                    <div class="p-2 space-y-2 overflow-y-auto flex-1 scrollbar-thin">
                        ${Modules.tavern.state.quests.map(q => `
                            <div class="p-3 bg-black/40 border border-amber-700/20 rounded-lg hover:border-amber-500/50 cursor-pointer group transition-all relative overflow-hidden">
                                <div class="absolute left-0 top-0 bottom-0 w-1 bg-amber-700 group-hover:bg-amber-500 transition-colors"></div>
                                <div class="flex justify-between text-xs font-bold text-amber-100 mb-2 pl-2">
                                    <span>${q.title}</span>
                                    <span class="text-yellow-500 bg-yellow-500/10 px-1.5 rounded">${q.reward}</span>
                                </div>
                                <div class="flex justify-between items-center pl-2">
                                    <div class="w-2/3 bg-black/50 h-1.5 rounded-full overflow-hidden">
                                        <div class="bg-green-500 h-full w-1/3"></div>
                                    </div>
                                    <div class="text-[9px] text-amber-500/50 font-mono">${q.progress}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Character List -->
                <div class="h-1/3 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                    <div class="text-[10px] font-bold text-dim uppercase tracking-wider mb-2 sticky top-0 bg-black/0 backdrop-blur-sm py-1">Contacts</div>
                    ${['傲娇法师', '冷酷剑客', '神秘店主', '赛博黑客', '吸血鬼大公', '精灵公主', '异能特工', '克苏鲁古神'].map(n => {
                        const data = Modules.tavern.state.chars[n] || { affinity: 0, status: 'Idle', lvl: 1 };
                        return `
                        <div class="p-2 bg-white/5 border border-white/5 rounded-xl cursor-pointer hover:bg-white/10 hover:border-red-500/50 transition-all flex gap-3 items-center group relative overflow-hidden ${Modules.tavern.activeChar===n?'border-red-500 bg-red-900/20 shadow-[inset_0_0_20px_rgba(220,38,38,0.2)]':''}" onclick="Modules.tavern.select('${n}')">
                            <div class="w-10 h-10 rounded-full bg-gray-800 overflow-hidden border border-white/10 group-hover:border-red-400 relative shadow-lg">
                                <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=${n}" class="w-full h-full object-cover">
                                <div class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#1a1a1a] rounded-full"></div>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex justify-between items-center mb-1">
                                    <span class="font-bold text-gray-200 text-xs truncate group-hover:text-red-300">${n}</span>
                                    <span class="text-[9px] bg-black/40 px-1.5 rounded text-dim border border-white/5">Lv.${data.lvl}</span>
                                </div>
                                <div class="flex items-center gap-1.5">
                                    <i class="fa-solid fa-heart text-[8px] text-pink-500"></i>
                                    <div class="flex-1 h-1.5 bg-black/50 rounded-full overflow-hidden"><div class="bg-gradient-to-r from-pink-600 to-pink-400 h-full" style="width: ${data.affinity}%"></div></div>
                                </div>
                            </div>
                        </div>
                    `}).join('')}
                </div>
            </div>

            <!-- CENTER: Chat -->
            <div class="col-content relative z-10 flex col bg-black/20 backdrop-blur-sm">
                <!-- Top Toolbar -->
                <div class="h-16 border-b border-white/10 bg-black/60 backdrop-blur-md flex items-center px-6 justify-between shadow-xl z-20">
                    <div class="flex items-center gap-4">
                        <div class="text-xl font-bold text-white tracking-wide flex items-center gap-2 drop-shadow-md">
                            <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]"></span>
                            ${Modules.tavern.activeChar}
                        </div>
                        <div class="flex gap-2">
                             <span class="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-gray-300 uppercase shadow-inner">Affinity: ${Modules.tavern.state.chars[Modules.tavern.activeChar]?.affinity || 0}</span>
                             <span class="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-gray-300 uppercase shadow-inner">Mood: Calm</span>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button class="epic-btn h-8 px-3 rounded text-xs bg-purple-600/20 text-purple-300 border-purple-600/50 hover:bg-purple-600 hover:text-white flex center gap-2" onclick="Modules.tavern.rollDice()"><i class="fa-solid fa-dice-d20"></i> Check</button>
                        <button class="epic-btn h-8 w-8 rounded flex center text-dim hover:text-white" onclick="Modules.tavern.drawGacha()" title="Summon"><i class="fa-solid fa-wand-sparkles"></i></button>
                        <button class="epic-btn h-8 w-8 rounded flex center text-dim hover:text-white" onclick="Modules.tavern.changeBg()" title="Change BG"><i class="fa-solid fa-image"></i></button>
                        <button class="epic-btn h-8 w-8 rounded flex center text-dim hover:text-white"><i class="fa-solid fa-gear"></i></button>
                    </div>
                </div>

                <!-- Chat Area -->
                <div class="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth scrollbar-thin" id="tavern-chat">
                     <!-- Intro -->
                    <div class="flex gap-4 animate-fade-in">
                        <div class="w-12 h-12 rounded-xl bg-gray-800 shrink-0 overflow-hidden border border-white/10 shadow-lg">
                            <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=${Modules.tavern.activeChar}" class="w-full h-full object-cover">
                        </div>
                        <div class="flex-1 max-w-3xl">
                            <div class="flex items-baseline gap-2 mb-1">
                                <span class="text-red-400 font-bold text-sm drop-shadow-md">${Modules.tavern.activeChar}</span>
                            </div>
                            <div class="bg-[#1e1e20]/90 p-5 rounded-2xl rounded-tl-none border border-white/5 text-gray-200 text-sm leading-relaxed shadow-lg relative group backdrop-blur-md">
                                <p>冒险者，你来得正好。这附近似乎有些异样...</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Input Area -->
                <div class="p-6 bg-gradient-to-t from-black via-black/90 to-transparent z-20">
                    <div class="bg-[#121212] rounded-xl border border-white/10 shadow-2xl flex flex-col overflow-hidden focus-within:border-accent/50 transition-colors relative">
                        <textarea id="tavern-input" class="w-full bg-transparent border-none p-4 text-sm text-gray-200 focus:outline-none resize-none h-24 scrollbar-hide placeholder-white/20 font-sans" placeholder="Type your action or dialogue..."></textarea>
                        
                        <div class="bg-black/30 p-2 flex justify-between items-center border-t border-white/5 backdrop-blur-sm">
                            <div class="flex gap-1">
                                <button class="w-8 h-8 rounded hover:bg-white/10 text-dim hover:text-white flex center transition-colors" title="Action"><i class="fa-solid fa-bolt"></i></button>
                                <button class="w-8 h-8 rounded hover:bg-white/10 text-dim hover:text-white flex center transition-colors" title="Inventory"><i class="fa-solid fa-box"></i></button>
                                <button class="w-8 h-8 rounded hover:bg-white/10 text-dim hover:text-white flex center transition-colors" onclick="Modules.tavern.gift()" title="Gift"><i class="fa-solid fa-gift text-pink-500"></i></button>
                            </div>
                            <button class="epic-btn h-8 px-6 rounded bg-red-600 hover:bg-red-500 text-white border-none shadow-lg font-bold flex center gap-2" onclick="Modules.tavern.send()">Send <i class="fa-solid fa-paper-plane"></i></button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- RIGHT: Inventory -->
            <div class="col-nav w-72 bg-black/60 border-l border-white/10 backdrop-blur-md p-4 flex col gap-4">
                 <div class="flex-1 flex col overflow-hidden">
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-xs font-bold text-dim uppercase tracking-wider">Inventory</span>
                        <button class="text-[10px] text-accent hover:underline"><i class="fa-solid fa-sort mr-1"></i>Sort</button>
                    </div>
                    <div class="grid grid-cols-4 gap-2 content-start">
                        ${Modules.tavern.state.inventory.map(item => `
                            <div class="aspect-square bg-white/5 rounded border border-white/5 flex center relative group cursor-pointer hover:bg-white/10 hover:border-white/30 transition-all shadow-sm" title="${item.name}">
                                <i class="fa-solid ${item.icon} ${item.color} text-lg drop-shadow-md"></i>
                                <span class="absolute bottom-0 right-0 text-[9px] bg-black/80 px-1 rounded-tl text-white font-mono border-t border-l border-white/10">${item.count}</span>
                            </div>
                        `).join('')}
                        ${Array.from({length: 12}).map(()=>`<div class="aspect-square bg-black/20 rounded border border-white/5 inset-shadow"></div>`).join('')}
                    </div>
                 </div>
                 
                 <div class="epic-card p-4 bg-black/40">
                    <span class="text-xs font-bold text-dim uppercase tracking-wider mb-3 block">Quick Travel</span>
                    <div class="grid grid-cols-2 gap-2">
                         <button class="btn btn-sm bg-white/5 hover:bg-white/10 border-white/5 text-xs text-left justify-start h-8" onclick="Modules.tavern.explore('forest')"><i class="fa-solid fa-tree mr-2 text-green-500"></i> Forest</button>
                         <button class="btn btn-sm bg-white/5 hover:bg-white/10 border-white/5 text-xs text-left justify-start h-8" onclick="Modules.tavern.explore('ruins')"><i class="fa-solid fa-dungeon mr-2 text-gray-500"></i> Ruins</button>
                         <button class="btn btn-sm bg-white/5 hover:bg-white/10 border-white/5 text-xs text-left justify-start h-8" onclick="Modules.tavern.explore('market')"><i class="fa-solid fa-shop mr-2 text-blue-500"></i> Market</button>
                         <button class="btn btn-sm bg-white/5 hover:bg-white/10 border-white/5 text-xs text-left justify-start h-8" onclick="Modules.tavern.explore('arena')"><i class="fa-solid fa-swords mr-2 text-red-500"></i> Arena</button>
                    </div>
                 </div>
            </div>
        </div>
    `; },
    select: (n) => { Modules.tavern.activeChar = n; App.nav('tavern'); },
    changeBg: () => {
        const bgs = [
            'https://images.unsplash.com/photo-1542281286-9e0a56e2e181?q=80&w=1974', // Dungeon
            'https://images.unsplash.com/photo-1517824806704-9040b037703b?q=80&w=2070', // Tavern
            'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2094', // Forest
            'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070', // Cyberpunk
            'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=2069'  // Space
        ];
        Modules.tavern.bgImage = bgs[Math.floor(Math.random() * bgs.length)];
        App.nav('tavern');
    },
    rollDice: () => {
        const val = Math.floor(Math.random() * 20) + 1;
        const chat = document.getElementById('tavern-chat');
        const isSuccess = val >= 10;
        const resultColor = isSuccess ? 'text-green-400' : 'text-red-400';
        const resultText = isSuccess ? '成功' : '失败';
        
        chat.innerHTML += `
            <div class="flex center py-2 animate-fade-in my-2">
                <div class="bg-black/80 border border-white/10 rounded-lg p-2 px-4 flex items-center gap-4 shadow-xl backdrop-blur-md">
                    <div class="flex flex-col items-center">
                        <span class="text-[9px] text-dim uppercase tracking-wider">技能检定</span>
                        <div class="text-xl font-bold text-purple-400"><i class="fa-solid fa-dice-d20"></i> ${val}</div>
                    </div>
                    <div class="h-8 w-px bg-white/10"></div>
                    <div>
                        <div class="text-xs font-bold ${resultColor}">${resultText}</div>
                        <div class="text-[9px] text-dim">难度 10</div>
                    </div>
                </div>
            </div>
        `;
        chat.scrollTop = chat.scrollHeight;
    },
    gift: () => {
        UI.toast(`已向 ${Modules.tavern.activeChar} 赠送礼物！好感度大幅上升！`);
        // Logic to increase affinity
        if(Modules.tavern.state.chars[Modules.tavern.activeChar]) {
            Modules.tavern.state.chars[Modules.tavern.activeChar].affinity += 10;
            App.nav('tavern'); // Refresh UI
        }
    },
    drawGacha: () => {
        UI.toast('正在祈愿召唤...');
        setTimeout(() => {
            const items = ['SSR 圣剑', 'SR 魔法卷轴', 'R 恢复药水', 'SSR 龙蛋'];
            const item = items[Math.floor(Math.random() * items.length)];
            const color = item.includes('SSR') ? 'text-orange-500' : item.includes('SR') ? 'text-purple-500' : 'text-blue-400';
            
            const chat = document.getElementById('tavern-chat');
            chat.innerHTML += `
                <div class="flex center py-2 animate-fade-in my-2">
                    <div class="bg-black/90 border border-accent/30 rounded-xl p-4 flex flex-col items-center gap-2 shadow-[0_0_20px_rgba(255,215,0,0.2)] backdrop-blur-md scale-110">
                        <div class="text-xs text-dim uppercase tracking-wider">召唤结果</div>
                        <div class="text-xl font-bold ${color} animate-pulse"><i class="fa-solid fa-star mr-2"></i>${item}</div>
                    </div>
                </div>
            `;
            chat.scrollTop = chat.scrollHeight;
        }, 1500);
    },
    send: async () => {
        const input = document.getElementById('tavern-input');
        const text = input.value;
        if(!text) return;
        
        const chat = document.getElementById('tavern-chat');
        chat.innerHTML += `
            <div class="flex gap-4 flex-row-reverse animate-fade-in group">
                <div class="w-10 h-10 rounded-full bg-blue-600/20 shrink-0 overflow-hidden mt-1 flex center text-xs font-bold text-blue-200 border border-blue-500/30">我</div>
                <div class="flex-1 max-w-3xl flex justify-end">
                    <div class="bg-blue-600/10 p-4 rounded-2xl rounded-tr-none border border-blue-500/20 text-gray-200 text-sm leading-relaxed shadow-lg backdrop-blur-md relative max-w-full">
                        ${text}
                        <div class="absolute -top-1 -right-1 w-2 h-2 border-t border-r border-blue-500/30 rounded-tr bg-transparent"></div>
                    </div>
                </div>
            </div>
        `;
        input.value = '';
        chat.scrollTop = chat.scrollHeight;
        
        // AI Response using real API
        setTimeout(async () => {
            const charName = Modules.tavern.activeChar;
            const charData = Modules.tavern.state.chars[charName] || {};
            
            chat.innerHTML += `
                <div class="flex gap-4 animate-fade-in" id="tavern-thinking">
                    <div class="w-10 h-10 rounded-full bg-gray-700 shrink-0 overflow-hidden mt-1 border border-white/10 shadow-lg">
                        <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=${charName}" class="w-full h-full object-cover">
                    </div>
                    <div class="flex-1 max-w-3xl">
                        <div class="flex items-baseline gap-2 mb-1">
                            <span class="text-red-400 font-bold text-sm">${charName}</span>
                            <span class="text-[9px] bg-white/5 px-1.5 rounded text-dim">活跃</span>
                        </div>
                        <div class="bg-[#1e1e20] p-4 rounded-2xl rounded-tl-none border border-white/5 text-gray-300 text-sm leading-relaxed shadow-lg relative">
                             <span class="animate-pulse text-accent">正在思考...</span>
                            <div class="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-white/10 rounded-tl bg-transparent"></div>
                        </div>
                    </div>
                </div>
            `;
            chat.scrollTop = chat.scrollHeight;

            const prompt = `[Character: ${charName}]\n[Status: ${charData.status}]\n[Affinity: ${charData.affinity}]\n[Context: Fantasy RPG World]\n\nUser: ${text}\n\nResponse (Stay in character, act naturally):`;
            
            let reply = "";
            await AI.generate(prompt, {}, (chunk) => {
                const thinkingEl = document.getElementById('tavern-thinking');
                if (thinkingEl) {
                    const textEl = thinkingEl.querySelector('.animate-pulse');
                    if (textEl.classList.contains('animate-pulse')) {
                        textEl.className = '';
                        textEl.innerText = '';
                    }
                    textEl.innerText += chunk;
                    reply += chunk;
                    chat.scrollTop = chat.scrollHeight;
                }
            });
            
            // Remove ID after done to allow next message
            const thinkingEl = document.getElementById('tavern-thinking');
            if(thinkingEl) thinkingEl.id = '';

            // Increase affinity
            if(Modules.tavern.state.chars[charName]) {
                Modules.tavern.state.chars[charName].affinity = Math.min(100, Modules.tavern.state.chars[charName].affinity + 2);
            }
        }, 500);
    },
    explore: (place) => {
        const chat = document.getElementById('tavern-chat');
        const events = {
            forest: "你踏入了迷雾森林，四周静悄悄的，偶尔传来乌鸦的叫声。发现了一株发光的草药。",
            ruins: "远古遗迹中弥漫着腐朽的气息，墙壁上的符文似乎在闪烁。",
            market: "黑市里人声鼎沸，各种稀奇古怪的货物琳琅满目。",
            arena: "竞技场上，两名角斗士正在进行殊死搏斗，观众的欢呼声震耳欲聋。"
        };
        
        chat.innerHTML += `
            <div class="flex center py-4 animate-fade-in">
                <div class="bg-black/60 border border-white/10 rounded-lg p-3 text-xs text-gray-300 max-w-md text-center italic">
                    <i class="fa-solid fa-location-dot text-accent mr-2"></i> ${events[place] || "正在探索未知区域..."}
                </div>
            </div>
        `;
        chat.scrollTop = chat.scrollHeight;
    }
};

// 15. ARTICLE / MEDIA WRITER
Modules.media = {
    currentChannel: 'xhs',
    setChannel: (c) => {
        Modules.media.currentChannel = c;
        App.nav('media');
    },
    gen: async () => {
        const topic = document.getElementById('media-topic').value;
        const target = document.getElementById('media-target').value;
        const pain = document.getElementById('media-pain').value;
        const tone = document.getElementById('media-tone').value;
        const channel = Modules.media.currentChannel;
        
        if(!topic) return UI.toast('请输入核心话题');
        
        const promptKey = `media_${channel}`;
        // Ensure default
        if(!(await DB.get('prompts', promptKey))) {
             const map = {
                 media_xhs: "请生成一篇小红书爆款文案，主题：{{input}}。受众：{{target}}，痛点：{{pain}}，语气：{{tone}}。要求：多用Emoji，分段清晰，有吸引力的标题。",
                 media_tiktok: "请生成一段抖音短视频脚本，主题：{{input}}。受众：{{target}}，痛点：{{pain}}，语气：{{tone}}。包含分镜描述和口播文案。",
                 media_wx: "请生成一篇公众号深度文章大纲，主题：{{input}}。受众：{{target}}，痛点：{{pain}}，语气：{{tone}}。逻辑严密，观点深刻。",
                 media_weibo: "请生成一条微博热搜文案，主题：{{input}}。受众：{{target}}，痛点：{{pain}}，语气：{{tone}}。带话题标签，控制字数。"
             };
             if(map[promptKey]) await DB.put('prompts', {id: promptKey, name: promptKey, content: map[promptKey]});
        }
        
        let prompt = await Modules.short.getPrompt(promptKey);
        prompt = prompt.replace('{{input}}', topic)
                       .replace('{{target}}', target)
                       .replace('{{pain}}', pain)
                       .replace('{{tone}}', tone);
        
        UI.toast('AI 正在生成爆款内容...');
        
        let fullRes = "";
        const outEl = document.getElementById('media-out');
        const previewEl = document.getElementById('media-out-preview');
        const ioIn = document.getElementById('media-io-in');
        const ioOut = document.getElementById('media-io-out');
        
        if(ioIn) ioIn.value = prompt;
        if(ioOut) ioOut.value = "Generating...";
        if(outEl) outEl.value = "生成中...";
        if(previewEl) previewEl.innerHTML = "生成中...";
        
        await AI.generate(prompt, {}, c => {
            fullRes += c;
            if(outEl) outEl.value = fullRes;
            if(ioOut) ioOut.value = fullRes;
            if(previewEl) {
                // Better rendering for preview
                if (channel === 'xhs') {
                    const parts = fullRes.split('\n');
                    const title = parts[0].replace(/^#+\s*/, '');
                    const body = parts.slice(1).join('\n');
                    previewEl.innerHTML = `<h1 class="text-lg font-bold mb-2">${title}</h1><div class="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">${body}</div>`;
                } else {
                    previewEl.innerText = fullRes;
                }
            }
        });
    },
    saveToLib: async () => {
        const content = document.getElementById('media-out')?.value || document.getElementById('media-out-preview')?.innerText;
        if(!content) return;
        const id = Utils.uuid();
        await DB.put('library_books', {
            id,
            name: `自媒体文案_${Modules.media.currentChannel}_${new Date().toLocaleTimeString()}`,
            type: 'txt',
            content: content,
            date: new Date().toLocaleDateString()
        });
        UI.toast('已保存到沉浸阅读');
    },
    render: () => `
        <div class="layout-golden bg-[#131314]">
            <!-- 70% Content (Left) -->
            <div class="col-content p-8 flex col gap-6 overflow-y-auto">
                <!-- Advanced Inputs -->
                <div class="epic-card p-6 flex col gap-6 bg-gradient-to-br from-pink-900/10 to-transparent">
                    <div class="flex justify-between items-center">
                        <h3 class="text-lg font-bold text-white">创作实验室</h3>
                        <button class="btn btn-sm bg-white/5 hover:bg-white/10 text-dim" onclick="document.getElementById('media-io-panel').classList.toggle('hidden')"><i class="fa-solid fa-terminal mr-2"></i> IO调试</button>
                    </div>
                    
                    <!-- IO Debug Panel (Embedded) -->
                    <div id="media-io-panel" class="hidden bg-black/40 border border-white/10 rounded-lg p-4 font-mono text-xs mb-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div class="col gap-1">
                                <span class="text-[10px] text-accent">Input Prompt</span>
                                <textarea id="media-io-in" class="bg-black/50 border border-white/5 rounded p-2 h-20 resize-none text-dim focus:outline-none" readonly></textarea>
                            </div>
                            <div class="col gap-1">
                                <span class="text-[10px] text-green-400">Raw Output</span>
                                <textarea id="media-io-out" class="bg-black/50 border border-white/5 rounded p-2 h-20 resize-none text-dim focus:outline-none" readonly></textarea>
                            </div>
                        </div>
                    </div>

                    <div class="flex gap-4">
                        <div class="flex-1 relative group">
                            <div class="absolute inset-0 bg-pink-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <span class="absolute left-4 top-3 text-[10px] text-pink-500 font-bold uppercase tracking-wider z-20">核心话题 (Topic)</span>
                            <textarea id="media-topic" class="epic-input w-full h-32 pt-8 pb-4 pl-4 text-xl font-bold text-white rounded-xl relative z-10 resize-none leading-relaxed" placeholder="例如：职场新人如何拒绝无理要求..."></textarea>
                        </div>
                        <button class="epic-btn w-32 h-32 bg-pink-600 border-pink-500 text-white hover:bg-pink-500 shadow-lg shadow-pink-500/20 font-bold flex col center gap-2 rounded-xl" onclick="Modules.media.gen()">
                            <i class="fa-solid fa-wand-magic-sparkles text-3xl animate-pulse"></i>
                            <span class="text-sm">一键生成</span>
                        </button>
                    </div>
                    
                    <div class="grid grid-cols-3 gap-4">
                        <div class="col gap-1">
                            <span class="text-[10px] text-dim font-bold uppercase">目标受众</span>
                            <input id="media-target" class="epic-input h-12 rounded-lg px-3 text-sm text-white" placeholder="例如：00后大学生">
                        </div>
                        <div class="col gap-1">
                            <span class="text-[10px] text-dim font-bold uppercase">痛点/爽点</span>
                            <input id="media-pain" class="epic-input h-12 rounded-lg px-3 text-sm text-white" placeholder="例如：害怕得罪人">
                        </div>
                        <div class="col gap-1">
                            <span class="text-[10px] text-dim font-bold uppercase">语气风格</span>
                            <select id="media-tone" class="epic-input h-12 rounded-lg px-2 text-sm text-white">
                                <option>🌶️ 毒舌/犀利</option>
                                <option>☀️ 温暖/治愈</option>
                                <option>📦 专业/干货</option>
                                <option>🤣 幽默/搞笑</option>
                                <option>🤯 震惊/反转</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <!-- Output Preview (Simplified) -->
                <div class="flex-1 flex col p-6 gap-4 bg-black/20 rounded-xl border border-white/5">
                    <div class="flex justify-between items-center border-b border-white/5 pb-4">
                        <span class="font-bold text-lg text-white">文案预览 & 调试</span>
                        <div class="flex gap-2">
                             <button class="btn btn-sm bg-white/5 hover:bg-white/10 text-white" onclick="Modules.media.saveToLib()"><i class="fa-solid fa-save mr-2"></i> 保存到图书馆</button>
                             <button class="btn btn-sm bg-white/5 hover:bg-white/10 text-white" onclick="Utils.copy(document.getElementById('media-out').value)"><i class="fa-solid fa-copy mr-2"></i> 复制</button>
                        </div>
                    </div>
                    
                    <div class="flex-1 grid grid-cols-2 gap-6 min-h-0">
                        <div class="flex col gap-2">
                            <span class="text-xs font-bold text-dim uppercase">生成结果</span>
                            <textarea id="media-out" class="w-full h-full bg-black/30 border border-white/10 rounded-xl p-4 text-sm text-gray-200 resize-none focus:border-pink-500/50 focus:outline-none leading-relaxed" placeholder="AI 生成的文案将显示在这里..."></textarea>
                        </div>
                        <div class="flex col gap-2">
                            <span class="text-xs font-bold text-dim uppercase">IO 调试信息</span>
                            <div class="flex-1 flex col gap-4">
                                <div class="flex-1 flex col gap-1">
                                    <span class="text-[10px] text-accent">Input Prompt</span>
                                    <textarea id="media-io-in" class="flex-1 bg-black/50 border border-white/5 rounded p-2 text-[10px] text-dim font-mono resize-none focus:outline-none" readonly></textarea>
                                </div>
                                <div class="flex-1 flex col gap-1">
                                    <span class="text-[10px] text-green-400">Raw Output</span>
                                    <textarea id="media-io-out" class="flex-1 bg-black/50 border border-white/5 rounded p-2 text-[10px] text-dim font-mono resize-none focus:outline-none" readonly></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 30% Navigation (Right) -->
            <div class="col-nav p-6 gap-6 w-80 bg-[#1e1f20] border-l border-white/5">
                <div class="flex items-center gap-3 mb-2">
                    <h2 class="text-2xl font-bold text-white"><i class="fa-solid fa-hashtag text-pink-500 mr-2"></i>自媒体引擎</h2>
                </div>
                
                <div class="flex flex-col gap-3">
                     <span class="text-xs font-bold text-dim uppercase tracking-wider">创作频道</span>
                     <div class="flex flex-col gap-3">
                        <button id="btn-xhs" class="epic-btn h-14 justify-start px-4 rounded-xl text-left relative group transition-all duration-200 ${Modules.media.currentChannel==='xhs'?'bg-pink-500/10 text-pink-500 border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.2)]':'hover:bg-white/10 text-dim'}" onclick="Modules.media.setChannel('xhs')">
                            <i class="fa-brands fa-xiaohongshu text-xl w-8 text-center ${Modules.media.currentChannel==='xhs'?'text-pink-500':'text-dim'}"></i>
                            <span class="font-bold">小红书爆款</span>
                            <i class="fa-solid fa-gear absolute right-4 text-dim hover:text-white opacity-0 group-hover:opacity-100 z-50 p-2" onclick="event.stopPropagation(); Modules.short.openPromptModal('media_xhs')"></i>
                        </button>
                        <button id="btn-tiktok" class="epic-btn h-14 justify-start px-4 rounded-xl text-left relative group transition-all duration-200 ${Modules.media.currentChannel==='tiktok'?'bg-black text-white border-white/30 shadow-lg':'hover:bg-white/10 text-dim'}" onclick="Modules.media.setChannel('tiktok')">
                            <i class="fa-brands fa-tiktok text-xl w-8 text-center ${Modules.media.currentChannel==='tiktok'?'text-white':'text-dim'}"></i>
                            <span class="font-bold">抖音脚本</span>
                            <i class="fa-solid fa-gear absolute right-4 text-dim hover:text-white opacity-0 group-hover:opacity-100 z-50 p-2" onclick="event.stopPropagation(); Modules.short.openPromptModal('media_tiktok')"></i>
                        </button>
                        <button id="btn-wx" class="epic-btn h-14 justify-start px-4 rounded-xl text-left relative group transition-all duration-200 ${Modules.media.currentChannel==='wx'?'bg-green-600/10 text-green-500 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]':'hover:bg-white/10 text-dim'}" onclick="Modules.media.setChannel('wx')">
                            <i class="fa-brands fa-weixin text-xl w-8 text-center ${Modules.media.currentChannel==='wx'?'text-green-500':'text-dim'}"></i>
                            <span class="font-bold">公众号深读</span>
                            <i class="fa-solid fa-gear absolute right-4 text-dim hover:text-white opacity-0 group-hover:opacity-100 z-50 p-2" onclick="event.stopPropagation(); Modules.short.openPromptModal('media_wx')"></i>
                        </button>
                        <button id="btn-weibo" class="epic-btn h-14 justify-start px-4 rounded-xl text-left relative group transition-all duration-200 ${Modules.media.currentChannel==='weibo'?'bg-blue-500/10 text-blue-400 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]':'hover:bg-white/10 text-dim'}" onclick="Modules.media.setChannel('weibo')">
                            <i class="fa-brands fa-twitter text-xl w-8 text-center ${Modules.media.currentChannel==='weibo'?'text-blue-400':'text-dim'}"></i>
                            <span class="font-bold">推特/微博</span>
                            <i class="fa-solid fa-gear absolute right-4 text-dim hover:text-white opacity-0 group-hover:opacity-100 z-50 p-2" onclick="event.stopPropagation(); Modules.short.openPromptModal('media_weibo')"></i>
                        </button>
                     </div>
                </div>
                
                <div class="epic-card flex-1 bg-black/20 p-4 flex flex-col overflow-hidden">
                    <span class="text-xs font-bold mb-4 block text-accent uppercase tracking-wider flex items-center"><i class="fa-solid fa-fire mr-2"></i>实时热点追踪</span>
                    <div class="space-y-2 text-xs text-dim overflow-y-auto h-full pr-2">
                        <div class="p-3 bg-white/5 rounded-lg border border-white/5 cursor-pointer hover:bg-white/10 hover:text-white hover:border-pink-500/30 transition-all flex justify-between"><span>#DeepSeek V3发布</span> <span class="text-green-500">↑</span></div>
                        <div class="p-3 bg-white/5 rounded-lg border border-white/5 cursor-pointer hover:bg-white/10 hover:text-white hover:border-pink-500/30 transition-all flex justify-between"><span>#AI写作变现</span> <span class="text-green-500">↑</span></div>
                        <div class="p-3 bg-white/5 rounded-lg border border-white/5 cursor-pointer hover:bg-white/10 hover:text-white hover:border-pink-500/30 transition-all flex justify-between"><span>#职场效率神器</span> <span class="text-red-500">-</span></div>
                    </div>
                </div>
            </div>
        </div>
    `
};

// 16. PROMPT MANAGER
Modules.prompts = {
    filter: 'all',
    setFilter: (f) => {
        Modules.prompts.filter = f;
        Modules.prompts.init();
        // Update UI active state
        document.querySelectorAll('#pm-cats span').forEach(el => {
            if(el.innerText === (f==='all'?'全部':f==='writer'?'创作流':f==='reader'?'阅读助手':'自媒体')) {
                el.className = "px-2 py-1 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 cursor-pointer whitespace-nowrap";
            } else {
                el.className = "px-2 py-1 rounded bg-white/5 text-dim hover:text-white cursor-pointer whitespace-nowrap";
            }
        });
    },
    render: () => `
        <div class="layout-golden bg-[#131314]">
            <!-- 30% List (Left) -->
            <div class="col-nav p-6 gap-6 w-80 bg-[#1e1f20] border-r border-white/5">
                <div class="flex items-center gap-3 mb-2">
                    <h2 class="text-2xl font-bold text-white"><i class="fa-solid fa-terminal mr-2 text-orange-500"></i>提示词管理</h2>
                </div>
                
                <div class="epic-card flex-1 bg-black/40 p-0 flex flex-col overflow-hidden">
                    <div class="p-3 border-b border-white/5 bg-white/5 flex justify-between items-center">
                        <span class="font-bold text-xs text-dim uppercase tracking-wider">提示词库</span>
                        <div class="flex gap-1">
                            <button class="w-7 h-7 rounded hover:bg-white/10 text-dim hover:text-white flex center" onclick="UI.toast('工作流编辑器已就绪')" title="新建工作流"><i class="fa-solid fa-diagram-project"></i></button>
                            <button class="w-7 h-7 rounded hover:bg-white/10 text-dim hover:text-white flex center" onclick="Modules.prompts.add()" title="新建提示词"><i class="fa-solid fa-plus"></i></button>
                        </div>
                    </div>
                    <!-- Categories -->
                    <div class="flex gap-2 p-2 border-b border-white/5 overflow-x-auto text-[10px] scrollbar-hide" id="pm-cats">
                        <span class="px-2 py-1 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 cursor-pointer whitespace-nowrap" onclick="Modules.prompts.setFilter('all')">全部</span>
                        <span class="px-2 py-1 rounded bg-white/5 text-dim hover:text-white cursor-pointer whitespace-nowrap" onclick="Modules.prompts.setFilter('writer')">创作流</span>
                        <span class="px-2 py-1 rounded bg-white/5 text-dim hover:text-white cursor-pointer whitespace-nowrap" onclick="Modules.prompts.setFilter('reader')">阅读助手</span>
                        <span class="px-2 py-1 rounded bg-white/5 text-dim hover:text-white cursor-pointer whitespace-nowrap" onclick="Modules.prompts.setFilter('media')">自媒体</span>
                    </div>
                    <div id="pm-list" class="flex-1 overflow-y-auto p-2 space-y-1"></div>
                </div>
                
                <div class="epic-card p-4 text-xs text-dim leading-relaxed bg-orange-900/10 border-orange-500/20">
                    <strong class="text-orange-400 block mb-1">💡 提示词编写指南</strong>
                    1. 明确角色：[角色: 专家小说家]<br>
                    2. 定义任务：[任务: 描写一个场景]<br>
                    3. 提供上下文：使用 {{context}} 变量<br>
                    4. 设定约束：字数、风格、禁忌
                </div>
                
                <button class="epic-btn w-full h-12 rounded-xl bg-orange-600 text-white hover:bg-orange-500 shadow-lg font-bold flex center gap-2" onclick="Modules.prompts.save()">
                    <i class="fa-solid fa-floppy-disk"></i> 保存修改
                </button>
            </div>

            <!-- 70% Editor (Right) -->
            <div class="col-content bg-black/20 p-8">
                <div class="epic-card w-full h-full flex flex-col p-6 gap-6 bg-[#1a1a1a]">
                    <div class="flex gap-4 items-end">
                        <div class="flex-1 flex col gap-2">
                            <span class="text-[10px] text-dim uppercase font-bold tracking-wider">提示词名称</span>
                            <input id="pm-name" class="epic-input h-12 px-4 text-lg font-bold text-white rounded-xl focus:border-orange-500" placeholder="例如：小说大纲生成器">
                        </div>
                        <button class="w-12 h-12 rounded-xl border border-white/10 hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/50 text-dim flex center transition-all" onclick="Modules.prompts.del()"><i class="fa-solid fa-trash"></i></button>
                    </div>
                    
                    <div class="flex-1 grid grid-cols-2 gap-6 min-h-0">
                        <!-- Editor -->
                        <div class="relative epic-card p-0 overflow-hidden flex flex-col bg-black/40">
                            <div class="bg-white/5 border-b border-white/5 p-2 flex gap-2 items-center">
                                <span class="px-3 py-1 text-xs bg-orange-500/20 text-orange-400 rounded-lg border border-orange-500/30 font-bold">系统提示词 (System Prompt)</span>
                                <div class="flex-1"></div>
                                <button class="px-3 py-1 text-xs hover:bg-white/10 text-dim hover:text-white rounded transition-colors" onclick="Modules.prompts.optimize()"><i class="fa-solid fa-wand-magic-sparkles mr-1"></i> 自动优化</button>
                            </div>
                            <textarea id="pm-content" class="flex-1 w-full h-full bg-transparent border-none p-6 font-mono text-sm leading-loose resize-none focus:outline-none text-gray-300" placeholder="在此输入系统指令..."></textarea>
                        </div>

                        <!-- Playground -->
                        <div class="epic-card p-0 overflow-hidden flex flex-col bg-black/40">
                            <div class="bg-white/5 border-b border-white/5 p-2 flex gap-2 items-center justify-between">
                                <span class="text-xs font-bold text-dim uppercase px-2">变量测试</span>
                                <button class="px-3 py-1 text-xs bg-green-600/20 text-green-400 rounded-lg border border-green-600/30 hover:bg-green-600 hover:text-white transition-all font-bold" onclick="Modules.prompts.testRun()">
                                    <i class="fa-solid fa-play mr-1"></i> 运行
                                </button>
                            </div>
                            <div class="flex-1 p-4 flex col gap-4 overflow-y-auto">
                                <div class="col gap-2">
                                    <span class="text-[10px] text-dim font-bold">测试输入 ({{input}})</span>
                                    <textarea id="pm-test-in" class="epic-input w-full h-24 rounded-lg p-3 text-xs text-white resize-none" placeholder="测试输入内容..."></textarea>
                                </div>
                                <div class="flex-1 flex col gap-2 min-h-0">
                                    <span class="text-[10px] text-dim font-bold">输出结果</span>
                                    <div class="flex-1 bg-black/50 border border-white/5 rounded-lg p-3 text-xs text-green-400 font-mono whitespace-pre-wrap overflow-y-auto" id="pm-test-out">等待运行...</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex justify-between items-center text-xs bg-black/30 p-3 rounded-lg border border-white/5">
                        <span class="text-dim"><i class="fa-solid fa-code mr-2"></i>可用变量: <span class="text-orange-400 font-mono bg-orange-500/10 px-1 rounded">{{input}}</span>, <span class="text-orange-400 font-mono bg-orange-500/10 px-1 rounded">{{context}}</span></span>
                        <span class="text-dim">Token 预估: <span class="text-white">0</span></span>
                    </div>
                </div>
            </div>
        </div>
    `,
    add: () => {
        Modules.prompts.cur = null;
        document.getElementById('pm-name').value = '';
        document.getElementById('pm-content').value = '';
    },
    init: async () => {
        const list = await DB.getAll('prompts');
        const filter = Modules.prompts.filter;
        
        const filtered = list.filter(p => {
            if(filter === 'all') return true;
            if(filter === 'writer') return p.name.includes('writer') || p.name.includes('phoenix') || p.name.includes('idea') || p.name.includes('title') || p.name.includes('twist') || p.name.includes('char') || p.name.includes('trope') || p.name.includes('write') || p.name.includes('fanfic');
            if(filter === 'reader') return p.name.includes('read_');
            if(filter === 'media') return p.name.includes('media_');
            return false;
        });

        document.getElementById('pm-list').innerHTML = filtered.map(p => `
            <div class="p-3 border border-transparent rounded cursor-pointer hover:bg-white/10 text-gray-400 hover:text-white transition-all flex items-center gap-2 ${Modules.prompts.cur===p.id ? 'bg-white/10 text-white font-bold' : ''}" onclick="Modules.prompts.load('${p.id}')">
                <i class="fa-solid fa-terminal text-[10px] opacity-50"></i> ${p.name}
            </div>
        `).join('');
    },
    load: async (id) => {
        Modules.prompts.cur = id;
        const p = await DB.get('prompts', id);
        document.getElementById('pm-name').value = p.name;
        document.getElementById('pm-content').value = p.content;
        Modules.prompts.init(); // Refresh list to update active state
    },
    save: async () => {
        const name = document.getElementById('pm-name').value;
        const content = document.getElementById('pm-content').value;
        const id = Modules.prompts.cur || Utils.uuid();
        await DB.put('prompts', { id, name, content });
        Modules.prompts.init();
        UI.toast('提示词已保存');
    },
    optimize: async () => {
        const content = document.getElementById('pm-content').value;
        if(!content) return UI.toast('请先输入提示词');
        UI.toast('正在优化提示词...');
        await AI.generate(`You are a Prompt Engineer. Optimize the following prompt for better LLM performance, keeping the original intent but adding structure and clarity:\n\n${content}`, {}, c => {
            document.getElementById('pm-content').value = c;
        });
    },
    del: async () => {
        if(Modules.prompts.cur) {
            await DB.del('prompts', Modules.prompts.cur);
            Modules.prompts.cur = null;
            document.getElementById('pm-name').value = '';
            document.getElementById('pm-content').value = '';
            Modules.prompts.init();
        }
    },
    testRun: async () => {
        const promptTpl = document.getElementById('pm-content').value;
        const input = document.getElementById('pm-test-in').value;
        if(!promptTpl) return UI.toast('请先编写 Prompt');
        
        const prompt = promptTpl.replace('{{input}}', input).replace('{{context}}', '[Context Placeholder]');
        document.getElementById('pm-test-out').innerText = "Generating...";
        
        let fullRes = "";
        await AI.generate(prompt, {}, c => {
            fullRes += c;
            document.getElementById('pm-test-out').innerText = fullRes;
        });
    }
};

// 17. TOOLBOX MANAGER
Modules.tools_mgr = {
    render: () => `
        <div class="layout-golden bg-[#131314]">
            <!-- 30% Navigation (Left) -->
            <div class="col-nav p-6 gap-6 w-80 bg-[#1e1f20] border-r border-white/5">
                <div class="flex items-center gap-3 mb-2">
                    <h2 class="text-2xl font-bold text-white"><i class="fa-solid fa-screwdriver-wrench mr-2 text-blue-400"></i>工具箱管理</h2>
                </div>
                
                <div class="epic-card p-4 flex flex-col gap-2 bg-blue-900/10 border-blue-500/20">
                    <h3 class="font-bold text-xs text-blue-400 mb-2 uppercase tracking-wider">工具市场</h3>
                    <div class="grid grid-cols-2 gap-2">
                        <button class="epic-btn h-8 rounded text-[10px] justify-start px-2 bg-white/5 hover:bg-white/10 border-white/5" onclick="UI.toast('已安装：DeepSeek Code')"><i class="fa-solid fa-code mr-2 text-blue-400"></i> 代码助手</button>
                        <button class="epic-btn h-8 rounded text-[10px] justify-start px-2 bg-white/5 hover:bg-white/10 border-white/5" onclick="UI.toast('已安装：Midjourney Prompt')"><i class="fa-solid fa-image mr-2 text-pink-400"></i> MJ 提示词</button>
                        <button class="epic-btn h-8 rounded text-[10px] justify-start px-2 bg-white/5 hover:bg-white/10 border-white/5" onclick="UI.toast('已安装：Translator Pro')"><i class="fa-solid fa-language mr-2 text-green-400"></i> 翻译专家</button>
                        <button class="epic-btn h-8 rounded text-[10px] justify-start px-2 bg-white/5 hover:bg-white/10 border-white/5" onclick="UI.toast('已安装：Data Analyst')"><i class="fa-solid fa-chart-pie mr-2 text-yellow-400"></i> 数据分析</button>
                    </div>
                </div>

                <div class="epic-card p-6 flex flex-col gap-4 flex-1 bg-black/20">
                    <h3 class="font-bold text-sm text-blue-400 uppercase tracking-wider border-b border-white/10 pb-4">创建智能体 (Agent)</h3>
                    
                    <div class="col gap-2">
                        <span class="text-[10px] font-bold text-dim uppercase">名称</span>
                        <input id="tm-name" class="epic-input h-10 px-3 rounded-lg text-sm text-white focus:border-blue-500" placeholder="例如：文本润色专家">
                    </div>
                    
                    <div class="col gap-2">
                        <span class="text-[10px] font-bold text-dim uppercase">图标 (FontAwesome)</span>
                        <div class="flex gap-2">
                            <input id="tm-icon" class="epic-input h-10 px-3 rounded-lg text-sm text-white focus:border-blue-500 flex-1" placeholder="fa-solid fa-magic" oninput="document.getElementById('icon-preview').className=this.value">
                            <div class="w-10 h-10 center bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400"><i id="icon-preview" class="fa-solid fa-cube"></i></div>
                        </div>
                    </div>
                    
                    <div class="col gap-2 flex-1">
                        <span class="text-[10px] font-bold text-dim uppercase">系统提示词 (System Prompt)</span>
                        <textarea id="tm-prompt" class="epic-input w-full h-full rounded-lg p-3 text-xs font-mono text-gray-300 focus:border-blue-500 resize-none" placeholder="定义智能体的行为逻辑..."></textarea>
                    </div>
                    
                    <button class="epic-btn w-full h-12 rounded-xl bg-blue-600 text-white hover:bg-blue-500 shadow-lg font-bold flex center gap-2" onclick="Modules.tools_mgr.create()">
                        <i class="fa-solid fa-plus"></i> 部署智能体
                    </button>
                </div>
            </div>

            <!-- 70% Content (Right) -->
            <div class="col-content bg-black/20 p-8">
                <div class="grid grid-cols-3 gap-6 content-start overflow-y-auto h-full" id="tm-list">
                    <!-- Cards injected here -->
                </div>
            </div>
        </div>
    `,
    init: async () => {
        const tools = await DB.getAll('tools_custom');
        document.getElementById('tm-list').innerHTML = tools.map(t => `
            <div class="card bg-black/40 backdrop-blur border-white/10 p-5 relative group hover:border-blue-500/50 transition-colors shadow-lg">
                <div class="flex items-center gap-4 mb-4">
                    <div class="w-12 h-12 rounded-lg bg-blue-500/10 flex center text-blue-400 text-2xl group-hover:scale-110 transition-transform">
                        <i class="${t.icon || 'fa-solid fa-cube'}"></i>
                    </div>
                    <div>
                        <span class="font-bold text-lg text-white block">${t.name}</span>
                        <span class="text-[10px] text-dim uppercase tracking-wider">Custom Agent</span>
                    </div>
                </div>
                <div class="text-xs text-dim line-clamp-2 mb-4 h-8 font-mono bg-black/20 p-1 rounded border border-white/5">${t.prompt}</div>
                <button class="btn w-full bg-white/5 hover:bg-blue-500 hover:text-white border-white/10 transition-all font-bold" onclick="Modules.tools_mgr.launch('${t.id}')">LAUNCH <i class="fa-solid fa-arrow-right ml-2"></i></button>
                <button class="btn-icon absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-500/10 rounded" onclick="Modules.tools_mgr.del('${t.id}')"><i class="fa-solid fa-trash"></i></button>
            </div>
        `).join('');
    },
    launch: (id) => {
        App.nav('toolbox_custom');
        setTimeout(() => Modules.toolbox_custom.loadTool(id), 300);
    },
    create: async () => {
        const name = document.getElementById('tm-name').value;
        const icon = document.getElementById('tm-icon').value;
        const prompt = document.getElementById('tm-prompt').value;
        const id = Utils.uuid();
        
        if(!name) return UI.toast('请输入工具名称');
        
        await DB.put('tools_custom', { id, name, icon, prompt });
        Modules.tools_mgr.init();
        UI.toast('工具创建成功');
        
        // Auto launch
        Modules.tools_mgr.launch(id);
    },
    del: async (id) => {
        if(confirm('Delete this tool?')) {
            await DB.del('tools_custom', id);
            Modules.tools_mgr.init();
        }
    }
};

// 18. PHOENIX WIZARD (Ported & Modified) - Golden Ratio
Modules.phoenix = {
    step: 0,
    data: {},
    steps: [
        { title: '灵感细纲', icon: 'fa-lightbulb' },
        { title: '大纲编织', icon: 'fa-sitemap' },
        { title: '进入执笔', icon: 'fa-feather-pointed' }
    ],
    render() {
        return `
            <div class="layout-golden relative">
                <!-- 30% Steps & Controls (Left) -->
                <div class="col-nav p-8 gap-8 relative z-10">
                    <div class="flex flex-col gap-2 mb-4">
                        <div class="flex items-center gap-3">
                            <h1 class="text-4xl font-bold text-white flex items-center gap-3 tracking-tight">
                                <i class="fa-solid fa-fire-flame-curved text-accent"></i> 凤凰创作流
                            </h1>
                            <button class="btn btn-sm btn-icon bg-white/5 hover:bg-white/10 text-dim" onclick="Modules.short.openPromptModal('phoenix_outline')" title="配置大纲生成提示词"><i class="fa-solid fa-gear"></i></button>
                        </div>
                        <span class="text-xs text-dim ml-12">从零开始构建世界的终极方案</span>
                    </div>

                    <!-- Vertical Stepper -->
                    <div class="flex flex-col gap-4">
                        ${this.steps.map((s, i) => `
                            <div class="flex items-center gap-4 p-4 rounded-xl border transition-all ${i===this.step?'bg-accent/10 border-accent':'bg-white/5 border-transparent'}">
                                <div class="w-10 h-10 rounded-full center text-sm font-bold ${i===this.step?'bg-accent text-black shadow-[0_0_15px_rgba(255,215,0,0.5)]':'bg-white/10 text-dim'} transition-all">
                                    ${i+1}
                                </div>
                                <span class="text-lg font-bold ${i===this.step?'text-white':'text-dim'}">${s.title}</span>
                            </div>
                        `).join('')}
                    </div>

                    <div class="flex-1"></div> <!-- Spacer -->

                    <div class="flex gap-4">
                        <button class="btn flex-1 h-14 bg-white/5 hover:bg-white/10 border-white/10 text-dim hover:text-white font-bold" onclick="Modules.phoenix.prev()" ${this.step===0?'disabled style="opacity:0.3"':''}>
                            <i class="fa-solid fa-arrow-left mr-2"></i> 上一步
                        </button>
                        <button class="btn btn-primary flex-1 h-14 font-bold shadow-lg shadow-accent/20" onclick="Modules.phoenix.next()">
                            ${this.step===2 ? '完成导入 <i class="fa-solid fa-rocket ml-2"></i>' : '下一步 <i class="fa-solid fa-arrow-right ml-2"></i>'}
                        </button>
                    </div>
                </div>

                <!-- 70% Workspace (Right) -->
                <div class="col-content bg-black/20 p-8 relative z-10" id="ph-content">
                    ${this.renderStep(this.step)}
                </div>
                
                <!-- Background Ambient -->
                <div class="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none z-0"></div>
            </div>
        `;
    },
    renderStep(step) {
        if(step === 0) return `
            <div class="w-full h-full flex gap-8 animate-fade-in">
                <!-- Input Panel -->
                <div class="flex-1 flex flex-col gap-6">
                    <div class="card bg-black/40 backdrop-blur-md border-white/10 p-6 flex-1 flex flex-col gap-5 shadow-2xl">
                        <div class="flex items-center gap-2 text-accent font-bold uppercase tracking-wider text-xs border-b border-white/10 pb-2">
                            <i class="fa-solid fa-brain"></i> 核心创意源点
                        </div>
                        
                        <div class="col gap-2 flex-1">
                            <span class="text-sm font-bold text-gray-300">核心脑洞 / 故事梗概</span>
                            <textarea class="textarea h-full bg-black/30 border-white/10 focus:border-accent/50 text-gray-200 text-base leading-relaxed p-4" id="ph-idea" placeholder="描述你心中那个最狂野的脑洞...">${this.data.idea||''}</textarea>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div class="col gap-2">
                                <span class="text-sm font-bold text-gray-300">类型</span>
                                <input class="input bg-black/30 border-white/10" id="ph-genre" placeholder="例如：赛博修仙" value="${this.data.genre||''}">
                            </div>
                            <div class="col gap-2">
                                <span class="text-sm font-bold text-gray-300">风格/基调</span>
                                <input class="input bg-black/30 border-white/10" id="ph-style" placeholder="例如：热血、暗黑" value="${this.data.style||''}">
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex gap-2">
                        <button class="btn btn-primary flex-1 py-4 text-lg font-bold shadow-xl shadow-accent/10 hover:scale-[1.02] transition-transform" onclick="Modules.phoenix.genOutline()">
                            <i class="fa-solid fa-bolt mr-2"></i> 生成细纲
                        </button>
                        <button class="btn flex-1 py-4 text-lg font-bold bg-white/10 hover:bg-white/20 text-white border-white/10" onclick="Modules.phoenix.continueGen()">
                            <i class="fa-solid fa-play mr-2"></i> 继续生成
                        </button>
                    </div>
                </div>

                <!-- Output Preview & Tools -->
                <div class="flex-1 card bg-black/40 backdrop-blur-md border-white/10 p-0 flex flex-col shadow-2xl overflow-hidden relative group">
                    <div class="flex border-b border-border bg-black/20">
                        <div id="ph-tab-btn-preview" class="tab-btn p-3 text-xs font-bold cursor-pointer flex-1 text-center border-r border-border active" onclick="Modules.phoenix.tab('preview')">生成预览</div>
                        <div id="ph-tab-btn-chat" class="tab-btn p-3 text-xs font-bold cursor-pointer flex-1 text-center border-r border-border" onclick="Modules.phoenix.tab('chat')">AI助手</div>
                        <div id="ph-tab-btn-io" class="tab-btn p-3 text-xs font-bold cursor-pointer flex-1 text-center border-r border-border" onclick="Modules.phoenix.tab('io')">IO调试</div>
                    </div>

                    <!-- Preview Tab -->
                    <div id="ph-tab-preview" class="flex-1 flex col relative">
                        <div class="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                        <textarea class="flex-1 w-full bg-transparent border-none p-8 font-mono text-sm leading-loose text-gray-300 resize-none focus:outline-none focus:bg-black/20 transition-colors" id="ph-outline-raw" placeholder="AI 正在等待指令...">${this.data.outlineRaw||''}</textarea>
                    </div>

                    <!-- Chat Tab -->
                    <div id="ph-tab-chat" class="flex-1 hidden flex col p-3 gap-3 animate-fade-in">
                        <div id="ph-chat-log" class="flex-1 bg-black/40 p-2 rounded border border-white/5 overflow-y-auto text-xs font-mono space-y-2"></div>
                        <div class="flex gap-2">
                            <input id="ph-chat-in" class="input h-8 text-xs bg-black/50 border-white/10" placeholder="输入指令...">
                            <button class="btn btn-icon btn-sm bg-accent text-black" onclick="Modules.phoenix.sendChat()"><i class="fa-solid fa-paper-plane"></i></button>
                        </div>
                    </div>

                    <!-- IO Tab -->
                    <div id="ph-tab-io" class="flex-1 hidden flex col p-0 animate-fade-in font-mono">
                        <div class="h-1/2 border-b border-border flex col">
                            <div class="px-2 py-1 text-[10px] text-accent bg-black/30">最后一次输入 (Input Prompt)</div>
                            <textarea id="ph-io-input" class="flex-1 bg-transparent border-none text-[10px] p-2 text-dim resize-none" readonly></textarea>
                        </div>
                        <div class="h-1/2 flex col">
                            <div class="px-2 py-1 text-[10px] text-green-400 bg-black/30">原始输出 (Raw Output)</div>
                            <textarea id="ph-io-output" class="flex-1 bg-transparent border-none text-[10px] p-2 text-dim resize-none" readonly></textarea>
                        </div>
                    </div>
                </div>
            </div>
        `;
        if(step === 1) return `
            <div class="w-full h-full card bg-black/40 backdrop-blur-md border-white/10 p-8 animate-fade-in flex flex-col gap-6 shadow-2xl">
                <div class="flex justify-between items-center border-b border-white/10 pb-4">
                    <h3 class="text-xl font-bold text-main">第二步：优化与结构化</h3>
                    <div class="text-xs text-dim">支持 Markdown 语法</div>
                </div>
                <div class="flex-1 grid grid-cols-2 gap-8 min-h-0">
                    <div class="col gap-3 flex-1 min-h-0">
                        <span class="text-xs font-bold text-accent uppercase tracking-wider">源码编辑</span>
                        <textarea class="textarea flex-1 font-mono text-sm resize-none bg-black/50 border-white/10 p-4 leading-relaxed text-gray-300 focus:border-accent/50" id="ph-outline-edit" oninput="Modules.phoenix.updatePreview()">${this.data.outlineRaw||''}</textarea>
                    </div>
                    <div class="col gap-3 flex-1 min-h-0">
                        <span class="text-xs font-bold text-accent uppercase tracking-wider">结构预览</span>
                        <div class="bg-black/30 p-6 rounded-lg border border-white/10 flex-1 overflow-y-auto text-sm text-dim font-serif whitespace-pre-wrap leading-loose shadow-inner" id="ph-outline-preview">
                            ${this.data.outlineRaw||'<span class="opacity-30">等待内容...</span>'}
                        </div>
                    </div>
                </div>
            </div>
        `;
        if(step === 2) return `
            <div class="w-full h-full flex center animate-fade-in">
                <div class="card p-12 w-full max-w-2xl bg-black/60 backdrop-blur-xl border-white/10 text-center shadow-2xl relative overflow-hidden">
                    <div class="absolute inset-0 bg-gradient-to-tr from-accent/10 to-transparent pointer-events-none"></div>
                    <div class="w-24 h-24 rounded-full bg-green-500/10 border border-green-500/30 flex center mx-auto mb-8 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                        <i class="fa-solid fa-check text-4xl text-green-500"></i>
                    </div>
                    <h3 class="text-3xl font-bold text-white mb-4">准备就绪</h3>
                    <p class="text-gray-400 mb-10 text-lg">您的世界地基已构建完成。正在导入至长篇执笔系统...</p>
                    
                    <div class="grid grid-cols-2 gap-4 mb-8">
                        <div class="p-4 bg-white/5 rounded border border-white/10">
                            <div class="text-2xl font-bold text-accent" id="ph-chap-count">0</div>
                            <div class="text-xs text-dim uppercase tracking-wider mt-1">总章数</div>
                        </div>
                        <div class="p-4 bg-white/5 rounded border border-white/10">
                            <div class="text-2xl font-bold text-blue-400">自动</div>
                            <div class="text-xs text-dim uppercase tracking-wider mt-1">向量同步</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    next() {
        if(this.step === 0) {
            this.data.idea = document.getElementById('ph-idea').value;
            this.data.genre = document.getElementById('ph-genre').value;
            this.data.style = document.getElementById('ph-style').value;
            this.data.outlineRaw = document.getElementById('ph-outline-raw').value;
            if(!this.data.outlineRaw) return UI.toast('请先生成细纲', 'error');
        } else if (this.step === 1) {
            this.data.outlineRaw = document.getElementById('ph-outline-edit').value;
        }

        if(this.step < 2) {
            this.step++;
            this.refresh();
            if(this.step === 2) {
                // Count chapters roughly
                const count = (this.data.outlineRaw.match(/###/g) || []).length;
                document.getElementById('ph-chap-count').innerText = count;
            }
        } else {
            this.finish();
        }
    },
    prev() {
        if(this.step > 0) {
            // Save current state before going back
            if(this.step === 1) this.data.outlineRaw = document.getElementById('ph-outline-edit').value;
            
            this.step--;
            this.refresh();
        }
    },
    refresh() {
        document.getElementById('ph-content').innerHTML = this.renderStep(this.step);
    },
    async genOutline() {
        const idea = document.getElementById('ph-idea').value;
        const genre = document.getElementById('ph-genre').value;
        const style = document.getElementById('ph-style').value;
        
        if(!idea) return UI.toast('请输入核心创意');

        // Init default if needed
        try {
            if(!(await DB.get('prompts', 'phoenix_outline'))) {
                const defaultPrompt = `基于创意【{{idea}}】\n类型：{{genre}}\n风格：{{style}}\n\n请生成一份详细的长篇小说分卷细纲。\n\n格式要求：\n## 第一卷：卷名\n### 第一章：章名\n(本章核心情节与看点...)\n### 第二章：章名\n(本章核心情节与看点...)\n...\n\n要求：\n1. 结构严谨，节奏紧凑\n2. 至少生成前3卷的规划\n3. 每一章都需要有具体的剧情点描述`;
                await DB.put('prompts', {id: 'phoenix_outline', name: 'phoenix_outline', content: defaultPrompt});
            }
        } catch (e) {
            console.warn('Prompt init error', e);
        }

        // Store data
        this.data.idea = idea;
        this.data.genre = genre;
        this.data.style = style;

        let promptTpl = await Modules.short.getPrompt('phoenix_outline');
        let prompt = promptTpl
            .replace('{{idea}}', idea || '')
            .replace('{{genre}}', genre || '')
            .replace('{{style}}', style || '');
            
        // Fallback for {{input}} variable usage in generic editor
        prompt = prompt.replace('{{input}}', idea);

        const el = document.getElementById('ph-outline-raw');
        el.value = "正在基于指令生成细纲...\n";
        
        Modules.phoenix.updateIO(prompt, 'Generating...');
        
        await AI.generate(prompt, {}, c => {
            el.value += c;
            this.data.outlineRaw = el.value;
            Modules.phoenix.updateIO(prompt, el.value);
        });
    },
    updatePreview() {
        const raw = document.getElementById('ph-outline-edit').value;
        document.getElementById('ph-outline-preview').innerText = raw;
    },
    tab: (t) => {
        const tabs = ['preview','chat','io'];
        tabs.forEach(x => {
            document.getElementById('ph-tab-'+x).classList.add('hidden');
            const btn = document.getElementById('ph-tab-btn-'+x);
            if(btn) btn.classList.remove('active');
        });
        document.getElementById('ph-tab-'+t).classList.remove('hidden');
        document.getElementById('ph-tab-btn-'+t).classList.add('active');
    },
    updateIO: (input, output) => {
        const inEl = document.getElementById('ph-io-input');
        const outEl = document.getElementById('ph-io-output');
        if(inEl) inEl.value = input;
        if(outEl) outEl.value = output;
    },
    continueGen: async () => {
        const current = document.getElementById('ph-outline-raw').value;
        if(!current) return UI.toast('请先生成大纲');
        
        let prompt = `[Task] Continue generating the outline from where it left off. Maintain consistent style and format.\n\n[Context]\n${current.slice(-1000)}`;
        
        Modules.phoenix.updateIO(prompt, 'Generating...');
        UI.toast('正在继续生成...');
        
        await AI.generate(prompt, {}, c => {
            const el = document.getElementById('ph-outline-raw');
            el.value += c;
            el.scrollTop = el.scrollHeight;
            Modules.phoenix.data.outlineRaw = el.value;
            Modules.phoenix.updateIO(prompt, el.value); // Update full output
        });
    },
    sendChat: async () => {
        const txt = document.getElementById('ph-chat-in').value;
        const log = document.getElementById('ph-chat-log');
        log.innerHTML += `<div>> ${txt}</div>`;
        await AI.generate(txt, {}, c => {
            log.innerHTML += `<span>${c}</span>`;
        });
        log.innerHTML += '<br><br>';
    },
    async finish() {
        // 1. Create Volume/Chapter Structure
        const lines = this.data.outlineRaw.split('\n');
        let currentVolId = null;
        let volOrder = 1;
        let chapOrder = 1;

        // Clean existing? Maybe not.
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            if (!line) continue;
            
            if (line.startsWith('## ')) {
                // New Volume
                const volTitle = line.replace('## ', '').trim();
                currentVolId = Utils.uuid();
                await DB.put('volumes', { id: currentVolId, title: volTitle, order: volOrder++ });
            } else if (line.startsWith('### ')) {
                // New Chapter
                const title = line.replace('### ', '').trim();
                
                // Extract outline
                let outlineContent = "";
                for (let j = i + 1; j < lines.length; j++) {
                    const nextLine = lines[j].trim();
                    if (nextLine.startsWith('#')) break;
                    outlineContent += nextLine + "\n";
                }
                
                await DB.put('chapters', {
                    id: Utils.uuid(),
                    title: title,
                    content: '',
                    outline: outlineContent.trim() || '从凤凰流导入',
                    order: chapOrder++,
                    volumeId: currentVolId
                });
            }
        }
        
        App.nav('writer');
        UI.toast('已导入执笔台', 'success');
        setTimeout(() => Modules.writer.loadTree(), 500);
    }
};

window.onload = App.init;


});