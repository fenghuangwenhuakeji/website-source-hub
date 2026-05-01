export default {
    id: 'quest_secret_code',
    title: 'The Cipher',
    description: 'You spoke the ancient password to the Guardian.',
    triggerKeyword: 'mellon',
    action: (game) => {
        game.dungeon.unlockRoom('hidden_vault');
        game.chatInterface.systemMessage('The ancient stone door rumbles open...');
    }
};