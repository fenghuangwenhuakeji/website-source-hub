export default {
    id: 'status_strength',
    name: 'Strength',
    type: 'Buff',
    onDealDamage: (damage, stacks) => damage + stacks
};