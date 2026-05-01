/**
 * =================================================================================================
 * DungeonSpire - Short Bow
 * =================================================================================================
 */
import { Weapon } from '../../Weapon.js';

export class ShortBow extends Weapon {
    constructor() {
        super({
            id: 'short_bow',
            name: 'Short Bow',
            rarity: 'common',
            price: 20,
            damage: 4,
            scaling: { dex: 0.7 },
            description: "A compact bow for skirmishers.",
            icon: 'assets/items/weapons/short_bow.png'
        });
    }
}