/**
 * =================================================================================================
 * DungeonSpire - Bullet Time
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class BulletTime extends Card {
    constructor() {
        super({
            id: 'bullet_time',
            name: 'Bullet Time',
            type: 'skill',
            rarity: 'rare',
            color: 'green',
            cost: 3,
            description: "You cannot draw additional cards this turn.\nReduce the cost of all cards in your hand to 0 this turn.",
            assetPath: 'assets/cards/green/bullet_time.png'
        });
    }

    applyUpgrade() {
        this.cost = 2;
        this.baseCost = 2;
    }

    use(player, target) {
        player.addPower('no_draw', 1);
        player.hand.forEach(c => c.costForTurn = 0);
    }
}