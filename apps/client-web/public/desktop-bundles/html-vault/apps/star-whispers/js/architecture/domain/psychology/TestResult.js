/**
 * 测试结果实体 (TestResult)
 * 心理测试结果和报告
 */

export class TestResult {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.testId = data.testId;
        this.userId = data.userId;
        this.completedAt = data.completedAt || new Date();
        this.duration = data.duration || 0; // 完成用时(秒)
        
        // 维度分数
        this.dimensionScores = data.dimensionScores || {};
        
        // 总分
        this.totalScore = data.totalScore || 0;
        
        // 结果类型
        this.resultType = data.resultType || null;
        
        // 结果描述
        this.description = data.description || '';
        
        // 详细分析
        this.analysis = data.analysis || {
            strengths: [],
            weaknesses: [],
            advice: '',
            traits: []
        };
        
        // AI生成的深度解读
        this.aiInterpretation = data.aiInterpretation || null;
    }

    /**
     * 生成ID
     */
    generateId() {
        return 'result_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 设置维度分数
     */
    setDimensionScore(dimension, score) {
        this.dimensionScores[dimension] = score;
        this.recalculateTotal();
    }

    /**
     * 重新计算总分
     */
    recalculateTotal() {
        const scores = Object.values(this.dimensionScores);
        this.totalScore = scores.length > 0 
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : 0;
    }

    /**
     * 获取最高维度
     */
    getHighestDimension() {
        let highest = null;
        let maxScore = -Infinity;
        
        for (const [dimension, score] of Object.entries(this.dimensionScores)) {
            if (score > maxScore) {
                maxScore = score;
                highest = dimension;
            }
        }
        
        return { dimension: highest, score: maxScore };
    }

    /**
     * 获取最低维度
     */
    getLowestDimension() {
        let lowest = null;
        let minScore = Infinity;
        
        for (const [dimension, score] of Object.entries(this.dimensionScores)) {
            if (score < minScore) {
                minScore = score;
                lowest = dimension;
            }
        }
        
        return { dimension: lowest, score: minScore };
    }

    /**
     * 获取结果等级
     */
    getLevel() {
        const score = this.totalScore;
        if (score >= 90) return 'excellent';
        if (score >= 75) return 'good';
        if (score >= 60) return 'average';
        if (score >= 40) return 'below_average';
        return 'needs_improvement';
    }

    /**
     * 转换为JSON
     */
    toJSON() {
        return {
            id: this.id,
            testId: this.testId,
            userId: this.userId,
            completedAt: this.completedAt,
            duration: this.duration,
            dimensionScores: this.dimensionScores,
            totalScore: this.totalScore,
            resultType: this.resultType,
            description: this.description,
            analysis: this.analysis,
            level: this.getLevel(),
            highestDimension: this.getHighestDimension(),
            lowestDimension: this.getLowestDimension()
        };
    }
}