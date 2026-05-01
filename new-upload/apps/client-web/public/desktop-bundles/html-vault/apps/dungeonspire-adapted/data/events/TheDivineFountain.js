/**
 * =================================================================================================
 * DungeonSpire - The Divine Fountain Event
 * =================================================================================================
 */
import { GameEvent } from './GameEvent.js';
import { globalBus } from '../../core/EventBus.js';

export class TheDivineFountainEvent extends GameEvent {
    constructor() {
        super({
            id: 'divine_fountain',
            title: 'The Divine Fountain',
            body: "You find a fountain. It looks holy.",
            image: 'assets/events/divine_fountain.jpg',
            options: [
                {
                    text: "Drink: Remove all Curses",
                    effect: () => {
                        globalBus.emit('remove_all_curses');
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