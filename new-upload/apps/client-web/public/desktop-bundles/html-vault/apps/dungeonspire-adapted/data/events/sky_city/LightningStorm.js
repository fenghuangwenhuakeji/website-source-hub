export default {
    id: 'evt_sky_storm',
    title: 'Thunderstruck',
    text: 'Lightning arcs between the floating islands.',
    options: [
        { text: 'Channel it', outcome: 'Upgrade 2 Random Cards', req: 'Has Lightning Card' },
        { text: 'Hide', outcome: 'Lose 1 Turn' },
        { text: 'Get hit', outcome: 'Take 15 Dmg, Remove a Card' }
    ]
};