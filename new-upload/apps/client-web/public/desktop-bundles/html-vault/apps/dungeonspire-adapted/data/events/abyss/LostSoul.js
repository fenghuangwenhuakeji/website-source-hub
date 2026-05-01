export default {
    id: 'evt_abyss_soul',
    title: 'Wandering Spirit',
    text: 'A transparent figure weeps silently.',
    options: [
        { text: 'Offer Gold', outcome: 'Lose 50 Gold, Heal 20 HP' },
        { text: 'Attack', outcome: 'Start Combat (Ghost)' },
        { text: 'Chat', outcome: 'OpenChat(Ghost)', req: 'Has Spirit Medium Skill' }
    ]
};