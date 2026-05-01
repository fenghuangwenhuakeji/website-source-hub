/**
 * =================================================================================================
 * DungeonSpire - Fountain of Cleansing Event
 * =================================================================================================
 */
import { GameEvent } from './GameEvent.js';
import { globalBus } from '../../core/EventBus.js';

export class FountainOfCleansingEvent extends GameEvent {
    constructor() {
        super({
            id: 'fountain_of_cleansing',
            title: 'Fountain of Cleansing',
            body: "A fountain of clear water. It looks refreshing.",
            image: 'assets/events/fountain.jpg',
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