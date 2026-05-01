/**
 * =================================================================================================
 * DungeonSpire - Leg Sweep
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class LegSweep extends Card {
    constructor() {
        super({
            id: 'leg_sweep',
            name: 'Leg Sweep',
            type: 'skill',
            rarity: 'uncommon',
            color: 'green',
            cost: 2,
            block: 11,
            magicNumber: 2,
            description: "Apply !M! Weak.\nGain !B! Block.",
            assetPath: 'assets/cards/green/leg_sweep.png'
        });
    }

    applyUpgrade() {
        this.baseBlock += 3;
        this.block = this.baseBlock;
        this.baseMagicNumber += 1;
        this.magicNumber = this.baseMagicNumber;
    }

    use(player, target) {
        if (target) target.addPower('weak', this.magicNumber);
        player.addBlock(this.block);
    }
}