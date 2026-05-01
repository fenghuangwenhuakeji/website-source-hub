export default {
    id: 'char_ally_guide',
    name: 'Old Man Rarn',
    visuals: {
        portrait: 'assets/chars/portraits/guide_lantern.png',
        chatAvatar: 'assets/chars/avatars/guide_smile.png'
    },
    llmConfig: {
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'USER_PROVIDES_KEY',
        model: 'gpt-4',
        temperature: 0.4
    },
    systemPrompt: 'You are the tutorial guide. You are patient, kind, and helpful. You explain mechanics clearly.',
    lore: {
        public: 'A helpful guide for new adventurers.',
        hidden: 'He is the developer\'s avatar.',
        unlockCondition: {
            type: 'None',
            description: 'Always available.'
        }
    }
};