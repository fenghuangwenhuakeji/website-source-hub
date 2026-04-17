/**
 * 塔罗解读引擎 - Tarot Interpreter
 * 智能解读塔罗牌含义
 */

export class TarotInterpreter {
    constructor() {
        this.elementMeanings = {
            fire: { name: '火', theme: '行动与激情', direction: '向前推进' },
            water: { name: '水', theme: '情感与直觉', direction: '向内探索' },
            air: { name: '风', theme: '思维与沟通', direction: '分析理解' },
            earth: { name: '土', theme: '物质与稳定', direction: '脚踏实地' },
            spirit: { name: '灵', theme: '精神与超越', direction: '灵性成长' }
        };

        this.numberMeanings = {
            1: '新的开始、潜力、种子',
            2: '平衡、选择、伙伴关系',
            3: '创造、表达、初步成果',
            4: '稳定、基础、结构',
            5: '变化、挑战、冲突',
            6: '和谐、沟通、调整',
            7: '反思、评估、灵性',
            8: '力量、执行、循环',
            9: '完成、满足、接近目标',
            10: '圆满、结束、新的循环'
        };
    }

    /**
     * 综合解读
     * @param {Array} cards - 抽取的牌
     * @param {Object} spread - 牌阵配置
     * @param {string} question - 用户的问题
     * @returns {Object} 解读结果
     */
    async interpret(cards, spread, question = '') {
        // 1. 逐张牌解读
        const cardInterpretations = cards.map((card, index) => 
            this.interpretSingleCard(card, spread.positions[index])
        );

        // 2. 牌组关联分析
        const combinationAnalysis = this.analyzeCombinations(cards);

        // 3. 整体趋势分析
        const trendAnalysis = this.analyzeTrend(cards);

        // 4. 生成总结
        const summary = this.generateSummary(cards, spread, question);

        // 5. 生成建议
        const advice = this.generateAdvice(cards, spread);

        return {
            cards: cardInterpretations,
            combinations: combinationAnalysis,
            trend: trendAnalysis,
            summary,
            advice,
            question
        };
    }

    /**
     * 解读单张牌
     */
    interpretSingleCard(card, position) {
        const meaning = card.isReversed ? card.reversedMeaning : card.uprightMeaning;
        const keywords = card.keywords || [];
        
        // 根据位置生成特定解读
        const positionInterpretation = this.getPositionBasedInterpretation(card, position);

        return {
            card: {
                name: card.name,
                englishName: card.englishName,
                symbol: card.symbol,
                arcana: card.arcana,
                isReversed: card.isReversed
            },
            position: {
                name: position.name,
                meaning: position.meaning
            },
            meaning,
            keywords,
            positionInterpretation,
            element: this.getElementInfo(card.element),
            numerology: this.getNumerologyMeaning(card)
        };
    }

    /**
     * 基于位置的解读
     */
    getPositionBasedInterpretation(card, position) {
        const isReversed = card.isReversed;
        const cardName = card.name;
        const posName = position.name;
        const meaning = isReversed ? card.reversedMeaning : card.uprightMeaning;

        // 根据不同位置生成解读模板
        const templates = {
            '过去': `在过去，${cardName}的能量${isReversed ? '以一种受阻或延迟的方式' : ''}影响了你的经历。${meaning}`,
            '现在': `当前，${cardName}${isReversed ? '逆位' : '正位'}出现，提示你${meaning}。`,
            '未来': `在未来的发展趋势中，${cardName}暗示着${meaning}。`,
            '指引牌': `今天的指引是${cardName}，提醒你关注${meaning}。`,
            '现状': `${cardName}揭示了当前处境的核心：${meaning}。`,
            '挑战': `你面临的挑战与${cardName}相关：${meaning}。`,
            '建议': `塔罗建议你${meaning}，这正是${cardName}${isReversed ? '逆位' : ''}的启示。`,
            '结果': `按照当前趋势，可能的结果是：${meaning}。`,
            '你的状态': `你目前的状态体现为${cardName}：${meaning}。`,
            '对方状态': `对方的状态反映为${cardName}：${meaning}。`,
            '身体': `在身体层面，${cardName}提示你${meaning}。`,
            '心理': `在心理层面，${cardName}暗示${meaning}。`,
            '灵魂': `在灵魂层面，${cardName}指引你${meaning}。`
        };

        // 查找匹配的模板
        for (const [key, template] of Object.entries(templates)) {
            if (posName.includes(key)) {
                return template;
            }
        }

        // 默认解读
        return `在${posName}的位置上，${cardName}${isReversed ? '逆位' : '正位'}表示：${meaning}。`;
    }

