export default {
    id: 'talent_war_002',
    name: 'Sword Mastery',
    maxRank: 5,
    description: (rank) => `Deal ${rank * 5}% more damage with Swords.`,
    apply: (char, rank) => char.modifiers.swordDamage += rank * 0.05
};