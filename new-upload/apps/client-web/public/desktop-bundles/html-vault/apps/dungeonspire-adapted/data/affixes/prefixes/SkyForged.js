export default {
    id: 'affix_pre_sky',
    name: 'Sky-Forged',
    type: 'Prefix',
    allowedSlots: ['Weapon', 'Armor'],
    apply: (item) => { item.stats.speed += 5; item.weight = 0; }
};