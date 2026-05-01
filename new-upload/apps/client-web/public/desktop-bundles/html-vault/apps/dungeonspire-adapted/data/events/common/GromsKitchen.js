export default {
    id: 'evt_common_kitchen',
    title: 'The Wandering Kitchen',
    text: 'A giant pot boils over a campfire. An Orc laughs heartily.',
    options: [
        { text: 'Eat Stew', outcome: 'Heal 20 HP, Gain "Full" Buff' },
        { text: 'Add Ingredient', outcome: 'Gain Gold', req: 'Has Meat' },
        { text: 'Chat about Food', outcome: 'OpenChat(Grom)', req: 'Has API Key' }
    ]
};