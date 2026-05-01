/**
 * =================================================================================================
 * DungeonSpire - Oak Wood
 * =================================================================================================
 */
import { Item } from '../../Item.js';

export class OakWood extends Item {
    constructor() {
        super({
            id: 'oak_wood',
            name: 'Oak Wood',
            type: 'material',
            rarity: 'common',
            price: 3,
            description: "Sturdy oak wood. Used for crafting staves and bows.",
            icon: 'assets/items/materials/oak_wood.png'
        });
    }
}