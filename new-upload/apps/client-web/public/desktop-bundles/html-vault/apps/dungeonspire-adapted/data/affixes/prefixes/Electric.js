export default {
    id: 'affix_pre_electric',
    name: 'Electric',
    type: 'Prefix',
    allowedSlots: ['Weapon'],
    apply: (item) => { item.stats.speed += 2; item.stats.lightningRes += 10; }
};