/**
 * =================================================================================================
 * DungeonSpire - Panic Button
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class PanicButton extends Card {
    constructor() {
        super({
            id: 'panic_button',
            name: 'Panic Button',
            type: 'skill',
            rarity: 'uncommon',
            color: 'colorless',
            cost: 0,
            block: 30,
            description: "Gain !B! Block.\nYou cannot gain Block from cards for the next 2 turns.\nExhaust.",
            assetPath: 'assets/cards/colorless/panic_button.png',
            exhaust: true
        });
    }

    applyUpgrade() {
        this.baseBlock += 10;
        this.block = this.baseBlock;
    }

    use(player, target) {
        player.addBlock(this.block);
        player.addPower('no_block', 2);
    }
}