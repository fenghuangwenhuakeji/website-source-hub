/**
 * =================================================================================================
 * DungeonSpire - Phantasmal Killer
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class PhantasmalKiller extends Card {
    constructor() {
        super({
            id: 'phantasmal_killer',
            name: 'Phantasmal Killer',
            type: 'skill',
            rarity: 'rare',
            color: 'green',
            cost: 2,
            description: "Next turn, your Attacks deal double damage.",
            assetPath: 'assets/cards/green/phantasmal_killer.png'
        });
    }

    applyUpgrade() {
        this.cost = 1;
        this.baseCost = 1;
    }

    use(player, target) {
        player.addPower('phantasmal_killer', 1);
    }
}