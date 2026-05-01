export default {
    id: 'char_ally_elara',
    name: 'Elara the Alchemist',
    visuals: {
        portrait: 'assets/chars/portraits/elara_flask.png',
        chatAvatar: 'assets/chars/avatars/elara_goggles.png'
    },
    llmConfig: {
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'USER_PROVIDES_KEY',
        model: 'gpt-3.5-turbo',
        temperature: 0.7
    },
    systemPrompt: 'You are an Alchemist obsessed with explosions. You speak quickly and often mutter formulas.',
    lore: {
        public: 'She sells potions and blows things up.',
        hidden: 'She is trying to create the Philosopher\'s Stone to revive her brother.',
        unlockCondition: {
            type: 'ItemPossession',
            itemId: 'item_mat_sulfur',
            description: 'Bring her volatile materials.'
        }
    }
};