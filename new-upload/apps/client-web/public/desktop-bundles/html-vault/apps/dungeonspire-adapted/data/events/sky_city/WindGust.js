export default {
    id: 'evt_sky_gust',
    title: 'Sudden Squall',
    text: 'A massive gust of wind threatens to blow you off the bridge!',
    options: [
        { text: 'Hold on tight', outcome: 'Lose 1 Turn', req: 'Str > 15' },
        { text: 'Use magic to stabilize', outcome: 'Lose 10 Mana', req: 'Int > 15' },
        { text: 'Let go', outcome: 'Fall to lower level (Take 20 Dmg)' }
    ]
};