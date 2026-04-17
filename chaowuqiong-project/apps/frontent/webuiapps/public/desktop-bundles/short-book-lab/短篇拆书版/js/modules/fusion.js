import { api } from '../core/api.js';
import { ui } from '../ui/ui-manager.js';
import { library } from './library-manager.js';
import { chat } from './chat-manager.js';
import { db } from '../core/db.js';

export class FusionManager {
    constructor() {
        this.currentMode = 'deconstruct';
        this.defaultPrompts = {
            deconstruct: '请深度拆解以下故事的结构、开局公式、情绪链设计、爽点/虐点布局、人物关系网、金句与氛围营造:\n\n',
            fusion: '请融合以下故事元素,创作一个连贯的新故事:\n\n',
            imitate: '请仿写以下故事的风格,创作全新内容:\n\n',
            template: ''
        };
    }

    async init() {
        const saved = await db.getAll('prompts');
        const prompt = saved.find(p => p.key === this.currentMode);
        const promptEl = document.getElementById('fusion-prompt');
        if (promptEl) {
            promptEl.value = prompt ? prompt.value : this.defaultPrompts[this.currentMode];
            promptEl.addEventListener('blur', (e) => this.savePrompt(e.target.value));
        }
    }

    async selectMode(mode) {
        this.currentMode = mode;
        document.querySelectorAll('#view-fusion .mode-card').forEach(c => c.classList.remove('active'));
        const card = document.querySelector(`#view-fusion .mode-card[data-mode="${mode}"]`);
        if (card) card.classList.add('active');
        
        const saved = await db.getAll('prompts');
        const prompt = saved.find(p => p.key === mode);
        const promptEl = document.getElementById('fusion-prompt');
        if (promptEl) {
            promptEl.value = prompt ? prompt.value : this.defaultPrompts[mode];
        }
    }

    async savePrompt(value) {
        await db.put('prompts', { key: this.currentMode, value });
        ui.showNotification('提示词已保存', 'success');
    }

    async start() {
        const input = document.getElementById('fusion-input').value.trim();
        const prompt = document.getElementById('fusion-prompt').value.trim();
        
        if (!input) {
            ui.showNotification('请输入内容', 'error');
            return;
        }
        
        // 重置聊天上下文
        chat.sessions.fusion.messages = [];
        chat.sessions.fusion.contextCount = 0;
        chat.updateContextStats('fusion');
        
        ui.clearIOMonitor('fusion-input-monitor');
        ui.clearIOMonitor('fusion-output-monitor');
        
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
        
        ui.updateIOMonitor('fusion-input-monitor', prompt + '\n\n' + finalInput, 'input');
        
        await api.streamOutput(prompt + finalInput, 
            null, // onChunk
            (fullText) => {
                ui.updateIOMonitor('fusion-output-monitor', fullText, 'output');
                document.getElementById('fusion-status').className = 'status-light success';
                ui.showNotification('完成', 'success');
                chat.addMessage('fusion', 'assistant', fullText);
                
                // 更新结果框
                const outputEl = document.getElementById('fusion-output');
                if (outputEl) outputEl.textContent = fullText;
            },
            (err) => {
                document.getElementById('fusion-output').textContent = '错误: ' + err.message;
                document.getElementById('fusion-status').className = 'status-light';
                ui.showNotification('处理失败', 'error');
            }
        );
        
        // 开始时设置状态灯
        document.getElementById('fusion-status').className = 'status-light active';
        document.getElementById('fusion-output').textContent = '';
        
        // 由于 api.streamOutput 是通用的，我们需要自定义 onChunk 来更新界面
        // 这里为了简单，上面的 api.streamOutput 调用中 onChunk 传了 null
        // 实际上我们应该重新调用一次或者修改 api.streamOutput 支持更灵活的回调
        // 修正：上面的调用方式会导致界面不流式更新结果框，我们重写一下调用
    }
    
    // 重新封装带界面更新的调用
    async startFusionWithUI() {
        const input = document.getElementById('fusion-input').value.trim();
        const prompt = document.getElementById('fusion-prompt').value.trim();
        
        if (!input) {
            ui.showNotification('请输入内容', 'error');
            return;
        }

        chat.sessions.fusion.messages = [];
        chat.sessions.fusion.contextCount = 0;
        chat.updateContextStats('fusion');

        ui.clearIOMonitor('fusion-input-monitor');
        ui.clearIOMonitor('fusion-output-monitor');

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

        ui.updateIOMonitor('fusion-input-monitor', prompt + '\n\n' + finalInput, 'input');
        
        const outputEl = document.getElementById('fusion-output');
        const statusEl = document.getElementById('fusion-status');
        outputEl.textContent = '';
        statusEl.className = 'status-light active';

        await api.streamOutput(prompt + finalInput,
            (chunk, fullText) => {
                outputEl.textContent = fullText;
            },
            (fullText) => {
                ui.updateIOMonitor('fusion-output-monitor', fullText, 'output');
                statusEl.className = 'status-light success';
                ui.showNotification('完成', 'success');
                chat.addMessage('fusion', 'assistant', fullText);
            },
            (err) => {
                outputEl.textContent = '错误: ' + err.message;
                statusEl.className = 'status-light';
                ui.showNotification('处理失败', 'error');
            }
        );
    }
}

export const fusion = new FusionManager();