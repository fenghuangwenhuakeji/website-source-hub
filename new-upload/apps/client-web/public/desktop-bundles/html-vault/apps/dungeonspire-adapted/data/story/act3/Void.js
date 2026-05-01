/**
 * =================================================================================================
 * DungeonSpire - Story Act 3: The Void
 * =================================================================================================
 */
export const Act3Void = {
    id: 'act3_void',
    title: 'Staring into the Void',
    text: `You find yourself on the edge of a floating island, staring into the infinite abyss below.
    
    The void whispers to you, promising power in exchange for your sanity.`,
    choices: [
        { text: "Listen (Gain Power, Lose Sanity)", action: 'gain_void_power' },
        { text: "Step back", action: 'leave' }
    ]
};