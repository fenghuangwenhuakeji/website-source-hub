/**
 * =================================================================================================
 * DungeonSpire - Kunai (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class Kunai extends Relic {
    constructor() {
        super({
            id: 'kunai',
            name: 'Kunai',
            description: "Every time you play 3 Attacks in a single turn, gain 1 Dexterity.",
            rarity: 'uncommon',
            assetPath: 'assets/relics/kunai.png'
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
                player.addPower('dexterity', 1);
            }
        }
    }
}