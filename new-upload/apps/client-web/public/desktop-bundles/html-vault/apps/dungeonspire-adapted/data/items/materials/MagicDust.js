/**
 * =================================================================================================
 * DungeonSpire - Magic Dust
 * =================================================================================================
 */
import { Item } from '../../Item.js';

export class MagicDust extends Item {
    constructor() {
        super({
            id: 'magic_dust',
            name: 'Magic Dust',
            type: 'material',
            rarity: 'uncommon',
            price: 15,
            description: "Dust shimmering with magical energy.",
            icon: 'assets/items/materials/magic_dust.png'
        });
    }
}