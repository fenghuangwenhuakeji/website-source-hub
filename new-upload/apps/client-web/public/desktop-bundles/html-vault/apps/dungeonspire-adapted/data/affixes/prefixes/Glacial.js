export default {
    id: 'affix_pre_glacial',
    name: 'Glacial',
    type: 'Prefix',
    allowedSlots: ['Weapon', 'Armor'],
    apply: (item) => { item.stats.def += 5; item.effect = 'Slow Attacker'; }
};