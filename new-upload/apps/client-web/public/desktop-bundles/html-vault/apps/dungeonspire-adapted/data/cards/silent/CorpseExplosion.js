/**
 * =================================================================================================
 * DungeonSpire - Corpse Explosion
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class CorpseExplosion extends Card {
    constructor() {
        super({
            id: 'corpse_explosion',
            name: 'Corpse Explosion',
            type: 'skill',
            rarity: 'rare',
            color: 'green',
            cost: 2,
            magicNumber: 6,
            description: "Apply !M! Poison.\nWhen the enemy dies, deal damage equal to its Max HP to ALL other enemies.",
            assetPath: 'assets/cards/green/corpse_explosion.png'
        });
    }

    applyUpgrade() {
        this.baseMagicNumber += 3;
        this.magicNumber = this.baseMagicNumber;
    }

    use(player, target) {
        if (target) {
            target.addPower('poison', this.magicNumber);
            target.addPower('corpse_explosion', 1);
        }
    }
}