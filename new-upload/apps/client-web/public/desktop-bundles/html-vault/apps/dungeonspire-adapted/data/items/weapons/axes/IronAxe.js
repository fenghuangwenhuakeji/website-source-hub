/**
 * =================================================================================================
 * DungeonSpire - Iron Axe
 * =================================================================================================
 */
import { Weapon } from '../../Weapon.js';

export class IronAxe extends Weapon {
    constructor() {
        super({
            id: 'iron_axe',
            name: 'Iron Axe',
            rarity: 'common',
            price: 25,
            damage: 8,
            scaling: { str: 0.8 },
            description: "A heavy iron axe. Slow but powerful.",
            icon: 'assets/items/weapons/iron_axe.png'
        });
    }
}