/**
 * =================================================================================================
 * DungeonSpire - Noxious Fumes
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class NoxiousFumes extends Card {
    constructor() {
        super({
            id: 'noxious_fumes',
            name: 'Noxious Fumes',
            type: 'power',
            rarity: 'uncommon',
            color: 'green',
            cost: 1,
            magicNumber: 2,
            description: "At the start of your turn, apply !M! Poison to ALL enemies.",
            assetPath: 'assets/cards/green/noxious_fumes.png'
        });
    }

    applyUpgrade() {
        this.baseMagicNumber += 1;
        this.magicNumber = this.baseMagicNumber;
    }

    use(player, target) {
        player.addPower('noxious_fumes', this.magicNumber);
    }
}