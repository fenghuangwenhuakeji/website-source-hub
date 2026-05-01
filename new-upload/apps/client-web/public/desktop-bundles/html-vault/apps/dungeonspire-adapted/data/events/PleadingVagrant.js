/**
 * =================================================================================================
 * DungeonSpire - Pleading Vagrant Event
 * =================================================================================================
 */
import { GameEvent } from './GameEvent.js';
import { globalBus } from '../../core/EventBus.js';

export class PleadingVagrantEvent extends GameEvent {
    constructor() {
        super({
            id: 'pleading_vagrant',
            title: 'Pleading Vagrant',
            body: "A vagrant begs for gold.",
            image: 'assets/events/vagrant.jpg',
            options: [
                {
                    text: "Give Gold: Lose 85 Gold, Gain Relic",
                    effect: () => {
                        globalBus.emit('lose_gold', 85);
                        globalBus.emit('gain_random_relic');
                    }
                },
                {
                    text: "Rob: Gain Relic, Gain Shame",
                    effect: () => {
                        globalBus.emit('gain_random_relic');
                        globalBus.emit('gain_curse', 'shame');
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