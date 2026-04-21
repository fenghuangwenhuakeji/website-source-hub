/**
 * 黑名单实体 (BlockList)
 */
export class BlockList {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.userId = data.userId;
        this.blockedUserId = data.blockedUserId;
        this.reason = data.reason || '';
        this.createdAt = data.createdAt || new Date();
    }

    generateId() {
        return 'block_' + Date.now();
    }

    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            blockedUserId: this.blockedUserId,
            reason: this.reason,
            createdAt: this.createdAt
        };
    }
}