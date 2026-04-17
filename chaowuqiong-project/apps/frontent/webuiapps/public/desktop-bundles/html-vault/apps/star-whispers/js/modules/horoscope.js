/**
 * Horoscope Module
 * 星座运势与情感智能
 */

const HOROSCOPES = [
    '白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座',
    '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'
];

const FORTUNES = [
    { stars: 5, text: "今天能量爆棚，适合挑战新事物！" },
    { stars: 4, text: "心情不错，记得和朋友分享快乐。" },
    { stars: 3, text: "平平淡淡才是真，享受安静的时光。" },
    { stars: 2, text: "可能会有些小挫折，深呼吸，你可以的。" }
];

class HoroscopeModule {
    getDailyFortune(sign) {
        // 简单模拟：根据日期和星座生成随机运势
        const today = new Date().getDate();
        const index = (today + HOROSCOPES.indexOf(sign)) % FORTUNES.length;
        return FORTUNES[index];
    }

    getAllSigns() {
        return HOROSCOPES;
    }
}

export const horoscopeManager = new HoroscopeModule();