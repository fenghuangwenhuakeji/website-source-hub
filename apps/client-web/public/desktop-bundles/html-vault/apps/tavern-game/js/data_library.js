/**
 * 数据仓库 - 包含预设剧本、成就和技能
 */
const DataLibrary = {
    scripts: [
        { id: 'cultivation', name: '修仙模拟器', icon: '⚡', desc: '从凡人到仙帝的完整修仙之路', tags: ['修仙', '升级', '热血'], plays: 1250, prompt: `你是修仙世界游戏主持人。境界：炼气→筑基→金丹→元婴→化神→渡劫→大乘→仙人。规则：1.描述行动结果 2.随机触发事件 3.维护属性 4.更新状态。初始：境界炼气一层/灵石100/法宝无/位置青云宗外门。开始游戏。` },
        { id: 'urban', name: '都市霸总', icon: '💼', desc: '从白手起家到商业帝国', tags: ['都市', '商战', '霸总'], plays: 980, prompt: `你是都市商战游戏主持人。规则：1.描述商业结果 2.模拟市场变化 3.维护资金/公司/人脉 4.更新状态。初始：资金10万/公司无/人脉普通/位置市中心。开始游戏。` },
        { id: 'fantasy', name: '奇幻冒险', icon: '🗡️', desc: '剑与魔法的史诗旅程', tags: ['奇幻', '冒险', 'RPG'], plays: 1100, prompt: `你是奇幻世界游戏主持人。职业：战士/法师/盗贼/牧师。规则：1.描述冒险 2.战斗系统 3.装备系统 4.更新状态。初始：职业战士/等级1/HP100/装备新手剑/位置新手村。开始冒险。` },
        { id: 'cyberpunk', name: '赛博朋克', icon: '🤖', desc: '霓虹灯下的黑客传奇', tags: ['赛博', '黑客', '未来'], plays: 810, prompt: `你是赛博朋克游戏主持人。规则：1.描述赛博世界 2.黑客技术 3.义体改造 4.更新状态。初始：黑客等级1/信用点1000/义体无/位置下城区。开始冒险。` },
        { id: 'cthulhu', name: '克苏鲁的呼唤', icon: '🐙', desc: '直面不可名状的恐惧', tags: ['恐怖', '调查', 'SAN值'], plays: 666, prompt: `你是COC跑团主持人。规则：1.基于BRP规则 2.进行技能检定(1d100) 3.严格管理理智(SAN)值 4.氛围压抑恐怖。初始：职业私家侦探/SAN 60/手枪/位置阿卡姆疯人院门口。` }
    ],
    
    achievements: [
        { id: 'first_blood', name: '初次冒险', desc: '开始第一场游戏', icon: '🎮', max: 1, reward: '经验+100' },
        { id: 'action_master', name: '行动派', desc: '执行100次行动', icon: '⚡', max: 100, reward: '金币+500' },
        { id: 'survivor', name: '生存专家', desc: '单局存活超过50回合', icon: '🛡️', max: 50, reward: '称号: 幸存者' }
    ],

    skills: [
        { id: 'hp_up', name: '体质强化', desc: '最大生命+20', icon: '❤️', cost: 1, effect: { stat: 'maxHp', val: 20 } },
        { id: 'mp_up', name: '精神扩容', desc: '最大魔法+20', icon: '💙', cost: 1, effect: { stat: 'maxMp', val: 20 } },
        { id: 'gold_magnet', name: '财富磁铁', desc: '金币获取+20%', icon: '💰', cost: 2, effect: { stat: 'goldRate', val: 0.2 } }
    ]
};

window.DataLibrary = DataLibrary;