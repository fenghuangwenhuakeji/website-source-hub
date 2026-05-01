/**
 * =================================================================================================
 * DungeonSpire - Tools of the Trade
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class ToolsOfTheTrade extends Card {
    constructor() {
        super({
            id: 'tools_of_the_trade',
            name: 'Tools of the Trade',
            type: 'power',
            rarity: 'rare',
            color: 'green',
            cost: 1,
            description: "At the start of your turn, draw 1 card and discard 1 card.",
            assetPath: 'assets/cards/green/tools_of_the_trade.png'
        });
    }

    applyUpgrade() {
        this.cost = 0;
        this.baseCost = 0;
    }

    use(player, target) {
        player.addPower('tools_of_the_trade', 1);
    }
}