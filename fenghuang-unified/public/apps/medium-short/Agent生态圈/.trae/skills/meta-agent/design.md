# Meta-Agent 架构设计文档

## 1. 架构概述

### 1.1 设计哲学

Meta-Agent的架构设计遵循"**天道无为而无不为**"的哲学思想：
- **无为** - 不直接干预具体任务的执行
- **无不为** - 通过制定规则和协调机制，让一切自然有序地运行

### 1.2 架构原则

1. **分层治理** - 不同层级负责不同粒度的决策
2. **插件化扩展** - 支持动态添加新的Agent和能力
3. **事件驱动** - 通过事件机制实现松耦合协作
4. **状态共享** - 全局状态管理确保信息一致性
5. **规则优先** - 通过规则引擎实现可配置的治理

### 1.3 架构全景图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Meta-Agent 天道中枢                             │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   洞察层     │  │   法则层     │  │   调度层     │  │   审判层     │    │
│  │  (Insight)  │  │   (Law)     │  │ (Dispatch)  │  │(Judgement)  │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
│         │                │                │                │           │
│         └────────────────┴────────────────┴────────────────┘           │
│                                     │                                   │
│                              ┌──────▼──────┐                           │
│                              │  协调中枢    │                           │
│                              │(Coordination)│                           │
│                              └──────┬──────┘                           │
│                                     │                                   │
│  ┌──────────────────────────────────┼──────────────────────────────────┐│
│  │                          执行层    │                                  ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────▼──────┐ ┌──────────┐ ┌──────────┐││
│  │  │plan-agent│ │spec-agent│ │ rust-agent  │ │react-agent│ │debug-agent│││
│  │  └──────────┘ └──────────┘ └─────────────┘ └──────────┘ └──────────┘││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  ││
│  │  │py-agent  │ │vue-agent │ │go-agent  │ │java-agent│ │...       │  ││
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  ││
│  └────────────────────────────────────────────────────────────────────┘│
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────────┐│
│  │                          基础设施层                                  ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  ││
│  │  │ 规则引擎  │ │ 状态管理  │ │ 事件总线  │ │ 知识图谱  │ │ 日志监控  │  ││
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  ││
│  └────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

## 2. 核心模块设计

### 2.1 洞察层 (Insight Layer)

#### 2.1.1 职责
- 深度理解用户需求的本质
- 评估任务复杂度和风险
- 识别隐含需求和约束

#### 2.1.2 核心组件

```rust
/// 需求洞察引擎
pub struct InsightEngine {
    nlp_processor: NLPProcessor,
    complexity_analyzer: ComplexityAnalyzer,
    risk_assessor: RiskAssessor,
    context_extractor: ContextExtractor,
}

impl InsightEngine {
    /// 分析用户需求
    pub async fn analyze(&self, request: UserRequest) -> InsightReport {
        // 语义理解
        let semantics = self.nlp_processor.process(&request.description).await;
        
        // 复杂度评估
        let complexity = self.complexity_analyzer.evaluate(&semantics);
        
        // 风险评估
        let risks = self.risk_assessor.assess(&semantics, &complexity);
        
        // 上下文提取
        let context = self.context_extractor.extract(&request);
        
        InsightReport {
            semantics,
            complexity,
            risks,
            context,
        }
    }
}

/// 洞察报告
pub struct InsightReport {
    /// 语义分析结果
    pub semantics: SemanticAnalysis,
    /// 复杂度评估
    pub complexity: ComplexityLevel,
    /// 风险列表
    pub risks: Vec<Risk>,
    /// 上下文信息
    pub context: ContextInfo,
}

/// 复杂度级别
pub enum ComplexityLevel {
    Simple,      // 简单任务，单Agent可完成
    Moderate,    // 中等复杂度，2-3个Agent协作
    Complex,     // 复杂任务，4-6个Agent协作
    Extreme,     // 极复杂任务，全体系动员
}
```

### 2.2 法则层 (Law Layer)

#### 2.2.1 职责
- 制定架构原则和设计标准
- 定义质量标准和验收准则
- 建立协作协议和通信规范

#### 2.2.2 核心组件

