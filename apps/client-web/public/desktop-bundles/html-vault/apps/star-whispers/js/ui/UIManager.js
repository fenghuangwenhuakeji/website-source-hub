/**
 * UI Manager
 * Handles theme switching and view rendering.
 */
export class UIManager {
    constructor(eventBus, services) {
        this.eventBus = eventBus;
        this.services = services || {};
        this.body = document.body;
        this.viewContainer = document.getElementById('view-container');
        
        this.bindEvents();
    }

    bindEvents() {
        this.eventBus.on('user:login', (user) => {
            this.setTheme(user.role);
            this.renderDashboard(user);
        });
        
        this.eventBus.on('user:loaded', (user) => {
             this.setTheme(user.role);
             this.renderDashboard(user);
        });

        this.eventBus.on('chat:update', (msg) => {
            this.appendChatMessage(msg);
        });
        
        // 简单的开始按钮事件绑定
        const btnStart = document.getElementById('btn-start');
        if(btnStart) {
            btnStart.addEventListener('click', () => {
                const age = prompt("请输入您的年龄以匹配合适的服务:", "25");
                if(age) {
                    // 暂时通过全局 app 实例访问，实际应解耦
                    window.app.userContext.login(parseInt(age), "User");
                }
            });
        }

        // 导航点击
        document.querySelectorAll('.menu li').forEach(item => {
            item.addEventListener('click', (e) => {
                const target = e.target.dataset.target;
                if(target === 'chat') this.renderChat();
                // 其他视图暂略
            });
        });
    }
    
    init() {
        // Initialize UI components if needed
    }

    setTheme(role) {
        let theme = 'default';
        if (role === 'child') theme = 'child';
        else if (role === 'teen') theme = 'teen';
        
        this.body.setAttribute('data-theme', theme);
    }

    renderDashboard(user) {
        // 获取角色配置
        const charProfile = this.services.personalityService.getCharacterProfile(user.age, 'default');
        
        this.viewContainer.innerHTML = `
            <div class="dashboard">
                <h2>欢迎回来, ${user.name}</h2>
                <p>当前模式: ${user.role === 'child' ? '儿童成长模式' : user.role === 'teen' ? '青少年探索模式' : '成人专业模式'}</p>
                <div class="info-card" style="margin-top:20px; text-align:center; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                    <div style="font-size:3rem;">${charProfile.avatar}</div>
                    <h3>你的专属伙伴: ${charProfile.name}</h3>
                    <p>"${charProfile.greeting}"</p>
                </div>
                <div class="actions" style="margin-top:20px; text-align:center;">
                    <button id="btn-enter-chat" class="btn-primary">开始对话</button>
                </div>
            </div>
        `;
        document.getElementById('user-status').innerText = user.name;
        
        const btn = document.getElementById('btn-enter-chat');
        if(btn) btn.addEventListener('click', () => this.renderChat());
    }

    renderChat() {
        this.viewContainer.innerHTML = `
            <div class="chat-container">
                <div id="chat-messages" class="chat-messages"></div>
                <div class="chat-input-area">
                    <input type="text" id="chat-input" placeholder="输入消息..." />
                    <button id="btn-send" class="btn-primary">发送</button>
                </div>
            </div>
        `;
        
        const input = document.getElementById('chat-input');
        const btn = document.getElementById('btn-send');
        
        const send = () => {
            const text = input.value.trim();
            if(text) {
                this.services.chatService.sendMessage(text);
                input.value = '';
            }
        };
        
        btn.addEventListener('click', send);
        input.addEventListener('keypress', (e) => {
            if(e.key === 'Enter') send();
        });
    }

    appendChatMessage(msg) {
        const container = document.getElementById('chat-messages');
        if(!container) return;
        
        const div = document.createElement('div');
        div.className = `message ${msg.sender}`;
        div.innerText = msg.text;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }
}