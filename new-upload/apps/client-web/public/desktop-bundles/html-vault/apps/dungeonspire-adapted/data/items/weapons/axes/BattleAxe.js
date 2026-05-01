/**
 * =================================================================================================
 * DungeonSpire - Battle Axe
 * =================================================================================================
 */
import { Weapon } from '../../Weapon.js';

export class BattleAxe extends Weapon {
    constructor() {
        super({
            id: 'battle_axe',
            name: 'Battle Axe',
            rarity: 'uncommon',
            price: 60,
            damage: 12,
            scaling: { str: 1.0 },
            description: "A double-headed axe designed for war.",
            icon: 'assets/items/weapons/battle_axe.png'
        });
    }
}