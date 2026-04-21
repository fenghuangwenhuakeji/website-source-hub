/**
 * 剧情系统
 * 分支剧情系统，支持选择、多结局、条件触发
 */

import { RPGCore } from './RPGameCore.js';

export default class StorySystem {
    constructor() {
        this.currentChapter = null;
        this.currentScene = null;
        this.storyProgress = new Map(); // 剧情进度
        this.decisionHistory = []; // 决策历史
        this.unlockedEndings = new Set(); // 解锁的结局
        this.activeFlags = new Set(); // 活跃的剧情标记
        this.scenes = new Map(); // 场景库
        this.chapters = new Map(); // 章节库
    }

    async initialize() {
        console.log('📖 剧情系统初始化...');
        await this.loadStoryData();
        await this.loadProgress();
    }

    /**
     * 加载剧情数据
     */
    async loadStoryData() {
        // 定义章节
        this.chapters.set('prologue', {
            id: 'prologue',
            name: '序章：冒险的开始',
            description: '你来到了艾尔特大陆，在冒险者酒馆开启了新的冒险...',
            scenes: ['intro', 'first_choice', 'meet_npc']
        });

        this.chapters.set('chapter1', {
            id: 'chapter1',
            name: '第一章：迷雾森林的秘密',
            description: '关于森林深处的传闻吸引了你的注意...',
            scenes: ['forest_entrance', 'forest_path', 'forest_camp', 'forest_boss']
        });

        this.chapters.set('chapter2', {
            id: 'chapter2',
            name: '第二章：城镇的危机',
            description: '黎明镇似乎隐藏着某种危机...',
            scenes: ['town_arrival', 'town_investigate', 'town_boss']
        });

        this.chapters.set('chapter3', {
            id: 'chapter3',
            name: '第三章：巨龙的威胁',
            description: '龙骨山脉的古老秘密即将揭开...',
            scenes: ['mountain_base', 'mountain_climb', 'dragon_lair', 'dragon_boss']
        });

        // 定义场景
        this.addScene({
            id: 'intro',
            name: '初到酒馆',
            chapter: 'prologue',
            text: `你推开酒馆厚重的木门，温暖的空气扑面而来。

酒馆里很热闹，冒险者们在低声交谈，酒保老约翰正在擦拭着酒杯。

一个声音叫住了你："嘿，新面孔！第一次来这里吗？"

老约翰微笑着向你招手："来，喝一杯暖暖身子。告诉我，你是什么职业的冒险者？"`,

            choices: [
                {
                    text: '我是战士',
                    requirements: { class: 'warrior' },
                    nextScene: 'warrior_intro',
                    effects: [{ type: 'add_flag', flag: 'warrior_path' }],
                    dialogue: '啊，战士！我们需要像你这样强壮的人。'
                },
                {
                    text: '我是法师',
                    requirements: { class: 'mage' },
                    nextScene: 'mage_intro',
                    effects: [{ type: 'add_flag', flag: 'mage_path' }],
                    dialogue: '魔法师啊，我们这里很少见到。'
                },
                {
                    text: '我是盗贼',
                    requirements: { class: 'rogue' },
                    nextScene: 'rogue_intro',
                    effects: [{ type: 'add_flag', flag: 'rogue_path' }],
                    dialogue: '盗贼吗？这地方有很多秘密。'
                },
                {
                    text: '我还没有决定',
                    nextScene: 'undecided_intro',
                    effects: [{ type: 'add_flag', flag: 'undecided_path' }]
                }
            ],
            background: 'tavern_day',
            music: 'tavern_theme'
        });

        this.addScene({
            id: 'first_choice',
            name: '第一次选择',
            chapter: 'prologue',
            text: `老约翰放下手中的酒杯，神色变得严肃。

"年轻人，我听说你对冒险很感兴趣。但我要警告你，外面的世界很危险。"

他指着墙上的任务板，上面贴着各种委托。

"你打算从哪里开始？"`,

            choices: [
                {
                    text: '查看任务板',
                    nextScene: 'quest_board_examine',
                    effects: [{ type: 'add_exp', value: 5 }]
                },
                {
                    text: '向老约翰打听消息',
                    nextScene: 'john_gossip',
                    effects: [{ type: 'add_flag', flag: 'informed' }]
                },
                {
                    text: '直接前往迷雾森林',
                    nextScene: 'forest_direct',
                    requirements: { flags: ['warrior_path'] },
                    effects: [{ type: 'add_flag', flag: 'rushed_forest' }]
                },
                {
                    text: '先休息一下',
                    nextScene: 'rest_tavern',
                    effects: [{ type: 'restore', stat: 'hp', value: 'full' }]
                }
            ],
            background: 'tavern_interior',
            music: 'tavern_theme'
        });

        this.addScene({
            id: 'meet_npc',
            name: '神秘的陌生人',
            chapter: 'prologue',
            text: `在酒馆的角落，你注意到一个穿着深色斗篷的人影。

那个人影似乎在观察着你，当你看向那边时，他/她又移开了视线。

"那家伙很神秘，"老约翰低声说，"已经在这里待了一周了，从来不和人说话。"

你想怎么做？`,

            choices: [
                {
                    text: '过去和他/她交谈',
                    nextScene: 'approach_stranger',
                    requirements: { stats: { charisma: 5 } },
                    effects: [{ type: 'add_flag', flag: 'met_stranger' }]
                },
                {
                    text: '暗中观察',
                    nextScene: 'observe_stranger',
                    effects: [{ type: 'add_exp', value: 3 }]
                },
                {
                    text: '不理会',
                    nextScene: 'ignore_stranger',
                    effects: [{ type: 'add_flag', flag: 'ignored_stranger' }]
                }
            ],
            conditions: {
                flags: ['informed']
            },
            background: 'tavern_corner',
            music: 'mystery_theme'
        });

        // 森林场景
        this.addScene({
            id: 'forest_entrance',
            name: '迷雾森林入口',
            chapter: 'chapter1',
            text: `你站在迷雾森林的入口，浓密的雾气遮蔽了视线。

森林里传来奇怪的声音，偶尔有光芒在雾中闪现。

一张警告牌立在路边："危险！未经训练的冒险者禁止入内！"

你握紧了武器，准备进入森林。`,

            choices: [
                {
                    text: '小心前进',
                    nextScene: 'forest_path_cautious',
                    effects: [{ type: 'add_flag', flag: 'cautious_approach' }]
                },
                {
                    text: '快速冲进去',
                    nextScene: 'forest_path_rush',
                    effects: [{ type: 'add_flag', flag: 'rushed_approach' }]
                },
                {
                    text: '先寻找其他冒险者',
                    nextScene: 'forest_find_others',
                    effects: [{ type: 'add_flag', flag: 'seek_companions' }]
                }
            ],
            background: 'forest_entrance',
            music: 'forest_theme'
        });

        this.addScene({
            id: 'forest_boss',
            name: '森林精灵的试炼',
            chapter: 'chapter1',
            text: `在森林的深处，你发现了一片被月光照亮的空地。

一个美丽的森林精灵站在那里，她似乎在等待你。

"凡人，"她开口说道，声音如银铃般清脆，"你通过了森林的考验。但我必须确定你是否值得信任。"

她举起法杖："接受我的试炼吧！"`,

            choices: [
                {
                    text: '接受试炼',
                    nextScene: 'forest_battle',
                    type: 'combat',
                    enemies: ['forest_spirit'],
                    effects: [{ type: 'add_flag', flag: 'accepted_trial' }]
                },
                {
                    text: '试图说服她',
                    nextScene: 'forest_persuade',
                    requirements: { stats: { charisma: 10 } },
                    effects: [{ type: 'add_flag', flag: 'persuaded' }]
                },
                {
                    text: '逃离',
                    nextScene: 'forest_flee',
                    effects: [{ type: 'add_flag', flag: 'fled_trial' }]
                }
            ],
            conditions: {
                flags: ['cautious_approach']
            },
            background: 'forest_clearing',
            music: 'boss_theme'
        });

        // 剧情分支结局
        this.addScene({
            id: 'ending_hero',
            name: '英雄结局',
            type: 'ending',
            text: `你击败了上古巨龙，拯救了艾尔特大陆！

王国为你举行了盛大的庆祝仪式，你的名字被载入史册。

酒馆里的每一个人都在传颂你的传奇。

"这就是冒险者酒馆的真正意义，"老约翰举起酒杯，"成为真正的英雄！"

【英雄结局达成】`,
            effects: [
                { type: 'unlock_ending', ending: 'hero' },
                { type: 'add_gold', value: 5000 },
                { type: 'add_title', title: '龙之勇者' }
            ],
            background: 'victory',
            music: 'victory_theme'
        });

        this.addScene({
            id: 'ending_ruler',
            name: '统治者结局',
            type: 'ending',
            text: `你获得了巨龙的力量，决定建立自己的帝国。

人们开始畏惧你，但更多的是敬佩。

酒馆成为你的秘密基地，所有的冒险者都为你服务。

【统治者结局达成】`,
            requirements: {
                flags: ['chose_power']
            },
            effects: [
                { type: 'unlock_ending', ending: 'ruler' },
                { type: 'add_title', title: '暴君' }
            ],
            background: 'dark_throne',
            music: 'dark_theme'
        });

        this.addScene({
            id: 'ending_peacemaker',
            name: '和平使者结局',
            type: 'ending',
            text: `你与巨龙达成了协议，建立了人类与龙族的和平。

这片土地迎来了前所未有的繁荣。

酒馆里每天都在传颂和平的美好。

【和平使者结局达成】`,
            requirements: {
                flags: ['persuaded_dragon']
            },
            effects: [
                { type: 'unlock_ending', ending: 'peacemaker' },
                { type: 'add_title', title: '和平使徒' }
            ],
            background: 'peaceful_land',
            music: 'peaceful_theme'
        });

        // 添加更多场景...
    }

