/**
 * =================================================================================================
 * DungeonSpire - Envenom
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Envenom extends Card {
    constructor() {
        super({
            id: 'envenom',
            name: 'Envenom',
            type: 'power',
            rarity: 'rare',
            color: 'green',
            cost: 2,
            description: "Whenever an Attack deals unblocked damage, apply 1 Poison.",
            assetPath: 'assets/cards/green/envenom.png'
        });
    }

    applyUpgrade() {
        this.cost = 1;
        this.baseCost = 1;
    }

    use(player, target) {
        player.addPower('envenom', 1);
    }
}