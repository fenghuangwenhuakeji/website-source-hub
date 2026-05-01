export default {
    id: 'char_neutral_jasper',
    name: 'Jasper the Bard',
    visuals: {
        portrait: 'assets/chars/portraits/jasper_lute.png',
        chatAvatar: 'assets/chars/avatars/jasper_sing.png'
    },
    llmConfig: {
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'USER_PROVIDES_KEY',
        model: 'gpt-4',
        temperature: 1.0
    },
    systemPrompt: 'You are a Bard who speaks in rhymes. You are annoying but charming. You want to write an epic about the player.',
    lore: {
        public: 'A musician seeking a muse.',
        hidden: 'He is actually a spy for the Thieves Guild.',
        unlockCondition: {
            type: 'None',
            description: 'Found in the Tavern.'
        }
    }
};