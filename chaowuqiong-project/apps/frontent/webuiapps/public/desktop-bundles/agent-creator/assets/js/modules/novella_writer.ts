interface ChatRole {
    id: string;
    name: string;
    icon: string;
    color: string;
    desc: string;
}

interface NovellaSession {
    id: string;
    title: string;
    createdAt: number;
    updatedAt: number;
}

interface NovellaMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    ts: number;
}

declare const DB: {
    get: <T = any>(store: string, key: string) => Promise<T | null>;
    put: (store: string, data: any) => Promise<any>;
    getAll: <T = any>(store: string) => Promise<T[]>;
};

const novellaWriterModule = {
    _sessions: [] as NovellaSession[],
    _currentSessionId: null as string | null,
    _messages: [] as NovellaMessage[],
    _outlines: [] as string[],
    _settings: {} as Record<string, any>,
    _prompts: [] as string[],
    _selectedPromptId: null as string | null,
    _generating: false,
    _autoGenerating: false,
    _pauseRequested: false,

    _performance: {
        renderCount: 0,
        totalRenderTime: 0,
        lastRenderTime: 0,
        messageCount: 0,
        logPerformance(label: string, startTime: number): void {
            const duration = performance.now() - startTime;
            if (duration > 16) {
                console.warn(`[性能警告] ${label} 耗时 ${duration.toFixed(2)}ms`);
            }
        }
    },

    _chatMode: 'creative' as 'creative' | 'chat',
    _chatRoles: [
        { id: 'assistant', name: '智能助手', icon: 'fa-robot', color: 'text-blue-400', desc: '通用AI助手' },
        { id: 'writing_tutor', name: '写作导师', icon: 'fa-graduation-cap', color: 'text-purple-400', desc: '专业写作指导' },
        { id: 'literary_critic', name: '文学评论家', icon: 'fa-book', color: 'text-pink-400', desc: '深度文学分析' },
        { id: 'editor', name: '责任编辑', icon: 'fa-marker', color: 'text-green-400', desc: '专业编辑视角' },
        { id: 'plot_master', name: '情节大师', icon: 'fa-sitemap', color: 'text-amber-400', desc: '情节设计专家' },
        { id: 'character_designer', name: '人设专家', icon: 'fa-user-pen', color: 'text-cyan-400', desc: '人物塑造专家' },
        { id: 'world_builder', name: '世界观架构师', icon: 'fa-earth-americas', color: 'text-indigo-400', desc: '世界观构建' },
        { id: 'dialogue_coach', name: '对话教练', icon: 'fa-comments', color: 'text-rose-400', desc: '对话润色专家' }
    ] as ChatRole[],
    _currentChatRole: 'assistant',

    _chatRolePrompts: {
        assistant: '你是一个友好、专业的AI助手，擅长回答各类问题。',
        writing_tutor: '你是一位资深的写作导师，拥有丰富的写作教学经验。',
        literary_critic: '你是一位眼光犀利的文学评论家，擅长深度分析文学作品。',
        editor: '你是一位经验丰富的责任编辑，以专业严谨的态度对待每一篇文稿。',
        plot_master: '你是情节设计专家，擅长情节设计、悬念布局、节奏控制。',
        character_designer: '你是人物塑造专家，擅长人物塑造、性格设计、角色弧线。',
        world_builder: '你是世界观架构师，擅长世界观构建、设定完善、体系设计。',
        dialogue_coach: '你是对话教练，擅长对话润色、角色声音、潜台词设计。'
    } as Record<string, string>,

    async newSession(): Promise<void> {
        const session: NovellaSession = {
            id: 'session_' + Date.now(),
            title: '新对话',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        this._sessions.push(session);
        this._currentSessionId = session.id;
        this._messages = [];
        await DB.put('novella_sessions', session);
        this.render();
    },

    switchRole(roleId: string): void {
        this._currentChatRole = roleId;
        this.render();
    },

    _renderSidebar(): string {
        return `<div class="w-60 shrink-0 flex flex-col bg-white border-r border-gray-200">
            <div class="p-4 border-b border-gray-200">
                <button class="btn w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white" onclick="Modules.novella_writer.newSession()">
                    <i class="fa-solid fa-plus mr-2"></i>新建对话
                </button>
            </div>
            <div class="flex-1 overflow-y-auto p-2">
                ${this._sessions.map(s => `
                    <button class="w-full text-left px-3 py-2 rounded-lg text-sm ${this._currentSessionId === s.id ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}" onclick="Modules.novella_writer.selectSession('${s.id}')">
                        ${s.title}
                    </button>
                `).join('')}
            </div>
        </div>`;
    },

    _renderChatArea(): string {
        return `<div class="flex-1 flex flex-col">
            <div class="flex-1 overflow-y-auto p-4" id="nw-messages">
                ${this._messages.map(m => `
                    <div class="mb-4 ${m.role === 'user' ? 'text-right' : 'text-left'}">
                        <div class="inline-block max-w-[80%] p-3 rounded-lg ${m.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100'}">
                            ${m.content}
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="p-4 border-t border-gray-200">
                <div class="flex gap-2">
                    <input class="flex-1 bg-gray-100 border border-gray-300 rounded-lg p-3" placeholder="输入消息..." id="nw-input">
                    <button class="btn btn-primary" onclick="Modules.novella_writer.sendMessage()">发送</button>
                </div>
            </div>
        </div>`;
    },

    _renderRightPanel(): string {
        return `<div class="w-64 shrink-0 bg-gray-50 border-l border-gray-200 p-4">
            <h4 class="font-bold text-sm mb-4">角色选择</h4>
            <div class="space-y-2">
                ${this._chatRoles.map(r => `
                    <button class="w-full text-left px-3 py-2 rounded-lg text-xs ${this._currentChatRole === r.id ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}" onclick="Modules.novella_writer.switchRole('${r.id}')">
                        <i class="fa-solid ${r.icon} ${r.color} mr-2"></i>${r.name}
                    </button>
                `).join('')}
            </div>
        </div>`;
    },

    render(): string {
        return `<div class="flex h-full bg-white overflow-hidden">
            ${this._renderSidebar()}
            ${this._renderChatArea()}
            ${this._renderRightPanel()}
        </div>`;
    },

    async init(): Promise<void> {
        const sessions = await DB.getAll<NovellaSession>('novella_sessions');
        if (sessions) this._sessions = sessions;
    }
};

(window as any).Modules = (window as any).Modules || {};
(window as any).Modules.novella_writer = novellaWriterModule;
