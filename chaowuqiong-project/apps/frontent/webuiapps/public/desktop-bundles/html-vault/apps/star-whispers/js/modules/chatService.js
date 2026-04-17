import { SecurityService } from '../security/securityService.js';

export class ChatService {
    constructor(eventBus, userDomain) {
        this.eventBus = eventBus;
        this.userDomain = userDomain;
        this.securityService = new SecurityService();
        this.isProcessing = false;
    }

    async sendMessage(text) {
        if (!text.trim() || this.isProcessing) return;

        this.isProcessing = true;
        const user = this.userDomain.currentUser;
        
        // 1. 广播用户消息
        this.eventBus.emit('chat:message_sent', { 
            sender: 'user', 
            content: text, 
            timestamp: new Date() 
        });

        try {
            // 2. 安全检查
            const safetyCheck = this.securityService.checkContent(text);
            if (!safetyCheck.safe) {
                const ageGroup = this.getAgeGroup(user.age);
                const safeReply = this.securityService.getSafeReply(ageGroup);
                this.simulateReply(safeReply);
                return;
            }

            // 3. 模拟 AI 响应 (后续接入真实 LLM)
            await this.mockLLMResponse(text, user);

        } catch (error) {
            console.error('Chat Error:', error);
            this.simulateReply('抱歉，我现在有点累了，请稍后再试。');
        } finally {
            this.isProcessing = false;
        }
    }

    async mockLLMResponse(text, user) {
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

        const ageGroup = this.getAgeGroup(user.age);
        let reply = '';

        // 简单的规则引擎
        if (text.includes('你好') || text.includes('hi')) {
            reply = this.getGreeting(ageGroup, user.name);
        } else if (text.includes('星座') || text.includes('运势')) {
            reply = `作为${user.zodiac}的朋友，你今天的运势看起来不错哦！保持自信，好运会伴随你的。`;
        } else if (text.includes('不开心') || text.includes('难过')) {
            reply = this.getComfort(ageGroup);
        } else {
            reply = this.getDefaultReply(ageGroup);
        }

        this.simulateReply(reply);
    }

    simulateReply(content) {
        this.eventBus.emit('chat:message_received', {
            sender: 'ai',
            content: content,
            timestamp: new Date()
        });
    }

    getAgeGroup(age) {
        if (age < 12) return 'child';
        if (age < 18) return 'teen';
        return 'adult';
    }

    getGreeting(group, name) {
        if (group === 'child') return `你好呀 ${name}！我是你的新朋友，我们可以一起玩游戏或者讲故事哦！`;
        if (group === 'teen') return `Hey ${name}，很高兴认识你。最近学校里有什么好玩的事吗？`;
        return `你好 ${name}。我是星语心伴，希望能为你提供支持和帮助。`;
    }

    getComfort(group) {
        if (group === 'child') return '抱抱你~ 不开心的时候可以吃颗糖，或者告诉我发生了什么？';
        if (group === 'teen') return '看起来你今天过得不太顺利？没关系，青春就是这样起起伏伏的，我在听。';
        return '我理解你的感受。情绪低落是正常的，试着深呼吸，我们慢慢分析一下原因好吗？';
    }

    getDefaultReply(group) {
        if (group === 'child') return '你说的话真有趣！再多和我说说吧！';
        if (group === 'teen') return '嗯嗯，我明白了。这对你来说意味着什么呢？';
        return '这是一个很有趣的观点。我们可以深入探讨一下这个话题。';
    }
}