// ========== 合成系统 ==========
// 负责物品合成和制作

class CraftingSystem {
    constructor() {
        this.isInitialized = false;
        this.recipes = new Map();
        this.unlockedRecipes = new Set();
        this.craftingLevel = 1;
        this.craftingExp = 0;
        this.craftingExpToNext = 100;
    }

    // 初始化合成系统
    init() {
        this.loadRecipes();
        this.loadPlayerProgress();
        this.isInitialized = true;
        console.log('合成系统初始化完成');
    }

    // 加载配方
    loadRecipes() {
        // 药水配方
        this.registerRecipe({
            id: 'potion_hp_small',
            name: '小生命药水',
            category: 'potion',
            level: 1,
            expReward: 10,
            materials: [
                { itemId: 'herb_green', count: 2 }
            ],
            result: {
                itemId: 'potion_hp_small',
                count: 1
            },
            description: '恢复50点生命值'
        });

        this.registerRecipe({
            id: 'potion_hp_medium',
            name: '中生命药水',
            category: 'potion',
            level: 3,
            expReward: 25,
            materials: [
                { itemId: 'herb_green', count: 3 },
                { itemId: 'herb_red', count: 1 }
            ],
            result: {
                itemId: 'potion_hp_medium',
                count: 1
            },
            description: '恢复150点生命值'
        });

        this.registerRecipe({
            id: 'potion_hp_large',
            name: '大生命药水',
            category: 'potion',
            level: 5,
            expReward: 50,
            materials: [
                { itemId: 'herb_green', count: 5 },
                { itemId: 'herb_red', count: 3 },
                { itemId: 'crystal_water', count: 1 }
            ],
            result: {
                itemId: 'potion_hp_large',
                count: 1
            },
            description: '恢复300点生命值'
        });

        this.registerRecipe({
            id: 'potion_mp_small',
            name: '小魔法药水',
            category: 'potion',
            level: 2,
            expReward: 15,
            materials: [
                { itemId: 'herb_blue', count: 2 }
            ],
            result: {
                itemId: 'potion_mp_small',
                count: 1
            },
            description: '恢复30点魔法值'
        });

        // 装备配方
        this.registerRecipe({
            id: 'sword_iron',
            name: '铁剑',
            category: 'weapon',
            level: 3,
            expReward: 40,
            materials: [
                { itemId: 'ore_iron', count: 3 },
                { itemId: 'wood_oak', count: 1 }
            ],
            result: {
                itemId: 'sword_iron',
                count: 1
            },
            description: '一把普通的铁剑，攻击力+15'
        });

        this.registerRecipe({
            id: 'sword_steel',
            name: '钢剑',
            category: 'weapon',
            level: 6,
            expReward: 80,
            materials: [
                { itemId: 'ore_iron', count: 5 },
                { itemId: 'ore_coal', count: 3 }
            ],
            result: {
                itemId: 'sword_steel',
                count: 1
            },
            description: '精钢打造的剑，攻击力+25'
        });

        this.registerRecipe({
            id: 'armor_leather',
            name: '皮甲',
            category: 'armor',
            level: 2,
            expReward: 30,
            materials: [
                { itemId: 'leather_wolf', count: 3 },
                { itemId: 'thread_basic', count: 2 }
            ],
            result: {
                itemId: 'armor_leather',
                count: 1
            },
            description: '轻便的皮甲，防御力+8'
        });

        this.registerRecipe({
            id: 'armor_chain',
            name: '链甲',
            category: 'armor',
            level: 5,
            expReward: 70,
            materials: [
                { itemId: 'ore_iron', count: 4 },
                { itemId: 'leather_wolf', count: 2 }
            ],
            result: {
                itemId: 'armor_chain',
                count: 1
            },
            description: '坚固的链甲，防御力+18'
        });

        this.registerRecipe({
            id: 'ring_health',
            name: '生命戒指',
            category: 'accessory',
            level: 4,
            expReward: 60,
            materials: [
                { itemId: 'gem_health', count: 1 },
                { itemId: 'metal_silver', count: 2 }
            ],
            result: {
                itemId: 'ring_health',
                count: 1
            },
            description: '增加20点生命上限'
        });

        this.registerRecipe({
            id: 'amulet_magic',
            name: '魔法护符',
            category: 'accessory',
            level: 5,
            expReward: 80,
            materials: [
                { itemId: 'gem_mana', count: 1 },
                { itemId: 'metal_gold', count: 1 }
            ],
            result: {
                itemId: 'amulet_magic',
                count: 1
            },
            description: '增加15点魔法上限'
        });

        // 特殊配方
        this.registerRecipe({
            id: 'scroll_fire',
            name: '火焰卷轴',
            category: 'scroll',
            level: 6,
            expReward: 100,
            materials: [
                { itemId: 'paper_magic', count: 2 },
                { itemId: 'essence_fire', count: 1 },
                { itemId: 'ink_magic', count: 1 }
            ],
            result: {
                itemId: 'scroll_fire',
                count: 1
            },
            description: '使用时释放火球术，造成150点伤害'
        });

        this.registerRecipe({
            id: 'elixir_strength',
            name: '力量药剂',
            category: 'elixir',
            level: 8,
            expReward: 150,
            materials: [
                { itemId: 'herb_golden', count: 2 },
                { itemId: 'dragon_scale_small', count: 1 }
            ],
            result: {
                itemId: 'elixir_strength',
                count: 1
            },
            description: '永久增加2点力量'
        });
    }

