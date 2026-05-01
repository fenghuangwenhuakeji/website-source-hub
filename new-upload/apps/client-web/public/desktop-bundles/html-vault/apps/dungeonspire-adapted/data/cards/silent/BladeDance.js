/**
 * =================================================================================================
 * DungeonSpire - Blade Dance
 * =================================================================================================
 */
import { Card } from '../Card.js';
import { CardFactory } from '../CardFactory.js';

export class BladeDance extends Card {
    constructor() {
        super({
            id: 'blade_dance',
            name: 'Blade Dance',
            type: 'skill',
            rarity: 'common',
            color: 'green',
            cost: 1,
            magicNumber: 3,
            description: "Add !M! Shivs to your hand.",
            assetPath: 'assets/cards/green/blade_dance.png'
        });
    }

    applyUpgrade() {
        this.baseMagicNumber += 1;
        this.magicNumber = this.baseMagicNumber;
    }

    use(player, target) {
        for (let i = 0; i < this.magicNumber; i++) {
            const shiv = CardFactory.createCard('shiv');
            if (shiv) player.hand.push(shiv);
        }
    }
}