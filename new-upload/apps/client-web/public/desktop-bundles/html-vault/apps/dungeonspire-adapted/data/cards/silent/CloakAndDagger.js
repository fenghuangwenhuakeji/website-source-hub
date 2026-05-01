/**
 * =================================================================================================
 * DungeonSpire - Cloak and Dagger
 * =================================================================================================
 */
import { Card } from '../Card.js';
import { CardFactory } from '../CardFactory.js';

export class CloakAndDagger extends Card {
    constructor() {
        super({
            id: 'cloak_and_dagger',
            name: 'Cloak and Dagger',
            type: 'skill',
            rarity: 'common',
            color: 'green',
            cost: 1,
            block: 6,
            magicNumber: 1,
            description: "Gain !B! Block.\nAdd !M! Shiv to your hand.",
            assetPath: 'assets/cards/green/cloak_and_dagger.png'
        });
    }

    applyUpgrade() {
        this.baseMagicNumber += 1;
        this.magicNumber = this.baseMagicNumber;
        this.description = "Gain !B! Block.\nAdd !M! Shivs to your hand.";
    }

    use(player, target) {
        player.addBlock(this.block);
        for (let i = 0; i < this.magicNumber; i++) {
            const shiv = CardFactory.createCard('shiv');
            if (shiv) player.hand.push(shiv);
        }
    }
}