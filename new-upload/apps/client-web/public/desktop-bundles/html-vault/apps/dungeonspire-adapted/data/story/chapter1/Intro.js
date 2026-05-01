export default {
    id: 'story_ch1_intro',
    title: 'The Awakening',
    text: 'You wake up in a cold, damp cell. The memories of the battle are hazy...',
    options: [
        { text: 'Search the cell', outcome: 'Find Old Key' },
        { text: 'Break the door', outcome: 'Take 5 damage', req: 'Str > 10' }
    ]
};