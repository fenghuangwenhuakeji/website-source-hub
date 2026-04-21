/**
 * 塔罗牌库 - Tarot Deck
 * 包含78张塔罗牌的完整数据
 */

export class TarotDeck {
    constructor() {
        this.cards = this.initializeDeck();
        this.shuffledCards = [];
    }

    /**
     * 初始化78张塔罗牌
     */
    initializeDeck() {
        const deck = [];

        // 大阿尔卡纳 (Major Arcana) - 22张
        const majorArcana = [
            { id: 0, name: '愚者', englishName: 'The Fool', symbol: '🃏' },
            { id: 1, name: '魔术师', englishName: 'The Magician', symbol: '🎩' },
            { id: 2, name: '女祭司', englishName: 'The High Priestess', symbol: '🌙' },
            { id: 3, name: '女皇', englishName: 'The Empress', symbol: '👑' },
            { id: 4, name: '皇帝', englishName: 'The Emperor', symbol: '🏛️' },
            { id: 5, name: '教皇', englishName: 'The Hierophant', symbol: '📿' },
            { id: 6, name: '恋人', englishName: 'The Lovers', symbol: '❤️' },
            { id: 7, name: '战车', englishName: 'The Chariot', symbol: '⚔️' },
            { id: 8, name: '力量', englishName: 'Strength', symbol: '🦁' },
            { id: 9, name: '隐士', englishName: 'The Hermit', symbol: '🏔️' },
            { id: 10, name: '命运之轮', englishName: 'Wheel of Fortune', symbol: '🎡' },
            { id: 11, name: '正义', englishName: 'Justice', symbol: '⚖️' },
            { id: 12, name: '倒吊人', englishName: 'The Hanged Man', symbol: '🙃' },
            { id: 13, name: '死神', englishName: 'Death', symbol: '💀' },
            { id: 14, name: '节制', englishName: 'Temperance', symbol: '🏺' },
            { id: 15, name: '恶魔', englishName: 'The Devil', symbol: '😈' },
            { id: 16, name: '塔', englishName: 'The Tower', symbol: '🗼' },
            { id: 17, name: '星星', englishName: 'The Star', symbol: '⭐' },
            { id: 18, name: '月亮', englishName: 'The Moon', symbol: '🌕' },
            { id: 19, name: '太阳', englishName: 'The Sun', symbol: '☀️' },
            { id: 20, name: '审判', englishName: 'Judgement', symbol: '📯' },
            { id: 21, name: '世界', englishName: 'The World', symbol: '🌍' }
        ];

        majorArcana.forEach(card => {
            deck.push({
                ...card,
                type: 'major',
                arcana: '大阿尔卡纳',
                uprightMeaning: this.getMajorUprightMeaning(card.id),
                reversedMeaning: this.getMajorReversedMeaning(card.id),
                keywords: this.getMajorKeywords(card.id),
                element: 'spirit',
                description: this.getMajorDescription(card.id)
            });
        });

        // 小阿尔卡纳 (Minor Arcana) - 56张
        const suits = [
            { name: '权杖', englishName: 'Wands', element: 'fire', symbol: '🔥', theme: '行动与创造' },
            { name: '圣杯', englishName: 'Cups', element: 'water', symbol: '💧', theme: '情感与直觉' },
            { name: '宝剑', englishName: 'Swords', element: 'air', symbol: '🗡️', theme: '思维与沟通' },
            { name: '钱币', englishName: 'Pentacles', element: 'earth', symbol: '💰', theme: '物质与财富' }
        ];

        const courtCards = [
            { rank: 14, name: '国王', englishName: 'King' },
            { rank: 13, name: '王后', englishName: 'Queen' },
            { rank: 12, name: '骑士', englishName: 'Knight' },
            { rank: 11, name: '侍从', englishName: 'Page' }
        ];

        suits.forEach(suit => {
            // 数字牌 1-10
            for (let rank = 1; rank <= 10; rank++) {
                deck.push({
                    id: `${suit.englishName.toLowerCase()}_${rank}`,
                    rank,
                    name: `${suit.name}${rank}`,
                    englishName: `${this.getNumberEnglish(rank)} of ${suit.englishName}`,
                    type: 'minor',
                    arcana: '小阿尔卡纳',
                    suit: suit.name,
                    suitEnglish: suit.englishName,
                    element: suit.element,
                    symbol: suit.symbol,
                    theme: suit.theme,
                    uprightMeaning: this.getMinorUprightMeaning(suit.element, rank),
                    reversedMeaning: this.getMinorReversedMeaning(suit.element, rank),
                    keywords: this.getMinorKeywords(suit.element, rank)
                });
            }

            // 宫廷牌
            courtCards.forEach(court => {
                deck.push({
                    id: `${suit.englishName.toLowerCase()}_${court.englishName.toLowerCase()}`,
                    rank: court.rank,
                    name: `${suit.name}${court.name}`,
                    englishName: `${court.englishName} of ${suit.englishName}`,
                    type: 'minor',
                    arcana: '小阿尔卡纳',
                    suit: suit.name,
                    suitEnglish: suit.englishName,
                    element: suit.element,
                    symbol: suit.symbol,
                    theme: suit.theme,
                    isCourtCard: true,
                    courtType: court.name,
                    uprightMeaning: this.getCourtUprightMeaning(suit.element, court.name),
                    reversedMeaning: this.getCourtReversedMeaning(suit.element, court.name),
                    keywords: this.getCourtKeywords(suit.element, court.name)
                });
            });
        });

        return deck;
    }

