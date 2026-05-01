/**
 * =================================================================================================
 * DungeonSpire - Wraith Form
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class WraithForm extends Card {
    constructor() {
        super({
            id: 'wraith_form',
            name: 'Wraith Form',
            type: 'power',
            rarity: 'rare',
            color: 'green',
            cost: 3,
            magicNumber: 2,
            description: "Gain !M! Intangible.\nAt the end of your turn, lose 1 Dexterity.",
            assetPath: 'assets/cards/green/wraith_form.png'
        });
    }

    applyUpgrade() {
        this.baseMagicNumber += 1;
        this.magicNumber = this.baseMagicNumber;
    }

    use(player, target) {
        player.addPower('intangible', this.magicNumber);
        player.addPower('wraith_form', 1);
    }
}