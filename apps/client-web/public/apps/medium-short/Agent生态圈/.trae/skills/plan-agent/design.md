# Plan Agent - 架构设计文档

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档版本 | v1.0.0 |
| 创建日期 | 2026-03-17 |
| 最后更新 | 2026-03-17 |
| 文档状态 | 初始版本 |

---

## 1. 系统架构概览

### 1.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                      Plan Agent                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  需求收集   │  │  项目分析   │  │  报告输出   │             │
│  │ (Collector) │  │  (Analyzer) │  │  (Reporter) │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                     │
│         └────────────────┼────────────────┘                     │
│                          ▼                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    核心规划引擎                             │  │
│  │                  (Planning Engine)                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                          │                                      │
│         ┌────────────────┼────────────────┐                     │
│         ▼                ▼                ▼                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  任务分解器  │  │  时间规划器  │  │  资源分配器  │             │
│  │  (Decomposer)│  │  (Scheduler) │  │  (Allocator) │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐                              │
│  │  风险评估器  │  │  模板管理器  │                              │
│  │  (RiskAnalyzer)│  │  (TemplateManager)│                        │
│  └─────────────┘  └─────────────┘                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 核心组件说明

| 组件 | 职责 | 关键接口 |
|------|------|----------|
| 需求收集器 | 收集项目基本信息和需求 | `collect_project_info()` |
| 项目分析器 | 分析项目类型、规模、复杂度 | `analyze_project()` |
| 核心规划引擎 | 协调各模块生成完整计划 | `generate_plan()` |
| 任务分解器 | 生成WBS和工作包 | `decompose_tasks()` |
| 时间规划器 | 生成时间表和关键路径 | `schedule_tasks()` |
| 资源分配器 | 分配人力和技术资源 | `allocate_resources()` |
| 风险评估器 | 识别和评估项目风险 | `analyze_risks()` |
| 模板管理器 | 管理项目模板和最佳实践 | `get_template()` |
| 报告输出器 | 生成各类规划文档 | `generate_report()` |

---

## 2. 数据模型设计

### 2.1 项目信息模型

```typescript
// 项目信息数据结构
interface ProjectInfo {
  // 基本信息
  id: string;                      // 项目唯一标识
  name: string;                    // 项目名称
  description: string;             // 项目描述
  type: ProjectType;              // 项目类型
  
  // 目标与范围
  objectives: ProjectObjective[];  // 项目目标
  scope: ProjectScope;            // 项目范围
  deliverables: Deliverable[];    // 交付物
  
  // 约束条件
  constraints: ProjectConstraints; // 约束条件
  
  // 团队信息
  team: TeamInfo;                 // 团队信息
  
  // 方法与工具
  methodology: Methodology;       // 开发方法
  tools: Tool[];                  // 工具链
  
  // 元数据
  createdAt: Date;
  updatedAt: Date;
  version: string;
}

// 项目类型
interface ProjectType {
  category: 'software' | 'product' | 'research' | 'consulting' | 'marketing';
  subType: string;                // 子类型
  domain: string;                 // 领域
}

// 项目目标
interface ProjectObjective {
  id: string;
  description: string;
  type: 'functional' | 'technical' | 'business';
  priority: 'high' | 'medium' | 'low';
  criteria: string[];             // 验收标准
}

// 项目范围
interface ProjectScope {
  included: string[];             // 包含内容
  excluded: string[];             // 不包含内容
  assumptions: string[];          // 假设条件
  dependencies: string[];         // 外部依赖
}

// 交付物
interface Deliverable {
  id: string;
  name: string;
  description: string;
  type: 'document' | 'code' | 'design' | 'prototype' | 'report';
  deadline: Date;
  owner: string;
}

// 约束条件
interface ProjectConstraints {
  timeline: {
    startDate: Date;
    endDate: Date;
    milestones: Milestone[];
  };
  budget: {
    total: number;
    currency: string;
    breakdown: BudgetItem[];
  };
  resources: ResourceConstraint[];
}

// 里程碑
interface Milestone {
  id: string;
  name: string;
  date: Date;
  deliverables: string[];
  criteria: string[];
}

// 团队信息
interface TeamInfo {
  size: number;
  roles: TeamRole[];
  skills: string[];
  experience: 'junior' | 'mid' | 'senior' | 'expert';
  availability: number;           // 可用时间百分比
}

// 团队角色
interface TeamRole {
  role: string;
  count: number;
  skills: string[];
  responsibilities: string[];
}

// 开发方法
interface Methodology {
  type: 'waterfall' | 'agile' | 'scrum' | 'kanban' | 'hybrid';
  iterations?: number;            // 迭代次数
  sprintLength?: number;          // Sprint长度（天）
  ceremonies: string[];           // 仪式活动
}
```

