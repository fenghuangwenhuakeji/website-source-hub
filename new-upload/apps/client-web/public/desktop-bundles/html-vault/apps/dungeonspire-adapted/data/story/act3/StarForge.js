/**
 * =================================================================================================
 * DungeonSpire - Story Act 3: The Star Forge
 * =================================================================================================
 */
export const Act3StarForge = {
    id: 'act3_star_forge',
    title: 'The Star Forge',
    text: `You discover a massive forge powered by a captured star. The heat is intense.
    
    A spectral smith works the anvil.`,
    choices: [
        { text: "Forge Weapon (Requires Ore)", action: 'craft_weapon' },
        { text: "Attack the Smith", action: 'start_combat_smith' },
        { text: "Leave", action: 'leave' }
    ]
};