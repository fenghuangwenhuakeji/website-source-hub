export default {
    id: 'affix_pre_thunder',
    name: 'Thunderous',
    type: 'Prefix',
    allowedSlots: ['Weapon'],
    apply: (item) => { item.stats.atk += 12; item.effect = 'Chain Lightning'; }
};