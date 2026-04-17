/**
 * 心理测试题库 - Test Repository
 * 包含各类心理测试题目
 */

export class TestRepository {
    constructor() {
        this.categories = this.initCategories();
        this.tests = this.initTests();
    }

    /**
     * 初始化测试分类
     */
    initCategories() {
        return [
            {
                id: 'personality',
                name: '性格测试',
                icon: '🎭',
                description: '探索你的性格特质',
                testCount: 5
            },
            {
                id: 'emotion',
                name: '情感测试',
                icon: '❤️',
                description: '了解你的情感世界',
                testCount: 5
            },
            {
                id: 'career',
                name: '职业测试',
                icon: '💼',
                description: '发现你的职业倾向',
                testCount: 5
            },
            {
                id: 'mental',
                name: '心理健康',
                icon: '🧠',
                description: '关注你的心理状态',
                testCount: 5
            },
            {
                id: 'fun',
                name: '趣味测试',
                icon: '🎮',
                description: '轻松有趣的测试',
                testCount: 5
            }
        ];
    }

    /**
     * 初始化测试数据
     */
    initTests() {
        return [
            // ==================== 性格测试 ====================
            {
                id: 'mbti',
                title: 'MBTI 人格测试',
                shortTitle: 'MBTI',
                description: '探索你的16型人格类型，了解你的性格偏好',
                categoryId: 'personality',
                icon: '🎭',
                duration: '15-20分钟',
                questionCount: 60,
                difficulty: 2,
                tags: ['性格', '人格', '经典'],
                questions: this.generateMBTIQuestions(),
                scoringMethod: 'mbti'
            },
            {
                id: 'bigfive',
                title: '大五人格测试',
                shortTitle: '大五人格',
                description: '科学测量你的人格五因素：开放性、尽责性、外向性、宜人性、神经质',
                categoryId: 'personality',
                icon: '⭐',
                duration: '10-15分钟',
                questionCount: 50,
                difficulty: 2,
                tags: ['性格', '科学', '专业'],
                questions: this.generateBigFiveQuestions(),
                scoringMethod: 'bigfive'
            },
            {
                id: 'enneagram',
                title: '九型人格测试',
                shortTitle: '九型人格',
                description: '发现你的九型人格类型，了解你的核心动机和恐惧',
                categoryId: 'personality',
                icon: '🔢',
                duration: '15-20分钟',
                questionCount: 45,
                difficulty: 2,
                tags: ['性格', '人格', '经典'],
                questions: this.generateEnneagramQuestions(),
                scoringMethod: 'enneagram'
            },
            {
                id: 'disc',
                title: 'DISC 性格测试',
                shortTitle: 'DISC',
                description: '了解你的行为风格：支配型、影响型、稳健型、服从型',
                categoryId: 'personality',
                icon: '📊',
                duration: '10-15分钟',
                questionCount: 28,
                difficulty: 1,
                tags: ['性格', '职场', '沟通'],
                questions: this.generateDISCQuestions(),
                scoringMethod: 'disc'
            },
            {
                id: 'npti',
                title: 'NPTI 人格测试',
                shortTitle: 'NPTI',
                description: '星语心伴独创的人格类型指标，融合心理学与星座特质',
                categoryId: 'personality',
                icon: '✨',
                duration: '15-20分钟',
                questionCount: 50,
                difficulty: 2,
                tags: ['性格', '星座', 'AI'],
                questions: this.generateNPTIQuestions(),
                scoringMethod: 'npti'
            },

            // ==================== 情感测试 ====================
            {
                id: 'love-language',
                title: '爱的五种语言',
                shortTitle: '爱的语言',
                description: '发现你表达和接受爱的方式',
                categoryId: 'emotion',
                icon: '💕',
                duration: '10-15分钟',
                questionCount: 30,
                difficulty: 1,
                tags: ['爱情', '关系', '经典'],
                questions: this.generateLoveLanguageQuestions(),
                scoringMethod: 'love-language'
            },
            {
                id: 'attachment',
                title: '依恋类型测试',
                shortTitle: '依恋类型',
                description: '了解你在亲密关系中的依恋风格',
                categoryId: 'emotion',
                icon: '🔗',
                duration: '10分钟',
                questionCount: 36,
                difficulty: 2,
                tags: ['爱情', '关系', '心理'],
                questions: this.generateAttachmentQuestions(),
                scoringMethod: 'attachment'
            },
            {
                id: 'eq',
                title: '情商 EQ 测试',
                shortTitle: '情商测试',
                description: '测量你的情绪智力水平',
                categoryId: 'emotion',
                icon: '❤️',
                duration: '15分钟',
                questionCount: 40,
                difficulty: 2,
                tags: ['情商', '情绪', '能力'],
                questions: this.generateEQQuestions(),
                scoringMethod: 'eq'
            },
            {
                id: 'relationship',
                title: '亲密关系评估',
                shortTitle: '亲密关系',
                description: '评估你当前亲密关系的健康程度',
                categoryId: 'emotion',
                icon: '💑',
                duration: '10分钟',
                questionCount: 25,
                difficulty: 1,
                tags: ['爱情', '关系', '评估'],
                questions: this.generateRelationshipQuestions(),
                scoringMethod: 'relationship'
            },
            {
                id: 'marriage',
                title: '婚姻准备度测试',
                shortTitle: '婚姻准备',
                description: '评估你是否准备好进入婚姻',
                categoryId: 'emotion',
                icon: '💍',
                duration: '15分钟',
                questionCount: 35,
                difficulty: 2,
                tags: ['婚姻', '准备', '评估'],
                questions: this.generateMarriageQuestions(),
                scoringMethod: 'marriage'
            },

            // ==================== 职业测试 ====================
            {
                id: 'holland',
                title: '霍兰德职业兴趣测试',
                shortTitle: '霍兰德',
                description: '发现你的职业兴趣类型：RIASEC',
                categoryId: 'career',
                icon: '🎯',
                duration: '15分钟',
                questionCount: 48,
                difficulty: 2,
                tags: ['职业', '兴趣', '经典'],
                questions: this.generateHollandQuestions(),
                scoringMethod: 'holland'
            },
            {
                id: 'career-value',
                title: '职业价值观测试',
                shortTitle: '职业价值观',
                description: '了解你在工作中最看重的价值',
                categoryId: 'career',
                icon: '⚖️',
                duration: '10分钟',
                questionCount: 30,
                difficulty: 1,
                tags: ['职业', '价值观', '选择'],
                questions: this.generateCareerValueQuestions(),
                scoringMethod: 'career-value'
            },
            {
                id: 'work-stress',
                title: '工作压力测试',
                shortTitle: '工作压力',
                description: '评估你的工作压力水平',
                categoryId: 'career',
                icon: '📈',
                duration: '10分钟',
                questionCount: 25,
                difficulty: 1,
                tags: ['工作', '压力', '评估'],
                questions: this.generateWorkStressQuestions(),
                scoringMethod: 'work-stress'
            },
            {
                id: 'career-anchor',
                title: '职业锚测试',
                shortTitle: '职业锚',
                description: '发现你的职业锚点，了解你的职业驱动力',
                categoryId: 'career',
                icon: '⚓',
                duration: '15分钟',
                questionCount: 40,
                difficulty: 2,
                tags: ['职业', '方向', '规划'],
                questions: this.generateCareerAnchorQuestions(),
                scoringMethod: 'career-anchor'
            },
            {
                id: 'leadership',
                title: '领导力测试',
                shortTitle: '领导力',
                description: '评估你的领导力水平和风格',
                categoryId: 'career',
                icon: '👔',
                duration: '15分钟',
                questionCount: 35,
                difficulty: 2,
                tags: ['领导', '管理', '能力'],
                questions: this.generateLeadershipQuestions(),
                scoringMethod: 'leadership'
            },

            // ==================== 心理健康 ====================
            {
                id: 'anxiety',
                title: '焦虑自评量表 (SAS)',
                shortTitle: '焦虑自评',
                description: '评估你的焦虑水平',
                categoryId: 'mental',
                icon: '😰',
                duration: '5分钟',
                questionCount: 20,
                difficulty: 1,
                tags: ['焦虑', '评估', '专业'],
                questions: this.generateAnxietyQuestions(),
                scoringMethod: 'anxiety'
            },
            {
                id: 'depression',
                title: '抑郁自评量表 (SDS)',
                shortTitle: '抑郁自评',
                description: '评估你的抑郁倾向',
                categoryId: 'mental',
                icon: '😔',
                duration: '5分钟',
                questionCount: 20,
                difficulty: 1,
                tags: ['抑郁', '评估', '专业'],
                questions: this.generateDepressionQuestions(),
                scoringMethod: 'depression'
            },
            {
                id: 'stress',
                title: '心理压力测试',
                shortTitle: '压力测试',
                description: '评估你的整体心理压力水平',
                categoryId: 'mental',
                icon: '🔥',
                duration: '5分钟',
                questionCount: 20,
                difficulty: 1,
                tags: ['压力', '评估', '心理'],
                questions: this.generateStressQuestions(),
                scoringMethod: 'stress'
            },
            {
                id: 'sleep',
                title: '睡眠质量测试',
                shortTitle: '睡眠质量',
                description: '评估你的睡眠质量',
                categoryId: 'mental',
                icon: '😴',
                duration: '5分钟',
                questionCount: 19,
                difficulty: 1,
                tags: ['睡眠', '健康', '评估'],
                questions: this.generateSleepQuestions(),
                scoringMethod: 'sleep'
            },
            {
                id: 'resilience',
                title: '心理韧性测试',
                shortTitle: '心理韧性',
                description: '评估你面对困难时的心理韧性',
                categoryId: 'mental',
                icon: '💪',
                duration: '10分钟',
                questionCount: 25,
                difficulty: 1,
                tags: ['韧性', '抗压', '成长'],
                questions: this.generateResilienceQuestions(),
                scoringMethod: 'resilience'
            },

            // ==================== 趣味测试 ====================
            {
                id: 'mental-age',
                title: '心理年龄测试',
                shortTitle: '心理年龄',
                description: '测测你的心理年龄有多大',
                categoryId: 'fun',
                icon: '🎂',
                duration: '5分钟',
                questionCount: 20,
                difficulty: 1,
                tags: ['趣味', '年龄', '心理'],
                questions: this.generateMentalAgeQuestions(),
                scoringMethod: 'mental-age'
            },
            {
                id: 'subconscious',
                title: '潜意识测试',
                shortTitle: '潜意识',
                description: '探索你的潜意识世界',
                categoryId: 'fun',
                icon: '🔮',
                duration: '5分钟',
                questionCount: 15,
                difficulty: 1,
                tags: ['趣味', '潜意识', '探索'],
                questions: this.generateSubconsciousQuestions(),
                scoringMethod: 'subconscious'
            },
            {
                id: 'color',
                title: '色彩心理测试',
                shortTitle: '色彩心理',
                description: '通过颜色选择了解你的心理状态',
                categoryId: 'fun',
                icon: '🎨',
                duration: '5分钟',
                questionCount: 10,
                difficulty: 1,
                tags: ['趣味', '颜色', '心理'],
                questions: this.generateColorQuestions(),
                scoringMethod: 'color'
            },
            {
                id: 'inner-child',
                title: '内在小孩测试',
                shortTitle: '内在小孩',
                description: '发现你内心的那个孩子',
                categoryId: 'fun',
                icon: '👶',
                duration: '10分钟',
                questionCount: 25,
                difficulty: 1,
                tags: ['趣味', '内在', '成长'],
                questions: this.generateInnerChildQuestions(),
                scoringMethod: 'inner-child'
            },
            {
                id: 'life-stage',
                title: '人生阶段测试',
                shortTitle: '人生阶段',
                description: '了解你当前处于人生的哪个阶段',
                categoryId: 'fun',
                icon: '🌟',
                duration: '10分钟',
                questionCount: 20,
                difficulty: 1,
                tags: ['趣味', '人生', '阶段'],
                questions: this.generateLifeStageQuestions(),
                scoringMethod: 'life-stage'
            }
        ];
    }

