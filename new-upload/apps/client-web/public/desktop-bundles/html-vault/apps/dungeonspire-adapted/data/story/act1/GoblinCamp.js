/**
 * =================================================================================================
 * DungeonSpire - Story Act 1: The Goblin Camp
 * =================================================================================================
 */
export const Act1GoblinCamp = {
    id: 'act1_goblin_camp',
    title: 'Goblin Camp',
    text: `You stumble upon a clearing filled with crude tents. Goblins are dancing around a fire.
    
    They haven't noticed you yet.`,
    choices: [
        { text: "Attack! (Start Combat)", action: 'start_combat_goblins' },
        { text: "Sneak past (Dexterity Check)", action: 'skill_check_dex' },
        { text: "Steal supplies", action: 'steal_loot' }
    ]
};