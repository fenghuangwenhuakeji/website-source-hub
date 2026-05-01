export default {
    id: 'talent_mage_002',
    name: 'Pyromancer',
    maxRank: 3,
    description: (rank) => `Fire spells apply ${rank} additional Burn.`,
    apply: (char, rank) => char.modifiers.fireBurn += rank
};