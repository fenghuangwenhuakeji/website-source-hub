/**
 * =================================================================================================
 * DungeonSpire - Gremlin Horn (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class GremlinHorn extends Relic {
    constructor() {
        super({
            id: 'gremlin_horn',
            name: 'Gremlin Horn',
            description: "Whenever an enemy dies, gain 1 Energy and draw 1 card.",
            rarity: 'uncommon',
            assetPath: 'assets/relics/gremlin_horn.png'
        });
    }

    onEnemyDeath(enemy, player) {
        player.gainEnergy(1);
        player.drawCards(1);
    }
}