### 2.2 任务分解模型

```typescript
// 工作分解结构
interface WorkBreakdownStructure {
  projectId: string;
  tasks: Task[];
  dependencies: TaskDependency[];
  criticalPath: string[];         // 关键路径任务ID
}

// 任务
interface Task {
  id: string;
  name: string;
  description: string;
  type: 'phase' | 'work_package' | 'activity' | 'task';
  level: number;                  // WBS层级
  parentId?: string;              // 父任务ID
  
  // 工作量
  effort: {
    optimistic: number;           // 乐观估算
    mostLikely: number;           // 最可能估算
    pessimistic: number;          // 悲观估算
    calculated: number;           // 计算值（PERT）
  };
  
  // 时间安排
  schedule: {
    startDate: Date;
    endDate: Date;
    duration: number;             // 工期（天）
    float: number;                // 浮动时间
  };
  
  // 资源
  resources: ResourceAssignment[];
  
  // 状态
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'not_started' | 'in_progress' | 'completed';
  
  // 敏捷相关
  story?: UserStory;
  storyPoints?: number;
  sprint?: string;
}

// 任务依赖
interface TaskDependency {
  from: string;                   // 前置任务
  to: string;                     // 后置任务
  type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
  lag: number;                    // 延迟（天）
}

// 用户故事（敏捷）
interface UserStory {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  priority: number;
  storyPoints: number;
  epic?: string;
}

// 资源分配
interface ResourceAssignment {
  resourceId: string;
  resourceType: 'human' | 'tool' | 'service';
  allocation: number;             // 分配比例（0-1）
  startDate: Date;
  endDate: Date;
}
```

### 2.3 规划结果模型

```typescript
// 规划结果
interface PlanningResult {
  projectId: string;
  version: string;
  generatedAt: Date;
  
  // 规划内容
  wbs: WorkBreakdownStructure;
  schedule: ProjectSchedule;
  resourcePlan: ResourcePlan;
  riskAssessment: RiskAssessment;
  
  // 汇总信息
  summary: PlanningSummary;
  
  // 报告
  reports: PlanningReport[];
}

// 项目时间表
interface ProjectSchedule {
  startDate: Date;
  endDate: Date;
  duration: number;               // 总工期（天）
  milestones: Milestone[];
  phases: ProjectPhase[];
  ganttData: GanttItem[];
}

// 项目阶段
interface ProjectPhase {
  id: string;
  name: string;
  order: number;
  startDate: Date;
  endDate: Date;
  tasks: string[];                // 任务ID列表
  deliverables: string[];
}

// 甘特图数据
interface GanttItem {
  taskId: string;
  taskName: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  dependencies: string[];
  resources: string[];
}

// 资源计划
interface ResourcePlan {
  humanResources: HumanResource[];
  technicalResources: TechnicalResource[];
  budget: BudgetPlan;
  utilization: ResourceUtilization[];
}

// 人力资源
interface HumanResource {
  id: string;
  role: string;
  name?: string;
  skills: string[];
  availability: number;
  costPerDay: number;
  assignments: ResourceAssignment[];
}

// 技术资源
interface TechnicalResource {
  id: string;
  name: string;
  type: 'tool' | 'platform' | 'service' | 'infrastructure';
  cost: {
    type: 'fixed' | 'subscription' | 'usage';
    amount: number;
    period?: string;
  };
}

// 预算计划
interface BudgetPlan {
  total: number;
  breakdown: BudgetCategory[];
  contingency: number;            // 应急储备
}

// 预算分类
interface BudgetCategory {
  category: string;
  amount: number;
  items: BudgetItem[];
}

// 风险评估
interface RiskAssessment {
  risks: Risk[];
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  mitigationStrategies: MitigationStrategy[];
}

// 风险
interface Risk {
  id: string;
  description: string;
  category: 'technical' | 'management' | 'external' | 'business';
  probability: number;            // 概率（0-1）
  impact: number;                 // 影响（0-1）
  riskScore: number;              // 风险分值
  owner: string;
  status: 'identified' | 'analyzing' | 'mitigating' | 'resolved';
  mitigationPlan?: string;
  contingencyPlan?: string;
}

// 规划汇总
interface PlanningSummary {
  totalTasks: number;
  totalDuration: number;
  totalEffort: number;            // 人天
  teamSize: number;
  criticalPathLength: number;
  riskCount: number;
  highRiskCount: number;
}

// 规划报告
interface PlanningReport {
  type: 'project_plan' | 'roadmap' | 'wbs' | 'schedule' | 'risk_register';
  format: 'markdown' | 'pdf' | 'excel' | 'json';
  content: string;
  generatedAt: Date;
}
```

