// ========== 宠物系统 ==========
// 负责宠物管理和宠物交互

class PetSystem {
    constructor() {
        this.isInitialized = false;
        this.playerPets = [];
        this.activePet = null;
        this.petData = new Map();
    }

    // 初始化宠物系统
    init() {
        this.loadPetData();
        this.loadPlayerPets();
        this.setupEventListeners();
        this.isInitialized = true;
        console.log('宠物系统初始化完成');
    }

    // 加载宠物数据
    loadPetData() {
        // 基础宠物
        this.registerPet({
            id: 'slime_blue',
            name: '蓝史莱姆',
            description: '可爱的小史莱姆，会为你恢复少量生命',
            icon: '🟦',
            type: 'healer',
            rarity: 'common',
            baseStats: {
                hp: 50,
                mp: 30,
                atk: 5,
                def: 5,
                spd: 10
            },
            skills: ['slime_heal', 'slime_bounce'],
            growthRates: {
                hp: 1.2,
                mp: 1.0,
                atk: 0.8,
                def: 1.0,
                spd: 1.2
            }
        });

        this.registerPet({
            id: 'wolf_pup',
            name: '狼崽',
            description: '幼年的狼，速度快，攻击力强',
            icon: '🐺',
            type: 'attacker',
            rarity: 'common',
            baseStats: {
                hp: 60,
                mp: 20,
                atk: 15,
                def: 5,
                spd: 15
            },
            skills: ['bite', 'howl'],
            growthRates: {
                hp: 1.1,
                mp: 0.8,
                atk: 1.3,
                def: 0.9,
                spd: 1.3
            }
        });

        this.registerPet({
            id: 'baby_dragon',
            name: '幼龙',
            description: '小型龙族，拥有强大的潜力',
            icon: '🐉',
            type: 'balanced',
            rarity: 'rare',
            baseStats: {
                hp: 80,
                mp: 50,
                atk: 12,
                def: 10,
                spd: 8
            },
            skills: ['dragon_breath', 'tail_whip'],
            growthRates: {
                hp: 1.3,
                mp: 1.2,
                atk: 1.2,
                def: 1.2,
                spd: 1.0
            }
        });

        this.registerPet({
            id: 'fairy',
            name: '精灵',
            description: '发光的小精灵，能提供强力支援',
            icon: '🧚',
            type: 'support',
            rarity: 'rare',
            baseStats: {
                hp: 40,
                mp: 80,
                atk: 8,
                def: 5,
                spd: 20
            },
            skills: ['fairy_dust', 'heal_light'],
            growthRates: {
                hp: 0.9,
                mp: 1.5,
                atk: 0.9,
                def: 0.8,
                spd: 1.4
            }
        });

        this.registerPet({
            id: 'golem_small',
            name: '小型魔像',
            description: '坚固的魔像，优秀的防御者',
            icon: '🗿',
            type: 'tank',
            rarity: 'rare',
            baseStats: {
                hp: 120,
                mp: 10,
                atk: 8,
                def: 20,
                spd: 3
            },
            skills: ['rock_throw', 'stone_skin'],
            growthRates: {
                hp: 1.5,
                mp: 0.5,
                atk: 0.8,
                def: 1.5,
                spd: 0.6
            }
        });

        this.registerPet({
            id: 'phoenix_chick',
            name: '凤雏',
            description: '幼年的凤凰，拥有重生的力量',
            icon: '🔥',
            type: 'special',
            rarity: 'epic',
            baseStats: {
                hp: 70,
                mp: 60,
                atk: 15,
                def: 8,
                spd: 12
            },
            skills: ['fire_breath', 'rebirth_ash'],
            growthRates: {
                hp: 1.2,
                mp: 1.3,
                atk: 1.3,
                def: 1.0,
                spd: 1.2
            }
        });

        this.registerPet({
            id: 'shadow_cat',
            name: '影猫',
            description: '神秘的影猫，潜行与暗杀专家',
            icon: '🐱',
            type: 'assassin',
            rarity: 'epic',
            baseStats: {
                hp: 50,
                mp: 40,
                atk: 20,
                def: 6,
                spd: 25
            },
            skills: ['shadow_strike', ' vanish'],
            growthRates: {
                hp: 1.0,
                mp: 1.1,
                atk: 1.4,
                def: 0.8,
                spd: 1.5
            }
        });

        this.registerPet({
            id: 'light_wisp',
            name: '光之精灵',
            description: '纯光构成的生物，神圣而强大',
            icon: '✨',
            type: 'holy',
            rarity: 'legendary',
            baseStats: {
                hp: 100,
                mp: 100,
                atk: 18,
                def: 15,
                spd: 15
            },
            skills: ['holy_light', 'divine_shield', 'purify'],
            growthRates: {
                hp: 1.4,
                mp: 1.4,
                atk: 1.4,
                def: 1.3,
                spd: 1.3
            }
        });
    }

