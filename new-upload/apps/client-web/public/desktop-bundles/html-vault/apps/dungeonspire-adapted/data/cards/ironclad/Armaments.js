/**
 * =================================================================================================
 * DungeonSpire - Armaments
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class Armaments extends Card {
    constructor() {
        super({
            id: 'armaments',
            name: 'Armaments',
            type: 'skill',
            rarity: 'common',
            color: 'red',
            cost: 1,
            block: 5,
            description: "Gain !B! Block.\nUpgrade a card in your hand for the rest of combat.",
            assetPath: 'assets/cards/red/armaments.png'
        });
    }

    applyUpgrade() {
        this.description = "Gain !B! Block.\nUpgrade ALL cards in your hand for the rest of combat.";
        this.upgraded = true;
    }

    use(player, target) {
        player.addBlock(this.block);
        
        if (this.upgraded) {
            // Upgrade all
            player.hand.forEach(c => {
                if (c !== this) c.upgrade();
            });
        } else {
            // Upgrade one (random valid card for simplicity in this demo)
            // In a full game, this would emit a 'select_card' event to the UI
            const candidates = player.hand.filter(c => c !== this && !c.upgraded);
            if (candidates.length > 0) {
                const randomCard = candidates[Math.floor(Math.random() * candidates.length)];
                randomCard.upgrade();
            }
        }
    }
}