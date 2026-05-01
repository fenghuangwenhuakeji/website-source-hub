/**
 * =================================================================================================
 * DungeonSpire - Bandage Up
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class BandageUp extends Card {
    constructor() {
        super({
            id: 'bandage_up',
            name: 'Bandage Up',
            type: 'skill',
            rarity: 'uncommon',
            color: 'colorless',
            cost: 0,
            magicNumber: 4,
            description: "Heal !M! HP.\nExhaust.",
            assetPath: 'assets/cards/colorless/bandage_up.png',
            exhaust: true
        });
    }

    applyUpgrade() {
        this.baseMagicNumber += 2;
        this.magicNumber = this.baseMagicNumber;
    }

    use(player, target) {
        player.heal(this.magicNumber);
    }
}