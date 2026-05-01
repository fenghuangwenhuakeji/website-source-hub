/**
 * =================================================================================================
 * DungeonSpire - Wood Staff
 * =================================================================================================
 */
import { Weapon } from '../../Weapon.js';

export class WoodStaff extends Weapon {
    constructor() {
        super({
            id: 'wood_staff',
            name: 'Wood Staff',
            rarity: 'common',
            price: 15,
            damage: 4,
            scaling: { int: 0.6 },
            description: "A simple wooden staff for beginners.",
            icon: 'assets/items/weapons/wood_staff.png'
        });
    }
}