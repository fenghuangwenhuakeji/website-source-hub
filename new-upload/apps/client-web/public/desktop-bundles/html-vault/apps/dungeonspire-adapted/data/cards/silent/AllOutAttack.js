/**
 * =================================================================================================
 * DungeonSpire - All-Out Attack
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class AllOutAttack extends Card {
    constructor() {
        super({
            id: 'all_out_attack',
            name: 'All-Out Attack',
            type: 'attack',
            rarity: 'uncommon',
            color: 'green',
            cost: 1,
            damage: 10,
            description: "Deal !D! damage to ALL enemies.\nDiscard a card at random.",
            assetPath: 'assets/cards/green/all_out_attack.png'
        });
    }

    applyUpgrade() {
        this.baseDamage += 4;
        this.damage = this.baseDamage;
    }

    use(player, target) {
        const enemies = window.app.engine.combatManager.enemies;
        enemies.forEach(e => {
            if (!e.isDead) e.takeDamage(this.damage);
        });
        
        if (player.hand.length > 0) {
            const idx = Math.floor(Math.random() * player.hand.length);
            player.discardCard(idx);
        }
    }
}