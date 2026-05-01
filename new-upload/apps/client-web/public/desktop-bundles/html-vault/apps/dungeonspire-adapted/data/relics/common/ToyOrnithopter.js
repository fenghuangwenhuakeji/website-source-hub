/**
 * =================================================================================================
 * DungeonSpire - Toy Ornithopter (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class ToyOrnithopter extends Relic {
    constructor() {
        super({
            id: 'toy_ornithopter',
            name: 'Toy Ornithopter',
            description: "Whenever you use a potion, heal 5 HP.",
            rarity: 'common',
            assetPath: 'assets/relics/ornithopter.png'
        });
    }

    onPotionUse(player) {
        player.heal(5);
    }
}