/**
 * =================================================================================================
 * DungeonSpire - Footwork
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Footwork extends Card {
    constructor() {
        super({
            id: 'footwork',
            name: 'Footwork',
            type: 'power',
            rarity: 'uncommon',
            color: 'green',
            cost: 1,
            magicNumber: 2,
            description: "Gain !M! Dexterity.",
            assetPath: 'assets/cards/green/footwork.png'
        });
    }

    applyUpgrade() {
        this.baseMagicNumber += 1;
        this.magicNumber = this.baseMagicNumber;
    }

    use(player, target) {
        player.addPower('dexterity', this.magicNumber);
    }
}