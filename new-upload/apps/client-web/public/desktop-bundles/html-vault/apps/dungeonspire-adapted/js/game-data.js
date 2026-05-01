/**
 * 游戏数据 - 完整版
 */
const GAME_DATA = {
    // 难度设置
    difficulties: {
        easy: { name: "简单", hpMod: 0.8, dmgMod: 0.8, goldMod: 1.2, desc: "适合新手" },
        normal: { name: "普通", hpMod: 1.0, dmgMod: 1.0, goldMod: 1.0, desc: "标准体验" },
        hard: { name: "困难", hpMod: 1.3, dmgMod: 1.2, goldMod: 0.8, desc: "真正的挑战" },
        nightmare: { name: "噩梦", hpMod: 1.5, dmgMod: 1.5, goldMod: 0.6, desc: "地狱难度" }
    },

    // 角色
    characters: {
        ironclad: { name: "铁甲战士", icon: "🛡️", hp: 80, energy: 3, desc: "力量型战士，擅长高伤害和自我治疗", relic: "燃烧之血" },
        silent: { name: "沉默猎手", icon: "🗡️", hp: 70, energy: 3, desc: "敏捷刺客，擅长毒素和连击", relic: "蛇环" },
        defect: { name: "缺陷机器人", icon: "⚡", hp: 75, energy: 3, desc: "机械法师，操控充能球", relic: "裂变电池" }
    },

    // 角色立绘/皮肤 - 提供不同的被动效果
    portraits: {
        // 铁甲战士立绘
        ironclad_default: {
            id: 'ironclad_default', char: 'ironclad', name: '钢铁意志',
            avatar: '🛡️', portrait: '⚔️🛡️', color: '#ef4444',
            desc: '基础形态，无特殊效果',
            passive: null
        },
        ironclad_berserker: {
            id: 'ironclad_berserker', char: 'ironclad', name: '狂战士',
            avatar: '😤', portrait: '🔥💪', color: '#f97316',
            desc: '每回合开始获得1力量，但受到伤害+10%',
            passive: { type: 'berserker', strPerTurn: 1, damageIncrease: 0.1 }
        },
        ironclad_guardian: {
            id: 'ironclad_guardian', char: 'ironclad', name: '守护者',
            avatar: '🏰', portrait: '🛡️🏰', color: '#3b82f6',
            desc: '每回合开始获得3护甲',
            passive: { type: 'guardian', blockPerTurn: 3 }
        },
        ironclad_vampire: {
            id: 'ironclad_vampire', char: 'ironclad', name: '血族领主',
            avatar: '🧛', portrait: '🩸🧛', color: '#7c3aed',
            desc: '攻击时恢复1生命，但最大生命-10',
            passive: { type: 'vampire', lifestealFlat: 1, maxHpReduce: 10 }
        },

        // 沉默猎手立绘
        silent_default: {
            id: 'silent_default', char: 'silent', name: '暗影刺客',
            avatar: '🗡️', portrait: '🌙🗡️', color: '#22c55e',
            desc: '基础形态，无特殊效果',
            passive: null
        },
        silent_poisoner: {
            id: 'silent_poisoner', char: 'silent', name: '剧毒大师',
            avatar: '☠️', portrait: '💀☠️', color: '#84cc16',
            desc: '每次攻击额外施加1中毒',
            passive: { type: 'poisoner', poisonOnHit: 1 }
        },
        silent_phantom: {
            id: 'silent_phantom', char: 'silent', name: '幻影舞者',
            avatar: '👻', portrait: '💨👻', color: '#06b6d4',
            desc: '每回合第一张牌费用-1',
            passive: { type: 'phantom', firstCardDiscount: 1 }
        },
        silent_gambler: {
            id: 'silent_gambler', char: 'silent', name: '赌徒',
            avatar: '🎰', portrait: '🎲🃏', color: '#eab308',
            desc: '每回合有20%几率多抽1张牌，20%几率少抽1张',
            passive: { type: 'gambler', drawChance: 0.2 }
        },

        // 缺陷机器人立绘
        defect_default: {
            id: 'defect_default', char: 'defect', name: '原型机',
            avatar: '⚡', portrait: '🤖⚡', color: '#60a5fa',
            desc: '基础形态，无特殊效果',
            passive: null
        },
        defect_overcharge: {
            id: 'defect_overcharge', char: 'defect', name: '超载核心',
            avatar: '💥', portrait: '⚡💥', color: '#f59e0b',
            desc: '每回合获得1额外能量，但回合结束受到2伤害',
            passive: { type: 'overcharge', energyBonus: 1, selfDamage: 2 }
        },
        defect_shield: {
            id: 'defect_shield', char: 'defect', name: '护盾协议',
            avatar: '🔵', portrait: '🛡️🔵', color: '#0ea5e9',
            desc: '护甲效果+20%',
            passive: { type: 'shieldProtocol', blockBonus: 0.2 }
        },
        defect_glitch: {
            id: 'defect_glitch', char: 'defect', name: '故障体',
            avatar: '🌀', portrait: '❓🌀', color: '#a855f7',
            desc: '每回合随机获得一个buff或debuff',
            passive: { type: 'glitch', randomEffect: true }
        }
    },

    // 卡牌 - 大幅扩展
    cards: {
        // === 铁甲战士 基础 ===
        strike_r: { name: "打击", cost: 1, type: "attack", rarity: "basic", char: "ironclad", desc: "造成 6 点伤害", damage: 6, icon: "⚔️", lore: "最基础的攻击，却是一切的开始。" },
        defend_r: { name: "防御", cost: 1, type: "skill", rarity: "basic", char: "ironclad", desc: "获得 5 点护甲", block: 5, icon: "🛡️", lore: "防守是最好的进攻...有时候。" },
        bash: { name: "痛击", cost: 2, type: "attack", rarity: "basic", char: "ironclad", desc: "造成 8 伤害，施加 2 易伤", damage: 8, vulnerable: 2, icon: "🔨", lore: "让敌人尝尝铁拳的滋味！" },

        // === 铁甲战士 普通 ===
        anger: { name: "怒火", cost: 0, type: "attack", rarity: "common", char: "ironclad", desc: "造成 6 伤害，复制到弃牌堆", damage: 6, copyToDiscard: true, icon: "😤", lore: "愤怒会传染，也会累积。" },
        cleave: { name: "横扫", cost: 1, type: "attack", rarity: "common", char: "ironclad", desc: "对所有敌人造成 8 伤害", damage: 8, aoe: true, icon: "🌀", lore: "一剑横扫千军！" },
        iron_wave: { name: "铁浪", cost: 1, type: "attack", rarity: "common", char: "ironclad", desc: "获得 5 护甲，造成 5 伤害", damage: 5, block: 5, icon: "🌊", lore: "攻防一体的完美技巧。" },
        twin_strike: { name: "双重打击", cost: 1, type: "attack", rarity: "common", char: "ironclad", desc: "造成 5 伤害两次", damage: 5, hits: 2, icon: "✌️", lore: "一击不够？那就两击！" },
        pommel_strike: { name: "剑柄打击", cost: 1, type: "attack", rarity: "common", char: "ironclad", desc: "造成 9 伤害，抽 1 张牌", damage: 9, draw: 1, icon: "🗡️", lore: "用剑柄敲晕敌人，顺便思考下一步。" },
        shrug_it_off: { name: "耸肩", cost: 1, type: "skill", rarity: "common", char: "ironclad", desc: "获得 8 护甲，抽 1 张牌", block: 8, draw: 1, icon: "🤷", lore: "无所谓，反正打不疼我。" },
        thunderclap: { name: "雷鸣拍击", cost: 1, type: "attack", rarity: "common", char: "ironclad", desc: "对所有敌人造成 4 伤害并施加 1 易伤", damage: 4, aoe: true, vulnerable: 1, icon: "⚡", lore: "雷霆万钧！" },

        // === 铁甲战士 罕见 ===
        carnage: { name: "大屠杀", cost: 2, type: "attack", rarity: "uncommon", char: "ironclad", desc: "造成 20 伤害，虚无", damage: 20, ethereal: true, icon: "💀", lore: "毁灭性的一击，但力量转瞬即逝。" },
        flame_barrier: { name: "烈焰屏障", cost: 2, type: "skill", rarity: "uncommon", char: "ironclad", desc: "获得 12 护甲，受攻击反弹 4 伤害", block: 12, thorns: 4, icon: "🔥", lore: "以火焰为盾，灼烧一切来犯之敌。" },
        bloodletting: { name: "放血", cost: 0, type: "skill", rarity: "uncommon", char: "ironclad", desc: "失去 3 生命，获得 2 能量", selfDamage: 3, gainEnergy: 2, icon: "🩸", lore: "鲜血是最好的燃料。" },
        uppercut: { name: "上勾拳", cost: 2, type: "attack", rarity: "uncommon", char: "ironclad", desc: "造成 13 伤害，施加 1 虚弱和易伤", damage: 13, weak: 1, vulnerable: 1, icon: "👊", lore: "一拳定乾坤！" },
        inflame: { name: "燃烧", cost: 1, type: "power", rarity: "uncommon", char: "ironclad", desc: "获得 2 力量", strength: 2, icon: "🔥", lore: "内心的火焰永不熄灭。" },
        metallicize: { name: "金属化", cost: 1, type: "power", rarity: "uncommon", char: "ironclad", desc: "每回合结束获得 3 护甲", blockPerTurn: 3, icon: "🔩", lore: "钢铁之躯，刀枪不入。" },

        // === 铁甲战士 稀有 ===
        demon_form: { name: "恶魔形态", cost: 3, type: "power", rarity: "rare", char: "ironclad", desc: "每回合开始获得 2 力量", strengthPerTurn: 2, icon: "😈", lore: "与恶魔签订契约，获得无尽力量。" },
        bludgeon: { name: "重锤", cost: 3, type: "attack", rarity: "rare", char: "ironclad", desc: "造成 32 伤害", damage: 32, icon: "🔨", lore: "一锤定音！" },
        barricade: { name: "壁垒", cost: 3, type: "power", rarity: "rare", char: "ironclad", desc: "护甲不再消失", barricade: true, icon: "🏰", lore: "铜墙铁壁，固若金汤。" },
        offering: { name: "祭品", cost: 0, type: "skill", rarity: "rare", char: "ironclad", desc: "失去 6 生命，获得 2 能量，抽 3 张牌", selfDamage: 6, gainEnergy: 2, draw: 3, icon: "🩸", lore: "以血为祭，换取力量。" },
        reaper: { name: "收割", cost: 2, type: "attack", rarity: "rare", char: "ironclad", desc: "对所有敌人造成 4 伤害，吸血", damage: 4, aoe: true, lifesteal: true, icon: "💀", lore: "死神的镰刀，收割灵魂。" },


        // === 沉默猎手 ===
        strike_g: { name: "打击", cost: 1, type: "attack", rarity: "basic", char: "silent", desc: "造成 6 点伤害", damage: 6, icon: "🗡️" },
        defend_g: { name: "防御", cost: 1, type: "skill", rarity: "basic", char: "silent", desc: "获得 5 点护甲", block: 5, icon: "🛡️" },
        neutralize: { name: "压制", cost: 0, type: "attack", rarity: "basic", char: "silent", desc: "造成 3 伤害，施加 1 虚弱", damage: 3, weak: 1, icon: "😵" },
        survivor: { name: "幸存者", cost: 1, type: "skill", rarity: "basic", char: "silent", desc: "获得 8 护甲，弃 1 张牌", block: 8, discard: 1, icon: "🏃" },
        blade_dance: { name: "剑刃之舞", cost: 1, type: "skill", rarity: "common", char: "silent", desc: "将 3 张剑刃加入手牌", addShivs: 3, icon: "💃", lore: "舞动的刀锋，致命的优雅。" },
        shiv: { name: "剑刃", cost: 0, type: "attack", rarity: "special", char: "silent", desc: "造成 4 伤害，消耗", damage: 4, exhaust: true, icon: "🔪" },
        deadly_poison: { name: "致命毒药", cost: 1, type: "skill", rarity: "common", char: "silent", desc: "施加 5 中毒", poison: 5, icon: "☠️", lore: "一滴足以致命。" },
        quick_slash: { name: "快斩", cost: 1, type: "attack", rarity: "common", char: "silent", desc: "造成 8 伤害，抽 1 张牌", damage: 8, draw: 1, icon: "⚡" },
        backflip: { name: "后空翻", cost: 1, type: "skill", rarity: "common", char: "silent", desc: "获得 5 护甲，抽 2 张牌", block: 5, draw: 2, icon: "🔄" },
        noxious_fumes: { name: "毒雾", cost: 1, type: "power", rarity: "uncommon", char: "silent", desc: "每回合对所有敌人施加 2 中毒", poisonPerTurn: 2, icon: "💨" },
        footwork: { name: "步法", cost: 1, type: "power", rarity: "uncommon", char: "silent", desc: "获得 2 敏捷", dexterity: 2, icon: "👟" },
        leg_sweep: { name: "扫堂腿", cost: 2, type: "skill", rarity: "uncommon", char: "silent", desc: "施加 2 虚弱，获得 11 护甲", weak: 2, block: 11, icon: "🦵" },
        adrenaline: { name: "肾上腺素", cost: 0, type: "skill", rarity: "rare", char: "silent", desc: "获得 1 能量，抽 2 张牌，消耗", gainEnergy: 1, draw: 2, exhaust: true, icon: "💉" },
        corpse_explosion: { name: "尸爆", cost: 2, type: "skill", rarity: "rare", char: "silent", desc: "施加 6 中毒", poison: 6, icon: "💥" },

        // === 缺陷机器人 ===
        strike_b: { name: "打击", cost: 1, type: "attack", rarity: "basic", char: "defect", desc: "造成 6 点伤害", damage: 6, icon: "⚡" },
        defend_b: { name: "防御", cost: 1, type: "skill", rarity: "basic", char: "defect", desc: "获得 5 点护甲", block: 5, icon: "🛡️" },
        zap: { name: "电击", cost: 1, type: "skill", rarity: "basic", char: "defect", desc: "生成 1 个闪电球", channelOrb: 1, icon: "⚡" },
        dualcast: { name: "双重施法", cost: 1, type: "skill", rarity: "basic", char: "defect", desc: "激发充能球两次", evoke: 2, icon: "✨" },
        ball_lightning: { name: "球状闪电", cost: 1, type: "attack", rarity: "common", char: "defect", desc: "造成 7 伤害，生成 1 闪电球", damage: 7, channelOrb: 1, icon: "🔵" },
        cold_snap: { name: "寒流", cost: 1, type: "attack", rarity: "common", char: "defect", desc: "造成 6 伤害，生成 1 冰霜球", damage: 6, channelFrost: 1, icon: "❄️" },
        defragment: { name: "碎片整理", cost: 1, type: "power", rarity: "uncommon", char: "defect", desc: "获得 1 集中", focus: 1, icon: "🔧" },
        glacier: { name: "冰川", cost: 2, type: "skill", rarity: "uncommon", char: "defect", desc: "获得 7 护甲，生成 2 冰霜球", block: 7, channelFrost: 2, icon: "🏔️" },
        echo_form: { name: "回响形态", cost: 3, type: "power", rarity: "rare", char: "defect", desc: "每回合第一张牌打出两次", echoForm: true, icon: "👥" },

        // === 黄金卡牌 (稀有特殊) ===
        golden_strike: { name: "黄金打击", cost: 1, type: "attack", rarity: "golden", char: "colorless", desc: "造成 10 伤害，获得 5 金币", damage: 10, goldGain: 5, icon: "✨", lore: "传说中的黄金之剑，每一击都能创造财富。", golden: true },
        golden_shield: { name: "黄金护盾", cost: 1, type: "skill", rarity: "golden", char: "colorless", desc: "获得 10 护甲，获得 3 金币", block: 10, goldGain: 3, icon: "🛡️", lore: "镶满宝石的盾牌，防御与财富兼得。", golden: true },
        midas_touch: { name: "点金术", cost: 2, type: "skill", rarity: "golden", char: "colorless", desc: "获得 20 金币，消耗", goldGain: 20, exhaust: true, icon: "👆", lore: "弥达斯王的祝福，触碰即为黄金。", golden: true },
        golden_idol: { name: "黄金神像", cost: 0, type: "power", rarity: "golden", char: "colorless", desc: "每回合获得 2 金币", goldPerTurn: 2, icon: "🗿", lore: "古老的神像，源源不断地产出黄金。", golden: true },

        // === 诅咒卡牌 (霉运) ===
        curse_pain: { name: "痛苦", cost: -1, type: "curse", rarity: "curse", char: "colorless", desc: "无法打出。抽到时失去 1 生命", unplayable: true, drawDamage: 1, icon: "💔", lore: "诅咒缠身，痛苦如影随形。", curse: true },
        curse_decay: { name: "腐朽", cost: -1, type: "curse", rarity: "curse", char: "colorless", desc: "无法打出。回合结束时若在手牌，失去 1 生命", unplayable: true, endTurnDamage: 1, icon: "🦠", lore: "腐烂的气息，侵蚀你的生命。", curse: true },
        curse_doubt: { name: "疑虑", cost: -1, type: "curse", rarity: "curse", char: "colorless", desc: "无法打出。回合结束时获得 1 虚弱", unplayable: true, endTurnWeak: 1, icon: "❓", lore: "自我怀疑是最大的敌人。", curse: true },
        curse_regret: { name: "悔恨", cost: -1, type: "curse", rarity: "curse", char: "colorless", desc: "无法打出。回合结束时每张手牌失去 1 生命", unplayable: true, regretDamage: true, icon: "😢", lore: "过去的错误，永远无法弥补。", curse: true },
        curse_shame: { name: "羞耻", cost: -1, type: "curse", rarity: "curse", char: "colorless", desc: "无法打出。战斗结束前无法移除", unplayable: true, permanent: true, icon: "😳", lore: "无法洗刷的耻辱。", curse: true },

        // === 无色卡牌 ===
        apotheosis: { name: "神化", cost: 2, type: "skill", rarity: "rare", char: "colorless", desc: "升级所有卡牌，消耗", upgradeAll: true, exhaust: true, icon: "✨" },
        master_of_strategy: { name: "战略大师", cost: 0, type: "skill", rarity: "rare", char: "colorless", desc: "抽 3 张牌，消耗", draw: 3, exhaust: true, icon: "🧠" },
        panacea: { name: "万灵药", cost: 0, type: "skill", rarity: "rare", char: "colorless", desc: "获得 1 神器，消耗", artifact: 1, exhaust: true, icon: "💊" },
        trip: { name: "绊倒", cost: 0, type: "skill", rarity: "common", char: "colorless", desc: "施加 2 易伤", vulnerable: 2, icon: "🦶" },
        bandage: { name: "绷带", cost: 0, type: "skill", rarity: "common", char: "colorless", desc: "恢复 4 生命，消耗", heal: 4, exhaust: true, icon: "🩹" },
        swift_strike: { name: "迅捷打击", cost: 0, type: "attack", rarity: "uncommon", char: "colorless", desc: "造成 7 伤害", damage: 7, icon: "💨" },

        // === 治疗卡牌 (高收益高惩罚) ===
        blood_pact: { name: "血之契约", cost: 1, type: "skill", rarity: "uncommon", char: "colorless", desc: "恢复 12 生命，下回合受到双倍伤害", heal: 12, doubleDamageNextTurn: true, icon: "🩸", lore: "以明日之痛，换今日之愈。" },
        dark_embrace: { name: "黑暗拥抱", cost: 2, type: "skill", rarity: "rare", char: "colorless", desc: "恢复 25% 最大生命，获得 2 虚弱", healPercent: 25, selfWeak: 2, icon: "🖤", lore: "黑暗的治愈，代价是力量的流失。" },
        vampiric_bite: { name: "吸血之咬", cost: 2, type: "attack", rarity: "uncommon", char: "ironclad", desc: "造成 10 伤害，恢复等量生命", damage: 10, lifesteal: true, icon: "🧛", lore: "鲜血是最好的补品。" },
        soul_drain: { name: "灵魂汲取", cost: 3, type: "attack", rarity: "rare", char: "colorless", desc: "造成 15 伤害，恢复 15 生命，消耗", damage: 15, heal: 15, exhaust: true, icon: "👻", lore: "吞噬敌人的灵魂，滋养自己的肉体。" },
        desperate_heal: { name: "绝望治愈", cost: 0, type: "skill", rarity: "uncommon", char: "colorless", desc: "恢复 8 生命，将一张诅咒加入牌组", heal: 8, addCurse: true, icon: "💔", lore: "治愈的代价是永恒的诅咒。" },
        life_tap: { name: "生命分流", cost: 1, type: "skill", rarity: "common", char: "colorless", desc: "失去 5 生命，抽 2 张牌，获得 1 能量", selfDamage: 5, draw: 2, gainEnergy: 1, icon: "💉", lore: "以血换力，以命换牌。" },
        phoenix_flame: { name: "凤凰之焰", cost: 2, type: "skill", rarity: "rare", char: "colorless", desc: "恢复 20 生命，本场战斗最大生命-5", heal: 20, reduceMaxHp: 5, icon: "🔥", lore: "浴火重生，但每次都会失去一部分自我。" },
        forbidden_ritual: { name: "禁忌仪式", cost: 1, type: "skill", rarity: "rare", char: "colorless", desc: "恢复全部生命，弃掉所有手牌", healFull: true, discardAll: true, icon: "🕯️", lore: "完全的治愈需要完全的牺牲。" },
        blood_for_blood: { name: "以血还血", cost: 4, type: "attack", rarity: "rare", char: "ironclad", desc: "每失去1点生命，费用-1。造成 18 伤害，恢复 8 生命", damage: 18, heal: 8, costReduceByDamage: true, icon: "⚔️", lore: "伤痕越深，力量越强。" },
        regeneration: { name: "再生", cost: 1, type: "power", rarity: "uncommon", char: "colorless", desc: "每回合恢复 3 生命", healPerTurn: 3, icon: "🌱", lore: "缓慢但稳定的恢复。" },
        leech: { name: "水蛭", cost: 1, type: "attack", rarity: "common", char: "silent", desc: "造成 6 伤害，恢复 3 生命", damage: 6, heal: 3, icon: "🪱", lore: "小小的吸血，小小的治愈。" },
        self_repair: { name: "自我修复", cost: 1, type: "power", rarity: "uncommon", char: "defect", desc: "战斗结束时恢复 7 生命", healOnCombatEnd: 7, icon: "🔧", lore: "机器也需要维护。" }
    },


    // 敌人数据
    enemies: {
        slime_s: { name: "小史莱姆", icon: "🟢", hp: [10, 14], damage: [3, 5], act: 1, type: "normal" },
        slime_m: { name: "史莱姆", icon: "👹", hp: [28, 32], damage: [8, 12], act: 1, type: "normal" },
        cultist: { name: "邪教徒", icon: "🧙", hp: [48, 54], damage: [6, 6], ritual: 3, act: 1, type: "normal" },
        jaw_worm: { name: "颚虫", icon: "🐛", hp: [40, 44], damage: [11, 12], act: 1, type: "normal" },
        louse_r: { name: "红虱", icon: "🔴", hp: [10, 15], damage: [5, 7], act: 1, type: "normal" },
        fungi_beast: { name: "真菌兽", icon: "🍄", hp: [22, 28], damage: [6, 6], act: 1, type: "normal" },
        gremlin_nob: { name: "哥布林头目", icon: "👺", hp: [82, 86], damage: [14, 16], elite: true, act: 1, type: "elite" },
        lagavulin: { name: "拉格瓦林", icon: "😈", hp: [109, 111], damage: [18, 20], elite: true, act: 1, type: "elite" },
        slime_boss: { name: "史莱姆之王", icon: "👑", hp: [140, 140], damage: [35, 35], boss: true, act: 1, type: "boss" },
        guardian: { name: "守护者", icon: "🗿", hp: [240, 240], damage: [32, 32], boss: true, act: 1, type: "boss" },
        hexaghost: { name: "六角幽灵", icon: "👻", hp: [250, 250], damage: [6, 6], boss: true, act: 1, type: "boss" },
        chosen: { name: "被选中者", icon: "🎭", hp: [95, 99], damage: [12, 12], act: 2, type: "normal" },
        byrd: { name: "飞鸟", icon: "🦅", hp: [25, 31], damage: [12, 12], act: 2, type: "normal" },
        snecko: { name: "蛇眼怪", icon: "🐍", hp: [114, 120], damage: [15, 18], act: 2, type: "normal" },
        book_of_stabbing: { name: "刺杀之书", icon: "📕", hp: [160, 168], damage: [21, 21], elite: true, act: 2, type: "elite" },
        champ: { name: "冠军", icon: "🏆", hp: [420, 420], damage: [22, 22], boss: true, act: 2, type: "boss" },
        automaton: { name: "青铜自动机", icon: "🤖", hp: [300, 300], damage: [45, 45], boss: true, act: 2, type: "boss" },
        giant_head: { name: "巨型头颅", icon: "🗿", hp: [500, 500], damage: [40, 40], elite: true, act: 3, type: "elite" },
        awakened_one: { name: "觉醒者", icon: "👁️", hp: [300, 300], damage: [40, 40], boss: true, act: 3, type: "boss" },
        time_eater: { name: "时间吞噬者", icon: "⏰", hp: [456, 456], damage: [32, 32], boss: true, act: 3, type: "boss" }
    },

    // 遗物数据
    relics: {
        burning_blood: { name: "燃烧之血", icon: "🔥", rarity: "starter", desc: "战斗结束后恢复 6 点生命", char: "ironclad", price: 0 },
        ring_of_snake: { name: "蛇环", icon: "🐍", rarity: "starter", desc: "战斗开始时额外抽 2 张牌", char: "silent", price: 0 },
        cracked_core: { name: "裂变电池", icon: "🔋", rarity: "starter", desc: "战斗开始时生成 1 个闪电球", char: "defect", price: 0 },
        vajra: { name: "金刚杵", icon: "💎", rarity: "common", desc: "战斗开始时获得 1 力量", price: 150 },
        bag_of_marbles: { name: "弹珠袋", icon: "🔮", rarity: "common", desc: "战斗开始时对所有敌人施加 1 易伤", price: 150 },
        anchor: { name: "船锚", icon: "⚓", rarity: "common", desc: "战斗开始时获得 10 护甲", price: 150 },
        lantern: { name: "灯笼", icon: "🏮", rarity: "common", desc: "战斗开始时获得 1 能量", price: 180 },
        blood_vial: { name: "血瓶", icon: "🧪", rarity: "common", desc: "战斗开始时恢复 2 生命", price: 120 },
        pen_nib: { name: "笔尖", icon: "✒️", rarity: "uncommon", desc: "每打出 10 张攻击牌，下一张伤害翻倍", price: 220 },
        ornamental_fan: { name: "装饰扇", icon: "🪭", rarity: "uncommon", desc: "每回合打出 3 张攻击牌时获得 4 护甲", price: 200 },
        meat_on_bone: { name: "骨头上的肉", icon: "🍖", rarity: "uncommon", desc: "战斗结束时若生命≤50%，恢复 12 生命", price: 180 },
        dead_branch: { name: "枯枝", icon: "🌿", rarity: "rare", desc: "每当消耗一张牌，将一张随机牌加入手牌", price: 350 },
        snecko_eye: { name: "蛇眼", icon: "👁️", rarity: "rare", desc: "战斗开始时抽 2 张额外牌，卡牌费用随机", price: 300 },
        golden_idol: { name: "黄金神像", icon: "🗿", rarity: "rare", desc: "每场战斗获得额外 25 金币", price: 400 }
    },

    // 商店物品
    shopItems: {
        remove_card: { name: "移除卡牌", icon: "🗑️", desc: "从牌组中移除一张卡牌", price: 75, type: "service" },
        upgrade_card: { name: "升级卡牌", icon: "⬆️", desc: "升级一张卡牌", price: 50, type: "service" },
        transform_card: { name: "转化卡牌", icon: "🔄", desc: "将一张卡牌转化为随机卡牌", price: 50, type: "service" },
        colorless_rare: { name: "稀有无色卡", icon: "🎴", desc: "获得一张稀有无色卡牌", price: 200, type: "card" },
        golden_card: { name: "黄金卡牌", icon: "✨", desc: "有几率获得黄金卡牌", price: 300, type: "card" }
    },

    // 药水
    potions: {
        fire_potion: { name: "火焰药水", icon: "🔥", desc: "造成 20 伤害", price: 50, damage: 20 },
        block_potion: { name: "格挡药水", icon: "🛡️", desc: "获得 12 护甲", price: 50, block: 12 },
        strength_potion: { name: "力量药水", icon: "💪", desc: "获得 2 力量", price: 75, strength: 2 },
        regen_potion: { name: "再生药水", icon: "💚", desc: "获得 5 再生", price: 75, regen: 5 },
        energy_potion: { name: "能量药水", icon: "⚡", desc: "获得 2 能量", price: 75, energy: 2 },
        fairy_bottle: { name: "精灵瓶", icon: "🧚", desc: "死亡时恢复 30% 生命", price: 150, revive: true },
        fruit_juice: { name: "果汁", icon: "🧃", desc: "永久增加 5 最大生命", price: 100, maxHp: 5 },
        liquid_gold: { name: "液态黄金", icon: "🥇", desc: "获得 100 金币", price: 50, gold: 100 }
    },

    // 事件
    events: [
        { id: "shop", name: "商店", icon: "🏪", desc: "购买卡牌、遗物和药水" },
        { id: "rest", name: "篝火", icon: "🔥", desc: "休息恢复生命或升级卡牌" },
        { id: "chest", name: "宝箱", icon: "📦", desc: "获得随机遗物" },
        { id: "question", name: "未知事件", icon: "❓", desc: "随机事件" },
        { id: "elite", name: "精英", icon: "👺", desc: "强力敌人，丰厚奖励" },
        { id: "boss", name: "Boss", icon: "💀", desc: "本幕最终Boss" }
    ]
};
