// ========== 网页对话 (Web Chat) - 多角色 · 多会话 · RAG增强 ==========
Modules.web_chat = {
    currentSessionId: null,
    sessions: [],
    currentRoleId: 'assistant',
    messages: [],
    _generating: false,
    _ragEnabled: true,
    _ragData: { entities: [], world: [], fusion: [], chapters: [] },

    roles: [
        { id: 'assistant', name: '智能助手', icon: 'fa-robot', color: 'text-blue-400', desc: '通用AI助手，擅长回答各类问题' },
        { id: 'writing_tutor', name: '写作导师', icon: 'fa-graduation-cap', color: 'text-purple-400', desc: '专业写作指导，帮助您提升文笔' },
        { id: 'literary_critic', name: '文学评论家', icon: 'fa-book', color: 'text-pink-400', desc: '深度文学分析，点评您的作品' },
        { id: 'editor', name: '责任编辑', icon: 'fa-marker', color: 'text-green-400', desc: '专业编辑视角，优化您的文稿' },
        { id: 'plot_master', name: '情节大师', icon: 'fa-sitemap', color: 'text-amber-400', desc: '擅长情节设计、悬念布局、节奏控制' },
        { id: 'character_designer', name: '人设专家', icon: 'fa-user-pen', color: 'text-cyan-400', desc: '人物塑造、性格设计、角色弧线' },
        { id: 'world_builder', name: '世界观架构师', icon: 'fa-earth-americas', color: 'text-indigo-400', desc: '世界观构建、设定完善、体系设计' },
        { id: 'dialogue_coach', name: '对话教练', icon: 'fa-comments', color: 'text-rose-400', desc: '对话润色、角色声音、潜台词设计' },
        { id: 'custom', name: '自定义角色', icon: 'fa-user-gear', color: 'text-yellow-400', desc: '创建您专属的AI角色' }
    ],

    rolePrompts: {
        assistant: '你是一个友好、专业的AI助手，擅长回答各类问题，提供有帮助的建议和信息。',
        writing_tutor: '你是一位资深的写作导师，拥有丰富的写作教学经验。你的任务是帮助用户提升写作技巧，提供建设性的反馈，指导他们如何组织情节、塑造人物、营造氛围，以及优化文笔。请用鼓励但专业的语气，给出具体可行的建议。',
        literary_critic: '你是一位眼光犀利的文学评论家，擅长深度分析文学作品的主题、结构、人物塑造和艺术手法。请从专业角度点评用户的作品，指出优点和不足，并提供改进建议。评价要客观中肯，既有赞美也有建设性的批评。',
        editor: '你是一位经验丰富的责任编辑，以专业严谨的态度对待每一篇文稿。你的任务是帮助用户优化作品，从结构逻辑、语言表达、情节节奏、人物塑造等多个维度进行编辑建议。请直接指出问题所在，并提供具体的修改方案。',
        plot_master: '你是一位精通各种叙事技巧的情节大师。你擅长设计引人入胜的情节、布局悬念、控制节奏、制造反转。请帮助用户优化故事结构，设计有效的钩子和高潮，确保情节张弛有度、扣人心弦。',
        character_designer: '你是一位专业的人物设计师，擅长创造立体、鲜活的角色。你精通性格塑造、角色弧线设计、动机构建、人物关系网络。请帮助用户创造有深度、有魅力、有成长空间的角色。',
        world_builder: '你是一位资深的世界观架构师，擅长构建完整、自洽、引人入胜的世界设定。你精通地理、历史、文化、政治、经济、魔法/科技体系等各维度的世界观设计。请帮助用户打造有深度、有细节、有逻辑的世界观。',
        dialogue_coach: '你是一位对话写作专家，擅长创作自然、生动、有深度的对话。你精通角色声音设计、潜台词写作、对话节奏控制、信息传递技巧。请帮助用户优化对话，使其更加真实、有张力、有层次。'
    },

    customRole: {
        name: '',
        description: '',
        prompt: ''
    },

    projects: [],
    currentProjectId: null,
    currentTab: 'projects',
    _editingChapter: null,
    _sessionGroups: [],
    _currentGroupId: null,

    assistantModes: [
        { id: 'chat', name: '对话', icon: 'fa-comments', prompt: '' },
        { id: 'continue', name: '续写', icon: 'fa-pen-fancy', prompt: '你是续写助手。基于当前NEXUS状态和已有内容，直接输出续写正文，不要解释。' },
        { id: 'diagnose', name: '诊断', icon: 'fa-stethoscope', prompt: '你是写作诊断师。基于NEXUS四状态机，诊断当前文本的问题（视角、节奏、情绪、伏笔），给出具体修改建议。' },
        { id: 'mutate', name: '变异', icon: 'fa-dna', prompt: '你是文本变异引擎。基于NEXUS状态，对当前文本进行创意变异（改写风格、反转情节、强化冲突、切换视角），直接输出变异结果。' },
        { id: 'deconstruct', name: '拆解', icon: 'fa-screwdriver-wrench', prompt: '你是技法拆解师。拆解当前文本的写作技法（黄金螺旋、钩子、节奏、画面感），标注具体位置和效果。' }
    ],
    currentAssistantMode: 'chat',

    render() {
        return `
        <div class="flex h-full bg-[#08080a] overflow-hidden">
            <!-- 左侧：会话列表 -->
            <div class="w-72 shrink-0 flex flex-col bg-[#111113] border-r border-white/5">
                <div class="p-4 border-b border-white/5 bg-[#0d0d0f]">
                    <div class="flex items-center gap-2 mb-1">
                        <i class="fa-solid fa-comments text-accent text-lg"></i>
                        <span class="font-bold text-white text-lg">网页对话</span>
                    </div>
                    <span class="text-[10px] text-dim">多角色 · 多会话 · RAG增强</span>
                </div>
                
                <div class="p-3 border-b border-white/5">
                    <button class="btn w-full h-9 btn-primary font-bold text-xs" onclick="Modules.web_chat.newSession()">
                        <i class="fa-solid fa-plus mr-2"></i>新对话
                    </button>
                </div>

                <div class="flex-1 overflow-y-auto p-2" id="wc-sessions-list">
                    ${this._renderSessionsList()}
                </div>

                <div class="p-3 border-t border-white/5">
                    <button class="btn w-full h-8 bg-white/5 text-dim hover:text-white text-xs" onclick="Modules.web_chat.exportAllSessions()">
                        <i class="fa-solid fa-download mr-1"></i>导出全部对话
                    </button>
                </div>
            </div>

            <!-- 中间：主对话区域 -->
            <div class="flex-1 flex flex-col min-w-0">
                <div class="h-12 flex items-center justify-between px-5 bg-[#0d0d0f] border-b border-white/5 shrink-0">
                    <div class="flex items-center gap-3">
                        <div class="flex items-center gap-2">
                            ${this.roles.map(r => `
                                <button class="px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${this.currentRoleId === r.id ? 'bg-white/10 border border-white/10 text-white' : 'text-dim hover:bg-white/5 border border-transparent'}" onclick="Modules.web_chat.switchRole('${r.id}')" title="${r.desc}">
                                    <i class="fa-solid ${r.icon} ${r.color} mr-1"></i>${r.name}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <label class="flex items-center gap-2 cursor-pointer text-[10px]">
                            <input type="checkbox" ${this._ragEnabled ? 'checked' : ''} class="accent-green-500" onchange="Modules.web_chat.toggleRAG(this.checked)">
                            <span class="text-dim">RAG 上下文增强</span>
                        </label>
                        <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.short.openPromptModal('web_chat')">
                            <i class="fa-solid fa-gear"></i>
                        </button>
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto p-4 space-y-4" id="wc-messages">
                    ${this._renderMessages()}
                </div>

                <div class="p-3 border-t border-white/5 shrink-0 bg-[#0d0d0f]">
                    <div class="flex gap-2 mb-2 flex-wrap">
                        ${['续写', '润色', '扩写', '翻译'].map((t, i) => `
                            <button class="btn btn-xs bg-white/5 text-dim hover:text-white" onclick="Modules.web_chat.quickAction('${t}')">${t}</button>
                        `).join('')}
                        <span class="w-px h-5 bg-white/10 mx-1"></span>
                        <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30" onclick="Modules.web_chat.analyzeOutline()"><i class="fa-solid fa-sitemap mr-1"></i>大纲理解</button>
                        <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30" onclick="Modules.web_chat.analyzeRelations()"><i class="fa-solid fa-link mr-1"></i>关联分析</button>
                        <button class="btn btn-xs bg-amber-600/20 text-amber-400 border-amber-600/30" onclick="Modules.web_chat.summarizeContent()"><i class="fa-solid fa-compress-alt mr-1"></i>总结</button>
                        <button class="btn btn-xs bg-green-600/20 text-green-400 border-green-600/30" onclick="Modules.web_chat.diagnoseContent()"><i class="fa-solid fa-stethoscope mr-1"></i>诊断</button>
                    </div>
                    <div class="flex gap-1.5 mb-2 flex-wrap">
                        ${this._renderAssistantModeButtons()}
                    </div>
                    <div class="flex gap-2">
                        <textarea id="wc-input" class="flex-1 bg-black/30 border border-white/10 rounded-lg p-3 text-sm text-gray-200 resize-none h-20 focus:border-accent/30" placeholder="输入消息... (Shift+Enter换行) 可用 /continue /diagnose /mutate /workflow /agent" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();Modules.web_chat.sendMessage()}"></textarea>
                        <button class="btn btn-primary px-4 self-end" onclick="Modules.web_chat.sendMessage()" id="wc-send-btn">
                            <i class="fa-solid fa-paper-plane"></i>
                        </button>
                    </div>
                    <div class="flex gap-1.5 mt-2 flex-wrap">
                        ${['continue', 'diagnose', 'mutate', 'deconstruct'].map(id => {
                            const m = this.assistantModes.find(x => x.id === id);
                            const isActive = this.currentAssistantMode === id;
                            return `<button class="btn btn-xs ${isActive ? 'bg-accent/15 text-accent border-accent/40' : 'bg-white/5 text-dim hover:text-white border-transparent'} border" onclick="Modules.web_chat.switchAssistantMode('${id}')">${m?.name || id}</button>`;
                        }).join('')}
                    </div>
                </div>
            </div>

            <!-- 右侧：资源管理库 -->
            <div class="w-80 shrink-0 flex flex-col bg-[#111113] border-l border-white/5" id="wc-resources-panel">
                ${this._renderResourcesPanel()}
</div>
            </div>
        </div>
        ${this._renderEditorModal()}`;
    },

    _renderSessionsList() {
        if (this.sessions.length === 0) {
            return `<div class="text-center text-dim text-[10px] p-4">
                <i class="fa-solid fa-comments text-2xl mb-2 opacity-30"></i>
                <p>暂无会话</p>
                <p class="mt-1">点击上方"新对话"开始</p>
            </div>`;
        }
        return this.sessions.map(s => `
            <div class="p-3 rounded-lg mb-1 cursor-pointer transition-all ${this.currentSessionId === s.id ? 'bg-white/10 border border-white/10' : 'hover:bg-white/5 border border-transparent'}" onclick="Modules.web_chat.selectSession('${s.id}')">
                <div class="flex items-center justify-between mb-1">
                    <span class="text-xs font-bold text-white truncate">${s.title || '新对话'}</span>
                    <button class="text-[10px] text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100" onclick="event.stopPropagation();Modules.web_chat.deleteSession('${s.id}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
                <div class="text-[9px] text-dim truncate">${s.preview || ''}</div>
                <div class="text-[8px] text-dim mt-1">${new Date(s.updatedAt).toLocaleString('zh-CN', {month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}</div>
            </div>
        `).join('');
    },

    _renderMessages() {
        if (this.messages.length === 0) {
            const role = this.roles.find(r => r.id === this.currentRoleId);
            return `
                <div class="flex items-center justify-center h-full">
                    <div class="text-center max-w-md">
                        <div class="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex center mx-auto mb-4">
                            <i class="fa-solid ${role?.icon || 'fa-robot'} text-2xl ${role?.color || 'text-blue-400'}"></i>
                        </div>
                        <div class="text-sm font-bold text-white mb-2">${role?.name || '智能助手'}</div>
                        <div class="text-[10px] text-dim mb-4">${role?.desc || '准备好帮助您了'}</div>
                        <div class="text-[9px] text-dim">
                            <p class="mb-2">试试这些快捷操作：</p>
                            <div class="flex flex-wrap gap-1 justify-center">
                                <button class="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[9px]" onclick="Modules.web_chat.quickAction('续写')">续写</button>
                                <button class="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[9px]" onclick="Modules.web_chat.quickAction('润色')">润色</button>
                                <button class="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[9px]" onclick="Modules.web_chat.quickAction('扩写')">扩写</button>
                            </div>
                        </div>
                    </div>
                </div>`;
        }
        return this.messages.map(m => `
            <div class="flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}">
                <div class="w-8 h-8 rounded-full flex shrink-0 center text-sm ${m.role === 'user' ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white' : 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 text-blue-400'}">
                    <i class="fa-solid ${m.role === 'user' ? 'fa-user' : (this.roles.find(r => r.id === this.currentRoleId)?.icon || 'fa-robot')}"></i>
                </div>
                <div class="flex-1 ${m.role === 'user' ? 'text-right' : ''}">
                    <div class="inline-block max-w-[85%] text-left">
                        <div class="text-[9px] text-dim mb-1 ${m.role === 'user' ? 'text-right' : ''}">${m.role === 'user' ? '我' : (this.roles.find(r => r.id === this.currentRoleId)?.name || 'AI')}</div>
                        <div class="p-3 rounded-lg ${m.role === 'user' ? 'bg-gradient-to-br from-green-600/30 to-emerald-600/30 border border-green-500/20' : 'bg-black/30 border border-white/10'} text-sm text-gray-200 leading-relaxed markdown-body">
                            ${typeof marked !== 'undefined' ? marked.parse(m.content) : m.content}
                        </div>
                        <div class="flex gap-2 mt-1 ${m.role === 'user' ? 'flex-row-reverse' : ''}">
                            <button class="text-[8px] text-dim hover:text-white" onclick="Utils.copy('${m.content.replace(/'/g, "\\'").replace(/\n/g, '\\n')}')">
                                <i class="fa-solid fa-copy"></i> 复制
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    },

    _renderResourcesPanel() {
        const tabs = [
            { id: 'projects', icon: 'fa-folder', label: '项目' },
            { id: 'outline', icon: 'fa-sitemap', label: '大纲' },
            { id: 'chapters', icon: 'fa-list', label: '细纲' },
            { id: 'content', icon: 'fa-file-lines', label: '正文' }
        ];

        return `
            <div class="flex flex-col h-full">
                <div class="p-4 border-b border-white/5 bg-[#0d0d0f]">
                    <div class="flex items-center gap-2 mb-1">
                        <i class="fa-solid fa-folder-open text-accent"></i>
                        <span class="font-bold text-white text-sm">资源管理库</span>
                    </div>
                    <span class="text-[10px] text-dim">项目 · 大纲 · 细纲 · 正文</span>
                </div>

                <div class="flex border-b border-white/5">
                    ${tabs.map(t => `
                        <button class="flex-1 py-2 text-[10px] font-bold transition-all ${this.currentTab === t.id ? 'text-white border-b-2 border-accent' : 'text-dim hover:text-white'}" onclick="Modules.web_chat.switchResourceTab('${t.id}')">
                            <i class="fa-solid ${t.icon} mr-1"></i>${t.label}
                        </button>
                    `).join('')}
                </div>

                <div class="flex-1 overflow-y-auto p-3" id="wc-resource-content">
                    ${this._renderResourceContent()}
                </div>
            </div>
        `;
    },

    _renderResourceContent() {
        switch (this.currentTab) {
            case 'projects':
                return this._renderProjectsTab();
            case 'outline':
                return this._renderOutlineTab();
            case 'chapters':
                return this._renderChaptersTab();
            case 'content':
                return this._renderContentTab();
            default:
                return this._renderProjectsTab();
        }
    },

    _renderProjectsTab() {
        return `
            <div class="space-y-3">
                <button class="btn w-full h-9 bg-amber-600/20 text-amber-400 border border-amber-600/30 text-xs" onclick="Modules.web_chat.createProject()">
                    <i class="fa-solid fa-plus mr-1"></i>创建项目
                </button>
                
                <button class="btn w-full h-8 bg-green-600/20 text-green-400 border border-green-600/30 text-xs" onclick="Modules.web_chat.importProject()">
                    <i class="fa-solid fa-file-import mr-1"></i>导入项目
                </button>
                
                <div class="text-[10px] text-dim font-bold uppercase tracking-wider mb-2">
                    <i class="fa-solid fa-folder mr-1"></i>项目列表
                </div>

                ${this.projects.length === 0 ? `
                    <div class="text-[10px] text-dim text-center py-4">
                        <i class="fa-solid fa-inbox text-2xl mb-2 opacity-30"></i>
                        <p>暂无项目</p>
                        <p class="mt-1">点击上方按钮创建第一个项目</p>
                    </div>
                ` : this.projects.map(p => `
                    <div class="p-3 rounded-lg mb-2 cursor-pointer transition-all ${this.currentProjectId === p.id ? 'bg-white/10 border border-white/10' : 'hover:bg-white/5 border border-transparent'}" onclick="Modules.web_chat.selectProject('${p.id}')">
                        <div class="flex items-center justify-between mb-1">
                            <span class="text-xs font-bold text-white truncate">
                                <i class="fa-solid fa-book mr-1 text-amber-400"></i>${p.name || '未命名项目'}
                            </span>
                            <div class="flex gap-1">
                                <button class="text-[10px] text-cyan-400 hover:text-cyan-300" onclick="event.stopPropagation();Modules.web_chat.syncToWriter('${p.id}')" title="同步到长篇执笔">
                                    <i class="fa-solid fa-sync"></i>
                                </button>
                                <button class="text-[10px] text-red-400 hover:text-red-300" onclick="event.stopPropagation();Modules.web_chat.deleteProject('${p.id}')">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="text-[9px] text-dim">
                            ${p.volumes?.length || 0} 卷 · ${p.totalChapters || 0} 章 · ${p.totalWords || 0} 字
                        </div>
                        <div class="text-[8px] text-dim mt-1">
                            ${new Date(p.updatedAt).toLocaleString('zh-CN', {month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    async importProject() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.txt';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                
                if (data.name && data.volumes) {
                    const id = Utils.uuid();
                    const now = Date.now();
                    
                    let totalChapters = 0;
                    let totalWords = 0;
                    data.volumes.forEach(v => {
                        totalChapters += (v.chapters || []).length;
                        (v.chapters || []).forEach(c => {
                            totalWords += (c.content || '').length;
                        });
                    });
                    
                    this.projects.unshift({
                        id,
                        name: data.name,
                        volumes: data.volumes || [],
                        totalChapters,
                        totalWords,
                        createdAt: now,
                        updatedAt: now
                    });
                    
                    await this._saveProjects();
                    this.refresh();
                    UI.toast('项目导入成功！');
                } else {
                    UI.toast('文件格式不正确', 'error');
                }
            } catch(err) {
                UI.toast('导入失败: ' + err.message, 'error');
            }
        };
        input.click();
    },

    async syncToWriter(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) return;
        
        let syncedChapters = 0;
        
        for (const vol of (project.volumes || [])) {
            const volData = {
                id: Utils.uuid(),
                title: vol.name || '未命名卷',
                order: (await DB.getAll('volumes') || []).length + 1
            };
            await DB.put('volumes', volData);
            
            for (const chap of (vol.chapters || [])) {
                await DB.put('chapters', {
                    id: Utils.uuid(),
                    title: chap.title || '未命名章节',
                    content: chap.content || '',
                    outline: chap.outline || '',
                    volumeId: volData.id,
                    order: syncedChapters + 1
                });
                syncedChapters++;
            }
        }
        
        UI.toast(`已同步 ${syncedChapters} 章到长篇执笔`);
    },

    _renderOutlineTab() {
        const project = this.projects.find(p => p.id === this.currentProjectId);
        if (!project) {
            return `
                <div class="text-center text-dim text-[10px] p-4">
                    <i class="fa-solid fa-book-open text-2xl mb-2 opacity-30"></i>
                    <p>请先选择或创建一个项目</p>
                </div>
            `;
        }

        return `
            <div class="space-y-3">
                <div class="flex gap-2">
                    <button class="btn flex-1 h-8 bg-green-600/20 text-green-400 border border-green-600/30 text-xs" onclick="Modules.web_chat.addVolume()">
                        <i class="fa-solid fa-plus mr-1"></i>添加卷
                    </button>
                    <button class="btn h-8 bg-white/5 text-dim text-xs" onclick="Modules.web_chat.editProjectOutline()">
                        <i class="fa-solid fa-edit"></i>
                    </button>
                </div>

                <div class="text-[10px] text-dim font-bold uppercase tracking-wider mb-2">
                    <i class="fa-solid fa-layer-group mr-1"></i>大纲结构
                </div>

                ${(project.volumes || []).length === 0 ? `
                    <div class="text-[10px] text-dim text-center py-4">
                        <i class="fa-solid fa-layer-group text-2xl mb-2 opacity-30"></i>
                        <p>暂无卷</p>
                    </div>
                ` : (project.volumes || []).map((v, vi) => `
                    <div class="mb-3">
                        <div class="flex items-center justify-between mb-1 p-2 rounded bg-white/5">
                            <span class="text-xs font-bold text-white">
                                <i class="fa-solid fa-book-bookmark mr-1 text-blue-400"></i>${v.name || `第${vi + 1}卷`}
                            </span>
                            <div class="flex gap-1">
                                <button class="text-[10px] text-dim hover:text-white" onclick="Modules.web_chat.addChapter(${vi})">
                                    <i class="fa-solid fa-plus"></i>
                                </button>
                                <button class="text-[10px] text-dim hover:text-white" onclick="Modules.web_chat.editVolume(${vi})">
                                    <i class="fa-solid fa-edit"></i>
                                </button>
                                <button class="text-[10px] text-red-400 hover:text-red-300" onclick="Modules.web_chat.deleteVolume(${vi})">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="pl-4 space-y-1">
                            ${(v.chapters || []).length === 0 ? `
                                <div class="text-[9px] text-dim py-2">暂无章节</div>
                            ` : (v.chapters || []).map((c, ci) => `
                                <div class="p-2 rounded bg-white/3 text-[10px] flex items-center justify-between">
                                    <span class="text-dim truncate">
                                        <i class="fa-solid fa-file-lines mr-1 text-green-400"></i>${c.title || `第${ci + 1}章`}
                                    </span>
                                    <div class="flex gap-1 shrink-0">
                                        <button class="text-dim hover:text-white" onclick="Modules.web_chat.editChapter(${vi}, ${ci})">
                                            <i class="fa-solid fa-edit"></i>
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    _renderChaptersTab() {
        const project = this.projects.find(p => p.id === this.currentProjectId);
        if (!project) {
            return `
                <div class="text-center text-dim text-[10px] p-4">
                    <i class="fa-solid fa-book-open text-2xl mb-2 opacity-30"></i>
                    <p>请先选择或创建一个项目</p>
                </div>
            `;
        }

        let allChapters = [];
        (project.volumes || []).forEach((v, vi) => {
            (v.chapters || []).forEach((c, ci) => {
                allChapters.push({ ...c, volumeIndex: vi, chapterIndex: ci, volumeName: v.name });
            });
        });

        return `
            <div class="space-y-3">
                <div class="text-[10px] text-dim font-bold uppercase tracking-wider mb-2">
                    <i class="fa-solid fa-list mr-1"></i>所有章节细纲
                </div>

                ${allChapters.length === 0 ? `
                    <div class="text-[10px] text-dim text-center py-4">
                        <i class="fa-solid fa-file-lines text-2xl mb-2 opacity-30"></i>
                        <p>暂无章节</p>
                    </div>
                ` : allChapters.map(c => `
                    <div class="p-3 rounded-lg mb-2 bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10" onclick="Modules.web_chat.editChapter(${c.volumeIndex}, ${c.chapterIndex})">
                        <div class="flex items-center justify-between mb-1">
                            <span class="text-xs font-bold text-white truncate">
                                ${c.title || '未命名章节'}
                            </span>
                            <span class="text-[8px] text-dim">
                                ${c.volumeName || `第${c.volumeIndex + 1}卷`}
                            </span>
                        </div>
                        <div class="text-[9px] text-dim line-clamp-2">
                            ${c.outline?.slice(0, 100) || '暂无细纲'}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    _renderContentTab() {
        const project = this.projects.find(p => p.id === this.currentProjectId);
        if (!project) {
            return `
                <div class="text-center text-dim text-[10px] p-4">
                    <i class="fa-solid fa-book-open text-2xl mb-2 opacity-30"></i>
                    <p>请先选择或创建一个项目</p>
                </div>
            `;
        }

        let allChapters = [];
        (project.volumes || []).forEach((v, vi) => {
            (v.chapters || []).forEach((c, ci) => {
                allChapters.push({ ...c, volumeIndex: vi, chapterIndex: ci, volumeName: v.name });
            });
        });

        return `
            <div class="space-y-3">
                <div class="flex items-center justify-between">
                    <div class="text-[10px] text-dim font-bold uppercase tracking-wider">
                        <i class="fa-solid fa-file-lines mr-1"></i>正文内容
                    </div>
                    <div class="flex gap-1">
                        <button class="btn btn-xs bg-cyan-600/20 text-cyan-400 border-cyan-600/30" onclick="Modules.web_chat.exportAllContent()">
                            <i class="fa-solid fa-download mr-1"></i>导出
                        </button>
                        <button class="btn btn-xs bg-purple-600/20 text-purple-400 border-purple-600/30" onclick="Modules.web_chat.aiAssist()">
                            <i class="fa-solid fa-wand-magic-sparkles mr-1"></i>AI
                        </button>
                    </div>
                </div>

                <div class="p-2 bg-white/5 rounded border border-white/5">
                    <div class="text-[9px] text-dim mb-1">统计</div>
                    <div class="grid grid-cols-3 gap-2 text-center">
                        <div>
                            <div class="text-sm font-bold text-white">${allChapters.length}</div>
                            <div class="text-[8px] text-dim">章节</div>
                        </div>
                        <div>
                            <div class="text-sm font-bold text-amber-400">${allChapters.reduce((sum, c) => sum + (c.content?.length || 0), 0).toLocaleString()}</div>
                            <div class="text-[8px] text-dim">总字</div>
                        </div>
                        <div>
                            <div class="text-sm font-bold text-green-400">${allChapters.filter(c => c.content && c.content.length > 100).length}</div>
                            <div class="text-[8px] text-dim">已写</div>
                        </div>
                    </div>
                </div>

                ${allChapters.length === 0 ? `
                    <div class="text-[10px] text-dim text-center py-4">
                        <i class="fa-solid fa-file-lines text-2xl mb-2 opacity-30"></i>
                        <p>暂无章节</p>
                    </div>
                ` : allChapters.map(c => `
                    <div class="p-3 rounded-lg mb-2 bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10" onclick="Modules.web_chat.editChapterContent(${c.volumeIndex}, ${c.chapterIndex})">
                        <div class="flex items-center justify-between mb-1">
                            <span class="text-xs font-bold text-white truncate">
                                <i class="fa-solid fa-file-pen mr-1 text-purple-400"></i>${c.title || '未命名章节'}
                            </span>
                            <span class="text-[8px] text-dim">
                                ${(c.content?.length || 0)} 字
                            </span>
                        </div>
                        <div class="text-[9px] text-dim line-clamp-2">
                            ${c.content?.slice(0, 100) || '暂无正文'}
                        </div>
                        <div class="flex items-center justify-between mt-1">
                            <span class="text-[8px] text-cyan-400">${c.volumeName || `第${c.volumeIndex + 1}卷`}</span>
                            <div class="flex gap-1">
                                <button class="text-[8px] text-amber-400 hover:text-amber-300" onclick="event.stopPropagation();Modules.web_chat._quickAIEdit(${c.volumeIndex}, ${c.chapterIndex}, 'polish')">
                                    <i class="fa-solid fa-gem"></i>
                                </button>
                                <button class="text-[8px] text-green-400 hover:text-green-300" onclick="event.stopPropagation();Modules.web_chat._quickAIEdit(${c.volumeIndex}, ${c.chapterIndex}, 'expand')">
                                    <i class="fa-solid fa-expand"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    async exportAllContent() {
        const project = this.projects.find(p => p.id === this.currentProjectId);
        if (!project) return;
        
        let content = `# ${project.name}\n\n`;
        
        (project.volumes || []).forEach((v, vi) => {
            content += `## 第${vi + 1}卷: ${v.name || '未命名'}\n\n`;
            (v.chapters || []).forEach((c, ci) => {
                content += `### 第${ci + 1}章: ${c.title || '未命名'}\n\n`;
                content += (c.content || '暂无内容') + '\n\n';
            });
        });
        
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.name}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        
        UI.toast('已导出');
    },

    async aiAssist() {
        const project = this.projects.find(p => p.id === this.currentProjectId);
        if (!project) return UI.toast('请先选择项目');
        
        const action = prompt('AI辅助功能:\n1. 润色全部正文\n2. 提取大纲\n3. 生成摘要\n4. 检查逻辑\n请输入数字(1-4):');
        
        if (!action) return;
        
        const input = document.getElementById('wc-input');
        if (!input) return;
        
        let prompt_text = '';
        let allContent = '';
        
        (project.volumes || []).forEach((v, vi) => {
            (v.chapters || []).forEach((c, ci) => {
                allContent += `【${c.title}】\n${(c.content || '').slice(0, 500)}\n\n`;
            });
        });
        
        switch(action) {
            case '1':
                prompt_text = `请润色以下小说正文，保持原意和风格，优化语言表达:\n\n${allContent.slice(0, 4000)}`;
                break;
            case '2':
                prompt_text = `请为以下小说内容提取大纲，按章节列出主要情节:\n\n${allContent.slice(0, 4000)}`;
                break;
            case '3':
                prompt_text = `请为以下小说内容生成摘要，包括核心情节、主要人物、主题思想:\n\n${allContent.slice(0, 4000)}`;
                break;
            case '4':
                prompt_text = `请检查以下小说内容的逻辑问题，包括人物一致性、时间线、情节连贯性:\n\n${allContent.slice(0, 4000)}`;
                break;
            default:
                return UI.toast('无效选项');
        }
        
        input.value = prompt_text;
        this.sendMessage();
    },

    async _quickAIEdit(vi, ci, action) {
        const project = this.projects.find(p => p.id === this.currentProjectId);
        if (!project || !project.volumes?.[vi]?.chapters?.[ci]) return;
        
        const chapter = project.volumes[vi].chapters[ci];
        const content = chapter.content || '';
        
        if (!content.trim()) {
            UI.toast('章节内容为空', 'error');
            return;
        }
        
        const input = document.getElementById('wc-input');
        if (!input) return;
        
        const prompts = {
            polish: `请润色以下章节内容，保持原意和风格，优化语言表达和节奏:\n\n【${chapter.title}】\n${content.slice(0, 3000)}`,
            expand: `请扩写以下章节内容，增加细节描写和情感深度:\n\n【${chapter.title}】\n${content.slice(0, 2000)}`
        };
        
        input.value = prompts[action] || prompts.polish;
        this.sendMessage();
    },

    switchResourceTab(tabId) {
        this.currentTab = tabId;
        this.refresh();
    },

    async createProject() {
        const name = prompt('请输入项目名称：');
        if (!name) return;

        const id = Utils.uuid();
        const now = Date.now();
        this.projects.unshift({
            id,
            name,
            volumes: [],
            totalChapters: 0,
            createdAt: now,
            updatedAt: now
        });
        this.currentProjectId = id;

        await this._saveProjects();
        this.refresh();
        UI.toast('项目创建成功！');
    },

    async selectProject(id) {
        this.currentProjectId = id;
        this.refresh();
    },

    async deleteProject(id) {
        if (!confirm('确定删除此项目？')) return;
        this.projects = this.projects.filter(p => p.id !== id);
        if (this.currentProjectId === id) {
            this.currentProjectId = this.projects[0]?.id || null;
        }
        await this._saveProjects();
        this.refresh();
        UI.toast('项目已删除');
    },

    async addVolume() {
        const name = prompt('请输入卷名称：', `第${(this.projects.find(p => p.id === this.currentProjectId)?.volumes?.length || 0) + 1}卷`);
        if (name === null) return;

        const project = this.projects.find(p => p.id === this.currentProjectId);
        if (!project) return;

        if (!project.volumes) project.volumes = [];
        project.volumes.push({
            name: name || `第${project.volumes.length + 1}卷`,
            chapters: [],
            description: ''
        });
        project.updatedAt = Date.now();

        await this._saveProjects();
        this.refresh();
    },

    async editVolume(vi) {
        const project = this.projects.find(p => p.id === this.currentProjectId);
        if (!project || !project.volumes[vi]) return;

        const name = prompt('请输入卷名称：', project.volumes[vi].name);
        if (name === null) return;

        project.volumes[vi].name = name || project.volumes[vi].name;
        project.updatedAt = Date.now();

        await this._saveProjects();
        this.refresh();
    },

    async deleteVolume(vi) {
        if (!confirm('确定删除此卷？')) return;

        const project = this.projects.find(p => p.id === this.currentProjectId);
        if (!project || !project.volumes) return;

        project.volumes.splice(vi, 1);
        project.totalChapters = project.volumes.reduce((sum, v) => sum + (v.chapters?.length || 0), 0);
        project.updatedAt = Date.now();

        await this._saveProjects();
        this.refresh();
    },

    async addChapter(vi) {
        const title = prompt('请输入章节名称：', `第${(this.projects.find(p => p.id === this.currentProjectId)?.volumes?.[vi]?.chapters?.length || 0) + 1}章`);
        if (title === null) return;

        const project = this.projects.find(p => p.id === this.currentProjectId);
        if (!project || !project.volumes[vi]) return;

        if (!project.volumes[vi].chapters) project.volumes[vi].chapters = [];
        project.volumes[vi].chapters.push({
            title: title || `第${project.volumes[vi].chapters.length + 1}章`,
            outline: '',
            content: ''
        });
        project.totalChapters = (project.totalChapters || 0) + 1;
        project.updatedAt = Date.now();

        await this._saveProjects();
        this.refresh();
    },

    async editChapter(vi, ci) {
        const project = this.projects.find(p => p.id === this.currentProjectId);
        if (!project || !project.volumes[vi]?.chapters?.[ci]) return;

        const chapter = project.volumes[vi].chapters[ci];
        const title = prompt('请输入章节名称：', chapter.title);
        if (title !== null) chapter.title = title || chapter.title;

        const outline = prompt('请输入章节细纲：', chapter.outline || '');
        if (outline !== null) chapter.outline = outline;

        project.updatedAt = Date.now();
        await this._saveProjects();
        this.refresh();
    },

    async editChapterContent(vi, ci) {
        const project = this.projects.find(p => p.id === this.currentProjectId);
        if (!project || !project.volumes[vi]?.chapters?.[ci]) return;

        const chapter = project.volumes[vi].chapters[ci];
        const content = prompt('请输入/编辑正文：', chapter.content || '');
        if (content !== null) chapter.content = content;

        project.updatedAt = Date.now();
        await this._saveProjects();
        this.refresh();
    },

    async _saveProjects() {
        await DB.put('settings', { id: 'web_chat_projects', projects: this.projects });
    },

    async _loadProjects() {
        try {
            const saved = await DB.get('settings', 'web_chat_projects');
            if (saved && saved.projects) {
                this.projects = saved.projects;
            }
        } catch(e) {}
    },

    async init() {
        await this._loadSessions();
        await this._loadProjects();
    },

    async _loadSessions() {
        try {
            const saved = await DB.get('settings', 'web_chat_sessions');
            if (saved && saved.sessions) {
                this.sessions = saved.sessions;
                if (this.sessions.length > 0 && !this.currentSessionId) {
                    this.currentSessionId = this.sessions[0].id;
                    await this._loadSessionMessages(this.currentSessionId);
                }
            }
        } catch(e) {}
        this.refresh();
    },

    async _loadSessionMessages(sessionId) {
        try {
            const saved = await DB.get('settings', `web_chat_messages_${sessionId}`);
            if (saved && saved.messages) {
                this.messages = saved.messages;
            } else {
                this.messages = [];
            }
        } catch(e) {
            this.messages = [];
        }
    },

    async _saveSessions() {
        await DB.put('settings', { id: 'web_chat_sessions', sessions: this.sessions });
    },

    async _saveMessages() {
        if (!this.currentSessionId) return;
        await DB.put('settings', { id: `web_chat_messages_${this.currentSessionId}`, messages: this.messages });
    },

    refresh() {
        const view = document.getElementById('module-view-web_chat');
        if (view) view.innerHTML = this.render();
    },

    async newSession() {
        const id = Utils.uuid();
        const now = Date.now();
        this.sessions.unshift({
            id,
            title: '新对话',
            preview: '',
            createdAt: now,
            updatedAt: now
        });
        this.currentSessionId = id;
        this.messages = [];
        await this._saveSessions();
        this.refresh();
    },

    async selectSession(id) {
        this.currentSessionId = id;
        await this._loadSessionMessages(id);
        this.refresh();
    },

    async deleteSession(id) {
        if (!confirm('确定删除此会话？')) return;
        this.sessions = this.sessions.filter(s => s.id !== id);
        await DB.del('settings', `web_chat_messages_${id}`);
        if (this.currentSessionId === id) {
            if (this.sessions.length > 0) {
                this.currentSessionId = this.sessions[0].id;
                await this._loadSessionMessages(this.currentSessionId);
            } else {
                this.currentSessionId = null;
                this.messages = [];
            }
        }
        await this._saveSessions();
        this.refresh();
    },

    switchRole(roleId) {
        this.currentRoleId = roleId;
        this.refresh();
    },

    toggleRAG(enabled) {
        this._ragEnabled = enabled;
    },

    quickAction(action) {
        const input = document.getElementById('wc-input');
        if (!input) return;
        const prompts = {
            '续写': '请帮我续写以下内容：\n\n',
            '润色': '请帮我润色以下内容，让文笔更流畅优美：\n\n',
            '扩写': '请帮我扩写以下内容，增加细节和描写：\n\n',
            '翻译': '请将以下内容翻译成中文：\n\n'
        };
        input.value = prompts[action] || '';
        input.focus();
    },

    _renderAssistantModeButtons() {
        return this.assistantModes.map(m => {
            const isActive = this.currentAssistantMode === m.id;
            return `<button class="px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border ${isActive ? 'bg-accent/15 text-accent border-accent/40' : 'bg-white/5 text-dim border-transparent hover:bg-white/10 hover:text-white hover:border-white/10'}" onclick="Modules.web_chat.switchAssistantMode('${m.id}')" title="${m.name}">
                <i class="fa-solid ${m.icon} mr-1"></i>${m.name}
            </button>`;
        }).join('');
    },

    switchAssistantMode(modeId) {
        this.currentAssistantMode = modeId;
        this.refresh();
        const mode = this.assistantModes.find(m => m.id === modeId);
        if (mode) UI.toast(`创作助手模式：${mode.name}`);
    },

    async _invokeTool(command, args) {
        const argStr = args.join(' ');
        switch(command) {
            case 'continue': {
                const style = argStr || '';
                if (Modules.writer?.aiWrite) {
                    await Modules.writer.aiWrite(style);
                } else {
                    this.quickAction('续写');
                }
                break;
            }
            case 'diagnose': {
                const lastMsg = this.messages.filter(m => m.role === 'assistant').pop();
                if (lastMsg) {
                    const input = document.getElementById('wc-input');
                    if (input) input.value = `请诊断以下文本的问题：\n\n${lastMsg.content.slice(0, 500)}`;
                    this.switchAssistantMode('diagnose');
                    this.sendMessage();
                } else {
                    UI.toast('暂无AI消息可诊断', 'error');
                }
                break;
            }
            case 'mutate': {
                const type = argStr || '风格改写';
                const input = document.getElementById('wc-input');
                const lastMsg = this.messages.filter(m => m.role === 'assistant').pop();
                if (input) {
                    input.value = `请以"${type}"方式变异以下文本：\n\n${lastMsg?.content?.slice(0, 800) || ''}`;
                }
                this.switchAssistantMode('mutate');
                this.sendMessage();
                break;
            }
            case 'deconstruct': {
                const input = document.getElementById('wc-input');
                const lastMsg = this.messages.filter(m => m.role === 'assistant').pop();
                if (input) {
                    input.value = `请拆解以下文本的写作技法：\n\n${lastMsg?.content?.slice(0, 800) || ''}`;
                }
                this.switchAssistantMode('deconstruct');
                this.sendMessage();
                break;
            }
            case 'workflow': {
                const name = argStr;
                if (!name) {
                    UI.toast('请指定工作流名称，例如 /workflow 黄金三章', 'error');
                    return;
                }
                if (Modules.tools_center?.runWorkflow) {
                    await Modules.tools_center.runWorkflow(name);
                } else {
                    UI.toast('工具中心未加载', 'error');
                }
                break;
            }
            case 'agent': {
                const name = argStr;
                if (!name) {
                    UI.toast('请指定Agent名称，例如 /agent 情节大师', 'error');
                    return;
                }
                if (Modules.tools_center?.chatWithAgent) {
                    await Modules.tools_center.chatWithAgent(name);
                } else {
                    UI.toast('工具中心未加载', 'error');
                }
                break;
            }
            default:
                UI.toast(`未知命令: /${command}`, 'error');
        }
    },

    async sendMessage() {
        if (this._generating) return;
        const input = document.getElementById('wc-input');
        const content = (input?.value || '').trim();
        if (!content) return;

        // Tool invocation routing
        if (content.startsWith('/')) {
            const parts = content.slice(1).split(' ');
            const command = parts[0];
            const args = parts.slice(1);
            if (input) input.value = '';
            await this._invokeTool(command, args);
            return;
        }

        if (!this.currentSessionId) {
            await this.newSession();
        }

        this._generating = true;
        const sendBtn = document.getElementById('wc-send-btn');
        if (sendBtn) sendBtn.disabled = true;

        this.messages.push({
            role: 'user',
            content,
            timestamp: Date.now()
        });

        if (input) input.value = '';
        this.refresh();

        let systemPrompt = '';
        if (this.currentRoleId === 'custom') {
            systemPrompt = this.customRole.prompt || '你是一个有帮助的AI助手。';
        } else {
            systemPrompt = this.rolePrompts[this.currentRoleId] || this.rolePrompts.assistant;
        }

        // NEXUS OS State Awareness
        let nexusContext = '';
        try {
            if (Modules.world_engine?.buildNexusSnapshot) {
                const snapshot = await Modules.world_engine.buildNexusSnapshot();
                const cycleCtx = typeof RAGSystem !== 'undefined' && typeof RAGSystem.getCycleContextForChapter === 'function'
                    ? await RAGSystem.getCycleContextForChapter()
                    : '';
                nexusContext = `【NEXUS OS 当前状态】\n[CHR] ${snapshot?.CHR || 'N/A'}\n[WLD] ${snapshot?.WLD || 'N/A'}\n[FOE] ${snapshot?.FOE || 'N/A'}\n[EMO] ${snapshot?.EMO || 'N/A'}\n[循环技法] ${cycleCtx || 'N/A'}\n`;
            }
        } catch(e) {}

        // Creative assistant mode prompt injection
        const mode = this.assistantModes.find(m => m.id === this.currentAssistantMode);
        if (mode && mode.prompt) {
            systemPrompt = mode.prompt + '\n\n' + systemPrompt;
        }

        let ragContext = '';
        if (this._ragEnabled) {
            ragContext = await this._buildRAGContext(content);
        }

        const projectContext = await this._getProjectContext();

        const fullPrompt = `${systemPrompt}\n\n${nexusContext}\n${projectContext}\n\n${ragContext}\n\n用户：${content}`;

        let aiResponse = '';
        try {
            await AI.generate(fullPrompt, {}, c => {
                aiResponse += c;
                this._updateLastMessage(aiResponse);
            });
        } catch(e) {
            aiResponse = '抱歉，生成失败：' + e.message;
        }

        this.messages.push({
            role: 'assistant',
            content: aiResponse,
            timestamp: Date.now()
        });

        const session = this.sessions.find(s => s.id === this.currentSessionId);
        if (session) {
            session.preview = aiResponse.slice(0, 100).replace(/\n/g, ' ');
            session.updatedAt = Date.now();
            if (!session.title || session.title === '新对话') {
                session.title = content.slice(0, 30).replace(/\n/g, ' ');
            }
        }

        this._generating = false;
        if (sendBtn) sendBtn.disabled = false;

        await this._saveSessions();
        await this._saveMessages();
        this.refresh();
    },

    async _buildRAGContext(query) {
        let context = '';
        
        try {
            const entities = await DB.getAll('entities') || [];
            const normalEntities = entities.filter(e => !e.id.startsWith('world_'));
            const worldEntities = entities.filter(e => e.id.startsWith('world_'));
            
            this._ragData = {
                entities: normalEntities,
                world: worldEntities
            };
            
            const queryLower = query.toLowerCase();
            const relevantEntities = normalEntities.filter(e => {
                const nameLower = (e.name || '').toLowerCase();
                const descLower = (e.desc || '').toLowerCase();
                return nameLower.includes(queryLower) || descLower.includes(queryLower) ||
                       queryLower.includes(nameLower) || queryLower.includes(descLower.slice(0, 50));
            }).slice(0, 5);
            
            if (relevantEntities.length > 0) {
                context += '\n【RAG 相关实体】\n';
                relevantEntities.forEach(e => {
                    context += `• ${e.type || '其他'}·${e.name}: ${(e.desc || '').slice(0, 100)}`;
                    if (e.relations && e.relations.length > 0) {
                        context += ` | 关联: ${e.relations.slice(0, 3).join(', ')}`;
                    }
                    context += '\n';
                });
            }
            
            const relevantWorld = worldEntities.filter(e => {
                const descLower = (e.desc || '').toLowerCase();
                return descLower.includes(queryLower.slice(0, 20)) || queryLower.includes(descLower.slice(0, 30));
            }).slice(0, 3);
            
            if (relevantWorld.length > 0) {
                const catLabels = {
                    history: '历史与传说', geography: '地理与地貌', magic: '魔法/科技体系',
                    factions: '势力与组织', species: '种族与生物', rules: '世界规则', culture: '文化与习俗'
                };
                context += '\n【RAG 世界观参考】\n';
                relevantWorld.forEach(w => {
                    const cat = (w.id || '').replace('world_', '');
                    context += `${catLabels[cat] || w.name}: ${(w.desc || '').slice(0, 150)}\n`;
                });
            }
            
            if (Modules.fusion_book) {
                const FB = Modules.fusion_book;
                const fusion = FB._allPipelineResults?.fusion || FB._pipelineResults?.fusion || '';
                if (fusion) {
                    const fusionKeywords = ['技法', '套路', '钩子', '节奏', '爽点', '悬念', '模板'];
                    const hasRelevant = fusionKeywords.some(k => query.includes(k));
                    if (hasRelevant || query.length > 50) {
                        context += '\n【RAG 融合技法参考】\n' + fusion.slice(0, 1000) + '\n';
                    }
                }
            }
            
            if (Modules.writer) {
                const chapters = await DB.getAll('chapters') || [];
                const relevantChapters = chapters.filter(c => {
                    const titleLower = (c.title || '').toLowerCase();
                    const outlineLower = (c.outline || '').toLowerCase();
                    return titleLower.includes(queryLower) || outlineLower.includes(queryLower) ||
                           queryLower.includes(titleLower);
                }).slice(0, 3);
                
                if (relevantChapters.length > 0) {
                    context += '\n【RAG 相关章节】\n';
                    relevantChapters.forEach(c => {
                        context += `${c.title}: ${(c.outline || '').slice(0, 100)}\n`;
                    });
                }
            }

            // Cycle context
            const cycles = await DB.getAll('cycles') || [];
            if (cycles.length > 0) {
                const relevantCycles = cycles.filter(c => {
                    const essence = (c.fusionEssence || '').toLowerCase();
                    return essence.includes(queryLower) || queryLower.includes((c.startChapter || '').toLowerCase());
                }).slice(0, 2);

                if (relevantCycles.length > 0) {
                    context += '\n【RAG 循环技法上下文】\n';
                    relevantCycles.forEach(c => {
                        context += `循环(${c.startChapter}-${c.endChapter}): ${(c.fusionEssence || '').slice(0, 200)}\n`;
                        context += `  状态: CHR=${c.nexusCHR || '-'}, WLD=${c.nexusWLD || '-'}, FOE=${c.nexusFOE || '-'}, EMO=${c.nexusEMO || '-'}\n`;
                    });
                }

                if (typeof RAGSystem !== 'undefined' && typeof RAGSystem.searchCycles === 'function') {
                    const cycleSearch = await RAGSystem.searchCycles(query, 2);
                    if (cycleSearch?.length) {
                        context += '\n【RAG 循环融合结果】\n';
                        cycleSearch.forEach(r => {
                            context += `- ${(r.essence || r.fusionEssence || '').slice(0, 200)}\n`;
                        });
                    }
                }
            }
        } catch(e) {}
        
        return context;
    },

    async _getProjectContext() {
        const project = this.projects.find(p => p.id === this.currentProjectId);
        if (!project) return '';
        
        let context = '\n【当前项目上下文】\n';
        context += `项目名称: ${project.name}\n`;
        
        const volumes = project.volumes || [];
        if (volumes.length > 0) {
            context += `共 ${volumes.length} 卷:\n`;
            volumes.slice(0, 5).forEach((v, i) => {
                context += `  第${i + 1}卷: ${v.name || '未命名'} (${(v.chapters || []).length}章)\n`;
            });
            if (volumes.length > 5) {
                context += `  ... 还有 ${volumes.length - 5} 卷\n`;
            }
        }
        
        return context;
    },

    _updateLastMessage(content) {
        const container = document.getElementById('wc-messages');
        if (!container) return;
        const lastMsg = container.lastElementChild;
        if (lastMsg) {
            const aiContent = lastMsg.querySelector('.markdown-body');
            if (aiContent) {
                aiContent.innerHTML = typeof marked !== 'undefined' ? marked.parse(content) : content;
            }
        }
        container.scrollTop = container.scrollHeight;
    },

    async exportAllSessions() {
        if (this.sessions.length === 0) return UI.toast('暂无会话可导出');
        let md = '# 网页对话导出\n\n';
        for (const session of this.sessions) {
            md += `## ${session.title || '新对话'}\n`;
            md += `时间: ${new Date(session.updatedAt).toLocaleString('zh-CN')}\n\n`;
            await this._loadSessionMessages(session.id);
            for (const msg of this.messages) {
                md += `### ${msg.role === 'user' ? '我' : 'AI'}\n`;
                md += msg.content + '\n\n';
            }
            md += '---\n\n';
        }
        Utils.copy(md);
        UI.toast('已复制到剪贴板');
    },

    _renderEditorModal() {
        if (!this._editingChapter) return '';
        const { volumeIndex, chapterIndex, type } = this._editingChapter;
        const project = this.projects.find(p => p.id === this.currentProjectId);
        const chapter = project?.volumes?.[volumeIndex]?.chapters?.[chapterIndex];
        
        if (!chapter) return '';

        return `
        <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50" id="wc-editor-modal" onclick="if(event.target.id==='wc-editor-modal')Modules.web_chat.closeEditorModal()">
            <div class="bg-[#111113] rounded-xl border border-white/10 w-full max-w-4xl max-h-[90vh] flex flex-col m-4">
                <div class="flex items-center justify-between p-4 border-b border-white/10">
                    <div class="flex items-center gap-2">
                        <i class="fa-solid ${type === 'outline' ? 'fa-list' : 'fa-file-lines'} text-accent"></i>
                        <span class="font-bold text-white">
                            ${type === 'outline' ? '编辑章节细纲' : '编辑正文内容'} - ${chapter.title}
                        </span>
                    </div>
                    <button class="btn btn-xs bg-white/5 text-dim" onclick="Modules.web_chat.closeEditorModal()">
                        <i class="fa-solid fa-times"></i>
                    </button>
                </div>
                <div class="flex-1 overflow-y-auto p-4">
                    ${type === 'outline' ? `
                        <div class="space-y-3">
                            <div>
                                <label class="text-xs text-dim mb-1 block">章节标题</label>
                                <input type="text" id="wc-edit-title" value="${chapter.title}" class="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm text-gray-200 focus:border-accent/30">
                            </div>
                            <div>
                                <label class="text-xs text-dim mb-1 block">章节细纲</label>
                                <textarea id="wc-edit-outline" class="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-sm text-gray-200 resize-none h-64 focus:border-accent/30">${chapter.outline || ''}</textarea>
                            </div>
                        </div>
                    ` : `
                        <div class="space-y-3">
                            <div>
                                <label class="text-xs text-dim mb-1 block">章节正文</label>
                                <textarea id="wc-edit-content" class="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-sm text-gray-200 resize-none h-96 focus:border-accent/30">${chapter.content || ''}</textarea>
                            </div>
                        </div>
                    `}
                </div>
                <div class="flex items-center justify-end gap-2 p-4 border-t border-white/10">
                    <button class="btn h-9 bg-white/5 text-dim" onclick="Modules.web_chat.closeEditorModal()">取消</button>
                    <button class="btn h-9 btn-primary" onclick="Modules.web_chat.saveEditorContent()">
                        <i class="fa-solid fa-save mr-1"></i>保存
                    </button>
                </div>
            </div>
        </div>`;
    },

    async editChapter(vi, ci) {
        this._editingChapter = { volumeIndex: vi, chapterIndex: ci, type: 'outline' };
        this.refresh();
    },

    async editChapterContent(vi, ci) {
        this._editingChapter = { volumeIndex: vi, chapterIndex: ci, type: 'content' };
        this.refresh();
    },

    closeEditorModal() {
        this._editingChapter = null;
        this.refresh();
    },

    async saveEditorContent() {
        if (!this._editingChapter) return;
        const { volumeIndex, chapterIndex, type } = this._editingChapter;
        const project = this.projects.find(p => p.id === this.currentProjectId);
        if (!project || !project.volumes[volumeIndex]?.chapters?.[chapterIndex]) return;
        
        const chapter = project.volumes[volumeIndex].chapters[chapterIndex];
        
        if (type === 'outline') {
            const titleEl = document.getElementById('wc-edit-title');
            const outlineEl = document.getElementById('wc-edit-outline');
            if (titleEl) chapter.title = titleEl.value;
            if (outlineEl) chapter.outline = outlineEl.value;
        } else {
            const contentEl = document.getElementById('wc-edit-content');
            if (contentEl) chapter.content = contentEl.value;
        }
        
        project.updatedAt = Date.now();
        await this._saveProjects();
        this.closeEditorModal();
        UI.toast('保存成功！');
    },

    async editProjectOutline() {
        const project = this.projects.find(p => p.id === this.currentProjectId);
        if (!project) return;
        
        const name = prompt('编辑项目名称：', project.name);
        if (name === null) return;
        
        project.name = name || project.name;
        project.updatedAt = Date.now();
        
        await this._saveProjects();
        this.refresh();
    },

    // ═══════════════════════════════════════════════════════════════
    // 大纲理解与关联分析系统 - 强化对话系统的理解能力
    // ═══════════════════════════════════════════════════════════════
    async analyzeOutline() {
        const WC = Modules.web_chat;
        const project = WC.projects.find(p => p.id === WC.currentProjectId);
        
        if(!project) {
            UI.toast('请先选择一个项目');
            return;
        }
        
        let outlineContent = '';
        (project.volumes || []).forEach((v, vi) => {
            outlineContent += `## 第${vi + 1}卷: ${v.name || '未命名'}\n`;
            (v.chapters || []).forEach((c, ci) => {
                outlineContent += `### 第${ci + 1}章: ${c.title || '未命名'}\n`;
                if(c.outline) outlineContent += `${c.outline}\n\n`;
            });
        });
        
        if(!outlineContent) {
            UI.toast('项目暂无大纲内容');
            return;
        }
        
        const prompt = `你是一个专业的小说大纲分析师。请分析以下小说大纲，并提供深入的理解和建议：

【大纲内容】
${outlineContent.slice(0, 6000)}

请从以下维度分析：
1. 【整体结构】故事的主线和支线分布是否合理
2. 【节奏设计】情节发展的节奏是否张弛有度
3. 【人物弧光】主要角色的成长轨迹是否清晰
4. 【悬念布局】伏笔和钩子的设置是否有效
5. 【逻辑连贯】各章节之间的衔接是否自然
6. 【改进建议】针对发现的问题提出具体修改建议

请用清晰的格式输出分析结果。`;

        const input = document.getElementById('wc-input');
        if(input) input.value = prompt;
        
        WC.sendMessage();
    },

    async analyzeRelations() {
        const WC = Modules.web_chat;
        
        let contextData = '';
        
        if(Modules.world_engine) {
            await Modules.world_engine._ensureCache();
            const entities = Modules.world_engine._cachedEntities || [];
            const worldEntities = entities.filter(e => !e.id.startsWith('world_'));
            
            if(worldEntities.length > 0) {
                contextData += '【世界引擎实体】\n';
                worldEntities.slice(0, 20).forEach(e => {
                    contextData += `- ${e.type}·${e.name}: ${(e.desc || '').slice(0, 100)}`;
                    if(e.relations && e.relations.length) {
                        contextData += ` | 关联: ${e.relations.slice(0, 3).join(', ')}`;
                    }
                    contextData += '\n';
                });
            }
        }
        
        if(Modules.fusion_book) {
            const FB = Modules.fusion_book;
            const fusion = FB._allPipelineResults?.fusion || FB._pipelineResults?.fusion || '';
            if(fusion) {
                contextData += '\n【融合技法精华】\n' + fusion.slice(0, 1500) + '\n';
            }
        }
        
        const project = WC.projects.find(p => p.id === WC.currentProjectId);
        if(project) {
            contextData += '\n【当前项目大纲】\n';
            (project.volumes || []).slice(0, 3).forEach((v, vi) => {
                contextData += `第${vi + 1}卷: ${v.name || '未命名'}\n`;
                (v.chapters || []).slice(0, 5).forEach((c, ci) => {
                    contextData += `  - 第${ci + 1}章: ${c.title || '未命名'}\n`;
                });
            });
        }
        
        if(!contextData) {
            UI.toast('暂无可分析的数据，请先创建实体或大纲');
            return;
        }
        
        const prompt = `你是一个专业的小说关联分析师。请分析以下数据中的关联关系，并发现潜在的连接点：

${contextData}

请分析：
1. 【实体关联网络】各实体之间的关系网络图
2. 【情节与实体映射】大纲中的情节涉及哪些实体
3. 【潜在冲突点】实体之间可能产生的冲突
4. 【遗漏关联】应该建立但尚未建立的关系
5. 【优化建议】如何强化关联网络

请用清晰的格式输出分析结果。`;

        const input = document.getElementById('wc-input');
        if(input) input.value = prompt;
        
        WC.sendMessage();
    },

    async summarizeContent() {
        const WC = Modules.web_chat;
        const input = document.getElementById('wc-input');
        const content = input?.value || '';
        
        if(!content.trim()) {
            UI.toast('请先输入需要总结的内容');
            return;
        }
        
        const prompt = `请对以下内容进行精炼总结：

【原始内容】
${content.slice(0, 4000)}

【总结要求】
1. 提取核心要点（3-5条）
2. 概括主要内容（100字以内）
3. 标注关键信息（人物、地点、事件）
4. 给出内容评级（A/B/C/D）

请用清晰的格式输出总结结果。`;

        if(input) input.value = prompt;
        WC.sendMessage();
    },

    async diagnoseContent() {
        const WC = Modules.web_chat;
        const input = document.getElementById('wc-input');
        const content = input?.value || '';
        
        if(!content.trim()) {
            UI.toast('请先输入需要诊断的内容');
            return;
        }
        
        const prompt = `你是一个专业的文学诊断师。请对以下内容进行全面诊断：

【待诊断内容】
${content.slice(0, 4000)}

【诊断维度】
1. 【文风分析】语言风格、叙事特点
2. 【结构问题】段落、章节结构是否合理
3. 【逻辑漏洞】是否存在逻辑矛盾
4. 【表达问题】冗余、重复、不通顺之处
5. 【读者体验】可读性、吸引力评估
6. 【修改建议】具体的改进方案

请用清晰的格式输出诊断报告。`;

        if(input) input.value = prompt;
        WC.sendMessage();
    },

    // ═══ 自定义提示词SOLO模式 ═══
    _soloPromptModal: null,
    _customSoloPrompts: {},

    openSoloPromptModal() {
        const WC = Modules.web_chat;
        let modal = document.getElementById('wc-solo-prompt-modal');
        if(modal) { modal.remove(); return; }
        
        modal = document.createElement('div');
        modal.id = 'wc-solo-prompt-modal';
        modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm';
        modal.onclick = (e) => { if(e.target === modal) modal.remove(); };
        
        const savedPrompts = WC._customSoloPrompts || {};
        const promptList = Object.entries(savedPrompts).map(([k, v]) => `
            <div class="flex items-center gap-2 p-2 rounded bg-white/5 border border-white/5">
                <span class="flex-1 text-xs text-white truncate">${k}</span>
                <button class="text-[10px] text-cyan-400 hover:text-cyan-300" onclick="Modules.web_chat._useSoloPrompt('${k}')">使用</button>
                <button class="text-[10px] text-red-400 hover:text-red-300" onclick="Modules.web_chat._deleteSoloPrompt('${k}')">删除</button>
            </div>
        `).join('') || '<div class="text-xs text-dim text-center py-2">暂无保存的提示词</div>';
        
        modal.innerHTML = `
            <div class="bg-[#1a1a2e] rounded-2xl border border-white/10 w-[600px] max-h-[80vh] flex flex-col shadow-2xl">
                <div class="flex items-center justify-between px-5 py-3 border-b border-white/5">
                    <span class="font-bold text-white"><i class="fa-solid fa-magic mr-2 text-purple-400"></i>自定义提示词 SOLO</span>
                    <button class="text-dim hover:text-white" onclick="this.closest('#wc-solo-prompt-modal').remove()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="flex-1 overflow-y-auto p-4 space-y-4">
                    <div>
                        <div class="text-[10px] text-dim font-bold uppercase mb-2">提示词名称</div>
                        <input id="wc-solo-name" class="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm text-white" placeholder="例如：角色分析、情节推演...">
                    </div>
                    <div>
                        <div class="text-[10px] text-dim font-bold uppercase mb-2">提示词内容</div>
                        <textarea id="wc-solo-content" class="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-sm text-gray-300 resize-none h-40" placeholder="输入自定义提示词，使用 {{content}} 作为内容占位符...

例如：
请分析以下内容的角色塑造：
{{content}}

分析维度：
1. 性格特点
2. 行为动机
3. 成长弧线"></textarea>
                    </div>
                    <div class="border-t border-white/5 pt-3">
                        <div class="text-[10px] text-dim font-bold uppercase mb-2">已保存的提示词</div>
                        <div class="space-y-1 max-h-40 overflow-y-auto">${promptList}</div>
                    </div>
                </div>
                <div class="px-5 py-3 border-t border-white/5 flex gap-2">
                    <button class="btn btn-sm bg-purple-600/20 text-purple-400 border-purple-600/30 flex-1" onclick="Modules.web_chat._saveSoloPrompt()">
                        <i class="fa-solid fa-save mr-1"></i>保存提示词
                    </button>
                    <button class="btn btn-sm bg-green-600/20 text-green-400 border-green-600/30 flex-1" onclick="Modules.web_chat._runSoloPrompt()">
                        <i class="fa-solid fa-play mr-1"></i>立即执行
                    </button>
                </div>
            </div>`;
        
        document.body.appendChild(modal);
    },

    async _saveSoloPrompt() {
        const WC = Modules.web_chat;
        const nameEl = document.getElementById('wc-solo-name');
        const contentEl = document.getElementById('wc-solo-content');
        
        const name = nameEl?.value?.trim();
        const content = contentEl?.value?.trim();
        
        if(!name || !content) {
            UI.toast('请填写名称和内容');
            return;
        }
        
        WC._customSoloPrompts = WC._customSoloPrompts || {};
        WC._customSoloPrompts[name] = content;
        
        await DB.put('settings', { id: 'custom_solo_prompts', prompts: WC._customSoloPrompts });
        
        UI.toast('提示词已保存');
        WC.openSoloPromptModal();
    },

    async _loadSoloPrompts() {
        const WC = Modules.web_chat;
        try {
            const saved = await DB.get('settings', 'custom_solo_prompts');
            if(saved && saved.prompts) {
                WC._customSoloPrompts = saved.prompts;
            }
        } catch(e) {}
    },

    _useSoloPrompt(name) {
        const WC = Modules.web_chat;
        const prompt = WC._customSoloPrompts?.[name];
        if(!prompt) return;
        
        const input = document.getElementById('wc-input');
        const content = input?.value || '';
        
        const finalPrompt = prompt.replace(/\{\{content\}\}/gi, content);
        if(input) input.value = finalPrompt;
        
        const modal = document.getElementById('wc-solo-prompt-modal');
        if(modal) modal.remove();
    },

    async _deleteSoloPrompt(name) {
        const WC = Modules.web_chat;
        if(!WC._customSoloPrompts) return;
        
        delete WC._customSoloPrompts[name];
        await DB.put('settings', { id: 'custom_solo_prompts', prompts: WC._customSoloPrompts });
        
        UI.toast('已删除');
        WC.openSoloPromptModal();
    },

    async _runSoloPrompt() {
        const WC = Modules.web_chat;
        const nameEl = document.getElementById('wc-solo-name');
        const contentEl = document.getElementById('wc-solo-content');
        
        const prompt = contentEl?.value?.trim();
        if(!prompt) {
            UI.toast('请输入提示词内容');
            return;
        }
        
        const input = document.getElementById('wc-input');
        const content = input?.value || '';
        
        const finalPrompt = prompt.replace(/\{\{content\}\}/gi, content);
        if(input) input.value = finalPrompt;
        
        const modal = document.getElementById('wc-solo-prompt-modal');
        if(modal) modal.remove();
        
        WC.sendMessage();
    }

};
