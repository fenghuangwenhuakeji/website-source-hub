/**
 * =================================================================================================
 * DungeonSpire - Well-Laid Plans
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class WellLaidPlans extends Card {
    constructor() {
        super({
            id: 'well_laid_plans',
            name: 'Well-Laid Plans',
            type: 'power',
            rarity: 'uncommon',
            color: 'green',
            cost: 1,
            description: "At the end of your turn, Retain up to 1 card.",
            assetPath: 'assets/cards/green/well_laid_plans.png'
        });
    }

    applyUpgrade() {
        this.description = "At the end of your turn, Retain up to 2 cards.";
    }

    use(player, target) {
        player.addPower('retain_cards', this.upgraded ? 2 : 1);
    }
}