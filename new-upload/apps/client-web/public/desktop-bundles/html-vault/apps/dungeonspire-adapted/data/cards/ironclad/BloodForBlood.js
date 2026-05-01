/**
 * =================================================================================================
 * DungeonSpire - Blood for Blood
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class BloodForBlood extends Card {
    constructor() {
        super({
            id: 'blood_for_blood',
            name: 'Blood for Blood',
            type: 'attack',
            rarity: 'uncommon',
            color: 'red',
            cost: 4,
            damage: 18,
            description: "Costs 1 less for each time you lose HP this combat. Deal !D! damage.",
            assetPath: 'assets/cards/red/blood_for_blood.png'
        });
    }

    applyUpgrade() {
        this.baseDamage += 4;
        this.damage = this.baseDamage;
    }
    
    // Needs listener for player damage to reduce cost
    // This would be handled in the Player class or EventBus listener

    use(player, target) {
        if (target) {
            target.takeDamage(this.damage);
        }
    }
}