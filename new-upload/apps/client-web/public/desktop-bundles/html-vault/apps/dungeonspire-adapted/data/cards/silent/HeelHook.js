/**
 * =================================================================================================
 * DungeonSpire - Heel Hook
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class HeelHook extends Card {
    constructor() {
        super({
            id: 'heel_hook',
            name: 'Heel Hook',
            type: 'attack',
            rarity: 'uncommon',
            color: 'green',
            cost: 1,
            damage: 5,
            magicNumber: 1,
            description: "Deal !D! damage.\nIf the enemy is Weak, gain 1 Energy and draw 1 card.",
            assetPath: 'assets/cards/green/heel_hook.png'
        });
    }

    applyUpgrade() {
        this.baseDamage += 3;
        this.damage = this.baseDamage;
    }

    use(player, target) {
        if (target) {
            target.takeDamage(this.damage);
            if (target.hasPower('weak')) {
                player.gainEnergy(1);
                player.drawCards(1);
            }
        }
    }
}