    /**
     * 添加场景
     */
    addScene(scene) {
        this.scenes.set(scene.id, scene);
    }

    /**
     * 获取场景
     */
    getScene(sceneId) {
        return this.scenes.get(sceneId);
    }

    /**
     * 开始新剧情
     */
    startStory(chapterId) {
        const chapter = this.chapters.get(chapterId);
        if (!chapter) {
            return { success: false, error: '章节不存在' };
        }

        this.currentChapter = chapter;
        const firstSceneId = chapter.scenes[0];
        const firstScene = this.scenes.get(firstSceneId);

        if (!firstScene) {
            return { success: false, error: '章节中没有场景' };
        }

        this.currentScene = firstScene;
        this.saveProgress();

        return {
            success: true,
            chapter,
            scene: firstScene
        };
    }

    /**
     * 加载进度
     */
    async loadProgress() {
        try {
            const saved = localStorage.getItem('rpg_story_progress');
            if (saved) {
                const data = JSON.parse(saved);
                this.storyProgress = new Map(data.storyProgress || []);
                this.decisionHistory = data.decisionHistory || [];
                this.unlockedEndings = new Set(data.unlockedEndings || []);
                this.activeFlags = new Set(data.activeFlags || []);

                if (data.currentChapter && data.currentScene) {
                    this.currentChapter = this.chapters.get(data.currentChapter);
                    this.currentScene = this.scenes.get(data.currentScene);
                }
            }
        } catch (e) {
            console.error('加载剧情进度失败:', e);
        }
    }

