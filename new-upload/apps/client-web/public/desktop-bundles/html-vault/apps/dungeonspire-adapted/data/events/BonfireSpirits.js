/**
 * =================================================================================================
 * DungeonSpire - Bonfire Spirits Event
 * =================================================================================================
 */
import { GameEvent } from './GameEvent.js';
import { globalBus } from '../../core/EventBus.js';

export class BonfireSpiritsEvent extends GameEvent {
    constructor() {
        super({
            id: 'bonfire_spirits',
            title: 'Bonfire Spirits',
            body: "Strange spirits dance around a fire. They seem to want something.",
            image: 'assets/events/bonfire.jpg',
            options: [
                {
                    text: "Offer: Give a card",
                    effect: () => {
                        globalBus.emit('remove_card_screen');
                        // Logic to give reward based on rarity (heal or relic)
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