    /**
     * 获取分类列表
     */
    getCategories() {
        return this.categories;
    }

    /**
     * 获取测试列表
     */
    getTestList(categoryId = null) {
        if (categoryId) {
            return this.tests.filter(t => t.categoryId === categoryId);
        }
        return this.tests.map(t => ({
            id: t.id,
            title: t.title,
            shortTitle: t.shortTitle,
            description: t.description,
            categoryId: t.categoryId,
            icon: t.icon,
            duration: t.duration,
            questionCount: t.questionCount,
            difficulty: t.difficulty,
            tags: t.tags
        }));
    }

    /**
     * 获取测试详情
     */
    getTest(testId) {
        return this.tests.find(t => t.id === testId);
    }

    // ==================== 生成各类测试题目 ====================

    /**
     * MBTI 问题
     */
    generateMBTIQuestions() {
        const pairs = [
            ['社交聚会时，你通常', '与许多人交流', '只与几个人深入交流', 'E', 'I'],
            ['面对新任务时，你更倾向于', '立即行动', '先深思熟虑', 'E', 'I'],
            ['周末时，你更喜欢', '与朋友外出', '在家独处放松', 'E', 'I'],
            ['在团队中，你通常是', '积极的参与者', '安静的观察者', 'E', 'I'],
            ['你更容易注意到', '眼前的实际情况', '未来的可能性', 'S', 'N'],
            ['你更信任', '自己的经验', '自己的直觉', 'S', 'N'],
            ['阅读时，你更喜欢', '具体的事实描述', '抽象的理论探讨', 'S', 'N'],
            ['解决问题时，你更依赖', '已证实的方法', '创新的思路', 'S', 'N'],
            ['做决定时，你更看重', '逻辑分析', '个人感受', 'T', 'F'],
            ['你更注重', '公正客观', '和谐友善', 'T', 'F'],
            ['批评别人时，你会', '直言不讳', '委婉表达', 'T', 'F'],
            ['你更欣赏', '理性的人', '感性的人', 'T', 'F'],
            ['处理事情时，你更倾向于', '按计划进行', '随机应变', 'J', 'P'],
            ['你的生活方式更偏向于', '有规律有秩序', '灵活随性', 'J', 'P'],
            ['完成工作时，你更喜欢', '提前完成', '在截止日期前完成', 'J', 'P']
        ];

        return pairs.map((pair, index) => ({
            index,
            question: pair[0],
            options: [
                { text: pair[1], value: pair[2], dimension: pair[2] },
                { text: pair[2], value: pair[3], dimension: pair[3] }
            ],
            dimension: pair[4]
        }));
    }

