/**
 * 帖子实体 (Post)
 * 社区帖子
 */

export class Post {
    static TYPES = {
        TEXT: 'text',
        IMAGE: 'image',
        SHARE: 'share'
    };

    static STATUS = {
        DRAFT: 'draft',
        PUBLISHED: 'published',
        HIDDEN: 'hidden',
        DELETED: 'deleted'
    };

    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.userId = data.userId;
        this.title = data.title || '';
        this.content = data.content || '';
        this.images = data.images || [];
        this.type = data.type || Post.TYPES.TEXT;
        this.status = data.status || Post.STATUS.PUBLISHED;
        this.category = data.category || 'general';
        this.tags = data.tags || [];
        this.likeCount = data.likeCount || 0;
        this.commentCount = data.commentCount || 0;
        this.shareCount = data.shareCount || 0;
        this.isAnonymous = data.isAnonymous || false;
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }

    generateId() {
        return 'post_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            title: this.title,
            content: this.content,
            images: this.images,
            type: this.type,
            status: this.status,
            category: this.category,
            tags: this.tags,
            likeCount: this.likeCount,
            commentCount: this.commentCount,
            shareCount: this.shareCount,
            isAnonymous: this.isAnonymous,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}