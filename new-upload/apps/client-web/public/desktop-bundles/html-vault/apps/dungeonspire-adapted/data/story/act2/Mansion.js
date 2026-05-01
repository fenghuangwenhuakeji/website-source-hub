/**
 * =================================================================================================
 * DungeonSpire - Story Act 2: The Haunted Mansion
 * =================================================================================================
 */
export const Act2Mansion = {
    id: 'act2_mansion',
    title: 'Haunted Mansion',
    text: `You find an abandoned mansion in the middle of the city. The windows are boarded up, but a faint light flickers inside.
    
    Do you dare enter?`,
    choices: [
        { text: "Enter", action: 'explore_mansion' },
        { text: "Ignore", action: 'leave' }
    ]
};