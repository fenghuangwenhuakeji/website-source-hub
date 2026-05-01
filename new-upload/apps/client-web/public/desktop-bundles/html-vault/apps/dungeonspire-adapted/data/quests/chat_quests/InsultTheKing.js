export default {
    id: 'quest_insult_king',
    title: 'Lèse-majesté',
    description: 'You insulted the Forgotten King to his face.',
    triggerKeyword: 'tyrant',
    action: (game) => {
        game.combatSystem.startCombat('char_villain_king');
        game.chatInterface.systemMessage('The King draws his blade in fury!');
    }
};