/**
 * =================================================================================================
 * DungeonSpire - Bread
 * =================================================================================================
 */
import { Item } from '../../Item.js';

export class Bread extends Item {
    constructor() {
        super({
            id: 'bread',
            name: 'Bread',
            type: 'consumable',
            rarity: 'common',
            price: 8,
            description: "A loaf of bread. Heals 8 HP.",
            icon: 'assets/items/consumables/bread.png'
        });
    }

    use(player) {
        player.heal(8);
    }
}