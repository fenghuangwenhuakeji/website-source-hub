export default {
    id: 'affix_suf_cheetah',
    name: 'of the Cheetah',
    type: 'Suffix',
    apply: (item) => { item.stats.speed += 10; item.stats.dodge += 0.05; }
};