```rust
/// 法则引擎
pub struct LawEngine {
    rule_repository: RuleRepository,
    standard_library: StandardLibrary,
    protocol_registry: ProtocolRegistry,
}

impl LawEngine {
    /// 为项目制定法则
    pub fn formulate_laws(&self, insight: &InsightReport) -> LawSet {
        LawSet {
            architecture_principles: self.define_architecture_principles(insight),
            quality_standards: self.define_quality_standards(insight),
            collaboration_protocol: self.define_collaboration_protocol(insight),
            governance_rules: self.define_governance_rules(insight),
        }
    }

    /// 定义架构原则
    fn define_architecture_principles(&self, insight: &InsightReport) -> Vec<ArchitecturePrinciple> {
        vec![
            ArchitecturePrinciple::SeparationOfConcerns,
            ArchitecturePrinciple::SingleResponsibility,
            ArchitecturePrinciple::DependencyInversion,
            // 根据项目特性动态添加
        ]
    }
}

/// 法则集合
pub struct LawSet {
    /// 架构原则
    pub architecture_principles: Vec<ArchitecturePrinciple>,
    /// 质量标准
    pub quality_standards: QualityStandards,
    /// 协作协议
    pub collaboration_protocol: CollaborationProtocol,
    /// 治理规则
    pub governance_rules: Vec<GovernanceRule>,
}

/// 架构原则
pub enum ArchitecturePrinciple {
    SeparationOfConcerns,  // 关注点分离
    SingleResponsibility,  // 单一职责
    DependencyInversion,   // 依赖倒置
    InterfaceSegregation,  // 接口隔离
    OpenClosed,           // 开闭原则
    DomainDriven,         // 领域驱动
    Microservices,        // 微服务
    EventDriven,          // 事件驱动
}
```

### 2.3 调度层 (Dispatch Layer)

#### 2.3.1 职责
- 选择合适的Agent组合
- 制定任务执行计划
- 管理任务依赖和并行

#### 2.3.2 核心组件

```rust
/// 调度引擎
pub struct DispatchEngine {
    agent_registry: AgentRegistry,
    scheduler: Scheduler,
    dependency_resolver: DependencyResolver,
}

impl DispatchEngine {
    /// 生成调度方案
    pub fn create_dispatch_plan(
        &self,
        insight: &InsightReport,
        laws: &LawSet,
    ) -> DispatchPlan {
        // 选择Agent
        let selected_agents = self.select_agents(insight, laws);
        
        // 创建任务
        let tasks = self.create_tasks(&selected_agents, insight);
        
        // 解析依赖
        let dependencies = self.dependency_resolver.resolve(&tasks);
        
        // 生成调度策略
        let schedule = self.scheduler.schedule(&tasks, &dependencies);
        
        DispatchPlan {
            agents: selected_agents,
            tasks,
            dependencies,
            schedule,
        }
    }

    /// 选择Agent
    fn select_agents(
        &self,
        insight: &InsightReport,
        laws: &LawSet,
    ) -> Vec<AgentSelection> {
        let mut selections = Vec::new();
        
        // 根据技术栈选择语言Agent
        for tech in &insight.context.tech_stack {
            if let Some(agent) = self.agent_registry.find_by_tech(tech) {
                selections.push(AgentSelection {
                    agent: agent.clone(),
                    role: AgentRole::Executor,
                    priority: Priority::High,
                });
            }
        }
        
        // 根据复杂度选择规划Agent
        if insight.complexity >= ComplexityLevel::Moderate {
            selections.push(AgentSelection {
                agent: self.agent_registry.get("plan-agent").unwrap().clone(),
                role: AgentRole::Planner,
                priority: Priority::Critical,
            });
        }
        
        // 添加质量保证Agent
        selections.push(AgentSelection {
            agent: self.agent_registry.get("debug-agent").unwrap().clone(),
            role: AgentRole::QualityAssurance,
            priority: Priority::High,
        });
        
        selections
    }
}

/// 调度计划
pub struct DispatchPlan {
    /// 选中的Agent
    pub agents: Vec<AgentSelection>,
    /// 任务列表
    pub tasks: Vec<Task>,
    /// 依赖关系
    pub dependencies: DependencyGraph,
    /// 调度策略
    pub schedule: Schedule,
}

/// Agent选择
pub struct AgentSelection {
    pub agent: AgentInfo,
    pub role: AgentRole,
    pub priority: Priority,
}

/// Agent角色
pub enum AgentRole {
    Planner,           // 规划者
    Designer,          // 设计者
    Executor,          // 执行者
    QualityAssurance,  // 质量保证
    Coordinator,       // 协调者
}
```

### 2.4 审判层 (Judgement Layer)

