/**
 * =================================================================================================
 * DungeonSpire - Apple
 * =================================================================================================
 */
import { Item } from '../../Item.js';

export class Apple extends Item {
    constructor() {
        super({
            id: 'apple',
            name: 'Apple',
            type: 'consumable',
            rarity: 'common',
            price: 5,
            description: "A fresh red apple. Heals 5 HP.",
            icon: 'assets/items/consumables/apple.png'
        });
    }

    use(player) {
        player.heal(5);
    }
}