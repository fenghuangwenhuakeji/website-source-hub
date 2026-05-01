/**
 * =================================================================================================
 * DungeonSpire - Forgotten Altar Event
 * =================================================================================================
 */
import { GameEvent } from './GameEvent.js';
import { globalBus } from '../../core/EventBus.js';

export class ForgottenAltarEvent extends GameEvent {
    constructor() {
        super({
            id: 'forgotten_altar',
            title: 'Forgotten Altar',
            body: "An ancient altar. It demands a sacrifice.",
            image: 'assets/events/altar.jpg',
            options: [
                {
                    text: "Sacrifice: Gain 5 Max HP, Lose 25% HP",
                    effect: () => {
                        globalBus.emit('player_max_hp_up', 5);
                        globalBus.emit('player_take_damage', { percent: 0.25 });
                    }
                },
                {
                    text: "Desecrate: Gain Decay, Gain Bloody Idol",
                    effect: () => {
                        globalBus.emit('gain_curse', 'decay');
                        globalBus.emit('gain_relic', 'bloody_idol'); // Only if has Golden Idol usually
                    }
                }
            ]
        });
    }
}