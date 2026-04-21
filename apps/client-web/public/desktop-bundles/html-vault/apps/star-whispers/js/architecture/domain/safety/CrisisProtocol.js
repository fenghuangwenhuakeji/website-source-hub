/**
 * 危机干预协议实体 (CrisisProtocol)
 */
export class CrisisProtocol {
    static LEVELS = {
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high',
        CRITICAL: 'critical'
    };

    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.level = data.level || CrisisProtocol.LEVELS.LOW;
        this.keywords = data.keywords || [];
        this.response = data.response || '';
        this.resources = data.resources || [];
        this.autoTrigger = data.autoTrigger !== undefined ? data.autoTrigger : true;
        this.notifyAdmin = data.notifyAdmin !== undefined ? data.notifyAdmin : false;
    }

    generateId() {
        return 'crisis_' + Date.now();
    }

    toJSON() {
        return {
            id: this.id,
            level: this.level,
            keywords: this.keywords,
            response: this.response,
            resources: this.resources,
            autoTrigger: this.autoTrigger,
            notifyAdmin: this.notifyAdmin
        };
    }
}