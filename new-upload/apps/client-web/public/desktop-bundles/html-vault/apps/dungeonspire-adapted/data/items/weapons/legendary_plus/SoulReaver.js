/**
 * =================================================================================================
 * DungeonSpire - Soul Reaver (Legendary+ Weapon)
 * =================================================================================================
 */
import { Weapon } from '../../Weapon.js';

export class SoulReaver extends Weapon {
    constructor() {
        super({
            id: 'soul_reaver',
            name: 'Soul Reaver',
            rarity: 'legendary',
            price: 4500,
            damage: 80,
            scaling: { dex: 1.5, int: 1.0 },
            description: "A cursed blade that drinks the souls of its victims.",
            icon: 'assets/items/weapons/soul_reaver.png'
        });
    }
}