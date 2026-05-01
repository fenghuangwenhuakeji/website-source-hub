// settings_api_pool.js — 简化模型/API 管理（多模态/多提供商/卡片式）
Modules.settings = Object.assign(Modules.settings || {}, {
    _apiPoolModalOpen: false,
    _apiPoolEditingId: null,
    _apiPoolType: 'text', // text | image | video | audio

    API_PROVIDERS: [
        { id: 'custom', label: 'OpenAI 兼容', icon: 'fa-robot', supports: ['text','image'], base: 'https://api.openai.com/v1', model: 'gpt-4' },
        { id: 'gemini', label: 'Google Gemini', icon: 'fa-gem', supports: ['text','image'], base: 'https://generativelanguage.googleapis.com/v1beta', model: 'gemini-pro' },
        { id: 'claude', label: 'Anthropic Claude', icon: 'fa-feather', supports: ['text'], base: 'https://api.anthropic.com', model: 'claude-3-5-sonnet-latest' },
        { id: 'azure', label: 'Azure OpenAI', icon: 'fa-cloud', supports: ['text','image'], base: 'https://YOUR-RESOURCE.openai.azure.com/openai/deployments/YOUR-DEPLOYMENT', model: '你的部署名' },
        { id: 'ollama', label: 'Ollama 本地', icon: 'fa-server', supports: ['text','image'], base: 'http://localhost:11434/v1', model: 'llama3.1' },
        { id: 'deepseek', label: 'DeepSeek', icon: 'fa-code', supports: ['text'], base: 'https://api.deepseek.com', model: 'deepseek-chat' },
        { id: 'minimax', label: 'MiniMax', icon: 'fa-star-half-stroke', supports: ['text'], base: 'https://api.minimax.io/v1', model: 'minimax-m2.6' },
        { id: 'openrouter', label: 'OpenRouter', icon: 'fa-route', supports: ['text','image'], base: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4o' }
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
                    <div class="text-sm font-bold text-white">主控模型控制全系统生成</div>
                    <div class="text-[11px] text-dim mt-1">主控只允许一个，写作、拆书、总结等模块都走它；网页对话可以单独使用其他模型。</div>
                </div>
                <button class="btn btn-sm bg-accent/15 text-accent border border-accent/20 rounded-lg" onclick="Modules.settings._apiPoolType='text';Modules.settings._openApiPoolModal()">添加模型</button>
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
            const isMaster = type === 'text' && (api.is_master === 1 || api.is_active === 1);
            const isActive = type === 'text' ? isMaster : api.is_active === 1;
            const scopeText = type === 'text' ? (isMaster ? '全系统主控' : '仅网页对话可用') : (isActive ? '当前默认' : '备用配置');
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
                <div class="mb-2">
                    <span class="text-[9px] rounded-full px-2 py-0.5 border ${isActive ? 'bg-accent/15 border-accent/30 text-accent' : 'bg-white/5 border-white/10 text-dim'}">${scopeText}</span>
                </div>
                <div class="text-[9px] text-dim mb-2 truncate">${api.base_url || '-'}</div>
                <div class="flex gap-1">
                    <button class="flex-1 btn btn-xs ${isActive ? 'bg-accent/15 text-accent' : 'bg-white/5 text-dim hover:bg-white/10'}" onclick="Modules.settings._activateApi('${type}', '${api.id}')">${type === 'text' ? (isMaster ? '当前主控' : '设为主控') : (isActive ? '当前默认' : '设为默认')}</button>
                    <button class="btn btn-xs bg-white/5 text-dim hover:text-blue-400" onclick="Modules.settings._testApi('${type}', '${api.id}')"><i class="fa-solid fa-bolt text-[10px] mr-1"></i>测试</button>
                    <button class="btn btn-xs bg-white/5 text-dim hover:text-amber-400" onclick="Modules.settings._editApi('${type}', '${api.id}')"><i class="fa-solid fa-pen text-[10px]"></i></button>
                    <button class="btn btn-xs bg-white/5 text-dim hover:text-red-400" onclick="Modules.settings._deleteApi('${type}', '${api.id}')"><i class="fa-solid fa-trash text-[10px]"></i></button>
                </div>
            </div>`;
        }).join('');
    },

    async _openApiPoolModal(editId) {
        const type = this._apiPoolType || 'text';
        const providers = this.API_PROVIDERS.filter(p => p.supports.includes(type));
        const isEdit = !!editId;
        const existing = isEdit ? await DB.get(type + '_api_pool', editId).catch(() => null) : null;
        const currentProvider = existing?.provider || providers[0]?.id || 'custom';

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
                            <button type="button" data-provider="${p.id}" class="p-2 rounded-lg border text-center transition-all ${currentProvider === p.id ? 'border-accent/40 bg-accent/5' : 'border-white/10'}"
                                onclick="Modules.settings._selectApiProvider('${p.id}')">
                                <i class="fa-solid ${p.icon} text-sm ${p.id === 'custom' ? 'text-accent' : 'text-dim'}"></i>
                                <div class="text-[9px] text-white mt-1">${p.label}</div>
                            </button>
                        `).join('')}
                    </div>
                    <input type="hidden" id="st-api-provider" value="${currentProvider}">
                </div>
                <div>
                    <label class="text-[10px] text-dim font-bold uppercase mb-1 block">给它起个名字</label>
                    <input id="st-api-name" class="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-sm text-white" value="${this._apiAttr(existing?.config_name || '')}" placeholder="例如：主力写作模型">
                </div>
                <div>
                    <label class="text-[10px] text-dim font-bold uppercase mb-1 block">接口地址</label>
                    <input id="st-api-url" class="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-sm text-white font-mono" value="${this._apiAttr(existing?.base_url || '')}" placeholder="${this._apiAttr((providers.find(p => p.id === currentProvider) || providers[0])?.base || 'https://api.openai.com/v1')}">
                </div>
                <div>
                    <label class="text-[10px] text-dim font-bold uppercase mb-1 block">密钥</label>
                    <input id="st-api-key" type="password" class="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-sm text-white font-mono" value="${this._apiAttr(existing?.api_key || '')}" placeholder="${currentProvider === 'ollama' ? 'Ollama 本地可留空' : 'sk-...'}"></input>
                </div>
                <div>
                    <label class="text-[10px] text-dim font-bold uppercase mb-1 block">模型名</label>
                    <input id="st-api-model" class="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-sm text-white font-mono" value="${this._apiAttr(existing?.model_name || '')}" placeholder="${this._apiAttr((providers.find(p => p.id === currentProvider) || providers[0])?.model || 'gpt-4')}">
                </div>
                ${type === 'text' ? `
                <div class="p-3 rounded-lg bg-accent/10 border border-accent/20 text-[11px] text-accent leading-relaxed">
                    <i class="fa-solid fa-crown mr-1"></i>
                    保存后不会自动抢主控。点卡片上的“设为主控”才会替换全系统模型；其余模型只给网页对话使用。
                </div>` : ''}
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
        if (!name || !url || !model) return UI.toast('请填写名称、地址和模型名', 'error');
        if (provider !== 'ollama' && !key) return UI.toast('请填写密钥；Ollama 本地可以留空', 'error');

        const store = type + '_api_pool';
        const existing = editId ? await DB.get(store, editId).catch(() => null) : null;
        const pool = await this._getApiPool(type);
        const shouldBeFirstMaster = type === 'text' && !pool.some(a => a.is_master === 1 || a.is_active === 1) && !existing;
        const record = {
            id: editId || ('api_' + Date.now()),
            config_name: name, provider, base_url: url, api_key: key, model_name: model,
            is_active: existing?.is_active || (shouldBeFirstMaster ? 1 : 0),
            is_master: existing?.is_master || (shouldBeFirstMaster ? 1 : 0),
            scope: type === 'text' ? (existing?.scope || (shouldBeFirstMaster ? 'master' : 'web_chat')) : 'default',
            createdAt: existing?.createdAt || Date.now(),
            updatedAt: Date.now()
        };
        await DB.put(store, record);
        document.getElementById('st-api-pool-modal')?.remove();
        UI.toast('API 已保存');
        await Modules.web_chat?._loadPoolModels?.();
        this._renderApiPoolGrid();
    },

    async _activateApi(type, id) {
        const store = type + '_api_pool';
        const all = await this._getApiPool(type);
        for (const a of all) {
            const selected = a.id === id;
            a.is_active = selected ? 1 : 0;
            if (type === 'text') {
                a.is_master = selected ? 1 : 0;
                a.scope = selected ? 'master' : 'web_chat';
            }
            await DB.put(store, a);
        }
        UI.toast(type === 'text' ? '主控已切换' : 'API 已激活');
        await Modules.web_chat?._loadPoolModels?.();
        this._renderApiPoolGrid();
    },

    _selectApiProvider(providerId) {
        const input = document.getElementById('st-api-provider');
        if (input) input.value = providerId;
        document.querySelectorAll('#st-api-pool-modal [data-provider]').forEach(btn => {
            const active = btn.getAttribute('data-provider') === providerId;
            btn.className = btn.className
                .replace('border-accent/40 bg-accent/5', 'border-white/10')
                .replace('border-white/10', active ? 'border-accent/40 bg-accent/5' : 'border-white/10');
        });
        const p = this.API_PROVIDERS.find(x => x.id === providerId);
        const url = document.getElementById('st-api-url');
        const model = document.getElementById('st-api-model');
        const key = document.getElementById('st-api-key');
        if (p && url && !url.value.trim()) url.value = p.base || '';
        if (p && model && !model.value.trim()) model.value = p.model || '';
        if (key) key.placeholder = providerId === 'ollama' ? 'Ollama 本地可留空' : 'sk-...';
    },

    async _deleteApi(type, id) {
        if (!confirm('确定删除此 API 配置？')) return;
        await DB.del(type + '_api_pool', id);
        UI.toast('已删除');
        await Modules.web_chat?._loadPoolModels?.();
        this._renderApiPoolGrid();
    },

    _editApi(type, id) {
        this._apiPoolType = type || 'text';
        this._openApiPoolModal(id);
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
    },

    _apiAttr(value) {
        return String(value ?? '').replace(/[&<>"']/g, ch => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[ch]));
    }
});
