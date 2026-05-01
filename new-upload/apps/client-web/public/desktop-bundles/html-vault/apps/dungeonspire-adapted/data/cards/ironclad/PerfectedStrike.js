/**
 * =================================================================================================
 * DungeonSpire - Perfected Strike
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class PerfectedStrike extends Card {
    constructor() {
        super({
            id: 'perfected_strike',
            name: 'Perfected Strike',
            type: 'attack',
            rarity: 'common',
            color: 'red',
            cost: 2,
            damage: 6,
            magicNumber: 2,
            description: "Deal !D! damage.\nDeals +!M! damage for ALL of your cards containing 'Strike'.",
            assetPath: 'assets/cards/red/perfected_strike.png'
        });
        this.tags = ['strike'];
    }

    applyUpgrade() {
        this.baseMagicNumber += 1;
        this.magicNumber = this.baseMagicNumber;
    }

    use(player, target) {
        if (target) {
            // Count strikes in deck (draw + hand + discard)
            // This is computationally expensive, simplified here
            let count = 0;
            const allCards = [...player.drawPile, ...player.hand, ...player.discardPile];
            
            allCards.forEach(c => {
                if (c.name.includes('Strike') || (c.tags && c.tags.includes('strike'))) {
                    count++;
                }
            });

            const totalDamage = this.damage + (count * this.magicNumber);
            target.takeDamage(totalDamage);
        }
    }
}