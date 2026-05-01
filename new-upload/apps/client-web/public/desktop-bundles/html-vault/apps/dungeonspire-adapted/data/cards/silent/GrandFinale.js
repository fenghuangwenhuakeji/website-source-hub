/**
 * =================================================================================================
 * DungeonSpire - Grand Finale
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class GrandFinale extends Card {
    constructor() {
        super({
            id: 'grand_finale',
            name: 'Grand Finale',
            type: 'attack',
            rarity: 'rare',
            color: 'green',
            cost: 0,
            damage: 50,
            description: "Can only be played if there are no cards in your draw pile.\nDeal !D! damage to ALL enemies.",
            assetPath: 'assets/cards/green/grand_finale.png'
        });
    }

    applyUpgrade() {
        this.baseDamage += 10;
        this.damage = this.baseDamage;
    }

    canPlay(player, enemies) {
        if (!super.canPlay(player, enemies)) return false;
        return player.drawPile.length === 0;
    }

    use(player, target) {
        const enemies = window.app.engine.combatManager.enemies;
        enemies.forEach(e => {
            if (!e.isDead) e.takeDamage(this.damage);
        });
    }
}