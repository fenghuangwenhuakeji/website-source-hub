export default {
    id: 'relic_boss_001',
    name: 'Cursed Key',
    tier: 'Boss',
    description: 'Gain 1 Energy at the start of each turn. Whenever you open a non-Boss chest, obtain a Curse.',
    effect: { type: 'GainEnergy', amount: 1, penalty: 'CurseOnChest' }
};