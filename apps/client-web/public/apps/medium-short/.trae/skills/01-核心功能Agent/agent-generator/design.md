# Agent Generator - 架构设计文档

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
│                   Agent Generator                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   输入解析    │  │   类型识别    │  │   内容生成    │  │
│  │   引擎       │  │   引擎       │  │   引擎       │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                 │           │
│         └─────────────────┼─────────────────┘           │
│                           ▼                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │              核心生成引擎                         │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐          │   │
│  │  │ 模板库  │ │ 规则库  │ │ 知识库  │          │   │
│  │  └─────────┘ └─────────┘ └─────────┘          │   │
│  └─────────────────────────────────────────────────┘   │
│                           │                             │
│         ┌─────────────────┼─────────────────┐           │
│         ▼                 ▼                 ▼           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   文档组装    │  │   质量检查    │  │   输出格式化  │  │
│  │   引擎       │  │   引擎       │  │   引擎       │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 2. 核心引擎详解

### 2.1 输入解析引擎

```typescript
interface IInputParser {
  // 解析用户输入
  parse(input: string): ParsedInput;
  
  // 提取关键信息
  extractKeywords(input: string): string[];
  
  // 识别语言
  detectLanguage(input: string): 'zh' | 'en';
  
  // 分析复杂度
  analyzeComplexity(input: string): ComplexityLevel;
}

interface ParsedInput {
  rawInput: string;
  keywords: string[];
  language: string;
  complexity: ComplexityLevel;
  industry: string;
  features: string[];
}

type ComplexityLevel = 'simple' | 'medium' | 'complex';
```

### 2.2 类型识别引擎

```typescript
interface ITypeRecognizer {
  // 识别Agent类型
  recognizeType(input: ParsedInput): AgentType;
  
  // 计算类型置信度
  calculateConfidence(input: ParsedInput, type: AgentType): number;
  
  // 处理混合类型
  handleMixedType(input: ParsedInput): AgentType[];
}

enum AgentType {
  SKILL = 'skill',
  DEBUG = 'debug',
  PLAN = 'plan',
  SPEC = 'spec',
  CUSTOM = 'custom'
}

// 类型识别规则
const TypeRecognitionRules = {
  [AgentType.SKILL]: {
    keywords: ['工具', '技能', '编写', '开发', '使用', 'tool', 'skill', 'code', 'develop'],
    patterns: ['如何', '怎么', '怎样', 'how to'],
    weight: 1.0
  },
  [AgentType.DEBUG]: {
    keywords: ['错误', '问题', 'bug', '调试', '排查', 'error', 'debug', 'fix', 'issue'],
    patterns: ['报错', '异常', '崩溃', '失败'],
    weight: 1.0
  },
  [AgentType.PLAN]: {
    keywords: ['计划', '规划', '安排', '管理', 'plan', 'schedule', 'manage', 'organize'],
    patterns: ['时间表', '里程碑', '甘特图', '路线图'],
    weight: 1.0
  },
  [AgentType.SPEC]: {
    keywords: ['需求', '规格', '定义', '设计', 'requirement', 'spec', 'design', 'define'],
    patterns: ['接口', 'API', '模型', 'schema'],
    weight: 1.0
  }
};
```

### 2.3 内容生成引擎

```typescript
interface IContentGenerator {
  // 生成SKILL.md
  generateSkillDoc(config: AgentConfig): string;
  
  // 生成requirement.md
  generateRequirementDoc(config: AgentConfig): string;
  
  // 生成design.md
  generateDesignDoc(config: AgentConfig): string;
  
  // 生成tasks.md
  generateTasksDoc(config: AgentConfig): string;
  
  // 生成checklist.md
  generateChecklistDoc(config: AgentConfig): string;
}

interface AgentConfig {
  name: string;
  type: AgentType;
  description: string;
  coreConcept: string;
  workflow: string[];
  features: Feature[];
  targetUsers: string;
  industry: string;
  complexity: ComplexityLevel;
}

interface Feature {
  id: string;
  name: string;
  description: string;
  priority: 'P0' | 'P1' | 'P2';
}
```

---

## 3. 模板系统

### 3.1 模板库结构

```
templates/
├── common/                    # 通用模板
│   ├── header.md             # 文档头部
│   ├── footer.md             # 文档尾部
│   └── info_table.md         # 文档信息表
│
├── skill/                     # Skill Agent模板
│   ├── skill_header.md
│   ├── workflow.md
│   ├── features.md
│   └── examples.md
│
├── debug/                     # Debug Agent模板
│   ├── debug_header.md
│   ├── diagnostic_flow.md
│   ├── error_patterns.md
│   └── solutions.md
│
├── plan/                      # Plan Agent模板
│   ├── plan_header.md
│   ├── timeline.md
│   ├── milestones.md
│   └── resources.md
│
├── spec/                      # Spec Agent模板
│   ├── spec_header.md
│   ├── requirements_table.md
│   ├── api_design.md
│   └── data_model.md
│
└── custom/                    # Custom Agent模板
    ├── custom_header.md
    └── flexible_sections.md
```

