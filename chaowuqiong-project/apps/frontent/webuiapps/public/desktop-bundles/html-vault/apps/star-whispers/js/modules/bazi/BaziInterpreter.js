/**
 * 八字解读引擎 - Bazi Interpreter
 * 智能解读八字命盘
 */

export class BaziInterpreter {
    constructor() {
        // 性格解读模板
        this.personalityTemplates = this.initPersonalityTemplates();
        
        // 事业解读模板
        this.careerTemplates = this.initCareerTemplates();
        
        // 感情解读模板
        this.relationshipTemplates = this.initRelationshipTemplates();
        
        // 健康解读模板
        this.healthTemplates = this.initHealthTemplates();
    }

    /**
     * 综合解读
     */
    interpret(baziData) {
        const { fourPillars, wuxingAnalysis, tenGods, dayun } = baziData;
        
        // 1. 基本性格分析
        const personality = this.interpretPersonality(fourPillars, wuxingAnalysis);
        
        // 2. 事业方向分析
        const career = this.interpretCareer(fourPillars, wuxingAnalysis, tenGods);
        
        // 3. 感情婚姻分析
        const relationship = this.interpretRelationship(fourPillars, tenGods);
        
        // 4. 健康运势分析
        const health = this.interpretHealth(wuxingAnalysis);
        
        // 5. 财运分析
        const wealth = this.interpretWealth(tenGods, wuxingAnalysis);
        
        // 6. 大运分析
        const dayunAnalysis = this.interpretDayun(dayun);
        
        // 7. 生成总结
        const summary = this.generateSummary(baziData, {
            personality,
            career,
            relationship,
            health,
            wealth
        });

        return {
            personality,
            career,
            relationship,
            health,
            wealth,
            dayunAnalysis,
            summary
        };
    }

    /**
     * 性格解读
     */
    interpretPersonality(fourPillars, wuxingAnalysis) {
        const dayGan = fourPillars.day.gan;
        const dayZhi = fourPillars.day.zhi;
        const dominantWuxing = wuxingAnalysis.dominant;
        
        // 日主性格
        const dayMasterPersonality = this.getDayMasterPersonality(dayGan);
        
        // 主导五行性格
        const wuxingPersonality = dominantWuxing ? 
            this.getWuxingPersonality(dominantWuxing.wuxing) : null;
        
        // 综合性格描述
        let description = dayMasterPersonality.description;
        if (wuxingPersonality && dominantWuxing.wuxing !== fourPillars.day.wuxing.gan) {
            description += `同时，由于${dominantWuxing.wuxing}气较旺，${wuxingPersonality.influence}`;
        }
        
        return {
            dayMaster: {
                gan: dayGan,
                name: this.getDayMasterName(dayGan),
                ...dayMasterPersonality
            },
            dominantWuxing: dominantWuxing ? {
                ...dominantWuxing,
                personality: wuxingPersonality
            } : null,
            traits: this.extractTraits(dayMasterPersonality, wuxingPersonality),
            description,
            advice: this.getPersonalityAdvice(dayGan, wuxingAnalysis)
        };
    }

