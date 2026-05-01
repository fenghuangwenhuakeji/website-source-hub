/**
 * =================================================================================================
 * DungeonSpire - Dragon Slayer (Legendary+ Weapon)
 * =================================================================================================
 */
import { Weapon } from '../../Weapon.js';

export class DragonSlayer extends Weapon {
    constructor() {
        super({
            id: 'dragon_slayer',
            name: 'Dragon Slayer',
            rarity: 'legendary',
            price: 5000,
            damage: 100,
            scaling: { str: 2.0 },
            description: "A massive slab of iron capable of felling dragons.",
            icon: 'assets/items/weapons/dragon_slayer.png'
        });
    }
}