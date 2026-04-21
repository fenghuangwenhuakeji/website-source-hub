/**
 * 测试报告生成器 - Report Generator
 * 生成可视化测试报告
 */

export class ReportGenerator {
    constructor() {
        this.templates = this.initTemplates();
    }

    /**
     * 初始化报告模板
     */
    initTemplates() {
        return {
            'personality': this.personalityTemplate.bind(this),
            'emotion': this.emotionTemplate.bind(this),
            'career': this.careerTemplate.bind(this),
            'mental': this.mentalTemplate.bind(this),
            'fun': this.funTemplate.bind(this),
            'default': this.defaultTemplate.bind(this)
        };
    }

    /**
     * 生成报告
     */
    async generate(test, scoreResult) {
        const template = this.templates[test.categoryId] || this.templates['default'];
        return template(test, scoreResult);
    }

    /**
     * 性格测试报告模板
     */
    personalityTemplate(test, scoreResult) {
        return {
            title: `${test.title} 报告`,
            summary: this.generateSummary(test, scoreResult),
            sections: [
                {
                    title: '测试结果',
                    type: 'result',
                    content: scoreResult.description,
                    highlight: scoreResult.type || scoreResult.dominantType || scoreResult.dominant
                },
                {
                    title: '维度分析',
                    type: 'chart',
                    chartType: 'radar',
                    data: this.extractDimensionData(scoreResult)
                },
                {
                    title: '详细解读',
                    type: 'text',
                    content: this.generateDetailedAnalysis(test, scoreResult)
                },
                {
                    title: '发展建议',
                    type: 'list',
                    items: this.generateSuggestions(test, scoreResult)
                }
            ],
            footer: {
                disclaimer: '本测试结果仅供参考，不构成专业心理诊断',
                timestamp: new Date().toISOString()
            }
        };
    }

    /**
     * 情感测试报告模板
     */
    emotionTemplate(test, scoreResult) {
        return {
            title: `${test.title} 报告`,
            summary: this.generateSummary(test, scoreResult),
            sections: [
                {
                    title: '情感画像',
                    type: 'result',
                    content: scoreResult.description,
                    highlight: scoreResult.primary || scoreResult.dominant
                },
                {
                    title: '情感维度',
                    type: 'chart',
                    chartType: 'bar',
                    data: this.extractDimensionData(scoreResult)
                },
                {
                    title: '情感解读',
                    type: 'text',
                    content: this.generateEmotionalAnalysis(scoreResult)
                },
                {
                    title: '关系建议',
                    type: 'list',
                    items: this.generateRelationshipAdvice(scoreResult)
                }
            ],
            footer: {
                disclaimer: '本测试结果仅供参考',
                timestamp: new Date().toISOString()
            }
        };
    }

    /**
     * 职业测试报告模板
     */
    careerTemplate(test, scoreResult) {
        return {
            title: `${test.title} 报告`,
            summary: this.generateSummary(test, scoreResult),
            sections: [
                {
                    title: '职业类型',
                    type: 'result',
                    content: scoreResult.description,
                    highlight: scoreResult.code || scoreResult.dominant
                },
                {
                    title: '兴趣分布',
                    type: 'chart',
                    chartType: 'bar',
                    data: this.extractDimensionData(scoreResult)
                },
                {
                    title: '职业解读',
                    type: 'text',
                    content: this.generateCareerAnalysis(scoreResult)
                },
                {
                    title: '推荐职业',
                    type: 'tags',
                    items: this.getRecommendedCareers(scoreResult)
                },
                {
                    title: '发展建议',
                    type: 'list',
                    items: this.generateCareerAdvice(scoreResult)
                }
            ],
            footer: {
                disclaimer: '本测试结果仅供参考',
                timestamp: new Date().toISOString()
            }
        };
    }

    /**
     * 心理健康测试报告模板
     */
    mentalTemplate(test, scoreResult) {
        return {
            title: `${test.title} 报告`,
            summary: this.generateSummary(test, scoreResult),
            sections: [
                {
                    title: '评估结果',
                    type: 'score',
                    content: scoreResult.description,
                    level: scoreResult.level,
                    score: scoreResult.score || scoreResult.standardScore
                },
                {
                    title: '状态分析',
                    type: 'gauge',
                    data: {
                        value: scoreResult.score || scoreResult.standardScore || 50,
                        level: scoreResult.level
                    }
                },
                {
                    title: '健康建议',
                    type: 'list',
                    items: this.generateHealthAdvice(scoreResult)
                },
                {
                    title: '温馨提示',
                    type: 'warning',
                    content: '如有持续困扰，建议寻求专业心理咨询师的帮助'
                }
            ],
            footer: {
                disclaimer: '本测试为自评量表，仅供参考，不构成医学诊断',
                timestamp: new Date().toISOString()
            }
        };
    }

