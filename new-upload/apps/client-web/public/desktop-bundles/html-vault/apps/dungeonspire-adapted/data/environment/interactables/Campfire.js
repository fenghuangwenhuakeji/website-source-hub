export default {
    id: 'env_campfire',
    name: 'Resting Spot',
    type: 'Station',
    options: [
        { text: 'Sleep (Heal 30%)', action: 'Rest' },
        { text: 'Smith (Upgrade Card)', action: 'Upgrade' },
        { text: 'Talk', action: 'OpenChat(Companions)' }
    ]
};