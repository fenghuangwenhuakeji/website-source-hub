export default {
    id: 'affix_pre_frozen',
    name: 'Frozen',
    type: 'Prefix',
    allowedSlots: ['Weapon', 'Armor'],
    apply: (item) => { item.stats.def += 5; item.stats.iceRes += 10; }
};