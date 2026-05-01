/**
 * =================================================================================================
 * DungeonSpire - Drug Dealer Event
 * =================================================================================================
 */
import { GameEvent } from './GameEvent.js';
import { globalBus } from '../../core/EventBus.js';

export class DrugDealerEvent extends GameEvent {
    constructor() {
        super({
            id: 'drug_dealer',
            title: 'The Joust',
            body: "A shady figure offers you 'enhancements'.",
            image: 'assets/events/drug_dealer.jpg',
            options: [
                {
                    text: "Inject Mutagen: Gain Mutagenic Strength Relic",
                    effect: () => {
                        globalBus.emit('gain_relic', 'mutagenic_strength');
                    }
                },
                {
                    text: "Transform: Transform 2 cards",
                    effect: () => {
                        globalBus.emit('transform_card_screen', 2);
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