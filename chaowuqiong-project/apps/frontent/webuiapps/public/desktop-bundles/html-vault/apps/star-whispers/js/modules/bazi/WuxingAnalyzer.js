/**
 * 五行分析器 - Wuxing Analyzer
 * 分析八字中的五行分布和平衡
 */

export class WuxingAnalyzer {
    constructor() {
        // 五行
        this.wuxing = ['金', '木', '水', '火', '土'];
        
        // 五行相生
        this.shengMap = {
            '金': '水', '水': '木', '木': '火', '火': '土', '土': '金'
        };
        
        // 五行相克
        this.keMap = {
            '金': '木', '木': '土', '土': '水', '水': '火', '火': '金'
        };
        
        // 五行被生
        this.beiShengMap = {
            '金': '土', '土': '火', '火': '木', '木': '水', '水': '金'
        };
        
        // 五行被克
        this.beiKeMap = {
            '金': '火', '火': '水', '水': '土', '土': '木', '木': '金'
        };
        
        // 五行属性
        this.wuxingProperties = {
            '金': {
                color: '#FFD700',
                direction: '西',
                season: '秋',
                organ: '肺、大肠',
                emotion: '悲',
                personality: ['果断', '坚毅', '正义', '收敛'],
                traits: '代表收敛、肃杀、坚韧'
            },
            '木': {
                color: '#228B22',
                direction: '东',
                season: '春',
                organ: '肝、胆',
                emotion: '怒',
                personality: ['仁慈', '进取', '创造力', '直率'],
                traits: '代表生长、舒展、条达'
            },
            '水': {
                color: '#1E90FF',
                direction: '北',
                season: '冬',
                organ: '肾、膀胱',
                emotion: '恐',
                personality: ['智慧', '灵活', '深沉', '适应力'],
                traits: '代表润下、寒冷、闭藏'
            },
            '火': {
                color: '#FF4500',
                direction: '南',
                season: '夏',
                organ: '心、小肠',
                emotion: '喜',
                personality: ['热情', '开朗', '礼仪', '冲动'],
                traits: '代表炎上、光明、热情'
            },
            '土': {
                color: '#DAA520',
                direction: '中',
                season: '四季末',
                organ: '脾、胃',
                emotion: '思',
                personality: ['稳重', '包容', '诚信', '保守'],
                traits: '代表承载、生化、受纳'
            }
        };
    }

    /**
     * 分析八字五行
     */
    analyze(fourPillars) {
        // 统计五行数量
        const count = this.countWuxing(fourPillars);
        
        // 分析五行强弱
        const strength = this.analyzeStrength(count);
        
        // 找出缺失的五行
        const missing = this.findMissing(count);
        
        // 找出主导五行
        const dominant = this.findDominant(count);
        
        // 分析五行平衡度
        const balance = this.analyzeBalance(count);
        
        // 生成建议
        const suggestions = this.generateSuggestions(missing, dominant, balance);

        return {
            count,
            strength,
            missing,
            dominant,
            balance,
            suggestions,
            chart: this.generateChartData(count)
        };
    }

    /**
     * 统计五行数量
     */
    countWuxing(fourPillars) {
        const count = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };
        
        // 遍历四柱
        ['year', 'month', 'day', 'hour'].forEach(pillar => {
            const p = fourPillars[pillar];
            
            // 统计天干
            count[p.wuxing.gan]++;
            
            // 统计地支
            count[p.wuxing.zhi]++;
            
            // 统计藏干（权重较低）
            p.cangGan.forEach(gan => {
                const wuxing = this.getGanWuxing(gan);
                if (wuxing) count[wuxing] += 0.5;
            });
        });
        
