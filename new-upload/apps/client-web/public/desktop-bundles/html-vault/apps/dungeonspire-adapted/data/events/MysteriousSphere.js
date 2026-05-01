/**
 * =================================================================================================
 * DungeonSpire - Mysterious Sphere Event
 * =================================================================================================
 */
import { GameEvent } from './GameEvent.js';
import { globalBus } from '../../core/EventBus.js';

export class MysteriousSphereEvent extends GameEvent {
    constructor() {
        super({
            id: 'mysterious_sphere',
            title: 'Mysterious Sphere',
            body: "A large sphere blocks your path.",
            image: 'assets/events/sphere.jpg',
            options: [
                {
                    text: "Open: Gain Rare Relic, Take damage",
                    effect: () => {
                        globalBus.emit('gain_random_relic', 'rare');
                        globalBus.emit('player_take_damage', 10); // Simplified
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