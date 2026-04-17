/**
 * 剧情系统
 * 管理游戏剧情、对话和分支选择
 */

export class StorySystem {
    constructor(engine) {
        this.engine = engine;
        this.isInitialized = false;
        this.stories = {};
        this.currentStory = null;
    }

    async init() {
        if (this.isInitialized) return;

        console.log('[StorySystem] 初始化剧情系统...');

        // 初始化故事数据
        this.initializeStories();

        this.isInitialized = true;
        console.log('[StorySystem] 剧情系统初始化完成');
    }

    // 初始化故事
    initializeStories() {
        this.stories = {
            'prologue': {
                title: '序幕：旅程的开始',
                text: '你从睡梦中醒来，发现自己身处一个陌生的酒馆。\n\n"欢迎来到冒险者酒馆，勇敢的旅者。"一位老者微笑着说道。\n\n"你是新来的吧？这片大陆充满了危险和机遇，只有最勇敢的人才能获得荣耀。"\n\n"你准备好了吗？冒险在等你！"',
                choices: [
                    { text: '我准备好了，开始冒险！', next: 'chapter1' },
                    { text: '我想了解更多...', next: 'intro' },
                    { text: '让我再休息一下', next: 'rest' }
                ]
            },
            'chapter1': {
                title: '第一章：第一个任务',
                text: '酒馆老板递给你一张羊皮纸。\n\n"附近森林最近出现了不少怪物，村民们都很担心。你能帮忙去看看吗？"\n\n你接过羊皮纸，看到上面画着一个骷髅头。\n\n"这听起来是个不错的开始。你想怎么做？"',
                choices: [
                    { text: '立即前往森林', next: 'forest_enter', effect: { exp: 10 } },
                    { text: '先在酒馆打听情报', next: 'gossip', effect: { gold: -5 } },
                    { text: '准备一些补给', next: 'shopping', effect: { gold: -20, hp: 20 } }
                ]
            },
            'intro': {
                title: '世界介绍',
                text: '老者为你讲述了这个世界的传说：\n\n很久以前，这片土地由众神统治。但在一场大战后，众神离开了，只留下了他们创造的各种生物。\n\n现在，人类、精灵、矮人等种族在这里生活，但也面临着魔物和魔兽的威胁。\n\n"只有像你这样的勇者，才能带来和平。"老者说道。',
                choices: [
                    { text: '我明白了，让我开始冒险！', next: 'chapter1' }
                ]
            },
            'forest_enter': {
                title: '进入森林',
                text: '你离开了酒馆，踏入了迷雾森林。\n\n森林里静悄悄的，只有偶尔传来的鸟鸣声。\n\n突然，你听到了前方的草丛中传来了沙沙声...',
                choices: [
                    { text: '小心靠近查看', next: 'encounter_slime', effect: { exp: 5 } },
                    { text: '拔剑准备战斗', next: 'encounter_slime' },
                    { text: '绕道而行', next: 'forest_path', effect: { exp: 2 } }
                ]
            },
            'encounter_slime': {
                title: '遭遇史莱姆',
                text: '一只可爱的史莱姆从草丛中跳了出来！\n\n它瞪着你，似乎并不想攻击。\n\n但你也知道，史莱姆一旦发起攻击也是危险的。',
                choices: [
                    { text: '发动攻击', next: 'combat_slime', effect: { exp: 20, gold: 10 } },
                    { text: '尝试沟通', next: 'slime_friend', effect: { exp: 15 } },
                    { text: '慢慢后退', next: 'forest_path' }
                ]
            },
            'combat_slime': {
                title: '战斗',
                text: '你发动了攻击，成功击败了史莱姆！\n\n从它身上掉落了一些金币。\n\n这场战斗让你感觉更强大了。',
                choices: [
                    { text: '继续前进', next: 'forest_deep' }
                ]
            },
            'slime_friend': {
                title: '史莱姆朋友',
                text: '出乎意料的是，史莱姆似乎理解了你的意思！\n\n它蹦蹦跳跳地跟在你后面，似乎想和你做朋友。\n\n虽然无法交流，但它的存在让你感到一丝温暖。',
                choices: [
                    { text: '带着它继续前进', next: 'forest_deep', effect: { companion: 'slime' } },
                    { text: '温柔地让它离开', next: 'forest_path' }
                ]
            },
            'forest_deep': {
                title: '深入森林',
                text: '你继续深入森林，发现这里越来越危险。\n\n但同时也发现了更多的宝藏和秘密。\n\n冒险，才刚刚开始...',
                choices: [
                    { text: '继续探索', next: 'end_demo' }
                ]
            },
            'gossip': {
                title: '打听情报',
                text: '你在酒馆里四处打听，花了一些金币。\n\n村民们告诉你森林深处有一个古代遗迹，据说里面藏着珍贵的宝藏。\n\n同时也警告你要小心森林中的怪物。',
                choices: [
                    { text: '了解了，去森林', next: 'forest_enter' }
                ]
            },
            'shopping': {
                title: '准备补给',
                text: '你在商店购买了食物和药品。\n\n虽然花了一些金币，但你的状态恢复了不少。\n\n现在的你准备好迎接任何挑战了！',
                choices: [
                    { text: '出发！', next: 'forest_enter' }
                ]
            },
            'forest_path': {
                title: '森林小径',
                text: '你选择了一条相对安全的路径。\n\n虽然没有遇到什么危险，但也错过了发现宝藏的机会。\n\n不过安全总是第一位的。',
                choices: [
                    { text: '继续前进', next: 'forest_deep' }
                ]
            },
            'rest': {
                title: '休息',
                text: '你决定再休息一会儿。\n\n温暖的炉火和柔软的床铺让你感到无比舒适。\n\n当你再次醒来时，感觉精神焕发。',
                choices: [
                    { text: '开始冒险', next: 'chapter1', effect: { hp: 999 } }
                ]
            },
            'end_demo': {
                title: '演示结束',
                text: '感谢游玩统一酒馆RPG！\n\n这只是游戏的开始，更多的冒险在等你。\n\n你可以继续探索、战斗、升级，体验完整的游戏内容。',
                choices: [
                    { text: '返回地图', next: null, action: 'return_map' }
                ]
            }
        };
    }

