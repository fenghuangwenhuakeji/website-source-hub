/**
 * =================================================================================================
 * DungeonSpire - Dagger Throw
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class DaggerThrow extends Card {
    constructor() {
        super({
            id: 'dagger_throw',
            name: 'Dagger Throw',
            type: 'attack',
            rarity: 'common',
            color: 'green',
            cost: 1,
            damage: 9,
            magicNumber: 1,
            description: "Deal !D! damage.\nDraw !M! card.\nDiscard !M! card.",
            assetPath: 'assets/cards/green/dagger_throw.png'
        });
    }

    applyUpgrade() {
        this.baseDamage += 3;
        this.damage = this.baseDamage;
    }

    use(player, target) {
        if (target) target.takeDamage(this.damage);
        player.drawCards(this.magicNumber);
        // Trigger discard logic (simplified to random for now)
        if (player.hand.length > 0) {
            const idx = Math.floor(Math.random() * player.hand.length);
            player.discardCard(idx);
        }
    }
}