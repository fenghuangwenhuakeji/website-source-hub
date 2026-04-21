export default function run(game) {
    game.combat.enemies.forEach(e => e.die());
}