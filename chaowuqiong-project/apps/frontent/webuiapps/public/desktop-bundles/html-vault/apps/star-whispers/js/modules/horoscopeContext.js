import { userContext } from './userContext.js';

class HoroscopeContext {
    constructor() {
        this.horoscopes = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
    }

    getDailyFortune(sign) {
        // 模拟运势生成
        const fortunes = [
            "今天适合尝试新事物！",
            "情绪可能会有波动，记得深呼吸。",
            "以前的努力今天会看到回报。",
            "适合与朋友倾诉心声。"
        ];
        return fortunes[Math.floor(Math.random() * fortunes.length)];
    }

    // 根据星座调整对话风格 (供 ChatContext 调用)
    augmentPrompt(basePrompt, sign) {
        const traits = {
            aries: "热情直接",
            cancer: "温柔敏感",
            scorpio: "深刻洞察"
        };
        return `${basePrompt} (请保持${traits[sign] || '平和'}的语气)`;
    }
}

export const horoscopeContext = new HoroscopeContext();