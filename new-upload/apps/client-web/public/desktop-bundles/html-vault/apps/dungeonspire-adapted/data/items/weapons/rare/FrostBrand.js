/**
 * =================================================================================================
 * DungeonSpire - Frost Brand
 * =================================================================================================
 */
import { Weapon } from '../../Weapon.js';

export class FrostBrand extends Weapon {
    constructor() {
        super({
            id: 'frost_brand',
            name: 'Frost Brand',
            rarity: 'rare',
            price: 150,
            damage: 11,
            scaling: { str: 0.6, int: 0.4 },
            description: "A blade cold to the touch. Slows enemies on hit.",
            icon: 'assets/items/weapons/frost_brand.png'
        });
    }
}