    /**
     * 保存进度
     */
    saveProgress() {
        try {
            const data = {
                storyProgress: Array.from(this.storyProgress.entries()),
                decisionHistory: this.decisionHistory,
                unlockedEndings: Array.from(this.unlockedEndings),
                activeFlags: Array.from(this.activeFlags),
                currentChapter: this.currentChapter?.id,
                currentScene: this.currentScene?.id
            };
            localStorage.setItem('rpg_story_progress', JSON.stringify(data));
        } catch (e) {
            console.error('保存剧情进度失败:', e);
        }
    }

    /**
     * 选择剧情选项
     */
    selectChoice(choiceIndex) {
        if (!this.currentScene) {
            return { success: false, error: '当前没有场景' };
        }

        const choice = this.currentScene.choices[choiceIndex];
        if (!choice) {
            return { success: false, error: '选项不存在' };
        }

        // 检查条件
        if (choice.requirements) {
            const canSelect = this.checkRequirements(choice.requirements);
            if (!canSelect) {
                return { success: false, error: '不满足选择条件' };
            }
        }

        // 记录决策
        this.decisionHistory.push({
            sceneId: this.currentScene.id,
            choiceIndex,
            choice: choice.text,
            timestamp: Date.now()
        });

        // 应用效果
        const effects = this.applyEffects(choice.effects || []);

        // 检查是否是结局
        if (choice.type === 'ending' || (this.currentScene.type === 'ending')) {
            return this.triggerEnding(choice.nextScene || this.currentScene.id);
        }

        // 切换到下一个场景
        if (choice.nextScene) {
            const nextScene = this.scenes.get(choice.nextScene);
            if (nextScene) {
                // 检查场景条件
                if (nextScene.conditions && !this.checkRequirements(nextScene.conditions)) {
                    // 条件不满足，跳过这个场景
                    return this.selectNextAvailableScene(nextScene);
                }

                this.currentScene = nextScene;

                // 检查是否切换到下一章
                if (nextScene.chapter !== this.currentChapter?.id) {
                    this.currentChapter = this.chapters.get(nextScene.chapter);
                }

                this.saveProgress();

                return {
                    success: true,
                    scene: nextScene,
                    effects,
                    dialogue: choice.dialogue
                };
            }
        }

        // 没有下一个场景，返回当前场景
        this.saveProgress();

        return {
            success: true,
            scene: this.currentScene,
            effects,
            dialogue: choice.dialogue,
            ended: true
        };
    }

