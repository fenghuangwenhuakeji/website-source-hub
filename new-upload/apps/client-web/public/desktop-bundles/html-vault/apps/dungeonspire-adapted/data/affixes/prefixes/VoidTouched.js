export default {
    id: 'affix_pre_void',
    name: 'Void-Touched',
    type: 'Prefix',
    allowedSlots: ['Weapon', 'Armor'],
    apply: (item) => { item.stats.atk += 10; item.stats.hp -= 5; }
};