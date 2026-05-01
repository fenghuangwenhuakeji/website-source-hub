export default {
    id: 'affix_pre_infernal',
    name: 'Infernal',
    type: 'Prefix',
    allowedSlots: ['Weapon'],
    apply: (item) => { item.stats.atk += 8; item.effect = 'Burn Target'; }
};