export default {
    id: 'affix_suf_giant',
    name: 'of the Giant',
    type: 'Suffix',
    apply: (item) => { item.stats.hp += 100; item.stats.speed -= 5; }
};