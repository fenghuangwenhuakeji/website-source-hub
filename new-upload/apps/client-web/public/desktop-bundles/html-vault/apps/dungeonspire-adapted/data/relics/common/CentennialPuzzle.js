/**
 * =================================================================================================
 * DungeonSpire - Centennial Puzzle (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class CentennialPuzzle extends Relic {
    constructor() {
        super({
            id: 'centennial_puzzle',
            name: 'Centennial Puzzle',
            description: "The first time you lose HP each combat, draw 3 cards.",
            rarity: 'common',
            assetPath: 'assets/relics/puzzle.png'
        });
        this.triggered = false;
    }

    onCombatStart() {
        this.triggered = false;
    }

    onPlayerLoseHp(amount) {
        if (!this.triggered && amount > 0) {
            window.app.engine.player.drawCards(3);
            this.triggered = true;
        }
    }
}