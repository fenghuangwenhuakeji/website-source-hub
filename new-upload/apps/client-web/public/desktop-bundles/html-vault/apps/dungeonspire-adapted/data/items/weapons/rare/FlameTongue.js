/**
 * =================================================================================================
 * DungeonSpire - Flame Tongue
 * =================================================================================================
 */
import { Weapon } from '../../Weapon.js';

export class FlameTongue extends Weapon {
    constructor() {
        super({
            id: 'flame_tongue',
            name: 'Flame Tongue',
            rarity: 'rare',
            price: 150,
            damage: 12,
            scaling: { str: 0.7, int: 0.3 },
            description: "A sword that burns with an eternal flame. Deals fire damage.",
            icon: 'assets/items/weapons/flame_tongue.png'
        });
    }
}