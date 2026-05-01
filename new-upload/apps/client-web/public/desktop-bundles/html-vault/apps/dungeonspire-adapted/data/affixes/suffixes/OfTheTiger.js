export default {
    id: 'affix_suf_tiger',
    name: 'of the Tiger',
    type: 'Suffix',
    apply: (item) => { item.stats.critChance += 0.1; item.stats.atk += 3; }
};