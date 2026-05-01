export default {
    id: 'talent_rogue_001',
    name: 'Backstab',
    maxRank: 1,
    description: (rank) => `Attacks from Stealth always critically hit.`,
    apply: (char, rank) => char.modifiers.stealthCrit = true
};