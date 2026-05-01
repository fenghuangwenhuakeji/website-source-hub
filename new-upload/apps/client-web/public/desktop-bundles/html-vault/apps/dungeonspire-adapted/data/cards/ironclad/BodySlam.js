/**
 * =================================================================================================
 * DungeonSpire - Body Slam
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class BodySlam extends Card {
    constructor() {
        super({
            id: 'body_slam',
            name: 'Body Slam',
            type: 'attack',
            rarity: 'common',
            color: 'red',
            cost: 1,
            damage: 0,
            description: "Deal damage equal to your current Block.",
            assetPath: 'assets/cards/red/body_slam.png'
        });
    }

    applyUpgrade() {
        this.cost = 0;
        this.baseCost = 0;
    }

    use(player, target) {
        if (target) {
            // Damage is calculated dynamically based on block
            const dmg = player.block;
            target.takeDamage(dmg);
        }
    }

    // Override to show dynamic damage in hand
    getDescription() {
        // In a real implementation, we'd access the player instance globally or pass it in
        // return super.getDescription().replace("!D!", player.block);
        return super.getDescription();
    }
}