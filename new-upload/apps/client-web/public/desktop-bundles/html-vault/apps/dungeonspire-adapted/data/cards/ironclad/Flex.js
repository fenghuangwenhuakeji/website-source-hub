/**
 * =================================================================================================
 * DungeonSpire - Flex
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Flex extends Card {
    constructor() {
        super({
            id: 'flex',
            name: 'Flex',
            type: 'skill',
            rarity: 'common',
            color: 'red',
            cost: 0,
            magicNumber: 2,
            description: "Gain !M! Strength.\nAt the end of your turn, lose !M! Strength.",
            assetPath: 'assets/cards/red/flex.png'
        });
    }

    applyUpgrade() {
        this.baseMagicNumber += 2;
        this.magicNumber = this.baseMagicNumber;
    }

    use(player, target) {
        player.addPower('strength', this.magicNumber);
        player.addPower('lose_strength', this.magicNumber);
    }
}