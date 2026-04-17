import { eventBus } from './core/eventBus.js';
import { userContext } from './modules/userContext.js';
import { chatContext } from './modules/chatContext.js';
// 预留模块
// import { analysisContext } from './modules/analysisContext.js';
// import { horoscopeContext } from './modules/horoscopeContext.js';

class App {
    constructor() {
        this.init();
    }

    init() {
        console.log('星语心伴 App 初始化...');
        this.bindEvents();
        this.createDebugPanel(); // 仅供开发演示使用
        
        // 初始化默认状态 (默认25岁成人)
        userContext.setAge(25);
    }

    bindEvents() {
        // 导航点击事件
        document.querySelectorAll('.main-nav button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const moduleName = e.target.dataset.module;
                this.switchModule(moduleName);
                
                document.querySelectorAll('.main-nav button').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // 监听用户信息更新，更新UI顶部状态栏
        eventBus.on('user:profile_updated', (user) => {
            const badge = document.getElementById('age-mode-badge');
            if (badge) {
                const labels = { child: '儿童模式', teen: '青少年模式', adult: '成人模式' };
                badge.textContent = labels[user.ageGroup];
                // 移除旧类名并添加新类名
                badge.className = 'badge';
                badge.classList.add(`mode-${user.ageGroup}`);
            }
        });
    }

    switchModule(moduleName) {
        console.log(`切换到模块: ${moduleName}`);
        const contentArea = document.getElementById('content-area');
        
        // 简单的路由逻辑
        if (moduleName === 'chat') {
            document.querySelector('.chat-container').style.display = 'flex';
            // 隐藏其他模块容器(如果有)
        } else {
            // 临时提示
            // alert('该模块正在开发中...');
        }
    }

    // 开发调试工具：快速切换年龄
    createDebugPanel() {
        const panel = document.createElement('div');
        panel.style.cssText = 'position:fixed; bottom:10px; left:10px; background:rgba(0,0,0,0.8); padding:10px; border-radius:8px; color:white; z-index:9999; font-size:12px;';
        
        panel.innerHTML = `
            <div style="margin-bottom:8px; font-weight:bold;">🛠️ 调试: 切换年龄</div>
            <button onclick="window.app.setAge(8)" style="color:white; background:#ff7675; padding:4px 8px; border-radius:4px; margin-right:5px;">8岁 (儿童)</button>
            <button onclick="window.app.setAge(15)" style="color:white; background:#74b9ff; padding:4px 8px; border-radius:4px; margin-right:5px;">15岁 (少年)</button>
            <button onclick="window.app.setAge(30)" style="color:white; background:#6c5ce7; padding:4px 8px; border-radius:4px;">30岁 (成人)</button>
        `;
        document.body.appendChild(panel);
    }

    setAge(age) {
        userContext.setAge(age);
        // 清空聊天记录以便观察新模式
        const history = document.getElementById('chat-history');
        if(history) history.innerHTML = '<div class="bubble system">已切换年龄模式，历史记录已归档。</div>';
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});