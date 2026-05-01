/**
 * =================================================================================================
 * DungeonSpire - Master of Strategy
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class MasterOfStrategy extends Card {
    constructor() {
        super({
            id: 'master_of_strategy',
            name: 'Master of Strategy',
            type: 'skill',
            rarity: 'rare',
            color: 'colorless',
            cost: 0,
            magicNumber: 3,
            description: "Draw !M! cards.\nExhaust.",
            assetPath: 'assets/cards/colorless/master_of_strategy.png',
            exhaust: true
        });
    }

    applyUpgrade() {
        this.baseMagicNumber += 1;
        this.magicNumber = this.baseMagicNumber;
    }

    use(player, target) {
        player.drawCards(this.magicNumber);
    }
}