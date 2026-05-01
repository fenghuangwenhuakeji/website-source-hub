/**
 * =================================================================================================
 * DungeonSpire - Lab Event
 * =================================================================================================
 */
import { GameEvent } from './GameEvent.js';
import { globalBus } from '../../core/EventBus.js';

export class LabEvent extends GameEvent {
    constructor() {
        super({
            id: 'lab',
            title: 'The Lab',
            body: "You find a lab filled with potions.",
            image: 'assets/events/lab.jpg',
            options: [
                {
                    text: "Search: Find 3 Potions",
                    effect: () => {
                        globalBus.emit('obtain_potion', 3);
                    }
                }
            ]
        });
    }
}