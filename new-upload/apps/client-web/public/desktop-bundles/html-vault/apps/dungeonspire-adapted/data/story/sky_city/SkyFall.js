export default {
    id: 'story_sky_fall',
    title: 'Gravity Failure',
    text: 'The island beneath your feet begins to crumble. A Sky Golem offers you a hand, but its eyes glow red.',
    options: [
        { text: 'Trust the Golem', outcome: 'Battle (Sky Golem)', reward: 'Golem Core' },
        { text: 'Jump to another rock', outcome: 'Lose 10 HP', reward: 'Agility Potion' },
        { text: 'Chat with Golem', outcome: 'OpenChat(Golem)', req: 'Has API Key' }
    ]
};