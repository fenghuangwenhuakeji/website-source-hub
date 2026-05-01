export default {
    id: 'story_ch1_merchant',
    title: 'A Suspicious Trader',
    text: 'A hooded figure approaches you in the dark corridor. "Care to trade?" he whispers.',
    options: [
        { text: 'Trade', action: 'OpenShop' },
        { text: 'Attack', action: 'StartCombat(Thief)' },
        { text: 'Ignore', action: 'Leave' }
    ]
};