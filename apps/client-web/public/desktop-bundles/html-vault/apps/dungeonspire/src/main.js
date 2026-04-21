import { ContentRegistry } from './systems/ContentRegistry.js';
import { LootGenerator } from './systems/loot/LootGenerator.js';
import { ChatManager } from './systems/chat/ChatManager.js';
import { RAGService } from './services/llm/RAGService.js';

class Game {
    constructor() {
        console.log('Initializing DungeonSpire Engine...');
        
        this.registry = new ContentRegistry();
        this.ragService = new RAGService();
        this.lootGenerator = new LootGenerator();
        this.chatManager = new ChatManager();
        
        this.init();
    }

    init() {
        // 1. Load Data
        console.log('Loading Assets & Data...');
        this.ragService.loadAllKnowledge();
        
        // 2. Setup Systems
        console.log('Systems Online.');
    }

    start() {
        console.log('Game Started. Welcome to the Spire.');
    }
}

const game = new Game();
game.start();