/**
 * =================================================================================================
 * DungeonSpire - Magic Staff
 * =================================================================================================
 */
import { Weapon } from '../../Weapon.js';

export class MagicStaff extends Weapon {
    constructor() {
        super({
            id: 'magic_staff',
            name: 'Magic Staff',
            rarity: 'uncommon',
            price: 60,
            damage: 8,
            scaling: { int: 1.0 },
            description: "A staff imbued with magical energy.",
            icon: 'assets/items/weapons/magic_staff.png'
        });
    }
}