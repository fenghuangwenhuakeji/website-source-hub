/**
 * =================================================================================================
 * DungeonSpire - Iron Helm
 * =================================================================================================
 */
import { Armor } from '../../Armor.js';

export class IronHelm extends Armor {
    constructor() {
        super({
            id: 'iron_helm',
            name: 'Iron Helm',
            rarity: 'uncommon',
            price: 80,
            slot: 'head',
            defense: 6,
            description: "A sturdy iron helmet used by foot soldiers.",
            icon: 'assets/items/armor/iron_helm.png'
        });
    }
}