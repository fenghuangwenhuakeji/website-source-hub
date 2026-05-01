export default {
    id: 'status_vulnerable',
    name: 'Vulnerable',
    type: 'Debuff',
    onReceiveDamage: (damage) => damage * 1.5,
    onTurnEnd: (stacks) => stacks - 1
};