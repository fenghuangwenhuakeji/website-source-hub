export default {
    id: 'dia_elder_001',
    text: 'Welcome, traveler. The dungeon awaits.',
    responses: [
        { text: 'Tell me about the dungeon.', next: 'dia_elder_002' },
        { text: 'Goodbye.', next: 'exit' }
    ]
};