        return count;
    }

    /**
     * 获取天干五行
     */
    getGanWuxing(gan) {
        const ganWuxingMap = {
            '甲': '木', '乙': '木',
            '丙': '火', '丁': '火',
            '戊': '土', '己': '土',
            '庚': '金', '辛': '金',
            '壬': '水', '癸': '水'
        };
        return ganWuxingMap[gan];
    }

    /**
     * 分析五行强弱
     */
    analyzeStrength(count) {
        const total = Object.values(count).reduce((a, b) => a + b, 0);
        const strength = {};
        
        this.wuxing.forEach(w => {
            const percentage = (count[w] / total * 100).toFixed(1);
            let level;
            
            if (count[w] === 0) level = '缺';
            else if (count[w] < total * 0.1) level = '弱';
            else if (count[w] > total * 0.3) level = '旺';
            else level = '平';
            
            strength[w] = {
                count: count[w],
                percentage: `${percentage}%`,
                level,
                property: this.wuxingProperties[w]
            };
        });
        
        return strength;
    }

    /**
     * 找出缺失的五行
     */
    findMissing(count) {
        const missing = [];
        this.wuxing.forEach(w => {
            if (count[w] === 0) {
                missing.push({
                    wuxing: w,
                    property: this.wuxingProperties[w],
                    remedy: this.getRemedy(w)
                });
            }
        });
        return missing;
    }

    /**
     * 获取补五行建议
     */
    getRemedy(wuxing) {
        const remedies = {
            '金': {
                colors: ['白色', '金色', '银色'],
                directions: '西方',
                numbers: [7, 8],
                careers: ['金融', '法律', '军警', '机械'],
                habits: '多穿白色、金色衣物，佩戴金银饰品',
                foods: '白萝卜、白菜、鸡肉'
            },
            '木': {
                colors: ['绿色', '青色'],
                directions: '东方',
                numbers: [3, 8],
                careers: ['教育', '文化', '艺术', '医疗'],
                habits: '多养绿植，穿绿色衣物，多去森林',
                foods: '绿色蔬菜、水果、坚果'
            },
            '水': {
                colors: ['黑色', '蓝色'],
                directions: '北方',
                numbers: [1, 6],
                careers: ['贸易', '航运', '旅游', '传媒'],
                habits: '多接触水，穿黑蓝色衣物，北方发展',
                foods: '海鲜、豆类、黑色食物'
            },
            '火': {
                colors: ['红色', '紫色', '橙色'],
                directions: '南方',
                numbers: [2, 7],
                careers: ['电子', '网络', '餐饮', '娱乐'],
                habits: '多晒太阳，穿红色系衣物，南方发展',
                foods: '红色食物、辣椒、羊肉'
            },
            '土': {
                colors: ['黄色', '棕色', '咖啡色'],
                directions: '中央',
                numbers: [5, 10],
                careers: ['房地产', '建筑', '农业', '珠宝'],
                habits: '多接触土地，穿黄棕色衣物',
                foods: '黄色食物、土豆、牛肉'
            }
        };
        return remedies[wuxing];
    }

    /**
     * 找出主导五行
     */
    findDominant(count) {
        let maxCount = 0;
        let dominant = null;
        
        this.wuxing.forEach(w => {
            if (count[w] > maxCount) {
                maxCount = count[w];
                dominant = w;
            }
        });
        
        if (dominant) {
            return {
                wuxing: dominant,
                count: maxCount,
                property: this.wuxingProperties[dominant]
            };
        }
        return null;
    }

    /**
     * 分析五行平衡度
     */
    analyzeBalance(count) {
        const values = Object.values(count);
        const total = values.reduce((a, b) => a + b, 0);
        const avg = total / 5;
        
        // 计算标准差
        const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / 5;
        const stdDev = Math.sqrt(variance);
        
        // 平衡度评分 (0-100)
        const balanceScore = Math.max(0, 100 - stdDev * 20);
        
        let level, description;
        if (balanceScore >= 80) {
            level = '非常平衡';
            description = '五行分布均衡，命局较为完美';
        } else if (balanceScore >= 60) {
            level = '比较平衡';
            description = '五行分布较为均匀，有小幅偏差';
        } else if (balanceScore >= 40) {
            level = '一般';
            description = '五行有些偏颇，需要注意调节';
        } else {
            level = '失衡';
            description = '五行严重失衡，建议通过后弥补足';
        }
        
        return {
            score: balanceScore.toFixed(0),
            level,
            description,
            standardDeviation: stdDev.toFixed(2)
        };
    }

    /**
     * 生成建议
     */
    generateSuggestions(missing, dominant, balance) {
        const suggestions = [];
        
        // 针对缺失五行的建议
        missing.forEach(m => {
            suggestions.push({
                type: '补缺',
                wuxing: m.wuxing,
                suggestion: `建议补充${m.wuxing}元素：${m.remedy.habits}`,
                details: m.remedy
            });
        });
        
        // 针对主导五行的建议
        if (dominant) {
            const beiKe = this.beiKeMap[dominant.wuxing];
            suggestions.push({
                type: '平衡',
                wuxing: dominant.wuxing,
                suggestion: `${dominant.wuxing}气较旺，可用${beiKe}来调节平衡`,
                details: `主导五行为${dominant.wuxing}，${this.wuxingProperties[dominant.wuxing].traits}`
            });
        }
        
        // 整体平衡建议
        if (balance.score < 60) {
            suggestions.push({
                type: '整体',
                suggestion: '建议通过颜色、方位、职业等方面调节五行平衡',
                details: balance.description
            });
        }
        
        return suggestions;
    }

    /**
     * 生成图表数据
     */
    generateChartData(count) {
        return {
            type: 'radar',
            data: {
                labels: this.wuxing,
                datasets: [{
                    label: '五行分布',
                    data: this.wuxing.map(w => count[w]),
                    backgroundColor: this.wuxing.map(w => 
                        this.hexToRgba(this.wuxingProperties[w].color, 0.3)
                    ),
                    borderColor: this.wuxing.map(w => this.wuxingProperties[w].color),
                    borderWidth: 2
                }]
            },
            options: {
                scales: {
                    r: {
                        beginAtZero: true,
                        max: Math.max(...Object.values(count)) + 1
                    }
                }
            }
        };
    }

    /**
     * 十六进制转RGBA
     */
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /**
     * 获取五行相生关系
     */
    getShengRelation(from, to) {
        if (this.shengMap[from] === to) {
            return { relation: '生', direction: 'from' };
        }
        if (this.shengMap[to] === from) {
            return { relation: '生', direction: 'to' };
        }
        return null;
    }

    /**
     * 获取五行相克关系
     */
    getKeRelation(from, to) {
        if (this.keMap[from] === to) {
            return { relation: '克', direction: 'from' };
        }
        if (this.keMap[to] === from) {
            return { relation: '克', direction: 'to' };
        }
        return null;
    }

    /**
     * 获取五行关系描述
     */
    getRelationDescription(w1, w2) {
        const relations = [];
        
        if (this.shengMap[w1] === w2) {
            relations.push({ type: '相生', description: `${w1}生${w2}` });
        }
        if (this.shengMap[w2] === w1) {
            relations.push({ type: '相生', description: `${w2}生${w1}` });
        }
        if (this.keMap[w1] === w2) {
            relations.push({ type: '相克', description: `${w1}克${w2}` });
        }
        if (this.keMap[w2] === w1) {
            relations.push({ type: '相克', description: `${w2}克${w1}` });
        }
        
        return relations.length > 0 ? relations : [{ type: '无直接关系', description: `${w1}与${w2}无直接生克关系` }];
    }
}