    /**
     * 大五人格问题
     */
    generateBigFiveQuestions() {
        const questions = [
            { text: '我是那种喜欢与人交往的人', dimension: 'E', reverse: false },
            { text: '我经常感到沮丧或消沉', dimension: 'N', reverse: false },
            { text: '我非常注重细节', dimension: 'C', reverse: false },
            { text: '我对新事物充满好奇', dimension: 'O', reverse: false },
            { text: '我乐于帮助他人', dimension: 'A', reverse: false },
            { text: '我喜欢成为派对的焦点', dimension: 'E', reverse: false },
            { text: '我很容易紧张', dimension: 'N', reverse: false },
            { text: '我总是按时完成任务', dimension: 'C', reverse: false },
            { text: '我喜欢抽象思维', dimension: 'O', reverse: false },
            { text: '我经常为他人着想', dimension: 'A', reverse: false }
        ];

        return questions.map((q, index) => ({
            index,
            question: q.text,
            options: [
                { text: '完全不同意', value: 1 },
                { text: '不同意', value: 2 },
                { text: '中立', value: 3 },
                { text: '同意', value: 4 },
                { text: '完全同意', value: 5 }
            ],
            dimension: q.dimension,
            reverse: q.reverse
        }));
    }

    /**
     * 九型人格问题
     */
    generateEnneagramQuestions() {
        const questions = [
            { text: '我追求完美，对自己要求严格', type: 1 },
            { text: '我渴望被爱和被需要', type: 2 },
            { text: '我追求成功和成就', type: 3 },
            { text: '我感觉自己与众不同', type: 4 },
            { text: '我喜欢观察和分析', type: 5 },
            { text: '我注重安全和稳定', type: 6 },
            { text: '我喜欢自由和冒险', type: 7 },
            { text: '我喜欢掌控局面', type: 8 },
            { text: '我追求和平与和谐', type: 9 }
        ];

        return questions.flatMap((q, index) => [{
            index: index * 5,
            question: q.text,
            options: [
                { text: '非常不符合', value: 1, type: q.type },
                { text: '不太符合', value: 2, type: q.type },
                { text: '一般', value: 3, type: q.type },
                { text: '比较符合', value: 4, type: q.type },
                { text: '非常符合', value: 5, type: q.type }
            ]
        }]);
    }

