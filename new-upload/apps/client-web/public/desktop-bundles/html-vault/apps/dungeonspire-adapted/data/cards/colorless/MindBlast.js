/**
 * =================================================================================================
 * DungeonSpire - Mind Blast
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class MindBlast extends Card {
    constructor() {
        super({
            id: 'mind_blast',
            name: 'Mind Blast',
            type: 'attack',
            rarity: 'uncommon',
            color: 'colorless',
            cost: 2,
            damage: 0,
            description: "Innate.\nDeal damage equal to the number of cards in your draw pile.",
            assetPath: 'assets/cards/colorless/mind_blast.png',
            innate: true
        });
    }

    applyUpgrade() {
        this.cost = 1;
        this.baseCost = 1;
    }

    use(player, target) {
        const dmg = player.drawPile.length;
        if (target) target.takeDamage(dmg);
    }

    // Dynamic damage description update logic would be here
}