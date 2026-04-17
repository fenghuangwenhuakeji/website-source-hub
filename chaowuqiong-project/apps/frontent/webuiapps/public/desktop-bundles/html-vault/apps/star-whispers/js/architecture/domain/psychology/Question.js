/**
 * 问题实体 (Question)
 * 心理测试题目
 */

export class Question {
    static TYPES = {
        SINGLE: 'single',       // 单选
        MULTIPLE: 'multiple',   // 多选
        SCALE: 'scale',         // 量表(1-5分)
        TEXT: 'text'            // 文本输入
    };

    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.text = data.text || '';
        this.type = data.type || Question.TYPES.SINGLE;
        this.options = data.options || [];
        this.dimension = data.dimension || null; // 所属维度
        this.required = data.required !== undefined ? data.required : true;
        this.order = data.order || 0;
        this.scoring = data.scoring || {}; // 评分规则
    }

    /**
     * 生成ID
     */
    generateId() {
        return 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }

    /**
     * 添加选项
     */
    addOption(text, score = 0) {
        this.options.push({ text, score, value: this.options.length });
    }

    /**
     * 计算答案得分
     */
    calculateScore(answer) {
        if (this.type === Question.TYPES.SCALE) {
            return parseInt(answer) || 0;
        }
        
        if (this.type === Question.TYPES.SINGLE) {
            const option = this.options.find(o => o.value === answer || o.text === answer);
            return option ? option.score : 0;
        }
        
        if (this.type === Question.TYPES.MULTIPLE && Array.isArray(answer)) {
            return answer.reduce((total, ans) => {
                const option = this.options.find(o => o.value === ans || o.text === ans);
                return total + (option ? option.score : 0);
            }, 0);
        }
        
        return 0;
    }

    /**
     * 转换为JSON
     */
    toJSON() {
        return {
            id: this.id,
            text: this.text,
            type: this.type,
            options: this.options,
            dimension: this.dimension,
            required: this.required,
            order: this.order
        };
    }
}