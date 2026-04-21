/**
 * 塔罗牌阵系统 - Tarot Spreads
 * 包含多种牌阵配置
 */

export class TarotSpreads {
    constructor() {
        this.spreads = this.initializeSpreads();
    }

    /**
     * 初始化所有牌阵
     */
    initializeSpreads() {
        return {
            // 单张牌阵 - 每日指引
            single: {
                id: 'single',
                name: '单张指引',
                englishName: 'Single Card',
                description: '抽取一张牌，获取今日指引或简单问题的答案',
                cardCount: 1,
                difficulty: 1,
                category: 'basic',
                icon: '🃏',
                positions: [
                    {
                        index: 0,
                        name: '指引牌',
                        meaning: '当前的能量与指引',
                        description: '这张牌代表今天你需要注意的能量或信息'
                    }
                ],
                suitableFor: ['每日指引', '快速问答', '冥想焦点'],
                readingTime: '1-2分钟'
            },

            // 三张牌阵 - 时间之流
            three: {
                id: 'three',
                name: '时间之流',
                englishName: 'Past Present Future',
                description: '最经典的牌阵，展示过去、现在、未来的能量流动',
                cardCount: 3,
                difficulty: 1,
                category: 'basic',
                icon: '⏳',
                positions: [
                    {
                        index: 0,
                        name: '过去',
                        meaning: '过去的影响和根源',
                        description: '导致当前情况的历史因素'
                    },
                    {
                        index: 1,
                        name: '现在',
                        meaning: '当前的处境和状态',
                        description: '你现在正在经历的能量'
                    },
                    {
                        index: 2,
                        name: '未来',
                        meaning: '可能的发展方向',
                        description: '按照当前趋势可能出现的 outcome'
                    }
                ],
                suitableFor: ['一般情况', '发展趋势', '时间线问题'],
                readingTime: '5-10分钟'
            },

            // 三张牌阵 - 身心灵
            bodyMindSpirit: {
                id: 'bodyMindSpirit',
                name: '身心灵牌阵',
                englishName: 'Body Mind Spirit',
                description: '从身体、心理、灵魂三个维度探索自我',
                cardCount: 3,
                difficulty: 1,
                category: 'self',
                icon: '🧘',
                positions: [
                    {
                        index: 0,
                        name: '身体',
                        meaning: '物质层面的状态',
                        description: '你的身体、健康、物质需求'
                    },
                    {
                        index: 1,
                        name: '心理',
                        meaning: '心智层面的状态',
                        description: '你的思想、情绪、心理状态'
                    },
                    {
                        index: 2,
                        name: '灵魂',
                        meaning: '精神层面的指引',
                        description: '你的灵魂目的、精神成长'
                    }
                ],
                suitableFor: ['自我探索', '身心平衡', '灵性成长'],
                readingTime: '5-10分钟'
            },

            // 三张牌阵 - 决策
            decision: {
                id: 'decision',
                name: '决策牌阵',
                englishName: 'Decision Making',
                description: '帮助你分析和做出决定的牌阵',
                cardCount: 3,
                difficulty: 1,
                category: 'practical',
                icon: '⚖️',
                positions: [
                    {
                        index: 0,
                        name: '选项A',
                        meaning: '第一个选择的可能结果',
                        description: '如果选择这条路可能带来的'
                    },
                    {
                        index: 1,
                        name: '选项B',
                        meaning: '第二个选择的可能结果',
                        description: '如果选择另一条路可能带来的'
                    },
                    {
                        index: 2,
                        name: '建议',
                        meaning: '塔罗的建议',
                        description: '综合考虑后的指引'
                    }
                ],
                suitableFor: ['二选一', '决策分析', '选择困难'],
                readingTime: '5-10分钟'
            },

            // 五张牌阵 - 五角星
            pentagram: {
                id: 'pentagram',
                name: '五角星牌阵',
                englishName: 'Pentagram Spread',
                description: '全面分析问题的五个维度',
                cardCount: 5,
                difficulty: 2,
                category: 'advanced',
                icon: '⭐',
                positions: [
                    {
                        index: 0,
                        name: '当前处境',
                        meaning: '问题的核心',
                        description: '你现在所处的位置'
                    },
                    {
                        index: 1,
                        name: '挑战',
                        meaning: '面临的困难',
                        description: '阻碍你前进的因素'
                    },
                    {
                        index: 2,
                        name: '资源',
                        meaning: '可用的帮助',
                        description: '你可以利用的资源和优势'
                    },
                    {
                        index: 3,
                        name: '建议',
                        meaning: '塔罗的指引',
                        description: '建议你采取的行动'
                    },
                    {
                        index: 4,
                        name: '结果',
                        meaning: '可能的 outcome',
                        description: '如果遵循建议可能达到的结果'
                    }
                ],
                suitableFor: ['问题分析', '全面了解', '寻求指引'],
                readingTime: '10-15分钟'
            },

            // 六张牌阵 - 爱情
            love: {
                id: 'love',
                name: '爱情牌阵',
                englishName: 'Love Spread',
                description: '深入分析感情关系的牌阵',
                cardCount: 6,
                difficulty: 2,
                category: 'relationship',
                icon: '💕',
                positions: [
                    {
                        index: 0,
                        name: '你的状态',
                        meaning: '你在关系中的位置',
                        description: '你当前的情感状态和态度'
                    },
                    {
                        index: 1,
                        name: '对方状态',
                        meaning: '对方在关系中的位置',
                        description: '对方当前的情感状态和态度'
                    },
                    {
                        index: 2,
                        name: '连接',
                        meaning: '你们之间的纽带',
                        description: '是什么将你们联系在一起'
                    },
                    {
                        index: 3,
                        name: '挑战',
                        meaning: '关系中的障碍',
                        description: '你们需要共同面对的问题'
                    },
                    {
                        index: 4,
                        name: '优势',
                        meaning: '关系的强项',
                        description: '你们关系的积极因素'
                    },
                    {
                        index: 5,
                        name: '未来发展',
                        meaning: '关系的可能走向',
                        description: '这段感情可能的未来'
                    }
                ],
                suitableFor: ['恋爱关系', '婚姻咨询', '感情困惑'],
                readingTime: '15-20分钟'
            },

            // 七张牌阵 - 关系
            relationship: {
                id: 'relationship',
                name: '关系牌阵',
                englishName: 'Relationship Spread',
                description: '深入分析两个人之间的互动关系',
                cardCount: 7,
                difficulty: 2,
                category: 'relationship',
                icon: '💑',
                positions: [
                    {
                        index: 0,
                        name: '你的想法',
                        meaning: '你对这段关系的认知',
                        description: '你脑海中关于这段关系的想法'
                    },
                    {
                        index: 1,
                        name: '你的情感',
                        meaning: '你对这段关系的感受',
                        description: '你内心深处对这段关系的情感'
                    },
                    {
                        index: 2,
                        name: '对方想法',
                        meaning: '对方对这段关系的认知',
                        description: '对方脑海中关于这段关系的想法'
                    },
                    {
                        index: 3,
                        name: '对方情感',
                        meaning: '对方对这段关系的感受',
                        description: '对方内心深处对这段关系的情感'
                    },
                    {
                        index: 4,
                        name: '共同基础',
                        meaning: '你们的共同点',
                        description: '这段关系的基础和连接点'
                    },
                    {
                        index: 5,
                        name: '需要改善',
                        meaning: '需要努力的方面',
                        description: '这段关系中需要改进的地方'
                    },
                    {
                        index: 6,
                        name: '可能结果',
                        meaning: '关系的发展方向',
                        description: '按照当前趋势可能的结果'
                    }
                ],
                suitableFor: ['深度关系分析', '人际互动', '合作分析'],
                readingTime: '20-25分钟'
            },

            // 十张牌阵 - 凯尔特十字
            celtic: {
                id: 'celtic',
                name: '凯尔特十字',
                englishName: 'Celtic Cross',
                description: '塔罗中最经典的综合牌阵，全面分析问题',
                cardCount: 10,
                difficulty: 3,
                category: 'advanced',
                icon: '✝️',
                positions: [
                    {
                        index: 0,
                        name: '现状',
                        meaning: '你当前的处境',
                        description: '问题的核心和你现在的状态'
                    },
                    {
                        index: 1,
                        name: '挑战',
                        meaning: '跨越或增强的因素',
                        description: '影响当前情况的重要因素'
                    },
                    {
                        index: 2,
                        name: '基础',
                        meaning: '问题的根源',
                        description: '造成当前情况的基础原因'
                    },
                    {
                        index: 3,
                        name: '过去',
                        meaning: '已经发生的影响',
                        description: '近期发生并影响当前的事件'
                    },
                    {
                        index: 4,
                        name: '目标',
                        meaning: '你的期望和目标',
                        description: '你希望达到的结果'
                    },
                    {
                        index: 5,
                        name: '近期未来',
                        meaning: '即将发生的事',
                        description: '短期内可能出现的情况'
                    },
                    {
                        index: 6,
                        name: '你的态度',
                        meaning: '你的内心想法',
                        description: '你对这个问题的真实态度'
                    },
                    {
                        index: 7,
                        name: '外部影响',
                        meaning: '环境和他人的影响',
                        description: '来自外部环境的影响因素'
                    },
                    {
                        index: 8,
                        name: '希望与恐惧',
                        meaning: '内心的期待与担忧',
                        description: '你对结果的希望和恐惧'
                    },
                    {
                        index: 9,
                        name: '最终结果',
                        meaning: '综合所有因素的结果',
                        description: '按照当前趋势的最终结果'
                    }
                ],
                suitableFor: ['复杂问题', '全面分析', '深度解读'],
                readingTime: '30-45分钟'
            },

            // 十二张牌阵 - 黄道十二宫
            zodiac: {
                id: 'zodiac',
                name: '黄道十二宫',
                englishName: 'Zodiac Spread',
                description: '对应十二宫位，全面分析人生各领域',
                cardCount: 12,
                difficulty: 3,
                category: 'advanced',
                icon: '♈',
                positions: [
                    { index: 0, name: '第一宫-自我', meaning: '自我形象与个性', description: '你展现给外界的形象' },
                    { index: 1, name: '第二宫-财富', meaning: '金钱与物质', description: '财务状况和价值观' },
                    { index: 2, name: '第三宫-沟通', meaning: '沟通与学习', description: '交流、学习和短途旅行' },
                    { index: 3, name: '第四宫-家庭', meaning: '家庭与根基', description: '家庭生活和内心安全感' },
                    { index: 4, name: '第五宫-创造', meaning: '创造与娱乐', description: '创造力、恋爱和子女' },
                    { index: 5, name: '第六宫-工作', meaning: '工作与健康', description: '日常工作与健康状态' },
                    { index: 6, name: '第七宫-关系', meaning: '伴侣与合作', description: '亲密关系和合作伙伴' },
                    { index: 7, name: '第八宫-转变', meaning: '转化与共享', description: '深层变化和共享资源' },
                    { index: 8, name: '第九宫-远见', meaning: '哲学与远方', description: '信仰、高等教育和长途旅行' },
                    { index: 9, name: '第十宫-事业', meaning: '事业与声望', description: '职业发展和社会地位' },
                    { index: 10, name: '第十一宫-社交', meaning: '朋友与理想', description: '社交圈和人生目标' },
                    { index: 11, name: '第十二宫-灵性', meaning: '潜意识与灵性', description: '内在世界和隐藏的事物' }
                ],
                suitableFor: ['年度运势', '人生全景', '综合分析'],
                readingTime: '45-60分钟'
            },

            // 四张牌阵 - 四元素
            elements: {
                id: 'elements',
                name: '四元素牌阵',
                englishName: 'Four Elements',
                description: '从火水土风四元素角度分析问题',
                cardCount: 4,
                difficulty: 1,
                category: 'basic',
                icon: '🔥',
                positions: [
                    {
                        index: 0,
                        name: '火-行动',
                        meaning: '行动与意志',
                        description: '你需要采取什么行动'
                    },
                    {
                        index: 1,
                        name: '水-情感',
                        meaning: '情感与直觉',
                        description: '你的情感状态和直觉指引'
                    },
                    {
                        index: 2,
                        name: '土-物质',
                        meaning: '物质与现实',
                        description: '现实层面需要考虑的因素'
                    },
                    {
                        index: 3,
                        name: '风-思维',
                        meaning: '思维与沟通',
                        description: '你需要思考的方向'
                    }
                ],
                suitableFor: ['多维度分析', '元素平衡', '整体了解'],
                readingTime: '5-10分钟'
            }
        };
    }

