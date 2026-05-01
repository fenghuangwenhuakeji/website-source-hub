/**
 * =================================================================================================
 * DungeonSpire - Golden Shrine Event
 * =================================================================================================
 */
import { GameEvent } from './GameEvent.js';
import { globalBus } from '../../core/EventBus.js';

export class GoldenShrineEvent extends GameEvent {
    constructor() {
        super({
            id: 'golden_shrine',
            title: 'Golden Shrine',
            body: "A shrine made of gold. You feel greed welling up.",
            image: 'assets/events/golden_shrine.jpg',
            options: [
                {
                    text: "Pray: Gain 100 Gold",
                    effect: () => {
                        globalBus.emit('gain_gold', 100);
                    }
                },
                {
                    text: "Desecrate: Gain 275 Gold, Gain Regret",
                    effect: () => {
                        globalBus.emit('gain_gold', 275);
                        globalBus.emit('gain_curse', 'regret');
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