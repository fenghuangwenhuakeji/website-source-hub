import { ActionParser } from '../src/systems/chat/ActionParser.js';

// Mock Game Object
const mockGame = {
    player: { addItem: (id) => console.log(`[GAME] Player received item: ${id}`) },
    combatSystem: { startCombat: (id) => console.log(`[GAME] Combat started with: ${id}`) }
};

const parser = new ActionParser(mockGame);

const aiResponse = "You have insulted my honor! Prepare to die! [ATTACK_PLAYER: char_villain_knight]";
console.log(`AI Raw Response: "${aiResponse}"`);

console.log('\n--- Parsing Actions ---');
const cleanText = parser.parseAndExecute(aiResponse);

console.log(`\nFinal Chat Text: "${cleanText}"`);