/**
 * =================================================================================================
 * DungeonSpire - Alchemize
 * =================================================================================================
 */
import { Card } from '../Card.js';
import { globalBus } from '../../core/EventBus.js';

export class Alchemize extends Card {
    constructor() {
        super({
            id: 'alchemize',
            name: 'Alchemize',
            type: 'skill',
            rarity: 'rare',
            color: 'green',
            cost: 1,
            description: "Obtain a random Potion.\nExhaust.",
            assetPath: 'assets/cards/green/alchemize.png',
            exhaust: true
        });
    }

    applyUpgrade() {
        this.cost = 0;
        this.baseCost = 0;
    }

    use(player, target) {
        globalBus.emit('obtain_potion');
    }
}