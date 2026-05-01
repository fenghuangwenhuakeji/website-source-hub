export default {
    id: 'quest_seraphina_fly',
    giver: 'char_ally_seraphina',
    title: 'Wings of Steel',
    description: 'Beat a boss without taking damage.',
    startCondition: 'Chat with Seraphina about "strength"',
    objectives: [
        { type: 'Achievement', target: 'ach_cmb_002' } // Unscathed
    ],
    reward: { type: 'Item', id: 'item_wep_leg_001' } // Excalibur
};