    /**
     * 获取所有牌阵列表
     */
    getSpreadList() {
        return Object.values(this.spreads).map(spread => ({
            id: spread.id,
            name: spread.name,
            englishName: spread.englishName,
            description: spread.description,
            cardCount: spread.cardCount,
            difficulty: spread.difficulty,
            category: spread.category,
            icon: spread.icon,
            readingTime: spread.readingTime
        }));
    }

    /**
     * 获取指定牌阵详情
     */
    getSpread(spreadId) {
        return this.spreads[spreadId] || null;
    }

    /**
     * 按类别获取牌阵
     */
    getSpreadsByCategory(category) {
        return Object.values(this.spreads).filter(spread => spread.category === category);
    }

    /**
     * 按难度获取牌阵
     */
    getSpreadsByDifficulty(difficulty) {
        return Object.values(this.spreads).filter(spread => spread.difficulty === difficulty);
    }

    /**
     * 获取适合特定用途的牌阵
     */
    getSpreadsForPurpose(purpose) {
        return Object.values(this.spreads).filter(spread => 
            spread.suitableFor && spread.suitableFor.some(s => s.includes(purpose))
        );
    }

    /**
     * 获取牌阵分类列表
     */
    getCategories() {
        return [
            { id: 'basic', name: '基础牌阵', description: '适合初学者' },
            { id: 'self', name: '自我探索', description: '了解自己' },
            { id: 'relationship', name: '关系牌阵', description: '感情与人际' },
            { id: 'practical', name: '实用牌阵', description: '解决实际问题' },
            { id: 'advanced', name: '进阶牌阵', description: '深度分析' }
        ];
    }
}