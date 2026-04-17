# Narrative Engine Agent - 架构设计文档

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
│                Narrative Engine Agent                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ 四象定锚 │  │ 骨架构建 │  │ 零度写作 │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│       │             │             │                     │
│       └─────────────┼─────────────┘                     │
│                     ▼                                   │
│  ┌─────────────────────────────────────┐               │
│  │           叙事引擎                   │               │
│  └─────────────────────────────────────┘               │
│                     │                                   │
│       ┌─────────────┼─────────────┐                     │
│       ▼             ▼             ▼                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │ 情绪操控 │ │ 外科精修 │ │ 章节输出 │              │
│  └──────────┘ └──────────┘ └──────────┘              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 2. 数据模型

```typescript
// 故事梗概
interface StoryOutline {
  id: string;
  premise: string;
  protagonist: Character;
  antagonist: Character;
  theme: string;
  targetLength: number; // 10000-30000
}

// 四象定锚
interface FourAnchors {
  highConcept: string;      // 核心高概念
  protagonistArchetype: {   // 主角原型
    surface: string;
    inner: string;
  };
  coreDesire: string;       // 核心欲望
  opposingForce: string;    // 对抗力量
}

// 三幕结构
interface ThreeActStructure {
  act1: Act;  // 25%
  act2: Act;  // 50%
  act3: Act;  // 25%
}

interface Act {
  percentage: number;
  chapters: Chapter[];
  keyEvents: string[];
  emotionNodes: EmotionNode[];
}

// 章节
interface Chapter {
  number: number;
  title: string;
  wordCount: number;
  keyEvent: string;
  climaxPoint: string;
  hook: string;
  content: string;
}

// 情绪节点
interface EmotionNode {
  position: number; // 百分比位置
  emotion: string;
  intensity: number; // 1-10
}

// 输出结果
interface NarrativeResult {
  outline: StoryOutline;
  anchors: FourAnchors;
  structure: ThreeActStructure;
  chapters: Chapter[];
  totalWords: number;
}
```

---

## 3. 核心流程

```
梗概输入 → 四象定锚 → 骨架构建 → 零度写作 → 情绪操控 → 外科精修 → 输出
```

---

## 4. 四象定锚引擎

```typescript
interface IFourAnchorsEngine {
  // 提炼核心高概念
  extractHighConcept(premise: string): string;
  
  // 分析主角原型
  analyzeProtagonistArchetype(character: Character): { surface: string; inner: string };
  
  // 确定核心欲望
  identifyCoreDesire(character: Character): string;
  
  // 设计对抗力量
  designOpposingForce(protagonist: Character, premise: string): string;
}

// 四象定锚实现
class FourAnchorsEngine implements IFourAnchorsEngine {
  extractHighConcept(premise: string): string {
    // 提炼为一句话
    return premise.slice(0, 50);
  }
  
  analyzeProtagonistArchetype(character: Character): { surface: string; inner: string } {
    return {
      surface: character.surfaceIdentity,
      inner: character.innerIdentity
    };
  }
  
  identifyCoreDesire(character: Character): string {
    return character.desire;
  }
  
  designOpposingForce(protagonist: Character, premise: string): string {
    // 基于主角和梗概设计对抗力量
    return `与${protagonist.desire}对立的势力`;
  }
}
```

---

## 5. 骨架构建引擎

