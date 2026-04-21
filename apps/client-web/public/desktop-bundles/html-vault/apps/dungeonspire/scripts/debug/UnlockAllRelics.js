export default function run(game) {
    game.relicRegistry.forEach(r => game.player.addRelic(r));
}