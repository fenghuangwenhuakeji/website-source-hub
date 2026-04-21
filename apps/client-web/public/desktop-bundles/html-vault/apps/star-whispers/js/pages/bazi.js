/**
 * 八字命理页面脚本 - Bazi Page Script
 */

import { BaziModule } from '../modules/bazi/index.js';

class BaziPage {
    constructor() {
        this.bazi = new BaziModule();
        this.currentResult = null;
        
        this.initUI();
        this.bindEvents();
    }

    initUI() {
        // 初始化日期选择器
        this.initDateSelectors();
    }

    initDateSelectors() {
        const yearSelect = document.querySelector('#birth-year');
        const monthSelect = document.querySelector('#birth-month');
        const daySelect = document.querySelector('#birth-day');
        const hourSelect = document.querySelector('#birth-hour');

        // 年份：1950-2020
        if (yearSelect) {
            const currentYear = new Date().getFullYear();
            for (let year = currentYear; year >= 1950; year--) {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = `${year}年`;
                yearSelect.appendChild(option);
            }
        }

        // 月份：1-12
        if (monthSelect) {
            for (let month = 1; month <= 12; month++) {
                const option = document.createElement('option');
                option.value = month;
                option.textContent = `${month}月`;
                monthSelect.appendChild(option);
            }
        }

        // 日期：1-31
        if (daySelect) {
            for (let day = 1; day <= 31; day++) {
                const option = document.createElement('option');
                option.value = day;
                option.textContent = `${day}日`;
                daySelect.appendChild(option);
            }
        }

        // 时辰：23-1点等
        const hours = [
            { value: 0, label: '子时 (23:00-01:00)' },
            { value: 1, label: '丑时 (01:00-03:00)' },
            { value: 2, label: '寅时 (03:00-05:00)' },
            { value: 3, label: '卯时 (05:00-07:00)' },
            { value: 4, label: '辰时 (07:00-09:00)' },
            { value: 5, label: '巳时 (09:00-11:00)' },
            { value: 6, label: '午时 (11:00-13:00)' },
            { value: 7, label: '未时 (13:00-15:00)' },
            { value: 8, label: '申时 (15:00-17:00)' },
            { value: 9, label: '酉时 (17:00-19:00)' },
            { value: 10, label: '戌时 (19:00-21:00)' },
            { value: 11, label: '亥时 (21:00-23:00)' }
        ];

        if (hourSelect) {
            hours.forEach(h => {
                const option = document.createElement('option');
                option.value = h.value;
                option.textContent = h.label;
                hourSelect.appendChild(option);
            });
        }
    }

    bindEvents() {
        // 分析按钮
        const analyzeBtn = document.querySelector('#analyze-btn');
        analyzeBtn?.addEventListener('click', () => this.analyze());
    }

    analyze() {
        const year = parseInt(document.querySelector('#birth-year')?.value);
        const month = parseInt(document.querySelector('#birth-month')?.value);
        const day = parseInt(document.querySelector('#birth-day')?.value);
        const hour = parseInt(document.querySelector('#birth-hour')?.value);
        const isMale = document.querySelector('#gender-male')?.checked ?? true;

        if (!year || !month || !day) {
            alert('请填写完整的出生日期');
            return;
        }

        try {
            // 计算八字
            this.currentResult = this.bazi.calculate?.({
                year, month, day, hour, isMale
            }) || this.getMockResult(year, month, day, hour);

            // 显示结果
            this.displayResult(this.currentResult);
        } catch (error) {
            console.error('八字计算失败:', error);
            // 使用模拟数据
            this.currentResult = this.getMockResult(year, month, day, hour);
            this.displayResult(this.currentResult);
        }
    }

    getMockResult(year, month, day, hour) {
        // 模拟八字结果
        const tianGan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
        const diZhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
        
        return {
            fourPillars: {
                year: { gan: tianGan[year % 10], zhi: diZhi[year % 12] },
                month: { gan: tianGan[(year * 12 + month) % 10], zhi: diZhi[(month + 1) % 12] },
                day: { gan: tianGan[(year * 365 + day) % 10], zhi: diZhi[(year * 365 + day) % 12] },
                hour: { gan: tianGan[(hour + 1) % 10], zhi: diZhi[hour] }
            },
            wuxing: {
                wood: 20 + Math.floor(Math.random() * 30),
                fire: 15 + Math.floor(Math.random() * 25),
                earth: 10 + Math.floor(Math.random() * 20),
                metal: 10 + Math.floor(Math.random() * 20),
                water: 10 + Math.floor(Math.random() * 20)
            },
            interpretation: {
                summary: '命格平稳，性格温和',
                personality: '为人稳重，做事踏实',
                career: '适合稳定发展的行业',
                relationship: '感情运势良好'
            }
        };
    }

