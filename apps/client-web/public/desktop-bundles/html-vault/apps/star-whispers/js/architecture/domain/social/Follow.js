/**
 * 关注关系实体 (Follow)
 */
export class Follow {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.followerId = data.followerId;
        this.followingId = data.followingId;
        this.createdAt = data.createdAt || new Date();
    }

    generateId() {
        return 'follow_' + Date.now();
    }

    toJSON() {
        return {
            id: this.id,
            followerId: this.followerId,
            followingId: this.followingId,
            createdAt: this.createdAt
        };
    }
}