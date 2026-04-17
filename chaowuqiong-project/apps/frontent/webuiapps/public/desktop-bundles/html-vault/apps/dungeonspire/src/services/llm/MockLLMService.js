export class MockLLMService {
    constructor(config) {
        this.config = config;
    }

    async sendMessage(messages) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        const lastUserMessage = messages[messages.length - 1].content.toLowerCase();

        if (lastUserMessage.includes('hello')) {
            return 'Greetings, adventurer! How can I aid you today? (Mock Response)';
        }
        if (lastUserMessage.includes('quest')) {
            return 'I have a task for you, if you are brave enough. (Mock Response)';
        }
        
        return 'I see. Tell me more about that. (Mock Response)';
    }
}