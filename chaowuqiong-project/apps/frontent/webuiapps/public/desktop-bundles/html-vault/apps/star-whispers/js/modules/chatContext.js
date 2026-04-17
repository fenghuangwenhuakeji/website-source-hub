import { HOROSCOPE_DATA } from '../data/horoscope_data.js';

export class ChatContext {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.messages = [];
        this.isTyping = false;
    }

    sendWelcomeMessage(profile, signKey) {
        const ageGroup = profile.ageGroup || 'adult';
        const signName = HOROSCOPE_DATA[signKey]?.name || '朋友';
        let text = '';

        if (ageGroup === 'child') {
            text = `你好呀！我是你的${signName}守护精灵！我们可以一起玩游戏、讲故事哦！`;
        } else if (ageGroup === 'teen') {
            text = `嘿，${signName}的伙伴！我是懂你的AI星友。最近学校里有什么好玩的事吗？或者聊聊星座运势？`;
        } else {
            text = `你好。作为${signName}的专属心理顾问，我已准备好倾听你的心声。无论是职场压力还是情感困惑，我都在这里。`;
        }

        const aiMsg = { role: 'ai', content: text, timestamp: new Date() };
        this.messages.push(aiMsg);
        this.eventBus.emit('chat:newMessage', aiMsg);
    }

    sendMessage(text, userProfile) {
        if (!text.trim()) return;
        const userMsg = { role: 'user', content: text, timestamp: new Date() };
        this.messages.push(userMsg);
        this.eventBus.emit('chat:newMessage', userMsg);

        this.isTyping = true;
        this.eventBus.emit('chat:typing', true);

        setTimeout(() => {
            this.generateResponse(text, userProfile);
        }, 1000 + Math.random() * 1000);
    }

    generateResponse(input, profile) {
        let responseText = "";
        const ageGroup = profile.ageGroup || 'adult';

        if (ageGroup === 'child') {
            responseText = `你真棒！${input.includes('不开心') ? '别难过，吃颗糖会好一点吗？' : '这太有趣了！再多和我说说！'}`;
        } else if (ageGroup === 'teen') {
            responseText = `我理解。${input.includes('烦') ? '这种时候确实很烦人，深呼吸一下？' : '你的想法很独特，现在的年轻人很有主见。'}`;
        } else {
            responseText = `在这个阶段，这种感受很正常。${input.includes('累') ? '生活节奏确实很快，要注意劳逸结合。' : '我们可以试着从另一个角度看这个问题。'}`;
        }

        const aiMsg = { role: 'ai', content: responseText, timestamp: new Date() };
        this.messages.push(aiMsg);
        this.isTyping = false;
        this.eventBus.emit('chat:typing', false);
        this.eventBus.emit('chat:newMessage', aiMsg);
    }
}