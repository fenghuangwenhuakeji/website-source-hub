/**
 * =================================================================================================
 * DungeonSpire - Cured Leather
 * =================================================================================================
 */
import { Item } from '../../Item.js';

export class CuredLeather extends Item {
    constructor() {
        super({
            id: 'cured_leather',
            name: 'Cured Leather',
            type: 'material',
            rarity: 'common',
            price: 4,
            description: "Tough leather. Used for armor.",
            icon: 'assets/items/materials/cured_leather.png'
        });
    }
}