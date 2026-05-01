export default {
    id: 'affix_suf_falcon',
    name: 'of the Falcon',
    type: 'Suffix',
    apply: (item) => { item.stats.acc += 0.1; item.stats.critChance += 0.05; }
};