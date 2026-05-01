export default {
    id: 'affix_pre_blessed',
    name: 'Blessed',
    type: 'Prefix',
    allowedSlots: ['Weapon', 'Armor'],
    apply: (item) => { item.stats.hp += 10; item.stats.luck += 5; item.value *= 1.5; }
};