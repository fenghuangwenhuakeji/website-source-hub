/**
 * =================================================================================================
 * DungeonSpire - Face Trader Event
 * =================================================================================================
 */
import { GameEvent } from './GameEvent.js';
import { globalBus } from '../../core/EventBus.js';

export class FaceTraderEvent extends GameEvent {
    constructor() {
        super({
            id: 'face_trader',
            title: 'Face Trader',
            body: "A man with many faces asks to trade.",
            image: 'assets/events/face_trader.jpg',
            options: [
                {
                    text: "Touch: Gain 75 Gold, lose 10% Max HP",
                    effect: () => {
                        globalBus.emit('gain_gold', 75);
                        globalBus.emit('player_max_hp_down', { percent: 0.10 });
                    }
                },
                {
                    text: "Trade: Gain a random Face Relic",
                    effect: () => {
                        // 50% Good Face, 50% Bad Face
                        const isGood = Math.random() > 0.5;
                        globalBus.emit('gain_relic', isGood ? 'cultist_mask' : 'gremlin_visage');
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