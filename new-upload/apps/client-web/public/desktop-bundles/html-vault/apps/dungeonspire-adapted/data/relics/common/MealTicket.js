/**
 * =================================================================================================
 * DungeonSpire - Meal Ticket (Relic)
 * =================================================================================================
 */
import { Relic } from '../Relic.js';

export class MealTicket extends Relic {
    constructor() {
        super({
            id: 'meal_ticket',
            name: 'Meal Ticket',
            description: "Whenever you enter a Shop, heal 15 HP.",
            rarity: 'common',
            assetPath: 'assets/relics/meal_ticket.png'
        });
    }

    onEnterShop(player) {
        player.heal(15);
    }
}