/**
 * 塔罗占卜页面脚本 - Tarot Page Script
 */

import { TarotModule } from '../modules/tarot/index.js';

class TarotPage {
    constructor() {
        this.tarot = new TarotModule();
        this.selectedSpread = null;
        this.currentResult = null;
        
        this.initUI();
        this.bindEvents();
    }

    initUI() {
        // 加载牌阵列表
        this.loadSpreads();
        // 加载历史记录
        this.tarot.loadHistory?.();
    }

    loadSpreads() {
        const spreadList = document.querySelector('#spread-list');
        if (!spreadList) return;

        const spreads = this.tarot.getAvailableSpreads?.() || [
            { id: 'single', name: '单张牌', description: '简单的每日指引' },
            { id: 'three', name: '三张牌阵', description: '过去、现在、未来' },
            { id: 'celtic', name: '凯尔特十字', description: '深度解读' }
        ];

        spreadList.innerHTML = spreads.map(spread => `
            <li data-spread="${spread.id}" class="${this.selectedSpread === spread.id ? 'active' : ''}">
                <strong>${spread.name}</strong>
                <small>${spread.description}</small>
            </li>
        `).join('');
    }

    bindEvents() {
        // 牌阵选择
        const spreadList = document.querySelector('#spread-list');
        spreadList?.addEventListener('click', (e) => {
            const li = e.target.closest('li');
            if (li) {
                this.selectSpread(li.dataset.spread);
                // 更新选中状态
                spreadList.querySelectorAll('li').forEach(el => el.classList.remove('active'));
                li.classList.add('active');
            }
        });

        // 每日指引
        const dailyBtn = document.querySelector('#daily-btn');
        dailyBtn?.addEventListener('click', () => this.getDailyGuidance());

        // 开始占卜
        const divineBtn = document.querySelector('#divine-btn');
        divineBtn?.addEventListener('click', () => this.startDivination());

        // 重置
        const resetBtn = document.querySelector('#reset-btn');
        resetBtn?.addEventListener('click', () => this.reset());
    }

    selectSpread(spreadId) {
        this.selectedSpread = spreadId;
    }

    async getDailyGuidance() {
        const result = this.tarot.getDailyGuidance?.() || {
            card: { name: '愚者', isReversed: false },
            interpretation: '新的一天，新的开始',
            date: new Date().toLocaleDateString('zh-CN')
        };

        const dailyCard = document.querySelector('#daily-card');
        if (dailyCard) {
            dailyCard.innerHTML = `
                <div class="daily-card-display">
                    <div class="card-emoji">🃏</div>
                    <div class="card-name">${result.card.name}${result.card.isReversed ? ' (逆位)' : ''}</div>
                    <div class="card-meaning">${result.interpretation}</div>
                </div>
            `;
        }
    }

    async startDivination() {
        if (!this.selectedSpread) {
            alert('请先选择一个牌阵');
            return;
        }

        const questionInput = document.querySelector('#question-input');
        const question = questionInput?.value?.trim() || '';

        // 显示加载状态
        const display = document.querySelector('#cards-display');
        if (display) {
            display.innerHTML = '<div class="loading">占卜中...</div>';
        }

        try {
            // 执行占卜
            this.currentResult = await this.tarot.divine?.(this.selectedSpread, question) || {
                spreadName: '三张牌阵',
                cards: [
                    { name: '愚者', position: '过去', isReversed: false },
                    { name: '魔术师', position: '现在', isReversed: false },
                    { name: '女祭司', position: '未来', isReversed: true }
                ],
                interpretation: { summary: '充满希望的未来' }
            };

            // 显示结果
            this.displayResult(this.currentResult);
        } catch (error) {
            console.error('占卜失败:', error);
            if (display) {
                display.innerHTML = '<div class="error">占卜失败，请重试</div>';
            }
        }
    }

    displayResult(result) {
        const display = document.querySelector('#cards-display');
        if (display) {
            display.innerHTML = result.cards.map(card => {
                const positionName = typeof card.position === 'object' ? (card.position.name || card.position.meaning || JSON.stringify(card.position)) : card.position;
                return `
                <div class="tarot-card ${card.isReversed ? 'reversed' : ''}">
                    <div class="card-position">${positionName}</div>
                    <div class="card-name">${card.name}</div>
                    <div class="card-status">${card.isReversed ? '逆位' : '正位'}</div>
                </div>
            `}).join('');
        }

        // 显示解读
        const interpretationArea = document.querySelector('#interpretation-area');
        const interpretationText = document.querySelector('#interpretation-text');
        
        if (interpretationArea && interpretationText) {
            interpretationArea.style.display = 'block';
            interpretationText.innerHTML = `
                <p><strong>牌阵：</strong>${result.spreadName}</p>
                <p><strong>总结：</strong>${result.interpretation?.summary || '等待解读'}</p>
                <div class="card-details">
                    ${result.cards.map(card => {
                        const positionName = typeof card.position === 'object' ? (card.position.name || card.position.meaning || '') : card.position;
                        return `
                        <div class="card-detail">
                            <span class="position">${positionName}：</span>
                            <span class="name">${card.name}</span>
                            <span class="status">(${card.isReversed ? '逆位' : '正位'})</span>
                        </div>
                    `}).join('')}
                </div>
            `;
        }
    }

    reset() {
        this.selectedSpread = null;
        this.currentResult = null;

        // 重置UI
        const spreadList = document.querySelector('#spread-list');
        spreadList?.querySelectorAll('li').forEach(el => el.classList.remove('active'));

        const display = document.querySelector('#cards-display');
        if (display) {
            display.innerHTML = '<div class="placeholder-text"><p>选择牌阵后点击"开始占卜"</p></div>';
        }

        const interpretationArea = document.querySelector('#interpretation-area');
        if (interpretationArea) {
            interpretationArea.style.display = 'none';
        }

        const questionInput = document.querySelector('#question-input');
        if (questionInput) {
            questionInput.value = '';
        }
    }
}

// 初始化页面
window.addEventListener('DOMContentLoaded', () => {
    new TarotPage();
});