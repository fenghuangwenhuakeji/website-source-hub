export default {
    id: 'quest_recruit_merc',
    title: 'You Have My Sword',
    description: 'You convinced a mercenary to join you for free.',
    triggerKeyword: 'glory',
    condition: (game) => game.player.reputation > 50,
    action: (game) => {
        game.mercenarySystem.hire('mer_fighter_001', 0); // Free hire
        game.chatInterface.systemMessage('Iron Clad joins your party for the promise of glory!');
    }
};