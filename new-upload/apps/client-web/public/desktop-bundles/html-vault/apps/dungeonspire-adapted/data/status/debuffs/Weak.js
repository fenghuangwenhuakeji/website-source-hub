export default {
    id: 'status_weak',
    name: 'Weak',
    type: 'Debuff',
    onDealDamage: (damage) => damage * 0.75,
    onTurnEnd: (stacks) => stacks - 1
};