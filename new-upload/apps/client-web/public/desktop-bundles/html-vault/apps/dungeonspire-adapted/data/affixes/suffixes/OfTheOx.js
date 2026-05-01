export default {
    id: 'affix_suf_ox',
    name: 'of the Ox',
    type: 'Suffix',
    apply: (item) => { item.stats.str += 5; item.stats.speed -= 1; }
};