    /**
     * DISC 问题
     */
    generateDISCQuestions() {
        const questions = [
            { text: '面对挑战时，我会', options: [
                { text: '直接面对，果断行动', type: 'D' },
                { text: '热情应对，积极乐观', type: 'I' },
                { text: '稳定处理，循序渐进', type: 'S' },
                { text: '仔细分析，确保准确', type: 'C' }
            ]},
            { text: '在团队中，我倾向于', options: [
                { text: '领导决策', type: 'D' },
                { text: '活跃气氛', type: 'I' },
                { text: '支持配合', type: 'S' },
                { text: '分析规划', type: 'C' }
            ]},
            { text: '与人沟通时，我更注重', options: [
                { text: '结果和效率', type: 'D' },
                { text: '关系和氛围', type: 'I' },
                { text: '理解和共识', type: 'S' },
                { text: '事实和细节', type: 'C' }
            ]}
        ];

        return questions.map((q, index) => ({
            index,
            question: q.text,
            options: q.options.map(o => ({ text: o.text, value: o.type }))
        }));
    }

    /**
     * NPTI 问题
     */
    generateNPTIQuestions() {
        return this.generateMBTIQuestions().slice(0, 50).map((q, i) => ({
            ...q,
            index: i,
            // 添加星座相关维度
            astroDimension: ['fire', 'earth', 'air', 'water'][i % 4]
        }));
    }

