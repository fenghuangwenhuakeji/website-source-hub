/**
 * =================================================================================================
 * DungeonSpire - Infinite Blades
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class InfiniteBlades extends Card {
    constructor() {
        super({
            id: 'infinite_blades',
            name: 'Infinite Blades',
            type: 'power',
            rarity: 'uncommon',
            color: 'green',
            cost: 1,
            description: "At the start of your turn, add a Shiv to your hand.",
            assetPath: 'assets/cards/green/infinite_blades.png'
        });
    }

    applyUpgrade() {
        this.innate = true;
        this.description = "Innate.\nAt the start of your turn, add a Shiv to your hand.";
    }

    use(player, target) {
        player.addPower('infinite_blades', 1);
    }
}