    /**
     * 获取日主性格
     */
    getDayMasterPersonality(gan) {
        const personalities = {
            '甲': {
                element: '木',
                traits: ['正直', '刚毅', '进取', '有担当'],
                strengths: '意志坚定，有领导力，富有创造力',
                weaknesses: '有时过于固执，不善变通',
                description: '甲木日主如参天大树，性格刚直不阿，有上进心，喜欢助人为乐。做事有计划、有条理，是天生的领导者。'
            },
            '乙': {
                element: '木',
                traits: ['温柔', '灵活', '善解人意', '有韧性'],
                strengths: '适应力强，善于沟通，富有同情心',
                weaknesses: '有时优柔寡断，容易受他人影响',
                description: '乙木日主如藤蔓花草，性格温和柔顺，善于变通。心思细腻，懂得察言观色，人际关系处理得当。'
            },
            '丙': {
                element: '火',
                traits: ['热情', '开朗', '正直', '有感染力'],
                strengths: '积极乐观，表达能力强，有号召力',
                weaknesses: '有时急躁冲动，缺乏耐心',
                description: '丙火日主如太阳光芒，热情洋溢，充满正能量。为人光明磊落，不喜欢阴险狡诈，是天生的表演者。'
            },
            '丁': {
                element: '火',
                traits: ['细腻', '敏感', '有洞察力', '浪漫'],
                strengths: '心思细腻，富有艺术天分，有第六感',
                weaknesses: '多愁善感，有时过于敏感',
                description: '丁火日主如烛光灯火，温柔内敛，心思细腻。有很强的直觉和洞察力，善于发现美、创造美。'
            },
            '戊': {
                element: '土',
                traits: ['稳重', '可靠', '务实', '有担当'],
                strengths: '踏实稳重，值得信赖，有责任心',
                weaknesses: '有时过于保守，缺乏变通',
                description: '戊土日主如高山大地，稳重可靠，是很好的依靠。做事脚踏实地，不喜欢投机取巧，有很强的责任心。'
            },
            '己': {
                element: '土',
                traits: ['包容', '谨慎', '细腻', '有耐心'],
                strengths: '理解力强，善于倾听，心思缜密',
                weaknesses: '有时过于谨慎，错失机会',
                description: '己土日主如田园之土，温润包容，善于培育。心思细腻，做事有条理，是很好的合作伙伴。'
            },
            '庚': {
                element: '金',
                traits: ['果断', '刚毅', '正义', '有魄力'],
                strengths: '决策力强，执行力高，讲义气',
                weaknesses: '有时过于刚硬，缺乏柔和',
                description: '庚金日主如钢铁刀剑，刚毅果敢，有侠义心肠。是非分明，嫉恶如仇，是天生的改革者。'
            },
            '辛': {
                element: '金',
                traits: ['细腻', '精致', '有品味', '追求完美'],
                strengths: '审美能力强，注重细节，有艺术天赋',
                weaknesses: '有时过于挑剔，要求过高',
                description: '辛金日主如珠宝首饰，精致优雅，追求完美。有很强的审美能力和艺术天赋，注重生活品质。'
            },
            '壬': {
                element: '水',
                traits: ['聪明', '灵活', '有洞察力', '善变'],
                strengths: '思维敏捷，适应力强，有远见',
                weaknesses: '有时缺乏定性，想法多变',
                description: '壬水日主如江河湖海，思维活跃，智慧深邃。善于变通，有很强的适应能力和洞察力。'
            },
            '癸': {
                element: '水',
                traits: ['温柔', '内向', '有灵性', '善思考'],
                strengths: '悟性高，直觉强，有哲学思维',
                weaknesses: '有时过于内向，不善于表达',
                description: '癸水日主如雨露甘霖，温柔内敛，有很强的灵性。善于思考，悟性极高，有哲学家的潜质。'
            }
        };
        
        return personalities[gan] || personalities['甲'];
    }

    /**
     * 获取日主名称
     */
    getDayMasterName(gan) {
        const names = {
            '甲': '甲木', '乙': '乙木',
            '丙': '丙火', '丁': '丁火',
            '戊': '戊土', '己': '己土',
            '庚': '庚金', '辛': '辛金',
            '壬': '壬水', '癸': '癸水'
        };
        return names[gan] || gan;
    }

    /**
     * 获取五行性格
     */
    getWuxingPersonality(wuxing) {
        const personalities = {
            '金': {
                traits: ['果断', '坚毅', '正义', '收敛'],
                influence: '使你更加果断坚定，有很强的原则性和正义感。'
            },
            '木': {
                traits: ['仁慈', '进取', '创造', '直率'],
                influence: '使你更加积极进取，有创造力和同理心。'
            },
            '水': {
                traits: ['智慧', '灵活', '深沉', '适应'],
                influence: '使你思维活跃，智慧深邃，有很强的适应力。'
            },
            '火': {
                traits: ['热情', '开朗', '礼仪', '冲动'],
                influence: '使你热情洋溢，有感染力，但有时也会冲动。'
            },
            '土': {
                traits: ['稳重', '包容', '诚信', '保守'],
                influence: '使你踏实稳重，可靠包容，但有时过于保守。'
            }
        };
        return personalities[wuxing];
    }

    /**
     * 提取性格特质
     */
    extractTraits(dayMaster, wuxing) {
        let traits = [...dayMaster.traits];
        if (wuxing && wuxing.traits) {
            wuxing.traits.forEach(t => {
                if (!traits.includes(t)) {
                    traits.push(t);
                }
            });
        }
        return traits.slice(0, 6);
    }

