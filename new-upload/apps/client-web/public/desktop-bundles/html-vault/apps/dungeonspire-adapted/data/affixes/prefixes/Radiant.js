export default {
    id: 'affix_pre_radiant',
    name: 'Radiant',
    type: 'Prefix',
    allowedSlots: ['Armor', 'Shield'],
    apply: (item) => { item.stats.hp += 20; item.effect = 'Blind Attacker'; }
};