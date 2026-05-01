import { RAGService } from '../../src/services/llm/RAGService.js';

test('RAGService finds relevant context', () => {
    const rag = new RAGService();
    rag.knowledgeBase = [{ text: 'Fire burns goblins.', tags: ['fire', 'goblin'] }];
    
    const context = rag.findRelevantContext('How to kill goblin with fire?');
    expect(context[0]).toContain('Fire burns goblins');
});