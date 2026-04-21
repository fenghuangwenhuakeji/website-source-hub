/**
 * 年龄门控系统
 * 负责判定用户年龄段，并控制功能访问权限
 */
export class AgeGate {
    constructor() {
        this.AgeGroups = {
            CHILD: 'child',      // 6-12岁
            TEEN: 'teen',        // 12-18岁
            ADULT: 'adult'       // 18岁+
        };
    }

    /**
     * 根据年龄返回对应的用户组ID
     * @param {number} age 
     * @returns {string} groupID
     */
    determineGroup(age) {
        if (age < 6) return null; // 暂不支持6岁以下
        if (age < 12) return this.AgeGroups.CHILD;
        if (age < 18) return this.AgeGroups.TEEN;
        return this.AgeGroups.ADULT;
    }

    /**
     * 检查是否需要家长监护
     * @param {string} groupID 
     */
    requiresParentalControl(groupID) {
        return groupID === this.AgeGroups.CHILD;
    }
}