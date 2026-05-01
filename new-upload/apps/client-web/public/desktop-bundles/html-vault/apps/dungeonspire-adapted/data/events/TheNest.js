/**
 * =================================================================================================
 * DungeonSpire - The Nest Event
 * =================================================================================================
 */
import { GameEvent } from './GameEvent.js';
import { globalBus } from '../../core/EventBus.js';

export class TheNestEvent extends GameEvent {
    constructor() {
        super({
            id: 'the_nest',
            title: 'The Nest',
            body: "You find a nest of Cultists.",
            image: 'assets/events/nest.jpg',
            options: [
                {
                    text: "Smash: Gain 99 Gold, Take 6 Damage",
                    effect: () => {
                        globalBus.emit('gain_gold', 99);
                        globalBus.emit('player_take_damage', 6);
                    }
                },
                {
                    text: "Stay: Gain Ritual Dagger, Take 6 Damage",
                    effect: () => {
                        globalBus.emit('gain_card', 'ritual_dagger');
                        globalBus.emit('player_take_damage', 6);
                    }
                }
            ]
        });
    }
}