/**
 * =================================================================================================
 * DungeonSpire - Golden Idol Event
 * =================================================================================================
 */
import { GameEvent } from './GameEvent.js';
import { globalBus } from '../../core/EventBus.js';

export class GoldenIdolEvent extends GameEvent {
    constructor() {
        super({
            id: 'golden_idol',
            title: 'Golden Idol',
            body: "You see a golden idol on a pedestal. It looks trapped.",
            image: 'assets/events/golden_idol.jpg',
            options: [
                {
                    text: "Take: Gain Golden Idol, Lose 25% Max HP",
                    effect: () => {
                        globalBus.emit('gain_relic', 'Golden Idol');
                        globalBus.emit('player_max_hp_down', { percent: 0.25 });
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