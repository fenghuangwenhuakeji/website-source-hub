export default function run(game) {
    game.cardRegistry.forEach(card => game.player.deck.add(card));
}