```typescript
interface ISkeletonEngine {
  // 构建三幕结构
  buildThreeActStructure(anchors: FourAnchors, targetLength: number): ThreeActStructure;
  
  // 分配章节
  distributeChapters(structure: ThreeActStructure): Chapter[];
  
  // 设计情绪节点
  designEmotionNodes(structure: ThreeActStructure): EmotionNode[];
}

// 三幕结构实现
class SkeletonEngine implements ISkeletonEngine {
  buildThreeActStructure(anchors: FourAnchors, targetLength: number): ThreeActStructure {
    return {
      act1: {
        percentage: 25,
        chapters: [],
        keyEvents: ['钩子', '激励事件', '跨越门槛'],
        emotionNodes: []
      },
      act2: {
        percentage: 50,
        chapters: [],
        keyEvents: ['升级障碍', '中点高潮', '灵魂黑夜'],
        emotionNodes: []
      },
      act3: {
        percentage: 25,
        chapters: [],
        keyEvents: ['终极对决', '新平衡', '余韵'],
        emotionNodes: []
      }
    };
  }
  
  distributeChapters(structure: ThreeActStructure): Chapter[] {
    const chapters: Chapter[] = [];
    // 分配10章
    for (let i = 1; i <= 10; i++) {
      chapters.push({
        number: i,
        title: `第${i}章`,
        wordCount: 3000,
        keyEvent: '',
        climaxPoint: '',
        hook: '',
        content: ''
      });
    }
    return chapters;
  }
}
```

---

## 6. 零度写作引擎

```typescript
interface IZeroDegreeEngine {
  // 应用四总纲
  applyFourPrinciples(text: string): string;
  
  // 比喻清零
  clearMetaphors(text: string): string;
  
  // 虚词斩杀
  killFunctionWords(text: string): string;
  
  // 句式瘦身
  slimSentences(text: string): string;
}

// 零度写作规则
class ZeroDegreeRules {
  static functionWords = ['似乎', '仿佛', '好像', '宛如', '如同', '正在', '开始'];
  static metaphorIndicators = ['像', '如同', '仿佛', '宛如'];
  
  static apply(text: string): string {
    let result = text;
    
    // 删除虚词
    for (const word of this.functionWords) {
      result = result.replace(new RegExp(word, 'g'), '');
    }
    
    // 统计并限制比喻
    const metaphorCount = (result.match(/像|如同|仿佛/g) || []).length;
    if (metaphorCount > 1) {
      // 保留第一个，删除其他的
      result = result.replace(/像|如同|仿佛/g, (match, offset) => {
        return offset === result.indexOf(match) ? match : '';
      });
    }
    
    return result;
  }
}
```

---

## 7. 情绪操控引擎

```typescript
interface IEmotionEngine {
  // 应用情绪链条
  applyEmotionChain(chainType: string, chapters: Chapter[]): Chapter[];
  
  // 控制情绪节奏
  controlEmotionRhythm(nodes: EmotionNode[], chapters: Chapter[]): Chapter[];
}

// 情绪链条库
class EmotionChains {
  static chains = {
    despairPeeling: ['预警失灵', '钝刀割肉', '最后稻草', '尸体化生存', '消失的艺术'],
    iqCrushing: ['猎物入笼', '请君入瓮', '逻辑闭环', '公开处刑', '视若无物'],
    horrorValley: ['日常裂痕', '疯狂猜想', '恐怖实锤', '绝望敲门'],
    tigerInDisguise: ['隐藏实力', '被人挑衅', '局部暴露', '全面碾压'],
    regretChasing: ['轻视冷落', '失去预警', '疯狂追悔', '为时已晚']
  };
  
  static apply(chainType: string, chapters: Chapter[]): Chapter[] {
    const chain = this.chains[chainType];
    // 将情绪节点分配到各章节
    return chapters.map((chapter, index) => ({
      ...chapter,
      emotionNode: chain[index % chain.length]
    }));
  }
}
```

---

## 8. 接口设计

```typescript
interface INarrativeEngineAgent {
  // 四象定锚
  setFourAnchors(outline: StoryOutline): FourAnchors;
  
  // 构建骨架
  buildSkeleton(anchors: FourAnchors, targetLength: number): ThreeActStructure;
  
  // 写作章节
  writeChapter(chapter: Chapter, anchors: FourAnchors): string;
  
  // 精修文本
  refine(text: string): string;
  
  // 生成完整故事
  generate(outline: StoryOutline): NarrativeResult;
}
```

---

**文档版本**: v1.0
**创建日期**: 2026-03-17
