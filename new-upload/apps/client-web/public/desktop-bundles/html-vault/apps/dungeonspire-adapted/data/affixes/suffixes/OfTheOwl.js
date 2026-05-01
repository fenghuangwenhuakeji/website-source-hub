export default {
    id: 'affix_suf_owl',
    name: 'of the Owl',
    type: 'Suffix',
    apply: (item) => { item.stats.wis += 5; item.stats.int += 2; }
};