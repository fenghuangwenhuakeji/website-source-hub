/**
 * =================================================================================================
 * DungeonSpire - Story Act 2: The Ambush
 * =================================================================================================
 */
export const Act2Ambush = {
    id: 'act2_ambush',
    title: 'Ambush!',
    text: `As you navigate the narrow alleyways, shadows detach themselves from the walls.
    
    Thieves! They surround you, knives glinting in the dim light.`,
    choices: [
        { text: "Fight!", action: 'start_combat_thieves' },
        { text: "Pay them off (100 Gold)", action: 'pay_gold_100' }
    ]
};