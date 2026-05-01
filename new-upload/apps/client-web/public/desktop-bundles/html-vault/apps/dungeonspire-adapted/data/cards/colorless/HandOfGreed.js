/**
 * =================================================================================================
 * DungeonSpire - Hand of Greed
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class HandOfGreed extends Card {
    constructor() {
        super({
            id: 'hand_of_greed',
            name: 'Hand of Greed',
            type: 'attack',
            rarity: 'rare',
            color: 'colorless',
            cost: 2,
            damage: 20,
            description: "Deal !D! damage.\nIf this kills a non-Minion enemy, gain 20 Gold.",
            assetPath: 'assets/cards/colorless/hand_of_greed.png'
        });
    }

    applyUpgrade() {
        this.baseDamage += 5;
        this.damage = this.baseDamage;
        this.description = "Deal !D! damage.\nIf this kills a non-Minion enemy, gain 25 Gold.";
    }

    use(player, target) {
        if (target) {
            const killed = target.currentHp <= this.damage;
            target.takeDamage(this.damage);
            if (killed) {
                player.gainGold(this.upgraded ? 25 : 20);
            }
        }
    }
}