    displayResult(result) {
        // 显示结果区域
        const resultArea = document.querySelector('#bazi-result');
        if (resultArea) {
            resultArea.style.display = 'block';
        }

        // 显示四柱
        this.displayFourPillars(result.fourPillars);

        // 显示五行
        this.displayWuxing(result.wuxing);

        // 显示解读
        this.displayInterpretation(result.interpretation);
    }

    displayFourPillars(pillars) {
        const display = document.querySelector('#pillars-display');
        if (!display || !pillars) return;

        const pillarNames = ['年柱', '月柱', '日柱', '时柱'];
        const pillarKeys = ['year', 'month', 'day', 'hour'];

        display.innerHTML = pillarKeys.map((key, index) => `
            <div class="pillar">
                <div class="pillar-name">${pillarNames[index]}</div>
                <div class="pillar-chars">
                    <span class="top">${pillars[key].gan}</span>
                    <span class="bottom">${pillars[key].zhi}</span>
                </div>
            </div>
        `).join('');
    }

    displayWuxing(wuxing) {
        // 侧边栏五行图表
        const chart = document.querySelector('#wuxing-chart');
        if (chart && wuxing) {
            const elements = [
                { name: '木', value: wuxing.wood, class: 'wood' },
                { name: '火', value: wuxing.fire, class: 'fire' },
                { name: '土', value: wuxing.earth, class: 'earth' },
                { name: '金', value: wuxing.metal, class: 'metal' },
                { name: '水', value: wuxing.water, class: 'water' }
            ];

            chart.innerHTML = elements.map(el => `
                <div class="wuxing-item">
                    <div class="wuxing-bar">
                        <div class="wuxing-bar-fill ${el.class}" style="height: ${el.value}%"></div>
                    </div>
                    <div class="wuxing-name">${el.name}</div>
                    <div class="wuxing-value">${el.value}%</div>
                </div>
            `).join('');
        }

        // 主区域五行分析
        const analysis = document.querySelector('#wuxing-analysis');
        if (analysis && wuxing) {
            const sorted = Object.entries(wuxing).sort((a, b) => b[1] - a[1]);
            const names = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' };
            
            analysis.innerHTML = `
                <div class="wuxing-bars">
                    ${sorted.map(([key, value]) => `
                        <div class="wuxing-row">
                            <span class="label">${names[key]}</span>
                            <div class="bar-container">
                                <div class="bar" style="width: ${value}%"></div>
                            </div>
                            <span class="value">${value}%</span>
                        </div>
                    `).join('')}
                </div>
                <p class="wuxing-summary">
                    五行中 <strong>${names[sorted[0][0]]}</strong> 最旺，
                    <strong>${names[sorted[sorted.length - 1][0]]}</strong> 较弱。
                </p>
            `;
        }
    }

    displayInterpretation(interpretation) {
        const display = document.querySelector('#bazi-interpretation');
        if (!display || !interpretation) return;

        display.innerHTML = `
            <div class="interpretation-section">
                <h4>📝 综合评价</h4>
                <p>${interpretation.summary}</p>
            </div>
            <div class="interpretation-section">
                <h4>👤 性格特点</h4>
                <p>${interpretation.personality}</p>
            </div>
            <div class="interpretation-section">
                <h4>💼 事业方向</h4>
                <p>${interpretation.career}</p>
            </div>
            <div class="interpretation-section">
                <h4>💕 感情运势</h4>
                <p>${interpretation.relationship}</p>
            </div>
        `;

        // 更新侧边栏
        const summary = document.querySelector('#destiny-summary');
        if (summary) {
            summary.textContent = interpretation.summary;
        }
    }
}

// 初始化页面
window.addEventListener('DOMContentLoaded', () => {
    new BaziPage();
});