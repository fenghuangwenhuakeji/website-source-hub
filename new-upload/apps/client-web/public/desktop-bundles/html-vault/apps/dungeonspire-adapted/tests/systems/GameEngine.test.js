import { GameEngine } from '../../src/core/GameEngine.js';

test('GameEngine initializes correctly', () => {
    const game = new GameEngine();
    expect(game).toBeDefined();
});