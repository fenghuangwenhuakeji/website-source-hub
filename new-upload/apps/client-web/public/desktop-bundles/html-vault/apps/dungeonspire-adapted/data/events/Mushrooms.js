/**
 * =================================================================================================
 * DungeonSpire - Mushrooms Event
 * =================================================================================================
 */
import { GameEvent } from './GameEvent.js';
import { globalBus } from '../../core/EventBus.js';

export class MushroomsEvent extends GameEvent {
    constructor() {
        super({
            id: 'mushrooms',
            title: 'Mushrooms',
            body: "You enter a tunnel filled with glowing mushrooms.",
            image: 'assets/events/mushrooms.jpg',
            options: [
                {
                    text: "Stomp: Anger the mushrooms (Combat)",
                    effect: () => {
                        globalBus.emit('start_combat', 'fungi_beast');
                    }
                },
                {
                    text: "Eat: Heal 25% HP, Gain Parasite",
                    effect: () => {
                        globalBus.emit('player_heal', { percent: 0.25 });
                        globalBus.emit('gain_curse', 'parasite');
                    }
                }
            ]
        });
    }
}