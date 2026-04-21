import { ContentRegistry } from '../../systems/ContentRegistry.js';

export class RAGService {
    constructor() {
        this.knowledgeBase = [];
    }

    // 初始化：加载所有的书籍、日记、角色知识
    loadAllKnowledge() {
        // 模拟从各个目录加载文本数据
        // 在实际应用中，这里会生成 Vector Embeddings
        this.knowledgeBase.push(...this.loadFromDir('data/lore/books'));
        this.knowledgeBase.push(...this.loadFromDir('data/lore/diaries'));
        this.knowledgeBase.push(...this.loadFromDir('data/characters/knowledge'));
    }

    loadFromDir(path) {
        // 模拟读取
        return []; 
    }

    // 核心方法：根据用户输入检索相关上下文
    findRelevantContext(query, limit = 3) {
        const keywords = query.toLowerCase().split(' ').filter(w => w.length > 3);
        const scored = this.knowledgeBase.map(entry => {
            let score = 0;
            keywords.forEach(word => {
                if (entry.text.toLowerCase().includes(word)) score += 1;
                if (entry.tags && entry.tags.includes(word)) score += 2;
            });
            return { ...entry, score };
        });

        // 返回得分最高的片段
        return scored.filter(e => e.score > 0)
                     .sort((a, b) => b.score - a.score)
                     .slice(0, limit)
                     .map(e => e.text);
    }

    // 构建增强后的 Prompt
    enrichPrompt(systemPrompt, userQuery) {
        const context = this.findRelevantContext(userQuery);
        if (context.length === 0) return systemPrompt;

        return `${systemPrompt}\n\n[RELEVANT KNOWLEDGE]:\n${context.join('\n---\n')}\n\nUse the above knowledge to answer the user's question accurately.`;
    }
}