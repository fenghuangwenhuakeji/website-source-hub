/**
 * AI酒馆 - 行业TOP1旗舰版 增强入口
 * 
 * 整合所有增强功能:
 * - 三层记忆系统
 * - 虚拟工作空间
 * - 模块化架构
 * - Keep-Alive 视图缓存
 * - 流水线剧本创作
 * - RAG 上下文检索
 */

import { dbManager } from './core/db_manager.js';
import { eventBus } from './core/event_bus.js';
import { App, Modules } from './core/app_core.js';
import { ThreeLayerMemorySystem } from './systems/memory_system.js';
import { WorkspaceManager } from './systems/workspace_manager.js';
import { RAGSystem, ContextEnhancer } from './systems/rag_system.js';
import { scriptPipeline } from './systems/script_pipeline.js';

class EnhancedTavern {
    constructor() {
        this.version = '4.0.0-enhanced';
        this.db = null;
        this.memory = null;
        this.workspace = null;
        this.rag = null;
        this.contextEnhancer = null;
        this._initialized = false;
    }

    async init() {
        if (this._initialized) return;
        
        console.log('🍺 AI酒馆 增强版 v' + this.version + ' 初始化中...');
        
        try {
            this.db = dbManager;
            await this.db.init();
            console.log('✓ 数据库初始化完成');
            
            this.memory = new ThreeLayerMemorySystem(this.db, {
                working: { maxSize: 25, maxTokens: 5000 },
                session: { maxSize: 150 }
            });
            await this.memory.init();
            console.log('✓ 三层记忆系统初始化完成');
            
            this.workspace = new WorkspaceManager(this.db);
            await this.workspace.init();
            console.log('✓ 工作空间管理器初始化完成');
            
            this.rag = new RAGSystem(this.db);
            await this.rag.init();
            console.log('✓ RAG 检索系统初始化完成');
            
            this.contextEnhancer = new ContextEnhancer(this.rag, this.memory);
            console.log('✓ 上下文增强器初始化完成');
            
            this._bindEvents();
            this._exposeGlobals();
            
            this._initialized = true;
            console.log('🎉 AI酒馆 增强版 初始化完成！');
            
            this._showWelcomeToast();
            
            eventBus.emit('tavern-ready');
            
        } catch (e) {
            console.error('初始化失败:', e);
            this._showError('初始化失败: ' + e.message);
        }
    }

    _bindEvents() {
        eventBus.on('game-started', async ({ script }) => {
            console.log('游戏开始:', script.name);
            
            if (script.worldSetting) {
                await this.rag.indexDocument(
                    `world_${script.id}`,
                    script.worldSetting,
                    { type: 'world', scriptId: script.id }
                );
            }
            
            if (script.characters) {
                for (const char of script.characters) {
                    await this.rag.indexDocument(
                        `char_${char.name}_${script.id}`,
                        `${char.name}: ${char.desc}\n目标: ${char.goal}`,
                        { type: 'character', scriptId: script.id }
                    );
                }
            }
        });

        eventBus.on('action-processed', async ({ action, response }) => {
            await this.contextEnhancer.learnFromInteraction(action, response);
        });

        eventBus.on('script-saved', async ({ script }) => {
            console.log('剧本已保存:', script.name);
        });

        eventBus.on('workspace-switched', async ({ workspace }) => {
            console.log('工作空间切换:', workspace);
            this.memory.newSession();
        });
    }

    _exposeGlobals() {
        window.Tavern = this;
        window.TavernDB = this.db;
        window.TavernMemory = this.memory;
        window.TavernWorkspace = this.workspace;
        window.TavernRAG = this.rag;
        window.TavernContext = this.contextEnhancer;
        window.TavernPipeline = scriptPipeline;
        window.eventBus = eventBus;
        
        window.switchView = (view) => App.nav(view);
        window.startGame = (scriptId) => App.startGame(scriptId);
        window.sendAction = () => App.sendAction();
    }

    async startGame(scriptId) {
        return App.startGame(scriptId);
    }

    async sendAction() {
        return App.sendAction();
    }

    async enhancedChat(userInput, gameContext = {}) {
        const enhanced = await this.contextEnhancer.enhancePrompt(userInput, gameContext);
        
        console.log('增强上下文统计:', enhanced.stats);
        
        return enhanced;
    }

    getMemoryStats() {
        return this.memory?.getStats();
    }

    getRAGStats() {
        return this.rag?.getStats();
    }

    getWorkspaceInfo() {
        return this.workspace?.getCurrentWorkspace();
    }

    async exportAllData() {
        const data = {
            version: this.version,
            exportedAt: new Date().toISOString(),
            workspace: await this.workspace?.exportWorkspace(),
            memory: await this.memory?.exportMemory(),
            ragStats: this.rag?.getStats()
        };
        
        return data;
    }

    async importAllData(data) {
        if (data.workspace) {
            await this.workspace?.importWorkspace(data.workspace);
        }
        if (data.memory) {
            await this.memory?.importMemory(data.memory);
        }
        
        console.log('数据导入完成');
    }

    async backup() {
        const data = await this.exportAllData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tavern_backup_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this._showToast('✓ 备份已下载');
    }

    async restore(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    await this.importAllData(data);
                    this._showToast('✓ 数据恢复成功');
                    resolve(true);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    }

    _showWelcomeToast() {
        const ws = this.workspace?.getCurrentWorkspace();
        const msg = `🍺 AI酒馆 v${this.version} | 工作空间: ${ws?.name || '默认'}`;
        this._showToast(msg, 5000);
    }

    _showToast(message, duration = 3000) {
        const toast = document.createElement('div');
        toast.className = 'tavern-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #fff;
            padding: 14px 24px;
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,0.1);
            z-index: 10001;
            font-size: 14px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.4);
            animation: slideInRight 0.3s ease;
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    _showError(message) {
        const error = document.createElement('div');
        error.className = 'tavern-error';
        error.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:20px;">❌</span>
                <span>${message}</span>
            </div>
        `;
        error.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: #fff;
            padding: 16px 24px;
            border-radius: 10px;
            z-index: 10002;
            box-shadow: 0 10px 40px rgba(239,68,68,0.4);
        `;
        document.body.appendChild(error);
        setTimeout(() => error.remove(), 5000);
    }
}

const tavern = new EnhancedTavern();

document.addEventListener('DOMContentLoaded', () => tavern.init());

export { EnhancedTavern, tavern };
