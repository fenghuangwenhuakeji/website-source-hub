export default {
    id: 'relic_rare_001',
    name: 'Dead Branch',
    tier: 'Rare',
    description: 'Whenever you Exhaust a card, add a random card to your hand.',
    effect: { type: 'OnExhaust', action: 'AddRandomCard' }
};