/**
 * =================================================================================================
 * DungeonSpire - Rusty Iron Sword
 * =================================================================================================
 */
import { Weapon } from '../../Weapon.js';

export class RustyIronSword extends Weapon {
    constructor() {
        super({
            id: 'rusty_iron_sword',
            name: 'Rusty Iron Sword',
            rarity: 'common',
            price: 10,
            damage: 5,
            scaling: { str: 0.5 },
            description: "An old sword, chipped and rusted. It has seen better days.",
            icon: 'assets/items/weapons/rusty_sword.png'
        });
    }
}