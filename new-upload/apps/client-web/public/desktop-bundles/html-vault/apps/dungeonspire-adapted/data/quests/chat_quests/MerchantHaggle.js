export default {
    id: 'quest_merchant_haggle',
    title: 'The Art of the Deal',
    description: 'You successfully haggled for a discount.',
    triggerKeyword: 'discount',
    condition: (game) => game.player.stats.charisma > 10,
    action: (game) => {
        game.shopSystem.applyDiscount(0.2);
        game.chatInterface.systemMessage('The Merchant sighs and lowers the prices.');
    }
};