    // 注册配方
    registerRecipe(recipe) {
        this.recipes.set(recipe.id, recipe);
    }

    // 解锁配方
    unlockRecipe(recipeId) {
        const recipe = this.recipes.get(recipeId);
        if (!recipe || this.unlockedRecipes.has(recipeId)) return false;

        this.unlockedRecipes.add(recipeId);
        game.showNotification(`解锁配方：${recipe.name}`, 'success');
        this.saveProgress();
        return true;
    }

    // 合成物品
    craft(recipeId, count = 1) {
        const recipe = this.recipes.get(recipeId);
        if (!recipe) {
            game.showNotification('配方不存在', 'error');
            return false;
        }

        if (!this.unlockedRecipes.has(recipeId)) {
            game.showNotification('配方未解锁', 'error');
            return false;
        }

        if (this.craftingLevel < recipe.level) {
            game.showNotification(`合成等级不足，需要 ${recipe.level} 级`, 'error');
            return false;
        }

        // 检查材料
        const player = game.player;
        const missingMaterials = [];

        for (const material of recipe.materials) {
            const inInventory = this.countItem(player.inventory, material.itemId);
            const needed = material.count * count;
            
            if (inInventory < needed) {
                missingMaterials.push({
                    itemId: material.itemId,
                    needed: needed,
                    have: inInventory
                });
            }
        }

        if (missingMaterials.length > 0) {
            const materialNames = missingMaterials.map(m => {
                const itemData = GameData.items[m.itemId];
                return `${itemData?.name || m.itemId} (需要${m.needed}，拥有${m.have})`;
            }).join(', ');
            game.showNotification(`材料不足：${materialNames}`, 'error');
            return false;
        }

        // 消耗材料
        for (const material of recipe.materials) {
            this.removeItem(player.inventory, material.itemId, material.count * count);
        }

        // 添加结果
        const resultItem = recipe.result;
        for (let i = 0; i < resultItem.count * count; i++) {
            player.inventory.push({ id: resultItem.itemId });
        }

        // 获得经验
        this.gainExp(recipe.expReward * count);

        game.showNotification(`成功制作 ${count} 个 ${recipe.name}`, 'success');
        audioSystem.playSound('craft');

        // 触发事件
        eventSystem.emit(GameEvents.ITEM_CRAFTED, {
            recipe: recipe,
            count: count
        });

        return true;
    }

    // 计算背包中物品数量
    countItem(inventory, itemId) {
        return inventory.filter(item => item.id === itemId).length;
    }

    // 移除物品
    removeItem(inventory, itemId, count) {
        let removed = 0;
        for (let i = inventory.length - 1; i >= 0; i--) {
            if (inventory[i].id === itemId && removed < count) {
                inventory.splice(i, 1);
                removed++;
            }
        }
    }

    // 获得合成经验
    gainExp(amount) {
        this.craftingExp += amount;
        
        while (this.craftingExp >= this.craftingExpToNext) {
            this.craftingExp -= this.craftingExpToNext;
            this.levelUp();
        }
    }

    // 合成等级提升
    levelUp() {
        this.craftingLevel++;
        this.craftingExpToNext = Math.floor(this.craftingExpToNext * 1.5);
        
        game.showNotification(`合成等级提升到 ${this.craftingLevel} 级！`, 'success');
        audioSystem.playSound('levelUp');

        // 自动解锁新配方
        this.autoUnlockRecipes();
    }

    // 自动解锁配方
    autoUnlockRecipes() {
        for (const [id, recipe] of this.recipes) {
            if (!this.unlockedRecipes.has(id) && recipe.level <= this.craftingLevel) {
                this.unlockRecipe(id);
            }
        }
    }

    // 检查是否可以合成
    canCraft(recipeId) {
        const recipe = this.recipes.get(recipeId);
        if (!recipe) return false;
        if (!this.unlockedRecipes.has(recipeId)) return false;
        if (this.craftingLevel < recipe.level) return false;

        const player = game.player;
        for (const material of recipe.materials) {
            if (this.countItem(player.inventory, material.itemId) < material.count) {
                return false;
            }
        }

        return true;
    }

    // 获取配方
    getRecipe(recipeId) {
        return this.recipes.get(recipeId);
    }

