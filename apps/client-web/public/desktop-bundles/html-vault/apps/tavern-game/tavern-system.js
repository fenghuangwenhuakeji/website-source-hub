// ========== 酒馆系统 ==========

class TavernSystem {
    constructor() {
        this.currentNPC = null;
        this.dialogueHistory = [];
        this.npcs = [];
        this.isInitialized = false;
    }

    // 初始化酒馆系统
    init() {
        this.loadNPCs();
        this.renderNPCs();
        this.isInitialized = true;
    }

    // 加载NPC
    loadNPCs() {
        this.npcs = Object.values(GameData.npcs).filter(npc => npc.location === 'tavern');
    }

    // 渲染NPC
    renderNPCs() {
        const npcArea = document.querySelector('.npc-area');
        if (!npcArea) return;

        npcArea.innerHTML = '';

        this.npcs.forEach(npc => {
            const npcElement = document.createElement('div');
            npcElement.className = 'npc';
            npcElement.innerHTML = `
                <div class="npc-sprite">${npc.icon}</div>
                <div class="npc-name">${npc.name}</div>
            `;
            npcElement.addEventListener('click', () => this.talkToNPC(npc));
            npcArea.appendChild(npcElement);
        });
    }

    // 与NPC对话
    talkToNPC(npc) {
        this.currentNPC = npc;
        audioSystem.playSound('click');
        this.showDialogue(npc, 'default');
    }

    // 显示对话
    showDialogue(npc, dialogueKey) {
        const dialogue = npc.dialogue[dialogueKey] || npc.dialogue.default;
        
        document.getElementById('speaker-name').textContent = npc.name;
        document.getElementById('dialogue-text').textContent = dialogue;

        // 生成对话选项
        this.generateDialogueOptions(npc);
    }

