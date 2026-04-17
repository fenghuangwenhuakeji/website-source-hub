/**
 * 文章实体 (Article)
 */
export class Article {
    static STATUS = {
        DRAFT: 'draft',
        PUBLISHED: 'published',
        ARCHIVED: 'archived'
    };

    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.title = data.title || '';
        this.content = data.content || '';
        this.summary = data.summary || '';
        this.coverImage = data.coverImage || null;
        this.author = data.author || '';
        this.category = data.category || 'general';
        this.tags = data.tags || [];
        this.status = data.status || Article.STATUS.PUBLISHED;
        this.viewCount = data.viewCount || 0;
        this.likeCount = data.likeCount || 0;
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }

    generateId() {
        return 'article_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    toJSON() {
        return {
            id: this.id,
            title: this.title,
            summary: this.summary,
            coverImage: this.coverImage,
            author: this.author,
            category: this.category,
            tags: this.tags,
            status: this.status,
            viewCount: this.viewCount,
            likeCount: this.likeCount,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}