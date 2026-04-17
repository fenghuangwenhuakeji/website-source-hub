/**
 * AI对话服务 (ChatService)
 */

export class ChatService {
    constructor(llmAdapter) {
        this.llmAdapter = llmAdapter;
        this.conversations = new Map();
    }

    /**
     * 发送消息
     */
    async sendMessage(userId, message, context = {}) {
        const conversation = this.getOrCreateConversation(userId);
        conversation.messages.push({ role: 'user', content: message, timestamp: new Date() });

        const response = await this.llmAdapter.chat(message, {
            ...context,
            conversationHistory: conversation.messages
        });

        conversation.messages.push({ role: 'assistant', content: response, timestamp: new Date() });
        return response;
    }

    /**
     * 获取或创建会话
     */
    getOrCreateConversation(userId) {
        if (!this.conversations.has(userId)) {
            this.conversations.set(userId, { messages: [], createdAt: new Date() });
        }
        return this.conversations.get(userId);
    }

    /**
     * 清除会话
     */
    clearConversation(userId) {
        this.conversations.delete(userId);
    }
}