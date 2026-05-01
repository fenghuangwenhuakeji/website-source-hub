export default {
    id: 'evt_forest_moonlight',
    title: 'Shrine of the Moon',
    text: 'Silver light bathes a clearing. A priestess prays silently.',
    options: [
        { text: 'Pray', outcome: 'Remove Curse' },
        { text: 'Desecrate', outcome: 'Gain Cursed Relic', req: 'Evil Alignment' },
        { text: 'Speak with her', outcome: 'OpenChat(Luna)', req: 'Has API Key' }
    ]
};