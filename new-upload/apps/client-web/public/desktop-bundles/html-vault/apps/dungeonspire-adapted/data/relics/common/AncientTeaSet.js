/**
 * =================================================================================================
 * DungeonSpire - Ancient Tea Set (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class AncientTeaSet extends Relic {
    constructor() {
        super({
            id: 'ancient_tea_set',
            name: 'Ancient Tea Set',
            description: "Whenever you enter a Rest Site, start the next combat with 2 extra Energy.",
            rarity: 'common',
            assetPath: 'assets/relics/tea_set.png'
        });
    }

    onRest(player) {
        this.active = true;
    }

    onCombatStart(player) {
        if (this.active) {
            player.gainEnergy(2);
            this.active = false;
        }
    }
}