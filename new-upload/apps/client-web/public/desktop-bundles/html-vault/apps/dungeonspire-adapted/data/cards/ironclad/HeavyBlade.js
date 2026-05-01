/**
 * =================================================================================================
 * DungeonSpire - Heavy Blade
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class HeavyBlade extends Card {
    constructor() {
        super({
            id: 'heavy_blade',
            name: 'Heavy Blade',
            type: 'attack',
            rarity: 'common',
            color: 'red',
            cost: 2,
            damage: 14,
            magicNumber: 3,
            description: "Deal !D! damage.\nStrength affects this card !M! times.",
            assetPath: 'assets/cards/red/heavy_blade.png'
        });
    }

    applyUpgrade() {
        this.baseMagicNumber += 2;
        this.magicNumber = this.baseMagicNumber;
    }

    use(player, target) {
        if (target) {
            // Strength calculation is usually handled in the damage formula
            // But for this specific card, we need a custom multiplier
            // Simplified logic:
            const strength = player.getPowerAmount('strength');
            const bonus = strength * (this.magicNumber - 1); // -1 because 1x is already applied by base logic usually
            
            target.takeDamage(this.damage + bonus);
        }
    }
}