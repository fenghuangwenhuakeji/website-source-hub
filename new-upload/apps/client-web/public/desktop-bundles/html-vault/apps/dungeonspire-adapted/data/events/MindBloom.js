/**
 * =================================================================================================
 * DungeonSpire - Mind Bloom Event
 * =================================================================================================
 */
import { GameEvent } from './GameEvent.js';
import { globalBus } from '../../core/EventBus.js';

export class MindBloomEvent extends GameEvent {
    constructor() {
        super({
            id: 'mind_bloom',
            title: 'Mind Bloom',
            body: "Your mind expands.",
            image: 'assets/events/mind_bloom.jpg',
            options: [
                {
                    text: "I am War: Fight Act 1 Boss (Reward: Rare Relic)",
                    effect: () => {
                        globalBus.emit('start_combat', 'act1_boss');
                    }
                },
                {
                    text: "I am Awake: Upgrade all cards, lose healing (Mark of the Bloom)",
                    effect: () => {
                        globalBus.emit('upgrade_all_cards');
                        globalBus.emit('gain_relic', 'mark_of_the_bloom');
                    }
                },
                {
                    text: "I am Rich: Gain 999 Gold, gain 2 Normality",
                    effect: () => {
                        globalBus.emit('gain_gold', 999);
                        globalBus.emit('gain_curse', 'normality', 2);
                    }
                },
                {
                    text: "I am Healthy: Heal to full HP, gain Doubt",
                    effect: () => {
                        globalBus.emit('player_heal', { percent: 1.0 });
                        globalBus.emit('gain_curse', 'doubt');
                    }
                }
            ]
        });
    }
}