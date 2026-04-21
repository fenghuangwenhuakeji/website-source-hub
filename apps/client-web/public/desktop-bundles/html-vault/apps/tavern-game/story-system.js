// ========== 剧情系统 ==========

class StorySystem {
    constructor() {
        this.currentChapter = null;
        this.currentScene = 0;
        this.storyHistory = [];
        this.isInitialized = false;
        this.isPlaying = false;
    }

    // 初始化剧情系统
    init() {
        this.isInitialized = true;
    }

    // 开始章节
    startChapter(chapterId) {
        const chapter = GameData.storyChapters.find(ch => ch.id === chapterId);
        if (!chapter) {
            console.error('未找到章节:', chapterId);
            return;
        }

        this.currentChapter = chapter;
        this.currentScene = 0;
        this.isPlaying = true;

        this.playScene();
    }

    // 播放场景
    playScene() {
        if (!this.currentChapter || !this.isPlaying) return;

        const scene = this.currentChapter.scenes[this.currentScene];
        if (!scene) {
            this.endChapter();
            return;
        }

        // 更新背景
        this.updateBackground(scene.background);

        // 更新角色
        this.updateCharacters(scene.characters);

        // 更新对话
        this.updateDialogue(scene);

        // 添加到历史记录
        this.storyHistory.push({
            chapter: this.currentChapter.id,
            scene: this.currentScene,
            timestamp: Date.now()
        });
    }

    // 更新背景
    updateBackground(backgroundId) {
        const bgElement = document.getElementById('story-background');
        if (!bgElement) return;

        // 根据背景ID设置样式
        const backgrounds = {
            village: 'linear-gradient(135deg, #a8e6cf, #dcedc1)',
            tavern: 'linear-gradient(135deg, #1a1a2e, #16213e)',
            forest: 'linear-gradient(135deg, #2d5016, #1a3009)',
            cave: 'linear-gradient(135deg, #2d3436, #636e72)',
            mountain: 'linear-gradient(135deg, #636e72, #b2bec3)'
        };

        bgElement.style.background = backgrounds[backgroundId] || backgrounds.village;
    }

    // 更新角色
    updateCharacters(characters) {
        const charactersElement = document.getElementById('story-characters');
        if (!charactersElement) return;

        charactersElement.innerHTML = '';

        characters.forEach(charId => {
            const charElement = document.createElement('div');
            charElement.className = 'story-character';
            
            if (charId === 'player') {
                charElement.textContent = '🧙';
            } else {
                const npc = GameData.ncs && GameData.npcs[charId];
                charElement.textContent = npc ? npc.icon : '👤';
            }

            charactersElement.appendChild(charElement);
        });
    }

    // 更新对话
    updateDialogue(scene) {
        document.getElementById('story-speaker').textContent = scene.speaker;
        document.getElementById('story-text').textContent = scene.text;

        // 生成选项
        const choicesContainer = document.getElementById('story-choices');
        choicesContainer.innerHTML = '';

        scene.choices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.textContent = choice.text;
            button.addEventListener('click', () => this.handleChoice(choice));
            choicesContainer.appendChild(button);
        });

        audioSystem.playSound('click');
    }

    // 处理选项
    handleChoice(choice) {
        // 执行选项效果
        if (choice.effect) {
            this.executeEffect(choice.effect);
        }

        // 检查是否结束章节
        if (choice.end) {
            this.endChapter();
            return;
        }

        // 跳转到指定场景
        if (choice.next !== undefined) {
            this.currentScene = choice.next;
            this.playScene();
        }
    }

    // 执行效果
    executeEffect(effect) {
        const effects = {
            get_free_drink: () => {
                game.showNotification('获得免费的一杯酒！', 'success');
            },
            add_gold: () => {
                const amount = 50;
                game.player.gold += amount;
                game.showNotification(`获得 ${amount} 金币！`, 'success');
                game.updateUI();
            },
            add_exp: () => {
                const amount = 100;
                game.player.exp += amount;
                game.showNotification(`获得 ${amount} 经验！`, 'success');
                game.checkLevelUp();
                game.updateUI();
            },
            learn_skill: () => {
                // 学习技能逻辑
                game.showNotification('学会新技能！', 'success');
            }
        };

        if (effects[effect]) {
            effects[effect]();
        }
    }

    // 下一场景
    nextScene() {
        this.currentScene++;
        this.playScene();
    }

    // 结束章节
    endChapter() {
        this.isPlaying = false;
        game.showNotification(`章节 "${this.currentChapter.name}" 完成！`, 'success');
        
        setTimeout(() => {
            game.switchView('map');
        }, 2000);
    }

    // 跳过剧情
    skip() {
        if (confirm('确定要跳过当前剧情吗？')) {
            this.endChapter();
        }
    }

    // 自动播放
    autoPlay() {
        // 实现自动播放逻辑
        this.isPlaying = true;
        setInterval(() => {
            if (this.isPlaying) {
                const scene = this.currentChapter?.scenes[this.currentScene];
                if (scene && scene.choices.length === 1) {
                    this.handleChoice(scene.choices[0]);
                }
            }
        }, 3000);
    }
}

// 创建全局剧情系统实例
const storySystem = new StorySystem();
