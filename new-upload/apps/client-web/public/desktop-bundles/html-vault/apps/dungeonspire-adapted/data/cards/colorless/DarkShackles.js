/**
 * =================================================================================================
 * DungeonSpire - Dark Shackles
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class DarkShackles extends Card {
    constructor() {
        super({
            id: 'dark_shackles',
            name: 'Dark Shackles',
            type: 'skill',
            rarity: 'uncommon',
            color: 'colorless',
            cost: 0,
            magicNumber: 9,
            description: "Enemy loses !M! Strength for the rest of this turn.\nExhaust.",
            assetPath: 'assets/cards/colorless/dark_shackles.png',
            exhaust: true
        });
    }

    applyUpgrade() {
        this.baseMagicNumber += 6;
        this.magicNumber = this.baseMagicNumber;
    }

    use(player, target) {
        if (target) {
            target.addPower('strength', -this.magicNumber);
            target.addPower('gain_strength_next_turn', this.magicNumber);
        }
    }
}