    // 开始章节
    startChapter(chapterId) {
        const story = this.stories[chapterId];
        if (!story) {
            console.warn(`[StorySystem] 章节 "${chapterId}" 不存在`);
            return;
        }

        this.currentStory = story;
        this.renderStory();
    }

    // 渲染剧情
    renderStory() {
        if (!this.currentStory) return;

        const storyContentEl = document.getElementById('story-content');
        const storyChoicesEl = document.getElementById('story-choices');

        if (storyContentEl) {
            storyContentEl.innerHTML = `
                <h3 style="color: var(--accent); margin-bottom: 15px;">${this.currentStory.title}</h3>
                <div style="white-space: pre-line; line-height: 1.8;">${this.currentStory.text}</div>
            `;
        }

        if (storyChoicesEl) {
            storyChoicesEl.innerHTML = this.currentStory.choices.map((choice, index) => `
                <div class="story-choice" onclick="storySystem.makeChoice(${index})">
                    ${choice.text}
                </div>
            `).join('');
        }

        // 切换到剧情视图
        if (window.game) {
            game.switchView('story');
        }
    }

    // 做出选择
    makeChoice(choiceIndex) {
        if (!this.currentStory || choiceIndex < 0 || choiceIndex >= this.currentStory.choices.length) {
            return;
        }

        const choice = this.currentStory.choices[choiceIndex];

        // 应用效果
        if (choice.effect && window.game && game.player) {
            if (choice.effect.exp && choice.effect.exp > 0) {
                game.player.exp += choice.effect.exp;
                game.showNotification(`获得${choice.effect.exp}经验`, 'success');
            }
            if (choice.effect.gold) {
                game.player.gold += choice.effect.gold;
                if (choice.effect.gold < 0) {
                    game.showNotification(`花费${-choice.effect.gold}金币`, 'info');
                }
            }
            if (choice.effect.hp) {
                game.player.hp = Math.min(game.player.hp + choice.effect.hp, game.player.maxHp);
            }
            if (choice.effect.companion) {
                game.showNotification(`获得了同伴: ${choice.effect.companion}`, 'success');
            }

            game.updateUI();
        }

        // 执行特殊动作
        if (choice.action) {
            if (choice.action === 'return_map') {
                game.switchView('map');
                return;
            }
        }

        // 进入下一章节
        if (choice.next) {
            this.startChapter(choice.next);
        } else {
            // 故事结束
            this.currentStory = null;
            game.switchView('map');
        }
    }

    // 获取故事列表
    getStories() {
        return this.stories;
    }
}
