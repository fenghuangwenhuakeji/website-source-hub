/**
 * =================================================================================================
 * DungeonSpire - Outmaneuver
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Outmaneuver extends Card {
    constructor() {
        super({
            id: 'outmaneuver',
            name: 'Outmaneuver',
            type: 'skill',
            rarity: 'common',
            color: 'green',
            cost: 1,
            magicNumber: 2,
            description: "Next turn gain !M! Energy.",
            assetPath: 'assets/cards/green/outmaneuver.png'
        });
    }

    applyUpgrade() {
        this.baseMagicNumber += 1;
        this.magicNumber = this.baseMagicNumber;
    }

    use(player, target) {
        player.addPower('next_turn_energy', this.magicNumber);
    }
}