    /**
     * 检查要求
     */
    checkRequirements(requirements) {
        if (!requirements) return true;

        // 检查职业要求
        if (requirements.class) {
            // 这里需要从角色系统获取玩家职业
            // const player = RPGCore.getSystem('character').getPlayer();
            // if (player.class !== requirements.class) return false;
        }

        // 检查属性要求
        if (requirements.stats) {
            // const stats = RPGCore.getSystem('character').getStats();
            // for (const [stat, value] of Object.entries(requirements.stats)) {
            //     if (stats[stat] < value) return false;
            // }
        }

        // 检查标记要求
        if (requirements.flags) {
            for (const flag of requirements.flags) {
                if (!this.activeFlags.has(flag)) return false;
            }
        }

        return true;
    }

    /**
     * 应用效果
     */
    applyEffects(effects) {
        const results = [];

        for (const effect of effects) {
            switch (effect.type) {
                case 'add_flag':
                    this.activeFlags.add(effect.flag);
                    results.push({ type: 'flag', value: effect.flag });
                    break;
                case 'remove_flag':
                    this.activeFlags.delete(effect.flag);
                    results.push({ type: 'flag_removed', value: effect.flag });
                    break;
                case 'add_exp':
                    // 这里需要调用角色系统
                    // RPGCore.getSystem('character').addExp(effect.value);
                    results.push({ type: 'exp', value: effect.value });
                    break;
                case 'add_gold':
                    // RPGCore.getSystem('character').addGold(effect.value);
                    results.push({ type: 'gold', value: effect.value });
                    break;
                case 'add_item':
                    // RPGCore.getSystem('inventory').addItem(effect.id);
                    results.push({ type: 'item', value: effect.id });
                    break;
                case 'unlock_ending':
                    this.unlockedEndings.add(effect.ending);
                    results.push({ type: 'ending', value: effect.ending });
                    break;
                case 'add_title':
                    // RPGCore.getSystem('character').addTitle(effect.title);
                    results.push({ type: 'title', value: effect.title });
                    break;
                default:
                    results.push({ type: 'unknown', effect });
            }
        }

        return results;
    }

