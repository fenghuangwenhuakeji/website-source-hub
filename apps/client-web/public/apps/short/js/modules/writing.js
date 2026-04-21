import { api } from '../core/api.js';
import { ui } from '../ui/ui-manager.js';
import { library } from './library-manager.js';
import { chat } from './chat-manager.js';
import { db } from '../core/db.js';

export class WritingManager {
    constructor() {
        this.currentTab = 'complete';
        this.defaultPrompts = {
            complete: '请基于以下核心梗创作完整短篇小说(导语+15章,每章1200字以上):\n\n',
            inspiration: '请将以下灵感片段扩展成完整段落(500-800字):\n\n',
            structure: '请优化以下文本的结构,使其更加连贯和有逻辑:\n\n',
            polish: '请对以下文本进行排版润色,使其更加优美流畅:\n\n'
        };
    }

    async init() {
        this.loadPrompts();
        // 绑定失焦保存
        ['complete', 'inspiration', 'structure', 'polish'].forEach(key => {
            const el = document.getElementById(key + '-prompt');
            if (el) {
                el.addEventListener('blur', (e) => this.savePrompt(key, e.target.value));
            }
        });
    }

    async loadPrompts() {
        const saved = await db.getAll('prompts');
        ['complete', 'inspiration', 'structure', 'polish'].forEach(key => {
            const prompt = saved.find(p => p.key === key);
            const el = document.getElementById(key + '-prompt');
            if (el) {
                el.value = prompt ? prompt.value : this.defaultPrompts[key];
            }
        });
    }

    async savePrompt(key, value) {
        await db.put('prompts', { key, value });
        ui.showNotification('提示词已保存', 'success');
    }

    switchTab(tab) {
        this.currentTab = tab;
        // UI切换已经在 ui-manager 中通过 onclick 触发通用逻辑，
        // 但这里可能需要特定逻辑，比如更新 prompt 显示（如果共用一个区域的话，但这里是分开的）
        // 这里主要是更新内部状态
    }

    async start(mode) {
        // mode 对应 'complete', 'inspiration' 等
        const input = document.getElementById(mode + '-input').value.trim();
        const prompt = document.getElementById(mode + '-prompt').value.trim();
        
        if (!input) {
            ui.showNotification('请输入内容', 'error');
            return;
        }

        chat.sessions.writing.messages = [];
        chat.sessions.writing.contextCount = 0;
        chat.updateContextStats('writing');

        ui.clearIOMonitor('writing-input-monitor');
        ui.clearIOMonitor('writing-output-monitor');

        let finalInput = input;
        const libraryMentions = input.match(/@([^\s@]+)/g) || [];
        if (libraryMentions.length > 0) {
            const bookContents = libraryMentions.map(mention => {
                const bookTitle = mention.substring(1);
                const book = library.books.find(b => b.title === bookTitle || b.title.includes(bookTitle));
                return book ? `[图书馆引用: ${book.title}]\n${book.content}` : '';
            });
            finalInput = bookContents.join('\n\n') + '\n\n' + input;
        }

        ui.updateIOMonitor('writing-input-monitor', prompt + '\n\n' + finalInput, 'input');
        
        const outputEl = document.getElementById('writing-output');
        const statusEl = document.getElementById('writing-status');
        outputEl.textContent = '';
        statusEl.className = 'status-light active';

        await api.streamOutput(prompt + finalInput,
            (chunk, fullText) => {
                outputEl.textContent = fullText;
            },
            (fullText) => {
                ui.updateIOMonitor('writing-output-monitor', fullText, 'output');
                statusEl.className = 'status-light success';
                ui.showNotification('完成', 'success');
                chat.addMessage('writing', 'assistant', fullText);
            },
            (err) => {
                outputEl.textContent = '错误: ' + err.message;
                statusEl.className = 'status-light';
                ui.showNotification('处理失败', 'error');
            }
        );
    }
}

export const writing = new WritingManager();