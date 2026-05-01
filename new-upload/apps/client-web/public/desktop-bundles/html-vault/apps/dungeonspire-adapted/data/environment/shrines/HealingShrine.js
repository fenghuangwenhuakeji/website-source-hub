export default {
    id: 'env_shrine_heal',
    name: 'Shrine of Life',
    interact: (player) => {
        player.heal(player.maxHp * 0.5);
        return 'You feel refreshed.';
    }
};