    /**
     * 趣味测试报告模板
     */
    funTemplate(test, scoreResult) {
        return {
            title: `${test.title} 报告`,
            summary: this.generateSummary(test, scoreResult),
            sections: [
                {
                    title: '测试结果',
                    type: 'result',
                    content: scoreResult.description,
                    highlight: scoreResult.type || scoreResult.dominant
                },
                {
                    title: '趣味解读',
                    type: 'text',
                    content: this.generateFunAnalysis(scoreResult)
                },
                {
                    title: '分享卡片',
                    type: 'share',
                    content: this.generateShareText(test, scoreResult)
                }
            ],
            footer: {
                disclaimer: '趣味测试，仅供娱乐',
                timestamp: new Date().toISOString()
            }
        };
    }

    /**
     * 默认报告模板
     */
    defaultTemplate(test, scoreResult) {
        return {
            title: `${test.title} 报告`,
            summary: this.generateSummary(test, scoreResult),
            sections: [
                {
                    title: '测试结果',
                    type: 'result',
                    content: scoreResult.description,
                    highlight: scoreResult.type || scoreResult.score
                },
                {
                    title: '详细分析',
                    type: 'text',
                    content: this.generateDetailedAnalysis(test, scoreResult)
                }
            ],
            footer: {
                disclaimer: '本测试结果仅供参考',
                timestamp: new Date().toISOString()
            }
        };
    }

    // ==================== 辅助方法 ====================

    generateSummary(test, scoreResult) {
        return `您完成了「${test.title}」，测试结果：${scoreResult.description}`;
    }

    extractDimensionData(scoreResult) {
        if (scoreResult.scores) {
            return {
                labels: Object.keys(scoreResult.scores),
                values: Object.values(scoreResult.scores)
            };
        }
        if (scoreResult.percentages) {
            return {
                labels: Object.keys(scoreResult.percentages),
                values: Object.values(scoreResult.percentages)
            };
        }
        return { labels: ['结果'], values: [scoreResult.score || 50] };
    }

    generateDetailedAnalysis(test, scoreResult) {
        let analysis = `根据您的测试结果，${scoreResult.description}。\n\n`;
        
        if (scoreResult.scores) {
            analysis += '各维度得分：\n';
            Object.entries(scoreResult.scores).forEach(([key, value]) => {
                analysis += `- ${key}: ${value}\n`;
            });
        }
        
        return analysis;
    }

    generateEmotionalAnalysis(scoreResult) {
        return `您的情感特质表现为：${scoreResult.description}。了解自己的情感模式有助于建立更健康的人际关系。`;
    }

    generateCareerAnalysis(scoreResult) {
        return `您的职业倾向：${scoreResult.description}。建议根据自身特点规划职业发展路径。`;
    }

    generateFunAnalysis(scoreResult) {
        return `有趣的发现：${scoreResult.description}。这只是趣味测试，希望能给您带来快乐！`;
    }

    generateSuggestions(test, scoreResult) {
        const suggestions = [];
        
        if (scoreResult.type) {
            suggestions.push(`了解${scoreResult.type}类型的特点和优势`);
            suggestions.push(`发挥自身性格优势`);
            suggestions.push(`注意可能的盲点和成长空间`);
        }
        
        suggestions.push('保持自我觉察，持续成长');
        
        return suggestions;
    }

    generateRelationshipAdvice(scoreResult) {
        return [
            '学会表达自己的情感需求',
            '尊重对方的情感边界',
            '建立健康的沟通模式',
            '保持独立性同时培养亲密感'
        ];
    }

    generateCareerAdvice(scoreResult) {
        return [
            '探索符合自身特点的职业方向',
            '持续学习和提升专业技能',
            '建立职业发展的人脉网络',
            '保持职业发展的灵活性'
        ];
    }

    generateHealthAdvice(scoreResult) {
        const level = scoreResult.level;
        const advices = [];
        
        if (level === '正常' || level === '低') {
            advices.push('继续保持良好的心理状态');
            advices.push('定期关注自己的心理健康');
        } else if (level === '轻度' || level === '中等') {
            advices.push('适当增加放松和休息时间');
            advices.push('可以尝试冥想、运动等减压方式');
            advices.push('与亲友倾诉，寻求支持');
        } else {
            advices.push('建议尽快寻求专业心理咨询');
            advices.push('不要独自承担，寻求帮助是明智的选择');
            advices.push('关注自我照顾，保证基本生活规律');
        }
        
        return advices;
    }

    getRecommendedCareers(scoreResult) {
        const careers = {
            'R': ['工程师', '技术员', '运动员', '农民'],
            'I': ['科学家', '研究员', '分析师', '程序员'],
            'A': ['艺术家', '设计师', '作家', '音乐家'],
            'S': ['教师', '医生', '社工', '咨询师'],
            'E': ['企业家', '销售', '经理', '律师'],
            'C': ['会计', '文员', '管理员', '审计师']
        };
        
        if (scoreResult.code && careers[scoreResult.code[0]]) {
            return careers[scoreResult.code[0]];
        }
        
        return ['根据测试结果推荐适合的职业方向'];
    }

    generateShareText(test, scoreResult) {
        return `我刚完成了「${test.title}」，结果竟然是${scoreResult.description}！快来看看你的结果吧~`;
    }
}