# Outline Agent - 架构设计文档

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
│                    Outline Agent                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ 三界定锚 │  │ 细纲生成 │  │ 情绪设计 │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│       │             │             │                     │
│       └─────────────┼─────────────┘                     │
│                     ▼                                   │
│  ┌─────────────────────────────────────┐               │
│  │           细纲引擎                   │               │
│  └─────────────────────────────────────┘               │
│                     │                                   │
│       ┌─────────────┼─────────────┐                     │
│       ▼             ▼             ▼                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │ 爽点布局 │ │ 节奏控制 │ │ 输出格式化│              │
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
  genre: string;
  targetLength: number;
  mainCharacters: Character[];
  theme: string;
}

// 角色定义
interface Character {
  id: string;
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting';
  bazi: BaziAnalysis;
  tarot: TarotAnalysis;
  mbti: MBTIType;
  matrix: CharacterMatrix;
}

// 三界分析
interface ThreeRealmAnalysis {
  character: Character;
  bazi: BaziAnalysis;
  tarot: TarotAnalysis;
  mbti: MBTIType;
  fusion: CharacterMatrix;
}

// 细纲
interface DetailedOutline {
  id: string;
  chapters: ChapterOutline[];
  characterMatrices: Map<string, CharacterMatrix>;
  emotionArc: EmotionArc;
  climaxPoints: ClimaxPoint[];
}

// 章节细纲
interface ChapterOutline {
  number: number;
  title: string;
  coreEvent: string;
  emotionChain: string[];
  climaxPoint?: ClimaxPoint;
  characterInteractions: CharacterInteraction[];
  foreshadowing: string[];
  hooks: string[];
  scenes: Scene[];
}

// 角色互动
interface CharacterInteraction {
  characterId: string;
  action: string;
  motivation: string;
  reaction: string;
  change: string;
}

// 爽点
interface ClimaxPoint {
  chapter: number;
  type: 'faceSlap' | 'comeback' | 'twist' | 'reveal' | 'emotional';
  description: string;
  intensity: number; // 1-10
}

// 情绪弧线
interface EmotionArc {
  chainType: string;
  nodes: EmotionNode[];
}

interface EmotionNode {
  chapter: number;
  emotion: string;
  intensity: number;
}
```

---

## 3. 核心流程

```
故事梗概 → 三界定锚 → 细纲生成 → 情绪设计 → 爽点布局 → 节奏控制 → 输出
```

---

## 4. 三界定锚引擎

```typescript
interface IThreeRealmEngine {
  // 分析角色八字
  analyzeBazi(character: Character): BaziAnalysis;
  
  // 分析角色塔罗
  analyzeTarot(character: Character): TarotAnalysis;
  
  // 分析角色MBTI
  analyzeMBTI(character: Character): MBTIType;
  
  // 融合三界分析
  fuseThreeRealms(
    bazi: BaziAnalysis,
    tarot: TarotAnalysis,
    mbti: MBTIType
  ): CharacterMatrix;
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
  
  // 生成角色动机
  generateMotivation(): string {
    // 基于三界分析生成动机
    return `基于${this.cognition.dominant}功能的动机`;
  }
}
```

---

## 5. 细纲生成引擎

```typescript
interface IOutlineEngine {
  // 生成20章框架
  generate20ChapterFramework(outline: StoryOutline): ChapterOutline[];
  
  // 填充章节要素
  fillChapterElements(
    chapter: ChapterOutline,
    characters: Character[],
    phase: OutlinePhase
  ): ChapterOutline;
  
  // 确保情节连贯
  ensureCoherence(chapters: ChapterOutline[]): ChapterOutline[];
}

// 细纲阶段
enum OutlinePhase {
  OPENING = 'opening',      // 第1-3章
  DEVELOPMENT = 'development', // 第4-7章
  RISING = 'rising',        // 第8-12章
  CLIMAX = 'climax',        // 第13-16章
  RESOLUTION = 'resolution' // 第17-20章
}

