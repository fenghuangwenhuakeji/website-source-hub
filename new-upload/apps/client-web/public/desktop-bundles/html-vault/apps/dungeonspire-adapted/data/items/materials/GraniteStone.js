/**
 * =================================================================================================
 * DungeonSpire - Granite Stone
 * =================================================================================================
 */
import { Item } from '../../Item.js';

export class GraniteStone extends Item {
    constructor() {
        super({
            id: 'granite_stone',
            name: 'Granite Stone',
            type: 'material',
            rarity: 'common',
            price: 2,
            description: "Heavy granite. Used for construction.",
            icon: 'assets/items/materials/granite_stone.png'
        });
    }
}