### 3.2 模板继承机制

```typescript
interface ITemplateEngine {
  // 加载基础模板
  loadBaseTemplate(): Template;
  
  // 加载类型特定模板
  loadTypeTemplate(type: AgentType): Template;
  
  // 合并模板
  mergeTemplates(base: Template, specific: Template): Template;
  
  // 填充变量
  fillTemplate(template: Template, data: AgentConfig): string;
}

class TemplateEngine implements ITemplateEngine {
  loadBaseTemplate(): Template {
    return {
      sections: ['header', 'info_table', 'core_concept', 'workflow'],
      variables: ['name', 'description', 'version', 'date']
    };
  }
  
  loadTypeTemplate(type: AgentType): Template {
    const typeTemplates = {
      [AgentType.SKILL]: {
        sections: ['features', 'usage', 'examples', 'best_practices'],
        variables: ['skills', 'tools', 'inputs', 'outputs']
      },
      [AgentType.DEBUG]: {
        sections: ['error_types', 'diagnostic_steps', 'solutions', 'tools'],
        variables: ['error_patterns', 'common_issues', 'fix_strategies']
      },
      [AgentType.PLAN]: {
        sections: ['planning_method', 'timeline', 'milestones', 'resources'],
        variables: ['phases', 'deliverables', 'dependencies', 'risks']
      },
      [AgentType.SPEC]: {
        sections: ['requirements', 'interfaces', 'data_models', 'rules'],
        variables: ['functional_reqs', 'non_functional_reqs', 'apis', 'schemas']
      }
    };
    
    return typeTemplates[type] || typeTemplates[AgentType.CUSTOM];
  }
}
```

---

## 4. 知识库系统

### 4.1 行业知识库

```typescript
interface IKnowledgeBase {
  // 游戏行业
  gaming: IndustryKnowledge;
  
  // 金融行业
  finance: IndustryKnowledge;
  
  // 医疗行业
  healthcare: IndustryKnowledge;
  
  // 教育行业
  education: IndustryKnowledge;
  
  // 电商行业
  ecommerce: IndustryKnowledge;
}

interface IndustryKnowledge {
  terminology: string[];
  bestPractices: string[];
  commonPatterns: Pattern[];
  regulations?: string[];
}

// 游戏行业知识示例
const gamingKnowledge: IndustryKnowledge = {
  terminology: ['精灵', '瓦片', '物理引擎', '碰撞检测', '帧率'],
  bestPractices: ['对象池', '视锥剔除', 'LOD', '纹理图集'],
  commonPatterns: [
    { name: '组件模式', description: '使用组件构建游戏对象' },
    { name: '状态机', description: '管理游戏状态和AI行为' },
    { name: '事件系统', description: '解耦游戏逻辑' }
  ]
};
```

### 4.2 最佳实践库

```typescript
interface IBestPractices {
  // 代码规范
  coding: CodingPractice[];
  
  // 架构设计
  architecture: ArchitecturePractice[];
  
  // 性能优化
  performance: PerformancePractice[];
  
  // 安全规范
  security: SecurityPractice[];
}

const bestPractices: IBestPractices = {
  coding: [
    { rule: '使用类型注解', reason: '提高代码可读性和可维护性' },
    { rule: '遵循命名规范', reason: '统一代码风格' },
    { rule: '编写文档注释', reason: '便于理解和使用' }
  ],
  architecture: [
    { principle: '单一职责', description: '每个模块只做一件事' },
    { principle: '开闭原则', description: '对扩展开放，对修改关闭' },
    { principle: '依赖倒置', description: '依赖抽象而非具体实现' }
  ],
  performance: [
    { tip: '避免过早优化', description: '先实现功能，再优化性能' },
    { tip: '使用对象池', description: '减少频繁创建销毁对象的开销' },
    { tip: '延迟加载', description: '按需加载资源' }
  ],
  security: [
    { rule: '输入验证', description: '验证所有外部输入' },
    { rule: '最小权限', description: '只授予必要的权限' },
    { rule: '敏感信息加密', description: '保护用户隐私数据' }
  ]
};
```

---

## 5. 质量检查系统

### 5.1 检查项定义