#### 2.4.1 职责
- 审查Agent输出的质量
- 判定是否符合标准
- 决定接受、返工或改进

#### 2.4.2 核心组件

```rust
/// 审判引擎
pub struct JudgementEngine {
    quality_checker: QualityChecker,
    compliance_verifier: ComplianceVerifier,
    review_reporter: ReviewReporter,
}

impl JudgementEngine {
    /// 执行质量审判
    pub fn judge(&self, deliverable: &Deliverable, laws: &LawSet) -> Judgement {
        // 质量检查
        let quality_report = self.quality_checker.check(deliverable, &laws.quality_standards);
        
        // 合规验证
        let compliance_report = self.compliance_verifier.verify(deliverable, laws);
        
        // 生成审判结果
        let verdict = if quality_report.passed && compliance_report.compliant {
            Verdict::Accepted
        } else if quality_report.critical_issues.is_empty() {
            Verdict::ConditionalAccept {
                improvements: quality_report.minor_issues,
            }
        } else {
            Verdict::Rejected {
                reasons: quality_report.critical_issues,
            }
        };
        
        Judgement {
            verdict,
            quality_report,
            compliance_report,
            timestamp: chrono::Utc::now(),
        }
    }
}

/// 审判结果
pub struct Judgement {
    pub verdict: Verdict,
    pub quality_report: QualityReport,
    pub compliance_report: ComplianceReport,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

/// 裁决
pub enum Verdict {
    Accepted,                    // 完全接受
    ConditionalAccept {         // 有条件接受
        improvements: Vec<Issue>,
    },
    Rejected {                  // 拒绝
        reasons: Vec<Issue>,
    },
}
```

### 2.5 协调中枢 (Coordination Hub)

#### 2.5.1 职责
- 管理全局状态
- 路由事件消息
- 解决Agent冲突

#### 2.5.2 核心组件

```rust
/// 协调中枢
pub struct CoordinationHub {
    state_manager: StateManager,
    event_bus: EventBus,
    conflict_resolver: ConflictResolver,
    message_router: MessageRouter,
}

impl CoordinationHub {
    /// 初始化协调中枢
    pub fn new() -> Self {
        Self {
            state_manager: StateManager::new(),
            event_bus: EventBus::new(),
            conflict_resolver: ConflictResolver::new(),
            message_router: MessageRouter::new(),
        }
    }

    /// 发布事件
    pub fn publish_event(&self, event: AgentEvent) {
        self.event_bus.publish(event);
    }

    /// 订阅事件
    pub fn subscribe<F>(&self, agent_id: &str, handler: F)
    where
        F: Fn(AgentEvent) + Send + Sync + 'static,
    {
        self.event_bus.subscribe(agent_id, handler);
    }

    /// 更新全局状态
    pub fn update_state(&self, key: &str, value: StateValue) {
        self.state_manager.update(key, value);
    }

    /// 获取全局状态
    pub fn get_state(&self, key: &str) -> Option<StateValue> {
        self.state_manager.get(key)
    }

    /// 解决冲突
    pub fn resolve_conflict(&self, conflict: Conflict) -> Resolution {
        self.conflict_resolver.resolve(conflict)
    }
}

/// Agent事件
pub enum AgentEvent {
    TaskStarted { agent_id: String, task_id: String },
    TaskCompleted { agent_id: String, task_id: String, result: TaskResult },
    TaskFailed { agent_id: String, task_id: String, error: String },
    OutputGenerated { agent_id: String, output: Output },
    ResourceRequest { agent_id: String, resource: Resource },
    ConflictDetected { agents: Vec<String>, resource: Resource },
}
```

## 3. 基础设施层

### 3.1 规则引擎 (Rule Engine)

```rust
/// 规则引擎
pub struct RuleEngine {
    rules: Vec<Rule>,
    evaluator: RuleEvaluator,
}

impl RuleEngine {
    /// 评估规则
    pub fn evaluate(&self, context: &RuleContext) -> Vec<RuleResult> {
        self.rules
            .iter()
            .filter(|rule| rule.condition.matches(context))
            .map(|rule| RuleResult {
                rule_id: rule.id.clone(),
                action: rule.action.clone(),
                priority: rule.priority,
            })
            .collect()
    }

    /// 添加规则
    pub fn add_rule(&mut self, rule: Rule) {
        self.rules.push(rule);
        self.rules.sort_by_key(|r| r.priority);
    }
}

/// 规则
pub struct Rule {
    pub id: String,
    pub condition: Condition,
    pub action: Action,
    pub priority: i32,
}
```

