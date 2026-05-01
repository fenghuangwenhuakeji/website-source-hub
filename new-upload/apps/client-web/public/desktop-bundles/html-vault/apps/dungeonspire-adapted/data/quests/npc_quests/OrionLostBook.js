export default {
    id: 'quest_orion_book',
    giver: 'char_neutral_orion',
    title: 'The Lost Tome',
    description: 'Find the Tome of Wisdom in the Sky City.',
    startCondition: 'Chat with Orion about "knowledge"',
    objectives: [
        { type: 'FindItem', target: 'book_wis', count: 1 }
    ],
    reward: { type: 'Relic', id: 'relic_rare_001' }
};