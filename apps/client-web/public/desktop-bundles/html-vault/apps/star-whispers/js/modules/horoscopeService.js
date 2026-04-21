export class HoroscopeService {
    constructor() {
        this.fortunes = [
            "今天你的能量爆棚，适合挑战新的任务！",
            "宜静不宜动，适合读一本好书，沉淀心灵。",
            "可能会遇到意想不到的惊喜，保持微笑哦。",
            "人际关系运势上升，快去和老朋友打个招呼吧。",
            "财运不错，但要注意理性消费。",
            "灵感涌现的一天，快把你的想法记录下来！"
        ];
    }

    getDailyFortune(zodiac) {
        // 简单的随机模拟，实际项目可对接第三方API
        const randomIndex = Math.floor(Math.random() * this.fortunes.length);
        const fortune = this.fortunes[randomIndex];
        
        return {
            zodiac: zodiac,
            date: new Date().toLocaleDateString(),
            content: fortune,
            luckyColor: this.getLuckyColor(),
            luckyNumber: Math.floor(Math.random() * 10)
        };
    }

    getLuckyColor() {
        const colors = ['红色', '蓝色', '金色', '紫色', '绿色', '白色'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
}