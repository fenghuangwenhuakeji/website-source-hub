/**
 * =================================================================================================
 * DungeonSpire - Du-Vu Doll (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class DuVuDoll extends Relic {
    constructor() {
        super({
            id: 'du_vu_doll',
            name: 'Du-Vu Doll',
            description: "For each Curse in your deck, start each combat with 1 additional Strength.",
            rarity: 'rare',
            assetPath: 'assets/relics/doll.png'
        });
    }

    onCombatStart(player) {
        let curseCount = 0;
        player.masterDeck.forEach(c => {
            if (c.type === 'curse') curseCount++;
        });
        
        if (curseCount > 0) {
            player.addPower('strength', curseCount);
        }
    }
}