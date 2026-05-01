export default {
    id: 'talent_mage_001',
    name: 'Mana Flow',
    maxRank: 3,
    description: (rank) => `Regenerate ${rank} Mana per turn.`,
    apply: (char, rank) => char.manaRegen += rank
};