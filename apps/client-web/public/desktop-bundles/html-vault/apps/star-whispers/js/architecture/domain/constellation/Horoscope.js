/**
 * 运势实体 (Horoscope)
 * 存储和管理星座运势数据
 */

export class Horoscope {
    static PERIODS = {
        TODAY: 'today',
        TOMORROW: 'tomorrow',
        WEEK: 'week',
        MONTH: 'month',
        YEAR: 'year'
    };

    static DIMENSIONS = {
        COMPREHENSIVE: 'comprehensive',  // 综合运势
        LOVE: 'love',                    // 爱情运势
        CAREER: 'career',                // 事业运势
        WEALTH: 'wealth',                // 财富运势
        HEALTH: 'health',                // 健康运势
        STUDY: 'study'                   // 学业运势
    };

    constructor(data = {}) {
        this.sign = data.sign;
        this.period = data.period || Horoscope.PERIODS.TODAY;
        this.date = data.date || new Date();
        
        // 运势指数 (1-100)
        this.scores = {
            comprehensive: data.scores?.comprehensive || this.randomScore(),
            love: data.scores?.love || this.randomScore(),
            career: data.scores?.career || this.randomScore(),
            wealth: data.scores?.wealth || this.randomScore(),
            health: data.scores?.health || this.randomScore(),
            study: data.scores?.study || this.randomScore()
        };
        
        // 运势描述
        this.descriptions = data.descriptions || {};
        
        // 幸运元素
        this.lucky = data.lucky || {
            color: this.getRandomColor(),
            number: Math.floor(Math.random() * 10) + 1,
            direction: this.getRandomDirection(),
            time: this.getRandomTime(),
            item: this.getRandomItem()
        };
        
        // 趋势 (上升/平稳/下降)
        this.trend = data.trend || this.calculateTrend();
        
        // 星级评分 (1-5星)
        this.stars = this.calculateStars();
    }

    /**
     * 生成随机分数
     */
    randomScore() {
        return Math.floor(Math.random() * 40) + 60; // 60-100
    }

    /**
     * 获取随机颜色
     */
    getRandomColor() {
        const colors = ['红色', '橙色', '黄色', '绿色', '蓝色', '紫色', '粉色', '白色', '金色', '银色'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * 获取随机方位
     */
    getRandomDirection() {
        const directions = ['东方', '南方', '西方', '北方', '东南', '东北', '西南', '西北'];
        return directions[Math.floor(Math.random() * directions.length)];
    }

    /**
     * 获取随机时段
     */
    getRandomTime() {
        const times = ['早晨', '上午', '中午', '下午', '傍晚', '晚间'];
        return times[Math.floor(Math.random() * times.length)];
    }

    /**
     * 获取随机幸运物
     */
    getRandomItem() {
        const items = ['水晶', '贝壳', '羽毛', '钥匙', '硬币', '花朵', '星星', '月亮'];
        return items[Math.floor(Math.random() * items.length)];
    }

    /**
     * 计算趋势
     */
    calculateTrend() {
        const avg = Object.values(this.scores).reduce((a, b) => a + b, 0) / Object.values(this.scores).length;
        if (avg >= 80) return 'rising';
        if (avg >= 60) return 'stable';
        return 'falling';
    }

    /**
     * 计算星级
     */
    calculateStars() {
        const avg = Object.values(this.scores).reduce((a, b) => a + b, 0) / Object.values(this.scores).length;
        if (avg >= 90) return 5;
        if (avg >= 80) return 4;
        if (avg >= 70) return 3;
        if (avg >= 60) return 2;
        return 1;
    }

    /**
     * 获取特定维度的运势
     */
    getDimensionScore(dimension) {
        return this.scores[dimension] || 0;
    }

    /**
     * 获取总运势评级
     */
    getOverallRating() {
        const stars = this.stars;
        const labels = {
            5: '超棒',
            4: '很好',
            3: '不错',
            2: '一般',
            1: '需努力'
        };
        return labels[stars] || '一般';
    }

    /**
     * 转换为JSON
     */
    toJSON() {
        return {
            sign: this.sign,
            period: this.period,
            date: this.date,
            scores: this.scores,
            descriptions: this.descriptions,
            lucky: this.lucky,
            trend: this.trend,
            stars: this.stars,
            overallRating: this.getOverallRating()
        };
    }
}