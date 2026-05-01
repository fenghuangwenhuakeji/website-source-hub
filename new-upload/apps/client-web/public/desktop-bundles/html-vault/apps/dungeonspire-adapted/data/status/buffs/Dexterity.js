export default {
    id: 'status_dexterity',
    name: 'Dexterity',
    type: 'Buff',
    onGainBlock: (block, stacks) => block + stacks
};