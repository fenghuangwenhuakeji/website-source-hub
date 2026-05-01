/**
 * =================================================================================================
 * DungeonSpire - Strawberry (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class Strawberry extends Relic {
    constructor() {
        super({
            id: 'strawberry',
            name: 'Strawberry',
            description: "Raise your Max HP by 7.",
            rarity: 'common',
            assetPath: 'assets/relics/strawberry.png'
        });
    }

    onEquip(player) {
        player.maxHp += 7;
        player.heal(7);
    }
}