    // 注册宠物
    registerPet(pet) {
        this.petData.set(pet.id, pet);
    }

    // 设置事件监听器
    setupEventListeners() {
        eventSystem.on(GameEvents.BATTLE_START, (data) => {
            if (this.activePet) {
                this.activePet.enterBattle();
            }
        });

        eventSystem.on(GameEvents.BATTLE_TURN_START, (data) => {
            if (this.activePet && !this.activePet.isDead()) {
                this.activePet.takeTurn();
            }
        });

        eventSystem.on(GameEvents.BATTLE_END, (data) => {
            if (this.activePet) {
                this.activePet.leaveBattle();
                if (data.result === 'victory') {
                    this.activePet.gainExp(20);
                }
            }
        });
    }

    // 创建宠物实例
    createPetInstance(petId) {
        const petData = this.petData.get(petId);
        if (!petData) return null;

        return {
            id: petId,
            name: petData.name,
            data: petData,
            level: 1,
            exp: 0,
            expToNext: 100,
            stats: { ...petData.baseStats },
            maxStats: { ...petData.baseStats },
            currentHp: petData.baseStats.hp,
            currentMp: petData.baseStats.mp,
            skills: [...petData.skills],
            mood: 80,
            hunger: 100,
            affection: 50,
            
            // 宠物方法
            enterBattle() {
                this.currentHp = this.stats.hp;
                this.currentMp = this.stats.mp;
            },
            
            leaveBattle() {
                // 战斗结束后的处理
            },
            
            isDead() {
                return this.currentHp <= 0;
            },
            
            takeTurn() {
                // 简单的AI：随机使用技能
                const skillId = this.skills[Math.floor(Math.random() * this.skills.length)];
                this.useSkill(skillId);
            },
            
            useSkill(skillId) {
                const skill = GameData.petSkills?.[skillId];
                if (skill) {
                    skill.effect(this, battleSystem.currentEnemy);
                    console.log(`${this.name} 使用了 ${skill.name}`);
                }
            },
            
            gainExp(amount) {
                this.exp += amount;
                if (this.exp >= this.expToNext) {
                    this.levelUp();
                }
            },
            
            levelUp() {
                this.level++;
                this.exp -= this.expToNext;
                this.expToNext = Math.floor(this.expToNext * 1.5);
                
                // 成长
                const rates = this.data.growthRates;
                this.stats.hp = Math.floor(this.stats.hp * rates.hp);
                this.stats.mp = Math.floor(this.stats.mp * rates.mp);
                this.stats.atk = Math.floor(this.stats.atk * rates.atk);
                this.stats.def = Math.floor(this.stats.def * rates.def);
                this.stats.spd = Math.floor(this.stats.spd * rates.spd);
                
                this.maxStats = { ...this.stats };
                
                game.showNotification(`${this.name} 升到了 ${this.level} 级！`, 'success');
            },
            
            heal(amount) {
                this.currentHp = Math.min(this.currentHp + amount, this.stats.hp);
            },
            
            damage(amount) {
                this.currentHp = Math.max(0, this.currentHp - amount);
            },
            
            feed(item) {
                this.hunger = Math.min(100, this.hunger + item.hungerRestore);
                this.affection = Math.min(100, this.affection + item.affectionRestore);
                game.showNotification(`${this.name} 吃得很开心！`, 'success');
            },
            
            play() {
                this.mood = Math.min(100, this.mood + 20);
                this.affection = Math.min(100, this.affection + 5);
                game.showNotification(`${this.name} 玩得很开心！`, 'success');
            },
            
            getStatus() {
                if (this.hunger < 30) return 'hungry';
                if (this.mood < 30) return 'unhappy';
                if (this.affection > 80) return 'loved';
                return 'normal';
            }
        };
    }

    // 添加宠物
    addPet(petId) {
        const petInstance = this.createPetInstance(petId);
        if (!petInstance) return false;

        this.playerPets.push(petInstance);
        this.savePlayerPets();
        
        game.showNotification(`获得了 ${petInstance.name}！`, 'success');
        return true;
    }

