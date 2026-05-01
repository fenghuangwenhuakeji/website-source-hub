export default {
    id: 'quest_kaelen_redemption',
    giver: 'char_ally_kaelen',
    title: 'Path of Atonement',
    description: 'Defeat 50 Undead enemies to ease Kaelen\'s guilt.',
    startCondition: 'Chat with Kaelen about "honor"',
    objectives: [
        { type: 'KillEnemyType', target: 'Undead', count: 50 }
    ],
    reward: { type: 'Card', id: 'card_pal_aura_002' }
};