// 细纲生成实现
class OutlineEngine implements IOutlineEngine {
  generate20ChapterFramework(outline: StoryOutline): ChapterOutline[] {
    const chapters: ChapterOutline[] = [];
    
    for (let i = 1; i <= 20; i++) {
      const phase = this.determinePhase(i);
      chapters.push({
        number: i,
        title: `第${i}章`,
        coreEvent: '',
        emotionChain: [],
        characterInteractions: [],
        foreshadowing: [],
        hooks: [],
        scenes: []
      });
    }
    
    return chapters;
  }
  
  private determinePhase(chapterNum: number): OutlinePhase {
    if (chapterNum <= 3) return OutlinePhase.OPENING;
    if (chapterNum <= 7) return OutlinePhase.DEVELOPMENT;
    if (chapterNum <= 12) return OutlinePhase.RISING;
    if (chapterNum <= 16) return OutlinePhase.CLIMAX;
    return OutlinePhase.RESOLUTION;
  }
}
```

---

## 6. 情绪设计引擎

```typescript
interface IEmotionEngine {
  // 选择情绪链条
  selectEmotionChain(genre: string, theme: string): string;
  
  // 布局情绪节点
  layoutEmotionNodes(
    chainType: string,
    chapters: ChapterOutline[]
  ): EmotionArc;
  
  // 控制情绪强度
  controlIntensity(nodes: EmotionNode[]): EmotionNode[];
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
  
  static select(genre: string): string {
    switch(genre) {
      case '虐文': return 'despairPeeling';
      case '爽文': return 'iqCrushing';
      case '悬疑': return 'horrorValley';
      case '反转': return 'tigerInDisguise';
      case '后悔': return 'regretChasing';
      default: return 'iqCrushing';
    }
  }
}
```

---

## 7. 爽点布局引擎

```typescript
interface IClimaxEngine {
  // 设计爽点
  designClimaxPoints(
    chapters: ChapterOutline[],
    emotionArc: EmotionArc
  ): ClimaxPoint[];
  
  // 布局爽点频率
  layoutClimaxFrequency(points: ClimaxPoint[]): ClimaxPoint[];
  
  // 匹配爽点与情绪
  matchClimaxWithEmotion(
    points: ClimaxPoint[],
    nodes: EmotionNode[]
  ): void;
}

// 爽点类型
enum ClimaxType {
  FACE_SLAP = 'faceSlap',     // 打脸
  COMEBACK = 'comeback',      // 逆袭
  TWIST = 'twist',            // 反转
  REVEAL = 'reveal',          // 揭秘
  EMOTIONAL = 'emotional'     // 情感
}

// 爽点布局规则
class ClimaxRules {
  // 小爽点: 每3-5章
  static SMALL_INTERVAL = [3, 4, 5];
  
  // 大爽点: 每10章
  static BIG_INTERVAL = 10;
  
  // 高潮章节
  static CLIMAX_CHAPTERS = [13, 14, 15, 16];
  
  static layout(chapters: ChapterOutline[]): ClimaxPoint[] {
    const points: ClimaxPoint[] = [];
    
    // 布局小爽点
    for (let i = 3; i <= 20; i += 4) {
      points.push({
        chapter: i,
        type: ClimaxType.FACE_SLAP,
        description: `第${i}章小爽点`,
        intensity: 5
      });
    }
    
    // 布局大爽点
    points.push({
      chapter: 10,
      type: ClimaxType.COMEBACK,
      description: '第10章大爽点',
      intensity: 8
    });
    
    // 布局高潮爽点
    for (const ch of this.CLIMAX_CHAPTERS) {
      points.push({
        chapter: ch,
        type: ClimaxType.TWIST,
        description: `第${ch}章高潮爽点`,
        intensity: 10
      });
    }
    
    return points;
  }
}
```

---

## 8. 接口设计

```typescript
interface IOutlineAgent {
  // 三界定锚
  setThreeRealmAnchors(outline: StoryOutline): Map<string, CharacterMatrix>;
  
  // 生成细纲
  generateOutline(
    outline: StoryOutline,
    matrices: Map<string, CharacterMatrix>
  ): DetailedOutline;
  
  // 设计情绪
  designEmotion(outline: DetailedOutline): EmotionArc;
  
  // 布局爽点
  layoutClimax(outline: DetailedOutline): ClimaxPoint[];
  
  // 导出细纲
  export(outline: DetailedOutline, format: string): string;
}
```

---

**文档版本**: v1.0
**创建日期**: 2026-03-17
