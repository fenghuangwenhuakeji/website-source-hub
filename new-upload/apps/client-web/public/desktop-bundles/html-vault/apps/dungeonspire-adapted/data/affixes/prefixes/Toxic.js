export default {
    id: 'affix_pre_toxic',
    name: 'Toxic',
    type: 'Prefix',
    allowedSlots: ['Weapon'],
    apply: (item) => { item.stats.atk += 2; item.effect = 'Poison 3'; }
};