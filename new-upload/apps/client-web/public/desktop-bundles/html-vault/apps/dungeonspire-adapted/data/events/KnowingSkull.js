/**
 * =================================================================================================
 * DungeonSpire - Knowing Skull Event
 * =================================================================================================
 */
import { GameEvent } from './GameEvent.js';
import { globalBus } from '../../core/EventBus.js';

export class KnowingSkullEvent extends GameEvent {
    constructor() {
        super({
            id: 'knowing_skull',
            title: 'Knowing Skull',
            body: "A skull sits on a pedestal. It asks 'What do you seek?'",
            image: 'assets/events/skull.jpg',
            options: [
                {
                    text: "Success: Lose 6 HP, Gain 90 Gold",
                    effect: () => {
                        globalBus.emit('player_take_damage', 6);
                        globalBus.emit('gain_gold', 90);
                    }
                },
                {
                    text: "A Potion: Lose 6 HP, Gain Potion",
                    effect: () => {
                        globalBus.emit('player_take_damage', 6);
                        globalBus.emit('obtain_potion');
                    }
                },
                {
                    text: "Card: Lose 6 HP, Gain Colorless Card",
                    effect: () => {
                        globalBus.emit('player_take_damage', 6);
                        globalBus.emit('gain_card_reward', 'colorless');
                    }
                }
            ]
        });
    }
}