/**
 * =================================================================================================
 * DungeonSpire - Scroll of Fireball
 * =================================================================================================
 */
import { Item } from '../../Item.js';

export class ScrollOfFireball extends Item {
    constructor() {
        super({
            id: 'scroll_fireball',
            name: 'Scroll of Fireball',
            type: 'consumable',
            rarity: 'uncommon',
            price: 50,
            description: "Casts Fireball once.",
            icon: 'assets/items/consumables/scroll_fireball.png'
        });
    }

    use(player, target) {
        // Cast Fireball logic
    }
}