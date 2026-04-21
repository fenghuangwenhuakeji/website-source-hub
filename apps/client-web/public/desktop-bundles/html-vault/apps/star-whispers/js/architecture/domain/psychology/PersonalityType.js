/**
 * 人格类型实体 (PersonalityType)
 * 支持多种人格类型系统
 */

export class PersonalityType {
    static SYSTEMS = {
        MBTI: 'mbti',
        NPTI: 'npti',
        BIG5: 'big5',
        ENNEAGRAM: 'enneagram',
        DISC: 'disc'
    };

    // MBTI 16种人格类型
    static MBTI_TYPES = {
        'INTJ': { name: '建筑师', traits: ['独立', '战略性', '决心', '创新'] },
        'INTP': { name: '逻辑学家', traits: ['分析性', '原创', '开放思想', '客观'] },
        'ENTJ': { name: '指挥官', traits: ['果断', '自信', '意志力', '领导力'] },
        'ENTP': { name: '辩论家', traits: ['知识渊博', '思维敏捷', '原创', '优秀辩论'] },
        'INFJ': { name: '提倡者', traits: ['有洞察力', '有原则', '有热情', '利他'] },
        'INFP': { name: '调停者', traits: ['富有想象力', '有同理心', '有创造力', '开放思想'] },
        'ENFJ': { name: '主人公', traits: ['有魅力', '鼓舞人心', '利他', '有领导力'] },
        'ENFP': { name: '竞选者', traits: ['热情', '有创造力', '社交能力强', '精力充沛'] },
        'ISTJ': { name: '物流师', traits: ['诚实', '直接', '意志坚定', '负责任'] },
        'ISFJ': { name: '守卫者', traits: ['支持性', '可靠', '有观察力', '热情'] },
        'ESTJ': { name: '总经理', traits: ['有条理', '坚定', '直接', '忠诚'] },
        'ESFJ': { name: '执政官', traits: ['有同情心', '有条理', '忠诚', '社交能力强'] },
        'ISTP': { name: '鉴赏家', traits: ['乐观', '充满活力', '有创造力', '随和'] },
        'ISFP': { name: '探险家', traits: ['有艺术性', '敏感', '有洞察力', '有好奇心'] },
        'ESTP': { name: '企业家', traits: ['敏锐', '直接', '理性', '活跃'] },
        'ESFP': { name: '表演者', traits: ['大胆', '原创', '有美学感', '实际'] }
    };

    // NPTI 人格类型
    static NPTI_TYPES = {
        'TDR': { name: '天德仁', element: '木', traits: ['仁慈', '成长', '创造力'] },
        'THG': { name: '天河光', element: '水', traits: ['智慧', '灵活', '包容'] },
        'FLG': { name: '风雷光', element: '雷', traits: ['行动力', '决断', '变化'] },
        'HSY': { name: '火山炎', element: '火', traits: ['热情', '领导力', '表现'] },
        'DSZ': { name: '地山正', element: '土', traits: ['稳重', '责任', '承诺'] },
        'JFY': { name: '金风毅', element: '金', traits: ['坚定', '正义', '精确'] },
        'SWZ': { name: '水泽智', element: '水', traits: ['智慧', '沟通', '和谐'] },
        'HTH': { name: '火天辉', element: '火', traits: ['远见', '创新', '激励'] },
        'TCH': { name: '天垂和', element: '风', traits: ['平衡', '协调', '适应'] },
        'DZH': { name: '地载厚', element: '土', traits: ['可靠', '包容', '坚韧'] },
        'LJG': { name: '雷惊骨', element: '雷', traits: ['突破', '革新', '觉醒'] },
        'JJS': { name: '金精山', element: '金', traits: ['坚固', '价值', '成就'] }
    };

    constructor(data = {}) {
        this.system = data.system || PersonalityType.SYSTEMS.MBTI;
        this.code = data.code || null;
        this.name = data.name || null;
        this.element = data.element || null;
        this.traits = data.traits || [];
        this.strengths = data.strengths || [];
        this.weaknesses = data.weaknesses || [];
        this.description = data.description || '';
        this.careerSuggestions = data.careerSuggestions || [];
        this.relationshipStyle = data.relationshipStyle || null;
    }

    /**
     * 根据类型代码创建MBTI人格
     */
    static createMBTI(code) {
        const typeData = PersonalityType.MBTI_TYPES[code];
        if (!typeData) return null;
        
        return new PersonalityType({
            system: PersonalityType.SYSTEMS.MBTI,
            code: code,
            name: typeData.name,
            traits: typeData.traits
        });
    }

    /**
     * 根据类型代码创建NPTI人格
     */
    static createNPTI(code) {
        const typeData = PersonalityType.NPTI_TYPES[code];
        if (!typeData) return null;
        
        return new PersonalityType({
            system: PersonalityType.SYSTEMS.NPTI,
            code: code,
            name: typeData.name,
            element: typeData.element,
            traits: typeData.traits
        });
    }

    /**
     * 获取类型详情
     */
    getDetails() {
        return {
            system: this.system,
            code: this.code,
            name: this.name,
            element: this.element,
            traits: this.traits,
            strengths: this.strengths,
            weaknesses: this.weaknesses,
            description: this.description
        };
    }

    /**
     * 转换为JSON
     */
    toJSON() {
        return {
            system: this.system,
            code: this.code,
            name: this.name,
            element: this.element,
            traits: this.traits,
            strengths: this.strengths,
            weaknesses: this.weaknesses,
            description: this.description,
            careerSuggestions: this.careerSuggestions,
            relationshipStyle: this.relationshipStyle
        };
    }
}