import { LLMService } from '../../services/llm/LLMService.js';

export class ChatManager {
    constructor() {
        this.sessions = new Map(); // characterId -> { history: [], service: LLMService }
    }

    // 初始化角色的聊天服务
    initCharacter(characterId, config, systemPrompt) {
        const service = new LLMService(config);
        this.sessions.set(characterId, {
            service,
            history: [{ role: 'system', content: systemPrompt }]
        });
    }

    async chat(characterId, userMessage) {
        const session = this.sessions.get(characterId);
        if (!session) return 'Error: Character not initialized.';

        session.history.push({ role: 'user', content: userMessage });
        
        const reply = await session.service.sendMessage(session.history);
        
        session.history.push({ role: 'assistant', content: reply });
        return reply;
    }

    getHistory(characterId) {
        return this.sessions.get(characterId)?.history || [];
    }
}