export default {
    id: 'affix_pre_molten',
    name: 'Molten',
    type: 'Prefix',
    allowedSlots: ['Weapon', 'Armor'],
    apply: (item) => { item.stats.atk += 5; item.stats.fireRes += 10; }
};