    /**
     * 分析牌组关联
     */
    analyzeCombinations(cards) {
        const analysis = {
            elementBalance: this.analyzeElementBalance(cards),
            majorMinorRatio: this.analyzeMajorMinorRatio(cards),
            reversedRatio: this.analyzeReversedRatio(cards),
            suitDominance: this.analyzeSuitDominance(cards),
            patterns: this.findPatterns(cards)
        };

        return analysis;
    }

    /**
     * 元素平衡分析
     */
    analyzeElementBalance(cards) {
        const elements = { fire: 0, water: 0, air: 0, earth: 0, spirit: 0 };
        cards.forEach(card => {
            if (card.element) {
                elements[card.element]++;
            }
        });

        const dominant = Object.entries(elements)
            .sort((a, b) => b[1] - a[1])[0];

        return {
            distribution: elements,
            dominant: dominant[1] > 0 ? {
                element: dominant[0],
                ...this.elementMeanings[dominant[0]]
            } : null,
            interpretation: this.getElementBalanceInterpretation(elements)
        };
    }

    /**
     * 元素平衡解读
     */
    getElementBalanceInterpretation(elements) {
        const interpretations = [];
        
        if (elements.fire > 2) {
            interpretations.push('火元素较多，强调行动力和激情');
        }
        if (elements.water > 2) {
            interpretations.push('水元素较多，强调情感和直觉');
        }
        if (elements.air > 2) {
            interpretations.push('风元素较多，强调思维和沟通');
        }
        if (elements.earth > 2) {
            interpretations.push('土元素较多，强调稳定和物质');
        }
        if (elements.spirit > 2) {
            interpretations.push('大阿尔卡纳较多，强调精神层面的指引');
        }

        return interpretations.length > 0 
            ? interpretations.join('。') 
            : '各元素分布较为均衡，说明问题涉及生活的多个方面。';
    }

    /**
     * 大小阿尔卡纳比例分析
     */
    analyzeMajorMinorRatio(cards) {
        const major = cards.filter(c => c.type === 'major').length;
        const minor = cards.length - major;
        const ratio = cards.length > 0 ? (major / cards.length * 100).toFixed(0) : 0;

        let interpretation = '';
        if (major > minor) {
            interpretation = '大阿尔卡纳占多数，说明这个问题涉及重要的生命课题和精神层面的影响。';
        } else if (minor > major) {
            interpretation = '小阿尔卡纳占多数，说明这个问题更多与日常生活和具体事务相关。';
        } else {
            interpretation = '大小阿尔卡纳比例均衡，说明问题既涉及精神层面，也影响日常生活。';
        }

        return { major, minor, ratio, interpretation };
    }

    /**
     * 逆位比例分析
     */
    analyzeReversedRatio(cards) {
        const reversed = cards.filter(c => c.isReversed).length;
        const upright = cards.length - reversed;
        const ratio = cards.length > 0 ? (reversed / cards.length * 100).toFixed(0) : 0;

        let interpretation = '';
        if (reversed > cards.length / 2) {
            interpretation = '逆位牌较多，提示当前可能存在阻碍或需要内省的方面。';
        } else if (reversed === 0) {
            interpretation = '所有牌都是正位，能量流通顺畅，各方面都呈现积极状态。';
        } else {
            interpretation = '正逆位混合，说明情况有起有伏，需要全面看待。';
        }

        return { reversed, upright, ratio, interpretation };
    }

