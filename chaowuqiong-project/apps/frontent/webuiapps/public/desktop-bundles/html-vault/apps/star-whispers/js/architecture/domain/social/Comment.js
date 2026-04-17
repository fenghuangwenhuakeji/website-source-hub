/**
 * 评论实体 (Comment)
 */
export class Comment {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.postId = data.postId;
        this.userId = data.userId;
        this.content = data.content || '';
        this.parentId = data.parentId || null;
        this.likeCount = data.likeCount || 0;
        this.createdAt = data.createdAt || new Date();
    }

    generateId() {
        return 'comment_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    toJSON() {
        return {
            id: this.id,
            postId: this.postId,
            userId: this.userId,
            content: this.content,
            parentId: this.parentId,
            likeCount: this.likeCount,
            createdAt: this.createdAt
        };
    }
}