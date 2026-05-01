/**
 * =================================================================================================
 * DungeonSpire - Whetstone (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class Whetstone extends Relic {
    constructor() {
        super({
            id: 'whetstone',
            name: 'Whetstone',
            description: "Upon pickup, Upgrade 2 random Attacks.",
            rarity: 'common',
            assetPath: 'assets/relics/whetstone.png'
        });
    }

    onEquip(player) {
        const attacks = player.masterDeck.filter(c => c.type === 'attack' && !c.upgraded);
        // Randomly pick 2
        // MathUtils.shuffle(attacks).slice(0, 2).forEach(c => c.upgrade());
    }
}