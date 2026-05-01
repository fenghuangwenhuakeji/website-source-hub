export default {
    id: 'evt_abyss_whisper',
    title: 'Voices in the Dark',
    text: '"Join us..." the shadows whisper. "We have cookies."',
    options: [
        { text: 'Refuse', outcome: 'Combat (Shadow)' },
        { text: 'Accept', outcome: 'Gain Curse: Madness', reward: 'Dark Cookie (Heal 50)' },
        { text: 'Chat with Shadows', outcome: 'OpenChat(Malakor)', req: 'Has Unlocked Malakor' }
    ]
};