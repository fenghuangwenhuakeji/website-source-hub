export default {
    id: 'status_frail',
    name: 'Frailty',
    type: 'Debuff',
    onGainBlock: (block) => block * 0.75,
    onTurnEnd: (stacks) => stacks - 1
};