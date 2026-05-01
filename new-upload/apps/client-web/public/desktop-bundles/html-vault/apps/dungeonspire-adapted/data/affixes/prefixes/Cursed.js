export default {
    id: 'affix_pre_cursed',
    name: 'Cursed',
    type: 'Prefix',
    allowedSlots: ['Weapon', 'Armor'],
    apply: (item) => { item.stats.atk += 20; item.stats.hp -= 20; item.value *= 0.5; }
};