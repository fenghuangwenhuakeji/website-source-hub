/**
 * =================================================================================================
 * DungeonSpire - Glass Knife
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class GlassKnife extends Card {
    constructor() {
        super({
            id: 'glass_knife',
            name: 'Glass Knife',
            type: 'attack',
            rarity: 'rare',
            color: 'green',
            cost: 1,
            damage: 8,
            description: "Deal !D! damage twice.\nGlass Knife's damage is lowered by 2 this combat.",
            assetPath: 'assets/cards/green/glass_knife.png'
        });
    }

    applyUpgrade() {
        this.baseDamage += 4;
        this.damage = this.baseDamage;
    }

    use(player, target) {
        if (target) {
            target.takeDamage(this.damage);
            target.takeDamage(this.damage);
        }
        this.baseDamage -= 2;
        if (this.baseDamage < 0) this.baseDamage = 0;
        this.damage = this.baseDamage;
    }
}