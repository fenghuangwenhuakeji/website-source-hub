import { eventBus } from '../core/EventBus.js';

export class UserModule {
    constructor() {
        this.currentUser = {
            ageGroup: null,
            horoscope: null
        };
        this.horoscopeSection = document.getElementById('horoscope-section');
        this.startBtn = document.getElementById('start-journey-btn');
    }

    init() {
        // 1. 监听年龄选择
        eventBus.on('user:select-age', (ageGroup) => {
            this.currentUser.ageGroup = ageGroup;
            console.log(`Age selected: ${ageGroup}`);
            
            // 切换主题
            eventBus.emit('ui:theme-change', ageGroup);
            
            // 显示星座选择
            if (this.horoscopeSection) {
                this.horoscopeSection.classList.remove('hidden');
            }
        });

        // 2. 监听星座选择
        eventBus.on('user:select-horoscope', (sign) => {
            this.currentUser.horoscope = sign;
            console.log(`Horoscope selected: ${sign}`);
        });

        // 3. 监听开始旅程按钮
        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => {
                if (this.currentUser.ageGroup && this.currentUser.horoscope) {
                    this.completeOnboarding();
                } else {
                    alert('请先选择年龄和星座！');
                }
            });
        }
    }

    completeOnboarding() {
        console.log('Onboarding completed', this.currentUser);
        // 更新状态栏
        const statusEl = document.getElementById('user-status');
        if (statusEl) statusEl.innerText = `${this.currentUser.horoscope} | ${this.currentUser.ageGroup}`;
        
        // 跳转到聊天
        eventBus.emit('nav:go-to', 'view-chat');
        
        // 触发 NPTI 测评准备（可选）
        eventBus.emit('npti:start', this.currentUser.ageGroup);
    }
}