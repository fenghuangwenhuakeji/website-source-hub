/**
 * =================================================================================================
 * DungeonSpire - Upgrade Shrine Event
 * =================================================================================================
 */
import { GameEvent } from './GameEvent.js';
import { globalBus } from '../../core/EventBus.js';

export class UpgradeShrineEvent extends GameEvent {
    constructor() {
        super({
            id: 'upgrade_shrine',
            title: 'Upgrade Shrine',
            body: "A shrine offers to upgrade a card.",
            image: 'assets/events/upgrade_shrine.jpg',
            options: [
                {
                    text: "Pray: Upgrade a card",
                    effect: () => {
                        globalBus.emit('upgrade_card_screen');
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