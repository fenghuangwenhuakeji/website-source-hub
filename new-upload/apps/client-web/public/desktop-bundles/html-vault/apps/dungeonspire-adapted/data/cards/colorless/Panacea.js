/**
 * =================================================================================================
 * DungeonSpire - Panacea
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Panacea extends Card {
    constructor() {
        super({
            id: 'panacea',
            name: 'Panacea',
            type: 'skill',
            rarity: 'uncommon',
            color: 'colorless',
            cost: 0,
            magicNumber: 1,
            description: "Gain !M! Artifact.\nExhaust.",
            assetPath: 'assets/cards/colorless/panacea.png',
            exhaust: true
        });
    }

    applyUpgrade() {
        this.baseMagicNumber += 1;
        this.magicNumber = this.baseMagicNumber;
    }

    use(player, target) {
        player.addPower('artifact', this.magicNumber);
    }
}