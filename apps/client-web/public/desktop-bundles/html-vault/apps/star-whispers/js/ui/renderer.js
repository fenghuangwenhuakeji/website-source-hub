export class UIRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    renderWelcome() {
        this.container.innerHTML = `
            <div class="welcome-card">
                <h2>欢迎来到星语心伴</h2>
                <p>您的专属 AI 心理伙伴</p>
                <form id="setup-form" class="setup-form">
                    <div class="form-group">
                        <label>昵称</label>
                        <input type="text" name="name" required placeholder="给自己起个名字">
                    </div>
                    <div class="form-group">
                        <label>年龄</label>
                        <input type="number" name="age" required min="6" max="100" placeholder="请输入真实年龄以匹配模式">
                    </div>
                    <div class="form-group">
                        <label>星座</label>
                        <select name="constellation">
                            <option value="aries">白羊座</option>
                            <option value="taurus">金牛座</option>
                            <option value="gemini">双子座</option>
                            <option value="cancer">巨蟹座</option>
                            <option value="leo">狮子座</option>
                            <option value="virgo">处女座</option>
                            <option value="libra">天秤座</option>
                            <option value="scorpio">天蝎座</option>
                            <option value="sagittarius">射手座</option>
                            <option value="capricorn">摩羯座</option>
                            <option value="aquarius">水瓶座</option>
                            <option value="pisces">双鱼座</option>
                        </select>
                    </div>
                    <button type="submit" class="btn-primary">开启旅程</button>
                </form>
            </div>
        `;
    }

    renderHome(user) {
        this.container.innerHTML = `
            <div class="dashboard">
                <div class="card greeting">
                    <h3>你好，${user.name} 👋</h3>
                    <p>今天是适合${this._getDailyAdvice(user.constellation)}的一天</p>
                </div>
                <div class="card action-card" onclick="window.app.navigateTo('chat')">
                    <div class="icon">💬</div>
                    <div class="text">
                        <h4>开始聊天</h4>
                        <p>和你的专属伙伴聊聊心事</p>
                    </div>
                </div>
                <div class="card action-card" onclick="window.app.navigateTo('analysis')">
                    <div class="icon">📊</div>
                    <div class="text">
                        <h4>心理状态</h4>
                        <p>查看本周情绪波动</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderChat() {
        this.container.innerHTML = `
            <div class="chat-container">
                <div id="chat-history" class="chat-history">
                    <div class="message system">
                        <p>我是你的AI伙伴，有什么心事都可以告诉我哦~ (所有对话均已加密)</p>
                    </div>
                </div>
                <div class="chat-input-area">
                    <input type="text" id="msg-input" placeholder="输入消息...">
                    <button id="send-btn">发送</button>
                </div>
            </div>
        `;
    }

    _getDailyAdvice(constellation) {
        // 简单的模拟数据，后续可对接真实星座API
        const advices = ['放松心情', '努力学习', '结交新朋友', '阅读一本好书'];
        return advices[Math.floor(Math.random() * advices.length)];
    }
}