---

## 3. 核心算法设计

### 3.1 PERT估算算法

```typescript
// PERT三点估算
function calculatePERT(
  optimistic: number,      // 乐观时间
  mostLikely: number,      // 最可能时间
  pessimistic: number      // 悲观时间
): number {
  // PERT公式: (O + 4M + P) / 6
  return (optimistic + 4 * mostLikely + pessimistic) / 6;
}

// 估算标准差
function calculateStandardDeviation(
  optimistic: number,
  pessimistic: number
): number {
  // 标准差: (P - O) / 6
  return (pessimistic - optimistic) / 6;
}

// 计算任务工期
function calculateTaskDuration(task: Task): number {
  const pert = calculatePERT(
    task.effort.optimistic,
    task.effort.mostLikely,
    task.effort.pessimistic
  );
  
  // 考虑资源分配
  const resourceFactor = calculateResourceFactor(task.resources);
  
  // 考虑风险缓冲
  const riskBuffer = calculateRiskBuffer(task);
  
  return pert * resourceFactor + riskBuffer;
}
```

### 3.2 关键路径算法

```typescript
// 计算关键路径
function calculateCriticalPath(wbs: WorkBreakdownStructure): string[] {
  const tasks = new Map(wbs.tasks.map(t => [t.id, t]));
  const dependencies = buildDependencyGraph(wbs.dependencies);
  
  // 前向传递 - 计算最早开始/结束时间
  const earlyTimes = forwardPass(tasks, dependencies);
  
  // 后向传递 - 计算最晚开始/结束时间
  const lateTimes = backwardPass(tasks, dependencies);
  
  // 计算浮动时间并识别关键路径
  const criticalPath: string[] = [];
  
  for (const [taskId, task] of tasks) {
    const float = lateTimes.get(taskId)!.start - earlyTimes.get(taskId)!.start;
    task.schedule.float = float;
    
    if (float === 0) {
      criticalPath.push(taskId);
    }
  }
  
  return criticalPath;
}

// 前向传递
function forwardPass(
  tasks: Map<string, Task>,
  dependencies: Map<string, string[]>
): Map<string, { start: number; end: number }> {
  const times = new Map<string, { start: number; end: number }>();
  const visited = new Set<string>();
  
  function visit(taskId: string): { start: number; end: number } {
    if (visited.has(taskId)) {
      return times.get(taskId)!;
    }
    
    const task = tasks.get(taskId)!;
    const predecessors = dependencies.get(taskId) || [];
    
    let earliestStart = 0;
    for (const predId of predecessors) {
      const predTime = visit(predId);
      earliestStart = Math.max(earliestStart, predTime.end);
    }
    
    const duration = calculateTaskDuration(task);
    const time = {
      start: earliestStart,
      end: earliestStart + duration
    };
    
    times.set(taskId, time);
    visited.add(taskId);
    
    return time;
  }
  
  for (const taskId of tasks.keys()) {
    visit(taskId);
  }
  
  return times;
}
```

### 3.3 资源平衡算法

```typescript
// 资源平衡
function balanceResources(
  schedule: ProjectSchedule,
  resources: HumanResource[]
): ProjectSchedule {
  const balanced = { ...schedule };
  const utilization = calculateResourceUtilization(schedule, resources);
  
  // 识别资源过载
  const overloaded = utilization.filter(u => u.rate > 1.0);
  
  for (const overload of overloaded) {
    // 尝试将任务推迟到资源可用时
    const tasksToMove = findTasksUsingResource(
      schedule,
      overload.resourceId,
      overload.period
    );
    
    for (const task of tasksToMove) {
      if (task.schedule.float > 0) {
        // 利用浮动时间推迟任务
        const delay = Math.min(task.schedule.float, overload.duration);
        task.schedule.startDate = addDays(task.schedule.startDate, delay);
        task.schedule.endDate = addDays(task.schedule.endDate, delay);
      }
    }
  }
  
  return balanced;
}
```

---

## 4. 模块详细设计