    // 生成对话选项
    generateDialogueOptions(npc) {
        const optionsContainer = document.getElementById('dialogue-options');
        optionsContainer.innerHTML = '';

        const options = [
            { text: "我想接取任务", action: () => this.showQuests() },
            { text: "看看商店", action: () => this.showShop() },
            { text: "休息一下", action: () => this.rest() },
            { text: "再见", action: () => this.closeDialogue() }
        ];

        options.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option.text;
            button.addEventListener('click', option.action);
            optionsContainer.appendChild(button);
        });
    }

    // 关闭对话
    closeDialogue() {
        this.currentNPC = null;
        document.getElementById('speaker-name').textContent = '';
        document.getElementById('dialogue-text').textContent = '';
        document.getElementById('dialogue-options').innerHTML = '';
        audioSystem.playSound('click');
    }

    // 显示商店
    showShop() {
        this.closeDialogue();
        game.showNotification('打开商店', 'info');
        // 这里可以打开商店界面
    }

    // 显示吧台
    showBar() {
        audioSystem.playSound('click');
        this.showDrinkMenu();
    }

    // 显示酒水菜单
    showDrinkMenu() {
        const drinks = [
            { name: "麦芽酒", price: 5, effect: "恢复10点生命" },
            { name: "蜂蜜酒", price: 10, effect: "恢复20点生命" },
            { name: "龙血酒", price: 50, effect: "恢复50点生命，提升攻击力5" },
            { name: "月光酿", price: 30, effect: "恢复30点魔法" }
        ];

        let message = "酒水菜单：\n\n";
        drinks.forEach(drink => {
            message += `${drink.name} - ${drink.price}金币\n  ${drink.effect}\n\n`;
        });

        document.getElementById('dialogue-text').textContent = message;
        document.getElementById('speaker-name').textContent = "酒保";

        const optionsContainer = document.getElementById('dialogue-options');
        optionsContainer.innerHTML = '';

        drinks.forEach((drink, index) => {
            const button = document.createElement('button');
            button.textContent = `购买 ${drink.name} (${drink.price}金币)`;
            button.addEventListener('click', () => this.buyDrink(drink));
            optionsContainer.appendChild(button);
        });

        const backButton = document.createElement('button');
        backButton.textContent = "返回";
        backButton.addEventListener('click', () => this.closeDialogue());
        optionsContainer.appendChild(backButton);
    }

    // 购买酒水
    buyDrink(drink) {
        if (game.player.gold < drink.price) {
            game.showNotification('金币不足！', 'error');
            audioSystem.playSound('error');
            return;
        }

        game.player.gold -= drink.price;
        audioSystem.playSound('gold');

        // 应用效果
        if (drink.name.includes("生命")) {
            const healAmount = drink.name === "龙血酒" ? 50 : (drink.name === "蜂蜜酒" ? 20 : 10);
            game.player.hp = Math.min(game.player.maxHp, game.player.hp + healAmount);
            game.showNotification(`恢复了${healAmount}点生命！`, 'success');
        } else if (drink.name.includes("魔法")) {
            game.player.mp = Math.min(game.player.maxMp, game.player.mp + 30);
            game.showNotification('恢复了30点魔法！', 'success');
        }

        if (drink.name === "龙血酒") {
            game.player.atk += 5;
            game.showNotification('攻击力提升5点！', 'success');
        }

        game.updateUI();
    }

    // 显示任务板
    showQuestBoard() {
        audioSystem.playSound('click');
        this.showQuestList();
    }

    // 显示任务列表
    showQuestList() {
        const quests = Object.values(GameData.quests);
        
        let message = "可接取的任务：\n\n";
        quests.forEach(quest => {
            message += `${quest.name}\n  ${quest.description}\n  奖励：${quest.reward.exp}经验 ${quest.reward.gold}金币\n\n`;
        });

        document.getElementById('dialogue-text').textContent = message;
        document.getElementById('speaker-name').textContent = "任务板";

        const optionsContainer = document.getElementById('dialogue-options');
        optionsContainer.innerHTML = '';

        quests.forEach(quest => {
            const button = document.createElement('button');
            button.textContent = `接取：${quest.name}`;
            button.addEventListener('click', () => this.acceptQuest(quest));
            optionsContainer.appendChild(button);
        });

        const backButton = document.createElement('button');
        backButton.textContent = "返回";
        backButton.addEventListener('click', () => this.closeDialogue());
        optionsContainer.appendChild(backButton);
    }

    // 接受任务
    acceptQuest(quest) {
        if (game.player.quests.find(q => q.id === quest.id)) {
            game.showNotification('你已经接取了这个任务！', 'warning');
            return;
        }

        game.player.quests.push({
            id: quest.id,
            progress: 0,
            completed: false
        });

        game.showNotification(`接取任务：${quest.name}`, 'success');
        audioSystem.playSound('notification');
        this.closeDialogue();
    }

    // 显示住宿
    showInn() {
        audioSystem.playSound('click');
        this.showRestOptions();
    }

    // 显示休息选项
    showRestOptions() {
        const options = [
            { name: "普通休息", price: 10, effect: "完全恢复生命和魔法" },
            { name: "舒适休息", price: 30, effect: "完全恢复并提升所有属性" },
            { name: "豪华休息", price: 100, effect: "完全恢复并学习新技能" }
        ];

        let message = "住宿选项：\n\n";
        options.forEach(opt => {
            message += `${opt.name} - ${opt.price}金币\n  ${opt.effect}\n\n`;
        });

        document.getElementById('dialogue-text').textContent = message;
        document.getElementById('speaker-name').textContent = "旅馆老板";

        const optionsContainer = document.getElementById('dialogue-options');
        optionsContainer.innerHTML = '';

        options.forEach(opt => {
            const button = document.createElement('button');
            button.textContent = `选择 ${opt.name} (${opt.price}金币)`;
            button.addEventListener('click', () => this.rest(opt));
            optionsContainer.appendChild(button);
        });

        const backButton = document.createElement('button');
        backButton.textContent = "返回";
        backButton.addEventListener('click', () => this.closeDialogue());
        optionsContainer.appendChild(backButton);
    }

    // 休息
    rest(option = { price: 0, effect: "完全恢复生命和魔法" }) {
        if (game.player.gold < option.price) {
            game.showNotification('金币不足！', 'error');
            audioSystem.playSound('error');
            return;
        }

        game.player.gold -= option.price;
        audioSystem.playSound('heal');

        // 恢复生命和魔法
        game.player.hp = game.player.maxHp;
        game.player.mp = game.player.maxMp;

        // 根据选项应用额外效果
        if (option.name === "舒适休息") {
            game.player.atk += 2;
            game.player.def += 2;
            game.player.spd += 1;
            game.showNotification('所有属性提升！', 'success');
        } else if (option.name === "豪华休息") {
            // 可以在这里添加学习新技能的逻辑
            game.showNotification('感觉精神焕发！', 'success');
        } else {
            game.showNotification('生命和魔法已完全恢复！', 'success');
        }

        game.updateUI();
        this.closeDialogue();
    }
}

// 创建全局酒馆系统实例
const tavernSystem = new TavernSystem();
