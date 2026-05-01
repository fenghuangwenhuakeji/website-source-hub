/**
 * =================================================================================================
 * DungeonSpire - Scroll of Healing
 * =================================================================================================
 */
import { Item } from '../../Item.js';

export class ScrollOfHealing extends Item {
    constructor() {
        super({
            id: 'scroll_healing',
            name: 'Scroll of Healing',
            type: 'consumable',
            rarity: 'uncommon',
            price: 50,
            description: "Casts Heal once.",
            icon: 'assets/items/consumables/scroll_healing.png'
        });
    }

    use(player) {
        // Cast Heal logic
    }
}