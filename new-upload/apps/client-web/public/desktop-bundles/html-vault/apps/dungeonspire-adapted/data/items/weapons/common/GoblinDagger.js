/**
 * =================================================================================================
 * DungeonSpire - Goblin Dagger
 * =================================================================================================
 */
import { Weapon } from '../../Weapon.js';

export class GoblinDagger extends Weapon {
    constructor() {
        super({
            id: 'goblin_dagger',
            name: 'Goblin Dagger',
            rarity: 'common',
            price: 12,
            damage: 4,
            scaling: { dex: 0.8 },
            description: "A jagged dagger often used by goblins. Good for quick stabs.",
            icon: 'assets/items/weapons/goblin_dagger.png'
        });
    }
}