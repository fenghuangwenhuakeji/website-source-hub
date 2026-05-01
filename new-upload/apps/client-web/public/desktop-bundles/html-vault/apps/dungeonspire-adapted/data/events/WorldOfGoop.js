/**
 * =================================================================================================
 * DungeonSpire - World of Goop Event
 * =================================================================================================
 */
import { GameEvent } from './GameEvent.js';
import { globalBus } from '../../core/EventBus.js';

export class WorldOfGoopEvent extends GameEvent {
    constructor() {
        super({
            id: 'world_of_goop',
            title: 'World of Goop',
            body: "You fall into a puddle of goop.",
            image: 'assets/events/goop.jpg',
            options: [
                {
                    text: "Gather Gold: Gain 75 Gold, Lose 11 HP",
                    effect: () => {
                        globalBus.emit('gain_gold', 75);
                        globalBus.emit('player_take_damage', 11);
                    }
                },
                {
                    text: "Leave",
                    effect: () => {
                        globalBus.emit('lose_gold', Math.floor(Math.random() * 20)); // Lose some coins maybe?
                    }
                }
            ]
        });
    }
}