    /**
     * 爱的语言问题
     */
    generateLoveLanguageQuestions() {
        const languages = ['quality-time', 'words', 'gifts', 'service', 'touch'];
        const questions = [
            { text: '当我想表达爱时，我最可能', options: [
                { text: '花时间陪伴对方', value: 'quality-time' },
                { text: '说出爱的语言', value: 'words' },
                { text: '送一份礼物', value: 'gifts' },
                { text: '为对方做些事', value: 'service' },
                { text: '拥抱或牵手', value: 'touch' }
            ]}
        ];

        return Array(30).fill(null).map((_, i) => ({
            index: i,
            question: questions[0].text,
            options: questions[0].options.map(o => ({ text: o.text, value: o.value }))
        }));
    }

    /**
     * 依恋类型问题
     */
    generateAttachmentQuestions() {
        return Array(36).fill(null).map((_, i) => ({
            index: i,
            question: `关于亲密关系的第${i + 1}个问题`,
            options: [
                { text: '非常不同意', value: 1 },
                { text: '不同意', value: 2 },
                { text: '中立', value: 3 },
                { text: '同意', value: 4 },
                { text: '非常同意', value: 5 }
            ]
        }));
    }

    /**
     * 情商问题
     */
    generateEQQuestions() {
        return Array(40).fill(null).map((_, i) => ({
            index: i,
            question: `情商测试问题 ${i + 1}`,
            options: [
                { text: '从不', value: 1 },
                { text: '偶尔', value: 2 },
                { text: '有时', value: 3 },
                { text: '经常', value: 4 },
                { text: '总是', value: 5 }
            ]
        }));
    }

    /**
     * 亲密关系问题
     */
    generateRelationshipQuestions() {
        return Array(25).fill(null).map((_, i) => ({
            index: i,
            question: `亲密关系评估问题 ${i + 1}`,
            options: [
                { text: '完全不符合', value: 1 },
                { text: '不太符合', value: 2 },
                { text: '一般', value: 3 },
                { text: '比较符合', value: 4 },
                { text: '完全符合', value: 5 }
            ]
        }));
    }

    /**
     * 婚姻准备问题
     */
    generateMarriageQuestions() {
        return Array(35).fill(null).map((_, i) => ({
            index: i,
            question: `婚姻准备度问题 ${i + 1}`,
            options: [
                { text: '完全没准备好', value: 1 },
                { text: '不太确定', value: 2 },
                { text: '一般', value: 3 },
                { text: '基本准备好', value: 4 },
                { text: '完全准备好', value: 5 }
            ]
        }));
    }

