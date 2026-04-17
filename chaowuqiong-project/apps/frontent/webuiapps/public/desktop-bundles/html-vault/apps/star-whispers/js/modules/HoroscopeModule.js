import { eventBus } from '../core/EventBus.js';
import { horoscopeData } from '../data/horoscope_data.js';

export class HoroscopeModule {
    constructor() {
        this.container = document.getElementById('horoscope-grid');
    }

    init() {
        this.renderSelection();
    }

    renderSelection() {
        if (!this.container) return;

        let html = '';
        horoscopeData.forEach(sign => {
            html += `
                <div class="horoscope-item" data-sign="${sign.name}">
                    <div class="icon">${sign.icon}</div>
                    <div class="name">${sign.name}</div>
                </div>
            `;
        });
        this.container.innerHTML = html;

        // 绑定点击事件
        this.container.querySelectorAll('.horoscope-item').forEach(item => {
            item.addEventListener('click', () => {
                const sign = item.dataset.sign;
                this.selectSign(sign);
            });
        });
    }

    selectSign(sign) {
        console.log(`Selected horoscope: ${sign}`);
        eventBus.emit('user:select-horoscope', sign);
        // 视觉反馈
        this.container.querySelectorAll('.horoscope-item').forEach(el => el.classList.remove('selected'));
        this.container.querySelector(`[data-sign="${sign}"]`).classList.add('selected');
    }
}