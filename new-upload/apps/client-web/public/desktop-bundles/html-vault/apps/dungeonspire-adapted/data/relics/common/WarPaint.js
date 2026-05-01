/**
 * =================================================================================================
 * DungeonSpire - War Paint (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class WarPaint extends Relic {
    constructor() {
        super({
            id: 'war_paint',
            name: 'War Paint',
            description: "Upon pickup, Upgrade 2 random Skills.",
            rarity: 'common',
            assetPath: 'assets/relics/war_paint.png'
        });
    }

    onEquip(player) {
        const skills = player.masterDeck.filter(c => c.type === 'skill' && !c.upgraded);
        // Randomly pick 2
        // MathUtils.shuffle(skills).slice(0, 2).forEach(c => c.upgrade());
    }
}