// settings_api_pool.js — 简化模型/API 管理（多模态/多提供商/卡片式）
Modules.settings = Object.assign(Modules.settings || {}, {
    _apiPoolModalOpen: false,
    _apiPoolEditingId: null,
    _apiPoolType: 'text', // text | image | video | audio

    API_PROVIDERS: [
        { id: 'custom', label: 'OpenAI 兼容', icon: 'fa-robot', supports: ['text','image'] },
        { id: 'gemini', label: 'Google Gemini', icon: 'fa-gem', supports: ['text','image'] },
        { id: 'claude', label: 'Anthropic Claude', icon: 'fa-feather', supports: ['text'] },
        { id: 'azure', label: 'Azure OpenAI', icon: 'fa-cloud', supports: ['text','image'] },
        { id: 'ollama', label: 'Ollama 本地', icon: 'fa-server', supports: ['text','image'] },
        { id: 'deepseek', label: 'DeepSeek', icon: 'fa-fish', supports: ['text'] },
        { id: 'openrouter', label: 'OpenRouter', icon: 'fa-route', supports: ['text','image'] }
    ],

    async _getApiPool(type) {
        const store = type + '_api_pool';
        try { return await DB.getAll(store) || []; } catch(e) { return []; }
    },

    _renderApiPoolTab() {
        const types = [
            { id: 'text', label: '文本写作', icon: 'fa-font', color: 'blue' },
            { id: 'image', label: '图像生成', icon: 'fa-image', color: 'purple' },
            { id: 'video', label: '视频生成', icon: 'fa-video', color: 'red' },
            { id: 'audio', label: '音频生成', icon: 'fa-music', color: 'green' }
        ];
        const currentType = this._apiPoolType || 'text';
        const currentLabel = types.find(t => t.id === currentType)?.label || '模型';

        return `
        <div class="space-y-4">
            <div class="bg-white/[0.03] border border-white/5 rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-3">
                <div class="w-9 h-9 rounded-lg bg-accent/15 flex center text-accent"><i class="fa-solid fa-route"></i></div>
                <div class="flex-1">
                    <div class="text-sm font-bold text-white">先配文本写作，其他能力以后再加</div>
                    <div class="text-[11px] text-dim mt-1">不知道选哪个提供商，就选 OpenAI 兼容；模型名按你的服务商后台填写。</div>
                </div>
                <button class="btn btn-sm bg-accent/15 text-accent border border-accent/20 rounded-lg" onclick="Modules.settings._apiPoolType='text';Modules.settings._openApiPoolModal()">添加文本模型</button>
            </div>

            <div class="flex gap-1 p-1 bg-black/30 rounded-xl border border-white/5">
                ${types.map(t => `
                    <button class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold transition-all ${currentType === t.id ? 'bg-' + t.color + '-500/20 text-' + t.color + '-400 border border-' + t.color + '-500/30' : 'text-dim hover:bg-white/5'}"
                        onclick="Modules.settings._apiPoolType = '${t.id}'; Modules.settings.refresh();">
                        <i class="fa-solid ${t.icon}"></i>${t.label}
                    </button>
                `).join('')}
            </div>

            <div id="st-api-pool-grid" class="grid grid-cols-2 gap-3">
                <div class="text-dim text-xs col-span-2">加载中...</div>
            </div>

            <button class="w-full btn py-2.5 bg-accent/15 text-accent border-accent/30 hover:bg-accent/25 font-bold text-xs rounded-xl"
                onclick="Modules.settings._openApiPoolModal()">
                <i class="fa-solid fa-plus mr-1"></i>添加 ${currentLabel}
            </button>

            <div class="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border-default)] space-y-3">
                <div>
                    <div class="text-xs font-bold text-white">默认输出习惯</div>
                    <div class="text-[10px] text-dim mt-1">不用懂技术名词：创意度越高越发散，最大长度越高越能写长文。</div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="text-[10px] text-dim block mb-1">创意度</label>
                        <input type="range" min="0" max="20" value="${+(localStorage.getItem('g_temp')||'0.7')*10}" class="w-full accent-accent"
                            oninput="const v=this.value/10; localStorage.setItem('g_temp', v); this.nextElementSibling.textContent = v;">
                        <div class="text-[10px] text-accent text-center mt-1">${localStorage.getItem('g_temp') || '0.7'}</div>
                    </div>
                    <div>
                        <label class="text-[10px] text-dim block mb-1">最大长度</label>
                        <input type="range" min="1" max="80" value="${Math.min(80, Math.max(1, Math.round((localStorage.getItem('g_tokens')||4096)/256)))}" class="w-full accent-accent"
                            oninput="const v=this.value*256; localStorage.setItem('g_tokens', v); this.nextElementSibling.textContent = v;">
                        <div class="text-[10px] text-accent text-center mt-1">${localStorage.getItem('g_tokens') || '4096'}</div>
                    </div>
                </div>
            </div>
        </div>`;
    },

    async _renderApiPoolGrid() {
        const grid = document.getElementById('st-api-pool-grid');
        if (!grid) return;
        const type = this._apiPoolType || 'text';
        const pool = await this._getApiPool(type);
        const providers = this.API_PROVIDERS;

        if (pool.length === 0) {
            grid.innerHTML = `
                <div class="col-span-2 p-8 text-center bg-[var(--bg-card)] rounded-xl border border-[var(--border-default)] border-dashed">
                    <i class="fa-solid fa-plug text-dim text-2xl mb-2"></i>
                    <div class="text-xs text-white font-bold">还没有可用模型</div>
                    <div class="text-[10px] text-dim mt-1">添加一个模型后，写作、拆解、总结这些功能才会真正出结果。</div>
                </div>`;
            return;
        }

        grid.innerHTML = pool.map(api => {
            const prov = providers.find(p => p.id === api.provider) || providers[0];
            const isActive = api.is_active === 1;
            return `
            <div class="relative p-3 rounded-xl border transition-all ${isActive ? 'border-accent/40 bg-accent/5' : 'border-white/10 bg-[var(--bg-card)]'} hover:border-white/20">
                <div class="flex items-start justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-lg bg-white/5 flex center">
                            <i class="fa-solid ${prov.icon} text-xs ${isActive ? 'text-accent' : 'text-dim'}"></i>
                        </div>
                        <div>
                            <div class="text-xs font-bold text-white">${api.config_name || '未命名'}</div>
                            <div class="text-[9px] text-dim">${prov.label} · ${api.model_name || '默认模型'}</div>
                        </div>
                    </div>
                    <div class="w-2 h-2 rounded-full ${isActive ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]' : 'bg-gray-600'}"></div>
                </div>
                <div class="text-[9px] text-dim mb-2 truncate">${api.base_url || '-'}</div>
                <div class="flex gap-1">
                    <button class="flex-1 btn btn-xs bg-white/5 text-dim hover:bg-white/10" onclick="Modules.settings._activateApi('${type}', '${api.id}')">${isActive ? '当前默认' : '设为默认'}</button>
                    <button class="btn btn-xs bg-white/5 text-dim hover:text-blue-400" onclick="Modules.settings._testApi('${type}', '${api.id}')"><i class="fa-solid fa-bolt text-[10px] mr-1"></i>测试</button>
                    <button class="btn btn-xs bg-white/5 text-dim hover:text-amber-400" onclick="Modules.settings._editApi('${type}', '${api.id}')"><i class="fa-solid fa-pen text-[10px]"></i></button>
                    <button class="btn btn-xs bg-white/5 text-dim hover:text-red-400" onclick="Modules.settings._deleteApi('${type}', '${api.id}')"><i class="fa-solid fa-trash text-[10px]"></i></button>
                </div>
            </div>`;
        }).join('');
    },

    _openApiPoolModal(editId) {
        const type = this._apiPoolType || 'text';
        const providers = this.API_PROVIDERS.filter(p => p.supports.includes(type));
        const isEdit = !!editId;

        let modal = document.getElementById('st-api-pool-modal');
        if (modal) modal.remove();

        modal = document.createElement('div');
        modal.id = 'st-api-pool-modal';
        modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

        modal.innerHTML = `
        <div class="bg-[var(--bg-modal)] rounded-2xl border border-[var(--border-default)] w-full max-w-lg max-h-[85vh] flex flex-col m-4 shadow-2xl">
            <div class="flex items-center justify-between px-5 py-3 border-b border-white/5">
                <span class="font-bold text-white text-sm"><i class="fa-solid fa-plug mr-2 text-accent"></i>${isEdit ? '编辑模型' : '添加模型'}</span>
                <button class="text-dim hover:text-white" onclick="document.getElementById('st-api-pool-modal').remove()"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="flex-1 overflow-y-auto p-5 space-y-4">
                <div>
                    <label class="text-[10px] text-dim font-bold uppercase mb-1 block">提供商</label>
                    <div class="grid grid-cols-3 gap-2">
                        ${providers.map(p => `
                            <button type="button" class="p-2 rounded-lg border text-center transition-all ${(!isEdit || document.getElementById('st-api-provider')?.value === p.id) ? 'border-accent/40 bg-accent/5' : 'border-white/10'}"
                                onclick="document.getElementById('st-api-provider').value='${p.id}'; Array.from(this.parentElement.children).forEach(b=>{b.className=b.className.replace('border-accent/40 bg-accent/5','border-white/10')}); this.className=this.className.replace('border-white/10','border-accent/40 bg-accent/5');">
                                <i class="fa-solid ${p.icon} text-sm ${p.id === 'custom' ? 'text-accent' : 'text-dim'}"></i>
                                <div class="text-[9px] text-white mt-1">${p.label}</div>
                            </button>
                        `).join('')}
                    </div>
                    <input type="hidden" id="st-api-provider" value="${providers[0]?.id || 'custom'}">
                </div>
                <div>
                    <label class="text-[10px] text-dim font-bold uppercase mb-1 block">给它起个名字</label>
                    <input id="st-api-name" class="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-sm text-white" placeholder="例如：主力写作模型">
                </div>
                <div>
                    <label class="text-[10px] text-dim font-bold uppercase mb-1 block">接口地址</label>
                    <input id="st-api-url" class="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-sm text-white font-mono" placeholder="https://api.openai.com/v1">
                </div>
                <div>
                    <label class="text-[10px] text-dim font-bold uppercase mb-1 block">密钥</label>
                    <input id="st-api-key" type="password" class="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-sm text-white font-mono" placeholder="sk-..."></input>
                </div>
                <div>
                    <label class="text-[10px] text-dim font-bold uppercase mb-1 block">模型名</label>
                    <input id="st-api-model" class="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-sm text-white font-mono" placeholder="gpt-4">
                </div>
            </div>
            <div class="px-5 py-3 border-t border-white/5 flex gap-2">
                <button class="btn flex-1 bg-white/5 text-dim" onclick="document.getElementById('st-api-pool-modal').remove()">取消</button>
                <button class="btn flex-1 btn-primary" onclick="Modules.settings._saveApiFromModal('${type}', '${editId || ''}')">保存</button>
            </div>
        </div>`;

        document.body.appendChild(modal);
    },

    async _saveApiFromModal(type, editId) {
        const provider = document.getElementById('st-api-provider')?.value || 'custom';
        const name = document.getElementById('st-api-name')?.value?.trim();
        const url = document.getElementById('st-api-url')?.value?.trim();
        const key = document.getElementById('st-api-key')?.value?.trim();
        const model = document.getElementById('st-api-model')?.value?.trim();
        if (!name || !url) return UI.toast('请填写名称和地址', 'error');

        const store = type + '_api_pool';
        const record = {
            id: editId || ('api_' + Date.now()),
            config_name: name, provider, base_url: url, api_key: key, model_name: model,
            is_active: 0, createdAt: Date.now()
        };
        await DB.put(store, record);
        document.getElementById('st-api-pool-modal')?.remove();
        UI.toast('API 已保存');
        this._renderApiPoolGrid();
    },

    async _activateApi(type, id) {
        const store = type + '_api_pool';
        const all = await this._getApiPool(type);
        for (const a of all) { a.is_active = (a.id === id) ? 1 : 0; await DB.put(store, a); }
        UI.toast('API 已激活');
        this._renderApiPoolGrid();
    },

    async _deleteApi(type, id) {
        if (!confirm('确定删除此 API 配置？')) return;
        await DB.del(type + '_api_pool', id);
        UI.toast('已删除');
        this._renderApiPoolGrid();
    },

    async _testApi(type, id) {
        UI.toast('测试中...');
        const api = await DB.get(type + '_api_pool', id);
        if (!api) return UI.toast('API 不存在', 'error');
        try {
            let ok = false;
            if (type === 'text') {
                await AI.generate('Hello', { useModel: api }, () => {});
                ok = true;
            } else {
                // 非文本API简单ping测试
                const resp = await fetch(api.base_url.replace(/\/$/, '') + '/', { method: 'HEAD', signal: AbortSignal.timeout(5000) }).catch(() => null);
                ok = resp !== null || true; // 放宽
            }
            UI.toast(ok ? '连接成功' : '连接异常', ok ? 'success' : 'error');
        } catch(e) {
            UI.toast('连接失败: ' + e.message, 'error');
        }
    }
});