### 3.2 状态管理 (State Management)

```rust
/// 状态管理器
pub struct StateManager {
    store: Arc<RwLock<HashMap<String, StateValue>>>,
    subscribers: Arc<RwLock<HashMap<String, Vec<StateSubscriber>>>>,
}

impl StateManager {
    /// 更新状态
    pub fn update(&self, key: &str, value: StateValue) {
        let mut store = self.store.write().unwrap();
        store.insert(key.to_string(), value.clone());
        drop(store);
        
        // 通知订阅者
        self.notify_subscribers(key, &value);
    }

    /// 订阅状态变更
    pub fn subscribe(&self, key: &str, subscriber: StateSubscriber) {
        let mut subscribers = self.subscribers.write().unwrap();
        subscribers
            .entry(key.to_string())
            .or_default()
            .push(subscriber);
    }
}
```

### 3.3 事件总线 (Event Bus)

```rust
/// 事件总线
pub struct EventBus {
    subscribers: Arc<RwLock<HashMap<String, Vec<EventHandler>>>>,
    history: Arc<RwLock<Vec<AgentEvent>>>,
}

impl EventBus {
    /// 发布事件
    pub fn publish(&self, event: AgentEvent) {
        // 保存到历史
        self.history.write().unwrap().push(event.clone());
        
        // 通知订阅者
        let subscribers = self.subscribers.read().unwrap();
        for (agent_id, handlers) in subscribers.iter() {
            for handler in handlers {
                handler(event.clone());
            }
        }
    }

    /// 订阅事件
    pub fn subscribe<F>(&self, agent_id: &str, handler: F)
    where
        F: Fn(AgentEvent) + Send + Sync + 'static,
    {
        let mut subscribers = self.subscribers.write().unwrap();
        subscribers
            .entry(agent_id.to_string())
            .or_default()
            .push(Box::new(handler));
    }
}

type EventHandler = Box<dyn Fn(AgentEvent) + Send + Sync>;
```

### 3.4 知识图谱 (Knowledge Graph)

```rust
/// 知识图谱
pub struct KnowledgeGraph {
    nodes: Vec<KnowledgeNode>,
    edges: Vec<KnowledgeEdge>,
}

impl KnowledgeGraph {
    /// 添加知识节点
    pub fn add_node(&mut self, node: KnowledgeNode) {
        self.nodes.push(node);
    }

    /// 添加知识关系
    pub fn add_edge(&mut self, edge: KnowledgeEdge) {
        self.edges.push(edge);
    }

    /// 查询相关知识
    pub fn query(&self, topic: &str) -> Vec<&KnowledgeNode> {
        self.nodes
            .iter()
            .filter(|n| n.topics.contains(&topic.to_string()))
            .collect()
    }
}

/// 知识节点
pub struct KnowledgeNode {
    pub id: String,
    pub content: String,
    pub topics: Vec<String>,
    pub agent: Option<String>,
}

/// 知识关系
pub struct KnowledgeEdge {
    pub from: String,
    pub to: String,
    pub relation: RelationType,
}

pub enum RelationType {
    DependsOn,
    Extends,
    Implements,
    Uses,
    References,
}
```

## 4. 调度策略实现

### 4.1 串行调度器

```rust
/// 串行调度器
pub struct SerialScheduler;

impl Scheduler for SerialScheduler {
    fn schedule(&self, tasks: &[Task], dependencies: &DependencyGraph) -> Schedule {
        // 拓扑排序确保依赖顺序
        let sorted = dependencies.topological_sort();
        
        Schedule {
            strategy: SchedulingStrategy::Serial,
            phases: sorted.into_iter().map(|task_id| {
                Phase {
                    tasks: vec![task_id],
                    parallel: false,
                }
            }).collect(),
        }
    }
}
```

### 4.2 并行调度器

```rust
/// 并行调度器
pub struct ParallelScheduler;

impl Scheduler for ParallelScheduler {
    fn schedule(&self, tasks: &[Task], dependencies: &DependencyGraph) -> Schedule {
        // 按依赖层级分组
        let levels = dependencies.group_by_level();
        
        Schedule {
            strategy: SchedulingStrategy::Parallel,
            phases: levels.into_iter().map(|level| {
                Phase {
                    tasks: level,
                    parallel: true,
                }
            }).collect(),
        }
    }
}
```

