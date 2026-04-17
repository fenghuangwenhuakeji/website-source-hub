import EventBus from '../core/eventBus.js';
import ChatUI from './chatUI.js';

export default class UIController {
    constructor() {
        this.appContainer = document.getElementById('app');
        this.mainContainer = document.getElementById('main-container');
        this.headerStatus = document.querySelector('.user-status');
    }

    init() {
        console.log('UIController Initialized');
        this.bindEvents();
    }

    bindEvents() {
        // 监听主题切换
        EventBus.on('system:themeChange', (theme) => {
            this.applyTheme(theme);
        });

        // 监听用户更新
        EventBus.on('user:update', (user) => {
            this.updateHeader(user);
            this.renderDashboard(user);
        });

        // 监听登出
        EventBus.on('user:logout', () => {
            this.headerStatus.textContent = '未登录';
            this.renderWelcome();
        });
    }

    applyTheme(theme) {
        console.log(`Applying theme: ${theme}`);
        document.body.setAttribute('data-theme', theme);
    }

    updateHeader(user) {
        if (user) {
            this.headerStatus.textContent = `用户 (Age: ${user.age})`;
        }
    }

    renderWelcome() {
        this.mainContainer.innerHTML = `
            <div class="welcome-card">
                <h2>欢迎来到星语心伴</h2>
                <p>请选择您的年龄以开始体验定制化陪伴：</p>
                <div class="age-selector">
                    <button class="btn-age" data-age="8">我是小学生 (8岁)</button>
                    <button class="btn-age" data-age="15">我是中学生 (15岁)</button>
                    <button class="btn-age" data-age="25">我是成年人 (25岁)</button>
                </div>
            </div>
        `;
        
        this.mainContainer.querySelectorAll('.btn-age').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const age = parseInt(e.target.dataset.age);
                EventBus.emit('ui:setAge', age);
            });
        });
    }

    renderDashboard(user) {
        this.mainContainer.innerHTML = `
            <div class="dashboard">
                <h3>你好，${user.ageGroup === 'child' ? '小星星' : '伙伴'}!</h3>
                <div class="module-grid">
                    <div class="card" id="btn-npti">NPTI 性格测试</div>
                    <div class="card" id="btn-horoscope">星座运势</div>
                    <div class="card" id="btn-chat">开始聊天</div>
                </div>
                <button id="btn-logout" style="margin-top:30px; padding:10px 20px; border:none; background:#eee; cursor:pointer; border-radius:4px;">退出登录</button>
            </div>
        `;
        
        document.getElementById('btn-logout').addEventListener('click', () => {
            EventBus.emit('ui:logout');
        });

        document.getElementById('btn-chat').addEventListener('click', () => {
            const chatUI = new ChatUI(this.mainContainer);
            chatUI.render();
        });

        document.getElementById('btn-npti').addEventListener('click', () => {
             EventBus.emit('ui:startNPTI');
        });
    }
}