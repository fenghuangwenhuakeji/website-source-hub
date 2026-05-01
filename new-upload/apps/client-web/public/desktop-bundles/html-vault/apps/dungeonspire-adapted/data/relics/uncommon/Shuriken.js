/**
 * =================================================================================================
 * DungeonSpire - Shuriken (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class Shuriken extends Relic {
    constructor() {
        super({
            id: 'shuriken',
            name: 'Shuriken',
            description: "Every time you play 3 Attacks in a single turn, gain 1 Strength.",
            rarity: 'uncommon',
            assetPath: 'assets/relics/shuriken.png'
        });
        this.counter = 0;
    }

    onTurnStart() {
        this.counter = 0;
    }

    onCardPlayed(card, player) {
        if (card.type === 'attack') {
            this.counter++;
            if (this.counter % 3 === 0) {
                player.addPower('strength', 1);
            }
        }
    }
}