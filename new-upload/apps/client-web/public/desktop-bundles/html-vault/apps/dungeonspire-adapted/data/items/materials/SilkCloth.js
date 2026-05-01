/**
 * =================================================================================================
 * DungeonSpire - Silk Cloth
 * =================================================================================================
 */
import { Item } from '../../Item.js';

export class SilkCloth extends Item {
    constructor() {
        super({
            id: 'silk_cloth',
            name: 'Silk Cloth',
            type: 'material',
            rarity: 'uncommon',
            price: 10,
            description: "Fine silk. Used for robes.",
            icon: 'assets/items/materials/silk_cloth.png'
        });
    }
}