    /**
     * 花色主导分析
     */
    analyzeSuitDominance(cards) {
        const suits = {};
        cards.forEach(card => {
            if (card.suit) {
                suits[card.suit] = (suits[card.suit] || 0) + 1;
            }
        });

        const dominant = Object.entries(suits)
            .sort((a, b) => b[1] - a[1])[0];

        if (!dominant || dominant[1] === 0) {
            return { dominant: null, interpretation: '没有明显主导的花色。' };
        }

        const suitThemes = {
            '权杖': '行动、创造、事业',
            '圣杯': '情感、关系、直觉',
            '宝剑': '思维、沟通、挑战',
            '钱币': '物质、财富、稳定'
        };

        return {
            dominant: {
                suit: dominant[0],
                count: dominant[1],
                theme: suitThemes[dominant[0]]
            },
            interpretation: `${dominant[0]}牌较多，强调${suitThemes[dominant[0]]}方面的议题。`
        };
    }

    /**
     * 寻找模式
     */
    findPatterns(cards) {
        const patterns = [];

        // 检查相同数字
        const ranks = cards.filter(c => c.rank).map(c => c.rank);
        const rankCounts = {};
        ranks.forEach(r => {
            rankCounts[r] = (rankCounts[r] || 0) + 1;
        });

        for (const [rank, count] of Object.entries(rankCounts)) {
            if (count >= 2) {
                patterns.push({
                    type: 'same_number',
                    description: `出现多张数字为${rank}的牌，强调"${this.numberMeanings[rank]}"的主题`
                });
            }
        }

        // 检查宫廷牌
        const courtCards = cards.filter(c => c.isCourtCard);
        if (courtCards.length >= 2) {
            patterns.push({
                type: 'court_cards',
                description: '多张宫廷牌出现，提示这个问题涉及到具体的人物或角色'
            });
        }

        // 检查王牌（大阿尔卡纳）连续
        const majorIds = cards
            .filter(c => c.type === 'major' && typeof c.id === 'number')
            .map(c => c.id)
            .sort((a, b) => a - b);
        
        for (let i = 0; i < majorIds.length - 1; i++) {
            if (majorIds[i + 1] - majorIds[i] === 1) {
                patterns.push({
                    type: 'sequential_major',
                    description: '连续的大阿尔卡纳牌出现，表示一个重要的生命进程'
                });
                break;
            }
        }

        return patterns;
    }

    /**
     * 趋势分析
     */
    analyzeTrend(cards) {
        if (cards.length < 2) {
            return { direction: 'neutral', description: '牌数不足以分析趋势' };
        }

        // 基于正逆位分布判断趋势
        let positiveScore = 0;
        cards.forEach(card => {
            const score = card.isReversed ? -1 : 1;
            positiveScore += score;
        });

        let direction, description;
        if (positiveScore > cards.length * 0.3) {
            direction = 'positive';
            description = '整体能量积极向上，发展趋势向好。';
        } else if (positiveScore < -cards.length * 0.3) {
            direction = 'challenging';
            description = '整体存在一些挑战，需要关注潜在的阻碍。';
        } else {
            direction = 'balanced';
            description = '整体能量较为平衡，有起有伏属正常状态。';
        }

        return { direction, description, score: positiveScore };
    }

    /**
     * 生成总结
     */
    generateSummary(cards, spread, question) {
        const trend = this.analyzeTrend(cards);
        const elementBalance = this.analyzeElementBalance(cards);
        const majorMinor = this.analyzeMajorMinorRatio(cards);

        let summary = `【${spread.name}解读总结】\n\n`;
        
        if (question) {
            summary += `针对你的问题"${question}"，塔罗给出了以下指引：\n\n`;
        }

        // 核心信息
        const majorCards = cards.filter(c => c.type === 'major');
        if (majorCards.length > 0) {
            summary += `🔮 核心启示：${majorCards.map(c => c.name).join('、')}\n`;
        }

        // 趋势判断
        summary += `\n📈 整体趋势：${trend.description}\n`;

        // 元素分析
        if (elementBalance.dominant) {
            summary += `\n⚡ 主导能量：${elementBalance.dominant.name}元素（${elementBalance.dominant.theme}）\n`;
        }

        // 关键词
        const allKeywords = cards.flatMap(c => c.keywords || []).slice(0, 6);
        if (allKeywords.length > 0) {
            summary += `\n🔑 关键词：${allKeywords.join(' · ')}\n`;
        }

        return summary;
    }

