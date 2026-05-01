/**
 * =================================================================================================
 * DungeonSpire - Steel Sabatons
 * =================================================================================================
 */
import { Armor } from '../../Armor.js';

export class SteelSabatons extends Armor {
    constructor() {
        super({
            id: 'steel_sabatons',
            name: 'Steel Sabatons',
            rarity: 'rare',
            price: 140,
            slot: 'legs',
            defense: 12,
            description: "Heavy steel boots. Great for kicking.",
            icon: 'assets/items/armor/steel_sabatons.png'
        });
    }
}