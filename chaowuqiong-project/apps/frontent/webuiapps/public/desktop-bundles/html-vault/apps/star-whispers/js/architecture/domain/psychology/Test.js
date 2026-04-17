/**
 * 测试实体 (Test)
 * 心理测试的基础定义
 */

export class Test {
    static CATEGORIES = {
        PERSONALITY: 'personality',     // 性格测试
        EMOTION: 'emotion',             // 情感测试
        CAREER: 'career',               // 职业测试
        MENTAL: 'mental',               // 心理健康
        FUN: 'fun'                      // 趣味测试
    };

    static TYPES = {
        MBTI: 'mbti',
        NPTI: 'npti',
        BIG5: 'big5',
        ENNEAGRAM: 'enneagram',
        DISC: 'disc',
        CUSTOM: 'custom'
    };

    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.title = data.title || '未命名测试';
        this.description = data.description || '';
        this.category = data.category || Test.CATEGORIES.PERSONALITY;
        this.type = data.type || Test.TYPES.CUSTOM;
        this.questions = data.questions || [];
        this.scoringRules = data.scoringRules || {};
        this.duration = data.duration || 10; // 预计完成时间(分钟)
        this.questionCount = data.questionCount || this.questions.length;
        this.difficulty = data.difficulty || 'medium'; // easy, medium, hard
        this.tags = data.tags || [];
        this.isFree = data.isFree !== undefined ? data.isFree : true;
        this.popularity = data.popularity || 0;
        this.createdAt = data.createdAt || new Date();
    }

    /**
     * 生成ID
     */
    generateId() {
        return 'test_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 添加问题
     */
    addQuestion(question) {
        this.questions.push(question);
        this.questionCount = this.questions.length;
    }

    /**
     * 获取问题数量
     */
    getQuestionCount() {
        return this.questions.length;
    }

    /**
     * 获取分类标签
     */
    getCategoryLabel() {
        const labels = {
            personality: '性格测试',
            emotion: '情感测试',
            career: '职业测试',
            mental: '心理健康',
            fun: '趣味测试'
        };
        return labels[this.category] || '其他';
    }

    /**
     * 转换为JSON
     */
    toJSON() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            category: this.category,
            categoryLabel: this.getCategoryLabel(),
            type: this.type,
            questionCount: this.questionCount,
            duration: this.duration,
            difficulty: this.difficulty,
            tags: this.tags,
            isFree: this.isFree,
            popularity: this.popularity
        };
    }
}