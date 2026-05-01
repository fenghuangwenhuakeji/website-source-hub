/**
 * =================================================================================================
 * DungeonSpire - Question Card (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class QuestionCard extends Relic {
    constructor() {
        super({
            id: 'question_card',
            name: 'Question Card',
            description: "Future Card Rewards have 1 additional card to choose from.",
            rarity: 'uncommon',
            assetPath: 'assets/relics/question_card.png'
        });
    }

    // Hook into Reward generation logic
}