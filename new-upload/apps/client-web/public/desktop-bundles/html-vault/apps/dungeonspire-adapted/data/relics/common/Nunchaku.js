/**
 * =================================================================================================
 * DungeonSpire - Nunchaku (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class Nunchaku extends Relic {
    constructor() {
        super({
            id: 'nunchaku',
            name: 'Nunchaku',
            description: "Every time you play 10 Attacks, gain 1 Energy.",
            rarity: 'common',
            assetPath: 'assets/relics/nunchaku.png'
        });
        this.counter = 0;
    }

    onCardPlayed(card, player) {
        if (card.type === 'attack') {
            this.counter++;
            if (this.counter === 10) {
                player.gainEnergy(1);
                this.counter = 0;
            }
        }
    }
}