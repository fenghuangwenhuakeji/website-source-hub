export default {
    id: 'talent_war_001',
    name: 'Thick Skin',
    maxRank: 3,
    description: (rank) => `Gain ${rank * 2} Max HP.`,
    apply: (char, rank) => char.maxHp += rank * 2
};