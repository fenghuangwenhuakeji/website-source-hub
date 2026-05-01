export default {
    id: 'affix_suf_bear',
    name: 'of the Bear',
    type: 'Suffix',
    apply: (item) => { item.stats.hp += 50; item.stats.str += 2; }
};