    /**
     * 触发结局
     */
    triggerEnding(endingSceneId) {
        const endingScene = this.scenes.get(endingSceneId);
        if (!endingScene) {
            return { success: false, error: '结局场景不存在' };
        }

        // 应用结局效果
        if (endingScene.effects) {
            this.applyEffects(endingScene.effects);
        }

        this.saveProgress();

        return {
            success: true,
            scene: endingScene,
            ended: true,
            isEnding: true
        };
    }

    /**
     * 获取可用选项
     */
    getAvailableChoices() {
        if (!this.currentScene) return [];

        return this.currentScene.choices.filter((choice, index) => {
            if (!choice.requirements) return true;
            return this.checkRequirements(choice.requirements);
        }).map((choice, originalIndex) => ({
            ...choice,
            originalIndex: this.currentScene.choices.indexOf(choice)
        }));
    }

    /**
     * 添加自定义场景
     */
    addCustomScene(scene) {
        this.scenes.set(scene.id, scene);
        return { success: true, scene };
    }

    /**
     * 添加自定义章节
     */
    addCustomChapter(chapter) {
        this.chapters.set(chapter.id, chapter);
        return { success: true, chapter };
    }

    /**
     * 获取所有章节
     */
    getAllChapters() {
        return Array.from(this.chapters.values());
    }

    /**
     * 获取所有结局
     */
    getAllEndings() {
        return Array.from(this.scenes.values())
            .filter(scene => scene.type === 'ending')
            .map(scene => ({
                id: scene.id,
                name: scene.name,
                unlocked: this.unlockedEndings.has(scene.id)
            }));
    }

    /**
     * 检查触发条件
     */
    checkTriggers() {
        const triggers = [];

        // 检查是否有新场景可以触发
        for (const scene of this.scenes.values()) {
            if (scene.conditions && scene.autoTrigger) {
                if (this.checkRequirements(scene.conditions)) {
                    if (!this.activeFlags.has(`triggered_${scene.id}`)) {
                        triggers.push({
                            type: 'scene',
                            sceneId: scene.id,
                            sceneName: scene.name
                        });
                        this.activeFlags.add(`triggered_${scene.id}`);
                    }
                }
            }
        }

        return triggers;
    }

    /**
     * 导出剧情数据
     */
    exportStoryData() {
        return {
            chapters: Array.from(this.chapters.values()),
            scenes: Array.from(this.scenes.values())
        };
    }

    /**
     * 导入剧情数据
     */
    importStoryData(data) {
        if (data.chapters) {
            data.chapters.forEach(chapter => {
                this.chapters.set(chapter.id, chapter);
            });
        }
        if (data.scenes) {
            data.scenes.forEach(scene => {
                this.scenes.set(scene.id, scene);
            });
        }
        return { success: true };
    }

    /**
     * 保存系统数据
     */
    async save() {
        this.saveProgress();
        return {
            storyProgress: Array.from(this.storyProgress.entries()),
            decisionHistory: this.decisionHistory,
            unlockedEndings: Array.from(this.unlockedEndings),
            activeFlags: Array.from(this.activeFlags),
            currentChapter: this.currentChapter?.id,
            currentScene: this.currentScene?.id
        };
    }

    /**
     * 加载系统数据
     */
    async load(data) {
        if (data) {
            if (data.storyProgress) {
                this.storyProgress = new Map(data.storyProgress);
            }
            if (data.decisionHistory) {
                this.decisionHistory = data.decisionHistory;
            }
            if (data.unlockedEndings) {
                this.unlockedEndings = new Set(data.unlockedEndings);
            }
            if (data.activeFlags) {
                this.activeFlags = new Set(data.activeFlags);
            }
            if (data.currentChapter) {
                this.currentChapter = this.chapters.get(data.currentChapter);
            }
            if (data.currentScene) {
                this.currentScene = this.scenes.get(data.currentScene);
            }
        }
    }
}