    /**
     * 获取性格建议
     */
    getPersonalityAdvice(dayGan, wuxingAnalysis) {
        const missing = wuxingAnalysis.missing;
        const advices = [];
        
        if (missing.length > 0) {
            missing.forEach(m => {
                advices.push(`五行缺${m.wuxing}，建议${m.remedy.habits}以补足。`);
            });
        }
        
        if (wuxingAnalysis.balance.score < 60) {
            advices.push('五行略有失衡，建议通过日常习惯调节，保持身心平衡。');
        }
        
        return advices;
    }

    /**
     * 事业解读
     */
    interpretCareer(fourPillars, wuxingAnalysis, tenGods) {
        const dominantWuxing = wuxingAnalysis.dominant;
        
        // 根据五行推荐职业
        const careerDirection = dominantWuxing ? 
            this.getCareerByWuxing(dominantWuxing.wuxing) : null;
        
        // 根据十神分析事业特点
        const careerTraits = this.getCareerTraits(tenGods);
        
        // 事业发展建议
        const development = this.getCareerDevelopment(fourPillars, wuxingAnalysis);

        return {
            direction: careerDirection,
            traits: careerTraits,
            development,
            suitableIndustries: careerDirection?.industries || [],
            advice: this.getCareerAdvice(wuxingAnalysis)
        };
    }

    /**
     * 根据五行获取职业方向
     */
    getCareerByWuxing(wuxing) {
        const careers = {
            '金': {
                industries: ['金融', '法律', '军警', '机械', '珠宝', '医疗外科'],
                description: '适合从事需要果断决策、精确执行的行业',
                direction: '西方'
            },
            '木': {
                industries: ['教育', '文化', '艺术', '医疗', '环保', '农业'],
                description: '适合从事教育文化、创意设计、生命科学相关行业',
                direction: '东方'
            },
            '水': {
                industries: ['贸易', '航运', '旅游', '传媒', '酒水饮料', '物流'],
                description: '适合从事流动性大、需要灵活应变的行业',
                direction: '北方'
            },
            '火': {
                industries: ['电子', '网络', '餐饮', '娱乐', '美容', '能源'],
                description: '适合从事热情奔放、创意表现的行业',
                direction: '南方'
            },
            '土': {
                industries: ['房地产', '建筑', '农业', '珠宝', '保险', '人力资源'],
                description: '适合从事稳定可靠、需要耐心的行业',
                direction: '中央'
            }
        };
        return careers[wuxing];
    }

    /**
     * 获取事业特点
     */
    getCareerTraits(tenGods) {
        // 简化处理，根据十神分布判断
        const traits = [];
        
        if (tenGods.month.gan.includes('官')) {
            traits.push('有管理才能');
        }
        if (tenGods.month.gan.includes('财')) {
            traits.push('经商意识强');
        }
        if (tenGods.month.gan.includes('印')) {
            traits.push('学术研究型');
        }
        if (tenGods.month.gan.includes('食')) {
            traits.push('创意表达型');
        }
        
        return traits.length > 0 ? traits : ['稳健发展型'];
    }

    /**
     * 事业发展建议
     */
    getCareerDevelopment(fourPillars, wuxingAnalysis) {
        const balance = wuxingAnalysis.balance;
        
        if (balance.score >= 70) {
            return {
                level: '顺利',
                description: '五行均衡，事业发展较为顺利，多方面发展都有机会成功。'
            };
        } else if (balance.score >= 50) {
            return {
                level: '平稳',
                description: '需要在特定领域深耕，专注才能有所成就。'
            };
        } else {
            return {
                level: '波折',
                description: '事业发展可能有些波折，建议找到适合自己的方向后坚持努力。'
            };
        }
    }

    /**
     * 事业建议
     */
    getCareerAdvice(wuxingAnalysis) {
        const advices = [];
        const dominant = wuxingAnalysis.dominant;
        
        if (dominant) {
            advices.push(`主气为${dominant.wuxing}，向${this.getCareerByWuxing(dominant.wuxing)?.direction}发展较为有利。`);
        }
        
        wuxingAnalysis.missing.forEach(m => {
            if (m.remedy.careers) {
                advices.push(`也可考虑${m.remedy.careers.join('、')}等行业。`);
            }
        });
        
        return advices;
    }