    // 移除宠物
    removePet(petIndex) {
        if (petIndex < 0 || petIndex >= this.playerPets.length) return false;
        
        const pet = this.playerPets[petIndex];
        if (this.activePet === pet) {
            this.activePet = null;
        }
        
        this.playerPets.splice(petIndex, 1);
        this.savePlayerPets();
        return true;
    }

    // 设置出战宠物
    setActivePet(petIndex) {
        if (petIndex < 0 || petIndex >= this.playerPets.length) return false;
        
        this.activePet = this.playerPets[petIndex];
        game.showNotification(`${this.activePet.name} 已设置为出战宠物！`, 'success');
        this.savePlayerPets();
        return true;
    }

    // 获取宠物数据
    getPetData(petId) {
        return this.petData.get(petId);
    }

    // 获取玩家宠物
    getPlayerPets() {
        return this.playerPets;
    }

    // 获取出战宠物
    getActivePet() {
        return this.activePet;
    }

    // 宠物交互：喂食
    feedPet(petIndex, item) {
        if (petIndex < 0 || petIndex >= this.playerPets.length) return false;
        
        const pet = this.playerPets[petIndex];
        pet.feed(item);
        this.savePlayerPets();
        return true;
    }

    // 宠物交互：玩耍
    playWithPet(petIndex) {
        if (petIndex < 0 || petIndex >= this.playerPets.length) return false;
        
        const pet = this.playerPets[petIndex];
        pet.play();
        this.savePlayerPets();
        return true;
    }

    // 渲染宠物列表
    renderPetList() {
        const container = document.getElementById('pet-list');
        if (!container) return;

        container.innerHTML = '';

        this.playerPets.forEach((pet, index) => {
            const petElement = document.createElement('div');
            petElement.className = 'pet-card';
            const isActive = this.activePet === pet;
            
            petElement.innerHTML = `
                <div class="pet-icon">${pet.data.icon}</div>
                <div class="pet-info">
                    <div class="pet-name">${pet.name} Lv.${pet.level}</div>
                    <div class="pet-status">${pet.getStatus()}</div>
                    <div class="pet-bars">
                        <div class="bar-container">
                            <div class="bar-fill hp" style="width: ${(pet.currentHp / pet.stats.hp) * 100}%"></div>
                        </div>
                        <div class="bar-container">
                            <div class="bar-fill mood" style="width: ${pet.mood}%"></div>
                        </div>
                    </div>
                </div>
                <div class="pet-actions">
                    <button class="btn btn-small" onclick="petSystem.feedPet(${index}, {hungerRestore: 30, affectionRestore: 5})">喂食</button>
                    <button class="btn btn-small" onclick="petSystem.playWithPet(${index})">玩耍</button>
                    ${!isActive ? `<button class="btn btn-small btn-primary" onclick="petSystem.setActivePet(${index})">出战</button>` : ''}
                </div>
            `;
            
            if (isActive) {
                petElement.classList.add('active');
            }
            
            container.appendChild(petElement);
        });
    }

    // 渲染宠物战斗UI
    renderBattleUI() {
        const container = document.getElementById('pet-battle-ui');
        if (!container || !this.activePet) {
            if (container) container.innerHTML = '';
            return;
        }

        const pet = this.activePet;
        container.innerHTML = `
            <div class="pet-battle-card">
                <div class="pet-battle-icon">${pet.data.icon}</div>
                <div class="pet-battle-info">
                    <div class="pet-battle-name">${pet.name}</div>
                    <div class="pet-battle-level">Lv.${pet.level}</div>
                    <div class="pet-battle-hp">
                        <div class="hp-bar">
                            <div class="hp-fill" style="width: ${(pet.currentHp / pet.stats.hp) * 100}%"></div>
                        </div>
                        <span class="hp-text">${pet.currentHp}/${pet.stats.hp}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // 加载玩家宠物
    loadPlayerPets() {
        const saved = localStorage.getItem('tavern_pets');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.playerPets = data.pets || [];
                if (data.activePetId) {
                    this.activePet = this.playerPets.find(p => p.id === data.activePetId);
                }
            } catch (error) {
                console.error('Failed to load pets:', error);
            }
        }
    }

    // 保存玩家宠物
    savePlayerPets() {
        const data = {
            pets: this.playerPets,
            activePetId: this.activePet ? this.activePet.id : null
        };
        localStorage.setItem('tavern_pets', JSON.stringify(data));
    }
}

// 创建全局宠物系统实例
const petSystem = new PetSystem();

export default PetSystem;
export { petSystem };
