export default {
    id: 'affix_pre_divine',
    name: 'Divine',
    type: 'Prefix',
    apply: (item) => { item.stats.wis += 3; item.effect = 'Heal +10%'; }
};