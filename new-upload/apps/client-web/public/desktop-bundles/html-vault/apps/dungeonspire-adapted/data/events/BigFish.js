/**
 * =================================================================================================
 * DungeonSpire - Big Fish Event
 * =================================================================================================
 */
import { GameEvent } from './GameEvent.js';
import { globalBus } from '../../core/EventBus.js';

export class BigFishEvent extends GameEvent {
    constructor() {
        super({
            id: 'big_fish',
            title: 'Big Fish',
            body: "You stumble upon a giant fish with a rune in its mouth...",
            image: 'assets/events/big_fish.jpg',
            options: [
                {
                    text: "Banana: Heal 1/3 Max HP",
                    effect: () => {
                        globalBus.emit('player_heal', { percent: 0.33 });
                    }
                },
                {
                    text: "Donut: Max HP +5",
                    effect: () => {
                        globalBus.emit('player_max_hp_up', 5);
                    }
                },
                {
                    text: "Box: Gain a Relic, Become Cursed",
                    effect: () => {
                        globalBus.emit('gain_random_relic');
                        globalBus.emit('gain_curse', 'Regret');
                    }
                }
            ]
        });
    }
}