/**
 * =================================================================================================
 * DungeonSpire - Anger
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Anger extends Card {
    constructor() {
        super({
            id: 'anger',
            name: 'Anger',
            type: 'attack',
            rarity: 'common',
            color: 'red',
            cost: 0,
            damage: 6,
            description: "Deal !D! damage.\nAdd a copy of this card to your discard pile.",
            assetPath: 'assets/cards/red/anger.png'
        });
    }

    applyUpgrade() {
        this.baseDamage += 2;
        this.damage = this.baseDamage;
    }

    use(player, target) {
        if (target) {
            target.takeDamage(this.damage);
        }
        // Add copy logic
        // In a real implementation, we would need a reference to the CardFactory or use clone()
        const copy = this.makeCopy();
        player.discardPile.push(copy);
    }
}