/**
 * =================================================================================================
 * DungeonSpire - Storm of Steel
 * =================================================================================================
 */
import { Card } from '../Card.js';
import { CardFactory } from '../CardFactory.js';

export class StormOfSteel extends Card {
    constructor() {
        super({
            id: 'storm_of_steel',
            name: 'Storm of Steel',
            type: 'skill',
            rarity: 'rare',
            color: 'green',
            cost: 2,
            description: "Discard your hand.\nAdd 1 Shiv into your hand for each card discarded.",
            assetPath: 'assets/cards/green/storm_of_steel.png'
        });
    }

    applyUpgrade() {
        this.description = "Discard your hand.\nAdd 1 Upgraded Shiv into your hand for each card discarded.";
    }

    use(player, target) {
        const count = player.hand.length;
        player.discardHand();
        for (let i = 0; i < count; i++) {
            const shiv = CardFactory.createCard('shiv');
            if (this.upgraded) shiv.upgrade();
            player.hand.push(shiv);
        }
    }
}