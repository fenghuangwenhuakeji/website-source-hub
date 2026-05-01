/**
 * =================================================================================================
 * DungeonSpire - Archmage Staff
 * =================================================================================================
 */
import { Weapon } from '../../Weapon.js';

export class ArchmageStaff extends Weapon {
    constructor() {
        super({
            id: 'archmage_staff',
            name: 'Archmage Staff',
            rarity: 'rare',
            price: 180,
            damage: 15,
            scaling: { int: 1.5 },
            description: "A powerful staff wielded by high wizards.",
            icon: 'assets/items/weapons/archmage_staff.png'
        });
    }
}