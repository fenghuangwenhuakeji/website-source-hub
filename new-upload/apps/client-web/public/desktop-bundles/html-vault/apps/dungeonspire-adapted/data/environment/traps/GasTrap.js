export default {
    id: 'env_trap_gas',
    trigger: (player) => {
        player.applyStatus('Poison', 3);
        return 'Noxious gas fills the room.';
    }
};