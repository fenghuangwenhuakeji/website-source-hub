# Polish Agent - 架构设计文档

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档版本 | v1.0.0 |
| 创建日期 | 2026-03-17 |
| 最后更新 | 2026-03-17 |
| 文档状态 | 初始版本 |

---

## 1. 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                    Polish Agent                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ 三界分析 │  │ 去AI处理 │  │ 情绪增强 │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│       │             │             │                     │
│       └─────────────┼─────────────┘                     │
│                     ▼                                   │
│  ┌─────────────────────────────────────┐               │
│  │           润色引擎                   │               │
│  └─────────────────────────────────────┘               │
│                     │                                   │
│       ┌─────────────┼─────────────┐                     │
│       ▼             ▼             ▼                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │ 对话驱动 │ │ 格式化   │ │ 质量检查 │              │
│  └──────────┘ └──────────┘ └──────────┘              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 2. 数据模型

```typescript
// 文本输入
interface TextInput {
  id: string;
  content: string;
  wordCount: number;
  genre: string;
  targetStyle: string;
}

// 三界分析结果
interface ThreeRealmAnalysis {
  character: string;
  bazi: BaziAnalysis;
  tarot: TarotAnalysis;
  mbti: MBTIType;
  fusion: CharacterMatrix;
}

// 八字分析
interface BaziAnalysis {
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string;
  tenGods: string[];
  pattern: string;
}

// 塔罗分析
interface TarotAnalysis {
  majorArcana: string;
  minorArcana: {
    wands: string;
    cups: string;
    swords: string;
    pentacles: string;
  };
  position: 'upright' | 'reversed';
}

// MBTI分析
interface MBTIType {
  type: string;
  dominant: string;
  auxiliary: string;
  tertiary: string;
  inferior: string;
}

// 润色结果
interface PolishResult {
  input: TextInput;
  analysis: ThreeRealmAnalysis;
  polishedText: string;
  changes: TextChange[];
  emotionScore: number;
  deAIScore: number;
}
```

---

## 3. 核心流程

```
文本输入 → 三界分析 → 去AI处理 → 情绪增强 → 对话驱动 → 格式化 → 输出
```

---

## 4. 三界分析引擎

```typescript
interface IThreeRealmEngine {
  // 八字分析
  analyzeBazi(character: string): BaziAnalysis;
  
  // 塔罗分析
  analyzeTarot(character: string): TarotAnalysis;
  
  // MBTI分析
  analyzeMBTI(character: string): MBTIType;
  
  // 三界融合
  fuseThreeRealms(bazi: BaziAnalysis, tarot: TarotAnalysis, mbti: MBTIType): CharacterMatrix;
}

// 角色矩阵
class CharacterMatrix {
  constructor(
    public fate: BaziAnalysis,
    public archetype: TarotAnalysis,
    public cognition: MBTIType
  ) {}
  
  // 生成角色描述
  generateDescription(): string {
    return `${this.fate.pattern} + ${this.archetype.majorArcana} + ${this.cognition.type}`;
  }
}
```

---

## 5. 去AI处理引擎

```typescript
interface IDeAIEngine {
  // 删除机械词汇
  removeMechanicalWords(text: string): string;
  
  // 白话化改造
  transformToSpoken(text: string): string;
  
  // 句式瘦身
  slimSentences(text: string): string;
  
  // 段落优化
  optimizeParagraphs(text: string): string;
}

// 去AI规则库
class DeAIRules {
  static mechanicalWords = ['仿佛', '似乎', '如同', '宛如', '好像'];
  static spokenReplacements = {
    '内心充满愤怒': '气炸了',
    '感到十分惊讶': '懵了',
    '陷入深深思考': '愣住了',
    '心情变得复杂': '心里乱成一团'
  };
  
  static apply(text: string): string {
    // 删除机械词汇
    let result = text;
    for (const word of this.mechanicalWords) {
      result = result.replace(new RegExp(word, 'g'), '');
    }
    
    // 白话化替换
    for (const [formal, spoken] of Object.entries(this.spokenReplacements)) {
      result = result.replace(new RegExp(formal, 'g'), spoken);
    }
    
    return result;
  }
}
```

---

## 6. 情绪增强引擎

```typescript
interface IEmotionEngine {
  // 应用情绪链条
  applyEmotionChain(text: string, chain: EmotionChain): string;
  
  // 增加擦边张力
  addTension(text: string): string;
  
  // 设置章节钩子
  addHooks(text: string): string;
  
  // 强化爽点
  enhanceClimax(text: string): string;
}

// 情绪链条库
class EmotionChains {
  static chains = {
    despairToBreakthrough: ['绝望', '挣扎', '顿悟', '破局'],
    alertToCounter: ['警惕', '放松', '惊骇', '反杀'],
    humiliationToPride: ['屈辱', '蛰伏', '爆发', '扬眉'],
    inferiorityToShock: ['自卑', '奇遇', '修炼', '震惊']
  };
  
  static apply(text: string, chainName: string): string {
    const chain = this.chains[chainName];
    // 根据链条调整文本情绪节奏
    return text;
  }
}
```

---

## 7. 接口设计

```typescript
interface IPolishAgent {
  // 分析文本
  analyze(input: TextInput): ThreeRealmAnalysis;
  
  // 润色文本
  polish(input: TextInput): PolishResult;
  
  // 批量处理
  batchPolish(inputs: TextInput[]): PolishResult[];
  
  // 导出结果
  export(result: PolishResult, format: string): string;
}
```

---

**文档版本**: v1.0
**创建日期**: 2026-03-17
