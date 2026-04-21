/**
 * 社区服务 (CommunityService)
 */
export class CommunityService {
    constructor() {
        this.posts = new Map();
        this.comments = new Map();
    }

    createPost(userId, data) {
        const post = { id: 'post_' + Date.now(), userId, ...data, likeCount: 0, commentCount: 0, createdAt: new Date() };
        this.posts.set(post.id, post);
        return post;
    }

    getPosts(page = 1, limit = 20) {
        return Array.from(this.posts.values()).slice((page - 1) * limit, page * limit);
    }

    likePost(postId) {
        const post = this.posts.get(postId);
        if (post) post.likeCount++;
        return post;
    }
}