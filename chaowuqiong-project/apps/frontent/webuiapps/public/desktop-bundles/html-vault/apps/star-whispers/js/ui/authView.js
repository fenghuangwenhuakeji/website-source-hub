export class AuthView {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.container = document.getElementById('view-auth');
        this.btnRegister = document.getElementById('btn-register');
        this.inputName = document.getElementById('input-name');
        this.inputAge = document.getElementById('input-age');
        this.selectZodiac = document.getElementById('select-zodiac');

        this.bindEvents();
    }

    bindEvents() {
        if (this.btnRegister) {
            this.btnRegister.addEventListener('click', () => this.handleRegister());
        }
    }

    handleRegister() {
        const name = this.inputName.value.trim();
        const age = parseInt(this.inputAge.value);
        const zodiac = this.selectZodiac.value;

        if (!name || !age) {
            alert('请填写完整的昵称和年龄哦~');
            return;
        }

        if (age < 6 || age > 120) {
            alert('请输入有效的年龄 (6-120岁)');
            return;
        }

        const userData = {
            name,
            age,
            zodiac,
            registeredAt: new Date().toISOString()
        };

        // 触发注册事件
        this.eventBus.emit('user:register', userData);
    }

    show() {
        this.container.classList.remove('hidden');
    }

    hide() {
        this.container.classList.add('hidden');
    }
}