    // 获取所有配方
    getAllRecipes(category = null) {
        let recipes = Array.from(this.recipes.values());
        
        if (category) {
            recipes = recipes.filter(r => r.category === category);
        }
        
        return recipes;
    }

    // 获取可合成的配方
    getCraftableRecipes() {
        return Array.from(this.unlockedRecipes)
            .map(id => this.recipes.get(id))
            .filter(recipe => recipe && this.canCraft(recipe.id));
    }

    // 获取已解锁的配方
    getUnlockedRecipes() {
        return Array.from(this.unlockedRecipes)
            .map(id => this.recipes.get(id))
            .filter(recipe => recipe !== undefined);
    }

    // 获取配方分类
    getCategories() {
        const categories = new Set();
        for (const recipe of this.recipes.values()) {
            categories.add(recipe.category);
        }
        return Array.from(categories);
    }

    // 渲染配方列表
    renderRecipeList(category = null, showOnlyCraftable = false) {
        const container = document.getElementById('recipe-list');
        if (!container) return;

        container.innerHTML = '';

        let recipes = this.getAllRecipes(category);
        if (showOnlyCraftable) {
            recipes = recipes.filter(r => this.canCraft(r.id));
        }

        // 按等级排序
        recipes.sort((a, b) => a.level - b.level);

        recipes.forEach(recipe => {
            const recipeElement = document.createElement('div');
            recipeElement.className = 'recipe-card';
            const isUnlocked = this.unlockedRecipes.has(recipe.id);
            const canCraft = this.canCraft(recipe.id);

            recipeElement.innerHTML = `
                <div class="recipe-info">
                    <div class="recipe-name">${recipe.name}</div>
                    <div class="recipe-level">等级: ${recipe.level}</div>
                    <div class="recipe-description">${recipe.description}</div>
                </div>
                <div class="recipe-materials">
                    ${recipe.materials.map(m => {
                        const itemData = GameData.items[m.itemId];
                        const inInventory = game.player ? 
                            this.countItem(game.player.inventory, m.itemId) : 0;
                        const enough = inInventory >= m.count;
                        return `
                            <div class="material-item ${enough ? 'enough' : 'not-enough'}">
                                <span class="material-icon">${itemData?.icon || '❓'}</span>
                                <span class="material-name">${itemData?.name || m.itemId}</span>
                                <span class="material-count">${inInventory}/${m.count}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="recipe-result">
                    <span>制作 ${recipe.result.count} 个</span>
                    <span class="exp-reward">+${recipe.expReward} EXP</span>
                </div>
                <div class="recipe-actions">
                    ${canCraft ? `
                        <button class="btn btn-primary" onclick="craftingSystem.craft('${recipe.id}')">制作</button>
                    ` : ''}
                    ${!isUnlocked ? `
                        <button class="btn" disabled>未解锁</button>
                    ` : !canCraft ? `
                        <button class="btn" disabled>材料不足</button>
                    ` : ''}
                </div>
            `;

            container.appendChild(recipeElement);
        });

        if (recipes.length === 0) {
            container.innerHTML = '<div class="empty-message">没有找到配方</div>';
        }
    }

    // 渲染合成信息面板
    renderCraftingInfo() {
        const container = document.getElementById('crafting-info');
        if (!container) return;

        container.innerHTML = `
            <div class="crafting-level">
                <div class="level-title">合成等级</div>
                <div class="level-value">${this.craftingLevel}</div>
                <div class="exp-bar">
                    <div class="exp-fill" style="width: ${(this.craftingExp / this.craftingExpToNext) * 100}%"></div>
                </div>
                <div class="exp-text">${this.craftingExp} / ${this.craftingExpToNext}</div>
            </div>
            <div class="crafting-stats">
                <div class="stat-item">
                    <span class="stat-label">已解锁配方</span>
                    <span class="stat-value">${this.unlockedRecipes.size} / ${this.recipes.size}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">可合成配方</span>
                    <span class="stat-value">${this.getCraftableRecipes().length}</span>
                </div>
            </div>
        `;
    }

    // 加载玩家进度
    loadPlayerProgress() {
        const saved = localStorage.getItem('tavern_crafting');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.unlockedRecipes = new Set(data.unlocked || []);
                this.craftingLevel = data.level || 1;
                this.craftingExp = data.exp || 0;
                this.craftingExpToNext = data.expToNext || 100;
            } catch (error) {
                console.error('Failed to load crafting progress:', error);
            }
        }

        // 自动解锁基础配方
        this.autoUnlockRecipes();
    }

    // 保存进度
    saveProgress() {
        const data = {
            unlocked: Array.from(this.unlockedRecipes),
            level: this.craftingLevel,
            exp: this.craftingExp,
            expToNext: this.craftingExpToNext
        };
        localStorage.setItem('tavern_crafting', JSON.stringify(data));
    }
}

// 创建全局合成系统实例
const craftingSystem = new CraftingSystem();

export default CraftingSystem;
export { craftingSystem };