### 4.3 流水线调度器

```rust
/// 流水线调度器
pub struct PipelineScheduler;

impl Scheduler for PipelineScheduler {
    fn schedule(&self, tasks: &[Task], dependencies: &DependencyGraph) -> Schedule {
        // 识别数据流路径
        let pipelines = dependencies.identify_pipelines();
        
        Schedule {
            strategy: SchedulingStrategy::Pipeline,
            phases: pipelines.into_iter().map(|pipeline| {
                Phase {
                    tasks: pipeline,
                    parallel: false, // 流水线内串行，流水线间并行
                }
            }).collect(),
        }
    }
}
```

## 5. 数据流设计

### 5.1 主流程数据流

```
用户请求
    │
    ▼
┌─────────────────┐
│  洞察层         │ ──→ 需求理解、复杂度评估、风险识别
└─────────────────┘
    │
    ▼
┌─────────────────┐
│  法则层         │ ──→ 架构原则、质量标准、协作协议
└─────────────────┘
    │
    ▼
┌─────────────────┐
│  调度层         │ ──→ Agent选择、任务分配、执行计划
└─────────────────┘
    │
    ▼
┌─────────────────┐
│  协调中枢       │ ──→ 状态管理、事件路由、冲突解决
└─────────────────┘
    │
    ▼
┌─────────────────┐
│  执行层         │ ──→ 各Agent执行任务
└─────────────────┘
    │
    ▼
┌─────────────────┐
│  审判层         │ ──→ 质量审查、合规验证、裁决
└─────────────────┘
    │
    ▼
输出结果
```

### 5.2 事件流设计

```
Agent事件
    │
    ▼
┌─────────────────┐
│  事件总线       │ ──→ 事件分发
└─────────────────┘
    │
    ├──→ 状态管理器 ──→ 更新全局状态
    │
    ├──→ 日志系统 ──→ 记录事件历史
    │
    ├──→ 监控告警 ──→ 异常检测
    │
    └──→ 订阅Agent ──→ 通知相关Agent
```

## 6. 扩展点设计

### 6.1 Agent注册接口

```rust
/// Agent注册器
pub trait AgentRegistrar {
    /// 注册Agent
    fn register(&mut self, agent: AgentInfo) -> Result<(), RegistrationError>;
    
    /// 注销Agent
    fn unregister(&mut self, agent_id: &str) -> Result<(), RegistrationError>;
    
    /// 查询Agent
    fn query(&self, criteria: QueryCriteria) -> Vec<AgentInfo>;
}

/// Agent信息
pub struct AgentInfo {
    pub id: String,
    pub name: String,
    pub capabilities: Vec<Capability>,
    pub tech_stack: Vec<String>,
    pub performance_metrics: PerformanceMetrics,
}
```

### 6.2 规则扩展接口

```rust
/// 规则提供者
pub trait RuleProvider {
    /// 提供规则
    fn provide_rules(&self) -> Vec<Rule>;
    
    /// 规则优先级
    fn priority(&self) -> i32;
}

/// 动态规则加载器
pub struct DynamicRuleLoader {
    providers: Vec<Box<dyn RuleProvider>>,
}

impl DynamicRuleLoader {
    pub fn load_rules(&self) -> Vec<Rule> {
        let mut rules = Vec::new();
        for provider in &self.providers {
            rules.extend(provider.provide_rules());
        }
        rules.sort_by_key(|r| r.priority);
        rules
    }
}
```

### 6.3 调度策略扩展

```rust
/// 调度器 trait
pub trait Scheduler: Send + Sync {
    fn schedule(&self, tasks: &[Task], dependencies: &DependencyGraph) -> Schedule;
}

/// 调度器注册表
pub struct SchedulerRegistry {
    schedulers: HashMap<String, Box<dyn Scheduler>>,
}

impl SchedulerRegistry {
    pub fn register(&mut self, name: &str, scheduler: Box<dyn Scheduler>) {
        self.schedulers.insert(name.to_string(), scheduler);
    }
    
    pub fn get(&self, name: &str) -> Option<&dyn Scheduler> {
        self.schedulers.get(name).map(|s| s.as_ref())
    }
}
```

## 7. 错误处理设计

### 7.1 错误类型

