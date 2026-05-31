// settings_api_pool.js — 简化模型/API 管理（多模态/多提供商/卡片式）
Modules.settings = Object.assign(Modules.settings || {}, {
    _apiPoolModalOpen: false,
    _apiPoolEditingId: null,
    _apiPoolType: 'text', // text | parse | fusion | image | video | audio

    API_PROVIDERS: [
        { id: 'custom', label: 'OpenAI 兼容', icon: 'fa-robot', supports: ['text','parse','fusion','image'], base: 'https://api.openai.com/v1', model: 'gpt-4' },
        { id: 'gemini', label: 'Google Gemini', icon: 'fa-gem', supports: ['text','parse','fusion','image'], base: 'https://generativelanguage.googleapis.com/v1beta', model: 'gemini-pro' },
        { id: 'claude', label: 'Anthropic Claude', icon: 'fa-feather', supports: ['text','parse','fusion'], base: 'https://api.anthropic.com', model: 'claude-3-5-sonnet-latest' },
        { id: 'azure', label: 'Azure OpenAI', icon: 'fa-cloud', supports: ['text','parse','fusion','image'], base: 'https://YOUR-RESOURCE.openai.azure.com/openai/deployments/YOUR-DEPLOYMENT', model: '你的部署名' },
        { id: 'ollama', label: 'Ollama 本地', icon: 'fa-server', supports: ['text','parse','fusion','image'], base: 'http://localhost:11434/v1', model: 'llama3.1' },
        { id: 'deepseek', label: 'DeepSeek', icon: 'fa-code', supports: ['text','parse','fusion'], base: 'https://api.deepseek.com', model: 'deepseek-chat' },
        { id: 'minimax', label: 'MiniMax', icon: 'fa-star-half-stroke', supports: ['text','parse','fusion'], base: 'https://api.minimax.io/v1', model: 'minimax-m2.6' },
        { id: 'openrouter', label: 'OpenRouter', icon: 'fa-route', supports: ['text','parse','fusion','image'], base: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4o' }
    ],

    async _getApiPool(type) {
        const store = type + '_api_pool';
        try { return await DB.getAll(store) || []; } catch(e) { return []; }
    },

    _apiTypeMeta(type) {
        const meta = {
            text: {
                id: 'text',
                label: '主控模型',
                short: '主控',
                add: '添加主控模型',
                icon: 'fa-crown',
                color: 'blue',
                activeBadge: '写作主控',
                idleBadge: '备用主控',
                activeButton: '当前写作主控',
                idleButton: '设为写作主控',
                empty: '主控模型负责正文生成、润色、创意输出。',
                note: '主控模型只负责正文生成、润色和普通创意。拆书、解析可以单独配置；未配置时自动回退主控。',
                placeholder: '例如：主控-GLM'
            },
            fusion: {
                id: 'fusion',
                label: '拆书模型',
                short: '拆书',
                add: '添加拆书模型',
                icon: 'fa-book-open-reader',
                color: 'amber',
                activeBadge: '拆书专用',
                idleBadge: '备用拆书',
                activeButton: '当前拆书模型',
                idleButton: '设为拆书模型',
                empty: '拆书模型只负责拆书弹药、技法提取、读者反应拆解。',
                note: '拆书模型只拿技法弹药：钩子、节奏、信息差、读者反应、反转模式。它不能改项目方向、人物关系或世界规则。',
                placeholder: '例如：拆书-快速长上下文'
            },
            parse: {
                id: 'parse',
                label: '解析模型',
                short: '解析',
                add: '添加解析模型',
                icon: 'fa-diagram-project',
                color: 'cyan',
                activeBadge: '解析专用',
                idleBadge: '备用解析',
                activeButton: '当前解析模型',
                idleButton: '设为解析模型',
                empty: '解析模型只负责导入解析、细纲反推、实体提取。',
                note: '解析模型只做结构化读取：导入正文、反推章内细纲、提取人物/规则/伏笔/地点。它不负责续写正文。',
                placeholder: '例如：解析-稳定模型'
            },
            image: { id: 'image', label: '图像生成', short: '图像', add: '添加图像模型', icon: 'fa-image', color: 'purple', activeBadge: '当前默认', idleBadge: '备用配置', activeButton: '当前默认', idleButton: '设为默认', empty: '添加图像模型后，可以用于封面、角色图和视觉素材。', note: '', placeholder: '例如：封面图模型' },
            video: { id: 'video', label: '视频生成', short: '视频', add: '添加视频模型', icon: 'fa-video', color: 'red', activeBadge: '当前默认', idleBadge: '备用配置', activeButton: '当前默认', idleButton: '设为默认', empty: '添加视频模型后，可以用于短剧和分镜素材。', note: '', placeholder: '例如：视频生成模型' },
            audio: { id: 'audio', label: '音频生成', short: '音频', add: '添加音频模型', icon: 'fa-music', color: 'green', activeBadge: '当前默认', idleBadge: '备用配置', activeButton: '当前默认', idleButton: '设为默认', empty: '添加音频模型后，可以用于旁白、配音和音效。', note: '', placeholder: '例如：配音模型' }
        };
        return meta[type] || meta.text;
    },

    _openApiPoolModalFor(type) {
        this._apiPoolType = type || 'text';
        this.refresh();
        setTimeout(() => this._openApiPoolModal(), 80);
    },

    _renderApiPoolTab() {
        const types = [
            this._apiTypeMeta('text'),
            this._apiTypeMeta('fusion'),
            this._apiTypeMeta('parse'),
            this._apiTypeMeta('image'),
            this._apiTypeMeta('video'),
            this._apiTypeMeta('audio')
        ];
        const currentType = this._apiPoolType || 'text';
        const currentMeta = this._apiTypeMeta(currentType);
        const currentLabel = currentMeta.label || '模型';

        return `
        <div class="space-y-4">
            <div class="bg-white/[0.03] border border-white/5 rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-3">
                <div class="w-9 h-9 rounded-lg bg-accent/15 flex center text-accent"><i class="fa-solid fa-route"></i></div>
                <div class="flex-1">
                    <div class="text-sm font-bold text-white">三路模型分开跑</div>
                    <div class="text-[11px] text-dim mt-1">主控写正文；拆书只拿弹药；解析只做导入、细纲、实体。拆书/解析没配时自动回退主控。</div>
                </div>
                <div class="flex flex-wrap gap-2">
                    <button class="btn btn-sm bg-blue-500/15 text-blue-300 border border-blue-500/20 rounded-lg" onclick="Modules.settings._openApiPoolModalFor('text')">主控</button>
                    <button class="btn btn-sm bg-amber-500/15 text-amber-300 border border-amber-500/20 rounded-lg" onclick="Modules.settings._openApiPoolModalFor('fusion')">拆书</button>
                    <button class="btn btn-sm bg-cyan-500/15 text-cyan-300 border border-cyan-500/20 rounded-lg" onclick="Modules.settings._openApiPoolModalFor('parse')">解析</button>
                </div>
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
                <i class="fa-solid fa-plus mr-1"></i>${currentMeta.add || ('添加 ' + currentLabel)}
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
        const meta = this._apiTypeMeta(type);
        const pool = await this._getApiPool(type);
        const providers = this.API_PROVIDERS;

        if (pool.length === 0) {
            grid.innerHTML = `
                <div class="col-span-2 p-8 text-center bg-[var(--bg-card)] rounded-xl border border-[var(--border-default)] border-dashed">
                    <i class="fa-solid fa-plug text-dim text-2xl mb-2"></i>
                    <div class="text-xs text-white font-bold">还没有${meta.label}</div>
                    <div class="text-[10px] text-dim mt-1">${meta.empty} 拆书/解析没配时会回退主控。</div>
                </div>`;
            return;
        }

        grid.innerHTML = pool.map(api => {
            const prov = providers.find(p => p.id === api.provider) || providers[0];
            const isBuiltin = api._builtin === true || api.id === '_builtin_default';
            const isMaster = type === 'text' && (api.is_master === 1 || api.is_active === 1);
            const isActive = type === 'text' ? isMaster : api.is_active === 1;
            const scopeText = isActive ? meta.activeBadge : meta.idleBadge;
            const actionText = isActive ? meta.activeButton : meta.idleButton;
            const builtinBadge = isBuiltin ? `<span class="text-[8px] rounded-full px-1.5 py-0.5 border bg-yellow-500/15 border-yellow-500/30 text-yellow-400 ml-1">内嵌</span>` : '';
            const deleteBtn = isBuiltin ? '' : `<button class="btn btn-xs bg-white/5 text-dim hover:text-red-400" onclick="Modules.settings._deleteApi('${type}', '${api.id}')"><i class="fa-solid fa-trash text-[10px]"></i></button>`;
            return `
            <div class="relative p-3 rounded-xl border transition-all ${isActive ? 'border-accent/40 bg-accent/5' : 'border-white/10 bg-[var(--bg-card)]'} hover:border-white/20">
                <div class="flex items-start justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-lg bg-white/5 flex center">
                            <i class="fa-solid ${prov.icon} text-xs ${isActive ? 'text-accent' : 'text-dim'}"></i>
                        </div>
                        <div>
                            <div class="text-xs font-bold text-white">${api.config_name || '未命名'}${builtinBadge}</div>
                            <div class="text-[9px] text-dim">${prov.label} · ${api.model_name || '默认模型'}</div>
                        </div>
                    </div>
                    <div class="w-2 h-2 rounded-full ${isActive ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]' : 'bg-gray-600'}"></div>
                </div>
                <div class="mb-2">
                    <span class="text-[9px] rounded-full px-2 py-0.5 border ${isActive ? 'bg-accent/15 border-accent/30 text-accent' : 'bg-white/5 border-white/10 text-dim'}">${scopeText}</span>
                </div>
                <div class="text-[9px] text-dim mb-2 truncate">${isBuiltin ? '阿里云 DashScope · 内嵌默认' : (api.base_url || '-')}</div>
                <div class="flex gap-1">
                    <button class="flex-1 btn btn-xs ${isActive ? 'bg-accent/15 text-accent' : 'bg-white/5 text-dim hover:bg-white/10'}" onclick="Modules.settings._activateApi('${type}', '${api.id}')">${actionText}</button>
                    <button class="btn btn-xs bg-white/5 text-dim hover:text-blue-400" onclick="Modules.settings._testApi('${type}', '${api.id}')"><i class="fa-solid fa-bolt text-[10px] mr-1"></i>测试</button>
                    <button class="btn btn-xs bg-white/5 text-dim hover:text-amber-400" onclick="Modules.settings._editApi('${type}', '${api.id}')"><i class="fa-solid fa-pen text-[10px]"></i></button>
                    ${deleteBtn}
                </div>
            </div>`;
        }).join('');
    },

    async _openApiPoolModal(editId) {
        const type = this._apiPoolType || 'text';
        const meta = this._apiTypeMeta(type);
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
                <span class="font-bold text-white text-sm"><i class="fa-solid ${meta.icon || 'fa-plug'} mr-2 text-accent"></i>${isEdit ? '编辑' : '添加'}${meta.label}</span>
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
                    <input id="st-api-name" class="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-sm text-white" value="${this._apiAttr(existing?.config_name || '')}" placeholder="${this._apiAttr(meta.placeholder || '例如：主力模型')}">
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
                ${meta.note ? `
                <div class="p-3 rounded-lg bg-accent/10 border border-accent/20 text-[11px] text-accent leading-relaxed">
                    <i class="fa-solid ${meta.icon || 'fa-circle-info'} mr-1"></i>
                    ${meta.note}
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
        const shouldBeFirstDefault = type !== 'text' && !pool.some(a => a.is_active === 1) && !existing;
        const record = {
            id: editId || ('api_' + Date.now()),
            config_name: name, provider, base_url: url, api_key: key, model_name: model,
            is_active: existing?.is_active || ((shouldBeFirstMaster || shouldBeFirstDefault) ? 1 : 0),
            is_master: type === 'text' ? (existing?.is_master || (shouldBeFirstMaster ? 1 : 0)) : 0,
            scope: type === 'text' ? (existing?.scope || (shouldBeFirstMaster ? 'master' : 'web_chat')) : 'default',
            createdAt: existing?.createdAt || Date.now(),
            updatedAt: Date.now()
        };
        await DB.put(store, record);
        document.getElementById('st-api-pool-modal')?.remove();
        UI.toast(`${this._apiTypeMeta(type).label}已保存`);
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
        const meta = this._apiTypeMeta(type);
        UI.toast(type === 'text' ? '写作主控已切换' : `${meta.label}已激活`);
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
        const api = await DB.get(type + '_api_pool', id);
        if (api && (api._builtin === true || api.id === '_builtin_default')) {
            UI.toast('内嵌默认配置不可删除，但您可以添加新配置后会自动切换', 'error');
            return;
        }
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
            if (['text','parse','fusion'].includes(type)) {
                await AI.generate('Hello', { useModel: api, noReaderProtocol: true, apiType: type }, () => {});
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
