/**
 * Personality Service
 * Handles NPTI assessment and Horoscope logic.
 */
export class PersonalityService {
    constructor(eventBus) {
        this.eventBus = eventBus;
    }

    // 模拟获取今日运势
    getDailyHoroscope(sign) {
        const fortunes = [
            "今天适合尝试新事物，保持好奇心！",
            "情绪可能有些波动，记得深呼吸。",
            "与朋友交流会带来意想不到的灵感。",
            "专注于当下的任务，效率会倍增。"
        ];
        // 随机返回一条
        return fortunes[Math.floor(Math.random() * fortunes.length)];
    }

    // 模拟获取虚拟角色配置
    getCharacterProfile(age, nptiType) {
        if (age < 12) {
            return {
                name: "星愿兔",
                avatar: "🐰",
                tone: "playful",
                greeting: "你好呀！我是星愿兔，我们一起玩游戏吧！"
            };
        } else if (age < 18) {
            return {
                name: "阿光",
                avatar: "🧑‍🎤",
                tone: "empathetic",
                greeting: "Hey，我是阿光。最近有什么烦心事吗？"
            };
        } else {
            return {
                name: "Dr. Nova",
                avatar: "👩‍💼",
                tone: "professional",
                greeting: "你好，我是Nova。希望能为你提供一些专业的支持。"
            };
        }
    }
}