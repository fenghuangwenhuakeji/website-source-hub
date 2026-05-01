export default {
    id: 'evt_common_mirror',
    title: 'The Magic Mirror',
    text: 'You see a mirror that reflects not your face, but your desires.',
    options: [
        { text: 'Gaze into it', outcome: 'Duplicate a card in your deck' },
        { text: 'Smash it', outcome: 'Gain "Shard of Glass" (Weapon)', req: 'Str > 10' },
        { text: 'Talk to reflection', outcome: 'OpenChat(MirrorSelf)', req: 'Has API Key' }
    ]
};