/**
 * =================================================================================================
 * DungeonSpire - Cleave
 * =================================================================================================
 */
import { Card } from '../Card.js';
import { globalBus } from '../../core/EventBus.js';

export class Cleave extends Card {
    constructor() {
        super({
            id: 'cleave',
            name: 'Cleave',
            type: 'attack',
            rarity: 'common',
            color: 'red',
            cost: 1,
            damage: 8,
            description: "Deal !D! damage to ALL enemies.",
            assetPath: 'assets/cards/red/cleave.png'
        });
    }

    applyUpgrade() {
        this.baseDamage += 3;
        this.damage = this.baseDamage;
    }

    use(player, target) {
        // Target is ignored, hits all
        // We need access to the enemy list. 
        // In this architecture, we might emit a global event or access via engine singleton.
        // Assuming 'target' passed here is just one, but we need ALL.
        
        // Ideally: window.app.engine.combatManager.enemies
        const enemies = window.app.engine.combatManager.enemies;
        enemies.forEach(e => {
            if (!e.isDead) e.takeDamage(this.damage);
        });
        
        // Visual effect
        globalBus.emit('vfx_cleave');
    }
}