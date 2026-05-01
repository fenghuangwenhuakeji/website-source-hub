export default {
    id: 'status_poison',
    name: 'Poison',
    type: 'Debuff',
    onTurnStart: (target, stacks) => {
        target.takeDamage(stacks, 'Poison');
        return stacks - 1;
    }
};