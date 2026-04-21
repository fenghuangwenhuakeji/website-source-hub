# 架构设计文档 - Batch Agent Creator

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档版本 | v1.0.0 |
| 创建日期 | 2026-03-18 |
| 最后更新 | 2026-03-18 |
| 文档状态 | 初始版本 |
| 作者 | AI Assistant |

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                   Batch Agent Creator                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   配置解析    │  │   模板引擎    │  │   文档生成    │      │
│  │   Module     │→ │   Module     │→ │   Module     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  JSON解析器   │  │  Skill模板   │  │  文件写入    │      │
│  │  YAML解析器   │  │  Debug模板   │  │  目录管理    │      │
│  │  CSV解析器    │  │  Plan模板    │  │  报告生成    │      │
│  │  MD解析器     │  │  Spec模板    │  │  索引生成    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐                        │
│  │  变量系统    │  │  质量检查    │                        │
│  │  条件系统    │  │  重复检测    │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## 数据模型

### AgentConfig Agent配置
```typescript
interface AgentConfig {
  name: string;                    // Agent名称（kebab-case）
  type: 'skill' | 'debug' | 'plan' | 'spec' | 'custom';
  title: string;                   // 中文标题
  description: string;             // 描述
  core_concept: string;            // 核心理念
  features: string[];              // 功能列表
  priority: 'high' | 'medium' | 'low';
  template?: string;               // 指定模板
  overrides?: DocumentOverrides;   // 文档覆盖
}
```

### BatchConfig 批量配置
```typescript
interface BatchConfig {
  batch_name: string;              // 批次名称
  output_dir: string;              // 输出目录
  template_dir?: string;           // 模板目录
  variables?: Record<string, any>; // 全局变量
  agents: AgentConfig[];           // Agent列表
  post_process?: string[];         // 后处理操作
}
```

### DocumentTemplate 文档模板
```typescript
interface DocumentTemplate {
  name: string;                    // 模板名称
  type: string;                    // Agent类型
  documents: {
    skill: string;                 // SKILL.md模板
    requirement: string;           // requirement.md模板
    design: string;                // design.md模板
    tasks: string;                 // tasks.md模板
    checklist: string;             // checklist.md模板
  };
  variables: string[];             // 所需变量
}
```

### GenerationReport 生成报告
```typescript
interface GenerationReport {
  batch_name: string;
  total_agents: number;
  successful: number;
  failed: number;
  agents: AgentResult[];
  duration: number;
  timestamp: string;
}
```

## 核心流程

### 1. 批量生成流程
```
读取配置 → 解析配置 → 验证配置 → 循环生成 → 质量检查 → 生成报告
```

### 2. 单个Agent生成流程
```
选择模板 → 变量填充 → 内容生成 → 文档写入 → 验证检查
```

### 3. 配置解析流程
```
读取文件 → 格式识别 → 内容解析 → 结构验证 → 配置对象
```

## 接口设计

### parseConfig(configPath: string): BatchConfig
解析配置文件

### generateAgent(config: AgentConfig): AgentResult
生成单个Agent

### generateBatch(batchConfig: BatchConfig): GenerationReport
批量生成Agent

### validateConfig(config: BatchConfig): ValidationResult
验证配置有效性

### generateReport(results: AgentResult[]): GenerationReport
生成批量报告

## 关键技术决策

1. **模板引擎**: 使用简单的字符串替换+条件渲染
2. **配置格式**: 优先支持JSON和YAML
3. **文件操作**: 同步写入确保顺序
4. **错误处理**: 继续生成其他Agent，收集错误
5. **命名规范**: 自动转换kebab-case

## 模板变量系统

### 内置变量
```typescript
const BuiltInVariables = {
  '{{name}}': 'Agent名称',
  '{{title}}': '中文标题',
  '{{description}}': '描述',
  '{{core_concept}}': '核心理念',
  '{{date}}': '当前日期',
  '{{time}}': '当前时间',
  '{{author}}': '作者（默认AI Assistant）'
};
```

### 条件语法
```
{{#if condition}}
  内容
{{/if}}

{{#each features}}
  - {{this}}
{{/each}}
```

## 模板库结构

```
templates/
├── skill-agent/
│   ├── SKILL.md.template
│   ├── requirement.md.template
│   ├── design.md.template
│   ├── tasks.md.template
│   └── checklist.md.template
├── debug-agent/
│   └── ...
├── plan-agent/
│   └── ...
└── spec-agent/
    └── ...
```