```typescript
interface IQualityChecker {
  // 文档完整性检查
  checkCompleteness(documents: AgentDocuments): CompletenessReport;
  
  // 格式规范检查
  checkFormat(documents: AgentDocuments): FormatReport;
  
  // 内容一致性检查
  checkConsistency(documents: AgentDocuments): ConsistencyReport;
  
  // 质量评分
  calculateScore(reports: QualityReports): number;
  
  // 生成改进建议
  generateSuggestions(reports: QualityReports): Suggestion[];
}

interface CompletenessReport {
  missingDocuments: string[];
  missingSections: Map<string, string[]>;
  score: number;
}

interface FormatReport {
  formatErrors: FormatError[];
  score: number;
}

interface ConsistencyReport {
  inconsistencies: Inconsistency[];
  score: number;
}

type QualityReports = {
  completeness: CompletenessReport;
  format: FormatReport;
  consistency: ConsistencyReport;
};
```

### 5.2 评分算法

```typescript
class QualityScorer {
  // 权重配置
  private weights = {
    completeness: 0.4,
    format: 0.3,
    consistency: 0.3
  };
  
  // 计算总分
  calculateTotalScore(reports: QualityReports): number {
    const total = 
      reports.completeness.score * this.weights.completeness +
      reports.format.score * this.weights.format +
      reports.consistency.score * this.weights.consistency;
    
    return Math.round(total * 100) / 100;
  }
  
  // 评级
  getGrade(score: number): string {
    if (score >= 90) return 'A+ (优秀)';
    if (score >= 80) return 'A (良好)';
    if (score >= 70) return 'B (合格)';
    if (score >= 60) return 'C (需改进)';
    return 'D (不合格)';
  }
}
```

---

## 6. 接口设计

### 6.1 核心接口

```typescript
interface IAgentGenerator {
  // 生成完整Agent
  generateAgent(input: string): Promise<AgentPackage>;
  
  // 生成单个文档
  generateDocument(type: DocumentType, config: AgentConfig): Promise<string>;
  
  // 验证Agent质量
  validateAgent(documents: AgentDocuments): QualityReport;
  
  // 获取改进建议
  getSuggestions(documents: AgentDocuments): Suggestion[];
}

interface AgentPackage {
  name: string;
  type: AgentType;
  documents: AgentDocuments;
  quality: QualityReport;
  suggestions: Suggestion[];
}

interface AgentDocuments {
  skill: string;        // SKILL.md内容
  requirement: string;  // requirement.md内容
  design: string;       // design.md内容
  tasks: string;        // tasks.md内容
  checklist: string;    // checklist.md内容
}

type DocumentType = 'skill' | 'requirement' | 'design' | 'tasks' | 'checklist';
```

### 6.2 配置接口

```typescript
interface IGeneratorConfig {
  // 输出语言
  language: 'zh' | 'en' | 'auto';
  
  // 详细程度
  detailLevel: 'brief' | 'standard' | 'detailed';
  
  // 行业领域
  industry?: string;
  
  // 是否包含示例
  includeExamples: boolean;
  
  // 是否进行质量检查
  enableQualityCheck: boolean;
  
  // 模板路径
  templatePath?: string;
}

// 默认配置
const defaultConfig: IGeneratorConfig = {
  language: 'auto',
  detailLevel: 'standard',
  includeExamples: true,
  enableQualityCheck: true
};
```

---

## 7. 扩展机制

### 7.1 插件系统

```typescript
interface IGeneratorPlugin {
  name: string;
  version: string;
  
  // 初始化
  initialize(): void;
  
  // 处理输入
  processInput?(input: ParsedInput): ParsedInput;
  
  // 自定义生成逻辑
  generate?(config: AgentConfig, type: DocumentType): string;
  
  // 后处理
  postProcess?(document: string, type: DocumentType): string;
}

// 插件管理器
class PluginManager {
  private plugins: IGeneratorPlugin[] = [];
  
  register(plugin: IGeneratorPlugin): void {
    plugin.initialize();
    this.plugins.push(plugin);
  }
  
  executeHook(hookName: string, data: any): any {
    for (const plugin of this.plugins) {
      if (plugin[hookName]) {
        data = plugin[hookName](data);
      }
    }
    return data;
  }
}
```

### 7.2 自定义模板

```typescript
interface ICustomTemplate {
  name: string;
  baseType: AgentType;
  sections: TemplateSection[];
  variables: TemplateVariable[];
}

interface TemplateSection {
  id: string;
  title: string;
  content: string;
  required: boolean;
}

interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  default?: any;
  description: string;
}
```

---

**文档版本**: v1.0
**创建日期**: 2026-03-17
