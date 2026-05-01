/**
 * =================================================================================================
 * DungeonSpire - Wild Strike
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class WildStrike extends Card {
    constructor() {
        super({
            id: 'wild_strike',
            name: 'Wild Strike',
            type: 'attack',
            rarity: 'common',
            color: 'red',
            cost: 1,
            damage: 12,
            description: "Deal !D! damage.\nShuffle a Wound into your draw pile.",
            assetPath: 'assets/cards/red/wild_strike.png'
        });
        this.tags = ['strike'];
    }

    applyUpgrade() {
        this.baseDamage += 5;
        this.damage = this.baseDamage;
    }

    use(player, target) {
        if (target) {
            target.takeDamage(this.damage);
        }
        
        // Add Wound
        // Need to import Wound card class or use factory
        // Simplified: use generic object for now
        // player.drawPile.push(new Wound());
        console.log("Wound shuffled into deck (simulated)");
    }
}