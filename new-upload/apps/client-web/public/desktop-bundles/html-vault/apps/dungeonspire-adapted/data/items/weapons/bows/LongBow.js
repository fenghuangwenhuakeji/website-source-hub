/**
 * =================================================================================================
 * DungeonSpire - Long Bow
 * =================================================================================================
 */
import { Weapon } from '../../Weapon.js';

export class LongBow extends Weapon {
    constructor() {
        super({
            id: 'long_bow',
            name: 'Long Bow',
            rarity: 'uncommon',
            price: 55,
            damage: 8,
            scaling: { dex: 0.9 },
            description: "A tall bow with great range and power.",
            icon: 'assets/items/weapons/long_bow.png'
        });
    }
}