    /**
     * 感情解读
     */
    interpretRelationship(fourPillars, tenGods) {
        // 分析婚姻宫
        const marriagePalace = fourPillars.day.zhi;
        
        // 分析配偶特点
        const spouseTraits = this.getSpouseTraits(tenGods, marriagePalace);
        
        // 感情建议
        const advice = this.getRelationshipAdvice(fourPillars);

        return {
            marriagePalace: {
                zhi: marriagePalace,
                meaning: this.getMarriagePalaceMeaning(marriagePalace)
            },
            spouseTraits,
            advice
        };
    }

    /**
     * 婚姻宫含义
     */
    getMarriagePalaceMeaning(zhi) {
        const meanings = {
            '子': '配偶聪明伶俐，有智慧',
            '丑': '配偶踏实稳重，勤劳肯干',
            '寅': '配偶积极进取，有冒险精神',
            '卯': '配偶温柔善良，有艺术气质',
            '辰': '配偶稳重大方，有责任心',
            '巳': '配偶热情开朗，有表达能力',
            '午': '配偶阳光积极，有领导才能',
            '未': '配偶温和大度，有包容心',
            '申': '配偶机智灵活，善于变通',
            '酉': '配偶精致优雅，有审美情趣',
            '戌': '配偶忠诚可靠，有正义感',
            '亥': '配偶聪明敏感，有直觉力'
        };
        return meanings[zhi] || '配偶性格独特';
    }

    /**
     * 配偶特点
     */
    getSpouseTraits(tenGods, marriagePalace) {
        const traits = [];
        
        // 根据十神分析
        const hourGan = tenGods.hour?.gan;
        if (hourGan) {
            if (hourGan.includes('财')) {
                traits.push('务实稳重');
            }
            if (hourGan.includes('官')) {
                traits.push('有责任感');
            }
            if (hourGan.includes('印')) {
                traits.push('温柔体贴');
            }
        }
        
        return traits.length > 0 ? traits : ['性格独特'];
    }

    /**
     * 感情建议
     */
    getRelationshipAdvice(fourPillars) {
        const advices = [];
        const dayZhi = fourPillars.day.zhi;
        
        // 根据日支给出建议
        advices.push('建议在感情中保持真诚，相互理解和包容。');
        
        return advices;
    }

    /**
     * 健康解读
     */
    interpretHealth(wuxingAnalysis) {
        const organHealth = {};
        const advices = [];
        
        // 根据五行分析对应脏腑
        const wuxingOrgans = {
            '金': { organs: '肺、大肠', issues: '呼吸系统、皮肤问题' },
            '木': { organs: '肝、胆', issues: '神经系统、眼睛问题' },
            '水': { organs: '肾、膀胱', issues: '泌尿系统、耳朵问题' },
            '火': { organs: '心、小肠', issues: '心血管、血液循环问题' },
            '土': { organs: '脾、胃', issues: '消化系统、肌肉问题' }
        };
        
        // 检查缺失或过旺的五行
        wuxingAnalysis.missing.forEach(m => {
            const organ = wuxingOrgans[m.wuxing];
            organHealth[m.wuxing] = {
                status: '需注意',
                organs: organ.organs,
                advice: `五行缺${m.wuxing}，需注意${organ.issues}的保养。`
            };
            advices.push(organHealth[m.wuxing].advice);
        });
        
        if (wuxingAnalysis.dominant) {
            const dominantWuxing = wuxingAnalysis.dominant.wuxing;
            const organ = wuxingOrgans[dominantWuxing];
            organHealth[dominantWuxing] = {
                status: '旺盛',
                organs: organ.organs,
                advice: `${dominantWuxing}气旺盛，相应脏腑功能较强。`
            };
        }

        return {
            organHealth,
            advices,
            generalAdvice: '建议保持规律作息，均衡饮食，适量运动，定期体检。'
        };
    }

    /**
     * 财运解读
     */
    interpretWealth(tenGods, wuxingAnalysis) {
        // 分析财星
        const wealthStars = this.findWealthStars(tenGods);
        
        // 财运评级
        const rating = this.rateWealth(wealthStars, wuxingAnalysis);
        
        return {
            stars: wealthStars,
            rating,
            advice: this.getWealthAdvice(rating, wuxingAnalysis)
        };
    }

