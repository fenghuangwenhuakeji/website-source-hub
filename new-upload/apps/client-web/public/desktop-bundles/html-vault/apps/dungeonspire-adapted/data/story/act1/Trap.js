/**
 * =================================================================================================
 * DungeonSpire - Story Act 1: The Trap
 * =================================================================================================
 */
export const Act1Trap = {
    id: 'act1_trap',
    title: 'A Deadly Trap',
    text: `You hear a click beneath your feet. A mechanism whirs to life.
    
    Spikes shoot out from the walls! You have split seconds to react.`,
    choices: [
        { text: "Dodge (Dexterity)", action: 'skill_check_dex' },
        { text: "Block (Strength)", action: 'skill_check_str' },
        { text: "Take the hit (-10 HP)", action: 'take_damage_10' }
    ]
};