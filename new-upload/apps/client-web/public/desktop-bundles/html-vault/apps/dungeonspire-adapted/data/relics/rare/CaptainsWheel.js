/**
 * =================================================================================================
 * DungeonSpire - Captain's Wheel (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class CaptainsWheel extends Relic {
    constructor() {
        super({
            id: 'captains_wheel',
            name: "Captain's Wheel",
            description: "At the start of your 3rd turn, gain 18 Block.",
            rarity: 'rare',
            assetPath: 'assets/relics/wheel.png'
        });
        this.turn = 0;
    }

    onCombatStart() {
        this.turn = 0;
    }

    onTurnStart(player) {
        this.turn++;
        if (this.turn === 3) {
            player.addBlock(18);
        }
    }
}