    /**
     * 霍兰德问题
     */
    generateHollandQuestions() {
        const types = ['R', 'I', 'A', 'S', 'E', 'C'];
        return Array(48).fill(null).map((_, i) => ({
            index: i,
            question: `职业兴趣问题 ${i + 1}`,
            options: [
                { text: '非常不喜欢', value: 1, type: types[i % 6] },
                { text: '不喜欢', value: 2, type: types[i % 6] },
                { text: '一般', value: 3, type: types[i % 6] },
                { text: '喜欢', value: 4, type: types[i % 6] },
                { text: '非常喜欢', value: 5, type: types[i % 6] }
            ]
        }));
    }

    /**
     * 职业价值观问题
     */
    generateCareerValueQuestions() {
        return Array(30).fill(null).map((_, i) => ({
            index: i,
            question: `职业价值观问题 ${i + 1}`,
            options: [
                { text: '不重要', value: 1 },
                { text: '不太重要', value: 2 },
                { text: '一般', value: 3 },
                { text: '重要', value: 4 },
                { text: '非常重要', value: 5 }
            ]
        }));
    }

    /**
     * 工作压力问题
     */
    generateWorkStressQuestions() {
        return Array(25).fill(null).map((_, i) => ({
            index: i,
            question: `工作压力评估问题 ${i + 1}`,
            options: [
                { text: '从不', value: 1 },
                { text: '偶尔', value: 2 },
                { text: '有时', value: 3 },
                { text: '经常', value: 4 },
                { text: '总是', value: 5 }
            ]
        }));
    }

    /**
     * 职业锚问题
     */
    generateCareerAnchorQuestions() {
        return Array(40).fill(null).map((_, i) => ({
            index: i,
            question: `职业锚问题 ${i + 1}`,
            options: [
                { text: '完全不符合', value: 1 },
                { text: '不太符合', value: 2 },
                { text: '一般', value: 3 },
                { text: '比较符合', value: 4 },
                { text: '完全符合', value: 5 }
            ]
        }));
    }

    /**
     * 领导力问题
     */
    generateLeadershipQuestions() {
        return Array(35).fill(null).map((_, i) => ({
            index: i,
            question: `领导力评估问题 ${i + 1}`,
            options: [
                { text: '从不', value: 1 },
                { text: '偶尔', value: 2 },
                { text: '有时', value: 3 },
                { text: '经常', value: 4 },
                { text: '总是', value: 5 }
            ]
        }));
    }

    /**
     * 焦虑问题
     */
    generateAnxietyQuestions() {
        const symptoms = [
            '我感到比平时更紧张',
            '我无缘无故地感到害怕',
            '我容易心烦意乱',
            '我感觉可能会发疯',
            '我感觉一切都很顺利',
            '我的手脚发抖',
            '我为头痛、颈痛和背痛而烦恼',
            '我感觉容易疲乏',
            '我感觉心平气和',
            '我感觉心跳得很快',
            '我因阵阵头晕而苦恼',
            '我有晕倒发作的感觉',
            '我呼吸很顺畅',
            '我的手脚麻木和刺痛',
            '我因胃痛和消化不良而苦恼',
            '我经常要小便',
            '我的手脚通常是干燥温暖的',
            '我脸红发热',
            '我容易入睡',
            '我做噩梦'
        ];

        return symptoms.map((text, index) => ({
            index,
            question: text,
            options: [
                { text: '没有或很少时间', value: 1 },
                { text: '小部分时间', value: 2 },
                { text: '相当多时间', value: 3 },
                { text: '绝大部分或全部时间', value: 4 }
            ]
        }));
    }

    /**
     * 抑郁问题
     */
    generateDepressionQuestions() {
        const symptoms = [
            '我感到情绪沮丧',
            '我感到早晨心情最好',
            '我要哭或想哭',
            '我夜间睡眠不好',
            '我吃饭像平时一样多',
            '我对异性感兴趣',
            '我感到体重减轻',
            '我为便秘烦恼',
            '我的心跳比平时快',
            '我无故感到疲劳',
            '我的头脑像往常一样清楚',
            '我做事情像平时一样不感到困难',
            '我感到不安',
            '我对未来抱有希望',
            '我比平时更容易生气',
            '我觉得做出决定很容易',
            '我觉得自己是有用的人',
            '我的生活很有意义',
            '如果我死了别人会过得更好',
            '我仍然喜欢平时喜欢的东西'
        ];

        return symptoms.map((text, index) => ({
            index,
            question: text,
            options: [
                { text: '没有或很少时间', value: 1 },
                { text: '小部分时间', value: 2 },
                { text: '相当多时间', value: 3 },
                { text: '绝大部分或全部时间', value: 4 }
            ]
        }));
    }

