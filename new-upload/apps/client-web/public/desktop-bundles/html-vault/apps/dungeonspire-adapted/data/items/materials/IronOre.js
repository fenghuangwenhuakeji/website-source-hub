/**
 * =================================================================================================
 * DungeonSpire - Iron Ore
 * =================================================================================================
 */
import { Item } from '../../Item.js';

export class IronOre extends Item {
    constructor() {
        super({
            id: 'iron_ore',
            name: 'Iron Ore',
            type: 'material',
            rarity: 'common',
            price: 5,
            description: "Raw iron ore. Can be smelted into ingots.",
            icon: 'assets/items/materials/iron_ore.png'
        });
    }
}