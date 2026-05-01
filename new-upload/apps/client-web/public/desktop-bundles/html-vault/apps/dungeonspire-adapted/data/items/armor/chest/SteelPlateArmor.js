/**
 * =================================================================================================
 * DungeonSpire - Steel Plate Armor
 * =================================================================================================
 */
import { Armor } from '../../Armor.js';

export class SteelPlateArmor extends Armor {
    constructor() {
        super({
            id: 'steel_plate_armor',
            name: 'Steel Plate Armor',
            rarity: 'rare',
            price: 250,
            slot: 'chest',
            defense: 15,
            description: "Expertly crafted steel armor. Heavy but impenetrable.",
            icon: 'assets/items/armor/steel_plate_armor.png'
        });
    }
}