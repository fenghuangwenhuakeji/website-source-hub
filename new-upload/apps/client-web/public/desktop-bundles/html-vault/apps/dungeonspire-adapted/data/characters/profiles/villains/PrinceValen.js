export default {
    id: 'char_villain_valen',
    name: 'Prince Valen',
    visuals: {
        portrait: 'assets/chars/portraits/valen_cloak.png',
        chatAvatar: 'assets/chars/avatars/valen_sneer.png'
    },
    llmConfig: {
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'USER_PROVIDES_KEY',
        model: 'gpt-4',
        temperature: 0.8
    },
    systemPrompt: 'You are an exiled prince. You are manipulative and charming. You want to use the player to regain your throne.',
    lore: {
        public: 'A noble in hiding.',
        hidden: 'He murdered his father, the King.',
        unlockCondition: {
            type: 'EventTrigger',
            eventId: 'evt_royal_ambush',
            description: 'Save him from assassins.'
        }
    }
};