    /**
     * 压力问题
     */
    generateStressQuestions() {
        return Array(20).fill(null).map((_, i) => ({
            index: i,
            question: `心理压力评估问题 ${i + 1}`,
            options: [
                { text: '从不', value: 1 },
                { text: '偶尔', value: 2 },
                { text: '有时', value: 3 },
                { text: '经常', value: 4 },
                { text: '总是', value: 5 }
            ]
        }));
    }

    /**
     * 睡眠问题
     */
    generateSleepQuestions() {
        return Array(19).fill(null).map((_, i) => ({
            index: i,
            question: `睡眠质量评估问题 ${i + 1}`,
            options: [
                { text: '没有', value: 1 },
                { text: '偶尔', value: 2 },
                { text: '有时', value: 3 },
                { text: '经常', value: 4 }
            ]
        }));
    }

    /**
     * 心理韧性问题
     */
    generateResilienceQuestions() {
        return Array(25).fill(null).map((_, i) => ({
            index: i,
            question: `心理韧性评估问题 ${i + 1}`,
            options: [
                { text: '完全不符合', value: 1 },
                { text: '不太符合', value: 2 },
                { text: '一般', value: 3 },
                { text: '比较符合', value: 4 },
                { text: '完全符合', value: 5 }
            ]
        }));
    }

    /**
     * 心理年龄问题
     */
    generateMentalAgeQuestions() {
        return [
            { question: '面对新事物时', options: [{ text: '兴奋期待', value: 5 }, { text: '谨慎观望', value: 3 }, { text: '抗拒改变', value: 1 }] },
            { question: '周末你更喜欢', options: [{ text: '派对社交', value: 5 }, { text: '看书喝茶', value: 3 }, { text: '打麻将', value: 1 }] }
        ].map((q, i) => ({ index: i, ...q }));
    }

    /**
     * 潜意识问题
     */
    generateSubconsciousQuestions() {
        return Array(15).fill(null).map((_, i) => ({
            index: i,
            question: `潜意识探索 ${i + 1}`,
            options: [
                { text: '选项A', value: 'A' },
                { text: '选项B', value: 'B' },
                { text: '选项C', value: 'C' }
            ]
        }));
    }

    /**
     * 色彩问题
     */
    generateColorQuestions() {
        return Array(10).fill(null).map((_, i) => ({
            index: i,
            question: `选择你第一眼喜欢的颜色`,
            options: [
                { text: '🔴 红色', value: 'red' },
                { text: '🟠 橙色', value: 'orange' },
                { text: '🟡 黄色', value: 'yellow' },
                { text: '🟢 绿色', value: 'green' },
                { text: '🔵 蓝色', value: 'blue' },
                { text: '🟣 紫色', value: 'purple' }
            ]
        }));
    }

    /**
     * 内在小孩问题
     */
    generateInnerChildQuestions() {
        return Array(25).fill(null).map((_, i) => ({
            index: i,
            question: `内在小孩探索 ${i + 1}`,
            options: [
                { text: '从不', value: 1 },
                { text: '偶尔', value: 2 },
                { text: '有时', value: 3 },
                { text: '经常', value: 4 },
                { text: '总是', value: 5 }
            ]
        }));
    }

    /**
     * 人生阶段问题
     */
    generateLifeStageQuestions() {
        return Array(20).fill(null).map((_, i) => ({
            index: i,
            question: `人生阶段探索 ${i + 1}`,
            options: [
                { text: '完全不符合', value: 1 },
                { text: '不太符合', value: 2 },
                { text: '一般', value: 3 },
                { text: '比较符合', value: 4 },
                { text: '完全符合', value: 5 }
            ]
        }));
    }
}