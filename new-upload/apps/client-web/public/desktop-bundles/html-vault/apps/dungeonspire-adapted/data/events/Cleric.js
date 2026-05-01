/**
 * =================================================================================================
 * DungeonSpire - The Cleric Event
 * =================================================================================================
 */
import { GameEvent } from './GameEvent.js';
import { globalBus } from '../../core/EventBus.js';

export class ClericEvent extends GameEvent {
    constructor() {
        super({
            id: 'cleric',
            title: 'The Cleric',
            body: "A strange cleric asks if you want to be purified.",
            image: 'assets/events/cleric.jpg',
            options: [
                {
                    text: "Purify: Remove a card (50 Gold)",
                    effect: () => {
                        globalBus.emit('lose_gold', 50);
                        globalBus.emit('remove_card_screen');
                    }
                },
                {
                    text: "Heal: Heal 25% HP (35 Gold)",
                    effect: () => {
                         globalBus.emit('lose_gold', 35);
                         globalBus.emit('player_heal', { percent: 0.25 });
                    }
                },
                {
                    text: "Leave",
                    effect: () => {}
                }
            ]
        });
    }
}