/**
 * 心理分析与测评服务
 * 负责 NPTI 测评逻辑和情绪数据追踪
 */
export class AnalysisService {
    constructor() {
        this.emotionHistory = [];
    }

    /**
     * 获取 NPTI 测评题目 (根据年龄段返回不同版本)
     */
    getNPTIQuestions(ageGroup) {
        if (ageGroup === 'CHILD') {
            return [
                { id: 1, type: 'image', question: '你更喜欢和小狗玩还是看书？', options: ['小狗', '看书'] },
                { id: 2, type: 'image', question: '如果朋友哭了，你会？', options: ['抱抱他', '给他糖果'] }
            ];
        }
        return [
            { id: 1, type: 'scale', question: '我在社交场合感到充满活力', options: [1, 2, 3, 4, 5] },
            { id: 2, type: 'scale', question: '我倾向于按计划行事而不是随性而为', options: [1, 2, 3, 4, 5] }
        ];
    }

    /**
     * 提交测评结果并计算人格
     */
    calculatePersonality(answers, ageGroup) {
        // 模拟计算过程
        console.log('Calculating personality for:', ageGroup, answers);
        return {
            type: 'ENFP',
            label: ageGroup === 'CHILD' ? '快乐的小探险家' : '竞选者型人格',
            description: '你充满热情，富有想象力。'
        };
    }

    /**
     * 记录情绪状态
     */
    logEmotion(emotion, intensity) {
        const record = {
            timestamp: new Date().toISOString(),
            emotion,
            intensity
        };
        this.emotionHistory.push(record);
        // TODO: 持久化到 Storage
        return record;
    }
}