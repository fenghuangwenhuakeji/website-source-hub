export class ActionParser {
    constructor(game) {
        this.game = game;
    }

    // 解析 AI 的回复，寻找指令标记
    // 例如："Take this sword. [GIVE_ITEM: item_wep_iron_sword]"
    parseAndExecute(aiResponse) {
        const actions = [];
        const regex = /\[(.*?)\]/g;
        let match;

        while ((match = regex.exec(aiResponse)) !== null) {
            const command = match[1].split(':');
            const actionType = command[0].trim();
            const payload = command[1] ? command[1].trim() : null;
            
            this.executeAction(actionType, payload);
            actions.push({ type: actionType, payload });
        }

        // 返回清理后的文本（去除指令）
        return aiResponse.replace(regex, '').trim();
    }

    executeAction(type, payload) {
        console.log(`AI Triggered Action: ${type} with ${payload}`);
        switch (type) {
            case 'GIVE_ITEM':
                this.game.player.addItem(payload);
                break;
            case 'START_QUEST':
                this.game.questSystem.startQuest(payload);
                break;
            case 'ATTACK_PLAYER':
                this.game.combatSystem.startCombat(payload); // payload is enemy ID
                break;
            case 'UNLOCK_DOOR':
                this.game.dungeon.unlockRoom(payload);
                break;
            case 'CHANGE_RELATIONSHIP':
                const [charId, amount] = payload.split(',');
                this.game.relationshipSystem.modify(charId, parseInt(amount));
                break;
        }
    }
}