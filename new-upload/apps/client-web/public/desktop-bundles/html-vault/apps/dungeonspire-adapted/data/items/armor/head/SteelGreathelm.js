/**
 * =================================================================================================
 * DungeonSpire - Steel Greathelm
 * =================================================================================================
 */
import { Armor } from '../../Armor.js';

export class SteelGreathelm extends Armor {
    constructor() {
        super({
            id: 'steel_greathelm',
            name: 'Steel Greathelm',
            rarity: 'rare',
            price: 150,
            slot: 'head',
            defense: 10,
            description: "A full-face helmet offering superior protection.",
            icon: 'assets/items/armor/steel_greathelm.png'
        });
    }
}