    /**
     * 洗牌 (Fisher-Yates算法)
     */
    shuffle() {
        this.shuffledCards = [...this.cards];
        for (let i = this.shuffledCards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.shuffledCards[i], this.shuffledCards[j]] = 
            [this.shuffledCards[j], this.shuffledCards[i]];
        }
        return this;
    }

    /**
     * 抽取指定数量的牌
     * @param {number} count - 抽取数量
     * @returns {Array} 抽取的牌
     */
    draw(count = 1) {
        if (this.shuffledCards.length === 0) {
            this.shuffle();
        }

        const drawnCards = [];
        for (let i = 0; i < count && this.shuffledCards.length > 0; i++) {
            const card = { ...this.shuffledCards.pop() };
            // 随机决定是否逆位 (约30%概率)
            card.isReversed = Math.random() < 0.3;
            drawnCards.push(card);
        }

        return drawnCards;
    }

    /**
     * 获取数字的英文表达
     */
    getNumberEnglish(num) {
        const numbers = ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
        return numbers[num - 1] || num.toString();
    }

    // ==================== 大阿尔卡纳牌义 ====================

    getMajorUprightMeaning(id) {
        const meanings = [
            '新的开始、冒险精神、纯真无邪、自由自在',
            '创造力、技能、意志力、自信',
            '直觉、神秘、潜意识、内在智慧',
            '丰饶、母性、创造力、自然',
            '权威、结构、控制、父亲形象',
            '传统、信仰、教育、精神指引',
            '爱情、和谐、选择、价值观',
            '意志力、决心、胜利、控制',
            '勇气、耐心、内在力量、自我控制',
            '内省、寻求真理、独处、智慧',
            '命运、转折点、机遇、循环',
            '公正、真理、因果、平衡',
            '牺牲、等待、新视角、放手',
            '结束、转变、重生、告别过去',
            '平衡、调和、耐心、适度',
            '束缚、诱惑、物质执念、阴影',
            '剧变、觉醒、启示、毁灭重生',
            '希望、灵感、宁静、更新',
            '幻觉、恐惧、潜意识、迷茫',
            '快乐、成功、活力、积极',
            '反思、觉醒、重生、召唤',
            '完成、成就、整合、圆满'
        ];
        return meanings[id] || '';
    }

    getMajorReversedMeaning(id) {
        const meanings = [
            '鲁莽、冒险、愚蠢、缺乏计划',
            '欺骗、操纵、才能浪费、缺乏方向',
            '秘密、隐藏的议程、断开直觉',
            '创作受阻、依赖他人、缺乏成长',
            '专制、僵化、过度控制、权威滥用',
            '叛逆、打破常规、个人信仰',
            '不平衡、失去和谐、价值观冲突',
            '失控、侵略性、缺乏方向',
            '自我怀疑、软弱、缺乏自信',
            '孤立、孤独、退缩、拒绝帮助',
            '厄运、抗拒改变、失控',
            '不公、不诚实、逃避责任',
            '拖延、抵抗、无谓牺牲',
            '停滞、抵抗改变、恐惧转变',
            '失衡、过度、冲突、不和谐',
            '解脱、打破束缚、面对阴影',
            '避免灾难、恐惧改变、延迟',
            '绝望、缺乏信心、断开连接',
            '困惑、恐惧、妄想、逃避',
            '暂时的阴霾、过度乐观、延迟成功',
            '自我怀疑、拒绝召唤、后悔',
            '未完成、缺乏闭合、延迟成功'
        ];
        return meanings[id] || '';
    }

    getMajorKeywords(id) {
        const keywords = [
            ['新开始', '冒险', '自由', '纯真'],
            ['创造', '意志', '技能', '自信'],
            ['直觉', '神秘', '智慧', '潜意识'],
            ['丰饶', '创造', '母性', '自然'],
            ['权威', '结构', '控制', '稳定'],
            ['传统', '信仰', '教育', '指引'],
            ['爱情', '选择', '和谐', '关系'],
            ['胜利', '意志', '决心', '控制'],
            ['勇气', '力量', '耐心', '自我控制'],
            ['内省', '智慧', '独处', '寻求'],
            ['命运', '机遇', '转折', '循环'],
            ['公正', '平衡', '真理', '因果'],
            ['牺牲', '等待', '新视角', '放手'],
            ['结束', '转变', '重生', '改变'],
            ['平衡', '调和', '耐心', '适度'],
            ['束缚', '诱惑', '执念', '阴影'],
            ['剧变', '觉醒', '毁灭', '启示'],
            ['希望', '灵感', '更新', '宁静'],
            ['幻觉', '恐惧', '潜意识', '迷茫'],
            ['快乐', '成功', '活力', '光明'],
            ['反思', '觉醒', '重生', '召唤'],
            ['完成', '成就', '整合', '圆满']
        ];
        return keywords[id] || [];
    }

    getMajorDescription(id) {
        const descriptions = [
            '愚者代表着无限的可能性和新的开始。他站在悬崖边，毫无畏惧地望向前方，象征着纯真的冒险精神和对未知的信任。',
            '魔术师一手指向天空，一手指向大地，代表着"上如其下"的法则。他拥有将想法转化为现实的能力。',
            '女祭司坐在两根柱子之间，代表着直觉和内在智慧。她是通往潜意识的守护者，掌管着神秘的知识。',
            '女皇代表着自然的丰饶和创造力。她象征着母亲般的滋养和培育力量。',
            '皇帝代表着权威和结构。他提供了秩序和稳定性，象征着父亲般的保护和指引。',
            '教皇代表着传统的智慧和精神指引。他连接着神圣与世俗，传授着古老的真理。',
            '恋人代表着爱与和谐的选择。这张牌象征着价值观的抉择和人际关系的深度连接。',
            '战车象征着通过意志力获得的胜利。驾驭者控制着对立的力量，坚定地向目标前进。',
            '力量牌展示了内在的勇气和自我控制。温柔的女性轻抚狮子，代表着以柔克刚的智慧。',
            '隐士站在山顶，手持明灯，代表着内省和寻求真理。他提醒我们在独处中找到智慧。',
            '命运之轮象征着生命的循环和转折点。它提醒我们命运的变化无常，机遇随时可能降临。',
            '正义女神手持天平和宝剑，代表着公正和因果。她提醒我们每个行为都有其后果。',
            '倒吊人悬挂在树上，代表着牺牲和新视角。通过放手，我们获得新的领悟。',
            '死神代表着不可避免的转变和结束。它不是物理死亡，而是旧事物的终结，为新生命腾出空间。',
            '节制天使将两杯水混合，代表着平衡和调和。她提醒我们在极端之间找到中道。',
            '恶魔代表着束缚和诱惑。它揭示了我们的恐惧和执念，同时也暗示着解脱的可能。',
            '高塔被闪电击中，代表着突然而剧烈的变化。旧的 Structure 崩塌，为重建创造机会。',
            '星星代表着希望和灵感。在暴风雨后，它带来宁静和更新的能量。',
            '月亮照亮夜空，但也投下阴影。它代表着幻觉、恐惧和潜意识的力量。',
            '太阳是塔罗牌中最积极的牌之一，代表着快乐、成功和生命力。',
            '审判天使吹响号角，代表着觉醒和重生。这是回应内心召唤的时刻。',
            '世界代表着圆满和完成。所有的元素都整合在一起，达成最终的目标。'
        ];
        return descriptions[id] || '';
    }

    // ==================== 小阿尔卡纳牌义 ====================

    getMinorUprightMeaning(element, rank) {
        const meanings = {
            fire: { // 权杖
                1: '新的开始、创造潜力、灵感闪现',
                2: '规划未来、做出决定、展望远方',
                3: '扩展视野、远见卓识、探索机会',
                4: '庆祝成就、家庭和谐、稳定基础',
                5: '冲突竞争、分歧挑战、需要协调',
                6: '胜利荣耀、公众认可、自信前进',
                7: '勇敢面对、坚守立场、克服挑战',
                8: '快速行动、突然变化、进展加速',
                9: '坚持不懈、韧性十足、接近目标',
                10: '责任重担、压力挑战、需要支持'
            },
            water: { // 圣杯
                1: '情感新生、爱的开始、直觉觉醒',
                2: '伙伴关系、相互吸引、和谐连接',
                3: '友谊聚会、社交快乐、创意表达',
                4: '情感冷淡、不满现状、需要新意',
                5: '失落悲伤、需要释怀、接受改变',
                6: '怀旧回忆、童年时光、重逢喜悦',
                7: '选择困惑、幻象迷惑、需要清醒',
                8: '情感释放、离开旧境、寻求意义',
                9: '愿望成真、满足感强、心怀感恩',
                10: '家庭和谐、情感圆满、长久幸福'
            },
            air: { // 宝剑
                1: '思维清晰、真相揭示、突破性理解',
                2: '艰难抉择、僵持不下、需要平衡',
                3: '心痛悲伤、分离失落、需要疗愈',
                4: '休息恢复、静养沉思、暂时退让',
                5: '冲突失败、空虚胜利、需要反思',
                6: '过渡转变、远离困境、寻求平静',
                7: '策略计划、独辟蹊径、需要谨慎',
                8: '困境束缚、自我限制、需要突破',
                9: '焦虑不安、噩梦困扰、需要面对',
                10: '彻底结束、痛苦转变、重生开始'
            },
            earth: { // 钱币
                1: '财富机遇、新的事业、物质开始',
                2: '平衡协调、灵活应变、多任务处理',
                3: '团队合作、技能提升、质量追求',
                4: '财务稳定、保守控制、资源保护',
                5: '物质困难、健康问题、需要帮助',
                6: '慷慨分享、给予接受、公平交换',
                7: '长期投资、耐心等待、评估进展',
                8: '技能精进、专注学习、工匠精神',
                9: '独立富足、自给自足、享受成果',
                10: '家族财富、传承基业、长久安稳'
            }
        };
        return meanings[element]?.[rank] || '';
    }

    getMinorReversedMeaning(element, rank) {
        const meanings = {
            fire: {
                1: '延迟开始、缺乏方向、创意受阻',
                2: '恐惧未来、优柔寡断、缺乏规划',
                3: '发展受阻、缺乏远见、延迟到来',
                4: '不稳定、缺乏庆祝、家庭冲突',
                5: '避免冲突、内部矛盾、和解可能',
                6: '自我怀疑、缺乏认可、暂时挫折',
                7: '退缩回避、放弃抵抗、失去勇气',
                8: '延迟阻碍、混乱无序、能量分散',
                9: '疲惫不堪、放弃希望、需要休息',
                10: '卸下重担、委派责任、寻求帮助'
            },
            water: {
                1: '情感压抑、封闭心灵、直觉受阻',
                2: '关系紧张、不和谐、分离倾向',
                3: '孤独孤立、社交问题、缺乏创意',
                4: '新的觉察、重新评估、打破冷漠',
                5: '接受现实、开始疗愈、向前迈进',
                6: '放下过去、关注当下、走出回忆',
                7: '看清真相、做出选择、消除幻觉',
                8: '回归现实、面对情感、寻找意义',
                9: '愿望未遂、不满现状、重新评估',
                10: '家庭问题、情感缺失、需要沟通'
            },
            air: {
                1: '思维混乱、误解真相、需要清晰',
                2: '做出决定、打破僵局、接受真相',
                3: '疗愈开始、释放痛苦、原谅过去',
                4: '恢复精力、重新思考、准备行动',
                5: '和解冲突、接受失败、向前迈进',
                6: '回归面对、过渡完成、开始新篇',
                7: '坦诚相见、放弃欺骗、重新开始',
                8: '释放束缚、获得自由、新的视角',
                9: '克服焦虑、寻求帮助、面对恐惧',
                10: '重生开始、走出低谷、新的人生'
            },
            earth: {
                1: '错失机会、财务问题、缺乏规划',
                2: '失去平衡、过度分散、需要专注',
                3: '团队问题、技能不足、质量下降',
                4: '财务不稳定、过度消费、控制欲',
                5: '复苏开始、接受帮助、好转迹象',
                6: '债务问题、不公平交换、慷慨过度',
                7: '缺乏耐心、评估错误、投资失误',
                8: '缺乏专注、学习困难、技能不足',
                9: '过度独立、拒绝帮助、孤独感',
                10: '家族问题、传承纠纷、根基动摇'
            }
        };
        return meanings[element]?.[rank] || '';
    }

    getMinorKeywords(element, rank) {
        const keywords = {
            fire: {
                1: ['创造', '灵感', '潜力'],
                2: ['规划', '决定', '展望'],
                3: ['扩展', '远见', '探索'],
                4: ['庆祝', '和谐', '稳定'],
                5: ['冲突', '竞争', '挑战'],
                6: ['胜利', '认可', '自信'],
                7: ['勇气', '坚持', '对抗'],
                8: ['速度', '变化', '行动'],
                9: ['韧性', '坚持', '努力'],
                10: ['责任', '压力', '负担']
            },
            water: {
                1: ['情感', '新开始', '爱'],
                2: ['伙伴', '和谐', '连接'],
                3: ['友谊', '快乐', '分享'],
                4: ['冷淡', '不满', '反思'],
                5: ['失落', '悲伤', '释怀'],
                6: ['怀旧', '回忆', '重逢'],
                7: ['选择', '幻象', '困惑'],
                8: ['离开', '释放', '转变'],
                9: ['满足', '愿望', '感恩'],
                10: ['圆满', '家庭', '幸福']
            },
            air: {
                1: ['真相', '清晰', '突破'],
                2: ['抉择', '僵持', '平衡'],
                3: ['心痛', '悲伤', '疗愈'],
                4: ['休息', '恢复', '静思'],
                5: ['冲突', '失败', '空虚'],
                6: ['过渡', '转变', '迁移'],
                7: ['策略', '计划', '谨慎'],
                8: ['困境', '束缚', '限制'],
                9: ['焦虑', '不安', '恐惧'],
                10: ['结束', '转变', '重生']
            },
            earth: {
                1: ['财富', '机遇', '新事业'],
                2: ['平衡', '协调', '灵活'],
                3: ['合作', '技能', '质量'],
                4: ['稳定', '保护', '控制'],
                5: ['困难', '问题', '帮助'],
                6: ['慷慨', '分享', '公平'],
                7: ['投资', '耐心', '评估'],
                8: ['专注', '学习', '精进'],
                9: ['独立', '富足', '成果'],
                10: ['家族', '传承', '安稳']
            }
        };
        return keywords[element]?.[rank] || [];
    }

    // ==================== 宫廷牌牌义 ====================

    getCourtUprightMeaning(element, court) {
        const meanings = {
            fire: {
                '国王': '有远见的领导者、果断、充满活力',
                '王后': '自信、热情、鼓舞他人',
                '骑士': '冒险、冲动、充满激情',
                '侍从': '热情的学习者、有探索精神、好奇心强'
            },
            water: {
                '国王': '情感成熟、外交手腕、冷静理智',
                '王后': '情感丰富、直觉敏锐、关怀他人',
                '骑士': '浪漫、追求梦想、情感驱动',
                '侍从': '情感萌芽、直觉发展、好奇心'
            },
            air: {
                '国王': '智力超群、理性决策、公正严明',
                '王后': '独立思考、直言不讳、敏锐洞察',
                '骑士': '机智勇敢、行动迅速、追求真理',
                '侍从': '好奇好学、思维活跃、需要引导'
            },
            earth: {
                '国王': '富有成就、稳健务实、值得信赖',
                '王后': '务实关怀、家庭为重、富足安康',
                '骑士': '勤奋务实、稳定前进、可靠耐力',
                '侍从': '学习技能、关注细节、脚踏实地'
            }
        };
        return meanings[element]?.[court] || '';
    }

    getCourtReversedMeaning(element, court) {
        const meanings = {
            fire: {
                '国王': '专制独断、目标不明确、滥用权力',
                '王后': '嫉妒心强、控制欲过强、热情消退',
                '骑士': '鲁莽冲动、急躁、缺乏方向',
                '侍从': '缺乏方向、好高骛远、失去热情'
            },
            water: {
                '国王': '情感操控、冷漠无情、喜怒无常',
                '王后': '情感依赖、过度敏感、缺乏边界',
                '骑士': '情感不成熟、逃避现实、幻想破灭',
                '侍从': '情感脆弱、逃避问题、直觉受阻'
            },
            air: {
                '国王': '滥用权力、残酷无情、操控他人',
                '王后': '过度批评、尖酸刻薄、偏见严重',
                '骑士': '冲动鲁莽、言行不一、破坏性强',
                '侍从': '流言蜚语、浅薄、思维混乱'
            },
            earth: {
                '国王': '贪婪固执、过度物质化、缺乏灵活',
                '王后': '过度保护、工作狂、忽视情感',
                '骑士': '工作倦怠、停滞不前、固执己见',
                '侍从': '缺乏动力、好高骛远、浪费才能'
            }
        };
        return meanings[element]?.[court] || '';
    }

    getCourtKeywords(element, court) {
        const keywords = {
            fire: {
                '国王': ['领导力', '远见', '魄力'],
                '王后': ['自信', '热情', '魅力'],
                '骑士': ['冒险', '激情', '行动'],
                '侍从': ['好奇', '探索', '热情']
            },
            water: {
                '国王': ['情感智慧', '外交', '冷静'],
                '王后': ['直觉', '关怀', '情感'],
                '骑士': ['浪漫', '梦想', '追求'],
                '侍从': ['情感萌芽', '直觉', '好奇']
            },
            air: {
                '国王': ['智慧', '理性', '公正'],
                '王后': ['独立', '洞察', '直言'],
                '骑士': ['机智', '勇敢', '追求真理'],
                '侍从': ['好学', '思维活跃', '好奇']
            },
            earth: {
                '国王': ['成就', '稳健', '可靠'],
                '王后': ['务实', '关怀', '富足'],
                '骑士': ['勤奋', '稳定', '可靠'],
                '侍从': ['学习', '细节', '脚踏实地']
            }
        };
        return keywords[element]?.[court] || [];
    }
}