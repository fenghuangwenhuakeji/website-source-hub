/**
 * 八字命理模块 - 专业版
 * 使用 BaziDataLoader 进行准确的四柱计算
 */

class BaziPage {
    constructor() {
        this.currentResult = null;
        this.initUI();
        this.bindEvents();
    }

    initUI() {
        this.initDateSelectors();
    }

    initDateSelectors() {
        const yearSelect = document.querySelector('#birth-year');
        const monthSelect = document.querySelector('#birth-month');
        const daySelect = document.querySelector('#birth-day');
        const hourSelect = document.querySelector('#birth-hour');

        if (yearSelect) {
            const currentYear = new Date().getFullYear();
            for (let year = currentYear; year >= 1950; year--) {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = `${year}年`;
                yearSelect.appendChild(option);
            }
        }

        if (monthSelect) {
            for (let month = 1; month <= 12; month++) {
                const option = document.createElement('option');
                option.value = month;
                option.textContent = `${month}月`;
                monthSelect.appendChild(option);
            }
        }

        if (daySelect) {
            for (let day = 1; day <= 31; day++) {
                const option = document.createElement('option');
                option.value = day;
                option.textContent = `${day}日`;
                daySelect.appendChild(option);
            }
        }

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
        document.querySelector('#analyze-btn')?.addEventListener('click', () => this.analyze());
    }

    analyze() {
        const year = parseInt(document.querySelector('#birth-year')?.value);
        const month = parseInt(document.querySelector('#birth-month')?.value);
        const day = parseInt(document.querySelector('#birth-day')?.value);
        const hour = parseInt(document.querySelector('#birth-hour')?.value);

        if (!year || !month || !day) {
            alert('请填写完整的出生日期');
            return;
        }

        // 使用 BaziDataLoader 进行专业计算
        if (typeof BaziDataLoader !== 'undefined') {
            this.currentResult = this.calculateWithBaziDataLoader(year, month, day, hour);
        } else {
            // 回退到简化计算
            this.currentResult = this.getMockResult(year, month, day, hour);
        }
        
        this.displayResult(this.currentResult);
    }

    /**
     * 使用 BaziDataLoader 进行专业计算
     */
    calculateWithBaziDataLoader(year, month, day, hour) {
        // 计算四柱
        const siZhu = BaziDataLoader.calculateSiZhu(year, month, day, hour);
        
        // 计算五行
        const wuXing = BaziDataLoader.calculateWuXing(siZhu);
        
        // 计算十神
        const shiShen = BaziDataLoader.calculateShiShen(siZhu);
        
        // 计算神煞
        const shenSha = BaziDataLoader.calculateShenSha(siZhu);
        
        // 获取纳音
        const naYin = {
            year: BaziDataLoader.getNaYin(siZhu.year.gan, siZhu.year.zhi),
            month: BaziDataLoader.getNaYin(siZhu.month.gan, siZhu.month.zhi),
            day: BaziDataLoader.getNaYin(siZhu.day.gan, siZhu.day.zhi),
            hour: BaziDataLoader.getNaYin(siZhu.hour.gan, siZhu.hour.zhi)
        };

        // 格式化五行数据用于显示
        const wuXingDisplay = {
            wood: wuXing.percentages['木'] || 0,
            fire: wuXing.percentages['火'] || 0,
            earth: wuXing.percentages['土'] || 0,
            metal: wuXing.percentages['金'] || 0,
            water: wuXing.percentages['水'] || 0
        };

        // 生成解读
        const interpretation = this.generateInterpretation(siZhu, wuXing, shenSha);

        return {
            fourPillars: {
                year: { gan: siZhu.year.gan, zhi: siZhu.year.zhi },
                month: { gan: siZhu.month.gan, zhi: siZhu.month.zhi },
                day: { gan: siZhu.day.gan, zhi: siZhu.day.zhi },
                hour: { gan: siZhu.hour.gan, zhi: siZhu.hour.zhi }
            },
            wuXing: wuXingDisplay,
            shiShen,
            shenSha,
            naYin,
            interpretation
        };
    }

    /**
     * 生成命理解读
     */
    generateInterpretation(siZhu, wuXing, shenSha) {
        const dayGan = siZhu.day.gan;
        const dayElement = BaziDataLoader.tianGanWuXing[dayGan];
        const dayNature = BaziDataLoader.tianGanYinYang[dayGan];

        // 性格分析
        let personality = '';
        const elementTraits = {
            '木': '仁慈善良，富有同情心，喜欢帮助他人',
            '火': '热情开朗，积极进取，具有领导才能',
            '土': '稳重踏实，诚实守信，有责任感',
            '金': '果断坚毅，讲究原则，追求完美',
            '水': '聪明灵活，善于变通，富有智慧'
        };
        personality = `日主${dayGan}${dayNature}${dayElement}，${elementTraits[dayElement] || ''}`;

        // 五行旺衰分析
        let wuXingAnalysis = '';
        if (wuXing.strong.length > 0) {
            wuXingAnalysis += `五行中${wuXing.strong.join('、')}较旺`;
        }
        if (wuXing.weak.length > 0) {
            wuXingAnalysis += `，${wuXing.weak.join('、')}偏弱`;
        }

        // 事业方向
        let career = '';
        const careerByElement = {
            '木': '适合从事教育、文化、艺术、医疗等行业发展',
            '火': '适合从事科技、电子、能源、传媒等行业',
            '土': '适合从事房地产、建筑、农业、金融等行业',
            '金': '适合从事法律、金融、机械、军警等行业',
            '水': '适合从事贸易、物流、旅游、咨询等行业'
        };
        career = careerByElement[dayElement] || '适合从事适合自己的行业发展';

        // 神煞影响
        let shenShaEffect = '';
        if (shenSha.length > 0) {
            const auspicious = shenSha.filter(s => s.level === '大吉' || s.level === '吉');
            if (auspicious.length > 0) {
                shenShaEffect = `命中带${auspicious.map(s => s.name).join('、')}，${auspicious[0].effect}`;
            }
        }

        return {
            summary: `${dayGan}${dayNature}${dayElement}日主，${wuXingAnalysis}`,
            personality,
            career,
            relationship: shenShaEffect || '感情方面需要多加经营，真诚对待感情',
            shenShaEffect
        };
    }

    getMockResult(year, month, day, hour) {
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
        const resultArea = document.querySelector('#bazi-result');
        if (resultArea) resultArea.style.display = 'block';

        this.displayFourPillars(result.fourPillars);
        this.displayWuxing(result.wuXing);
        this.displayInterpretation(result.interpretation);
        
        // 显示神煞信息（如果有）
        if (result.shenSha && result.shenSha.length > 0) {
            this.displayShenSha(result.shenSha);
        }
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

    displayShenSha(shenSha) {
        const container = document.querySelector('#shensha-display');
        if (!container || !shenSha) return;

        container.innerHTML = `
            <div class="shensha-section">
                <h4>🌟 神煞</h4>
                <div class="shensha-list">
                    ${shenSha.map(s => `
                        <div class="shensha-item ${s.level}">
                            <span class="name">${s.name}</span>
                            <span class="effect">${s.effect}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
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

        const summary = document.querySelector('#destiny-summary');
        if (summary) summary.textContent = interpretation.summary;
    }
}

window.addEventListener('DOMContentLoaded', () => { new BaziPage(); });