### 4.1 任务分解模块

```typescript
interface ITaskDecomposer {
  // 基于项目类型生成WBS模板
  generateWBSTemplate(projectType: ProjectType): WorkBreakdownStructure;
  
  // 分解任务
  decompose(project: ProjectInfo): WorkBreakdownStructure;
  
  // 识别任务依赖
  identifyDependencies(tasks: Task[]): TaskDependency[];
  
  // 估算工作量
  estimateEffort(tasks: Task[]): Task[];
}

// 基于模板的分解
class TemplateBasedDecomposer implements ITaskDecomposer {
  private templates: Map<string, WBSTemplate>;
  
  generateWBSTemplate(projectType: ProjectType): WorkBreakdownStructure {
    const template = this.templates.get(projectType.subType);
    if (!template) {
      return this.generateGenericTemplate();
    }
    return this.instantiateTemplate(template);
  }
  
  decompose(project: ProjectInfo): WorkBreakdownStructure {
    // 1. 获取模板
    const template = this.generateWBSTemplate(project.type);
    
    // 2. 根据项目特点定制
    const customized = this.customizeTemplate(template, project);
    
    // 3. 识别依赖关系
    customized.dependencies = this.identifyDependencies(customized.tasks);
    
    // 4. 估算工作量
    customized.tasks = this.estimateEffort(customized.tasks);
    
    return customized;
  }
}
```

### 4.2 时间规划模块

```typescript
interface IScheduler {
  // 生成项目时间表
  schedule(wbs: WorkBreakdownStructure, constraints: ProjectConstraints): ProjectSchedule;
  
  // 计算关键路径
  calculateCriticalPath(wbs: WorkBreakdownStructure): string[];
  
  // 资源平衡
  balanceResources(schedule: ProjectSchedule, resources: ResourcePlan): ProjectSchedule;
  
  // 生成甘特图数据
  generateGanttData(schedule: ProjectSchedule): GanttItem[];
}

class CriticalPathScheduler implements IScheduler {
  schedule(wbs: WorkBreakdownStructure, constraints: ProjectConstraints): ProjectSchedule {
    // 1. 计算关键路径
    const criticalPath = this.calculateCriticalPath(wbs);
    
    // 2. 确定项目开始时间
    const startDate = constraints.timeline.startDate;
    
    // 3. 计算各任务时间
    const taskTimes = this.calculateTaskTimes(wbs, startDate);
    
    // 4. 生成里程碑
    const milestones = this.generateMilestones(wbs, constraints);
    
    // 5. 组装时间表
    return {
      startDate,
      endDate: this.calculateEndDate(taskTimes),
      duration: this.calculateDuration(startDate, this.calculateEndDate(taskTimes)),
      milestones,
      phases: this.groupIntoPhases(wbs),
      ganttData: this.generateGanttDataFromTimes(taskTimes)
    };
  }
}
```

### 4.3 风险评估模块

```typescript
interface IRiskAnalyzer {
  // 识别风险
  identifyRisks(project: ProjectInfo, wbs: WorkBreakdownStructure): Risk[];
  
  // 评估风险
  assessRisks(risks: Risk[]): Risk[];
  
  // 生成应对策略
  generateMitigationStrategies(risks: Risk[]): MitigationStrategy[];
  
  // 计算整体风险等级
  calculateOverallRisk(risks: Risk[]): RiskLevel;
}

class ComprehensiveRiskAnalyzer implements IRiskAnalyzer {
  identifyRisks(project: ProjectInfo, wbs: WorkBreakdownStructure): Risk[] {
    const risks: Risk[] = [];
    
    // 技术风险
    risks.push(...this.identifyTechnicalRisks(project, wbs));
    
    // 管理风险
    risks.push(...this.identifyManagementRisks(project));
    
    // 外部风险
    risks.push(...this.identifyExternalRisks(project));
    
    // 业务风险
    risks.push(...this.identifyBusinessRisks(project));
    
    return risks;
  }
  
  assessRisks(risks: Risk[]): Risk[] {
    return risks.map(risk => ({
      ...risk,
      riskScore: risk.probability * risk.impact
    })).sort((a, b) => b.riskScore - a.riskScore);
  }
}
```

---

## 5. 模板系统设计

### 5.1 项目模板

