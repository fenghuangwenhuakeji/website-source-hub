export default {
    maxShortTermHistory: 10, // Number of messages to keep in direct context
    enableSummary: true, // Whether to summarize old conversations
    summaryModel: 'gpt-3.5-turbo',
    topicsToTrack: [
        'PlayerName',
        'PlayerClass',
        'MajorDecisions',
        'GiftsGiven',
        'EnemiesKilled'
    ]
};