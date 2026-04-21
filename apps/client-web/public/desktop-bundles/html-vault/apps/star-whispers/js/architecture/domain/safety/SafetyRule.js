/**
 * 安全规则实体 (SafetyRule)
 */
export class SafetyRule {
    static LEVELS = {
        STRICT: 'strict',
        MODERATE: 'moderate',
        STANDARD: 'standard'
    };

    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.name = data.name || '';
        this.level = data.level || SafetyRule.LEVELS.STANDARD;
        this.patterns = data.patterns || [];
        this.action = data.action || 'warn'; // warn, block, replace
        this.replacement = data.replacement || '***';
        this.enabled = data.enabled !== undefined ? data.enabled : true;
    }

    generateId() {
        return 'rule_' + Date.now();
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            level: this.level,
            patterns: this.patterns,
            action: this.action,
            replacement: this.replacement,
            enabled: this.enabled
        };
    }
}