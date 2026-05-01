/**
 * =================================================================================================
 * DungeonSpire - Sneaky Strike
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class SneakyStrike extends Card {
    constructor() {
        super({
            id: 'sneaky_strike',
            name: 'Sneaky Strike',
            type: 'attack',
            rarity: 'common',
            color: 'green',
            cost: 2,
            damage: 12,
            description: "Deal !D! damage.\nIf you have discarded a card this turn, gain 2 Energy.",
            assetPath: 'assets/cards/green/sneaky_strike.png'
        });
    }

    applyUpgrade() {
        this.baseDamage += 4;
        this.damage = this.baseDamage;
    }

    use(player, target) {
        if (target) target.takeDamage(this.damage);
        // Check if discarded
        // if (player.discardedThisTurn) player.gainEnergy(2);
    }
}