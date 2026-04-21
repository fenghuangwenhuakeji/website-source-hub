export class UIManager {
    constructor() {
        this.header = document.getElementById('main-header');
        this.content = document.getElementById('content-area');
        this.footer = document.getElementById('input-area');
    }

    async renderWelcomeScreen() {
        this.content.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full">
                <h1 class="text-3xl font-bold mb-8 text-indigo-600">星语心伴</h1>
                <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                    <h2 class="text-xl mb-4">让我们开始吧</h2>
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-bold mb-2">你的年龄</label>
                        <input type="number" id="age-input" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" placeholder="请输入年龄">
                    </div>
                    <button id="start-btn" class="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full">
                        开启旅程
                    </button>
                </div>
            </div>
        `;

        document.getElementById('start-btn').addEventListener('click', () => this.handleStart());
    }

    async handleStart() {
        const age = document.getElementById('age-input').value;
        if (!age) return alert('请输入年龄');
        
        try {
            // 调用全局API实例 (在app.js中初始化)
            const result = await window.app.api.post('/users/onboard', { age: parseInt(age), nickname: 'User' });
            console.log('Onboard result:', result);
            alert(`欢迎！已为你匹配模式: ${result.age_group}`);
            // TODO: 根据 result.config 切换主题
        } catch (error) {
            console.error(error);
            alert('出错了，请检查后端服务是否启动');
        }
    }
}