    /**
     * 查找财星
     */
    findWealthStars(tenGods) {
        const stars = [];
        const positions = ['year', 'month', 'hour'];
        
        positions.forEach(pos => {
            const gan = tenGods[pos]?.gan;
            if (gan === '正财' || gan === '偏财') {
                stars.push({
                    position: pos === 'year' ? '年柱' : pos === 'month' ? '月柱' : '时柱',
                    type: gan
                });
            }
        });
        
        return stars;
    }

    /**
     * 财运评级
     */
    rateWealth(stars, wuxingAnalysis) {
        const score = stars.length * 25 + (wuxingAnalysis.balance.score / 5);
        
        if (score >= 70) return { level: '佳', stars: 4, description: '财运较好，有聚财之能' };
        if (score >= 50) return { level: '中', stars: 3, description: '财运平稳，正财为主' };
        if (score >= 30) return { level: '一般', stars: 2, description: '财运普通，需要努力' };
        return { level: '需努力', stars: 1, description: '财运需靠努力积累' };
    }

    /**
     * 财运建议
     */
    getWealthAdvice(rating, wuxingAnalysis) {
        const advices = [];
        
        if (rating.stars >= 3) {
            advices.push('财运不错，可以适当投资理财。');
        } else {
            advices.push('建议脚踏实地，通过努力工作积累财富。');
        }
        
        const missing = wuxingAnalysis.missing;
        missing.forEach(m => {
            if (m.remedy.careers) {
                advices.push(`从事${m.remedy.careers.slice(0, 2).join('、')}等行业有助于财运。`);
            }
        });
        
        return advices;
    }

    /**
     * 大运解读
     */
    interpretDayun(dayun) {
        const currentYear = new Date().getFullYear();
        const currentAge = currentYear; // 简化处理
        
        // 找到当前大运
        let currentDayun = null;
        dayun.list.forEach((d, index) => {
            if (currentAge >= d.startAge && currentAge <= d.endAge) {
                currentDayun = d;
            }
        });
        
        return {
            direction: dayun.direction,
            current: currentDayun,
            upcoming: dayun.list.find(d => d.startAge > (currentDayun?.endAge || 0)),
            description: currentDayun ? 
                `当前处于第${currentDayun.index}步大运（${currentDayun.ganZhi}），年龄${currentDayun.ageRange}。` :
                '暂无当前大运信息'
        };
    }

    /**
     * 生成总结
     */
    generateSummary(baziData, interpretations) {
        const { fourPillars, wuxingAnalysis } = baziData;
        
        let summary = `【八字命盘解读总结】\n\n`;
        summary += `📜 四柱八字：${fourPillars.summary}\n\n`;
        
        // 五行概况
        summary += `⚖️ 五行分布：`;
        Object.entries(wuxingAnalysis.count).forEach(([w, count]) => {
            summary += `${w}${count.toFixed(1)} `;
        });
        summary += `\n`;
        summary += `平衡度：${wuxingAnalysis.balance.level}（${wuxingAnalysis.balance.score}分）\n\n`;
        
        // 性格概括
        summary += `👤 性格特点：${interpretations.personality.traits.slice(0, 4).join('、')}\n\n`;
        
        // 事业方向
        if (interpretations.career.direction) {
            summary += `💼 事业方向：${interpretations.career.direction.industries.slice(0, 3).join('、')}\n\n`;
        }
        
        // 财运
        summary += `💰 财运评级：${interpretations.wealth.rating.description}\n\n`;
        
        // 建议
        if (wuxingAnalysis.missing.length > 0) {
            summary += `💡 补缺建议：`;
            wuxingAnalysis.missing.forEach(m => {
                summary += `缺${m.wuxing}可${m.remedy.habits}；`;
            });
            summary += `\n`;
        }
        
        return summary;
    }

