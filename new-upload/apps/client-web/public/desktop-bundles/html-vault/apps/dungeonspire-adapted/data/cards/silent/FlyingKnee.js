/**
 * =================================================================================================
 * DungeonSpire - Flying Knee
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class FlyingKnee extends Card {
    constructor() {
        super({
            id: 'flying_knee',
            name: 'Flying Knee',
            type: 'attack',
            rarity: 'common',
            color: 'green',
            cost: 1,
            damage: 8,
            description: "Deal !D! damage.\nNext turn gain 1 Energy.",
            assetPath: 'assets/cards/green/flying_knee.png'
        });
    }

    applyUpgrade() {
        this.baseDamage += 3;
        this.damage = this.baseDamage;
    }

    use(player, target) {
        if (target) target.takeDamage(this.damage);
        player.addPower('next_turn_energy', 1);
    }
}