export default {
    id: 'affix_pre_heavy',
    name: 'Heavy',
    type: 'Prefix',
    apply: (item) => { item.stats.atk += 4; item.stats.speed -= 1; }
};