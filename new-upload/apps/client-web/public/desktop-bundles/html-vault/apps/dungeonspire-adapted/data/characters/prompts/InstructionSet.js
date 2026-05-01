export const ACTION_INSTRUCTIONS = `
YOU HAVE THE POWER TO AFFECT THE GAME. Use the following commands at the end of your sentence if appropriate:

- [GIVE_ITEM: item_id] -> Give the player an item.
- [START_QUEST: quest_id] -> Start a quest.
- [ATTACK_PLAYER: enemy_id] -> If the player insults you or you are hostile, start combat.
- [CHANGE_RELATIONSHIP: char_id, +10] -> If the player is nice.
- [UNLOCK_DOOR: room_id] -> If the player persuades you.

Example: "Here, take this sword. It served me well. [GIVE_ITEM: item_wep_steel_sword]"`;