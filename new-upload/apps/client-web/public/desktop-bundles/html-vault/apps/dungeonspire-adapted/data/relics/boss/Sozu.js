export default {
    id: 'relic_boss_002',
    name: 'Sozu',
    tier: 'Boss',
    description: 'Gain 1 Energy at the start of each turn. You can no longer use potions.',
    effect: { type: 'GainEnergy', amount: 1, penalty: 'NoPotions' }
};