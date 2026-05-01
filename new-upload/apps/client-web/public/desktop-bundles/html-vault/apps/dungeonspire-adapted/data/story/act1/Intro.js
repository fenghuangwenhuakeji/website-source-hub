/**
 * =================================================================================================
 * DungeonSpire - Story Act 1: The Beginning
 * =================================================================================================
 */
export const Act1Intro = {
    id: 'act1_intro',
    title: 'The Spire Awaits',
    text: `You stand before the towering spire, its peak lost in the clouds. The air is thick with a strange energy.
    
    "So, you have returned," a voice whispers on the wind. "Will this time be different?"
    
    You grip your weapon tighter. Memories of past failures flash before your eyes, but your resolve remains unshaken.`,
    choices: [
        { text: "Enter the Spire", next: 'act1_floor1' }
    ]
};