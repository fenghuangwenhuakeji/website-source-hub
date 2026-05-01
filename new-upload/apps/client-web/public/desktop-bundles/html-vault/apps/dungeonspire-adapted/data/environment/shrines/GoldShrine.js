export default {
    id: 'env_shrine_gold',
    name: 'Golden Idol',
    interact: (player) => {
        player.gold += 100;
        player.addCurse('Greed');
        return 'You take the gold, but feel a heavy burden.';
    }
};