/**
 * =================================================================================================
 * DungeonSpire - Masked Bandits Event
 * =================================================================================================
 */
import { GameEvent } from './GameEvent.js';
import { globalBus } from '../../core/EventBus.js';

export class MaskedBanditsEvent extends GameEvent {
    constructor() {
        super({
            id: 'masked_bandits',
            title: 'Masked Bandits',
            body: "Bandits demand your gold.",
            image: 'assets/events/bandits.jpg',
            options: [
                {
                    text: "Pay: Lose all Gold",
                    effect: () => {
                        globalBus.emit('lose_all_gold');
                    }
                },
                {
                    text: "Fight: Start Combat (Reward: Red Mask)",
                    effect: () => {
                        globalBus.emit('start_combat', 'masked_bandits');
                    }
                }
            ]
        });
    }
}