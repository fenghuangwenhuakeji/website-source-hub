/**
 * =================================================================================================
 * DungeonSpire - Battle Trance
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class BattleTrance extends Card {
    constructor() {
        super({
            id: 'battle_trance',
            name: 'Battle Trance',
            type: 'skill',
            rarity: 'uncommon',
            color: 'red',
            cost: 0,
            magicNumber: 3,
            description: "Draw !M! cards.\nYou cannot draw additional cards this turn.",
            assetPath: 'assets/cards/red/battle_trance.png'
        });
    }

    applyUpgrade() {
        this.baseMagicNumber += 1;
        this.magicNumber = this.baseMagicNumber;
    }

    use(player, target) {
        player.drawCards(this.magicNumber);
        player.addPower('no_draw', 1);
    }
}