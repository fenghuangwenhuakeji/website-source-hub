/**
 * =================================================================================================
 * DungeonSpire - Curse of the Bell
 * =================================================================================================
 */
import { Card } from '../Card.js';

export class CurseOfTheBell extends Card {
    constructor() {
        super({
            id: 'curse_of_the_bell',
            name: 'Curse of the Bell',
            type: 'curse',
            rarity: 'curse',
            color: 'colorless',
            cost: -2,
            description: "Unplayable.\nCannot be removed from your deck.",
            assetPath: 'assets/cards/curse/curse_of_the_bell.png'
        });
    }
}