    /**
     * 生成建议
     */
    generateAdvice(cards, spread) {
        const advices = [];
        
        // 基于牌面生成建议
        cards.forEach(card => {
            if (card.keywords && card.keywords.length > 0) {
                const keyword = card.keywords[0];
                if (!card.isReversed) {
                    advices.push(`可以尝试${keyword}方面的行动`);
                } else {
                    advices.push(`注意${keyword}方面可能存在的问题`);
                }
            }
        });

        // 去重并限制数量
        const uniqueAdvices = [...new Set(advices)].slice(0, 3);

        return {
            actions: uniqueAdvices,
            summary: `建议：${uniqueAdvices.join('；')}。`
        };
    }

    /**
     * 获取单张牌的含义
     */
    getSingleCardMeaning(card) {
        const meaning = card.isReversed ? card.reversedMeaning : card.uprightMeaning;
        
        return {
            card: card.name,
            isReversed: card.isReversed,
            meaning,
            keywords: card.keywords,
            description: card.description || `${card.name}代表着${meaning}。`,
            affirmation: this.generateAffirmation(card)
        };
    }

    /**
     * 生成肯定语
     */
    generateAffirmation(card) {
        const keyword = card.keywords?.[0] || '力量';
        const affirmations = {
            '新开始': '我敞开心扉，迎接新的开始。',
            '创造': '我拥有无限的创造力。',
            '爱': '我值得被爱，也懂得爱。',
            '力量': '我内在拥有克服一切的力量。',
            '智慧': '我信任自己的内在智慧。',
            '希望': '我怀抱希望，相信美好的事情即将发生。',
            '平衡': '我在生活的各个方面保持平衡。',
            '转变': '我勇敢拥抱改变，迎接转变。',
            '成功': '我正在走向成功。',
            '自由': '我选择自由地做自己。'
        };

        return affirmations[keyword] || `我拥有${keyword}的力量。`;
    }

    /**
     * 获取元素信息
     */
    getElementInfo(element) {
        return this.elementMeanings[element] || null;
    }

    /**
     * 获取数字学含义
     */
    getNumerologyMeaning(card) {
        if (card.type === 'major' && typeof card.id === 'number') {
            // 大阿尔卡纳使用id作为数字
            const numMeanings = {
                0: '无限可能、新的开始',
                1: '独立、领导、新起点',
                2: '平衡、合作、选择',
                3: '创造、表达、成长',
                4: '稳定、基础、结构',
                5: '变化、自由、挑战',
                6: '和谐、责任、爱',
                7: '灵性、智慧、反思',
                8: '力量、因果、循环',
                9: '完成、智慧、人道',
                10: '圆满、结束、新循环（1+0=1）',
                11: '灵性觉醒、直觉（1+1=2）',
                12: '牺牲、智慧（1+2=3）',
                13: '转变、重生（1+3=4）',
                14: '平衡、调和（1+4=5）',
                15: '阴影、面对（1+5=6）',
                16: '觉醒、重建（1+6=7）',
                17: '希望、灵感（1+7=8）',
                18: '直觉、潜意识（1+8=9）',
                19: '光明、成功（1+9=10→1）',
                20: '觉醒、重生（2+0=2）',
                21: '圆满、完成（2+1=3）'
            };
            return numMeanings[card.id] || '';
        } else if (card.rank) {
            return this.numberMeanings[card.rank] || '';
        }
        return '';
    }
}