```typescript
// 项目模板
interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  type: ProjectType;
  
  // 模板结构
  phases: PhaseTemplate[];
  defaultMethodology: Methodology;
  defaultTeam: TeamRole[];
  defaultTools: Tool[];
  
  // 估算参数
  estimationFactors: {
    complexity: number;
    uncertainty: number;
    reuseFactor: number;
  };
}

// 软件项目模板示例
const webApplicationTemplate: ProjectTemplate = {
  id: 'web-app-standard',
  name: '标准Web应用',
  type: {
    category: 'software',
    subType: 'web-application',
    domain: 'enterprise'
  },
  phases: [
    {
      name: '需求分析',
      order: 1,
      workPackages: ['需求收集', '需求分析', '需求评审']
    },
    {
      name: '设计',
      order: 2,
      workPackages: ['架构设计', 'UI/UX设计', '数据库设计', 'API设计']
    },
    {
      name: '开发',
      order: 3,
      workPackages: ['前端开发', '后端开发', '集成开发']
    },
    {
      name: '测试',
      order: 4,
      workPackages: ['单元测试', '集成测试', '系统测试', 'UAT']
    },
    {
      name: '部署',
      order: 5,
      workPackages: ['环境准备', '部署实施', '上线验证']
    }
  ],
  defaultMethodology: {
    type: 'agile',
    iterations: 6,
    sprintLength: 14,
    ceremonies: ['sprint_planning', 'daily_standup', 'sprint_review', 'retrospective']
  }
};
```

---

## 6. 接口设计

### 6.1 核心API

```typescript
// 主接口
interface IPlanAgent {
  // 创建项目计划
  createPlan(projectInfo: ProjectInfo): Promise<PlanningResult>;
  
  // 快速规划（简化版）
  quickPlan(
    name: string,
    type: ProjectType,
    duration: number,
    teamSize: number
  ): Promise<PlanningResult>;
  
  // 更新计划
  updatePlan(projectId: string, updates: Partial<ProjectInfo>): Promise<PlanningResult>;
  
  // 获取计划
  getPlan(projectId: string): Promise<PlanningResult>;
  
  // 生成报告
  generateReport(
    projectId: string,
    reportType: ReportType,
    format: ExportFormat
  ): Promise<string>;
}

// 报告类型
type ReportType = 
  | 'project_plan' 
  | 'roadmap' 
  | 'wbs' 
  | 'schedule' 
  | 'risk_register' 
  | 'resource_plan';

// 导出格式
type ExportFormat = 'markdown' | 'pdf' | 'excel' | 'json' | 'csv';
```

### 6.2 事件系统

```typescript
enum PlanAgentEventType {
  PROJECT_CREATED = 'project_created',
  PLAN_GENERATED = 'plan_generated',
  TASK_DECOMPOSED = 'task_decomposed',
  SCHEDULE_CALCULATED = 'schedule_calculated',
  RISK_IDENTIFIED = 'risk_identified',
  REPORT_GENERATED = 'report_generated'
}

interface IPlanAgentEventHandler {
  onProjectCreated(project: ProjectInfo): void;
  onPlanGenerated(result: PlanningResult): void;
  onTaskDecomposed(wbs: WorkBreakdownStructure): void;
  onScheduleCalculated(schedule: ProjectSchedule): void;
  onRiskIdentified(risks: Risk[]): void;
  onReportGenerated(report: PlanningReport): void;
}
```

---

## 7. 扩展性设计

### 7.1 插件架构

```typescript
// 插件接口
interface IPlanAgentPlugin {
  name: string;
  version: string;
  type: 'template' | 'estimator' | 'scheduler' | 'reporter';
  
  initialize(context: PluginContext): void;
  execute(input: any): any;
}

// 模板插件
interface ITemplatePlugin extends IPlanAgentPlugin {
  type: 'template';
  getTemplates(): ProjectTemplate[];
  customizeTemplate(template: ProjectTemplate, project: ProjectInfo): ProjectTemplate;
}

// 估算插件
interface IEstimatorPlugin extends IPlanAgentPlugin {
  type: 'estimator';
  estimate(task: Task, context: EstimationContext): number;
}
```

---

## 8. 技术选型

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| 运行时 | TypeScript / Node.js | 类型安全、生态丰富 |
| 数据存储 | JSON / YAML | 简单、易维护 |
| 日期处理 | date-fns | 强大的日期处理库 |
| 图表生成 | Mermaid / PlantUML | 生成甘特图和流程图 |
| 文档生成 | Markdown | 标准格式 |

---

**文档版本**: v1.0
**创建日期**: 2026-03-17
**状态**: 初始版本
**作者**: AI Assistant
