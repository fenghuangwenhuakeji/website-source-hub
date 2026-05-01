/**
 * =================================================================================================
 * DungeonSpire - Sundial (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class Sundial extends Relic {
    constructor() {
        super({
            id: 'sundial',
            name: 'Sundial',
            description: "Every 3 times you shuffle your deck, gain 2 Energy.",
            rarity: 'uncommon',
            assetPath: 'assets/relics/sundial.png'
        });
        this.counter = 0;
    }

    onDeckShuffle(player) {
        this.counter++;
        if (this.counter === 3) {
            player.gainEnergy(2);
            this.counter = 0;
        }
    }
}