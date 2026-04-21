/**
 * WriterCenterArchon - Main Entry
 * 核心入口文件，负责初始化各模块
 */

import { EventBus } from './core/events.js';
import { Store } from './core/state.js';
import { Editor } from './modules/editor.js';
import { UIManager } from './modules/ui.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('WriterCenterArchon: Initializing...');
    
    // 1. 初始化核心服务
    window.eventBus = new EventBus();
    window.store = new Store();

    // 2. 初始化 UI 管理器
    const ui = new UIManager();
    
    // 3. 初始化编辑器
    const editor = new Editor();

    console.log('WriterCenterArchon: Ready.');
});