```rust
/// Meta-Agent 错误类型
#[derive(Error, Debug)]
pub enum MetaAgentError {
    #[error("Insight error: {0}")]
    Insight(String),
    
    #[error("Dispatch error: {0}")]
    Dispatch(String),
    
    #[error("Coordination error: {0}")]
    Coordination(String),
    
    #[error("Judgement error: {0}")]
    Judgement(String),
    
    #[error("Agent not found: {0}")]
    AgentNotFound(String),
    
    #[error("Rule violation: {0}")]
    RuleViolation(String),
    
    #[error("Conflict unresolved: {0}")]
    ConflictUnresolved(String),
    
    #[error("Timeout: {0}")]
    Timeout(String),
}

pub type MetaAgentResult<T> = Result<T, MetaAgentError>;
```

### 7.2 错误恢复策略

```rust
/// 错误恢复器
pub struct ErrorRecovery;

impl ErrorRecovery {
    /// 尝试恢复
    pub async fn recover(&self, error: &MetaAgentError) -> RecoveryAction {
        match error {
            MetaAgentError::AgentNotFound(agent_id) => {
                // 尝试寻找替代Agent
                RecoveryAction::FindAlternative(agent_id.clone())
            }
            MetaAgentError::ConflictUnresolved(conflict) => {
                // 升级冲突到人工处理
                RecoveryAction::Escalate(conflict.clone())
            }
            MetaAgentError::Timeout(task) => {
                // 重试或调整策略
                RecoveryAction::Retry { task: task.clone(), max_attempts: 3 }
            }
            _ => RecoveryAction::Fail(error.to_string()),
        }
    }
}

/// 恢复动作
pub enum RecoveryAction {
    FindAlternative(String),
    Escalate(String),
    Retry { task: String, max_attempts: u32 },
    Fail(String),
}
```

## 8. 监控与可观测性

### 8.1 指标收集

```rust
/// 指标收集器
pub struct MetricsCollector {
    registry: Registry,
}

impl MetricsCollector {
    /// 记录调度延迟
    pub fn record_dispatch_latency(&self, duration: Duration) {
        // 记录到Prometheus或其他监控系统
    }

    /// 记录Agent执行时间
    pub fn record_agent_execution(&self, agent_id: &str, duration: Duration) {
        // 记录Agent性能指标
    }

    /// 记录冲突次数
    pub fn record_conflict(&self, conflict_type: &str) {
        // 记录冲突统计
    }
}
```

### 8.2 日志系统

```rust
/// 结构化日志
pub struct StructuredLogger;

impl StructuredLogger {
    /// 记录事件
    pub fn log_event(&self, event: &AgentEvent) {
        tracing::info!(
            event_type = ?event.type_name(),
            agent_id = event.agent_id(),
            timestamp = %chrono::Utc::now(),
            "Agent event occurred"
        );
    }

    /// 记录决策
    pub fn log_decision(&self, decision: &DispatchDecision) {
        tracing::info!(
            decision_type = "dispatch",
            selected_agents = ?decision.agents,
            strategy = ?decision.strategy,
            "Dispatch decision made"
        );
    }
}
```

## 9. 安全设计

### 9.1 权限控制

```rust
/// 权限管理器
pub struct PermissionManager {
    roles: HashMap<String, Role>,
    permissions: HashMap<String, Vec<Permission>>,
}

impl PermissionManager {
    /// 检查权限
    pub fn check_permission(&self, agent_id: &str, permission: Permission) -> bool {
        if let Some(role) = self.roles.get(agent_id) {
            role.permissions.contains(&permission)
        } else {
            false
        }
    }
}

/// 权限
pub enum Permission {
    ReadGlobalState,
    WriteGlobalState,
    DispatchTask,
    OverrideDecision,
    ModifyRules,
    AccessSensitiveData,
}
```

### 9.2 审计日志

```rust
/// 审计记录
pub struct AuditRecord {
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub actor: String,
    pub action: String,
    pub resource: String,
    pub result: String,
    pub metadata: HashMap<String, String>,
}

/// 审计日志
pub struct AuditLog {
    records: Vec<AuditRecord>,
}

impl AuditLog {
    /// 记录审计事件
    pub fn record(&mut self, record: AuditRecord) {
        self.records.push(record);
    }

    /// 查询审计记录
    pub fn query(&self, criteria: AuditCriteria) -> Vec<&AuditRecord> {
        self.records
            .iter()
            .filter(|r| criteria.matches(r))
            .collect()
    }
}
```
