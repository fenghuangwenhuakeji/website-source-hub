// ========== 游戏数据配置 ==========

const GameData = {
    // 职业
    classes: {
        warrior: {
            name: "战士",
            icon: "⚔️",
            description: "近战专家，擅长使用各种武器",
            bonuses: {
                hp: 50,
                mp: 0,
                atk: 10,
                def: 8,
                spd: 0,
                crit: 0
            },
            skills: ["slash", "shield_bash", "battle_cry"],
            equipment: ["sword", "shield", "armor"]
        },
        mage: {
            name: "法师",
            icon: "🔮",
            description: "魔法大师，掌控元素之力",
            bonuses: {
                hp: 0,
                mp: 50,
                atk: 0,
                def: 0,
                spd: 5,
                crit: 5
            },
            skills: ["fireball", "ice_shard", "lightning"],
            equipment: ["staff", "robe", "amulet"]
        },
        rogue: {
            name: "盗贼",
            icon: "🗡️",
            description: "暗影行者，擅长快速攻击和潜行",
            bonuses: {
                hp: 20,
                mp: 10,
                atk: 15,
                def: 2,
                spd: 15,
                crit: 15
            },
            skills: ["backstab", "poison", "stealth"],
            equipment: ["dagger", "cloak", "boots"]
        },
        priest: {
            name: "牧师",
            icon: "✨",
            description: "神圣使者，擅长治疗和支援",
            bonuses: {
                hp: 30,
                mp: 40,
                atk: 0,
                def: 5,
                spd: 0,
                crit: 0
            },
            skills: ["heal", "bless", "smite"],
            equipment: ["mace", "holy_book", "robe"]
        },
        archer: {
            name: "弓箭手",
            icon: "🏹",
            description: "远程专家，精准打击",
            bonuses: {
                hp: 10,
                mp: 20,
                atk: 12,
                def: 3,
                spd: 10,
                crit: 10
            },
            skills: ["aimed_shot", "rain_arrows", "trap"],
            equipment: ["bow", "quiver", "light_armor"]
        }
    },

    // 技能
    skills: {
        // 战士技能
        slash: {
            name: "斩击",
            icon: "⚔️",
            type: "attack",
            description: "强力的一击，造成150%攻击力的伤害",
            cost: 10,
            cooldown: 0,
            effect: (user, target) => {
                const damage = Math.floor(user.atk * 1.5);
                target.hp -= damage;
                return { type: "damage", value: damage, message: `${user.name}使用斩击！造成${damage}点伤害！` };
            }
        },
        shield_bash: {
            name: "盾击",
            icon: "🛡️",
            type: "attack",
            description: "用盾牌攻击，造成伤害并眩晕敌人",
            cost: 15,
            cooldown: 2,
            effect: (user, target) => {
                const damage = Math.floor(user.def * 1.5);
                target.hp -= damage;
                target.stunned = true;
                return { type: "damage", value: damage, message: `${user.name}使用盾击！造成${damage}点伤害并眩晕敌人！` };
            }
        },
        battle_cry: {
            name: "战吼",
            icon: "📢",
            type: "buff",
            description: "提升攻击力和防御力",
            cost: 20,
            cooldown: 3,
            effect: (user, target) => {
                user.atk += 5;
                user.def += 3;
                return { type: "buff", message: `${user.name}发出战吼！攻击力和防御力提升！` };
            }
        },

        // 法师技能
        fireball: {
            name: "火球术",
            icon: "🔥",
            type: "magic",
            description: "发射火球，造成大量火焰伤害",
            cost: 25,
            cooldown: 0,
            effect: (user, target) => {
                const damage = Math.floor(user.mp * 0.5 + user.atk * 0.5);
                target.hp -= damage;
                return { type: "damage", value: damage, message: `${user.name}施放火球术！造成${damage}点火焰伤害！` };
            }
        },
        ice_shard: {
            name: "冰刺",
            icon: "❄️",
            type: "magic",
            description: "发射冰刺，造成伤害并降低敌人速度",
            cost: 20,
            cooldown: 1,
            effect: (user, target) => {
                const damage = Math.floor(user.mp * 0.4 + user.atk * 0.4);
                target.hp -= damage;
                target.spd = Math.max(1, target.spd - 3);
                return { type: "damage", value: damage, message: `${user.name}施放冰刺！造成${damage}点伤害并减速敌人！` };
            }
        },
        lightning: {
            name: "闪电链",
            icon: "⚡",
            type: "magic",
            description: "召唤闪电，造成持续伤害",
            cost: 30,
            cooldown: 2,
            effect: (user, target) => {
                const damage = Math.floor(user.mp * 0.6);
                target.hp -= damage;
                target.burning = true;
                return { type: "damage", value: damage, message: `${user.name}召唤闪电！造成${damage}点雷电伤害！` };
            }
        },

        // 盗贼技能
        backstab: {
            name: "背刺",
            icon: "🗡️",
            type: "attack",
            description: "从背后攻击，必定暴击",
            cost: 15,
            cooldown: 1,
            effect: (user, target) => {
                const damage = Math.floor(user.atk * 2.5);
                target.hp -= damage;
                return { type: "damage", value: damage, message: `${user.name}发动背刺！造成${damage}点暴击伤害！` };
            }
        },
        poison: {
            name: "涂毒",
            icon: "☠️",
            type: "debuff",
            description: "让武器沾毒，造成持续伤害",
            cost: 10,
            cooldown: 2,
            effect: (user, target) => {
                target.poisoned = true;
                return { type: "debuff", message: `${user.name}涂毒！敌人中毒了！` };
            }
        },
        stealth: {
            name: "潜行",
            icon: "👤",
            type: "buff",
            description: "进入潜行状态，下次攻击必定暴击",
            cost: 20,
            cooldown: 3,
            effect: (user, target) => {
                user.stealthed = true;
                user.dodge += 50;
                return { type: "buff", message: `${user.name}进入潜行！闪避率大幅提升！` };
            }
        },

        // 牧师技能
        heal: {
            name: "治疗",
            icon: "💚",
            type: "heal",
            description: "恢复生命值",
            cost: 20,
            cooldown: 0,
            effect: (user, target) => {
                const healAmount = Math.floor(user.mp * 0.5 + 30);
                target.hp = Math.min(target.maxHp, target.hp + healAmount);
                return { type: "heal", value: healAmount, message: `${user.name}施放治疗！恢复${healAmount}点生命！` };
            }
        },
        bless: {
            name: "祝福",
            icon: "✨",
            type: "buff",
            description: "祝福队友，提升所有属性",
            cost: 25,
            cooldown: 2,
            effect: (user, target) => {
                target.atk += 3;
                target.def += 3;
                target.spd += 2;
                return { type: "buff", message: `${user.name}施放祝福！所有属性提升！` };
            }
        },
        smite: {
            name: "神圣打击",
            icon: "💫",
            type: "magic",
            description: "神圣之力打击邪恶",
            cost: 30,
            cooldown: 1,
            effect: (user, target) => {
                const damage = Math.floor(user.mp * 0.4 + user.atk * 0.6);
                target.hp -= damage;
                return { type: "damage", value: damage, message: `${user.name}施放神圣打击！造成${damage}点神圣伤害！` };
            }
        },

        // 弓箭手技能
        aimed_shot: {
            name: "瞄准射击",
            icon: "🎯",
            type: "attack",
            description: "精确瞄准，必定命中",
            cost: 15,
            cooldown: 0,
            effect: (user, target) => {
                const damage = Math.floor(user.atk * 2);
                target.hp -= damage;
                return { type: "damage", value: damage, message: `${user.name}瞄准射击！造成${damage}点伤害！` };
            }
        },
        rain_arrows: {
            name: "箭雨",
            icon: "🏹",
            type: "attack",
            description: "发射多支箭矢，造成多次伤害",
            cost: 25,
            cooldown: 2,
            effect: (user, target) => {
                const damage = Math.floor(user.atk * 0.6 * 3);
                target.hp -= damage;
                return { type: "damage", value: damage, message: `${user.name}施放箭雨！造成${damage}点伤害！` };
            }
        },
        trap: {
            name: "陷阱",
            icon: "⚠️",
            type: "debuff",
            description: "设置陷阱，下次敌人行动会触发",
            cost: 20,
            cooldown: 3,
            effect: (user, target) => {
                target.trapped = true;
                return { type: "debuff", message: `${user.name}设置陷阱！` };
            }
        }
    },

    // 卡牌
    cards: {
        // 攻击卡牌
        slash_card: {
            id: "slash_card",
            name: "斩击卡",
            icon: "⚔️",
            type: "attack",
            rarity: "common",
            description: "造成100%攻击力的伤害",
            cost: 1,
            effect: (user, target) => {
                const damage = user.atk;
                target.hp -= damage;
                return { type: "damage", value: damage };
            }
        },
        heavy_strike: {
            id: "heavy_strike",
            name: "重击",
            icon: "💥",
            type: "attack",
            rarity: "rare",
            description: "造成200%攻击力的伤害，消耗2点能量",
            cost: 2,
            effect: (user, target) => {
                const damage = user.atk * 2;
                target.hp -= damage;
                return { type: "damage", value: damage };
            }
        },
        double_strike: {
            id: "double_strike",
            name: "双重打击",
            icon: "⚡",
            type: "attack",
            rarity: "epic",
            description: "连续攻击两次，每次造成80%攻击力伤害",
            cost: 2,
            effect: (user, target) => {
                const damage = user.atk * 0.8 * 2;
                target.hp -= damage;
                return { type: "damage", value: damage };
            }
        },

        // 防御卡牌
        defend: {
            id: "defend",
            name: "防御",
            icon: "🛡️",
            type: "defense",
            rarity: "common",
            description: "获得5点护甲",
            cost: 1,
            effect: (user) => {
                user.armor = (user.armor || 0) + 5;
                return { type: "buff", value: 5 };
            }
        },
        iron_will: {
            id: "iron_will",
            name: "钢铁意志",
            icon: "💪",
            type: "defense",
            rarity: "rare",
            description: "获得10点护甲并回5点生命",
            cost: 2,
            effect: (user) => {
                user.armor = (user.armor || 0) + 10;
                user.hp = Math.min(user.maxHp, user.hp + 5);
                return { type: "buff", value: 10 };
            }
        },

        // 魔法卡牌
        fireball_card: {
            id: "fireball_card",
            name: "火球",
            icon: "🔥",
            type: "magic",
            rarity: "common",
            description: "造成15点火焰伤害",
            cost: 1,
            effect: (user, target) => {
                const damage = 15;
                target.hp -= damage;
                return { type: "damage", value: damage };
            }
        },
        ice_blast: {
            id: "ice_blast",
            name: "冰爆",
            icon: "❄️",
            type: "magic",
            rarity: "rare",
            description: "造成20点冰霜伤害并降低敌人攻击",
            cost: 2,
            effect: (user, target) => {
                const damage = 20;
                target.hp -= damage;
                target.atk -= 2;
                return { type: "damage", value: damage };
            }
        },

        // 辅助卡牌
        heal_card: {
            id: "heal_card",
            name: "治疗",
            icon: "💚",
            type: "support",
            rarity: "common",
            description: "恢复10点生命",
            cost: 1,
            effect: (user) => {
                const heal = 10;
                user.hp = Math.min(user.maxHp, user.hp + heal);
                return { type: "heal", value: heal };
            }
        },
        energy_boost: {
            id: "energy_boost",
            name: "能量提升",
            icon: "⚡",
            type: "support",
            rarity: "rare",
            description: "获得2点额外能量",
            cost: 0,
            effect: (user) => {
                user.energy = (user.energy || 0) + 2;
                return { type: "buff", value: 2 };
            }
        }
    },

    // 怪物
    monsters: {
        slime: {
            name: "史莱姆",
            icon: "🟢",
            level: 1,
            hp: 50,
            atk: 8,
            def: 2,
            spd: 5,
            exp: 20,
            gold: 10,
            skills: ["tackle"],
            drops: ["slime_gel"]
        },
        goblin: {
            name: "哥布林",
            icon: "👺",
            level: 2,
            hp: 60,
            atk: 12,
            def: 3,
            spd: 8,
            exp: 30,
            gold: 15,
            skills: ["stab", "throw_rock"],
            drops: ["goblin_ear", "rusty_dagger"]
        },
        skeleton: {
            name: "骷髅",
            icon: "💀",
            level: 3,
            hp: 80,
            atk: 15,
            def: 5,
            spd: 6,
            exp: 40,
            gold: 20,
            skills: ["bone_strike", "summon"],
            drops: ["bone", "broken_armor"]
        },
        wolf: {
            name: "狼",
            icon: "🐺",
            level: 4,
            hp: 70,
            atk: 18,
            def: 4,
            spd: 12,
            exp: 50,
            gold: 25,
            skills: ["bite", "howl"],
            drops: ["wolf_fang", "wolf_pelt"]
        },
        orc: {
            name: "兽人",
            icon: "👹",
            level: 5,
            hp: 120,
            atk: 22,
            def: 8,
            spd: 6,
            exp: 70,
            gold: 35,
            skills: ["smash", "rage"],
            drops: ["orc_tusk", "heavy_axe"]
        },
        dragon: {
            name: "幼龙",
            icon: "🐉",
            level: 10,
            hp: 300,
            atk: 40,
            def: 15,
            spd: 10,
            exp: 200,
            gold: 100,
            skills: ["dragon_breath", "tail_slash", "fly"],
            drops: ["dragon_scale", "dragon_heart"]
        }
    },

    // 怪物技能
    monsterSkills: {
        tackle: {
            name: "冲撞",
            damage: 10
        },
        stab: {
            name: "刺击",
            damage: 15
        },
        throw_rock: {
            name: "投石",
            damage: 12
        },
        bone_strike: {
            name: "骨击",
            damage: 18
        },
        summon: {
            name: "召唤",
            effect: "summon_minion"
        },
        bite: {
            name: "撕咬",
            damage: 20
        },
        howl: {
            name: "咆哮",
            effect: "buff_atk"
        },
        smash: {
            name: "重击",
            damage: 25
        },
        rage: {
            name: "狂暴",
            effect: "rage"
        },
        dragon_breath: {
            name: "龙息",
            damage: 35
        },
        tail_slash: {
            name: "尾扫",
            damage: 30
        },
        fly: {
            name: "飞行",
            effect: "evade"
        }
    },

    // 物品
    items: {
        // 消耗品
        health_potion: {
            id: "health_potion",
            name: "生命药水",
            icon: "🧪",
            type: "consumable",
            description: "恢复50点生命",
            effect: (user) => {
                user.hp = Math.min(user.maxHp, user.hp + 50);
                return "恢复了50点生命";
            }
        },
        mana_potion: {
            id: "mana_potion",
            name: "魔法药水",
            icon: "💧",
            type: "consumable",
            description: "恢复30点魔法",
            effect: (user) => {
                user.mp = Math.min(user.maxMp, user.mp + 30);
                return "恢复了30点魔法";
            }
        },

        // 装备
        iron_sword: {
            id: "iron_sword",
            name: "铁剑",
            icon: "⚔️",
            type: "weapon",
            slot: "main_hand",
            description: "攻击力+10",
            stats: { atk: 10 }
        },
        steel_sword: {
            id: "steel_sword",
            name: "钢剑",
            icon: "🗡️",
            type: "weapon",
            slot: "main_hand",
            description: "攻击力+20",
            stats: { atk: 20 }
        },
        wooden_shield: {
            id: "wooden_shield",
            name: "木盾",
            icon: "🛡️",
            type: "armor",
            slot: "off_hand",
            description: "防御力+5",
            stats: { def: 5 }
        },
        iron_shield: {
            id: "iron_shield",
            name: "铁盾",
            icon: "🛡️",
            type: "armor",
            slot: "off_hand",
            description: "防御力+10",
            stats: { def: 10 }
        },
        leather_armor: {
            id: "leather_armor",
            name: "皮甲",
            icon: "🥋",
            type: "armor",
            slot: "body",
            description: "防御力+8，生命值+20",
            stats: { def: 8, hp: 20 }
        },
        chain_mail: {
            id: "chain_mail",
            name: "链甲",
            icon: "🦺",
            type: "armor",
            slot: "body",
            description: "防御力+15，生命值+40",
            stats: { def: 15, hp: 40 }
        }
    },

    // 地图位置
    locations: {
        tavern: {
            name: "传奇酒馆",
            icon: "🏰",
            x: 400,
            y: 300,
            description: "冒险者的聚集地",
            actions: ["rest", "shop", "quests", "talk"]
        },
        forest: {
            name: "迷雾森林",
            icon: "🌲",
            x: 200,
            y: 200,
            description: "充满危险的森林",
            actions: ["explore", "hunt"],
            monsters: ["slime", "goblin", "wolf"]
        },
        cave: {
            name: "黑暗洞穴",
            icon: "🕳️",
            x: 600,
            y: 200,
            description: "神秘的地下洞穴",
            actions: ["explore", "mine"],
            monsters: ["skeleton", "goblin"]
        },
        mountain: {
            name: "龙之山脉",
            icon: "⛰️",
            x: 400,
            y: 100,
            description: "巨龙的栖息地",
            actions: ["climb", "hunt"],
            monsters: ["wolf", "orc", "dragon"]
        },
        village: {
            name: "新手村",
            icon: "🏘️",
            x: 300,
            y: 400,
            description: "和平的小村庄",
            actions: ["talk", "shop", "rest"]
        },
        ruins: {
            name: "古代遗迹",
            icon: "🏛️",
            x: 500,
            y: 350,
            description: "充满宝藏的废墟",
            actions: ["explore", "dig"],
            monsters: ["skeleton", "orc"]
        }
    },

    // NPC
    npcs: {
        bartender: {
            name: "酒馆老板",
            icon: "🧔",
            location: "tavern",
            dialogue: {
                default: "欢迎来到传奇酒馆！想喝点什么吗？",
                quests: "最近有不少冒险者接取了任务，你也去看看吧。",
                shop: "我这里有一些好东西，要看看吗？"
            }
        },
        blacksmith: {
            name: "铁匠",
            icon: "👷",
            location: "village",
            dialogue: {
                default: "需要修理装备吗？",
                shop: "我打造了一些新武器，来看看吧。"
            }
        },
        elder: {
            name: "村长",
            icon: "👴",
            location: "village",
            dialogue: {
                default: "年轻人，这个世界需要英雄。",
                quests: "村庄附近有怪物出没，请帮助我们要除掉它们。"
            }
        },
        merchant: {
            name: "商人",
            icon: "🧑‍💼",
            location: "tavern",
            dialogue: {
                default: "各地的好货我都有，要看看吗？",
                shop: "今天的特价商品很不错哦！"
            }
        }
    },

    // 任务
    quests: {
        kill_slimes: {
            id: "kill_slimes",
            name: "清理史莱姆",
            description: "杀死5只史莱姆",
            type: "kill",
            target: "slime",
            count: 5,
            reward: { exp: 100, gold: 50 },
            giver: "elder"
        },
        collect_herbs: {
            id: "collect_herbs",
            name: "采集草药",
            description: "在森林采集10株草药",
            type: "collect",
            target: "herb",
            count: 10,
            reward: { exp: 80, gold: 30, item: "health_potion" },
            giver: "merchant"
        },
        defeat_boss: {
            id: "defeat_boss",
            name: "击败幼龙",
            description: "前往龙之山脉击败幼龙",
            type: "boss",
            target: "dragon",
            count: 1,
            reward: { exp: 500, gold: 200, item: "dragon_scale" },
            giver: "elder"
        }
    },

    // 剧情章节
    storyChapters: [
        {
            id: "prologue",
            name: "序章：新的开始",
            scenes: [
                {
                    background: "village",
                    characters: [],
                    speaker: "旁白",
                    text: "在一个遥远的大陆上，和平已经持续了很久。但是，黑暗的力量正在悄然苏醒...",
                    choices: [
                        { text: "继续", next: 1 }
                    ]
                },
                {
                    background: "tavern",
                    characters: ["player"],
                    speaker: "酒馆老板",
                    text: "欢迎，年轻的冒险者！看来你是新来的。这个世界需要像你这样的英雄。",
                    choices: [
                        { text: "我想知道更多", next: 2 },
                        { text: "给我一杯酒", next: 3 }
                    ]
                },
                {
                    background: "tavern",
                    characters: ["player", "bartender"],
                    speaker: "酒馆老板",
                    text: "传说在龙之山脉的深处，沉睡着一条恶龙。它即将苏醒，给世界带来灾难。只有真正的英雄才能阻止它。",
                    choices: [
                        { text: "我会去阻止它", next: 4 }
                    ]
                },
                {
                    background: "tavern",
                    characters: ["player"],
                    speaker: "酒馆老板",
                    text: "这是你的第一杯酒，免费！祝你好运，冒险者！",
                    choices: [
                        { text: "谢谢", effect: "get_free_drink", next: 4 }
                    ]
                },
                {
                    background: "village",
                    characters: ["player"],
                    speaker: "旁白",
                    text: "你的冒险开始了！首先，你需要变得更强大。去村庄周围探索吧，或者接取一些任务来积累经验。",
                    choices: [
                        { text: "开始冒险", end: true }
                    ]
                }
            ]
        }
    ]
};

// 导出游戏数据
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameData;
}