    /**
     * 获取每日运势
     */
    getDailyFortune(bazi, dayPillar) {
        // 简化的每日运势生成
        const dayGan = dayPillar.gan;
        const dayZhi = dayPillar.zhi;
        const selfGan = bazi.fourPillars.day.gan;
        
        // 计算日干与自身的关系
        const relation = this.getDayRelation(selfGan, dayGan);
        
        return {
            date: new Date().toLocaleDateString('zh-CN'),
            dayPillar: dayPillar.ganZhi,
            relation,
            fortune: this.getDailyFortuneText(relation),
            advice: '保持积极心态，抓住机遇，注意休息。'
        };
    }

    /**
     * 获取日干关系
     */
    getDayRelation(selfGan, dayGan) {
        // 简化处理
        const ganOrder = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
        const selfIndex = ganOrder.indexOf(selfGan);
        const dayIndex = ganOrder.indexOf(dayGan);
        const diff = (dayIndex - selfIndex + 10) % 10;
        
        const relations = ['比肩日', '劫财日', '食神日', '伤官日', '正财日', 
                          '偏财日', '正官日', '七杀日', '正印日', '偏印日'];
        return relations[diff];
    }

    /**
     * 获取每日运势文字
     */
    getDailyFortuneText(relation) {
        const fortunes = {
            '比肩日': '今日状态平稳，适合合作共事',
            '劫财日': '今日需谨慎理财，避免冲动消费',
            '食神日': '今日创意迸发，适合艺术创作',
            '伤官日': '今日表达欲强，注意言辞',
            '正财日': '今日财运不错，有进财机会',
            '偏财日': '今日有意外之财的可能',
            '正官日': '今日工作顺利，有贵人相助',
            '七杀日': '今日压力大，需谨慎行事',
            '正印日': '今日学习运好，适合充电',
            '偏印日': '今日思绪活跃，有独到见解'
        };
        return fortunes[relation] || '今日平稳，保持积极心态';
    }

    /**
     * 配对分析
     */
    analyzeCompatibility(bazi1, bazi2) {
        // 五行互补分析
        const wuxing1 = bazi1.wuxingAnalysis.count;
        const wuxing2 = bazi2.wuxingAnalysis.count;
        
        let complementScore = 0;
        const details = [];
        
        // 检查互补
        ['金', '木', '水', '火', '土'].forEach(w => {
            if ((wuxing1[w] === 0 && wuxing2[w] > 0) || 
                (wuxing2[w] === 0 && wuxing1[w] > 0)) {
                complementScore += 20;
                details.push(`五行互补：一方缺${w}，另一方有${w}`);
            }
        });
        
        // 日主关系
        const gan1 = bazi1.fourPillars.day.gan;
        const gan2 = bazi2.fourPillars.day.gan;
        const relation = this.getGanRelation(gan1, gan2);
        
        return {
            score: Math.min(100, complementScore + 40),
            level: complementScore >= 60 ? '较好' : complementScore >= 30 ? '一般' : '需磨合',
            complementDetails: details,
            dayMasterRelation: relation,
            advice: this.getCompatibilityAdvice(complementScore)
        };
    }

    /**
     * 天干关系
     */
    getGanRelation(gan1, gan2) {
        // 简化处理，返回相合相冲
        const combinations = [
            ['甲', '己'], ['乙', '庚'], ['丙', '辛'], ['丁', '壬'], ['戊', '癸']
        ];
        
        for (const [a, b] of combinations) {
            if ((gan1 === a && gan2 === b) || (gan1 === b && gan2 === a)) {
                return { type: '相合', description: `${gan1}与${gan2}相合` };
            }
        }
        
        return { type: '一般', description: `${gan1}与${gan2}无特殊关系` };
    }

    /**
     * 配对建议
     */
    getCompatibilityAdvice(score) {
        if (score >= 60) {
            return '五行互补性较好，相处会比较和谐，建议多沟通交流。';
        } else if (score >= 30) {
            return '五行互补一般，需要双方多包容理解，共同努力。';
        }
        return '五行互补较弱，可能需要更多磨合，但也不必过于在意命理，感情在于经营。';
    }

    /**
     * 初始化性格模板
     */
    initPersonalityTemplates() {
        return {};
    }

    /**
     * 初始化事业模板
     */
    initCareerTemplates() {
        return {};
    }

    /**
     * 初始化感情模板
     */
    initRelationshipTemplates() {
        return {};
    }

    /**
     * 初始化健康模板
     */
    initHealthTemplates() {
        return {};
    }
}