export default {
    id: 'affix_pre_volcanic',
    name: 'Volcanic',
    type: 'Prefix',
    allowedSlots: ['Weapon'],
    apply: (item) => { item.stats.atk += 15; item.effect = 'Explode on Kill'; }
};