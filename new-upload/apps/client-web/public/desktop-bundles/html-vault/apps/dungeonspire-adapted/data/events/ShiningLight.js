/**
 * =================================================================================================
 * DungeonSpire - Shining Light Event
 * =================================================================================================
 */
import { GameEvent } from './GameEvent.js';
import { globalBus } from '../../core/EventBus.js';

export class ShiningLightEvent extends GameEvent {
    constructor() {
        super({
            id: 'shining_light',
            title: 'Shining Light',
            body: "A blinding light engulfs you.",
            image: 'assets/events/shining_light.jpg',
            options: [
                {
                    text: "Enter: Upgrade 2 random cards, Lose 20% HP",
                    effect: () => {
                        globalBus.emit('upgrade_random_cards', 2);
                        globalBus.emit('player_take_damage', { percent: 0.2 });
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