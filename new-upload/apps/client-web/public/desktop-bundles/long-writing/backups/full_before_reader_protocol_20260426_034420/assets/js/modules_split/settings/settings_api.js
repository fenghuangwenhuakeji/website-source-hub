// ═══════════════════════════════════════════════════════════════
// 系统设置 (Settings) — API 配置相关方法
// ═══════════════════════════════════════════════════════════════
Object.assign(Modules.settings, {
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
    }
});
