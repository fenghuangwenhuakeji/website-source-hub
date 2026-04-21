export class HoroscopeSystem {
    constructor(eventBus) {
        this.bus = eventBus;
        this.horoscopes = {
            '白羊座': '今天充满活力，适合开始新计划。',
            '金牛座': '财运不错，但也适合享受美食。',
            '双子座': '沟通能力爆表，适合社交。'
        };
    }

    getDailyHoroscope(sign) {
        return this.horoscopes[sign] || "今天也是充满希望的一天！";
    }
}