/**
 * =================================================================================================
 * DungeonSpire - Status Effects (Powers)
 * Version: 1.0.0
 * Author: HyperInfinity
 * =================================================================================================
 * Description:
 * Definitions for common status effects like Strength, Weak, Vulnerable, etc.
 * =================================================================================================
 */

export const PowerDefinitions = {
    'strength': {
        name: 'Strength',
        type: 'buff',
        description: "Attacks deal X more damage.",
        icon: 'assets/powers/strength.png',
        onDamageDealt: (amount, stacks) => amount + stacks
    },
    'weak': {
        name: 'Weak',
        type: 'debuff',
        description: "Target deals 25% less damage.",
        icon: 'assets/powers/weak.png',
        onDamageDealt: (amount, stacks) => Math.floor(amount * 0.75),
        endTurnDecay: true
    },
    'vulnerable': {
        name: 'Vulnerable',
        type: 'debuff',
        description: "Target takes 50% more damage.",
        icon: 'assets/powers/vulnerable.png',
        onDamageTaken: (amount, stacks) => Math.floor(amount * 1.5),
        endTurnDecay: true
    },
    'ritual': {
        name: 'Ritual',
        type: 'buff',
        description: "At the end of its turn, gains X Strength.",
        icon: 'assets/powers/ritual.png',
        onTurnEnd: (entity, stacks) => entity.addPower('strength', stacks)
    },
    'no_draw': {
        name: 'No Draw',
        type: 'debuff',
        description: "Cannot draw any more cards this turn.",
        icon: 'assets/powers/no_draw.png',
        endTurnDecay: true
    },
    'poison': {
        name: 'Poison',
        type: 'debuff',
        description: "At the start of its turn, takes X damage and loses 1 stack.",
        icon: 'assets/powers/poison.png',
        onTurnStart: (entity, stacks) => {
            entity.takeDamage(stacks);
            return -1; // Reduce stack by 1
        }
    },
    'frail': {
        name: 'Frail',
        type: 'debuff',
        description: "Gain 25% less Block.",
        icon: 'assets/powers/frail.png',
        onBlockGained: (amount, stacks) => Math.floor(amount * 0.75),
        endTurnDecay: true
    }
};