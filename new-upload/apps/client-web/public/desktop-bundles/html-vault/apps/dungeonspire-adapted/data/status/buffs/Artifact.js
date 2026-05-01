export default {
    id: 'status_artifact',
    name: 'Artifact',
    type: 'Buff',
    onReceiveDebuff: () => {
        // Consume 1 stack to negate debuff
        return { prevent: true, consume: 1 };
    }
};