/**
 * =================================================================================================
 * DungeonSpire - Happy Flower (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class HappyFlower extends Relic {
    constructor() {
        super({
            id: 'happy_flower',
            name: 'Happy Flower',
            description: "Every 3 turns, gain 1 Energy.",
            rarity: 'common',
            assetPath: 'assets/relics/flower.png'
        });
        this.counter = 0;
    }

    onTurnStart(player) {
        this.counter++;
        if (this.counter === 3) {
            player.gainEnergy(1);
            this.counter = 0;
        }
    }
}