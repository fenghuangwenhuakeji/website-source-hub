/**
 * =================================================================================================
 * DungeonSpire - Story Act 1: The Merchant
 * =================================================================================================
 */
export const Act1Merchant = {
    id: 'act1_merchant',
    title: 'A Familiar Face',
    text: `In a quiet corner of the dungeon, you spot a colorful rug spread out on the cold stone floor.
    
    A masked figure sits cross-legged, surrounded by wares. "Welcome! Welcome!" he chirps. "I have many things... for a price."
    
    His eyes gleam with a mix of mischief and avarice.`,
    choices: [
        { text: "Browse Wares", action: 'open_shop' },
        { text: "Leave", action: 'leave_shop' }
    ]
};