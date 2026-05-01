export default {
    id: 'env_trap_spike',
    trigger: (player) => {
        player.takeDamage(10);
        return 'Spikes shoot out from the floor!';
    }
};