/**
 * =================================================================================================
 * DungeonSpire - Sensory Stone Event
 * =================================================================================================
 */
import { GameEvent } from './GameEvent.js';
import { globalBus } from '../../core/EventBus.js';

export class SensoryStoneEvent extends GameEvent {
    constructor() {
        super({
            id: 'sensory_stone',
            title: 'Sensory Stone',
            body: "A spinning tesseract invokes memories.",
            image: 'assets/events/sensory_stone.jpg',
            options: [
                {
                    text: "Recall: Lose 5 HP, Gain 1 Colorless Card",
                    effect: () => {
                        globalBus.emit('player_take_damage', 5);
                        globalBus.emit('gain_card_reward', 'colorless', 1);
                    }
                },
                {
                    text: "Recall: Lose 10 HP, Gain 2 Colorless Cards",
                    effect: () => {
                        globalBus.emit('player_take_damage', 10);
                        globalBus.emit('gain_card_reward', 'colorless', 2);
                    }
                }
            ]
        });
    }
}