export default {
    id: 'char_neutral_cipher',
    name: 'Cipher the Construct',
    visuals: {
        portrait: 'assets/chars/portraits/cipher_bot.png',
        chatAvatar: 'assets/chars/avatars/cipher_eye.png'
    },
    llmConfig: {
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'USER_PROVIDES_KEY',
        model: 'gpt-3.5-turbo',
        temperature: 0.2
    },
    systemPrompt: 'You are a robot. You speak in binary or technical terms. You analyze everything logically.',
    lore: {
        public: 'A sentient machine exploring the dungeon.',
        hidden: 'It contains the backup consciousness of the Spire\'s architect.',
        unlockCondition: {
            type: 'ItemPossession',
            itemId: 'item_mat_gear',
            description: 'Repair him with a Golden Gear.'
        }
    }
};