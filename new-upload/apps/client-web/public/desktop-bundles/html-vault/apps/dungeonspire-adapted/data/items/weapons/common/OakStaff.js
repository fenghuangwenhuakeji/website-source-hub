/**
 * =================================================================================================
 * DungeonSpire - Oak Staff
 * =================================================================================================
 */
import { Weapon } from '../../Weapon.js';

export class OakStaff extends Weapon {
    constructor() {
        super({
            id: 'oak_staff',
            name: 'Oak Staff',
            rarity: 'common',
            price: 12,
            damage: 3,
            scaling: { int: 0.8 },
            description: "A sturdy staff made of oak. Channels magical energy slightly.",
            icon: 'assets/items/weapons/oak_staff.png'
        });
    }
}