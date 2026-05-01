export default {
    id: 'env_alchemy_table',
    name: 'Alchemy Table',
    type: 'Station',
    interact: (player) => {
        if (player.hasItem('item_mat_herb')) {
            player.removeItem('item_mat_herb');
            player.addItem('pot_hp_small');
            return 'You brew a potion.';
        }
        return 'You need herbs to use this.';
    }
};