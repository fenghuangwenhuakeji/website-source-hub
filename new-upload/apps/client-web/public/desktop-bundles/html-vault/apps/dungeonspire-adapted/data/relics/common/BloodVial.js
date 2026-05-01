/**
 * =================================================================================================
 * DungeonSpire - Blood Vial (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class BloodVial extends Relic {
    constructor() {
        super({
            id: 'blood_vial',
            name: 'Blood Vial',
            description: "At the start of each combat, heal 2 HP.",
            rarity: 'common',
            assetPath: 'assets/relics/blood_vial.png'
        });
    }

    onCombatStart(player) {
        player.heal(2);
    }
}