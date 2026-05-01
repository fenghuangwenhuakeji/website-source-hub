/**
 * =================================================================================================
 * DungeonSpire - The Moai Head Event
 * =================================================================================================
 */
import { GameEvent } from './GameEvent.js';
import { globalBus } from '../../core/EventBus.js';

export class TheMoaiHeadEvent extends GameEvent {
    constructor() {
        super({
            id: 'the_moai_head',
            title: 'The Moai Head',
            body: "A giant stone head stares at you.",
            image: 'assets/events/moai.jpg',
            options: [
                {
                    text: "Jump Inside: Heal to full HP, Lose 18% Max HP (or 12.5%)",
                    effect: () => {
                        globalBus.emit('player_heal', { percent: 1.0 });
                        globalBus.emit('player_max_hp_down', { percent: 0.125 }); // Standardized
                    }
                },
                {
                    text: "Offer: Give Golden Idol, Gain 333 Gold",
                    effect: () => {
                        globalBus.emit('remove_relic', 'golden_idol');
                        globalBus.emit('gain_gold', 333);
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