import { RAGService } from '../src/services/llm/RAGService.js';

const rag = new RAGService();
// Manually load some knowledge for demo
rag.knowledgeBase = [
    { text: 'The Sky City floats due to ancient Grav-Crystals found in the mines.', tags: ['sky', 'crystal'] },
    { text: 'Goblins are terrified of fire and loud noises.', tags: ['goblin', 'weakness'] },
    { text: 'The Forgotten King sold his soul to the Void for immortality.', tags: ['king', 'void'] }
];

const query = 'Tell me about the floating city and the king.';
console.log(`User Query: "${query}"`);
console.log('\n--- RAG Retrieval Results ---');
const context = rag.findRelevantContext(query);
context.forEach(c => console.log(`> ${c}`));

console.log('\n--- Enriched System Prompt ---');
console.log(rag.enrichPrompt('You are a historian.', query));