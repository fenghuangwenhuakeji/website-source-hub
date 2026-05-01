/**
 * =================================================================================================
 * DungeonSpire - Winding Halls Event
 * =================================================================================================
 */
import { GameEvent } from './GameEvent.js';
import { globalBus } from '../../core/EventBus.js';

export class WindingHallsEvent extends GameEvent {
    constructor() {
        super({
            id: 'winding_halls',
            title: 'Winding Halls',
            body: "You get lost in winding halls.",
            image: 'assets/events/winding_halls.jpg',
            options: [
                {
                    text: "Retrace Steps: Lose 5% HP",
                    effect: () => {
                        globalBus.emit('player_take_damage', { percent: 0.05 });
                    }
                },
                {
                    text: "Embrace Madness: Gain 2 Madness",
                    effect: () => {
                        globalBus.emit('gain_card', 'madness', 2);
                    }
                }
            ]
        });
    }
}